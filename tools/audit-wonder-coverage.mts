/**
 * 城市地标安置验收：每条映射都对应真实素材与真实据点，且一对一。
 *
 * 🔴 [2026-08-26 主人：「检查下，所有的奇迹安置的对吗，应该是对应好某一个据点」
 *     「不要闲置，能安置的都按事实安置上」]
 *
 * 四条硬检查：
 *   ① 素材存在 —— 映射不得指向 public/SUCAI_BUILDING/ 里没有的目录
 *   ② 据点存在 —— key 必须是 cities_v2 里真实的 cityId（否则永远命中不了）
 *   ③ 一对一   —— 同一奇观不得配多城；同一城不得配多奇观
 *   ④ 不强塞   —— 未安置素材只报告，不为追求零闲置而错配城市
 *
 * ⚠️ 两条**别再犯**的历史错误（2026-08-24 曾配上又按史实撤掉，2026-08-26 已配到正确据点）：
 *   · `ORIE_WONDER_PERSIANS` 别配伊斯法罕 —— 萨法维时代太晚；DE 波斯奇观是泰西封的
 *     萨珊拱门 Taq Kasra，正解是**菲鲁扎巴德**（萨珊开国都，据点 factionId 就是 sashan）。
 *   · `CEAS_WONDER_CUMANS` 别配萨莱 —— 金帐汗国是蒙古系不是库曼；正解是**萨拉托夫**
 *     （据点 factionId 就是 qincha 钦察=库曼）。
 *
 * 跑法：npx tsx tools/audit-wonder-coverage.mts
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';

let fail = 0;
const ok = (m: string) => console.log(`  ✅ ${m}`);
const bad = (m: string) => { console.log(`  🔴 ${m}`); fail++; };

const SRC = readFileSync('src/data/CityWonders.ts', 'utf8');
const CITIES = readFileSync('src/data/cities_v2.ts', 'utf8');
const DIR = 'public/SUCAI_BUILDING';

const pairs = [...SRC.matchAll(/'(city_[a-z0-9_]+)':\s*'([A-Z_0-9]+)'/g)].map((m) => [m[1], m[2]] as const);
const assets = new Set(readdirSync(DIR).filter((d) => statSync(`${DIR}/${d}`).isDirectory()));
const wonderAssets = new Set([...assets].filter((d) => d.includes('_WONDER')));
const cityIds = new Set([...CITIES.matchAll(/id:\s*'(city_[a-z0-9_]+)'/g)].map((m) => m[1]));

console.log(`DE 建筑素材目录 ${assets.size} 个（其中奇观 ${wonderAssets.size} 个）/ 地标映射 ${pairs.length} 条\n`);
console.log('映射有效性：');

const deadAsset = pairs.filter(([, w]) => !assets.has(w));
if (deadAsset.length) bad(`指向不存在的素材：${deadAsset.map(([c, w]) => `${c}→${w}`).join(', ')}`);
else ok('每条都指向真实存在的 DE 建筑素材');

const deadCity = pairs.filter(([c]) => !cityIds.has(c));
if (deadCity.length) bad(`指向不存在的据点：${deadCity.map(([c]) => c).join(', ')}`);
else ok('每条 key 都是真实的 cityId');

console.log('\n一对一：');
const byWonder = new Map<string, string[]>();
const byCity = new Map<string, string[]>();
for (const [c, w] of pairs) {
    byWonder.set(w, [...(byWonder.get(w) ?? []), c]);
    byCity.set(c, [...(byCity.get(c) ?? []), w]);
}
const dupW = [...byWonder].filter(([, v]) => v.length > 1);
const dupC = [...byCity].filter(([, v]) => v.length > 1);
if (dupW.length) bad(`同一奇观配了多城：${dupW.map(([w, v]) => `${w}→${v.join('/')}`).join('; ')}`);
else ok('没有奇观被配给多座城');
if (dupC.length) bad(`同一城配了多奇观：${dupC.map(([c, v]) => `${c}→${v.join('/')}`).join('; ')}`);
else ok('没有城被配了多座奇观');

console.log('\n奇观覆盖率（仅报告，不强制错配）：');
const used = new Set(pairs.map(([, w]) => w));
const idle = [...wonderAssets].filter((a) => !used.has(a)).sort();
console.log(`  ${wonderAssets.size} 座 → 安置 ${wonderAssets.size - idle.length} 座`);
if (idle.length) console.log(`  ⚪ 未安置（不得强塞）：${idle.join(', ')}`);
else ok('全部奇观均有史实合适的据点');

console.log('\n防回归（曾按史实撤销过的配法）：');
const wrong: Array<[RegExp, string]> = [
    [/'city_yisifahan':\s*'ORIE_WONDER_PERSIANS'/, '波斯奇观又配回伊斯法罕（萨法维太晚，应为菲鲁扎巴德=萨珊开国都）'],
    [/'city_salai':\s*'CEAS_WONDER_CUMANS'/, '库曼奇观又配回萨莱（金帐是蒙古系，应为萨拉托夫=钦察本部）'],
];
let regressed = 0;
for (const [re, msg] of wrong) if (re.test(SRC)) { bad(msg); regressed++; }
if (!regressed) ok('两条历史错误都没有复发');

if (fail) { console.log(`\n🔴 ${fail} 项不符`); process.exit(1); }
console.log('\n✅ 全部符合');
