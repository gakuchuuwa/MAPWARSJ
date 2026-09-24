/**
 * 从路网外的点（战场）出发的一段路：游戏（PlayerQuestSystem）与战场事件编辑器（routeCheck）共用。
 *
 * 🔴 [2026-09-24 主人「推罗战役有问题吗……第一步是不是应该先查看行军路线啊。军团是怎么过来的」]
 *    `roadRegistry.findPathOnRoad` 把起点吸到**离它最近的那座城**。打完伊苏斯从战场开拔去推罗，
 *    最近的是身后的阿达纳（52 公里），而不是去路上的安提俄基亚（61 公里）——
 *    实测军团先往西北退回阿达纳，再掉头经伊苏斯往东，白绕约 100 公里。
 *    这里在最近几座城里挑「走到这座城 + 从它沿路到下一站」总路程最短的那座入路。
 *    起点本来就在城上时，最近那座城就是它自己（多走 0），结果与 findPathOnRoad 相同。
 *
 * 🔴 [2026-09-24 主人报「军团还没有抵达战场，就开始走直线啦」]
 *    `findPathOnRoad` 的**终点**也是吸到「离终点最近的那座城」，然后 append 一条「城 → 终点」的直线。
 *    战场离那座城多远，军团就要直走多远：伊苏斯 62 公里、乌克西亚隘口 58 公里、波斯门 151 公里 ——
 *    可路网里**本来就有路从战场边上过**（伊苏斯 3 公里、乌克西亚 0 公里、波斯门 2 公里），
 *    是「末段吸城」把这条路整个丢掉了。
 *    → 末段超过 `LONG_HOP_KM` 时，改走「**绕到那条路远端那座城**」的走法：整条路落进路径，
 *      再在**这条路上离终点最近的点**下路（阈值 `LEAVE_ROAD_KM`＝15 公里，与运行时
 *      `PlayerQuestSystem.leaveRoadNearest` 同一口径），末段就只剩几公里。
 */
import { roadRegistry } from '../roads/RoadRegistry';

type P = { lat: number; lng: number };

function lenDeg(path: readonly P[]): number {
    let s = 0;
    for (let i = 1; i < path.length; i++) {
        const cos = Math.cos(path[i].lat * Math.PI / 180);
        s += Math.hypot(path[i].lat - path[i - 1].lat, (path[i].lng - path[i - 1].lng) * cos);
    }
    return s;
}

/** 入路候选：最近几座城、多远以内 */
const ENTRY_CANDIDATES = 3;
const ENTRY_MAX_DEG = 2.5;   // 2.5° 覆盖深山/旷野战场（如波斯门距波斯波利斯 151km/1.36°）

/** 末段超过它（公里）才考虑改走法 —— 与编辑器「离路直行」的控制范围 40 公里同一个数 */
const LONG_HOP_KM = 40;
/** 下路阈值（公里）—— 与 `PlayerQuestSystem.leaveRoadNearest` 的 15 公里同一口径 */
const LEAVE_ROAD_KM = 15;
/** 为走这条路，允许整条路径最多比原方案长这么多倍。
 *  🔴 实测（2026-09-24）：乌克西亚隘口那一场，苏萨—波斯波利斯那条山路绕，沿路走到战场 102 公里、
 *     横穿只有 58 公里（1.76 倍）—— 可**史料就是沿这条路走的**（亚历山大自苏萨向波斯波利斯进军，
 *     在隘口被挡住）。宁可多走这段蜿蜒山路，也不要几十公里横穿山岭：取 2.5 倍为上限。 */
const MAX_ROAD_DETOUR = 2.5;

/** 点到线段最近点（返回公里距离与该点） */
function segNearest(p: P, a: P, b: P): { km: number; pt: P } {
    const dx = b.lng - a.lng, dy = b.lat - a.lat;
    const l2 = dx * dx + dy * dy;
    const t = l2 > 0 ? Math.max(0, Math.min(1, ((p.lng - a.lng) * dx + (p.lat - a.lat) * dy) / l2)) : 0;
    const pt = { lat: a.lat + dy * t, lng: a.lng + dx * t };
    return { km: lenDeg([pt, p]) * 111, pt };
}

/** 路径上离目标最近的点（第几段、多远、在哪） */
function nearestPointOnPath(path: readonly P[], to: P): { i: number; km: number; pt: P } | null {
    let best: { i: number; km: number; pt: P } | null = null;
    for (let i = 0; i + 1 < path.length; i++) {
        const n = segNearest(to, path[i], path[i + 1]);
        if (!best || n.km < best.km) best = { i, km: n.km, pt: n.pt };
    }
    return best;
}

/**
 * 「离终点最近的那条路」的两端（各是一个路网节点的坐标）。
 * 用法：绕到远端那座城 → 整条路进路径 → 在这条路上离终点最近的点下路。
 */
function endsOfNearestRoad(to: P): P[] {
    let bestKm = Infinity;
    let ends: P[] = [];
    for (const edges of roadRegistry.getAdjacencyList().values()) {
        for (const e of edges as Array<{ coordinates: [number, number][] }>) {
            const coords = e.coordinates;
            if (!coords || coords.length < 2) continue;
            for (let i = 0; i + 1 < coords.length; i++) {
                const a = { lat: coords[i][1], lng: coords[i][0] };
                const b = { lat: coords[i + 1][1], lng: coords[i + 1][0] };
                const n = segNearest(to, a, b);
                if (n.km < bestKm) {
                    bestKm = n.km;
                    ends = [
                        { lat: coords[0][1], lng: coords[0][0] },
                        { lat: coords[coords.length - 1][1], lng: coords[coords.length - 1][0] },
                    ];
                }
            }
        }
    }
    return ends;
}

/** 绕到「离终点最近那条路」的远端，再在这条路上离终点最近的点下路（末段只剩几公里） */
function tryLeaveRoadNearTarget(from: P, to: P): P[] | null {
    const ends = endsOfNearestRoad(to);
    if (!ends.length) return null;
    let bestAlt: P[] | null = null;
    let bestCost = Infinity;
    for (const end of ends) {
        const leg = roadRegistry.findPathOnRoad(from, end) as P[] | null;
        if (!leg || leg.length < 2) continue;
        const cut = nearestPointOnPath(leg, to);
        if (!cut || cut.km > LEAVE_ROAD_KM) continue;
        const alt = [...leg.slice(0, cut.i + 1), cut.pt, to];
        const cost = lenDeg(alt);
        if (cost < bestCost) { bestCost = cost; bestAlt = alt; }
    }
    return bestAlt;
}

export function findPathFromPoint(from: P, to: P): Array<P & { sea?: boolean }> | null {
    let best = roadRegistry.findPathOnRoad(from, to) as Array<P & { sea?: boolean }> | null;
    let bestCost = best && best.length >= 2 ? lenDeg(best) : Infinity;
    for (const c of roadRegistry.getNearestCityPositions(from.lat, from.lng, ENTRY_CANDIDATES, ENTRY_MAX_DEG)) {
        if (Math.hypot(c.lat - to.lat, c.lng - to.lng) < 0.05) {
            const cost = c.dist;
            if (cost < bestCost - 1e-9) {
                bestCost = cost;
                best = [{ lat: from.lat, lng: from.lng }, { lat: to.lat, lng: to.lng }];
            }
            continue;
        }
        const leg = roadRegistry.findPathOnRoad(c, to) as Array<P & { sea?: boolean }> | null;
        if (!leg || leg.length < 2) continue;
        const cost = c.dist + lenDeg(leg);
        if (cost < bestCost - 1e-9) {
            bestCost = cost;
            best = [{ lat: from.lat, lng: from.lng }, ...leg];
        }
    }

    // 🔴 末段吸城吸得太远（> 40 公里）→ 改走「沿那条离终点最近的路走到边上再下路」
    const hopKm = best && best.length >= 2 ? lenDeg([best[best.length - 2], to]) * 111 : Infinity;
    if (!best || hopKm > LONG_HOP_KM) {
        const alt = tryLeaveRoadNearTarget(from, to);
        if (alt && (!best || lenDeg(alt) <= lenDeg(best) * MAX_ROAD_DETOUR)) return alt;
    }
    return best;
}
