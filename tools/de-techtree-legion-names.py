#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成「兵种名字」对照表：科技树节点（DE 英文名）→ 军团编辑器「兵种鉴赏」的番号。

主人 2026-10-14 令：「所有兵种名字和 legion-editor.html 兵种鉴赏保持一致。」
但两边是**两套命名体系**（实测 288 个树内单位里 236 个名字不同：
  科技树＝DE 官方中文串「步弓手／民兵／武士／双手剑士／游侠」；
  兵种鉴赏＝「南方步弓手／中东民兵／铁甲剑士／欧洲双手剑士高级／骑士游侠高级」）。
故本脚本**不改任何一边**，只产出一张对照表 + 未能对号的清单，供渲染器切换与主人裁定。

对号判据：把 DE 英文名规范化（小写、去非字母数字）后与图鉴 id 比对
（例 "Crossbowman"→crossbowman、"Elite Skirmisher"→eliteskirmisher）。
**不猜**：对不上的写进 unmatched，绝不硬塞一个近似的。

产出：
  public/de-techtree/legion-names.json
    {
      "byNorm": { "<规范化 DE 英文名>": "<兵种鉴赏中文名>" },   # 渲染器按英文名兜底
      "byId":   { "<科技树节点 id>": "<兵种鉴赏 id>" },         # 精确对号（图标号 join + 英文名对号）
      "names":  { "<兵种鉴赏 id>": "<兵种鉴赏中文名>" },         # 图鉴番号快照
      "unmatched": [ ... ]
    }

用法：python tools/de-techtree-legion-names.py
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

SRC = Path("src/legion-editor/main.ts")
TREES = Path("public/de-techtree/trees")
META = Path("public/de-techtree/meta.json")
ICONS = Path("public/de-techtree/unit-icons.json")
OUT = Path("public/de-techtree/legion-names.json")

ENTRY = re.compile(
    r"\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*category:\s*'([^']+)',\s*age:\s*'([^']+)'"
)


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


def main() -> int:
    if not SRC.exists() or not TREES.exists():
        print(f"❌ 找不到 {SRC} 或 {TREES}", file=sys.stderr)
        return 2

    raw_entries = re.findall(r"\{\s*id:\s*['\"]([^'\"]+)['\"],\s*name:\s*['\"]([^'\"]+)['\"]", SRC.read_text(encoding="utf-8"))
    catalog: dict[str, str] = {}          # 规范化 id → 中文名
    catalog_id: dict[str, str] = {}       # 规范化 id → 原始 id
    for uid, name in raw_entries:
        catalog[norm(uid)] = name
        catalog_id[norm(uid)] = uid
        if uid.endswith('_elite'):
            k = 'elite' + norm(uid[:-6])
            catalog[k] = name
            catalog_id[k] = uid
        if uid.startswith('elite_'):
            k = 'elite' + norm(uid[6:])
            catalog[k] = name
            catalog_id[k] = uid

    ALIASES = {
        'arbalester': 'arbalest',
        'cavalryarcher': 'cav_archer',
        'heavycavalryarcher': 'cav_archer_heavy',
        'demolitionship': 'demo_ship',
        'heavydemolitionship': 'heavy_demo_ship',
        'demolitionraft': 'demo_raft',
        'heavycamelrider': 'camel_heavy',
        'tigercavalry': 'tiger_rider',
        'heiguangcavalry': 'hei_kuang',
        'heavyheiguangcavalry': 'hei_kuang_heavy',
        'gastraphetoros': 'gastraphetes',
        'pattiyodhalongbowman': 'pattiyoda_longbowman',
        'elitepattiyodhalongbowman': 'elite_pattiyoda_longbowman',
        'heavymountedcrossbowman': 'mounted_crossbowman_heavy',
        'ratha': 'ratha_melee',
        'eliteratha': 'elite_ratha_melee',
        'flemishmilitia': 'flemish_pikeman',
        'longship': 'longboat',
        'elitelongship': 'elite_longboat',
        'caocao': 'hero_caocao',
        'liubei': 'hero_liubei',
        'sunjian': 'hero_sunjian',
        'palintononpacked': 'antiquity_heavy_scorpion',
        'elitejarl': 'jarl',
        'elitegalley': 'ant_elite_galley',
    }
    for de_k, l_id in ALIASES.items():
        l_norm = norm(l_id)
        if l_norm in catalog:
            catalog[de_k] = catalog[l_norm]
            catalog_id[de_k] = catalog_id[l_norm]

    print(f"兵种鉴赏条目（含别名）：{len(catalog)} 个")

    # 树里出现过的单位（英文名 → 中文名/node ids）
    units: dict[str, dict] = {}
    node_names: dict[str, str] = {}   # node id → DE 英文名
    for f in sorted(TREES.glob("*.json")):
        o = json.loads(f.read_text(encoding="utf-8"))
        for e in o["units_techs"]:
            if e.get("Use Type") != "Unit":
                continue
            rec = units.setdefault(e["name"], {"ids": set(), "zh": e.get("name_zh")})
            if e.get("name_zh"):
                rec["zh"] = e["name_zh"]
            rec["ids"].add(e["Node ID"])
            node_names[str(e["Node ID"])] = e["name"]

    by_norm: dict[str, str] = {}      # 规范化 DE 英文名 → 图鉴 id（按名字对号，最可靠）
    by_id: dict[str, str] = {}        # 节点 id → 图鉴 id（兜底；注意古典/中世纪会复用节点 id，故优先级低于 byNorm）
    matched, unmatched = 0, []
    for name, rec in sorted(units.items()):
        k = norm(name)
        if k in catalog:
            by_norm[k] = catalog_id[k]
            for nid in rec["ids"]:
                by_id.setdefault(str(nid), catalog_id[k])
            matched += 1
        else:
            unmatched.append({"name": name, "zh": (rec["zh"] or "").replace("\n", ""), "nodeIds": sorted(rec["ids"])})

    # 英文名对不上的节点，再用「图标号」精确 join（meta.units[id].iconId ↔ unit-icons.json）
    filled_by_icon = 0
    if META.exists() and ICONS.exists():
        meta = json.loads(META.read_text(encoding="utf-8"))
        icons = json.loads(ICONS.read_text(encoding="utf-8"))
        icon_to_cat: dict[str, str] = {}
        for cid, url in icons.items():
            m = re.search(r"/Unit/(\d+)\.png", url or "")
            if m:
                icon_to_cat.setdefault(m.group(1), cid)
        for nid_s, de_name in node_names.items():
            if nid_s in by_id:
                continue
            u = (meta.get("units") or {}).get(nid_s)
            if not u or u.get("iconId") is None:
                continue
            cid = icon_to_cat.get(str(u["iconId"]))
            if cid:
                by_id[nid_s] = cid
                filled_by_icon += 1
    names_snapshot = {cid: catalog[norm(cid)] for cid in catalog_id.values() if norm(cid) in catalog}
    print(f"精确对号：byId {len(by_id)}/{len(node_names)} 个节点（其中图标号补 {filled_by_icon}）；图鉴番号快照 {len(names_snapshot)} 条")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(
            {"byNorm": by_norm, "byId": by_id, "names": names_snapshot, "unmatched": unmatched},
            ensure_ascii=False,
            separators=(",", ":"),
        ),
        encoding="utf-8",
    )
    print(f"对号成功 {matched}/{len(units)}；未在鉴赏中出现的非战斗/基础单位 {len(unmatched)} 个（仍显示原名）")
    print(f"→ {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
