/**
 * MAPWAR 连续攻城模拟器
 * 指定军团（5万兵），逐城攻打真实据点，直到兵力耗尽。
 * 使用 combat-model 完整复刻战斗数学。
 *
 * 用法:
 *   npx tsx tools/legion-campaign.ts 曹操 --trials 50
 *   npx tsx tools/legion-campaign.ts --rank --trials 30 --pool 50
 */
import * as fs from 'fs';
import * as path from 'path';
import { simulateOnce, type UnitSpec, type Terrain } from './combat-model';
import { getRegion } from '../src/systems/RegionSystem';
import { GameConfig } from '../src/config/GameConfig';
import { T0_CAPITALS, T1_MEDIUM_CITIES, T2_STRATEGIC, PERIPHERY } from '../src/data/cities_v2';
import { buildSimCityMetaByName } from './sim-city-meta';
import { getCityMaxTroops, getArmyMaxTroops } from './sim-troop-caps';
import { applyStrategicSustainAfterVictory } from './sim-strategic-sustain';
import type { CityType } from '../src/types/core';
import { auditRosterGenerals, resolveAptitudeByGeneralName, parseRosterEliteTier, resolveCombatSkillIds, resolveCombatSkillLabels } from './sim-general-lookup';
import { matchesFilters } from './sim-legion-core';

const SIM_CITY_META = buildSimCityMetaByName(20000);

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
const TRIALS = argNum('--trials', 50);
const MAX_BATTLES = argNum('--max-battles', argNum('--battles', 200));
const T0_ONLY = process.argv.includes('--t0-only'); // 已废弃：实为20大城；请用 --elite-tier T0 --general-tier 名将
const ELITE_TIER_FILTER = argStr('--elite-tier', '') || null;
const GENERAL_TIER_FILTER = argStr('--general-tier', '') || null;
const HARD_CAP = MAX_BATTLES;
const LEGION_TROOPS = argNum('--troops', 50000);
const TARGET_GENERAL = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
const RANK_MODE = process.argv.includes('--rank') || !TARGET_GENERAL;

// ── 地形 ──
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

// ── 城市数据 ──
const CITY_TABLE: Record<string, { type: string; troops: number; tier: number }> = {};
for (const c of [...T0_CAPITALS, ...T1_MEDIUM_CITIES, ...T2_STRATEGIC, ...PERIPHERY]) {
  CITY_TABLE[c.name] = {
    type: (c as any).type || 'small_city',
    troops: (c as any).troops || 20000,
    tier: (c as any).tier ?? 4,
  };
}
const TYPE_LABEL: Record<string, string> = {
  big_city: '都城', medium_city: '中城', small_city: '小城', pass: '关隘',
};

const T0_CITY_NAMES = new Set(T0_CAPITALS.map(c => c.name));

// 驻军随机范围：上限 = 城型基准 × CITY_TROOP_CAP_TABLE[region]
function randomTroops(cityType: CityType, region: string): number {
  const hi = getCityMaxTroops(cityType, region);
  const lo = Math.min(1000, hi);
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

// ── 军团数据 ──
interface LegionData {
  name: string; city: string; tier: string;
  region: string; cultureField: number; cultureGarrison: number;
  eliteTier: number | null; tacticalSkillId: string | null;
  strategicSkillId: string | null; isPass: boolean; isRegionCenter: boolean;
  eliteName: string; aptitude: 'create' | 'leverage' | 'reverse';
  tacticalName: string; strategicName: string;
}

function buildLegion(e: CityEntry): LegionData {
  const region = getRegion(e.lat, e.lng);
  const cult = GameConfig.CULTURE_COMBAT.TIER_TABLE[region] ?? [1, 1];
  const ei = parseRosterEliteTier(e.eliteTier);
  const skills = resolveCombatSkillIds(e.generalName, e.tier, e.tacticalName, e.strategicName);
  const labels = resolveCombatSkillLabels(e.generalName, e.tier, e.tacticalName, e.strategicName);
  const meta = SIM_CITY_META[e.city];
  const aptitude = resolveAptitudeByGeneralName(e.generalName);

  return {
    name: e.generalName, city: e.city,
    tier: e.tier, region,
    cultureField: cult[0], cultureGarrison: cult[1],
    eliteTier: ei,
    tacticalSkillId: skills.tacticalSkillId, strategicSkillId: skills.strategicSkillId,
    isPass: meta?.isPass ?? false,
    isRegionCenter: meta?.isRegionCenter ?? false,
    eliteName: e.eliteName, aptitude,
    tacticalName: labels.tacticalName,
    strategicName: labels.strategicName,
  };
}

function toUnitSpec(legion: LegionData, troops: number, role: 'field' | 'garrison', isFirstSortieSinceDepart = false): UnitSpec {
  return {
    troops,
    region: legion.region,
    role,
    pass: role === 'garrison' ? legion.isPass : undefined,
    regionCenter: role === 'garrison' ? legion.isRegionCenter : undefined,
    eliteTier: legion.eliteTier,
    isFirstSortieSinceDepart: role === 'field' ? isFirstSortieSinceDepart : undefined,
    general: {
      tier: legion.tier === '名将' ? 'famous' : 'ordinary',
      tacticalSkillId: legion.tacticalSkillId ?? undefined,
      strategicSkillId: legion.strategicSkillId ?? undefined,
      aptitude: legion.aptitude,
    },
  };
}

// ── 单轮战役（打到死为止）──
interface BattleLog {
  city: string; type: string; defender: string;
  defElite: string; defTier: string; defTroops: number;
  won: boolean; survivors: number; terrain: string;
}

function runCampaign(attacker: LegionData, pool: LegionData[]): BattleLog[] {
  let troops = LEGION_TROOPS;
  const log: BattleLog[] = [];
  const attacked = new Set<string>();

  for (let b = 0; b < HARD_CAP; b++) {
    if (troops < 2000) break;

    // 随机选守城方（不打自己，避免同城重复）
    let def: LegionData;
    let tries = 0;
    do {
      def = pool[Math.floor(Math.random() * pool.length)];
      tries++;
    } while ((def.city === attacker.city || attacked.has(def.city)) && tries < 100);
    attacked.add(def.city);

    const cityType = (CITY_TABLE[def.city]?.type || 'small_city') as CityType;
    const defTroops = randomTroops(cityType, def.region);
    const terrain = randomTerrain();
    const attSpec = toUnitSpec(attacker, troops, 'field', b === 0);
    const defSpec = toUnitSpec(def, defTroops, 'garrison');

    const r = simulateOnce([attSpec], [defSpec], terrain, true, 'siege');
    const defTierLabel = def.tier === '名将' ? '名' : '普';

    log.push({
      city: def.city,
      type: TYPE_LABEL[cityType] || cityType,
      defender: def.name,
      defElite: def.eliteName,
      defTier: defTierLabel,
      defTroops,
      won: r.attackerWon,
      survivors: r.attSurvivors,
      terrain,
    });

    if (!r.attackerWon) break;
    troops = applyStrategicSustainAfterVictory(
      r.attSurvivors,
      getArmyMaxTroops(attacker.region),
      attacker.strategicSkillId,
    );
  }

  return log;
}

// ── 主函数 ──
function main() {
  console.log('加载...');
  const entries = parseRoster(ROSTER_PATH);
  const rosterAudit = auditRosterGenerals(entries);
  if (rosterAudit.missingId.length > 0) {
    console.warn(`⚠ 名册名将无 generalId: ${rosterAudit.missingId.length} 人`);
  }
  const legions = entries.map(buildLegion);
  const legionByName = new Map<string, LegionData>();
  for (const l of legions) legionByName.set(l.name, l);

  const famous = legions.filter(l => l.tier === '名将');
  let attackers = famous;
  if (T0_ONLY) attackers = famous.filter(l => T0_CITY_NAMES.has(l.city));
  if (ELITE_TIER_FILTER || GENERAL_TIER_FILTER) {
    attackers = legions.filter(l => matchesFilters(l, GENERAL_TIER_FILTER, ELITE_TIER_FILTER));
  }
  const filterLabel = ELITE_TIER_FILTER || GENERAL_TIER_FILTER
    ? `${GENERAL_TIER_FILTER || '全将'}+精锐${ELITE_TIER_FILTER || '任意'}`
    : T0_ONLY ? 'T0大城名将(旧筛)' : '名将';
  console.log(`${entries.length} 势力，名将 ${famous.length}，攻方池 ${attackers.length}（${filterLabel}）\n`);

  if (attackers.length === 0) {
    console.log('攻方池为空，请检查 --general-tier / --elite-tier / 名册');
    return;
  }

  if (RANK_MODE) {
    // 全量排名模式
    console.log(`━`.repeat(62));
    console.log(`  ⚡ 连续攻城排名  军团${(LEGION_TROOPS/10000).toFixed(0)}万 × 最多${MAX_BATTLES}战/轮 × 各${TRIALS}次  守军1000~文化上限`);
    console.log(`━`.repeat(62));

    interface RankEntry {
      name: string; city: string; elite: string; str: string; tac: string;
      avg: number; best: number; bestCities: string;
    }
    const ranks: RankEntry[] = [];

    // Show top generals
    const topN = argNum('--top', attackers.length);
    const pool = ELITE_TIER_FILTER || GENERAL_TIER_FILTER || T0_ONLY
      ? attackers
      : famous.slice(0, Math.min(famous.length, argNum('--pool', 50)));

    for (const att of pool) {
      let totalBattles = 0, bestRun = 0;
      let bestCities = '';
      for (let t = 0; t < TRIALS; t++) {
        const log = runCampaign(att, legions);
        const won = log.filter(l => l.won).length;
        totalBattles += won;
        if (won > bestRun) {
          bestRun = won;
          bestCities = log.filter(l => l.won).map(l => l.city).join(' → ');
        }
      }

      ranks.push({
        name: att.name, city: att.city, elite: att.eliteName,
        str: att.strategicName, tac: att.tacticalName,
        avg: totalBattles / TRIALS,
        best: bestRun,
        bestCities: bestCities || '-',
      });
    }

    ranks.sort((a, b) => b.avg - a.avg);

    console.log(`\n  #  武将      据点        精锐          均胜场  最佳  最佳路线（前5城）`);
    console.log(`  ─`.repeat(62));
    for (let i = 0; i < Math.min(ranks.length, topN); i++) {
      const r = ranks[i];
      const m = i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : ' ';
      const route = r.bestCities.split(' → ').slice(0, 5).join('→') + (r.best > 5 ? '…' : '');
      console.log(`  ${m}${(i+1).toString().padStart(2)} ${r.name.padEnd(7)} ${r.city.padEnd(9)} ${r.elite.padEnd(11)} ${r.avg.toFixed(1).padStart(5)}   ${String(r.best).padStart(2)}  ${route}`);
    }

    // Detail for top 3
    console.log(`\n  ━`.repeat(62));
    console.log(`  🏆 前3 详细记录`);
    console.log(`  ━`.repeat(62));
    for (let i = 0; i < Math.min(3, ranks.length); i++) {
      const r = ranks[i];
      console.log(`\n  ▶ ${r.name}  🏰${r.city}  ⚔${r.elite}  ${r.str}  ${r.tac}`);
      console.log(`     最佳战绩: ${r.bestCities}`);
    }
  } else {
    // Single general mode
    const att = legionByName.get(TARGET_GENERAL!);
    if (!att) {
      console.log(`未找到武将: ${TARGET_GENERAL}`);
      console.log(`可用名将: ${famous.slice(0,10).map(l=>l.name).join(', ')}...`);
      return;
    }

    console.log(`━`.repeat(72));
    console.log(`  ⚔ ${att.name}  🏰${att.city}  ⚔${att.eliteName}  ${att.tier}`);
    console.log(`  军团 ${(LEGION_TROOPS/10000).toFixed(0)}万 × 打到死 × ${TRIALS}次`);
    console.log(`━`.repeat(72));

    let totalWon = 0, bestRun = 0, bestLog: BattleLog[] = [];
    for (let t = 0; t < TRIALS; t++) {
      const log = runCampaign(att, legions);
      const won = log.filter(l => l.won).length;
      totalWon += won;
      if (won > bestRun) { bestRun = won; bestLog = log; }
    }

    console.log(`\n  平均攻克: ${(totalWon/TRIALS).toFixed(1)} 城  |  最佳: ${bestRun} 城`);
    console.log(`\n  ━━━ 最佳战绩详情 ━━━`);
    console.log(`  战  据点      类型  守将      守军  精锐           结果  残兵`);

    for (let i = 0; i < bestLog.length; i++) {
      const b = bestLog[i];
      const icon = b.won ? '✅' : '❌';
      const surv = b.won ? Math.round(b.survivors).toLocaleString() : '-';
      console.log(`  ${(i+1).toString().padStart(2)} ${b.city.padEnd(8)} ${b.type.padEnd(3)} ${b.defender.padEnd(7)} ${b.defTroops.toLocaleString().padStart(6)} ${b.defElite.padEnd(12)} ${icon}   ${surv}`);
    }
  }
  console.log();
}

main();
