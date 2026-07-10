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
import { T0_CAPITALS, T1_MEDIUM_CITIES, T2_STRATEGIC, PERIPHERY } from '../src/data/cities_v2';
import { GENERAL_PROFILES } from '../src/data/GeneralSkills';

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
  path.resolve(process.env.USERPROFILE || '~', 'Downloads/MAPWAR名册_2026-07-11.md'));
const TRIALS = argNum('--trials', 300);
const OPPONENTS = argNum('--opponents', 30);
const CITY_TROOPS = argNum('--city-troops', 20000);

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

const CIRC: Record<string, string> = {
  '\u2460':'01','\u2461':'02','\u2462':'03','\u2463':'04','\u2464':'05','\u2465':'06','\u2466':'07','\u2467':'08',
  '\u2468':'09','\u2469':'10','\u246a':'11','\u246b':'12','\u246c':'13','\u246d':'14','\u246e':'15','\u246f':'16',
  '\u2470':'17','\u2471':'18','\u2472':'19','\u2473':'20',
};
function tacId(n: string): string | null {
  const m = n.match(/^(\d+)\s/);
  if (m) return `ts_${m[1].padStart(3, '0')}`;
  const cm = n.match(/^([\u2460-\u2473])/);
  if (cm) return `tac_${CIRC[cm[0][0]] || '01'}`;
  return null;
}
function stratId(n: string): string | null {
  const m = n.match(/S([①-⑮])\s/);
  if (!m) return null;
  const map: Record<string, string> = {
    '①':'01','②':'02','③':'03','④':'04','⑤':'05','⑥':'06','⑦':'07',
    '⑧':'08','⑨':'09','⑩':'10','⑪':'11','⑫':'12','⑬':'13','⑭':'14','⑮':'15',
  };
  return `str_${map[m[1]] || '01'}`;
}

// ── 单位预计算 ──
interface UnitData {
  city: string; generalName: string; tier: string;
  region: string; cultureField: number; cultureGarrison: number;
  eliteTier: number | null; tacticalSkillId: string | null;
  strategicSkillId: string | null; isPass: boolean;
  aptitude: string;
}

function precalc(e: CityEntry): UnitData {
  const region = getRegion(e.lat, e.lng);
  const cult = GameConfig.CULTURE_COMBAT.TIER_TABLE[region] ?? [1, 1];
  const ei = parseInt(e.eliteTier.replace('T', '')) || 4;
  const tid = tacId(e.tacticalName);
  const sid = stratId(e.strategicName);
  const passKw = ['关', '塞', '口', '津', '渡', '门', '隘', '堡', '镇'];

  let aptitude = 'create';
  for (const [, prof] of Object.entries(GENERAL_PROFILES)) {
    if (prof.tier === (e.tier === '名将' ? 'famous' : 'ordinary')) {
      aptitude = (prof as any).aptitude ?? 'create';
      break;
    }
  }

  return {
    city: e.city, generalName: e.generalName, tier: e.tier,
    region, cultureField: cult[0], cultureGarrison: cult[1],
    eliteTier: ei < 4 ? ei : null,
    tacticalSkillId: tid, strategicSkillId: sid,
    isPass: passKw.some(k => e.city.includes(k)),
    aptitude,
  };
}

// 三势系数（combat-model 不含此层；引擎独立叠加）
function aptMult(aptitude: string, selfT: number, enemyT: number): number {
  const r = enemyT > 0 ? selfT / enemyT : 999;
  if (r > 1.5) return aptitude === 'create' ? 1.08 : 1;
  if (r < 0.67) return aptitude === 'reverse' ? 1.12 : 1;
  return aptitude === 'leverage' ? 1.05 : 1;
}

// ── 单局模拟（接 combat-model） ──
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
    },
  };
  const defSpec: UnitSpec = {
    troops: defTroops,
    region: def.region,
    role: 'garrison',
    pass: def.isPass,
    eliteTier: def.eliteTier,
    general: {
      tier: def.tier === '名将' ? 'famous' : 'ordinary',
      tacticalSkillId: def.tacticalSkillId ?? undefined,
      strategicSkillId: def.strategicSkillId ?? undefined,
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
  for (const c of [...T0_CAPITALS, ...T1_MEDIUM_CITIES, ...T2_STRATEGIC, ...PERIPHERY]) {
    cityDataMap[c.name] = (c as any).troops || CITY_TROOPS;
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
        const defT = cityDataMap[def.city] || CITY_TROOPS;
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
    console.log(`  \uD83D\uDCCA ${label}轮  军团${(legionTroops / 10000).toFixed(0)}万 vs 守军${(CITY_TROOPS / 10000).toFixed(0)}万  (含地形/攻城/条件门控)`);
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
