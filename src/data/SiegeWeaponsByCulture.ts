/**
 * 攻城战前 30 秒的攻城武器发放（13 战术层用；引擎八环不读这里）。
 *
 * 🔴 [2026-09-10 主人定死 · 攻城武器终极铁律]
 * 1. 要符合历史：各文化攻城武器选用严格符合民族与地理史实。
 * 2. 古典时代的军团只能用古典的攻城武器：绝对硬闸，禁止跨入封建、城堡或帝国器械。
 * 3. 封建时代军团，可以用古典+封建的攻城武器。
 * 4. 城堡时代军团，可以用古典+封建+城堡的攻城武器，并可以使用城堡时代的热兵器攻城武器（如猛火油柜、神机箭、榴弹炮、掷弹兵）。
 * 5. 帝国时代军团，可以使用所有攻城武器（冷热兵器皆可，如攻城重炮、重型火箭车、风琴炮等）。
 * 6. 每个军团的攻城武器必须是 9 个。可以样式重复，但是不能增减数量！（全图所有文化、所有时代严格死锁为 9 个）。
 * 7. 必须有冲车：每个军团 9 辆攻城武器中，必须至少包含破门冲车（冲车/攻城槌/破门巨象）。
 *
 * 编成格位规划（固定 9 辆，热兵器替换相应格位，绝不追加增减）：
 *   · 槽位 1~3（破门冲车 3 辆）：恒定为冲车/攻城槌/破门巨象，绝不被替换，定死「必须有冲车」铁律。
 *   · 槽位 4~5（远程抛石 2 辆）：牵引砲 / 投石车 / 骆驼砲。
 *   · 槽位 6（重型火力 1 辆）：第 3 辆抛石，或胡斯榴弹炮（城堡）/ 攻城重炮 / 重型火箭车（帝国）。
 *   · 槽位 7（穿甲压制 1 辆）：弩炮 / 弩炮象 / 攻城弩炮。
 *   · 槽位 8（近距攻城 1 辆）：重型弩炮，或猛火油柜 / 神机箭（城堡）/ 风琴炮（帝国）。
 *   · 槽位 9（特色突击 1 辆）：赫勒波利斯巨塔 / 火焰骆驼 / 攻城塔，或掷弹兵（城堡/帝国）。
 *   · 美洲原住民：历史无复杂机械器械，依铁律允许样式重复，由本时代 9 辆破门攻城槌满编排阵。
 */
import type { RegionType } from '../systems/RegionSystem';
import { CULTURE_LEGION_NAMES } from '../types/CultureFormations';

export type SiegeAge = 'antiquity' | 'feudal' | 'castle' | 'imperial';

const AGE_RANK: Record<SiegeAge, number> = { antiquity: 0, feudal: 1, castle: 2, imperial: 3 };
const ERA_PREFIX_TO_AGE: Record<string, SiegeAge> = {
    古典: 'antiquity', 封建: 'feudal', 城堡: 'castle', 帝国: 'imperial',
};

/** 军团时代 = 该文化区军团名的时代前缀（名字即权威）。取不到按古典算，宁可发旧的也不超发。 */
export function legionSiegeAge(culture: RegionType): SiegeAge {
    const name = (CULTURE_LEGION_NAMES as Record<string, string>)[culture] ?? '';
    return ERA_PREFIX_TO_AGE[name.slice(0, 2)] ?? 'antiquity';
}

/** 职能：破门 / 抛石 / 压制 / 特色 */
type SiegeRole = 'ram' | 'thrower' | 'bolt' | 'special';

/**
 * 器械线：同一种攻城器从古典版到中世纪版（老 → 新）。发放时取不超过军团时代的最新一档。
 * 每条线的 role 决定「这条线在本时代还不存在」时退回哪组通用线。
 */
interface SiegeLine {
    role: SiegeRole;
    /** [兵种 key, 解锁时代]，必须按时代从老到新 */
    steps: ReadonlyArray<readonly [string, SiegeAge]>;
}

const SIEGE_LINES: readonly SiegeLine[] = [
    // ── 破门（冲车/攻城槌/破门巨象）──
    { role: 'ram', steps: [['antiquity_battering_ram', 'antiquity'], ['battering_ram', 'feudal']] },
    { role: 'ram', steps: [['antiquity_capped_ram', 'antiquity'], ['capped_ram', 'castle']] },
    { role: 'ram', steps: [['antiquity_siege_ram', 'antiquity'], ['siege_ram', 'castle']] },
    // 🔴 基础档与精锐档各自成线：同线取最新会把「一辆基础 + 一辆精锐」塌成两辆精锐
    { role: 'ram', steps: [['armored_elephant', 'castle']] },
    { role: 'ram', steps: [['elite_armored_elephant', 'castle']] },
    // ── 抛石（投石车/牵引砲/骆驼砲）──
    { role: 'thrower', steps: [['antiquity_mangonel', 'antiquity'], ['mangonel', 'feudal']] },
    { role: 'thrower', steps: [['antiquity_onager', 'antiquity'], ['onager', 'castle']] },
    { role: 'thrower', steps: [['antiquity_siege_onager', 'antiquity'], ['siege_onager', 'castle']] },
    { role: 'thrower', steps: [['traction_trebuchet', 'antiquity']] },
    { role: 'thrower', steps: [['mounted_trebuchet', 'feudal']] },
    // ── 压制（弩炮/床弩/弩炮象）──
    { role: 'bolt', steps: [['antiquity_scorpion', 'antiquity'], ['scorpion', 'feudal']] },
    { role: 'bolt', steps: [['antiquity_heavy_scorpion', 'antiquity'], ['heavy_scorpion', 'castle']] },
    // 阿契美尼德攻城弩炮：DE dat 归属 civ Achaemenids（编年史「希腊之战」），古典单位，只发波斯系
    { role: 'bolt', steps: [['siege_ballista', 'antiquity']] },
    { role: 'bolt', steps: [['ballista_elephant', 'feudal']] },
    { role: 'bolt', steps: [['elite_ballista_elephant', 'castle']] },
    // ── 特色（攻城塔/巨塔/自爆）──
    { role: 'special', steps: [['antiquity_siege_tower', 'antiquity'], ['siege_tower', 'feudal']] },
    { role: 'special', steps: [['helepolis', 'antiquity']] },
    { role: 'special', steps: [['flaming_camel', 'castle']] },
    { role: 'special', steps: [['petard', 'castle']] },
];

const LINE_OF = new Map<string, SiegeLine>();
for (const line of SIEGE_LINES) for (const [key] of line.steps) LINE_OF.set(key, line);

/** 该职能的通用替补线（四条都有古典版，任何时代都兜得住） */
const FALLBACK_LINES: Record<SiegeRole, readonly string[]> = {
    ram: ['antiquity_battering_ram', 'antiquity_capped_ram', 'antiquity_siege_ram'],
    thrower: ['antiquity_mangonel', 'antiquity_onager', 'antiquity_siege_onager'],
    bolt: ['antiquity_scorpion', 'antiquity_heavy_scorpion'],
    special: ['antiquity_siege_tower'],
};

/** 取某条器械线在该时代的最新一档；这条线在该时代还不存在 → null（调用方走替补） */
function stepForAge(key: string, cap: SiegeAge): string | null {
    const line = LINE_OF.get(key);
    if (!line) return key;   // 不在任何线上的（不该有）原样放行，别静默吞掉
    let pick: string | null = null;
    for (const [k, age] of line.steps) {
        if (AGE_RANK[age] <= AGE_RANK[cap]) pick = k;
    }
    return pick;
}

/** 替补：本职能通用线里挑一件该时代能用、且这一场还没出现过的 */
function fallbackFor(role: SiegeRole, cap: SiegeAge, used: string[]): string {
    const cands = FALLBACK_LINES[role].map(k => stepForAge(k, cap)).filter((k): k is string => !!k);
    return cands.find(k => !used.includes(k)) ?? cands[cands.length - 1];
}

// ── 文化分系 ───────────────────────────────────────────────────────────
/** 华夏系：牵引砲（砲）+ 临冲云梯，宋元明与朝鲜半岛、契丹女真党项大理越南同源。
 *  日本【2026-09-09 主人定·符合历史】：日本攻城术自古从中国大陆/朝鲜传入，
 *  用的是大陆系牵引砲（衡，蒙古入侵时期经唐、宋传来），不是欧洲扭力投石车，故归华夏系。
 *  压制走通用弩炮 —— DE 里中国文明本来就用标准 scorpion，库中没有中国床弩素材，绝不拿别家的顶替。 */
const CHINESE = new Set<string>([
    'CENTRAL', 'PRE_QIN', 'NORTH', 'HEXI', 'NORTHEAST', 'JIANGNAN', 'KOREA', 'GOJOSEON',
    'KHITAN', 'MOHE', 'NANZHAO', 'SONG', 'JURCHEN', 'DALI', 'GORYEO', 'VIETNAMESE',
    'MING', 'MANCHU', 'HUAXIA_IMPERIAL', 'JOSEON', 'KARA_KHITAN',
    'JAPAN', 'JAPAN_ANTIQUITY', 'JAPAN_IMPERIAL',   // 古典邪马台 / 城堡镰仓 / 帝国江户
]);
/** 地中海古典系：扭力弩炮 + 抛石机 + 攻城塔（希腊系另有赫勒波利斯巨塔） */
const CLASSICAL = new Set<string>([
    'GREEK', 'LATIN', 'THRACIAN', 'ACHAEMENIDS', 'MACEDONIAN', 'HELLENIC',
    'IMPERIAL_ROME', 'GREEK_MERCENARY', 'MAGNA_GRAECIA',
]);
/** 阿契美尼德攻城弩炮的正主：DE dat 里这套图属于 civ Achaemenids（编年史「希腊之战」） */
const PERSIAN_BALLISTA = new Set<string>(['ACHAEMENIDS', 'PERSIAN']);
/** 希腊系巨塔（赫勒波利斯，前 305 罗德岛围城） */
const HELEPOLIS_CULTURES = new Set<string>(['GREEK', 'MACEDONIAN', 'HELLENIC', 'MAGNA_GRAECIA']);
/** 南亚：披甲破门巨象 */
const SOUTH_ASIAN = new Set<string>(['INDIA', 'PURU', 'BENGALIS', 'GURJARAS', 'INDIA_FEUDAL', 'INDIA_CASTLE', 'INDIA_IMPERIAL', 'DELHI', 'MUGHAL', 'SIKH']);
/** 东南亚：吴哥弩炮战象 */
const SE_ASIAN = new Set<string>(['KHMER', 'BURMESE', 'MALAY', 'SEASIA_ANTIQUITY', 'SEASIA_FEUDAL', 'SEASIA_CASTLE', 'SEASIA_IMPERIAL', 'SRIVIJAYA', 'JAVANESE']);
/** 沙漠/中亚：骆驼驮载曼加尼克（河西·党项骆驼砲同源，主人 2026-09-06 定） */
const NOMAD_DESERT = new Set<string>(['CENTRAL_ASIA', 'CENTRAL_ASIA_ANTIQUITY', 'CENTRAL_ASIA_CASTLE', 'CENTRAL_ASIA_IMPERIAL', 'WEST_ASIA', 'WEST_ASIA_ANTIQUITY', 'WEST_ASIA_CASTLE', 'BERBER', 'ORIE', 'ORIE_ANTIQUITY', 'TANGUT']);
/** 草原：鞑靼火焰骆驼（帖木儿 1398 德里之战） */
const STEPPE_FIRE_CAMEL = new Set<string>(['STEPPE', 'STEPPE_IMPERIAL', 'TIMURID', 'ILKHANATE']);
/**
 * 草原征服王朝的抛石：蒙古西征的砲兵是汉人与波斯工匠，用的是牵引砲（襄阳之前）与配重回回砲，
 * 不是欧洲那套扭力投石车。库中没有配重砲素材，牵引砲是最贴的一档。
 * 【2026-09-09 主人定·符合历史】古典草原（匈奴）与封建草原（柔然/突厥/回鹘）同线——
 * 游牧政权攻汉城/中亚城毕用掳掠工匠所造之砲，属汉波斯系牵引砲，不走欧洲扭力系。
 */
const STEPPE_TREBUCHET = new Set<string>(['STEPPE', 'STEPPE_IMPERIAL', 'STEPPE_ANTIQUITY', 'STEPPE_FEUDAL', 'TIMURID', 'ILKHANATE']);
/**
 * 美洲原住民：没有冲车/投石机/攻城塔的传统，围城靠人海与梯子 → 只发一件最基本的古典攻城槌破门，
 * 不再发抛石/弩炮/攻城塔一线。城墙仍会按开战 30 秒随机坍塌那条路放行，不会把推演卡死。
 */
const AMERICAS = new Set<string>([
    'AMERICA', 'ANDE', 'MAYANS', 'MAPUCHE', 'MUISCA', 'TUPI', 'IROQUOIS',
    'CHIMU', 'TARASCAN', 'TAIRONA', 'TEHUELCHE', 'NORTHAM_IMPERIAL', 'SOUTHAM_IMPERIAL',
]);

// ── 热兵器（城堡起，按文化；帝国再追加一门火炮）───────────────────────
/** 城堡时代的攻城热兵器：只发给史上真用过的那几个文化 */
const JAPAN_SIEGE = new Set<string>(['JAPAN', 'JAPAN_ANTIQUITY', 'JAPAN_IMPERIAL']);  // 日本无宋式猛火油柜
function castleGunpowderFor(culture: string): string | null {
    if (culture === 'GORYEO' || culture === 'JOSEON') return 'rocket_cart';   // 高丽·朝鲜神机箭
    if (CHINESE.has(culture) && !JAPAN_SIEGE.has(culture)) return 'flamethrower';  // 宋·猛火油柜（日本无）
    if (culture === 'BOHEMIANS') return 'houfnice';                           // 胡斯战争·波希米亚榴弹炮
    return null;
}
/** 帝国时代再追加一门：火炮普及，但美洲原住民没有 */
function imperialGunpowderFor(culture: string): string | null {
    if (AMERICAS.has(culture)) return null;
    if (culture === 'PORTUGUESE') return 'organ_gun';                          // 葡萄牙风琴炮
    if (culture === 'MING' || culture === 'MANCHU' || culture === 'HUAXIA_IMPERIAL' || culture === 'JOSEON') {
        return 'heavy_rocket_cart';                                            // 明清·朝鲜火箭车
    }
    return 'bombard_cannon';                                                   // 欧洲/西亚/印度/日本攻城火炮
}

/**
 * 这一场攻城战，攻方按【文化 + 军团时代】发放的攻城武器列表。
 *
 * 🔴 [2026-09-10 主人定死] 终极铁律：
 * 1. 要符合历史；
 * 2. 古典时代的军团只能用古典的攻城武器；
 * 3. 封建时代军团，可以用古典+封建的攻城武器；
 * 4. 城堡时代的军团，可以用古典+封建+城堡的攻城武器，并可以使用城堡时代的热兵器攻城武器；
 * 5. 帝国时代的军团，可以使用所有攻城武器；
 * 6. 每个军团的攻城武器必须是 9 个。可以样式重复，但是不能增减数量！
 * 7. 必须有冲车。
 */
export function getSiegeWeaponsForCulture(culture: RegionType): string[] {
    const key = String(culture);
    const cap = legionSiegeAge(culture);
    const capRank = AGE_RANK[cap];

    // 美洲原住民：历史无复杂机械器械，依铁律允许样式重复，由本时代破门攻城槌满编排满 9 辆
    if (AMERICAS.has(key)) {
        const ram1 = stepForAge('battering_ram', cap) ?? 'antiquity_battering_ram';
        const ram2 = stepForAge('capped_ram', cap) ?? 'antiquity_battering_ram';
        const ram3 = stepForAge('siege_ram', cap) ?? 'antiquity_battering_ram';
        return [ram1, ram1, ram1, ram2, ram2, ram2, ram3, ram3, ram3];
    }

    const items: string[] = [];

    // ① 破门 3 辆（槽位 1~3 恒定死锁为冲车/破门象，绝不被任何热兵器替换，彻底定死「必须有冲车」铁律）
    let r1 = 'battering_ram', r2 = 'capped_ram', r3 = 'siege_ram';
    if (SOUTH_ASIAN.has(culture) && capRank >= AGE_RANK.castle) {
        r1 = 'armored_elephant';
        r2 = 'armored_elephant';
        r3 = 'elite_armored_elephant';
    } else if (culture === 'KHMER' || culture === 'BURMESE') {
        r1 = 'battering_ram';
        r2 = 'capped_ram';
        r3 = 'capped_ram';
    }
    const resolvedRams = [r1, r2, r3].map(w => {
        const resolved = stepForAge(w, cap);
        if (resolved) return resolved;
        return fallbackFor(LINE_OF.get(w)?.role ?? 'ram', cap, items);
    });
    items.push(...resolvedRams);

    // 辅助解析器
    const resolveItem = (w: string, role: SiegeRole) => {
        const resolved = stepForAge(w, cap);
        if (resolved) return resolved;
        return fallbackFor(LINE_OF.get(w)?.role ?? role, cap, items);
    };

    // ② 抛石 2 辆（槽位 4~5：基础投石火力）
    let t1 = 'mangonel', t2 = 'onager', t3 = 'siege_onager';
    if (CHINESE.has(culture) || STEPPE_TREBUCHET.has(culture)) {
        t1 = 'traction_trebuchet';
        t2 = 'traction_trebuchet';
        t3 = 'traction_trebuchet';
    } else if (NOMAD_DESERT.has(culture)) {
        t1 = 'mounted_trebuchet';
        t2 = 'mounted_trebuchet';
        t3 = 'onager';
    }
    items.push(resolveItem(t1, 'thrower'), resolveItem(t2, 'thrower'));

    // ③ 槽位 6：第 3 辆抛石，或重型攻城火器（帝国火炮/火箭车，城堡胡斯榴弹炮）
    let heavyWeapon: string | null = null;
    if (capRank >= AGE_RANK.imperial) {
        if (culture === 'MING' || culture === 'MANCHU' || culture === 'HUAXIA_IMPERIAL' || culture === 'JOSEON') {
            heavyWeapon = 'heavy_rocket_cart'; // 明清/朝鲜帝国火箭车
        } else {
            heavyWeapon = 'bombard_cannon';    // 帝国攻城重炮
        }
    } else if (capRank >= AGE_RANK.castle) {
        if (culture === 'BOHEMIANS') {
            heavyWeapon = 'houfnice';          // 胡斯榴弹炮
        }
    }
    items.push(heavyWeapon ?? resolveItem(t3, 'thrower'));

    // ④ 槽位 7：压制弩炮 1 辆
    let b1 = 'scorpion', b2 = 'heavy_scorpion';
    if (PERSIAN_BALLISTA.has(culture)) {
        b1 = 'siege_ballista';
        b2 = 'antiquity_heavy_scorpion';
    } else if (culture === 'KHMER') {
        b1 = 'ballista_elephant';
        b2 = 'elite_ballista_elephant';
    } else if (SE_ASIAN.has(culture)) {
        b1 = 'ballista_elephant';
        b2 = 'heavy_scorpion';
    }
    items.push(resolveItem(b1, 'bolt'));

    // ⑤ 槽位 8：近距攻城 / 特色热兵器 1 辆
    let tacticalGunpowder: string | null = null;
    if (capRank >= AGE_RANK.castle) {
        if (culture === 'GORYEO' || culture === 'JOSEON') {
            tacticalGunpowder = 'rocket_cart'; // 神机箭
        } else if (CHINESE.has(culture) && !JAPAN_SIEGE.has(culture)) {
            tacticalGunpowder = 'flamethrower'; // 猛火油柜
        }
    }
    if (capRank >= AGE_RANK.imperial && culture === 'PORTUGUESE') {
        tacticalGunpowder = 'organ_gun'; // 葡萄牙风琴炮
    }
    items.push(tacticalGunpowder ?? resolveItem(b2, 'bolt'));

    // ⑥ 槽位 9：特色 / 突击攻城 1 辆
    let specialUnit: string | null = null;
    if (HELEPOLIS_CULTURES.has(culture)) {
        specialUnit = 'helepolis';
    } else if (STEPPE_FIRE_CAMEL.has(culture) && capRank >= AGE_RANK.castle) {
        specialUnit = 'flaming_camel';
    } else if (capRank >= AGE_RANK.castle) {
        // 城堡与帝国时代：热兵器掷弹兵攻城
        specialUnit = 'grenadier';
    } else if (CLASSICAL.has(culture)) {
        specialUnit = 'antiquity_siege_tower';
    } else if (NOMAD_DESERT.has(culture) && capRank >= AGE_RANK.feudal) {
        specialUnit = 'mounted_trebuchet';
    } else {
        specialUnit = resolveItem('siege_tower', 'special');
    }
    items.push(specialUnit);

    // 终极安全闸：绝对死锁为严格 9 辆（不足补冲车，超额截断）
    const ramFallback = resolvedRams[0] ?? 'antiquity_battering_ram';
    while (items.length < 9) items.push(ramFallback);
    if (items.length > 9) items.length = 9;

    return items;
}
