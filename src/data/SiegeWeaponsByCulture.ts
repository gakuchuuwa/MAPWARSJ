/**
 * 攻城战前 30 秒的攻城武器发放（13 战术层用；引擎八环不读这里）。
 *
 * 🔴 [2026-09-18 主人定死 · 全军团攻城武器终极铁律]
 * 1. 全军团：16 母体 × 4 时代 + 62 二级文明各时代 + 三级 11 支。
 *    古典时代：起始 – 公元 400 年
 *    封建时代：公元 400 年 – 公元 1050 年
 *    城堡时代：公元 1050 年 – 公元 1500 年
 *    帝王时代：公元 1500 年 – 公元 1914 年
 * 2. 武将判定时代，以该武将最辉煌的年代判定，无法判断，以30岁为主。
 * 3. 古典军团的必须套用古典时代攻城武器。
 * 4. 封建军团的必须套用古典时代和封建时代攻城武器。
 * 5. 城堡军团的必须套用古典时代和封建时代和城堡时代+城堡时代攻城热兵器。
 * 6. 帝国时代军团可以套用所有攻城武器。
 * 7. 请符合历史。
 * 8. 每个军团 9 件、必须有冲车；用哪几种按其文明 DE 科技树里实际有的攻城器（2026-10-18 主人令「参照科技树」）。
 *    不再强制 34 种全覆盖/每样≥2 —— 科技树没有的器械不硬塞。
 *
 * 🔴 [2026-10-02 主人定 · 剧本期口径] **不逐场核对，只判「大致年代 + 样式」**
 *    主人原话：「亚历山大剧本的攻城武器不需要挨个战场核对，只需要符合当时大概的年代就行，主要看样式对不对就行。」
 *    · **不许按每一场战役的史料去核**：不得以「这一仗史书上没写用某种器械」为由改数据、报错或要求逐场覆盖
 *      （索格狄亚那岩是攀岩奇袭、奥诺斯岩是填土筑堆、马里斯是云梯强攻 —— 都不构成「这场不该发 9 件」的理由）。
 *    · **只判两条**：① 大致年代对（同处一个时代段即可；**同代里早二三十年的器械不算错**——
 *      赫勒波利斯是前 305 罗德岛围城之器，用在亚历山大前 335–324 诸役，属同代，不判错、不改）；
 *      ② **样式**对（看贴图/器型认不认得是那个时代那个地域的器械：地中海＝扭力投石/弩炮/龟甲撞城车/攻城塔）。
 *    · 编辑器与审计脚本**不许**再按「逐场史料用过没有」拦存盘；要拦只拦**跨时代**与**跨洲乱炖**。
 */
import type { RegionType } from '../systems/RegionSystem';
import { CULTURE_LEGION_NAMES } from '../types/CultureFormations';
import { LEVEL_2_CIV_62_LEGIONS } from './level2Civ62Legions';
import { LEVEL_3_LEGIONS } from './level3CustomLegions';
import { GENERAL_ERA } from './GeneralEra';
import { GENERAL_CENTURIES } from './GeneralCenturies';

export type SiegeAge = 'antiquity' | 'feudal' | 'castle' | 'imperial';

export const AGE_RANK: Record<SiegeAge, number> = { antiquity: 0, feudal: 1, castle: 2, imperial: 3 };

export const ERA_PREFIX_TO_AGE: Record<string, SiegeAge> = {
    古典: 'antiquity', 封建: 'feudal', 城堡: 'castle', 帝国: 'imperial', 帝王: 'imperial',
};

/** 34 种攻城武器元信息（对应 src/legion-editor/main.ts 全仓唯一时代真源） */
export const SIEGE_UNITS: Record<string, { name: string; age: SiegeAge; isRam?: boolean }> = {
    // ── 古典时代 12 种 ──
    antiquity_battering_ram: { name: '古典轻型攻城槌', age: 'antiquity', isRam: true },
    antiquity_capped_ram: { name: '古典装甲攻城槌高级', age: 'antiquity', isRam: true },
    antiquity_siege_ram: { name: '古典重型攻城槌高级', age: 'antiquity', isRam: true },
    traction_trebuchet: { name: '华夏牵引投石机重装', age: 'antiquity' },
    antiquity_mangonel: { name: '古典轻型投石车', age: 'antiquity' },
    antiquity_onager: { name: '古典中型投石车高级', age: 'antiquity' },
    antiquity_siege_onager: { name: '古典重型投石车高级', age: 'antiquity' },
    antiquity_scorpion: { name: '古典弩炮', age: 'antiquity' },
    antiquity_heavy_scorpion: { name: '古典重型弩炮高级', age: 'antiquity' },
    siege_ballista: { name: '阿契美尼德攻城弩炮重装', age: 'antiquity' },
    antiquity_siege_tower: { name: '古典攻城塔', age: 'antiquity' },
    helepolis: { name: '希腊赫勒波利斯攻城塔重装', age: 'antiquity' },

    // ── 封建时代 6 种 ──
    battering_ram: { name: '轻型攻城槌', age: 'feudal', isRam: true },
    mangonel: { name: '欧洲轻型投石车', age: 'feudal' },
    mounted_trebuchet: { name: '沙漠骆驼投石机高级', age: 'feudal' },
    scorpion: { name: '欧洲弩炮', age: 'feudal' },
    siege_tower: { name: '欧洲攻城塔', age: 'feudal' },
    ballista_elephant: { name: '高棉弩炮战象', age: 'feudal' },

    // ── 城堡时代 15 种（含印度/普鲁攻城武器厂破门装甲战象 2 种） ──
    capped_ram: { name: '欧洲装甲攻城槌高级', age: 'castle', isRam: true },
    siege_ram: { name: '欧洲重型攻城槌高级', age: 'castle', isRam: true },
    armored_elephant: { name: '装甲攻城战象', age: 'castle', isRam: true },
    elite_armored_elephant: { name: '装甲攻城战象高级', age: 'castle', isRam: true },
    onager: { name: '欧洲中型投石车高级', age: 'castle' },
    siege_onager: { name: '欧洲重型投石车高级', age: 'castle' },
    heavy_scorpion: { name: '欧洲重型弩炮高级', age: 'castle' },
    elite_ballista_elephant: { name: '高棉弩炮战象精锐', age: 'castle' },
    flaming_camel: { name: '鞑靼火焰骆驼', age: 'castle' },
    petard: { name: '爆破工兵', age: 'castle' },
    flamethrower: { name: '华夏猛火油柜重装', age: 'castle' },
    rocket_cart: { name: '火箭车', age: 'castle' },
    heavy_rocket_cart: { name: '重型火箭车精锐', age: 'castle' },
    houfnice: { name: '手推榴弹炮', age: 'castle' },
    grenadier: { name: '掷弹兵', age: 'castle' },

    // ── 帝国时代 3 种 ──
    bombard_cannon: { name: '手推攻城火炮', age: 'imperial' },
    organ_gun: { name: '葡萄牙风琴炮', age: 'imperial' },
    elite_organ_gun: { name: '葡萄牙风琴炮精锐', age: 'imperial' },
};

/** 16 套母体军团名称映射 */
export const BASE_16_LEGION_NAMES: Record<string, string> = {
    CENTRAL: '东亚军团', STEPPE: '中亚军团', INDIA: '印度军团', GERMANIC: '西欧军团',
    PURU: '普鲁军团', ORIE: '中东军团', LATIN: '地中海军团', SLAVIC: '东北欧军团',
    EAST: '东南欧军团', PERSIAN: '波斯军团', MALAY: '东南亚军团', GREEK: '希腊军团',
    THRACIAN: '色雷斯军团', ANDE: '安第斯军团', AMERICA: '中美军团', AFRICA: '非洲军团',
};

export function isBase16CultureLegion(name: string): boolean {
    return Object.values(BASE_16_LEGION_NAMES).includes(name);
}

/** 171 个文化区回溯到 16 母体 base region 的映射 */
const BASE_16_MAP: Record<string, string> = {
    CENTRAL: 'CENTRAL', PRE_QIN: 'CENTRAL', NORTH: 'CENTRAL', HEXI: 'CENTRAL', NORTHEAST: 'CENTRAL', JIANGNAN: 'CENTRAL',
    KOREA: 'CENTRAL', GOJOSEON: 'CENTRAL', KHITAN: 'CENTRAL', MOHE: 'CENTRAL', NANZHAO: 'CENTRAL', SONG: 'CENTRAL',
    JURCHEN: 'CENTRAL', DALI: 'CENTRAL', GORYEO: 'CENTRAL', VIETNAMESE: 'MALAY', MING: 'CENTRAL', MANCHU: 'CENTRAL',
    HUAXIA_IMPERIAL: 'CENTRAL', JOSEON: 'CENTRAL', KARA_KHITAN: 'CENTRAL', JAPAN: 'CENTRAL', JAPAN_ANTIQUITY: 'CENTRAL',
    JAPAN_IMPERIAL: 'CENTRAL', BASHU: 'CENTRAL', WEI: 'CENTRAL', WU: 'CENTRAL', SHU: 'CENTRAL',
    STEPPE: 'STEPPE', STEPPE_IMPERIAL: 'STEPPE', STEPPE_ANTIQUITY: 'STEPPE', STEPPE_FEUDAL: 'STEPPE', CUMAN: 'STEPPE',
    TURKS: 'STEPPE', TIMURID: 'STEPPE', ILKHANATE: 'STEPPE', CENTRAL_ASIA: 'STEPPE', CENTRAL_ASIA_ANTIQUITY: 'STEPPE',
    CENTRAL_ASIA_CASTLE: 'STEPPE', CENTRAL_ASIA_IMPERIAL: 'STEPPE', MOBEI_MONGOL: 'STEPPE', MONGOL: 'STEPPE', HUNS: 'STEPPE',
    INDIA: 'INDIA', BENGALIS: 'INDIA', GURJARAS: 'INDIA', INDIA_FEUDAL: 'INDIA', INDIA_CASTLE: 'INDIA', INDIA_IMPERIAL: 'INDIA',
    DELHI: 'INDIA', MUGHAL: 'INDIA', SIKH: 'INDIA',
    GERMANIC: 'GERMANIC', FRANKS: 'GERMANIC', GOTHS: 'GERMANIC', CELTS: 'GERMANIC', VIKINGS: 'GERMANIC', TEUTONS: 'GERMANIC',
    BRITONS: 'GERMANIC', BURGUNDIANS: 'GERMANIC', GERMANIC_FEUDAL: 'GERMANIC', GERMANIC_CASTLE: 'GERMANIC', GERMANIC_IMPERIAL: 'GERMANIC',
    PURU: 'PURU', TIBET: 'PURU', TIBET_CASTLE: 'PURU', TIBET_IMPERIAL: 'PURU',
    ORIE: 'ORIE', ORIE_ANTIQUITY: 'ORIE', WEST_ASIA: 'ORIE', WEST_ASIA_ANTIQUITY: 'ORIE', WEST_ASIA_CASTLE: 'ORIE',
    BERBER: 'AFRICA', TANGUT: 'ORIE',
    LATIN: 'LATIN', ROMA: 'LATIN', ITALIANS: 'LATIN', SPANISH: 'LATIN', PORTUGUESE: 'LATIN', SICILIANS: 'LATIN',
    LATIN_FEUDAL: 'LATIN', LATIN_CASTLE: 'LATIN', LATIN_IMPERIAL: 'LATIN',
    SLAVIC: 'SLAVIC', BULGARIANS: 'SLAVIC', POLES: 'SLAVIC', BOHEMIANS: 'SLAVIC', LITHUANIANS: 'SLAVIC', MAGYAR: 'SLAVIC', SERBIA: 'SLAVIC',
    EAST: 'EAST', BYZANTINE: 'EAST', ARMENIANS: 'EAST', GEORGIANS: 'EAST',
    PERSIAN: 'PERSIAN', ACHAEMENIDS: 'PERSIAN', SASANIAN: 'PERSIAN', PERSIAN_CASTLE: 'PERSIAN',
    MALAY: 'MALAY', KHMER: 'MALAY', BURMESE: 'MALAY', SEASIA_ANTIQUITY: 'MALAY', SEASIA_FEUDAL: 'MALAY', SEASIA_CASTLE: 'MALAY', SEASIA_IMPERIAL: 'MALAY',
    GREEK: 'GREEK', ATHENIANS: 'GREEK', SPARTANS: 'GREEK', MACEDONIAN: 'GREEK', HELLENIC: 'GREEK',
    THRACIAN: 'THRACIAN',
    ANDE: 'ANDE', INCA: 'ANDE', MUISCA: 'ANDE', TUPI: 'ANDE', MAPUCHE: 'ANDE',
    AMERICA: 'AMERICA', MAYANS: 'AMERICA',
    AFRICA: 'AFRICA', ETHIOPIANS: 'AFRICA', MALI: 'AFRICA',
};

function getBaseLegionName(region: string): string {
    const base = BASE_16_MAP[region] || 'CENTRAL';
    return BASE_16_LEGION_NAMES[base] || '东亚军团';
}

const REGION_LEGION_FALLBACK: Readonly<Record<string, string>> = (() => {
    const m: Record<string, string> = {};
    for (const L of LEVEL_2_CIV_62_LEGIONS) if (!m[String(L.region)]) m[String(L.region)] = L.name;
    for (const L of LEVEL_3_LEGIONS) for (const r of L.regions) if (!m[r]) m[r] = L.name;
    return m;
})();

/**
 * 军团时代判定：指针表 -> 二三级表 -> 古典兜底。
 */
export function legionSiegeAge(culture: RegionType | string): SiegeAge {
    const key = String(culture);
    const pointerName = (CULTURE_LEGION_NAMES as Record<string, string>)[key] ?? '';
    const fromPointer = ERA_PREFIX_TO_AGE[pointerName.slice(0, 2)];
    if (fromPointer) return fromPointer;
    const fallbackName = REGION_LEGION_FALLBACK[key] ?? '';
    const fromFallback = ERA_PREFIX_TO_AGE[fallbackName.slice(0, 2)];
    if (fromFallback) return fromFallback;
    if (/_IMPERIAL$/i.test(key)) return 'imperial';
    if (/_CASTLE$/i.test(key)) return 'castle';
    if (/_FEUDAL$/i.test(key)) return 'feudal';
    return 'antiquity';
}

/**
 * 武将判定时代：以该武将最辉煌的年代判定（成名世纪/成名年代），无法判断以30岁为主。
 */
export function generalSiegeAge(generalId: string): SiegeAge | null {
    const era = (GENERAL_ERA as Record<string, SiegeAge>)[generalId];
    if (era) return era;
    const century = (GENERAL_CENTURIES as Record<string, number>)[generalId];
    if (century != null) {
        // 🔴 [2026-10-16 主人定真边界] 古典 ≤476 / 封建 476–1050 / 城堡 1050–1500 / 帝国 1500–1914。
        //    世纪 5、11、20 都骑跨边界，**正经判据看得是 GENERAL_ERA（已逐将精化）**；
        //    这里只是缺档案时的兜底，按世纪粗档走（世纪5 兜底给封建，仅当该将确实不在 GENERAL_ERA 里）。
        if (century <= 4) return 'antiquity';
        if (century <= 10) return 'feudal';
        if (century <= 15) return 'castle';
        return 'imperial';
    }
    return null;
}

/**
 * 全军团攻城武器配置表（二级 257 + 三级 11 + 16母体各时代）。
 * 每支军团严格 9 辆、必有破门器械（冲车/装甲战象）；用哪几种按其文明 DE 科技树里实际有的攻城器。
 */
export const LEGION_78_SIEGE_MAP: Record<string, { age: SiegeAge; weapons: string[] }> = {
    // ══════════════════════════════════════════════════════════════════════
    // 一、二级 62 文明 + 三级 11 支：按 DE 科技树重排（2026-10-18 主人令）
    //    每支 9 件；冲车/装甲战象必带；每个文明只用自己科技树里有的攻城器。
    // ══════════════════════════════════════════════════════════════════════
    '古典时代罗马军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '古典时代雅典军团': {
        age: 'antiquity',
        weapons: ['antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '古典时代斯巴达军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_scorpion', 'antiquity_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '古典时代马其顿军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'helepolis', 'helepolis', 'antiquity_siege_onager', 'antiquity_siege_onager', 'siege_ballista', 'siege_ballista'],
    },
    '古典时代色雷斯军团': {
        age: 'antiquity',
        weapons: ['antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_scorpion', 'antiquity_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代法兰克军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代幕府军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代蒙古军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代阿兹特克军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代高丽军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'rocket_cart', 'rocket_cart', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代印加军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代马里军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'siege_onager', 'siege_onager', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代库曼军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代穆伊斯卡军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'siege_onager', 'siege_onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代图皮军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代葡萄牙军团': {
        age: 'imperial',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'organ_gun', 'organ_gun', 'onager', 'onager', 'bombard_cannon', 'bombard_cannon'],
    },
    '古典时代秦汉军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'traction_trebuchet', 'traction_trebuchet', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代隋唐军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'traction_trebuchet', 'traction_trebuchet', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代宋禁军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'traction_trebuchet', 'traction_trebuchet', 'flamethrower', 'flamethrower', 'rocket_cart', 'rocket_cart'],
    },
    '帝国时代华夏军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'traction_trebuchet', 'traction_trebuchet', 'flamethrower', 'flamethrower', 'heavy_rocket_cart', 'heavy_rocket_cart'],
    },
    '古典时代魏晋军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'traction_trebuchet', 'traction_trebuchet', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代北朝军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'traction_trebuchet', 'traction_trebuchet', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代燕云军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'traction_trebuchet', 'traction_trebuchet', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代大明军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'traction_trebuchet', 'traction_trebuchet', 'petard', 'petard', 'heavy_scorpion', 'heavy_scorpion'],
    },
    '古典时代吴越军团': {
        age: 'antiquity',
        weapons: ['antiquity_battering_ram', 'antiquity_battering_ram', 'antiquity_battering_ram', 'traction_trebuchet', 'traction_trebuchet', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代南朝军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'traction_trebuchet', 'traction_trebuchet', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代临安军团': {
        age: 'castle',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'traction_trebuchet', 'traction_trebuchet', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代两江军团': {
        age: 'imperial',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'traction_trebuchet', 'traction_trebuchet', 'petard', 'petard', 'heavy_scorpion', 'heavy_scorpion'],
    },
    '古典时代巴蜀军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代剑南军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'siege_tower', 'siege_tower'],
    },
    '城堡时代山城军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'siege_tower', 'siege_tower'],
    },
    '帝国时代四川军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'traction_trebuchet', 'traction_trebuchet', 'petard', 'petard', 'siege_tower', 'siege_tower'],
    },
    '古典时代西凉军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_scorpion', 'antiquity_scorpion', 'antiquity_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代归义军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mounted_trebuchet', 'mounted_trebuchet', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代大夏军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'rocket_cart', 'rocket_cart', 'mounted_trebuchet', 'mounted_trebuchet', 'scorpion', 'scorpion'],
    },
    '帝国时代陕甘军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'heavy_rocket_cart', 'heavy_rocket_cart', 'mounted_trebuchet', 'mounted_trebuchet', 'scorpion', 'scorpion'],
    },
    '古典时代肃慎军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代渤海军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'scorpion', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower', 'siege_tower'],
    },
    '城堡时代大金军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'rocket_cart', 'rocket_cart', 'grenadier', 'grenadier', 'heavy_scorpion', 'heavy_scorpion'],
    },
    '帝国时代八旗军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'heavy_rocket_cart', 'heavy_rocket_cart', 'grenadier', 'grenadier', 'bombard_cannon', 'bombard_cannon'],
    },
    '古典时代匈奴军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_onager', 'antiquity_siege_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代突厥军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代喀尔喀军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '古典时代高句丽军团': {
        age: 'antiquity',
        weapons: ['antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_scorpion', 'antiquity_scorpion', 'antiquity_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代新罗军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'scorpion', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower', 'siege_tower'],
    },
    '帝国时代朝鲜军团': {
        age: 'imperial',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'heavy_rocket_cart', 'heavy_rocket_cart', 'bombard_cannon', 'bombard_cannon', 'scorpion', 'scorpion'],
    },
    '古典时代大和军团': {
        age: 'antiquity',
        weapons: ['antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代平安军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代武家军团': {
        age: 'imperial',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '古典时代条顿军团': {
        age: 'antiquity',
        weapons: ['antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_siege_onager', 'antiquity_siege_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代萨克森军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代德意志骑士团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'siege_onager', 'siege_onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代佣兵军团': {
        age: 'imperial',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'siege_onager', 'siege_onager', 'bombard_cannon', 'bombard_cannon', 'heavy_scorpion', 'heavy_scorpion'],
    },
    '古典时代高卢军团': {
        age: 'antiquity',
        weapons: ['antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '城堡时代法兰西骑士团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'petard', 'petard', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion'],
    },
    '帝国时代重装骑兵军团': {
        age: 'imperial',
        // 🔴 [2026-10-19 主人令] 9 件攻城武器里，把 2 件「手推攻城火炮」换成法兰克两位炮兵英雄（同样是火炮样子）：
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'petard', 'petard', 'onager', 'onager', 'hero_jeanbureau', 'hero_jeandelorrain'],
    },
    '古典时代勃艮第战团': {
        age: 'antiquity',
        weapons: ['antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_scorpion', 'antiquity_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代阿尔勒军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代勃艮第骑士团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代弗兰德斯军团': {
        age: 'imperial',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'bombard_cannon', 'bombard_cannon', 'scorpion', 'scorpion'],
    },
    '古典时代布立吞军团': {
        age: 'antiquity',
        weapons: ['antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代撒克森军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代长弓军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代都铎卫队军团': {
        age: 'imperial',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '古典时代皮克特军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_onager', 'antiquity_siege_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代高王近卫军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代高地阔剑军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代加洛格拉斯军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '古典时代狂战士军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代维京盾墙军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代瓦兰吉近卫军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代达拉纳长矛军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '古典时代西哥特军团': {
        age: 'antiquity',
        weapons: ['antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代阿斯图里亚斯军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代崖城卫队军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代黑海铁卫军团': {
        age: 'imperial',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'bombard_cannon', 'bombard_cannon', 'heavy_scorpion', 'heavy_scorpion'],
    },
    '古典时代撒克斯短剑军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代奥托铁卫军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代选侯重骑军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代黑卫士方阵团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '古典时代楚德林莽军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代瓦良格战团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代冰湖铁卫军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代北境长斧军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '古典时代朱特破浪战团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_onager', 'antiquity_siege_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代环堡皇家战团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代红白十字骑士团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代海峡要塞铁卫团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '古典时代东罗马军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_scorpion', 'antiquity_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代具装骑兵团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代拜占庭近卫军': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代耶尼切里军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'bombard_cannon', 'bombard_cannon', 'scorpion', 'scorpion'],
    },
    '古典时代大亚美尼亚铁骑': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代阿尼城卫军': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代奇里乞亚骑士团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代亚美尼亚军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '古典时代高加索伊比利亚军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_onager', 'antiquity_siege_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代巴格拉特铁骑军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代格鲁吉亚骑士团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代高加索军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '古典时代卢吉蛮族战团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_scorpion', 'antiquity_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代波兰尼铁卫团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代波兰骑士团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代翼骑兵军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'bombard_cannon', 'bombard_cannon', 'scorpion', 'scorpion'],
    },
    '古典时代波伊山垒战团': {
        age: 'antiquity',
        weapons: ['antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代波希米亚军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代胡斯战车军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'houfnice', 'houfnice', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion'],
    },
    '帝国时代黑兵团长矛军': {
        age: 'imperial',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'houfnice', 'houfnice', 'onager', 'onager', 'bombard_cannon', 'bombard_cannon'],
    },
    '古典时代潘诺尼亚巡境军团': {
        age: 'antiquity',
        weapons: ['antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代马扎尔骑射战团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代黑军铁甲兵团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代骠骑先锋军团': {
        age: 'imperial',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '古典时代安特森林战团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_onager', 'antiquity_siege_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代德鲁日纳亲卫团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代博亚尔重骑军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代月牙长斧军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '古典时代埃斯蒂琥珀战团': {
        age: 'antiquity',
        weapons: ['antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_scorpion', 'antiquity_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代克尔纳韦山堡卫队': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代立陶宛重骑兵团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代立陶宛军团': {
        age: 'imperial',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'bombard_cannon', 'bombard_cannon', 'scorpion', 'scorpion'],
    },
    '古典时代色雷斯逆刃战团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_onager', 'antiquity_siege_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代波亚尔铁骑兵团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代查雷威茨禁卫军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代保加利亚军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '古典时代因苏布雷战团': {
        age: 'antiquity',
        weapons: ['antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_scorpion', 'antiquity_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代伦巴第重骑兵团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代卡罗乔民兵团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代米兰板甲雇佣军': {
        age: 'imperial',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'bombard_cannon', 'bombard_cannon', 'scorpion', 'scorpion'],
    },
    '封建时代教皇卫队': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代十字军骑士': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代瑞士近卫军': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '古典时代叙拉古重步兵团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_onager', 'antiquity_siege_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代撒拉逊圣战军': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代诺曼骑士团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代西西里军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '古典时代凯尔特伊比利亚军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_scorpion', 'antiquity_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代摩尔游骑军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代圣地亚哥骑士团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代西班牙方阵军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'bombard_cannon', 'bombard_cannon', 'scorpion', 'scorpion'],
    },
    '古典时代卢西塔尼亚战团': {
        age: 'antiquity',
        weapons: ['antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_scorpion', 'antiquity_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代苏维汇铁骑军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代基督骑士团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '古典时代黎凡特军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_onager', 'antiquity_siege_onager', 'antiquity_scorpion', 'antiquity_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代萨拉森军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代马穆鲁克军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代阿拉伯军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'bombard_cannon', 'bombard_cannon', 'scorpion', 'scorpion'],
    },
    '古典时代匈人军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_mangonel', 'antiquity_mangonel', 'antiquity_scorpion', 'antiquity_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '古典时代萨尔马提亚军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_onager', 'antiquity_siege_onager', 'antiquity_scorpion', 'antiquity_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代可萨军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代哥萨克军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '古典时代赫梯军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_mangonel', 'antiquity_mangonel', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代突厥骑射军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代加齐突骑军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'mangonel', 'mangonel', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代土耳其军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'mangonel', 'mangonel', 'bombard_cannon', 'bombard_cannon', 'heavy_scorpion', 'heavy_scorpion'],
    },
    '古典时代巴克特里亚军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代河中重骑军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代帖木儿军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'flaming_camel', 'flaming_camel', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion'],
    },
    '帝国时代乌兹别克军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'flaming_camel', 'flaming_camel', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion'],
    },
    '古典时代泰米尔军团': {
        age: 'antiquity',
        weapons: ['armored_elephant', 'armored_elephant', 'armored_elephant', 'antiquity_siege_onager', 'antiquity_siege_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代朱罗军团': {
        age: 'feudal',
        weapons: ['armored_elephant', 'armored_elephant', 'armored_elephant', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代维查耶那加尔军团': {
        age: 'castle',
        weapons: ['armored_elephant', 'armored_elephant', 'armored_elephant', 'siege_onager', 'siege_onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代科罗曼德尔军团': {
        age: 'imperial',
        weapons: ['elite_armored_elephant', 'elite_armored_elephant', 'elite_armored_elephant', 'siege_onager', 'siege_onager', 'bombard_cannon', 'bombard_cannon', 'heavy_scorpion', 'heavy_scorpion'],
    },
    '古典时代孔雀军团': {
        age: 'antiquity',
        weapons: ['armored_elephant', 'armored_elephant', 'armored_elephant', 'antiquity_onager', 'antiquity_onager', 'antiquity_scorpion', 'antiquity_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代戒日军团': {
        age: 'feudal',
        weapons: ['armored_elephant', 'armored_elephant', 'armored_elephant', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代德里军团': {
        age: 'castle',
        weapons: ['armored_elephant', 'armored_elephant', 'armored_elephant', 'onager', 'onager', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代莫卧儿军团': {
        age: 'imperial',
        weapons: ['elite_armored_elephant', 'elite_armored_elephant', 'elite_armored_elephant', 'onager', 'onager', 'bombard_cannon', 'bombard_cannon', 'scorpion', 'scorpion'],
    },
    '古典时代高陀军团': {
        age: 'antiquity',
        weapons: ['armored_elephant', 'armored_elephant', 'armored_elephant', 'antiquity_onager', 'antiquity_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代波罗军团': {
        age: 'feudal',
        weapons: ['armored_elephant', 'armored_elephant', 'armored_elephant', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代孟加拉军团': {
        age: 'castle',
        weapons: ['armored_elephant', 'armored_elephant', 'armored_elephant', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代恒河军团': {
        age: 'imperial',
        weapons: ['elite_armored_elephant', 'elite_armored_elephant', 'elite_armored_elephant', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '古典时代萨卡军团': {
        age: 'antiquity',
        weapons: ['armored_elephant', 'armored_elephant', 'armored_elephant', 'antiquity_onager', 'antiquity_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代古贾拉铁骑军团': {
        age: 'feudal',
        weapons: ['armored_elephant', 'armored_elephant', 'armored_elephant', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代古吉拉特军团': {
        age: 'castle',
        weapons: ['armored_elephant', 'armored_elephant', 'armored_elephant', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代第乌军团': {
        age: 'imperial',
        weapons: ['elite_armored_elephant', 'elite_armored_elephant', 'elite_armored_elephant', 'onager', 'onager', 'bombard_cannon', 'bombard_cannon', 'heavy_scorpion', 'heavy_scorpion'],
    },
    '古典时代贵霜军团': {
        age: 'antiquity',
        weapons: ['armored_elephant', 'armored_elephant', 'armored_elephant', 'antiquity_mangonel', 'antiquity_mangonel', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代沙希军团': {
        age: 'feudal',
        weapons: ['armored_elephant', 'armored_elephant', 'armored_elephant', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代五河军团': {
        age: 'castle',
        weapons: ['armored_elephant', 'armored_elephant', 'armored_elephant', 'mangonel', 'mangonel', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代旁遮普军团': {
        age: 'imperial',
        weapons: ['elite_armored_elephant', 'elite_armored_elephant', 'elite_armored_elephant', 'mangonel', 'mangonel', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '古典时代扶南军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代高棉军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'ballista_elephant', 'ballista_elephant', 'mangonel', 'mangonel', 'scorpion', 'scorpion'],
    },
    '城堡时代吴哥军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'elite_ballista_elephant', 'elite_ballista_elephant', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion'],
    },
    '帝国时代洛韦克军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'elite_ballista_elephant', 'elite_ballista_elephant', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion'],
    },
    '古典时代骠人军团': {
        age: 'antiquity',
        weapons: ['antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代蒲甘军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代阿瓦军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代东吁军团': {
        age: 'imperial',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'bombard_cannon', 'bombard_cannon', 'heavy_scorpion', 'heavy_scorpion'],
    },
    '古典时代交趾军团': {
        age: 'antiquity',
        weapons: ['antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_scorpion', 'antiquity_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代华闾军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代大越军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代安南军团': {
        age: 'imperial',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'bombard_cannon', 'bombard_cannon', 'scorpion', 'scorpion'],
    },
    '古典时代狼牙脩军团': {
        age: 'antiquity',
        weapons: ['antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代三佛齐军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代爪哇军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代马六甲军团': {
        age: 'imperial',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'bombard_cannon', 'bombard_cannon', 'heavy_scorpion', 'heavy_scorpion'],
    },
    '古典时代佩滕军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代尤卡坦军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代玛雅潘军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代玛雅军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '古典时代高原战团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_onager', 'antiquity_siege_onager', 'antiquity_scorpion', 'antiquity_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代托尔特克军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代特诺奇军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '古典时代莫切军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代安第斯军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代塔万廷军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '封建时代波哥大高原战团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代格查武士军团': {
        age: 'imperial',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'siege_onager', 'siege_onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '封建时代比奥比奥战团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代马普切军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代阿劳卡尼亚军团': {
        age: 'imperial',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代塔莫约军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '古典时代迦太基军团': {
        age: 'antiquity',
        weapons: ['antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代柏柏尔骑兵团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代摩尔军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代巴巴里军团': {
        age: 'imperial',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'bombard_cannon', 'bombard_cannon', 'heavy_scorpion', 'heavy_scorpion'],
    },
    '古典时代杰内战团': {
        age: 'antiquity',
        weapons: ['antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_siege_onager', 'antiquity_siege_onager', 'antiquity_scorpion', 'antiquity_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代加纳军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代桑海军团': {
        age: 'imperial',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'siege_onager', 'siege_onager', 'bombard_cannon', 'bombard_cannon', 'scorpion', 'scorpion'],
    },
    '古典时代阿克苏姆军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_onager', 'antiquity_siege_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代拉利贝拉军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代埃塞俄比亚军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代阿姆哈拉军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'bombard_cannon', 'bombard_cannon', 'heavy_scorpion', 'heavy_scorpion'],
    },
    '古典时代萨珊军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代霍拉桑军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代伊儿军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代红头军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'bombard_cannon', 'bombard_cannon', 'heavy_scorpion', 'heavy_scorpion'],
    },
    '古典时代长生军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_scorpion', 'antiquity_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代德莱木军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代法尔斯军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代设拉子军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '封建时代阿提卡军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代法兰克卫城军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代希腊轻骑军团': {
        age: 'imperial',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '封建时代莫讷姆瓦夏军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代摩里亚军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代曼尼军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '封建时代萨洛尼卡军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'siege_tower', 'siege_tower', 'mangonel', 'mangonel', 'scorpion', 'scorpion'],
    },
    '城堡时代瓦尔达尔军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_tower', 'siege_tower', 'siege_onager', 'siege_onager', 'heavy_scorpion', 'heavy_scorpion'],
    },
    '帝国时代马其顿军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_tower', 'siege_tower', 'siege_onager', 'siege_onager', 'heavy_scorpion', 'heavy_scorpion'],
    },
    '封建时代阿德里安堡军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代罗多彼军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代鲁米利亚军团': {
        age: 'imperial',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '古典时代象雄军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'traction_trebuchet', 'traction_trebuchet', 'antiquity_scorpion', 'antiquity_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代吐蕃军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'traction_trebuchet', 'traction_trebuchet', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代萨迦军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'traction_trebuchet', 'traction_trebuchet', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代卫藏军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'traction_trebuchet', 'traction_trebuchet', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '古典时代塞种军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_scorpion', 'antiquity_scorpion', 'antiquity_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代回鹘军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mounted_trebuchet', 'mounted_trebuchet', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代察合台军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'rocket_cart', 'rocket_cart', 'mounted_trebuchet', 'mounted_trebuchet', 'scorpion', 'scorpion'],
    },
    '帝国时代叶尔羌军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'heavy_rocket_cart', 'heavy_rocket_cart', 'mounted_trebuchet', 'mounted_trebuchet', 'scorpion', 'scorpion'],
    },
    '古典时代鲜卑军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_onager', 'antiquity_siege_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代契丹军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代漠南骑兵团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代察哈尔军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '古典时代爱奥尼亚军团': {
        age: 'antiquity',
        weapons: ['antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '封建时代爱琴军区军团': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代士麦那军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代爱琴要塞军团': {
        age: 'imperial',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '古典时代先秦军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'traction_trebuchet', 'traction_trebuchet', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '古典时代斯基泰军团': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_onager', 'antiquity_siege_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '城堡时代十字军团': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'siege_tower', 'siege_tower', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion'],
    },
    '城堡时代大理军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'traction_trebuchet', 'siege_tower', 'siege_tower'],
    },
    '城堡时代易洛魁军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '城堡时代岳家军团': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'traction_trebuchet', 'traction_trebuchet', 'flamethrower', 'flamethrower', 'rocket_cart', 'rocket_cart'],
    },
    '帝国时代西班牙征服军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'bombard_cannon', 'bombard_cannon', 'scorpion', 'scorpion'],
    },
    '帝国时代葡萄牙风琴军团': {
        age: 'imperial',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'elite_organ_gun', 'elite_organ_gun', 'onager', 'onager', 'bombard_cannon', 'bombard_cannon'],
    },
    '帝国时代安第斯游击军团': {
        age: 'imperial',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '帝国时代苏丹亲兵军团': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'mangonel', 'mangonel', 'bombard_cannon', 'bombard_cannon', 'heavy_scorpion', 'heavy_scorpion'],
    },
    '帝国时代起义军团': {
        age: 'imperial',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'petard', 'petard', 'onager', 'onager', 'bombard_cannon', 'bombard_cannon'],
    },

    // ══════════════════════════════════════════════════════════════════════
    // 三、一级 16 套母体军团（4 时代分支，按代表文明科技树）
    // ══════════════════════════════════════════════════════════════════════
    '东亚军团_antiquity': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'traction_trebuchet', 'traction_trebuchet', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '东亚军团_feudal': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'traction_trebuchet', 'traction_trebuchet', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '东亚军团_castle': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'traction_trebuchet', 'traction_trebuchet', 'flamethrower', 'flamethrower', 'rocket_cart', 'rocket_cart'],
    },
    '东亚军团_imperial': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'traction_trebuchet', 'traction_trebuchet', 'flamethrower', 'flamethrower', 'heavy_rocket_cart', 'heavy_rocket_cart'],
    },
    '中亚军团_antiquity': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_onager', 'antiquity_siege_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '中亚军团_feudal': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '中亚军团_castle': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '中亚军团_imperial': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '印度军团_antiquity': {
        age: 'antiquity',
        weapons: ['armored_elephant', 'armored_elephant', 'armored_elephant', 'antiquity_onager', 'antiquity_onager', 'antiquity_scorpion', 'antiquity_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '印度军团_feudal': {
        age: 'feudal',
        weapons: ['armored_elephant', 'armored_elephant', 'armored_elephant', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '印度军团_castle': {
        age: 'castle',
        weapons: ['armored_elephant', 'armored_elephant', 'armored_elephant', 'onager', 'onager', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '印度军团_imperial': {
        age: 'imperial',
        weapons: ['elite_armored_elephant', 'elite_armored_elephant', 'elite_armored_elephant', 'onager', 'onager', 'bombard_cannon', 'bombard_cannon', 'scorpion', 'scorpion'],
    },
    '西欧军团_antiquity': {
        age: 'antiquity',
        weapons: ['antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '西欧军团_feudal': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '西欧军团_castle': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'petard', 'petard', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion'],
    },
    '西欧军团_imperial': {
        age: 'imperial',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'petard', 'petard', 'onager', 'onager', 'bombard_cannon', 'bombard_cannon'],
    },
    '普鲁军团_antiquity': {
        age: 'antiquity',
        weapons: ['armored_elephant', 'armored_elephant', 'armored_elephant', 'antiquity_mangonel', 'antiquity_mangonel', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '普鲁军团_feudal': {
        age: 'feudal',
        weapons: ['armored_elephant', 'armored_elephant', 'armored_elephant', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '普鲁军团_castle': {
        age: 'castle',
        weapons: ['armored_elephant', 'armored_elephant', 'armored_elephant', 'mangonel', 'mangonel', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '普鲁军团_imperial': {
        age: 'imperial',
        weapons: ['elite_armored_elephant', 'elite_armored_elephant', 'elite_armored_elephant', 'mangonel', 'mangonel', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '中东军团_antiquity': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_onager', 'antiquity_siege_onager', 'antiquity_scorpion', 'antiquity_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '中东军团_feudal': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '中东军团_castle': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '中东军团_imperial': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'bombard_cannon', 'bombard_cannon', 'scorpion', 'scorpion'],
    },
    '地中海军团_antiquity': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '地中海军团_feudal': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '地中海军团_castle': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '地中海军团_imperial': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '东北欧军团_antiquity': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_onager', 'antiquity_siege_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '东北欧军团_feudal': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '东北欧军团_castle': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '东北欧军团_imperial': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '东南欧军团_antiquity': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_scorpion', 'antiquity_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '东南欧军团_feudal': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '东南欧军团_castle': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '东南欧军团_imperial': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'bombard_cannon', 'bombard_cannon', 'scorpion', 'scorpion'],
    },
    '波斯军团_antiquity': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_scorpion', 'antiquity_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '波斯军团_feudal': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '波斯军团_castle': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '波斯军团_imperial': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '东南亚军团_antiquity': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '东南亚军团_feudal': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'ballista_elephant', 'ballista_elephant', 'mangonel', 'mangonel', 'scorpion', 'scorpion'],
    },
    '东南亚军团_castle': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'elite_ballista_elephant', 'elite_ballista_elephant', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion'],
    },
    '东南亚军团_imperial': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'elite_ballista_elephant', 'elite_ballista_elephant', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion'],
    },
    '希腊军团_antiquity': {
        age: 'antiquity',
        weapons: ['antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '希腊军团_feudal': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '希腊军团_castle': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '希腊军团_imperial': {
        age: 'imperial',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '色雷斯军团_antiquity': {
        age: 'antiquity',
        weapons: ['antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_scorpion', 'antiquity_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '色雷斯军团_feudal': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '色雷斯军团_castle': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '色雷斯军团_imperial': {
        age: 'imperial',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'onager', 'onager', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '安第斯军团_antiquity': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_onager', 'antiquity_onager', 'antiquity_heavy_scorpion', 'antiquity_heavy_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '安第斯军团_feudal': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '安第斯军团_castle': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '安第斯军团_imperial': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'onager', 'onager', 'heavy_scorpion', 'heavy_scorpion', 'siege_tower', 'siege_tower'],
    },
    '中美军团_antiquity': {
        age: 'antiquity',
        weapons: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_onager', 'antiquity_siege_onager', 'antiquity_scorpion', 'antiquity_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '中美军团_feudal': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '中美军团_castle': {
        age: 'castle',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '中美军团_imperial': {
        age: 'imperial',
        weapons: ['siege_ram', 'siege_ram', 'siege_ram', 'siege_onager', 'siege_onager', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '非洲军团_antiquity': {
        age: 'antiquity',
        weapons: ['antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_capped_ram', 'antiquity_siege_onager', 'antiquity_siege_onager', 'antiquity_scorpion', 'antiquity_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    },
    '非洲军团_feudal': {
        age: 'feudal',
        weapons: ['battering_ram', 'battering_ram', 'battering_ram', 'mangonel', 'mangonel', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '非洲军团_castle': {
        age: 'castle',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'siege_onager', 'siege_onager', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    },
    '非洲军团_imperial': {
        age: 'imperial',
        weapons: ['capped_ram', 'capped_ram', 'capped_ram', 'siege_onager', 'siege_onager', 'bombard_cannon', 'bombard_cannon', 'scorpion', 'scorpion'],
    },


};

/**
 * 🔴 [2026-09-18 主人报障「乞伏的攻城武器里怎么还有大象？攻城武器按什么设定的？」]
 *    三级 TIBET（吐蕃/青藏）专用攻城武器：**无象**。
 *
 * 病根（实测 scratch/probe_qifu_siege.mts）：TIBET 的**一级底座是 PURU（普鲁素材）**，
 *   于是攻城武器落进母体配置「**普鲁军团_feudal**」，而那一条里写着 2× 高棉弩炮战象。
 *   乞伏（qifu_d，枹罕 region=TIBET，军团「古典时代鲜卑军团」不在专项表里，主帅乞伏炽磐成名于封建）
 *   就是这条链：TIBET → 普鲁军团 → _feudal → 大象。
 *
 * 判据与 2026-08-24 删西域大象完全同一条（见 Scene13WarLayer 里
 *   `SIEGE_ELEPHANT_BY_CULTURE` 的头注释）：「这地方**什么最多**」——
 *   青藏高原无象源、吐蕃史上不用战象，不该出现。
 * 实测修前全图 55 个据点带象，**其中 25 个是青藏系（错）**；另 30 个是
 *   缅甸/越南/马来/高棉/东南亚/印度/孟加拉/瞿折罗/普鲁 —— 那些是史实该有的，**不动**。
 *
 * 器械风格对齐既有那条「吐蕃军团」：华夏系冲车 + 牵引抛石机（吐蕃吸收唐制）。
 * 每档恒 9 件；古典只用古典器械（主人 2026-09-10 攻城武器铁律第 2 条）。
 */
const TIBET_SIEGE_BY_AGE: Record<SiegeAge, string[]> = {
    antiquity: ['antiquity_siege_ram', 'antiquity_siege_ram', 'antiquity_siege_ram', 'traction_trebuchet', 'traction_trebuchet', 'antiquity_scorpion', 'antiquity_scorpion', 'antiquity_siege_tower', 'antiquity_siege_tower'],
    feudal: ['battering_ram', 'battering_ram', 'battering_ram', 'traction_trebuchet', 'traction_trebuchet', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    castle: ['siege_ram', 'siege_ram', 'siege_ram', 'traction_trebuchet', 'traction_trebuchet', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
    imperial: ['siege_ram', 'siege_ram', 'siege_ram', 'traction_trebuchet', 'traction_trebuchet', 'scorpion', 'scorpion', 'siege_tower', 'siege_tower'],
};
/** 三种「青藏」文化区写法（三级 TIBET 及其历史变体） */
const TIBET_CULTURE_KEYS = new Set(['TIBET', 'TIBET_CASTLE', 'TIBET_IMPERIAL']);

/**
 * 攻城战攻方攻城武器发放函数（全军团攻城武器真源）。
 *
 * 判定链：
 * 1. 优先命中 62 二级文明军团或 3 三级专属自建军团；
 * 2. 属于 16 母体军团：时代按【主帅成名年代 > 军团名前缀 > 文化区指针】裁决，取对应时代分支；
 * 3. 兜底返回东亚军团古典配置。
 */
export function getSiegeWeaponsForCulture(
    culture: RegionType | string,
    legionName?: string | null,
    generalId?: string | null,
): string[] {
    const key = String(culture);
    const effLegion = legionName || (CULTURE_LEGION_NAMES as Record<string, string>)[key] || REGION_LEGION_FALLBACK[key] || '';

    // 1. 直接命中 62 二级或 3 三级专属军团（或剧本军团如「马其顿军团」→「古典时代马其顿军团」）
    if (effLegion && LEGION_78_SIEGE_MAP[effLegion]) {
        return [...LEGION_78_SIEGE_MAP[effLegion].weapons];
    }
    if (effLegion && !isBase16CultureLegion(effLegion) && LEGION_78_SIEGE_MAP[`古典时代${effLegion}`]) {
        return [...LEGION_78_SIEGE_MAP[`古典时代${effLegion}`].weapons];
    }

    // 2. 16 套母体军团
    const baseName = isBase16CultureLegion(effLegion) ? effLegion : getBaseLegionName(key);

    // 时代判定：优先主帅成名年代（最辉煌年代/30岁），次选军团名时代，最后文化区时代保底
    let age: SiegeAge = 'antiquity';
    if (generalId) {
        const gAge = generalSiegeAge(generalId);
        if (gAge) age = gAge;
        else if (effLegion && ERA_PREFIX_TO_AGE[effLegion.slice(0, 2)]) age = ERA_PREFIX_TO_AGE[effLegion.slice(0, 2)];
        else age = legionSiegeAge(key);
    } else if (effLegion && ERA_PREFIX_TO_AGE[effLegion.slice(0, 2)]) {
        age = ERA_PREFIX_TO_AGE[effLegion.slice(0, 2)];
    } else {
        age = legionSiegeAge(key);
    }

    const mappedKey = `${baseName}_${age}`;
    if (LEGION_78_SIEGE_MAP[mappedKey]) {
        // 🔴 [2026-09-18] 三级 TIBET/吐蕃/青藏 不走普鲁母体那条（「普鲁军团_feudal」里有大象）：
        //    青藏无象源，改走专用无象配置（见上方 TIBET_SIEGE_BY_AGE 头注释）。
        if (TIBET_CULTURE_KEYS.has(key)) return [...TIBET_SIEGE_BY_AGE[age]];
        return [...LEGION_78_SIEGE_MAP[mappedKey].weapons];
    }

    // 终极兜底：东亚军团古典配置
    return [...LEGION_78_SIEGE_MAP['东亚军团_antiquity'].weapons];
}
