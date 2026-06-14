/**
 * 军团出生策略（单一真理来源）
 *
 * 据点军团 vs 剧本军团：共用 Army / LegionManager 运行时，策略在此集中判定。
 * 新增通用逻辑（补兵、募兵、兵力上限、立绘）优先查本模块，避免散落 if。
 *
 * | 策略项           | 据点军团 recruitment | 剧本军团 scripted      |
 * |------------------|----------------------|------------------------|
 * | 兵力来源         | 扣据点驻军 90%       | 剧本 troops，凭空给     |
 * | 御驾亲征补兵     | 允许                 | 禁止                   |
 * | 立绘             | 势力随机池           | 剧本 portrait 固定     |
 * | 该势力普通募兵   | 正常                 | 整势力跳过             |
 * | 阵型             | 文化区 / 势力模板    | 同左（秦→QIN 模板）    |
 * | 开战战力         | 文化系数 only        | 文化 × **1.2**（剧本/远征） |
 *
 * 远征 = 行军模式（expeditionTargetCityId），不是第三种出生来源。
 * 剧本 targetSequence：逐城推进；末城可为 finaleDefeatCityId（兵败覆没，非功成）。
 */
import type { Army } from './Army';
import type { ScriptedCampaign } from '../data/ScriptedCampaigns';
import {
    getScriptedCampaignByFaction,
    getScriptedCampaignById,
    SCRIPTED_CAMPAIGNS,
} from '../data/ScriptedCampaigns';
import { getArmyMaxTroops } from '../types/CultureFormations';
import { gameLog } from '../utils/GameLogger';

export { getScriptedCampaignById };

export type LegionOrigin = 'recruitment' | 'scripted';

type CityFactionView = { factionId: string };

export function getLegionOrigin(army: Pick<Army, 'scriptedCampaignId'>): LegionOrigin {
    return army.scriptedCampaignId ? 'scripted' : 'recruitment';
}

export function isScriptedLegion(army: Pick<Army, 'scriptedCampaignId'>): boolean {
    return getLegionOrigin(army) === 'scripted';
}

/** 剧本军团或远征军团（行军锁目标：scriptedCampaignId 或 expeditionTargetCityId） */
export function isCampaignLegion(
    army: Pick<Army, 'scriptedCampaignId' | 'expeditionTargetCityId'>,
): boolean {
    return isScriptedLegion(army) || army.expeditionTargetCityId != null;
}

/** 该势力是否已有剧本（1 势力 = 1 剧本 → 普通募兵跳过） */
export function factionHasScriptedCampaign(factionId: string): boolean {
    return getScriptedCampaignByFaction(factionId) != null;
}

export function shouldSkipFactionRecruitment(factionId: string): boolean {
    return factionHasScriptedCampaign(factionId);
}

/** 剧本军团禁止从据点抽兵；据点军团允许御驾亲征补兵 */
export function canFollowResupplyFromCity(army: Pick<Army, 'scriptedCampaignId'>): boolean {
    return !isScriptedLegion(army);
}

/** 军团兵力上限：剧本用 scriptedTroopsCap，其余用文化区上限 */
export function getLegionTroopCap(army: Pick<Army, 'scriptedTroopsCap' | 'cultureRegion'>): number {
    if (army.scriptedTroopsCap != null) {
        return army.scriptedTroopsCap;
    }
    return getArmyMaxTroops(army.cultureRegion);
}

/**
 * 目标序列中首个仍非己方据点 = 当前推进目标；全属己方 → null（剧本已完成）。
 */
export function getScriptedSequenceTarget(
    campaign: ScriptedCampaign,
    factionId: string,
    getCity: (cityId: string) => CityFactionView | undefined,
): string | null {
    for (const cityId of campaign.targetSequence) {
        const city = getCity(cityId);
        if (!city || city.factionId !== factionId) {
            return cityId;
        }
    }
    return null;
}

export type ScriptedExpeditionTick = 'locked' | 'stage_advanced' | 'campaign_complete';

/**
 * 剧本军团远征 tick：比对序列推进目标。
 * - locked：仍攻当前城
 * - stage_advanced：前一城已破，切换下一目标
 * - campaign_complete：序列全破，清空 expeditionTargetCityId
 */
export function tickScriptedCampaignExpedition(
    army: Pick<Army, 'scriptedCampaignId' | 'expeditionTargetCityId' | 'getFactionId'>,
    getCity: (cityId: string) => CityFactionView | undefined,
): ScriptedExpeditionTick | null {
    if (!army.scriptedCampaignId) return null;
    const campaign = getScriptedCampaignById(army.scriptedCampaignId);
    if (!campaign) return null;

    const factionId = army.getFactionId();
    const nextTarget = getScriptedSequenceTarget(campaign, factionId, getCity);

    if (nextTarget === null) {
        // 末城为兵败点时，不以占满序列作为「剧本完成」
        if (campaign.finaleDefeatCityId) {
            return army.expeditionTargetCityId != null ? 'locked' : null;
        }
        if (army.expeditionTargetCityId != null) {
            army.expeditionTargetCityId = null;
            return 'campaign_complete';
        }
        return null;
    }

    if (army.expeditionTargetCityId === nextTarget) {
        return 'locked';
    }

    const prevId = army.expeditionTargetCityId;
    army.expeditionTargetCityId = nextTarget;

    if (prevId != null) {
        const prev = getCity(prevId);
        if (prev && prev.factionId === factionId) {
            return 'stage_advanced';
        }
    }
    return 'locked';
}

export function getScriptedSiegeResult(
    army: Pick<Army, 'scriptedCampaignId'>,
    defenderCityId: string,
): 'attacker_win' | 'defender_win' | undefined {
    if (!army.scriptedCampaignId) return undefined;
    const campaign = getScriptedCampaignById(army.scriptedCampaignId);
    if (!campaign) return undefined;

    if (campaign.finaleDefeatCityId === defenderCityId) {
        return 'defender_win';
    }

    if (campaign.targetSequence.includes(defenderCityId)) {
        return 'attacker_win';
    }

    return undefined;
}

/** 剧本末城兵败（仅 finaleDefeatCityId 匹配时播报） */
export function logScriptedFinaleDefeat(
    army: Pick<Army, 'scriptedCampaignId' | 'name'>,
    defenderCityId: string,
    cityName: string,
): void {
    if (!army.scriptedCampaignId) return;
    const campaign = getScriptedCampaignById(army.scriptedCampaignId);
    if (!campaign || campaign.finaleDefeatCityId !== defenderCityId) return;
    gameLog(
        'expedition',
        `🎬 [剧本] ${campaign.generalName} 率【${army.name}】于【${cityName}】兵败，全军覆没`,
    );
}

/**
 * 剧本军团生成后绑定：精锐名/将领/立绘/兵力帽/远征首目标。
 * 调用方负责 createArmy（不扣 spawnCity.troops）。
 */
export function bindScriptedCampaign(
    legion: Army,
    campaign: ScriptedCampaign,
    getCity: (cityId: string) => CityFactionView | undefined,
): void {
    legion.generalId = campaign.generalId;
    legion.portraitPath = campaign.portrait;
    legion.scriptedCampaignId = campaign.id;
    legion.scriptedTroopsCap = campaign.troops;
    legion.expeditionTargetCityId =
        getScriptedSequenceTarget(campaign, legion.getFactionId(), getCity);
}

/** 开局播放时跟拍：取首个 spawnAtStart 剧本的精锐名（不限势力） */
export function getPlayStartFollowLegionName(): string | null {
    return getSpawnAtStartCampaigns()[0]?.eliteName ?? null;
}

/** 开局播放时跟拍：取指定势力剧本精锐名 */
export function getScriptedFollowLegionName(factionId: string): string | null {
    return getScriptedCampaignByFaction(factionId)?.eliteName ?? null;
}

/** 开局即出征的剧本列表（spawnScriptedCampaigns 遍历用） */
export function getSpawnAtStartCampaigns(): readonly ScriptedCampaign[] {
    return SCRIPTED_CAMPAIGNS.filter((c) => c.spawnAtStart === true);
}

/** 指定年份登场（非 spawnAtStart）的剧本 */
export function getScriptedCampaignsForYear(year: number): readonly ScriptedCampaign[] {
    return SCRIPTED_CAMPAIGNS.filter(
        (c) => c.spawnAtStart !== true && c.spawnYear === year,
    );
}
