/**
 * 立绘显示调校：文件夹默认 + 单张覆盖
 * 由 PortraitTuner（/portrait-tuner.html）维护；CombatUI 读取本文件。
 *
 * folders 键示例："/assets/daming/"
 * images 键示例："/assets/daming/daming (1).png"
 */
export interface PortraitAdjustValues {
    /** 相对缩放，默认 1 */
    scale?: number;
    /** 水平偏移（设计 px，CombatUI 会乘 COMBAT_UI_SCALE） */
    offsetX?: number;
    /** 垂直偏移（设计 px，正值向下） */
    offsetY?: number;
}

export interface PortraitAdjustData {
    folders?: Record<string, PortraitAdjustValues>;
    images?: Record<string, PortraitAdjustValues>;
}

export const DEFAULT_PORTRAIT_ADJUST: PortraitAdjustData = {
    folders: {},
    images: {},
};
