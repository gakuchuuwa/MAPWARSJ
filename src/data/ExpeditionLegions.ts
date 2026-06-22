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
 *   · 三者两两严格不相等（字符串）
 *   · 旗号 ↔ 据点名、旗号 ↔ 番号：默认不得共享汉字（番号↔旗号例外见 §12.1.1）
 *   · **番号 ↔ 据点名：允许共享汉字**（例：武川镇 + 武川镇军）
 *   · 军镇专名作旗号时番号不得同字（例：❌ 天雄+天雄军 → ✅ 魏博+大名+天雄军）
 *   · §4.1：据点 XX关/城/邑/州 且旗号=XX → 改据点名
 *
 * **运行时定案：据点本位**（录入 AGENTS §2.2.0；占城 §12.2.1）
 *   · 将/精：按 `cityId` 查录入表；与占城旗号无关
 *   · 录入：据点→势力→武将→精锐；禁止以人物/势力反推据点
 * 数据录入仍用 factionId→番号 + STARTING_CAPITALS 推导 cityId 映射；禁止为番号迁点。
 *
 * 审计：npm run expedition:triple-check  +  npm run expedition:audit
 * tier 标准：AGENTS.md §12.3.1（T0 正史以少胜多 / T1 有名且打过胜仗 / T2 有名/史载专名或打过胜仗 / T3 真实存在有番号；乘数 1.5/1.4/1.2/1.1）
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
import { TIBET_EXPEDITION_ELITE_LEGIONS } from './TibetExpeditionLegions';
import { DIANQIAN_EXPEDITION_ELITE_LEGIONS } from './DianQianExpeditionLegions';
import { LINGNAN_EXPEDITION_ELITE_LEGIONS } from './LingnanExpeditionLegions';
import { JIANGNAN_EXPEDITION_ELITE_LEGIONS } from './JiangnanExpeditionLegions';
import { NORTH_EXPEDITION_ELITE_LEGIONS } from './NorthExpeditionLegions';
import { CENTRAL_EXPEDITION_ELITE_LEGIONS } from './CentralExpeditionLegions';
import { BASHU_EXPEDITION_ELITE_LEGIONS } from './BashuExpeditionLegions';
import { HEXI_EXPEDITION_ELITE_LEGIONS } from './HexiExpeditionLegions';
import { STARTING_CAPITALS } from './StartingCapitals';
import { getFactionGeneral } from './FactionGenerals';
import { applyLegionCultureComposition, type LegionCompositionTarget } from '../types/CultureFormations';

export type EliteTier = 0 | 1 | 2 | 3;
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
  ...TIBET_EXPEDITION_ELITE_LEGIONS,
  ...DIANQIAN_EXPEDITION_ELITE_LEGIONS,
  ...LINGNAN_EXPEDITION_ELITE_LEGIONS,
  ...JIANGNAN_EXPEDITION_ELITE_LEGIONS,
  ...NORTH_EXPEDITION_ELITE_LEGIONS,
  ...CENTRAL_EXPEDITION_ELITE_LEGIONS,
  ...BASHU_EXPEDITION_ELITE_LEGIONS,
  ...HEXI_EXPEDITION_ELITE_LEGIONS,
};

function buildCityEliteLegionMap(): Readonly<Record<string, EliteLegionConfig>> {
  const map: Record<string, EliteLegionConfig> = {};
  for (const [factionId, cityId] of Object.entries(STARTING_CAPITALS)) {
    const elite = ALL_FACTION_ELITE_LEGIONS[factionId];
    if (elite) map[cityId] = elite;
  }
  return map;
}

/** 运行时：出兵据点 cityId → 精锐番号（番号随城） */
export const CITY_ELITE_LEGIONS: Readonly<Record<string, EliteLegionConfig>> = buildCityEliteLegionMap();

function buildCityAnchorFactionMap(): Readonly<Record<string, string>> {
  const map: Record<string, string> = {};
  for (const [factionId, cityId] of Object.entries(STARTING_CAPITALS)) {
    if (cityId) map[cityId] = factionId;
  }
  return map;
}

/** 据点 → 史料锚定势力（录入时 STARTING_CAPITALS 反查；旗号易主不改变） */
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
};

/** 数据录入/审计：factionId → 番号（运行时募兵请用 getLegionEliteLegionName） */
export function getExpeditionEliteLegionName(factionId: string): string | null {
  return ALL_FACTION_ELITE_LEGIONS[factionId]?.name ?? null;
}

export function getExpeditionEliteConfig(factionId: string): EliteLegionConfig | null {
  return ALL_FACTION_ELITE_LEGIONS[factionId] ?? null;
}

/** 据点锚定武将（读录入表；与军团旗号/占城势力可不同） */
export function getCityAnchoredGeneral(cityId: string | null | undefined) {
  const anchorFactionId = getCityAnchorFactionId(cityId);
  if (!anchorFactionId) return null;
  return getFactionGeneral(anchorFactionId);
}

/** @deprecated 旧「旗号=将精势力」校验；运行时改用 isCityGeneralEliteAnchor */
export function isFactionGeneralEliteAnchor(
  factionId: string,
  cityId: string | null | undefined,
): boolean {
  if (!cityId || factionId === 'panjun') return false;
  return STARTING_CAPITALS[factionId] === cityId;
}

/** 番号随城：据 cityId 查精锐配置 */
export function getCityEliteConfig(cityId: string | null | undefined): EliteLegionConfig | null {
  if (!cityId) return null;
  return CITY_ELITE_LEGIONS[cityId] ?? null;
}

/** 番号随城：据 cityId 查精锐番号 */
export function getCityEliteLegionName(cityId: string | null | undefined): string | null {
  return getCityEliteConfig(cityId)?.name ?? null;
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

/** 按军团出兵据点查精锐（番号随城，不看军团旗号） */
export function getLegionEliteConfig(army: LegionEliteLookup): EliteLegionConfig | null {
  const cityId = army.homeCityId ?? army.getSourceCityId();
  return getCityEliteConfig(cityId);
}

/** 番号随城：按军团 homeCityId / sourceCityId 查精锐番号 */
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
  // 将领不在此处绑定：档案在 FactionGenerals.ts，出场限 STARTING_CAPITALS 锚点据点
  applyLegionCultureComposition(army as LegionCompositionTarget);
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
