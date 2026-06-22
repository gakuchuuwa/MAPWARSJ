/**
 * 【搁置 2026-06-22】多将领 N+1（出征池 + 守城专将）
 *
 * 主人裁定：维持 **一据点、一势力、一武将、一精锐**；本文件实现已停用。
 * 设计草案保留于：AGENTS.md §12.2.2（HTML 注释）、`.cursor/rules/faction-general-pools.mdc`（HTML 注释）。
 *
 * 现行单一真理：`FactionGenerals.ts` + `LegionSpawnTier` / `SiegeGarrisonTier` 调用 `getFactionGeneral`。
 */

/* ── 以下为搁置草案全文，恢复 N+1 时取消注释并重新接线 LegionSpawnTier / SiegeGarrisonTier ──
import { resolvePortraitAssetPath } from '../config/portrait_defaults';
import type { FactionGeneral } from './FactionGenerals';
import { FACTION_GENERALS, getFactionGeneral } from './FactionGenerals';

const GENERAL_DISPLAY_NAMES: Record<string, string> = {
    qin_baiqi: '白起',
    qin_wangjian: '王翦',
    qin_simacuo: '司马错',
    qin_wangben: '王贲',
    qin_mengtian: '蒙恬',
    qin_yingji: '嬴稷',
};

const FACTION_GENERAL_PORTRAIT_FOLDER: Record<string, string> = {
    qin: '/assets/yingqin',
};

export const FACTION_EXPEDITION_GENERAL_POOLS: Readonly<Record<string, readonly string[]>> = {
    qin: ['qin_baiqi', 'qin_wangjian', 'qin_simacuo', 'qin_wangben', 'qin_mengtian'],
};

export const FACTION_SIEGE_GARRISON_GENERAL_ID: Readonly<Record<string, string>> = {
    qin: 'qin_yingji',
};

export function buildGeneralRecord(factionId: string, generalId: string): FactionGeneral | null { ... }
export function factionHasExpeditionGeneral(factionId: string): boolean { ... }
export function pickRandomExpeditionGeneral(factionId: string): FactionGeneral | null { ... }
export function getSiegeGarrisonGeneral(factionId: string): FactionGeneral | null { ... }
export function hasDedicatedSiegeGarrisonGeneral(factionId: string): boolean { ... }
export function resolveGeneralRecordById(generalId: string, factionIdHint?: string): FactionGeneral | null { ... }
── 搁置草案结束 ── */

export {};
