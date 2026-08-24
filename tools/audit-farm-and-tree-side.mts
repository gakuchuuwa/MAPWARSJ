/**
 * 两条真实性规则的验收（主人 2026-08-24 定）：
 *   1. **野战不出农田/牧场** —— 牧场是人围出来放牲口的地，只在城郊；野外荒原不该有。
 *   2. **攻城战的树尽量在左边（攻方那侧）** —— 右侧要摆城池，树别挡住城。
 *      野战不偏：没有城要护，偏了右半会光秃。
 *
 * 🔴 pm1/pm2 才是牧场（看图确认：pm1 茂密绿牧草+白花，pm2 荒废牧场黄土）。
 *    pc1~pc3 是**自然干草地**（土黄底+稀疏草丛，三张只是草量梯度），不算，别一起禁。
 *
 * 跑法：npx tsx tools/audit-farm-and-tree-side.mts
 */
import sharp from 'sharp';
import { setWorldBaseData } from '../src/ui/scene13/WorldBaseMap';
import { generateEnvironment } from '../src/ui/scene13/Scene13EnvironmentGenerator';
import { CITIES_V2 } from '../src/data/cities_v2';

const PASTURE = new Set(['pm1', 'pm2']);
const TREES = new Set([
    'OAK', 'GREEN_OAK', 'AUTUMN_OAK', 'SNOW_AUTUMN_OAK', 'ASIAN_MAPLE_GREEN', 'ASIAN_MAPLE_AUTUMN',
    'BIRCH_GREEN', 'BIRCH_AUTUMN', 'BIRCH_WINTER', 'ASIAN_PINE', 'SNOW_PINE', 'ITALIAN_PINE',
    'MONKEY_PUZZLE', 'CYPRESS', 'CYPRESS_DEC', 'OLIVE', 'PEACH_BLOSSOM', 'PALM', 'WAX_PALM',
    'DRAGON_TREE', 'BAOBAB', 'ACACIA', 'BAMBOO', 'LUSH_BAMBOO', 'MANGROVE', 'BRAZILWOOD',
    'WILLOW', 'DEAD_TREE',
    'SCENARIO_TREE_A', 'SCENARIO_TREE_B', 'SCENARIO_TREE_C', 'SCENARIO_TREE_D', 'SCENARIO_TREE_E',
    'SCENARIO_TREE_F', 'SCENARIO_TREE_G', 'SCENARIO_TREE_H', 'SCENARIO_TREE_I', 'SCENARIO_TREE_J',
    'SCENARIO_TREE_K', 'SCENARIO_TREE_L',
]);

const VW = 2000, VH = 1080;

async function main(): Promise<void> {
    const raw = await sharp('public/world/world-base.png').ensureAlpha().raw()
        .toBuffer({ resolveWithObject: true });
    setWorldBaseData(new Uint8ClampedArray(raw.data), raw.info.width, raw.info.height);

    const acc = {
        siege: { figs: 0, pasture: 0, left: 0, right: 0 },
        field: { figs: 0, pasture: 0, left: 0, right: 0 },
    };

    for (const c of CITIES_V2.filter((_, i) => i % 7 === 0)) {
        for (const isSiege of [true, false]) {
            const plan = generateEnvironment({
                width: VW, height: VH, lat: c.lat, lng: c.lng,
                seed: `${c.id}-side`, isSiege, getCalendarSeason: () => 0,
            });
            const a = isSiege ? acc.siege : acc.field;
            a.figs++;
            for (const p of plan.terrainPatches) {
                if (PASTURE.has(p.tile)) a.pasture += p.cells.length;
            }
            for (const o of plan.objects) {
                if (!TREES.has(o.asset)) continue;
                if (o.x <= VW * 0.5) a.left++; else a.right++;
            }
        }
    }

    let fail = 0;
    for (const [k, a] of Object.entries(acc)) {
        const name = k === 'siege' ? '攻城战' : '野战  ';
        const tot = a.left + a.right;
        const pct = tot ? (a.left / tot * 100) : 0;
        console.log(`${name}  ${a.figs} 张   牧场格 ${a.pasture}   树 左 ${a.left} / 右 ${a.right}  →  左占 ${pct.toFixed(0)}%`);
    }

    if (acc.field.pasture > 0) {
        console.log(`🔴 野战出现了 ${acc.field.pasture} 格牧场（pm1/pm2）—— 野外荒原不该有人工牧场`);
        fail++;
    } else console.log('✅ 野战零牧场');

    const sLeft = acc.siege.left / (acc.siege.left + acc.siege.right);
    if (sLeft < 0.65) {
        console.log(`🔴 攻城战树只有 ${(sLeft * 100).toFixed(0)}% 在左侧 —— 右侧要摆城池，树该偏向攻方那边`);
        fail++;
    } else console.log(`✅ 攻城战树 ${(sLeft * 100).toFixed(0)}% 在左侧（攻方那侧）`);

    const fLeft = acc.field.left / (acc.field.left + acc.field.right);
    if (fLeft > 0.65) {
        console.log(`🔴 野战树也偏到了左侧 ${(fLeft * 100).toFixed(0)}% —— 野战没有城要护，不该偏`);
        fail++;
    } else console.log(`✅ 野战树左右均衡（左 ${(fLeft * 100).toFixed(0)}%）`);

    if (fail) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
