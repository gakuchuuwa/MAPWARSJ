#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成「跨文明交叉引用」数据（官方悬停面板里那排徽章的对应物）。

数据源（本机 DE，只读）：
  · public/de-techtree/trees/*.json —— 每个文明自己的节点表（含 Node Status）
  · <AoE2DE>/widgetui/textures/ingame/emblems/<civ 小写>.png —— 文明国徽（26×26 级素材）

产出：
  public/de-techtree/emblems/<KEY>.png   62 个国徽
  public/de-techtree/xref.json           { "<UseType>_<NodeId>": ["BRITONS", ...] }
                                         —— 只登记 node_status == ResearchedCompleted 的文明；
                                            同一节点在别的文明是 NotAvailable 的，不列入。

用法：python tools/de-techtree-xref.py [--programdir ...]
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

DEFAULT_PROGRAMDIR = r"C:\Program Files (x86)\Steam\steamapps\common\AoE2DE"


def main() -> int:
    ap = argparse.ArgumentParser(description="生成跨文明交叉引用数据")
    ap.add_argument("--programdir", default=DEFAULT_PROGRAMDIR)
    args = ap.parse_args()

    prog = Path(args.programdir)
    emblems_src = prog / "widgetui" / "textures" / "ingame" / "emblems"
    trees = Path("public/de-techtree/trees")
    outdir = Path("public/de-techtree")
    if not trees.exists():
        print(f"❌ 找不到 {trees}", file=sys.stderr)
        return 2

    # 0) 本机 key → 国徽文件名：从 civilizations.json 的 emblem_image_path 解析（不硬编码特例）
    #    例：本机 key BERBERS 的国徽叫 berbers.png、MAGYAR 叫 magyars.png（与本地 key 不同名）
    civs_json = prog / "resources" / "_common" / "dat" / "civilizations.json"
    emblem_by_key: dict[str, str] = {}
    if civs_json.exists():
        for c in json.loads(civs_json.read_text(encoding="utf-8"))["civilization_list"]:
            p = c.get("emblem_image_path")
            if p:
                emblem_by_key[c["tech_tree_name"].upper()] = Path(p).name
    print(f"civilizations.json 提供国徽名：{len(emblem_by_key)} 条")

    # 1) 国徽（缺的跳过并报出来，不伪造）
    emdir = outdir / "emblems"
    emdir.mkdir(parents=True, exist_ok=True)
    coped, missing_emblem = 0, []
    keys = sorted(p.stem for p in trees.glob("*.json"))
    for k in keys:
        name = emblem_by_key.get(k, f"{k.lower()}.png")
        cands = [name, f"{k.lower()}.png", f"{k.lower().rstrip('s')}.png"]   # 三级回落
        src = next((emblems_src / c for c in cands if (emblems_src / c).exists()), None)
        if src is not None:
            shutil.copyfile(src, emdir / f"{k}.png")
            coped += 1
        else:
            missing_emblem.append(k)
    print(f"国徽：拷贝 {coped}/{len(keys)}" + (f"，缺 {missing_emblem}" if missing_emblem else ""))

    # 2) 交叉引用：节点 → 可用文明（只算 ResearchedCompleted）
    xref: dict[str, list[str]] = {}
    for k in keys:
        o = json.loads((trees / f"{k}.json").read_text(encoding="utf-8"))
        for e in o["buildings"] + o["units_techs"]:
            if e.get("Node Status") != "ResearchedCompleted":
                continue
            key = f"{e.get('Use Type')}_{e.get('Node ID')}"
            xref.setdefault(key, [])
            if k not in xref[key]:
                xref[key].append(k)
    (outdir / "xref.json").write_text(json.dumps(xref, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    counts = sorted(len(v) for v in xref.values())
    print(f"交叉引用：{len(xref)} 个节点键；每节点可用文明数 最小 {counts[0]} / 中位 {counts[len(counts)//2]} / 最大 {counts[-1]}")
    print(f"→ {outdir / 'xref.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
