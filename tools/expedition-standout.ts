/**
 * 远征"突出名将"分析（直播向核心验证）
 * ───────────────────────────────────────────────────────────────
 * 回答两个问题：
 *   1. 突出度：名将+精锐远征，存活率比普将基线高多少？（越高越好看）
 *   2. 目标达成率：名将+精锐能否稳定通关"随机远征目标"（连胜 N 场）？
 *
 * 三档对比（同为 5 万进攻方，连续打 1 万普将，打到覆没）：
 *   A 普将基线   ordinary + 随机战术技 + 无战略 + 无精锐
 *   B 名将(当前) famous  + 本人技能    + 无精锐   ← 现行 expedition-sim 测的口径
 *   C 名将+精锐  famous  + 本人技能    + T0精锐(×1.5战力/+2威慑) ← 直播真实场景
 *
 * 运行：npx tsx --import ./tools/sim-preload.mjs tools/expedition-standout.ts
 *       可加 --trials 200 --elite 0
 */
import { simulateOnce, type UnitSpec, type Terrain } from './combat-model';
import {
    GENERAL_PROFILES,
    STRATEGIC_SKILL_CATALOG,
    getStrategicSkillDef,
    TACTICAL_SKILL_ENTRIES_V1,
} from '../src/data/GeneralSkills';
import { FACTION_GENERALS } from '../src/data/FactionGenerals';

function argNum(flag: string, def: number): number {
    const i = process.argv.indexOf(flag);
    return i >= 0 ? parseFloat(process.argv[i + 1]) || def : def;
}

const LEGION_TROOPS = 50000;
const ENEMY_TROOPS = 10000;
const MAX_TROOPS = 100000;
const HARD_CAP = 60;
const REGION = 'CENTRAL';
const TRIALS = argNum('--trials', 200);
const ELITE_TIER = argNum('--elite', 0); // T0=0
const FIELD_RESUPPLY_RATIO = 0.15;

const TERRAINS: { t: Terrain; w: number }[] = [
    { t: 'plain', w: 0.55 }, { t: 'mountain', w: 0.40 }, { t: 'sea', w: 0.05 },
];
function randomTerrain(): Terrain {
    const r = Math.random(); let acc = 0;
    for (const x of TERRAINS) { acc += x.w; if (r < acc) return x.t; }
    return 'plain';
}
const ALL_TS = TACTICAL_SKILL_ENTRIES_V1.map((e) => e.id);
function randomTs(): string { return ALL_TS[(Math.random() * ALL_TS.length) | 0]; }

const generalNameById = new Map<string, string>();
for (const [, g] of Object.entries(FACTION_GENERALS)) generalNameById.set(g.generalId, g.generalName);

function applyStrategicSustain(survivors: number, lost: number, strId?: string): number {
    let t = survivors;
    const str = strId ? getStrategicSkillDef(strId) : null;
    if (str?.effect === 'post_battle_troop_pct') t += Math.floor(t * str.magnitude);
    else if (str?.hiddenPostBattlePct && str.hiddenPostBattlePct > 0) t += Math.floor(t * str.hiddenPostBattlePct);
    if (str?.effect === 'field_resupply') t += Math.floor(Math.max(0, lost) * FIELD_RESUPPLY_RATIO);
    return Math.min(t, MAX_TROOPS);
}

interface LegionCfg {
    tier: 'famous' | 'ordinary';
    tacticalSkillId?: string;   // undefined = 每场随机（普将基线用）
    strategicSkillId?: string;
    eliteTier?: number | null;  // null = 无精锐
}

function runOne(cfg: LegionCfg): number {
    let troops = LEGION_TROOPS;
    let battles = 0;
    while (battles < HARD_CAP) {
        const legion: UnitSpec = {
            troops, maxTroops: MAX_TROOPS, region: REGION, role: 'field',
            eliteTier: cfg.eliteTier ?? null,
            general: { tier: cfg.tier, tacticalSkillId: cfg.tacticalSkillId ?? randomTs(), strategicSkillId: cfg.strategicSkillId },
        };
        const enemy: UnitSpec = {
            troops: ENEMY_TROOPS, region: REGION, role: 'field',
            general: { tier: 'ordinary', tacticalSkillId: randomTs() },
        };
        const before = troops;
        const r = simulateOnce([legion], [enemy], randomTerrain(), true, 'field');
        if (!r.attackerWon || r.attSurvivors < 1) break;
        battles++;
        troops = applyStrategicSustain(r.attSurvivors, before - r.attSurvivors, cfg.strategicSkillId);
    }
    return battles;
}

interface Dist { avg: number; min: number; max: number; p10: number; p50: number; p90: number; pct: (t: number) => number; capped: number; }
function runDist(cfg: LegionCfg, trials: number): Dist {
    const arr: number[] = [];
    for (let i = 0; i < trials; i++) arr.push(runOne(cfg));
    arr.sort((a, b) => a - b);
    const avg = arr.reduce((s, x) => s + x, 0) / trials;
    const at = (q: number) => arr[Math.min(trials - 1, Math.floor(q * trials))];
    return {
        avg, min: arr[0], max: arr[arr.length - 1],
        p10: at(0.10), p50: at(0.50), p90: at(0.90),
        pct: (t: number) => arr.filter((x) => x >= t).length / trials,
        capped: arr.filter((x) => x >= HARD_CAP).length,
    };
}

console.log(`\n远征"突出名将"分析 | 5万进攻方 vs 连续 1万普将 | 每档 ${TRIALS} 次 | 精锐档 T${ELITE_TIER}(×${[1.5,1.4,1.3,1.2,1.1][ELITE_TIER]})`);
console.log('─'.repeat(72));

// A 普将基线
const baseline = runDist({ tier: 'ordinary', eliteTier: null }, TRIALS);
console.log(`A 普将基线（随机战术·无战略·无精锐）  均${baseline.avg.toFixed(1)}  中位${baseline.p50}  [${baseline.min}-${baseline.max}]`);

// B/C：全名将板 平均（无精锐 vs T0精锐）
function boardMean(elite: number | null): { mean: number; means: { gid: string; name: string; ts?: string; str?: string; avg: number }[] } {
    const means: { gid: string; name: string; ts?: string; str?: string; avg: number }[] = [];
    for (const p of Object.values(GENERAL_PROFILES)) {
        if (p.tier !== 'famous') continue;
        const d = runDist({ tier: 'famous', tacticalSkillId: p.tacticalSkillId, strategicSkillId: p.strategicSkillId, eliteTier: elite }, Math.max(30, TRIALS / 4 | 0));
        means.push({ gid: p.generalId, name: generalNameById.get(p.generalId) ?? p.generalId, ts: p.tacticalSkillId, str: p.strategicSkillId, avg: d.avg });
    }
    return { mean: means.reduce((s, m) => s + m.avg, 0) / means.length, means };
}

const noElite = boardMean(null);
const withElite = boardMean(ELITE_TIER);
console.log(`B 名将·无精锐  全板均 ${noElite.mean.toFixed(1)}`);
console.log(`C 名将+精锐    全板均 ${withElite.mean.toFixed(1)}   ← 直播真实场景`);
console.log(`\n突出度：C 名将+精锐 全板均 ${withElite.mean.toFixed(1)} ÷ A 普将基线 ${baseline.avg.toFixed(1)} = ×${(withElite.mean / baseline.avg).toFixed(2)}`);

// 目标达成率：名将+精锐 全体名将各跑一遍，看能稳定通关几场
const cTop = [...withElite.means].sort((a, b) => b.avg - a.avg);
console.log(`\n【名将+精锐 目标达成率】全 ${cTop.length} 名将平均连胜分布`);
const allC = runDist({ tier: 'famous', tacticalSkillId: cTop[0].ts, strategicSkillId: cTop[0].str, eliteTier: ELITE_TIER }, TRIALS);
console.log(`  样板(榜首 ${cTop[0].name}): ≥10场 ${(allC.pct(10)*100).toFixed(0)}% | ≥15场 ${(allC.pct(15)*100).toFixed(0)}% | ≥20场 ${(allC.pct(20)*100).toFixed(0)}% | 封顶60 ${(allC.capped/TRIALS*100).toFixed(0)}%`);

console.log(`\n【名将+精锐 榜首/榜尾】`);
console.log(`  最强5: ${cTop.slice(0,5).map(m => `${m.name}(${m.avg.toFixed(1)})`).join('  ')}`);
console.log(`  最弱5: ${cTop.slice(-5).map(m => `${m.name}(${m.avg.toFixed(1)})`).join('  ')}`);
console.log('');
