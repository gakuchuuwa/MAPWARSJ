/**
 * 战败冷却：武将/精锐战败后锁定 DEFEAT_COOLDOWN_SEASONS 季，防止据点外野战击败后
 * 攻城时同一将/精锐立即再现，也避免名将折了转眼复活。
 *
 * 计数器制：战死时 set(cityId, N)，每季 syncCitySpawnTierConsumption 末尾
 * 调 tickAndApply → 仍 >0 则 override spawnXxxUsed=true 并递减。
 * 实际墙钟 ≈ (锁定季数 + 战死点到下一换季点的余量) × 15 游戏秒。
 */

/** 战败锁定季数（用户 2026-07 定：1 季 → 再出场约 15~30 游戏秒，最少跨一整个换季周期，绝不立马复活）。
 *  想更慢/更快只改这一个数：0=无冷却(可能立马)、1=15~30s、2=30~45s。 */
const DEFEAT_COOLDOWN_SEASONS = 1;

const generalCooldowns = new Map<string, number>();
const eliteCooldowns = new Map<string, number>();

export function lockGeneralAfterDefeat(cityId: string): void {
    generalCooldowns.set(cityId, DEFEAT_COOLDOWN_SEASONS);
}

export function lockEliteAfterDefeat(cityId: string): void {
    eliteCooldowns.set(cityId, DEFEAT_COOLDOWN_SEASONS);
}

export function isGeneralOnCooldown(cityId: string): boolean {
    return (generalCooldowns.get(cityId) ?? 0) > 0;
}

export function isEliteOnCooldown(cityId: string): boolean {
    return (eliteCooldowns.get(cityId) ?? 0) > 0;
}

/** 每季调一次：对仍在冷却的城 override spawnUsed=true，然后递减 */
export function tickAndApplyDefeatCooldowns(
    cities: { id: string; spawnGeneralUsed?: boolean; spawnEliteUsed?: boolean }[],
): void {
    const cityMap: Record<string, { spawnGeneralUsed?: boolean; spawnEliteUsed?: boolean }> = {};
    for (let i = 0; i < cities.length; i++) {
        cityMap[cities[i].id] = cities[i];
    }

    const gDel: string[] = [];
    generalCooldowns.forEach((remaining, cityId) => {
        if (remaining <= 0) { gDel.push(cityId); return; }
        const city = cityMap[cityId];
        if (city) city.spawnGeneralUsed = true;
        generalCooldowns.set(cityId, remaining - 1);
    });
    for (let i = 0; i < gDel.length; i++) generalCooldowns.delete(gDel[i]);

    const eDel: string[] = [];
    eliteCooldowns.forEach((remaining, cityId) => {
        if (remaining <= 0) { eDel.push(cityId); return; }
        const city = cityMap[cityId];
        if (city) city.spawnEliteUsed = true;
        eliteCooldowns.set(cityId, remaining - 1);
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
