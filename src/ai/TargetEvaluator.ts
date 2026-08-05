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
import { getEuclideanDistance } from '../core/DistanceUtils';

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
        homeCityId: string,
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

        let pool = TargetEvaluator.buildDirectionalPool(anchorCityId, reachable, homeCityId, cities);
        if (pool.length === 0) {
            const poolSize = Math.max(1, GameConfig.AI.TARGET_NEAR_POOL);
            pool = reachable.slice(0, Math.min(poolSize, reachable.length));
        }

        // 枪打出头鸟（反雪球）：领先势力过大时，概率改打它（见 GameConfig.AI.LEADER_HUNT）。
        // [2026-08-05] 先在推进方向池里挑，挑不到才允许回头——原实现直接在全表取最近的领先城，
        // 绕开了方向池和回头路检查，军团会毫无征兆地掉头往老家方向打，观感像 AI 抽风。
        // 领先势力据点数已 ≥ CITY_THRESHOLD，方向池里多半就有，掉头是罕见兜底。
        const hunt = GameConfig.AI.LEADER_HUNT;
        if (hunt?.ENABLED && Math.random() < hunt.PROBABILITY) {
            const leader = TargetEvaluator.findLeaderFaction(cities);
            if (leader && leader.factionId !== factionId && leader.count >= hunt.CITY_THRESHOLD) {
                const factionById = new Map(cities.map((c) => [c.id, c.factionId]));
                const isLeaderCity = (s: TargetScore) =>
                    factionById.get(s.targetId) === leader.factionId;
                // 方向池内最近的领先城（池按方向排列、未按距离排序，故取最小值而非 find）
                const inPool = pool
                    .filter(isLeaderCity)
                    .reduce<TargetScore | null>(
                        (best, s) => (!best || s.distanceKm < best.distanceKm ? s : best),
                        null
                    );
                if (inPool) return inPool;
                // 推进方向上完全没有领先势力 → 才允许回头去打（reachable 已按道路距离升序）
                const anywhere = reachable.find(isLeaderCity);
                if (anywhere) return anywhere;
            }
        }

        return pool[Math.floor(Math.random() * pool.length)];
    }

    /**
     * 锚点每条直连边 = 一个方向；该方向取最短路上第一跳经此邻城、且最近的敌城。
     * 邻城本身若为敌城则直接入选。
     * 排除「回头路」：目标离老家不比锚点离老家远 → 跳过该方向。
     */
    private static buildDirectionalPool(
        anchorCityId: string,
        reachable: TargetScore[],
        homeCityId: string,
        cities: City[],
    ): TargetScore[] {
        const neighbors = roadRegistry.getConnectedCities(anchorCityId);
        if (neighbors.length === 0) return [];

        const pool: TargetScore[] = [];
        const seen = new Set<string>();

        // 城ID → City 索引
        const cityById = new Map(cities.map((c) => [c.id, c]));

        // 锚点到老家的距离（欧氏），用于判断回头路
        const anchorCity = cityById.get(anchorCityId);
        const homeCity = cityById.get(homeCityId);
        const anchorToHome = anchorCity && homeCity
            ? getEuclideanDistance(
                { lat: anchorCity.latitude, lng: anchorCity.longitude },
                { lat: homeCity.latitude, lng: homeCity.longitude }
              )
            : 0;

        const computeDistFromCity = (cityId: string): number => {
            const ct = cityById.get(cityId);
            return ct && homeCity
                ? getEuclideanDistance(
                    { lat: ct.latitude, lng: ct.longitude },
                    { lat: homeCity.latitude, lng: homeCity.longitude }
                  )
                : 0;
        };

        // [PERF 2026-08-05] 每座敌城的「最短路第一跳」只算一次，按第一跳归组取该方向最近的一座。
        // 原实现对每条直连道路都把全部可达敌城重扫一遍（≈ 路数 × 敌城数 次寻路回溯，约 4 倍冗余）。
        // 邻城自身是敌城的情况天然被覆盖：该方向所有城都要过它，它必是本组最近的。
        const bestByFirstHop = new Map<string, TargetScore>();
        for (const score of reachable) {
            const path = roadRegistry.findCityPath(anchorCityId, score.targetId);
            if (!path || path.length < 2) continue;
            const hop = path[1];
            const cur = bestByFirstHop.get(hop);
            if (!cur || score.distanceKm < cur.distanceKm) {
                bestByFirstHop.set(hop, score);
            }
        }

        for (const neighborId of neighbors) {
            const best = bestByFirstHop.get(neighborId);
            if (!best || seen.has(best.targetId)) continue;
            // 回头路检查：目标离老家不比锚点离老家更远 → 跳过该方向
            if (computeDistFromCity(best.targetId) >= anchorToHome * 0.9) {
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
