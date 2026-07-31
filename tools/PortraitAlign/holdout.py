"""
严格留出法验证 offsetY 自动算法：一半图拟合，另一半图测试（测试集完全没参与拟合）。
再跑 5 折交叉验证确认稳定性。只读，不写数据。
"""
import os
import sys
import random

import numpy as np
from detect import detect_face, ROOT
from validate import load_manual


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 400
    manual = load_manual()
    keys = [k for k in manual if os.path.exists(os.path.join(ROOT, "public", k.lstrip("/")))]
    random.seed(23)
    random.shuffle(keys)
    keys = keys[:n]

    X, Y, meta = [], [], []
    for k in keys:
        r = detect_face(os.path.join(ROOT, "public", k.lstrip("/")))
        if r is None:
            continue
        sc, ox, oy = manual[k]
        ey = r["eye_mid"][1]
        X.append([ey, 1.0])
        Y.append(oy)
        meta.append((k, sc, ey))
    X = np.array(X)
    Y = np.array(Y)
    print(f"样本 {len(Y)} 张\n")

    idx = np.arange(len(Y))
    rng = np.random.default_rng(7)
    rng.shuffle(idx)

    # ── 五折交叉验证 ──
    folds = np.array_split(idx, 5)
    all_err = []
    print("─── 5 折交叉验证（每折都只用其余 4 折拟合）───")
    for i, te in enumerate(folds):
        tr = np.concatenate([f for j, f in enumerate(folds) if j != i])
        coef, *_ = np.linalg.lstsq(X[tr], Y[tr], rcond=None)
        err = np.abs(X[te] @ coef - Y[te])
        all_err.append(err)
        print(f"  第{i+1}折  n={len(te):3d}  误差中位={np.median(err):5.2f}px  "
              f"≤5px={np.mean(err<=5)*100:5.1f}%  ≤10px={np.mean(err<=10)*100:5.1f}%  "
              f"拟合系数 a={coef[0]:.1f} b={coef[1]:.1f}")
    e = np.concatenate(all_err)
    print(f"\n  合并  误差中位={np.median(e):.2f}px  p90={np.percentile(e,90):.2f}px  "
          f"≤5px={np.mean(e<=5)*100:.1f}%  ≤10px={np.mean(e<=10)*100:.1f}%")

    # ── 对照：同样口径下"文件夹默认"能到多少 ──
    fold_of = {}
    for (k, sc, ey) in meta:
        fold_of.setdefault(k.rsplit("/", 1)[0], []).append(None)
    errF = []
    for i in range(len(Y)):
        f = meta[i][0].rsplit("/", 1)[0]
        same = [Y[j] for j in range(len(Y)) if meta[j][0].rsplit("/", 1)[0] == f and j != i]
        errF.append(abs((np.median(same) if same else np.median(Y)) - Y[i]))
    errF = np.array(errF)
    print(f"  对照·文件夹默认  误差中位={np.median(errF):.2f}px  ≤5px={np.mean(errF<=5)*100:.1f}%")

    # ── 残差最大的几张：看是不是检测出错，还是主人有意为之 ──
    coef, *_ = np.linalg.lstsq(X, Y, rcond=None)
    res = np.abs(X @ coef - Y)
    order = np.argsort(-res)[:8]
    print("\n─── 偏差最大的 8 张（自动算法最不该动的就是这类）───")
    for i in order:
        k, sc, ey = meta[i]
        print(f"  {os.path.basename(k):34s} 手调offsetY={Y[i]:7.1f}  预测={X[i]@coef:7.1f}  差={res[i]:6.1f}px")


if __name__ == "__main__":
    main()
