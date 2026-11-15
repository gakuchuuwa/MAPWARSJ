/** 由 63 章切分结果生成：切分表、按新序重算的字数设计表、GG 任务单（2026-11-16）。用法见 chapters-63-split.mjs 文件头。 */
import fs from 'node:fs';
const S = 'C:/MAPWARSJ/scratch/chronicle63/';
const R = 'C:/MAPWARSJ/剧本模式/';
const outMd = R + '99_GG任务与交付/GG任务单_主线1022场分章重编与衔接改写_2026-11-16.md';
const outSplit = R + '99_GG任务与交付/主线63章切分表_2026-11-16.json';
const outQuota = R + '02_播报文案/编年史主线1022场_战略播报字数设计表_63章新序_2026-11-16.json';

const { rows, order } = JSON.parse(fs.readFileSync(S + 'chapters.json', 'utf8'));
const rd = JSON.parse(fs.readFileSync(R + '01_事件与故事/战争编年史_主线全卷连读本_2026-11-14.json', 'utf8'));
const byId = Object.fromEntries(rd.events.map((e) => [e.事件ID, e]));
const fin = JSON.parse(fs.readFileSync(R + '02_播报文案/战争编年史_主线1022场合并战略播报_定稿_2026-11-15.json', 'utf8'));
const F = Object.fromEntries(fin.events.map((e) => [e.id, e]));
const oldQ = Object.fromEntries(JSON.parse(fs.readFileSync(R + '02_播报文案/编年史主线1022场_战略播报字数设计表_2026-11-15.json', 'utf8')).map((r) => [r.id, r]));
const march = Object.fromEntries(JSON.parse(fs.readFileSync(S + 'march_new.json', 'utf8')).map((r) => [r.id, r]));
const yr = (y) => (y < 0 ? `前${-y}` : `${y}`);
const len = (s) => Array.from(s).length;
const ACT = { 1: '上古列国', 2: '古典帝国对撞', 3: '东汉三国与罗马危机', 4: '迁徙时代与隋唐', 5: '伊斯兰、拜占庭与宋辽金夏', 6: '蒙古、大明与大航海', 7: '火器帝国与终章' };

// 五档算法（docs/02-design/systems/编年史战略播报字数设计-2026-11-15.md §三）
function quota(id, sec, seq) {
  if (seq === 1) return { tier: 'S3·首战特例', paragraphs: 1, min: 75, max: 95 };
  if (sec <= 15) return { tier: 'S1·微距档', paragraphs: 1, min: 38, max: 55 };
  if (sec <= 25) { const max = Math.min(89, Math.round(sec * 3.65)); return { tier: 'S2·短途档', paragraphs: 1, min: Math.max(38, Math.round(max * 0.76)), max }; }
  if (sec <= 44) { const max = Math.min(144, Math.round(sec * 3.6)); return { tier: 'S3·标准档', paragraphs: 1, min: Math.round(max * 0.78), max }; }
  if (sec <= 65) { const max = Math.min(188, Math.round(sec * 3.55)); return { tier: 'S4·中长途档', paragraphs: 2, min: Math.max(144, Math.round(max * 0.8)), max }; }
  return { tier: 'S5·远征档', paragraphs: 2, min: 188, max: 233 };
}
const paraRange = (q) => (q.paragraphs === 1 ? [q.min, q.max] : [Math.floor(q.min / 2), Math.ceil(q.max / 2)]);

const chOf = {}, actOf = {};
rows.forEach((r) => r.ids.forEach((id) => { chOf[id] = r.ch; actOf[id] = r.act; }));
const table = order.map((id, k) => {
  const m = march[id];
  const sec = k === 0 ? +(m.totalSec - 33.7).toFixed(1) : m.totalSec;
  const o = oldQ[id];
  // 移动时间与旧表一致（±0.5s）时沿用旧表区间，避免近似公式引入几个字的出入
  const q = (o && Math.abs(o.effSec - sec) < 0.5) ? { tier: o.tier, paragraphs: o.paragraphs, min: o.minChars, max: o.maxChars } : quota(id, sec, k + 1);
  const [pmin, pmax] = paraRange(q);
  const cur = F[id]['合并战略播报'] ?? [];
  const curLen = cur.reduce((s, p) => s + len(p), 0);
  const tac = len(F[id]['战术播报_勿动'] ?? '');
  const fitStrat = cur.length === q.paragraphs && curLen >= q.min && curLen <= q.max && cur.every((p) => len(p) >= pmin && len(p) <= pmax);
  return { 新序号: k + 1, id, 章: chOf[id], 幕: actOf[id], 事件名称: byId[id].事件名称, 年份: byId[id].年份year, 移动方式: m.mode, 移动秒数: sec, 出发: m.fromCityName, 档位: q.tier, 段数: q.paragraphs, 战略最少字: q.min, 战略最多字: q.max, 单段最少字: pmin, 单段最多字: pmax, 现战略段数: cur.length, 现战略字数: curLen, 现战略合规: fitStrat, 现战术字数: tac, 现战术合规: tac >= 89 && tac <= 144, 旧表移动秒数: o?.effSec ?? null };
});
const T = Object.fromEntries(table.map((r) => [r.id, r]));
fs.writeFileSync(outQuota, JSON.stringify(table, null, 1), 'utf8');

// 需要改写的场次与原因
const reasons = {};
const add = (id, why) => ((reasons[id] ??= []).includes(why) || reasons[id].push(why));
for (let k = 0; k < order.length; k++) {
  const id = order[k], e = byId[id];
  if (k > 0) {
    const p = byId[order[k - 1]];
    if (chOf[p.事件ID] !== chOf[id]) add(id, '章首');
    else if (p.下一事件ID !== id) add(id, '调序后新相邻');
    else if (e.年份year < p.年份year) add(id, '章内并行');
  }
  if (!T[id].现战略合规) add(id, '字数不合新配额');
}
const need = order.filter((id) => reasons[id]);
const cnt = (w) => need.filter((id) => reasons[id].includes(w)).length;
const tacBad = table.filter((r) => !r.现战术合规);
const moved = order.filter((id, k) => byId[id].主线序号 !== k + 1).length;

fs.writeFileSync(outSplit, JSON.stringify({
  说明: '主线 1022 场重编为 63 章（7 幕）。chapters[].events 为该章按播放顺序的事件ID；order 为全书新播放顺序；rewrite 为本轮要改写战略播报的场次及原因。字数配额见 02_播报文案/编年史主线1022场_战略播报字数设计表_63章新序_2026-11-16.json。',
  日期: '2026-11-16', 章数: rows.length, 总场数: order.length, 幕: ACT,
  chapters: rows.map((r) => ({ 章: r.ch, 幕: r.act, 标题: r.title, 主轴: r.axis, 场数: r.n, 起年: r.y0, 止年: r.y1, 旧段: r.oldSegs, 棒: r.batons, 章内调序: r.reordered, events: r.ids })),
  order,
  rewrite: need.map((id) => ({ id, 新序号: T[id].新序号, 章: T[id].章, 原因: reasons[id] })),
}, null, 1), 'utf8');

const L = [];
L.push('# GG任务单：主线 1022 场分章重编与战略播报改写（2026-11-16）', '');
L.push('## 一、总原则', '');
L.push('整部主线是**一个从前 550 年连到 1864 年的大故事**。故事只由两样东西讲：每场的**战略播报**（军团在战略地图上行军时念）和**战术播报**（进入战场后念）。没有别的衔接字段：上一场到这一场的过渡，就写在这一场战略播报的开头。', '');
L.push('- **战略播报**：字数由这一场在战略地图上的实际移动时间决定，按五档算法给出每场的上下限（见第四节）。念完的时间要刚好落在行军途中，不许军团到了城下还在干等。');
L.push('- **战术播报**：内容可以改，字数必须在 **89–144 字**。');
L.push('- 场次一场不增、一场不删，事件ID不变。', '');
L.push('## 二、这次改了什么', '');
L.push('原来 16 段，每段跨度太大；段与段、棒与棒之间换人换战区时年份还会倒退（全书 46 处，最大 −27 年）。现在重编为 **7 幕 63 章**：');
L.push('', '- 一章 = 一个主轴势力（或一组对手）+ 一片战区，约 7–32 场；');
L.push('- 章界尽量落在原来换人、换战区、年份倒退的地方；');
L.push(`- 少数章内把同一战区的场次排到了一起，共 ${moved} 场的播放位置变了；`);
L.push('- 章内年份倒退降到 14 处，最大 −16 年，都是同一章里两条战线并行。', '');
L.push('## 三、七幕六十三章', '');
L.push('| 幕 | 名称 | 章 | 场数 | 年份 |', '|---|---|---|---:|---|');
for (const a of [1, 2, 3, 4, 5, 6, 7]) {
  const rs = rows.filter((r) => r.act === a);
  L.push(`| ${a} | ${ACT[a]} | 第${rs[0].ch}–${rs.at(-1).ch}章 | ${rs.reduce((s, r) => s + r.n, 0)} | ${yr(Math.min(...rs.map((r) => r.y0)))}–${yr(Math.max(...rs.map((r) => r.y1)))} |`);
}
L.push('', '| 章 | 幕 | 章名 | 主轴 | 场 | 年份 | 首场 → 末场 | 原棒 |', '|---:|---:|---|---|---:|---|---|---|');
for (const r of rows) {
  const f = byId[r.ids[0]], l = byId[r.ids.at(-1)];
  L.push(`| ${r.ch} | ${r.act} | ${r.title} | ${r.axis} | ${r.n} | ${yr(r.y0)}–${yr(r.y1)} | ${f.事件名称} → ${l.事件名称} | ${r.batons.join('、')}${r.reordered ? '（调序）' : ''} |`);
}
L.push('', '## 四、战略播报字数：五档算法', '');
L.push('按 `tools/chronicle/calc-march-times.mts`（复刻游戏寻路与移速）**按新顺序**重算了每场移动秒数，再按下表定字数。每场的具体上下限在 `02_播报文案/编年史主线1022场_战略播报字数设计表_63章新序_2026-11-16.json`，**以该表为准**。', '');
L.push('| 档位 | 移动秒数 | 段数 | 总字数 | 上限算法 |', '|---|---|---:|---|---|');
L.push('| S1 微距 | 0–15 | 1 | 38–55 | 固定 |');
L.push('| S2 短途 | 15–25 | 1 | 约 45–89 | 秒数 × 3.65，封顶 89 |');
L.push('| S3 标准 | 25–44 | 1 | 约 70–144 | 秒数 × 3.6，封顶 144 |');
L.push('| S4 中长途 | 44–65 | 2 | 144–188 | 秒数 × 3.55，封顶 188；每段约 72–94 |');
L.push('| S5 远征 | 65 以上 | 2 | 188–233 | 固定；每段 94–117 |');
L.push('| 首战 | evt_0001 | 1 | 75–95 | 开卷导语占去前半程 |', '');
L.push('写法：一段的，前约三分之一承上（前一场结局、几年间的变化、为何换到这位统帅或这片战区），后约三分之二写本场（公元纪年、交战双方、开战缘由）。两段的，第 1 段承上，第 2 段写本场。', '');
L.push('## 五、要改写的场次', '');
L.push(`共 **${need.length} 场**要重写战略播报（一场可能有几个原因）：`, '');
L.push(`- **章首**（${cnt('章首')} 场）：每章第一场。开头要交代新一章跟的是谁、在哪、什么年代。和上一章同时期的，用「与此同时，在××」；时间接续的，用「×年后」。上一章的结局放进这一句里一笔带过即可。`);
L.push(`- **调序后新相邻**（${cnt('调序后新相邻')} 场）：章内调序后，前一场换了，开头的承上要按新的前一场重写。`);
L.push(`- **章内并行**（${cnt('章内并行')} 场）：同一章两条战线，这一场比前一场年份早，开头要点明是另一条线并写出年份。`);
L.push(`- **字数不合新配额**（${cnt('字数不合新配额')} 场）：移动时间按现在的游戏数据重算后，现有文字的总字数或段数不在新区间里。大多数是 11-15 以后行军路线、出发点更新造成的，不是这次调序造成的。按新区间增删，内容保持连贯。`, '');
L.push('逐场清单（新序号、章、事件、原因、新的字数区间、现在的字数）：', '');
L.push('| 新序号 | 章 | 事件 | 年份 | 原因 | 档位 | 新区间 | 段数 | 现字数/段数 |', '|---:|---:|---|---|---|---|---|---:|---|');
for (const id of need) {
  const t = T[id];
  L.push(`| ${t.新序号} | ${t.章} | ${t.事件名称}（${id}） | ${yr(t.年份)} | ${reasons[id].join('、')} | ${t.档位.slice(0, 2)} | ${t.战略最少字}–${t.战略最多字} | ${t.段数} | ${t.现战略字数}/${t.现战略段数} |`);
}
L.push('', '## 六、战术播报', '');
L.push(`战术播报可以改内容，让它和前后的战略播报接得上（比如章首那场的战术播报不要重复战略播报刚说过的背景）。硬要求：**89–144 字**，一段。现在不在这个区间的有 ${tacBad.length} 场${tacBad.length ? '：' + tacBad.map((r) => `${r.事件名称}（${r.id}，${r.现战术字数}字）`).join('、') : ''}。`, '');
L.push('## 七、顺带修的数据问题', '');
L.push('- 棒号 `68` 用了两次：第 727–735 场（辽对高丽、北宋）和第 737 场「甘州回鹘之战」（1028，党项夏州对甘州回鹘）。第 737 场改为 `68C`，并核对它的本棒主角（现在写的是萧绰、耶律隆绪，但交战双方是党项和甘州回鹘）。');
L.push('- 原来的「段」作废，改用 `章`（1–63）和 `幕`（1–7）。', '');
L.push('## 八、交付格式', '');
L.push('交一个 JSON：`99_GG任务与交付/GG交付_主线63章战略播报改写_2026-11-16.json`，数组，**1022 条，按新播放顺序**：', '');
L.push('```json');
L.push('{ "新序号": 1, "id": "evt_0001", "章": 1, "幕": 1, "合并战略播报": ["第1段", "第2段（只有两段档才有）"], "战术播报": "89–144字" }');
L.push('```', '');
L.push('硬要求：');
L.push('- 事件ID顺序与 `主线63章切分表_2026-11-16.json` 的 `order` 完全一致；');
L.push('- 第五节没列到的场次，战略播报照抄现定稿原文；战术播报没改的也照抄；');
L.push('- 每场战略播报的段数、总字数、单段字数都落在字数设计表给的区间内（闭区间，按字符数算，含标点）；');
L.push('- 沿用原有写作红线：不用「朝 / 王朝」（朝鲜除外），不写兵力数字，不用括号、引号、阿拉伯数字，战略播报不剧透战斗经过；');
L.push('- 史实只用一手史料与正史，严禁拿本项目的游戏文案当出处。');
fs.writeFileSync(outMd, L.join('\n') + '\n', 'utf8');
console.log('需改写', need.length, '章首', cnt('章首'), '调序', cnt('调序后新相邻'), '并行', cnt('章内并行'), '字数不合', cnt('字数不合新配额'), '战术不合', tacBad.length);
const tiers = {}; table.forEach((r) => (tiers[r.档位.slice(0, 2)] = (tiers[r.档位.slice(0, 2)] || 0) + 1)); console.log(tiers);
