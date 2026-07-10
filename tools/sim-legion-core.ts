/**
 * 连续攻城模拟共用核心（legion-campaign / balance-cohort-audit）
 */
import * as fs from 'fs';
import { simulateOnce, type UnitSpec, type Terrain } from './combat-model';
import { getRegion } from '../src/systems/RegionSystem';
import { GameConfig } from '../src/config/GameConfig';
import { T0_CAPITALS, T1_MEDIUM_CITIES, T2_STRATEGIC, PERIPHERY } from '../src/data/cities_v2';
import { buildSimCityMetaByName } from './sim-city-meta';
import { getCityMaxTroops, getArmyMaxTroops } from './sim-troop-caps';
import { applyStrategicSustainAfterVictory } from './sim-strategic-sustain';
import type { CityType } from '../src/types/core';
import { resolveAptitudeByGeneralName, parseRosterEliteTier, resolveCombatSkillIds, resolveCombatSkillLabels } from './sim-general-lookup';

export const SIM_CITY_META = buildSimCityMetaByName(20000);

export interface RosterEntry {
    faction: string;
    city: string;
    lat: number;
    lng: number;
    generalName: string;
    tier: string;
    tacticalName: string;
    strategicName: string;
    eliteName: string;
    eliteTier: string;
}

export interface LegionData {
    name: string;
    city: string;
    tier: string;
    region: string;
    cultureField: number;
    cultureGarrison: number;
    eliteTier: number | null;
    tacticalSkillId: string | null;
    strategicSkillId: string | null;
    isPass: boolean;
    isRegionCenter: boolean;
    eliteName: string;
    aptitude: 'create' | 'leverage' | 'reverse';
    tacticalName: string;
    strategicName: string;
}

export interface BattleLog {
    city: string;
    type: string;
    defender: string;
    defElite: string;
    defTier: string;
    defTroops: number;
    defEliteTier: number | null;
    defFamous: boolean;
    defPass: boolean;
    defCenter: boolean;
    defRegion: string;
    won: boolean;
    survivors: number;
    attStartTroops: number;
    terrain: string;
}

export interface CampaignOptions {
    legionTroops: number;
    maxBattles: number;
}

export function parseRoster(fp: string): RosterEntry[] {
    const out: RosterEntry[] = [];
    for (const l of fs.readFileSync(fp, 'utf-8').split('\n')) {
        if (!l.startsWith('|') || l.includes('---|---')) continue;
        if (l.includes('叛军 | —') || l.includes('势力 | 据点')) continue;
        const c = l.split('|').map(x => x.trim()).filter(Boolean);
        if (c.length < 11) continue;
        const [ls, gs] = (c[2] || ', ').split(',').map(s => s.trim());
        out.push({
            faction: c[0], city: c[1],
            lat: parseFloat(ls) || 0, lng: parseFloat(gs) || 0,
            generalName: c[4], tier: c[5],
            tacticalName: c[6], strategicName: c[7],
            eliteName: c[8], eliteTier: c[9],
        });
    }
    return out;
}

export const CITY_TABLE: Record<string, { type: string; troops: number; tier: number }> = {};
for (const c of [...T0_CAPITALS, ...T1_MEDIUM_CITIES, ...T2_STRATEGIC, ...PERIPHERY]) {
    CITY_TABLE[c.name] = {
        type: c.type || 'small_city',
        troops: c.troops ?? 20000,
        tier: c.tier ?? 4,
    };
}

export const TYPE_LABEL: Record<string, string> = {
    big_city: '都城', medium_city: '中城', small_city: '小城', pass: '关隘',
};

export const T0_CITY_NAMES = new Set(T0_CAPITALS.map(c => c.name));

const TERRAINS: { t: Terrain; w: number }[] = [
    { t: 'plain', w: 0.50 },
    { t: 'mountain', w: 0.40 },
    { t: 'sea', w: 0.10 },
];

export function randomTerrain(): Terrain {
    const r = Math.random();
    let acc = 0;
    for (const x of TERRAINS) { acc += x.w; if (r < acc) return x.t; }
    return 'plain';
}

export function randomGarrisonTroops(cityType: CityType, region: string): number {
    const hi = getCityMaxTroops(cityType, region);
    const lo = Math.min(1000, hi);
    return lo + Math.floor(Math.random() * (hi - lo + 1));
}

export function buildLegion(e: RosterEntry): LegionData {
    const region = getRegion(e.lat, e.lng);
    const cult = GameConfig.CULTURE_COMBAT.TIER_TABLE[region] ?? [1, 1];
    const meta = SIM_CITY_META[e.city];
    const skills = resolveCombatSkillIds(e.generalName, e.tier, e.tacticalName, e.strategicName);
    const labels = resolveCombatSkillLabels(e.generalName, e.tier, e.tacticalName, e.strategicName);
    return {
        name: e.generalName,
        city: e.city,
        tier: e.tier,
        region,
        cultureField: cult[0],
        cultureGarrison: cult[1],
        eliteTier: parseRosterEliteTier(e.eliteTier),
        tacticalSkillId: skills.tacticalSkillId,
        strategicSkillId: skills.strategicSkillId,
        isPass: meta?.isPass ?? false,
        isRegionCenter: meta?.isRegionCenter ?? false,
        eliteName: e.eliteName,
        aptitude: resolveAptitudeByGeneralName(e.generalName),
        tacticalName: labels.tacticalName,
        strategicName: labels.strategicName,
    };
}

export function toUnitSpec(legion: LegionData, troops: number, role: 'field' | 'garrison', isFirstSortieSinceDepart = false): UnitSpec {
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

export function runCampaign(
    attacker: LegionData,
    pool: LegionData[],
    opts: CampaignOptions,
): BattleLog[] {
    let troops = opts.legionTroops;
    const log: BattleLog[] = [];
    const attacked = new Set<string>();

    for (let b = 0; b < opts.maxBattles; b++) {
        if (troops < 2000) break;

        let def: LegionData;
        let tries = 0;
        do {
            def = pool[Math.floor(Math.random() * pool.length)];
            tries++;
        } while ((def.city === attacker.city || attacked.has(def.city)) && tries < 100);
        attacked.add(def.city);

        const cityType = (CITY_TABLE[def.city]?.type || 'small_city') as CityType;
        const defMeta = SIM_CITY_META[def.city];
        const defTroops = randomGarrisonTroops(cityType, def.region);
        const terrain = randomTerrain();
        const attStart = troops;
        const r = simulateOnce(
            [toUnitSpec(attacker, troops, 'field', b === 0)],
            [toUnitSpec(def, defTroops, 'garrison')],
            terrain,
            true,
            'siege',
        );

        log.push({
            city: def.city,
            type: TYPE_LABEL[cityType] || cityType,
            defender: def.name,
            defElite: def.eliteName,
            defTier: def.tier === '名将' ? '名' : '普',
            defTroops,
            defEliteTier: def.eliteTier,
            defFamous: def.tier === '名将',
            defPass: defMeta?.isPass ?? false,
            defCenter: defMeta?.isRegionCenter ?? false,
            defRegion: def.region,
            won: r.attackerWon,
            survivors: r.attSurvivors,
            attStartTroops: attStart,
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

export function cohortKey(l: LegionData): string {
    const et = l.eliteTier === null ? '无精' : `T${l.eliteTier}`;
    return `${l.tier === '名将' ? '名将' : '普将'}+${et}`;
}

export function matchesFilters(
    l: LegionData,
    generalTier?: string | null,
    eliteTierRaw?: string | null,
): boolean {
    if (generalTier && l.tier !== generalTier) return false;
    if (eliteTierRaw) {
        const want = parseRosterEliteTier(eliteTierRaw.startsWith('T') ? eliteTierRaw : `T${eliteTierRaw}`);
        if (want !== l.eliteTier) return false;
    }
    return true;
}
