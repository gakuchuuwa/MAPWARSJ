import type { BattleType } from '../../combat/CombatSystem';
import type { CityType } from '../../types/core';

/** 攻城战守方城墙/城门：可攻击建筑目标（士兵能打、HP 归零即破，照 DE）。不进 WarMan 网格，独立维护。 */
export interface WarBuilding {
    f: 0 | 1;
    /** 'STONE_WALL' | 'WOOD_WALL' | 'STONE_GATE'（查 WALL_GATE_STATS） */
    key: string;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    /** 围殴上限（同 SPREAD_CAP，复用 search 的 claims 逻辑） */
    claims: number;
    /** 本帧锁定计数结转（同 WarMan.claimsNext，帧末统计多少兵锁定它） */
    claimsNext: number;
    /** 围攻计数（同 WarMan.atkNext，被谁打计数） */
    atkNext: number;
    /** 围殴加成（gangMul 读这个） */
    atkers: number;
    /** 关联装饰精灵（破墙时标记 destroyed → 不再绘制、不再阻挡） */
    sprite: DecorSprite;
    /** 关联的附属物理屏障精灵（破门时一并标记 destroyed / obstructionDisabled 解除阻挡） */
    extraSprites?: DecorSprite[];
    /** 参与「一处破 → 前排全倒」联动的正面体系（正面城墙段 + 城门） */
    linked?: boolean;
    /** 城墙破损档素材目录名数组 [D25, D50, D75]；有值 → 破墙前按 HP 比例渐进切换，破墙后切 D75 残垣；无值（木栅栏）→ 直接消失 */
    destrAssets?: string[];
    /** 🔴 [2026-10-12 主人令] 城内建筑/箭塔（DE 血量）：name = 素材名；tower = 对应箭塔（倒塌即停火） */
    bld?: { name: string; tower?: ArrowTower };
    /** 🔴 [2026-10-12] 第一次挨打的时刻（battleSec）；10 秒坍塌按它先后排 */
    hitAt?: number;
    /** 城门倒塌动画素材目录名（DESTR，50 帧），破门时播放；播完切 rubbleAsset 残骸常驻 */
    collapseAsset?: string;
    /** 城门倒塌后残骸素材目录名（RUBBLE，1 帧），常驻地面不再阻挡 */
    rubbleAsset?: string;
    /** 倒塌动画已播放秒数（破门时置 0 启动，渲染层按帧推进） */
    collapseT?: number;
}

/**
 * 🔴 [2026-08-29 主人需求] 攻城战守方城墙内侧并列箭塔：可射箭（🔴 [主人需求] 真实穿透伤害，照 DE 箭塔科技；
 * 连弩三连发 + 开火火花），30 秒随建筑一起随机三形态（完整继续射箭 / 破损停火 / 残骸停火，见 applyRandomCollapseForms）。
 */
export interface ArrowTower {
    /** 城墙内侧的塔贴图（BUILDING: 单帧，撞色兵；world 层、不阻挡） */
    sprite: DecorSprite;
    x: number;
    y: number;
    /** 开火冷却（秒），<=0 才射箭 */
    cd: number;
    /** 射程（px），按塔档：瞭望 320 / 警戒 360 / 高级 400 */
    range: number;
    /** 开火间隔（秒），按塔档 */
    reload: number;
    /** 🔴 [主人需求] 射箭攻击力（照 DE 箭塔科技：瞭望 5 / 警戒 6 / 高级 7；城堡 11） */
    atk: number;
    /** 倒塌后残骸素材目录名（BUILDINGANIM:..._RUBBLE） */
    rubbleAsset: string | null;
    /** 🔴 30 秒随机切成残骸后置位：不再开火（完整/破损保持 false 继续射） */
    down: boolean;
}

/** 🔴 [2026-09-16 主人定「防守方所有没有坍塌的建筑都可以射箭」] 守城普通建筑射手配置（🔴 2026-10-15 起与箭塔同款连弩三连发，攻/射程/装填与城墙箭塔同档） */
export interface CityBuildingEntry {
    sprite: DecorSprite;
    name: string;
    cd?: number;
    range?: number;
    reload?: number;
    atk?: number;
}

/** [军事科技] 供战斗面板渲染徽记用的精简结构（id 用于分组比对，name 用于显示） */
export interface TechBrief { id: string; name: string; }

export interface WarSpawn {
    f: 0 | 1;
    key: string;
    x: number;
    y: number;
    pool: number;
    /** 本口累计已出生精灵数（旗手判定：每满 FLAG_EVERY 出一面旗，按口平均分布，跨批不重置） */
    spawned: number;
    /** 本口列阵方阵已发出的槽位数（开局 + 补兵每批都排方阵；每批重置，见 MARCH_*） */
    slotN: number;
    /** 本口兵种的人口占用（1 精灵 = pop × SPRITE_TROOPS 兵；见 popCostOf） */
    pop: number;
    /** [2026-09-05 玩家] 出兵口序号（= 编队 id，玩家指挥按它认队） */
    lane: number;
    /** [2026-09-05 玩家] 所在排：0 前 / 1 中 / 2 后；-1 = 玩家自带精锐（前排之前） */
    row: number;
    /** 🔴 [2026-10-14 主人令「第一波直接在城外列阵出生」] 攻城战守方：本口在城外阵里的前后/左右偏移（相对城外阵基点，见 defOutsideBase） */
    outFwd?: number;
    outSide?: number;
    /** [2026-09-05 玩家] 玩家自带精锐编队 */
    playerElite?: boolean;
    /** 🔴 [2026-09-23] 第 10 口主将队（row -1，前排正中再往前） */
    commander?: boolean;
}

export interface WarMan {
    f: 0 | 1;
    key: string;
    /** [2026-09-05 玩家] 所属出兵口（WarSpawn.lane）；-1 = 攻城武器
     *  🔴 [2026-10-03 主人令「玩家的兵模是什么就和那一队锚定」] 玩家本人不再是 -1，见 setupPlayerUnits */
    lane: number;
    /** [2026-09-05 玩家] 玩家本人（乱入者）：不计兵力、不留尸（落马后回本方边缘重整）、按键/点击可操控 */
    hero?: boolean;
    /** 出生递增序号（终身不变）：渲染 z-order 排序的稳定 tiebreaker，防拥挤时 y 抖动导致重叠兵谁在上谁在下狂闪 */
    zid: number;
    x: number;
    y: number;
    tx: number;
    ty: number;
    hp: number;
    dir: number;
    ph: number;
    st: 0 | 1 | 2;
    foe: WarMan | WarBuilding | null;
    /** 帧开始时预登记的目标；轮到本人更新时先释放，再登记最终选择。 */
    reservedFoe?: WarMan | WarBuilding | null;
    rangeWait?: number;
    /** 【被攻击反击】最近一次攻击我的人（WarMan）。被攻击的兵下次索敌时优先锁定它，无视围殴封顶 SPREAD_CAP */
    hurtBy?: WarMan | null;
    hurtAt?: number;
    next: number;
    fightT: number;
    aimT: number;
    /**
     * 🔴 [2026-10-03] 本兵「无目标」已持续秒数：有目标当帧清零、无目标每帧累加（在 step 的索敌结算之后）。
     * 只服务归队门槛（见 LANE_REGROUP_SEC）；与 fightT（够得着的缠斗计时）是两件事，别混用。
     */
    noFoeSec?: number;
    /** 出场渐显剩余时间（秒） */
    fadeT: number;
    /** 出场渐显总时长（秒，出生时定死）：render 算 alpha 的分母，勿与 FADE_IN 硬编码混用 */
    fadeMax: number;
    /** 攻击动作交替标志：有冲锋组的兵种（象兵/弓骑）每轮出手翻转，两套攻击动作轮播 */
    atkFlip: boolean;
    /** 推挤力的平滑量（见 SEP_SMOOTH，逐帧向当前推力靠拢，防方向突变导致原地哆嗦） */
    sepX: number;
    sepY: number;
    /** 前方刚检测到己方阻挡后的绕行迟滞；防止直走/侧滑逐帧切换。 */
    avoidT?: number;
    /** 出生时所在的 y */
    y0: number;
    /** 🔴 [2026-10-15 主人令] 攻城战第二波起守军的原地警戒驻守点（本队出兵口原位槽位）：攻击附近敌人后回原位警戒 */
    guardPost?: { x: number; y: number };
    /** 上一帧位置（算真实位移用，见 stuckT） */
    prevX: number;
    prevY: number;
    /** 🔴 [2026-10-13] 本帧真实位移的 max(|Δx|,|Δy|)（step 末尾结算；渲染层判「本帧真的没动」用）。
     *  不能在渲染层拿 prevX 比：step 末尾已把 prevX 写成当前位置，那样比出来恒为 0。 */
    stepMax?: number;
    /**
     * 净位移锚点 + 计时（见 NET_STUCK_WINDOW）。
     * 单帧位移只能识别「被堵得完全不动」；被推挤来回震荡时**每帧位移并不小**（推开又被推回），
     * 净位移却≈0 —— 那种情况下旧判定一直清零 stuckT，于是一直播移动帧配来回跳的坐标，
     * 看着就是原地抽搐（主人 2026-08-26 实锤：战车、大象最明显，它们占地半径最大、推力最强）。
     */
    anchorX: number;
    anchorY: number;
    netT: number;
    /**
     * 「想走但走不动」已持续多久（秒）。
     * 走路动画只在**真的位移**时播：被前面的人堵住时位移≈0，再播移动帧就是原地迈腿（主人 2026-08-17 提）。
     * 用累计时间而不是单帧判定，避免在走/停边界上每帧切动画（那又是一种抖）。
     */
    stuckT: number;
    /**
     * 落点散开偏移（出生时定死，终身不变；见 AIM_JITTER）。
     * 只加在「全军共用的那个坐标」上（敌口/敌军重心），不加在「最近的那个敌兵」上。
     */
    jx: number;
    jy: number;
    /** 本轮是否已放箭（远程）：动画播到放箭相位才射，避免箭和拉弓动作脱节 */
    shot?: boolean;
    /** 本轮是否已出刀/出枪（近战）：动画播到命中相位才触发刀光与火花 */
    slashed?: boolean;
    /** 火矛手充能冷却（秒）：进战先喷一轮火枪弹，30 秒充能（DE 充能攻击） */
    chargeCd?: number;
    /** 是否旗手（出生时定死，见 FLAG_EVERY）：头顶画一面势力旗，战死则军旗倒地 */
    flag: boolean;
    /**
     * 旗帜飘动的相位偏移（毫秒，出生时掷定不再变）。
     * 🔴 没有它十几面旗会**整齐划一地一起抖**：drawFlag 的帧索引是 floor(tick/150)%4，
     *    全场共用一个 tick。大地图一屏没几面旗所以从没暴露，13 里一方十几面就假得明显。
     *    ⚠️ 不能拿 m.ph 当偏移——那个每秒涨 8，会让旗越飘越快且随战斗状态变速。
     */
    fo: number;
    /**
     * 列阵推进（见 MARCH_REL）：本兵是否还在开局的列阵行军阶段。
     * true 期间移动只跟自己的槽位，够不着敌人**不追**；索敌与出手照旧（远程在队形里放箭）。
     */
    march: boolean;
    /**
     * 【放风筝】连续后撤累计跑了多远（px）。**成功甩开一次（停时 kd ≥ KITE_SAFE）就清零**。
     * 见 KITE_RETREAT_CAP：跨多段累计跑满那么远仍没甩开 = 这个敌人根本甩不掉（同速骑兵追杀），
     * 再跑就是自废武功，此时永久放弃风筝、转身硬拼。
     * ⚠️ 段落式后撤：跑够 KITE_RETREAT_DIST 但没甩开（kd < KITE_SAFE）时**不清零**、本段白跑继续跑，
     *   同速追兵每段都甩不开 → 累计到 CAP 放弃。
     */
    kiteDist?: number;
    /**
     * 【放风筝】本段后撤已跑距离（px）：跑够 KITE_RETREAT_DIST 且拉开到 KITE_SAFE 就停下回身站撸，并清零。
     * 与 kiteDist 的分工：kiteDist 是「甩开才清零」的跨段累计（判「甩不掉」→放弃），
     * 这个是「每段清零」的段内计数（判「跑够一段就停」）。
     */
    kiteLeg?: number;
    /** 【放风筝】本场已放弃风筝（撤退白跑太远，见 kiteDist）；置位后不再后撤 */
    kiteGaveUp?: boolean;
    /**
     * 【放风筝】当前是否处于「转身跑开」状态（只有带 kite 的弓骑用）。
     * 进入：被近战贴脸（65px，敌人已挥刀砍过来）；退出：后撤跑够 KITE_RETREAT_DIST 且拉开到 KITE_SAFE。
     * 段落式「站撸 → 被攻击 → 撤一段 → 再站撸」，不是「距离阈值上每帧翻面」。
     */
    kiting?: boolean;
    /** 🔴 [2026-08-23 主人定] 攻城战专用攻城武器（spawnSiegeWeapons 生成）：开战即行动，
     *  不受「双方按兵不动」限制（见 holdSiege）；普通编制里的火箭车/投石车不算（无此标记）。 */
    siegeW?: boolean;
    /** 🔴 [2026-10-12 主人令「只有城墙挡路时才打城墙」] 最近一次把本兵挡住的城墙段与时刻（battleSec） */
    blockedBy?: WarBuilding | null;
    blockedAt?: number;
    /** 列阵槽位所属出兵口（阵型锚点；非列阵兵为 null） */
    port: WarSpawn | null;
    /** 列阵槽位：dep = 沿推进方向的纵深（0 = 最前排，越大越靠后）；sy = 横向偏移 */
    dep: number;
    slotY: number;
    /** 人口占用（1 精灵 = pop × SPRITE_TROOPS 兵；出生时从所属出兵口继承，见 popCostOf） */
    pop: number;
    /**
     * 【索敌分流】本帧有多少人把**我**当成目标（m.foe 指向我）—— 含正在赶路的，
     * 与 atkers（只数够得着并出手的）不同。search 用它判「这人已经被够多人盯上了，换一个」。
     * 每帧开始从零登记；保留旧目标或 search 选中新目标时立即占位，帧末再按实际锁定关系核对。
     */
    claims: number;
    claimsNext: number;
    atkers: number;
    /** 本帧累计的攻击者数，帧末结转给 atkers */
    atkNext: number;
    lock: number;
    atkSt: number;
    /** DE accuracy（准确率）：本轮攻击是否命中（lock 到期时 roll）；undefined = 近战/未判定，视为命中 */
    accHit?: boolean;
    /** 胡斯战车 5 发次级弹各自的 DE 75% 命中判定。 */
    hussiteSecondaryHits?: boolean[];
}

/** 箭矢：远程每出一次手射一支（纯画面，伤害仍按秒结算，不改平衡） */
export interface WarArrow {
    x: number;
    y: number;
    /** 单位方向向量 */
    dx: number;
    dy: number;
    /** 起点到目标的距离（飞完就消失） */
    len: number;
    t: number;
    dur: number;
    f: 0 | 1;
    /** 抛射物素材 key（PROJ_ARROW / PROJ_SPEAR / ...），决定画哪支箭 */
    proj: string;
    /** 连发发射延迟（秒）：t < delay 尚未射出（诸葛弩 3/5 支依次射）。 */
    delay?: number;
    /** 箭塔直射：发射时锁定两端高度，空中不再贴地形修正。 */
    towerFlight?: { startLift: number; endLift: number };
}

/** DE 抛射物素材缓存：一张横排 fly_0.png + _meta.json 的帧框/hotspot。 */
export interface ProjAsset {
    img: HTMLImageElement | null;
    /** 帧数 */
    n: number;
    /** 每帧宽/高 */
    fw: number;
    fh: number;
    /** hotspot（旋转中心）相对帧左上角 */
    hx: number;
    hy: number;
}

/** 倒下的军旗：旗手战死后原地转倒 + 淡出（t 走到 FLAG_FALL 即移除） */
export interface WarFallenFlag {
    x: number;
    y: number;
    f: 0 | 1;
    t: number;
    /** 沿用旗手的飘动相位，倒下瞬间不跳帧 */
    fo: number;
}

/**
 * 场景云（飘动装饰，不参与任何战斗逻辑）。
 * 🔴 云盖在**最上层**（士兵、旗帜、箭矢之上）半透明飘过——俯视视角下云本来就在人上面。
 */
export interface SceneCloud {
    x: number;
    y: number;
    /** 水平漂移速度（px/秒，可正可负） */
    vx: number;
    alpha: number;
    scale: number;
    /** 水平镜像（随机翻转，丰富形态） */
    flip: boolean;
    img: HTMLImageElement | null;
}

/** 自然装饰 sheet 元数据（与 PROJ_* 同格式，静态装饰无 8 方向） */
export interface NatureMeta {
    frames: number;
    box_w: number;
    box_h: number;
    anchor_x: number;
    anchor_y: number;
}
export interface NatureAsset {
    img: HTMLImageElement | null;
    meta: NatureMeta | null;
}
/** 装饰层精灵（树/灌木/岩石/山体等静态装饰，画在尸体层之下，永不遮士兵） */
export interface DecorSprite {
    asset: string;      // SUCAI_NATURE/<asset> 目录名
    /** 随机种子：实际帧 = frame % meta.frames（meta 异步加载后稳定不变） */
    frame: number;
    x: number;
    y: number;          // 树基/岩心位置（屏幕坐标）
    flip: boolean;
    /** ground 烙入地面；world 与士兵按脚点 y 共同排序 */
    layer: 'ground' | 'world';
    /** 同一脚点的稳定次序 */
    z: number;
    /** 绘制缩放（1 = 原尺寸）。未设置走原尺寸路径，锚点随之等比缩放。 */
    scale?: number;
    /** DE DAT 对象碰撞半径（地图格）；未设置即不阻挡 */
    obstruction?: { x: number; y: number };
    /** 树连续阻挡若干秒后仅关闭碰撞；精灵图仍参与绘制。 */
    obstructionReleaseAfterSec?: number;
    obstructionContactSec: number;
    obstructionTouched: boolean;
    obstructionDisabled: boolean;
    /** 已销毁装饰（城门倒塌动画播完且无残骸兜底）→ 不再绘制、不再阻挡 */
    destroyed?: boolean;
    /** 地面高程抬升预计算值（静态物件避免逐帧双线性插值） */
    lift?: number;
    /** 空间密度哈希（远景 LOD 快速抽稀） */
    densityHash?: number;
    /** 奇观、城堡等特殊建筑：任何随机破损、倒塌与残骸入口都不得处理。 */
    indestructible?: boolean;
    /**
     * 倒塌动画状态（城门/城墙破墙时置入）：破墙后本 sprite 不立即 destroyed，
     * 而是切到倒塌动画素材（asset 已指向 collapseAsset），按 t 推进帧，
     * 播完（t ≥ dur）→ 切 rubble 残骸常驻 / 城墙留 D75 残垣。
     * 未设置 = 正常静态装饰。
     */
    collapse?: { t: number; dur: number; rubbleAsset: string | null };
}

/**
 * 战术野生动物与家畜（2026-10-13 按 DE 数据重写）。
 * 分类 / 速度 / 视野 / 血量 / 攻击 / 素材动作 —— 全部照 DE 本体，见下表 ANIMAL_DE。
 */
export type AnimalKind = 'prey' | 'danger' | 'predator' | 'livestock' | 'bird';
export type AnimalAction = 'idle' | 'walk' | 'run' | 'attack' | 'hover' | 'fly';

export interface TacticalAnimal {
    sprite: DecorSprite;
    species: string;
    kind: AnimalKind;
    action: AnimalAction;
    dir: number;
    /** 出生点：DE 的胆小猎物不被追就回自己的窝（不是就地停住） */
    homeX: number;
    homeY: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    /** 受惊 / 被追赶的剩余秒数 */
    fleeTimer: number;
    /** 🔴 [2026-10-13 主人令「只冒着一个方向跑」] 本次逃跑**锁定的朝向**（单位向量，首次受惊时定死，逃跑期间绝不重算） */
    fleeDX: number;
    fleeDY: number;
    /** 闲逛：下一次换方向的倒计时（飞鸟：盘旋/巡航的剩余秒数） */
    idleTimer: number;
    wanderX: number;
    wanderY: number;
    animPhase: number;
    hp: number;
    /** 下次咬人时刻（DE 装填 2 秒） */
    atkNext: number;
    flyX: number;
    flyY: number;
    hovering: boolean;
}

export interface AnimalDe {
    kind: AnimalKind;
    walk: number;
    run: number;
    los: number;
    hp: number;
    atk: number;
    reload: number;
    acts: readonly AnimalAction[];
}

/** 刀光剑影：近战攻击挥砍半月弧光 / 长枪突刺锐芒 */
export interface WarSlash {
    x: number;
    y: number;
    angle: number;
    kind: 'slash' | 'thrust';
    t: number;
    dur: number;
    radius: number;
    color: string;
    flip: boolean;
}

/** 兵刃碰撞火花：两军近战交锋时在交界处产生的金属飞溅火星线 */
export interface WarSpark {
    x: number;
    y: number;
    vx: number;
    vy: number;
    t: number;
    dur: number;
    color: string;
    size: number;
}

/** 一次性 DE 攻击特效实例（2026-08-19 替换手绘火花粒子，独立生命周期不挂兵相位）。 */
export interface WarFx {
    type: string;   // FX_CFG 的 key
    x: number;
    y: number;
    dir: number;    // 8 向（单组特效取 0）
    t: number;      // 已播放时长（秒）
    dur: number;    // 总时长（秒）
    scale: number;  // 缩放
}

/** DE 特效单个方向素材（多向特效各方向 box/anchor 独立，紧致裁边）。 */
export interface FxDir {
    img: HTMLImageElement | null;
    n: number;
    fw: number;
    fh: number;
    hx: number;
    hy: number;
}

/** DE 特效缓存：单组 = 1 个方向，多向（炮口焰）= 8 个方向。 */
export interface FxAsset {
    dirs: FxDir[];
}

export interface WarCorpse {
    x: number;
    y: number;
    f: 0 | 1;
    key: string;
    dir: number;
    t: number;
    /**
     * 已烙标记：true = 已烙进地面（待移除）。corpses 里只剩「确定保留」的尸体，
     * 死亡动画播完即烙。留不留由 pushCorpse 在死亡时裁定。见 CORPSE_KEEP。
     */
    keep?: boolean;
}

/** 溃逃兵（不保留尸体的那部分）：反向移动 + 渐隐，模拟逃跑（主人 2026-08-16） */
export interface WarFleer {
    x: number; y: number;
    f: 0 | 1;
    key: string;
    dir: number;   // 逃跑朝向（背离战场）
    ph: number;    // 跑动动画相位
    t: number;     // 已逃跑时间
    vx: number;    // 逃跑速度向量
    vy: number;    // 逃跑速度向量
}

/** 帧素材缓存：key -> { fh, frames, sets: {move,atk,die,melee}[faction][dir] } */
export interface WarBank {
    /**
     * 这个兵种是否**真的有一套单独的近战动作**。
     * 🔴 只有它为真时，远程兵被贴脸才切近战姿态（st=2，不放弹丸）。
     */
    realMelee: boolean;
    /**
     * 该兵种**没有攻击动画**（攻击帧与待命帧是同一批图）。
     */
    noAttackAnim: boolean;
    /** 帧高（S10DB 所有动作共享同一帧框高度；DE 动态帧框不依赖此值，见 dyn） */
    fh: number;
    /**
     * 是否 DE 素材（走 _meta.json 动态帧框）。
     */
    isDE: boolean;
    /** 各动作的帧数（S10DB=8，AoE2 武士/弓手=30~60；缺失兜底 8） */
    frames: Record<string, number>;
    /** 抠绿 + SpriteTinter 染色后的帧带（[阵营][朝向]） */
    sets: Record<string, CanvasImageSource[][]>;
    /**
     * DE 动态帧框元数据（有此项 = 走 AoE2 DE 的 hotspot 对齐渲染，无此项 = S10DB 正方形帧）。
     */
    dyn?: Record<string, Record<string, { fw: number; fh: number; hx: number; hy: number }>>;
    /**
     * 🔴 [2026-09-09] 各动作在 AoE2 DE 里的真实时长（秒）= dat 的 frame_count × frame_duration
     */
    dur?: Record<string, number>;
}

export interface Scene13WarInit {
    /** 攻方文化区 */
    attackerRegion: string;
    /** 守方文化区 */
    defenderRegion: string;
    /** 攻方势力 id（取势力本色染色） */
    attackerFactionId: string | null;
    /** 守方势力 id（取势力本色染色） */
    defenderFactionId: string | null;
    /** 攻方武将 id（武将专属编制判断用，如秦及先秦统一雁行阵） */
    attackerGeneralId?: string | null;
    /** 守方武将 id（同上） */
    defenderGeneralId?: string | null;
    /** 攻方总兵力 */
    attackerTroops: number;
    /** 守方总兵力 */
    defenderTroops: number;
    /** [2026-08-11] 每兵总加成（八环战力比除掉兵力后的部分，作用在伤害上）；缺省 1 = 无加成 */
    attackerBonus?: number;
    defenderBonus?: number;
    /** 战场中心坐标（由 GameAppCombatHooks 传入；P2 地形 biome 判定用） */
    centerLat?: number;
    centerLng?: number;
    /** 攻方战略地图来向坐标（出兵点八方向计算） */
    attackerFromLat?: number;
    attackerFromLng?: number;
    /** 守方战略地图来向坐标（出兵点八方向计算） */
    defenderFromLat?: number;
    defenderFromLng?: number;
    /** 攻防战守方据点坐标，仅供环境层判定该城是否临水。 */
    defenderCityLat?: number;
    defenderCityLng?: number;
    /** [军事科技] 当前年份 getter（由 GameAppCombatHooks 注入；战斗跨年时刷新科技分表） */
    getYear?: () => number;
    /** [环境生成] 显式种子（测试用）；不传则从经纬度 + 双方势力/武将 id 派生 */
    environmentSeed?: string;
    /** [2026-08-21] 战斗类型：siege=攻城（守方守城，只攻方布出兵口建筑）、field=野战（双方都布）。缺省 'field'。 */
    battleType?: BattleType;
    /** 水军攻城战：战场左侧强制出海（主人 2026-08-24 定） */
    isNaval?: boolean;
    /** [2026-08-22] 攻城战守方城等级（big_city/medium_city/small_city/pass）——决定守城建筑池的时代。 */
    defenderCityType?: CityType | null;
    /** [2026-08-24] 攻城战守方据点 cityId（名城挂世界奇观：守方城中央立奇观地标）。 */
    defenderCityId?: string | null;
    /** [2026-09-12] 剧本战斗标题（`fieldBattleData.title`，如「伊苏斯战役」）；战斗面板大标题直接用它。 */
    title?: string | null;
    /** [2026-08-31 主人定] 跟随军团在守方侧（回援守城）→ 攻守两侧左右对调，让跟随军团固定在屏幕左边。 */
    followedOnDefenderSide?: boolean;
    /** [2026-09-19] 攻方精锐番号（如「土默特精骑」） */
    attackerEliteName?: string | null;
    /** [2026-09-19] 守方精锐番号（如「东平镇营」） */
    defenderEliteName?: string | null;
    /** [2026-09-20 主人需求] 关隘城门大山自定义配置 */
    passMountainConfig?: PassMountainConfig;
    /** [2026-10-02 主人定] 战役战斗过程播报（进入战术模式后，等行军播报结束完毕才能播放；只描述战斗过程、不说结果） */
    battleBriefing?: string | null;
}

export interface PassMountainConfig {
    enabled?: boolean;
    asset?: string;
    x?: number;
    y?: number;
    scale?: number;
    flip?: boolean;
    northAsset?: string;
    northX?: number;
    northY?: number;
    northScale?: number;
    northFlip?: boolean;
}
