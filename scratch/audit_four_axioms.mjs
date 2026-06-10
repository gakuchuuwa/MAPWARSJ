/**
 * 四公理审计：一势力 · 一据点 · 一军 · 一色
 * 运行: node scratch/audit_four_axioms.mjs
 */
import fs from 'fs';
import { CITIES_V2 } from '../src/data/cities_v2.ts';
import { FACTIONS } from '../src/data/factions.ts';
import { STARTING_CAPITALS } from '../src/data/StartingCapitals.ts';
import { SANDBOX_DISPLAY_NAMES } from '../src/data/SandboxDisplayNames.ts';
import { HISTORICAL_FACTION_COLORS } from '../src/data/HistoricalFactionColors.ts';

const factionIds = new Set(FACTIONS.map((f) => f.id));
const cities = CITIES_V2;

const byFaction = new Map();
for (const c of cities) {
  const list = byFaction.get(c.factionId) ?? [];
  list.push(c);
  byFaction.set(c.factionId, list);
}

const multiCity = [];
for (const [fid, list] of byFaction) {
  if (fid === 'panjun') continue;
  if (list.length > 1) {
    multiCity.push({
      factionId: fid,
      cities: list.map((c) => `${c.id}:${c.name}`),
    });
  }
}

const noCity = [];
const noFlag = [];
const noStarting = [];
const capMismatch = [];

for (const fid of factionIds) {
  if (fid === 'panjun') continue;
  const list = byFaction.get(fid) ?? [];
  if (list.length === 0) noCity.push(fid);
  if (!SANDBOX_DISPLAY_NAMES[fid]) noFlag.push(fid);
  if (!STARTING_CAPITALS[fid]) noStarting.push(fid);
  else if (list.length === 1 && STARTING_CAPITALS[fid] !== list[0].id) {
    capMismatch.push({
      factionId: fid,
      startingCapitals: STARTING_CAPITALS[fid],
      cityV2: list[0].id,
    });
  }
}

const extraStarting = [];
const orphanCap = [];
for (const [fid, capId] of Object.entries(STARTING_CAPITALS)) {
  if (!factionIds.has(fid)) extraStarting.push({ factionId: fid, capId });
  const list = byFaction.get(fid) ?? [];
  if (fid !== 'panjun' && list.length === 0) orphanCap.push({ factionId: fid, capId });
}

const flagToFids = new Map();
for (const [fid, flag] of Object.entries(SANDBOX_DISPLAY_NAMES)) {
  if (!factionIds.has(fid)) continue;
  const list = flagToFids.get(flag) ?? [];
  list.push(fid);
  flagToFids.set(flag, list);
}
const dupFlags = [...flagToFids.entries()]
  .filter(([, fids]) => fids.length > 1)
  .map(([flag, fids]) => ({ flag, factionIds: fids }));

// 旗号 = 据点名 严格相等
const flagEqualsCity = [];
for (const c of cities) {
  if (c.factionId === 'panjun') continue;
  const flag = SANDBOX_DISPLAY_NAMES[c.factionId];
  if (flag && flag === c.name) {
    flagEqualsCity.push({ factionId: c.factionId, flag, city: c.name, cityId: c.id });
  }
}

// 势力有城但 city 绑了别的 faction
const cityFactionNotInTable = [];
for (const c of cities) {
  if (c.factionId !== 'panjun' && !factionIds.has(c.factionId)) {
    cityFactionNotInTable.push({ cityId: c.id, name: c.name, factionId: c.factionId });
  }
}

// 城有势力但不在 STARTING_CAPITALS 且不是 panjun
const cityNoCapitalEntry = [];
for (const c of cities) {
  if (c.factionId === 'panjun') continue;
  if (!STARTING_CAPITALS[c.factionId]) {
    cityNoCapitalEntry.push({ factionId: c.factionId, cityId: c.id });
  }
}

// 50km 间距（非 panjun 之间、粗略 haversine）
function distKm(a, b) {
  const R = 6371;
  const toR = (d) => (d * Math.PI) / 180;
  const dLat = toR(b.lat - a.lat);
  const dLng = toR(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

const closePairs = [];
for (let i = 0; i < cities.length; i++) {
  for (let j = i + 1; j < cities.length; j++) {
    const d = distKm(cities[i], cities[j]);
    if (d < 50) {
      closePairs.push({
        km: Math.round(d * 10) / 10,
        a: `${cities[i].id}:${cities[i].name}`,
        b: `${cities[j].id}:${cities[j].name}`,
      });
    }
  }
}
closePairs.sort((a, b) => a.km - b.km);

// factions.ts hex check
const factionsRaw = fs.readFileSync('src/data/factions.ts', 'utf8');
const hasColorField = /\bcolor\s*:/.test(factionsRaw);

const report = {
  summary: {
    factions: factionIds.size,
    cities: cities.length,
    panjunCities: (byFaction.get('panjun') ?? []).length,
    startingCapitalsEntries: Object.keys(STARTING_CAPITALS).length,
    displayNameEntries: Object.keys(SANDBOX_DISPLAY_NAMES).length,
    historicalFixedColors: Object.keys(HISTORICAL_FACTION_COLORS).length,
    factionsTsHasColorField: hasColorField,
  },
  axiom1_oneCityPerFaction: {
    pass: multiCity.length === 0,
    violations: multiCity,
  },
  axiom1_factionHasCity: {
    pass: noCity.length === 0,
    count: noCity.length,
    sample: noCity.slice(0, 40),
  },
  startingCapitalsSync: {
    capMismatch: { pass: capMismatch.length === 0, count: capMismatch.length, items: capMismatch },
    noStarting: { pass: noStarting.length === 0, count: noStarting.length, sample: noStarting.slice(0, 20) },
    extraStarting: { pass: extraStarting.length === 0, count: extraStarting.length, items: extraStarting },
    orphanCap: { pass: orphanCap.length === 0, count: orphanCap.length, items: orphanCap },
  },
  flagUniqueness: {
    pass: dupFlags.length === 0,
    count: dupFlags.length,
    items: dupFlags,
  },
  flagEqualsCityName: {
    pass: flagEqualsCity.length === 0,
    count: flagEqualsCity.length,
    items: flagEqualsCity,
  },
  orphanBindings: {
    cityFactionNotInTable: { count: cityFactionNotInTable.length, items: cityFactionNotInTable },
    cityNoCapitalEntry: { count: cityNoCapitalEntry.length, items: cityNoCapitalEntry.slice(0, 20) },
  },
  spacingUnder50km: {
    count: closePairs.length,
    worst: closePairs.slice(0, 25),
  },
};

const outPath = 'scratch/four_axioms_audit_report.json';
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.summary, null, 2));
console.log('---');
console.log('multiCity', multiCity.length, '| noCity', noCity.length, '| capMismatch', capMismatch.length);
console.log('dupFlags', dupFlags.length, '| flag=city', flagEqualsCity.length, '| <50km pairs', closePairs.length);
console.log('Wrote', outPath);
