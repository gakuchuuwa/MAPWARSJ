"""
海路寻路核心 —— 与 src/sea/SeaRouteEditor.ts 同一套算法（改一边必须改另一边）。

  · 航线网：public/assets/sea_routes_combined.geojson，SNAP 0.05° 合点
  · 选路代价 = 真实公里 ×（远洋 marnet 1.5）+ 穿陆公里 × LAND_KM_COST
    （穿陆按 public/world/land-mask-ne10m.png 量；只加代价不删边 —— 窄海峡在掩膜上可能是陆）
  · 港口接驳（离城最近 PORT_POOL 个节点；接驳线水上部分 ≤ max(LINK_SEA_MAX_KM, 最近接驳点的 1.5 倍)）：
      港口城（有接驳点：出城连续陆地 ≤PORT_LAND_ALLOWANCE_KM、见水后不再上陆）→ 只许水路接驳，代价 = 公里；
      内陆城/河港（一个都没有）→ 陆路段每公里按 INLAND_LAND_FACTOR 计，取总行程最合理的出海口
  · 起点全部接驳节点作源点、终点接驳代价作终端代价，一次 Dijkstra 取总代价最小
  · 视线拉直：航线网段两点直线全在水上且 ≤SHORTCUT_MAX_KM 就去掉中间的点（沿岸网绕圈/折返的地方）
"""
import heapq
import json
import math

import numpy as np
from PIL import Image

COMBINED = 'public/assets/sea_routes_combined.geojson'
MASK = 'public/world/land-mask-ne10m.png'
SNAP = 0.05
OPEN_SEA_PENALTY = 1.5
LAND_KM_COST = 50
PORT_LAND_ALLOWANCE_KM = 25
INLAND_LAND_FACTOR = 10   # 内陆城/河港出海那段陆路：1 公里陆路 ≈ 3 公里海路
PORT_POOL = 60
LINK_SEA_MAX_KM = 80     # 接驳线水上部分上限（或最近接驳点的 1.5 倍，取大）：就近入网，不许拿接驳线抄近道
PORT_MAX_KM = 600
SAMPLE_KM = 1.0
SHORTCUT_MAX_KM = 150   # 视线拉直：两点直线全程在水上且不超过这个长度，就去掉中间绕圈的点

_mask = np.array(Image.open(MASK).convert('1'), dtype=bool)
_MH, _MW = _mask.shape
_RES = 180.0 / _MH


def is_land(lat, lng):
    y = min(_MH - 1, max(0, int((90 - lat) / _RES)))
    x = int(math.floor((lng + 180) / _RES)) % _MW
    return bool(_mask[y, x])


def haversine(la1, lo1, la2, lo2):
    p1, p2 = math.radians(la1), math.radians(la2)
    h = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(lo2 - lo1) / 2) ** 2
    return 2 * 6371.0 * math.asin(min(1.0, math.sqrt(h)))


def _near_lng(b_lng, a_lng):
    """跨 180° 经线时把 b 的经度换到 a 的同一侧，线性插值才不会绕地球一圈"""
    if b_lng - a_lng > 180:
        return b_lng - 360
    if b_lng - a_lng < -180:
        return b_lng + 360
    return b_lng


def land_km(a, b, skip_km=0.0):
    """a→b（[lng,lat]）直线压在陆地上的公里数；离 a 不足 skip_km 的部分不计"""
    d = haversine(a[1], a[0], b[1], b[0])
    b = [_near_lng(b[0], a[0]), b[1]]
    n = max(2, math.ceil(d / SAMPLE_KM))
    k = 0
    for i in range(1, n):
        t = i / n
        if t * d < skip_km:
            continue
        if is_land(a[1] + (b[1] - a[1]) * t, a[0] + (b[0] - a[0]) * t):
            k += 1
    return k * d / n


def link_land_km(city, node):
    """城→节点（[lng,lat]）接驳线：(出城那段连续陆地公里, 见水之后又压上陆地的公里)"""
    d = haversine(city[1], city[0], node[1], node[0])
    node = [_near_lng(node[0], city[0]), node[1]]
    n = max(2, math.ceil(d / SAMPLE_KM))
    first, later, left_land = 0, 0, False
    for i in range(1, n):
        t = i / n
        on_land = is_land(city[1] + (node[1] - city[1]) * t, city[0] + (node[0] - city[0]) * t)
        if not left_land and on_land:
            first += 1
        elif on_land:
            later += 1
        else:
            left_land = True
    return first * d / n, later * d / n


def link_overland_km(city, node):
    """接驳线算作穿陆的公里：出城连续陆地超出 PORT_LAND_ALLOWANCE_KM 的部分 + 见水之后的陆地"""
    first, later = link_land_km(city, node)
    return max(0.0, first - PORT_LAND_ALLOWANCE_KM) + later


def route_land_km(coords):
    """整条海路的穿陆公里数（两端只免算出城那段 ≤PORT_LAND_ALLOWANCE_KM 的连续陆地）"""
    n = len(coords)
    if n < 2:
        return 0.0
    if n == 2:
        return link_overland_km(coords[0], coords[1])
    tot = link_overland_km(coords[0], coords[1]) + link_overland_km(coords[-1], coords[-2])
    for i in range(1, n - 2):
        tot += land_km(coords[i], coords[i + 1])
    return tot


def straighten(coords):
    """视线拉直（只动航线网那一段，两端接驳线不动）：从每个点出发，跳到最远的「直线全在水上、≤SHORTCUT_MAX_KM」的点"""
    if len(coords) <= 4:
        return coords
    mid = coords[1:-1]
    out = [mid[0]]
    i = 0
    while i < len(mid) - 1:
        j = len(mid) - 1
        while j > i + 1:
            a, b = mid[i], mid[j]
            if haversine(a[1], a[0], b[1], b[0]) <= SHORTCUT_MAX_KM and land_km(a, b) == 0:
                break
            j -= 1
        out.append(mid[j])
        i = j
    return [coords[0]] + out + [coords[-1]]


def path_km(coords):
    return sum(haversine(coords[i][1], coords[i][0], coords[i + 1][1], coords[i + 1][0]) for i in range(len(coords) - 1))


class SeaGraph:
    def __init__(self):
        with open(COMBINED, encoding='utf-8') as fh:
            feats = json.load(fh)['features']
        self.nodes = []
        self.adj = []
        idx = {}

        def node(lat, lng):
            # 航线网在 180° 经线断成 +180 / -180 两头：合成同一个点，太平洋才连得通
            k = (round(lat / SNAP), (round(lng / SNAP) + 3600) % 7200 - 3600)
            if k not in idx:
                idx[k] = len(self.nodes)
                self.nodes.append((lat, lng))
                self.adj.append([])
            return idx[k]

        for f in feats:
            src = f.get('properties', {}).get('source', 'marnet')
            g = f['geometry']
            for line in (g['coordinates'] if g['type'] == 'MultiLineString' else [g['coordinates']]):
                for i in range(len(line) - 1):
                    p, q = line[i], line[i + 1]
                    a, b = node(p[1], p[0]), node(q[1], q[0])
                    if a == b:
                        continue
                    d = haversine(p[1], p[0], q[1], q[0])
                    if d < 0.01:
                        continue
                    w = d * (OPEN_SEA_PENALTY if src == 'marnet' else 1.0) + land_km(p, q) * LAND_KM_COST
                    self.adj[a].append((b, w, d))
                    self.adj[b].append((a, w, d))
        self._lat = np.radians(np.array([n[0] for n in self.nodes]))
        self._lng = np.array([n[1] for n in self.nodes])

    def port_links(self, lat, lng):
        """港口接驳：离城最近 PORT_POOL 个节点（≤PORT_MAX_KM），每个带接驳代价与真实公里"""
        p1 = math.radians(lat)
        dl = np.radians(self._lng - lng)
        dd = 2 * 6371.0 * np.arcsin(np.minimum(1, np.sqrt(
            np.sin((self._lat - p1) / 2) ** 2 + math.cos(p1) * np.cos(self._lat) * np.sin(dl / 2) ** 2)))
        order = np.argsort(dd)
        pool = [int(i) for i in order[:PORT_POOL] if dd[i] <= PORT_MAX_KM] or [int(order[0])]
        land = {i: link_land_km([lng, lat], [self.nodes[i][1], self.nodes[i][0]]) for i in pool}
        sea = {i: dd[i] - land[i][0] - land[i][1] for i in pool}
        clean = [i for i in pool if land[i][0] <= PORT_LAND_ALLOWANCE_KM and land[i][1] < 3]
        cands = clean or pool
        # 航线网稀疏的海湾（如巴拿马湾）最近的节点也远：上限放宽到最近那个的 1.5 倍
        cap = max(LINK_SEA_MAX_KM, 1.5 * min(sea[i] for i in cands))
        cands = [i for i in cands if sea[i] <= cap]
        if clean:   # 港口城：只许水路接驳
            return {i: (float(dd[i]), float(dd[i])) for i in cands}
        # 内陆城/河港：陆路段按 INLAND_LAND_FACTOR 计，取总行程最合理的出海口
        return {i: (float(dd[i]) + (land[i][0] + land[i][1]) * (INLAND_LAND_FACTOR - 1), float(dd[i])) for i in cands}

    def route(self, lat1, lng1, lat2, lng2):
        """城→城海路 [[lng,lat],...]（含两端城坐标）与真实公里；不连通返回 (None, 0)。
        起点接驳节点全部作源点（初值 = 接驳代价），终点接驳代价作终端代价，一次 Dijkstra 取总代价最小。"""
        starts = self.port_links(lat1, lng1)
        ends = self.port_links(lat2, lng2)
        dist, prev, seen = {}, {}, set()
        pq = []
        for i, (w, _) in starts.items():
            dist[i] = w
            heapq.heappush(pq, (w, i))
        best_cost, best_end = math.inf, None
        while pq:
            d, u = heapq.heappop(pq)
            if u in seen:
                continue
            if d >= best_cost:
                break
            seen.add(u)
            if u in ends and d + ends[u][0] < best_cost:
                best_cost, best_end = d + ends[u][0], u
            for v, w, real in self.adj[u]:
                nd = d + w
                if nd < dist.get(v, math.inf):
                    dist[v] = nd
                    prev[v] = (u, real)
                    heapq.heappush(pq, (nd, v))
        if best_end is None:
            return None, 0.0
        path, km, c = [best_end], ends[best_end][1], best_end
        while c in prev:
            u, real = prev[c]
            km += real
            c = u
            path.append(c)
        km += starts[c][1]
        path.reverse()
        pts = [[round(lng1, 5), round(lat1, 5)]] +               [[round(self.nodes[i][1], 5), round(self.nodes[i][0], 5)] for i in path] +               [[round(lng2, 5), round(lat2, 5)]]
        ded = [pts[0]]
        for p in pts[1:]:
            if p != ded[-1]:
                ded.append(p)
        ded = straighten(ded)
        return ded, path_km(ded)
