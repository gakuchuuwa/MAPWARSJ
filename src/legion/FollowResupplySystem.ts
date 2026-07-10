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
import { getLegionTroopCap } from './LegionSpawnPolicy';
import { getEuclideanDistance } from '../core/DistanceUtils';
import { gameLog } from '../utils/GameLogger';
import { generalHasStrategicEffect, getCityAnchoredStrategicMagnitude } from '../combat/GeneralSkillCombat';

export class FollowResupplySystem {
    private cityManager: CityManager;
    /** armyId -> 当前在半径内且本段停留已补过的 cityId */
    private suppliedThisVisit = new Map<string, Set<string>>();
    private lastScanAt = 0;
    /** 以战养战：军团累积待补兵力（小数部分保留） */
    private fieldResupplyAccum = new Map<string, number>();

    constructor(cityManager: CityManager) {
        this.cityManager = cityManager;
    }

    public clearForArmy(armyId: string): void {
        this.suppliedThisVisit.delete(armyId);
        this.fieldResupplyAccum.delete(armyId);
    }

    /**
     * S⑬以战养战：远离己方据点时缓慢回血（全军团，不限跟拍）
     * 速率约满编 0.015%/游戏秒（远离 PASS_RADIUS 外生效）
     */
    public tickStrategicFieldResupply(army: Army, deltaTimeSec: number): void {
        if (!GameConfig.SYSTEM.SANDBOX_MODE) return;
        if (army.isDestroyed || army.getTroops() <= 0) return;
        if (!generalHasStrategicEffect(army, 'field_resupply')) return;

        const armyMax = getLegionTroopCap(army);
        if (army.getTroops() >= armyMax) return;

        const factionId = army.getFactionId();
        if (!factionId || factionId === 'neutral' || factionId === 'panjun') return;

        const pos = army.getPosition();
        const radius = GameConfig.FOLLOW_RESUPPLY.PASS_RADIUS;
        const nearFriendly = this.cityManager.getCitiesByFaction(factionId).some((city) => {
            const dist = getEuclideanDistance(pos, {
                lat: city.latitude,
                lng: city.longitude,
            });
            return dist <= radius;
        });
        if (nearFriendly) return;

        // S⑤坚壁清野：附近有敌方据点守将持有此效果时，攻城方缓回血减半
        let resupplyMult = 1;
        const allCities = this.cityManager.getCities();
        for (const city of allCities) {
            if (city.factionId === factionId || city.factionId === 'neutral' || city.factionId === 'panjun') continue;
            const dist = getEuclideanDistance(pos, { lat: city.latitude, lng: city.longitude });
            if (dist <= radius) {
                const mag = getCityAnchoredStrategicMagnitude(city.id, 'siege_attacker_supply_halved');
                if (mag < 1) { 
                    resupplyMult = Math.min(resupplyMult, mag); 
                    
                    // S⑤坚壁清野 进圈日志
                    const scorchedSet = (army as any).scorchedEarthCities || ((army as any).scorchedEarthCities = new Set<string>());
                    if (!scorchedSet.has(city.id)) {
                        scorchedSet.add(city.id);
                        gameLog('battle', `〔坚壁清野〕${army.generalId || '将领'}进入【${city.name}】清野范围，补给受阻`);
                    }
                }
            }
        }

        const ratePerSec = armyMax * 0.00015 * resupplyMult;
        const accum = (this.fieldResupplyAccum.get(army.id) ?? 0) + ratePerSec * deltaTimeSec;
        if (accum < 1) {
            this.fieldResupplyAccum.set(army.id, accum);
            return;
        }
        const add = Math.floor(accum);
        this.fieldResupplyAccum.set(army.id, accum - add);
        army.setTroops(Math.min(armyMax, army.getTroops() + add));

        // S⑬以战养战 累积满 1000 发一次战报
        const uiAccum = ((army as any).fieldResupplyUiAccum ?? 0) + add;
        if (uiAccum >= 1000) {
            (army as any).fieldResupplyUiAccum = 0; // 清零
            gameLog('battle', `〔以战养战〕${army.generalId || '将领'}沿途就粮，恢复 +1,000`);
        } else {
            (army as any).fieldResupplyUiAccum = uiAccum;
        }
    }

    public update(army: Army): void {
        const cfg = GameConfig.FOLLOW_RESUPPLY;
        if (!cfg.ENABLED || !GameConfig.SYSTEM.SANDBOX_MODE) return;
        if (army.isDestroyed || army.getTroops() <= 0) return;
        if (army.getIsInCombat()) return;

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
