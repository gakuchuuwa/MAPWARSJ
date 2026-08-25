/**
 * 「全面审查」的连通判据必须**陆海一起算**（防回归）。
 *
 * 🔴 [2026-08-26 主人：「马六甲，连接了海路，也连接了陆路，为什么还有审查有问题呢，
 *     你没有把海路和陆路一起算吗」]
 *
 *    `getCityRoadConnectionCounts()` 原来只遍历 `VECTOR_ROAD_DATA`（陆路），
 *    `SEA_ROUTE_DATA` 完全没数。实测马六甲：陆路 1 条 + 海路 1 条 = 2 条，
 *    却因为只数到陆路那 1 条被报「单路据点」。
 *    港口城本来就靠海路连通，只数陆路必然误报一片沿海城 —— 海路画得越多，误报越多。
 *
 * 跑法：npx tsx tools/audit-route-connectivity.mts
 */
import { readFileSync } from 'node:fs';

let fail = 0;
const ok = (m: string) => console.log(`  ✅ ${m}`);
const bad = (m: string) => { console.log(`  🔴 ${m}`); fail++; };

const SRC = readFileSync('src/roads/VectorRoadEditor.ts', 'utf8');

console.log('审查的连通判据：');

// ① 必须 import 海路数据
if (!/import \{ SEA_ROUTE_DATA \} from '\.\.\/data\/VectorSeaRouteData'/.test(SRC)) {
    bad('VectorRoadEditor 没有 import SEA_ROUTE_DATA —— 审查又只会数陆路');
} else ok('已 import SEA_ROUTE_DATA');

// ② 连接数必须由 breakdown（陆+海）派生
const fn = /private getCityRoadConnectionCounts\(\)[\s\S]*?\n    \}/.exec(SRC)?.[0] ?? '';
if (!fn) {
    bad('找不到 getCityRoadConnectionCounts');
} else if (/for \(const f of VECTOR_ROAD_DATA\.features\)/.test(fn)) {
    bad('getCityRoadConnectionCounts 又回到只遍历 VECTOR_ROAD_DATA（漏掉海路）');
} else if (!/getCityConnectionBreakdown/.test(fn)) {
    bad('连接数没有走 getCityConnectionBreakdown（陆+海）');
} else ok('连接数 = 陆 + 海（走 getCityConnectionBreakdown）');

// ③ breakdown 必须两个源都数
const bd = /private getCityConnectionBreakdown\(\)[\s\S]*?\n    \}/.exec(SRC)?.[0] ?? '';
if (!bd) bad('找不到 getCityConnectionBreakdown');
else {
    const hasLand = /VECTOR_ROAD_DATA\.features/.test(bd);
    const hasSea = /SEA_ROUTE_DATA\.features/.test(bd);
    if (!hasLand || !hasSea) bad(`breakdown 少数了源（陆 ${hasLand} / 海 ${hasSea}）`);
    else ok('breakdown 同时统计陆路与海路');
}

// ④ 单路据点要标出是陆还是海（只有一条海路的港口城，原来显示「(未命名)」）
if (!/kind: '陆' \| '海'/.test(SRC)) {
    bad('单路据点没有区分陆/海 —— 只有海路的城会显示不出连到哪');
} else ok('单路据点标注陆/海');

// ⑤ 实算一遍：马六甲不能再被判成单路
console.log('\n实算（与编辑器同判据）：');
const roadData = readFileSync('src/data/VectorRoadData.ts', 'utf8');
const seaData = readFileSync('src/data/VectorSeaRouteData.ts', 'utf8');
const countOf = (src: string, id: string): number =>
    (src.match(new RegExp(`(?:start|end)Connection:\\s*"${id}"`, 'g')) ?? []).length;

const land = countOf(roadData, 'city_malacca');
const sea = countOf(seaData, 'city_malacca');
if (land + sea <= 1) {
    bad(`马六甲连接数 ${land + sea}（陆 ${land} + 海 ${sea}）—— 数据侧真的只有一条，不是判据问题`);
} else ok(`马六甲：陆 ${land} + 海 ${sea} = ${land + sea} 条，不再算单路据点`);

if (fail) { console.log(`\n🔴 ${fail} 项不符`); process.exit(1); }
console.log('\n✅ 全部符合');
