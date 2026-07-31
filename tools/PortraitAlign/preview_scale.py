"""
「头部大小统一」预览：把 scale + offsetY 都按测量算出来，渲染成对比图。
左=现状（你的手调值），右=自动统一后。带标线和椭圆，直接看头对不对得上。
**只读，不写任何数据。**

用法: python preview_scale.py [张数] [随机种子]
"""
import os
import random
import sys

import cv2
import numpy as np

from detect import detect_face, load_rgb, ROOT
from validate import load_manual

# 与 src/config/PortraitAdjust.ts 保持一致
TOP_Y, EYE_Y, CHIN_Y, WAIST_Y = 0.10, 0.23, 0.34, 0.80
CHEST_X, OVAL_DX = 0.5, 0.07
OVAL_W, OVAL_H = 0.29, 0.30
COEF_A = -512.0          # 见 align_one.py
EYE_LINE = 0.2344

CANVAS = (384, 512)      # 预览画布 (w, h)


def head_metric(r):
    """眼→嘴中点距离（归一化到图高）——抗偏头，实测最稳的头部尺度基准。"""
    eye = np.array(r["eye_mid"])
    mouth = (np.array(r["mouthR"]) + np.array(r["mouthL"])) / 2
    return float(mouth[1] - eye[1])


def render(path, scale, offset_y, label):
    """按 transform-origin=(50%,23%) + translate + scale 渲染，与游戏一致。"""
    img = load_rgb(path)
    H, W = img.shape[:2]
    cw, ch = CANVAS
    base = min(cw / W, ch / H)
    canvas = np.full((ch, cw, 3), 40, np.uint8)

    s = base * scale
    ox_pix = CHEST_X * cw
    oy_pix = EYE_Y * ch
    M = np.float32([[s, 0, ox_pix - s * (W / 2) + 0],
                    [0, s, oy_pix - s * (H * EYE_Y) + offset_y * (ch / 1024.0) * 1.0]])
    cv2.warpAffine(img, M, (cw, ch), dst=canvas,
                   flags=cv2.INTER_AREA, borderMode=cv2.BORDER_TRANSPARENT)

    # 标线
    for y, c in ((TOP_Y, (255, 120, 220)), (EYE_Y, (255, 200, 60)),
                 (CHIN_Y, (200, 255, 200)), (WAIST_Y, (220, 160, 255))):
        yy = int(y * ch)
        for x in range(0, cw, 10):
            cv2.line(canvas, (x, yy), (min(x + 5, cw), yy), c, 1)
    xx = int(CHEST_X * cw)
    for y in range(0, ch, 10):
        cv2.line(canvas, (xx, y), (xx, min(y + 5, ch)), (120, 160, 255), 1)
    cv2.ellipse(canvas, (int((CHEST_X + OVAL_DX) * cw), int(EYE_Y * ch)),
                (int(OVAL_W * cw / 2), int(OVAL_H * ch / 2)), 0, 0, 360, (80, 220, 255), 1)
    cv2.putText(canvas, label, (5, ch - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (255, 255, 255), 1)
    return canvas


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 6
    seed = int(sys.argv[2]) if len(sys.argv) > 2 else 3
    manual = load_manual()

    # 用全部已调校的图标定目标值：让整体大小观感不变
    keys = [k for k in manual if os.path.exists(os.path.join(ROOT, "public", k.lstrip("/")))]
    random.seed(seed)
    random.shuffle(keys)

    calib, rows = [], []
    for k in keys:
        if len(calib) >= 160 and len(rows) >= n:
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
    print(f"标定样本 {len(calib)} 张，目标头高常数 = {target:.5f}")
    print(f"（= 你现有手调值的中位数，所以整体大小观感不变，只把参差拉平）\n")

    tiles = []
    for k, r, hm in rows:
        p = os.path.join(ROOT, "public", k.lstrip("/"))
        ms, mox, moy = manual[k]
        auto_s = round(target / hm, 2)
        auto_y = int(round(COEF_A * (r["eye_mid"][1] - EYE_LINE)))
        print(f"  {os.path.basename(k)[:30]:30s} 手调 s={ms:.2f} y={moy:+4.0f}  →  "
              f"自动 s={auto_s:.2f} y={auto_y:+4d}")
        a = render(p, ms, moy, f"现状 s={ms:.2f}")
        b = render(p, auto_s, auto_y, f"自动 s={auto_s:.2f}")
        sep = np.full((CANVAS[1], 3, 3), 90, np.uint8)
        tiles.append(np.hstack([a, sep, b]))

    cols = 3
    rows_img = [np.hstack(tiles[i:i + cols]) for i in range(0, len(tiles) - len(tiles) % cols, cols)]
    if rows_img:
        out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "preview_scale.png")
        cv2.imwrite(out, np.vstack(rows_img))
        print("\n预览图:", out)


if __name__ == "__main__":
    main()
