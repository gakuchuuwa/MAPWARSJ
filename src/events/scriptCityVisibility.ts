/**
 * 剧本期据点显示 —— 🔴 [2026-09-23 主人定]
 *
 * 主人原话：「现在的问题不光是君士坦丁堡，还有很多其他的据点」→ 定案「累积显示」：
 *   剧本进行时，地图上**只显示剧本事件用到的据点**；一场事件出现过的据点此后一直留着，
 *   下一场再加上它自己的据点。剧本全部结束、转入乱斗后，全部据点恢复显示。
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
import { getCityAnchoredGeneral } from '../data/CityGeneralBridge';
import { isBattlefieldFought } from './battlefieldState';
import { roadRegistry } from '../roads/RoadRegistry';

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
        const startId = ev.startCityId ?? (ev.generalId ? cityOfGeneral.get(ev.generalId) : undefined);
        const start = startId ? pos.get(startId) : undefined;
        if (!start) return;
        const data = ev.siegeData ?? ev.fieldBattleData;
        const stops: Array<{ lat: number; lng: number }> = [start];
        for (const wp of data?.marchWaypoints ?? []) {
            const p = pos.get(wp);
            if (p) stops.push(p);
        }
        const defCity = ev.type === 'siege' && !ev.siegeData?.targetBattlefieldId ? ev.siegeData?.defenderCityId : undefined;
        const bf = BATTLEFIELDS.find((b) => b.id === bfId);
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
        add(ev.startCityId);
        add(data?.attackerSourceCityId);
        add(ev.fieldBattleData?.defenderSourceCityId);
        add(ev.siegeData?.defenderCityId);
        for (const wp of data?.marchWaypoints ?? []) add(wp);
        for (const u of ev.cityUpdates ?? []) add(u.cityId);
        add(BATTLEFIELDS.find((b) => b.id === bfId)?.eventCityId);
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
        // 有「军团出发据点」就生在那里，否则在归属武将本城
        if (ev.startCityId) return cities.find((c) => c.id === ev.startCityId) ?? null;
        return cities.find((c) => getCityAnchoredGeneral(c.id)?.generalId === ev.generalId) ?? null;
    }
    return null;
}
