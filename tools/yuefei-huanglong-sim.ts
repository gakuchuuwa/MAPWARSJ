/**
 * 岳飞北伐黄龙路线模拟
 *
 * 用途：
 *   验证「岳飞率背嵬军：郾城 → … → 黄龙府」圆梦脚本，
 *   按路网逐城攻城（默认 22 场），守军 1000～满编随机，看 10 万兵能打到哪里。
 *
 * 运行：
 *   npm run sim:yuefei
 *   npm run sim:yuefei -- --trials 50
 *   npm run sim:yuefei -- --defenders max --route waypoints   # 旧 4 城满编
 */
import { GameConfig } from '../src/config/GameConfig';
import { simulateOnce, type Terrain, type UnitSpec } from './combat-model';
import { applyStrategicSustainAfterVictory } from './sim-strategic-sustain';
import { getArmyMaxTroops, getCityMaxTroops } from './sim-troop-caps';
import { FACTION_GENERALS } from '../src/data/FactionGenerals';
import { GENERAL_PROFILES } from '../src/data/GeneralSkills';
import { CITIES_V2, type CityDataV2 } from '../src/data/cities_v2';
import { getCityAnchorFactionId, getCityEliteConfig } from '../src/data/ExpeditionLegions';
import { roadRegistry } from '../src/roads/RoadRegistry';
import { isRegionCenter, type RegionType } from '../src/systems/RegionSystem';

type DefenderMode = 'listed' | 'max' | 'random';
type RouteMode = 'full' | 'waypoints';

const WAYPOINT_CITY_IDS = [
    'city_bianliang',
    'city_beijing',
    'city_shenyang',
    'city_fuyu',
] as const;

const START_CITY_ID = 'city_yancheng2';
const YUEFEI_FACTION_ID = 'yanchuan_d';
const YUEFEI_GENERAL_ID = 'yanchuan_d_yuefei';
const BEIWEI_ELITE_TIER = 0;

function argNum(flag: string, fallback: number): number {
    const i = process.argv.indexOf(flag);
    if (i < 0) return fallback;
    const parsed = Number(process.argv[i + 1]);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function argStr<T extends string>(flag: string, fallback: T): T {
    const i = process.argv.indexOf(flag);
    return (i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback) as T;
}

function cityById(cityId: string): CityDataV2 {
    const city = CITIES_V2.find((c) => c.id === cityId);
    if (!city) throw new Error(`找不到据点：${cityId}`);
    return city;
}

function cityRegion(city: CityDataV2): RegionType {
    return (city.region ?? 'CENTRAL') as RegionType;
}

function buildYuefeiUnit(troops: number, firstSortie: boolean): UnitSpec {
    const startCity = cityById(START_CITY_ID);
    return {
        name: '岳飞·背嵬军',
        troops,
        maxTroops: getArmyMaxTroops(cityRegion(startCity)),
        region: cityRegion(startCity),
        role: 'field',
        eliteTier: BEIWEI_ELITE_TIER,
        general: YUEFEI_GENERAL_ID,
        isFirstSortieSinceDepart: firstSortie,
    };
}

function randomGarrison(city: CityDataV2): number {
    const min = GameConfig.CITY.MIN_GARRISON;
    const max = getCityMaxTroops(city.type, cityRegion(city));
    if (max <= min) return max;
    return min + Math.floor(Math.random() * (max - min + 1));
}

function defenderTroops(city: CityDataV2, mode: DefenderMode): number {
    if (mode === 'max') return getCityMaxTroops(city.type, cityRegion(city));
    if (mode === 'random') return randomGarrison(city);
    return Math.min(city.troops ?? 20000, getCityMaxTroops(city.type, cityRegion(city)));
}

/** 路网逐城：郾城 → 四阶段目标，收集须攻城列表 */
function buildFullRouteCityIds(): string[] {
    roadRegistry.initialize(CITIES_V2);
    const factionOf = new Map<string, string>();
    for (const c of CITIES_V2) factionOf.set(c.id, c.factionId);
    factionOf.set(START_CITY_ID, YUEFEI_FACTION_ID);

    const battle: string[] = [];
    let currentId = START_CITY_ID;
    for (const waypointId of WAYPOINT_CITY_IDS) {
        let guard = 0;
        while (currentId !== waypointId && guard++ < 200) {
            const hopId = roadRegistry.resolveFirstHostileCityOnPath(
                YUEFEI_FACTION_ID,
                currentId,
                waypointId,
                (id) => factionOf.get(id),
            );
            battle.push(hopId);
            factionOf.set(hopId, YUEFEI_FACTION_ID);
            currentId = hopId;
        }
    }
    return battle;
}

function buildDefenderUnit(city: CityDataV2, mode: DefenderMode): UnitSpec {
    const anchorFactionId = getCityAnchorFactionId(city.id) ?? city.factionId;
    const general = anchorFactionId ? FACTION_GENERALS[anchorFactionId] : null;
    const profileId = general?.generalId && GENERAL_PROFILES[general.generalId]
        ? general.generalId
        : null;
    const elite = getCityEliteConfig(city.id);
    return {
        name: `${city.name}守军${general ? `·${general.generalName}` : ''}`,
        troops: defenderTroops(city, mode),
        maxTroops: getCityMaxTroops(city.type, cityRegion(city)),
        region: cityRegion(city),
        role: 'garrison',
        pass: city.type === 'pass',
        regionCenter: isRegionCenter(city.id),
        eliteTier: elite?.tier ?? null,
        general: profileId,
    };
}

function pickTerrain(mode: string): Terrain {
    if (mode === 'random') {
        const r = Math.random();
        if (r < 0.70) return 'plain';
        if (r < 0.95) return 'mountain';
        return 'sea';
    }
    if (mode === 'mountain' || mode === 'sea' || mode === 'plain') return mode;
    return 'plain';
}

interface StepLog {
    cityName: string;
    defenderName: string;
    startTroops: number;
    defenderTroops: number;
    terrain: Terrain;
    won: boolean;
    survivorsAfterBattle: number;
    survivorsAfterSustain: number;
}

function runOne(
    routeIds: readonly string[],
    defenderMode: DefenderMode,
    terrainMode: string,
    initialTroops: number,
): StepLog[] {
    let troops = initialTroops;
    const startCity = cityById(START_CITY_ID);
    const cap = getArmyMaxTroops(cityRegion(startCity));
    const logs: StepLog[] = [];

    for (let i = 0; i < routeIds.length; i++) {
        const target = cityById(routeIds[i]);
        const defender = buildDefenderUnit(target, defenderMode);
        const startTroops = Math.min(troops, cap);
        const terrain = pickTerrain(terrainMode);
        const result = simulateOnce(
            [buildYuefeiUnit(startTroops, i === 0)],
            [defender],
            terrain,
            true,
            'siege',
        );
        const sustained = result.attackerWon
            ? applyStrategicSustainAfterVictory(
                result.attSurvivors,
                cap,
                GENERAL_PROFILES[YUEFEI_GENERAL_ID]?.strategicSkillId,
                undefined,
                target.type,
            )
            : 0;
        logs.push({
            cityName: target.name,
            defenderName: defender.name ?? `${target.name}守军`,
            startTroops,
            defenderTroops: defender.troops,
            terrain,
            won: result.attackerWon,
            survivorsAfterBattle: result.attSurvivors,
            survivorsAfterSustain: sustained,
        });
        if (!result.attackerWon) break;
        troops = sustained;
    }

    return logs;
}

function formatPct(n: number): string {
    return `${(n * 100).toFixed(1)}%`;
}

function main(): void {
    const trials = Math.max(1, Math.floor(argNum('--trials', 100)));
    const initialTroops = Math.max(1000, Math.floor(argNum('--troops', 100000)));
    const defenderMode = argStr<DefenderMode>('--defenders', 'listed');
    const routeMode = argStr<RouteMode>('--route', 'full');
    const terrainMode = argStr('--terrain', 'plain');
    const sample = argNum('--sample', 1) > 0;

    const routeIds = routeMode === 'full'
        ? buildFullRouteCityIds()
        : [...WAYPOINT_CITY_IDS];

    const capturedCounts = new Array(routeIds.length + 1).fill(0);
    const reached = new Array(routeIds.length).fill(0);
    const captured = new Array(routeIds.length).fill(0);
    const survivorSums = new Array(routeIds.length).fill(0);
    const stopAt = new Array(routeIds.length + 1).fill(0);
    let firstSample: StepLog[] | null = null;

    for (let t = 0; t < trials; t++) {
        const logs = runOne(routeIds, defenderMode, terrainMode, initialTroops);
        if (!firstSample) firstSample = logs;
        const wonCount = logs.filter((l) => l.won).length;
        capturedCounts[wonCount]++;
        stopAt[wonCount]++;
        for (let i = 0; i < logs.length; i++) {
            reached[i]++;
            if (logs[i].won) {
                captured[i]++;
                survivorSums[i] += logs[i].survivorsAfterSustain;
            }
        }
    }

    console.log('岳飞北伐黄龙路线模拟');
    console.log(`路线：${routeMode === 'full' ? `路网逐城 ${routeIds.length} 场` : '四阶段目标 4 场'}（郾城 → … → 黄龙府）`);
    console.log(`参数：初始 ${initialTroops.toLocaleString()} 兵，防守=${defenderMode}，地形=${terrainMode}，试跑=${trials}`);
    console.log('');

    console.log('逐站通过率：');
    for (let i = 0; i < routeIds.length; i++) {
        const city = cityById(routeIds[i]);
        const reachRate = reached[i] / trials;
        const captureRate = captured[i] / trials;
        const conditionalRate = reached[i] > 0 ? captured[i] / reached[i] : 0;
        const avgSurvivors = captured[i] > 0 ? Math.round(survivorSums[i] / captured[i]) : 0;
        console.log(
            `${String(i + 1).padStart(2)}. ${city.name}: 抵达 ${formatPct(reachRate)}，攻克 ${formatPct(captureRate)}，` +
            `抵达后胜率 ${formatPct(conditionalRate)}，胜后均兵 ${avgSurvivors.toLocaleString()}`,
        );
    }

    console.log('');
    console.log('最终进度分布：');
    for (let i = 0; i < stopAt.length; i++) {
        const label = i === routeIds.length
            ? '全线打通（含黄龙府）'
            : i === 0
                ? `第 1 战即败（${cityById(routeIds[0]).name}）`
                : `连克 ${i} 城后止步（下一战 ${cityById(routeIds[i]).name}）`;
        if (stopAt[i] > 0) {
            console.log(`- ${label}: ${stopAt[i]} / ${trials} (${formatPct(stopAt[i] / trials)})`);
        }
    }

    if (sample && firstSample) {
        console.log('');
        console.log('样本战报（第 1 次试跑）：');
        for (const [idx, log] of firstSample.entries()) {
            console.log(
                `${String(idx + 1).padStart(2)}. ${log.won ? '胜' : '败'} ${log.cityName} | ` +
                `岳飞 ${log.startTroops.toLocaleString()} vs ${log.defenderName} ${log.defenderTroops.toLocaleString()} | ` +
                `地形=${log.terrain ?? 'none'} | 战后=${log.survivorsAfterBattle.toLocaleString()} | 续航后=${log.survivorsAfterSustain.toLocaleString()}`,
            );
        }
        const won = firstSample.filter((l) => l.won).length;
        const stopCity = won < routeIds.length ? routeIds[won] : null;
        console.log('');
        if (won >= routeIds.length) {
            console.log('样本结论：全线打通，直捣黄龙功成 🎉');
        } else {
            console.log(`样本结论：连克 ${won} 城，止步于 ${cityById(stopCity!).name}（第 ${won + 1} 战）`);
        }
    }
}

main();
