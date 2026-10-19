#!/usr/bin/env python3
"""
把「兵种鉴赏 × DE 对照」里缺少的单位，从 AoE2 DE 本体提取素材。
🔴 [2026-10-19 主人令「全部解析……不能缺少任何单位」]

输入：scratch/out/de_missing_units.json（tools/de-unit-source-types.mjs 生成）
做法：
  1. 读 DE 数据文件 empires2_x2_p1.dat，按单位的官方英文名（strings-en 里 language_dll_name 对应的串）找到单位；
  2. 从单位的待命图找到 SLD 动画族（前缀），取 待命/移动/攻击/死亡 四个动作；
  3. 陆上单位 8 方向，合成方式与 2026-08-19 英雄批量提取完全相同（复用 _scratch_trash_20261015 里的
     aoe2de_unit_convert / sld_extract，hotspot 对齐 + 动态框 + 阴影 + 玩家色遮罩）；
  4. 输出到 public/SUCAI/<目录>/，并写 scratch/out/de_missing_units_extracted.json（单位数值 + 目录，供写入兵种表）。

用法：
  python tools/de-extract-missing-units.py          # 只分析，列出对号结果，不落盘
  python tools/de-extract-missing-units.py --run    # 真提取（已存在 _meta.json 的目录跳过）
"""
import json
import os
import re
import sys
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, '_scratch_trash_20261015'))
from genieutils.datfile import DatFile  # noqa: E402

DAT = r'C:\Program Files (x86)\Steam\steamapps\common\AoE2DE\resources\_common\dat\empires2_x2_p1.dat'
RUN = '--run' in sys.argv
ACTION_RE = re.compile(r'^(.*)_(idle|walk|move|attack|death|decay|run|fire|shoot|die|work|fly|hover)[A-Za-z0-9]*_x\d+$')


def norm(s):
    s = unicodedata.normalize('NFD', str(s or ''))
    s = ''.join(ch for ch in s if unicodedata.category(ch) != 'Mn')
    return re.sub(r'[^a-z0-9]', '', s.lower())


def gid(v):
    if v is None:
        return None
    return v[0] if isinstance(v, (tuple, list)) else v


def main():
    missing = json.load(open(os.path.join(ROOT, 'scratch/out/de_missing_units.json'), encoding='utf-8'))
    en = json.load(open(os.path.join(ROOT, 'public/de-techtree/strings-en.json'), encoding='utf-8'))
    dat = DatFile.parse(DAT)
    graphics = dat.graphics

    # 动画族：前缀 → 动作 → [(file_name, frame_count, angle_count)]
    prefix_map = {}
    for g in graphics:
        if g is None:
            continue
        fn = getattr(g, 'file_name', '') or ''
        if 'shadow' in fn:
            continue
        m = ACTION_RE.match(fn)
        if not m:
            continue
        prefix_map.setdefault(m.group(1), {}).setdefault(m.group(2), []).append(
            (fn, getattr(g, 'frame_count', 0), getattr(g, 'angle_count', 0)))

    # 英文名 → 单位（同名多条时：英雄优先、有待命图优先、id 小优先）
    # 扫全部文明的单位表：同一单位号在不同文明可以叫不同名字（古典文明的 125 号是「Priestess」，中世纪是「Monk」）
    by_name = {}
    by_internal = {}
    seen = set()
    for civ in dat.civs:
        for u in civ.units:
            if u is None:
                continue
            sid = getattr(u, 'language_dll_name', None)
            if (u.id, sid) in seen:
                continue
            seen.add((u.id, sid))
            gi = gid(getattr(u, 'standing_graphic', None))
            if gi is not None and 0 <= gi < len(graphics) and graphics[gi] is not None:
                by_internal.setdefault(norm(getattr(u, 'name', '')), []).append(u)
            name = en.get(str(sid)) if sid is not None else None
            if not name:
                continue
            g = gid(getattr(u, 'standing_graphic', None))
            if g is None or g < 0 or g >= len(graphics) or graphics[g] is None:
                continue
            by_name.setdefault(norm(name), []).append(u)

    def score(u):
        hero = getattr(getattr(u, 'creatable', None), 'hero_mode', 0) or 0
        return (0 if hero else 1, getattr(u, 'id', 10**6))

    rows, unresolved = [], []
    for item in missing:
        if not item.get('name_en'):
            continue
        cands = sorted(by_name.get(norm(item['name_en']), []), key=score)
        if not cands:
            # 「Trade Cart」在 DE 里分「(Full)」「(Empty)」两条：取满载那条
            # 「Horse」「Wild Horse」在 DE 里叫「Horse A」「Wild Horse A」（A~E 是毛色），取 A
            for k in (norm(item['name_en'] + ' (Full)'), norm(item['name_en'] + ' (Moveable)'), norm(item['name_en'] + ' A')):
                cands = sorted(by_name.get(k, []), key=score)
                if cands:
                    break
        if not cands:
            # 「Spy」在 DE 里没有显示名，只有内部名 Spy（dat#138）
            cands = sorted(by_internal.get(norm(item['name_en']), []), key=score)
        if not cands:
            unresolved.append((item['name_en'], 'DE 数据里没有同名单位'))
            continue
        u = cands[0]
        g = graphics[gid(u.standing_graphic)]
        idle_fn = getattr(g, 'file_name', '') or ''
        if idle_fn in ('', 'None'):
            # 待命图没有图文件（尼西待命时是「Nessie (Invisible)」）：改取同名的可见图「Nessie (Visible)」
            base = (getattr(g, 'name', '') or '').split(' (')[0]
            for gg in graphics:
                if gg is not None and (gg.name or '').startswith(base) and (gg.file_name or 'None') != 'None':
                    g = gg
                    idle_fn = gg.file_name
                    break
        if idle_fn in ('', 'None'):
            unresolved.append((item['name_en'], 'DE 里是粒子特效，没有精灵图（如蝴蝶）'))
            continue
        m = ACTION_RE.match(idle_fn)
        prefix = m.group(1) if m else idle_fn.rsplit('_x', 1)[0]
        acts = prefix_map.get(prefix, {})

        def pick(*names):
            for n in names:
                if acts.get(n):
                    return acts[n][0]
            return (None, 0, 0)

        idle = (idle_fn, getattr(g, 'frame_count', 0), getattr(g, 'angle_count', 0))
        walk = pick('walk', 'move', 'run', 'fly', 'hover')
        attack = pick('attack', 'fire', 'shoot', 'work', 'idle')
        death = pick('death', 'die', 'decay', 'idle')
        t50 = getattr(u, 'type_50', None)
        row = {
            'name_en': item['name_en'], 'name_zh': item.get('name_zh', ''), 'from': item['from'],
            'bucket': item.get('bucket'), 'note': item.get('note', ''), 'nonCombat': item.get('nonCombat', False),
            'dat_id': u.id, 'dat_name': getattr(u, 'name', ''), 'class': getattr(u, 'class_', None),
            'type': getattr(u, 'type', None),
            'hero_mode': getattr(getattr(u, 'creatable', None), 'hero_mode', 0) or 0,
            'prefix': prefix, 'angles': idle[2],
            'idle': idle[:2], 'walk': walk[:2], 'attack': attack[:2], 'death': death[:2],
            'hp': getattr(u, 'hit_points', 0),
            'speed': getattr(u, 'speed', 0),
            'atk': getattr(t50, 'displayed_attack', 0) if t50 else 0,
            'meleeArmor': getattr(t50, 'displayed_melee_armour', 0) if t50 else 0,
            'pierceArmor': getattr(getattr(u, 'creatable', None), 'displayed_pierce_armour', 0) or 0,
            'range': getattr(t50, 'displayed_range', 0) if t50 else 0,
            'reload': getattr(t50, 'displayed_reload_time', 0) if t50 else 0,
            'attacks': [(a.class_, a.amount) for a in (getattr(t50, 'attacks', None) or [])] if t50 else [],
            'armours': [(a.class_, a.amount) for a in (getattr(t50, 'armours', None) or [])] if t50 else [],
        }
        rows.append(row)

    # ── 动画族 → 项目现有素材目录：兵种鉴赏里已收录的 DE 单位，它们的动画族已经提取过，直接复用 ──
    main_src = open(os.path.join(ROOT, 'src/legion-editor/main.ts'), encoding='utf-8').read()
    cat_path = dict(re.findall(r"\{\s*id:\s*'([^']+)',\s*name:\s*'[^']+',\s*category:\s*'[^']+',\s*age:\s*'[^']+',\s*pathPrefix:\s*'([^']+)'", main_src))
    ln = json.load(open(os.path.join(ROOT, 'public/de-techtree/legion-names.json'), encoding='utf-8'))
    alias = json.load(open(os.path.join(ROOT, 'tools/de-unit-name-alias.json'), encoding='utf-8'))
    off = json.load(open(os.path.join(ROOT, 'public/de-techtree/offtree-units.json'), encoding='utf-8'))['units']
    de_to_cat = {}
    for k, cid in ln['byNorm'].items():
        de_to_cat.setdefault(k, cid)
    for cid, de in alias.items():
        if not cid.startswith('_'):
            de_to_cat.setdefault(norm(de), cid)
    for u in off:
        if u.get('catalogId'):
            de_to_cat.setdefault(norm(u['name_en']), u['catalogId'])
    prefix_dir = {}
    for nm_key, units_ in by_name.items():
        cid = de_to_cat.get(nm_key)
        if not cid or cid not in cat_path:
            continue
        for u in units_:
            fn = getattr(graphics[gid(u.standing_graphic)], 'file_name', '') or ''
            mm = ACTION_RE.match(fn)
            p = mm.group(1) if mm else fn.rsplit('_x', 1)[0]
            prefix_dir.setdefault(p, (cat_path[cid], cid))
    # 项目里已提取、但不在兵种鉴赏里的同族素材（按 DE 动画族逐个核对过目录）
    prefix_dir.setdefault('u_sie_war_chariot', ('/SUCAI/WARCHARIOT/', 'war_chariot_ranged'))
    prefix_dir.setdefault('u_cav_elite_war_chariot', ('/SUCAI/ELITE_WAR_CHARIOT/', 'elite_war_chariot'))
    prefix_dir.setdefault('a_pred_wolf', ('/SUCAI_ANIMAL/WOLF/', None))
    prefix_dir.setdefault('u_king_emperor_litter', ('/SUCAI/EMPERORLITTER/', None))
    prefix_dir.setdefault('u_priestess', ('/SUCAI/PRIESTESS/', None))
    # 动物库 / 贸易库里早已提取的素材（主人 2026-10-19「不要重复，我记得动物有了吧」）
    prefix_dir.setdefault('u_trade_cart_west', ('/SUCAI_TRADE/TRADE_CART_WEST/', None))
    prefix_dir.setdefault('u_merchant_west', ('/SUCAI_TRADE/MERCHANT_WEST/', None))
    prefix_dir.setdefault('a_monkeyboy', ('/SUCAI_ANIMAL/MONKEY/', None))
    animal_dirs = set(os.listdir(os.path.join(ROOT, 'public', 'SUCAI_ANIMAL')))
    for r in rows:
        p = r['prefix'] or ''
        if p.startswith('a_') and p not in prefix_dir:
            key = re.sub(r'^a_(hors_|herd_|hunt_|pred_)?', '', p).upper()
            if key in animal_dirs:
                prefix_dir[p] = (f'/SUCAI_ANIMAL/{key}/', None)
    for r in rows:
        hit = prefix_dir.get(r['prefix'])
        r['reuseDir'], r['reuseOf'] = (hit if hit else (None, None))

    print(f'对上 {len(rows)} / {len(missing)}；没对上 {len(unresolved)}')
    print(f"  可复用现有素材 {sum(1 for r in rows if r['reuseDir'])}；需新提取 {sum(1 for r in rows if not r['reuseDir'])}"
          f"（动画族 {len({r['prefix'] for r in rows if not r['reuseDir']})} 个）")
    for r in rows:
        print(f"  {r['name_en']:<26} dat#{r['dat_id']:<5} {r['dat_name']:<14} class={r['class']:<3} angles={r['angles']:<3} "
              f"prefix={r['prefix']:<36} walk={r['walk'][0]} atk={r['attack'][0]} death={r['death'][0]}")
    for n, why in unresolved:
        print(f'  ❌ {n}: {why}')
    # ── 提取：只提项目里还没有的动画族，目录名＝动画族去掉 u_/b_ 前缀后大写 ──
    if RUN:
        from aoe2de_unit_convert import GAME_DIR, composite_frame, to_boxed_at, save_sheet, GAME_DIR_TO_DE_ANGLE  # noqa
        from sld_extract import parse_sld  # noqa

        def extract_action(out_dir, action, fname, fpc, angles):
            """8 方向 × 全帧。与 2026-08-19 英雄批量提取同一合成法；32 向素材（投石机）隔一取一。"""
            path = os.path.join(GAME_DIR, fname + '.sld')
            if not os.path.exists(path):
                # 数据文件写的变体（如光子人 walkC）在磁盘上不存在：退回同动作的 A 变体
                alt = re.sub(r'_(idle|walk|attack|death|decay|fly)[A-Z]_x', r'_\1A_x', fname)
                path = os.path.join(GAME_DIR, alt + '.sld')
            _, frames = parse_sld(path)
            angles = max(1, angles)
            assert len(frames) >= angles * fpc, f'{fname}: 帧数不足 {len(frames)} < {angles * fpc}'
            dirs = {}
            for gd in range(8):
                # 16 向取偶数角；32 向隔一取一；8 向及以下按比例取；1 向（静态物件）各方向同一套
                base = (GAME_DIR_TO_DE_ANGLE[gd] * angles // 16) * fpc
                geoms, prev = [], (None, None, None)
                x1 = y1 = 10 ** 9
                x2 = y2 = -10 ** 9
                for fi in range(fpc):
                    cw, ch, hx, hy, ftype, fidx, layers = frames[base + fi]
                    try:
                        main_px, mask_px, w, h, ux1, uy1, mi, si, ki = composite_frame(layers, *prev)
                    except KeyError:
                        # 空帧（尼西潜入水下那几帧没有主图层）：沿用上一帧
                        if not geoms:
                            continue
                        geoms.append(geoms[-1])
                        continue
                    prev = (mi, si, ki)
                    geoms.append((main_px, mask_px, w, h, ux1, uy1, hx, hy))
                    _, mw, mh, mx, my = mi
                    x1, y1 = min(x1, mx - hx), min(y1, my - hy)
                    x2, y2 = max(x2, mx + mw - hx), max(y2, my + mh - hy)
                bw, bh, ax, ay = x2 - x1, y2 - y1, -x1, -y1
                dirs[str(gd)] = {'fw': bw, 'fh': bh, 'hx': ax, 'hy': ay}
                mains, masks = [], []
                for (mp, kp, w, h, ux1, uy1, hx, hy) in geoms:
                    fx, fy = ax + (ux1 - hx), ay + (uy1 - hy)
                    mains.append(to_boxed_at(mp, w, h, fx, fy, bw, bh))
                    masks.append(to_boxed_at(kp, w, h, fx, fy, bw, bh))
                save_sheet(os.path.join(out_dir, f'{action}_{gd}.png'), mains, bw, bh)
                save_sheet(os.path.join(out_dir, f'{action}_{gd}.pc.png'), masks, bw, bh)
            return dirs

        done = {}
        for r in rows:
            if r['reuseDir']:
                continue
            p = r['prefix']
            dirkey = re.sub(r'^(u|b|a|s)_', '', p).upper()
            r['newDir'] = f'/SUCAI/{dirkey}/'
            if p in done:
                continue
            out = os.path.join(ROOT, 'public', 'SUCAI', dirkey)
            done[p] = out
            if os.path.exists(os.path.join(out, '_meta.json')):
                print(f'  跳过（已存在）{dirkey}')
                continue
            os.makedirs(out, exist_ok=True)
            idle = r['idle']
            # 只写和待命不同的动作；缺的动作由兵种表登记时指回待命图（不复制同一套帧）
            plan = [('idle', idle)] + [(a, v) for a, v in (('move', r['walk']), ('attack', r['attack']), ('death', r['death']))
                                       if v[0] and v[0] != idle[0]]
            meta = {'source': 'AoE2 DE SLD', 'dePrefix': p}
            try:
                for action, (fname, fpc) in plan:
                    meta[action] = {'frames': fpc, 'dirs': extract_action(out, action, fname, fpc, r['angles'])}
                json.dump(meta, open(os.path.join(out, '_meta.json'), 'w'))
                print(f'  ✅ {dirkey}（{p}）')
            except Exception as e:  # noqa
                print(f'  ❌ {dirkey}: {e}')

    os.makedirs(os.path.join(ROOT, 'scratch/out'), exist_ok=True)
    json.dump({'rows': rows, 'unresolved': unresolved},
              open(os.path.join(ROOT, 'scratch/out/de_missing_units_resolved.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
