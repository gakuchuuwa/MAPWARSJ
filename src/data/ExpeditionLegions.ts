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
 * 唯一锚点：据点。旗号（§4.1 定旗）、远征番号（标志战/成军地）**都只和据点有关**；
 *   彼此、与时代 **无绑定**（见 AGENTS.md §12.2）。实现上番号写入占该点的 factionId。
 * 禁止为番号/旗号迁点、迁势力。
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
import { applyLegionCultureComposition, type LegionCompositionTarget } from '../types/CultureFormations';

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

export function getExpeditionEliteLegionName(factionId: string): string | null {
  return (
    JAPAN_EXPEDITION_ELITE_LEGIONS[factionId] ??
    KOREA_EXPEDITION_ELITE_LEGIONS[factionId] ??
    NORTHEAST_EXPEDITION_ELITE_LEGIONS[factionId] ??
    STEPPE_EXPEDITION_ELITE_LEGIONS[factionId] ??
    WESTERN_EXPEDITION_ELITE_LEGIONS[factionId] ??
    CENTRAL_ASIA_EXPEDITION_ELITE_LEGIONS[factionId] ??
    TIBET_EXPEDITION_ELITE_LEGIONS[factionId] ??
    DIANQIAN_EXPEDITION_ELITE_LEGIONS[factionId] ??
    LINGNAN_EXPEDITION_ELITE_LEGIONS[factionId] ??
    JIANGNAN_EXPEDITION_ELITE_LEGIONS[factionId] ??
    NORTH_EXPEDITION_ELITE_LEGIONS[factionId] ??
    CENTRAL_EXPEDITION_ELITE_LEGIONS[factionId] ??
    BASHU_EXPEDITION_ELITE_LEGIONS[factionId] ??
    HEXI_EXPEDITION_ELITE_LEGIONS[factionId] ??
    null
  );
}

export function canFactionLaunchExpedition(factionId: string): boolean {
  return factionId !== 'panjun' && getExpeditionEliteLegionName(factionId) != null;
}

/** 远征下令：保存原名并改为精锐名；秦国同时重申 QIN_FACTION_COMPOSITION */
export function applyExpeditionEliteRename(
  army: LegionCompositionTarget & {
    name: string;
    expeditionSavedName: string | null;
    getFactionId(): string;
  },
): boolean {
  const elite = getExpeditionEliteLegionName(army.getFactionId());
  if (!elite) return false;
  if (army.name !== elite) {
    if (army.expeditionSavedName == null) {
      army.expeditionSavedName = army.name;
    }
    army.name = elite;
  }
  // 名将不在此处绑定：名将归势力（开局配将，见 FactionGenerals.ts），远征只改番号
  applyLegionCultureComposition(army);
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
