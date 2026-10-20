/**
 * 🔴 [2026-10-20 主人定] 百岁模式：**武将不在世的势力，名字与旗号改用「当时代的军团名」**。
 *
 * 主人原话（逐字照录）：
 *   「武将不在世的时候，势力和旗号也不能用。可以统一改为军团哪种泛称的名字。」
 *   「依然出现，依然用，只是改个名字。例如日本江户城，他的武将是德川吧，要等 15XX 年了。
 *     其他年份，例如古代时代，这个据点古典时代是大和军团，那么势力就用大和，旗号也用简称大和。」
 *
 * 口径：
 *   · **只改显示，不改归属**：势力照旧存在、照旧占地/征募/打仗/换旗色，
 *     只把「势力名」和「旗号文字」换成该据点**当时代的军团名**（去掉「古典时代/封建时代/城堡时代/帝国时代」
 *     前缀和「军团」二字）——如日本：古典=大和 / 封建=平安 / 城堡=幕府 / 帝国=武家；
 *   · **判定用在场武将**：该势力（一势力一据点）只要还有一位在场武将，就照旧用原势力名；
 *     一位都不在场（未登场 / 已过「登场年 + 100」）才换成时代名；
 *   · 据点建筑文化 × 当前年份所属时代 → 军团，一律走 `resolveCityDefenseLegionName`
 *     （与「每个时代每个据点只能出本文化该时代军团」同一条解析，不另写一套）；
 *   · 旗号文字 = 时代名（旗面绘制仍按现规则只画前两字：大和→大和、巴克特里亚→巴克）；
 *   · 🔴 [2026-10-20 主人令「中原军团改用华夏军团势力，旗显示四个时代统一为华」]
 *     中原（CENTRAL）四时代的名字**不写死朝代名**，一律随当时代军团名
 *     （古典时代华夏军团→华夏、封建时代中原军团→中原、城堡时代中华军团→中华、帝国时代中国军团→中国），
 *     **旗号四个时代统一只写一个字「华」**（见下面的 `CENTRAL|*` 条目）；
 *   · 只在**百岁模式**启用（`refreshEraFactionDisplays(null)` 即关闭：剧本模式用史实归属、乱斗不变）。
 */
import { CITIES_V2 } from './cities_v2';
import { FACTION_GENERALS, type FactionGeneral } from './FactionGenerals';
import { isGeneralOnStage } from './generalOnStage';
import {
    getEraByYear,
    resolveCityDefenseLegionName,
    type DefenseEraAge,
} from '../types/CultureFormations';

/** 四个时代在军团名里的前缀（与 `level2Civ62Legions.ts` 的命名同一口径） */
const ERA_PREFIXES = ['古典时代', '封建时代', '城堡时代', '帝国时代'] as const;

/** 每个时代取一个代表年份，供「建筑文化 × 时代 → 军团」解析（只用来定时代，年份本身不回传） */
const ERA_SAMPLE_YEAR: Record<DefenseEraAge, number> = {
    antiquity: -300,
    feudal: 800,
    castle: 1200,
    imperial: 1600,
};

/** 势力 → 它开局那座据点（一势力一据点；取库里该势力的第一座城的建筑文化） */
const FACTION_CITY: ReadonlyMap<string, { buildingStyle: string | undefined }> = (() => {
    const map = new Map<string, { buildingStyle: string | undefined }>();
    for (const city of CITIES_V2) {
        if (map.has(city.factionId)) continue;
        map.set(city.factionId, { buildingStyle: city.buildingStyle });
    }
    return map;
})();

/** 「古典时代大和军团」→「大和」；不是四时代军团名（剧本军团等）→ null */
function eraNameOfLegion(legionName: string | null | undefined): string | null {
    if (!legionName) return null;
    for (const prefix of ERA_PREFIXES) {
        if (!legionName.startsWith(prefix)) continue;
        const name = legionName.slice(prefix.length).replace(/军团$/, '');
        return name || null;
    }
    return null;
}

/**
 * 🔴 [2026-10-20 主人定] **朝代名用正名**（「只有朝代要注意」）：
 *   · 🔴 **中原（CENTRAL）四时代已按主人 2026-10-20 新令改为「随当时代军团名 + 旗号统一华」**，
 *     不再写死朝代名（原「秦汉→汉、隋唐→唐、宋禁→宋」对中原四时代作废，见下面 `CENTRAL|*` 条目）；
 *   · 两个朝代并列的名字只取后一个：秦汉→汉、隋唐→唐；
 *   · 河朔那一支主人再定：「河朔的古典改为太行，封建改为河朔」→ 古典**太行**、封建**河朔**；
 *   · 江南那一支主人定：封建→**江淮**、城堡（南宋）→**江南**；
 *   · 西域那一支（2026-10-20 主人问「用西域好，还是塞种好？回鹘好，还是安西好？」后的裁定）：
 *     古典→**西域**（汉西域都护府的地区／行政统称；塞种只是于阗一带的族群，盖不全龟兹吐火罗、楼兰车师），
 *     封建→**安西**（唐安西都护府的行政名，与越南那段「静海＝唐静海军」同一逻辑；回鹘只覆盖 744 年后一段）；
 *   · 河西那一支（2026-10-20 主人问「河西用西凉好，还是凉州好？」后的裁定）：古典→**凉州**
 *     （汉凉州刺史部~唐凉州，前后七八百年；西凉只是十六国里 400–421 年的一个短命政权，太窄）；
 *   · 巴蜀·城堡那一支（2026-10-20 主人问「城堡时代山城军团这个名字可以吗，用改吗？」后的裁定）：
 *     「山城」是**工事／战术形态**（南宋四川山城防御体系），不是政权／地区通称，且容易和日本山城国、
 *     朝鲜山城混；改为**川峡**（北宋川峡四路＝宋元巴蜀的正式行政区统称，与「剑南」「四川」同一脉络）；
 *   · 阿契美尼德·古典那一支（2026-10-20 主人问「古典时代长生军团这个名字要改吗？」→ 又否掉「波斯」）：
 *     **长生／不死是部队番号**（阿契美尼德「不死军」Immortals），按规则不能当军团名；**「波斯」也不能用** ——
 *     那已经是另一支波斯建筑文化（`SASANIAN`，势力名「波斯」）的招牌。改为**阿契美尼德**（王朝正名，
 *     与那支波斯的「古典时代萨珊军团」正好对称）；军团全名「古典时代阿契美尼德军团」不与剧本军团「阿契美尼德军团」重名；
 *   · 越南那一段主人点名：丁黎→**静海**（用行政名，不用两朝并列）；
 *   · 「宋禁」（宋禁军）只留朝代：→**宋**（中原·城堡，2026-10-20 中原四时代改随军团名后已不适用）；
 *   · 带「大」的国号正名保留全名：大明（主人原话「大明是两个字，用大明」）、大金、大夏、大越；
 *   · 单个朝代／政权名本身已经是正名（南宋、朝鲜、新罗、高丽…）→ 不动；
 *   · 非朝代的泛称（大和、平安、幕府、华夏、吴越、燕云、巴蜀…）→ 一律不动。
 *
 * 键 = `建筑风格|时代`（**不按军团名当键**：军团本身可能被改名——魏晋/北朝/丁黎已改造成
 * 太行/河朔/瞿越军团，按名字当键会静默失效）。
 *
 * 🔴 [2026-10-20 主人令「凉州的话，旗帜只用一个凉字就行」] **旗号文字可与显示名分开定**：
 *    条目写 `flagText` 就按它画旗（`凉州` → 旗面只写「**凉**」），不写就沿用「显示名前两字」的旧规则。
 */
interface EraNameDef {
    /** 势力名（界面文字，如「凉州」）；**不写 = 随当时代军团名**（去时代前缀与「军团」） */
    name?: string;
    /** 旗号文字（不写 = 取 name 前两字；写了就按它画，如「凉」「华」） */
    flagText?: string;
}

const ERA_DISPLAY_OVERRIDES: Readonly<Record<string, EraNameDef>> = {
    // 🔴 [2026-10-20 主人令] 中原四时代：名字随当时代军团名（华夏/中原/中华/中国），旗号四时代统一「华」
    'CENTRAL|antiquity': { flagText: '华' },    // 古典时代华夏军团 → 华夏；旗面只写「华」
    'CENTRAL|feudal': { flagText: '华' },       // 封建时代中原军团 → 中原；旗面只写「华」
    'CENTRAL|castle': { flagText: '华' },       // 城堡时代中华军团 → 中华；旗面只写「华」
    'CENTRAL|imperial': { flagText: '华' },     // 帝国时代中国军团 → 中国；旗面只写「华」
    'WEI|antiquity': { name: '太行' },          // 古典时代太行军团（原魏晋军团）
    'WEI|feudal': { name: '河朔' },             // 封建时代河朔军团（原北朝军团）
    'JIANGNAN|feudal': { name: '江淮' },        // 封建时代江淮军团
    'JIANGNAN|castle': { name: '江南' },        // 城堡时代江南军团（原南宋军团）
    'WESTERN|antiquity': { name: '西域' },      // 古典时代西域军团（原塞种军团；地区/行政统称，不用族群名）
    'WESTERN|feudal': { name: '安西' },         // 封建时代安西军团（原回鹘军团；唐安西都护府，与静海同一类行政名）
    'KHITAN|antiquity': { name: '凉州', flagText: '凉' },  // 古典时代凉州军团（原西凉军团）；旗面只写一个「凉」
    'BASHU|castle': { name: '川峡' },           // 城堡时代川峡军团（原山城军团；北宋川峡四路，宋元巴蜀的行政区统称）
    'PERSIAN|antiquity': { name: '阿契美尼德' }, // 古典时代阿契美尼德军团（原长生／不死军团；长生军是部队番号，不能当军团名）
    'VIETNAMESE|feudal': { name: '静海' },      // 封建时代瞿越军团（原丁黎军团）
};

/** (建筑风格 × 时代) → 时代名（含可选旗号文字）；一局只算一遍（建筑文化 66 × 时代 4） */
const eraNameCache = new Map<string, EraNameDef | null>();
function eraNameOfStyleAndEra(buildingStyle: string | undefined, era: DefenseEraAge): EraNameDef | null {
    if (!buildingStyle) return null;
    const key = `${buildingStyle}|${era}`;
    if (eraNameCache.has(key)) return eraNameCache.get(key) ?? null;
    const override = ERA_DISPLAY_OVERRIDES[key];
    // 名字：主人单独定过就用它；没定（如中原四时代）→ 随当时代军团名
    const legion = resolveCityDefenseLegionName(undefined, ERA_SAMPLE_YEAR[era], buildingStyle, null);
    const name = override?.name ?? eraNameOfLegion(legion);
    const entry: EraNameDef | null = name ? { name, flagText: override?.flagText } : null;
    eraNameCache.set(key, entry);
    return entry;
}

/**
 * 势力 → 为它出场的武将 id。
 * 🔴 [2026-10-20 主人令「一个武将一个势力」] 武将写了自己的 `factionId` 就算那个势力的人
 *    （长安的王离算秦、不算唐），否则算所在据点的势力。
 */
let generalsByOwnFaction: Map<string, string[]> | null = null;
function getGeneralsByOwnFaction(): Map<string, string[]> {
    if (generalsByOwnFaction) return generalsByOwnFaction;
    const map = new Map<string, string[]>();
    for (const [anchorFactionId, entry] of Object.entries(FACTION_GENERALS)) {
        const list: FactionGeneral[] = Array.isArray(entry) ? entry : [entry as FactionGeneral];
        for (const general of list) {
            const fid = general.factionId ?? anchorFactionId;
            const ids = map.get(fid);
            if (ids) ids.push(general.generalId);
            else map.set(fid, [general.generalId]);
        }
    }
    generalsByOwnFaction = map;
    return map;
}

/** 该势力此刻还有没有在场武将（任一在场即算在场；判定即百岁模式的「登场年 ～ 登场年 + 100」） */
function hasOnStageGeneral(factionId: string): boolean {
    const ids = getGeneralsByOwnFaction().get(factionId);
    if (!ids) return false;
    for (const generalId of ids) {
        if (isGeneralOnStage(generalId)) return true;
    }
    return false;
}

/** 当前生效的时代名覆盖：factionId → 名字（含可选旗号文字；空 = 关闭） */
let overrides = new Map<string, EraNameDef>();

/** 该势力此刻显示的时代名（没有覆盖 → null，照旧用原势力名） */
export function getEraFactionDisplayName(factionId: string | null | undefined): string | null {
    if (!factionId) return null;
    return overrides.get(factionId)?.name ?? null;
}

/** 该势力此刻的**旗号文字**（主人单独定过的，如凉州→「凉」）；没单独定 → null（沿用显示名前两字） */
export function getEraFactionDisplayFlagText(factionId: string | null | undefined): string | null {
    if (!factionId) return null;
    return overrides.get(factionId)?.flagText ?? null;
}

/**
 * 重算时代名覆盖表。
 * @param year 当前年份；**null = 关闭**（剧本模式 / 乱斗模式 / 编辑器按原样）
 * @returns 名字有变化的势力 id（调用方据此刷新这些势力的旗号；开局/跨时代时会很多，跨年一般十几个）
 */
export function refreshEraFactionDisplays(year: number | null): string[] {
    const next = new Map<string, EraNameDef>();
    if (year != null && Number.isFinite(year)) {
        const era = getEraByYear(year);
        for (const [factionId, info] of FACTION_CITY) {
            if (hasOnStageGeneral(factionId)) continue;
            const entry = eraNameOfStyleAndEra(info.buildingStyle, era);
            if (entry) next.set(factionId, entry);
        }
    }
    const changed: string[] = [];
    for (const [factionId, entry] of next) {
        const prev = overrides.get(factionId);
        if (!prev || prev.name !== entry.name || (prev.flagText ?? null) !== (entry.flagText ?? null)) changed.push(factionId);
    }
    for (const factionId of overrides.keys()) {
        if (!next.has(factionId)) changed.push(factionId);
    }
    overrides = next;
    return changed;
}
