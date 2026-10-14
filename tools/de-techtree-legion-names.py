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
  public/de-techtree/legion-names.json  { "byNorm": { "<规范化英文名>": "<图鉴中文名>" }, "unmatched": [...] }

用法：python tools/de-techtree-legion-names.py
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

SRC = Path("src/legion-editor/main.ts")
TREES = Path("public/de-techtree/trees")
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

    catalog = {norm(m.group(1)): m.group(2) for m in ENTRY.finditer(SRC.read_text(encoding="utf-8"))}
    print(f"兵种鉴赏条目：{len(catalog)} 个")

    # 树里出现过的单位（英文名 → 中文名/node ids）
    units: dict[str, dict] = {}
    for f in sorted(TREES.glob("*.json")):
        o = json.loads(f.read_text(encoding="utf-8"))
        for e in o["units_techs"]:
            if e.get("Use Type") != "Unit":
                continue
            rec = units.setdefault(e["name"], {"ids": set(), "zh": e.get("name_zh")})
            rec["ids"].add(e["Node ID"])

    by_norm: dict[str, str] = {}
    matched, unmatched = 0, []
    for name, rec in sorted(units.items()):
        k = norm(name)
        if k in catalog:
            by_norm[k] = catalog[k]
            matched += 1
        else:
            unmatched.append({"name": name, "zh": (rec["zh"] or "").replace("\n", ""), "nodeIds": sorted(rec["ids"])})

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"byNorm": by_norm, "unmatched": unmatched}, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"对号成功 {matched}/{len(units)}；对不上 {len(unmatched)} 个（已列进 unmatched，不猜）")
    print(f"→ {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
