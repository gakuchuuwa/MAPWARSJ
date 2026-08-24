"""
检查：全世界 922 座城，按真实气候落到 7 张攻城战底图上，合不合理。

7 张底图（DE 官方中文名）：
    泥地 / 泥地2 / 泥地3 / 泥地4 / 泥地，污泥 / 泥地，大草原 / 雪地，地基

检查什么：
  1. 覆盖 —— 有没有城落不到任何一张上
  2. 分布 —— 有没有哪张吃掉绝大多数城（说明分得太粗）
  3. 合理性 —— 逐城抽查，有没有明显违背常识的（岭南判成沙漠之类）

跑法：py tools/check-siege-bases.py
"""
import json
import re
import warnings
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np
import tifffile
from PIL import Image

warnings.filterwarnings("ignore")

# 地面类型 + 降水 → 攻城战底图
#
# 🔴 [主人定] 泥地1（纯净黄土、无草）只给**真正的极旱绿洲城**，不能用得太宽泛。
#    第一版光按地面类型映射，把蒙古草原南部、中亚半干旱区都塞进了泥地1（148 座城），
#    那些地方是有草的，不该是纯黄土。
#    泥地2（发黄、草少）正好接手中间这档半干旱。
#
#    降水分档：
#      <150mm  极旱     → 泥地      敦煌、和田、吐鲁番、扜泥城
#      <300mm  半干旱   → 泥地 2     河西、中亚绿洲、蒙古南缘
#      <500mm  草原     → 泥地，大草原
def pick_base(code, precip_mm):
    if code == 8:                    # 雪原
        return "雪地，地基"
    if code in (5, 10):              # 雨林 / 沼泽
        return "泥地，污泥"
    if code == 4:                    # 黄土裸土
        return "泥地 4"
    if precip_mm < 150:
        return "泥地"
    if precip_mm < 300:
        return "泥地 2"
    if code == 7:                    # 高原砾石（河谷农耕，土偏黄少草）
        return "泥地 2"
    if code == 2 or precip_mm < 500: # 黄草原
        return "泥地，大草原"
    return "泥地 3"


GROUND_NAME = {
    1: "绿草地", 2: "黄草原", 3: "沙漠", 4: "黄土裸土", 5: "雨林",
    6: "针叶林", 7: "高原砾石", 8: "雪原", 10: "沼泽", 0: "海洋(无数据)",
}


def load_cities():
    """从 cities_v2.ts 抠出 name / lat / lng / region。数据源是 TS 源码，直接正则读。"""
    src = Path("src/data/cities_v2.ts").read_text(encoding="utf-8")
    cities = []
    for m in re.finditer(
        r"name:\s*'([^']+)'[^}]*?lat:\s*(-?[\d.]+),\s*lng:\s*(-?[\d.]+)"
        r"(?:[^}]*?region:\s*'([^']+)')?",
        src, re.S
    ):
        name, lat, lng, region = m.group(1), float(m.group(2)), float(m.group(3)), m.group(4)
        cities.append({"name": name, "lat": lat, "lng": lng, "region": region or "?"})
    return cities


def main():
    g = np.array(Image.open("public/world/ground-type.png"))
    H, W = g.shape
    precip = tifffile.imread("scratch/climate/wc2.1_10m_bio_12.tif").astype(np.float32)
    elev = tifffile.imread("scratch/climate/wc2.1_10m_elev.tif").astype(np.float32)

    cities = load_cities()
    print(f"读到 {len(cities)} 座城\n")

    def sample(lat, lng, arr, radius=3):
        """就近采样。城常在河谷/海岸，正好那一格可能是水面无数据，往外找最近的陆地格。"""
        x0 = int((lng + 180) / 360 * W) % W
        y0 = max(0, min(H - 1, int((90 - lat) / 180 * H)))
        best = None
        for r in range(radius + 1):
            for dy in range(-r, r + 1):
                for dx in range(-r, r + 1):
                    if r > 0 and max(abs(dy), abs(dx)) != r:
                        continue
                    y, x = y0 + dy, (x0 + dx) % W
                    if not (0 <= y < H):
                        continue
                    if g[y, x] != 0:
                        return y, x
                    if best is None:
                        best = (y, x)
        return best if best else (y0, x0)

    tally = Counter()
    by_ground = Counter()
    unresolved = []
    per_region = defaultdict(Counter)
    rows = []

    for c in cities:
        y, x = sample(c["lat"], c["lng"], g)
        code = int(g[y, x])
        base = pick_base(code, float(precip[y, x]))
        by_ground[GROUND_NAME.get(code, str(code))] += 1
        if base is None:
            unresolved.append(c)
            base = "（落不到）"
        tally[base] += 1
        per_region[c["region"]][base] += 1
        rows.append((c, code, base, float(precip[y, x]), float(elev[y, x])))

    print(f"{'攻城战底图':<16}{'城数':>6}{'占比':>8}")
    for base, n in tally.most_common():
        print(f"{base:<16}{n:>6}{100.0*n/len(cities):>7.1f}%")

    print(f"\n落到的地面类型：")
    for name, n in by_ground.most_common():
        print(f"  {name:<14}{n:>5}")

    if unresolved:
        print(f"\n⚠ 落不到底图的城 {len(unresolved)} 座：")
        for c in unresolved[:20]:
            print(f"   {c['name']} ({c['lat']:.2f},{c['lng']:.2f}) region={c['region']}")

    print(f"\n各文化区的底图分布：")
    for region in sorted(per_region):
        items = "  ".join(f"{b}×{n}" for b, n in per_region[region].most_common())
        print(f"  {region:<16}{items}")

    print(f"\n抽查（每种底图各列 4 座城）：")
    seen = Counter()
    for c, code, base, p, e in rows:
        if seen[base] >= 4:
            continue
        seen[base] += 1
        print(f"  {base:<14}{c['name']:<10}{GROUND_NAME.get(code,'?'):<10}"
              f"降水{p:>6.0f}mm  海拔{e:>6.0f}m  {c['region']}")


if __name__ == "__main__":
    main()
