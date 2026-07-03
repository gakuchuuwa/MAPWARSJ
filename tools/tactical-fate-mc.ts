/**
 * 命运系单技 MC 胜率表：验证 #12–#20 接入后各技在不同兵力比下的胜率。
 * 运行：npm run tactical:fate-mc
 *
 * 方法：att 挂待测命运技（内联档），def 为无技普将（默认 [0.8,1.2]）。
 * 同一场景先跑 baseline（att 也无技），再跑各技，报告胜率与相对基线的提升。
 * 走开战快速判定（不逐帧），纯测开战掷点强弱——命运系全部作用于开战 luck。
 */
import { simulateOnce, type UnitSpec, type Terrain } from './combat-model';

const N = 40000;

type FateSkill = { id: string; name: string };

// 待测开战命运技（逆局系 016/017 不在此表，另走逐帧验证）
const FATE_SKILLS: FateSkill[] = [
    { id: '', name: '（无技·基线）' },
    { id: 'ts_012', name: '破釜沉舟 [0.5,1.5] 深劣势<70%' },
    { id: 'ts_013', name: '背水一战 [0.65,1.35] 无条件' },
    { id: 'ts_014', name: '步步为营 锁1.0 无条件' },
    { id: 'ts_015', name: '进退有度 [0.9,1.1] 无条件' },
    { id: 'ts_018', name: '死地后生 [0.5,1.5] 以少打多' },
    { id: 'ts_019', name: '风声鹤唳 扰敌[0.5,1.5] 无条件' },
    { id: 'ts_020', name: '济河焚舟 [0.9,1.5] 以少打多' },
];

type Scenario = { name: string; att: number; def: number };

const SCENARIOS: Scenario[] = [
    { name: '对称 2万vs2万', att: 20000, def: 20000 },
    { name: '浅劣势 1.4万vs2万(0.70)', att: 14000, def: 20000 },
    { name: '深劣势 1.2万vs2万(0.60)', att: 12000, def: 20000 },
    { name: '明星优势 3.5万vs1万', att: 35000, def: 10000 },
];

function makeSpec(troops: number, skillId: string): UnitSpec {
    return {
        troops,
        region: 'CENTRAL', // ×1.0，令 base 比 = 兵力比
        role: 'field',
        general: skillId
            ? { tier: 'famous', tacticalSkillId: skillId }
            : { tier: 'famous' }, // 同带将（intimidation 对齐），只差战术技
    };
}

function winRate(attTroops: number, defTroops: number, skillId: string): number {
    let wins = 0;
    const terrain: Terrain = null;
    for (let i = 0; i < N; i++) {
        const r = simulateOnce(
            [makeSpec(attTroops, skillId)],
            [makeSpec(defTroops, '')],
            terrain,
            false,
        );
        if (r.attackerWon) wins++;
    }
    return wins / N;
}

function main(): void {
    console.log(`══ 命运系单技 MC 胜率表（N=${N}/格，att 挂技 vs def 无技）══\n`);
    for (const sc of SCENARIOS) {
        const baseline = winRate(sc.att, sc.def, '');
        console.log(`【${sc.name}】基线胜率 ${(baseline * 100).toFixed(1)}%`);
        for (const skill of FATE_SKILLS) {
            if (skill.id === '') continue;
            const wr = winRate(sc.att, sc.def, skill.id);
            const lift = (wr - baseline) * 100;
            const sign = lift >= 0 ? '+' : '';
            console.log(
                `   ${skill.name.padEnd(28)} ${(wr * 100).toFixed(1).padStart(5)}%  (${sign}${lift.toFixed(1)}pt)`,
            );
        }
        console.log('');
    }
}

main();
