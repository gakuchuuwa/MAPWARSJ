import type { RegionType } from '../systems/RegionSystem';

/**
 * 战略地图森林贴图（zoom=9 森林簇，仅 PNG 贴图）
 * 新贴图：放入 public/trees/ 并登记到对应文化区。
 */
export const FOREST_TEXTURES_BY_REGION: Partial<Record<RegionType, readonly string[]>> = {
    NORTHEAST: ['/trees/pine_cluster_a.png'],
    KOREA: ['/trees/pine_cluster_a.png'],
    /** 北方：Stitch 针叶林簇 c0dbc09b */
    NORTH: ['/trees/north_forest_a.png'],
    /** 中原：Stitch 阔叶林簇 */
    CENTRAL: ['/trees/central_forest_a.png'],
};

/** 各文化区森林密度系数（>1 更密，全局已压低） */
export const FOREST_DENSITY_BY_REGION: Partial<Record<RegionType, number>> = {
    NORTHEAST: 0.85,
    KOREA: 0.7,
    NORTH: 0.55,
    CENTRAL: 0.4,
};

/** 显示放大（浅地形可读性） */
export const FOREST_SCALE_BY_REGION: Partial<Record<RegionType, number>> = {
    NORTHEAST: 1.35,
    KOREA: 1.15,
    NORTH: 1.1,
    CENTRAL: 1.0,
};

export function getForestTextures(region: RegionType): readonly string[] | undefined {
    return FOREST_TEXTURES_BY_REGION[region];
}

/** 每个森林斑块叠放贴图数量 [最少, 最多]，至少 3 张扎堆 */
export function forestPatchSpriteRange(region: RegionType): [number, number] {
    const d = FOREST_DENSITY_BY_REGION[region] ?? 0.6;
    const min = Math.max(3, Math.round(3 + d * 1.2));
    return [min, min + 3];
}
