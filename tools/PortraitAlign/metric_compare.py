"""
比较几种「头部尺度」度量，哪个最能预测主人的手调 scale。
双眼间距会被侧脸压缩，未必是最好的基准。只读，不写数据。
"""
import os
import sys
import json
import random

import numpy as np
from detect import detect_face, ROOT
from validate import load_manual, cv


def metrics_from(r):
    """从 YuNet 结果算多种尺度候选，全部归一化到图宽/图高。"""
    W, H = r["size"]
    ar = W / H
    eyeR, eyeL = np.array(r["eyeR"]), np.array(r["eyeL"])
    nose = np.array(r["nose"])
    mR, mL = np.array(r["mouthR"]), np.array(r["mouthL"])
    eye_mid = (eyeR + eyeL) / 2
    mouth_mid = (mR + mL) / 2
    # 换算到"图高"为单位，消除宽高比差异
    def d(p, q):
        return float(np.hypot((p[0] - q[0]) * ar, p[1] - q[1]))
    yaw_sym = abs(d(nose, eyeR) - d(nose, eyeL)) / max(1e-6, d(eyeR, eyeL))  # 偏头程度
    return {
        "eye_dist": d(eyeR, eyeL),                  # 双眼间距（受偏头压缩）
        "eye_mouth": d(eye_mid, mouth_mid),         # 眼→嘴（抗偏头）
        "box_h": r["box"][3],                       # 人脸框高
        "box_diag": float(np.hypot(r["box"][2] * ar, r["box"][3])),
        "eye_nose": d(eye_mid, nose),
        "yaw": yaw_sym,
    }


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 250
    manual = load_manual()
    keys = [k for k in manual if os.path.exists(os.path.join(ROOT, "public", k.lstrip("/")))]
    random.seed(11)
    random.shuffle(keys)
    keys = keys[:n]

    rows = []
    for k in keys:
        r = detect_face(os.path.join(ROOT, "public", k.lstrip("/")))
        if r is None:
            continue
        m = metrics_from(r)
        m["scale"] = manual[k][0]
        m["score"] = r["score"]
        m["key"] = k
        rows.append(m)
    print(f"样本 {len(rows)} 张\n")

    names = ["eye_dist", "eye_mouth", "box_h", "box_diag", "eye_nose"]
    s = np.array([r["scale"] for r in rows])

    print(f"{'度量':10s} {'r(scale,1/m)':>13s} {'原始CV':>8s} {'调后CV':>8s} {'降幅':>7s} {'误差中位':>9s} {'±0.05占比':>9s}")
    for nm in names:
        m = np.array([r[nm] for r in rows])
        r_ = np.corrcoef(s, 1 / m)[0, 1]
        tgt = np.median(s * m)
        err = np.abs(tgt / m - s)
        cv0, cv1 = cv(m), cv(s * m)
        print(f"{nm:10s} {r_:+13.3f} {cv0:7.1f}% {cv1:7.1f}% {(cv0-cv1)/cv0*100:+6.1f}% "
              f"{np.median(err):9.3f} {(err<=0.05).mean()*100:8.1f}%")

    # 只看正脸（偏头小）时会不会好转
    yaw = np.array([r["yaw"] for r in rows])
    print(f"\n偏头程度 yaw: 中位={np.median(yaw):.2f} p90={np.percentile(yaw,90):.2f}")
    for thr in (0.15, 0.30):
        sel = yaw <= thr
        if sel.sum() < 30:
            continue
        print(f"\n只看 yaw<={thr} 的 {sel.sum()} 张（较正的脸）:")
        for nm in names:
            m = np.array([r[nm] for r in rows])[sel]
            ss = s[sel]
            tgt = np.median(ss * m)
            err = np.abs(tgt / m - ss)
            print(f"   {nm:10s} r={np.corrcoef(ss,1/m)[0,1]:+.3f} "
                  f"误差中位={np.median(err):.3f} ±0.05占比={(err<=0.05).mean()*100:.1f}%")

    # 手调 scale 本身的分布：如果大部分就是 1.0，说明很多图根本没调过尺度
    print(f"\n手调 scale 分布: =1.00 的占 {(s==1.0).mean()*100:.1f}%  "
          f"p10={np.percentile(s,10):.2f} 中位={np.median(s):.2f} p90={np.percentile(s,90):.2f}")
    json.dump(rows, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "metric_data.json"), "w"),
              ensure_ascii=False)


if __name__ == "__main__":
    main()
