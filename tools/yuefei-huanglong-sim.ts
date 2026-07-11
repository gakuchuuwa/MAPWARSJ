/**
 * 岳飞北伐黄龙路线模拟
 *
 * 用途：
 *   验证「岳飞率背嵬军：郾城 → … → 黄龙府」圆梦脚本（v2 忠义归顺），
 *   按路网逐城攻城（约 22 场），2 万起兵 + 战间徐徐补员，看能否直捣黄龙。
 *
 * 运行：
 *   npx tsx --import ./tools/sim-preload.mjs tools/yuefei-huanglong-sim.ts --trials 500 --sample 0
 *   附加：--zhongyi-target N --zhongyi-jitter J --no-zhongyi --defenders max|random
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

type DefenderMode = 'listed' | 'max' | 'random' | 'initial';
type RouteMode = 'full' | 'waypoints';
type RefillMode = 'always' | 'hard';

/** 城型初始驻军（与 src/config/CityConfig.ts CITY_CONFIG.initialTroops 同步）——反映脚本早期实机守军 */
const CITY_INITIAL_GARRISON: Record<string, number> = {
    big_city: 10000, medium_city: 5000, small_city: 5000, pass: 10000,
};

/** 忠义归顺「硬仗才补」判定：非小城即硬据点；宁远城为小城强将（袁崇焕），单独并入 */
const EXTRA_HARD_CITY_IDS = new Set<string>(['city_ningyuan']);
function isHardTarget(city: CityDataV2): boolean {
    return city.type !== 'small_city' || EXTRA_HARD_CITY_IDS.has(city.id);
}

/** 必打路标：开封 → 北京 → 黄龙府（主人 2026-07-11 定） */
const WAYPOINT_CITY_IDS = [
    'city_bianliang',
    'city_beijing',
    'city_fuyu',
] as const;

const START_CITY_ID = 'city_yancheng2';
const YUEFEI_FACTION_ID = 'yanchuan_d';
const YUEFEI_GENERAL_ID = 'yanchuan_d_yuefei';
const BEIWEI_ELITE_TIER = 0;

/**
 * 忠义归顺 v2（圆梦脚本专属事件，与 src/app/YuefeiExpedition.ts 保持同步）：
 * 开局一律 2 万（不再强推十万），行军途中河朔忠义徐徐来投，
 * 战间回填至目标值 → 每场攻城都是势均力敌（略有优势/略有劣势）。
 * 本工具将「战间徐徐补员」近似为每胜后回填至 [target-jitter, target]
 * 的随机值（实机行军长短不一，到站兵力天然浮动）。
 * CLI：--zhongyi-target N 调回填上限；--zhongyi-jitter J 调浮动幅度；--no-zhongyi 关闭。
 * 调参定稿（2026-07-11，500 局）：31750/3000 → 单次直捣黄龙 67.4%，两次至少一成 89.4%；
 * 宁远城（袁崇焕）为天然最终 Boss（过关率 ~73%），黄龙府决战 ~94%。
 */
const ZHONGYI_REFILL_TARGET_DEFAULT = 31750;
const ZHONGYI_REFILL_JITTER_DEFAULT = 3000;

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
    if (mode === 'initial') return CITY_INITIAL_GARRISON[city.type] ?? 5000;
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
    cityType: string;
    defenderName: string;
    startTroops: number;
    defenderTroops: number;
    terrain: Terrain;
    won: boolean;
    survivorsAfterBattle: number;
    survivorsAfterSustain: number;
    /** 忠义归顺补兵（克大站后，0 = 本站无事件） */
    zhongyiBonus: number;
}

function runOne(
    routeIds: readonly string[],
    defenderMode: DefenderMode,
    terrainMode: string,
    initialTroops: number,
    /** 忠义归顺战间回填上限（0 = 关闭） */
    zhongyiRefillTarget: number,
    /** 回填浮动：实际回填到 [target-jitter, target] 的随机值 */
    zhongyiRefillJitter: number,
    /** always=每场补；hard=只在下一站硬据点（非小城 / 宁远）前补 */
    refillMode: RefillMode,
): StepLog[] {
    let troops = initialTroops;
    const startCity = cityById(START_CITY_ID);
    const cap = getArmyMaxTroops(cityRegion(startCity));
    const refillMax = Math.min(cap, zhongyiRefillTarget);
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
        // 忠义归顺 v2：战后为「下一战」回填；hard 模式只在下一站硬据点前补，小城不补
        let zhongyiBonus = 0;
        let afterZhongyi = sustained;
        const nextTarget = i + 1 < routeIds.length ? cityById(routeIds[i + 1]) : null;
        const doRefill = refillMode === 'always' || (nextTarget != null && isHardTarget(nextTarget));
        if (result.attackerWon && refillMax > 0 && doRefill) {
            const refillTo = refillMax - Math.floor(Math.random() * (zhongyiRefillJitter + 1));
            if (sustained < refillTo) {
                afterZhongyi = refillTo;
                zhongyiBonus = afterZhongyi - sustained;
            }
        }
        logs.push({
            cityName: target.name,
            cityType: target.type,
            defenderName: defender.name ?? `${target.name}守军`,
            startTroops,
            defenderTroops: defender.troops,
            terrain,
            won: result.attackerWon,
            survivorsAfterBattle: result.attSurvivors,
            survivorsAfterSustain: afterZhongyi,
            zhongyiBonus,
        });
        if (!result.attackerWon) break;
        troops = afterZhongyi;
    }

    return logs;
}

function formatPct(n: number): string {
    return `${(n * 100).toFixed(1)}%`;
}

function main(): void {
    const trials = Math.max(1, Math.floor(argNum('--trials', 100)));
    const initialTroops = Math.max(1000, Math.floor(argNum('--troops', 20000)));
    const defenderMode = argStr<DefenderMode>('--defenders', 'listed');
    const routeMode = argStr<RouteMode>('--route', 'full');
    const terrainMode = argStr('--terrain', 'plain');
    const sample = argNum('--sample', 1) > 0;

    // 忠义归顺 v2：--no-zhongyi 关闭；--zhongyi-target N 回填上限；--zhongyi-jitter J 浮动
    const zhongyiOff = process.argv.includes('--no-zhongyi');
    const zhongyiRefillTarget = zhongyiOff
        ? 0
        : Math.max(0, Math.floor(argNum('--zhongyi-target', ZHONGYI_REFILL_TARGET_DEFAULT)));
    const zhongyiRefillJitter = Math.max(0, Math.floor(argNum('--zhongyi-jitter', ZHONGYI_REFILL_JITTER_DEFAULT)));
    const refillMode = argStr<RefillMode>('--refill-mode', 'always');

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
        const logs = runOne(routeIds, defenderMode, terrainMode, initialTroops, zhongyiRefillTarget, zhongyiRefillJitter, refillMode);
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
    if (zhongyiRefillTarget > 0) {
        const modeDesc = refillMode === 'hard' ? '仅硬据点前补（小城不补）' : '每场战后补';
        console.log(
            `忠义归顺：回填 ${(zhongyiRefillTarget - zhongyiRefillJitter).toLocaleString()}~${zhongyiRefillTarget.toLocaleString()}，${modeDesc}`,
        );
    } else {
        console.log('忠义归顺：关闭');
    }
    const fullSuccess = capturedCounts[routeIds.length] ?? 0;
    console.log(`直捣黄龙成功率：${formatPct(fullSuccess / trials)}（两次至少一成：${formatPct(1 - (1 - fullSuccess / trials) ** 2)}）`);
    console.log('');

    const TYPE_LABEL: Record<string, string> = {
        big_city: '大城', medium_city: '中城', small_city: '小城', pass: '关隘',
    };
    console.log('逐站通过率（类型 | 守军 | 抵达后胜率 | 胜后均兵）：');
    for (let i = 0; i < routeIds.length; i++) {
        const city = cityById(routeIds[i]);
        const reachRate = reached[i] / trials;
        const captureRate = captured[i] / trials;
        const conditionalRate = reached[i] > 0 ? captured[i] / reached[i] : 0;
        const avgSurvivors = captured[i] > 0 ? Math.round(survivorSums[i] / captured[i]) : 0;
        const typeLabel = TYPE_LABEL[city.type] ?? city.type;
        const garrison = defenderTroops(city, defenderMode);
        console.log(
            `${String(i + 1).padStart(2)}. ${city.name}（${typeLabel}）: 守军 ${garrison.toLocaleString()}，` +
            `抵达 ${formatPct(reachRate)}，攻克 ${formatPct(captureRate)}，` +
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
                `地形=${log.terrain ?? 'none'} | 战后=${log.survivorsAfterBattle.toLocaleString()} | 续航后=${log.survivorsAfterSustain.toLocaleString()}` +
                (log.zhongyiBonus > 0 ? `（含忠义+${log.zhongyiBonus.toLocaleString()}）` : ''),
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
