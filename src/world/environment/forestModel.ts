/**
 * 森林模型：自然轴（口径见 docs/AGENTS/environment-architecture.md）。
 *
 * 🔴 2026-10-31 主人定森林口径 C：「本该长的林为底，据点周边按开垦减林」（专业游戏通行做法：
 *    全面战争的战略图与战场同源、Paradox 按开局年份标农田 / 森林、文明开局按气候生成后由人砍伐）。
 *
 *   实际森林 = 本该长的林（潜在植被）× (1 − 据点开垦程度)
 *
 * ① 潜在植被：RESOLVE 2017 生态区的群系（无人类干扰时该长什么），不再用 2000 年卫星树冠（那是现代开垦后的样子）。
 * ② 开垦程度 = 历史土地利用（HYDE 3.3：该年该处耕地 + 牧场占比，随年份插值）与据点开垦圈叠加：
 *    · HYDE 管「城与城之间的乡村」——只按据点画圈会把华北、关中、恒河平原画回原始森林（2026-10-31 离线实测）；
 *    · 据点开垦圈按城型给半径，越近城砍得越多（城心最多 60%），海拔 1000–1800 米递减到 40%。
 *
 * 战略植被层（成不成林）与战术战场（模板树木留多少）都只查 forestCoverAt()，两边同源。
 */
import { CITIES_V2 } from '../../data/cities_v2';
import { isStrategicForestMaskReady, queryStrategicForestBiome } from '../../map/StrategicForestMask';
import { isLandUseMaskReady, queryLandUseFraction } from '../../map/LandUseMask';

/** RESOLVE 群系编号 → 潜在森林程度（0 = 天然无林） */
const POTENTIAL_BY_RESOLVE_BIOME: Readonly<Record<number, number>> = {
    1: 1.0,    // 热带亚热带湿润阔叶林
    2: 0.7,    // 热带亚热带干性阔叶林
    3: 0.8,    // 热带亚热带针叶林
    4: 1.0,    // 温带阔叶混交林
    5: 0.9,    // 温带针叶林
    6: 0.9,    // 北方针叶林（泰加）
    12: 0.6,   // 地中海林地与灌丛
    14: 0.8,   // 红树林
};

/** 城型 → 开垦半径（度，约 111 km/度） */
const CLEARING_RADIUS_DEG: Readonly<Record<string, number>> = {
    big_city: 0.55,
    medium_city: 0.45,
    small_city: 0.35,
    stockade: 0.25,
    pass: 0.10,
};
/** 城心开垦上限：城郊仍留零星林地、行道树、坟林；城间乡村的开垦主要由 HYDE 给，圈只做局部加深 */
const CLEARING_MAX = 0.6;
/** 开垦半径内 40% 以内是全开垦带，之外线性减到 0 */
const CLEARING_CORE = 0.4;

const BUCKET_DEG = 1;
let cityBuckets: Map<string, { lat: number; lng: number; r: number }[]> | null = null;

function ensureCityBuckets(): Map<string, { lat: number; lng: number; r: number }[]> {
    if (cityBuckets) return cityBuckets;
    const m = new Map<string, { lat: number; lng: number; r: number }[]>();
    for (const c of CITIES_V2) {
        const r = CLEARING_RADIUS_DEG[String(c.type)] ?? CLEARING_RADIUS_DEG.small_city;
        if (!Number.isFinite(c.lat) || !Number.isFinite(c.lng)) continue;
        const key = `${Math.floor(c.lat / BUCKET_DEG)},${Math.floor(c.lng / BUCKET_DEG)}`;
        const arr = m.get(key);
        if (arr) arr.push({ lat: c.lat, lng: c.lng, r });
        else m.set(key, [{ lat: c.lat, lng: c.lng, r }]);
    }
    cityBuckets = m;
    return m;
}

/** 潜在森林程度 0–1；掩膜未载入返回 null（调用方保持旧逻辑） */
export function forestPotentialAt(lat: number, lng: number): number | null {
    if (!isStrategicForestMaskReady()) return null;
    return POTENTIAL_BY_RESOLVE_BIOME[queryStrategicForestBiome(lat, lng)] ?? 0;
}

/** 据点开垦圈程度 0–CLEARING_MAX；elev 为该点海拔（米），未知按平地 */
function cityClearingAt(lat: number, lng: number, elev: number | null): number {
    const buckets = ensureCityBuckets();
    const row = Math.floor(lat / BUCKET_DEG);
    const col = Math.floor(lng / BUCKET_DEG);
    let keep = 1;
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            const arr = buckets.get(`${row + dr},${col + dc}`);
            if (!arr) continue;
            for (const c of arr) {
                const d = Math.hypot(lat - c.lat, (lng - c.lng) * Math.cos(lat * Math.PI / 180));
                if (d >= c.r) continue;
                const t = d <= c.r * CLEARING_CORE ? 1 : 1 - (d - c.r * CLEARING_CORE) / (c.r * (1 - CLEARING_CORE));
                keep *= 1 - CLEARING_MAX * t;
            }
        }
    }
    let clearing = 1 - keep;
    if (elev !== null && elev > 1000) clearing *= 1 - 0.6 * Math.min(1, (elev - 1000) / 800);
    return Math.min(CLEARING_MAX, clearing);
}

/**
 * HYDE 开垦比例 → 砍伐程度的倍数：耕地牧场之外还有薪柴采伐、放牧、休耕、村落，三成农田的地方看上去已是开阔农耕地；
 * 专门重建古代砍伐的 KK10（Kaplan 2011）给出的砍伐也明显高于 HYDE 耕地数字。2026-10-31 按离线对比定 3。
 */
const LAND_USE_TO_CLEARING = 3;
/** 砍伐上限（再密的农耕区仍有林带、坟林、村树） */
const LAND_USE_CLEARING_MAX = 0.95;

/** 开垦程度 0–1 = 历史土地利用 ⊕ 据点开垦圈；year 为游戏年份（负数 = 公元前） */
export function landClearingAt(lat: number, lng: number, year: number, elev: number | null = null): number {
    const used = Math.min(LAND_USE_CLEARING_MAX, (queryLandUseFraction(lat, lng, year) ?? 0) * LAND_USE_TO_CLEARING);
    return 1 - (1 - used) * (1 - cityClearingAt(lat, lng, elev));
}

/** 实际森林程度 0–1 = 潜在 × (1 − 开垦)；掩膜未载入返回 null */
export function forestCoverAt(lat: number, lng: number, year: number, elev: number | null = null): number | null {
    const potential = forestPotentialAt(lat, lng);
    if (potential === null) return null;
    if (potential <= 0) return 0;
    return potential * (1 - landClearingAt(lat, lng, year, elev));
}

/** 战略图「成片森林」门槛：实际森林程度低于此值的显示为开阔农耕 / 草地（农林混杂不画成林海） */
export const FOREST_COVER_THRESHOLD = 0.4;

/** 森林模型数据（潜在植被 + 史实开垦两张掩膜）都已载入 */
export function forestModelReady(): boolean {
    return isStrategicForestMaskReady() && isLandUseMaskReady();
}

/**
 * 战术战场模板树木保留比例（与战略图同源）：天然无林处返回 1（DE 模板本就稀疏，不动）；
 * 天然有林处 = 35% + 65% × min(1, 实际森林 ÷ 0.7)——城边农耕区约留四成，深山老林全留。
 * 模型未就绪返回 1（不疏伐）。
 */
export function tacticalTreeKeepRatio(lat: number, lng: number, year: number, elev: number | null = null): number {
    if (!forestModelReady()) return 1;
    const potential = forestPotentialAt(lat, lng) ?? 0;
    if (potential <= 0) return 1;
    const cover = forestCoverAt(lat, lng, year, elev) ?? potential;
    return 0.35 + 0.65 * Math.min(1, cover / 0.7);
}
