/**
 * 文化战船：每个文化圈一种代表战舰，按**史实**定，不为用光素材硬凑。
 *
 * 🔴 [2026-09-01 主人裁决] 定这张表只问一句话：**这个文化历史上开什么船**。
 *    「素材利用率」不是目标 —— 同植被按优势种分配的规矩，允许有依据的素材闲置。
 *    没有航海传统的内陆文化（草原、青藏、西域、中亚）给最简陋的渡河筏，那正是史实。
 *
 * 舰队统一采用该文化的战舰（不混搭），船只数量按兵力分档（见 LegionPhalanxDrawer）。
 * 验收：`npm run naval:ship-audit`（区是否落空 / 素材是否存在 / 谁缺 death 帧）
 *      `npm run naval:sprite-audit`（素材帧数、遮罩、雪碧图宽度是否与 _meta.json 自洽）
 */

export type NavalShipAssetId = string;

/**
 * 各船「侧向（dir2）」帧宽，取自 `public/SUCAI/<船>/_meta.json` 的 `idle.dirs["2"].fw`。
 * 由 `npm run naval:ship-audit` 校验与素材一致，素材换了会报出来。
 */
const SHIP_SIDE_WIDTH: Record<string, number> = {
    ANT_ELITE_GALLEY: 212,
    ANT_GALLEY: 148,
    ANT_WAR_GALLEY: 196,
    BIREME: 164,
    CANNON_GALLEON: 176,
    CANOE: 124,
    CARAVEL: 204,
    CARRACK: 152,
    CATAPULT_GALLEON: 208,
    CATAPULT_SHIP: 268,
    DEMO_RAFT: 112,
    DEMO_SHIP: 144,
    DRAGON_SHIP: 264,
    DROMON: 200,
    ELITE_CANNON_GALLEON: 176,
    ELITE_CARAVEL: 208,
    ELITE_LEMBOS: 160,
    ELITE_LONGBOAT: 144,
    ELITE_TURTLE_SHIP: 292,
    FAST_FIRE_SHIP: 192,
    FIRE_GALLEY: 156,
    FIRE_SHIP: 188,
    GALLEON: 204,
    GALLEY: 128,
    HEAVY_DEMO_SHIP: 144,
    HEAVY_INCENDIARY_SHIP: 160,
    HEAVY_LEMBOS: 128,
    HULK: 128,
    INCENDIARY_RAFT: 104,
    INCENDIARY_SHIP: 156,
    LEMBOS: 100,
    LONGBOAT: 128,
    LOU_CHUAN: 260,
    MONOREME: 132,
    ONAGER_SHIP: 268,
    THIRISADAI: 320,
    TRIREME: 176,
    TURTLE_SHIP: 292,
    WAR_GALLEY: 192,
    WAR_HULK: 148,
    WAR_LEMBOS: 120,
};

/** 缩放基准：主人当初按楼船调出来的观感 */
const BASE_SHIP = 'LOU_CHUAN';
const BASE_SCALE = 0.38;
/**
 * 尺寸归一化强度 k ∈ [0,1]：0 = 完全按原始像素（差 3.2 倍），1 = 所有船屏幕一样大。
 * 🔴 [2026-09-01 修「很多船的模型有问题」] 原来 41 种船共用一个 0.38，而侧向帧宽
 *    从 LEMBOS 的 100px 到 THIRISADAI 的 320px 差 3.2 倍 —— 换上新船后有的小得像点、
 *    有的占掉一大片。k=0.7 把差异压到约 1.4 倍：既不再失衡，又保留「独木舟小、巨舰大」
 *    的次序和手感。要更整齐就调大，要更还原原始比例就调小。
 */
const SIZE_NORMALIZE_K = 0.7;

/** 按船型归一化后的绘制缩放：表里没有的船退回基准值。 */
export function getNavalShipDrawScale(shipId?: string): number {
    const w = shipId ? SHIP_SIDE_WIDTH[shipId] : undefined;
    if (!w) return BASE_SCALE;
    return BASE_SCALE * Math.pow(SHIP_SIDE_WIDTH[BASE_SHIP] / w, SIZE_NORMALIZE_K);
}

/**
 * 文化圈 → 代表战舰。每条都写清史实依据；拿不准的宁可给通用船，不硬安专属。
 * 顺序 = 查表顺序，命中即返回。
 */
const CULTURE_SHIP: Array<{ ship: string; why: string; regions: string[] }> = [
    // ── 东亚 ────────────────────────────────────────────────
    { ship: 'LOU_CHUAN', why: '中国楼船：高层甲板巨舰，赤壁/襄樊水战主力', regions: ['CENTRAL', 'NORTH', 'JIANGNAN', 'BASHU'] },
    { ship: 'DRAGON_SHIP', why: '龙首战船：岭南珠江/南海龙舟形制', regions: ['LINGNAN'] },
    { ship: 'INCENDIARY_SHIP', why: '火攻艨艟：西南内河（澜沧江/怒江）快船', regions: ['DIANQIAN'] },
    { ship: 'GALLEY', why: '金人水军小型战船：松花江/黑龙江水系', regions: ['NORTHEAST'] },
    { ship: 'TURTLE_SHIP', why: 'DE 朝鲜专属龟甲船：李舜臣铁甲冲撞舰', regions: ['KOREA'] },
    // DE 没有日本专属战船。安宅船是高舷箱型大舰，先用古代大型桨帆战船顶着（⚠️无 death 帧）
    { ship: 'ANT_WAR_GALLEY', why: '代安宅船：DE 无日本专属船，暂用大型桨帆战船', regions: ['JAPAN'] },

    // ── 南亚 / 东南亚 ───────────────────────────────────────
    { ship: 'THIRISADAI', why: 'DE 南印度专属多桅巨舰：朱罗王朝远征南洋', regions: ['INDIA', 'PURU', 'BENGALIS', 'GURJARAS', 'PORUS'] },
    { ship: 'FAST_FIRE_SHIP', why: '马六甲海峡快速突击船', regions: ['MALAY'] },
    { ship: 'INCENDIARY_SHIP', why: '红河/白藤江火攻船', regions: ['VIETNAMESE', 'KHMER'] },
    { ship: 'HEAVY_INCENDIARY_SHIP', why: '伊洛瓦底江重型内河战船', regions: ['BURMESE'] },

    // ── 地中海古典 ──────────────────────────────────────────
    { ship: 'TRIREME', why: '三列桨座战船：萨拉米斯海战的希腊主力', regions: ['GREEK', 'ATHENIANS', 'SPARTANS'] },
    { ship: 'WAR_LEMBOS', why: '伦博斯突击舰：马其顿-伊利里亚海军主力（腓力五世大量装备）', regions: ['MACEDONIANS'] },
    { ship: 'BIREME', why: '双列桨战船：阿契美尼德海军由腓尼基人操舟', regions: ['ACHAEMENIDS'] },
    { ship: 'HEAVY_LEMBOS', why: '重型伦博斯：哥特/汪达尔渡海劫掠地中海', regions: ['GOTHS'] },
    { ship: 'LEMBOS', why: '轻型伦博斯：黑海-多瑙河沿岸快船', regions: ['THRACIAN', 'BULGARIANS', 'WALLACHIA'] },

    // ── 拜占庭 / 东欧 ───────────────────────────────────────
    { ship: 'DROMON', why: 'DE 拜占庭专属德罗蒙：希腊火战舰', regions: ['EAST', 'ARMENIANS', 'GEORGIANS'] },
    { ship: 'MONOREME', why: '罗斯独木船队（monoxyla）：第聂伯河下黑海', regions: ['SLAVIC'] },

    // ── 北欧 / 西欧 / 中欧 ──────────────────────────────────
    { ship: 'LONGBOAT', why: 'DE 维京专属长船：龙首、可抢滩', regions: ['VIKINGS'] },
    { ship: 'ELITE_LONGBOAT', why: '盖尔长船（birlinn）：源自维京长船，爱尔兰海/苏格兰高地', regions: ['CELTS'] },
    { ship: 'WAR_HULK', why: '英王柯克战船：百年战争斯勒伊斯海战', regions: ['BRITONS'] },
    { ship: 'HULK', why: '柯克/大肚船：北海-波罗的海货战两用', regions: ['GERMANIC', 'LATIN', 'BURGUNDIANS', 'POLES', 'LITHUANIANS'] },
    { ship: 'CARRACK', why: '克拉克大帆船：汉萨同盟与北海武装商船', regions: ['TEUTONS'] },
    { ship: 'GALLEON', why: '威尼斯/热那亚远洋大帆船', regions: ['ITALIANS'] },
    { ship: 'WAR_GALLEY', why: '地中海桨帆战船：诺曼西西里海军', regions: ['SICILIANS'] },
    { ship: 'ELITE_CARAVEL', why: '无敌舰队精锐：勒班陀与新大陆征服', regions: ['SPANISH'] },
    { ship: 'CARAVEL', why: 'DE 葡萄牙专属卡拉维尔：迪亚士/达伽马开拓舰', regions: ['PORTUGUESE'] },

    // ── 中东 / 北非 ─────────────────────────────────────────
    { ship: 'FIRE_GALLEY', why: '黎凡特-红海火攻快船', regions: ['WEST_ASIA', 'ETHIOPIANS'] },
    { ship: 'FIRE_SHIP', why: '阿拉伯突击火船：地中海/红海', regions: ['ORIE'] },
    { ship: 'WAR_GALLEY', why: '巴巴里桨帆战船：马格里布海岸', regions: ['BERBER'] },
    { ship: 'WAR_GALLEY', why: '波斯湾桨帆战船：萨珊海军（火炮盖伦跨时代，不用）', regions: ['PERSIAN'] },

    // ── 美洲 ────────────────────────────────────────────────
    { ship: 'CANOE', why: '武装独木战舟：美洲无风帆远洋船，特斯科科湖水战形制', regions: ['AMERICA', 'ANDE', 'MAYANS', 'MAPUCHE', 'MUISCA', 'TUPI'] },

    // ── 内陆：没有航海传统，给渡河筏（史实如此，不硬凑战舰）──
    { ship: 'DEMO_RAFT', why: '渡河木筏：内陆游牧/高原/绿洲，历史上无海军', regions: ['STEPPE', 'HUNS', 'CUMAN', 'TIBET', 'WESTERN', 'CENTRAL_ASIA', 'HEXI', 'MAGYAR', 'BOHEMIANS', 'AFRICA'] },
];

/** 区 → 船的查找表（模块加载时摊平一次） */
const REGION_TO_SHIP = new Map<string, string>();
for (const row of CULTURE_SHIP) {
    for (const r of row.regions) if (!REGION_TO_SHIP.has(r)) REGION_TO_SHIP.set(r, row.ship);
}

import { CITIES_V2 } from '../data/cities_v2';
import { getCityRegion } from '../systems/RegionSystem';

const _factionRegionCache = new Map<string, string>();

export function getFactionCultureRegion(factionId: string): string | undefined {
    if (_factionRegionCache.has(factionId)) return _factionRegionCache.get(factionId) || undefined;
    const city = CITIES_V2.find((c) => c.factionId === factionId);
    if (!city) {
        _factionRegionCache.set(factionId, '');
        return undefined;
    }
    const region = city.region || getCityRegion({ latitude: city.lat, longitude: city.lng });
    _factionRegionCache.set(factionId, region);
    return region;
}

/** 兜底：区未登记时用通用桨帆战船（不是楼船 —— 别让欧洲势力默认开中国船） */
const FALLBACK_SHIP = 'WAR_GALLEY';

export function getCultureNavalShip(region?: string | null, factionId?: string | null): NavalShipAssetId {
    const resolvedRegion = region ?? (factionId ? getFactionCultureRegion(factionId) : null);
    if (!resolvedRegion) return FALLBACK_SHIP;
    return REGION_TO_SHIP.get(resolvedRegion.toUpperCase()) ?? FALLBACK_SHIP;
}

/** 供验收脚本读的分配明细（区 → 船 + 史实依据） */
export function listCultureNavalShips(): Array<{ ship: string; why: string; regions: string[] }> {
    return CULTURE_SHIP;
}

export function getNavalShipAssetId(
    _troops: number,
    region?: string | null,
    factionId?: string | null,
): NavalShipAssetId {
    return getCultureNavalShip(region, factionId);
}
