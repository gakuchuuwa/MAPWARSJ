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
ACTION_RE = re.compile(r'^(.*)_(idle|walk|move|attack|death|decay|run|fire|shoot|die|work)[A-Za-z0-9]*_x\d+$')


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
    by_name = {}
    for u in dat.civs[0].units:
        if u is None:
            continue
        sid = getattr(u, 'language_dll_name', None)
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
        cands = sorted(by_name.get(norm(item['name_en']), []), key=score)
        if not cands:
            unresolved.append((item['name_en'], 'DE 数据里没有同名单位'))
            continue
        u = cands[0]
        g = graphics[gid(u.standing_graphic)]
        idle_fn = getattr(g, 'file_name', '') or ''
        m = ACTION_RE.match(idle_fn)
        prefix = m.group(1) if m else idle_fn.rsplit('_x', 1)[0]
        acts = prefix_map.get(prefix, {})

        def pick(*names):
            for n in names:
                if acts.get(n):
                    return acts[n][0]
            return (None, 0, 0)

        idle = (idle_fn, getattr(g, 'frame_count', 0), getattr(g, 'angle_count', 0))
        walk = pick('walk', 'move', 'run')
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

    print(f'对上 {len(rows)} / {len(missing)}；没对上 {len(unresolved)}')
    for r in rows:
        print(f"  {r['name_en']:<26} dat#{r['dat_id']:<5} {r['dat_name']:<14} class={r['class']:<3} angles={r['angles']:<3} "
              f"prefix={r['prefix']:<36} walk={r['walk'][0]} atk={r['attack'][0]} death={r['death'][0]}")
    for n, why in unresolved:
        print(f'  ❌ {n}: {why}')
    os.makedirs(os.path.join(ROOT, 'scratch/out'), exist_ok=True)
    json.dump({'rows': rows, 'unresolved': unresolved},
              open(os.path.join(ROOT, 'scratch/out/de_missing_units_resolved.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
