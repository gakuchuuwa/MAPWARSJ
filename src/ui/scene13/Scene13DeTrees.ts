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
    90: [{ unit: 'FBAM', asset: 'BAMBOO', density: 1000 }],                     // Forest, Reeds (Shallows)
    91: [{ unit: 'FBAM', asset: 'BAMBOO', density: 1000 }],                     // Forest, Reeds (Beach)
    92: [{ unit: 'FBAM', asset: 'BAMBOO', density: 1000 }],                     // Forest, Reeds
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
    131: [{ unit: 'SPRUCE', asset: 'PINE', density: 1000 }],                    // Forest, Spruce（本作无云杉素材，走松）
    132: [{ unit: 'SPRUCESNOW', asset: 'SNOW_PINE', density: 1000 }],           // Forest, Spruce Snow
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
    'BUSH_TREE_A', 'BUSH_TREE_B', 'BUSH_TREE_C',
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

/** 四季换装族：[春 0, 夏 1, 秋 2, 冬 3]；没登记的树四季同形（棕榈/龙血树/竹等常青或常枯） */
const SEASON_FAMILY: Readonly<Record<string, readonly [string, string, string, string]>> = {
    OAK: ['GREEN_OAK', 'OAK', 'AUTUMN_OAK', 'SNOW_AUTUMN_OAK'],
    GREEN_OAK: ['GREEN_OAK', 'OAK', 'AUTUMN_OAK', 'SNOW_AUTUMN_OAK'],
    AUTUMN_OAK: ['GREEN_OAK', 'OAK', 'AUTUMN_OAK', 'SNOW_AUTUMN_OAK'],
    SNOW_AUTUMN_OAK: ['GREEN_OAK', 'OAK', 'AUTUMN_OAK', 'SNOW_AUTUMN_OAK'],
    BIRCH_GREEN: ['BIRCH_GREEN', 'BIRCH_GREEN', 'BIRCH_AUTUMN', 'BIRCH_WINTER'],
    BIRCH_AUTUMN: ['BIRCH_GREEN', 'BIRCH_GREEN', 'BIRCH_AUTUMN', 'BIRCH_WINTER'],
    BIRCH_WINTER: ['BIRCH_GREEN', 'BIRCH_GREEN', 'BIRCH_AUTUMN', 'BIRCH_WINTER'],
    PINE: ['PINE', 'PINE', 'PINE', 'SNOW_PINE'],
    ASIAN_PINE: ['ASIAN_PINE', 'ASIAN_PINE', 'ASIAN_PINE', 'SNOW_PINE'],
    ITALIAN_PINE: ['ITALIAN_PINE', 'ITALIAN_PINE', 'ITALIAN_PINE', 'ITALIAN_PINE'],
    CYPRESS: ['CYPRESS', 'CYPRESS', 'CYPRESS_DEC', 'CYPRESS_DEC'],
    ASIAN_MAPLE_GREEN: ['ASIAN_MAPLE_GREEN', 'ASIAN_MAPLE_GREEN', 'ASIAN_MAPLE_AUTUMN', 'ASIAN_MAPLE_AUTUMN'],
    MONKEY_PUZZLE: ['MONKEY_PUZZLE', 'MONKEY_PUZZLE', 'MONKEY_PUZZLE', 'MONKEY_PUZZLE'],
};

/** 冬季积雪地面才有「挂雪树」；非积雪地面把 SNOW_* 换回同族无雪形态 */
const SNOW_TO_PLAIN: Readonly<Record<string, string>> = {
    SNOW_PINE: 'PINE',
    SNOW_AUTUMN_OAK: 'AUTUMN_OAK',
    SNOW_BIRCH: 'BIRCH_WINTER',
    SNOW_DEAD_TREE: 'DEAD_TREE',
    SNOW_SPRUCE: 'PINE',
};

/**
 * 按季节/地面积雪把一棵树换成对应形态（**只换形态，不换树种**）。
 * @param snowGround 脚下地面是否积雪（战术场景 = environmentPlan.baseTerrain 是雪地贴图）
 */
export function seasonalDeTree(asset: string, season: number, snowGround: boolean): string {
    const s: TreeSeason = (season === 0 || season === 1 || season === 2 || season === 3)
        ? season as TreeSeason
        : 1;
    // ① 非积雪地面：挂雪树一律换成同族无雪形态
    if (!snowGround && SNOW_TO_PLAIN[asset]) {
        const plain = SNOW_TO_PLAIN[asset];
        if (plain === 'AUTUMN_OAK' && (s === 0 || s === 1)) return s === 0 ? 'GREEN_OAK' : 'OAK';
        return plain;
    }
    // ② 积雪地面：冬季形态（栎=雪橡、桦=冬桦、松=雪松；棕榈/龙血树/竹等无雪形态）
    if (snowGround) {
        if (asset === 'OAK' || asset === 'GREEN_OAK' || asset === 'AUTUMN_OAK') return 'SNOW_AUTUMN_OAK';
        if (asset === 'BIRCH_GREEN' || asset === 'BIRCH_AUTUMN' || asset === 'BIRCH_WINTER') return 'BIRCH_WINTER';
        if (asset === 'PINE' || asset === 'ASIAN_PINE') return 'SNOW_PINE';
        return asset;
    }
    // ③ 按族换季
    const fam = SEASON_FAMILY[asset];
    if (fam) return fam[s];
    return asset;
}

/** 查该 DE 地形这一季该长的树（主导树种换季后）；没登记树返回 null */
export function deTerrainSeasonalTree(terrainId: number, season: number, snowGround: boolean): string | null {
    const asset = deTerrainTreeAsset(terrainId);
    return asset ? seasonalDeTree(asset, season, snowGround) : null;
}
