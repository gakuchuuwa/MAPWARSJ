"""
单张立绘自动对齐三件套：给一张图，算出应该用的 scale / offsetY / offsetX。
供 tuner 的「自动对齐」按钮调用（vite 中间件 spawn 本脚本）。

用法:
    python align_one.py <图片绝对路径>
输出（stdout 一行 JSON）:
    {"ok":true,"scale":1.12,"offsetX":0,"offsetY":-12,"eyeChin":0.104,"eyeY":0.257,"score":0.93}
    {"ok":false,"reason":"未检测到人脸"}

【公式与依据（2026-08-03 全量 1291 张验证）】
  scale  = TARGET_FACE / 检测脸高(眼→下巴)
    · TARGET_FACE = 0.11676 = 主人 1165 条手调「scale × 检测脸高」的中位数
    · 自动后全库脸高 CV = 0%（定义恒等）；对照手调后 CV = 8.5%
    · 自动 scale 范围 0.68~1.62，无超 [0.5, 2.0] 异常
  offsetY = -512 × (眼睛Y - 0.2344)
    · 5 折交叉验证误差中位 1.9px，87.3% ≤5px，98.3% ≤10px
    · 512 = 立绘图高 1024 的一半；0.2344 ≈ 配置眼线 PORTRAIT_GUIDE_PREVIEW_EYE_LINE_Y = 0.23
  offsetX = 0（不自动）
    · 全库仅 13.4% 图手调过横向，线性拟合误差中位 6.3px —— 弱，交给手动
    · 眼睛X 中位 0.62（立绘天然偏右构图），offsetX=0 是主人默认选择

旧结论「scale 不可自动」作废（2026-08-03 判定标准修正）：
  之前 400 张留一法测的是「能否猜中你手调的那个数」（命中率 44~46%）；
  但你要的是「头一样大」—— 按脸高归一化在定义上就把 CV 压到 0，手调残差 8.5%。
"""
import json
import os
import sys

# 与 detect.py 同目录
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from detect import detect_face   # noqa: E402

# 全量 1291 张 + 1165 条手调对照得出（tools/PortraitAlign/auto_params.json）
TARGET_FACE = 0.11676          # 目标脸高（眼→下巴，归一化到图高）
COEF_A = -512.0                # offsetY 系数
EYE_LINE = 0.2344              # 目标眼睛线
SANE_ABS_MAX = 240             # offsetY 合理范围（训练集 p90 = 5.8px 的保守界）
SCALE_MIN, SCALE_MAX = 0.5, 2.0  # scale 合理范围（全库自动值 0.68~1.62）


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

    # scale：目标脸高 ÷ 检测脸高（脸高 CV → 0）
    scale = TARGET_FACE / eye_chin if eye_chin > 1e-4 else 1.0
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
