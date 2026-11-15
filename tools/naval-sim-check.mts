/**
 * 海战场面离线验算：跑 N 场看时长、胜负、各类事件是否都出现（看点有没有真打出来）。
 * 用法：npx tsx --import ./tools/sim-preload.mjs tools/naval-sim-check.mts [场数]
 */
import { NavalBattleSim, type NavalEvent } from '../src/naval/NavalBattleSim';

const N = Number(process.argv[2] ?? 60);
const matchups: [string, string][] = [
    ['LOU_CHUAN', 'TURTLE_SHIP'],
    ['TRIREME', 'WAR_GALLEY'],
    ['DROMON', 'LONGBOAT'],
    ['CARAVEL', 'WAR_GALLEY'],
    ['FIRE_SHIP', 'LOU_CHUAN'],
    ['WAR_GALLEY', 'WAR_GALLEY'],
];
const troopsPairs: [number, number][] = [[10000, 10000], [15000, 9000], [8000, 20000], [12000, 11000]];

let totalT = 0, minT = Infinity, maxT = 0, attWins = 0, timeouts = 0, strongerWins = 0, unequal = 0;
const evCount: Record<string, number> = {};
const battlesWith: Record<string, number> = {};
for (let i = 0; i < N; i++) {
    const [sa, sd] = matchups[i % matchups.length];
    const [ta, td] = troopsPairs[Math.floor(i / matchups.length) % troopsPairs.length];
    const sim = new NavalBattleSim({
        attacker: { factionId: 'test_a', troops: ta, shipKey: sa },
        defender: { factionId: 'test_d', troops: td, shipKey: sd },
        seed: `check-${i}`,
    });
    const seen = new Set<string>();
    let guard = 0;
    while (!sim.result && guard++ < 20000) {
        sim.step(1 / 30);
        for (const e of sim.drainEvents() as NavalEvent[]) {
            const k = e.type === 'fire' || e.type === 'impact' ? `${e.type}:${e.weapon}` : e.type === 'rout' ? `rout:${e.reason}` : e.type;
            evCount[k] = (evCount[k] ?? 0) + 1;
            seen.add(k);
        }
    }
    for (const k of seen) battlesWith[k] = (battlesWith[k] ?? 0) + 1;
    const t = sim.time;
    totalT += t; minT = Math.min(minT, t); maxT = Math.max(maxT, t);
    if (!sim.result) { console.log('❌ 没打完', i); continue; }
    if (sim.result.winner === 'attacker') attWins++;
    if (t >= 299) timeouts++;
    if (ta !== td) { unequal++; if ((ta > td) === (sim.result.winner === 'attacker')) strongerWins++; }
    if (i < 8) console.log(`#${i} ${sa}(${ta}) vs ${sd}(${td}) → ${sim.result.winner} ${t.toFixed(0)}s 胜方余 ${(sim.result.winnerStrength * 100).toFixed(0)}% 船 ${sim.countAlive('attacker')}:${sim.countAlive('defender')}`);
}
console.log(`\n场数 ${N} · 时长 平均 ${(totalT / N).toFixed(0)}s 最短 ${minT.toFixed(0)}s 最长 ${maxT.toFixed(0)}s · 打满时限 ${timeouts} · 攻方胜 ${attWins} · 兵多方胜 ${strongerWins}/${unequal}`);
console.log('出现该事件的场数：');
for (const [k, v] of Object.entries(battlesWith).sort()) console.log(`  ${k.padEnd(18)} ${v}/${N} 场（共 ${evCount[k]} 次）`);
