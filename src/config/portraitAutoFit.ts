/**
 * 立绘自动校正：读 PNG 的不透明像素包围盒，算出 scale / offsetX / offsetY，
 * 让所有半身像「大小差不多、底缘对齐、看着顺眼」。
 *
 * 输出的 scale/offsetX/offsetY 与 PortraitAdjust 同一坐标系（设计 px，offsetY 正值向下，
 * CombatUI 渲染时会乘 COMBAT_UI_SCALE）。供两处共用：
 *   - 全库打底（portrait-tuner 的「全库自动校正」）
 *   - 游戏内暂停校正（CombatUI 的一键校正）
 *
 * 取舍（老实说）：
 *   - scale 由「不透明区高度」归一化得到 —— 这是「大小差不多」的主因子，最可靠。
 *   - offsetY 把不透明区「底缘」钉到画框底（半身像本就底对齐 + 底部渐隐），高度归一后头部自然对齐。
 *   - offsetX 默认 0：战斗界面把立绘贴内缘 + 内缘渐隐是刻意构图，水平不乱动；个别歪的用游戏内方向键微调。
 *   - 按「整个人物轮廓」归一，不是按「头部大小」。构图相近的半身像效果好；裁切特别怪的需手动微调两下。
 */

/** 立绘 img 在战斗界面的设计高度（= createPortraitImage 的 max-height，单位设计 px） */
export const PORTRAIT_IMG_DESIGN_HEIGHT = 550;

/** 目标：人物轮廓高度占画框的比例（越大人物越满） */
export const AUTOFIT_TARGET_FILL = 0.95;

/** 轮廓底缘钉到画框的位置（0=顶 1=底；半身像底对齐，钉到底部渐隐处） */
export const AUTOFIT_BOTTOM_ANCHOR = 1.0;

/** alpha 阈值：高于此视为不透明像素（滤掉投影/微光） */
const ALPHA_THRESHOLD = 40;

/** 测包围盒时缩放到的高度（降采样提速；±1/220≈0.5% 精度足够） */
const SCAN_HEIGHT = 220;

/** 缩放/偏移钳制（与 portrait-tuner 滑块范围一致） */
const SCALE_MIN = 0.4;
const SCALE_MAX = 2.2;
const OFFSET_MIN = -240;
const OFFSET_MAX = 240;

export interface OpaqueBBox {
    /** 不透明区上缘（0–1，归一化高度） */
    top: number;
    /** 不透明区下缘（0–1） */
    bottom: number;
    /** 不透明区左缘（0–1，归一化宽度） */
    left: number;
    /** 不透明区右缘（0–1） */
    right: number;
    /** 水平中心（0–1） */
    cx: number;
}

export interface PortraitAutoFitResult {
    scale: number;
    offsetX: number;
    offsetY: number;
}

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
const round2 = (v: number): number => Math.round(v * 100) / 100;

/**
 * 测量一张已解码图片的不透明像素包围盒（归一化 0–1）。
 * 整图全透明 / 读像素失败 → 返回 null。
 */
export function measureOpaqueBBox(img: HTMLImageElement): OpaqueBBox | null {
    const nW = img.naturalWidth;
    const nH = img.naturalHeight;
    if (!nW || !nH) return null;

    const sf = SCAN_HEIGHT / nH;
    const w = Math.max(1, Math.round(nW * sf));
    const h = Math.max(1, Math.round(nH * sf));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);

    let data: Uint8ClampedArray;
    try {
        data = ctx.getImageData(0, 0, w, h).data;
    } catch {
        return null; // 跨域污染等
    }

    // 每行/列需达到的最少不透明像素数，滤掉孤立杂点
    const rowMin = Math.max(2, Math.round(w * 0.005));
    const colMin = Math.max(2, Math.round(h * 0.005));

    const rowCount = new Array<number>(h).fill(0);
    const colCount = new Array<number>(w).fill(0);

    for (let y = 0; y < h; y++) {
        const rowOff = y * w * 4;
        for (let x = 0; x < w; x++) {
            const a = data[rowOff + x * 4 + 3];
            if (a > ALPHA_THRESHOLD) {
                rowCount[y]++;
                colCount[x]++;
            }
        }
    }

    let top = -1;
    let bottom = -1;
    for (let y = 0; y < h; y++) {
        if (rowCount[y] >= rowMin) {
            if (top === -1) top = y;
            bottom = y;
        }
    }
    let left = -1;
    let right = -1;
    for (let x = 0; x < w; x++) {
        if (colCount[x] >= colMin) {
            if (left === -1) left = x;
            right = x;
        }
    }

    if (top === -1 || left === -1) return null; // 没有有效不透明区

    return {
        top: top / h,
        bottom: (bottom + 1) / h,
        left: left / w,
        right: (right + 1) / w,
        cx: (left + right + 1) / 2 / w,
    };
}

/**
 * 由包围盒算出校正参数。
 * @param bbox    measureOpaqueBBox 的结果
 * @param eyeLineY 该文件夹的眼线（缩放锚点 Y，0–1）；默认 0.24
 */
export function computePortraitAutoFit(bbox: OpaqueBBox, eyeLineY = 0.24): PortraitAutoFitResult {
    const fh = Math.max(0.05, bbox.bottom - bbox.top); // 轮廓高度占比，防 0
    const scale = clamp(AUTOFIT_TARGET_FILL / fh, SCALE_MIN, SCALE_MAX);

    // 缩放锚点在眼线 eyeLineY 处。要让轮廓底缘(bbox.bottom)落到画框 BOTTOM_ANCHOR：
    //   screenY(底缘) = eyeLineY + scale*(bbox.bottom - eyeLineY) + offsetY/H
    //   令其 = BOTTOM_ANCHOR  →  offsetY = H * (BOTTOM_ANCHOR - eyeLineY - scale*(bbox.bottom - eyeLineY))
    const offsetYraw =
        PORTRAIT_IMG_DESIGN_HEIGHT *
        (AUTOFIT_BOTTOM_ANCHOR - eyeLineY - scale * (bbox.bottom - eyeLineY));

    return {
        scale: round2(scale),
        offsetX: 0,
        offsetY: clamp(Math.round(offsetYraw), OFFSET_MIN, OFFSET_MAX),
    };
}

/** 加载一张图片并等待解码 */
export function loadPortraitImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`图片加载失败: ${url}`));
        img.src = url;
    });
}

/**
 * 一步到位：给 URL 和眼线，返回校正参数。失败返回 null。
 */
export async function autoFitPortraitFromUrl(
    url: string,
    eyeLineY = 0.24,
): Promise<PortraitAutoFitResult | null> {
    try {
        const img = await loadPortraitImage(url);
        const bbox = measureOpaqueBBox(img);
        if (!bbox) return null;
        return computePortraitAutoFit(bbox, eyeLineY);
    } catch {
        return null;
    }
}
