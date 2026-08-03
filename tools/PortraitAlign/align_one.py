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
    · 头高 = 头顶(alpha 剪影，滤缨：该行不透明宽 ≥40% 脸宽才算，羽缨/旗枪不算头) → 下巴(眼嘴外推)
    · TARGET_HEAD = 0.32738 = 手调 400 样本「scale × 头高」中位（全部检测成功）
    · 自动 scale 5~95% 落在 0.80~1.39，头/脸比正常带 2.1~3.6（中位 2.78）
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

TARGET_HEAD = 0.32738          # 目标含盔头高（归一化到图高；scratchpad head_target.py 400 样本）
TARGET_FACE = 0.11676          # 兜底目标脸高（眼→下巴）
RATIO_MIN, RATIO_MAX = 1.5, 4.5  # 头/脸比可信带（样本 0.5~99.5 分位 1.95~3.92 的放宽界）
COEF_A = -512.0                # offsetY 系数
EYE_LINE = 0.2344              # 目标眼睛线
SANE_ABS_MAX = 240             # offsetY 合理范围（训练集 p90 = 5.8px 的保守界）
SCALE_MIN, SCALE_MAX = 0.5, 2.0  # scale 合理范围


def robust_head_height(path, r):
    """含盔头高：alpha 剪影头顶(滤缨) → 下巴。测不了返回 None（交给脸高兜底）。"""
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
    op = (alpha[:, x0:x1] > 16).sum(axis=1)
    face_top_row = int(by * H)          # 脸框顶（YuNet 脸框上沿）
    wide_w = 0.25 * bw * W              # "宽区"阈值：≥25% 脸宽 = 头/盔主体
    thin_w = max(8, 0.06 * bw * W)      # "细缨"阈值：<6% 脸宽 = 羽缨/旗枪/细柄

    # 头顶 = 脸框顶上方一个"合理头饰高度"范围内，最靠近脸框的连续宽区顶。
    # 2026-08-03 修复（两层）：
    #   ① 范围限制：头顶不得高于 脸框顶-1.2×脸高 —— 武器/旗杆从图顶斜伸下来时
    #      （如 baishui_yanghuai 的斜武器柄，y=0~48 每行宽 95-100px 无空隙），
    #      旧"遇空隙即停"抓不到，必须用距离约束排除图顶异物。
    #      ⚠ k 值血训：曾用 0.6，把高盔/高冠/高头巾的真实头顶钳在 0.6 脸高处，
    #      headH 系统性低估 17% → scale 系统性放大 17% → 自动后头变大（86% 的图）。
    #      实测 k=1.2：headH 中位 0.3214≈目标 0.32738，自动 scale 中位 1.019≈手调 1.000。
    #   ② 宽区锚定 + 向上吞并细行：锚定头/盔主体（≥25% 脸宽连续区）的顶，
    #      再向上吞并帽尖/盔缨根部的窄过渡行（≥6% 脸宽且连续），不吞独立缨饰。
    limit_row = max(0, int(face_top_row - 1.2 * bh * H))
    top = None
    for row in range(face_top_row, limit_row - 1, -1):
        if op[row] >= wide_w:
            top = row
        else:
            if top is not None:
                break
    if top is None:
        return None
    for row in range(top - 1, limit_row - 1, -1):
        if op[row] >= thin_w:
            top = row
        else:
            break
    top_y = top / H
    eye = float(np.array(r["eye_mid"])[1])
    mouth = float((np.array(r["mouthR"])[1] + np.array(r["mouthL"])[1]) / 2)
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
    if not (SCALE_MIN <= scale <= SCALE_MAX):
        return {"ok": False, "reason": f"算出的缩放 {scale:.2f} 超出合理范围 [{SCALE_MIN}, {SCALE_MAX}]，请手动调整"}

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
