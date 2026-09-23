/**
 * 事件地点：剧本里每一场战役发生在哪里（游戏流程与战场事件编辑器共用）。
 *
 * 🔴 [2026-09-24 主人定「所有事件就两种，你能不能统一下规则。
 *    一个是野战，战后显示战场。一个是攻城战，攻城战必须有据点，就这么简单，攻城战，你搞什么战场呀」]
 *   · 野战 → 战场记录（Battlefields.ts 的 bf_*），地图上画战场，打完点亮遗址；
 *   · 攻城战 → **被攻打的据点本身**。没有战场记录、不画战场标牌；这里按「据点 + 年份」生成一个地点，
 *     只用来记「打没打过」、排先后、给玩家赶路定目标。战果由 cityUpdates 的易主体现。
 *   （打「战场要塞」的旧写法 targetBattlefieldId 仍兼容，编辑器会要求改成据点。）
 */
import { BATTLEFIELDS, siegeSiteId, type BattlefieldData } from './Battlefields';
import { HISTORICAL_EVENT_SCRIPT } from './HistoricalEventScript';
import { CITIES_V2 } from './cities_v2';

const CITY_BY_ID = new Map(CITIES_V2.map((c) => [c.id, c]));

function siegeSites(): BattlefieldData[] {
    const out: BattlefieldData[] = [];
    for (const ev of HISTORICAL_EVENT_SCRIPT) {
        if (ev.type !== 'siege') continue;
        const sd = ev.siegeData;
        if (!sd || sd.targetBattlefieldId || !sd.defenderCityId) continue;
        const c = CITY_BY_ID.get(sd.defenderCityId);
        if (!c) continue;
        out.push({
            id: siegeSiteId(c.id, ev.year),
            name: c.name,
            lat: c.lat,
            lng: c.lng,
            scriptYear: ev.year,
            briefing: ev.briefing,
            eventCityId: c.id,
            siegeCastleType: c.type,
        } as BattlefieldData);
    }
    return out;
}

/** 全部事件地点：野战战场 + 攻城据点（后者不在 BATTLEFIELDS 里，不会被战场图层画出来） */
export const EVENT_SITES: readonly BattlefieldData[] = [...BATTLEFIELDS, ...siegeSites()];

export function findEventSite(id: string | null | undefined): BattlefieldData | undefined {
    return id ? EVENT_SITES.find((s) => s.id === id) : undefined;
}
