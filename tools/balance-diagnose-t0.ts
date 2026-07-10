/**
 * 单点诊断：名将+T0 为何整体弱于 T1（只读名册 + 15 次 MC）
 * npm run sim:diagnose-t0
 */
import * as path from 'path';
import { parseRoster, buildLegion, runCampaign } from './sim-legion-core';

function argStr(flag: string, def: string): string {
    const i = process.argv.indexOf(flag);
    return i >= 0 ? (process.argv[i + 1] || def) : def;
}

const ROSTER_PATH = argStr('--roster',
    path.resolve(process.env.USERPROFILE || '~', 'Downloads/MAPWAR名册_2026-07-11 (1).md'));
const TRIALS = 15;
const opts = { legionTroops: 50000, maxBattles: 20 };

function runCohort(pool: ReturnType<typeof buildLegion>[], filter: (l: ReturnType<typeof buildLegion>) => boolean) {
    const list = pool.filter(filter);
    const rows = list.map(l => {
        let sum = 0;
        for (let t = 0; t < TRIALS; t++) {
            sum += runCampaign(l, pool, opts).filter(b => b.won).length;
        }
        return { legion: l, avg: sum / TRIALS };
    }).sort((a, b) => b.avg - a.avg);
    const avgs = rows.map(r => r.avg);
    const med = avgs.length ? avgs[Math.floor(avgs.length / 2)] : 0;
    return { n: list.length, med, rows };
}

function main() {
    const pool = parseRoster(ROSTER_PATH).map(buildLegion);
    const t0 = runCohort(pool, l => l.tier === '名将' && l.eliteTier === 0);
    const t1 = runCohort(pool, l => l.tier === '名将' && l.eliteTier === 1);

    console.log(`\n名将+T0  n=${t0.n}  中位均胜 ${t0.med.toFixed(1)} / 20战 (${TRIALS}次MC)`);
    for (const { legion: l, avg } of t0.rows) {
        console.log(`  ${avg.toFixed(1).padStart(4)}  ${l.name.padEnd(8)} @ ${l.city.padEnd(6)} 文化×${l.cultureField}  ${l.strategicName}  ${l.eliteName}`);
    }

    console.log(`\n名将+T1  n=${t1.n}  中位均胜 ${t1.med.toFixed(1)} / 20战`);
    console.log('  top5:');
    for (const { legion: l, avg } of t1.rows.slice(0, 5)) {
        console.log(`  ${avg.toFixed(1).padStart(4)}  ${l.name}  ${l.strategicName}  ${l.eliteName}`);
    }
    console.log('  bottom5:');
    for (const { legion: l, avg } of t1.rows.slice(-5)) {
        console.log(`  ${avg.toFixed(1).padStart(4)}  ${l.name}  ${l.strategicName}  ${l.eliteName}`);
    }

    const t0avg = t0.rows.reduce((s, r) => s + r.legion.cultureField, 0) / t0.n;
    const t1avg = t1.rows.reduce((s, r) => s + r.legion.cultureField, 0) / t1.n;
    console.log(`\n文化攻均值：T0 ${t0avg.toFixed(3)} | T1 ${t1avg.toFixed(3)}`);
    console.log(`S③ 人数：T0 ${t0.rows.filter(r => r.legion.strategicSkillId === 'str_03').length} | T1 ${t1.rows.filter(r => r.legion.strategicSkillId === 'str_03').length}`);
    console.log('\n若 T0 中位仍低于 T1 → 下一步查 **连战续航**（S⑦/S⑬）或 **T0 样本方差**，勿先动文化表。\n');
}

main();
