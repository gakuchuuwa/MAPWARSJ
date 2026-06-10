import { GameConfig } from '../config/GameConfig';
import { CityManager } from '../world/CityManager';
import { LatLng } from '../types/core';
import { Army } from './Army';

export type LegionBattleSide = 'attacker' | 'defender';

export function resolveAnnihilationCityName(cityManager: CityManager, pos: LatLng): string {
    const nearest = cityManager.getNearestCity(null, {
        latitude: pos.lat,
        longitude: pos.lng,
    });
    return nearest?.name ?? '未知';
}

/** 战斗全灭前标记，Army.destroy 时统一播报 */
export function markLegionAnnihilationFeed(
    army: Army,
    side: LegionBattleSide,
    cityName: string
): void {
    if (!GameConfig.SYSTEM.SANDBOX_MODE) return;
    if (army.type !== 'legion') return;
    army.feedAnnihilation = { side, cityName };
}
