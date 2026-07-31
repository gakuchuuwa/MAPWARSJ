"""
横向偏移能不能也自动？只看主人真正调过 offsetX 的那些图（其余 88.6% 是 0，会稀释相关性）。
只读，不写数据。
"""
import os
import random
import sys

import numpy as np
from detect import detect_face, ROOT
from validate import load_manual

CHEST_X = 0.5      # PORTRAIT_GUIDE_PREVIEW_CHEST_LINE_X
OVAL_DX = 0.07     # 椭圆中心相对胸线右移


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 260
    manual = load_manual()
    tuned = [k for k, v in manual.items()
             if v[1] != 0 and os.path.exists(os.path.join(ROOT, "public", k.lstrip("/")))]
    zero = [k for k, v in manual.items()
            if v[1] == 0 and os.path.exists(os.path.join(ROOT, "public", k.lstrip("/")))]
    random.seed(31)
    random.shuffle(tuned)
    random.shuffle(zero)
    sample = tuned[:n // 2] + zero[:n // 2]
    print(f"取样：调过横向 {len(tuned[:n//2])} 张 + 没调过 {len(zero[:n//2])} 张\n")

    rows = []
    for k in sample:
        r = detect_face(os.path.join(ROOT, "public", k.lstrip("/")))
        if r is None:
            continue
        rows.append({"k": k, "ox": manual[k][1], "ex": float(r["eye_mid"][0]),
                     "tuned": manual[k][1] != 0})

    T = [r for r in rows if r["tuned"]]
    Z = [r for r in rows if not r["tuned"]]

    def stat(rs, name):
        if len(rs) < 10:
            return
        ex = np.array([r["ex"] for r in rs])
        ox = np.array([r["ox"] for r in rs])
        print(f"{name}  n={len(rs)}")
        print(f"   眼睛X 中位={np.median(ex):.4f}  (胸线 {CHEST_X}, 椭圆中心 {CHEST_X+OVAL_DX})")
        print(f"   眼睛X 离散 std={ex.std():.4f}")
        if rs is T:
            print(f"   r(offsetX, 眼睛X) = {np.corrcoef(ox, ex)[0,1]:+.3f}")

    stat(Z, "【offsetX 保持 0 的】")
    stat(T, "【offsetX 调过的】")

    # 若真按"把眼睛推到椭圆中心"算，会给没调过的那批带来多大改动？
    if Z:
        ex = np.array([r["ex"] for r in Z])
        need = -512.0 * (ex - (CHEST_X + OVAL_DX))    # 与 offsetY 同一套换算
        print(f"\n若把「眼睛X 推到椭圆中心 {CHEST_X+OVAL_DX}」自动化，"
              f"对你保持 0 的那批会产生偏移：")
        print(f"   |偏移| 中位={np.median(np.abs(need)):.1f}px  p90={np.percentile(np.abs(need),90):.1f}px")
        print(f"   —— 你却把它们全留在 0，说明你并不想动横向。")


if __name__ == "__main__":
    main()
