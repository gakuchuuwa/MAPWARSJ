/**
 * 战败冷却：武将/精锐战败后锁定一季，防止据点外野战击败后攻城时同一将/精锐立即再现。
 *
 * 计数器制：战死时 set(cityId, 1)，每季 syncCitySpawnTierConsumption 末尾
 * 调 tickAndApply → 仍 >0 则 override spawnXxxUsed=true 并递减。
 */

const generalCooldowns = new Map<string, number>();
const eliteCooldowns = new Map<string, number>();

export function lockGeneralAfterDefeat(cityId: string): void {
    generalCooldowns.set(cityId, 1);
}

export function lockEliteAfterDefeat(cityId: string): void {
    eliteCooldowns.set(cityId, 1);
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
