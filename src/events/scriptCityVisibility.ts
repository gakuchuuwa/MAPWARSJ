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
 *   · 战后易主的城 `cityUpdates`；战场记录上的 `eventCityId`。
 *
 * 显示范围 = 已打过的事件 + 当前这一场（按年代排序第一场没打过的）。
 */
import type { City, HistoricalEvent } from '../types/core';
import { HISTORICAL_EVENT_SCRIPT, resolveEventBattlefieldId } from '../data/HistoricalEventScript';
import { BATTLEFIELDS } from '../data/Battlefields';
import { getCityAnchoredGeneral } from '../data/CityGeneralBridge';
import { isBattlefieldFought } from './battlefieldState';

export class ScriptCityVisibility {
    private cached: Set<string> | null = null;

    constructor(
        private readonly getCities: () => City[],
        /** true = 历史剧本期（此时才过滤据点） */
        private readonly isScriptPeriod: () => boolean,
    ) {}

    /** 事件进度变了（有战场打完）时调用，下次查询重算 */
    public invalidate(): void {
        this.cached = null;
    }

    public isCityVisible(city: City): boolean {
        if (!this.isScriptPeriod()) return true;
        if (!this.cached) this.cached = this.compute();
        return this.cached.has(city.id);
    }

    private compute(): Set<string> {
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
        const events = [...HISTORICAL_EVENT_SCRIPT]
            .sort((a, b) => a.year - b.year || (a.season ?? 0) - (b.season ?? 0));
        for (const ev of events) {
            const bfId = resolveEventBattlefieldId(ev, cityPos);
            if (!bfId) continue;
            this.addEventCities(ev, bfId, cityOfGeneral, out);
            // 已打过的累积保留；遇到第一场没打过的（当前这一场）加完就停
            if (!isBattlefieldFought(bfId)) break;
        }
        return out;
    }

    private addEventCities(
        ev: HistoricalEvent,
        bfId: string,
        cityOfGeneral: Map<string, string>,
        out: Set<string>,
    ): void {
        const add = (id: string | null | undefined) => { if (id) out.add(id); };
        const data = ev.siegeData ?? ev.fieldBattleData;
        for (const gid of [ev.generalId, data?.attackerGeneralId, data?.defenderGeneralId]) {
            if (gid) add(cityOfGeneral.get(gid));
        }
        add(data?.attackerSourceCityId);
        add(ev.fieldBattleData?.defenderSourceCityId);
        add(ev.siegeData?.defenderCityId);
        for (const wp of data?.marchWaypoints ?? []) add(wp);
        for (const u of ev.cityUpdates ?? []) add(u.cityId);
        add(BATTLEFIELDS.find((b) => b.id === bfId)?.eventCityId);
    }
}
