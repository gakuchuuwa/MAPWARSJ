/**
 * 远征续航模拟器（直播向）
 * ───────────────────────────────────────────────────────────────
 * 场景：一支 5 万名将军团（战略技+战术技），作为【进攻方】连续野战，
 *       每场遇到一支 1 万普将军队（战术技随机、无战略技），
 *       打到名将军团战败/覆没为止，记录【连胜几场】。
 *       每套组合跑 N 次，看平均/最多/最少场数——即"能否达成随机远征目标"。
 *
 * 续航规则（贴合游戏）：
 *   · 每胜一场：combat-model 已含【基础战后恢复 30% + 战术恢复技】结算（attSurvivors）
 *   · 战略续航（组合带才生效）：
 *       - 因粮于敌 str_07 (post_battle_troop_pct)：胜后当前兵 +11%
 *       - 以战养战 str_13 (field_resupply)：胜后额外补回本场战损的一部分（远征在外缓回血）
 *   · 兵力上限 = MAX_TROOPS（默认 10 万）
 *   · 乘胜追击/兵贵神速/履险如夷/直捣黄龙/足食足兵/募兵有道：行军/爆兵类，
 *     对"连续战斗存活"无直接影响，本模拟不计（会体现为这些组合场数相近）。
 *
 * 运行：
 *   npm run sim:expedition                 # 名将排行榜（直播向）
 *   npm run sim:expedition -- --mode combos # 技能组合排行榜（平衡向）
 *   npm run sim:expedition -- --mode both --trials 1200
 *   npm run sim:expedition -- --legion 50000 --enemy 10000 --cap 100000
 */
import { simulateOnce, type UnitSpec, type Terrain } from './combat-model';
import {
    GENERAL_PROFILES,
    STRATEGIC_SKILL_CATALOG,
    getStrategicSkillDef,
    getTacticalSkillDef,
    TACTICAL_SKILL_ENTRIES_V1,
} from '../src/data/GeneralSkills';
import { FACTION_GENERALS } from '../src/data/FactionGenerals';
import { writeFileSync } from 'node:fs';

// ────────── 参数 ──────────
function argNum(flag: string, def: number): number {
    const i = process.argv.indexOf(flag);
    return i >= 0 ? parseFloat(process.argv[i + 1]) || def : def;
}
function argStr(flag: string, def: string): string {
    const i = process.argv.indexOf(flag);
    return i >= 0 ? process.argv[i + 1] || def : def;
}

const LEGION_TROOPS = argNum('--legion', 50000);
const ENEMY_TROOPS = argNum('--enemy', 10000);
const MAX_TROOPS = argNum('--cap', 100000);
const TRIALS = argNum('--trials', 100);
const MODE = argStr('--mode', 'general'); // general | combos | both
const REGION = argStr('--region', 'CENTRAL'); // 统一文化区，专注比技能
const HARD_CAP_BATTLES = argNum('--maxbattles', 60); // 防无敌组合无限循环
/** 以战养战：胜后额外补回本场战损的比例（v1 近似值，可调） */
const FIELD_RESUPPLY_RATIO = argNum('--fieldresupply', 0.15);

// 地形权重（远征跨区）
const TERRAINS: { t: Terrain; w: number }[] = [
    { t: 'plain', w: 0.55 },
    { t: 'mountain', w: 0.40 },
    { t: 'sea', w: 0.05 },
];
function randomTerrain(): Terrain {
    const r = Math.random();
    let acc = 0;
    for (const x of TERRAINS) { acc += x.w; if (r < acc) return x.t; }
    return 'plain';
}

// 全部 49 战术技 id（普将随机抽） + 全部战略技 id
const ALL_TS: string[] = TACTICAL_SKILL_ENTRIES_V1.map((e) => e.id);
const ALL_STR: string[] = Object.keys(STRATEGIC_SKILL_CATALOG);
function randomEnemyTs(): string {
    return ALL_TS[(Math.random() * ALL_TS.length) | 0];
}

// 名将显示名
const generalNameById = new Map<string, string>();
for (const [, g] of Object.entries(FACTION_GENERALS)) generalNameById.set(g.generalId, g.generalName);

// 战术技中文名（v1 catalog 全 49 技，含未桥接项）
const tsNameById = new Map<string, string>();
for (const e of TACTICAL_SKILL_ENTRIES_V1) tsNameById.set(e.id, e.displayName);

// ────────── 续航：战略技胜后补员 ──────────
function applyStrategicSustain(survivors: number, lostThisBattle: number, strId: string | undefined, enemyInitialTroops: number): number {
    let t = survivors;
    const str = strId ? getStrategicSkillDef(strId) : null;
    if (str?.effect === 'post_battle_troop_pct') {
        t += Math.floor(enemyInitialTroops * str.magnitude); // 因粮于敌（拔上限）：按击败敌军数量吸血
    }
    if (str?.effect === 'field_resupply') {
        t += Math.floor(Math.max(0, lostThisBattle) * FIELD_RESUPPLY_RATIO); // 以战养战（保下限）：按自身战损补回
    }
    return Math.min(t, MAX_TROOPS);
}

// ────────── 单次远征：打到覆没，返回连胜场数 ──────────
function runOneExpedition(tsId: string | undefined, strId: string | undefined): number {
    let troops = LEGION_TROOPS;
    let battles = 0;
    while (battles < HARD_CAP_BATTLES) {
        const legion: UnitSpec = {
            troops, maxTroops: MAX_TROOPS, region: REGION, role: 'field',
            general: { tier: 'famous', tacticalSkillId: tsId, strategicSkillId: strId },
        };
        const enemy: UnitSpec = {
            troops: ENEMY_TROOPS, region: REGION, role: 'field',
            general: { tier: 'ordinary', tacticalSkillId: randomEnemyTs() },
        };
        const before = troops;
        const r = simulateOnce([legion], [enemy], randomTerrain(), true, 'field');
        if (!r.attackerWon || r.attSurvivors < 1) break;
        battles++;
        const lost = before - r.attSurvivors;
        troops = applyStrategicSustain(r.attSurvivors, lost, strId, ENEMY_TROOPS);
    }
    return battles;
}

interface Stat { avg: number; min: number; max: number; median: number; capped: number }
function runMany(tsId: string | undefined, strId: string | undefined, trials: number): Stat {
    const arr: number[] = [];
    let capped = 0;
    for (let i = 0; i < trials; i++) {
        const b = runOneExpedition(tsId, strId);
        if (b >= HARD_CAP_BATTLES) capped++;
        arr.push(b);
    }
    arr.sort((a, b) => a - b);
    const sum = arr.reduce((s, x) => s + x, 0);
    return {
        avg: sum / trials,
        min: arr[0],
        max: arr[arr.length - 1],
        median: arr[(trials / 2) | 0],
        capped,
    };
}

function tsName(id: string | undefined): string {
    if (!id) return '—';
    return tsNameById.get(id) ?? getTacticalSkillDef(id)?.displayName ?? id;
}
/** 按显示宽度截断（中文算 2 宽），过长加省略号 */
function truncW(s: string, maxW: number): string {
    let w = 0, out = '';
    for (const ch of s) {
        const cw = ch.charCodeAt(0) > 255 ? 2 : 1;
        if (w + cw > maxW - 1) { return out + '…'; }
        w += cw; out += ch;
    }
    return out;
}
function strDisplayName(id: string | undefined): string {
    if (!id) return '—';
    return STRATEGIC_SKILL_CATALOG[id]?.displayName ?? id;
}
function pad(s: string, w: number): string {
    let width = 0;
    for (const ch of s) width += ch.charCodeAt(0) > 255 ? 2 : 1;
    return s + ' '.repeat(Math.max(0, w - width));
}

console.log(`\n远征续航模拟 | 名将军团 ${LEGION_TROOPS}（cap ${MAX_TROOPS}） vs 连续普将 ${ENEMY_TROOPS} | 每组 ${TRIALS} 次 | 文化区 ${REGION}`);
console.log(`地形权重 平原${TERRAINS[0].w}/山地${TERRAINS[1].w}/海${TERRAINS[2].w} | 场数封顶 ${HARD_CAP_BATTLES} | 以战养战补给系数 ${FIELD_RESUPPLY_RATIO}`);

// ────────── 视角1：名将排行 ──────────
if (MODE === 'general' || MODE === 'both') {
    type Row = { name: string; gid: string; ts: string; str: string; stat: Stat };
    const rows: Row[] = [];
    for (const p of Object.values(GENERAL_PROFILES)) {
        if (p.tier !== 'famous') continue;
        const stat = runMany(p.tacticalSkillId, p.strategicSkillId, TRIALS);
        rows.push({
            name: generalNameById.get(p.generalId) ?? p.generalId,
            gid: p.generalId,
            ts: tsName(p.tacticalSkillId),
            str: strDisplayName(p.strategicSkillId),
            stat,
        });
    }
    rows.sort((a, b) => b.stat.avg - a.stat.avg);

    const outPath = process.argv.includes('--full')
        ? (process.argv[process.argv.indexOf('--full') + 1] || 'scratch/expedition_general_full.csv')
        : null;
    if (outPath) {
        const lines = ['rank,name,gid,tactical,strategic,avg,median,min,max,capped'];
        rows.forEach((r, i) => lines.push(
            `${i + 1},${JSON.stringify(r.name)},${r.gid},${JSON.stringify(r.ts)},${JSON.stringify(r.str)},${r.stat.avg.toFixed(4)},${r.stat.median},${r.stat.min},${r.stat.max},${r.stat.capped}`,
        ));
        writeFileSync(outPath, lines.join('\n'), 'utf8');
        console.log(`\n[全量导出] ${rows.length} 名 → ${outPath}`);
    }

    console.log(`\n══════════════ 名将排行榜（按平均连胜场数） ══════════════  共 ${rows.length} 名`);
    console.log(`${pad('#', 4)}${pad('名将', 10)}${pad('战术技', 12)}${pad('战略技', 12)}${pad('均场', 7)}${pad('中位', 6)}${pad('最少', 6)}${pad('最多', 6)}`);
    console.log('─'.repeat(70));
    const printRow = (r: Row, i: number) => console.log(
        `${pad(String(i + 1), 4)}${pad(truncW(r.name, 10), 10)}${pad(r.ts, 12)}${pad(r.str, 12)}${pad(r.stat.avg.toFixed(2), 7)}${pad(String(r.stat.median), 6)}${pad(String(r.stat.min), 6)}${pad(String(r.stat.max), 6)}`,
    );
    rows.slice(0, 20).forEach(printRow);
    console.log('  ……');
    console.log('  【垫底 10 名】');
    rows.slice(-10).forEach((r, i) => printRow(r, rows.length - 10 + i));
}

// ────────── 视角2：技能组合排行 ──────────
if (MODE === 'combos' || MODE === 'both') {
    const comboTrials = Math.max(5, Math.floor(TRIALS / 2));
    type Row = { ts: string; str: string; tsId: string; strId: string; stat: Stat };
    const rows: Row[] = [];
    for (const tsId of ALL_TS) {
        for (const strId of ALL_STR) {
            const stat = runMany(tsId, strId, comboTrials);
            rows.push({ ts: tsName(tsId), str: strDisplayName(strId), tsId, strId, stat });
        }
    }
    rows.sort((a, b) => b.stat.avg - a.stat.avg);

    console.log(`\n══════════════ 技能组合排行榜（战术 × 战略，每组 ${comboTrials} 次） ══════════════  共 ${rows.length} 组`);
    console.log(`${pad('#', 4)}${pad('战术技', 12)}${pad('战略技', 12)}${pad('均场', 7)}${pad('中位', 6)}${pad('最少', 6)}${pad('最多', 6)}`);
    console.log('─'.repeat(60));
    const printRow = (r: Row, i: number) => console.log(
        `${pad(String(i + 1), 4)}${pad(r.ts, 12)}${pad(r.str, 12)}${pad(r.stat.avg.toFixed(2), 7)}${pad(String(r.stat.median), 6)}${pad(String(r.stat.min), 6)}${pad(String(r.stat.max), 6)}`,
    );
    console.log('  【最强 15 组】');
    rows.slice(0, 15).forEach(printRow);
    console.log('  【最弱 15 组】');
    rows.slice(-15).forEach((r, i) => printRow(r, rows.length - 15 + i));
}

console.log('');
