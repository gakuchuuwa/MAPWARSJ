"""
按城池对批量生成海路，写进 src/data/VectorSeaRouteData.ts。

🔴 用的是**和编辑器完全同一套算法**：sea_routes_combined.geojson 建图（SNAP 0.05°）→
   Dijkstra，远洋航段乘 OPEN_SEA_PENALTY=1.5（古代贴岸优先，见 SeaRouteEditor 的说明）。
   所以脚本生成的航线走向与手画的一致，不会出现「一条直线穿过大陆」。

用法：编辑下面的 PAIRS，然后 py tools/gen-sea-route.py
      已存在的（同一对城已有海路）会跳过，可以反复跑。
"""
import json
import math
import heapq
import os
import re
import time
from collections import defaultdict

COMBINED = 'public/assets/sea_routes_combined.geojson'
DATA = 'src/data/VectorSeaRouteData.ts'
CITIES = 'src/data/cities_v2.ts'
SNAP = 0.05
OPEN_SEA_PENALTY = 1.5   # 与 SeaRouteEditor.OPEN_SEA_PENALTY 保持一致

# (起点 cityId, 终点 cityId, 航线名) —— 名字用「起城-终城」，与既有数据一致
PAIRS = [
    # 葡萄牙「大西洋西南大迂回—南美沿岸南下」航线（1501 韦斯普奇船队）
    ('city_ribeira', 'city_lisiben', '里贝拉-里斯本'),          # 西非大迂回起点
    ('city_salvador', 'city_ribeira', '萨尔瓦多-里贝拉'),        # 借东北信风横渡，圣罗克角登陆
    ('city_guanabara', 'city_salvador', '瓜纳巴拉-萨尔瓦多'),     # 沿岸北上，葡属巴西首府
    ('city_guanabara', 'city_saovicente', '瓜纳巴拉-圣维森特'),   # 1565 葡军自圣维森特北上反击
    ('city_tucapel', 'city_saovicente', '图卡佩尔-圣维森特'),     # 绕合恩角，给图卡佩尔第二个方向
]


def load_cities():
    src = open(CITIES, encoding='utf-8').read()
    out = {}
    for m in re.finditer(r"id:\s*'(city_[a-z0-9_]+)',\s*name:\s*'([^']+)',\s*factionId:\s*'[^']+',"
                         r"\s*lat:\s*(-?[\d.]+),\s*lng:\s*(-?[\d.]+)", src):
        out[m.group(1)] = (m.group(2), float(m.group(3)), float(m.group(4)))
    return out


def haversine(a, b):
    (la1, lo1), (la2, lo2) = a, b
    R = 6371.0
    p1, p2 = math.radians(la1), math.radians(la2)
    dp = p2 - p1
    dl = math.radians(lo2 - lo1)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(min(1.0, math.sqrt(h)))


def build_graph():
    with open(COMBINED, encoding='utf-8') as fh:
        feats = json.load(fh)['features']
    adj = defaultdict(list)
    pos = {}
    key = lambda lat, lng: (round(lat / SNAP), round(lng / SNAP))
    for f in feats:
        src = f.get('properties', {}).get('source', 'marnet')
        geo = f['geometry']
        lines = geo['coordinates'] if geo['type'] == 'MultiLineString' else [geo['coordinates']]
        for line in lines:
            for i in range(len(line) - 1):
                p, q = line[i], line[i + 1]
                a, b = key(p[1], p[0]), key(q[1], q[0])
                if a == b:
                    continue
                pos[a] = (p[1], p[0])
                pos[b] = (q[1], q[0])
                d = haversine((p[1], p[0]), (q[1], q[0]))
                w = d * (OPEN_SEA_PENALTY if src == 'marnet' else 1.0)
                adj[a].append((b, w, d))
                adj[b].append((a, w, d))
    return adj, pos


def nearest(pos, lat, lng):
    best, bd = None, 1e18
    for n, (la, ln) in pos.items():
        d = (la - lat) ** 2 + ((ln - lng) * math.cos(math.radians(lat))) ** 2
        if d < bd:
            bd = d
            best = n
    return best, math.sqrt(bd) * 111


def dijkstra(adj, pos, s, t):
    dist = {s: 0.0}
    prev = {}
    pq = [(0.0, s)]
    done = set()
    while pq:
        d, u = heapq.heappop(pq)
        if u in done:
            continue
        done.add(u)
        if u == t:
            break
        for v, w, real in adj[u]:
            nd = d + w
            if nd < dist.get(v, 1e18):
                dist[v] = nd
                prev[v] = (u, real)
                heapq.heappush(pq, (nd, v))
    if t not in dist:
        return None, 0.0
    path, km, x = [t], 0.0, t
    while x != s:
        u, real = prev[x]
        km += real
        x = u
        path.append(x)
    path.reverse()
    return [pos[n] for n in path], km


def main():
    cities = load_cities()
    data = open(DATA, encoding='utf-8').read()
    adj, pos = build_graph()
    print(f'海路网 {len(pos)} 节点')

    blocks = []
    for a, b, name in PAIRS:
        if a not in cities or b not in cities:
            print(f'  ✗ {name}: 据点不存在（{a} / {b}）')
            continue
        if f'"{a}"' in data and f'"{b}"' in data and re.search(
                rf'startConnection:\s*"{a}",\s*endConnection:\s*"{b}"', data):
            print(f'  ⚪ {name}: 已存在，跳过')
            continue
        (_, la1, ln1), (_, la2, ln2) = cities[a], cities[b]
        s, ds = nearest(pos, la1, ln1)
        t, dt = nearest(pos, la2, ln2)
        coords, km = dijkstra(adj, pos, s, t)
        if not coords:
            print(f'  ✗ {name}: 海路网上不连通')
            continue
        # 两端补上城池本身的坐标，让航线真正连到据点
        pts = [[round(ln1, 5), round(la1, 5)]] + \
              [[round(ln, 5), round(la, 5)] for la, ln in coords] + \
              [[round(ln2, 5), round(la2, 5)]]
        # 去掉相邻重复点
        ded = [pts[0]]
        for p in pts[1:]:
            if p != ded[-1]:
                ded.append(p)
        rid = f'sea_{a}_{b}_{int(time.time() * 1000)}'
        coord_lines = ',\n'.join(f'                    [{p[0]}, {p[1]}]' for p in ded)
        blocks.append(f'''        {{
            type: "Feature",
            properties: {{
                name: "{name}",
                type: "sea",
                id: "{rid}",
                startConnection: "{a}",
                endConnection: "{b}"
            }},
            geometry: {{
                type: "LineString",
                coordinates: [
{coord_lines}
                ]
            }}
        }}''')
        print(f'  ✅ {name}: {len(ded)} 点 / {km:,.0f} km（两端离网 {ds:.0f}/{dt:.0f} km）')

    if not blocks:
        print('\n没有新增航线')
        return
    marker = '    ]\n};'
    if marker not in data:
        marker = '    ]\r\n};'
    assert marker in data, '找不到 features 数组结尾'
    # ⚠️ 最后一个 feature 后面**已经有逗号**（原数据是 trailing comma 风格），
    #    这里再补一个 ',' 会插出空元素 → TS 报「undefined 不能赋给 SeaRouteFeature」。踩过一次。
    data = data.replace(marker, ',\n'.join(blocks) + ',\n' + marker, 1)
    open(DATA, 'w', encoding='utf-8').write(data)
    print(f'\n写入 {DATA}：新增 {len(blocks)} 条海路')


if __name__ == '__main__':
    main()
