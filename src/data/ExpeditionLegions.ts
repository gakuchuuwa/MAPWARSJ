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
 *   · 三者两两严格不相等
 *   · 旗号、据点名、番号 默认不得共享汉字
 *   · **例外（§12.1.1）**：仅 §4.1 民族/政权/家族 → 旗号与番号可共享（见 ExpeditionTripleNameAllow.ts）
 *   · 军镇专名作旗号时番号不得同字（例：❌ 天雄+天雄军 → ✅ 魏博+大名+天雄军）
 *   · §4.1：据点 XX关/城/邑/州 且旗号=XX → 改据点名
 *
 * **运行时定案（2026-06-16）：番号随城、将领随势**（见 GAME_DIRECTION.md）
 *   · 精锐番号：按军团 **出兵据点** cityId 查 CITY_ELITE_LEGIONS（占城后可募当地番号）
 *   · 将领：仍绑 factionId（FactionGenerals.ts），占城 **不** 过户将领
 * 数据录入仍用 factionId→番号 + STARTING_CAPITALS 推导 cityId 映射；禁止为番号迁点。
 *
 * 审计：npm run expedition:triple-check  +  npm run expedition:audit
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
import { applyLegionCultureComposition, type LegionCompositionTarget } from '../types/CultureFormations';

/** 数据录入：factionId → 番号（14 区表合并，供审计与推导 cityId 映射） */
const ALL_FACTION_ELITE_LEGIONS: Readonly<Record<string, string>> = {
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

function buildCityEliteLegionMap(): Readonly<Record<string, string>> {
  const map: Record<string, string> = {};
  for (const [factionId, cityId] of Object.entries(STARTING_CAPITALS)) {
    const elite = ALL_FACTION_ELITE_LEGIONS[factionId];
    if (elite) map[cityId] = elite;
  }
  return map;
}

/** 运行时：出兵据点 cityId → 精锐番号（番号随城） */
export const CITY_ELITE_LEGIONS: Readonly<Record<string, string>> = buildCityEliteLegionMap();

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
  return ALL_FACTION_ELITE_LEGIONS[factionId] ?? null;
}

/** 番号随城：据出兵 cityId 查精锐番号 */
export function getCityEliteLegionName(cityId: string | null | undefined): string | null {
  if (!cityId) return null;
  return CITY_ELITE_LEGIONS[cityId] ?? null;
}

/** 番号随城：按军团 homeCityId / sourceCityId 查精锐番号 */
export function getLegionEliteLegionName(army: LegionEliteLookup): string | null {
  const cityId = army.homeCityId ?? army.getSourceCityId();
  return getCityEliteLegionName(cityId);
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
  // 将领不在此处绑定：将领随势（FactionGenerals.ts），远征只改番号
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
