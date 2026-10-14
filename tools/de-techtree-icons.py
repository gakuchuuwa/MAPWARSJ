#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
导出科技树节点图标：从 DE 的 widgetui DDS 表批量出 PNG，并写 manifest。

来源（本机 DE，只读）：
  <AoE2DE>/widgetui/textures/ingame/units/<N>_50730.DDS
  <AoE2DE>/widgetui/textures/ingame/tech/<N>_<科技名>.DDS
  <AoE2DE>/widgetui/textures/ingame/buildings/<N>_<建筑名>_<风格>.DDS
  —— `Picture Index = N` 一一对应；**一个文件就是一枚图标**（256×256，含透明边，
      Tech/Building 整幅不透明），故整幅等比缩放即可（官方网页同样用法）。

产出：
  public/de-techtree/icons/{Unit,Tech,Building}/<N>.png   （64×64 RGBA，显示时缩到 36px）
  public/de-techtree/icons/manifest.json                  （覆盖统计 ＋ 缺号清单）

用法：python tools/de-techtree-icons.py [--programdir ...] [--size 64]
"""
from __future__ import annotations

import argparse
import glob
import json
import os
import sys
from pathlib import Path

DEFAULT_PROGRAMDIR = r"C:\Program Files (x86)\Steam\steamapps\common\AoE2DE"
KINDS = {"Unit": "units", "Tech": "tech", "Building": "buildings"}


def find_file(dirpath: Path, index: int) -> Path | None:
    """按 `<N:03d>_*` 找文件；扩展名大小写混用（.DDS/.dds），一律大小写不敏感。"""
    prefix = f"{index:03d}_"
    hits = [p for p in dirpath.iterdir() if p.is_file() and p.name.lower().startswith(prefix)]
    if not hits:
        return None
    hits.sort(key=lambda p: p.name)
    # Building 同一编号可能多份风格变体 —— 固定取 _1 那份（与队友侦察一致）
    ones = [p for p in hits if "_1." in p.name.lower()]
    return (ones or hits)[0]


def main() -> int:
    ap = argparse.ArgumentParser(description="导出科技树图标 PNG")
    ap.add_argument("--programdir", default=DEFAULT_PROGRAMDIR)
    ap.add_argument("--size", type=int, default=64)
    ap.add_argument("--outdir", default="public/de-techtree/icons")
    args = ap.parse_args()

    try:
        from PIL import Image
    except ImportError:
        print("❌ 需要 Pillow（python -m pip install pillow）", file=sys.stderr)
        return 2

    tex_root = Path(args.programdir) / "widgetui" / "textures" / "ingame"
    trees = Path("public/de-techtree/trees")
    if not tex_root.exists() or not trees.exists():
        print(f"❌ 找不到数据源：{tex_root} 或 {trees}", file=sys.stderr)
        return 2

    # 树里真正需要的编号
    need: dict[str, set[int]] = {k: set() for k in KINDS}
    for f in trees.glob("*.json"):
        o = json.loads(f.read_text(encoding="utf-8"))
        for e in o["buildings"] + o["units_techs"]:
            use, nt = e.get("Use Type"), e.get("Node Type") or ""
            kind = "Building" if (use == "Building" or "Building" in nt) else ("Tech" if use == "Tech" else "Unit")
            pi = e.get("Picture Index")
            if isinstance(pi, int) and pi >= 0:
                need[kind].add(pi)

    outroot = Path(args.outdir)
    manifest = {"size": args.size, "source": "widgetui/textures/ingame", "counts": {}, "missing": {}, "exported": {}}
    for kind, sub in KINDS.items():
        d = tex_root / sub
        outdir = outroot / kind
        outdir.mkdir(parents=True, exist_ok=True)
        done, missing, exported = 0, [], []
        for n in sorted(need[kind]):
            src = find_file(d, n) if d.exists() else None
            if src is None:
                missing.append(n)
                continue
            with Image.open(src) as im:
                im = im.convert("RGBA")
                if im.size != (args.size, args.size):
                    im = im.resize((args.size, args.size), Image.LANCZOS)
                im.save(outdir / f"{n}.png", "PNG", optimize=True)
            exported.append(n)
            done += 1
        manifest["counts"][kind] = {"need": len(need[kind]), "exported": done, "missing": len(missing)}
        manifest["missing"][kind] = missing
        manifest["exported"][kind] = exported          # 显式清单，渲染器直接读，不再靠推断
        print(f"{kind:9s} {sub:10s}: 需要 {len(need[kind]):3d}，导出 {done:3d}，缺 {len(missing)}")

    outroot.mkdir(parents=True, exist_ok=True)
    (outroot / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    total_need = sum(v["need"] for v in manifest["counts"].values())
    total_done = sum(v["exported"] for v in manifest["counts"].values())
    print(f"\n合计：需要 {total_need}，导出 {total_done}，缺 {total_need - total_done}")
    print(f"manifest → {outroot / 'manifest.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
