/**
 * 跟随军团测试器（7×10 名将技组合）
 * ───────────────────────────────────────────────────────────────
 * 场景：跟拍名将军团（默认 40000，攻方）对战普将据点（默认 10000，守方，武将技随机）。
 *   名将 = 1 战略技(S①/S③/S④/S⑤/S⑥/S⑦/S⑧) + 1 战术技(①–⑩) → 7×10 = 70 种组合。
 *   逐一模拟，看 70 组的胜率 / 存活率「哪个差别最大」，用于评估跟随军团续航与技能平衡。
 *
 * 运行： npm run sim:follow
 *        npx tsx tools/follow-legion-test.ts --trials 5000
 *        npx tsx tools/follow-legion-test.ts --legion 40000 --enemy 10000 --terrain plain
 *        npx tsx tools/follow-legion-test.ts --terrain mountain   （测 S⑤居高临下命中）
 *
 * 战斗数学见 tools/combat-model.ts（与游戏源同步）。存活率 = 名将军团胜局平均存活兵力 / 开战兵力。
 */

import {
    TACTICAL_SKILL_CATALOG, STRATEGIC_SKILL_CATALOG, simConfig, aggregate,
    type UnitSpec, type Terrain,
} from './combat-model';

function argNum(flag: string, def: number): number {
    const i = process.argv.indexOf(flag);
    return i >= 0 ? (parseFloat(process.argv[i + 1]) || def) : def;
}
function argStr(flag: string, def: string): string {
    const i = process.argv.indexOf(flag);
    return i >= 0 ? (process.argv[i + 1] || def) : def;
}

const LEGION_TROOPS = argNum('--legion', 40000);
const ENEMY_TROOPS = argNum('--enemy', 10000);
const TRIALS = Math.max(500, argNum('--trials', 4000));
const TERRAIN = argStr('--terrain', 'plain') as Terrain;
const LEGION_REGION = argStr('--legion-region', 'CENTRAL');
const ENEMY_REGION = argStr('--enemy-region', 'CENTRAL');

// 7 战略格（str_02 已并入 str_03）× 10 战术格
const STRAT_IDS = ['str_01', 'str_03', 'str_04', 'str_05', 'str_06', 'str_07', 'str_08'];
const TAC_IDS = ['tac_01', 'tac_02', 'tac_03', 'tac_04', 'tac_05', 'tac_06', 'tac_07', 'tac_08', 'tac_09', 'tac_10'];

const gridOf = (id: string) => (STRATEGIC_SKILL_CATALOG[id]?.grid ?? TACTICAL_SKILL_CATALOG[id]?.grid ?? id);
const nameOf = (id: string) => (STRATEGIC_SKILL_CATALOG[id]?.displayName ?? TACTICAL_SKILL_CATALOG[id]?.displayName ?? id);

/** 名将军团（攻方） */
function legion(strat: string, tac: string): UnitSpec {
    return {
        troops: LEGION_TROOPS, region: LEGION_REGION, role: 'field',
        general: { tier: 'famous', tacticalSkillId: tac, strategicSkillId: strat },
    };
}
/** 普将据点（守方，随机战术技） */
function enemy(): UnitSpec {
    const rndTac = TAC_IDS[Math.floor(Math.random() * TAC_IDS.length)];
    return {
        troops: ENEMY_TROOPS, region: ENEMY_REGION, role: 'garrison',
        general: { tier: 'ordinary', tacticalSkillId: rndTac },
    };
}

interface Cell { strat: string; tac: string; winRate: number; survRate: number; }

function run(): Cell[] {
    const cells: Cell[] = [];
    for (const strat of STRAT_IDS) {
        for (const tac of TAC_IDS) {
            // 敌方每局随机战术技：aggregate 内部每 trial 都会重新 clone spec，但随机需每局重掷。
            // 用一个每次调用都返回新随机敌方的包装：改为直接在此循环内跑蒙特卡洛。
            let wins = 0, survSum = 0;
            for (let i = 0; i < TRIALS; i++) {
                const r = aggregate([legion(strat, tac)], [enemy()], 1, TERRAIN);
                if (r.attackerWinRate >= 1) { wins++; survSum += r.attackerAvgSurvivorsOnWin; }
            }
            cells.push({
                strat, tac,
                winRate: wins / TRIALS,
                survRate: wins > 0 ? survSum / wins / LEGION_TROOPS : 0,
            });
        }
    }
    return cells;
}

function pct(x: number, w = 6): string { return (x * 100).toFixed(1).padStart(w - 1) + '%'; }

function printGrid(title: string, cells: Cell[], pick: (c: Cell) => number): void {
    console.log(`\n\x1b[1m${title}\x1b[0m`);
    console.log('  战略\\战术 ' + TAC_IDS.map((t) => gridOf(t).padStart(7)).join(''));
    for (const strat of STRAT_IDS) {
        const label = `${gridOf(strat)}${nameOf(strat)}`.padEnd(9);
        const row = TAC_IDS.map((tac) => {
            const c = cells.find((x) => x.strat === strat && x.tac === tac)!;
            return pct(pick(c)).padStart(7);
        }).join('');
        console.log(`  ${label} ${row}`);
    }
}

function main(): void {
    console.log(`\n跟随军团测试器  —  名将军团 ${LEGION_TROOPS}(攻·${LEGION_REGION}) vs 普将据点 ${ENEMY_TROOPS}(守·${ENEMY_REGION}·随机战术技)`);
    console.log(`地形 ${TERRAIN}  逆局阈值 ${simConfig.comebackThreshold}  每格 ${TRIALS.toLocaleString()} 局  兵力比 ${(LEGION_TROOPS / ENEMY_TROOPS).toFixed(1)}:1`);
    console.log('说明：胜率=名将军团获胜比例；存活率=胜局平均剩余兵力/开战兵力（越高=跟随军团越耐打，越不用换）');

    const cells = run();

    printGrid('胜率（7 战略 × 10 战术）', cells, (c) => c.winRate);
    printGrid('存活率（胜局剩余兵力 / 开战兵力）', cells, (c) => c.survRate);

    // ── 差别分析 ──
    const wr = cells.map((c) => c.winRate);
    const sr = cells.map((c) => c.survRate);
    const min = (a: number[]) => Math.min(...a);
    const max = (a: number[]) => Math.max(...a);
    const byWin = [...cells].sort((a, b) => a.winRate - b.winRate);
    const bySurv = [...cells].sort((a, b) => a.survRate - b.survRate);
    const tag = (c: Cell) => `${gridOf(c.strat)}${nameOf(c.strat)}+${gridOf(c.tac)}${nameOf(c.tac)}`;

    console.log('\n\x1b[1m差别最大分析\x1b[0m');
    console.log(`  胜率：最高 ${pct(max(wr))}  最低 ${pct(min(wr))}  极差 ${pct(max(wr) - min(wr))}`);
    console.log(`        最强组合 ${tag(byWin[byWin.length - 1])} = ${pct(byWin[byWin.length - 1].winRate)}`);
    console.log(`        最弱组合 ${tag(byWin[0])} = ${pct(byWin[0].winRate)}`);
    console.log(`  存活率：最高 ${pct(max(sr))}  最低 ${pct(min(sr))}  极差 ${pct(max(sr) - min(sr))}`);
    console.log(`        最耐打 ${tag(bySurv[bySurv.length - 1])} = ${pct(bySurv[bySurv.length - 1].survRate)}`);
    console.log(`        最脆弱 ${tag(bySurv[0])} = ${pct(bySurv[0].survRate)}`);
    console.log('');
}

main();
