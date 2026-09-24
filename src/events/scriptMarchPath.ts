/**
 * 从路网外的点（战场）出发的一段路：游戏（PlayerQuestSystem）与战场事件编辑器（routeCheck）共用。
 *
 * 🔴 [2026-09-24 主人「推罗战役有问题吗……第一步是不是应该先查看行军路线啊。军团是怎么过来的」]
 *    `roadRegistry.findPathOnRoad` 把起点吸到**离它最近的那座城**。打完伊苏斯从战场开拔去推罗，
 *    最近的是身后的阿达纳（52 公里），而不是去路上的安提俄基亚（61 公里）——
 *    实测军团先往西北退回阿达纳，再掉头经伊苏斯往东，白绕约 100 公里。
 *    这里在最近几座城里挑「走到这座城 + 从它沿路到下一站」总路程最短的那座入路。
 *    起点本来就在城上时，最近那座城就是它自己（多走 0），结果与 findPathOnRoad 相同。
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
    return best;
}
