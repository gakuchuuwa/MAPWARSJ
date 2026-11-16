/**
 * 核对 GG 交回的「主线61章按史实重排改写」分幕交付（2026-11-16 起）。
 * 跑法：node tools/chronicle/check-gg-chapter-batch.mjs <幕号>
 * 依据：剧本模式/99_GG任务与交付/主线61章切分表_按史实日期重排_2026-11-16.json
 *       剧本模式/02_播报文案/编年史主线1022场_战略播报字数设计表_按史实日期重排_2026-11-16.json
 *       剧本模式/02_播报文案/战争编年史_主线1022场合并战略播报_定稿_2026-11-15.json（原文）
 */
import fs from 'node:fs';
const act = Number(process.argv[2]);
const R = 'C:/MAPWARSJ/剧本模式/';
const split = JSON.parse(fs.readFileSync(R + '99_GG任务与交付/主线61章切分表_按史实日期重排_2026-11-16.json', 'utf8'));
const quota = Object.fromEntries(JSON.parse(fs.readFileSync(R + '02_播报文案/编年史主线1022场_战略播报字数设计表_按史实日期重排_2026-11-16.json', 'utf8')).map((r) => [r.id, r]));
const orig = Object.fromEntries(JSON.parse(fs.readFileSync(R + '02_播报文案/战争编年史_主线1022场合并战略播报_定稿_2026-11-15.json', 'utf8')).events.map((e) => [e.id, e]));
const file = fs.readdirSync(R + '99_GG任务与交付').find((f) => f.startsWith(`GG交付_主线61章按史实重排改写_第${act}幕`) && f.endsWith('.json'));
if (!file) { console.log(`没找到第${act}幕交付文件`); process.exit(1); }
const got = JSON.parse(fs.readFileSync(R + '99_GG任务与交付/' + file, 'utf8'));
const len = (s) => Array.from(s ?? '').length;
const rewrite = Object.fromEntries(split.rewrite.map((r) => [r.id, r.原因]));
const expect = split.order.map((id, k) => ({ id, seq: k + 1, q: quota[id] })).filter((x) => x.q.幕 === act);
const errs = [], warns = [];
const err = (id, m) => errs.push(`${id} ${m}`);
if (got.length !== expect.length) err('—', `场数 ${got.length}，应为 ${expect.length}`);
const BAN = [[/王朝/, '用了「王朝」'], [/(?<!朝)朝(?!鲜)/, null], [/[0-9０-９]/, '有阿拉伯数字'], [/[（）()「」“”"'【】]/, '有括号或引号'], [/；/, '有全角分号'], [/古城|古都|旧都/, '有古城/古都/旧都']];
let changed = 0;
expect.forEach((x, k) => {
  const g = got[k];
  if (!g || g.id !== x.id) { err(x.id, `第 ${k + 1} 条应为 ${x.id}，实为 ${g?.id}`); return; }
  if (g.新序号 !== x.seq || g.章 !== x.q.章 || g.幕 !== act) err(x.id, `新序号/章/幕不对：${g.新序号}/${g.章}/${g.幕}，应为 ${x.seq}/${x.q.章}/${act}`);
  const s = g.合并战略播报 ?? [];
  const total = s.reduce((a, p) => a + len(p), 0);
  if (s.length !== x.q.段数) err(x.id, `战略段数 ${s.length}，应为 ${x.q.段数}`);
  if (total < x.q.战略最少字 || total > x.q.战略最多字) err(x.id, `战略总字数 ${total}，应在 ${x.q.战略最少字}–${x.q.战略最多字}`);
  s.forEach((p, i) => { const n = len(p); if (n < x.q.单段最少字 || n > x.q.单段最多字) err(x.id, `战略第${i + 1}段 ${n} 字，应在 ${x.q.单段最少字}–${x.q.单段最多字}`); });
  const t = len(g.战术播报);
  if (t < 89 || t > 144) err(x.id, `战术 ${t} 字，应在 89–144`);
  const o = orig[x.id];
  const sameS = JSON.stringify(s) === JSON.stringify(o.合并战略播报);
  if (!sameS) changed++;
  // 硬性检查：时间不许倒退（核定年份不倒退，且禁止倒叙词）
  if (k > 0 && x.q.核定年份 < expect[k - 1].q.核定年份) err(x.id, `时间倒退：${expect[k - 1].id}(${expect[k - 1].q.核定年份}) → ${x.id}(${x.q.核定年份})`);
  const prevSame = k > 0 ? expect[k - 1].id === Object.values(orig).find((e) => e.seq === o.seq - 1)?.id : true;
  if (rewrite[x.id] && sameS) {
    const onlyHead = rewrite[x.id].every((w) => w === '章首');
    if (onlyHead && prevSame) warns.push(`${x.id} 章首保留原文（前一场与原顺序相同，可接受）`);
    else err(x.id, `要求改写（${rewrite[x.id].join('、')}）但战略播报与原文相同`);
  }
  if (!rewrite[x.id] && !sameS) warns.push(`${x.id} 未列入改写却改了战略播报`);
  if (g.战术播报 !== o.战术播报_勿动) warns.push(`${x.id} 战术播报有改动`);
  const text = s.join('') + (g.战术播报 ?? '');
  if (/回溯|先于此役|载之前/.test(s.join(''))) err(x.id, '战略播报含倒叙词（回溯/先于此役/载之前）');
  for (const [re, m] of BAN) if (m && re.test(text)) err(x.id, m);
  // 凑字复读（2026-11-17 第4–6幕 64 场把同一分句连写两遍）：同一场战略播报里，分句重复或一句是另一句的开头/结尾
  const clauses = s.join('。').split(/[，。、]/).map((c) => c.trim()).filter((c) => len(c) >= 7);
  const dup = new Set();
  for (let i = 0; i < clauses.length; i++) for (let j = i + 1; j < clauses.length; j++) {
    const [p, o] = len(clauses[i]) <= len(clauses[j]) ? [clauses[i], clauses[j]] : [clauses[j], clauses[i]];
    if (o.startsWith(p) || o.endsWith(p) || (len(p) >= 10 && o.includes(p)) || (len(p) >= 8 && p.slice(0, 8) === o.slice(0, 8))) dup.add(p);
  }
  if (dup.size) err(x.id, `战略播报分句重复（凑字）：${[...dup].join(' ／ ')}`);
  // 兵力确数（写作红线：不写兵力数字）：「五万精锐」「三千余人」之类；万里、千载这类不是兵力，放行
  const troops = [...text.matchAll(/[一二三四五六七八九两]+[十百千]?[万千]余?[^，。、]{0,4}/g)].map((m) => m[0])
    .filter((w) => !/^[一两]?[万千](里|户|民|国|载|世|古|难|分|秋|乘|年|丈|状|钧|众一心|辛|岁|方|象|人口)|千万人口|万里|千里|千载|千年|万世|万古|千秋|米|落|老幼|妇孺/.test(w));
  if (troops.length) err(x.id, `写了兵力确数：${troops.join('、')}`);
  // 「朝」单独检查：除「朝鲜」外，作政权后缀的「X朝」都不许；「朝廷/朝野/朝政」等常用词放行
  const chao = [...text.matchAll(/(?<!临|满|入|还|归|在)朝(?!鲜|廷|野|政|堂|中|臣|见|贡|局|会|夕|阳|向|着|天|服|拜|议|柄|发|纲)/g)].map((m) => text.slice(Math.max(0, m.index - 2), m.index + 2));
  if (chao.length) warns.push(`${x.id} 含「朝」需人工看：${chao.join('、')}`);
});
const need = expect.filter((x) => rewrite[x.id]).length;
console.log(`第${act}幕：交 ${got.length} 场 / 应 ${expect.length} 场；要求改写 ${need} 场，实际改了战略 ${changed} 场`);
console.log(`错误 ${errs.length} 条${errs.length ? '：\n  ' + errs.join('\n  ') : ''}`);
console.log(`提醒 ${warns.length} 条${warns.length ? '：\n  ' + warns.join('\n  ') : ''}`);
process.exit(errs.length ? 2 : 0);
