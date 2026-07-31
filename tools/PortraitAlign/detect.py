"""
立绘人脸检测（YuNet）——供「一键头部对齐」使用的底层测量模块。
只做测量，不写任何数据。

用法:
    python detect.py sheet [张数] [随机种子]   # 出接触印相，目视检查准确度
    python detect.py stats [张数]              # 只出统计
"""
import os
import sys
import glob
import random

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
MODEL = os.path.join(HERE, "models", "face_detection_yunet_2023mar.onnx")
ASSETS = os.path.join(ROOT, "public", "assets")
SKIP_DIRS = {"avg", "chongfu", "inbox", "bgm_backup"}

# 检测分辨率：立绘多为竖构图，长边缩到这个尺寸再检
DET_LONG_SIDE = 640


def load_rgb(path):
    """读图并把透明背景合成到中性灰上（纯白会让浅色皮肤边缘丢对比）。"""
    img = cv2.imdecode(np.fromfile(path, np.uint8), cv2.IMREAD_UNCHANGED)
    if img is None:
        return None
    if img.ndim == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    elif img.shape[2] == 4:
        a = img[:, :, 3:4].astype(np.float32) / 255.0
        img = (img[:, :, :3].astype(np.float32) * a + 128.0 * (1 - a)).astype(np.uint8)
    return img


_detector = None


def get_detector():
    global _detector
    if _detector is None:
        if not os.path.exists(MODEL):
            raise FileNotFoundError(f"缺少模型: {MODEL}")
        _detector = cv2.FaceDetectorYN.create(MODEL, "", (320, 320), 0.6, 0.3, 5000)
    return _detector


def detect_face(path, conf=0.6):
    """
    返回 dict 或 None。坐标一律归一化到原图宽高 0~1：
      box   : (x, y, w, h)
      eyeL/eyeR/nose/mouthL/mouthR : (x, y)
      eye_mid : 双眼中点
      eye_dist: 双眼间距（归一化到图宽）—— 比人脸框稳定，作为头部尺度基准
      score : 置信度
    """
    img = load_rgb(path)
    if img is None:
        return None
    H, W = img.shape[:2]
    sc = DET_LONG_SIDE / max(H, W)
    small = cv2.resize(img, (int(round(W * sc)), int(round(H * sc))), interpolation=cv2.INTER_AREA)
    sh, sw = small.shape[:2]

    det = get_detector()
    det.setScoreThreshold(conf)
    det.setInputSize((sw, sh))
    n, faces = det.detect(small)
    if faces is None or len(faces) == 0:
        return None

    # 立绘只有一个主体：取置信度最高的
    f = max(faces, key=lambda r: r[14])
    x, y, w, h = f[0] / sw, f[1] / sh, f[2] / sw, f[3] / sh
    pts = [(f[4 + i * 2] / sw, f[5 + i * 2] / sh) for i in range(5)]
    eyeR, eyeL, nose, mouthR, mouthL = pts   # YuNet 顺序: 右眼,左眼,鼻,右嘴角,左嘴角
    eye_mid = ((eyeR[0] + eyeL[0]) / 2, (eyeR[1] + eyeL[1]) / 2)
    eye_dist = float(np.hypot(eyeR[0] - eyeL[0], (eyeR[1] - eyeL[1]) * sh / sw))
    return {
        "box": (float(x), float(y), float(w), float(h)),
        "eyeR": eyeR, "eyeL": eyeL, "nose": nose,
        "mouthR": mouthR, "mouthL": mouthL,
        "eye_mid": eye_mid,
        "eye_dist": eye_dist,
        "score": float(f[14]),
        "size": (W, H),
    }


def all_portraits():
    out = []
    for d in sorted(os.listdir(ASSETS)):
        p = os.path.join(ASSETS, d)
        if not os.path.isdir(p) or d in SKIP_DIRS:
            continue
        for f in sorted(os.listdir(p)):
            if f.lower().endswith(".png"):
                out.append(os.path.join(p, f))
    return out


def draw(path, r, tile_w=300, tile_h=400):
    img = load_rgb(path)
    H, W = img.shape[:2]
    sc = min(tile_w / W, tile_h / H)
    vis = cv2.resize(img, (int(W * sc), int(H * sc)), interpolation=cv2.INTER_AREA)
    vh, vw = vis.shape[:2]
    if r:
        x, y, w, h = r["box"]
        cv2.rectangle(vis, (int(x * vw), int(y * vh)),
                      (int((x + w) * vw), int((y + h) * vh)), (0, 220, 0), 2)
        for k, c in (("eyeR", (255, 80, 80)), ("eyeL", (255, 80, 80)),
                     ("nose", (0, 200, 255)), ("mouthR", (200, 0, 200)), ("mouthL", (200, 0, 200))):
            px, py = r[k]
            cv2.circle(vis, (int(px * vw), int(py * vh)), 3, c, -1)
        ex, ey = r["eye_mid"]
        cv2.drawMarker(vis, (int(ex * vw), int(ey * vh)), (0, 255, 255), cv2.MARKER_CROSS, 14, 2)
        cv2.putText(vis, f"{r['score']:.2f}", (4, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 220, 0), 1)
    else:
        cv2.putText(vis, "MISS", (6, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
    canvas = np.full((tile_h, tile_w, 3), 240, np.uint8)
    canvas[:vh, :vw] = vis
    return canvas


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "stats"
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 24
    seed = int(sys.argv[3]) if len(sys.argv) > 3 else 5

    files = all_portraits()
    random.seed(seed)
    random.shuffle(files)
    sample = files[:n]

    tiles, miss = [], 0
    dists, scores = [], []
    for p in sample:
        r = detect_face(p)
        if r is None:
            miss += 1
        else:
            dists.append(r["eye_dist"])
            scores.append(r["score"])
        if mode == "sheet":
            tiles.append(draw(p, r))

    print(f"取样 {len(sample)} 张，检出 {len(sample)-miss} 张，检出率 {(len(sample)-miss)/len(sample)*100:.1f}%")
    if dists:
        d = np.array(dists)
        print(f"双眼间距(占图宽): p10={np.percentile(d,10):.4f} 中位={np.median(d):.4f} "
              f"p90={np.percentile(d,90):.4f} 变异系数={d.std()/d.mean()*100:.1f}%")
        print(f"置信度: 最低={min(scores):.2f} 中位={np.median(scores):.2f}")

    if mode == "sheet" and tiles:
        cols = 6
        rows = [np.hstack(tiles[i:i + cols]) for i in range(0, len(tiles) - len(tiles) % cols, cols)]
        sheet = np.vstack(rows)
        out = os.path.join(HERE, "detect_sheet.png")
        cv2.imwrite(out, sheet)
        print("接触印相:", out)


if __name__ == "__main__":
    main()
