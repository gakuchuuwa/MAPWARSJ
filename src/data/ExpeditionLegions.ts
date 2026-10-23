/**
 * 远征精锐番号统一查询（14 文化区）
 *
 * ═══════════════════════════════════════════════════════════════════
 * 【AGENTS.md §十二 — AI 写入前必读，三者防重】
 * ═══════════════════════════════════════════════════════════════════
 *
 * 玩家看见三样东西，必须是三个不同专名：
 *   ① 旗号（旗面 1–2 字）  ② 据点名（地图城名）  ③ 远征番号（跟拍军团名）
 *
 * 红线（违反任一条 = 不得新增条目）：
 *   · 三者两两严格不相等（字符串；只查逐字完全相同）
 *   · 共享汉字不算违规（例：剡中 + 剡城义军、武川镇 + 武川镇军）
 *   · §4.1：据点 XX关/城/邑/州 且旗号=XX → 改据点名
 *
 * 🔴 [2026-10-18 清理] 一个 factionId 只保留**一张**区域表的条目；原 35 个跨表重复
 *   （CentralAsia/Persian、Steppe/Cuman、Japan/Northeast、WestAsia/Persian·Orie）已删旧表重复项，
 *   唯一权威按本文件 `ALL_FACTION_ELITE_LEGIONS` 的展开顺序（后者为准）。
 *
 * **运行时定案：据点本位**（录入 AGENTS §2.2.0；占城 §12.2.1）
 *   · 将/精：按 `cityId` 查录入表；与占城旗号无关
 *   · 录入：据点→势力→武将→精锐；禁止以人物/势力反推据点
 * 数据录入仍用 factionId→番号 + STARTING_CAPITALS 推导 cityId 映射；禁止为番号迁点。
 *
 * 审计：npm run expedition:triple-check  +  npm run expedition:audit
 * tier 标准：AGENTS.md §12.3.1（T0 正史以少胜多 / T1 有名且打过胜仗 / T2 战术高光/战略王牌 / T3 有名/史载专名 / T4 真实存在有番号；乘数 1.5/1.4/1.3/1.2/1.1）
 * tier 重评：十四区各 **1–3 支 T0**（锚点见 scratch/elite_tier_region_anchors.json）；锚点下调须有区内替代。T0 锁定后再审 T1。
 * 史料：史料/古代精锐部队.md
 * ═══════════════════════════════════════════════════════════════════
 */
import { JAPAN_EXPEDITION_ELITE_LEGIONS } from './JapanExpeditionLegions';
import { KOREA_EXPEDITION_ELITE_LEGIONS } from './KoreaExpeditionLegions';
import { NORTHEAST_EXPEDITION_ELITE_LEGIONS } from './NortheastExpeditionLegions';
import { STEPPE_EXPEDITION_ELITE_LEGIONS } from './SteppeExpeditionLegions';
import { WESTERN_EXPEDITION_ELITE_LEGIONS } from './WesternExpeditionLegions';
import { CENTRAL_ASIA_EXPEDITION_ELITE_LEGIONS } from './CentralAsiaExpeditionLegions';
import { WEST_ASIA_EXPEDITION_ELITE_LEGIONS } from './WestAsiaExpeditionLegions';
import { ORIE_EXPEDITION_ELITE_LEGIONS } from './OrieExpeditionLegions';
import { TIBET_EXPEDITION_ELITE_LEGIONS } from './TibetExpeditionLegions';
import { DIANQIAN_EXPEDITION_ELITE_LEGIONS } from './DianQianExpeditionLegions';
import { LINGNAN_EXPEDITION_ELITE_LEGIONS } from './LingnanExpeditionLegions';
import { JIANGNAN_EXPEDITION_ELITE_LEGIONS } from './JiangnanExpeditionLegions';
import { NORTH_EXPEDITION_ELITE_LEGIONS } from './NorthExpeditionLegions';
import { CENTRAL_EXPEDITION_ELITE_LEGIONS } from './CentralExpeditionLegions';
import { BASHU_EXPEDITION_ELITE_LEGIONS } from './BashuExpeditionLegions';
import { HEXI_EXPEDITION_ELITE_LEGIONS } from './HexiExpeditionLegions';
import { SLAVIC_EXPEDITION_ELITE_LEGIONS } from './SlavicExpeditionLegions';
import { GERMANIC_EXPEDITION_ELITE_LEGIONS } from './GermanicExpeditionLegions';
import { LATIN_EXPEDITION_ELITE_LEGIONS } from './LatinExpeditionLegions';
import { INDIA_EXPEDITION_ELITE_LEGIONS } from './IndiaExpeditionLegions';
import { PURU_EXPEDITION_ELITE_LEGIONS } from './PuruExpeditionLegions';
import { BERBER_EXPEDITION_ELITE_LEGIONS } from './BerberExpeditionLegions';
import { AMERICA_EXPEDITION_ELITE_LEGIONS } from './AmericaExpeditionLegions';
import { ANDE_EXPEDITION_ELITE_LEGIONS } from './AndeExpeditionLegions';
import { AFRICA_EXPEDITION_ELITE_LEGIONS } from './AfricaExpeditionLegions';
import { MALAY_EXPEDITION_ELITE_LEGIONS } from './MalayExpeditionLegions';
import { EAST_EXPEDITION_ELITE_LEGIONS } from './EastExpeditionLegions';
import { GREEK_EXPEDITION_ELITE_LEGIONS } from './GreekExpeditionLegions';
import { THRACIAN_EXPEDITION_ELITE_LEGIONS } from './ThracianExpeditionLegions';
import { PERSIAN_EXPEDITION_ELITE_LEGIONS } from './PersianExpeditionLegions';
import { CUMAN_EXPEDITION_ELITE_LEGIONS } from './CumanExpeditionLegions';
import { SCYTHIANS_EXPEDITION_ELITE_LEGIONS } from './ScythiansExpeditionLegions';
import { SRIVIJAYA_EXPEDITION_ELITE_LEGIONS } from './SriVijayaExpeditionLegions';
import { STARTING_CAPITALS } from './StartingCapitals';
import { CITIES_V2 } from './cities_v2';
import { getRawGeneralByGeneralId } from './FactionGenerals';
import { applyLegionCultureComposition, type LegionCompositionTarget } from '../types/CultureFormations';

export type EliteTier = 0 | 1 | 2 | 3 | 4;
export interface EliteLegionConfig {
  name: string;
  tier: EliteTier;
}

/** 数据录入：factionId → 番号（14 区表合并，供审计与推导 cityId 映射） */
const ALL_FACTION_ELITE_LEGIONS: Readonly<Record<string, EliteLegionConfig>> = {
  ...JAPAN_EXPEDITION_ELITE_LEGIONS,
  ...KOREA_EXPEDITION_ELITE_LEGIONS,
  ...NORTHEAST_EXPEDITION_ELITE_LEGIONS,
  ...STEPPE_EXPEDITION_ELITE_LEGIONS,
  ...WESTERN_EXPEDITION_ELITE_LEGIONS,
  ...CENTRAL_ASIA_EXPEDITION_ELITE_LEGIONS,
  ...WEST_ASIA_EXPEDITION_ELITE_LEGIONS,
  ...ORIE_EXPEDITION_ELITE_LEGIONS,
  ...TIBET_EXPEDITION_ELITE_LEGIONS,
  ...DIANQIAN_EXPEDITION_ELITE_LEGIONS,
  ...LINGNAN_EXPEDITION_ELITE_LEGIONS,
  ...JIANGNAN_EXPEDITION_ELITE_LEGIONS,
  ...NORTH_EXPEDITION_ELITE_LEGIONS,
  ...CENTRAL_EXPEDITION_ELITE_LEGIONS,
  ...BASHU_EXPEDITION_ELITE_LEGIONS,
  ...HEXI_EXPEDITION_ELITE_LEGIONS,
  ...SLAVIC_EXPEDITION_ELITE_LEGIONS,
  ...GERMANIC_EXPEDITION_ELITE_LEGIONS,
  ...LATIN_EXPEDITION_ELITE_LEGIONS,
  ...INDIA_EXPEDITION_ELITE_LEGIONS,
  ...PURU_EXPEDITION_ELITE_LEGIONS,
  ...BERBER_EXPEDITION_ELITE_LEGIONS,
  ...AMERICA_EXPEDITION_ELITE_LEGIONS,
  ...ANDE_EXPEDITION_ELITE_LEGIONS,
  ...AFRICA_EXPEDITION_ELITE_LEGIONS,
  ...MALAY_EXPEDITION_ELITE_LEGIONS,
  ...EAST_EXPEDITION_ELITE_LEGIONS,
  ...GREEK_EXPEDITION_ELITE_LEGIONS,
  ...THRACIAN_EXPEDITION_ELITE_LEGIONS,
  ...PERSIAN_EXPEDITION_ELITE_LEGIONS,
  ...CUMAN_EXPEDITION_ELITE_LEGIONS,
  ...SCYTHIANS_EXPEDITION_ELITE_LEGIONS,
  ...SRIVIJAYA_EXPEDITION_ELITE_LEGIONS,
};

/**
 * 🔴 [2026-10-19 主人定：「一个据点，一个势力，可以多个武将，一个武将一支精锐」]
 * 同一据点（同一势力）下挂有多位武将时，每位武将各有专属精锐部队（≤5字、全局不重名）。
 * 也可直接在 `FactionGenerals.ts` 的武将条目上写 `eliteName` / `eliteTier`。
 */
export const GENERAL_ELITE_LEGIONS: Readonly<Record<string, EliteLegionConfig>> = {
  halikanasu_memnon: { name: '罗得雇佣军', tier: 2 },
  dibisi_phoinix: { name: '卡德米亚军', tier: 3 },
  maqidun_antipater: { name: '佩拉近卫军', tier: 2 },
  maqidun_craterus: { name: '持盾卫队', tier: 1 },
  jite_shouling: { name: '盖塔矛骑兵', tier: 3 },
  xila_leosthenes: { name: '雅典同盟军', tier: 2 },
  xila_antiphilus: { name: '阿提卡重步', tier: 3 },
  shang_weiwuji: { name: '信陵死士', tier: 1 },
  teluoyi_maniya: { name: '达尔丹卫军', tier: 3 },
  sogdian_aokexiate: { name: '索格底翼兵', tier: 3 },
  zhou_jifu: { name: '西六师', tier: 2 },
  yin_yuejin: { name: '先登骁果', tier: 2 },
  heti_alialate: { name: '哈吕斯重骑', tier: 3 },
  xibolai_majiabi: { name: '哈斯蒙尼军', tier: 2 },
  dibisi_tahaerka: { name: '库施神弓手', tier: 2 },
  aiji_lameisisi: { name: '阿蒙皇家车', tier: 1 },
  xikesuosi_samutike: { name: '塞易斯卫队', tier: 3 },
  daliushi_iii: { name: '苹果兵卫队', tier: 2 },
  aqimeinide_aertabazanuosi: { name: '波斯门守军', tier: 3 },
  sumeier_nabopalasa: { name: '迦勒底重步', tier: 2 },
  ailan_julushi: { name: '帕萨尔加德', tier: 1 },
  guyashu_tigelate: { name: '亚述近卫车', tier: 1 },
  boluo_vijaya: { name: '僧伽罗卫军', tier: 3 },
  wuer_boshasha: { name: '巴比伦禁卫', tier: 3 },
  sijitai_satraces: { name: '药杀水游骑', tier: 3 },
  yamaxun_faernake: { name: '本都重装骑', tier: 3 },
  gen_astrakhan_khan: { name: '阿斯特拉骑', tier: 3 },
  oirat_ming_gaerdan: { name: '准噶尔驼炮', tier: 1 },
};

/**
 * 按 generalId 查询该武将的专属精锐配置（「一个武将一支精锐」）：
 * 1. 优先读 `FactionGeneral.eliteName` / `eliteTier`；
 * 2. 次读 `GENERAL_ELITE_LEGIONS[generalId]`；
 * 3. 回落到该武将自己的势力（自带 factionId 优先，没有才用所在据点的势力）的 `ALL_FACTION_ELITE_LEGIONS`。
 */
export function getGeneralEliteConfig(generalId: string | null | undefined): EliteLegionConfig | null {
  if (!generalId) return null;
  const hit = getRawGeneralByGeneralId(generalId);
  if (hit?.general.eliteName) {
    const fallbackTier = ALL_FACTION_ELITE_LEGIONS[hit.factionId]?.tier ?? 2;
    return {
      name: hit.general.eliteName,
      tier: hit.general.eliteTier ?? fallbackTier,
    };
  }
  const direct = GENERAL_ELITE_LEGIONS[generalId];
  if (direct) return direct;
  // 🔴 [2026-10-23 主人「一个武将，一个势力，一个精锐，一个军团，一个旗号」] 回落按**武将自己的势力**
  //    （挂在别家据点上的武将，如长安的霍去病＝汉），没有自带势力才用他所在据点的势力
  const ownFaction = hit?.general.factionId ?? hit?.factionId;
  if (ownFaction) {
    return ALL_FACTION_ELITE_LEGIONS[ownFaction] ?? null;
  }
  return null;
}

/** 按 generalId 查询该武将的专属精锐番号（「一个武将一支精锐」） */
export function getGeneralEliteLegionName(generalId: string | null | undefined): string | null {
  return getGeneralEliteConfig(generalId)?.name ?? null;
}

function buildCityEliteLegionMap(): Readonly<Record<string, EliteLegionConfig>> {
  // 🔴 [2026-10-22 主人新口径] 一个势力可以拥有多个据点：
  //    同势力的**每个据点**都拿到该势力的精锐配置（无将守城也有番号），不再只管首府。
  const map: Record<string, EliteLegionConfig> = {};
  for (const city of CITIES_V2) {
    const elite = ALL_FACTION_ELITE_LEGIONS[city.factionId];
    if (elite) map[city.id] = elite;
  }
  for (const [factionId, cityId] of Object.entries(STARTING_CAPITALS)) {
    if (cityId && !map[cityId]) {
      const elite = ALL_FACTION_ELITE_LEGIONS[factionId];
      if (elite) map[cityId] = elite;
    }
  }
  return map;
}

/** 运行时：出兵据点 cityId → 精锐番号（番号随城） */
export const CITY_ELITE_LEGIONS: Readonly<Record<string, EliteLegionConfig>> = buildCityEliteLegionMap();

function buildCityAnchorFactionMap(): Readonly<Record<string, string>> {
  // 🔴 [2026-10-22 主人新口径] 一个势力可以拥有多个据点（旧「一城一势力」作废）：
  //    每个据点都要有史料锚定势力，直接取 cities_v2.factionId；STARTING_CAPITALS 只作兜底。
  const map: Record<string, string> = {};
  for (const city of CITIES_V2) {
    if (city.factionId) map[city.id] = city.factionId;
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

/** 查番号/远征解锁时的军团最小接口 */
export type LegionEliteLookup = {
  getFactionId(): string;
  homeCityId?: string | null;
  getSourceCityId(): string | null;
  generalId?: string | null;
  /** 🔴 [2026-09-23] 战场事件的史实军团：番号直接挂在军团上（军团名只写「马其顿军团」，不再拼番号） */
  eliteOverride?: EliteLegionConfig | null;
};

export {
  JAPAN_EXPEDITION_ELITE_LEGIONS,
  KOREA_EXPEDITION_ELITE_LEGIONS,
  NORTHEAST_EXPEDITION_ELITE_LEGIONS,
  STEPPE_EXPEDITION_ELITE_LEGIONS,
  WESTERN_EXPEDITION_ELITE_LEGIONS,
  CENTRAL_ASIA_EXPEDITION_ELITE_LEGIONS,
  TIBET_EXPEDITION_ELITE_LEGIONS,
  DIANQIAN_EXPEDITION_ELITE_LEGIONS,
  LINGNAN_EXPEDITION_ELITE_LEGIONS,
  JIANGNAN_EXPEDITION_ELITE_LEGIONS,
  NORTH_EXPEDITION_ELITE_LEGIONS,
  CENTRAL_EXPEDITION_ELITE_LEGIONS,
  BASHU_EXPEDITION_ELITE_LEGIONS,
  HEXI_EXPEDITION_ELITE_LEGIONS,
  INDIA_EXPEDITION_ELITE_LEGIONS,
  BERBER_EXPEDITION_ELITE_LEGIONS,
};

/** 数据录入/审计：factionId → 番号（运行时募兵请用 getLegionEliteLegionName） */
export function getExpeditionEliteLegionName(factionId: string): string | null {
  return ALL_FACTION_ELITE_LEGIONS[factionId]?.name ?? null;
}

export function getExpeditionEliteConfig(factionId: string): EliteLegionConfig | null {
  return ALL_FACTION_ELITE_LEGIONS[factionId] ?? null;
}

/** @deprecated 旧「旗号=将精势力」校验；运行时改用 isCityGeneralEliteAnchor */
export function isFactionGeneralEliteAnchor(
  factionId: string,
  cityId: string | null | undefined,
): boolean {
  if (!cityId || factionId === 'panjun') return false;
  return STARTING_CAPITALS[factionId] === cityId;
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

/** @deprecated 运行时改用 getCityEliteConfig(cityId) */
export function getFactionCityEliteConfig(
  factionId: string,
  cityId: string | null | undefined,
): EliteLegionConfig | null {
  if (!isFactionGeneralEliteAnchor(factionId, cityId)) return null;
  return getCityEliteConfig(cityId);
}

/** @deprecated 运行时改用 getCityEliteLegionName(cityId) */
export function getFactionCityEliteLegionName(
  factionId: string,
  cityId: string | null | undefined,
): string | null {
  return getFactionCityEliteConfig(factionId, cityId)?.name ?? null;
}

/** 按军团将领/出兵据点查精锐（一个武将一支精锐：有 generalId 优先取该将精锐，否则按据点） */
export function getLegionEliteConfig(army: LegionEliteLookup): EliteLegionConfig | null {
  if (army.eliteOverride) return army.eliteOverride;
  if (army.generalId) {
    const genElite = getGeneralEliteConfig(army.generalId);
    if (genElite) return genElite;
  }
  const cityId = army.homeCityId ?? army.getSourceCityId();
  return getCityEliteConfig(cityId);
}

/** 番号随将/随城：按军团 generalId 或 homeCityId / sourceCityId 查精锐番号 */
export function getLegionEliteLegionName(army: LegionEliteLookup): string | null {
  return getLegionEliteConfig(army)?.name ?? null;
}

/** 远征解锁：跟拍军团须从有番号的据点出身（非 panjun） */
export function canLegionLaunchExpedition(army: LegionEliteLookup): boolean {
  return army.getFactionId() !== 'panjun' && getLegionEliteLegionName(army) != null;
}

/** @deprecated 运行时改用 canLegionLaunchExpedition；保留供仅知 factionId 的旧调用 */
export function canFactionLaunchExpedition(factionId: string): boolean {
  return factionId !== 'panjun' && getExpeditionEliteLegionName(factionId) != null;
}

/** 远征下令：保存原名并改为精锐名（番号随城） */
export function applyExpeditionEliteRename(
  army: LegionEliteLookup & {
    name: string;
    expeditionSavedName: string | null;
    isElite?: boolean;
  },
): boolean {
  const elite = getLegionEliteLegionName(army);
  if (!elite) return false;
  if (army.name !== elite) {
    if (army.expeditionSavedName == null) {
      army.expeditionSavedName = army.name;
    }
    army.name = elite;
  }
  // 2026-08-04 修复：远征军团必为精锐——改名时必须标 isElite，
  // 否则精锐环（第 7 环）与战斗面板精锐标签不生效（名字=番号但军×1.0）。
  army.isElite = true;
  // 将领不在此处绑定：档案在 FactionGenerals.ts，出场限 STARTING_CAPITALS 锚点据点
  applyLegionCultureComposition(army as unknown as LegionCompositionTarget);
  return true;
}

/** 远征功成：保留精锐番号，释放暂存的原名引用（便于再次远征） */
export function commitExpeditionEliteLegionName(army: {
  name: string;
  expeditionSavedName: string | null;
}): void {
  army.expeditionSavedName = null;
}

/** 远征中断（目标消失等）：恢复改名前的军团名 */
export function restoreExpeditionLegionName(army: {
  name: string;
  expeditionSavedName: string | null;
}): void {
  if (army.expeditionSavedName != null) {
    army.name = army.expeditionSavedName;
    army.expeditionSavedName = null;
  }
}

// @ts-ignore
if (import.meta.hot) {
    // @ts-ignore
    import.meta.hot.accept([
        './JapanExpeditionLegions',
        './KoreaExpeditionLegions',
        './NortheastExpeditionLegions',
        './SteppeExpeditionLegions',
        './WesternExpeditionLegions',
        './CentralAsiaExpeditionLegions',
        './TibetExpeditionLegions',
        './DianQianExpeditionLegions',
        './LingnanExpeditionLegions',
        './JiangnanExpeditionLegions',
        './NorthExpeditionLegions',
        './CentralExpeditionLegions',
        './BashuExpeditionLegions',
        './HexiExpeditionLegions',
        './IndiaExpeditionLegions',
        './BerberExpeditionLegions',
    ], () => {
        console.log('[HMR] 精锐番号数据已更新（F5 生效）');
    });
    // @ts-ignore
    import.meta.hot.accept();
}
