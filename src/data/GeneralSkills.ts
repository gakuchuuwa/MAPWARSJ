/**
 * 武将技数据（格号 = 机制真理，displayName = 展示皮肤）
 * 设计文档：docs/02-design/GENERAL_SKILLS_武将技系统.md
 */

export type GeneralTier = 'famous' | 'ordinary';

export type TacticalTiming = 'opening' | 'comeback';

export type TacticalEffect =
    | 'ally_add_troops'
    | 'enemy_sub_troops'
    | 'ally_mult_1_2'
    | 'enemy_mult_0_8'
    | 'ally_invincible';

export type StrategicEffect =
    | 'march_speed_mult'
    | 'post_battle_troop_pct'
    | 'siege_power_mult'
    | 'field_power_mult'
    | 'plain_power_mult'
    | 'mountain_power_mult'
    | 'water_power_mult';

export interface TacticalSkillDef {
    id: string;
    grid: string;
    displayName: string;
    timing: TacticalTiming;
    effect: TacticalEffect;
    magnitude: number;
}

export interface StrategicSkillDef {
    id: string;
    grid: string;
    displayName: string;
    effect: StrategicEffect;
    magnitude: number;
}

export interface GeneralProfile {
    generalId: string;
    tier: GeneralTier;
    tacticalSkillId: string;
    /** 仅名将；普将省略 */
    strategicSkillId?: string;
}

/** 战术十格 */
export const TACTICAL_SKILL_CATALOG: Record<string, TacticalSkillDef> = {
    tac_01: { id: 'tac_01', grid: '①', displayName: '以逸待劳', timing: 'opening', effect: 'ally_add_troops', magnitude: 0.15 },
    tac_02: { id: 'tac_02', grid: '②', displayName: '避实击虚', timing: 'opening', effect: 'enemy_sub_troops', magnitude: 0.15 },
    tac_03: { id: 'tac_03', grid: '③', displayName: '侵掠如火', timing: 'opening', effect: 'ally_mult_1_2', magnitude: 1.2 },
    tac_04: { id: 'tac_04', grid: '④', displayName: '不战而屈', timing: 'opening', effect: 'enemy_mult_0_8', magnitude: 0.8 },
    tac_05: { id: 'tac_05', grid: '⑤', displayName: '不动如山', timing: 'opening', effect: 'ally_invincible', magnitude: 3 },
    tac_06: { id: 'tac_06', grid: '⑥', displayName: '哀兵必胜', timing: 'comeback', effect: 'ally_add_troops', magnitude: 0.15 },
    tac_07: { id: 'tac_07', grid: '⑦', displayName: '攻其不备', timing: 'comeback', effect: 'enemy_sub_troops', magnitude: 0.15 },
    tac_08: { id: 'tac_08', grid: '⑧', displayName: '置之死地', timing: 'comeback', effect: 'ally_mult_1_2', magnitude: 1.2 },
    tac_09: { id: 'tac_09', grid: '⑨', displayName: '釜底抽薪', timing: 'comeback', effect: 'enemy_mult_0_8', magnitude: 0.8 },
    tac_10: { id: 'tac_10', grid: '⑩', displayName: '深沟高垒', timing: 'comeback', effect: 'ally_invincible', magnitude: 3 },
};

/** 战略七格 */
export const STRATEGIC_SKILL_CATALOG: Record<string, StrategicSkillDef> = {
    str_01: { id: 'str_01', grid: 'S①', displayName: '兵贵神速', effect: 'march_speed_mult', magnitude: 1.2 },
    // S② 空出：原「因粮于敌」非战略技，已移为远征军系统技（见 EXPEDITION_FORAGE_SKILL）
    str_03: { id: 'str_03', grid: 'S③', displayName: '攻城拔寨', effect: 'siege_power_mult', magnitude: 1.2 },
    str_04: { id: 'str_04', grid: 'S④', displayName: '所向披靡', effect: 'field_power_mult', magnitude: 1.2 },
    str_05: { id: 'str_05', grid: 'S⑤', displayName: '长驱直入', effect: 'plain_power_mult', magnitude: 1.2 },
    str_06: { id: 'str_06', grid: 'S⑥', displayName: '居高临下', effect: 'mountain_power_mult', magnitude: 1.2 },
    str_07: { id: 'str_07', grid: 'S⑦', displayName: '乘风破浪', effect: 'water_power_mult', magnitude: 1.2 },
};

/**
 * 远征军系统技：胜后「因粮于敌」补兵（远征断粮、就食于敌）。
 * 仅远征军（army.expeditionTargetCityId）享；**非战略格 / 非战术格**，独立系统技，不占名将技格。
 */
export interface ExpeditionSystemSkillDef {
    id: string;
    displayName: string;
    effect: 'post_battle_troop_pct';
    magnitude: number;
}
export const EXPEDITION_FORAGE_SKILL: ExpeditionSystemSkillDef = {
    id: 'sys_exp_yinliang',
    displayName: '因粮于敌',
    effect: 'post_battle_troop_pct',
    magnitude: 0.12,
};

/** 守军系统技 effect（非战术十格 / 战略七格） */
export type GarrisonSystemEffect = 'pass_garrison_mult';

export interface GarrisonSystemSkillDef {
    id: string;
    displayName: string;
    effect: GarrisonSystemEffect;
    magnitude: number;
}

/**
 * 关隘守军系统技：type===pass 据点城防再 ×1.2
 * magnitude 须与 GameConfig.CULTURE_COMBAT.PASS_GARRISON_MULT 一致
 */
export const PASS_GARRISON_DEFENSE_SKILL: GarrisonSystemSkillDef = {
    id: 'garr_pass_juxian',
    displayName: '拒险而战',
    effect: 'pass_garrison_mult',
    magnitude: 1.2,
};

/** 援军系统技：编入战场时掷定 [luckMin, luckMax]（与 GameConfig.COMBAT.LUCK_MIN/MAX 须一致） */
export type ReinforcementSystemEffect = 'reinforcement_join_luck';

export interface ReinforcementJoinSkillDef {
    id: string;
    displayName: string;
    effect: ReinforcementSystemEffect;
    luckMin: number;
    luckMax: number;
}

export const REINFORCEMENT_JOIN_SKILL: ReinforcementJoinSkillDef = {
    id: 'sys_reinf_hebing',
    displayName: '合兵一处',
    effect: 'reinforcement_join_luck',
    luckMin: 0.8,
    luckMax: 1.2,
};

/** 将领装配表 */
export const GENERAL_PROFILES: Record<string, GeneralProfile> = {
    baiqi: {
        generalId: 'baiqi',
        tier: 'famous',
        tacticalSkillId: 'tac_03', // ③ 侵掠如火
        strategicSkillId: 'str_03', // S③ 攻城拔寨
    },
    lishimin: {
        generalId: 'lishimin',
        tier: 'famous',
        tacticalSkillId: 'tac_03', // ③ 侵掠如火（玄甲骑冲锋）
        strategicSkillId: 'str_04', // S④ 所向披靡（虎牢关野战）
    },
    direnjie: {
        generalId: 'direnjie',
        tier: 'ordinary',
        tacticalSkillId: 'tac_10', // ⑩ 深沟高垒（固守不破）
    },
    zhudi: {
        generalId: 'zhudi',
        tier: 'famous',
        tacticalSkillId: 'tac_03', // ③ 侵掠如火（神机营火器+五军营冲锋）
        strategicSkillId: 'str_01', // S① 兵贵神速（五征漠北急行军）
    },
    lisheng: {
        generalId: 'lisheng',
        tier: 'ordinary',
        tacticalSkillId: 'tac_09', // ⑨ 釜底抽薪（徐知诰代吴建唐）
    },
    liulong: {
        generalId: 'liulong',
        tier: 'ordinary',
        tacticalSkillId: 'tac_08', // ⑧ 置之死地（割据岭南，残暴治国）
    },
    wangping: {
        generalId: 'wangping',
        tier: 'ordinary',
        tacticalSkillId: 'tac_10', // ⑩ 深沟高垒（镇守汉中，无当飞军）
    },
    anuluvtuo: {
        generalId: 'anuluvtuo',
        tier: 'famous',
        tacticalSkillId: 'tac_03', // ③ 侵掠如火（战象冲锋，统一缅甸）
        strategicSkillId: 'str_04', // S④ 所向披靡（蒲甘王朝缔造）
    },
    machao: {
        generalId: 'machao',
        tier: 'ordinary',
        tacticalSkillId: 'tac_08', // ⑧ 置之死地（潼关复仇，凉州突骑）
    },
    baiba: {
        generalId: 'baiba',
        tier: 'ordinary',
        tacticalSkillId: 'tac_06', // ⑥ 哀兵必胜（班超所立，孤悬西域）
    },
    lunqinling: {
        generalId: 'lunqinling',
        tier: 'famous',
        tacticalSkillId: 'tac_03', // ③ 侵掠如火（大非川歼灭唐军十万）
        strategicSkillId: 'str_06', // S⑥ 居高临下（青藏高原主场）
    },
    chengjisihan: {
        generalId: 'chengjisihan',
        tier: 'famous',
        tacticalSkillId: 'tac_03', // ③ 侵掠如火（蒙古铁骑摧枯拉朽）
        strategicSkillId: 'str_01', // S① 兵贵神速（闪电征服欧亚）
    },
    dazuorong: {
        generalId: 'dazuorong',
        tier: 'famous',
        tacticalSkillId: 'tac_03', // ③ 侵掠如火（天门岭败唐立国）
        strategicSkillId: 'str_06', // S⑥ 居高临下（长白山脉主场）
    },
    jiangganzan: {
        generalId: 'jiangganzan',
        tier: 'famous',
        tacticalSkillId: 'tac_03', // ③ 侵掠如火（龟州大捷水攻破契丹十万）
        strategicSkillId: 'str_04', // S④ 所向披靡（高丽抗辽决战）
    },
    zulijunshi: {
        generalId: 'zulijunshi',
        tier: 'famous',
        tacticalSkillId: 'tac_03', // ③ 侵掠如火（建武新政讨幕）
        strategicSkillId: 'str_04', // S④ 所向披靡（室町幕府开创）
    },
    tiemuer: {
        generalId: 'tiemuer',
        tier: 'famous',
        tacticalSkillId: 'tac_03', // ③ 侵掠如火（重装骑兵横扫中亚）
        strategicSkillId: 'str_01', // S① 兵贵神速（闪电征服波斯印度）
    },
    nalixuan: {
        generalId: 'nalixuan',
        tier: 'famous',
        tacticalSkillId: 'tac_03', // ③ 侵掠如火（象战决斗击杀缅甸王储）
        strategicSkillId: 'str_04', // S④ 所向披靡（复国独立战争）
    },
    fuhao: {
        generalId: 'fuhao',
        tier: 'famous',
        tacticalSkillId: 'tac_03', // ③ 侵掠如火（征鬼方羌方，甲骨文十战）
        strategicSkillId: 'str_04', // S④ 所向披靡（商朝第一女将）
    },
    lvbu: {
        generalId: 'lvbu',
        tier: 'ordinary',
        tacticalSkillId: 'tac_08', // ⑧ 置之死地（辕门射戟，并州狼骑）
    },
    hanxin: {
        generalId: 'hanxin',
        tier: 'famous',
        tacticalSkillId: 'tac_03', // ③ 侵掠如火（背水一战，暗度陈仓）
        strategicSkillId: 'str_04', // S④ 所向披靡（兵仙灭楚）
    },
    wuqi: {
        generalId: 'wuqi',
        tier: 'famous',
        tacticalSkillId: 'tac_03', // ③ 侵掠如火（魏武卒横扫诸侯）
        strategicSkillId: 'str_04', // S④ 所向披靡（战国兵家亚圣）
    },
    nuerhachi: {
        generalId: 'nuerhachi',
        tier: 'famous',
        tacticalSkillId: 'tac_03', // ③ 侵掠如火（八旗铁骑萨尔浒大捷）
        strategicSkillId: 'str_04', // S④ 所向披靡（统一女真建国后金）
    },
    jinyixin: {
        generalId: 'jinyixin',
        tier: 'famous',
        tacticalSkillId: 'tac_03', // ③ 侵掠如火（花郎精神统一三韩）
        strategicSkillId: 'str_04', // S④ 所向披靡（新罗统一战争）
    },
    benduozhongsheng: {
        generalId: 'benduozhongsheng',
        tier: 'ordinary',
        tacticalSkillId: 'tac_10', // ⑩ 深沟高垒（百战无伤，德川四天王）
    },
    sangjiaer: {
        generalId: 'sangjiaer',
        tier: 'famous',
        tacticalSkillId: 'tac_03', // ③ 侵掠如火（古拉姆禁卫军）
        strategicSkillId: 'str_04', // S④ 所向披靡（大塞尔柱末代雄主）
    },
    suyebamo: {
        generalId: 'suyebamo',
        tier: 'famous',
        tacticalSkillId: 'tac_03', // ③ 侵掠如火（双弓弩象营）
        strategicSkillId: 'str_04', // S④ 所向披靡（吴哥窟缔造者）
    },
    menggong: {
        generalId: 'menggong',
        tier: 'famous',
        tacticalSkillId: 'tac_03', // ③ 侵掠如火（御前诸军灭金抗蒙）
        strategicSkillId: 'str_04', // S④ 所向披靡（南宋最后的名将）
    },
};

export function getGeneralProfile(generalId: string | undefined): GeneralProfile | null {
    if (!generalId) return null;
    return GENERAL_PROFILES[generalId] ?? null;
}

export function getTacticalSkillDef(skillId: string): TacticalSkillDef | null {
    return TACTICAL_SKILL_CATALOG[skillId] ?? null;
}

export function getStrategicSkillDef(skillId: string): StrategicSkillDef | null {
    return STRATEGIC_SKILL_CATALOG[skillId] ?? null;
}
