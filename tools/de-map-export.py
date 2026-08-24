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
            "isWater": bool(t.is_water),
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

    terrain_table = load_terrain_table()
    scenario = AoE2DEScenario.from_file(src)
    mm = scenario.map_manager
    size = mm.map_size

    lo = (size - CROP) // 2
    hi = lo + CROP

    # ── 地形：截中间 CROP×CROP ──
    grid, kinds = [], Counter()
    for y in range(lo, hi):
        row = []
        for x in range(lo, hi):
            t = mm.terrain[y * size + x]
            row.append({"t": t.terrain_id, "e": t.elevation})
            kinds[t.terrain_id] += 1
        grid.append(row)

    # ── 物件：只保留落在截取区内的，坐标转成相对格 ──
    objects = []
    obj_kinds = Counter()
    for player_units in scenario.unit_manager.units:
        for u in player_units:
            if lo <= u.x < hi and lo <= u.y < hi:
                name = object_name(u.unit_const)
                objects.append({
                    "const": u.unit_const,
                    "name": name,
                    "x": round(u.x - lo, 3),
                    "y": round(u.y - lo, 3),
                    "rot": round(getattr(u, "rotation", 0.0), 3),
                })
                obj_kinds[name] += 1

    used = {str(tid): terrain_table.get(tid, {"tile": None, "name": f"ID_{tid}"})
            for tid in kinds}

    payload = {
        "source": Path(src).name,
        "note": "AoE2 DE 场景编辑器跑官方 RMS 生成，原样导出，未经任何近似或再加工。",
        "mapSize": size,
        "crop": {"size": CROP, "offset": lo},
        "terrainTable": used,
        "grid": grid,
        "objects": objects,
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / f"{out_name}.json"
    out.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")

    print(f"== {out_name} ==")
    print(f"  原图 {size}x{size} → 截取中间 {CROP}x{CROP} (offset {lo})")
    print(f"  地形种类 {len(kinds)}：")
    for tid, n in kinds.most_common():
        info = terrain_table.get(tid, {})
        pct = 100.0 * n / (CROP * CROP)
        print(f"    {tid:>4} {info.get('name','?'):<26} tile={str(info.get('tile')):<16} {n:>5} 格 {pct:5.1f}%")
    print(f"  物件 {len(objects)} 个 / {len(obj_kinds)} 种：")
    for name, n in obj_kinds.most_common(15):
        print(f"    {name:<28} {n:>5}")
    print(f"  → {out}")


if __name__ == "__main__":
    main()
