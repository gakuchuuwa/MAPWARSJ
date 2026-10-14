#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
抽取「文明介绍」数据（对应 DE 游戏科技树左栏那块面板）。

数据源（本机 DE，只读）：
  resources/_common/dat/civilizations.json
    · tech_tree_description_string_id → 文明总述（含加成、独特单位、独特科技、团队加成，
      游戏里就是这么一坨富文本，用 \\n 分段；照原样保留，渲染端自己分段）
    · unique_unit_string_ids[].name/description → 独特单位名与说明
    · unique_tech_id_1 / unique_tech_id_2 → 两个独特科技 id（名字在 dat.techs[].language_dll_name）
  resources/<lng>/strings/key-value/… → id→文本（各语言）

产出：public/de-techtree/civ-info.json
  { "<CIVKEY>": { "descIds": { "en": <id>, "zh": <id>, … }, "unitIds": [...], "techIds": [...] } }
  —— 只存 **id**，文本由渲染器按当前语言查 strings-<lng>.json（避免把同一段话复制 17 份）。

用法：python tools/de-techtree-civ-info.py [--programdir ...]
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

DEFAULT_PROGRAMDIR = r"C:\Program Files (x86)\Steam\steamapps\common\AoE2DE"


def main() -> int:
    ap = argparse.ArgumentParser(description="抽取文明介绍数据")
    ap.add_argument("--programdir", default=DEFAULT_PROGRAMDIR)
    ap.add_argument("--out", default="public/de-techtree/civ-info.json")
    args = ap.parse_args()

    prog = Path(args.programdir)
    civfile = prog / "resources" / "_common" / "dat" / "civilizations.json"
    trees = Path("public/de-techtree/trees")
    if not civfile.exists() or not trees.exists():
        print(f"❌ 找不到 {civfile} 或 {trees}", file=sys.stderr)
        return 2

    keys = {p.stem for p in trees.glob("*.json")}
    out: dict[str, dict] = {}
    missing: list[str] = []
    for c in json.loads(civfile.read_text(encoding="utf-8"))["civilization_list"]:
        key = c["tech_tree_name"].upper()
        if key not in keys:
            continue
        desc_id = c.get("tech_tree_description_string_id")
        unit_ids = [u for u in (c.get("unique_unit_string_ids") or []) if isinstance(u, dict)]
        out[key] = {
            "descId": desc_id if (desc_id or 0) > 0 else None,
            "uniqueUnitNameIds": [u.get("name") for u in unit_ids if u.get("name")],
            "uniqueUnitDescIds": [u.get("description") for u in unit_ids if u.get("description")],
            "uniqueTechIds": [t for t in (c.get("unique_tech_id_1"), c.get("unique_tech_id_2")) if isinstance(t, int) and t > 0],
            "uniqueUnitId": c.get("unique_unit_id"),
            "eliteUniqueUnitId": c.get("elite_unique_unit_id"),
        }
        if not out[key]["descId"]:
            missing.append(key)

    Path(args.out).write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    with_desc = sum(1 for v in out.values() if v["descId"])
    print(f"✅ {len(out)} 个文明；有介绍的 {with_desc} 个" + (f"，无介绍 {missing}" if missing else ""))
    print(f"→ {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
