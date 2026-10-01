/**
 * ⚠️ **本文件由「围栏编辑器」生成**（页面 `/stockade-wall-editor.html`，接口 `/api/stockade-wall-editor/save`）。
 * **不要手改** —— 要改样式请回编辑器画好再存盘，这里会被整份覆盖。
 *
 * 坐标一律按 `baseSizeRef = 100` 存；游戏按据点实际 baseSize 等比缩放（见 TerritorySystem.buildDeStockadeStackHtml）。
 * 件种 = 围栏三件套标准：城墙 NE / SE（含镜像）· 城垛 POST · 城门 GATE（CORNER 只在密编荆篱材质下画得出）。
 * 生成时间：2026-10-01T13:01:22.462Z
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

export const STOCKADE_WALL_STYLES: StockadeWallStyle[] = [
    {
        key: "stk_mupjm6qf",
        name: "探针·八角",
        material: "DARK",
        baseSizeRef: 100,
        clipRx: 61.34,
        clipRy: 35.57,
        applyTo: ["city_moyoro"],
        pieces: [
            { x: -12.75, y: -37.84, type: 'NE' },
            { x: -1.6, y: -37.84, type: 'NE' },
            { x: 9.55, y: -37.84, type: 'NE' },
            { x: 19.63, y: -33.86, type: 'POST' },
            { x: 29.27, y: -28.26, type: 'SE' },
            { x: 38.92, y: -22.67, type: 'SE' },
            { x: 48.56, y: -17.07, type: 'SE' },
            { x: 58.21, y: -11.48, type: 'SE' },
            { x: 65.25, y: -4.39, type: 'SE' },
            { x: 65.25, y: 6.76, type: 'SE' },
            { x: 56.15, y: 12.67, type: 'POST' },
            { x: 46.51, y: 18.27, type: 'SE', flipX: true },
            { x: 27.22, y: 29.45, type: 'GATE' },
            { x: 7.18, y: 37.84, type: 'SE', flipX: true },
            { x: -3.97, y: 37.84, type: 'SE', flipX: true },
            { x: -14.8, y: 36.65, type: 'POST' },
            { x: -24.45, y: 31.06, type: 'NE', flipX: true },
            { x: -34.09, y: 25.47, type: 'NE', flipX: true },
            { x: -43.74, y: 19.87, type: 'NE', flipX: true },
            { x: -53.38, y: 14.28, type: 'NE', flipX: true },
            { x: -63.03, y: 8.68, type: 'NE', flipX: true },
            { x: -65.25, y: -1.19, type: 'NE', flipX: true },
            { x: -60.97, y: -9.87, type: 'POST' },
            { x: -51.33, y: -15.47, type: 'NE' },
            { x: -41.68, y: -21.06, type: 'NE' },
            { x: -32.04, y: -26.66, type: 'NE' },
            { x: -22.39, y: -32.25, type: 'NE' },
        ],
    },
];

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
