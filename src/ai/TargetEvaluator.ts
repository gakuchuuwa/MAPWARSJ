/**
 * TargetEvaluator — 乱斗进攻目标选择
 *
 * 规则：
 * 1. 以推进锚点 anchorCityId 为路网中心（见 TargetAnchorResolver.resolveForwardAnchor；兵力 <2 万用出发点，≥2 万用推进锚点）
 * 2. 只考虑从该点沿路可达的非己方据点
 * 3. 锚点每条直连道路各取该方向最近 1 座敌城，组成方向池
 * 4. 方向池内若有「全图据点最多的势力」的城 → 必打（枪打出头鸟，确定性无门槛，见 pickTarget）
 * 5. 否则：有 fromPosition 时按推进轴（老家→当前位置）滤掉身后的城再取最近（行军惯性）；否则均匀随机
 *    （无直连或无方向敌城时回退「全局最近 N」）
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
    /**
     * 行军惯性（2026-08-06）：半路必须重抽时的当前坐标。
     * 先按「老家 → 当前位置」这条推进轴过滤掉身后的城，再在剩下的里取最近；
     * 轴上全被滤掉才退回全池最近。出头鸟仍优先于此。
     */
    fromPosition?: { lat: number; lng: number };
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

        // 枪打出头鸟（反雪球）：候选池（方向池，军团挨着的 2-3 座可选城）里有全图据点最多的势力 → 必打它。
        // [2026-08-05 GAKU 定] 确定性、无门槛：只有挨着的才打，不挨着的不打——方向池里没有领头城，
        // 就不回头（原 anywhere 兜底已删），正常抽签（有 fromPosition 时改惯性最近）。
        const hunt = GameConfig.AI.LEADER_HUNT;
        if (hunt?.ENABLED) {
            const leader = TargetEvaluator.findLeaderFaction(cities);
            if (leader && leader.factionId !== factionId) {
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
            }
        }

        // 行军惯性：有当前位置时按推进轴择近（半路重抽少折返）；否则均匀随机
        const from = options?.fromPosition;
        if (from && pool.length > 1) {
            const inertial = TargetEvaluator.pickByMarchInertia(pool, cities, from, homeCityId);
            if (inertial) return inertial;
        }

        return pool[Math.floor(Math.random() * pool.length)];
    }

    /**
     * 行军惯性（2026-08-06）：在方向池里挑「不往回走的最近一座」。
     *
     * 推进轴 = 老家 → 军团当前位置。候选相对当前位置的位移在轴上的投影 ≥0 = 继续朝前（含侧向），
     * <0 = 折回老家方向。先只在朝前的候选里取最近；朝前的一座都没有（军团已被打回老家附近、
     * 或轴长几乎为 0 刚出城）才退回全池最近。
     *
     * 只用「老家 + 当前位置 + 候选坐标」，不需要新增状态；比原先的「全池欧氏最近」多挡住一类：
     * 刚路过的背后城明明更近，却正是折返方向。
     */
    private static pickByMarchInertia(
        pool: TargetScore[],
        cities: City[],
        from: { lat: number; lng: number },
        homeCityId: string,
    ): TargetScore | null {
        const cityById = new Map(cities.map((c) => [c.id, c]));
        const home = cityById.get(homeCityId);

        // 推进轴（未归一化即可，只看投影符号）；老家缺失或军团几乎还在老家 → 无轴可依
        const axisLat = home ? from.lat - home.latitude : 0;
        const axisLng = home ? from.lng - home.longitude : 0;
        const hasAxis = axisLat * axisLat + axisLng * axisLng > 1e-6;

        let bestForward: TargetScore | null = null;
        let bestForwardDist = Infinity;
        let bestAny: TargetScore | null = null;
        let bestAnyDist = Infinity;

        for (const s of pool) {
            const c = cityById.get(s.targetId);
            if (!c) continue;
            const d = getEuclideanDistance(from, { lat: c.latitude, lng: c.longitude });
            if (d < bestAnyDist) {
                bestAnyDist = d;
                bestAny = s;
            }
            if (!hasAxis) continue;
            const proj = (c.latitude - from.lat) * axisLat + (c.longitude - from.lng) * axisLng;
            if (proj >= 0 && d < bestForwardDist) {
                bestForwardDist = d;
                bestForward = s;
            }
        }

        return bestForward ?? bestAny;
    }

    /**
     * 锚点每条直连边 = 一个方向；该方向取最短路上第一跳经此邻城、且最近的敌城。
     * 保留「回头路」检查：目标离老家 ≥ 锚点离老家的 0.9 倍才入池（即只朝远离老家的方向推进）。
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

        // [PERF 2026-08-05] 每座敌城的「最短路第一跳」只算一次，按第一跳归组，每组留最近的一座。
        // 原实现对每条直连道路都把全部可达敌城重扫一遍（≈ 路数 × 敌城数 次寻路回溯）。
        //
        // reachable 已按道路距离升序，故**每组第一次命中的就是该组最小值**，无需比距离；
        // 所有方向都填上后即可收工——开局全图 900+ 座敌城全可达，不提前退出就要为每座城
        // 调一次 findCityPath，而 buildPathResult 每次都会把整条路径的全部坐标点拼出来（跨图路径上千点）。
        //
        // 注意：邻城本身是敌城时**通常**（而非必然）落在自己那组——若锚点到它的直连路又长又绕、
        // Dijkstra 绕经别的邻城更短，它的第一跳就不是自己，可能被挤出池。方向数不受影响，
        // 只是偶尔挑的不是那座贴脸的城，观感无异常。
        const neighborSet = new Set(neighbors);
        const bestByFirstHop = new Map<string, TargetScore>();
        for (const score of reachable) {
            if (bestByFirstHop.size >= neighborSet.size) break; // 各方向均已定案
            const path = roadRegistry.findCityPath(anchorCityId, score.targetId);
            if (!path || path.length < 2) continue;
            const hop = path[1];
            if (!neighborSet.has(hop) || bestByFirstHop.has(hop)) continue;
            bestByFirstHop.set(hop, score);
        }

        for (const neighborId of neighbors) {
            const best = bestByFirstHop.get(neighborId);
            if (!best) continue;
            // 回头路检查：目标离老家 ≥ 锚点离老家的 0.9 倍才入池（否则是朝老家方向回头，跳过）
            if (computeDistFromCity(best.targetId) >= anchorToHome * 0.9) {
                pool.push(best);
            }
        }

        return pool;
    }

    /**
     * 当前据点最多的势力（排除无主/叛军 panjun）；**须严格多于次名**，平局一律返回 null。
     *
     * [2026-08-05] 平局守卫不可删：开局 922 座城 = 922 个势力、人人恰好 1 城，
     * 没有平局判据时 `n > bestN` 会保留遍历到的首个势力（= cities 数组首城的 tang/长安），
     * 于是长安在开局被所有邻近军团确定性合击——它并不领先，纯属取值假象。
     * 实测见 scratch/verify_leader_tie.mts。
     */
    private static findLeaderFaction(cities: City[]): { factionId: string; count: number } | null {
        const counts = new Map<string, number>();
        for (const c of cities) {
            if (!c.factionId || c.factionId === 'panjun') continue;
            counts.set(c.factionId, (counts.get(c.factionId) ?? 0) + 1);
        }
        let bestId = '';
        let bestN = 0;
        let secondN = 0;
        counts.forEach((n, f) => {
            if (n > bestN) {
                secondN = bestN;
                bestN = n;
                bestId = f;
            } else if (n > secondN) {
                secondN = n;
            }
        });
        if (!bestId || bestN <= secondN) return null; // 并列第一 = 无人领先
        return { factionId: bestId, count: bestN };
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
