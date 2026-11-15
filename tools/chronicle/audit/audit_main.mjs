// 主线1022场审核：一致性 + 连续性规则检查
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'C:\\MAPWARSJ';
const OUT = path.join(ROOT, 'tools\\chronicle\\audit');
const gen = JSON.parse(fs.readFileSync(path.join(OUT, 'mainline_parsed.json'), 'utf8'));
const cities = JSON.parse(fs.readFileSync(path.join(OUT, 'cities_parsed.json'), 'utf8'));
const { CHRONICLE_SCRIPT } = await import('file:///C:/MAPWARSJ/src/data/chronicle/ChronicleDirectorScript.ts');

const DELIV = path.join(ROOT, '剧本模式\\99_GG任务与交付');
const troopFiles = [1, 2, 3].map(i => path.join(DELIV, `GG交付_主线史实兵力_第${i}批_2026-11-15.json`));
const contFiles = [1, 2, 3].map(i => path.join(DELIV, `GG交付_主线连续性核校_第${i}批_2026-11-15.json`));
const troops = troopFiles.flatMap(f => JSON.parse(fs.readFileSync(f, 'utf8')));
const conts = contFiles.flatMap(f => JSON.parse(fs.readFileSync(f, 'utf8')));

const R = 6371;
const hav = (a, b) => {
  const dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
  const la1 = a.lat * Math.PI / 180, la2 = b.lat * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const near = (n1, n2) => {
  const a = String(n1 || '').replace(/[（(].*?[)）]/g, '').trim();
  const b = String(n2 || '').replace(/[（(].*?[)）]/g, '').trim();
  return a === b || (a.length >= 2 && b.length >= 2 && (a.includes(b) || b.includes(a)));
};

const report = { stats: {}, issues: [] };
const issue = (cat, e, msg, extra = {}) => report.issues.push({
  cat, seq: e.__seq, eventId: e.id, title: e.title, year: e.year,
  lead: e.leadGeneralId, from: e.battle.chronicleFrom, route: (e.battle.routeVia || []).map(p => p.name).join(' → '),
  target: e.battle.targetName, troops: e.battle.myTroops, msg, ...extra,
});

const byId = new Map(gen.map(e => [e.id, e]));
const genOrder = gen.map(e => e.id);

// ---------- 1. 落盘一致性 ----------
const troopMap = new Map(troops.map(t => [t.eventId, t]));
const contMap = new Map(conts.map(c => [c.eventId, c]));
report.stats.counts = {
  generated: gen.length, script: CHRONICLE_SCRIPT.length,
  troopRows: troops.length, contRows: conts.length,
  troopUnique: troopMap.size, contUnique: contMap.size,
};

const scriptById = new Map(CHRONICLE_SCRIPT.map(s => [s.eventId, s]));
const missingInGen = [...scriptById.keys()].filter(k => !byId.has(k));
const missingInScript = gen.map(e => e.id).filter(k => !scriptById.has(k));
report.stats.missingInGen = missingInGen;
report.stats.missingInScript = missingInScript;

let mismatchFrom = [], mismatchTroops = [], mismatchRoute = [];
for (const s of CHRONICLE_SCRIPT) {
  const e = byId.get(s.eventId);
  if (!e) continue;
  if (s.from && e.battle.chronicleFrom !== s.from) {
    mismatchFrom.push({ eventId: s.eventId, scriptFrom: s.from, genFrom: e.battle.chronicleFrom });
  }
  if (s.troops != null && e.battle.myTroops !== s.troops) {
    mismatchTroops.push({ eventId: s.eventId, scriptTroops: s.troops, genTroops: e.battle.myTroops });
  }
  const sr = (s.route || []).map(p => p.name);
  const gr = (e.battle.routeVia || []).map(p => p.name);
  if (sr.join('|') !== gr.join('|')) {
    mismatchRoute.push({ eventId: s.eventId, scriptRoute: sr, genRoute: gr });
  }
}
report.stats.scriptVsGen = { mismatchFrom, mismatchTroops, mismatchRoute };

// 兵力 JSON vs generated
const troopMismatch = [], troopMissing = [];
for (const t of troops) {
  const e = byId.get(t.eventId);
  if (!e) { troopMissing.push(t.eventId); continue; }
  if (t.gameTroops !== e.battle.myTroops) troopMismatch.push({ eventId: t.eventId, json: t.gameTroops, gen: e.battle.myTroops });
}
const noTroopRow = gen.map(e => e.id).filter(id => !troopMap.has(id));
report.stats.troopJsonVsGen = { mismatch: troopMismatch, missingRow: noTroopRow, orphanRows: troopMissing };

// 连续性 JSON vs generated
const contMismatch = [], contMissing = [];
for (const c of conts) {
  const e = byId.get(c.eventId);
  if (!e) { contMissing.push(c.eventId); continue; }
  const genFrom = e.battle.chronicleFrom;
  const genRoute = (e.battle.routeVia || []).map(p => p.name);
  const jsonRoute = (c.fixedRoute || []).map(p => (typeof p === 'string' ? p : p.name));
  const fromOk = !c.fixedFromCityId || c.fixedFromCityId === genFrom;
  const routeOk = jsonRoute.join('|') === genRoute.join('|');
  if (!fromOk || !routeOk) contMismatch.push({ eventId: c.eventId, jsonFrom: c.fixedFromCityId, genFrom, jsonRoute, genRoute });
}
const noContRow = gen.map(e => e.id).filter(id => !contMap.has(id));
report.stats.contJsonVsGen = { mismatch: contMismatch, missingRow: noContRow, orphanRows: contMissing };

// ---------- 2. 连续性规则 ----------
gen.forEach((e, i) => {
  e.__seq = i + 1;
  const b = e.battle;
  const fromCity = cities[b.chronicleFrom];
  const route = b.routeVia || [];
  if (!fromCity) { issue('出发点不存在', e, `${b.chronicleFrom} 不在 cities_v2`); return; }
  const targetPt = { lat: b.targetLat, lng: b.targetLng };

  // routeVia 与起终点重名/过近
  route.forEach((p, k) => {
    if (near(p.name, fromCity.name)) issue('途经点重名起点', e, `途经点「${p.name}」与出发据点同名`);
    else if (hav(p, fromCity) < 25) issue('途经点过近起点', e, `途经点「${p.name}」距出发据点 ${hav(p, fromCity).toFixed(0)}km`);
    if (near(p.name, b.targetName)) issue('途经点重名终点', e, `途经点「${p.name}」与战场同名`);
    else if (hav(p, targetPt) < 25) issue('途经点过近终点', e, `途经点「${p.name}」距战场 ${hav(p, targetPt).toFixed(0)}km`);
  });
  for (let k = 1; k < route.length; k++) {
    const d = hav(route[k - 1], route[k]);
    if (d < 15) issue('途经点重叠', e, `「${route[k - 1].name}」→「${route[k].name}」仅 ${d.toFixed(0)}km`);
  }

  // 折返：逐段位移与总方向夹角
  const pts = [fromCity, ...route, targetPt];
  let pathLen = 0;
  for (let k = 1; k < pts.length; k++) pathLen += hav(pts[k - 1], pts[k]);
  const direct = hav(fromCity, targetPt);
  if (direct > 300 && pathLen / Math.max(direct, 1) > 1.9) {
    issue('路线绕远', e, `直线 ${direct.toFixed(0)}km / 路径 ${pathLen.toFixed(0)}km = ${(pathLen / direct).toFixed(2)}倍`);
  }
  for (let k = 1; k < pts.length - 0; k++) {
    const step = hav(pts[k - 1], pts[k]);
    const remain = hav(pts[k], targetPt);
    if (step > 250 && remain > 0 && remain < step * 0.55 && k > 1) {
      // 本段远离目标
    }
  }
  // 单段跨距过大（跨大陆直跳）
  for (let k = 1; k < pts.length; k++) {
    const d = hav(pts[k - 1], pts[k]);
    if (d > 1200) issue('单段跨距过大', e, `「${pts[k - 1].name || fromCity.name}」→「${pts[k].name || b.targetName}」${d.toFixed(0)}km`);
  }

  // 守城战：守方应就地
  if (b.role === 'defender' && route.length > 0) {
    const tgtCity = b.targetCityId || (b.chronicleCity && b.chronicleCity.cityId);
    issue('守方有途经点', e, `role=defender(${b.battleType}) 仍有 ${route.length} 个途经点：${route.map(p => p.name).join('→')}`, { targetCity: tgtCity });
  }

  // 兵力规范
  if (b.myTroops !== b.enemyTroops) issue('兵力不对等', e, `${b.myTroops} vs ${b.enemyTroops}`);
  if (!Number.isInteger(b.myTroops) || b.myTroops < 1000 || b.myTroops > 20000) issue('兵力越界', e, `${b.myTroops}`);
});

// 同将连战承接
const lastEnd = new Map(); // leadGeneralId -> {city, name, seq, eventId}
for (const e of gen) {
  const b = e.battle;
  const lead = e.leadGeneralId;
  const prev = lastEnd.get(lead);
  const fromCity = cities[b.chronicleFrom];
  if (prev && fromCity) {
    const dist = hav(fromCity, prev.pt);
    if (dist > 120) {
      issue('同将连战出发点跳脱', e, `上一场(${prev.seq} ${prev.eventId}「${prev.name}」)终战据点「${prev.cityName}」→ 本场出发「${fromCity.name}」相距 ${dist.toFixed(0)}km`);
    }
  }
  // 记录本场终点：攻城战取被攻城，否则战场最近据点
  let endCityId = b.targetCityId || (b.chronicleCity && b.chronicleCity.cityId);
  let endPt = endCityId && cities[endCityId] ? cities[endCityId] : { lat: b.targetLat, lng: b.targetLng, name: b.targetName };
  if (!endCityId) {
    // 最近城市
    let best = null, bd = 1e9;
    for (const [cid, c] of Object.entries(cities)) {
      const d = hav(c, endPt);
      if (d < bd) { bd = d; best = { cityId: cid, ...c }; }
    }
    endPt = best; endCityId = best.cityId;
  }
  lastEnd.set(lead, { city: endCityId, cityName: endPt.name, pt: { lat: endPt.lat, lng: endPt.lng }, seq: e.__seq, eventId: e.id, name: e.title });
}

// 统计
const byCat = {};
for (const it of report.issues) byCat[it.cat] = (byCat[it.cat] || 0) + 1;
report.stats.issueByCat = byCat;
fs.writeFileSync(path.join(OUT, 'audit_raw.json'), JSON.stringify(report, null, 1), 'utf8');
console.log(JSON.stringify(report.stats, null, 1));
