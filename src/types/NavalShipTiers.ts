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
    MERCHANT_SHIP: 144,
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
 * 文化圈 → 代表战舰。每条都写清史实依据；严禁使用无帆残骸/空壳船（如 HULK/CARRACK/GALLEON/WAR_HULK）。
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
    { ship: 'THIRISADAI', why: 'DE 南印度专属多桅巨舰：朱罗王朝远征南洋', regions: ['INDIA', 'PURU', 'BENGALIS', 'GURJARAS'] },
    { ship: 'FAST_FIRE_SHIP', why: '马六甲海峡快速突击船', regions: ['MALAY'] },
    { ship: 'INCENDIARY_SHIP', why: '红河/白藤江火攻船', regions: ['VIETNAMESE', 'KHMER'] },
    { ship: 'HEAVY_INCENDIARY_SHIP', why: '伊洛瓦底江重型内河战船', regions: ['BURMESE'] },

    // ── 地中海古典 ──────────────────────────────────────────
    { ship: 'TRIREME', why: '三列桨座战船：萨拉米斯海战的希腊主力', regions: ['GREEK'] },
    { ship: 'TRIREME', why: '三列桨座主力战舰：迦太基西地中海海上霸权核心主力（第一次布匿战争埃加迪群岛海战形制）', regions: ['CARTHAGE'] },
    { ship: 'TRIREME', why: '三列桨座主力战舰与乌鸦吊桥战船：罗马帝国地中海霸权主力（布匿战争与阿克提姆海战形制，地中海成为帝国“内湖”）', regions: ['LATIN'] },
    { ship: 'WAR_LEMBOS', why: '伦博斯突击舰：马其顿-伊利里亚海军主力（腓力五世大量装备）', regions: ['GREEK'] },
    { ship: 'BIREME', why: '双列桨战船：阿契美尼德海军由腓尼基人操舟（萨拉米斯海战大舰队主力）', regions: ['ACHAEMENIDS', 'PERSIAN'] },
    { ship: 'BIREME', why: '两河流域双列桨战船：辛那赫里布与尼布甲尼撒招募腓尼基工匠在幼发拉底河打造的战舰（波斯湾远征主力）', regions: ['BABYLON'] },
    { ship: 'MONOREME', why: '新王国单列桨帆战船：拉美西斯三世三角洲海战大破海上民族（麦地那哈布浮雕所绘船形）', regions: ['EGYPT'] },
    { ship: 'MONOREME', why: '青铜时代单列桨战船：赫梯苏庇路里乌玛二世征调安纳托利亚/奇里乞亚舰队，在塞浦路斯近海进行人类有文字记载的最早海战', regions: ['HITTITES'] },
    { ship: 'HEAVY_LEMBOS', why: '重型伦博斯：哥特/汪达尔渡海劫掠地中海', regions: ['GOTHS'] },
    { ship: 'LEMBOS', why: '轻型伦博斯：黑海-多瑙河沿岸快船', regions: ['THRACIAN', 'BULGARIANS', 'WALLACHIA'] },

    // ── 拜占庭 / 东欧 ───────────────────────────────────────
    { ship: 'DROMON', why: 'DE 拜占庭专属德罗蒙：希腊火战舰', regions: ['EAST', 'ARMENIANS', 'GEORGIANS'] },
    { ship: 'MONOREME', why: '罗斯独木船队（monoxyla）：第聂伯河下黑海', regions: ['SLAVIC'] },

    // ── 北欧 / 西欧 / 中欧 / 意大利 ───────────────────────────
    { ship: 'LONGBOAT', why: 'DE 维京专属长船：龙首、可抢滩', regions: ['VIKINGS'] },
    { ship: 'ELITE_LONGBOAT', why: '盖尔长船与大洋战舟（birlinn/currach）：不列颠-爱尔兰海凯尔特传统航海长船，兼顾抢滩与远洋', regions: ['CELTS'] },
    { ship: 'ELITE_CARAVEL', why: '无敌舰队精锐/意大利远洋大帆船：威尼斯/热那亚/西班牙远洋霸权', regions: ['SPANISH', 'ITALIANS'] },
    { ship: 'CARAVEL', why: '卡拉维尔/西欧风帆战舰：英吉利/北海/大西洋十字纹大风帆主力', regions: ['BRITONS', 'GERMANIC', 'BURGUNDIANS', 'POLES', 'LITHUANIANS', 'PORTUGUESE', 'TEUTONS'] },
    { ship: 'WAR_GALLEY', why: '地中海桨帆战船：诺曼西西里海军', regions: ['SICILIANS'] },

    // ── 中东 / 北非 ─────────────────────────────────────────
    { ship: 'FIRE_GALLEY', why: '黎凡特-红海火攻快船', regions: ['WEST_ASIA', 'ETHIOPIANS'] },
    { ship: 'FIRE_SHIP', why: '阿拉伯突击火船：地中海/红海', regions: ['ORIE'] },
    { ship: 'WAR_GALLEY', why: '巴巴里桨帆战船：马格里布海岸', regions: ['BERBER'] },
    { ship: 'WAR_GALLEY', why: '波斯湾桨帆战船：萨珊海军', regions: ['SASANIAN'] },

    // ── 美洲 ────────────────────────────────────────────────
    { ship: 'CANOE', why: '武装独木战舟：特斯科科湖水战与玛雅佩滕-乌苏马辛塔河雨林战船（美洲无风帆远洋船形制）', regions: ['AMERICA', 'ANDE', 'MAYANS', 'MAPUCHE', 'MUISCA', 'TUPI'] },

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

/**
 * 势力级船型覆盖（2026-09-01 修「舰队模型错」）：文化区映射会误伤同区其他势力
 * （如 LATIN 区另有法兰克/意大利城邦、AMERICA 区另有美洲原住民），这里按省份精确指定，
 * 优先级最高，不动文化区表。素材都已提取（16 向齐全），改映射即生效。
 */
const FACTION_NAVAL_SHIP_OVERRIDE: Record<string, NavalShipAssetId> = {
    luoma_diguo: 'WAR_GALLEY',     // 罗马帝国：地中海桨帆战船
    naxos_ancient: 'TRIREME',      // 纳克索斯：希腊三列桨
    jialebi: 'ELITE_CARAVEL',      // 卡塔赫纳：西班牙珍宝船队要塞，应西班牙精锐卡拉维尔
    foluolida: 'ELITE_CARAVEL',    // 佛罗里达·圣奥古斯丁：梅嫩德斯·西班牙海军上将，应西班牙精锐卡拉维尔
    xiyindu: 'ELITE_CARAVEL',      // 西印度·圣多明各：哥伦布殖民总督要塞，应西班牙精锐卡拉维尔
    xingelana: 'ELITE_CARAVEL',    // 新格拉纳达·巴拿马：卡斯蒂利亚殖民总督要塞，应西班牙精锐卡拉维尔
    baiyiya: 'CARAVEL',            // 巴西·萨尔瓦多：葡属巴西都督府，军团「索萨远征队」= 葡王室远征队，应葡萄牙卡拉维尔
    yinggelan: 'CARAVEL',          // 英格兰·亨利五世：英格兰正规风帆战舰
    kanpaniya: 'WAR_GALLEY',       // 那不勒斯·安茹：地中海桨帆战船
    osman: 'WAR_GALLEY',           // 奥斯曼·穆罕默德二世：15世纪地中海桨帆舰队
};

export function getCultureNavalShip(region?: string | null, factionId?: string | null): NavalShipAssetId {
    if (factionId && FACTION_NAVAL_SHIP_OVERRIDE[factionId]) return FACTION_NAVAL_SHIP_OVERRIDE[factionId];
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

/**
 * ═══ 战船武器：先照史实，再照 DE 本体 ═══════════════════════════════
 *
 * 🔴 [2026-09-02 主人裁决] 判据只有两条，顺序不能反：**首先符合历史**，然后参考 DE 怎么做。
 *
 * 每条都注明依据。DE 依据取自本体单位说明原文
 * （`resources/en/strings/key-value/key-value-strings-utf8.txt`，2026-09-02 实读），
 * 不是转述、不是记忆。DE 本体里**唯一**被标 "Gunpowder" 的战船是加农炮舰，
 * 也**只有**它有炮口焰素材（`MUZZLE_CANNONGALLEON`，16 向）。
 *
 * ⚠️ 已作废的写法（2026-09-02 撤销，勿再写回来）：曾有一张 `isNavalCannonCapable`
 *    的布尔清单，把楼船和德罗蒙判成「重炮」—— 汉代楼船没有火炮，拜占庭德罗蒙用的是
 *    希腊火虹吸喷管也不是炮；那张表里还有 8 项船号在本作根本取不到（CARRACK/GALLEON
 *    等，本文件开头明令严禁使用）。
 */
export type NavalWeapon =
    /** 火炮：炮口焰 + 炮声 + 炮弹落水水花 */
    | 'cannon'
    /** 希腊火 / 喷火：火焰弹，无炮声 */
    | 'greekfire'
    /** 投石/抛石重器：石弹 + 落水水花，无炮声 */
    | 'trebuchet'
    /** 弓弩箭雨：所有战船的基础火力（甲板上永远有弓手） */
    | 'arrow'
    /** 撞角冲撞 / 接舷 / 自爆：近战，不产生投射物 */
    | 'ram';

/**
 * 船号 → 除箭之外的武器。箭是所有船的基础层，不写进表里。
 * 表里没有的船 = 只有箭（兜底 WAR_GALLEY 正是这一类）。
 */
const SHIP_EXTRA_WEAPONS: Record<string, { weapons: NavalWeapon[]; why: string }> = {
    // ── 火炮 ────────────────────────────────────────────────
    CANNON_GALLEON: { weapons: ['cannon'], why: 'DE 原文 "Siege Gunpowder Warship"：本体唯一标火药的战船' },
    ELITE_CANNON_GALLEON: { weapons: ['cannon'], why: '同上（精锐级）' },
    CARAVEL: { weapons: ['cannon'], why: '史实 15-16 世纪卡拉维尔/大帆船装舷炮；DE 原文 "ranged pass through attack"' },
    ELITE_CARAVEL: { weapons: ['cannon'], why: '同上（精锐级）' },
    TURTLE_SHIP: { weapons: ['cannon'], why: '史实 1592 李舜臣龟船装天/地/玄/黄字铳筒；DE 原文 "Siege Warship"' },
    ELITE_TURTLE_SHIP: { weapons: ['cannon'], why: '同上（精锐级）' },

    // ── 希腊火 / 喷火 ────────────────────────────────────────
    DROMON: { weapons: ['greekfire'], why: '史实拜占庭德罗蒙用希腊火虹吸喷管（不是炮）；DE 原文 "long range blast attack"' },
    FIRE_GALLEY: { weapons: ['greekfire'], why: 'DE 原文 "spews fire at close range"' },
    FIRE_SHIP: { weapons: ['greekfire'], why: 'DE 原文 "spews fire at close range"' },
    FAST_FIRE_SHIP: { weapons: ['greekfire'], why: 'DE 原文 "spews fire at close range"' },
    DRAGON_SHIP: { weapons: ['greekfire'], why: 'DE 原文 "Chinese unique Warship that spews fire at close range"' },

    // ── 投石重器 ────────────────────────────────────────────
    LOU_CHUAN: { weapons: ['trebuchet'], why: 'DE 原文 "fires arrows at units and uses a long range trebuchet weapon against buildings"：汉代楼船是箭 + 牵引抛石机，没有火炮' },
    CATAPULT_GALLEON: { weapons: ['trebuchet'], why: 'DE 原文 "Anti-building Siege Warship with long range"' },
    CATAPULT_SHIP: { weapons: ['trebuchet'], why: '同抛石舰一类' },
    ONAGER_SHIP: { weapons: ['trebuchet'], why: 'DE 原文 "Siege Warship with ranged blast attack"' },

    // ── 撞角 / 接舷 / 自爆（近战，甲板弓手仍照常放箭）──────────
    TRIREME: { weapons: ['ram'], why: 'DE 原文 "Melee Warship powerful charged attack"：古典三列桨靠撞角' },
    BIREME: { weapons: ['ram'], why: '同上（双列桨）' },
    MONOREME: { weapons: ['ram'], why: '同上（单列桨）' },
    LEMBOS: { weapons: ['ram'], why: 'DE 原文 "Light scouting Warship with weak melee attack"' },
    WAR_LEMBOS: { weapons: ['ram'], why: '同上' },
    HEAVY_LEMBOS: { weapons: ['ram'], why: '同上' },
    ELITE_LEMBOS: { weapons: ['ram'], why: '同上' },
    HULK: { weapons: ['ram'], why: 'DE 原文 "close range melee attack"' },
    WAR_HULK: { weapons: ['ram'], why: '同上' },
    CARRACK: { weapons: ['ram'], why: '同上' },
    DEMO_RAFT: { weapons: ['ram'], why: 'DE 原文 "armed with explosives that self-destructs"：渡河筏，没有远程重器' },
    DEMO_SHIP: { weapons: ['ram'], why: '同上' },
    HEAVY_DEMO_SHIP: { weapons: ['ram'], why: '同上' },
    INCENDIARY_RAFT: { weapons: ['ram', 'greekfire'], why: 'DE 原文 "Burning Demolition Warship that self-destructs"：火攻船，带火' },
    INCENDIARY_SHIP: { weapons: ['ram', 'greekfire'], why: '同上' },
    HEAVY_INCENDIARY_SHIP: { weapons: ['ram', 'greekfire'], why: '同上' },
};

/**
 * 势力级武器覆盖：同一船号在不同年代不是同一回事，用势力精确修。优先级高于船表。
 */
const FACTION_NAVAL_WEAPON_OVERRIDE: Record<string, NavalWeapon[]> = {
    // 奥斯曼·穆罕默德二世（15 世纪）：加莱船首已架重炮，1453 年封锁博斯普鲁斯即用舰炮。
    // 船型仍是 WAR_GALLEY（史实就是加莱），但通用加莱的「只有箭」在这个年代不成立。
    osman: ['arrow', 'cannon'],
};

/**
 * 取一艘船的全部武器。箭是基础层，永远包含 —— 甲板上永远有弓手/标枪手，
 * 纯自爆船也一样（否则内陆势力的海战会一声不响，本作是观赏向直播）。
 */
export function getNavalWeapons(shipAssetId?: string | null, factionId?: string | null): NavalWeapon[] {
    if (factionId && FACTION_NAVAL_WEAPON_OVERRIDE[factionId]) {
        return FACTION_NAVAL_WEAPON_OVERRIDE[factionId];
    }
    const extra = shipAssetId ? SHIP_EXTRA_WEAPONS[shipAssetId]?.weapons : undefined;
    return extra ? ['arrow', ...extra] : ['arrow'];
}

/** 供验收脚本读的武器分配明细（船号 → 武器 + 依据） */
export function listNavalShipWeapons(): Record<string, { weapons: NavalWeapon[]; why: string }> {
    return SHIP_EXTRA_WEAPONS;
}
