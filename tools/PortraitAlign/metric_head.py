"""
再试一种尺度度量：用 alpha 剪影量【真实头顶→下巴】的头高（含头盔/发髻），
这正是调校尺上「顶线 0.10 → 下巴线 0.34」在量的东西。只读，不写数据。
"""
import os
import sys
import json
import random

import numpy as np
import cv2
from detect import detect_face, ROOT
from validate import load_manual, cv


def head_span(path, r):
    """
    返回 (头顶Y, 下巴Y)，归一化到图高。
    头顶：只在脸部横向范围内找最上方的不透明像素 —— 避开举起的兵器/旗杆。
    下巴：由眼、嘴位置外推（嘴下方约 0.8 倍"眼→嘴"距离）。
    """
    img = cv2.imdecode(np.fromfile(path, np.uint8), cv2.IMREAD_UNCHANGED)
    if img is None or img.ndim != 3 or img.shape[2] != 4:
        return None
    H, W = img.shape[:2]
    alpha = img[:, :, 3]

    bx, by, bw, bh = r["box"]
    # 脸框左右各放宽 45%，覆盖头盔/发髻但不至于扫到肩膀外的兵器
    x0 = int(max(0, (bx - bw * 0.45) * W))
    x1 = int(min(W, (bx + bw * 1.45) * W))
    if x1 - x0 < 8:
        return None
    band = alpha[:, x0:x1]
    rows_op = np.where((band > 16).sum(axis=1) >= 3)[0]
    if rows_op.size == 0:
        return None
    top = rows_op[0] / H

    eye_mid = np.array(r["eye_mid"])
    mouth_mid = (np.array(r["mouthR"]) + np.array(r["mouthL"])) / 2
    em = mouth_mid[1] - eye_mid[1]
    chin = mouth_mid[1] + em * 0.8
    return float(top), float(chin)


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 250
    manual = load_manual()
    keys = [k for k in manual if os.path.exists(os.path.join(ROOT, "public", k.lstrip("/")))]
    random.seed(11)
    random.shuffle(keys)
    keys = keys[:n]

    rows = []
    for k in keys:
        p = os.path.join(ROOT, "public", k.lstrip("/"))
        r = detect_face(p)
        if r is None:
            continue
        hs = head_span(p, r)
        if hs is None:
            continue
        top, chin = hs
        if chin <= top:
            continue
        eye_mid = np.array(r["eye_mid"])
        mouth_mid = (np.array(r["mouthR"]) + np.array(r["mouthL"])) / 2
        rows.append({
            "key": k, "scale": manual[k][0],
            "head_h": chin - top,                       # 头顶→下巴（含盔）
            "eye_chin": chin - eye_mid[1],              # 眼→下巴（不含盔）
            "eye_mouth": float(mouth_mid[1] - eye_mid[1]),
            "top": top, "chin": chin,
        })
    print(f"样本 {len(rows)} 张\n")

    s = np.array([r["scale"] for r in rows])
    print(f"{'度量':12s} {'r(scale,1/m)':>13s} {'原始CV':>8s} {'调后CV':>8s} {'降幅':>7s} {'误差中位':>9s} {'±0.05占比':>9s}")
    for nm in ("head_h", "eye_chin", "eye_mouth"):
        m = np.array([r[nm] for r in rows])
        tgt = np.median(s * m)
        err = np.abs(tgt / m - s)
        cv0, cv1 = cv(m), cv(s * m)
        print(f"{nm:12s} {np.corrcoef(s,1/m)[0,1]:+13.3f} {cv0:7.1f}% {cv1:7.1f}% "
              f"{(cv0-cv1)/cv0*100:+6.1f}% {np.median(err):9.3f} {(err<=0.05).mean()*100:8.1f}%")

    # 两个度量组合（含盔头高 + 不含盔眼颏）能否更好
    hh = np.array([r["head_h"] for r in rows])
    ec = np.array([r["eye_chin"] for r in rows])
    for w in (0.3, 0.5, 0.7):
        mix = hh ** w * ec ** (1 - w)
        tgt = np.median(s * mix)
        err = np.abs(tgt / mix - s)
        print(f"组合 head^{w:.1f}·eyechin^{1-w:.1f}  误差中位={np.median(err):.3f} "
              f"±0.05占比={(err<=0.05).mean()*100:.1f}%")

    json.dump(rows, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "head_data.json"), "w"),
              ensure_ascii=False)


if __name__ == "__main__":
    main()
