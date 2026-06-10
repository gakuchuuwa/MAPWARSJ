/**
 * Step 3 audit: 优先级 3·郡名
 * 据点 = 古代著名郡之治所；旗号 = 郡名（不含「郡」字）
 */
import fs from 'fs';

const facText = fs.readFileSync('src/data/factions.ts', 'utf8');
const capText = fs.readFileSync('src/data/StartingCapitals.ts', 'utf8');
const dispText = fs.readFileSync('src/data/SandboxDisplayNames.ts', 'utf8');
const citiesText = fs.readFileSync('src/data/cities_v2.ts', 'utf8');

const ethnic = new Set(
  JSON.parse(fs.readFileSync('scratch/ethnic_homeland_audit.json', 'utf8')).entries.map((e) => e.factionId),
);
const regime = new Set(
  JSON.parse(fs.readFileSync('scratch/regime_capital_audit.json', 'utf8')).entries.map((e) => e.id),
);

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

/** 人工可考：郡名 → 治所据点、史实备注 */
const JUN_SEATS = {
  jibei: {
    jun: '济北郡',
    flag: '济北',
    expectedSeat: '博阳',
    expectedCityIds: ['city_boyang'],
    note: '西汉济北郡治博阳',
    auditStatus: 'ok',
  },
  pingyuan: {
    jun: '平原郡',
    flag: '高唐',
    expectedSeat: '平原',
    expectedCityIds: ['city_pingyuan'],
    note: '郡治平原；旗号取郡内高唐县(避与据点名平原重)',
    auditStatus: 'ok',
  },
  jiaodong: {
    jun: '胶东国',
    flag: '胶东',
    expectedSeat: '即墨',
    expectedCityIds: ['city_jimo'],
    note: '胶东国/郡治即墨',
    auditStatus: 'ok',
  },
  henei: {
    jun: '河内郡',
    flag: '河内',
    expectedSeat: '怀县',
    expectedCityIds: ['city_huai', 'city_huojia'],
    note: '郡治怀县；现绑获嘉(郡内非治所，主人接受)',
    auditStatus: 'ok',
  },
  yunzhong: {
    jun: '云中郡',
    flag: '云中',
    expectedSeat: '平城',
    expectedCityIds: ['city_datong', 'city_shengle'],
    note: '郡治平城(大同)；现绑盛乐(代北旧都)，与 chile 民族据点「云中」不同',
    auditStatus: 'review',
  },
  shuofang: {
    jun: '朔方郡',
    flag: '朔方',
    expectedSeat: '临戎',
    expectedCityIds: ['city_linrong'],
    note: '朔方郡治临戎',
    auditStatus: 'ok',
  },
  danyang: {
    jun: '宣州',
    flag: '宣',
    expectedSeat: '鸠兹',
    expectedCityIds: ['city_jiuzi'],
    note: '唐宣州辖芜湖/鸠兹；走州名(优先级5)',
    auditStatus: 'skip',
  },
  yingchuan: {
    jun: '漯河',
    flag: '漯',
    expectedSeat: '郾城',
    expectedCityIds: ['city_yancheng2'],
    note: '郾城属漯水流域/今漯河；旗号漯(优先级5)',
    auditStatus: 'skip',
  },
  long2: {
    jun: '陇州',
    flag: '陇',
    expectedSeat: '汧源',
    expectedCityIds: ['city_longzhou'],
    note: '陇州治汧源；待州级审计，主人裁定不动',
    auditStatus: 'skip',
  },
  huangfu: {
    jun: '安定郡',
    flag: '泾',
    expectedSeat: '安定',
    expectedCityIds: ['city_anding'],
    note: '据点安定=郡治；旗号泾(皇甫氏/泾州系)，主人裁定不动',
    auditStatus: 'skip',
  },
  zhuqian: {
    jun: '筑前国',
    flag: '筑前',
    expectedSeat: '太宰府',
    expectedCityIds: ['city_taizaifu'],
    note: '日本令制国；治所太宰府',
    auditStatus: 'ok',
  },
  jibei2: {
    jun: '备中国',
    flag: '备中',
    expectedSeat: '鬼之城(备中国)',
    expectedCityIds: ['city_guizhicheng'],
    note: '鬼之城在备中国；旗号备中',
    auditStatus: 'ok',
  },
  liao: {
    jun: '江阳郡',
    flag: '僚',
    expectedSeat: '江阳',
    expectedCityIds: ['city_jiangyang'],
    note: '郡治江阳；旗号僚(优先级1民族)，主人裁定',
    auditStatus: 'skip',
  },
  li_s: {
    jun: '合浦郡',
    flag: '合浦',
    expectedSeat: '合浦',
    expectedCityIds: ['city_hepu'],
    note: '郡治合浦；旗号「里」为里族(用户指定)，非郡名——应属优先级1?',
    auditStatus: 'skip',
  },
  anding_wei: {
    jun: null,
    flag: '安定',
    expectedSeat: '安定卫',
    expectedCityIds: ['city_anding_qh'],
    note: '明代安定卫(青海)，非汉代安定郡治；与 huangfu 撞概念',
    auditStatus: 'skip',
  },
  jingzhao: {
    jun: '京兆郡',
    flag: '京兆',
    expectedSeat: '长安',
    expectedCityIds: ['city_changan'],
    note: '郡治长安归唐；京兆势力暂不绑首都，主人裁定不动',
    auditStatus: 'skip',
  },
  jiujiang: {
    jun: '九江郡',
    flag: '九江',
    expectedSeat: '柴桑/浔阳',
    expectedCityIds: ['city_chaisang'],
    note: '汉九江郡治历变；柴桑为九江重镇',
    auditStatus: 'ok',
  },
};

/** 注释含「郡」但实为家族/民族，排除 */
const SKIP_IDS = new Set(['cao_d', 'yuan_cj_d', 'xie_cj_d', 'li_s', 'anding_wei']);

const entries = [];
for (const [id, spec] of Object.entries(JUN_SEATS)) {
  if (SKIP_IDS.has(id)) continue;
  const f = factions.find((x) => x.id === id);
  if (!f) continue;
  const flag = flags[id] || f.name;
  const cityId = capMap[id] || null;
  const city = cityId ? cityById[cityId] : null;
  const issues = [];

  if (ethnic.has(id)) issues.push('classified_ethnic_p1');
  if (regime.has(id)) issues.push('classified_regime_p2');
  if (!cityId) issues.push('no_starting_capital');
  if (spec.flag && flag !== spec.flag) issues.push(`flag_want_${spec.flag}_got_${flag}`);
  if (city && city.name === flag) issues.push('flag_equals_city_name');
  if (cityId && spec.expectedCityIds?.length && !spec.expectedCityIds.includes(cityId)) {
    issues.push(`seat_mismatch_want_${spec.expectedSeat}`);
  }
  if (city?.factionId && city.factionId !== id && city.factionId !== 'panjun') {
    issues.push(`city_bound_${city.factionId}`);
  }

  let auditStatus = spec.auditStatus || 'review';
  if (issues.some((i) => i.startsWith('flag_want_') || i.startsWith('seat_mismatch') || i === 'no_starting_capital')) {
    auditStatus = auditStatus === 'ok' ? 'fix' : auditStatus;
  }

  entries.push({
    id,
    flag,
    facName: f.name,
    cityId,
    cityName: city?.name || '(未绑定)',
    jun: spec.jun,
    expectedSeat: spec.expectedSeat,
    priority: 3,
    type: '郡名',
    auditStatus,
    issues,
    note: spec.note,
    comment: f.comment.slice(0, 80),
  });
}

// 注释含郡、未入表的候选
for (const f of factions) {
  if (JUN_SEATS[f.id] || SKIP_IDS.has(f.id) || ethnic.has(f.id) || regime.has(f.id)) continue;
  if (!/郡/.test(f.comment)) continue;
  const cityId = capMap[f.id];
  const city = cityId ? cityById[cityId] : null;
  entries.push({
    id: f.id,
    flag: flags[f.id] || f.name,
    facName: f.name,
    cityId: cityId || null,
    cityName: city?.name || '(未绑定)',
    jun: f.comment.match(/([\u4e00-\u9fff]+郡)/)?.[1] || '?',
    expectedSeat: '?',
    priority: '4?',
    type: '家族(注释含郡)',
    auditStatus: 'skip',
    issues: ['family_not_county'],
    note: '陈郡/谯郡等为家族前缀，非优先级3',
    comment: f.comment.slice(0, 80),
  });
}

entries.sort((a, b) => {
  const order = { fix: 0, review: 1, ok: 2, skip: 3 };
  return (order[a.auditStatus] ?? 9) - (order[b.auditStatus] ?? 9) || a.id.localeCompare(b.id);
});

const out = {
  updated: new Date().toISOString().slice(0, 10),
  step: 3,
  rule: '优先级3·郡名：据点=古代著名郡治所(可考)；旗号=郡名(禁与据点名相等、禁截字/姓顶替)',
  total: entries.filter((e) => e.type === '郡名').length,
  ok: entries.filter((e) => e.type === '郡名' && e.auditStatus === 'ok').length,
  fix: entries.filter((e) => e.type === '郡名' && e.auditStatus === 'fix').length,
  review: entries.filter((e) => e.type === '郡名' && e.auditStatus === 'review').length,
  entries,
};

fs.writeFileSync('scratch/county_seat_audit.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify({ total: out.total, ok: out.ok, fix: out.fix, review: out.review }));
console.log('fix:', entries.filter((e) => e.auditStatus === 'fix').map((e) => e.id));
