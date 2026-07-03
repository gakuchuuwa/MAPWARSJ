/**
 * 战损系 MC：统一货币 = 期望剩余兵力（跟随军团存活率）。运行：npm run tactical:casualty-mc
 *
 * 战损系不改胜率，只改「打完还剩多少兵」。本脚本用逐帧模型（aggregate/forceTicks）
 * 输出胜局平均存活兵力与存活率，验证：
 *   ① 减损/恢复技（胜方视角）抬高存活；
 *   ② 咬人/斩根（败方挂技）压低胜方存活；
 *   ③ 交叉场景（减损 + 咬人）结算顺序 ①斩根→②恢复→③咬人→④保底 在模型与引擎一致。
 * 穷寇勿迫走逐帧「敌残才触发」，实测收益远低于名义 40%。
 */
import { aggregate, type UnitSpec } from './combat-model';

const N = 20000;

function spec(troops: number, skillId: string, eliteTier?: number): UnitSpec {
    return {
        troops,
        region: 'CENTRAL', // ×1.0，令 base 比 = 兵力比
        role: 'field',
        general: skillId ? { tier: 'famous', tacticalSkillId: skillId } : { tier: 'famous' },
        eliteTier: eliteTier ?? null,
    };
}

/** att 挂技 vs def 无技：报 att 胜率 + 胜局平均存活 + 存活率 */
function attLine(label: string, att: number, def: number, attSkill: string, attElite?: number): void {
    const r = aggregate([spec(att, attSkill, attElite)], [spec(def, '')], N);
    const rate = r.attackerInitTroops > 0 ? (r.attackerAvgSurvivorsOnWin / r.attackerInitTroops) * 100 : 0;
    console.log(
        `   ${label.padEnd(24)} 胜率 ${(r.attackerWinRate * 100).toFixed(1).padStart(5)}%  ` +
        `存活 ${Math.round(r.attackerAvgSurvivorsOnWin).toString().padStart(6)}/${r.attackerInitTroops} (${rate.toFixed(1)}%)`,
    );
}

/** att 无技（挂 attSkill 可选） vs def 挂技：报 att 胜局存活（咬人/斩根压低） */
function defLine(label: string, att: number, def: number, defSkill: string, attSkill = ''): void {
    const r = aggregate([spec(att, attSkill)], [spec(def, defSkill)], N);
    const rate = r.attackerInitTroops > 0 ? (r.attackerAvgSurvivorsOnWin / r.attackerInitTroops) * 100 : 0;
    console.log(
        `   ${label.padEnd(24)} 胜率 ${(r.attackerWinRate * 100).toFixed(1).padStart(5)}%  ` +
        `存活 ${Math.round(r.attackerAvgSurvivorsOnWin).toString().padStart(6)}/${r.attackerInitTroops} (${rate.toFixed(1)}%)`,
    );
}

function main(): void {
    console.log(`══ 战损系 MC：期望剩余兵力（N=${N}/格；统一货币=存活兵力）══\n`);

    console.log('【A. 碾压 att3万 vs def1万（跟随明星军团常态；减损/恢复 att 挂技）】');
    attLine('基线（无技·恢复0.3）', 30000, 10000, '');
    attLine('游刃有余 战损-30%', 30000, 10000, 'ts_031');
    attLine('兵不血刃 战损-60%', 30000, 10000, 'ts_032');
    attLine('穷寇勿迫 敌<20%战损-40%', 30000, 10000, 'ts_041');
    attLine('如臂使指 精锐战损-20%', 30000, 10000, 'ts_040', 2);
    attLine('休养生息 恢复0.5', 30000, 10000, 'ts_035');
    attLine('爱兵如子 恢复0.7', 30000, 10000, 'ts_036');
    console.log('');

    console.log('【B. 势均 att2万 vs def1.6万（胜方战损大，减损空间大）】');
    attLine('基线（无技·恢复0.3）', 20000, 16000, '');
    attLine('游刃有余 战损-30%', 20000, 16000, 'ts_031');
    attLine('兵不血刃 战损-60%', 20000, 16000, 'ts_032');
    attLine('休养生息 恢复0.5', 20000, 16000, 'ts_035');
    console.log('');

    console.log('【C. 咬人/斩根（att 无技胜 vs def 挂技；看 att 存活下降）】');
    defLine('基线（def 无技）', 30000, 10000, '');
    defLine('def 困兽犹斗 咬×1.5', 30000, 10000, 'ts_033');
    defLine('def 宁为玉碎 咬×2', 30000, 10000, 'ts_034');
    defLine('def 斩草除根 恢复归零', 30000, 10000, 'ts_039');
    console.log('');

    console.log('【D. 交叉：减损 vs 咬人（att3万 vs def1万，验结算顺序）】');
    attLine('att 兵不血刃 单独', 30000, 10000, 'ts_032');
    defLine('def 宁为玉碎 单独', 30000, 10000, 'ts_034');
    defLine('att兵不血刃 + def宁为玉碎', 30000, 10000, 'ts_034', 'ts_032');
    console.log('   （交叉应介于两者之间：减损先抬存活地板，咬人再按本场战损扣，保底兜底）');
    console.log('');
}

main();
