import * as fs from 'fs';

const data = JSON.parse(fs.readFileSync('./close_cities_report.json', 'utf-8'));

// Fix mappings
const fixes: Record<string, string> = {
    'city_dongzhiyuan': 'huimin',
    'city_yongan': 'taiping',
    'city_mengcheng': 'han_nian',
    'city_danjiang': 'miao_qing',
    'city_kaili': 'miao_qing',
    'city_bazhou': 'liu_liu_qi'
};

data.forEach((pair: any) => {
    if (fixes[pair.city1.id]) pair.city1.factionId = fixes[pair.city1.id];
    if (fixes[pair.city2.id]) pair.city2.factionId = fixes[pair.city2.id];
});

let md = '# 50KM 距离冲突处理计划 (修正版)\n\n';
md += '根据您的提醒，我检查了被标记为无势力（panjun）的据点，发现您的直觉非常准确！有很多泛用据点实际上在 note 中明确标注了势力，且该势力在 factions.ts 中是存在的（只是 cities_v2 中忘了填）。\n\n';

md += '## 第一步：修正遗漏的势力\n\n';
md += '以下据点的 factionId 被错误标记为 panjun，我们将首先修正它们：\n';
md += '- 董志原：修正为 huimin (陕甘回民起义)\n';
md += '- 永安：修正为 	aiping (太平天国)\n';
md += '- 蒙城：修正为 han_nian (捻军)\n';
md += '- 丹江：修正为 miao_qing (苗民起义)\n';
md += '- 凯里：修正为 miao_qing (苗民起义)\n';
md += '- 霸州：修正为 liu_liu_qi (刘六刘七)\n\n';
md += '注：**易京**(公孙瓒)、**海陵**(李子通)、**凤翔**(李思齐) 经查在 factions.ts 中目前尚未建立独立势力，所以暂时仍算作 panjun。\n\n';


let doubleFactions: any[] = [];
let singleFactions: any[] = [];
let noFactions: any[] = [];

const GENERIC_FACTIONS = ['panjun', 'none'];

data.forEach((pair: any) => {
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

md += '## 第二步：建议保留的例外（双正规势力冲突）\n\n';
md += '以下据点均有正规势力（含修正后变为正规势力的），为了尊重真实地理，建议 **全部保留**：\n\n';

doubleFactions.forEach(pair => {
    md += \- \ (势力: \) 与 \ (势力: \) - 距离: \ km\n\;
});

md += '\n## 第三步：建议删除的无势力据点（单方有势力冲突）\n\n';
md += '保留正规势力据点，移除与之冲突的泛用据点：\n\n';

singleFactions.forEach(pair => {
    const keep = GENERIC_FACTIONS.includes(pair.city1.factionId) ? pair.city2 : pair.city1;
    const remove = GENERIC_FACTIONS.includes(pair.city1.factionId) ? pair.city1 : pair.city2;
    md += \- 移除 **\** (Tier \，如\)，保留 **\** (势力: \) - \ km\n\;
});

md += '\n## 第四步：建议优胜劣汰的据点（双方均无正规势力）\n\n';
noFactions.forEach(pair => {
    let keep, remove;
    if (pair.city1.tier < pair.city2.tier) {
        keep = pair.city1; remove = pair.city2;
    } else if (pair.city2.tier < pair.city1.tier) {
        keep = pair.city2; remove = pair.city1;
    } else {
        keep = pair.city1; remove = pair.city2;
    }
    md += \- 移除 **\**，保留 **\** - \ km\n\;
});

md += '\n## 待确认事项\n';
md += '> [!IMPORTANT]\n';
md += '> 1. 上述 6 个遗漏势力是否同意修复？\n';
md += '> 2. 易京(公孙瓒)、海陵(李子通) 等，是否需要我为您在 factions.ts 中新建势力，以避免被删除？\n';

fs.writeFileSync('./implementation_plan.md', md, 'utf-8');
console.log('New plan generated.');