/**
 * MAPWAR 攻城模拟器 v2
 * 三轮：劣势1万 / 均势2万 / 优势3万，vs 城市真实驻军。
 * 717势力真实数据，文化+战略+战术+精锐+关隘+三势+地形。
 * 底层接 combat-model，完整复刻游戏引擎战斗数学。
 *
 * 用法:
 *   npx tsx tools/legion-sim.ts --trials 500
 *   npx tsx tools/legion-sim.ts --roster ~/my-roster.md
 */
import * as fs from 'fs';
import * as path from 'path';
import { simulateOnce, type UnitSpec, type Terrain } from './combat-model';
import { getRegion } from '../src/systems/RegionSystem';
import { GameConfig } from '../src/config/GameConfig';
import { buildSimCityMetaByName, resolveSimGarrisonTroops } from './sim-city-meta';
import { auditRosterGenerals, resolveAptitudeByGeneralName, parseRosterEliteTier, resolveCombatSkillIds } from './sim-general-lookup';

// ── CLI ──
function argStr(flag: string, def: string): string {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? (process.argv[i + 1] || def) : def;
}
function argNum(flag: string, def: number): number {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? (parseInt(process.argv[i + 1]) || def) : def;
}

const ROSTER_PATH = argStr('--roster',
  path.resolve(process.env.USERPROFILE || '~', 'Downloads/MAPWAR名册_2026-07-11 (1).md'));
const TRIALS = argNum('--trials', 300);
const OPPONENTS = argNum('--opponents', 30);
const CITY_TROOPS = argNum('--city-troops', 20000);
const CITY_META = buildSimCityMetaByName(CITY_TROOPS);

// ── 地形权重 ──
const TERRAINS: { t: Terrain; w: number }[] = [
  { t: 'plain',   w: 0.50 },
  { t: 'mountain', w: 0.40 },
  { t: 'sea',     w: 0.10 },
];
function randomTerrain(): Terrain {
  const r = Math.random(); let acc = 0;
  for (const x of TERRAINS) { acc += x.w; if (r < acc) return x.t; }
  return 'plain';
}

// ── 名册解析 ──
interface CityEntry {
  faction: string; city: string; lat: number; lng: number;
  generalName: string; tier: string; tacticalName: string;
  strategicName: string; eliteName: string; eliteTier: string;
}
function parseRoster(fp: string): CityEntry[] {
  const t = fs.readFileSync(fp, 'utf-8'), e: CityEntry[] = [];
  for (const l of t.split('\n')) {
    if (!l.startsWith('|') || l.includes('---|---')) continue;
    if (l.includes('叛军 | —') || l.includes('势力 | 据点')) continue;
    const c = l.split('|').map(x => x.trim()).filter(x => x);
    if (c.length < 11) continue;
    const [ls, gs] = (c[2] || ', ').split(',').map(s => s.trim());
    e.push({
      faction: c[0], city: c[1],
      lat: parseFloat(ls) || 0, lng: parseFloat(gs) || 0,
      generalName: c[4], tier: c[5],
      tacticalName: c[6], strategicName: c[7],
      eliteName: c[8], eliteTier: c[9],
    } as CityEntry);
  }
  return e;
}

// ── 单位预计算 ──
interface UnitData {
  city: string; generalName: string; tier: string;
  region: string; cultureField: number; cultureGarrison: number;
  eliteTier: number | null; tacticalSkillId: string | null;
  strategicSkillId: string | null; isPass: boolean; isRegionCenter: boolean;
  aptitude: 'create' | 'leverage' | 'reverse';
}

function precalc(e: CityEntry): UnitData {
  const region = getRegion(e.lat, e.lng);
  const cult = GameConfig.CULTURE_COMBAT.TIER_TABLE[region] ?? [1, 1];
  const ei = parseRosterEliteTier(e.eliteTier);
  const skills = resolveCombatSkillIds(e.generalName, e.tier, e.tacticalName, e.strategicName);
  const meta = CITY_META[e.city];
  const aptitude = resolveAptitudeByGeneralName(e.generalName);
  return {
    city: e.city, generalName: e.generalName, tier: e.tier,
    region, cultureField: cult[0], cultureGarrison: cult[1],
    eliteTier: ei,
    tacticalSkillId: skills.tacticalSkillId, strategicSkillId: skills.strategicSkillId,
    isPass: meta?.isPass ?? false,
    isRegionCenter: meta?.isRegionCenter ?? false,
    aptitude,
  };
}

// ── 单局模拟（接 combat-model，三势已由 combat-model 内置）──
function simOneBattle(
  att: UnitData, def: UnitData,
  attTroops: number, defTroops: number,
  terrain: Terrain,
): { won: boolean; survivors: number } {
  const attSpec: UnitSpec = {
    troops: attTroops,
    region: att.region,
    role: 'field',
    eliteTier: att.eliteTier,
    general: {
      tier: att.tier === '名将' ? 'famous' : 'ordinary',
      tacticalSkillId: att.tacticalSkillId ?? undefined,
      strategicSkillId: att.strategicSkillId ?? undefined,
      aptitude: att.aptitude,
    },
  };
  const defSpec: UnitSpec = {
    troops: defTroops,
    region: def.region,
    role: 'garrison',
    pass: def.isPass,
    regionCenter: def.isRegionCenter,
    eliteTier: def.eliteTier,
    general: {
      tier: def.tier === '名将' ? 'famous' : 'ordinary',
      tacticalSkillId: def.tacticalSkillId ?? undefined,
      strategicSkillId: def.strategicSkillId ?? undefined,
      aptitude: def.aptitude,
    },
  };

  const r = simulateOnce([attSpec], [defSpec], terrain, true, 'siege');
  return { won: r.attackerWon, survivors: r.attSurvivors };
}

// ── 主函数 ──
function main() {
  console.log('加载...');
  const entries = parseRoster(ROSTER_PATH);

  const cityDataMap: Record<string, number> = {};
  for (const [name, meta] of Object.entries(CITY_META)) {
    cityDataMap[name] = meta.troops;
  }

  const rosterAudit = auditRosterGenerals(entries);
  if (rosterAudit.missingId.length > 0) {
    console.warn(`⚠ 名册名将无 generalId（默认 create 适性）: ${rosterAudit.missingId.slice(0, 8).join('、')}${rosterAudit.missingId.length > 8 ? '…' : ''}`);
  }
  if (rosterAudit.missingProfile.length > 0) {
    console.warn(`⚠ 名册名将无 GENERAL_PROFILES: ${rosterAudit.missingProfile.slice(0, 8).join('、')}${rosterAudit.missingProfile.length > 8 ? '…' : ''}`);
  }

  const units = entries.map(precalc);
  const famous = units.filter(u => u.tier === '名将');
  console.log(`${entries.length} 势力，名将 ${famous.length}\n`);

  const rounds: [string, number][] = [
    ['劣势', 10000],
    ['均势', 20000],
    ['优势', 30000],
  ];
  const exp = ['成吉思汗', '岳飞', '白起', '卫青', '霍去病', '刘裕', '李靖', '李世民', '项羽', '曹操'];

  for (const [label, legionTroops] of rounds) {
    interface R { name: string; city: string; wins: number; total: number; wr: number; avgSurv: number; }
    const results: R[] = [];

    for (const att of famous) {
      let wins = 0, total = 0, survSum = 0;
      for (let o = 0; o < OPPONENTS; o++) {
        const di = Math.floor(Math.random() * units.length);
        if (units[di].city === att.city) continue;
        const def = units[di];
        const defT = resolveSimGarrisonTroops(CITY_META[def.city], cityDataMap[def.city] || CITY_TROOPS);
        for (let t = 0; t < TRIALS; t++) {
          const terrain = randomTerrain();
          const r = simOneBattle(att, def, legionTroops, defT, terrain);
          if (r.won) { wins++; survSum += r.survivors; }
          total++;
        }
      }
      results.push({
        name: att.generalName, city: att.city,
        wins, total, wr: wins / total,
        avgSurv: wins > 0 ? survSum / wins : 0,
      });
    }

    results.sort((a, b) => b.wr - a.wr);

    const bar = '\u2550'.repeat(74);
    console.log(`${bar}`);
    console.log(`  📊 ${label}轮  军团${(legionTroops / 10000).toFixed(0)}万 vs 守军（文化×城型上限）  (含地形/攻城/关隘/中心/三势)`);
    console.log(`${bar}\n`);
    console.log(`  #    武将      据点          胜率     均存活`);
    console.log(`  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`);
    for (let i = 0; i < 25; i++) {
      const r = results[i];
      const m = i === 0 ? '\uD83D\uDC51' : '';
      console.log(`  ${m}${(i + 1).toString().padStart(3)}  ${r.name.padEnd(8)} ${r.city.padEnd(12)} ${(r.wr * 100).toFixed(1).padStart(6)}%  ${Math.round(r.avgSurv).toLocaleString().padStart(7)}`);
    }

    console.log(`\n  \uD83D\uDCDC 历史预期`);
    for (const n of exp) {
      const i = results.findIndex(r => r.name === n);
      if (i >= 0) {
        const r = results[i];
        console.log(`  ${n.padEnd(8)} #${(i + 1).toString().padStart(3)}  ${r.city.padEnd(10)}  ${(r.wr * 100).toFixed(1)}%   存活${Math.round(r.avgSurv).toLocaleString()}`);
      }
    }
    console.log();
  }
}

main();
