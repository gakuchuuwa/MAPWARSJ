/**
 * DE 船帆（sail）素材表 —— 2026-10-30 主人「我们的船都没有解析帆，是吗？」→「请执行」
 *
 * DE 的战船**帆不在船体里**：`u_shp_galley_x1.sld` 只有桅杆与索具，帆是另一套素材
 * `u_shp_sail_<group>_<boat|ship>_<tier>_x1.sld`（10 文化组 × 12 档），
 * 引擎按「势力文化 + 船档」把帆叠在船上。我们过去只解了船体，所以海上全是光桅杆。
 *
 * 本表只做三件事：
 *   ① 哪些船型需要叠帆（自带帆的古典船/长船/商船/独木舟不在此列）；
 *   ② 每个船型取哪一档帆；
 *   ③ 势力文化 → DE 帆文化组。
 *
 * 素材由 `tools/extract_sail_assets.py` 从 DE 本体解出，落在 `public/SUCAI_SAIL/<GROUP>/<TIER>/`。
 */

export type SailGroup = 'afri' | 'asia' | 'ceas' | 'east' | 'medi' | 'meso' | 'orie' | 'seas' | 'slav' | 'west';

export interface SailTier {
    kind: 'boat' | 'ship';
    tier: number;
}

/**
 * 船型 → 帆档。档位按 DE 的船型大小递进走（小船 2 档、大舰 5 档），
 * 与船体素材的实际尺寸次序一致：GALLEY ＜ WAR_GALLEY ＜ GALLEON ≈ CARRACK。
 */
export const SAIL_TIER_BY_SHIP: Record<string, SailTier> = {
    GALLEY: { kind: 'ship', tier: 2 },
    WAR_GALLEY: { kind: 'ship', tier: 3 },
    GALLEON: { kind: 'ship', tier: 4 },
    CANNON_GALLEON: { kind: 'ship', tier: 4 },
    ELITE_CANNON_GALLEON: { kind: 'ship', tier: 5 },
    CARRACK: { kind: 'ship', tier: 5 },
    HULK: { kind: 'ship', tier: 3 },
    WAR_HULK: { kind: 'ship', tier: 4 },
    FIRE_SHIP: { kind: 'ship', tier: 2 },
    FAST_FIRE_SHIP: { kind: 'ship', tier: 3 },
    DEMO_SHIP: { kind: 'ship', tier: 2 },
    HEAVY_DEMO_SHIP: { kind: 'ship', tier: 3 },
    CATAPULT_SHIP: { kind: 'ship', tier: 4 },
    CATAPULT_GALLEON: { kind: 'ship', tier: 4 },
    ONAGER_SHIP: { kind: 'ship', tier: 4 },
    TRADE_COG: { kind: 'ship', tier: 2 },
    TRANSPORT_SHIP: { kind: 'ship', tier: 3 },
    LOU_CHUAN: { kind: 'ship', tier: 5 },
    DRAGON_SHIP: { kind: 'boat', tier: 6 },
    FIRE_GALLEY: { kind: 'boat', tier: 3 },
    INCENDIARY_SHIP: { kind: 'boat', tier: 4 },
    HEAVY_INCENDIARY_SHIP: { kind: 'boat', tier: 5 },
};

/** DE 16 母体建筑风格 → 帆文化组（DE 只有这 10 组帆） */
export const DE_STYLE_TO_SAIL_GROUP: Record<string, SailGroup> = {
    WEST: 'west',
    MEDI: 'medi',
    EAST: 'east',
    SLAV: 'slav',
    CEAS: 'ceas',
    ASIA: 'asia',
    ORIE: 'orie',
    SEAS: 'seas',
    AFRI: 'afri',
    MESO: 'meso',
    INDI: 'asia',
    PURU: 'meso',
    ANDE: 'meso',
    GREEK: 'medi',
    THRACIAN: 'medi',
    PERSIAN: 'orie',
};

/** 需要叠帆的船型（自带帆布的船不在此列：古典桨帆船、卡拉维尔、德罗蒙、长船、楼船以外的中式帆船、商船、独木舟…） */
export function needsSail(shipId: string | null | undefined): boolean {
    return !!shipId && shipId in SAIL_TIER_BY_SHIP;
}

/** 取某档帆的素材目录（相对 public） */
export function getSailDir(shipId: string, group: SailGroup): string | null {
    const t = SAIL_TIER_BY_SHIP[shipId];
    if (!t) return null;
    return `/SUCAI_SAIL/${group.toUpperCase()}/${t.kind}_${t.tier}`;
}
