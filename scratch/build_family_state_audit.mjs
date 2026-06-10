/**
 * Step 4+5 audit: 优先级 4·家族 / 5·州名
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
const county = new Set(
  JSON.parse(fs.readFileSync('scratch/county_seat_audit.json', 'utf8')).entries
    .filter((e) => e.type === '郡名' && e.auditStatus === 'ok')
    .map((e) => e.id),
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

/** 人工：家族 id → 期望单姓、发迹据点备注 */
const FAMILY = {
  yuan_cj_d: { surname: '袁', seat: '汝南/陈郡袁氏', note: '悬瓠/汝南袁氏发迹' },
  xie_cj_d: { surname: '谢', seat: '陈郡阳夏', note: '谢氏郡望陈郡' },
  cao_d: { surname: '曹', seat: '谯县', note: '谯郡曹氏' },
  wang_d: { surname: '王', seat: '琅琊', note: '琅琊王氏' },
  xiao_d: { surname: '萧', seat: '兰陵', note: '兰陵萧氏' },
  cui_qh_d: { surname: '崔', seat: '清河', note: '清河崔氏' },
  lu_fy_d: { surname: '卢', seat: '范阳', note: '范阳卢氏' },
  li_lx_d: { surname: '李', seat: '陇西', note: '陇西李氏；旗号应为李非陇李' },
  pei_hd_d: { surname: '裴', seat: '河东', note: '河东裴氏' },
  huang_d: { surname: '黄', seat: '春申', note: '春申黄氏' },
  yue_d: { surname: '岳', seat: '汤阴/岳飞故里', note: '岳氏' },
  qian_d: { surname: '钱', seat: '杭州', note: '钱氏吴越' },
  kong_d: { surname: '孔', seat: '曲阜', note: '孔氏' },
  yu2_d: { surname: '喻', seat: '江夏', note: '江夏喻氏' },
  zhang2_d: { surname: '章', seat: '河间', note: '河间章氏' },
  peng_d: { surname: '彭', seat: '彭城', note: '彭城彭氏' },
  feng_d: { surname: '冯', seat: '上党', note: '上党冯氏' },
  yan_d: { surname: '颜', seat: '平原/琅琊', note: '平原颜氏' },
  zhi_d: { surname: '智', seat: '绛/正平', note: '智氏(绛都)；旗号智，据点正平' },
  dongxian: { surname: '董', seat: '东海', note: '董宪/东海' },
  liubiao: { surname: '刘', seat: '襄阳', note: '刘表集团' },
  lvbu: { surname: '吕', seat: '下邳', note: '吕布' },
  xian_d: { surname: '冼', seat: '高凉', note: '冼夫人' },
  zhang_clan: { surname: '张', seat: '保定', note: '张柔汉军世家' },
  liu_clan2: { surname: '霍', seat: '平阳', note: '霍氏' },
  qiao_d: { surname: '谯', seat: '阆中', note: '谯氏' },
  zhe_d: { surname: '折', seat: '府州', note: '折氏' },
  tian_sizhou: { surname: '田', seat: '镇远', note: '思州田氏' },
  ouyang: { surname: '欧阳', seat: '?' , note: '复姓2字' },
};

/** 人工：州名 id → 州名、治所 */
const ZHOU = {
  qing: { zhou: '庆州', flag: '庆', seat: '安化/庆州' },
  ting: { zhou: '汀州', flag: '汀', seat: '汀州' },
  dizhou: { zhou: '棣州', flag: '棣', seat: '乐安/棣州' },
  long2: { zhou: '陇州', flag: '陇', seat: '汧源' },
  guo: { zhou: '果州', flag: '果', seat: '?' },
  zi: { zhou: '资州', flag: '资', seat: '?' },
  jing2: { zhou: '景州', flag: '景', seat: '?' },
  song2: { zhou: '松州', flag: '松', seat: '?' },
  danyang: { zhou: '宣州', flag: '宣', seat: '鸠兹' },
  xuan: { zhou: '宣府', flag: '宣府', seat: '宣化' },
  yingchuan: { zhou: '漯河', flag: '漯', seat: '郾城' },
  shangzhou: { zhou: '商州', flag: '上洛', seat: '商邑', note: '商州治商邑；旗号用上洛旧称避与商邑重' },
  wan: { zhou: '舒州', flag: '舒', seat: '皖城', note: '舒州治皖城；旗号舒避与皖城重' },
  huizhou: { zhou: '会州', flag: '会', seat: '?' },
  jingzhou_hebei: { zhou: '泾州', flag: '泾', seat: '?' },
};

const flagToIds = {};
for (const f of factions) {
  const fl = flags[f.id] || f.name;
  if (!flagToIds[fl]) flagToIds[fl] = [];
  flagToIds[fl].push(f.id);
}

const entries = [];

for (const f of factions) {
  if (!capMap[f.id]) continue;
  if (ethnic.has(f.id) || regime.has(f.id) || county.has(f.id)) continue;

  const flag = flags[f.id] || f.name;
  const cityId = capMap[f.id];
  const city = cityById[cityId];
  const issues = [];

  let priority = '?';
  let type = '待分类';

  if (FAMILY[f.id]) {
    priority = 4;
    type = '家族';
    const spec = FAMILY[f.id];
    if (flag !== spec.surname && !flag.includes(spec.surname)) {
      issues.push(`flag_want_${spec.surname}`);
    }
    if (flag.length > 2) issues.push('surname_too_long');
    if (/郡|氏|族|人|国/.test(flag)) issues.push('suffix_or_prefix');
    if (flag === city?.name) issues.push('flag_equals_city');
    if (li_lx_d_fix(flag, f.id)) issues.push('li_lx_d_should_be_李');
  } else if (ZHOU[f.id]) {
    priority = 5;
    type = '州名';
    const spec = ZHOU[f.id];
    if (spec.flag && flag !== spec.flag) issues.push(`flag_want_${spec.flag}`);
    if (flag === city?.name) issues.push('flag_equals_city');
    if (flag.length === 1 && spec.zhou && !spec.zhou.startsWith(flag)) {
      // ok for 庆州→庆
    }
  } else if (f.id.endsWith('_d') || /氏|门阀|世家/.test(f.comment)) {
    priority = 4;
    type = '家族(待核)';
    if (flag.length > 2) issues.push('surname_too_long');
    if (/郡|氏|族|人/.test(flag)) issues.push('suffix_or_prefix');
  } else if (/州/.test(f.comment) || /州$/.test(f.name)) {
    priority = 5;
    type = '州名(待核)';
  }

  if (flagToIds[flag]?.length > 1) issues.push(`duplicate_flag_${flagToIds[flag].join('+')}`);

  if (priority === '?' && type === '待分类') continue;

  let auditStatus = issues.length ? 'fix' : 'review';
  if (FAMILY[f.id] && flag === FAMILY[f.id].surname && !issues.length) auditStatus = 'ok';
  if (ZHOU[f.id] && flag === ZHOU[f.id].flag && !issues.filter((i) => !i.startsWith('duplicate')).length) {
    auditStatus = issues.length ? 'fix' : 'ok';
  }

  entries.push({
    id: f.id,
    flag,
    facName: f.name,
    cityId,
    cityName: city?.name || '?',
    priority,
    type,
    auditStatus,
    issues,
    note: FAMILY[f.id]?.note || ZHOU[f.id]?.zhou || f.comment.slice(0, 60),
  });
}

function li_lx_d_fix(flag, id) {
  return id === 'li_lx_d' && flag !== '李';
}

entries.sort((a, b) => {
  const o = { fix: 0, review: 1, ok: 2 };
  return (o[a.auditStatus] ?? 9) - (o[b.auditStatus] ?? 9) || a.priority - b.priority || a.id.localeCompare(b.id);
});

const out = {
  updated: new Date().toISOString().slice(0, 10),
  step: '4+5',
  rule: '优先级4·家族：发迹大本营+单姓；优先级5·州名：著名州名提取+全局防重',
  total: entries.length,
  ok: entries.filter((e) => e.auditStatus === 'ok').length,
  fix: entries.filter((e) => e.auditStatus === 'fix').length,
  review: entries.filter((e) => e.auditStatus === 'review').length,
  duplicateFlags: Object.entries(flagToIds).filter(([, ids]) => ids.length > 1).map(([fl, ids]) => ({ flag: fl, ids })),
  entries,
};

fs.writeFileSync('scratch/family_state_audit.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify({ total: out.total, ok: out.ok, fix: out.fix, review: out.review, dups: out.duplicateFlags.length }));
console.log('fix:', entries.filter((e) => e.auditStatus === 'fix').map((e) => `${e.id}:${e.issues.join(',')}`));
