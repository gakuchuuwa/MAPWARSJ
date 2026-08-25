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
