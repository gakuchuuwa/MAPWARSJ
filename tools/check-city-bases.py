"""按全部城池的位置统计底图分布 —— 全球陆地面积统计会被无人区严重带偏。

🔴 两条硬检查（都是踩过的坑，务必保留）：
   1. **城池总数与文化区数**：全量是 CITIES_V2（942 座 / 23 区）。
      atlas 曾错拼 T0+T1+T2+PERIPHERY，只有 362 座、全是东亚 14 区，
      欧洲/西亚/非洲/美洲一座没有，工具打开清一色中国城。
      本脚本用正则扫全文件所以一直是对的，两边**从没对过账**——才让错误活了那么久。
   2. **各大洲抽查**：只用东亚的城肉眼验收，会漏掉整个气候带。
      地中海（罗马 760mm 季节性41）和温带海洋（不莱梅 679mm 季节性16）降水总量相近，
      但土色完全不同；只看总量不看季节分配，整个地中海沿岸会被判成德国。
"""
import re, json, warnings
from collections import Counter
from pathlib import Path
import numpy as np
from PIL import Image
warnings.filterwarnings("ignore")

meta = json.loads(Path("public/world/world-base.json").read_text(encoding="utf-8"))
SIEGE = {d["code"]: d["name"] for d in meta["siege"]}
FIELD = {d["code"]: d["name"] for d in meta["field"]}
img = np.array(Image.open("public/world/world-base.png"))
H, W = img.shape[:2]

src = Path("src/data/cities_v2.ts").read_text(encoding="utf-8")
cities = [(m.group(1), float(m.group(2)), float(m.group(3)), m.group(4) or "?")
          for m in re.finditer(
              r"name:\s*'([^']+)'[^}]*?lat:\s*(-?[\d.]+),\s*lng:\s*(-?[\d.]+)"
              r"(?:[^}]*?region:\s*'([^']+)')?", src, re.S)]

def sample(lat, lng):
    x0 = int((lng + 180) / 360 * W) % W
    y0 = max(0, min(H - 1, int((90 - lat) / 180 * H)))
    for r in range(4):
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1):
                if r and max(abs(dy), abs(dx)) != r: continue
                y, x = y0 + dy, (x0 + dx) % W
                if 0 <= y < H and img[y, x, 0] != 0:
                    return img[y, x]
    return img[y0, x0]

cs, cw, cf, cfw = Counter(), Counter(), Counter(), Counter()
for name, lat, lng, region in cities:
    px = sample(lat, lng)
    # 查找图是 RGB 三通道：R=攻城(非冬) G=野战(非冬) B=冬季标志(0无/1雪/2深雪/3雪林)
    # 冬季底图由标志推导，不单独存——数据放 alpha 会被 canvas 的预乘毁掉。
    siege, field, wflag = int(px[0]), int(px[1]), int(px[2])
    cs[SIEGE.get(siege, "?")] += 1
    cw[SIEGE.get(7 if wflag > 0 else siege, "?")] += 1
    cf[FIELD.get(field, "?")] += 1
    cfw[FIELD.get(23 if wflag == 3 else 22 if wflag == 2 else 21 if wflag == 1 else field, "?")] += 1

n = len(cities)
print(f"{n} 座城实际会看到的底图分布\n")
# 各大洲抽查点：只看东亚会漏掉整个气候带
SPOT = [("罗马·地中海", 41.90, 12.50), ("非斯·北非地中海", 34.03, -5.00),
        ("雅典·干地中海", 37.98, 23.73), ("不莱梅·温带海洋", 53.08, 8.80),
        ("莫斯科·东欧", 55.75, 37.62), ("廷巴克图·萨赫勒", 16.77, -3.00),
        ("特诺奇提特兰·墨西哥高原", 19.43, -99.13), ("库斯科·安第斯", -13.53, -71.97),
        ("拉合尔·旁遮普", 31.55, 74.34), ("马六甲·南洋", 2.20, 102.25),
        ("洛阳·中原", 34.62, 112.45), ("杭州·江南", 30.30, 120.16)]
print("各大洲抽查（只看东亚会漏掉整个气候带）：")
for label, la, lo in SPOT:
    px = sample(la, lo)
    print(f"  {label:<26}攻城 {SIEGE.get(int(px[0]), '?'):<14}野战 {FIELD.get(int(px[1]), '?')}")
print()

for title, c in [("攻城战 · 非冬季", cs), ("攻城战 · 冬季", cw),
                 ("野战 · 非冬季", cf), ("野战 · 冬季", cfw)]:
    print(f"── {title}")
    for k, v in c.most_common():
        print(f"   {k:<16}{v:>5}{100.0*v/n:>7.1f}%")
    print()
