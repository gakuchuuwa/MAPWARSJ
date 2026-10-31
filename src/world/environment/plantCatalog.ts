/**
 * 植物总表：自然轴「内容层」（口径见 docs/AGENTS/environment-architecture.md）。
 *
 * 🔴 2026-10-31 主人令「让植被符合区域，战略和战术保持一致」：
 *    实测 1175 个据点里 550 个战略图与战术战场主树种不同，战场图还有阿斯旺长桦树、开普敦长意大利松这类张冠李戴。
 *    现在每个环境区只在这里写一组树种：
 *      · 主树种（带权重）：战略植被层从这里挑；战术战场遇到不合区域的树，也换成这里的；
 *      · 附带树种：海岸红树、荒漠枯树、也门龙血树之类，战场图里原有的保留，战略图不主动种。
 *    树种只看素材样子（public/SUCAI_NATURE/<名>/），季节换装、积雪换装仍由各层原有规则做。
 */
import { envZoneAt, type EnvZone } from './envZones';

interface ZonePlants {
    /** 主树种与权重 */
    main: readonly (readonly [string, number])[];
    /** 允许保留、但不主动种的附带树种 */
    extra?: readonly string[];
}

export const ZONE_PLANTS: Readonly<Record<EnvZone, ZonePlants>> = {
    TIB: { main: [['SPRUCE', 3], ['ASIAN_PINE', 2], ['CYPRESS', 2], ['BIRCH_GREEN', 1]], extra: ['DEAD_TREE'] },               // 云冷杉、高山松、藏柏、高山桦
    SWM: { main: [['ASIAN_PINE', 3], ['LUSH_BAMBOO', 2], ['GREEN_OAK', 1], ['ASIAN_MAPLE_GREEN', 1], ['SPRUCE', 1]], extra: ['BAMBOO'] }, // 云南松、竹、常绿栎
    SEA: { main: [['RAINFOREST', 3], ['JUNGLE', 2], ['LUSH_BAMBOO', 2], ['WAX_PALM', 1]], extra: ['MANGROVE', 'PALM', 'BAMBOO'] },
    SAS: { main: [['JUNGLE', 3], ['RAINFOREST', 1], ['BAMBOO', 1], ['WAX_PALM', 1], ['ACACIA', 1]], extra: ['MANGROVE', 'PALM'] },   // 季风林、竹、棕榈、德干金合欢
    EAS: { main: [['BAMBOO', 3], ['ASIAN_PINE', 2], ['ASIAN_MAPLE_GREEN', 2], ['GREEN_OAK', 2], ['PEACH_BLOSSOM', 1]], extra: ['LUSH_BAMBOO', 'MANGROVE', 'WILLOW'] }, // 竹、马尾松、枫香、常绿栎
    NCP: { main: [['OAK', 3], ['ASIAN_PINE', 2], ['WILLOW', 1], ['ASIAN_MAPLE_GREEN', 1], ['PEACH_BLOSSOM', 1], ['BIRCH_GREEN', 1]], extra: ['SCENARIO_TREE'] }, // 栎、油松、柳、槭
    LOE: { main: [['OAK', 2], ['ASIAN_PINE', 2], ['WILLOW', 1], ['BUSH_TREE_A', 1]], extra: ['DEAD_TREE', 'BIRCH_GREEN'] },       // 辽东栎、油松、河谷柳
    NEB: { main: [['BIRCH_GREEN', 2], ['ASIAN_PINE', 2], ['SPRUCE', 2], ['OAK', 2]], extra: ['PINE', 'WILLOW'] },               // 白桦、红松、云冷杉、蒙古栎
    STP: { main: [['BIRCH_GREEN', 2], ['PINE', 2], ['WILLOW', 1], ['BUSH_TREE_B', 1]], extra: ['DEAD_TREE', 'SPRUCE'] },        // 森林草原桦、松，河谷柳
    CAD: { main: [['WILLOW', 2], ['SPRUCE', 1], ['BUSH_TREE_A', 1], ['DEAD_TREE', 1]], extra: [] },                               // 胡杨柳（绿洲河谷）、天山云杉、梭梭（BUSH_TREE_C 为覆雪灌木，无雪灌木用 BUSH_TREE_A）
    WAH: { main: [['CYPRESS', 2], ['OAK', 2], ['PINE', 1], ['BUSH_TREE_A', 1]], extra: ['OLIVE', 'DEAD_TREE', 'PALM'] },          // 波斯柏、扎格罗斯栎
    HDS: { main: [['PALM', 3], ['ACACIA', 2], ['DEAD_TREE', 1]], extra: ['DRAGON_TREE', 'BUSH_TREE_A'] },                           // 枣椰、金合欢；也门龙血树
    MED: { main: [['OLIVE', 2], ['ITALIAN_PINE', 2], ['CYPRESS', 2], ['GREEN_OAK', 1]], extra: ['PALM', 'OAK', 'PINE'] },        // 橄榄、意大利松、柏、冬青栎
    WEU: { main: [['OAK', 3], ['SCENARIO_TREE_C', 2], ['BIRCH_GREEN', 1], ['PINE', 1]], extra: ['WILLOW', 'SCENARIO_TREE'] },
    CEU: { main: [['OAK', 2], ['BIRCH_GREEN', 2], ['PINE', 2], ['SPRUCE', 1], ['SCENARIO_TREE_E', 1]], extra: ['WILLOW', 'SCENARIO_TREE'] },
    ARC: { main: [['SPRUCE', 1], ['BIRCH_GREEN', 1]], extra: ['DEAD_TREE'] },
    SIB: { main: [['SPRUCE', 2], ['PINE', 2], ['BIRCH_GREEN', 2]], extra: [] },
    NAM: { main: [['OAK', 2], ['PINE', 2], ['SPRUCE', 1], ['BIRCH_GREEN', 1]], extra: ['CACTUS'] },
    NEO: { main: [['RAINFOREST', 2], ['JUNGLE', 2], ['BRAZILWOOD', 2], ['WAX_PALM', 1]], extra: ['MANGROVE', 'CACTUS', 'PALM', 'GREEN_OAK', 'PINE'] },   // PINE：墨西哥中部高原松栎林
    AND: { main: [['MONKEY_PUZZLE', 2], ['GREEN_OAK', 1], ['ACACIA', 1]], extra: ['CACTUS'] },                                    // 智利南洋杉、南青冈、智利刺槐
    AFR: { main: [['ACACIA', 3], ['BAOBAB', 2], ['JUNGLE', 1], ['PALM', 1]], extra: ['MANGROVE', 'RAINFOREST', 'DRAGON_TREE'] },
    AUS: { main: [['ACACIA', 2], ['BUSH_TREE_A', 1]], extra: ['PALM'] },
};

/** 树木「族」：季节 / 积雪变体与同类素材归一，判断某棵树属不属于本区时按族比 */
export function treeFamily(asset: string): string {
    if (asset.startsWith('SCENARIO_TREE')) return 'SCENARIO_TREE';
    switch (asset) {
        case 'GREEN_OAK': case 'AUTUMN_OAK': case 'SNOW_AUTUMN_OAK': return 'OAK';
        case 'BIRCH_AUTUMN': case 'BIRCH_WINTER': case 'SNOW_BIRCH': return 'BIRCH_GREEN';
        case 'ASIAN_MAPLE_AUTUMN': return 'ASIAN_MAPLE_GREEN';
        case 'SNOW_PINE': return 'PINE';
        case 'SPRUCE_SNOW': case 'SNOW_SPRUCE': return 'SPRUCE';
        case 'CYPRESS_DEC': return 'CYPRESS';
        case 'BUSH_TREE_B': case 'BUSH_TREE_C': return 'BUSH_TREE_A';
        default: return asset;
    }
}

const allowedCache = new Map<EnvZone, Set<string>>();
function allowedFamilies(zone: EnvZone): Set<string> {
    let set = allowedCache.get(zone);
    if (!set) {
        const z = ZONE_PLANTS[zone];
        set = new Set([...z.main.map(([a]) => treeFamily(a)), ...(z.extra ?? []).map(treeFamily)]);
        allowedCache.set(zone, set);
    }
    return set;
}

/** 按本区主树种权重挑一棵（roll01 ∈ [0,1)，同一个值得同一种） */
export function plantTreeAt(lat: number, lng: number, roll01: number): string {
    const main = ZONE_PLANTS[envZoneAt(lat, lng)].main;
    const total = main.reduce((s, [, w]) => s + w, 0);
    let r = roll01 * total;
    for (const [asset, w] of main) {
        if (r < w) return asset;
        r -= w;
    }
    return main[main.length - 1][0];
}

/** 这棵树合不合本区：主树种或附带树种的同族都算 */
export function plantAllowedAt(lat: number, lng: number, asset: string): boolean {
    return allowedFamilies(envZoneAt(lat, lng)).has(treeFamily(asset));
}

/** 战术战场用：合区域的树保留原样（含季节形态），不合的换成本区主树种 */
export function plantRegionalizeTree(lat: number, lng: number, asset: string, roll01: number): string {
    return plantAllowedAt(lat, lng, asset) ? asset : plantTreeAt(lat, lng, roll01);
}
