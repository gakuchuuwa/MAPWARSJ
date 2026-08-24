/**
 * 树密度实测：跑真实城池，数每张图实际长了多少棵树。
 *
 * 🔴 只能实测，不能算。树先按预算生成，再被间距剔除、被走廊剔除、
 *    被屏幕外剔除，账面预算和落地棵数差得远（见 §7「森林预算按 gw*gh 算」那条）。
 *
 * 跑法：npx tsx tools/audit-tree-density.mts
 */
import sharp from 'sharp';
import { setWorldBaseData, queryBaseTile } from '../src/ui/scene13/WorldBaseMap';
import { generateEnvironment } from '../src/ui/scene13/Scene13EnvironmentGenerator';
import { CITIES_V2 } from '../src/data/cities_v2';

const TREE_ASSETS = new Set([
    'OAK', 'GREEN_OAK', 'AUTUMN_OAK', 'SNOW_AUTUMN_OAK',
    'ASIAN_MAPLE_GREEN', 'ASIAN_MAPLE_AUTUMN',
    'BIRCH_GREEN', 'BIRCH_AUTUMN', 'BIRCH_WINTER',
    'ASIAN_PINE', 'SNOW_PINE', 'ITALIAN_PINE', 'MONKEY_PUZZLE',
    'CYPRESS', 'CYPRESS_DEC', 'OLIVE', 'PEACH_BLOSSOM',
    'PALM', 'WAX_PALM', 'DRAGON_TREE', 'BAOBAB', 'ACACIA',
    'BAMBOO', 'LUSH_BAMBOO', 'MANGROVE', 'BRAZILWOOD', 'WILLOW', 'DEAD_TREE',
    'SCENARIO_TREE_A', 'SCENARIO_TREE_B', 'SCENARIO_TREE_C', 'SCENARIO_TREE_D',
    'SCENARIO_TREE_E', 'SCENARIO_TREE_F', 'SCENARIO_TREE_G', 'SCENARIO_TREE_H',
    'SCENARIO_TREE_I', 'SCENARIO_TREE_J', 'SCENARIO_TREE_K', 'SCENARIO_TREE_L',
]);

/** 每个底图抽这么多座城来量 */
const SAMPLE_PER_BASE = 12;

async function main(): Promise<void> {
    const raw = await sharp('public/world/world-base.png').ensureAlpha().raw()
        .toBuffer({ resolveWithObject: true });
    setWorldBaseData(new Uint8ClampedArray(raw.data), raw.info.width, raw.info.height);

    // 按底图归拢城池，每张底图抽样，保证每种气候都量到
    const byBase = new Map<string, typeof CITIES_V2>();
    for (const c of CITIES_V2) {
        for (const isSiege of [true, false]) {
            const b = queryBaseTile({ lat: c.lat, lng: c.lng, isSiege, isWinter: false });
            if (!b) continue;
            const arr = byBase.get(b) ?? [];
            if (arr.length < SAMPLE_PER_BASE * 3) { arr.push(c); byBase.set(b, arr); }
        }
    }

    console.log(`底图 ${byBase.size} 张\n`);
    console.log('底图'.padEnd(20) + '树数(均/最小~最大)'.padEnd(24) + '样本城');

    /** 攻城战里出现了枯树 = 违反「城郊不留枯木」，必须为 0 */
    let siegeDeadTrees = 0;

    const rows: Array<[string, number, number, number, string]> = [];
    for (const [base, cities] of byBase) {
        const counts: number[] = [];
        const names: string[] = [];
        for (const c of cities.slice(0, SAMPLE_PER_BASE)) {
            const isSiege = queryBaseTile({ lat: c.lat, lng: c.lng, isSiege: true, isWinter: false }) === base;
            // 🔴 参数名是 width/height；别用 as never 断言掩盖类型错误，
            //    上一版就是这么把「全局 2 棵树」的假数据量出来的。
            const plan = generateEnvironment({
                width: 2000, height: 1080,
                lat: c.lat, lng: c.lng,
                seed: `${c.id}-density`,
                isSiege,
                getCalendarSeason: () => 0,
            });
            const objs = plan.objects as Array<{ asset: string }>;
            const n = objs.filter((o) => TREE_ASSETS.has(o.asset)).length;
            if (isSiege) siegeDeadTrees += objs.filter((o) => o.asset === 'DEAD_TREE').length;
            counts.push(n);
            if (names.length < 3) names.push(c.name);
        }
        if (!counts.length) continue;
        const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
        rows.push([base, avg, Math.min(...counts), Math.max(...counts), names.join(' ')]);
    }

    rows.sort((a, b) => b[1] - a[1]);
    for (const [base, avg, lo, hi, names] of rows) {
        const bar = '█'.repeat(Math.round(avg / 4));
        console.log(`${base.padEnd(20)}${avg.toFixed(1).padStart(6)} (${lo}~${hi})`.padEnd(44)
            + `${names}  ${bar}`);
    }
    const all = rows.map((r) => r[1]);
    console.log(`\n全局均值 ${(all.reduce((a, b) => a + b, 0) / all.length).toFixed(1)} 棵/图`);

    console.log(siegeDeadTrees === 0
        ? '✅ 攻城战零枯树'
        : `🔴 攻城战出现了 ${siegeDeadTrees} 棵枯树 —— 城郊的枯木该被拾去烧柴了`);

    // 攻城战该比野战稀（城郊被砍伐开垦）。挑几座城直接对比同一坐标的两种战斗。
    console.log('\n攻城战 vs 野战（同一座城）：');
    let inverted = 0;
    for (const c of CITIES_V2.filter((_, i) => i % 57 === 0).slice(0, 8)) {
        const count = (isSiege: boolean): number => {
            const plan = generateEnvironment({
                width: 2000, height: 1080, lat: c.lat, lng: c.lng,
                seed: `${c.id}-cmp`, isSiege, getCalendarSeason: () => 0,
            });
            return (plan.objects as Array<{ asset: string }>)
                .filter((o) => TREE_ASSETS.has(o.asset)).length;
        };
        const sg = count(true), fd = count(false);
        if (sg > fd) inverted++;
        console.log(`  ${c.name.padEnd(10)} 攻城 ${String(sg).padStart(3)}   野战 ${String(fd).padStart(3)}`
            + (sg > fd ? '   🔴 攻城战反而更多' : ''));
    }
    if (inverted) console.log(`🔴 ${inverted} 座城的攻城战树比野战多`);
}

main().catch((e) => { console.error(e); process.exit(1); });
