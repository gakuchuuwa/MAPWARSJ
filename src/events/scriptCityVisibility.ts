/**
 * 剧本期据点显示 —— 🔴 [2026-09-23 主人定]
 *
 * 主人原话：「现在的问题不光是君士坦丁堡，还有很多其他的据点」→ 定案「累积显示 + 时代分层」：
 *   剧本进行时，地图上显示「当前事件所处时代及之前」的全部据点 + 事件用到的据点；
 *   🔴 [2026-09-23 主人补「先把古典据点都放出来，到了封建显示下一批」]——开局别只显示事件用到的几十个城，
 *   古典时代早就存在的雅典、巴比伦等古城该在图上；后续时代随剧本推进再放开。
 *   剧本全部结束、转入乱斗后，全部据点恢复显示。
 *
 * 不给据点加任何字段（主人问「是不是应该先给所有的据点添加一个显示属性」→ 不需要）：
 *   哪些城显示，直接从事件数据算出来，据点数据一个不动。**只是不显示**，
 *   据点本身照旧存在（寻路、归属、战斗一概不受影响）。
 *
 * 一场事件用到的据点：
 *   · 这场仗归属的武将所在的城（玩家先去那里找他）、双方主帅所在的城；
 *   · 攻 / 守方出兵城、攻城战打的城；
 *   · 行军路标 `marchWaypoints`；
 *   · 战后易主的城 `cityUpdates`；战场记录上的 `eventCityId`；
 *   · 🔴 [2026-09-23 主人问「特洛伊也关闭啦？」] **军团沿路实际经过的城**
 *     （出发城 → 各路标 → 战场，按道路网寻路；如羊河坐船到特洛伊再沿海岸去格拉尼库斯）。
 *
 * 显示范围 = 已打过的事件 + 当前这一场（按年代排序第一场没打过的）。
 */
import type { City, HistoricalEvent } from '../types/core';
import { HISTORICAL_EVENT_SCRIPT, resolveEventBattlefieldId } from '../data/HistoricalEventScript';
import { BATTLEFIELDS } from '../data/Battlefields';
import { findEventSite } from '../data/eventSites';
import { getCityAnchoredGeneral } from '../data/CityGeneralBridge';
import { getGeneralEra, type GeneralEra } from '../data/GeneralEra';
import { CITY_FOUNDED_YEAR } from '../data/cityFoundedYears';
import { isBattlefieldFought } from './battlefieldState';
import { resolveEventStartCityId, type StartEventInfo, type StartCity } from './scriptEventStart';
import { cityExistsInYear } from './cityInYear';
import { roadRegistry } from '../roads/RoadRegistry';

/** 年份 → 时代（四时代：古典 起始~400 / 封建 400~1050 / 城堡 1050~1500 / 帝国 1500~1900） */
function eraOfYear(year: number): GeneralEra {
    if (year < 400) return 'antiquity';
    if (year < 1050) return 'feudal';
    if (year < 1500) return 'castle';
    return 'imperial';
}
const ERA_ORDER: GeneralEra[] = ['antiquity', 'feudal', 'castle', 'imperial'];

export class ScriptCityVisibility {
    private cached: Set<string> | null = null;
    /** 剧本期可见的战场：已打过的 + 当前这一场（主人：「该显示的战场显示，不该显示的不能显示」） */
    private cachedBattlefields: Set<string> | null = null;
    /** 上次计算时道路网还没建好（没算沿途经过的城） */
    private routeless = false;
    /** 当前这一场（按年代第一场没打过的）；全部打完 = null */
    private currentEv: HistoricalEvent | null = null;
    private currentComputed = false;

    constructor(
        private readonly getCities: () => City[],
        /** true = 历史剧本期（此时才过滤据点） */
        private readonly isScriptPeriod: () => boolean,
    ) {}

    /** 事件进度变了（有战场打完）时调用，下次查询重算 */
    public invalidate(): void {
        this.cached = null;
        this.cachedBattlefields = null;
        this.currentComputed = false;
    }

    /** 当前这一场历史事件（剧本军团、出生地等用）；剧本已全部打完 → null */
    public getCurrentEvent(): HistoricalEvent | null {
        if (!this.currentComputed) this.compute();
        return this.currentEv;
    }

    public isCityVisible(city: City): boolean {
        if (!this.isScriptPeriod()) return true;
        // 道路网没建好时算不出沿途经过的城 → 先按不含沿途的结果显示，建好后重算一次
        if (!this.cached || (this.routeless && roadRegistry.isInitialized())) this.compute();
        return this.cached!.has(city.id);
    }

    /** 🔴 [2026-09-23 主人定] 剧本期只显示已打过的战场与当前这一场；乱斗模式全部显示 */
    public isBattlefieldVisible(bfId: string): boolean {
        if (!this.isScriptPeriod()) return true;
        if (!this.cachedBattlefields) this.compute();
        return this.cachedBattlefields!.has(bfId);
    }

    private compute(): void {
        const cities = this.getCities();
        const pos = new Map(cities.map((c) => [c.id, { lat: c.latitude, lng: c.longitude }]));
        const cityPos = (id: string) => pos.get(id);
        // 武将 → 所在城（据点守将）
        const cityOfGeneral = new Map<string, string>();
        for (const c of cities) {
            const g = getCityAnchoredGeneral(c.id);
            if (g && !cityOfGeneral.has(g.generalId)) cityOfGeneral.set(g.generalId, c.id);
        }

        const out = new Set<string>();
        const bfs = new Set<string>();
        let current: HistoricalEvent | null = null;
        const routeReady = roadRegistry.isInitialized();
        // 坐标 → 城（道路网的路径点在城的位置上正好就是城坐标）
        const cityAt = new Map<string, string>();
        for (const c of cities) cityAt.set(`${c.latitude.toFixed(4)},${c.longitude.toFixed(4)}`, c.id);
        const events = [...HISTORICAL_EVENT_SCRIPT]
            .sort((a, b) => a.year - b.year || (a.season ?? 0) - (b.season ?? 0));
        for (const ev of events) {
            const bfId = resolveEventBattlefieldId(ev, cityPos);
            if (!bfId) continue;
            this.addEventCities(ev, bfId, cityOfGeneral, out);
            if (routeReady) this.addRouteCities(ev, bfId, cityOfGeneral, pos, cityAt, out);
            bfs.add(bfId);
            // 已打过的累积保留；遇到第一场没打过的（当前这一场）加完就停
            if (!isBattlefieldFought(bfId)) { current = ev; break; }
        }
        // 🔴 [2026-09-23 主人定「先把古典据点都放出来，到了封建显示下一批」] 时代分层：
        //    除事件用到的据点，再显示「当前事件所处时代及之前」的全部据点（这些就是这个年代早就存在的城），
        //    后续时代随剧本推进再放开；排掉当前事件标「这一年还不存在」的城（absentCities）。
        //
        // 🔴 [2026-09-24 主人定「不光是阿卡，**所有的据点都应该按年代才能显示**，尤其是大城、中城、关隘」]
        //    **年代闸门对全部据点一律生效 —— 事件用到的城、沿途经过的城也不例外。**
        //    改之前这两类是 `add()` 无条件塞进 `out` 的（只受 absentCities 拦），
        //    于是那年头还没有的城，只要被某场事件的路线捎带上就上了图：
        //    前331 高加米拉那场的路线一带就漏出**大城安提俄基亚**（前300年才建）、**大城大马士革**（伍麦叶时代）、
        //    **中城阿勒颇**、**关隘阿音贾鲁特**；前621 那场漏出 25 座非小城（潼关、维也纳、纽伦堡…）。
        //    与主人早先的解释一致：「**不显示 ≠ 不存在**」—— 路照走、寻路/归属/战斗一概不受影响，
        //    只是那一年地图上不画它。
        if (current) {
            const absent = new Set(current.absentCities ?? []);
            const curYear = current.year;
            /** 这座城那一年该不该上图（建立年代 + 归属武将时代，两道都要过） */
            const passGate = (cityId: string): boolean =>
                !absent.has(cityId) && cityExistsInYear(cityId, curYear);   // 唯一判据：cityInYear.ts
            // ① 先把「事件用到的 + 沿途经过的」按同一道闸门过一遍（原来它们是不看的）
            for (const id of [...out]) if (!passGate(id)) out.delete(id);
            // ② 再放「当前时代及之前」的全部据点
            for (const c of cities) if (passGate(c.id)) out.add(c.id);
        }
        this.cached = out;
        this.cachedBattlefields = bfs;
        this.routeless = !routeReady;
        this.currentEv = current;
        this.currentComputed = true;
    }

    /** 军团沿路实际经过的城：归属武将所在城 → 各行军路标 → 终点（攻城打的城 / 战场坐标） */
    private addRouteCities(
        ev: HistoricalEvent,
        bfId: string,
        cityOfGeneral: Map<string, string>,
        pos: Map<string, { lat: number; lng: number }>,
        cityAt: Map<string, string>,
        out: Set<string>,
    ): void {
        const startId = scriptEventStartCityId(ev, this.getCities()) ?? (ev.generalId ? cityOfGeneral.get(ev.generalId) : undefined);
        const start = startId ? pos.get(startId) : undefined;
        if (!start) return;
        const data = ev.siegeData ?? ev.fieldBattleData;
        const stops: Array<{ lat: number; lng: number }> = [start];
        for (const wp of data?.marchWaypoints ?? []) {
            const p = pos.get(wp);
            if (p) stops.push(p);
        }
        const defCity = ev.type === 'siege' && !ev.siegeData?.targetBattlefieldId ? ev.siegeData?.defenderCityId : undefined;
        const bf = findEventSite(bfId);
        const end = (defCity ? pos.get(defCity) : undefined) ?? (bf ? { lat: bf.lat, lng: bf.lng } : undefined);
        if (end) stops.push(end);
        for (let i = 0; i + 1 < stops.length; i++) {
            const path = roadRegistry.findPathOnRoad(stops[i], stops[i + 1]);
            for (const p of path ?? []) {
                const id = cityAt.get(`${p.lat.toFixed(4)},${p.lng.toFixed(4)}`);
                // 那一年还不存在的据点：路照走，城不显示
                if (id && !(ev.absentCities ?? []).includes(id)) out.add(id);
            }
        }
    }

    private addEventCities(
        ev: HistoricalEvent,
        bfId: string,
        cityOfGeneral: Map<string, string>,
        out: Set<string>,
    ): void {
        const absent = new Set(ev.absentCities ?? []);
        const add = (id: string | null | undefined) => { if (id && !absent.has(id)) out.add(id); };
        const data = ev.siegeData ?? ev.fieldBattleData;
        for (const gid of [ev.generalId, data?.attackerGeneralId, data?.defenderGeneralId]) {
            if (gid) add(cityOfGeneral.get(gid));
        }
        add(scriptEventStartCityId(ev, this.getCities()));
        add(data?.attackerSourceCityId);
        add(ev.fieldBattleData?.defenderSourceCityId);
        add(ev.siegeData?.defenderCityId);
        for (const wp of data?.marchWaypoints ?? []) add(wp);
        for (const u of ev.cityUpdates ?? []) add(u.cityId);
        add(findEventSite(bfId)?.eventCityId);
    }
}

/**
 * 🔴 [2026-09-23 主人定「把玩家拉到附近」] 剧本模式开局出生地：
 * 当前这一场（按年代第一场没打过的）归属武将所在的城 —— 玩家一开局就在他附近，不必横跨半个地球去找。
 * 剧本已全部打完 / 查不到 → null（调用方按乱斗的老规矩随机出生）。
 */
export function findCurrentScriptEventCity(cities: City[]): City | null {
    const pos = new Map(cities.map((c) => [c.id, { lat: c.latitude, lng: c.longitude }]));
    const events = [...HISTORICAL_EVENT_SCRIPT]
        .sort((a, b) => a.year - b.year || (a.season ?? 0) - (b.season ?? 0));
    for (const ev of events) {
        const bfId = resolveEventBattlefieldId(ev, (id) => pos.get(id));
        if (!bfId || isBattlefieldFought(bfId)) continue;
        if (!ev.generalId) return null;
        // 有「军团出发据点」（写明的，或上一场打完的地方）就生在那里，否则在归属武将本城
        const startId = scriptEventStartCityId(ev, cities);
        if (startId) return cities.find((c) => c.id === startId) ?? null;
        return cities.find((c) => getCityAnchoredGeneral(c.id)?.generalId === ev.generalId) ?? null;
    }
    return null;
}

// ── 军团出发据点（与编辑器同口径，见 scriptEventStart.ts）────────────────────
function toStartInfo(ev: HistoricalEvent, cityPos: (id: string) => { lat: number; lng: number } | undefined): StartEventInfo {
    const siegeCityId = ev.type === 'siege' && !ev.siegeData?.targetBattlefieldId ? ev.siegeData?.defenderCityId : undefined;
    const bfId = resolveEventBattlefieldId(ev, cityPos);
    const bf = findEventSite(bfId);
    const point = (siegeCityId ? cityPos(siegeCityId) : undefined)
        ?? ev.fieldBattleData?.location ?? (bf ? { lat: bf.lat, lng: bf.lng } : null);
    return {
        generalId: ev.generalId ?? '', year: ev.year, season: ev.season ?? 0,
        startCityId: ev.startCityId, absentCities: ev.absentCities, point, siegeCityId,
    };
}
const startCache = new WeakMap<HistoricalEvent, string | null>();
/**
 * 这一场归属武将的军团从哪座城出发：事件写了就用；没写就从他上一场打完的地方；他的第一场 → null（用他本城）。
 */
export function scriptEventStartCityId(ev: HistoricalEvent, cities: readonly City[]): string | null {
    if (startCache.has(ev)) return startCache.get(ev)!;
    const pos = new Map(cities.map((c) => [c.id, { lat: c.latitude, lng: c.longitude }]));
    const cityPos = (id: string) => pos.get(id);
    const infos = new Map(HISTORICAL_EVENT_SCRIPT.map((e) => [e, toStartInfo(e, cityPos)]));
    const list: StartCity[] = cities.map((c) => ({ id: c.id, lat: c.latitude, lng: c.longitude }));
    const r = resolveEventStartCityId(infos.get(ev) ?? toStartInfo(ev, cityPos), [...infos.values()], list);
    const id = r?.cityId ?? null;
    if (cities.length) startCache.set(ev, id);   // 据点表还没加载时别把空结果记住
    return id;
}
