/** DE 城堡素材实际可达性审计：映射表中出现不等于游戏里能显示。 */
import { readdirSync } from 'node:fs';
import { CITIES_V2 } from '../src/data/cities_v2';
import { CITY_WONDER, CITY_WONDER_EXTRA } from '../src/data/CityWonders';
import { FACTION_CASTLE, REGION_CASTLE, resolveCastleAsset } from '../src/config/deCastleAssets';
import { resolveCityDeBuildingStyle } from '../src/systems/cityDeStyle';

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

// 真实显示入口二：关隘在战略地图及 ZOOM13 会调用 resolveCastleAsset（**必须带 cityId**）。
// 🔴 [2026-10-05 修尺子] 原来这里只喂 `('', factionId, region)`——漏了第 4 个参数 `cityId`，
//    而 `resolveCastleAsset` 第一句就是 `REP_59_CITY_CASTLES[cityId]` 优先；
//    更要命的是**只挑了 type==='pass' 的城**，中城/小城/大城一律不算，
//    于是雅典(ATHENIANS_)/布拉格(BOHE_)/布达佩斯(MAGY_)/巴卡塔(MUIS_)/朱罗(PURU_) 等
//    **明明已按势力挂好**的城堡全被判「不可达」。改：所有城、按游戏同一签名算。
for (const city of CITIES_V2) {
    const style = resolveCityDeBuildingStyle(city.id, String(city.type), city.region, city.latitude, city.longitude);
    reachable.add(resolveCastleAsset(style, city.factionId, city.region, city.id));
}

const used = allDeBase.filter((asset) => reachable.has(asset));
const idle = allDeBase.filter((asset) => !reachable.has(asset));
console.log(`DE 基础城堡 ${allDeBase.length} 个 → 实际可显示 ${used.length} 个`);
if (idle.length) bad(`仍不可达：${idle.join(', ')}`);
else ok('所有 DE 基础城堡均已接入实际渲染入口');

if (fail) process.exit(1);
