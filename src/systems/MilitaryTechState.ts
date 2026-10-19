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

import { MILITARY_TECHS, type MilitaryTech, type TechCulture, type TechEra } from '../data/MilitaryTechs';
import { getUnitClass } from '../data/UnitClasses';
import { GameConfig } from '../config/GameConfig';

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

/**
 * 66 种建筑文化（62 DE 文明 + 4 三级文化）→ 通用科技大区继承表。
 * 🔴 专属特殊科技（isCultureUnique）直接按 66 建筑文化精确匹配，不走此表；
 *    通用科技（铁匠铺/大学/马厩/靶场通用线）按此表继承所属文化圈的可用科技树。
 */
const TECH_CULTURE_PARENT: Record<string, TechCulture> = {
    // 66 建筑文化 → 通用科技大区
    ATHENIANS: 'GREEK',
    SPARTANS: 'GREEK',
    GREECE: 'GREEK',
    MACEDONIAN: 'GREEK',
    THRACIAN: 'GREEK',
    ROMA: 'LATIN',
    LATIN: 'LATIN',
    CELTS: 'LATIN',
    SICILIANS: 'LATIN',
    BURGUNDIANS: 'LATIN',
    SPANISH: 'LATIN',
    PORTUGUESE: 'LATIN',
    FRANKS: 'GERMANIC',
    GERMANIC: 'GERMANIC',
    BRITONS: 'GERMANIC',
    GOTHS: 'GERMANIC',
    SAXONS: 'GERMANIC',
    DANES: 'GERMANIC',
    VIKINGS: 'GERMANIC',
    VARANGIANS: 'SLAVIC',
    SLAVIC: 'SLAVIC',
    BULGARIANS: 'SLAVIC',
    MAGYAR: 'SLAVIC',
    LITHUANIANS: 'SLAVIC',
    POLES: 'SLAVIC',
    BOHEMIANS: 'SLAVIC',
    BYZANTINE: 'LATIN',
    ARMENIANS: 'WEST_ASIA',
    GEORGIANS: 'WEST_ASIA',
    TURKS: 'STEPPE',
    ORIE: 'ORIE',
    BERBER: 'BERBER',
    AFRICA: 'AFRICA',
    ETHIOPIANS: 'AFRICA',
    PERSIAN: 'PERSIAN',
    SASANIAN: 'PERSIAN',
    CENTRAL_ASIA: 'CENTRAL_ASIA',
    WESTERN: 'WESTERN',
    HUNS: 'STEPPE',
    CUMAN: 'STEPPE',
    MONGOL: 'STEPPE',
    MOBEI_MONGOL: 'STEPPE',
    YURT: 'STEPPE',
    KHITAN: 'NORTHEAST',
    XIANBEI: 'NORTHEAST',
    NORTHEAST: 'NORTHEAST',
    CENTRAL: 'CENTRAL',
    WEI: 'CENTRAL',
    BASHU: 'CENTRAL',
    JIANGNAN: 'JIANGNAN',
    TIBET: 'TIBET',
    KOREA: 'KOREA',
    JAPAN: 'JAPAN',
    VIETNAMESE: 'MALAY',
    KHMER: 'MALAY',
    BURMESE: 'MALAY',
    MALAY: 'MALAY',
    BENGALIS: 'INDIA',
    GURJARAS: 'INDIA',
    INDIA: 'INDIA',
    MUGHAL: 'INDIA',
    PURU: 'PURU',
    AMERICA: 'AMERICA',
    MAYANS: 'AMERICA',
    INCA: 'ANDE',
    MUISCA: 'ANDE',
    MAPUCHE: 'ANDE',
    TUPI: 'ANDE',
    // 旧区域名兼容映射
    STEPPE: 'STEPPE',
    NORTH: 'CENTRAL',
    HEXI: 'WESTERN',
    WEST_ASIA: 'ORIE',
    ANDE: 'ANDE',
    GREEK: 'GREEK',
    TEUTONS: 'GERMANIC',
    ITALIANS: 'LATIN',
    IMPERIAL_ROME: 'LATIN',
    CELTS_FEUDAL: 'LATIN',
    TIMURID: 'CENTRAL_ASIA',
    OTTOMAN: 'TURKS',
};

/** 旧区域键 → 66 建筑文化归一（兼容外部仍传旧 RegionType 的调用） */
const LEGACY_TO_66_CULTURE: Record<string, TechCulture> = {
    MOBEI_MONGOL: 'MONGOL',
    YURT: 'MONGOL',
    STEPPE: 'MONGOL',
    WEST_ASIA: 'ORIE',
    ANDE: 'INCA',
    TEUTONS: 'GERMANIC',
    ITALIANS: 'LATIN',
    IMPERIAL_ROME: 'ROMA',
    CELTS_FEUDAL: 'CELTS',
    GREEK: 'SPARTANS',
    NORTH: 'WEI',
    HEXI: 'KHITAN',
    TIMURID: 'CENTRAL_ASIA',
    OTTOMAN: 'TURKS',
};

/** 归一化为 66 建筑文化键 */
export function normalizeTechCulture66(culture: string): TechCulture {
    return (LEGACY_TO_66_CULTURE[culture] ?? culture) as TechCulture;
}

/** 时代顺序：古典 < 封建 < 城堡 < 帝国 */
const ERA_ORDER: readonly TechEra[] = ['antiquity', 'feudal', 'castle', 'imperial'];

/** 按真实历史年份映射所属四时代：古典 <476 / 封建 476–1049 / 城堡 1050–1499 / 帝国 ≥1500 */
export function yearToTechEra(year: number): TechEra {
    if (year < 476) return 'antiquity';
    if (year < 1050) return 'feudal';
    if (year < 1500) return 'castle';
    return 'imperial';
}

/** 当前是否处于按历史时代门控科技的模式（百岁模式 centenarian / 剧本模式 script） */
function isEraTimeGatedMode(): boolean {
    if (GameConfig.SYSTEM.ENABLE_HISTORICAL_EVENTS) return true;
    const g = (globalThis as { window?: { game?: { playerHero?: { autoPlan?: string } } } }).window?.game;
    const mode = g?.playerHero?.autoPlan;
    // 默认百岁模式（centenarian）与剧本模式（script）开启历史四时代科技门控；仅乱斗模式（melee）全放开
    return mode ? mode !== 'melee' : true;
}

/** 文化专属特殊科技（cultures 是 1~4 个 66 建筑文化）= 优先必选；通用科技的 cultures 是 null 或大区列表。 */
function isCultureUnique(t: MilitaryTech): boolean {
    return t.cultures !== null && t.cultures.length <= 4;
}

/** 取某年、某文化（66 建筑文化）已解锁的科技 */
export function unlockedTechs(year: number, culture: TechCulture): MilitaryTech[] {
    const timeGated = isEraTimeGatedMode();
    const c66 = normalizeTechCulture66(String(culture));
    const parentCulture = TECH_CULTURE_PARENT[c66] ?? TECH_CULTURE_PARENT[String(culture)] ?? c66;
    // 🔴 [2026-10-20 主人定·66 文化 + 优先本文化特殊科技 + 四时代通用科技门控]
    //    1) 本文化的 DE 特殊科技（isCultureUnique）始终优先解锁，确保每个文化在任何年份都首先体现自己的 DE 独有科技；
    //    2) 通用科技按当前历史年份所属四时代门控（古典 <476 只用古典通用科技；封建用古典+封建；城堡用古典+封建+城堡；帝国用全部时代）。
    const maxEraIdx = timeGated ? ERA_ORDER.indexOf(yearToTechEra(year)) : ERA_ORDER.length - 1;

    const matchCulture = (t: MilitaryTech): boolean => {
        if (t.cultures === null) return true;
        if (isCultureUnique(t)) {
            return t.cultures.includes(c66) || t.cultures.includes(culture);
        }
        return t.cultures.includes(parentCulture) || t.cultures.includes(c66);
    };

    const list = MILITARY_TECHS.filter((t) => {
        if (!matchCulture(t)) return false;
        // 本文化的特殊科技始终优先出现
        if (isCultureUnique(t)) return true;
        return ERA_ORDER.indexOf(t.era) <= maxEraIdx;
    });

    // 保底满 10 个科技：若某文化在当前时代的通用池 + 特殊科技不足 10 个，按时代顺序从本文化后续时代通用科技补足至 10 个
    if (list.length < 10) {
        const pickedIds = new Set(list.map((t) => t.id));
        const extra = MILITARY_TECHS
            .filter((t) => !pickedIds.has(t.id) && matchCulture(t))
            .sort((a, b) => ERA_ORDER.indexOf(a.era) - ERA_ORDER.indexOf(b.era));
        for (const t of extra) {
            list.push(t);
            if (list.length >= 10) break;
        }
    }

    return list;
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
 * 从某文化（66 建筑文化）+ 时代的科技池子里，给攻守双方各抽固定 **10 条**科技：
 *   · 本文化专属特殊科技（DE Unique Tech）→ 排在最前、100% 优先必选
 *   · 其余通用科技 → 优先当前时代、再向下兼容早期时代，按军团种子确定性补齐到 10 条
 */
export function selectLegionTechs(year: number, culture: TechCulture, seed: string): MilitaryTech[] {
    const pool = unlockedTechs(year, culture);
    const mandatory = pool.filter(isCultureUnique);
    const rest = pool.filter((t) => !isCultureUnique(t));
    const target = Math.min(10, pool.length);
    const need = Math.max(0, target - mandatory.length);
    const rnd = mulberry32(hashSeed(seed));
    // 🔴 [2026-10-20 主人定] 攻守双方都 10 个科技，优先出现本文化的特殊科技（mandatory 置顶），
    //    其余槽位按时代由高到低确定性抽取补齐 10 个。
    const picked: MilitaryTech[] = [];
    for (let eraIdx = ERA_ORDER.length - 1; eraIdx >= 0 && picked.length < need; eraIdx--) {
        const eraKey = ERA_ORDER[eraIdx];
        const bucket = rest.filter((t) => t.era === eraKey);
        for (let i = bucket.length - 1; i > 0; i--) {
            const j = Math.floor(rnd() * (i + 1));
            [bucket[i], bucket[j]] = [bucket[j], bucket[i]];
        }
        for (const t of bucket) {
            if (picked.length >= need) break;
            picked.push(t);
        }
    }
    const byEra = (a: MilitaryTech, b: MilitaryTech) =>
        ERA_ORDER.indexOf(a.era) - ERA_ORDER.indexOf(b.era) || a.id.localeCompare(b.id);
    // 本文化特殊科技排在最前，通用科技按时代排序跟在后面
    return [...mandatory.sort(byEra), ...picked.sort(byEra)];
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
