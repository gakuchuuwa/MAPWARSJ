#!/usr/bin/env python3
"""
DE 船帆（sail）素材提取 → public/SUCAI_SAIL/<GROUP>/<TIER>/idle_<dir>.png + _meta.json

背景（2026-10-30 主人「我们的船都没有解析帆，是吗？」→「请执行」；同日复核修正）：
  DE 的船**帆不在船体里**，是独立素材 drs/graphics/u_shp_sail_<group>_<boat|ship>_<tier>_x1.sld，
  共 10 个文化组 × 12 个图层组件（boat_2..6、ship_2..8）。
  - SLD 480 帧 = 16 向 × 30 帧（每向首帧 = de_angle * 30）。
  - 游戏方向 d（0..15）与船体 SLD 完全同源：de_angle = (d - 2) % 16 ⇔ d = (de_angle + 2) % 16。
  - boat_4 / ship_5 为主桅帆（16 向全有）；其余为副桅/尾桅/斜桁帆的前后半圈成对图层
    （boat_2/5、ship_2/3/6 存 de_angle 0..7；boat_3/6、ship_4/7/8 存 de_angle 8..15）。
  - 每帧按 main 图层 (x1, y1, x2, y2) 裁切，并在 _meta.json 记录精确热点 (hx - x1, hy - y1)，
    与船体 _meta.json 同坐标系，叠加时直接按 .dat 的 delta offset_y 对齐。

用法：
  python tools/extract_sail_assets.py            # 全量
  python tools/extract_sail_assets.py --probe    # 只打印清单
"""
import os
import sys
import json

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(HERE, 'sld'))
from sld_extract import parse_sld, render_main_to_canvas  # noqa: E402
from PIL import Image  # noqa: E402

DE_DIR = r"C:\Program Files (x86)\Steam\steamapps\common\AoE2DE\resources\_common\drs\graphics"
OUT_ROOT = os.path.join(ROOT, 'public', 'SUCAI_SAIL')

GROUPS = ['afri', 'asia', 'ceas', 'east', 'medi', 'meso', 'orie', 'seas', 'slav', 'west']


def sail_sld(group: str, kind: str, tier: int) -> str:
    return os.path.join(DE_DIR, f'u_shp_sail_{group}_{kind}_{tier}_x1.sld')


def extract(group: str, kind: str, tier: int, out_dir: str) -> dict:
    path = sail_sld(group, kind, tier)
    _ver, frames = parse_sld(path)
    os.makedirs(out_dir, exist_ok=True)
    # 清理旧文件，避免半圈图层残留旧编号的 idle_*.png
    for fn in os.listdir(out_dir):
        if fn.endswith('.png'):
            os.remove(os.path.join(out_dir, fn))

    dirs = {}
    for de_a in range(16):
        idx = de_a * 30
        if idx >= len(frames):
            continue
        cw, ch, hx, hy, ftype, fidx, layers = frames[idx]
        if 'main' not in layers:
            continue
        x1, y1, x2, y2, w, h, *_ = layers['main']
        if w <= 0 or h <= 0:
            continue
        d = (de_a + 2) % 16
        img = Image.frombytes('RGBA', (cw, ch), render_main_to_canvas(layers, cw, ch))
        crop = img.crop((x1, y1, x2, y2))
        crop.save(os.path.join(out_dir, f'idle_{d}.png'))
        dirs[str(d)] = {'fw': w, 'fh': h, 'hx': hx - x1, 'hy': hy - y1}

    meta = {
        'source': 'AoE2 DE SLD',
        'dePrefix': f'u_shp_sail_{group}_{kind}_{tier}',
        'dirs16': True,
        'idle': {'frames': 1, 'dirs': dirs},
    }
    with open(os.path.join(out_dir, '_meta.json'), 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False)
    return dirs


def main() -> int:
    probe = '--probe' in sys.argv
    total = 0
    for group in GROUPS:
        for kind, tiers in (('boat', (2, 3, 4, 5, 6)), ('ship', (2, 3, 4, 5, 6, 7, 8))):
            for tier in tiers:
                path = sail_sld(group, kind, tier)
                if not os.path.exists(path):
                    print(f'  ❌ 缺素材 {group}/{kind}_{tier}')
                    continue
                name = f'{kind}_{tier}'
                if probe:
                    print(f'  {group}/{name}  {os.path.basename(path)}')
                    total += 1
                    continue
                dirs = extract(group, kind, tier, os.path.join(OUT_ROOT, group.upper(), name))
                print(f'  ✅ {group}/{name}  向数 {len(dirs)}')
                total += 1
    print(f'完成 {total} 套' + ('（probe）' if probe else ''))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
