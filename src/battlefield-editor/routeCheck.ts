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
import { findPathFromPoint } from '../events/scriptMarchPath';
import { cityAbsentReason } from '../events/cityInYear';
import { CITIES_V2 } from '../data/cities_v2';
import { getCityAnchoredGeneral } from '../data/CityGeneralBridge';
import { BATTLEFIELDS } from '../data/Battlefields';
import { CITY_WONDER, CITY_WONDER_EXTRA } from '../data/CityWonders';
import { WONDER_NAME } from '../data/WonderNames';
import { HISTORICAL_EVENT_SCRIPT, resolveEventBattlefieldId } from '../data/HistoricalEventScript';
import { getGeneralEra, type GeneralEra } from '../data/GeneralEra';
import { CITY_FOUNDED_YEAR } from '../data/cityFoundedYears';

const ERA_ORDER: GeneralEra[] = ['antiquity', 'feudal', 'castle', 'imperial'];
const ERA_NAME: Record<GeneralEra, string> = {
    antiquity: '古典', feudal: '封建', castle: '城堡', imperial: '帝国',
};
function eraOfYear(year: number): GeneralEra {
    if (year < 400) return 'antiquity';
    if (year < 1050) return 'feudal';
    if (year < 1500) return 'castle';
    return 'imperial';
}

/**
 * 🔴 [2026-09-24 主人定「不光是阿卡，**所有的据点都应该按年代才能显示**，尤其是大城、中城、关隘」]
 * 年代闸门 —— 与游戏 `ScriptCityVisibility.compute` **同一套口径**：建立年代 + 归属武将时代，两道都要过。
 * 没过闸的城那年不上图（**路照走**，只是不画）。编辑器必须照实报，否则这一栏会让主人以为会上图。
 */
export function eraGateReason(cityId: string, year: number | undefined): string | null {
    if (year === undefined || !CITY_BY_ID.get(cityId)) return null;
    return cityAbsentReason(cityId, year);   // 与游戏同一个判据（src/events/cityInYear.ts）
}

/** 点与点之间的控制范围（超出就提醒加路标） */
export const ROUTE_LIMITS = {
    /** 一段直线距离超过它：中间走哪条路不受控，建议加路标 */
    MAX_LEG_STRAIGHT_KM: 400,
    /** 一段实际路程 / 直线距离超过它：军团在绕远，多半没走史实路线 */
    MAX_DETOUR_RATIO: 1.6,
    /** 最后一段从路网末端直线走到战场，超过它说明战场离路太远 */
    MAX_OFFROAD_KM: 40,
    /** 非最后一段贴到被攻据点这么近：说明军团先到了目标又走开，路标设在了目标之外 */
    OVERSHOOT_KM: 15,
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
    /** 军团出发据点（空 = 归属武将本城） */
    startCityId: string;
    /** 事件年代（用来找「同一武将上一场」，算连续行军那一段；编辑器草稿自带） */
    year?: number;
    season?: number;
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
    /** 这一段是「上一处战场 → 本场」的连续行军段（剧本期军团不经过出发据点） */
    continuation?: boolean;
}

export interface RouteReport {
    startCityName: string | null;
    /** 第二场起：从上一场战场继续行军（不经出发据点） */
    fromPrevBattlefield?: boolean;
    legs: RouteLeg[];
    /** 剧本期地图上会显示的据点（事件用到的 + 沿途经过的） */
    shownCities: Array<{ id: string; name: string; wonders: string[]; absent: boolean; eraBlocked?: string }>;
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

/** 这一场打完，军团**留在哪里**（= 下一场的起点）：攻城战 = 被攻的城 / 战场要塞，野战 = 战场坐标 */
function eventEndPoint(ev: (typeof HISTORICAL_EVENT_SCRIPT)[number]): P | null {
    const sd = ev.type === 'siege' ? (ev.siegeData as { defenderCityId?: string } | undefined) : undefined;
    if (sd?.defenderCityId) {
        const c = CITY_BY_ID.get(sd.defenderCityId);
        if (c) return { lat: c.lat, lng: c.lng };
    }
    const bfId = resolveEventBattlefieldId(ev, (id) => {
        const c = CITY_BY_ID.get(id);
        return c ? { lat: c.lat, lng: c.lng } : undefined;
    });
    const bf = bfId ? BATTLEFIELDS.find((b) => b.id === bfId) : undefined;
    return bf ? { lat: bf.lat, lng: bf.lng } : null;
}

/** 同一武将、比本场早的那一场（= 军团此刻所站之处） */
function previousEventOfSameGeneral(generalId: string, year?: number, season?: number) {
    if (!generalId || year === undefined) return null;
    const s = season ?? 0;
    return [...HISTORICAL_EVENT_SCRIPT]
        .filter((e) => e.generalId === generalId && (e.year < year || (e.year === year && (e.season ?? 0) < s)))
        .sort((a, b) => (b.year - a.year) || ((b.season ?? 0) - (a.season ?? 0)))[0] ?? null;
}

/**
 * 这一段路是不是**先到了目标跟前、又走开了**（折返）。
 *
 * 判据只有一条：离终点最近的那一点**不在路径末尾**。
 * 收尾那一段的最后一点本来就是终点（距离 0），所以判据必须在「最近点**不在末尾**」上，
 * 否则每一段正常的收尾路都会被误判成折返（血训：刚加上这条时连续行军段当场误报）。
 */
function passesTerminusEarly(path: P[], end: P): { nearest: number; early: boolean } {
    let nearest = Infinity, at = -1;
    for (let i = 0; i < path.length; i++) {
        const d = km(path[i], end);
        if (d < nearest) { nearest = d; at = i; }
    }
    return { nearest, early: nearest <= ROUTE_LIMITS.OVERSHOOT_KM && at < path.length - 1 };
}

export function checkRoute(d: RouteDraft): RouteReport {
    ensureRoads();
    const issues: RouteReport['issues'] = [];
    const err = (msg: string) => issues.push({ level: 'error', msg });
    const warn = (msg: string) => issues.push({ level: 'warn', msg });
    const legs: RouteLeg[] = [];
    const shown = new Set<string>();
    const add = (id?: string) => { if (id && CITY_BY_ID.has(id)) shown.add(id); };

    // 🔴 [2026-09-24 主人「为什么不是第二事件战场，到第三事件战场？」「没有具体的线路，就用地图中的道路」]
    //    同一武将从第二场起：军团从**上一场的战场**沿地图道路开到这一场（与游戏连续行军一致），不经过任何出发据点。
    //    只有他的第一场，才从他所在的城出发。
    const prevEvForStart = previousEventOfSameGeneral(d.generalId, d.year, d.season);
    const prevEndForStart = prevEvForStart ? eventEndPoint(prevEvForStart) : null;
    const fromPrevBattlefield = !!prevEndForStart;
    // 第一场：军团从**归属武将所在的城**起兵出发（不是「攻方出兵据点」那一栏）
    const startId = d.startCityId || (d.generalId ? cityOfGeneral(d.generalId) : undefined);
    const start = startId ? CITY_BY_ID.get(startId) : undefined;
    const ownSource = d.generalId === d.attackerGeneralId ? d.attackerSourceCityId
        : d.generalId === d.defenderGeneralId ? d.defenderSourceCityId : '';
    if (!fromPrevBattlefield && start && ownSource && ownSource !== start.id && !d.startCityId) {
        warn(`军团实际从归属武将所在的【${start.name}】出发，出兵据点一栏写的是【${CITY_BY_ID.get(ownSource)?.name ?? ownSource}】，两处不一致，请确认`);
    }

    // 终点：攻城打据点 = 那座城；野战 / 战场要塞 = 战场坐标
    const siegeCity = d.type === 'siege' && !d.bfTargetBattlefieldId ? CITY_BY_ID.get(d.defenderCityId) : undefined;
    const fortress = d.bfTargetBattlefieldId ? BATTLEFIELDS.find((b) => b.id === d.bfTargetBattlefieldId) : undefined;
    const end: P = siegeCity ? { lat: siegeCity.lat, lng: siegeCity.lng }
        : fortress ? { lat: fortress.lat, lng: fortress.lng }
            : { lat: d.lat, lng: d.lng };
    const endName = siegeCity?.name ?? '战场';

    /**
     * 一段路：沿路网走；到不了又允许兜底时，走**与运行时同一套**兜底
     * （`PlayerQuestSystem.startMarchToBattlefield`）—— 先沿路网到最近那座城，最后一段直奔目的地。
     * 战场常常不在路网上（波斯门深在扎格罗斯山里），不兜底就会把「离路直行 151 公里」误报成「无路可达」。
     */
    const buildLeg = (from: P, to: P, allowFallback: boolean) => {
        // 与游戏同一个入路算法（scriptMarchPath.findPathFromPoint）：从战场开拔不吸到身后那座城
        let path = findPathFromPoint(from, to) as Array<P & { sea?: boolean }> | null;
        let offroadKm = 0;
        if ((!path || path.length < 2) && allowFallback) {
            const anchor = roadRegistry.getNearestCityPos(to.lat, to.lng, 5);
            const via = anchor ? findPathFromPoint(from, anchor) as Array<P & { sea?: boolean }> | null : null;
            if (via && via.length >= 2 && anchor) {
                path = [...via, to];
                offroadKm = km(anchor, to);
            }
        }
        return { path, offroadKm };
    };

    // 事件用到的城（与游戏 ScriptCityVisibility 同口径）
    for (const gid of [d.generalId, d.attackerGeneralId, d.defenderGeneralId]) if (gid) add(cityOfGeneral(gid));
    add(d.attackerSourceCityId); add(d.defenderSourceCityId); add(d.defenderCityId); add(d.bfEventCityId);
    for (const wp of d.marchWaypoints) add(wp);
    for (const u of d.cityUpdates) add(u.cityId);

    if (!start && !fromPrevBattlefield) {
        err('找不到归属武将所在的城 → 算不出行军路线（归属武将必须是某座据点的守将）');
    } else {
        const prevName = prevEvForStart
            ? `上一场战场（${(prevEvForStart.title ?? `${prevEvForStart.year}年那一场`).replace(/^公元前\d+年\s*/, '')}）` : '';
        const stops: Array<{ name: string; p: P }> = fromPrevBattlefield
            ? [{ name: prevName, p: prevEndForStart! }]
            : [{ name: start!.name, p: { lat: start!.lat, lng: start!.lng } }];
        for (const wp of d.marchWaypoints) {
            const c = CITY_BY_ID.get(wp);
            if (c) stops.push({ name: c.name, p: { lat: c.lat, lng: c.lng } });
        }
        stops.push({ name: endName, p: end });

        for (let i = 0; i + 1 < stops.length; i++) {
            const a = stops[i], b = stops[i + 1];
            const isLast = i + 1 === stops.length - 1;
            // 出发点又当路标用（军团出发据点那一段本来就要经过它）→ 这一段长度为零，跳过。
            // 不跳过会去问「同一个点怎么走」，寻路返回 null，编辑器当场报「无路可达」把这一场挡住。
            if (km(a.p, b.p) < 0.5) continue;
            const built = buildLeg(a.p, b.p, isLast);
            let path = built.path;
            const offroadKm = built.offroadKm;
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
            // 🔴 路标设在**目标之外**：军团先贴着被攻据点过去、再走一段、然后折返回来攻城。
            //    血训（2026-09-23 前332 推罗）：航点写的是阿卡，而阿卡在推罗**以南** 39 公里 ——
            //    军团沿海岸南下先到推罗跟前，再走到阿卡，再掉头 39 公里回来围城。
            //    史实是亚历山大**自北面的西顿**南下围推罗，压根没往南绕过。
            if (siegeCity) {
                const t = passesTerminusEarly(path, end);
                if (t.early) {
                    warn(`【${a.name}】→【${b.name}】这一段会先贴着被攻据点【${siegeCity.name}】（最近 ${Math.round(t.nearest)} 公里）经过，再折回来攻城：路标设在了目标之外，请挪到**来路一侧**`);
                }
            }
        }

        // ── 连续行军那一段：**上一处战场 → 本场第一个落脚点** ────────────────
        // 🔴 2026-09-23 血训（前332 推罗战役）：上面每一段都是从「军团出发据点」起算的，
        //    可剧本期主角的军团打完上一场是**就地继续开拔**（见 PlayerQuestSystem.continueScriptCampaign
        //    与 AGENTS §三.1「从上一处战场继续行军」），起点是**上一处战场**，根本不经过出发据点。
        //    于是「第二场 → 第三场」真正要走的那一段，编辑器里一行都看不到：
        //    推罗那一场第一段实测 588 公里（直线 437 > 400），编辑器却报「无问题」。
        //    故这一段也算出来、按同三条控制范围提示（只提示，不挡保存）。
        // 第二场起路线本身就从上一场战场算起（见函数开头），这里不再另算一条
        const prevEv = fromPrevBattlefield ? null : previousEventOfSameGeneral(d.generalId, d.year, d.season);
        const prevEnd = prevEv ? eventEndPoint(prevEv) : null;
        if (prevEv && prevEnd) {
            const first = stops[1] ?? stops[stops.length - 1];
            if (km(prevEnd, first.p) >= 0.5) {
                const straightKm = km(prevEnd, first.p);
                const fromName = `上一场打完处（${(prevEv.title ?? `${prevEv.year}年那一场`).replace(/^公元前\d+年\s*/, '')}）`;
                // 目的地就是终点（本场没写航点）时，允许与运行时同一套「到最近那座城再直奔」兜底
                const isTerminus = first === stops[stops.length - 1];
                const built = buildLeg(prevEnd, first.p, isTerminus);
                const path = built.path;
                if (!path || path.length < 2) {
                    legs.push({ from: fromName, to: first.name, ok: false, roadKm: 0, straightKm, seaKm: 0, via: [], offroadKm: 0, continuation: true });
                    warn(`连续行军第一段【${fromName}】→【${first.name}】无路可达：军团从上一处战场开拔会走不过去`);
                } else {
                    let roadKm = 0, seaKm = 0;
                    const via: string[] = [];
                    for (let k = 1; k < path.length; k++) {
                        const seg = km(path[k - 1], path[k]);
                        roadKm += seg;
                        if (path[k].sea) seaKm += seg;
                        const cid = cityAt.get(`${path[k].lat.toFixed(4)},${path[k].lng.toFixed(4)}`);
                        if (cid) {
                            const nm = CITY_BY_ID.get(cid)!.name;
                            if (via[via.length - 1] !== nm) via.push(nm);
                        }
                    }
                    legs.push({ from: fromName, to: first.name, ok: true, roadKm, straightKm, seaKm, via, offroadKm: built.offroadKm, continuation: true });
                    if (straightKm > ROUTE_LIMITS.MAX_LEG_STRAIGHT_KM) {
                        warn(`连续行军第一段【${fromName}】→【${first.name}】直线 ${Math.round(straightKm)} 公里，超过 ${ROUTE_LIMITS.MAX_LEG_STRAIGHT_KM} 公里：军团从上一处战场开拔时中间走哪条路不受控，请在【${first.name}】之前加路标`);
                    }
                    if (straightKm > 20 && roadKm / straightKm > ROUTE_LIMITS.MAX_DETOUR_RATIO) {
                        warn(`连续行军第一段【${fromName}】→【${first.name}】实际 ${Math.round(roadKm)} 公里，是直线的 ${(roadKm / straightKm).toFixed(1)} 倍：在绕远，请在中间加路标`);
                    }
                    if (built.offroadKm > ROUTE_LIMITS.MAX_OFFROAD_KM) {
                        warn(`连续行军第一段要离开道路直线走 ${Math.round(built.offroadKm)} 公里才到终点：终点离路太远，请核对坐标或加路标`);
                    }
                    if (siegeCity) {
                        const t = passesTerminusEarly(path, end);
                        if (t.early) {
                            warn(`连续行军第一段会先贴着被攻据点【${siegeCity.name}】（最近 ${Math.round(t.nearest)} 公里）经过，再折回来攻城：路标设在了目标之外，请挪到**来路一侧**`);
                        }
                    }
                }
            }
        }
    }

    const shownCities = [...shown].map((id) => ({
        id, name: CITY_BY_ID.get(id)!.name, wonders: wondersOf(id), absent: d.absentCities.includes(id),
        eraBlocked: eraGateReason(id, d.year) ?? undefined,
    }));
    return { startCityName: fromPrevBattlefield ? `上一场${(prevEvForStart!.title ?? '').replace(/^公元前\d+年\s*/, '')}的战场` : start?.name ?? null, fromPrevBattlefield, legs, shownCities, issues };
}
