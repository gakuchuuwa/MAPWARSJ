/** 一次性对比：因粮于敌 / 以战养战 / 所向披靡 vs 无战略（连战 20 场封顶） */
import { simulateOnce } from './combat-model';
import { getArmyMaxTroops } from './sim-troop-caps';
import { GameConfig } from '../src/config/GameConfig';
import {
    applyStrategicSustainAfterVictory,
    computeFieldResupplyBonus,
    getChainSimFieldResupplySec,
} from './sim-strategic-sustain';

const LEGION = 50000;
const ENEMY = 10000;
const CAP = getArmyMaxTroops('CENTRAL');
const TRIALS = 300;
const MAX = 20;
const TRAVEL_SEC = getChainSimFieldResupplySec();
const RATE = GameConfig.COMBAT.FIELD_RESUPPLY_RATE_PER_CAP_PER_SEC;

function run(strId: string | undefined) {
    const arr: number[] = [];
    for (let i = 0; i < TRIALS; i++) {
        let troops = LEGION;
        let n = 0;
        while (n < MAX) {
            const r = simulateOnce(
                [{
                    troops, maxTroops: CAP, region: 'CENTRAL', role: 'field',
                    general: { tier: 'famous', strategicSkillId: strId },
                }],
                [{ troops: ENEMY, region: 'CENTRAL', role: 'field', general: { tier: 'ordinary' } }],
                'plain', true, 'field',
            );
            if (!r.attackerWon || r.attSurvivors < 1) break;
            n++;
            troops = applyStrategicSustainAfterVictory(r.attSurvivors, CAP, strId, TRAVEL_SEC);
        }
        arr.push(n);
    }
    arr.sort((a, b) => a - b);
    return { avg: arr.reduce((s, x) => s + x, 0) / TRIALS, med: arr[Math.floor(TRIALS / 2)] };
}

const bonusPerBattle = computeFieldResupplyBonus(CAP, TRAVEL_SEC);

const cases: { label: string; id?: string }[] = [
    { label: '无战略', id: undefined },
    { label: '所向披靡（攻×1.5）', id: 'str_03' },
    { label: '因粮于敌（胜后+1%）', id: 'str_07' },
    { label: `以战养战（驻留${TRAVEL_SEC}s≈+${bonusPerBattle}兵/场）`, id: 'str_13' },
];

console.log(`\n5万 vs 1万 平原连战 | ${TRIALS}次 | 封顶${MAX}场 | 基础战后恢复30%`);
console.log(`以战养战：上限×${RATE}/秒 × 战后驻留${TRAVEL_SEC}秒（与游戏一致）\n`);
for (const c of cases) {
    const r = run(c.id);
    console.log(`${c.label.padEnd(30)} 均连胜 ${r.avg.toFixed(2)}  中位 ${r.med}`);
}
console.log('');
