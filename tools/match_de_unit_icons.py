#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成 legion-editor 兵种与 AoE2 DE 科技树图标对应表。
产出: public/de-techtree/unit-icons.json
格式: { [unitId: string]: string (图标路径, 如 "/de-techtree/icons/Unit/41.png") }
"""
from __future__ import annotations

import json
import re
import os
from pathlib import Path
from genieutils.datfile import DatFile

ROOT = Path(__file__).resolve().parent.parent
DAT_PATH = r"C:\Program Files (x86)\Steam\steamapps\common\AoE2DE\resources\_common\dat\empires2_x2_p1.dat"
TREES_DIR = ROOT / "public" / "de-techtree" / "trees"
MAIN_TS = ROOT / "src" / "legion-editor" / "main.ts"
OUT_JSON = ROOT / "public" / "de-techtree" / "unit-icons.json"

def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())

def clean_zh(s: str) -> str:
    return re.sub(r"[·・\s()（）\r\n高级精锐精英重装初级次级]", "", s)

def main():
    # 1. 解析 DE DAT
    print("正在解析 DE empires2_x2_p1.dat...")
    dat = DatFile.parse(DAT_PATH)
    zh_strings = json.loads((ROOT / "public" / "de-techtree" / "strings-zh.json").read_text(encoding="utf-8"))
    en_strings = json.loads((ROOT / "public" / "de-techtree" / "strings-en.json").read_text(encoding="utf-8"))

    # DE 所有单位清单
    de_units = []
    for i, u in enumerate(dat.civs[0].units):
        if u is None: continue
        icon = getattr(u, 'icon_id', -1)
        if icon < 0: continue
        name = u.name or ''
        lid = getattr(u, 'language_dll_name', 0)
        zh_name = zh_strings.get(str(lid), '')
        en_name = en_strings.get(str(lid), '')
        cr = getattr(u, 'creatable', None)
        hero = bool(getattr(cr, 'hero_mode', 0) if cr is not None else 0)
        sg = getattr(u, 'standing_graphic', None)
        gid = sg[0] if isinstance(sg, (tuple, list)) else getattr(sg, 'graphic_id', None)
        gname = ''
        if gid is not None and 0 <= gid < len(dat.graphics) and dat.graphics[gid] is not None:
            gname = getattr(dat.graphics[gid], 'name', '') or ''
        de_units.append({
            'id': i, 'name': name, 'icon': icon, 'hero': hero,
            'zh': zh_name, 'en': en_name, 'gname': re.sub(r'\(.*?\)', '', gname).strip()
        })

    # 2. 从科技树收集官方科技树的 Picture Index
    tree_units = {} # norm_name -> icon_id, zh_name -> icon_id
    for f in TREES_DIR.glob("*.json"):
        o = json.loads(f.read_text(encoding="utf-8"))
        for item in (o.get("units_techs") or []):
            if item.get("Use Type") != "Unit": continue
            pic = item.get("Picture Index")
            if pic is None or pic < 0: continue
            name = item.get("name") or ""
            name_zh = item.get("name_zh") or ""
            tree_units[norm(name)] = pic
            if name_zh:
                clean = re.sub(r"[\r\n\s]", "", name_zh)
                tree_units[clean] = pic

    # 3. 读取 DE_UNITS_CATALOG
    src = MAIN_TS.read_text(encoding="utf-8")
    entry_re = re.compile(
        r"\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*category:\s*'([^']+)',\s*age:\s*'([^']+)'(?:,\s*pathPrefix:\s*'([^']+)')?"
    )
    catalog = []
    for m in entry_re.finditer(src):
        catalog.append({
            'id': m.group(1),
            'name': m.group(2),
            'category': m.group(3),
            'age': m.group(4),
            'pathPrefix': m.group(5) or ''
        })
    print(f"读取到 catalog 单位: {len(catalog)} 个")

    # 4. 匹配
    matched_icons: dict[str, int] = {}
    unmatched = []

    for u in catalog:
        uid = u['id']
        uname = u['name']
        prefix = u['pathPrefix']
        dir_name = prefix.strip('/').split('/')[-1] if prefix else ''

        norm_id = norm(uid)
        icon = None

        # A. 优先直接匹配科技树
        if norm_id in tree_units:
            icon = tree_units[norm_id]
        elif uname in tree_units:
            icon = tree_units[uname]
        elif norm_id.endswith('elite'):
            # 处理 xx_elite -> elite_xx
            alt = 'elite' + norm_id[:-5]
            if alt in tree_units:
                icon = tree_units[alt]

        # B. 匹配 DE DAT 库
        if icon is None:
            # 尝试通过素材目录名 dir_name 匹配 DE 内部名 / standing_graphic
            if dir_name:
                norm_dir = norm(dir_name)
                # 精锐去掉 ELITE_ 前缀匹配
                base_dir = norm(dir_name.replace('ELITE_', ''))
                # 寻找 DE 单位
                for du in de_units:
                    if norm(du['name']) == norm_dir or norm(du['gname']) == norm_dir:
                        icon = du['icon']
                        break
                    if norm(du['name']) == base_dir or norm(du['gname']) == base_dir:
                        icon = du['icon']
                        break

        if icon is None:
            # 尝试通过英文/内部名直接比对
            for du in de_units:
                if norm(du['name']) == norm_id:
                    icon = du['icon']
                    break

        if icon is None:
            # 尝试中文名匹配
            clean_u = clean_zh(uname)
            if len(clean_u) >= 2:
                for du in de_units:
                    clean_d = clean_zh(du['zh'])
                    if clean_d and (clean_u == clean_d or (len(clean_u) >= 3 and clean_u in clean_d) or (len(clean_d) >= 3 and clean_d in clean_u)):
                        # 如果有 hero 区分，尽量一致
                        if (u['category'] == 'hero') == du['hero']:
                            icon = du['icon']
                            break
                        elif icon is None:
                            icon = du['icon']

        # 手动映射/特殊别名
        ALIASES = {
            'tiger_rider': 432,
            'camel_heavy': 79,
            'light_riders': 95,
            'dagnajan_elephant': 209,
            'porus_elephant': 744,
            'gastraphetes': 22,
            'equites': 1,
            'sarmatian': 78,
            'elite_peltast': 694,
            'vanguard': 10,
            'antiquity_light_cavalry': 103,
            'antiquity_battering_ram': 80,
            'antiquity_capped_ram': 63,
            'antiquity_scorpion': 89,
            'antiquity_siege_ram': 73,
            'ant_galley': 47,
            'ant_war_galley': 46,
            'ant_elite_galley': 44,
            'demo_ship': 84,
            'heavy_demo_ship': 83,
            'demo_raft': 202,
            'junk': 34,
            'hero_artemisia': 646,
            'hero_dionysus': 632,
            'hero_aeginetan': 632,
        }
        if uid in ALIASES:
            icon = ALIASES[uid]

        if icon is not None and (ROOT / f"public/de-techtree/icons/Unit/{icon}.png").exists():
            matched_icons[uid] = icon
        else:
            unmatched.append(u)

    print(f"匹配成功: {len(matched_icons)} / {len(catalog)}")
    print(f"未匹配: {len(unmatched)}")
    for um in unmatched[:30]:
        print(f"  {um['id']} ({um['name']}) [cat={um['category']}, prefix={um['pathPrefix']}]")

    # 构建并写入 JSON
    result = {}
    for uid, ic in matched_icons.items():
        result[uid] = f"/de-techtree/icons/Unit/{ic}.png"

    OUT_JSON.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"已保存到 {OUT_JSON}")

if __name__ == '__main__':
    main()
