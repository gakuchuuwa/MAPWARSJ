/**
 * 武将技 / 加成 参数平衡模拟器（无头蒙特卡洛）
 * ───────────────────────────────────────────────────────────────
 * 运行： npm run sim:skill
 *        npx tsx tools/skill-balance-sim.ts --trials 100000
 *        npx tsx tools/skill-balance-sim.ts --sweep-comeback        （逆局阈值扫描）
 *        npx tsx tools/skill-balance-sim.ts --comeback-threshold 0.85
 *        npx tsx tools/skill-balance-sim.ts --no-comeback-luck
 *
 * 目标：测算武将技参数是否平衡、各类加成能带来多少胜率，用来调 magnitude。
 * 战斗数学见 tools/combat-model.ts（与游戏源同步）。
 */

import {
    LUCK_MIN, LUCK_MAX, ELITE_TIER_MULT, CAMPAIGN_LEGION_MULT, PASS_GARRISON_MULT,
    STRATEGIC_SKILL_CATALOG, simConfig, winRate,
    type UnitSpec,
} from './combat-model';

// ── CLI → simConfig ──
{
    const i = process.argv.indexOf('--comeback-threshold');
    if (i >= 0) simConfig.comebackThreshold = parseFloat(process.argv[i + 1]) || simConfig.comebackThreshold;
    if (process.argv.includes('--no-comeback-luck')) simConfig.comebackRollLuck = false;
}

const TRIALS = (() => {
    const i = process.argv.indexOf('--trials');
    return i >= 0 ? Math.max(1000, parseInt(process.argv[i + 1], 10) || 20000) : 20000;
})();

function pct(x: number): string {
    return (x * 100).toFixed(1).padStart(5) + '%';
}
function row(label: string, wr: number, note = ''): void {
    const bar = '█'.repeat(Math.round(wr * 30)).padEnd(30, '·');
    console.log(`  ${label.padEnd(22)} ${pct(wr)}  ${bar}  ${note}`);
}
function header(title: string): void {
    console.log(`\n\x1b[1m${title}\x1b[0m`);
}

const base = (over: Partial<UnitSpec> = {}): UnitSpec => ({ troops: 10000, region: 'CENTRAL', role: 'field', ...over });

/** 逆局阈值扫描：找让逆局技 ≈ 开局技(~85%) 的 θ */
function sweepComeback(): void {
    const T = TRIALS;
    console.log(`\n逆局阈值 θ 扫描  —  A(逆局技) vs B(裸)，等兵力 10000，每项 ${T.toLocaleString()} 次`);
    console.log('目标：θ 使逆局技胜率 ≈ 开局技(~85%)，即与①–⑤ 一档平衡\n');
    const tac = (id: string): UnitSpec => base({ general: { tier: 'ordinary', tacticalSkillId: id } });
    const skills: [string, string][] = [
        ['⑥哀兵必胜', 'tac_06'], ['⑦攻其不备', 'tac_07'], ['⑧置之死地', 'tac_08'],
        ['⑨釜底抽薪', 'tac_09'], ['⑩深沟高垒', 'tac_10'],
    ];
    const thetas = [0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9];
    console.log('  技能\\θ    ' + thetas.map((t) => t.toFixed(2).padStart(7)).join(''));
    for (const [label, id] of skills) {
        const cells = thetas.map((t) => {
            simConfig.comebackThreshold = t;
            return pct(winRate([tac(id)], [base()], T)).padStart(7);
        });
        console.log(`  ${label.padEnd(8)} ${cells.join('')}`);
    }
    console.log('\n（开局技 ②③④⑤ 参照 ≈ 85%）\n');
}

function main(): void {
    if (process.argv.includes('--sweep-comeback')) { sweepComeback(); return; }
    const T = TRIALS;
    console.log(`\n武将技 / 加成 平衡模拟器  —  每项 ${T.toLocaleString()} 次蒙特卡洛`);
    console.log(`luck ∈ [${LUCK_MIN}, ${LUCK_MAX}]  精锐 tier 乘数 [${ELITE_TIER_MULT.join(', ')}]  关隘 ×${PASS_GARRISON_MULT}`);
    console.log('胜率 = 左侧(A/攻方) 的胜率；A、B 兵力均 10000 且无任何加成时应 ≈ 50%');

    const plain = 10000;

    header('【0】基准校验（应 ≈ 50%）');
    row('裸 vs 裸', winRate([base()], [base()], T));

    header('【1】固定系数 r → 胜率标定（等兵力，luck 唯一变量）');
    for (const r of [1.0, 1.05, 1.1, 1.15, 1.2, 1.3, 1.4, 1.5]) {
        row(`A×${r.toFixed(2)} vs B×1.0`, winRate([base({ multOverride: r })], [base()], T),
            r >= 1.5 ? '← 达到 luck 上限比(1.2/0.8)，几乎必胜' : '');
    }

    header('【2】精锐 tier 价值（A 精锐 vs B 无精锐，等兵力野战）');
    for (let t = 0; t <= 4; t++) {
        row(`T${t} (×${ELITE_TIER_MULT[t]})`, winRate([base({ eliteTier: t })], [base()], T));
    }
    row('远征军(非精锐)', winRate([base({ campaign: true })], [base()], T), `×${CAMPAIGN_LEGION_MULT}`);

    header('【3】文化区 / 关隘（等兵力）');
    row('草原野战 vs 中原', winRate([base({ region: 'STEPPE' })], [base()], T), '草原野战×1.2');
    row('中原攻 vs 岭南守', winRate([base()], [base({ region: 'LINGNAN', role: 'garrison' })], T), '岭南守×1.2');
    row('中原攻 vs 关隘守', winRate([base()], [base({ region: 'CENTRAL', role: 'garrison', pass: true })], T), `关隘×${PASS_GARRISON_MULT}`);
    row('中原攻 vs 岭南关隘', winRate([base()], [base({ region: 'LINGNAN', role: 'garrison', pass: true })], T), '1.2×1.2=1.44');

    header('【4】战略技价值（A 名将带战略技 vs B 裸，等兵力）');
    const fam = (str: string): UnitSpec => base({ general: { tier: 'famous', tacticalSkillId: '', strategicSkillId: str } });
    const famTac = (str: string, tac: string): UnitSpec => base({ general: { tier: 'famous', tacticalSkillId: tac, strategicSkillId: str } });
    row('S③所向披靡(攻)', winRate([fam('str_03')], [base()], T, 'plain'), `攻方×${STRATEGIC_SKILL_CATALOG.str_03.magnitude}`);
    row('S⑧固若金汤(守攻城)', winRate([base()], [fam('str_08')], T, 'plain', 'siege'), '攻城战守方×1.5');
    row('S⑧固若金汤(野战无效)', winRate([base()], [fam('str_08')], T, 'plain', 'field'), '野战→无效果');
    // S⑨以寡击众：A(劣势方,6000兵,带str_09) vs B(优势方,10000兵)
    row('S⑨以寡击众(劣势触发)', winRate(
        [base({ troops: 6000, general: { tier: 'famous', tacticalSkillId: '', strategicSkillId: 'str_09' } })],
        [base({ troops: 10000 })], T), '0.6倍兵力→己×1.4');
    row('S⑨以寡击众(均势不触发)', winRate([fam('str_09')], [base()], T), '等兵力→无效果');
    // S④威震华夏：A(优势方,15000兵,带str_04+tac_01) vs B(10000兵)
    row('S④威震华夏(优势触发)', winRate(
        [base({ troops: 15000, general: { tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' } })],
        [base({ troops: 10000 })], T), '1.5倍兵力→战术技×1.3');
    row('S④威震华夏(均势不触发)', winRate([famTac('str_04', 'tac_01')], [base()], T), '等兵力→无效果');

    header('【5】开局战术价值（A 带战术技 vs B 裸，等兵力）');
    const tac = (id: string): UnitSpec => base({ general: { tier: 'ordinary', tacticalSkillId: id } });
    row('①以逸待劳', winRate([tac('tac_01')], [base()], T), '己战力×1.2(2026-07-03改,不写真实兵,零膨胀)');
    row('②避实击虚', winRate([tac('tac_02')], [base()], T), '敌-16.7%兵');
    row('③侵掠如火', winRate([tac('tac_03')], [base()], T), '己roll×1.2');
    row('④不战而屈', winRate([tac('tac_04')], [base()], T), '敌roll×0.833');
    row('⑤不动如山', winRate([tac('tac_05')], [base()], T), '己掷点×1.2');
    console.log('  ③④ 对撞（双方各带一技）：');
    row('③ vs ④', winRate([tac('tac_03')], [tac('tac_04')], T), '侵掠如火 vs 不战而屈');

    header('【6】逆局战术翻盘力（A 劣势方，逐帧模拟）');
    console.log(`  结构说明：己方掉到开战 ${(simConfig.comebackThreshold * 100).toFixed(0)}% 触发；重算掷 luck（概率化翻盘）。`);
    console.log('           等兵力时逆局技 ≈ 85%（与开局技①–⑤ 同档）；下方为「带劣势」时的翻盘力。');
    const runComeback = (bTroops: number) => {
        const weak = (id?: string): UnitSpec =>
            base({ troops: plain, general: id ? { tier: 'ordinary', tacticalSkillId: id } : null });
        const strong = base({ troops: bTroops });
        const deficit = (((plain - bTroops) / bTroops) * 100).toFixed(0);
        console.log(`  ── A ${plain} vs B ${bTroops}（A 约 ${deficit}% 兵）──`);
        const th = `≤${(simConfig.comebackThreshold * 100).toFixed(0)}%`;
        row('A 裸（对照）', winRate([weak()], [strong], T));
        row('A ⑥哀兵必胜', winRate([weak('tac_06')], [strong], T), `${th} +20%max兵`);
        row('A ⑦攻其不备', winRate([weak('tac_07')], [strong], T), `${th} 削敌16.7%`);
        row('A ⑧置之死地', winRate([weak('tac_08')], [strong], T), `${th} 己×1.2`);
        row('A ⑨釜底抽薪', winRate([weak('tac_09')], [strong], T), `${th} 敌×0.833`);
        row('A ⑩深沟高垒', winRate([weak('tac_10')], [strong], T), `${th} 免伤+掷点×1.2`);
    };
    runComeback((plain * 1.05) | 0);
    runComeback((plain * 1.15) | 0);

    console.log('\n提示：改 src/data/GeneralSkills.ts 的 magnitude 或 GameConfig 的 ELITE_TIER_MULT/LUCK 后重跑，数值即同步。\n');
}

main();
