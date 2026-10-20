/**
 * 武将在不在场（剧本模式按生卒年闸门）—— 🔴 [2026-10-16 主人定]
 *
 * 主人原话：「剧本模式中每个武将严格按照登场年-去世年出现，其他时间据点相当于只有普通武将，
 *   武将名字一律采用，势力+将军，例如长安，唐国将军。立绘不变，乱斗模式不看生卒登场年，一直在。」
 * 🔴 [2026-10-20 主人令「没有武将的，不再用XX势力+将军，一律都叫将军」] 上句「势力+将军」已作废，不在场一律叫「将军」
 *   （见 FactionGenerals.stageGeneralName）；下面「势力按本来所属势力取」那条随之不再用于起名。
 * 主人补充（2026-10-16 答问）：
 *   · 「势力」按**该武将本来所属的势力**取（长安任何年份都显示「唐国将军」）；
 *   · 不在场时**不触发武将技、不算名将档位**（守城/出兵按普通武将算），立绘不变。
 *
 * 判据：剧本期 且 当前剧本年份 ∉ [登场年(默认生年+20，见 debutYearOf), 卒年] → 不在场。
 *   · 乱斗模式 / 剧本年份未知（编辑器、离线脚本、剧本已打完）→ 一律在场（旧行为不变）；
 *   · 生卒年表里没有的武将 → 在场（不拦）。
 */
import { GENERAL_LIFE_YEARS, getGeneralDebutYear, centenarianYearOf } from './GeneralLifeYears';
import { isScriptPeriod } from '../events/scriptPeriod';
import { GameConfig } from '../config/GameConfig';

/** 当前剧本年份（由 GameApp 注入 = 当前这一场历史事件的年份）；未注入 → null */
let scriptYearProvider: () => number | null = () => null;
/** 百岁模式当前年份（由 GameApp 注入：百岁模式时返回当前游戏年份，其余模式返回 null） */
let centenarianYearProvider: () => number | null = () => null;

export function setScriptYearProvider(fn: () => number | null): void {
    scriptYearProvider = fn;
}

export function setCentenarianYearProvider(fn: () => number | null): void {
    centenarianYearProvider = fn;
}

/** 当前玩法模式（由 GameApp 注入）；编辑器 / 离线脚本未注入 → null（不按模式改行为） */
export type GeneralGameMode = 'script' | 'centenarian' | 'melee';
let gameModeProvider: () => GeneralGameMode | null = () => null;

export function setGameModeProvider(fn: () => GeneralGameMode | null): void {
    gameModeProvider = fn;
}

export function getGameMode(): GeneralGameMode | null {
    return gameModeProvider();
}

let inYearLookup = false;

/** 武将此刻是否在场（false = 剧本期不在[登场年,卒年] 或 百岁模式不在[登场年,百岁年] → 按普通武将处理） */
export function isGeneralOnStage(generalId: string | null | undefined): boolean {
    if (!generalId || inYearLookup) return true;
    const scriptMode = isScriptPeriod();
    inYearLookup = true;
    let year: number | null = null;
    try {
        year = scriptMode ? scriptYearProvider() : centenarianYearProvider();
    } finally {
        inYearLookup = false;
    }
    if (year == null) return true;
    if (scriptMode) {
        const life = GENERAL_LIFE_YEARS[generalId];
        if (!life) return false;
        const debut = getGeneralDebutYear(generalId);
        if (debut == null) return false;
        return year >= debut && year <= life.death;
    }
    const win = getCentenarianStageWindow(generalId);
    return !!win && year >= win.from && year <= win.to;
}

/**
 * 百岁模式在场窗口 [登场年, 退场年]；未收录 → null。
 * 🔴 [2026-10-20 主人令「把开局设为前800年，所有前800年前的武将都按开局登场」「100年退场」]
 *   本来的百岁窗口在开局年之前就已结束的武将 → 开局即登场，在场 100 年（开局年 ～ 开局年+100）；
 *   开局时本就在场或之后才登场的武将，窗口不变。
 */
export function getCentenarianStageWindow(generalId: string): { from: number; to: number } | null {
    const life = GENERAL_LIFE_YEARS[generalId];
    if (!life) return null;
    const debut = getGeneralDebutYear(generalId);
    if (debut == null) return null;
    const to = Math.max(debut, centenarianYearOf(life.birth));
    const start = GameConfig.TIME.TIMELINE_START_YEAR;
    if (to < start) return { from: start, to: start + 100 };
    return { from: debut, to };
}
