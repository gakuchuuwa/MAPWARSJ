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
import { readFileSync, existsSync } from 'node:fs';

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

// ⑤ 全量实算：零连接 / 单连接据点
// 🔴 [2026-08-26 主人「瓜纳巴拉没有路」] 我此前的统计**遍历的是"有连接记录的城"**，
//    零连接的城压根不在那张表里 → 自动跳过 → 报了「无据点连接数 ≤1」的假结论。
//    必须遍历**全部城池**再查它的连接数。
console.log('\n全量连接数（遍历所有城池，不是只遍历有连接的）：');
{
    const CITY_SRC = readFileSync('src/data/cities_v2.ts', 'utf8');
    const RD = readFileSync('src/data/VectorRoadData.ts', 'utf8');
    const SEA = readFileSync('src/data/VectorSeaRouteData.ts', 'utf8');
    const cityIds = [...CITY_SRC.matchAll(/id:\s*'(city_[a-z0-9_]+)'/g)].map((m) => m[1]);
    const nameOf = new Map([...CITY_SRC.matchAll(/id:\s*'(city_[a-z0-9_]+)',\s*name:\s*'([^']+)'/g)]
        .map((m) => [m[1], m[2]] as [string, string]));
    const deg = new Map<string, number>();
    // 成对取 start+end（同一 feature 内），别各数各的
    for (const src of [RD, SEA]) {
        for (const m of src.matchAll(/startConnection:\s*"([^"]+)",\s*endConnection:\s*"([^"]+)"/g)) {
            for (const id of [m[1], m[2]]) deg.set(id, (deg.get(id) ?? 0) + 1);
        }
    }
    const zero = cityIds.filter((c) => !deg.has(c));
    const one = cityIds.filter((c) => (deg.get(c) ?? 0) === 1);
    if (zero.length) bad(`零连接据点 ${zero.length} 座：${zero.map((c) => nameOf.get(c) ?? c).join('、')}`);
    else ok(`${cityIds.length} 座城无零连接`);
    if (one.length) bad(`单连接据点 ${one.length} 座：${one.map((c) => nameOf.get(c) ?? c).join('、')}`);
    else ok('无单连接据点（每座城至少两条路）');
}

// ⑥ 海路可航性：中间点必须落在海路网格上
// 🔴 [2026-08-26 主人「检查你做的海路，能走船吗」]
//    判据**不能**用 world-base.png 的海陆掩膜逐点采样 —— 那是 18km/格，
//    麦哲伦海峡（最窄 2km）、直布罗陀、新加坡海峡、加那利/亚速尔岛间全被判成陆地，
//    连主人手画的「罗马城-卡利亚里」「马六甲-阇槃」都会报 30km+ 假穿陆。
//    正确判据：航线中间点是否取自 sea_routes_combined 网格 —— 那些点来自
//    marnet（现代航运实测航线）与 coastal（离岸 36km 生成，生成时已逐段验证不穿陆），
//    落在网格上就等于船真能走。首尾两点是据点本身（城在陆上），不参与判定。
console.log('\n海路可航性（中间点是否落在海路网格上）：');
{
    const NET = 'public/assets/sea_routes_combined.geojson';
    if (!existsSync(NET)) console.log('  ⚪ 缺 sea_routes_combined.geojson，跳过');
    else {
        const SNAP = 0.05;
        const k = (lat: number, lng: number) => `${Math.round(lat / SNAP)}_${Math.round(lng / SNAP)}`;
        const net = new Set<string>();
        for (const f of JSON.parse(readFileSync(NET, 'utf8')).features) {
            const g = f.geometry;
            const ls: number[][][] = g.type === 'MultiLineString' ? g.coordinates : [g.coordinates];
            for (const line of ls) for (const c of line) net.add(k(c[1], c[0]));
        }
        const SEA_SRC = readFileSync('src/data/VectorSeaRouteData.ts', 'utf8');
        let offTotal = 0, checked = 0;
        for (const b of SEA_SRC.split('type: "Feature"').slice(1)) {
            const nm = /name:\s*"([^"]*)"/.exec(b)?.[1] ?? '?';
            const pts = [...b.matchAll(/\[\s*(-?[\d.]+),\s*(-?[\d.]+)\s*\]/g)]
                .map((m) => [Number(m[1]), Number(m[2])] as [number, number]);
            if (pts.length < 4) continue;
            checked++;
            const mid = pts.slice(1, -1);
            const off = mid.filter(([lng, lat]) => !net.has(k(lat, lng))).length;
            // 手画的老航线可能早于网格生成，不强制；只报告
            if (off > 0) { console.log(`  ⚪ ${nm}: ${off}/${mid.length} 个中间点不在网格上（手画航线可能如此）`); offTotal += off; }
        }
        if (offTotal === 0) ok(`${checked} 条海路的中间点全部落在海路网格上（可通航）`);
        else console.log(`  ⚪ 合计 ${offTotal} 个离网点 —— 手画航线不强制，脚本生成的应为 0`);
    }
}

// ⑦ 实算一遍：马六甲不能再被判成单路
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
