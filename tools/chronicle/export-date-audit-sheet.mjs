/**
 * 主线 1022 场史实日期核定底表（2026-11-16 主人令：必须严格按历史叙事顺序，从头彻查）。
 * 跑法：node tools/chronicle/export-date-audit-sheet.mjs
 * 输出：剧本模式/99_GG任务与交付/待核主线1022场史实日期底表_2026-11-16.json（按现年份排序，分 6 批）
 */
import fs from 'node:fs';
const R = 'C:/MAPWARSJ/剧本模式/';
const lib = JSON.parse(fs.readFileSync(R + '01_事件与故事/战争事件编年史_全二十四卷_前550至1870年_2526场纯史实引擎全库.json', 'utf8'));
const split = JSON.parse(fs.readFileSync(R + '99_GG任务与交付/主线63章切分表_2026-11-16.json', 'utf8'));
const byId = new Map(lib.events.map((e) => [e['事件ID'], e]));
const SEASON = { 春: 0, 夏: 1, 秋: 2, 冬: 3 };
const rows = split.order.map((id, k) => ({ id, k, e: byId.get(id) }))
  .sort((a, b) => a.e['年份year'] - b.e['年份year'] || SEASON[a.e['季节']] - SEASON[b.e['季节']] || a.k - b.k);
const N = 6, size = Math.ceil(rows.length / N);
const sheet = rows.map(({ id, e }, i) => ({
  批次: Math.floor(i / size) + 1,
  id,
  事件名称: e['事件名称'],
  库内年份: e['年份year'],
  库内季节: e['季节'],
  纪年对照: e['纪年对照'],
  战斗类型: e['战斗类型'],
  战场地点: e['战场地点'],
  攻方: `${e['攻击方势力']}·${e['攻击方武将']}`,
  守方: `${e['防守方势力']}·${e['防守方武将']}`,
  一手史料出处: e['一手史料出处'],
  // ↓ 以下由 GG 填写
  公历决战日: '',
  日期精度: '',
  核定季节: '',
  核定年份: null,
  同日先后: null,
  依据: '',
  备注: '',
}));
const out = R + '99_GG任务与交付/待核主线1022场史实日期底表_2026-11-16.json';
fs.writeFileSync(out, JSON.stringify(sheet, null, 1) + '\n', 'utf8');
const ranges = [...Array(N)].map((_, b) => { const s = sheet.filter((x) => x.批次 === b + 1); return `第${b + 1}批 ${s.length}场 ${s[0].库内年份}～${s.at(-1).库内年份}`; });
console.log(ranges.join('\n'));
