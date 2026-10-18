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
    // ── 极旱荒漠：DE dat 6/14/46 Plant Dead + Arabia.rms Dead Plant / Cactus / Boulder A/B ──
    des:  { scatter: ['GRASS_DRY'], flat: ['PLANT_DEAD', 'CACTUS'], solid: ['ROCK3', 'ROCK_FORMATION2', 'ROCK_FORMATION3'] },
    pal:  { scatter: ['GRASS_DRY'], flat: ['PLANT_DEAD', 'CACTUS'], solid: ['ROCK3', 'ROCK_FORMATION1', 'ROCK_FORMATION2'] },
    qs:   { scatter: ['GRASS_DRY'], flat: ['PLANT_DEAD'], solid: ['ROCK3', 'ROCK_FORMATION2'] },
    pal1: { scatter: ['GRASS_DRY'], flat: ['PLANT_DEAD'], solid: ['ROCK_LIMESTONE', 'ROCK3'] },   // 盐壳：灰白石灰岩
    ds5:  { scatter: ['GRASS_DRY'], flat: ['PLANT_DEAD', 'WEED'], solid: ['ROCK3', 'ROCK_FORMATION1', 'ROCK_FORMATION3'] },

    // ── 草原 / 半干草地：DE dat 9/41/100 Grass Dry(d=60~80) + Shrub / Flower / Bush ──
    gr5: { scatter: ['GRASS_DRY'], flat: ['PLANT_DEAD', 'SHRUB_GREEN', 'WEED'], solid: ['ROCK1', 'ROCK2', 'ROCK_FORMATION1'] },
    gr7: { scatter: ['GRASS_DRY'], flat: ['SHRUB_GREEN', 'FLOWER', 'BUSH_GREEN'], solid: ['ROCK1', 'ROCK2'] },
    gr3: { scatter: ['GRASS_DRY'], flat: ['SHRUB_GREEN', 'FLOWER', 'WEED'], solid: ['ROCK1', 'ROCK2'] },

    // ── 温带泥地 / 草地 / 红土：DE dat 0/3/12/42 Grass Green / Grass Dry + Bush / Shrub / Weed / Flower ──
    ds3: { scatter: ['GRASS_GREEN', 'GRASS_DRY'], flat: ['BUSH_GREEN', 'FLOWER', 'SHRUB_GREEN'], solid: ['ROCK1', 'ROCK2'] },
    ds4: { scatter: ['GRASS_DRY'], flat: ['SHRUB_GREEN', 'FLOWER', 'PLANT_DEAD'], solid: ['ROCK1', 'ROCK2'] },
    ds2: { scatter: ['GRASS_DRY'], flat: ['WEED', 'PLANT', 'SHRUB_GREEN'], solid: ['ROCK1', 'ROCK3'] },
    gr2: { scatter: ['GRASS_GREEN'], flat: ['FLOWER', 'BUSH_GREEN', 'SHRUB_GREEN', 'WEED'], solid: ['ROCK1', 'ROCK2'] },
    grs: { scatter: ['GRASS_GREEN'], flat: ['FLOWER', 'SHRUB_GREEN', 'WEED'], solid: ['ROCK1', 'ROCK2'] },
    gr4: { scatter: ['GRASS_GREEN'], flat: ['SHRUB_GREEN', 'FLOWER', 'WEED'], solid: ['ROCK1', 'ROCK2'] },

    // ── 林地与热带丛林：DE dat 60/83 Grass Green(d=60) + PLANT_JUNGLE / PLANT_RAINFOREST / UNDERBRUSH ──
    for:               { scatter: ['GRASS_GREEN'], flat: ['UNDERBRUSH', 'FERNPATCH', 'BUSH_GREEN'], solid: ['ROCK1', 'ROCK2'] },
    underbrush_leaves: { scatter: ['GRASS_GREEN'], flat: ['UNDERBRUSH', 'FERNPATCH', 'SHRUB_GREEN'], solid: ['ROCK1', 'ROCK2'] },
    fo2:               { scatter: ['GRASS_GREEN'], flat: ['PLANT_RAINFOREST', 'UNDERBRUSH_RAINFOREST', 'FERNPATCH'], solid: ['ROCK_JUNGLE', 'ROCK1'] },
    gr6:               { scatter: ['GRASS_GREEN'], flat: ['PLANT_JUNGLE', 'UNDERBRUSH_JUNGLE', 'SHRUB_GREEN'], solid: ['ROCK_JUNGLE', 'ROCK1'] },

    // ── 湿地陆岸（WATER_LILY / REEDS 仅限水体内部，陆岸用湿草与蕨丛灌木，杜绝睡莲长在旱地上） ──
    qs2: { scatter: ['GRASS_GREEN'], flat: ['WEED', 'FERNPATCH', 'SHRUB_GREEN'], solid: ['ROCK1', 'ROCK_JUNGLE'] },
    sh4: { scatter: ['GRASS_GREEN'], flat: ['WEED', 'SHRUB_GREEN', 'FERNPATCH'], solid: ['ROCK1', 'ROCK2'] },

    // ── 高地裸岩 / 砾石 ──
    rck:            { scatter: ['GRASS_DRY'], flat: ['WEED', 'SHRUB_GREEN'], solid: ['ROCK_LIMESTONE', 'ROCK_PILLAR', 'ROCK1'] },
    gravel_default: { scatter: ['GRASS_DRY'], flat: ['WEED', 'PLANT'], solid: ['ROCK1', 'ROCK2', 'ROCK_LIMESTONE'] },

    // ── 雪 ──
    snd: { scatter: ['GRASS_DRY'], flat: ['PLANT_DEAD'], solid: ['ROCK1', 'ROCK2'] },
    sno: { scatter: ['GRASS_DRY'], flat: ['PLANT_DEAD'], solid: ['ROCK1', 'ROCK2'] },
    sn2: { scatter: ['GRASS_DRY'], flat: ['PLANT_DEAD'], solid: ['ROCK1'] },
    snf: { scatter: ['GRASS_DRY'], flat: ['PLANT_DEAD', 'SHRUB_GREEN'], solid: ['ROCK1', 'ROCK2'] },
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

// ── 底图 → 地表变体（同色系深浅）────────────────────────────────
//
// 🔴 [2026-08-24 主人拿 DE 真图对比：「图1 是你画的，图2 是 DE 的」]
//    DE 的地面变化是**同色系、低对比、边界看不出**（浅黄绿铺在绿草上）；
//    我们是**深褐斑铺在浅黄底上**，一眼就是几块补丁。
//
//    实测：149 种「底图×变体」组合里 **63 种 RGB 色差 >45**，最夸张
//    `pal → sr2` 色差 132、`ds2 → gr4`（黄土上铺黑土）色差 78 共 698 格。
//    根因是变体贴图取自 DE **主题**表（theme.groundTiles），和底图不同源。
//
//    这张表是**按贴图平均色算出来的**：每张底图取色差最小的那几张，
//    目标色差 ≤30。括号里是实测色差。
//
// 🔴 候选池只放外观确认过的贴图。fm2/o_rd3/rm2/gr8 这些没看过的一律不用。
// 🔴 pm1/pm2（牧场）不进这张表——它们只在攻城战出现，走另一条线。
// 🔴 雪地（snd/sno/sn2/snf）不在这里：DE 冬季地面就是「雪 + 露土枯草斑块」，
//    那个高对比是**有意的**，由 buildGroundVariation 的 isWinterSnow 分支单独管。

const GROUND_VARIATION_BY_BASE: Readonly<Record<string, readonly string[]>> = {
    des:               ['pal1', 'gr5', 'ds2'],          // DE PH_AFRICAN / AFROTROPICAL: Dirt(6) + Cracked(45) + Savannah(41) + Dirt2(11)
    ds2:               ['pal1', 'gr5', 'des'],          // DE PALAEARCTIC_MIDDLE_EAST_DESERT: Dirt2(11) + Cracked(45) + Savannah(41) + Dirt(6)
    ds3:               ['gr7', 'gr3', 'ds4', 'pc1'],    // DE NEARCTIC / PH_MEDISOUTH: Dirt3(3) + DryGrass(100) + Grass3(9) + Dirt4(42)
    ds4:               ['gr5', 'ds3', 'des', 'pc1'],    // DE PH_AFRICAN / PH_DESERT: Dirt4(42) + Savannah(41) + Dirt3(3) + Dirt(6)
    ds5:               ['gravel_default', 'rck'],       // DE Gravel(102) + GravelDefault(70) + Rock(40)
    gr2:               ['grs', 'gr3'],                  // DE PALAEARCTIC_EUROPE_TEMPERATE: Grass2(12) + Grass(0) + Grass3(9)
    gr3:               ['grs', 'gr7', 'ds3', 'pc3'],    // DE PALAEARCTIC_EUROPE_MEDITERRANEAN / PH_ALPINE: Grass3(9) + Grass(0) + DryGrass(100) + Dirt3(3)
    gr4:               ['gr3', 'pc3', 'pc2'],           // DE PH_SPRING / ASIA_TEMPERATE: DirtMud(76) + Grass3(9) + Pasture
    gr5:               ['des', 'pal1', 'ds4'],          // DE PH_AFRICAN: Savannah(41) + Dirt(6) + Cracked(45) + Dirt4(42)
    gr6:               ['fo2', 'gr3', 'gr2', 'grs'],    // DE NEOTROPICAL_TROPICAL / PH_TROPHICAL: JungleGrass(60) + LeavesJungle(77) + Grass3(9) + Grass2(12)
    gr7:               ['gr3', 'ds3', 'pc2', 'pc1'],    // DE ASIA_TEMPERATE / PH_AUTUMN / PH_MEDISOUTH: DryGrass(100) + Grass3(9) + Dirt3(3)
    grs:               ['gr2', 'gr3'],                  // DE PH_SPRING: Grass(0) + Grass2(12) + Grass3(9)
    for:               ['underbrush_leaves', 'gr3', 'pc3'], // DE Underbrush(5) + UnderbrushLeaves(71) + Grass3(9)
    fo2:               ['gr6', 'for', 'gr4'],           // DE PH_TROPHICALSOUTH/EAST: LeavesJungle(77) + JungleGrass(60) + Underbrush(5) + DirtMud(76)
    underbrush_leaves: ['for', 'gr3', 'pc3'],           // DE UnderbrushLeaves(71) + Underbrush(5) + Grass3(9)
    pal:               ['qs', 'pal1', 'ds2'],           // DE MIDDLE_EAST_DESERT: Desert(14) + Quicksand(46) + Cracked(45) + Dirt2(11)
    pal1:              ['ds2', 'des', 'gr5'],           // DE PH_AFRICAN_B: Cracked(45) + Dirt2(11) + Dirt(6) + Savannah(41)
    qs:                ['pal', 'pal1', 'ds2'],          // DE Quicksand(46) + Desert(14) + Cracked(45) + Dirt2(11)
    qs2:               ['sh4', 'gr3', 'grs'],           // DE Bogland/Swamp: DirtMudQuicksand(79) + ShallowsSwamp(59) + Grass3(9)
    sh4:               ['qs2', 'gr4'],                  // DE ShallowsSwamp(59) + DirtMudQuicksand(79) + DirtMud(76)
    rck:               ['gravel_default', 'ds5'],       // DE Rock(40) + GravelDefault(70) + DesertGravel(102)
    gravel_default:    ['rck', 'ds5'],                  // DE GravelDefault(70) + Rock(40) + DesertGravel(102)

    // ── 雪地（保持纯雪/冰系双变体，确保 dry 与 dirt 不重复且不产生橙色泥点） ──
    snd:               ['sn2', 'sno'],
    sno:               ['sn2', 'ic3'],
    sn2:               ['sno', 'ic3'],
    snf:               ['sn2', 'sno'],
    ic3:               ['sno', 'sn2'],
    ice:               ['sn2', 'sno'],
    pm1:               ['pc2', 'pc3'],
    pm2:               ['gravel_default', 'ds5'],
};

/** 这张底图的地表变体（同色系）。查不到返回空数组 = 不铺变体。 */
export function groundVariationFor(baseTile: string): readonly string[] {
    return GROUND_VARIATION_BY_BASE[baseTile] ?? [];
}

/** 验收用 */
export function groundVariationTable(): Readonly<Record<string, readonly string[]>> {
    return GROUND_VARIATION_BY_BASE;
}

// ── 素材占地（格）与目标覆盖率 ─────────────────────────────────
//
// 🔴 [2026-08-24 主人：「这个有必要这么多草吗？素材的配比现在完全是按 DE 的比例
//    进行的分配吗？全面检查」]
//
//    此前只核对**数量**（石头 DE 6.9 → 我们 9.8），没核对**单体尺寸**。
//    实测才发现差得离谱（一格 = 64×32 px）：
//      GRASS_GREEN_PATCH 320×192 = **30 格** ×59 个 → 铺满 85%
//      UNDERBRUSH_JUNGLE 156×96  = 7.3 格 ×59 个 → 21%（主人看到的丛林满屏就是它）
//      FLOWER_1          580×200 = **57 格**
//      GRASS_GREEN       108×60  = 3.2 格
//
//    **覆盖面积 = 单体尺寸 × 数量。** 写死数量必然翻车：
//    换个素材覆盖率就差十倍。改成按**目标覆盖率反推数量**。
//
// 数字是 `_meta.json` 的 box_w × box_h ÷ (64×32) 实测的，不是估的。

const ASSET_TILES: Readonly<Record<string, number>> = {
    // 大件（当满地散布会糊屏）
    FLOWER_1: 56.6, JUNGLE: 38.3, FLOWER_2: 30.6, GRASS_DRY_PATCH: 30.0,
    GRASS_GREEN_PATCH: 30.0, FLOWER_3: 28.4, FERNPATCH: 20.5, FLOWERBED: 11.1,
    // 中件
    REEDS: 7.6, UNDERBRUSH_JUNGLE: 7.3, UNDERBRUSH_RAINFOREST: 6.7, UNDERBRUSH: 6.4,
    PLANT_RAINFOREST: 4.7, PLANT_JUNGLE: 4.5, WEED: 4.0,
    // 小件
    FLOWER: 3.3, GRASS_DRY: 3.2, GRASS_GREEN: 3.2, BUSH_GREEN: 3.0,
    SHRUB_GREEN: 2.9, CACTUS: 2.2, WATER_LILY: 1.3, PLANT_DEAD: 1.0, PLANT: 0.9,
    // 岩石（solid 走自己的数量控制，这里只为验收统计）
    ROCK_PILLAR: 70.5, ROCK_FORMATION3: 38.2, ROCK_JUNGLE: 14.6, ROCK_FORMATION2: 12.4,
    ROCK1: 11.3, ROCK2: 7.6, ROCK_FORMATION1: 7.5, ROCK_LIMESTONE: 5.4, ROCK3: 4.9,
};

/** 这个素材占几格。没登记的按 3 格算（小件的量级）。 */
export function assetTiles(asset: string): number {
    return ASSET_TILES[asset] ?? 3;
}

/**
 * 目标覆盖率（占屏内可见格）。
 * 🔴 主人两次说草太多（先是 90~120 个，再是丛林满屏），所以取得保守。
 *    满地散布 6% + 成簇点缀 3% ≈ 地面能看出植被但不糊屏。
 */
export const SCATTER_COVER = 0.06;
export const FLAT_COVER = 0.03;

/** 按目标覆盖率反推该撒几个。素材越大放得越少。 */
export function countForCover(asset: string, usableTiles: number, cover: number): number {
    const per = assetTiles(asset);
    // 🔴 下限只能是 1：`FLOWER_1` 一个就占 57 格，强制 2 个 = 5.4% 覆盖，
    //    gr2 因此卡在 16.1% 超上限。大件素材放一个就够。
    return Math.max(1, Math.round(usableTiles * cover / per));
}

/** 验收用 */
export function assetTilesTable(): Readonly<Record<string, number>> {
    return ASSET_TILES;
}
