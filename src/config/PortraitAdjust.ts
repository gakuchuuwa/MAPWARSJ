import { COMBAT_UI_SCALE, COMBAT_UI_TOKENS as T } from './combat-ui-tokens';
import {
    DEFAULT_PORTRAIT_ADJUST,
    PORTRAIT_GUIDE_DEFAULT_CHEST_LINE_X,
    PORTRAIT_GUIDE_DEFAULT_EYE_LINE_Y,
    type PortraitAdjustData,
    type PortraitAdjustValues,
} from '../data/portrait_adjust';

export const PORTRAIT_ADJUST_NEUTRAL: Required<PortraitAdjustValues> = {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
};

/** 从立绘 URL 提取文件夹键，如 "/assets/daming/" */
export function extractPortraitFolder(portraitPath: string): string | undefined {
    const m = portraitPath.match(/^(\/assets\/[^/]+\/)/);
    return m?.[1];
}

/** 文件夹默认 → 单张覆盖；未配置项回落到 1 / 0 */
export function resolvePortraitAdjust(
    portraitPath: string,
    data: PortraitAdjustData = DEFAULT_PORTRAIT_ADJUST,
): Required<PortraitAdjustValues> {
    const folder = extractPortraitFolder(portraitPath);
    const folderAdj = folder ? data.folders?.[folder] : undefined;
    const imageAdj = data.images?.[portraitPath];

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
    return portraitPath in (data.images ?? {});
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
    const top    = `linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) ${f}%)`;
    const bottom = `linear-gradient(to top,    rgba(0,0,0,0) 0%, rgba(0,0,0,1) ${f}%)`;
    const left   = `linear-gradient(to right,  rgba(0,0,0,0) 0%, rgba(0,0,0,1) ${f}%)`;
    const right  = `linear-gradient(to left,   rgba(0,0,0,0) 0%, rgba(0,0,0,1) ${f}%)`;
    const base   = 'linear-gradient(rgb(0,0,0) 0 0)';
    const mask   = `${top}, ${bottom}, ${left}, ${right}, ${base}`;
    img.style.webkitMaskImage = mask;
    img.style.maskImage = mask;
    img.style.webkitMaskComposite = 'source-in, source-in, source-in, source-in';
    img.style.maskComposite = 'intersect, intersect, intersect, intersect';
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
