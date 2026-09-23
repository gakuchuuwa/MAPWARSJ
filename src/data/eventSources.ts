/**
 * 历史事件资料清单 —— 🔴 [2026-09-23 主人定]
 *
 * 主人原话：「你要让这种模式写到编辑器中。确保每次事件收集的资料都是一致性的。这样做下一个事件是不是就简单。」
 *
 * 每一场战场事件都要收集**同一套**资料，每一项写明依据（史料原文 / 出处）与可信级别：
 *   · fact     史实 —— 查到了史料（写出处，如「阿里安《亚历山大远征记》I.14」「维基百科 Battle of the Granicus」）；
 *   · popular  通行说法 —— 史料查不到，用知名度最大的说法（主人例：关羽的马查不到就写赤兔马）；
 *   · inferred 合理推定 —— 再没有，就按史地合理地编一个，并写明推定理由。
 * 🔴 绝不留空；问题从来不是查不到，是不查就乱写。编辑器里缺一项就不许保存。
 */

export type EventSourceLevel = 'fact' | 'popular' | 'inferred';

export interface EventSourceEntry {
    level: EventSourceLevel;
    /** 依据：史料原文 / 出处 / 推定理由 */
    text: string;
}

/** 资料清单：每场事件都按这张表收集，顺序即编辑器里的顺序 */
export const EVENT_SOURCE_ITEMS = [
    { key: 'battle', label: '战役名称与性质', hint: '最通行的战役名；攻城战还是野战' },
    { key: 'time', label: '年代与季节', hint: '公元前 / 公元某年，哪个季节或月份' },
    { key: 'place', label: '战场地点与坐标', hint: '史载地点在今何处；坐标取自哪里' },
    { key: 'attacker', label: '攻方统帅与势力', hint: '谁率军；属于哪个政权' },
    { key: 'attackerTroops', label: '攻方兵力', hint: '只写全军总兵力；取英文维基信息框，区间取中值' },
    { key: 'attackerLegion', label: '攻方军团编成', hint: '史称什么；骑兵、步兵、远程各多少人，按比例定三排人数；一贯怎么打定前中后' },
    { key: 'defender', label: '守方统帅与势力', hint: '谁领兵；属于哪个政权' },
    { key: 'defenderTroops', label: '守方兵力', hint: '只写全军总兵力；取英文维基信息框，区间取中值' },
    { key: 'defenderLegion', label: '守方军团编成', hint: '史称什么；骑兵、步兵、远程各多少人，按比例定三排人数；一贯怎么打定前中后' },
    { key: 'route', label: '行军路线', hint: '从哪出发，途经哪些地方，在哪渡河 / 渡海' },
    { key: 'result', label: '胜负与战后归属', hint: '谁胜；战后哪座城归谁' },
    { key: 'invite', label: '邀约对白所据史事', hint: '武将这番话依据的史事' },
    { key: 'briefing', label: '背景播报所据史料', hint: '赶路播报里的人数、人物、地形出自哪里' },
] as const;

export type EventSourceKey = typeof EVENT_SOURCE_ITEMS[number]['key'];

export const EVENT_SOURCE_LEVEL_LABEL: Record<EventSourceLevel, string> = {
    fact: '史实',
    popular: '通行说法',
    inferred: '合理推定',
};
