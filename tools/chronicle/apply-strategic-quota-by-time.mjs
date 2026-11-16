/**
 * 战略播报字数按移动时间定（2026-11-16 主人定，取代 S1–S5 五档与 233 字封顶）。
 *
 *   字数上限 = 移动秒数 × 3.6 字/秒 × 0.92 × 0.9 ≈ 移动秒数 × 2.98，不封顶；
 *     3.6 是朗读速度；0.92 让军团到站前几秒念完；0.9 吸收实际移动比离线测算快一成的偏差。
 *   字数下限 = 上限 × 0.8；保底 38–45 字（原地开战也要报纪年和双方）。
 *   屏数 = 上限 ÷ 144 向上取整；一屏一段，念完一屏自动接下一屏（ClassicBattleBriefingRunner 段数不限）。
 *   单段区间 = 总区间平分后上下各放宽一成，单段最多 144 字。
 *
 * 就地改写：
 *   剧本模式/02_播报文案/编年史主线1022场_战略播报字数设计表_按史实日期重排_2026-11-16.json
 *   剧本模式/99_GG任务与交付/GG任务单_主线1022场按史实重排与衔接重写_2026-11-16.md（第五节逐场清单与摘要计数）
 * 用法：node tools/chronicle/apply-strategic-quota-by-time.mjs
 */
import fs from 'node:fs';

const R = 'C:/MAPWARSJ/剧本模式/';
const QUOTA = R + '02_播报文案/编年史主线1022场_战略播报字数设计表_按史实日期重排_2026-11-16.json';
const SHEET = R + '99_GG任务与交付/GG任务单_主线1022场按史实重排与衔接重写_2026-11-16.md';
const FINAL = R + '02_播报文案/战争编年史_主线1022场合并战略播报_定稿_2026-11-15.json';

export const CHARS_PER_SEC = 3.6 * 0.92 * 0.9;
export const SCREEN_MAX = 144;

export function strategicQuota(sec) {
  const max = Math.max(45, Math.floor(sec * CHARS_PER_SEC));
  const min = Math.max(38, Math.round(max * 0.8));
  const screens = Math.ceil(max / SCREEN_MAX);
  const pmin = screens === 1 ? min : Math.floor((min / screens) * 0.9);
  const pmax = screens === 1 ? max : Math.min(SCREEN_MAX, Math.ceil((max / screens) * 1.1));
  return { tier: `${screens}屏`, screens, min, max, pmin, pmax };
}

const len = (s) => [...s].length;
const table = JSON.parse(fs.readFileSync(QUOTA, 'utf8'));
const fin = JSON.parse(fs.readFileSync(FINAL, 'utf8'));
const finArr = Array.isArray(fin) ? fin : (fin.events ?? Object.values(fin).find(Array.isArray));
const text = Object.fromEntries(finArr.map((e) => [e.id, e['合并战略播报'] ?? []]));

for (const r of table) {
  const q = strategicQuota(r.移动秒数);
  const cur = text[r.id] ?? [];
  const total = cur.reduce((s, p) => s + len(p), 0);
  Object.assign(r, {
    档位: q.tier, 段数: q.screens, 战略最少字: q.min, 战略最多字: q.max, 单段最少字: q.pmin, 单段最多字: q.pmax,
    现战略段数: cur.length, 现战略字数: total,
    现战略合规: cur.length === q.screens && total >= q.min && total <= q.max && cur.every((p) => len(p) >= q.pmin && len(p) <= q.pmax),
  });
}
fs.writeFileSync(QUOTA, JSON.stringify(table, null, 1) + '\n');

// ── 任务单第五节：保留其他原因，按新配额重判「字数不合新配额」 ──
const md = fs.readFileSync(SHEET, 'utf8').split('\n');
const head = md.findIndex((l) => l.startsWith('## 五、'));
const tStart = head + 2; // 表头行
let tEnd = tStart + 2;
while (tEnd < md.length && md[tEnd].startsWith('| ')) tEnd++;
const KEY = '字数不合新配额';
const reasonsOf = {};
for (const l of md.slice(tStart + 2, tEnd)) {
  const c = l.split('|').map((s) => s.trim());
  const id = c[4].match(/（(evt_\w+)）/)[1];
  reasonsOf[id] = { cells: c, reasons: c[7].split('、').filter((x) => x && x !== KEY) };
}
const rows = [];
const cnt = {};
for (const r of table) {
  const old = reasonsOf[r.id];
  const reasons = [...(old?.reasons ?? [])];
  if (!r.现战略合规) reasons.push(KEY);
  if (!reasons.length) continue;
  reasons.forEach((x) => (cnt[x] = (cnt[x] ?? 0) + 1));
  const c = old?.cells;
  const yr = (y) => (y < 0 ? `前${-y}` : `${y}`);
  rows.push(`| ${r.新序号} | ${r.幕} | ${r.章} | ${c ? c[4] : `${r.事件名称}（${r.id}）`} | ${c ? c[5] : r.公历决战日} | ${c ? c[6] : yr(r.核定年份) + r.核定季节} | ${reasons.join('、')} | ${r.档位} | ${r.战略最少字}–${r.战略最多字} | ${r.段数} | ${r.现战略字数}/${r.现战略段数} |`);
}
md.splice(tStart, tEnd - tStart,
  '| 新序号 | 幕 | 章 | 事件（id） | 公历决战日 | 核定年季 | 原因 | 屏数 | 新字数区间 | 段数 | 现字数/段数 |',
  '|---:|---:|---:|---|---|---|---|---|---|---:|---|',
  ...rows);
md[head] = `## 五、需改写／重点核查场次清单（共 ${rows.length} 场）`;
const sumIdx = md.findIndex((l) => l.startsWith('- 需重点检查并重写战略播报的场次共'));
md[sumIdx] = `- 需重点检查并重写战略播报的场次共 **${rows.length} 场**：章首 **${cnt['章首'] ?? 0}** 场、前一场变动 **${cnt['前一场变动'] ?? 0}** 场、年份修正 **${cnt['年份修正'] ?? 0}** 场、季节修正 **${cnt['季节修正'] ?? 0}** 场、字数不合新配额 **${cnt[KEY] ?? 0}** 场、含疑似倒叙词 **${cnt['含疑似倒叙词'] ?? 0}** 场（同一场可能叠加多项原因；其余未列入场次也请顺手核查衔接与史实年份季节，无误则保留定稿原文）。`;
fs.writeFileSync(SHEET, md.join('\n'));

const by = {};
table.forEach((r) => (by[r.段数] = (by[r.段数] ?? 0) + 1));
console.log('屏数分布', by, '总字数上限', table.reduce((s, r) => s + r.战略最多字, 0), '不合配额', cnt[KEY], '清单场次', rows.length);
