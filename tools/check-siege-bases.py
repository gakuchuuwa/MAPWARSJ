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

# 攻城战底图分配：按真实土壤地理
#
# 🔴 [主人纠正] 「泥地，污泥」是**黑土**，不是热带泥。
#    黑土是温带腐殖质土（东北/乌克兰/北美大平原/潘帕斯），
#    热带雨林的土是**红壤**（铁铝氧化，砖红色）——正好是「泥地 4」。
#    第一版把两者用反了：黑土给了岭南和东南亚，红土给了黄土高原。
#
# 🔴 [主人定] 「泥地」（纯净黄土无草）只给极旱绿洲城，不能宽泛。
#
# 深色土带（黑土 + 水稻土）。靠气候判不出来——
# 黑土取决于草原腐殖质千年累积，水稻土取决于千年淹水耕作，
# 同纬度的森林土/旱地就不是深色的。只能按真实地理点名。
DARK_SOIL = [
    (42.0, 50.5, 122.0, 135.0),    # 中国东北：松嫩平原 + 三江平原（黑土）
    (46.0, 55.0, 26.0, 50.0),      # 乌克兰 — 俄罗斯南部黑土带
    (36.0, 50.0, -104.0, -88.0),   # 北美大平原（黑土）
    (-38.0, -30.0, -64.0, -57.0),  # 南美潘帕斯（黑土）
    (28.0, 33.5, 111.0, 122.5),    # 🔴 [主人定] 江南：长江中下游水稻土，长期淹水呈青黑
    (30.0, 34.0, 118.0, 121.0),    # 江淮水田
]


def in_dark_soil(lat, lng):
    return any(la0 <= lat <= la1 and lo0 <= lng <= lo1
               for (la0, la1, lo0, lo1) in DARK_SOIL)


def pick_base(code, precip_mm, t_cold, lat, lng, winter=False):
    """winter=True 时按冬季地表判（长期积雪的地方冬天就是雪地）。"""
    if code == 8:                                  # 终年雪原
        return "雪地，地基"
    # 🔴 [主人定] 长下雪的地方、雪线以上都用雪地基。
    #    最冷月 <-12°C 即冬季长期稳定积雪（东北、蒙古、西伯利亚、北欧、高原）。
    if winter and t_cold < -12:
        return "雪地，地基"
    if in_dark_soil(lat, lng) and precip_mm >= 300:
        return "泥地，污泥"                          # 黑土
    if code == 10:                                 # 沼泽：湿地腐殖质同样发黑
        return "泥地，污泥"
    # 红壤：湿热区铁铝氧化。最冷月 >0°C 保证是亚热带以南，降水足才淋溶出红壤
    if t_cold > 0 and precip_mm > 800 and abs(lat) < 35:
        return "泥地 4"
    if code == 5:                                  # 雨林
        return "泥地 4"
    if precip_mm < 150:
        return "泥地"                               # 极旱绿洲
    if precip_mm < 300:
        return "泥地 2"                             # 半干旱
    if code == 7:                                  # 高原河谷（土偏黄少草）
        return "泥地 2"
    if code == 4:                                  # 黄土裸土 → 黄土色
        return "泥地 2"
    if code == 2 or precip_mm < 500:               # 草原
        return "泥地，大草原"
    return "泥地 3"                                 # 温带褐土/棕壤


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
    t_cold = tifffile.imread("scratch/climate/wc2.1_10m_bio_6.tif").astype(np.float32)
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
    winter_tally = Counter()
    by_ground = Counter()
    unresolved = []
    per_region = defaultdict(Counter)
    rows = []

    for c in cities:
        y, x = sample(c["lat"], c["lng"], g)
        code = int(g[y, x])
        base = pick_base(code, float(precip[y, x]), float(t_cold[y, x]), c["lat"], c["lng"])
        base_w = pick_base(code, float(precip[y, x]), float(t_cold[y, x]), c["lat"], c["lng"], winter=True)
        winter_tally[base_w] += 1
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

    print("")
    print("冬季（最冷月<-12°C 换雪地基）：")
    for b, n in winter_tally.most_common():
        print(f"{b:<16}{n:>6}{100.0*n/len(cities):>7.1f}%")

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
