/**
 * TargetEvaluator — 乱斗进攻目标选择（2026-08-07 定稿，干净版）
 *
 * 规则 A（兵力 < 2 万）：锚点 = 本军出发点 homeCityId，向外蚕食本城周边。
 * 规则 B（兵力 ≥ 2 万）：锚点 = 离军团道路距离最近的前线己方城（resolveForwardAnchor；
 *     打完的城自动变己方且离军团最近 → 锚点自动前移，保证连续向外推进，不回老家）。
 *
 * 目标选择（A/B 相同）：
 * 1. 候选池 = 锚点每条直连路的最近 1 座敌城（方向池；无回头路检查——打下的城即变己方，
 *    朝老家方向的敌城同样是扩张目标）
 * 2. 沿推进方向优先（<2 万，锚点=老家，军团在前哨）：优先「路径经过军团所在城」的目标
 * 3. 排除绕回老家（≥2 万，锚点=前线城）：排除「路径中段经过老家」的目标
 * 4. 池内有「全图据点最多的势力」的城 → 必打（反雪球，主人 2026-08-05 定，防最强势力滚雪球）
 * 5. 否则池内均匀随机抽一座
 * 6. 池空（锚点直连均无敌城）→ 回退「从锚点出发道路距离最近的敌城」取最近 N 随机
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
    /**
     * 军团当前位置最近城（路网城）。当锚点 = 老家（兵力 < 2 万）且军团已在前哨
     * （刚打完城/在路上）时，方向池优先「从锚点出发的最短路径经过此城」的目标
     * —— 沿当前推进方向继续蚕食，不绕回老家换方向（2026-08-09 方案 L 定稿）。
     * 子集为空（支线尽头无推进目标）时自然回落全池，不剔除不锁死。
     */
    armyStandCityId?: string;
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

        // [2026-08-09 方案 L 定稿] 两段逻辑（只影响方向池抽签，均不剔除、子集空自然回落全池）：
        // ① 沿推进方向优先（锚点 = 老家 <2 万，军团已在前哨）：优先「从锚点出发的最短路径
        //    经过军团所在城」的目标——打完城沿推进方向继续蚕食，不绕回老家换方向。
        //    实测：底比斯打雅典胜后方向池 斯巴达/萨洛尼卡/特洛伊，优先后 100% 斯巴达
        //    （雅典在必经路径上）；斯巴达是支线尽头时子集空 → 自然回落全池（拓扑必然，不锁死）。
        // ② 排除绕回老家（锚点 = 前线城 ≥2 万）：排除「路径中段（不含起点）经过老家」的目标
        //    ——否则打完城可能抽中「先回老家再出去」的方向（实测：雅典为锚点时萨洛尼卡路径
        //    = 雅典→底比斯→萨洛尼卡，~20% 概率绕回老家，排除后 0%）。
        const standCityId = options?.armyStandCityId;
        if (standCityId && standCityId !== anchorCityId && pool.length > 1) {
            const forward: TargetScore[] = [];
            for (const s of pool) {
                const path = roadRegistry.findCityPath(anchorCityId, s.targetId);
                if (path && path.includes(standCityId)) forward.push(s);
            }
            if (forward.length > 0) pool = forward;
        }
        if (anchorCityId !== homeCityId && pool.length > 1) {
            const noHomePass: TargetScore[] = [];
            for (const s of pool) {
                const path = roadRegistry.findCityPath(anchorCityId, s.targetId);
                if (!path || !path.slice(1).includes(homeCityId)) noHomePass.push(s);
            }
            if (noHomePass.length > 0) pool = noHomePass;
        }

        // 枪打出头鸟（反雪球）：候选池（方向池，军团挨着的 2-3 座可选城）里有全图据点最多的势力 → 必打它。
        // [2026-08-05 GAKU 定] 确定性、无门槛：只有挨着的才打，不挨着的不打——方向池里没有领头城，
        // 就不回头（原 anywhere 兜底已删），正常抽签。
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

        // [2026-08-07 简化] 行军惯性已移除（见文件头注释）——方向池均匀随机。
        return pool[Math.floor(Math.random() * pool.length)];
    }

    /**
     * 锚点每条直连边 = 一个方向；该方向取最短路上第一跳经此邻城、且最近的敌城。
     *
     * [2026-08-07 简化] 删除「回头路检查」（旧 0.9 倍判据：目标离老家 ≥ 锚点离老家×0.9 才入池）。
     * 理由：① 锚点=本城（兵力<2万）时它恒不生效（0×0.9=0，任何目标都过）；② 锚点=前线城时
     * 它把「朝老家方向的敌城」滤掉，但方向池被滤空后又回退「全局最近 N」把同样的城选回来，
     * 自相矛盾；③ 打下的城即变己方，朝老家方向的敌城（如雷伊）同样是扩张目标。
     * 干净语义：方向池 = 锚点每条直连路最近的一座敌城，全部入池，均匀随机抽。
     */
    private static buildDirectionalPool(
        anchorCityId: string,
        reachable: TargetScore[],
        _homeCityId: string,
        cities: City[],
    ): TargetScore[] {
        const neighbors = roadRegistry.getConnectedCities(anchorCityId);
        if (neighbors.length === 0) return [];

        const pool: TargetScore[] = [];

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
            pool.push(best);
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
