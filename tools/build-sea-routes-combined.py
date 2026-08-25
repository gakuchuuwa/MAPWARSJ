"""
把「MARNET 远洋主干」和「沿岸航路网」缝成编辑器实际用的那一张图。

🔴 [2026-08-25 主人定 C 方案] 第三步，也是编辑器真正读的文件。

两块料各司其职：
  · sea_routes_marnet.geojson  —— 远洋主干，100% 连通，已剔苏伊士/巴拿马/西北航道
  · sea_routes_coastal.geojson —— 沿岸航路，离岸 36km 绕着每块陆地走一圈，古代航海的主力

为什么必须缝：两者节点对不上（沿岸点到最近 MARNET 点的距离中位数 **105km**，
远超编辑器建图的 SNAP 0.05°≈5.5km），不缝的话就是两张互不相通的图 ——
点一个内陆海港到另一个大洋对岸的港口会直接找不到路。

缝法：沿着每条沿岸环**每隔 STITCH_EVERY 个点**找一次最近的 MARNET 点，
距离在 STITCH_MAX_KM 内就连一条接驳边。不是每个点都连 —— 那会多出几千条边，
既拖慢 Dijkstra 又让航线在近海反复横跳。

⚠️ 连不上的沿岸环会留成孤岛（离 MARNET 太远的偏远岛屿），脚本会把它们报出来。
   这在古代其实是对的（到不了就是到不了），但要知道有哪些，别当成 bug 查。

跑法（先跑那两个生成脚本）：
    py tools/build-sea-routes-marnet.py
    py tools/build-coastal-searoutes.py
    py tools/build-sea-routes-combined.py
"""
import json
import math
import os
from collections import defaultdict

import numpy as np
from scipy.spatial import cKDTree

MARNET = 'public/assets/sea_routes_marnet.geojson'
COASTAL = 'public/assets/sea_routes_coastal.geojson'
OUT = 'public/assets/sea_routes_combined.geojson'

STITCH_EVERY = 10       # 沿岸环上每隔几个点尝试接驳一次（≈90km 一个接口）
STITCH_MAX_KM = 120.0   # 超过这个距离不接驳（中位数 105km，给一点余量）
SNAP = 0.05             # 与 SeaRouteEditor.buildGraphFromGeoJSON 同口径


def load(path):
    with open(path, encoding='utf-8') as fh:
        return json.load(fh)['features']


def lines_of(geo):
    t = geo.get('type')
    if t == 'LineString':
        return [geo['coordinates']]
    if t == 'MultiLineString':
        return geo['coordinates']
    return []


def equirect(pts):
    """等距近似投影：经度按 cos(lat) 压缩，供 KD 树按真实距离找最近点"""
    arr = np.asarray(pts, dtype=float)
    return np.c_[arr[:, 0] * np.cos(np.radians(arr[:, 1])), arr[:, 1]]


def components(feats, snap=SNAP):
    adj = defaultdict(set)
    pos = {}
    key = lambda lat, lng: (round(lat / snap), round(lng / snap))
    for f in feats:
        for line in lines_of(f['geometry']):
            for i in range(len(line) - 1):
                a = key(line[i][1], line[i][0])
                b = key(line[i + 1][1], line[i + 1][0])
                if a == b:
                    continue
                pos[a] = (line[i][1], line[i][0])
                pos[b] = (line[i + 1][1], line[i + 1][0])
                adj[a].add(b)
                adj[b].add(a)
    seen = set()
    groups = []
    for n in list(adj):
        if n in seen:
            continue
        stack = [n]
        seen.add(n)
        pts = []
        while stack:
            x = stack.pop()
            pts.append(x)
            for y in adj[x]:
                if y not in seen:
                    seen.add(y)
                    stack.append(y)
        groups.append(pts)
    groups.sort(key=len, reverse=True)
    return groups, pos


def main():
    for p in (MARNET, COASTAL):
        if not os.path.exists(p):
            print(f'缺 {p} —— 先跑对应的生成脚本')
            raise SystemExit(1)

    marnet = load(MARNET)
    coastal = load(COASTAL)
    print(f'MARNET {len(marnet)} 条 / 沿岸 {len(coastal)} 条')

    # MARNET 全部顶点建 KD 树
    mpts = []
    for f in marnet:
        for line in lines_of(f['geometry']):
            mpts.extend(line)
    mpts = np.asarray(mpts, dtype=float)
    tree = cKDTree(equirect(mpts))
    print(f'MARNET 顶点 {len(mpts):,}，建树完成')

    stitches = []
    linked_rings = 0
    for f in coastal:
        ring_linked = False
        for line in lines_of(f['geometry']):
            cand = line[::STITCH_EVERY]
            if not cand:
                continue
            d, idx = tree.query(equirect(cand))
            for j, (dist, mi) in enumerate(zip(d, idx)):
                if dist * 111.0 > STITCH_MAX_KM:
                    continue
                a = cand[j]
                b = mpts[mi].tolist()
                stitches.append({
                    'type': 'Feature',
                    'properties': {'source': 'stitch'},
                    'geometry': {'type': 'LineString',
                                 'coordinates': [[round(a[0], 5), round(a[1], 5)],
                                                 [round(b[0], 5), round(b[1], 5)]]},
                })
                ring_linked = True
        if ring_linked:
            linked_rings += 1
    print(f'接驳边 {len(stitches)} 条；{linked_rings}/{len(coastal)} 条沿岸环已接入主干')

    feats = marnet + coastal + stitches
    groups, pos = components(feats)
    total = sum(len(g) for g in groups)
    print(f'\n合并后（SNAP {SNAP}°，与编辑器同口径）：')
    print(f'  {total:,} 节点 / {len(groups)} 个连通分量，最大 {len(groups[0]):,} 占 '
          f'{len(groups[0]) / total * 100:.1f}%')
    if len(groups) > 1:
        print(f'  连不上主干的碎片（古代到不了的偏远海域，不是 bug）：')
        for g in groups[1:11]:
            lats = [pos[p][0] for p in g]
            lngs = [pos[p][1] for p in g]
            print(f'    {len(g):>5} 节点  lat {min(lats):6.1f}~{max(lats):5.1f}  '
                  f'lng {min(lngs):7.1f}~{max(lngs):6.1f}')
        if len(groups) > 11:
            print(f'    …… 另有 {len(groups) - 11} 个')

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as fh:
        json.dump({'type': 'FeatureCollection', 'features': feats}, fh,
                  ensure_ascii=False, separators=(',', ':'))
    print(f'\n写出 {OUT}  ({os.path.getsize(OUT) / 1024:.0f} KB，{len(feats)} 条要素)')


if __name__ == '__main__':
    main()
