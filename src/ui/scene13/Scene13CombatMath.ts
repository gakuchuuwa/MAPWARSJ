import type { WarType } from '../../data/WarTypes';
import type { WarBuilding, WarMan } from './Scene13Types';

/** 🔴 [2026-08-29] 建筑/塔/城门「残骸」倒塌动画总时长（秒）：DESTR 帧铺满，播完切 rubble。
 *  🔴 [2026-09-12 主人定「改为一致」] 原 1.4 秒（≈35.7fps）比 DE 快约 6 倍——
 *  DE 实测（dat graphic 表）frame_duration=0.0833s/帧 × 100 帧 = **8.33 秒**（≈12fps）。
 *  改 8.33 对齐 DE 的坍塌速度。 */
export const COLLAPSE_ANIM_DUR = 8.33;

export const HERO_ATTACK_RATE = 2.0;
export const HERO_HP_MULT = 3.0;
export const HERO_DAMAGE_TAKEN = 0.3;

/**
 * 单次出手伤害（纯 DE 公式）：max(1, 攻 + 加成伤害 − 近防/远防)。
 */
export function dmgVs(shooter: WarType, target: WarType): number {
    const armor = shooter.dmgType === 'melee' ? target.meleeArmor : target.pierceArmor;
    let bonus = 0;
    if (shooter.bonus && target.armorTags) {
        // DE empires2_x2_p1.dat 护甲类 11(建筑)专属护甲：加固墙 24、城门 20、石墙 16、城堡 8
        const arm11 = target.name === '加固城墙' ? 24
            : (target.name === '城门' || target.name === '加固城门') ? 20
                : target.name === '石墙' ? 16
                    : target.name.includes('CASTLE') ? 8 : 0;
        for (const tag of target.armorTags) {
            if (shooter.bonus[tag]) bonus += Math.max(0, shooter.bonus[tag] - (tag === 11 ? arm11 : 0));
        }
    }
    return Math.max(1, shooter.atk + bonus - armor);
}

/** DE 胡斯战车的 5 发次级弹：每发独立以 3 攻击、建筑 +3、冲车 +3 结算。 */
export const HUSSITE_SECONDARY_SHOT: WarType = {
    name: '胡斯战车次级弹', cls: 'ranged', sz: 1, hp: 1, atk: 3,
    meleeArmor: 0, pierceArmor: 0, rng: 0, reload: 1, spd: 0,
    dmgType: 'pierce', bonus: { 11: 3, 17: 3 }, armorTags: [],
};

/**
 * 单兵绘制尺寸（px）。
 * 实际缩放 = UNIT_PX / 64。
 */
export const UNIT_PX = 64;

/**
 * 落点散开半径（px）——每个兵出生时分到一个**固定**偏移，终身不变。
 */
export const AIM_JITTER = 120;

/**
 * 追击时绕着目标散开的半径（px）——治「一群兵冲着同一个点挤成团、来回颤抖」。
 */
export const CHASE_RING = 45;

/**
 * 🔴 **两道闸当前是「只观察、不动手」**
 */
export const STALL_GUARD_ENFORCE = false;

export const MELEE_QUIET_SEC = 2.5;
export const NO_KILL_SEC = 60;
export const HARD_STOP_SEC = 600;
/** 🔴 [2026-10-12 主人令] 一场战斗最长 5 分钟，到点未分胜负攻方输 */
export const BATTLE_LIMIT_SEC = 300;
/** 🔴 [2026-10-15 主人令「现在的建筑被击毁的又太快了，我觉得应该给每个建筑一个基础被摧毁保底时间」] */
export const BLD_MIN_DESTROY_BASE = 8;
export const BLD_MIN_DESTROY_PER_SIDE = 4;

/** 流场细分：每个等轴地块切成 FLOW_SUB×FLOW_SUB 小格 */
export const FLOW_SUB = 2;
/** 🔴 [2026-10-14 主人令「城内守军加防御，选1，先试20%」] 险要（关隘）守军站在城墙圈里时受到的伤害倍率（＝减伤 20%）。 */
export const PASS_INSIDE_DAMAGE_TAKEN = 0.8;
/** 🔴 [2026-10-14 主人令「两条都做」→「残兵应该是按每队算」] 一队剩余兵力（本队后备＋场上）不到本队开局的这个比例 ⇒ 这一队的残兵全图找最近的敌人（见 aimAt）。 */
export const REMNANT_FRAC = 0.05;
/** 🔴 [2026-10-14 主人令「背靠是有点小距离，不是紧挨着」] 城外列阵：守方最后一排最后一人离城墙外缘的空隙（px） */
export const DEF_WALL_GAP = 40;
/** 🔴 [2026-10-14] 守方城外列阵时，两军最前沿之间至少留的空地（px） */
export const SIEGE_FIELD_GAP = 1000;

// ── 场景云装饰（三国群英传素材，`云/9..10.png`，927×817 大朵积云）──
export const CLOUD_BASE_URL = '/sanguoqunying/云/';
export const CLOUD_FILES = [9, 10];
export const CLOUD_COUNT_MIN = 1;
export const CLOUD_COUNT_MAX = 2;
export const CLOUD_SCALE_MAX = 1.0;
export const CLOUD_SCALE_MIN = 1.0;
export const CLOUD_SPD_MIN = 6;
export const CLOUD_SPD_MAX = 16;
export const CLOUD_ALPHA_MIN = 0.30;
export const CLOUD_ALPHA_MAX = 0.55;

/** DE 自然装饰（树/灌木/岩石/山体/贴花）素材目录 */
export const NATURE_BASE_URL = '/SUCAI_NATURE/';
/** DE 出兵口军事建筑（营帐/堡垒，`public/SUCAI_BUILDING/`）素材目录 */
export const BUILDING_BASE_URL = '/SUCAI_BUILDING/';
export const BATTLEFIELD_BASE_URL = '/SUCAI_BATTLEFIELD/';
export const ANIMAL_BASE_URL = '/SUCAI_ANIMAL/';
export const MAPDATA_DIR = '/battlefields/';
export const FALLBACK_MAPDATA_URL = '/scratch/rms-out/mapdata_vienna_danube_120.json';

export const SIDE_CAP = 500;
export const TRIGGER = 250;
export const SPRITE_TROOPS = 20;
export const CORPSE_KEEP = 0.4;
export const FLEE_SPD = 150;
export const FLEE_DUR = 4.0;
export const FLAG_EVERY = 20;
export const FLAG_SCALE = 1.0;
export const FLAG_FALL = 1.2;
export const FLAG_POLE_RATIO = 0.8;
export const FLAG_POLE_LIFT = 0.4;
export const BATCH_COOLDOWN = 2;
export const FADE_IN = 0.5;
export const DEPLOY_SECS = 2.5;
export const DEPLOY_FADE = 2.0;
export const ARRIVE_EPS = 8;
export const MARCH_REL = 360;
export const LANE_REGROUP_SEC = 1.0;
export const LANE_TRACK_EPS = 1;
export const LANE_W = 6;
export const MARCH_R = 450;
export const CHARGE_CYCLE = 8;
export const GANG_K = 0.15;
export const GANG_CAP = 3;
export const SPREAD_CAP = GANG_CAP + 1;
export const SEP_DIST = 17;
export const ZORDER_EPS = 4;
export const SEP_SMOOTH = 0.15;
export const SEP_SPD = 120;
export const SEP_FIGHT = 0.5;
/** 🔴 [2026-10-20 主人令「两军交战总是拥挤在一起，能不能展开战斗」] 野战阵位拴绳：士兵横向最多离开自己出生槽位多远（px） */
export const LEASH_LAT = 120;
export const CELL_S = 20;
export const STUCK_IDLE_SEC = 0.3;
export const NET_STUCK_WINDOW = 0.25;
export const SLIDE_RATE = 0.8;
export const SLIDE_W = 0.4;
export const KEEP_TARGET_HP = 0.5;
export const KITE_RETREAT_DIST = 100;
export const KITE_SAFE = 70;
export const KITE_RETREAT_CAP = 300;
export const ATTRITION_START_SEC = 60;
export const ATTRITION_RAMP_SEC = 45;
export const ATTRITION_CAP = 4.0;
export const HKEY = (gx: number, gy: number): number => (gx + 4096) * 8192 + (gy + 4096);
export const CELL_M = 80;
export const CELL_R = 220;

/** 围殴加成：被 N 人同时攻击的人受伤 ×(1 + K×min(N-1, CAP))。见 GANG_K 处的长注释 */
export function gangMul(victim: WarMan | WarBuilding): number {
    return 1 + GANG_K * Math.min(GANG_CAP, Math.max(0, victim.atkers - 1));
}

/* ── 【迎面拒马】长枪/方阵类兵种正面顶住骑兵（2026-09-12 主人定「先做1试试」）──────────── */
export const PIKE_BRACE_ENABLED = true;
export const PIKE_BRACE_FRONT_DEG = 60;   // 「正面」扇区半角（度）
export const PIKE_BRACE_TAKEN = 0.5;      // 骑兵正面撞枪林时，这一击的伤害倍率（0.5 = 减半）

/** 长枪类：DE 护甲类 27（长枪）**或** 对骑兵(护甲类 8)有实质加成。两种写法都只认数据、不认名字。导出=供离线自检 */
export function isPikeBraceType(t: WarType | null | undefined): boolean {
    if (!t) return false;
    if (t.armorTags?.includes(27)) return true;
    return (t.bonus?.[8] ?? 0) >= 6;
}
/** 骑兵类：class 为 cav，或护甲类含 8（DE 骑兵类，战象亦归此类）。导出=供离线自检 */
export function isCavalryType(t: WarType | null | undefined): boolean {
    if (!t) return false;
    return t.cls === 'cav' || t.armorTags?.includes(8) === true;
}
/** 8 向朝向 → 方位角（度）。与 dir8() 的映射互逆：dir1=E(0°) dir0=NE(45°) dir7=N(90°) dir5=W(180°) …。导出=供离线自检 */
export function faceAngleDeg(dir: number): number {
    return ((((9 - dir) % 8) + 8) % 8) * 45;
}
/** 攻击者方位与该单位正面的夹角（0~180°）。0=正前方、90=正侧面、180=正后方。
 *  dx,dy = 攻击者相对该单位的位移，屏幕坐标 +y 向下。导出=供离线自检 */
export function attackArcDeg(dir: number, dx: number, dy: number): number {
    const bearing = ((Math.atan2(-dy, dx) * 180 / Math.PI) % 360 + 360) % 360;
    const d = Math.abs(bearing - faceAngleDeg(dir));
    return Math.min(d, 360 - d);
}
/** 攻击者是否落在该单位正面扇区内（dx,dy = 攻击者相对该单位的位移，屏幕坐标 +y 向下）。导出=供离线自检 */
export function inFrontArc(dir: number, dx: number, dy: number, halfDeg: number): boolean {
    return attackArcDeg(dir, dx, dy) <= halfDeg;
}

/* ── 【侧击·背击】绕到侧后打，这一刀更重（2026-09-17 主人定「先做背击判定这一条」）──────── */
export const FLANK_ENABLED = true;
export const FLANK_FRONT_DEG = 60;    // 正面扇区半角（度）：≤ 此角 = 正面，无加成
export const FLANK_REAR_DEG = 120;    // 背后起始夹角（度）：≥ 此角 = 背后
export const FLANK_SIDE_MUL = 1.15;   // 侧面受击伤害倍率
export const FLANK_REAR_MUL = 1.4;    // 背后受击伤害倍率

/** 侧背击伤害倍率：按受害者朝向 dir 与攻击者相对位移，返回 1 / FLANK_SIDE_MUL / FLANK_REAR_MUL。导出=供离线自检 */
export function flankMulOf(dir: number, dx: number, dy: number): number {
    const a = attackArcDeg(dir, dx, dy);
    if (a >= FLANK_REAR_DEG) return FLANK_REAR_MUL;
    if (a > FLANK_FRONT_DEG) return FLANK_SIDE_MUL;
    return 1;
}
