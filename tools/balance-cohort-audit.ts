/**
 * 平衡 cohort 离群审计
 * ─────────────────────────────────────────────────────────────
 * 设计取向（主人定）：
 *   · 名将+T0 最强、普将+T4 最弱 —— 看 **概率分布**，不追「第一名」
 *   · 找出 **极不合理** 的 outlier，并归因（档位/技能/文化/关隘/守军强度等）
 *
 * 用法:
 *   npm run sim:balance-audit
 *   npm run sim:balance-audit -- --trials 15 --max-battles 20 --troops 50000
 *   npm run sim:balance-audit -- --quick   # 初筛 5 次/人，再对 outlier 加深 20 次
 */
import * as path from 'path';
import {
    parseRoster,
    buildLegion,
    runCampaign,
    cohortKey,
    type LegionData,
    type BattleLog,
} from './sim-legion-core';
import { parseRosterEliteTier } from './sim-general-lookup';
import { ELITE_TIER_MULT } from './combat-model';

function argStr(flag: string, def: string): string {
    const i = process.argv.indexOf(flag);
    return i >= 0 ? (process.argv[i + 1] || def) : def;
}
function argNum(flag: string, def: number): number {
    const i = process.argv.indexOf(flag);
    return i >= 0 ? (parseInt(process.argv[i + 1], 10) || def) : def;
}

const ROSTER_PATH = argStr('--roster',
    path.resolve(process.env.USERPROFILE || '~', 'Downloads/MAPWAR名册_2026-07-11 (1).md'));
const QUICK = process.argv.includes('--quick');
const TRIALS = argNum('--trials', QUICK ? 5 : 12);
const DEEP_TRIALS = argNum('--deep-trials', 20);
const MAX_BATTLES = argNum('--max-battles', 20);
const LEGION_TROOPS = argNum('--troops', 50000);
const Z_THRESHOLD = argNum('--z', 2.2);
const TOP_DETAIL = argNum('--top', 12);

interface GeneralStat {
    legion: LegionData;
    cohort: string;
    avgWins: number;
    stdWins: number;
    trials: number;
    best: number;
    logs: BattleLog[][];
}

function mean(xs: number[]): number {
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

function std(xs: number[]): number {
    if (xs.length < 2) return 0;
    const m = mean(xs);
    return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1));
}

function percentile(xs: number[], p: number): number {
    if (!xs.length) return 0;
    const s = [...xs].sort((a, b) => a - b);
    const idx = Math.min(s.length - 1, Math.floor(p * (s.length - 1)));
    return s[idx];
}

function runTrials(att: LegionData, pool: LegionData[], trials: number): GeneralStat {
    const winsPerTrial: number[] = [];
    const logs: BattleLog[][] = [];
    for (let t = 0; t < trials; t++) {
        const log = runCampaign(att, pool, { legionTroops: LEGION_TROOPS, maxBattles: MAX_BATTLES });
        winsPerTrial.push(log.filter(b => b.won).length);
        if (t === 0 || winsPerTrial[winsPerTrial.length - 1] === Math.max(...winsPerTrial)) {
            logs.push(log);
        }
    }
    return {
        legion: att,
        cohort: cohortKey(att),
        avgWins: mean(winsPerTrial),
        stdWins: std(winsPerTrial),
        trials,
        best: Math.max(...winsPerTrial),
        logs,
    };
}

interface BattleFactors {
    n: number;
    passPct: number;
    centerPct: number;
    vsFamousPct: number;
    avgDefTroops: number;
    avgDefEliteTier: number;
    lossPassPct: number;
    lossCenterPct: number;
    lossAvgDefTroops: number;
}

function analyzeBattles(battles: BattleLog[]): BattleFactors {
    const n = battles.length;
    if (!n) {
        return { n: 0, passPct: 0, centerPct: 0, vsFamousPct: 0, avgDefTroops: 0, avgDefEliteTier: 0, lossPassPct: 0, lossCenterPct: 0, lossAvgDefTroops: 0 };
    }
    const losses = battles.filter(b => !b.won);
    const avgElite = mean(battles.map(b => b.defEliteTier ?? 4));
    return {
        n,
        passPct: battles.filter(b => b.defPass).length / n,
        centerPct: battles.filter(b => b.defCenter).length / n,
        vsFamousPct: battles.filter(b => b.defFamous).length / n,
        avgDefTroops: mean(battles.map(b => b.defTroops)),
        avgDefEliteTier: avgElite,
        lossPassPct: losses.length ? losses.filter(b => b.defPass).length / losses.length : 0,
        lossCenterPct: losses.length ? losses.filter(b => b.defCenter).length / losses.length : 0,
        lossAvgDefTroops: losses.length ? mean(losses.map(b => b.defTroops)) : 0,
    };
}

function flattenLogs(stats: GeneralStat): BattleLog[] {
    return stats.logs.flat();
}

function formatAttackerFactors(l: LegionData): string {
    const et = l.eliteTier === null ? '无' : `T${l.eliteTier}(×${l.eliteTier !== null ? ELITE_TIER_MULT[l.eliteTier] : 1})`;
    return [
        `${l.tier}`,
        `精锐${et}`,
        `文化攻×${l.cultureField}`,
        `三势${l.aptitude}`,
        l.strategicName ? `战略${l.strategicName}` : '无战略',
        l.tacticalName ? `战术${l.tacticalName}` : '无战术',
    ].join(' | ');
}

function main() {
    console.log('加载名册…');
    const entries = parseRoster(ROSTER_PATH);
    const pool = entries.map(buildLegion);
    console.log(`全图 ${pool.length} 势力 | 5万军团 | 最多${MAX_BATTLES}战/轮 | ${TRIALS}次MC${QUICK ? '（quick）' : ''}\n`);

    const stats: GeneralStat[] = [];
    for (let i = 0; i < pool.length; i++) {
        if (i > 0 && i % 40 === 0) process.stderr.write(`  …${i}/${pool.length}\n`);
        stats.push(runTrials(pool[i], pool, TRIALS));
    }

    // cohort 基准
    const byCohort = new Map<string, GeneralStat[]>();
    for (const s of stats) {
        const arr = byCohort.get(s.cohort) ?? [];
        arr.push(s);
        byCohort.set(s.cohort, arr);
    }

    const cohortMedian = new Map<string, number>();
    const cohortStd = new Map<string, number>();
    for (const [k, arr] of byCohort) {
        cohortMedian.set(k, percentile(arr.map(a => a.avgWins), 0.5));
        cohortStd.set(k, Math.max(0.6, std(arr.map(a => a.avgWins))));
    }

    const anchorHigh = stats.filter(s => s.legion.tier === '名将' && s.legion.eliteTier === 0);
    const anchorLow = stats.filter(s => s.legion.tier !== '名将' && s.legion.eliteTier === 4);
    const highMed = percentile(anchorHigh.map(s => s.avgWins), 0.5);
    const lowMed = percentile(anchorLow.map(s => s.avgWins), 0.5);
    const highP25 = percentile(anchorHigh.map(s => s.avgWins), 0.25);
    const lowP75 = percentile(anchorLow.map(s => s.avgWins), 0.75);

    interface Scored { s: GeneralStat; z: number; residual: number; flags: string[] }
    const scored: Scored[] = stats.map(s => {
        const med = cohortMedian.get(s.cohort) ?? 0;
        const sd = cohortStd.get(s.cohort) ?? 1;
        const z = (s.avgWins - med) / sd;
        const residual = s.avgWins - med;
        const flags: string[] = [];
        if (s.legion.tier !== '名将' && s.legion.eliteTier === 4 && s.avgWins > highP25) {
            flags.push(`普将T4高于名将T0下四分位(${highP25.toFixed(1)})`);
        }
        if (s.legion.tier === '名将' && s.legion.eliteTier === 0 && s.avgWins < lowP75) {
            flags.push(`名将T0低于普将T4上四分位(${lowP75.toFixed(1)})`);
        }
        if (Math.abs(z) >= Z_THRESHOLD) flags.push(`cohort内|z|≥${Z_THRESHOLD}`);
        return { s, z, residual, flags };
    });

    const outliers = scored
        .filter(x => x.flags.length > 0)
        .sort((a, b) => Math.abs(b.z) - Math.abs(a.z));

    // 全池 battle 因子基准（用于对比）
    const globalBattles = stats.flatMap(s => flattenLogs(s));
    const globalF = analyzeBattles(globalBattles);

    console.log('═'.repeat(72));
    console.log('  📊 Cohort 基准（均胜场 / 20战封顶）');
    console.log('═'.repeat(72));
    const cohortOrder = ['名将+T0', '名将+T1', '名将+T2', '名将+T3', '名将+T4', '名将+无精',
        '普将+T0', '普将+T1', '普将+T2', '普将+T3', '普将+T4', '普将+无精'];
    for (const k of cohortOrder) {
        const arr = byCohort.get(k);
        if (!arr?.length) continue;
        const avgs = arr.map(a => a.avgWins);
        console.log(`  ${k.padEnd(10)} n=${String(arr.length).padStart(3)}  中位${percentile(avgs, 0.5).toFixed(1)}  P25~P75 ${percentile(avgs, 0.25).toFixed(1)}~${percentile(avgs, 0.75).toFixed(1)}`);
    }
    console.log(`\n  锚点：名将+T0 中位 ${highMed.toFixed(1)} | 普将+T4 中位 ${lowMed.toFixed(1)}  （方向：前者应整体高于后者，允许重叠）`);

    console.log('\n' + '═'.repeat(72));
    console.log(`  🚨 极不合理 outlier（${outliers.length} 条，|z|≥${Z_THRESHOLD} 或 锚点倒挂）`);
    console.log('═'.repeat(72));

    if (!outliers.length) {
        console.log('  ✅ 未发现超阈值 outlier（可加大 --trials 或降低 --z 再扫）\n');
        return;
    }

    // quick 模式：对 outlier 加深并重算 z / flags
    if (QUICK && outliers.length) {
        console.log(`\n  ↻ 对 top ${Math.min(TOP_DETAIL, outliers.length)} outlier 加深 ${DEEP_TRIALS} 次…`);
        for (let i = 0; i < Math.min(TOP_DETAIL, outliers.length); i++) {
            const deep = runTrials(outliers[i].s.legion, pool, DEEP_TRIALS);
            outliers[i].s = deep;
            const med = cohortMedian.get(deep.cohort) ?? 0;
            const sd = cohortStd.get(deep.cohort) ?? 1;
            outliers[i].z = (deep.avgWins - med) / sd;
            outliers[i].residual = deep.avgWins - med;
            outliers[i].flags = [];
            if (deep.legion.tier !== '名将' && deep.legion.eliteTier === 4 && deep.avgWins > highP25) {
                outliers[i].flags.push(`普将T4高于名将T0下四分位(${highP25.toFixed(1)})`);
            }
            if (deep.legion.tier === '名将' && deep.legion.eliteTier === 0 && deep.avgWins < lowP75) {
                outliers[i].flags.push(`名将T0低于普将T4上四分位(${lowP75.toFixed(1)})`);
            }
            if (Math.abs(outliers[i].z) >= Z_THRESHOLD) {
                outliers[i].flags.push(`cohort内|z|≥${Z_THRESHOLD}`);
            }
        }
    }

    for (let i = 0; i < Math.min(TOP_DETAIL, outliers.length); i++) {
        const { s, z, residual, flags } = outliers[i];
        const l = s.legion;
        const battles = flattenLogs(s);
        const f = analyzeBattles(battles);
        const dir = z > 0 ? '⚠偏强' : '⚠偏弱';

        console.log(`\n  ${(i + 1).toString().padStart(2)}. ${dir} ${l.name} @ ${l.city}  cohort=${s.cohort}`);
        console.log(`      均胜 ${s.avgWins.toFixed(1)}（cohort中位${(cohortMedian.get(s.cohort) ?? 0).toFixed(1)}，Δ${residual >= 0 ? '+' : ''}${residual.toFixed(1)}，z=${z.toFixed(2)}）`);
        console.log(`      ${formatAttackerFactors(l)}`);
        console.log(`      触发：${flags.join('；')}`);

        console.log('      对手环境（本轮样本） vs 全池：');
        console.log(`        关隘 ${(f.passPct * 100).toFixed(0)}% vs ${(globalF.passPct * 100).toFixed(0)}% | 中心 ${(f.centerPct * 100).toFixed(0)}% vs ${(globalF.centerPct * 100).toFixed(0)}% | 守方名将 ${(f.vsFamousPct * 100).toFixed(0)}% vs ${(globalF.vsFamousPct * 100).toFixed(0)}%`);
        console.log(`        守军均 ${Math.round(f.avgDefTroops).toLocaleString()} vs ${Math.round(globalF.avgDefTroops).toLocaleString()} | 守方精锐档均 ${f.avgDefEliteTier.toFixed(1)} vs ${globalF.avgDefEliteTier.toFixed(1)}`);

        const loss = battles.find(b => !b.won);
        if (loss) {
            console.log(`      首败：${loss.city}(${loss.type}) 守${loss.defender} ${loss.defTroops.toLocaleString()}兵 ${loss.defElite} | ${loss.defPass ? '关隘' : ''}${loss.defCenter ? '中心' : ''} | ${loss.terrain}`);
        }

        const suspects: string[] = [];
        if (l.strategicSkillId === 'str_03') suspects.push('战略S③所向披靡(攻×1.5)');
        if (l.strategicSkillId === 'str_07') suspects.push('战略S⑦因粮于敌(胜后膨胀)');
        if (l.strategicSkillId === 'str_13') suspects.push('战略S⑬以战养战(续航)');
        if (l.tacticalSkillId && ['ts_003', 'ts_004'].includes(l.tacticalSkillId)) suspects.push(`开局战术${l.tacticalName}(×1.2战力)`);
        if (l.cultureField >= 1.15) suspects.push(`高文化军团攻×${l.cultureField}`);
        if (l.cultureField <= 0.85) suspects.push(`低文化军团攻×${l.cultureField}`);
        if (l.eliteTier === 0) suspects.push('T0精锐×1.5');
        if (l.eliteTier === 4 && l.tier !== '名将') suspects.push('普将+T4地板档');
        if (f.lossPassPct > 0.5 && z < 0) suspects.push('首败多遇关隘');
        if (f.lossAvgDefTroops > globalF.avgDefTroops * 1.15 && z < 0) suspects.push('首败守军偏厚');
        if (suspects.length) console.log(`      可能主因：${suspects.join('；')}`);
    }

    console.log('\n' + '─'.repeat(72));
    console.log('  说明：排名是概率结果，不是设计目标；outlier 优先查 **技能ID/文化攻/关隘样本/守军随机**');
    console.log('  建议：确认 outlier 后改 **技能 magnitude 或档位**，勿为排名改坐标/名册归属\n');
}

main();
