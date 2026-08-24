"""按 922 座城的位置统计底图分布 —— 全球陆地面积统计会被无人区严重带偏。"""
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
    cs[SIEGE.get(int(px[0]), "?")] += 1
    cw[SIEGE.get(int(px[1]), "?")] += 1
    cf[FIELD.get(int(px[2]), "?")] += 1
    cfw[FIELD.get(int(px[3]), "?")] += 1

n = len(cities)
print(f"{n} 座城实际会看到的底图分布\n")
for title, c in [("攻城战 · 非冬季", cs), ("攻城战 · 冬季", cw),
                 ("野战 · 非冬季", cf), ("野战 · 冬季", cfw)]:
    print(f"── {title}")
    for k, v in c.most_common():
        print(f"   {k:<16}{v:>5}{100.0*v/n:>7.1f}%")
    print()
