"""
把 AoE2 DE 自己生成的随机地图导出成 ZOOM 13 能用的底图数据。

为什么要这个：我们此前的战场底图是自己"估"出来的——森林是在草地上撒十几二十棵孤树。
而 DE 的真实数据显示：森林是**一种地形**，占图幅约 12%，树长在森林地形上，一张 144×144
的小图有 2000+ 棵树。差了约 100 倍。这个脚本不做任何近似，直接把 DE 算出来的地形矩阵
和物件表原样导出。

数据来源全部是 DE 本体，没有一处是猜的：
  - 地形矩阵 / 物件表：DE 场景编辑器「生成地图」跑官方 RMS 后存的 .aoe2scenario
  - terrain_id → 贴图名 / 咬合优先级：empires2_x2_p1.dat 的 terrain 表（name_2 即 g_*.dds）
  - 物件 id → 名称：AoE2ScenarioParser 的官方数据集

用法：
    py tools/de-map-export.py <scenario 文件> <输出名>
例：
    py tools/de-map-export.py "C:/Users/.../default1.aoe2scenario" de_blackforest
"""
import json
import sys
from pathlib import Path
from collections import Counter

from AoE2ScenarioParser.scenarios.aoe2_de_scenario import AoE2DEScenario
from AoE2ScenarioParser.datasets.terrains import TerrainId
from AoE2ScenarioParser.datasets.other import OtherInfo
from AoE2ScenarioParser.datasets.units import UnitInfo
from genieutils.datfile import DatFile

DAT = r"C:\Program Files (x86)\Steam\steamapps\common\AoE2DE\resources\_common\dat\empires2_x2_p1.dat"
OUT_DIR = Path("public/de-maps")

# 我们的战场等距网格是 66×66 格（2000×1080 由 setupIsoGrid 算出）。
# 主人定：不要整张菱形地图，从 DE 的大图正中截一块矩形即可。
CROP = 66


def load_terrain_table():
    """terrain_id -> {tile 贴图名, 咬合优先级, blend 类型}。全部来自 DE 的 dat，不猜。"""
    dat = DatFile.parse(DAT)
    table = {}
    for i, t in enumerate(dat.terrain_block.terrains):
        if not t.name_2:
            continue
        # name_2 形如 'g_gr3'，我们的贴图是 public/SUCAI_TERRAIN/gr3.png
        tile = t.name_2[2:] if t.name_2.startswith("g_") else t.name_2
        table[i] = {
            "tile": tile,
            "name": t.name,
            "blendPriority": t.blend_priority,
            "blendType": t.blend_type,
            # 🔴 判水看 blend_type，不是 is_water。
            #    is_water 是深度/通行档（水 1/2/4、陆地 32、冰 72/96），拿它当布尔用会把整张图判成水。
            #    blend_type 才是 DE 的地形咬合类别：0=陆地 2=沙滩 3=水 6=冰，与我们 blends/ 下的遮罩一一对应。
            "isWater": t.blend_type == 3,
        }
    return table


def object_name(const: int) -> str:
    for enum in (OtherInfo, UnitInfo):
        try:
            return enum.from_id(const).name
        except Exception:
            pass
    return f"UNKNOWN_{const}"


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    src, out_name = sys.argv[1], sys.argv[2]
    # 第三个参数可选：切块步长。一张 144x144 的 DE 图能滑窗切出多块 66x66 的战场底图，
    # 每块都是 DE 算的、互不相同——20 张 DE 地图就能出几百张真底图。
    stride = int(sys.argv[3]) if len(sys.argv) > 3 else 0

    terrain_table = load_terrain_table()
    scenario = AoE2DEScenario.from_file(src)
    mm = scenario.map_manager
    size = mm.map_size

    if stride > 0:
        offsets = list(range(0, size - CROP + 1, stride))
        tiles = [(ox, oy) for oy in offsets for ox in offsets]
    else:
        c = (size - CROP) // 2
        tiles = [(c, c)]

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    written = []

    for (lox, loy) in tiles:
        hix, hiy = lox + CROP, loy + CROP

        grid, kinds = [], Counter()
        for y in range(loy, hiy):
            row = []
            for x in range(lox, hix):
                t = mm.terrain[y * size + x]
                row.append({"t": t.terrain_id, "e": t.elevation})
                kinds[t.terrain_id] += 1
            grid.append(row)

        objects, obj_kinds = [], Counter()
        for player_units in scenario.unit_manager.units:
            for u in player_units:
                if lox <= u.x < hix and loy <= u.y < hiy:
                    name = object_name(u.unit_const)
                    objects.append({
                        "const": u.unit_const, "name": name,
                        "x": round(u.x - lox, 3), "y": round(u.y - loy, 3),
                        "rot": round(getattr(u, "rotation", 0.0), 3),
                    })
                    obj_kinds[name] += 1

        used = {str(tid): terrain_table.get(tid, {"tile": None, "name": f"ID_{tid}"}) for tid in kinds}
        water = sum(n for tid, n in kinds.items()
                    if terrain_table.get(tid, {}).get("isWater"))
        beach = sum(n for tid, n in kinds.items()
                    if terrain_table.get(tid, {}).get("blendType") == 2)
        forest = sum(n for tid, n in kinds.items()
                     if "forest" in terrain_table.get(tid, {}).get("name", "").lower())

        name = out_name if len(tiles) == 1 else f"{out_name}_{lox:03d}_{loy:03d}"
        payload = {
            "source": Path(src).name,
            "note": "AoE2 DE 场景编辑器跑官方 RMS 生成，原样导出，未经任何近似或再加工。",
            "mapSize": size,
            "crop": {"size": CROP, "offset": lox, "offsetY": loy},
            "terrainTable": used,
            "grid": grid,
            "objects": objects,
        }
        (OUT_DIR / f"{name}.json").write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
        written.append({"name": name, "water": water, "beach": beach, "forest": forest,
                        "objects": len(objects), "kinds": len(kinds)})

    written.sort(key=lambda w: -w["water"])
    print(f"原图 {size}x{size} → 切出 {len(written)} 块 {CROP}x{CROP}")
    print(f"{'块名':<28}{'水格':>6}{'沙滩':>6}{'森林格':>8}{'物件':>7}{'地形种类':>9}")
    for w in written[:20]:
        print(f"{w['name']:<28}{w['water']:>6}{w['beach']:>6}{w['forest']:>8}{w['objects']:>7}{w['kinds']:>9}")
    print(f"→ {OUT_DIR}")


if __name__ == "__main__":
    main()
