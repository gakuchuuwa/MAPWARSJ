import L from 'leaflet';
import { perfDoctor } from '../debug/PerfDoctor';
import type { GameMap } from './GameMap';
import { CITIES_V2, type BuildingStyle } from '../data/cities_v2';
import { getRegion } from '../systems/RegionSystem';
import { LandSeaSystem } from '../world/land-sea';
import { roadRegistry } from '../roads/RoadRegistry';
import { SEA_ROUTE_DATA } from '../data/VectorSeaRouteData';
import { unwrapLongitudeNear } from '../utils/GeoLongitude';
import { OrientationSystem } from '../core/OrientationSystem';
import { NavalWakeDrawer } from './legion/NavalWakeDrawer';
import { STRATEGIC_SPRITE_SCALE } from './strategicSpriteScale';
import { registerHumanPresence } from './strategicPresence';
import { AmbientFrameGate } from './AmbientFrameGate';
import { needsSail, buildSailLayers, DE_STYLE_TO_SAIL_GROUP, type SailGroup } from '../data/NavalSails';
import { REGION_TO_DE_STYLE } from '../systems/cityDeStyle';

/** 商队经过时惊走野生动物的半径（度，zoom 9 ≈ 50px） */
const CARAVAN_SCARE_RADIUS_DEG = 0.14;

/**
 * TradeTrafficLayer — 战略地图「商贸交通」环境层（2026-08-31 主人定稿）。
 *
 * 需求：
 *   · 跟随军团同屏出现，1 个车队（同屏一队）；每队 3-6 个单位排成一排。
 *   · 路线从屏幕外据点出发、走到屏幕外再结束（沿道路/海路穿屏）；屏内不渐隐，出屏即消失。
 *   · 陆上商队（车），进海商船；不同区域不同文化；不要势力色；比军团小。
 *
 * 实现原则（铁律）：
 *   · 完全独立一层（自己的 canvas + Leaflet pane + rAF 循环），不碰现有渲染。
 *   · 只读数据（跟拍军团、路网、海陆判定、文化区），不写回任何实体。
 *   · 素材来自 public/SUCAI_TRADE/，只画主图层 .png（原色，不染势力色）。
 *   · 发车即全不透明（不做渐显渐隐），走到屏幕外终点直接移除。
 */

/**
 * 路径点。`sea` 由 `RoadRegistry.pathToLatLngs` 带出来 —— 该点所在的那条边是不是海路
 * （源自 `SEA_ROUTE_DATA`）。商队自己造的兜底直线没有它（undefined），那时才回落掩膜采样。
 */
type Pt = { lat: number; lng: number; sea?: boolean };

interface TradeAsset {
    dir: string;
    dirs16: boolean;
    nDir: number;
    action: 'move' | 'idle';
    frames: number;
    dirs: Record<string, { fw: number; fh: number; hx: number; hy: number }>;
    sheets: (HTMLImageElement | null)[];
    ready: boolean;
}

interface Caravan {
    id: string;
    path: Pt[];
    cumLen: number[];
    totalLen: number;
    dist: number;          // 当前在折线上的累计距离（度）
    count: number;         // 3-6 个单位
    cartDir: string;       // 陆路商队皮肤目录
    shipDir: string;       // 商船皮肤目录
    phase: number;         // 动画相位（帧偏移）
    ageMs: number;
    lastDirIdx: number[];  // 每单位上一帧朝向 index（迟滞用）
    lastDirDeg: number[];  // 每单位上一帧朝向角度（迟滞用）
    /** 整支渐隐中的透明度倍数（1 → 0；切换跟拍后离镜头太远的车队不再一刀删，而是渐隐） */
    fadeOut?: number;
}

// ── 可调参数 ──────────────────────────────────────────────────────────────
// 🔴 [2026-08-31] 1 → 3。全图同时只有一支车队、还只生成在跟拍军团附近，
//    再叠上「进场要等一段」和「切跟拍就清空」，实际观感就是几乎看不到。
//    3 支 × 每支 3~6 个单位 = 9~18 个精灵，对渲染仍是噪音级（实测本层 0.51ms/秒）。
// [2026-08-31 主人定] 保持 1 支：3 支同屏太吵。
// 真正让商队"看不见"的是另外两条（取跟拍军团的路径写错、切跟拍一刀清空），已分别修掉，
// 所以 1 支也能稳定看到，不必靠堆数量。
const CARAVAN_MIN = 1;
const CARAVAN_MAX = 1;
/** 切跟拍时保留车队的半径（度）：超出这个距离的旧车队才丢弃 */
const KEEP_RADIUS_DEG = 8;
const UNITS_MIN = 3;
const UNITS_MAX = 6;
const SPEED_DEG_PER_SEC = 0.18;     // 行进速度（度/秒；zoom9 ≈ 66px/s）
const UNIT_SPACING_DEG = 0.22;      // 队内相邻单位间距（度）
/**
 * 🔴 2026-10-31 主人令「所有素材都要渐显渐隐，从屏幕外进入、再出屏幕，在屏幕期间不要无缘无故消失」：
 *    每个单位在路线起点后、终点前这段距离内渐显 / 渐隐（≈ 1.2 秒路程）；切换跟拍的整队渐隐用 1 秒。
 */
const UNIT_FADE_DEG = SPEED_DEG_PER_SEC * 1.2;
const CARAVAN_FADE_OUT_SEC = 1.0;
const CART_ANIM_FPS = 18;           // 车 move 动画帧率
// 🔴 [2026-08-31 修「攻城战只显示攻城武器」] 必须低于 UNITS_LOW(580)。
//    580 是攻城战里**画在城池背后**的那批士兵所在的层；本层原值压在它之上，
//    等于把攻城方的士兵整个涂掉，只剩画在主层(UNITS=620)的攻城器械还看得见。
//    地面氛围层（植被/动物/商队）一律排在 CONNECTIONS(450) 与 UNITS_LOW(580) 之间。
const PANE_ZINDEX = 570;            // 商队：地面氛围层最高，仍低于 UNITS_LOW(580)
const SCALE_BASE = STRATEGIC_SPRITE_SCALE;   // 🔴 2026-10-31 主人令「显示比例统一、大小对齐 DE」：商队与军团/家畜同一基准（原 0.35）

/**
 * 🔴 [2026-11-09 主人令「中式帆船大一点」] 单型商船的**放大倍数**（只有点名的这一型放大，其余照旧 `SCALE_BASE`）。
 *    中式帆船 JUNK 素材帧框本身只有 88×108（DE 原生），×0.40 后上屏仅约 35×43px，比海里的鲸鱼小得多；
 *    ×1.5 后约 53×65px，同样是商船，但看得清是多桅中式帆。
 *    玩家「环球航行」的商船（`PlayerTourSpriteDrawer`）共用这张表，同一型船在哪都是同一个大小。
 */
export const TRADE_SHIP_SIZE_MULT: Readonly<Record<string, number>> = {
    JUNK: 1.5,
};

/** 商船模型放大倍数（未登记 = 1，即照旧 `SCALE_BASE`） */
export function tradeShipSizeMult(dir: string): number {
    return TRADE_SHIP_SIZE_MULT[dir] ?? 1;
}

const OFFSCREEN_MARGIN = 0.25;      // 屏幕外起终点外推比例（× 视口宽；须大于车队展开长度）
// 🔴 [2026-08-31] 30 → 8 秒。这个数是「车队生成在视口外多远」——原值意味着
//    最长要等 30 秒它才走进画面，而镜头常常撑不到 30 秒就切走了。
const MAX_ENTRY_WAIT_SEC = 8;       // 生成后最迟 8 秒进入当前视口
// ──────────────────────────────────────────────────────────────────────────

/**
 * 22 套商贸素材全集（public/SUCAI_TRADE/）：
 *  - 陆路 17 套：
 *    · 丝路骆驼商车（满/空）：TRADE_CART_ORIE / TRADE_CART_ORIE_EMPTY
 *    · 西方四轮马车（满/空）：TRADE_CART_WEST / TRADE_CART_WEST_EMPTY
 *    · 东亚黄牛货车（满/空）：TRADE_CART_ASIA / TRADE_CART_ASIA_EMPTY
 *    · 南亚/非洲水牛车（满/空）：TRADE_CART_AFRI / TRADE_CART_AFRI_EMPTY
 *    · 美洲原住民商车（满/空）：TRADE_CART_MESO / TRADE_CART_MESO_EMPTY
 *    · 民间骡驴驮车（1 套）：MULE_CART
 *    · 徒步商旅/行商（6 套）：MERCHANT_ORIE / MERCHANT_ASIA / MERCHANT_WEST / MERCHANT_ANT / MERCHANT_AFRI / MERCHANT_MESO
 *  - 海路 5 套：
 *    · 中式帆船 JUNK / 欧洲柯克船 TRADE_COG / 三角帆大商船 MERCHANT_SHIP / 远洋渡运船 TRANSPORT_SHIP / 独木舟 CANOE
 *
 * 均化原则：先按最近据点的 67 建筑文化（CITIES_V2.buildingStyle）定出当地符合历史的候选池，
 * 再在池内按「累计出场最少优先（Shuffle-Bag 均化）」挑选，保证当地每一种合法素材均匀轮番登场。
 */
const landUsageCount = new Map<string, number>();
const shipUsageCount = new Map<string, number>();

function pickBalanced(pool: readonly string[], usage: Map<string, number>): string {
    let minCount = Infinity;
    for (const item of pool) {
        const c = usage.get(item) ?? 0;
        if (c < minCount) minCount = c;
    }
    const candidates = pool.filter((item) => (usage.get(item) ?? 0) === minCount);
    const chosen = candidates[Math.floor(Math.random() * candidates.length)] ?? pool[0];
    usage.set(chosen, (usage.get(chosen) ?? 0) + 1);
    return chosen;
}

/** 查离 (lat, lng) 最近的据点建筑文化；无据点时用 getRegion 兜底 */
function resolveLocalCulture(lat: number, lng: number): BuildingStyle | string {
    let bestStyle: BuildingStyle | undefined;
    let bestD2 = Infinity;
    for (const c of CITIES_V2) {
        const dLat = c.lat - lat;
        const dLng = ((((c.lng - lng) % 360) + 540) % 360) - 180;
        const d2 = dLat * dLat + dLng * dLng;
        if (d2 < bestD2) {
            bestD2 = d2;
            bestStyle = c.buildingStyle;
        }
    }
    return bestStyle ?? getRegion(lat, lng);
}

/** 1. 丝路·大漠·中东·北非驼商圈（双峰骆驼商车满/空 + 丝路胡商 + 骡驴驮车） */
const SILK_CAMEL_STYLES = new Set<string>([
    'ORIE', 'WEST_ASIA', 'PERSIAN', 'SASANIAN', 'CENTRAL_ASIA', 'WESTERN', 'HEXI',
    'MONGOL', 'STEPPE', 'XIANBEI', 'HEXI', 'TURKS', 'CUMAN', 'HUNS', 'BERBER', 'MUGHAL',
]);

/** 2. 古典地中海·黑海·高加索圈（马车满/空 + 古典地中海行商 + 骡车；东地中海/高加索兼通丝路骆驼） */
const MED_ANT_STYLES = new Set<string>([
    'ROMA', 'BYZANTINE', 'GREECE', 'GREEK', 'ATHENIANS', 'SPARTANS',
    'MACEDONIAN', 'THRACIAN', 'SICILIANS', 'ARMENIANS', 'GEORGIANS',
]);

/** 3. 欧洲大陆·北欧圈（马车满/空 + 欧洲行商 + 骡车） */
const EUROPE_STYLES = new Set<string>([
    'LATIN', 'FRANKS', 'SPANISH', 'PORTUGUESE', 'BURGUNDIANS', 'GERMANIC', 'TEUTONS',
    'SAXONS', 'BRITONS', 'CELTS', 'DANES', 'VIKINGS', 'VARANGIANS', 'GOTHS',
    'SLAVIC', 'POLES', 'LITHUANIANS', 'BOHEMIANS', 'BULGARIANS', 'MAGYAR', 'ITALIANS', 'EAST',
]);

/** 4. 南亚·东南亚·非洲圈（水牛/角牛车满/空 + 非洲/南亚行商 + 骡车；西北印度与红海兼通骆驼） */
const AFRI_IND_STYLES = new Set<string>([
    'INDIA', 'PURU', 'BENGALIS', 'GURJARAS', 'BURMESE', 'KHMER',
    'VIETNAMESE', 'MALAY', 'ETHIOPIANS', 'AFRICA',
]);

/** 5. 美洲原住民圈（美洲商车满/空 + 美洲背篓行商 Pochtēca，严禁旧大陆牛马骆驼骡车） */
const AMERICAS_STYLES = new Set<string>([
    'AMERICA', 'ANDE', 'MAYANS', 'INCA', 'MUISCA', 'TUPI', 'MAPUCHE',
]);

/** 6. 东亚·东南亚海域圈（环中国海、日本海、南洋马六甲）：中式帆船 JUNK 圈（船池与玩家海路皮肤共用） */
const EAST_ASIA_STYLES = new Set<string>([
    'CENTRAL', 'WEI', 'JIANGNAN', 'HUGUANG', 'BASHU', 'TIBET', 'NORTHEAST', 'KOREA',
    'JAPAN', 'VIETNAMESE', 'KHMER', 'BURMESE', 'MALAY', 'MONGOL', 'XIANBEI', 'HEXI',
]);

/** 按当地历史文化与地理坐标，返回符合历史的陆路商队候选池并均化抽取 */
function landAssetDir(lat: number, lng: number): string {
    const style = resolveLocalCulture(lat, lng);

    // 美洲：严格只用美洲商车（满/空）与美洲行商
    if (AMERICAS_STYLES.has(style)) {
        return pickBalanced(['TRADE_CART_MESO', 'TRADE_CART_MESO_EMPTY', 'MERCHANT_MESO'], landUsageCount);
    }

    // 丝路·大漠·中东·北非驼商圈：骆驼商车（满/空）、丝路胡商、骡车均化
    if (SILK_CAMEL_STYLES.has(style)) {
        return pickBalanced(['TRADE_CART_ORIE', 'TRADE_CART_ORIE_EMPTY', 'MERCHANT_ORIE', 'MULE_CART'], landUsageCount);
    }

    // 古典地中海·高加索圈：马车（满/空）、古典行商、骡车；拜占庭/亚美尼亚/格鲁吉亚丝路西端兼通骆驼商车与胡商
    if (MED_ANT_STYLES.has(style)) {
        const pool = (style === 'BYZANTINE' || style === 'ARMENIANS' || style === 'GEORGIANS')
            ? ['TRADE_CART_WEST', 'TRADE_CART_WEST_EMPTY', 'MERCHANT_ANT', 'MULE_CART', 'TRADE_CART_ORIE', 'MERCHANT_ORIE']
            : ['TRADE_CART_WEST', 'TRADE_CART_WEST_EMPTY', 'MERCHANT_ANT', 'MULE_CART'];
        return pickBalanced(pool, landUsageCount);
    }

    // 欧洲大陆与北欧圈：马车（满/空）、欧洲行商、骡车均化
    if (EUROPE_STYLES.has(style)) {
        return pickBalanced(['TRADE_CART_WEST', 'TRADE_CART_WEST_EMPTY', 'MERCHANT_WEST', 'MULE_CART'], landUsageCount);
    }

    // 南亚·东南亚·非洲圈：水牛商车（满/空）、非洲/南亚行商、骡车；瞿折罗（塔尔沙漠）与埃塞俄比亚（红海驼道）兼通骆驼
    if (AFRI_IND_STYLES.has(style)) {
        const pool = (style === 'GURJARAS' || style === 'ETHIOPIANS')
            ? ['TRADE_CART_AFRI', 'TRADE_CART_AFRI_EMPTY', 'MERCHANT_AFRI', 'MULE_CART', 'TRADE_CART_ORIE', 'TRADE_CART_ORIE_EMPTY']
            : (style === 'AFRICA')
                ? ['TRADE_CART_AFRI', 'TRADE_CART_AFRI_EMPTY', 'MERCHANT_AFRI']
                : ['TRADE_CART_AFRI', 'TRADE_CART_AFRI_EMPTY', 'MERCHANT_AFRI', 'MULE_CART'];
        return pickBalanced(pool, landUsageCount);
    }

    // 东亚商贸圈（CENTRAL / WEI / JIANGNAN / HUGUANG / BASHU / TIBET / NORTHEAST / KOREA / JAPAN）：
    // 关中陇右河西走廊（lng < 109.5°）或幽燕塞北长城沿线（lat > 38.2°）自古有胡商驼队往来，兼入丝路骆驼商车与胡商
    if ((style === 'CENTRAL' || style === 'WEI') && (lng < 109.5 || lat > 38.2)) {
        return pickBalanced([
            'TRADE_CART_ASIA', 'TRADE_CART_ASIA_EMPTY', 'MERCHANT_ASIA', 'MULE_CART',
            'TRADE_CART_ORIE', 'TRADE_CART_ORIE_EMPTY', 'MERCHANT_ORIE',
        ], landUsageCount);
    }
    return pickBalanced(['TRADE_CART_ASIA', 'TRADE_CART_ASIA_EMPTY', 'MERCHANT_ASIA', 'MULE_CART'], landUsageCount);
}

/** 按海域与沿岸文化历史特征，返回合法的海上商船候选池并均化抽取 */
function shipDir(lat: number, lng: number): string {
    const style = resolveLocalCulture(lat, lng);

    // 1. 美洲海域与内陆大湖：前哥伦布时期严格使用美洲独木舟 CANOE
    if (AMERICAS_STYLES.has(style)) {
        return 'CANOE';
    }

    // 2. 撒哈拉以南西非（AFRICA）：尼日尔河与几内亚湾独木舟 + 商船 + 渡运船
    if (style === 'AFRICA') {
        return pickBalanced(['CANOE', 'MERCHANT_SHIP', 'TRANSPORT_SHIP'], shipUsageCount);
    }

    // 3. 东亚与东南亚海域（环中国海、日本海、南洋马六甲）：中式帆船 JUNK + 三角帆市舶船 + 渡运船 + 近岸独木舟
    if (EAST_ASIA_STYLES.has(style)) {
        return pickBalanced(['JUNK', 'MERCHANT_SHIP', 'TRANSPORT_SHIP', 'CANOE'], shipUsageCount);
    }

    // 4. 印度洋·孟加拉湾·阿拉伯海·红海·波斯湾（南亚 + 中东 + 东非）：阿拉伯三角帆商船 + 唐宋远洋福船 JUNK + 渡运船 + 近岸舟
    if (AFRI_IND_STYLES.has(style) || style === 'ORIE' || style === 'PERSIAN' || style === 'SASANIAN') {
        return pickBalanced(['MERCHANT_SHIP', 'TRANSPORT_SHIP', 'JUNK', 'CANOE'], shipUsageCount);
    }

    // 5. 地中海·黑海（古典地中海 + 北非柏柏尔 + 突厥/中亚西端）：三角帆商船 + 欧洲柯克货船 + 渡运船 + 沿岸轻舟
    if (MED_ANT_STYLES.has(style) || SILK_CAMEL_STYLES.has(style)) {
        return pickBalanced(['MERCHANT_SHIP', 'TRADE_COG', 'TRANSPORT_SHIP', 'CANOE'], shipUsageCount);
    }

    // 6. 欧洲北海·波罗的海·大西洋：柯克货船 TRADE_COG + 商船 + 渡运船 + 峡湾内河轻舟
    return pickBalanced(['TRADE_COG', 'MERCHANT_SHIP', 'TRANSPORT_SHIP', 'CANOE'], shipUsageCount);
}

/**
 * 🔴 [2026-11-06 主人令] 玩家「环球旅行 / 环球航行」模式的**商队车**皮肤。
 *
 * 与上面环境商队用的 `landAssetDir` 同一套地域文化判据，区别只有两条：
 *   ① 只取**车辆**（骆驼商车 / 马车 / 黄牛货车 / 水牛车 / 美洲商车），绝不给玩家徒步的 MERCHANT_* 行商；
 *   ② **确定性**：玩家在同一片文化区里始终是同一种车（环境商队才按出场次数均化轮换）。
 * 玩家跨文化区才会换车（滞回在 `PlayerTourSpriteDrawer.resolvePlayerTourDir`）。
 */
export function playerTourCaravanDir(lat: number, lng: number): string {
    const style = resolveLocalCulture(lat, lng);
    if (AMERICAS_STYLES.has(style)) return 'TRADE_CART_MESO';   // 美洲原住民商车
    if (SILK_CAMEL_STYLES.has(style)) return 'TRADE_CART_ORIE'; // 丝路骆驼商车
    if (AFRI_IND_STYLES.has(style)) return 'TRADE_CART_AFRI';   // 南亚·东南亚·非洲水牛车
    if (MED_ANT_STYLES.has(style) || EUROPE_STYLES.has(style)) return 'TRADE_CART_WEST'; // 地中海·欧洲四轮马车
    return 'TRADE_CART_ASIA';                                   // 东亚黄牛货车
}

/**
 * 🔴 [2026-11-06 主人令] 玩家「环球航行 / 环球旅行」海段的**商船**皮肤（确定性，同上一律）。
 * 东亚海域＝中式帆船 JUNK（商队船），欧洲北海·大西洋＝柯克货船，地中海·印度洋＝三角帆大商船，
 * 美洲海域＝前哥伦布独木舟（与当地商船池一致）。
 */
export function playerTourMerchantShipDir(lat: number, lng: number): string {
    const style = resolveLocalCulture(lat, lng);
    if (AMERICAS_STYLES.has(style)) return 'CANOE';
    if (EAST_ASIA_STYLES.has(style)) return 'JUNK';
    if (EUROPE_STYLES.has(style)) return 'TRADE_COG';
    return 'MERCHANT_SHIP';
}

/** 按所在地文化映射 DE 船帆文化组（欧洲柯克船固定用欧洲帆组） */
export function tradeShipSailGroupAt(lat: number, lng: number, shipId?: string): SailGroup {
    if (shipId === 'TRADE_COG') return 'west';
    const style = resolveLocalCulture(lat, lng);
    const deStyle = (REGION_TO_DE_STYLE as Record<string, string>)[style];
    return (deStyle && DE_STYLE_TO_SAIL_GROUP[deStyle]) || 'west';
}

export class TradeTrafficLayer {
    private map: L.Map;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private assets: Map<string, TradeAsset> = new Map();

    /** PerfDoctor 体检口子 */
    public debugAssetCount(): number { return this.assets.size; }
    public debugAssetBytes(): number {
        let b = 0;
        for (const a of this.assets.values()) {
            for (const im of (a as unknown as { sheets?: (HTMLImageElement | null)[] }).sheets ?? []) {
                if (im) b += (im.naturalWidth || 0) * (im.naturalHeight || 0) * 4;
            }
        }
        return b;
    }
    private caravans: Caravan[] = [];
    private lastFollowedId: string | null = null;
    private running = false;
    private lastTime = 0;
    /** 限帧闸：静止时 30 帧，缩放/大幅平移立刻重画（见 AmbientFrameGate） */
    private readonly frameGate = new AmbientFrameGate();
    /** 画布上是否还有上一帧的内容；没有商队且已清空时整帧跳过清屏 */
    private canvasDirty = true;
    private nowMs = 0;
    private idSeq = 0;
    private cityIndex: Map<string, Pt> | null = null;

    constructor(map: L.Map) {
        this.map = map;
        // 🔴 2026-10-31 主人令「动物碰到人要逃跑」：每个商队单位都登记给野生动物层
        registerHumanPresence(() => this.caravans.flatMap((c) => Array.from({ length: c.count }, (_, u) => c.dist - u * UNIT_SPACING_DEG)
            .filter((ud) => ud >= 0 && ud <= c.totalLen)
            .map((ud) => ({ ...TradeTrafficLayer.pointAt(c.path, c.cumLen, ud), r: CARAVAN_SCARE_RADIUS_DEG }))));
        this.canvas = document.createElement('canvas');
        this.canvas.style.pointerEvents = 'none';
        this.canvas.className = 'leaflet-zoom-animated';
        this.ctx = this.canvas.getContext('2d')!;
        this.setupPane();
        // 🔴 [2026-10-31 修「玩家移动时有拖拽感」] 不在 move/zoom 事件里挪动画布，只在 draw() 绘制那一刻对齐
        //    （同 AnimalAmbientLayer 2026-10-28 的修法）。本层 rAF 排在主循环镜头平移之前：
        //    move 时把画布钉回屏幕原点，而画布内容还是平移前画的 → 商队整层落后镜头一帧。
        this.map.on('resize', this.resize.bind(this));
        this.resize();
        this.syncCanvas();
    }

    private setupPane(): void {
        const name = 'tradeTrafficPane';
        if (!this.map.getPane(name)) {
            this.map.createPane(name);
            const pane = this.map.getPane(name)!;
            pane.style.zIndex = String(PANE_ZINDEX);
            pane.style.pointerEvents = 'none';
        }
        this.map.getPane(name)!.appendChild(this.canvas);
    }

    private resize(): void {
        const size = this.map.getSize();
        this.canvas.width = size.x;
        this.canvas.height = size.y;
    }

    private syncCanvas(): void {
        const topLeft = this.map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this.canvas, topLeft);
    }

    public start(): void {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.tick.bind(this));
    }

    public stop(): void {
        this.running = false;
    }

    public setVisible(visible: boolean): void {
        this.canvas.style.display = visible ? 'block' : 'none';
    }

    // ── 素材加载 ────────────────────────────────────────────────────────
    private loadAsset(dir: string): void {
        if (this.assets.has(dir)) return;
        const asset: TradeAsset = {
            dir, dirs16: false, nDir: 8, action: 'idle', frames: 1,
            dirs: {}, sheets: [], ready: false,
        };
        this.assets.set(dir, asset);
        const base = `/SUCAI_TRADE/${dir}`;
        fetch(`${base}/_meta.json`)
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`meta ${r.status}`))))
            .then((meta) => {
                asset.dirs16 = meta.dirs16 === true;
                asset.nDir = meta.nDir ?? (asset.dirs16 ? 16 : 8);
                const act = meta.move ? 'move' : 'idle';
                asset.action = act;
                asset.frames = meta[act]?.frames ?? 1;
                asset.dirs = meta[act]?.dirs ?? {};
                const nDir = asset.nDir;
                asset.sheets = new Array(nDir).fill(null);
                let loaded = 0;
                for (let d = 0; d < nDir; d++) {
                    const img = new Image();
                    img.onload = () => { loaded++; if (loaded === nDir) asset.ready = true; };
                    img.onerror = () => { loaded++; if (loaded === nDir) asset.ready = true; };
                    img.src = `${base}/${act}_${d}.png`;
                    asset.sheets[d] = img;
                }
            })
            .catch((e) => console.warn(`[TradeTraffic] 加载 ${dir} 失败:`, e));
    }

    private assetFor(dir: string): TradeAsset | undefined {
        const a = this.assets.get(dir);
        return a && a.ready ? a : undefined;
    }

    // ── 几何工具（度作单位，本地小范围足够）────────────────────────────
    private static segDist(a: Pt, b: Pt): number {
        return Math.hypot(b.lat - a.lat, b.lng - a.lng);
    }

    private static buildCum(pts: Pt[]): { cum: number[]; total: number } {
        const cum = [0];
        for (let i = 1; i < pts.length; i++) {
            cum.push(cum[i - 1] + TradeTrafficLayer.segDist(pts[i - 1], pts[i]));
        }
        return { cum, total: cum[cum.length - 1] };
    }

    private static pointAt(pts: Pt[], cum: number[], d: number): Pt {
        if (pts.length === 1) return pts[0];
        const dd = Math.max(0, Math.min(d, cum[cum.length - 1]));
        let lo = 0, hi = cum.length - 1;
        while (lo < hi - 1) {
            const mid = (lo + hi) >> 1;
            if (cum[mid] <= dd) lo = mid; else hi = mid;
        }
        const seg = cum[hi] - cum[lo];
        const t = seg === 0 ? 0 : (dd - cum[lo]) / seg;
        const a = pts[lo], b = pts[hi];
        return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
    }

    /**
     * 折线上 `d` 处**所在那一段**是不是海路（`null` = 路径没带标记，交回掩膜采样）。
     *
     * 与 `pointAt` 同一套段查找：`RoadRegistry` 的 `seaFlags[i]` 记的是「第 i 个点所在的边」，
     * 故段 [lo, hi] 的归属看 `pts[hi].sea`（`pathToLatLngs` 逐点带出）。
     */
    private static segSeaAt(pts: Pt[], cum: number[], d: number): boolean | null {
        if (pts.length < 2) return null;
        const dd = Math.max(0, Math.min(d, cum[cum.length - 1]));
        let lo = 0, hi = cum.length - 1;
        while (lo < hi - 1) {
            const mid = (lo + hi) >> 1;
            if (cum[mid] <= dd) lo = mid; else hi = mid;
        }
        const flag = pts[hi]?.sea ?? pts[lo]?.sea;
        return typeof flag === 'boolean' ? flag : null;
    }

    // ── 据点索引（道路/海路端点 → 坐标），用于找屏幕外起终点 ────────────
    private buildCityIndex(): Map<string, Pt> {
        if (this.cityIndex) return this.cityIndex;
        const idx = new Map<string, Pt>();
        const addFeat = (props: any, coords: [number, number][] | undefined) => {
            if (!coords || coords.length < 2) return;
            const s = props?.startConnection, e = props?.endConnection;
            if (s) idx.set(s, { lat: coords[0][1], lng: coords[0][0] });
            if (e) idx.set(e, { lat: coords[coords.length - 1][1], lng: coords[coords.length - 1][0] });
        };
        for (const f of roadRegistry.getVectorRoads()) addFeat(f.properties, f.geometry?.coordinates);
        for (const f of SEA_ROUTE_DATA.features) addFeat(f.properties, f.geometry?.coordinates);
        this.cityIndex = idx;
        return idx;
    }

    /** 造一条「屏幕外某侧城 → 最近城(跟拍附近) → 屏幕外对侧城」的穿屏道路折线（东西/南北随机）。 */
    private buildCrossRoute(anchor: Pt): Pt[] | null {
        const bounds = this.map.getBounds();
        const sw = bounds.getSouthWest(), ne = bounds.getNorthEast();
        const viewW = Math.max(0.5, ne.lng - sw.lng);
        const viewH = Math.max(0.5, ne.lat - sw.lat);
        const westLng = sw.lng - viewW * OFFSCREEN_MARGIN;
        const eastLng = ne.lng + viewW * OFFSCREEN_MARGIN;
        const southLat = sw.lat - viewH * OFFSCREEN_MARGIN;
        const northLat = ne.lat + viewH * OFFSCREEN_MARGIN;

        const idx = this.buildCityIndex();
        const nearestId = roadRegistry.getNearestCityId(anchor.lat, anchor.lng, 3.0);
        if (!nearestId) return null;

        // 随机轴：东西 / 南北；起终点优先在当前视口周边的区域范围（避免跨半个地球挑美洲/欧洲远端导致折线绕洋），无候选时再放宽
        const horizontal = Math.random() < 0.5;
        const maxLngSpan = Math.max(15, viewW * 4);
        const maxLatSpan = Math.max(12, viewH * 4);
        const collectSides = (limitSpan: boolean) => {
            const sIds: string[] = [];
            const eIds: string[] = [];
            for (const [id, p] of idx) {
                const pLng = unwrapLongitudeNear(p.lng, anchor.lng);
                if (limitSpan && (Math.abs(pLng - anchor.lng) > maxLngSpan || Math.abs(p.lat - anchor.lat) > maxLatSpan)) continue;
                if (horizontal) {
                    if (pLng < westLng) sIds.push(id);
                    else if (pLng > eastLng) eIds.push(id);
                } else {
                    if (p.lat < southLat) sIds.push(id);
                    else if (p.lat > northLat) eIds.push(id);
                }
            }
            return { sIds, eIds };
        };
        let { sIds: startIds, eIds: endIds } = collectSides(true);
        if (startIds.length === 0 || endIds.length === 0) {
            ({ sIds: startIds, eIds: endIds } = collectSides(false));
        }
        if (startIds.length === 0 || endIds.length === 0) return null;

        const forward = Math.random() < 0.5;
        const startId = forward
            ? startIds[Math.floor(Math.random() * startIds.length)]
            : endIds[Math.floor(Math.random() * endIds.length)];
        const endId = forward
            ? endIds[Math.floor(Math.random() * endIds.length)]
            : startIds[Math.floor(Math.random() * startIds.length)];

        const p1 = roadRegistry.findPath(startId, nearestId);
        const p2 = roadRegistry.findPath(nearestId, endId);
        if (!p1 || !p2) return null;
        const seg1 = roadRegistry.pathToLatLngs(p1);
        const seg2 = roadRegistry.pathToLatLngs(p2);
        if (seg1.length === 0 || seg2.length === 0) return null;
        // 以视口内锚点城 nearestId 为基准向两端连续展开经度，杜绝跨 180° 海路与陆路拼接时产生横穿全球陆地的 360° 飞线
        seg1[seg1.length - 1] = { ...seg1[seg1.length - 1], lng: unwrapLongitudeNear(seg1[seg1.length - 1].lng, anchor.lng) };
        for (let i = seg1.length - 2; i >= 0; i--) {
            seg1[i] = { ...seg1[i], lng: unwrapLongitudeNear(seg1[i].lng, seg1[i + 1].lng) };
        }
        let prevLng = seg1[seg1.length - 1].lng;
        const tail: Pt[] = [];
        for (let i = 1; i < seg2.length; i++) {
            const lng = unwrapLongitudeNear(seg2[i].lng, prevLng);
            tail.push({ ...seg2[i], lng });
            prevLng = lng;
        }
        const full = [...seg1, ...tail];
        return full.length >= 2 ? full : null;
    }

    private initialDistForEntry(path: Pt[], cum: number[]): number {
        const viewport = L.bounds(L.point(0, 0), this.map.getSize());
        for (let i = 1; i < path.length; i++) {
            const from = this.map.latLngToContainerPoint([path[i - 1].lat, path[i - 1].lng]);
            const to = this.map.latLngToContainerPoint([path[i].lat, path[i].lng]);
            const clipped = L.LineUtil.clipSegment(from, to, viewport, false);
            if (!clipped) continue;

            const pixelLength = from.distanceTo(to);
            const entryFraction = pixelLength > 0
                ? Math.min(1, from.distanceTo(clipped[0]) / pixelLength)
                : 0;
            const segmentLength = cum[i] - cum[i - 1];
            const entryDist = cum[i - 1] + segmentLength * entryFraction;
            return Math.max(0, entryDist - SPEED_DEG_PER_SEC * MAX_ENTRY_WAIT_SEC);
        }
        return 0;
    }

    private spawnTraffic(anchor: Pt): void {
        if (this.caravans.length >= CARAVAN_MAX) return;
        // 🔴 [2026-10-31 战略地图素材规划] 商队只走真实道路/海路；寻路失败就不生成（原兜底横穿屏幕直线会穿山过海，已删）
        const path = this.buildCrossRoute(anchor);
        if (!path) return;
        const { cum, total } = TradeTrafficLayer.buildCum(path);
        if (total <= 0) return;

        const cartDir = landAssetDir(anchor.lat, anchor.lng);
        const shipDirName = shipDir(anchor.lat, anchor.lng);
        this.loadAsset(cartDir);
        this.loadAsset(shipDirName);

        const count = UNITS_MIN + Math.floor(Math.random() * (UNITS_MAX - UNITS_MIN + 1));
        const initialDist = this.initialDistForEntry(path, cum);
        this.caravans.push({
            id: `trade_${this.idSeq++}`,
            path, cumLen: cum, totalLen: total,
            dist: initialDist, count, cartDir, shipDir: shipDirName,
            phase: Math.floor(Math.random() * 30), ageMs: 0,
            lastDirIdx: new Array(count).fill(-1), lastDirDeg: new Array(count).fill(NaN),
        });
    }

    // ── 每帧 ────────────────────────────────────────────────────────────
    private tick(now: number): void {
        // 🔴 [2026-08-31] 战术模式（scene13）下战略地图被整屏盖住，这层每帧重画是白烧。
        //    原实现 rAF 无条件永久运行。视口 0×0（面板隐藏）时同样跳过。
        if ((window as any).game?.scene13War?.isActive?.() === true
            || this.map.getSize().x === 0) {
            requestAnimationFrame(this.tick.bind(this));
            return;
        }
        if (!this.running) return;
        if (!this.frameGate.shouldRun(now, this.map)) {
            requestAnimationFrame(this.tick.bind(this));
            return;
        }
        const dt = Math.min(0.1, Math.max(0, (now - this.lastTime) / 1000));
        this.lastTime = now;
        this.nowMs = now;

        // 🔴 [2026-08-31 修「商队总是看不到」] 原来写的是 `game.legionManager`，
        //    但 **GameApp 上根本没有 legionManager 这个属性** —— LegionManager 挂在
        //    `historicalEventManager.getLegionManager()` 下面（GameAppLoop 一直是这么取的）。
        //    结果 `followed` 恒为 undefined → followedId 恒为 null → spawnTraffic **一次都没被调用**，
        //    商队从上线起就没生成过。不是概率低看不到，是根本没有。
        const legionMgr = (window as any).game?.historicalEventManager?.getLegionManager?.();
        const followed = legionMgr?.getFollowedLegion?.();
        const followedId: string | null = followed?.id ?? null;
        const followedPos: Pt | null = followed ? followed.getPosition() : null;

        if (followedId !== this.lastFollowedId) {
            this.lastFollowedId = followedId;
            // 🔴 [2026-08-31 修「商队总是看不到」之二] 原来切跟拍**一刀清空所有车队**。
            //    而车队是生成在视口外、要走一段才进画面的（见 initialDistForEntry），
            //    镜头只要在这段时间内切走，车队就被删掉 —— 于是一辈子也看不到它进画面。
            //    改成只丢「离新镜头太远、这辈子也走不过来」的，近处的继续走完它的路。
            for (const c of this.caravans) {
                if (c.fadeOut !== undefined) continue;
                if (!followedPos) { c.fadeOut = 1; continue; }   // 完全没有跟拍目标时整队渐隐
                const at = TradeTrafficLayer.pointAt(c.path, c.cumLen, c.dist);
                const dLat = at.lat - followedPos.lat, dLng = at.lng - followedPos.lng;
                if (Math.sqrt(dLat * dLat + dLng * dLng) > KEEP_RADIUS_DEG) c.fadeOut = 1;
            }
        }

        if (followedId && followedPos) {
            // 一帧内补满到 CARAVAN_MIN（原来一帧只补一支，配合 MAX=1 时没差别，
            // 现在 MIN=3 就必须循环，否则要三帧才铺满）
            while (this.caravans.length < CARAVAN_MIN) {
                const before = this.caravans.length;
                this.spawnTraffic(followedPos);
                if (this.caravans.length === before) break;   // 生成失败就别死循环
            }
        }

        const _t0 = performance.now();
        this.stepCaravans(dt);
        this.draw();
        perfDoctor.note('TradeTrafficLayer.tick(商队层)', performance.now() - _t0, 'src/map/TradeTrafficLayer.ts:tick');
        requestAnimationFrame(this.tick.bind(this));
    }

    private stepCaravans(dt: number): void {
        for (let i = this.caravans.length - 1; i >= 0; i--) {
            const c = this.caravans[i];
            c.ageMs += dt * 1000;
            c.dist += SPEED_DEG_PER_SEC * dt;
            if (c.fadeOut !== undefined) c.fadeOut -= dt / CARAVAN_FADE_OUT_SEC;
            // 原来领头一到终点就整队删除，队尾最多还落后 1.1°，终点在屏幕里时后几辆车凭空消失。
            // 现在等**队尾**也走完全程（每辆车在终点前已渐隐），或整队渐隐完才移除。
            if (c.dist - (c.count - 1) * UNIT_SPACING_DEG >= c.totalLen || (c.fadeOut !== undefined && c.fadeOut <= 0)) {
                this.caravans.splice(i, 1);
            }
        }
    }

    private draw(): void {
        const ctx = this.ctx;
        if (this.caravans.length === 0 && !this.canvasDirty) return;   // 空画布：不挪、不清
        this.syncCanvas();   // 画布与本次绘制用同一镜头位置（见构造函数说明）
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.canvasDirty = this.caravans.length > 0;
        if (this.caravans.length === 0) return;

        const zoom = this.map.getZoom();
        const scale = Math.pow(2, zoom - 9) * SCALE_BASE;
        /** 本帧待画的精灵：位置先全部算完 —— **先画水迹、后画船体**，浪花才垫在船底下 */
        const pending: Array<{
            sheet: HTMLImageElement; frame: number; fw: number; fh: number;
            ax: number; ay: number; ox: number; oy: number; rot: number; alpha: number;
            /** 本精灵自己的缩放（商船按 `tradeShipSizeMult` 放大，见 TRADE_SHIP_SIZE_MULT） */
            scale: number;
            sails?: { img: HTMLImageElement; ox: number; oy: number; w: number; h: number }[];
        }> = [];

        for (const c of this.caravans) {
            const cartAsset = this.assetFor(c.cartDir);
            const shipAsset = this.assetFor(c.shipDir);
            /** 这一支车队里**正在海上**的单位（给它们画拖尾水迹） */
            const seaShips: Array<{ x: number; y: number; r: number; isAlive: boolean; dir: number; rot: number; deg: number; shipLen: number }> = [];

            for (let u = 0; u < c.count; u++) {
                const ud = c.dist - u * UNIT_SPACING_DEG;
                // 还没出发 / 已走完的单位不画（原来夹在起点 / 终点上，几辆车叠成一坨）
                if (ud < 0 || ud > c.totalLen) continue;
                const alpha = Math.min(1, ud / UNIT_FADE_DEG, (c.totalLen - ud) / UNIT_FADE_DEG) * (c.fadeOut ?? 1);
                if (alpha <= 0.01) continue;
                const pos = TradeTrafficLayer.pointAt(c.path, c.cumLen, ud);

                // 陆上商队 / 进海商船：逐单位按海陆判定（渡海路段自动换船）
                //
                // 🔴 [2026-09-23 主人报障「左下角的商队应该是船，不应该是马队，这是网络延迟吗」]
                //    判据改成**优先跟着「走的是哪条路」** —— 与 `Army.updateTerrainSpeed` 同一条铁律
                //    （2026-09-01 主人定「按路线判定·港口登船」）。血训：
                //    原来这里只查 `LandSeaSystem.isSeaAt`，而那份判据要**现去 AWS S3 拉 Terrarium
                //    高程瓦片**（外加一张 ESRI 掩膜）；瓦片拿不到时它直接返回 false（当陆走），
                //    失败还会进 60 秒冷却不再重试 —— 于是网络一抖，**整片海被判成陆地**，
                //    商队就在海面上画马车。实测（同一台机器）：爱琴海南部 187 个采样点里
                //    判海 0 个、瓦片没到 166 个；同一批瓦片有的 46ms 成功、有的 12s 超时。
                //    而商队的路径本来就来自 `roadRegistry.pathToLatLngs`，**每个点自带 `sea` 标记**
                //    （海路段的点 sea=true，源自 SEA_ROUTE_DATA）—— 用它既不依赖网络，
                //    也不会在近岸「车/船」来回跳。只有标记缺失（`buildStraightRoute` 的兜底直线
                //    不走路网）时才回落掩膜采样，保持旧行为兜底。
                const legSea = TradeTrafficLayer.segSeaAt(c.path, c.cumLen, Math.max(0, ud));
                let sea = false;
                if (legSea !== null) {
                    sea = legSea;
                } else {
                    try {
                        sea = LandSeaSystem.isSeaAt(pos);
                    } catch {
                        /* 采样器未就绪 → 按陆路 */
                    }
                }
                const asset = sea ? shipAsset : cartAsset;
                if (!asset) continue;

                const frames = asset.frames;
                const frame = asset.action === 'move'
                    ? Math.floor(this.nowMs / 1000 * CART_ANIM_FPS + c.phase) % frames
                    : 0;

                const prevPos = TradeTrafficLayer.pointAt(c.path, c.cumLen, Math.max(0, ud - 0.001));
                const dirRes = this.dirIndex(asset, prevPos, pos, c.lastDirIdx[u], c.lastDirDeg[u]);
                const dirIdx = dirRes.idx;
                c.lastDirIdx[u] = dirRes.idx;
                c.lastDirDeg[u] = dirRes.deg;
                const box = asset.dirs[String(dirIdx)];
                if (!box) continue;
                const sheet = asset.sheets[dirIdx];
                if (!sheet || !sheet.complete || !sheet.naturalWidth) continue;

                const pt = this.map.latLngToContainerPoint([pos.lat, pos.lng]);
                const fw = box.fw, fh = box.fh, hx = box.hx, hy = box.hy;
                // 🔴 [2026-11-09 主人令「中式帆船大一点」] 单型商船放大（陆上车队不受影响）
                const sprScale = sea ? scale * tradeShipSizeMult(asset.dir) : scale;
                let shipRot = 0;
                let shipDeg = dirRes.deg;
                if (sea && asset.dirs16) {
                    // 🔴 [2026-10-11 修「商船的浪花为什么是一段一段的」]
                    //    与 LegionPhalanxDrawer.drawNaval 同源：取当前路径真实屏幕航向角 shipDeg，
                    //    减去 16 向帧的等距屏幕角得到残差角 shipRot，船身与水迹同步微旋对齐航线，
                    //    杜绝离散扇区夹角导致的阶梯状斜向断节水迹。
                    shipDeg = OrientationSystem.getScreenCompassDeg(prevPos, pos);
                    const hullRad = (45 + 22.5 * dirIdx) * Math.PI / 180;
                    const frameScreenDeg = Math.atan2(Math.sin(hullRad), 0.5 * Math.cos(hullRad)) * 180 / Math.PI;
                    let resDeg = shipDeg - frameScreenDeg;
                    while (resDeg > 180) resDeg -= 360;
                    while (resDeg < -180) resDeg += 360;
                    shipRot = resDeg * Math.PI / 180;
                }
                const sails = sea && needsSail(asset.dir)
                    ? buildSailLayers(asset.dir, dirIdx, sprScale, tradeShipSailGroupAt(pos.lat, pos.lng, asset.dir))
                    : undefined;
                pending.push({ sheet, frame, fw, fh, ax: pt.x, ay: pt.y, ox: -hx * sprScale, oy: -hy * sprScale, rot: shipRot, alpha, scale: sprScale, sails });
                if (sea) {
                    seaShips.push({
                        x: pt.x, y: pt.y, r: c.count - u, isAlive: true,
                        dir: dirIdx, rot: shipRot, deg: shipDeg, shipLen: Math.max(fw, fh) * sprScale,
                    });
                }
            }

            // 🔴 [2026-09-25 主人报障「商船没有拖尾」] **海上这段的商船也要拖尾水迹** ——
            //    与军团舰队同一套 DE 水迹（`NavalWakeDrawer`：WAKE_BACK / WAKE_FRONT）；
            //    画在船体之前（浪花垫在船底下），每支车队一份粒子池（`trade:<车队 id>`，互不串味）。
            //    海陆判据沿用本层已有的 `sea`（优先看走的是哪条路，掩膜兜底），不另立一套。
            if (seaShips.length) {
                NavalWakeDrawer.drawNavalWakes(
                    ctx, seaShips, seaShips[0].dir, scale * 1.45, this.nowMs, true,
                    undefined, seaShips[0].shipLen, `trade:${c.id}`,
                    {
                        toWorld: (point) => {
                            const ll = this.map.containerPointToLatLng(L.point(point.x, point.y));
                            return { x: ll.lng, y: ll.lat };
                        },
                        toScreen: (point) => this.map.latLngToContainerPoint([point.y, point.x]),
                    },
                );
            }
        }

        for (const p of pending) {
            ctx.globalAlpha = p.alpha;
            if (Math.abs(p.rot) > 0.001) {
                ctx.save();
                ctx.translate(p.ax, p.ay);
                ctx.rotate(p.rot);
                ctx.drawImage(p.sheet, p.frame * p.fw, 0, p.fw, p.fh, p.ox, p.oy, p.fw * p.scale, p.fh * p.scale);
                if (p.sails) {
                    for (const sl of p.sails) {
                        ctx.drawImage(sl.img, sl.ox, sl.oy, sl.w, sl.h);
                    }
                }
                ctx.restore();
            } else {
                ctx.drawImage(p.sheet, p.frame * p.fw, 0, p.fw, p.fh, p.ax + p.ox, p.ay + p.oy, p.fw * p.scale, p.fh * p.scale);
                if (p.sails) {
                    for (const sl of p.sails) {
                        ctx.drawImage(sl.img, p.ax + sl.ox, p.ay + sl.oy, sl.w, sl.h);
                    }
                }
            }
        }
        ctx.globalAlpha = 1;
    }

    private dirIndex(asset: TradeAsset, from: Pt, to: Pt, lastIdx: number, lastDeg: number): { idx: number; deg: number } {
        // 🔴 [2026-09-01 修「商队频繁更换朝向」] 朝向量化加迟滞：
        //    迟滞死区必须与「当前已选帧的扇区中心」比较，且始终返回实时角度 deg（严禁与旧原始角 lastDeg 比较或冻结 deg）。
        // 🔴 [2026-09-01] 走 Mercator 屏幕轴，不用原始经纬度差（高纬斜向会整档打偏）
        if (asset.dirs16) {
            const deg = OrientationSystem.getScreenCompassDeg(from, to);
            const rad = deg * Math.PI / 180;
            const worldDeg = ((Math.atan2(Math.sin(rad), 2 * Math.cos(rad)) * 180 / Math.PI) % 360 + 360) % 360;
            let idx = ((Math.round((worldDeg - 45) / 22.5) % 16) + 16) % 16;
            if (Number.isFinite(lastDeg) && lastIdx >= 0 && idx !== lastIdx) {
                const centerWorldDeg = (45 + 22.5 * lastIdx) % 360;
                let diff = ((worldDeg - centerWorldDeg) % 360 + 360) % 360;
                if (diff > 180) diff -= 360;
                if (Math.abs(diff) <= 11.25 + 2.5) idx = lastIdx;
            }
            return { idx, deg };
        }
        const deg = OrientationSystem.getScreenAngleDeg(from, to);
        const idx = Number.isFinite(lastDeg) && lastIdx >= 0
            ? OrientationSystem.get8DirectionWithHysteresis(lastIdx, deg, 5)
            : OrientationSystem.get8DirectionFromAngle(deg);
        return { idx, deg };
    }
}

let singleton: TradeTrafficLayer | null = null;
let visible = true;

export function initializeTradeTrafficLayer(gameMap: GameMap): TradeTrafficLayer {
    if (singleton) return singleton;
    singleton = new TradeTrafficLayer(gameMap.getLeafletMap());
    // [2026-08-31] 同动物层登记。本层 CARAVAN_MAX=1、素材少，暂不设预算，先看得见。
    if (import.meta.env.DEV) {
        perfDoctor.registerCache({
            name: 'TradeTrafficLayer:assets(商队/商船素材)',
            where: 'src/map/TradeTrafficLayer.ts:assets',
            entries: () => singleton!.debugAssetCount(),
            bytes: () => singleton!.debugAssetBytes(),
            limitKind: 'none',
        });
    }
    singleton.setVisible(visible);
    return singleton;
}

export function getTradeTrafficLayer(): TradeTrafficLayer | null {
    return singleton;
}

export function setTradeTrafficLayerVisible(nextVisible: boolean): void {
    visible = nextVisible;
    singleton?.setVisible(visible);
}
