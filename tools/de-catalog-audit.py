#!/usr/bin/env python3
"""
兵种鉴赏 × DE 逐条对号审计：每个兵种必须对上一个 DE 单位（编号），不许自建、不许两个兵种对同一个 DE 单位。
🔴 [2026-10-19 主人令「该项目中所有的兵种都是取自DE，没有自建的，也不能有。有的话，就是违规。列出来」]

对号来源（按可靠度）：
  1. 科技树节点号＝DE 单位编号：public/de-techtree/legion-names.json 的 byAntId（古典）/ byMedId / byId；
  2. tools/de-unit-name-alias.json（DE 英文名，或「#编号」）；
  3. offtree-units.json 的 catalogId（wiki 不可训练单位、英雄）→ 按英文名找 DE 单位；
  4. 兵种 id 本身规范化后＝DE 英文名（含内部名）。
输出：claudedocs/de-catalog-audit.md
用法：python tools/de-catalog-audit.py
"""
import json
import os
import re
import unicodedata

from genieutils.datfile import DatFile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DAT = r'C:\Program Files (x86)\Steam\steamapps\common\AoE2DE\resources\_common\dat\empires2_x2_p1.dat'


def norm(s):
    s = unicodedata.normalize('NFD', str(s or ''))
    s = ''.join(ch for ch in s if unicodedata.category(ch) != 'Mn')
    return re.sub(r'[^a-z0-9]', '', s.lower())


def main():
    main_src = open(os.path.join(ROOT, 'src/legion-editor/main.ts'), encoding='utf-8').read()
    cat = re.findall(r"\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*category:\s*'(\w+)',\s*age:\s*'(\w+)',\s*pathPrefix:\s*'([^']+)'", main_src)
    ln = json.load(open(os.path.join(ROOT, 'public/de-techtree/legion-names.json'), encoding='utf-8'))
    alias = {k: v for k, v in json.load(open(os.path.join(ROOT, 'tools/de-unit-name-alias.json'), encoding='utf-8')).items() if not k.startswith('_')}
    off = json.load(open(os.path.join(ROOT, 'public/de-techtree/offtree-units.json'), encoding='utf-8'))['units']
    en = json.load(open(os.path.join(ROOT, 'public/de-techtree/strings-en.json'), encoding='utf-8'))
    dat = DatFile.parse(DAT)

    # DE 单位以「编号 + 该文明里的待命图」区分：古典文明（编年史）复用中世纪编号，但在自己的单位表里是另一个单位
    ANT = {'Achaemenids', 'Athenians', 'Spartans', 'Macedonians', 'Thracians', 'Puru'}
    def gfx_of(u):
        g = getattr(u, 'standing_graphic', None)
        g = g[0] if isinstance(g, (list, tuple)) else g
        return dat.graphics[g].file_name if g is not None and 0 <= g < len(dat.graphics) and dat.graphics[g] is not None else ''
    variants = {}   # (编号, 图) → 显示名
    by_id_era = {}  # (编号, 'ant'|'med') → (编号, 图)
    by_name = {}    # 规范化显示名/内部名 → [(编号, 图)]
    for civ in dat.civs:
        era = 'ant' if getattr(civ, 'name', '') in ANT else 'med'
        for u in civ.units:
            if u is None:
                continue
            key = (u.id, gfx_of(u))
            disp = en.get(str(getattr(u, 'language_dll_name', None)), '') or ''
            variants.setdefault(key, disp or getattr(u, 'name', ''))
            by_id_era.setdefault((u.id, era), key)
            for k in (norm(disp), norm(getattr(u, 'name', ''))):
                if k and key not in by_name.setdefault(k, []):
                    by_name[k].append(key)
    hero_ids = {u.id for u in dat.civs[0].units if u is not None and (getattr(getattr(u, 'creatable', None), 'hero_mode', 0) or 0)}

    def keys_of_name(nm):
        if '#' in str(nm) and not str(nm).startswith('#'):
            nm = '#' + str(nm).split('#')[1]
        if str(nm).startswith('#'):
            i = int(nm[1:])
            return {by_id_era.get((i, 'med')) or by_id_era.get((i, 'ant'))} - {None}
        got = by_name.get(norm(nm), [])
        if len(got) > 1:
            hero = sorted(k for k in got if k[0] in hero_ids)
            return {hero[0]} if hero else {min(got)}
        return set(got)

    cat_to_ids = {cid: set() for cid, *_ in cat}
    src_of = {}
    # 对号表逐条核实过，优先于科技树节点号（科技树里拉塔战车只登记远程那条，近战版要靠对号表）
    for cid, de in alias.items():
        if cid in cat_to_ids:
            cat_to_ids[cid] |= keys_of_name(de)
            src_of[cid] = f'对号表「{de}」'
    for table, how, era in ((ln.get('byAntId', {}), '科技树（古典）', 'ant'), (ln.get('byMedId', {}), '科技树（特殊节点）', 'med'), (ln.get('byId', {}), '科技树', 'med')):
        for nid, cid in table.items():
            if cid in cat_to_ids and cid not in alias:
                k = by_id_era.get((int(nid), era)) or by_id_era.get((int(nid), 'ant' if era == 'med' else 'med'))
                if k and (era == 'ant' or not cat_to_ids[cid]):
                    cat_to_ids[cid].add(k)
                    src_of.setdefault(cid, how)
    for u in off:
        cid = u.get('catalogId')
        if cid in cat_to_ids and not cat_to_ids[cid]:
            cat_to_ids[cid] |= keys_of_name(u['name_en'])
            src_of.setdefault(cid, f'不可训练单位「{u["name_en"]}」')
    for cid, *_ in cat:
        if not cat_to_ids[cid]:
            got = keys_of_name(cid.replace('hero_', ''))
            if got:
                cat_to_ids[cid] |= got
                src_of.setdefault(cid, 'id 同名')
    names = {k: v for k, v in variants.items()}

    info = {cid: (nm, c, age, path) for cid, nm, c, age, path in cat}
    unmapped = [cid for cid, s in cat_to_ids.items() if not s]
    owners = {}
    for cid, s in cat_to_ids.items():
        for i in s:
            owners.setdefault(i, []).append(cid)
    dups = {i: cs for i, cs in owners.items() if len(cs) > 1}

    lines = ['# 兵种鉴赏 × DE 逐条对号审计', '', '由 `python tools/de-catalog-audit.py` 生成。主人定：所有兵种都必须取自 DE，没有自建；两个兵种对同一个 DE 单位即重复。', '',
             f'兵种鉴赏共 {len(cat)} 个；对上 DE 单位的 {len(cat) - len(unmapped)} 个；**对不上（自建，违规）{len(unmapped)} 个**；**重复（多个兵种对同一 DE 单位）{len(dups)} 组**。', '',
             f'## 对不上 DE 单位（{len(unmapped)} 个）', '', '| id | 名字 | 类别 | 素材 |', '|---|---|---|---|']
    for cid in unmapped:
        nm, c, age, path = info[cid]
        lines.append(f'| `{cid}` | {nm} | {c} | {path} |')
    lines += ['', f'## 重复：多个兵种对同一个 DE 单位（{len(dups)} 组）', '', '| DE 单位 | 兵种 |', '|---|---|']
    for i, cs in sorted(dups.items()):
        lines.append(f'| #{i[0]} {names.get(i, "")}（{i[1]}） | ' + '；'.join(f'`{c}` {info[c][0]}（{info[c][3]}，{src_of.get(c, "")}）' for c in cs) + ' |')
    open(os.path.join(ROOT, 'claudedocs/de-catalog-audit.md'), 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    print(f'共 {len(cat)}；对不上 {len(unmapped)}；重复 {len(dups)} 组')
    for cid in unmapped:
        print('  自建?', cid, info[cid][0], info[cid][3])
    for i, cs in sorted(dups.items()):
        print('  重复', f'#{i[0]}', names.get(i, ''), i[1], '←', ', '.join(f'{c}({info[c][0]})' for c in cs))


if __name__ == '__main__':
    main()
