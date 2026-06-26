import { COMBAT_UI_SCALE, COMBAT_UI_TOKENS as T } from './combat-ui-tokens';
import {
    DEFAULT_PORTRAIT_ADJUST,
    PORTRAIT_GUIDE_DEFAULT_CHEST_LINE_X,
    PORTRAIT_GUIDE_DEFAULT_EYE_LINE_Y,
    type PortraitAdjustData,
    type PortraitAdjustValues,
} from '../data/portrait_adjust';
import { PORTRAIT_CANONICAL_MAP } from './portrait_canonical';

/** 内容相同的图统一使用代表路径的调校记录（重复图只需调一次） */
export function toCanonicalPortraitPath(portraitPath: string): string {
    return PORTRAIT_CANONICAL_MAP[portraitPath] ?? portraitPath;
}

export const PORTRAIT_ADJUST_NEUTRAL: Required<PortraitAdjustValues> = {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
};

/**
 * F2 准星 / 脸椭圆预览（全局统一，左右共用；不读 folderGuides，避免左右两势标尺不一致）
 * 不在 portrait_adjust.ts，避免保存调校时被 vite 模板覆盖。
 */
export const PORTRAIT_GUIDE_PREVIEW_EYE_LINE_Y = 0.23;
export const PORTRAIT_GUIDE_PREVIEW_CHIN_LINE_Y = 0.34;
/** 腰线（半身像裁切参照，顶→底归一化） */
export const PORTRAIT_GUIDE_PREVIEW_WAIST_LINE_Y = 0.80;
export const PORTRAIT_GUIDE_PREVIEW_CHEST_LINE_X = 0.5;
/** 脸椭圆宽（归一化，相对 img 布局宽）— 窄 */
export const PORTRAIT_GUIDE_PREVIEW_FACE_OVAL_W = 0.29;
/** 脸椭圆高 — 长（略收，圈更小） */
export const PORTRAIT_GUIDE_PREVIEW_FACE_OVAL_H = 0.30;
/** 椭圆中心在眼线下方偏移（正值=往下；0=与眼线同高为基准） */
export const PORTRAIT_GUIDE_PREVIEW_FACE_OVAL_CENTER_DY = 0;
/** 椭圆中心相对胸线向右（PNG 朝右，脸略偏右；wrap scaleX 时随层镜像） */
export const PORTRAIT_GUIDE_PREVIEW_FACE_OVAL_CENTER_DX = 0.07;

export interface PortraitCorrectorCrosshairGuide {
    eyeLineY: number;
    chinLineY: number;
    waistLineY: number;
    chestLineX: number;
    ovalW: number;
    ovalH: number;
    ovalCx: number;
    ovalCy: number;
}

/** F2 准星唯一入口：左右立绘共用同一套标线 */
export function getPortraitCorrectorCrosshairGuide(): PortraitCorrectorCrosshairGuide {
    const eyeLineY = PORTRAIT_GUIDE_PREVIEW_EYE_LINE_Y;
    const chinLineY = PORTRAIT_GUIDE_PREVIEW_CHIN_LINE_Y;
    const waistLineY = PORTRAIT_GUIDE_PREVIEW_WAIST_LINE_Y;
    const chestLineX = PORTRAIT_GUIDE_PREVIEW_CHEST_LINE_X;
    return {
        eyeLineY,
        chinLineY,
        waistLineY,
        chestLineX,
        ovalW: PORTRAIT_GUIDE_PREVIEW_FACE_OVAL_W,
        ovalH: PORTRAIT_GUIDE_PREVIEW_FACE_OVAL_H,
        ovalCx: chestLineX + PORTRAIT_GUIDE_PREVIEW_FACE_OVAL_CENTER_DX,
        ovalCy: eyeLineY + PORTRAIT_GUIDE_PREVIEW_FACE_OVAL_CENTER_DY,
    };
}

/** 从立绘 URL 提取文件夹键，如 "/assets/daming/" */
export function extractPortraitFolder(portraitPath: string): string | undefined {
    const m = portraitPath.match(/^(\/assets\/[^/]+\/)/);
    return m?.[1];
}

/** 文件夹默认 → 单张覆盖；未配置项回落到 1 / 0。
 *  优先级：命名路径 > canonical 路径 > 文件夹默认 > 中性值。
 *  命名路径优先解决：换图后 canonical 映射过期、staged bind 存盘走命名路径等场景。 */
export function resolvePortraitAdjust(
    portraitPath: string,
    data: PortraitAdjustData = DEFAULT_PORTRAIT_ADJUST,
): Required<PortraitAdjustValues> {
    const canonical = toCanonicalPortraitPath(portraitPath);
    const folder = extractPortraitFolder(canonical);
    const folderAdj = folder ? data.folders?.[folder] : undefined;
    // 命名路径优先（换图/staged bind 后存盘走命名路径）；再查 canonical（共享调校）
    const imageAdj = data.images?.[portraitPath]
        ?? (canonical !== portraitPath ? data.images?.[canonical] : undefined);

    return {
        scale: imageAdj?.scale ?? folderAdj?.scale ?? PORTRAIT_ADJUST_NEUTRAL.scale,
        offsetX: imageAdj?.offsetX ?? folderAdj?.offsetX ?? PORTRAIT_ADJUST_NEUTRAL.offsetX,
        offsetY: imageAdj?.offsetY ?? folderAdj?.offsetY ?? PORTRAIT_ADJUST_NEUTRAL.offsetY,
    };
}

export function hasPortraitImageOverride(
    portraitPath: string,
    data: PortraitAdjustData = DEFAULT_PORTRAIT_ADJUST,
): boolean {
    return toCanonicalPortraitPath(portraitPath) in (data.images ?? {});
}

/** 缩放锚点：眼线 × 胸线交汇处（与调校尺一致；无 folderGuides 时用全局默认 24% / 50%） */
export function resolvePortraitTransformOrigin(
    portraitPath: string,
    data: PortraitAdjustData = DEFAULT_PORTRAIT_ADJUST,
): string {
    const folder = extractPortraitFolder(portraitPath);
    const guide = folder ? data.folderGuides?.[folder] : undefined;
    const x = guide?.chestLineX ?? PORTRAIT_GUIDE_DEFAULT_CHEST_LINE_X;
    const y = guide?.eyeLineY ?? PORTRAIT_GUIDE_DEFAULT_EYE_LINE_Y;
    return `${x * 100}% ${y * 100}%`;
}

/**
 * 四缘透明渐隐（mask 作用在 img 像素上，不叠不透明色块，避免槽位空白区出现硬黑边）
 */
export function applyPortraitEdgeMask(img: HTMLElement): void {
    const f = T.portraitEdgeFade;
    const horizontal = `linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) ${f}%, rgba(0,0,0,1) calc(100% - ${f}%), rgba(0,0,0,0) 100%)`;
    const vertical   = `linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) ${f}%, rgba(0,0,0,1) calc(100% - ${f}%), rgba(0,0,0,0) 100%)`;
    const mask = `${horizontal}, ${vertical}`;
    img.style.webkitMaskImage = mask;
    img.style.maskImage = mask;
    img.style.webkitMaskComposite = 'source-in';
    img.style.maskComposite = 'intersect';
}

/** 将调校参数应用到立绘 img（以眼线/胸线交汇处为缩放锚点，再用 offset 微调） */
export function applyPortraitAdjustToElement(
    img: HTMLElement,
    portraitPath: string,
    data: PortraitAdjustData = DEFAULT_PORTRAIT_ADJUST,
): void {
    const adj = resolvePortraitAdjust(portraitPath, data);
    const ox = Math.round(adj.offsetX * COMBAT_UI_SCALE);
    const oy = Math.round(adj.offsetY * COMBAT_UI_SCALE);
    img.style.transformOrigin = resolvePortraitTransformOrigin(portraitPath, data);
    img.style.transform = `translate(${ox}px, ${oy}px) scale(${adj.scale})`;
    applyPortraitEdgeMask(img);
}
