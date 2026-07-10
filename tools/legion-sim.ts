/**
 * MAPWAR 军团攻城模拟器 v3
 * 每名将三轮：优势(攻5万 vs 守按城类型随机) / 均势(等兵力5万) / 劣势(攻按城类型随机 vs 守5万)
 * 717势力真实数据，文化+战略+战术+精锐+关隘+三势。
 * 
 * 用法: npx tsx tools/legion-sim.ts --rank --trials 500
 */
import * as fs from 'fs';
import * as path from 'path';
import { resolveGeneralTacticalEntry } from '../src/combat/TacticalSkillResolver';
import { STRATEGIC_SKILL_CATALOG, getTacticalSkillDef, GENERAL_PROFILES } from '../src/data/GeneralSkills';
import { getRegion } from '../src/systems/RegionSystem';
import { GameConfig } from '../src/config/GameConfig';
import { T0_CAPITALS, T1_MEDIUM_CITIES, T2_STRATEGIC, PERIPHERY } from '../src/data/cities_v2';

const LUCK_MIN = GameConfig.COMBAT.LUCK_MIN;
const LUCK_MAX = GameConfig.COMBAT.LUCK_MAX;
const ELITE_MULT = GameConfig.COMBAT.ELITE_TIER_MULT;
const PASS_MULT = GameConfig.CULTURE_COMBAT.PASS_GARRISON_MULT;
const TIER_TABLE = GameConfig.CULTURE_COMBAT.TIER_TABLE;
const ROSTER_PATH = path.resolve(process.env.USERPROFILE || '~', 'Downloads/MAPWAR名册_2026-07-11.md');

const CITY_TROOPS: Record<string, [number, number]> = {
    small_city: [3000, 12000], medium_city: [12000, 30000], big_city: [30000, 50000],
};
const LEGION_TROOPS = 50000;

// ── 名册 ──
interface CityEntry {
    faction: string; city: string; lat: number; lng: number; flag: string;
    generalName: string; tier: string; tacticalName: string; strategicName: string;
    eliteName: string; eliteTier: string;
}
function parseRoster(fp: string): CityEntry[] {
    const text = fs.readFileSync(fp, 'utf-8');
    const e: CityEntry[] = [];
    for (const line of text.split('\n')) {
        if (!line.startsWith('|') || line.includes('---|---')) continue;
        if (line.includes('叛军 | —') || line.includes('势力 | 据点')) continue;
        const cols = line.split('|').map(c => c.trim()).filter(c => c);
        if (cols.length < 11) continue;
        const [latS, lngS] = (cols[2] || ', ').split(',').map(s => s.trim());
        e.push({ faction: cols[0], city: cols[1], lat: parseFloat(latS) || 0, lng: parseFloat(lngS) || 0,
            flag: cols[3], generalName: cols[4], tier: cols[5], tacticalName: cols[6],
            strategicName: cols[7], eliteName: cols[8], eliteTier: cols[9] });
    }
    return e;
}

// ── 技能 ──
const CIRC: Record<string, string> = {
    '①':'01','②':'02','③':'03','④':'04','⑤':'05','⑥':'06','⑦':'07','⑧':'08','⑨':'09','⑩':'10',
    '⑪':'11','⑫':'12','⑬':'13','⑭':'14','⑮':'15','⑯':'16','⑰':'17','⑱':'18','⑲':'19','⑳':'20',
};
function tacId(n: string): string | null {
    const m = n.match(/^(\d+)\s/); if (m) return `ts_${m[1].padStart(3, '0')}`;
    const cm = n.match(/^([①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳])/);
    if (cm) return `tac_${CIRC[cm[0][0]] || '01'}`;
    return null;
}
function stratId(n: string): string | null {
    const m = n.match(/S([①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮])\s/);
    if (!m) return null;
    const map: Record<string, string> = { '①':'01','②':'02','③':'03','④':'04','⑤':'05','⑥':'06','⑦':'07',
        '⑧':'08','⑨':'09','⑩':'10','⑪':'11','⑫':'12','⑬':'13','⑭':'14','⑮':'15' };
    return `str_${map[m[1]] || '01'}`;
}

// ── 预计算 ──
interface UnitData {
    city: string; generalName: string; tier: string;
    region: string; cultureField: number; cultureGarrison: number;
    eliteMult: number;
    stratEffect: string | null; stratMag: number;
    tacEffect: string | null; tacMag: number;
    isPass: boolean; aptitude: string;
}
function precalc(e: CityEntry): UnitData {
    const region = getRegion(e.lat, e.lng);
    const cult = TIER_TABLE[region] ?? [1, 1];
    const ei = parseInt(e.eliteTier.replace('T', '')) || 4;
    const elite = ELITE_MULT[ei] ?? 1;
    const sid = stratId(e.strategicName);
    const sdef = sid ? STRATEGIC_SKILL_CATALOG[sid] : null;
    let teff: string | null = null, tmag = 1;
    const tid = tacId(e.tacticalName);
    if (tid) { const ent = resolveGeneralTacticalEntry(tid); if (ent) { teff = ent.baseEffect; tmag = (ent as any).magnitude ?? 1; }
        else { const d = getTacticalSkillDef(tid); if (d) { teff = d.effect; tmag = d.magnitude; } } }
    const passKw = ['关', '塞', '口', '津', '渡', '门', '隘', '堡', '镇'];
    let aptitude = 'create';
    for (const [, prof] of Object.entries(GENERAL_PROFILES)) {
        if (prof.tier === (e.tier === '名将' ? 'famous' : 'ordinary')) { aptitude = (prof as any).aptitude ?? 'create'; break; }
    }
    return { city: e.city, generalName: e.generalName, tier: e.tier, region,
        cultureField: cult[0], cultureGarrison: cult[1], eliteMult: elite,
        stratEffect: sdef?.effect ?? null, stratMag: sdef?.magnitude ?? 1,
        tacEffect: teff, tacMag: tmag, isPass: passKw.some(k => e.city.includes(k)), aptitude };
}

// ── 战斗 ──
const TAC_OWN = (e: string | null, m: number): number => {
    if (!e) return 1;
    if (e === 'ally_mult_1_2' || e === 'ally_power_mult') return m;
    return m >= 1 ? m : 1;
};
const TAC_ENEMY = (e: string | null, m: number): number => {
    if (!e) return 1;
    if (e === 'enemy_mult_0_8') return m;
    if (e === 'enemy_sub_troops_opening') return Math.max(m, 0.4);
    return 1;
};
function aptMult(aptitude: string, selfT: number, enemyT: number): number {
    const ratio = enemyT > 0 ? selfT / enemyT : 999;
    if (ratio > 1.5) return aptitude === 'create' ? 1.08 : 1;
    if (ratio < 0.67) return aptitude === 'reverse' ? 1.12 : 1;
    return aptitude === 'leverage' ? 1.05 : 1;
}

function simulateOne(att: UnitData, def: UnitData, attT: number, defT: number): boolean {
    const dp = def.isPass ? PASS_MULT : 1;
    let ap = attT * att.cultureField * att.eliteMult;
    let bp = defT * def.cultureGarrison * def.eliteMult * dp;
    ap *= TAC_OWN(att.tacEffect, att.tacMag);
    bp *= TAC_OWN(def.tacEffect, def.tacMag);
    bp *= TAC_ENEMY(att.tacEffect, att.tacMag);
    ap *= TAC_ENEMY(def.tacEffect, def.tacMag);
    if (att.stratEffect === 'attacker_power_mult') ap *= att.stratMag;
    if (def.stratEffect === 'garrison_defense_mult') bp *= def.stratMag;
    const aR = ap / Math.max(1, bp), dR = bp / Math.max(1, ap);
    if (att.stratEffect === 'disadvantage_power_mult' && aR < 0.67) ap *= att.stratMag;
    if (def.stratEffect === 'disadvantage_power_mult' && dR < 0.67) bp *= def.stratMag;
    if (att.stratEffect === 'advantage_skill_effect_mult' && att.tacEffect && aR > 1.5) ap *= att.stratMag;
    if (def.stratEffect === 'advantage_skill_effect_mult' && def.tacEffect && dR > 1.5) bp *= def.stratMag;
    ap *= aptMult(att.aptitude, attT, defT);
    bp *= aptMult(def.aptitude, defT, attT);
    ap *= LUCK_MIN + Math.random() * (LUCK_MAX - LUCK_MIN);
    bp *= LUCK_MIN + Math.random() * (LUCK_MAX - LUCK_MIN);
    return ap >= bp;
}

// ── 主函数 ──
function main() {
    const args = process.argv.slice(2);
    const trials = (() => { const i = args.indexOf('--trials'); return i >= 0 ? parseInt(args[i + 1]) || 300 : 300; })();

    console.log('加载...');
    const entries = parseRoster(ROSTER_PATH);
    // Build city data map: city name → { type, troops }
    const cityDataMap: Record<string, { type: string; troops: number }> = {};
    for (const c of [...T0_CAPITALS, ...T1_MEDIUM_CITIES, ...T2_STRATEGIC, ...PERIPHERY]) {
        cityDataMap[c.name] = { type: c.type || 'small_city', troops: (c as any).troops || 20000 };
    }
    const units = entries.map(precalc);
    const famous = units.filter(u => u.tier === '名将');
    console.log(`${entries.length} 势力，名将 ${famous.length}\n`);

    const OPPONENTS = 30;
    
    // 第一轮：军团5万 vs 城市真实守军
    console.log('══════════════════════════════════════════════════════════════════════');
    console.log('  第一轮：军团5万攻城，守方使用真实驻军兵力');
    console.log('══════════════════════════════════════════════════════════════════════\n');
    
    interface Result { name: string; city: string; wins: number; total: number; wr: number; }
    const results: Result[] = [];
    
    for (let ai = 0; ai < famous.length; ai++) {
        const att = famous[ai];
        let wins = 0, total = 0;
        for (let o = 0; o < OPPONENTS; o++) {
            const di = Math.floor(Math.random() * units.length);
            if (units[di].city === att.city) continue;
            const def = units[di];
            const cd = cityDataMap[def.city] || { type: 'small_city', troops: 20000 };
            const defTroops = cd.troops;
            for (let t = 0; t < trials; t++) {
                if (simulateOne(att, def, LEGION_TROOPS, defTroops)) wins++;
                total++;
            }
        }
        results.push({ name: att.generalName, city: att.city, wins, total, wr: wins / total });
    }
    results.sort((a, b) => b.wr - a.wr);

    console.log('  #    武将      据点        胜率');
    console.log('  ───────────────────────────────────');
    for (let i = 0; i < 25; i++) {
        const r = results[i];
        const m = i === 0 ? '👑' : '';
        console.log(`  ${m}${(i + 1).toString().padStart(3)}  ${r.name.padEnd(8)} ${r.city.padEnd(10)} ${(r.wr * 100).toFixed(1).padStart(6)}%`);
    }
    
    console.log('\n  📜 历史预期');
    const exp = ['成吉思汗', '岳飞', '白起', '卫青', '霍去病', '刘裕', '李靖', '李世民', '项羽', '曹操'];
    for (const n of exp) {
        const i = results.findIndex(r => r.name === n);
        if (i >= 0) {
            const r = results[i];
            console.log(`  ${n.padEnd(8)} #${(i + 1).toString().padStart(3)}  ${r.city.padEnd(8)}  ${(r.wr * 100).toFixed(1)}%`);
        }
    }
    console.log();
}

main();
