/**
 * 海图线路数据与选路口径的验收（防回归）。
 *
 * 🔴 [2026-08-25/26 主人定 C 方案：MARNET 打底 + 沿岸网，远洋惩罚我来定]
 *
 *    换掉的旧数据 public/assets/sea_routes.geojson 有两个硬伤（实测，不是印象）：
 *      · 314 条**现代渡轮** + 239 条商业航线；途经苏伊士 90 个顶点、巴拿马 48 个
 *        —— 这两条运河在游戏年代都不存在
 *      · **图碎成 152 块**，最大分量只占 34.8% —— 而这份数据不只是背景参考，
 *        SeaRouteEditor 就是拿它建图 Dijkstra 找路的，落在不同分量就直接找不到路
 *
 * 跑法：npx tsx tools/audit-sea-routes.mts
 */
import { readFileSync, existsSync } from 'node:fs';

let fail = 0;
const ok = (m: string) => console.log(`  ✅ ${m}`);
const bad = (m: string) => { console.log(`  🔴 ${m}`); fail++; };

interface Feat { properties?: Record<string, unknown>; geometry: { type: string; coordinates: unknown } }

const COMBINED = 'public/assets/sea_routes_combined.geojson';
const SRC = readFileSync('src/sea/SeaRouteEditor.ts', 'utf8');

// ── ① 编辑器必须读合并版 ──
console.log('数据源接线：');
if (!/assets\/sea_routes_combined\.geojson/.test(SRC)) {
    bad('SeaRouteEditor 没有读 sea_routes_combined.geojson');
} else ok('SeaRouteEditor 读的是合并版');
if (/fetch\(`\$\{basePath\}assets\/sea_routes\.geojson`\)/.test(SRC)) {
    bad('又切回了旧的 sea_routes.geojson（现代渡轮 + 图碎成 152 块）');
}

// ── ② 合并版的构成与连通性 ──
console.log('\n合并版数据：');
if (!existsSync(COMBINED)) {
    bad(`${COMBINED} 不存在 —— 先跑 tools/build-sea-routes-{marnet,combined}.py 与 build-coastal-searoutes.py`);
} else {
    const feats: Feat[] = JSON.parse(readFileSync(COMBINED, 'utf8')).features;
    const bySource: Record<string, number> = {};
    for (const f of feats) {
        const s = String(f.properties?.source ?? '?');
        bySource[s] = (bySource[s] ?? 0) + 1;
    }
    for (const need of ['marnet', 'coastal', 'stitch']) {
        if (!bySource[need]) bad(`缺 source=${need} 的要素 —— 三块料少一块，图就接不上`);
    }
    if (bySource.marnet && bySource.coastal && bySource.stitch) {
        ok(`三块料齐：marnet ${bySource.marnet} / coastal ${bySource.coastal} / stitch ${bySource.stitch}`);
    }

    // 运河必须已被剔除（年代不符）
    const linesOf = (g: Feat['geometry']): number[][][] =>
        g.type === 'LineString' ? [g.coordinates as number[][]]
            : g.type === 'MultiLineString' ? (g.coordinates as number[][][]) : [];
    const near = (c: number[], lng: number, lat: number, r = 1.0) =>
        Math.abs(c[0] - lng) < r && Math.abs(c[1] - lat) < r;
    let suez = 0, panama = 0;
    for (const f of feats) for (const l of linesOf(f.geometry)) for (const c of l) {
        if (near(c, 32.3, 30.0)) suez++;
        if (near(c, -79.7, 9.1)) panama++;
    }
    // 沿岸环会贴着运河两侧的海岸走，出现少量顶点是正常的；成串出现才说明运河边被放回来了
    if (suez > 30 || panama > 30) {
        bad(`运河附近顶点过多（苏伊士 ${suez} / 巴拿马 ${panama}）—— 运河边可能被放回来了`);
    } else ok(`运河已剔除（苏伊士附近 ${suez}、巴拿马附近 ${panama} 个顶点，均为沿岸环贴岸所致）`);

    // 连通性：与编辑器 buildGraphFromGeoJSON 同口径 SNAP 0.05°
    const SNAP = 0.05;
    const key = (lat: number, lng: number) => `${Math.round(lat / SNAP)}_${Math.round(lng / SNAP)}`;
    const adj = new Map<string, Set<string>>();
    const add = (a: string, b: string) => {
        if (!adj.has(a)) adj.set(a, new Set());
        adj.get(a)!.add(b);
    };
    for (const f of feats) for (const l of linesOf(f.geometry)) {
        for (let i = 0; i < l.length - 1; i++) {
            const a = key(l[i][1], l[i][0]), b = key(l[i + 1][1], l[i + 1][0]);
            if (a === b) continue;
            add(a, b); add(b, a);
        }
    }
    const seen = new Set<string>();
    let biggest = 0;
    for (const n of adj.keys()) {
        if (seen.has(n)) continue;
        const stack = [n]; seen.add(n); let c = 0;
        while (stack.length) {
            const x = stack.pop()!; c++;
            for (const y of adj.get(x) ?? []) if (!seen.has(y)) { seen.add(y); stack.push(y); }
        }
        if (c > biggest) biggest = c;
    }
    const pct = biggest / adj.size * 100;
    if (pct < 85) bad(`主网只占 ${pct.toFixed(1)}%（旧数据就是碎在这上面，34.8%）`);
    else ok(`${adj.size} 节点，主网占 ${pct.toFixed(1)}%（碎片是南北极和无城的太平洋孤岛）`);
}

// ── ③ 远洋惩罚的两条口径 ──
console.log('\n选路口径：');
const pen = /const OPEN_SEA_PENALTY = ([\d.]+)/.exec(SRC)?.[1];
if (!pen) bad('OPEN_SEA_PENALTY 不见了 —— 没有它，海路一律挑远洋直线，不符合古代航海');
else if (Number(pen) < 1) bad(`OPEN_SEA_PENALTY=${pen} < 1，成了鼓励走远洋`);
else ok(`OPEN_SEA_PENALTY = ${pen}（标定过：×2.0 起中距航线绕得过分，×1.3 又还没贴岸）`);

if (!/source === 'marnet' \? d \* OPEN_SEA_PENALTY : d/.test(SRC)) {
    bad('惩罚没有只加在 marnet 上 —— 沿岸/接驳边不该被惩罚');
} else ok('惩罚只加在 marnet（远洋主干）边上');

// 🔴 显示的航程必须是真实公里，不能是带惩罚的选路代价
if (/totalDistance: dist\.get\(endId\)/.test(SRC)) {
    bad('totalDistance 又取了带惩罚的 dist map —— 面板上的航程会凭空多报 50%');
} else if (!/realKm \+= e\.dist/.test(SRC)) {
    bad('totalDistance 没有沿路径累加 edge.dist（真实公里）');
} else ok('totalDistance 累加 edge.dist（真实公里，不含惩罚）');

if (fail) { console.log(`\n🔴 ${fail} 项不符`); process.exit(1); }
console.log('\n✅ 全部符合');
