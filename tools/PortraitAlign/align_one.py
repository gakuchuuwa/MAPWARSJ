"""
单张立绘自动垂直对齐：给一张图，算出应该用的 offsetY。
供 tuner 的「自动对齐」按钮调用（vite 中间件 spawn 本脚本）。

用法:
    python align_one.py <图片绝对路径>
输出（stdout 一行 JSON）:
    {"ok":true,"offsetY":-12,"eyeY":0.257,"score":0.93}
    {"ok":false,"reason":"未检测到人脸"}

【只算 offsetY，不算 scale】
  scale 经 400 张留一法验证：文件夹默认 / 全局单值 / 按脸几何解算 三种方法命中率
  都只有 44~46%（容差 ±0.05），谁也不比谁强 —— 主人的缩放带审美判断（头盔体积、
  露多少身体），测不出来，故不自动。

【offsetY 的公式与依据】
  5 折交叉验证（每折只用其余 4 折拟合）：误差中位 2.08px，86% 落在 ±5px 内，
  97.5% 落在 ±10px 内，五折系数稳定（a=-500~-528）。对照「文件夹默认」误差中位 12px。
  拟合结果 offsetY ≈ -512 x (眼睛Y - 0.2344)：
    · 512 = 立绘图高 1024 的一半
    · 0.2344 几乎等于配置里的眼线 PORTRAIT_GUIDE_PREVIEW_EYE_LINE_Y = 0.23
  算法没读过配置文件，却从主人一千多张手调值里把眼线位置反推了出来 —— 双向印证。
"""
import json
import os
import sys

# 与 detect.py 同目录
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from detect import detect_face   # noqa: E402

# 见上方注释：由 1023 张手调值拟合并交叉验证得出
COEF_A = -512.0
EYE_LINE = 0.2344
# 超过这个偏差就认为检测可疑（对照：训练集 p90 = 5.8px），交给主人手调
SANE_ABS_MAX = 240


def align(path):
    if not os.path.exists(path):
        return {"ok": False, "reason": "文件不存在"}
    try:
        r = detect_face(path)
    except Exception as e:                      # noqa: BLE001
        return {"ok": False, "reason": f"检测异常: {e}"}
    if r is None:
        return {"ok": False, "reason": "未检测到人脸"}

    eye_y = float(r["eye_mid"][1])
    offset = COEF_A * (eye_y - EYE_LINE)
    if abs(offset) > SANE_ABS_MAX:
        return {"ok": False, "reason": f"算出的偏移 {offset:.0f} 超出合理范围，请手动调整"}
    return {
        "ok": True,
        "offsetY": int(round(offset)),
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
