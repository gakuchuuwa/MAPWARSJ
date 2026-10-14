#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
抽取「科技树悬停详情」用的元数据（成本 / 数值 / 时代 / 说明 id），产出 public/de-techtree/meta.json。

数据源（本机 DE）：
  · resources/_common/dat/CivTechTrees/*.json —— 决定**哪些节点要抽**（Node ID / Use Type）
  · resources/_common/dat/empires2_x2_p1.dat —— 数值与成本：
      techs[i].resource_costs（type 1=食物 2=木材 3=黄金 4=石头）、
      techs[i].research_locations[].research_time、language_dll_name/help/description、icon_id
      civs[0].units[j]（或任一有该单位的文明）：hit_points / displayed_attack /
      melee_armors / pierce_armors / max_range / speed / train_time / icon_id / language_dll_name
  · resources/<lng>/strings/key-value/… 的 id→文本（说明文字；已由 extract 脚本产出 strings-*.json）

产出：
  public/de-techtree/meta.json = {
    "units":   { "<nodeId>": { hp, atk, ma, pa, range, speed, trainTime, cost{}, nameId, helpId, iconId } },
    "techs":   { "<techId>": { cost{}, researchTime, nameId, helpId, descId, iconId, required[] } },
    "buildings": { "<nodeId>": { nameId, helpId, iconId, ageId } }
  }
  —— 键都用**节点自身的 Node ID**（与树的 Node ID 对齐），渲染器直接查。

用法：python tools/de-techtree-meta.py [--programdir ...] [--out public/de-techtree/meta.json]
"""
from __future__ import annotations

import argparse
import glob
import json
import sys
from pathlib import Path

DEFAULT_PROGRAMDIR = r"C:\Program Files (x86)\Steam\steamapps\common\AoE2DE"
# ⚠️ 成本字段实测语义（scratch/_probe_dat_cost_types.py）：
#   type 1=食物、3=黄金、2=木材（兵营 175 等可对得上）；**type 4 amount=1 是 TTF 占位标记，不是石头**。
#   故只白名单 1/2/3/4 且 amount ≥ 5 的才算真资源，其余（0/-1/214…）一律丢弃。
COST_TYPE = {1: "food", 2: "wood", 3: "gold", 4: "stone"}
COST_MIN = 5


def main() -> int:
    ap = argparse.ArgumentParser(description="抽取科技树悬停详情元数据")
    ap.add_argument("--programdir", default=DEFAULT_PROGRAMDIR)
    ap.add_argument("--out", default="public/de-techtree/meta.json")
    args = ap.parse_args()

    prog = Path(args.programdir)
    trees_dir = prog / "resources" / "_common" / "dat" / "CivTechTrees"
    dat_path = prog / "resources" / "_common" / "dat" / "empires2_x2_p1.dat"
    if not trees_dir.exists() or not dat_path.exists():
        print("❌ 找不到数据源", file=sys.stderr)
        return 2

    # 1) 树里出现了哪些节点
    want_unit_ids: set[int] = set()
    want_tech_ids: set[int] = set()
    want_building_ids: dict[int, int] = {}      # node id -> age id
    for f in glob.glob(str(trees_dir / "*.json")):
        o = json.loads(Path(f).read_text(encoding="utf-8"))
        for e in o.get("civ_techs_buildings", []):
            want_building_ids[int(e["Node ID"])] = int(e.get("Age ID", 0))
        for e in o.get("civ_techs_units", []):
            if e.get("Use Type") == "Tech":
                want_tech_ids.add(int(e["Node ID"]))
            elif e.get("Use Type") == "Building":
                want_building_ids.setdefault(int(e["Node ID"]), int(e.get("Age ID", 0)))
            else:
                want_unit_ids.add(int(e["Node ID"]))
    print(f"树里需要的节点：单位 {len(want_unit_ids)} / 科技 {len(want_tech_ids)} / 建筑 {len(want_building_ids)}")

    # 2) dat
    from genieutils.datfile import DatFile
    d = DatFile.parse(str(dat_path))

    def cost_of(resource_costs) -> dict:
        out = {}
        for rc in resource_costs:
            key = COST_TYPE.get(int(rc.type))
            if key and int(rc.amount) >= COST_MIN:
                out[key] = int(rc.amount)
        return out

    units: dict[str, dict] = {}
    techs: dict[str, dict] = {}
    buildings: dict[str, dict] = {}

    for tid in sorted(want_tech_ids):
        if tid < 0 or tid >= len(d.techs):
            continue
        t = d.techs[tid]
        locs = list(getattr(t, "research_locations", []) or [])
        techs[str(tid)] = {
            "cost": cost_of(list(t.resource_costs)),
            "researchTime": int(locs[0].research_time) if locs else None,
            "nameId": int(t.language_dll_name),
            "helpId": int(t.language_dll_help),
            "descId": int(t.language_dll_description),
            "iconId": int(t.icon_id),
            "required": [int(x) for x in list(t.required_techs) if int(x) >= 0],
        }

    # 单位：逐个文明扫，取第一份有该 base_id 的记录
    # ⚠️ genieutils-py 对 DE 的 Unit **不暴露** 攻击/护甲/射程/训练时间（在二进制块里，需自写解析器）。
    #    能可靠取到的只有：hit_points / speed / icon / 名字 id / 说明 id。取不到的字段一律不写，
    #    绝不填猜测值（宁可悬停面板少一行，也不放假数字）。
    stats: dict[int, dict] = {}
    armor_available = None
    for civ in d.civs:
        for un in civ.units:
            if un is None:
                continue
            bid = int(un.base_id)
            if bid not in want_unit_ids or bid in stats:
                continue
            rec: dict = {
                "hp": int(un.hit_points),
                "speed": round(float(un.speed), 3),
                "nameId": int(un.language_dll_name),
                "helpId": int(getattr(un, "language_dll_help", -1)),
                "iconId": int(un.icon_id),
                "los": round(float(un.line_of_sight), 1),
            }
            # 🔴 单位成本/训练时间/护甲都在 un.creatable 这个子结构里（实测；不在 Unit 顶层）
            cr = getattr(un, "creatable", None)
            if cr is not None:
                try:
                    cost = cost_of(list(cr.resource_costs))
                    if cost:
                        rec["cost"] = cost
                except Exception:
                    pass
                try:
                    locs2 = list(cr.train_locations)
                    if locs2:
                        tt = round(float(locs2[0].train_time), 1)
                        if tt > 0:
                            rec["trainTime"] = tt
                except Exception:
                    pass
                # ⚠️ cr.displayed_pierce_armour 实测与真实护甲对不上（步弓手 0 但显示 4 的兄弟单位多），
                #    故**不采用**；攻击/射程/近防在 genieutils 的 DE Unit 里根本没有。
                #    宁缺勿假：悬停面板只显示上面这些确证字段。
            if armor_available is None:
                armor_available = ("ma" in rec) or ("pa" in rec) or ("cost" in rec)
            stats[bid] = rec
        if len(stats) >= len(want_unit_ids):
            break
    for k, v in stats.items():
        units[str(k)] = v
    print(f"   （护甲/攻防数值 genieutils 是否可读：{armor_available}）")

    # 建筑：从任意 civ 的 unit 里找（建筑也是 unit 的一种）
    for civ in d.civs[:1]:
        for un in civ.units:
            if un is None:
                continue
            bid = int(un.base_id)
            if bid in want_building_ids and str(bid) not in buildings:
                buildings[str(bid)] = {
                    "nameId": int(un.language_dll_name),
                    "helpId": int(getattr(un, "language_dll_help", -1)),
                    "iconId": int(un.icon_id),
                    "ageId": want_building_ids[bid],
                }

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({"units": units, "techs": techs, "buildings": buildings},
                              ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    size_mb = out.stat().st_size / 1e6
    print(f"✅ 写出 {out}（{size_mb:.2f} MB）")
    print(f"   单位 {len(units)}/{len(want_unit_ids)}，科技 {len(techs)}/{len(want_tech_ids)}，建筑 {len(buildings)}/{len(want_building_ids)}")
    missing = sorted(want_unit_ids - {int(k) for k in units})
    if missing:
        print(f"   ⚠️ 没抽到数值的单位 id（前 10）：{missing[:10]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
