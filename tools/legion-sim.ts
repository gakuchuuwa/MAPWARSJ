/**
 * MAPWAR 批量战力排名
 * 所有名将等兵力互相对战，按胜率排名，验证历史方向。
 * 
 * 用法: npx tsx tools/legion-sim.ts --rank --trials 1000
 */
import * as fs from 'fs';
import * as path from 'path';
import {
    resolveGeneralTacticalEntry,
} from '../src/combat/TacticalSkillResolver';
import {
    STRATEGIC_SKILL_CATALOG,
    getTacticalSkillDef,
} from '../src/data/GeneralSkills';
import { getRegion } from '../src/systems/RegionSystem';
import { GameConfig } from '../src/config/GameConfig';

const LUCK_MIN = GameConfig.COMBAT.LUCK_MIN;
const LUCK_MAX = GameConfig.COMBAT.LUCK_MAX;
const ELITE_MULT = GameConfig.COMBAT.ELITE_TIER_MULT;
const PASS_MULT = GameConfig.CULTURE_COMBAT.PASS_GARRISON_MULT;
const TIER_TABLE = GameConfig.CULTURE_COMBAT.TIER_TABLE;

const ROSTER_PATH = path.resolve(process.env.USERPROFILE || '~', 'Downloads/MAPWAR名册_2026-07-11.md');

// ── 名册解析 ──
interface GenEntry {
    faction: string; city: string; lat: number; lng: number; flag: string;
    generalName: string; tier: string;
    tacticalName: string; strategicName: string;
    eliteName: string; eliteTier: string;
}

function parseRoster(fp: string): GenEntry[] {
    const text = fs.readFileSync(fp, 'utf-8');
    const entries: GenEntry[] = [];
    for (const line of text.split('\n')) {
        if (!line.startsWith('|') || line.includes('---|---')) continue;
        if (line.includes('叛军 | —') || line.includes('势力 | 据点')) continue;
        const cols = line.split('|').map(c => c.trim()).filter(c => c);
        if (cols.length < 11) continue;
        const [latS, lngS] = (cols[2] || ', ').split(',').map(s => s.trim());
        entries.push({
            faction: cols[0], city: cols[1],
            lat: parseFloat(latS) || 0, lng: parseFloat(lngS) || 0,
            flag: cols[3], generalName: cols[4], tier: cols[5],
            tacticalName: cols[6], strategicName: cols[7],
            eliteName: cols[8], eliteTier: cols[9],
        });
    }
    return entries;
}

// ── 技能 ──
const CIRCLE_MAP: Record<string, string> = {
    '①':'01','②':'02','③':'03','④':'04','⑤':'05',
    '⑥':'06','⑦':'07','⑧':'08','⑨':'09','⑩':'10',
    '⑪':'11','⑫':'12','⑬':'13','⑭':'14','⑮':'15',
    '⑯':'16','⑰':'17','⑱':'18','⑲':'19','⑳':'20',
};

function parseTacticalId(name: string): string | null {
    const m = name.match(/^(\d+)\s/);
    if (m) return `ts_${m[1].padStart(3, '0')}`;
    const cm = name.match(/^([①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳])/);
    if (cm) return `tac_${CIRCLE_MAP[cm[0][0]] || '01'}`;
    return null;
}

function parseStrategicId(name: string): string | null {
    const m = name.match(/S([①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮])\s/);
    if (!m) return null;
    const map: Record<string, string> = {
        '①':'01','②':'02','③':'03','④':'04','⑤':'05',
        '⑥':'06','⑦':'07','⑧':'08','⑨':'09','⑩':'10',
        '⑪':'11','⑫':'12','⑬':'13','⑭':'14','⑮':'15',
    };
    return `str_${map[m[1]] || '01'}`;
}

const COMBAT_STRATEGIC_EFFECTS = new Set([
    'attacker_power_mult', 'garrison_defense_mult', 'disadvantage_power_mult',
    'advantage_skill_effect_mult', 'terrain_tactical_double',
]);

// ── 预计算 ──
interface UnitPrecalc {
    name: string; tier: string;
    cultureField: number; cultureGarrison: number;
    eliteMult: number;
    stratEffect: string | null; stratMagnitude: number;
    tacEffect: string | null; tacMagnitude: number;
    region: string;
}

function precalc(g: GenEntry): UnitPrecalc {
    const region = getRegion(g.lat, g.lng);
    const cult = TIER_TABLE[region] ?? [1, 1];
    const elite = ELITE_MULT[parseInt(g.eliteTier.replace('T', ''))] ?? 1;
    
    // Strategic
    const stratId = parseStrategicId(g.strategicName);
    const stratDef = stratId ? STRATEGIC_SKILL_CATALOG[stratId] : null;
    
    // Tactical
    let tacEffect: string | null = null;
    let tacMagnitude = 1;
    const tacId = parseTacticalId(g.tacticalName);
    if (tacId) {
        const entry = resolveGeneralTacticalEntry(tacId);
        if (entry) {
            tacEffect = entry.baseEffect;
            tacMagnitude = (entry as any).magnitude ?? 1;
        } else {
            const def = getTacticalSkillDef(tacId);
            if (def) { tacEffect = def.effect; tacMagnitude = def.magnitude; }
        }
    }
    
    return {
        name: g.generalName, tier: g.tier,
        cultureField: cult[0], cultureGarrison: cult[1],
        eliteMult: elite,
        stratEffect: stratDef?.effect ?? null,
        stratMagnitude: stratDef?.magnitude ?? 1,
        tacEffect, tacMagnitude,
        region,
    };
}

// ── 单场模拟 ──
function simulateOne(att: UnitPrecalc, def: UnitPrecalc, attTroops: number, defTroops: number,
    isSiege: boolean, isPass: boolean): boolean {
    
    const defPassMult = isPass ? PASS_MULT : 1;
    
    // Base power
    let attPow = attTroops * att.cultureField * att.eliteMult;
    let defPow = defTroops * def.cultureGarrison * def.eliteMult * defPassMult;
    
    // Tactical skill
    const applyTac = (pow: number, tacEff: string | null, mag: number): number => {
        if (!tacEff) return pow;
        switch (tacEff) {
            case 'ally_mult_1_2': case 'ally_power_mult': 
                return pow * mag;  // 己方增益
            case 'enemy_mult_0_8':
                return pow / mag;  // 敌方减益 → 己方等效增益
            case 'enemy_sub_troops_opening':
                return pow / mag;  // 削敌兵 → 己方等效增益
            default:
                return mag >= 1 ? pow * mag : pow / mag;  // 安全兜底
        }
    };
    const attTacMult = att.tacEffect ? applyTac(1, att.tacEffect, att.tacMagnitude) : 1;
    const defTacMult = def.tacEffect ? applyTac(1, def.tacEffect, def.tacMagnitude) : 1;
    attPow *= attTacMult;
    defPow *= defTacMult;
    
    // Strategic power
    if (att.stratEffect === 'attacker_power_mult') attPow *= att.stratMagnitude;
    if (def.stratEffect === 'garrison_defense_mult' && isSiege) defPow *= def.stratMagnitude;
    
    const attRatio = attPow / Math.max(1, defPow);
    const defRatio = defPow / Math.max(1, attPow);
    if (att.stratEffect === 'disadvantage_power_mult' && attRatio < 0.67) attPow *= att.stratMagnitude;
    if (def.stratEffect === 'disadvantage_power_mult' && defRatio < 0.67) defPow *= def.stratMagnitude;
    
    // Advantage skill effect
    if (att.stratEffect === 'advantage_skill_effect_mult' && att.tacEffect && attRatio > 1.5)
        attPow *= att.stratMagnitude;
    if (def.stratEffect === 'advantage_skill_effect_mult' && def.tacEffect && defRatio > 1.5)
        defPow *= def.stratMagnitude;
    
    // Luck
    attPow *= LUCK_MIN + Math.random() * (LUCK_MAX - LUCK_MIN);
    defPow *= LUCK_MIN + Math.random() * (LUCK_MAX - LUCK_MIN);
    
    return attPow >= defPow;
}

// ── 主函数 ──
function main() {
    const args = process.argv.slice(2);
    const trials = (() => {
        const i = args.indexOf('--trials');
        return i >= 0 ? parseInt(args[i + 1]) || 500 : 500;
    })();
    
    console.log(`\n加载名册...`);
    const entries = parseRoster(ROSTER_PATH);
    const famous = entries.filter(e => e.tier === '名将');
    console.log(`名将 ${famous.length} 人，每人对战 ${trials} 次\n`);
    
    // Precalc all
    console.log(`预计算技能...`);
    const units = famous.map(precalc);
    
    // Pick 50 random opponents for each general
    const OPPONENTS = 40;
    const DEF_TROOPS = 50000;
    const ATT_TROOPS = 50000;
    
    console.log(`每将随机抽取 ${OPPONENTS} 个对手，等兵力 ${(ATT_TROOPS/10000).toFixed(0)}万 vs ${(DEF_TROOPS/10000).toFixed(0)}万`);
    console.log(`随机地形/关隘...\n`);
    
    interface Result { name: string; wins: number; total: number; wr: number; idx: number; }
    const results: Result[] = [];
    
    const totalSims = units.length * OPPONENTS * trials;
    let completed = 0;
    const startTime = Date.now();
    
    for (let ai = 0; ai < units.length; ai++) {
        const att = units[ai];
        let wins = 0;
        let total = 0;
        
        for (let o = 0; o < OPPONENTS; o++) {
            const di = Math.floor(Math.random() * units.length);
            if (di === ai) continue; // Skip self
            const def = units[di];
            
            const isPass = Math.random() < 0.25; // 25% chance pass
            const terrainRoll = Math.random();
            const isSiege = terrainRoll < 0.6; // 60% siege
            
            for (let t = 0; t < trials; t++) {
                if (simulateOne(att, def, ATT_TROOPS, DEF_TROOPS, isSiege, isPass)) wins++;
                total++;
            }
            completed += trials;
        }
        
        results.push({ name: att.name, wins, total, wr: wins/total, idx: ai });
        
        // Progress
        if ((ai + 1) % 20 === 0 || ai === units.length - 1) {
            const elapsed = (Date.now() - startTime) / 1000;
            const pct = (completed / totalSims * 100).toFixed(0);
            console.log(`  进度 ${ai+1}/${units.length} (${pct}%)  ${elapsed.toFixed(0)}s`);
        }
    }
    
    const elapsed = (Date.now() - startTime) / 1000;
    console.log(`\n完成 ${totalSims.toLocaleString()} 场模拟，耗时 ${elapsed.toFixed(1)}s\n`);
    
    // Sort by win rate
    results.sort((a, b) => b.wr - a.wr);
    
    // Print top 50
    const bar = '═'.repeat(60);
    console.log(`${bar}`);
    console.log(`  🏆  MAPWAR 名将战力排名 TOP 50  (等兵力 ${(ATT_TROOPS/10000).toFixed(0)}万)`);
    console.log(`${bar}\n`);
    console.log(`  排名  武将      胜率      场次   `);
    console.log(`  ────────────────────────────────`);
    
    for (let i = 0; i < Math.min(50, results.length); i++) {
        const r = results[i];
        const crown = i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
        const bar = '█'.repeat(Math.round(r.wr * 20));
        console.log(`  ${crown} ${(i+1).toString().padStart(3)}  ${r.name.padEnd(8)}  ${(r.wr*100).toFixed(1).padStart(5)}%  ${bar}`);
    }
    
    // Check historical expectation
    console.log(`\n${bar}`);
    console.log(`  📜 历史预期验证`);
    console.log(`${bar}\n`);
    
    const expected = ['成吉思汗', '岳飞', '白起', '卫青', '霍去病', '刘裕', '李靖', '李世民', '项羽', '曹操'];
    console.log(`  武将      排名    胜率      判定`);
    console.log(`  ──────────────────────────────`);
    for (const name of expected) {
        const idx = results.findIndex(r => r.name === name);
        if (idx >= 0) {
            const r = results[idx];
            const verdict = idx < Math.floor(results.length * 0.1) ? '✅顶级' :
                           idx < Math.floor(results.length * 0.25) ? '✅善战' :
                           idx < Math.floor(results.length * 0.5) ? '⚠️中等' : '❌偏低';
            console.log(`  ${name.padEnd(8)}  #${(idx+1).toString().padStart(3)}    ${(r.wr*100).toFixed(1).padStart(5)}%   ${verdict}`);
        } else {
            console.log(`  ${name.padEnd(8)}  —       —     未找到`);
        }
    }
    
    // Bottom 10
    console.log(`\n${bar}`);
    console.log(`  📉  排名末尾 10`);
    console.log(`${bar}\n`);
    for (let i = results.length - 10; i < results.length; i++) {
        const r = results[i];
        console.log(`  ${(i+1).toString().padStart(3)}  ${r.name.padEnd(8)}  ${(r.wr*100).toFixed(1).padStart(5)}%`);
    }
    
    console.log();
}

main();
