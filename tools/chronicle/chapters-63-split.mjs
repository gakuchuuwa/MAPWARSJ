/**
 * 主线1022场 → 7幕63章 切分定义（2026-11-16）。改章节只改下面的 CH 表，然后：
 *   node tools/chronicle/chapters-63-split.mjs scratch/chronicle63/chapters.json
 *   CHRONICLE_ORDER_FILE=剧本模式/99_GG任务与交付/主线63章切分表_2026-11-16.json CHRONICLE_MARCH_OUT=scratch/chronicle63/march_new.json npx tsx --import ./tools/sim-preload.mjs tools/chronicle/calc-march-times.mts
 *   node tools/chronicle/chapters-63-gen-tables.mjs   （生成切分表、字数设计表、GG任务单）
 */
﻿import fs from 'node:fs';
const d = JSON.parse(fs.readFileSync('C:/MAPWARSJ/剧本模式/01_事件与故事/战争编年史_主线全卷连读本_2026-11-14.json', 'utf8'));
const ev = d.events.slice().sort((a, b) => a.主线序号 - b.主线序号);
const batons = [];
let cur = null;
for (const e of ev) {
  if (!cur || cur.id !== e.棒号 || cur.items.at(-1).主线序号 !== e.主线序号 - 1) { cur = { id: e.棒号, seg: e.段, items: [] }; batons.push(cur); }
  cur.items.push(e);
}
// 章定义：[幕, 标题, 主轴, 棒的出现序号(1起)]
const CH = [
  [1, '居鲁士与大流士：波斯开国', '波斯', [1, 2, 3]],
  [1, '希波战争与提洛同盟', '希腊诸邦对波斯', [4, 5, 6]],
  [1, '伯罗奔尼撒战争', '雅典对斯巴达', [7, 8, 9, 10]],
  [1, '斯巴达霸权与底比斯崛起', '斯巴达、底比斯', [11, 12]],
  [1, '腓力与亚历山大', '马其顿', [13, 14, 15, 16, 17, 18]],
  [1, '继业者战争', '马其顿诸将', [19, 20, 21, 22]],
  [1, '胡服骑射与长平', '赵、秦', [23, 24]],
  [1, '秦灭六国', '秦', [25, 26, 27]],
  [2, '楚汉相争与汉初平叛', '刘邦、项羽', [28, 29]],
  [2, '罗马东进与迦太基之亡', '罗马（兼帕提亚兴起）', [30, 31, 32, 33]],
  [2, '汉武帝北击匈奴', '汉对匈奴', [34, 35, 36, 37]],
  [2, '卡莱、恺撒与郅支城', '罗马内战（兼陈汤）', [38, 39, 40, 41]],
  [2, '屋大维与日耳曼尼亚', '罗马帝国', [42, 43]],
  [2, '新莽崩溃与光武中兴', '刘秀', [44, 45, 46]],
  [3, '两大帝国的远疆：班超与图拉真', '东汉西域、罗马东方', [47, 48, 49, 50, 51]],
  [3, '西域、羌乱与黄巾', '东汉', [52, 53, 54]],
  [3, '群雄逐鹿到三分天下', '曹操、刘备、孙氏', [55, 56, 57]],
  [3, '三国鼎立', '魏蜀吴', [58, 59]],
  [3, '萨珊兴起与罗马三世纪危机', '罗马、萨珊', [60, 61, 62, 63]],
  [3, '西晋平凉州、灭孙吴', '西晋', [64]],
  [3, '永嘉之乱与胡族诸国', '汉赵、后赵、前燕', [65, 66, 67]],
  [4, '尤利安东征与阿德里安堡', '罗马、萨珊、哥特', [68, 69]],
  [4, '淝水之战与北魏开国', '前秦、东晋、北魏', [70, 71]],
  [4, '刘裕北伐与太武帝统一北方', '东晋刘宋、北魏', [72, 73]],
  [4, '阿提拉', '匈人对罗马', [74]],
  [4, '南北朝对峙', '北魏东西魏、南梁', [75, 76, 77]],
  [4, '突厥兴起与隋统一', '北周、北齐、南陈、隋', [78, 79]],
  [4, '隋唐之际', '隋、李唐', [80, 81, 82]],
  [4, '唐平西域、灭百济高句丽', '李唐', [83, 84, 85]],
  [4, '武周到开元的吐蕃、契丹战线', '李唐对吐蕃', [86, 88]],
  [4, '大食东进与怛罗斯', '倭马亚、突骑施、唐安西', [87, 89]],
  [4, '安史之乱及其后', '李唐对大燕、吐蕃', [90, 91]],
  [5, '查理曼与克鲁姆', '法兰克、保加利亚', [92, 93, 94]],
  [5, '元和削藩与归义军', '唐中后期', [95, 96]],
  [5, '拜占庭东疆、维京与莱希菲尔德', '拜占庭、威塞克斯、东法兰克', [97, 98, 102]],
  [5, '唐亡与梁晋争霸', '沙陀、朱梁', [99, 100, 101]],
  [5, '契丹南下与后周宋兴', '后晋、契丹、后周', [103, 104]],
  [5, '宋统一与宋辽之战', '北宋、辽', [105, 106, 107]],
  [5, '西夏崛起与侬智高', '西夏、北宋', [108, 109, 110, 111]],
  [5, '塞尔柱西进与曼齐刻尔特', '塞尔柱对拜占庭', [112, 115]],
  [5, '诺曼人：西西里与黑斯廷斯', '诺曼', [113, 114]],
  [5, '熙河开边与宋夏之战', '北宋对西夏、青唐', [116, 117]],
  [5, '女真崛起、金灭辽宋与岳飞北伐', '金、南宋', [118, 119, 120, 121]],
  [5, '红胡子、萨拉丁与狮心王', '神圣罗马、阿尤布、十字军', [123, 124, 122, 125, 126]],
  [6, '成吉思汗崛起与灭金', '蒙古', [127, 128, 129, 130, 131]],
  [6, '马里、玛雅与马穆鲁克', '世界别处', [132, 133, 134]],
  [6, '忽必烈灭宋与元', '元', [135, 136, 137]],
  [6, '百年战争（上）', '英格兰对法兰西', [138]],
  [6, '元末群雄与大明开国', '朱元璋', [139, 140]],
  [6, '库利科沃、靖难与永乐北征', '莫斯科、大明', [141, 142, 143]],
  [6, '坦能堡、阿金库尔、胡斯战争与勃艮第之亡', '中欧、英法、勃艮第', [144, 145, 150]],
  [6, '土木堡到达延汗：明蒙之争', '大明对瓦剌、鞑靼', [147, 151]],
  [6, '奥斯曼征服巴尔干', '奥斯曼', [148]],
  [6, '白羊、萨法维、奥斯曼与意大利战争', '白羊萨法维、奥斯曼、法兰西', [149, 152, 154, 153, 155]],
  [6, '印加兴起与征服美洲', '印加、西班牙、葡萄牙', [146, 156, 157, 158, 161, 162]],
  [6, '苏莱曼与巴布尔', '奥斯曼、莫卧儿', [159, 160]],
  [7, '倭寇与日本战国', '大明东南、织田丰臣', [163, 164]],
  [7, '壬辰战争与关原', '丰臣、朝鲜、大明、德川', [165, 166]],
  [7, '明清鼎革', '后金大清、大明、大顺', [167, 168]],
  [7, '哥萨克起义到维也纳', '波兰、奥斯曼、哈布斯堡', [169, 170, 171]],
  [7, '康雍乾三朝平准', '大清对准噶尔', [172, 173, 174, 175, 176]],
  [7, '帕尼帕特、缅暹与帝国边疆', '南亚东南亚与清边疆', [177, 178, 179, 180, 181, 182]],
  [7, '锡克帝国与太平天国终章', '锡克、太平天国、湘军', [183, 184]],
];
const used = CH.flatMap((c) => c[3]);
const miss = batons.map((_, i) => i + 1).filter((i) => !used.includes(i));
const dup = used.filter((x, i) => used.indexOf(x) !== i);
if (miss.length || dup.length || batons.length !== 184) throw new Error(`miss ${miss} dup ${dup} n ${batons.length}`);
const rows = [];
let order = [];
let prevYearAcrossCh = null;
const reorderNotes = [];
CH.forEach(([act, title, axis, ids], ci) => {
  const items = ids.flatMap((i) => batons[i - 1].items);
  const back = [];
  for (let k = 1; k < items.length; k++) {
    const dy = items[k].年份year - items[k - 1].年份year;
    if (dy < 0) back.push(`${items[k - 1].事件名称}(${items[k - 1].年份year})→${items[k].事件名称}(${items[k].年份year}) ${dy}年`);
  }
  const sorted = ids.every((x, k) => k === 0 || x > ids[k - 1]);
  if (!sorted) reorderNotes.push(ci + 1);
  const y0 = Math.min(...items.map((e) => e.年份year)), y1 = Math.max(...items.map((e) => e.年份year));
  const leads = [...new Set(ids.flatMap((i) => batons[i - 1].items[0].本棒主角.split(' / ')))].filter((x) => !x.startsWith('待补')).slice(0, 4);
  rows.push({ ch: ci + 1, act, title, axis, n: items.length, y0, y1, first: items[0], last: items.at(-1), batons: ids.map((i) => batons[i - 1].id), oldSegs: [...new Set(items.map((e) => e.段))], back, reordered: !sorted, ids: items.map((e) => e.事件ID) });
  order.push(...items);
});
const yr = (y) => (y < 0 ? `前${-y}` : `${y}`);
const crossBack = [];
for (let k = 1; k < order.length; k++) if (order[k].年份year < order[k - 1].年份year) crossBack.push(k);
console.log('章数', CH.length, '总场', order.length, '全序倒退处', crossBack.length);
for (const r of rows) console.log(`${r.ch}|幕${r.act}|${r.title}|${r.n}场|${yr(r.y0)}~${yr(r.y1)}|旧段${r.oldSegs.join('、')}|棒${r.batons.join(',')}${r.reordered ? '|调序' : ''}|章内倒退${r.back.length}`);
for (const r of rows) for (const b of r.back) console.log(`  章${r.ch} ${b}`);
fs.writeFileSync(process.argv[2], JSON.stringify({ rows, order: order.map((e) => e.事件ID) }, null, 1), 'utf8');

