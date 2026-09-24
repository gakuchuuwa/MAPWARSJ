/**
 * 历史剧本期开关（全局只读）—— 🔴 [2026-09-23 主人定]
 *
 * 剧本模式 = 整个世界的模式（`PlayerHero.autoPlan === 'script'`，开局默认）；
 * 剧本全部打完自动切乱斗。各系统据此区分剧本 / 乱斗，不各自去找玩家对象。
 * 由 GameApp 注入判据；未注入（离线脚本 / 测试）时按乱斗算，不改变旧行为。
 */
let provider: () => boolean = () => true;

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

/**
 * 🔴 [2026-09-23 主人定] 剧本期：当前这一场归属武将的**主将队兵种**（事件里的 commanderUnit）。
 * 返回 null = 用武将专属英雄表 / 前排兵种兜底（src/data/generalHeroUnits.ts）。乱斗恒 null。
 */
let commanderUnitResolver: (generalId: string) => string | null = () => null;

export function setScriptCommanderUnitResolver(fn: (generalId: string) => string | null): void {
    commanderUnitResolver = fn;
}

export function getScriptCommanderUnit(generalId: string): string | null {
    return isScriptPeriod() ? commanderUnitResolver(generalId) : null;
}

/**
 * 🔴 [2026-09-23] 剧本期：当前这一场的「归属武将 + 军团出发据点」（事件 startCityId）。
 * 玩家去这座城找他、大军从这里出发；这期间他不算在本城。乱斗恒 null。
 */
let eventStartResolver: () => { generalId: string; cityId: string } | null = () => null;

export function setScriptEventStartResolver(fn: () => { generalId: string; cityId: string } | null): void {
    eventStartResolver = fn;
}

export function getScriptEventStart(): { generalId: string; cityId: string } | null {
    return isScriptPeriod() ? eventStartResolver() : null;
}

/**
 * 🔴 [2026-09-25 主人「甲，批准」一次做完巴尔干三场] 剧本期攻城战：被攻那座城的守将按**事件**写（siegeData.defenderGeneralId）。
 * 改前城防守将只认该城势力的锚定武将：底比斯会出伊巴密浓达（前362 年已死），哈利卡纳苏斯出阿尔特米西亚而不是门农。
 * 只改剧本期、只改事件指定的那一座城；城池数据（势力、锚定武将）一概不动。乱斗恒 null。
 */
let siegeDefenderResolver: (cityId: string) => string | null = () => null;

export function setScriptSiegeDefenderResolver(fn: (cityId: string) => string | null): void {
    siegeDefenderResolver = fn;
}

export function getScriptSiegeDefenderGeneral(cityId: string): string | null {
    return isScriptPeriod() ? siegeDefenderResolver(cityId) : null;
}
