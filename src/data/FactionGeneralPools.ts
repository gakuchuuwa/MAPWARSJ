/**
 * 多将领势力：出征池 vs 守城专将（N+1 模式）
 *
 * 设计定案：AGENTS.md §12.2.2；AI 细则 .cursor/rules/faction-general-pools.mdc
 * 试点：秦 5+1（2026-06-22）
 *
 * · 出征军团掷出「带将」档时，从 EXPEDITION_POOL 等概率随机，不含守城专将
 * · 守城专将（如 qin_yingji）仅 SiegeGarrisonTier 使用，守城战必出，不进出征池
 */
import { resolvePortraitAssetPath } from '../config/portrait_defaults';
import type { FactionGeneral } from './FactionGenerals';
import { FACTION_GENERALS, getFactionGeneral } from './FactionGenerals';

/** generalId → 显示名（须在 GeneralSkills.GENERAL_PROFILES 有档案） */
const GENERAL_DISPLAY_NAMES: Record<string, string> = {
    qin_baiqi: '白起',
    qin_wangjian: '王翦',
    qin_simacuo: '司马错',
    qin_wangben: '王贲',
    qin_mengtian: '蒙恬',
    qin_yingji: '嬴稷',
};

/** factionId → 立绘目录（web 路径） */
const FACTION_GENERAL_PORTRAIT_FOLDER: Record<string, string> = {
    qin: '/assets/yingqin',
};

/** 出征军团随机池（不含守城专将） */
export const FACTION_EXPEDITION_GENERAL_POOLS: Readonly<Record<string, readonly string[]>> = {
    qin: [
        'qin_baiqi',
        'qin_wangjian',
        'qin_simacuo',
        'qin_wangben',
        'qin_mengtian',
    ],
};

/** 守城城防必出专将（不进出征池、不参与出征随机） */
export const FACTION_SIEGE_GARRISON_GENERAL_ID: Readonly<Record<string, string>> = {
    qin: 'qin_yingji',
};

export function buildGeneralRecord(factionId: string, generalId: string): FactionGeneral | null {
    const generalName = GENERAL_DISPLAY_NAMES[generalId];
    if (!generalName) return null;
    const folder = FACTION_GENERAL_PORTRAIT_FOLDER[factionId] ?? '/assets';
    const portrait = resolvePortraitAssetPath(`${folder}/${generalId}.png`, { factionId });
    return { generalId, generalName, portrait };
}

/** 势力是否仍有「出征带将」选项（有出征池或单将表条目） */
export function factionHasExpeditionGeneral(factionId: string): boolean {
    const pool = FACTION_EXPEDITION_GENERAL_POOLS[factionId];
    if (pool && pool.length > 0) return true;
    return !!FACTION_GENERALS[factionId];
}

/** 出征军团带将：从出征池随机；无池则回退 FACTION_GENERALS 单将 */
export function pickRandomExpeditionGeneral(factionId: string): FactionGeneral | null {
    const pool = FACTION_EXPEDITION_GENERAL_POOLS[factionId];
    if (pool && pool.length > 0) {
        const generalId = pool[Math.floor(Math.random() * pool.length)];
        return buildGeneralRecord(factionId, generalId);
    }
    return getFactionGeneral(factionId);
}

/** 守城城防专将（如秦嬴稷）；无配置则回退势力默认将 */
export function getSiegeGarrisonGeneral(factionId: string): FactionGeneral | null {
    const dedicatedId = FACTION_SIEGE_GARRISON_GENERAL_ID[factionId];
    if (dedicatedId) {
        return buildGeneralRecord(factionId, dedicatedId);
    }
    return getFactionGeneral(factionId);
}

export function hasDedicatedSiegeGarrisonGeneral(factionId: string): boolean {
    return !!FACTION_SIEGE_GARRISON_GENERAL_ID[factionId];
}

/** 按 generalId 解析（含秦多将池，不必写入 FACTION_GENERALS 主表） */
export function resolveGeneralRecordById(
    generalId: string,
    factionIdHint?: string,
): FactionGeneral | null {
    if (!GENERAL_DISPLAY_NAMES[generalId]) return null;
    const factionId =
        factionIdHint ??
        (generalId.startsWith('qin_') ? 'qin' : undefined);
    if (!factionId) return null;
    return buildGeneralRecord(factionId, generalId);
}
