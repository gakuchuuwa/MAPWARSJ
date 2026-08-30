/** DE 城堡素材实际可达性审计：映射表中出现不等于游戏里能显示。 */
import { readdirSync } from 'node:fs';
import { CITIES_V2 } from '../src/data/cities_v2';
import { CITY_WONDER, CITY_WONDER_EXTRA } from '../src/data/CityWonders';
import { FACTION_CASTLE, REGION_CASTLE, resolveCastleAsset } from '../src/config/deCastleAssets';

const DIR = 'public/SUCAI_BUILDING';
const USER_MADE = new Set([
    'DIANQIAN_CASTLE_AGE3',
    'LINGNAN_CASTLE_AGE3',
    'TIBET_CASTLE_AGE3',
    'WESTERN_CASTLE_AGE3',
]);
const onDisk = new Set(readdirSync(DIR));
const allDeBase = [...onDisk]
    .filter((name) => name.includes('CASTLE'))
    .filter((name) => !name.endsWith('_DESTR') && !name.endsWith('_RUBBLE'))
    .filter((name) => !USER_MADE.has(name))
    .sort();

let fail = 0;
const bad = (message: string) => { console.log(`🔴 ${message}`); fail++; };
const ok = (message: string) => console.log(`✅ ${message}`);

const mapped = [...Object.values(FACTION_CASTLE), ...Object.values(REGION_CASTLE)];
const dangling = [...new Set(mapped)].filter((asset) => !onDisk.has(asset));
if (dangling.length) bad(`映射指向不存在素材：${dangling.join(', ')}`);
else ok('势力与文化城堡映射全部指向真实目录');

// 真实显示入口一：ZOOM13/战略地标会读取主地标与附加地标。
const reachable = new Set<string>(Object.values(CITY_WONDER));
for (const extras of Object.values(CITY_WONDER_EXTRA)) {
    for (const extra of extras) reachable.add(extra.asset);
}

// 真实显示入口二：关隘在战略地图及 ZOOM13 会调用 resolveCastleAsset。
for (const city of CITIES_V2) {
    if (city.type !== 'pass') continue;
    reachable.add(resolveCastleAsset('', city.factionId, city.region));
}

const used = allDeBase.filter((asset) => reachable.has(asset));
const idle = allDeBase.filter((asset) => !reachable.has(asset));
console.log(`DE 基础城堡 ${allDeBase.length} 个 → 实际可显示 ${used.length} 个`);
if (idle.length) bad(`仍不可达：${idle.join(', ')}`);
else ok('所有 DE 基础城堡均已接入实际渲染入口');

if (fail) process.exit(1);
