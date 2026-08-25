"""
从海陆掩膜烘出「沿岸航路网」——古代航海的贴岸航线。

🔴 [2026-08-25 主人定 C 方案：MARNET 打底保连通 + 沿岸网做古代航线] 这是第二步。

为什么需要它：MARNET 是**现代远洋商船网**，走的是大圆航线、动辄横穿大洋。
古代航海（桨帆船、罗盘之前）以**沿岸航行**为主 —— 白天看着陆地走、夜里靠岸抛锚，
横渡只在地中海、爱琴海这种视野可及的短程发生。只有 MARNET 会让海路一律走远洋直线，
不符合「符合历史」这条标准。

做法（全程用项目已有的数据，不引入新依赖）：
  1. 海陆掩膜取自 public/world/world-base.png —— R=0 且 G=0 即海面
     （与 WorldBaseMap.queryBaseTile 同一判据，一处真相，见 landsea-uses-esri-watermask）。
  2. 把陆地**膨胀 K 格**再取轮廓 → 轮廓天然落在离岸 K 格的海里，绝不会压在陆地上。
     K=2 ≈ 36km：古代船贴岸航行的典型距离（陆地始终在视野内）。
  3. Douglas-Peucker 简化（容差 0.5 格 ≈ 9km），把 4 万点压到 9 千点。
  4. **逐段验证不穿陆**：简化会切角，切过半岛就是一条穿越陆地的航线。
     每条线段按 0.4 格步长采样查掩膜，穿陆就对这条轮廓放宽一档重试，
     实在不行退回未简化的原始点 —— 宁可点多，不出错。

跑法：py tools/build-coastal-searoutes.py
"""
import json
import os

import numpy as np
import scipy.ndimage as ndi
from PIL import Image
from skimage import measure

SRC = 'public/world/world-base.png'
OUT = 'public/assets/sea_routes_coastal.geojson'

OFFSHORE_CELLS = 2      # 离岸格数（每格 ≈18km）→ 36km，古代贴岸航行的典型距离
SIMPLIFY_TOL = 0.5      # Douglas-Peucker 容差（格）≈9km
MIN_CONTOUR_PTS = 8     # 短于这个的轮廓丢掉（周长 <150km 的礁石，不值一条航路）
SAMPLE_STEP = 0.4       # 穿陆检查的采样步长（格）


def main():
    im = Image.open(SRC).convert('RGB')
    arr = np.array(im)
    H, W, _ = arr.shape
    cell_deg = 360.0 / W
    # R=0 且 G=0 = 海面（与 WorldBaseMap 同判据）
    land = ~((arr[:, :, 0] == 0) & (arr[:, :, 1] == 0))
    print(f'{W}x{H}  每格 {cell_deg:.4f}° ≈ {cell_deg * 111:.0f} km')
    print(f'陆地 {land.sum():,} 格 / 海 {(~land).sum():,} 格')

    grown = ndi.binary_dilation(land, np.ones((3, 3), bool), iterations=OFFSHORE_CELLS)
    contours = [c for c in measure.find_contours(grown.astype(float), 0.5)
                if len(c) >= MIN_CONTOUR_PTS]
    print(f'离岸 {OFFSHORE_CELLS} 格（≈{OFFSHORE_CELLS * cell_deg * 111:.0f} km）轮廓：'
          f'{len(contours)} 条 / {sum(len(c) for c in contours):,} 点')

    def crosses_land(poly):
        """线段中途是否压到陆地（简化切角的唯一风险）"""
        for i in range(len(poly) - 1):
            r0, c0 = poly[i]
            r1, c1 = poly[i + 1]
            dist = max(abs(r1 - r0), abs(c1 - c0))
            steps = int(dist / SAMPLE_STEP)
            for s in range(1, steps):
                t = s / steps
                r = int(round(r0 + (r1 - r0) * t))
                c = int(round(c0 + (c1 - c0) * t))
                if 0 <= r < H and land[r, c % W]:
                    return True
        return False

    feats = []
    retried = fallback = 0
    for cont in contours:
        chosen = None
        # 容差从松到紧；穿陆就收紧，实在不行用原始点
        for tol in (SIMPLIFY_TOL, SIMPLIFY_TOL / 2, SIMPLIFY_TOL / 4):
            simp = measure.approximate_polygon(cont, tol)
            if len(simp) < 3:
                continue
            if not crosses_land(simp):
                chosen = simp
                if tol != SIMPLIFY_TOL:
                    retried += 1
                break
        if chosen is None:
            chosen = cont
            fallback += 1
        coords = []
        for r, c in chosen:
            lat = 90.0 - (r / H) * 180.0
            lng = (c / W) * 360.0 - 180.0
            coords.append([round(lng, 5), round(lat, 5)])
        if len(coords) >= 2:
            feats.append({
                'type': 'Feature',
                'properties': {'source': 'coastal'},
                'geometry': {'type': 'LineString', 'coordinates': coords},
            })

    pts = sum(len(f['geometry']['coordinates']) for f in feats)
    print(f'简化后：{len(feats)} 条 / {pts:,} 点'
          f'（收紧容差 {retried} 条，退回原始点 {fallback} 条）')
    print('✅ 全部线段已验证不穿陆')

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as fh:
        json.dump({'type': 'FeatureCollection', 'features': feats}, fh,
                  ensure_ascii=False, separators=(',', ':'))
    print(f'写出 {OUT}  ({os.path.getsize(OUT) / 1024:.0f} KB)')


if __name__ == '__main__':
    main()
