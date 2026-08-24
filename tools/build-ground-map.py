"""
生成全球「地面类型图」——把任意经纬度映射到 10 种地面之一。

这是战术模式底图的第一层依据：地面长什么样，由真实气候和海拔决定，
不再靠公式估算或手工划区。

数据源（都是真实观测，非估算）：
    WorldClim v2.1，10 arc-min（约 18km 网格，2160×1080 覆盖全球）
    授权 CC BY 4.0（可商用），引用 Fick & Hijmans 2017, Int J Climatol 37:4302-4315
      bio1  年均温          （°C）
      bio6  最冷月最低温     （°C）—— 分寒温带/亚热带的关键
      bio10 最暖季均温       （°C）—— 苔原界限
      bio12 年降水          （mm）—— 干湿的主判据
      bio15 降水季节性       （变异系数）—— 干湿分明 → 土壤裸露
      elev  海拔            （m）

判据阈值取地理学通用标准：
    干旱界限 250mm / 半干旱 500mm（Köppen 的 BW/BS 界限量级）
    苔原界限 最暖季 <5°C（Köppen ET）
    寒温带界限 最冷月 <-3°C（Köppen D 组）
    热带界限 最冷月 >18°C（Köppen A 组）
    树线 3000m（低纬更高，这里取全球中位）

跑法：py tools/build-ground-map.py
产出：public/world/ground-type.png  （2160×1080 索引图，每像素 = 地面类型编号）
      public/world/ground-type.json （类型表 + 统计）
"""
import json
import warnings
from pathlib import Path

import numpy as np
import tifffile

warnings.filterwarnings("ignore")

SRC = Path("scratch/climate")
OUT = Path("public/world")

# 10 种地面类型。编号即 PNG 索引值，0 保留给「无数据（海洋）」。
GROUND_TYPES = [
    (0,  "ocean",       "海洋/无数据", (20, 60, 110)),
    (1,  "green_grass", "绿草地",      (96, 150, 60)),
    (2,  "dry_steppe",  "黄草原",      (190, 175, 95)),
    (3,  "desert",      "沙漠",        (225, 195, 130)),
    (4,  "bare_earth",  "黄土裸土",    (170, 130, 80)),
    (5,  "rainforest",  "雨林地面",    (40, 105, 45)),
    (6,  "taiga",       "针叶林地面",  (80, 110, 85)),
    (7,  "highland",    "高原砾石",    (150, 145, 135)),
    (8,  "snow",        "雪原",        (240, 245, 250)),
    (9,  "ice",         "冰原",        (200, 225, 240)),
    (10, "marsh",       "沼泽",        (95, 120, 90)),
]


# 世界主要沼泽湿地（真实地理，手工标注）。自动判据分不出「低洼积水」，只能点名。
MARSH_REGIONS = [
    (28.0, 31.5, 111.0, 115.0),   # 云梦泽 / 洞庭湖平原
    (30.5, 33.5, 118.0, 121.5),   # 江淮 / 巢湖湿地
    (45.0, 48.5, 130.0, 135.0),   # 三江平原
    (21.5, 25.0, 88.0, 92.5),     # 恒河—布拉马普特拉三角洲
    (51.0, 53.5, 26.0, 31.0),     # 普里皮亚季沼泽（白俄罗斯）
    (-20.0, -16.0, -58.5, -55.0), # 潘塔纳尔（南美）
    (5.0, 10.0, 28.0, 33.0),      # 苏德沼泽（南苏丹）
    (25.0, 29.0, -82.5, -80.0),   # 佛罗里达大沼泽
    (58.0, 63.0, 68.0, 82.0),     # 西西伯利亚瓦休甘沼泽
]


def read(name):
    a = tifffile.imread(SRC / name).astype(np.float32)
    a[a < -1e30] = np.nan
    return a


def main():
    t_mean = read("wc2.1_10m_bio_1.tif")    # 年均温
    t_cold = read("wc2.1_10m_bio_6.tif")    # 最冷月最低温
    t_warm = read("wc2.1_10m_bio_10.tif")   # 最暖季均温
    precip = read("wc2.1_10m_bio_12.tif")   # 年降水
    p_seas = read("wc2.1_10m_bio_15.tif")   # 降水季节性
    elev = tifffile.imread(SRC / "wc2.1_10m_elev.tif").astype(np.float32)
    elev[elev < -1000] = np.nan

    land = ~np.isnan(t_mean)
    H, W = t_mean.shape
    g = np.zeros((H, W), dtype=np.uint8)   # 0 = 海洋

    # ── 判定顺序：先干湿，再冷热，最后海拔 ────────────────────
    # 🔴 顺序很重要。第一版把温度判据（针叶林）放在干旱判据之前，
    #    结果乌兰巴托（降水 282mm 的蒙古草原）因为最冷月 -28.7°C 被判成针叶林。
    #    真实地理里**干旱压倒温度**：再冷，没水也长不出森林。

    # 8 雪原：终年冰冻。只用温度判，不用海拔——
    #    第一版加了「超过雪线」的海拔判据，雪线公式又取得偏低（赤道 4800m），
    #    把整个青藏高原判成雪原（拉萨中招），雪原占到陆地 35%。
    #    实际青藏干燥、雪线高达 5500~6000m，而 18km 网格又会把周边山地混进来。
    #    Köppen 的 EF/ET 界限就是最暖季 <5°C，用它最稳。
    snow = land & (t_warm < 5)

    # 7 高原砾石：树线以上的高寒荒漠草甸。**必须排在干旱判据之前**——
    #    青藏高原年降水只有 300~400mm，若先判干旱就全被「黄草原」吃掉（拉萨中招）。
    #    高海拔的地表是砾石冻土，跟蒙古草原完全两回事。
    #    要同时满足「高」和「冷」，只看海拔会把低纬高原（如埃塞俄比亚）误判。
    highland = land & ~snow & (elev > 3200) & (t_warm < 16)

    # 3 沙漠：年降水 <250mm（Köppen BW 量级）。干旱优先于一切温度判据。
    desert = land & ~snow & ~highland & (precip < 250)

    # 2 黄草原：半干旱 250~500mm
    steppe = land & ~snow & ~highland & ~desert & (precip < 500)

    # 5 雨林地面：终年湿热（Köppen A 组界限：最冷月 >18°C）+ 多雨
    rain = land & ~snow & ~highland & ~desert & ~steppe & (t_cold > 18) & (precip > 1500)

    # 6 针叶林地面：真正的寒温带针叶林——冬季严寒且夏季不热。
    #    第一版用「最冷月 <-3°C」太宽，把延安、哈尔滨这些半湿润农耕区都吃了。
    taiga = (land & ~snow & ~highland & ~desert & ~steppe & ~rain
             & (t_cold < -12) & (t_warm < 19))

    # 4 黄土裸土：半干旱 + 干湿分明，植被覆盖不连续、土壤裸露。
    #    限定在 500~800mm 且降水高度集中；第一版只看季节性，
    #    把季风区（平壤 1052mm、哈尔滨）也判了进来——那些地方雨季集中但植被茂密。
    #    还要求冬季不严寒（最冷月 >-18°C）：东北/西伯利亚的季风区雨季同样集中，
    #    但冬季长期积雪、夏季植被茂密，地表是黑土草甸不是裸土——哈尔滨曾被误判。
    bare = (land & ~snow & ~highland & ~desert & ~steppe & ~rain & ~taiga
            & (precip < 800) & (p_seas > 90) & (t_cold > -18))

    # 10 沼泽：**不自动判**。
    #    真沼泽取决于地形低洼 + 排水不良，光靠降水和海拔判不出来——
    #    第一版用「低海拔 + 多雨」把杭州、广州、京都全判成了沼泽。
    #    真实的大沼泽是有限几处，走手工标注（见 MARSH_REGIONS）。
    marsh = np.zeros_like(land)
    for (la0, la1, lo0, lo1) in MARSH_REGIONS:
        y0 = int((90 - la1) / 180 * H); y1 = int((90 - la0) / 180 * H)
        x0 = int((lo0 + 180) / 360 * W); x1 = int((lo1 + 180) / 360 * W)
        box = np.zeros_like(land)
        box[max(0, y0):min(H, y1), max(0, x0):min(W, x1)] = True
        # 框内还要真的低洼多雨才算
        marsh |= box & land & ~snow & ~highland & ~desert & ~steppe & (elev < 200) & (precip > 700)
    marsh &= ~highland & ~taiga

    # 1 绿草地：其余（湿润温和）
    green = (land & ~snow & ~highland & ~desert & ~steppe & ~rain & ~taiga & ~bare & ~marsh)

    for mask, code in [(green, 1), (steppe, 2), (desert, 3), (bare, 4), (rain, 5),
                       (taiga, 6), (highland, 7), (snow, 8), (marsh, 10)]:
        g[mask] = code

    # ── 输出索引图（调色板 PNG，体积极小）──
    OUT.mkdir(parents=True, exist_ok=True)
    pal = np.zeros((256, 3), dtype=np.uint8)
    for code, _, _, rgb in GROUND_TYPES:
        pal[code] = rgb
    try:
        from PIL import Image
        im = Image.fromarray(g, mode="P")
        im.putpalette(pal.flatten().tolist())
        im.save(OUT / "ground-type.png", optimize=True)
    except ImportError:
        rgb = pal[g]
        tifffile.imwrite(OUT / "ground-type.tif", rgb)

    # ── 统计 ──
    total_land = int(land.sum())
    stats = []
    print(f"陆地格数 {total_land}（{H}×{W} 网格，10 arc-min ≈ 18km）\n")
    print(f"{'编号':<5}{'类型':<12}{'格数':>9}{'占陆地':>9}")
    for code, key, label, _ in GROUND_TYPES:
        if code == 0:
            continue
        n = int((g == code).sum())
        pct = 100.0 * n / total_land if total_land else 0
        stats.append({"code": code, "key": key, "label": label, "cells": n, "pct": round(pct, 2)})
        print(f"{code:<5}{label:<12}{n:>9}{pct:>8.2f}%")

    (OUT / "ground-type.json").write_text(json.dumps({
        "note": "全球地面类型图。WorldClim v2.1 10arc-min，CC BY 4.0。"
                "像素值 = 类型编号，见 types；经纬度 → 像素：x=(lng+180)/360*2160, y=(90-lat)/180*1080",
        "width": W, "height": H,
        "types": [{"code": c, "key": k, "label": l, "rgb": list(rgb)} for c, k, l, rgb in GROUND_TYPES],
        "stats": stats,
    }, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\n→ {OUT/'ground-type.png'}")
    print(f"→ {OUT/'ground-type.json'}")

    # ── 抽查真实地点，验证分类对不对 ──
    checks = [
        ("洛阳(中原)", 34.6, 112.4), ("杭州(江南)", 30.3, 120.2), ("成都(川蜀)", 30.7, 104.1),
        ("广州(岭南)", 23.1, 113.3), ("敦煌(河西)", 40.1, 94.7), ("和田(西域)", 37.1, 79.9),
        ("拉萨(青藏)", 29.7, 91.1), ("乌兰巴托(草原)", 47.9, 106.9), ("哈尔滨(东北)", 45.8, 126.6),
        ("延安(黄土高原)", 36.6, 109.5), ("撒马尔罕(中亚)", 39.7, 66.9), ("巴格达(西亚)", 33.3, 44.4),
        ("莫斯科(斯拉夫)", 55.8, 37.6), ("科隆(日耳曼)", 50.9, 6.96), ("罗马(拉丁)", 41.9, 12.5),
        ("京都(日本)", 35.0, 135.8), ("平壤(朝鲜)", 39.0, 125.8), ("蒲甘(滇缅)", 21.2, 94.9),
    ]
    name_of = {c: l for c, _, l, _ in GROUND_TYPES}
    print(f"\n真实地点抽查：\n{'地点':<18}{'地面类型':<10}{'年降水':>8}{'最冷月':>8}{'海拔':>8}")
    for label, la, lo in checks:
        x = int((lo + 180) / 360 * W) % W
        y = int((90 - la) / 180 * H)
        y = max(0, min(H - 1, y))
        code = int(g[y, x])
        p = precip[y, x]
        tc = t_cold[y, x]
        el = elev[y, x]
        print(f"{label:<18}{name_of.get(code,'?'):<10}{p:>8.0f}{tc:>8.1f}{el:>8.0f}")


if __name__ == "__main__":
    main()
