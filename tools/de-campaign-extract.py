"""
把 AoE2 DE 自带的战役（.aoe2campaign）拆成每关的 .aoe2scenario，再导出每关的地形 / 高度 / 全部物件。

不需要逆向：.aoe2campaign 是一个外壳（文件头 + 关卡偏移表 + 每关原样的 .aoe2scenario 字节），
.aoe2scenario 由 AoE2ScenarioParser 解析。这里只导出「原始数据」（每格地形 id、高度、物件 id/坐标/玩家），
自然物件筛选与占地格交给 tools/de-campaign-to-site.mjs（复用 tools/rms/mapData.mjs 同一套 dat 表）。

用法：
    py tools/de-campaign-extract.py <campaign 名，如 cam2> [关卡序号，从 1 开始；不填＝全部]
输出：
    scratch/de_campaign/<campaign>/<关卡文件名>.aoe2scenario   拆出的原始场景
    scratch/de_campaign/<campaign>/<关卡文件名>.raw.json        原始导出
"""
import json
import struct
import sys
from pathlib import Path

DE = Path(r"C:\Program Files (x86)\Steam\steamapps\common\AoE2DE\resources\_common\campaign")
OUT = Path("scratch/de_campaign")


def read_str16(d: bytes, p: int):
    """DE 字符串：0x0A60 标记 + u16 长度 + 字节。"""
    assert d[p:p + 2] == b"`\n", f"bad str16 marker at {p}: {d[p:p+2]!r}"
    n = struct.unpack_from("<H", d, p + 2)[0]
    return d[p + 4:p + 4 + n].decode("utf-8", "replace"), p + 4 + n


def split_campaign(path: Path):
    """返回 [(name, filename, bytes)]。格式：'2.00' | u32 依赖数 | u32×依赖 | char[256] 名 | u32 关数 | 关卡表。"""
    d = path.read_bytes()
    assert d[:4] == b"2.00", f"未知战役版本 {d[:4]!r}"
    ndep = struct.unpack_from("<I", d, 4)[0]
    p = 8 + 4 * ndep + 256
    count = struct.unpack_from("<I", d, p)[0]
    p += 4
    out = []
    for _ in range(count):
        size, offset = struct.unpack_from("<II", d, p)
        name, p = read_str16(d, p + 8)
        fname, p = read_str16(d, p)
        out.append((name, fname, d[offset:offset + size]))
    return out


def export_scenario(scn_path: Path, raw_path: Path, meta: dict):
    from AoE2ScenarioParser.scenarios.aoe2_de_scenario import AoE2DEScenario
    scenario = AoE2DEScenario.from_file(str(scn_path))
    mm = scenario.map_manager
    W = mm.map_width
    H = mm.map_height
    terrain = [0] * (W * H)
    elev = [0] * (W * H)
    for t in mm.terrain:
        i = t.y * W + t.x
        terrain[i] = int(t.terrain_id)
        elev[i] = int(t.elevation)
    units = []
    for player, plist in enumerate(scenario.unit_manager.units):
        for u in plist:
            units.append({"id": int(u.unit_const), "x": round(float(u.x), 3), "y": round(float(u.y), 3),
                          "player": player, "rot": round(float(u.rotation), 4)})
    raw = {**meta, "width": W, "height": H, "terrain": terrain, "elev": elev, "units": units}
    raw_path.write_text(json.dumps(raw, ensure_ascii=False), encoding="utf-8")
    print(f"  ✔ {raw_path}  {W}x{H}  units={len(units)}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    cam = sys.argv[1]
    only = int(sys.argv[2]) if len(sys.argv) > 2 else 0
    src = DE / f"{cam}.aoe2campaign"
    out_dir = OUT / cam
    out_dir.mkdir(parents=True, exist_ok=True)
    levels = split_campaign(src)
    print(f"{src.name}: {len(levels)} 关")
    for idx, (name, fname, blob) in enumerate(levels, 1):
        print(f"  [{idx}] {name}  ({len(blob)} bytes)")
        if only and idx != only:
            continue
        stem = Path(fname).stem
        scn = out_dir / fname
        scn.write_bytes(blob)
        export_scenario(scn, out_dir / f"{stem}.raw.json",
                        {"campaign": cam, "level": idx, "name": name, "file": fname})


if __name__ == "__main__":
    main()
