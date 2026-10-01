/**
 * ⚠️ **本文件由「围栏编辑器」生成**（页面 `/stockade-wall-editor.html`，接口 `/api/stockade-wall-editor/save`）。
 * **不要手改** —— 要改样式请回编辑器画好再存盘，这里会被整份覆盖。
 *
 * 坐标一律按 `baseSizeRef = 100` 存；游戏按据点实际 baseSize 等比缩放（见 `TerritorySystem.buildDeStockadeStackHtml`）。
 * 件种 = 围栏三件套标准：城墙 NE / SE（含镜像）· 城垛 POST · 城门 GATE（CORNER 只在密编荆篱材质下画得出）。
 * 生成时间：（尚未保存过任何样式 —— 在编辑器里画好点「保存样式」即会自动重写本文件）
 */

export type StockadeWallPieceType = 'NE' | 'SE' | 'POST' | 'GATE' | 'CORNER';

export interface StockadeWallStylePiece {
    x: number;
    y: number;
    type: StockadeWallPieceType;
    flipX?: boolean;
}

export interface StockadeWallStyle {
    key: string;
    name: string;
    material: 'HARDWOOD' | 'DARK' | 'ARCHAIC' | 'FENCE';
    baseSizeRef: number;
    clipRx: number;
    clipRy: number;
    /** 指派到这些据点（cityId）：游戏里这些城寨就用这一套 */
    applyTo: string[];
    pieces: StockadeWallStylePiece[];
}

export const STOCKADE_WALL_STYLES: StockadeWallStyle[] = [];

/** 据点 → 自定义样式（同一个据点被多套样式指派时，以最后保存的那套为准） */
export const STOCKADE_WALL_STYLE_BY_CITY: Record<string, StockadeWallStyle> = (() => {
    const m: Record<string, StockadeWallStyle> = {};
    for (const s of STOCKADE_WALL_STYLES) for (const c of s.applyTo) m[c] = s;
    return m;
})();

/** 这个据点有没有被指派自定义围栏（有 → 游戏优先用玩家的设计，不再走六形制哈希） */
export function pickStockadeWallStyle(cityId: string): StockadeWallStyle | null {
    return STOCKADE_WALL_STYLE_BY_CITY[cityId] ?? null;
}
