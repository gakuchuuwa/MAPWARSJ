"""
为 public/de-maps/campaign/sprites.json 中所有 5 向城墙/栅栏/海墙/水道桥精灵
生成完整的 5 个方向（a = 0: NE ↗↙, 1: SE ↘↖, 2: POST 角柱, 3: — 横向, 4: | 竖向）PNG，
并在每个城墙精灵条目上挂载 "frames5": [k0, k1, k2, k3, k4]，供 Scene13DeCampaignLoader
按邻格连通性自动选择正确朝向。
"""
import hashlib
import importlib.util
import json
from pathlib import Path

spec = importlib.util.spec_from_file_location("dcb", "tools/de-campaign-build.py")
dcb = importlib.util.module_from_spec(spec)
spec.loader.exec_module(dcb)

SPRITES_JSON = Path("public/de-maps/campaign/sprites.json")
SPR_DIR = Path("public/de-maps/campaign/sprites")

# 拥有 5 个方向 (A=5) 的城墙/木栅栏/海墙/水道桥 unit ID
WALL5_UNITS = {72, 117, 119, 155, 231, 370, 788, 1062}


def main():
    dat = dcb.Dat()
    colors = dcb.load_player_colors()
    sprites = json.loads(SPRITES_JSON.read_text(encoding="utf-8"))

    # 收集所有 WALL5_UNITS 的 (gid, uid, uname)
    wall_entries = [
        (k, v) for k, v in sprites.items()
        if isinstance(v, dict) and v.get("unit") in WALL5_UNITS
    ]
    print(f"Found {len(wall_entries)} wall sprite entries in sprites.json")

    # 对每个独特的 gid，检查它是否含 playercolor（只有 588/606/6594 含小旗子）
    unique_gids = sorted({v["graphic"] for _, v in wall_entries})
    print(f"Unique 5-angle wall gids ({len(unique_gids)}): {unique_gids}")

    # 为每个 (gid, color) 预渲染 5 个方向 a = 0..4
    # 注意：石墙/垛墙/城墙/围栏/水道桥 (28 个 gid) 不随玩家色变化，color 固定用 -1 即可；
    # 木栅栏/海墙 (588, 606, 6594) 带玩家色小旗，我们通过比对现有 key 反推其 color（若匹配不到则用 -1/0）。
    colored_gids = {588, 606, 6594}

    # 建立从现有 key -> (gid, color) 的反查表：
    # 在 de-campaign-build.py 中：key_src = f"{gid}|{fkey}|{rot}|{color}"
    # 我们扫描所有 236 张地图 JSON 里出现过的 wall object，或者直接为每个 gid 生成标准 5 帧 key：
    # 事实上，石墙等无色墙的 5 帧图像对所有玩家完全相同！
    # 木栅栏 (588, 606, 6594) 按 color in [-1, 0..7] 生成 5 帧。
    frames5_by_gid_color = {}
    new_pngs = 0

    for gid in unique_gids:
        g = dat.graphic(gid)
        A = max(1, g.angle_count)
        assert A == 5, f"Expected A=5 for gid={gid}, got {A}"
        # sample one entry for uid/name
        sample_v = next(v for _, v in wall_entries if v["graphic"] == gid)
        uid = sample_v["unit"]
        uname = sample_v["name"]

        color_list = [-1, 0, 1, 2, 3, 4, 5, 6, 7] if gid in colored_gids else [-1]
        for color in color_list:
            tint = colors[color % 8] if color >= 0 else None
            f5 = []
            for a in range(5):
                fkey = dcb.frame_index(g, float(a), False)
                key_src = f"{gid}|{fkey}|w5_{a}|{color}"
                k = hashlib.md5(key_src.encode()).hexdigest()[:12]
                png_path = SPR_DIR / f"{k}.png"
                if k not in sprites or not png_path.exists():
                    layers, _ = dcb.render_graphic(dat, gid, float(a), False, tint)
                    img, ax, ay = dcb.composite(layers)
                    img.save(png_path)
                    sprites[k] = {
                        "w": img.width,
                        "h": img.height,
                        "ax": ax,
                        "ay": ay,
                        "unit": uid,
                        "name": uname,
                        "graphic": gid,
                    }
                    new_pngs += 1
                f5.append(k)
            frames5_by_gid_color[(gid, color)] = f5
            # 把 frames5 自己也挂在每个新生成的方向精灵上
            for k in f5:
                sprites[k]["frames5"] = f5

    # 为所有关卡 JSON 中出现的木栅栏物件统计每个旧 key 对应的 player color，
    # 或者对 588/606/6594 旧 key 直接读 PNG 与 9 种 color 比对，精确匹配颜色！
    from PIL import Image
    import numpy as np

    # 为 588, 606, 6594 预加载 9 种 color × 5 方向 的 RGB 数组供快速匹配
    palisade_ref = {}
    for gid in colored_gids:
        if gid not in unique_gids:
            continue
        for color in [-1, 0, 1, 2, 3, 4, 5, 6, 7]:
            f5 = frames5_by_gid_color[(gid, color)]
            for a, k in enumerate(f5):
                arr = np.asarray(Image.open(SPR_DIR / f"{k}.png"))
                palisade_ref[(gid, a, color)] = arr

    matched_colored = 0
    for k, v in wall_entries:
        gid = v["graphic"]
        if gid not in colored_gids:
            v["frames5"] = frames5_by_gid_color[(gid, -1)]
        else:
            # 读取现有 k.png，找出与它完全相同的 (gid, a, color)
            p = SPR_DIR / f"{k}.png"
            best_color = 0
            if p.exists():
                arr = np.asarray(Image.open(p))
                found = False
                for a in range(5):
                    for color in [-1, 0, 1, 2, 3, 4, 5, 6, 7]:
                        ref = palisade_ref.get((gid, a, color))
                        if ref is not None and ref.shape == arr.shape and np.array_equal(ref, arr):
                            best_color = color
                            found = True
                            break
                    if found:
                        break
            v["frames5"] = frames5_by_gid_color[(gid, best_color)]
            matched_colored += 1

    dcb.write_atomic(SPRITES_JSON, json.dumps(sprites, ensure_ascii=False))
    print(f"Done! Generated {new_pngs} new angle PNGs, matched {matched_colored} colored palisade entries.")


if __name__ == "__main__":
    main()
