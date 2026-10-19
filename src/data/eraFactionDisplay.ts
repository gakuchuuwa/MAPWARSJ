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
 *   · 两个朝代并列的名字只取后一个：秦汉→汉、隋唐→唐；
 *   · 河朔那一支主人再定：「河朔的古典改为太行，封建改为河朔」→ 古典**太行**、封建**河朔**；
 *   · 越南那一段主人点名：丁黎→**静海**（用行政名，不用两朝并列）；
 *   · 「宋禁」（宋禁军）只留朝代：→**宋**；
 *   · 带「大」的国号正名保留全名：大明（主人原话「大明是两个字，用大明」）、大金、大夏、大越；
 *   · 单个朝代／政权名本身已经是正名（南宋、朝鲜、新罗、高丽…）→ 不动；
 *   · 非朝代的泛称（大和、平安、幕府、华夏、吴越、燕云、巴蜀…）→ 一律不动。
 *
 * 键 = `建筑风格|时代`（**不按军团名当键**：军团本身可能被改名——魏晋/北朝/丁黎已改造成
 * 太行/河朔/瞿越军团，按名字当键会静默失效）。
 */
const ERA_DISPLAY_OVERRIDES: Readonly<Record<string, string>> = {
    'CENTRAL|antiquity': '汉',        // 古典时代秦汉军团
    'CENTRAL|feudal': '唐',           // 封建时代隋唐军团
    'CENTRAL|castle': '宋',           // 城堡时代宋禁军团
    'WEI|antiquity': '太行',          // 古典时代太行军团（原魏晋军团）
    'WEI|feudal': '河朔',             // 封建时代河朔军团（原北朝军团）
    'VIETNAMESE|feudal': '静海',      // 封建时代瞿越军团（原丁黎军团）
};

/** (建筑风格 × 时代) → 时代名；一局只算一遍（建筑文化 66 × 时代 4） */
const eraNameCache = new Map<string, string | null>();
function eraNameOfStyleAndEra(buildingStyle: string | undefined, era: DefenseEraAge): string | null {
    if (!buildingStyle) return null;
    const key = `${buildingStyle}|${era}`;
    if (eraNameCache.has(key)) return eraNameCache.get(key) ?? null;
    const override = ERA_DISPLAY_OVERRIDES[key];
    let name: string | null = override ?? null;
    if (!name) {
        const legion = resolveCityDefenseLegionName(undefined, ERA_SAMPLE_YEAR[era], buildingStyle, null);
        name = eraNameOfLegion(legion);
    }
    eraNameCache.set(key, name);
    return name;
}

/** 该势力此刻还有没有在场武将（任一在场即算在场；判定即百岁模式的「登场年 ～ 登场年 + 100」） */
function hasOnStageGeneral(factionId: string): boolean {
    const entry = FACTION_GENERALS[factionId];
    if (!entry) return false;
    const list: FactionGeneral[] = Array.isArray(entry) ? [...entry] : [entry as FactionGeneral];
    for (const general of list) {
        if (isGeneralOnStage(general.generalId)) return true;
    }
    return false;
}

/** 当前生效的时代名覆盖：factionId → 名字（空 = 关闭） */
let overrides = new Map<string, string>();

/** 该势力此刻显示的时代名（没有覆盖 → null，照旧用原势力名） */
export function getEraFactionDisplayName(factionId: string | null | undefined): string | null {
    if (!factionId) return null;
    return overrides.get(factionId) ?? null;
}

/**
 * 重算时代名覆盖表。
 * @param year 当前年份；**null = 关闭**（剧本模式 / 乱斗模式 / 编辑器按原样）
 * @returns 名字有变化的势力 id（调用方据此刷新这些势力的旗号；开局/跨时代时会很多，跨年一般十几个）
 */
export function refreshEraFactionDisplays(year: number | null): string[] {
    const next = new Map<string, string>();
    if (year != null && Number.isFinite(year)) {
        const era = getEraByYear(year);
        for (const [factionId, info] of FACTION_CITY) {
            if (hasOnStageGeneral(factionId)) continue;
            const name = eraNameOfStyleAndEra(info.buildingStyle, era);
            if (name) next.set(factionId, name);
        }
    }
    const changed: string[] = [];
    for (const [factionId, name] of next) {
        if (overrides.get(factionId) !== name) changed.push(factionId);
    }
    for (const factionId of overrides.keys()) {
        if (!next.has(factionId)) changed.push(factionId);
    }
    overrides = next;
    return changed;
}
