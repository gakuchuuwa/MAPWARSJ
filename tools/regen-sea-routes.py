"""
重生成穿陆的已存海路（src/data/VectorSeaRouteData.ts）。

🔴 [2026-10-13 主人问「为什么道路编辑器中有的海路会横穿陆地」，授权全权修复]
   算法 = tools/sea_route_core.py = 海路编辑器 SeaRouteEditor（两边实测逐条一致）。
   只换「旧线穿陆 ≥ MIN_OLD_LAND_KM，且新线至少少穿 MIN_GAIN_KM」的海路；其余原样保留（手调过的线不动）。
   只换坐标 —— 名称 / id / 起止城 / 年份等属性一律不碰。

跑法：py tools/regen-sea-routes.py          只出报告，不写文件
      py tools/regen-sea-routes.py --write  写回 VectorSeaRouteData.ts
"""
import re
import sys

sys.path.insert(0, 'tools')
import sea_route_core as core  # noqa: E402

DATA = 'src/data/VectorSeaRouteData.ts'
CITIES = 'src/data/cities_v2.ts'
MIN_OLD_LAND_KM = 5
MIN_GAIN_KM = 5


def load_cities():
    src = open(CITIES, encoding='utf-8').read()
    out = {}
    for m in re.finditer(r"id:\s*'(city_[a-z0-9_]+)',\s*name:\s*'([^']+)',\s*factionId:\s*'[^']+',"
                         r"\s*lat:\s*(-?[\d.]+),\s*lng:\s*(-?[\d.]+)", src):
        out[m.group(1)] = (m.group(2), float(m.group(3)), float(m.group(4)))
    return out


COORDS_RE = re.compile(r'(coordinates:\s*\[)(\r?\n)(.*?)(\r?\n)([ \t]*\])', re.S)


def main():
    write = '--write' in sys.argv
    cities = load_cities()
    with open(DATA, encoding='utf-8', newline='') as fh:
        text = fh.read()
    graph = core.SeaGraph()

    starts = [m.start() for m in re.finditer(r'type:\s*"Feature"', text)] + [len(text)]
    pieces, last = [], 0
    rows, changed = [], 0
    for k in range(len(starts) - 1):
        a, b = starts[k], starts[k + 1]
        block = text[a:b]
        fid = re.search(r'id:\s*"([^"]+)"', block).group(1)
        name = re.search(r'name:\s*"([^"]+)"', block).group(1)
        s_id = re.search(r'startConnection:\s*"([^"]+)"', block)
        e_id = re.search(r'endConnection:\s*"([^"]+)"', block)
        m = COORDS_RE.search(block)
        old = [[float(x), float(y)] for x, y in re.findall(r'\[\s*(-?[\d.eE+-]+)\s*,\s*(-?[\d.eE+-]+)\s*\]', m.group(3))]
        if not (s_id and e_id) or s_id.group(1) not in cities or e_id.group(1) not in cities:
            rows.append((name, '跳过：起止城不明'))
            continue
        (_, la1, ln1), (_, la2, ln2) = cities[s_id.group(1)], cities[e_id.group(1)]
        old_land = core.route_land_km(old)
        if old_land < MIN_OLD_LAND_KM:
            continue
        new, _ = graph.route(la1, ln1, la2, ln2)
        if not new:
            rows.append((name, f'保留：航线网不连通（旧穿陆 {old_land:.0f}km）'))
            continue
        new_land = core.route_land_km(new)
        if new_land > old_land - MIN_GAIN_KM:
            rows.append((name, f'保留：新线没更好（穿陆 {old_land:.0f} → {new_land:.0f}km）'))
            continue
        changed += 1
        rows.append((name, f'替换：穿陆 {old_land:.0f} → {new_land:.0f}km，航程 {core.path_km(old):.0f} → {core.path_km(new):.0f}km，'
                           f'{len(old)} → {len(new)} 点'))
        indent = re.search(r'\n([ \t]*)\[', m.group(2) + m.group(3)).group(1)
        nl = m.group(2)
        body = nl.join(f'{indent}[{p[0]}, {p[1]}],' for p in new)
        new_block = block[:m.start(3)] + body + block[m.end(3):]
        pieces.append(text[last:a])
        pieces.append(new_block)
        last = b

    for name, msg in rows:
        print(f'  {name}: {msg}')
    print(f'\n共 {len(starts) - 1} 条；替换 {changed} 条；保留 {sum(1 for _, m in rows if m.startswith("保留"))} 条（其余穿陆 <{MIN_OLD_LAND_KM}km 不动）')
    if write and changed:
        pieces.append(text[last:])
        with open(DATA, 'w', encoding='utf-8', newline='') as fh:
            fh.write(''.join(pieces))
        print(f'已写入 {DATA}')


if __name__ == '__main__':
    main()
