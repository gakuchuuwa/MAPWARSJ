import { firstChronicleEvent, isChronicleActive } from './ChronicleDirector';
import { gameLog } from '../../utils/GameLogger';

/**
 * 🔴 [2026-11-14] 编年史全自动开场（模式一：单骑入世 · 边走边讲）
 * 不跨区跳切镜头：开局镜头直接锁在**阿达纳城东官道**上的玩家单骑
 * （出生据点见 `PLAYER_START_CITY_ID`／`PLAYER_START_OFFSET`；开播前 5 秒原地完成整幅视口渲染）。
 * 开播解开暂停瞬间，居鲁士二世拔营出征、玩家自奇里乞亚平原告道策马东行追赶，趁赶路先念本段总起开篇词，
 * 念完无缝接上首战《帕萨尔加德之战》战略播报 → 会合入伍 → 抵达山隘进战术战场念战术播报。
 */
export const CHRONICLE_OPENING_PROLOGUE =
    '公元前六世纪中叶，欧亚诸邦并立，铁兵与战马驰骋四方。东方姬周衰微，晋楚争霸中原。恒河诸国相攻，希腊城邦与迦太基竞逐海路，罗马据台伯河畔渐兴。西亚四强对峙，吕底亚富甲小亚细亚，埃及据守尼罗河，巴比伦坐拥两河沃野，米底统辖伊朗高原，南缘波斯诸部已暗聚兵甲。';

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
