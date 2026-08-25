"""
把 MARNET 全球海运网络烘成游戏用的海图线路（年代正确版）。

🔴 [2026-08-25 主人定 C 方案：MARNET 打底保连通 + 沿岸网做古代航线] 这是第一步。

为什么换掉原来的 public/assets/sea_routes.geojson：
  · 它是 **314 条现代渡轮 + 239 条商业航线**，途经苏伊士 90 个顶点、巴拿马 48 个 ——
    这两条运河在游戏年代都不存在；553 条里只有 30 条有名字，还都是 "22"/"55" 这种编号。
  · 更要命的是**图是碎的**：152 个连通分量，最大分量只占 34.8%。而这份数据不只是背景参考，
    `SeaRouteEditor` 就是拿它建图 Dijkstra 找路的 —— 两个港口落在不同分量就直接找不到路。

MARNET 的实测对比（同一套指标，SNAP 0.05°）：
    连通分量  152 个 → **1 个**        主网占比  34.8% → **100%**
    顶点     33812  → 20046（更精简）

关键是它把运河和海峡单独标了 `passage`，所以能精确剔除年代不符的通道。

源数据：genthalili/searoute-py（MIT）
  https://raw.githubusercontent.com/genthalili/searoute-py/main/searoute/data/marnet_searoute.geojson
下载到 scratch/searoute_eval/marnet.geojson 后跑本脚本。

跑法：py tools/build-sea-routes-marnet.py
"""
import json
import math
import os
from collections import defaultdict

SRC = 'scratch/searoute_eval/marnet.geojson'
OUT = 'public/assets/sea_routes_marnet.geojson'
SRC_URL = ('https://raw.githubusercontent.com/genthalili/searoute-py/main/'
           'searoute/data/marnet_searoute.geojson')

# 🔴 年代门：这些 passage 在游戏年代（古代~中世纪）不存在或不可通行，一律剔除。
#    判据是「符合历史」，逐条给理由，别再凭印象加减。
BLOCKED = {
    'suez':      '苏伊士运河 1869 年通航；此前地中海↔红海必须绕好望角或走陆路转运',
    'panama':    '巴拿马运河 1914 年通航；此前大西洋↔太平洋必须绕合恩角',
    'northwest': '西北航道为北极冰封水道，1906 年才首次通过，古代无法通行',
}
# 保留但值得知道的：bering（白令海峡最窄 82km，古代小船理论可渡，是旧大陆↔美洲唯一近距连接，
#   删了美洲会与旧大陆彻底断航）；south_africa（好望角）、chili（合恩角）是绕行主干，必须留；
#   gibraltar/bosporus/dardanelles/babalmandab/ormuz/malacca/sunda 全是古代就通航的真海峡。


def lines_of(geo):
    t = geo.get('type')
    if t == 'LineString':
        return [geo['coordinates']]
    if t == 'MultiLineString':
        return geo['coordinates']
    return []


def haversine(a, b):
    (la1, lo1), (la2, lo2) = a, b
    R = 6371.0
    p1, p2 = math.radians(la1), math.radians(la2)
    dp = p2 - p1
    dl = math.radians(lo2 - lo1)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(min(1.0, math.sqrt(h)))


def components(feats, snap=0.05):
    """与 SeaRouteEditor.buildGraphFromGeoJSON 同口径（SNAP 0.05°≈5km）"""
    adj = defaultdict(set)
    nodes = set()
    key = lambda lat, lng: (round(lat / snap), round(lng / snap))
    for f in feats:
        for line in lines_of(f['geometry']):
            for i in range(len(line) - 1):
                a = key(line[i][1], line[i][0])
                b = key(line[i + 1][1], line[i + 1][0])
                if a == b:
                    continue
                adj[a].add(b)
                adj[b].add(a)
                nodes.add(a)
                nodes.add(b)
    seen = set()
    comps = []
    for n in nodes:
        if n in seen:
            continue
        stack = [n]
        seen.add(n)
        c = 0
        while stack:
            x = stack.pop()
            c += 1
            for y in adj[x]:
                if y not in seen:
                    seen.add(y)
                    stack.append(y)
        comps.append(c)
    comps.sort(reverse=True)
    return comps, len(nodes)


def keep_main_component(feats, snap=0.05):
    """只留最大连通分量。返回过滤后的要素列表，并打印被剔掉的碎片范围。"""
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
    if len(groups) <= 1:
        return feats
    groups.sort(key=len, reverse=True)
    main_nodes = set(groups[0])
    for pts in groups[1:]:
        lats = [pos[p][0] for p in pts]
        lngs = [pos[p][1] for p in pts]
        print(f'  剔除孤岛 {len(pts)} 节点：lat {min(lats):.1f}~{max(lats):.1f} '
              f'lng {min(lngs):.1f}~{max(lngs):.1f}（游戏城池最北 lat 59.9，够不到）')
    out = []
    for f in feats:
        hit = False
        for line in lines_of(f['geometry']):
            for c in line:
                if key(c[1], c[0]) in main_nodes:
                    hit = True
                    break
            if hit:
                break
        if hit:
            out.append(f)
    return out


def main():
    if not os.path.exists(SRC):
        print(f'找不到源数据 {SRC}')
        print(f'先下载：curl -sL -o {SRC} "{SRC_URL}"')
        raise SystemExit(1)

    with open(SRC, encoding='utf-8') as fh:
        src = json.load(fh)
    feats = src['features']

    kept, dropped = [], defaultdict(int)
    for f in feats:
        p = f.get('properties', {}).get('passage')
        if p in BLOCKED:
            dropped[p] += 1
            continue
        kept.append({
            'type': 'Feature',
            # 保留 passage：将来要按年代开关某条海峡（封锁/结冰）就靠它
            'properties': {'source': 'marnet', 'passage': p},
            'geometry': f['geometry'],
        })

    print(f'源要素 {len(feats)} → 保留 {len(kept)}')
    for k, n in dropped.items():
        print(f'  剔除 {k} ×{n} —— {BLOCKED[k]}')

    # 🔴 剔完冰封航道后，被它连着的北极水域会变成孤岛（实测 47 节点，lat 66.2~74.8，
    #    加拿大北极群岛）。游戏城池最北 lat 59.9，够不到；留着只会让编辑器的图永远是
    #    2 个连通分量，日后查连通性还得再解释一遍。所以只保留主网。
    kept = keep_main_component(kept)

    comps, total = components(kept)
    print(f'\n连通性（SNAP 0.05°，与编辑器同口径）：')
    print(f'  {total} 节点 / {len(comps)} 个连通分量，最大 {comps[0]} 占 {comps[0] / total * 100:.1f}%')
    if len(comps) > 1:
        print(f'  ⚠️ 不是全连通，前 8 个分量：{comps[:8]}')

    out = {'type': 'FeatureCollection', 'features': kept}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as fh:
        json.dump(out, fh, ensure_ascii=False, separators=(',', ':'))
    print(f'\n写出 {OUT}  ({os.path.getsize(OUT) / 1024:.0f} KB)')


if __name__ == '__main__':
    main()
