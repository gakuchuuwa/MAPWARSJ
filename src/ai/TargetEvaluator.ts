/**
 * TargetEvaluator — 乱斗进攻目标选择
 *
 * 规则：
 * 1. 以推进锚点 anchorCityId 为路网中心（见 TargetAnchorResolver.resolveForwardAnchor）
 * 2. 只考虑从该点沿路可达的非己方据点
 * 3. 按道路里程从近到远排序，取最近 N 座（GameConfig.AI.TARGET_NEAR_POOL，默认 3）
 * 4. 在池内均匀随机抽 1 座进攻
 */
import { City } from '../types/core';
import { GameConfig } from '../config/GameConfig';
import { roadRegistry } from '../core/RoadRegistry';

export interface TargetScore {
    targetId: string;
    /** 道路距离 (km)，越小越近 */
    score: number;
    distanceKm: number;
}

export interface TargetEvaluateOptions {
    /** 忽略目标（例如刚失败进入冷却的城） */
    excludeTargetIds?: Set<string>;
}

export class TargetEvaluator {
    /** @deprecated 目标选择已改为近敌池抽签，UI 锁定暂不生效 */
    public static playerStrategicTargetId: string | null = null;

    /** @deprecated */
    public static playerFactionId: string = 'qin';

    /**
     * 列出从 anchorCityId 出发所有可达敌方城（按道路距离升序）
     */
    public static evaluate(
        factionId: string,
        anchorCityId: string,
        cities: City[],
        options?: TargetEvaluateOptions
    ): TargetScore[] {
        return TargetEvaluator.collectReachableEnemies(factionId, anchorCityId, cities, options);
    }

    /**
     * 在「从锚点算最近的 N 座敌城」里随机抽一座作为进攻目标
     */
    public static pickTarget(
        factionId: string,
        anchorCityId: string,
        cities: City[],
        options?: TargetEvaluateOptions
    ): TargetScore | null {
        const reachable = TargetEvaluator.collectReachableEnemies(
            factionId,
            anchorCityId,
            cities,
            options
        );
        if (reachable.length === 0) return null;

        const poolSize = Math.max(1, GameConfig.AI.TARGET_NEAR_POOL);
        const pool = reachable.slice(0, Math.min(poolSize, reachable.length));
        return pool[Math.floor(Math.random() * pool.length)];
    }

    private static collectReachableEnemies(
        factionId: string,
        anchorCityId: string,
        cities: City[],
        options?: TargetEvaluateOptions
    ): TargetScore[] {
        if (!anchorCityId || !roadRegistry.isInitialized()) return [];

        const roadDistances = roadRegistry.getRoadDistancesKmFrom(anchorCityId);
        const scores: TargetScore[] = [];

        for (const city of cities) {
            if (city.factionId === factionId) continue;
            if (options?.excludeTargetIds?.has(city.id)) continue;

            const roadKm = roadDistances.get(city.id);
            if (roadKm === undefined) continue;

            scores.push({ targetId: city.id, score: roadKm, distanceKm: roadKm });
        }

        scores.sort((a, b) => a.distanceKm - b.distanceKm);
        return scores;
    }
}
