/**
 * 主线战略播报能否在行军途中念完（2026-11-17）。
 * 先跑行军测算，把结果写到任意位置：
 *   CHRONICLE_MARCH_OUT=<路径>/march.json npx tsx --import ./tools/sim-preload.mjs tools/chronicle/calc-march-times.mts
 * 再跑：npx tsx tools/chronicle/check-briefing-fits-march.mjs <路径>/march.json
 * 上限公式与 apply-strategic-quota-by-time.mjs 相同：可念秒数 = min(移动秒, 300) − 5 ×（屏数 − 1），上限 = 可念秒数 × 2.98（最少 45 字）。
 * 公式已留约一成七余量，所以只把超出上限一成五以上的算作不合格。
 */
import fs from 'node:fs';
import { CHRONICLE_MAINLINE } from '../../src/data/chronicle/ChronicleMainline.generated.ts';

const file = process.argv[2];
if (!file) { console.log('用法：npx tsx tools/chronicle/check-briefing-fits-march.mjs <march.json>'); process.exit(1); }
const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
const sec = new Map((Array.isArray(raw) ? raw : raw.results).map((r) => [r.id, Number(r.totalSec)]));
const CPS = 3.6 * 0.92 * 0.9;
const bad = [], warn = [];
for (const ev of CHRONICLE_MAINLINE) {
  const s = sec.get(ev.id);
  if (s === undefined) { bad.push(`${ev.id} 行军测算里没有这一场`); continue; }
  const n = ev.strategic.reduce((a, p) => a + Array.from(p).length, 0);
  const max = Math.max(45, Math.floor((Math.min(s, 300) - 5 * (ev.strategic.length - 1)) * CPS));
  const over = n / max - 1;
  const line = `${ev.id} ${ev.title}：${n} 字 / 上限 ${max}（移动 ${s.toFixed(1)} 秒，${ev.strategic.length} 屏），超 ${Math.round(over * 100)}%`;
  if (over > 0.15) bad.push(line); else if (over > 0) warn.push(line);
}
console.log(`共 ${CHRONICLE_MAINLINE.length} 场；不合格（超一成五以上）${bad.length} 场，略超 ${warn.length} 场`);
if (bad.length) console.log('不合格：\n  ' + bad.join('\n  '));
process.exit(bad.length ? 2 : 0);
