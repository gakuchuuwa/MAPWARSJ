"""
AoE2 DE 战役关卡 → 原图预览数据（地形 + 全部物件，物件精灵直接从 DE 的 SLD 解出，不做任何替换/自绘）。

流程（全部取 DE 本体数据，不猜、不代用）：
  1. .aoe2campaign 拆成每关的 .aoe2scenario（tools/de-campaign-extract.py 的 split_campaign）
  2. AoE2ScenarioParser 读：每格地形 id / 图层 / 高度；每个物件的 id、坐标、朝向/变体、玩家
  3. 物件的图像：玩家文明（或建筑风格 architecture_set）→ dat 里这个物件的 standing_graphic
     → 该 graphic 的 SLD 文件 + 帧号（静物：rotation＝变体/朝向下标；活物：rotation＝弧度→16 向）
     → graphic 的 deltas（城镇中心、栅栏旗、火把等由多块拼成）按 dat 偏移叠加
     → 有玩家色遮罩的按该玩家的 DE 玩家色（resources/_common/palettes/playercolor_*.pal 第 0 色）染色
  4. 写出：public/de-maps/campaign/<id>.json（地图） + public/de-maps/campaign/sprites/<key>.png（精灵）
          + sprites.json（每个精灵的宽高/锚点）+ index.json（关卡清单）
  不画的：dat 里 standing_graphic = -1 的（如 REVEAL 视野标记，DE 里本来就看不见）、驻扎在建筑/船里的单位。

用法：
    py tools/de-campaign-build.py cam2            # 一个战役全部关卡
    py tools/de-campaign-build.py cam2 1          # 只做第 1 关
    py tools/de-campaign-build.py --all           # DE 自带全部战役 + 单独场景
"""
import io
import json
import math
import os
import struct
import sys
import hashlib
import contextlib
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent / "sld"))
from sld_extract import parse_sld, decode_dxt1_block, decode_bc4_block, place_blocks  # noqa: E402

DE_ROOT = Path(r"C:\Program Files (x86)\Steam\steamapps\common\AoE2DE\resources\_common")
CAMPAIGN_DIR = DE_ROOT / "campaign"
GRAPHICS_DIR = DE_ROOT / "drs" / "graphics"
DAT = DE_ROOT / "dat" / "empires2_x2_p1.dat"
OUT = Path("public/de-maps/campaign")
SPR = OUT / "sprites"
WORK = Path("scratch/de_campaign")
BUILD_VERSION = 3   # 2 = 补建筑附属件 + 建筑地基地形（农田等）；3 = 帧号按 SLD 帧数取模 + 空帧取下一张有图帧

# DE 玩家色顺序（scenario player.color 0..7）
PLAYER_COLOR_FILES = ["blue", "red", "green", "yellow", "teal", "purple", "grey", "orange"]


def load_player_colors():
    out = []
    for n in PLAYER_COLOR_FILES:
        lines = (DE_ROOT / "palettes" / f"playercolor_{n}.pal").read_text().split()
        # JASC-PAL 0100 <count> r g b ...
        out.append(tuple(int(v) for v in lines[3:6]))
    return out


# ───────────────────────── 战役拆包 ─────────────────────────
def read_str16(d, p):
    assert d[p:p + 2] == b"`\n", f"bad str16 marker at {p}"
    n = struct.unpack_from("<H", d, p + 2)[0]
    return d[p + 4:p + 4 + n].decode("utf-8", "replace"), p + 4 + n


def split_campaign(path):
    d = path.read_bytes()
    assert d[:4] == b"2.00", f"未知战役版本 {d[:4]!r}"
    ndep = struct.unpack_from("<I", d, 4)[0]
    p = 8 + 4 * ndep
    cname = d[p:p + 256].split(b"\0")[0].decode("utf-8", "replace")
    p += 256
    count = struct.unpack_from("<I", d, p)[0]
    p += 4
    out = []
    for _ in range(count):
        size, offset = struct.unpack_from("<II", d, p)
        name, p = read_str16(d, p + 8)
        fname, p = read_str16(d, p)
        out.append((name, fname, d[offset:offset + size]))
    return cname, out


# ───────────────────────── SLD 逐帧解码（带帧间复用链） ─────────────────────────
def _blocks(b):
    return [b[k * 8:(k + 1) * 8] for k in range(len(b) // 8)]


def _decode_main(layer, prev):
    x1, y1, x2, y2, w, h, flag1, cmds, blocks = layer
    if prev is not None and (flag1 & 0x80):
        ppx, pw, ph, px1, py1 = prev
        px = place_blocks(cmds, _blocks(blocks), decode_dxt1_block, w, h, ppx, pw, ((x1 - px1) // 4, (y1 - py1) // 4))
    else:
        px = place_blocks(cmds, _blocks(blocks), decode_dxt1_block, w, h)
    return (px, w, h, x1, y1)


def _decode_gray(cmds, blocks, w, h, x1, y1, prev):
    """BC4 灰度层（阴影 / 玩家色遮罩），flag1 bit7 时 skip 块按画布坐标复制上一帧。"""
    bw = (w + 3) // 4
    gray = bytearray(w * h)
    blist = _blocks(blocks)
    bi = dp = 0
    for skip, draw in cmds:
        if prev is not None:
            pg, pw, ph, px1, py1 = prev
            dx, dy = (x1 - px1) // 4, (y1 - py1) // 4
            for _ in range(skip):
                bx, by = dp % bw, dp // bw
                for j in range(16):
                    x, y = bx * 4 + (j % 4), by * 4 + (j // 4)
                    sx, sy = (bx + dx) * 4 + (j % 4), (by + dy) * 4 + (j // 4)
                    if x < w and y < h and 0 <= sx < pw and 0 <= sy < ph:
                        gray[y * w + x] = pg[sy * pw + sx]
                dp += 1
        else:
            dp += skip
        for _ in range(draw):
            vals = decode_bc4_block(blist[bi]); bi += 1
            bx, by = dp % bw, dp // bw
            for j in range(16):
                x, y = bx * 4 + (j % 4), by * 4 + (j // 4)
                if x < w and y < h:
                    gray[y * w + x] = vals[j]
            dp += 1
    return gray


class SldFile:
    """按帧号顺序解码；每帧保存主图 / 阴影 / 玩家色三层（供下一帧复用 + 合成）。"""

    def __init__(self, path):
        _v, self.frames = parse_sld(str(path))
        self.cursor = -1
        self.prev = (None, None, None)
        self.done = {}

    def frame(self, k):
        if k in self.done:
            return self.done[k]
        if k < 0 or k >= len(self.frames):
            return None
        if k <= self.cursor:
            self.cursor, self.prev = -1, (None, None, None)
        while self.cursor < k:
            self.cursor += 1
            cw, ch, hx, hy, ftype, fidx, layers = self.frames[self.cursor]
            pm, ps, pc = self.prev
            m = _decode_main(layers["main"], pm) if "main" in layers else None
            s = None
            if "shadow" in layers:
                x1, y1, x2, y2, w, h, flag1, cmds, blocks = layers["shadow"]
                s = (_decode_gray(cmds, blocks, w, h, x1, y1, ps if (flag1 & 0x80) else None), w, h, x1, y1)
            c = None
            if "playercolor" in layers and m is not None:
                flag1, cmds, blocks = layers["playercolor"]
                c = (_decode_gray(cmds, blocks, m[1], m[2], m[3], m[4], pc if (flag1 & 0x80) else None), m[1], m[2], m[3], m[4])
            self.prev = (m, s, c)
            if self.cursor == k:
                self.done[k] = (hx, hy, m, s, c)
        return self.done[k]


_sld_cache = {}


def sld(name):
    if name not in _sld_cache:
        p = GRAPHICS_DIR / f"{name}.sld"
        _sld_cache[name] = SldFile(p) if p.exists() else None
    return _sld_cache[name]


def frame_to_rgba(fr, tint):
    """一帧 → (RGBA ndarray, 锚点 x, 锚点 y)。阴影 = 半透明黑（alpha=灰度），主图覆盖其上；玩家色按遮罩染色。"""
    hx, hy, m, s, c = fr
    boxes = []
    if m: boxes.append((m[3], m[4], m[3] + m[1], m[4] + m[2]))
    if s: boxes.append((s[3], s[4], s[3] + s[1], s[4] + s[2]))
    if not boxes:
        return None
    ux1 = min(b[0] for b in boxes); uy1 = min(b[1] for b in boxes)
    ux2 = max(b[2] for b in boxes); uy2 = max(b[3] for b in boxes)
    W, H = ux2 - ux1, uy2 - uy1
    out = np.zeros((H, W, 4), np.uint8)
    if s:
        g = np.frombuffer(bytes(s[0]), np.uint8).reshape(s[2], s[1])
        out[s[4] - uy1:s[4] - uy1 + s[2], s[3] - ux1:s[3] - ux1 + s[1], 3] = g
    if m:
        px = np.frombuffer(bytes(m[0]), np.uint8).reshape(m[2], m[1], 4).astype(np.float32)
        if c is not None and tint is not None:
            w = (np.frombuffer(bytes(c[0]), np.uint8).reshape(m[2], m[1]).astype(np.float32) / 255.0)[..., None]
            lum = 0.299 * px[..., 0] + 0.587 * px[..., 1] + 0.114 * px[..., 2]
            sc = np.minimum(255.0, lum * 2.2)[..., None]
            tinted = np.array(tint, np.float32)[None, None, :] * sc / 255.0
            px[..., :3] = tinted * w + px[..., :3] * (1 - w)
        px = px.round().clip(0, 255).astype(np.uint8)
        region = out[m[4] - uy1:m[4] - uy1 + m[2], m[3] - ux1:m[3] - ux1 + m[1]]
        opaque = px[..., 3] > 0
        region[opaque] = px[opaque]
    return out, hx - ux1, hy - uy1


# ───────────────────────── dat：物件 → graphic → 帧 ─────────────────────────
class Dat:
    def __init__(self):
        from genieutils.datfile import DatFile
        self.d = DatFile.parse(str(DAT))

    def unit(self, civ, uid):
        civs = self.d.civs
        u = civs[civ].units[uid] if 0 <= civ < len(civs) and uid < len(civs[civ].units) else None
        return u or (civs[0].units[uid] if uid < len(civs[0].units) else None)

    def graphic(self, gid):
        return self.d.graphics[gid] if 0 <= gid < len(self.d.graphics) else None


def frame_index(g, rot, radians):
    A = max(1, g.angle_count); F = max(1, g.frame_count)
    if radians:
        # 活物：rotation 是弧度，分成 A 向；DE SLD 16 向全存（0=东，顺时针）
        a = int(math.floor(rot / (2 * math.pi) * A + 0.5)) % A
        return a * F
    r = int(round(rot))
    if A > 1:
        return (r % A) * F          # 静物：rotation＝朝向/变体下标（墙 5 向、树 27 种…）
    return r % F if F > 1 else 0    # 单角度多帧：民居 3 种外观等


def render_graphic(dat, gid, rot, radians, tint, depth=0):
    """graphic（含 deltas）→ 图层列表 [(RGBA, ax, ay, ox, oy)]；ox/oy 为相对物件脚点的 dat 偏移。"""
    g = dat.graphic(gid)
    if g is None or depth > 4:
        return [], []
    missing = []
    A = max(1, g.angle_count)
    angle = int(math.floor(rot / (2 * math.pi) * A + 0.5)) % A if radians else int(round(rot)) % A

    def self_layer():
        name = (g.file_name or "").strip()
        if not name or len(name) <= 1 or name.lower() in ("w", "none"):   # dat 里的占位名（X/W/R/E/M/None）：这一层本来就没有图
            return []
        f = sld(name)
        if f is None:
            missing.append(name)
            return []
        idx = frame_index(g, rot, radians)
        nf = len(f.frames)
        if nf and idx >= nf:
            idx %= nf          # dat 的角度数比 SLD 实际帧多（如默认悬崖 25 向/24 帧）：引擎按帧数取模
        F = max(1, g.frame_count)
        if nf and F > 1 and "main" not in f.frames[idx][6]:
            # 动画此刻是空帧（如海豚潜在水下）：取同一段动画里下一张有图的帧
            start = idx - idx % F
            for k in list(range(idx + 1, min(nf, start + F))) + list(range(start, idx)):
                if "main" in f.frames[k][6]:
                    idx = k
                    break
        fr = f.frame(idx)
        if fr is None:
            missing.append(f"{name}#{idx}")
            return []
        r = frame_to_rgba(fr, tint)
        return [(r[0], r[1], r[2], 0, 0)] if r else []

    deltas = [dl for dl in g.deltas if dl.display_angle in (-1, angle) or A == 1]
    layers = []
    if deltas:
        has_self = any(dl.graphic_id == -1 for dl in deltas)
        if not has_self:
            layers += self_layer()
        for dl in deltas:
            if dl.graphic_id == -1:
                layers += [(im, ax, ay, ox + dl.offset_x, oy + dl.offset_y) for (im, ax, ay, ox, oy) in self_layer()]
            else:
                sub, miss = render_graphic(dat, dl.graphic_id, rot, radians, tint, depth + 1)
                missing += miss
                layers += [(im, ax, ay, ox + dl.offset_x, oy + dl.offset_y) for (im, ax, ay, ox, oy) in sub]
    else:
        layers += self_layer()
    return layers, missing


def composite(layers):
    x0 = min(ox - ax for im, ax, ay, ox, oy in layers)
    y0 = min(oy - ay for im, ax, ay, ox, oy in layers)
    x1 = max(ox - ax + im.shape[1] for im, ax, ay, ox, oy in layers)
    y1 = max(oy - ay + im.shape[0] for im, ax, ay, ox, oy in layers)
    canvas = Image.new("RGBA", (x1 - x0, y1 - y0), (0, 0, 0, 0))
    for im, ax, ay, ox, oy in layers:
        canvas.alpha_composite(Image.fromarray(im, "RGBA"), (ox - ax - x0, oy - ay - y0))
    return canvas, -x0, -y0


# ───────────────────────── 关卡导出 ─────────────────────────
def load_scenario(path):
    from AoE2ScenarioParser.scenarios.aoe2_de_scenario import AoE2DEScenario
    with contextlib.redirect_stdout(io.StringIO()):
        return AoE2DEScenario.from_file(str(path))


def civ_index(civ):
    """Civilization（新版字符串枚举）/ 整数 → dat 文明下标（0=Gaia、1=Britons、2=Franks…）。"""
    from AoE2ScenarioParser.datasets.object_support import CivilizationOld
    if civ is None:
        return 0
    if isinstance(civ, (int, float)):
        return int(civ)
    try:
        return int(CivilizationOld[civ.name].value)
    except Exception:
        return 0


def as_int(v, default):
    try:
        return int(v.value) if hasattr(v, "value") and not isinstance(v, (int, float)) else int(v)
    except Exception:
        return default


def safe_attr(obj, name, default=None):
    """老版本场景（1.36 等）没有的字段，AoE2ScenarioParser 会抛 UnsupportedAttributeError —— 一律当缺省。"""
    try:
        return getattr(obj, name)
    except Exception:
        return default


def dump_scenario_raw(scn_path):
    """兜底：AoE2ScenarioParser 解不了触发器段（如 Kotyan 2/3 的 trigger_data）时，
    场景文件里地图与物件段在触发器段之前 —— 只读到 Units 段为止，直接取原始字段（同一份文件数据，不猜）。"""
    import AoE2ScenarioParser.scenarios.aoe2_scenario as m
    from AoE2ScenarioParser.scenarios.aoe2_de_scenario import AoE2DEScenario
    from AoE2ScenarioParser.helper.incremental_generator import IncrementalGenerator
    ig = IncrementalGenerator.from_file(str(scn_path))
    sv = m._get_file_version(ig); var = m._get_scenario_variant(ig)
    sc = AoE2DEScenario("DE", sv, source_location=str(scn_path), name="x", variant=var)
    with contextlib.redirect_stdout(io.StringIO()):
        sc._load_structure(); m._initialise_version_dependencies(sc.game_version, sc.scenario_version)
        sc._load_header_section(ig)
        sc._decompressed_file_data = m._decompress_bytes(ig.get_remaining_bytes())
        dg = IncrementalGenerator(name="d", file_content=sc._decompressed_file_data)
        for name in sc.structure.keys():
            if name == "FileHeader":
                continue
            if name == "Triggers":
                break
            sc._create_and_load_section(name, dg)
    S = sc.sections
    rv = lambda sec, k: S[sec].retriever_map[k].data
    W, H = int(rv("Map", "map_width")), int(rv("Map", "map_height"))
    td = rv("Map", "terrain_data")
    terrain = [int(t.retriever_map["terrain_id"].data) for t in td]
    elev = [int(t.retriever_map["elevation"].data) for t in td]
    layer = [(int(t.retriever_map["layer"].data) if "layer" in t.retriever_map and int(t.retriever_map["layer"].data) >= 0 else -1) for t in td]
    from AoE2ScenarioParser.datasets.object_support import CivilizationOld, Civilization
    by_value = {str(mem.value): mname for mname, mem in Civilization.__members__.items()}
    def civ_of(v):
        if isinstance(v, (int, float)):
            return int(v)
        nm = by_value.get(str(v))
        try:
            return int(CivilizationOld[nm].value) if nm else 0
        except Exception:
            return 0
    p1 = rv("DataHeader", "player_data_1")
    p3 = rv("Units", "player_data_3")
    pinfo = [{"civ": 0, "arch": -1, "color": -1}]
    for i in range(1, 9):
        a = p1[i - 1].retriever_map
        civ = civ_of(a["civilization"].data)
        arch = civ_of(a["architecture_set"].data) if "architecture_set" in a else -1
        color = int(p3[i - 1].retriever_map["color"].data) if i - 1 < len(p3) else i - 1
        pinfo.append({"civ": civ, "arch": arch, "color": color})
    units = []
    for pl, pu in enumerate(rv("Units", "players_units")):
        for u in pu.retriever_map["units"].data:
            r = u.retriever_map
            units.append({"pl": pl, "id": int(r["unit_const"].data), "x": float(r["x"].data), "y": float(r["y"].data),
                          "rot": float(r["rotation"].data), "garrison": int(r["garrisoned_in_id"].data)})
    return {"W": W, "H": H, "terrain": terrain, "elev": elev, "layer": layer, "players": pinfo, "units": units,
            "partial": True}


def dump_scenario(scn_path):
    """读场景 → 纯数据（地形 / 高度 / 图层 / 玩家 / 物件）。
    ⚠️ AoE2ScenarioParser 在同一进程里连续读不同版本的场景会串版本（实测第 2 个起报 execute_on_load / architecture_set），
       所以 main 里每关都开一个子进程跑本函数（--dump），主进程只管 dat 与精灵。"""
    try:
        s = load_scenario(scn_path)
    except Exception:
        return dump_scenario_raw(scn_path)
    mm = s.map_manager
    W, H = mm.map_width, mm.map_height
    terrain = [0] * (W * H); elev = [0] * (W * H); layer = [-1] * (W * H)
    for t in mm.terrain:
        i = t.y * W + t.x
        terrain[i] = int(t.terrain_id); elev[i] = int(t.elevation)
        lv = safe_attr(t, "layer", -1)
        lv = int(lv) if lv is not None else -1
        layer[i] = lv if lv >= 0 else -1
    players = s.player_manager.players
    pinfo = []
    for i in range(9):
        p = players[i] if i < len(players) else None
        civ = civ_index(safe_attr(p, "civilization")) if p is not None else 0
        arch_raw = safe_attr(p, "architecture_set") if p is not None else None
        arch = civ_index(arch_raw) if arch_raw is not None and not isinstance(arch_raw, (int, float)) else as_int(arch_raw, -1)
        color = as_int(safe_attr(p, "color", i - 1), max(0, i - 1)) if p is not None else 0
        pinfo.append({"civ": civ, "arch": arch, "color": color})
    units = []
    for pl, plist in enumerate(s.unit_manager.units):
        for u in plist:
            units.append({"pl": pl, "id": int(u.unit_const), "x": float(u.x), "y": float(u.y),
                          "rot": float(u.rotation), "garrison": int(safe_attr(u, "garrisoned_in_id", -1) if safe_attr(u, "garrisoned_in_id", -1) is not None else -1)})
    return {"W": W, "H": H, "terrain": terrain, "elev": elev, "layer": layer, "players": pinfo, "units": units}


def build_level(dat, colors, sprites, scn_path, meta, out_id):
    import subprocess
    tmp = scn_path.with_suffix(".dump.json")
    r = subprocess.run([sys.executable, __file__, "--dump", str(scn_path), str(tmp)], capture_output=True, text=True,
                       encoding="utf-8", errors="replace")
    if r.returncode != 0 or not tmp.exists():
        last = (r.stderr or r.stdout).strip().splitlines()
        raise RuntimeError(last[-1] if last else f"dump 失败 code={r.returncode}")
    sd = json.loads(tmp.read_text(encoding="utf-8"))
    W, H = sd["W"], sd["H"]
    terrain, elev, layer, pinfo = sd["terrain"], sd["elev"], sd["layer"], sd["players"]

    objects, missing, skipped = [], {}, {}
    placed = set()   # (unit id, x, y)：场景里已存的物件，补附属件时去重

    def emit(pl, uid, x, y, rot, depth=0):
        info = pinfo[pl] if pl < len(pinfo) else pinfo[0]
        civ = info["civ"]
        base = dat.unit(civ, uid)
        if base is None:
            skipped[f"dat 无此物件 #{uid}"] = skipped.get(f"dat 无此物件 #{uid}", 0) + 1
            return
        if base.type == 80 and info["arch"] > 0:
            civ = info["arch"]              # 建筑按玩家设定的建筑风格（architecture_set）
            base = dat.unit(civ, uid) or base
        # DE 建筑附属件（dat building.annexes）：城门两侧门柱、城镇中心的前/中/后三块等，
        # 场景文件只存主体，游戏载入时按 dat 的 misplacement 自动生成 —— 这里照 dat 同样生成。
        if base.type == 80 and depth == 0:
            for a in base.building.annexes:
                if a.unit_id >= 0:
                    ax_, ay_ = x + a.misplacement_x, y + a.misplacement_y
                    if (a.unit_id, round(ax_, 2), round(ay_, 2)) not in placed:
                        emit(pl, a.unit_id, ax_, ay_, 0.0, depth + 1)
        # DE 建筑地基（dat building.foundation_terrain_id）：游戏载入时把建筑占地格换成这块地形
        #（农田 = 7 Farm 地形、民居/城镇中心等 = 27 Foundation）—— 农田的样子就是这块地形本身。
        if base.type == 80 and base.building.foundation_terrain_id >= 0:
            sx_, sy_ = base.collision_size_x, base.collision_size_y
            for cy in range(math.ceil(y - sy_ - 0.5), math.floor(y + sy_ - 0.5) + 1):
                for cx in range(math.ceil(x - sx_ - 0.5), math.floor(x + sx_ - 0.5) + 1):
                    if 0 <= cx < W and 0 <= cy < H:
                        terrain[cy * W + cx] = int(base.building.foundation_terrain_id)
                        layer[cy * W + cx] = -1
        gid = base.standing_graphic[0]
        if gid < 0:
            skipped[f"{base.name}(无图)"] = skipped.get(f"{base.name}(无图)", 0) + 1
            return
        radians = base.type in (60, 70)
        g = dat.graphic(gid)
        fkey = frame_index(g, rot, radians) if g else 0
        color = info["color"] if pl > 0 else -1
        tint = colors[color % 8] if color >= 0 else None
        key_src = f"{gid}|{fkey}|{rot if not radians else ''}|{color}"
        key = hashlib.md5(key_src.encode()).hexdigest()[:12]
        if key not in sprites:
            layers, miss = render_graphic(dat, gid, rot, radians, tint)
            for m in miss:
                missing[m] = missing.get(m, 0) + 1
            if not layers:
                sprites[key] = None
            else:
                img, ax, ay = composite(layers)
                img.save(SPR / f"{key}.png")
                sprites[key] = {"w": img.width, "h": img.height, "ax": ax, "ay": ay,
                                "unit": uid, "name": base.name, "graphic": gid}
        if sprites[key] is None:
            skipped[f"{base.name}(无图)"] = skipped.get(f"{base.name}(无图)", 0) + 1
            return
        objects.append({"name": key, "x": round(x, 3), "y": round(y, 3),
                        "id": uid, "unit": base.name, "player": pl, **({"annex": 1} if depth else {})})

    live = []
    for u in sd["units"]:
        if u["garrison"] >= 0:
            skipped["驻扎"] = skipped.get("驻扎", 0) + 1
            continue
        live.append(u)
        placed.add((u["id"], round(u["x"], 2), round(u["y"], 2)))
    for u in live:
        emit(u["pl"], u["id"], u["x"], u["y"], u["rot"])

    out = {
        "header": {"campaign": meta, "size": W, "source": "AoE2 DE scenario (verbatim)"},
        "width": W, "height": H, "terrain": terrain, "layer": layer, "elev": elev, "objects": objects,
    }
    write_atomic(OUT / f"{out_id}.json", json.dumps(out, ensure_ascii=False))
    return {"id": out_id, **meta, "file": f"{out_id}.json", "width": W, "height": H,
            "objects": len(objects), "missing": missing, "skipped": skipped}


def write_atomic(path, text):
    """先写临时文件再替换；Windows 上文件偶尔被开发服务器/杀软短暂占用（Errno 22/13），重试几次。"""
    import time
    tmp = path.with_suffix(path.suffix + ".tmp")
    for i in range(20):
        try:
            tmp.write_text(text, encoding="utf-8")
            os.replace(tmp, path)
            return
        except OSError:
            time.sleep(0.5 * (i + 1))
    raise


def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__); sys.exit(1)
    if args[0] == "--dump":
        Path(args[2]).write_text(json.dumps(dump_scenario(Path(args[1]))), encoding="utf-8")
        return
    OUT.mkdir(parents=True, exist_ok=True); SPR.mkdir(parents=True, exist_ok=True); WORK.mkdir(parents=True, exist_ok=True)
    jobs = []   # (stem, level_or_0)
    if args[0] == "--all":
        for p in sorted(CAMPAIGN_DIR.glob("*.aoe2campaign")):
            jobs.append((p, 0))
        for p in sorted(CAMPAIGN_DIR.glob("*.aoe2scenario")):
            jobs.append((p, 0))
    else:
        cam = args[0]
        only = int(args[1]) if len(args) > 1 else 0
        p = CAMPAIGN_DIR / f"{cam}.aoe2campaign"
        if not p.exists():
            p = CAMPAIGN_DIR / f"{cam}.aoe2scenario"
        jobs.append((p, only))

    print("读取 dat …", flush=True)
    dat = Dat()
    colors = load_player_colors()
    spr_file = OUT / "sprites.json"
    sprites = json.loads(spr_file.read_text(encoding="utf-8")) if spr_file.exists() else {}
    idx_file = OUT / "index.json"
    index = {e["id"]: e for e in json.loads(idx_file.read_text(encoding="utf-8"))} if idx_file.exists() else {}

    for path, only in jobs:
        if path.suffix == ".aoe2campaign":
            cname, levels = split_campaign(path)
            todo = [(i, n, f, b) for i, (n, f, b) in enumerate(levels, 1) if not only or i == only]
        else:
            cname = path.stem
            todo = [(1, path.name, path.name, path.read_bytes())]
        for lvl, name, fname, blob in todo:
            out_id = f"{path.stem}_{lvl}"
            if index.get(out_id, {}).get("v") == BUILD_VERSION and (OUT / f"{out_id}.json").exists():
                continue   # 已按当前版本导出过（中断后重跑可续做）
            scn = WORK / path.stem / fname
            scn.parent.mkdir(parents=True, exist_ok=True)
            scn.write_bytes(blob)
            meta = {"campaign": path.stem, "campaignName": cname, "level": lvl, "name": name}
            try:
                e = build_level(dat, colors, sprites, scn, meta, out_id)
            except Exception as ex:  # 个别老格式场景读不了：记下来，不中断
                print(f"  ✘ {out_id} {name}: {type(ex).__name__}: {ex}", flush=True)
                continue
            index[out_id] = {k: v for k, v in e.items() if k not in ("missing", "skipped")}
            index[out_id]["missingCount"] = sum(e["missing"].values())
            index[out_id]["v"] = BUILD_VERSION
            print(f"  ✔ {out_id} {name} {e['width']}x{e['height']} 物件 {e['objects']}"
                  f"  缺图 {sum(e['missing'].values())} {list(e['missing'].items())[:5]}  跳过 {e['skipped']}", flush=True)
            write_atomic(spr_file, json.dumps(sprites, ensure_ascii=False))
            write_atomic(idx_file, json.dumps(sorted(index.values(), key=lambda x: (x["campaign"], x["level"])), ensure_ascii=False, indent=1))
            _sld_cache.clear()


if __name__ == "__main__":
    main()


