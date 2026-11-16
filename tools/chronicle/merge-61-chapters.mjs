/**
 * 主线 61 章按史实日期重排合并（2026-11-17）：七幕 GG 交付（已含 CC 修正）→
 *   1. 新定稿 剧本模式/02_播报文案/战争编年史_主线61章_定稿_2026-11-17.json（新顺序、章幕、多屏战略播报）
 *   2. 回写引擎全库 剧本模式/01_事件与故事/…2526场纯史实引擎全库.json：主线 1022 场的 战略播报 / 战术播报，
 *      以及 年份year / 季节 改成字数表里的 核定年份 / 核定季节（GG 第 1–6 批史实日期核定结果）
 * 跑法：node tools/chronicle/merge-61-chapters.mjs [--dry]
 * 之后：npx tsx --import ./tools/sim-preload.mjs tools/chronicle/import-mainline.mts
 */
import fs from 'node:fs';
const DRY = process.argv.includes('--dry');
const R = 'C:/MAPWARSJ/剧本模式/';
const LIB = R + '01_事件与故事/战争事件编年史_全二十四卷_前550至1870年_2526场纯史实引擎全库.json';
const OUT = R + '02_播报文案/战争编年史_主线61章_定稿_2026-11-17.json';
const split = JSON.parse(fs.readFileSync(R + '99_GG任务与交付/主线61章切分表_按史实日期重排_2026-11-16.json', 'utf8'));
const quota = Object.fromEntries(JSON.parse(fs.readFileSync(R + '02_播报文案/编年史主线1022场_战略播报字数设计表_按史实日期重排_2026-11-16.json', 'utf8')).map((r) => [r.id, r]));
const len = (s) => Array.from(s).length;
const errs = [];

// 七幕合并，校验顺序与字数
const delivered = [];
for (let a = 1; a <= 7; a++) {
  const f = fs.readdirSync(R + '99_GG任务与交付').find((x) => x.startsWith(`GG交付_主线61章按史实重排改写_第${a}幕`) && x.endsWith('.json'));
  if (!f) { errs.push(`缺第${a}幕交付`); continue; }
  delivered.push(...JSON.parse(fs.readFileSync(R + '99_GG任务与交付/' + f, 'utf8')));
}
if (delivered.length !== split.order.length) errs.push(`交付 ${delivered.length} 场，切分表 ${split.order.length} 场`);
delivered.forEach((g, k) => {
  if (g.id !== split.order[k]) errs.push(`第 ${k + 1} 场应为 ${split.order[k]}，实为 ${g.id}`);
  const q = quota[g.id];
  const tot = g.合并战略播报.reduce((s, p) => s + len(p), 0);
  if (g.合并战略播报.length !== q.段数 || tot < q.战略最少字 || tot > q.战略最多字) errs.push(`${g.id} 战略字数/段数不合`);
  const t = len(g.战术播报);
  if (t < 89 || t > 144) errs.push(`${g.id} 战术 ${t} 字`);
  if (k > 0 && q.核定年份 < quota[delivered[k - 1].id].核定年份) errs.push(`${g.id} 核定年份倒退`);
});

const libRaw = fs.readFileSync(LIB, 'utf8');
const lib = JSON.parse(libRaw);
const finale = delivered.at(-1)?.全书收官播报 ?? lib['收官播报'];
if (!finale) errs.push('缺全书收官播报');
if (errs.length) { console.error('合并失败：\n  ' + errs.join('\n  ')); process.exit(1); }

const chapterOf = new Map();
for (const c of split.chapters) for (const id of c.events) chapterOf.set(id, c);

// 1. 新定稿
const merged = {
  说明: '主线 1022 场 · 7 幕 61 章定稿（2026-11-17）。全书按核定公历决战日排序，不倒叙；由七幕 GG 交付合并而成，已含 CC 修正（见 99_GG任务与交付/CC修正记录_主线61章按史实重排_2026-11-17.md）。年份与季节为核定值。',
  日期: '2026-11-17',
  幕: split.幕,
  章: split.chapters.map((c) => ({ 章: c.章, 幕: c.幕, 标题: c.标题, 场数: c.场数, 起年: c.起年, 止年: c.止年 })),
  全书收官播报: finale,
  events: delivered.map((g, k) => {
    const c = chapterOf.get(g.id);
    const q = quota[g.id];
    return { 新序号: k + 1, id: g.id, 章: c.章, 章名: c.标题, 幕: c.幕, 幕名: split.幕[c.幕], 公历决战日: q.公历决战日, 年份: q.核定年份, 季节: q.核定季节, 战略播报: g.合并战略播报, 战术播报: g.战术播报 };
  }),
};

// 2. 回写引擎全库
const libById = new Map(lib.events.map((e) => [e['事件ID'], e]));
let textChanged = 0;
const yearLog = [], seasonLog = [];
for (const g of delivered) {
  const e = libById.get(g.id);
  if (!e) { errs.push(`全库没有 ${g.id}`); continue; }
  const q = quota[g.id];
  const s = g.合并战略播报.join('\n');
  if (e['战略播报'] !== s || e['战术播报'] !== g.战术播报) textChanged++;
  e['战略播报'] = s;
  e['战术播报'] = g.战术播报;
  if (Number(e['年份year']) !== q.核定年份) { yearLog.push(`${g.id} ${e['事件名称']} ${e['年份year']}→${q.核定年份}`); e['年份year'] = typeof e['年份year'] === 'number' ? q.核定年份 : String(q.核定年份); }
  if (e['季节'] !== q.核定季节) { seasonLog.push(`${g.id} ${e['事件名称']} ${e['季节']}→${q.核定季节}`); e['季节'] = q.核定季节; }
}
if (lib['收官播报'] !== finale) lib['收官播报'] = finale;
if (errs.length) { console.error('回写失败：\n  ' + errs.join('\n  ')); process.exit(1); }

console.log(`合并 ${delivered.length} 场；全库播报有变 ${textChanged} 场；年份改 ${yearLog.length} 场；季节改 ${seasonLog.length} 场`);
console.log('年份：\n' + yearLog.map((x) => '  ' + x).join('\n'));
if (DRY) { console.log('（--dry，未写文件）'); process.exit(0); }
fs.writeFileSync(OUT, JSON.stringify(merged, null, 1) + '\n', 'utf8');
const eol = libRaw.includes('\r\n') ? '\r\n' : '\n';
let libOut = JSON.stringify(lib, null, 2);
if (eol === '\r\n') libOut = libOut.replace(/\n/g, '\r\n');
fs.writeFileSync(LIB, libOut + (libRaw.endsWith('\n') ? eol : ''), 'utf8');
console.log(`已写 ${OUT}\n已回写 ${LIB}`);
