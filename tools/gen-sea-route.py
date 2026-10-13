"""
按城池对批量生成海路，写进 src/data/VectorSeaRouteData.ts。

🔴 [2026-10-13] 寻路改用 tools/sea_route_core.py —— 与编辑器 SeaRouteEditor **完全同一套**
   （精细海陆掩膜判穿陆、港口接驳不翻陆、±180° 接合、视线拉直；两边实测 234 条逐条一致）。
   旧版只接最近一个节点、不查陆地，生成的海路会横穿陆地。

用法：编辑下面的 PAIRS，然后 py tools/gen-sea-route.py
      已存在的（同一对城已有海路）会跳过，可以反复跑。
"""
import re
import sys
import time

sys.path.insert(0, 'tools')
import sea_route_core as core  # noqa: E402

DATA = 'src/data/VectorSeaRouteData.ts'
CITIES = 'src/data/cities_v2.ts'

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


def main():
    cities = load_cities()
    data = open(DATA, encoding='utf-8').read()
    graph = core.SeaGraph()
    print(f'海路网 {len(graph.nodes)} 节点')

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
        ded, km = graph.route(la1, ln1, la2, ln2)
        if not ded:
            print(f'  ✗ {name}: 海路网上不连通')
            continue
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
        print(f'  ✅ {name}: {len(ded)} 点 / {km:,.0f} km（穿陆 {core.route_land_km(ded):.0f} km）')

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
