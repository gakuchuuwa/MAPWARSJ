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

/** 武将此刻是否在场（false = 剧本期不在[登场年,卒年] 或 百岁模式不在[登场年,百岁年]且无在场未败军团 → 按普通守将处理） */
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
        // 🔴 [2026-10-31 主人令「登场年一律改为20岁，只在百岁模式生效」]
        //    剧本模式不再按登场年拦人，只按卒年（剧本自身的事件表已决定谁在场）
        const life = GENERAL_LIFE_YEARS[generalId];
        if (!life) return false;
        return year <= life.death;
    }
    const win = getCentenarianStageWindow(generalId);
    if (!win || year < win.from) return false;
    if (year <= win.to) return true;
    // 🔴 [2026-11-10 主人令「到年纪的武将改为，等军团完全被打败了，再退场」]
    //    已满百岁退场年（year > win.to），但只要所率军团尚未完全战败，就继续留在场上直至该军团覆灭。
    return activeLegionGeneralChecker(generalId);
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
    const win = getCentenarianStageWindow(generalId);
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
 * 🔴 [2026-11-11 主人定] 开局这批里「快到年纪」的名将也算排队：开局时已在场、但离退场不足这么多年的。
 *   （开局前500年 → 居鲁士只剩 20 年，不排队就容易错过他的经典战。）
 */
const OPENING_TIGHT_YEARS = 30;
/** 🔴 [2026-11-11 主人定] 开局这批里没有经典战的，按生年早晚在「开局后 50～150 年」之间分批退场 */
const OPENING_STAGGER_FROM = 50;
const OPENING_STAGGER_TO = 150;   // 2026-11-11 主人「分批退场可以拉长」100 → 150

/** 开局这批里「本来开局前就已退场」的武将 → 分批退场年（按生年排序；缓存按开局年失效） */
let openingStaggerCache: { start: number; exitYear: Map<string, number> } | null = null;

function openingStaggerExitYear(generalId: string, start: number): number | undefined {
    if (!openingStaggerCache || openingStaggerCache.start !== start) {
        const clamped: Array<{ id: string; birth: number }> = [];
        for (const [id, life] of Object.entries(GENERAL_LIFE_YEARS)) {
            const debut = getGeneralDebutYear(id);
            if (debut == null) continue;
            if (Math.max(debut, centenarianYearOf(life.birth)) < start) clamped.push({ id, birth: life.birth });
        }
        clamped.sort((a, b) => a.birth - b.birth || a.id.localeCompare(b.id));
        const span = OPENING_STAGGER_TO - OPENING_STAGGER_FROM;
        const exitYear = new Map<string, number>();
        clamped.forEach((c, i) => {
            const frac = clamped.length > 1 ? i / (clamped.length - 1) : 1;
            exitYear.set(c.id, start + OPENING_STAGGER_FROM + Math.round(span * frac));
        });
        openingStaggerCache = { start, exitYear };
    }
    return openingStaggerCache.exitYear.get(generalId);
}

/**
 * 百岁模式在场窗口 [登场年, 退场年]；未收录 → null。
 * 🔴 [2026-10-20 主人令「所有开局年前的武将都按开局登场」] 本来的百岁窗口在开局年之前就已结束的武将 → 开局即登场。
 * 🔴 [2026-11-11 主人定「只用于开局这批」] 开局这批（上面这些 + 开局时在场但离退场不足 OPENING_TIGHT_YEARS 年的）：
 *   · 有经典战、还没打 → **不退场**（to = Infinity），等玩家来带他打经典战；
 *   · 开局前就该退场的：经典战打过了 → 退场年记为开局年，此后只靠「军团没败不退场」留在场上，军团战败即退场；
 *     没有经典战 → 按生年早晚在开局后 50～150 年分批退场（不再同一年一起走）；
 *   · 开局时本就在场的那几位打过经典战 → 照原窗口。
 *   开局之后才登场的武将不受影响，照常按生年+120 退场（再加 isGeneralOnStage 里「军团没败不退场」）。
 */
export function getCentenarianStageWindow(generalId: string): { from: number; to: number } | null {
    const life = GENERAL_LIFE_YEARS[generalId];
    if (!life) return null;
    const debut = getGeneralDebutYear(generalId);
    if (debut == null) return null;
    const to = Math.max(debut, centenarianYearOf(life.birth));
    const start = GameConfig.TIME.TIMELINE_START_YEAR;
    if (to < start) {
        const fb = firstBattleStatusProvider(generalId);
        if (fb === 'pending') return { from: start, to: Infinity };
        if (fb === 'done') return { from: start, to: start };
        return { from: start, to: openingStaggerExitYear(generalId, start) ?? start + OPENING_STAGGER_TO };
    }
    if (debut <= start && to < start + OPENING_TIGHT_YEARS && firstBattleStatusProvider(generalId) === 'pending') {
        return { from: debut, to: Infinity };
    }
    return { from: debut, to };
}

/**
 * 🔴 [2026-11-11 主人定] 开局这批里**还在等玩家打经典战**的名将（玩家寻将优先在这些人里挑最近的）。
 * 只在百岁模式有意义；判定口径与 getCentenarianStageWindow 一致。
 */
export function isOpeningQueueGeneral(generalId: string): boolean {
    if (firstBattleStatusProvider(generalId) !== 'pending') return false;
    const life = GENERAL_LIFE_YEARS[generalId];
    if (!life) return false;
    const debut = getGeneralDebutYear(generalId);
    if (debut == null) return false;
    const start = GameConfig.TIME.TIMELINE_START_YEAR;
    const to = Math.max(debut, centenarianYearOf(life.birth));
    return to < start || (debut <= start && to < start + OPENING_TIGHT_YEARS);
}
