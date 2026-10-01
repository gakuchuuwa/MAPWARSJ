/**
 * 围栏编辑器存下的自定义样式 —— **按「分类」取**（主人 2026-10-02：「我要改的是这一类，不是这一城」）。
 *
 * 分类 = **建筑风格 × 形制**，键写成 `STYLE|shape`，例：`ASIA|round`（东亚·圆城）、`SLAV|oval`（东北欧·椭圆山脊堡）。
 *  · 建筑风格 = 游戏里 `resolveCityDeBuildingStyle` 解出来的那一个（16 母体或 YURT 毡帐营地）；
 *  · 形制 = 城寨按据点哈希掷出的六形制之一（square / round / octagon / rect / oval / trapezoid）。
 * 一个自定义样式的 `applyTo` 里存若干分类键；同一分类被多套样式认领时，**最后保存的那套**生效。
 * 游戏取样式只许走这里，**不再按据点 id**（`stockadeWallStyles.ts` 里自动生成的 `pickStockadeWallStyle(cityId)` 作废不用）。
 */
import { STOCKADE_WALL_STYLES, type StockadeWallStyle } from './stockadeWallStyles';

export const STOCKADE_SHAPE_ORDER = ['square', 'round', 'octagon', 'rect', 'oval', 'trapezoid'] as const;
export type StockadeShapeName = typeof STOCKADE_SHAPE_ORDER[number];

export const stockadeCategoryKey = (deStyle: string, shape: string): string => `${deStyle}|${shape}`;

/** 这一类（建筑风格 × 形制）有没有被指派自定义围栏；shapeIndex 即游戏里 `哈希 % 6` 掷出的形制序号（0~5）。 */
export function pickStockadeWallStyleByCategory(deStyle: string | null | undefined, shapeIndex: number): StockadeWallStyle | null {
    if (!deStyle) return null;
    const key = stockadeCategoryKey(deStyle, STOCKADE_SHAPE_ORDER[shapeIndex] ?? '');
    for (let i = STOCKADE_WALL_STYLES.length - 1; i >= 0; i--) {
        if (STOCKADE_WALL_STYLES[i].applyTo.includes(key)) return STOCKADE_WALL_STYLES[i];
    }
    return null;
}
