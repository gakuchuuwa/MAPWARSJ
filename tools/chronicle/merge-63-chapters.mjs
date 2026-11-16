/**
 * 主线 63 章改写合并（2026-11-16）：七幕 GG 交付（已含 CC 修正）→
 *   1. 新定稿 剧本模式/02_播报文案/战争编年史_主线63章_定稿_2026-11-16.json（新顺序、章幕、两段播报）
 *   2. 回写引擎全库 剧本模式/01_事件与故事/…2526场纯史实引擎全库.json：主线 1022 场的 战略播报 / 战术播报 / 季节
 *      （季节按播报文字里本场纪年后的季节字，即按史实月份；文字没写季节的不动）
 * 跑法：node tools/chronicle/merge-63-chapters.mjs [--dry]
 * 之后：npx tsx --import ./tools/sim-preload.mjs tools/chronicle/import-mainline.mts
 */
import fs from 'node:fs';
const DRY = process.argv.includes('--dry');
const R = 'C:/MAPWARSJ/剧本模式/';
const LIB = R + '01_事件与故事/战争事件编年史_全二十四卷_前550至1870年_2526场纯史实引擎全库.json';
const OUT = R + '02_播报文案/战争编年史_主线63章_定稿_2026-11-16.json';
const split = JSON.parse(fs.readFileSync(R + '99_GG任务与交付/主线63章切分表_2026-11-16.json', 'utf8'));
const quota = Object.fromEntries(JSON.parse(fs.readFileSync(R + '02_播报文案/编年史主线1022场_战略播报字数设计表_63章新序_2026-11-16.json', 'utf8')).map((r) => [r.id, r]));
const len = (s) => Array.from(s).length;
const errs = [];

// 七幕合并，校验顺序与字数
const delivered = [];
for (let a = 1; a <= 7; a++) {
  const f = fs.readdirSync(R + '99_GG任务与交付').find((x) => x.startsWith(`GG交付_主线63章战略播报改写_第${a}幕`) && x.endsWith('.json'));
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
});
const finale = delivered.at(-1)?.全书收官播报;
if (!finale) errs.push('末场缺 全书收官播报');
if (errs.length) { console.error('合并失败：\n  ' + errs.join('\n  ')); process.exit(1); }

const chapterOf = new Map();
for (const c of split.chapters) for (const id of c.events) chapterOf.set(id, c);

// 播报文字里本场纪年后的季节字（取最后一处）
const seasonInText = (paras) => {
  const ms = [...paras.join('').matchAll(/公元前?[〇零一二三四五六七八九十百]+年(初|盛|深|暮|隆)?(春|夏|秋|冬)/g)];
  return ms.length ? ms.at(-1)[2] : null;
};

// 1. 新定稿
const merged = {
  说明: '主线 1022 场 · 7 幕 63 章定稿（2026-11-16）。由七幕 GG 交付合并而成，已含 CC 修正（见 99_GG任务与交付/CC修正记录_主线63章_2026-11-16.md）。events 按播放顺序排列；战略播报为一段或两段；全书收官播报在全书末尾单独播出。',
  日期: '2026-11-16',
  幕: split.幕,
  章: split.chapters.map((c) => ({ 章: c.章, 幕: c.幕, 标题: c.标题, 主轴: c.主轴, 场数: c.场数, 起年: c.起年, 止年: c.止年 })),
  全书收官播报: finale,
  events: delivered.map((g, k) => {
    const c = chapterOf.get(g.id);
    return { 新序号: k + 1, id: g.id, 章: c.章, 章名: c.标题, 幕: c.幕, 幕名: split.幕[c.幕], 季节: seasonInText(g.合并战略播报), 战略播报: g.合并战略播报, 战术播报: g.战术播报 };
  }),
};

// 2. 回写引擎全库
const libRaw = fs.readFileSync(LIB, 'utf8');
const lib = JSON.parse(libRaw);
const libById = new Map(lib.events.map((e) => [e['事件ID'], e]));
let textChanged = 0, seasonChanged = 0;
const seasonLog = [];
for (const g of delivered) {
  const e = libById.get(g.id);
  if (!e) { errs.push(`全库没有 ${g.id}`); continue; }
  const s = g.合并战略播报.join('\n');
  if (e['战略播报'] !== s || e['战术播报'] !== g.战术播报) textChanged++;
  e['战略播报'] = s;
  e['战术播报'] = g.战术播报;
  const se = seasonInText(g.合并战略播报);
  if (se && e['季节'] !== se) { seasonLog.push(`${g.id} ${e['事件名称']} ${e['季节']}→${se}`); e['季节'] = se; seasonChanged++; }
}
if (lib['收官播报'] !== finale) { lib['收官播报'] = finale; }
if (errs.length) { console.error('回写失败：\n  ' + errs.join('\n  ')); process.exit(1); }

console.log(`合并 ${delivered.length} 场；全库播报有变 ${textChanged} 场；季节改 ${seasonChanged} 场`);
console.log(seasonLog.map((x) => '  ' + x).join('\n'));
if (DRY) { console.log('（--dry，未写文件）'); process.exit(0); }
fs.writeFileSync(OUT, JSON.stringify(merged, null, 1) + '\n', 'utf8');
fs.writeFileSync(LIB, JSON.stringify(lib, null, 2) + (libRaw.endsWith('\n') ? '\n' : ''), 'utf8');
console.log(`已写 ${OUT}\n已回写 ${LIB}`);
