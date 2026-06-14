/**
 * 跟随军据点补兵：仅相机跟随的一支军团，进入己方据点半径时
 * 从据点抽出最多 50% 驻军（据点至少留 1000），并入军团直至文化对应上限（纯骑 8 万 / 其余 10 万）。
 * 离开半径后清除「本段已补」标记，再次进入可再补。
 *
 * 定性（2026-06-10，GAME_DIRECTION v1.4「御驾亲征」）：
 * 「仅跟拍军团可补兵」是玩法不是 bug——这是玩家唯一的战力干预手段（镜头即玩家化身）。
 * 禁止任何 AI 以「公平性」为由改成对全军团生效。
 */
import { Army } from './Army';
import { CityManager } from '../world/CityManager';
import { GameConfig } from '../config/GameConfig';
import { canFollowResupplyFromCity, getLegionTroopCap } from './LegionSpawnPolicy';
import { getEuclideanDistance } from '../core/DistanceUtils';
import { gameLog } from '../utils/GameLogger';

export class FollowResupplySystem {
    private cityManager: CityManager;
    /** armyId -> 当前在半径内且本段停留已补过的 cityId */
    private suppliedThisVisit = new Map<string, Set<string>>();
    private lastScanAt = 0;

    constructor(cityManager: CityManager) {
        this.cityManager = cityManager;
    }

    public clearForArmy(armyId: string): void {
        this.suppliedThisVisit.delete(armyId);
    }

    public update(army: Army): void {
        const cfg = GameConfig.FOLLOW_RESUPPLY;
        if (!cfg.ENABLED || !GameConfig.SYSTEM.SANDBOX_MODE) return;
        if (army.isDestroyed || army.getTroops() <= 0) return;
        if (army.getIsInCombat()) return;
        if (!canFollowResupplyFromCity(army)) return;

        const factionId = army.getFactionId();
        if (!factionId || factionId === 'neutral' || factionId === 'panjun') return;

        const armyMax = getLegionTroopCap(army);
        if (army.getTroops() >= armyMax) return;

        const now = performance.now();
        if (now - this.lastScanAt < cfg.SCAN_INTERVAL_MS) return;
        this.lastScanAt = now;

        const pos = army.getPosition();
        const radius = cfg.PASS_RADIUS;
        const inRangeIds = new Set<string>();

        for (const city of this.cityManager.getCitiesByFaction(factionId)) {
            const dist = getEuclideanDistance(pos, {
                lat: city.latitude,
                lng: city.longitude,
            });
            if (dist > radius) continue;
            inRangeIds.add(city.id);
        }

        let supplied = this.suppliedThisVisit.get(army.id);
        if (!supplied) {
            supplied = new Set<string>();
            this.suppliedThisVisit.set(army.id, supplied);
        }

        for (const cityId of [...supplied]) {
            if (!inRangeIds.has(cityId)) {
                supplied.delete(cityId);
            }
        }

        for (const cityId of inRangeIds) {
            if (supplied.has(cityId)) continue;
            const city = this.cityManager.getCity(cityId);
            if (!city) continue;

            const transferred = this.transferTroops(army, city, armyMax);
            if (transferred > 0) {
                supplied.add(cityId);
                gameLog(
                    'followResupply',
                    `🎒 [补兵] ${army.name} 经【${city.name}】+${transferred}（军 ${army.getTroops()} / 城 ${city.troops}）`
                );
            } else {
                supplied.add(cityId);
            }
        }
    }

    private transferTroops(
        army: Army,
        city: { id: string; name: string; troops?: number },
        armyMax: number
    ): number {
        const cfg = GameConfig.FOLLOW_RESUPPLY;
        const cityTroops = Math.floor(city.troops || 0);
        const minCity = cfg.CITY_MIN_TROOPS;

        if (cityTroops <= minCity) return 0;

        const half = Math.floor(cityTroops * cfg.TRANSFER_RATIO);
        const maxFromCity = Math.min(half, cityTroops - minCity);
        const armyRoom = armyMax - army.getTroops();
        const amount = Math.min(maxFromCity, armyRoom);

        if (amount <= 0) return 0;

        city.troops = cityTroops - amount;
        army.setTroops(army.getTroops() + amount);
        this.cityManager.updateCityLabel(city.id);
        return amount;
    }
}
