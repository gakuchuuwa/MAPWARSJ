# -*- coding: utf-8 -*-
"""
全量数据分析：基于 full_measures.json + 手调表，确定自动对齐三件套公式。
只读，不写游戏数据。
"""
import os
import sys
import json
import re

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from validate import load_manual, cv

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
MEAS = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "full_measures.json"), encoding="utf-8"))
manual = load_manual()

print(f"测量表: {len(MEAS)} 张 | 手调表: {len(manual)} 条")

# 建 path -> 测量 索引
by_path = {m["path"]: m for m in MEAS}

# ── 1. 手调样本（有手调 + 有测量 + 检测成功）──
rows = []
for k, (sc, ox, oy) in manual.items():
    m = by_path.get(k)
    if not m or m["eyeChin"] is None:
        continue
    rows.append({
        "key": k, "scale": sc, "offsetX": ox, "offsetY": oy,
        "eyeChin": m["eyeChin"], "eyeY": m["eyeY"], "eyeX": m["eyeX"],
        "headH": m["headH"], "eyeDist": m["eyeDist"], "score": m["score"],
    })
print(f"手调+测量有效样本: {len(rows)}")

if not rows:
    sys.exit(1)

s = np.array([r["scale"] for r in rows])
ox = np.array([r["offsetX"] for r in rows])
oy = np.array([r["offsetY"] for r in rows])
ec = np.array([r["eyeChin"] for r in rows])
ey = np.array([r["eyeY"] for r in rows])
ex = np.array([r["eyeX"] for r in rows])
sc_ = np.array([r["score"] for r in rows])

# ── 2. 目标脸高：手调后脸高的中位数（scale × eyeChin）──
adj_face = s * ec
TARGET_FACE = float(np.median(adj_face))
print(f"\n手调后脸高 scale×eyeChin: 中位={TARGET_FACE:.5f}  p25={np.percentile(adj_face,25):.5f} p75={np.percentile(adj_face,75):.5f}")

# 自动 scale = target / eyeChin
auto_s = TARGET_FACE / ec
err_s = np.abs(auto_s - s)
print(f"\n自动 scale = {TARGET_FACE:.5f} / eyeChin:")
print(f"  误差 |auto-manual|: 中位={np.median(err_s):.3f}  p90={np.percentile(err_s,90):.3f}")
print(f"  误差≤0.05: {(err_s<=0.05).mean()*100:.1f}%   ≤0.08: {(err_s<=0.08).mean()*100:.1f}%")
print(f"  自动 scale 范围: {auto_s.min():.3f} ~ {auto_s.max():.3f}")

# ── 3. offsetY 公式（align_one 已验证）：-512×(eyeY-0.2344) ──
auto_oy = -512.0 * (ey - 0.2344)
err_oy = np.abs(auto_oy - oy)
print(f"\noffsetY = -512×(eyeY-0.2344):")
print(f"  误差中位={np.median(err_oy):.1f}px  ≤5px={(err_oy<=5).mean()*100:.1f}%  ≤10px={(err_oy<=10).mean()*100:.1f}%")

# ── 4. offsetX：眼睛X → 目标X ──
tuned_x = np.abs(ox) > 0
print(f"\noffsetX 分析: 调过横向 {tuned_x.sum()}/{len(ox)} ({tuned_x.mean()*100:.1f}%)")
if tuned_x.sum() >= 20:
    # 尝试拟合 offsetX = a×(eyeX - 0.57)
    for tgt_x in (0.5, 0.57, 0.6):
        # 眼睛X中位
        med_ex = np.median(ex)
        # 简单模型：offsetX = C × (eyeX - tgt)
        C = -1.0
        pred = C * (ex - tgt_x) * 100  # 粗略
        # 用调过横向的拟合
        A = np.polyfit(ex[tuned_x], ox[tuned_x], 1)
        pred2 = np.polyval(A, ex)
        err2 = np.abs(pred2 - ox)
        print(f"  线性拟合 offsetX~eyeX: a={A[0]:.1f} b={A[1]:.1f}  拟合误差中位={np.median(np.abs(pred2-ox)):.1f}")
        break
print(f"  眼睛X 分布: 中位={np.median(ex):.4f}  p10={np.percentile(ex,10):.4f}  p90={np.percentile(ex,90):.4f}")

# ── 5. 全部图（含没手调的）自动后 CV ──
all_ec = np.array([m["eyeChin"] for m in MEAS if m["eyeChin"] is not None])
all_ey = np.array([m["eyeY"] for m in MEAS if m["eyeY"] is not None])
print(f"\n全库 1291 张:")
print(f"  原始脸高 CV: {cv(all_ec):.1f}%  → 自动后 CV: {cv(all_ec * (TARGET_FACE/all_ec)):.2f}% (恒等0)")
print(f"  原始眼Y CV: {cv(all_ey):.1f}%  → 自动后: {cv(all_ey + (-512*(all_ey-0.2344))/1000):.2f}%")

# 自动值的合理范围检查（scale 不能太夸张）
print(f"\n  自动 scale 超出 [0.5, 2.0] 的: {((auto_s<0.5)|(auto_s>2.0)).sum()} 张")
json.dump({
    "target_face": TARGET_FACE,
    "n": len(rows),
    "err_scale_median": float(np.median(err_s)),
    "err_offsetY_median": float(np.median(err_oy)),
    "tuned_x_ratio": float(tuned_x.mean()),
}, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "auto_params.json"), "w"), ensure_ascii=False, indent=1)
print("\n参数已存 tools/PortraitAlign/auto_params.json")
