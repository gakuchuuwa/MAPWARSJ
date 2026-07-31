"""
拿主人已有的手调记录验证：自动测量能不能复现他的调校意图？
只读，不写任何数据。

用法: python validate.py [张数]
"""
import os
import re
import sys
import json
import random

import numpy as np
from detect import detect_face, ROOT

ADJ = os.path.join(ROOT, "src", "data", "portrait_adjust.ts")


def load_manual():
    txt = open(ADJ, encoding="utf-8").read()
    s = txt.index('"images": {')
    e = txt.index('"folderGuides"')
    out = {}
    for m in re.finditer(
        r'"([^"]+\.png)":\s*\{\s*"scale":\s*(-?[\d.]+),\s*"offsetX":\s*(-?[\d.]+),\s*"offsetY":\s*(-?[\d.]+)',
        txt[s:e],
    ):
        out[m.group(1)] = (float(m.group(2)), float(m.group(3)), float(m.group(4)))
    return out


def cv(a):
    a = np.asarray(a, float)
    return a.std() / a.mean() * 100


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 250
    manual = load_manual()
    keys = [k for k in manual if os.path.exists(os.path.join(ROOT, "public", k.lstrip("/")))]
    random.seed(11)
    random.shuffle(keys)
    keys = keys[:n]
    print(f"手调记录 {len(manual)} 条，本次取样 {len(keys)} 张\n")

    rows = []
    miss = 0
    for k in keys:
        r = detect_face(os.path.join(ROOT, "public", k.lstrip("/")))
        if r is None:
            miss += 1
            continue
        sc, ox, oy = manual[k]
        rows.append({
            "key": k, "scale": sc, "offsetX": ox, "offsetY": oy,
            "eye_dist": r["eye_dist"], "eye_x": r["eye_mid"][0], "eye_y": r["eye_mid"][1],
            "box_h": r["box"][3], "W": r["size"][0], "H": r["size"][1], "score": r["score"],
        })
    print(f"检出 {len(rows)}/{len(keys)}  检出率 {len(rows)/len(keys)*100:.1f}%")

    dims = {}
    for r in rows:
        dims[(r["W"], r["H"])] = dims.get((r["W"], r["H"]), 0) + 1
    print("图片尺寸分布:", sorted(dims.items(), key=lambda x: -x[1])[:4])

    s = np.array([r["scale"] for r in rows])
    ed = np.array([r["eye_dist"] for r in rows])
    ey = np.array([r["eye_y"] for r in rows])
    ex = np.array([r["eye_x"] for r in rows])
    oy = np.array([r["offsetY"] for r in rows])
    ox = np.array([r["offsetX"] for r in rows])

    print("\n─── 头部尺度 ───")
    print(f"双眼间距(原图)      变异系数 {cv(ed):5.1f}%   ← 不调整时头大小的离散程度")
    print(f"手调scale x 双眼间距 变异系数 {cv(s*ed):5.1f}%   ← 手调之后的离散程度")
    red = (cv(ed) - cv(s * ed)) / cv(ed) * 100
    print(f"离散度下降 {red:+.1f}%   {'→ 手调确实在把头拉齐 ✅' if red > 15 else '→ 看不出拉齐效果 ⚠'}")
    print(f"相关 r(scale, 1/双眼间距) = {np.corrcoef(s, 1/ed)[0,1]:+.3f}")

    print("\n─── 垂直位置 ───")
    print(f"眼睛Y(原图)          变异系数 {cv(ey):5.1f}%")
    print(f"相关 r(offsetY, 眼睛Y) = {np.corrcoef(oy, ey)[0,1]:+.3f}")
    print(f"相关 r(offsetX, 眼睛X) = {np.corrcoef(ox, ex)[0,1]:+.3f}")

    tgt = np.median(s * ed)
    pred = tgt / ed
    err = np.abs(pred - s)
    print("\n─── 若用「scale = 目标常数 / 双眼间距」预测你的手调 ───")
    print(f"目标常数(取中位) = {tgt:.5f}")
    print(f"预测误差 |auto-manual|: 中位={np.median(err):.3f}  p90={np.percentile(err,90):.3f}  最大={err.max():.3f}")
    within = (err <= 0.05).mean() * 100
    print(f"误差 ≤0.05(滑杆5格)的比例: {within:.1f}%")

    json.dump(rows, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "validate_data.json"), "w"),
              ensure_ascii=False)


if __name__ == "__main__":
    main()
