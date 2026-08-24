"""
把「任意经纬度 → 用哪张底图」烘成一张查找图，运行时一次采样即可。

为什么烘：判据要用到年降水、最冷月温、最暖季温、海拔、坡度五份栅格（几十 MB），
游戏里不可能带着这些跑。离线算完，只留一张百来 KB 的索引图。

产出 public/world/world-base.png（2160×1080，RGBA 四通道各存一层）：
    R = 攻城战底图（非冬季）
    G = 攻城战底图（冬季）
    B = 野战底图（非冬季）
    A = 野战底图（冬季）
经纬度 → 像素： x = (lng+180)/360*2160,  y = (90-lat)/180*1080

── 结构原则 ──────────────────────────────────────────────
🔴 「雪原/冰原/雪林」不是地理类型，是**季节状态**。
   西伯利亚夏天是针叶林地、冬天才是雪原，同一个地方不该占两个类。
   把季节混进地理分类，冬天的类会把那些地方永久吃掉。
   所以：地理类型只管夏季原貌，冬季由一条替换规则统一处理。

🔴 底图只能是**纯地表材质**。森林是树的组合（第二层），不做底图；
   但「矮树丛」系列是森林里没有树的地面（林下落叶层），可以做底图。

数据源：WorldClim v2.1 10 arc-min，CC BY 4.0
        Fick & Hijmans 2017, Int J Climatol 37:4302-4315

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

# ── 攻城战底图（城郊被踩踏碾压的裸土。城必建在宜居处，故只有泥地类）──
SIEGE = [
    (1, "des", "泥地",          "极旱绿洲城 — 敦煌、和田、吐鲁番、巴格达"),
    (2, "ds2", "泥地 2",        "黄土城 — 黄土高原、河西、青藏河谷、中亚"),
    (3, "ds3", "泥地 3",        "温带城 — 中原、日本、朝鲜、欧洲"),
    (4, "ds4", "泥地 4",        "红土城 — 岭南、川蜀、滇缅、印度"),
    (5, "gr4", "泥地，污泥",     "黑土/水稻土城 — 江南、东北、乌克兰"),
    (6, "gr5", "泥地，大草原",   "草原城 — 蒙古、中亚草原"),
    (7, "snd", "雪地，地基",     "雪原城 — 终年雪线以上，及冬季长期积雪区"),
]

# ── 野战底图（荒野原貌）。编号即通道值，0 = 无数据 ──
FIELD = [
    (1,  "grs",               "草地 1",         "湿润草地 — 西欧、日本、江南"),
    (2,  "gr2",               "草地 2",         "温带草地 — 中原、朝鲜、中欧"),
    (3,  "gr3",               "草地 3",         "半干草地 — 关中、东欧"),
    (4,  "gr6",               "草，丛林",       "丛林草地 — 岭南、东南亚"),
    (5,  "gr7",               "草地，干枯",     "干草原 — 蒙古、中亚"),
    (6,  "for",               "矮树丛",         "温带林地 — 中原山林、欧洲"),
    (7,  "fo2",               "矮树丛，丛林",   "热带林地 — 滇缅、南洋、亚马逊"),
    (8,  "underbrush_leaves", "矮树丛，叶子",   "针叶林地 — 东北、西伯利亚"),
    (9,  "pal",               "砂质沙漠",       "砂质沙漠 — 塔克拉玛干、阿拉伯"),
    (10, "qs",                "沙漠，流沙",     "流沙 — 沙漠腹地沙丘"),
    (11, "pal1",              "裂开的沙漠",     "干涸盐湖 — 罗布泊、咸海"),
    (12, "ds5",               "沙砾，沙漠",     "戈壁 — 哈密、蒙古南缘"),
    (13, "gravel_default",    "沙砾，默认",     "高山砾石 — 青藏、帕米尔"),
    (14, "ds2",               "泥地 2",         "黄土荒原 — 黄土高原、河西"),
    (15, "ds4",               "泥地 4",         "红土荒原 — 印度、澳洲"),
    (16, "gr4",               "泥地，污泥",     "黑土荒原 — 东北、乌克兰"),
    (17, "gr5",               "泥地，大草原",   "萨凡纳 — 东非、德干"),
    (18, "qs2",               "湿地，沼泽",     "沼泽 — 云梦泽、三江平原"),
    (19, "sh4",               "湿地，浅滩",     "浅滩湿地 — 河口、湖滨"),
    (20, "rck",               "岩石",           "裸岩 — 陡坡山地"),
    # ── 以下是冬季状态，不由地理判定，只由季节规则替换进来 ──
    (21, "sno",               "雪地",           "冬季雪原"),
    (22, "sn2",               "雪（松软）",     "冬季深雪 — 极地、高山"),
    (23, "snf",               "矮树丛，积雪",   "冬季雪林地 — 林区冬季"),
    # 冰原不在这张陆地查找图里——它是**水面**冬季冻结的状态，由水域层处理。
    (24, "ice",               "冰原",           "冻结水面（水域层用，不占陆地格）"),
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

# 大沼泽（低洼积水，气候判不出来，点名）
MARSH = [
    (28.0, 31.5, 111.0, 115.0),   # 云梦泽 / 洞庭湖平原
    (45.0, 48.5, 130.0, 135.0),   # 三江平原
    (21.5, 25.0, 88.0, 92.5),     # 恒河—布拉马普特拉三角洲
    (51.0, 53.5, 26.0, 31.0),     # 普里皮亚季沼泽
    (-20.0, -16.0, -58.5, -55.0), # 潘塔纳尔
    (5.0, 10.0, 28.0, 33.0),      # 苏德沼泽
    (25.0, 29.0, -82.5, -80.0),   # 佛罗里达大沼泽
    (58.0, 63.0, 68.0, 82.0),     # 西西伯利亚瓦休甘沼泽
]

# 内流盆地干涸盐湖（无外流、极旱，地表龟裂盐壳）
SALT_FLAT = [
    (38.5, 41.5, 88.0, 92.5),     # 罗布泊
    (43.5, 47.0, 58.0, 62.0),     # 咸海
    (33.0, 36.5, 52.0, 58.0),     # 卡维尔盐漠（伊朗）
    (-24.0, -19.0, -69.0, -66.5), # 乌尤尼盐沼
    (39.0, 42.5, -114.0, -112.0), # 大盐湖沙漠
]

# 冬季长期稳定积雪的门槛。
# 🔴 -12°C 太严：莫斯科最冷月 -10.4°C、雪期四个月，却判不出雪；
#    俄罗斯、东欧、北欧大片地区都卡在 -8~-12 之间。放宽到 -8。
# 🔴 南方冬天不下雪的地方绝不能换——江南 0.6°C、岭南 9.9°C、川蜀 2.3°C，
#    离 -8 还很远，放宽后依然安全。
WINTER_SNOW_TC = -8.0
# 深雪只给终年冰冻的极地与高山。
# 🔴 -25°C 太宽，会把整个西伯利亚和加拿大北部判成深雪（实测占陆地 48%），
#    那些地方冬天是普通积雪，深雪应当罕见。
DEEP_SNOW_TC = -38.0


def read(name):
    a = tifffile.imread(SRC / name).astype(np.float32)
    a[a < -1e30] = np.nan
    return a


def boxes_mask(boxes, lat, lng):
    m = np.zeros(lat.shape, dtype=bool)
    for (la0, la1, lo0, lo1) in boxes:
        m |= (lat >= la0) & (lat <= la1) & (lng >= lo0) & (lng <= lo1)
    return m


def main():
    precip = read("wc2.1_10m_bio_12.tif")
    t_cold = read("wc2.1_10m_bio_6.tif")
    t_warm = read("wc2.1_10m_bio_10.tif")
    p_seas = read("wc2.1_10m_bio_15.tif")   # 降水季节性：区分常年湿润 vs 干湿分明
    elev = tifffile.imread(SRC / "wc2.1_10m_elev.tif").astype(np.float32)
    elev[elev < -1000] = np.nan

    land = ~np.isnan(precip)
    H, W = precip.shape
    lat = (90.0 - (np.arange(H) + 0.5) * (180.0 / H))[:, None] * np.ones((1, W))
    lng = (-180.0 + (np.arange(W) + 0.5) * (360.0 / W))[None, :] * np.ones((H, 1))

    # 地形起伏度：相邻格的高差（米）。
    # 🔴 不要换算成坡度角——18km 的网格会把真实坡度平均掉，
    #    arctan(500m/18500m)=1.5°，再陡的山也判不出来，「岩石」会一张都用不上。
    #    直接用高差。阈值 250m 太松——18km 网格下但凡靠山的城都中招（实测占城池 9.9%）；
    #    收到 400m，只留真正的陡峻山地。
    gy, gx = np.gradient(np.nan_to_num(elev))
    relief = np.nan_to_num(np.hypot(gx, gy))

    dark = boxes_mask(DARK_SOIL, lat, lng)
    marsh_box = boxes_mask(MARSH, lat, lng)
    salt_box = boxes_mask(SALT_FLAT, lat, lng)

    # ══ 野战底图：地理类型（夏季原貌）══════════════════════
    f = np.zeros((H, W), dtype=np.uint8)

    def put(mask, code):
        m = land & (f == 0) & mask
        f[m] = code

    # 判定顺序 = 优先级。极端地形优先，再干湿，最后温度带。
    put((relief > 400) & (elev > 1000), 20)                        # 裸岩：陡峻山地露岩
    put(marsh_box & (precip > 700) & (elev < 200), 18)             # 沼泽
    put(salt_box & (precip < 200), 11)                             # 干涸盐湖
    put((elev > 3200) & (t_warm < 16), 13)                         # 高山砾石
    put((precip < 100) & (elev < 1000), 10)                        # 流沙：极旱低地沙丘
    put(precip < 150, 9)                                           # 砂质沙漠
    put((precip < 250) & (elev > 800), 12)                         # 戈壁：干旱高原砾质
    put(precip < 250, 9)                                           # 其余极旱 → 砂质沙漠
    put(dark & (precip >= 300), 16)                                # 黑土/水稻土荒原
    # 湿热区：先全判丛林草地，稍后由 mix 分 40% 给热带林地。
    # 🔴 别反过来先判林地——那样「草，丛林」会一张都用不上（实测过）。
    # 热带界限取最冷月 >12°C（Köppen A 组是 18°C，但那太严——
    # 蒲甘 14.2°C 明明是热带季风区，用 18 会掉进「温带草地」）。
    put((t_cold > 12) & (precip > 900), 4)                         # 丛林草地：湿热区先占
    # 红土荒原限定在**有明显旱季**的湿热区（德干、澳洲北、非洲），
    # 🔴 原判据只看降水>900，把常年湿润的岭南/南洋也吃了，丛林草地只剩 0.6%。
    put((t_cold > 0) & (precip > 900) & (np.abs(lat) < 32) & (p_seas > 75), 15)
    # 萨凡纳：热带的半干旱区。用最冷月而非纬度判——纬度会把温带高原也算进去。
    put((t_cold > 12) & (precip < 900), 17)                        # 萨凡纳（含蒲甘这类热带季风旱区）
    put((precip < 500) & (np.abs(lat) < 30), 17)
    put(precip < 500, 5)                                           # 干草原
    put((t_cold < -12) & (t_warm < 19), 8)                         # 针叶林地
    put((elev > 1000) & (precip < 700), 14)                        # 黄土荒原
    put(precip > 1000, 1)                                          # 湿润草地
    put(precip > 600, 2)                                           # 温带草地
    put(land, 3)                                                   # 其余 → 半干草地

    # 温带/热带的一部分改判林地：真实荒野里森林与草地共存，
    # 全判草地会让「矮树丛」系列一张都用不上。按格点做稳定的伪随机分配（非 rng，可复现）。
    mix = ((lat * 7.13 + lng * 3.71).astype(np.int64) % 10)
    f[(f == 2) & (mix < 3)] = 6          # 温带草地 → 30% 温带林地
    f[(f == 1) & (mix < 2)] = 6          # 湿润草地 → 20% 温带林地
    f[(f == 4) & (mix < 4)] = 7          # 丛林草地 → 40% 热带林地
    f[(f == 18) & (mix < 3)] = 19        # 沼泽 → 30% 浅滩湿地

    # ══ 野战底图：冬季替换 ══════════════════════════════
    fw = f.copy()
    winter = land & (t_cold < WINTER_SNOW_TC)
    fw[winter & np.isin(f, [6, 7, 8])] = 23      # 林地 → 雪林地
    fw[winter & ~np.isin(f, [6, 7, 8, 20])] = 21 # 其余 → 雪原
    fw[land & (t_cold < DEEP_SNOW_TC)] = 22      # 极寒 → 深雪
    fw[land & (t_warm < 5)] = 22                 # 终年冰冻 → 深雪

    # ══ 攻城战底图 ══════════════════════════════════════
    s = np.zeros((H, W), dtype=np.uint8)

    def puts(mask, code):
        m = land & (s == 0) & mask
        s[m] = code

    puts(t_warm < 5, 7)                                            # 终年雪原城
    puts(dark & (precip >= 300), 5)                                # 黑土/水稻土城
    puts(marsh_box & (precip > 700), 5)                            # 沼泽区城同样深色
    puts((t_cold > 0) & (precip > 800) & (np.abs(lat) < 35), 4)    # 红土城
    # 极旱界限 200mm（Köppen 的 BW 量级）。150 太严——巴格达 153mm
    # 明明是两河绿洲，却掉进半干旱档。
    puts(precip < 200, 1)                                          # 极旱绿洲城
    puts(precip < 300, 2)                                          # 半干旱城
    puts((elev > 3200) | ((elev > 1000) & (precip < 700)), 2)      # 高原河谷 / 黄土城
    puts(precip < 500, 6)                                          # 草原城
    puts(land, 3)                                                  # 温带城

    sw = s.copy()
    sw[land & (t_cold < WINTER_SNOW_TC)] = 7                       # 冬季长期积雪 → 雪地地基

    rgba = np.zeros((H, W, 4), dtype=np.uint8)
    rgba[:, :, 0] = s
    rgba[:, :, 1] = sw
    rgba[:, :, 2] = f
    rgba[:, :, 3] = fw
    OUT.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgba, mode="RGBA").save(OUT / "world-base.png", optimize=True)

    (OUT / "world-base.json").write_text(json.dumps({
        "note": "任意经纬度 → 底图查找图。R=攻城战(非冬) G=攻城战(冬) B=野战(非冬) A=野战(冬)。"
                "经纬度→像素：x=(lng+180)/360*2160, y=(90-lat)/180*1080。"
                "数据源 WorldClim v2.1 (CC BY 4.0)。",
        "width": W, "height": H,
        "siege": [{"code": c, "tile": t, "name": n, "use": u} for c, t, n, u in SIEGE],
        "field": [{"code": c, "tile": t, "name": n, "use": u} for c, t, n, u in FIELD],
        "winterSnowThresholdC": WINTER_SNOW_TC,
        "deepSnowThresholdC": DEEP_SNOW_TC,
    }, ensure_ascii=False, indent=1), encoding="utf-8")

    total = int(land.sum())
    print(f"陆地格 {total}\n")
    print("野战底图：")
    print(f"  {'编号':<4}{'名称':<16}{'夏季':>8}{'冬季':>8}   {'用在哪'}")
    for c, t, n, u in FIELD:
        a = int((f == c).sum()); b = int((fw == c).sum())
        if a == 0 and b == 0:
            print(f"  {c:<4}{n:<16}{'—':>8}{'—':>8}   ⚠ 未使用   {u}")
        else:
            print(f"  {c:<4}{n:<16}{100.0*a/total:>7.2f}%{100.0*b/total:>7.2f}%   {u}")
    print(f"\n攻城战底图：")
    print(f"  {'编号':<4}{'名称':<16}{'非冬季':>8}{'冬季':>8}")
    for c, t, n, u in SIEGE:
        a = int((s == c).sum()); b = int((sw == c).sum())
        print(f"  {c:<4}{n:<16}{100.0*a/total:>7.2f}%{100.0*b/total:>7.2f}%")
    print(f"\n未覆盖陆地格：野战 {int((land&(f==0)).sum())}  攻城 {int((land&(s==0)).sum())}")
    kb = (OUT / 'world-base.png').stat().st_size // 1024
    print(f"→ {OUT/'world-base.png'}  ({kb} KB)")


if __name__ == "__main__":
    main()
