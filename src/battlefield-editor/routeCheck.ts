/**
 * routeCheck.ts —— 战场事件编辑器的**行军路线检查**（2026-09-23 主人令）
 *
 * 主人原话：「把之前修复的所有错误，要写在编辑器中……让以后的战场事件，不要犯同样的错误，
 *           添加好必选项，就能顺利进行。注意行军路线怎么呈现，点与点之间要控制的范围等。」
 *
 * 用**游戏里同一套寻路**（RoadRegistry.findPathOnRoad，与 PlayerQuestSystem.startMarchToBattlefield
 * 同口径）把这一仗的行军路线逐段算出来，给主人看：每段实际经过哪些城、哪段坐船、多远、绕不绕。
 *
 * 为什么要它（这一轮真犯过的错）：
 *  · 行军路标以前运行时根本没读 → 军团走的是最短路，不是主人设的路（已修运行时）；
 *    编辑器里看得到「实际怎么走」，才知道路标设得够不够。
 *  · 羊河→格拉尼库斯的陆路画过了赫勒斯滂海峡，军团「走」过海峡（已删错路）；
 *    编辑器里标出坐船段，渡海该坐船却没坐船就一眼看得出。
 *  · 特洛伊在路上却没显示：剧本期地图只显示事件用到的城 + 沿途经过的城 → 这里把会显示的城列出来，
 *    主人可逐个核对「这座城那一年在不在、叫不叫这个名字」（如前334年不该有君士坦丁堡）。
 *  · 特殊建筑跟着据点显示 → 一并列出这些城挂的特殊建筑，核对那一年是否已建成。
 */
import { roadRegistry } from '../roads/RoadRegistry';
import { CITIES_V2 } from '../data/cities_v2';
import { getCityAnchoredGeneral } from '../data/CityGeneralBridge';
import { BATTLEFIELDS } from '../data/Battlefields';
import { CITY_WONDER, CITY_WONDER_EXTRA } from '../data/CityWonders';
import { WONDER_NAME } from '../data/WonderNames';

/** 点与点之间的控制范围（超出就提醒加路标） */
export const ROUTE_LIMITS = {
    /** 一段直线距离超过它：中间走哪条路不受控，建议加路标 */
    MAX_LEG_STRAIGHT_KM: 400,
    /** 一段实际路程 / 直线距离超过它：军团在绕远，多半没走史实路线 */
    MAX_DETOUR_RATIO: 1.6,
    /** 最后一段从路网末端直线走到战场，超过它说明战场离路太远 */
    MAX_OFFROAD_KM: 40,
};

export interface RouteDraft {
    type: 'field_battle' | 'siege';
    generalId: string;
    lat: number;
    lng: number;
    marchWaypoints: string[];
    defenderCityId: string;
    bfTargetBattlefieldId: string;
    attackerGeneralId: string;
    defenderGeneralId: string;
    attackerSourceCityId: string;
    defenderSourceCityId: string;
    cityUpdates: Array<{ cityId: string }>;
    bfEventCityId: string;
    /** 途经但那一年还不存在的据点：剧本期不显示 */
    absentCities: string[];
}

export interface RouteLeg {
    from: string;
    to: string;
    ok: boolean;
    roadKm: number;
    straightKm: number;
    seaKm: number;
    /** 沿途经过的城（不含起点） */
    via: string[];
    /** 最后一段走出路网直线到战场的距离 */
    offroadKm: number;
}

export interface RouteReport {
    startCityName: string | null;
    legs: RouteLeg[];
    /** 剧本期地图上会显示的据点（事件用到的 + 沿途经过的） */
    shownCities: Array<{ id: string; name: string; wonders: string[]; absent: boolean }>;
    issues: Array<{ level: 'error' | 'warn'; msg: string }>;
}

type P = { lat: number; lng: number };

const CITY_BY_ID = new Map((CITIES_V2 as Array<{ id: string; name: string; lat: number; lng: number }>)
    .map((c) => [c.id, c]));
const cityAt = new Map<string, string>();
for (const c of CITY_BY_ID.values()) cityAt.set(`${c.lat.toFixed(4)},${c.lng.toFixed(4)}`, c.id);

let generalCity: Map<string, string> | null = null;
function cityOfGeneral(gid: string): string | undefined {
    if (!generalCity) {
        generalCity = new Map();
        for (const c of CITY_BY_ID.values()) {
            const g = getCityAnchoredGeneral(c.id);
            if (g && !generalCity.has(g.generalId)) generalCity.set(g.generalId, c.id);
        }
    }
    return generalCity.get(gid);
}

function ensureRoads(): void {
    if (!roadRegistry.isInitialized()) roadRegistry.initialize(CITIES_V2 as unknown as unknown[]);
}

function km(a: P, b: P): number {
    const R = 6371, r = Math.PI / 180;
    const h = Math.sin((b.lat - a.lat) * r / 2) ** 2
        + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin((b.lng - a.lng) * r / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function wondersOf(cityId: string): string[] {
    const out: string[] = [];
    const main = (CITY_WONDER as Record<string, string>)[cityId];
    if (main) out.push(WONDER_NAME[main] ?? main);
    for (const ex of (CITY_WONDER_EXTRA as Record<string, Array<{ name: string }>>)[cityId] ?? []) out.push(ex.name);
    return out;
}

export function checkRoute(d: RouteDraft): RouteReport {
    ensureRoads();
    const issues: RouteReport['issues'] = [];
    const err = (msg: string) => issues.push({ level: 'error', msg });
    const warn = (msg: string) => issues.push({ level: 'warn', msg });
    const legs: RouteLeg[] = [];
    const shown = new Set<string>();
    const add = (id?: string) => { if (id && CITY_BY_ID.has(id)) shown.add(id); };

    // 运行时：军团从**归属武将所在的城**起兵出发（不是「攻方出兵据点」那一栏）
    const startId = d.generalId ? cityOfGeneral(d.generalId) : undefined;
    const start = startId ? CITY_BY_ID.get(startId) : undefined;
    const ownSource = d.generalId === d.attackerGeneralId ? d.attackerSourceCityId
        : d.generalId === d.defenderGeneralId ? d.defenderSourceCityId : '';
    if (start && ownSource && ownSource !== start.id) {
        warn(`军团实际从归属武将所在的【${start.name}】出发，出兵据点一栏写的是【${CITY_BY_ID.get(ownSource)?.name ?? ownSource}】，两处不一致，请确认`);
    }

    // 终点：攻城打据点 = 那座城；野战 / 战场要塞 = 战场坐标
    const siegeCity = d.type === 'siege' && !d.bfTargetBattlefieldId ? CITY_BY_ID.get(d.defenderCityId) : undefined;
    const fortress = d.bfTargetBattlefieldId ? BATTLEFIELDS.find((b) => b.id === d.bfTargetBattlefieldId) : undefined;
    const end: P = siegeCity ? { lat: siegeCity.lat, lng: siegeCity.lng }
        : fortress ? { lat: fortress.lat, lng: fortress.lng }
            : { lat: d.lat, lng: d.lng };
    const endName = siegeCity?.name ?? '战场';

    // 事件用到的城（与游戏 ScriptCityVisibility 同口径）
    for (const gid of [d.generalId, d.attackerGeneralId, d.defenderGeneralId]) if (gid) add(cityOfGeneral(gid));
    add(d.attackerSourceCityId); add(d.defenderSourceCityId); add(d.defenderCityId); add(d.bfEventCityId);
    for (const wp of d.marchWaypoints) add(wp);
    for (const u of d.cityUpdates) add(u.cityId);

    if (!start) {
        err('找不到归属武将所在的城 → 算不出行军路线（归属武将必须是某座据点的守将）');
    } else {
        const stops: Array<{ name: string; p: P }> = [{ name: start.name, p: { lat: start.lat, lng: start.lng } }];
        for (const wp of d.marchWaypoints) {
            const c = CITY_BY_ID.get(wp);
            if (c) stops.push({ name: c.name, p: { lat: c.lat, lng: c.lng } });
        }
        stops.push({ name: endName, p: end });

        for (let i = 0; i + 1 < stops.length; i++) {
            const a = stops[i], b = stops[i + 1];
            const isLast = i + 1 === stops.length - 1;
            let path = roadRegistry.findPathOnRoad(a.p, b.p) as Array<P & { sea?: boolean }> | null;
            let offroadKm = 0;
            if ((!path || path.length < 2) && isLast) {
                // 与运行时同一套兜底：沿路网到最近那座城，最后一段直奔战场
                const anchor = roadRegistry.getNearestCityPos(b.p.lat, b.p.lng, 5);
                const via = anchor ? roadRegistry.findPathOnRoad(a.p, anchor) as Array<P & { sea?: boolean }> | null : null;
                if (via && via.length >= 2 && anchor) {
                    path = [...via, b.p];
                    offroadKm = km(anchor, b.p);
                }
            }
            const straightKm = km(a.p, b.p);
            if (!path || path.length < 2) {
                legs.push({ from: a.name, to: b.name, ok: false, roadKm: 0, straightKm, seaKm: 0, via: [], offroadKm: 0 });
                err(`【${a.name}】→【${b.name}】无路可达：军团走不过去，这一仗触发不了（换路标，或请主人补路）`);
                continue;
            }
            let roadKm = 0, seaKm = 0;
            const via: string[] = [];
            for (let k = 1; k < path.length; k++) {
                const seg = km(path[k - 1], path[k]);
                roadKm += seg;
                if (path[k].sea) seaKm += seg;
                const cid = cityAt.get(`${path[k].lat.toFixed(4)},${path[k].lng.toFixed(4)}`);
                if (cid) {
                    shown.add(cid);
                    const nm = CITY_BY_ID.get(cid)!.name;
                    if (via[via.length - 1] !== nm) via.push(nm);
                }
            }
            legs.push({ from: a.name, to: b.name, ok: true, roadKm, straightKm, seaKm, via, offroadKm });
            if (straightKm > ROUTE_LIMITS.MAX_LEG_STRAIGHT_KM) {
                warn(`【${a.name}】→【${b.name}】直线 ${Math.round(straightKm)} 公里，超过 ${ROUTE_LIMITS.MAX_LEG_STRAIGHT_KM} 公里：中间走哪条路不受控，建议加路标`);
            }
            if (straightKm > 20 && roadKm / straightKm > ROUTE_LIMITS.MAX_DETOUR_RATIO) {
                warn(`【${a.name}】→【${b.name}】实际路程 ${Math.round(roadKm)} 公里，是直线的 ${(roadKm / straightKm).toFixed(1)} 倍：军团在绕远，多半没走史实路线，请在中间加路标`);
            }
            if (offroadKm > ROUTE_LIMITS.MAX_OFFROAD_KM) {
                warn(`最后一段要离开道路直线走 ${Math.round(offroadKm)} 公里才到战场：战场离路太远，请核对坐标或加路标`);
            }
        }
    }

    const shownCities = [...shown].map((id) => ({
        id, name: CITY_BY_ID.get(id)!.name, wonders: wondersOf(id), absent: d.absentCities.includes(id),
    }));
    return { startCityName: start?.name ?? null, legs, shownCities, issues };
}
