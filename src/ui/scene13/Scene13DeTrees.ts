/**
 * 战术场景树种：DE 地形 → 默认树（DE dat 口径）。
 *
 * 🔴 [2026-10-21 主人问「沙子里面长树，这对吗，看看DE是如何设计的。」]
 *
 * DE 的树**不是地图脚本一棵一棵摆出来的**：森林地形在 dat 里登记了默认单位，
 * 引擎按 `terrain_unit_density` 自动长 —— `density = 1000` 表示这一格必长一棵。
 * 证据：
 *   · 官方 `tc-rms-guide.md:301`：*"Forests, for example, will be filled with tree objects."*
 *   · `docs/02-design/RMS引擎语义-给CC.md` §12.8「那些 UNKNOWN_* 到底是什么」
 *   · `docs/02-design/RMS对齐台账.md:70-72`（dat 的 `terrain_unit_id` / `terrain_units_density`，density==1000 才每格必长）
 * 本表由 `scratch/de_terrain_units.json`（2026-10-21 从 DE `empires2_x2_p1.dat` 导出）整理，
 * **只保留「树」单位**（草、灌木、花草、作物不算树；灌木另见 BUSH 系列）。
 *
 * 🔴 由此定死本作战术场景的树种口径：
 *   1. **树由「脚下 DE 地形」决定，不由建筑风格决定。** 攻城战场用了 DE 烘焙图
 *      （`public/battlefields/site_<据点>.json` 的 `terrain[]`）时，那一格是什么 DE 地形，
 *      就长那一种树；建筑风格（SASANIAN / MONGOL …）只兜底、不许覆盖烘焙图的树种。
 *   2. **纯沙地不长树。** DE 里 `14 Desert` 没有任何自动树；沙漠上见到的棕榈是脚本散树
 *      （Arabia.rms 的 `STRAGGLER_SPAWN 351 Palm Tree`），棕榈**林**长在 `13 Palm Desert` 上。
 *      所以「沙地上长棕榈」是 DE 的原设计；「沙地上长松/桦/橡」不是。
 *   3. **季节只换同族的变体**（栎→秋橡/雪橡、桦→秋桦/冬桦、松→雪松），绝不跨族换树种。
 */

import type { TreeSeason } from './TreeAssignment';

/** 一条「地形自带树木」登记（DE dat 的 terrain_unit_id / density 子集） */
export interface DeTerrainTreeUnit {
    /** DE dat 里的单位名（例如 FORTR / FPAL / FPIN） */
    unit: string;
    /** 对应的本作 NATURE 素材名（public/SUCAI_NATURE 下的目录） */
    asset: string;
    /** DE dat 的 terrain_unit_density：1000 ＝ 每格必长 */
    density: number;
}

/**
 * DE 地形 id → 自带树木单位。
 * 来源 `scratch/de_terrain_units.json`（39 条地形里**有树**的 24 条）。
 * 注意 `14 Desert`、`2 Beach`、`0/9/12/41/100`（草地）、`89 Forest Bush`（只有灌木）没有树。
 */
export const DE_TERRAIN_TREES: Readonly<Record<number, readonly DeTerrainTreeUnit[]>> = {
    10: [{ unit: 'FORTR', asset: 'OAK', density: 1000 }],                       // Forest（橡树林）
    13: [{ unit: 'FPAL', asset: 'PALM', density: 1000 }],                       // Palm Desert（棕榈林）
    17: [{ unit: 'FJUN', asset: 'JUNGLE', density: 1000 }],                     // Jungle
    18: [{ unit: 'FBAM', asset: 'BAMBOO', density: 1000 }],                     // Bamboo
    19: [{ unit: 'FPIN', asset: 'PINE', density: 1000 }],                       // Pine Forest
    20: [{ unit: 'FOAK', asset: 'OAK', density: 1000 }],                        // Forest, Oak Bush
    21: [{ unit: 'FSNO', asset: 'SNOW_PINE', density: 1000 }],                  // Snow Forest
    48: [{ unit: 'FDRA', asset: 'DRAGON_TREE', density: 1000 }],                // Dragon Forest
    49: [{ unit: 'FBAO', asset: 'BAOBAB', density: 250 }],                      // Baobab Forest
    50: [{ unit: 'FACA', asset: 'ACACIA', density: 500 }],                      // Acacia Forest
    55: [{ unit: 'FMANGRO', asset: 'MANGROVE', density: 800 }],                 // Mangrove Forest
    56: [{ unit: 'FRAIN', asset: 'RAINFOREST', density: 1000 }],                // Rainforest
    88: [                                                                       // Forest, Mediterranean
        { unit: 'ITPINE', asset: 'ITALIAN_PINE', density: 1000 },
        { unit: 'OLIVE', asset: 'OLIVE', density: 500 },
        { unit: 'CYPRESS', asset: 'CYPRESS', density: 100 },
    ],
    // 注：90/91/92 Forest, Reeds 在 DE dat 里挂的是 1350 Reeds（内部代号同叫 FBAM，但外观是芦苇而非竹子 348），不算乔木
    104: [{ unit: 'FAUTUM', asset: 'AUTUMN_OAK', density: 1000 }],              // Forest, Autumn
    105: [{ unit: 'FAUTUMS', asset: 'SNOW_AUTUMN_OAK', density: 1000 }],        // Forest, Snow Autumn
    106: [{ unit: 'FDEAD', asset: 'DEAD_TREE', density: 1000 }],                // Dead Forest
    110: [{ unit: 'BIRCH', asset: 'BIRCH_GREEN', density: 1000 }],              // Forest, Birch
    112: [{ unit: 'FPAL', asset: 'PALM', density: 1000 }],                      // Forest, Palm Grass
    113: [{ unit: 'FLBAM', asset: 'LUSH_BAMBOO', density: 1000 }],              // Forest, Lush Bamboo
    128: [                                                                      // Forest, Dry South American
        { unit: 'GREENOAK', asset: 'GREEN_OAK', density: 750 },
        { unit: 'FACA', asset: 'ACACIA', density: 420 },
        { unit: 'ITPINE', asset: 'ITALIAN_PINE', density: 350 },
        { unit: 'MONKEYPUZZLE', asset: 'MONKEY_PUZZLE', density: 300 },
        { unit: 'OLIVE', asset: 'OLIVE', density: 150 },
    ],
    131: [{ unit: 'SPRUCE', asset: 'SPRUCE', density: 1000 }],                  // Forest, Spruce（2026-10-30 已提取云杉素材）
    132: [{ unit: 'SPRUCESNOW', asset: 'SPRUCE_SNOW', density: 1000 }],         // Forest, Spruce Snow
    133: [{ unit: 'GREENOAK', asset: 'GREEN_OAK', density: 1000 }],             // Forest, Oak Green
};

const EMPTY_TREES: readonly DeTerrainTreeUnit[] = [];

/** 🔴 纯沙地：DE 里不长任何自动树（14 Desert、2 Beach） */
export const DE_BARE_SAND_TERRAINS: ReadonlySet<number> = new Set([2, 14]);

/**
 * 沙漠/干热树种白名单：沙地上（以及沙漠题材的散树里）只允许这些。
 * 依据 `docs/02-design/DE-nature-asset-classification.md` 第一节「沙漠/干热：PALM / DEAD_TREE」，
 * 外加 DE 沙漠主题里会撒的龙血树/金合欢与灌木。
 */
export const DESERT_TREE_ASSETS: ReadonlySet<string> = new Set([
    'PALM', 'DRAGON_TREE', 'ACACIA', 'BAOBAB', 'CACTUS', 'DEAD_TREE',
    'BUSH_TREE_A', 'BUSH_TREE_B',
]);

/** 该 DE 地形登记了哪些树（可能多种，按 density 从高到低） */
export function deTerrainTrees(terrainId: number): readonly DeTerrainTreeUnit[] {
    return DE_TERRAIN_TREES[terrainId] ?? EMPTY_TREES;
}

/** 该 DE 地形的「主导树」（density 最高的一种；没登记返回 null） */
export function deTerrainTreeAsset(terrainId: number): string | null {
    const list = deTerrainTrees(terrainId);
    if (list.length === 0) return null;
    let best = list[0];
    for (const t of list) if (t.density > best.density) best = t;
    return best.asset;
}

/**
 * 按 DE dat 的累计千分比（terrain_unit_density）从该森林地形的登记树种中抽一棵：
 * - 单树种森林（10 橡、19 松、18 竹、104 秋橡、110 桦、13 棕榈…）直接返回该树种；
 * - 多树种混交林（如 88 地中海森林：柏树 100 / 橄榄 500 / 意松 1000）按升序阈值命中。
 */
export function deTerrainRollTreeAsset(terrainId: number, roll0to999: number): string | null {
    const list = deTerrainTrees(terrainId);
    if (list.length === 0) return null;
    if (list.length === 1) return list[0].asset;
    const r = ((roll0to999 % 1000) + 1000) % 1000;
    let chosen: DeTerrainTreeUnit | null = null;
    let maxUnit = list[0];
    for (const t of list) {
        if (t.density > maxUnit.density) maxUnit = t;
        if (r < t.density && (!chosen || t.density < chosen.density)) {
            chosen = t;
        }
    }
    return (chosen ?? maxUnit).asset;
}

/** 该 DE 地形是不是「森林地形」（登记了树、且至少有一种 density ≥ 400 的成林树） */
export function deTerrainIsForest(terrainId: number): boolean {
    return deTerrainTrees(terrainId).some((t) => t.density >= 400);
}

/** 纯沙地（DE 14 Desert / 2 Beach）：不长自动树 */
export function isBareSandTerrain(terrainId: number): boolean {
    return DE_BARE_SAND_TERRAINS.has(terrainId);
}

/** 是不是沙漠/干热树种（沙地上唯一允许的树） */
export function isDesertTreeAsset(asset: string): boolean {
    return DESERT_TREE_ASSETS.has(asset);
}

/**
 * 纯沙地上不许出现这棵树吗？
 * DE 的沙地（14 Desert）只有脚本撒的棕榈/龙血树之类散树；松、桦、橡、枫这些是温带/寒带树种，
 * 长在沙地上就是张冠李戴。
 */
export function bareSandRejectsTree(terrainId: number, asset: string): boolean {
    return isBareSandTerrain(terrainId) && !isDesertTreeAsset(asset);
}

/**
 * 四季换装族（非积雪地面）：[春 0, 夏 1, 秋 2, 冬 3]；
 * 没登记的树四季同形（棕榈/龙血树/竹/橄榄等常青或常枯）。
 * 🔴 非积雪地面（如地中海、江南、岭南冬季无雪区）冬季（3）一律使用无白雪形态（AUTUMN_OAK / PINE / BIRCH_WINTER），
 *    绝不在黄土或绿草地上挂白雪（SNOW_* 仅在 snowGround === true 时使用）。
 */
const SEASON_FAMILY: Readonly<Record<string, readonly [string, string, string, string]>> = {
    OAK: ['GREEN_OAK', 'OAK', 'AUTUMN_OAK', 'AUTUMN_OAK'],
    GREEN_OAK: ['GREEN_OAK', 'OAK', 'AUTUMN_OAK', 'AUTUMN_OAK'],
    AUTUMN_OAK: ['GREEN_OAK', 'OAK', 'AUTUMN_OAK', 'AUTUMN_OAK'],
    SNOW_AUTUMN_OAK: ['GREEN_OAK', 'OAK', 'AUTUMN_OAK', 'AUTUMN_OAK'],
    BIRCH_GREEN: ['BIRCH_GREEN', 'BIRCH_GREEN', 'BIRCH_AUTUMN', 'BIRCH_WINTER'],
    BIRCH_AUTUMN: ['BIRCH_GREEN', 'BIRCH_GREEN', 'BIRCH_AUTUMN', 'BIRCH_WINTER'],
    BIRCH_WINTER: ['BIRCH_GREEN', 'BIRCH_GREEN', 'BIRCH_AUTUMN', 'BIRCH_WINTER'],
    PINE: ['PINE', 'PINE', 'PINE', 'PINE'],
    ASIAN_PINE: ['ASIAN_PINE', 'ASIAN_PINE', 'ASIAN_PINE', 'ASIAN_PINE'],
    ITALIAN_PINE: ['ITALIAN_PINE', 'ITALIAN_PINE', 'ITALIAN_PINE', 'ITALIAN_PINE'],
    CYPRESS: ['CYPRESS', 'CYPRESS', 'CYPRESS_DEC', 'CYPRESS_DEC'],
    CYPRESS_DEC: ['CYPRESS', 'CYPRESS', 'CYPRESS_DEC', 'CYPRESS_DEC'],
    ASIAN_MAPLE_GREEN: ['ASIAN_MAPLE_GREEN', 'ASIAN_MAPLE_GREEN', 'ASIAN_MAPLE_AUTUMN', 'ASIAN_MAPLE_AUTUMN'],
    ASIAN_MAPLE_AUTUMN: ['ASIAN_MAPLE_GREEN', 'ASIAN_MAPLE_GREEN', 'ASIAN_MAPLE_AUTUMN', 'ASIAN_MAPLE_AUTUMN'],
    MONKEY_PUZZLE: ['MONKEY_PUZZLE', 'MONKEY_PUZZLE', 'MONKEY_PUZZLE', 'MONKEY_PUZZLE'],
    SPRUCE: ['SPRUCE', 'SPRUCE', 'SPRUCE', 'SPRUCE'],
};

/** 冬季积雪地面才有「挂雪树」；非积雪地面把 SNOW_* 换回同族无雪基树，再走 SEASON_FAMILY 按季换装 */
const SNOW_TO_PLAIN: Readonly<Record<string, string>> = {
    SNOW_PINE: 'PINE',
    SNOW_AUTUMN_OAK: 'AUTUMN_OAK',
    SNOW_BIRCH: 'BIRCH_WINTER',
    SNOW_DEAD_TREE: 'DEAD_TREE',
    SNOW_SPRUCE: 'PINE',
    SPRUCE_SNOW: 'SPRUCE',
    BUSH_TREE_C: 'BUSH_TREE_A',
};

/**
 * 把一棵挂雪树剥回同族无雪树（不改四季形态）。
 * 🔴 [2026-10-31 主人问「高昌的冬天，植被上有雪吗？」]
 *    高昌／吐鲁番—哈密这类极旱区，WorldClim 冬季标志是 **4＝零星残雪、不覆连片白雪**，
 *    植被上不该挂雪。凡不是真积雪区（标志 0／4）的场景，任何来路的 SNOW_* 树都要剥成无雪同族树。
 */
export function snowToPlainTree(asset: string): string {
    return SNOW_TO_PLAIN[asset] ?? asset;
}

/**
 * 按季节/地面积雪把一棵树换成对应形态：
 * - 积雪地面（snowGround === true）：全图统一为挂雪/冬枯形态，不留盛夏绿树与雪树混长；
 * - 非积雪地面（snowGround === false）：先剥离 SNOW_* 前缀，再按四季换装，绝不出现挂雪树。
 */
export function seasonalDeTree(asset: string, season: number, snowGround: boolean): string {
    const s: TreeSeason = (season === 0 || season === 1 || season === 2 || season === 3)
        ? season as TreeSeason
        : 1;
    // ① 积雪地面：统一换为冬季挂雪/冬枯形态，杜绝同一战场雪树与普通绿树混杂
    if (snowGround) {
        if (
            asset === 'OAK' || asset === 'GREEN_OAK' || asset === 'AUTUMN_OAK' || asset === 'SNOW_AUTUMN_OAK'
            || asset === 'ASIAN_MAPLE_GREEN' || asset === 'ASIAN_MAPLE_AUTUMN'
            || asset === 'PEACH_BLOSSOM' || asset === 'CHERRY_BLOSSOM' || asset === 'GINKGO' || asset === 'OLIVE'
        ) {
            return 'SNOW_AUTUMN_OAK';
        }
        if (asset === 'BIRCH_GREEN' || asset === 'BIRCH_AUTUMN' || asset === 'BIRCH_WINTER' || asset === 'SNOW_BIRCH' || asset === 'WILLOW') {
            return 'BIRCH_WINTER';
        }
        if (
            asset === 'PINE' || asset === 'ASIAN_PINE' || asset === 'SNOW_PINE' || asset === 'SNOW_SPRUCE'
            || asset === 'ITALIAN_PINE' || asset === 'CYPRESS' || asset === 'CYPRESS_DEC'
            || asset === 'MONKEY_PUZZLE' || asset === 'BAMBOO' || asset === 'LUSH_BAMBOO'
        ) {
            return 'SNOW_PINE';
        }
        if (asset === 'SPRUCE' || asset === 'SPRUCE_SNOW') return 'SPRUCE_SNOW';
        if (asset === 'BUSH_TREE_A' || asset === 'BUSH_TREE_B' || asset === 'BUSH_TREE_C') return 'BUSH_TREE_C';
        if (asset === 'SNOW_DEAD_TREE') return 'DEAD_TREE';
        if (/^SCENARIO_TREE_/.test(asset)) return 'SCENARIO_TREE_I';
        return asset;
    }
    // ② 非积雪地面：先把烘焙图里可能自带的 SNOW_* 还原为同族无雪树，再按四季换装
    const base = SNOW_TO_PLAIN[asset] ?? asset;
    const fam = SEASON_FAMILY[base];
    if (fam) return fam[s];
    return base;
}

/** 查该 DE 地形这一季该长的树（主导树种换季后）；没登记树返回 null */
export function deTerrainSeasonalTree(terrainId: number, season: number, snowGround: boolean): string | null {
    const asset = deTerrainTreeAsset(terrainId);
    return asset ? seasonalDeTree(asset, season, snowGround) : null;
}
