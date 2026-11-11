/** 数据表运行时冒烟：这些模块在 import 期会跑唯一性断言，能加载即「启动不崩」 */
import { FACTIONS } from '../../src/data/factions';
import { SANDBOX_DISPLAY_NAMES } from '../../src/data/SandboxDisplayNames';
import { HISTORICAL_FACTION_COLORS } from '../../src/data/HistoricalFactionColors';
import { STARTING_CAPITALS } from '../../src/data/StartingCapitals';
import { FACTION_SPAN } from '../../src/data/FactionLifeYears';
import { FACTION_ERA } from '../../src/data/FactionEra';
import { FACTION_LINEAGE_PARENT } from '../../src/data/FactionLineage';
import { FACTION_COMPOSITIONS } from '../../src/data/FactionCompositions';
import { FACTION_EMBLEM } from '../../src/data/FactionEmblems';
import { FACTION_GENERALS } from '../../src/data/FactionGenerals';

const f = FACTIONS as any[];
const miss: string[] = [];
for (const x of f) {
    if (x.id === 'panshu') continue;
    if (!(SANDBOX_DISPLAY_NAMES as any)[x.id]) miss.push(`旗号 ${x.id}`);
    if (!(STARTING_CAPITALS as any)[x.id]) miss.push(`首府 ${x.id}`);
    if (!(FACTION_ERA as any)[x.id]) miss.push(`时代 ${x.id}`);
    if (!(FACTION_SPAN as any)[x.id]) miss.push(`起止年 ${x.id}`);
}
console.log(`势力 ${f.length}｜武将条目 ${Object.keys(FACTION_GENERALS as any).length}`);
console.log(`颜色 ${Object.keys(HISTORICAL_FACTION_COLORS as any).length}｜纹章 ${Object.keys(FACTION_EMBLEM as any).length}｜同系表 ${Object.keys(FACTION_LINEAGE_PARENT as any).length}｜编制 ${Object.keys(FACTION_COMPOSITIONS as any).length}`);
console.log(miss.length ? `缺登记 ${miss.length}：${miss.slice(0, 20).join(', ')}` : '缺登记 0 ✅');

