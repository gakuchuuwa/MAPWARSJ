import gradio as gr
import os
import glob
import io
import numpy as np
import cv2
from PIL import Image

# ---------------------------------------------------------------------------
# rembg 为可选依赖: 纯色背景(绿幕/黑幕/任意纯色)完全用不到 AI,
# 只有"背景不纯净"的图才会去加载模型, 避免每次启动都等模型下载/初始化。
# ---------------------------------------------------------------------------
try:
    from rembg import remove as rembg_remove, new_session
    REMBG_OK = True
except Exception as _e:  # pragma: no cover
    REMBG_OK = False
    _REMBG_ERR = str(_e)

models = [
    "birefnet-general",
    "isnet-anime",
    "u2net",
    "u2net_human_seg",
    "silueta",
]
sessions = {}

BG_MODES = ["自动识别", "绿幕", "蓝幕", "黑底", "白底", "纯色(取边缘色)", "仅用AI"]
AI_MODES = ["自动 (色键搞不定时才用)", "强制开启", "关闭"]

# 容差减半后翻回不透明的像素比例, 超过此值说明主体有颜色贴着背景, 该请 AI。
# 207 个样本(7 张城池图 + 40 张立绘 x 5 种底色)标定:
#   纯绿/蓝幕 80 个零失败(sens ≤0.011) —— 色键本来就够准, 不该白等 AI
#   黑底立绘 40 个全部失败(中位吃掉 15%, sens ≥0.037) —— 必须上 AI
#   取 0.03: 45 个"会吃主体"的样本全部捕获, 162 个合格样本仅 10 个(都是
#   暗绿立绘)白跑 AI, 7 张城池图一次都不会白跑。
SENS_THRESHOLD = 0.03

# 亮度均衡: 把主体亮度对齐到的目标(Lab L 通道中位数, 0~255 尺度)。
# 112 不是"中间调"(那是 128), 而是照着素材实测取的: 8 张 koutu 立绘主体亮度
# 落在 82~116, 中位 89。若按 128 对齐, 整批要提亮 +24~+45 —— 是统一了, 但整体
# 发灰发飘, 不是用户要的。112 取在实测区间上沿, 统一的同时不把画面拉爆。
BRIGHT_TARGET = 112.0
# gamma 限幅。原图与目标差太远时硬拉只会拉出噪点和色带, 到此为止。
# 非对称: 提亮(g<1)放大暗部噪声, 卡得更紧; 压暗(g>1)风险小, 放宽一点。
BRIGHT_GAMMA_RANGE = (0.45, 2.5)

# 内部孤岛清除强度 0~1(0 = 一律保留)。具体阈值按背景类型换算, 见 _island_mask。
# 0.5 为默认: 实测把真实绿幕立绘的内部残留从 0.89% 压到 ~0.02%,
# 同时纯绿/黑底的城池图基本无损。
ISLAND_TOL_RATIO = 0.5

KIND_LABEL = {
    "green": "绿幕",
    "blue": "蓝幕",
    "black": "黑底",
    "white": "白底",
    "solid": "纯色背景",
    "complex": "非纯色背景",
}


def get_session(model_name):
    if not REMBG_OK:
        raise RuntimeError(f"rembg 不可用: {_REMBG_ERR}")
    if model_name not in sessions:
        print(f"Loading model: {model_name}...")
        sessions[model_name] = new_session(model_name)
    return sessions[model_name]


# ---------------------------------------------------------------------------
# 1. 背景识别
# ---------------------------------------------------------------------------

def _border_ring(img, frac=50):
    """取画面四边的一圈像素, 作为背景采样。支持单通道与多通道。"""
    h, w = img.shape[:2]
    b = max(3, min(h, w) // frac)
    ch = img.shape[2] if img.ndim == 3 else 1
    return np.concatenate([
        img[:b].reshape(-1, ch),
        img[-b:].reshape(-1, ch),
        img[:, :b].reshape(-1, ch),
        img[:, -b:].reshape(-1, ch),
    ]).astype(np.float32)


def detect_background(img):
    """
    从边缘采样推断背景色与类型。
    返回 (kind, bgr_color, uniformity)
      kind: green / blue / black / white / solid / complex
      uniformity: 边缘像素中属于背景色的比例, 越低说明背景越不干净
    """
    ring = _border_ring(img)
    med = np.median(ring, axis=0)

    # 用中位数附近的像素再求均值, 排除边缘上的主体像素干扰
    d = np.linalg.norm(ring - med, axis=1)
    near = ring[d < 24]
    bg = (near.mean(axis=0) if len(near) > 32 else med)
    uniformity = float(np.mean(np.linalg.norm(ring - bg, axis=1) < 24))

    hsv = cv2.cvtColor(np.uint8([[np.round(bg)]]), cv2.COLOR_BGR2HSV)[0, 0]
    hue, sat, val = int(hsv[0]), int(hsv[1]), int(hsv[2])
    # 近黑/近白时 HSV 的饱和度是噪声(纯黑 BGR(1,1,0) 的 sat 高达 255, 会被
    # 误判成蓝幕), 所以中性色一律改用通道绝对极差来判。
    spread_ch = float(bg.max() - bg.min())

    if uniformity < 0.45:
        kind = "complex"
    elif val < 55 and spread_ch < 28:
        kind = "black"
    elif val > 205 and spread_ch < 28:
        kind = "white"
    elif sat >= 45 and 33 <= hue <= 85:
        kind = "green"
    elif sat >= 45 and 86 <= hue <= 138:
        kind = "blue"
    else:
        kind = "solid"

    return kind, bg, uniformity


def _ring_spread(dist_map, cap):
    """
    边缘背景像素的距离离散度, 用来自适应放宽容差(应对背景打光不均/JPEG噪点)。
    只统计距离小于 cap 的那部分 —— 立绘常常顶满画框, 四边有一大半是主体,
    若按分位数去截会被主体带偏, 把容差算成几百, 整张图被吃光。
    """
    ring = _border_ring(dist_map).ravel()
    sel = ring[ring < cap]
    if sel.size < 64:
        return 0.0
    return float(np.percentile(sel, 95))


# ---------------------------------------------------------------------------
# 2. 距离场: 每个像素离"背景色"有多远
# ---------------------------------------------------------------------------

def _distance_map(img, kind, bg_bgr):
    """在 Lab 空间算到背景色的距离。色度背景降低亮度权重, 以容忍背景打光不均。"""
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
    bg_lab = cv2.cvtColor(np.uint8([[np.round(bg_bgr)]]),
                          cv2.COLOR_BGR2LAB)[0, 0].astype(np.float32)

    dl = lab[:, :, 0] - bg_lab[0]
    da = lab[:, :, 1] - bg_lab[1]
    db = lab[:, :, 2] - bg_lab[2]

    if kind in ("green", "blue", "solid"):
        wl, wc = 0.45, 1.0   # 主要看色度: 绿幕再暗也还是绿
    else:
        wl, wc = 1.0, 0.85   # 黑/白底只能靠亮度区分

    return np.sqrt((wl * dl) ** 2 + wc * (da ** 2 + db ** 2))


# ---------------------------------------------------------------------------
# 3. 核心: 边缘连通抠像
# ---------------------------------------------------------------------------

def _border_connected(mask_u8):
    """只保留与画框四边连通的区域 —— 城内的绿树/黑屋顶因此被完整保住。"""
    num, labels = cv2.connectedComponents(mask_u8, connectivity=8)
    if num <= 1:
        return np.zeros(mask_u8.shape, dtype=bool)
    ids = np.unique(np.concatenate([
        labels[0, :], labels[-1, :], labels[:, 0], labels[:, -1]
    ]))
    ids = ids[ids != 0]
    if ids.size == 0:
        return np.zeros(mask_u8.shape, dtype=bool)
    return np.isin(labels, ids)


def _island_mask(img, kind, bg_bgr, dist, tol_in, strength):
    """
    「内部孤岛」= 被主体包住、连不到画框的同色区域。判它是不是背景, 分两种口径:

    绿/蓝幕 —— 只看【色度】, 不看亮度。腋下、弓弦与身体之间那些缝隙里的幕布
      处在阴影中, 亮度掉了 8~15, 但色度与幕布几乎完全一致(实测 ΔC 中位 2~4、
      最大 13.9); 而主体最像幕布的那部分像素 ΔC 也有 42 以上。中间空隙极大。
      阈值按【背景自身色度 C_bg】缩放 —— 幕布越纯, 离自然物色越远, 越可以放松:
        纯绿 C=119.5 → 阈值 29.9 (主体余量 63.7, 安全)
        中绿 C= 60.2 → 阈值 15.1 (主体余量 32.0, 安全; 恰好盖住 ΔC≤13.9 的残留)
        暗绿 C= 36.2 → 阈值  9.1 (城池图绿树余量仅 7.1 —— 见下方"已知冲突")
      ⚠️ 已知冲突: 幕布是【发暗发灰的绿】且素材本身绿色很重(如城池图 yunnan)时,
         树和幕布在色度上真的分不开。这种图请把"内部孤岛清除强度"拉到 0。

    黑/白/其他纯色 —— 没有色度可言(C_bg=0), 退回按亮度距离的严容差。
      黑底若用色度判据, 会把所有灰色主体误删。
    """
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
    bg_lab = cv2.cvtColor(np.uint8([[np.round(bg_bgr)]]),
                          cv2.COLOR_BGR2LAB)[0, 0].astype(np.float32)
    bg_chroma = float(np.hypot(bg_lab[1] - 128.0, bg_lab[2] - 128.0))

    if kind in ("green", "blue") and bg_chroma >= 25.0:
        tol_c = bg_chroma * 0.5 * float(strength)
        d_chroma = np.sqrt((lab[:, :, 1] - bg_lab[1]) ** 2
                           + (lab[:, :, 2] - bg_lab[2]) ** 2)
        return d_chroma <= tol_c, f"色度阈值 {tol_c:.0f}(背景色度 {bg_chroma:.0f})"

    tol_d = tol_in * 0.4 * float(strength)
    return dist <= tol_d, f"亮度严容差 {tol_d:.1f}"


def _nearest_solid_color(img_f, solid):
    """每个像素取【最近的确定前景像素】的颜色, 用作解 alpha 时的前景参考色。"""
    if not solid.any():
        return None
    inv = (~solid).astype(np.uint8)
    _, labels = cv2.distanceTransformWithLabels(
        inv, cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
    ys, xs = np.nonzero(solid)
    lab = labels[ys, xs]
    n = int(labels.max()) + 1
    ly = np.zeros(n, np.int32)
    lx = np.zeros(n, np.int32)
    ly[lab] = ys
    lx[lab] = xs
    return img_f[ly[labels], lx[labels]]


def _linear_alpha(img_f, bg_bgr, f_ref):
    """
    抗锯齿像素满足 观测色 = a*前景色 + (1-a)*背景色。
    把 (观测色-背景色) 投影到 (前景色-背景色) 上即得真实不透明度 a。
    好处: 2px 宽的旗杆/弓弦解出 a=1 被完整保留, 而混了底色的描边解出 a<1
    变成半透明, 再由 _decontaminate 反解掉底色, 不会留下彩边。
    """
    v = f_ref - bg_bgr[None, None, :]
    o = img_f - bg_bgr[None, None, :]
    den = np.einsum('ijk,ijk->ij', v, v)
    num = np.einsum('ijk,ijk->ij', o, v)
    # 参考前景色本身就跟背景色几乎一样时无从判断, 保守判为不透明
    a = np.where(den > 25.0, num / np.maximum(den, 1e-6), 1.0)
    return np.clip(a, 0.0, 1.0).astype(np.float32)


def _despeckle(alpha, min_area):
    """清掉背景里的零星残点, 以及主体内部的针孔。"""
    if min_area <= 0:
        return alpha

    opaque = (alpha > 0.5).astype(np.uint8)
    num, labels, stats, _ = cv2.connectedComponentsWithStats(opaque, 8)
    for i in range(1, num):
        if stats[i, cv2.CC_STAT_AREA] < min_area:
            alpha[labels == i] = 0.0

    holes = (alpha <= 0.5).astype(np.uint8)
    num, labels, stats, _ = cv2.connectedComponentsWithStats(holes, 8)
    border_ids = set(np.unique(np.concatenate([
        labels[0, :], labels[-1, :], labels[:, 0], labels[:, -1]
    ])).tolist())
    for i in range(1, num):
        if i in border_ids:
            continue
        if stats[i, cv2.CC_STAT_AREA] < min_area:
            alpha[labels == i] = 1.0
    return alpha


def _decontaminate(img_f, alpha, bg_bgr, f_ref, kind, spill_radius):
    """
    去边缘残色:
      a) 半透明像素反解掉混进来的背景色(对任何底色都有效)
      b) 绿/蓝幕额外在贴边窄带内压溢色, 且【只压边缘带】—— 主体内部的绿树不受影响
    """
    out = img_f.copy()

    edge = (alpha > 0.02) & (alpha < 0.998)
    if np.any(edge):
        a = alpha[edge][:, None]
        px = out[edge]
        if f_ref is not None:
            # JPEG 4:2:0 会让边缘像素偏离 背景色→前景色 的连线, 这部分残差
            # 若跟着除以 alpha 会被放大成品红/青色光晕。所以只反解共线分量,
            # 残差原样带回, 既去底色又保住纹理。
            fr = f_ref[edge]
            resid = px - (a * fr + (1.0 - a) * bg_bgr[None, :])
            out[edge] = np.clip(fr + resid, 0, 255)
        else:
            out[edge] = np.clip((px - (1.0 - a) * bg_bgr[None, :]) / np.maximum(a, 0.15),
                                0, 255)

    if kind in ("green", "blue") and spill_radius > 0:
        opaque = (alpha > 0.5).astype(np.uint8)
        dist = cv2.distanceTransform(opaque, cv2.DIST_L2, 3)
        # 最贴边的一圈全额压制, 往内线性衰减
        w = np.clip((float(spill_radius) + 1.0 - dist) / float(spill_radius), 0.0, 1.0)
        w = w * (alpha > 0.002)
        b, g, r = out[:, :, 0], out[:, :, 1], out[:, :, 2]
        if kind == "green":
            fixed = np.minimum(g, np.maximum(r, b))
            out[:, :, 1] = g * (1 - w) + fixed * w
        else:
            fixed = np.minimum(b, np.maximum(r, g))
            out[:, :, 0] = b * (1 - w) + fixed * w

    return out


def _equalize_brightness(img_f, alpha, target, strength):
    """
    把【主体】的亮度对齐到统一目标 —— 解决不同来源的素材有的暗有的亮。
    必须放在抠图之后: 只有拿到 alpha 才知道哪些像素是主体。

    三个刻意的选择:
      · 只统计 alpha>0.5 的像素。把背景算进去的话, "主体占画面 20%" 和
        "主体顶满画框" 的两张图基准会差出一大截, 越均衡越乱。
      · 取中位数而非均值。大片高光铠甲或整身黑袍都会把均值拽走, 中位数不会。
      · 用 gamma 而非加减常数。线性加亮会把高光压平成一块死白、把纯黑抬成灰;
        gamma 保持 0 与 255 两端不动, 只重新分布中间调。
      · gamma 施加在 Lab 的 L 通道上, a/b 原样保留。测量与施加同一空间, 结果
        精确命中目标值; 且不会像逐 BGR 通道那样把偏色图越调越偏。

    返回 (新图, 诊断行)
    """
    solid = alpha > 0.5
    if int(solid.sum()) < 64:
        return img_f, "亮度均衡: 主体像素太少, 跳过"

    u8 = np.clip(img_f, 0, 255).astype(np.uint8)
    lab = cv2.cvtColor(u8, cv2.COLOR_BGR2LAB)
    cur = float(np.median(lab[:, :, 0][solid]))

    # 主体整个贴在纯黑/纯白上时无从提取, gamma 会算出无穷大
    if cur < 2.0 or cur > 253.0:
        return img_f, f"亮度均衡: 主体亮度 {cur:.0f} 已到极值, 跳过"

    g = np.log(max(float(target), 1.0) / 255.0) / np.log(cur / 255.0)
    g = float(np.clip(g, *BRIGHT_GAMMA_RANGE))
    g = 1.0 + (g - 1.0) * float(strength)
    if abs(g - 1.0) < 0.02:
        return img_f, f"亮度均衡: 主体亮度 {cur:.0f} → 已达标, 未调整"

    lut = np.clip(np.power(np.arange(256, dtype=np.float32) / 255.0, g) * 255.0,
                  0, 255).astype(np.uint8)
    lab[:, :, 0] = lut[lab[:, :, 0]]
    out = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR).astype(np.float32)

    after = float(np.median(cv2.cvtColor(
        np.clip(out, 0, 255).astype(np.uint8), cv2.COLOR_BGR2LAB)[:, :, 0][solid]))
    return out, f"亮度均衡: 主体亮度 {cur:.0f} → {after:.0f} (目标 {target:.0f}, gamma {g:.2f})"


def _color_key(img, img_f, kind, bg_bgr, tolerance, feather, shrink, despeckle_area,
               island_ratio=ISLAND_TOL_RATIO):
    """
    纯色背景色键。返回 (alpha, 前景参考色, 诊断行)。
    会被调用两次: 一次出结果, 一次用减半的容差做敏感度探测。
    """
    h, w = img.shape[:2]
    notes = []

    dist = _distance_map(img, kind, bg_bgr)
    # 自适应只允许小幅放宽: 宁可留一点背景(用户拉大容差即可), 也绝不能
    # 因为边缘采样被主体污染而把容差撑大、把主体吃掉。
    tol_base = float(tolerance)
    spread = _ring_spread(dist, tol_base)
    tol_in = float(np.clip(max(tol_base, spread * 1.2), tol_base, tol_base * 1.5))
    tol_out = tol_in + max(6.0, tol_base * 0.7)

    # 注意: 这里不能做形态学闭运算 —— 会把旗杆/弓弦这类细结构两侧的
    # 背景桥接起来, 细节直接消失。噪点交给后面的 _despeckle 处理。
    core = (dist <= tol_in).astype(np.uint8)

    bg_region = _border_connected(core)
    bg_ratio = float(bg_region.mean())

    # 主体铺满四边导致连通失败时, 退回全局阈值
    if bg_ratio < 0.01 and float(core.mean()) > 0.05:
        bg_region = core.astype(bool)
        notes.append("⚠️ 背景未与画框连通, 已退回全局色键")
    else:
        # 「孤岛」: 被主体包住、连不到画框的同色区域。两种用途在这里打架 ——
        #   人物立绘: 臂与躯干之间的缝隙就是幕布本色, 必须删(否则内部残留绿块)
        #   城池图  : 城内绿树只是跟幕布"相近", 必须留
        # 区别在于离幕布色有多近, 所以孤岛用【更严的容差】单独判一次:
        # 缝隙距离≈0 会被删, 绿树距离 30~60 会留下。
        if island_ratio > 0:
            island, how = _island_mask(img, kind, bg_bgr, dist, tol_in, island_ratio)
            island &= ~bg_region
            if island.any():
                bg_region = bg_region | island
                notes.append(f"内部孤岛按{how}追删 {island.mean()*100:.2f}%")
        notes.append(f"边缘连通背景占比 {bg_ratio*100:.1f}%")

    k3 = np.ones((3, 3), np.uint8)
    alpha = np.ones((h, w), dtype=np.float32)

    # 只在紧贴背景的窄带内解 alpha。带外一律不透明 ——
    # 城里那些跟背景同色的绿树离背景很远, 因此完好无损。
    band_r = max(2, int(round(feather)) + 2)
    band = cv2.dilate(bg_region.astype(np.uint8), k3, iterations=band_r).astype(bool)
    band &= ~bg_region

    solid = (dist > tol_out * 1.8) & ~bg_region
    f_ref = _nearest_solid_color(img_f, solid)
    if f_ref is not None:
        a_lin = _linear_alpha(img_f, bg_bgr, f_ref)
    else:
        a_lin = np.clip((dist - tol_in) / max(1e-3, tol_out - tol_in), 0.0, 1.0)
        notes.append("⚠️ 未找到确定前景像素, 退回颜色斜坡")

    alpha[band] = a_lin[band]
    alpha[bg_region] = 0.0

    if shrink > 0:
        dpix = cv2.distanceTransform((~bg_region).astype(np.uint8), cv2.DIST_L2, 5)
        alpha = np.minimum(alpha, np.clip(dpix - float(shrink), 0.0, 1.0))
    if feather > 0:
        alpha = cv2.GaussianBlur(alpha, (3, 3), 0)
        alpha[bg_region] = 0.0

    alpha = _despeckle(alpha, int(despeckle_area))
    notes.append(f"容差 {tol_in:.0f}→{tol_out:.0f} (边缘离散度 {spread:.1f})")
    return alpha, f_ref, notes


def smart_remove(img_bytes, bg_mode="自动识别", tolerance=22, feather=1.0,
                 shrink=0.0, despeckle_area=48, spill=True, spill_radius=2,
                 ai_mode=AI_MODES[0], model_name="birefnet-general",
                 island_ratio=ISLAND_TOL_RATIO, bright_eq=False,
                 bright_target=BRIGHT_TARGET, bright_strength=1.0):
    """
    统一抠图入口。返回 (png_bytes, 诊断文本)
    """
    arr = np.frombuffer(img_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("无法解码图片")
    h, w = img.shape[:2]

    # --- 背景判定 ---
    det_kind, det_bg, uniformity = detect_background(img)
    forced = {"绿幕": "green", "蓝幕": "blue", "黑底": "black",
              "白底": "white", "纯色(取边缘色)": "solid", "仅用AI": "complex"}
    kind = forced.get(bg_mode, det_kind)

    # 手动指定了色相类型但边缘色对不上时, 用该类型的标准底色兜底
    bg_bgr = np.asarray(det_bg, dtype=np.float32)
    if bg_mode != "自动识别" and kind != det_kind:
        fallback = {"green": (0, 255, 0), "blue": (255, 0, 0),
                    "black": (0, 0, 0), "white": (255, 255, 255)}
        if kind in fallback:
            bg_bgr = np.asarray(fallback[kind], dtype=np.float32)

    notes = [f"检测: {KIND_LABEL.get(det_kind, det_kind)} "
             f"BGR={np.round(det_bg).astype(int).tolist()} 边缘纯净度={uniformity*100:.0f}%"]
    if kind != det_kind:
        notes.append(f"→ 手动指定为 {KIND_LABEL.get(kind, kind)}")

    def load_ai():
        """按需加载 AI —— 纯色底大多用不上, 不该让每张图都去等 1GB 模型。"""
        try:
            session = get_session(model_name)
            out = rembg_remove(img_bytes, session=session)
            rgba = cv2.imdecode(np.frombuffer(out, np.uint8), cv2.IMREAD_UNCHANGED)
            if rgba is None or rgba.ndim != 3 or rgba.shape[2] != 4:
                notes.append("⚠️ AI 未返回透明通道")
                return None
            a = rgba[:, :, 3].astype(np.float32) / 255.0
            if a.shape != (h, w):
                a = cv2.resize(a, (w, h), interpolation=cv2.INTER_LINEAR)
            notes.append(f"AI 模型: {model_name}")
            return a
        except Exception as e:
            notes.append(f"⚠️ AI 不可用({e})")
            return None

    if kind == "complex":
        if ai_mode == AI_MODES[2]:
            raise ValueError("背景不是纯色, 但 AI 辅助被关闭了, 无法抠图")
        ai_a = load_ai()
        if ai_a is None:
            raise ValueError("背景不是纯色, 且 AI 模型不可用, 无法抠图")
        alpha = ai_a
        img_f = img.astype(np.float32)
        notes.append("模式: 纯 AI 语义分割")
    else:
        img_f = img.astype(np.float32)
        alpha, f_ref, keynotes = _color_key(
            img, img_f, kind, bg_bgr, tolerance, feather, shrink, despeckle_area,
            island_ratio=island_ratio)
        notes.extend(keynotes)

        # --- 要不要请 AI 来救场 ---
        # 黑底遇上黑发/黑衣时颜色上无从区分, 主体会被撕成碎片; 绿幕和城池图
        # 则色键本来就够准, 上 AI 只是白等 50 秒。
        # 判据: 把容差减半重跑一遍, 看有多少像素从透明翻回不透明。背景真的
        # 可分时结果几乎不变; 主体有颜色贴着背景时, 被啃掉的部分会大片回来。
        need_ai = (ai_mode == AI_MODES[1])
        if ai_mode == AI_MODES[0]:
            probe, _, _ = _color_key(img, img_f, kind, bg_bgr, max(4, tolerance / 2.0),
                                     feather, shrink, despeckle_area,
                                     island_ratio=island_ratio)
            solid_now = alpha > 0.5
            solid_probe = probe > 0.5
            sens = float(np.mean(solid_probe & ~solid_now) /
                         max(1e-6, np.mean(solid_probe)))
            notes.append(f"容差敏感度 {sens:.3f} (阈值 {SENS_THRESHOLD})")
            need_ai = sens > SENS_THRESHOLD
            if need_ai:
                notes.append("→ 主体有颜色贴着背景, 自动启用 AI 补回")

        if need_ai:
            ai_a = load_ai()
            if ai_a is not None:
                # AI 只负责把被误删的主体"救回来", 不允许它删东西
                alpha = np.maximum(alpha, (ai_a > 0.85).astype(np.float32))
                alpha = _despeckle(alpha, int(despeckle_area))

        img_f = _decontaminate(img_f, alpha, bg_bgr, f_ref, kind,
                               spill_radius if spill else 0)

    # 放在最后: 去污染完成后颜色才是主体的真实颜色, 此时测亮度才准
    if bright_eq:
        img_f, bnote = _equalize_brightness(img_f, alpha, bright_target, bright_strength)
        notes.append(bnote)

    bgra = np.dstack([
        np.clip(img_f, 0, 255).astype(np.uint8),
        np.clip(alpha * 255.0, 0, 255).astype(np.uint8),
    ])
    ok, buf = cv2.imencode(".png", bgra)
    if not ok:
        raise ValueError("PNG 编码失败")

    notes.append(f"透明像素 {np.mean(alpha < 0.5)*100:.1f}%")
    return buf.tobytes(), "\n".join(notes)


# ---------------------------------------------------------------------------
# 4. Gradio 回调
# ---------------------------------------------------------------------------

def process_single_image(image_pil, bg_mode, tolerance, feather, shrink,
                         despeckle_area, spill, spill_radius, ai_mode, model_name,
                         island_ratio, bright_eq, bright_target, bright_strength):
    if image_pil is None:
        return None, "请先上传图片"
    try:
        buf = io.BytesIO()
        image_pil.convert("RGB").save(buf, format="PNG")
        out_bytes, info = smart_remove(
            buf.getvalue(), bg_mode, tolerance, feather, shrink,
            despeckle_area, spill, spill_radius, ai_mode, model_name, island_ratio,
            bright_eq, bright_target, bright_strength)
        return Image.open(io.BytesIO(out_bytes)), info
    except Exception as e:
        print(f"Error processing image: {e}")
        return None, f"❌ {e}"


def process_batch(input_dir, output_dir, bg_mode, tolerance, feather, shrink,
                  despeckle_area, spill, spill_radius, ai_mode, model_name,
                  island_ratio, bright_eq, bright_target, bright_strength,
                  progress=gr.Progress()):
    if not input_dir or not os.path.exists(input_dir):
        return f"❌ 错误：输入目录 '{input_dir}' 不存在。"

    os.makedirs(output_dir, exist_ok=True)

    files = []
    for ext in ('*.jpg', '*.jpeg', '*.png', '*.webp', '*.bmp'):
        files.extend(glob.glob(os.path.join(input_dir, ext)))
        files.extend(glob.glob(os.path.join(input_dir, ext.upper())))
    files = sorted(set(files))
    if not files:
        return f"⚠️ 在 '{input_dir}' 中没有找到图片文件。"

    processed, errors, lines = 0, 0, []
    for file_path in progress.tqdm(files, desc="批量处理中"):
        filename = os.path.basename(file_path)
        name, _ = os.path.splitext(filename)
        output_path = os.path.join(output_dir, f"{name}.png")
        try:
            with open(file_path, 'rb') as f:
                data = f.read()
            out_bytes, info = smart_remove(
                data, bg_mode, tolerance, feather, shrink,
                despeckle_area, spill, spill_radius, ai_mode, model_name, island_ratio,
                bright_eq, bright_target, bright_strength)
            with open(output_path, 'wb') as f:
                f.write(out_bytes)
            processed += 1
            # 亮度那行单独带出来: 批量的用途就是让整批看起来一致, 得能一眼核对
            detail = [ln for ln in info.splitlines() if ln.startswith("亮度均衡")]
            lines.append("  |  ".join([f"✔ {filename}", info.splitlines()[0]] + detail))
        except Exception as e:
            print(f"处理 {filename} 时出错: {e}")
            errors += 1
            lines.append(f"✘ {filename}  |  {e}")

    head = (f"✅ 完成！成功 {processed} 张，失败 {errors} 张。\n"
            f"📁 输出: {os.path.abspath(output_dir)}\n")
    return head + "\n".join(lines)


# ---------------------------------------------------------------------------
# 5. UI
# ---------------------------------------------------------------------------
with gr.Blocks(title="智能抠图工具", theme=gr.themes.Soft()) as demo:
    gr.Markdown("# 🎨 智能抠图工具 (自动识别背景)")
    gr.Markdown(
        "背景类型**自动识别**（绿幕 / 蓝幕 / 黑底 / 白底 / 任意纯色），无需手动勾选。\n\n"
        "只删除**与画框边缘连通**的背景色 —— 城池里的绿树、人物的黑发不会被一起抠掉；"
        "边缘按真实混合比解算，2px 宽的旗杆、弓弦都能保住。\n\n"
        "AI 模型只在**色键搞不定时**（背景不是纯色，或主体有大片颜色贴着背景，"
        "典型是黑底立绘的黑铠甲）才自动加载，其余情况约 0.2 秒出图。"
    )

    with gr.Row():
        bg_mode_r = gr.Radio(BG_MODES, value="自动识别", label="背景模式")
    with gr.Row():
        ai_mode_r = gr.Radio(AI_MODES, value=AI_MODES[0], label="AI 辅助")
        model_dd = gr.Dropdown(models, value="birefnet-general", label="AI 模型 (仅在用到 AI 时加载)")

    with gr.Accordion("🔧 精细参数", open=False):
        with gr.Row():
            tol_s = gr.Slider(5, 80, value=22, step=1, label="颜色容差 (背景与主体颜色接近时调小)")
            feather_s = gr.Slider(0, 6, value=1.0, step=0.5, label="边缘羽化 (px)")
        with gr.Row():
            shrink_s = gr.Slider(0, 4, value=0.0, step=0.5,
                                 label="边缘收边 (px, 仍有残边时再往里啃; 会削掉细结构)")
            speck_s = gr.Slider(0, 500, value=48, step=8, label="杂点清理最小面积 (px)")
        with gr.Row():
            spill_cb = gr.Checkbox(value=True, label="消除溢色 (仅绿/蓝幕，且只作用于边缘窄带)")
            spill_r = gr.Slider(1, 8, value=2, step=1, label="溢色作用半径 (px)")
        with gr.Row():
            island_s = gr.Slider(
                0, 1, value=ISLAND_TOL_RATIO, step=0.05,
                label="内部孤岛清除强度 (臂间缝隙等被主体包住的背景；调大更干净，"
                      "但城池图的绿树可能被误删)")

    with gr.Accordion("💡 亮度均衡 (让整批图亮度一致)", open=True):
        with gr.Row():
            bright_cb = gr.Checkbox(value=False, label="启用 (只按主体像素测亮度，背景不参与)")
            bright_t = gr.Slider(70, 190, value=BRIGHT_TARGET, step=1,
                                 label="目标亮度 (整批想更亮就调大；诊断栏会报每张的原始亮度，"
                                       "照着定值最准)")
            bright_str = gr.Slider(0, 1, value=1.0, step=0.05,
                                   label="强度 (1 = 完全对齐目标，0.5 = 只走一半、保留原图明暗风格)")

    params = [bg_mode_r, tol_s, feather_s, shrink_s, speck_s, spill_cb, spill_r,
              ai_mode_r, model_dd, island_s, bright_cb, bright_t, bright_str]

    with gr.Tabs():
        with gr.TabItem("单张处理 & 预览"):
            with gr.Row():
                with gr.Column():
                    input_img = gr.Image(type="pil", label="上传原图 (支持拖拽)")
                    submit_btn = gr.Button("🚀 开始抠图", variant="primary")
                with gr.Column():
                    output_img = gr.Image(type="pil", label="抠图结果 (含透明通道)",
                                          image_mode="RGBA", format="png")
                    diag_box = gr.Textbox(label="诊断信息", interactive=False, lines=6)

            submit_btn.click(fn=process_single_image,
                             inputs=[input_img] + params,
                             outputs=[output_img, diag_box])

        with gr.TabItem("批量处理文件夹"):
            with gr.Row():
                in_dir = gr.Textbox(label="输入文件夹路径", value=r"C:\Users\GAKU\Downloads\koutu")
                out_dir = gr.Textbox(label="输出文件夹路径", value=r"C:\Users\GAKU\Downloads\koutu")
            batch_btn = gr.Button("⚡ 开始批量抠图", variant="primary")
            batch_result = gr.Textbox(label="处理结果", interactive=False, lines=14)

            batch_btn.click(fn=process_batch,
                            inputs=[in_dir, out_dir] + params,
                            outputs=batch_result)

if __name__ == "__main__":
    demo.launch(inbrowser=True)
