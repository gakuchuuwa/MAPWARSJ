"""
「头一样大吗」直观对比：只裁头部区域，上排=你现在的手调，下排=自动统一后。
渲染严格照搬 applyPortraitAdjustToElement：
    transform-origin = (50%, 23%)
    transform = translate(ox*0.7, oy*0.7) scale(s)
**只读，不写任何数据。**

用法: python preview_heads.py [张数] [随机种子]
"""
import os
import random
import sys

import cv2
import numpy as np

from detect import detect_face, load_rgb, ROOT
from validate import load_manual

EYE_Y, CHEST_X = 0.23, 0.5
OVAL_DX, OVAL_W, OVAL_H = 0.07, 0.29, 0.30
COMBAT_UI_SCALE = 0.7          # src/config/combat-ui-tokens.ts
COEF_A, EYE_LINE = -512.0, 0.2344

BOX_W, BOX_H = 384, 512        # 立绘槽位（设计像素比例）


def head_metric(r):
    eye = np.array(r["eye_mid"])
    mouth = (np.array(r["mouthR"]) + np.array(r["mouthL"])) / 2
    return float(mouth[1] - eye[1])


def render_slot(path, scale, off_x, off_y):
    """把立绘按游戏的变换画进槽位，返回槽位画布。"""
    img = load_rgb(path)
    H, W = img.shape[:2]
    # img 以 contain 方式铺满槽位（与 tuner 卡片一致）
    base = min(BOX_W / W, BOX_H / H)
    dw, dh = W * base, H * base
    x0, y0 = (BOX_W - dw) / 2, (BOX_H - dh) / 2
    # transform-origin 在槽位坐标系
    ox = BOX_W * CHEST_X
    oy = BOX_H * EYE_Y
    s = base * scale
    tx = ox + (x0 - ox) * scale + off_x * COMBAT_UI_SCALE
    ty = oy + (y0 - oy) * scale + off_y * COMBAT_UI_SCALE
    M = np.float32([[s, 0, tx], [0, s, ty]])
    canvas = np.full((BOX_H, BOX_W, 3), 45, np.uint8)
    cv2.warpAffine(img, M, (BOX_W, BOX_H), dst=canvas,
                   flags=cv2.INTER_AREA, borderMode=cv2.BORDER_TRANSPARENT)
    return canvas


def crop_head(canvas):
    """裁椭圆所在区域 —— 头应当落在这里。"""
    cx = int((CHEST_X + OVAL_DX) * BOX_W)
    cy = int(EYE_Y * BOX_H)
    hw = int(OVAL_W * BOX_W * 0.78)
    hh = int(OVAL_H * BOX_H * 0.78)
    x0, y0 = max(0, cx - hw), max(0, cy - hh)
    x1, y1 = min(BOX_W, cx + hw), min(BOX_H, cy + hh)
    tile = canvas[y0:y1, x0:x1].copy()
    # 画椭圆参考
    cv2.ellipse(tile, (cx - x0, cy - y0),
                (int(OVAL_W * BOX_W / 2), int(OVAL_H * BOX_H / 2)),
                0, 0, 360, (60, 220, 255), 1)
    yy = cy - y0
    for x in range(0, tile.shape[1], 8):
        cv2.line(tile, (x, yy), (min(x + 4, tile.shape[1]), yy), (255, 210, 60), 1)
    return cv2.resize(tile, (200, 220), interpolation=cv2.INTER_AREA)


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 8
    seed = int(sys.argv[2]) if len(sys.argv) > 2 else 3
    manual = load_manual()
    keys = [k for k in manual if os.path.exists(os.path.join(ROOT, "public", k.lstrip("/")))]
    random.seed(seed)
    random.shuffle(keys)

    calib, rows = [], []
    for k in keys:
        if len(calib) >= 200 and len(rows) >= n:
            break
        r = detect_face(os.path.join(ROOT, "public", k.lstrip("/")))
        if r is None:
            continue
        hm = head_metric(r)
        if hm <= 0:
            continue
        calib.append(manual[k][0] * hm)
        if len(rows) < n:
            rows.append((k, r, hm))
    target = float(np.median(calib))
    print(f"目标常数 {target:.5f}（{len(calib)} 张手调值的中位数）\n")

    top, bot = [], []
    for k, r, hm in rows:
        p = os.path.join(ROOT, "public", k.lstrip("/"))
        ms, mox, moy = manual[k]
        a_s = round(target / hm, 2)
        a_y = int(round(COEF_A * (r["eye_mid"][1] - EYE_LINE)))
        top.append(crop_head(render_slot(p, ms, mox, moy)))
        bot.append(crop_head(render_slot(p, a_s, mox, a_y)))
        print(f"  {os.path.basename(k)[:28]:28s} s {ms:.2f}->{a_s:.2f}   y {moy:+4.0f}->{a_y:+4d}")

    def strip(tiles, tag):
        row = np.hstack(tiles)
        bar = np.full((26, row.shape[1], 3), 25, np.uint8)
        cv2.putText(bar, tag, (8, 19), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
        return np.vstack([bar, row])

    out = np.vstack([strip(top, "BEFORE  (your manual)"),
                     strip(bot, "AFTER   (auto-unified head size)")])
    p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "preview_heads.png")
    cv2.imwrite(p, out)
    print("\n对比图:", p)


if __name__ == "__main__":
    main()
