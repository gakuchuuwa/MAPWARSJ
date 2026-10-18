/**
 * Scene13WarLayer — 13 战斗模式 v2：出兵口互攻演出（2026-08-11 主人定稿）
 *
 * 模块化拆分结构（src/ui/scene13/）：
 *   - Scene13Types.ts            ：战术接口与类型定义
 *   - Scene13SpriteCache.ts      ：抠绿与干净贴图 LRU 缓存管线
 *   - Scene13UnitTables.ts       ：兵种视野、占地半径、阵型排布与攻城建筑配置表
 *   - Scene13ProjectilesAndFx.ts ：投射物弹道、出手相位、攻击特效与建筑起火点位表
 *   - Scene13CombatMath.ts       ：伤害计算、迎面拒马、侧翼背击、围殴加成与战斗常量
 *   - Scene13Animals.ts          ：野生动物/家畜/飞鸟数据表与生态 AI
 *   - Scene13MapWaterAdapter.ts  ：战术水体搬迁与真实海向自适应校正
 */

import { getCultureTier, getFactionCompositionSlots, getFactionLegionComposition, getRegionLegionComposition, getCultureLegionName, inferFormationModeFromSlots, resolveCityDefenseLegionName, resolveCityDefenseLegionComposition, type FormationMode } from '../types/CultureFormations';
import { Scene13GroundLayerGL, resolveNatureSprite, transposeMapData, TAC_MAP_HALF_W, TAC_MAP_HALF_H, TAC_TILE_W, TAC_TILE_H } from './scene13/Scene13GroundLayerGL';
// @ts-ignore
import { planSpawns } from '../systems/battlefield/spawnPlan.mjs';
import { strategicCityHtml, strategicCityHtmlNative, measureStrategicCity, strategicCityGroundElement, type StrategicCityHtml } from './scene13/Scene13StrategicCity';
import { FACTION_COMPOSITIONS } from '../data/FactionCompositions';
import { CITY_WONDER, CITY_WONDER_EXTRA } from '../data/CityWonders';
import { expandCompositionSlots } from '../types/LegionComposition';
import { SPRITE_PATHS } from '../config/UnitAssets';
import { SpriteTinter } from '../systems/tinting/SpriteTinter';
import { LegionFlagDrawer } from '../map/legion/LegionFlagDrawer';
import { type RegionType } from '../systems/RegionSystem';
import { resolveCastleAsset } from '../config/deCastleAssets';
import { CITIES_V2 } from '../data/cities_v2';
import { REGION_TO_DE_STYLE, resolveCityDeBuildingStyle } from '../systems/cityDeStyle';
import type { BattleType } from '../combat/CombatSystem';
import type { CityType } from '../types/core';
import { DEFAULT_TERRAIN_TILE } from './Scene13Biome';
import { resolveEnvironmentClimate, type Scene13ClimatePlan, type Scene13ClimateInput } from './scene13/Scene13EnvironmentGenerator';
import { resolveTimeOfDay, isNightBattle, Scene13TimeOfDayGrader } from './scene13/Scene13TimeOfDay';
import { selectLegionTechs, applyTechsToStats } from '../systems/MilitaryTechState';
import type { MilitaryTech } from '../data/MilitaryTechs';
import { popCostOf } from '../data/UnitPopCost';
import { GameConfig } from '../config/GameConfig';
import { getSiegeWeaponsForCulture } from '../data/SiegeWeaponsByCulture';
import { shouldUseStoneWall, STYLE_TO_STOCKADE_FENCE, deHashString, resolveTacticalWallSetup } from '../systems/cityWallShared';
import { resolveStockadeFenceKey } from '../data/stockadeWallStyleLookup';
import { destrFamilyOf, destrCandidatesOf, rubbleCandidatesOf, DE_DESTR_FALLBACK, DE_RUBBLE_FALLBACK } from '../data/buildingDestructionAssets';
import { isMountainPass, EXCLUDED_PASS_IDS } from '../systems/passMountainDecision';
import { isScriptPeriod } from '../events/scriptPeriod';
import { audioManager } from '../audio/AudioManager';
import { speechAnnouncer } from '../audio/SpeechAnnouncer';
import DechromaWorker from '../workers/DechromaWorker?worker';
import { WAR_TYPES, type WarType } from '../data/WarTypes';
import { categorizeUnit } from '../legion/formation/deUnitCategories';
import { computeDeFormationLayout, type DeCategoryGroup } from '../legion/formation/deFormationLayout';
import type { Scene13PlayerSetup } from '../player/PlayerHero';
import { withCommander } from '../data/generalHeroUnits';
import { getGeneralProfile } from '../data/GeneralSkills';
import { getFactionGeneral } from '../data/FactionGenerals';
import { CITY_ELITE_LEGIONS, getExpeditionEliteConfig, getCityEliteConfig } from '../data/ExpeditionLegions';
import { TACTICAL_SKILL_ENTRIES_V1, EFFECT_TO_SIX_SET, type TacticalSixSet } from '../data/TacticalSkillCatalog';

import type {
    WarBuilding, ArrowTower, CityBuildingEntry, TechBrief, WarSpawn, WarMan, WarArrow,
    ProjAsset, WarFallenFlag, SceneCloud, NatureMeta, NatureAsset, DecorSprite,
    AnimalAction, TacticalAnimal, WarSlash, WarSpark, WarFx, FxDir, FxAsset,
    WarCorpse, WarFleer, WarBank, Scene13WarInit, PassMountainConfig,
} from './scene13/Scene13Types';
export type { TechBrief, Scene13WarInit, PassMountainConfig } from './scene13/Scene13Types';

import {
    ensureCleanImage, gunpowderTrailSprite, getCachedViennaMapData, setCachedViennaMapData,
} from './scene13/Scene13SpriteCache';

import {
    RANGED_TYPES, WALL_GATE_STATS, deBuildingStats, SIGHT_MAP, DE_FORMATION_LAYOUT, LAYOUT,
    SIDE_LANES, COMMANDER_CELL, bldFootprintSide, DE_DYN_DIRS, REGION_BUILDING_STYLE,
    FACTION_BUILDING_STYLE, SIEGE_IMPERIAL_BUILDINGS, SIEGE_MEDIUM_BUILDINGS, MONGOL_CITY_YURTS,
    SIEGE_FEUDAL_BUILDINGS, SIEGE_CITY_BUILDING_SCALE, SIEGE_CASTLE_SCALE, siegeBuildingScale,
    SIEGE_WONDER_SCALE, marchFilesOf, MARCH_SP, MARCH_SP_DEPTH_MAX, ROW_DEPTH, COL_SPACING, marchSpacingOf,
    UNIT_RADIUS, LOOP_WINDOW_IDLE_SEC, loopRate,
} from './scene13/Scene13UnitTables';

import {
    DEATH_ANIM, ARROW_DUR, SHOOT_PHASE_BY_TYPE, DEFAULT_SHOOT_PHASE, MUZZLE_LIFT_BY_TYPE,
    PROJ_SCALE, PROJ_SCALE_OVERRIDE, PROJ_ASSET_KEY, PROJ_TYPE, accuracyOf, PROJ_FLAT,
    PROJ_HIGH_ARC, PROJ_ARC_RATIO, NO_ATTACK_ANIM, SHOT_DUST_COLORS, CASTER_TYPES,
    GREEK_FIRE_COLORS, FIREARM_TYPES, PROJ_ANGLE_OFFSET, PROJ_VOLLEY, ORGAN_GUN_TYPES,
    ORGAN_GUN_DISPERSION_PX, PROJ_VOLLEY_DELAY, PROJ_DUR, PROJ_SPEED_PX, PROJ_FRAME_DUR,
    SUICIDE_TYPES, SUICIDE_BLD_MULT, MIN_RANGE_TYPES, FIRE_LANCER_TYPES, FIRE_LANCER_VOLLEY,
    FIRE_LANCER_CHARGE, WALL_PASS_TYPES, FX_CFG, FX_SCALE, FX_DUR, FIREARM_MUZZLE, DE_FIRE_DELTAS,
} from './scene13/Scene13ProjectilesAndFx';

import {
    COLLAPSE_ANIM_DUR, HERO_ATTACK_RATE, HERO_HP_MULT, HERO_DAMAGE_TAKEN, dmgVs,
    HUSSITE_SECONDARY_SHOT, UNIT_PX, AIM_JITTER, CHASE_RING, STALL_GUARD_ENFORCE,
    MELEE_QUIET_SEC, NO_KILL_SEC, HARD_STOP_SEC, BATTLE_LIMIT_SEC, BLD_MIN_DESTROY_BASE,
    BLD_MIN_DESTROY_PER_SIDE, FLOW_SUB, PASS_INSIDE_DAMAGE_TAKEN, REMNANT_FRAC,
    DEF_WALL_GAP, SIEGE_FIELD_GAP, CLOUD_BASE_URL, CLOUD_FILES, CLOUD_COUNT_MIN,
    CLOUD_COUNT_MAX, CLOUD_SCALE_MAX, CLOUD_SCALE_MIN, CLOUD_SPD_MIN, CLOUD_SPD_MAX,
    CLOUD_ALPHA_MIN, CLOUD_ALPHA_MAX, NATURE_BASE_URL, BUILDING_BASE_URL,
    BATTLEFIELD_BASE_URL, ANIMAL_BASE_URL, MAPDATA_DIR, FALLBACK_MAPDATA_URL,
    SIDE_CAP, TRIGGER, SPRITE_TROOPS, CORPSE_KEEP, FLEE_SPD, FLEE_DUR, FLAG_EVERY,
    FLAG_SCALE, FLAG_FALL, FLAG_POLE_RATIO, FLAG_POLE_LIFT, BATCH_COOLDOWN, FADE_IN,
    DEPLOY_SECS, DEPLOY_FADE, ARRIVE_EPS, MARCH_REL, LANE_REGROUP_SEC, LANE_TRACK_EPS,
    LANE_W, MARCH_R, CHARGE_CYCLE, GANG_CAP, SPREAD_CAP, SEP_DIST, ZORDER_EPS,
    SEP_SMOOTH, SEP_SPD, SEP_FIGHT, CELL_S, STUCK_IDLE_SEC, NET_STUCK_WINDOW,
    SLIDE_RATE, SLIDE_W, KEEP_TARGET_HP, KITE_RETREAT_DIST, KITE_SAFE, KITE_RETREAT_CAP,
    ATTRITION_START_SEC, ATTRITION_RAMP_SEC, ATTRITION_CAP, HKEY, CELL_M, CELL_R,
    gangMul, PIKE_BRACE_ENABLED, PIKE_BRACE_FRONT_DEG, PIKE_BRACE_TAKEN,
    isPikeBraceType, isCavalryType, faceAngleDeg, attackArcDeg, inFrontArc,
    FLANK_ENABLED, flankMulOf,
} from './scene13/Scene13CombatMath';
export { isPikeBraceType, isCavalryType, faceAngleDeg, attackArcDeg, inFrontArc, flankMulOf } from './scene13/Scene13CombatMath';

import { animalNativeAt, animalDeOf, stepTacticalAnimals } from './scene13/Scene13Animals';
import { relocateTemplateWater, adaptMapDataSeaOrientation } from './scene13/Scene13MapWaterAdapter';
import { pickTree, treeDensityFor, type TreeSeason } from './scene13/TreeAssignment';
import { groundDecorFor, decorFits } from './scene13/DecorFit';

export class Scene13WarLayer {
    /** [2026-09-20 主人定稿] 关隘城门大山配置（未指定 asset/northAsset 时默认从 11 种大山随机抽取，支持两山夹一关） */
    public passMountainConfig: PassMountainConfig = {};
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private active = false;
    /**
     * 残局待命中（战斗已结束、场景还没退的那 5 秒）。
     * active=false 但仍逐帧渲染：士兵播待命帧、旗帜飘、云走、尸体渐隐。见 beginLinger()。
     */
    private lingering = false;
    private spawns: WarSpawn[] = [];
    /** 战斗类型（siege 攻城 / field 野战）——决定出兵口建筑是否双方都布 */
    private battleType: BattleType = 'field';
    /** [2026-08-22] 攻城战守方城等级（big_city/medium_city/small_city/pass）——决定守城建筑池时代 */
    private defenderCityType: CityType | null = null;    /** [2026-08-24] 攻城战守方据点 cityId（名城挂世界奇观，守方城中央立奇观地标） */
    private defenderCityId: string | null = null;
    /** 🔴 [2026-09-11 主人「和游戏同步」] 守方据点经**战略地图同一解析**得到的 DE 建筑风格前缀（null = 该据点无风格，走旧的两层）。 */
    private defenderMapStyle: string | null = null;
    private men: WarMan[] = [];
    private corpses: WarCorpse[] = [];
    private fleers: WarFleer[] = [];
    private arrows: WarArrow[] = [];
    private slashes: WarSlash[] = [];
    private sparks: WarSpark[] = [];
    /** DE 攻击特效实例（爆炸/炮口焰，一次性生命周期） */
    private fxs: WarFx[] = [];
    /** DE 攻击特效素材缓存（单组 1 向 / 炮口焰 8 向） */
    private fxBank: Record<string, FxAsset> = {};
    private fallenFlags: WarFallenFlag[] = [];
    /** 场景云（最上层飘动装饰） */
    private clouds: SceneCloud[] = [];
    /** 本场季节（0=绿夏 1=橙秋 2=白冬）：start 时定一次，树/湖全场统一，禁混季 */
    private sceneSeason: 0 | 1 | 2 = 0;
    /** 本场环境方案（生成器产出，纯数据；Scene13WarLayer 只负责画） */
    private environmentPlan: Scene13ClimatePlan | null = null;
    /** [2026-09-03] 时段色调：画布内每帧固定两次整画布合成（DOM 混合层版实测卡死已废） */
    private timeOfDay = new Scene13TimeOfDayGrader();
    private perfTint: number[] = [];
    /** 战场中心坐标（海拔判定用；start 时从 init 读） */
    private centerLat: number | undefined;
    private centerLng: number | undefined;
    /**
     * 地面图（尸体永久层）。🔴 主人 2026-08-11「保留所有尸体」：
     * 一场打下来双方共 6000 个精灵，全留成活动尸体的话每帧要多画 6000 个、还要参与排序。
     * 所以死亡动画播完就把最后一帧**烙**进这张图，之后每帧只 drawImage 一次，开销恒定。
     * 代价：窗口 resize 会丢失已烙的尸体（画布尺寸变了，位置无从换算）。
     */
    private ground: HTMLCanvasElement | null = null;
    private groundCtx: CanvasRenderingContext2D | null = null;
    private groundHasContent = false;
    private decorSprites: DecorSprite[] = [];
    private tacticalAnimals: TacticalAnimal[] = [];
    private animalMetaCache: Record<string, any> = {};
    /** 攻城战守方城墙/城门装饰贴图（纯视觉，不可攻击不阻挡）；30 秒随机塌一半 */
    private wallGates: WarBuilding[] = [];
    /** 🔴 [2026-10-12] 守方城内可攻击建筑/箭塔（攻城武器第二优先目标，城墙城门之后） */
    private defBuildings: WarBuilding[] = [];
    /** 🔴 [2026-10-12] 攻城战中心建筑（城堡 > 城镇中心 > 最居中的一栋）；undefined = 未选，null = 本场没有 */
    private centerBld: WarBuilding | null | undefined = undefined;
    /** 🔴 [2026-10-12 主人令「开始」流场寻敌] 攻城战流场：每格到中心建筑的步数（INF=不通），格 = 1 个等轴地块，a/b 为地块坐标 */
    private flowDist: Int16Array | null = null;
    private flowR = 0;
    /** 🔴 [2026-10-14] 守方出城流场：每座城门一张，从「门外 120px」反向 BFS（城门对守方不算障碍） */
    private defGateFlow: Map<WarBuilding, Int16Array> | null = null;
    private defFlowSig = -1;
    private gateSpriteSet: Set<DecorSprite> | null = null;
    /** 城墙/城门精灵（含附属碰撞件）→ 所属墙段，用来认出「是哪段墙挡住了我」 */
    private wallBySprite = new Map<DecorSprite, WarBuilding>();
    /** 城墙外圈在地块坐标里的范围（判断「在城内」），null = 未建 / 本场无城墙 */
    private ringBox: { a0: number; a1: number; b0: number; b1: number } | null | undefined = undefined;
    private ringOpenSec = -1;
    private ringOpenVal = false;
    /** 🔴 [2026-10-14 主人令「残兵应该是按每队算」] 残兵主动找敌：每队（lane）开局兵力（后备＋场上，精灵×人口，第一帧记下）与「本队已剩不到 REMNANT_FRAC」的队号 */
    private laneStart: Map<number, number> | null = null;
    /** 🔴 [2026-10-14 主人令「最后一排背靠城墙……看到敌人再发起进攻，或者挨打发起进攻」] 城外列阵、还在原地待敌的守方队号；任何一人看到敌人或挨打，全军出击 */
    private holdLanes = new Set<number>();
    /** 🔴 [2026-10-14 主人令「开战时把世界中心定死，之后不再读画布尺寸」] 世界坐标的中心（开战那一刻的画布中心）。
     *  城池、出兵口、地面格子、寻路图、战场边界都以它为原点；之后窗口缩放只影响「画到屏幕哪里」，不动世界坐标。 */
    private worldCX = 960;
    private worldCY = 540;
    /** 三排之间的排距（布阵时记下，城外列阵算后排位置用） */
    private rowDepth = 260;
    private remnantLanes = new Set<number>();
    private flowBuiltAt = -99;
    /** 中心建筑血归零的战斗秒（未归零 = -1）：等倒塌动画播完才判定结束 */
    private centerKilledAt = -1;
    /** 🔴 [2026-08-29 主人需求] 攻城战守方城墙内侧并列箭塔（射箭 + 30 秒随机三形态） */
    private arrowTowers: ArrowTower[] = [];
    /** 🔴 [主人需求] 攻城战守方城堡射手（险要专属；30 秒不坍塌，持续射击） */
    private castleTowers: ArrowTower[] = [];
    /** 🔴 [2026-08-29 主人需求] 攻城战守城 9 建筑（含城堡/城镇中心/城市塔楼）；30 秒随机三形态 + 未坍塌射冷箭 */
    private cityBuildings: CityBuildingEntry[] = [];
    private natureCache: Record<string, NatureAsset> = {};
    /** M3 WebGL 地面层渲染器与底层画布（默认关，realGeography 开关开启时启用） */
    private glCanvas: HTMLCanvasElement | null = null;
    /** 🔴 [2026-10-11 主人「城池在中心，样式和战略地图一致」] 新战术模式攻城战：战略地图同款城池（null = 旧 13 左右布阵） */
    private deCity: StrategicCityHtml | null = null;
    /** 城心（逻辑坐标）＝地图中心 */
    private deCityCenter = { x: 0, y: 0 };
    /** 城池地基层（战略地图同款 SUCAI_TERRAIN 贴图，DOM，叠在 WebGL 地面与士兵画布之间） */
    private deCityGround: HTMLDivElement | null = null;
    /** 城池建筑与城墙已摆好（量完尺寸、精灵已入场） */
    private deCityBuilt = false;
    private groundLayerGL: Scene13GroundLayerGL | null = null;
    private useGroundGL = false;
    private userInteractingTimer = 0;
    /** 八方向行军前进单位向量（两军对冲） */
    private advanceVec: [{ x: number; y: number }, { x: number; y: number }] = [{ x: 1, y: 0 }, { x: -1, y: 0 }];
    /** 八方向行军侧翼单位向量 */
    private sideVec: [{ x: number; y: number }, { x: number; y: number }] = [{ x: 0, y: 1 }, { x: 0, y: -1 }];
    /** 🔴 [2026-10-15 主人令「让每一队有一个统一的攻击目标」] 每支分队（50 人）统一锁定的队级目标（敌方某支分队 targetLane 或某栋建筑/城门 targetBld），不消灭不换目标 */
    private laneTargets = new Map<number, { targetLane?: number; targetBld?: WarBuilding; x: number; y: number }>();
    /** 攻守双方阵营出兵中心（屏幕逻辑坐标） */
    private spawnBases: [{ x: number; y: number }, { x: number; y: number }] = [{ x: 0, y: 0 }, { x: 0, y: 0 }];
    private over = false;
    private bank: Record<string, WarBank> = {};
    /** DE 抛射物素材缓存（箭/标枪/飞镖/飞斧/火箭）：key -> ProjAsset */
    private projBank: Record<string, ProjAsset> = {};
    private pending = 0;
    private bankSides = new Map<string, Set<0 | 1>>();
    private deferredAssetLoads: Array<() => void> = [];
    private coveredMap: { element: HTMLElement; visibility: string; priority: string } | null = null;
    /** 🔴 [2026-10-02 主人定] 等待行军播报完毕再播放战役战斗播报的轮询计时器 */
    private battleBriefingTimer: any = null;
    /** 🔴 [2026-10-02 主人定] 战役战斗播报是否正在播放（播放期间与战斗音效互斥，绝不重叠） */
    private battleBriefingSpeaking = false;

    private restoreStrategyMap(): void {
        const saved = this.coveredMap;
        if (!saved) return;
        saved.element.style.setProperty('visibility', saved.visibility, saved.priority);
        this.coveredMap = null;
    }

    private coverStrategyMap(): void {
        // 战场底图铺满后，底下的地图不再参与浏览器绘制/合成；保留尺寸和镜头状态。
        // 地形缺图时仍显示原地图，不能用空白战场盖住它。
        if (this.coveredMap || !this.useGroundGL) return;
        // 淡入期间底下的战略地图要留着（画布半透明，盖掉地图会透出空白底）；淡入走完后的下一帧再盖
        // 等素材期间画布还是全透明，淡入期间半透明：都得留着底下的战略地图，不然透出空白底
        if (this.entryFadePending || this.entryFadeActive) return;
        /* 🔴 [2026-09-17 主人报障「一直都是战略地图白屏」· 第二刀] 演出已停就绝不许再盖。
         * 只把 stop() 改成无条件 restore **不够** —— 实测调用序列（scratch/_probe_cover_hook.mjs）：
         *     306.9s restoreStrategyMap()  → covered=false vis=空      ← 恢复成功
         *     306.9s stop("场景自愈退出")   → active=false             ← 演出停了
         *     306.9s coverStrategyMap()    → covered=true vis=hidden   ← 同一毫秒又盖回去
         * stop() 之后**还有一帧已经排进 requestAnimationFrame 的 render 会跑完**，
         * 它照旧调本函数，于是刚恢复的地图立刻被重新盖上，且此后再没有人 restore → 永久白屏。
         * （这也是为什么原来那版 `if (!keepFrame) restore` 从来救不回来。）
         * 守卫判据与 tick/供数那几处一致：active 与 lingering 都为假 = 演出确已收场。 */
        if (!this.active && !this.lingering) return;
        const element = document.getElementById('map');
        if (!element) return;
        this.coveredMap = { element, visibility: element.style.getPropertyValue('visibility'),
            priority: element.style.getPropertyPriority('visibility') };
        element.style.setProperty('visibility', 'hidden');
    }
    /**
     * 素材加载的**场次代号**：每次 start() 自增，`pending` 归零的同时作废上一场的在途回调。
     *
     * 🔴 [2026-08-30 修 pending 记错数] `start()` 把 `pending` 清 0，但上一场发出去的图还在路上；
     *    它们回来时照样执行 `this.pending -= inc`，于是新一场的计数被**倒扣**（实测跑到 **-64**）。
     *    后果两头都坏：倒扣后 `pending > 0` 提前变假 → 素材没齐就开演（兵没图）；
     *    反过来若某场倒扣不足，又会虚高卡住画面。
     *    回调只在自己那一场的代号还有效时才加减，跨场的一律忽略。
     */
    private assetGen = 0;
    /* 🔴 [2026-09-17 主人报障「又白了」→ 实测归因] `_meta.json` 解析结果缓存，**跨战斗永久保留**。
     *
     * 病根：start() 里 `this.bank = {}` 每场无条件清空，注释理由是「bank 里存的是**已染色**的帧，
     *   换势力会把上一场的颜色带过来」—— 这对染色帧成立，但 bank 里**还存着 `_meta.json` 读来的
     *   dyn/frames/dur（帧框、方向数、每帧时长）**，那是纯静态数据，与势力、染色毫无关系。
     *   连它一起丢掉的后果：每场战斗重新 fetch 一遍全部 `_meta.json`。
     *
     * 实测（scratch/_probe_s13_blank.mjs）：进 13 后 pending 从 235 降到 0 要 **18 秒**，
     *   这 18 秒 `frames=0` —— 一帧都没渲染过，画面就是纯白，主人两次截图都落在这段里。
     *   三处 pending++ 全是 fetch `_meta.json`（兵种帧框 / 投射物 / 特效），没有一处是图片解码。
     *
     * 解法：静态 meta 单独缓存，按目录键；bank（染色帧）照旧每场清，一点不动。
     * ⚠️ 必须返回**拷贝**：调用方会 `b.dyn = meta.dyn` 把引用挂进 bank，直接返回缓存对象会被后续写污染。
     * ⚠️ 失败（null）不入缓存，留给下次重试。 */
    private readonly dynMetaCache = new Map<string, { dyn: NonNullable<WarBank['dyn']>; frames: Record<string, number>; dur: Record<string, number> }>();
    private readonly projMetaCache = new Map<string, { frames: number; box_w: number; box_h: number; anchor_x: number; anchor_y: number }>();
    /** [2026-08-11 防死锁] 素材加载开始时间戳（pending 卡死 10s 强制判负用） */
    private pendingStartedAt = 0;
    private enemyCen: ({ x: number; y: number } | null)[] = [null, null];
    private gm = new Map<number, WarMan[]>();
    private gr = new Map<number, WarMan[]>();
    private gs = new Map<number, WarMan[]>();
    /** 空间网格桶复用池：避免每帧为三张网格反复创建数百个短命数组，触发长 GC 停顿。 */
    private gridBucketPool: WarMan[][] = [];
    private last = performance.now();
    /** [2026-08-11 势力本色] 攻/守双方染色 rgba（start 时按 factionId 解析） */
    private sideFaction: [string, string] = ['', ''];
    /**
     * 每兵总加成（攻/守），乘在伤害上。把战略层的强弱带进 13 —— 将领、精锐、武将技、
     * 文化、运气都在里面（兵力已除掉，它由精灵数量体现）。兵种相克不受影响：
     * 三类的相对关系不变，只是整体强弱平移。
     */
    private sideBonus: [number, number] = [1, 1];
    /**
     * 八环质量优势里**分给血量**的那一半（攻/守各一个乘数），与 `sideBonus`（分给伤害的那一半）同源。
     * 见 start() 里的拆分说明。1 = 无优势。
     */
    private sideHpMult: [number, number] = [1, 1];
    /** [军事科技] 双方文化区（start 时从 init 存；科技按文化门控，每方按自己的算） */
    private sideCulture: [string, string] = ['CENTRAL', 'STEPPE'];
    /** [军事科技] 当前生效年份（跨年时重建分表 + 播报新解锁） */
    private techYear: number = GameConfig.TIME.TIMELINE_START_YEAR;
    /** [军事科技] 年份 getter（由 GameAppCombatHooks 注入；解耦 TimeSystem） */
    private techYearGetter: (() => number) | null = null;
    /** [性能] getSideTechs 的按年缓存（面板每帧调，科技只随跨年变） */
    private techListYear = Number.NaN;
    private techListCache: { attacker: MilitaryTech[]; defender: MilitaryTech[] } | null = null;
    /** [军事科技] 双方兵种分表（key → 基础档 + 该方已解锁科技；🔴 绝不原地改 WAR_TYPES，否则逐场累积爆表） */
    private techStats: [Map<string, WarType & { sight?: number }>, Map<string, WarType & { sight?: number }>] = [new Map(), new Map()];
    /** 成批增援冷却（秒），一次只补一边所以单值 */
    private batchCd = 0;
    /** 开场列阵待命剩余时间（秒）：阶段内全军静止渐显，结束才开打（主人 2026-08-16） */
    private deployT = 0;
    /** 列阵推进阶段是否仍在进行（见 MARCH_REL）；解除后整场不再回到列阵 */
    private marching = false;
    /**
     * 🔴 [2026-10-11 主人令「所有建筑改为贴图。确保士兵通行」] 每场只做一次：
     *    开战 30 秒后**全场非墙装饰去碰撞**（树/石/摆设一律可通行）。不塌墙、不碰建筑 ——
     *    墙另有「受伤自动坍塌」（见下）与「血归零即塌」两条，都只塌**已经掉血**的墙。
     */
    private wallAutoCollapsed = false;
    /**
     * 🔴 [2026-10-15 主人令「把受伤的城墙自动坍塌逻辑加回来。只有不是满血的城墙才能自动坍塌」]
     * 下一处墙缺口自动坍塌的时刻（battleSec）；1e9 = 已无墙可塌，停止轮询。
     * 规则：每 10 秒塌一处，只挑**掉过血**（hp < maxHp）的墙/门/垛/栅栏，先塌最早挨打的那一处。
     */
    private nextWallGapSec = 10;
    /**
     * 🔴 [2026-10-03] 本场是不是「**真有城墙的攻城战**」（城寨守方、漠北蒙古守方按野战算 —— 见 2026-09-03、
     *    2026-09-19 主人定「城寨/漠北蒙古与野战一致：直接开战」）。
     * 用途只有一个：**分队归队只给野战** —— 主人 2026-08-23 定过「攻城战不再列阵行军……30 秒城墙坍塌后
     * 直接各自索敌接战（aimAt/search）；march 列阵只保留给野战」，所以攻城战不许从后门把队形放回来。
     * 在 start() 里算一次：`isMobeiMongolDefender()` 要查据点表，不能逐帧逐兵算。
     */
    private siegeWithWalls = false;
    /** 两方阵型各自已推进的距离（px），列阵解除后不再使用 */
    private adv: [number, number] = [0, 0];
    /** 开局总兵力（精灵），攻/守各一 —— 补兵触发线按「剩余占比」缩放时当分母 */
    private initPool: [number, number] = [1, 1];
    /** 尸体保留累加器（攒够 1 留一具）：确定性均匀，不随机斑驳。见 CORPSE_KEEP */
    private corpseAcc = 0;
    /** 本场已打了多少秒（真实秒，开场列阵也算）。见 HARD_STOP_SEC / NO_KILL_SEC */
    private battleSec = 0;
    /** 最近一次有人阵亡的时刻（秒，battleSec 计）。长时间没人死 = 卡住了 */
    private lastKillSec = 0;
    /** 本场是否已报过「打不完」（只报一次，别刷屏也别重复落盘） */
    private stallReported = false;
    /**
     * 「接触交战」循环音景（land_contact）的驱动状态。
     * 🔴 [2026-09-15 主人定]「这个音效主要是近战音效，战斗到后期往往只剩下远程兵了，可以停吗？渐隐。」
     *    改前是一次性开关：接触那一刻起循环，一直垫到演出退场 —— 于是近战全死光、
     *    场上只剩弓弩对射时，绞杀声还在响。现在改成**跟着近战接触实时开关**：
     *    每帧数「有多少近战兵正够得着活人」，>0 就开，连续 MELEE_QUIET_SEC 秒没有就淡出，
     *    近战再接上就淡入。startLoop/stopLoop 本身带淡入淡出，且互相撤销，反复切也不会爆音。
     */
    private meleeContactCount = 0;
    /** 连续多少秒没有近战接触了（喂给淡出判据） */
    private meleeQuietSec = 0;
    /** 音景此刻是否开着（只为省掉每帧重复调用，start/stop 本身幂等） */
    private contactSfxOn = false;
    /** 首批素材是否已经全部就绪过一次：之后再有素材加载都不许冻结演出（见 tick 里那道闸） */
    private assetsReadyOnce = false;

    /** 攻方主帅武将 id（攻城武器时代判定用） */
    private attackerGeneralId: string | null = null;

    /** 演出判负回调（winner: 'attacker' | 'defender' | 'draw'）——由 GameAppCombatHooks 接 */
    public onDecision: ((winner: 'attacker' | 'defender' | 'draw', survivors: { attacker: number; defender: number }) => void) | null = null;

    // ── 战术模式：武将技集气槽与六计见招拆招/玩家钦定系统 ──
    /** 攻/守双方主将 ID（若为无名统帅则为 null，按普将 ×1.00 档位计算） */
    private sideGeneralId: [string | null, string | null] = [null, null];
    /** 攻/守双方是否为名将（名将 ×1.25 / 普将 ×1.00） */
    private sideIsFamous: [boolean, boolean] = [false, false];
    /** 攻/守双方精锐层级（T0=0 .. T4=4，无精锐=null；倍率 1.5 / 1.4 / 1.3 / 1.2 / 1.1 / 1.0） */
    private sideEliteTier: [number | null, number | null] = [null, null];
    /** 攻/守双方当前集气进度（0 ~ 100） */
    private skillGauge: [number, number] = [0, 0];
    /** 攻/守双方每秒集气速率（基础 24 秒满槽 = 100/24 × 武将档位 × 精锐档位） */
    private skillRatePerSec: [number, number] = [0, 0];
    /** 攻/守双方集气总倍率（用于 UI 展示） */
    private skillRateMult: [number, number] = [1, 1];
    /** 攻/守双方上一次释放的六计类型（供对方自动释放相克技能） */
    private lastCastSkill: [TacticalSixSet | null, TacticalSixSet | null] = [null, null];
    /** 攻/守双方上一次释放的技能四字名称 */
    private lastCastSkillName: [string, string] = ['', ''];
    /** 玩家手动预点亮（钦定）的下一计；null 表示自动见招拆招 */
    private queuedSkill: [TacticalSixSet | null, TacticalSixSet | null] = [null, null];
    /** 【攻】振己威持续倒计时（秒）：己方全场士兵攻速 ×1.30、移速 ×1.20、伤害 ×1.30 */
    private skillFrenzyTimer: [number, number] = [0, 0];
    /** 【敌】固己防持续倒计时（秒）：释放瞬间满血 + 持续期间己方士兵受伤害 ×0.60 */
    private skillShieldTimer: [number, number] = [0, 0];
    /** 【混】乱敌阵持续倒计时（秒）：该侧（受害方）接战前排士兵恐慌转身向后溃逃 */
    private skillPanicTimer: [number, number] = [0, 0];
    /** 【并】挫敌锐（攻城战破防）持续倒计时（秒）：该侧（受害方）守军与城墙/建筑受伤害 ×1.35 */
    private skillVulnTimer: [number, number] = [0, 0];
    /** 双方武将技错开释放冷却（秒）：禁止双方同帧同时放技；同时满槽时攻方（0）先放，守方（1）隔 2.6s 再放 */
    private skillCastCooldown: number = 0;

    /** 初始化本场战术模式双方武将技集气槽与速率 */
    private initScene13SkillSystem(init: Scene13WarInit): void {
        const rawAttGid = init.attackerGeneralId?.trim()
            || (init.attackerFactionId ? getFactionGeneral(init.attackerFactionId)?.generalId : null)
            || null;
        const rawDefGid = init.defenderGeneralId?.trim()
            || (init.defenderFactionId ? getFactionGeneral(init.defenderFactionId)?.generalId : null)
            || null;
        const defGid = (rawDefGid && rawDefGid !== rawAttGid) ? rawDefGid : null;
        this.sideGeneralId = [rawAttGid, defGid];
        this.skillCastCooldown = 0;

        const resolveEliteTier = (eliteName: string | null | undefined, factionId: string | null | undefined, cityId: string | null | undefined, isDef: boolean): number | null => {
            const cleanName = eliteName?.trim();
            if (cleanName) {
                for (const cfg of Object.values(CITY_ELITE_LEGIONS)) {
                    if (cfg.name === cleanName) return cfg.tier;
                }
            }
            if (isDef && cityId) {
                const cCfg = getCityEliteConfig(cityId);
                if (cCfg) return cCfg.tier;
            }
            if (factionId) {
                const fCfg = getExpeditionEliteConfig(factionId);
                if (fCfg) return fCfg.tier;
            }
            return null;
        };

        const ELITE_RATE_MULTS: Record<number, number> = { 0: 1.5, 1: 1.4, 2: 1.3, 3: 1.2, 4: 1.1 };
        const BASE_RATE = 100 / 45; // 普将+无精锐基准 45 秒满槽（整体放缓武将技释放频率）

        for (const f of [0, 1] as const) {
            const gid = this.sideGeneralId[f];
            const isDef = f === 1;
            const tier = resolveEliteTier(
                isDef ? init.defenderEliteName : init.attackerEliteName,
                isDef ? init.defenderFactionId : init.attackerFactionId,
                isDef ? init.defenderCityId : null,
                isDef,
            );
            this.sideEliteTier[f] = tier;
            const profile = gid ? getGeneralProfile(gid) : null;
            const famous = profile?.tier === 'famous';
            this.sideIsFamous[f] = famous;
            const genMult = famous ? 1.25 : 1.0;
            const eliteMult = (tier !== null && ELITE_RATE_MULTS[tier] !== undefined) ? ELITE_RATE_MULTS[tier] : 1.0;
            this.skillRateMult[f] = +(genMult * eliteMult).toFixed(2);
            this.skillRatePerSec[f] = BASE_RATE * genMult * eliteMult;
            this.skillGauge[f] = 0;
            this.lastCastSkill[f] = null;
            this.lastCastSkillName[f] = '';
            this.queuedSkill[f] = null;
            this.skillFrenzyTimer[f] = 0;
            this.skillShieldTimer[f] = 0;
            this.skillPanicTimer[f] = 0;
            this.skillVulnTimer[f] = 0;
        }
    }

    /** 计算某方当前若不手动干预，按战局态势（顺风/焦灼/逆风）自动释放的六计类型 */
    private resolveAutoNextSkill(f: 0 | 1): TacticalSixSet {
        const ef: 0 | 1 = f === 0 ? 1 : 0;
        // 若敌方正在生效增益 Buff（振威/固防/破防），优先用【混战】看破驱散并控场
        if (this.skillFrenzyTimer[ef] > 0.5 || this.skillShieldTimer[ef] > 0.5 || this.skillVulnTimer[f] > 0.5) {
            return 'hunzhan';
        }
        // 计算双方当前战力比（场上存活人口 + 后备池人口）
        let myPop = 0, foePop = 0;
        for (const m of this.men) {
            if (m.hp <= 0) continue;
            if (m.f === f) myPop += m.pop || 1;
            else foePop += m.pop || 1;
        }
        for (const sp of this.spawns) {
            if (sp.pool <= 0) continue;
            if (sp.f === f) myPop += sp.pool * Math.max(1, sp.pop);
            else foePop += sp.pool * Math.max(1, sp.pop);
        }
        const ratio = myPop / Math.max(1, foePop);
        const stance: 'adv' | 'bal' | 'dis' = ratio >= 1.15 ? 'adv' : (ratio <= 0.85 ? 'dis' : 'bal');

        // 优先取该武将在当前态势下的专属计策
        const gid = this.sideGeneralId[f];
        if (gid) {
            const profile = getGeneralProfile(gid);
            const sigId = stance === 'adv'
                ? (f === 0 ? (profile?.atkAdvantageSkillId ?? profile?.advantageSkillId) : (profile?.defAdvantageSkillId ?? profile?.advantageSkillId))
                : stance === 'dis'
                    ? (f === 0 ? (profile?.atkDisadvantageSkillId ?? profile?.disadvantageSkillId) : (profile?.defDisadvantageSkillId ?? profile?.disadvantageSkillId))
                    : (f === 0 ? (profile?.atkBalanceSkillId ?? profile?.balanceSkillId ?? profile?.tacticalSkillId) : (profile?.defBalanceSkillId ?? profile?.balanceSkillId ?? profile?.tacticalSkillId));
            if (sigId) {
                const entry = TACTICAL_SKILL_ENTRIES_V1.find((e) => e.id === sigId);
                if (entry) return EFFECT_TO_SIX_SET[entry.baseEffect];
            }
        }
        // 默认按三势轮换：顺风（胜/敌）、焦灼（攻/混）、逆风（并/败）
        const pair: [TacticalSixSet, TacticalSixSet] = stance === 'adv'
            ? ['shengzhan', 'dizhan']
            : stance === 'dis'
                ? ['bingzhan', 'baizhan']
                : ['gongzhan', 'hunzhan'];
        return this.lastCastSkill[f] === pair[0] ? pair[1] : pair[0];
    }

    /** 玩家在 UI 上点击六计徽章：预点亮（钦定）下一计，再次点击同枚则取消钦定恢复自动选计 */
    public setScene13QueuedSkill(sideOrF: 0 | 1 | 'attacker' | 'defender', six: TacticalSixSet | null): void {
        const f: 0 | 1 = (sideOrF === 0 || sideOrF === 'attacker') ? 0 : 1;
        this.queuedSkill[f] = this.queuedSkill[f] === six ? null : six;
    }

    /** 供 CombatUI 实时读取战术模式双方的集气槽与六计状态 */
    public getScene13SkillState() {
        if (!this.active && !this.lingering) return null;
        const buildSide = (f: 0 | 1) => ({
            hasGeneral: true,
            generalId: this.sideGeneralId[f],
            isFamous: this.sideIsFamous[f],
            eliteTier: this.sideEliteTier[f] !== null ? (`T${this.sideEliteTier[f]}`) : null,
            rateMult: this.skillRateMult[f],
            gauge: this.skillGauge[f],
            ratePerSec: this.skillRatePerSec[f],
            lastCastSkill: this.lastCastSkill[f],
            lastCastSkillName: this.lastCastSkillName[f],
            queuedSkill: this.queuedSkill[f],
            autoNextSkill: this.resolveAutoNextSkill(f),
            oppLastCast: this.lastCastSkill[1 - f],
            frenzySec: Math.max(0, this.skillFrenzyTimer[f]),
            shieldSec: Math.max(0, this.skillShieldTimer[f]),
            panicSec: Math.max(0, this.skillPanicTimer[f]),
            vulnSec: Math.max(0, this.skillVulnTimer[f]),
            isSiege: this.battleType === 'siege',
        });
        return {
            attacker: buildSide(0),
            defender: buildSide(1),
        };
    }

    /** 推进双方集气槽与六计持续状态计时（在 step 中调用） */
    private tickScene13Skills(dt: number, deploying: boolean): void {
        for (const f of [0, 1] as const) {
            if (this.skillFrenzyTimer[f] > 0) this.skillFrenzyTimer[f] = Math.max(0, this.skillFrenzyTimer[f] - dt);
            if (this.skillShieldTimer[f] > 0) this.skillShieldTimer[f] = Math.max(0, this.skillShieldTimer[f] - dt);
            if (this.skillPanicTimer[f] > 0) this.skillPanicTimer[f] = Math.max(0, this.skillPanicTimer[f] - dt);
            if (this.skillVulnTimer[f] > 0) this.skillVulnTimer[f] = Math.max(0, this.skillVulnTimer[f] - dt);
        }
        if (this.skillCastCooldown > 0) {
            this.skillCastCooldown = Math.max(0, this.skillCastCooldown - dt);
        }
        if (deploying || this.over) return;
        for (const f of [0, 1] as const) {
            if (this.skillRatePerSec[f] <= 0) continue;
            this.skillGauge[f] = Math.min(100, this.skillGauge[f] + this.skillRatePerSec[f] * dt);
        }
        // 严禁同帧同时释放：按 [0(攻方), 1(守方)] 顺序检视，同时满槽时攻方优先释放，并进入 2.6s 错开窗口
        if (this.skillCastCooldown <= 0) {
            for (const f of [0, 1] as const) {
                if (this.skillGauge[f] >= 100) {
                    this.skillGauge[f] = 0;
                    const chosen = this.queuedSkill[f] ?? this.resolveAutoNextSkill(f);
                    this.queuedSkill[f] = null; // 释放后清空手动钦定，回归自动见招拆招
                    this.skillCastCooldown = 2.6;
                    this.triggerScene13Skill(f, chosen);
                    break;
                }
            }
        }
    }

    /** 【胜】增己兵专用：立即从该侧 9 个出兵口一次性刷出全部 8% 增援士兵参战 */
    private spawnImmediateSkillReinforcements(f: 0 | 1, addTotalPop: number): void {
        const mySpawns = this.spawns.filter((sp) => sp.f === f && !sp.playerElite);
        if (mySpawns.length === 0) return;

        let remainingPop = addTotalPop;
        const uFwd = this.advanceVec[f];
        const uSide = this.sideVec[f];

        for (const s of mySpawns) s.slotN = 0;
        let idx = 0;
        while (remainingPop > 0) {
            const s = mySpawns[idx % mySpawns.length];
            idx++;
            const unitPop = Math.max(1, s.pop);
            remainingPop -= unitPop;
            s.spawned++;
            const bearer = (s.spawned % FLAG_EVERY === 0);
            const slotIdx = s.slotN++;
            const files = marchFilesOf(s.key);
            const sp = marchSpacingOf(s.key);
            const spDep = Math.min(sp, MARCH_SP_DEPTH_MAX);
            const dep = ((slotIdx / files) | 0) * spDep;
            const slotY = ((slotIdx % files) - (files - 1) / 2) * sp;
            const [spawnX, spawnY] = this.fieldBound(
                s.x - uFwd.x * dep + uSide.x * slotY,
                s.y - uFwd.y * dep + uSide.y * slotY,
            );
            const tgt = this.nearestEnemySpawn(s) ?? this.enemyCen[1 - s.f] ?? { x: this.worldCX, y: this.worldCY };
            const jx = (Math.random() - 0.5) * 2 * AIM_JITTER;
            const jy = (Math.random() - 0.5) * 2 * AIM_JITTER;
            this.men.push({
                f: s.f, key: s.key, jx, jy,
                zid: this.manSeq++,
                x: spawnX, y: spawnY, tx: spawnX, ty: spawnY,
                hp: this.statsFor(s.key, s.f).hp,
                dir: this.dir8(tgt.x - s.x, tgt.y - s.y),
                ph: Math.random() * 8, st: 0, foe: null, next: Math.random() * 0.15,
                fightT: 0, aimT: 0, lock: 0, atkSt: 0, atkFlip: false,
                prevX: spawnX, prevY: spawnY, anchorX: spawnX, anchorY: spawnY, netT: 0,
                stuckT: 0, sepX: 0, sepY: 0, y0: s.y,
                flag: bearer, fo: Math.random() * 600,
                march: false, port: null, dep, slotY, pop: s.pop,
                lane: s.lane,
                guardPost: (s.f === 1 && this.battleType === 'siege' && !!this.deCity && !this.isDefenderGateDestroyed()) ? { x: spawnX, y: spawnY } : undefined,
                claims: 0, claimsNext: 0, atkers: 0, atkNext: 0, fadeT: FADE_IN, fadeMax: FADE_IN,
            });
        }
    }

    /** 满槽释放指定六计：执行 6 大正交战场效果 + 通知 CombatUI 触发立绘脉冲与大字 Cut-in */
    private triggerScene13Skill(f: 0 | 1, six: TacticalSixSet): void {
        const ef: 0 | 1 = f === 0 ? 1 : 0;
        const roleTag = f === 0 ? '攻击' : '防御';
        const gid = this.sideGeneralId[f];
        const isFamous = this.sideIsFamous[f];

        // 挑选贴合该武将身份与攻守角色的四字技能名
        let pickedEntry = gid ? (() => {
            const p = getGeneralProfile(gid);
            const sigIds = f === 0
                ? [p?.atkAdvantageSkillId, p?.atkBalanceSkillId, p?.atkDisadvantageSkillId, p?.advantageSkillId, p?.balanceSkillId, p?.disadvantageSkillId, p?.tacticalSkillId]
                : [p?.defAdvantageSkillId, p?.defBalanceSkillId, p?.defDisadvantageSkillId, p?.advantageSkillId, p?.balanceSkillId, p?.disadvantageSkillId, p?.tacticalSkillId];
            for (const sid of sigIds) {
                if (!sid) continue;
                const e = TACTICAL_SKILL_ENTRIES_V1.find((x) => x.id === sid);
                if (e && EFFECT_TO_SIX_SET[e.baseEffect] === six) return e;
            }
            return undefined;
        })() : undefined;

        if (!pickedEntry) {
            const candidates = TACTICAL_SKILL_ENTRIES_V1.filter(
                (e) => (e.usageTag === roleTag || e.usageTag === '双行' || !e.usageTag)
                    && EFFECT_TO_SIX_SET[e.baseEffect] === six
                    && (isFamous ? !!e.ownerGeneralId : !e.ownerGeneralId),
            );
            const pool = candidates.length > 0
                ? candidates
                : TACTICAL_SKILL_ENTRIES_V1.filter((e) => EFFECT_TO_SIX_SET[e.baseEffect] === six);
            if (pool.length > 0) {
                pickedEntry = pool[Math.floor(Math.random() * pool.length)];
            }
        }
        const fallbackNames: Record<TacticalSixSet, string> = {
            gongzhan: f === 0 ? '破釜沉舟' : '绝地反击',
            shengzhan: f === 0 ? '全军突击' : '众志成城',
            dizhan: f === 0 ? '步步为营' : '固若金汤',
            hunzhan: f === 0 ? '声东击西' : '疑兵之计',
            bingzhan: f === 0 ? '势如破竹' : '坚壁清野',
            baizhan: f === 0 ? '雷霆万钧' : '背水一战',
        };
        const displayName = pickedEntry?.displayName ?? fallbackNames[six];
        const skillId = pickedEntry?.id ?? `tac13_${six}`;

        this.lastCastSkill[f] = six;
        this.lastCastSkillName[f] = displayName;

        // ── 执行六计正交战场效果 ──
        if (six === 'shengzhan') {
            // 1. 【胜】增己兵：立即从己方 9 个出兵口一次性涌出 +8% 初始总兵力的生力军参战
            const addTotalPop = Math.max(12, Math.round(this.initPool[f] * 0.08));
            this.spawnImmediateSkillReinforcements(f, addTotalPop);
        } else if (six === 'baizhan') {
            // 2. 【败】死战：当场直接折损敌方 8% 当前总兵力（后备池削减 + 前线敌军直接阵亡一批）
            for (const sp of this.spawns) {
                if (sp.f === ef && sp.pool > 0) {
                    sp.pool = Math.max(0, Math.floor(sp.pool * 0.92));
                }
            }
            const enemyLiving = this.men.filter((m) => m.f === ef && m.hp > 0 && !m.hero && !m.siegeW);
            if (enemyLiving.length > 0) {
                const killCount = Math.max(1, Math.round(enemyLiving.length * 0.08));
                const step = enemyLiving.length / killCount;
                for (let i = 0; i < killCount; i++) {
                    const idx = Math.min(enemyLiving.length - 1, Math.floor((i + 0.5) * step));
                    const victim = enemyLiving[idx];
                    if (victim && victim.hp > 0) {
                        victim.hp = 0;
                        this.onManKilled(victim, victim);
                    }
                }
            }
        } else if (six === 'gongzhan') {
            // 3. 【攻】猛攻：8 秒内己方全军攻速 ×1.30、移速 ×1.20、伤害 ×1.30
            this.skillFrenzyTimer[f] = 8.0;
        } else if (six === 'dizhan') {
            // 4. 【敌】固守：己方全场存活士兵立即回复 20% 生命，且 8 秒内受到伤害降低 40%（×0.60）
            for (const m of this.men) {
                if (m.f === f && m.hp > 0) {
                    const maxHp = m.hero ? this.heroMaxHp(m.key, f) : this.statsFor(m.key, f).hp;
                    if (m.hp < maxHp) m.hp = Math.min(maxHp, m.hp + maxHp * 0.20);
                }
            }
            this.skillShieldTimer[f] = 8.0;
        } else if (six === 'hunzhan') {
            // 5. 【混】乱阵：当场驱散敌方正在生效的所有技能 Buff，并令敌方前线士兵原地混乱定身 3.5 秒（不攻不动，受近战伤害 ×1.4）
            this.skillFrenzyTimer[ef] = 0;
            this.skillShieldTimer[ef] = 0;
            this.skillVulnTimer[f] = 0;
            this.skillPanicTimer[ef] = 3.5;
        } else if (six === 'bingzhan') {
            // 6. 【并】奇袭：8 秒内己方全军打出破甲奇袭（无视敌方护盾减伤，且令敌方全体承伤 +35%），同时压制敌方集气
            this.skillShieldTimer[ef] = 0;
            this.skillVulnTimer[ef] = 8.0;
            this.skillGauge[ef] = Math.max(0, this.skillGauge[ef] - 35);
        }

        // 通知 CombatUI 播放立绘脉冲缩放与技能名 Cut-in 动画
        const sideKey: 'attacker' | 'defender' = f === 0 ? 'attacker' : 'defender';
        (window as any).game?.combatUI?.onScene13SkillCast?.(sideKey, six, displayName, gid ?? undefined, skillId);
    }

    // ── [2026-09-05 玩家] 战术模式玩家布置（玩家本体 + 受控编队 + 指令） ──
    /** 本场玩家布置（start 时从 window.game.playerHero 取；玩家不在军中 = null） */
    private playerSetup: Scene13PlayerSetup | null = null;
    /** 玩家可指挥的出兵口（lane）集合，按官阶定：探马 1 队 / 先锋整前排 / 将军三排 */
    private playerCtlLanes = new Set<number>();
    /** 受控编队当前指令：attack 自动索敌（默认）/ hold 待命（不动，够得着照打） */
    private playerCmd: 'attack' | 'hold' = 'attack';
    /** 玩家键盘移动输入（屏幕方向单位向量；null = 没按） */
    private heroInput: { dx: number; dy: number } | null = null;
    /**
     * 🔴 [2026-10-03] 玩家本人「点地面」下的那道令（点那一下设上，走到就清）。
     * 为什么必须单独记一笔：归队分支与 aimAt **都会改写玩家的目标点**，而光看 `m.tx/m.ty`
     * 分不出这个点是玩家点的还是归队自己设的（拿「离目标还远」近似 → 英雄会一跳一跳跟队）。
     */
    private heroClickOrder: { x: number; y: number } | null = null;
    private heroMan: WarMan | null = null;
    /** 🔴 [2026-09-09 主人定] 玩家阵亡复活倒计时（秒；0=活着/未在倒计时） */
    private heroRespawnTimer = 0;
    /** 本场玩家（本人 + 受控编队）击杀精灵数 */
    private playerKills = 0;

    public hasPlayerHero(): boolean { return this.active && !!this.heroMan; }

    /** 键盘移动：屏幕方向 → 逻辑方向（左右对调时 x 取反） */
    public setHeroInput(v: { dx: number; dy: number } | null): void {
        this.heroInput = v;
        // 松手 = 玩家交还控制权：作废还没走完的点地面那道令，让他回本队队形
        if (!v) this.heroClickOrder = null;
        if (!v && this.heroMan && this.heroMan.hp > 0) { this.heroMan.tx = this.heroMan.x; this.heroMan.ty = this.heroMan.y; }
    }

    /** 点战场地面 → 玩家前往（屏幕坐标 → 逻辑坐标，含左右对调换算） */
    public setHeroMoveToScreen(x: number, y: number): void {
        const m = this.heroMan;
        if (!m || !this.active || m.hp <= 0) return;
        const W = this.canvas?.width ?? window.innerWidth;
        const H = this.canvas?.height ?? window.innerHeight;
        // 渲染是「缩放」，反算即去缩放
        const ux = this.worldCX + (x - W / 2 - this.tacticalPanX) / this.tacticalZoom;
        const uy = this.worldCY + (y - H / 2 - this.tacticalPanY) / this.tacticalZoom;
        [m.tx, m.ty] = this.fieldBound(ux, uy);
        this.heroInput = null;
        this.heroClickOrder = { x: m.tx, y: m.ty };   // 这道令归队与 aimAt 都不许改写，走到才清
    }

    /**
     * 🔴 [2026-09-18 主人报障「待命再自动改后，军队没有移动动作，是平移的」]
     * 待命→自动这一下必须清受控编队的 stuckT，否则人在走、脚不迈（滑步）。
     *
     * 成因：待命期间 step 把目标点钉死（`m.tx = m.x; m.ty = m.y`），兵原地不动 →
     *   净位移判据 netStuck 为真 → `stuckT` 被钉在 STUCK_IDLE_SEC + NET_STUCK_WINDOW = 0.55；
     *   而渲染层那条 `!m.march && m.stuckT > STUCK_IDLE_SEC → set='idle'` **排在 `m.st===0 → 'move'` 前面**，
     *   于是切回自动后位置已经在变、动画却还在播待命帧 = 平移。
     *   stuckT 只能每帧减 dt，从 0.55 降到 0.3 要 0.25s，加上 0.25s 的窗口判定延迟，约半秒滑步。
     *
     * ⚠️ 这是同一个 bug 的**第二次发作**：2026-08-30「部署期结束滑步」已经在 step 里用
     *   `for (const m of this.men) m.stuckT = 0;` 修过一模一样的一次，但只修了部署那条路径。
     *   凡是「让兵成批静止一段时间、再放开」的开关，都要在放开那一帧清 stuckT。
     */
    public setPlayerCommand(cmd: 'attack' | 'hold'): void {
        const prev = this.playerCmd;
        this.playerCmd = cmd;
        if (prev === 'hold' && cmd === 'attack') {
            for (const m of this.men) {
                if (m.hero || this.playerCtlLanes.has(m.lane)) { m.stuckT = 0; m.netT = 0; m.anchorX = m.x; m.anchorY = m.y; }
            }
        }
    }
    public getPlayerCommand(): 'attack' | 'hold' { return this.playerCmd; }

    public getPlayerBattleState(): {
        heroAlive: boolean; heroHp: number; heroMaxHp: number; heroRespawnSec: number;
        controlledLanes: number; controlledMen: number; command: 'attack' | 'hold'; kills: number;
    } | null {
        if (!this.playerSetup || !this.heroMan) return null;
        let controlledMen = 0;
        for (const m of this.men) if (m.hp > 0 && this.playerCtlLanes.has(m.lane)) controlledMen++;
        const f = this.playerSetup.side;
        return {
            heroAlive: this.heroMan.hp > 0 && this.men.includes(this.heroMan),
            heroHp: Math.max(0, this.heroMan.hp),
            heroMaxHp: this.heroMaxHp(this.heroMan.key, f),
            heroRespawnSec: this.heroRespawnTimer,
            controlledLanes: this.playerCtlLanes.size,
            controlledMen,
            command: this.playerCmd,
            kills: this.playerKills,
        };
    }

    /** 战术模式 300 秒倒计时剩余秒数（供玩家面板实时展示） */
    public getRemainingSec(): number {
        return Math.max(0, Math.ceil(BATTLE_LIMIT_SEC - this.battleSec));
    }

    /** 玩家落点（屏幕坐标，含对调）；HUD/镜头用 */
    public getHeroScreenPos(): { x: number; y: number } | null {
        const m = this.heroMan;
        if (!m || m.hp <= 0) return null;
        const W = this.canvas?.width ?? window.innerWidth;
        const H = this.canvas?.height ?? window.innerHeight;
        return { x: W / 2 + this.tacticalPanX + (m.x - this.worldCX) * this.tacticalZoom, y: H / 2 + this.tacticalPanY + (m.y - this.worldCY) * this.tacticalZoom };
    }

    /**
     * start 里布置玩家：自带精锐编队（探马及以上且选了精锐）放在前排之前，玩家再往前一点。
     * 受控编队按官阶：one = 自带精锐（没有就前排第一口）/ front = 整个前排 + 自带精锐 / all = 本方全部口。
     */
    private setupPlayerUnits(init: Scene13WarInit): void {
        this.playerSetup = null;
        this.playerCtlLanes.clear();
        this.playerCmd = 'attack';
        this.heroInput = null;
        this.heroClickOrder = null;
        this.heroMan = null;
        this.heroRespawnTimer = 0;
        this.playerKills = 0;
        const game = (window as any).game;
        const setup: Scene13PlayerSetup | null =
            game?.playerHero?.buildScene13Setup?.(init.followedOnDefenderSide === true) ?? null;
        if (!setup) return;
        const f = setup.side;
        const row0 = this.spawns.filter((s) => s.f === f && s.row === 0);
        if (!row0.length) return;
        const base = this.spawnBases[f] ?? { x: row0[0].x, y: row0[0].y };

        this.playerSetup = setup;

        /* 🔴 [2026-09-18 主人定]「玩家自带精锐顶替编制里的一口，胡说八道，**玩家永远不能改变军团的兵种**。
         *    我什么时候说过替换兵种啦？」—— 整段「玩家精锐顶替编制一口」已删除。
         *
         * 这段是 AI 自己推论出来的，不是主人定的。查 docs/AGENTS/player-rules-verbatim.md 三·二节：
         *   主人原话只有 12a~12e 五条 —— 12a 斥候控制自己 / 12b 探马控制一支军队 /
         *   12c 先锋控制一排军队 / 12d 将军控制全部军队 / 12e 任何时候双方都必须是 9 支军队。
         *   **五条全是「控制权」，没有一个字提到玩家带兵入场或替换兵种。**
         *   12e 说的是「必须 9 支」，AI 却由它推出「那就让玩家精锐顶替一口」，
         *   顺手给了玩家改写军团编制的权力 —— 主人从没这么说过。
         *   （原话表里那段「玩家带精锐入场时精锐顶替编制里的一口」是**表格外的 AI 注解**，已一并改正。）
         *
         * 现在：军团编制在 13 里**原样呈现**，9 口是军团自己的 9 口，玩家一个兵种都不改。
         * 玩家本人照旧以 hero 身份在场（🔴 [2026-10-03] 已按主人令绑到本队 lane，见 setupPlayerUnits：
         * 不再是 lane=-1），按官阶控制军团**现有**的部队。
         * ⚠️ 别再把这段加回来。要动编制必须有主人原话，不能从「必须 9 支」反推出「可以替换」。 */
        // 🔴 [2026-09-07 主人定]「探马控同兵种的一队、先锋控同兵种的一排」。
        //    setup.unitKey = 玩家面板选中的本势力兵种；本方阵中 key 相同的口才归他指挥。
        //    还没学到兵种（unitKey 为 null）→ 退回旧口径：one=自带精锐/前排第一口，front=整个前排。
        const normUnitKey = (k: string) => k.replace(/^elite_/, '').replace(/_elite$/, '');
        const matchKey = (a: string, b: string | null | undefined) =>
            !!b && (a === b || normUnitKey(a) === normUnitKey(b));
        const sameKey = (s: { f: number; key: string }) =>
            setup.unitKey !== null && s.f === f && matchKey(s.key, setup.unitKey);
        for (const s of this.spawns) {
            if (s.f !== f) continue;
            if (setup.control === 'all') this.playerCtlLanes.add(s.lane);
            else if (setup.control === 'front') {
                // 先锋：同兵种的整整一排（该兵种所在的那一排全给他）
                if (setup.unitKey !== null) { if (sameKey(s) && !s.commander) this.playerCtlLanes.add(s.lane); }
                else if (s.row <= 0 && !s.commander) this.playerCtlLanes.add(s.lane);
            }
        }
        if (setup.control === 'one') {
            // 探马：同兵种里挑一队（优先常规 9 队，不抢主将队）
            const pick = this.spawns.find((s) => sameKey(s) && !s.commander)
                ?? this.spawns.find((s) => sameKey(s))
                ?? this.spawns.find((s) => s.f === f && s.row === -1 && !s.commander)
                ?? row0.find((s) => !s.commander)
                ?? row0[0];
            if (pick) this.playerCtlLanes.add(pick.lane);
        }

        this.ensureType(setup.heroKey, f);
        // 🔴 [2026-10-03 主人令]「把玩家也绑上锚点，不然要他乱跑。玩家的兵模是什么就和那一队锚定。」
        // 🔴 [2026-10-15 主人令「乱入者的出兵口，请和他的本队兵一致」]
        //    优先锚定非主将队（!s.commander）的本队兵出兵口（含精锐/普通同名变体，且若探马已选定单队则直接与该队一致），
        //    避免被 row=0 的主将队或同兵种大类（heroCls && row===0）抢到别的排。
        const mySpawns = this.spawns.filter((s) => s.f === f);
        const squadSpawns = mySpawns.filter((s) => !s.commander);
        const ctlPort = this.playerCtlLanes.size === 1
            ? mySpawns.find((s) => this.playerCtlLanes.has(s.lane))
            : undefined;
        let anchorPort = (ctlPort && (matchKey(ctlPort.key, setup.heroKey) || matchKey(ctlPort.key, setup.unitKey)))
            ? ctlPort
            : squadSpawns.find((s) => s.key === setup.heroKey)
                ?? (setup.unitKey ? squadSpawns.find((s) => s.key === setup.unitKey) : undefined)
                ?? squadSpawns.find((s) => matchKey(s.key, setup.heroKey))
                ?? (setup.unitKey ? squadSpawns.find((s) => matchKey(s.key, setup.unitKey)) : undefined)
                ?? ctlPort
                ?? mySpawns.find((s) => matchKey(s.key, setup.heroKey))
                ?? (setup.unitKey ? mySpawns.find((s) => matchKey(s.key, setup.unitKey)) : undefined);
        if (!anchorPort) {
            const heroCls = WAR_TYPES[setup.heroKey]?.cls ?? (setup.unitKey ? WAR_TYPES[setup.unitKey]?.cls : undefined);
            if (heroCls) {
                anchorPort = squadSpawns.find((s) => WAR_TYPES[s.key]?.cls === heroCls)
                    ?? mySpawns.find((s) => WAR_TYPES[s.key]?.cls === heroCls);
            }
        }
        if (!anchorPort) {
            const centerPort = row0.reduce(
                (best, s) => (Math.hypot(s.x - base.x, s.y - base.y) < Math.hypot(best.x - base.x, best.y - base.y) ? s : best),
                row0[0],
            );
            anchorPort = centerPort ?? row0[0] ?? mySpawns[0];
        }

        const inMarch = this.deployT > 0;
        const heroPort = anchorPort;
        // 🔴 [2026-10-15 主人令「乱入者要和相同兵种出兵口的位置保持相同」] 取消 10-13 的「站在第一排正前方」
        //    （原 heroDep = -(半径之和 + 2)，为修「行军晃」把玩家前移）：玩家直接站在**相同兵种出兵口**的位置（dep=0）。
        //    跟队不颤靠 10-13 的 heroFollow 豁免（无敌不吃本队推挤）＋站定清零，与是否前移无关。
        const heroDep = 0;
        let uFwd = this.advanceVec[f]; let hx = heroPort.x - uFwd.x * heroDep;
        let hy = heroPort.y - uFwd.y * heroDep;
        // 🔴 [2026-10-14 主人令「玩家作为守方也要列阵出城」] 守城时站到本队在城外阵里的位置（本队第一排），
        //    与第一波守军一起出生、一起贴墙校正、一起原地待敌（见 spawnTick 的 outsideFirst 与 holdLanes）
        const heroOutside = f === 1 && this.battleType === 'siege' && !!this.deCity && heroPort.outFwd !== undefined;
        if (heroOutside) {
            const B = this.defOutsideBase();
            uFwd = B.fwd;
            hx = B.x + B.fwd.x * (heroPort.outFwd! - heroDep) + B.side.x * heroPort.outSide!;
            hy = B.y + B.fwd.y * (heroPort.outFwd! - heroDep) + B.side.y * heroPort.outSide!;
        }
        const fadeDur = DEPLOY_FADE;
        const hero: WarMan = {
            f, key: setup.heroKey, jx: 0, jy: 0, lane: heroPort.lane, hero: true,
            zid: this.manSeq++,
            x: hx, y: hy, tx: hx, ty: hy,
            hp: this.heroMaxHp(setup.heroKey, f),
            dir: this.dir8(uFwd.x, uFwd.y),
            ph: 0, st: 0, foe: null, next: 0.1,
            fightT: 0, aimT: 0, lock: 0, atkSt: 0, atkFlip: false,
            prevX: hx, prevY: hy, anchorX: hx, anchorY: hy, netT: 0, stuckT: 0, sepX: 0, sepY: 0, y0: hy,
            flag: false, fo: Math.random() * 600,
            march: inMarch && !heroOutside, port: inMarch && !heroOutside ? heroPort : null, dep: heroDep, slotY: 0, pop: 0,
            claims: 0, claimsNext: 0, atkers: 0, atkNext: 0, fadeT: fadeDur, fadeMax: fadeDur,
        };
        this.heroMan = hero;
        this.men.push(hero);
        this.diagPush('playerSetup', { side: f, control: setup.control, lanes: this.playerCtlLanes.size, unitKey: setup.unitKey });
    }

    /** 玩家键盘移动（有输入时接管这一帧：不索敌不出手，只走）。返回 true = 本帧已处理 */
    private stepHeroInput(m: WarMan, dt: number): boolean {
        const inp = this.heroInput;
        if (!inp) return false;
        const spdK = this.terrainSpeedAt(m.x, m.y) * (this.skillFrenzyTimer[m.f] > 0 ? 1.20 : 1.0);
        const spd = this.statsFor(m.key, m.f).spd * spdK;
        const dx = inp.dx;
        const dy = inp.dy;
        const [bx, by] = this.fieldBound(m.x + dx * spd * dt, m.y + dy * spd * dt);
        m.x = bx; m.y = by; m.tx = bx; m.ty = by;
        m.dir = this.dir8Hyst(m.dir, dx, dy);
        m.st = 0;
        m.foe = null;
        m.fightT = 0;
        m.lock = Math.max(0, (m.lock ?? 0) - dt);
        m.stuckT = 0;
        if (m.fadeT > 0) m.fadeT -= dt;
        m.ph += dt * 8;
        return true;
    }

    /**
     * 有人被打到 0 血的唯一出口：玩家落马 → 回本方边缘重整（不留尸、不算兵力）；
     * 其余照常留尸/溃逃，并给玩家（本人或受控编队）记功。
     */
    private onManKilled(victim: WarMan, killer: WarMan): void {
        if (victim.hero) {
            this.heroDown(victim);
            return;
        }
        this.pushCorpse(victim);
        if (this.playerSetup && killer.f === this.playerSetup.side
            && (killer.hero || this.playerCtlLanes.has(killer.lane))) {
            this.playerKills++;
            this.playerSetup.onKill(!!killer.hero);
        }
    }

    /** 玩家本人的最大血量：兵种血 × HERO_HP_MULT。出生 / 落马重整 / HUD 血条上限只准走这里，别再各写各的。 */
    private heroMaxHp(key: string, f: number): number {
        return Math.max(1, Math.round(this.statsFor(key, f).hp * HERO_HP_MULT));
    }

    private heroDown(m: WarMan): void {
        if (this.heroRespawnTimer > 0) return; // 正在倒计时复活中，防重复触发
        m.hp = 0;
        this.pushCorpse(m);
        this.heroRespawnTimer = 10;
        this.heroInput = null;
        this.playerSetup?.onHeroDown();
        this.diagPush('heroDown', { sec: +this.battleSec.toFixed(1) });
    }

    /** 🔴 [2026-09-09 主人定] 阵亡 10 秒后复活：在本方后方重生并重置满血 */
    private respawnHero(): void {
        const m = this.heroMan;
        if (!m || !this.playerSetup) return;
        // 🔴 [2026-10-11 AA #9 后半 属实] 复活点原先写死「屏幕最左/最右」(mx*0.6 / vw − mx*0.6)，
        //    八方向/南北向战场里方向全错（主人早先报「乱入者复活不出现在出兵口」就是它）。
        //    现在跟随**本方八方向基座** spawnBases[m.f]（与出兵口同一处），不再用屏幕边。
        const _port = (m.lane >= 0 ? this.spawns[m.lane] : undefined) ?? this.spawnBases[m.f] ?? { x: this.worldCX, y: this.worldCY };
        const [x, y] = [_port.x, _port.y];
        m.hp = this.heroMaxHp(m.key, m.f);
        m.x = x; m.y = y; m.tx = x; m.ty = y; m.prevX = x; m.prevY = y; m.anchorX = x; m.anchorY = y;
        m.dir = this.dir8(this.advanceVec[m.f].x, this.advanceVec[m.f].y);   // 🔴 [2026-10-11 主人「复活点还保留旧13？全删」] 朝向随本方八方向推进向量，不再写死左右(2/6)
        m.foe = null; m.lock = 0; m.st = 0; m.fightT = 0; m.stuckT = 0; m.kiting = false;
        m.fadeT = 2; m.fadeMax = 2;
        this.heroInput = null;
        if (!this.men.includes(m)) {
            this.men.push(m);
        }
        this.diagPush('heroRespawn', { sec: +this.battleSec.toFixed(1) });
    }

    /** [2026-08-19 主人需求] 13 战斗退出按钮（点击后按当前兵力比自动结算战果，走 onDecision 通道） */
    private exitBtn: HTMLButtonElement | null = null;

    /** 🔴 [2026-10-08 主人「请给战术模式添加用鼠标滚轴可以使战场画面缩放功能」] 战术模式战场画面缩放比例（1~2.5；1 = 基础画面，只许放大不许拉远，2026-10-08 主人定） */
    private tacticalZoom = 1.0;
    /** 🔴 [2026-10-08 主人「战术模式放大后，可以拖拽镜头视角」] 放大后的镜头平移（屏幕像素，相对屏幕中心；缩放为 1 时恒为 0） */
    private tacticalPanX = 0;
    private tacticalPanY = 0;
    public perfStats = {
        decorTotal: 0,
        decorDrawn: 0,
        decorCulled: 0,
        tGL: 0,
        tCull: 0,
        tSort: 0,
        tDrawDecor: 0,
        tDrawUnits: 0,
        tTotal: 0,
    };
    /** 把平移卡在「放大后的画面不露边」的范围内 */
    private clampTacticalPan(): void {
        const cv = this.canvas;
        if (!cv) { this.tacticalPanX = 0; this.tacticalPanY = 0; return; }
        const mapW = TAC_MAP_HALF_W * 2, mapH = TAC_MAP_HALF_H * 2;
        const limX = Math.max(0, (mapW * this.tacticalZoom - cv.width) / 2);
        const limY = Math.max(0, (mapH * this.tacticalZoom - cv.height) / 2);
        this.tacticalPanX = Math.max(-limX, Math.min(limX, this.tacticalPanX));
        this.tacticalPanY = Math.max(-limY, Math.min(limY, this.tacticalPanY));
    }

    /** 挂到 body（全屏透明 canvas，叠在地图 DOM 之上；透明像素不遮挡地图，只画精灵） */
    public attach(): void {
        if (this.canvas) return;
        const cv = document.createElement('canvas');
        cv.style.cssText = 'position:fixed;inset:0;z-index:400;pointer-events:none;display:none;';
        cv.width = window.innerWidth;
        cv.height = window.innerHeight;
        document.body.appendChild(cv);
        this.canvas = cv;
        this.ctx = cv.getContext('2d', { alpha: true });

        // M3 WebGL 地面层底层画布（挂在士兵画布下面，z-index: 390）
        const glCv = document.createElement('canvas');
        glCv.style.cssText = 'position:fixed;inset:0;z-index:390;pointer-events:none;display:none;';
        glCv.width = window.innerWidth;
        glCv.height = window.innerHeight;
        document.body.appendChild(glCv);
        this.glCanvas = glCv;

        this.ground = document.createElement('canvas');
        this.ground.width = TAC_MAP_HALF_W * 2;
        this.ground.height = TAC_MAP_HALF_H * 2;
        this.groundCtx = this.ground.getContext('2d', { alpha: true });
        // [2026-09-10 主人需求] 战术模式右上角退出战斗按钮已删除/移入战术模式玩家面板（PlayerScene13Control）
        const onResize = () => {
            if (!this.canvas) return;
            this.restoreStrategyMap();
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            if (this.glCanvas) {
                this.glCanvas.width = this.canvas.width;
                this.glCanvas.height = this.canvas.height;
                this.groundLayerGL?.resize(this.canvas.width, this.canvas.height);
            }
        };
        window.addEventListener('resize', onResize);

        // 🔴 [2026-10-08 主人「请给战术模式添加用鼠标滚轴可以使战场画面缩放功能」]
        const onWheel = (e: WheelEvent) => {
            if (!this.active && !this.lingering) return;
            if ((window as any).game?.combatUI?.isCorrectorOpen?.()) return;
            // 只认战场地面（13 画布 pointer-events:none，滚轮落在底下的地图容器上）；面板/列表照常滚动
            const t = e.target as HTMLElement | null;
            // 🔴 战术期间 #map 被盖成 visibility:hidden，不参与命中测试，滚轮的 target 实测是 BODY/HTML —— 也要放行
            if (!t || !(t === document.body || t === document.documentElement || t.id === 'map' || t.closest('#map') || t.tagName === 'CANVAS')) return;
            e.preventDefault();
            e.stopPropagation();   // 捕获阶段拦下，底下的 Leaflet 战略地图不许跟着缩放
            const zoomDelta = -e.deltaY * 0.0015;
            const nextZoom = this.tacticalZoom * Math.exp(zoomDelta);
            const minZoom = this.useGroundGL ? 0.45 : 1.0;
            this.tacticalZoom = Math.max(minZoom, Math.min(2.5, nextZoom));
            this.userInteractingTimer = 9.0;
            this.clampTacticalPan();
        };
        window.addEventListener('wheel', onWheel, { passive: false, capture: true });

        // 🔴 [2026-10-08 主人「战术模式放大后，可以拖拽镜头视角」] 放大后按住左键拖动平移；目标判定同滚轮（战术期间 #map 隐藏，命中 BODY）
        let dragging = false;
        let lastX = 0, lastY = 0;
        const onDown = (e: MouseEvent) => {
            const canDrag = this.useGroundGL || this.tacticalZoom > 1.001;
            if (e.button !== 0 || !this.active || !canDrag) return;
            const t = e.target as HTMLElement | null;
            if (!t || !(t === document.body || t === document.documentElement || t.id === 'map' || t.closest('#map') || t.tagName === 'CANVAS')) return;
            dragging = true; lastX = e.clientX; lastY = e.clientY;
            this.userInteractingTimer = 9.0;
            document.body.style.cursor = 'grabbing';
            e.preventDefault();
        };
        const onMove = (e: MouseEvent) => {
            if (!dragging) return;
            this.userInteractingTimer = 9.0;
            this.tacticalPanX += e.clientX - lastX;
            this.tacticalPanY += e.clientY - lastY;
            lastX = e.clientX; lastY = e.clientY;
            this.clampTacticalPan();
        };
        const onUp = () => {
            if (!dragging) return;
            dragging = false;
            document.body.style.cursor = '';
        };
        window.addEventListener('mousedown', onDown, { capture: true });
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        window.addEventListener('blur', onUp);
    }

    public isActive(): boolean {
        return this.active;
    }

    /**
     * 演出的实时兵力（人，不是精灵）：场上活着的 + 出兵口没出的，1 精灵 = SPRITE_TROOPS 兵。
     * 供战斗面板显示用 —— 13 期间引擎被冻结，`unit.troops` 是不动的，
     * 面板不接这里就会出现「屏幕上人一直在死、血槽数字纹丝不动」（主人 2026-08-11 提）。
     */
    public getLiveTroops(): { attacker: number; defender: number } | null {
        // 🔴 残局待命（active=false、lingering=true）也必须继续供数，否则战斗一结束
        //    面板会瞬间掉回引擎那套冻结数值 —— 观感就是「数字突然换了个来源」（主人 2026-08-12 实锤）。
        if (!this.active && !this.lingering) return null;
        // 🔴 按人口加权：象/车 1 精灵 = 2 个兵额、炮 = 3。不加权的话象类文化的兵力会凭空缩水。
        const n = [0, 0];
        for (const sp of this.spawns) n[sp.f] += Math.max(0, sp.pool) * sp.pop;
        for (const m of this.men) if (m.hp > 0) n[m.f] += m.pop;
        return { attacker: Math.round(n[0] * SPRITE_TROOPS), defender: Math.round(n[1] * SPRITE_TROOPS) };
    }

    /**
     * 开局总兵力（人），供战斗面板算演出进度用（已消耗占比 → 三幕节奏）。
     * 🔴 引擎在 13 期间是冻结的，`elapsed` 恒为 0，面板不能再用它算进度 —— 见 CombatUI 的说明。
     */
    public getInitialTroops(): { attacker: number; defender: number; total: number } | null {
        if (!this.active && !this.lingering) return null;
        const a = Math.round(this.initPool[0] * SPRITE_TROOPS);
        const d = Math.round(this.initPool[1] * SPRITE_TROOPS);
        return { attacker: a, defender: d, total: a + d };
    }

    /**
     * [军事科技] 取某兵种完整数据：基础档 + 该方（f = 0 攻 / 1 守）已解锁科技。
     * 🔴 每方按自己文化区 + 当前年份算（同一兵种攻守双方数值可能不同）。
     * 🔴 返回新对象、绝不原地改 WAR_TYPES（就地改会逐场累积爆表）。分表缓存，一年才失效一次。
     */
    private statsFor(key: string, f: number): WarType & { sight?: number } {
        // 城墙/城门建筑：直接返回 DE 属性（不走科技/文化，建筑不吃兵种科技加成）
        const wall = WALL_GATE_STATS[key];
        if (wall) return wall;
        const y = this.techYearGetter?.() ?? this.techYear;
        if (y !== this.techYear) this.onTechYearChanged(y);
        let v = this.techStats[f].get(key);
        if (!v) {
            const base = WAR_TYPES[key] ?? WAR_TYPES.light_infantry;
            const techs = selectLegionTechs(y, this.sideCulture[f] as RegionType, this.sideFaction[f]);
            v = applyTechsToStats(base, key, techs, SIGHT_MAP[key] ?? 160);
            // 🔴 [2026-08-31] 八环质量优势分给血量的那一半（见 start() 的拆分说明）。
            //    挂在这里而不是 spawn 处，是为了让**所有**读血的地方自动一致 ——
            //    出兵初始血（`hp: statsFor(...).hp`）和索敌里「目标快死了就不换人」用的
            //    `foeMax`（statsFor(foe).hp）必须同基准，只改 spawn 会让半血判定提前触发。
            //    sideHpMult 在 start() 里先于 techStats 重建赋值，所以这里读到的一定是本场的值。
            //    ⚠️ 城墙/城门走上面 WALL_GATE_STATS 提前 return，**不吃**这个加成（建筑不属于谁带的兵）。
            if (this.sideHpMult[f] !== 1) v = { ...v, hp: Math.max(1, Math.round(v.hp * this.sideHpMult[f])) };
            this.techStats[f].set(key, v);
        }
        return v;
    }

    /** [军事科技] 跨年：重建双方分表。🔴 播报不在这里——已挪 TimeSystem 年变回调（挂 13 循环会漏掉绝大多数解锁年份） */
    private onTechYearChanged(year: number): void {
        this.techYear = year;
        this.techStats = [new Map(), new Map()];
    }

    /**
     * [军事科技] 双方各自已解锁的科技名（13 战斗面板「科技行」用；表顺序）。
     * 每方按自己文化区 + 当前年份算——同一时刻双方科技树可能不同（门控），观众一目了然。
     */
    public getSideTechs(): { attacker: MilitaryTech[]; defender: MilitaryTech[] } | null {
        if (!this.active && !this.lingering) return null;
        const year = this.techYearGetter?.() ?? this.techYear;
        // 🔴 必须返回**完整科技对象**：面板要用 `effects` 汇总数值。
        //    2026-08-18 曾返回精简的 {id,name}，`summarizeTechEffects` 遍历 t.effects 当场抛
        //    `t.effects is not iterable`，整个 updateStats 中断 → 面板什么都不显示（主人实锤「科技呢，去哪了」）。
        //    当时用 `as never` 把类型错误压掉了，tsc 不报、运行时每帧炸。别再压类型。
        // 🔴 [性能 2026-08-18] 面板每帧都调这里，而 unlockedTechs 每次都 filter 一遍并**新建数组**。
        //    科技只随「跨年」变，按年缓存即可 —— 每帧两次数组分配纯属白烧（600 兵的战场上
        //    每一点每帧开销都要算清，见 perfStep/perfRender 探针）。
        if (this.techListYear !== year || !this.techListCache) {
            this.techListYear = year;
            this.techListCache = {
                attacker: selectLegionTechs(year, this.sideCulture[0] as RegionType, this.sideFaction[0]),
                defender: selectLegionTechs(year, this.sideCulture[1] as RegionType, this.sideFaction[1]),
            };
        }
        return this.techListCache;
    }

    /** 战斗开始 → 初始化出兵口（编制槽位派生）+ 开始加载素材 */
    public start(init: Scene13WarInit): void {
        this.diagT0 = performance.now();
        this.perfStep = [];
        this.perfRender = [];
        this.perfFrames = 0;
        this.diagEvents = [];
        this.diagSent = false;
        this.diagPush('start', {
            att: init.attackerTroops, def: init.defenderTroops,
            attR: init.attackerRegion, defR: init.defenderRegion,
            attB: init.attackerBonus, defB: init.defenderBonus,
            type: init.battleType ?? 'field',
        });
        this.attach();
        // 🔴 [2026-10-02 主人定] 进战术模式不强制掐断当前 BGM（推翻 9-16 换场景强切歌，回归「BGM 完整循环播放、不被换场景强行掐断」铁律）
        // 让大地图正听着的史诗 BGM 自然流淌进战术战场，彻底消除进场切歌造成的静音真空；仅在压根没有音乐在播时才起一首
        if (!audioManager.isBgmPlaying()) {
            audioManager.rerollBgm();
        }
        this.active = true;
        this.over = false;
        this.centerKilledAt = -1;
        this.spawns = [];
        this.men = [];
        this.corpses = [];
        this.fleers = [];
        this.arrows = [];
        this.slashes = [];
        this.sparks = [];
        this.fxs = [];
        this.fallenFlags = [];
        this.clouds = [];
        this.clearGround();
        this.restoreStrategyMap();
        this.cancelCanvasFade();    // 上一场的淡出还没走完就开新一场：画布回到满不透明、正常大小
        this.flushPanelRestore();   // 上一场延后的面板还原先做掉，再让下面的 onEnter 记「进场前状态」
        // [2026-08-16 修·进 13 闪旧尸体] 主画布同步清空：stop 只隐藏 canvas 不清内容，
        // start 后素材加载期 pending>0 → tick 不 render，会把上一场最后一帧（含尸体）亮出来。
        if (this.ctx && this.canvas) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.tacticalZoom = 1.0;
        this.tacticalPanX = 0; this.tacticalPanY = 0;
        this.useGroundGL = false;
        if (this.glCanvas) this.glCanvas.style.display = 'none';
        this.clearDeCity();
        this.bank = {};
        this.bankSides.clear();
        this.deferredAssetLoads = [];
        this.pending = 0;
        this.assetGen++;             // 上一场在途素材的回调从此不再加减本场 pending（见 assetGen）
        this.pendingStartedAt = 0;   // 防死锁计时重置（新战斗重新计 30s）
        this.battleSec = 0;          // 本场计时归零（HARD_STOP_SEC / NO_KILL_SEC 都按它算）
        this.lastKillSec = 0;
        this.stallReported = false;
        this.assetsReadyOnce = false;
        this.enemyCen = [null, null];
        this.gm = new Map();
        this.gr = new Map();
        this.gs = new Map();
        this.laneTargets.clear();
        this.last = performance.now();

        const cv = this.canvas;
        if (cv) {
            cv.style.display = 'block';
            // 🔴 [2026-10-03 主人「添加一个丝滑进场」] 原来是画布一显示、第一帧画出整张战场底图，在战略地图上「啪」地盖上去。
            //    现在先置为全透明 + 略缩（scale 0.96），等 render() 第一次真正画出来才淡入并归位（见 beginEntryFade）。
            this.prepareEntryFade(cv);
        }
        // [2026-08-19 主人需求] 战斗开始 → 显示退出按钮（13 演出期间可见）
        if (this.exitBtn) this.exitBtn.style.display = 'block';

        // [2026-08-16 主人需求] 进入 13 战斗模式后，军团面板和军情面板自动收起（记录状态供退出时还原）
        const game = (window as any).game;
        game?.cameraFollowUI?.onEnterBattleScene13?.();
        game?.brawlFeedPanel?.onEnterBattleScene13?.();
        this.initScene13SkillSystem(init);
        // 🔴 [2026-08-26 主人定] 战术模式专用 UI 布局：立绘分置左下/右下，血槽在上，科技在下
        game?.combatUI?.syncScene13WarStart?.(init);

        // [2026-08-11 势力本色] 攻守双方交给主游戏的 SpriteTinter 按 factionId 染色，
        // 与地图上的军团、旗帜、领土同一套色，不另起炉灶。
        const nextFaction: [string, string] = [
            init.attackerFactionId ?? '',
            init.defenderFactionId ?? '',
        ];
        // 🔴 换势力必须清素材缓存：bank 里存的是**已染色**的帧，上一场的颜色会带到下一场
        if (nextFaction[0] !== this.sideFaction[0] || nextFaction[1] !== this.sideFaction[1]) {
            this.bank = {};
            this.pending = 0;
            this.assetGen++;
        }
        this.sideFaction = nextFaction;
        /**
         * 🔴 [2026-08-31 主人定] 八环质量优势**拆两半**：一半走伤害、一半走血量。
         *
         * 背景：`getScene13PowerBonus()` 给的 k 原来**全部**乘在伤害上
         *      （`o.hp -= dps * sideBonus[...]`），双方血池完全一样 ——
         *      于是名将侧只是「杀得更快」，并不「更耐打」，观感上就是不显灵。
         *      而主人实测定论是**血才是主导变量**。
         *
         * 拆法：伤害 ×k^(1−share)、血量 ×k^share，两者相乘仍是 **k**。
         *      也就是说**总战力一分没多、没少**，只是把同一份优势换了一半的兑现方式，
         *      所以八环依然「诚实」（这点很重要：注释里记着 2026-08-13 试过 ^0.75 超发被主人否，
         *      理由正是「八环不诚实、悬念变少」——本次拆分不碰总量，不属于超发）。
         * share = 0.5 即对半分。要全走伤害（回到旧行为）把它设 0。
         */
        const SCENE13_HP_SHARE = 0.5;
        const kAtt = Math.max(0.01, init.attackerBonus ?? 1);
        const kDef = Math.max(0.01, init.defenderBonus ?? 1);
        this.sideBonus = [
            Math.pow(kAtt, 1 - SCENE13_HP_SHARE),
            Math.pow(kDef, 1 - SCENE13_HP_SHARE),
        ];
        this.sideHpMult = [
            Math.pow(kAtt, SCENE13_HP_SHARE),
            Math.pow(kDef, SCENE13_HP_SHARE),
        ];
        this.battleType = init.battleType ?? 'field';
        this.defenderCityType = init.defenderCityType ?? null;
        this.defenderCityId = init.defenderCityId ?? null;
        if (init.passMountainConfig) {
            this.passMountainConfig = { ...this.passMountainConfig, ...init.passMountainConfig };
        }
        // 🔴 [2026-09-11 主人「和游戏同步」] 守方据点建筑风格：与战略地图同一解析源（只算一次，存起来）
        this.defenderMapStyle = (() => {
            const c: any = this.defenderCityRecord();
            if (!c) return null;
            return resolveCityDeBuildingStyle(c.id, c.type, c.region, c.lat, c.lng, c.buildingStyle);
        })();
        // [2026-08-31 主人定] 跟随军团在守方侧（回援守城）→ 攻守两侧左右对调，跟随军团固定左边。
        // 攻城战守方破墙前待命（近战不动、远程原地射击）；破墙联动倒塌 → 守方开始反击（2026-08-22 主人定）
        // 🔴 [2026-09-03 主人定] 城寨(stockade)与野战一致：守方不待命，直接开战。
        // 🔴 [2026-09-19 主人定] 漠北蒙古风格(MOBEI_MONGOL)和城寨野战一样：直接开战，守方不待命。
        this.siegeWithWalls = this.battleType === 'siege' && this.defenderCityType !== 'stockade' && !this.isMobeiMongolDefender();
        this.wallAutoCollapsed = false;   // 每场重新计（30 秒「全场非墙装饰去碰撞」那一下，见 step）
        this.nextWallGapSec = 10;         // 🔴 [2026-10-15 主人令] 受伤城墙自动坍塌：每 10 秒塌一处，每场重新起算
        // [2026-08-31] 本地名将加成已删（名将/精锐都走八环唯一通道，见 dmgVs 上方说明）。
        // [军事科技] 双方文化区 + 年份来源 + 分表重置（新一场战斗按当前年份重算，不沿用旧缓存）
        // 🔴 [2026-08-19] 双方兜底同为 CENTRAL：上游 GameAppCombatHooks 已按战场坐标兜过一次，
        //    这层只防 init 缺字段。绝不能像原来那样守方兜 'STEPPE' —— 攻守用两套不同的兜底，
        //    会让「同一文化区互攻」在面板上显示成两份完全不同的科技表（主人 2026-08-19 报障）。
        this.sideCulture = [init.attackerRegion || 'CENTRAL', init.defenderRegion || 'CENTRAL'];
        this.techYearGetter = init.getYear ?? null;
        this.techYear = this.techYearGetter?.() ?? GameConfig.TIME.TIMELINE_START_YEAR;
        this.techStats = [new Map(), new Map()];
        this.batchCd = 0;
        this.deployT = DEPLOY_SECS;
        this.marching = true;    // 待命结束后进入列阵推进（见 MARCH_REL）
        this.meleeContactCount = 0;      // 每场重置：下一场重新等近战接上才起循环音景
        this.meleeQuietSec = 0;
        this.contactSfxOn = false;
        this.adv = [0, 0];
        this.centerLat = init.centerLat;
        this.centerLng = init.centerLng;
        this.attackerGeneralId = init.attackerGeneralId ?? null;

        try {
            // 攻守各一侧：row 0 最靠中线（攻方在左、守方在右）
            const sides: { region: string; troops: number; f: 0 | 1; factionId?: string | null; generalId?: string | null; hasElite: boolean }[] = [
                { region: init.attackerRegion, troops: init.attackerTroops, f: 0, factionId: init.attackerFactionId, generalId: init.attackerGeneralId, hasElite: !!init.attackerEliteName },
                { region: init.defenderRegion, troops: init.defenderTroops, f: 1, factionId: init.defenderFactionId, generalId: init.defenderGeneralId, hasElite: !!init.defenderEliteName },
            ];
            const VW = cv?.width ?? 1920;
            const VH = cv?.height ?? 1080;
            this.worldCX = VW / 2;
            this.worldCY = VH / 2;
            // 🔴 [2026-10-11 主人「攻击方的10个出兵点，都拥挤在一起」]
            //    纵深与横向间隔彻底拉开，相邻方阵预留通行间隔，杜绝拥挤踩踏
            // 🔴 [2026-10-11 主人令「我要方阵，不要一条线」] 三排排距收紧（原 200~240 让全军摊得太开，像一条线）
            const depth = ROW_DEPTH;
            this.rowDepth = depth;

            // 🔴 [CC 裁定] 野战八方向出兵
            // 🔴 [2026-10-11 主人「攻击方出现在地图的攻击方向，防守方在地图的中间」「城池在中心，样式和战略地图一致」]
            //    攻城战同走八方向：城池＝战略地图同款建筑栈，摆在地图正中；攻方从真实来向出现。
            if (this.battleType === 'siege') {
                const rec: any = this.defenderCityRecord();
                const city: any = rec
                    ? { ...rec, latitude: rec.latitude ?? rec.lat, longitude: rec.longitude ?? rec.lng, type: this.defenderCityType ?? rec.type }
                    : { id: this.defenderCityId || 'siege_city', name: '城池', type: this.defenderCityType || 'medium_city', region: init.defenderRegion || 'CENTRAL', factionId: init.defenderFactionId ?? null, latitude: init.defenderCityLat ?? init.centerLat ?? 30, longitude: init.defenderCityLng ?? init.centerLng ?? 110 };
                // 🔴 [2026-10-11 主人「城池在中心，样式和战略地图一致」]
                //    战术攻城战守方据点同步生成战略地图同款建筑栈，确保 initWar 立即就绪，彻底避免异步延迟导致 fallback 进旧 13 左右布阵与残垣旧墙
                // 🔴 [2026-10-11 主人令「你先把所有都改为1.0」] 走 **DE 原生像素**版：件表按素材原生像素
                //    逐类（建筑）/逐件（墙·门·垛·箭塔）定宽；尺寸来自构建期常量表 `DE_SPRITE_BOX_W`，**同步可取**。
                //    必须是同步的：异步会让城池件表晚于「出兵口布阵」就绪 ⇒ 八方向出兵整支落到旧 13 回退阵型
                //    （实测八个方向基座恒为 512,450）。战略地图那条路不传原生表，一个像素不动。
                this.deCity = city ? strategicCityHtmlNative(city) : null;
                this.deCityCenter = { x: this.worldCX, y: this.worldCY };
            }
            {
                const centerLat = init.centerLat || 30;
                const centerLng = init.centerLng || 110;
                const attFromLat = init.attackerFromLat || centerLat;
                const attFromLng = init.attackerFromLng || (centerLng - 1);
                const defFromLat = init.defenderFromLat;
                const defFromLng = init.defenderFromLng;
                {
                    // 🔴 [2026-10-11 主人报「军团从东北杀来，为什么战术模式中，攻方出现在西方？」]
                    //    八方向派生的**原点必须是城**，不是战场中心：本层把城摆在屏幕正中
                    //    （`deCityCenter = 世界中心 worldCX/CY`），而 `init.centerLat/Lng` 是**跟拍军团的渲染中心**
                    //    （`battleSceneTarget` → `getRenderedCenter(跟随单位.id)`，攻城外推后离城十几到几十公里）。
                    //    实测一场真机攻城战：城 43.76,11.25 ｜ center 43.6798,11.4807（离城 20.6km）
                    //    ｜ 攻方 43.6793,11.4814（在城南 20.7km，与 center 同一格）。
                    //    拿 center 当原点算出来的「来向」与「城→来处」差出一大截，`planSpawns` 再按这个方向
                    //    把攻方基座摆到原点外 1500~2000px ⇒ 攻方整支落到城的**另一侧**，看着就是
                    //    「东北杀来、出现在西边」。改成用被攻据点的坐标当原点，与 `spawnPlan.mjs`
                    //    头注「方位角由战场中心（＝城）→该军来处算出」同一口径。
                    const planCenter = (this.deCity && typeof init.defenderCityLat === 'number' && typeof init.defenderCityLng === 'number')
                        ? { lat: init.defenderCityLat, lng: init.defenderCityLng }
                        : { lat: centerLat, lng: centerLng };
                    const plan = planSpawns({
                        center: planCenter,
                        attackerFrom: { lat: attFromLat, lng: attFromLng },
                        defenderFrom: defFromLat && defFromLng ? { lat: defFromLat, lng: defFromLng } : null,
                        battleType: this.deCity ? 'siege' : 'field',
                        // 🔴 [2026-10-11 主人令] 新战术模式只做陆战，**不许设计任何不可通行区域**：
                        //    水、树林、建筑、悬崖一律可通行 ⇒ 不再传 walkableAt（默认判定只挡出图，
                        //    见 systems/battlefield/spawnPlan.mjs 的 LAND_WAR_ALL_PASSABLE）。
                    });
                    // 🔴 [2026-10-11 AA 把底图改为「16:9 满铺矩形」(每格 64×32、中心 (60,60))] 出兵基座同步换矩形映射，
                    //    否则出兵口仍按旧等距菱形落位 ⇒ 位置错、uFwd/uSide 跟着歪（主人「重新整理出兵口位置」）。
                    //    🔴 [2026-10-12] 每格 64×32 → TAC_TILE_W×TAC_TILE_H（96×48，与 spawnPlan.cellFromOffset 同步）
                    let attSX = this.worldCX + (plan.attacker.x - 60) * TAC_TILE_W;
                    let attSY = this.worldCY + (plan.attacker.y - 60) * TAC_TILE_H;
                    if (this.deCity) {
                        // 攻城战：攻方沿来向退到城外，退到「地图还装得下」为止。
                        // 🔴 [2026-10-11 主人裁定「走甲：把基座夹进地图内」＋「请用专业游戏的方式执行」
                        //    ＋ 2026-10-10「攻城战城池稳居正中心」]
                        //    三条硬约束，按优先级：
                        //      ① 九口必须全在图内（菱形世界，斜向最紧）；
                        //      ② 攻方营地不得压进城池的菱形地面（否则营帐插在城墙上）；
                        //      ③ 在满足①②的前提下，尽量保持野战同款的 700px 攻城距（城半径＋700）。
                        //    ⇒ 由于城池原生尺寸很大（小城 2408×2073），「八向等距」与①②在这张 120×120 图上
                        //      不可兼得（八向等距上限 1335px，而东西向要 1524px 才不压城）——
                        //      按 DE 场景的做法让**距离随来向变**（攻方贴着自己那侧的图边列阵），
                        //      所以这里改成**按方向取安全半径**，而不是八向取同一个最小值。
                        const ux = attSX - this.worldCX, uy = attSY - this.worldCY, ul = Math.hypot(ux, uy) || 1;
                        const nx = ux / ul, ny = uy / ul;
                        const rx = this.deCity.width / 2, ry = this.deCity.height / 2;
                        const cityR = Math.hypot(rx, ry);
                        const safe = this.spawnRingSafeRadius(nx, ny);              // ①该方向能退多远
                        const cityEdge = 1 / (Math.abs(nx) / rx + Math.abs(ny) / ry); // 城菱形在该方向的边界
                        const need = cityEdge + 320;                                // ②营地纵深+余量
                        // 🔴 [2026-10-13 主人令「攻方营地离城寨太近了。请远一点」]
                        //    城寨尺寸紧凑，原 cityR+700 导致攻方营帐离栅栏过近；城寨攻城距提升至 cityR+1300（保底 2100px），大幅拉开扎营纵深
                        let siegeBaseDist = Math.max(cityR + 1300, 2100);   // 🔴 [2026-10-13 主人令] 不再只限城寨：所有攻城战都拉远
                        // 🔴 [2026-10-14 主人令「第一波直接在城外列阵出生」] 守方第一波在城外列阵（见 defOutsideBase），攻方得再退，
                        //    让两军最前沿之间留出约 SIEGE_FIELD_GAP 的空地（实测不退时只剩 65~106px，一开场就贴脸）。
                        //    守方前沿＝城外框外缘＋墙隙＋排距＋口后纵深＋前排与主将队（2 排距）；攻方前沿在基座前 2 排距（主将队）。
                        const boxEdge = Math.max(Math.abs(nx) * rx, Math.abs(ny) * ry);
                        siegeBaseDist = Math.max(siegeBaseDist, boxEdge + DEF_WALL_GAP + depth + 180 + 2 * depth + SIEGE_FIELD_GAP + 2 * depth);
                        let dist = Math.min(siegeBaseDist, safe);                     // ③先取攻城距
                        if (dist < need) dist = Math.min(need, safe);               // ②不够就退到不压城（但仍不越图）
                        attSX = this.worldCX + nx * dist;
                        attSY = this.worldCY + ny * dist;
                    }
                    const defSX = this.worldCX + (plan.defender.x - 60) * TAC_TILE_W;
                    const defSY = this.worldCY + (plan.defender.y - 60) * TAC_TILE_H;
                    this.spawnBases = [{ x: attSX, y: attSY }, { x: defSX, y: defSY }];
                    const fwdDx = defSX - attSX, fwdDy = defSY - attSY;
                    const fwdLen = Math.hypot(fwdDx, fwdDy) || 1;
                    const uFwd0 = { x: fwdDx / fwdLen, y: fwdDy / fwdLen };
                    const uSide0 = { x: -uFwd0.y, y: uFwd0.x };
                    const uFwd1 = { x: -uFwd0.x, y: -uFwd0.y };
                    const uSide1 = { x: -uSide0.x, y: -uSide0.y };
                    this.advanceVec = [uFwd0, uFwd1];
                    this.sideVec = [uSide0, uSide1];
                    // 🔴 [2026-10-10 主人「现在是中间放城池，明白了吗」]
                    //    攻城战城池稳居正中心（世界中心 worldCX/CY），镜头默认居中对齐城池；野战才居中于两军中点
                    if (this.deCity || this.battleType === 'siege') {
                        this.tacticalPanX = 0;
                        this.tacticalPanY = 0;
                    } else {
                        const midSpawnX = (attSX + defSX) / 2;
                        const midSpawnY = (attSY + defSY) / 2;
                        this.tacticalPanX = (this.worldCX - midSpawnX) * this.tacticalZoom;
                        this.tacticalPanY = (this.worldCY - midSpawnY) * this.tacticalZoom;
                        this.clampTacticalPan();
                    }
                }
            }

            for (const side of sides) {
                const lanes = this.slotsOf(side.region, side.factionId, side.generalId, side.hasElite, side.f);
                const n = lanes.length;
                const mode = this.formationModeOf(side.region, side.factionId, side.generalId, side.f);
                // 🔴 前中后固定（主人 2026-08-15 定）：不再随机换序，出兵口顺序 = 编制槽位展开序
                //    （鱼鳞 步骑弓 / 三角 近战+远程+近战 / 雁行 远程+近战+远程）。
                const lanes2 = lanes;
                // 兵力按总量平分到各口（1 精灵 = SPRITE_TROOPS 兵；口少的一边每口出得快）
                const poolPer = Math.max(1, Math.round(side.troops / SPRITE_TROOPS / n));
                lanes2.forEach((lane, idx) => {
                    const key = lane.key;
                    this.ensureType(key, side.f);
                    if (this.statsFor(key, side.f).rng > 65) this.ensureProj(PROJ_TYPE[key] ?? 'PROJ_ARROW');
                    if (FIRE_LANCER_TYPES.has(key)) this.ensureProj('PROJ_SHOT');   // 火矛手充能喷火用
                    let x: number, y: number;
                    let outFwd: number | undefined, outSide: number | undefined;
                    // 阵位：DE 自动排布（开关见 DE_FORMATION_LAYOUT）｜关掉即回到七种经典阵型的 LAYOUT 表
                    const cell = idx >= 9
                        ? COMMANDER_CELL[mode]
                        : DE_FORMATION_LAYOUT
                            ? (this.deFormationCells(lanes2, mode)[idx] ?? LAYOUT[mode][idx])
                            : LAYOUT[mode][idx];
                    {
                        const base = this.spawnBases[side.f];
                        const uFwd = this.advanceVec[side.f];
                        const uSide = this.sideVec[side.f];
                        const forwardOffset = (1 - cell.row) * depth;
                        // 🔴 [2026-10-11 主人「攻击方的10个出兵点，都拥挤在一起」]
                        //    相邻方队横向间隔由局促的 110px 彻底拉开至 210~240px，方阵左右舒展不重叠
                        const colSpacing = COL_SPACING;
                        let sideOffset = (cell.col - (cell.cols - 1) / 2) * colSpacing;
                        x = base.x + uFwd.x * forwardOffset + uSide.x * sideOffset;
                        y = base.y + uFwd.y * forwardOffset + uSide.y * sideOffset;
                        // 攻城战守方：九口落在战略地图同款城池的九栋建筑上（主将队在城心）
                        if (this.deCity && side.f === 1) {
                            outFwd = forwardOffset; outSide = sideOffset;
                            const slots = this.deCity.slots;
                            // 🔴 [2026-10-11 AA #3/#5 属实] 守方出兵口原为 `slots[idx % slots.length]`：
                            //    险要只有 5~6 个槽（中心城堡+四角箭塔）、矩形/梯形城寨只有 8 个 ⇒
                            //    **第 9/10 队会完全叠回第 1/2 队那栋建筑上**。这里给「重复轮次」加沿横排的错位，杜绝完全重合。
                            const _k = slots.length > 0 ? idx % slots.length : 0;
                            const _rep = slots.length > 0 ? Math.floor(idx / slots.length) : 0;
                            const _base = idx < 9 && slots.length > 0 ? slots[_k] : { x: 0, y: 0 };
                            const _n = _rep * 34;
                            const sl = { x: _base.x + _n, y: _base.y + _n * 0.5 };
                            x = this.deCityCenter.x + sl.x;
                            y = this.deCityCenter.y + sl.y;
                        }
                        // 🔴 [2026-10-11 主人令] 陆战口径：水/树林/建筑一律可通行 ⇒ 阵位不再避水（原「落水则向本阵锚点退」已删）
                    }
                    this.spawns.push({
                        f: side.f, key, x, y,
                        // 人口折算：象/车 2、炮 3 → 精灵数按比例减少，单个精灵代表的兵额同比增加，总兵力守恒
                        pool: Math.max(1, Math.round(poolPer / popCostOf(key))),
                        pop: popCostOf(key),
                        spawned: 0,
                        slotN: 0,
                        lane: this.spawns.length,
                        row: cell.row,
                        commander: idx >= 9,
                        outFwd, outSide,
                    });
                });
            }
            // [2026-09-05 玩家] 玩家在军中 → 布置玩家 + 自带精锐编队 + 受控编队（在 initPool 之前，精锐兵力计入本方总量）
            this.setupPlayerUnits(init);

            // 🔴 [2026-09-23 主人定] 双方都必须是 10 支分队（编制 9 口 + 主将队 1 口）——运行期把关。
            //    ⚠️ 攻城武器在下面才追加，它不是「军队」不计入这条（见该段注释），所以校验放在这里。
            const laneCount: [number, number] = [
                this.spawns.filter((s) => s.f === 0).length,
                this.spawns.filter((s) => s.f === 1).length,
            ];
            this.diagPush('laneCount', { attacker: laneCount[0], defender: laneCount[1] });
            if (laneCount[0] !== SIDE_LANES || laneCount[1] !== SIDE_LANES) {
                console.warn(
                    `⚠️ [Scene13War] 编队数铁律被破坏：攻方 ${laneCount[0]} 口 / 守方 ${laneCount[1]} 口，`
                    + `应恒为 ${SIDE_LANES} 口（主人 2026-09-23 定 10 队：编制 9 + 主将队 1）。`,
                );
            }

            // 开局总兵力存档（精灵），供 getInitialTroops 回写战斗面板演出进度用
            this.initPool = [0, 1].map(f =>
                Math.max(1, this.spawns.reduce((n, s) => n + (s.f === f ? s.pool * s.pop : 0), 0)),
            ) as [number, number];

            // 🔴 [2026-08-22 主人定] 攻城战：按守方城级给攻方配备攻城武器（正常参战兵种，前置到攻方前排）
            // 🔴 [2026-09-03 主人定] 城寨(stockade)攻击方不带攻城武器——和野战一样直接开战
            // 🔴 [2026-09-19 主人定] 漠北蒙古风格(MOBEI_MONGOL)攻击方不带攻城武器——和城寨野战一样
            // 🔴 [2026-10-11 主人令「**现在所有攻城战都要有攻城武器**」] 旧的「城寨不带 / 漠北蒙古不带」两条排除**已废**：
            //    只要 battleType === 'siege'（含城寨、含漠北蒙古）一律配攻城武器。
            if (this.battleType === 'siege') {
                this.spawnSiegeWeapons(depth);
            }

            // 主将队（第 10 口，前排再往前）不是建筑位，不参与城墙前沿计算

            // 场景布景：撒云（云在最上层飘动装饰，位置不必避出兵口/地形）
            this.scatterClouds();
            // 战场气候判定（种子=真实数据）：地图主题 / 地面四张贴图 / 季节 / 水域类型，与画布大小无关
            const __e0 = performance.now();
            const envInput: Scene13ClimateInput = {
                lat: init.defenderCityLat ?? init.centerLat,
                lng: init.defenderCityLng ?? init.centerLng,
                waterProbeLat: init.defenderCityLat,
                waterProbeLng: init.defenderCityLng,
                seed: init.environmentSeed,
                attackerFactionId: init.attackerFactionId,
                defenderFactionId: init.defenderFactionId,
                attackerGeneralId: init.attackerGeneralId,
                defenderGeneralId: init.defenderGeneralId,
                isSiege: init.battleType === 'siege',
                buildingStyle: this.defenderCityRecord()?.buildingStyle,
                // 🔴 [2026-08-24 主人定]「水军的攻城战，做用左边是海的图」。
                //    强制出海，不靠 probeWater 探测碰运气——水军打的城本来就在海边，
                //    探测失灵就变成内陆战场，那这仗就白是水军了。
                //    （水军**野战**不进 13，留在战略地图，见 navalBattleAllowedInScene13。）
                forceWaterKind: (init.isNaval && init.battleType === 'siege') ? 'sea' : undefined,
                getCalendarSeason: () => {
                    // TimeSystem.getSeason() 枚举：春0 夏1 秋2 冬3；环境只收 绿0/橙1/白2
                    const season = (window as any).game?.timeSystem?.getSeason?.() ?? 0;
                    if (season === 3) return 2;   // 冬 → 白
                    if (season === 2) return 1;   // 秋 → 橙
                    return 0;                      // 春/夏 → 绿
                },
            };
            this.environmentPlan = resolveEnvironmentClimate(envInput);
            const __envMs = performance.now() - __e0;
            this.sceneSeason = this.environmentPlan.season;
            // [2026-09-03 主人定] 时段色调：按环境种子确定性抽时段，叠季节/群系/纬度偏色，每场看起来都不一样
            {
                const grade = resolveTimeOfDay({
                    seed: this.environmentPlan.seed,
                    calendarSeason: (window as any).game?.timeSystem?.getSeason?.() ?? 0,
                    biome: this.environmentPlan.biome ?? null,
                    lat: init.centerLat ?? null,
                    isSiege: init.battleType === 'siege',
                    isNaval: !!init.isNaval,
                    // 🔴 [2026-10-05 主人令「佩利昂的战术，只有在剧本中才套用夜晚滤镜，乱斗和夜晚滤镜没有关系」]
                    //    夜晚滤镜（2026-10-03「21 场中有夜战」）**只属于剧本**：同一座城在乱斗里被攻，
                    //    那一仗是现打的遭遇战，不是史书上那一场夜袭，故乱斗一律不开（乱斗照旧 DE 原色）。
                    //    `isNightBattle(init)` 只认守方据点 id（佩利昂=city_peiliang），它不知道现在是不是剧本，
                    //    所以剧本期这道闸必须加在这里，不能写在 Scene13TimeOfDay 里（那边没有剧本概念）。
                    forceNight: isScriptPeriod() && isNightBattle(init),
                });
                this.timeOfDay.begin(grade, performance.now());
                this.diagPush('timeOfDay', { phase: grade.phase, multiply: grade.multiply, drift: !!grade.driftTo });
            }
            const __d0 = performance.now();
            this.initDecor();
            this.diagPush('startTimings', { env: +__envMs.toFixed(1), terrainDecor: +(performance.now() - __d0).toFixed(1) });
            this.requestGroundLayerGL();

            // 🔴 [2026-10-02 主人定] 战役战斗过程播报（进入战术模式后，等行军播报结束完毕才能播放；只描述战斗过程、不说结果）
            if (init.battleBriefing) {
                const briefingText = init.battleBriefing;
                this.battleBriefingSpeaking = true;
                const triggerBattleBriefing = () => {
                    if (!this.active) {
                        this.battleBriefingSpeaking = false;
                        return;
                    }
                    console.log('[Scene13WarLayer] ⚔️ 播放战役战斗播报:', briefingText.slice(0, 30) + '...');
                    speechAnnouncer.announceBriefing(briefingText, () => {
                        this.battleBriefingSpeaking = false;
                    });
                };

                if (speechAnnouncer.isSTierBusy()) {
                    console.log('[Scene13WarLayer] 🎙️ 行军播报正在进行，等待结束后播放战役播报...');
                    if (this.battleBriefingTimer) clearInterval(this.battleBriefingTimer);
                    this.battleBriefingTimer = setInterval(() => {
                        if (!this.active) {
                            clearInterval(this.battleBriefingTimer);
                            this.battleBriefingTimer = null;
                            this.battleBriefingSpeaking = false;
                            return;
                        }
                        if (!speechAnnouncer.isSTierBusy()) {
                            clearInterval(this.battleBriefingTimer);
                            this.battleBriefingTimer = null;
                            triggerBattleBriefing();
                        }
                    }, 100);
                } else {
                    triggerBattleBriefing();
                }
            }
        } catch (e) {
            // 🔴 初始化失败 → 立即停演并解冻（不让 active=true + spawns 残缺 → 战斗永不结束、
            //    跟随军团永远不动）。走 forceResultByRatio 判负通道：它调 onDecision →
            //    Hooks 的 forceScene13Result → 解冻 + 引擎结算，战斗正常收尾。
            console.error('[Scene13WarLayer] start 初始化失败（已停演并判负解冻）:', e);
            this.active = false;
            this.forceResultByRatio(1);
        }
    }

    /**
     * 🔴 [2026-08-23 主人定] 攻城战攻方前排攻城武器：数量小城 4 个 / 中城·险要·大城 6 个，
     * 优先冲车 ×4，其余按攻方文化区对应 AoE2 文明科技树门控（SIEGE_TECH_BY_CULTURE）"有啥上啥"。
     * 全部武器"没有高级就用低级"降级：
     *   冲车 siege_ram→capped_ram→battering_ram，全无冲车线（印度斯坦系）→ 换装甲攻城战象 ×4；
     *   投石车 siege_onager→onager→mangonel（中国/女真/高丽 = 火箭车线）；
     *   弩炮 heavy_scorpion→scorpion；有战象的文化区（波斯/高棉/越南）→ 战象替代弩炮槽；
     *   全无投石车 → 2 弩炮、全无弩炮 → 2 投石车。
     * 攻城武器是**正常参战兵种**（移动/索敌/打墙），不是静态摆件。
     */
    /**
     * 建筑风格集：**势力专属 → 文化区** 两层。
     * 风格集是整套的（兵营/房屋/塔/墙/门一起换），所以势力级映射只给
     * 「本该用另一套风格集」的势力（安第斯/波斯/东欧/南亚），见 FACTION_BUILDING_STYLE。
     */
    private buildingStyleFor(side: 0 | 1): string {
        const fid = this.sideFaction[side];
        const culture = this.sideCulture[side] as RegionType;
        // 🔴 [2026-09-11 主人「和游戏同步」] 守方 = 本场被攻据点：走**与战略地图同一个**解析
        //   （据点显式 buildingStyle → 区域表；草原/蒙古强制毡帐 YURT 也在其中）。
        //   修的是两件事：① 编辑器里改据点建筑风格，战场不跟着变；② 战场自己的
        //   REGION_BUILDING_STYLE 缺 BASHU/SEAS 两区，实测 77 座据点在战场被画成西欧 WEST。
        if (side === 1 && this.defenderMapStyle) return this.defenderMapStyle;
        const byFaction = fid ? FACTION_BUILDING_STYLE[fid] : undefined;
        if (byFaction) return byFaction;
        return REGION_BUILDING_STYLE[culture] ?? REGION_TO_DE_STYLE[culture] ?? 'WEST';
    }

    /**
     * 守方是否为漠北蒙古风格（MOBEI_MONGOL / YURT 毡帐营地）。
     * 🔴 [2026-09-19 主人定] 漠北蒙古风格的战术模式应该和城寨野战一样：直接开战，没有攻城武器，没有坍塌。
     */
    /**
     * 守城据点数据：优先取游戏正在用的据点（剧本期按史实换过建筑风格的城，这里是换过的风格），取不到才退回原始数据表。
     * 读守城建筑风格一律走这里，战术模式才与战略地图画的同一套（2026-10-05 主人令「请修复」）。
     */
    private defenderCityRecord(): any {
        const id = this.defenderCityId;
        if (!id) return null;
        const rt: any = (window as any).game?.cityManager?.getCity?.(id);
        if (rt) return { ...rt, lat: rt.latitude, lng: rt.longitude };
        return (CITIES_V2 as any[]).find((x) => x.id === id) ?? null;
    }

    private isMobeiMongolDefender(): boolean {
        if (this.battleType !== 'siege') return false;
        if (this.defenderMapStyle === 'YURT') return true;
        if (this.buildingStyleFor(1) === 'YURT') return true;
        const c: any = this.defenderCityRecord();
        return c?.buildingStyle === 'MOBEI_MONGOL' || c?.buildingStyle === 'YURT';
    }

    /**
     * 守方城堡素材：**势力专属 → 文化区 → 风格集默认** 三层。
     *
     * 🔴 [2026-08-26] 只有这样才用得上 DE 那 56 个文明专属城堡 —— 它们在
     *    public/SUCAI_BUILDING/ 里**只有 CASTLE_AGE3**，没有配套的兵营/房屋，
     *    所以不能当风格集用，只能单独查。其余建筑照旧走 style。
     */
    private castleAssetFor(style: string, cityId?: string | null): string {
        // 🔴 [2026-10-03 主人令「请把所有的中城和大城的都设计为城堡居中」] 可选传守城 id：
        //    传了就与战略地图**同源**（`resolveCastleAsset` 里 59 代表名城名册优先）。
        //    既有险要调用不传 cityId，行为一字不变。
        // 🔴 [2026-10-14 主人令「和其他一切无关」] 守城城堡＝守方据点建筑风格（66 选 1）那一种的城堡
        return resolveCastleAsset(style, this.sideFaction[1], this.sideCulture[1], cityId ?? null, this.defenderCityRecord()?.buildingStyle ?? null);
    }

    /**
     * 这一侧在用的**军团名**：势力自己的军团（FACTION_COMPOSITIONS）→ 文化区默认军团（指针）。
     *
     * 🔴 [2026-09-14 主人令「一级的没有时代，就看二级和三级军团吧，二级军团和三级军团都有时代」]
     *   攻城武器按**军团自己名里的时代**发，不再只按地区指针 —— 一个 region 上挂着不同时代的
     *   军团（如 KHMER 既有封建时代高棉军团、又有城堡时代高棉军团），只按指针发就会张冠李戴。
     *   口径与 CombatUI 的战斗面板军团名完全同源（同一句 FACTION_COMPOSITIONS ?? getCultureLegionName）。
     */
    private sideLegionName(side: 0 | 1): string {
        const fid = this.sideFaction[side];
        if (side === 1 && this.battleType === 'siege') {
            const defName = resolveCityDefenseLegionName(
                this.defenderCityId,
                this.techYearGetter?.() ?? this.techYear,
                this.defenderCityRecord()?.buildingStyle,
                fid,
            );
            if (defName) return defName;
        }
        const byFaction = fid ? FACTION_COMPOSITIONS[fid]?.legionName : undefined;
        if (byFaction) return byFaction;
        return getCultureLegionName(this.sideCulture[side] as RegionType) || '';
    }

    /**
     * 攻城战前 30 秒的攻城武器：按【军团时代 + 文化】发，逻辑在 src/data/SiegeWeaponsByCulture.ts。
     * 🔴 [2026-09-09 主人定] 时代闸：古典军团只用古典器械，封建可用古典+封建，
     *    城堡再加城堡冷兵器与城堡时代热兵器，帝国全部冷热皆可。
     */
    private spawnSiegeWeapons(depth: number): void {
        const culture = this.sideCulture[0] as RegionType;
        // 🔴 [2026-10-13 主人令「请按符合历史修复」] 原注释写「美洲原住民不发攻城器械」——
        //    那条**从未生效过**（`getSiegeWeaponsForCulture` 对美洲档一直返回 9 件，下面的 `!nine.length` 是死代码），
        //    而且与主人 2026-10-11 令「现在所有攻城战都要有攻城武器」冲突。**现按实情改写并落地**：
        //    ① 美洲（安第斯/中美）照发攻城武器，但**限非火药**（阿兹特克/玛雅/印加在 DE 里都无火药线）；
        //       这条已落在 `SiegeWeaponsByCulture.ts` 的两个 `_imperial` 档数据里（火炮/风琴炮/掷弹兵一律不出现）。
        //    ② 这里只兜底：万一以后有人给美洲档塞进火药件，就地滤掉；滤空则退回「城墙 30 秒随机坍塌」。
        const AMERICAS = new Set(['ANDE', 'AMERICA', 'MAYANS', 'INCA', 'MUISCA', 'MAPUCHE', 'TUPI', 'CHIMU',
            'TARASCAN', 'TAIRONA', 'TEHUELCHE', 'IROQUOIS', 'SOUTHAM_IMPERIAL', 'NORTHAM_IMPERIAL', 'MESO']);
        const GUNPOWDER_SIEGE = new Set(['bombard_cannon', 'organ_gun', 'elite_organ_gun', 'grenadier', 'houfnice']);
        const nine = AMERICAS.has(String(culture))
            ? getSiegeWeaponsForCulture(culture, this.sideLegionName(0), this.attackerGeneralId).filter((k) => !GUNPOWDER_SIEGE.has(k))
            : getSiegeWeaponsForCulture(culture, this.sideLegionName(0), this.attackerGeneralId);
        if (!nine.length) return;

        const fadeDur = this.deployT > 0 ? DEPLOY_FADE : FADE_IN;
        // 🔴 [2026-10-15 主人令「攻方的攻城武器出现的位置分别为9个出兵口，正好一个出兵口一个」]
        const atkPorts = this.spawns.filter((s) => s.f === 0 && !s.commander);
        const siegeCount = nine.length;
        for (let idx = 0; idx < siegeCount; idx++) {
            const key = nine[idx];
            this.ensureType(key, 0);
            const hp = this.statsFor(key, 0).hp;
            const port = atkPorts[idx % Math.max(1, atkPorts.length)];
            const [x, y] = port
                ? this.fieldBound(port.x, port.y)
                : this.fieldBound(this.spawnBases[0].x, this.spawnBases[0].y);
            const tgt = this.deCity ? this.deCityCenter : this.spawnBases[1];
            const tgtX = tgt.x, tgtY = tgt.y;
            this.men.push({
                f: 0, key, jx: 0, jy: 0,
                zid: this.manSeq++,
                x, y,
                tx: tgtX, ty: tgtY,
                hp,
                dir: this.dir8(tgtX - x, tgtY - y),
                ph: Math.random() * 8, st: 0, foe: null, next: Math.random() * 0.2,
                fightT: 0, aimT: 0, lock: 0, atkSt: 0, atkFlip: false,
                prevX: x, prevY: y, anchorX: x, anchorY: y, netT: 0, stuckT: 0, sepX: 0, sepY: 0, y0: y,
                flag: false, fo: Math.random() * 600,
                march: false, port: null, dep: 0, slotY: 0, pop: popCostOf(key),
                siegeW: true, lane: -1,
                claims: 0, claimsNext: 0, atkers: 0, atkNext: 0, fadeT: fadeDur, fadeMax: fadeDur,
            });
        }
    }

    /**
     * [2026-08-19 主人需求] 退出按钮点击 → 按当前兵力比自动结算战果并退出。
     * 走 forceResultByRatio 同一条通道（onDecision → forceScene13Result → 解冻 + 引擎结算），
     * 与演出自然判负完全同链路，只是赢家按当前兵力比估算（与素材超时防死锁同口径）。
     */
    public requestExitWithResult(): void {
        if (!this.active || this.over) return;
        // 点击即隐藏（防重复点击；forceResultByRatio 里 over=true 后按钮本就不该再可点）
        if (this.exitBtn) this.exitBtn.style.display = 'none';
        this.forceResultByRatio(0.85);
    }

    /**
     * [2026-08-11 防死锁] 素材卡死/演出异常时强制判负（绝不永冻引擎）。
     * 按当前兵力比判：守方（f=1）吃 homeDiscount（城防/主场）折扣。
     * 走 onDecision 正常通道（→ forceScene13Result → 解冻 + 结算），
     * 与演出自然判负完全同链路，只是赢家按兵力比估算。
     */
    private forceResultByRatio(homeDiscount: number): void {
        if (this.over || !this.onDecision) {
            // 没有回调（演出层没接）→ 至少把自己停掉，别留 canvas
            this.stop('防死锁（无回调）');
            return;
        }
        const alive = [0, 0];
        for (const s of this.spawns) alive[s.f] += Math.max(0, s.pool) * s.pop;
        for (const m of this.men) if (m.hp > 0) alive[m.f] += m.pop;
        const att = Math.max(1, alive[0]);
        const def = Math.max(1, alive[1] * homeDiscount);
        const attackerWins = att > def;
        this.over = true;
        // [2026-08-19 主人需求] 判负即隐藏退出按钮（防死锁/退出结算共用此通道）
        if (this.exitBtn) this.exitBtn.style.display = 'none';
        console.warn(`🏁 [Scene13War] 防死锁判负：攻 ${alive[0]} 守 ${alive[1]}（守方×${homeDiscount}）→ ${attackerWins ? '攻方胜' : '守方胜'}`);
        this.diagPush('forceByRatio', { alive, homeDiscount, winner: attackerWins ? 'attacker' : 'defender' });
        this.diagFlush('forceByRatio');
        this.onDecision(
            attackerWins ? 'attacker' : 'defender',
            { attacker: Math.round(alive[0] * SPRITE_TROOPS), defender: Math.round(alive[1] * SPRITE_TROOPS) },
        );
    }

    /**
     * 演出结束（战斗被外部终结）→ 清场。
     * @param keepFrame 战败停留用：true = 保留最后一帧画面（canvas 不隐藏、尸体烙图不丢），
     *   只停逻辑（men/spawns 清空）——13 画面冻结在战场残局，直到 linger 到期 exit 才真正清场。
     *   正常结束（胜方画面）默认 false 直接清空。
     */
    /**
     * 战斗结束 → 进入**残局待命**（主人 2026-08-12：「这 5 秒我的意思是全军待命动作、旗帜依然飘扬」）。
     *
     * 🔴 修前这里调的是 `stop(..., keepFrame=true)`：演出被整个停掉、数组清空，
     *    画布上只剩最后渲染的**那一张静止帧** —— 所以看着像卡死（主人实锤）。
     * 现在改成：`active=false`（战斗逻辑全停：不索敌、不掉血、不死人、不补兵，
     * 且 isActive() 返回 false，跟拍切换那套判据行为不变），但 `lingering=true`
     * 让 tick 继续跑 —— 士兵播待命帧、旗帜继续飘、云继续走、尸体继续渐隐。
     */
    public beginLinger(): void {
        if (!this.active) return;
        this.active = false;
        this.lingering = true;
        if (this.contactSfxOn) {
            this.contactSfxOn = false;
            audioManager.stopSceneLoop('land_contact');
        }
        // [2026-08-19 主人需求] 战斗已结束（残局待命）→ 退出按钮无意义，隐藏
        if (this.exitBtn) this.exitBtn.style.display = 'none';
    }

    /**
     * 攻击特效的逐帧推进（箭矢/刀光/火花/爆炸炮口焰）——**纯动画，不结算伤害**。
     *
     * 🔴 [2026-08-26 主人：「战斗结束后要 5 秒才结束，期间士兵是待命，
     *    攻击特效应该消失才对，可攻击特效都静止了」]
     *    原来只有 step() 推这四个数组，`lingerStep()`（残局待命那 5 秒）漏了 ——
     *    t 不增长 → 既播不完也被 filter 不掉 → **半空的箭和刀光原地冻住 5 秒**。
     *    抽成一个方法给两处共用：残局里它们继续飞完/淡出，1 秒内自然清空，
     *    观感就是「攻击特效随战斗结束消失」。
     *    ⚠️ 不能改成 linger 开始时直接清空数组：飞在半空的箭会凭空蒸发，比冻住还假。
     */
    private stepEffects(dt: number): void {
        for (const a of this.arrows) a.t += dt;
        // 🔴 连发延迟：t 走到 delay+dur 才移除（delay 内还没射出，不算飞行时间）。
        // 炮弹/手榴弹/投石落地瞬间 → DE 特效与音效。
        for (const a of this.arrows) {
            if (a.t >= (a.delay ?? 0) + a.dur) {
                const hx = a.x + a.dx * a.len;
                const hy = a.y + a.dy * a.len;
                if (a.proj === 'PROJ_GRENADE') {
                    this.explode('FX_PETARD', hx, hy);
                } else if (a.proj === 'PROJ_BALL' || a.proj === 'PROJ_BOMBARD_BALL') {
                    this.explode('FX_EXPLOSION', hx, hy);
                } else if (a.proj === 'PROJ_MANGONEL' || a.proj === 'PROJ_ROCK') {
                    this.siegeImpact(hx, hy);
                }
            }
        }
        this.arrows = this.arrows.filter(a => a.t < (a.delay ?? 0) + a.dur);
        for (const s of this.slashes) s.t += dt;
        this.slashes = this.slashes.filter(s => s.t < s.dur);
        for (const s of this.sparks) {
            s.t += dt;
            s.x += s.vx * dt;
            s.y += s.vy * dt;
        }
        this.sparks = this.sparks.filter(s => s.t < s.dur);
        // DE 攻击特效（爆炸/炮口焰）：独立一次性生命周期，播完移除。
        for (const f of this.fxs) f.t += dt;
        this.fxs = this.fxs.filter(f => f.t < f.dur);
    }

    /** 残局待命的每帧推进：只推动画，不推战斗 */
    private lingerStep(dt: number): void {
        // 待命动作（8 帧循环，与战斗时同速）
        for (const m of this.men) m.ph += dt * 8 / 1.5;
        // 攻击特效继续播完（不推会原地冻住 5 秒，见 stepEffects 的说明）
        this.stepEffects(dt);
        // 尸体照常推进：死亡动画播完烙地面
        for (const c of this.corpses) {
            c.t += dt;
            if (c.keep !== true && c.t >= DEATH_ANIM) {
                if (this.bakeCorpse(c)) c.keep = true;   // 烙成功才标记；DE meta 未就绪返回 false，下帧重试
            }
        }
        this.corpses = this.corpses.filter(c => c.keep !== true);
        // 溃逃兵继续跑 + 渐隐
        for (const f of this.fleers) {
            f.t += dt;
            f.x += f.vx * dt;
            f.y += f.vy * dt;
            f.ph += dt * 8;
        }
        this.fleers = this.fleers.filter(f => f.t < FLEE_DUR);
        // 倒下的军旗继续淡出
        for (const ff of this.fallenFlags) ff.t += dt;
        this.fallenFlags = this.fallenFlags.filter(ff => ff.t < FLAG_FALL);
        // 云继续飘（旗帜的飘动用的是 performance.now()，本来就不受这里影响）
        if (this.clouds.length && this.canvas) {
            for (const c of this.clouds) {
                c.x += c.vx * dt;
                const w = (c.img?.naturalWidth ?? 600) * c.scale;
                if (c.x > this.worldCX + TAC_MAP_HALF_W + w) c.x = this.worldCX - TAC_MAP_HALF_W - w;
            }
        }
    }

    /**
     * [2026-08-17 诊断] 13 生命周期打点 → `scratch/scene13_probe_latest.json` + `scene13_probe_log.jsonl`。
     * 装它是因为主人报「刚开战卡一下、10 秒左右就退」，而我这边多次实测复现不出（素材 0.7s 就绪、
     * 演出跑满 2 分钟）。与其反复试，不如让现场数据自己落盘：一场 13 结束时自动 POST，
     * 事后读 jsonl 就能看出是「演出正常判负」「素材超时强判」还是「被外部提前停掉」。
     * 仅 DEV 生效；定位完连同 diag* 一起删。
     */
    private diagT0 = 0;
    /**
     * [性能探针 2026-08-18] 逐帧耗时采样（DEV，主人报「13 有点卡」）。
     * 只累加不排序，落盘时才算分位；开销 ≈ 两次 performance.now()/帧，可忽略。
     * 记 step（推演）与 render（绘制）分开，才能判断卡在算还是卡在画。
     */
    private perfStep: number[] = [];
    /** [2026-08-25] 水面渲染单独计时 + 水面 patch 数：验证「有水的局才卡」这条假设 */
    private perfRender: number[] = [];
    private perfFrames = 0;
    /** [诊断 2026-08-29] 尖峰帧快照：step/render 超阈值的帧记下战场状态，定位「无水也卡」来源 */
    private spikeLog: Array<Record<string, number>> = [];
    private lastCollapseAt = 0;
    private lastBakeCorpseAt = 0;
    /** 出生递增序号（zid 分配源）：渲染 z-order 稳定排序用，见 WarMan.zid */
    private manSeq = 0;
    /** [PERF 2026-08-29] 渲染排序列表对象池：render 每帧原 new 700+ 个临时对象加剧 GC，改为复用。 */
    private visPool: Array<{ kind: 'unit' | 'environment'; y: number; x: number; f: number; key: string; dir: number; set: string; fr: number; a: number; st?: number; z: number; zid: number; sprite: DecorSprite | null }> = [];
    private diagEvents: Array<[number, string, unknown]> = [];
    private diagSent = false;
    private diagAssetsReady = false;

    private diagPush(ev: string, data?: unknown): void {
        if (!import.meta.env.DEV) return;
        this.diagEvents.push([+((performance.now() - this.diagT0) / 1000).toFixed(2), ev, data ?? null]);
    }

    private diagFlush(why: string): void {
        if (!import.meta.env.DEV || this.diagSent || this.diagEvents.length === 0) return;
        this.diagSent = true;
        this.diagPost(why);
    }

    /**
     * 单独发一条记录，**不占用**「一局只发一次」的名额（diagSent 不动）。
     * 给「卡住了但还在打」这种情况用：那一局如果最后真的挂死，永远走不到 decision/stop，
     * 就永远不会落盘 —— 事后查无对证。所以卡住的当下先补一条快照。
     */
    private diagReport(why: string): void {
        if (!import.meta.env.DEV) return;
        this.diagPost(why);
    }

    private diagPost(why: string): void {
        const field = [0, 0], pool = [0, 0];
        for (const m of this.men) if (m.hp > 0) field[m.f]++;
        for (const sp of this.spawns) pool[sp.f] += Math.max(0, sp.pool);
        const body = JSON.stringify({
            at: new Date().toISOString(),
            why,
            totalSec: +((performance.now() - this.diagT0) / 1000).toFixed(2),
            field, pool,
            // [性能探针] 逐帧耗时（ms）：step = 推演，render = 绘制。
            // 60fps 的预算是 16.7ms/帧；两项之和逼近或超过它就是「卡」。
            perf: {
                frames: this.perfFrames,
                onField: field[0] + field[1],
                step: this.perfStat(this.perfStep),
                tint: this.perfStat(this.perfTint),
                render: this.perfStat(this.perfRender),
            },
            // [诊断 2026-08-29] 尖峰帧快照（>20ms 帧的战场状态），定位「无水也卡」来源
            spikes: this.spikeLog,
            // [2026-08-26] 宿主帧预算快照：13 自身 step+render 中位仅 3.8ms（理论 263fps），
            // 而探针反算实测 fps 中位 47、p10 仅 17.7 —— 说明卡顿几乎全在 13 之外。
            // PerformanceMonitor 已逐帧记着主循环分项，这里一并落盘才能定位到具体子系统。
            host: (window as any).perfMonitor?.getSnapshot?.() ?? null,
            events: this.diagEvents,
        });
        try {
            fetch('/api/scene13-probe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
                .catch(() => { /* 诊断失败绝不影响演出 */ });
        } catch { /* 同上 */ }
    }

    public stop(reason = 'unknown', keepFrame = false): void {
        /* 🔴 [2026-09-17 主人报障「一直都是战略地图白屏」] 原来是 `if (!keepFrame) this.restoreStrategyMap()`。
         * 病根：keepFrame=true（保留残局最后一帧）这条路**不恢复战略地图**，而之后没有任何人收尾 ——
         *   canvas 保持 display:block 但渲染早已停住（active/lingering 都是 false，render 不再跑），
         *   于是「空白 canvas + visibility:hidden 的地图」= 纯白屏，一直持续到下一场 start() 才被动恢复。
         *
         * 实测（scratch/_probe_cover_restore.mjs，监听 #map 的 style 变化）：
         *   t=21.2s 进13→hidden ✓ ／ t=100.4s 出13→恢复 ✓ ／ t=112.1s 进13→hidden ✓ ／ t=220.5s 出13→恢复 ✓
         *   t=270s 进13→hidden，之后 13 已退出（active=false lingering=false）而 **coveredMap 仍为 true**
         *   —— 盖了之后从没 restore，白屏现场就是这一刻。
         *
         * 解法：无条件恢复。cover 的唯一目的是性能优化（见 coverStrategyMap 注释「底下的地图不再参与
         *   浏览器绘制/合成」），不是视觉必需 —— 战场底图铺满时地图恢复了也被盖住，看不见；
         *   代价只是残局那几秒多一点合成开销，而不恢复的代价是永久白屏，风险完全不对称。
         * ⚠️ 光靠这一刀不够：stop 之后仍有一帧已排队的 render 会再调 coverStrategyMap()，
         *    所以那边另加了「演出已停不许盖」的守卫，两处配合才真正修好。 */
        this.restoreStrategyMap();
        this.tacticalZoom = 1.0;
        this.tacticalPanX = 0; this.tacticalPanY = 0;
        this.deferredAssetLoads = [];
        this.diagPush('stop', { reason, keepFrame, active: this.active, over: this.over });
        this.diagFlush('stop:' + reason);
        this.lingering = false;
        if (this.battleBriefingTimer) {
            clearInterval(this.battleBriefingTimer);
            this.battleBriefingTimer = null;
        }
        this.battleBriefingSpeaking = false;
        // 🔴 [2026-08-26 主人定] 战后还原战斗面板布局与大地图面板
        const game = (window as any).game;
        game?.combatUI?.applyScene13Layout?.(false);
        // 🔴 [2026-10-03 主人「战术模式结束后切战略是硬切」] 画布淡出时（!keepFrame）面板延后到淡出过半再还原，
        //    不与画布消失同一帧弹出；保留残局帧（keepFrame）的路径照旧立即还原。
        if (keepFrame) this.restorePanels(); else this.schedulePanelRestore(450);
        if (this.active) {
            // [2026-08-11 诊断] 谁把演出停掉的。over=false 还被停 = 外部提前收场
            let field = 0, pool = 0;
            for (const m of this.men) if (m.hp > 0) field++;
            for (const sp of this.spawns) pool += Math.max(0, sp.pool);
            console.warn(`⏹️ [Scene13War] 停止（${reason}）：演出已判负=${this.over} 场上${field}精灵 池${Math.round(pool)}精灵`);
        }
        this.active = false;
        // 接触交战音景随演出退场淡出（循环音，不停会一直响下去）。
        audioManager.stopSceneLoop('land_contact');
        // 退出战术模式继续播放当前 BGM，只在进入战术模式时切歌。
        this.spawns = [];
        this.men = [];
        this.corpses = [];
        this.fleers = [];
        this.arrows = [];
        this.slashes = [];
        this.sparks = [];
        this.fxs = [];
        this.fallenFlags = [];
        this.clouds = [];
        this.decorSprites = [];
        this.tacticalAnimals = [];
        this.wallGates = [];
        this.defBuildings = [];
        this.centerBld = undefined;
        this.gateSpriteSet = null;
        this.ringBox = undefined;
        this.flowDist = null;
        this.laneStart = null;
        this.remnantLanes.clear();
        this.holdLanes.clear();
        this.flowBuiltAt = -99;
        this.arrowTowers = [];
        this.castleTowers = [];
        this.cityBuildings = [];
        // [2026-09-05 玩家] 战术布置随场清空
        this.playerSetup = null;
        this.playerCtlLanes.clear();
        this.heroInput = null;
        this.heroMan = null;
        this.heroRespawnTimer = 0;
        // [2026-08-19 主人需求] 演出停止 → 隐藏退出按钮（自然结束/退出结算都会走到这里）
        if (this.exitBtn) this.exitBtn.style.display = 'none';
        this.useGroundGL = false;
        this.clearDeCity();
        if (!keepFrame && this.canvas) {
            this.fadeOutCanvas();
        } else if (this.glCanvas) {
            this.glCanvas.style.display = 'none';
        }
    }

    // ── 退场过渡（2026-10-03 主人「战术模式结束后，切换到战略模式是硬切」；2026-10-15 同步 WebGL 底图画布）──
    //   2D 战术画布与 WebGL 地形画布同步 0.7 秒丝滑淡出并略微拉远（scale 1→1.05，cubic-bezier 缓动）；
    //   底下的战略地图在 stop() 开头已先恢复，淡出时露出的就是真地图；面板等淡出过半（450ms）再还原。
    private canvasFadeTimer: number | null = null;
    private panelRestoreTimer: number | null = null;
    private static readonly EXIT_FADE_MS = 720;

    // ── 进场过渡（2026-10-03 主人「添加一个丝滑进场」；2026-10-15 主人「战略地图转场到战术地图的转场效果请优化下」）──
    //   start() 把 2D 画布与 WebGL 地形画布同步置成「全透明 + scale(1.045) 俯冲拉近 + 暗角微柔焦」，
    //   等 render() 第一次真正画出来才同步淡入并归位（消除原本 WebGL 底图先硬切出现、2D 画布后淡入的割裂感）。
    private entryFadePending = false;
    private entryStartedAt = 0;
    /** 最多等素材这么久（真实毫秒），超时就让战场先淡入，不让玩家一直盯着静止的战略地图。
     *  实测素材就绪时间波动很大（1.3 / 4.4 / 8.5 秒），4 秒的上限会在慢的时候把「一起出现」又拆成两段，故放宽到 10 秒。 */
    private static readonly ENTRY_WAIT_MAX_MS = 10000;
    /** 淡入进行中（从 beginEntryFade 到浏览器报告 opacity 渐变结束，或兜底超时）；期间不许盖地图 */
    private entryFadeActive = false;
    private entryFadeCleanup: (() => void) | null = null;
    private static readonly ENTRY_FADE_MS = 680;

    private applyInitialEntryStyle(el: HTMLCanvasElement): void {
        el.style.transition = 'none';
        el.style.transformOrigin = '50% 50%';
        el.style.opacity = '0';
        el.style.transform = 'scale(1.045)';
        el.style.filter = 'brightness(0.78) blur(3px)';
    }

    private prepareEntryFade(cv: HTMLCanvasElement): void {
        this.cancelCanvasFade();   // 清掉上一场未走完的退场淡出 / 进场淡入
        this.applyInitialEntryStyle(cv);
        if (this.glCanvas) this.applyInitialEntryStyle(this.glCanvas);
        this.entryFadePending = true;
        this.entryStartedAt = performance.now();
    }

    private beginEntryFade(cv: HTMLCanvasElement): void {
        this.entryFadePending = false;
        const gl = this.glCanvas;
        void cv.offsetWidth;   // 强制样式落定：保证「透明 + 俯冲拉近」是过渡的起点
        if (gl) void gl.offsetWidth;
        const ms = Scene13WarLayer.ENTRY_FADE_MS;
        const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
        const trans = `opacity ${ms}ms ${ease}, transform ${ms}ms ${ease}, filter ${ms}ms ease-out`;
        this.entryFadeActive = true;
        // 🔴 淡入何时结束，以浏览器**真正的渐变结束事件**为准，不用「开始时刻 + 固定毫秒」
        const finish = (): void => {
            cv.removeEventListener('transitionend', onEnd);
            window.clearTimeout(fallback);
            this.entryFadeCleanup = null;
            this.entryFadeActive = false;
            this.resetCanvasFadeStyle(cv);
            if (this.glCanvas) this.resetCanvasFadeStyle(this.glCanvas);
        };
        const onEnd = (e: TransitionEvent): void => { if (e.propertyName === 'opacity') finish(); };
        const fallback = window.setTimeout(finish, ms + 1400);
        cv.addEventListener('transitionend', onEnd);
        this.entryFadeCleanup = finish;
        cv.style.transition = trans;
        cv.style.opacity = '1';
        cv.style.transform = 'scale(1)';
        cv.style.filter = 'brightness(1) blur(0px)';
        if (gl) {
            gl.style.transition = trans;
            gl.style.opacity = '1';
            gl.style.transform = 'scale(1)';
            gl.style.filter = 'brightness(1) blur(0px)';
        }
    }

    private resetCanvasFadeStyle(cv: HTMLCanvasElement): void {
        cv.style.transition = '';
        cv.style.opacity = '';
        cv.style.transform = '';
        cv.style.filter = '';
    }

    /** 取消还没走完的淡出（新一场开战时调用，保证新场画布是满不透明、正常大小） */
    private cancelCanvasFade(): void {
        if (this.canvasFadeTimer !== null) {
            window.clearTimeout(this.canvasFadeTimer);
            this.canvasFadeTimer = null;
        }
        this.entryFadeCleanup?.();   // 进场淡入还没走完：摘监听、清兜底计时器、解除「不许盖地图」
        this.entryFadePending = false;
        if (this.canvas) this.resetCanvasFadeStyle(this.canvas);
        if (this.glCanvas) this.resetCanvasFadeStyle(this.glCanvas);
    }

    private fadeOutCanvas(): void {
        const cv = this.canvas;
        const gl = this.glCanvas;
        if (!cv) return;
        this.cancelCanvasFade();
        if (cv.style.display === 'none') {
            if (gl) gl.style.display = 'none';
            this.timeOfDay.end();
            return;
        }
        const ms = Scene13WarLayer.EXIT_FADE_MS;
        const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
        const trans = `opacity ${ms}ms ${ease}, transform ${ms}ms ${ease}, filter ${ms}ms ease-out`;
        cv.style.transformOrigin = '50% 50%';
        cv.style.transition = trans;
        cv.style.opacity = '0';
        cv.style.transform = 'scale(1.05)';
        cv.style.filter = 'brightness(0.88) blur(2px)';
        if (gl && gl.style.display !== 'none') {
            gl.style.transformOrigin = '50% 50%';
            gl.style.transition = trans;
            gl.style.opacity = '0';
            gl.style.transform = 'scale(1.05)';
            gl.style.filter = 'brightness(0.88) blur(2px)';
        }
        this.canvasFadeTimer = window.setTimeout(() => {
            this.canvasFadeTimer = null;
            cv.style.display = 'none';
            this.resetCanvasFadeStyle(cv);
            if (gl) {
                gl.style.display = 'none';
                this.resetCanvasFadeStyle(gl);
            }
            this.timeOfDay.end();
        }, ms + 50);
    }

    private restorePanels(): void {
        const game = (window as any).game;
        game?.cameraFollowUI?.onExitBattleScene13?.();
        game?.brawlFeedPanel?.onExitBattleScene13?.();
    }

    private schedulePanelRestore(delayMs: number): void {
        if (this.panelRestoreTimer !== null) window.clearTimeout(this.panelRestoreTimer);
        this.panelRestoreTimer = window.setTimeout(() => {
            this.panelRestoreTimer = null;
            this.restorePanels();
        }, delayMs);
    }

    /**
     * 立刻把延后的面板还原做掉（新一场进场前必须先调用）：
     * 面板的「收起 / 还原」靠 `preScene13*` 标志成对记状态，若上一场的还原还挂在计时器上，
     * 下一场 onEnter 就会把「已收起」记成「进场前的状态」，战后面板再也展不开。
     */
    public flushPanelRestore(): void {
        if (this.panelRestoreTimer === null) return;
        window.clearTimeout(this.panelRestoreTimer);
        this.panelRestoreTimer = null;
        this.restorePanels();
    }

    // ── 出兵口 = 编制槽位（getCultureTier(...).slots 展开）──
    /**
     * 返回出兵口序列（主游戏编制槽位展开，不手抄）：
     *   - 三阵型（鱼鳞 3×3 / 三角 2+3+4 / 雁行 4+3+2）展开后均为 9 口，展开序 = 前/中/后三排
     * 口内 key 为兵种 id，与 UNIT_ASSETS 键一致。
     */
    /**
     * DE 自动排布：用 DE 的算法（group.cpp `FUN_1410da2d0`）算这支队的九个阵位。
     *
     * 契约与 `LAYOUT` 完全一致（`{col,row,cols}`：row 0/1/2＝前/中/后，cols＝该行人数，col＝行内序号），
     * 所以下游（forwardOffset / sideOffset / colSpacing）一行都不用改。
     *
     * 两条纪律：
     *   ① **分类顺序按编制里首次出现的顺序**（`order:'given'`）—— 保住我们自己的前/中/后语义，
     *      不会被 DE 的引擎索引顺序把骑兵排到步兵前面（主人 2026-10-12 批准的方案 A）；
     *   ② **主将队（第 10 口）不参与**队内分类，走 `COMMANDER_CELL`。
     */
    private deFormationCells(lanes: { key: string }[], mode: FormationMode): { col: number; row: number; cols: number }[] {
        const body = lanes.slice(0, 9);
        const cacheKey = mode + '|' + body.map((l) => l.key).join(',');
        const hit = this.deCellCache.get(cacheKey);
        if (hit) return hit;

        const groups: (DeCategoryGroup & { idx: number[] })[] = [];
        const byCat = new Map<number, DeCategoryGroup & { idx: number[] }>();
        body.forEach((lane, idx) => {
            const wt = WAR_TYPES[lane.key];
            const cat = categorizeUnit(lane.key, wt?.cls) as number;
            let g = byCat.get(cat);
            if (!g) {
                // 该兵种的间距 = UNIT_PX × sz（对应 DE 的「每个单位自己的间距」*(float*)(unit+6)）
                g = { category: cat as DeCategoryGroup['category'], count: 0, spacing: UNIT_PX * (wt?.sz ?? 1), idx: [] };
                byCat.set(cat, g);
                groups.push(g);
            }
            g.count += 1;
            g.idx.push(idx);
        });

        const r = computeDeFormationLayout(groups, { axis: 'line', order: 'given' });
        const out: { col: number; row: number; cols: number }[] = body.map(() => ({ col: 0, row: 0, cols: 1 }));
        let rowBase = 0;
        for (const gl of r.groups) {
            const src = byCat.get(gl.category as number);
            if (!src) continue;
            for (let i = 0; i < gl.count; i++) {
                const col = i % gl.columns;
                const rw = Math.floor(i / gl.columns);
                const inRow = Math.min(gl.columns, gl.count - rw * gl.columns);
                out[src.idx[i]] = { col, row: rowBase + rw, cols: inRow };
            }
            rowBase += gl.lines;
        }
        this.deCellCache.set(cacheKey, out);
        return out;
    }

    /** DE 自动排布的阵位缓存（键 = 阵型 + 九个兵种键） */
    private deCellCache = new Map<string, { col: number; row: number; cols: number }[]>();

    private slotsOf(region: string, factionId?: string | null, generalId?: string | null, hasElite?: boolean, sideF?: 0 | 1): { key: string }[] {
        try {
            // 🔴 [2026-10-18 主人定「每个时代每个据点，防守的时候，只能出本文化该时代的军团」]
            if (sideF === 1 && this.battleType === 'siege') {
                const defComp = resolveCityDefenseLegionComposition(
                    this.defenderCityId,
                    this.techYearGetter?.() ?? this.techYear,
                    this.defenderCityRecord()?.buildingStyle,
                    factionId,
                );
                if (defComp?.slots?.length) {
                    const types = expandCompositionSlots(defComp.slots);
                    if (types.length === 9) {
                        return withCommander(generalId, types, {
                            factionId,
                            seedKey: region,
                            hasElite,
                            legionCommanderUnit: defComp.commanderUnit,
                        }).map((key) => ({
                            key: WAR_TYPES[key] ? key : 'light_infantry',
                        }));
                    }
                }
            }
            // 🔴 势力专属方阵最优先（如伊贺 iga_d 忍者军团、织田 owari 等）
            const factionSlots = factionId ? getFactionCompositionSlots(factionId, generalId) : null;
            const tier = factionSlots ? { slots: factionSlots } : getCultureTier(region as any, 50000);
            if (tier?.slots?.length) {
                const types = expandCompositionSlots(tier.slots);
                // 三阵型展开均为 9 口
                if (types.length === 9) {
                    // 🔴 防御：WAR_TYPES 没有的兵种（势力专属/新兵种）替换成轻步，防运行时 wt.cls 崩溃
                    // 🔴 [2026-09-23] 编制 9 口 + 主将队第 10 口
                    const legionCommanderUnit = (factionId ? getFactionLegionComposition(factionId)?.commanderUnit : undefined)
                        ?? getRegionLegionComposition(region as any)?.commanderUnit;
                    return withCommander(generalId, types, { factionId, seedKey: region, hasElite, legionCommanderUnit }).map((key) => ({
                        key: WAR_TYPES[key] ? key : 'light_infantry',
                    }));
                }
            }
        } catch (e) {
            console.warn('[Scene13WarLayer] 编制槽位派生失败，回退 3×3 默认:', e);
        }
        return [
            { key: 'light_infantry' }, { key: 'light_infantry' }, { key: 'light_infantry' },
            { key: 'lancer' }, { key: 'general_cavalry' }, { key: 'lancer' },
            { key: 'archer' }, { key: 'archer' }, { key: 'archer' },
            { key: 'light_infantry' },   // 第 10 口：主将队（兜底同前排兵种）
        ];
    }

    /** 从编制槽位结构推断阵型（鱼鳞/三角/雁行）；与 slotsOf 用同一 tier，保证布局一致 */
    private formationModeOf(region: string, factionId?: string | null, generalId?: string | null, sideF?: 0 | 1): FormationMode {
        try {
            if (sideF === 1 && this.battleType === 'siege') {
                const defComp = resolveCityDefenseLegionComposition(
                    this.defenderCityId,
                    this.techYearGetter?.() ?? this.techYear,
                    this.defenderCityRecord()?.buildingStyle,
                    factionId,
                );
                if (defComp?.formationMode) return defComp.formationMode;
            }
            if (factionId) {
                // 🔴 [2026-09-14] 势力表只剩指针，阵型跟着它挂的那支军团走
                const custom = getFactionLegionComposition(factionId);
                if (custom?.formationMode) return custom.formationMode;
                const factionSlots = getFactionCompositionSlots(factionId, generalId);
                if (factionSlots?.length) return inferFormationModeFromSlots(factionSlots);
            }
            const tier = getCultureTier(region as any, 50000);
            if (tier?.slots?.length) {
                return inferFormationModeFromSlots(tier.slots);
            }
        } catch (e) {
            console.warn('[Scene13WarLayer] 阵型推断失败，回退方阵:', e);
        }
        return 'square';
    }

    // ── 场景云：随机布景 + 加载（纯装饰，不参与战斗逻辑，也不进 pending）──

    /**
     * 随机布云：全屏散开，各自随机方向漂移。云没有季节，10 张随机取。
     * 🔴 云在**最上层**，所以位置不用避开出兵口 —— 它本来就该盖在什么上面都行。
     */
    private scatterClouds(): void {
        const count = CLOUD_COUNT_MIN + ((Math.random() * (CLOUD_COUNT_MAX - CLOUD_COUNT_MIN + 1)) | 0);
        for (let i = 0; i < count; i++) {
            const c: SceneCloud = {
                x: this.worldCX + (Math.random() - 0.5) * (TAC_MAP_HALF_W * 2),
                y: this.worldCY + (Math.random() - 0.5) * (TAC_MAP_HALF_H * 2),
                // 🔴 一律**从左往右**（主人 2026-08-12）：全场风向必须一致 ——
                //    旗帜固定 row 5 走 facingLeft 分支、旗面画在杆的右侧，也是向右飘。
                //    云和旗同向，风向才成立。**别改回随机方向。**
                vx: CLOUD_SPD_MIN + Math.random() * (CLOUD_SPD_MAX - CLOUD_SPD_MIN),
                alpha: CLOUD_ALPHA_MIN + Math.random() * (CLOUD_ALPHA_MAX - CLOUD_ALPHA_MIN),
                scale: CLOUD_SCALE_MIN + Math.random() * (CLOUD_SCALE_MAX - CLOUD_SCALE_MIN),
                flip: Math.random() < 0.5,
                img: null,
            };
            this.clouds.push(c);
            this.ensureCloud(c);
        }
    }

    /** 加载单朵云（纯装饰：失败就少一朵，绝不进 pending） */
    private ensureCloud(c: SceneCloud): void {
        const im = new Image();
        im.onload = () => { c.img = im; };
        im.src = CLOUD_BASE_URL + CLOUD_FILES[(Math.random() * CLOUD_FILES.length) | 0] + '.png';
    }

    // ── 装饰层（P3 植被 + L3 点缀）：画在尸体层之下，永不遮士兵 ──────────────

    /** 地面抬升（GL 地面层的高程）；GL 地面还没就绪时按平地 0 */
    private elevationLiftAt(x: number, y: number): number {
        if (this.useGroundGL && this.groundLayerGL) {
            return this.groundLayerGL.elevationLiftAt(x, y, this.worldCX * 2, this.worldCY * 2);
        }
        return 0;
    }

    /** 地面高程级（1 级 = 16 像素）；GL 地面还没就绪时按 0 级 */
    private elevationLevelAt(x: number, y: number): number {
        return this.elevationLiftAt(x, y) / 16;
    }

    /** 每场重置世界物件（城池、出兵口营地等由 applySpawnBuildings 放；地面与自然物件由 GL 地面层的地图数据放） */
    private initDecor(): void {
        if (!this.canvas) return;
        this.decorSprites = [];
        this.tacticalAnimals = [];
        this.wallGates = [];
        this.defBuildings = [];
        this.centerBld = undefined;
        this.gateSpriteSet = null;
        this.ringBox = undefined;
        this.flowDist = null;
        this.defGateFlow = null;
        this.defFlowSig = -1;
        this.laneStart = null;
        this.remnantLanes.clear();
        this.holdLanes.clear();
        this.flowBuiltAt = -99;
        this.arrowTowers = [];
        this.castleTowers = [];
        this.cityBuildings = [];
        this.applySpawnBuildings();
    }

    /** [2026-08-21 主人需求] 出兵口布军事建筑：靶场/兵营/马厩 + 行军帐篷（共 9 个）。
     *  野战双方都布；攻城双方也布（守方守城）；只对普通编制 9 口生效，纯骑 6 口不布。
     *  建筑为 world 层**纯贴图**（无碰撞，不破坏阵型），单帧。
     *  🔴 [2026-08-22 主人改] 9 建筑摆放位置**全部随机**（不再按离质心距离分层），建筑朝向随机（左右镜像随机）。
     *  🔴 [2026-08-22 主人改] 攻击方（野战双方+攻城攻方）：3 营地 + 4 帐篷 + 1 强化哨站 + 1 瞭望塔。
     *  🔴 [2026-08-22 主人改] 攻城战守方按城等级分时代：大城=帝国 age4（城堡+全建筑）、中城=城堡 age3（城堡+基础+警戒塔）、险要=封建 age2+城堡（要塞，7 封建+警戒塔）、小城=封建 age2（无城堡，7 封建+瞭望塔+警戒塔）。 */
    /** 收起新战术模式攻城战的城池（地基层 DOM 摘掉、状态清零） */
    private clearDeCity(): void {
        this.deCity = null;
        this.deCityBuilt = false;
        if (this.deCityGround) { this.deCityGround.remove(); this.deCityGround = null; }
    }

    /**
     * 🔴 [2026-10-11 主人「城池在中心，样式和战略地图一致」] 摆战略地图同款城池：
     *    屏外排版量出每张图的矩形 → 建筑 / 城墙 / 城门入场为世界精灵（与士兵按脚点排序），
     *    城墙城门照旧可攻击、可破（WALL_GATE_STATS 同一套）；地基贴图留在 DOM 地基层。
     */
    private buildDeCity(): void {
        const c = this.deCity;
        if (!c) return;
        const gen = this.assetGen;
        this.pending++;
        let released = false;
        const release = () => { if (released) return; released = true; if (gen === this.assetGen) this.pending--; };
        window.setTimeout(release, 8000);
        if (this.deCityGround) { this.deCityGround.remove(); this.deCityGround = null; }
        if (this.defenderCityType !== 'stockade') {
            this.deCityGround = strategicCityGroundElement(c, this.defenderCityType);
        }
        void measureStrategicCity(c).then(async (pieces) => {
            if (gen !== this.assetGen || this.deCity !== c) return;
            const metas = await Promise.all(pieces.map((p) =>
                fetch('/SUCAI_BUILDING/' + p.dir + '/_meta.json').then((r) => (r.ok ? r.json() : null)).catch(() => null)));
            if (gen !== this.assetGen || this.deCity !== c) return;
            const { x: cx, y: cy } = this.deCityCenter;
            pieces.forEach((p, i) => {
                const meta = metas[i];
                if (!meta || !meta.box_w) return;
                const asset = 'BUILDING:' + p.dir;
                this.ensureNatureAsset(asset);
                const k = p.width / meta.box_w;
                const x = cx + (p.flip ? p.left + p.width - meta.anchor_x * k : p.left + meta.anchor_x * k);
                const y = cy + p.top + meta.anchor_y * k;
                const sprite: DecorSprite = {
                    asset, frame: 0, x, y, flip: p.flip, layer: 'world', z: 1, scale: k,
                    obstructionContactSec: 0, obstructionTouched: false, obstructionDisabled: false,
                };
                this.decorSprites.push(sprite);
                if (p.kind === 'building') { this.trackCityBuilding(sprite); return; }
                sprite.obstruction = { x: 0.95, y: 0.95 };
                if (p.kind === 'wall') {
                    // 木栅栏/篱笆走 WOOD_WALL 档；石墙/垛墙 STONE_WALL（加固墙取 FORTIFIED_WALL 3000 血）、破墙前按 HP 切 D25/D50/D75
                    const wood = /PALISADE|FENCE/.test(p.dir);
                    const isFence = p.dir.includes('FENCE');
                    const wKey = wood ? 'WOOD_WALL' : (p.dir.includes('FORTIFIED') ? 'FORTIFIED_WALL' : 'STONE_WALL');
                    const st = WALL_GATE_STATS[wKey];
                    const destrAssets = wood ? undefined : ['D25', 'D50', 'D75'].map((t) => `${p.dir}_${t}`);
                    if (destrAssets) for (const d of destrAssets) this.ensureNatureAsset('BUILDINGANIM:' + d);
                    const wallRubble = isFence ? 'BATTLEFIELD:FENCE_RUBBLE' : 'FOUNDATION_1X1_RUBBLE';
                    if (isFence) {
                        this.ensureNatureAsset('BATTLEFIELD:FENCE_RUBBLE');
                    } else {
                        this.ensureNatureAsset('BUILDINGANIM:FOUNDATION_1X1_DESTR');
                        this.ensureNatureAsset('BUILDINGANIM:FOUNDATION_1X1_RUBBLE');
                    }
                    this.wallGates.push({ f: 1, key: wKey, x, y, hp: st.hp, maxHp: st.hp, claims: 0, claimsNext: 0, atkNext: 0, atkers: 0, sprite, linked: true, destrAssets, rubbleAsset: wallRubble });
                    return;
                }
                // 城门：沿门线铺 6 点碰撞体堵两侧缝隙（同旧 13 placeGate）；破门播倒塌动画 → 残骸
                const dSign = (/_SE$/.test(p.dir) ? 1 : -1) * (p.flip ? -1 : 1);
                const extraSprites: DecorSprite[] = [];
                for (let step = -3; step <= 3; step++) {
                    if (step === 0) continue;
                    const extra: DecorSprite = {
                        asset: '', frame: 0, x: x + step * 24 * k, y: y + step * 12 * k * dSign, flip: false, layer: 'world', z: 1,
                        obstruction: { x: 0.95, y: 0.95 },
                        obstructionContactSec: 0, obstructionTouched: false, obstructionDisabled: false,
                    };
                    this.decorSprites.push(extra);
                    extraSprites.push(extra);
                }
                const isOnlyFenceGate = p.dir.includes('FENCE');
                const isWoodGate = isOnlyFenceGate || p.dir.includes('PALISADE');
                let rubbleAsset: string;
                if (isOnlyFenceGate) {
                    // 🔴 [2026-10-16 主人令「篱笆的门，在坍塌的时候，错用了栅栏门，请修复，和DE保持一致，依然用篱笆门」]
                    //    对齐 DE empires2_x2_p1.dat Unit 1062 (b_scen_fence) → dying_graphic=36 → dead_unit_id=1065 (b_scen_fence_rubble)
                    rubbleAsset = 'BATTLEFIELD:FENCE_RUBBLE';
                    this.ensureNatureAsset(rubbleAsset);
                } else {
                    rubbleAsset = `${p.dir}_RUBBLE`;
                    this.ensureNatureAsset('BUILDINGANIM:' + `${p.dir}_DESTR`);
                    this.ensureNatureAsset('BUILDINGANIM:' + rubbleAsset);
                }
                const st = isWoodGate ? WALL_GATE_STATS.WOOD_WALL : (p.dir.includes('FORTIFIED') ? WALL_GATE_STATS.FORTIFIED_GATE : WALL_GATE_STATS.STONE_GATE);
                // 🔴 [2026-10-13] key 仍写 'STONE_GATE'（**不新增键**）：城门倒塌/残骸那几条链
                //    只认 'STONE_GATE'（见两处 `foe.key === 'STONE_GATE' && hp<=0`），
                //    若另立 'WOOD_GATE' 键，木门 0 血时不会倒塌 —— 会变成打不烂的墙。
                //    木材质只体现在**血甲**上（540/2/5 照 WOOD_WALL），行为链完全通用。
                this.wallGates.push({ f: 1, key: 'STONE_GATE', x, y, hp: st.hp, maxHp: st.hp, claims: 0, claimsNext: 0, atkNext: 0, atkers: 0, sprite, extraSprites, linked: true, rubbleAsset });
            });
            this.deCityBuilt = true;
            this.applyDeCityToGround();
        }).finally(release);
    }

    /** 城池落地：城址范围内清掉底图的水 / 林、整平高程（大概率形成中央平顶高台），并拿掉压在城里的底图树 */
    private applyDeCityToGround(): void {
        const c = this.deCity, gl = this.groundLayerGL, cv = this.canvas;
        if (!c || !gl || !cv) return;
        const { x: cx, y: cy } = this.deCityCenter;
        const W = this.worldCX * 2, H = this.worldCY * 2;
        const rx = c.width / 2, ry = c.height / 2;
        // 城池外接椭圆换算成格半径（等轴格：横向约 45 px、纵向约 22 px 一格）
        const rCells = Math.min(7.5, Math.max(4.5, Math.max(rx / 160, ry / 80)));
        // 🔴 [2026-10-11 主人令「据点城池在地图中心，高地大概率设计在地图中心地带，注意大概率而非绝对」]
        const peakLevel = gl.maxElevationLevelInRadius(cx, cy, W, H, rCells * 0.8);
        const seedStr = String(this.defenderCityId || this.environmentPlan?.seed || 'default');
        let hash = 2166136261;
        for (let i = 0; i < seedStr.length; i++) hash = Math.imul(hash ^ seedStr.charCodeAt(i), 16777619);
        const roll = (hash >>> 0) % 100;
        const level = peakLevel >= 1.5
            ? Math.min(4, Math.max(2, Math.round(peakLevel)))
            : (roll < 68 ? (roll < 24 ? 3 : 2) : Math.round(peakLevel));
        // 🔴 [2026-10-12 主人令「PASS与城寨分别支持专属的多层阶梯高台与多样化随机起伏小山包」]
        // 🔴 [2026-10-12 主人令「设计中城护城河，比大城窄一点，2 格就行；小城 1 格；城寨不用」] 河宽按城型：大城 3 / 中城 2 / 小城 1 / 其余不挖；
        //    毡帐营地（蒙古包那套，不是按格摆放的墙圈）跳过，免得河开错位置。
        const moatW = this.defenderCityType === 'big_city' ? 3 : this.defenderCityType === 'medium_city' ? 2 : this.defenderCityType === 'small_city' ? 1 : 0;
        // 🔴 [2026-10-13 主人令「护城河按史实区分，没有水的城不要挖」] 护城河要有水源：城郊 25km 内没有河 / 湖 / 海（waterKind === 'none'，
        //    即内陆干旱区的城）不挖——历史上这类城要么是干壕、要么根本无壕，凭空挖一圈水不符合地理。
        const moatOn = moatW > 0 && this.buildingStyleFor(1) !== 'YURT' && this.environmentPlan?.waterKind !== 'none';
        if (this.defenderCityType === 'pass') {
            gl.flattenPassTerraces(cx, cy, W, H, seedStr, this.wallGates, this.defBuildings);
        } else if (this.defenderCityType === 'stockade') {
            gl.flattenStockadeTerraces(cx, cy, W, H, seedStr, this.wallGates);
        } else {
            // 普通城市保持原有的整体地基整平
            const ringL = Math.max(0, (rx - 200) / (TAC_TILE_W / 2));
            let flatCells = ringL > 0 ? ringL / 2 + 0.5 : rCells;
            // 🔴 [2026-10-12 主人令「给大城的外围加一圈护城河」] 河在墙外 1.5~4.5 格，整平范围要盖住它（含不规则水湾外扩），河面才和城池地基同高
            if (this.defenderCityType === 'big_city' && ringL > 0) flatCells = Math.max(flatCells, ringL / 2 + 6.5);
            else if (moatOn && ringL > 0) flatCells = Math.max(flatCells, ringL / 2 + 1.85 + moatW + 2.8);   // 中城、小城：盖住不规则河岸与水湾外沿
            if (this.defenderCityType === 'big_city') {
                gl.flattenBigCityTerrain(cx, cy, W, H, seedStr, flatCells);
            } else if (this.defenderCityType === 'medium_city' || this.defenderCityType === 'small_city') {
                gl.flattenMediumSmallCityTerrain(cx, cy, W, H, seedStr, flatCells, this.defenderCityType);
            } else {
                gl.flattenFoundation(cx, cy, W, H, flatCells, level);
            }
        }
        for (let py = -ry; py <= ry; py += 24) {
            for (let px = -rx; px <= rx; px += 48) {
                if ((px * px) / (rx * rx) + (py * py) / (ry * ry) > 1) continue;
                gl.carveFoundation(cx + px, cy + py, W, H, 2);
            }
        }
        // 🔴 [2026-10-12 主人令「给大城的外围加一圈护城河」＋ 答复：3 格宽、四个门前各留一座桥、只加战术地图]
        // 🔴 [2026-10-15 主人令「护城河的左右两边各有一个尖，请消除，护城河应该是不规则的，不要所有都一样，应该多样化」]
        //    1) 消除左右尖角：等轴投影 2:1（96×48）下，墙圈左右两角夹角仅 53.13°，旧版在 (ci,cj) 格空间算 L4 会沿水平角平分线外突成 `<`、`>` 尖刺；
        //       现改为在屏幕像素空间直接向墙圈菱形线段 A=(0, half·TH)→B=(half·TW, 0) 投影求欧氏距离，左右角天然呈屏幕正圆弧包绕角楼，彻底消除尖刺。
        //    2) 多样化不规则河道：按每座城 seedStr 确定性生成不同频率/相位的内外岸独立起伏波、四段河面宽窄偏置、1~3 处天然宽阔水湾，以及门桥两侧圆弧收头。
        const ringLm = Math.max(0, (rx - 200) / (TAC_TILE_W / 2));
        let inMoat: ((x: number, y: number) => boolean) | null = null;
        if (moatOn && ringLm > 0) {
            let mh = (hash >>> 0) ^ 0x9e3779b9;
            const mrnd = (): number => {
                mh = Math.imul(mh ^ (mh >>> 15), 0x85ebca6b) >>> 0;
                mh = Math.imul(mh ^ (mh >>> 13), 0xc2b2ae35) >>> 0;
                return ((mh ^ (mh >>> 16)) >>> 0) / 4294967296;
            };
            const half = ringLm / 2;
            const d0 = 1.80;
            const baseSpan = moatW === 1 ? 1.50 : moatW === 2 ? 2.20 : 3.05;
            const bridgeHalfBase = moatW === 1 ? 1.35 : moatW === 2 ? 1.65 : 2.0;
            // 每座城专属的多频谐波参数与四段宽窄偏置
            const f1 = 3 + Math.floor(mrnd() * 3), f2 = 6 + Math.floor(mrnd() * 4), f3 = 11 + Math.floor(mrnd() * 5);
            const p1 = mrnd() * Math.PI * 2, p2 = mrnd() * Math.PI * 2, p3 = mrnd() * Math.PI * 2;
            const p4 = mrnd() * Math.PI * 2, p5 = mrnd() * Math.PI * 2, p6 = mrnd() * Math.PI * 2;
            const sideBias = [
                (mrnd() - 0.5) * 0.45 * Math.sqrt(moatW),
                (mrnd() - 0.5) * 0.45 * Math.sqrt(moatW),
                (mrnd() - 0.5) * 0.45 * Math.sqrt(moatW),
                (mrnd() - 0.5) * 0.45 * Math.sqrt(moatW),
            ];
            // 1~3 处天然水湾/深潭外扩（避开左右尖端 θ≈0 / ±π，分布在四段河身中段）
            const bulgeCount = 1 + Math.floor(mrnd() * 3);
            const qAngles = [0.28 * Math.PI, 0.72 * Math.PI, -0.72 * Math.PI, -0.28 * Math.PI];
            const bulges: Array<{ th0: number; amp: number; wid: number }> = [];
            for (let b = 0; b < bulgeCount; b++) {
                const q = (b + Math.floor(mrnd() * 4)) % 4;
                bulges.push({
                    th0: qAngles[q] + (mrnd() - 0.5) * 0.26 * Math.PI,
                    amp: (0.38 + mrnd() * 0.48) * (0.75 + 0.25 * moatW),
                    wid: 0.16 + mrnd() * 0.14,
                });
            }
            // 土堤：城门正前方不挖，每座门桥宽度带微幅差异，并在两侧做水滴圆头收口
            const lanes: Array<{ axis: 'i' | 'j'; sign: number; along: number; bh: number }> = [];
            for (const gt of this.wallGates) {
                if (gt.f !== 1 || !/GATE/.test(gt.key)) continue;
                const gu = (gt.x - cx) / (TAC_TILE_W / 2), gv = (gt.y - cy) / (TAC_TILE_H / 2);
                const gi = (gu + gv) / 2 - 0.5, gj = (gv - gu) / 2 - 0.5;
                const bh = bridgeHalfBase + (mrnd() - 0.5) * 0.26;
                if (Math.abs(gi) >= Math.abs(gj)) lanes.push({ axis: 'i', sign: Math.sign(gi), along: gj, bh });
                else lanes.push({ axis: 'j', sign: Math.sign(gj), along: gi, bh });
            }
            // 屏幕空间墙圈中心 (cx, rcy) 与第一象限墙段 A=(0, half·TH) → B=(half·TW, 0)
            const rcy = cy + 0.5 * TAC_TILE_H;
            const segAx = 0, segAy = half * TAC_TILE_H, segBx = half * TAC_TILE_W, segBy = 0;
            const segVx = segBx - segAx, segVy = segBy - segAy, segLen2 = segVx * segVx + segVy * segVy || 1;
            const unitPx = (TAC_TILE_W * TAC_TILE_H) / (2 * Math.hypot(TAC_TILE_W / 2, TAC_TILE_H / 2));
            const wallScreenDist = (x: number, y: number, ex: number, ey: number): number => {
                if (ex <= 0 && ey <= 0) return Math.max(ex, ey);
                const dx = Math.abs(x - cx), dy = Math.abs(y - rcy);
                const t = Math.max(0, Math.min(1, ((dx - segAx) * segVx + (dy - segAy) * segVy) / segLen2));
                return Math.hypot(dx - (segAx + t * segVx), dy - (segAy + t * segVy)) / unitPx;
            };
            inMoat = (x, y) => {
                const u = (x - cx) / (TAC_TILE_W / 2), v = (y - cy) / (TAC_TILE_H / 2);
                const ci = (u + v) / 2 - 0.5, cj = (v - u) / 2 - 0.5;
                const ex = Math.abs(ci) - half, ey = Math.abs(cj) - half;
                const d = wallScreenDist(x, y, ex, ey);
                const th = Math.atan2((y - rcy) * 2, x - cx);
                // 左右角转弯处收束波幅以保持圆润包角，四段直墙河道充分展开不规则起伏
                const tipFade = 0.25 + 0.75 * Math.sin(th) * Math.sin(th);
                const wIn = (0.18 * Math.sin(f1 * th + p1) + 0.12 * Math.cos(f2 * th + p2) + 0.07 * Math.sin(f3 * th + p3)) * tipFade;
                const dIn = Math.max(1.52, d0 + wIn);
                const qIdx = (x >= cx ? 0 : 1) + (y >= rcy ? 0 : 2);
                const wOut = (0.32 * Math.sin(f1 * th + p4) + 0.24 * Math.cos(f2 * th + p5) + 0.15 * Math.sin(f3 * th + p6)) * tipFade * (0.8 + 0.2 * moatW);
                let bulge = 0;
                for (const b of bulges) {
                    let dth = th - b.th0;
                    if (dth > Math.PI) dth -= Math.PI * 2;
                    else if (dth < -Math.PI) dth += Math.PI * 2;
                    bulge += b.amp * Math.exp(-(dth * dth) / (b.wid * b.wid));
                }
                const lrComp = 0.22 * Math.pow(Math.cos(th), 4);
                const span = Math.max(moatW === 1 ? 1.25 : moatW * 0.88, baseSpan + sideBias[qIdx] + wOut + bulge * tipFade + lrComp);
                const dOut = dIn + span;
                if (d < dIn || d >= dOut) return false;
                const capZone = 0.90;
                for (const ln of lanes) {
                    const sameSide = ln.axis === 'i' ? (Math.sign(ci) === ln.sign) : (Math.sign(cj) === ln.sign);
                    if (!sameSide) continue;
                    const distAlong = Math.abs((ln.axis === 'i' ? cj : ci) - ln.along);
                    if (distAlong <= ln.bh) return false;
                    if (distAlong < ln.bh + capZone) {
                        const profile = Math.sqrt((distAlong - ln.bh) / capZone);
                        const mid = dIn * 0.45 + dOut * 0.55;
                        const halfW = (dOut - dIn) * 0.5 * profile;
                        if (d < mid - halfW || d >= mid + halfW) return false;
                    }
                }
                return true;
            };
            // 🔴 [2026-10-13 主人令「有河流的可以和护城河连上」→「按这个方案做」] 护城河引水渠：
            //    只在**河流**地图（waterKind === 'river'）做；海、湖、城寨（无护城河）不连。
            //    挖河之前先记下天然河水格，再找「护城河格 ↔ 河水格」最近的一对，≤ 15 格才挖一条直渠（宽 = 护城河宽）。
            //    地面格在地平面上是正方形（96×48 屏幕 px ＝ 地平面 96×96），所以距离按 (x, 2y) 量。
            // 「城内」按墙圈算（离墙方框 < d0 格 ＝ 护城河内沿以内），不用城池素材椭圆：
            //    椭圆的高含建筑立面（洛阳 ry 876px ≈ 18 格），会把护城河整圈、连同河与壕之间的空地都算进城里 ⇒ 渠永远挖不出来。
            const inCityE = (x: number, y: number): boolean => {
                const u = (x - cx) / (TAC_TILE_W / 2), v = (y - cy) / (TAC_TILE_H / 2);
                const ex = Math.abs((u + v) / 2 - 0.5) - half, ey = Math.abs((v - u) / 2 - 0.5) - half;
                return wallScreenDist(x, y, ex, ey) < 1.52;
            };
            const N: number = gl.data?.width ?? 0;
            const riverCells: Array<[number, number]> = [];
            if (this.environmentPlan?.waterKind === 'river' && N > 0) {
                for (let gy = 0; gy < N; gy++) for (let gx = 0; gx < N; gx++) {
                    if (!gl.isWaterAtCell(gx, gy)) continue;
                    const p = gl.cellToScreen(gx + 0.5, gy + 0.5, W, H);
                    if (!inCityE(p.x, p.y) && !inMoat(p.x, p.y)) riverCells.push([p.x, p.y]);
                }
            }
            gl.addWaterCoverage(inMoat, W, H);   // 全城型按 5×5 子格覆盖率写水，使不规则岸线与圆角平滑自然
            if (riverCells.length > 0) {
                const moatPts: Array<[number, number]> = [];
                for (let gy = 0; gy < N; gy++) for (let gx = 0; gx < N; gx++) {
                    const p = gl.cellToScreen(gx + 0.5, gy + 0.5, W, H);
                    if (inMoat(p.x, p.y)) moatPts.push([p.x, p.y]);
                }
                let bestD = Infinity, a: [number, number] | null = null, b: [number, number] | null = null;
                for (const m of moatPts) for (const r of riverCells) {
                    const d = Math.hypot(r[0] - m[0], (r[1] - m[1]) * 2);
                    if (d < bestD) { bestD = d; a = m; b = r; }
                }
                const MAX_LEN = 15 * TAC_TILE_W;   // 15 个地面格
                // 渠不许穿城：沿线抽样，有一点落进城池椭圆就放弃
                let crossesCity = false;
                if (a && b) for (let t = 0; t <= 1; t += 0.05) if (inCityE(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)) { crossesCity = true; break; }
                if (a && b && bestD <= MAX_LEN && !crossesCity) {
                    // 🔴 [2026-10-13 主人报「河流和护城河衔接的不太好」] 原来是一根等宽直棒、两头直角：
                    //    ① 两端各延长（渠首缩进护城河、渠尾伸进河心），不留缝；
                    //    ② 两端做喇叭口（宽度向端点平滑放大 ~1.8 倍），与河、与护城河都是圆滑倒角而不是直角；
                    //    ③ 渠身带一个轻微的 S 形弯（振幅 0.7 格），不再是尺子画的直线。
                    const half0 = Math.max(0.5, moatW) * Math.hypot(TAC_TILE_W / 2, TAC_TILE_H) / 2;   // 护城河宽（等轴格）换算到地平面
                    let ax = a[0], ay = a[1] * 2, bx = b[0], by = b[1] * 2;
                    const L0 = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / L0, uy = (by - ay) / L0;
                    const EXT_A = TAC_TILE_W * 0.8, EXT_B = TAC_TILE_W * 1.6;
                    ax -= ux * EXT_A; ay -= uy * EXT_A; bx += ux * EXT_B; by += uy * EXT_B;
                    const L1 = Math.hypot(bx - ax, by - ay) || 1, vx = (bx - ax) / L1, vy = (by - ay) / L1;
                    const AMP = TAC_TILE_W * 0.7, FLARE = Math.min(0.3, (TAC_TILE_W * 3) / L1);
                    const inCanal = (x: number, y: number): boolean => {
                        const gx2 = x - ax, gy2 = y * 2 - ay;
                        const along = gx2 * vx + gy2 * vy, t = along / L1;
                        if (t < -0.02 || t > 1.02) return false;
                        const lat = -gx2 * vy + gy2 * vx - AMP * Math.sin(Math.PI * 2 * Math.max(0, Math.min(1, t)));
                        const fa = Math.max(0, 1 - t / FLARE), fb = Math.max(0, 1 - (1 - t) / FLARE);
                        const w = half0 * (1 + 0.8 * fa * fa + 0.8 * fb * fb);
                        return Math.abs(lat) <= w && !inCityE(x, y);
                    };
                    gl.addWaterCoverage(inCanal, W, H);
                    const moatOnly = inMoat;
                    inMoat = (x, y) => moatOnly(x, y) || inCanal(x, y);   // 下面清树/石头时一并清掉渠上的
                }
            }
        }
        const inCity = (x: number, y: number) => ((x - cx) ** 2) / (rx * rx) + ((y - cy) ** 2) / (ry * ry) <= 1;
        const hasGateRoads = (this.defenderCityType === 'big_city' || this.defenderCityType === 'medium_city') && ringLm > 0;
        const roadMaxU = ringLm / 2 + (this.defenderCityType === 'big_city' ? 14.5 : 12.0);
        const roadMaxV = this.defenderCityType === 'big_city' ? 2.1 : 1.8;
        const inGateRoad = (x: number, y: number): boolean => {
            if (!hasGateRoads) return false;
            const u = (x - cx) / (TAC_TILE_W / 2), v = (y - cy) / (TAC_TILE_H / 2);
            const di = Math.abs((u + v) / 2 - 0.5), dj = Math.abs((v - u) / 2 - 0.5);
            return (di <= roadMaxU && dj <= roadMaxV) || (dj <= roadMaxU && di <= roadMaxV);
        };
        this.decorSprites = this.decorSprites.filter((sp) => {
            if (sp.asset.startsWith('MOUNTAIN_')) return false;
            if (sp.asset.startsWith('BUILDING') || sp.asset === '') return true;
            const keep = !inCity(sp.x, sp.y) && !inGateRoad(sp.x, sp.y) && !(inMoat && inMoat(sp.x, sp.y));
            if (!keep) gl.carveFoundation(sp.x, sp.y, W, H, 2.2);
            return keep;
        });
        gl.flushFoundation();

        // ── 按真实山地地理与据点种子摆放 DE 大山模型（MOUNTAIN_01~11，纯视觉点缀，绝不挡路） ──
        const defCity: any = this.defenderCityRecord();
        const cLat = defCity?.lat ?? this.centerLat;
        const cLng = defCity?.lng ?? this.centerLng;
        const cId = this.defenderCityId ?? '';
        const elevM = this.environmentPlan?.elevationM ?? 0;
        const slopeDeg = this.environmentPlan?.slopeDeg ?? 0;
        const elevBand = this.environmentPlan?.elevationBand;
        const isHighlandSite = !EXCLUDED_PASS_IDS.has(cId) && (
            elevBand === 'highland' || elevBand === 'alpine' || elevM >= 550 || slopeDeg >= 2.5
        );
        const shouldSpawnDeMountains = this.passMountainConfig?.enabled !== undefined
            ? this.passMountainConfig.enabled
            : (this.defenderCityType === 'pass'
                ? isMountainPass(cId, cLat, cLng, defCity?.name)
                : isHighlandSite);
        if (shouldSpawnDeMountains) {
            const isSnowScene = this.sceneSeason === 2
                || this.environmentPlan?.biome === 'tundra_snow'
                || gl.isIce
                || !!(this.environmentPlan?.baseTerrain && /^(sno|sn2|snf|snd|snr|ic3|ice)/i.test(this.environmentPlan.baseTerrain));
            const GREEN_MOUNTAIN_POOL = ['MOUNTAIN_01', 'MOUNTAIN_02', 'MOUNTAIN_03', 'MOUNTAIN_04', 'MOUNTAIN_05', 'MOUNTAIN_06'];
            const SNOW_MOUNTAIN_POOL = ['MOUNTAIN_07', 'MOUNTAIN_08', 'MOUNTAIN_09', 'MOUNTAIN_10', 'MOUNTAIN_11'];
            const pool = isSnowScene ? SNOW_MOUNTAIN_POOL : GREEN_MOUNTAIN_POOL;
            let mSeed = (hash >>> 0) ^ 0x6c8e9cf5;
            const mRnd = (): number => {
                mSeed = Math.imul(mSeed ^ (mSeed >>> 15), 0x85ebca6b) >>> 0;
                mSeed = Math.imul(mSeed ^ (mSeed >>> 13), 0xc2b2ae35) >>> 0;
                return ((mSeed ^ (mSeed >>> 16)) >>> 0) / 4294967296;
            };
            const anchors: Array<[number, number]> = [
                [cx + rx * 0.85 + 260, cy + ry * 0.70 + 170],
                [cx + rx * 0.85 + 260, cy - ry * 0.70 - 150],
                [cx - rx * 0.85 - 260, cy - ry * 0.70 - 150],
                [cx - rx * 0.85 - 260, cy + ry * 0.70 + 170],
                [cx + rx + 420, cy + (mRnd() - 0.5) * 160],
                [cx + (mRnd() - 0.5) * 240, cy - ry - 240],
            ];
            // 按种子打乱候选外围山位，挑不落水、不压门道的 2~3 处
            const order = anchors.map((pt, idx) => ({ pt, idx, k: mRnd() })).sort((a, b) => a.k - b.k);
            const targetCount = this.defenderCityType === 'pass' ? (2 + (mRnd() < 0.45 ? 1 : 0)) : (1 + Math.floor(mRnd() * 2));
            let placed = 0;
            for (const item of order) {
                if (placed >= targetCount) break;
                const jx = (mRnd() - 0.5) * 90, jy = (mRnd() - 0.5) * 50;
                let mx = item.pt[0] + jx, my = item.pt[1] + jy;
                if (placed === 0 && this.passMountainConfig?.x !== undefined) mx = this.passMountainConfig.x;
                if (placed === 0 && this.passMountainConfig?.y !== undefined) my = this.passMountainConfig.y;
                if (placed === 1 && this.passMountainConfig?.northX !== undefined) mx = this.passMountainConfig.northX;
                if (placed === 1 && this.passMountainConfig?.northY !== undefined) my = this.passMountainConfig.northY;
                if (placed > 0 && (gl.isWaterAt(mx, my, W, H) || inGateRoad(mx, my) || inCity(mx, my))) continue;
                const pick = pool[Math.floor(mRnd() * pool.length)];
                const mAsset = (placed === 0 && this.passMountainConfig?.asset)
                    ? this.passMountainConfig.asset
                    : (placed === 1 && this.passMountainConfig?.northAsset)
                        ? this.passMountainConfig.northAsset
                        : pick;
                const mScale = (placed === 0 && this.passMountainConfig?.scale !== undefined)
                    ? this.passMountainConfig.scale
                    : (placed === 1 && this.passMountainConfig?.northScale !== undefined)
                        ? this.passMountainConfig.northScale
                        : +(0.92 + mRnd() * 0.20).toFixed(2);
                const mFlip = (placed === 0 && this.passMountainConfig?.flip !== undefined)
                    ? this.passMountainConfig.flip
                    : (placed === 1 && this.passMountainConfig?.northFlip !== undefined)
                        ? this.passMountainConfig.northFlip
                        : (mRnd() < 0.5);
                this.ensureNatureAsset(mAsset);
                this.decorSprites.push({
                    asset: mAsset,
                    frame: 0,
                    x: mx,
                    y: my,
                    flip: mFlip,
                    layer: 'world',
                    z: 0,
                    scale: mScale,
                    indestructible: true,
                    obstruction: undefined,
                    obstructionContactSec: 0,
                    obstructionTouched: false,
                    obstructionDisabled: true,
                });
                placed++;
            }
        }

        for (const sp of this.decorSprites) {
            sp.lift = (sp.asset.startsWith('BUILDING') || sp.asset === '') ? undefined : gl.elevationLiftAt(sp.x, sp.y, W, H);
        }
    }

    /** 地基层 DOM 跟着镜头走：城心屏幕位置 ＝ 画布中心 ＋ 平移 ＋ (城心 − 中心) × 缩放 */
    private syncDeCityGround(): void {
        const el = this.deCityGround, c = this.deCity, cv = this.canvas;
        if (!el || !c || !cv) return;
        // 🔴 [2026-10-13 主人令「PASS的内城套上和中城一样的地基地图」] 允许 pass 正常展示内城地基
        if (!this.useGroundGL || (!this.active && !this.lingering)) {
            el.style.display = 'none';
            return;
        }
        const z = this.tacticalZoom;
        const lift = this.elevationLiftAt(this.deCityCenter.x, this.deCityCenter.y);
        const sx = cv.width / 2 + this.tacticalPanX + (this.deCityCenter.x - this.worldCX) * z;
        const sy = cv.height / 2 + this.tacticalPanY + (this.deCityCenter.y - lift - this.worldCY) * z;
        el.style.display = 'block';
        el.style.opacity = cv.style.opacity;
        el.style.transform = `translate(${sx - (c.width / 2) * z}px, ${sy - (c.height / 2) * z}px) scale(${z})`;
    }

    private applySpawnBuildings(): void {
        const sides: Array<0 | 1> = [0, 1];
        for (const f of sides) this.applyBuildingsForSide(f);
    }

    private applyBuildingsForSide(f: 0 | 1): void {
        // 玩家自带精锐是临时追加的战术出兵位，不属于军团九格编制；
        // 若把它计入这里，守城方会因 10 !== 9 提前返回，整座城墙都不生成。
        // 🔴 [2026-09-23] 主将队（第 10 口，前排再往前）不是编制建筑位：不计入，否则拒马挤在主将一口前、营地城墙因 10≠9 全不生成
        const side = this.spawns.filter((s) => s.f === f && !s.playerElite && !s.commander);
        // 🔴 [2026-10-11] 新战术模式攻城战守方：城池＝战略地图同款，整座摆在地图中心（不再走下面旧 13 的「右侧直墙＋九口建筑」）
        if (f === 1 && this.deCity) { this.buildDeCity(); return; }
        // 攻击方（攻城/野战）、野战防守方，以及**攻城城寨(stockade)/漠北蒙古(MOBEI_MONGOL)守方**都在最前排营地前铺一道木桩拒马线。
        // 其余攻城守方（中城/大城/关隘）有城墙，不摆（主人 2026-09-03：城寨前面用拒马，不用篱笆）。
        const skipBarricade = this.battleType === 'siege' && f === 1 && this.defenderCityType !== 'stockade' && !this.isMobeiMongolDefender();
        if (!skipBarricade && side.length > 0) {
            const barricadeAsset = 'BATTLEFIELD:STAKE_BARRICADE';
            // 🔴 [2026-10-11 主人令「攻方在右，拒马就反了，营地应该放一圈拒马」＋「拒马应该是照着敌方的方向」]
            //    原实现：只在「最前排那一列」外侧铺一条竖线，`x = frontX ± 180`、`flip` 按攻/守写死 ——
            //    攻方被镜像到右边时，这条线画在哪一侧、朝哪边全是反的。
            //    现改成：**围营地一圈**，且每一根的朝向**照敌方**——把「朝敌那一侧」的拒马镜像过去，
            //    使拒马正面一律与营心→敌方的方向对齐（不再按攻/守写死，也不受左右镜像影响）。
            const CEN = { x: side.reduce((a, p) => a + p.x, 0) / side.length, y: side.reduce((a, p) => a + p.y, 0) / side.length };
            const spread = Math.max(...side.map((p) => Math.hypot(p.x - CEN.x, p.y - CEN.y)));
            // 🔴 [2026-10-11 主人令「拒马太密，太多了，应该分布在营地外」]
            //    改前：圈半径 = spread + 48 ⇒ 紧贴九口外接、**压在营帐上**；桩距 = 0.9×素材宽 ⇒ 密到看不出是拒马。
            //    改后：圈半径 = spread + 200（**挪到营地外**，清开帐篷/箭塔/哨站的外沿）；
            //          桩距 = 3.4×素材宽（约 163px，**根数减少约一半**），一圈只留必要的疏朗几根。
            const ringR = spread + 200;                              // 营地外沿再放 200px
            const BAR_HALF_W = 48;                                   // 素材框宽 96
            const barricadeCount = Math.max(8, Math.round((2 * Math.PI * ringR) / (BAR_HALF_W * 3.4)));
            // 敌方方向：由「己方营心 → 敌方营心」定；拿不到就用本阵前进向量兜底
            const foeSide = this.spawns.filter((s) => s.f !== f);
            const foeCen = foeSide.length
                ? { x: foeSide.reduce((a, p) => a + p.x, 0) / foeSide.length, y: foeSide.reduce((a, p) => a + p.y, 0) / foeSide.length }
                : { x: CEN.x + this.advanceVec[f].x * 1000, y: CEN.y + this.advanceVec[f].y * 1000 };
            const EX = foeCen.x - CEN.x, EY = foeCen.y - CEN.y;
            const eLen = Math.hypot(EX, EY) || 1;
            const ex = EX / eLen, ey = EY / eLen;
            /** 拒马正面是否朝敌：素材正面朝西南（屏幕 (-0.707,+0.707)），用「由营心指向该根」的法线点乘敌方向判定 */
            const faceEnemy = (dx: number, dy: number): boolean => (dx * ex + dy * ey) > 0;
            this.ensureNatureAsset(barricadeAsset);
            for (let i = 0; i < barricadeCount; i++) {
                const a = (i / barricadeCount) * Math.PI * 2;
                const dx = Math.cos(a), dy = Math.sin(a) * 0.58;     // 等距压缩（与地面同一 2.5D 比例）
                this.decorSprites.push({
                    asset: barricadeAsset, frame: 0,
                    x: CEN.x + dx * ringR,
                    y: CEN.y + dy * ringR,
                    flip: faceEnemy(dx, dy),
                    scale: 1.0,
                    layer: 'world', z: 0,
                    obstruction: undefined,
                    obstructionContactSec: 0, obstructionTouched: false, obstructionDisabled: true,
                });
            }
        }
        if (side.length !== 9) return;
        const camps = ['CAMP_ARCHERY_RANGE', 'CAMP_BARRACKS', 'CAMP_STABLE'];
        const shuffledCamps = [...camps].sort(() => Math.random() - 0.5);
        const place = (
            s: { x: number; y: number },
            asset: string,
            options?: {
                flip?: boolean;
                frame?: number;
                z?: number;
                scale?: number;
                obstruction?: { x: number; y: number };
                indestructible?: boolean;
            },
        ): DecorSprite => {
            // 🔴 [2026-10-03 主人令「请把所有的中城和大城的都设计为城堡居中」] 原先此处有一道硬闸：
            //    「战略大城不含城堡」——凡战术大城（battleType=siege 守方）落 CASTLE 素材，一律换成 TOWN_CENTER_AGE4。
            //    该闸来自旧口径（中城/大城九建筑都不含城堡），与主人本令直接冲突 → **已撤除**，大城城堡照落。
            const full = 'BUILDING:' + asset;
            this.ensureNatureAsset(full);
            const px = s.x, py = s.y;
            // 🔴 [2026-10-11 主人令「我们现在这里的战术地图都是陆战，就算地图中有水，也都是属于浅水可以通行的区域。请酌情处理。」
            //    ＋ 上一条「有的地图中，士兵不出现在出兵口，出兵口应该是营地的建筑」]
            //    **撤除 2026-08-26 的「安全占地修正」**（原逻辑：出兵口建筑若落在水域就沿 x 一步步挪开，最多 15×25=375px）。
            //    撤除理由：① 本模式全是陆战、水一律是**可通行的浅水**，营帐落在浅水上不必避；
            //    ② 那段挪移会让**建筑离开出兵口**，而士兵仍从原格出来 ⇒ 「有的地图里士兵不出现在营帐」。
            //    撤掉之后：出兵口与营地建筑**永远同格**（实测逐格 0px），士兵一律从自己的营帐里出来。
            //    对照：士兵阵位的避水更早（2026-10-11 主人令「水/树林/建筑一律可通行」）就已删除，此行是补齐同一口径。
            return {
                asset: full,
                frame: options?.frame ?? 0,
                x: px,
                y: py,
                flip: options?.flip ?? (Math.random() < 0.5),
                layer: 'world',
                z: options?.z ?? 0,
                scale: options?.scale,
                obstruction: options?.obstruction,
                indestructible: options?.indestructible,
                obstructionContactSec: 0,
                obstructionTouched: false,
                obstructionDisabled: false,
            };
        };

        // 蒙古（草原游牧）营地：8 蒙古包 + 1 瞭望塔（不用通用营地/帐篷/城内建筑）
        // 🔴 [2026-08-22 主人定] 只用真蒙古包 E~L（A~D 是茅草屋,弃用）——DE b_scen_yurt_e..l, 共 8 个正好用满
        const placeYurtCamp = (
            scale?: number,
            availableSpawns = side,
            towerScale = SIEGE_CITY_BUILDING_SCALE,
            /**
             * 🔴 [2026-10-15 主人令「我们算建筑，有坍塌动画的都是建筑」]
             *  defenderSettlement=true  = **守方的毡帐聚落**（＝该城的 9 建筑：8 蒙古包 + 1 瞭望塔）：
             *                            走 `trackCityBuilding`（可被打 + 照常射箭）。
             *  defenderSettlement=false = **攻方营寨 / 野战营寨**：同样**登记为建筑**（有 DE 血量、
             *                            受伤掉血、血归零走 DE 倒塌链），但**不射箭**（不挂 cityBuildings）。
             */
            defenderSettlement = false,
        ): void => {
            if (availableSpawns.length === 0) return;
            const shuffledSpawns = [...availableSpawns].sort(() => Math.random() - 0.5);
            const yurts = ['YURT_E', 'YURT_F', 'YURT_G', 'YURT_H', 'YURT_I', 'YURT_J', 'YURT_K', 'YURT_L'];
            const shuffledYurts = [...yurts].sort(() => Math.random() - 0.5);
            for (let i = 0; i < shuffledSpawns.length - 1; i++) {
                const sp = place(shuffledSpawns[i], shuffledYurts[i], { scale });
                this.decorSprites.push(sp);
                if (defenderSettlement) {
                    this.trackCityBuilding(sp);     // 守方毡帐聚落 = 9 建筑（可被打 + 射箭）
                } else {
                    this.registerDefBuilding(sp, shuffledYurts[i], undefined, undefined, f as 0 | 1);   // 营寨 = 建筑（可被打，不射箭）
                    this.ensureDestrAssetsFor(shuffledYurts[i]);
                }
            }
            // 🔴 [2026-08-26 主人定「战略和战术的建筑保持一致」] 蒙古营地塔 = 亚洲瞭望塔（ASIA_TOWER_AGE2），
            //    与战略地图草原营地同款（弃 AFRI 茅草顶木架哨塔）。
            // 🔴 [2026-10-03 主人令] 塔（箭塔族）**不跟营帐用同一缩放**：一律与守方箭塔的 `SIEGE_CITY_BUILDING_SCALE` 对齐，
            //    否则攻方营地的塔比守方城墙内侧的箭塔大一圈（营帐仍按调用方给的 scale，不动）。
            // 🔴 [2026-10-15 主人令] 这座塔同样算建筑：守方毡帐城要登记成第 9 栋（可打 + 射箭）；
            //    攻方营寨的塔也登记（可打、会塌），只是不射箭。
            const towerAsset = 'ASIA_TOWER_AGE2';
            const towerSp = place(shuffledSpawns[shuffledSpawns.length - 1], towerAsset, { scale: towerScale });
            this.decorSprites.push(towerSp);
            if (defenderSettlement) {
                this.trackCityBuilding(towerSp);
            } else {
                this.registerDefBuilding(towerSp, towerAsset, undefined, undefined, f as 0 | 1);
                this.ensureDestrAssetsFor(towerAsset);
            }
        };

        // 攻城战守方：城墙 + 按城等级选建筑池（大城=帝国时代 age4；中城=城堡时代 age3；小城/险要=封建时代 age2）
        if (this.battleType === 'siege' && f === 1) {
            // 城内特殊建筑优先显示：主奇观占最中央落点，附加奇观依次由中心向外占位。
            // 纯视觉（BUILDING: 前缀单帧，无碰撞，不破坏阵型），并明确标记为不可坍塌。
            const wonderAssets: string[] = [];
            const wonderSpots: Array<{ x: number; y: number }> = [];
            if (this.defenderCityId) {
                const mainWonder = CITY_WONDER[this.defenderCityId];
                if (mainWonder) wonderAssets.push(mainWonder);
                const extraWonders = CITY_WONDER_EXTRA[this.defenderCityId];
                if (extraWonders) for (const ex of extraWonders) wonderAssets.push(ex.asset);
            }
            if (wonderAssets.length > 0) {
                const centerX = side.reduce((sum, s) => sum + s.x, 0) / side.length;
                const centerY = side.reduce((sum, s) => sum + s.y, 0) / side.length;
                const centerPrioritySide = [...side].sort((a, b) => {
                    const da = Math.hypot(a.x - centerX, a.y - centerY);
                    const db = Math.hypot(b.x - centerX, b.y - centerY);
                    return da - db || a.y - b.y || a.x - b.x;
                });
                for (let i = 0; i < wonderAssets.length; i++) {
                    const spot = centerPrioritySide[Math.min(i, centerPrioritySide.length - 1)];
                    wonderSpots.push(spot);
                    const wsp = place({ x: spot.x, y: spot.y }, wonderAssets[i], { z: 2, scale: SIEGE_WONDER_SCALE });
                    this.decorSprites.push(wsp);
                    this.trackCityBuilding(wsp, 'WONDER');
                }
            }
            // 普通建筑池避开特殊建筑占用的落点，不与其重叠。
            const buildingSide = wonderSpots.length > 0
                ? side.filter((s) => !wonderSpots.some((w) => w.x === s.x && w.y === s.y))
                : side;
            const style = this.buildingStyleFor(1);
            // 🔴 [2026-09-16 主人定]「二级蒙古的大中小城中的 9 建筑添加蒙古包随机，总体不能超过 9 个。」
            //    守城方是**二级「蒙古」**（据点 buildingStyle === 'MONGOL'，不是三级漠北蒙古）时，
            //    大/中/小城的 9 建筑池里随机掺入 8 个真蒙古包（YURT_E~L，目录名直传 place() → 无风格前缀问题），
            //    最终栋数**恒为 9**（与战略地图 TerritorySystem、据点编辑页完全同一口径）。
            const defenderCity: any = this.defenderCityRecord();
            const defenderIsMongol = !!defenderCity && defenderCity.buildingStyle === 'MONGOL';
            const cityPoolBuildings = (base: string[]): string[] =>
                defenderIsMongol ? [...base, ...MONGOL_CITY_YURTS] : [...base];
            const isYurtAsset = (b: string): boolean => b.startsWith('YURT_');
            // 城墙/城门 = 装饰贴图 + 碰撞阻挡（照 DE，不可攻击）：铺贴图 + 建碰撞格（士兵不打墙、但 30 秒塌墙前被挡在城外）
            // 🔴 [2026-08-22 主人需求] 30 秒随机塌一半城墙，塌掉的墙段放行 + 留残骸：
            //    城门 → 播 50 帧倒塌动画 → 留 rubble 残骸；石墙/垛墙 → 切 D75 残垣；木栅栏 → 切木门 rubble 残骸。
            const placeWall = (s: { x: number; y: number }, asset: string, key: 'STONE_WALL' | 'STONE_GATE', linked = false): void => {
                // 🔴 [2026-09-18] 毡帐险要按战略地图**无围墙**（buildYurtCampHtml(fence=false)）：一段都不铺
                if (wallMat === 'NONE') return;
                // 城墙 = 可攻击建筑（照 DE）：士兵能打、HP 归零破墙；碰撞 0.95 堵住相邻段缝隙
                const sprite = place(s, asset, { flip: false, z: 1, obstruction: { x: 0.95, y: 0.95 } });
                this.decorSprites.push(sprite);
                // 木栅栏/篱笆走 WOOD_WALL 档（hp 250、防 2/5）；石墙/垛墙才是 STONE_WALL
                const wKey = (asset.includes('PALISADE') || asset.includes('FENCE')) ? 'WOOD_WALL' : key;
                const st = WALL_GATE_STATS[wKey];
                // 石墙/垛墙有破损档 destr_*（破墙前按 HP 渐进切换）；坍塌时统一播放 DE 1x1 坍塌动画 FOUNDATION_1X1_DESTR
                const isFence = asset.includes('FENCE');
                const destrAssets = (asset.includes('PALISADE') || isFence) ? undefined : ['D25', 'D50', 'D75'].map((t) => `${asset}_${t}`);
                if (destrAssets) for (const d of destrAssets) this.ensureNatureAsset('BUILDINGANIM:' + d);
                const wallRubble = isFence ? 'BATTLEFIELD:FENCE_RUBBLE' : 'FOUNDATION_1X1_RUBBLE';
                if (isFence) {
                    this.ensureNatureAsset('BATTLEFIELD:FENCE_RUBBLE');
                } else {
                    this.ensureNatureAsset('BUILDINGANIM:FOUNDATION_1X1_DESTR');
                    this.ensureNatureAsset('BUILDINGANIM:FOUNDATION_1X1_RUBBLE');
                }
                this.wallGates.push({ f: 1, key: wKey, x: s.x, y: s.y, hp: st.hp, maxHp: st.hp, claims: 0, claimsNext: 0, atkNext: 0, atkers: 0, sprite, linked, destrAssets, rubbleAsset: wallRubble });
            };
            // 城门：可攻击建筑（照 DE，城门 HP 更高），沿线铺 6 点密实碰撞体堵跨度两侧缝隙；破门播 100 帧倒塌动画 → rubble 残骸
            const placeGate = (s: { x: number; y: number }, asset: string, dir: 'NE' | 'SE'): void => {
                // 🔴 [2026-09-18] 同 placeWall：毡帐险要无围墙，也就没有城门
                if (wallMat === 'NONE') return;
                const sprite = place(s, asset, { flip: false, z: 1, obstruction: { x: 0.95, y: 0.95 } });
                this.decorSprites.push(sprite);
                // 🔴 [2026-10-13 全面体检抓出·已修] 木栅栏门/篱笆门原套 `STONE_GATE` 的血甲（1650 + 6/6），
                //    与相邻木墙（`WOOD_WALL` 540/2/5）差 3 倍。木门照木墙档；**key 仍写 'STONE_GATE'**（不新增键，
                //    否则城门倒塌链认不出它 —— 木门会打不烂）。
                const st = (asset.includes('FENCE') || asset.includes('PALISADE')) ? WALL_GATE_STATS.WOOD_WALL : WALL_GATE_STATS.STONE_GATE;
                const extraSprites: DecorSprite[] = [];
                const dSign = dir === 'NE' ? -1 : 1;
                for (let step = -3; step <= 3; step++) {
                    if (step === 0) continue;
                    const extra: DecorSprite = {
                        asset: '', frame: 0, x: s.x + step * 24, y: s.y + step * 12 * dSign, flip: false, layer: 'world', z: 1,
                        obstruction: { x: 0.95, y: 0.95 },
                        obstructionContactSec: 0, obstructionTouched: false, obstructionDisabled: false,
                    };
                    this.decorSprites.push(extra);
                    extraSprites.push(extra);
                }
                // 城门倒塌动画 + 残骸素材（DE gate_*_destruction / _rubble；篱笆门用 DE b_scen_fence_rubble）
                const isFenceGate = asset.includes('FENCE');
                let rubbleAsset: string;
                if (isFenceGate) {
                    rubbleAsset = 'BATTLEFIELD:FENCE_RUBBLE';
                    this.ensureNatureAsset(rubbleAsset);
                } else {
                    rubbleAsset = `${asset}_RUBBLE`;
                    this.ensureNatureAsset('BUILDINGANIM:' + `${asset}_DESTR`);
                    this.ensureNatureAsset('BUILDINGANIM:' + rubbleAsset);
                }
                this.wallGates.push({ f: 1, key: 'STONE_GATE', x: s.x, y: s.y, hp: st.hp, maxHp: st.hp, claims: 0, claimsNext: 0, atkNext: 0, atkers: 0, sprite, extraSprites, linked: true, rubbleAsset });
            };
            // 🔴 [2026-08-22 主人定] 梯子型平档城防：扩大城郭范围，100%完整包含全部内城建筑群
            let wMinX = Infinity, wMaxX = -Infinity, wMinY = Infinity, wMaxY = -Infinity;
            for (const s of side) {
                if (s.x < wMinX) wMinX = s.x;
                if (s.x > wMaxX) wMaxX = s.x;
                if (s.y < wMinY) wMinY = s.y;
                if (s.y > wMaxY) wMaxY = s.y;
            }
            // 🔴 [主人明确指示 2026-08-22] 正统 C 型三面包卫宏伟城堡要塞防线：正面垂直主长城向前推进 120px，彻底包裹全部内城建筑
            const wallFrontX = Math.round(wMinX - 380);
            const midY = (wMinY + wMaxY) * 0.5;
            const pitch = 40; // 垂直直墙咬合步长
            const pitchDx = 48; // 等距斜向 X 步长
            const pitchDy = 24; // 等距斜向 Y 步长

            const topWallY = midY - 8.5 * pitch;
            const botWallY = midY + 8.5 * pitch;

            // 🔴 [2026-10-01 主人定「战略地图上用的哪种围墙，战术模式中就要用哪个围墙」]
            //    调用共享解析函数 resolveTacticalWallSetup，战略与战术 100% 同源对齐
            const isYurtDefender = style === 'YURT';
            const { wallMat, wBase, gBase, wallPost } = resolveTacticalWallSetup(
                this.defenderCityType,
                style,
                this.sideCulture[1],
                this.defenderCityId,
                this.defenderCityRecord()?.buildingStyle ?? null,
                // 城寨栅栏材质：与战略地图同一顺序（单独指定 → 建筑风格 → 编辑器分类样式）
                this.defenderCityType === 'stockade' && this.defenderCityId
                    ? resolveStockadeFenceKey(this.defenderCityId, style, this.defenderCityRecord()?.stockadeShape, this.defenderCityRecord()?.stockadeFence)
                    : null,
            );

            // 1. 北翼防线 (NE 东北向展开，对齐 DE 72/36 网格标准，全线多点密集阻挡锁死)
            // (1) 北翼向上完整双塔大城门 (左角塔在 (wallFrontX, topWallY), 右角塔在 (wallFrontX + 144, topWallY - 72))
            placeGate({ x: wallFrontX + 72, y: topWallY - 36 }, gBase + '_NE', 'NE');
            // (2) 从城门右角塔外侧第一格(k=1)顺畅接出 14 段 NE 斜城墙 (连贯平滑，深远包裹整座要塞)
            for (let k = 1; k <= 14; k++) {
                placeWall({ x: wallFrontX + 144 + k * pitchDx, y: topWallY - 72 - k * pitchDy }, wBase + '_NE', 'STONE_WALL');
            }
            // (3) 北翼末端正统城垛立柱 (Wall Post)
            placeWall({ x: wallFrontX + 144 + 15 * pitchDx, y: topWallY - 72 - 15 * pitchDy }, wallPost, 'STONE_WALL');

            // 2. 正面城墙：整排连续垂直主城墙（2026-08-22 主人定：正面中央是城墙，城门只留北翼/南翼 2 座）
            //    正面墙段 linked=true（参与「一处破 → 前排全倒」联动）
            //    主人 2026-09-03：城寨(stockade)只换**前排**——正面不铺篱笆墙（改拒马线，见 applyBuildingsForSide），两侧篱笆保留
            // 🔴 [2026-10-11 主人令「所有建筑改为贴图。确保士兵通行」] 城内建筑一律**去掉碰撞**（纯贴图）：
            //    只有墙/门/城垛/围栏保留阻挡（墙有两条坍塌路径：受伤每 10 秒自动塌一处 + 血归零即塌）。
            for (const sp of this.decorSprites) {
                const _a = String(sp.asset || '');
                if (/WALL|GATE|POST|PALISADE|FENCE|TOWER/i.test(_a)) continue;
                sp.obstruction = undefined;
                sp.obstructionDisabled = true;
            }
            //    🔴 [2026-09-19 主人定] 漠北蒙古风格(MOBEI_MONGOL)和城寨野战一样正面不铺墙，直接开战
            if (this.defenderCityType !== 'stockade' && !this.isMobeiMongolDefender()) {
                for (let i = -8.5; i <= 8.5; i += 1.0) {
                    placeWall({ x: wallFrontX, y: midY + i * pitch }, wBase + '_N', 'STONE_WALL', true);
                }
            }

            // 3. 南翼防线 (SE 东南向展开，对齐 DE 72/36 网格标准，全线多点密集阻挡锁死)
            // (1) 南翼向下完整双塔大城门 (左角塔在 (wallFrontX, botWallY), 右角塔在 (wallFrontX + 144, botWallY + 72))
            placeGate({ x: wallFrontX + 72, y: botWallY + 36 }, gBase + '_SE', 'SE');
            // (2) 从城门右角塔外侧第一格(k=1)顺畅接出 14 段 SE 斜城墙 (连贯平滑，深远包裹整座要塞)
            for (let k = 1; k <= 14; k++) {
                placeWall({ x: wallFrontX + 144 + k * pitchDx, y: botWallY + 72 + k * pitchDy }, wBase + '_SE', 'STONE_WALL');
            }
            // (3) 南翼末端正统城垛立柱 (Wall Post)
            placeWall({ x: wallFrontX + 144 + 15 * pitchDx, y: botWallY + 72 + 15 * pitchDy }, wallPost, 'STONE_WALL');

            // 🔴 [2026-09-20 主人方案 C 定稿] 只有「有山关隘」才使用大山场景；渡口/海防/平原要塞 100% 排除
            const shouldSpawnMountain = this.defenderCityType === 'pass' && (
                this.passMountainConfig?.enabled !== undefined
                    ? this.passMountainConfig.enabled
                    : (() => {
                        const defenderCity = this.defenderCityId ? (CITIES_V2 as any[]).find((c) => c.id === this.defenderCityId) : null;
                        const lat = defenderCity?.lat ?? this.centerLat;
                        const lng = defenderCity?.lng ?? this.centerLng;
                        return isMountainPass(this.defenderCityId, lat, lng, defenderCity?.name);
                    })()
            );

            if (shouldSpawnMountain) {
                // 🔴 [2026-10-08 主人「险要的防守方的两座山一个有雪一个没雪」修复]
                //    根据当前战场季节（冬=2）与地貌（冻原雪地 tundra_snow / 冰雪底图）区分雪山池与青山池，
                //    两座大山处于同一气候池，彻底根除「同一道关卡一座有雪、一座没雪」的视觉割裂。
                const isSnowScene = this.sceneSeason === 2
                    || this.environmentPlan?.biome === 'tundra_snow'
                    || !!(this.environmentPlan?.baseTerrain && /snow|snd|ice/i.test(this.environmentPlan.baseTerrain));

                const GREEN_MOUNTAIN_POOL = [
                    'MOUNTAIN_01', 'MOUNTAIN_02', 'MOUNTAIN_03', 'MOUNTAIN_04', 'MOUNTAIN_05', 'MOUNTAIN_06',
                ];
                const SNOW_MOUNTAIN_POOL = [
                    'MOUNTAIN_07', 'MOUNTAIN_08', 'MOUNTAIN_09', 'MOUNTAIN_10', 'MOUNTAIN_11',
                ];
                const pool = isSnowScene ? SNOW_MOUNTAIN_POOL : GREEN_MOUNTAIN_POOL;
                const pickMountain = () => pool[Math.floor(Math.random() * pool.length)];

                // 1. 南翼大山（根据战场地貌气候从对应池中抽取样式，支持翻转；纯贴图不卡兵）
                const mAsset = this.passMountainConfig.asset || pickMountain();
                this.ensureNatureAsset(mAsset);
                // 默认坐标：严格置于战场最底部边缘、南翼斜城墙正下方，绝不遮挡中央冲锋路线、城门通道与出兵口
                const mX = this.passMountainConfig.x ?? (wallFrontX + 230);
                const mY = this.passMountainConfig.y ?? (botWallY + 230);
                // 🔴 [2026-10-11 主人令「它是地貌装饰不是建筑——要也拉回 1.0」] 险要山体默认缩放 1.2 → **1.0**
                //    （第 116 轮曾按「回滚被改坏的」恢复成 1.2；本轮按主人令统一到 DE 原生 100%）
                const mScale = this.passMountainConfig.scale ?? 1.0;
                const mFlip = this.passMountainConfig.flip ?? (Math.random() > 0.5);
                this.decorSprites.push({
                    asset: mAsset,
                    frame: 0,
                    x: mX,
                    y: mY,
                    flip: mFlip,
                    layer: 'world',
                    z: 0,
                    scale: mScale,
                    indestructible: true,
                    obstruction: undefined,
                    obstructionContactSec: 0,
                    obstructionTouched: false,
                    obstructionDisabled: true,
                });

                // 2. 北翼大山（上方「两山夹一关」天险，与南翼处于同一气候风貌池中抽取；翻转互补）
                const northAsset = this.passMountainConfig.northAsset || pickMountain();
                this.ensureNatureAsset(northAsset);
                // 默认坐标：严格置于战场北翼斜城墙背侧上端，绝不遮挡北城门通道与冲锋交战路线
                const nX = this.passMountainConfig.northX ?? (wallFrontX + 230);
                const nY = this.passMountainConfig.northY ?? (topWallY - 210);
                // 🔴 [2026-10-11 主人令「它是地貌装饰不是建筑——要也拉回 1.0」] 北翼山体默认缩放 1.2 → **1.0**
                const nScale = this.passMountainConfig.northScale ?? 1.0;
                const nFlip = this.passMountainConfig.northFlip ?? !mFlip;
                this.decorSprites.push({
                    asset: northAsset,
                    frame: 0,
                    x: nX,
                    y: nY,
                    flip: nFlip,
                    layer: 'world',
                    z: 0,
                    scale: nScale,
                    indestructible: true,
                    obstruction: undefined,
                    obstructionContactSec: 0,
                    obstructionTouched: false,
                    obstructionDisabled: true,
                });
            }

            // 🔴 [2026-10-15 主人令「所有的栅栏，城墙都是一样的，不要搞那么复杂，都是可以被打坍塌的」]
            //    **此处原有两条例外已删**（2026-09-03「城寨围墙城门全部纯贴图去碰撞」＋ 2026-09-19「漠北蒙古同样去碰撞」）：
            //    按新令「规则冲突时删除更早的规则」，城寨/漠北蒙古的栅栏、篱笆、城门、木垛**一律和别的城池同一条链** ——
            //      ① 保留碰撞（placeWall/placeGate 设的 obstruction 不再被清掉）⇒ 拦得住兵；
            //      ② 挨打掉血后走两条：**每 10 秒自动塌一处受伤的墙**（2026-10-15 令）＋ 血归零立刻
            //         `collapseOneWall` 播 FOUNDATION_1X1_DESTR 切残骸；
            //      ③ 城内建筑、箭塔、营寨不自动坍塌：只在自己被打到 0 血时倒塌。
            //    城寨正面本来就是拒马线（无墙）⇒ 攻方从正面直进，不会被 V 形两翼困住；两翼挨打即按上面②③塌掉放行。
            //    「直接开战、守方不待命」那条（siegeWithWalls=false）**未动**：它管的是守军行为，不是墙。

            // 🔴 [2026-08-29 主人需求] 城墙内侧 4 座并列箭塔：小城瞭望(AGE2) / 险要·中城警戒(AGE3) / 大城高级(AGE4)。
            //    与正面主城墙同侧（守方在右 → 内侧 = x 略大于 wallFrontX），沿正面墙高垂直并列排开。
            //    射箭（复用 WarArrow 纯视觉弹丸 + 开火火花，不改平衡）；30 秒随机三形态（applyRandomCollapseForms）。
            // 主人 2026-09-03：草原(STEPPE)游牧不筑石塔——箭塔统一用亚洲木质瞭望塔(ASIA_TOWER)，与蒙古包/亚洲瞭望塔配套（弃 CEAS 石构）
            // 🔴 [2026-09-18 主人定「一切必须都和战略地图据点一致」] 判据由文化区 STEPPE 改为
            //    建筑风格 YURT：漠北蒙古（MOBEI_MONGOL）原先匹配不上，会拼出 `YURT_TOWER_AGE4`
            //    这种根本不存在的素材；战略地图那边毡帐营地的塔用的就是亚洲木质瞭望塔。
            const arrowTowerAsset =
                isYurtDefender
                    ? (this.defenderCityType === 'small_city' || this.defenderCityType === 'stockade') ? 'ASIA_TOWER_AGE2'
                    : (this.defenderCityType === 'medium_city' || this.defenderCityType === 'pass') ? 'ASIA_TOWER_AGE3'
                    : 'ASIA_TOWER_AGE4'
                : (this.defenderCityType === 'small_city' || this.defenderCityType === 'stockade') ? `${style}_TOWER_AGE2`
                : (this.defenderCityType === 'medium_city' || this.defenderCityType === 'pass') ? `${style}_TOWER_AGE3`
                : `${style}_TOWER_AGE4`;
            const towerRubble = 'BUILDINGANIM:' + arrowTowerAsset + '_RUBBLE';
            this.ensureNatureAsset(towerRubble);
            // 🔴 [2026-10-15 主人令「所有建筑和 DE 一致」] 破损/倒塌/残骸整条链预载（含 DE 同族与通用兜底）——
            //    城寨 4 座箭塔里有 2 座是 FORTIFIED_OUTPOST，DE 没有它的倒塌素材，靠兜底链才不会凭空消失
            this.ensureDestrAssetsFor(arrowTowerAsset);
            // 🔴 箭矢素材必须开战前预载（否则第一步射箭时 pending>0 整场冻结，见 ensureProj 懒加载血训）
            this.ensureProj('PROJ_ARROW');
            // 🔴 塔塌尘土特效预载（塌墙时才播；开战前并入首批，遇不到"30 秒尘土才加载"的冻结）
            this.ensureFx('FX_WALL_DUST');
            const towerProfile = arrowTowerAsset.includes('_TOWER_AGE4') ? { range: 400, reload: 1.8, atk: 7 }
                : arrowTowerAsset.includes('_TOWER_AGE3') ? { range: 360, reload: 2.0, atk: 6 }
                : { range: 320, reload: 2.2, atk: 5 };   // 瞭望箭塔（DE 攻 5）
            const towerX = wallFrontX + 60;                  // 城内一侧，贴近正面主城墙
            const towerYFrac = [0.125, 0.375, 0.625, 0.875]; // 沿正面墙高均匀 4 座并列
            // 主人 2026-09-03：城寨(stockade) 4 箭塔 → 2 强化哨塔(FORTIFIED_OUTPOST) + 2 瞭望箭塔；其余城等级 4 座全瞭望箭塔
            const isStockadeTower = this.defenderCityType === 'stockade';
            if (isStockadeTower) this.ensureDestrAssetsFor('FORTIFIED_OUTPOST');
            towerYFrac.forEach((frac, i) => {
                const ty = topWallY + (botWallY - topWallY) * frac;
                const towerAsset = (isStockadeTower && (i === 0 || i === 3)) ? 'FORTIFIED_OUTPOST' : arrowTowerAsset;
                const sprite = place({ x: towerX, y: ty }, towerAsset, { z: 1, scale: SIEGE_CITY_BUILDING_SCALE });
                this.decorSprites.push(sprite);
                this.arrowTowers.push({
                    sprite, x: towerX, y: ty,
                    cd: Math.random() * 1.5,
                    range: towerProfile.range, reload: towerProfile.reload, atk: towerProfile.atk,
                    rubbleAsset: 'BUILDINGANIM:' + towerAsset + '_RUBBLE',
                    down: false,
                });
                this.registerDefBuilding(sprite, towerAsset, this.arrowTowers[this.arrowTowers.length - 1]);
            });

            // 蒙古守方：城墙 + 8 蒙古包 + 瞭望塔（不按城等级分时代）
            // 🔴 [2026-09-18 主人定「战略地图上的据点，和战术模式中要同步」] 判据由文化区 STEPPE
            //    改成**建筑风格 YURT**，与战略地图同源。原来只认 `sideCulture === 'STEPPE'`，
            //    而漠北蒙古的文化区是 MOBEI_MONGOL —— 战略地图经 REGION_TO_DE_STYLE 把
            //    STEPPE 和 MOBEI_MONGOL **都**映射成 YURT 画营地，13 这边却匹配不上，
            //    于是漠北蒙古据点在战场被画成通用建筑池，两边对不上。
            //    buildingStyleFor(守方) 走的就是 defenderMapStyle（resolveCityDeBuildingStyle 的结果）。
            if (isYurtDefender) {
                // 🔴 [2026-09-18 主人定「一切必须都和战略地图据点一致」] 毡帐险要照战略侧
                //    buildYurtCampHtml(fence=false, centerCastle=true)：无围墙 + 中心蒙古城堡 + 营帐环卫。
                //    城墙已由 wallMat='NONE' 在 placeWall/placeGate 里拦掉，这里补上中心城堡；
                //    城堡占掉最靠中线的那个位置，余下位置照常铺蒙古包与瞭望塔。
                // 🔴 [2026-10-03 主人令「请把所有的中城和大城的都设计为城堡居中」] 判据由「仅险要」
                //    扩到中城/大城 —— 战略侧 buildYurtCampHtml(centerCastle=true) 三档同口径。
                if ((this.defenderCityType === 'pass' || this.defenderCityType === 'medium_city'
                    || this.defenderCityType === 'big_city') && buildingSide.length > 0) {
                    const castleAsset = this.castleAssetFor(style, this.defenderCityId);
                    const avgY = side.reduce((n, s) => n + s.y, 0) / side.length;
                    const centerSpawn = buildingSide.reduce((best, s) =>
                        Math.abs(s.y - avgY) < Math.abs(best.y - avgY) ? s : best, buildingSide[0]);
                    const castleSp = place(centerSpawn, castleAsset, { scale: SIEGE_CASTLE_SCALE });
                    this.decorSprites.push(castleSp);
                    this.trackCityBuilding(castleSp, 'CASTLE');
                    placeYurtCamp(SIEGE_CITY_BUILDING_SCALE, buildingSide.filter((s) => s !== centerSpawn), SIEGE_CITY_BUILDING_SCALE, true);
                    return;
                }
                placeYurtCamp(SIEGE_CITY_BUILDING_SCALE, buildingSide, SIEGE_CITY_BUILDING_SCALE, true);
                return;
            }
            // 小城：封建时代（age2），无城堡，9 口 = 9 种建筑全上（2026-08-26 主人定「战略战术统一 9 建筑」）
            if (this.defenderCityType === 'small_city') {
                const shuffledSmall = [...buildingSide].sort(() => Math.random() - 0.5);
                const shuffledBuildings = cityPoolBuildings(SIEGE_FEUDAL_BUILDINGS).sort(() => Math.random() - 0.5);
                for (let i = 0; i < shuffledSmall.length; i++) {
                    const bk = shuffledBuildings[i];
                    const sp = place(shuffledSmall[i], isYurtAsset(bk) ? bk : `${style}_${bk}_AGE2`, { scale: siegeBuildingScale(bk) });
                    this.decorSprites.push(sp);
                    this.trackCityBuilding(sp);
                }
                return;
            }
            // 城寨（stockade）：定居点/棚屋A~G/蒙古包A~D/哨站/黑暗时代房屋与磨坊与兵营/长屋/部落中心 随机（2026-10-01 主人定）
            if (this.defenderCityType === 'stockade') {
                const stockadePool = [
                    'SETTLEMENT', 'HUT_A', 'HUT_B', 'HUT_C', 'HUT_D', 'HUT_E', 'HUT_F', 'HUT_G',
                    'YURT_A', 'YURT_B', 'YURT_C', 'YURT_D', 'OUTPOST', 'FORTIFIED_OUTPOST',
                    'DARK_HOUSE_AGE1', 'DARK_MILL_AGE1',
                    'DARK_BARRACKS_AGE1', 'DARK_SETTLEMENT_AGE1', 'DARK_TOWN_CENTER_AGE1',
                ];
                const shuffledBuildings = [...stockadePool].sort(() => Math.random() - 0.5).slice(0, buildingSide.length);
                const shuffledSide = [...buildingSide].sort(() => Math.random() - 0.5);
                for (let i = 0; i < shuffledSide.length; i++) {
                    const sp = place(shuffledSide[i], shuffledBuildings[i], { scale: siegeBuildingScale(shuffledBuildings[i]) });
                    this.decorSprites.push(sp);
                    this.trackCityBuilding(sp);
                }
                return;
            }
            // 中城：与战略模式套用相同建筑——12 种 AGE3 建筑随机取 9 种且不重复；落点随机（2026-08-29 主人定「除箭塔外其余在 9 出兵口随机摆放」）。
            // 🔴 [2026-10-03 主人令「请把所有的中城和大城的都设计为城堡居中」] 城堡占最靠全军中线的那个落点，
            //    其余 8 个落点铺建筑池（与战略侧「3×3 网格正中城堡 + 周围 8 栋」同一布局）。
            if (this.defenderCityType === 'medium_city') {
                if (buildingSide.length === 0) return;
                const avgY = side.reduce((n, s) => n + s.y, 0) / side.length;
                const centerSpawn = buildingSide.reduce((best, s) =>
                    Math.abs(s.y - avgY) < Math.abs(best.y - avgY) ? s : best, buildingSide[0]);
                const castleSp = place(centerSpawn, this.castleAssetFor(style, this.defenderCityId), {
                    scale: SIEGE_CASTLE_SCALE,
                });
                this.decorSprites.push(castleSp);
                this.trackCityBuilding(castleSp, 'CASTLE');
                const shuffledBuildings = cityPoolBuildings(SIEGE_MEDIUM_BUILDINGS).sort(() => Math.random() - 0.5)
                    .slice(0, buildingSide.length - 1);
                const shuffledSide = buildingSide.filter((s) => s !== centerSpawn).sort(() => Math.random() - 0.5);
                for (let i = 0; i < shuffledSide.length; i++) {
                    const bk = shuffledBuildings[i];
                    const sp = place(shuffledSide[i], isYurtAsset(bk) ? bk : `${style}_${bk}_AGE3`, { scale: siegeBuildingScale(bk) });
                    this.decorSprites.push(sp);
                    this.trackCityBuilding(sp);
                }
                return;
            }
            // 险要：城堡 + 兵营 + 靶场 + 马厩 + 民居 + 2 警戒箭塔 + 2 高级箭塔。
            // 🔴 [2026-08-29 主人「城堡不在最上就在最下」] 城堡固定中间落点（y 最接近全军中线），其余 8 建筑随机放剩余落点。
            // [2026-08-29 主人「城堡有点大，请缩小」→ 再「显示比例加大」] 城堡单独用 SIEGE_CASTLE_SCALE，其余建筑仍用 SIEGE_CITY_BUILDING_SCALE。
            if (this.defenderCityType === 'pass') {
                if (buildingSide.length === 0) return;
                const castleAsset = this.castleAssetFor(style);
                const passOthers = [
                    `${style}_BARRACKS_AGE3`,
                    `${style}_ARCHERY_RANGE_AGE3`,
                    `${style}_STABLE_AGE3`,
                    `${style}_HOUSE_AGE3`,
                    `${style}_TOWER_AGE3`, `${style}_TOWER_AGE3`,
                    `${style}_TOWER_AGE4`, `${style}_TOWER_AGE4`,
                ].sort(() => Math.random() - 0.5);
                const avgY = side.reduce((n, s) => n + s.y, 0) / side.length;
                // 特殊建筑先占位；城堡只在剩余空位里选最接近中线的位置。
                const centerSpawn = buildingSide.reduce((best, s) =>
                    Math.abs(s.y - avgY) < Math.abs(best.y - avgY) ? s : best, buildingSide[0]);
                const castleSp = place(centerSpawn, castleAsset, {
                    scale: SIEGE_CASTLE_SCALE,
                });
                this.decorSprites.push(castleSp);
                this.trackCityBuilding(castleSp, 'CASTLE');
                // 🔴 [主人需求] 城堡射箭（DE 城堡：攻 11、装填 2.0s；射程与高级箭塔同档 400）。
                //    30 秒不坍塌（applyRandomCollapseForms 跳过 CASTLE），持续射击。
                this.castleTowers.push({
                    sprite: castleSp, x: castleSp.x, y: castleSp.y,
                    cd: Math.random() * 1.5,
                    range: 400, reload: 2.0, atk: 11,
                    rubbleAsset: null,
                    down: false,
                });
                const shuffledOthers = buildingSide.filter((s) => s !== centerSpawn).sort(() => Math.random() - 0.5);
                for (let i = 0; i < shuffledOthers.length; i++) {
                    const sp = place(shuffledOthers[i], passOthers[i], { scale: SIEGE_CITY_BUILDING_SCALE });
                    this.decorSprites.push(sp);
                    this.trackCityBuilding(sp);
                }
                return;
            }
            // 大城：与战略模式套用相同建筑。九建筑落点全部随机（2026-08-29 主人定「9 建筑摆放位置随机」）。
            // 🔴 [2026-10-03 主人令「请把所有的中城和大城的都设计为城堡居中」] 原来正中那格固定放城镇中心，
            //    现改为城堡占最靠全军中线的落点（与战略侧「3×3 网格正中城堡 + 周围 8 栋」同一布局），
            //    其余 8 个落点照旧铺 市场/大学 AGE4 + 6 栋 AGE3。
            if (buildingSide.length === 0) return;
            const avgYBig = side.reduce((n, s) => n + s.y, 0) / side.length;
            const centerSpawnBig = buildingSide.reduce((best, s) =>
                Math.abs(s.y - avgYBig) < Math.abs(best.y - avgYBig) ? s : best, buildingSide[0]);
            const castleSpBig = place(centerSpawnBig, this.castleAssetFor(style, this.defenderCityId), {
                scale: SIEGE_CASTLE_SCALE,
            });
            this.decorSprites.push(castleSpBig);
            this.trackCityBuilding(castleSpBig, 'CASTLE');
            const age3Pool: Array<[string, string]> = [
                ...SIEGE_IMPERIAL_BUILDINGS.filter(([, age]) => age === 'AGE3'),
                // 🔴 [2026-09-16 主人定] 二级蒙古大城：辅助池掺入蒙古包（仍是 3 栋 AGE4 必有 + 6 栋辅助 = 9）
                ...(defenderIsMongol ? MONGOL_CITY_YURTS.map((y): [string, string] => [y, 'AGE3']) : []),
            ].sort(() => Math.random() - 0.5);
            const ringBuildings: Array<[string, string]> = [
                ['MARKET', 'AGE4'],
                ['UNIVERSITY', 'AGE4'],
                ...age3Pool.slice(0, 6),
            ].sort(() => Math.random() - 0.5) as Array<[string, string]>;
            const ringSpawns = buildingSide.filter((s) => s !== centerSpawnBig).sort(() => Math.random() - 0.5);
            for (let i = 0; i < ringSpawns.length; i++) {
                const [building, age] = ringBuildings[i];
                const sp = place(ringSpawns[i], isYurtAsset(building) ? building : `${style}_${building}_${age}`, { scale: siegeBuildingScale(building) });
                this.decorSprites.push(sp);
                this.trackCityBuilding(sp);
            }
            return;
        }

        // 野战双方 + 攻城攻方：蒙古 8 蒙古包 + 瞭望塔；其余 3 营地 + 4 帐篷 + 1 强化哨站 + 1 瞭望塔
        // 🔴 [2026-09-18] 同上：判据改用建筑风格 YURT，覆盖 STEPPE 与 MOBEI_MONGOL 两种文化区
        // 🔴 [2026-10-15 主人令「我们算建筑，有坍塌动画的都是建筑」] 营寨**算建筑**：
        //    逐件登记（DE 血量、受伤掉血、血归零播 DE 倒塌 → 留残骸），但它们**不射箭**（不挂 cityBuildings）。
        //    ⚠️ 阵营必须传自己的 `f`：索敌一律跳过同阵营 —— 否则攻城武器会砸自家营寨、
        //       守方还会把攻方帐篷挑成「中心建筑」（中心建筑血归零＝攻方胜）污染胜负判定。
        //    ⚠️ 旧注释里「f 写死 1」的那个 bug 已随本条第 5 个参数修掉。
        if (this.buildingStyleFor(f as 0 | 1) === 'YURT') {
            // 🔴 [2026-10-03 主人令「战术模式中，攻击方的建筑请改为80%」] 蒙古包也按 80%（塔本来就是这个缩放）
            placeYurtCamp(SIEGE_CITY_BUILDING_SCALE, side, SIEGE_CITY_BUILDING_SCALE, false);
            return;
        }
        const style = this.buildingStyleFor(f as 0 | 1);
        const shuffledSpawns = [...side].sort(() => Math.random() - 0.5);
        const placeCamp = (spawnIndex: number, asset: string): void => {
            const sp = place(shuffledSpawns[spawnIndex], asset, { scale: SIEGE_CITY_BUILDING_SCALE });
            this.decorSprites.push(sp);
            this.registerDefBuilding(sp, asset, undefined, undefined, f as 0 | 1);   // 营寨 = 建筑（不射箭）
            this.ensureDestrAssetsFor(asset);                                        // 倒塌素材开战前备齐
        };
        // 🔴 [2026-10-03 主人令「战术模式中，攻击方的建筑请改为80%」] 3 营地 + 4 帐篷也改 80%
        //    （改前是原尺寸 1.0；下方两座塔状工事本就 0.8，现在整座营地同一个缩放）。
        for (let i = 0; i < 3; i++) placeCamp(i, shuffledCamps[i]);
        for (let i = 3; i < 7; i++) placeCamp(i, 'GREEK_WAR_TENT');
        // 🔴 [2026-09-03 主人改] 哨站(OUTPOST)换成强化哨站（FORTIFIED_OUTPOST = DE b_archaic_fortified_outpost_age1）。
        //    强化哨站是哨站的加固升级版（能攻击），不是警戒塔/防卫塔（TOWER_AGE3）。
        // 🔴 [2026-10-03 主人令] 这两座塔状工事（强化哨站 + 瞭望塔）与**守方城墙内侧那 4 座箭塔同类**
        //    （守方城寨的 4 座箭塔里就有 2 座是 FORTIFIED_OUTPOST）—— 一律用同一缩放，两边一样大。
        placeCamp(7, 'FORTIFIED_OUTPOST');
        placeCamp(8, `${style}_TOWER_AGE2`);
    }

    /**
     * 出兵环在**指定来向**上的地图安全半径（px）：基准点沿 (ux,uy) 能退到的最远处，
     * 且保证**九口阵面全部留在图内**（九口的横向/纵向外延一并算进去）。
     * 🔴 [2026-10-11 主人裁定「走甲：把基座夹进地图内」＋「请用专业游戏的方式执行」]
     *   · 地图世界半幅取 `Scene13GroundLayerGL` 的 `TAC_MAP_HALF_W / TAC_MAP_HALF_H`
     *     （2026-10-12 起每格 96×48 ⇒ 5712 / 2856；地面已是 16:9 矩形，下面按矩形判是否出图）。
     *   · 菱形不是圆：同一个半径下东西最宽松、斜向最紧，所以**必须按方向算**（原来八向取同一个最小值
     *     会让东西向被斜向的紧约束拖近，营帐压进城里，实测压进 312px）。
     *   · 每条边留 `EDGE` 余量，免得营地贴到图边。
     */
    private spawnRingSafeRadius(ux: number, uy: number): number {
        const hw = TAC_MAP_HALF_W;                       // 东西半幅（世界 px）
        const hh = TAC_MAP_HALF_H;                       // 南北半幅（世界 px）
        const EDGE = 120;                                // 离图边余量
        // 九口阵面自身的最大外延（与 LAYOUT / colSpacing 上限 240 / depth 上限 240 一致）：
        //   横向 1.5×240 = 360、纵深 ±240。基准点往外推时，这几个角点最先出图。
        const LAT = 360, DEP = 240;
        const sx = -uy, sy = ux;                         // 侧向单位向量
        const inside = (x: number, y: number) => Math.abs(x) <= hw - EDGE && Math.abs(y) <= hh - EDGE;
        // 数值求解：该方向上「九口全部在图内」的最大基准半径（1px 步长足够）
        let d = 0;
        for (let t = 0; t <= 8000; t++) {
            let ok = true;
            for (const [l, f] of [[LAT, DEP], [-LAT, DEP], [LAT, -DEP], [-LAT, -DEP]] as Array<[number, number]>) {
                if (!inside(ux * t + sx * l + ux * f, uy * t + sy * l + uy * f)) { ok = false; break; }
            }
            if (!ok) break;
            d = t;
        }
        return d;
    }

    private isWaterAt(screenX: number, screenY: number): boolean {
        if (this.groundLayerGL && this.canvas) {
            return this.groundLayerGL.isWaterAt(screenX, screenY, this.worldCX * 2, this.worldCY * 2);
        }
        const viennaMapData = getCachedViennaMapData();
        if (viennaMapData) {
            const VW = this.worldCX * 2, VH = this.worldCY * 2;
            const N = viennaMapData.width || 120;
            // 🔴 [2026-10-12] 原为等距菱形逆式（dx=32, dy=16），与地面层的 16:9 矩形网格对不上；
            //    改为与 `Scene13GroundLayerGL.screenToCell` 同一式（每格 TAC_TILE_W×TAC_TILE_H）。
            const gx = (screenX - VW / 2) / TAC_TILE_W + N * 0.5;
            const gy = (screenY - VH / 2) / TAC_TILE_H + N * 0.5;
            const rx = Math.round(gx);
            const ry = Math.round(gy);
            if (rx < 0 || ry < 0 || rx >= N || ry >= N) return false;
            const t = viennaMapData.terrain[ry * N + rx];
            return t === 23 || t === 1;
        }
        return false;
    }

    /** 细分地形行军速度系数：森林 ×0.5、浅滩/沼泽 ×0.6、深水 ×0.3、平地 ×1.0 */
    private terrainSpeedAt(screenX: number, screenY: number): number {
        if (this.groundLayerGL && this.canvas) {
            return this.groundLayerGL.terrainSpeedAt(screenX, screenY, this.worldCX * 2, this.worldCY * 2);
        }
        return this.isWaterAt(screenX, screenY) ? 0.6 : 1.0;
    }

    /** 河流 / 湖泊模板水体从东北角迁到城边（实现见 Scene13MapWaterAdapter.ts） */
    private relocateTemplateWater(mapData: any): any {
        const rec: any = this.defenderCityRecord();
        return relocateTemplateWater(
            mapData,
            this.environmentPlan?.waterKind,
            this.deCity?.width,
            String(this.defenderCityId ?? this.environmentPlan?.seed ?? '0'),
            rec?.lat ?? this.centerLat,
            rec?.lng ?? this.centerLng,
        );
    }

    /** 自适应校正战术地图水体方位，使海岸线朝向与真实地理（＝战略地图）一致（实现见 Scene13MapWaterAdapter.ts） */
    private async adaptMapDataSeaOrientation(mapData: any): Promise<any> {
        const rec: any = this.defenderCityRecord();
        return adaptMapDataSeaOrientation(
            mapData,
            rec?.lat ?? this.centerLat,
            rec?.lng ?? this.centerLng,
        );
    }

    /**
     * M3 WebGL 地面层接入：在 realGeography 开关开启时初始化底层 WebGL 视口，
     * 并加载新地图物件，替换旧 13 随机树木与岩石。
     */
    private requestGroundLayerGL(): void {
        if (!this.glCanvas) return;
        // 世界大小（开战时定死的世界中心 ×2）：地面格子与屏幕像素的换算口径，与窗口大小无关
        const VW = this.worldCX * 2, VH = this.worldCY * 2;
        const gen = this.assetGen;
        const cv = this.glCanvas;
        // 🔴 [2026-10-14 删除旧 13 的 2D 地面后] 开战前等 GL 地面就绪（占 1 个 pending，与兵种贴图同一道素材闸），
        //    最多等 GL_GROUND_WAIT_MS，超时照常开打，绝不卡住战斗。实测本机 GL 地面 0.86~1.17s 就绪，比其余素材还早约 50ms。
        this.pending++;
        let held = true;
        const releaseGround = () => { if (!held) return; held = false; if (gen === this.assetGen) this.pending--; };
        window.setTimeout(releaseGround, Scene13WarLayer.GL_GROUND_WAIT_MS);

        // 🔴 [2026-10-11「整合各场景素材」] 地图数据按**真实地理**取，三级退让：
        //    ① 探针注入 window.__M3_TEST_MAPDATA__（真机验收用，保留最高优先）；
        //    ② public/battlefields/site_<据点id>.json —— 由 scratch/_bake_site_maps.mjs 用**真实高程 + WorldCover 水体**
        //       做成骨架喂给引擎（脚本的造水/造陆段跳过）⇒ 战场就是那个地方的地形（维也纳＝多瑙河）；
        //    ③ 没有该据点 → theme_<环境计划的 deMapTheme>.json（B 批：按气候主题烘焙的通用地貌）；
        //    ④ 都没有 → 维也纳测试图兜底，保证战斗照样能开。
        const getMapData = async () => {
            if ((window as any).__M3_TEST_MAPDATA__) return (window as any).__M3_TEST_MAPDATA__;
            const load = async (file: string) => {
                try {
                    const res = await fetch(MAPDATA_DIR + file);
                    if (res.ok) return await res.json();
                } catch {}
                return null;
            };
            const siteId = this.defenderCityId;
            if (siteId) {
                const site = await load('site_' + siteId + '.json');
                if (site) return site;
            }
            const theme = this.environmentPlan?.deMapTheme;
            if (theme) {
                const THEME_MAP_FILES: Record<string, string> = {
                    afrotropical_tropical: 'theme_afrotropical_tropical.json',
                    neotropical_temperate: 'theme_neotropical_temperate.json',
                    neotropical_tropical: 'theme_neotropical_tropical.json',
                    nearctic_temperate: 'theme_nearctic_temperate.json',
                    indomalayan_tropical: 'theme_indomalayan_tropical.json',
                    palaearctic_asia_temperate: 'theme_palaearctic_asia_temperate.json',
                    palaearctic_middle_east_desert: 'theme_palaearctic_middle_east_desert.json',
                    palaearctic_europe_taiga: 'theme_palaearctic_europe_taiga.json',
                    palaearctic_europe_temperate: 'theme_palaearctic_europe_temperate.json',
                    palaearctic_europe_mediterranean: 'theme_palaearctic_europe_mediterranean.json',
                    australasian_temperate: 'theme_australasian_temperate.json',
                    palaearctic_asia_desert: 'theme_palaearctic_asia_desert.json',
                    palaearctic_salt_desert: 'theme_palaearctic_salt_desert.json',
                    palaearctic_asia_steppe: 'theme_palaearctic_asia_steppe.json',
                    palaearctic_tibetan_plateau: 'theme_palaearctic_tibetan_plateau.json',
                    palaearctic_middle_east_highland: 'theme_palaearctic_middle_east_highland.json',
                    serengeti: 'theme_serengeti.json',
                    palustrine_swamp: 'theme_palustrine_swamp.json',
                };
                const waterKind = this.environmentPlan?.waterKind;
                if (waterKind && waterKind !== 'none') {
                    const waterVariant = await load(`theme_${theme}_${waterKind}.json`);
                    if (waterVariant) return waterVariant;
                }
                const targetFile = THEME_MAP_FILES[theme] ?? ('theme_' + theme + '.json');
                const themed = await load(targetFile);
                if (themed) return themed;
            }
            try {
                const res = await fetch(FALLBACK_MAPDATA_URL);
                if (res.ok) {
                    console.warn(`[Scene13WarLayer] 无据点/主题地图（site=${siteId ?? '无'} theme=${theme ?? '无'}），地面退回维也纳测试图`);
                    return await res.json();
                }
            } catch {}
            return null;
        };

        void getMapData().then(async (rawMapData) => {
            if (gen !== this.assetGen || !rawMapData) {
                this.useGroundGL = false;
                cv.style.display = 'none';
                releaseGround();
                return;
            }
            // 🔴 [2026-10-13 主人令「做出一套干净、可靠的真实地理」] 据点真实图（header.skeleton）的水就是真实水体，不许抹掉重挖
            const oriented = await this.adaptMapDataSeaOrientation(rawMapData);
            const mapData = rawMapData?.header?.skeleton ? oriented : this.relocateTemplateWater(oriented);
            try {
                if (this.groundLayerGL) this.groundLayerGL.destroy();
                // 🔴 [2026-10-11] 底面四张素材（草/沙/林/水）按战场所在气候主题取，来源＝一份 environmentPlan.groundTiles（沙漠＝沙地、雪原＝雪林等），不再恒为 gr2 绿草 + bch 沙 + for 林 + 绿河
                const glLayer = await Scene13GroundLayerGL.create(cv, mapData, this.environmentPlan?.groundTiles);
                if (gen !== this.assetGen) {
                    glLayer.destroy();
                    releaseGround();
                    return;
                }
                this.groundLayerGL = glLayer;
                setCachedViennaMapData(glLayer.data);
                this.useGroundGL = true;
                // 🔴 [2026-10-11 主人令「这个菱形的周边黑色很丑，可以换成底图吗」]
                // WebGL 画布底层平铺当前气候主题的自然底图，任何缩放与平移下满屏铺满，彻底消除菱形周边黑边
                const baseTerrain = this.environmentPlan?.baseTerrain ?? DEFAULT_TERRAIN_TILE;
                cv.style.backgroundImage = `url(/SUCAI_TERRAIN/${baseTerrain}.png)`;
                cv.style.backgroundRepeat = 'repeat';
                cv.style.backgroundPosition = 'center center';
                if (this.entryFadePending) this.applyInitialEntryStyle(cv);
                cv.style.display = 'block';

                // 🔴 [2026-10-11 主人令] 陆战口径：水/树林/建筑一律可通行 ⇒ 删去「保障所有出兵口与初始士兵不落入水体」
                const data = transposeMapData(mapData);
                if (data && data.objects) {
                    // 🔴 [2026-10-11 主人「让植被，建筑等固定在地基上」] 给每栋建筑 / 城门 / 塔 / 墙脚下清出一块干燥平地（地基），
                    //    并拿掉落在地基上的树木与建筑冲突物。
                    const foundations: Array<{ x: number; y: number; r: number }> = [];
                    const siegeBuildings = this.decorSprites.filter((s) => s.asset === '' || s.asset.startsWith('BUILDING:') || s.asset.startsWith('BUILDINGANIM:') || s.asset.includes('GATE') || s.asset.includes('TOWER') || s.asset.includes('WALL'));
                    for (const sp of this.spawns) if (sp.f === 1 && !sp.commander) foundations.push({ x: sp.x, y: sp.y, r: 4 });
                    for (const sp of siegeBuildings) foundations.push({ x: sp.x, y: sp.y, r: 2.5 });
                    for (const fd of foundations) glLayer.carveFoundation(fd.x, fd.y, VW, VH, fd.r);
                    glLayer.flushFoundation();
                    const onFoundation = (x: number, y: number): boolean => {
                        const c = glLayer.screenToCell(x, y, VW, VH);
                        if (!c) return false;
                        return foundations.some((fd) => {
                            const f = glLayer.screenToCell(fd.x, fd.y, VW, VH);
                            return !!f && Math.hypot(c.gx - f.gx, c.gy - f.gy) < fd.r;
                        });
                    };

                    // 🔴 [2026-10-10 主人「这里光秃秃的，啥元素也没有呀」]
                    //    保留未落入建筑地基（!onFoundation）的自然植被与草花碎石，绝不一刀切清空整场生态
                    // 🔴 [2026-10-12 任务1] 地图数据自带完整树林时，剔除旧环境方案遗留的混杂树木，树种严格统一由地图数据决定
                    const TREE_RE = /TREE|PINE|OAK|BAMBOO|PALM|BIRCH|CYPRESS|MAPLE|WILLOW|OLIVE|BAOBAB|BRAZILWOOD|JUNGLE|RAINFOREST|ACACIA|MANGROVE|BLOSSOM|GINKGO|EUCALYPTUS|MONKEY_PUZZLE/i;
                    this.decorSprites = this.decorSprites.filter((s) => {
                        const isBuilding = s.asset === '' || s.asset.startsWith('BUILDING:') || s.asset.startsWith('BUILDINGANIM:') || s.asset.includes('GATE') || s.asset.includes('TOWER') || s.asset.includes('WALL');
                        const isWaterPlant = s.asset === 'WATER_LILY' || s.asset === 'REEDS' || s.asset === 'SEA_ROCKS' || s.asset === 'SHIPWRECK';
                        const isOldTree = TREE_RE.test(s.asset);
                        const c = glLayer.screenToCell(s.x, s.y, VW, VH);
                        const inWater = !!c && glLayer.getWaterDensityAt(Math.round(c.gx), Math.round(c.gy)) > 0.42;
                        return isBuilding || (!onFoundation(s.x, s.y) && !isOldTree && (isWaterPlant ? inWater : !inWater));
                    });

                    // 🔴 [2026-10-16 阶段四：真实地理与四季植被/地表装饰多样性]
                    // 接回 TreeAssignment (pickTree: 40 种 DE 树木 × 全球专属地域框 × 26 底图 × 春夏秋冬四季)
                    // 与 DecorFit (groundDecorFor / decorFits: 26 底图同色系岩石、花草、灌木)，彻底告别单一 Arabia 模板表现。
                    const defCityRec = this.defenderCityRecord();
                    const mapLat = defCityRec?.lat ?? this.centerLat ?? 30;
                    const mapLng = defCityRec?.lng ?? this.centerLng ?? 110;
                    const mapBuildingStyle = defCityRec?.buildingStyle ?? this.environmentPlan?.buildingStyle;
                    const rawCalSeason = (window as any).game?.timeSystem?.getSeason?.();
                    const calSeason: TreeSeason = (rawCalSeason === 0 || rawCalSeason === 1 || rawCalSeason === 2 || rawCalSeason === 3)
                        ? rawCalSeason
                        : (this.sceneSeason === 2 ? 3 : this.sceneSeason === 1 ? 2 : 1);
                    const regionalTree = pickTree({
                        baseTile: baseTerrain,
                        lat: mapLat,
                        lng: mapLng,
                        season: calSeason,
                        isSiege: this.battleType === 'siege',
                        buildingStyle: mapBuildingStyle,
                    });
                    const decorSet = groundDecorFor(baseTerrain);
                    const isSnowBase = baseTerrain === 'sno' || baseTerrain === 'sn2' || baseTerrain === 'snf'
                        || baseTerrain === 'snd' || baseTerrain === 'snr' || baseTerrain === 'ic3' || baseTerrain === 'ice';
                    const decorCtx = {
                        lat: mapLat,
                        lng: mapLng,
                        season: this.sceneSeason,
                        winterSnow: isSnowBase,
                        isSiege: this.battleType === 'siege',
                    };
                    const isBarrenBase = baseTerrain === 'pal1' || baseTerrain === 'qs' || baseTerrain === 'ds5' || baseTerrain === 'gravel_default' || baseTerrain === 'rck';
                    // 🔴 [2026-10-16 主人指出「怎么都没有树呢，看看DE是怎么安排的树」]
                    //    DE 原版（empires2_x2_p1.dat + RMS 烘焙图 site_*.json / theme_*.json）的树木安排规则：
                    //    1) 「林地底图（lv2/for/fo2/snf）与树木 1:1 严格绑定」：凡是地面画了森林底图斑块的格子，上面 100% 必立一棵树，绝不允许把林团砍剩几棵而留下一大片光秃秃的 lv2 落叶底图；
                    //    2) 「成片林团（Forest Clumps）+ 原野散株（Straggler Trees）」双层布局：非荒漠/非干草原地图 100% 原样保留 DE 烘焙图的全部林团与散株（clumpKeepMod = 1，不截断单团棵数）；
                    //    3) 仅在地面层已隐藏森林底斑的极旱荒漠/戈壁/干草原（isSparseTreelessBiome）上，才对复用的大林团做稀疏化。
                    const isSparseTreelessBiome = baseTerrain === 'pal' || baseTerrain === 'des' || baseTerrain === 'ds5'
                        || baseTerrain === 'qs' || baseTerrain === 'pal1'
                        || baseTerrain === 'gr7' || baseTerrain === 'gr5' || baseTerrain === 'gravel_default';
                    const treeDensity = treeDensityFor(baseTerrain, this.battleType === 'siege');
                    const clumpKeepMod = !isSparseTreelessBiome ? 1
                        : (treeDensity.forestCover >= 0.004 ? 2 : 3);
                    const maxTreesPerClump = !isSparseTreelessBiome ? 9999
                        : (treeDensity.forestCover >= 0.004 ? 18 : 8);

                    // 🔴 [2026-10-12 任务1] 空间聚类纯化：保证「错落成团，一块林基本一个树种」
                    // 对相连的森林树木进行距离聚类，同团统一为主导树种（纯度 >= 96%），并优先对齐当地真实气候与四季树种 regionalTree
                    const treeClumpDominant = new Map<number, string>();
                    const skippedTreeIndices = new Set<number>();
                    const rawTreeIndices: number[] = [];
                    data.objects.forEach((ob: any, idx: number) => {
                        if (ob.name && !ob.name.includes('CLIFF')) {
                            const r = resolveNatureSprite(ob.name);
                            if (r && r[0] === 'NATURE' && TREE_RE.test(r[1])) {
                                rawTreeIndices.push(idx);
                            }
                        }
                    });

                    // 空间网格桶快速连通聚类 (网格大小 2 格)
                    const treeGrid = new Map<string, number[]>();
                    for (const tidx of rawTreeIndices) {
                        const ob = data.objects[tidx];
                        const key = `${Math.floor(ob.x / 2)},${Math.floor(ob.y / 2)}`;
                        if (!treeGrid.has(key)) treeGrid.set(key, []);
                        treeGrid.get(key)!.push(tidx);
                    }

                    const visitedTree = new Set<number>();
                    let clumpCounter = 0;
                    for (const startIdx of rawTreeIndices) {
                        if (visitedTree.has(startIdx)) continue;
                        const cId = clumpCounter++;
                        const clumpMembers: number[] = [];
                        const queue = [startIdx];
                        visitedTree.add(startIdx);
                        while (queue.length > 0) {
                            const curIdx = queue.shift()!;
                            clumpMembers.push(curIdx);
                            const curOb = data.objects[curIdx];
                            const gx = Math.floor(curOb.x / 2), gy = Math.floor(curOb.y / 2);
                            for (let dx = -1; dx <= 1; dx++) {
                                for (let dy = -1; dy <= 1; dy++) {
                                    const bucket = treeGrid.get(`${gx + dx},${gy + dy}`);
                                    if (bucket) {
                                        for (const nbrIdx of bucket) {
                                            if (!visitedTree.has(nbrIdx)) {
                                                const nbrOb = data.objects[nbrIdx];
                                                if (Math.hypot(curOb.x - nbrOb.x, curOb.y - nbrOb.y) <= 1.6) {
                                                    visitedTree.add(nbrIdx);
                                                    queue.push(nbrIdx);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // 仅在隐藏了森林底斑的荒漠/戈壁/干草原（isSparseTreelessBiome）裁剪大林团；其余地图 100% 保留 DE 林团与散株
                        if (clumpKeepMod > 1 && clumpMembers.length > 3 && (cId % clumpKeepMod !== 0)) {
                            for (const mIdx of clumpMembers) skippedTreeIndices.add(mIdx);
                            continue;
                        }
                        if (clumpMembers.length > maxTreesPerClump) {
                            for (let k = maxTreesPerClump; k < clumpMembers.length; k++) {
                                skippedTreeIndices.add(clumpMembers[k]);
                            }
                        }

                        // 统计该林块内的原生主导树种，并与当地真实地理/四季主导树种 regionalTree 融合：
                        // 85% 林团直接使用当地与当季的 regionalTree（如日本春樱/秋银杏、岭南翠竹、地中海油橄榄、北非金合欢等），
                        // 15% 林团若原图自带非通用橡树/棕榈的特色伴生树且符合当前季节，则保留整团伴生树，做到既纯正又富有层次
                        const counts: Record<string, number> = {};
                        for (const mIdx of clumpMembers) {
                            const r = resolveNatureSprite(data.objects[mIdx].name);
                            if (r) counts[r[1]] = (counts[r[1]] || 0) + 1;
                        }
                        let maxCnt = 0, bestAsset = '';
                        for (const [ast, cnt] of Object.entries(counts)) {
                            if (cnt > maxCnt) { maxCnt = cnt; bestAsset = ast; }
                        }
                        const isGenericBakedTree = bestAsset === 'OAK' || bestAsset === 'PALM' || bestAsset === 'PINE' || bestAsset === 'GREEN_OAK';
                        const snowTreeOnNonSnowGround = !isSnowBase && /^SNOW_/.test(bestAsset);
                        const greenTreeInSnow = isSnowBase && !/^SNOW_|PINE|DEAD_TREE|BIRCH_WINTER/.test(bestAsset);
                        const autumnMismatch = this.sceneSeason === 1 && (bestAsset === 'OAK' || bestAsset === 'GREEN_OAK' || bestAsset === 'BIRCH_GREEN' || bestAsset === 'ASIAN_MAPLE_GREEN');
                        const finalClumpTree = (
                            !bestAsset ||
                            isGenericBakedTree ||
                            snowTreeOnNonSnowGround ||
                            greenTreeInSnow ||
                            autumnMismatch ||
                            (cId % 6 !== 0)
                        ) ? regionalTree : bestAsset;

                        for (const mIdx of clumpMembers) {
                            if (!skippedTreeIndices.has(mIdx)) {
                                treeClumpDominant.set(mIdx, finalClumpTree);
                            }
                        }
                    }

                    // 🔴 [2026-10-13 主人令「动物逻辑和DE不一样，请核对清楚」＋「尽量真实，游戏合理」]
                    //    分类 / 速度 / 视野 / 血量 / 攻击一律照 DE 本体（表 ANIMAL_DE，见文件上方），不再手写三张 Set。
                    //    旧版自造的三条已废：① 城池/营帐内动物一律删（DE 的牲畜本来就出生在 TC 旁，删了就没牲畜）
                    //    ② 猛兽离图心 1400px 删（DE 用 min_distance_to_players，从不看图心；实测白删 31% 猛兽）
                    //    ③ 猎物复制 3 只（DE 的群是 RMS 一只只摆好的，复制＝平白多三倍）。

                    const inCityZone = (x: number, y: number): boolean => {
                        if (this.insideRing(x, y)) return true;
                        if (this.deCity) {
                            const cx = this.deCityCenter ? this.deCityCenter.x : VW / 2;
                            const cy = this.deCityCenter ? this.deCityCenter.y : VH / 2;
                            const rx = this.deCity.width / 2 + 500;   // 🔴 [2026-10-13 主人令] 野生动物离城墙外 500px（原 180/120）
                            const ry = this.deCity.height / 2 + 500;
                            if (((x - cx) ** 2) / (rx * rx) + ((y - cy) ** 2) / (ry * ry) <= 1) return true;
                        }
                        return false;
                    };
                    const inCampZone = (x: number, y: number): boolean => {
                        for (const sp of this.spawns) {
                            if (sp.f === 0 && Math.hypot(x - sp.x, y - sp.y) < 220) return true;
                        }
                        return false;
                    };

                    for (let obIdx = 0; obIdx < data.objects.length; obIdx++) {
                        if (skippedTreeIndices.has(obIdx)) continue;
                        const ob = data.objects[obIdx];
                        if (ob.name && ob.name.includes('CLIFF')) continue;
                        const r = resolveNatureSprite(ob.name);
                        if (r && (r[0] === 'NATURE' || r[0] === 'ANIMAL')) {
                            const isAnimal = r[0] === 'ANIMAL';
                            const ox = ob.x - 0.5, oy = ob.y - 0.5;
                            const hash = Math.abs(Math.round(ob.x * 7 + ob.y * 13)) % 100;
                            let sx = (ox - 60) * TAC_TILE_W + VW / 2;
                            let sy = (oy - 60) * TAC_TILE_H + VH / 2;

                            if (isAnimal) {
                                const species = r[1];
                                const de = animalDeOf(species);
                                if (!animalNativeAt(species, mapLat, mapLng, baseTerrain)) continue;   // 非当地或非当前地表气候物种不放

                                // ① 建筑地基上不放；野生动物不进城内 / 攻方营帐，**家畜可以留在城里**
                                //    （DE 每名玩家出生点旁就有 4 只牲畜 + 近旁 4 只，全在自家聚落里）
                                if (onFoundation(sx, sy)) continue;
                                if (de.kind !== 'livestock' && (inCityZone(sx, sy) || inCampZone(sx, sy))) continue;

                                // ② 一个 DE 物件 = 一只动物（DE 的群由 RMS 一只只摆好，不再复制成群）
                                const dir = hash % 8;
                                const isBird = de.kind === 'bird';
                                const startAct: AnimalAction = isBird ? 'fly' : (de.acts.includes('idle') ? 'idle' : de.acts[0]);
                                const animSprite: DecorSprite = {
                                    asset: `ANIMAL:${species}/${startAct}_${isBird ? 0 : dir}`,
                                    frame: hash,
                                    x: sx,
                                    y: sy,
                                    flip: false,
                                    layer: 'world',
                                    z: 0,
                                    lift: isBird ? 180 : glLayer.elevationLiftAt(sx, sy, VW, VH),
                                    densityHash: hash,
                                    obstructionContactSec: 0,
                                    obstructionTouched: false,
                                    obstructionDisabled: true,
                                };
                                this.ensureNatureAsset(animSprite.asset);
                                this.decorSprites.push(animSprite);
                                this.tacticalAnimals.push({
                                    sprite: animSprite,
                                    species,
                                    kind: de.kind,
                                    action: startAct,
                                    dir: isBird ? 0 : dir,
                                    homeX: sx,
                                    homeY: sy,
                                    x: sx,
                                    y: sy,
                                    vx: 0,
                                    vy: 0,
                                    fleeTimer: 0,
                                    fleeDX: 0,          // 🔴 [2026-10-13 主人令「只冒着一个方向跑」] 首次受惊时锁定
                                    fleeDY: 0,
                                    idleTimer: Math.random() * 3,
                                    wanderX: sx,
                                    wanderY: sy,
                                    animPhase: hash,
                                    hp: de.hp,
                                    atkNext: 0,
                                    flyX: sx + Math.cos(hash * 0.1) * 800,
                                    flyY: sy + Math.sin(hash * 0.1) * 800,
                                    hovering: false,
                                });
                                continue;
                            }

                            // 静态自然植被与矿石资源
                            let asset = treeClumpDominant.get(obIdx) ?? r[1];
                            const isTree = TREE_RE.test(asset);
                            if (isTree) {
                                if (baseTerrain === 'gravel_default' && (asset === 'SNOW_PINE' || asset === 'PINE' || asset === 'ASIAN_PINE')) continue;
                                if (!isSnowBase) {
                                    if (asset === 'SNOW_PINE') asset = 'ASIAN_PINE';
                                    else if (asset === 'SNOW_AUTUMN_OAK') asset = 'AUTUMN_OAK';
                                    else if (asset === 'SNOW_BIRCH') asset = 'BIRCH_AUTUMN';
                                    else if (asset === 'SNOW_DEAD_TREE') asset = 'DEAD_TREE';
                                }
                            } else if (asset !== 'MINE_GOLD' && asset !== 'MINE_STONE' && !asset.startsWith('FORAGE_')) {
                                // 按 DecorFit 将底图不匹配的通用岩石/花草映射为当前底图同色系装饰
                                if (/^ROCK/.test(asset)) {
                                    if (decorSet.solid.length === 0) continue;
                                    if (!decorSet.solid.includes(asset)) {
                                        asset = decorSet.solid[hash % decorSet.solid.length];
                                    }
                                } else if (/^(FLOWER|PLANT|WEED|SHRUB|BUSH_GREEN|UNDERBRUSH|FERNPATCH)/.test(asset)) {
                                    if (decorSet.scatter.length === 0) continue;
                                    if (!decorSet.scatter.includes(asset)) {
                                        asset = decorSet.scatter[hash % decorSet.scatter.length];
                                    }
                                } else if (/^GRASS_/.test(asset)) {
                                    if (decorSet.flat.length === 0) continue;
                                    if (!decorSet.flat.includes(asset)) {
                                        asset = decorSet.flat[hash % decorSet.flat.length];
                                    }
                                }
                                if (!decorFits(asset, decorCtx)) continue;
                            }
                            const jx = isTree ? (((hash * 17) % 23) / 22 - 0.5) * TAC_TILE_W * 0.46 : 0;
                            const jy = isTree ? (((hash * 31) % 29) / 28 - 0.5) * TAC_TILE_H * 0.46 : 0;
                            sx += jx;
                            sy += jy;
                            if (onFoundation(sx, sy)) continue;
                            this.ensureNatureAsset(asset);
                            const lift = glLayer.elevationLiftAt(sx, sy, VW, VH);
                            this.decorSprites.push({
                                asset,
                                frame: ob.rot !== undefined ? Math.round(ob.rot) : hash,
                                x: sx,
                                y: sy,
                                flip: (hash % 2 === 0),
                                layer: 'world',
                                z: 0,
                                lift,
                                densityHash: hash,
                                obstruction: undefined,
                                obstructionContactSec: 0,
                                obstructionTouched: false,
                                obstructionDisabled: true,
                            });
                        }
                    }

                    // 自然水岸生态：沿水岸线点缀芦苇与睡莲（按气候/季节/海陆水体自适应：冬季冰面不长，荒漠与海岸仅生芦苇不生睡莲）
                    const isFrozenWater = glLayer.isIce || baseTerrain === 'sn2' || baseTerrain === 'snf' || baseTerrain === 'snr' || baseTerrain === 'ic3' || baseTerrain === 'ice';
                    const allowWaterLily = !isFrozenWater && !isBarrenBase && this.sceneSeason === 0 && this.environmentPlan?.waterKind !== 'sea' && !/^(ds|drt|sav|sa2|zn)/.test(baseTerrain);
                    if (!isFrozenWater) {
                        for (let gy = 2; gy < 118; gy += 2) {
                            for (let gx = 2; gx < 118; gx += 2) {
                                const dens = glLayer.getWaterDensityAt(gx, gy);
                                if (dens >= 0.41 && dens <= 0.48 && ((gx * 31 + gy * 19) % 5 === 0)) {
                                    const ox = gx - 0.5, oy = gy - 0.5;
                                    const sx = (ox - 60) * TAC_TILE_W + VW / 2;
                                    const sy = (oy - 60) * TAC_TILE_H + VH / 2;
                                    const isLily = allowWaterLily && dens > 0.44 && ((gx + gy) % 3 === 0);
                                    const asset = isLily ? 'WATER_LILY' : 'REEDS';
                                    if (!decorFits(asset, decorCtx)) continue;
                                    const hash = (gx * 11 + gy * 7) % 100;
                                    const lift = glLayer.elevationLiftAt(sx, sy, VW, VH);
                                    this.ensureNatureAsset(asset);
                                    this.decorSprites.push({
                                        asset,
                                        frame: hash,
                                        x: sx,
                                        y: sy,
                                        flip: (gx % 2 === 0),
                                        layer: 'world',
                                        z: 0,
                                        lift,
                                        densityHash: hash,
                                        obstruction: undefined,
                                        obstructionContactSec: 0,
                                        obstructionTouched: false,
                                        obstructionDisabled: true,
                                    });
                                }
                            }
                        }
                    }
                }
                this.applyDeCityToGround();
                releaseGround();
            } catch (err) {
                console.warn('[Scene13WarLayer] ⚠️ WebGL 地面层初始化失败（已无旧 2D 地面兜底，本场没有地面）:', err);
                this.useGroundGL = false;
                cv.style.display = 'none';
                releaseGround();
            }
        });
    }

    /** 开战前最多等 GL 地面多久（毫秒）；超时照常开打 */
    private static readonly GL_GROUND_WAIT_MS = 5000;


    /** 懒加载自然装饰 sheet（frames.png + _meta.json），命中缓存即返回。
     *  `BUILDING:` 前缀 = 出兵口军事建筑（SUCAI_BUILDING）：改加载 `preview.png` 单帧，
     *  规避马厩 180 帧 54720px 超宽 strip（超浏览器 canvas 单边上限，整图 drawImage 会失败）。 */
    private ensureNatureAsset(asset: string): void {
        if (this.natureCache[asset]) return;
        const na: NatureAsset = { img: null, meta: null };
        this.natureCache[asset] = na;
        // 🔴 [2026-08-22] BUILDINGANIM: 前缀 = 多帧动画素材（城门倒塌 50 帧 / 城墙破损档）——
        //    加载 frames.png 整条 strip 而非 preview.png 单帧，drawDecorSprite 按 frame 切片。
        const isAnim = asset.startsWith('BUILDINGANIM:');
        const isBuilding = asset.startsWith('BUILDING:') || isAnim;
        const isBattlefield = asset.startsWith('BATTLEFIELD:');
        const isAnimal = asset.startsWith('ANIMAL:');
        const base = isBattlefield ? BATTLEFIELD_BASE_URL : (isBuilding ? BUILDING_BASE_URL : (isAnimal ? ANIMAL_BASE_URL : NATURE_BASE_URL));
        const name = isBattlefield ? asset.slice('BATTLEFIELD:'.length) : (isAnim ? asset.slice('BUILDINGANIM:'.length) : (isBuilding ? asset.slice('BUILDING:'.length) : (isAnimal ? asset.slice('ANIMAL:'.length) : asset)));
        if (isAnimal) {
            // 🔴 [2026-10-13 主人令「动物要会动」] 支持动物各种动作与朝向（ANIMAL:<species>/<action>_<dir>）
            const slashIdx = name.indexOf('/');
            const species = slashIdx >= 0 ? name.slice(0, slashIdx) : name;
            const actDirStr = slashIdx >= 0 ? name.slice(slashIdx + 1) : '';
            const getMeta = async () => {
                if (this.animalMetaCache[species]) return this.animalMetaCache[species];
                try {
                    const r = await fetch(base + species + '/_meta.json');
                    if (r.ok) {
                        const j = await r.json();
                        this.animalMetaCache[species] = j;
                        return j;
                    }
                } catch {}
                return null;
            };
            void getMeta().then((m) => {
                if (!m) return;
                let actName = 'idle';
                let dirNum = 0;
                if (actDirStr) {
                    const under = actDirStr.lastIndexOf('_');
                    if (under >= 0) {
                        actName = actDirStr.slice(0, under);
                        dirNum = parseInt(actDirStr.slice(under + 1), 10) || 0;
                    } else {
                        actName = actDirStr;
                    }
                } else {
                    actName = m.idle ? 'idle' : (m.hover ? 'hover' : (m.fly ? 'fly' : 'walk'));
                }
                const actMeta = m[actName];
                const d = actMeta?.dirs?.[String(dirNum)] ?? actMeta?.dirs?.[dirNum] ?? actMeta?.dirs?.['0'] ?? actMeta?.dirs?.[0];
                const finalMeta: NatureMeta = {
                    box_w: d?.fw ?? 40,
                    box_h: d?.fh ?? 40,
                    anchor_x: d?.hx ?? 20,
                    anchor_y: d?.hy ?? 35,
                    frames: actMeta?.frames ?? 1,
                };
                na.meta = finalMeta;
                const im = new Image();
                im.onload = () => { na.img = im; };
                im.src = base + species + '/' + actName + '_' + dirNum + '.png';
            });
        } else {
            const im = new Image();
            im.onload = () => { na.img = im; };
            // BATTLEFIELD 素材用 preview.png 单帧（DECAY_* 攻城器械残骸 frames.png 达 480~960 帧超宽 strip，整图 drawImage 会失败）；
            // FENCE_RUBBLE（DE b_scen_fence_rubble）仅 5 帧（500×60px，对应 NE/SE/CORNER/GATE/POST 五向），加载 frames.png 按朝向切片。
            const useFenceStrip = isBattlefield && name === 'FENCE_RUBBLE';
            const file = isBattlefield ? (useFenceStrip ? 'frames.png' : 'preview.png') : (isAnim ? 'frames.png' : (isBuilding ? 'preview.png' : 'frames.png'));
            im.src = base + name + '/' + file;
            fetch(base + name + '/_meta.json')
                .then((r) => (r.ok ? r.json() : null))
                .then((m) => { if (m) { if (isBattlefield && !useFenceStrip) m.frames = 1; na.meta = m as NatureMeta; } })
                .catch(() => {});
        }
    }

    /** DE 级涉水动态交互：涉水士兵移动与落水尸体产生向外扩散淡出的等距椭圆涟漪与水花 */
    private renderWadingRipples(ctx: CanvasRenderingContext2D, t: number): void {
        if (!this.useGroundGL || !this.groundLayerGL) return;
        const gl = this.groundLayerGL, W = this.worldCX * 2, H = this.worldCY * 2;
        const isWater = (x: number, y: number) => gl.isWaterAt(x, y, W, H);

        ctx.save();

        // 1. 活人涉水过河：产生双重交错向外荡漾扩散的 2:1 等距椭圆水圈与涉水激浪微光
        for (let i = 0; i < this.men.length; i++) {
            const m = this.men[i];
            if (m.hp <= 0) continue;
            if (!isWater(m.x, m.y)) continue;

            const drawY = m.y - this.elevationLiftAt(m.x, m.y);
            
            // 双层同心外扩涟漪（放缓扩散周期，水纹更舒缓平滑）
            const cycle1 = (t * 0.65 + (i * 0.17)) % 1.0;
            const cycle2 = (cycle1 + 0.5) % 1.0;

            const r1 = 3 + cycle1 * 14;
            const a1 = (1 - cycle1) * 0.42;
            const r2 = 3 + cycle2 * 14;
            const a2 = (1 - cycle2) * 0.42;

            // 绘制第 1 圈外扩水波
            ctx.lineWidth = 1.6;
            ctx.strokeStyle = `rgba(220, 245, 255, ${a1.toFixed(2)})`;
            ctx.beginPath();
            ctx.ellipse(m.x, drawY + 1, r1, r1 * 0.5, 0, 0, Math.PI * 2);
            ctx.stroke();

            // 绘制第 2 圈外扩水波
            ctx.strokeStyle = `rgba(180, 230, 255, ${a2.toFixed(2)})`;
            ctx.beginPath();
            ctx.ellipse(m.x, drawY + 1, r2, r2 * 0.5, 0, 0, Math.PI * 2);
            ctx.stroke();

            // 脚下涉水微小水花泛光
            ctx.fillStyle = `rgba(255, 255, 255, ${((1 - cycle1) * 0.32).toFixed(2)})`;
            ctx.beginPath();
            ctx.ellipse(m.x, drawY + 2, 2.5, 1.2, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // 2. 阵亡落水尸体（微弱静水缓波涟漪，同样放缓）
        for (let i = 0; i < Math.min(this.corpses.length, 30); i++) {
            const c = this.corpses[i];
            if (!isWater(c.x, c.y)) continue;

            const drawY = c.y - this.elevationLiftAt(c.x, c.y);
            const cycle = (t * 0.35 + (i * 0.25)) % 1.0;
            const r = 5 + cycle * 10;
            const a = (1 - cycle) * 0.25;

            ctx.lineWidth = 1.2;
            ctx.strokeStyle = `rgba(200, 235, 255, ${a.toFixed(2)})`;
            ctx.beginPath();
            ctx.ellipse(c.x, drawY, r, r * 0.5, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }

    /** 画单个装饰精灵（按 anchor 对齐树基/岩心，支持水平翻转） */
    /** 战略地图同款「建筑脚下地基底图」贴图：按城型取（与 TerritorySystem 逐一对应）。毡帐营地（YURT）无地基。 */
    private cityPlazaTile(): string | null {
        if (this.buildingStyleFor(1) === 'YURT') return null;
        switch (this.defenderCityType) {
            case 'stockade': return 'pm1_plaza';
            case 'small_city': return 'sr2_plaza';
            case 'medium_city': return 'rd2_plaza';
            case 'big_city': return 'rd1_plaza';
            case 'pass': return 'rck_plaza';
            default: return null;
        }
    }
    private plazaImgs: Record<string, HTMLImageElement> = {};

    /** 🔴 [2026-10-11 主人「底图让战略地图和战术地图一致」] 新战术模式（WebGL 地面）里，守方每栋建筑脚下垫战略地图同款
     *  `*_plaza.png` 地基底图：宽 = 建筑宽 × 2.3、高 = 宽 × 0.58，与建筑同中心（同 TerritorySystem 的 bGroundW / bGroundH）。 */
    private drawCityPlazas(ctx: CanvasRenderingContext2D): void {
        if (this.battleType !== 'siege' || this.deCity) return;   // 战略同款城池自带地基层
        const tile = this.cityPlazaTile();
        if (!tile) return;
        let img = this.plazaImgs[tile];
        if (!img) { img = new Image(); img.src = '/SUCAI_TERRAIN/' + tile + '.png'; this.plazaImgs[tile] = img; }
        if (!img.complete || !img.naturalWidth) return;
        const spawns = this.spawns.filter((sp) => sp.f === 1 && !sp.commander);
        const used = new Set<DecorSprite>();
        for (const sp of spawns) {
            let best: DecorSprite | null = null, bestD = 60 * 60;
            for (const d of this.decorSprites) {
                if (used.has(d) || !d.asset.startsWith('BUILDING:') || /GATE|TOWER|WALL/.test(d.asset)) continue;
                const dd = (d.x - sp.x) ** 2 + (d.y - sp.y) ** 2;
                if (dd < bestD) { bestD = dd; best = d; }
            }
            if (!best) continue;
            used.add(best);
            const na = this.natureCache[best.asset];
            if (!na || !na.meta) continue;
            const k = best.scale ?? 1;
            const bW = na.meta.box_w * k;
            const cx = best.x - na.meta.anchor_x * k * (best.flip ? -1 : 1) + (best.flip ? -1 : 1) * bW / 2;
            const cy = best.y - na.meta.anchor_y * k + na.meta.box_h * k / 2 - this.elevationLiftAt(best.x, best.y);
            const gw = bW * 2.3, gh = gw * 0.58;
            ctx.drawImage(img, cx - gw / 2, cy - gh / 2, gw, gh);
        }
    }

    private drawDecorSprite(g: CanvasRenderingContext2D, s: DecorSprite, drawY: number = s.y): void {
        const na = this.natureCache[s.asset];
        if (!na || !na.img || !na.img.complete || !na.meta) return;
        const m = na.meta;
        // 🔴 建筑/城门倒塌动画：collapse 状态存在时按 t/dur 推进帧（播完由 step 切 rubble、清状态）。
        //    AoE2 DE 素材中，民房(HOUSE)等建筑包含 3 种造型变体（每个变体 100 帧，共 300 帧）。
        //    战场建筑平时显示款式 0（变体 0）；倒塌时若拿 300 帧推进，会导致同一栋房子在 8 秒内连续「塌了又复原」3 遍，
        //    且播放速度异常加快 3 倍，末帧更会超 64K/32K 纹理采样上限。
        //    因此多变体建筑倒塌动画按单变体 100 帧播放，平滑过渡并完美衔接切入第 0 帧残骸。
        let fr: number;
        if (s.collapse) {
            const p = Math.min(1, s.collapse.t / s.collapse.dur);
            const animFrames = m.frames >= 200 ? 100 : m.frames;
            fr = Math.min(animFrames - 1, Math.floor(p * animFrames));
        } else if (s.asset.startsWith('ANIMAL:') && m.frames > 1) {
            // 🔴 [2026-10-13 主人令「动物要会动」]
            //    动物（鹿/狼/野猪/猛兽/牛羊/飞鸟等）按 DE 原生 15fps 节奏推进动作帧，
            //    叠加 s.frame 随机相位避免群体动物机械同步；其他植物/岩石/建筑保持静态。
            // 🔴 [2026-10-15 主人令「加快移动频率」] 移动（walk/run）帧率提到 24fps 匹配提速后的奔跑，
            //    idle 仍按 15fps（吃草/甩尾慢节奏）。
            const act = s.asset.split('/')[1]?.split('_')[0];
            const fps = (act === 'walk' || act === 'run') ? 24 : 15;
            fr = Math.floor(this.battleSec * fps + s.frame) % m.frames;
        } else {
            fr = m.frames > 0 ? (s.frame % m.frames) : 0;
        }
        const sw = m.box_w, sh = m.box_h;
        const sx = fr * sw;
        // scale 未设置 = 原尺寸原路径（其余装饰逐像素不变）；设置时尺寸与锚点等比缩放，脚点仍落在 (s.x, drawY)
        const k = s.scale ?? 1;
        let bld: WarBuilding | undefined;
        if (this.battleType === 'siege' && !s.collapse && !s.destroyed && !s.asset.includes('_RUBBLE')) {
            for (const b of this.defBuildings) if (b.sprite === s) { bld = b; break; }
            if (!bld) for (const b of this.wallGates) if ((b.key === 'STONE_GATE' || b.key === 'WOOD_WALL') && b.sprite === s) { bld = b; break; }
        }
        // 🔴 [2026-10-16 主人令「攻城武器，打栅栏？和打城墙说75%，50%，25%就可以通行，一致吗？有残垣断壁的感觉吗？」「请执行」]
        //    木栅栏 / 强木栅栏 / 篱笆在受损或 75%/50%/25% 破口时，垫碎木/碎石底座并按 4 竖条参差截断上部桩尖，呈现高低犬牙交错的断桩残垣。
        let woodKeepH = 1;
        let woodEffRatio = bld && bld.maxHp > 0 ? (bld.hp / bld.maxHp) : 1;
        if (bld && bld.key === 'WOOD_WALL') {
            if (s.obstructionDisabled) woodEffRatio = this.wallBreachRatio(bld);
            if (woodEffRatio <= 0.25) woodKeepH = 0.34;
            else if (woodEffRatio <= 0.50) woodKeepH = 0.54;
            else if (woodEffRatio <= 0.75) woodKeepH = 0.76;
        }
        if (woodKeepH < 1) {
            const isFence = s.asset.includes('FENCE');
            const rubKey = isFence ? 'BATTLEFIELD:FENCE_RUBBLE' : 'BUILDINGANIM:FOUNDATION_1X1_RUBBLE';
            const rubNa = this.natureCache[rubKey];
            if (rubNa?.img?.complete && rubNa.meta) {
                const rm = rubNa.meta;
                const rFr = isFence ? (s.asset.includes('CORNER') ? 2 : (s.asset.includes('POST') || s.asset.endsWith('_N')) ? 4 : s.asset.endsWith('_SE') ? 1 : 0) : 0;
                g.drawImage(rubNa.img, (rFr % Math.max(1, rm.frames)) * rm.box_w, 0, rm.box_w, rm.box_h, s.x - rm.anchor_x * k, drawY - rm.anchor_y * k, rm.box_w * k, rm.box_h * k);
            }
            const jag = [-0.09, 0.07, -0.06, 0.08] as const;
            g.save();
            g.translate(s.x, drawY);
            g.scale(s.flip ? -k : k, k);
            for (let i = 0; i < 4; i++) {
                const x0 = Math.round((sw * i) / 4);
                const x1 = Math.round((sw * (i + 1)) / 4);
                const sliceW = x1 - x0;
                if (sliceW <= 0) continue;
                const kH = Math.max(0.20, Math.min(0.92, woodKeepH + jag[i]));
                const cropY = Math.max(0, Math.min(m.anchor_y - 4, Math.round(m.anchor_y * (1 - kH))));
                g.drawImage(na.img, sx + x0, cropY, sliceW, sh - cropY, -m.anchor_x + x0, -m.anchor_y + cropY, sliceW, sh - cropY);
            }
            g.restore();
        } else if (s.flip) {
            g.save();
            g.translate(s.x, drawY);
            g.scale(-k, k);
            g.drawImage(na.img, sx, 0, sw, sh, -m.anchor_x, -m.anchor_y, sw, sh);
            g.restore();
        } else if (k !== 1) {
            g.drawImage(na.img, sx, 0, sw, sh, s.x - m.anchor_x * k, drawY - m.anchor_y * k, sw * k, sh * k);
        } else {
            g.drawImage(na.img, sx, 0, sw, sh, s.x - m.anchor_x, drawY - m.anchor_y, sw, sh);
        }
        // 🔴 [2026-10-15 严格复刻 DE empires2_x2_p1.dat damage_graphics + particles/fire_*.json]
        //    1) 尺寸：DE fire_*.json 统一规定 "Scale": 0.5（图集为 2× 分辨率），故按 fk = 0.5 * k 绘制；
        //    2) 速度：DE fire_*.json 统一规定 "ImageCount": 60, "Duration1": 2.9, "Duration2": 3.1（60 帧播 3.0 秒 ≈ 20fps）；
        //    3) 档位与坐标：按 DE empires2_x2_p1.dat 各建筑 damage_graphics (apply_mode=0) 实测 deltas 偏移 (ox, oy) 挂在建筑锚点 (s.x, drawY) 上：
        //       Damage1(掉血≥25%) 全为小火 Fire Small；Damage2(掉血≥50%) 升级为中火 Fire Medium；Damage3(掉血≥75%) 加入大火 Fire Large。
        if (bld) {
            const isFence = s.asset.includes('FENCE');
            const fireRatio = (bld.key === 'WOOD_WALL' && s.obstructionDisabled)
                ? (isFence ? 1 : (woodEffRatio >= 0.50 ? woodEffRatio : 1))
                : (bld.hp > 0 ? bld.hp / bld.maxHp : 1);
            if (fireRatio > 0 && fireRatio <= 0.75) {
                const tierIdx = fireRatio <= 0.25 ? 2 : (fireRatio <= 0.50 ? 1 : 0);
                const bName = bld.bld?.name ?? s.asset;
                let kind = (bld.key === 'STONE_GATE' && !isFence) ? 'GATE' : ((bld.key === 'WOOD_WALL' || isFence) ? 'OUTPOST' : 'HOUSE');
                if (bld.bld) {
                    for (const kName of ['CASTLE', 'WONDER', 'ARCHERY_RANGE', 'SIEGE_WORKSHOP', 'TOWN_CENTER', 'BARRACKS', 'BLACKSMITH', 'UNIVERSITY', 'MONASTERY', 'MARKET', 'STABLE', 'MILL', 'TOWER', 'OUTPOST']) {
                        if (bName.includes(kName)) { kind = kName; break; }
                    }
                }
                const deltas = (DE_FIRE_DELTAS[kind] ?? DE_FIRE_DELTAS.HOUSE)[tierIdx];
                // DE fire_*.json: Scale = 0.5；StartMode = "Fade", StartDuration = 0.75
                const fk = 0.5 * k;
                const dropY = woodKeepH < 1 ? Math.round((1 - woodKeepH) * 18) : 0;
                const seed = Math.abs(Math.round(s.x * 7 + s.y * 13));
                const fadeIn = bld.hitAt !== undefined ? Math.min(1, (this.battleSec - bld.hitAt) / 0.75) : 1;
                if (fadeIn < 0.99) { g.save(); g.globalAlpha *= Math.max(0.05, fadeIn); }
                for (let i = 0; i < deltas.length; i++) {
                    const [fxKey, ox, oy] = deltas[i];
                    const fx = this.fxBank[fxKey]?.dirs[0];
                    if (!fx?.img || !fx.fw || !fx.n) continue;
                    const fxX = s.x + (s.flip ? -ox : ox) * k;
                    const fxY = drawY + (oy + dropY) * k;
                    // DE Duration1=2.9 ~ Duration2=3.1s 播 60 帧 ⇒ 约 19.3 ~ 20.7 fps，完整一轮循环 3.0 秒
                    const rate = 19.3 + (i % 3) * 0.7;
                    const fr = Math.floor(this.battleSec * rate + i * 11 + (seed % 60)) % fx.n;
                    g.drawImage(fx.img, fr * fx.fw, 0, fx.fw, fx.fh, fxX - fx.hx * fk, fxY - fx.hy * fk, fx.fw * fk, fx.fh * fk);
                }
                if (fadeIn < 0.99) g.restore();
            }
        }
    }


    // ── 素材：按需加载 + 去绿幕 + 染色（同 __war.html / 主游戏启动管线）──
    // ── 抠绿 Worker（主线程零阻塞，见 DechromaWorker）──
    private dechromaWorker: Worker | null = null;
    private dechromaMsgId = 0;
    private dechromaCallbacks: Map<number, (dataUrl: string) => void> = new Map();

    /** 懒建抠绿 Worker。 */
    private ensureDechromaWorker(): Worker {
        if (this.dechromaWorker) return this.dechromaWorker;
        const w = new DechromaWorker();
        w.onmessage = (e: MessageEvent<{ id: number; dataUrl: string }>) => {
            const { id, dataUrl } = e.data;
            const cb = this.dechromaCallbacks.get(id);
            if (cb) {
                this.dechromaCallbacks.delete(id);
                cb(dataUrl);
            }
        };
        this.dechromaWorker = w;
        return w;
    }

    /** 抠绿 → dataUrl，全程在 Worker 里做（getImageData 回读 + 逐像素 + PNG 编码），主线程不阻塞。失败返回空串。 */
    private dechromaToDataUrl(img: HTMLImageElement): Promise<string> {
        return createImageBitmap(img)
            .then((bitmap) => {
                const worker = this.ensureDechromaWorker();
                const id = this.dechromaMsgId++;
                return new Promise<string>((resolve) => {
                    this.dechromaCallbacks.set(id, resolve);
                    worker.postMessage({ id, bitmap }, [bitmap]);
                });
            })
            .catch(() => '');
    }


    /** 读 AoE2 DE 素材的 `_meta.json`（帧数 + 每方向 box 尺寸/hotspot 偏移），映射到 slot。 */
    private async loadDynMeta(dir: string): Promise<{ dyn: NonNullable<WarBank['dyn']>; frames: Record<string, number>; dur: Record<string, number> } | null> {
        // 命中缓存直接返回拷贝（见 dynMetaCache 头注：静态数据，跨战斗有效；拷贝防被调用方写污染）
        const cached = this.dynMetaCache.get(dir);
        if (cached) return { dyn: { ...cached.dyn }, frames: { ...cached.frames }, dur: { ...cached.dur } };
        try {
            const res = await fetch(`${dir}_meta.json`);
            if (!res.ok) return null;
            const meta: any = await res.json();
            const dyn: NonNullable<WarBank['dyn']> = {};
            const frames: Record<string, number> = {};
            const dur: Record<string, number> = {};
            // _meta.json 的 action 键 → slot；melee/charge 复用 attack 的元数据。
            const map: Record<string, string[]> = {
                idle: ['idle'], move: ['move'], attack: ['atk', 'melee', 'charge'], death: ['die'],
            };
            for (const [act, slots] of Object.entries(map)) {
                if (!meta[act]) continue;
                for (const slot of slots) {
                    dyn[slot] = meta[act].dirs;
                    frames[slot] = meta[act].frames;
                    if (typeof meta[act].dur === 'number') dur[slot] = meta[act].dur;
                }
            }
            this.dynMetaCache.set(dir, { dyn, frames, dur });   // 只缓存成功结果，失败留给下次重试
            return { dyn: { ...dyn }, frames: { ...frames }, dur: { ...dur } };
        } catch { return null; }
    }

    private ensureType(key: string, side: 0 | 1): void {
        // 只准备实际出场方的染色；同兵种出现在双方时分别补齐，共享原图和元数据。
        let sides = this.bankSides.get(key);
        if (sides?.has(side)) return;
        if (!sides) { sides = new Set(); this.bankSides.set(key, sides); }
        sides.add(side);
        const gen = this.assetGen;
        const faction = this.sideFaction[side];
        try {
            const assets = (SPRITE_PATHS.UNIT_ASSETS as Record<string, any>)[key];
            if (!assets) { this.bank[key] = { realMelee: false, noAttackAnim: false, fh: 84, isDE: false, frames: {}, sets: { move: [[], []], atk: [[], []], die: [[], []], melee: [[], []], charge: [[], []], idle: [[], []] } }; return; }
            const existing = this.bank[key];
            const b: WarBank = existing ?? { realMelee: false, noAttackAnim: false, fh: 84, isDE: false, frames: {}, sets: { move: [[], []], atk: [[], []], die: [[], []], melee: [[], []], charge: [[], []], idle: [[], []] } };
            // 🔴 AoE2 DE 动态帧框：读 `_meta.json`（帧数 + hotspot 偏移），渲染走 hotspot 对齐。
            const _firstUrl: string = (assets.MOVE?.[0] ?? assets.ATTACK?.[0] ?? assets.IDLE?.[0] ?? assets.DEATH?.[0] ?? '') as string;
            const isDE = _firstUrl.includes('/SUCAI/') || DE_DYN_DIRS.some(dir => _firstUrl.includes(dir));
            b.isDE = isDE;
            if (isDE && !existing) {
                const dir = _firstUrl.substring(0, _firstUrl.lastIndexOf('/') + 1);
                this.pending++;
                this.loadDynMeta(dir).then(meta => {
                    if (gen !== this.assetGen) return;
                    if (meta) { b.dyn = meta.dyn; Object.assign(b.frames, meta.frames); b.dur = meta.dur; }
                }).finally(() => { if (gen === this.assetGen) this.pending--; });
            }
            const ranged = RANGED_TYPES.has(key);
            // 远程：atk = SHOOT（射击 +40），melee = ATTACK（近战 +8）；近战/骑兵：atk = ATTACK
            // 冲锋组：**象兵 637-644 / 弓骑 688-695**（2026-08-11 主人口述）。
            // 🔴 冲锋属于「进攻的一种」，所以攻击时在**攻击帧和冲锋帧之间来回切**，
            //    不是拿它当赶路动画（我一度把突骑赶路改成冲锋，被主人纠正）。
            const atkUrls = ranged ? (assets.SHOOT ?? assets.ATTACK ?? []) : (assets.ATTACK ?? []);
            const meleeUrls = ranged ? (assets.ATTACK ?? []) : [];
            // 两套图完全一样 = 没有真正的近战动作（DE 素材普遍如此），贴脸时就别切姿态掐弹丸
            b.realMelee = meleeUrls.length > 0 && meleeUrls.join('|') !== atkUrls.join('|');
            // 没有攻击动作的兵种（攻击帧与待命帧字节相同），清单由离线扫描生成，见 NO_ATTACK_ANIM
            b.noAttackAnim = NO_ATTACK_ANIM.has(key);
            const groups: [string, string[]][] = [
                ['move', assets.MOVE ?? []],
                ['atk', atkUrls],
                ['melee', meleeUrls],
                ['die', assets.DEATH ?? []],
                ['charge', assets.CHARGE ?? []],
                // 待命帧：战斗结束后的 5 秒残局用（全军待命，见 beginLinger）
                ['idle', assets.IDLE ?? []],
            ];
            for (const [slot, urls] of groups) {
                if (!urls.length) continue;
                for (let d = 0; d < 8; d++) {
                    const url = urls[d % urls.length];
                    if (!url) continue;
                    const blocking = slot === 'move' || slot === 'atk';
                    const inc = blocking ? 1 : 0;
                    /**
                     * 🔴 [2026-08-26 按标准「游戏合理」修·进场冻 7 秒] 只有**开场立刻要用**的
                     *    动作组才计入 pending。`pending > 0` 期间 tick() 整个 return（不推进不渲染），
                     *    探针实测 assetsReady 中位 7.3s / p90 20s —— 那就是进战斗「卡一下」。
                     *    开场画面只需要 move（列阵行军）和 atk（接敌出手）：
                     *      · die   第一个人倒下要几秒后
                     *      · melee 远程被贴身才用、charge 冲锋接敌才用
                     *      · idle  残局待命，30 秒后才可能出现
                     *    这四组照常异步加载，只是不再冻住画面（等它们到位的时间远短于用到它们的时间）。
                     *    ⚠️ 别把 move/atk 也移出去 —— 那才会出现「兵没图不显示」。
                     */
                    const gen = this.assetGen;
                    this.pending += inc;
                    // 🔴 [2026-08-30] 取图统一走 ensureCleanImage：缓存命中 / 正在加载 / 全新加载
                    //    三条路合一，**同一个 url 全场只加载+抠绿+解码一次**（见该函数注释）。
                    // DE 素材（isDE）跳过抠绿：判据在透明 PNG 上恒不命中，纯浪费（见 ensureCleanImage 注释）
                    const load = () => { void ensureCleanImage(url, isDE ? null : (img) => this.dechromaToDataUrl(img), blocking).then((clean) => {
                        if (!clean || gen !== this.assetGen) return;
                        // DE 动态帧框：帧数/hotspot 已由 loadDynMeta 的 _meta.json 填好，这里不再从宽高推（非正方形 box 会算错）。
                        if (!isDE) {
                            b.fh = clean.naturalHeight;
                            // [2026-08-15 全帧修复] 帧数 = 宽/高（每帧正方形），各动作独立：
                            //   S10DB 横排 8 帧不变；AoE2 武士/弓手 30~60 帧也正确切。
                            b.frames[slot] = clean.naturalWidth / clean.naturalHeight;
                        }
                        // 染色走 SpriteTinter 共用算法，后台线程处理像素并返回可直接绘制的位图：
                        // 🔴 不能自己「盖一层半透明势力色」——那会把贴图洗白、和素材底色混成脏色
                        //    （主人 2026-08-11 截图实锤「色不正」，一军发紫一军发黄）。
                        // SpriteTinter 限制在途位图数量，避免大批素材同时复制占满内存。
                        return SpriteTinter.getTintedSpriteReady(clean, faction, blocking).then((tinted) => {
                            if (gen !== this.assetGen) return;
                            b.sets[slot][side][d] = tinted;
                        }).catch((e) => {
                            if (gen !== this.assetGen) return;
                            b.sets[slot][side][d] = clean;
                            console.warn('[Scene13WarLayer] 染色失败（回退原图）:', key, slot, d, e);
                        });
                    }).catch((e) => {
                        console.warn('[Scene13WarLayer] 素材准备失败（回退空帧）:', key, slot, d, e);
                    }).finally(() => {
                        // 🔴 pending 只减一次、且**任何**失败路径都要减：漏减 → tick 永久卡在
                        //    `pending > 0` → 演出冻结、战斗面板数字不动（2026-08-11 实锤过）。
                        //    但跨场的回调不许减（见 assetGen）：那一场的 pending 早已整体清零。
                        if (gen === this.assetGen) this.pending -= inc;
                    }); };
                    // 后用动作等开场素材齐全再加载，避免网络连接被死亡/残局动作占满。
                    if (blocking || this.assetsReadyOnce) load();
                    else this.deferredAssetLoads.push(load);
                }
            }
            this.bank[key] = b;
        } catch (e) {
            console.warn('[Scene13WarLayer] 素材加载失败（回退空帧）:', key, e);
            this.bank[key] = { realMelee: false, noAttackAnim: false, fh: 84, isDE: false, frames: {}, sets: { move: [[], []], atk: [[], []], die: [[], []], melee: [[], []], charge: [[], []], idle: [[], []] } };
        }
    }

    /** 读 DE 抛射物 `_meta.json`（帧数 + 帧框 + hotspot）。 */
    private async loadProjMeta(dir: string): Promise<{ frames: number; box_w: number; box_h: number; anchor_x: number; anchor_y: number } | null> {
        // 同 loadDynMeta：静态数据跨战斗缓存（投射物与特效都走这里）。返回拷贝，调用方只读数值也不留隐患。
        const cached = this.projMetaCache.get(dir);
        if (cached) return { ...cached };
        try {
            const res = await fetch(`${dir}_meta.json`);
            if (!res.ok) return null;
            const meta = await res.json();
            if (meta && typeof meta.frames === 'number') this.projMetaCache.set(dir, meta);
            return meta;
        } catch { return null; }
    }

    /** 按需加载 DE 抛射物素材（透明底 fly_0.png，不抠绿不染色——箭/标枪/飞斧 DE 里无玩家色）。 */
    private ensureProj(key: string): void {
        if (key === 'PROJ_MAGIC' || this.projBank[key]) return;
        // 抛射物素材目录：投石索 PROJ_SLING 已提取真实小石弹素材（2026-08-18，此前误复用大炮弹 PROJ_BALL）
        const dir = `/SUCAI/${PROJ_ASSET_KEY[key] ?? key}/`;
        // 占位先立（img=null），防同一 key 重复加载；渲染时 img 未就绪就跳过不画。
        this.projBank[key] = { img: null, n: 8, fw: 0, fh: 0, hx: 0, hy: 0 };
        this.pending++;
        this.loadProjMeta(dir).then(meta => {
            if (meta) {
                this.projBank[key].n = meta.frames;
                this.projBank[key].fw = meta.box_w;
                this.projBank[key].fh = meta.box_h;
                this.projBank[key].hx = meta.anchor_x;
                this.projBank[key].hy = meta.anchor_y;
            }
            const im = new Image();
            im.onload = () => { this.projBank[key].img = im; this.pending--; };
            im.onerror = () => { this.pending--; };
            im.src = `${dir}fly_0.png`;
        }).catch(() => { this.pending--; });
    }

    /** 按需加载 DE 攻击特效（单组 1 向 / 炮口焰 8 向，各方向 box/anchor 独立）。 */
    private ensureFx(type: string): void {
        if (this.fxBank[type]) return;
        const cfg = FX_CFG[type];
        if (!cfg) return;
        const asset: FxAsset = { dirs: [] };
        this.fxBank[type] = asset;   // 占位先立，防同一 type 重复加载
        const base = `/SUCAI_FX/${cfg.path}/`;
        for (let d = 0; d < cfg.dirs; d++) {
            const sub = cfg.dirs > 1 ? `dir${String(d).padStart(2, '0')}/` : '';
            const fd: FxDir = { img: null, n: 0, fw: 0, fh: 0, hx: 0, hy: 0 };
            asset.dirs.push(fd);
            this.pending++;
            this.loadProjMeta(`${base}${sub}`).then(meta => {
                if (meta) {
                    fd.n = meta.frames; fd.fw = meta.box_w; fd.fh = meta.box_h;
                    fd.hx = meta.anchor_x; fd.hy = meta.anchor_y;
                }
                const im = new Image();
                im.onload = () => { fd.img = im; this.pending--; };
                im.onerror = () => { this.pending--; };
                im.src = `${base}${sub}fly_0.png`;
            }).catch(() => { this.pending--; });
        }
    }

    /** 生成一次性 DE 攻击特效（爆炸/炮口焰），独立生命周期，不挂兵相位。 */
    private spawnFx(type: string, x: number, y: number, dir: number): void {
        this.ensureFx(type);
        this.fxs.push({
            type, x, y, dir,
            t: 0,
            dur: FX_DUR[type] ?? 0.3,
            scale: FX_SCALE[type] ?? 1,
        });
    }

    /** 爆炸特效：径向对称（单组 1 向），dir 取 0。 */
    private explode(type: 'FX_EXPLOSION' | 'FX_PETARD', x: number, y: number): void {
        this.spawnFx(type, x, y, 0);
        audioManager.play('explosion');
    }

    /** 投石/巨石落地冲击：DE 烟尘碎石飞溅 + 攻城撞击音效（非火药爆炸）。 */
    private siegeImpact(x: number, y: number): void {
        this.spawnFx('FX_TREBUCHET_SMOKE', x, y, 0);
        audioManager.play('siege_impact');
    }

    /** 火器炮口焰：发射瞬间喷出 DE 炮口焰特效（按兵种口径选 MUZZLE_*）+ 开火音效。 */
    private spawnFirearmMuzzle(m: WarMan, ax: number, ay: number): void {
        const type = FIREARM_MUZZLE[m.key] ?? 'FX_MUZZLE_HAND';
        const ang = Math.atan2(ay, ax);
        const ox = m.x + Math.cos(ang) * UNIT_PX * 0.6;
        const oy = m.y + Math.sin(ang) * UNIT_PX * 0.6 - UNIT_PX * 0.4;
        this.spawnFx(type, ox, oy, this.dir8(ax, ay));
        // 音效：火炮（bombard/organ）走低沉炮声，火枪（hand/conq）走清脆枪声（cooldown 节流）
        audioManager.play(type === 'FX_MUZZLE_BOMBARD' || type === 'FX_MUZZLE_ORGAN' ? 'naval_cannon_fire' : 'gun_fire');
    }

    /** 无攻击动画车辆（战车/弩炮）射击尘烟：素色火花，不是火药（射的是箭）。 */
    private muzzleFlash(m: WarMan, ax: number, ay: number, palette?: readonly string[]): void {
        const ang = Math.atan2(ay, ax);
        const ox = m.x + Math.cos(ang) * UNIT_PX * 0.6;
        const oy = m.y + Math.sin(ang) * UNIT_PX * 0.6 - UNIT_PX * 0.4;
        const colors = palette ?? ['#FFF4D0', '#FFD800', '#FF8C00', '#FFFFFF'];
        for (let i = 0; i < 6; i++) {
            const spd = 20 + Math.random() * 40;
            const spread = (Math.random() - 0.5) * 0.8;
            this.sparks.push({
                x: ox, y: oy,
                vx: Math.cos(ang + spread) * spd,
                vy: Math.sin(ang + spread) * spd - 6,
                t: 0,
                dur: 0.10 + Math.random() * 0.14,
                color: colors[(Math.random() * colors.length) | 0],
                size: 1.4 + Math.random() * 1.6,
            });
        }
    }

    /** 火矛手充能喷火（DE 进战先喷）：3 发低精度短程火枪弹 + 矛头火焰喷射。 */
    private fireLanceVolley(m: WarMan, foe: WarMan): void {
        const ax = foe.x - m.x, ay = foe.y - m.y;
        const ad = Math.hypot(ax, ay) || 1;
        const ang = Math.atan2(ay, ax);
        this.ensureProj('PROJ_FIRE_LANCER');
        for (let v = 0; v < FIRE_LANCER_VOLLEY; v++) {
            const spread = (Math.random() - 0.5) * 0.55;   // 低精度散射
            const c = Math.cos(spread), s = Math.sin(spread);
            this.arrows.push({
                x: m.x, y: m.y - UNIT_PX * 0.45,   // 从胸口高度射出
                dx: ax / ad * c - ay / ad * s,
                dy: ax / ad * s + ay / ad * c,
                len: Math.min(ad, 170),            // 短程火枪弹（DE range 4 ≈ 160px）
                t: 0, dur: Math.min(ad, 170) / PROJ_SPEED_PX.PROJ_FIRE_LANCER, f: m.f,
                proj: 'PROJ_FIRE_LANCER',
            });
        }
        // 矛头喷火：DE 火矛炮口焰特效（沿朝向）
        const ox = m.x + Math.cos(ang) * UNIT_PX * 0.5;
        const oy = m.y + Math.sin(ang) * UNIT_PX * 0.5 - UNIT_PX * 0.45;
        this.spawnFx('FX_MUZZLE_FIRELANCE', ox, oy, this.dir8(ax, ay));
    }

    private dir8(dx: number, dy: number): number {
        let a = Math.atan2(-dy, dx) * 180 / Math.PI;
        a = ((a % 360) + 360) % 360;
        return (9 - Math.floor(((a + 22.5) % 360) / 45)) % 8;
    }

    /**
     * 带迟滞的八向朝向：角度**贴着扇区边界**时不换向。
     *
     * 治的是主人反复报的「颤抖」里属于朝向的那一半：8 个方向每格 45°，
     * 一旦目标方位卡在两格交界（被推挤/目标自己也在动，每帧摆动一两度），
     * 贴图就会在两个朝向之间每帧来回跳。行军分支早有防抖（到达判定 + 只在真的走时才转向），
     * 但 2026-08-17 新加的追击分支没有 —— 追击时目标一直在动，正好长期贴在边界上。
     * 这里留 10° 缓冲：越过边界 10° 以上才真的换朝向。
     */
    private dir8Hyst(cur: number, dx: number, dy: number): number {
        if (dx * dx + dy * dy < 1e-6) return cur;
        const next = this.dir8(dx, dy);
        if (next === cur) return cur;
        const diff = Math.abs(next - cur);
        if (diff !== 1 && diff !== 7) return next;
        let a = Math.atan2(-dy, dx) * 180 / Math.PI;
        a = ((a % 360) + 360) % 360;
        const off = (a + 22.5) % 45;      // 在本扇区内的位置：0 或 45 都表示正贴边界
        if (off < 10 || off > 35) return cur;
        return next;
    }

    /** 对面最近的**还在出兵的**敌口（纵向加权 = 同一路优先）。空口不算——认死空口会让整路兵原地朝前走不转向 */
    private nearestEnemySpawn(s: WarSpawn): WarSpawn | null {
        let best: WarSpawn | null = null, bd = Infinity;
        for (const t of this.spawns) {
            if (t.f === s.f || t.pool <= 0) continue;
            const uF = this.advanceVec[s.f], uS = this.sideVec[s.f], dx = t.x - s.x, dy = t.y - s.y;
            const df = dx * uF.x + dy * uF.y, ds = (dx * uS.x + dy * uS.y) * LANE_W;
            const d = df * df + ds * ds;
            if (d < bd) { bd = d; best = t; }
        }
        return best;
    }

    private spawnTick(dt: number): void {
        const onField = [0, 0];
        for (const m of this.men) if (m.hp > 0) onField[m.f]++;

        // 成批补：开局双方各出 500（10 队 × 50 人）；之后一方场上 < 250 才再补 500。
        //   成批补（不是死一个补一个），一方打掉一半才补一波，靠成批的兵反推战线。
        this.batchCd -= dt;
        if (this.batchCd > 0) return;
        // 渐显时长：开场列阵待命阶段的兵拉长淡入（整军缓缓显现），中途补兵保持短淡入
        const fadeDur = this.deployT > 0 ? DEPLOY_FADE : FADE_IN;

        // 每一方独立判断：场上 < 250 才补 500（开局双方 0 → 各补 500，一帧同时出）
        for (let f = 0; f < 2; f++) {
            if (onField[f] >= TRIGGER) continue;   // 场上 >= 250 不补

            const ports = this.spawns.filter(s => s.f === f && s.pool > 0);
            if (!ports.length) continue;
            let batch = SIDE_CAP;                  // 一次补 500（固定批量）
            for (const s of ports) s.slotN = 0;    // 每批重置槽位计数（补兵也排方阵）


            // 从**所有还有兵的出兵口**一起涌出，不是一个点
            let pi = 0;
            const outsideMen: WarMan[] = [];   // 本批在城外列阵出生的守军（批末按实际站位贴墙校正，见下）
            while (batch > 0) {
                const s = ports[pi % ports.length];
                pi++;
                if (s.pool <= 0) {
                    if (ports.every(p => p.pool <= 0)) break;
                    continue;
                }
                s.pool--;
                batch--;
                const tgt = this.nearestEnemySpawn(s) ?? this.enemyCen[1 - s.f];
                if (!tgt) break;
                // 本兵终身固定的落点偏移（见 AIM_JITTER）：出生时抽一次，之后 aimAt 的共用坐标都加它
                const jx = (Math.random() - 0.5) * 2 * AIM_JITTER;
                const jy = (Math.random() - 0.5) * 2 * AIM_JITTER;
                // 旗手身份出生时定死（勿改成每帧现挑，见 FLAG_EVERY）。
                // 每个出兵口独立计数：本口每出满 FLAG_EVERY 个精灵出一面旗 → 旗帜按口平均分布。
                s.spawned++;
                const bearer = (s.spawned % FLAG_EVERY === 0);
                // 列阵推进：**所有批次**都按口排方阵（rank=沿 x 纵深、file=沿 y 横列），补兵不再随机散布；
                // 但只有开局那批 march=true 整体平移迁就最慢，补兵 march=false 各自按兵种速度走。
                // 🔴 [2026-08-23 主人定] 攻城战不再列阵行军：开局双方按兵不动（见 holdSiege），
                //    40 秒城墙坍塌后直接各自索敌接战（aimAt/search）；march 列阵只保留给野战。
                // 🔴 [2026-10-11 主人令「我要方阵，不要一条线」] **攻城战也列阵推进**：原为 `&& battleType !== 'siege'`
                //    ⇒ 攻城时每个兵各自扑向城门，十队方阵立刻散成一条横线（主人多张截图实锤）。
                //    现在与野战同款：整队方块推进，到城墙下再散开接战。
                const inMarch = this.deployT > 0;
                const slotIdx = s.slotN++;
                const files = marchFilesOf(s.key);
                // 横向按体型撑开（战车 44 / 步骑 24）；纵深另设上限 MARCH_SP_DEPTH_MAX，叠车由软推挤自然拉开。
                const sp = marchSpacingOf(s.key);
                // 🔴 [2026-10-12 主人「现在的方阵有问题，是前后长，应该是左右长」「先试A」]
                //    原「行距取列距 2 倍」（2026-10-11）实测（scratch 探针，攻城战弋阳）：方阵纵深 82 / 横向 41，
                //    前后是左右的 2 倍，且同排兵上下叠成竖线、排间露空 ⇒ 看着「一条一条」。改为行距＝列距。
                const spDep = Math.min(sp, MARCH_SP_DEPTH_MAX);
                // 🔴 [2026-10-11 主人令「你看看以前的13战术模式是如何排列的」]
                //    旧 13 的排法（`!useFieldPlan` 那条路）就是：**每队 = rank×spDep 行 × slotY 列，
                //    整块贴在出兵口、向后方排开**（`spawnX = s.x ± dep`、`spawnY = s.y + slotY`）。
                //    本人先前给攻城战单独改成「以出兵口为中心」，**偏离了旧 13 口径** ⇒ 已退回，
                //    三种情况（野战 / 攻城 / 退回旧 13）现在**统一用旧 13 的排法**：行号 0 起、向后排。
                const dep = ((slotIdx / files) | 0) * spDep;
                const slotY = ((slotIdx % files) - (files - 1) / 2) * sp;

                const uFwd = this.advanceVec[s.f];
                const uSide = this.sideVec[s.f];
                let spawnX = s.x - uFwd.x * dep + uSide.x * slotY;
                let spawnY = s.y - uFwd.y * dep + uSide.y * slotY;
                // 🔴 [2026-10-14 主人令「第一波直接在城外列阵出生」「最后一排背靠城墙」]
                // 🔴 [2026-10-18 主人令「城门还没破的第二波以后的守军不要动，只原地攻击，不然又出不来，为什么要动？都拥挤再城墙哪里，等城门破了，第二波往后的守军再发起反击」]
                const outsideFirst = s.f === 1 && this.battleType === 'siege' && !!this.deCity && inMarch && s.outFwd !== undefined;
                if (outsideFirst) {
                    const B = this.defOutsideBase(), F = B.fwd, S = B.side;   // 阵与最正对攻方的那面墙平行（见 defOutsideBase）
                    spawnX = B.x + F.x * s.outFwd! + S.x * s.outSide! - F.x * dep + S.x * slotY;
                    spawnY = B.y + F.y * s.outFwd! + S.y * s.outSide! - F.y * dep + S.y * slotY;
                    this.holdLanes.add(s.lane);
                }
                // 🔴 [2026-10-11 主人令] 陆战口径：水/树林/建筑一律可通行 ⇒ 士兵落位不再避水（原三步避水已删）
                this.men.push({
                    f: s.f, key: s.key, jx, jy,
                    zid: this.manSeq++,
                    x: spawnX,
                    y: spawnY,
                    tx: spawnX, ty: spawnY, hp: this.statsFor(s.key, s.f).hp,
                    dir: this.dir8(tgt.x - s.x, tgt.y - s.y),
                    ph: Math.random() * 8, st: 0, foe: null, next: Math.random() * 0.2,
                    fightT: 0, aimT: (s.spawned % 15) * 0.033, lock: 0, atkSt: 0, atkFlip: false,
                    prevX: spawnX, prevY: spawnY,
                    anchorX: spawnX, anchorY: spawnY, netT: 0,
                    stuckT: 0, sepX: 0, sepY: 0, y0: s.y,
                    flag: bearer, fo: Math.random() * 600,
                    march: inMarch && !outsideFirst, port: inMarch && !outsideFirst ? s : null, dep, slotY, pop: s.pop,
                    lane: s.lane,
                    guardPost: (s.f === 1 && this.battleType === 'siege' && !!this.deCity && !outsideFirst && !this.isDefenderGateDestroyed())
                        ? { x: spawnX, y: spawnY }
                        : undefined,
                    claims: 0, claimsNext: 0, atkers: 0, atkNext: 0, fadeT: fadeDur, fadeMax: fadeDur,
                });
                if (outsideFirst) outsideMen.push(this.men[this.men.length - 1]);
            }
            // 🔴 [2026-10-14] 城外阵贴墙校正：defOutsideBase 按「每队 50 人」估最后一排，实际每队人数随队数、兵种人口而变
            //    （实测 9 队时有的队排到 6~7 排，最后一排压到墙上）⇒ 整批出生后按实际站位，沿墙的法线整体挪到「最后一人离墙外表面 DEF_WALL_GAP」。
            if (outsideMen.length) {
                // 守城的玩家本人同在城外阵里（见 setupPlayerUnits），一起挪
                const hm = this.heroMan;
                if (hm && hm.f === f && hm.hp > 0 && !outsideMen.includes(hm) && !this.insideRing(hm.x, hm.y)) outsideMen.push(hm);
                const B = this.defOutsideBase(), F = B.fwd, C = this.deCityCenter;
                let minP = Infinity;
                for (const m of outsideMen) minP = Math.min(minP, (m.x - C.x) * F.x + (m.y - C.y) * F.y - this.radiusOf(m.key));
                const d = B.wallOuter + DEF_WALL_GAP - minP;
                if (Number.isFinite(d) && Math.abs(d) > 0.5) {
                    for (const m of outsideMen) {
                        m.x += F.x * d; m.y += F.y * d; m.tx += F.x * d; m.ty += F.y * d;
                        m.prevX = m.x; m.prevY = m.y; m.anchorX = m.x; m.anchorY = m.y; m.y0 = m.y;
                    }
                }
            }
        }
        this.batchCd = BATCH_COOLDOWN;
    }

    private put(map: Map<number, WarMan[]>, cell: number, m: WarMan): void {
        const k = HKEY((m.x / cell) | 0, (m.y / cell) | 0);
        let a = map.get(k);
        if (!a) {
            a = this.gridBucketPool.pop() ?? [];
            map.set(k, a);
        }
        a.push(m);
    }

    private recycleGrid(map: Map<number, WarMan[]>): void {
        for (const bucket of map.values()) {
            bucket.length = 0;
            this.gridBucketPool.push(bucket);
        }
        map.clear();
    }

    private rebuild(): void {
        this.recycleGrid(this.gm);
        this.recycleGrid(this.gr);
        this.recycleGrid(this.gs);
        for (const m of this.men) {
            this.put(this.gm, CELL_M, m);
            this.put(this.gr, CELL_R, m);
            this.put(this.gs, CELL_S, m);
        }
    }

    /**
     * 软推挤：贴太近的两个人互相推开一点，谁也不完全重叠。
     * 敌我都推（战线才会顶住而不是穿过去）。每人最多看 6 个邻居，保证 O(n)。
     */
    /** 本兵占地半径（DE 真值，见 UNIT_RADIUS）；表里没有的落旧行为 SEP_DIST/2 */
    private radiusOf(key: string): number {
        return UNIT_RADIUS[key] ?? SEP_DIST / 2;
    }

    /**
     * 推挤质量 = 占地面积比（以 8px 半径的步兵为 1）。推力除以它 → **越占地方越推不动**。
     *
     * 🔴 [2026-08-26 主人：「主要是人物可以把战车平推开」] 改前 separate 是**双向等力**的：
     *    不管你是 8px 的步兵还是 20px 的战车，都按同一个 SEP_SPD=120 被推。
     *    而战车/攻城器械的占地是步兵的 **5~6 倍**（UNIT_RADIUS 实测：步兵 8 / 战车 20 /
     *    攻城锤 18），被步兵一顶就平移，观感上完全不成立。
     *    DE 的 collision size 就是占地，拿它当质量最贴。现在：
     *      步兵 mass 1.0 → 照旧被推 120px/s；战车 mass 6.2 → 只剩 19px/s；攻城锤 5.1 → 24px/s。
     *    反过来战车推步兵仍是全力 —— 质量差自然产生单向效果，不用特判。
     */
    private massOf(key: string): number {
        return Math.max(1, (this.radiusOf(key) / 8) ** 2);
    }

    /**
     * @param laneLeaders 本帧各分队锚点（step 里选好的，见「分队机制」那段）。
     *   🔴 [2026-10-03 主人选定「A：站定的归队队员推挤清零」] 归队后**已站定在自己槽位上**的队员，
     *   本帧不吃软推挤 —— 取其「站得笔直、纹丝不动」的画面效果（主人见过并认可）。
     *
     *   病灶（主人 2026-10-03 报「军团还是会微颤」）：站定的队员被邻居推走 → 锚点又把他拉回 →
     *   一推一拉就是那点微颤。**关键在"站定的人还吃不吃推挤"，不在"锚点选谁"** ——
     *   攻城战之所以完全不颤，正因为那里两条都关了：① 不归队（`siegeWithWalls` → laneSlotTarget 返回 null）
     *   ② 攻城战不走路队归队的槽位逻辑。
     *
     *   范围卡得很紧，绝不动交战中的人：只有「无目标（`!m.foe`）+ 归队满 LANE_REGROUP_SEC 秒 +
     *   已有本队锚点且不是自己 + 已站到槽位上（≤ LANE_TRACK_EPS）」四条同时成立才清零。
     *   交战中的人照旧互推（「弧形阵面就是这么长出来的」那条设计不动）；正在走向槽位的人照旧吃推。
     *   别人推不动他，但推得动自己 —— 人群照样能散开（推挤是各人算自己那一份）。
     */
    private separate(dt: number, laneLeaders: Map<number, WarMan>): void {
        const push = SEP_SPD * dt;
        const applySeparation = (m: WarMan): void => {
            if (m.st === 0) {
                const moveX = m.x - m.prevX, moveY = m.y - m.prevY;
                const moveLen = Math.hypot(moveX, moveY);
                if (moveLen > 1e-4) {
                    const ux = moveX / moveLen, uy = moveY / moveLen;
                    const along = m.sepX * ux + m.sepY * uy;
                    if (along < -moveLen) {
                        const correction = -moveLen - along;
                        m.sepX += ux * correction;
                        m.sepY += uy * correction;
                    }
                }
            }
            m.x += m.sepX;
            m.y += m.sepY;
        };
        for (const m of this.men) {
            if (m.hp <= 0) continue;
            // 🔴 [2026-10-11 主人报「还是拥挤在一排」] 列阵推进中的兵**不吃横向推挤**：
            //    推挤会把 6 列挤成 12 列、把纵深压掉（探针实测 hei_kuang_heavy 216×53 = 一排）。
            //    推进期他们本就按固定槽位走（够不着不追），推挤只会破坏方阵；接敌后（m.march=false）照常。
            if (m.march) { m.sepX = 0; m.sepY = 0; continue; }
            // 🔴 [2026-10-18 主人定] 城门未破时，城内九建筑出兵口刷出的第二波及后续守军原地待命（只原地攻击），不吃软推挤
            if (m.guardPost) {
                m.sepX = 0;
                m.sepY = 0;
                continue;
            }
            // 🔴 [2026-10-03 主人选定 A] 归队后已站定在槽位上的队员：同样清零推挤（理由见本函数头注）
            if (m.lane >= 0 && !m.hero && !m.foe) {
                const L = laneLeaders.get(m.lane);
                if (L === m && !this.marching && !m.siegeW && !this.remnantLanes.has(m.lane) && !this.laneTargets.has(m.lane)
                    && (m.tx - m.x) ** 2 + (m.ty - m.y) ** 2 <= ARRIVE_EPS * ARRIVE_EPS) {
                    m.sepX = 0;
                    m.sepY = 0;
                    continue;
                }
                if (L && L !== m && (m.noFoeSec ?? 0) >= LANE_REGROUP_SEC) {
                    const uFwd = this.advanceVec[m.f], uSide = this.sideVec[m.f], dDep = m.dep - L.dep, dSide = m.slotY - L.slotY;
                    const sx = L.x - uFwd.x * dDep + uSide.x * dSide;
                    const sy = L.y - uFwd.y * dDep + uSide.y * dSide;
                    if ((m.x - sx) ** 2 + (m.y - sy) ** 2 <= LANE_TRACK_EPS * LANE_TRACK_EPS) {
                        m.sepX = 0;
                        m.sepY = 0;
                        continue;
                    }
                }
            }
            const cx = (m.x / CELL_S) | 0, cy = (m.y / CELL_S) | 0;
            // 两个兵的最小间距 = 各自占地半径之和（DE 同款）。象兵/攻城器械因此真的占地方，
            // 挤不进去的兵沿接触面铺开 —— 弧形阵面就是这么长出来的。
            const rm = this.radiusOf(m.key);
            // 🔴 [2026-10-13 主人报「大军自动行进时左右或上下晃」/ 2026-10-18 修「行进过程中频繁改变朝向、颤抖」]
            //    已处于本队归队编队中的领队、队员与玩家不吃**本队队友**的推挤（同上面「站定队员清零」）：
            //    防止本队内部边走边推领队或槽位间距小于两倍半径时「推开→拉回槽位→朝向反转」每帧往复颤抖；别队与敌兵照常推，交战照旧。
            const laneFollow = m.lane >= 0 && !m.foe && !m.march && !this.heroOrderPending(m) && laneLeaders.has(m.lane)
                && (m.hero === true || m === laneLeaders.get(m.lane) || (m.noFoeSec ?? 0) >= LANE_REGROUP_SEC);
            let ox = 0, oy = 0, seen = 0, nearest2 = Infinity, minGap = SEP_DIST;
            // 🔴 [2026-10-14 修·推挤偏右下] 原为 `seen < 6` 截断：扫描从左上往右下，左/上的邻居先数满、右/下的常被漏掉
            //    ⇒ 推力系统性偏向右下，人群整体往画面右下飘。war_sim 实测（200 种子镜像局）：截断时偏袒跟位置走
            //    （远程 131:69、骑兵 60:140），去掉截断后 103:97、100:100（p > 0.28），用时不变。现在数满 3×3 格内全部重叠邻居。
            for (let gx = cx - 1; gx <= cx + 1; gx++) {
                for (let gy = cy - 1; gy <= cy + 1; gy++) {
                    const a = this.gs.get(HKEY(gx, gy));
                    if (!a) continue;
                    for (let i = 0; i < a.length; i++) {
                        const o = a[i];
                        if (o === m || o.hp <= 0) continue;
                        if (laneFollow && o.lane === m.lane) continue;
                        const dx = m.x - o.x, dy = m.y - o.y;
                        const dd = dx * dx + dy * dy;
                        const gap = rm + this.radiusOf(o.key);      // 这一对的最小间距
                        if (dd >= gap * gap) continue;
                        if (dd < nearest2) { nearest2 = dd; minGap = gap; }
                        seen++;
                        if (dd < 1e-4) { ox += (Math.random() - .5); oy += (Math.random() - .5); continue; }
                        const inv = 1 / Math.sqrt(dd);
                        ox += dx * inv; oy += dy * inv;
                    }
                }
            }
            // 邻居为空也要让平滑量衰减回 0，否则会带着上一次的推力继续滑
            if (!seen) {
                m.sepX += (0 - m.sepX) * SEP_SMOOTH;
                m.sepY += (0 - m.sepY) * SEP_SMOOTH;
                applySeparation(m);
                continue;
            }
            const l = Math.hypot(ox, oy) || 1;
            // 🔴 按**重叠深度**缩放推力：几乎不重叠时几乎不推。
            //    原来不管挤多深都按全速推，而邻居集合每帧都在变（只看 6 个），
            //    推的方向来回摆 → 人在原地微微发抖。
            const depth = Math.max(0, 1 - Math.sqrt(nearest2) / minGap);
            // 🔴 [2026-08-26 主人「挤来挤去就产生了平移，就不真实」] 交战中的兵推力减半。
            //    DE 里打架的单位是**站定**的，只有移动中的才绕行；我们原来所有人一律 120px/s
            //    （行军速度才 130），站着不动的兵每秒能被推走大半个身位 —— 那就是「平移」。
            //    实测（war_sim，SEED 7/11）：平移 12.4→9.3 px/人·秒、推力方向反转 13.2%→11.4%，
            //    用时 266→266s **持平**。
            //    ⚠️ 别再往下调：SEP_FIGHT=0.2 实测 SEED 7 直接打满 900s（推力太小散不开、打不到人）。
            const fightMul = m.st !== 0 ? SEP_FIGHT : 1;
            const mul = depth * fightMul / this.massOf(m.key);
            const vx = ox / l * push * mul, vy = oy / l * push * mul;
            m.sepX += (vx - m.sepX) * SEP_SMOOTH;
            m.sepY += (vy - m.sepY) * SEP_SMOOTH;
            applySeparation(m);
        }
    }

    /**
     * 索敌：以自身为中心**环形向外扩展**，返回半径内**最近**的敌人（精确最近邻）。
     *
     * 🔴 [2026-08-17 修「攻方白拿 10~15% 战力」] 旧实现是「gx 从 cx-span 递增扫，逮到就返回」，
     *    这让胜负取决于网格遍历方向而非战力：攻方在左、守方在右，攻方的兵先扫到的是离自己
     *    最近的敌人，守方的兵先扫到的却是离自己最远的。实测（war_sim，同兵种对镜）：
     *      · 旧实现          → 攻方 16 胜 0 负
     *      · 仅翻转扫描方向  → 守方 16 胜 0 负（完全镜像，证明根因就是遍历顺序）
     *      · 本实现（最近邻）→ 6 : 6，对称
     *    等效战力约 10~15%：给劣势方 1.15 倍八环加成、或多 10~20% 兵力即可翻盘。因为 13 是
     *    **裁决层**（onDecision → forceScene13Result 写死战果、跳过八环推演），这个偏袒直接
     *    决定真实胜负，不是观感问题。
     *
     *    改法依据帝国决定版：DE 的单位自动索敌一律选**最近**的敌人，克制关系由护甲与加成
     *    伤害实现（本作 dmgVs 已照搬 DE 数值：骑士 100/10/2/2、弓兵 30/4/0/0），不靠目标
     *    选择偏差去撑。实测三种索敌模式下「骑克弩」都成立，旧注释担心的「nearest 会把
     *    cav vs ranged 从 92% 打到 25%」在 08-13 数值定稿后已复现不出来。
     *
     *    环形 + 提前退出（当前最优已近于下一环的最小可能距离就停）在数学上等价于全翻找最近，
     *    war_sim 逐种子比对余兵完全一致，但通常只需展开 1~2 环，不必把 span²（远程 25）格翻完。
     *    ⚠️ 别改回「逮到就返回」，也别加「只看前 N 个」的截断——两者都会重新引入方向偏差
     *      （实测带 24 上限的最近邻仍偏袒攻方 9:3）。
     */
    /**
     * 找目标：环形最近邻；已经被 SPREAD_CAP 个人锁定的目标不再分配追击名额。
     *
     * 为什么是这个数：围殴加成 `1 + 0.15 × min(GANG_CAP, N-1)` 在 N=4 就封顶了，
     * **第 5 个人挤上去一点伤害都不加**，纯粹是白挤 —— 挤出来的就是主人反复报的
     * 「一堆兵冲着同一个点拥挤颤抖」。所以让第 5 个人去找次近的空闲目标，
     * 既散得开，又一分伤害不多不少（挤上去本来也没收益）。
     *
     * 找不到未满目标时返回 null，士兵继续按阵线目标移动并在下一轮索敌时重试。
     * 🔴 判据对双方完全对称，不引入方向偏袒 —— 那是 SEARCH_MODE「逮到就返回 / 只看前 N 个」
     *    的老毛病（曾让攻方白拿 10~15% 战力，见 2026-08-17 索敌修复）。
     *
     * 实测（war_sim，同兵种对镜）：横向铺开 30→36px（+20%）、攻击/移动状态切换 0.30→0.26 次/人·秒；
     * 克制三边方向不变、幅度差 1~7%；时长在噪声内。
     */
    /**
     * 🔴 [2026-09-11] 最小射程**只在分配新目标时**起作用（search 的 free / inRange 两级优先），
     *    绝不用来「丢锁 / 禁止出手 / 过滤范围伤」——2026-09-09 那版三处都判了盲区，结果是
     *    投石机被贴到 120px 内直接丢锁、`st=0` 站着不还手，而重搜与 aimAt 的 `best` 兜底
     *    照样返回那个贴脸的人，于是「呆站一帧 → 朝他走一帧」来回循环，成了活靶子。
     *    2026-08-17 定稿的原话就写在 search 头注里：「实在只剩贴脸的才打（总比呆站着强）」。
     *    贴脸时不出弹丸这件事另有出口（见下面出手处的 tooClose），伤害照结算，别再往回改。
     */
    private canKeepTarget(m: WarMan, sight: number): boolean {
        const target = m.foe;
        if (!target || target.f === m.f) return false;
        if ('sprite' in target && (target.sprite.destroyed || (!target.bld && target.sprite.obstructionDisabled))) return false;
        if ('sprite' in target && target.bld && (target.sprite.collapse || target.sprite.asset.includes('_RUBBLE'))) return false;
        if (m.guardPost) {
            return target.hp > 0
                && (target.x - m.x) ** 2 + (target.y - m.y) ** 2 < sight * sight
                && ('sprite' in target || !this.wallSeparates(m, target));
        }
        const wallKeep = 'sprite' in target && target.linked === true && !target.sprite.obstructionDisabled
            && this.battleType === 'siege' && m.f === 0;
        return (target.hp > 0 || wallKeep)
            && (target.x - m.x) ** 2 + (target.y - m.y) ** 2 < sight * sight * 1.44
            && ('sprite' in target || !this.wallSeparates(m, target));
    }

    private recentAttacker(m: WarMan, sight: number): WarMan | null {
        const attacker = m.hurtBy;
        // 只响应最近半秒内的实际受伤；旧记录不能长期牵引寻敌。
        if (!attacker || m.hurtAt === undefined || this.battleSec - m.hurtAt > 0.5
            || attacker.hp <= 0 || attacker.f === m.f) {
            m.hurtBy = null;
            m.hurtAt = undefined;
            return null;
        }
        // 贴脸的攻击者照样要回头反击（最小射程只管分配新目标，见 canKeepTarget 头注）。
        const distance2 = (attacker.x - m.x) ** 2 + (attacker.y - m.y) ** 2;
        if (m.guardPost) {
            return distance2 < sight * sight && !this.wallSeparates(m, attacker) ? attacker : null;
        }
        return distance2 < sight * sight * 1.44 && !this.wallSeparates(m, attacker) ? attacker : null;
    }

    /** 城墙还没有缺口（城墙/城门一处都没塌）。每帧算一次。 */
    private ringOpen(): boolean {
        if (this.ringOpenSec !== this.battleSec) {
            this.ringOpenSec = this.battleSec;
            this.ringOpenVal = this.wallGates.some(b => !this.wallStanding(b));
        }
        return this.ringOpenVal;
    }

    /** 🔴 [2026-10-18 主人令「第二波以后出门点还是9建筑，刷新后看城门是否被击毁，没有的话，原地待命，被击毁城门发起反攻」]
     *  守方城门是否已被摧毁（任一城门被毁即算破门；无城门时按城墙缺口或无墙判） */
    private isDefenderGateDestroyed(): boolean {
        if (this.wallGates.length === 0) return true;
        const gates = this.wallGates.filter(b => b.f === 1 && b.key === 'STONE_GATE');
        if (gates.length > 0) return gates.some(b => !this.wallStanding(b));
        return this.ringOpen();
    }

    /** 近战兵与目标隔着城墙（攻方城外/城内相隔，或守方在城内而敌在城外）⇒ 走不过去，先由 gateExit 出城门再锁敌追击 */
    private wallSeparates(m: WarMan, o: { x: number; y: number }): boolean {
        if (this.battleType !== 'siege' || !this.siegeWithWalls || m.hero || m.siegeW
            || WALL_PASS_TYPES.has(m.key) || this.statsFor(m.key, m.f).rng > 65) return false;
        this.ensureGateInfo();
        if (m.f === 1) return this.insideRing(m.x, m.y) && !this.insideRing(o.x, o.y);
        if (this.ringOpen()) return false;
        return this.insideRing(m.x, m.y) !== this.insideRing(o.x, o.y);
    }

    private reserveExistingTargets(deploying: boolean): void {
        for (const target of this.men) target.claims = 0;
        for (const target of this.wallGates) target.claims = 0;
        for (const target of this.defBuildings) target.claims = 0;
        for (const m of this.men) {
            m.reservedFoe = null;
            if (deploying || m.hp <= 0) continue;
            if (this.canKeepTarget(m, this.statsFor(m.key, m.f).sight ?? 160)) {
                m.reservedFoe = m.foe;
                m.foe!.claims++;
            }
        }
    }

    private releaseReservedTarget(m: WarMan): void {
        if (m.reservedFoe) {
            m.reservedFoe.claims--;
            m.reservedFoe = null;
        }
    }

    private waitAtRangeEdge(m: WarMan, inBand: boolean, dt: number): boolean {
        m.rangeWait = inBand ? (m.rangeWait ?? 0) + dt : 0;
        // 保留短暂防抖；最多等待一个索敌周期，之后沿原追击流程接敌。
        return inBand && m.rangeWait <= 0.2;
    }

    /** 🔴 [2026-10-12 主人令「只有在城墙挡路的时候攻击城墙，打完就不要再打了」]
     *  正挡着本兵的墙段：最近 1.5 秒内被它推开过（或正在打它），且它还立着；否则 null。 */
    private blockedWall(m: Partial<WarMan>): WarBuilding | null {
        const b = m.blockedBy;
        if (!b || b.hp <= 0 || b.sprite.destroyed || b.sprite.obstructionDisabled) return null;
        if (m.foe === b || this.battleSec - (m.blockedAt ?? -99) < 1.5) return b;
        return null;
    }

    /** 攻城武器的目标：尚未打下任何城门时只取还立着的城门（优先打离自己近的城门）；打下一座城门后，周围的城墙、建筑和其他城门一档并列，由调用方取离自己最近的那个。
     *  🔴 [2026-10-15 主人令「有坍塌动画的都是建筑」] 营寨也进了 `defBuildings` ⇒ 这里**必须按阵营过滤**，
     *    否则攻方的攻城武器会把自己营寨当成第一档目标去砸。 */
    private siegeFirstTier(attackerF: 0 | 1 = 0): WarBuilding[] {
        const bldOk = (b: WarBuilding): boolean => b.hp > 0 && !b.sprite.destroyed && !b.sprite.collapse && !b.sprite.asset.includes('_RUBBLE');
        const enemy = (b: WarBuilding): boolean => b.f !== attackerF;
        // 🔴 [2026-10-15 主人令「攻城武器优先攻击离自己近的城门，当打下一个城门后，就攻击周围的城墙和建筑和其他城门，这些并列。」]
        const gates = this.wallGates.filter(b => b.key === 'STONE_GATE' && enemy(b));
        const anyGateDown = gates.some(b => !bldOk(b) || b.sprite.obstructionDisabled);
        if (!anyGateDown) {
            const standingGates = gates.filter(b => bldOk(b) && !b.sprite.obstructionDisabled);
            if (standingGates.length > 0) return standingGates;
        }
        return [
            ...this.wallGates.filter(b => bldOk(b) && !b.sprite.obstructionDisabled && enemy(b)),
            ...this.defBuildings.filter(b => bldOk(b) && enemy(b)),
        ];
    }

    /**
     * 🔴 [2026-10-15 主人令「让每一队有一个统一的攻击目标」「把每个受到攻击的目标只限制最多被4队攻击，其他的可以去攻击其他目标，实在没有目标打，可以原地待命」]
     * 每帧维护每支分队（50 人）唯一的「队级攻击目标（Lane Target）」：
     *   1. 每个目标（敌方分队 targetLane 或守城建筑/城门 targetBld）最多只允许 MAX_LANE_ATTACKERS = 4 支分队同时锁定攻击；
     *   2. 超出 4 队的分队自动分流去攻击其他未满 4 队的目标；若所有可打目标均已满 4 队，则不分配目标（整队原地待命警戒）；
     *   3. 攻城战第二波起守军在九建筑出兵口刷新，城门被摧毁前原地待命，城门被摧毁后集体发动反攻。
     */
    private isInsideAttackerCamp(x: number, y: number): boolean {
        if (this.battleType !== 'siege') return false;
        const cityCen = this.deCity ? this.deCityCenter : this.spawnBases[1];
        const attBase = this.spawnBases[0];
        const campDist = Math.hypot(attBase.x - cityCen.x, attBase.y - cityCen.y);
        if (campDist < 900) return false;
        return Math.hypot(x - attBase.x, y - attBase.y) < 580
            && Math.hypot(x - cityCen.x, y - cityCen.y) > campDist * 0.55;
    }

    private defenderCityReturnGoal(m: WarMan): { x: number; y: number } {
        if (m.guardPost) return m.guardPost;
        const sp = m.lane >= 0 ? this.spawns[m.lane] : undefined;
        if (sp) return { x: sp.x, y: sp.y };
        return this.deCity ? this.deCityCenter : this.spawnBases[1];
    }

    private updateLaneTargets(): void {
        const MAX_LANE_ATTACKERS = 4;
        const laneInfo = new Map<number, { f: number; x: number; y: number; n: number; inside: number; meleeOnly: boolean; guard: boolean }>();
        if (this.battleType === 'siege' && this.siegeWithWalls) this.ensureGateInfo();
        for (const m of this.men) {
            // 排除乱入者本人（m.hero）计入 50 人分队重心，防全队阵亡后仅剩乱入者在攻方营地复活时把守方大军引去蹲守营地
            if (m.hp <= 0 || m.lane < 0 || m.siegeW || m.hero) continue;
            const inR = (this.battleType === 'siege' && this.siegeWithWalls && this.insideRing(m.x, m.y)) ? 1 : 0;
            const isMelee = !WALL_PASS_TYPES.has(m.key) && this.statsFor(m.key, m.f).rng <= 65;
            const isGuard = !!m.guardPost;
            const cur = laneInfo.get(m.lane);
            if (!cur) {
                laneInfo.set(m.lane, { f: m.f, x: m.x, y: m.y, n: 1, inside: inR, meleeOnly: isMelee, guard: isGuard });
            } else if (cur.guard && !isGuard) {
                // 本队尚有第一波城外作战守军存活时，分队目标只按城外第一波守军算，不被城内补出的第二波 guardPost 守军污染
                cur.x = m.x;
                cur.y = m.y;
                cur.n = 1;
                cur.inside = inR;
                cur.meleeOnly = isMelee;
                cur.guard = false;
            } else if (!cur.guard && isGuard) {
                continue;
            } else {
                cur.x += m.x;
                cur.y += m.y;
                cur.n++;
                cur.inside += inR;
                if (!isMelee) cur.meleeOnly = false;
            }
        }
        for (const info of laneInfo.values()) {
            info.x /= info.n;
            info.y /= info.n;
        }
        for (const lane of [...this.laneTargets.keys()]) {
            if (!laneInfo.has(lane)) this.laneTargets.delete(lane);
        }

        const cityCen = this.deCity ? this.deCityCenter : this.spawnBases[1];
        const canReachLane = (info: { f: number; x: number; y: number; inside: number; n: number; meleeOnly: boolean; guard: boolean }, eInfo: { x: number; y: number; inside: number; n: number }): boolean => {
            if (this.battleType === 'siege') {
                // 攻城战守方绝不远征打进攻方营地，只迎击已离开营地逼近城池之敌
                if (info.f === 1 && this.isInsideAttackerCamp(eInfo.x, eInfo.y)) return false;
                // 城门被摧毁前，城门刷新的守军原地守门；城门被摧毁后 guard 已清除，集体发动反攻
                if (info.f === 1 && info.guard) return false;
                if (this.siegeWithWalls) {
                    if (info.f === 0 && !this.ringOpen() && info.meleeOnly && info.inside === 0 && eInfo.inside === eInfo.n) return false;
                }
            }
            if (info.guard && (eInfo.x - info.x) ** 2 + (eInfo.y - info.y) ** 2 > 420 * 420) return false;
            return true;
        };

        const laneClaims = new Map<number, number>();
        const bldClaims = new Map<WarBuilding, number>();

        // 第一遍：按离当前目标由近到远校验并保留各队已有的目标（离目标最近的 4 队优先占住名额，第 5 队起释放改打其他目标）
        const existingEntries = [...laneInfo.entries()].filter(([lane]) => this.laneTargets.has(lane)).sort(([laneA, infoA], [laneB, infoB]) => {
            const pA = this.laneTargets.get(laneA)!, pB = this.laneTargets.get(laneB)!;
            const dA = (pA.x - infoA.x) ** 2 + (pA.y - infoA.y) ** 2;
            const dB = (pB.x - infoB.x) ** 2 + (pB.y - infoB.y) ** 2;
            return dA - dB;
        });
        for (const [lane, info] of existingEntries) {
            const prev = this.laneTargets.get(lane);
            if (!prev) continue;
            if (prev.targetLane !== undefined) {
                const eInfo = laneInfo.get(prev.targetLane);
                if (!eInfo || eInfo.f === info.f || !canReachLane(info, eInfo) || (laneClaims.get(prev.targetLane) ?? 0) >= MAX_LANE_ATTACKERS) {
                    this.laneTargets.delete(lane);
                    continue;
                }
                const prevD2 = (eInfo.x - info.x) ** 2 + (eInfo.y - info.y) ** 2;
                const prevCityD = (this.battleType === 'siege' && info.f === 1) ? Math.hypot(eInfo.x - cityCen.x, eInfo.y - cityCen.y) : 0;
                let interceptLane = prev.targetLane, interceptInfo = eInfo, bestD2 = prevD2, bestCityD = prevCityD;
                // 1) 若原目标在远处（>300px），而另一支未满 4 队的敌队已逼近本队（<300px），整队就地迎击防错开；
                // 2) 攻城战守方：若已有其他敌队杀到离城池明显更近处（比当前目标近 320px 以上），立即回师救城，绝不舍近求远追往城外。
                if (prevD2 > 300 * 300 || (this.battleType === 'siege' && info.f === 1 && prevCityD > 420)) {
                    for (const [oLane, oInfo] of laneInfo) {
                        if (oInfo.f === info.f || !canReachLane(info, oInfo) || (laneClaims.get(oLane) ?? 0) >= MAX_LANE_ATTACKERS) continue;
                        const d2 = (oInfo.x - info.x) ** 2 + (oInfo.y - info.y) ** 2;
                        const oCityD = (this.battleType === 'siege' && info.f === 1) ? Math.hypot(oInfo.x - cityCen.x, oInfo.y - cityCen.y) : 0;
                        const nearIntercept = prevD2 > 300 * 300 && d2 < 300 * 300 && d2 + 100 * 100 < bestD2;
                        const cityThreat = this.battleType === 'siege' && info.f === 1 && oCityD + 320 < bestCityD;
                        if (nearIntercept || cityThreat) {
                            bestD2 = d2;
                            bestCityD = oCityD;
                            interceptLane = oLane;
                            interceptInfo = oInfo;
                        }
                    }
                }
                prev.targetLane = interceptLane;
                prev.x = interceptInfo.x;
                prev.y = interceptInfo.y;
                laneClaims.set(interceptLane, (laneClaims.get(interceptLane) ?? 0) + 1);
            } else if (prev.targetBld !== undefined) {
                const gatesOnly = this.battleType === 'siege' && this.siegeWithWalls && !this.ringOpen() && info.inside === 0;
                // 士兵优先打兵：若场上仍有城外第一波守军或 340px 内出现可触及且未满 4 队的敌方分队，整队立即转火该敌队
                let nearELane: number | undefined, nearED2 = Infinity;
                for (const [eLane, eInfo] of laneInfo) {
                    if (eInfo.f === info.f || !canReachLane(info, eInfo) || (laneClaims.get(eLane) ?? 0) >= MAX_LANE_ATTACKERS) continue;
                    const d2 = (eInfo.x - info.x) ** 2 + (eInfo.y - info.y) ** 2;
                    const isOutsideWave1 = !eInfo.guard && eInfo.inside < eInfo.n;
                    if ((isOutsideWave1 || d2 < 340 * 340) && d2 < nearED2) { nearED2 = d2; nearELane = eLane; }
                }
                if (nearELane !== undefined) {
                    const eInfo = laneInfo.get(nearELane)!;
                    this.laneTargets.set(lane, { targetLane: nearELane, x: eInfo.x, y: eInfo.y });
                    laneClaims.set(nearELane, (laneClaims.get(nearELane) ?? 0) + 1);
                } else if (!this.wallStanding(prev.targetBld) || (gatesOnly && prev.targetBld.key !== 'STONE_GATE') || (bldClaims.get(prev.targetBld) ?? 0) >= MAX_LANE_ATTACKERS) {
                    this.laneTargets.delete(lane);
                } else {
                    prev.x = prev.targetBld.x;
                    prev.y = prev.targetBld.y;
                    bldClaims.set(prev.targetBld, (bldClaims.get(prev.targetBld) ?? 0) + 1);
                }
            }
        }

        // 第二遍：为尚无目标的分队分配未满 4 队的新目标；若所有可打目标均已满 4 队，则不设目标（原地待命，守方远在城外时回城寻敌）
        if (this.battleType === 'siege' && this.centerBld === undefined) this.centerBld = this.pickCenterBuilding();
        for (const [lane, info] of laneInfo) {
            if (this.laneTargets.has(lane)) continue;
            const uF = this.advanceVec[info.f], uS = this.sideVec[info.f];
            let bestELane: number | undefined, bestEScore = Infinity, bestERawDist = Infinity;
            let fallbackCityELane: number | undefined, fallbackCityDist = Infinity, fallbackRawDist = Infinity;
            for (const [eLane, eInfo] of laneInfo) {
                if (eInfo.f === info.f || !canReachLane(info, eInfo)) continue;
                const dx = eInfo.x - info.x, dy = eInfo.y - info.y;
                const rawDist = Math.hypot(dx, dy);
                if (this.battleType === 'siege' && info.f === 0 && eInfo.guard && rawDist > 520) continue;
                const cityDist = (this.battleType === 'siege' && info.f === 1) ? Math.hypot(eInfo.x - cityCen.x, eInfo.y - cityCen.y) : 0;
                if (this.battleType === 'siege' && info.f === 1 && cityDist < fallbackCityDist) {
                    fallbackCityDist = cityDist;
                    fallbackCityELane = eLane;
                    fallbackRawDist = rawDist;
                }
                const claims = laneClaims.get(eLane) ?? 0;
                if (claims >= MAX_LANE_ATTACKERS) continue;
                const fwd = dx * uF.x + dy * uF.y, side = dx * uS.x + dy * uS.y;
                // 横向偏移加权 1.35 + 已分配队数分流惩罚，使左中右各队自然对位敌方左中右各队，不扎堆抢同一队
                const weightedDist = Math.hypot(fwd, side * 1.35);
                const loadPenalty = rawDist < 260 ? claims * 110 : claims * 150;
                const outsideBonus = (this.battleType === 'siege' && info.f === 0 && !eInfo.guard && eInfo.inside < eInfo.n) ? -350 : 0;
                const score = (this.battleType === 'siege' && info.f === 1)
                    ? weightedDist * 0.65 + cityDist * 0.75 + loadPenalty
                    : weightedDist + loadPenalty + outsideBonus;
                if (score < bestEScore) {
                    bestEScore = score;
                    bestELane = eLane;
                    bestERawDist = rawDist;
                }
            }

            if (this.battleType === 'siege' && info.f === 0) {
                const bestEInfo = bestELane !== undefined ? laneInfo.get(bestELane) : undefined;
                if (bestELane !== undefined && bestEInfo && (bestERawDist <= 520 || (!bestEInfo.guard && bestEInfo.inside < bestEInfo.n))) {
                    this.laneTargets.set(lane, { targetLane: bestELane, x: bestEInfo.x, y: bestEInfo.y });
                    laneClaims.set(bestELane, (laneClaims.get(bestELane) ?? 0) + 1);
                    continue;
                }
                const gatesOnly = this.siegeWithWalls && !this.ringOpen() && info.inside === 0;
                const gates = this.wallGates.filter(b => b.key === 'STONE_GATE');
                const pool = gatesOnly ? gates : [...this.defBuildings, ...gates];
                let bestBld: WarBuilding | undefined, bestBldScore = Infinity;
                for (const b of pool) {
                    if (b.f === info.f || !this.wallStanding(b)) continue;
                    const bClaims = bldClaims.get(b) ?? 0;
                    if (bClaims >= MAX_LANE_ATTACKERS) continue;
                    const d = Math.hypot(b.x - info.x, b.y - info.y);
                    const pen = bClaims * 140;
                    if (d + pen < bestBldScore) {
                        bestBldScore = d + pen;
                        bestBld = b;
                    }
                }
                if (bestBld) {
                    this.laneTargets.set(lane, { targetBld: bestBld, x: bestBld.x, y: bestBld.y });
                    bldClaims.set(bestBld, (bldClaims.get(bestBld) ?? 0) + 1);
                    continue;
                }
            }

            if (bestELane !== undefined) {
                const eInfo = laneInfo.get(bestELane)!;
                this.laneTargets.set(lane, { targetLane: bestELane, x: eInfo.x, y: eInfo.y });
                laneClaims.set(bestELane, (laneClaims.get(bestELane) ?? 0) + 1);
            } else if (this.battleType === 'siege' && info.f === 1 && fallbackCityELane !== undefined && fallbackRawDist > 280) {
                // 攻城战守方：若场上敌队均已满 4 队围攻而本队错开落在远处（>280px），仍向离城最近的敌队靠拢回城寻敌，不在外场发呆
                const eInfo = laneInfo.get(fallbackCityELane)!;
                this.laneTargets.set(lane, { targetLane: fallbackCityELane, x: eInfo.x, y: eInfo.y });
            }
        }
    }

    private search(m: { x: number; y: number; f: number }, radius: number, minRange = 0, reserve = true): WarMan | WarBuilding | null {
        const useR = radius > CELL_M;
        const map: Map<number, WarMan[]> = useR ? this.gr : this.gm; const cell = useR ? CELL_R : CELL_M;
        const span = Math.max(1, Math.ceil(radius / cell));
        const cx = (m.x / cell) | 0, cy = (m.y / cell) | 0;
        const r2 = radius * radius;
        let best: WarMan | WarBuilding | null = null, bd = r2;      // 最近敌人，最后兜底
        let inRange: WarMan | null = null, rd = r2;                // 满员时仍优先选最小射程以外的敌人
        let free: WarMan | WarBuilding | null = null, fd = r2;      // 最近的未满且满足最小射程目标
        // 🔴 [2026-10-15 主人令「让每一队有一个统一的攻击目标」] 优先在本队锁定的目标敌队（prefLane）或贴脸自卫（<65px）范围内分配对手
        const wm = m as Partial<WarMan>;
        const lt = (typeof wm.lane === 'number' && wm.lane >= 0 && !(m as { siegeW?: boolean }).siegeW)
            ? this.laneTargets.get(wm.lane) : undefined;
        const prefLane = lt?.targetLane;
        const guardPost = wm.guardPost;
        const guardLeash2 = guardPost ? radius * radius : Infinity;
        let pBest: WarMan | null = null, pBd = r2;
        let pInRange: WarMan | null = null, pRd = r2;
        let pFree: WarMan | null = null, pFd = r2;
        // 🔴 [2026-08-17] 投石车/投石机有最小射程：贴太近就抛不出去（DE 同款）。
        //    原来只在**放弹丸**那一步判 tooClose，结果贴脸时「照样扣血、就是不出石弹」——
        //    主人实锤「看不到投石兵的石弹」。改成索敌时就避开太近的目标：
        //    优先挑够得着又打得出的，实在只剩贴脸的才打（总比呆站着强）。
        const minR2 = minRange * minRange;
        // 🔴 [2026-10-12 主人报「守方寻敌不知道走城门还是直接找敌人」] 城墙还挡路时，城内的守方近战兵不锁定城外的敌人
        //    （隔着墙够不着，锁了只会顶墙）；他们由 aimAt → gateExit 先走城门出去，出城后再正常索敌。远程照常隔墙射。
        const inOnly = (radius <= 1000 || !!guardPost) && m.f === 1 && this.battleType === 'siege' && this.siegeWithWalls 
            && !!wm.key && !WALL_PASS_TYPES.has(wm.key) && this.statsFor(wm.key, 1).rng <= 65 && (this.ensureGateInfo(), this.insideRing(m.x, m.y));
        // 🔴 [2026-10-12 主人报「士兵挤在墙边也不打城墙」] 攻方近战兵：城外、墙还封着没路进城时，城里的敌兵够不着 ⇒ 不锁定他们，
        //    于是落到下面的城墙兜底（先兵、墙最后，但「兵」够不着就不算兵）。有缺口（flowOpen）则正常追兵。
        const outOnly = m.f === 0 && this.battleType === 'siege' && this.siegeWithWalls && !!wm.key
            && !(m as { siegeW?: boolean }).siegeW && this.statsFor(wm.key, 0).rng <= 65
            && (this.ensureGateInfo(), !this.insideRing(m.x, m.y)) && !this.ringOpen();
        if (span >= 6) {
            for (let i = 0; i < this.men.length; i++) {
                const o = this.men[i];
                if (o.f === m.f || o.hp <= 0) continue;
                const d = (o.x - m.x) ** 2 + (o.y - m.y) ** 2;
                if (d >= r2) continue;
                if (guardPost && (o.x - guardPost.x) ** 2 + (o.y - guardPost.y) ** 2 > guardLeash2) continue;
                if (inOnly && !this.insideRing(o.x, o.y)) continue;
                if (outOnly && this.insideRing(o.x, o.y)) continue;
                const tooNear = minR2 > 0 && d < minR2;
                if (d < bd) { bd = d; best = o; }
                if (!tooNear && d < rd) { rd = d; inRange = o; }
                if (prefLane !== undefined && (o.lane === prefLane || d < 65 * 65)) {
                    if (d < pBd) { pBd = d; pBest = o; }
                    if (!tooNear && d < pRd) { pRd = d; pInRange = o; }
                    if (o.claims < SPREAD_CAP && !tooNear && d < pFd) { pFd = d; pFree = o; }
                }
                if (o.claims >= SPREAD_CAP) continue;
                if (!tooNear && d < fd) { fd = d; free = o; }
            }
        } else {
            for (let ring = 0; ring <= span; ring++) {
                // 只有找到未满且满足最小射程的目标才能提前结束；若指定了 prefLane 则须等 pFree 找到才可提前结束。
                if (prefLane !== undefined ? pFree : free) {
                    const floor = (ring - 1) * cell;
                    if (floor > 0 && (prefLane !== undefined ? pFd : fd) < floor * floor) break;
                }
                for (let gx = cx - ring; gx <= cx + ring; gx++) {
                    const isEdgeX = gx === cx - ring || gx === cx + ring;
                    const gyStep = (ring > 0 && !isEdgeX) ? ring * 2 : 1;
                    for (let gy = cy - ring; gy <= cy + ring; gy += gyStep) {
                        const a = map.get(HKEY(gx, gy));
                        if (!a) continue;
                        for (let i = 0; i < a.length; i++) {
                            const o = a[i];
                            if (o.f === m.f || o.hp <= 0) continue;
                            const d = (o.x - m.x) ** 2 + (o.y - m.y) ** 2;
                            if (d >= r2) continue;
                            if (guardPost && (o.x - guardPost.x) ** 2 + (o.y - guardPost.y) ** 2 > guardLeash2) continue;
                            if (inOnly && !this.insideRing(o.x, o.y)) continue;
                            if (outOnly && this.insideRing(o.x, o.y)) continue;
                            const tooNear = minR2 > 0 && d < minR2;
                            // 视野内最近敌人永远保留作兜底：巡逻只用于找漏敌，不能因目标已被 4 人锁定
                            // 就把眼前敌人当作不存在。未满目标仍走 free，全部满员时才回退 best。
                            if (d < bd) { bd = d; best = o; }
                            if (!tooNear && d < rd) { rd = d; inRange = o; }
                            if (prefLane !== undefined && (o.lane === prefLane || d < 65 * 65)) {
                                if (d < pBd) { pBd = d; pBest = o; }
                                if (!tooNear && d < pRd) { pRd = d; pInRange = o; }
                                if (o.claims < SPREAD_CAP && !tooNear && d < pFd) { pFd = d; pFree = o; }
                            }
                            if (o.claims >= SPREAD_CAP) continue;
                            if (!tooNear && d < fd) { fd = d; free = o; }
                        }
                    }
                }
            }
        }
        const isHero = (m as { hero?: boolean }).hero === true;
        const manChosen = (pFree ?? pInRange ?? pBest) ?? (free ?? inRange ?? best);
        // 🔴 [2026-10-13 主人令「攻城武器优先攻击离自己近的城门，城墙」]
        // 🔴 [2026-10-15 主人令「在进攻的途中，攻城武器不打人，直接往敌军中冲，这样不现实」]
        //    1) 若最近的目标城门/城墙/建筑已进入攻城武器自身射程（reach2）⇒ 优先锁定并摧毁该建筑；
        //    2) 若目标建筑尚在射程外（正在进攻行军途中）：
        //       · 远程攻城武器（投石车/弩炮/手推炮/火箭车，rng > 65）：视野内一旦出现阻拦敌军（manChosen），立即停步在安全射程外轰击敌军，绝不盲目冲入敌阵！
        //       · 近战攻城武器（冲车/攻城象，rng <= 65）：若正前方近身（reach + 18px 内）有敌兵阻拦，先撞击开路；否则继续朝城门/建筑推进。
        if (this.battleType === 'siege' && m.f === 0 && (m as { siegeW?: boolean }).siegeW) {
            const mKey = (m as { key?: string }).key ?? '';
            const st = this.statsFor(mKey, m.f as 0 | 1);
            const rng = st.rng ?? 0;
            const reach = Math.max(rng, 65) + this.radiusOf(mKey);
            const reach2 = reach * reach;
            const tier = this.siegeFirstTier(m.f as 0 | 1);
            if (tier.length > 0) {
                let pick: WarBuilding | null = null, pd = Infinity, far: WarBuilding | null = null, fard = Infinity;
                for (const b of tier) {
                    const d = (b.x - m.x) ** 2 + (b.y - m.y) ** 2;
                    const s = Math.sqrt(d);
                    if (s < fard) { fard = s; far = b; }
                    if (minR2 > 0 && d < minR2) continue;
                    if (s < pd) { pd = s; pick = b; }
                }
                const t = pick ?? far;
                const td2 = t ? (t.x - m.x) ** 2 + (t.y - m.y) ** 2 : Infinity;
                // 城门/城墙/建筑已在射程内 ⇒ 直接锁定攻城目标
                if (t && td2 <= reach2) {
                    if (reserve) t.claims++;
                    return t;
                }
                // 进攻途中（建筑尚在射程外）：远程攻城器遇敌兵即停步远射；近战冲车被敌兵贴脸阻拦时撞击开路
                if (manChosen) {
                    const md2 = (manChosen.x - m.x) ** 2 + (manChosen.y - m.y) ** 2;
                    if (rng > 65 ? (minR2 === 0 || md2 >= minR2) : (md2 <= (reach + 18) ** 2)) {
                        if (reserve) manChosen.claims++;
                        return manChosen;
                    }
                }
                if (t && td2 < r2) { if (reserve) t.claims++; return t; }
                return null;
            }
        }
        // 🔴 [2026-10-14 主人定「士兵攻击顺序：士兵，城门，建筑包括箭塔」「所有都是只打近的」「士兵只认城门，不砍墙」]
        //    攻方士兵（含乱入者）：视野内走得到的兵 → 城墙完整且人在城外时打最近的城门 → 否则打最近的建筑（含箭塔）。城墙一律不砍。
        if (this.battleType === 'siege' && m.f === 0) {
            if (manChosen) { if (reserve) manChosen.claims++; return manChosen; }
            this.ensureGateInfo();
            const gatesOnly = this.siegeWithWalls && !this.ringOpen() && !this.insideRing(m.x, m.y);
            // 🔴 [2026-10-15 主人报「攻方打破城门后，不往里面走」] 被还立着的城门挡住（险要内圈门：流场按门可通行把人带到门前）⇒ 打这座门
            const bg = this.siegeWithWalls ? this.blockedWall(m as Partial<WarMan>) : null;
            if (bg && bg.key === 'STONE_GATE' && bg.f !== m.f) { if (reserve) bg.claims++; return bg; }
            // 🔴 [2026-10-15 主人令「让每一队有一个统一的攻击目标」] 若本队已统一锁定某座城门/建筑 targetBld，全队 50 人集火该建筑，不各自散去打旁边的楼
            if (lt?.targetBld && this.wallStanding(lt.targetBld) && (!gatesOnly || lt.targetBld.key === 'STONE_GATE')) {
                const dBld = (lt.targetBld.x - m.x) ** 2 + (lt.targetBld.y - m.y) ** 2;
                if (dBld < r2) {
                    if (reserve) lt.targetBld.claims++;
                    return lt.targetBld;
                }
            }
            // 🔴 [2026-10-15 主人令「士兵在攻打建筑的时候，优先攻打最近的建筑，不至于都拥挤在一起」]
            //    撤掉 10-14「墙破后只认中心建筑」：墙已破（或人已在城内）⇒ 打视野内最近的建筑（中心建筑也在其中）；
            //    视野内没有建筑就返回 null，由 aimAtRaw 朝中心建筑走（流场绕缺口），路上见到建筑就近打。
            // 🔴 [2026-10-15 主人令「城门可以和建筑一个级别。就近打」] 墙已破（或人在城内）时城门与建筑同档、谁近打谁
            //    （原只认建筑：破口在别处时，贴着另一座城门的兵视野里没有建筑 ⇒ 锁不上目标、贴门干站）。城墙仍不砍。
            const gates = this.wallGates.filter(b => b.key === 'STONE_GATE');
            const pool = gatesOnly ? gates : [...this.defBuildings, ...gates];
            let t: WarBuilding | null = null, td = r2;
            for (const b of pool) {
                if (b.f === m.f || !this.wallStanding(b)) continue;
                const d = (b.x - m.x) ** 2 + (b.y - m.y) ** 2;
                if (d < td) { td = d; t = b; }
            }
            // 🔴 [2026-10-15 主人令「优先士兵打兵，其次城门建筑，但是现在兵到了墙根后，也不打墙，也过不去」]
            //    最后一档：视野内兵、城门、建筑都没有，又正被一段墙挡着（blockedWall：1.5 秒内被它推开过、它还立着）⇒ 砍这一段墙。
            //    只砍挡着自己的那段；打穿（hp≤0）即解除碰撞，blockedWall 不再返回它，不会接着砍。
            if (!t) {
                const bw = this.blockedWall(m as Partial<WarMan>);
                if (bw && bw.f !== m.f) t = bw;
            }
            if (t && reserve) t.claims++;
            return t;
        }
        for (const b of this.wallGates) {
            if (isHero) break;   // [2026-09-05 玩家] 玩家不锁墙
            if (manChosen) break;   // 🔴 [2026-10-12] 士兵优先打兵
            // 🔴 [2026-10-12 主人令「优先攻击其他，最后考虑城墙」] 攻方士兵：视野内没敌兵、又没有进城的路时才打墙
            if (this.battleType === 'siege' && m.f === 0 && b !== this.blockedWall(m as Partial<WarMan>)) continue;   // 只打正挡着自己的那段墙
            // 🔴 [2026-08-23] 墙已坍塌 → 不再锁定（兜底循环同样跳过，防全塌）
            if (b.f === m.f || b.hp <= 0 || b.sprite.destroyed || b.sprite.obstructionDisabled) continue;
            const d = (b.x - m.x) ** 2 + (b.y - m.y) ** 2;
            if (d >= r2) continue;
            const tooNear = minR2 > 0 && d < minR2;
            if (b.claims >= SPREAD_CAP && !(m.f === 0 && this.battleType === 'siege')) continue;   // 攻方打墙不封顶（墙靠推挤沿线铺开）
            if (d < bd) { bd = d; best = b; }
            if (!tooNear && d < fd) { fd = d; free = b; }
        }
        const chosen = (pFree ?? pInRange ?? pBest) ?? (free ?? inRange ?? best);
        if (chosen && reserve) chosen.claims++;
        return chosen;
    }

    /**
     * 🔴 [2026-10-11 主人令「所有建筑改为贴图。确保士兵通行」] 开战 30 秒这一下：
     *    把**非墙装饰**（树/石/摆设/建筑贴图）全部去碰撞 —— 全场可通行，士兵不再被景物卡住。
     *    ⚠️ 不碰墙/门/垛/栅栏（墙另有「受伤自动坍塌」与「血归零即塌」两条，见下）。
     */
    private clearNonWallObstructions(): void {
        this.lastCollapseAt = performance.now();
        const wallSprites = new Set<DecorSprite>();
        for (const b of this.wallGates) { wallSprites.add(b.sprite); if (b.extraSprites) for (const sp of b.extraSprites) wallSprites.add(sp); }
        for (const sp of this.decorSprites) {
            if (wallSprites.has(sp)) continue;
            if (!sp.obstruction && sp.obstructionDisabled) continue;
            sp.obstruction = undefined;
            sp.obstructionDisabled = true;
        }
    }

    /** 墙/门/垛段是否还立着（`_DAMAGED` 也算立着；_RUBBLE/已销毁/正在倒塌 = 不立） */
    private wallStanding(b: WarBuilding): boolean {
        if (b.bld) return b.hp > 0 && !b.sprite.destroyed && !b.sprite.collapse && !b.sprite.asset.includes('_RUBBLE');
        return !b.sprite.destroyed && !b.sprite.obstructionDisabled && !b.sprite.collapse && !b.sprite.asset.includes('_RUBBLE');
    }

    /**
     * 🔴 [2026-10-15 主人令「把受伤的城墙自动坍塌逻辑加回来。只有不是满血的城墙才能自动坍塌」]
     * （前身：2026-10-12「10秒坍塌一个，靠近敌方或受到攻击的先塌」＋2026-10-14「只有受到攻击的城墙才能坍塌」）
     *
     * 每 10 秒自动塌一处**伤口**（`collapseNextWallGap` 由 step 每 10 秒调一次）：
     *   · 只在城墙/城门/城垛/栅栏（= `wallGates`）里挑，**满血的一律跳过**（`hp >= maxHp` 不塌）；
     *   · 候选中挑**最早挨打**的那一处（`hitAt` 最小），所以"靠近敌方 / 正在被打"的那段先塌；
     *   · 一处都挑不到（全场墙都满血）⇒ 返回 true，10 秒后再看一次；
     *   · 墙已全部塌完 / 没有墙 ⇒ 返回 false，停止轮询（`nextWallGapSec = 1e9`）；
     *   · 城内建筑、箭塔、营寨**不参与**自动坍塌（它们只能被打到 0 血后倒塌，见 `onDefBuildingHit`）。
     */
    /**
     * 🔴 [2026-10-16 主人令「城墙，栅栏这些不需要完全摧毁，可以75%就可以通行，有的50%就剋，有点25%就可以，有点0%，这样城墙被摧毁的样子就多样化。更加真实……但是城门要摧毁」]
     * 单格城墙/垛墙/栅栏/篱笆达到该剩余血量比例（0.75 / 0.50 / 0.25 / 0 四档交错）即视为破口通行并定格对应破损形态；城门与建筑恒为 0（必须打到 0% 完全摧毁）。
     */
    private wallBreachRatio(b: WarBuilding): number {
        if (b.bld || b.key === 'STONE_GATE') return 0;
        const idx = Math.max(0, this.wallGates.indexOf(b));
        return ([0.75, 0.50, 0.25, 0] as const)[idx & 3];
    }

    private collapseNextWallGap(): boolean {
        const alive = this.wallGates.filter(b => this.wallStanding(b));
        if (alive.length === 0) return false;            // 没墙可塌了 → 停轮询
        let pick: WarBuilding | undefined;
        for (const b of alive) {
            if (b.key === 'STONE_GATE' || b.hp >= b.maxHp) continue; // 🔴 城门必须打到 0 血摧毁；只有不是满血的城墙才能自动坍塌
            if (!pick || (b.hitAt ?? this.battleSec) < (pick.hitAt ?? this.battleSec)) pick = b;
        }
        if (!pick) return true;                          // 全都满血：这一轮不塌，10 秒后再看
        this.collapseOneWall(pick);                      // 复用同一条倒塌链（含 DE 倒塌动画 + 残骸 + 音效）
        return true;
    }

    /** 单个墙/门/垛段坍塌（严格对齐 DE empires2_x2_p1.dat）：
     *  - 石墙(Unit 117) / 垛墙(Unit 155)：按 `wallBreachRatio`（75%/50%/25%/0% 四档交错）定格在 D25 / D50 / D75 / FOUNDATION_1X1_RUBBLE，扬起 `FX_WALL_DUST` 尘土并解除阻挡；
     *  - 木栅栏(Unit 72) / 强木栅栏(Unit 119)：按 `wallBreachRatio` 阈值触发 `FX_WALL_DUST` + 切 `FOUNDATION_1X1_RUBBLE`；
     *  - 篱笆(Unit 1062)：按 `wallBreachRatio` 阈值触发 `FX_WALL_DUST` + 切 `BATTLEFIELD:FENCE_RUBBLE`；
     *  - 城门(Unit 64)：必须 0 血完全摧毁，照播 DE 独立 100 帧倒塌动画（`*_GATE_*_DESTR` → `*_GATE_*_RUBBLE`）。 */
    private collapseOneWall(b: WarBuilding): void {
        b.sprite.obstruction = undefined;
        b.sprite.obstructionDisabled = true;
        if (b.extraSprites) for (const sp of b.extraSprites) { sp.obstruction = undefined; sp.obstructionDisabled = true; }
        // 🔴 [2026-10-15] 墙/门/垛塌（自动坍塌或被打穿阈值）都走这里 → 只在这一处播倒塌音，避免重复播放
        audioManager.play('wall_collapse');
        this.lastCollapseAt = performance.now();
        const br = this.wallBreachRatio(b);
        if (b.sprite.asset.includes('FENCE') || b.rubbleAsset === 'BATTLEFIELD:FENCE_RUBBLE') {
            // 🔴 [2026-10-16 主人令「篱笆的门，在坍塌的时候，错用了栅栏门，请修复，和DE保持一致，依然用篱笆门」
            //    ＋「栅栏和强木栅栏的坍塌怎么 爆炸效果？请检查，和DE保持一致」]
            //    篱笆门或 0% 破口档切 FENCE_RUBBLE；75%/50%/25% 破口档保留原贴图由 drawDecorSprite 绘制参差断木残桩。
            const a = b.sprite.asset;
            b.sprite.collapse = undefined;
            if (b.key === 'STONE_GATE' || br <= 0) {
                b.sprite.asset = 'BATTLEFIELD:FENCE_RUBBLE';
                b.sprite.frame = a.includes('GATE') ? 3 : a.includes('CORNER') ? 2 : (a.includes('POST') || a.endsWith('_N')) ? 4 : a.endsWith('_SE') ? 1 : 0;
            }
            this.spawnFx('FX_WALL_DUST', b.x, b.y - this.elevationLiftAt(b.x, b.y), 0);
        } else if (b.key === 'STONE_WALL' || b.key === 'FORTIFIED_WALL' || b.key === 'WOOD_WALL') {
            b.sprite.collapse = undefined;
            if (b.destrAssets && br > 0) {
                const stageIdx = br >= 0.75 ? 0 : (br >= 0.50 ? 1 : 2);
                b.sprite.asset = 'BUILDINGANIM:' + b.destrAssets[stageIdx];
                b.sprite.frame = 0;
            } else if (b.key !== 'WOOD_WALL' || br <= 0) {
                b.sprite.asset = 'BUILDINGANIM:FOUNDATION_1X1_RUBBLE';
                b.sprite.frame = 0;
            }
            this.spawnFx('FX_WALL_DUST', b.x, b.y - this.elevationLiftAt(b.x, b.y), 0);
        } else if (b.rubbleAsset) {
            this.collapseToRubble(b.sprite, b.rubbleAsset.slice(0, -'_RUBBLE'.length));
        } else {
            b.sprite.destroyed = true;
        }
        b.hp = 0;
    }

    /** 所有可能播放倒塌动画的装饰精灵（城墙/城门/箭塔/城内建筑/营寨）。 */
    private collapsibleSprites(): DecorSprite[] {
        // 同一精灵可能同时挂在两张表上（如箭塔 = arrowTowers + defBuildings）⇒ 用 Set 去重，
        // 否则倒塌帧会被推进两次（播放速度变两倍）。
        const seen = new Set<DecorSprite>();
        const out: DecorSprite[] = [];
        const add = (sp: DecorSprite): void => {
            if (sp.indestructible || seen.has(sp)) return;
            seen.add(sp);
            out.push(sp);
        };
        for (const b of this.wallGates) add(b.sprite);
        for (const t of this.arrowTowers) add(t.sprite);
        for (const b of this.cityBuildings) add(b.sprite);
        // 🔴 [2026-10-15 主人令「有坍塌动画的都是建筑」] 营寨也登记为建筑（只在 defBuildings 里）⇒ 倒塌帧同样要推进
        for (const b of this.defBuildings) add(b.sprite);
        return out;
    }

    /**
     * 预载一件素材的「破损 / 倒塌 / 残骸」整条链（含 DE 同族与通用兜底）。
     * 🔴 [2026-10-15 主人令「所有建筑请和 DE 保持一致……蒙古包和其他建筑一样，都是先燃后塌」]
     *    城寨/蒙古包这类**场景装饰建筑 DE 没有 destruction 素材**（只有一帧静态图），
     *    这里按 `buildingDestructionAssets` 的同族表（棚屋/蒙古包 → DE 黑暗时代民居）与
     *    通用 1×1 兜底一起预载 —— 开战前全部就绪，战斗中切形态才不会因未加载而卡帧。
     */
    private ensureDestrAssetsFor(name: string): void {
        this.ensureNatureAsset('BUILDING:' + name + '_DAMAGED');   // DE 部分建筑无破损档：有就切，没有跳过
        this.ensureNatureAsset('BUILDINGANIM:' + name + '_DESTR');
        this.ensureNatureAsset('BUILDINGANIM:' + name + '_RUBBLE');
        const fam = destrFamilyOf(name);
        if (fam !== name) {
            this.ensureNatureAsset('BUILDINGANIM:' + fam + '_DESTR');
            this.ensureNatureAsset('BUILDINGANIM:' + fam + '_RUBBLE');
        }
        this.ensureNatureAsset('BUILDINGANIM:' + DE_DESTR_FALLBACK);
        this.ensureNatureAsset('BUILDINGANIM:' + DE_RUBBLE_FALLBACK);
    }

    /**
     * 让装饰精灵播倒塌动画 → 切残骸：按「自身 → DE 同族 → 通用 1×1」逐级取素材，
     * 有 DESTR 就播（step 里 collapse.t 推进完切 rubble）；无 DESTR 就直接切 rubble。
     * 🔴 [2026-10-15 主人令「所有建筑受伤掉血、血没了就坍塌，和 DE 一样」]
     *    兜底链保证**任何建筑都不会血一归零就凭空消失**（棚屋/蒙古包/哨站一样播 DE 倒塌 → 留残骸）。
     *    时长一律 DE 的 `COLLAPSE_ANIM_DUR`(8.33s)。营寨装饰不是建筑，永不走这里。
     */
    private collapseToRubble(sprite: DecorSprite, name: string, customRubble?: string): void {
        if (sprite.indestructible) return;
        const destr = destrCandidatesOf(name).find((a) => this.natureCache[a]?.img?.complete);
        const rubble = rubbleCandidatesOf(name, customRubble).find((a) => this.natureCache[a]?.img?.complete) ?? null;
        if (destr) {
            sprite.asset = destr;
            sprite.frame = 0;
            sprite.collapse = { t: 0, dur: COLLAPSE_ANIM_DUR, rubbleAsset: rubble };
        } else if (rubble) {
            sprite.asset = rubble;
            sprite.frame = 0;
        }
    }

    /**
     * 登记一座可攻击建筑（有血量、会掉血、血归零走 DE 倒塌链）。
     * 🔴 [2026-10-15 主人令「我们算建筑，有坍塌动画的都是建筑」] 营寨（帐篷/营帐/装饰蒙古包/哨站/营寨塔）
     *    也走这里登记 → 它们和城内建筑同一条链（受伤掉血 → 血没就塌）。
     * ⚠️ `f` 必须传对阵营：索敌一律跳过同阵营（`b.f === m.f`），
     *    否则会出现「攻城武器砸自己营」「守方把自己的帐篷挑成中心建筑」这类污染。
     * @param f 0 = 攻方营寨 / 1 = 守方建筑（默认 1）
     */
    private registerDefBuilding(sp: DecorSprite, name: string, tower?: ArrowTower, kind?: string, f: 0 | 1 = 1): void {
        if (sp.indestructible) return;
        const key = 'BLD:' + (kind ? kind + ':' : '') + name;
        const st = WALL_GATE_STATS[key] ?? (WALL_GATE_STATS[key] = deBuildingStats(name, kind));
        this.defBuildings.push({ f, key, x: sp.x, y: sp.y, hp: st.hp, maxHp: st.hp, claims: 0, claimsNext: 0, atkNext: 0, atkers: 0, sprite: sp, bld: { name, tower } });
        for (const fk of ['FX_FIRE_SMALL', 'FX_FIRE_SMALL_R', 'FX_FIRE_WIN_S', 'FX_FIRE_MEDIUM', 'FX_FIRE_MEDIUM_R', 'FX_FIRE_ROOF', 'FX_FIRE_LARGE', 'FX_FIRE_LARGE_R']) {
            this.ensureFx(fk);
        }
    }

    /** 中心建筑：只在攻城战选，**只在守方建筑里选**（营寨是攻方建筑，永远不参与）。
     *  城堡优先，其次城镇中心，都没有取离城内建筑群中心最近的一栋（箭塔除外）。 */
    private pickCenterBuilding(): WarBuilding | null {
        if (this.battleType !== 'siege') return null;
        const list = this.defBuildings.filter(b => b.f === 1 && !b.bld!.tower);
        if (list.length === 0) return null;
        const castle = list.find(b => b.key.startsWith('BLD:CASTLE:') || b.bld!.name.includes('CASTLE'));
        if (castle) return castle;
        const tc = list.find(b => b.bld!.name.includes('TOWN_CENTER'));
        if (tc) return tc;
        const cx = list.reduce((n, b) => n + b.x, 0) / list.length, cy = list.reduce((n, b) => n + b.y, 0) / list.length;
        let pick = list[0], pd = Infinity;
        for (const b of list) { const d = (b.x - cx) ** 2 + (b.y - cy) ** 2; if (d < pd) { pd = d; pick = b; } }
        return pick;
    }

    /** 建筑挨打后的表现：血≤50% 换破损贴图；血≤0 倒塌成残骸并停火。 */
    private onDefBuildingHit(b: WarBuilding): void {
        const sp = b.sprite, name = b.bld!.name;
        // 🔴 [2026-10-15 主人令「建筑被击毁的又太快了……按占的格子多少来设计，不要太长，比现在稍微长一点就行」]
        //    保底时间 = BLD_MIN_DESTROY_BASE + BLD_MIN_DESTROY_PER_SIDE × 占地边长（1×1 箭塔 7 秒 / 2×2 民居 10 / 3×3 兵营 13 / 4×4 城镇中心·城堡 16）。
        //    从首次挨打（hitAt）算起，血量不低于按保底时间线性掉到 0 的那条线 ⇒ 人再多也快不过保底；人少打得慢照常按实际伤害。
        //    实测改前（小城安定）：民居 7.4 秒、磨坊 10.1、铁匠铺 7.5、城镇中心 12 —— 大小建筑倒得一样快。
        if (sp.destroyed || sp.collapse || sp.asset.includes('_RUBBLE')) return;
        if (b.hitAt !== undefined) {
            const floorSec = BLD_MIN_DESTROY_BASE + BLD_MIN_DESTROY_PER_SIDE * bldFootprintSide(name);
            const minHp = b.maxHp * (1 - (this.battleSec - b.hitAt) / floorSec);
            if (b.hp < minHp) b.hp = minHp;
        }
        if (b.hp <= 0) {
            if (b.bld!.tower) b.bld!.tower.down = true;
            for (const t of this.castleTowers) if (t.sprite === sp) t.down = true;
            for (const t of this.arrowTowers) if (t.sprite === sp) t.down = true;
            sp.obstruction = undefined;
            sp.obstructionDisabled = true;
            audioManager.play('building_collapse');
            this.collapseToRubble(sp, name);
            if (!sp.collapse && !sp.asset.includes('_RUBBLE')) sp.destroyed = true;
        } else if (b.hp <= b.maxHp * 0.5) {
            const dmg = 'BUILDING:' + name + '_DAMAGED';
            if (sp.asset !== dmg && this.natureCache[dmg]?.img?.complete) { sp.asset = dmg; sp.frame = 0; }
        }
    }

    /** 记录一座守城建筑（供 30 秒随机三形态 + 未坍塌射箭用）。name = 素材名（如 ASIA_HOUSE_AGE3 / CHIN_CASTLE_AGE3）。 */
    private trackCityBuilding(sp: DecorSprite, kind?: string): void {
        const name = sp.asset.slice('BUILDING:'.length);
        // 🔴 [2026-10-15 主人令「九建筑和箭塔一样的攻击效果和特效」] 射程/装填/攻击力与城墙内侧箭塔同档
        //    （瞭望 320/2.2/5、警戒 360/2.0/6、高级 400/1.8/7），不再用窗台冷箭（240/3.2/3）。
        const towerProfile = (this.defenderCityType === 'small_city' || this.defenderCityType === 'stockade')
            ? { range: 320, reload: 2.2, atk: 5 }
            : (this.defenderCityType === 'medium_city' || this.defenderCityType === 'pass')
                ? { range: 360, reload: 2.0, atk: 6 }
                : { range: 400, reload: 1.8, atk: 7 };
        this.cityBuildings.push({
            sprite: sp,
            name,
            cd: 1.0 + Math.random() * 2.5, // 错开初始开火时刻
            range: towerProfile.range,
            reload: towerProfile.reload,
            atk: towerProfile.atk,
        });
        this.registerDefBuilding(sp, name, undefined, kind);
        this.ensureProj('PROJ_ARROW');
        // 🔴 开战前预载破损/残骸/倒塌动画素材（否则切形态时 pending>0 整场冻结）
        // 🔴 [2026-10-15 主人令「所有建筑和 DE 一致、蒙古包也先燃后塌」] 改走同族链+通用兜底预载：
        //    棚屋/蒙古包/哨站这些 DE 没有 destruction 素材的，也要在开战前把兜底素材备齐
        this.ensureDestrAssetsFor(name);
    }

    /**
     * 🔴 [2026-08-29 主人需求] 城墙内侧并列箭塔开火：
     *    找射程内最近的攻方士兵（f=0），冷却到点射三支箭（连弩三连发 + 塔顶开火火花）+
     *    🔴 [主人需求] 真实穿透伤害（一发 = atk，照 DE 箭塔科技 5/6/7、城堡 11）。
     *    塔在 30 秒随机切成破损/残骸（或保持完整继续射）后才停止射击。
     */
    private stepArrowTowers(dt: number): void {
        if (this.battleType !== 'siege') return;
        for (const t of this.arrowTowers) this.stepTowerShoot(t, dt);
        for (const c of this.castleTowers) this.stepTowerShoot(c, dt);
        // 🔴 [2026-09-16 主人定「战术模式中防守方所有没有坍塌的建筑都可以射箭」]：
        //    普通未坍塌建筑（兵营/磨坊/民居/马厩/TC等）窗台民兵冷箭
        for (const b of this.cityBuildings) this.stepCityBuildingShoot(b, dt);
    }

    /** 单座塔/城堡：找射程内最近攻方士兵，冷却到点连发 3 支箭 + 真实穿透伤害。 */
    private stepTowerShoot(t: ArrowTower, dt: number): void {
        if (t.down || t.sprite.destroyed || t.sprite.collapse) return;   // 已塌不再射
        // 🔴 塔贴图未加载（素材不存在/未就绪）→ 不画也不射（看不见的塔开火更假）
        const towerNa = this.natureCache[t.sprite.asset];
        if (!towerNa?.img?.complete) return;
        t.cd -= dt;
        if (t.cd > 0) return;
        // 塔顶开火点：贴图锚点在塔基，抬到塔身上部
        const fireX = t.x;
        const fireY = t.y - UNIT_PX * 0.8;
        const towerElev = this.elevationLevelAt(t.x, t.y);
        // 射程内最近的攻方士兵（受高地平滑射程加成：每高 1 级射程 +5%，最高 +35%）
        let foe: WarMan | null = null, bd = Infinity;
        for (const m of this.men) {
            if (m.f === 0 && m.hp > 0) {
                const foeElev = this.elevationLevelAt(m.x, m.y);
                const dElev = towerElev - foeElev;
                const elevRangeMul = dElev > 0.2 ? (1.0 + Math.min(7, dElev) * 0.05) : 1.0;
                const effRange = t.range * elevRangeMul;
                const d = (m.x - fireX) * (m.x - fireX) + (m.y - fireY) * (m.y - fireY);
                if (d <= effRange * effRange && d < bd) { bd = d; foe = m; }
            }
        }
        if (!foe) { t.cd = 0.25; return; }   // 无攻方/射程外，稍后再看
        // 🔴 [主人需求] 真实伤害：穿透，一发 = atk（DE 箭塔科技 5/6/7、城堡 11）；
        //    吃守方八环 sideBonus[1] · 围殴 · 白热化，以及 DE 高地伤害倍率（高打低 +25%、低打高 -25%）。
        const target = this.statsFor(foe.key, foe.f);
        const dmg = Math.max(1, t.atk - target.pierceArmor);
        const foeElev = this.elevationLevelAt(foe.x, foe.y);
        const dElev = towerElev - foeElev;
        const elevDmgMul = dElev >= 0.4 ? 1.25 : (dElev <= -0.4 ? 0.75 : 1.0);
        const towerSkillMul = (this.skillFrenzyTimer[1] > 0 ? 1.30 : 1.0)
            * (this.skillShieldTimer[foe.f] > 0 ? 0.60 : 1.0)
            * (this.skillVulnTimer[foe.f] > 0 ? 1.35 : 1.0);
        foe.atkNext++;
        foe.hp -= dmg * elevDmgMul * this.sideBonus[1] * gangMul(foe) * this.attritionMul() * towerSkillMul
            * (foe.hero ? HERO_DAMAGE_TAKEN : 1);   // 玩家免伤，与士兵刀箭同口径
        // 🔴 [2026-09-09 修] 原来这里直接 pushCorpse：玩家被箭塔射死会**变成尸体永久离场**，
        //    而不是走落马重整（heroDown）。攻城战守方满墙箭塔，这条路正是「玩家一直死」的大头。
        if (foe.hp <= 0) {
            if (foe.hero) this.heroDown(foe);
            else this.pushCorpse(foe);
        }
        const ax = foe.x - fireX, ay = foe.y - fireY;
        const ad = Math.hypot(ax, ay) || 1;
        // 🔴 [2026-08-29 主人需求] 攻击特效 = 诸葛连弩：一次连发 3 支（复用 WarArrow.delay 连发机制，
        //    每支延迟 v × PROJ_VOLLEY_DELAY 依次射出，视觉上就是连弩的三连发）。
        for (let v = 0; v < 3; v++) {
            this.arrows.push({
                x: fireX, y: fireY,
                dx: ax / ad, dy: ay / ad, len: ad,
                t: 0, dur: ad / (PROJ_SPEED_PX.PROJ_ARROW ?? 440), f: 1, proj: 'PROJ_ARROW',
                delay: v * PROJ_VOLLEY_DELAY,
                towerFlight: {
                    startLift: this.elevationLiftAt(fireX, t.y),
                    endLift: this.elevationLiftAt(foe.x, foe.y),
                },
            });
        }
        t.cd = t.reload;
    }

    /**
     * 🔴 [2026-09-16 主人定「战术模式中防守方所有没有坍塌的建筑都可以射箭」]：
     *    普通未坍塌建筑（兵营/磨坊/民居/马厩/TC等）连弩三连发，攻击/射程/装填与城墙内侧箭塔同档。
     *    🔴 [2026-10-15 主人令「九建筑和箭塔一样的攻击效果和特效」]：从窗台冷箭（单发攻 2~3、射程 240、装填 3.2s）
     *    改为与箭塔同款（瞭望 5/320/2.2、警戒 6/360/2.0、高级 7/400/1.8）+ 三连发。
     *    关键规则：坍塌即停火。未坍塌时正常射击；一旦切为残骸或被投石车砸毁，立即熄火！
     *    （注：城堡已在 castleTowers 中以三连发重火力射击，这里跳过 CASTLE 避免重复）。
     */
    private stepCityBuildingShoot(b: CityBuildingEntry, dt: number): void {
        // 城堡已在 castleTowers 独立射击（旧版城池才有），跳过；新版城池里城堡只登记为普通建筑，照常射
        // 🔴 [2026-10-14 主人令「九建筑都会射箭」] 原来凡是城堡一律跳过 ⇒ 新版城池的中心城堡一箭不射
        if (b.name.includes('CASTLE') && this.castleTowers.some((c) => c.sprite === b.sprite)) return;
        // 坍塌即停火：已销毁、正在倒塌、或已切成 RUBBLE 残骸，立即停止射击
        if (b.sprite.destroyed || b.sprite.collapse || b.sprite.asset.includes('_RUBBLE')) return;
        // 建筑贴图未就绪不射
        const bNa = this.natureCache[b.sprite.asset];
        if (!bNa?.img?.complete) return;

        b.cd = (b.cd ?? 0) - dt;
        if (b.cd > 0) return;

        // 窗台/屋檐开火点：贴图锚点在底基，抬到建筑中上部
        const fireX = b.sprite.x;
        const fireY = b.sprite.y - UNIT_PX * 0.6;
        const baseRange = b.range ?? 320; // 与箭塔同档（瞭望 320 / 警戒 360 / 高级 400）
        const bldElev = this.elevationLevelAt(fireX, b.sprite.y);

        // 寻找射程内最近的攻方士兵（受高地平滑射程加成）
        let foe: WarMan | null = null, bd = Infinity;
        for (const m of this.men) {
            if (m.f === 0 && m.hp > 0) {
                const foeElev = this.elevationLevelAt(m.x, m.y);
                const dElev = bldElev - foeElev;
                const elevRangeMul = dElev > 0.2 ? (1.0 + Math.min(7, dElev) * 0.05) : 1.0;
                const effRange = baseRange * elevRangeMul;
                const d = (m.x - fireX) * (m.x - fireX) + (m.y - fireY) * (m.y - fireY);
                if (d <= effRange * effRange && d < bd) { bd = d; foe = m; }
            }
        }
        if (!foe) { b.cd = 0.3; return; } // 无目标或超出射程，稍后再寻

        // 真实伤害：与箭塔同档（瞭望 5 / 警戒 6 / 高级 7，受 DE 高地伤害倍率影响）
        const atk = b.atk ?? 5;
        const target = this.statsFor(foe.key, foe.f);
        const dmg = Math.max(1, atk - target.pierceArmor);
        const foeElev = this.elevationLevelAt(foe.x, foe.y);
        const dElev = bldElev - foeElev;
        const elevDmgMul = dElev >= 0.4 ? 1.25 : (dElev <= -0.4 ? 0.75 : 1.0);
        const bldSkillMul = (this.skillFrenzyTimer[1] > 0 ? 1.30 : 1.0)
            * (this.skillShieldTimer[foe.f] > 0 ? 0.60 : 1.0)
            * (this.skillVulnTimer[foe.f] > 0 ? 1.35 : 1.0);
        foe.atkNext++;
        foe.hp -= dmg * elevDmgMul * this.sideBonus[1] * gangMul(foe) * this.attritionMul() * bldSkillMul
            * (foe.hero ? HERO_DAMAGE_TAKEN : 1);
        if (foe.hp <= 0) {
            if (foe.hero) this.heroDown(foe);
            else this.pushCorpse(foe);
        }

        const ax = foe.x - fireX, ay = foe.y - fireY;
        const ad = Math.hypot(ax, ay) || 1;
        // 🔴 [2026-10-15 主人令「把城中九建筑的攻击特效一律改为和DE的箭塔一样」]：
        //    与 stepTowerShoot 完全一致，发射 PROJ_ARROW 三连发，不再使用喷火特效
        for (let v = 0; v < 3; v++) {
            this.arrows.push({
                x: fireX, y: fireY,
                dx: ax / ad, dy: ay / ad, len: ad,
                t: 0, dur: ad / (PROJ_SPEED_PX.PROJ_ARROW ?? 440), f: 1, proj: 'PROJ_ARROW',
                delay: v * PROJ_VOLLEY_DELAY,
                towerFlight: {
                    startLift: this.elevationLiftAt(fireX, b.sprite.y),
                    endLift: this.elevationLiftAt(foe.x, foe.y),
                },
            });
        }
        b.cd = b.reload ?? 2.2;
    }

    /**
     * 范围伤（象兵）。
     * 伤害按 DE 公式逐个受害者算：dmgVs(攻+加成−防) / reload，再乘八环 sideBonus 与围殴。
     */
    /**
     * 【战场白热化】当前全场伤害倍率（见 ATTRITION_START_SEC）。
     * 只按本场已打的真实秒数算，攻守同一个值 —— 双方一起变快，相对强弱不变。
     */
    private attritionMul(): number {
        const over = this.battleSec - ATTRITION_START_SEC;
        if (over <= 0) return 1;
        return Math.min(ATTRITION_CAP, 1 + over / ATTRITION_RAMP_SEC);
    }

    private splash(m: WarMan, radius: number, shooter: WarType, dt: number, mult = 1): void {
        const span = Math.max(1, Math.ceil(radius / CELL_M));
        const cx = (m.x / CELL_M) | 0, cy = (m.y / CELL_M) | 0;
        const frenzyMul = this.skillFrenzyTimer[m.f] > 0 ? 1.30 : 1.0;
        for (let gx = cx - span; gx <= cx + span; gx++) {
            for (let gy = cy - span; gy <= cy + span; gy++) {
                const a = this.gm.get(HKEY(gx, gy));
                if (!a) continue;
                for (const o of a) {
                    if (o.f === m.f || o.hp <= 0) continue;
                    if ((o.x - m.x) ** 2 + (o.y - m.y) ** 2 > radius * radius) continue;
                    // 范围伤不挖「盲区空洞」：贴脸的敌人照样吃溅射（最小射程只管分配新目标，见 canKeepTarget 头注）。
                    // 范围伤同样吃围殴加成：加成挂在挨打的人身上，被围住的人谁打都更疼
                    const dps = dmgVs(shooter, this.statsFor(o.key, o.f)) * mult * frenzyMul / shooter.reload;
                    const takenSkillMul = (this.skillShieldTimer[o.f] > 0 ? 0.60 : 1.0)
                        * (this.skillVulnTimer[o.f] > 0 ? 1.35 : 1.0);
                    o.atkNext++;
                    if (dps > 0) {
                        o.hurtBy = m;
                        o.hurtAt = this.battleSec;
                    }
                    o.hp -= dps * this.sideBonus[m.f] * gangMul(o) * this.attritionMul() * takenSkillMul * dt
                        * (o.hero ? HERO_DAMAGE_TAKEN : 1)   // 范围伤同样给玩家免伤
                        * this.passWallTaken(o);
                    if (o.hp <= 0) this.onManKilled(o, m);
                }
            }
        }
        // 🔴 [2026-10-13 全面审计抓出·已修] **自爆伤害原本只遍历兵网格 `this.gm`，建筑不在其中** ——
        //    爆破兵/火焰骆驼的 `bonus 11:1200 / 800`（对石质防御 / 建筑）是**永远用不到的死值**：
        //    够得着（<65px）就自爆只炸小兵，够不着就永远砸不到，对墙/门伤害恒为 0。
        //    这里把**城墙 / 城门 / 城内建筑**一并纳入自爆范围，并复用与普通攻击**逐字同一条**的
        //    破损档与 0 血破坏链（`onDefBuildingHit` + D25/D50/D75 + 解碰撞），不另写一份。
        //    倍率 `SUICIDE_BLD_MULT` 说明见常量定义处。
        if (SUICIDE_TYPES.has(m.key)) {
            const bldVulnMul = this.skillVulnTimer[1 - m.f] > 0 ? 1.35 : 1.0;
            for (const b of [...this.wallGates, ...this.defBuildings]) {
                if (b.hp <= 0 || b.sprite.destroyed || b.sprite.obstructionDisabled) continue;
                if ((b.x - m.x) ** 2 + (b.y - m.y) ** 2 > radius * radius) continue;
                const bdps = dmgVs(shooter, WALL_GATE_STATS[b.key] ?? WALL_GATE_STATS.STONE_WALL) * mult * frenzyMul * bldVulnMul * SUICIDE_BLD_MULT / shooter.reload;
                b.atkNext++;
                if (b.hitAt === undefined) b.hitAt = this.battleSec;
                b.hp -= bdps * this.sideBonus[m.f] * dt;
                if (b.destrAssets && b.maxHp > 0 && b.hp > 0 && !b.sprite.collapse) {
                    const ratio = b.hp / b.maxHp;
                    let stage = -1;
                    if (ratio <= 0.25) stage = 2;
                    else if (ratio <= 0.5) stage = 1;
                    else if (ratio <= 0.75) stage = 0;
                    if (stage >= 0) {
                        const asset = 'BUILDINGANIM:' + b.destrAssets[stage];
                        if (b.sprite.asset !== asset) { b.sprite.asset = asset; b.sprite.frame = 0; }
                    }
                }
                if (b.bld) this.onDefBuildingHit(b);
                if ((b.key === 'STONE_WALL' || b.key === 'FORTIFIED_WALL' || b.key === 'WOOD_WALL' || b.key === 'STONE_GATE') && b.hp <= b.maxHp * this.wallBreachRatio(b) && !b.sprite.obstructionDisabled && !b.sprite.collapse && !b.sprite.destroyed) {
                    this.collapseOneWall(b);
                }
            }
        }
    }

    /**
     * 列阵推进：整体平移 + 前锋线接触解除（见 MARCH_REL）。
     * 待命阶段不推进（那时全军静止渐显）；解除后本方法整场空转。
     */
    private marchTick(dt: number, deploying: boolean): void {
        if (!this.marching || deploying) return;
        // 阵型速度 = 本方列阵兵里**最慢**的那个。
        // 阵型行军的定义就是全队迁就最慢的人 —— 不这么做骑兵会把步兵甩下，队形当场散架。
        const spdMin = [Infinity, Infinity];
        let anyMarcher = false;
        for (const m of this.men) {
            if (m.hp <= 0 || !m.march) continue;
            anyMarcher = true;
            const sp = this.statsFor(m.key, m.f).spd;
            if (sp < spdMin[m.f]) spdMin[m.f] = sp;
        }
        if (!anyMarcher) { this.marching = false; return; }   // 列阵那批没了（理论上到不了），直接放开
        for (let f = 0; f < 2; f++) if (spdMin[f] < Infinity) this.adv[f] += spdMin[f] * dt;
        // 前锋线 = 本方最靠前那排出兵口的 x ± 已推进距离。
        // 阵型是刚体，直接由锚点算即可，不受个别掉队/落单兵影响（拿存活兵均值算会被拖后腿）。
        if (this.spawnBases) {
            const baseDist = Math.hypot(this.spawnBases[1].x - this.spawnBases[0].x, this.spawnBases[1].y - this.spawnBases[0].y);
            let front0 = 0, front1 = 0;
            const u0 = this.advanceVec[0], u1 = this.advanceVec[1];
            for (const sp of this.spawns) {
                if (sp.commander || sp.playerElite) continue;
                if (sp.f === 0) {
                    const p = (sp.x - this.spawnBases[0].x) * u0.x + (sp.y - this.spawnBases[0].y) * u0.y;
                    if (p > front0) front0 = p;
                } else {
                    const p = (sp.x - this.spawnBases[1].x) * u1.x + (sp.y - this.spawnBases[1].y) * u1.y;
                    if (p > front1) front1 = p;
                }
            }
            if (this.deCity) front1 = Math.min(front1, 320);
            const marchedDist = this.adv[0] + this.adv[1];
            // 攻城战守方第一波在城外列阵（defOutsideBase）时，spawnBases[1] 仍在城心，按基座算的剩余距离比真实两军前锋间距大数百像素；
            // 同时实测场上两军最前排存活单位沿推进轴的真实间距 liveGap，任一达到 MARCH_REL 即刻解除行军展开接战。
            let maxP0 = -Infinity, minP1 = Infinity;
            for (const m of this.men) {
                if (m.hp <= 0 || m.siegeW) continue;
                const p = (m.x - this.spawnBases[0].x) * u0.x + (m.y - this.spawnBases[0].y) * u0.y;
                if (m.f === 0) { if (p > maxP0) maxP0 = p; }
                else { if (p < minP1) minP1 = p; }
            }
            const liveGap = (maxP0 > -Infinity && minP1 < Infinity) ? (minP1 - maxP0) : Infinity;
            if ((marchedDist >= 180 && (baseDist - (front0 + this.adv[0] + front1 + this.adv[1]) < MARCH_REL || liveGap < MARCH_REL)) || this.battleSec >= (this.battleType === 'siege' ? 25.0 : 15.0)) {
                this.marching = false;
                this.holdLanes.clear();
                for (const m of this.men) {
                    m.march = false;   // 全军同时解除，双方一起炸开接战
                    m.noFoeSec = LANE_REGROUP_SEC;
                    m.stuckT = 0;
                    m.netT = 0;
                }
            }
        }
    }

    /**
     * 🔴 [2026-10-12 主人令] 流场寻敌：以中心建筑为目标，把还立着的墙/建筑当障碍，算出每个地块到中心的步数。
     * 士兵沿「步数递减」的方向走，墙塌出缺口后自然绕进城；墙全封死时没有路 ⇒ 返回 INF，退回旧行为（打墙）。
     * 地块坐标与 resolveWorldObstructions 同一套：a = x/TW + y/TH，b = y/TH − x/TW（以画布中心为原点）。
     */
    private buildFlowField(): void {
        this.flowBuiltAt = this.battleSec;
        if (this.battleType !== 'siege' || !this.siegeWithWalls || !this.canvas) { this.flowDist = null; this.defGateFlow = null; return; }
        this.buildDefFlowField();
        if (this.centerBld === undefined) this.centerBld = this.pickCenterBuilding();
        const goal = this.centerBld;
        if (!goal || goal.hp <= 0) { this.flowDist = null; return; }
        const TW = TAC_TILE_W, TH = TAC_TILE_H;
        const S = FLOW_SUB;   // 每个地块切 S×S 小格：1 格宽的缺口才走得通
        const R = (Math.ceil(TAC_MAP_HALF_W / TW + TAC_MAP_HALF_H / TH) + 2) * S;
        const N = 2 * R + 1;
        const cx = this.worldCX, cy = this.worldCY;
        const ab = (x: number, y: number): [number, number] => {
            const dx = x - cx, dy = y - cy;
            return [(dx / TW + dy / TH) * S, (dy / TH - dx / TW) * S];
        };
        // 🔴 [2026-10-15 主人报「攻方打破城门后，不往里面走。都拥挤在城墙这里」] 险要有内外两圈：外圈破了、内圈门墙还全立着
        //    ⇒ 城外到中心建筑无路 ⇒ 流场全 INF、不接管 ⇒ 兵直线奔中心、顶在外圈墙上（实测独松关破门 14 秒后进城 0/608）。
        //    这时把还立着的城门当「可通行」再算一遍：兵从缺口进外圈、走到内圈门前，被门挡住就打门（见 search 攻方士兵段）。
        //    墙一处未破时不走这条（门前集结照旧）。
        this.ensureGateInfo();
        const INF = 32767;
        const queue = new Int32Array(N * N);
        const [ga0, gb0] = ab(goal.x, goal.y);
        const ga = Math.round(ga0), gb = Math.round(gb0);
        const run = (viaGate: boolean): { dist: Int16Array; blocked: Uint8Array } => {
            const blocked = new Uint8Array(N * N);
            for (const sp of this.decorSprites) {
                const ob = sp.obstruction;
                if (!ob || sp.obstructionDisabled || sp.destroyed || sp === goal.sprite) continue;
                if (viaGate && this.gateSpriteSet?.has(sp)) continue;
                const [ca, cb] = ab(sp.x, sp.y);
                const ox = (ob.x + 0.25) * S, oy = (ob.y + 0.25) * S;   // 多留 0.25 地块 = 士兵身位
                for (let a = Math.floor(ca - ox); a <= Math.ceil(ca + ox); a++) {
                    for (let b = Math.floor(cb - oy); b <= Math.ceil(cb + oy); b++) {
                        if (Math.abs(a - ca) >= ox || Math.abs(b - cb) >= oy) continue;
                        if (a < -R || a > R || b < -R || b > R) continue;
                        blocked[(a + R) * N + (b + R)] = 1;
                    }
                }
            }
            for (let a = ga - 4 * S; a <= ga + 4 * S; a++) for (let b = gb - 4 * S; b <= gb + 4 * S; b++) {
                if (a >= -R && a <= R && b >= -R && b <= R) blocked[(a + R) * N + (b + R)] = 0;   // 目标周围留空，BFS 才出得来
            }
            const dist = new Int16Array(N * N).fill(INF);
            let qh = 0, qt = 0;
            const g = (ga + R) * N + (gb + R);
            dist[g] = 0; queue[qt++] = g;
            while (qh < qt) {
                const c = queue[qh++];
                const ca = (c / N) | 0, cb = c % N;
                const nd = dist[c] + 1;
                for (let da = -1; da <= 1; da++) for (let db = -1; db <= 1; db++) {
                    if (!da && !db) continue;
                    const a2 = ca + da, b2 = cb + db;
                    if (a2 < 0 || a2 >= N || b2 < 0 || b2 >= N) continue;
                    const n = a2 * N + b2;
                    if (blocked[n] || dist[n] <= nd) continue;
                    if (da && db && (blocked[(ca + da) * N + cb] || blocked[ca * N + cb + db])) continue;   // 斜穿墙角不行
                    dist[n] = nd; queue[qt++] = n;
                }
            }
            return { dist, blocked };
        };
        let res = run(false);
        if (this.ringOpen()) {
            // 攻方士兵一个都到不了中心建筑 ⇒ 门当可通行重算（贴墙站的兵脚下是膨胀障碍格，看周围 2 小格）
            let any = false, reach = false;
            for (const m of this.men) {
                if (m.f !== 0 || m.hp <= 0 || m.hero || m.siegeW || WALL_PASS_TYPES.has(m.key)) continue;
                any = true;
                const [fa, fb] = ab(m.x, m.y);
                const a0 = Math.round(fa) + R, b0 = Math.round(fb) + R;
                for (let a = a0 - 2; a <= a0 + 2 && !reach; a++) for (let b = b0 - 2; b <= b0 + 2; b++) {
                    if (a >= 0 && a < N && b >= 0 && b < N && res.dist[a * N + b] < INF) { reach = true; break; }
                }
                if (reach) break;
            }
            if (any && !reach) res = run(true);
        }
        this.flowDist = res.dist;
        this.flowR = R;
    }

    /**
     * 🔴 [2026-10-14 主人报「守军有的会走城门，有的会拥挤在城角」→「全改」] 守方出城流场（**每座城门一张**）。
     * 病灶（实测 scratchpad probe_gate_stuck，险要 pass）：守方出城原是**直线**走向「门外 120px」那一点，
     *   门不在直线上就顶墙，城内约 45~90 个近战守军贴着墙堆着不动。
     * 修法：**去哪座门照旧**（gateExit 原有选门：离敌人最近 / 离自己最近），只把「直线走过去」换成沿流场绕过去 ——
     *   每座城门一张流场，以「门外 120px」那一点为终点反向 BFS，格子与攻方流场同一套；城门对守方不算障碍
     *   （守方本就能穿自己的城门，见 resolveWorldObstructions）。
     * 障碍没变（数一数还挡路的物件）就不重算：墙/门塌一处才重算一次。
     */
    private buildDefFlowField(): void {
        this.ensureGateInfo();
        const r = this.ringBox;
        if (!r || !this.canvas) { this.defGateFlow = null; return; }
        let sig = 0;
        for (const sp of this.decorSprites) if (sp.obstruction && !sp.obstructionDisabled && !sp.destroyed) sig++;
        if (this.defGateFlow && sig === this.defFlowSig) return;
        this.defFlowSig = sig;
        const TW = TAC_TILE_W, TH = TAC_TILE_H;
        const S = FLOW_SUB;
        const R = (Math.ceil(TAC_MAP_HALF_W / TW + TAC_MAP_HALF_H / TH) + 2) * S;
        const N = 2 * R + 1;
        const cx = this.worldCX, cy = this.worldCY;
        const blocked = new Uint8Array(N * N);
        for (const sp of this.decorSprites) {
            const ob = sp.obstruction;
            if (!ob || sp.obstructionDisabled || sp.destroyed || this.gateSpriteSet?.has(sp)) continue;
            const dx = sp.x - cx, dy = sp.y - cy;
            const ca = (dx / TW + dy / TH) * S, cb = (dy / TH - dx / TW) * S;
            const ox = (ob.x + 0.25) * S, oy = (ob.y + 0.25) * S;
            for (let a = Math.floor(ca - ox); a <= Math.ceil(ca + ox); a++) {
                for (let b = Math.floor(cb - oy); b <= Math.ceil(cb + oy); b++) {
                    if (Math.abs(a - ca) >= ox || Math.abs(b - cb) >= oy) continue;
                    if (a < -R || a > R || b < -R || b > R) continue;
                    blocked[(a + R) * N + (b + R)] = 1;
                }
            }
        }
        // 门外终点与 gateExit 同一算法：从城中心指向城门的方向，再往外 120px
        const am = (r.a0 + r.a1) / 2, bm = (r.b0 + r.b1) / 2;
        const ccx = cx + (am - bm) * (TW / 2), ccy = cy + (am + bm) * (TH / 2);
        const INF = 32767;
        const queue = new Int32Array(N * N);
        const fields = new Map<WarBuilding, Int16Array>();
        // 只在城墙外圈 ±6 地块内搜（守军只在城里用这张图）：实测险要 8 门全图搜一次 44ms，墙一塌就卡一帧
        const wa0 = Math.floor((r.a0 - 6) * S) + R, wa1 = Math.ceil((r.a1 + 6) * S) + R;
        const wb0 = Math.floor((r.b0 - 6) * S) + R, wb1 = Math.ceil((r.b1 + 6) * S) + R;
        for (const g of this.wallGates) {
            if (g.key !== 'STONE_GATE') continue;
            const vx = g.x - ccx, vy = g.y - ccy, vl = Math.hypot(vx, vy) || 1;
            const ox = g.x + vx / vl * 120 - cx, oy = g.y + vy / vl * 120 - cy;
            const ga = Math.round((ox / TW + oy / TH) * S) + R, gb = Math.round((oy / TH - ox / TW) * S) + R;
            const dist = new Int16Array(N * N).fill(INF);
            let qh = 0, qt = 0;
            for (let a = ga - S; a <= ga + S; a++) for (let b = gb - S; b <= gb + S; b++) {
                if (a < 0 || a >= N || b < 0 || b >= N) continue;
                const n = a * N + b;
                if (blocked[n]) continue;
                dist[n] = 0; queue[qt++] = n;
            }
            while (qh < qt) {
                const c = queue[qh++];
                const ca = (c / N) | 0, cb = c % N;
                const nd = dist[c] + 1;
                for (let da = -1; da <= 1; da++) for (let db = -1; db <= 1; db++) {
                    if (!da && !db) continue;
                    const a2 = ca + da, b2 = cb + db;
                    if (a2 < wa0 || a2 > wa1 || b2 < wb0 || b2 > wb1 || a2 < 0 || a2 >= N || b2 < 0 || b2 >= N) continue;
                    const n = a2 * N + b2;
                    if (blocked[n] || dist[n] <= nd) continue;
                    if (da && db && (blocked[(ca + da) * N + cb] || blocked[ca * N + cb + db])) continue;   // 斜穿墙角不行
                    dist[n] = nd; queue[qt++] = n;
                }
            }
            fields.set(g, dist);
        }
        this.defGateFlow = fields;
        this.flowR = R;
    }

    /** 某世界坐标到中心建筑的步数；没有流场/封死/不通 = Infinity */
    private flowDistAt(x: number, y: number): number {
        const f = this.flowDist;
        if (!f || !this.canvas) return Infinity;
        const R = this.flowR, N = 2 * R + 1;
        const dx = x - this.worldCX, dy = y - this.worldCY;
        const a = Math.round((dx / TAC_TILE_W + dy / TAC_TILE_H) * FLOW_SUB) + R, b = Math.round((dy / TAC_TILE_H - dx / TAC_TILE_W) * FLOW_SUB) + R;
        if (a < 0 || a >= N || b < 0 || b >= N) return Infinity;
        const d = f[a * N + b];
        return d >= 32767 ? Infinity : d;
    }

    /** 沿流场往中心走：返回前方几格的世界坐标；已在中心附近 / 无路 = null */
    private flowWaypoint(x: number, y: number, field: Int16Array | null = this.flowDist, stop = 6 * FLOW_SUB, look = 6 * FLOW_SUB, escape = 1): { x: number; y: number } | null {
        const f = field;   // 🔴 [2026-10-14] 守方出城流场（defGateFlow 每门一张）同用本函数
        if (!f || !this.canvas) return null;
        const R = this.flowR, N = 2 * R + 1;
        const TW = TAC_TILE_W, TH = TAC_TILE_H;
        const cx = this.worldCX, cy = this.worldCY;
        const dx = x - cx, dy = y - cy;
        let a = Math.round((dx / TW + dy / TH) * FLOW_SUB) + R, b = Math.round((dy / TH - dx / TW) * FLOW_SUB) + R;
        if (a < 1 || a >= N - 1 || b < 1 || b >= N - 1) return null;
        const cur = (): number => f[a * N + b];
        const best = (): [number, number, number] => {
            let bd = cur(), ba = a, bb = b;
            for (let da = -1; da <= 1; da++) for (let db = -1; db <= 1; db++) {
                if (!da && !db) continue;
                const d = f[(a + da) * N + (b + db)];
                if (d < bd) { bd = d; ba = a + da; bb = b + db; }
            }
            return [bd, ba, bb];
        };
        if (cur() >= 32767) {   // 站在被膨胀的障碍格里：先挪到相邻可走格
            const [bd, ba, bb] = best();
            if (bd < 32767) { a = ba; b = bb; }
            else {
                // 🔴 [2026-10-14] 贴墙站着的兵（离墙中心正好「墙厚＋半径」）脚下与紧邻一圈都在膨胀带里 ⇒ 往外 escape 圈找最近的可走格
                //    （实测险要卡住的守军 6/8 就是这样：退回直线走门 → 又顶回墙上）。escape 只给到 1 地块，够不着墙另一侧
                let e2 = Infinity, ea = -1, eb = -1;
                for (let da = -escape; da <= escape; da++) for (let db = -escape; db <= escape; db++) {
                    const a2 = a + da, b2 = b + db;
                    if (a2 < 0 || a2 >= N || b2 < 0 || b2 >= N || f[a2 * N + b2] >= 32767) continue;
                    const q = da * da + db * db;
                    if (q < e2 || (q === e2 && f[a2 * N + b2] < f[ea * N + eb])) { e2 = q; ea = a2; eb = b2; }
                }
                if (ea < 0) return null;
                a = ea; b = eb;
            }
        }
        if (cur() <= stop) return null;   // 已到中心附近，交还正常索敌
        for (let i = 0; i < look; i++) {
            const [bd, ba, bb] = best();
            if (bd >= cur()) break;
            a = ba; b = bb;
            if (bd <= 3 * FLOW_SUB) break;
        }
        const wa = (a - R) / FLOW_SUB, wb = (b - R) / FLOW_SUB;
        return { x: cx + (wa - wb) * (TW / 2), y: cy + (wa + wb) * (TH / 2) };
    }

    /** 寻敌结果过一道流场：攻方在城外、目的地更靠近中心时，改走流场路径（绕缺口进城） */
    private flowRedirect(m: WarMan, aim: { x: number; y: number } | null): { x: number; y: number } | null {
        if (!this.flowDist || m.f !== 0 || this.heroOrderPending(m) || WALL_PASS_TYPES.has(m.key)) return aim;
        const du = this.flowDistAt(m.x, m.y);
        // 🔴 [2026-10-15 主人报「士兵有的时候会贴着城门城墙，也不打」] 贴墙站的兵脚下是膨胀障碍格（du=∞）：
        //    原来直接放弃流场、直线顶墙；现先让 flowWaypoint 往外挪到最近的可走格再沿流场走（实测独松关 95 个 ∞ 兵救回 56）。
        if (!Number.isFinite(du)) return this.flowWaypoint(m.x, m.y, this.flowDist, 6 * FLOW_SUB, 6 * FLOW_SUB, 4) ?? aim;
        if (du <= 6 * FLOW_SUB) return aim;
        const target = aim ?? (this.centerBld ? { x: this.centerBld.x, y: this.centerBld.y } : null);
        if (!target) return aim;
        const dt2 = this.flowDistAt(target.x, target.y);
        if (!Number.isFinite(dt2) || dt2 > du) return aim;   // 目的地在更外面 / 本身在墙上（如城门）：照旧直走
        return this.flowWaypoint(m.x, m.y) ?? aim;
    }

    private aimAt(m: WarMan): { x: number; y: number } | null {
        // 🔴 [2026-10-14 主人令「两条都做」→「按每队算」] 残兵主动找敌：本队剩不到 REMNANT_FRAC ⇒ 全图找离自己最近的敌人（不限视野），
        //    照常过流场（攻方绕缺口进城）与出城路线（守方走城门；险要的「守墙」此时不再生效，见 gateExit）。
        if (m.lane >= 0 && this.remnantLanes.has(m.lane)) {
            const siegeDef = this.battleType === 'siege' && m.f === 1;
            const cityCen = this.deCity ? this.deCityCenter : this.spawnBases[1];
            let t: WarMan | null = null, td = Infinity;
            for (const o of this.men) {
                if (o.f === m.f || o.hp <= 0) continue;
                if (siegeDef && (o.hero || this.isInsideAttackerCamp(o.x, o.y))) continue;
                const d = siegeDef
                    ? (o.x - cityCen.x) ** 2 + (o.y - cityCen.y) ** 2
                    : (o.x - m.x) ** 2 + (o.y - m.y) ** 2;
                if (d < td) { td = d; t = o; }
            }
            if (t) {
                const ra = Math.atan2(m.jy, m.jx);
                return this.gateExit(m, this.flowRedirect(m, { x: t.x + Math.cos(ra) * CHASE_RING, y: t.y + Math.sin(ra) * CHASE_RING }));
            }
            if (siegeDef) {
                return this.gateExit(m, this.defenderCityReturnGoal(m));
            }
        }
        return this.gateExit(m, this.flowRedirect(m, this.aimAtRaw(m)));
    }

    /** 地块坐标（以画布中心为原点，与 resolveWorldObstructions 同一套） */
    private tileAB(x: number, y: number): [number, number] {
        const dx = x - this.worldCX, dy = y - this.worldCY;
        return [dx / TAC_TILE_W + dy / TAC_TILE_H, dy / TAC_TILE_H - dx / TAC_TILE_W];
    }

    /** 城门集合与城墙外圈范围（每场建一次） */
    private ensureGateInfo(): void {
        if (this.gateSpriteSet && this.ringBox !== undefined) return;
        this.gateSpriteSet = new Set();
        this.wallBySprite = new Map();
        for (const g of this.wallGates) { this.wallBySprite.set(g.sprite, g); if (g.extraSprites) for (const sp of g.extraSprites) this.wallBySprite.set(sp, g); }
        let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
        for (const g of this.wallGates) {
            const [a, b] = this.tileAB(g.x, g.y);
            a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, b); b1 = Math.max(b1, b);
            if (g.key !== 'STONE_GATE') continue;
            this.gateSpriteSet.add(g.sprite);
            if (g.extraSprites) for (const sp of g.extraSprites) this.gateSpriteSet.add(sp);
        }
        this.ringBox = this.wallGates.length ? { a0, a1, b0, b1 } : null;
    }

    /** 🔴 [2026-10-14] 险要守军据墙而守：守方士兵站在城墙圈里 ⇒ 受伤 × PASS_INSIDE_DAMAGE_TAKEN；其余一律 1 */
    private passWallTaken(o: WarMan): number {
        if (o.f !== 1 || this.defenderCityType !== 'pass' || this.battleType !== 'siege' || !this.siegeWithWalls) return 1;
        this.ensureGateInfo();
        return this.insideRing(o.x, o.y) ? PASS_INSIDE_DAMAGE_TAKEN : 1;
    }

    /** 🔴 [2026-10-14 主人令「第一波直接在城外列阵出生」→ 选方案 1「守方整个阵转过来，和最近那面城墙平行，背贴着墙」]
     *  城外阵的基点与朝向：城墙在画面上是菱形，四面墙朝外的方向是地块两条轴的梯度 (±TH, ±TW)/|·|；
     *  取最正对攻方的那一面，阵的前方 = 这面墙的朝外方向、横排 = 沿这面墙 ⇒ 最后一排到墙处处等距。
     *  最后一排最后一人落在这面墙外表面再往外 DEF_WALL_GAP；阵的中心对准这面墙的中点。
     *  墙件还没建好时，墙面位置退回城池外框估算（偏保守、稍远）。 */
    private defOutsideBase(): { x: number; y: number; fwd: { x: number; y: number }; side: { x: number; y: number }; wallOuter: number } {
        const C = this.deCityCenter, u = this.advanceVec[1];
        const nl = Math.hypot(TAC_TILE_W, TAC_TILE_H);
        const faces = [
            { x: TAC_TILE_H / nl, y: TAC_TILE_W / nl }, { x: -TAC_TILE_H / nl, y: TAC_TILE_W / nl },
            { x: TAC_TILE_H / nl, y: -TAC_TILE_W / nl }, { x: -TAC_TILE_H / nl, y: -TAC_TILE_W / nl },
            { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
        ];
        let fwd = faces[0];
        for (const f of faces) if (f.x * u.x + f.y * u.y > fwd.x * u.x + fwd.y * u.y) fwd = f;
        // 横排方向：与攻方那套出兵口同一个左右手（与 sideVec[1] 同号），队序不颠倒
        let side = { x: -fwd.y, y: fwd.x };
        const sv = this.sideVec[1];
        if (side.x * sv.x + side.y * sv.y < 0) side = { x: -side.x, y: -side.y };
        // 墙件碰撞框（地块坐标 ±0.95）在 fwd 方向上的半厚：两条地块轴在屏幕上是 (TW/2, TH/2) 与 (-TW/2, TH/2)
        const half = 0.95 * (Math.abs(fwd.x * TAC_TILE_W / 2 + fwd.y * TAC_TILE_H / 2) + Math.abs(-fwd.x * TAC_TILE_W / 2 + fwd.y * TAC_TILE_H / 2));
        let top = -Infinity;
        for (const b of this.wallGates) top = Math.max(top, (b.x - C.x) * fwd.x + (b.y - C.y) * fwd.y);
        let support: number, lat = 0;
        if (Number.isFinite(top)) {
            support = top + half;
            // 这面墙的中点：投影离最外那一线 30px 以内的墙件，取平均位置在横排方向上的分量
            let sum = 0, n = 0;
            for (const b of this.wallGates) {
                if ((b.x - C.x) * fwd.x + (b.y - C.y) * fwd.y < top - 30) continue;
                sum += (b.x - C.x) * side.x + (b.y - C.y) * side.y; n++;
            }
            if (n) lat = sum / n;
        } else {
            const W = (this.deCity?.width ?? 0) / 2, H = (this.deCity?.height ?? 0) / 2;
            support = Math.max(Math.abs(fwd.x) * W, Math.abs(fwd.y) * H);
        }
        // 按每队实际排数算最后一人：口在基点前 outFwd，兵在口后排开 (排数−1)×行距，再加本兵种半径
        let rear = Infinity;
        for (const s of this.spawns) {
            if (s.f !== 1 || s.outFwd === undefined) continue;
            const ranks = Math.max(1, Math.ceil((SIDE_CAP / SIDE_LANES) / marchFilesOf(s.key)));
            const depMax = (ranks - 1) * Math.min(marchSpacingOf(s.key), MARCH_SP_DEPTH_MAX);
            rear = Math.min(rear, s.outFwd - depMax - this.radiusOf(s.key));
        }
        if (!Number.isFinite(rear)) rear = -this.rowDepth - 180;
        const proj = support + DEF_WALL_GAP - rear;
        return { x: C.x + fwd.x * proj + side.x * lat, y: C.y + fwd.y * proj + side.y * lat, fwd, side, wallOuter: support };
    }

    private insideRing(x: number, y: number): boolean {
        const r = this.ringBox;
        if (!r) return false;
        const [a, b] = this.tileAB(x, y);
        return a > r.a0 + 1 && a < r.a1 - 1 && b > r.b0 + 1 && b < r.b1 - 1;
    }

    /** 🔴 [2026-10-12 主人令「守方可以从城门出城」] 守方在城内、目标在城外 ⇒ 先走到最近的城门，从门里出去；
     *  守方在城外、目标在城内（回城迎击入城之敌）⇒ 先走到最近的外圈城门，从门里回城。
     */
    private gateExit(m: WarMan, aim: { x: number; y: number } | null): { x: number; y: number } | null {
        if (m.f !== 1 || this.battleType !== 'siege' || !this.siegeWithWalls || WALL_PASS_TYPES.has(m.key)) return aim;
        this.ensureGateInfo();
        if (!this.ringBox) return aim;
        const r = this.ringBox, [ma, mb] = this.tileAB(m.x, m.y);
        const am = (r.a0 + r.a1) / 2, bm = (r.b0 + r.b1) / 2;
        const ccx = this.worldCX + (am - bm) * (TAC_TILE_W / 2);
        const ccy = this.worldCY + (am + bm) * (TAC_TILE_H / 2);
        // 守军一律选择离自己最近的外圈城门进出城
        let g: WarBuilding | null = null, gd = Infinity;
        for (const b of this.wallGates) {
            if (b.key !== 'STONE_GATE') continue;
            const [ba, bb] = this.tileAB(b.x, b.y);
            if (Math.min(Math.abs(ba - r.a0), Math.abs(ba - r.a1), Math.abs(bb - r.b0), Math.abs(bb - r.b1)) >= 1) continue;   // 只认外圈门
            const d = (b.x - m.x) ** 2 + (b.y - m.y) ** 2;
            if (d < gd) { gd = d; g = b; }
        }
        if (!g) for (const b of this.wallGates) {
            if (b.key !== 'STONE_GATE') continue;
            const d = (b.x - m.x) ** 2 + (b.y - m.y) ** 2;
            if (d < gd) { gd = d; g = b; }
        }
        if (!g) return aim;

        const inGateRing = ma > r.a0 - 1 && ma < r.a1 + 1 && mb > r.b0 - 1 && mb < r.b1 + 1;
        const aimInside = !!aim && this.insideRing(aim.x, aim.y);
        if (aimInside) {
            // 目标在城内：已进城内则直奔目标；尚在城外或城门通道口则经最近城门往城内走 120px 入城
            if (this.insideRing(m.x, m.y)) return aim;
            if (!inGateRing && gd > 110 * 110) return { x: g.x, y: g.y };
            const vx = g.x - ccx, vy = g.y - ccy, vl = Math.hypot(vx, vy) || 1;
            return { x: g.x - vx / vl * 120, y: g.y - vy / vl * 120 };
        }
        // 含城门通道本身（r.a0-1..r.a1+1）：原 insideRing 在 r.a0+1（门内 1 格）就提前判成已出城，导致守军走到门内口就失去出城引导、在城门附近来回打转
        if (!inGateRing) return aim;
        // 🔴 [2026-10-14 主人令「全改」] 门还是这座门，路改成沿这座门的流场绕过去（不再直线顶墙堆在城角）；已到门外附近 / 无路才走下面的直线
        const wp = this.flowWaypoint(m.x, m.y, this.defGateFlow?.get(g) ?? null, -1, 2, FLOW_SUB);
        if (wp) return wp;
        // 目标点放在城门外侧约 120px（从城中心指向城门的方向），出了门就明确在城外，不会在门口来回折返
        const vx = g.x - ccx, vy = g.y - ccy, vl = Math.hypot(vx, vy) || 1;
        return { x: g.x + vx / vl * 120, y: g.y + vy / vl * 120 };
    }

    /**
     * 🔴 [2026-10-15 主人令「乱入者在这里反复移动，请检查并修复。这是寻敌逻辑的问题吗，如果是，我建议应该简化，而不是越弄越负责」]
     * 简化后的四级寻敌移动管道（乱入者与本队普通士兵完全共用同一套逻辑）：
     *   ① 视野内（MARCH_R）最近的敌人 ⇒ 环绕包抄（CHASE_RING）；
     *   ② 攻城武器 ⇒ 最近的第一档建筑目标；
     *   ③ 本队统一锁定的目标（`laneTargets`，敌方分队或城门/建筑）；
     *   ④ 兜底 ⇒ 攻城方奔中心建筑，守城方回城寻敌，野战奔全图最近敌人或敌军重心。
     */
    private aimAtRaw(m: WarMan): { x: number; y: number } | null {
        this.releaseReservedTarget(m);
        const ra = Math.atan2(m.jy, m.jx);
        const ringX = Math.cos(ra) * CHASE_RING;
        const ringY = Math.sin(ra) * CHASE_RING;

        // ① 视野内最近的敌兵/建筑（reserve=true 按 claims 上限分流）
        const near = this.search(m, MARCH_R, MIN_RANGE_TYPES[m.key] ?? 0, true);
        if (near) {
            m.reservedFoe = near;
            return { x: near.x + ringX, y: near.y + ringY };
        }

        // ② 攻城武器：走向第一档目标里离自己最近的那个
        if (m.siegeW && this.battleType === 'siege') {
            let g: WarBuilding | null = null, gd = Infinity;
            for (const b of this.siegeFirstTier(m.f as 0 | 1)) {
                const d = Math.hypot(b.x - m.x, b.y - m.y);
                if (d < gd) { gd = d; g = b; }
            }
            if (g) return { x: g.x + m.jx, y: g.y + m.jy };
        }

        // ③ 本队统一目标（含乱入者）：敌方分队或城门/建筑
        const lt = (m.lane >= 0 && !m.siegeW) ? this.laneTargets.get(m.lane) : undefined;
        if (lt?.targetLane !== undefined) {
            return { x: lt.x + ringX + m.jx, y: lt.y + ringY + m.jy };
        }
        if (this.battleType === 'siege' && m.f === 0 && !m.siegeW) {
            if (this.centerBld === undefined) this.centerBld = this.pickCenterBuilding();
            const c = this.centerBld ?? (this.deCity ? this.deCityCenter : null);
            if (c) {
                this.ensureGateInfo();
                // 城墙一处都没破、且自己在城外时，先集结到本队锁定的城门外侧
                if (!this.ringOpen() && !this.insideRing(m.x, m.y) && !WALL_PASS_TYPES.has(m.key)) {
                    let gate: WarBuilding | null = (lt?.targetBld && lt.targetBld.key === 'STONE_GATE' && this.wallStanding(lt.targetBld)) ? lt.targetBld : null;
                    if (!gate) {
                        let gd = Infinity;
                        for (const b of this.wallGates) {
                            if (b.key !== 'STONE_GATE' || b.hp <= 0 || b.sprite.destroyed || b.sprite.obstructionDisabled) continue;
                            const d = (b.x - m.x) ** 2 + (b.y - m.y) ** 2;
                            if (d < gd) { gd = d; gate = b; }
                        }
                    }
                    if (gate) {
                        const vx = gate.x - c.x, vy = gate.y - c.y, vl = Math.hypot(vx, vy) || 1;
                        return { x: gate.x + (vx / vl) * 150 + m.jx, y: gate.y + (vy / vl) * 150 + m.jy };
                    }
                }
                // 流场不可达（如险要内外墙夹道）时，就近打本队目标或最近立着的建筑/城门
                if (this.siegeWithWalls && !(this.flowDist && (Number.isFinite(this.flowDistAt(m.x, m.y))
                    || this.flowWaypoint(m.x, m.y, this.flowDist, 6 * FLOW_SUB, 6 * FLOW_SUB, 4)))) {
                    let t: WarBuilding | null = (lt?.targetBld && this.wallStanding(lt.targetBld)) ? lt.targetBld : null;
                    if (!t) {
                        let td = Infinity;
                        for (const b of [...this.defBuildings, ...this.wallGates.filter(g => g.key === 'STONE_GATE')]) {
                            if (b.f === m.f || !this.wallStanding(b)) continue;
                            const d = (b.x - m.x) ** 2 + (b.y - m.y) ** 2;
                            if (d < td) { td = d; t = b; }
                        }
                    }
                    if (t) return { x: t.x + ringX, y: t.y + ringY };
                }
                const targetGoal = (lt?.targetBld && this.wallStanding(lt.targetBld)) ? lt.targetBld : c;
                return { x: targetGoal.x + m.jx, y: targetGoal.y + m.jy };
            }
        }
        if (lt) {
            return { x: lt.x + ringX + m.jx, y: lt.y + ringY + m.jy };
        }

        // ④ 全局兜底：攻城战守方优先找城池附近之敌或回城防区驻守，绝不扑向攻方营地蹲守乱入者
        if (this.battleType === 'siege' && m.f === 1) {
            const cityCen = this.deCity ? this.deCityCenter : this.spawnBases[1];
            let bestCityFoe: WarMan | null = null, bestCityD2 = Infinity;
            for (const o of this.men) {
                if (o.f === m.f || o.hp <= 0 || o.hero || this.isInsideAttackerCamp(o.x, o.y)) continue;
                const d2 = (o.x - cityCen.x) ** 2 + (o.y - cityCen.y) ** 2;
                if (d2 < bestCityD2) { bestCityD2 = d2; bestCityFoe = o; }
            }
            if (bestCityFoe) {
                return { x: bestCityFoe.x + m.jx, y: bestCityFoe.y + m.jy };
            }
            return this.defenderCityReturnGoal(m);
        }
        const globalNearest = this.search(m, 13000, MIN_RANGE_TYPES[m.key] ?? 0, false);
        if (globalNearest) {
            return { x: globalNearest.x + m.jx, y: globalNearest.y + m.jy };
        }
        const cen = this.enemyCen[1 - m.f];
        return cen ? { x: cen.x + m.jx, y: cen.y + m.jy } : null;
    }

    /**
     * 战场边界 = 屏幕：兵的任何移动（追目标 / 风筝后撤 / 软推挤）都不许走出屏幕。
     * 🔴 2026-08-13 修「寻敌走出屏幕」：三处移动原本都不 clamp，追目标/风筝/推挤都可能把兵推出屏幕。
     *    统一在此收口，margin = 半身 UNIT_PX/2。
     */
    private fieldBound(x: number, y: number): [number, number] {
        const mx = UNIT_PX * 0.5, my = UNIT_PX * 0.5;
        // 🔴 [2026-10-11 主人「你删除旧的13战术模式的战场界限了吗」] **旧 13 的界限就是这条兜底**：
        //    拿不到 WebGL 地面层时退回「夹在屏幕内」(vw ± mx)。已删除。
        //    现在无论用哪种地面渲染，战场界限一律 = 120×120 格地图的矩形（±TAC_MAP_HALF_W / ±TAC_MAP_HALF_H，屏幕居中）。
        const minX = this.worldCX - TAC_MAP_HALF_W + mx, maxX = this.worldCX + TAC_MAP_HALF_W - mx;
        const minY = this.worldCY - TAC_MAP_HALF_H + my, maxY = this.worldCY + TAC_MAP_HALF_H - my;
        return [Math.min(Math.max(x, minX), maxX), Math.min(Math.max(y, minY), maxY)];
    }

    /**
     * 本兵此刻该回本队队形吗：该回就返回自己的槽位坐标，不该回返回 null。
     *
     * 🔴 [2026-10-03 主人令「我们现在的战术模式是分10个分队……每一队战斗的时候就分散，
     *    移动的时候就回归队形」] 本方法是**全文件唯一的槽位换算处** —— 脱战走位、4 秒换目标、
     *    走位朝向三处都调它，不许各写一份（同一个算法两份副本必定漂移）。
     * 判据三条，缺一不可：
     *   ① 本队有领队、且不是自己 —— 领队走自己的 aimAt（寻敌/巡逻）领队前行，不被拖；
     *   ② 自己「无敌人」已满 LANE_REGROUP_SEC —— 挡住索敌 0.2s 节流那批假空窗（见该常数）；
     *   ③ 玩家本人例外：点地面下的那道令没走完就不归队（见 heroOrderPending）。
     */
    private laneSlotTarget(m: WarMan, leaders: Map<number, WarMan>): [number, number] | null {
        // 攻城战（真有城墙那种）不归队：主人 2026-08-23 定「攻城战不再列阵行军，城墙坍塌后直接各自索敌接战」。
        // 城寨 / 漠北蒙古守方按野战算（siegeWithWalls=false），照常归队。
        // 🔴 [2026-10-11 主人报「战斗刚开始士兵全挤成一排」] 攻城战此前**一律没有阵位**
        //    （本函数第一行就 return null）⇒ 全军落到 aimAt ⇒ 全队追同一个点 ⇒ 一排。
        //    现在攻城战同样走阵位：列阵推进时整队方块平移，够不着不追（见 step 里 m.march 分支）。
        //    旧令「攻城不列阵行军」由 step 的 inReach 判定照顾：接敌即自由接战，不再回槽位。
        if (m.lane < 0) return null;
        // 🔴 [2026-10-12 主人报「守方寻敌不知道走城门还是直接找敌人」] 城墙还挡路时守方不归队：各自走城门出城，免得跟着卡在城里的领队打转
        if (m.f === 1 && this.battleType === 'siege' && this.siegeWithWalls) return null;
        // lane 就是 spawns 的下标（建口时 lane = this.spawns.length，见 start），这里仍核一次防漂
        const sp = this.spawns[m.lane];
        if (!sp || sp.lane !== m.lane) return null;
        const leader = leaders.get(m.lane);
        if (!leader || leader === m) return null;
        if (!m.hero && (m.noFoeSec ?? 0) < LANE_REGROUP_SEC) return null;
        if (this.heroOrderPending(m)) return null;
        const uFwd = this.advanceVec[m.f];
        const uSide = this.sideVec[m.f];
        const dDep = m.dep - leader.dep;
        const dSide = m.slotY - leader.slotY;
        const sx = leader.x - uFwd.x * dDep + uSide.x * dSide;
        const sy = leader.y - uFwd.y * dDep + uSide.y * dSide;
        return this.fieldBound(sx, sy);
    }

    /**
     * 玩家本人**有还没走完的令**（点地面）：这道令优先于一切自动换目标。
     * 🔴 [2026-10-03] 为什么必须单独立这一条：UI 写的是「点战场地面：玩家前往该点」
     *    （`PlayerScene13Control` 的提示原文），可真机实测（`scratch/_probe_lane_regroup_effects.mjs` ③）
     *    点完之后 **25/25 帧**被自动逻辑改写：归队分支把它改成领队槽位、或 `aimAt` 把它改成
     *    敌军重心/巡逻航点 —— 玩家点哪儿都没用。所以「点完没走到」这一整个窗口内，
     *    既不许归队改写、也不许 aimAt 改写（**是调用点的事**：光让 laneSlotTarget 返回 null
     *    不够，那样会掉进 aimAt 分支照样被改）。
     */
    private heroOrderPending(m: WarMan): boolean {
        return m.hero === true && this.heroClickOrder !== null;
    }

    /**
     * 把单位推出 DE 地图对象的占地矩形。碰撞尺寸来自 DAT 的地图格口径，
     * 在 2:1 投影中先还原为地图坐标，沿较浅穿透轴推出，因而会沿树/岩石边缘滑行。
     */
    private resolveWorldObstructions(m: WarMan, activeObstructions: typeof this.decorSprites): void {
        let px = m.x, py = m.y;
        const unitTileRadius = this.radiusOf(m.key) / 40;
        // 🔴 [2026-10-12] 占地按 DE 原生一格（96×48）换算：物件素材按原生像素画，原用旧网格 64×32 ⇒ 碰撞框只有画面的 2/3
        const TILE_W = TAC_TILE_W, TILE_H = TAC_TILE_H;
        if (m.f === 1 || WALL_PASS_TYPES.has(m.key)) this.ensureGateInfo();
        for (let pass = 0; pass < 3; pass++) {
            let changed = false;
            for (const object of activeObstructions) {
                if (m.f === 1 && this.gateSpriteSet?.has(object)) continue;   // 🔴 [2026-10-12] 守方从自己城门进出
                if (WALL_PASS_TYPES.has(m.key) && (this.wallBySprite?.has(object) || this.gateSpriteSet?.has(object))) continue;   // 🔴 [2026-10-13 主人令] 穿墙特种兵可以穿墙
                const obstruction = object.obstruction!;
                const dx = px - object.x, dy = py - object.y;
                let mapX = dx / TILE_W + dy / TILE_H;
                let mapY = dy / TILE_H - dx / TILE_W;
                const limitX = obstruction.x + unitTileRadius;
                const limitY = obstruction.y + unitTileRadius;
                if (Math.abs(mapX) < limitX + 0.15 && Math.abs(mapY) < limitY + 0.15) {
                    if (object.obstructionReleaseAfterSec !== undefined) object.obstructionTouched = true;
                }
                if (Math.abs(mapX) >= limitX || Math.abs(mapY) >= limitY) continue;

                const penX = limitX - Math.abs(mapX);
                const penY = limitY - Math.abs(mapY);
                if (penX < penY) {
                    // 🔴 [2026-10-18 主人报「这个兵在城门这里呆着总是闪」] 兵正好压在城门中线上时，
                    //    Math.sign(mapX) 会在 ±0 间逐帧翻转；旧代码再跟 prevMapX 翻 ⇒ 人被左右推来推去闪。
                    //    中线附近直接用终身不变的 zid 奇偶定侧，位置稳定后不再来回换边。
                    const stableSign = (m.zid & 1) ? 1 : -1;
                    const sign = Math.abs(mapX) > 0.01 ? Math.sign(mapX) : stableSign;
                    mapX = sign * limitX;
                } else {
                    const stableSign = (m.zid & 1) ? 1 : -1;
                    const sign = Math.abs(mapY) > 0.01 ? Math.sign(mapY) : stableSign;
                    mapY = sign * limitY;
                }
                if (m.f === 0) { const wb = this.wallBySprite.get(object); if (wb) { m.blockedBy = wb; m.blockedAt = this.battleSec; } }
                px = object.x + (mapX - mapY) * (TILE_W / 2);
                py = object.y + (mapX + mapY) * (TILE_H / 2);
                changed = true;
            }
            if (!changed) break;
        }
        m.x = px;
        m.y = py;
    }

    /**
     * 接触交战音景（land_contact）的开关：**只跟近战接触走**。
     *
     * 🔴 [2026-09-15 主人定]「这个音效主要是近战音效，战斗到后期往往只剩下远程兵了，
     *    可以停吗？渐隐。」——改前它是一次性循环，起了就垫到演出退场，
     *    近战全死光只剩弓弩对射时绞杀声还在响。
     *
     * 判据：本帧 `meleeContactCount > 0`（有近战兵够得着活人）就开；
     * 连续 MELEE_QUIET_SEC 秒一个都没有才淡出 —— 给一段缓冲是必要的，
     * 近战对砍本来就会短暂脱离、换目标、被推开，按「这一帧有没有」直接开关会一秒抽好几次。
     * 淡入淡出由 AudioManager 的 startLoop/stopLoop 自带（FADE.loop），
     * 且两者互相撤销：淡出途中又接上近战，会当场回到正常音量，不会先静音再重来。
     */
    private tickContactSfx(dt: number): void {
        // 🔴 [2026-10-02 主人定]「战术模式下，有一个我自己做的战斗音效。请提高他的音量和播报一致，但是不要和播报重叠播放。」
        // 播报（战役播报、剧情解说或任何语音）进行中绝不播放战斗音效，彻底杜绝重叠播放
        if (this.battleBriefingSpeaking || audioManager.isSpeechDucking() || speechAnnouncer.isSpeaking()) {
            if (this.contactSfxOn) {
                this.contactSfxOn = false;
                audioManager.stopSceneLoop('land_contact');
            }
            return;
        }

        if (this.meleeContactCount > 0) {
            this.meleeQuietSec = 0;
            if (!this.contactSfxOn) {
                this.contactSfxOn = true;
                audioManager.startSceneLoop('land_contact');
            }
            return;
        }
        if (!this.contactSfxOn) return;
        this.meleeQuietSec += dt;
        if (this.meleeQuietSec >= MELEE_QUIET_SEC) {
            this.contactSfxOn = false;
            audioManager.stopSceneLoop('land_contact');
        }
    }

    private step(dt: number): void {
        if (this.over) return;
        // 近战接触音景：每帧重新数，本帧的计数在下面的兵种循环里累加，循环跑完在 tickContactSfx 里结账
        this.meleeContactCount = 0;
        // ── 打不完的检测（当前只观察不动手，见 STALL_GUARD_ENFORCE）──
        this.battleSec += dt;
        const hardStop = this.battleSec > HARD_STOP_SEC;
        // lastKillSec > 0 = 本场已经死过人；第一滴血之前不启用这条（开局双方还在相向而行）
        const noKill = this.lastKillSec > 0 && this.battleSec - this.lastKillSec > NO_KILL_SEC;
        if ((hardStop || noKill) && !this.stallReported) {
            this.stallReported = true;
            const why = hardStop ? 'hardStop' : 'noKillStall';
            const quietSec = +(this.battleSec - this.lastKillSec).toFixed(1);
            console.warn(
                `⚠️ [Scene13War] 这一局判定为「打不完」（${why}）：已打 ${this.battleSec.toFixed(0)}s、`
                + `${quietSec}s 没人阵亡。当前放行不收场（STALL_GUARD_ENFORCE=false），已落一条 stallDetected 记录。`,
            );
            this.diagPush(why, { sec: +this.battleSec.toFixed(1), quietSec });
            this.diagReport('stallDetected:' + why);   // 挂死也留档（不占最终那条记录的名额）
            if (STALL_GUARD_ENFORCE) {
                this.forceResultByRatio(0.85);
                return;
            }
        }
        this.spawnTick(dt);
        // 🔴 [2026-09-09 主人定] 玩家阵亡 10 秒复活倒计时
        if (this.heroRespawnTimer > 0) {
            this.heroRespawnTimer -= dt;
            if (this.heroRespawnTimer <= 0) {
                this.heroRespawnTimer = 0;
                this.respawnHero();
            }
        }
        // 🔴 [2026-08-29 主人需求] 城墙内侧箭塔开火（射程内最近攻方士兵 → 射箭 + 开火火花；纯视觉）
        // 🔴 [2026-10-15 主人令] 城墙的**两条**坍塌路径（都只对"已经掉血"的墙生效）：
        //    ① **受伤自动坍塌**：每 10 秒塌一处掉过血的墙/门/垛/栅栏，先塌最早挨打的那一处（`collapseNextWallGap`）；
        //    ② 被打穿：血归零立刻塌（`collapseOneWall`，见 onDefBuildingHit / 投射物伤害那两处）。
        //    城内建筑、箭塔、营寨**不自动坍塌** —— 它们只能被打到 0 血后倒（见 `onDefBuildingHit`）。
        // 🔴 [2026-10-11 主人令「确保士兵通行」] 下面 30 秒这一下只做「非墙装饰去碰撞」，不塌任何东西。
        if (this.battleType === 'siege' && this.battleSec >= this.nextWallGapSec && this.nextWallGapSec < 1e9) {
            this.nextWallGapSec = this.collapseNextWallGap() ? this.nextWallGapSec + 10 : 1e9;
        }
        if (this.battleType === 'siege' && !this.wallAutoCollapsed && this.battleSec >= 30) {
            this.wallAutoCollapsed = true;
            this.clearNonWallObstructions();
        }
        if (this.battleType === 'siege' && this.siegeWithWalls) this.ensureGateInfo();
        if (this.battleType === 'siege' && this.siegeWithWalls && this.deployT <= 0 && this.battleSec - this.flowBuiltAt >= 1) this.buildFlowField();
        // 🔴 [2026-10-18 主人定] 当城门被摧毁后，守方集体发动反攻：立即解除城内原位驻守限制（guardPost 与 holdLanes），全军主动出击
        if (this.battleType === 'siege' && this.isDefenderGateDestroyed()) {
            this.holdLanes.clear();
            for (const u of this.men) {
                if (u.f === 1 && u.guardPost) {
                    u.guardPost = undefined;
                    u.stuckT = 0;
                    u.aimT = 0;
                }
            }
        }
        this.stepArrowTowers(dt);
        // 开场列阵待命倒计时：阶段内全军静止渐显，结束才开打（主人 2026-08-16）
        if (this.deployT > 0) {
            this.deployT -= dt;
            if (this.deployT <= 0) {
                // 🔴 [2026-08-30 修·滑步] 部署期全军静止，stuckT 累计到几秒高位；
                //    部署结束开始移动时 stuckT 仍 > STUCK_IDLE_SEC，渲染层误播待命帧 = 人平移脚不迈（滑步）。
                //    部署结束这一帧清空 stuckT，移动立刻切回走路帧。
                for (const m of this.men) m.stuckT = 0;
                if (!this.battleBriefingSpeaking && !audioManager.isSpeechDucking() && !speechAnnouncer.isSpeaking()) {
                    audioManager.play('battle_horn', { fadeInMs: 150 });
                }
            }
        }
        const deploying = this.deployT > 0;
        this.tickScene13Skills(dt, deploying);
        // 敌军重心（每帧 O(n)，供 aimAt 兜底）
        const cx = [0, 0], cy = [0, 0], cn = [0, 0];
        for (const m of this.men) { cx[m.f] += m.x; cy[m.f] += m.y; cn[m.f]++; }
        this.enemyCen = [0, 1].map(f => cn[f] ? { x: cx[f] / cn[f], y: cy[f] / cn[f] } : null);
        this.marchTick(dt, deploying);

        this.rebuild();
        if (!deploying) this.updateLaneTargets();
        // 先登记全体有效锁定，新索敌者才能看见排在自己后面的同伴已占用的名额。
        this.reserveExistingTargets(deploying);

        // 🔴【分队机制：战斗时分散，移动时回归队形】每帧选出存活分队的**锚点**（＝队员归队时的队形原点）。
        //    🔴 [2026-10-03 主人令「换成中心兵」] 锚点＝**本队出生槽位最靠阵列中心的那位存活兵**
        //       （原规则：优先存活旗手，否则本队最早出生的存活兵）。
        //       他阵亡 → 下一帧自动换成「剩下的里面最靠中心的」，不需要计时器或额外状态。
        //    ⚠️ 打分只用**出生槽位**（`dep` / `slotY`，出生时定死、终身不变）与阵列几何，
        //       **与"现在谁还活着"无关** —— 这是实测逼出来的：第一版按「存活成员的槽位重心」取最近者，
        //       重心会随阵亡微移，而 48 与 72 两格离重心几乎等距 ⇒ 锚点在并列候选间来回翻
        //       （真机实测 87 次换锚点 / 38s，其中只有 4 次是真阵亡），全队跟着反复改坐标：
        //       跟随断档率 0.93% → 2.24%、反转率 0.024 → 0.034（量具 scratch/_probe_center_anchor.mjs）。
        //       改成固定打分后，**只在中心兵阵亡（或有更靠中心的新兵到位）时才换人**。
        //    ⚠️ 绝不用实时坐标：实时坐标每帧都在动，那样算出来的"中心"会带着全队一起抖 ——
        //       2026-10-03 刚修完「锚点抖 → 全队跟着抖」那一整条链（见 LANE_TRACK_EPS 与 _probe_tremble_trace.mjs）。
        //    ⚠️ 玩家本人永不担任锚点：他是被锚定的一方（绑到本队），不能反过来当锚点把整队拖在身后；
        //       他 slotY=0、站在相同兵种出兵口位置（dep=0，见 start 里 heroDep）正是阵列中心，所以这条排除必须留着。
        const laneLeaders = new Map<number, WarMan>();
        const laneLeaderScore = new Map<number, number>();
        for (const m of this.men) {
            if (m.hp <= 0 || m.lane < 0 || m.hero || m.guardPost) continue;
            // 阵列几何：出生槽位 = 第 rank 排（间距 spDep）× 第 file 列（间距 sp），
            // 每批每口 50 个精灵（SIDE_CAP ÷ SIDE_LANES = 500 ÷ 10）→ 排数 = 50 ÷ 列数
            const sp = marchSpacingOf(m.key);
            const spDep = Math.min(sp, MARCH_SP_DEPTH_MAX);   // 与出兵排阵同一式（行距＝列距）
            const ranks = Math.max(1, Math.ceil((SIDE_CAP / SIDE_LANES) / marchFilesOf(m.key)));
            const depC = ((ranks - 1) / 2) * spDep;
            const ey = m.slotY / sp;
            const ex = (m.dep - depC) / spDep;
            const score = ex * ex + ey * ey;
            const best = laneLeaderScore.get(m.lane);
            if (best === undefined || score < best) {   // 平手时先遇到的（＝出生更早的）胜出，确定且稳定
                laneLeaders.set(m.lane, m);
                laneLeaderScore.set(m.lane, score);
            }
        }
        // 🔴 [2026-10-03 主人令]「攻城就是不归队才没事，野战有归队所以颤抖。如果野战归队少，不就颤抖也少了。
        //    附近有敌人就不用归队。」
        //    → **净空判据**：本队锚点周围 MARCH_R（300px，现成的「行军索敌半径」，含义本来就是
        //      「这个圈里出现敌兵就算遇敌」，不新造尺度）内有活敌 → 这队**本帧不设锚点** →
        //      `laneSlotTarget` 拿不到锚点直接返回 null → 全队照旧各自索敌/散开，整队不归队。
        for (const [lane, L] of laneLeaders) {
            const laneFighting = this.men.some((u) => u.hp > 0 && u.f === L.f && u.lane === lane && u.foe && !('sprite' in u.foe) && u.foe.hp > 0);
            if (laneFighting || this.search(L, MARCH_R, 0, false)) laneLeaders.delete(lane);
        }

        for (const m of this.men) {
            this.releaseReservedTarget(m);
            if (m.hp <= 0) continue;
            // 开场列阵待命：静止渐显，不索敌、不移动、不攻击（主人 2026-08-16）
            if (deploying) {
                m.st = 0;
                m.foe = null;
                m.fightT = 0;
                if (m.fadeT > 0) m.fadeT -= dt;
                m.ph += dt * 8 / 1.5;   // 待命动画（与残局待命同速）
                continue;
            }
            // 🔴 [2026-10-14 主人令「看到敌人再发起进攻，或者挨打发起进攻」「想一个让守方不分兵的方法」]
            // 🔴 [2026-10-15 主人令「改为看到敌人就发起反击」「攻守双方开战的距离太近了，敌人都冲到眼前了，才开战，请拉开点距离」]
            //    注意此处在 `m.next -= dt`（10165 行）之前，故须用 `m.next <= dt` 判断本帧索敌到点（原写 `m.next <= 0` 因下方的重置恒为 false 导致远距索敌从未执行）；
            //    目视迎战距离拉大至 600px，敌军进入阵前 600px 即全军迎战。
            if (this.holdLanes.size && m.lane >= 0 && this.holdLanes.has(m.lane)
                && (!this.marching || m.foe || (m.hurtAt !== undefined && this.battleSec - m.hurtAt < 1) || (m.next <= dt && this.search(m, 600, 0, false)))) {
                this.holdLanes.clear();
                if (this.marching) {
                    this.marching = false;
                    for (const u of this.men) {
                        u.march = false;
                        u.noFoeSec = LANE_REGROUP_SEC;
                        u.stuckT = 0;
                        u.netT = 0;
                    }
                }
            }
            // 🔴 [2026-08-23 → 2026-10-15 规则沿革]
            //    · 曾规定「攻城战开局双方按兵不动（30 秒待命），等攻城器把墙砸塌」（2026-08-23/09-09）；
            //    · 2026-10-11 去掉待命闸、2026-10-13「所有都改为开局就动」⇒ **开局待命已作废**
            //      （现在只有上面的 `deploying` 列阵渐显 2.5 秒会让人站住）。
            //    · 墙的坍塌规则现行：**受伤的墙每 10 秒自动塌一处**（2026-10-15 令）＋ 被打到 0 血立刻塌
            //      （见 step 里 `collapseNextWallGap` 与 `collapseOneWall`）；攻城武器照旧优先砸最近的门/墙。
            // [2026-09-05 玩家] 玩家有键盘输入 → 本帧只走不打；受控编队「待命」= 不动、够得着照打
            if (m.hero && this.stepHeroInput(m, dt)) continue;
            // 玩家的点地面令：走到就作废（之后归队/索敌照旧接管）
            if (m.hero && this.heroClickOrder
                && (m.x - this.heroClickOrder.x) ** 2 + (m.y - this.heroClickOrder.y) ** 2 <= ARRIVE_EPS * ARRIVE_EPS) {
                this.heroClickOrder = null;
            }
            // 🔴 [2026-10-18 主人定] 攻城战第二波以后出门点还是9建筑，刷新后看城门是否被击毁，没有的话原地待命，被击毁城门发起反攻
            const isGuard = !!m.guardPost;
            // 🔴 [2026-10-15 主人定] 每个目标最多 4 队攻击；超出 4 队且场上已无其他可打目标的分队，原地列阵待命
            const laneStandby = !this.marching && !m.march && m.lane >= 0 && !this.heroOrderPending(m) && !m.siegeW && !isGuard
                && !this.remnantLanes.has(m.lane) && !this.laneTargets.has(m.lane);
            // 🔴 [2026-09-09 主人定「两个选项：自动 / 待命」] 待命要把**玩家本人**也算进去，
            //    原来写的是 `!m.hero`，本人被排除在待命之外。
            const holdCmd = this.playerCmd === 'hold' && (m.hero || this.playerCtlLanes.has(m.lane));
            if (holdCmd || isGuard) { m.tx = m.x; m.ty = m.y; }
            const wt = this.statsFor(m.key, m.f);
            const stats = wt;
            // 地形细分减速（森林 ×0.5、浅滩/沼泽 ×0.6、深水 ×0.3、平地 ×1.0）；【攻】振己威狂暴移速 ×1.20
            const spdK = this.terrainSpeedAt(m.x, m.y) * (this.skillFrenzyTimer[m.f] > 0 ? 1.20 : 1.0);
            // 【混】乱阵：处于混乱定身期的敌方前线士兵原地混乱定身 3.5 秒（停止攻击与移动，受近战 1.4x 伤害）
            if (this.skillPanicTimer[m.f] > 0 && !m.march && !m.hero && !m.siegeW && !isGuard) {
                m.st = 0;
                m.foe = null;
                m.fightT = 0;
                m.lock = 0;
                m.stuckT = 0;
                m.stepMax = 0;
                m.tx = m.x;
                m.ty = m.y;
                if (m.fadeT > 0) m.fadeT -= dt;
                m.ph += dt * (8 / LOOP_WINDOW_IDLE_SEC);
                continue;
            }
            // 🔴 [2026-10-13 全面体检抓出·已修] 贴身距离必须**补偿单位自身碰撞半径**，否则大型攻城器永远打不到墙：
            //    墙/门的碰撞半宽 0.95 格，松开后停在 `53.67×(0.95 + radiusOf/40)` px 处
            //    （53.67 = √(TAC_TILE_W²/4 + TAC_TILE_H²/4) 的等轴换算，见 resolveWorldObstructions）。
            //    实测：步兵 r=8 → 61.7px、骑兵 r=10 → 64.4px（都 <65 ✅），
            //    但**攻城槌 r=18 → 75.1px、重型攻城 r=20 → 77.8px（恒 >65 ❌）** ⇒ 这两类对墙/门的攻击
            //    整条链（扣血、D25/D50/D75 破损档、`hitAt` 十秒坍塌排序）**从未生效过**，只剩定时坍塌在动。
            //    加回自身半径后攻城槌 65+18=83px > 75.1 ⇒ 够得着；步兵/骑兵仍然按 65 且远大于 61.7/64.4 ⇒ 行为不变。
            // 🔴 [2026-10-15 DE 高地机制] 射程随高地平滑提升：高打低每高 1 级射程 +5%（最高 +35%）；低打高不减
            const myElev = this.elevationLevelAt(m.x, m.y);
            const foeElev = m.foe ? this.elevationLevelAt(m.foe.x, m.foe.y) : 0;
            const dElev = myElev - foeElev;
            const elevRangeMul = (stats.rng > 65 && dElev > 0.2) ? (1.0 + Math.min(7, dElev) * 0.05) : 1.0;
            const REACH = Math.max(stats.rng * elevRangeMul, 65) + this.radiusOf(m.key);   // 出手扣血（近战贴身 65 + 自身半径 / 远程 rng）
            // 🔴 [2026-10-18 主人定] 城门还没破的第二波以后守军（isGuard）不要动、只原地攻击 ⇒ 索敌半径严格等于自身攻击距离 REACH
            const SIGHT = isGuard ? REACH : Math.max(stats.sight ?? 160, stats.rng > 65 ? Math.round(stats.rng * 1.15) + 40 : 0);   // 寻敌/丢目标迟滞（DE LOS，已含羽箭/锥头/护腕视野科技；保证远程视野始终大于最大射程）
            // 火矛手充能冷却递减（DE 30 秒充能，出生即满 → 首次进战就喷）
            if (FIRE_LANCER_TYPES.has(m.key)) m.chargeCd = Math.max(0, (m.chargeCd ?? 0) - dt);

            // 目标每 0.2s 重找（错开相位）；目标死/跑远保持不换
            // 🔴 [2026-08-25 已实测否决「去掉这 0.2s 空窗」] 别再动它，两次改法都试过了：
            //    ① 丢目标当帧立即重找（NOGAP=1）：真·索敌失败 3.1%→2.9%，几乎无收益；
            //       且连带多消耗一次 aimT，SEED 23 用时 275s→**900s 打满**。
            //    ② 只补一次 search、不碰 aim/next 节奏（NOGAP=2，隔离变量）：3.1%→3.0%，
            //       仍无收益，SEED 11 打满 900s。
            //    根因：那 3.1%「视野内有敌人却无目标」的兵，实测 **100% 都卡在这个节流窗内**
            //    （m.next>0，下次到点就锁上），没有一个是真找不到目标 —— search 的
            //    `free ?? best` 兜底保证了视野内有敌人就一定有目标。而且窗内的兵**照常朝
            //    aimAt 落点走**，不是站着发呆（那是已删的 claims 闸造成的，见下面 keep）。
            //    → 这 3.1% 就是 0.2s 节流的占空比本身，不是缺陷。
            //    ⚠️ DE 本体**没有**「索敌间隔/目标重获延迟」这种字段（已查 empires2_x2_p1.dat：
            //      只有 bird.search_radius 索敌半径、type_50.frame_delay 出手帧延迟、line_of_sight），
            //      所以别拿「DE 也有反应延迟」当理由——那是编的。留着的理由只有一条：实测去掉没收益还有害。
            //    复现：PROBE=1 [NOGAP=1|2] SEED=<n> node tools/war_sim.mjs
            m.next -= dt;
            // 🔴 [2026-08-23 修·攻方撞墙蹭] 攻城战攻方锁定的正面 linked 墙/门：打墙不封顶——
            //    DE 攻方人挤人攻墙，墙是长条，separate 软推挤会沿墙铺开不会挤一个点；
            //    否则 300+ 攻方兵只有 ~85 名额锁到墙，其余每帧锁不到墙 → 丢目标 → 穿墙蹭。
            // 🔴 [2026-08-23 主人定·重设计] 攻城武器凿墙：锁定的墙 hp 归零（视觉破损到顶 D75）也继续凿到
            //    40 秒墙塌（obstructionDisabled → siegeWallKeep 失效）才丢目标——防攻城锤打空一段后
            //    转追墙内守兵、撞墙（墙 40 秒前仍阻挡）来回蹭。
            // 🔴 [2026-08-25 修·「看得见敌人却站着不打」] keep 里**绝不能**再加
            //    `m.foe.claims < SPREAD_CAP`（原来有，已删）。两条理由：
            //    ① 与 search 的兜底自相矛盾：search 是 `free ?? best` —— 找不到空闲目标时
            //       **照旧返回最近的那个**。keep 说「你的目标满员了，走开」，search 下一句
            //       又把同一个人还给它 → 挤掉→重找→再挤掉，无限循环。
            //    ② 挤掉的那一帧若 m.next 还没归零（刚 search 过），走的是下面
            //       `else if (!keep) m.foe = null` —— 目标直接清空，**最多原地发呆 0.2 秒**。
            //    实测（war_sim，500 对镜，SEED 7/11/23 方向一致，口径已对齐游戏层的实时 claims）：
            //         带这道闸 → 真·索敌失败（视野内有敌人却无目标）8.4~12.2%，打/走切换 0.83~1.24 次/人·秒
            //         去掉      → 3.1~3.2%，0.24~0.25 次/人·秒；换目标次数几乎不变（0.26→0.24）
            //       —— 说明代价全在「丢目标后的空窗」，不在「换目标」。铺开 317→388px，用时持平。
            //    SPREAD_CAP 的设计本意是**分配新目标时**分流（search 里的 free 分支：
            //    「让第 5 个人去找次近的空闲目标」），不是把已经在交战的人赶走。DE 同理：
            //    单位锁定目标后打到目标死，不会因为「这人已经被 4 个人打了」自己走开。
            const previousTarget = m.foe;
            // 🔴 [2026-10-12 主人令「士兵优先攻击士兵」] 普通士兵正在打墙/建筑时，每个索敌周期重搜一次：
            //    视野里出现敌兵就改打兵（search 已是兵优先；没兵会重新选回墙）。
            // 🔴 [2026-10-15 主人令「让每一队有一个统一的攻击目标」] 若本兵锁定的敌兵不属于本队统一的 targetLane（且不在 <75px 贴身肉搏），
            //    在索敌周期到点（m.next <= 0）时允许重搜，归拢回本队目标。
            const lt = (m.lane >= 0 && !m.siegeW) ? this.laneTargets.get(m.lane) : undefined;
            const wrongLaneFoe = lt !== undefined && m.next <= 0 && m.foe !== null && !('sprite' in m.foe)
                && lt.targetLane !== undefined && m.foe.lane !== lt.targetLane
                && (m.foe.x - m.x) ** 2 + (m.foe.y - m.y) ** 2 > 75 * 75;
            const keep = this.canKeepTarget(m, SIGHT)
                && !(m.foe && 'sprite' in m.foe && !m.siegeW && m.next <= 0)
                && !(m.siegeW && m.foe && !('sprite' in m.foe) && m.next <= 0)
                && !wrongLaneFoe;
            const hb = m.siegeW && this.battleType === 'siege' ? null : this.recentAttacker(m, SIGHT);   // 🔴 [2026-10-12] 攻城武器不回头打人，只认城门/箭塔/中心建筑
            const reactWhileChasing = keep && previousTarget && !('sprite' in previousTarget) && hb
                && (previousTarget.x - m.x) ** 2 + (previousTarget.y - m.y) ** 2 >= REACH * REACH
                && (hb.x - m.x) ** 2 + (hb.y - m.y) ** 2 < 65 * 65;
            if (!keep) m.rangeWait = 0;
            if (reactWhileChasing) {
                // 正在追赶打不到的敌人时，优先反击贴身攻击者；已能交战则保持原目标。
                m.foe = hb;
                hb.claims++;
                m.next = 0.2;
            } else if (keep && m.foe) {
                m.foe.claims++;
            } else if (m.next <= 0) {
                if (hb) {
                    m.foe = hb;
                    hb.claims++;
                } else {
                    m.foe = this.search(m, SIGHT, MIN_RANGE_TYPES[m.key] ?? 0);
                }
                m.next = 0.2;
            } else if (!keep) m.foe = null;
            if (m.foe !== previousTarget) {
                m.fightT = 0;
                m.rangeWait = 0;
            }
            // 🔴 [2026-10-03] 无目标计时（归队门槛的唯一数据源，见 LANE_REGROUP_SEC）：
            //    放在索敌结算之后 —— 这里 m.foe 已是本帧最终值；有目标当帧清零，无目标才累加。
            m.noFoeSec = m.foe ? 0 : (m.noFoeSec ?? 0) + dt;

            // DE Attack Move：没有发现敌人时保持编队推进；个人视野内一旦锁敌，立即脱离编队交战。
            // 🔴 [2026-09-16 主人定]「野战的时候，玩家不要擅自先独立冲锋，第一波要跟着大部队，一起前进。」
            //    野战大部队第一波推进（this.marching）期间，玩家严格跟随大部队行军队列前进；
            //    除非大部队整体接战（!this.marching），或敌人近身贴脸（<65px）受到攻击，玩家不擅自脱队冲锋。
            // 🔴 [2026-10-11 主人报「开战全挤成一排」] **城墙不算锁敌**：攻城战 search 会把 wallGates 当目标，
            //    若按「锁敌即脱队」，全队 50 人第一轮索敌就锁定同一段墙、集体脱队压成一排。
            //    Attack Move 的脱队只对**真敌兵**生效（建筑目标用 'sprite' in foe 区分，见上方交战时计数那段）。
            if (m.march && m.foe && !('sprite' in m.foe)) {
                // 🔴 [2026-10-11 主人「按专业游戏修复」] **DE 的 Attack-Move 是「接触才脱队」，不是「看见就脱队」**。
                // 🔴 [2026-10-15 主人令「在刚达最大射程时立即停步脱队射击，不再往敌人脸上多冲一段」]
                //    远程单位（stats.rng > 65）一达到最大射程 REACH 立即脱队并原地停步（m.tx = m.x; m.ty = m.y）开火，不再多往前冲一段 MARCH_SP。
                const _d2 = (m.foe.x - m.x) ** 2 + (m.foe.y - m.y) ** 2;
                const _contact = _d2 <= (REACH + (stats.rng > 65 ? 0 : MARCH_SP)) ** 2;
                if (_contact) {
                    m.march = false;
                    m.port = null;
                    m.stuckT = 0;
                    m.netT = 0;
                    if (stats.rng > 65) {
                        m.tx = m.x;
                        m.ty = m.y;
                    }
                }
            }

            // 列阵推进期间：移动目标恒为「本口锚点 + 自己的槽位」，每帧跟着阵型走，不走 aimAt。
            // 没有发现敌人的士兵继续跟队；已经锁敌的士兵已按 Attack Move 脱队。
            if (m.march && m.port && !holdCmd) {
                const heroSlot = m.hero ? this.laneSlotTarget(m, laneLeaders) : null;
                if (heroSlot) {
                    [m.tx, m.ty] = heroSlot;
                } else {
                    const uFwd = this.advanceVec[m.f];
                    const uSide = this.sideVec[m.f];
                    const fwdDist = this.adv[m.f] - m.dep;
                    const sx = m.port.x + uFwd.x * fwdDist + uSide.x * m.slotY;
                    const sy = m.port.y + uFwd.y * fwdDist + uSide.y * m.slotY;
                    // 🔴 [2026-10-11 主人令] 陆战口径：水/树林/建筑一律可通行 ⇒ 推进槽位不再避水（原「落水则收窄 slotY」已删）
                    [m.tx, m.ty] = this.fieldBound(sx, sy);
                }
            } else if (!m.foe && !holdCmd && !isGuard && !(m.lane >= 0 && this.holdLanes.has(m.lane))) {   // 城外列阵待敌与城内未破门守军：原地不动
                // 没在打架就持续更新移动目标走过去（0.5s 刷新一次）
                // 🔴 [2026-08-22] 守方破墙前待命远程：不更新移动目标（原地站桩射击，不追击）
                // [2026-09-05 玩家] 玩家没敌可打时不走巡逻航路：站住等玩家指挥（键盘/点地面）
                if (this.heroOrderPending(m)) {
                    // 🔴 玩家本人点了地面还没走到：这道令优先 —— 既不归队、也不许 aimAt 改写他的目标点。
                    //    改前这里会掉进 aimAt，每 0.5 秒把玩家点的点改掉一次（见 heroOrderPending）。
                    //    什么都不做 = 目标点保持玩家点下的那一个。
                } else if (laneStandby) {
                    // 🔴 [2026-10-15 主人定] 场上所有目标均已满 4 队攻击，本队无目标可打时原地列阵待命；
                    // 🔴 [2026-10-16 主人令「守方却打到攻方营地，应该是回城需要敌人呀，不要再营地等着打乱入者」]
                    //    攻城战守方在无目标待命时，若已远离本队城防位置，领队带全队回城寻敌驻守，绝不在外场或攻方营地原地干等
                    const slot = this.laneSlotTarget(m, laneLeaders);
                    if (slot) {
                        [m.tx, m.ty] = slot;
                    } else if (this.battleType === 'siege' && m.f === 1) {
                        const ret = this.defenderCityReturnGoal(m);
                        if ((m.x - ret.x) ** 2 + (m.y - ret.y) ** 2 > 180 * 180) {
                            const aim = this.gateExit(m, ret) ?? ret;
                            [m.tx, m.ty] = this.fieldBound(aim.x, aim.y);
                        } else {
                            m.tx = m.x;
                            m.ty = m.y;
                        }
                    } else {
                        m.tx = m.x;
                        m.ty = m.y;
                    }
                } else {
                    const slot = this.laneSlotTarget(m, laneLeaders);
                    if (slot) {
                        // 🔴【移动时回归队形】脱战的队员对齐本队领队的阵型槽位
                        [m.tx, m.ty] = slot;
                    } else {
                        m.aimT = (m.aimT ?? 0) - dt;
                        if (m.aimT <= 0) {
                            // 🔴 [2026-09-09 主人报障「战术模式中玩家不会自动战斗」]
                            //    原来写死 `m.hero ? null`：玩家本人**永远不索敌**，只能键盘手操。
                            //    现在「自动」命令下本人照常索敌开打；「待命」下才不主动找目标。
                            const aim = (m.hero && this.playerCmd === 'hold') ? null : this.aimAt(m);
                            // 🔴 [2026-10-11 主人报「战斗刚开始士兵全挤成一排」] 列阵推进期间（m.march）
                            //    **不拿寻敌结果覆盖阵位** —— 这正是本文件 2928 行写的口径「够不着不追」。
                            //    改前无条件覆盖 ⇒ 同一口 50 人奔向同一个点 ⇒ 一排。
                            if (aim && !m.march) { [m.tx, m.ty] = this.fieldBound(aim.x, aim.y); }
                            m.aimT = 0.5;
                        }
                    }
                }
            }

            const foe = m.foe;
            if (foe) {
                // 🔴 [2026-09-11] 这里**没有**最小射程出口：只剩贴脸目标时照常出手扣血，
                //    只是不生成弹丸（见下面 tooClose）。理由见 canKeepTarget 头注。
                const fd2 = (foe.x - m.x) ** 2 + (foe.y - m.y) ** 2;
                /* ── 【放风筝】主人 2026-08-22 定「被攻击才撤、撤一段就停」──────────────
                 * 触发 = 被近战贴脸（kd < 65，敌人已挥刀砍过来），不是 70px 预判跑——
                 * 弓骑先站着射，敌人真贴到脸上砍了才拨马后撤，符合帕提亚回马射「站定射→被追上→跑」。
                 * 后撤 = 跑够固定段 KITE_RETREAT_DIST 就停下回身站撸，下次再被贴脸再跑（段落式）。
                 *   · 跑的那一帧**不打**（dir 按逃跑方向、st=0 走路动画），不是倒着滑
                 *   · 与 DE 一致：骑射手移动中不能射击，风筝本来就是「跑一段—停下—射」的交替
                 */
                // 🔴 [2026-08-22] 守方破墙前待命远程：不风筝（原地站桩射击，不后撤）
                if (wt.kite && !m.kiteGaveUp && !isGuard) {
                    const kd = Math.sqrt(fd2);
                    // 🔴 [2026-08-23 主人定] 只被「近战」贴脸才放风筝：远程对射（dmgType=pierce）不跑、原地站撸；
                    //    敌人真挥刀砍过来（dmgType=melee）才拨马后撤。
                    if (!m.kiting && kd < 65 && this.statsFor(foe.key, foe.f).dmgType === 'melee') { m.kiting = true; m.kiteLeg = 0; }
                    if (m.kiting) {
                        const uB = this.advanceVec[m.f], rx = (m.x - foe.x) / (kd || 1), ry = (m.y - foe.y) / (kd || 1);
                        const backOk = (rx * -uB.x + ry * -uB.y) >= -0.2;
                        const dx = backOk ? -uB.x : rx, dy = backOk ? -uB.y : ry, d = 1;
                        const step = stats.spd * spdK * dt;
                        const nx = m.x + dx / d * step, ny = m.y + dy / d * step;
                        const [bx, by] = this.fieldBound(nx, ny);
                        // 🔴 退到屏幕边上就**别退了，回身打**（主人 2026-08-19 定）：
                        //    fieldBound 会把越界的坐标 clamp 回场内，位置不再变化，
                        //    但 kiting 仍为 true（敌人还在触发距离内）→ 贴着边一直播跑动画、
                        //    一直不还手，站着白挨打。退不动就说明退无可退，转身射比装死强。
                        const hb = this.spawnBases[m.f];
                        const pastBase = !!hb && ((nx - hb.x) * uB.x + (ny - hb.y) * uB.y < -120);
                        if (Math.abs(bx - nx) > 0.5 || Math.abs(by - ny) > 0.5 || pastBase) {
                            m.kiteGaveUp = true; m.kiting = false;
                        // 越过地图边界或本方大本营底线即停止风筝
                        } else {
                            m.x = bx; m.y = by;
                            m.dir = this.dir8Hyst(m.dir, dx, dy);   // 朝向 = 逃跑方向（带迟滞防抖）→ 转身跑，不是倒着滑
                            m.st = 0;                    // 走路状态：尾部才会推走路动画
                            m.fightT = 0;
                            m.kiteLeg = (m.kiteLeg ?? 0) + step;
                            m.kiteDist = (m.kiteDist ?? 0) + step;
                            // 累计满上限 → 停止风筝，转身硬拼。
                            if (m.kiteDist >= KITE_RETREAT_CAP) {
                                m.kiteGaveUp = true; m.kiting = false;
                            }
                            // 跑够一段：拉开到安全距离（kd ≥ KITE_SAFE）就停下回身站撸；
                            // 若跑完一整段仍未拉开到安全距离（追兵是高速/重装骑兵，咬得很死），当场放弃风筝回身硬拼，不再闷头连跑 300px。
                            else if (m.kiteLeg >= KITE_RETREAT_DIST) {
                                if (kd >= KITE_SAFE) {
                                    m.kiting = false; m.kiteLeg = 0;                   // 甩开了，停下回身站撸（kiteDist 不清零，累计满 3 段即止）
                                } else {
                                    m.kiteGaveUp = true; m.kiting = false; m.kiteLeg = 0; // 跑完一段仍甩不开（对手是骑兵），立即停止风筝回身迎战
                                }
                            }
                            if (m.fadeT > 0) m.fadeT -= dt;
                            m.ph += dt * 8;
                            continue;                    // 跑的这一帧不出手、不计围殴
                        }
                    }
                }
                const close = fd2 < 65 * 65;
                const minR = MIN_RANGE_TYPES[m.key] ?? 0;
                const tooClose = minR > 0 && fd2 < minR * minR;
                // 🔴 [2026-08-17 修·「动作切换时的颤抖」] 够得着的判定必须带迟滞。
                //    没有迟滞时，站在射程/贴身边缘上的兵会每帧翻面：
                //      够得着 → 站桩出手（st=1，播攻击帧）→ 被 separate 推开半步 → 够不着
                //      → 转身追击（st=0，播移动帧）→ 走半步又够着 → ……
                //    每帧在「攻击帧/移动帧」之间来回切 = 主人看到的动作抖。近战最明显：
                //    贴身圈 65px，而推挤力 120px/s 与移动速度同量级，边界上必然反复穿越。
                //    🔴 迟滞**只用来稳住姿势，绝不放宽出手距离**：
                //    直接把 REACH 乘 1.2 会让远程白得 20% 射程（火焰弓 400→480），那是改数值不是修画面。
                //    所以出手判据 inReach 保持严格，另设一条「迟滞带」：
                //    刚被推出攻击距离、但还没退出 1.2 倍的兵，既不追也不打，**站住保持原姿势**，
                //    等真的被拉开了才转身去追。伤害一分不多给（迟滞带里本来就够不着，不结算）。
                const engaged = m.st !== 0;                       // m.st 此刻仍是上一帧的值
                const inReach = fd2 < REACH * REACH;              // 严格：出手/扣血用这个
                // 🔴 [2026-08-17 再修] 迟滞带宽度取「20% 射程」与「25px」的**较小值**。
                //    原来只按比例算，远程兵会宽得离谱：射程 400 的火焰弓，400~480px 之间
                //    既不放箭也不挪窝 —— 主人反馈「离敌军很近还在待命」就有这一份。
                //    抖动来自贴身互推（每帧一两个像素），25px 足够盖住，不需要更宽。
                const hystBand = REACH + Math.min(REACH * 0.2, 25);
                const inHystBand = !inReach && engaged && fd2 < hystBand ** 2;
                const waitInHystBand = this.waitAtRangeEdge(m, inHystBand, dt);
                // 缠斗 4 秒脱离。
                // 🔴 [2026-08-17 修] 只在**够得着**的时候计时——把「跑过去的路上」也算进这 4 秒，
                //    会让慢速大视野兵种永远打不到人：象兵 LOS 280、贴身 65、速度 40，
                //    从视野边缘跑到跟前要 5.4s（精锐战象 320/6.4s），4 秒一到就丢目标重找，
                //    再锁再跑再丢，一刀都砍不出去。实测这样的兵种共 6 个（全是象 + 桑纳亚）。
                if (inReach) {
                    // 🔴 [2026-10-15 主人令「在刚达最大射程时立即停步脱队射击，不再往敌人脸上多冲一段」]
                    if (stats.rng > 65) {
                        if (m.march) { m.march = false; m.port = null; }
                        m.tx = m.x;
                        m.ty = m.y;
                    }
                    // 接触交战音景的**唯一数据源**：这一帧有多少近战兵正够得着活人。
                    // 三条排除，都是为了让这声音只代表「两军绞杀」：
                    //   · stats.rng > 65 的远程兵不算 —— 它是近战音效，后期只剩对射时就该静下来；
                    //   · 攻城武器不算 —— 砸墙有 siege_impact 管；
                    //   · 目标是建筑（'sprite' in foe）不算 —— 打墙不是绞杀。
                    // 不在列阵期计数（deploying 分支已 continue）。
                    // 🔴 [2026-10-08 → 2026-10-18 主人定] 远程攻击与攻打城门/城内建筑时同样保持自制战斗音效不断，攻城武器除外；两军交战即渐显，无战斗再渐隐
                    if (!m.siegeW && (!('sprite' in foe) || foe.hp > 0)) this.meleeContactCount++;
                    m.fightT = (m.fightT || 0) + dt;
                    // 🔴 [2026-08-17 主人拍板] 目标只剩半血以下就**不换人**，把他打死再走。
                    //    原来不看血量：跟一个人打满 4 秒，哪怕对方只剩一口气也照样掉头去找别人 ——
                    //    主人原话「敌人快死了，自己逃跑？搞什么」。
                    //    ⚠️ 但这条 4 秒换人**不能整个删掉**：实测关掉后骑兵对镜 1/6 打不完（600s 上限），
                    //       它在防同兵种对镜的僵持死锁。只去掉「快死了还走」这个荒唐场面即可。
                    //    实测阈值 0 / 0.3 / 0.5（war_sim 步骑远程各 2 种子）：0.5 与现状持平甚至略快。
                    const foeMax = this.statsFor(foe.key, foe.f).hp;
                    const nearlyDead = foe.hp < foeMax * KEEP_TARGET_HP;
                    if (m.fightT > 4 && !nearlyDead) {
                        m.foe = null; m.fightT = 0; m.next = 0.4; m.lock = 0;
                        if (isGuard) {
                            m.tx = m.x; m.ty = m.y;
                        } else if (laneStandby) {
                            const slot = this.laneSlotTarget(m, laneLeaders);
                            if (slot) { [m.tx, m.ty] = slot; } else { m.tx = m.x; m.ty = m.y; }
                        } else {
                            const slot = this.laneSlotTarget(m, laneLeaders);
                            if (slot) {
                                [m.tx, m.ty] = slot;
                            } else {
                                const aim = this.aimAt(m);
                                // 🔴 [2026-10-11 主人报「战斗刚开始士兵全挤成一排」] 列阵推进期间（m.march）
                                //    **不拿寻敌结果覆盖阵位** —— 这正是本文件 2928 行写的口径「够不着不追」。
                                //    改前无条件覆盖 ⇒ 同一口 50 人奔向同一个点 ⇒ 一排。
                                if (aim && !m.march) { [m.tx, m.ty] = this.fieldBound(aim.x, aim.y); }
                            }
                        }
                        continue;
                    }
                }
                // 列阵推进期间**够不着就不追**（帝国 DE 的 Stand Ground 行军）：回自己的槽位随队压上。
                // 放在迟滞带之前：迟滞带会让人站住不动，那是接战后的防抖装置，列阵段必须继续走。
                // 够得着的照常落到下面的攻击分支 —— 远程在队形里放箭，不禁火。
                if (m.march && !inReach && !holdCmd) {
                    m.st = 0;
                    const dx = m.tx - m.x, dy = m.ty - m.y, d = Math.hypot(dx, dy);
                    const step = stats.spd * spdK * dt;
                    if (stats.spd > 0 && d > LANE_TRACK_EPS) {
                        const mv = Math.min(step, d);
                        m.x += (dx / d) * mv;
                        m.y += (dy / d) * mv;
                        const uFwd = this.advanceVec[m.f];
                        m.dir = d < 24 ? this.dir8Hyst(m.dir, uFwd.x, uFwd.y) : this.dir8Hyst(m.dir, dx, dy);
                    }
                    // 🔴 这里 continue 会跳过循环尾部的渐显与动画推进，必须就地补上
                    //    （不补 = 贴地滑行不迈腿 + 新兵一路半透明，见追击分支同款血训）
                    if (m.fadeT > 0) m.fadeT -= dt;
                    m.ph += dt * 8;
                    continue;
                }
                // 够不着 → 追击（DE「看见就冲上去」；近战从 LOS 圈走向贴身，远程够射程前走位）
                if (waitInHystBand) {
                    // 迟滞带：被推挤挤出攻击距离一点点，站住别动，姿势保持不变（见上面的说明）。
                    // 不改 m.st，所以渲染继续用上一帧那套帧，不会在攻击帧/移动帧之间来回跳。
                    if (m.fadeT > 0) m.fadeT -= dt;
                    m.ph += dt * (m.st ? 8 / 1.5 : (8 / LOOP_WINDOW_IDLE_SEC));
                    continue;
                }
                // 🔴 [2026-08-23] 双方待命期 / 城门未破的第二波以后守军（isGuard）：够不着**不追**——原地站桩等目标进射程
                if ((holdCmd || isGuard) && !inReach) {
                    m.st = 0;
                    m.fightT = 0;
                    if (m.fadeT > 0) m.fadeT -= dt;
                    m.ph += dt * (8 / LOOP_WINDOW_IDLE_SEC);
                    continue;
                }
                if (!inReach) {
                    m.st = 0;
                    // 绕着目标散开：瞄目标**周围一圈**上属于自己的那个点，不是目标本人那一个点。
                    // 角度由 jx/jy 推出（出生时定死，终身不变），所以每个兵稳定从同一个方位围上去。
                    // 停手判据仍看「离目标本人多远」（inReach），所以偏移不会让人够不着。见 CHASE_RING。
                    const ra = Math.atan2(m.jy, m.jx);
                    const rawChase = { x: foe.x + Math.cos(ra) * CHASE_RING, y: foe.y + Math.sin(ra) * CHASE_RING };
                    const chasePt = isGuard ? rawChase : (this.gateExit(m, this.flowRedirect(m, rawChase)) ?? rawChase);
                    const fdx = chasePt.x - m.x;
                    const fdy = chasePt.y - m.y;
                    const fd = Math.hypot(fdx, fdy) || 1;
                    // ── 前方被己方兵挡住 → **绕过去**，不是站着等 ──────────────────────
                    // 🔴 [2026-08-17 主人拍板] 「战场上被挡着就站 2 秒」不成立，人会绕。
                    //    帝国时代的弧形阵面就是这么长出来的：每个兵有自己的占地，被前面的人挡住时
                    //    寻路把他从侧面带过去，一层层绕不过去的就沿接触面铺开 = 弧形。
                    //    我们没有寻路，用最省的等效做法：**沿垂直方向侧滑**。
                    //    绕行方向按本兵固定（取自 jy 的符号），不每帧现挑 —— 现挑会左右摇摆，又是一种抖。
                    //    绕开之后下一帧自然判定不堵，立刻恢复直冲。
                    const ux = fdx / fd, uy = fdy / fd;
                    const px = m.x + ux * CELL_S, py = m.y + uy * CELL_S;
                    const bcx = (px / CELL_S) | 0, bcy = (py / CELL_S) | 0;
                    let blocked = false;
                    for (let gx = bcx - 1; gx <= bcx + 1 && !blocked; gx++) {
                        for (let gy = bcy - 1; gy <= bcy + 1 && !blocked; gy++) {
                            const a = this.gs.get(HKEY(gx, gy));
                            if (!a) continue;
                            for (const o of a) {
                                if (o === m || o.f !== m.f || o.hp <= 0) continue;
                                const odx = px - o.x, ody = py - o.y;
                                const rr = this.radiusOf(m.key) + this.radiusOf(o.key);
                                if (odx * odx + ody * ody < rr * rr) { blocked = true; break; }
                            }
                        }
                    }
                    if (blocked) m.avoidT = 0.12;
                    else m.avoidT = Math.max(0, (m.avoidT ?? 0) - dt);
                    const avoiding = blocked || (m.avoidT ?? 0) > 0;
                    let mvx = ux, mvy = uy;
                    if (avoiding) {
                        // 🔴 **绕行必须保留前进分量**：纯侧滑=全军绕圈不接敌，实测步兵对镜 184s→467s、
                        //    骑兵 159s→260s（war_sim 扫 SLIDE_W=0/0.35/0.6/1）。取 0.4 一档实测与不绕行持平甚至略快。
                        const side = m.jy >= 0 ? 1 : -1;      // 本兵固定绕行侧，避免左右摇摆
                        const bx = ux * (1 - SLIDE_W) + (-uy * side) * SLIDE_W;
                        const by = uy * (1 - SLIDE_W) + (ux * side) * SLIDE_W;
                        const bl = Math.hypot(bx, by) || 1;
                        mvx = bx / bl; mvy = by / bl;
                    }
                    m.x += mvx * stats.spd * spdK * (avoiding ? SLIDE_RATE : 1) * dt;
                    m.y += mvy * stats.spd * spdK * (avoiding ? SLIDE_RATE : 1) * dt;
                    // 🔴 [2026-10-18 主人报「士兵在行进过程中，有的时候会频繁改变朝向，出现颤抖的感觉」]
                    //    追击朝向对准追击目标方向 (fdx, fdy) 而非瞬态侧滑向量 (mvx, mvy)：
                    //    侧滑 blocked 随前方队友微移在 0.12s 窗口边缘高频开合，mvx/mvy 随之偏转 ~24°，
                    //    若朝向跟 mvx/mvy 走，士兵贴图就会在正前与侧前两个 8 向间高频翻面颤抖。
                    m.dir = this.dir8Hyst(m.dir, fdx, fdy);
                    // 🔴 [2026-08-17 修] 这里 continue 会跳过循环尾部的渐显与动画推进，
                    //    所以必须就地补上：不补的话，追击中的兵**踏步动画冻结**（贴地滑行），
                    //    刚出生就开始追的兵还会**一直半透明**（fadeT 不递减）。
                    if (m.fadeT > 0) m.fadeT -= dt;
                    m.ph += dt * 8;          // st=0 走路节奏，与尾部同式
                    continue;
                }
                // 炸药自爆兵（DE 爆破兵/火焰骆驼：冲入敌阵一旦近身引爆，造成毁灭性范围 AoE 伤害并自爆牺牲）
                // 🔴 [2026-10-13 主人报「自爆骆驼不爆炸」] 原判据 `close`（固定 65px）与追击停步用的 `inReach`（= max(射程,65) + **自身半径**）不是同一把尺：
                //    骆驼体型大，追到 inReach（>65px）就停步转入攻击姿态，而 `close` 永远 <65 才成立 ⇒ 停在 65~78px 之间既不追也不炸（与攻城槌够不着墙同一病根，见 REACH 注释）。
                //    改用 inReach：停步的那一刻就引爆。爆破兵体型小、radius 本就 ≤ 贴身圈，行为不变。
                if (SUICIDE_TYPES.has(m.key) && inReach && m.hp > 0) {
                    this.explode('FX_PETARD', m.x, m.y);
                    // 自爆兵 key 出生时已校验在 WAR_TYPES（原 petard 兜底不会触发；statsFor 内部有 light_infantry 防崩）
                    // [性能] 复用本轮已取的 wt，别再查一遍分表（同一循环内同一个兵，结果必然相同）
                    const shooter = wt;
                    this.splash(m, 75, shooter, 1.0);
                    m.hp = 0;
                    this.lastKillSec = this.battleSec;
                    continue;
                }
                m.st = (stats.rng && close && this.bank[m.key]?.realMelee) ? 2 : 1;
                // 交战中也走迟滞：贴身互推时目标方位每帧摆动，直接 dir8 会让贴图在两个朝向间跳
                m.dir = this.dir8Hyst(m.dir, foe.x - m.x, foe.y - m.y);
                m.lock = (m.lock ?? 0) - dt;
                // 玩家本人出手更快（见 HERO_ATTACK_RATE）：装填缩短，攻击动画随之加快；【攻】振己威攻速 ×1.30
                const heroRate = m.hero ? HERO_ATTACK_RATE : 1;
                const frenzyAtkSpd = this.skillFrenzyTimer[m.f] > 0 ? 1.30 : 1.0;
                const reloadTime = (stats.reload || 2.0) / (heroRate * frenzyAtkSpd);
                if (m.lock <= 0) {
                    m.lock = reloadTime; m.ph = 0;
                    m.shot = false;   // 新一轮：等攻击动画播到放箭相位再射
                    m.slashed = false;
                    // DE accuracy（准确率）：远程每轮出手 roll 命中，miss 则这一轮不扣伤害。
                    // 近战/飞斧/投石（dmgType melee）恒命中；pierce 投射物按 DE accuracy 判定。
                    m.accHit = (stats.dmgType === 'melee') || (Math.random() * 100 < accuracyOf(m.key, wt));
                    m.hussiteSecondaryHits = (m.key === 'hussite_wagon' || m.key === 'elite_hussite_wagon')
                        ? Array.from({ length: 5 }, () => Math.random() * 100 < 75)
                        : undefined;
                    // 攻击动作交替（主人 2026-08-11 拍板）：有冲锋组的兵种（象兵/弓骑）每轮出手翻转，
                    // 在「攻击帧/冲锋帧」两套动作间轮播，丰富表现；无冲锋组的兵种不受影响。
                    if (this.bank[m.key]?.sets.charge?.[m.f]?.length) m.atkFlip = !m.atkFlip;
                    // 火矛手充能喷火（DE：进战先喷 3 发短程火枪弹，30 秒充能）
                    if (FIRE_LANCER_TYPES.has(m.key) && (m.chargeCd ?? 0) <= 0 && foe && !('sprite' in foe)) {
                        m.chargeCd = FIRE_LANCER_CHARGE;
                        this.fireLanceVolley(m, foe);
                    }
                } else {
                    // 攻击动画推进：
                    // 动作以自然节奏（~1.2-1.5s）播满 8 相位后收势，长装填兵种（火炮 6.5s、火枪 3.45s 等）在发射后等待装填完毕。
                    // 🔴 [2026-08-17 定] 职责划分：**ph 只管计时，"播一遍还是循环"由渲染层决定**。
                    //    所以这里不再给 ph 封顶（封顶会让装填期的待命帧定格在第 0 帧不动）：
                    //      · 攻击类帧（atk/charge/melee）渲染时 clamp 到末帧 → 播满自然停住；
                    //      · 待命/移动帧渲染时取模循环 → ph 继续涨才能动起来。
                    //    动作节奏固定 ~1.5s 播完一遍，装填时间另算（长装填兵种播完就回待命站姿）。
                    /* 🔴 [2026-08-20 查证定案·别再改这里] 主人问「战场上发呆正常吗」，查到底的结论：
                     *   ① **DE 原版没有装填动作**。直接查 empires2_x2_p1.dat：每个单位只有一段
                     *      attack_graphic、attack_graphic_2 = -1，graphic 字段里根本没有装填这一项。
                     *      装填期 = reload − 攻击动画时长，DE 引擎在这段时间里播的就是 idle 站姿。
                     *      火枪手 HCANR 动画 0.70s / 装填 3.45s（站 2.75s）；投石车 MANGO 1.00s / 6.0s；
                     *      投石机 TREBU 2.20s / 10.0s（站 7.8s）。素材里没有可提取的装填帧，不是我们漏提。
                     *   ② **这个 1.5s 封顶不是「截断慢射动画」，而是在压缩站立时间**：多数远程的 DE 动画
                     *      短于 1.5s（火枪 0.7s、投石车 1.0s），封顶把它们拉长 → 站立时间反而比 DE 原版更短。
                     *      改回 DE 真值时长看着「更还原」，实际是让发呆更多（火枪站立 1.95s → 2.75s）。
                     *   ③ 试过的另一条路 `animDur = reloadTime`（动作铺满装填期、彻底没有站立段）：
                     *      放箭/开火是动画里的固定相位，拉长后开火时刻同比例延后 —— 火枪 0.75s → 1.7s、
                     *      投石机抛石 0.88s → 4.0s，**被放慢四五倍的恰恰是最该干脆的那一下**，比站着更假；
                     *      且帧率掉到 9~15fps，顿挫正落在开火瞬间。已否决。
                     *   → 结论：维持现状。要真做装填动作只能自造素材，违背「用 DE 原素材」的铁律，
                     *     不为 35 个慢射兵种破例。（2026-08-20 主人拍板 A：不改。）
                     */
                    const animDur = Math.min(reloadTime, 1.5);
                    m.ph += m.ph >= 8 ? dt * (8 / LOOP_WINDOW_IDLE_SEC) : dt * 8 / animDur;
                    // 放箭/开火：动画播到该兵种专属发射相位（shootPhase）才射出，和动作对齐。
                    // 只有真正在放箭/开火的那一轮才有弹丸：被贴身改白刃（st=2）或处于攻城盲区（minRange）时不射。
                    // 🔴 2026-08-16 主人定：抛射物按兵种一一对应 DE 素材（箭/标枪/飞镖/飞斧/火箭/炮弹/弹丸），
                    //    连弩（诸葛弩）连发多支（普通 3、精锐 5，AoE2 wiki），风琴炮 5 弹，火箭车 5 支，其余每轮 1 支。
                    const shootPhase = SHOOT_PHASE_BY_TYPE[m.key] ?? DEFAULT_SHOOT_PHASE;
                    if (!m.shot && m.ph >= shootPhase && stats.rng > 65 && m.st === 1 && !tooClose) {
                        m.shot = true;
                        // 🔴 [2026-08-24] 远程攻城器械（投石车/弩炮/火箭车）发射声与弹丸同相位射出。
                        //    弹丸命中另有 explosion，这里只管「配重砸下 / 弩炮弹射」那一下。
                        if (m.siegeW) audioManager.play('siege_launch');
                        const ax = foe.x - m.x, ay = foe.y - m.y;
                        const ad = Math.hypot(ax, ay) || 1;
                        const proj = PROJ_TYPE[m.key] ?? 'PROJ_ARROW';
                        const isHussiteVolley = m.key === 'hussite_wagon' || m.key === 'elite_hussite_wagon';
                        const volley = isHussiteVolley ? 6 : (PROJ_VOLLEY[m.key] ?? 1);
                        this.ensureProj(proj);
                        if (isHussiteVolley) this.ensureProj('PROJ_GUNPOWDER');
                        const isFirearm = FIREARM_TYPES.has(m.key);
                        // 🔴 [2026-09-16 主人「近战兵没有了也就没有音效了，应该添加 DE 的射箭音效」]
                        //    常规远程兵（弓/弩/标枪/飞斧…）放箭声。攻城器械上面已经播了 siege_launch、
                        //    火器下面 spawnFirearmMuzzle 里播 gun_fire，这里只补剩下那一类 —— 正是
                        //    近战死绝、land_contact 淡出之后唯一还在动的那批兵，原先完全静音。
                        //    限流靠 AudioManager 的 cooldown（arrow_fire 700ms），这里不必自己数人。
                        if (!m.siegeW && !isFirearm) {
                            audioManager.play(CASTER_TYPES.has(m.key) || proj === 'PROJ_GREEK_FIRE' ? 'flamethrower_fire' : 'arrow_fire');
                        }
                        // 开火点高度：步兵 = 胸口（UNIT_PX*0.45）；塔类攻城器械 = 塔顶弩机（见表头 MUZZLE_LIFT_BY_TYPE）。
                        const muzzleOver = MUZZLE_LIFT_BY_TYPE[m.key];
                        const muzzleLift = muzzleOver !== undefined
                            ? muzzleOver * (WAR_TYPES[m.key]?.sz ?? 1)
                            : UNIT_PX * 0.45;
                        const towerFlight = muzzleOver !== undefined ? {
                            startLift: this.elevationLiftAt(m.x, m.y) + muzzleLift,
                            endLift: this.elevationLiftAt(foe.x, foe.y) + UNIT_PX * 0.45,
                        } : undefined;
                        for (let v = 0; v < volley; v++) {
                            // DE 胡斯战车每轮 = 1 发专属主弹 + 5 发 p_shot 次级弹。
                            const volleyProj = isHussiteVolley && v > 0 ? 'PROJ_GUNPOWDER' : proj;
                            const exactSpeed = PROJ_SPEED_PX[volleyProj];
                            const baseDur = exactSpeed ? ad / exactSpeed : (PROJ_DUR[volleyProj] ?? ARROW_DUR);
                            // DE accuracy：miss 的这轮箭矢飞偏打空（视觉与伤害一致）；命中则火枪轻微自然散射。
                            const missed = isHussiteVolley && v > 0
                                ? m.hussiteSecondaryHits?.[v - 1] === false
                                : m.accHit === false;
                            const spread = ORGAN_GUN_TYPES.has(m.key)
                                ? Math.atan2((Math.random() * 2 - 1) * ORGAN_GUN_DISPERSION_PX, ad)
                                : missed
                                    ? (Math.random() < 0.5 ? -1 : 1) * (0.3 + Math.random() * 0.3)   // miss：明显打空
                                    : isFirearm ? (Math.random() - 0.5) * 0.14 : 0;                    // 命中：火枪轻微散射
                            const c = Math.cos(spread), s = Math.sin(spread);
                            const ndx = (ax / ad) * c - (ay / ad) * s;
                            const ndy = (ax / ad) * s + (ay / ad) * c;
                            this.arrows.push({
                                x: m.x,
                                y: towerFlight ? m.y : m.y - muzzleLift,   // 塔类通过 towerFlight 线性平滑插值（基准坐标用地面 m.x, m.y）；步兵维持原值
                                dx: ndx, dy: ndy, len: ad,
                                t: 0, dur: exactSpeed ? baseDur : baseDur + Math.random() * 0.05, f: m.f,
                                proj: volleyProj,
                                delay: v * PROJ_VOLLEY_DELAY,      // 连发：第 v 支延迟 v×80ms 射出
                                ...(towerFlight ? { towerFlight } : {}),
                            });
                        }
                        // 火器炮口焰/枪口焰：发射瞬间喷出 DE 炮口焰特效（音效在 spawnFirearmMuzzle 内）
                        if (isFirearm) this.spawnFirearmMuzzle(m, ax, ay);
                        // 其他没有攻击动画的非火器车辆用素色尘烟提示开火；高丽战车按 DE 原样只发射弩矢。
                        // 🔴 [2026-09-17 主人定] 先秦战车改配精锐连弩的武器 → 一并排除尘烟：连弩开火没有尘烟，
                        //    留着就不叫「和精锐连弩相同」了。它仍在 NO_ATTACK_ANIM 里（DE 素材的攻击图=待命图，
                        //    那是素材事实、不能动），开火提示改由连弩的 5 连发弩矢承担，与高丽战车同理。
                        else if (CASTER_TYPES.has(m.key)) {
                            // 🔴 [2026-10-11 主人令] 法师类：没有攻击动作，改为**施法**——
                            //    口焰用希腊火同色系的火焰光（投射物本身就是希腊火素材 FLAMETHROWER_FLAME）
                            this.muzzleFlash(m, ax, ay, GREEK_FIRE_COLORS);
                        }
                        else if (this.bank[m.key]?.noAttackAnim && m.key !== 'war_wagon' && m.key !== 'elite_war_wagon' && m.key !== 'war_chariot_ranged') {
                            this.muzzleFlash(m, ax, ay, SHOT_DUST_COLORS);
                        }
                        // 其余远程（弓/弩/投石）：箭矢开火音效已关闭（主人 2026-08-19），保留射击动作
                    }
                }
                m.atkSt = m.st;
                // 总加成：把战略层强弱（将领/精锐/武将技/文化/运气）带进每一刀
                // 伤害 = DE 公式 dmgVs(攻+加成−防) / reload（装填时间），再乘 sideBonus（八环）与围殴。
                // 相克由 DE 加成伤害 + 近/远防自然涌现（步克骑/弓克步/骑克弓），无全局系数。
                const shooter = wt;   // [性能] 同上，复用本轮已取的分表结果
                const target = this.statsFor(foe.key, foe.f);
                // ── 迎面拒马：骑兵正面撞长枪/方阵列，冲不进来（见 PIKE_BRACE_* 长注释）──
                let braceTaken = 1;
                if (PIKE_BRACE_ENABLED && !('sprite' in foe)
                    && isCavalryType(shooter) && isPikeBraceType(target)) {
                    const braced = foe.march === true || foe.st !== 0;   // 阵列中 / 已站定交手（非追击途中）
                    if (braced && inFrontArc(foe.dir, m.x - foe.x, m.y - foe.y, PIKE_BRACE_FRONT_DEG)) {
                        braceTaken = PIKE_BRACE_TAKEN;
                    }
                }
                // ── 侧击/背击：绕到侧后砍这一刀更重（见 FLANK_* 长注释）──
                //    只认「受害者是兵（建筑无朝向）」+「这一击是近战」两条；范围伤害（aoe → splash）
                //    不走本路径，也不该吃朝向加成——溅射没有「从哪个方向砍进去」可言。
                let flankMul = 1;
                if (FLANK_ENABLED && !('sprite' in foe) && shooter.dmgType === 'melee') {
                    flankMul = this.skillPanicTimer[foe.f] > 0
                        ? Math.max(1.4, flankMulOf(foe.dir, m.x - foe.x, m.y - foe.y))
                        : flankMulOf(foe.dir, m.x - foe.x, m.y - foe.y);
                }
                // DE 当前风琴炮的5/6枚弹丸均使用主弹伤害；逐弹受护甲，因此等价于单弹伤害乘弹数。
                const projectileDamageCount = ORGAN_GUN_TYPES.has(m.key) ? (PROJ_VOLLEY[m.key] ?? 1) : 1;
                // 🔴 [2026-09-18 主人定·攻城武器无法近身攻击]
                //    处于最小射程盲区（tooClose）内时严禁开火，主伤害严格为 0！
                const primaryDamage = (!tooClose && m.accHit !== false) ? dmgVs(shooter, target) * projectileDamageCount : 0;
                const secondaryHitCount = (!tooClose && (m.key === 'hussite_wagon' || m.key === 'elite_hussite_wagon'))
                    ? (m.hussiteSecondaryHits?.filter(Boolean).length ?? 0)
                    : 0;
                const secondaryDamage = secondaryHitCount * dmgVs(HUSSITE_SECONDARY_SHOT, target);
                // 🔴 [2026-10-15 DE 高地机制] 高打低 +25%（×1.25），低打高 -25%（×0.75）
                const elevDmgMul = dElev >= 0.4 ? 1.25 : (dElev <= -0.4 ? 0.75 : 1.0);
                // 【攻】振己威：伤害 ×1.30 × 攻速 ×1.30
                const frenzyDmgMul = this.skillFrenzyTimer[m.f] > 0 ? 1.30 * 1.30 : 1.0;
                const dps = (primaryDamage + secondaryDamage) * heroRate * elevDmgMul * frenzyDmgMul / shooter.reload;
                if ('sprite' in foe) {
                    // 🔴 [2026-09-18 主人定·增加所有攻城武器只对建筑破坏力]
                    //    目标为建筑时（城墙/城门），无论是否 wt.aoe，主目标均实打实扣血！
                    foe.atkNext++;
                    if (dps > 0) {
                        if (foe.hitAt === undefined) foe.hitAt = this.battleSec;
                        const vulnMul = this.skillVulnTimer[foe.f] > 0 ? 1.35 : 1.0;
                        foe.hp -= dps * this.sideBonus[m.f] * gangMul(foe) * this.attritionMul() * vulnMul * dt;
                        // 城门/城墙同样设置基础被摧毁保底时间（城门 15s，石墙/垛墙/木栅 10s），防多台攻城槌重叠秒破
                        if (!foe.bld && foe.hitAt !== undefined) {
                            const wallFloorSec = foe.key === 'STONE_GATE' ? 15 : 10;
                            const minWallHp = foe.maxHp * (1 - (this.battleSec - foe.hitAt) / wallFloorSec);
                            if (foe.hp < minWallHp) foe.hp = minWallHp;
                        }
                        // 🔴 [2026-08-23 修·城墙崩塌照 DE] damage stage：城墙被持续打时按 hp/maxHp
                        //   渐进切换破损档（完整 → D25 → D50 → D75，越损越矮），不是破墙瞬间才变残垣。
                        //   城门无 destrAssets（走 destruction 动画）、木栅栏无 destrAssets（直接消失）→ 跳过。
                        // 🔴 [2026-08-23 主人定] 墙 hp 归零也算损 100% → 切 D75（破损到顶），与 40 秒坍塌残垣视觉一致。
                        if (foe.destrAssets && foe.hp > 0 && !foe.sprite.collapse) {
                            const ratio = Math.max(0, foe.hp) / foe.maxHp;
                            let stage = -1;
                            if (ratio <= 0.25) stage = 2;       // D75：损 75%
                            else if (ratio <= 0.5) stage = 1;   // D50：损 50%
                            else if (ratio <= 0.75) stage = 0;  // D25：损 25%
                            if (stage >= 0) {
                                const asset = 'BUILDINGANIM:' + foe.destrAssets[stage];
                                if (foe.sprite.asset !== asset) {
                                    foe.sprite.asset = asset;
                                    foe.sprite.frame = 0;
                                }
                            }
                        }
                        if (foe.bld) this.onDefBuildingHit(foe);
                        // 墙/木栅栏/篱笆达到破口血量阈值（75%/50%/25%/0% 四档交错；城门恒为 0%）→ 触发 collapseOneWall 定格破损形态并解除阻挡
                        if ((foe.key === 'STONE_WALL' || foe.key === 'FORTIFIED_WALL' || foe.key === 'WOOD_WALL' || foe.key === 'STONE_GATE') && foe.hp <= foe.maxHp * this.wallBreachRatio(foe) && !foe.sprite.obstructionDisabled && !foe.sprite.collapse && !foe.sprite.destroyed) {
                            this.collapseOneWall(foe);
                        }
                    }
                    // 若同时为 aoe 单位且未在盲区内，对周围士兵照常执行溅射
                    if (!tooClose && wt.aoe) this.splash(m, REACH, shooter, dt, heroRate);
                } else if (!tooClose && wt.aoe) {
                    this.splash(m, REACH, shooter, dt, heroRate);
                } else {
                    foe.atkNext++;
                    // DE accuracy：miss 的这一轮不打伤害（箭照飞、打空）
                    if (dps > 0) {
                        if (!('sprite' in foe)) {
                            foe.hurtBy = m;
                            foe.hurtAt = this.battleSec;
                        }
                        const shieldMul = this.skillShieldTimer[foe.f] > 0 ? 0.60 : 1.0;
                        const vulnMul = this.skillVulnTimer[foe.f] > 0 ? 1.35 : 1.0;
                        foe.hp -= dps * this.sideBonus[m.f] * gangMul(foe) * this.attritionMul() * braceTaken * flankMul * shieldMul * vulnMul * dt
                            * (!('sprite' in foe) && foe.hero ? HERO_DAMAGE_TAKEN : 1)   // 玩家等效「防」，见 HERO_DAMAGE_TAKEN
                            * ('sprite' in foe ? 1 : this.passWallTaken(foe));
                        if (foe.hp <= 0 && !('sprite' in foe)) {
                            this.onManKilled(foe, m);   // [2026-09-05 玩家] 玩家落马重整 / 玩家记功，其余留尸
                        }
                    }
                }
                // ── 近战出手：生成刀光剑影（微弯斩击刀痕 / 突刺枪芒）与碰撞金属火花 ──
                const keyStr = m.key.toLowerCase();
                const isHeavyNonBlade = keyStr.includes('elephant') || keyStr.includes('ram') || keyStr.includes('wagon');
                const isSiegeMachine = m.siegeW || minR > 0;
                const isMeleeAttacking = !isHeavyNonBlade && !isSiegeMachine && (stats.rng <= 65 || m.st === 2 || close);
                // 🔴 [2026-08-24 主人：「战斗开始前 30 秒是攻城武器攻击，但是没有音效」]
                //    凿墙那 30~40 秒此前**完全静音**，只有画面在动。撞击声必须挂在**命中相位**上：
                //    冲车/攻城锤/装甲象被 isHeavyNonBlade 排除在刀光之外（重械不该有刀光），
                //    于是它们没有任何「这一下砸中了」的标记 —— 这里补一个，与刀光同相（ph>=3），
                //    复用 m.slashed 当「本轮已出手」（isMeleeAttacking 为假时它永不置位，不会打架）。
                //    ⚠️ 绝不能写在 `if (m.lock <= 0)` 块外每帧调用：那样攻城武器**走向城墙的路上**
                //    就一直响，真正砸中的那一下反而没对齐（第一版就是这么错的）。
                if (m.siegeW && isHeavyNonBlade && !m.slashed && m.ph >= 3) {
                    m.slashed = true;
                    audioManager.play('siege_impact');
                } else if (!m.siegeW && keyStr.includes('elephant') && (stats.rng <= 65 || m.st === 2 || close) && !m.slashed && m.ph >= 3) {
                    m.slashed = true;
                    audioManager.play('elephant_attack');
                }
                if (isMeleeAttacking && !m.slashed && m.ph >= 3) {
                    m.slashed = true;
                    const attackAngle = Math.atan2(foe.y - m.y, foe.x - m.x);
                    const contactX = m.x * 0.45 + foe.x * 0.55;
                    // 🔴 [2026-10-13 主人令「修」·刀光错位] 接触点的垂直基准必须与士兵/箭矢同一口径：
                    //    士兵画在 `m.y - elevationLiftAt(m.x,m.y)`（见 render 的 it.y），箭矢也是
                    //    `y = groundY - elevationLiftAt(x, groundY) - arc`；而这里原来只减固定身高 UNIT_PX*0.35、
                    //    **没有地形抬升** ⇒ 坡地/高台/城墙上士兵被抬起来、刀光与火花却留在原始 y 上，
                    //    看着像砍进脚下的土里。取攻守双方中较高的那个抬升，保证斜坡上也贴着人。
                    const contactLift = Math.max(
                        this.elevationLiftAt(m.x, m.y),
                        this.elevationLiftAt(foe.x, foe.y),
                    );
                    const contactY = (m.y * 0.45 + foe.y * 0.55) - contactLift - UNIT_PX * 0.35;
                    const isThrust = keyStr.includes('spear') || keyStr.includes('pike') ||
                        keyStr.includes('lancer') || keyStr.includes('kamayuk') ||
                        keyStr.includes('kuang') || keyStr.includes('hoplite');
                    const kind: 'slash' | 'thrust' = isThrust ? 'thrust' : 'slash';
                    const slashColors = ['#FFFFFF', '#FFF8D6', '#FFE58F', '#F0F8FF'];
                    const color = slashColors[(Math.random() * slashColors.length) | 0];

                    this.slashes.push({
                        x: contactX,
                        y: contactY,
                        angle: attackAngle,
                        kind,
                        t: 0,
                        // [2026-08-20 主人定] 稍微加大刀光弧度与停留时间，增强近战打击感
                        dur: kind === 'thrust' ? 0.15 : 0.18,
                        radius: kind === 'thrust' ? 16 : 20,
                        color,
                        flip: Math.random() < 0.5,
                    });

                    // 出手伴随 4~7 颗金属飞溅火花（范围与尺寸适度放大）
                    const sparkCount = 4 + ((Math.random() * 4) | 0);
                    const sparkColors = ['#FFF9E6', '#FFE066', '#FFB830', '#FFFFFF'];
                    for (let i = 0; i < sparkCount; i++) {
                        const spd = 22 + Math.random() * 32;
                        const baseAng = attackAngle + Math.PI * 0.5 * (Math.random() > 0.5 ? 1 : -1);
                        const ang = baseAng + (Math.random() - 0.5) * 0.9;
                        this.sparks.push({
                            x: contactX + (Math.random() - 0.5) * 4,
                            y: contactY + (Math.random() - 0.5) * 4,
                            vx: Math.cos(ang) * spd,
                            vy: Math.sin(ang) * spd - 10,
                            t: 0,
                            dur: 0.16 + Math.random() * 0.12,
                            color: sparkColors[(Math.random() * sparkColors.length) | 0],
                            size: 1.1 + Math.random() * 0.6,
                        });
                    }
                }
            } else {
                if ((m.lock ?? 0) > 0) {
                    m.lock -= dt;
                    m.st = (m.atkSt || 1) as 0 | 1 | 2;
                    // 🔴 [2026-08-17 修] 目标消失后收势：攻击动画**播完就停在末帧**，
                    //    不再从头无限循环（这就是「像得了羊癫疯」的直接来源）。
                    //    停住这件事由渲染层的 clamp 负责，这里照常推进 ph（见上「职责划分」），
                    //    ph 继续涨，装填完那一刻若还没敌人就正好接上待命帧循环。
                    m.ph += m.ph >= 8 ? dt * (8 / LOOP_WINDOW_IDLE_SEC) : dt * 8 / 1.5;
                    continue;
                }
                // 没敌人在打 → 朝目标（最近的敌兵/敌军重心/原位警戒位）走。
                m.st = 0;
                m.fightT = 0;
                const dx = m.tx - m.x, dy = m.ty - m.y;
                const d = Math.hypot(dx, dy);
                // 🔴 到达判定：目标只剩几像素时**停下**，不要照全速冲过去。
                //    没有这一条，目标剩 2px 也走 4px → 冲过头 → 下一帧回头 → 原地来回抖，
                //    朝向又每帧按移动方向重算，就在 8 个方向之间乱跳 = 主人看到的「闪动、颤抖」。
                //    ⚠️ 这一条只管**固定目标**（巡逻航点 / 敌军重心 / 追击点）。
                //    跟着**活动锚点**走的归队队员不能套它 —— 锚点在动，8px 死区会把跟随切成
                //    两帧一循环的碎步（+4px/-0.25px…），就是主人 2026-10-03 报的「士兵不停颤抖」，
                //    见 LANE_TRACK_EPS 头注与 scratch/_probe_tremble_trace.mjs 的逐帧轨迹。
                const slot = isGuard ? null : this.laneSlotTarget(m, laneLeaders);
                const trackSlot = !!slot || m.march || isGuard;
                const step = (m.hero && (slot || m.march) && this.spawns[m.lane] ? Math.max(stats.spd, this.statsFor(this.spawns[m.lane].key, m.f).spd) : stats.spd) * spdK * dt;
                const arriveAt = trackSlot ? LANE_TRACK_EPS : Math.max(ARRIVE_EPS, step);
                if (stats.spd > 0 && d > arriveAt) {
                    const mv = trackSlot ? Math.min(step, d) : step;   // 跟随锚点/列阵推进/原位警戒归位：连续跟随，不迈整步
                    m.x += dx / d * mv;
                    m.y += dy / d * mv;
                    // 连续跟随与领队行进统一走带迟滞的 8 向（dir8Hyst）；
                    // 归队队员已靠近自身槽位（d < 24px）仅作微调时，朝向直接对齐领队朝向，绝不因几像素偏差侧转或回头。
                    const leader = slot ? laneLeaders.get(m.lane) : undefined;
                    if (slot && leader && d < 24) {
                        m.dir = leader.dir;
                    } else {
                        m.dir = this.dir8Hyst(m.dir, dx, dy);
                    }
                } else if (isGuard) {
                    const uFwd = this.advanceVec[m.f];
                    m.dir = this.dir8(uFwd.x, uFwd.y);
                } else if (slot) {
                    // 归队入列后朝向与领队保持一致
                    const leader = laneLeaders.get(m.lane);
                    if (leader) m.dir = leader.dir;
                }
            }
            if (m.fadeT > 0) m.fadeT -= dt;
            // 🔴 [2026-08-17 修] 只有走路（st=0）在循环尾部推进 ph。攻击（st=1/2）的 ph 已在
            //    攻击分支（animDur 速度，见上「攻击动画推进」）或收势分支（foe 消失 lock>0）推进过——
            //    这里再推一次 = 双重推进，攻击动画快近一倍，箭射出的相位和拉弓动作脱节（「远程动作和箭不同步」根因）。
            // 🔴 [2026-10-15 主人问「是只有他这样，还是所有的待命动作都快」]
            //    此前处于待命站姿（卡位待命、列阵待敌 holdLanes、受控待命 holdCmd、分队待命 laneStandby）的士兵仍按走路速度 dt*8（1.0 秒播满一轮）推进 ph，
            //    而非定义的 LOOP_WINDOW_IDLE_SEC(1.6 秒)，导致全场待命动作偏快 60%！此处区分站立待命与行走，待命统一按 8 / LOOP_WINDOW_IDLE_SEC 推进。
            if (m.st === 0) {
                const isIdlePose = !m.march && (
                    (m.stuckT > STUCK_IDLE_SEC && (m.stepMax ?? 0) < 0.5)
                    || holdCmd
                    || isGuard
                    || (m.lane >= 0 && this.holdLanes.has(m.lane))
                    || (laneStandby && (m.tx - m.x) ** 2 + (m.ty - m.y) ** 2 <= ARRIVE_EPS * ARRIVE_EPS)
                );
                m.ph += dt * (isIdlePose ? (8 / LOOP_WINDOW_IDLE_SEC) : 8);
            }
        }

        // 围殴计数结转：本帧数到的攻击者数留给下一帧用（同帧边遍历边结算，只能数到一半）
        for (const m of this.men) { m.atkers = m.atkNext; m.atkNext = 0; }
        for (const b of this.wallGates) { b.atkers = b.atkNext; b.atkNext = 0; }
        for (const b of this.defBuildings) { b.atkers = b.atkNext; b.atkNext = 0; }
        // 按本帧最终锁定关系核对计数；下一帧会从零重新登记追击名额。
        for (const m of this.men) { m.claimsNext = 0; }
        for (const b of this.wallGates) { b.claimsNext = 0; }
        for (const b of this.defBuildings) { b.claimsNext = 0; }
        for (const m of this.men) { if (m.foe && m.foe.hp > 0) m.foe.claimsNext++; }
        for (const m of this.men) { m.claims = m.claimsNext; }
        for (const b of this.wallGates) { b.claims = b.claimsNext; }
        for (const b of this.defBuildings) { b.claims = b.claimsNext; }

        this.separate(dt, laneLeaders);
        // 边界收口：追目标/风筝/推挤都可能把兵推出屏幕，统一 clamp 回场内（见 fieldBound）
        const activeObstructions: typeof this.decorSprites = [];
        for (const object of this.decorSprites) {
            object.obstructionTouched = false;
            if (object.layer === 'world' && object.obstruction && !object.obstructionDisabled && !object.destroyed) {
                activeObstructions.push(object);
            }
        }
        // 🔴 [2026-10-11 主人「你删除旧的13战术模式的战场界限了吗」] **这里才是真正每帧生效的旧 13 界限**：
        //    原为按**屏幕宽高**夹取（fieldW/fieldH ± 半身），注释却写着「见 fieldBound」——名不副实。
        //    现在统一走 `fieldBound`（= 120×120 格地图矩形 ±TAC_MAP_HALF_W / ±TAC_MAP_HALF_H）。
        for (const m of this.men) {
            [m.x, m.y] = this.fieldBound(m.x, m.y);
            if (activeObstructions.length > 0) {
                this.resolveWorldObstructions(m, activeObstructions);
                [m.x, m.y] = this.fieldBound(m.x, m.y);
            }
        }
        for (const object of this.decorSprites) {
            const releaseAfter = object.obstructionReleaseAfterSec;
            if (releaseAfter === undefined || object.obstructionDisabled) continue;
            object.obstructionContactSec = object.obstructionTouched ? object.obstructionContactSec + dt : 0;
            if (object.obstructionContactSec >= releaseAfter) object.obstructionDisabled = true;
        }
        // 🔴 [2026-08-17] 结算「这一帧到底挪了没有」——推挤和边界都收口之后才算得准。
        //    想走却被前面的人堵住时位移≈0，此时再播移动帧就是**原地迈腿**（主人实锤）。
        //    这里只记录，渲染层据此改播待命帧；用累计时间而不是单帧，避免在走/停边界上每帧切动画。
        for (const m of this.men) {
            // 🔴 [2026-10-03 修·冲锋静止] 列阵推进中等待槽位不属于卡死堵路，不累加 stuckT
            if (deploying || m.march) {
                m.stuckT = 0;
                m.netT = 0;
                m.stepMax = 0;
                m.prevX = m.x; m.prevY = m.y;
                continue;
            }
            const dx = m.x - m.prevX, dy = m.y - m.prevY;
            m.stepMax = Math.max(Math.abs(dx), Math.abs(dy));
            const spd = this.statsFor(m.key, m.f).spd || 0;
            const want = spd * dt;
            // ① 单帧判定：被前面的人堵死、位移≈0（响应快，原逻辑不动）
            const frameStuck = m.st === 0 && want > 0 && (dx * dx + dy * dy) < (want * 0.25) ** 2;
            // ② 净位移判定（2026-08-26 主人「战车、大象疯狂颤抖，像卡在一个地方」）：
            //    被推挤来回震荡时**单帧位移并不小**（推开又被推回），①永远判不出来，
            //    stuckT 被一路清零 → 一直播移动帧配来回跳的坐标 = 原地抽搐。
            //    改看「一个窗口内净往前挪了多少」：净位移同样不到应走距离的 1/4，就按卡住处理。
            let netStuck = false;
            m.netT += dt;
            if (m.netT >= NET_STUCK_WINDOW) {
                const ndx = m.x - m.anchorX, ndy = m.y - m.anchorY;
                const wantNet = spd * m.netT;
                netStuck = m.st === 0 && wantNet > 0 && (ndx * ndx + ndy * ndy) < (wantNet * 0.25) ** 2;
                m.anchorX = m.x; m.anchorY = m.y; m.netT = 0;
            }
            if (netStuck) m.stuckT = Math.max(m.stuckT, STUCK_IDLE_SEC + NET_STUCK_WINDOW);
            else if (frameStuck) m.stuckT += dt;
            else m.stuckT = 0; // 🔴 [2026-10-03 修] 既然正常移动迈开腿了，当帧清零 stuckT（对齐「一旦真的挪起来，当帧就切回走路」原设计，彻底杜绝冲锋待命滑步）
            m.prevX = m.x; m.prevY = m.y;
        }
        // 旗手战死 → 原地留下一面倒下的军旗。men 数组只在这一处出人，死亡侦测放这里最稳。
        for (const m of this.men) {
            if (m.hp <= 0 && m.flag) this.fallenFlags.push({ x: m.x, y: m.y, f: m.f, t: 0, fo: m.fo });
        }
        this.men = this.men.filter(m => m.hp > 0);
        // 🔴 [2026-10-11 主人令] 陆战口径：水/树林/建筑一律可通行 ⇒ 删去「逐帧把落水的士兵推回岸上」
        //    （原逻辑等于把水体当成不可通行区域，与新令冲突）
        for (const ff of this.fallenFlags) ff.t += dt;
        this.fallenFlags = this.fallenFlags.filter(ff => ff.t < FLAG_FALL);
        this.stepEffects(dt);
        // 🔴 [2026-08-29] 倒塌动画推进：collapse.t 累加，播完切 rubble 残骸常驻、清掉 collapse 状态
        for (const s of this.collapsibleSprites()) {
            const c = s.collapse;
            if (!c) continue;
            c.t += dt;
            if (c.t >= c.dur) {
                if (c.rubbleAsset) {
                    s.asset = c.rubbleAsset;
                    s.frame = 0;
                } else {
                    s.destroyed = true;
                }
                s.collapse = undefined;
            }
        }
        // 云漂移：一律左→右（攻方→守方），飘出右边就从左边绕回来
        // （用原图宽当余量，保证是整朵飘出去、整朵飘进来，绝不在画面里半途闪现）
        if (this.clouds.length && this.canvas) {
            for (const c of this.clouds) {
                c.x += c.vx * dt;
                const w = (c.img?.naturalWidth ?? 600) * c.scale;
                if (c.x > this.worldCX + TAC_MAP_HALF_W + w) c.x = this.worldCX - TAC_MAP_HALF_W - w;
            }
        }
        // 留下的尸体：死亡动画播完 → 烙进地面图永久保留（不再逐帧重画、不再参与排序）
        for (const c of this.corpses) {
            c.t += dt;
            if (c.keep !== true && c.t >= DEATH_ANIM) {
                if (this.bakeCorpse(c)) c.keep = true;   // 烙成功才标记；DE meta 未就绪返回 false，下帧重试
            }
        }
        this.corpses = this.corpses.filter(c => c.keep !== true);
        // 溃逃兵：反向移动 + 渐隐，跑完即消失（主人 2026-08-16）；穿林涉水同受地形减速
        for (const f of this.fleers) {
            const fSpdK = this.terrainSpeedAt(f.x, f.y);
            f.t += dt;
            f.x += f.vx * fSpdK * dt;
            f.y += f.vy * fSpdK * dt;
            f.ph += dt * 8;
        }
        this.fleers = this.fleers.filter(f => f.t < FLEE_DUR);

        // 🔴 [2026-10-11 主人令] **平时镜头自动跟随乱入者**；玩家可以拖拽（滚轮缩放）镜头，**9 秒**不再操作就自动回到乱入者。
        //    本块只在新战术模式跑（useGroundGL）；旧 13 无平移/缩放，不受影响。
        if (this.useGroundGL && this.canvas) {
            if (this.userInteractingTimer > 0) {
                this.userInteractingTimer -= dt;
            } else {
                let targetFocusX = 0, targetFocusY = 0, count = 0;
                if (this.heroMan) {
                    // 跟随乱入者本人（阵亡复活倒计时的 10 秒里镜头留在他倒下的地方，复活后跟到本方后方重生点）
                    targetFocusX = this.heroMan.x;
                    targetFocusY = this.heroMan.y;
                    count = 1;
                } else if (this.battleType === 'siege' || this.deCity) {
                    // 🔴 [2026-10-10 主人「现在是中间放城池，明白了吗」]
                    //    攻城战城池稳居正中心，镜头始终居中对齐正中央城郭，绝不可被交战部队拖跑甩到屏幕角落
                    targetFocusX = this.worldCX;
                    targetFocusY = this.worldCY;
                    count = 1;
                } else {
                    // 本场没有乱入者（未随军/观战）⇒ 沿用原来的「跟随交战最激烈处」
                    let sumX = 0, sumY = 0;
                    for (const m of this.men) {
                        if (m.hp > 0 && m.foe) {
                            sumX += m.x;
                            sumY += m.y;
                            count++;
                        }
                    }
                    if (count === 0) {
                        for (const m of this.men) {
                            if (m.hp > 0) {
                                sumX += m.x;
                                sumY += m.y;
                                count++;
                            }
                        }
                    }
                    if (count > 0) { targetFocusX = sumX / count; targetFocusY = sumY / count; }
                }
                if (count > 0) {
                    const desiredPanX = (this.worldCX - targetFocusX) * this.tacticalZoom;
                    const desiredPanY = (this.worldCY - targetFocusY) * this.tacticalZoom;
                    const smooth = Math.min(1.0, 1.5 * dt);
                    this.tacticalPanX += (desiredPanX - this.tacticalPanX) * smooth;
                    this.tacticalPanY += (desiredPanY - this.tacticalPanY) * smooth;
                    this.clampTacticalPan();
                }
            }
        }

        // 胜负：一方兵力枯竭（池 + 场上全灭）才算输（2026-08-11 主人修复后口径）
        const alive = [0, 0];
        for (const s of this.spawns) alive[s.f] += Math.max(0, s.pool) * s.pop;
        // 🔴 [2026-10-16 主人令「攻方没兵力了，攻方应该算输呀，攻城武器和乱入者不算兵力」]
        //    攻城武器（siegeW）不计兵力；乱入者本人 pop=0 本就不计（见 setupPlayerUnits）。
        for (const m of this.men) if (m.hp > 0 && !m.siegeW && !m.hero) alive[m.f] += m.pop;
        {
            const laneAlive = new Map<number, number>();
            for (const s of this.spawns) laneAlive.set(s.lane, (laneAlive.get(s.lane) ?? 0) + Math.max(0, s.pool) * s.pop);
            for (const m of this.men) if (m.hp > 0 && m.lane >= 0) laneAlive.set(m.lane, (laneAlive.get(m.lane) ?? 0) + m.pop);
            if (!this.laneStart && alive[0] > 0 && alive[1] > 0) this.laneStart = new Map(laneAlive);
            if (this.laneStart) {
                this.remnantLanes.clear();
                for (const [l, a] of laneAlive) { const st = this.laneStart.get(l) ?? 0; if (st > 0 && a <= st * REMNANT_FRAC) this.remnantLanes.add(l); }
            }
        }
        if (this.centerBld === undefined) this.centerBld = this.pickCenterBuilding();
        // 🔴 [2026-10-15 主人令「请等中间建筑坍塌后，再退出战术模式」] 中心建筑血归零 = 攻方已胜（centerKilled），
        //    但要等倒塌动画（COLLAPSE_ANIM_DUR）播完切成残骸才结束（centerDown）；等待期间不因攻方打光 / 到点改判。
        //    残骸素材没加载时 sprite 不会切残骸 ⇒ 最多再等 COLLAPSE_ANIM_DUR + 1.5 秒兜底。
        const centerKilled = !!this.centerBld && this.centerBld.hp <= 0;
        if (centerKilled && this.centerKilledAt < 0) this.centerKilledAt = this.battleSec;
        const cs = this.centerBld?.sprite;
        const centerDown = centerKilled && ((!cs?.collapse && (!!cs?.destroyed || !!cs?.asset.includes('_RUBBLE')))
            || this.battleSec - this.centerKilledAt >= COLLAPSE_ANIM_DUR + 1.5);
        const centerRule = this.battleType === 'siege' && !!this.centerBld;
        const timeUp = this.battleSec >= BATTLE_LIMIT_SEC;
        const waitCollapse = centerRule && centerKilled && !centerDown;
        if (waitCollapse) {
            this.meleeContactCount = 0;
            this.meleeQuietSec = MELEE_QUIET_SEC;
        }
        // 近战接触音景结账：本帧兵种循环已把 meleeContactCount 数完，这里决定淡入还是淡出。
        this.tickContactSfx(dt);
        if (!waitCollapse && (alive[0] <= 0 || (!centerRule && alive[1] <= 0) || centerDown || timeUp)) {
            this.over = true;
            if (this.contactSfxOn) {
                this.contactSfxOn = false;
                audioManager.stopSceneLoop('land_contact');
            }
            // 🔴 [2026-10-15 主人令] 300 秒倒计时到点仍未攻下城池（攻方未全灭且未拆掉中心建筑）⇒ 此次战斗算打平（'draw'）
            const isDraw = timeUp && alive[0] > 0 && !centerDown && (centerRule || alive[1] > 0);
            const attackerLost = centerRule
                ? !centerDown
                : (alive[0] <= 0 || (!centerDown && alive[1] > 0 && timeUp));
            const resultWinner: 'attacker' | 'defender' | 'draw' = isDraw
                ? 'draw'
                : (attackerLost ? 'defender' : 'attacker');
            // [2026-08-11 诊断] 主人报「兵没死光就结束」。这条日志证明是不是演出自己判的：
            // 若这条没打、场景却退了，说明是外部路径（自愈 exit / 引擎结算）提前收的场。
            // 🔴 用 console.warn 不用 gameLog：gameLog 要频道开启才打印，上一版诊断因此一条没出来
            console.warn(`🏁 [Scene13War] 演出判负(${resultWinner})：攻方余 ${alive[0]} 守方余 ${alive[1]} 精灵（1精灵=${SPRITE_TROOPS}兵）`);
            this.diagPush('decision', { winner: resultWinner, alive });
            this.diagFlush('decision');
            this.onDecision?.(
                resultWinner,
                { attacker: Math.round(alive[0] * SPRITE_TROOPS), defender: Math.round(alive[1] * SPRITE_TROOPS) },
            );
        }
        // 🔴 [2026-10-11 主人报「有的地图中，士兵不出现在出兵口，出兵口应该是营地的建筑」]
        //    开场待命期（deployT>0，实测 2.5 秒渐显倒计时）结束前，把列阵兵**钉回各自的出生点**
        //    （＝出兵口＝营地建筑所在格）。放在 step() 最末尾：本帧所有位移过程（逐兵推进/推挤/
        //    障碍推出/边界收口）都跑完之后再复位，渲染拿到的就是出生点坐标。
        //    起因（实测）：兵**生成位置本身是对的**（`anchorY` = 出兵口 y，实测 −450），
        //    但同一帧就被推离出兵口 —— 离自己出兵口的距离：步兵 485px、弩兵 684px、虎骑 884px，
        //    即越快的推得越远；而营地建筑留在出兵口上，画面就是「士兵不从营帐里出来」。
        //    待命期的既定口径本就是「全军静止渐显」（见上面 deploying 分支），故此处只是把它钉死。
        if (this.deployT > 0) {
            for (const m of this.men) {
                if (m.hp <= 0) continue;
                m.x = m.anchorX;
                m.y = m.anchorY;
                m.prevX = m.anchorX;
                m.prevY = m.anchorY;
                m.sepX = 0;
                m.sepY = 0;
            }
        }
        this.updateTacticalAnimals(dt);
    }

    /**
     * 🔴 [2026-10-13 主人令「动物逻辑和DE不一样，请核对清楚」＋「尽量真实，游戏合理」]
     * 战术动物 AI —— 五类各按 DE 的行为走（数值全部来自上方 ANIMAL_DE 表，DE 本体实测）：
     *  · prey     胆小猎物：单位进 DE 视野（鹿 2 格＝80px）就逃；脱险后**走回窝**（DE：不被追就回出生点，不是就地停）。
     *  · danger   危险猎物（野猪/犀牛/貘/战象/麋）：不逃（DE 仅被攻击才反击；本模式没有猎杀，故只闲逛）。
     *  · predator 猛兽（狼/熊/狮/虎/豹/鳄/蛇/科莫多）：单位进 DE 视野（狼 12 格＝480px）就扑上去，
     *             贴身每 DE 装填 2 秒咬一口（DE 攻击力，吃近防）；咬的同时被身边士兵捅 —— 扑进阵里活不过两口，与 DE 一致。
     *  · livestock 家畜：不惊；人贴进 DE 视野（3 格＝120px）只是慢慢让开、离家不超 2.5 格，人走回窝。
     *  · bird     飞鸟：DE 原生 1.32 格/秒飞行（fly 振翅 ⇄ hover 滑翔交替），空中持续移动不停滞。
     * 没人时所有地面动物都在窝边慢慢走动吃草（DE 的 idle/walk ＋ 同类松散牵引）。
     */
    private updateTacticalAnimals(dt: number): void {
        if (!this.tacticalAnimals.length) return;
        this.tacticalAnimals = stepTacticalAnimals(
            this.tacticalAnimals,
            this.men,
            this.worldCX,
            this.worldCY,
            dt,
            (dx, dy) => this.dir8(dx, dy),
            (an, want) => this.setAnimalAction(an, want),
        );
    }

    /** 设动物动作：素材没有的动作自动回退（run→walk→idle），绝不请求不存在的帧（否则整只不画） */
    private setAnimalAction(an: TacticalAnimal, want: AnimalAction): void {
        const de = animalDeOf(an.species);
        let act = want;
        if (!de.acts.includes(act)) act = de.acts.includes('walk') ? 'walk' : de.acts[0];
        an.action = act;
        const asset = `ANIMAL:${an.species}/${act}_${an.dir}`;
        if (an.sprite.asset !== asset) an.sprite.asset = asset;
        this.ensureNatureAsset(asset);
    }

    private clearGround(): void {
        if (this.ground && this.groundCtx) {
            this.groundCtx.clearRect(0, 0, this.ground.width, this.ground.height);
        }
        this.groundHasContent = false;
    }

    /** 兵阵亡去向：累加器裁定留尸体（死亡动画→烙地面）还是溃逃（反向移动渐隐）——主人 2026-08-16 */
    private pushCorpse(m: WarMan): void {
        // 死人打点：唯一的死亡入口，卡死检测（NO_KILL_SEC）就靠它。留尸/溃逃两条路都要记。
        this.lastKillSec = this.battleSec;
        // 🔴 自爆单位（火焰骆驼/爆破兵）被击杀：满载火油炸药当场殉爆，绝不留四蹄站立的假尸体，永不逃跑
        if (SUICIDE_TYPES.has(m.key)) {
            this.explode('FX_PETARD', m.x, m.y);
            return;
        }
        const mk = m.key.toLowerCase();
        if (mk.includes('elephant')) {
            audioManager.play('elephant_die');
        } else if (m.siegeW || mk.includes('wagon') || mk.includes('chariot')) {
            audioManager.play('siege_destroyed');
        }
        // 🔴 [2026-09-15 主人定] 攻城武器阵亡不能逃跑，只能留下尸体（残骸），永不进 fleers 通道。
        if (m.siegeW) {
            this.corpses.push({ x: m.x, y: m.y, f: m.f, key: m.key, dir: Math.floor(Math.random() * 8), t: 0 });
            return;
        }
        if (this.takeCorpseSlot()) {
            // 尸体朝向随机：每具倒向不同方向，避免全部同朝向呆板（主人 2026-08-21 定）
            this.corpses.push({ x: m.x, y: m.y, f: m.f, key: m.key, dir: Math.floor(Math.random() * 8), t: 0 });
            return;
        }
        const uBack = { x: -this.advanceVec[m.f].x, y: -this.advanceVec[m.f].y };
        const uSide = this.sideVec[m.f];
        const jitter = (Math.random() - 0.5) * 0.4;
        const spd = FLEE_SPD * (0.9 + Math.random() * 0.2);
        const vx = (uBack.x + uSide.x * jitter) * spd;
        const vy = (uBack.y + uSide.y * jitter) * spd;
        this.fleers.push({
            x: m.x, y: m.y, f: m.f, key: m.key,
            dir: this.dir8(vx, vy),
            ph: Math.random() * 8, t: 0,
            vx, vy,
        });
    }

    /**
     * 这具尸体留不留？[2026-08-22 主人定：尸体 40% / 溃逃 60%] 战场只留 CORPSE_KEEP 比例。
     * 用**累加器**而不是随机丢弃：每具加 CORPSE_KEEP，攒够 1 才留一具 —— 均匀取样，
     * 随机丢弃会让尸体分布斑驳。
     */
    private takeCorpseSlot(): boolean {
        this.corpseAcc += CORPSE_KEEP;
        if (this.corpseAcc < 1) return false;
        this.corpseAcc -= 1;
        return true;
    }

    /** 把一具尸体的死亡末帧永久烙进地面图（留不留已由 takeCorpseSlot 裁定） */
    private bakeCorpse(c: WarCorpse): boolean {
        this.lastBakeCorpseAt = performance.now();
        const g = this.groundCtx;
        if (!g) return false;
        const b = this.bank[c.key];
        if (!b) return false;
        const img = b.sets.die?.[c.f]?.[c.dir];
        if (!img) return false;
        const wt = WAR_TYPES[c.key];
        const dieN = b.frames.die ?? 8;
        const drawY = c.y - this.elevationLiftAt(c.x, c.y);
        const dm = b.dyn?.die?.[c.dir];
        // 🔴 DE 素材 meta 未就绪：延迟烙尸，等 dyn 到位再画，绝不走 S10DB 正方形 fallback 切出错位碎片
        if (!dm && b.isDE) return false;

        const inWater = this.isWaterAt(c.x, c.y);
        g.save();
        const drawFrame = () => {
            if (dm) {
                // 🔴 AoE2 DE 动态帧框（2026-08-15 修复「尸体一个都留不下」）：
                //   之前走 S10DB 正方形假设（dieFw = b.fh = 84）切 DE 动态 sheet（fw 40~120 不等），
                //   末帧切片错位/越界 → 烙进地面是空白或碎片 → 保留的 1/3 尸体视觉上全丢。
                //   这里与渲染循环同一套 hotspot 对齐 + 动态帧框。
                // 🔴 [2026-10-11 检查回滚] 上一版把这里改成 `s = 1.0`（顺手删掉 size 乘数），已恢复：
                //   尸体尺寸必须与兵模同一把尺子（UNIT_PX * sz / 64），否则同一场里尸体会和活人不一样大。
                const s = UNIT_PX * (wt?.sz ?? 1) / 64;
                const gx = c.x - (this.worldCX - TAC_MAP_HALF_W), gy = drawY - (this.worldCY - TAC_MAP_HALF_H); g.drawImage(img, (dieN - 1) * dm.fw, 0, dm.fw, dm.fh, gx - dm.hx * s, gy - dm.hy * s, dm.fw * s, dm.fh * s);
            } else {
                // S10DB 正方形帧（原逻辑不变）
                const px = UNIT_PX * (wt?.sz ?? 1) * (b.fh / 64);
                const dieFw = b.fh;   // 帧宽 = 帧高（每帧正方形）
                const gx = c.x - (this.worldCX - TAC_MAP_HALF_W), gy = drawY - (this.worldCY - TAC_MAP_HALF_H); g.drawImage(img, (dieN - 1) * dieFw, 0, dieFw, b.fh, gx - px / 2, gy - px * 0.9, px, px);
            }
        };
        if (inWater) {
            // 🔴 [2026-10-15 主人令「尸体能做成在水下吗」] 水域尸体沉入水下：
            //   ① 先用 destination-out 擦除同位置旧尸体的重叠不透明度，防止密集叠死把水面叠成 100% 不透明；
            //   ② 再以水下蓝青滤镜 + 0.38 半透明烙入，让蓝色水体透出，视觉上呈沉入水底效果。
            g.globalCompositeOperation = 'destination-out';
            g.globalAlpha = 1.0;
            drawFrame();
            g.globalCompositeOperation = 'source-over';
            g.filter = 'sepia(35%) hue-rotate(165deg) saturate(160%) brightness(62%) contrast(90%)';
            g.globalAlpha = 0.38;
            drawFrame();
        } else {
            // [环境融入] 仅做轻微压暗。去除 sepia（战场底色因地貌多变），保持 100% 不透明
            g.filter = 'brightness(80%) contrast(95%)';
            g.globalAlpha = 1.0;
            drawFrame();
        }
        g.restore();
        this.groundHasContent = true;
        return true;
    }

    /** 每帧推进（GameAppLoop 场景激活分支调用；dt = 真实秒） */
    public tick(dt: number): void {
        // 残局待命：战斗已结束、场景还没退（5 秒切换延迟）——继续跑，只是不打仗
        if (!this.active && this.lingering) {
            this.lingerStep(dt);
            this.render();
            return;
        }
        if (!this.active) return;
        // 🔴 [2026-08-17 修·根治「加载什么都会卡一下」] 这道等素材的闸**只在开战前**有效。
        //    开战后再有任何素材没就绪，都不许冻结整场：`return` 掉的是 step + render，
        //    也就是全场静止一下 —— 主人反复报的「刚一交战卡一下」「打到一半卡一下」都是它。
        //    开战后缺图不影响推演：抛射物渲染本来就是「img 未就绪跳过不画」，顶多少画几支箭。
        //    （这一版还顺手把抛射物挪到开场预载了，正常已经不会走到这条；留着是防下一次有人再加懒加载。）
        if (this.pending > 0 && !this.assetsReadyOnce) {
            // 先显示已经就绪的战场，素材等待不再迫使浏览器反复合成底下的战略地图。
            // 此处只绘制，部队部署与战斗计时仍等必需素材全部就绪才开始。
            if (this.useGroundGL) this.render();
            // 🔴 [2026-08-11 实锤] 素材 pending 卡死 = 演出冻结 + 引擎冻结（scene13Frozen）
            //    → 跟随军团永远不动、战斗面板数字不动（主人截图实锤）。
            //    素材若 30 秒内没加载完（404/跨域/异常），强制判负退出，绝不永冻：
            //    按当前兵力比判（池+场上），守方（f=1）吃 0.85 城防/主场折扣。
            if (this.pendingStartedAt === 0) this.pendingStartedAt = performance.now();
            if (performance.now() - this.pendingStartedAt > 30000) {
                console.warn(`🏁 [Scene13War] 素材 30s 未就绪（pending=${this.pending}），强制判负防死锁`);
                this.diagPush('assetTimeout', { pending: this.pending });
                this.forceResultByRatio(0.85);
            }
            return;
        }
        // 🔴 [2026-08-17 修·「打到一半突然卡一下就退场」] 计时器必须在素材就绪时归零。
        //    原来只在 start() 里置 0，于是它记的是**开战时刻**而不是「本次卡住的时刻」：
        //      t=0 首批素材加载 → pendingStartedAt=t0；t≈2.4s 全部就绪（pending=0）但计时器不清；
        //      战斗打到 30s 后，任何一次**中途懒加载**（ensureProj 首次放某种抛射物 / ensureType 新兵种）
        //      把 pending 抬回 1 → 上面那段立刻算出「已卡 30 秒」→ 当场强制判负退场。
        //    实测证据 scratch/scene13_probe_log.jsonl（2026-08-17T07:57Z 那条，主人当场报「卡顿退出」）：
        //      assetsReady 在 2.42s，assetTimeout 在 30.2s 且 pending 只有 1，
        //      双方场上还各有 291/288 精灵、池里还有 1050/1203 —— 图其实是秒回的，纯属计时器记错了起点。
        //    归零后：30 秒只用来兜「这一次真的卡住不动」，正常懒加载几毫秒就过去，不再误杀。
        this.pendingStartedAt = 0;
        // 首批素材齐了 → 从此这场仗不再为任何素材停下（见上面那道闸）
        if (this.pending <= 0) this.assetsReadyOnce = true;
        if (this.assetsReadyOnce && this.deferredAssetLoads.length) {
            const loads = this.deferredAssetLoads;
            this.deferredAssetLoads = [];
            for (const load of loads) load();
        }
        if (!this.diagAssetsReady) {   // 素材就绪的那一刻打点（诊断用，见 diagPush）
            this.diagAssetsReady = true;
            this.diagPush('assetsReady');
        }
        const now = performance.now();
        // [性能探针 2026-08-18] step/render 分开计时，落盘时随诊断一起发（DEV 才采）
        if (import.meta.env.DEV) {
            const t0 = performance.now();
            this.step(dt);
            const t1 = performance.now();
            this.render();
            const t2 = performance.now();
            const stepMs = t1 - t0, renderMs = t2 - t1;
            this.perfStep.push(stepMs);
            this.perfRender.push(renderMs);
            this.perfFrames++;
            if (this.perfStep.length > 1800) { this.perfStep.shift(); this.perfRender.shift(); }
            // [诊断 2026-08-29] 尖峰帧快照：>20ms 记下战场状态与最近重绘/坍塌/烙地时刻，定位「无水也卡」。
            if (stepMs > 20 || renderMs > 20) {
                this.spikeLog.push({
                    t: +this.battleSec.toFixed(2),
                    stepMs: +stepMs.toFixed(1), renderMs: +renderMs.toFixed(1),
                    men: this.men.length, corpses: this.corpses.length,
                    arrows: this.arrows.length, slashes: this.slashes.length,
                    wallGates: this.wallGates.length,
                    decorSprites: this.decorSprites.length,
                    sinceCollapse: this.lastCollapseAt ? Math.round(t2 - this.lastCollapseAt) : -1,
                    sinceBake: this.lastBakeCorpseAt ? Math.round(t2 - this.lastBakeCorpseAt) : -1,
                    heapMB: +(((performance as any).memory?.usedJSHeapSize ?? 0) / 1048576).toFixed(1),
                });
                if (this.spikeLog.length > 30) this.spikeLog.shift();
            }
        } else {
            this.step(dt);
            this.render();
        }
        this.last = now;
    }

    /**
     * 画旗面（不含旗杆——杆在士兵层**之下**另画，见 render 里的旗杆趟）。
     *
     * 🔴 分层与大地图完全一致（GlobalUnitRenderer 的注释原话）：
     *    `drawPole` = Behind Soldiers，`drawFlag` = On Top of Soldiers。
     *    我一开始把杆和旗面一起画在了兵之上，杆就压在人身上了（主人 2026-08-12 实锤）。
     * 🔴 白色光晕已按主人要求去掉（2026-08-12），只画一趟，不要再加回描边/阴影。
     * 🔴 飘向固定 row 5，与大地图统一 —— 别再改成跟行军方向联动（试过，主人否决）。
     *
     * 🔴 **旗面文字必须保留**（2026-08-12 主人指出，我一度关掉是错的）：
     *    势力固定色两两中位距离只有 8.0，**势力色相近是常态**（葡萄牙 vs 杜罗两边都是蓝的），
     *    光靠颜色区分不了敌我。而且旗上的字**不需要被读懂、只需要作为图案能区分**，
     *    所以小尺寸也成立 —— 这个门槛比「读清楚」低得多。
     *
     * @param tick 已含本面旗的相位偏移，别再在里面加（见 WarMan.fo）
     */
    private drawOneFlag(ctx: CanvasRenderingContext2D, x: number, y: number, f: 0 | 1, tick: number): void {
        const faction = this.sideFaction[f];
        LegionFlagDrawer.drawFlag(ctx, { x, y }, 5, FLAG_SCALE, tick, faction, -999, FLAG_POLE_RATIO, FLAG_POLE_LIFT);
    }

    // ── 绘制：只画精灵 + 尸体（出兵口 UI 不渲染）──
    /** 采样统计：返回 {n, avg, p50, p95, max}，全部保留两位 */
    private perfStat(a: number[]): Record<string, number> | null {
        if (!a.length) return null;
        const s = [...a].sort((x, y) => x - y);
        const sum = a.reduce((p, c) => p + c, 0);
        const q = (f: number) => +s[Math.min(s.length - 1, Math.floor(s.length * f))].toFixed(2);
        return { n: a.length, avg: +(sum / a.length).toFixed(2), p50: q(0.5), p95: q(0.95), max: +s[s.length - 1].toFixed(2) };
    }

    private render(): void {
        const ctx = this.ctx, cv = this.canvas;
        if (!ctx || !cv) return;
        // 🔴 [2026-10-03 主人「先刷建筑再刷兵，一起更好吗」→「请修复」] 战场与军队**一起**出现：
        //    原来第一帧画出来（地形/建筑，素材还在加载）就淡入，士兵要等素材就绪才开始渐显，中间是个空战场
        //    （实测 3 秒；真机约 1~1.5 秒）。现在等素材就绪（士兵同一刻开始部署渐显）再淡入，
        //    最多等 ENTRY_WAIT_MAX_MS，超时就让战场先淡入。
        if (this.entryFadePending
            && (this.assetsReadyOnce || performance.now() - this.entryStartedAt > Scene13WarLayer.ENTRY_WAIT_MAX_MS)) {
            this.beginEntryFade(cv);
        }
        const _tFrameStart = performance.now();
        let _tGL = 0, _tCull = 0, _tSort = 0, _tDrawDecor = 0, _tDrawUnits = 0;
        // 🔴 [2026-10-08 主人「请给战术模式添加用鼠标滚轴可以使战场画面缩放功能」]
        const zoom = this.tacticalZoom;
        const hasZoom = Math.abs(zoom - 1) > 0.001;
        const hasPan = Math.abs(this.tacticalPanX) > 0.5 || Math.abs(this.tacticalPanY) > 0.5;
        const cx = cv.width / 2;
        const cy = cv.height / 2;
        // 世界中心开战时定死（worldCX/CY）；窗口缩放后它和画布中心不再重合，也要做变换
        const hasShift = Math.abs(this.worldCX - cx) > 0.5 || Math.abs(this.worldCY - cy) > 0.5;
        const hasTransform = hasZoom || hasPan || hasShift;

        if (hasTransform) {
            ctx.clearRect(0, 0, cv.width, cv.height);
            ctx.save();
            ctx.translate(cx + this.tacticalPanX, cy + this.tacticalPanY);
            ctx.scale(zoom, zoom);
            ctx.translate(-this.worldCX, -this.worldCY);
        }

        if (this.useGroundGL && this.groundLayerGL) {
            const _tgl0 = performance.now();
            const camZoom = zoom;
            const camX = cv.width / 2 + this.tacticalPanX - TAC_MAP_HALF_W * camZoom;
            const camY = cv.height / 2 + this.tacticalPanY - TAC_MAP_HALF_H * camZoom;
            this.groundLayerGL.setCamera({ x: camX, y: camY, zoom: camZoom });
            this.groundLayerGL.render();
            _tGL = performance.now() - _tgl0;
            if (!hasTransform) {
                ctx.save();
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.clearRect(0, 0, cv.width, cv.height);
                ctx.restore();
            }
            // 🔴 DE 涉水水波交互 (Wading Ripples)：涉水行军与倒在水中的士兵产生微弱同心水圈
            this.drawCityPlazas(ctx);
            this.syncDeCityGround();
            this.renderWadingRipples(ctx, performance.now() * 0.001);
        } else if (!hasTransform) {
            ctx.clearRect(0, 0, cv.width, cv.height);   // GL 地面还没就绪：只清屏，不画任何旧地面
        }

        // [PERF 2026-08-29] 对象池复用：原来每帧 new 700+ 个临时对象（vis 数组 + 每个元素），加剧 GC。
        const vis = this.visPool;
        let vi = 0;
        const take = () => {
            let it = vis[vi];
            if (!it) { it = { kind: 'unit', y: 0, x: 0, f: 0, key: '', dir: 0, set: '', fr: 0, a: 1, z: 0, zid: 0, sprite: null }; vis[vi] = it; }
            vi++;
            return it;
        };
        // DE 式世界对象：树木、岩石、资源等不再烙进背景，按脚点 y 与单位共同排序。
        const _tcull0 = performance.now();
        const cullDecor = this.useGroundGL;
        const vMargin = 120;
        const vMinX = (0 - cx - this.tacticalPanX) / zoom + this.worldCX - vMargin;
        const vMaxX = (cv.width - cx - this.tacticalPanX) / zoom + this.worldCX + vMargin;
        const vMinY = (0 - cy - this.tacticalPanY) / zoom + this.worldCY - vMargin;
        const vMaxY = (cv.height - cy - this.tacticalPanY) / zoom + this.worldCY + vMargin;
        let decorDrawnCount = 0;
        for (const sprite of this.decorSprites) {
            if (sprite.destroyed) continue;   // 城墙/城门已破：不再绘制
            if (cullDecor && (sprite.x < vMinX || sprite.x > vMaxX || sprite.y < vMinY || sprite.y > vMaxY)) continue;
            if (sprite.layer === 'world' || (this.useGroundGL && sprite.layer === 'ground')) {
                const it = take();
                it.kind = 'environment';
                it.y = sprite.y - (sprite.lift !== undefined ? sprite.lift : this.elevationLiftAt(sprite.x, sprite.y));
                it.z = sprite.layer === 'ground' ? -10 : sprite.z;
                it.zid = 0;
                it.sprite = sprite;
                decorDrawnCount++;
            }
        }
        _tCull = performance.now() - _tcull0;
        this.perfStats.decorTotal = this.decorSprites.length;
        this.perfStats.decorDrawn = decorDrawnCount;
        this.perfStats.decorCulled = this.decorSprites.length - decorDrawnCount;
        // 已烙的尸体：一张图搞定（在所有活人之下）
        if (this.groundHasContent && this.ground) ctx.drawImage(this.ground, this.worldCX - TAC_MAP_HALF_W, this.worldCY - TAC_MAP_HALF_H);
        // 留下的尸体：死亡动画逐帧画（全程不透明，播完即烙地面）
        for (const c of this.corpses) {
            const it = take();
            it.kind = 'unit';
            it.y = c.y - this.elevationLiftAt(c.x, c.y); it.x = c.x; it.f = c.f; it.key = c.key; it.dir = c.dir; it.set = 'die';
            it.fr = c.t;
            it.a = this.isWaterAt(c.x, c.y) ? (1 - 0.62 * Math.min(1, c.t / DEATH_ANIM)) : 1;
            it.st = undefined; it.z = 0; it.zid = 0; it.sprite = null;
        }
        // 溃逃兵：跑动帧 + 反向移动 + 渐隐（主人 2026-08-16）
        for (const f of this.fleers) {
            const it = take();
            it.kind = 'unit';
            it.y = f.y - this.elevationLiftAt(f.x, f.y); it.x = f.x; it.f = f.f; it.key = f.key; it.dir = f.dir; it.set = 'move';
            it.fr = f.ph;
            it.a = Math.max(0, 1 - f.t / FLEE_DUR);
            it.st = undefined; it.z = 0; it.zid = 0; it.sprite = null;
        }
        for (const m of this.men) {
            // 有冲锋组的兵种（象兵/弓骑）两处用冲锋帧（主人 2026-08-12 拍板「两者都要」）：
            //   ① 移动时**逐轮交替**：一轮移动、一轮冲锋（见 CHARGE_CYCLE）；
            //   ② 攻击时按出手轮次与攻击帧交替（m.atkFlip 每轮出手翻转）。
            // 其余兵种不受影响：赶路一律移动帧、攻击固定攻击帧。白刃（st=2）用近战帧。
            const hasChg = !!this.bank[m.key]?.sets.charge?.[m.f]?.length;
            let set: string;
            // 残局待命 / 开场列阵待命：全军播待命帧（没有待命素材的退回移动帧，绝不留静止画面）。
            // 🔴 [2026-08-30 修·滑步] 部署期（deployT>0）step 的 deploying 分支对**所有**兵 continue（静止）、
            //    marchTick 也 return，所以部署期全军（含列阵兵、攻城武器）都静止，应统一播 idle。
            //    之前误加 !m.march && !m.siegeW，让静止的列阵兵播走路帧 = 原地踏步/滑步。
            //    攻城武器真正开动是 deployT 归零后开打阶段，由下面 !m.siegeW 单独管。
            if (this.lingering || this.deployT > 0) {
                set = this.bank[m.key]?.sets.idle?.[m.f]?.length ? 'idle' : 'move';
            }
            // 🔴 [2026-10-13 主人令「现在所有都改为开局就动」] 原「攻城战开战前 30 秒守方播待机帧」那条分支
            //    （判据 `battleType === 'siege' && m.f === 1 && defenderHolding`）随待命期一并删除；
            //    守方不动的判据只剩上面的 deployT / lingering，以及下面按 `stuckT` 的结果判。
            // 🔴 [2026-08-17] 站着不动的兵播待命帧（远程让位、被挤住、走不动，全算在内）。
            //    **按结果判不按原因判**：不管挡路判定有没有漏网、不管近战远程，
            //    只要连着 STUCK_IDLE_SEC 没挪窝就别迈腿；一旦真的挪起来，当帧就切回走路。
            // 首批列阵仍在整体推进时，骑兵会用自身高速追上按最慢兵种前移的槽位，随后多帧停在
            // ARRIVE_EPS 内等槽位继续前移；这不是堵死，不能因 stuckT 改播 idle，避免骑兵静止滑行。
            // 🔴 [2026-10-11 主人报「移动时贴图滑步、没有移动动作」] 原来只看 m.stuckT > STUCK_IDLE_SEC 就播 idle，
            //    而 stuckT 是**部署期待命期间**累起来的 ⇒ 一开拔位移已发生、渲染却继续选 idle = 滑步
            //    （塌墙函数里那条注释正是描述这个现象）。现在**再加一条「本帧真的没动」**才许播 idle：
            //    |Δx|<0.5 且 |Δy|<0.5 ⇒ 移动中永远播走路帧。
            //    🔴 [2026-10-13] 这条判据此前**恒成立**：step 末尾结算卡住时已把 prevX/prevY 写成当前位置，
            //    渲染层再拿 m.x - m.prevX 比恒为 0（真机实测 1%~4% 的移动帧误播待命）。改读 step 结算好的 m.stepMax。
            else if (!m.march && ((m.stuckT > STUCK_IDLE_SEC && (m.stepMax ?? 0) < 0.5)
                || (m.st === 0 && (!!m.guardPost || (this.skillPanicTimer[m.f] > 0 && !m.hero && !m.siegeW))))
                && this.bank[m.key]?.sets.idle?.[m.f]?.length) {
                set = 'idle';
            }
            else if (m.st === 0) {
                const odd = Math.floor(m.ph / CHARGE_CYCLE) % 2 === 1;
                set = (hasChg && odd) ? 'charge' : 'move';
            }
            // 🔴 [2026-08-17] 攻击动作播完、还在等装填 → 回待命姿势，别定格在最后一帧。
            //    DE 的做法就是这样：攻击动画只播一遍，播完回 idle 站姿，装填走它自己的计时。
            //    不加这条的话，长装填兵种会**保持挥/举的姿势僵住好几秒**：
            //    动作固定 1.5s 播完，而火炮装填 6.5s（僵 5s）、牵引投石机 11s（僵 9.5s）。
            //    （短装填兵种 reload≈2s 只僵 0.5s，本来就看不出来。）
            //    没有 idle 素材的兵种退回原样定格末帧 —— 绝不退回 move，站着原地迈腿更假。
            else if (m.ph >= 8 && (m.lock ?? 0) > 0 && this.bank[m.key]?.sets.idle?.[m.f]?.length) {
                set = 'idle';
            }
            else if (m.st === 2) set = 'melee';
            else if (m.atkFlip && hasChg) set = 'charge';
            else set = 'atk';
            // 🔴 [2026-10-11 主人令] 法师类／无攻击动作的兵种：**攻击帧集为空时退回待命帧**。
            //    否则渲染层取不到图会 `if (!img) continue` —— 整个兵模被跳过，一出手就闪没（诸葛亮/布塞法洛斯原来就是这样）。
            if ((set === 'atk' || set === 'melee' || set === 'charge') && !this.bank[m.key]?.sets[set]?.[m.f]?.length) {
                set = this.bank[m.key]?.sets.idle?.[m.f]?.length ? 'idle' : 'move';
            }
            const fade = m.fadeT > 0 ? 1 - m.fadeT / (m.fadeMax || FADE_IN) : 1;
            const it = take();
            it.kind = 'unit';
            it.y = m.y - this.elevationLiftAt(m.x, m.y); it.x = m.x; it.f = m.f; it.key = m.key; it.dir = m.dir; it.set = set; it.fr = m.ph; it.a = fade; it.st = m.st;
            it.z = 0; it.zid = m.zid; it.sprite = null;
        }
        vis.length = vi;
        const _tsort0 = performance.now();
        // 🔴 [2026-10-18 主人报「这个兵在城门这里呆着，总是闪」]
        //    y 只差几像素时，士兵与城墙/城门（environment）会逐帧互换前后：兵贴着墙基站，
        //    y 被推挤/落脚修正抖 1~2px，跨过 ZORDER_EPS 就翻一次层 ⇒ 看起来人一直闪。
        //    近墙 12px 内固定「人压在环境之上」（城门洞里本来也是人在墙前），超出 12px 仍按 y 排。
        const ENV_ZORDER_EPS = 12;
        vis.sort((a, b) => {
            const dy = a.y - b.y;
            const aEnv = a.kind === 'environment', bEnv = b.kind === 'environment';
            if (aEnv !== bEnv && Math.abs(dy) < ENV_ZORDER_EPS) return aEnv ? -1 : 1;
            // 拥挤时 y 每帧抖 1~2px，严格按 y 排会让重叠兵「谁上谁下」狂闪 → 接近时用出生序号 zid 定序（终身不变）
            if (Math.abs(dy) < ZORDER_EPS) return a.zid - b.zid;
            return dy || ((a.kind === 'environment' ? a.z : 0) - (b.kind === 'environment' ? b.z : 0));
        });
        // 🔴 [2026-10-13 主人令「飞鸟应该显示在建筑上层」] 飞鸟在空中：排序后整体挪到队尾，最后画 ⇒ 压在建筑、塔、士兵之上
        {
            let w = 0;
            const birds: typeof vis = [];
            for (let i = 0; i < vis.length; i++) {
                const v = vis[i];
                const a = v.kind === 'environment' && v.sprite ? v.sprite.asset : '';
                if (a.startsWith('ANIMAL:') && animalDeOf(a.slice(7, a.indexOf('/'))).kind === 'bird') birds.push(v);
                else vis[w++] = v;
            }
            for (const b of birds) vis[w++] = b;
        }
        _tSort = performance.now() - _tsort0;

        // ── [2026-09-05 玩家] 受控编队脚下标记环（画在人之下）：攻击=绿 / 待命=蓝；玩家脚下金环 ──
        if (this.playerSetup && this.playerCtlLanes.size) {
            ctx.save();
            ctx.lineWidth = 1.2;
            ctx.strokeStyle = this.playerCmd === 'hold' ? 'rgba(120,180,255,0.75)' : 'rgba(120,235,140,0.7)';
            for (const m of this.men) {
                if (m.hp <= 0 || m.hero || !this.playerCtlLanes.has(m.lane)) continue;
                const r = this.radiusOf(m.key) * 0.9;
                ctx.beginPath();
                ctx.ellipse(m.x, m.y - this.elevationLiftAt(m.x, m.y) + 1, r, r * 0.5, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        }
        if (this.heroMan && this.heroMan.hp > 0) {
            const h = this.heroMan;
            ctx.save();
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(255,210,122,0.95)';
            ctx.beginPath();
            ctx.ellipse(h.x, h.y - this.elevationLiftAt(h.x, h.y) + 1, 22, 11, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // ── 旗杆：画在士兵层**之下**（主人 2026-08-12「只改旗杆，放到士兵层下面」）──
        // 与大地图同序：GlobalUnitRenderer 先 drawPole（Behind Soldiers）、后 drawFlag（On Top）。
        // 只画不等：LegionFlagDrawer 没预加载完时自己 return，绝不在 13 里 await。
        const flagTick = performance.now();
        for (const m of this.men) {
            if (!m.flag) continue;
            LegionFlagDrawer.drawPole(ctx, { x: m.x, y: m.y - this.elevationLiftAt(m.x, m.y) }, FLAG_SCALE, this.sideFaction[m.f], FLAG_POLE_RATIO, FLAG_POLE_LIFT);
        }

        for (const v of vis) {
            if (v.kind === 'environment') {
                const _td0 = performance.now();
                this.drawDecorSprite(ctx, v.sprite!, v.y);
                _tDrawDecor += performance.now() - _td0;
                continue;
            }
            const _tu0 = performance.now();
            const b = this.bank[v.key];
            if (!b) continue;
            const img = b.sets[v.set]?.[v.f]?.[v.dir];
            if (!img) continue;
            const wt = WAR_TYPES[v.key];
            // [2026-08-15 全帧修复] 各动作帧数不同（S10DB=8，AoE2=30~60），
            // 帧宽按该动作实际帧数算、帧号按「每秒 8 相位」换算，循环节奏与原 8 帧素材一致。
            const n = b.frames[v.set] ?? 8;
            const fr = v.set === 'die'
                ? Math.min(n - 1, Math.floor(v.fr / DEATH_ANIM * n))   // 死亡：DEATH_ANIM 内播完 n 帧，冻结末帧
                : (v.set === 'move' || v.set === 'idle' || v.st === 0)
                    ? Math.floor(v.fr * n * loopRate(b, v.set) / 8) % n // 移动/待命/走路：循环
                    : Math.min(n - 1, Math.floor(v.fr * n / 8));       // 攻击/近战/冲锋：播满停末帧（ph=8 不再溢出回第一帧）
            const dm = b.dyn?.[v.set]?.[v.dir];
            // 🔴 DE 素材 meta 未就绪：跳过本帧，S10DB 正方形假设（fh=84）会切错 DE 非正方形 strip（144px 等）
            if (!dm && b.isDE) continue;
            if (v.a < 1) ctx.globalAlpha = v.a;
            if (dm) {
                // 🔴 AoE2 DE 动态帧框（hotspot 对齐，2026-08-15 定稿）：
                //   游戏里 hotspot = canvas 中心，渲染时 hotspot 对齐单位位置，脚底随动作浮动（倒地时大幅下移）。
                //   这里把 box 里的 hotspot(dm.hx/dm.hy) 对齐 v.x/v.y，统一缩放 s —— 站立帧/横躺帧都完整，无裁切。
                // 🔴 [2026-10-11 检查回滚] 上一版把这里改成 `s = 1.0`（顺手删掉 size 乘数 sz），已恢复：
                //   UNIT_PX = 64 ⇒ 基准缩放本来就是 1.0（DE 原生），`sz` 是**兵种之间的相对尺子**
                //   （骑兵 1.15~1.2、战象 0.7~0.8、法师 0.55，共 25 支），删掉它等于把战象凭空放大 25~43%。
                const s = UNIT_PX * (wt?.sz ?? 1) / 64;   // 统一缩放（站立高度 64 参考）
                ctx.drawImage(img, fr * dm.fw, 0, dm.fw, dm.fh, v.x - dm.hx * s, v.y - dm.hy * s, dm.fw * s, dm.fh * s);
            } else {
                // S10DB 正方形帧（原逻辑不变）
                const px = UNIT_PX * (wt?.sz ?? 1) * (b.fh / 64);
                ctx.drawImage(img, fr * b.fh, 0, b.fh, b.fh, v.x - px / 2, v.y - px * 0.9, px, px);
            }
            if (v.a < 1) ctx.globalAlpha = 1;
            _tDrawUnits += performance.now() - _tu0;
        }

        // ── 旗面：画在所有人之上（旗杆已在士兵层之下画过）──
        // 🔴 必须**单开一趟、不参与 y 排序**：排序看的是脚底 y，而旗杆比人高得多，
        //    混进 vis 会让前排的人盖住后排的旗面 —— 旗帜作为「穿透人群的信息层」就废了一半。
        // 🔴 只画不等：LegionFlagDrawer 没预加载完时 drawFlag 自己 return（不崩、只是暂时没旗）。
        //    绝不在 13 里 await 旗帜加载 —— 启动慢那次（89s→11s）就是全屏 24 面旗 await 阻塞。
        for (const m of this.men) {
            if (!m.flag) continue;
            this.drawOneFlag(ctx, m.x, m.y - this.elevationLiftAt(m.x, m.y), m.f, flagTick + m.fo);
        }
        // 倒下的军旗：前半程转倒 90°，全程淡出。
        // 这里**杆和旗面一起**画在旋转变换里 —— 倒下的是整面旗，杆不能留在原地竖着。
        for (const ff of this.fallenFlags) {
            const p = ff.t / FLAG_FALL;
            ctx.save();
            ctx.translate(ff.x, ff.y - this.elevationLiftAt(ff.x, ff.y));
            ctx.rotate(Math.PI / 2 * Math.min(1, p * 2));
            ctx.globalAlpha = 1 - p;
            LegionFlagDrawer.drawPole(ctx, { x: 0, y: 0 }, FLAG_SCALE, this.sideFaction[ff.f], FLAG_POLE_RATIO, FLAG_POLE_LIFT);
            this.drawOneFlag(ctx, 0, 0, ff.f, flagTick + ff.fo);
            ctx.restore();
        }

        // ── [2026-09-05 玩家] 玩家头顶名牌 + 血条（画在人之上；镜像时反翻转让文字正向）──
        if (this.heroMan && this.heroMan.hp > 0 && this.playerSetup) {
            const h = this.heroMan;
            const maxHp = this.statsFor(h.key, h.f).hp || 1;
            const sx = h.x;
            const sy = h.y - this.elevationLiftAt(h.x, h.y) - UNIT_PX * 1.25;
            ctx.save();
            ctx.font = "bold 13px 'Noto Serif SC','SimSun',serif";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(0,0,0,0.8)';
            ctx.strokeText(this.playerSetup.heroName, sx, sy);
            ctx.fillStyle = '#ffd27a';
            ctx.fillText(this.playerSetup.heroName, sx, sy);
            const bw = 40, bh = 4;
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(sx - bw / 2, sy + 2, bw, bh);
            ctx.fillStyle = '#e04a3a';
            ctx.fillRect(sx - bw / 2, sy + 2, bw * Math.max(0, Math.min(1, h.hp / maxHp)), bh);
            ctx.restore();
        }

        // 箭矢与火器弹丸画在人上面。🔴 2026-08-22 对齐 DE 本体：火药兵种（火枪手/苏丹亲兵/征服者/风琴炮）增加 DE 原版白烟弹线 (Unit 1648 Trail Smoke) 与枪口硝烟
        if (this.arrows.length) {
            ctx.save();
            for (const a of this.arrows) {
                const delay = a.delay ?? 0;
                if (a.t < delay) continue;          // 连发尚未射出
                const p = (a.t - delay) / a.dur;
                const d = a.len * p;
                // 高抛（炮弹/手榴弹）弧高翻倍；有 DE 实值的弹丸按其 projectile_arc；平直弹丸无弧。
                const arcRatio = PROJ_ARC_RATIO[a.proj] ?? (PROJ_HIGH_ARC.has(a.proj) ? 0.5 : 0.3);
                const arcH = Math.min(a.len * arcRatio, PROJ_HIGH_ARC.has(a.proj) ? 160 : 100);
                const flatFlight = !!a.towerFlight || PROJ_FLAT.has(a.proj);
                const arc = flatFlight ? 0 : 4 * arcH * p * (1 - p);
                const x = a.x + a.dx * d;
                const groundY = a.y + a.dy * d;
                const flightLift = a.towerFlight
                    ? a.towerFlight.startLift + (a.towerFlight.endLift - a.towerFlight.startLift) * p
                    : this.elevationLiftAt(x, groundY);
                const y = groundY - flightLift - arc;

                const startLift = a.towerFlight?.startLift ?? this.elevationLiftAt(a.x, a.y);
                const startX = a.x;
                const startY = a.y - startLift;

                // ── 💨 火枪手白烟弹线 (Unit 1648 Trail Smoke) 与枪口硝烟 ──
                const isGunpowder = a.proj === 'PROJ_GUNPOWDER';

                if (isGunpowder) {
                    const trailLen = Math.min(d, 85);
                    const tailX = x - a.dx * trailLen;
                    const tailY = y - a.dy * trailLen;

                    // [PERF 2026-08-29] 白烟弹线改预渲染 sprite：save/restore 隔离变换，视觉与渐变线一致
                    const trailAngle = Math.atan2(a.dy, a.dx);
                    ctx.save();
                    ctx.translate(tailX, tailY);
                    ctx.rotate(trailAngle);
                    ctx.drawImage(gunpowderTrailSprite(), 0, 0, 90, 4, 0, -2, trailLen, 4);
                    ctx.restore();

                    // 枪口瞬间微硝烟
                    const elapsed = a.t - delay;
                    if (elapsed < 0.16) {
                        const puffP = elapsed / 0.16;
                        const smokeR = 2 + puffP * 9;
                        const smokeAlpha = Math.max(0, 0.65 - puffP * 0.65);
                        ctx.save();
                        ctx.fillStyle = `rgba(235, 238, 245, ${smokeAlpha})`;
                        ctx.beginPath();
                        ctx.arc(startX, startY, smokeR, 0, Math.PI * 2);
                        ctx.fill();

                        if (elapsed < 0.05) {
                            const flashAlpha = (1 - elapsed / 0.05) * 0.90;
                            ctx.fillStyle = `rgba(255, 230, 130, ${flashAlpha})`;
                            ctx.beginPath();
                            ctx.arc(startX + a.dx * 3, startY + a.dy * 3, 2.5, 0, Math.PI * 2);
                            ctx.fill();
                        }
                        ctx.restore();
                    }
                }

                if (a.proj === 'PROJ_MAGIC') {
                    // 🔴 [2026-10-18 主人定] 简单魔法系弹道：短流光尾迹 + 青白/淡金双层微光法球，干净克制不遮挡战场
                    const tailLen = Math.min(d, 22);
                    const tailX = x - a.dx * tailLen;
                    const tailY = y - a.dy * tailLen;
                    ctx.save();
                    ctx.strokeStyle = a.f === 0 ? 'rgba(130, 225, 255, 0.55)' : 'rgba(255, 215, 130, 0.55)';
                    ctx.lineWidth = 2.6;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.moveTo(tailX, tailY);
                    ctx.lineTo(x, y);
                    ctx.stroke();

                    ctx.fillStyle = a.f === 0 ? 'rgba(100, 215, 255, 0.38)' : 'rgba(255, 200, 100, 0.38)';
                    ctx.beginPath();
                    ctx.arc(x, y, 6.2, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = a.f === 0 ? 'rgba(195, 245, 255, 0.92)' : 'rgba(255, 238, 175, 0.92)';
                    ctx.beginPath();
                    ctx.arc(x, y, 3.6, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(x, y, 1.8, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                    continue;
                }

                const pa = this.projBank[a.proj];
                if (!pa?.img || !pa.fw) continue;   // 素材未就绪（加载中跳过）

                // 🔴 [2026-08-16 修复向北及全向弹道切线角]
                const vx = a.dx * a.len;
                const vy = a.dy * a.len - (flatFlight ? 0 : 4 * arcH * (1 - 2 * p))
                    - (a.towerFlight ? a.towerFlight.endLift - a.towerFlight.startLift : 0);
                const angle = Math.atan2(vy, vx) + (PROJ_ANGLE_OFFSET[a.proj] ?? 0);

                const S = PROJ_SCALE * (PROJ_SCALE_OVERRIDE[a.proj] ?? 1);
                let fr = 0;
                const isChakram = a.proj === 'PROJ_CHAKRAM' || a.proj === 'PROJ_CHAKRAM_ELITE';
                if (isChakram) {
                    // DE 原素材：16 个飞行方向 × 每方向 10 帧旋转动画，方向组连续排列。
                    const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
                    const direction = Math.round(normalizedAngle / (Math.PI * 2) * 16) % 16;
                    fr = direction * 10 + Math.floor(p * 20) % 10;
                } else if (a.proj === 'PROJ_THROWING_AXE') {
                    // 飞斧空中 360° 旋转
                    fr = Math.floor(p * 24) % pa.n;
                } else if (a.proj === 'PROJ_FIRE' || a.proj === 'FLAMETHROWER_FLAME') {
                    // 猛火油柜喷火 / 法师的希腊火：30 帧火焰动画循环播放
                    fr = Math.floor(p * pa.n) % pa.n;
                } else if (PROJ_FRAME_DUR[a.proj]) {
                    fr = Math.floor((a.t - delay) / PROJ_FRAME_DUR[a.proj]) % pa.n;
                } else if (pa.n > 1) {
                    // 箭矢/标枪/飞镖取正水平基准帧，由 rotate(angle) 切线角精确控制全 360° 俯仰与起伏
                    fr = Math.floor(pa.n / 2);
                }

                ctx.translate(x, y);
                // 飞轮的 16 向角度已经画在 DE 原帧里；其他弹丸仍旋转水平基准帧。
                if (!isChakram) ctx.rotate(angle);
                ctx.drawImage(pa.img, fr * pa.fw, 0, pa.fw, pa.fh, -pa.hx * S, -pa.hy * S, pa.fw * S, pa.fh * S);
                if (!isChakram) ctx.rotate(-angle);
                ctx.translate(-x, -y);
            }
            ctx.restore();
        }

        // ── 云：画在**所有东西之上**（士兵/旗帜/箭矢之后），半透明横向飘过 ──
        // 🔴 这是全场唯一"盖在人上面"的装饰层。
        //    以中心为锚点，各自按 c.scale 缩放绘制。
        for (const c of this.clouds) {
            if (!c.img) continue;
            const iw = c.img.naturalWidth * c.scale, ih = c.img.naturalHeight * c.scale;
            if (!iw || !ih) continue;
            ctx.globalAlpha = c.alpha;
            if (c.flip) {
                ctx.save();
                ctx.translate(c.x, c.y);
                ctx.scale(-1, 1);
                ctx.drawImage(c.img, -iw / 2, -ih / 2, iw, ih);
                ctx.restore();
            } else {
                ctx.drawImage(c.img, c.x - iw / 2, c.y - ih / 2, iw, ih);
            }
            ctx.globalAlpha = 1;
        }

        // ── 刀光剑影（半月斩击弧光 & 突刺枪芒 & 接触星芒）──
        if (this.slashes.length) {
            ctx.save();
            for (const s of this.slashes) {
                const p = Math.min(1, s.t / s.dur);
                const alpha = Math.max(0, 1 - p * p) * 0.9;
                ctx.save();
                ctx.translate(s.x, s.y);
                ctx.rotate(s.angle);
                ctx.globalAlpha = alpha;

                // 命中瞬间接触星芒（瞬态十字闪光）
                if (p < 0.4) {
                    const fp = p / 0.4;
                    const fa = (1 - fp) * 0.95;
                    const sl = (s.kind === 'thrust' ? 5.5 : 7) * (1 - fp * 0.35);
                    ctx.save();
                    ctx.globalAlpha = fa;
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 1.2 * (1 - fp);
                    ctx.beginPath();
                    ctx.moveTo(-sl, 0); ctx.lineTo(sl, 0);
                    ctx.moveTo(0, -sl); ctx.lineTo(0, sl);
                    ctx.stroke();
                    ctx.restore();
                }

                if (s.kind === 'slash') {
                    // 刀剑微弯斩击刀痕（弧刃更清晰张扬）
                    const len = s.radius * (0.9 + p * 0.2);
                    const h = s.flip ? -3.8 : 3.8;

                    // 外层微光
                    ctx.beginPath();
                    ctx.moveTo(0, -len * 0.5);
                    ctx.quadraticCurveTo(h, 0, 0, len * 0.5);
                    ctx.strokeStyle = s.color;
                    ctx.lineWidth = 2.0 * (1 - p);
                    ctx.lineCap = 'round';
                    ctx.shadowColor = s.color;
                    ctx.shadowBlur = 3;
                    ctx.stroke();

                    // 核心白亮线
                    ctx.beginPath();
                    ctx.moveTo(0, -len * 0.38);
                    ctx.quadraticCurveTo(h * 0.7, 0, 0, len * 0.38);
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 1.0 * (1 - p);
                    ctx.stroke();
                } else {
                    // 长枪/矛突刺短芒（沿刺击方向的坚挺枪芒）
                    const len = s.radius * (0.85 + p * 0.3);

                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(len, 0);
                    ctx.strokeStyle = s.color;
                    ctx.lineWidth = 1.8 * (1 - p);
                    ctx.lineCap = 'round';
                    ctx.shadowColor = '#FFFFFF';
                    ctx.shadowBlur = 3;
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(len * 0.75, 0);
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 0.9 * (1 - p);
                    ctx.stroke();
                }
                ctx.restore();
            }
            ctx.restore();
        }

        // ── 兵刃交锋火花（金属飞溅火星）──
        if (this.sparks.length) {
            ctx.save();
            for (const s of this.sparks) {
                const alpha = Math.max(0, 1 - s.t / s.dur) * 0.9;
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = s.color;
                ctx.lineWidth = s.size;
                ctx.lineCap = 'round';

                // 沿速度反方向拉出火星尾迹线
                const tailScale = 0.024;
                const tailX = s.x - s.vx * tailScale;
                const tailY = s.y - s.vy * tailScale;

                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(tailX, tailY);
                ctx.stroke();

                // 火星头部亮点
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // ── DE 攻击特效（爆炸/炮口焰，画在火花之上）──
        if (this.fxs.length) {
            for (const f of this.fxs) {
                const fx = this.fxBank[f.type];
                if (!fx) continue;
                const fd = fx.dirs[f.dir % fx.dirs.length];
                if (!fd?.img || !fd.fw) continue;   // 素材未就绪跳过
                const p = Math.min(1, f.t / f.dur);
                const fr = Math.min(fd.n - 1, Math.floor(p * fd.n));
                const s = f.scale;
                ctx.drawImage(fd.img, fr * fd.fw, 0, fd.fw, fd.fh, f.x - fd.hx * s, f.y - fd.hy * s, fd.fw * s, fd.fh * s);
            }
        }
        if (hasTransform) ctx.restore();
        this.coverStrategyMap();
        // [2026-09-03] 时段色调：所有精灵画完后两次整画布合成；DEV 单独计时进 perf.tint
        if (this.timeOfDay.active && this.useGroundGL) {   // 地形缺图时画布不是满铺，不能整屏压色
            const _tt0 = import.meta.env.DEV ? performance.now() : 0;
            this.timeOfDay.paint(ctx, cv.width, cv.height, performance.now());
            if (import.meta.env.DEV) {
                this.perfTint.push(performance.now() - _tt0);
                if (this.perfTint.length > 1800) this.perfTint.shift();
            }
        }
        this.perfStats.tGL = +_tGL.toFixed(2);
        this.perfStats.tCull = +_tCull.toFixed(2);
        this.perfStats.tSort = +_tSort.toFixed(2);
        this.perfStats.tDrawDecor = +_tDrawDecor.toFixed(2);
        this.perfStats.tDrawUnits = +_tDrawUnits.toFixed(2);
        this.perfStats.tTotal = +(performance.now() - _tFrameStart).toFixed(2);
    }

}
