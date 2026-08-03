"""
单张立绘自动对齐三件套：给一张图，算出应该用的 scale / offsetY / offsetX。
供 tuner 的「自动对齐」按钮调用（vite 中间件 spawn 本脚本）。

用法:
    python align_one.py <图片绝对路径>
输出（stdout 一行 JSON）:
    {"ok":true,"scale":1.12,"offsetX":0,"offsetY":-12,"metric":"head","headH":0.31,"eyeY":0.257,"score":0.93}
    {"ok":false,"reason":"未检测到人脸"}

【scale 判据 = 含盔头高（2026-08-03 主人定稿：要的是"头一样大"，冠/盔/头巾都算头）】
  scale = TARGET_HEAD / 头高
    · 头高 = 头顶(窄窗爬升，见 robust_head_height 注释) → 下巴(眼嘴外推)
    · TARGET_HEAD = 0.31105 = 手调 400 样本「scale × 头高」中位（400/400 检测成功）
    · 自动 scale 中位 1.024（≈手调中位 1.000）；5~95% 0.80~1.31，约 26% 会被钳制压回
      [0.85,1.21] 边界（钳制带是主人手调舒适区，超界图对齐精度让位于"不吓人"）
    · 头/脸比正常带 2.1~3.3（中位 2.67）
  按脸高兜底（metric="face"）：无 alpha 通道 / 剪影异常 / 头脸比出 [1.5, 4.5] 时退回
    · TARGET_FACE = 0.11676 = 手调 1165 条「scale × 脸高」中位
  ⚠ 为什么不用脸做主判据：脸一致 ≠ 头一致。实测按脸对齐后，铁盔(头/脸比3.0)与
    头巾(2.1)两人屏幕头高差 38%（BASHU_01 vs ba_bamanzi），主人一眼看穿。

【offsetY = -512 × (眼睛Y - 0.2344)】
    · 5 折交叉验证误差中位 1.9px，87.3% ≤5px，98.3% ≤10px
    · 512 = 立绘图高 1024 的一半；0.2344 ≈ 配置眼线 PORTRAIT_GUIDE_PREVIEW_EYE_LINE_Y = 0.23
    · 已知残差：公式未乘 scale（缩放锚点在眼线），scale 偏离 1 远时有几 px 系统误差，待重拟合
【offsetX = 0（不自动）】
    · 全库仅 13.4% 图手调过横向，线性拟合误差中位 6.3px —— 弱，交给手动

旧结论「scale 不可自动」作废（2026-08-03 判定标准修正）：
  之前 400 张留一法测的是「能否猜中你手调的那个数」（命中率 44~46%）；
  但目标是「头一样大」—— 按度量归一化在定义上就把 CV 压到 0。
"""
import json
import os
import sys

import numpy as np
import cv2

# 与 detect.py 同目录
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from detect import detect_face   # noqa: E402

TARGET_HEAD = 0.31105          # 目标含盔头高（窄窗度量；400 手调样本 median(scale×头高)，自动中位 1.024≈手调 1.000）
TARGET_FACE = 0.11676          # 兜底目标脸高（眼→下巴）
RATIO_MIN, RATIO_MAX = 1.5, 4.5  # 头/脸比可信带（窄窗样本 0.5~99.5 分位 1.98~3.72 的放宽界）
COEF_A = -512.0                # offsetY 系数
EYE_LINE = 0.2344              # 目标眼睛线
SANE_ABS_MAX = 240             # offsetY 合理范围（训练集 p90 = 5.8px 的保守界）
# scale 合理范围：钳制到主人手调习惯的 5~95 分位（2026-08-03 实测 1241 条手调）。
# ⚠ 血训：曾按"头一样大"硬算 → 小头图被放大到 1.5+（如 WEST_ASIA_50 头高 0.21 → scale 1.55），
#    主人点 A 后头明显变大，不满。自动值必须落在主人手调舒适区，超界压回边界。
SCALE_MIN, SCALE_MAX = 0.85, 1.21


def robust_head_height(path, r):
    """含盔头高：alpha 剪影头顶 → 下巴。测不了返回 None（交给脸高兜底）。

    头顶算法 = 窄窗 + 眼行爬升 + 真空隙即停（2026-08-03 第三版）：
      · 窄窗：只看【脸框正上方的列】(bx~bx+bw)。⚠ 血训：旧宽窗(脸宽±45%)会把
        抬武器的手臂圈进来，手臂把"帽顶→武器杆→图顶"桥接成连续宽区，
        baishui_yanghuai 的头顶被测到 y=0.000、headH 虚高 38% → 该图被缩小、
        与同夹对比"右边头明显大"。窄窗里帽子和武器杆之间有真空隙(0%行)，爬升自然停。
      · 主爬升：从眼睛行向上，实区(该行不透明宽 ≥50% 脸宽)连续爬 —— 脸→额→帽体，
        到帽顶圆弧收窄处停。
      · 吞圆顶：继续向上吞 ≥15% 脸宽的连续行（帽结/盔顶圆弧），但高度封顶
        0.35×脸高 —— 万一武器贴着帽顶没有空隙，损害也被封顶，不会再冲到图顶。
      · 旧版"1.2×脸高距离限制"废除：脸框大时限制线出图等于没有（正是本次漏网原因）。
    """
    img = cv2.imdecode(np.fromfile(path, np.uint8), cv2.IMREAD_UNCHANGED)
    if img is None or img.ndim != 3 or img.shape[2] != 4:
        return None
    H, W = img.shape[:2]
    alpha = img[:, :, 3]
    bx, by, bw, bh = r["box"]
    x0 = int(max(0, bx * W))
    x1 = int(min(W, (bx + bw) * W))
    fw = x1 - x0
    if fw < 8:
        return None
    op = (alpha[:, x0:x1] > 16).sum(axis=1)

    eye = float(np.array(r["eye_mid"])[1])
    mouth = float((np.array(r["mouthR"])[1] + np.array(r["mouthL"])[1]) / 2)
    eye_chin = 1.8 * (mouth - eye)
    eye_row = int(eye * H)
    if not (0 <= eye_row < H) or eye_chin <= 1e-4:
        return None

    # 主爬升：实区（≥50% 脸宽）连续向上
    row = eye_row
    while row - 1 >= 0 and op[row - 1] >= 0.5 * fw:
        row -= 1
    solid_top = row
    # 吞圆顶：≥15% 脸宽且连续，高度封顶 0.35×脸高（独立缨饰/贴帽武器不吞）
    cap_rows = int(0.35 * eye_chin * H)
    while row - 1 >= 0 and solid_top - row < cap_rows and op[row - 1] >= 0.15 * fw:
        row -= 1
    top_y = row / H

    chin = mouth + (mouth - eye) * 0.8
    if chin <= top_y:
        return None
    return float(chin - top_y)


def align(path):
    if not os.path.exists(path):
        return {"ok": False, "reason": "文件不存在"}
    try:
        r = detect_face(path)
    except Exception as e:                      # noqa: BLE001
        return {"ok": False, "reason": f"检测异常: {e}"}
    if r is None:
        return {"ok": False, "reason": "未检测到人脸"}

    eye_mid = r["eye_mid"]
    mouth_mid = ((r["mouthR"][0] + r["mouthL"][0]) / 2, (r["mouthR"][1] + r["mouthL"][1]) / 2)
    eye_y = float(eye_mid[1])
    # 眼→下巴 = 1.8 × 眼→嘴（嘴下方 0.8 倍"眼→嘴"距离外推下巴，见 metric_head.py）
    eye_chin = 1.8 * float(mouth_mid[1] - eye_mid[1])
    if eye_chin <= 1e-4:
        return {"ok": False, "reason": "眼嘴距离异常，无法度量"}

    # 主判据：含盔头高；剪影测不了或头/脸比离谱 → 按脸高兜底
    head_h = robust_head_height(path, r)
    metric = "head"
    if head_h is not None and RATIO_MIN <= head_h / eye_chin <= RATIO_MAX:
        scale = TARGET_HEAD / head_h
    else:
        metric = "face"
        scale = TARGET_FACE / eye_chin
    # 钳制到主人手调习惯范围（0.85~1.21）：超出压回边界，不返回失败。
    # ⚠ 血训：曾直接返回"请手动调整"→ 点 A 无反应；曾用 [0.5,2.0] → 小头图放大到 1.5+ 头变大。
    scale = min(SCALE_MAX, max(SCALE_MIN, scale))

    # offsetY：眼睛拉到眼线（已验证）
    offset_y = COEF_A * (eye_y - EYE_LINE)
    if abs(offset_y) > SANE_ABS_MAX:
        return {"ok": False, "reason": f"算出的垂直偏移 {offset_y:.0f} 超出合理范围，请手动调整"}

    return {
        "ok": True,
        "scale": round(scale, 4),
        "offsetX": 0,
        "offsetY": int(round(offset_y)),
        "metric": metric,
        "headH": round(head_h, 4) if head_h is not None else None,
        "eyeChin": round(eye_chin, 4),
        "eyeY": round(eye_y, 4),
        "score": round(float(r["score"]), 3),
    }


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"ok": False, "reason": "缺少图片路径"}, ensure_ascii=False))
        return
    print(json.dumps(align(sys.argv[1]), ensure_ascii=False))


if __name__ == "__main__":
    main()
