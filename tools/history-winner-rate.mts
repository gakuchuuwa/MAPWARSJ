/**
 * 陆战战术模式：史实胜方在画面上赢了几成（读真实对局探针日志 scratch/scene13_probe_log.jsonl）。
 *
 * 🔴 [2026-11-16 主人问「陆战可以使用这个方法吗，让历史赢家胜利的概率更高」] 陆战画面层要浏览器才能跑，
 *    离线测不了；这把尺子拿主人实机打过的局来量，改动前后各跑一次对比。
 *    口径：战役名对上编年史主线 → 史实胜方（编年史 winner 对照主角攻守身份）→ 与画面判出的胜方比。
 *
 * 用法：npx tsx --import ./tools/sim-preload.mjs tools/history-winner-rate.mts [起始日期，缺省 2026-11-01]
 */
import { readFileSync } from 'node:fs';
import { CHRONICLE_MAINLINE } from '../src/data/chronicle/ChronicleMainline.generated';

const since = process.argv[2] ?? '2026-11-01';
const byName = new Map<string, (typeof CHRONICLE_MAINLINE)[number]>();
for (const ev of CHRONICLE_MAINLINE) {
    if (ev.kind !== 'battle' || !ev.battle || !ev.winner || ev.winner === 'draw') continue;
    if (!byName.has(ev.battle.battleName)) byName.set(ev.battle.battleName, ev);
}

type Row = { title: string; story: boolean; type: string; expect: 'attacker' | 'defender'; got: string; ratio: number };
const rows: Row[] = [];
for (const line of readFileSync('scratch/scene13_probe_log.jsonl', 'utf8').split('\n')) {
    let o: any;
    try { o = JSON.parse(line); } catch { continue; }
    if (o.why !== 'decision' || !o.events || (o.at ?? '') < since) continue;
    const st = o.events.find((e: any) => e[1] === 'start')?.[2];
    const dc = o.events.find((e: any) => e[1] === 'decision')?.[2];
    if (!st?.title || !dc?.winner) continue;
    const clean = String(st.title).replace(/^公元前?\d+年\s*/, '').trim();
    const ev = byName.get(clean) ?? byName.get(String(st.title));
    if (!ev?.battle) continue;
    const lead: 'attacker' | 'defender' = ev.battle.role ?? 'attacker';
    // 经典战管线里主角固定在攻方，只有「守城战」主角守城
    const heroSide: 'attacker' | 'defender' = ev.battle.battleType === 'siege' && lead === 'defender' ? 'defender' : 'attacker';
    const heroWon = ev.winner === lead;
    const expect = heroWon ? heroSide : (heroSide === 'attacker' ? 'defender' : 'attacker');
    const hTroops = expect === 'attacker' ? st.att : st.def, oTroops = expect === 'attacker' ? st.def : st.att;
    rows.push({ title: clean, story: !!st.story, type: st.type, expect, got: dc.winner, ratio: hTroops / Math.max(1, oTroops) });
}

const rate = (list: Row[]) => list.length ? `${list.filter((r) => r.got === r.expect).length}/${list.length}（${(list.filter((r) => r.got === r.expect).length / list.length * 100).toFixed(0)}%）` : '无';
console.log(`${since} 以来对上编年史的陆战 ${rows.length} 局，史实胜方画面上赢 ${rate(rows)}`);
// 探针的 story 标的是「经典战」（即时战斗经典战与历史模式主线都算），日志里没记游戏模式，分不出哪局是历史模式
console.log(`  其中经典战（story）${rate(rows.filter((r) => r.story))} · 其他 ${rate(rows.filter((r) => !r.story))}`);
console.log(`  野战 ${rate(rows.filter((r) => r.type === 'field'))} · 攻城 ${rate(rows.filter((r) => r.type === 'siege'))}`);
console.log(`  史实胜方兵力 ≥ 对方 ${rate(rows.filter((r) => r.ratio >= 1))} · 少于对方 ${rate(rows.filter((r) => r.ratio < 1))}`);
