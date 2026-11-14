import { firstChronicleEvent, isChronicleActive } from './ChronicleDirector';
import { gameLog } from '../../utils/GameLogger';

/**
 * 🔴 [2026-11-14] 编年史全自动开场（模式一：单骑入世 · 边走边讲）
 * 不跨区跳切镜头：开局镜头直接锁在波斯山道上的玩家单骑（开播前 5 秒原地完成整幅视口渲染）。
 * 开播解开暂停瞬间，居鲁士二世拔营出征、玩家策马追赶，趁追军路程先念本段总起开篇词，
 * 念完无缝接上首战《帕萨尔加德之战》战略播报 → 会合入伍 → 抵达山隘进战术战场念战术播报。
 */
export const CHRONICLE_OPENING_PROLOGUE =
    '从爱琴海岸富甲一方的吕底亚王国、尼罗河畔的埃及，到两河沃野的新巴比伦王国与东方争霸的晋楚秦齐，列强割据山河。跨越两千四百余年的战争编年史自此按史推演，画面中策马前行的旅人以布衣单骑入世，将追随历代名将亲历攻城野战、凭战功自斥候一路拜将；此刻高原战云骤起，他正赶赴波斯军中会合。';

/** 开局初始暂停窗内按住首场发令，防止 tick 提前解开暂停与自动开播冲突 */
let bootHold = false;
/** 是否待在首场战略播报前并入单骑入世开篇词（单局一次性消费） */
let prologuePending = false;

/** 装填编年史单骑入世开场（新开百岁模式时调用） */
export function armChronicleOpening(currentlyPaused = true): void {
    bootHold = currentlyPaused;
    prologuePending = true;
}

/** 开播解开暂停时释放开局发令闸；若本次确实从锁态释放则返回 true */
export function releaseChronicleOpeningBootHold(): boolean {
    if (!bootHold) return false;
    bootHold = false;
    return true;
}

/** 取消或作废未消费的开场状态（读档、切离百岁模式、中止行程时调用） */
export function cancelChronicleOpening(): void {
    bootHold = false;
    prologuePending = false;
}

/** 开播前暂停期内阻止首场提前起兵与提前解暂停 */
export function isChronicleOpeningBlocking(): boolean {
    return bootHold && isChronicleActive();
}

/** 首场开念时一次性取出总起开篇词（非首场或已消费返回 null） */
export function consumeChronicleOpeningPrologue(battleId?: string): string | null {
    if (!prologuePending || !isChronicleActive()) return null;
    const first = firstChronicleEvent();
    if (!first) {
        prologuePending = false;
        return null;
    }
    if (battleId !== undefined && first.battle?.battleId !== battleId) {
        prologuePending = false;
        return null;
    }
    prologuePending = false;
    gameLog('expedition', '[编年史] 单骑入世开篇词并入首场播报');
    return CHRONICLE_OPENING_PROLOGUE;
}
