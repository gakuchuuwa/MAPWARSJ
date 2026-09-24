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
import { LandSeaSystem } from '../world/land-sea';

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
/**
 * 🔴 [2026-09-25 主人令「先做甲」＝放宽入路半径] 2.5° → 3.0°。
 *   来由：第 16 场（前324 冬 科塞亚战役）的出发地＝上一场落点「马里斯」（木尔坦 30.198,71.468），
 *   实测该点离最近的**有路**据点拉合尔 **313 公里＝2.83°**，正好超出原来的 2.5°，于是「马里斯 → 任何一站」
 *   都铺不出路 → 编辑器报硬红「无路可达：军团走不过去，这一仗触发不了」（save 被置灰）。
 *   放到 3.0°（≈333 公里）后，军团可先直行到最近的路网城再沿路走 —— 与**终点**那一套兜底同一做法
 *   （`tryLeaveRoadNearTarget` / 编辑器 `buildLeg` 的 allowFallback）。
 *   影响面：入路候选是**按「到候选城的距离 + 沿路到终点」取最省**，只在原来一座候选都取不到（＝铺不出路）时
 *   才起作用；现有各场起点都在路网内或 2.5° 内，实测路线与提示数一格未变（见 scratch/_probe_route_all_legs.mjs）。
 */
const ENTRY_MAX_DEG = 3.0;

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

/**
 * 🔴 [2026-09-24 主人报「从格拉尼库斯战场返回特洛伊的时候，会出现舰队」]
 *    入路那段是**不走路的直线**（起点 → 候选城）。实测格拉尼库斯阵位 → 羊河那条直线横跨赫勒斯滂 45 公里，
 *    再坐「羊河-特洛伊」海路回到亚洲一侧 —— 只因总长比「走 14 公里到格拉尼库斯城、再陆路到特洛伊」短一两公里就被选中。
 *    AGENTS「渡海必须坐船：陆路不得画过海面」→ 入路直线穿过海面的候选一律不要。
 *    判据：沿线约每 2 公里采一次海陆（LandSeaSystem.isSeaAt）；瓦片没到时 isSeaAt 回 false（当陆），
 *    只会少挡、不会误挡，与改前行为一致。
 */
function straightCrossesSea(a: P, b: P): boolean {
    const km = lenDeg([a, b]) * 111;
    const n = Math.max(1, Math.ceil(km / 2));
    let sea = 0;
    for (let i = 1; i < n; i++) {
        const t = i / n;
        if (LandSeaSystem.isSeaAt({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t })) {
            if (++sea >= 2) return true;   // 连一个像素的河口都算就太严：至少两个采样点落海
        }
    }
    return false;
}

/**
 * 预先拉取「从 from 入路」那几条直线上的海陆瓦片（isSeaAt 查不到会后台排队下载）。
 * 军团抵达战场阵位时调用：一场仗打完再开拔，入路判定（straightCrossesSea）就有瓦片可用，
 * 不会因为瓦片没到而把横跨海峡的那条当成陆地。
 */
export function prefetchEntrySea(from: P): void {
    for (const c of roadRegistry.getNearestCityPositions(from.lat, from.lng, ENTRY_CANDIDATES, ENTRY_MAX_DEG)) {
        straightCrossesSea(from, c);
    }
}

export function findPathFromPoint(from: P, to: P): Array<P & { sea?: boolean }> | null {
    let best = roadRegistry.findPathOnRoad(from, to) as Array<P & { sea?: boolean }> | null;
    if (best && best.length >= 2 && straightCrossesSea(from, best[1])) best = null;
    let bestCost = best && best.length >= 2 ? lenDeg(best) : Infinity;
    for (const c of roadRegistry.getNearestCityPositions(from.lat, from.lng, ENTRY_CANDIDATES, ENTRY_MAX_DEG)) {
        if (straightCrossesSea(from, c)) continue;   // 入路直线不许横穿海面
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

// ════════════════════════════════════════════════════════════════════════════
// 🔴 [2026-09-25 主人「不然我连线干什么，你能不能一步到位」] 沿主人画的战场支线开进战场
//
//   战场连了路（或归为一点并入了某座城）→ 军团**沿路网一直走向战场节点**，
//   在离战场 BATTLE_STAND_KM（沿路量）处停下，那一点就是本方阵位；对手阵位隔着战场与之对称
//   （见 HistoricalEventManager.startBattlefieldBattle）。游戏与战场事件编辑器共用这里。
//   没连路的战场照旧走 findPathFromPoint（兜底）。
// ════════════════════════════════════════════════════════════════════════════

/** 阵位离战场（沿路）多少公里 —— 与原先固定对阵位 BATTLE_OFFSET 0.14°（约 12–15 公里）同一量级 */
export const BATTLE_STAND_KM = 15;

/** 战场在路网里的节点：归为一点的 → 那座城；独立且连了路的 → 战场自己；没连路 → null */
export function battlefieldRoadNode(bfId: string): { id: string; lat: number; lng: number } | null {
    const id = roadRegistry.resolveNodeId(bfId);
    if (!roadRegistry.isNodeConnected(id)) return null;
    const pos = roadRegistry.getNodePos(id);
    return pos ? { id, ...pos } : null;
}

/**
 * 从 from 沿路网走到战场节点的整条路。入口在附近已接入路网的节点里挑（城与连了路的战场都算，
 * 上一场的阵位就在上一处战场的支线上），取「直线走到入口 + 沿路到战场」总长最短、且入口直线不跨海的那个。
 */
export function findPathToBattlefield(from: P, bfId: string): Array<P & { sea?: boolean }> | null {
    const node = battlefieldRoadNode(bfId);
    if (!node) return null;
    let best: Array<P & { sea?: boolean }> | null = null;
    let bestCost = Infinity;
    for (const c of roadRegistry.getNearestRoadNodes(from.lat, from.lng, ENTRY_CANDIDATES + 1, ENTRY_MAX_DEG)) {
        if (c.dist * 111 > 0.5 && straightCrossesSea(from, c)) continue;
        let leg: Array<P & { sea?: boolean }>;
        if (c.id === node.id) {
            leg = [{ lat: c.lat, lng: c.lng }];
        } else {
            const r = roadRegistry.findPath(c.id, node.id);
            if (!r) continue;
            leg = roadRegistry.pathToLatLngs(r);
        }
        const cost = c.dist + lenDeg(leg);
        if (cost < bestCost - 1e-9) {
            bestCost = cost;
            const head = leg[0];
            best = head && Math.hypot(head.lat - from.lat, head.lng - from.lng) < 1e-6
                ? [{ lat: from.lat, lng: from.lng }, ...leg.slice(1)]
                : [{ lat: from.lat, lng: from.lng }, ...leg];
        }
    }
    return best && best.length >= 2 ? best : null;
}

/**
 * 把一条通往战场的路截到「离终点沿路 standKm」处：返回截后的路与阵位点。
 * 路本身不够长（出发点就在战场跟前）→ 阵位 = 出发点。
 */
export function cutPathBeforeEnd<T extends P>(path: readonly T[], standKm: number): { path: T[]; stand: P } {
    let remain = standKm;
    for (let i = path.length - 1; i > 0; i--) {
        const seg = lenDeg([path[i - 1], path[i]]) * 111;
        if (seg >= remain) {
            const t = seg > 0 ? (seg - remain) / seg : 0;   // 从 i-1 往 i 走 t
            const a = path[i - 1], b = path[i];
            const stand = { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
            return { path: [...path.slice(0, i), { ...b, ...stand } as T], stand };
        }
        remain -= seg;
    }
    const s0 = path[0];
    return { path: [s0], stand: { lat: s0.lat, lng: s0.lng } };
}
