"""
用主人已有的手调值当真值，留一法(leave-one-out)对比三种自动策略谁更准：
  A 文件夹默认   —— 同夹其它图的中位数
  B 全局单值     —— 全部图的中位数
  C YuNet 逐图算 —— 按检测到的脸几何解算
只读，不写任何数据。
"""
import os
import re
import sys
import random

import numpy as np
from detect import detect_face, ROOT
from validate import load_manual


def folder_of(k):
    return k.rsplit("/", 1)[0] + "/"


def loo_median(vals, i):
    """留一中位数：排除第 i 个自己"""
    rest = [v for j, v in enumerate(vals) if j != i]
    return float(np.median(rest)) if rest else None


def report(name, err, tol):
    err = np.asarray(err, float)
    print(f"  {name:22s} 误差中位={np.median(err):7.4f}  p90={np.percentile(err,90):7.4f}  "
          f"≤{tol} 占比={(err<=tol).mean()*100:5.1f}%")


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 400
    manual = load_manual()
    keys = [k for k in manual if os.path.exists(os.path.join(ROOT, "public", k.lstrip("/")))]
    random.seed(23)
    random.shuffle(keys)
    keys = keys[:n]

    rows = []
    for k in keys:
        r = detect_face(os.path.join(ROOT, "public", k.lstrip("/")))
        if r is None:
            continue
        sc, ox, oy = manual[k]
        eye_mid = np.array(r["eye_mid"])
        mouth_mid = (np.array(r["mouthR"]) + np.array(r["mouthL"])) / 2
        rows.append({
            "key": k, "folder": folder_of(k), "scale": sc, "offsetY": oy,
            "eye_y": float(eye_mid[1]),
            "eye_mouth": float(mouth_mid[1] - eye_mid[1]),
        })
    print(f"样本 {len(rows)} 张，覆盖 {len(set(r['folder'] for r in rows))} 个文件夹\n")

    # ── 先看同夹内部的离散度：这决定了"一夹一个值"是否站得住 ──
    print("─── 同夹内手调值的离散程度（越小说明文件夹默认越有代表性）───")
    for field, unit in (("scale", ""), ("offsetY", "px")):
        spreads, gspread = [], np.std([r[field] for r in rows])
        for f in set(r["folder"] for r in rows):
            v = [r[field] for r in rows if r["folder"] == f]
            if len(v) >= 8:
                spreads.append(np.std(v))
        print(f"  {field:8s} 夹内标准差中位={np.median(spreads):7.3f}{unit}   "
              f"全局标准差={gspread:7.3f}{unit}   "
              f"夹内/全局={np.median(spreads)/gspread*100:5.1f}%")
    print("  （接近 100% = 分夹没什么用；明显低于 100% = 分夹确实抓住了差异）\n")

    # ── 三策略留一法对比 ──
    for field, tol in (("scale", 0.05), ("offsetY", 5.0)):
        vals = [r[field] for r in rows]
        gmed_all = np.median(vals)
        errA, errB, errC = [], [], []
        for i, r in enumerate(rows):
            # A 文件夹默认（留一）
            idx = [j for j, q in enumerate(rows) if q["folder"] == r["folder"]]
            fa = [rows[j][field] for j in idx if j != i]
            predA = np.median(fa) if fa else gmed_all
            errA.append(abs(predA - r[field]))
            # B 全局单值（留一）
            errB.append(abs(loo_median(vals, i) - r[field]))
        # C YuNet 逐图
        if field == "scale":
            m = np.array([r["eye_mouth"] for r in rows])
            tgt = np.median([r["scale"] * r["eye_mouth"] for r in rows])
            errC = list(np.abs(tgt / m - np.array(vals)))
        else:
            ey = np.array([r["eye_y"] for r in rows])
            A = np.vstack([ey, np.ones_like(ey)]).T          # offsetY ≈ a*eye_y + b
            coef, *_ = np.linalg.lstsq(A, np.array(vals), rcond=None)
            errC = list(np.abs(A @ coef - np.array(vals)))

        print(f"─── {field} 预测误差（越小越好，容差 ±{tol}）───")
        report("A 文件夹默认", errA, tol)
        report("B 全局单值", errB, tol)
        report("C YuNet 逐图", errC, tol)
        best = min([("A", np.median(errA)), ("B", np.median(errB)), ("C", np.median(errC))], key=lambda x: x[1])
        print(f"  → 最优: {best[0]}\n")


if __name__ == "__main__":
    main()
