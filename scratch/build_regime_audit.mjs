import fs from 'fs';

const facText = fs.readFileSync('src/data/factions.ts', 'utf8');
const capText = fs.readFileSync('src/data/StartingCapitals.ts', 'utf8');
const dispText = fs.readFileSync('src/data/SandboxDisplayNames.ts', 'utf8');
const citiesText = fs.readFileSync('src/data/cities_v2.ts', 'utf8');

const ethnic = new Set(
  JSON.parse(fs.readFileSync('scratch/ethnic_homeland_audit.json', 'utf8')).entries.map((e) => e.factionId),
);

// Capture trailing // comment after closing brace
const factions = [
  ...facText.matchAll(/\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)'\s*,?\s*\}[^\n]*(?:\/\/(.*))?/g),
].map((m) => ({ id: m[1], name: m[2], comment: (m[3] || '').trim() }));

const capMap = Object.fromEntries(
  [...capText.matchAll(/^\s*'([^']+)':\s*'(city_[^']+)'/gm)].map((m) => [m[1], m[2]]),
);
const flags = Object.fromEntries(
  [...dispText.matchAll(/'([^']+)':\s*'([^']+)'/g)].map((m) => [m[1], m[2]]),
);

const cities = [
  ...citiesText.matchAll(/\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*factionId:\s*'([^']+)'/g),
].map((m) => ({ id: m[1], name: m[2], factionId: m[3] }));
const cityById = Object.fromEntries(cities.map((c) => [c.id, c]));

const regimeKw =
  /政权|王朝|汗国|帝国|国都|幕府|割据|李朝|可汗|北元|大元|南明|顺天|吴周|天完|大顺|大西|大辽|大金|大清|大韩|大汉|大越|大夏|西秦|西辽|西夏|成汉|前秦|后秦|前燕|后燕|前凉|后凉|北凉|南凉|西凉|前赵|后赵|冉魏|南汉|北汉|后梁|后唐|后晋|后汉|后周|南唐|南梁|南陈|南齐|东吴|东魏|西魏|北周|前蜀|后蜀|闽国|吴越|南平|南诏|渤海|百济|新罗|高句|高丽|朝鲜|暹罗|真腊|蒲甘|东吁|叶尔羌|准噶尔|哈萨克|霍罕|察合台|窝阔|伊儿|花剌|萨曼|塞尔柱|喀喇|景东|藏巴|甘丹|象雄|大理|大周|大齐|大楚|大燕|后百济/;

const dynastyIds = new Set([
  'tang', 'song', 'ming', 'qing', 'han', 'wei', 'jin', 'zhou', 'qin', 'shu', 'wu', 'yue', 'qi', 'yan', 'zhao',
  'liao', 'dajin', 'manzhou_d', 'dali', 'nanzhao', 'bohai', 'goryeo', 'joseon', 'siam', 'chenla', 'pagan',
  'yarkand', 'dzungar', 'ilkhanate', 'ogodei', 'chagatai', 'seljuq', 'saman', 'xixia', 'dangxiang', 'baiji',
  'xia', 'sui', 'chen', 'liang', 'dashun', 'daxi_ming', 'liguo', 'xiqin', 'hongguang', 'longwu', 'yongli',
  'wusangui', 'taiping', 'da_yuan', 'yuan_d', 'ming_d', 'liao_d', 'zhangshicheng', 'xushouhui', 'zhen',
]);

const regimeIds = new Set();
for (const f of factions) {
  if (ethnic.has(f.id)) continue;
  if (regimeKw.test(f.comment) || regimeKw.test(f.name)) {
    regimeIds.add(f.id);
    continue;
  }
  const flag = flags[f.id] || '';
  if (/^大/.test(flag) || dynastyIds.has(f.id)) regimeIds.add(f.id);
}

const expectedFlags = {
  liguo: '黎',
  dali: '大理',
  manzhou_d: '大清',
  dangxiang: '大夏',
  dajin: '大金',
  liao_d: '大辽',
  dashun: '大顺',
  daxi_ming: '大西',
  xiqin: '西秦',
  zhangshicheng: '大周',
  xushouhui: '天完',
  wusangui: '吴周',
  bohai: '渤海',
  baiji: '百济',
  dahan: '大韩',
  han_nian: '大汉',
  dayue: '大越',
  dacheng: '大成',
  taiping: '太平',
};

const expectedCapitals = {
  dashun: 'city_weinan',
  daxi_ming: 'city_mianyang',
  tang: 'city_changan',
  shu: 'city_chengdu',
};

const notes = {
  dashun: '定都西安；长安归唐，绑渭南(第二据点)',
  daxi_ming: '定都成都；成都归蜀，绑涪城(第二据点)',
  tang: '唐留长安',
  shu: '蜀留成都',
  liguo: '春秋黎国，旗号黎(非黎国)',
  nanzhao: '南诏起源蒙舍城；后期羊苴咩归大理',
  baiji: '百济后期都泗沘(慰礼城已被占)',
  zhangshicheng: '张士诚大周；延陵(高邮未收录)',
  zhen: '后百济：正式国号百济(与baiji撞旗，当前甄/后百均错，待主人裁定)',
  qing: '庆州势力，旗号庆(非大清；大清=manzhou_d)',
};

const okIds = new Set([
  'liguo', 'dali', 'manzhou_d', 'dajin', 'liao_d', 'bohai', 'dangxiang',
  'dashun', 'daxi_ming', 'xiqin', 'tang', 'shu', 'zhangshicheng', 'xushouhui',
  'wusangui', 'bohai', 'baiji', 'goryeo', 'joseon', 'siam', 'chenla',
  'nanzhao', 'hongguang', 'longwu', 'yongli', 'da_yuan', 'yuan_d', 'ming_d',
]);

const entries = [];
for (const id of [...regimeIds].sort()) {
  const f = factions.find((x) => x.id === id);
  if (!f || !capMap[id]) continue;
  const cityId = capMap[id];
  const city = cityById[cityId];
  const flag = flags[id] || f.name;
  const flagIssues = [];

  if (flag.endsWith('国') || flag.endsWith('族') || flag.endsWith('人')) {
    flagIssues.push('flag_suffix_国族人');
  }
  if (id === 'zhen' && flag !== '百济') {
    flagIssues.push('wrong_flag_want_百济(正式国号,与baiji撞旗待裁定)');
  }
  if (expectedFlags[id] && flag !== expectedFlags[id]) flagIssues.push(`wrong_flag_want_${expectedFlags[id]}`);
  if (expectedCapitals[id] && cityId !== expectedCapitals[id]) flagIssues.push('wrong_capital');

  const bound = city?.factionId;
  if (bound && bound !== id && bound !== 'panjun') flagIssues.push(`city_bound_${bound}`);

  // 大名号却用单字旗号（非先秦正朔、非黎国）
  if (
    f.name.length >= 2 &&
    f.name.startsWith('大') &&
    flag.length === 1 &&
    !expectedFlags[id]
  ) {
    flagIssues.push('single_char_for_大_regime');
  }

  let auditStatus = 'review';
  if (flagIssues.length) auditStatus = 'fix';
  else if (okIds.has(id)) auditStatus = 'ok';

  entries.push({
    id,
    flag,
    facName: f.name,
    cityId,
    cityName: city?.name || '?',
    comment: f.comment.slice(0, 100),
    flagIssues,
    priority: 2,
    type: '政权',
    auditStatus,
    note: notes[id] || '',
  });
}

const out = {
  updated: new Date().toISOString().slice(0, 10),
  step: 2,
  rule: '优先级2·政权：首都=原生政权首都(可考)；旗号=史籍正式国号(禁自造截字/国族人后缀/地名姓顶替)',
  total: entries.length,
  ok: entries.filter((e) => e.auditStatus === 'ok').length,
  fix: entries.filter((e) => e.auditStatus === 'fix').length,
  review: entries.filter((e) => e.auditStatus === 'review').length,
  entries,
};

fs.writeFileSync('scratch/regime_capital_audit.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify({ total: out.total, ok: out.ok, fix: out.fix, review: out.review }));
if (out.fix) {
  console.log('fixes:', entries.filter((e) => e.auditStatus === 'fix').map((e) => `${e.id}:${e.flagIssues.join(',')}`));
}
