/**
 * 主线61章按史实重排交付的内容审计（格式之外）：核定纪年与季节、断句残留、战略/战术复读、倒叙词。
 * 跑法：node tools/chronicle/audit-gg-chapter-content.mjs 1 2 3
 */
import fs from 'node:fs';
const R = 'C:/MAPWARSJ/剧本模式/';
const orig = Object.fromEntries(JSON.parse(fs.readFileSync(R + '02_播报文案/战争编年史_主线1022场合并战略播报_定稿_2026-11-15.json', 'utf8')).events.map((e) => [e.id, e]));
const quota = Object.fromEntries(JSON.parse(fs.readFileSync(R + '02_播报文案/编年史主线1022场_战略播报字数设计表_按史实日期重排_2026-11-16.json', 'utf8')).map((r) => [r.id, r]));
const D = { 〇: 0, 零: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
function cnNum(s) {
  if (/十|百/.test(s)) { // 九十九、一百零八 这类
    let n = 0, cur = 0;
    for (const ch of s) {
      if (ch === '百') { n += (cur || 1) * 100; cur = 0; } else if (ch === '十') { n += (cur || 1) * 10; cur = 0; } else cur = D[ch] ?? 0;
    }
    return n + cur;
  }
  return Number([...s].map((c) => D[c]).join(''));
}
const SEASON = ['春', '夏', '秋', '冬'];
const out = [];
for (const act of process.argv.slice(2).map(Number)) {
  const file = fs.readdirSync(R + '99_GG任务与交付').find((f) => f.startsWith(`GG交付_主线61章按史实重排改写_第${act}幕`) && f.endsWith('.json'));
  const got = JSON.parse(fs.readFileSync(R + '99_GG任务与交付/' + file, 'utf8'));
  for (const g of got) {
    const o = orig[g.id];
    const q = quota[g.id];
    const expYear = q ? q.核定年份 : o.year;
    const expSeason = q ? q.核定季节 : o.season;
    const s = g.合并战略播报.join('');
    const t = g.战术播报;
    const changed = JSON.stringify(g.合并战略播报) !== JSON.stringify(o.合并战略播报);
    const tag = `${act}幕 #${g.新序号} ${g.id} ${o.title}（${expYear}${expSeason}）${changed ? '' : '[原文]'}`;
    // 纪年：取最后一处「公元(前)X年」（本场纪年一般在后半）
    const ms = [...s.matchAll(/公元(前)?([〇零一二三四五六七八九十百]+)年(春|夏|秋|冬)?/g)];
    if (!ms.length) out.push(`${tag} 战略播报没有公元纪年`);
    else {
      const m = ms.at(-1);
      const y = (m[1] ? -1 : 1) * cnNum(m[2]);
      if (y !== expYear) out.push(`${tag} 纪年写成 ${m[0]}，核定年份 ${expYear}`);
      else if (m[3] && m[3] !== expSeason) out.push(`${tag} 季节写成 ${m[3]}，核定季节 ${expSeason}`);
    }
    // 断句残留：逗号把一个词组拦腰切断
    for (const [name, txt] of [['战略', s], ['战术', t]]) {
      const bad = [...txt.matchAll(/(?<![议乞求讲言唱失许])(的|之|亦|及|被|把|向|自|从|于)，|，(率领下|率领的|机突入|统领的|及其|的)|[兵]，(统帅|与铁骑)/g)].map((m) => txt.slice(Math.max(0, m.index - 6), m.index + 6));
      if (bad.length) out.push(`${tag} ${name}断句可疑：${bad.join(' ｜ ')}`);
    }
    // 复读：战略末四字与战术开头四字
    if (s.slice(-5, -1) && t.startsWith(s.slice(-5, -1))) out.push(`${tag} 战略结尾与战术开头复读`);
    if (t.slice(0, 4) === s.slice(0, 4)) out.push(`${tag} 战略与战术开头四字相同`);
    if (!SEASON.includes(o.season)) out.push(`${tag} 原数据季节异常 ${o.season}`);
  }
}
console.log(out.length ? out.join('\n') : '无问题');
console.log(`共 ${out.length} 条`);
