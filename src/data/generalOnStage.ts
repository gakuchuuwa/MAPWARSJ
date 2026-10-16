/**
 * 武将在不在场（剧本模式按生卒年闸门）—— 🔴 [2026-10-16 主人定]
 *
 * 主人原话：「剧本模式中每个武将严格按照登场年-去世年出现，其他时间据点相当于只有普通武将，
 *   武将名字一律采用，势力+将军，例如长安，唐国将军。立绘不变，乱斗模式不看生卒登场年，一直在。」
 * 主人补充（2026-10-16 答问）：
 *   · 「势力」按**该武将本来所属的势力**取（长安任何年份都显示「唐国将军」）；
 *   · 不在场时**不触发武将技、不算名将档位**（守城/出兵按普通武将算），立绘不变。
 *
 * 判据：剧本期 且 当前剧本年份 ∉ [登场年(默认生年+20，见 debutYearOf), 卒年] → 不在场。
 *   · 乱斗模式 / 剧本年份未知（编辑器、离线脚本、剧本已打完）→ 一律在场（旧行为不变）；
 *   · 生卒年表里没有的武将 → 在场（不拦）。
 */
import { GENERAL_LIFE_YEARS, getGeneralDebutYear } from './GeneralLifeYears';
import { isScriptPeriod } from '../events/scriptPeriod';

/** 当前剧本年份（由 GameApp 注入 = 当前这一场历史事件的年份）；未注入 → null */
let scriptYearProvider: () => number | null = () => null;

export function setScriptYearProvider(fn: () => number | null): void {
    scriptYearProvider = fn;
}

let inYearLookup = false;

/** 武将此刻是否在场（false = 剧本期这一年他还没登场或已去世 → 按普通武将处理） */
export function isGeneralOnStage(generalId: string | null | undefined): boolean {
    if (!generalId || inYearLookup) return true;
    inYearLookup = true;
    let year: number | null = null;
    try {
        year = scriptYearProvider();
    } finally {
        inYearLookup = false;
    }
    if (year == null) return true;
    if (!isScriptPeriod()) return true;
    const life = GENERAL_LIFE_YEARS[generalId];
    if (!life) return true;
    const debut = getGeneralDebutYear(generalId);
    if (debut == null) return true;
    return year >= debut && year <= life.death;
}
