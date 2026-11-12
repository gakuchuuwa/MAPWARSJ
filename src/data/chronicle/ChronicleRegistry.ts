/**
 * 战争编年史 · 段注册表（2026-11-12）
 *
 * 只做登记与查询：段 → 事件 → 下一事件。战斗怎么打、路怎么走、播报怎么念，
 * 全部留在 `ChronicleDirector` 与现有经典战管线，不在这里长逻辑。
 *
 * 数据来源：`tools/chronicle/import.py` 生成的 `ChronicleSegment01..09.ts`
 * （第一至第九段，第 1—66 棒，317 场；第十段起的表到了再往里加一行）。
 */
import type { ChronicleEvent, ChronicleSegment } from './ChronicleTypes';
import { CHRONICLE_SEGMENT_01 } from './ChronicleSegment01';
import { CHRONICLE_SEGMENT_02 } from './ChronicleSegment02';
import { CHRONICLE_SEGMENT_03 } from './ChronicleSegment03';
import { CHRONICLE_SEGMENT_04 } from './ChronicleSegment04';
import { CHRONICLE_SEGMENT_05 } from './ChronicleSegment05';
import { CHRONICLE_SEGMENT_06 } from './ChronicleSegment06';
import { CHRONICLE_SEGMENT_07 } from './ChronicleSegment07';
import { CHRONICLE_SEGMENT_08 } from './ChronicleSegment08';
import { CHRONICLE_SEGMENT_09 } from './ChronicleSegment09';

export type { ChronicleEvent, ChronicleSegment } from './ChronicleTypes';
export { isMissingLead, missingLeadName } from './ChronicleTypes';

export const CHRONICLE_SEGMENTS: readonly ChronicleSegment[] = [
    { id: 1, title: '波斯至亚历山大', fromYear: -550, toYear: -323, status: 'ready', events: CHRONICLE_SEGMENT_01 },
    { id: 2, title: '继业者至战国秦汉白登', fromYear: -322, toYear: -200, status: 'ready', events: CHRONICLE_SEGMENT_02 },
    { id: 3, title: '匈奴北道至罗马安息与汉武北伐', fromYear: -199, toYear: -87, status: 'ready', events: CHRONICLE_SEGMENT_03 },
    { id: 4, title: '西域都护至陈汤昆阳', fromYear: -86, toYear: 23, status: 'ready', events: CHRONICLE_SEGMENT_04 },
    { id: 5, title: '东汉突骑至三国虎豹骑', fromYear: 24, toYear: 220, status: 'ready', events: CHRONICLE_SEGMENT_05 },
    { id: 6, title: '三国街亭至淝水参合陂', fromYear: 221, toYear: 395, status: 'ready', events: CHRONICLE_SEGMENT_06 },
    { id: 7, title: '北魏虎骑至白袍军与府兵一统', fromYear: 396, toYear: 589, status: 'ready', events: CHRONICLE_SEGMENT_07 },
    { id: 8, title: '隋唐玄甲至香积寺', fromYear: 590, toYear: 763, status: 'ready', events: CHRONICLE_SEGMENT_08 },
    { id: 9, title: '沙陀鸦儿军至高平立宋', fromYear: 764, toYear: 960, status: 'ready', events: CHRONICLE_SEGMENT_09 },
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
