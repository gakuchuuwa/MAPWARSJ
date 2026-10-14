#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从本机 AoE2 DE 安装抽取「全 62 文明科技树」数据，产出网页直接可吃的 JSON。

数据源（全部来自本机游戏文件，不从网上抓、不手抄）：
  1) resources/_common/dat/CivTechTrees/<CIVKEY>.json
     —— 游戏自带的科技树节点表（官方 aoe2techtree 的同一数据源）：
        civ_techs_buildings（产出建筑）/ civ_techs_units（单位与科技），
        字段：Name / Node Type / Use Type / Node Status / Name String ID /
              Age ID / Building ID / Node ID / Picture Index / Link ID / Help String ID
  2) resources/_common/dat/civilizations.json —— 63 项（含 Gaia），取 62 个可玩文明
  3) resources/<lng>/strings/key-value/key-value-strings-utf8.txt —— 数字 id → 文本
     （en=英文名、zh=中文名）

产出：
  public/de-techtree/index.json                  62 文明索引
  public/de-techtree/trees/<CIVKEY>.json         每文明的建筑列 + 单位/科技节点（名字已解析）
  public/de-techtree/strings-<lng>.json          该语言的 id→文本（渲染器查说明用）

用法：
  python tools/de-techtree-extract.py
  python tools/de-techtree-extract.py --programdir "C:/Program Files (x86)/Steam/steamapps/common/AoE2DE"
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

DEFAULT_PROGRAMDIR = r"C:\Program Files (x86)\Steam\steamapps\common\AoE2DE"
# 本机 DE 实装的语言包（实测 17 个，与官方网页的 locale 数一致）；有哪个抽哪个，缺的自动跳过。
LANGS = ("en", "zh", "tw", "jp", "ko", "fr", "de", "es", "mx", "br", "it", "pl", "ru", "tr", "vi", "hi", "ms")

# 官方生成脚本（generateTechTreeJsons.py）用到的字段，全部原样透传，避免丢信息
PASSTHROUGH = (
    "Node Type",
    "Link Node Type",
    "Draw Node Type",
    "Use Type",
    "Node Status",
    "Age ID",
    "Building ID",
    "Node ID",
    "Picture Index",
    "Link ID",
    "Name String ID",
    "Help String ID",
    "Building upgraded from ID",
    "Building in new column",
)

KV_LINE = re.compile(r'^\s*(\d+)\s+"(.*)"\s*$')


def load_kv(path: Path) -> dict[int, str]:
    """读 key-value-strings 文件：每行 `<id> "<text>"`；注释行与空行跳过。"""
    out: dict[int, str] = {}
    if not path.exists():
        return out
    with path.open(encoding="utf-8", errors="replace") as fh:
        for line in fh:
            if not line.strip() or line.lstrip().startswith("//"):
                continue
            m = KV_LINE.match(line)
            if m:
                out[int(m.group(1))] = m.group(2)
    return out


def i18n(raw: dict, table: dict[int, str], sid) -> str | None:
    if sid in (None, -1):
        return None
    return table.get(int(sid))


def pick_strings(civ: dict, kv: dict[int, str]) -> tuple[str | None, str | None]:
    """按优先级从节点里挑一个「名字」：优先节点自带 Name，其次 Name String ID。"""
    name = civ.get("Name")
    if name:
        return name, name
    return None, None


def main() -> int:
    ap = argparse.ArgumentParser(description="抽取 DE 全 62 文明科技树 JSON")
    ap.add_argument("--programdir", default=DEFAULT_PROGRAMDIR)
    ap.add_argument("--outdir", default="public/de-techtree")
    args = ap.parse_args()

    prog = Path(args.programdir)
    datdir = prog / "resources" / "_common" / "dat"
    treesdir = datdir / "CivTechTrees"
    civfile = datdir / "civilizations.json"
    outdir = Path(args.outdir)

    for p in (treesdir, civfile):
        if not p.exists():
            print(f"❌ 找不到数据源：{p}", file=sys.stderr)
            return 2

    # ── 语言表 ──
    # 🔴 一个语种有**多个** key-value 文件：主表 `key-value-strings-utf8.txt` 只到 30 万段，
    #    而科技树节点的 `Name String ID` 有一批落在 **40 万段**（如 405052=弓兵），
    #    它只在 `key-value-paphos-strings-utf8.txt` 里（实测；漏读这个文件会让 313 个节点没有中文名、
    #    渲染器回落显示英文名 —— 2026-10-14 主人指出「所有兵种必须中文名」的根因）。
    #    故：**该语种目录下所有 key-value 文件全读并合并**，主表先读、其余文件只补空位（主表优先）。
    def load_all_kv(lng: str) -> dict[int, str]:
        d = prog / "resources" / lng / "strings" / "key-value"
        if not d.exists():
            return {}
        out: dict[int, str] = {}
        files = sorted(d.glob("*.txt"), key=lambda p: (p.name != "key-value-strings-utf8.txt", p.name))
        for f in files:
            for k, v in load_kv(f).items():
                out.setdefault(k, v)
        return out

    strtab: dict[str, dict[int, str]] = {lng: load_all_kv(lng) for lng in LANGS}
    print(f"语言表：en {len(strtab['en'])} 条 / zh {len(strtab['zh'])} 条（已合并该语种全部 key-value 文件）")

    # ── 文明清单（第 0 项 Gaia 排除）──
    civlist = json.loads(civfile.read_text(encoding="utf-8"))["civilization_list"]
    playable = [c for c in civlist if c.get("internal_name", "").lower() != "gaia"]
    print(f"文明清单：{len(civlist)} 项，可玩 {len(playable)} 项")

    (outdir / "trees").mkdir(parents=True, exist_ok=True)
    index: list[dict] = []
    missing_trees: list[str] = []
    total_nodes = 0

    for civ in playable:
        key = civ["tech_tree_name"].upper()
        src = treesdir / f"{key}.json"
        if not src.exists():
            missing_trees.append(key)
            continue
        raw = json.loads(src.read_text(encoding="utf-8"))

        def conv(items: list[dict], kind: str) -> list[dict]:
            out = []
            for it in items:
                rec = {
                    "id": f"{it.get('Use Type', kind)}_{it.get('Node ID')}_{it.get('Building ID')}",
                    "name": it.get("Name"),
                    "name_zh": i18n(it, strtab["zh"], it.get("Name String ID")),
                    "name_string_id": it.get("Name String ID"),
                    "help_string_id": it.get("Help String ID"),
                }
                for field in PASSTHROUGH:
                    rec[field] = it.get(field)
                out.append(rec)
            return out

        buildings = conv(raw.get("civ_techs_buildings", []), "Building")
        units_techs = conv(raw.get("civ_techs_units", []), "Unit")
        total_nodes += len(buildings) + len(units_techs)

        tree = {
            "civ": key,
            "civName": civ.get("internal_name"),
            "civNameZh": i18n(civ, strtab["zh"], civ.get("name_string_id")),
            "era": civ.get("era"),
            "buildings": buildings,
            "units_techs": units_techs,
        }
        (outdir / "trees" / f"{key}.json").write_text(
            json.dumps(tree, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
        )

        index.append(
            {
                "key": key,
                "name": civ.get("internal_name"),
                "name_zh": i18n(civ, strtab["zh"], civ.get("name_string_id")),
                "era": civ.get("era"),
                "file": f"trees/{key}.json",
                "buildings": len(buildings),
                "nodes": len(units_techs),
            }
        )

    (outdir / "index.json").write_text(
        json.dumps(index, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    for lng in LANGS:
        (outdir / f"strings-{lng}.json").write_text(
            json.dumps(strtab[lng], ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
        )

    counts = sorted(c["nodes"] for c in index)
    print(f"\n✅ 树文件 {len(index)} 份；缺树 {len(missing_trees)} 个" + (f"：{missing_trees}" if missing_trees else ""))
    print(f"   节点总数 {total_nodes}；每文明节点 最小 {counts[0]} / 中位 {counts[len(counts)//2]} / 最大 {counts[-1]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
