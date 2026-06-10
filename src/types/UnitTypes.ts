/**
 * UnitTypes.ts
 *
 * legionType 仅表示阵型骨架（3×3 步骑 vs 纯骑三角），不表示文化。
 * 文化外观 = 据点 region → CultureFormations.cultureSlots（与军队编辑器 14 区一致）。
 */

export type LegionType = 'infantry' | 'archer_cavalry' | 'cavalry' | 'mixed';

export interface UnitTypeConfig {
    type: LegionType;
    displayName: string;
}

export const UNIT_TYPE_CONFIG: Record<LegionType, UnitTypeConfig> = {
    infantry: { type: 'infantry', displayName: '步兵' },
    archer_cavalry: { type: 'archer_cavalry', displayName: '弓骑' },
    cavalry: { type: 'cavalry', displayName: '骑兵' },
    mixed: { type: 'mixed', displayName: '步骑' },
};

export function getUnitTypeConfig(type: LegionType): UnitTypeConfig {
    return UNIT_TYPE_CONFIG[type] || UNIT_TYPE_CONFIG.infantry;
}

/** @deprecated 仅历史事件 legions 表缺省；沙盒募兵应走 getLegionTypeForCulture */
export function getDefaultLegionTypeForFaction(_factionId: string): LegionType {
    return 'mixed';
}
