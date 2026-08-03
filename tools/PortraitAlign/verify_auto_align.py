# -*- coding: utf-8 -*-
"""
综合验证：三种头部度量的自动归一化效果（只读，不写任何数据）。
度量：
  head_h   = alpha 剪影头顶→下巴（含盔/发髻）——调校尺「顶线0.10→下巴0.34」量的东西
  eye_chin = 眼→下巴（不含盔，纯脸）
  eye_dist = 双眼间距
判据（CC 方案）：自动 scale = 目标常数 / 度量，目标常数取手调样本中位。
报告：原始 CV / 手调后 CV / 自动后 CV（定义上≈0）、自动预测误差分布。
"""
import os
import sys
import re
import json
import random

import numpy as np
import cv2

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from detect import detect_face, ROOT
from validate import load_manual, cv

def head_span(path, r):
    """alpha 剪影真实头顶→下巴（含盔）。与 metric_head.py 同逻辑，修正 float 序列化。"""
    img = cv2.imdecode(np.fromfile(path, np.uint8), cv2.IMREAD_UNCHANGED)
    if img is None or img.ndim != 3 or img.shape[2] != 4:
        return None
    H, W = img.shape[:2]
    alpha = img[:, :, 3]
    bx, by, bw, bh = r["box"]
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
    miss_face = 0
    miss_span = 0
    for k in keys:
        p = os.path.join(ROOT, "public", k.lstrip("/"))
        r = detect_face(p)
        if r is None:
            miss_face += 1
            continue
        hs = head_span(p, r)
        if hs is None:
            miss_span += 1
            continue
        top, chin = hs
        if chin <= top:
            continue
        eye_mid = np.array(r["eye_mid"])
        mouth_mid = (np.array(r["mouthR"]) + np.array(r["mouthL"])) / 2
        rows.append({
            "key": k, "scale": manual[k][0], "offsetX": manual[k][1], "offsetY": manual[k][2],
            "head_h": float(chin - top),
            "eye_chin": float(chin - eye_mid[1]),
            "eye_mouth": float(mouth_mid[1] - eye_mid[1]),
            "eye_dist": float(r["eye_dist"]),
            "eye_x": float(eye_mid[0]), "eye_y": float(eye_mid[1]),
            "top": float(top), "chin": float(chin),
            "score": float(r["score"]),
        })
    print(f"手调记录 {len(manual)} 条 | 取样 {len(keys)} | 检出脸 {len(keys)-miss_face} | 量出头部 {len(rows)}")

    if not rows:
        return
    s = np.array([r["scale"] for r in rows])
    ox = np.array([r["offsetX"] for r in rows])
    oy = np.array([r["offsetY"] for r in rows])
    ex = np.array([r["eye_x"] for r in rows])
    ey = np.array([r["eye_y"] for r in rows])

    print(f"\n{'度量':12s} {'r(scale,1/m)':>11s} {'原始CV':>8s} {'手调后CV':>8s} {'降幅':>7s} {'自动误差中位':>10s} {'±0.05':>7s} {'自动后CV':>8s}")
    for nm in ("head_h", "eye_chin", "eye_mouth", "eye_dist"):
        m = np.array([r[nm] for r in rows])
        tgt = np.median(s * m)
        auto = tgt / m
        err = np.abs(auto - s)
        cv0, cv1 = cv(m), cv(s * m)
        cv_auto = cv(auto * m)
        print(f"{nm:12s} {np.corrcoef(s,1/m)[0,1]:+11.3f} {cv0:7.1f}% {cv1:7.1f}% "
              f"{(cv0-cv1)/cv0*100:+6.1f}% {np.median(err):10.3f} {(err<=0.05).mean()*100:6.1f}% {cv_auto:7.2f}%")

    print(f"\n─── 垂直 offsetY（对照 align_one 已验证）───")
    print(f"r(offsetY, eyeY) = {np.corrcoef(oy, ey)[0,1]:+.3f}")
    print(f"─── 横向 offsetX ───")
    tuned = np.abs(ox) > 0
    print(f"调过横向的: {tuned.sum()}/{len(ox)} ({tuned.mean()*100:.1f}%)")
    if tuned.sum() >= 10:
        print(f"r(offsetX, eyeX)[仅调过的] = {np.corrcoef(ox[tuned], ex[tuned])[0,1]:+.3f}")
        print(f"眼睛X 中位 = {np.median(ex):.4f}（胸线 0.5，椭圆中心 0.57）")

if __name__ == "__main__":
    main()
