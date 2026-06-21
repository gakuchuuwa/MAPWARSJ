/**
 * 立绘校正辅助：读 PNG 不透明包围盒，只算 offset（**不改 scale**）。
 *
 * 半身像裁切点不一（腰/大腿/膝），**不做底缘对齐**，也不按轮廓高度自动缩放。
 * 居中：轮廓中心 → 画框中心（眼线/胸线仍为 transform-origin，供手动 [ ] 缩放）。
 *
 * 供 CombatUI F2「居中本张」与 portrait-tuner「批量居中」共用。
 */

import {
    PORTRAIT_GUIDE_DEFAULT_CHEST_LINE_X,
    PORTRAIT_GUIDE_DEFAULT_EYE_LINE_Y,
} from '../data/portrait_adjust';

/** 立绘 img 在战斗界面的设计高度（= createPortraitImage 的 max-height，单位设计 px） */
export const PORTRAIT_IMG_DESIGN_HEIGHT = 550;

/** alpha 阈值：高于此视为不透明像素（滤掉投影/微光） */
const ALPHA_THRESHOLD = 40;

/** 测包围盒时缩放到的高度（降采样提速） */
const SCAN_HEIGHT = 220;

const OFFSET_MIN = -240;
const OFFSET_MAX = 240;

export interface OpaqueBBox {
    top: number;
    bottom: number;
    left: number;
    right: number;
    cx: number;
}

export interface PortraitAutoFitResult {
    scale: number;
    offsetX: number;
    offsetY: number;
}

export interface PortraitAlignOptions {
    /** 保持现有缩放，不自动改 scale */
    keepScale?: number;
    eyeLineY?: number;
    chestLineX?: number;
    /** 布局宽（img 在 max-height 约束下的显示宽，设计 px） */
    layoutWidth?: number;
    layoutHeight?: number;
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
        return null;
    }

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

    if (top === -1 || left === -1) return null;

    return {
        top: top / h,
        bottom: (bottom + 1) / h,
        left: left / w,
        right: (right + 1) / w,
        cx: (left + right + 1) / 2 / w,
    };
}

/** 布局尺寸：高度顶满设计高，宽按原图比例 */
export function resolvePortraitLayoutSize(img: HTMLImageElement): { width: number; height: number } {
    const nW = img.naturalWidth;
    const nH = img.naturalHeight;
    if (!nW || !nH) {
        return { width: PORTRAIT_IMG_DESIGN_HEIGHT, height: PORTRAIT_IMG_DESIGN_HEIGHT };
    }
    const height = PORTRAIT_IMG_DESIGN_HEIGHT;
    const width = height * (nW / nH);
    return { width, height };
}

/**
 * 居中：轮廓几何中心对齐画框中心；**不修改 scale**。
 * 与 applyPortraitAdjustToElement 同一套 transform-origin + translate + scale 模型。
 */
export function computePortraitCenterAlign(
    bbox: OpaqueBBox,
    options: PortraitAlignOptions = {},
): PortraitAutoFitResult {
    const scale = options.keepScale ?? 1;
    const eyeLineY = options.eyeLineY ?? PORTRAIT_GUIDE_DEFAULT_EYE_LINE_Y;
    const chestLineX = options.chestLineX ?? PORTRAIT_GUIDE_DEFAULT_CHEST_LINE_X;
    const layoutH = options.layoutHeight ?? PORTRAIT_IMG_DESIGN_HEIGHT;
    const layoutW = options.layoutWidth ?? layoutH;

    const cy = (bbox.top + bbox.bottom) / 2;
    const frameCenterY = 0.5;
    const frameCenterX = 0.5;

    const offsetYraw = layoutH * (frameCenterY - eyeLineY - scale * (cy - eyeLineY));
    const offsetXraw = layoutW * (frameCenterX - chestLineX - scale * (bbox.cx - chestLineX));

    return {
        scale: round2(scale),
        offsetX: clamp(Math.round(offsetXraw), OFFSET_MIN, OFFSET_MAX),
        offsetY: clamp(Math.round(offsetYraw), OFFSET_MIN, OFFSET_MAX),
    };
}

/** @deprecated 旧版按轮廓高度缩放 + 底对齐；半身像裁切不一，请用 computePortraitCenterAlign */
export function computePortraitAutoFit(bbox: OpaqueBBox, eyeLineY = 0.24): PortraitAutoFitResult {
    return computePortraitCenterAlign(bbox, { keepScale: 1, eyeLineY });
}

export function loadPortraitImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`图片加载失败: ${url}`));
        img.src = url;
    });
}

/** 居中本张：加载图 → 测轮廓 → 只写 offset，scale 保持 keepScale */
export async function alignPortraitCenterFromUrl(
    url: string,
    options: PortraitAlignOptions = {},
): Promise<PortraitAutoFitResult | null> {
    try {
        const img = await loadPortraitImage(url);
        const bbox = measureOpaqueBBox(img);
        if (!bbox) return null;
        const layout = resolvePortraitLayoutSize(img);
        return computePortraitCenterAlign(bbox, {
            ...options,
            layoutWidth: layout.width,
            layoutHeight: layout.height,
        });
    } catch {
        return null;
    }
}

/** @deprecated 请用 alignPortraitCenterFromUrl；保留别名以免旧 import 报错 */
export async function autoFitPortraitFromUrl(
    url: string,
    eyeLineY = PORTRAIT_GUIDE_DEFAULT_EYE_LINE_Y,
    keepScale = 1,
): Promise<PortraitAutoFitResult | null> {
    return alignPortraitCenterFromUrl(url, { eyeLineY, keepScale });
}
