/**
 * 历史剧本期开关（全局只读）—— 🔴 [2026-09-23 主人定]
 *
 * 剧本模式 = 整个世界的模式（`PlayerHero.autoPlan === 'script'`，开局默认）；
 * 剧本全部打完自动切乱斗。各系统据此区分剧本 / 乱斗，不各自去找玩家对象。
 * 由 GameApp 注入判据；未注入（离线脚本 / 测试）时按乱斗算，不改变旧行为。
 */
let provider: () => boolean = () => false;

export function setScriptPeriodProvider(fn: () => boolean): void {
    provider = fn;
}

export function isScriptPeriod(): boolean {
    return provider();
}

/**
 * 🔴 [2026-09-23 主人定「新建一个四级……为剧本军团」] 剧本期：当前这一仗里某势力该用哪支**剧本军团**。
 * 由 GameApp 注入（按当前事件的 attackerLegionName / defenderLegionName）；返回 null = 用势力自己挂的军团。
 * 乱斗模式恒 null —— 乱斗里一格不变。
 */
let factionLegionResolver: (factionId: string) => string | null = () => null;

export function setScriptFactionLegionResolver(fn: (factionId: string) => string | null): void {
    factionLegionResolver = fn;
}

export function getScriptFactionLegionName(factionId: string): string | null {
    return isScriptPeriod() ? factionLegionResolver(factionId) : null;
}
