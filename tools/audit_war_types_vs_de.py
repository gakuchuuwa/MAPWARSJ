#!/usr/bin/env python3
"""WAR_TYPES（13 战场兵种表）逐字段核对 AoE2 DE 本体。2026-08-26

数据源只认 DE 本体，不看任何注释：
  empires2_x2_p1.dat（genieutils 解析） + resources/zh/strings（官方中文名）

踩过的三个坑，改脚本前务必先读：
  ① 护甲不能读 `displayed_melee_armour` / `displayed_pierce_armour` ——
     DE 对多数单位这两个字段是 0，真值在 `armours` 数组里：class 4 = 近防、class 3 = 远防。
     用 displayed 会得到「我们有值 / DE 全 0」的整齐假象，误报上百条。
  ② 英雄单位与普通兵共用同一套精灵图，standing_graphic 名会撞
     （冠军剑士 ↔ 齐格菲、骑士 ↔ 狮心王理查）。索引必须非英雄优先。
  ③ 中文名子串匹配会把不同单位配到一起（「条顿武士」→「武士」、「罗马伴随骑士」→「骑士」）。
     所以优先走素材目录硬映射（legion-editor 的 id → /SUCAI/<DIR>/），
     中文名只作兜底，且结果标注 match='中文名'，视为存疑而非定论。

用法：py tools/audit_war_types_vs_de.py
产物：scratch/war_types_vs_de.json（same / diff / none 三段）
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DAT = r'C:\Program Files (x86)\Steam\steamapps\common\AoE2DE\resources\_common\dat\empires2_x2_p1.dat'
ZH_DIR = r'C:\Program Files (x86)\Steam\steamapps\common\AoE2DE\resources\zh\strings\key-value'
SCENE13 = os.path.join(ROOT, 'src', 'ui', 'Scene13WarLayer.ts')
EDITOR = os.path.join(ROOT, 'src', 'legion-editor', 'main.ts')
OUT = os.path.join(ROOT, 'scratch', 'war_types_vs_de.json')

# 陆战军事单位 class_（排除建筑/农民/动物/投射物/僧侣/船）
MILITARY_CLASSES = {0, 6, 12, 13, 23, 28, 35, 36, 44, 47, 51, 53, 54, 55, 56, 57, 64}
ELITE_WORDS = ('精锐', '高级', '重装', '精英')


def nz(s):
    return re.sub(r'[^A-Z0-9]', '', (s or '').upper())


def nc(s):
    return re.sub(r'[·・\s()（）]', '', s or '')


def load_de():
    from genieutils.datfile import DatFile
    zh = {}
    for fn in os.listdir(ZH_DIR):
        if not fn.endswith('.txt'):
            continue
        with open(os.path.join(ZH_DIR, fn), encoding='utf-8') as f:
            for line in f:
                m = re.match(r'^(\d+)\s+"(.*)"\s*$', line.strip())
                if m:
                    zh[int(m.group(1))] = m.group(2)
    dat = DatFile.parse(DAT)
    graphics = dat.graphics
    out = []
    for i, u in enumerate(dat.civs[0].units):
        if u is None:
            continue
        t = getattr(u, 'type_50', None)
        if t is None:
            continue
        hp = getattr(u, 'hit_points', 0) or 0
        if hp <= 0 or getattr(u, 'class_', None) not in MILITARY_CLASSES:
            continue
        cn = zh.get(getattr(u, 'language_dll_name', 0), '')
        if not cn:
            continue
        # 坑① 护甲取 armours 真值
        arm = {}
        for a in (getattr(t, 'armours', None) or []):
            c = getattr(a, 'class_', None)
            if c is not None:
                arm[int(c)] = int(getattr(a, 'amount', 0))
        cr = getattr(u, 'creatable', None)
        sg = getattr(u, 'standing_graphic', None)
        gid = sg[0] if isinstance(sg, (tuple, list)) else getattr(sg, 'graphic_id', None)
        gname = ''
        if gid is not None and 0 <= gid < len(graphics) and graphics[gid] is not None:
            gname = getattr(graphics[gid], 'name', '') or ''
        out.append({
            'name': u.name, 'cn': cn, 'gname': re.sub(r'\(.*?\)', '', gname),
            'hero': bool(getattr(cr, 'hero_mode', 0) if cr is not None else 0),
            'hp': int(hp), 'atk': int(getattr(t, 'displayed_attack', 0) or 0),
            'melee': arm.get(4, 0), 'pierce': arm.get(3, 0),
            'rng': round(float(getattr(t, 'max_range', 0) or 0), 2),
            'reload': round(float(getattr(t, 'reload_time', 0) or 0), 2),
        })
    return out


def load_war_types():
    """WAR_TYPES 是纯字面量对象，交给 node 求值后转 JSON。"""
    js = r'''
const fs=require('fs');
const lines=fs.readFileSync(process.argv[1],'utf8').split('\n');
let s=-1;
for(let i=0;i<lines.length;i++) if(/^export const WAR_TYPES/.test(lines[i])){s=i;break;}
let e=s; for(let i=s+1;i<lines.length;i++) if(/^\};/.test(lines[i])){e=i;break;}
const body=lines.slice(s,e+1).join('\n').replace(/^export const WAR_TYPES[^=]*=\s*/,'').replace(/;\s*$/,'');
process.stdout.write(JSON.stringify(eval('('+body+')')));
'''
    r = subprocess.run(['node', '-e', js, SCENE13], capture_output=True, text=True, encoding='utf-8')
    if r.returncode != 0:
        sys.exit('提取 WAR_TYPES 失败: ' + r.stderr)
    return json.loads(r.stdout)


def load_key2dir():
    src = open(EDITOR, encoding='utf-8').read()
    out = {}
    for m in re.finditer(r"\{\s*id:\s*'([^']+)',\s*name:\s*'([^']*)',[^}]*?pathPrefix:\s*'/SUCAI/([^/']+)/'", src):
        out[m.group(1)] = m.group(3)
    return out


def main():
    de = load_de()
    war = load_war_types()
    k2d = load_key2dir()

    # 坑② 非英雄优先
    idx, cnidx = {}, {}
    for hero_pass in (False, True):
        for u in de:
            if u['hero'] != hero_pass:
                continue
            for key in {nz(u['name']), nz(u['gname'])}:
                if key:
                    idx.setdefault(key, u)
            cnidx.setdefault(nc(u['cn']), u)
    cnkeys = sorted(cnidx, key=len, reverse=True)

    def by_cn(w):
        nm = nc(w['name'])
        want_elite = any(e in nm for e in ELITE_WORDS)
        if nm in cnidx:
            return cnidx[nm]
        cands = [cnidx[c] for c in cnkeys if len(c) >= 2 and c in nm]
        if not cands:
            return None
        el = [u for u in cands if any(e in u['cn'] for e in ELITE_WORDS)]
        ne = [u for u in cands if not any(e in u['cn'] for e in ELITE_WORDS)]
        # 我们是精锐版而 DE 只找到基础版 → 不算匹配，避免造出整批假差异
        return (el[0] if el else None) if want_elite else (ne[0] if ne else None)

    same, diff, none = [], [], []
    for k, w in war.items():
        u, how = None, ''
        d = k2d.get(k)
        if d:
            n = nz(d)
            u = idx.get(n) or (idx.get(n[5:]) if n.startswith('ELITE') else None)
            if u:
                how = '目录'
        if not u:
            u = by_cn(w)
            if u:
                how = '中文名'
        if not u:
            none.append({'key': k, 'name': w['name']})
            continue
        gaps = []
        if w['hp'] != u['hp']:
            gaps.append('血 %d≠%d' % (w['hp'], u['hp']))
        if w['atk'] != u['atk']:
            gaps.append('攻 %d≠%d' % (w['atk'], u['atk']))
        if w['meleeArmor'] != u['melee']:
            gaps.append('近防 %d≠%d' % (w['meleeArmor'], u['melee']))
        if w['pierceArmor'] != u['pierce']:
            gaps.append('远防 %d≠%d' % (w['pierceArmor'], u['pierce']))
        if abs(w['reload'] - u['reload']) > 0.01:
            gaps.append('装填 %.2f≠%.2f' % (w['reload'], u['reload']))
        # WarType.rng 是像素 = DE max_range × 40
        if abs(w['rng'] / 40 - u['rng']) > 0.01:
            gaps.append('射程 %.1f≠%.1f 格' % (w['rng'] / 40, u['rng']))
        rec = {'key': k, 'name': w['name'], 'de': u['cn'], 'de_id': u['name'], 'match': how, 'gaps': gaps}
        (diff if gaps else same).append(rec)

    json.dump({'same': same, 'diff': diff, 'none': none},
              open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

    print('=== WAR_TYPES vs AoE2 DE 本体 ===')
    print('总条目 %d' % len(war))
    print('  与 DE 逐字段一致 : %d' % len(same))
    print('  有差异           : %d' % len(diff))
    print('  DE 无此兵种(自造) : %d' % len(none))
    print()
    print('--- 差异（match=中文名 的存疑，可能是撞名而非真差异）---')
    for r in diff:
        print('  %-30s %-18s ←%-4s DE「%s」: %s'
              % (r['key'], r['name'], r['match'], r['de'], '; '.join(r['gaps'])))
    print()
    print('报告: %s' % OUT)


if __name__ == '__main__':
    main()
