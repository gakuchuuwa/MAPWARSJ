/**
 * 装饰素材该不该出现在这一战：季节 / 文化 / 人烟三道闸。
 *
 * 🔴 [2026-08-24 主人截图查出来的三条]
 *
 * 1. **季节** —— `DECAL_ICE` 是一块白蓝色的冰，却撒在非冬季的干草原上
 *    （主人截图里那些白色云朵斑块就是它）。根因：`BIOME_GROUND_DECOR`
 *    那张表不看季节，寒带/苔原的夏天照撒。
 *
 * 2. **文化** —— `GRAVES` 是西式墓碑（6 帧：石雕十字架 ×2 + 圆顶/方形石碑 ×4），
 *    原先分布在中东、蒙古、青藏、东非、西域，**全是非基督教区**，
 *    而欧洲三个主题一个都没有，完全搞反。
 *    中原用碑碣、蒙古是敖包、伊斯兰是简朴石板，形制都不同。
 *
 *    🔴 **文化专属素材绝不能挂在 DE 气候主题上。**
 *    把 GRAVES 挂到 `palaearctic_europe_mediterranean` 之后，
 *    **智利的图卡佩尔照样长出了十字架**——那个主题名字带 europe，
 *    实际是「地中海气候」，加州、南非、澳洲西南、智利中部全在内。
 *    气候主题管的是长什么草、什么树；文化物件只能按经纬度判。
 *
 * 3. **人烟** —— `RUGS`（卷起的红地毯）、`BARRELS`（木桶）是人类聚落物件，
 *    撒在无人荒野不合理。和「野战不出农田牧场」同一条逻辑。
 *
 * 验收：`npx tsx tools/audit-decor-fit.mts`
 */

/** 只能在真积雪（冬季且当地确实积雪）时出现 */
const WINTER_ONLY = new Set(['DECAL_ICE']);

/** 人类聚落物件：只在攻城战城郊出现，野战荒野没有 */
const SETTLEMENT_ONLY = new Set(['RUGS', 'BARRELS']);

/** 经纬度框 [南, 北, 西, 东] */
type Box = readonly [number, number, number, number];

/**
 * 文化专属素材 → 允许出现的经纬度框。
 * 不在框里就不撒。
 */
const CULTURE_ONLY: Readonly<Record<string, readonly Box[]>> = {
    // 西式墓碑：基督教文化区
    GRAVES: [
        [34, 72, -12, 46],   // 欧洲本土 + 拜占庭 + 高加索（亚美尼亚、格鲁吉亚是最早的基督教国家）
        [45, 72, 46, 62],    // 东正教俄罗斯，东到乌拉尔。纬度卡 45 是为了不圈进中亚穆斯林区
                             //（花剌子模 41°N、布哈拉 40°N 都在线下）
        [29, 38, 32, 42],    // 黎凡特 —— 十字军国家时期的基督教墓地（耶路撒冷、阿卡）
    ],
};

export interface DecorFitQuery {
    lat: number;
    lng: number;
    /** 0=春夏 1=秋 2=冬 */
    season: 0 | 1 | 2;
    /** 当地这个季节是否真的积雪（由 isSnowArea 判，别在这里重复估算） */
    winterSnow: boolean;
    isSiege: boolean;
}

/** 这个素材能不能出现在这一战。 */
export function decorFits(asset: string, q: DecorFitQuery): boolean {
    if (WINTER_ONLY.has(asset) && !(q.season === 2 && q.winterSnow)) return false;
    if (SETTLEMENT_ONLY.has(asset) && !q.isSiege) return false;
    const boxes = CULTURE_ONLY[asset];
    if (boxes && !boxes.some(([s, n, w, e]) =>
        q.lat >= s && q.lat <= n && q.lng >= w && q.lng <= e)) return false;
    return true;
}

/** 过滤一整个素材列表 */
export function filterDecor(assets: readonly string[], q: DecorFitQuery): string[] {
    return assets.filter((a) => decorFits(a, q));
}

/** 验收脚本用：把三张表暴露出去，保证工具和引擎同一份真相 */
export function decorFitTables(): {
    winterOnly: ReadonlySet<string>;
    settlementOnly: ReadonlySet<string>;
    cultureOnly: Readonly<Record<string, readonly Box[]>>;
} {
    return { winterOnly: WINTER_ONLY, settlementOnly: SETTLEMENT_ONLY, cultureOnly: CULTURE_ONLY };
}

// ── 底图 → 草 / 花 / 石 ─────────────────────────────────────────
//
// 🔴 [2026-08-24 照 DE 的 RMS 建表] DE 用 `terrain_to_place_on` 把装饰**绑定到地形**
//    （179 个 .rms 里用了 246 次 BASE_TERRAIN、92 次 MIDDLE_TERRAIN…），
//    而不是按气候 biome 挑。我们原先按 biome 挑，和「底图按真实气候查表」两套体系并行。
//    改成按底图，与 TreeAssignment 同构：**底图定基调**。
//
// DE 的六个槽位（见 Arabia.rms 的 #const 块），我们用其中三个：
//   AESTHETIC_SCATTER  → scatter：满地散布的草，全场**同一种**（DE 是一个 #const）
//   AESTHETIC_FLAT     → flat：成簇的花草，`group_placement_radius 3`
//   SOLID_OBJECT       → solid：主岩石，自带伴生碎石与灌木（DE 的 second_object + SOLID_SURROUND）
//
// 素材外观都是渲染出来逐个看过的，不是照名字猜：
//   GRASS_DRY=黄枯草丛(细竖)  GRASS_DRY_PATCH=黄枯草片  GRASS_GREEN=绿草丛  GRASS_GREEN_PATCH=绿草片
//   WEED=绿叶杂草  PLANT_DEAD=褐色枯枝  JUNGLE/RAINFOREST=一小撮热带草(很小)
//   ROCK1/2=灰岩块堆  ROCK3=橙褐扁平岩盘  ROCK_FORMATION2=层叠柱状风蚀岩
//   ROCK_LIMESTONE=灰白石灰岩  ROCK_JUNGLE=绿苔岩  ROCK_PILLAR=黑玄武岩柱  REEDS=黄芦苇

export interface GroundDecorSet {
    /** 满地散布的草（全场一种） */
    scatter: readonly string[];
    /** 成簇的花草 */
    flat: readonly string[];
    /** 主岩石 */
    solid: readonly string[];
}

const GROUND_DECOR_BY_BASE: Readonly<Record<string, GroundDecorSet>> = {
    // ── 极旱：枯草 + 风蚀橙岩 ──
    des:  { scatter: ['GRASS_DRY'], flat: ['PLANT_DEAD', 'CACTUS'], solid: ['ROCK3', 'ROCK_FORMATION2', 'ROCK_FORMATION3'] },
    pal:  { scatter: ['GRASS_DRY'], flat: ['PLANT_DEAD', 'CACTUS'], solid: ['ROCK3', 'ROCK_FORMATION1', 'ROCK_FORMATION2'] },
    qs:   { scatter: ['GRASS_DRY'], flat: ['PLANT_DEAD'], solid: ['ROCK3', 'ROCK_FORMATION2'] },
    pal1: { scatter: ['GRASS_DRY'], flat: ['PLANT_DEAD'], solid: ['ROCK_LIMESTONE', 'ROCK3'] },   // 盐壳：灰白石灰岩
    ds5:  { scatter: ['GRASS_DRY'], flat: ['PLANT_DEAD', 'WEED'], solid: ['ROCK3', 'ROCK_FORMATION1', 'ROCK_FORMATION3'] },

    // ── 草原：干草片 + 灰岩 ──
    gr5: { scatter: ['GRASS_DRY_PATCH'], flat: ['WEED', 'GRASS_DRY'], solid: ['ROCK1', 'ROCK2'] },
    gr7: { scatter: ['GRASS_DRY_PATCH'], flat: ['WEED', 'GRASS_DRY'], solid: ['ROCK1', 'ROCK2'] },
    gr3: { scatter: ['GRASS_DRY_PATCH'], flat: ['WEED', 'FLOWER'], solid: ['ROCK1', 'ROCK2'] },

    // ── 温带农耕 / 草地：绿草 + 花 + 灰岩 ──
    ds3: { scatter: ['GRASS_GREEN'], flat: ['FLOWER', 'WEED'], solid: ['ROCK1', 'ROCK2'] },
    ds4: { scatter: ['GRASS_GREEN'], flat: ['FLOWER', 'FLOWERBED'], solid: ['ROCK1', 'ROCK2'] },
    ds2: { scatter: ['GRASS_DRY'], flat: ['WEED', 'PLANT'], solid: ['ROCK1', 'ROCK3'] },          // 黄土：偏干
    gr2: { scatter: ['GRASS_GREEN'], flat: ['FLOWER_1', 'FLOWER_2'], solid: ['ROCK1', 'ROCK2'] },
    grs: { scatter: ['GRASS_GREEN_PATCH'], flat: ['FLOWER', 'FLOWERBED'], solid: ['ROCK1', 'ROCK2'] },
    gr4: { scatter: ['GRASS_GREEN_PATCH'], flat: ['FLOWER_3', 'WEED'], solid: ['ROCK1', 'ROCK2'] }, // 黑土/水稻土

    // ── 林地：林下灌丛 ──
    for:               { scatter: ['UNDERBRUSH'], flat: ['FERNPATCH', 'BUSH_GREEN'], solid: ['ROCK1', 'ROCK2'] },
    underbrush_leaves: { scatter: ['UNDERBRUSH'], flat: ['FERNPATCH', 'SHRUB_GREEN'], solid: ['ROCK1', 'ROCK2'] },
    fo2:               { scatter: ['UNDERBRUSH_RAINFOREST'], flat: ['PLANT_RAINFOREST', 'FERNPATCH'], solid: ['ROCK_JUNGLE', 'ROCK1'] },
    gr6:               { scatter: ['UNDERBRUSH_JUNGLE'], flat: ['PLANT_JUNGLE', 'JUNGLE'], solid: ['ROCK_JUNGLE', 'ROCK1'] },

    // ── 湿地：满地湿草 + 成簇芦苇睡莲 ──
    // 🔴 REEDS(芦苇)/WATER_LILY(睡莲) 是 world 层有高度的精灵，**不是地面贴花**，
    //    放 scatter 会被 GROUND_COVER_ASSETS 滤空、地面变光秃（实测过）。它们走 flat。
    qs2: { scatter: ['GRASS_GREEN_PATCH'], flat: ['REEDS', 'WATER_LILY'], solid: ['ROCK1', 'ROCK_JUNGLE'] },
    sh4: { scatter: ['GRASS_GREEN_PATCH'], flat: ['REEDS', 'WATER_LILY'], solid: ['ROCK1', 'ROCK2'] },

    // ── 高地裸岩 / 砾石 ──
    rck:            { scatter: ['GRASS_DRY'], flat: ['WEED', 'SHRUB_GREEN'], solid: ['ROCK_LIMESTONE', 'ROCK_PILLAR', 'ROCK1'] },
    gravel_default: { scatter: ['GRASS_DRY'], flat: ['WEED', 'PLANT'], solid: ['ROCK1', 'ROCK2', 'ROCK_LIMESTONE'] },

    // ── 雪 ──
    snd: { scatter: ['GRASS_DRY'], flat: ['PLANT_DEAD'], solid: ['ROCK1', 'ROCK2'] },
    sno: { scatter: ['GRASS_DRY'], flat: ['PLANT_DEAD'], solid: ['ROCK1', 'ROCK2'] },
    sn2: { scatter: ['GRASS_DRY'], flat: ['PLANT_DEAD'], solid: ['ROCK1'] },
    snf: { scatter: ['UNDERBRUSH'], flat: ['PLANT_DEAD', 'SHRUB_GREEN'], solid: ['ROCK1', 'ROCK2'] },
};

/** 兜底：查不到底图时按温带草地算 */
const FALLBACK_DECOR: GroundDecorSet = {
    scatter: ['GRASS_GREEN'], flat: ['FLOWER', 'WEED'], solid: ['ROCK1', 'ROCK2'],
};

/** 这张底图配什么草、什么花、什么石。 */
export function groundDecorFor(baseTile: string): GroundDecorSet {
    return GROUND_DECOR_BY_BASE[baseTile] ?? FALLBACK_DECOR;
}

/** 验收用 */
export function groundDecorTable(): Readonly<Record<string, GroundDecorSet>> {
    return GROUND_DECOR_BY_BASE;
}
