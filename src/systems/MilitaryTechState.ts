/**
 * 【军事科技 · 应用层】把已解锁的科技叠加到兵种五维上。
 *
 * 作用范围：**只影响 13 战斗模式**（`Scene13WarLayer` 的 `WAR_TYPES`）。
 * 大地图八环的 `sideBasePower` 只吃「兵力 × 文化系数」，根本不读兵种属性，所以这里改不到它。
 *
 * 🔴 **每一方按自己的文化区算**：科技有文化门控（板甲只给拉丁/日耳曼、安息战术只给草原系…），
 *    所以同一个兵种在攻守两方手里数值可能不同 —— 必须按 side 分表，不能全局改 WAR_TYPES。
 * 🔴 **绝不原地改 WAR_TYPES**：那是基础档（未含任何科技的 DE 原值），一旦被就地修改，
 *    下一场战斗会在已加成的值上再加一次，逐场累积爆表。这里一律返回新对象。
 *
 * 单位换算（DE → 我们）：
 *   · range / los 在 DE 以「格」计，落到 `rng` 要 **×40 像素**（与射程、视野同一换算）
 *   · reload 是乘区（拇指环 ×0.85 = 装填变快）
 */

import { MILITARY_TECHS, type MilitaryTech, type TechEra } from '../data/MilitaryTechs';
import { getUnitClass } from '../data/UnitClasses';
import { GameConfig } from '../config/GameConfig';
import type { RegionType } from './RegionSystem';

/** DE 一格 = 40px（与 SIGHT_MAP / rng 同一换算） */
const TILE_PX = 40;

/** 兵种五维里科技会碰的字段（与 Scene13WarLayer 的 WarType 结构对齐，只取需要的部分） */
export interface TechModifiableStats {
    hp: number;
    atk: number;
    meleeArmor: number;
    pierceArmor: number;
    rng: number;
    reload: number;
    spd: number;
    dmgType: 'melee' | 'pierce';
    /** 加成伤害（护甲类 → 额外攻击）；科技可叠（帕提亚对长枪+2 / 攻城技师对建筑×1.2） */
    bonus?: Record<number, number>;
}

const TECH_CULTURE_PARENT: Partial<Record<RegionType, RegionType>> = {
    BURMESE: 'MALAY',
    EGYPT: 'WEST_ASIA',
    CARTHAGE: 'BERBER',
    BABYLON: 'WEST_ASIA',
    HITTITES: 'WEST_ASIA',
    ASSYRIAN: 'WEST_ASIA',
    SCYTHIANS: 'STEPPE',
    BYZANTINE: 'LATIN',
    FRANKS: 'GERMANIC',
    SASANIAN: 'PERSIAN',
    TURKS: 'STEPPE',
    NANZHAO: 'MALAY',
    SRIVIJAYA: 'MALAY',
    KUSHAN: 'CENTRAL_ASIA',
    KUSH: 'AFRICA',
    PRE_QIN: 'CENTRAL',
    // 🔴 [主人定·时间划分] 时代细分区（_ANTIQUITY/_FEUDAL/_CASTLE/_IMPERIAL）→ 父大区。
    //    原来没映射，这些区查不到父文化，只领到 5 条全区通用科技（「科技少」的根因）。
    SLAVIC_FEUDAL: 'SLAVIC', SLAVIC_CASTLE: 'SLAVIC', SLAVIC_IMPERIAL: 'SLAVIC',
    GERMANIC_FEUDAL: 'GERMANIC', GERMANIC_CASTLE: 'GERMANIC', GERMANIC_IMPERIAL: 'GERMANIC',
    LATIN_FEUDAL: 'LATIN', LATIN_CASTLE: 'LATIN', LATIN_IMPERIAL: 'LATIN',
    WEST_ASIA_ANTIQUITY: 'WEST_ASIA', WEST_ASIA_CASTLE: 'WEST_ASIA',
    CELTS_FEUDAL: 'LATIN',
    JAPAN_ANTIQUITY: 'JAPAN', JAPAN_IMPERIAL: 'JAPAN',
    HUAXIA_IMPERIAL: 'CENTRAL',
    CENTRAL_ASIA_ANTIQUITY: 'CENTRAL_ASIA', CENTRAL_ASIA_CASTLE: 'CENTRAL_ASIA', CENTRAL_ASIA_IMPERIAL: 'CENTRAL_ASIA',
    STEPPE_ANTIQUITY: 'STEPPE', STEPPE_FEUDAL: 'STEPPE', STEPPE_IMPERIAL: 'STEPPE',
    TIBET_CASTLE: 'TIBET', TIBET_IMPERIAL: 'TIBET',
    WESTERN_FEUDAL: 'WESTERN', WESTERN_CASTLE: 'WESTERN', WESTERN_IMPERIAL: 'WESTERN',
    AFRICA_ANTIQUITY: 'AFRICA', AFRICA_CASTLE: 'AFRICA', AFRICA_IMPERIAL: 'AFRICA',
    PERSIAN_CASTLE: 'PERSIAN',
    SEASIA_ANTIQUITY: 'MALAY', SEASIA_FEUDAL: 'MALAY', SEASIA_CASTLE: 'MALAY', SEASIA_IMPERIAL: 'MALAY',
    NORTHAM_IMPERIAL: 'AMERICA',
    SOUTHAM_IMPERIAL: 'ANDE',
    ORIE_ANTIQUITY: 'ORIE',
    INDIA_FEUDAL: 'INDIA', INDIA_CASTLE: 'INDIA', INDIA_IMPERIAL: 'INDIA',
    // 🔴 [补全] 其余具体文化 → 父大区（原来这些区不在任何科技 cultures 表里，只领到 4~7 条通用科技）
    HEBREWS: 'WEST_ASIA', WUSUN: 'WESTERN', QIANG: 'TIBET', NABATAEANS: 'ORIE',
    MACEDONIAN: 'GREEK', HELLENIC: 'GREEK', GREEK_MERCENARY: 'GREEK', MAGNA_GRAECIA: 'GREEK',
    ACHAEMENIDS: 'PERSIAN', AMAZONS: 'ANDE', GOJOSEON: 'KOREA', IMPERIAL_ROME: 'LATIN',
    KHITAN: 'NORTHEAST', UIGHUR: 'STEPPE', MOHE: 'NORTHEAST', ANGLO_SAXON: 'GERMANIC',
    GHANA: 'AFRICA', KHAZARS: 'STEPPE', VANDALS: 'GERMANIC', LOMBARDS: 'GERMANIC',
    ROURAN: 'STEPPE', SOGDIANS: 'CENTRAL_ASIA', HEPHTHALITES: 'CENTRAL_ASIA', AINU: 'JAPAN',
    YARLUNG: 'TIBET', RUS: 'SLAVIC',
    PASHTUN: 'CENTRAL_ASIA', TANGUT: 'TIBET', JAVANESE: 'MALAY', JURCHEN: 'NORTHEAST',
    SELJUQ: 'CENTRAL_ASIA', SONG: 'CENTRAL', GORYEO: 'KOREA', JOSEON: 'KOREA', MING: 'CENTRAL',
    DALI: 'CENTRAL', MAMLUKS: 'ORIE', CRUSADERS: 'LATIN', KARA_KHITAN: 'CENTRAL_ASIA',
    TIMURID: 'CENTRAL_ASIA', DELHI: 'INDIA', CASTILE: 'LATIN', SCOTLAND: 'GERMANIC',
    HRE: 'GERMANIC', ALMOHAD: 'BERBER', SERBIA: 'SLAVIC', ILKHANATE: 'PERSIAN', ARAGON: 'LATIN',
    CHIMU: 'ANDE', TARASCAN: 'AMERICA', TAIRONA: 'ANDE',
    OTTOMAN: 'WEST_ASIA', FRENCH: 'LATIN', SWEDISH: 'GERMANIC', MANCHU: 'NORTHEAST',
    MUGHAL: 'INDIA', SAFAVID: 'PERSIAN', RUSSIAN: 'SLAVIC', SIKH: 'INDIA',
    IROQUOIS: 'AMERICA', TEHUELCHE: 'ANDE',
    // 🔴 [补全·通用科技按 16 大区] 通用科技 cultures 表精简后，这些子文化统一继承父大区
    BRITONS: 'GERMANIC', GOTHS: 'GERMANIC', TEUTONS: 'GERMANIC', VIKINGS: 'GERMANIC',
    HUNS: 'STEPPE', CUMAN: 'STEPPE',
    ITALIANS: 'LATIN', SICILIANS: 'LATIN', BURGUNDIANS: 'LATIN', SPANISH: 'LATIN', PORTUGUESE: 'LATIN',
    BULGARIANS: 'SLAVIC', MAGYAR: 'SLAVIC', LITHUANIANS: 'SLAVIC', POLES: 'SLAVIC', BOHEMIANS: 'SLAVIC',
    ETHIOPIANS: 'AFRICA',
    BENGALIS: 'INDIA', GURJARAS: 'INDIA',
    VIETNAMESE: 'MALAY', KHMER: 'MALAY',
    MAYANS: 'AMERICA',
    MAPUCHE: 'ANDE', MUISCA: 'ANDE', TUPI: 'ANDE',
    ARMENIANS: 'WEST_ASIA', GEORGIANS: 'WEST_ASIA',
    THRACIAN: 'GREEK',
};

/** 时代顺序：古典 < 封建 < 城堡 < 帝国 */
const ERA_ORDER: readonly TechEra[] = ['antiquity', 'feudal', 'castle', 'imperial'];

/**
 * 各文化区（二层具体文化）的巅峰时代 —— 🔴 主人定「时间划分」：
 *   古典只能用古典；封建用古典+封建；城堡用古典+封建+城堡；帝国用全部时代。
 * 未列出的 = 一层大区（拉丁/日耳曼/华夏…时代无关）→ 归帝国（可用全部时代）。
 */
const REGION_ERA: Partial<Record<RegionType, TechEra>> = {
    // 古典（–400）
    GREEK: 'antiquity', THRACIAN: 'antiquity', PERSIAN: 'antiquity',
    ASSYRIAN: 'antiquity', BABYLON: 'antiquity', HITTITES: 'antiquity',
    EGYPT: 'antiquity', CARTHAGE: 'antiquity', SCYTHIANS: 'antiquity',
    MAYANS: 'antiquity', MACEDONIAN: 'antiquity', HELLENIC: 'antiquity',
    IMPERIAL_ROME: 'antiquity', GREEK_MERCENARY: 'antiquity', MAGNA_GRAECIA: 'antiquity',
    ACHAEMENIDS: 'antiquity', PRE_QIN: 'antiquity', GOJOSEON: 'antiquity',
    HUNS: 'antiquity', KUSH: 'antiquity', KUSHAN: 'antiquity', HEBREWS: 'antiquity',
    NABATAEANS: 'antiquity', AMAZONS: 'antiquity', PURU: 'antiquity', WUSUN: 'antiquity', QIANG: 'antiquity',
    // 封建（400–1050）
    FRANKS: 'feudal', GOTHS: 'feudal', VIKINGS: 'feudal', BULGARIANS: 'feudal',
    CUMAN: 'feudal', TURKS: 'feudal', ANGLO_SAXON: 'feudal', GHANA: 'feudal',
    KHAZARS: 'feudal', VANDALS: 'feudal', LOMBARDS: 'feudal', ROURAN: 'feudal',
    SOGDIANS: 'feudal', KHITAN: 'feudal', UIGHUR: 'feudal', MOHE: 'feudal',
    SASANIAN: 'feudal', BYZANTINE: 'feudal', NANZHAO: 'feudal', SRIVIJAYA: 'feudal',
    YARLUNG: 'feudal', HEPHTHALITES: 'feudal', AINU: 'feudal', RUS: 'feudal',
    // 城堡（1050–1500）
    TEUTONS: 'castle', ITALIANS: 'castle', SICILIANS: 'castle', MAGYAR: 'castle',
    LITHUANIANS: 'castle', POLES: 'castle', BOHEMIANS: 'castle', BURGUNDIANS: 'castle',
    BRITONS: 'castle', BENGALIS: 'castle', GURJARAS: 'castle', VIETNAMESE: 'castle',
    KHMER: 'castle', ARMENIANS: 'castle', GEORGIANS: 'castle', ETHIOPIANS: 'castle',
    BURMESE: 'castle', SONG: 'castle', GORYEO: 'castle', JOSEON: 'castle', MING: 'castle',
    DALI: 'castle', MAMLUKS: 'castle', CRUSADERS: 'castle', KARA_KHITAN: 'castle',
    TIMURID: 'castle', DELHI: 'castle', CASTILE: 'castle', SCOTLAND: 'castle',
    HRE: 'castle', ALMOHAD: 'castle', SERBIA: 'castle', ILKHANATE: 'castle',
    ARAGON: 'castle', TANGUT: 'castle', JURCHEN: 'castle', SELJUQ: 'castle',
    JAVANESE: 'castle', CHIMU: 'castle', TARASCAN: 'castle', TAIRONA: 'castle', PASHTUN: 'castle',
    // 帝国（1500–1900）
    SPANISH: 'imperial', PORTUGUESE: 'imperial', MAPUCHE: 'imperial', MUISCA: 'imperial',
    TUPI: 'imperial', OTTOMAN: 'imperial', FRENCH: 'imperial', SWEDISH: 'imperial',
    MANCHU: 'imperial', MUGHAL: 'imperial', SAFAVID: 'imperial', RUSSIAN: 'imperial',
    SIKH: 'imperial', IROQUOIS: 'imperial', TEHUELCHE: 'imperial',
};

/** 取某文化区的时代（时间划分门控用）：时代后缀区直取后缀，二层文化查表，其余（一层大区）归帝国。 */
export function regionEra(region: RegionType): TechEra {
    if (region.endsWith('_ANTIQUITY')) return 'antiquity';
    if (region.endsWith('_FEUDAL')) return 'feudal';
    if (region.endsWith('_CASTLE')) return 'castle';
    if (region.endsWith('_IMPERIAL')) return 'imperial';
    return REGION_ERA[region] ?? 'imperial';
}

/** 取某年、某文化区已解锁的科技 */
export function unlockedTechs(year: number, culture: RegionType): MilitaryTech[] {
    // 乱斗模式（历史脚本关闭）→ 科技全开，不做年份门控；历史脚本开启后按年份逐步开放。
    const timeGated = GameConfig.SYSTEM.ENABLE_HISTORICAL_EVENTS;
    const techCulture = TECH_CULTURE_PARENT[culture] ?? culture;
    // 🔴 [主人定·时间划分] 文化自己的时代决定科技上限：古典只能用古典、封建+古典、城堡+前三、帝国=全部。
    const maxEraIdx = ERA_ORDER.indexOf(regionEra(culture));
    return MILITARY_TECHS.filter((t) => {
        if (timeGated && t.year !== null && year < t.year) return false;
        if (ERA_ORDER.indexOf(t.era) > maxEraIdx) return false;
        if (t.cultures === null) return true;   // 全区通用
        // 🔴 专属科技（cultures 是 1~3 个小文化区）按原始文化精确匹配；通用科技按父大区匹配。
        if (t.cultures.length <= 3) return t.cultures.includes(culture) || t.cultures.includes(techCulture);
        return t.cultures.includes(techCulture);
    });
}

/** 文化专属独特科技（cultures 是 1~3 个小文化区）= 必选；通用科技的 cultures 是 null 或 20+ 大表。 */
function isCultureUnique(t: MilitaryTech): boolean {
    return t.cultures !== null && t.cultures.length <= 3;
}

/** FNV-1a 字符串哈希 → 32 位整数（确定性） */
function hashSeed(seed: string): number {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

/** mulberry32 确定性伪随机（同一种子同序列） */
function mulberry32(a: number): () => number {
    return () => {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * 从某文化+时代的科技池子里，给**一支军团**抽最多 **10 条**科技：
 *   · 文化专属独特科技 → 必选（保住「特色」）
 *   · 其余通用科技 → 按军团种子确定性随机补齐到 10 条
 *   · 池子不足 10 条就全给（早期时代文化科技本来就少，不会因此吃亏）
 * 🔴 主人定「每个军团只能随机 10 条科技、该文化专属为必选」——
 *    解决「帝国继承全部科技、条数碾压古典」的不公平。种子 = 军团势力，同军团每次结果一致。
 */
export function selectLegionTechs(year: number, culture: RegionType, seed: string): MilitaryTech[] {
    const pool = unlockedTechs(year, culture);
    const mandatory = pool.filter(isCultureUnique);
    const rest = pool.filter((t) => !isCultureUnique(t));
    const target = Math.min(10, pool.length);
    const need = Math.max(0, target - mandatory.length);
    const rnd = mulberry32(hashSeed(seed));
    const shuffled = rest.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const picked = shuffled.slice(0, need);
    const byEra = (a: MilitaryTech, b: MilitaryTech) =>
        ERA_ORDER.indexOf(a.era) - ERA_ORDER.indexOf(b.era) || a.id.localeCompare(b.id);
    return [...mandatory, ...picked].sort(byEra);
}

/**
 * 把科技叠到一个兵种的五维上，返回**新对象**（不改入参）。
 * @param base     该兵种的基础档（WAR_TYPES 原值）
 * @param key      兵种 key（用于查 unit class）
 * @param techs    该方已解锁的科技
 * @param sightPx  该兵种的视野（px）；给了才会返回 sight
 */
export function applyTechsToStats<T extends TechModifiableStats>(
    base: T, key: string, techs: readonly MilitaryTech[], sightPx?: number,
): T & { sight?: number } {
    const cls = getUnitClass(key);
    const out: T & { sight?: number } = { ...base };
    // 🔴 深拷贝 bonus：科技会往 bonus 上叠（帕提亚/攻城技师），浅拷贝会改到 WAR_TYPES 基础档。
    if (base.bonus) out.bonus = { ...base.bonus };
    if (sightPx !== undefined) out.sight = sightPx;

    for (const tech of techs) {
        for (const e of tech.effects) {
            if (!e.classes.includes(cls)) continue;
            switch (e.attr) {
                case 'meleeAttack':
                    // 近战攻击只加给近战伤害型的兵（DE 的攻击是按装甲类分的）
                    if (base.dmgType === 'melee') out.atk = e.op === 'mul' ? out.atk * e.value : out.atk + e.value;
                    break;
                case 'pierceAttack':
                    if (base.dmgType === 'pierce') out.atk = e.op === 'mul' ? out.atk * e.value : out.atk + e.value;
                    break;
                case 'meleeArmor':
                    out.meleeArmor = e.op === 'mul' ? out.meleeArmor * e.value : out.meleeArmor + e.value;
                    break;
                case 'pierceArmor':
                    out.pierceArmor = e.op === 'mul' ? out.pierceArmor * e.value : out.pierceArmor + e.value;
                    break;
                case 'hp':
                    out.hp = e.op === 'mul' ? out.hp * e.value : out.hp + e.value;
                    break;
                case 'speed':
                    out.spd = e.op === 'mul' ? out.spd * e.value : out.spd + e.value;
                    break;
                case 'reload':
                    // 装填是「越小越快」，乘区 <1 即提速
                    out.reload = e.op === 'mul' ? out.reload * e.value : out.reload + e.value;
                    break;
                case 'range':
                    // 🔴 DE 以格计 → ×40 像素。只给本来就是远程的兵加（近战 rng=0 不该凭空长出射程）
                    if (base.rng > 0) out.rng = e.op === 'mul' ? out.rng * e.value : out.rng + e.value * TILE_PX;
                    break;
                case 'los':
                    if (out.sight !== undefined) {
                        out.sight = e.op === 'mul' ? out.sight * e.value : out.sight + e.value * TILE_PX;
                    }
                    break;
                case 'bonus': {
                    // 加成伤害叠加：add 直接加，mul 放大已有加成（攻城技师对建筑×1.2）
                    const bc = e.bonusClass;
                    if (bc === undefined) break;
                    if (!out.bonus) out.bonus = {};
                    const cur = out.bonus[bc] ?? 0;
                    out.bonus[bc] = e.op === 'mul' ? cur * e.value : cur + e.value;
                    break;
                }
            }
        }
    }
    return out;
}

/**
 * 【面板用】把已解锁科技汇总成「效果」短语，而不是科技名。
 *
 * 🔴 主人 2026-08-18 定：**科技效果要体现**。面板列「锁子甲·板甲·板甲马铠」观众读不出强弱，
 *    列「甲 步+3/4」才知道到底强了多少。所以面板显示的是**累计数值增量**，名字只留独有那几条。
 *
 * 护甲按 unit class 分三路统计（步6 / 骑12 / 射0）——它们的门控不同，不能合成一个数。
 */
export function summarizeTechEffects(techs: readonly MilitaryTech[]): string[] {
    let meleeAtk = 0, pierceAtk = 0, range = 0;
    const arm = { 6: [0, 0], 12: [0, 0], 0: [0, 0], 13: [0, 0] } as Record<number, [number, number]>;
    let spdMul = 1, reloadMul = 1, hp = 0, hpMul = 1;
    for (const t of techs) {
        for (const e of t.effects) {
            const hit = (...classes: number[]) => classes.some(c => e.classes.includes(c));
            switch (e.attr) {
                case 'meleeAttack': meleeAtk += e.value; break;
                case 'pierceAttack': pierceAtk += e.value; break;
                case 'range': range += e.value; break;
                case 'meleeArmor':
                    if (hit(6, 46)) arm[6][0] += e.value;
                    else if (hit(12, 47)) arm[12][0] += e.value;
                    else if (hit(0, 23, 36, 44, 52)) arm[0][0] += e.value;
                    else if (hit(13, 55)) arm[13][0] += e.value;
                    break;
                case 'pierceArmor':
                    if (hit(6, 46)) arm[6][1] += e.value;
                    else if (hit(12, 47)) arm[12][1] += e.value;
                    else if (hit(0, 23, 36, 44, 52)) arm[0][1] += e.value;
                    else if (hit(13, 55)) arm[13][1] += e.value;
                    break;
                case 'speed': spdMul *= e.op === 'mul' ? e.value : 1; break;
                case 'reload': reloadMul *= e.op === 'mul' ? e.value : 1; break;
                case 'hp':
                    if (e.op === 'mul') hpMul *= e.value;
                    else hp += e.value;
                    break;
            }
        }
    }
    const out: string[] = [];
    if (meleeAtk) out.push(`近战+${meleeAtk}`);
    if (pierceAtk) out.push(`远攻+${pierceAtk}`);
    if (range) out.push(`射程+${range}`);
    const armTag = (c: number, label: string) => {
        const [m, p] = arm[c];
        if (m || p) out.push(`${label}甲+${m}/${p}`);
    };
    armTag(6, '步'); armTag(12, '骑'); armTag(0, '射'); armTag(13, '器');
    if (hp) out.push(`血+${hp}`);
    if (hpMul !== 1) out.push(`血+${Math.round((hpMul - 1) * 100)}%`);
    if (spdMul !== 1) out.push(`速+${Math.round((spdMul - 1) * 100)}%`);
    if (reloadMul !== 1) out.push(`填+${Math.round((1 - reloadMul) * 100)}%`);
    return out;
}

const BONUS_TARGET_NAMES: Record<number, string> = {
    21: '建', 11: '建',
    8: '骑',
    1: '步',
    15: '射',
    27: '枪',
    30: '驼',
    31: '兵',
};

/** 把单个科技提炼成对应效果简述（如 "近战+1", "步甲+1/1", "远攻+1 射程+1"） */
export function summarizeSingleTechEffect(t: MilitaryTech): string {
    const parts: string[] = [];
    let meleeAtk = 0, pierceAtk = 0, range = 0, los = 0;
    const arm = { 6: [0, 0], 12: [0, 0], 0: [0, 0], 13: [0, 0] } as Record<number, [number, number]>;
    let spdMul = 1, reloadMul = 1, hp = 0, hpMul = 1;
    const bonusParts: string[] = [];

    for (const e of t.effects) {
        const hit = (...classes: number[]) => classes.some(c => e.classes.includes(c));
        switch (e.attr) {
            case 'meleeAttack': meleeAtk += e.value; break;
            case 'pierceAttack': pierceAtk += e.value; break;
            case 'range': range += e.value; break;
            case 'los': los += e.value; break;
            case 'meleeArmor':
                if (hit(6, 46)) arm[6][0] += e.value;
                else if (hit(12, 47)) arm[12][0] += e.value;
                else if (hit(0, 23, 36, 44, 52)) arm[0][0] += e.value;
                else if (hit(13, 55)) arm[13][0] += e.value;
                break;
            case 'pierceArmor':
                if (hit(6, 46)) arm[6][1] += e.value;
                else if (hit(12, 47)) arm[12][1] += e.value;
                else if (hit(0, 23, 36, 44, 52)) arm[0][1] += e.value;
                else if (hit(13, 55)) arm[13][1] += e.value;
                break;
            case 'speed': spdMul *= e.op === 'mul' ? e.value : 1; break;
            case 'reload': reloadMul *= e.op === 'mul' ? e.value : 1; break;
            case 'hp':
                if (e.op === 'mul') hpMul *= e.value;
                else hp += e.value;
                break;
            case 'bonus': {
                if (e.bonusClass !== undefined) {
                    const target = BONUS_TARGET_NAMES[e.bonusClass] ?? '特';
                    if (e.op === 'mul') {
                        bonusParts.push(`对${target}+${Math.round((e.value - 1) * 100)}%`);
                    } else {
                        bonusParts.push(`对${target}+${e.value}`);
                    }
                }
                break;
            }
        }
    }

    if (meleeAtk) parts.push(`近战+${meleeAtk}`);
    if (pierceAtk && range) parts.push(`远攻+${pierceAtk} 射程+${range}`);
    else {
        if (pierceAtk) parts.push(`远攻+${pierceAtk}`);
        if (range) parts.push(`射程+${range}`);
    }
    const armTag = (c: number, label: string) => {
        const [m, p] = arm[c];
        if (m || p) parts.push(`${label}甲+${m}/${p}`);
    };
    armTag(6, '步'); armTag(12, '骑'); armTag(0, '射'); armTag(13, '器');
    if (hp) parts.push(`血+${hp}`);
    if (hpMul !== 1) parts.push(`血+${Math.round((hpMul - 1) * 100)}%`);
    if (spdMul !== 1) parts.push(`速+${Math.round((spdMul - 1) * 100)}%`);
    if (reloadMul !== 1) parts.push(`填+${Math.round((1 - reloadMul) * 100)}%`);

    if (bonusParts.length > 0) {
        if (parts.length === 0 || t.id === 'siege_engineers') {
            parts.push(bonusParts[0]);
        }
    }

    if (parts.length === 0 && los) {
        parts.push(`视野+${los}`);
    }

    return parts.join(' ') || '生效';
}
