import { COMBAT_UI_SCALE } from './combat-ui-tokens';
import {
    DEFAULT_PORTRAIT_ADJUST,
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

/** 将调校参数应用到立绘 img（画布中心缩放，再用 offset 微调位置） */
export function applyPortraitAdjustToElement(
    img: HTMLElement,
    portraitPath: string,
    data?: PortraitAdjustData,
): void {
    const adj = resolvePortraitAdjust(portraitPath, data);
    const ox = Math.round(adj.offsetX * COMBAT_UI_SCALE);
    const oy = Math.round(adj.offsetY * COMBAT_UI_SCALE);
    img.style.transformOrigin = 'center center';
    img.style.transform = `translate(${ox}px, ${oy}px) scale(${adj.scale})`;
}
