/**
 * 历史剧本期开关（已删除剧本模式）—— 🔴 [2026-11-12 主人令「删除剧本模式」]
 *
 * 剧本模式已从玩家可选模式中删除；本文件只保留同名导出给旧调用点：
 *   · `isScriptPeriod()` 恒 false；
 *   · 所有 `getScript...` 解析器恒 null（不再套主将队/事件起点/事件守将；四级剧本军团 2026-11-13 已整体删除）。
 * 历史事件数据与 `HistoricalEventManager` 仍保留给战场点击与即时战斗，不再由玩家模式驱动。
 */
let provider: () => boolean = () => false;

export function setScriptPeriodProvider(fn: () => boolean): void {
    // 旧入口保留为空实现：任何调用都不会再把世界切回剧本期
    void fn;
}

export function isScriptPeriod(): boolean {
    return false;
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
 * 改前城防守将只认该城势力的锚定武将：底比斯会出伊巴密浓达（公元前362年已死），哈利卡纳苏斯出阿尔特米西亚而不是门农。
 * 只改剧本期、只改事件指定的那一座城；城池数据（势力、锚定武将）一概不动。乱斗恒 null。
 */
let siegeDefenderResolver: (cityId: string) => string | null = () => null;

export function setScriptSiegeDefenderResolver(fn: (cityId: string) => string | null): void {
    siegeDefenderResolver = fn;
}

export function getScriptSiegeDefenderGeneral(cityId: string): string | null {
    return isScriptPeriod() ? siegeDefenderResolver(cityId) : null;
}
