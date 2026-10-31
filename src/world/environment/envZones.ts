/**
 * 环境区：自然轴「分类层」的唯一入口（口径见 docs/AGENTS/environment-architecture.md）。
 *
 * 任何图层要知道「这里属于哪个自然区」，只能调 envZoneAt()；图层代码里不再自写纬度 / 经度框。
 *
 * ⚠️ 当前是**临时判区**：柯本气候＋坐标近似（2026-10-31 按 1175 个据点试算定的规则）。
 *    RESOLVE 生态区数据烘焙好之后，只替换 classify() 的实现，区的编号和含义不变，调用方不用改。
 */
import { koppenClassIdAt } from '../../data/KoppenGeigerGrid';

/** 核心范围 15 区（欧亚＋北非，覆盖 95.7% 据点）＋外围 7 区（保证全球任一坐标都有归属）。 */
export type EnvZone =
    | 'TIB' | 'SWM' | 'SEA' | 'SAS' | 'EAS' | 'NCP' | 'LOE' | 'NEB'
    | 'STP' | 'CAD' | 'WAH' | 'HDS' | 'MED' | 'WEU' | 'CEU'
    | 'ARC' | 'SIB' | 'NAM' | 'NEO' | 'AND' | 'AFR' | 'AUS';

export const ENV_ZONE_NAMES: Readonly<Record<EnvZone, string>> = {
    TIB: '青藏高寒', SWM: '西南山地', SEA: '东南亚热带', SAS: '南亚季风',
    EAS: '东亚亚热带', NCP: '华北平原—朝鲜', LOE: '黄土高原', NEB: '东北寒温带',
    STP: '欧亚草原', CAD: '中亚冷荒漠', WAH: '西亚高原草原', HDS: '西亚北非热荒漠',
    MED: '地中海', WEU: '西欧温带林', CEU: '中东欧大陆林',
    ARC: '北极海岸', SIB: '北亚泰加', NAM: '北美', NEO: '中美—亚马孙',
    AND: '南美南部', AFR: '撒哈拉以南非洲', AUS: '澳洲',
};

/**
 * 环境区所属生物地理大区（与 DE 主题名前缀同一口径）。
 * 东亚亚热带的主体是江南与西日本（古北界，日本全境属古北界），只有北纬 24.5° 以南的岭南属东洋界，
 * 岭南在主题对应表（Scene13DeMapThemes.themeIdForZone）里单独给热带主题。
 */
export const ENV_ZONE_REALM: Readonly<Record<EnvZone, 'palaearctic' | 'indomalayan' | 'nearctic' | 'neotropical' | 'afrotropical' | 'australasian'>> = {
    TIB: 'palaearctic', SWM: 'palaearctic', SEA: 'indomalayan', SAS: 'indomalayan',
    EAS: 'palaearctic', NCP: 'palaearctic', LOE: 'palaearctic', NEB: 'palaearctic',
    STP: 'palaearctic', CAD: 'palaearctic', WAH: 'palaearctic', HDS: 'palaearctic',
    MED: 'palaearctic', WEU: 'palaearctic', CEU: 'palaearctic',
    ARC: 'palaearctic', SIB: 'palaearctic', NAM: 'nearctic', NEO: 'neotropical',
    AND: 'neotropical', AFR: 'afrotropical', AUS: 'australasian',
};

/**
 * 各环境区野生动物多寡系数（1 = 基准密度）。
 * 🔴 2026-10-31 主人令「注意每个区域动物的数量」：DE 236 张战役原图陆地动物密度各图差很大
 *    （每万陆地格 10% 分位 0、中位 12.6、90% 分位 30.7），按现实生物量定：
 *    草原、稀树草原、北方林地多；荒漠、高寒、北极少；千年农耕的稠密平原（华北、黄土）大型野兽少。
 */
export const ENV_ZONE_FAUNA_DENSITY: Readonly<Record<EnvZone, number>> = {
    TIB: 0.6, SWM: 1.0, SEA: 1.0, SAS: 1.0, EAS: 0.85, NCP: 0.7, LOE: 0.6, NEB: 1.3,
    STP: 1.3, CAD: 0.4, WAH: 0.7, HDS: 0.35, MED: 0.8, WEU: 0.9, CEU: 1.1,
    ARC: 0.9, SIB: 1.0, NAM: 1.3, NEO: 1.2, AND: 0.8, AFR: 1.5, AUS: 0.8,
};

/** KoppenGeigerGrid 的 1–30 类编号顺序 */
const KOPPEN_CODES: readonly string[] = [
    '', 'Af', 'Am', 'Aw', 'BWh', 'BWk', 'BSh', 'BSk',
    'Csa', 'Csb', 'Csc', 'Cwa', 'Cwb', 'Cwc', 'Cfa', 'Cfb', 'Cfc',
    'Dsa', 'Dsb', 'Dsc', 'Dsd', 'Dwa', 'Dwb', 'Dwc', 'Dwd', 'Dfa', 'Dfb', 'Dfc', 'Dfd', 'ET', 'EF',
];

function classify(lat: number, lng: number): EnvZone {
    let k = KOPPEN_CODES[koppenClassIdAt(lat, lng) ?? 0] ?? '';
    // 高山苔原 ET / 冰原 EF 只有在亚洲高原框内才算青藏；挪威山地、阿尔卑斯、高加索、天山的高山按寒温带归区
    const asianPlateau = lat >= 25 && lat <= 42 && lng >= 60 && lng <= 105;
    if ((k === 'ET' || k === 'EF') && !asianPlateau) k = 'Dfc';
    const dry = k.startsWith('B');

    // ── 外围 ──
    if (lat >= 64) return 'ARC';
    if (lng < -30) return lat >= 23 ? 'NAM' : lat > -23 ? 'NEO' : 'AND';
    if (lat < -10 && lng >= 110) return 'AUS';
    if (lng > -20 && lng < 52 && (lat < 12 || (lat < 16 && lng >= 33 && lng < 42.5 && !k.startsWith('BW')))) {
        if (!(lng >= 42.5 && lat >= 12)) return 'AFR';   // 阿拉伯半岛南端不算非洲
    }
    if (lat >= 50 && lng >= 115) return k.startsWith('D') || k.startsWith('E') ? 'NEB' : 'STP';
    if (lat >= 55 && lng >= 60) return 'SIB';

    // ── 核心 15 区 ──
    const plateauClimate = ['ET', 'EF', 'Dwb', 'Dwc', 'Dwd', 'Dsb', 'Dsc', 'Cwb', 'Cwc', 'BSk'].includes(k) || (k === 'BWk' && lat < 35.5);
    if (k === 'ET' || k === 'EF' || (lat >= 27.5 && lat <= 39 && lng >= 78 && lng <= 102 && plateauClimate)) return 'TIB';
    if (lng >= 97 && lng <= 104.5 && lat >= 21.5 && lat <= 31 && /^(Cw|Dw|Cfb)/.test(k)) return 'SWM';
    if ((lng >= 92 && lat < 23) || (lng >= 92 && lng < 97.5 && lat < 28)) return 'SEA';
    if (lng >= 60 && lng < 92 && lat < 34) {
        if (k === 'BWh') return 'HDS';
        if (dry && k !== 'BSh') return 'WAH';
        return 'SAS';
    }
    if (lng >= 103 && !(dry && lat >= 41)) {
        if (lng >= 139.3 && lat > 41.3) return 'NEB';                          // 北海道
        if (lng >= 129.7 && lat >= 30) return k.startsWith('Cf') ? 'EAS' : 'NCP';   // 日本列岛
        if (lat < 32.5) return 'EAS';                                            // 秦岭—淮河以南
        if (lat >= 41 && k.startsWith('D') && lng >= 120) return 'NEB';
        if (lng < 114 && lat >= 34 && lat < 40.5) return 'LOE';
        return 'NCP';
    }
    if (k === 'BWh' || k === 'BSh') return 'HDS';
    if (k === 'BWk') return 'CAD';
    if (k === 'BSk' || k.startsWith('Ds')) {
        if (lng < 26 && lat < 45) return 'MED';
        if (lng >= 26 && lng < 75 && lat < 43) return 'WAH';
        return 'STP';
    }
    if (k.startsWith('Cs')) return 'MED';
    if (lng < 60 && (k.startsWith('Cf') || k.startsWith('Cw'))) return lng >= 26 && lat < 43 ? 'WAH' : 'WEU';
    if (k.startsWith('D') && lng >= 26 && lng < 60 && lat < 43) return 'WAH';   // 高加索、安纳托利亚东部山地
    if (k.startsWith('D') && lng < 60) return 'CEU';
    if (k.startsWith('D')) return 'STP';
    if (k.startsWith('A')) return lng >= 92 ? 'SEA' : lng >= 60 ? 'SAS' : 'AFR';
    return lng >= 60 ? 'STP' : 'WEU';
}

const cache = new Map<number, EnvZone>();

/** 坐标 → 环境区（按 0.1° 格缓存；同一格战略、战术查到的一定相同）。 */
export function envZoneAt(lat: number, lng: number): EnvZone {
    const key = Math.round((lat + 90) * 10) * 4000 + Math.round((lng + 180) * 10);
    let zone = cache.get(key);
    if (!zone) {
        zone = classify(Math.round(lat * 10) / 10, Math.round(lng * 10) / 10);
        if (cache.size > 200000) cache.clear();
        cache.set(key, zone);
    }
    return zone;
}

/** 岛屿例外（例外表用）：同一环境区里，岛上缺某些物种（日本、台湾、斯里兰卡无虎）。 */
export type EnvIsland = 'JAPAN' | 'TAIWAN' | 'SRI_LANKA';

export function envIslandAt(lat: number, lng: number): EnvIsland | null {
    if ((lat >= 30.5 && lat <= 41.6 && lng >= 129.7 && lng <= 142.1)
        || (lat > 41.3 && lat <= 46 && lng >= 139.3 && lng <= 146)
        || (lat >= 24 && lat < 30.5 && lng >= 122.5 && lng <= 131.5)
        || (lat >= 34.0 && lat <= 34.75 && lng >= 129.1 && lng <= 129.55)
        || (lat >= 32.5 && lat <= 33.4 && lng >= 128.5 && lng <= 129.2)) return 'JAPAN';
    if (lat >= 21.8 && lat <= 25.4 && lng >= 119.9 && lng <= 122.1) return 'TAIWAN';
    if (lat >= 5.8 && lat <= 9.9 && lng >= 79.5 && lng <= 82) return 'SRI_LANKA';
    return null;
}
