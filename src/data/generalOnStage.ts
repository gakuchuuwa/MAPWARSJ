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
import { GENERAL_LIFE_YEARS, getGeneralDebutYear } from './GeneralLifeYears';
import { isScriptPeriod } from '../events/scriptPeriod';
import { GameConfig } from '../config/GameConfig';

/** 当前剧本年份（由 GameApp 注入 = 当前这一场历史事件的年份）；未注入 → null */
let scriptYearProvider: () => number | null = () => null;
/** 百岁模式当前年份（由 GameApp 注入：百岁模式时返回当前游戏年份，其余模式返回 null） */
let centenarianYearProvider: () => number | null = () => null;
/**
 * 🔴 [2026-11-10 主人令「到年纪的武将改为，等军团完全被打败了，再退场」]
 * 百岁模式下，该武将此刻是否有尚未完全战败的在场军团（由 GameApp 注入）。
 */
let activeLegionGeneralChecker: (generalId: string) => boolean = () => false;

export function setScriptYearProvider(fn: () => number | null): void {
    scriptYearProvider = fn;
}

export function setCentenarianYearProvider(fn: () => number | null): void {
    centenarianYearProvider = fn;
}

export function setActiveLegionGeneralChecker(fn: (generalId: string) => boolean): void {
    activeLegionGeneralChecker = fn;
}

/**
 * 🔴 [2026-11-11 主人令「武将登场时势力还没成立，这不可能」] 武将所属势力的起始年（FactionLifeYears），
 * 由 FactionGenerals 在加载时注入（本文件不直接引 FactionGenerals，避免循环依赖）。
 * 百岁模式出场年 = max(登场年, 势力起始年)：刘邦这类二十岁以后才起兵的开国者，随势力起兵同步出场。
 */
let factionStartProvider: (generalId: string) => number | null = () => null;

export function setGeneralFactionStartProvider(fn: (generalId: string) => number | null): void {
    factionStartProvider = fn;
}

/** 出场年不早于本势力起始年；势力起始年晚于退场年的（挂错势力的武将）→ 窗口为空，不出场 */
function clampToFactionStart(generalId: string, w: { from: number; to: number }): { from: number; to: number } | null {
    const fs = factionStartProvider(generalId);
    if (fs == null || fs <= w.from) return w;
    if (fs > w.to) return null;
    return { from: fs, to: w.to };
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

/**
 * 🔴 [2026-11-11 主人令「经典战役中，都是时间到的战役，不应该出现以军团为名字的武将和军团，都应该是真实武将，
 *    真实武将的势力、旗号、精锐都应该挂靠武将一致」]（AGENTS §四.2「双方武将须实名在场」）
 * 玩家正在打的经典战，**攻守双方武将一律算在场**：经典战是「时间到了」才开的，不再被生卒窗口／势力起始年／
 * 战场人物无生卒等闸门拦成「XX将军」「XX驻军」。随接任务登记、结算清除（PlayerQuestSystem）。
 */
const classicBattleForcedOnStage = new Set<string>();

export function setClassicBattleForcedOnStage(generalIds: ReadonlyArray<string | null | undefined>): void {
    classicBattleForcedOnStage.clear();
    for (const id of generalIds) if (id) classicBattleForcedOnStage.add(id);
}

export function clearClassicBattleForcedOnStage(): void {
    classicBattleForcedOnStage.clear();
}

/** 取当前模式下的判定年份（剧本＝事件年，百岁＝日历年，其余＝null） */
export function getCurrentStageYear(): number | null {
    if (inYearLookup) return null;
    const scriptMode = isScriptPeriod();
    inYearLookup = true;
    try {
        return scriptMode ? scriptYearProvider() : centenarianYearProvider();
    } finally {
        inYearLookup = false;
    }
}

/**
 * 🔴 [2026-11-11 修「游戏加载失败 Maximum call stack size exceeded」]
 * 在场判定与经典战档位会互相查询，形成环：
 *   isGeneralOnStage → getCentenarianStageWindow → firstBattleStatusProvider（GameApp 注入）
 *   → getGeneralFirstBattle → getGeneralProfile → isGeneralOnStage → …
 * 所以「正在判定的武将」记在栈里，同一个武将重入时不再重算窗口，直接答「在场」
 * （窗口只由生卒年/势力起始年决定，内部这次查询不会改变它），环就断在这里。
 */
const stageLookupStack = new Set<string>();

function withStageLookup<T>(generalId: string, onReentry: () => T, compute: () => T): T {
    if (stageLookupStack.has(generalId)) return onReentry();
    stageLookupStack.add(generalId);
    try {
        return compute();
    } finally {
        stageLookupStack.delete(generalId);
    }
}

/** 武将此刻是否在场（false = 剧本期不在[登场年,卒年] 或 百岁模式不在[登场年,百岁年]且无在场未败军团 → 按普通守将处理） */
export function isGeneralOnStage(generalId: string | null | undefined): boolean {
    if (!generalId || inYearLookup) return true;
    if (classicBattleForcedOnStage.has(generalId)) return true;
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
        // 🔴 [2026-10-31 主人令「登场年一律改为20岁，只在百岁模式生效」]
        //    剧本模式不再按登场年拦人，只按卒年（剧本自身的事件表已决定谁在场）
        const life = GENERAL_LIFE_YEARS[generalId];
        if (!life) return false;
        return year <= life.death;
    }
    // 重入（经典战档位又绕回来问是不是在场）→ 不再重算窗口，按「在场」处理，避免无限递归
    const win = withStageLookup<{ from: number; to: number } | null>(
        generalId,
        () => ({ from: Number.NEGATIVE_INFINITY, to: Number.POSITIVE_INFINITY }),
        () => getCentenarianStageWindow(generalId),
    );
    // 🔴 [2026-11-12 主人令「现在没有经典战役这一说了，只有剧本战，一律按生卒年登场」]
    //    百岁模式严格按 [登场年, 卒年]；原「军团没败不退场」（2026-11-10）作废。
    if (!win || year < win.from) return false;
    return year <= win.to;
}

/** 百岁模式下该武将是否已满退场年纪（year > win.to） */
export function isGeneralPastCentenarianAge(generalId: string | null | undefined): boolean {
    if (!generalId || inYearLookup || isScriptPeriod()) return false;
    inYearLookup = true;
    let year: number | null = null;
    try {
        year = centenarianYearProvider();
    } finally {
        inYearLookup = false;
    }
    if (year == null) return false;
    const win = withStageLookup<{ from: number; to: number } | null>(generalId, () => null, () => getCentenarianStageWindow(generalId));
    return !!win && year > win.to;
}

/**
 * 名将经典战状态（由 GameApp 注入，免得本文件反向 import 经典战表成环）：
 *   'none' = 没有经典战（普将，或名将没收录经典战）；'pending' = 有、还没打；'done' = 已打过。
 * 未注入（编辑器 / 离线脚本）→ 一律 'none'。
 */
export type FirstBattleStatus = 'none' | 'pending' | 'done';
let firstBattleStatusProvider: (generalId: string) => FirstBattleStatus = () => 'none';

export function setFirstBattleStatusProvider(fn: (generalId: string) => FirstBattleStatus): void {
    firstBattleStatusProvider = fn;
}

/**
 * 百岁模式在场窗口 [登场年, 卒年]；未收录 → null。
 * 🔴 [2026-11-12 主人令「现在没有经典战役这一说了，只有剧本战，一律按生卒年登场。这样更加真实，简单」]
 *   · 登场年＝getGeneralDebutYear（默认生年+20，条目写了 debut 以 debut 为准）；退场年＝卒年；
 *   · 作废：开局这批「开局即登场／经典战没打不退场／开局后 50～150 年分批退场」（2026-10-20、2026-11-11）、
 *     「生年+120 退场」（2026-10-18）、「军团没败不退场」（2026-11-10）。
 *   · 仍按势力起始年钳制（clampToFactionStart）。
 */
export function getCentenarianStageWindow(generalId: string): { from: number; to: number } | null {
    const w = rawCentenarianStageWindow(generalId);
    return w ? clampToFactionStart(generalId, w) : null;
}

function rawCentenarianStageWindow(generalId: string): { from: number; to: number } | null {
    const life = GENERAL_LIFE_YEARS[generalId];
    if (!life) return null;
    const debut = getGeneralDebutYear(generalId);
    if (debut == null) return null;
    return { from: debut, to: Math.max(debut, life.death) };
}

/**
 * 🔴 [2026-11-12] 开局排队（经典战）已作废：一律按生卒年登场，没有「开局这批」→ 恒为 false。
 */
export function isOpeningQueueGeneral(_generalId: string): boolean {
    return false;
}
