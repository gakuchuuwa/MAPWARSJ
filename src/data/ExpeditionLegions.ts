/**
 * 远征精锐番号统一查询（日本 + 朝鲜 + 东北 + 草原 + 西域 + 中亚 + 青藏 + 滇缅 + 岭南 + 南方 + 北方）
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
    null
  );
}

export function canFactionLaunchExpedition(factionId: string): boolean {
  return factionId !== 'panjun' && getExpeditionEliteLegionName(factionId) != null;
}

/** 远征下令：保存原名并改为精锐名；已保存则不再覆盖 */
export function applyExpeditionEliteRename(army: {
  name: string;
  expeditionSavedName: string | null;
  getFactionId(): string;
}): boolean {
  const elite = getExpeditionEliteLegionName(army.getFactionId());
  if (!elite) return false;
  if (army.name !== elite) {
    if (army.expeditionSavedName == null) {
      army.expeditionSavedName = army.name;
    }
    army.name = elite;
  }
  return true;
}

/** 远征功成：保留精锐番号，释放暂存的原名引用（便于再次远征） */
export function commitExpeditionEliteLegionName(army: {
  name: string;
  expeditionSavedName: string | null;
}): void {
  army.expeditionSavedName = null;
}

/** 目标城异常消失等：恢复远征前军团名 */
export function restoreExpeditionLegionName(army: {
  name: string;
  expeditionSavedName: string | null;
}): void {
  if (army.expeditionSavedName != null) {
    army.name = army.expeditionSavedName;
    army.expeditionSavedName = null;
  }
}
