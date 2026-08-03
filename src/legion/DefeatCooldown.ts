/**
 * 战败冷却：武将/精锐战败后 DEFEAT_COOLDOWN_SECONDS 游戏秒内禁止复活，防止据点外野战击败后
 * 攻城时同一将/精锐立即再现，也避免名将折了转眼复活。
 *
 * 2026-08-03 改为绝对游戏时间戳制：锁定时刻记录「解锁游戏时刻 = 当前游戏秒 + 15」，
 * 冷却查询/覆盖只比较时间戳，与季度 tick 完全解耦。
 * 原计数器制（每季 tick 递减 1）在掉帧/切后台恢复时，RecruitmentSystem.seasonTimer
 * 会密集补季（每帧补一个季），counter 被提前减光、spawnUsed 被连次重置，
 * 实际冷却被压缩到趋近 0 秒，达不到「至少 15 秒」。时间戳制免疫该压缩：
 * 卡顿恢复后 elapsed 一次跳过大量游戏秒，冷却时刻随之自然判定。
 *
 * 时间源：GameApp 启动时注入 TimeSystem.getElapsedGameSeconds（暂停冻结、倍速加速）。
 */

/** 战败冷却时长（游戏秒，2026-08-03 主人定：至少 15 秒）。想更慢/更快只改这一个数。 */
const DEFEAT_COOLDOWN_SECONDS = 15;

let gameTimeProvider: () => number = () => 0;

/** 注入游戏时间源（应传 TimeSystem.getElapsedGameSeconds） */
export function setDefeatCooldownTimeSource(fn: () => number): void {
    gameTimeProvider = fn;
}

const generalCooldowns = new Map<string, number>(); // cityId -> 解锁游戏时刻（秒）
const eliteCooldowns = new Map<string, number>();

export function lockGeneralAfterDefeat(cityId: string): void {
    generalCooldowns.set(cityId, gameTimeProvider() + DEFEAT_COOLDOWN_SECONDS);
}

export function lockEliteAfterDefeat(cityId: string): void {
    eliteCooldowns.set(cityId, gameTimeProvider() + DEFEAT_COOLDOWN_SECONDS);
}

export function isGeneralOnCooldown(cityId: string): boolean {
    const unlockAt = generalCooldowns.get(cityId);
    return unlockAt !== undefined && unlockAt > gameTimeProvider();
}

export function isEliteOnCooldown(cityId: string): boolean {
    const unlockAt = eliteCooldowns.get(cityId);
    return unlockAt !== undefined && unlockAt > gameTimeProvider();
}

/** 每季调一次：对仍在冷却期的城 override spawnUsed=true（兜底防遗漏路径），到点自动清理 */
export function tickAndApplyDefeatCooldowns(
    cities: { id: string; spawnGeneralUsed?: boolean; spawnEliteUsed?: boolean }[],
): void {
    const cityMap: Record<string, { spawnGeneralUsed?: boolean; spawnEliteUsed?: boolean }> = {};
    for (let i = 0; i < cities.length; i++) {
        cityMap[cities[i].id] = cities[i];
    }
    const now = gameTimeProvider();

    const gDel: string[] = [];
    generalCooldowns.forEach((unlockAt, cityId) => {
        if (unlockAt <= now) { gDel.push(cityId); return; }
        const city = cityMap[cityId];
        if (city) city.spawnGeneralUsed = true;
    });
    for (let i = 0; i < gDel.length; i++) generalCooldowns.delete(gDel[i]);

    const eDel: string[] = [];
    eliteCooldowns.forEach((unlockAt, cityId) => {
        if (unlockAt <= now) { eDel.push(cityId); return; }
        const city = cityMap[cityId];
        if (city) city.spawnEliteUsed = true;
    });
    for (let i = 0; i < eDel.length; i++) eliteCooldowns.delete(eDel[i]);
}

export function clearCooldownsForCity(cityId: string): void {
    generalCooldowns.delete(cityId);
    eliteCooldowns.delete(cityId);
}

export function clearAllDefeatCooldowns(): void {
    generalCooldowns.clear();
    eliteCooldowns.clear();
}
