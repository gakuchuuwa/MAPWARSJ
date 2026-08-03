# -*- coding: utf-8 -*-
"""
全量测量：对 public/assets 下所有在用立绘跑 YuNet，输出测量表（只读，不写游戏数据）。
输出: tools/PortraitAlign/full_measures.json
  [{ path, sha256, eyeY, eyeX, eyeChin, eyeDist, score, W, H }]
"""
import os
import sys
import json
import hashlib
import time

import numpy as np
import cv2

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from detect import detect_face, ROOT, SKIP_DIRS

ASSETS = os.path.join(ROOT, "public", "assets")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "full_measures.json")
ADJ = os.path.join(ROOT, "src", "data", "portrait_adjust.ts")

def head_span(path, r):
    """alpha 剪影头顶→下巴（含盔）"""
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

def all_pngs():
    out = []
    for d in sorted(os.listdir(ASSETS)):
        if d in SKIP_DIRS:
            continue
        p = os.path.join(ASSETS, d)
        if not os.path.isdir(p):
            continue
        for f in sorted(os.listdir(p)):
            if f.lower().endswith(".png"):
                out.append((d, f))
    return out

def main():
    files = all_pngs()
    print(f"全部 PNG: {len(files)} 张")
    rows = []
    t0 = time.time()
    miss = 0
    for i, (d, f) in enumerate(files):
        rel = os.path.join(d, f)
        abs_p = os.path.join(ASSETS, rel)
        web = f"/assets/{d}/{f}"
        sha = hashlib.sha256(open(abs_p, "rb").read()).hexdigest()
        r = detect_face(abs_p)
        rec = {"path": web, "sha256": sha, "W": 0, "H": 0,
               "eyeY": None, "eyeX": None, "eyeChin": None, "eyeDist": None,
               "headH": None, "score": None}
        if r is not None:
            eye_mid = np.array(r["eye_mid"])
            mouth_mid = (np.array(r["mouthR"]) + np.array(r["mouthL"])) / 2
            em = mouth_mid[1] - eye_mid[1]
            chin = mouth_mid[1] + em * 0.8
            hs = head_span(abs_p, r)
            rec.update({
                "W": int(r["size"][0]), "H": int(r["size"][1]),
                "eyeY": float(eye_mid[1]), "eyeX": float(eye_mid[0]),
                "eyeChin": float(chin - eye_mid[1]),
                "eyeDist": float(r["eye_dist"]),
                "headH": float(hs[1] - hs[0]) if hs else None,
                "score": float(r["score"]),
            })
        else:
            miss += 1
        rows.append(rec)
        if (i + 1) % 200 == 0:
            el = time.time() - t0
            print(f"  {i+1}/{len(files)}  检出缺失 {miss}  耗时 {el:.0f}s")
    json.dump(rows, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"\n完成: {len(rows)} 张，检测缺失 {miss}，输出 {OUT}")

if __name__ == "__main__":
    main()
