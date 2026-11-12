/**
 * 战争编年史 · 段注册表（2026-11-12）
 *
 * 只做登记与查询：段 → 事件 → 下一事件。战斗怎么打、路怎么走、播报怎么念，
 * 全部留在 `ChronicleDirector` 与现有经典战管线，不在这里长逻辑。
 *
 * 数据来源：`tools/chronicle/import.py` 生成的 `ChronicleSegment01..03.ts`
 * （第一至第三段，第 1—24 棒，141 场；第四段起的表到了再往里加一行）。
 */
import type { ChronicleEvent, ChronicleSegment } from './ChronicleTypes';
import { CHRONICLE_SEGMENT_01 } from './ChronicleSegment01';
import { CHRONICLE_SEGMENT_02 } from './ChronicleSegment02';
import { CHRONICLE_SEGMENT_03 } from './ChronicleSegment03';

export type { ChronicleEvent, ChronicleSegment } from './ChronicleTypes';
export { isMissingLead, missingLeadName } from './ChronicleTypes';

export const CHRONICLE_SEGMENTS: readonly ChronicleSegment[] = [
    { id: 1, title: '波斯至亚历山大', fromYear: -550, toYear: -323, status: 'ready', events: CHRONICLE_SEGMENT_01 },
    { id: 2, title: '继业者至战国秦汉白登', fromYear: -322, toYear: -200, status: 'ready', events: CHRONICLE_SEGMENT_02 },
    { id: 3, title: '匈奴北道至罗马安息与汉武北伐', fromYear: -199, toYear: -87, status: 'ready', events: CHRONICLE_SEGMENT_03 },
];

const ALL_EVENTS: readonly ChronicleEvent[] = CHRONICLE_SEGMENTS.flatMap(s => s.events);
const BY_ID = new Map<string, ChronicleEvent>(ALL_EVENTS.map(e => [e.id, e]));

/** 全卷事件（按段、年、月排序，导入器已排好） */
export function getAllChronicleEvents(): readonly ChronicleEvent[] {
    return ALL_EVENTS;
}

export function getChronicleSegment(id: number): ChronicleSegment | undefined {
    return CHRONICLE_SEGMENTS.find(s => s.id === id);
}

export function getChronicleEvent(id: string): ChronicleEvent | undefined {
    return BY_ID.get(id);
}

/** 下一事件；到卷尾返回 undefined */
export function nextChronicleEvent(id: string): ChronicleEvent | undefined {
    const i = ALL_EVENTS.findIndex(e => e.id === id);
    return i >= 0 ? ALL_EVENTS[i + 1] : undefined;
}

export function previousChronicleEvent(id: string): ChronicleEvent | undefined {
    const i = ALL_EVENTS.findIndex(e => e.id === id);
    return i > 0 ? ALL_EVENTS[i - 1] : undefined;
}

/** 某棒的第一事件（棒号＝表内「第N棒」的 N） */
export function firstEventOfBaton(baton: number): ChronicleEvent | undefined {
    return ALL_EVENTS.find(e => e.baton === baton);
}

/** 已导入的最后一段的最后一事件（用于段末回落普通百岁自动寻将） */
export function lastChronicleEvent(): ChronicleEvent | undefined {
    return ALL_EVENTS[ALL_EVENTS.length - 1];
}

/** 按年份找当时该跑的事件（读档/换年重算用） */
export function chronicleEventAtYear(year: number): ChronicleEvent | undefined {
    let hit: ChronicleEvent | undefined;
    for (const e of ALL_EVENTS) {
        if (e.year <= year) hit = e;
        else break;
    }
    return hit;
}

/** 战斗步骤合计（审计/面板用） */
export function chronicleBattleStepCount(): number {
    return ALL_EVENTS.reduce((n, e) => n + e.battles.length, 0);
}
