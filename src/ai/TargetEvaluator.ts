/**
 * TargetEvaluator — 乱斗进攻目标选择
 *
 * 规则：
 * 1. 以推进锚点 anchorCityId 为路网中心（见 TargetAnchorResolver.resolveForwardAnchor；兵力 <2 万用出发点，≥2 万用推进锚点）
 * 2. 只考虑从该点沿路可达的非己方据点
 * 3. 锚点每条直连道路各取该方向最近 1 座敌城，组成方向池
 * 4. 在方向池内均匀随机抽 1 座进攻（无直连或无方向敌城时回退「全局最近 N」）
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
     * 在锚点各直连道路方向的最近敌城池里随机抽一座；无方向池时回退全局最近 N。
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

        // 枪打出头鸟（反雪球）：领先势力过大时，概率改打它最近的城（见 GameConfig.AI.LEADER_HUNT）
        const hunt = GameConfig.AI.LEADER_HUNT;
        if (hunt?.ENABLED && Math.random() < hunt.PROBABILITY) {
            const leader = TargetEvaluator.findLeaderFaction(cities);
            if (leader && leader.factionId !== factionId && leader.count >= hunt.CITY_THRESHOLD) {
                const factionById = new Map(cities.map((c) => [c.id, c.factionId]));
                const leaderTarget = reachable.find(
                    (s) => factionById.get(s.targetId) === leader.factionId
                );
                if (leaderTarget) return leaderTarget; // reachable 已按道路距离升序 → 最近的领先城
            }
        }

        let pool = TargetEvaluator.buildDirectionalPool(anchorCityId, reachable);
        if (pool.length === 0) {
            const poolSize = Math.max(1, GameConfig.AI.TARGET_NEAR_POOL);
            pool = reachable.slice(0, Math.min(poolSize, reachable.length));
        }
        return pool[Math.floor(Math.random() * pool.length)];
    }

    /**
     * 锚点每条直连边 = 一个方向；该方向取最短路上第一跳经此邻城、且最近的敌城。
     * 邻城本身若为敌城则直接入选。
     */
    private static buildDirectionalPool(
        anchorCityId: string,
        reachable: TargetScore[],
    ): TargetScore[] {
        const neighbors = roadRegistry.getConnectedCities(anchorCityId);
        if (neighbors.length === 0) return [];

        const reachableById = new Map(reachable.map((s) => [s.targetId, s]));
        const pool: TargetScore[] = [];
        const seen = new Set<string>();

        for (const neighborId of neighbors) {
            const directEnemy = reachableById.get(neighborId);
            if (directEnemy && !seen.has(directEnemy.targetId)) {
                pool.push(directEnemy);
                seen.add(directEnemy.targetId);
                continue;
            }

            let best: TargetScore | null = null;
            for (const score of reachable) {
                const path = roadRegistry.findCityPath(anchorCityId, score.targetId);
                if (!path || path.length < 2 || path[1] !== neighborId) continue;
                if (!best || score.distanceKm < best.distanceKm) {
                    best = score;
                }
            }
            if (best && !seen.has(best.targetId)) {
                pool.push(best);
                seen.add(best.targetId);
            }
        }

        return pool;
    }

    /** 当前据点最多的势力（排除无主/叛军 panjun） */
    private static findLeaderFaction(cities: City[]): { factionId: string; count: number } | null {
        const counts = new Map<string, number>();
        for (const c of cities) {
            if (!c.factionId || c.factionId === 'panjun') continue;
            counts.set(c.factionId, (counts.get(c.factionId) ?? 0) + 1);
        }
        let bestId = '';
        let bestN = 0;
        counts.forEach((n, f) => { if (n > bestN) { bestN = n; bestId = f; } });
        return bestId ? { factionId: bestId, count: bestN } : null;
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
