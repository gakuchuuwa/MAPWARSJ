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
        'jarl': 'varangian_jarl',
        'elitejarl': 'elite_varangian_jarl',
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
            rec = units.setdefault(e["name"], {"ids": set(), "med_ids": set(), "zh": e.get("name_zh")})
            if e.get("name_zh"):
                rec["zh"] = e["name_zh"]
            rec["ids"].add(e["Node ID"])
            if o.get("era") != "antiquity":
                rec["med_ids"].add(e["Node ID"])
            node_names[str(e["Node ID"])] = e["name"]

    # 仅在古典文明出现的单位节点，不应写入中世纪兜底的 by_id（中世纪 125=僧侣 Monk、331=巨型投石机 Trebuchet 未收录进兵种鉴赏）
    ANT_ONLY_REUSE_NODES = {125, 331}

    by_norm: dict[str, str] = {}      # 规范化 DE 英文名 → 图鉴 id（按名字对号）
    by_id: dict[str, str] = {}        # 节点 id → 图鉴 id（兜底）
    matched, unmatched = 0, []
    for name, rec in sorted(units.items()):
        k = norm(name)
        if k in catalog:
            by_norm[k] = catalog_id[k]
            matched += 1
        else:
            unmatched.append({"name": name, "zh": (rec["zh"] or "").replace("\n", ""), "nodeIds": sorted(rec["ids"])})

    # 🔴 [2026-10-19] by_id 先让中世纪文明的节点占号，古典文明独有的节点号再补：古典文明复用中世纪节点号
    #    （如 5＝中世纪火枪手、古典腹弓手），以前按英文名字母序先到先得，古典兵（Gastraphetes）抢走了中世纪的号。
    for pass_key in ("med_ids", "ids"):
        for name, rec in sorted(units.items()):
            k = norm(name)
            if k not in catalog:
                continue
            for nid in rec[pass_key]:
                if nid not in ANT_ONLY_REUSE_NODES:
                    by_id.setdefault(str(nid), catalog_id[k])

    # 古典文明（Chronicles）复用中世纪节点 ID 时的精确映射（节点 ID → 图鉴 ID）
    by_ant_id: dict[str, str] = {
        "4": "bowman",
        "5": "gastraphetes",
        "6": "elite_antiquity_skirmisher",
        "7": "antiquity_skirmisher",
        "24": "laminated_bowman",
        "36": "siege_ballista",
        "38": "lancer",
        "39": "antiquity_cavalry_archer",
        "74": "levy",
        "75": "maceman",
        "77": "swordsman",
        "93": "antiquity_spearman",
        "125": "priestess",
        "279": "antiquity_scorpion",
        "280": "antiquity_mangonel",
        "283": "shock_cavalry",
        "331": "antiquity_heavy_scorpion",
        "358": "guardsman",
        "359": "elite_guardsman",
        "422": "antiquity_capped_ram",
        "441": "raider",
        "448": "antiquity_scout_cavalry",
        "474": "antiquity_heavy_cavalry_archer",
        "492": "recurve_bowman",
        "542": "antiquity_heavy_scorpion",
        "546": "antiquity_light_cavalry",
        "548": "antiquity_siege_ram",
        "550": "antiquity_onager",
        "567": "paragon",
        "569": "imperial_cavalry",
        "588": "antiquity_siege_onager",
        "1105": "antiquity_siege_tower",
        "1258": "antiquity_battering_ram",
        "2130": "ant_galley",
        "2131": "ant_war_galley",
        "2132": "ant_elite_galley",
    }

    # 中世纪文明同英文名但节点 ID 区分的特殊单位（如步战保加利亚骑兵 1254/1255、蜀国先秦远程战车 1962、瓦良格首领 2708/2709）
    by_med_id: dict[str, str] = {
        "1254": "konnik_foot",
        "1255": "elite_konnik_foot",
        "1962": "war_chariot_ranged",
        "2708": "varangian_jarl",
        "2709": "elite_varangian_jarl",
    }
    for nid_s, cid in by_med_id.items():
        if norm(cid) in catalog:
            by_id[nid_s] = cid

    names_snapshot = {cid: catalog[norm(cid)] for cid in catalog_id.values() if norm(cid) in catalog}
    print(f"精确对号：byId {len(by_id)}/{len(node_names)} 个节点；古典覆盖 {len(by_ant_id)} 条；中世纪特殊覆盖 {len(by_med_id)} 条；图鉴番号快照 {len(names_snapshot)} 条")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(
            {
                "byNorm": by_norm,
                "byId": by_id,
                "byAntId": by_ant_id,
                "byMedId": by_med_id,
                "names": names_snapshot,
                "unmatched": unmatched,
            },
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
