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
