"""
把「任意经纬度 → 用哪张底图」烘成一张查找图，运行时一次采样即可。

为什么烘：判据要用到年降水、最冷月温、海拔、地面类型四份栅格（几十 MB），
游戏里不可能带着这些跑。离线算完，只留一张 53KB 的索引图。

产出 public/world/world-base.png（2160×1080，RGB 三通道各存一层）：
    R 通道 = 攻城战底图编号（非冬季）
    G 通道 = 攻城战底图编号（冬季，长期积雪地区换雪地基）
    B 通道 = 地面类型编号（野战用，见 ground-type.json）

经纬度 → 像素： x = (lng+180)/360*2160,  y = (90-lat)/180*1080

跑法：py tools/build-world-base-map.py
"""
import json
import warnings
from pathlib import Path

import numpy as np
import tifffile
from PIL import Image

warnings.filterwarnings("ignore")

SRC = Path("scratch/climate")
OUT = Path("public/world")

# 攻城战底图。编号即 R/G 通道值，0 保留给「无数据」。
# 名称用 DE 官方中文译名（来自 DE 的 zh 语言包），避免翻译分歧。
SIEGE_BASES = [
    (1, "des",  "泥地",         "极旱绿洲城 — 敦煌、和田、吐鲁番"),
    (2, "ds2",  "泥地 2",       "黄土城 — 黄土高原、河西、青藏河谷、中亚"),
    (3, "ds3",  "泥地 3",       "温带城 — 中原、日本、朝鲜、欧洲"),
    (4, "ds4",  "泥地 4",       "红土城 — 岭南、川蜀、滇缅、印度"),
    (5, "gr4",  "泥地，污泥",    "黑土/水稻土城 — 江南、东北、乌克兰"),
    (6, "gr5",  "泥地，大草原",  "草原城 — 蒙古、中亚草原"),
    (7, "snd",  "雪地，地基",    "雪原城 — 终年雪线以上，及冬季长期积雪区"),
]

# 深色土带（黑土 + 水稻土）。靠气候判不出来——黑土取决于草原腐殖质千年累积，
# 水稻土取决于千年淹水耕作，同纬度的森林土/旱地就不是深色的。只能按真实地理点名。
DARK_SOIL = [
    (42.0, 50.5, 122.0, 135.0),    # 中国东北：松嫩平原 + 三江平原（黑土）
    (46.0, 55.0, 26.0, 50.0),      # 乌克兰 — 俄罗斯南部黑土带
    (36.0, 50.0, -104.0, -88.0),   # 北美大平原（黑土）
    (-38.0, -30.0, -64.0, -57.0),  # 南美潘帕斯（黑土）
    (28.0, 33.5, 111.0, 122.5),    # 江南：长江中下游水稻土，长期淹水呈青黑
    (30.0, 34.0, 118.0, 121.0),    # 江淮水田
]

# 冬季换雪地基的门槛。最冷月低于此值 = 冬季长期稳定积雪。
# 🔴 南方冬天不下雪的地方绝不能换：江南/岭南/川蜀/印度/地中海最冷月都在 -12°C 以上。
WINTER_SNOW_TC = -12.0


def read(name):
    a = tifffile.imread(SRC / name).astype(np.float32)
    a[a < -1e30] = np.nan
    return a


def main():
    ground = np.array(Image.open(OUT / "ground-type.png"))
    H, W = ground.shape
    precip = read("wc2.1_10m_bio_12.tif")
    t_cold = read("wc2.1_10m_bio_6.tif")

    lat = (90.0 - (np.arange(H) + 0.5) * (180.0 / H))[:, None] * np.ones((1, W))
    lng = (-180.0 + (np.arange(W) + 0.5) * (360.0 / W))[None, :] * np.ones((H, 1))

    dark = np.zeros((H, W), dtype=bool)
    for (la0, la1, lo0, lo1) in DARK_SOIL:
        dark |= (lat >= la0) & (lat <= la1) & (lng >= lo0) & (lng <= lo1)

    land = ground != 0
    siege = np.zeros((H, W), dtype=np.uint8)

    # 判定顺序即优先级，与 tools/check-siege-bases.py 保持一致
    snow_ground = land & (ground == 8)                      # 终年雪原
    dark_soil = land & ~snow_ground & dark & (precip >= 300)  # 黑土 / 水稻土
    bog = land & ~snow_ground & ~dark_soil & (ground == 10)   # 沼泽腐殖质同样发黑
    # 红壤：湿热区铁铝氧化。最冷月 >0°C 保证亚热带以南，降水足才淋溶出红壤
    red = (land & ~snow_ground & ~dark_soil & ~bog
           & (((t_cold > 0) & (precip > 800) & (np.abs(lat) < 35)) | (ground == 5)))
    rest = land & ~snow_ground & ~dark_soil & ~bog & ~red
    arid = rest & (precip < 150)                            # 极旱绿洲
    semi = rest & ~arid & (precip < 300)                    # 半干旱
    loess = rest & ~arid & ~semi & ((ground == 7) | (ground == 4))   # 高原河谷 / 黄土
    steppe = rest & ~arid & ~semi & ~loess & ((ground == 2) | (precip < 500))
    temperate = rest & ~arid & ~semi & ~loess & ~steppe

    for mask, code in [(arid, 1), (semi, 2), (temperate, 3), (red, 4),
                       (dark_soil, 5), (bog, 5), (steppe, 6), (snow_ground, 7),
                       (loess, 2)]:
        siege[mask] = code

    # 冬季：长期积雪区换雪地基
    siege_w = siege.copy()
    siege_w[land & (t_cold < WINTER_SNOW_TC)] = 7

    rgb = np.zeros((H, W, 3), dtype=np.uint8)
    rgb[:, :, 0] = siege
    rgb[:, :, 1] = siege_w
    rgb[:, :, 2] = ground
    Image.fromarray(rgb, mode="RGB").save(OUT / "world-base.png", optimize=True)

    meta = {
        "note": "任意经纬度 → 底图查找图。R=攻城战底图(非冬季)  G=攻城战底图(冬季)  B=地面类型(野战)。"
                "经纬度→像素：x=(lng+180)/360*2160, y=(90-lat)/180*1080。"
                "数据源 WorldClim v2.1 (CC BY 4.0)，判据见 docs/02-design/climate-regions.md。",
        "width": W, "height": H,
        "siegeBases": [{"code": c, "tile": t, "name": n, "use": u} for c, t, n, u in SIEGE_BASES],
        "winterSnowThresholdC": WINTER_SNOW_TC,
    }
    (OUT / "world-base.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")

    total = int(land.sum())
    print(f"陆地格 {total}\n")
    print(f"{'编号':<5}{'贴图':<8}{'名称':<14}{'非冬季':>9}{'冬季':>9}")
    for c, t, n, _ in SIEGE_BASES:
        a = int((siege == c).sum()); b = int((siege_w == c).sum())
        print(f"{c:<5}{t:<8}{n:<14}{100.0*a/total:>8.1f}%{100.0*b/total:>8.1f}%")
    uncovered = int((land & (siege == 0)).sum())
    print(f"\n未覆盖陆地格：{uncovered}")
    print(f"→ {OUT/'world-base.png'}  ({(OUT/'world-base.png').stat().st_size//1024} KB)")


if __name__ == "__main__":
    main()
