/**
 * 全图据点旗号审计：已有旗号 + panjun 升格候选
 * 以据点为主：逐 city 检查 mechanical + 已知规则
 */
import fs from 'fs';

const citiesText = fs.readFileSync('src/data/cities_v2.ts', 'utf8');
const capText = fs.readFileSync('src/data/StartingCapitals.ts', 'utf8');
const dispText = fs.readFileSync('src/data/SandboxDisplayNames.ts', 'utf8');
const facText = fs.readFileSync('src/data/factions.ts', 'utf8');

const cities = [
  ...citiesText.matchAll(/id:\s*'(city_[^']+)'[\s\S]*?name:\s*'([^']+)'[\s\S]*?factionId:\s*'([^']+)'/g),
].map((m) => ({ id: m[1], name: m[2], factionId: m[3] }));

const capByFaction = Object.fromEntries(
  [...capText.matchAll(/^\s*'([^']+)':\s*'(city_[^']+)'/gm)].map((m) => [m[1], m[2]]),
);
const factionByCapital = Object.fromEntries(
  Object.entries(capByFaction).map(([f, c]) => [c, f]),
);
const flags = Object.fromEntries(
  [...dispText.matchAll(/'([^']+)':\s*'([^']+)'/g)].map((m) => [m[1], m[2]]),
);

const ethnicIds = new Set(
  JSON.parse(fs.readFileSync('scratch/ethnic_homeland_audit.json', 'utf8')).entries.map((e) => e.factionId),
);
const regimeIds = new Set(
  JSON.parse(fs.readFileSync('scratch/regime_capital_audit.json', 'utf8')).entries.map((e) => e.id),
);

/** 已裁定 skip/ok 不再报 fix */
const APPROVED = new Set([
  'henei', 'huangfu', 'jingzhao', 'liao', 'long2', 'shangzhou', 'wan', 'yingchuan',
  'dashun', 'daxi_ming', 'zhen', 'pingyuan', 'danyang', 'xuan', 'li_s', 'han_d',
]);

/** 著名史地配搭：据点+旗号，非截字 */
const FAMOUS_PAIRS = {
  han_d: { cityPattern: /南郑/, flag: '汉', note: '汉中郡治南郑+汉朝' },
  tang: { cityPattern: /长安/, flag: '唐', note: '长安+唐' },
};

function isFlagCityDuplicate(flag, cityName) {
  if (!flag || !cityName) return null;
  if (flag === cityName) return 'flag_equals_city';

  const m = cityName.match(/^(.+)(关|城|邑|州)$/);
  if (!m) return null;

  const prefix = m[1];
  const suffix = m[2];
  if (flag === prefix) return `suffix_${suffix}_prefix_dup`;
  if (flag.length === 1 && prefix === flag) return `suffix_${suffix}_prefix_dup`;
  if (flag.length === 1 && prefix.startsWith(flag) && prefix.length > flag.length) {
    return `suffix_${suffix}_trunc_${flag}`;
  }
  return null;
}

function flagCharsOverlap(flag, cityName, factionId) {
  const famous = FAMOUS_PAIRS[factionId];
  if (famous && famous.flag === flag && famous.cityPattern.test(cityName)) return null;

  return isFlagCityDuplicate(flag, cityName);
}

const flagged = [];
const panjunList = [];

for (const city of cities) {
  if (city.factionId === 'panjun') {
    panjunList.push(city);
    continue;
  }

  const fid = city.factionId;
  const flag = flags[fid];
  const issues = [];
  const isCapital = factionByCapital[city.id] === fid;
  const capFid = factionByCapital[city.id];

  if (!flag) issues.push('missing_sandbox_flag');
  if (!isCapital) issues.push('not_starting_capital');
  if (capFid && capFid !== fid) issues.push(`capital_is_${capFid}`);
  if (capByFaction[fid] && capByFaction[fid] !== city.id) {
    issues.push(`faction_capital_is_${capByFaction[fid]}`);
  }

  const overlap = flag ? flagCharsOverlap(flag, city.name, fid) : null;
  if (overlap) issues.push(overlap);

  if (flag && (flag.endsWith('国') || flag.endsWith('族') || flag.endsWith('人'))) {
    issues.push('suffix_国族人');
  }

  let priority = '?';
  if (ethnicIds.has(fid)) priority = 1;
  else if (regimeIds.has(fid)) priority = 2;
  else if (['jiujiang', 'jibei', 'jiaodong', 'shuofang', 'zhuqian', 'henei'].includes(fid)) priority = 3;
  else priority = '4/5';

  let auditStatus = 'ok';
  if (issues.length && !APPROVED.has(fid)) auditStatus = 'fix';
  else if (issues.length) auditStatus = 'approved_exception';
  else if (priority === '?') auditStatus = 'review';

  flagged.push({
    cityId: city.id,
    cityName: city.name,
    factionId: fid,
    flag: flag || '?',
    priority,
    issues,
    auditStatus,
  });
}

// panjun 升格：关隘默认 keep；城邑尝试匹配已有 orphan faction 或建议
const orphanFactions = Object.keys(flags).filter((id) => !capByFaction[id] && id !== 'panjun');
const passKw = /关$|隘$|口$|峡$|渡$|塞$|谷$|山$|峰$|岭$|台$|堡$|哨$|城$且/.test.bind(/关|隘|口|峡|渡|塞|谷/);

const panjunAudit = panjunList.map((city) => {
  const isPass = /关$|隘$|口$|峡$|渡$|塞$|谷$/.test(city.name);
  const isMountain = /山$|峰$|岭$/.test(city.name);
  let recommendation = 'keep_panjun';
  let note = '';

  if (isPass) {
    note = '关隘：无依据维持 panjun；升格时旗号可取关名前缀，据点名须改(1900前)避重';
  } else if (isMountain) {
    note = '山岳/地标：维持 panjun';
  } else {
    note = '城邑：无明确1–5级依据则维持 panjun，禁止乱挂';
    recommendation = 'keep_panjun';
  }

  return {
    cityId: city.id,
    cityName: city.name,
    recommendation,
    note,
  };
});

const fixItems = flagged.filter((e) => e.auditStatus === 'fix');
const overlapItems = flagged.filter((e) => e.issues.some((i) => i.includes('flag_')));

const out = {
  updated: new Date().toISOString().slice(0, 10),
  rule: '以据点为主：防重改点不改旗；据点名须1900前可考；panjun宁缺毋滥',
  totalCities: cities.length,
  flagged: flagged.length,
  panjun: panjunList.length,
  fix: fixItems.length,
  overlap: overlapItems.length,
  orphanFactionCount: orphanFactions.length,
  fixItems,
  overlapItems,
  panjunAudit,
  flaggedSample: flagged.filter((e) => e.auditStatus !== 'ok').slice(0, 50),
};

fs.writeFileSync('scratch/city_flag_audit.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify({
  flagged: out.flagged,
  panjun: out.panjun,
  fix: out.fix,
  overlap: out.overlap,
  orphanFactionCount: out.orphanFactionCount,
}));
console.log('\nfix sample:', fixItems.slice(0, 25).map((e) => `${e.cityName}:${e.flag}:${e.issues.join(',')}`));
