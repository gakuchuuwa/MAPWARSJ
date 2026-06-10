import * as fs from 'fs';

const data = JSON.parse(fs.readFileSync('./close_cities_report.json', 'utf-8'));

let md = '# 50KM 距离冲突处理计划\n\n';
md += '根据您的要求，所有改动必须尊重真实地理与历史数据。由于有些真实据点本身距离就小于 50KM（如京都与奈良，或虎牢关与洛口仓），处理时我们采取以下原则：\n';
md += '- **单方有势力 vs 叛军/无势力**：保留有势力一方，如果叛军/无势力的地点历史意义一般，则移除。\n';
md += '- **双方均无势力 (叛军/panjun)**：保留 Tier 较高的（如 T1 保留，T2 移除），或历史意义更显著的。\n';
md += '- **双方均有正规势力**：这是最核心的部分。因为它们都是真实政权或家族的所在地，如果不宜删除任何一个，我们 **建议保留并允许距离例外**，而不是强行拉开距离造成地理失真。\n\n';

md += '## 建议保留的例外（双正规势力冲突）\n\n';
md += '这些据点均有正规势力，建议 **全部保留**，接受距离小于 50KM 的设定。\n\n';

let doubleFactions = [];
let singleFactions = [];
let noFactions = [];

const GENERIC_FACTIONS = ['panjun', 'none'];

data.forEach(pair => {
    const f1 = pair.city1.factionId;
    const f2 = pair.city2.factionId;
    const isGeneric1 = GENERIC_FACTIONS.includes(f1);
    const isGeneric2 = GENERIC_FACTIONS.includes(f2);
    
    if (!isGeneric1 && !isGeneric2) {
        doubleFactions.push(pair);
    } else if (isGeneric1 && isGeneric2) {
        noFactions.push(pair);
    } else {
        singleFactions.push(pair);
    }
});

doubleFactions.forEach(pair => {
    md += \- \ (势力: \) 与 \ (势力: \) - 距离: \ km\n\;
});

md += '\n## 建议删除的无势力据点（单方有势力冲突）\n\n';
md += '保留正规势力据点，移除与之冲突的泛用（如叛军 panjun）据点：\n\n';

singleFactions.forEach(pair => {
    const keep = GENERIC_FACTIONS.includes(pair.city1.factionId) ? pair.city2 : pair.city1;
    const remove = GENERIC_FACTIONS.includes(pair.city1.factionId) ? pair.city1 : pair.city2;
    md += \- 移除 **\** (Tier \)，保留 **\** (势力: \, Tier \) - 距离: \ km\n\;
});

md += '\n## 建议优胜劣汰的据点（双方均无正规势力）\n\n';
md += '两者均无专属势力，通过对比层级(Tier)决定保留哪一个：\n\n';

noFactions.forEach(pair => {
    // Keep lower tier number (0 is best, then 1, 2, 4)
    let keep, remove;
    if (pair.city1.tier < pair.city2.tier) {
        keep = pair.city1; remove = pair.city2;
    } else if (pair.city2.tier < pair.city1.tier) {
        keep = pair.city2; remove = pair.city1;
    } else {
        keep = pair.city1; remove = pair.city2; // Tie
    }
    md += \- 移除 **\** (Tier \)，保留 **\** (Tier \) - 距离: \ km\n\;
});

md += '\n## 待确认事项\n';
md += '> [!IMPORTANT]\n';
md += '> 1. 上述“建议保留的例外（双正规势力冲突）”中，是否同意全部保留，不做强行删除？\n';
md += '> 2. 对于被标记为“移除”的无势力据点，您是否认为有绝对不能删的历史名城？如果有，请指出，我们可以为它破例保留。\n';

fs.writeFileSync('./implementation_plan.md', md, 'utf-8');
console.log('Plan generated.');