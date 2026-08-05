/**
 * headless.ts — 批量推演 v0（无头模拟，平衡仪表盘）
 *
 * 目的（GAME_DIRECTION.md「2026-06-10 优化评审定案」）：
 *   让「战斗结果可信」可验证——批量跑 N 局，统计各文化/势力胜率、雪球速度、
 *   灭国节奏、复国次数，作为调系数（文化系数/关隘/运气/断粮）的依据。
 *
 * 复用真实代码（不复制公式，直接 import）：
 *   - 数据：cities_v2 / factions / StartingCapitals
 *   - 战斗数学：GameConfig（运气区间/时长/上限）、CultureCombat（文化系数）、CityConfig（驻军增长）
 *   - 区域：RegionSystem.getCityRegion、CultureFormations.isCultureCavalryOnly
 *   - 机制移植：RecruitmentSystem 出兵规则、RebellionSystem 复国规则、
 *     CombatSystem.Battle 结算闭式（胜负=有效战力比、败方全灭、胜方按战力比受损+30%伤兵恢复、保底10%）
 *
 * v0 已声明的简化（与真实游戏的差异，解读数据时注意）：
 *   1. 直线行军（真实游戏走史实道路网）——行军时间和碰撞频率有偏差
 *      ⚠️ 选目标已改为走真实路网（见下），但**移动**仍是直线：军团按道路挑目标、然后直线飞过去
 *   2. 地形系数取混合值（70% 平原 / 30% 山地），不逐段判定
 *   3. ~~「道路最近 3 城抽签」用直线距离近似~~ —— 2026-08-05 起直接调游戏的
 *      TargetEvaluator.pickTarget + resolveForwardAnchor（真实路网 Dijkstra、方向池、枪打出头鸟）
 *   4. 野战只做 1v1，不模拟开战圈援军编入
 *   5. 无跟拍军团 → 无御驾亲征补兵（主人定案：此时所有势力同质，统计无观察者偏差）
 *
 * 用法：
 *   npm run sim                            # 默认 30 局 × 300 年（基线规则）
 *   npx tsx scripts/sim/headless.ts --games 100 --years 300 --seed 42
 *   npx tsx scripts/sim/headless.ts --games 100 --tiers5            # 实验：五级文化攻防
 *   npx tsx scripts/sim/headless.ts --games 100 --supply            # 实验：断粮（家城补给）
 *   npx tsx scripts/sim/headless.ts --games 100 --tiers5 --supply   # 两者叠加
 *
 * 实验规则（主人 2026-06-11 提案，先在推演验证，数据好再进真游戏）：
 *   --tiers5  五级文化攻防（野战/守城系数对称递变）：
 *             高攻 草原/青藏/东北 1.2/0.8 · 低攻 西域/河西/北方 1.1/0.9
 *             中性 中原/中亚 1.0/1.0 · 低防 日本/朝鲜/南方 0.9/1.1 · 高防 岭南/滇缅/川蜀 0.8/1.2
 *   --supply  断粮 = 家城补给（只用兵力一个数据，补给就是补兵）：
 *             每城 1 军（现有规则），家城每季产出优先补自家军团至文化上限，余量进城防；
 *             家城失守 = 断粮 → 军团无补给且强制回师收复家城（无论基础/远征模式）；
 *             就地取粮豁免：高攻+低攻六区（草原/青藏/东北/西域/河西/北方）断粮后不强制回师（仍无补给）。
 *   --nohunt  关掉枪打出头鸟（`GameConfig.AI.LEADER_HUNT.ENABLED = false`），用于 A/B 对照。
 *             ⚠️ 旧的 --hunt / --huntth / --huntp 已删除：那三个旋钮驱动的是推演自带的
 *             一份概率版复制品，游戏现行规则是「方向池内有领头势力的城 → 必打，无门槛」，
 *             两者不是同一套，拿旧旋钮调出来的参数落不到游戏里。合击默认按游戏配置开启。
 *
 * 输出：控制台摘要 + scripts/sim/sim-report-<mode>.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CITIES_V2 } from '../../src/data/cities_v2';
import { FACTIONS } from '../../src/data/factions';
import { STARTING_CAPITALS } from '../../src/data/StartingCapitals';
import { GameConfig } from '../../src/config/GameConfig';
import { CITY_CONFIG, clampCityTroops } from '../../src/config/CityConfig';
import {
    getCityRegion,
    REGION_CENTERS,
    REGION_LABELS,
    REGION_ORDER,
    type RegionType,
} from '../../src/systems/RegionSystem';
import { getCultureCombatMultiplier } from '../../src/systems/CultureCombat';
import { isCultureCavalryOnly } from '../../src/types/CultureFormations';
import { roadRegistry } from '../../src/roads/RoadRegistry';
import { TargetEvaluator } from '../../src/ai/TargetEvaluator';
import { resolveForwardAnchor } from '../../src/ai/TargetAnchorResolver';
import type { City } from '../../src/types/core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================
// CLI
// ============================================================
function argNum(name: string, fallback: number): number {
    const i = process.argv.indexOf(`--${name}`);
    if (i >= 0 && process.argv[i + 1]) {
        const v = Number(process.argv[i + 1]);
        if (Number.isFinite(v)) return v;
    }
    return fallback;
}
function argFlag(name: string): boolean {
    return process.argv.includes(`--${name}`);
}
const GAMES = argNum('games', 30);
const MAX_YEARS = argNum('years', 300);
const SEED = argNum('seed', 20260611);
const TIERS5 = argFlag('tiers5');
// --supply 已废止（2026-06-12 主人裁定删除家城补给；强制回师为常开原生行为，战后恢复见 POST_BATTLE_RECOVERY）
const DYNASTY = argFlag('dynasty');

/**
 * [2026-08-05] 枪打出头鸟不再由推演自己实现，改为直接调用游戏的 TargetEvaluator.pickTarget。
 * 原来的 --hunt / --huntth / --huntp 三个旋钮已删除：那是推演自带的一份概率版复制品，
 * 与游戏现行规则（确定性、无门槛、只打方向池内的领头城）已经不是同一套东西，
 * 拿它调出来的参数落不到游戏里。现在推演跑的就是游戏代码，唯一开关是下面的 --nohunt（做 A/B 用）。
 */
const NOHUNT = argFlag('nohunt');
if (NOHUNT) GameConfig.AI.LEADER_HUNT.ENABLED = false;

const MODE = [
    TIERS5 ? 'tiers5' : null,
    NOHUNT ? 'nohunt' : null,
    DYNASTY ? 'dynasty' : null,
    argFlag('tianming') ? 'tianming' : null,
].filter(Boolean).join('+') || 'baseline';

// 路网建图一次（全局共用；道路与归属无关，不随局重置）。
// ⚠️ initialize 按 lat/lng 建图，City 类型用 latitude/longitude —— 两套都要给，
// 只给后者会建出空图，pickTarget 全返回 null（等于没有 AI）。
const CITY_VIEWS_BASE = CITIES_V2.map((c) => ({
    ...c,
    latitude: c.lat,
    longitude: c.lng,
    troops: c.troops ?? GameConfig.SIEGE.DEFAULT_CITY_TROOPS,
}));
roadRegistry.initialize(CITY_VIEWS_BASE as any);
if (!roadRegistry.isInitialized()) {
    throw new Error('[sim] 路网初始化失败，推演的目标选择会全部落空，中止');
}

/**
 * --dynasty 复国提频（主人 2026-06-12 简化终案：「简单点，容易出 BUG 的不要」）：
 * 复国从「每年固定 1 次」改为「按季结算」——
 *   年配额 = 1 + floor(最大势力城数 / DY_SCALE)，上限 4（= 每季最多 1 次，主人拍板的上限）
 *   按季均匀摊开（半年一次 / 一季一次），不集中爆发
 * 选城、兵力、灭国文化优先：全部沿用现行复国规则，不加任何新机制。
 * （曾议的"天高皇帝远/流民加成/天命出口"复杂方案已被主人否决删除。）
 */
const DY_SCALE = argNum('dyscale', 60);
const DY_CAP = 4; // 每年复国次数上限 = 每季 1 次
void DY_CAP;
/** --dynasty「从者云集」：帝国每 10 城给起义城追加的兵力（可调 --dyrecruit） */
const DY_RECRUIT = argNum('dyrecruit', 500);
/** --tianming 渐进式天命开关 */
const TIANMING = argFlag('tianming');
/** 15 文化中心城 id（REGION_CENTERS 是 region→城id数组，摊平去重） */
const ALL_CENTER_IDS = [...new Set(Object.values(REGION_CENTERS).flat())];

/** 五级文化攻防（--tiers5，主人 2026-06-11 提案） */
const TIER5_TABLE: Record<RegionType, { field: number; garrison: number }> = {
    // 高攻
    STEPPE: { field: 1.2, garrison: 0.8 },
    TIBET: { field: 1.2, garrison: 0.8 },
    NORTHEAST: { field: 1.2, garrison: 0.8 },
    // 低攻
    WESTERN: { field: 1.1, garrison: 0.9 },
    HEXI: { field: 1.1, garrison: 0.9 },
    NORTH: { field: 1.1, garrison: 0.9 },
    // 中性
    CENTRAL: { field: 1.0, garrison: 1.0 },
    CENTRAL_ASIA: { field: 1.0, garrison: 1.0 },
    // 低防
    JAPAN: { field: 0.9, garrison: 1.1 },
    KOREA: { field: 0.9, garrison: 1.1 },
    JIANGNAN: { field: 0.9, garrison: 1.1 },
    // 高防
    LINGNAN: { field: 0.8, garrison: 1.2 },
    DIANQIAN: { field: 0.8, garrison: 1.2 },
    BASHU: { field: 0.8, garrison: 1.2 },
};


// ============================================================
// 种子随机（mulberry32）——同 seed 结果可复现
// ============================================================
function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a |= 0; a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ============================================================
// 模型
// ============================================================
interface SimCity {
    id: string;
    name: string;
    faction: string;          // 当前归属
    initialFaction: string;   // 开局归属（复国用）
    initialTroops: number;
    lat: number;
    lng: number;
    type: keyof typeof CITY_CONFIG;
    troops: number;
    region: RegionType;
    isPass: boolean;
}

interface SimLegion {
    id: number;
    faction: string;
    troops: number;
    lat: number;
    lng: number;
    homeCityId: string;
    region: RegionType;       // 出身文化区（按出身定系数，与 LegionManager.resolveCultureRegion 同源）
    speed: number;            // 经纬度单位 / 游戏秒
    targetCityId: string | null;
    busyUntil: number;        // 战斗占用到（游戏秒）
    /** 个体生涯兵力峰值（远征门槛评估用） */
    peakTroops: number;
}

interface GameResult {
    winnerFaction: string;
    winnerCulture: RegionType;
    winnerCities: number;
    leaderCitiesAtYear: Record<number, number>;
    yearLeaderReached: Record<number, number | null>; // 30/60/100 城
    eliminatedByYear: Record<number, number>;
    fieldBattles: number;
    sieges: number;
    captures: number;
    rebellions: number;
    /** 王朝周期律民变次数（--dynasty 额外轮，含在 rebellions 外单独计） */
    dynastyUprisings: number;
    /** 天命止息的年数（--tianming，霸主握全部 15 文化中心的年份数） */
    tianmingYears: number;
    supplyCuts: number;       // 断粮事件（家城失守，军团被迫回师）
    homeRecaptures: number;   // 断粮军团成功收复家城
    survivingFactions: number;
    cultureCityShareAtEnd: Record<string, number>;
    /** 全局单军团兵力峰值（评估远征 5 万解锁门槛是否可达） */
    maxArmyPeak: number;
    /** 曾跨过 2/3/5 万的军团数（去重按军团个体计） */
    armiesOver20k: number;
    armiesOver30k: number;
    armiesOver50k: number;
}

const SEASON = GameConfig.TIME.SEASON_DURATION;   // 15 游戏秒
const YEAR = GameConfig.TIME.YEAR_DURATION;       // 60 游戏秒
const FIELD_CONTACT_R = 0.2;                      // 同 LegionFieldBattle.FIELD_BATTLE_CONTACT_RADIUS
const SIEGE_ARRIVE_R = GameConfig.SIEGE.COMBAT_RADIUS + 0.1;
const BASE_SPEED = 0.2;                           // 同 PLAYER_SPEED_TIERS.UNIFIED_MARCH_SPEED
// v0 简化 2：地形混合系数（70% 平原 / 30% 山地）
const PHALANX_TERRAIN = 0.7 * 1.5 + 0.3 * 1.0;    // ≈1.35
const CAVALRY_TERRAIN = 0.7 * 2.0 + 0.3 * 1.5;    // ≈1.85（CAVALRY_LAND.current）

function dist(aLat: number, aLng: number, bLat: number, bLng: number): number {
    const dLat = aLat - bLat;
    const dLng = aLng - bLng;
    return Math.sqrt(dLat * dLat + dLng * dLng);
}

// ============================================================
// 战斗结算闭式（同 CombatSystem.Battle：定胜负→败方全灭→胜方按战力比受损→分级战后恢复→保底10%）
// 战后恢复（2026-06-12 主人拍板，读 GameConfig.COMBAT.POST_BATTLE_RECOVERY 同一份表）：
//   攻城按目标城等级 关10%/小20%/中30%/大40%，野战 50%
// ============================================================
interface BattleOutcome {
    attackerWon: boolean;
    winnerRemaining: number;
    duration: number;
}
function resolveBattle(
    attTroops: number, attMult: number,
    defTroops: number, defMult: number,
    rng: () => number,
    /** 'field' 或目标城 type（pass/small_city/medium_city/big_city） */
    context: string = 'field'
): BattleOutcome {
    const { LUCK_MIN, LUCK_MAX, POST_BATTLE_RECOVERY } = GameConfig.COMBAT;
    const luck = () => LUCK_MIN + rng() * (LUCK_MAX - LUCK_MIN);
    const attPower = attTroops * attMult * luck();
    const defPower = defTroops * defMult * luck();

    const attackerWon = attPower >= defPower;
    const winnerInitial = attackerWon ? attTroops : defTroops;
    const loserInitial = attackerWon ? defTroops : attTroops;
    const powerRatio = (attackerWon ? defPower : attPower) / Math.max(1, attackerWon ? attPower : defPower);

    let winnerLoss = loserInitial * powerRatio;
    winnerLoss = Math.min(winnerLoss, winnerInitial * 0.9); // 胜方保底 10%
    const recoveryRate = POST_BATTLE_RECOVERY[context] ?? POST_BATTLE_RECOVERY.field;
    const recovery = Math.floor(winnerLoss * recoveryRate);
    const winnerRemaining = Math.max(1, Math.floor(winnerInitial - winnerLoss + recovery));

    return {
        attackerWon,
        winnerRemaining,
        // 时长只有两档；本推演不建模「双方是否都有将」，一律按双将 30s 计
        duration: GameConfig.COMBAT.BATTLE_DURATION_BOTH_GENERALS_SEC,
    };
}

// ============================================================
// 单局推演
// ============================================================
function runGame(seed: number): GameResult {
    const rng = mulberry32(seed);

    // TargetEvaluator 的方向池抽签用的是 Math.random。推演必须可按 seed 复现，
    // 故整局把 Math.random 接到本局种子 rng 上（单进程离线工具，无副作用），main() 里跑完还原。
    Math.random = rng;

    // ---- 初始化世界 ----
    const cities: SimCity[] = CITIES_V2.map((c) => ({
        id: c.id,
        name: c.name,
        faction: c.factionId,
        initialFaction: c.factionId,
        initialTroops: c.troops !== undefined ? c.troops : GameConfig.SIEGE.DEFAULT_CITY_TROOPS,
        lat: c.lat,
        lng: c.lng,
        type: c.type as keyof typeof CITY_CONFIG,
        troops: c.troops !== undefined ? c.troops : GameConfig.SIEGE.DEFAULT_CITY_TROOPS,
        region: getCityRegion({ latitude: c.lat, longitude: c.lng, region: c.region }),
        isPass: c.type === 'pass',
    }));
    const cityById = new Map(cities.map((c) => [c.id, c]));

    // 势力原生文化区 = 首都所在区（同 RebellionSystem.factionNativeRegionMap）
    const factionNativeRegion = new Map<string, RegionType>();
    for (const f of FACTIONS) {
        const cap = cityById.get(STARTING_CAPITALS[f.id] ?? '');
        if (cap) factionNativeRegion.set(f.id, cap.region);
    }

    let legions: SimLegion[] = [];
    let legionSeq = 0;
    let fieldBattles = 0, sieges = 0, captures = 0, rebellions = 0;
    let dynastyUprisings = 0, tianmingYears = 0;
    let supplyCuts = 0, homeRecaptures = 0;
    // 军团兵力峰值统计（远征 5 万门槛评估）
    let maxArmyPeak = 0, armiesOver20k = 0, armiesOver30k = 0, armiesOver50k = 0;
    function notePeak(l: SimLegion, newTroops: number): void {
        const prev = l.peakTroops;
        if (newTroops <= prev) return;
        if (prev < 20000 && newTroops >= 20000) armiesOver20k++;
        if (prev < 30000 && newTroops >= 30000) armiesOver30k++;
        if (prev < 50000 && newTroops >= 50000) armiesOver50k++;
        l.peakTroops = newTroops;
        if (newTroops > maxArmyPeak) maxArmyPeak = newTroops;
    }
    const leaderCitiesAtYear: Record<number, number> = {};
    const yearLeaderReached: Record<number, number | null> = { 30: null, 60: null, 100: null };
    const eliminatedByYear: Record<number, number> = {};
    const totalFactionsAtStart = new Set(cities.map((c) => c.faction)).size;

    const factionCityCount = (): Map<string, number> => {
        const m = new Map<string, number>();
        for (const c of cities) m.set(c.faction, (m.get(c.faction) ?? 0) + 1);
        return m;
    };

    const spawnTypes = GameConfig.LEGION.SPAWN_CITY_TYPES as readonly string[];

    // ---- 募兵（移植 RecruitmentSystem）----
    function seasonTick(): void {
        // 1) 据点产出（大400/中300/小200/关100）全进城防
        //    【2026-06-12 主人裁定】「家城产出优先补自家军团」已删除；军团恢复改为分级战后恢复
        for (const c of cities) {
            if (!c.faction || c.faction === 'panjun') continue;
            c.troops = clampCityTroops(c.type, c.troops + CITY_CONFIG[c.type].recruitPerSeason);
        }
        // 2) 组建军团：≤20 支、每城 1 支现役、90% 兵力 ≥ 10000、文化区保底 1 → 全图高驻军
        const max = GameConfig.LEGION.MAX_ACTIVE_LEGIONS;
        let remaining = max - legions.length;
        if (remaining <= 0) return;

        const activeHomes = new Set(legions.map((l) => l.homeCityId));
        const regionCounts = new Map<RegionType, number>();
        for (const l of legions) regionCounts.set(l.region, (regionCounts.get(l.region) ?? 0) + 1);

        const candidates = cities
            .filter((c) =>
                c.faction && c.faction !== 'panjun' &&
                spawnTypes.includes(c.type) &&
                !activeHomes.has(c.id) &&
                Math.floor(c.troops * 0.9) >= GameConfig.LEGION.MIN_ARMY_SIZE
            )
            .sort((a, b) => (b.troops - a.troops) || (rng() - 0.5));

        const selected: SimCity[] = [];
        const selectedIds = new Set<string>();
        // 文化区保底
        for (const region of REGION_ORDER) {
            if (remaining <= 0) break;
            if ((regionCounts.get(region) ?? 0) >= GameConfig.LEGION.REGION_BASELINE_LEGIONS) continue;
            const cand = candidates.find((c) => c.region === region && !selectedIds.has(c.id));
            if (!cand) continue;
            selected.push(cand); selectedIds.add(cand.id);
            regionCounts.set(region, (regionCounts.get(region) ?? 0) + 1);
            remaining--;
        }
        // 余量：全图驻军最高（无头无视野，跳过视野段 = v0 简化 5）
        for (const cand of candidates) {
            if (remaining <= 0) break;
            if (selectedIds.has(cand.id)) continue;
            selected.push(cand); selectedIds.add(cand.id);
            remaining--;
        }

        for (const city of selected) {
            const armySize = Math.floor(city.troops * 0.9);
            city.troops -= armySize;
            const cavalry = isCultureCavalryOnly(city.region);
            legions.push({
                id: legionSeq++,
                faction: city.faction,
                troops: armySize,
                lat: city.lat,
                lng: city.lng,
                homeCityId: city.id,
                region: city.region,
                speed: BASE_SPEED * (cavalry ? CAVALRY_TERRAIN : PHALANX_TERRAIN),
                targetCityId: null,
                busyUntil: 0,
                peakTroops: 0,
            });
            notePeak(legions[legions.length - 1], armySize);
        }
    }

    // ---- AI 目标：直接调游戏代码（TargetEvaluator.pickTarget + resolveForwardAnchor）----
    // [2026-08-05] 原来这里是推演自己写的一份「直线距离最近 3 城 + 概率合击」，与游戏规则
    // （道路方向池 + 确定性合击）已经完全是两套。推演的全部意义是给调参提供依据，
    // 跑一份和游戏不一样的规则等于白跑，故改为直接 import 游戏的选目标逻辑。
    //
    // cityViews 用 getter 挂到 SimCity 上，占领/复国改的是 SimCity.faction，视图自动同步，
    // 不需要在每处易主的地方补一行同步（漏一处就会让 AI 看到过期地图）。
    const cityViews: City[] = cities.map((c) => ({
        id: c.id,
        name: c.name,
        latitude: c.lat,
        longitude: c.lng,
        type: c.type,
        get factionId() { return c.faction; },
        get troops() { return c.troops; },
    })) as unknown as City[];
    const cityViewById = new Map(cityViews.map((c) => [c.id, c]));
    const cityAccess = {
        getCity: (id: string) => cityViewById.get(id),
        getCitiesByFaction: (factionId: string) => cityViews.filter((c) => c.factionId === factionId),
    };

    function pickTarget(legion: SimLegion): void {
        const originCityId = legion.homeCityId;
        let anchorId: string;
        if (legion.troops < GameConfig.LEGION.HOME_ANCHOR_TROOP_THRESHOLD) {
            anchorId = originCityId;
        } else {
            // 与 LegionBehaviors.FindTarget 同一套锚点解析（含飞地排除）
            const armyPos = { lat: legion.lat, lng: legion.lng };
            const standCityId = roadRegistry.getNearestCityId(armyPos.lat, armyPos.lng);
            const roadDistances = standCityId
                ? roadRegistry.getRoadDistancesKmFrom(standCityId)
                : undefined;
            anchorId = resolveForwardAnchor(armyPos, legion.faction, originCityId, cityAccess, roadDistances);
        }

        const picked = TargetEvaluator.pickTarget(legion.faction, anchorId, originCityId, cityViews);
        legion.targetCityId = picked?.targetId ?? null;
    }

    // ---- 复国（移植 RebellionSystem，每年一次）----
    function yearlyRebellion(): void {
        const cultureCount = new Map<RegionType, number>();
        for (const c of cities) {
            if (!c.faction || c.faction === 'panjun') continue;
            const native = factionNativeRegion.get(c.faction);
            if (!native) continue;
            cultureCount.set(native, (cultureCount.get(native) ?? 0) + 1);
        }
        if (cultureCount.size === 0) return;

        let maxCount = 0;
        cultureCount.forEach((n) => { if (n > maxCount) maxCount = n; });
        const tied: RegionType[] = [];
        cultureCount.forEach((n, r) => { if (n === maxCount) tied.push(r); });
        const dominant = tied[Math.floor(rng() * tied.length)];

        const valid: SimCity[] = [];
        for (const c of cities) {
            if (!c.faction || c.faction === 'panjun') continue;
            if (factionNativeRegion.get(c.faction) !== dominant) continue;
            if (c.region === dominant) continue;
            if (c.faction === c.initialFaction) continue;
            // 城旁有任何军团（驻地/目标/30km 内）→ 不可起义
            const blocked = legions.some((l) =>
                l.homeCityId === c.id || l.targetCityId === c.id ||
                dist(l.lat, l.lng, c.lat, c.lng) <= 0.3
            );
            if (blocked) continue;
            valid.push(c);
        }
        if (valid.length === 0) return;

        // 灭国文化优先
        const extinct = valid.filter((c) => {
            const orig = factionNativeRegion.get(c.initialFaction);
            return orig != null && (cultureCount.get(orig) ?? 0) === 0;
        });
        const pool = extinct.length > 0 ? extinct : valid;
        const target = pool[Math.floor(rng() * pool.length)];
        const prevFaction = target.faction;

        // 驱逐占领方军团（驻地/目标为该城）
        legions = legions.filter((l) =>
            !(l.faction === prevFaction &&
              (l.homeCityId === target.id || l.targetCityId === target.id ||
               dist(l.lat, l.lng, target.lat, target.lng) <= 0.3))
        );

        target.faction = target.initialFaction;
        target.troops = Math.max(target.initialTroops, Math.floor(target.troops * 0.5));
        rebellions++;
    }

    // ---- 王朝周期律民变（--dynasty）：针对最大势力，远郡优先，从者云集 ----
    const factionHomeCity = new Map<string, SimCity>();
    for (const c of cities) {
        if (c.initialFaction && c.initialFaction !== 'panjun' && !factionHomeCity.has(c.initialFaction)) {
            factionHomeCity.set(c.initialFaction, c); // 1 势力 = 1 城公理：开局城即龙兴之地
        }
    }

    function dynastyUprising(leaderFaction: string, empireSize: number): void {
        // 候选：最大势力的非原生占领城，且城旁无军团驻守/围攻（同复国规则）
        const valid: SimCity[] = [];
        for (const c of cities) {
            if (c.faction !== leaderFaction) continue;
            if (c.faction === c.initialFaction) continue;
            const blocked = legions.some((l) =>
                l.homeCityId === c.id || l.targetCityId === c.id ||
                dist(l.lat, l.lng, c.lat, c.lng) <= 0.3
            );
            if (blocked) continue;
            valid.push(c);
        }
        if (valid.length === 0) return;

        // 规则 2 天高皇帝远：按距龙兴之地降序，取前一半为候选池
        const home = factionHomeCity.get(leaderFaction);
        if (home) {
            valid.sort((a, b) =>
                dist(b.lat, b.lng, home.lat, home.lng) - dist(a.lat, a.lng, home.lat, home.lng)
            );
        }
        const farPool = valid.slice(0, Math.max(1, Math.ceil(valid.length / 2)));

        // 灭国文化优先复国照旧
        const cultureCount = new Map<RegionType, number>();
        for (const c of cities) {
            if (!c.faction || c.faction === 'panjun') continue;
            const native = factionNativeRegion.get(c.faction);
            if (native) cultureCount.set(native, (cultureCount.get(native) ?? 0) + 1);
        }
        const extinct = farPool.filter((c) => {
            const orig = factionNativeRegion.get(c.initialFaction);
            return orig != null && (cultureCount.get(orig) ?? 0) === 0;
        });
        const pool = extinct.length > 0 ? extinct : farPool;
        const target = pool[Math.floor(rng() * pool.length)];
        const prevFaction = target.faction;

        legions = legions.filter((l) =>
            !(l.faction === prevFaction &&
              (l.homeCityId === target.id || l.targetCityId === target.id ||
               dist(l.lat, l.lng, target.lat, target.lng) <= 0.3))
        );

        target.faction = target.initialFaction;
        // 规则 3 从者云集：帝国越大，投奔起义的流民越多
        target.troops = clampCityTroops(
            target.type,
            Math.max(target.initialTroops, Math.floor(target.troops * 0.5)) +
                Math.floor(empireSize / 10) * DY_RECRUIT
        );
        rebellions++;
        dynastyUprisings++;
    }

    function yearlyDynastyCycle(): void {
        if (!DYNASTY) return;
        const counts = factionCityCount();
        let leaderFaction = '';
        let leaderN = 0;
        counts.forEach((n, f) => {
            if (f && f !== 'panjun' && n > leaderN) { leaderN = n; leaderFaction = f; }
        });

        // 渐进式天命（--tianming）：每握一座文化中心，民变 ×(1 - 持有数/15)；
        // 15/15 = 民变止息（天命所归）。攒法统的过程本身就在平民心，
        // 与远征系统天然咬合——远征目标恰是文化中心，打中心 = 既扩张又靖民。
        let mandateFactor = 1;
        if (TIANMING && leaderFaction) {
            const held = ALL_CENTER_IDS.filter(
                (id) => cityById.get(id)?.faction === leaderFaction
            ).length;
            mandateFactor = 1 - held / ALL_CENTER_IDS.length;
            if (mandateFactor <= 0) { tianmingYears++; return; }
        }

        // 规则 1 兼并越广民变越频：每 DY_SCALE 城每年多一轮民变（×天命衰减）
        const extraRolls = Math.floor((leaderN / DY_SCALE) * mandateFactor);
        for (let i = 0; i < extraRolls; i++) dynastyUprising(leaderFaction, leaderN);
    }

    // ---- 文化系数（--tiers5 时用五级表，否则用真实游戏现行系数）----
    const fieldMult = (region: RegionType) =>
        TIERS5 ? TIER5_TABLE[region].field : getCultureCombatMultiplier(region, 'field');
    const garrisonMult = (city: SimCity) =>
        (TIERS5 ? TIER5_TABLE[city.region].garrison : getCultureCombatMultiplier(city.region, 'garrison')) *
        (city.isPass ? GameConfig.CULTURE_COMBAT.PASS_GARRISON_MULT : 1);

    // ---- 主循环 ----
    const totalSeconds = MAX_YEARS * YEAR;
    let nextSeason = SEASON;
    let nextYearTick = YEAR;
    let now = 0;
    const DT = 1;

    while (now < totalSeconds) {
        now += DT;

        if (now >= nextSeason) { nextSeason += SEASON; seasonTick(); }
        if (now >= nextYearTick) {
            nextYearTick += YEAR;
            yearlyRebellion();
            yearlyDynastyCycle();

            const year = Math.floor(now / YEAR);
            const counts = factionCityCount();
            let leader = 0;
            counts.forEach((n, f) => { if (f && f !== 'panjun' && n > leader) leader = n; });
            if ([10, 20, 50, 100, 150, 200, 300].includes(year)) leaderCitiesAtYear[year] = leader;
            for (const th of [30, 60, 100]) {
                if (yearLeaderReached[th] == null && leader >= th) yearLeaderReached[th] = year;
            }
            if ([50, 100, 200].includes(year)) {
                const alive = new Set<string>();
                counts.forEach((n, f) => { if (n > 0) alive.add(f); });
                for (const l of legions) alive.add(l.faction);
                eliminatedByYear[year] = totalFactionsAtStart - alive.size;
            }
        }

        // 军团行动
        const destroyed = new Set<number>();
        for (const legion of legions) {
            if (destroyed.has(legion.id) || now < legion.busyUntil) continue;

            // 家城失守 → 强制回师收复（游戏原生行为 resolveRecaptureTarget，所有文化无豁免，常开）
            {
                const home = cityById.get(legion.homeCityId);
                if (home && home.faction !== legion.faction && legion.targetCityId !== legion.homeCityId) {
                    legion.targetCityId = legion.homeCityId;
                    supplyCuts++;
                }
            }

            if (!legion.targetCityId) pickTarget(legion);
            const target = legion.targetCityId ? cityById.get(legion.targetCityId) : null;
            if (!target) continue;
            if (target.faction === legion.faction) { legion.targetCityId = null; continue; }

            // 行军一步
            const d = dist(legion.lat, legion.lng, target.lat, target.lng);
            if (d > SIEGE_ARRIVE_R) {
                const step = Math.min(legion.speed * DT, d);
                legion.lat += ((target.lat - legion.lat) / d) * step;
                legion.lng += ((target.lng - legion.lng) / d) * step;
            }

            // 野战碰撞（v0 简化 4：1v1，不编入援军）
            let fought = false;
            for (const other of legions) {
                if (other.id === legion.id || destroyed.has(other.id)) continue;
                if (other.faction === legion.faction) continue;
                if (now < other.busyUntil) continue;
                if (dist(legion.lat, legion.lng, other.lat, other.lng) > FIELD_CONTACT_R) continue;

                fieldBattles++;
                const r = resolveBattle(
                    legion.troops, fieldMult(legion.region),
                    other.troops, fieldMult(other.region),
                    rng
                );
                const winner = r.attackerWon ? legion : other;
                const loser = r.attackerWon ? other : legion;
                winner.troops = r.winnerRemaining;
                winner.busyUntil = now + r.duration;
                destroyed.add(loser.id);
                fought = true;
                break;
            }
            if (fought || destroyed.has(legion.id)) continue;

            // 抵达 → 攻城（战后恢复按目标城等级）
            if (dist(legion.lat, legion.lng, target.lat, target.lng) <= SIEGE_ARRIVE_R) {
                sieges++;
                const r = resolveBattle(
                    legion.troops, fieldMult(legion.region),
                    Math.max(1, target.troops), garrisonMult(target),
                    rng,
                    target.type
                );
                if (r.attackerWon) {
                    captures++;
                    if (target.id === legion.homeCityId) homeRecaptures++;
                    target.faction = legion.faction;     // 同 SiegeManager：占领
                    target.troops = 1000;                // 同 SiegeManager：城防固定 1000
                    legion.troops = r.winnerRemaining;
                    legion.busyUntil = now + r.duration;
                    legion.targetCityId = null;          // 战后重新选目标
                } else {
                    target.troops = r.winnerRemaining;   // 守方剩余（含伤兵恢复）
                    destroyed.add(legion.id);
                }
            }
        }
        if (destroyed.size > 0) legions = legions.filter((l) => !destroyed.has(l.id));

        // 提前终止：单一势力占 95%+
        if (now % (YEAR * 5) === 0) {
            const counts = factionCityCount();
            let top = 0;
            counts.forEach((n, f) => { if (f && f !== 'panjun' && n > top) top = n; });
            if (top >= cities.length * 0.95) break;
        }
    }

    // ---- 终局统计 ----
    const counts = factionCityCount();
    let winnerFaction = '';
    let winnerCities = 0;
    counts.forEach((n, f) => {
        if (f && f !== 'panjun' && n > winnerCities) { winnerCities = n; winnerFaction = f; }
    });
    const aliveFactions = new Set<string>();
    counts.forEach((n, f) => { if (n > 0 && f && f !== 'panjun') aliveFactions.add(f); });

    const cultureShare: Record<string, number> = {};
    for (const c of cities) {
        const native = c.faction === 'panjun' ? null : factionNativeRegion.get(c.faction);
        if (!native) continue;
        cultureShare[native] = (cultureShare[native] ?? 0) + 1;
    }
    Object.keys(cultureShare).forEach((k) => { cultureShare[k] = cultureShare[k] / cities.length; });

    return {
        winnerFaction,
        winnerCulture: factionNativeRegion.get(winnerFaction) ?? ('CENTRAL' as RegionType),
        winnerCities,
        leaderCitiesAtYear,
        yearLeaderReached,
        eliminatedByYear,
        fieldBattles,
        sieges,
        captures,
        rebellions,
        dynastyUprisings,
        tianmingYears,
        supplyCuts,
        homeRecaptures,
        survivingFactions: aliveFactions.size,
        cultureCityShareAtEnd: cultureShare,
        maxArmyPeak,
        armiesOver20k,
        armiesOver30k,
        armiesOver50k,
    };
}

// ============================================================
// 批量运行 + 汇总
// ============================================================
function main(): void {
    console.log(`🎲 批量推演 v0：${GAMES} 局 × ${MAX_YEARS} 年（seed=${SEED}，规则=${MODE}）`);
    console.log(`   据点 ${CITIES_V2.length} 座 / 势力 ${FACTIONS.length} 个 / 军团上限 ${GameConfig.LEGION.MAX_ACTIVE_LEGIONS}\n`);

    const results: GameResult[] = [];
    const t0 = Date.now();
    const realRandom = Math.random;
    for (let i = 0; i < GAMES; i++) {
        const r = runGame(SEED + i * 7919);
        Math.random = realRandom; // runGame 内接管过，跑完还原
        results.push(r);
        const cul = REGION_LABELS[r.winnerCulture] ?? r.winnerCulture;
        console.log(
            `  局 ${String(i + 1).padStart(3)}: 胜者 ${r.winnerFaction}（${cul}文化，${r.winnerCities} 城）` +
            ` | 存活势力 ${r.survivingFactions} | 野战 ${r.fieldBattles} 攻城 ${r.sieges} 复国 ${r.rebellions}`
        );
    }
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

    // 汇总
    const winsByCulture = new Map<string, number>();
    const winsByFaction = new Map<string, number>();
    const avg = (sel: (r: GameResult) => number) =>
        results.reduce((s, r) => s + sel(r), 0) / results.length;

    for (const r of results) {
        winsByCulture.set(r.winnerCulture, (winsByCulture.get(r.winnerCulture) ?? 0) + 1);
        winsByFaction.set(r.winnerFaction, (winsByFaction.get(r.winnerFaction) ?? 0) + 1);
    }

    console.log(`\n══════════ 汇总（${GAMES} 局，耗时 ${elapsed}s）══════════`);
    console.log('\n📊 文化区胜率（终局据点最多势力的出身文化）：');
    [...winsByCulture.entries()].sort((a, b) => b[1] - a[1]).forEach(([region, n]) => {
        const label = REGION_LABELS[region as RegionType] ?? region;
        const pct = ((n / GAMES) * 100).toFixed(1);
        console.log(`   ${label.padEnd(4, '　')} ${String(n).padStart(3)} 胜  ${pct}%`);
    });

    console.log('\n🏆 势力胜场 Top 10：');
    [...winsByFaction.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([f, n]) => {
        console.log(`   ${f.padEnd(16)} ${n} 胜`);
    });

    console.log('\n📈 雪球速度（领先者达到 N 城的平均年份，仅统计达到的局）：');
    for (const th of [30, 60, 100]) {
        const reached = results.map((r) => r.yearLeaderReached[th]).filter((y): y is number => y != null);
        const share = ((reached.length / GAMES) * 100).toFixed(0);
        const avgYear = reached.length > 0 ? (reached.reduce((s, y) => s + y, 0) / reached.length).toFixed(0) : '—';
        console.log(`   ${String(th).padStart(3)} 城：${share}% 的局达到，平均第 ${avgYear} 年`);
    }

    console.log('\n💀 灭国节奏（平均已灭亡势力数）：');
    for (const y of [50, 100, 200]) {
        const vals = results.map((r) => r.eliminatedByYear[y]).filter((v): v is number => v != null);
        if (vals.length > 0) {
            console.log(`   第 ${y} 年：${(vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(0)} / ${FACTIONS.length}`);
        }
    }

    console.log('\n⚔️ 每局平均：野战 ' + avg((r) => r.fieldBattles).toFixed(0) +
        ' / 攻城 ' + avg((r) => r.sieges).toFixed(0) +
        ' / 占城 ' + avg((r) => r.captures).toFixed(0) +
        ' / 复国 ' + avg((r) => r.rebellions).toFixed(0) +
        (DYNASTY ? '（含民变 ' + avg((r) => r.dynastyUprisings).toFixed(0) + '）' : '') +
        ' / 失家回师 ' + avg((r) => r.supplyCuts).toFixed(0) +
        ' / 收复家城 ' + avg((r) => r.homeRecaptures).toFixed(0) +
        ' / 终局存活势力 ' + avg((r) => r.survivingFactions).toFixed(0));

    const reportPath = path.join(__dirname, `sim-report-${MODE}.json`);
    fs.writeFileSync(reportPath, JSON.stringify({
        meta: { games: GAMES, maxYears: MAX_YEARS, seed: SEED, mode: MODE, generatedAt: new Date().toISOString() },
        winsByCulture: Object.fromEntries(winsByCulture),
        winsByFaction: Object.fromEntries(winsByFaction),
        results,
    }, null, 2), 'utf-8');
    console.log(`\n💾 报告已写入 ${reportPath}`);
}

main();
