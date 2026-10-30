#!/usr/bin/env python3
"""
DE 船帆（sail）素材提取 → public/SUCAI_SAIL/<GROUP>/<TIER>/idle_<dir>.png + _meta.json

背景（2026-10-30 主人「我们的船都没有解析帆，是吗？」→「请执行」）：
  DE 的船**帆不在船体里**，是独立素材 drs/graphics/u_shp_sail_<group>_<boat|ship>_<tier>_x1.sld，
  共 10 个文化组 × 12 档。船体只有桅杆索具，帆要另取另叠 —— 我们过去只解了船体，
  所以战船在海上全是光桅杆。本脚本把 120 套帆解成 16 向逐帧 PNG，供渲染叠加。

SLD 帧结构：480 帧 = 16 向 × 30 帧（dat: angles=16, frames=30），
  实际带图层的内容帧按 for d in 0..15: base + d*30 取首帧（其余为该向的摆动帧）。

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


def dir_frames(frames):
    """返回 {dir: 首帧索引}。

    SLD 480 帧 = 16 向 × 30 帧，但每套只有 **8 个方向**有内容，且这 8 向
    有的落在前半（帧 0..239）、有的落在后半（帧 240..479）——
    实测 medi_ship_2 是 0 起、west_ship_4 是 240 起。所以先找第一个有图层的帧，
    再按 30 帧步长取满 8 向，输出统一编号 0..7（键名与 DE 帧号解耦）。
    """
    first = next((i for i, f in enumerate(frames) if 'main' in f[6]), None)
    if first is None:
        return {}
    out = {}
    for d in range(8):
        base = first + d * 30
        for k in range(30):
            i = base + k
            if i < len(frames) and 'main' in frames[i][6]:
                out[d] = i
                break
    return out


def extract(group: str, kind: str, tier: int, out_dir: str) -> dict:
    path = sail_sld(group, kind, tier)
    _ver, frames = parse_sld(path)
    picks = dir_frames(frames)
    dirs = {}
    os.makedirs(out_dir, exist_ok=True)
    for d, idx in picks.items():
        cw, ch, hx, hy, ftype, fidx, layers = frames[idx]
        img = Image.frombytes('RGBA', (cw, ch), render_main_to_canvas(layers, cw, ch))
        bb = img.getbbox()
        if not bb:
            continue
        crop = img.crop(bb)
        crop.save(os.path.join(out_dir, f'idle_{d}.png'))
        dirs[str(d)] = {'fw': crop.width, 'fh': crop.height}
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
