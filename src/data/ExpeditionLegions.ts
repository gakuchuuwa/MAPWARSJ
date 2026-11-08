/**
 * 精锐番号查询（唯一入口）
 *
 * 🔴 [2026-11-07 主人令「远征军团名是什么玩意？没用的删除，不要留误导信息」]
 *    **整套「远征番号／势力级精锐番号」已删除**：原先 34 个 `*ExpeditionLegions.ts` 里的
 *    `factionId → { name, tier }` 表（约 1000 条，如元朝一律叫「金莲川军」），会给出兵的无将部队、
 *    甚至别的将领凭空显示一个不是他本人的番号 —— 与「精锐跟武将走」（AGENTS §二.3）冲突，属误导信息。
 *    同批删除的还有 `GENERAL_ELITE_LEGIONS`（592 条与 `FactionGenerals` 逐一重复，查无可达）。
 *
 * 现在的精锐只有两条真实来源：
 *   ① **武将自带**：`FactionGeneral.eliteName / eliteTier`（全库 1925 位武将 0 缺）；
 *   ② **据点精锐**：`CITY_ELITE_LEGIONS` —— 由「该据点武将的精锐」现推（不再手填番号）。
 *   势力没有武将时就没有精锐，不再编一个名字顶上。
 */
import { STARTING_CAPITALS } from './StartingCapitals';
import { CITIES_V2 } from './cities_v2';
import { FACTION_GENERALS, getDefaultCityFactionId, getRawGeneralByGeneralId } from './FactionGenerals';

export type EliteTier = 0 | 1 | 2 | 3 | 4;
export interface EliteLegionConfig {
  name: string;
  tier: EliteTier;
}

/**
 * 精锐五级制的**档位名**（唯一口径，2026-11-03 主人定）。
 * T0 传奇｜T1 战略｜T2 战术｜T3 知名｜T4 存在 —— UI 一律显示这五个词，不显示 T0/T1 之类代号；
 * 旧称「天神军／王者师／劲锐旅／精英团／戍卫营」已废。
 */
export const ELITE_TIER_LABELS = ['传奇', '战略', '战术', '知名', '存在'] as const;

/** 档位数字 → 档位名（越界回落空串，调用方自行兜底） */
export function getEliteTierDisplayName(tier: EliteTier | number | null | undefined): string {
  if (tier === null || tier === undefined) return '';
  return (ELITE_TIER_LABELS as readonly string[])[tier] ?? '';
}

/** 遍历全库武将条目（含数组式与单条式） */
function forEachGeneral(fn: (general: { generalId: string; eliteName?: string; eliteTier?: EliteTier; cityId?: string; factionId?: string }) => void): void {
  for (const [factionId, entry] of Object.entries(FACTION_GENERALS)) {
    if (!entry) continue;
    const list = Array.isArray(entry) ? entry : [entry];
    for (const g of list) {
      if (!g) continue;
      fn({ ...(g as any), factionId: (g as any).factionId ?? factionId });
    }
  }
}

/**
 * 按 generalId 查询该武将的专属精锐配置（「一个武将一支精锐」）。
 * 只认武将条目自带的 `eliteName / eliteTier`；查不到就是没有精锐，不再按势力/据点编番号。
 */
export function getGeneralEliteConfig(generalId: string | null | undefined): EliteLegionConfig | null {
  if (!generalId) return null;
  const hit = getRawGeneralByGeneralId(generalId);
  if (!hit?.general?.eliteName) return null;
  return {
    name: hit.general.eliteName,
    tier: (hit.general.eliteTier ?? 2) as EliteTier,
  };
}

/** 按 generalId 查询该武将的专属精锐番号（「一个武将一支精锐」） */
export function getGeneralEliteLegionName(generalId: string | null | undefined): string | null {
  return getGeneralEliteConfig(generalId)?.name ?? null;
}

/**
 * 势力级精锐：只用于「这支势力没有带将部队」时的显示兜底。
 * 取该势力**武将自己的精锐**（单将势力直接取该将；多将势力仅在同一番号占 ≥60% 时才作为势力兜底），势力无将 → null。
 */
export function getFactionEliteConfig(factionId: string | null | undefined): EliteLegionConfig | null {
  if (!factionId) return null;
  const entry = FACTION_GENERALS[factionId as keyof typeof FACTION_GENERALS] as any;
  if (!entry) return null;
  const list = Array.isArray(entry) ? entry : [entry];
  // 🔴 [2026-11-08 主人报「薛仁贵的精锐怎么还是黄头军」] 旧逻辑取「数组里第一个有精锐的将」，
  //    唐这种将多号杂的势力就会把陈敬瑄的「西川黄头军」当成整个唐的兜底精锐。
  //    正确口径：
  //      · 单将势力（total === 1）：该将的精锐即本势力唯一精锐，直接返回；
  //      · 多将势力（total >= 2）：仅当同一番号占 ≥60% 时才给势力级兜底，否则返回 null（各将用各将自己的番号，绝不张冠李戴）。
  const counts = new Map<string, { n: number; tier: EliteTier }>();
  let total = 0;
  for (const g of list) {
    if (!g?.eliteName) continue;
    total++;
    const hit = counts.get(g.eliteName);
    if (hit) hit.n++;
    else counts.set(g.eliteName, { n: 1, tier: (g.eliteTier ?? 2) as EliteTier });
  }
  if (total === 0) return null;
  let bestName = '';
  let best = { n: 0, tier: 2 as EliteTier };
  for (const [name, v] of counts) if (v.n > best.n) { best = v; bestName = name; }
  if (!bestName) return null;
  if (total >= 2 && best.n / total < 0.6) return null;
  return { name: bestName, tier: best.tier };
}

/**
 * 据点精锐（番号随将）：该据点**武将自己的精锐**。
 * 一个据点有多位武将时，取条目顺序第一位有精锐的（同据点不同时代的将各挂各的，这里是守城兜底）。
 */
function buildCityEliteLegionMap(): Readonly<Record<string, EliteLegionConfig>> {
  const map: Record<string, EliteLegionConfig> = {};
  forEachGeneral((g) => {
    if (!g.cityId || !g.eliteName || map[g.cityId]) return;
    map[g.cityId] = { name: g.eliteName, tier: (g.eliteTier ?? 2) as EliteTier };
  });
  return map;
}

/** 运行时：据点 cityId → 精锐番号（由该据点武将的精锐现推） */
export const CITY_ELITE_LEGIONS: Readonly<Record<string, EliteLegionConfig>> = buildCityEliteLegionMap();

function buildCityAnchorFactionMap(): Readonly<Record<string, string>> {
  // 🔴 [2026-11-08 主人定] 据点锚定势力优先取该据点当家武将（名将优先）所属政权；无将时兜底 cities_v2.factionId
  const map: Record<string, string> = {};
  for (const city of CITIES_V2) {
    const genFid = getDefaultCityFactionId(city.id);
    if (genFid && genFid !== 'panshu') {
      map[city.id] = genFid;
    } else if (city.factionId) {
      map[city.id] = city.factionId;
    }
  }
  for (const [factionId, cityId] of Object.entries(STARTING_CAPITALS)) {
    if (cityId && !map[cityId]) map[cityId] = factionId;
  }
  return map;
}

/** 据点 → 史料锚定势力（cities_v2.factionId；旗号易主不改变） */
export const CITY_ANCHOR_FACTION: Readonly<Record<string, string>> = buildCityAnchorFactionMap();

/** 据点在史料录入中锚定的势力 id（无则该城不出将/精） */
export function getCityAnchorFactionId(cityId: string | null | undefined): string | null {
  if (!cityId) return null;
  return CITY_ANCHOR_FACTION[cityId] ?? null;
}

/** 是否为有将/精录入的据点首都（募兵与守城共用） */
export function isCityGeneralEliteAnchor(cityId: string | null | undefined): boolean {
  if (!getCityAnchorFactionId(cityId)) return false;
  return getCityEliteConfig(cityId) != null;
}

/** 查番号时的军团最小接口 */
export type LegionEliteLookup = {
  getFactionId(): string;
  homeCityId?: string | null;
  getSourceCityId(): string | null;
  generalId?: string | null;
  /** 🔴 [2026-09-23] 战场事件的史实军团：番号直接挂在军团上（军团名只写「马其顿军团」，不再拼番号） */
  eliteOverride?: EliteLegionConfig | null;
};

/**
 * 按军团将领/出兵据点查精锐（一个武将一支精锐）：
 * 该将自带精锐 → eliteOverride（无将/拟名事件部队） → 该将所属势力的武将精锐 → 出兵据点的武将精锐。
 */
export function getLegionEliteConfig(army: LegionEliteLookup): EliteLegionConfig | null {
  if (army.generalId) {
    const genElite = getGeneralEliteConfig(army.generalId);
    if (genElite) return genElite;
  }
  if (army.eliteOverride) return army.eliteOverride;
  if (army.generalId) {
    // 🔴 [2026-10-24 修「精锐跨势力外溢」（AGENTS 二-4：别国武将精锐不许随城错配）]
    //    有将却查不到专属精锐（典型：经典战拟名／战场人物不在将领档）→ 取**本军势力**的将精锐；
    //    不再按 homeCityId/sourceCityId 的据点兜底，否则攻方会顶替被攻城（守方）的精锐。
    const ownFactionElite = getFactionEliteConfig(army.getFactionId());
    return ownFactionElite ?? null;
  }
  const cityId = army.homeCityId ?? army.getSourceCityId();
  return getCityEliteConfig(cityId);
}

/** 番号随将/随城：按军团 generalId 或 homeCityId / sourceCityId 查精锐番号 */
export function getLegionEliteLegionName(army: LegionEliteLookup): string | null {
  return getLegionEliteConfig(army)?.name ?? null;
}

/** 番号随将/随城：若有 generalId 优先查该武将专属精锐，否则据 cityId 查精锐配置 */
export function getCityEliteConfig(
  cityId: string | null | undefined,
  generalId?: string | null,
): EliteLegionConfig | null {
  if (generalId) {
    const genElite = getGeneralEliteConfig(generalId);
    if (genElite) return genElite;
  }
  if (!cityId) return null;
  return CITY_ELITE_LEGIONS[cityId] ?? null;
}

/** 番号随将/随城：若有 generalId 优先查该武将专属精锐番号，否则据 cityId 查精锐番号 */
export function getCityEliteLegionName(
  cityId: string | null | undefined,
  generalId?: string | null,
): string | null {
  return getCityEliteConfig(cityId, generalId)?.name ?? null;
}
