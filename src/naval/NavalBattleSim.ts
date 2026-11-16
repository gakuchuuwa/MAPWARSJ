/**
 * 海战场面 · 模拟层（纯逻辑，不碰 DOM / 画布，离线可验算：tools/naval-sim-check.mts）
 *
 * 🔴 [2026-11-16 主人定「按这个方向做」] 舰队对舰队的海战单独进海战场面：
 *   · 每方 10 艘 ＝ 九格三排（前排 3 / 中排 3 / 后排 3）＋ 主将旗舰 1；
 *   · 船型取该舰队在战略地图上用的那条船（军团绑定 → 势力 → 文化），武器照 NavalShipTiers.getNavalWeapons；
 *   · 打法按帝国时代 DE 的船：弓箭（所有船）、火炮、投石、喷火（点燃）、撞角（冲撞后接舷）；
 *   · 胜负变数都要在画面上看得见：风向（顺风快、上风射得远、火往下风烧，中途可能转风）、
 *     火势蔓延、接舷夺船（打赢换旗）、旗舰被击沉或被夺即全军溃散、逐舰沉没。
 *
 * 坐标：世界平面 = 屏幕平面（与战略地图海战同一规矩），x 向右、y 向下；航向用屏幕数学角（弧度）。
 */

import { getNavalDeStats, getNavalShipMass, getNavalWeapons, type NavalWeapon } from '../types/NavalShipTiers';
import type { NavalWindCode } from '../data/NavalBattleParams.generated';
import { TACTICAL_SKILL_ENTRIES_V1, EFFECT_TO_SIX_SET, type TacticalSixSet } from '../data/TacticalSkillCatalog';
import { getGeneralProfile } from '../data/general-skills/profiles';
import { SCENE13_SKILL_FILL_SEC, BATTLE_LIMIT_SEC } from '../ui/scene13/Scene13CombatMath';
import { NAVAL_SHIP_TECH_EFFECTS } from '../data/NavalShipTechs.generated';

const SIX_CYCLE_NEXT: Readonly<Record<TacticalSixSet, TacticalSixSet>> = {
    hunzhan: 'shengzhan',
    shengzhan: 'bingzhan',
    bingzhan: 'baizhan',
    baizhan: 'dizhan',
    dizhan: 'gongzhan',
    gongzhan: 'hunzhan',
};

const SIX_POOL_BY_STANCE: Readonly<Record<'adv' | 'bal' | 'dis', readonly TacticalSixSet[]>> = {
    adv: ['gongzhan', 'shengzhan', 'dizhan', 'hunzhan'],
    bal: ['gongzhan', 'shengzhan', 'dizhan', 'hunzhan', 'bingzhan', 'baizhan'],
    dis: ['bingzhan', 'baizhan', 'dizhan', 'hunzhan'],
};

const ELITE_RATE_MULTS: Record<number, number> = { 0: 1.5, 1: 1.4, 2: 1.3, 3: 1.2, 4: 1.1 };

export type NavalSide = 'attacker' | 'defender';
export type NavalRole = 'front' | 'main' | 'back' | 'flag';
export type NavalRepRole = 'intruder' | 'keeper';
export type NavalShipState = 'alive' | 'sinking' | 'sunk' | 'fled';

export const NAVAL_WORLD_W = 2800;
export const NAVAL_WORLD_H = 1600;
/** 船体碰撞半径（世界单位） */
const SHIP_R = 52;
const FLAG_R = 62;
/** 基础航速（世界单位/秒），与战略地图海战均速 72px/s 同一量级 */
const BASE_SPEED = 62;
/** 回转率上限（弧度/秒）：船没有原地拧头，只能划弧 */
const TURN_RATE = 0.62;
/** 全场时限（场景秒）：与陆战同一个 BATTLE_LIMIT_SEC，到点按剩余船力判胜负 */
export const NAVAL_TIME_LIMIT = BATTLE_LIMIT_SEC;
/** 旗舰倒下 / 船数见底后溃散多久收场 */
const ROUT_END_DELAY = 22;

/**
 * 🔴 [2026-11-16 主人令「海战六计效果与陆战一致」] 下列数值逐条照搬陆战 Scene13WarLayer 的六计常量，只把对象从士兵换成船：
 *   攻（振己威）10 秒：伤害 / 攻速 / 移速各 ×1.2
 *   胜（固己防）10 秒无敌，持续回血：本方开战船力 10% 摊到在场船上（每船至少 15%、至多 150%），10 秒内回完；解除本方混乱
 *   敌（伏兵袭）补开战船力 10% 的伏兵船，从敌阵斜后方驶入（挑本舰队最快的船型）
 *   混（乱敌阵）敌方 10 秒：不出手、不接舷、乱驶（航速 ×1.1）、受伤 ×2.5、持续掉血（10 秒共掉开战船力 10%，掉血本身不致死）；并解除敌方攻、胜
 *   并（夺敌兵）敌方开战船力 10% 当场倒戈换旗（整艘船倒戈，倒戈后无敌 3 秒）；凑不满一艘的零头从敌船身上转到本方船上
 *   败（减敌兵）直接歼灭敌方开战船力 10%，随机挑一排集中打，不够再打下一排，旗舰排最后
 * 持续三计按倍率只拉长时间、即时三计按倍率放大数量（与陆战「单维缩放」同口径）。
 */
const SIX_SEC = 10;
const SIX_FRAC = 0.10;
const FRENZY_DMG = 1.2;
const FRENZY_ATKSPD = 1.2;
const FRENZY_MOVE = 1.2;
const PANIC_TAKEN = 2.5;
const PANIC_MOVE = 1.1;
const DEFECT_INVULN_SEC = 3;
/** 两计之间至少隔多久（场景秒，同陆战 SKILL_CAST_GAP_SEC） */
const SKILL_CAST_GAP_SEC = 3.4;
/**
 * 交战节奏：所有交战伤害（箭炮、火烧、冲撞、接舷）统一乘它。六计按开战船力的比例算，不受影响。
 * 拿它把一局拉到直播要的长度（真实时间中位约 2 分钟，见 tools/naval-sim-check.mts 的时长统计）。
 */
const COMBAT_PACE = 0.32;

interface WeaponSpec {
    range: number;
    minRange: number;
    cooldown: number;
    damage: number;
    crewDamage: number;
    accuracy: number;
    /** 投射物飞行速度（世界单位/秒） */
    speed: number;
    /** 抛物线拱高（相对距离） */
    arc: number;
    splash: number;
    igniteChance: number;
}

const WEAPON_SPECS: Record<Exclude<NavalWeapon, 'ram'>, WeaponSpec> = {
    arrow: { range: 300, minRange: 0, cooldown: 1.9, damage: 3.4, crewDamage: 2.2, accuracy: 0.82, speed: 520, arc: 0.18, splash: 0, igniteChance: 0.03 },
    cannon: { range: 430, minRange: 60, cooldown: 4.2, damage: 10.5, crewDamage: 3.5, accuracy: 0.68, speed: 760, arc: 0.05, splash: 0, igniteChance: 0.06 },
    trebuchet: { range: 540, minRange: 150, cooldown: 6.2, damage: 15, crewDamage: 4, accuracy: 0.52, speed: 330, arc: 0.42, splash: 70, igniteChance: 0.02 },
    greekfire: { range: 165, minRange: 0, cooldown: 2.3, damage: 4, crewDamage: 2.5, accuracy: 0.9, speed: 300, arc: 0.08, splash: 0, igniteChance: 0.75 },
};

export interface NavalShip {
    id: number;
    side: NavalSide;
    /** 开战时属于哪方（被夺的船 side 会变） */
    origSide: NavalSide;
    role: NavalRole;
    /** 乱入者 / 维序者代表船标记（对峙代表，镜头优先跟随） */
    repRole?: NavalRepRole;
    shipKey: string;
    /** 画船用的势力（染色）：夺船后换成夺船方 */
    factionId: string;
    x: number;
    y: number;
    heading: number;
    speed: number;
    speedMul: number;
    mass: number;
    radius: number;
    hp: number;
    maxHp: number;
    crew: number;
    maxCrew: number;
    weapons: NavalWeapon[];
    cooldowns: Partial<Record<NavalWeapon, number>>;
    targetId: number | null;
    state: NavalShipState;
    /** 进入 sinking 的时刻（秒） */
    sinkAt: number;
    /** 剩余燃烧秒数（0 = 没着火） */
    burnT: number;
    boardingWith: number | null;
    /** 接舷冷却：刚打完一场接舷的船要缓一阵 */
    boardCd: number;
    ramCd: number;
    /** 被夺过（换过旗） */
    captured: boolean;
    routing: boolean;
    /** 最近一次开火时刻（画攻击帧） */
    lastFireAt: number;
    /** 最近一次中弹时刻（画受击闪） */
    lastHitAt: number;
    /** 绕敌方向：+1 顺时针 / −1 逆时针（每船固定，船队自然散开成弧） */
    orbitSign: number;
    /** 船头顶岸后选定的绕岸航向，保持到 shoreEscUntil（免得下一帧又被拉回岸边原地打转） */
    shoreEsc: number;
    shoreEscUntil: number;
    /** 航迹（画尾浪） */
    trail: { x: number; y: number }[];
    trailAcc: number;
    /** 科技倍数：DE 原表点名加给这种船的箭伤 / 重器伤害 / 射程（航速与船体已直接乘进 speedMul / hp） */
    tech: { arrow: number; heavy: number; range: number };
    /** 【胜】持续回血：每秒回多少、回到多少为止 */
    healPerSec: number;
    healTo: number;
    /** 【并】倒戈后无敌剩余秒数 */
    defectInvulnT: number;
    /** 【混】乱驶航向与下次换向倒计时 */
    panicAng: number;
    panicTurnT: number;
}

export interface NavalProjectile {
    kind: Exclude<NavalWeapon, 'ram'>;
    side: NavalSide;
    x0: number; y0: number;
    x1: number; y1: number;
    t: number;
    dur: number;
    arc: number;
    targetId: number;
    hit: boolean;
    damage: number;
    crewDamage: number;
    splash: number;
    ignite: boolean;
    /** 中国楼船专属：火箭齐射特效标记 */
    fireArrow?: boolean;
}

export type NavalEvent =
    | { type: 'fire'; weapon: Exclude<NavalWeapon, 'ram'>; side: NavalSide; x: number; y: number; shipId: number; tx: number; ty: number; dur: number; fireArrow?: boolean }
    | { type: 'impact'; weapon: Exclude<NavalWeapon, 'ram'>; hit: boolean; x: number; y: number }
    | { type: 'ignite'; side: NavalSide; x: number; y: number; shipId: number; isFlag: boolean }
    | { type: 'ram'; side: NavalSide; x: number; y: number }
    | { type: 'boardStart'; side: NavalSide; x: number; y: number; a: number; b: number }
    | { type: 'capture'; side: NavalSide; x: number; y: number; shipId: number; isFlag: boolean; defect?: boolean }
    | { type: 'sink'; side: NavalSide; x: number; y: number; shipId: number; isFlag: boolean; explode: boolean }
    | { type: 'windShift'; windward: NavalSide | null }
    | { type: 'rout'; side: NavalSide; reason: 'flag' | 'losses' }
    | { type: 'phase'; phase: NavalPhase }
    | { type: 'sixSkill'; side: NavalSide; six: TacticalSixSet; mult: number; isViewerCast: boolean; x: number; y: number };

export type NavalPhase = 'approach' | 'exchange' | 'melee' | 'rout';

/**
 * 🔴 [2026-11-16 主人认可「海战接天气」] 天气对海战的影响（满强度时的乘数；天气强度 0..1 线性插值）。
 *   speed 航速 · range 射程 · acc 命中 · ignite 引燃概率（含火势蔓延）· burnOut 火灭得多快（>1 更快灭）· wind 风力下限
 * 依据：暴风雨船难操控、弓弦受潮、火点不着；海雾看不远只能贴上去打；雨打湿船板、火势难起。
 */
export type NavalWeatherKind = 'SEA_STORM' | 'MONSOON_SQUALL' | 'DRIZZLE_MIST' | 'SEA_FOG' | 'SNOW' | 'BLIZZARD' | 'SANDSTORM';
interface WeatherEffect { speed: number; range: number; acc: number; ignite: number; burnOut: number; wind: number }
const WEATHER_EFFECTS: Record<NavalWeatherKind, WeatherEffect> = {
    SEA_STORM: { speed: 0.78, range: 0.8, acc: 0.65, ignite: 0.25, burnOut: 2.2, wind: 1.0 },
    MONSOON_SQUALL: { speed: 0.9, range: 0.9, acc: 0.8, ignite: 0.4, burnOut: 1.8, wind: 0.85 },
    DRIZZLE_MIST: { speed: 1.0, range: 0.85, acc: 0.9, ignite: 0.7, burnOut: 1.3, wind: 0 },
    SEA_FOG: { speed: 0.92, range: 0.55, acc: 0.85, ignite: 1.0, burnOut: 1.0, wind: 0 },
    SNOW: { speed: 0.92, range: 0.85, acc: 0.85, ignite: 0.6, burnOut: 1.4, wind: 0 },
    BLIZZARD: { speed: 0.8, range: 0.7, acc: 0.7, ignite: 0.3, burnOut: 2.0, wind: 1.0 },
    SANDSTORM: { speed: 0.9, range: 0.75, acc: 0.75, ignite: 1.0, burnOut: 1.0, wind: 0.9 },
};
const NO_WEATHER: WeatherEffect = { speed: 1, range: 1, acc: 1, ignite: 1, burnOut: 1, wind: 0 };

export interface NavalFleetInit {
    factionId: string;
    troops: number;
    shipKey: string;
    /** 旗舰船型（缺省同 shipKey） */
    flagShipKey?: string;
    /** 前/中/后三排混编船型（266 支军团史实舰队组合；缺省同 shipKey） */
    rowShipKeys?: { front?: string; main?: string; back?: string };
    /** 是否名将（乱斗模式电脑放计 1.5 / 0.5 倍率判据） */
    isFamous?: boolean;
    generalId?: string | null;
    eliteTier?: number | null;
    hasGeneral?: boolean;
    /** 本方军团科技（MilitaryTech.de 原名；与陆战同一个 selectLegionTechs 挑出来的） */
    techs?: readonly string[];
}

export interface NavalSimInit {
    attacker: NavalFleetInit;
    defender: NavalFleetInit;
    seed: string;
    /** 史实胜方（剧本 / 经典战）：演出向它倾斜，免得画面打赢、结算翻盘 */
    favored?: NavalSide | null;
    /** 是否历史/剧本模式（决定电脑放计走 1.8/0.2 还是乱斗名将 1.5/0.5） */
    isScriptMode?: boolean;
    /** 每方船数（含旗舰），缺省 10 */
    shipsPerSide?: number;
    /** 攻方摆在右边（跟随军团在守方时，让跟随的舰队在左边） */
    attackerRight?: boolean;
    /** 真实海陆：这一点是不是水（海战摆在战略地图真实海面上，船要绕开陆地）。不给 = 全是水 */
    isWater?: (x: number, y: number) => boolean;
    /** 史载风向（八方位；传入时直接锁定开场风向） */
    windCode?: NavalWindCode | null;
    /** 史载天气（传入时开场即应用该天气影响） */
    weatherKind?: NavalWeatherKind | null;
}

export interface NavalResult {
    winner: NavalSide;
    /** 胜方剩余船力占开战时的比例（0..1），用来折算战后兵力 */
    winnerStrength: number;
    loserStrength: number;
}

/** mulberry32：同一个种子同一场仗，可复现 */
function makeRng(seed: string): () => number {
    let h = 1779033703 ^ seed.length;
    for (let i = 0; i < seed.length; i++) {
        h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }
    let a = h >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function angDiff(a: number, b: number): number {
    let d = a - b;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
}

/** 风向（风往哪吹，屏幕数学角）→ 中文风名（风从哪来） */
export function windName(windAng: number): string {
    // 风从 windAng+π 方向来；屏幕上方 = 北
    const from = windAng + Math.PI;
    const deg = ((Math.atan2(Math.cos(from), -Math.sin(from)) * 180 / Math.PI) + 360) % 360; // 北=0 顺时针
    const names = ['北风', '东北风', '东风', '东南风', '南风', '西南风', '西风', '西北风'];
    return names[Math.round(deg / 45) % 8];
}

export class NavalBattleSim {
    public readonly ships: NavalShip[] = [];
    public readonly projectiles: NavalProjectile[] = [];
    public time = 0;
    /** 风往哪吹（屏幕数学角） */
    public windAng: number;
    public windStrength: number;
    public phase: NavalPhase = 'approach';
    public routSide: NavalSide | null = null;
    public routAt = 0;
    public result: NavalResult | null = null;
    private events: NavalEvent[] = [];
    private readonly rng: () => number;
    private windShiftAt: number;
    private windShifted = false;
    private lastDt = 0;
    private order: number[] = [];
    private readonly isWater: (x: number, y: number) => boolean;
    public weatherKind: NavalWeatherKind | null = null;
    public weatherStrength = 0;
    /** 当前天气折算后的乘数（强度插值后） */
    private wx: WeatherEffect = NO_WEATHER;
    /** 风由天气接管：不再随机转风 */
    private windLocked = false;
    private readonly attackerRight: boolean;
    private readonly initHp: Record<NavalSide, number> = { attacker: 0, defender: 0 };
    private readonly isScriptMode: boolean;
    private readonly favored: NavalSide | null;
    private readonly isFamous: Record<NavalSide, boolean>;
    public readonly skillFrenzyTimer: Record<NavalSide, number> = { attacker: 0, defender: 0 };
    public readonly skillShieldTimer: Record<NavalSide, number> = { attacker: 0, defender: 0 };
    public readonly skillPanicTimer: Record<NavalSide, number> = { attacker: 0, defender: 0 };
    /** 【混】敌方每秒掉血比例（占各船满血） */
    private readonly skillPanicBleedRate: Record<NavalSide, number> = { attacker: 0, defender: 0 };
    private readonly fleets: Record<NavalSide, NavalFleetInit>;
    public readonly skillGauge: Record<NavalSide, number> = { attacker: 0, defender: 0 };
    public readonly skillRateMult: Record<NavalSide, number> = { attacker: 1, defender: 1 };
    public readonly skillRatePerSec: Record<NavalSide, number> = { attacker: 6.25, defender: 6.25 };
    public readonly queuedSkill: Record<NavalSide, TacticalSixSet | null> = { attacker: null, defender: null };
    public readonly lastCastSkill: Record<NavalSide, TacticalSixSet | null> = { attacker: null, defender: null };
    public readonly skillCastSeq: Record<NavalSide, number> = { attacker: 0, defender: 0 };
    public readonly skillAnsweredSeq: Record<NavalSide, number> = { attacker: 0, defender: 0 };
    private readonly generalIds: Record<NavalSide, string | null>;
    private readonly recentCastSkills: Record<NavalSide, TacticalSixSet[]> = { attacker: [], defender: [] };
    private readonly plannedSkill: Record<NavalSide, { key: string; six: TacticalSixSet } | null> = { attacker: null, defender: null };
    private skillCastCooldown = 0;
    private readonly mult: Record<NavalSide, { hp: number; dmg: number }>;
    private readonly initCount: Record<NavalSide, number> = { attacker: 0, defender: 0 };

    constructor(init: NavalSimInit) {
        this.rng = makeRng(init.seed || 'naval');
        this.isWater = init.isWater ?? (() => true);
        this.attackerRight = !!init.attackerRight;
        this.isScriptMode = !!init.isScriptMode;
        this.favored = init.favored ?? null;
        this.fleets = { attacker: init.attacker, defender: init.defender };
        this.generalIds = {
            attacker: init.attacker.generalId ?? null,
            defender: init.defender.generalId ?? null,
        };
        const profA = this.generalIds.attacker ? getGeneralProfile(this.generalIds.attacker) : null;
        const profD = this.generalIds.defender ? getGeneralProfile(this.generalIds.defender) : null;
        this.isFamous = {
            attacker: profA ? profA.tier === 'famous' : !!init.attacker.isFamous,
            defender: profD ? profD.tier === 'famous' : !!init.defender.isFamous,
        };
        const BASE_RATE = 100 / SCENE13_SKILL_FILL_SEC;
        for (const s of ['attacker', 'defender'] as const) {
            const sideInit = init[s];
            // 与陆战一致：没有武将的一方也按普将基准充槽（名将 ×1.25、精锐按档另乘）
            const genMult = this.isFamous[s] ? 1.25 : 1.0;
            const tier = sideInit.eliteTier;
            const eliteMult = (tier != null && ELITE_RATE_MULTS[tier] !== undefined) ? ELITE_RATE_MULTS[tier] : 1.0;
            this.skillRateMult[s] = +(genMult * eliteMult).toFixed(2);
            this.skillRatePerSec[s] = BASE_RATE * genMult * eliteMult;
        }
        const r = this.rng;
        // 风：若有史载风向则优先按史实，否则大致横吹战场
        const WIND_CODE_ANG: Record<NavalWindCode, number> = {
            N: Math.PI / 2,
            NE: (3 * Math.PI) / 4,
            E: Math.PI,
            SE: (-3 * Math.PI) / 4,
            S: -Math.PI / 2,
            SW: -Math.PI / 4,
            W: 0,
            NW: Math.PI / 4,
        };
        if (init.windCode && WIND_CODE_ANG[init.windCode] !== undefined) {
            this.windAng = WIND_CODE_ANG[init.windCode];
            this.windStrength = 0.85;
            this.windShiftAt = Infinity;
        } else {
            this.windAng = (r() < 0.5 ? -Math.PI / 2 : Math.PI / 2) + (r() - 0.5) * 1.6;
            this.windStrength = 0.55 + r() * 0.45;
            this.windShiftAt = 38 + r() * 45;
            if (r() < 0.4) this.windShiftAt = Infinity;   // 六成场次中途转风
        }
        if (init.weatherKind) {
            this.setWeather(init.weatherKind, 1.0);
        }

        // 兵力 → 船体 / 火力乘区：总战力 ∝ 兵力比（hp × dmg 各取平方根）
        const ta = Math.max(1, init.attacker.troops);
        const td = Math.max(1, init.defender.troops);
        const avg = (ta + td) / 2;
        const clamp = (v: number) => Math.max(0.45, Math.min(2.0, v));
        this.mult = {
            attacker: { hp: clamp(Math.sqrt(ta / avg)), dmg: clamp(Math.sqrt(ta / avg)) },
            defender: { hp: clamp(Math.sqrt(td / avg)), dmg: clamp(Math.sqrt(td / avg)) },
        };
        // 🔴 [2026-11-16 主人令「与陆战一致，只 + 六计倍率」] 史实胜方不再额外加船体 / 火力，只靠六计 1.8 / 0.2（computeSixMult）
        const n = Math.max(4, Math.min(10, init.shipsPerSide ?? 10));
        this.spawnFleet('attacker', init.attacker, n);
        this.spawnFleet('defender', init.defender, n);
    }

    private spawnFleet(side: NavalSide, fleet: NavalFleetInit, n: number): void {
        const onLeft = (side === 'attacker') !== this.attackerRight;
        const dirX = onLeft ? 1 : -1;
        const baseX = onLeft ? 560 : NAVAL_WORLD_W - 560;
        const cy = NAVAL_WORLD_H / 2;
        // 九格三排：前排最靠近敌方，后排其后，旗舰居中压阵
        const rows: { role: 'front' | 'main' | 'back'; dx: number }[] = [
            { role: 'front', dx: 210 },
            { role: 'main', dx: 0 },
            { role: 'back', dx: -210 },
        ];
        const escorts = n - 1;
        const perRow = [0, 0, 0];
        for (let i = 0; i < escorts; i++) perRow[i % 3]++;
        const heading = onLeft ? 0 : Math.PI;
        const mk = (role: NavalRole, x0: number, y0: number, key: string): void => {
            this.makeShip(side, role, x0, y0, key, heading, 1);
        };
        rows.forEach((row, ri) => {
            const cnt = perRow[ri];
            const rowKey = fleet.rowShipKeys?.[row.role] ?? fleet.shipKey;
            for (let k = 0; k < cnt; k++) {
                const off = (k - (cnt - 1) / 2) * 230;
                mk(row.role, baseX + row.dx * dirX + (this.rng() - 0.5) * 30, cy + off + (this.rng() - 0.5) * 40, rowKey);
            }
        });
        mk('flag', baseX - 360 * dirX, cy, fleet.flagShipKey ?? fleet.shipKey);
        let hpSum = 0;
        for (const s of this.ships) if (s.side === side) hpSum += s.maxHp;
        this.initHp[side] = hpSum;
        this.initCount[side] = n;
        this.assignRepShip(side);
    }

    /** 这种船吃到本方哪些科技：DE 原表点名加给它的部分连乘（见 NavalShipTechs.generated） */
    private techMulOf(side: NavalSide, key: string): { arrow: number; heavy: number; range: number; speed: number; hp: number } {
        const out = { arrow: 1, heavy: 1, range: 1, speed: 1, hp: 1 };
        for (const name of this.fleets[side].techs ?? []) {
            const e = NAVAL_SHIP_TECH_EFFECTS[name]?.[key];
            if (!e) continue;
            out.arrow *= e.arrowDmg ?? 1;
            out.heavy *= e.heavyDmg ?? 1;
            out.range *= e.range ?? 1;
            out.speed *= e.speed ?? 1;
            out.hp *= e.hp ?? 1;
        }
        return out;
    }

    /** 造一艘船（开局列阵与【敌】伏兵船共用）。hpScale：伏兵船按补兵量缩小船体与船员 */
    private makeShip(side: NavalSide, role: NavalRole, x0: number, y0: number, key: string, heading: number, hpScale: number): NavalShip {
        const fleet = this.fleets[side];
        const m = this.mult[side];
        const { x, y } = this.nearestWater(x0, y0);
        const isFlag = role === 'flag';
        const de = getNavalDeStats(key);
        const tech = this.techMulOf(side, key);
        const mass = getNavalShipMass(key) * (isFlag ? 1.25 : 1);
        const hp = de.hp * (isFlag ? 1.55 : 1.15) * m.hp * tech.hp * hpScale;
        const crew = (isFlag ? 140 : 100) * m.hp * hpScale;
        const ship: NavalShip = {
            id: this.ships.length, side, origSide: side, role, shipKey: key, factionId: fleet.factionId,
            x, y, heading, speed: BASE_SPEED * 0.6, speedMul: de.speed / 1.35 * tech.speed, mass, radius: isFlag ? FLAG_R : SHIP_R,
            hp, maxHp: hp, crew, maxCrew: crew,
            weapons: getNavalWeapons(key, fleet.factionId),
            cooldowns: {},
            targetId: null, state: 'alive', sinkAt: 0, burnT: 0, boardingWith: null, boardCd: 0, ramCd: 0,
            captured: false, routing: false, lastFireAt: -9, lastHitAt: -9,
            orbitSign: this.rng() < 0.5 ? 1 : -1,
            shoreEsc: heading, shoreEscUntil: -1,
            trail: [], trailAcc: 0,
            tech: { arrow: tech.arrow, heavy: tech.heavy, range: tech.range },
            healPerSec: 0, healTo: 0, defectInvulnT: 0, panicAng: heading, panicTurnT: 0,
        };
        // 错开冷却，别全队同一帧齐射
        for (const w of ship.weapons) if (w !== 'ram') ship.cooldowns[w] = this.rng() * WEAPON_SPECS[w].cooldown;
        this.ships.push(ship);
        this.order.push(ship.id);
        return ship;
    }

    /** 为指定阵营选定/补位一名代表船（乱入者或维序者）：优先中排居中护航船，其次前后排，最后旗舰 */
    public assignRepShip(side: NavalSide): NavalShip | null {
        const intruderSide: NavalSide = this.attackerRight ? 'defender' : 'attacker';
        const repRole: NavalRepRole = side === intruderSide ? 'intruder' : 'keeper';
        const existing = this.ships.find((s) => s.repRole === repRole && s.side === side && s.state === 'alive');
        if (existing) return existing;
        for (const s of this.ships) {
            if (s.repRole === repRole) s.repRole = undefined;
        }
        const cy = NAVAL_WORLD_H / 2;
        const pool = this.ships.filter((s) => s.side === side && s.state === 'alive');
        if (pool.length === 0) return null;
        // 优先由高耐久的旗舰担任乱入者/维序者，旗舰沉没前绝不轻易阵亡或频繁换船
        const rank = (r: NavalRole) => (r === 'flag' ? 0 : r === 'main' ? 1 : r === 'front' ? 2 : 3);
        pool.sort((a, b) => rank(a.role) - rank(b.role) || Math.abs(a.y - cy) - Math.abs(b.y - cy));
        pool[0].repRole = repRole;
        return pool[0];
    }

    /** 就近找水面（出生点压在陆地上时用） */
    private nearestWater(x: number, y: number): { x: number; y: number } {
        if (this.isWater(x, y)) return { x, y };
        for (let r = 40; r <= 900; r += 40) {
            for (let k = 0; k < 16; k++) {
                const a = k * Math.PI / 8;
                const nx = x + Math.cos(a) * r, ny = y + Math.sin(a) * r;
                if (this.isWater(nx, ny)) return { x: nx, y: ny };
            }
        }
        return { x, y };
    }

    /** 沿某航向往前看：近、中、远三处都是水才算走得通 */
    private clearAhead(x: number, y: number, ang: number): boolean {
        const c = Math.cos(ang), sn = Math.sin(ang);
        return this.isWater(x + c * 36, y + sn * 36)
            && this.isWater(x + c * 96, y + sn * 96)
            && this.isWater(x + c * 180, y + sn * 180);
    }

    /** 设天气（null = 晴）。强度 0..1；只改乘数，不发事件（播报由画面层负责） */
    public setWeather(kind: NavalWeatherKind | string | null, strength: number): void {
        const k = kind && (kind in WEATHER_EFFECTS) ? kind as NavalWeatherKind : null;
        const st = k ? Math.max(0, Math.min(1, strength)) : 0;
        this.weatherKind = k;
        this.weatherStrength = st;
        if (!k) { this.wx = NO_WEATHER; return; }
        const e = WEATHER_EFFECTS[k];
        const lerp = (v: number) => 1 + (v - 1) * st;
        this.wx = { speed: lerp(e.speed), range: lerp(e.range), acc: lerp(e.acc), ignite: lerp(e.ignite), burnOut: lerp(e.burnOut), wind: e.wind * st };
        if (this.wx.wind > this.windStrength) this.windStrength = Math.min(1, this.wx.wind);
    }

    /**
     * 风由天气接管：雨雪往哪边斜飘，风就往哪边吹（xSign：+1 往右、−1 往左）。
     * 方向变了（左右翻转）发一次转风事件；接管后不再随机转风。
     */
    public setWindFromWeather(xSign: number): void {
        if (!xSign) return;
        this.windLocked = true;
        if (Math.sign(Math.cos(this.windAng)) === Math.sign(xSign)) return;
        this.windAng = Math.PI - this.windAng;
        this.events.push({ type: 'windShift', windward: this.windwardSide() });
    }

    /** 取走本帧事件（画面层播特效 / 音效 / 播报） */
    public drainEvents(): NavalEvent[] {
        const e = this.events;
        this.events = [];
        return e;
    }

    public getShip(id: number | null): NavalShip | undefined {
        return id === null ? undefined : this.ships[id];
    }

    public isActive(s: NavalShip): boolean {
        return s.state === 'alive';
    }

    public countAlive(side: NavalSide): number {
        let c = 0;
        for (const s of this.ships) if (s.side === side && s.state === 'alive') c++;
        return c;
    }

    public flagship(side: NavalSide): NavalShip | undefined {
        return this.ships.find((s) => s.role === 'flag' && s.origSide === side);
    }

    /** 上风方：风从它那边吹向对方 */
    public windwardSide(): NavalSide | null {
        const ca = this.centroid('attacker');
        const cd = this.centroid('defender');
        if (!ca || !cd) return null;
        const wx = Math.cos(this.windAng), wy = Math.sin(this.windAng);
        const d = (cd.x - ca.x) * wx + (cd.y - ca.y) * wy;   // >0：风从攻方吹向守方
        const len = Math.hypot(cd.x - ca.x, cd.y - ca.y) || 1;
        if (Math.abs(d / len) < 0.25) return null;
        return d > 0 ? 'attacker' : 'defender';
    }

    public centroid(side: NavalSide): { x: number; y: number } | null {
        let x = 0, y = 0, c = 0;
        for (const s of this.ships) if (s.side === side && s.state === 'alive') { x += s.x; y += s.y; c++; }
        return c ? { x: x / c, y: y / c } : null;
    }

    public step(dt: number): void {
        if (this.result) return;
        dt = Math.min(dt, 0.1);
        this.lastDt = dt;
        this.time += dt;
        this.updateWind();
        const windward = this.windwardSide();
        // 每帧打乱结算顺序：固定先攻后守会让先动的一方占便宜（同兵同船实测攻方多赢一成多）
        const order = this.order;
        for (let i = order.length - 1; i > 0; i--) {
            const j = Math.floor(this.rng() * (i + 1));
            const tmp = order[i]; order[i] = order[j]; order[j] = tmp;
        }
        for (const idx of order) {
            const s = this.ships[idx];
            if (s.state === 'sinking') {
                if (this.time - s.sinkAt > 6) s.state = 'sunk';
                continue;
            }
            if (s.state !== 'alive') continue;
            this.updateBurn(s, dt, windward);
            if (s.state !== 'alive') continue;
            if (s.boardingWith !== null) {
                this.updateBoarding(s, dt);
                continue;
            }
            this.pickTarget(s);
            this.steer(s, dt);
            this.fireWeapons(s, dt, windward);
            if (s.ramCd > 0) s.ramCd -= dt;
            if (s.boardCd > 0) s.boardCd -= dt;
        }
        this.resolveContacts();
        this.updateProjectiles(dt);
        this.stepSixSkills(dt);
        this.stepSkillShips(dt);
        this.updatePhase();
        this.assignRepShip('attacker');
        this.assignRepShip('defender');
        this.checkEnd();
    }

    /** 历史模式赢家 1.8 / 输家 0.2；乱斗模式名将 1.5 / 普将 0.5；观众放计恒 1.0 */
    public computeSixMult(side: NavalSide, isViewerCast: boolean): number {
        if (isViewerCast) return 1.0;
        if (this.isScriptMode && this.favored !== null) {
            return this.favored === side ? 1.8 : 0.2;
        }
        const opp: NavalSide = side === 'attacker' ? 'defender' : 'attacker';
        if (this.isFamous[side] !== this.isFamous[opp]) {
            return this.isFamous[side] ? 1.5 : 0.5;
        }
        return 1.0;
    }

    public castSixSkill(side: NavalSide, six: TacticalSixSet, isViewerCast: boolean): { mult: number; x: number; y: number } {
        const opp: NavalSide = side === 'attacker' ? 'defender' : 'attacker';
        const mult = this.computeSixMult(side, isViewerCast);
        const allies = this.ships.filter((s) => s.side === side && s.state === 'alive');
        const enemies = this.ships.filter((s) => s.side === opp && s.state === 'alive');
        const rep = allies.find((s) => s.repRole) ?? allies.find((s) => s.role === 'flag') ?? allies[0];
        const x = rep ? rep.x : NAVAL_WORLD_W / 2;
        const y = rep ? rep.y : NAVAL_WORLD_H / 2;

        if (six === 'gongzhan') {
            this.skillFrenzyTimer[side] = SIX_SEC * mult;
        } else if (six === 'shengzhan') {
            const shieldSec = SIX_SEC * mult;
            this.skillShieldTimer[side] = shieldSec;
            this.skillPanicTimer[side] = 0;
            let living = 0;
            for (const s of allies) living += Math.max(0, s.hp);
            const baseHealFrac = Math.min(1.0, Math.max(0.15, (this.initHp[side] * SIX_FRAC) / Math.max(1, living)));
            const totalHealFrac = Math.min(1.5, baseHealFrac * mult);
            for (const s of allies) {
                const to = Math.max(s.maxHp, s.hp + s.maxHp * totalHealFrac);
                s.healTo = to;
                s.healPerSec = Math.max(0, (to - s.hp) / shieldSec);
                s.crew = Math.min(s.maxCrew, s.crew + s.maxCrew * totalHealFrac);
            }
        } else if (six === 'dizhan') {
            this.spawnAmbush(side, this.initHp[side] * SIX_FRAC * mult);
        } else if (six === 'hunzhan') {
            let living = 0;
            for (const e of enemies) living += Math.max(0, e.hp);
            const baseBleedFrac = Math.min(1.0, Math.max(0.10, (this.initHp[opp] * SIX_FRAC) / Math.max(1, living)));
            this.skillPanicBleedRate[opp] = baseBleedFrac / SIX_SEC;
            this.skillPanicTimer[opp] = SIX_SEC * mult;
            this.skillFrenzyTimer[opp] = 0;
            this.skillShieldTimer[opp] = 0;
            for (const e of enemies) {
                e.healPerSec = 0;
                e.panicTurnT = 0;
                this.breakBoarding(e);
            }
        } else if (six === 'bingzhan') {
            this.defectShips(side, opp, this.initHp[opp] * SIX_FRAC * mult);
        } else if (six === 'baizhan') {
            this.strikeShips(opp, this.initHp[opp] * SIX_FRAC * mult);
        }
        // 两计不许同时放（观众放计同样占这道间隔，同陆战）
        this.skillCastCooldown = SKILL_CAST_GAP_SEC;

        this.lastCastSkill[side] = six;
        if (!isViewerCast) {
            this.recentCastSkills[side].push(six);
            if (this.recentCastSkills[side].length > 3) this.recentCastSkills[side].shift();
            this.skillCastSeq[side]++;
            this.skillAnsweredSeq[side] = this.skillCastSeq[opp];
            this.plannedSkill[side] = null;
        }
        this.events.push({ type: 'sixSkill', side, six, mult, isViewerCast, x, y });
        return { mult, x, y };
    }

    /** 敌方受六计的船按「随机一排 → 其余排 → 旗舰最后」排队；同排内船力小的在前（好整艘处理） */
    private sixVictims(opp: NavalSide, skipInvuln: boolean): NavalShip[] {
        const list = this.ships.filter((s) => s.side === opp && s.state === 'alive' && !(skipInvuln && s.defectInvulnT > 0));
        const rows = (['front', 'main', 'back'] as const).filter((r) => list.some((s) => s.role === r));
        const first = rows.length ? rows[Math.floor(this.rng() * rows.length)] : null;
        const rank = (s: NavalShip) => (s.role === 'flag' ? 2 : s.role === first ? 0 : 1);
        return list.sort((a, b) => rank(a) - rank(b) || a.hp - b.hp);
    }

    private breakBoarding(s: NavalShip): void {
        const partner = this.getShip(s.boardingWith);
        if (partner && partner.boardingWith === s.id) partner.boardingWith = null;
        s.boardingWith = null;
    }

    /** 【敌】伏兵船：补 quota 船力，从敌阵斜后方驶入，挑本舰队最快的船型 */
    private spawnAmbush(side: NavalSide, quota: number): void {
        const opp: NavalSide = side === 'attacker' ? 'defender' : 'attacker';
        const fleet = this.fleets[side];
        const keys = [fleet.rowShipKeys?.front, fleet.rowShipKeys?.main, fleet.rowShipKeys?.back, fleet.shipKey]
            .filter((k): k is string => !!k);
        const key = keys.reduce((a, b) => (getNavalDeStats(b).speed > getNavalDeStats(a).speed ? b : a), keys[0]);
        const fullHp = getNavalDeStats(key).hp * 1.15 * this.mult[side].hp * this.techMulOf(side, key).hp;
        const k = Math.max(1, Math.min(4, Math.ceil(quota / Math.max(1, fullHp))));
        const scale = Math.min(1, quota / k / Math.max(1, fullHp));
        const ec = this.centroid(opp) ?? { x: NAVAL_WORLD_W / 2, y: NAVAL_WORLD_H / 2 };
        const oc = this.centroid(side) ?? { x: ec.x - 1, y: ec.y };
        const L = Math.hypot(ec.x - oc.x, ec.y - oc.y) || 1;
        const dx = (ec.x - oc.x) / L, dy = (ec.y - oc.y) / L;
        for (let i = 0; i < k; i++) {
            const sgn = i % 2 === 0 ? 1 : -1;
            const px = Math.max(120, Math.min(NAVAL_WORLD_W - 120, ec.x + dx * 380 - dy * sgn * 420));
            const py = Math.max(120, Math.min(NAVAL_WORLD_H - 120, ec.y + dy * 380 + dx * sgn * 420));
            const ship = this.makeShip(side, 'main', px, py, key, Math.atan2(ec.y - py, ec.x - px), scale);
            ship.speed = BASE_SPEED * ship.speedMul;
            ship.routing = this.routSide === side;
        }
    }

    /** 【并】敌船倒戈：整艘能凑进 quota 的就换旗；凑不满一艘的零头从敌船身上转到本方最伤的船上 */
    private defectShips(side: NavalSide, opp: NavalSide, quota: number): void {
        let left = quota;
        const victims = this.sixVictims(opp, true);
        for (const v of victims) {
            if (left <= 0) break;
            if (v.hp <= left) {
                left -= v.hp;
                const wasFlag = v.role === 'flag';
                this.breakBoarding(v);
                v.side = side;
                v.factionId = this.fleets[side].factionId;
                v.captured = true;
                v.burnT = 0;
                v.targetId = null;
                v.healPerSec = 0;
                v.routing = this.routSide === side;
                v.defectInvulnT = DEFECT_INVULN_SEC;
                if (wasFlag) v.role = 'main';
                this.events.push({ type: 'capture', side, x: v.x, y: v.y, shipId: v.id, isFlag: wasFlag, defect: true });
                if (wasFlag) this.startRout(opp, 'flag');
            }
        }
        if (left <= 0) return;
        const v = victims.find((x) => x.state === 'alive' && x.side === opp);
        if (!v) return;
        const take = Math.min(left, v.hp - 1);
        if (take <= 0) return;
        v.hp -= take;
        v.crew = Math.max(0, v.crew - v.maxCrew * (take / v.maxHp));
        v.lastHitAt = this.time;
        const mine = this.ships.filter((x) => x.side === side && x.state === 'alive')
            .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        if (mine) mine.hp = Math.min(mine.maxHp, mine.hp + take);
    }

    /** 【败】直接歼灭敌方 quota 船力：先整艘打沉，剩下的零头打在下一艘身上 */
    private strikeShips(opp: NavalSide, quota: number): void {
        let left = quota;
        for (const v of this.sixVictims(opp, false)) {
            if (left <= 0) break;
            const take = Math.min(left, v.hp);
            left -= take;
            v.hp -= take;
            v.crew = Math.max(0, v.crew - v.maxCrew * (take / Math.max(1, v.maxHp)));
            v.lastHitAt = this.time;
            if (v.hp <= 0.5) this.sink(v);
        }
    }

    /** 六计在船上的持续效果：【胜】回血、【混】掉血、【并】倒戈无敌倒计时 */
    private stepSkillShips(dt: number): void {
        for (const s of this.ships) {
            if (s.state !== 'alive') continue;
            if (s.defectInvulnT > 0) s.defectInvulnT = Math.max(0, s.defectInvulnT - dt);
            if (s.healPerSec > 0) {
                if (this.skillShieldTimer[s.side] > 0) s.hp = Math.min(s.healTo, s.hp + s.healPerSec * dt);
                else s.healPerSec = 0;
            }
            if (this.skillPanicTimer[s.side] > 0 && s.hp > s.maxHp * 0.01) {
                // 掉血本身不致死（同陆战：最多扣到一丝血，要被打才沉）
                s.hp = Math.max(s.maxHp * 0.01, s.hp - s.maxHp * this.skillPanicBleedRate[s.side] * dt * this.takenMul(s) / PANIC_TAKEN);
            }
        }
    }

    /** 受伤倍率：【胜】无敌 / 倒戈无敌 = 0，【混】×2.5 */
    private takenMul(s: NavalShip): number {
        if (this.skillShieldTimer[s.side] > 0 || s.defectInvulnT > 0) return 0;
        return this.skillPanicTimer[s.side] > 0 ? PANIC_TAKEN : 1;
    }

    private isPanicked(s: NavalShip): boolean {
        return this.skillPanicTimer[s.side] > 0 && !s.routing;
    }

    public setQueuedSkill(side: NavalSide, six: TacticalSixSet | null): void {
        if (this.skillRatePerSec[side] <= 0) return;
        this.queuedSkill[side] = this.queuedSkill[side] === six ? null : six;
    }

    public getAutoNextSkill(side: NavalSide): TacticalSixSet {
        const opp: NavalSide = side === 'attacker' ? 'defender' : 'attacker';
        let myHp = 0, foeHp = 0;
        for (const s of this.ships) {
            if (s.state !== 'alive' && s.state !== 'fled') continue;
            if (s.side === side) myHp += Math.max(0, s.hp);
            else foeHp += Math.max(0, s.hp);
        }
        const ratio = myHp / Math.max(1, foeHp);
        const stance: 'adv' | 'bal' | 'dis' = ratio >= 1.15 ? 'adv' : (ratio <= 0.85 ? 'dis' : 'bal');
        const last = this.lastCastSkill[side];
        const oppNew = this.skillCastSeq[opp] > this.skillAnsweredSeq[side] ? this.lastCastSkill[opp] : null;
        const key = `${stance}|${oppNew ?? '-'}|${this.skillCastSeq[opp]}|${this.skillCastSeq[side]}|${last ?? '-'}`;
        const cached = this.plannedSkill[side];
        if (cached && cached.key === key) return cached.six;

        const pool = SIX_POOL_BY_STANCE[stance];
        const recent = this.recentCastSkills[side];
        const oppLast = this.lastCastSkill[opp];
        const base = oppLast ?? last;
        let six: TacticalSixSet | undefined;
        if (base) {
            const myLast = recent[recent.length - 1] ?? null;
            const tiers: Array<(s: TacticalSixSet) => boolean> = [
                (s) => !recent.includes(s) && s !== oppLast,
                (s) => s !== myLast && s !== oppLast,
                (s) => s !== myLast,
            ];
            for (const ok of tiers) {
                let cur = SIX_CYCLE_NEXT[base];
                for (let i = 0; i < 6; i++, cur = SIX_CYCLE_NEXT[cur]) {
                    if (pool.includes(cur) && ok(cur)) { six = cur; break; }
                }
                if (six) break;
            }
        }
        if (!six) {
            const gid = this.generalIds[side];
            if (gid) {
                const profile = getGeneralProfile(gid);
                const isDef = side === 'defender';
                const sigId = stance === 'adv'
                    ? (isDef ? (profile?.defAdvantageSkillId ?? profile?.advantageSkillId) : (profile?.atkAdvantageSkillId ?? profile?.advantageSkillId))
                    : stance === 'dis'
                        ? (isDef ? (profile?.defDisadvantageSkillId ?? profile?.disadvantageSkillId) : (profile?.atkDisadvantageSkillId ?? profile?.disadvantageSkillId))
                        : (isDef ? (profile?.defBalanceSkillId ?? profile?.balanceSkillId ?? profile?.tacticalSkillId) : (profile?.atkBalanceSkillId ?? profile?.balanceSkillId ?? profile?.tacticalSkillId));
                const entry = sigId ? TACTICAL_SKILL_ENTRIES_V1.find((e) => e.id === sigId) : undefined;
                const sig = entry ? EFFECT_TO_SIX_SET[entry.baseEffect] : undefined;
                if (sig && sig !== last && pool.includes(sig)) six = sig;
            }
        }
        if (!six) {
            const rest = pool.filter((s) => s !== last);
            six = rest[Math.floor(this.rng() * rest.length)] ?? pool[0];
        }
        this.plannedSkill[side] = { key, six };
        return six;
    }

    private stepSixSkills(dt: number): void {
        for (const side of ['attacker', 'defender'] as const) {
            if (this.skillFrenzyTimer[side] > 0) this.skillFrenzyTimer[side] = Math.max(0, this.skillFrenzyTimer[side] - dt);
            if (this.skillShieldTimer[side] > 0) this.skillShieldTimer[side] = Math.max(0, this.skillShieldTimer[side] - dt);
            if (this.skillPanicTimer[side] > 0) this.skillPanicTimer[side] = Math.max(0, this.skillPanicTimer[side] - dt);
        }
        if (this.skillCastCooldown > 0) this.skillCastCooldown = Math.max(0, this.skillCastCooldown - dt);
        if (this.routSide !== null) return;
        for (const side of ['attacker', 'defender'] as const) {
            if (this.skillRatePerSec[side] <= 0) continue;
            this.skillGauge[side] = Math.min(100, this.skillGauge[side] + this.skillRatePerSec[side] * dt);
        }
        if (this.phase === 'approach' || this.skillCastCooldown > 0) return;
        for (const side of ['attacker', 'defender'] as const) {
            if (this.skillGauge[side] >= 100) {
                this.skillGauge[side] = 0;
                const manual = this.queuedSkill[side];
                this.queuedSkill[side] = null;
                const chosen = manual ?? this.getAutoNextSkill(side);
                this.castSixSkill(side, chosen, false);
                break;
            }
        }
    }

    private updateWind(): void {
        if (this.windLocked || this.windShifted || this.time < this.windShiftAt) return;
        this.windShifted = true;
        this.windAng += (this.rng() < 0.5 ? 1 : -1) * (1.7 + this.rng() * 1.1);
        this.events.push({ type: 'windShift', windward: this.windwardSide() });
    }

    private updateBurn(s: NavalShip, dt: number, windward: NavalSide | null): void {
        if (s.burnT <= 0) return;
        s.burnT -= dt * this.wx.burnOut;   // 雨雪天火灭得快
        this.damage(s, 1.7 * dt, 0.7 * dt, null);
        if (s.state !== 'alive') return;
        // 火往下风烧：下风的邻船更容易被引燃（火烧连营）
        const wx = Math.cos(this.windAng), wy = Math.sin(this.windAng);
        for (const o of this.ships) {
            if (o === s || o.state !== 'alive' || o.burnT > 0) continue;
            const dx = o.x - s.x, dy = o.y - s.y;
            const d = Math.hypot(dx, dy);
            if (d > 150) continue;
            const downwind = (dx * wx + dy * wy) / (d || 1);
            const p = (0.09 + Math.max(0, downwind) * 0.22 * this.windStrength) * (1 - d / 150) * dt * this.wx.ignite;
            if (this.rng() < p) this.ignite(o);
        }
        void windward;
    }

    private ignite(s: NavalShip): void {
        if (s.state !== 'alive') return;
        const fresh = s.burnT <= 0;
        s.burnT = Math.max(s.burnT, 9 + this.rng() * 7);
        if (fresh) this.events.push({ type: 'ignite', side: s.side, x: s.x, y: s.y, shipId: s.id, isFlag: s.role === 'flag' });
    }

    private pickTarget(s: NavalShip): void {
        const cur = this.getShip(s.targetId);
        if (cur && cur.state === 'alive' && cur.side !== s.side && this.rng() > 0.01) {
            // 正在打的目标太远了才换
            if (Math.hypot(cur.x - s.x, cur.y - s.y) < 700) return;
        }
        let best: NavalShip | null = null;
        let bestScore = Infinity;
        for (const o of this.ships) {
            if (o.side === s.side || o.state !== 'alive') continue;
            let d = Math.hypot(o.x - s.x, o.y - s.y);
            // 前排找最近的扑上去；后排盯着敌旗舰与带火的船（集火）
            if (s.role === 'back' && o.role === 'flag') d *= 0.8;
            if (o.routing) d *= 1.15;
            if (o.burnT > 0) d *= 0.9;
            if (d < bestScore) { bestScore = d; best = o; }
        }
        s.targetId = best ? best.id : null;
    }

    private maxRange(s: NavalShip): number {
        let r = 0;
        for (const w of s.weapons) if (w !== 'ram') r = Math.max(r, WEAPON_SPECS[w].range);
        // 海雾 / 暴雨看不远：射程缩短，远程船也只能往前凑
        return (r || 200) * this.wx.range * s.tech.range;
    }

    private isMelee(s: NavalShip): boolean {
        if (s.routing) return false;
        return s.role === 'front' || (s.weapons.includes('ram') && s.role === 'main');
    }

    private steer(s: NavalShip, dt: number): void {
        const t = this.getShip(s.targetId);
        let desired = s.heading;
        let throttle = 1;
        if (this.isPanicked(s)) {
            // 【混】乱驶：不追敌，每隔 0.75–1.5 秒换个方向（同陆战乱走）
            s.panicTurnT -= dt;
            if (s.panicTurnT <= 0) {
                s.panicAng = s.heading + (this.rng() - 0.5) * 2.4;
                s.panicTurnT = 0.75 + this.rng() * 0.75;
            }
            desired = s.panicAng;
            throttle = PANIC_MOVE;
        } else if (s.routing) {
            // 溃逃：背离敌军中心，冲向最近的场边
            const enemy = this.centroid(s.side === 'attacker' ? 'defender' : 'attacker');
            if (enemy) desired = Math.atan2(s.y - enemy.y, s.x - enemy.x);
            throttle = 1.15;
        } else if (t) {
            const dx = t.x - s.x, dy = t.y - s.y;
            const d = Math.hypot(dx, dy);
            const toT = Math.atan2(dy, dx);
            if (this.isMelee(s)) {
                desired = toT;
            } else {
                const pref = this.maxRange(s) * (s.role === 'back' || s.role === 'flag' ? 0.85 : 0.7);
                const tangent = toT + s.orbitSign * Math.PI / 2;
                if (d > pref * 1.15) desired = toT + s.orbitSign * 0.25;
                else if (d < pref * 0.75) desired = toT + Math.PI - s.orbitSign * 0.7;
                else desired = tangent;   // 进入射程：横过船身绕着打（舷侧对敌）
                // 旗舰：护航还多时压在后面
                if (s.role === 'flag' && this.countAlive(s.side) > 5 && d < pref) throttle = 0.6;
            }
        } else {
            throttle = 0.3;
        }
        throttle *= this.skillFrenzyTimer[s.side] > 0 ? FRENZY_MOVE : 1;
        // 避碰：别和友船叠在一起；不是自己目标的敌船也绕开
        let ax = Math.cos(desired), ay = Math.sin(desired);
        for (const o of this.ships) {
            if (o === s || o.state !== 'alive') continue;
            if (o.id === s.targetId && this.isMelee(s)) continue;
            const dx = s.x - o.x, dy = s.y - o.y;
            const d = Math.hypot(dx, dy);
            const lim = (s.radius + o.radius) * 1.9;
            if (d < lim && d > 0.01) {
                const w = (1 - d / lim) * 1.6;
                ax += (dx / d) * w;
                ay += (dy / d) * w;
            }
        }
        // 场界：往中间拐（溃逃船除外，它们就是要出场）
        if (!s.routing) {
            const m = 180;
            if (s.x < m) ax += (m - s.x) / m * 2;
            if (s.x > NAVAL_WORLD_W - m) ax -= (s.x - (NAVAL_WORLD_W - m)) / m * 2;
            if (s.y < m) ay += (m - s.y) / m * 2;
            if (s.y > NAVAL_WORLD_H - m) ay -= (s.y - (NAVAL_WORLD_H - m)) / m * 2;
        }
        desired = Math.atan2(ay, ax);
        const onLandNow = !this.isWater(s.x, s.y);
        const exitWater = onLandNow ? this.nearestWater(s.x, s.y) : null;
        if (onLandNow && exitWater && (exitWater.x !== s.x || exitWater.y !== s.y)) {
            // 已在陆地上：只能往最近水面出海，禁止继续往陆地深处走
            desired = Math.atan2(exitWater.y - s.y, exitWater.x - s.x);
        } else if (!this.clearAhead(s.x, s.y, desired)) {
            // 绕开陆地：前方是岸就左右找最近一条走得通的航向
            for (let k = 1; k <= 9; k++) {
                const a1 = desired + k * 0.35 * s.orbitSign, a2 = desired - k * 0.35 * s.orbitSign;
                if (this.clearAhead(s.x, s.y, a1)) { desired = a1; break; }
                if (this.clearAhead(s.x, s.y, a2)) { desired = a2; break; }
            }
        }
        // 刚顶过岸：先照绕岸航向把船头转出去、走开一段，再回到原来的打法
        if (!onLandNow && s.shoreEscUntil > this.time) desired = s.shoreEsc;
        const diff = angDiff(desired, s.heading);
        const turn = TURN_RATE * (s.role === 'flag' ? 0.8 : 1) * dt;
        s.heading += Math.max(-turn, Math.min(turn, diff));
        // 顺风快、顶风慢；急转弯降速
        const windMul = 1 + 0.24 * this.windStrength * Math.cos(s.heading - this.windAng);
        const turnMul = 1 - Math.min(0.45, Math.abs(diff) / Math.PI * 0.6);
        const roleMul = s.role === 'front' ? 1.12 : s.role === 'flag' ? 0.88 : 1;
        const target = BASE_SPEED * s.speedMul * windMul * turnMul * roleMul * throttle * this.wx.speed;
        s.speed += (target - s.speed) * Math.min(1, dt * 0.8);
        const nx = s.x + Math.cos(s.heading) * s.speed * dt;
        const ny = s.y + Math.sin(s.heading) * s.speed * dt;
        const bowClear = this.isWater(nx, ny)
            && this.isWater(nx + Math.cos(s.heading) * (s.radius * 0.55), ny + Math.sin(s.heading) * (s.radius * 0.55));
        if (!onLandNow) {
            if (bowClear) {
                s.x = nx;
                s.y = ny;
            } else {
                // 在水面禁止进陆地：减速，慢慢转向一条走得通的航向绕岸（受回转率限制，不一帧甩头）
                // 刚顶岸才减速；已在绕岸时别一擦再擦把船速磨到零（贴着岸爬）
                if (s.shoreEscUntil <= this.time) s.speed *= 0.6;
                const c = Math.cos, sn = Math.sin;
                // 岸在哪边：船身一圈探 16 个点，陆地方向取平均，离岸方向 = 反过来
                let lx = 0, ly = 0;
                for (let k = 0; k < 16; k++) {
                    const a = k * Math.PI / 8;
                    if (!this.isWater(s.x + c(a) * s.radius * 1.4, s.y + sn(a) * s.radius * 1.4)) { lx += c(a); ly += sn(a); }
                }
                const away = (lx || ly) ? Math.atan2(-ly, -lx) : s.heading + Math.PI;
                // 绕岸航向：离当前船头最近、走得通、且明显朝离岸那边（不贴着岸平行开）
                const open = (a: number) => Math.abs(angDiff(a, away)) < 1.25
                    && this.isWater(s.x + c(a) * s.radius, s.y + sn(a) * s.radius)
                    && this.isWater(s.x + c(a) * 96, s.y + sn(a) * 96);
                let esc = away;
                for (let k = 0; k <= 9; k++) {
                    const a1 = s.heading + k * 0.35 * s.orbitSign, a2 = s.heading - k * 0.35 * s.orbitSign;
                    if (open(a1)) { esc = a1; break; }
                    if (open(a2)) { esc = a2; break; }
                }
                // 已在绕岸且原定航向仍走得通就别来回改主意；走不通了才换
                if (s.shoreEscUntil <= this.time || !open(s.shoreEsc)) s.shoreEsc = esc;
                s.shoreEscUntil = this.time + 1.6;
                const pivot = TURN_RATE * 2.5 * dt;
                s.heading += Math.max(-pivot, Math.min(pivot, angDiff(s.shoreEsc, s.heading)));
            }
        } else if (exitWater) {
            const curD = Math.hypot(exitWater.x - s.x, exitWater.y - s.y);
            const nextD = Math.hypot(exitWater.x - nx, exitWater.y - ny);
            if (this.isWater(nx, ny) || nextD < curD) {
                s.x = nx;
                s.y = ny;
            } else if (curD > 0.01) {
                // 只能出陆地不能进陆地：被朝陆方向阻挡时直接朝最近水面挪出
                const step = Math.min(curD, Math.max(s.speed, 35) * dt);
                s.x += (exitWater.x - s.x) / curD * step;
                s.y += (exitWater.y - s.y) / curD * step;
            }
        }
        s.trailAcc += s.speed * dt;
        if (s.trailAcc > 14) {
            s.trailAcc = 0;
            s.trail.push({ x: s.x, y: s.y });
            if (s.trail.length > 26) s.trail.shift();
        }
        if (s.routing && (s.x < -120 || s.x > NAVAL_WORLD_W + 120 || s.y < -120 || s.y > NAVAL_WORLD_H + 120)) {
            s.state = 'fled';
        }
    }

    private fireWeapons(s: NavalShip, dt: number, windward: NavalSide | null): void {
        const t = this.getShip(s.targetId);
        for (const w of s.weapons) {
            if (w === 'ram') continue;
            const spec = WEAPON_SPECS[w];
            const cd = (s.cooldowns[w] ?? 0) - dt;
            s.cooldowns[w] = cd;
            if (cd > 0 || !t || this.isPanicked(s)) continue;
            const rangeMul = (windward === s.side ? 1.12 : 1) * this.wx.range * s.tech.range;
            // 射程内任挑一条敌船（优先当前目标）
            let tgt: NavalShip | null = null;
            const dT = Math.hypot(t.x - s.x, t.y - s.y);
            if (dT <= spec.range * rangeMul && dT >= spec.minRange) tgt = t;
            else {
                let bd = Infinity;
                for (const o of this.ships) {
                    if (o.side === s.side || o.state !== 'alive') continue;
                    const d = Math.hypot(o.x - s.x, o.y - s.y);
                    if (d <= spec.range * rangeMul && d >= spec.minRange && d < bd) { bd = d; tgt = o; }
                }
            }
            if (!tgt) continue;
            const isArrow = w === 'arrow';
            const archers = s.role === 'flag' ? 4 : 3;
            const frenzy = this.skillFrenzyTimer[s.side] > 0;
            const cdMul = (isArrow
                ? (0.45 + this.rng() * 1.10) / archers
                : (0.85 + this.rng() * 0.30)) / (frenzy ? FRENZY_ATKSPD : 1);
            s.cooldowns[w] = spec.cooldown * cdMul * (s.crew / s.maxCrew < 0.35 ? 1.6 : 1);
            s.lastFireAt = this.time;
            const d = Math.hypot(tgt.x - s.x, tgt.y - s.y);
            const acc = spec.accuracy * (1 - d / (spec.range * 2.2)) * (windward === s.side ? 1.08 : 1) * this.wx.acc;
            const hit = this.rng() < acc;
            // 起射点沿甲板纵向散布，落点落在船身不同部位或船边水里（学陆战箭塔真实单支火箭连射）
            const deckShift = isArrow ? (this.rng() - 0.5) * s.radius * 1.15 : 0;
            const x0 = s.x + Math.cos(s.heading) * deckShift;
            const y0 = s.y + Math.sin(s.heading) * deckShift;
            const ang = this.rng() * Math.PI * 2;
            const miss = hit ? (isArrow ? this.rng() * tgt.radius * 0.45 : 0) : 50 + this.rng() * 70;
            const lead = tgt.speed * (d / spec.speed) * 0.8;
            const x1 = tgt.x + Math.cos(tgt.heading) * lead + Math.cos(ang) * miss;
            const y1 = tgt.y + Math.sin(tgt.heading) * lead + Math.sin(ang) * miss;
            const m = this.mult[s.side].dmg * (isArrow ? s.tech.arrow / 3 : s.tech.heavy) * (frenzy ? FRENZY_DMG : 1);
            const igniteBoost = isArrow && windward === s.side ? 1.6 : 1;
            const igniteBase = isArrow ? spec.igniteChance * 0.65 : spec.igniteChance;
            const dur = Math.max(0.15, Math.hypot(x1 - x0, y1 - y0) / spec.speed);
            const fireArrow = isArrow && !s.weapons.includes('cannon');
            this.projectiles.push({
                kind: w, side: s.side, x0, y0, x1, y1, t: 0, dur,
                arc: spec.arc, targetId: tgt.id, hit,
                damage: spec.damage * m, crewDamage: spec.crewDamage * m, splash: spec.splash,
                ignite: this.rng() < igniteBase * igniteBoost * this.wx.ignite,
                fireArrow,
            });
            this.events.push({ type: 'fire', weapon: w, side: s.side, x: x0, y: y0, shipId: s.id, tx: x1, ty: y1, dur, fireArrow });
        }
    }

    private updateProjectiles(dt: number): void {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.t += dt;
            if (p.t < p.dur) continue;
            this.projectiles.splice(i, 1);
            const tgt = this.getShip(p.targetId);
            let landedHit = false;
            if (p.hit && tgt && tgt.state === 'alive') {
                // 命中的炮弹跟着船走（飞行中船动了，按船当前位置算）
                if (Math.hypot(tgt.x - p.x1, tgt.y - p.y1) < 160) {
                    landedHit = true;
                    this.damage(tgt, p.damage, p.crewDamage, p.side);
                    if (p.ignite) this.ignite(tgt);
                }
            }
            if (p.splash > 0) {
                for (const o of this.ships) {
                    if (o === tgt || o.state !== 'alive' || o.side === p.side) continue;
                    const d = Math.hypot(o.x - p.x1, o.y - p.y1);
                    if (d < p.splash + o.radius) { this.damage(o, p.damage * 0.4, p.crewDamage * 0.4, p.side); landedHit = true; }
                }
            }
            this.events.push({ type: 'impact', weapon: p.kind, hit: landedHit, x: p.x1, y: p.y1 });
        }
    }

    private damage(s: NavalShip, hp: number, crew: number, _from: NavalSide | null): void {
        if (s.state !== 'alive') return;
        const k = this.takenMul(s) * COMBAT_PACE;
        s.hp -= hp * k;
        s.crew = Math.max(0, s.crew - crew * k);
        if (_from !== null) s.lastHitAt = this.time;
        if (s.hp <= 0) this.sink(s);
    }

    private sink(s: NavalShip): void {
        if (s.state !== 'alive') return;
        s.hp = 0;
        s.state = 'sinking';
        s.sinkAt = this.time;
        const partner = this.getShip(s.boardingWith);
        if (partner) partner.boardingWith = null;
        s.boardingWith = null;
        const explode = s.burnT > 0 && (s.weapons.includes('cannon') || s.weapons.includes('greekfire') || this.rng() < 0.3);
        this.events.push({ type: 'sink', side: s.side, x: s.x, y: s.y, shipId: s.id, isFlag: s.role === 'flag', explode });
        if (s.role === 'flag') this.startRout(s.origSide, 'flag');
    }

    /** 撞角冲撞 / 贴舷接舷 */
    private resolveContacts(): void {
        const list = this.ships;
        for (let i = 0; i < list.length; i++) {
            const a = list[i];
            if (a.state !== 'alive') continue;
            for (let j = i + 1; j < list.length; j++) {
                const b = list[j];
                if (b.state !== 'alive') continue;
                const dx = b.x - a.x, dy = b.y - a.y;
                const d = Math.hypot(dx, dy) || 0.01;
                const min = (a.radius + b.radius) * ((a.boardingWith === b.id) ? 0.68 : 1.32);
                if (d >= min) continue;
                // 推开（不叠船）
                const push = (min - d) * 0.55;
                if (a.boardingWith === null && this.isWater(a.x - dx / d * push, a.y - dy / d * push)) { a.x -= dx / d * push; a.y -= dy / d * push; }
                if (b.boardingWith === null && this.isWater(b.x + dx / d * push, b.y + dy / d * push)) { b.x += dx / d * push; b.y += dy / d * push; }
                if (a.side === b.side) continue;
                if (a.boardingWith !== null || b.boardingWith !== null) continue;
                // 撞击 / 碾压：带撞角的战船或吨位更大的大船迎头撞上敌船，按吨位差造成重创与撞飞
                for (const [att, def] of [[a, b], [b, a]] as const) {
                    const hasRam = att.weapons.includes('ram');
                    const massRatio = att.mass / Math.max(0.45, def.mass);
                    if ((!hasRam && massRatio < 1.15) || att.ramCd > 0 || att.speed < BASE_SPEED * 0.45 || this.isPanicked(att)) continue;
                    const toDef = Math.atan2(def.y - att.y, def.x - att.x);
                    if (Math.abs(angDiff(toDef, att.heading)) > 0.7) continue;
                    att.ramCd = 4.5;
                    const sp = Math.min(1.4, att.speed / BASE_SPEED);
                    att.speed *= Math.min(0.82, 0.35 + 0.25 * Math.min(1.8, massRatio));
                    const kick = (16 + 22 * Math.min(2.6, massRatio)) * sp;
                    const kx = Math.cos(toDef) * kick, ky = Math.sin(toDef) * kick;
                    if (this.isWater(def.x + kx, def.y + ky)) { def.x += kx; def.y += ky; }
                    this.events.push({ type: 'ram', side: att.side, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
                    const ramBonus = hasRam ? 1.45 : 1.0;
                    const dmg = (18 + 16 * Math.min(3.5, massRatio)) * sp * ramBonus * this.mult[att.side].dmg
                        * att.tech.heavy * (this.skillFrenzyTimer[att.side] > 0 ? FRENZY_DMG : 1);
                    this.damage(def, dmg, 6 + Math.round(4 * Math.min(2.5, massRatio)), att.side);
                }
                if (a.state !== 'alive' || b.state !== 'alive') continue;
                // 接舷：贴上了的前排船（或撞角船）抛钩跳帮
                const wants = (this.isMelee(a) || this.isMelee(b)) && a.boardCd <= 0 && b.boardCd <= 0
                    && !this.isPanicked(a) && !this.isPanicked(b);
                if (wants && this.rng() < 0.9 * this.lastDt) {
                    a.boardingWith = b.id;
                    b.boardingWith = a.id;
                    a.speed = b.speed = 0;
                    this.events.push({ type: 'boardStart', side: this.isMelee(a) ? a.side : b.side, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, a: a.id, b: b.id });
                }
            }
        }
    }

    private updateBoarding(s: NavalShip, dt: number): void {
        const o = this.getShip(s.boardingWith);
        if (!o || o.state !== 'alive' || o.boardingWith !== s.id) { s.boardingWith = null; return; }
        if (s.id > o.id) return;   // 一对只算一次
        // 两船抛钩拉近贴舷并排漂
        s.speed = o.speed = 0;
        const bx = o.x - s.x, by = o.y - s.y;
        const bd = Math.hypot(bx, by) || 0.01;
        const targetDist = (s.radius + o.radius) * 0.68;
        if (bd > targetDist + 1) {
            const pull = Math.min((bd - targetDist) * 0.5, 45 * dt);
            const nx = (bx / bd) * pull, ny = (by / bd) * pull;
            if (this.isWater(s.x + nx, s.y + ny)) { s.x += nx; s.y += ny; }
            if (this.isWater(o.x - nx, o.y - ny)) { o.x -= nx; o.y -= ny; }
        }
        const ms = this.mult[s.side].dmg * (this.skillFrenzyTimer[s.side] > 0 ? FRENZY_DMG : 1);
        const mo = this.mult[o.side].dmg * (this.skillFrenzyTimer[o.side] > 0 ? FRENZY_DMG : 1);
        const lossS = (o.crew * 0.045 * mo * (0.6 + this.rng() * 0.8) + 0.6) * dt * this.takenMul(s) * COMBAT_PACE;
        const lossO = (s.crew * 0.045 * ms * (0.6 + this.rng() * 0.8) + 0.6) * dt * this.takenMul(o) * COMBAT_PACE;
        s.crew = Math.max(0, s.crew - lossS);
        o.crew = Math.max(0, o.crew - lossO);
        s.lastHitAt = o.lastHitAt = this.time;
        const sOut = s.crew <= s.maxCrew * 0.08;
        const oOut = o.crew <= o.maxCrew * 0.08;
        if (!sOut && !oOut) return;
        const [win, lose] = sOut && !oOut ? [o, s] : !sOut && oOut ? [s, o] : (s.crew >= o.crew ? [s, o] : [o, s]);
        win.boardingWith = null;
        lose.boardingWith = null;
        win.boardCd = 10;
        lose.boardCd = 10;
        // 打光了船上的人：船还完好就夺下来换旗，否则败兵点火弃船
        const captureP = lose.role === 'flag' ? 0.7 : 0.4;
        if (lose.hp > lose.maxHp * 0.35 && this.rng() < captureP) this.capture(lose, win);
        else { this.ignite(lose); this.damage(lose, lose.maxHp * 0.3, 0, win.side); }
    }

    private capture(ship: NavalShip, by: NavalShip): void {
        const wasFlag = ship.role === 'flag';
        const fromSide = ship.side;
        const moved = Math.max(8, by.crew * 0.3);
        by.crew -= moved;
        ship.crew = moved;
        ship.side = by.side;
        ship.factionId = by.factionId;
        ship.captured = true;
        ship.burnT = 0;
        ship.targetId = null;
        ship.routing = this.routSide === by.side;
        // 夺来的船降为普通战船（旗舰被夺 = 敌方帅旗落地）
        if (wasFlag) ship.role = 'main';
        this.events.push({ type: 'capture', side: by.side, x: ship.x, y: ship.y, shipId: ship.id, isFlag: wasFlag });
        if (wasFlag) this.startRout(fromSide, 'flag');
    }

    private startRout(side: NavalSide, reason: 'flag' | 'losses'): void {
        if (this.routSide) return;
        this.routSide = side;
        this.routAt = this.time;
        for (const s of this.ships) if (s.side === side && s.state === 'alive') {
            s.routing = true;
            s.targetId = null;
        }
        this.events.push({ type: 'rout', side, reason });
    }

    private updatePhase(): void {
        let next: NavalPhase = this.phase;
        if (this.routSide) next = 'rout';
        else if (this.ships.some((s) => s.boardingWith !== null) || this.minGap() < 140) next = 'melee';
        else if (this.phase === 'approach' && this.projectiles.length > 0) next = 'exchange';
        if (next !== this.phase && !(this.phase === 'melee' && next === 'exchange')) {
            this.phase = next;
            this.events.push({ type: 'phase', phase: next });
        }
        // 船数见底也溃散：只剩两成且不足 3 艘
        if (!this.routSide) {
            for (const side of ['attacker', 'defender'] as const) {
                const alive = this.countAlive(side);
                if (alive <= Math.max(2, Math.floor(this.initCount[side] * 0.2))) { this.startRout(side, 'losses'); break; }
            }
        }
    }

    private minGap(): number {
        let best = Infinity;
        for (const a of this.ships) {
            if (a.side !== 'attacker' || a.state !== 'alive') continue;
            for (const b of this.ships) {
                if (b.side !== 'defender' || b.state !== 'alive') continue;
                const d = Math.hypot(a.x - b.x, a.y - b.y) - a.radius - b.radius;
                if (d < best) best = d;
            }
        }
        return best;
    }

    private strength(side: NavalSide): number {
        let hp = 0;
        for (const s of this.ships) {
            if (s.side !== side) continue;
            if (s.state === 'alive') hp += s.hp * (0.5 + 0.5 * s.crew / s.maxCrew);
            else if (s.state === 'fled') hp += s.hp * 0.5;
        }
        return Math.max(0, Math.min(1, hp / (this.initHp[side] || 1)));
    }

    private checkEnd(): void {
        const a = this.countAlive('attacker');
        const d = this.countAlive('defender');
        let winner: NavalSide | null = null;
        if (a === 0 && d === 0) winner = this.routSide === 'attacker' ? 'defender' : 'attacker';
        else if (a === 0) winner = 'defender';
        else if (d === 0) winner = 'attacker';
        else if (this.routSide && this.time - this.routAt > ROUT_END_DELAY) winner = this.routSide === 'attacker' ? 'defender' : 'attacker';
        else if (this.time >= NAVAL_TIME_LIMIT) winner = this.strength('attacker') >= this.strength('defender') ? 'attacker' : 'defender';
        if (!winner) return;
        const loser: NavalSide = winner === 'attacker' ? 'defender' : 'attacker';
        // 溃逃中的败方船算逃掉了：结算前把还在场上的败船收成 fled
        this.result = {
            winner,
            winnerStrength: Math.max(0.05, this.strength(winner)),
            loserStrength: this.strength(loser),
        };
    }
}
