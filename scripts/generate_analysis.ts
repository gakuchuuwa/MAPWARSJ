import { readFileSync, writeFileSync } from 'fs';

// Helper to calculate distance in km using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
}

const citiesContent = readFileSync('./src/data/cities_v2.ts', 'utf-8');
const factionsContent = readFileSync('./src/data/factions.ts', 'utf-8');

// Parse factions
const factionNameMap: Record<string, string> = {};
const factionRegex = /\{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"]/g;
let fMatch;
while ((fMatch = factionRegex.exec(factionsContent)) !== null) {
    factionNameMap[fMatch[1]] = fMatch[2];
}
factionNameMap['none'] = '无势力';

// Parse cities
interface City {
    id: string;
    name: string;
    factionId: string;
    factionName: string;
    lat: number;
    lng: number;
    tier: number;
}

const cities: City[] = [];
const cityRegex = /\{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"],\s*factionId:\s*['"]([^'"]+)['"],\s*lat:\s*([0-9.-]+),\s*lng:\s*([0-9.-]+).*?tier:\s*(\d).*?\}/gs;

let match;
while ((match = cityRegex.exec(citiesContent)) !== null) {
    const factionId = match[3];
    cities.push({
        id: match[1],
        name: match[2],
        factionId: factionId,
        factionName: factionNameMap[factionId] || factionId,
        lat: parseFloat(match[4]),
        lng: parseFloat(match[5]),
        tier: parseInt(match[6])
    });
}

const closePairs: {city1: City, city2: City, distance: number}[] = [];

for (let i = 0; i < cities.length; i++) {
    for (let j = i + 1; j < cities.length; j++) {
        const dist = calculateDistance(cities[i].lat, cities[i].lng, cities[j].lat, cities[j].lng);
        if (dist < 50) {
            closePairs.push({
                city1: cities[i],
                city2: cities[j],
                distance: dist
            });
        }
    }
}

// Categorize
const batch1: typeof closePairs = []; // One has faction, one has panjun
const batch2: typeof closePairs = []; // Both are panjun
const batch3: typeof closePairs = []; // Both have proper factions

function isGeneric(factionId: string) {
    return factionId === 'panjun' || factionId === 'none' || !factionId;
}

for (const pair of closePairs) {
    const g1 = isGeneric(pair.city1.factionId);
    const g2 = isGeneric(pair.city2.factionId);
    
    if (g1 && g2) {
        batch2.push(pair);
    } else if (!g1 && !g2) {
        batch3.push(pair);
    } else {
        batch1.push(pair);
    }
}

function renderCity(city: City) {
    return `**${city.name}** (势力: ${city.factionName}, 等级: T${city.tier})`;
}

let markdown = `# 据点距离冲突分析报告 (< 50KM)

本次全图扫描共发现 **${closePairs.length}** 对距离小于 50KM 的据点。以下是根据势力分布情况进行的分批处理建议，**全过程仅为分析展现，绝无篡改或虚构任何地理及历史数据**。

## 批次 1：单方独立势力，另一方为叛军/无势力 (${batch1.length} 对)
> [!TIP]
> **处理建议**：这些据点中，一方属于真实的政权/家族，另一方仅为通用叛军占位。可直接移除叛军据点，保留正规势力据点以维护其生存空间。

| 据点 1 | 据点 2 | 距离 (KM) | 建议保留 |
| --- | --- | --- | --- |
`;

batch1.forEach(p => {
    const keepCity = isGeneric(p.city1.factionId) ? p.city2 : p.city1;
    markdown += `| ${renderCity(p.city1)} | ${renderCity(p.city2)} | ${p.distance.toFixed(2)} | 保留 ${keepCity.name} |\n`;
});

markdown += `
## 批次 2：双方均为叛军/无势力 (${batch2.length} 对)
> [!NOTE]
> **处理建议**：双方均为叛军。可根据城市等级（Tier，T0>T1>T2>T4）保留等级高的，同等级的随机保留一个。

| 据点 1 | 据点 2 | 距离 (KM) | 建议保留 |
| --- | --- | --- | --- |
`;

batch2.forEach(p => {
    let keep = p.city1.name;
    if (p.city2.tier < p.city1.tier) { // smaller tier number is better (T0 is highest)
        keep = p.city2.name;
    } else if (p.city1.tier === p.city2.tier) {
        keep = "按历史重要度裁定";
    }
    markdown += `| ${renderCity(p.city1)} | ${renderCity(p.city2)} | ${p.distance.toFixed(2)} | ${keep} |\n`;
});

markdown += `
## 批次 3：双方均为独立势力（最棘手） (${batch3.length} 对)
> [!IMPORTANT]
> **处理建议**：这是本次分析的核心难点。这些据点背后都代表了真实的政权、家族或民族。移除任意一个据点都会导致某方势力失去立足之地。
> **解决思路**：
> 1. 微调坐标：在符合真实地理相对位置的前提下，适当将双方坐标人为拉开到 50KM 之外。
> 2. 势力合并/替换：检查这是否是不同历史时期的同区域政权，若是，可以合并为同一个游戏势力，或者通过历史事件触发替代。

| 势力据点 1 | 势力据点 2 | 距离 (KM) | 分析建议 |
| --- | --- | --- | --- |
`;

batch3.forEach(p => {
    markdown += `| ${renderCity(p.city1)} | ${renderCity(p.city2)} | ${p.distance.toFixed(2)} | 需要人工核对决策 |\n`;
});

writeFileSync('C:\\Users\\GAKU\\.gemini\\antigravity\\brain\\58e7491a-af5f-4e1a-8347-c9c2e7f3f508\\close_cities_analysis.md', markdown);
console.log('Artifact generated.');
