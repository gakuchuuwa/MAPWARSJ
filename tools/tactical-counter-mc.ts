/**
 * 对抗系 A/B 层 MC（#45 诱敌深入 / #46 暗度陈仓 / #47 声东击西 / #48 空城退敌）。
 * 运行：npm run tactical:counter-mc
 *
 * 两块验证：
 *   ① 纯函数单元自检：直接调 resolveOpeningTroopCutCounter / resolveEnemyTerrainBuffCounter，
 *      断言 4 条对抗语义数学正确（减兵消除/反弹、地形增益取消/减半）。
 *   ② 整场胜率：验对抗技接入 combat-model 后能真实翻转战局（无声直播可见）。
 * C 层（#42/43/44 否决/夺取）多量纲，未纳入，另行定案。
 */
import { simulateOnce, type UnitSpec, type Terrain } from './combat-model';
import {
    buildTacticalConditionContext,
    resolveOpeningTroopCutCounter,
    resolveEnemyTerrainBuffCounter,
} from '../src/combat/TacticalSkillResolver';
import type { BattleType } from '../src/combat/CombatSystem';

const N = 40000;

function spec(troops: number, tacticalId = '', strategicId = ''): UnitSpec {
    return {
        troops,
        region: 'CENTRAL', // ×1.0，令 base 比 = 兵力比
        role: 'field',
        general: {
            tier: 'famous',
            ...(tacticalId ? { tacticalSkillId: tacticalId } : {}),
            ...(strategicId ? { strategicSkillId: strategicId } : {}),
        },
    };
}

function attWin(
    att: number, def: number, terrain: Terrain, battleType: BattleType,
    attTac: string, defTac: string, defStr: string,
): number {
    let w = 0;
    for (let i = 0; i < N; i++) {
        const r = simulateOnce([spec(att, attTac)], [spec(def, defTac, defStr)], terrain, false, battleType);
        if (r.attackerWon) w++;
    }
    return w / N;
}

function ok(cond: boolean): string {
    return cond ? '✅' : '❌';
}

function unitSelfCheck(): void {
    console.log('【① 纯函数单元自检】');

    // 开局减兵对抗：敌方开局减兵 0.2
    const cutField = buildTacticalConditionContext({
        battleType: 'field', terrain: null,
        selfTroops: 2000, enemyTroops: 10000, selfInitialTroops: 2000, enemyInitialTroops: 10000,
        selfIsAttacker: false, // 己方为守/被减方
    });
    const siegeDefCtx = buildTacticalConditionContext({
        battleType: 'siege', terrain: null,
        selfTroops: 20000, enemyTroops: 20000, selfInitialTroops: 20000, enemyInitialTroops: 20000,
        selfIsAttacker: false,
    });
    const none = resolveOpeningTroopCutCounter('', 0.2, cutField);
    const nullifyC = resolveOpeningTroopCutCounter('ts_048', 0.2, cutField); // 空城：己2000/敌10000=0.2<0.3
    const reflectC = resolveOpeningTroopCutCounter('ts_045', 0.2, siegeDefCtx); // 诱敌：守城守方
    console.log(`   减兵对抗（敌减0.2）:`);
    console.log(`     无对抗            selfCut=${none.selfCutMagnitude} reflect=${none.reflectBackMagnitude}  ${ok(none.selfCutMagnitude === 0.2 && none.reflectBackMagnitude === 0)}`);
    console.log(`     空城退敌(己<敌30%) selfCut=${nullifyC.selfCutMagnitude} reflect=${nullifyC.reflectBackMagnitude}  ${ok(nullifyC.selfCutMagnitude === 0 && nullifyC.reflectBackMagnitude === 0)}`);
    console.log(`     诱敌深入(守城守方) selfCut=${reflectC.selfCutMagnitude} reflect=${reflectC.reflectBackMagnitude}  ${ok(reflectC.selfCutMagnitude === 0 && reflectC.reflectBackMagnitude === 0.2)}`);

    // 空城条件不满足（己方不比敌<30%）时应不生效
    const nullifyNoTrigger = resolveOpeningTroopCutCounter('ts_048', 0.2, siegeDefCtx); // 己=敌，不<30%
    console.log(`     空城(条件不满足)   selfCut=${nullifyNoTrigger.selfCutMagnitude}  ${ok(nullifyNoTrigger.selfCutMagnitude === 0.2)}`);

    // 地形对抗：敌方地形增益 1.5
    const terrCtx = buildTacticalConditionContext({
        battleType: 'field', terrain: 'plain',
        selfTroops: 20000, enemyTroops: 20000, selfInitialTroops: 20000, enemyInitialTroops: 20000,
        selfIsAttacker: true,
    });
    const noT = resolveEnemyTerrainBuffCounter('', 1.5, terrCtx);
    const cancelT = resolveEnemyTerrainBuffCounter('ts_046', 1.5, terrCtx); // 暗度陈仓
    const halveT = resolveEnemyTerrainBuffCounter('ts_047', 1.5, terrCtx);  // 声东击西
    console.log(`   地形对抗（敌地利1.5）:`);
    console.log(`     无对抗       g=${noT.adjustedMult}  ${ok(noT.adjustedMult === 1.5)}`);
    console.log(`     暗度陈仓取消  g=${cancelT.adjustedMult}  ${ok(cancelT.adjustedMult === 1)}`);
    console.log(`     声东击西减半  g=${halveT.adjustedMult}  ${ok(halveT.adjustedMult === 1.25)}`);
    console.log('');
}

function main(): void {
    console.log(`══ 对抗系 A/B 层 MC（N=${N}/格）══\n`);
    unitSelfCheck();

    console.log('【② 地形对抗整场（plain，def 挂长驱直入 +50% 平原）—— att 胜率】');
    {
        const base = attWin(20000, 20000, 'plain', 'field', '', '', 'str_04');
        const cancel = attWin(20000, 20000, 'plain', 'field', 'ts_046', '', 'str_04');
        const halve = attWin(20000, 20000, 'plain', 'field', 'ts_047', '', 'str_04');
        console.log(`   基线（att 无对抗，被 def 地利压制）  att 胜率 ${(base * 100).toFixed(1)}%`);
        console.log(`   att 暗度陈仓 cancel（取消 def 地利）  att 胜率 ${(cancel * 100).toFixed(1)}%`);
        console.log(`   att 声东击西 halve（def 地利减半）    att 胜率 ${(halve * 100).toFixed(1)}%`);
    }
    console.log('');

    // 敌方减兵源用 tac_02（避实击虚，减 16.7%）：combat-model 开局减兵走旧 10 技 catalog，
    // v1 兵力系 ts_021~030 尚未接入开局减兵路径（引擎减兵当前亦为 tac_xx）。
    console.log('【③ 诱敌深入整场（siege，att 挂避实击虚 减 def 16.7%）—— att 胜率】');
    {
        const base = attWin(20000, 20000, null, 'siege', 'tac_02', '', '');
        const reflect = attWin(20000, 20000, null, 'siege', 'tac_02', 'ts_045', '');
        console.log(`   基线（def 无对抗，被减兵→att 占优）    att 胜率 ${(base * 100).toFixed(1)}%`);
        console.log(`   def 诱敌深入 reflect（反弹→att 被减）  att 胜率 ${(reflect * 100).toFixed(1)}%`);
    }
    console.log('');
}

main();
