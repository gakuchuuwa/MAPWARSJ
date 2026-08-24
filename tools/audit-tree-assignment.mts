/**
 * 树分配验收：全部 942 座城 × 攻城/野战 × 三季，统计每种树被用到多少次。
 *
 * 硬检查：
 *   1. 城数 < 900 或区数 < 20 → 报警（防「只测了中国城」再犯，见 §7）
 *   2. 有可用树素材一次都没被用上 → 列出来
 *   3. 有树被用到超过 40% → 报警（一棵树包打天下 = 分类没做）
 *
 * 跑法：npx tsx tools/audit-tree-assignment.mts
 */
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { setWorldBaseData, queryBaseTile } from '../src/ui/scene13/WorldBaseMap';
import { pickTree, treeTables, type TreeSeason } from '../src/ui/scene13/TreeAssignment';
import { CITIES_V2 } from '../src/data/cities_v2';

/** 素材库里**能当树用**的全部资源名。
 *  JUNGLE / RAINFOREST 是地面草丛不是树，PINE 是枯死褐松，都不在内。 */
const USABLE_TREES = [
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
];

async function main(): Promise<void> {
    const raw = await sharp('public/world/world-base.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    setWorldBaseData(new Uint8ClampedArray(raw.data), raw.info.width, raw.info.height);

    const cities = CITIES_V2;
    const regions = new Set(cities.map((c) => c.region));
    console.log(`城池 ${cities.length} 座 / 文化区 ${regions.size} 个`);
    if (cities.length < 900 || regions.size < 20) {
        console.log('🔴 城池样本不全 —— 检查是不是又只导了那四个分数组');
        process.exit(1);
    }

    const hits = new Map<string, number>();
    /** 每种树都在哪些城出现过（只留头几个，用来人眼核对） */
    const samples = new Map<string, string[]>();
    let total = 0;

    for (const c of cities) {
        for (const isSiege of [true, false]) {
            for (const season of [0, 1, 2] as TreeSeason[]) {
                const base = queryBaseTile({
                    lat: c.lat, lng: c.lng, isSiege, isWinter: season === 2,
                });
                if (!base) continue;
                const tree = pickTree({ baseTile: base, lat: c.lat, lng: c.lng, season });
                hits.set(tree, (hits.get(tree) ?? 0) + 1);
                total++;
                const s = samples.get(tree) ?? [];
                if (s.length < 4) { s.push(`${c.name}(${base})`); samples.set(tree, s); }
            }
        }
    }

    console.log(`\n共 ${total} 个组合（城 × 攻防/野战 × 三季）\n`);
    const sorted = [...hits.entries()].sort((a, b) => b[1] - a[1]);
    for (const [tree, n] of sorted) {
        const pct = (n / total * 100).toFixed(1);
        const flag = n / total > 0.40 ? ' 🔴过度集中' : '';
        console.log(`  ${tree.padEnd(20)} ${String(n).padStart(5)}  ${pct.padStart(5)}%${flag}  ${(samples.get(tree) ?? []).join(' ')}`);
    }

    const unused = USABLE_TREES.filter((t) => !hits.has(t));
    console.log(`\n用上 ${hits.size} / ${USABLE_TREES.length} 种`);
    if (unused.length) console.log(`闲置：${unused.join(', ')}`);
    else console.log('✅ 全部素材都用上了');

    // 底图覆盖：每张底图有没有配到树
    const { byBase } = treeTables();
    const bases = new Set<string>();
    for (const c of cities) for (const isSiege of [true, false]) for (const w of [false, true]) {
        const b = queryBaseTile({ lat: c.lat, lng: c.lng, isSiege, isWinter: w });
        if (b) bases.add(b);
    }
    const noTree = [...bases].filter((b) => !(b in byBase));
    if (noTree.length) console.log(`🔴 这些底图没配默认树，走了兜底：${noTree.join(', ')}`);
    else console.log(`✅ 实际用到的 ${bases.size} 张底图都配了树`);
}

main().catch((e) => { console.error(e); process.exit(1); });
