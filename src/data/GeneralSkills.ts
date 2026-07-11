/**
 * 武将技数据（格号 = 机制真理，displayName = 展示皮肤）
 * 战术技 v1 全表：src/data/TacticalSkillCatalog.ts（49 条定稿）
 * 条件解析：src/combat/TacticalSkillResolver.ts
 * 设计文档：docs/02-design/GENERAL_SKILLS_武将技系统.md
 * AI 分配标签：src/data/GeneralSkillTags.ts（品阶 + 五种战术风格）
 *
 * 战略 S①–S⑧（仅名将，与战术技混搭）；战术 ①–⑩ 名将/普将通用：
 *   ①–⑤开局放（opening），⑥–⑩降至 60% 兵力放（comeback）；时机由 skill.timing 决定，与品阶无关。
 *   名将 = 战略技 + 战术技；普将 = 仅战术技。
 */

export type GeneralTier = 'famous' | 'ordinary';

export type TacticalTiming = 'opening' | 'comeback';

export type TacticalEffect =
    | 'ally_add_troops'
    | 'enemy_sub_troops'
    | 'ally_mult_1_2'
    | 'enemy_mult_0_8'
    | 'ally_invincible'
    | 'ally_casualty_reduce'
    | 'ally_luck_up'
    | 'enemy_luck_down'
    | 'ally_luck_lock'
    | 'ally_recovery'
    | 'lose_effect'
    | 'ally_elite_casualty'
    | 'enemy_counter'
    | 'opening_counter'
    | 'terrain_counter'
    | 'ally_recompute';

export type StrategicEffect =
    // ── 军团攻 ──
    | 'attacker_power_mult'       // 攻方战力乘区（所向披靡）
    | 'advantage_skill_effect_mult'   // 优势时战术技效果 ×1.3（威震华夏）
    | 'disadvantage_power_mult'       // 劣势时自身战力 ×1.4（以寡击众）
    // ── 军团速 ──
    | 'march_speed_mult'          // 全局提速
    | 'mountain_march_immunity'   // 山地按平原速度
    | 'ignore_small_city_zoc'     // 无视小城 ZOC
    | 'skip_post_battle_rest'     // 胜后免休整（乘胜追击，连续行军节奏）
    // ── 补给 ──
    | 'field_resupply'            // 远离本土缓回血
    | 'post_battle_troop_pct'     // 胜后就食补员
    // ── 据点兵 ──
    | 'city_growth_mult'          // 出身城增长 ×2
    | 'recruit_cooldown_mult'     // 征兵冷却减半
    // ── 据点防 ──
    | 'garrison_defense_mult'     // 守城城防战力 ×1.3（1.5 顶 luck 帽=等兵力必守住，2026-07-11 降档）
    | 'siege_attacker_supply_halved' // 攻城方缓回血减半
    // ── 奇策 ──
    | 'post_battle_recruit_enemy_pct' // 胜后缴获敌残兵
    | 'terrain_tactical_double'       // 地形匹配时战术技翻倍
    // ── 退役 effect（S④⑤⑥⑧ 条目已删；类型保留至 Step2 清理引擎 switch 后移除）──
    | 'defender_power_mult'
    | 'plain_power_mult'
    | 'mountain_power_mult'
    | 'water_power_mult';

import { getTacticalSkillEntry } from './TacticalSkillCatalog';

export interface TacticalSkillDef {
    id: string;
    grid: string;
    displayName: string;
    timing: TacticalTiming;
    effect: TacticalEffect;
    magnitude: number;
    /** 一次性技能（加兵/减兵/无敌），每场每侧仅触发一次；乘区技（×1.2/×0.8）为 false，每帧重算 */
    isOncePerBattle?: boolean;
    /** ⑤⑩免伤技附带的己方掷点加成（不设则纯视觉免伤，不影响胜负） */
    rollEdge?: number;
}

export interface StrategicSkillDef {
    id: string;
    grid: string;
    displayName: string;
    effect: StrategicEffect;
    magnitude: number;
    /** 引擎接线状态：ready=真实生效；new=数据就位、Step2 接引擎前不生效（诚实标注，audit 依赖） */
    engineStatus: 'ready' | 'new';
    /**
     * 隐藏胜后续航： **军团速**（str_01/10/11/12）、**威震华夏**（str_04）附带；
     * **据点兵**（str_14/15）与 **据点防** 不含——守备向不配远征续航。
     * 胜后按自身当前兵 × 此比例静默补血；与 str_07 因粮于敌（1% 可见）相比为半效 0.5%。
     */
    hiddenPostBattlePct?: number;
    note?: string;
}

export interface GeneralProfile {
    generalId: string;
    tier: GeneralTier;
    tacticalSkillId: string;
    /** 仅名将；普将省略 */
    strategicSkillId?: string;
    /** 三势适性·优势局技（我强敌弱时放）；未配则开局回退 tacticalSkillId */
    advantageSkillId?: string;
    /** 三势适性·均势局技（旗鼓相当时放）；未配则回退 tacticalSkillId */
    balanceSkillId?: string;
    /** 三势适性·劣势局技（敌强我弱时放）；未配则回退 tacticalSkillId */
    disadvantageSkillId?: string;
    /** 三势天赋：造势create / 借势leverage / 逆势reverse（③整合·势×局适性系数表用） */
    aptitude?: 'create' | 'leverage' | 'reverse';
}

/** 战术十格 */
export const TACTICAL_SKILL_CATALOG: Record<string, TacticalSkillDef> = {
    // 【2026-07-03】①以逸待劳改为「己方有效战力×1.2」（原 ally_add_troops +20%真实兵会让满编名将军团越打越滚越多）。
    //   现与③侵掠如火同机制（掷色乘区，不写真实兵力）：≈×1.2≈85% 胜率、与②④⑤同档，且零兵力膨胀。
    tac_01: { id: 'tac_01', grid: '①', displayName: '以逸待劳', timing: 'opening', effect: 'ally_mult_1_2', magnitude: 1.2 },
    tac_02: { id: 'tac_02', grid: '②', displayName: '避实击虚', timing: 'opening', effect: 'enemy_sub_troops', magnitude: 0.167, isOncePerBattle: true },
    tac_03: { id: 'tac_03', grid: '③', displayName: '侵掠如火', timing: 'opening', effect: 'ally_mult_1_2', magnitude: 1.2 },
    tac_04: { id: 'tac_04', grid: '④', displayName: '不战而屈', timing: 'opening', effect: 'enemy_mult_0_8', magnitude: 0.833 },
    tac_05: { id: 'tac_05', grid: '⑤', displayName: '不动如山', timing: 'opening', effect: 'ally_invincible', magnitude: 3, rollEdge: 1.2, isOncePerBattle: true },
    tac_06: { id: 'tac_06', grid: '⑥', displayName: '哀兵必胜', timing: 'comeback', effect: 'ally_add_troops', magnitude: 0.12, isOncePerBattle: true },
    tac_07: { id: 'tac_07', grid: '⑦', displayName: '攻其不备', timing: 'comeback', effect: 'enemy_sub_troops', magnitude: 0.167, isOncePerBattle: true },
    tac_08: { id: 'tac_08', grid: '⑧', displayName: '置之死地', timing: 'comeback', effect: 'ally_mult_1_2', magnitude: 1.2, isOncePerBattle: true },
    tac_09: { id: 'tac_09', grid: '⑨', displayName: '釜底抽薪', timing: 'comeback', effect: 'enemy_mult_0_8', magnitude: 0.833, isOncePerBattle: true },
    tac_10: { id: 'tac_10', grid: '⑩', displayName: '深沟高垒', timing: 'comeback', effect: 'ally_invincible', magnitude: 3, rollEdge: 1.2, isOncePerBattle: true },
};

/**
 * 战略技 v2（2026-07-10 重设计）：六系 15 技
 *   军团攻：str_03 所向披靡 / str_04 威震华夏 / str_09 以寡击众
 *   军团速：str_01 兵贵神速 / str_10 如履平地 / str_11 长驱深入 / str_12 乘胜追击
 *   补给 ：str_13 以战养战 / str_07 因粮于敌
 *   据点兵：str_14 足食足兵 / str_15 招兵买马
 *   据点防：str_08 固若金汤 / str_05 坚壁清野
 *   奇策 ：str_06 招降纳叛 / str_02 因地制宜
 */
export const STRATEGIC_SKILL_CATALOG: Record<string, StrategicSkillDef> = {
    // ── 军团攻 ──
    str_03: { id: 'str_03', grid: 'S③', displayName: '所向披靡', effect: 'attacker_power_mult', magnitude: 1.5, engineStatus: 'ready' },
    str_04: { id: 'str_04', grid: 'S④', displayName: '威震华夏', effect: 'advantage_skill_effect_mult', magnitude: 1.3, engineStatus: 'ready', hiddenPostBattlePct: 0.01, note: '优势时（兵力>1.5）战术技效果 ×1.3；隐藏胜后续航 1%' },
    str_09: { id: 'str_09', grid: 'S⑨', displayName: '以寡击众', effect: 'disadvantage_power_mult', magnitude: 1.4, engineStatus: 'ready', note: '劣势时（兵力<0.67）自身战力 ×1.4' },
    // ── 军团速 ──
    str_01: { id: 'str_01', grid: 'S①', displayName: '兵贵神速', effect: 'march_speed_mult', magnitude: 1.5, engineStatus: 'ready', hiddenPostBattlePct: 0.005, note: '隐藏胜后续航 0.5%（静默，不显示）' },
    str_10: { id: 'str_10', grid: 'S⑩', displayName: '如履平地', effect: 'mountain_march_immunity', magnitude: 1, engineStatus: 'ready', hiddenPostBattlePct: 0.005, note: '山地按平原速度走；隐藏胜后续航 0.5%' },
    str_11: { id: 'str_11', grid: 'S⑪', displayName: '长驱深入', effect: 'ignore_small_city_zoc', magnitude: 0.5, engineStatus: 'ready', hiddenPostBattlePct: 0.005, note: '50% 无视小城 ZOC；隐藏胜后续航 0.5%' },
    str_12: { id: 'str_12', grid: 'S⑫', displayName: '乘胜追击', effect: 'skip_post_battle_rest', magnitude: 0, engineStatus: 'ready', hiddenPostBattlePct: 0.005, note: '胜后休整时长置 0' },
    // ── 补给 ──
    str_13: { id: 'str_13', grid: 'S⑬', displayName: '以战养战', effect: 'field_resupply', magnitude: 1, engineStatus: 'ready', note: '远离本土缓回血' },
    str_07: { id: 'str_07', grid: 'S⑦', displayName: '因粮于敌', effect: 'post_battle_troop_pct', magnitude: 0.01, engineStatus: 'ready' },
    // ── 据点兵 ──
    str_14: { id: 'str_14', grid: 'S⑭', displayName: '足食足兵', effect: 'city_growth_mult', magnitude: 2, engineStatus: 'ready', note: '出身城每季补兵 ×2（活管线在 RecruitmentSystem 季度补驻军；CityManager.updateTroops 无调用方，勿再挂）' },
    str_15: { id: 'str_15', grid: 'S⑮', displayName: '招兵买马', effect: 'recruit_cooldown_mult', magnitude: 0.5, engineStatus: 'ready', note: '征兵冷却 ×0.5' },
    // ── 据点防 ──
    str_08: { id: 'str_08', grid: 'S⑧', displayName: '固若金汤', effect: 'garrison_defense_mult', magnitude: 1.3, engineStatus: 'ready', note: '守城时城防战力 ×1.3' },
    str_05: { id: 'str_05', grid: 'S⑤', displayName: '坚壁清野', effect: 'siege_attacker_supply_halved', magnitude: 0.5, engineStatus: 'ready', note: '攻城方在城外缓回血减半' },
    // ── 奇策 ──
    str_06: { id: 'str_06', grid: 'S⑥', displayName: '招降纳叛', effect: 'post_battle_recruit_enemy_pct', magnitude: 0.10, engineStatus: 'ready', note: '胜后缴获 10% 敌残兵' },
    str_02: { id: 'str_02', grid: 'S②', displayName: '因地制宜', effect: 'terrain_tactical_double', magnitude: 2.0, engineStatus: 'ready', note: '地形匹配时战术技效果翻倍' },
};

/** 守军系统技 effect（非战术十格 / 战略六格） */
export type GarrisonSystemEffect = 'pass_garrison_mult';

export interface GarrisonSystemSkillDef {
    displayName: string;
}

export const PASS_GARRISON_DEFENSE_SKILL: GarrisonSystemSkillDef = {
    displayName: '拒险而战',
};

/** 14 文化中心据点守军系统技（据险而守，与 PASS_GARRISON_DEFENSE_SKILL 同机制不同名）*/
export const REGION_CENTER_DEFENSE_SKILL: GarrisonSystemSkillDef = {
    displayName: '据险而守',
};

export type ReinforcementSystemEffect = 'reinforcement_join_luck';

export interface ReinforcementJoinSkillDef {
    displayName: string;
    luckMin: number;
    luckMax: number;
}

export const REINFORCEMENT_JOIN_SKILL: ReinforcementJoinSkillDef = {
    displayName: '合兵一处',
    luckMin: 0.8,
    luckMax: 1.2,
};

/**
 * 将领装配表
 * 分配依据：GeneralSkillTags.ts（战役证据 + 主风格优先）
 * 分布目标（2026-06-18 均化）：名将①–⑤各约 11–15；③侵掠如火 ≤15；④不战而屈极少
 * 注：S②攻城拔寨已并入 S③所向披靡（2026-06-27），原 str_02 将领统一改挂 str_03（进攻方专精）
 */
export const GENERAL_PROFILES: Record<string, GeneralProfile> = {
    wuzhou_d_wuzetian: { generalId: 'wuzhou_d_wuzetian', tier: 'ordinary', tacticalSkillId: 'ts_014', advantageSkillId: 'ts_010', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_016', aptitude: 'leverage' },
    qidan_shulvping: { generalId: 'qidan_shulvping', tier: 'ordinary', tacticalSkillId: 'ts_015', advantageSkillId: 'ts_392', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_016', aptitude: 'leverage' },
    guishuang_qiujiuque: { generalId: 'guishuang_qiujiuque', tier: 'famous', tacticalSkillId: 'ts_361', strategicSkillId: 'str_13', advantageSkillId: 'ts_361', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_041', aptitude: 'create' },
    // ── 中国及外围 ──
    hui_bunaihou: { generalId: 'hui_bunaihou', tier: 'ordinary', tacticalSkillId: 'ts_006', advantageSkillId: 'ts_401', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_006', aptitude: 'reverse' },
    xin_baiqi: { generalId: 'xin_baiqi', tier: 'famous', tacticalSkillId: 'ts_158', strategicSkillId: 'str_03', advantageSkillId: 'ts_158', balanceSkillId: 'ts_428', disadvantageSkillId: 'ts_429', aptitude: 'create' }, // 白起·人屠：伊阙破魏韩联军、长平破赵括，专破敌军名将统帅（擒贼擒王）
    qin_simacuo: { generalId: 'qin_simacuo', tier: 'famous', tacticalSkillId: 'ts_121', strategicSkillId: 'str_02', advantageSkillId: 'ts_121', balanceSkillId: 'ts_592', disadvantageSkillId: 'ts_593', aptitude: 'create' }, // S⑤居高临下 + ②避实击虚（越岭平蜀，奇袭楚国）
    qin_wangben: { generalId: 'qin_wangben', tier: 'famous', tacticalSkillId: 'ts_293', strategicSkillId: 'str_03', advantageSkillId: 'ts_293', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_045', aptitude: 'create' }, // S①兵贵神速 + ③侵掠如火（闪击燕齐，水淹大梁）
    qin_mengtian: { generalId: 'qin_mengtian', tier: 'ordinary', tacticalSkillId: 'ts_036', advantageSkillId: 'ts_392', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_036', aptitude: 'reverse' }, // S④长驱直入 + ①以逸待劳（北击匈奴，驻守长城）
    beidi_yaochang: { generalId: 'beidi_yaochang', tier: 'famous', tacticalSkillId: 'ts_190', advantageSkillId: 'ts_400', balanceSkillId: 'ts_190', disadvantageSkillId: 'ts_410', strategicSkillId: 'str_06', aptitude: 'create' },
    unassigned_simacuo: { generalId: 'unassigned_simacuo', tier: 'ordinary', tacticalSkillId: 'ts_024', advantageSkillId: 'ts_022', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_024', aptitude: 'reverse' }, // 前316年灭蜀苴巴
    tang_lishimin: { generalId: 'tang_lishimin', tier: 'famous', tacticalSkillId: 'ts_051', strategicSkillId: 'str_03', advantageSkillId: 'ts_051', balanceSkillId: 'ts_434', disadvantageSkillId: 'ts_435', aptitude: 'create' }, // 所向无前（天策破阵）
    unassigned_direnjie: { generalId: 'unassigned_direnjie', tier: 'ordinary', tacticalSkillId: 'ts_019', advantageSkillId: 'ts_390', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_019', aptitude: 'reverse' }, // 退突厥：间谍离间后反击
    pinghai_laihuer: { generalId: 'pinghai_laihuer', tier: 'famous', tacticalSkillId: 'ts_217', strategicSkillId: 'str_03', advantageSkillId: 'ts_217', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_019', aptitude: 'create' }, // 征东：水师突击平壤焚舰
    jianzhou_nvzhen_limanzhu: { generalId: 'jianzhou_nvzhen_limanzhu', tier: 'ordinary', tacticalSkillId: 'ts_037', advantageSkillId: 'ts_402', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_037', aptitude: 'reverse' }, // 建州：聚合诸部筑城自守
    unassigned_zhangliang: { generalId: 'unassigned_zhangliang', tier: 'ordinary', tacticalSkillId: 'ts_028', advantageSkillId: 'ts_028', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_045', aptitude: 'create' }, // 征东：唐水军渡海攻坚
    mushi_muchong: { generalId: 'mushi_muchong', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_410', aptitude: 'create' },
    lai_wangshifan: { generalId: 'lai_wangshifan', tier: 'ordinary', tacticalSkillId: 'ts_034', advantageSkillId: 'ts_003', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_034', aptitude: 'reverse' }, // 平卢：反朱温决死突击
    xiongding_murongyong: { generalId: 'xiongding_murongyong', tier: 'ordinary', tacticalSkillId: 'ts_033', advantageSkillId: 'ts_003', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_033', aptitude: 'reverse' },
    chanzhou_chairong: { generalId: 'chanzhou_chairong', tier: 'famous', tacticalSkillId: 'ts_147', strategicSkillId: 'str_14', advantageSkillId: 'ts_147', balanceSkillId: 'ts_481', disadvantageSkillId: 'ts_482', aptitude: 'create' }, // 澶州：周世宗亲征
    linhu_mafang: { generalId: 'linhu_mafang', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_033', aptitude: 'create' },
    xianyu_hanxin: { generalId: 'xianyu_hanxin', tier: 'famous', tacticalSkillId: 'ts_013', strategicSkillId: 'str_02', advantageSkillId: 'ts_424', balanceSkillId: 'ts_425', disadvantageSkillId: 'ts_013', aptitude: 'reverse' },
    shizhao_d_shihu: { generalId: 'shizhao_d_shihu', tier: 'famous', tacticalSkillId: 'ts_221', advantageSkillId: 'ts_221', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_723', strategicSkillId: 'str_06', aptitude: 'create' }, // 邺都：暴虐突袭
    unassigned_loufanwang: { generalId: 'unassigned_loufanwang', tier: 'ordinary', tacticalSkillId: 'ts_017', advantageSkillId: 'ts_049', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_017', aptitude: 'reverse' }, // 楼烦：亡部哀兵复起
    shanrong_lanyu: { generalId: 'shanrong_lanyu', tier: 'famous', tacticalSkillId: 'ts_220', strategicSkillId: 'str_01', advantageSkillId: 'ts_220', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_411', aptitude: 'create' },
    xie_xiefangde: { generalId: 'xie_xiefangde', tier: 'ordinary', tacticalSkillId: 'ts_143', advantageSkillId: 'ts_022', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_143', aptitude: 'reverse' }, // 信州：垒山筑寨据守抗元
    wan_liuyuan: { generalId: 'wan_liuyuan', tier: 'ordinary', tacticalSkillId: 'ts_336', advantageSkillId: 'ts_336', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_033', aptitude: 'create' }, // 刘源皖口
    huang_d_sunshuao: { generalId: 'huang_d_sunshuao', tier: 'famous', tacticalSkillId: 'ts_384', strategicSkillId: 'str_14', advantageSkillId: 'ts_028', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_384', aptitude: 'create' },
    wenzhou_zhangcong: { generalId: 'wenzhou_zhangcong', tier: 'ordinary', tacticalSkillId: 'ts_036', advantageSkillId: 'ts_009', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_036', aptitude: 'reverse' },
    qianzhong_wubayue: { generalId: 'qianzhong_wubayue', tier: 'ordinary', tacticalSkillId: 'ts_104', advantageSkillId: 'ts_021', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_104', aptitude: 'reverse' }, // 乾嘉：苗民决死破清军
    dangchang_liangmiding: { generalId: 'dangchang_liangmiding', tier: 'ordinary', tacticalSkillId: 'ts_099', advantageSkillId: 'ts_029', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_099', aptitude: 'reverse' },
    liao_houhongyuan: { generalId: 'liao_houhongyuan', tier: 'ordinary', tacticalSkillId: 'ts_006', advantageSkillId: 'ts_400', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_006', aptitude: 'reverse' },
    sou_gaodingyuan: { generalId: 'sou_gaodingyuan', tier: 'ordinary', tacticalSkillId: 'ts_039', advantageSkillId: 'ts_400', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_039', aptitude: 'reverse' }, // 越巂：反蜀决死突围
    unassigned_duwenxiu: { generalId: 'unassigned_duwenxiu', tier: 'ordinary', tacticalSkillId: 'ts_017', advantageSkillId: 'ts_391', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_017', aptitude: 'reverse' }, // 回军：哀兵复起
    qingqiang_jiangwei: { generalId: 'qingqiang_jiangwei', tier: 'famous', tacticalSkillId: 'ts_270', strategicSkillId: 'str_08', advantageSkillId: 'ts_270', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_031', aptitude: 'reverse' }, // 北伐：避实击虚九伐中原
    qingyi_fanchangsheng: { generalId: 'qingyi_fanchangsheng', tier: 'ordinary', tacticalSkillId: 'ts_007', advantageSkillId: 'ts_007', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_410', aptitude: 'create' }, // 范长生天师道
    guangping_ruanwenzhang: { generalId: 'guangping_ruanwenzhang', tier: 'ordinary', tacticalSkillId: 'ts_031', advantageSkillId: 'ts_027', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_031', aptitude: 'reverse' }, // 广平：象兵水师哀兵抗西山
    nanzhong_mazhong: { generalId: 'nanzhong_mazhong', tier: 'famous', tacticalSkillId: 'ts_334', strategicSkillId: 'str_14', advantageSkillId: 'ts_022', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_334', aptitude: 'create' },
    yueyi_zhangyi: { generalId: 'yueyi_zhangyi', tier: 'famous', tacticalSkillId: 'ts_318', strategicSkillId: 'str_14', advantageSkillId: 'ts_703', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_318', aptitude: 'create' },
    jingjiang_qushisi: { generalId: 'jingjiang_qushisi', tier: 'ordinary', tacticalSkillId: 'ts_034', advantageSkillId: 'ts_389', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_034', aptitude: 'reverse' }, // 永安：固守靖江破李成栋
    duanzhou_d_caojin: { generalId: 'duanzhou_d_caojin', tier: 'ordinary', tacticalSkillId: 'ts_018', advantageSkillId: 'ts_028', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_018', aptitude: 'reverse' }, // 端州：据城拒侬智高
    monong_anong: { generalId: 'monong_anong', tier: 'ordinary', tacticalSkillId: 'ts_017', advantageSkillId: 'ts_009', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_017', aptitude: 'reverse' }, // 邦敦：哀兵退守
    basha_d_daogengmeng: { generalId: 'basha_d_daogengmeng', tier: 'ordinary', tacticalSkillId: 'ts_151', advantageSkillId: 'ts_399', balanceSkillId: 'ts_151', disadvantageSkillId: 'ts_410', aptitude: 'leverage' }, // 上丁：象兵雄踞
    leizhou_limao: { generalId: 'leizhou_limao', tier: 'ordinary', tacticalSkillId: 'ts_016', advantageSkillId: 'ts_398', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_016', aptitude: 'reverse' }, // 雷州：驻防海康
    ketagalan_huangqingyun: { generalId: 'ketagalan_huangqingyun', tier: 'ordinary', tacticalSkillId: 'ts_017', advantageSkillId: 'ts_402', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_017', aptitude: 'reverse' }, // 艋舺：汛防戍守
    shuizhen_qudaren: { generalId: 'shuizhen_qudaren', tier: 'ordinary', tacticalSkillId: 'ts_025', advantageSkillId: 'ts_023', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_025', aptitude: 'reverse' }, // 三菩：戍卒驻守
    pingnan_musheng: { generalId: 'pingnan_musheng', tier: 'famous', tacticalSkillId: 'ts_335', strategicSkillId: 'str_07', advantageSkillId: 'ts_335', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_017', aptitude: 'create' },
    jingdong_taohong: { generalId: 'jingdong_taohong', tier: 'ordinary', tacticalSkillId: 'ts_006', advantageSkillId: 'ts_023', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_006', aptitude: 'reverse' }, // 银生：坚守退敌
    ava_sijifa: { generalId: 'ava_sijifa', tier: 'ordinary', tacticalSkillId: 'ts_038', advantageSkillId: 'ts_400', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_038', aptitude: 'reverse' }, // 阿瓦：哀兵退守
    dian_duanjianwei: { generalId: 'dian_duanjianwei', tier: 'famous', tacticalSkillId: 'ts_326', strategicSkillId: 'str_08', advantageSkillId: 'ts_326', balanceSkillId: 'ts_691', disadvantageSkillId: 'ts_008', aptitude: 'create' },
    unassigned_monuha: { generalId: 'unassigned_monuha', tier: 'ordinary', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_028', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_011', aptitude: 'reverse' }, // 直通：孟族国王
    luohu_ganmuding: { generalId: 'luohu_ganmuding', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_012', aptitude: 'create' }, // 呵叻：罗斛驻守
    ailao_leilao: { generalId: 'ailao_leilao', tier: 'ordinary', tacticalSkillId: 'ts_034', advantageSkillId: 'ts_010', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_034', aptitude: 'reverse' }, // 永昌：哀牢决死反叛
    mingzheng_jianzandechang: { generalId: 'mingzheng_jianzandechang', tier: 'ordinary', tacticalSkillId: 'ts_167', advantageSkillId: 'ts_023', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_167', aptitude: 'reverse' }, // 打箭炉：从征金川
    hani_d_zhebi: { generalId: 'hani_d_zhebi', tier: 'ordinary', tacticalSkillId: 'ts_374', advantageSkillId: 'ts_392', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_374', aptitude: 'reverse' }, // 思陀：从征安南
    unassigned_piqiluomo: { generalId: 'unassigned_piqiluomo', tier: 'ordinary', tacticalSkillId: 'ts_006', advantageSkillId: 'ts_003', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_006', aptitude: 'reverse' }, // 骠国：守城戍卒
    ali_gandancaiwang: { generalId: 'ali_gandancaiwang', tier: 'famous', tacticalSkillId: 'ts_362', strategicSkillId: 'str_07', advantageSkillId: 'ts_362', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_413', aptitude: 'create' },
    gaoliang_dongzhen: { generalId: 'gaoliang_dongzhen', tier: 'ordinary', tacticalSkillId: 'ts_049', advantageSkillId: 'ts_049', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_417', aptitude: 'create' },
    bailan_pabala: { generalId: 'bailan_pabala', tier: 'ordinary', tacticalSkillId: 'ts_134', advantageSkillId: 'ts_134', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_048', aptitude: 'create' }, // 昌都：率僧兵守城
    jiantang_sangjiejia: { generalId: 'jiantang_sangjiejia', tier: 'ordinary', tacticalSkillId: 'ts_024', advantageSkillId: 'ts_027', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_024', aptitude: 'reverse' }, // 建塘：第巴摄政遣防
    kongsa_kongsayiduo: { generalId: 'kongsa_kongsayiduo', tier: 'ordinary', tacticalSkillId: 'ts_086', advantageSkillId: 'ts_023', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_086', aptitude: 'reverse' }, // 甘孜：从征瞻对
    unassigned_lazanghan: { generalId: 'unassigned_lazanghan', tier: 'ordinary', tacticalSkillId: 'ts_024', advantageSkillId: 'ts_389', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_024', aptitude: 'reverse' }, // 黑河宗：卫拉特突骑
    gling_lingesar: { generalId: 'gling_lingesar', tier: 'ordinary', tacticalSkillId: 'ts_007', advantageSkillId: 'ts_007', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_006', aptitude: 'create' },
    unassigned_nangqianwang: { generalId: 'unassigned_nangqianwang', tier: 'ordinary', tacticalSkillId: 'ts_015', advantageSkillId: 'ts_047', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_024', aptitude: 'leverage' }, // 隆庆：二十五族盟主
    unassigned_huoerkangsa: { generalId: 'unassigned_huoerkangsa', tier: 'ordinary', tacticalSkillId: 'ts_015', advantageSkillId: 'ts_021', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_020', aptitude: 'leverage' }, // 索宗：协剿波密
    daca_dacajilong: { generalId: 'daca_dacajilong', tier: 'ordinary', tacticalSkillId: 'ts_152', advantageSkillId: 'ts_152', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_016', aptitude: 'create' }, // 八宿：活佛差民武装
    gongtang_gongtangcang: { generalId: 'gongtang_gongtangcang', tier: 'ordinary', tacticalSkillId: 'ts_088', advantageSkillId: 'ts_088', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_012', aptitude: 'create' }, // 吉麦：牧民武装
    unassigned_juemuba: { generalId: 'unassigned_juemuba', tier: 'ordinary', tacticalSkillId: 'ts_024', advantageSkillId: 'ts_391', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_024', aptitude: 'reverse' }, // 觉木：宗谿驻兵
    unassigned_dalonghuofo: { generalId: 'unassigned_dalonghuofo', tier: 'ordinary', tacticalSkillId: 'ts_015', advantageSkillId: 'ts_401', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_020', aptitude: 'leverage' }, // 类乌齐：抵御盗匪
    nanjie_nanjiewangqiu: { generalId: 'nanjie_nanjiewangqiu', tier: 'ordinary', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_023', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_011', aptitude: 'reverse' }, // 日土：边军驻防
    unassigned_zhudi: { generalId: 'unassigned_zhudi', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_11', advantageSkillId: 'ts_021', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_013', aptitude: 'create' }, // 靖难军白沟突击
    ming_d_zhudi: { generalId: 'ming_d_zhudi', tier: 'famous', tacticalSkillId: 'ts_062', strategicSkillId: 'str_11', advantageSkillId: 'ts_062', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_712', aptitude: 'create' },
    jinling_tandaoji: { generalId: 'jinling_tandaoji', tier: 'famous', tacticalSkillId: 'ts_262', strategicSkillId: 'str_09', advantageSkillId: 'ts_390', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_262', aptitude: 'leverage' }, // 唱筹量沙·三十六计走为上
    yang_zhou_yangxingmi: { generalId: 'yang_zhou_yangxingmi', tier: 'famous', tacticalSkillId: 'ts_274', strategicSkillId: 'str_14', advantageSkillId: 'ts_274', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_409', aptitude: 'create' }, // 清口之战破孙儒、守淮南
    yangzhou_wangping: { generalId: 'yangzhou_wangping', tier: 'famous', tacticalSkillId: 'ts_169', strategicSkillId: 'str_08', advantageSkillId: 'ts_169', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_713', aptitude: 'reverse' }, // 汉中拒曹爽·无当飞军
    pagan_anulvtuo: { generalId: 'pagan_anulvtuo', tier: 'famous', tacticalSkillId: 'ts_307', strategicSkillId: 'str_03', advantageSkillId: 'ts_307', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_016', aptitude: 'create' }, // 蒲甘王朝东征西讨
    unassigned_machao: { generalId: 'unassigned_machao', tier: 'ordinary', tacticalSkillId: 'ts_038', advantageSkillId: 'ts_022', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_038', aptitude: 'reverse' }, // 潼关决死突击
    qiuci_baiba: { generalId: 'qiuci_baiba', tier: 'ordinary', tacticalSkillId: 'ts_017', advantageSkillId: 'ts_001', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_017', aptitude: 'reverse' }, // 龟兹内乱：哀兵复国
    menggu_d_chengjisihan: { generalId: 'menggu_d_chengjisihan', tier: 'famous', tacticalSkillId: 'ts_059', strategicSkillId: 'str_03', advantageSkillId: 'ts_442', balanceSkillId: 'ts_059', disadvantageSkillId: 'ts_443', aptitude: 'create' }, // 长生天佑（免疫开局削兵）+ 所向披靡（帝国远征攻×1.5；原威震华夏与招牌技不叠乘，2026-07-11 连战校准）
    bohai_dazuorong: { generalId: 'bohai_dazuorong', tier: 'famous', tacticalSkillId: 'ts_091', strategicSkillId: 'str_14', advantageSkillId: 'ts_471', balanceSkillId: 'ts_091', disadvantageSkillId: 'ts_473', aptitude: 'reverse' }, // 阻险御敌
    goryeo_jianghanzan: { generalId: 'goryeo_jianghanzan', tier: 'famous', tacticalSkillId: 'ts_382', strategicSkillId: 'str_08', advantageSkillId: 'ts_382', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_036', aptitude: 'leverage' },
    ashikaga_zulizunshi: { generalId: 'ashikaga_zulizunshi', tier: 'famous', tacticalSkillId: 'ts_345', strategicSkillId: 'str_14', advantageSkillId: 'ts_345', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_419', aptitude: 'create' }, // 凑川败后据九州水师固守
    tiemuer_tiemuer: { generalId: 'tiemuer_tiemuer', tier: 'famous', tacticalSkillId: 'ts_115', strategicSkillId: 'str_03', advantageSkillId: 'ts_115', balanceSkillId: 'ts_681', disadvantageSkillId: 'ts_682', aptitude: 'create' },
    siam_nalixuan: { generalId: 'siam_nalixuan', tier: 'famous', tacticalSkillId: 'ts_348', strategicSkillId: 'str_13', advantageSkillId: 'ts_348', balanceSkillId: 'ts_613', disadvantageSkillId: 'ts_614', aptitude: 'create' }, // 象战击杀缅甸王储复国
    shang_fuhao: { generalId: 'shang_fuhao', tier: 'famous', tacticalSkillId: 'ts_200', strategicSkillId: 'str_03', advantageSkillId: 'ts_200', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_024', aptitude: 'create' }, // 征伐土方武丁妇好率军突击
    pizhou_lvbu: { generalId: 'pizhou_lvbu', tier: 'ordinary', tacticalSkillId: 'ts_026', advantageSkillId: 'ts_391', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_026', aptitude: 'reverse' }, // 下邳飞将
    han_d_liubang: { generalId: 'han_d_liubang', tier: 'famous', tacticalSkillId: 'ts_187', strategicSkillId: 'str_06', advantageSkillId: 'ts_402', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_187', aptitude: 'reverse' },
    wei_wuqi: { generalId: 'wei_wuqi', tier: 'famous', tacticalSkillId: 'ts_053', strategicSkillId: 'str_03', advantageSkillId: 'ts_002', balanceSkillId: 'ts_053', disadvantageSkillId: 'ts_026', aptitude: 'create' }, // 无坚不摧（魏武卒精锐无死角高昂士气）
    manzhou_nuerhachi: { generalId: 'manzhou_nuerhachi', tier: 'famous', tacticalSkillId: 'ts_058', strategicSkillId: 'str_03', advantageSkillId: 'ts_058', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_416', aptitude: 'create' },
    xinluo_jinyuxin: { generalId: 'xinluo_jinyuxin', tier: 'famous', tacticalSkillId: 'ts_330', strategicSkillId: 'str_03', advantageSkillId: 'ts_330', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_036', aptitude: 'create' }, // 萨円大捷守城反攻
    seljuq_sangjiaer: { generalId: 'seljuq_sangjiaer', tier: 'famous', tacticalSkillId: 'ts_128', strategicSkillId: 'str_14', advantageSkillId: 'ts_128', balanceSkillId: 'ts_690', disadvantageSkillId: 'ts_006', aptitude: 'create' }, // 中亚草原对峙以逸待变
    zaoyang_d_menggong: { generalId: 'zaoyang_d_menggong', tier: 'famous', tacticalSkillId: 'ts_126', strategicSkillId: 'str_08', advantageSkillId: 'ts_391', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_126', aptitude: 'leverage' }, // 枣阳孤城死守破蒙古
    yamato_nanmuzhengcheng: { generalId: 'yamato_nanmuzhengcheng', tier: 'famous', tacticalSkillId: 'ts_172', strategicSkillId: 'str_08', advantageSkillId: 'ts_047', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_172', aptitude: 'reverse' }, // 千早城笼城死守抗幕府
    chen3_jizhun: { generalId: 'chen3_jizhun', tier: 'ordinary', tacticalSkillId: 'ts_041', advantageSkillId: 'ts_004', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_041', aptitude: 'reverse' }, // 马韩辰王治月支国
    jilizhou_chengmingzhen: { generalId: 'jilizhou_chengmingzhen', tier: 'ordinary', tacticalSkillId: 'ts_351', advantageSkillId: 'ts_351', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_037', aptitude: 'create' },
    nuergan_kangwang: { generalId: 'nuergan_kangwang', tier: 'ordinary', tacticalSkillId: 'ts_032', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'reverse' }, // 奴儿干都司戍边
    ashina_ashinayandou: { generalId: 'ashina_ashinayandou', tier: 'ordinary', tacticalSkillId: 'ts_007', advantageSkillId: 'ts_007', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_008', aptitude: 'create' }, // 阿尔泰金山突厥
    yiwu_hanshen: { generalId: 'yiwu_hanshen', tier: 'ordinary', tacticalSkillId: 'ts_041', advantageSkillId: 'ts_002', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_041', aptitude: 'reverse' }, // 哈密忠顺王苦峪抗也先
    hepan_gaoxianzhi: { generalId: 'hepan_gaoxianzhi', tier: 'famous', tacticalSkillId: 'ts_283', strategicSkillId: 'str_07', advantageSkillId: 'ts_283', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_410', aptitude: 'create' },
    unassigned_cewangzhabu: { generalId: 'unassigned_cewangzhabu', tier: 'ordinary', tacticalSkillId: 'ts_026', advantageSkillId: 'ts_001', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_026', aptitude: 'reverse' }, // 札萨克图汗部
    unassigned_amursana: { generalId: 'unassigned_amursana', tier: 'ordinary', tacticalSkillId: 'ts_026', advantageSkillId: 'ts_401', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_026', aptitude: 'reverse' }, // 金山辉特部反清
    chuyue_shatuonasu: { generalId: 'chuyue_shatuonasu', tier: 'ordinary', tacticalSkillId: 'ts_137', advantageSkillId: 'ts_029', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_137', aptitude: 'reverse' },
    keerkezi_manasi: { generalId: 'keerkezi_manasi', tier: 'ordinary', tacticalSkillId: 'ts_010', advantageSkillId: 'ts_010', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_016', aptitude: 'create' }, // 柯尔克孜史诗英雄
    unassigned_zhangyao: { generalId: 'unassigned_zhangyao', tier: 'ordinary', tacticalSkillId: 'ts_029', advantageSkillId: 'ts_029', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_012', aptitude: 'create' }, // 星星峡嵩武军入疆
    xiyuduhu_banchao: { generalId: 'xiyuduhu_banchao', tier: 'famous', tacticalSkillId: 'ts_064', strategicSkillId: 'str_07', advantageSkillId: 'ts_651', balanceSkillId: 'ts_652', disadvantageSkillId: 'ts_064', aptitude: 'leverage' }, // 虎穴奇袭（疏勒·36骑定西域）
    yangguan_lihao: { generalId: 'yangguan_lihao', tier: 'ordinary', tacticalSkillId: 'ts_137', advantageSkillId: 'ts_028', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_137', aptitude: 'reverse' },
    wulianghai_chelingwubashen: { generalId: 'wulianghai_chelingwubashen', tier: 'ordinary', tacticalSkillId: 'ts_140', advantageSkillId: 'ts_140', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_411', aptitude: 'create' },
    tumengken_tumengken: { generalId: 'tumengken_tumengken', tier: 'ordinary', tacticalSkillId: 'ts_148', advantageSkillId: 'ts_148', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_045', aptitude: 'create' }, // 赛音诺颜抗卫拉特
    bayegu_qulishi: { generalId: 'bayegu_qulishi', tier: 'ordinary', tacticalSkillId: 'ts_058', advantageSkillId: 'ts_058', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_037', aptitude: 'create' }, // 拔野古助唐灭薛延陀
    zubu_mogusi: { generalId: 'zubu_mogusi', tier: 'ordinary', tacticalSkillId: 'ts_248', advantageSkillId: 'ts_248', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_045', aptitude: 'create' },
    wuzhumuqin_duoerji: { generalId: 'wuzhumuqin_duoerji', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_416', aptitude: 'create' }, // 乌珠穆沁随征噶尔丹
    unassigned_feizigu: { generalId: 'unassigned_feizigu', tier: 'ordinary', tacticalSkillId: 'ts_015', advantageSkillId: 'ts_028', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_038', aptitude: 'leverage' }, // 白狄肥国肥子鼓集宁
    shiwei_saihou: { generalId: 'shiwei_saihou', tier: 'ordinary', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_003', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_011', aptitude: 'reverse' }, // 室韦大酋长塞呴俱轮泊元和入朝
    sunite_sousai: { generalId: 'sunite_sousai', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_413', aptitude: 'create' }, // 苏尼特札萨克
    bulat_beiduanchaer: { generalId: 'bulat_beiduanchaer', tier: 'ordinary', tacticalSkillId: 'ts_024', advantageSkillId: 'ts_028', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_024', aptitude: 'reverse' }, // 蒙古始祖孛端察儿石勒喀河
    unassigned_danjin: { generalId: 'unassigned_danjin', tier: 'ordinary', tacticalSkillId: 'ts_026', advantageSkillId: 'ts_027', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_026', aptitude: 'reverse' }, // 首任唐努总管丹津 // 布尔根乌梁海部
    // ── 日本 ──
    edo_dechuanjiakang: { generalId: 'edo_dechuanjiakang', tier: 'famous', tacticalSkillId: 'ts_127', strategicSkillId: 'str_14', advantageSkillId: 'ts_508', balanceSkillId: 'ts_127', disadvantageSkillId: 'ts_509', aptitude: 'leverage' }, // 关原后稳坐江户待变
    kai_wutianxinxuan: { generalId: 'kai_wutianxinxuan', tier: 'famous', tacticalSkillId: 'ts_171', strategicSkillId: 'str_03', advantageSkillId: 'ts_171', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_035', aptitude: 'create' }, // 川中岛铁骑突击
    echigo_shangshanqianxin: { generalId: 'echigo_shangshanqianxin', tier: 'famous', tacticalSkillId: 'ts_281', strategicSkillId: 'str_09', advantageSkillId: 'ts_281', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_017', aptitude: 'create' }, // 川中岛车悬突击
    hashiba_fengchenxiuji: { generalId: 'hashiba_fengchenxiuji', tier: 'famous', tacticalSkillId: 'ts_280', strategicSkillId: 'str_01', advantageSkillId: 'ts_280', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_413', aptitude: 'leverage' }, // 鸟取忍城粮道奇袭
    sanada_d_zhentianxingcun: { generalId: 'sanada_d_zhentianxingcun', tier: 'ordinary', tacticalSkillId: 'ts_156', advantageSkillId: 'ts_156', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_416', aptitude: 'create' }, // 大阪夏之阵赤备突击
    date_d_yidazhengzong: { generalId: 'date_d_yidazhengzong', tier: 'famous', tacticalSkillId: 'ts_282', strategicSkillId: 'str_01', advantageSkillId: 'ts_282', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_417', aptitude: 'create' }, // 独眼兜冲阵
    owari_zhitianxinchang: { generalId: 'owari_zhitianxinchang', tier: 'famous', tacticalSkillId: 'ts_114', strategicSkillId: 'str_01', advantageSkillId: 'ts_579', balanceSkillId: 'ts_580', disadvantageSkillId: 'ts_114', aptitude: 'create' }, // 桶狭间奇袭破今川
    totomi_jiujingzhongci: { generalId: 'totomi_jiujingzhongci', tier: 'famous', tacticalSkillId: 'ts_363', strategicSkillId: 'str_08', advantageSkillId: 'ts_363', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_025', aptitude: 'create' }, // 浜松城·德川四天王
    jinchuan_jinchuanyiyuan: { generalId: 'jinchuan_jinchuanyiyuan', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_017', aptitude: 'create' }, // 东海道第一弓取·大军压境
    aki_maoliyuanjiu: { generalId: 'aki_maoliyuanjiu', tier: 'famous', tacticalSkillId: 'ts_380', strategicSkillId: 'str_09', advantageSkillId: 'ts_380', balanceSkillId: 'ts_469', disadvantageSkillId: 'ts_470', aptitude: 'leverage' }, // 严岛夜袭少胜多
    satsuma_daojinjiajiu: { generalId: 'satsuma_daojinjiajiu', tier: 'famous', tacticalSkillId: 'ts_130', strategicSkillId: 'str_12', advantageSkillId: 'ts_706', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_130', aptitude: 'leverage' }, // 钓野伏·冲田畷耳川合战
    otomo_d_lihuadaoxue: { generalId: 'otomo_d_lihuadaoxue', tier: 'ordinary', tacticalSkillId: 'ts_031', advantageSkillId: 'ts_047', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_031', aptitude: 'reverse' }, // 迁冈筑城拒敌
    higo_d_juchiwuguang: { generalId: 'higo_d_juchiwuguang', tier: 'famous', tacticalSkillId: 'ts_381', strategicSkillId: 'str_10', advantageSkillId: 'ts_381', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_035', aptitude: 'create' }, // 菊池河山战突击
    aizu_pushengshixiang: { generalId: 'aizu_pushengshixiang', tier: 'ordinary', tacticalSkillId: 'ts_024', advantageSkillId: 'ts_009', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_024', aptitude: 'reverse' }, // 会津五奉行据山城维稳
    chosokabe_changzongwobuyuanqin: { generalId: 'chosokabe_changzongwobuyuanqin', tier: 'famous', tacticalSkillId: 'ts_364', strategicSkillId: 'str_01', advantageSkillId: 'ts_364', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_034', aptitude: 'create' }, // 长宗我部奇袭统一四国
    izumo_shanzhonglujie: { generalId: 'izumo_shanzhonglujie', tier: 'ordinary', tacticalSkillId: 'ts_026', advantageSkillId: 'ts_003', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_026', aptitude: 'reverse' }, // 局部守战逆袭
    unassigned_lingmuzhongxiu: { generalId: 'unassigned_lingmuzhongxiu', tier: 'ordinary', tacticalSkillId: 'ts_006', advantageSkillId: 'ts_402', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_006', aptitude: 'reverse' }, // 筑寨固守
    iga_d_baididanbo: { generalId: 'iga_d_baididanbo', tier: 'ordinary', tacticalSkillId: 'ts_024', advantageSkillId: 'ts_029', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_024', aptitude: 'reverse' }, // 伊贺忍者夜袭
    jibei2_qingshuizongzhi: { generalId: 'jibei2_qingshuizongzhi', tier: 'ordinary', tacticalSkillId: 'ts_003', advantageSkillId: 'ts_003', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_034', aptitude: 'create' }, // 备中高松城笼城死守
    sagami_beitiaoshikang: { generalId: 'sagami_beitiaoshikang', tier: 'famous', tacticalSkillId: 'ts_331', strategicSkillId: 'str_08', advantageSkillId: 'ts_331', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_031', aptitude: 'reverse' }, // 小田原城·天下第一坚城
    mino_dagujiji: { generalId: 'mino_dagujiji', tier: 'ordinary', tacticalSkillId: 'ts_034', advantageSkillId: 'ts_029', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_034', aptitude: 'reverse' }, // 不破关·关原死战
    suwa_d_zoufanglaizhong: { generalId: 'suwa_d_zoufanglaizhong', tier: 'ordinary', tacticalSkillId: 'ts_166', advantageSkillId: 'ts_009', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_166', aptitude: 'reverse' }, // 诹访据险反击
    shimotsuke_yudougongguanggang: { generalId: 'shimotsuke_yudougongguanggang', tier: 'ordinary', tacticalSkillId: 'ts_110', advantageSkillId: 'ts_010', balanceSkillId: 'ts_110', disadvantageSkillId: 'ts_411', aptitude: 'leverage' }, // 宇都宫筑城固守
    iyo_d_cunshangwuji: { generalId: 'iyo_d_cunshangwuji', tier: 'ordinary', tacticalSkillId: 'ts_346', advantageSkillId: 'ts_346', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_008', aptitude: 'create' },
    nanbu_nanbuqingzheng: { generalId: 'nanbu_nanbuqingzheng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_001', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_011', aptitude: 'create' }, // 南部藩境守反击
    unassigned_yuxiduozhijia: { generalId: 'unassigned_yuxiduozhijia', tier: 'ordinary', tacticalSkillId: 'ts_019', advantageSkillId: 'ts_004', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_019', aptitude: 'reverse' }, // 离间毛利后取备前
    osumi_ganfujianxu: { generalId: 'osumi_ganfujianxu', tier: 'ordinary', tacticalSkillId: 'ts_100', advantageSkillId: 'ts_022', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_100', aptitude: 'reverse' }, // 肝付水军奇袭
    fujiwara_yuanyijing: { generalId: 'fujiwara_yuanyijing', tier: 'famous', tacticalSkillId: 'ts_344', strategicSkillId: 'str_12', advantageSkillId: 'ts_344', balanceSkillId: 'ts_692', disadvantageSkillId: 'ts_026', aptitude: 'leverage' }, // 屋岛冲夜袭
    kakizaki_liqiqingguang: { generalId: 'kakizaki_liqiqingguang', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_411', aptitude: 'create' }, // 虾夷边境守反击
    ayinu_hushemoquan: { generalId: 'ayinu_hushemoquan', tier: 'ordinary', tacticalSkillId: 'ts_020', advantageSkillId: 'ts_047', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_020', aptitude: 'reverse' }, // 阿伊努战：绝境奋起
    so_zongyizhi: { generalId: 'so_zongyizhi', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_045', aptitude: 'create' }, // 对朝奇袭
    taira_pingzhisheng: { generalId: 'taira_pingzhisheng', tier: 'ordinary', tacticalSkillId: 'ts_033', advantageSkillId: 'ts_398', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_033', aptitude: 'reverse' },
    // ── 朝鲜 ──
    joseon_lichenggui: { generalId: 'joseon_lichenggui', tier: 'famous', tacticalSkillId: 'ts_072', strategicSkillId: 'str_13', advantageSkillId: 'ts_543', balanceSkillId: 'ts_544', disadvantageSkillId: 'ts_072', aptitude: 'create' }, // 回军突袭（威化岛斩首奇袭）
    gaogouli_yizhiwende: { generalId: 'gaogouli_yizhiwende', tier: 'famous', tacticalSkillId: 'ts_173', strategicSkillId: 'str_09', advantageSkillId: 'ts_007', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_173', aptitude: 'leverage' },
    baiji_jiebo: { generalId: 'baiji_jiebo', tier: 'ordinary', tacticalSkillId: 'ts_098', advantageSkillId: 'ts_029', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_098', aptitude: 'reverse' }, // 车昌野隘突击
    zhen_zhenxuan: { generalId: 'zhen_zhenxuan', tier: 'famous', tacticalSkillId: 'ts_340', strategicSkillId: 'str_09', advantageSkillId: 'ts_340', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_418', aptitude: 'create' },
    danluo_jintongjing: { generalId: 'danluo_jintongjing', tier: 'ordinary', tacticalSkillId: 'ts_037', advantageSkillId: 'ts_389', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_037', aptitude: 'reverse' }, // 金通精守城逆袭
    sambyeol_lishunchen: { generalId: 'sambyeol_lishunchen', tier: 'famous', tacticalSkillId: 'ts_060', strategicSkillId: 'str_09', advantageSkillId: 'ts_401', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_060', aptitude: 'leverage' }, // 必死则生（绝地反击以寡击众）
    gaya_jinshoulu: { generalId: 'gaya_jinshoulu', tier: 'ordinary', tacticalSkillId: 'ts_024', advantageSkillId: 'ts_023', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_024', aptitude: 'reverse' }, // 金官伽倻筑城
    woju_yinguan: { generalId: 'woju_yinguan', tier: 'famous', tacticalSkillId: 'ts_095', strategicSkillId: 'str_14', advantageSkillId: 'ts_009', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_095', aptitude: 'create' }, // 勿里伐高句丽久战拖敌
    xuantu_yuangaisuwen: { generalId: 'xuantu_yuangaisuwen', tier: 'famous', tacticalSkillId: 'ts_096', strategicSkillId: 'str_08', advantageSkillId: 'ts_390', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_096', aptitude: 'reverse' }, // 安市围城守城破唐
    ssangseong_cuiying: { generalId: 'ssangseong_cuiying', tier: 'famous', tacticalSkillId: 'ts_097', strategicSkillId: 'str_12', advantageSkillId: 'ts_391', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_097', aptitude: 'create' },
    ssangseong_lizichun: { generalId: 'ssangseong_lizichun', tier: 'ordinary', tacticalSkillId: 'ts_098', advantageSkillId: 'ts_004', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_098', aptitude: 'reverse' }, // 李子春哀兵
    chungju_d_quanli: { generalId: 'chungju_d_quanli', tier: 'famous', tacticalSkillId: 'ts_099', strategicSkillId: 'str_08', advantageSkillId: 'ts_708', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_099', aptitude: 'reverse' },
    sabeol_jinshimin: { generalId: 'sabeol_jinshimin', tier: 'famous', tacticalSkillId: 'ts_100', strategicSkillId: 'str_08', advantageSkillId: 'ts_023', balanceSkillId: 'ts_699', disadvantageSkillId: 'ts_100', aptitude: 'reverse' },
    // ── 东北
    manzhou_d_duoergun: { generalId: 'manzhou_d_duoergun', tier: 'famous', tacticalSkillId: 'ts_067', strategicSkillId: 'str_01', advantageSkillId: 'ts_067', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_041', aptitude: 'create' },
    dajin_wanyanaguda: { generalId: 'dajin_wanyanaguda', tier: 'famous', tacticalSkillId: 'ts_057', strategicSkillId: 'str_01', advantageSkillId: 'ts_057', balanceSkillId: 'ts_444', disadvantageSkillId: 'ts_445', aptitude: 'create' },
    wuliangha_subutai: { generalId: 'wuliangha_subutai', tier: 'famous', tacticalSkillId: 'ts_102', advantageSkillId: 'ts_102', balanceSkillId: 'ts_637', disadvantageSkillId: 'ts_638', strategicSkillId: 'str_01', aptitude: 'create' },
    unassigned_naierbuhua: { generalId: 'unassigned_naierbuhua', tier: 'ordinary', tacticalSkillId: 'ts_103', advantageSkillId: 'ts_027', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_103', aptitude: 'reverse' }, // 永乐北伐兀良哈败乃儿不花
    fuyu_weichoutai: { generalId: 'fuyu_weichoutai', tier: 'ordinary', tacticalSkillId: 'ts_104', advantageSkillId: 'ts_390', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_104', aptitude: 'reverse' }, // 扶余据城固守
    jurchen_wanyanzongbi: { generalId: 'jurchen_wanyanzongbi', tier: 'famous', tacticalSkillId: 'ts_076', strategicSkillId: 'str_03', advantageSkillId: 'ts_076', balanceSkillId: 'ts_547', disadvantageSkillId: 'ts_548', aptitude: 'create' }, // 如墙而进（郾城铁浮屠平原突击·归位现成技）
    aisin_d_huangtaiji: { generalId: 'aisin_d_huangtaiji', tier: 'famous', tacticalSkillId: 'ts_077', strategicSkillId: 'str_05', advantageSkillId: 'ts_465', balanceSkillId: 'ts_077', disadvantageSkillId: 'ts_467', aptitude: 'leverage' }, // 长围久困（坚壁清野围城）
    mohe_wanyanzonghan: { generalId: 'mohe_wanyanzonghan', tier: 'famous', tacticalSkillId: 'ts_360', strategicSkillId: 'str_03', advantageSkillId: 'ts_360', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_410', aptitude: 'create' },
    suolun_bomuboguoer: { generalId: 'suolun_bomuboguoer', tier: 'ordinary', tacticalSkillId: 'ts_095', advantageSkillId: 'ts_400', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_095', aptitude: 'reverse' },
    wula_buzhantai: { generalId: 'wula_buzhantai', tier: 'ordinary', tacticalSkillId: 'ts_082', advantageSkillId: 'ts_082', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_017', aptitude: 'create' },
    yehe_jintaiji: { generalId: 'yehe_jintaiji', tier: 'ordinary', tacticalSkillId: 'ts_083', advantageSkillId: 'ts_083', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_033', aptitude: 'create' },
    keerqin_aoba: { generalId: 'keerqin_aoba', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_006', aptitude: 'create' }, // 科尔沁奥巴归附后骑袭
    wure_wuzhaodu: { generalId: 'wure_wuzhaodu', tier: 'ordinary', tacticalSkillId: 'ts_085', advantageSkillId: 'ts_085', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_409', aptitude: 'create' }, // 元末断粮破敌
    houliao_yelvliuge: { generalId: 'houliao_yelvliuge', tier: 'famous', tacticalSkillId: 'ts_333', strategicSkillId: 'str_14', advantageSkillId: 'ts_333', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_039', aptitude: 'leverage' },
    unassigned_wangtai: { generalId: 'unassigned_wangtai', tier: 'ordinary', tacticalSkillId: 'ts_087', advantageSkillId: 'ts_003', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_087', aptitude: 'reverse' }, // 王台部寨固守
    jinzhou_lichengliang: { generalId: 'jinzhou_lichengliang', tier: 'famous', tacticalSkillId: 'ts_084', strategicSkillId: 'str_08', advantageSkillId: 'ts_390', balanceSkillId: 'ts_084', disadvantageSkillId: 'ts_036', aptitude: 'create' }, // 铁骑蹙敌
    zu_d_yuanchonghuan: { generalId: 'zu_d_yuanchonghuan', tier: 'famous', tacticalSkillId: 'ts_065', strategicSkillId: 'str_08', advantageSkillId: 'ts_675', balanceSkillId: 'ts_676', disadvantageSkillId: 'ts_065', aptitude: 'reverse' }, // 袁崇焕·凭坚摧锋（宁远凭坚城用大炮）
    wanzhou_shangguankui: { generalId: 'wanzhou_shangguankui', tier: 'ordinary', tacticalSkillId: 'ts_033', advantageSkillId: 'ts_047', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_033', aptitude: 'reverse' }, // 万州天生城抗元
    chenzhou_d_zhanghao: { generalId: 'chenzhou_d_zhanghao', tier: 'ordinary', tacticalSkillId: 'ts_091', advantageSkillId: 'ts_400', balanceSkillId: 'ts_091', disadvantageSkillId: 'ts_048', aptitude: 'leverage' }, // 辰州戍守
    mao_wenlong_maowenlong: { generalId: 'mao_wenlong_maowenlong', tier: 'ordinary', tacticalSkillId: 'ts_022', advantageSkillId: 'ts_022', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_031', aptitude: 'create' }, // 皮岛东江据岛固守
    dawoer_baerdaqi: { generalId: 'dawoer_baerdaqi', tier: 'ordinary', tacticalSkillId: 'ts_017', advantageSkillId: 'ts_003', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_017', aptitude: 'reverse' },
    heishui_nishuli: { generalId: 'heishui_nishuli', tier: 'ordinary', tacticalSkillId: 'ts_006', advantageSkillId: 'ts_400', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_006', aptitude: 'reverse' },
    yeren_nvzhen_boke: { generalId: 'yeren_nvzhen_boke', tier: 'ordinary', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_010', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_011', aptitude: 'reverse' },
    wuji_yilizhi: { generalId: 'wuji_yilizhi', tier: 'ordinary', tacticalSkillId: 'ts_037', advantageSkillId: 'ts_389', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_037', aptitude: 'reverse' }, // 勿吉首领朝贡北魏
    jilin_fujun: { generalId: 'jilin_fujun', tier: 'ordinary', tacticalSkillId: 'ts_205', advantageSkillId: 'ts_010', balanceSkillId: 'ts_205', disadvantageSkillId: 'ts_008', aptitude: 'leverage' }, // 吉林将军屯田戍边
    dongdan_yelvbei: { generalId: 'dongdan_yelvbei', tier: 'ordinary', tacticalSkillId: 'ts_149', advantageSkillId: 'ts_027', balanceSkillId: 'ts_149', disadvantageSkillId: 'ts_016', aptitude: 'leverage' }, // 东丹王以敖东城为都
    kuye_kuye_qichayi: { generalId: 'kuye_kuye_qichayi', tier: 'ordinary', tacticalSkillId: 'ts_025', advantageSkillId: 'ts_009', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_025', aptitude: 'reverse' }, // 库页岛费雅喀
    sushen_tudiji: { generalId: 'sushen_tudiji', tier: 'ordinary', tacticalSkillId: 'ts_104', advantageSkillId: 'ts_009', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_104', aptitude: 'reverse' }, // 靺鞨首领突地稽归唐
    yilou_naoya: { generalId: 'yilou_naoya', tier: 'ordinary', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_401', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_011', aptitude: 'reverse' }, // 挹娄首领助战高句丽
    maomingan_suoetu: { generalId: 'maomingan_suoetu', tier: 'ordinary', tacticalSkillId: 'ts_049', advantageSkillId: 'ts_049', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_013', aptitude: 'create' },
    unassigned_kaolangwu: { generalId: 'unassigned_kaolangwu', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_412', aptitude: 'create' }, // 囊哈儿卫指挥考郎兀
    unassigned_hazheng: { generalId: 'unassigned_hazheng', tier: 'ordinary', tacticalSkillId: 'ts_026', advantageSkillId: 'ts_390', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_026', aptitude: 'reverse' }, // 兀列河卫哈正诺托罗
    unassigned_hudamu: { generalId: 'unassigned_hudamu', tier: 'ordinary', tacticalSkillId: 'ts_026', advantageSkillId: 'ts_023', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_026', aptitude: 'reverse' }, // 野人女真忽答木盆奴里
    unassigned_mangka: { generalId: 'unassigned_mangka', tier: 'ordinary', tacticalSkillId: 'ts_015', advantageSkillId: 'ts_004', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_019', aptitude: 'leverage' }, // 费雅喀族长莽喀普禄
    unassigned_xiyangha: { generalId: 'unassigned_xiyangha', tier: 'ordinary', tacticalSkillId: 'ts_014', advantageSkillId: 'ts_021', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_419', aptitude: 'leverage' }, // 女真大酋长西阳哈瓦伦
    hezhe_shaerhuda: { generalId: 'hezhe_shaerhuda', tier: 'famous', tacticalSkillId: 'ts_365', strategicSkillId: 'str_13', advantageSkillId: 'ts_365', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_412', aptitude: 'create' },
    liao_d_yelvabaoji: { generalId: 'liao_d_yelvabaoji', tier: 'famous', tacticalSkillId: 'ts_087', strategicSkillId: 'str_03', advantageSkillId: 'ts_561', balanceSkillId: 'ts_562', disadvantageSkillId: 'ts_087', aptitude: 'create' },
    yel_yelvxiuge: { generalId: 'yel_yelvxiuge', tier: 'famous', tacticalSkillId: 'ts_119', strategicSkillId: 'str_07', advantageSkillId: 'ts_119', balanceSkillId: 'ts_661', disadvantageSkillId: 'ts_662', aptitude: 'leverage' }, // 满城大败宋师以逸待劳
    yizhou_wanyanloushi: { generalId: 'yizhou_wanyanloushi', tier: 'famous', tacticalSkillId: 'ts_131', strategicSkillId: 'str_12', advantageSkillId: 'ts_131', balanceSkillId: 'ts_667', disadvantageSkillId: 'ts_668', aptitude: 'create' }, // 富平之战大破张浚五路宋军
    unassigned_shilu: { generalId: 'unassigned_shilu', tier: 'ordinary', tacticalSkillId: 'ts_015', advantageSkillId: 'ts_028', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_040', aptitude: 'leverage' }, // 完颜始祖据黑水故地
    unassigned_menglelun: { generalId: 'unassigned_menglelun', tier: 'ordinary', tacticalSkillId: 'ts_035', advantageSkillId: 'ts_402', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_035', aptitude: 'reverse' }, // 雅克萨达斡尔据寨
    unassigned_yilv: { generalId: 'unassigned_yilv', tier: 'ordinary', tacticalSkillId: 'ts_017', advantageSkillId: 'ts_001', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_017', aptitude: 'reverse' }, // 义律部哀兵守境
    yuwen_yuwentai: { generalId: 'yuwen_yuwentai', tier: 'famous', tacticalSkillId: 'ts_081', strategicSkillId: 'str_14', advantageSkillId: 'ts_678', balanceSkillId: 'ts_679', disadvantageSkillId: 'ts_081', aptitude: 'leverage' },
    wala_yexian: { generalId: 'wala_yexian', tier: 'famous', tacticalSkillId: 'ts_068', strategicSkillId: 'str_06', advantageSkillId: 'ts_068', balanceSkillId: 'ts_625', disadvantageSkillId: 'ts_626', aptitude: 'create' }, // 乘虚直捣（土木堡之变）
// ── 草原区 2026-06-18 ──
      jiluo_d_douxian: { generalId: 'jiluo_d_douxian', tier: 'famous', tacticalSkillId: 'ts_232', strategicSkillId: 'str_12', advantageSkillId: 'ts_232', balanceSkillId: 'ts_693', disadvantageSkillId: 'ts_031', aptitude: 'create' }, // 燕然勒石破北匈奴
    unassigned_yelvdeguang: { generalId: 'unassigned_yelvdeguang', tier: 'famous', tacticalSkillId: 'ts_049', strategicSkillId: 'str_03', advantageSkillId: 'ts_049', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_013', aptitude: 'create' }, // 灭后唐取汴京
    kumo_xiwanghuilibao: { generalId: 'kumo_xiwanghuilibao', tier: 'ordinary', tacticalSkillId: 'ts_034', advantageSkillId: 'ts_049', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_034', aptitude: 'reverse' }, // 奚王自立，决死抗战
    geluolu_chisipijia: { generalId: 'geluolu_chisipijia', tier: 'ordinary', tacticalSkillId: 'ts_099', advantageSkillId: 'ts_022', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_099', aptitude: 'reverse' }, // 葛逻禄纵横西域外交
    ogodei_chuoermahan: { generalId: 'ogodei_chuoermahan', tier: 'famous', tacticalSkillId: 'ts_089', strategicSkillId: 'str_07', advantageSkillId: 'ts_089', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_410', aptitude: 'create' }, // 风卷残云
    merkit_boyan: { generalId: 'merkit_boyan', tier: 'famous', tacticalSkillId: 'ts_235', strategicSkillId: 'str_11', advantageSkillId: 'ts_235', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_722', aptitude: 'create' },
    tumed_andahan: { generalId: 'tumed_andahan', tier: 'famous', tacticalSkillId: 'ts_124', strategicSkillId: 'str_07', advantageSkillId: 'ts_124', balanceSkillId: 'ts_622', disadvantageSkillId: 'ts_623', aptitude: 'create' }, // 庚戌之变长驱围北京（草原劫掠）
    kiyad_yesugai: { generalId: 'kiyad_yesugai', tier: 'ordinary', tacticalSkillId: 'ts_009', advantageSkillId: 'ts_009', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_008', aptitude: 'create' }, // 也速该草原奔袭
    unassigned_mahamu: { generalId: 'unassigned_mahamu', tier: 'ordinary', tacticalSkillId: 'ts_017', advantageSkillId: 'ts_389', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_017', aptitude: 'reverse' }, // 忽兰忽失温后重整
    xiajiasi_are: { generalId: 'xiajiasi_are', tier: 'famous', tacticalSkillId: 'ts_242', strategicSkillId: 'str_01', advantageSkillId: 'ts_242', balanceSkillId: 'ts_643', disadvantageSkillId: 'ts_644', aptitude: 'create' }, // 黠戛斯灭回鹘神速
    xiongnu_maodun: { generalId: 'xiongnu_maodun', tier: 'famous', tacticalSkillId: 'ts_066', strategicSkillId: 'str_03', advantageSkillId: 'ts_066', balanceSkillId: 'ts_649', disadvantageSkillId: 'ts_650', aptitude: 'leverage' }, // 鸣镝所向（白登围刘邦·草原征服者）
    murong_murongke: { generalId: 'murong_murongke', tier: 'famous', tacticalSkillId: 'ts_236', strategicSkillId: 'str_05', advantageSkillId: 'ts_236', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_410', aptitude: 'create' },
    wuhuan_tadun: { generalId: 'wuhuan_tadun', tier: 'ordinary', tacticalSkillId: 'ts_038', advantageSkillId: 'ts_389', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_038', aptitude: 'reverse' }, // 白狼山死战曹操
    yuan_d_hubilie: { generalId: 'yuan_d_hubilie', tier: 'famous', tacticalSkillId: 'ts_246', strategicSkillId: 'str_03', advantageSkillId: 'ts_246', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_020', aptitude: 'create' },
    mengwu_hebulehan: { generalId: 'mengwu_hebulehan', tier: 'ordinary', tacticalSkillId: 'ts_234', advantageSkillId: 'ts_007', balanceSkillId: 'ts_234', disadvantageSkillId: 'ts_026', aptitude: 'leverage' },
    shatuo_likeyong: { generalId: 'shatuo_likeyong', tier: 'famous', tacticalSkillId: 'ts_082', strategicSkillId: 'str_01', advantageSkillId: 'ts_082', balanceSkillId: 'ts_607', disadvantageSkillId: 'ts_608', aptitude: 'create' }, // 飞虎突阵
    xueyantuo_yinan: { generalId: 'xueyantuo_yinan', tier: 'famous', tacticalSkillId: 'ts_244', advantageSkillId: 'ts_244', balanceSkillId: 'ts_687', disadvantageSkillId: 'ts_034', strategicSkillId: 'str_13', aptitude: 'create' },
    unassigned_pijiaquekehan: { generalId: 'unassigned_pijiaquekehan', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_14', advantageSkillId: 'ts_023', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_031', aptitude: 'reverse' }, // 回纥漠北固基
    kereyid_wanghan: { generalId: 'kereyid_wanghan', tier: 'ordinary', tacticalSkillId: 'ts_233', advantageSkillId: 'ts_233', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_026', aptitude: 'create' },
    naiman_taiyanghan: { generalId: 'naiman_taiyanghan', tier: 'ordinary', tacticalSkillId: 'ts_151', advantageSkillId: 'ts_390', balanceSkillId: 'ts_151', disadvantageSkillId: 'ts_025', aptitude: 'leverage' }, // 乃蛮末代决战哀兵
    tatar_mieguzhen: { generalId: 'tatar_mieguzhen', tier: 'ordinary', tacticalSkillId: 'ts_038', advantageSkillId: 'ts_028', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_038', aptitude: 'reverse' }, // 塔塔儿长期死战蒙古
    tushetu_tuxietuhan: { generalId: 'tushetu_tuxietuhan', tier: 'ordinary', tacticalSkillId: 'ts_134', advantageSkillId: 'ts_134', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_011', aptitude: 'create' }, // 土谢图固守部境
    zhasaketu_zhasakesubadi: { generalId: 'zhasaketu_zhasakesubadi', tier: 'ordinary', tacticalSkillId: 'ts_071', advantageSkillId: 'ts_071', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_048', aptitude: 'create' }, // 扎萨克图外交周旋
    gaoche_afuzhiluo: { generalId: 'gaoche_afuzhiluo', tier: 'famous', tacticalSkillId: 'ts_229', strategicSkillId: 'str_13', advantageSkillId: 'ts_229', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_415', aptitude: 'create' }, // 高车西迁先稳后打
    tujue_ashinatumen: { generalId: 'tujue_ashinatumen', tier: 'famous', tacticalSkillId: 'ts_088', strategicSkillId: 'str_13', advantageSkillId: 'ts_088', balanceSkillId: 'ts_619', disadvantageSkillId: 'ts_620', aptitude: 'create' }, // 勒兵大破
    da_yuan_kuokuotiemuer: { generalId: 'da_yuan_kuokuotiemuer', tier: 'famous', tacticalSkillId: 'ts_069', strategicSkillId: 'str_11', advantageSkillId: 'ts_486', balanceSkillId: 'ts_069', disadvantageSkillId: 'ts_488', aptitude: 'create' },
    yujiulu_yujiulv: { generalId: 'yujiulu_yujiulv', tier: 'ordinary', tacticalSkillId: 'ts_153', advantageSkillId: 'ts_153', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_416', aptitude: 'create' },
    yaoluoge_yaoluogepusa: { generalId: 'yaoluoge_yaoluogepusa', tier: 'ordinary', tacticalSkillId: 'ts_245', advantageSkillId: 'ts_398', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_245', aptitude: 'reverse' },
    jalair_muhuali: { generalId: 'jalair_muhuali', tier: 'famous', tacticalSkillId: 'ts_231', strategicSkillId: 'str_13', advantageSkillId: 'ts_231', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_019', aptitude: 'create' },
    hongirad_dexuechan: { generalId: 'hongirad_dexuechan', tier: 'ordinary', tacticalSkillId: 'ts_037', advantageSkillId: 'ts_004', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_037', aptitude: 'reverse' }, // 弘吉剌部固守
    tiele_qibiheli: { generalId: 'tiele_qibiheli', tier: 'famous', tacticalSkillId: 'ts_240', strategicSkillId: 'str_01', advantageSkillId: 'ts_240', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_020', aptitude: 'create' },
    ashide_ashidejieli: { generalId: 'ashide_ashidejieli', tier: 'ordinary', tacticalSkillId: 'ts_010', advantageSkillId: 'ts_010', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_036', aptitude: 'create' }, // 颉利南下奇袭渭水
    duolu_ashinahelu: { generalId: 'duolu_ashinahelu', tier: 'ordinary', tacticalSkillId: 'ts_204', advantageSkillId: 'ts_204', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_033', aptitude: 'create' }, // 西突厥十姓外交整合
    cheshihou_angui: { generalId: 'cheshihou_angui', tier: 'ordinary', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_392', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_011', aptitude: 'reverse' },
    kaerka_abadaihan: { generalId: 'kaerka_abadaihan', tier: 'ordinary', tacticalSkillId: 'ts_007', advantageSkillId: 'ts_007', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_412', aptitude: 'create' }, // 喀尔喀统一待变
    huyan_peicen: { generalId: 'huyan_peicen', tier: 'ordinary', tacticalSkillId: 'ts_003', advantageSkillId: 'ts_003', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_414', aptitude: 'create' },
    chahar_yantiemuer: { generalId: 'chahar_yantiemuer', tier: 'famous', tacticalSkillId: 'ts_227', strategicSkillId: 'str_13', advantageSkillId: 'ts_227', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_020', aptitude: 'create' },
    ongut_alawusi: { generalId: 'ongut_alawusi', tier: 'ordinary', tacticalSkillId: 'ts_374', advantageSkillId: 'ts_028', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_374', aptitude: 'reverse' }, // 汪古部外交附蒙
    rouran_shelun: { generalId: 'rouran_shelun', tier: 'famous', tacticalSkillId: 'ts_134', strategicSkillId: 'str_13', advantageSkillId: 'ts_134', balanceSkillId: 'ts_595', disadvantageSkillId: 'ts_596', aptitude: 'create' }, // 柔然脱鲜卑神速立国
    chagatai_genggong: { generalId: 'chagatai_genggong', tier: 'famous', tacticalSkillId: 'ts_386', strategicSkillId: 'str_08', advantageSkillId: 'ts_704', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_386', aptitude: 'reverse' },
    pulei_dougu: { generalId: 'pulei_dougu', tier: 'famous', tacticalSkillId: 'ts_239', strategicSkillId: 'str_01', advantageSkillId: 'ts_239', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_725', aptitude: 'create' },
    xibo_d_tubote: { generalId: 'xibo_d_tubote', tier: 'ordinary', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_402', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_011', aptitude: 'reverse' },
    pugu_puguhuaien: { generalId: 'pugu_puguhuaien', tier: 'famous', tacticalSkillId: 'ts_269', strategicSkillId: 'str_07', advantageSkillId: 'ts_269', balanceSkillId: 'ts_568', disadvantageSkillId: 'ts_569', aptitude: 'create' }, // 平乱后叛唐据守
    pugu_ashinaguduolu: { generalId: 'pugu_ashinaguduolu', tier: 'famous', tacticalSkillId: 'ts_238', strategicSkillId: 'str_13', advantageSkillId: 'ts_238', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_036', aptitude: 'create' },
    kelie_zhaheganbu: { generalId: 'kelie_zhaheganbu', tier: 'ordinary', tacticalSkillId: 'ts_066', advantageSkillId: 'ts_066', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_031', aptitude: 'create' },
    borjigin_tuolei: { generalId: 'borjigin_tuolei', tier: 'famous', tacticalSkillId: 'ts_080', strategicSkillId: 'str_09', advantageSkillId: 'ts_080', balanceSkillId: 'ts_475', disadvantageSkillId: 'ts_476', aptitude: 'create' }, // 三峰山奇袭灭金主力
    zhadalan_zhamuhe: { generalId: 'zhadalan_zhamuhe', tier: 'famous', tacticalSkillId: 'ts_247', strategicSkillId: 'str_03', advantageSkillId: 'ts_247', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_024', aptitude: 'leverage' },
    zhuerqi_sachabieqi: { generalId: 'zhuerqi_sachabieqi', tier: 'ordinary', tacticalSkillId: 'ts_137', advantageSkillId: 'ts_007', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_137', aptitude: 'reverse' }, // 主儿乞部决战
    chechen_chechenhanshuolei: { generalId: 'chechen_chechenhanshuolei', tier: 'ordinary', tacticalSkillId: 'ts_086', advantageSkillId: 'ts_021', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_086', aptitude: 'reverse' }, // 车臣部驻牧固守
    kepantuo_dulimi: { generalId: 'kepantuo_dulimi', tier: 'ordinary', tacticalSkillId: 'ts_058', advantageSkillId: 'ts_058', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_020', aptitude: 'create' },
    huite_amuersana: { generalId: 'huite_amuersana', tier: 'ordinary', tacticalSkillId: 'ts_109', advantageSkillId: 'ts_109', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_035', aptitude: 'create' },
    unassigned_yuchiyao: { generalId: 'unassigned_yuchiyao', tier: 'ordinary', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_009', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_011', aptitude: 'reverse' },
    xingxingxia_zhangyao_x: { generalId: 'xingxingxia_zhangyao_x', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_016', aptitude: 'create' },
    xingxingxia_guoxiaoke: { generalId: 'xingxingxia_guoxiaoke', tier: 'famous', tacticalSkillId: 'ts_366', strategicSkillId: 'str_07', advantageSkillId: 'ts_366', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_034', aptitude: 'create' }, // 郭孝恪置死地
// ── 西域区 2026-06-18 ──
    shache_xian_suoche_shachexian: { generalId: 'shache_xian_suoche_shachexian', tier: 'ordinary', tacticalSkillId: 'ts_024', advantageSkillId: 'ts_007', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_024', aptitude: 'reverse' }, // 莎车王纵横西域外交
    yao_liuyuan: { tacticalSkillId: 'ts_001', generalId: 'yao_liuyuan', tier: 'famous', strategicSkillId: 'str_15', advantageSkillId: 'ts_001', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_061', aptitude: 'create' },
    kong_d_caogui: { generalId: 'kong_d_caogui', tier: 'famous', tacticalSkillId: 'ts_049', strategicSkillId: 'str_05', advantageSkillId: 'ts_049', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_410', aptitude: 'reverse' }, // 曹刿·曲阜(长勺之战·一鼓作气·遂逐齐师)
    yanchuan_d_yuefei: { generalId: 'yanchuan_d_yuefei', tier: 'famous', tacticalSkillId: 'ts_092', strategicSkillId: 'str_04', advantageSkillId: 'ts_092', balanceSkillId: 'ts_420', disadvantageSkillId: 'ts_421', aptitude: 'create' }, // 岳飞·痛饮黄龙/散阵遏骑/空寨掩击·威震华夏
    guide_d_xiaohe: { generalId: 'guide_d_xiaohe', tier: 'ordinary', tacticalSkillId: 'ts_014', advantageSkillId: 'ts_401', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_024', aptitude: 'leverage' }, // 萧何深沟高垒
    tongzhou_liuzhiyuan: { generalId: 'tongzhou_liuzhiyuan', tier: 'ordinary', tacticalSkillId: 'ts_095', advantageSkillId: 'ts_022', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_095', aptitude: 'reverse' },
    unassigned_chenpan: { generalId: 'unassigned_chenpan', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_033', aptitude: 'create' }, // 疏勒王联汉奇袭
    dzungar_galedanceling: { generalId: 'dzungar_galedanceling', tier: 'famous', tacticalSkillId: 'ts_090', strategicSkillId: 'str_10', advantageSkillId: 'ts_504', balanceSkillId: 'ts_090', disadvantageSkillId: 'ts_506', aptitude: 'create' },
    tuerhute_wobaxi: { generalId: 'tuerhute_wobaxi', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_037', aptitude: 'create' }, // 土尔扈特万里东归
    gaochang_quwentai: { generalId: 'gaochang_quwentai', tier: 'ordinary', tacticalSkillId: 'ts_018', advantageSkillId: 'ts_392', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_018', aptitude: 'reverse' },
    yarkand_abudulatifu: { generalId: 'yarkand_abudulatifu', tier: 'ordinary', tacticalSkillId: 'ts_039', advantageSkillId: 'ts_047', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_039', aptitude: 'reverse' }, // 叶尔羌名将死战准清
    yiduhu_baershu: { generalId: 'yiduhu_baershu', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_026', aptitude: 'create' }, // 亦都护外交归附蒙古
    yuchi_weichiyao: { generalId: 'yuchi_weichiyao', tier: 'ordinary', tacticalSkillId: 'ts_038', advantageSkillId: 'ts_023', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_038', aptitude: 'reverse' }, // 于阗王入唐勤王守城
    zhuxie_zhuxiechixin: { generalId: 'zhuxie_zhuxiechixin', tier: 'ordinary', tacticalSkillId: 'ts_007', advantageSkillId: 'ts_007', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_416', aptitude: 'create' }, // 朱邪赤心骑破庞勋
    saman_yisimayi: { generalId: 'saman_yisimayi', tier: 'famous', tacticalSkillId: 'ts_302', strategicSkillId: 'str_13', advantageSkillId: 'ts_302', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_716', aptitude: 'leverage' }, // 萨曼埃米尔巴尔赫以逸待劳
    tujishi_sulukehan: { generalId: 'tujishi_sulukehan', tier: 'famous', tacticalSkillId: 'ts_312', strategicSkillId: 'str_13', advantageSkillId: 'ts_312', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_045', aptitude: 'create' },
    xiliao_yelvdashi: { generalId: 'xiliao_yelvdashi', tier: 'famous', tacticalSkillId: 'ts_138', strategicSkillId: 'str_01', advantageSkillId: 'ts_645', balanceSkillId: 'ts_646', disadvantageSkillId: 'ts_138', aptitude: 'create' },
    jiazini_mahamaode: { generalId: 'jiazini_mahamaode', tier: 'famous', tacticalSkillId: 'ts_354', strategicSkillId: 'str_11', advantageSkillId: 'ts_354', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_025', aptitude: 'create' }, // 马哈茂德十七征印度
    an_xibanni: { generalId: 'an_xibanni', tier: 'famous', tacticalSkillId: 'ts_308', strategicSkillId: 'str_07', advantageSkillId: 'ts_308', balanceSkillId: 'ts_689', disadvantageSkillId: 'ts_020', aptitude: 'create' }, // 昔班尼攻布哈拉建汗国
    wusun_liejiaomi: { generalId: 'wusun_liejiaomi', tier: 'famous', tacticalSkillId: 'ts_313', strategicSkillId: 'str_13', advantageSkillId: 'ts_313', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_025', aptitude: 'create' }, // 乌孙昆莫西迁奇袭月氏
    xijue_ganyanshou: { generalId: 'xijue_ganyanshou', tier: 'ordinary', tacticalSkillId: 'ts_311', advantageSkillId: 'ts_311', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_037', aptitude: 'create' },

// ── 中亚区 2026-06-18 ──
    huarazim_mohemo: { generalId: 'huarazim_mohemo', tier: 'famous', tacticalSkillId: 'ts_139', strategicSkillId: 'str_13', advantageSkillId: 'ts_139', balanceSkillId: 'ts_526', disadvantageSkillId: 'ts_527', aptitude: 'create' },
    kazakh_hasimu: { generalId: 'kazakh_hasimu', tier: 'famous', tacticalSkillId: 'ts_140', strategicSkillId: 'str_01', advantageSkillId: 'ts_140', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_416', aptitude: 'create' }, // 哈萨克汗国统一
    sogdian_dewasitiqi: { generalId: 'sogdian_dewasitiqi', tier: 'ordinary', tacticalSkillId: 'ts_026', advantageSkillId: 'ts_003', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_026', aptitude: 'reverse' }, // 粟特抗阿拉伯
    yanda_touluoman: { generalId: 'yanda_touluoman', tier: 'famous', tacticalSkillId: 'ts_367', strategicSkillId: 'str_12', advantageSkillId: 'ts_367', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_417', aptitude: 'create' },
    yada_ahexiong: { generalId: 'yada_ahexiong', tier: 'famous', tacticalSkillId: 'ts_355', strategicSkillId: 'str_03', advantageSkillId: 'ts_355', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_721', aptitude: 'create' },
    anushidgin_yile: { generalId: 'anushidgin_yile', tier: 'ordinary', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_047', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_011', aptitude: 'reverse' },
    unassigned_muhanmodeguli: { generalId: 'unassigned_muhanmodeguli', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_12', advantageSkillId: 'ts_021', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_415', aptitude: 'create' }, // 第二次塔兰战役佯败破印军
    jibin_jianisejia: { generalId: 'jibin_jianisejia', tier: 'famous', tacticalSkillId: 'ts_357', strategicSkillId: 'str_03', advantageSkillId: 'ts_357', balanceSkillId: 'ts_698', disadvantageSkillId: 'ts_416', aptitude: 'create' },
    qincha_baqiman: { generalId: 'qincha_baqiman', tier: 'ordinary', tacticalSkillId: 'ts_152', advantageSkillId: 'ts_152', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_019', aptitude: 'create' }, // 钦察游击抗蒙
    dayuan_wugua: { generalId: 'dayuan_wugua', tier: 'ordinary', tacticalSkillId: 'ts_166', advantageSkillId: 'ts_028', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_166', aptitude: 'reverse' }, // 大宛王抗汉
    kokand_alimukuli: { generalId: 'kokand_alimukuli', tier: 'ordinary', tacticalSkillId: 'ts_006', advantageSkillId: 'ts_004', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_006', aptitude: 'reverse' }, // 浩罕抗俄
    unassigned_agubai: { generalId: 'unassigned_agubai', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_10', advantageSkillId: 'ts_028', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_031', aptitude: 'reverse' }, // 哲德沙尔建国
    dayuzi_yinalechihei: { generalId: 'dayuzi_yinalechihei', tier: 'ordinary', tacticalSkillId: 'ts_088', advantageSkillId: 'ts_088', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_409', aptitude: 'create' },
    shi_clan_moheduotutun: { generalId: 'shi_clan_moheduotutun', tier: 'ordinary', tacticalSkillId: 'ts_037', advantageSkillId: 'ts_003', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_037', aptitude: 'reverse' }, // 石国王·唐册封吐屯
    mamon_mameng: { generalId: 'mamon_mameng', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_045', aptitude: 'create' },
    jie_sijinti: { generalId: 'jie_sijinti', tier: 'ordinary', tacticalSkillId: 'ts_032', advantageSkillId: 'ts_022', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_032', aptitude: 'reverse' }, // 羯霜那·唐册封史国王
    unassigned_shaboluo: { generalId: 'unassigned_shaboluo', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_13', advantageSkillId: 'ts_399', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_031', aptitude: 'reverse' }, // 十箭部落西突厥
    maer_d_bahelamuchubin: { generalId: 'maer_d_bahelamuchubin', tier: 'famous', tacticalSkillId: 'ts_358', strategicSkillId: 'str_07', advantageSkillId: 'ts_358', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_026', aptitude: 'leverage' },
    wugu_d_tugelile: { generalId: 'wugu_d_tugelile', tier: 'famous', tacticalSkillId: 'ts_319', strategicSkillId: 'str_13', advantageSkillId: 'ts_319', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_036', aptitude: 'create' },
    loulan_suojie: { generalId: 'loulan_suojie', tier: 'ordinary', tacticalSkillId: 'ts_041', advantageSkillId: 'ts_030', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_041', aptitude: 'reverse' }, // 精绝屯田戍边抗北匈奴
    adao_d_mafushou: { generalId: 'adao_d_mafushou', tier: 'ordinary', tacticalSkillId: 'ts_010', advantageSkillId: 'ts_010', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_413', aptitude: 'create' }, // 昆岗军台守驿
    wuyuan_d_chengui: { generalId: 'wuyuan_d_chengui', tier: 'ordinary', tacticalSkillId: 'ts_010', advantageSkillId: 'ts_010', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_034', aptitude: 'create' }, // 度辽将军守五原北塞
    chenli_d_wutang: { generalId: 'chenli_d_wutang', tier: 'ordinary', tacticalSkillId: 'ts_145', advantageSkillId: 'ts_145', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_409', aptitude: 'create' }, // 度辽将军护南匈奴
    nuoyan_d_sanyinnuoyan: { generalId: 'nuoyan_d_sanyinnuoyan', tier: 'ordinary', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_029', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_011', aptitude: 'reverse' }, // 赛音诺颜部
    wuli_d_celeng: { generalId: 'wuli_d_celeng', tier: 'ordinary', tacticalSkillId: 'ts_100', advantageSkillId: 'ts_399', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_100', aptitude: 'reverse' }, // 定边左副将军乌里雅苏台

    unassigned_qizhijian: { generalId: 'unassigned_qizhijian', tier: 'ordinary', tacticalSkillId: 'ts_031', advantageSkillId: 'ts_029', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_031', aptitude: 'reverse' }, // 东汉鲜卑大人寇边
    heisha_d_houlihu: { generalId: 'heisha_d_houlihu', tier: 'ordinary', tacticalSkillId: 'ts_233', advantageSkillId: 'ts_233', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_045', aptitude: 'create' }, // 匈奴右贤王呴犁湖·控弦称雄（《史记·匈奴列传》控弦之士，草原骑射；满万无敌归阿骨打独占）
    khoja_apakehezhuo: { generalId: 'khoja_apakehezhuo', tier: 'ordinary', tacticalSkillId: 'ts_127', advantageSkillId: 'ts_127', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_412', aptitude: 'create' }, // 白山派领袖据守休循
    fanyanna_xieer: { generalId: 'fanyanna_xieer', tier: 'ordinary', tacticalSkillId: 'ts_024', advantageSkillId: 'ts_047', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_024', aptitude: 'reverse' }, // 梵衍那王率僧兵御大食
    kangju_chebishi: { generalId: 'kangju_chebishi', tier: 'ordinary', tacticalSkillId: 'ts_104', advantageSkillId: 'ts_029', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_104', aptitude: 'reverse' }, // 石国王车鼻施康卡
    zhaowu_timuermieli: { generalId: 'zhaowu_timuermieli', tier: 'ordinary', tacticalSkillId: 'ts_098', advantageSkillId: 'ts_047', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_098', aptitude: 'reverse' },
    qiepantuo_luozhentan: { generalId: 'qiepantuo_luozhentan', tier: 'ordinary', tacticalSkillId: 'ts_110', advantageSkillId: 'ts_401', balanceSkillId: 'ts_110', disadvantageSkillId: 'ts_411', aptitude: 'leverage' }, // 护密王守瓦罕走廊
    // ── 中国将·西域 2026-06-18 ──
    quli_chentang: { generalId: 'quli_chentang', tier: 'famous', tacticalSkillId: 'ts_277', strategicSkillId: 'str_07', advantageSkillId: 'ts_277', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_715', aptitude: 'create' },
    nandou_sushili: { generalId: 'nandou_sushili', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_001', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_041', aptitude: 'create' }, // 小勃律王据守孽多
    unassigned_genggong: { generalId: 'unassigned_genggong', tier: 'famous', tacticalSkillId: 'ts_020', strategicSkillId: 'str_14', advantageSkillId: 'ts_004', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_020', aptitude: 'reverse' }, // 疏勒孤军苦撑
    juandu_peixingjian: { generalId: 'juandu_peixingjian', tier: 'famous', tacticalSkillId: 'ts_284', advantageSkillId: 'ts_284', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_041', strategicSkillId: 'str_07', aptitude: 'leverage' },
    
// ── 青藏区 2026-06-18 ──
    tubo_songzanganbu: { generalId: 'tubo_songzanganbu', tier: 'famous', tacticalSkillId: 'ts_070', strategicSkillId: 'str_14', advantageSkillId: 'ts_070', balanceSkillId: 'ts_616', disadvantageSkillId: 'ts_617', aptitude: 'create' }, // 兼并诸羌（统一青藏）
    song2_houjunji: { generalId: 'song2_houjunji', tier: 'famous', tacticalSkillId: 'ts_285', strategicSkillId: 'str_07', advantageSkillId: 'ts_285', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_011', aptitude: 'create' },
    gongbu_gongbumangbuzhi: { generalId: 'gongbu_gongbumangbuzhi', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_037', aptitude: 'create' }, // 工布小王
    khon_basiba: { generalId: 'khon_basiba', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_034', aptitude: 'create' }, // 萨迦帝师
    xiadun_xiazhongawanglangjie: { generalId: 'xiadun_xiazhongawanglangjie', tier: 'famous', tacticalSkillId: 'ts_368', strategicSkillId: 'str_14', advantageSkillId: 'ts_400', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_368', aptitude: 'leverage' },
    gar_lunqinling: { generalId: 'gar_lunqinling', tier: 'famous', tacticalSkillId: 'ts_086', strategicSkillId: 'str_13', advantageSkillId: 'ts_513', balanceSkillId: 'ts_514', disadvantageSkillId: 'ts_086', aptitude: 'create' }, // 以逸待劳
    duomi_lunkongre: { generalId: 'duomi_lunkongre', tier: 'ordinary', tacticalSkillId: 'ts_007', advantageSkillId: 'ts_007', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_026', aptitude: 'create' }, // 吐蕃末将
    dulan_dashibatuer: { generalId: 'dulan_dashibatuer', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_025', aptitude: 'create' },
    tufa_d_tufanutan: { generalId: 'tufa_d_tufanutan', tier: 'ordinary', tacticalSkillId: 'ts_007', advantageSkillId: 'ts_007', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_039', aptitude: 'create' }, // 南凉君主
    qifu_d_qifuchipan: { generalId: 'qifu_d_qifuchipan', tier: 'famous', tacticalSkillId: 'ts_306', strategicSkillId: 'str_06', advantageSkillId: 'ts_306', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_020', aptitude: 'create' },
    tuyu_d_kualv: { generalId: 'tuyu_d_kualv', tier: 'famous', tacticalSkillId: 'ts_301', strategicSkillId: 'str_13', advantageSkillId: 'ts_301', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_415', aptitude: 'create' }, // 吐谷浑可汗
    dafeichuan_nuohebo: { generalId: 'dafeichuan_nuohebo', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_409', aptitude: 'create' },
    gaxa_zhashi: { generalId: 'gaxa_zhashi', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_038', aptitude: 'create' }, // 噶厦代本
    jinchuan_g_shaluoben: { generalId: 'jinchuan_g_shaluoben', tier: 'ordinary', tacticalSkillId: 'ts_369', advantageSkillId: 'ts_047', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_369', aptitude: 'reverse' },
    xiangxiong_limixia_x: { generalId: 'xiangxiong_limixia_x', tier: 'ordinary', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_391', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_011', aptitude: 'reverse' }, // 象雄末王
    ladakh_senggelangjie: { generalId: 'ladakh_senggelangjie', tier: 'famous', tacticalSkillId: 'ts_370', strategicSkillId: 'str_08', advantageSkillId: 'ts_370', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_016', aptitude: 'create' },
    khoshut_gushihan: { generalId: 'khoshut_gushihan', tier: 'famous', tacticalSkillId: 'ts_071', strategicSkillId: 'str_13', advantageSkillId: 'ts_071', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_041', aptitude: 'create' }, // 锐不可当（和硕特入藏）
    nvguo_mojie: { generalId: 'nvguo_mojie', tier: 'ordinary', tacticalSkillId: 'ts_031', advantageSkillId: 'ts_030', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_031', aptitude: 'reverse' }, // 女国女王
    karmapa_queyingduoji: { generalId: 'karmapa_queyingduoji', tier: 'ordinary', tacticalSkillId: 'ts_016', advantageSkillId: 'ts_009', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_016', aptitude: 'reverse' }, // 噶玛巴活佛
    xianlingqiang_dianling: { generalId: 'xianlingqiang_dianling', tier: 'famous', tacticalSkillId: 'ts_336', strategicSkillId: 'str_09', advantageSkillId: 'ts_336', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_409', aptitude: 'reverse' },
    lang_clan_jiangqujianzan: { generalId: 'lang_clan_jiangqujianzan', tier: 'famous', tacticalSkillId: 'ts_317', strategicSkillId: 'str_14', advantageSkillId: 'ts_317', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_045', aptitude: 'create' }, // 帕竹立国
    xiutu_jinridi: { generalId: 'xiutu_jinridi', tier: 'ordinary', tacticalSkillId: 'ts_017', advantageSkillId: 'ts_047', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_017', aptitude: 'reverse' },
    gandenpozhang_dibasangjiejiacuo: { generalId: 'gandenpozhang_dibasangjiejiacuo', tier: 'ordinary', tacticalSkillId: 'ts_024', advantageSkillId: 'ts_402', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_024', aptitude: 'reverse' },
    khyungpo_qiongbobangse: { generalId: 'khyungpo_qiongbobangse', tier: 'famous', tacticalSkillId: 'ts_371', strategicSkillId: 'str_13', advantageSkillId: 'ts_371', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_718', aptitude: 'create' }, // 吐蕃大论
    gar_kham_dengbazeren: { generalId: 'gar_kham_dengbazeren', tier: 'ordinary', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_401', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_011', aptitude: 'reverse' }, // 德格土司
    lanzhou_zhaochongguo: { generalId: 'lanzhou_zhaochongguo', tier: 'famous', tacticalSkillId: 'ts_264', strategicSkillId: 'str_14', advantageSkillId: 'ts_264', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_026', aptitude: 'leverage' },
    supi_xinuoluo: { generalId: 'supi_xinuoluo', tier: 'famous', tacticalSkillId: 'ts_372', strategicSkillId: 'str_10', advantageSkillId: 'ts_372', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_036', aptitude: 'create' }, // 苏毗附唐
    tsangpa_pengcuonanjie: { generalId: 'tsangpa_pengcuonanjie', tier: 'famous', tacticalSkillId: 'ts_349', strategicSkillId: 'str_14', advantageSkillId: 'ts_349', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_419', aptitude: 'create' }, // 藏巴汗立国
    spurgyal_dariniansai: { generalId: 'spurgyal_dariniansai', tier: 'ordinary', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_029', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_011', aptitude: 'reverse' },
    galangdiba_wangqindundui: { generalId: 'galangdiba_wangqindundui', tier: 'ordinary', tacticalSkillId: 'ts_025', advantageSkillId: 'ts_004', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_025', aptitude: 'reverse' }, // 波密抗清
    fuguo_yizeng: { generalId: 'fuguo_yizeng', tier: 'ordinary', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_392', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_011', aptitude: 'reverse' }, // 附国王
    bailang_tangzeng: { generalId: 'bailang_tangzeng', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_018', aptitude: 'create' }, // 白狼王
    humi_zhentan: { generalId: 'humi_zhentan', tier: 'ordinary', tacticalSkillId: 'ts_049', advantageSkillId: 'ts_049', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_045', aptitude: 'create' }, // 护密王
    xiaobolu_meijinmang: { generalId: 'xiaobolu_meijinmang', tier: 'ordinary', tacticalSkillId: 'ts_134', advantageSkillId: 'ts_134', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_011', aptitude: 'create' }, // 小勃律破吐蕃
    guge_chizhaxichabade: { generalId: 'guge_chizhaxichabade', tier: 'ordinary', tacticalSkillId: 'ts_086', advantageSkillId: 'ts_030', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_086', aptitude: 'reverse' }, // 古格末王
    // ── 滇缅区 2026-06-18 ──
    pazhu_redangunsangpa: { generalId: 'pazhu_redangunsangpa', tier: 'ordinary', tacticalSkillId: 'ts_152', advantageSkillId: 'ts_152', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_410', aptitude: 'create' },
    dali_duansiping: { generalId: 'dali_duansiping', tier: 'famous', tacticalSkillId: 'ts_144', strategicSkillId: 'str_14', advantageSkillId: 'ts_007', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_144', aptitude: 'reverse' },
    dongxu_mangruiti: { generalId: 'dongxu_mangruiti', tier: 'famous', tacticalSkillId: 'ts_304', strategicSkillId: 'str_13', advantageSkillId: 'ts_304', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_416', aptitude: 'create' },
    mu_lijiang_muzeng: { generalId: 'mu_lijiang_muzeng', tier: 'ordinary', tacticalSkillId: 'ts_099', advantageSkillId: 'ts_002', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_099', aptitude: 'reverse' },
    dianguo_zhuangqiao: { generalId: 'dianguo_zhuangqiao', tier: 'famous', tacticalSkillId: 'ts_341', strategicSkillId: 'str_03', advantageSkillId: 'ts_341', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_033', aptitude: 'create' },
    konbaung_yongjiya: { generalId: 'konbaung_yongjiya', tier: 'famous', tacticalSkillId: 'ts_373', strategicSkillId: 'str_14', advantageSkillId: 'ts_373', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_031', aptitude: 'create' },
    nanzhao_geluofeng: { generalId: 'nanzhao_geluofeng', tier: 'famous', tacticalSkillId: 'ts_268', strategicSkillId: 'str_13', advantageSkillId: 'ts_268', balanceSkillId: 'ts_700', disadvantageSkillId: 'ts_008', aptitude: 'leverage' }, // 天宝战争击唐
    wuman_cuanguiwang: { generalId: 'wuman_cuanguiwang', tier: 'ordinary', tacticalSkillId: 'ts_096', advantageSkillId: 'ts_002', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_096', aptitude: 'reverse' }, // 东爨乌蛮首领
    dai_daoyingmeng: { generalId: 'dai_daoyingmeng', tier: 'ordinary', tacticalSkillId: 'ts_151', advantageSkillId: 'ts_401', balanceSkillId: 'ts_151', disadvantageSkillId: 'ts_035', aptitude: 'leverage' }, // 车里宣慰征缅
    taiyuan_menglai: { generalId: 'taiyuan_menglai', tier: 'famous', tacticalSkillId: 'ts_314', strategicSkillId: 'str_10', advantageSkillId: 'ts_314', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_410', aptitude: 'create' },
    suke_langanheng: { generalId: 'suke_langanheng', tier: 'ordinary', tacticalSkillId: 'ts_088', advantageSkillId: 'ts_088', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_018', aptitude: 'create' },
    luchuan_sirenfa: { generalId: 'luchuan_sirenfa', tier: 'famous', tacticalSkillId: 'ts_303', strategicSkillId: 'str_09', advantageSkillId: 'ts_303', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_040', aptitude: 'reverse' }, // 麓川大败明军
    kunming_yi_lucheng: { generalId: 'kunming_yi_lucheng', tier: 'ordinary', tacticalSkillId: 'ts_167', advantageSkillId: 'ts_005', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_167', aptitude: 'reverse' },
    cuanshi_cuanlongyan: { generalId: 'cuanshi_cuanlongyan', tier: 'ordinary', tacticalSkillId: 'ts_374', advantageSkillId: 'ts_009', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_374', aptitude: 'reverse' }, // 爨氏镇南中
    baiman_gaoshengtai: { generalId: 'baiman_gaoshengtai', tier: 'ordinary', tacticalSkillId: 'ts_024', advantageSkillId: 'ts_392', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_024', aptitude: 'reverse' }, // 大理权相
    champa_zhipenge: { generalId: 'champa_zhipenge', tier: 'famous', tacticalSkillId: 'ts_347', strategicSkillId: 'str_01', advantageSkillId: 'ts_347', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_024', aptitude: 'create' }, // 占婆水师破越
    qiong_rengui: { generalId: 'qiong_rengui', tier: 'ordinary', tacticalSkillId: 'ts_137', advantageSkillId: 'ts_389', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_137', aptitude: 'reverse' }, // 邛谷王据郡
    hantawadi_mangyinglong: { generalId: 'hantawadi_mangyinglong', tier: 'famous', tacticalSkillId: 'ts_142', strategicSkillId: 'str_12', advantageSkillId: 'ts_142', balanceSkillId: 'ts_523', disadvantageSkillId: 'ts_524', aptitude: 'create' }, // 东吁帝国鼎盛
    daozhou_yangzaixing: { generalId: 'daozhou_yangzaixing', tier: 'ordinary', tacticalSkillId: 'ts_111', advantageSkillId: 'ts_007', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_111', aptitude: 'reverse' },
  // ── 岭南/越南/台湾区 2026-06-18 ──
    guangzhou_liuyin: { generalId: 'guangzhou_liuyin', tier: 'ordinary', tacticalSkillId: 'ts_058', advantageSkillId: 'ts_058', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_008', aptitude: 'create' }, // 清海军节度岭南
    luoping_zhangshijie: { generalId: 'luoping_zhangshijie', tier: 'ordinary', tacticalSkillId: 'ts_034', advantageSkillId: 'ts_030', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_034', aptitude: 'reverse' }, // 崖山海战
    chaozhou_d_mafa: { generalId: 'chaozhou_d_mafa', tier: 'ordinary', tacticalSkillId: 'ts_033', advantageSkillId: 'ts_047', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_033', aptitude: 'reverse' }, // 马发潮州
    chendiaoyan_chendiaoyan: { generalId: 'chendiaoyan_chendiaoyan', tier: 'ordinary', tacticalSkillId: 'ts_034', advantageSkillId: 'ts_027', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_034', aptitude: 'reverse' }, // 漳州抗元
    dengmaoqi_dengmaoqi: { generalId: 'dengmaoqi_dengmaoqi', tier: 'ordinary', tacticalSkillId: 'ts_032', advantageSkillId: 'ts_004', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_032', aptitude: 'reverse' }, // 铲平王起义
    geng_gengjingzhong: { generalId: 'geng_gengjingzhong', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_418', aptitude: 'create' }, // 靖南王·三藩率先起兵，先声夺人（原 ts_029 肉薄骨并=血战到死，与降将不符，2026-07-06 换）
    longwu_huangdaozhou: { generalId: 'longwu_huangdaozhou', tier: 'ordinary', tacticalSkillId: 'ts_018', advantageSkillId: 'ts_003', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_018', aptitude: 'reverse' }, // 隆武抗清
    jing_dingbuling: { generalId: 'jing_dingbuling', tier: 'ordinary', tacticalSkillId: 'ts_010', advantageSkillId: 'ts_010', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_409', aptitude: 'create' }, // 丁朝统一
    paiwan_alugu: { generalId: 'paiwan_alugu', tier: 'ordinary', tacticalSkillId: 'ts_159', advantageSkillId: 'ts_007', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_159', aptitude: 'reverse' }, // 牡丹社抗倭
    ming_zheng_zhengchenggong: { generalId: 'ming_zheng_zhengchenggong', tier: 'famous', tacticalSkillId: 'ts_085', strategicSkillId: 'str_07', advantageSkillId: 'ts_085', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_039', aptitude: 'leverage' },
    unassigned_ruanhuang: { generalId: 'unassigned_ruanhuang', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_10', advantageSkillId: 'ts_001', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_035', aptitude: 'create' }, // 广南奠基
    zhuang_d_washifuren: { generalId: 'zhuang_d_washifuren', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_001', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_026', aptitude: 'create' }, // 俍兵抗倭
    nanyue_zhaotuo: { generalId: 'nanyue_zhaotuo', tier: 'famous', tacticalSkillId: 'ts_289', strategicSkillId: 'str_14', advantageSkillId: 'ts_289', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_016', aptitude: 'create' },
    zhancheng_zhimin: { generalId: 'zhancheng_zhimin', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_037', aptitude: 'create' },
    xiou_yixusong: { generalId: 'xiou_yixusong', tier: 'ordinary', tacticalSkillId: 'ts_041', advantageSkillId: 'ts_402', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_041', aptitude: 'reverse' }, // 西瓯抗秦
    gouding_wubo: { generalId: 'gouding_wubo', tier: 'ordinary', tacticalSkillId: 'ts_095', advantageSkillId: 'ts_023', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_095', aptitude: 'reverse' }, // 句町助汉
    chen_chenbaxian: { generalId: 'chen_chenbaxian', tier: 'famous', tacticalSkillId: 'ts_327', strategicSkillId: 'str_08', advantageSkillId: 'ts_327', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_045', aptitude: 'create' },
    dayu_wangshouren: { generalId: 'dayu_wangshouren', tier: 'famous', tacticalSkillId: 'ts_260', strategicSkillId: 'str_02', advantageSkillId: 'ts_401', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_260', aptitude: 'leverage' },
    paiyao_huangguasi: { generalId: 'paiyao_huangguasi', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_017', aptitude: 'create' }, // 排瑶起义
    yingzhou_liuyan: { generalId: 'yingzhou_liuyan', tier: 'ordinary', tacticalSkillId: 'ts_010', advantageSkillId: 'ts_010', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_035', aptitude: 'create' }, // 南汉高祖
    linyi_fanyangmai: { generalId: 'linyi_fanyangmai', tier: 'ordinary', tacticalSkillId: 'ts_026', advantageSkillId: 'ts_398', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_026', aptitude: 'reverse' }, // 林邑王抗南朝
    xian_d_xianfuren: { generalId: 'xian_d_xianfuren', tier: 'famous', tacticalSkillId: 'ts_290', strategicSkillId: 'str_14', advantageSkillId: 'ts_047', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_290', aptitude: 'create' },
    luodian_shexiang: { generalId: 'luodian_shexiang', tier: 'ordinary', tacticalSkillId: 'ts_035', advantageSkillId: 'ts_401', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_035', aptitude: 'reverse' }, // 水西土司
    nong2_nongzhigao: { generalId: 'nong2_nongzhigao', tier: 'famous', tacticalSkillId: 'ts_337', strategicSkillId: 'str_09', advantageSkillId: 'ts_337', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_036', aptitude: 'create' },
    guizhou_lidingguo: { generalId: 'guizhou_lidingguo', tier: 'famous', tacticalSkillId: 'ts_079', strategicSkillId: 'str_10', advantageSkillId: 'ts_079', balanceSkillId: 'ts_517', disadvantageSkillId: 'ts_518', aptitude: 'leverage' }, // 两蹶名王
    taiping_shidakai: { generalId: 'taiping_shidakai', tier: 'famous', tacticalSkillId: 'ts_075', strategicSkillId: 'str_09', advantageSkillId: 'ts_683', balanceSkillId: 'ts_075', disadvantageSkillId: 'ts_685', aptitude: 'create' }, // 出没如神（翼王征战）
    dongzu_wumian: { generalId: 'dongzu_wumian', tier: 'ordinary', tacticalSkillId: 'ts_038', advantageSkillId: 'ts_030', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_038', aptitude: 'reverse' }, // 侗族起义
    tian_sizhou_tianyougong: { generalId: 'tian_sizhou_tianyougong', tier: 'ordinary', tacticalSkillId: 'ts_065', advantageSkillId: 'ts_047', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_065', aptitude: 'reverse' },
    luoyue_zhengce: { generalId: 'luoyue_zhengce', tier: 'ordinary', tacticalSkillId: 'ts_006', advantageSkillId: 'ts_021', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_006', aptitude: 'reverse' }, // 骆越反汉
    li_s_mayuan: { generalId: 'li_s_mayuan', tier: 'famous', tacticalSkillId: 'ts_178', strategicSkillId: 'str_07', advantageSkillId: 'ts_178', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_018', aptitude: 'leverage' }, // 马援·海门(伏波远征)
    leloi: { generalId: 'leloi', tier: 'famous', tacticalSkillId: 'ts_073', strategicSkillId: 'str_09', advantageSkillId: 'ts_705', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_073', aptitude: 'reverse' }, // 以弱敌强（黎利抗明）
    dacheng_chenkai: { generalId: 'dacheng_chenkai', tier: 'ordinary', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_030', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_011', aptitude: 'reverse' }, // 大成国起义
    dayue_chenguojun: { generalId: 'dayue_chenguojun', tier: 'famous', tacticalSkillId: 'ts_061', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_061', aptitude: 'leverage' }, // 以短制长（白藤江抗蒙三捷开局削兵）
    shengmiao_baoli: { generalId: 'shengmiao_baoli', tier: 'ordinary', tacticalSkillId: 'ts_026', advantageSkillId: 'ts_004', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_026', aptitude: 'reverse' }, // 苗民起义
    miao_qing_yangwanzhe: { generalId: 'miao_qing_yangwanzhe', tier: 'famous', tacticalSkillId: 'ts_356', strategicSkillId: 'str_09', advantageSkillId: 'ts_356', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_006', aptitude: 'create' },
    unassigned_zhuyoulang: { generalId: 'unassigned_zhuyoulang', tier: 'ordinary', tacticalSkillId: 'ts_035', advantageSkillId: 'ts_010', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_035', aptitude: 'reverse' }, // 永历帝抗清
    xinjiang_maji: { generalId: 'xinjiang_maji', tier: 'ordinary', tacticalSkillId: 'ts_033', advantageSkillId: 'ts_390', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_033', aptitude: 'reverse' }, // 肇庆摧锋军抗元
    liren_funanshe: { generalId: 'liren_funanshe', tier: 'ordinary', tacticalSkillId: 'ts_166', advantageSkillId: 'ts_028', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_166', aptitude: 'reverse' }, // 黎族起义
    unassigned_liuyongfu: { generalId: 'unassigned_liuyongfu', tier: 'famous', tacticalSkillId: 'ts_017', strategicSkillId: 'str_10', advantageSkillId: 'ts_030', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_017', aptitude: 'reverse' }, // 黑旗抗法·丛林山地游击
    yelang_duotong: { generalId: 'yelang_duotong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_001', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_039', aptitude: 'create' }, // 夜郎王
    zangke_xielongyu: { generalId: 'zangke_xielongyu', tier: 'ordinary', tacticalSkillId: 'ts_104', advantageSkillId: 'ts_004', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_104', aptitude: 'reverse' }, // 牂牁归唐
    xinggu_cuanxi: { generalId: 'xinggu_cuanxi', tier: 'ordinary', tacticalSkillId: 'ts_024', advantageSkillId: 'ts_023', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_024', aptitude: 'reverse' }, // 兴古从征
    guangxin_shixie: { generalId: 'guangxin_shixie', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_001', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_020', aptitude: 'create' }, // 交趾割据
    ryukyu_shangbazhi: { generalId: 'ryukyu_shangbazhi', tier: 'ordinary', tacticalSkillId: 'ts_007', advantageSkillId: 'ts_007', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_045', aptitude: 'create' }, // 琉球三山统一
    shaozhou_zhangzhensun: { generalId: 'shaozhou_zhangzhensun', tier: 'ordinary', tacticalSkillId: 'ts_038', advantageSkillId: 'ts_047', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_038', aptitude: 'reverse' }, // 韶关抗元·大庾岭殉国
    shixing_houandou: { generalId: 'shixing_houandou', tier: 'famous', tacticalSkillId: 'ts_328', strategicSkillId: 'str_09', advantageSkillId: 'ts_328', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_020', aptitude: 'create' },
    buyi_d_weichaoyuan: { generalId: 'buyi_d_weichaoyuan', tier: 'ordinary', tacticalSkillId: 'ts_100', advantageSkillId: 'ts_391', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_100', aptitude: 'reverse' },
    lizhou_d_liaohua: { generalId: 'lizhou_d_liaohua', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_001', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_418', aptitude: 'create' }, // 廖化置死地
    kui_gongsunshu: { generalId: 'kui_gongsunshu', tier: 'ordinary', tacticalSkillId: 'ts_096', advantageSkillId: 'ts_022', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_096', aptitude: 'reverse' }, // 公孙述白帝
    yang_bozhou_yangyinglong: { generalId: 'yang_bozhou_yangyinglong', tier: 'ordinary', tacticalSkillId: 'ts_151', advantageSkillId: 'ts_030', balanceSkillId: 'ts_151', disadvantageSkillId: 'ts_410', aptitude: 'leverage' }, // 播州末代
    chenghan_lite: { generalId: 'chenghan_lite', tier: 'famous', tacticalSkillId: 'ts_143', strategicSkillId: 'str_13', advantageSkillId: 'ts_400', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_143', aptitude: 'reverse' }, // 成汉开国
    agui: { generalId: 'agui', tier: 'famous', tacticalSkillId: 'ts_291', strategicSkillId: 'str_07', advantageSkillId: 'ts_291', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_714', aptitude: 'create' },
    zuo_d_wufu: { generalId: 'zuo_d_wufu', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_412', aptitude: 'create' }, // 明代平南中
    wumeng_azi: { generalId: 'wumeng_azi', tier: 'ordinary', tacticalSkillId: 'ts_098', advantageSkillId: 'ts_047', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_098', aptitude: 'reverse' }, // 乌蒙土司
// ── 巴蜀区 2026-06-18 ──
      huizhou_zhugeliang: { generalId: 'huizhou_zhugeliang', tier: 'famous', tacticalSkillId: 'ts_159', strategicSkillId: 'str_02', advantageSkillId: 'ts_002', balanceSkillId: 'ts_695', disadvantageSkillId: 'ts_159', aptitude: 'leverage' }, // 诸葛亮六出祁山·木牛流马八阵图（因地制宜）
    wudu_dengai: { generalId: 'wudu_dengai', tier: 'famous', tacticalSkillId: 'ts_162', strategicSkillId: 'str_10', advantageSkillId: 'ts_162', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_032', aptitude: 'leverage' },
      baishui_yanghuai: { generalId: 'baishui_yanghuai', tier: 'ordinary', tacticalSkillId: 'ts_144', advantageSkillId: 'ts_009', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_144', aptitude: 'reverse' },
      dangzhou_qiangduan: { generalId: 'dangzhou_qiangduan', tier: 'ordinary', tacticalSkillId: 'ts_104', advantageSkillId: 'ts_399', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_104', aptitude: 'reverse' },
    unassigned_zhuran: { generalId: 'unassigned_zhuran', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_14', advantageSkillId: 'ts_398', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_031', aptitude: 'reverse' }, // 江陵守·名震敌国
    shu_liubei: { generalId: 'shu_liubei', tier: 'famous', tacticalSkillId: 'ts_168', strategicSkillId: 'str_15', advantageSkillId: 'ts_028', balanceSkillId: 'ts_686', disadvantageSkillId: 'ts_168', aptitude: 'reverse' }, // 刘备成都
    unassigned_weiyan: { generalId: 'unassigned_weiyan', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_14', advantageSkillId: 'ts_030', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_031', aptitude: 'reverse' }, // 略阳阳溪守汉中
    fengzhou_wujie: { generalId: 'fengzhou_wujie', tier: 'famous', tacticalSkillId: 'ts_192', strategicSkillId: 'str_08', advantageSkillId: 'ts_192', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_033', aptitude: 'reverse' }, // 和尚原仙人关守蜀口
    unassigned_baochao: { generalId: 'unassigned_baochao', tier: 'famous', tacticalSkillId: 'ts_020', strategicSkillId: 'str_12', advantageSkillId: 'ts_027', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_020', aptitude: 'reverse' }, // 霆军以寡击众
    qinghai_yuezhongqi: { generalId: 'qinghai_yuezhongqi', tier: 'famous', tacticalSkillId: 'ts_292', advantageSkillId: 'ts_292', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_037', strategicSkillId: 'str_12', aptitude: 'create' },
    tujia_d_qinliangyu: { generalId: 'tujia_d_qinliangyu', tier: 'famous', tacticalSkillId: 'ts_271', strategicSkillId: 'str_08', advantageSkillId: 'ts_271', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_037', aptitude: 'create' },
    shuixi_anbangyan: { generalId: 'shuixi_anbangyan', tier: 'ordinary', tacticalSkillId: 'ts_029', advantageSkillId: 'ts_029', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_417', aptitude: 'create' }, // 奢安之乱
    chu_guanyu: { generalId: 'chu_guanyu', tier: 'famous', tacticalSkillId: 'ts_257', strategicSkillId: 'str_04', advantageSkillId: 'ts_257', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_717', aptitude: 'create' },
    xiangzhou_lvwenhuan: { generalId: 'xiangzhou_lvwenhuan', tier: 'famous', tacticalSkillId: 'ts_273', advantageSkillId: 'ts_389', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_273', strategicSkillId: 'str_08', aptitude: 'reverse' },
    guo_jixin: { generalId: 'guo_jixin', tier: 'ordinary', tacticalSkillId: 'ts_007', advantageSkillId: 'ts_007', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_036', aptitude: 'create' }, // 荥阳诳楚
    unassigned_lidingguo_dx: { generalId: 'unassigned_lidingguo_dx', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_031', aptitude: 'create' }, // 大西抗清
    zi_changhong: { generalId: 'zi_changhong', tier: 'ordinary', tacticalSkillId: 'ts_035', advantageSkillId: 'ts_028', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_035', aptitude: 'reverse' }, // 资中先贤
    yidou_luxun: { generalId: 'yidou_luxun', tier: 'famous', tacticalSkillId: 'ts_278', strategicSkillId: 'str_02', advantageSkillId: 'ts_278', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_020', aptitude: 'leverage' }, // 夷陵火攻
    unassigned_xiangyan: { generalId: 'unassigned_xiangyan', tier: 'famous', tacticalSkillId: 'ts_007', strategicSkillId: 'str_09', advantageSkillId: 'ts_007', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_419', aptitude: 'create' }, // 楚将破李信
    zhongxiang_ganning: { generalId: 'zhongxiang_ganning', tier: 'ordinary', tacticalSkillId: 'ts_180', advantageSkillId: 'ts_180', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_018', aptitude: 'create' },
    hezhou_wangjian: { generalId: 'hezhou_wangjian', tier: 'famous', tacticalSkillId: 'ts_144', strategicSkillId: 'str_08', advantageSkillId: 'ts_450', balanceSkillId: 'ts_451', disadvantageSkillId: 'ts_144', aptitude: 'reverse' }, // 钓鱼城炮击蒙哥·守城36年
    qiuchi_yangnandang: { generalId: 'qiuchi_yangnandang', tier: 'ordinary', tacticalSkillId: 'ts_007', advantageSkillId: 'ts_007', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_024', aptitude: 'create' },
    cong_puhu: { generalId: 'cong_puhu', tier: 'ordinary', tacticalSkillId: 'ts_167', advantageSkillId: 'ts_023', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_167', aptitude: 'reverse' }, // 宕渠賨人随张飞
    langzhou_zhangfei: { generalId: 'langzhou_zhangfei', tier: 'famous', tacticalSkillId: 'ts_265', strategicSkillId: 'str_09', advantageSkillId: 'ts_029', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_265', aptitude: 'create' },
    tan_d_qinhou: { generalId: 'tan_d_qinhou', tier: 'ordinary', tacticalSkillId: 'ts_374', advantageSkillId: 'ts_022', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_374', aptitude: 'reverse' },
    xiang_d_xiangdakun: { generalId: 'xiang_d_xiangdakun', tier: 'ordinary', tacticalSkillId: 'ts_137', advantageSkillId: 'ts_004', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_137', aptitude: 'reverse' },
    unassigned_tanhou_td: { generalId: 'unassigned_tanhou_td', tier: 'ordinary', tacticalSkillId: 'ts_035', advantageSkillId: 'ts_399', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_035', aptitude: 'reverse' }, // 慈利土司
    ran_d_ranshouzhong: { generalId: 'ran_d_ranshouzhong', tier: 'ordinary', tacticalSkillId: 'ts_058', advantageSkillId: 'ts_058', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_037', aptitude: 'create' },
    wuxi_shamoke: { generalId: 'wuxi_shamoke', tier: 'ordinary', tacticalSkillId: 'ts_159', advantageSkillId: 'ts_402', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_159', aptitude: 'reverse' },
    kuai_kuaiyue: { generalId: 'kuai_kuaiyue', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_414', aptitude: 'create' },
    bandun_fanmu: { generalId: 'bandun_fanmu', tier: 'ordinary', tacticalSkillId: 'ts_024', advantageSkillId: 'ts_390', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_024', aptitude: 'reverse' }, // 板楯助汉
    she_shechongming: { generalId: 'she_shechongming', tier: 'ordinary', tacticalSkillId: 'ts_098', advantageSkillId: 'ts_398', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_098', aptitude: 'reverse' },
    boren_ada: { generalId: 'boren_ada', tier: 'ordinary', tacticalSkillId: 'ts_095', advantageSkillId: 'ts_047', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_095', aptitude: 'reverse' }, // 僰人末代
    unassigned_chendao: { generalId: 'unassigned_chendao', tier: 'ordinary', tacticalSkillId: 'ts_031', advantageSkillId: 'ts_005', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_031', aptitude: 'reverse' }, // 白毦兵断后
    unassigned_luoshao: { generalId: 'unassigned_luoshao', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_418', aptitude: 'create' }, // 乌蒙土官
    jingmen_zhaoyun: { generalId: 'jingmen_zhaoyun', tier: 'ordinary', tacticalSkillId: 'ts_388', advantageSkillId: 'ts_023', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_388', aptitude: 'reverse' }, // 长坂坡救主·孤胆陷阵（以少打多 ×1.55，赵云专属）
    unassigned_pengshichou: { generalId: 'unassigned_pengshichou', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_031', aptitude: 'create' }, // 溪州铜柱
    miaomin_shiliudeng: { generalId: 'miaomin_shiliudeng', tier: 'ordinary', tacticalSkillId: 'ts_031', advantageSkillId: 'ts_392', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_031', aptitude: 'reverse' }, // 苗民起义
    xiqin_wanyanchenheshang: { generalId: 'xiqin_wanyanchenheshang', tier: 'famous', tacticalSkillId: 'ts_309', strategicSkillId: 'str_09', advantageSkillId: 'ts_002', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_309', aptitude: 'reverse' },
    beidi_sunang: { generalId: 'beidi_sunang', tier: 'ordinary', tacticalSkillId: 'ts_015', advantageSkillId: 'ts_009', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_418', aptitude: 'leverage' },
    baiyang_mengtian: { generalId: 'baiyang_mengtian', tier: 'famous', tacticalSkillId: 'ts_249', strategicSkillId: 'str_14', advantageSkillId: 'ts_249', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_031', aptitude: 'create' },
  // ── 河西区 2026-06-18 ──
    didao_wangshao: { generalId: 'didao_wangshao', tier: 'famous', tacticalSkillId: 'ts_122', strategicSkillId: 'str_02', advantageSkillId: 'ts_122', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_416', aptitude: 'create' },
    suzhou_huoqubing: { generalId: 'suzhou_huoqubing', tier: 'famous', tacticalSkillId: 'ts_052', strategicSkillId: 'str_01', advantageSkillId: 'ts_052', balanceSkillId: 'ts_422', disadvantageSkillId: 'ts_423', aptitude: 'create' }, // 封狼居胥（大纵深穿插闪电战）
    liangzhou_zhanggui: { generalId: 'liangzhou_zhanggui', tier: 'famous', tacticalSkillId: 'ts_298', strategicSkillId: 'str_14', advantageSkillId: 'ts_002', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_298', aptitude: 'create' },
    unassigned_lihao_dunhuang: { generalId: 'unassigned_lihao_dunhuang', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_14', advantageSkillId: 'ts_001', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_033', aptitude: 'create' }, // 西凉开国
    unassigned_xinqingji: { generalId: 'unassigned_xinqingji', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_09', advantageSkillId: 'ts_021', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_416', aptitude: 'create' }, // 破羌将军
    dashun_lizicheng: { generalId: 'dashun_lizicheng', tier: 'famous', tacticalSkillId: 'ts_111', strategicSkillId: 'str_13', advantageSkillId: 'ts_492', balanceSkillId: 'ts_493', disadvantageSkillId: 'ts_111', aptitude: 'reverse' }, // 大顺灭明
    zhai_han_diqing: { generalId: 'zhai_han_diqing', tier: 'famous', tacticalSkillId: 'ts_112', strategicSkillId: 'str_12', advantageSkillId: 'ts_112', balanceSkillId: 'ts_460', disadvantageSkillId: 'ts_461', aptitude: 'create' },
    ganzhou_dourong: { generalId: 'ganzhou_dourong', tier: 'famous', tacticalSkillId: 'ts_252', strategicSkillId: 'str_14', advantageSkillId: 'ts_252', balanceSkillId: 'ts_694', disadvantageSkillId: 'ts_016', aptitude: 'leverage' },
    unassigned_zhaoponu: { generalId: 'unassigned_zhaoponu', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_07', advantageSkillId: 'ts_021', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_410', aptitude: 'create' }, // 破楼兰
    shazhou_zhangyichao: { generalId: 'shazhou_zhangyichao', tier: 'famous', tacticalSkillId: 'ts_113', strategicSkillId: 'str_10', advantageSkillId: 'ts_113', balanceSkillId: 'ts_610', disadvantageSkillId: 'ts_611', aptitude: 'create' }, // 归义收复河西
    guiyi_caoyijin: { generalId: 'guiyi_caoyijin', tier: 'ordinary', tacticalSkillId: 'ts_065', advantageSkillId: 'ts_399', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_065', aptitude: 'reverse' },
    unassigned_lisheng_tang: { generalId: 'unassigned_lisheng_tang', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_08', advantageSkillId: 'ts_021', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_035', aptitude: 'create' }, // 神策平泾原
    unassigned_chuliji: { generalId: 'unassigned_chuliji', tier: 'famous', tacticalSkillId: 'ts_033', strategicSkillId: 'str_10', advantageSkillId: 'ts_390', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_033', aptitude: 'reverse' }, // 崤函据守
    helian_helianbobo: { generalId: 'helian_helianbobo', tier: 'famous', tacticalSkillId: 'ts_254', strategicSkillId: 'str_13', advantageSkillId: 'ts_254', balanceSkillId: 'ts_696', disadvantageSkillId: 'ts_417', aptitude: 'create' },
    chile_hulvjin: { generalId: 'chile_hulvjin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_001', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_040', aptitude: 'create' },
    chijin_qiewangshijia: { generalId: 'chijin_qiewangshijia', tier: 'ordinary', tacticalSkillId: 'ts_006', advantageSkillId: 'ts_004', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_006', aptitude: 'reverse' }, // 赤斤蒙古卫
    shuofang_weiqing: { generalId: 'shuofang_weiqing', tier: 'famous', tacticalSkillId: 'ts_276', strategicSkillId: 'str_11', advantageSkillId: 'ts_276', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_026', aptitude: 'create' }, // 取河南地
    woye_huangfugui: { tacticalSkillId: 'ts_356', generalId: 'woye_huangfugui', tier: 'famous', strategicSkillId: 'str_08', advantageSkillId: 'ts_356', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_006', aptitude: 'leverage' },
    yeli_yeliwangrong: { generalId: 'yeli_yeliwangrong', tier: 'famous', tacticalSkillId: 'ts_315', advantageSkillId: 'ts_315', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_414', strategicSkillId: 'str_13', aptitude: 'leverage' }, // 定川寨破宋
    hunxie_xuziwei: { generalId: 'hunxie_xuziwei', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_045', aptitude: 'create' }, // 浑邪降汉
    guazhou_zhangshougui: { generalId: 'guazhou_zhangshougui', tier: 'famous', tacticalSkillId: 'ts_253', strategicSkillId: 'str_08', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_253', aptitude: 'create' },
    kang_liangshidou: { generalId: 'kang_liangshidou', tier: 'ordinary', tacticalSkillId: 'ts_037' , advantageSkillId: 'ts_001', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_037', aptitude: 'reverse' },
    yingli_jilasiyi: { generalId: 'yingli_jilasiyi', tier: 'ordinary', tacticalSkillId: 'ts_016', advantageSkillId: 'ts_029', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_016', aptitude: 'reverse' }, // 守应理抗蒙
    dangxiang_liyuanhao: { tacticalSkillId: 'ts_082', generalId: 'dangxiang_liyuanhao', tier: 'famous', strategicSkillId: 'str_13', advantageSkillId: 'ts_082', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_006', aptitude: 'create' },
    huizhou_yaosi: { generalId: 'huizhou_yaosi', tier: 'ordinary', tacticalSkillId: 'ts_017', advantageSkillId: 'ts_392', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_017', aptitude: 'reverse' }, // 会州箭贯耳
    huan_zhongshidao: { generalId: 'huan_zhongshidao', tier: 'famous', tacticalSkillId: 'ts_255', strategicSkillId: 'str_05', advantageSkillId: 'ts_255', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_416', aptitude: 'create' }, // 种家将守边
    wei2_hunjian: { generalId: 'wei2_hunjian', tier: 'famous', tacticalSkillId: 'ts_320', strategicSkillId: 'str_08', advantageSkillId: 'ts_009', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_320', aptitude: 'reverse' }, // 朔方破吐蕃
    lingwu_guoziyi: { generalId: 'lingwu_guoziyi', tier: 'famous', tacticalSkillId: 'ts_266', advantageSkillId: 'ts_400', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_266', strategicSkillId: 'str_08', aptitude: 'leverage' },
    dingxiang_d_lijing: { generalId: 'dingxiang_d_lijing', tier: 'famous', tacticalSkillId: 'ts_056', strategicSkillId: 'str_02', advantageSkillId: 'ts_056', balanceSkillId: 'ts_436', disadvantageSkillId: 'ts_437', aptitude: 'create' }, // 乘夜掩至（李靖率三千骑雪夜袭定襄）
    xiayang_d_dengyu: { generalId: 'xiayang_d_dengyu', tier: 'famous', tacticalSkillId: 'ts_205', strategicSkillId: 'str_06', advantageSkillId: 'ts_047', balanceSkillId: 'ts_205', disadvantageSkillId: 'ts_034', aptitude: 'leverage' },
    ningkou_liling: { generalId: 'ningkou_liling', tier: 'ordinary', tacticalSkillId: 'ts_005', advantageSkillId: 'ts_005', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_418', aptitude: 'create' },
    juqu_d_juqumengxun: { generalId: 'juqu_d_juqumengxun', tier: 'famous', tacticalSkillId: 'ts_256', advantageSkillId: 'ts_256', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_006', strategicSkillId: 'str_13', aptitude: 'leverage' }, // 北凉灭西凉
    // ── 中原区 2026-06-18 ──
    li_lx_d_liguang: { generalId: 'li_lx_d_liguang', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_033', aptitude: 'create' },
    sunqin_sunchuanting: { generalId: 'sunqin_sunchuanting', tier: 'famous', tacticalSkillId: 'ts_202', strategicSkillId: 'str_14', advantageSkillId: 'ts_202', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_032', aptitude: 'create' }, // 潼关抗李自成
    tianxiong_tianchengsi: { generalId: 'tianxiong_tianchengsi', tier: 'ordinary', tacticalSkillId: 'ts_145', advantageSkillId: 'ts_145', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_033', aptitude: 'create' },
    ranwei_d_ranmin: { generalId: 'ranwei_d_ranmin', tier: 'famous', tacticalSkillId: 'ts_198', strategicSkillId: 'str_09', advantageSkillId: 'ts_198', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_020', aptitude: 'create' }, // 杀胡令
    jin_xianzhen: { generalId: 'jin_xianzhen', tier: 'famous', tacticalSkillId: 'ts_186', strategicSkillId: 'str_09', advantageSkillId: 'ts_186', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_018', aptitude: 'leverage' }, // 城濮崤山
    jingzhou_gs_huangfusong: { generalId: 'jingzhou_gs_huangfusong', tier: 'famous', tacticalSkillId: 'ts_183', strategicSkillId: 'str_12', advantageSkillId: 'ts_183', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_719', aptitude: 'create' },
    unassigned_masui: { generalId: 'unassigned_masui', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_006', aptitude: 'create' }, // 洹水破田悦
    wang_d_liuyu: { generalId: 'wang_d_liuyu', tier: 'famous', tacticalSkillId: 'ts_174', strategicSkillId: 'str_03', advantageSkillId: 'ts_174', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_026', aptitude: 'create' }, // 刘裕·琅琊(却月阵)
    chimei_fanchong: { generalId: 'chimei_fanchong', tier: 'ordinary', tacticalSkillId: 'ts_074', advantageSkillId: 'ts_074', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_031', aptitude: 'create' },
    zhengzhou_chenqingzhi: { generalId: 'zhengzhou_chenqingzhi', tier: 'famous', tacticalSkillId: 'ts_163', strategicSkillId: 'str_09', advantageSkillId: 'ts_009', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_163', aptitude: 'reverse' }, // 七千白袍入洛阳
    xichu_xiangyu: { generalId: 'xichu_xiangyu', tier: 'famous', tacticalSkillId: 'ts_012', strategicSkillId: 'str_03', advantageSkillId: 'ts_426', balanceSkillId: 'ts_427', disadvantageSkillId: 'ts_012', aptitude: 'reverse' }, // 破釜沉舟（巨鹿之战）
    wazhai_zhanghan: { generalId: 'wazhai_zhanghan', tier: 'famous', tacticalSkillId: 'ts_203', strategicSkillId: 'str_03', advantageSkillId: 'ts_203', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_412', aptitude: 'leverage' },
    jiaodong_tiandan: { generalId: 'jiaodong_tiandan', tier: 'famous', tacticalSkillId: 'ts_164', strategicSkillId: 'str_08', advantageSkillId: 'ts_164', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_037', aptitude: 'reverse' }, // 田单·纵反间于燕使骑劫代乐毅，即墨火牛破燕（以子之矛·反用敌计）
    jibei_xuxuan: { generalId: 'jibei_xuxuan', tier: 'ordinary', tacticalSkillId: 'ts_025', advantageSkillId: 'ts_004', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_025', aptitude: 'reverse' }, // 赤眉丞相
    qi_simarangju: { generalId: 'qi_simarangju', tier: 'famous', tacticalSkillId: 'ts_185', strategicSkillId: 'str_05', advantageSkillId: 'ts_185', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_710', aptitude: 'create' },
    huaiyang_zhouyafu: { generalId: 'huaiyang_zhouyafu', tier: 'famous', tacticalSkillId: 'ts_184', strategicSkillId: 'str_05', advantageSkillId: 'ts_389', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_184', aptitude: 'leverage' }, // 坚壁不出平七国
    yingzhou_d_liuqi: { generalId: 'yingzhou_d_liuqi', tier: 'famous', tacticalSkillId: 'ts_275', advantageSkillId: 'ts_275', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_011', strategicSkillId: 'str_08', aptitude: 'reverse' }, // 顺昌破金
    cao_d_caocao: { generalId: 'cao_d_caocao', tier: 'famous', tacticalSkillId: 'ts_107', strategicSkillId: 'str_03', advantageSkillId: 'ts_107', balanceSkillId: 'ts_478', disadvantageSkillId: 'ts_479', aptitude: 'leverage' },
    bozhou_d_yujin: { generalId: 'bozhou_d_yujin', tier: 'ordinary', tacticalSkillId: 'ts_033', advantageSkillId: 'ts_027', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_033', aptitude: 'reverse' }, // 于禁·五子良将假节钺·治军精整
    cangzhou_liurengong: { generalId: 'cangzhou_liurengong', tier: 'ordinary', tacticalSkillId: 'ts_096', advantageSkillId: 'ts_391', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_096', aptitude: 'reverse' },
    dongxia_puxianwannu: { generalId: 'dongxia_puxianwannu', tier: 'ordinary', tacticalSkillId: 'ts_143', advantageSkillId: 'ts_001', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_143', aptitude: 'reverse' },
    dongsheng_weishang: { generalId: 'dongsheng_weishang', tier: 'ordinary', tacticalSkillId: 'ts_049', aptitude: 'create', advantageSkillId: 'ts_049', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_037', },
    elunchunzu_gaishan: { generalId: 'elunchunzu_gaishan', tier: 'ordinary', tacticalSkillId: 'ts_151', advantageSkillId: 'ts_010', balanceSkillId: 'ts_151', disadvantageSkillId: 'ts_031', aptitude: 'leverage' },
    huihu_dunmohedagan: { generalId: 'huihu_dunmohedagan', tier: 'ordinary', tacticalSkillId: 'ts_007', advantageSkillId: 'ts_007', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_039', aptitude: 'create' },
    jilimi_takuna: { generalId: 'jilimi_takuna', tier: 'ordinary', tacticalSkillId: 'ts_010', advantageSkillId: 'ts_010', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_025', aptitude: 'create' },
    jingpozu_zaodan: { generalId: 'jingpozu_zaodan', tier: 'ordinary', tacticalSkillId: 'ts_167', advantageSkillId: 'ts_401', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_167', aptitude: 'reverse' },
    minyue_wuzhu: { generalId: 'minyue_wuzhu', tier: 'ordinary', tacticalSkillId: 'ts_007', advantageSkillId: 'ts_007', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_040', aptitude: 'create' },
    shaozhou_d_mayin: { generalId: 'shaozhou_d_mayin', tier: 'ordinary', tacticalSkillId: 'ts_374', advantageSkillId: 'ts_400', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_374', aptitude: 'reverse' },
    shuizu_panxinjian: { generalId: 'shuizu_panxinjian', tier: 'ordinary', tacticalSkillId: 'ts_034', advantageSkillId: 'ts_023', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_034', aptitude: 'reverse' },
    tajikezu_kuerban: { generalId: 'tajikezu_kuerban', tier: 'ordinary', tacticalSkillId: 'ts_137', advantageSkillId: 'ts_003', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_137', aptitude: 'reverse' },
    wazu_banhongwang: { generalId: 'wazu_banhongwang', tier: 'ordinary', tacticalSkillId: 'ts_058', advantageSkillId: 'ts_058', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_016', aptitude: 'create' },
    long2_weixiaokuan: { generalId: 'long2_weixiaokuan', tier: 'famous', tacticalSkillId: 'ts_197', strategicSkillId: 'str_08', advantageSkillId: 'ts_709', balanceSkillId: 'ts_701', disadvantageSkillId: 'ts_197', aptitude: 'reverse' },
    dongxian_sunbin: { generalId: 'dongxian_sunbin', tier: 'famous', tacticalSkillId: 'ts_165', strategicSkillId: 'str_02', advantageSkillId: 'ts_165', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_419', aptitude: 'leverage' },
    mi_mizhu: { generalId: 'mi_mizhu', tier: 'ordinary', tacticalSkillId: 'ts_134', advantageSkillId: 'ts_134', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_012', aptitude: 'create' },
    baibo_guotai: { generalId: 'baibo_guotai', tier: 'ordinary', tacticalSkillId: 'ts_159', advantageSkillId: 'ts_391', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_159', aptitude: 'reverse' }, // 白波军
    unassigned_geshuhan: { generalId: 'unassigned_geshuhan', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_14', advantageSkillId: 'ts_400', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_031', aptitude: 'reverse' }, // 潼关守将
    shanzhou_wangzhongsi: { generalId: 'shanzhou_wangzhongsi', tier: 'famous', tacticalSkillId: 'ts_123', advantageSkillId: 'ts_010', balanceSkillId: 'ts_123', disadvantageSkillId: 'ts_034', strategicSkillId: 'str_14', aptitude: 'create' },
    weizhou_weigao: { generalId: 'weizhou_weigao', tier: 'famous', tacticalSkillId: 'ts_286', strategicSkillId: 'str_14', advantageSkillId: 'ts_286', balanceSkillId: 'ts_631', disadvantageSkillId: 'ts_632', aptitude: 'create' }, // 韦皋·神川擒论莽热·经营剑南
    ruzhou_sunjian: { generalId: 'ruzhou_sunjian', tier: 'famous', tacticalSkillId: 'ts_199', strategicSkillId: 'str_03', advantageSkillId: 'ts_199', balanceSkillId: 'ts_727', disadvantageSkillId: 'ts_728', aptitude: 'create' },
    yaozhou_limaozhen: { generalId: 'yaozhou_limaozhen', tier: 'ordinary', tacticalSkillId: 'ts_095', advantageSkillId: 'ts_028', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_095', aptitude: 'reverse' }, // 岐国军阀
    jiyuan_huluguang: { generalId: 'jiyuan_huluguang', tier: 'famous', tacticalSkillId: 'ts_196', strategicSkillId: 'str_12', advantageSkillId: 'ts_739', balanceSkillId: 'ts_196', disadvantageSkillId: 'ts_740', aptitude: 'leverage' }, // 落雕神射稳阵×1.35 + S⑫以战养战（2026-07-11 连战校准）
    yiyang_d_mengzongzheng: { generalId: 'yiyang_d_mengzongzheng', tier: 'famous', tacticalSkillId: 'ts_321', strategicSkillId: 'str_08', advantageSkillId: 'ts_028', balanceSkillId: 'ts_688', disadvantageSkillId: 'ts_321', aptitude: 'reverse' }, // 三关之捷
    wuwu_d_lvmeng: { generalId: 'wuwu_d_lvmeng', tier: 'famous', tacticalSkillId: 'ts_078', strategicSkillId: 'str_06', advantageSkillId: 'ts_639', balanceSkillId: 'ts_078', disadvantageSkillId: 'ts_641', aptitude: 'leverage' }, // 白衣渡江
    li_bian: { generalId: 'li_bian', tier: 'ordinary', tacticalSkillId: 'ts_018', advantageSkillId: 'ts_022', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_018', aptitude: 'reverse' }, // 南唐烈祖，保境息民，固若金汤
    yangshao_zhoubo: { generalId: 'yangshao_zhoubo', tier: 'famous', tacticalSkillId: 'ts_206', advantageSkillId: 'ts_206', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_410', strategicSkillId: 'str_08', aptitude: 'create' },
    unassigned_liuyan_ly: { generalId: 'unassigned_liuyan_ly', tier: 'famous', tacticalSkillId: 'ts_007', strategicSkillId: 'str_08', advantageSkillId: 'ts_007', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_045', aptitude: 'create' }, // 舂陵起兵
    zhou_jifa: { generalId: 'zhou_jifa', tier: 'famous', tacticalSkillId: 'ts_117', strategicSkillId: 'str_12', advantageSkillId: 'ts_117', balanceSkillId: 'ts_673', disadvantageSkillId: 'ts_674', aptitude: 'create' }, // 武王伐纣
    quanrong_yiquhai: { generalId: 'quanrong_yiquhai', tier: 'ordinary', tacticalSkillId: 'ts_065', advantageSkillId: 'ts_007', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_065', aptitude: 'reverse' }, // 犬戎弑幽王
    unassigned_chairong: { generalId: 'unassigned_chairong', tier: 'famous', tacticalSkillId: 'ts_007', strategicSkillId: 'str_01', advantageSkillId: 'ts_007', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_412', aptitude: 'create' }, // 高平之战·殿前诸班
    song_zhaokuangyin: { generalId: 'song_zhaokuangyin', tier: 'famous', tacticalSkillId: 'ts_201', strategicSkillId: 'str_14', advantageSkillId: 'ts_201', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_008', aptitude: 'create' },
    ruo_wangjian: { generalId: 'ruo_wangjian', tier: 'famous', tacticalSkillId: 'ts_108', strategicSkillId: 'str_03', advantageSkillId: 'ts_108', balanceSkillId: 'ts_729', disadvantageSkillId: 'ts_730', aptitude: 'create' },
    unassigned_luhunrongwang: { generalId: 'unassigned_luhunrongwang', tier: 'ordinary', tacticalSkillId: 'ts_014', advantageSkillId: 'ts_391', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_032', aptitude: 'leverage' }, // 陆浑戎
    sizhou_hanshizhong: { generalId: 'sizhou_hanshizhong', tier: 'famous', tacticalSkillId: 'ts_170', strategicSkillId: 'str_09', advantageSkillId: 'ts_170', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_412', aptitude: 'leverage' }, // 黄天荡以寡击众
    yin_dixin: { generalId: 'yin_dixin', tier: 'ordinary', tacticalSkillId: 'ts_038', advantageSkillId: 'ts_023', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_038', aptitude: 'reverse' }, // 纣王征东夷
    liwang_liguangbi: { generalId: 'liwang_liguangbi', tier: 'famous', tacticalSkillId: 'ts_215', strategicSkillId: 'str_08', advantageSkillId: 'ts_400', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_215', aptitude: 'reverse' },
    han_baoyuan: { generalId: 'han_baoyuan', tier: 'ordinary', tacticalSkillId: 'ts_026', advantageSkillId: 'ts_027', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_026', aptitude: 'reverse' }, // 韩将暴鸢
    bailian_wangconger: { generalId: 'bailian_wangconger', tier: 'ordinary', tacticalSkillId: 'ts_336', advantageSkillId: 'ts_336', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_409', aptitude: 'create' },
    shen_shenbo: { generalId: 'shen_shenbo', tier: 'ordinary', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_392', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_011', aptitude: 'reverse' }, // 申国受封
    sima_d_simayi: { generalId: 'sima_d_simayi', tier: 'famous', tacticalSkillId: 'ts_188', advantageSkillId: 'ts_702', balanceSkillId: 'ts_188', disadvantageSkillId: 'ts_008', strategicSkillId: 'str_14', aptitude: 'leverage' },
    unassigned_zhaoshe: { generalId: 'unassigned_zhaoshe', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_05', advantageSkillId: 'ts_001', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_013', aptitude: 'create' }, // 阏与之战
    huai_zhuyuanzhang: { generalId: 'huai_zhuyuanzhang', tier: 'famous', tacticalSkillId: 'ts_182', strategicSkillId: 'str_15', advantageSkillId: 'ts_182', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_011', aptitude: 'create' }, // 洪武大帝
    shangzhou_shangyang: { generalId: 'shangzhou_shangyang', tier: 'ordinary', tacticalSkillId: 'ts_056', advantageSkillId: 'ts_056', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_039', aptitude: 'create' }, // 商鞅变法
    yue_d_lusu: { generalId: 'yue_d_lusu', tier: 'famous', tacticalSkillId: 'ts_006', strategicSkillId: 'str_06', advantageSkillId: 'ts_022', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_006', aptitude: 'leverage' }, // 鲁肃·巴陵(联刘抗曹·招贤纳士)
    unassigned_yuanshao: { generalId: 'unassigned_yuanshao', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_12', advantageSkillId: 'ts_001', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_409', aptitude: 'create' }, // 四世三公
    xinping_haozhao: { generalId: 'xinping_haozhao', tier: 'famous', tacticalSkillId: 'ts_034', strategicSkillId: 'str_08', advantageSkillId: 'ts_027', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_034', aptitude: 'reverse' }, // 陈仓守城·拒诸葛亮
    yuzhou_zuti: { generalId: 'yuzhou_zuti', tier: 'famous', tacticalSkillId: 'ts_383', strategicSkillId: 'str_01', advantageSkillId: 'ts_383', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_724', aptitude: 'create' },
    mengcheng_d_gaoqiong: { generalId: 'mengcheng_d_gaoqiong', tier: 'ordinary', tacticalSkillId: 'ts_086', advantageSkillId: 'ts_002', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_086', aptitude: 'reverse' }, // 澶渊主战
    liang_d_zhangxun: { generalId: 'liang_d_zhangxun', tier: 'famous', tacticalSkillId: 'ts_385', strategicSkillId: 'str_08', advantageSkillId: 'ts_707', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_385', aptitude: 'reverse' }, // 睢阳守城：以二千拒十三万
    lulin_liuxiu: { generalId: 'lulin_liuxiu', tier: 'famous', tacticalSkillId: 'ts_054', strategicSkillId: 'str_15', advantageSkillId: 'ts_400', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_054', aptitude: 'reverse' }, // 流星坠营（昆阳之战位面之子干扰敌军）
    unassigned_fankuai: { generalId: 'unassigned_fankuai', tier: 'ordinary', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_401', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_011', aptitude: 'reverse' }, // 鸿门宴
    hao_d_weirui: { generalId: 'hao_d_weirui', tier: 'famous', tacticalSkillId: 'ts_193', advantageSkillId: 'ts_193', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_019', strategicSkillId: 'str_08', aptitude: 'leverage' },
    dang_d_zhuwen: { generalId: 'dang_d_zhuwen', tier: 'famous', tacticalSkillId: 'ts_191', strategicSkillId: 'str_06', advantageSkillId: 'ts_191', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_412', aptitude: 'create' }, // 后梁太祖（收编降兵成军）
    // ── 北方区 2026-06-18 ──
    gongsun_d_gongsundu: { generalId: 'gongsun_d_gongsundu', tier: 'ordinary', tacticalSkillId: 'ts_006', advantageSkillId: 'ts_401', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_006', aptitude: 'reverse' }, // 辽东割据
    unassigned_yanganer2: { generalId: 'unassigned_yanganer2', tier: 'ordinary', tacticalSkillId: 'ts_026', advantageSkillId: 'ts_047', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_026', aptitude: 'reverse' }, // 红袄天顺
    xuan_xuda: { generalId: 'xuan_xuda', tier: 'famous', tacticalSkillId: 'ts_094', strategicSkillId: 'str_11', advantageSkillId: 'ts_094', balanceSkillId: 'ts_655', disadvantageSkillId: 'ts_656', aptitude: 'create' }, // 开国第一功臣
    tuoba_tuobagui: { generalId: 'tuoba_tuobagui', tier: 'famous', tacticalSkillId: 'ts_222', strategicSkillId: 'str_14', advantageSkillId: 'ts_222', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_034', aptitude: 'create' },
    bing_liji: { generalId: 'bing_liji', tier: 'famous', tacticalSkillId: 'ts_208', strategicSkillId: 'str_03', advantageSkillId: 'ts_208', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_034', aptitude: 'create' }, // 晋阳坚守（百折不挠）
    unassigned_zhangrou: { generalId: 'unassigned_zhangrou', tier: 'ordinary', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_003', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_011', aptitude: 'reverse' }, // 保定重建
    qu_d_quyi: { generalId: 'qu_d_quyi', tier: 'famous', tacticalSkillId: 'ts_219', strategicSkillId: 'str_09', advantageSkillId: 'ts_219', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_726', aptitude: 'leverage' },
    gaoqi_d_gaohuan: { generalId: 'gaoqi_d_gaohuan', tier: 'famous', tacticalSkillId: 'ts_211', strategicSkillId: 'str_15', advantageSkillId: 'ts_007', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_211', aptitude: 'create' }, // 神武帝
    pingyuan_yanzhenqing: { generalId: 'pingyuan_yanzhenqing', tier: 'ordinary', tacticalSkillId: 'ts_204', advantageSkillId: 'ts_204', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_024', aptitude: 'create' }, // 平原抗安史
    hejian_gongsunzan: { generalId: 'hejian_gongsunzan', tier: 'famous', tacticalSkillId: 'ts_213', strategicSkillId: 'str_09', advantageSkillId: 'ts_213', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_040', aptitude: 'create' }, // 白马义从
    linyu_wusangui: { generalId: 'linyu_wusangui', tier: 'famous', tacticalSkillId: 'ts_148', strategicSkillId: 'str_05', advantageSkillId: 'ts_148', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_411', aptitude: 'leverage' },
    unassigned_liangshidu_ls: { generalId: 'unassigned_liangshidu_ls', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_018', aptitude: 'create' }, // 梁国割据
    liangshidu_longjia: { generalId: 'liangshidu_longjia', tier: 'ordinary', tacticalSkillId: 'ts_166', advantageSkillId: 'ts_004', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_166', aptitude: 'reverse' }, // 雕阴抗秦兵败
    yangshe_yangshezhi: { generalId: 'yangshe_yangshezhi', tier: 'ordinary', tacticalSkillId: 'ts_041', advantageSkillId: 'ts_004', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_041', aptitude: 'reverse' }, // 铜鞮大夫
    guzhu_tianyu: { generalId: 'guzhu_tianyu', tier: 'famous', tacticalSkillId: 'ts_212', strategicSkillId: 'str_08', advantageSkillId: 'ts_400', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_212', aptitude: 'leverage' },
    dizhou_wangyanzhang: { generalId: 'dizhou_wangyanzhang', tier: 'ordinary', tacticalSkillId: 'ts_083', advantageSkillId: 'ts_083', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_415', aptitude: 'create' }, // 铁枪拔阵
    dai_d_shijingtang: { generalId: 'dai_d_shijingtang', tier: 'ordinary', tacticalSkillId: 'ts_007', advantageSkillId: 'ts_007', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_026', aptitude: 'create' }, // 兵贵神速+侵掠如火
    erzhu_erzhurong: { generalId: 'erzhu_erzhurong', tier: 'famous', tacticalSkillId: 'ts_063', strategicSkillId: 'str_11', advantageSkillId: 'ts_063', balanceSkillId: 'ts_511', disadvantageSkillId: 'ts_512', aptitude: 'create' }, // 所向摧陷（滏口七千破三十万）
    zhe_d_zheyuqing: { generalId: 'zhe_d_zheyuqing', tier: 'famous', tacticalSkillId: 'ts_225', strategicSkillId: 'str_08', advantageSkillId: 'ts_225', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_020', aptitude: 'create' },
    heng1_yangye: { generalId: 'heng1_yangye', tier: 'famous', tacticalSkillId: 'ts_110', strategicSkillId: 'str_09', advantageSkillId: 'ts_731', balanceSkillId: 'ts_110', disadvantageSkillId: 'ts_732', aptitude: 'reverse' },
    yan_leyi: { generalId: 'yan_leyi', tier: 'famous', tacticalSkillId: 'ts_223', strategicSkillId: 'str_11', advantageSkillId: 'ts_223', balanceSkillId: 'ts_658', disadvantageSkillId: 'ts_659', aptitude: 'create' }, // 伐齐下七十城
    unassigned_zhongshiheng: { generalId: 'unassigned_zhongshiheng', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_14', advantageSkillId: 'ts_047', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_031', aptitude: 'reverse' }, // 环州筑城
    liguo_zhaoshe_zd: { generalId: 'liguo_zhaoshe_zd', tier: 'famous', tacticalSkillId: 'ts_294', strategicSkillId: 'str_15', advantageSkillId: 'ts_294', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_045', aptitude: 'create' }, // 阏与之战
    // ── 北方关隘 2026-06-19 ──
    yunzhong_tuobaliwei: { generalId: 'yunzhong_tuobaliwei', tier: 'ordinary', tacticalSkillId: 'ts_037', advantageSkillId: 'ts_005', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_037', aptitude: 'reverse' },
    you_gengyan: { generalId: 'you_gengyan', tier: 'famous', tacticalSkillId: 'ts_224', advantageSkillId: 'ts_224', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_037', strategicSkillId: 'str_01', aptitude: 'create' }, // 有志竟成·平齐张步
    unassigned_zhouyuji: { generalId: 'unassigned_zhouyuji', tier: 'famous', tacticalSkillId: 'ts_038', strategicSkillId: 'str_13', advantageSkillId: 'ts_005', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_038', aptitude: 'reverse' }, // 宁武殉国
    yi_yuqian: { generalId: 'yi_yuqian', tier: 'famous', tacticalSkillId: 'ts_166', strategicSkillId: 'str_08', advantageSkillId: 'ts_390', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_166', aptitude: 'reverse' }, // 京师保卫战·固若金汤
    huo_songlaosheng: { generalId: 'huo_songlaosheng', tier: 'ordinary', tacticalSkillId: 'ts_100', advantageSkillId: 'ts_023', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_100', aptitude: 'reverse' }, // 宋老生霍邑
    // ── 江南区 2026-06-18 ──
    wuling_xiangdancheng: { generalId: 'wuling_xiangdancheng', tier: 'famous', tacticalSkillId: 'ts_338', strategicSkillId: 'str_09', advantageSkillId: 'ts_338', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_026', aptitude: 'reverse' },
    suzhou_d_shikefa: { generalId: 'suzhou_d_shikefa', tier: 'ordinary', tacticalSkillId: 'ts_039', advantageSkillId: 'ts_009', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_039', aptitude: 'reverse' },
    jiujiang_zhouyu: { generalId: 'jiujiang_zhouyu', tier: 'famous', tacticalSkillId: 'ts_261', strategicSkillId: 'str_09', advantageSkillId: 'ts_261', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_409', aptitude: 'leverage' }, // 火攻破舰
    fangla_fangla: { generalId: 'fangla_fangla', tier: 'ordinary', tacticalSkillId: 'ts_051', advantageSkillId: 'ts_051', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_415', aptitude: 'create' },
    fang_guozhen_fangguozhen: { generalId: 'fang_guozhen_fangguozhen', tier: 'ordinary', tacticalSkillId: 'ts_104', advantageSkillId: 'ts_007', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_104', aptitude: 'reverse' },
    ouyue_zouyao: { generalId: 'ouyue_zouyao', tier: 'ordinary', tacticalSkillId: 'ts_016', advantageSkillId: 'ts_049', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_016', aptitude: 'reverse' }, // 东瓯王
    ruochu_doulian: { generalId: 'ruochu_doulian', tier: 'famous', tacticalSkillId: 'ts_316', strategicSkillId: 'str_01', advantageSkillId: 'ts_316', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_417', aptitude: 'leverage' }, // 若敖夜袭
    mi_chu_xionglv: { generalId: 'mi_chu_xionglv', tier: 'famous', tacticalSkillId: 'ts_267', strategicSkillId: 'str_03', advantageSkillId: 'ts_267', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_413', aptitude: 'create' },
    unassigned_luxun_sunwu: { generalId: 'unassigned_luxun_sunwu', tier: 'famous', tacticalSkillId: 'ts_030', strategicSkillId: 'str_14', advantageSkillId: 'ts_030', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_031', aptitude: 'create' }, // 夷陵火攻·江陵镇守
    yue_goujian: { generalId: 'yue_goujian', tier: 'famous', tacticalSkillId: 'ts_177', strategicSkillId: 'str_02', advantageSkillId: 'ts_003', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_177', aptitude: 'reverse' }, // 卧薪尝胆
    heng_hetengjiao: { generalId: 'heng_hetengjiao', tier: 'ordinary', tacticalSkillId: 'ts_088', advantageSkillId: 'ts_088', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_414', aptitude: 'create' }, // 衡州抗清
    xushouhui_zhaopusheng: { generalId: 'xushouhui_zhaopusheng', tier: 'ordinary', tacticalSkillId: 'ts_028', advantageSkillId: 'ts_028', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_034', aptitude: 'create' },
    lu_zhangliao: { generalId: 'lu_zhangliao', tier: 'famous', tacticalSkillId: 'ts_161', strategicSkillId: 'str_03', advantageSkillId: 'ts_399', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_161', aptitude: 'reverse' }, // 逍遥津突袭（所向披靡）
    sui_yangjian: { generalId: 'sui_yangjian', tier: 'ordinary', tacticalSkillId: 'ts_118', advantageSkillId: 'ts_118', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_041', aptitude: 'create' }, // 隋文帝
    yang_aner_yanganer: { generalId: 'yang_aner_yanganer', tier: 'ordinary', tacticalSkillId: 'ts_099', advantageSkillId: 'ts_021', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_099', aptitude: 'reverse' }, // 杨安儿红袄军克登莱
    unassigned_mayin: { generalId: 'unassigned_mayin', tier: 'famous', tacticalSkillId: 'ts_024', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_024', aptitude: 'reverse' }, // 马楚开国
    qi_d_qijiguang: { generalId: 'qi_d_qijiguang', tier: 'famous', tacticalSkillId: 'ts_093', strategicSkillId: 'str_14', advantageSkillId: 'ts_389', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_093', aptitude: 'create' },
    yezongliu_yezongliu: { generalId: 'yezongliu_yezongliu', tier: 'ordinary', tacticalSkillId: 'ts_032', advantageSkillId: 'ts_029', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_032', aptitude: 'reverse' },
    zhangshicheng_zhangshicheng: { generalId: 'zhangshicheng_zhangshicheng', tier: 'famous', tacticalSkillId: 'ts_299', strategicSkillId: 'str_13', advantageSkillId: 'ts_029', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_299', aptitude: 'reverse' }, // 大周盐丁
    gumie_liuyu: { generalId: 'gumie_liuyu', tier: 'ordinary', tacticalSkillId: 'ts_174', advantageSkillId: 'ts_174', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_411', aptitude: 'create' },
    hu_d_husansheng: { generalId: 'hu_d_husansheng', tier: 'ordinary', tacticalSkillId: 'ts_015', advantageSkillId: 'ts_399', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_018', aptitude: 'leverage' },
    unassigned_ganning: { generalId: 'unassigned_ganning', tier: 'famous', tacticalSkillId: 'ts_026', strategicSkillId: 'str_12', advantageSkillId: 'ts_007', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_026', aptitude: 'reverse' }, // 锦帆百骑
    wuyue_qianliu: { generalId: 'wuyue_qianliu', tier: 'famous', tacticalSkillId: 'ts_387', advantageSkillId: 'ts_005', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_387', strategicSkillId: 'str_14', aptitude: 'create' }, // 保境安民·建吴越
    qiufu_qiufu: { generalId: 'qiufu_qiufu', tier: 'ordinary', tacticalSkillId: 'ts_026', advantageSkillId: 'ts_390', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_026', aptitude: 'reverse' }, // 裘甫起义
    shenshi_shenqingzhi: { generalId: 'shenshi_shenqingzhi', tier: 'ordinary', tacticalSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_034', aptitude: 'reverse' },
    huangwang_huangchao: { generalId: 'huangwang_huangchao', tier: 'ordinary', tacticalSkillId: 'ts_121', advantageSkillId: 'ts_121', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_409', aptitude: 'create' }, // 冲天大将军
    lujian_zhanghuangyan: { generalId: 'lujian_zhanghuangyan', tier: 'ordinary', tacticalSkillId: 'ts_109', advantageSkillId: 'ts_109', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_039', aptitude: 'create' }, // 鲁监抗清
    linshihong_linshihong: { generalId: 'linshihong_linshihong', tier: 'ordinary', tacticalSkillId: 'ts_096', advantageSkillId: 'ts_028', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_096', aptitude: 'reverse' }, // 楚帝鄱阳
    liu_yingbu: { generalId: 'liu_yingbu', tier: 'famous', tacticalSkillId: 'ts_375', strategicSkillId: 'str_01', advantageSkillId: 'ts_375', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_017', aptitude: 'create' },
    unassigned_wangchao: { generalId: 'unassigned_wangchao', tier: 'ordinary', tacticalSkillId: 'ts_015', advantageSkillId: 'ts_399', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_414', aptitude: 'leverage' }, // 光州入闽
    shuntian_linshuangwen: { generalId: 'shuntian_linshuangwen', tier: 'ordinary', tacticalSkillId: 'ts_144', advantageSkillId: 'ts_021', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_144', aptitude: 'reverse' },
    chunshen_huangxie: { generalId: 'chunshen_huangxie', tier: 'ordinary', tacticalSkillId: 'ts_035', advantageSkillId: 'ts_022', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_035', aptitude: 'reverse' },
    shanyue_sunce: { generalId: 'shanyue_sunce', tier: 'famous', tacticalSkillId: 'ts_175', strategicSkillId: 'str_12', advantageSkillId: 'ts_175', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_016', aptitude: 'create' }, // 江东小霸王·席卷六郡（先声夺人）
    she_ethnic_leiwanxing: { generalId: 'she_ethnic_leiwanxing', tier: 'ordinary', tacticalSkillId: 'ts_151', advantageSkillId: 'ts_021', balanceSkillId: 'ts_151', disadvantageSkillId: 'ts_409', aptitude: 'leverage' }, // 畲民起义
    unassigned_pushougeng: { generalId: 'unassigned_pushougeng', tier: 'ordinary', tacticalSkillId: 'ts_033', advantageSkillId: 'ts_022', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_033', aptitude: 'reverse' }, // 泉州蒲氏
    wang_s_wanghua: { generalId: 'wang_s_wanghua', tier: 'ordinary', tacticalSkillId: 'ts_167', advantageSkillId: 'ts_391', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_167', aptitude: 'reverse' },
    kejia_wentianxiang: { generalId: 'kejia_wentianxiang', tier: 'ordinary', tacticalSkillId: 'ts_031', advantageSkillId: 'ts_401', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_031', aptitude: 'reverse' },
    tingzhou_d_chenmin: { generalId: 'tingzhou_d_chenmin', tier: 'ordinary', tacticalSkillId: 'ts_374', advantageSkillId: 'ts_392', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_374', aptitude: 'reverse' }, // 瑞金·陈敏破敌军抗元
    chu_d_lukang: { generalId: 'chu_d_lukang', tier: 'ordinary', tacticalSkillId: 'ts_111', advantageSkillId: 'ts_047', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_111', aptitude: 'reverse' }, // 庐江太守守城抗孙策
    ying_caojingzong: { generalId: 'ying_caojingzong', tier: 'famous', tacticalSkillId: 'ts_376', strategicSkillId: 'str_12', advantageSkillId: 'ts_376', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_038', aptitude: 'create' },
    fu2_zhoudi: { generalId: 'fu2_zhoudi', tier: 'ordinary', tacticalSkillId: 'ts_029', advantageSkillId: 'ts_029', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_020', aptitude: 'create' }, // 陈周迪据临川拒讨
    ouyang_ouyangwei: { generalId: 'ouyang_ouyangwei', tier: 'ordinary', tacticalSkillId: 'ts_098', advantageSkillId: 'ts_005', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_098', aptitude: 'reverse' }, // 梁欧阳頠庐陵蛮兵
    unassigned_chunshenjun_h: { generalId: 'unassigned_chunshenjun_h', tier: 'ordinary', tacticalSkillId: 'ts_035', advantageSkillId: 'ts_390', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_035', aptitude: 'reverse' }, // 黄国后裔
    danyang_huanwen: { generalId: 'danyang_huanwen', tier: 'famous', tacticalSkillId: 'ts_259', advantageSkillId: 'ts_259', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_416', strategicSkillId: 'str_01', aptitude: 'create' },
    chizhou_changyuchun: { generalId: 'chizhou_changyuchun', tier: 'famous', tacticalSkillId: 'ts_258', strategicSkillId: 'str_01', advantageSkillId: 'ts_258', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_419', aptitude: 'create' },
    zhong_xiexuan: { generalId: 'zhong_xiexuan', tier: 'famous', tacticalSkillId: 'ts_157', strategicSkillId: 'str_09', advantageSkillId: 'ts_430', balanceSkillId: 'ts_431', disadvantageSkillId: 'ts_157', aptitude: 'reverse' }, // 风声鹤唳（淝水之战）
    yuan_yuanshu: { generalId: 'yuan_yuanshu', tier: 'ordinary', tacticalSkillId: 'ts_137', advantageSkillId: 'ts_028', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_137', aptitude: 'reverse' },
    daxi_ming_zhangxianzhong: { generalId: 'daxi_ming_zhangxianzhong', tier: 'famous', tacticalSkillId: 'ts_125', strategicSkillId: 'str_06', advantageSkillId: 'ts_495', balanceSkillId: 'ts_496', disadvantageSkillId: 'ts_125', aptitude: 'create' }, // 大西王
    sunwu_d_sunquan: { generalId: 'sunwu_d_sunquan', tier: 'ordinary', tacticalSkillId: 'ts_033', advantageSkillId: 'ts_389', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_033', aptitude: 'reverse' }, // 赤壁抗曹
    // ── 2026-06-20 批量补充缺失档案 ──
    zhao_lianpo: { generalId: 'zhao_lianpo', tier: 'famous', tacticalSkillId: 'ts_160', strategicSkillId: 'str_05', advantageSkillId: 'ts_160', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_016', aptitude: 'reverse' },
    unassigned_liduozuo: {
        generalId: 'unassigned_liduozuo',
        tier: 'ordinary',
        tacticalSkillId: 'ts_026',
        aptitude: 'reverse',
    },
    min_wangshenzhi: {
        generalId: 'min_wangshenzhi',
        tier: 'ordinary',
        tacticalSkillId: 'ts_034', advantageSkillId: 'ts_001', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_034',
        aptitude: 'reverse',
    },
    quanzhou_liucongxiao: {
        generalId: 'quanzhou_liucongxiao',
        tier: 'ordinary',
        tacticalSkillId: 'ts_058', advantageSkillId: 'ts_058', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_413',
        aptitude: 'create',
    },
    unassigned_yangyizhong: {
        generalId: 'unassigned_yangyizhong',
        tier: 'famous',
        tacticalSkillId: 'ts_016',
        strategicSkillId: 'str_08',
        aptitude: 'leverage',
    },
    kaga_d_xiajianlailian: {
        generalId: 'kaga_d_xiajianlailian',
        tier: 'ordinary',
        tacticalSkillId: 'ts_018', advantageSkillId: 'ts_027', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_018',
        aptitude: 'reverse',
    },
    lelang_wangqi: {
        generalId: 'lelang_wangqi',
        tier: 'ordinary',
        tacticalSkillId: 'ts_038', advantageSkillId: 'ts_004', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_038',
        aptitude: 'reverse',
    },
    anmei_yuwandaqin: {
        generalId: 'anmei_yuwandaqin',
        tier: 'ordinary',
        tacticalSkillId: 'ts_016', advantageSkillId: 'ts_027', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_016',
        aptitude: 'reverse',
    },
    naju_d_wangjian_wangye: { generalId: 'naju_d_wangjian_wangye', tier: 'ordinary', tacticalSkillId: 'ts_018', advantageSkillId: 'ts_400', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_018', aptitude: 'reverse' },
    huimo_gaoyanshou: {
        generalId: 'huimo_gaoyanshou',
        tier: 'ordinary',
        tacticalSkillId: 'ts_026', advantageSkillId: 'ts_028', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_026',
        aptitude: 'reverse',
    },
    aola_menglielun: {
        generalId: 'aola_menglielun',
        tier: 'ordinary',
        tacticalSkillId: 'ts_159', advantageSkillId: 'ts_400', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_159',
        aptitude: 'reverse',
    },
    ewenki_gentemuer: { generalId: 'ewenki_gentemuer', tier: 'ordinary', tacticalSkillId: 'ts_095', advantageSkillId: 'ts_028', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_095', aptitude: 'reverse' },
    haixi_nvzhen_baiyindali: { generalId: 'haixi_nvzhen_baiyindali', tier: 'ordinary', tacticalSkillId: 'ts_065', advantageSkillId: 'ts_390', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_065', aptitude: 'reverse' },
    dazhen_wanyantiege: { generalId: 'dazhen_wanyantiege', tier: 'ordinary', tacticalSkillId: 'ts_010', advantageSkillId: 'ts_010', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_039', aptitude: 'create' },
    xianbei_tuobamao: {
        generalId: 'xianbei_tuobamao',
        tier: 'ordinary',
        tacticalSkillId: 'ts_016', advantageSkillId: 'ts_049', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_016',
        aptitude: 'reverse',
    },
    dada_ming_dayanhan: {
        generalId: 'dada_ming_dayanhan',
        tier: 'famous',
        tacticalSkillId: 'ts_132', advantageSkillId: 'ts_132', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_025',
        strategicSkillId: 'str_12',
        aptitude: 'create',
    },
    luzhou_zhangwenxiu: {
        generalId: 'luzhou_zhangwenxiu',
        tier: 'ordinary',
        tacticalSkillId: 'ts_170', advantageSkillId: 'ts_170', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_419',
        aptitude: 'create',
    },
    tuoming_tuomin: {
        generalId: 'tuoming_tuomin',
        tier: 'ordinary',
        tacticalSkillId: 'ts_006', advantageSkillId: 'ts_391', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_006',
        aptitude: 'reverse',
    },
    pisha_weichisheng: {
        generalId: 'pisha_weichisheng',
        tier: 'ordinary',
        tacticalSkillId: 'ts_011', advantageSkillId: 'ts_402', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_011',
        aptitude: 'reverse',
    },

    unassigned_angui: {
        generalId: 'unassigned_angui',
        tier: 'ordinary',
        tacticalSkillId: 'ts_011',
        aptitude: 'reverse',
    },
    guangwu_xinwuxian: { generalId: 'guangwu_xinwuxian', tier: 'famous', tacticalSkillId: 'ts_377', strategicSkillId: 'str_01', advantageSkillId: 'ts_377', balanceSkillId: 'ts_490', disadvantageSkillId: 'ts_491', aptitude: 'create' },
    nguyen_guangnan_ruanfuying: { generalId: 'nguyen_guangnan_ruanfuying', tier: 'famous', tacticalSkillId: 'ts_332', strategicSkillId: 'str_14', advantageSkillId: 'ts_332', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_418', aptitude: 'leverage' },
    fushi_wangmeng: { generalId: 'fushi_wangmeng', tier: 'famous', tacticalSkillId: 'ts_279', strategicSkillId: 'str_14', advantageSkillId: 'ts_279', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_036', aptitude: 'create' },
    ba_bamanzi: {
        generalId: 'ba_bamanzi',
        tier: 'ordinary',
        tacticalSkillId: 'ts_024', advantageSkillId: 'ts_401', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_024',
        aptitude: 'reverse',
    },
    zhongshan_yangaoqing: {
        generalId: 'zhongshan_yangaoqing',
        tier: 'ordinary',
        tacticalSkillId: 'ts_143', advantageSkillId: 'ts_002', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_143',
        aptitude: 'reverse',
    },
    unassigned_duanxiushi: {
        generalId: 'unassigned_duanxiushi',
        tier: 'ordinary',
        tacticalSkillId: 'ts_026',
        aptitude: 'reverse',
    },
    jinan_tiexuan: { generalId: 'jinan_tiexuan', tier: 'famous', tacticalSkillId: 'ts_195', strategicSkillId: 'str_08', advantageSkillId: 'ts_392', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_195', aptitude: 'reverse' },
    unassigned_guandingfu: {
        generalId: 'unassigned_guandingfu',
        tier: 'ordinary',
        tacticalSkillId: 'ts_026',
        aptitude: 'reverse',
    },
    dixiang_wangmang: {
        generalId: 'dixiang_wangmang',
        tier: 'ordinary',
        tacticalSkillId: 'ts_022', advantageSkillId: 'ts_022', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_031', // ⑨釜底抽薪（昆阳大败之主）
        aptitude: 'create',
    },
    qing_quduan: { generalId: 'qing_quduan', tier: 'famous', tacticalSkillId: 'ts_146', strategicSkillId: 'str_02', advantageSkillId: 'ts_146', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_036', aptitude: 'create' },
    zhuozhou_anlushan: {
        generalId: 'zhuozhou_anlushan',
        tier: 'famous',
        tacticalSkillId: 'ts_226', advantageSkillId: 'ts_226', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_033',
        strategicSkillId: 'str_13',
        aptitude: 'create',
    },
    changshan_yangyanzhao: { generalId: 'changshan_yangyanzhao', tier: 'famous', tacticalSkillId: 'ts_209', strategicSkillId: 'str_08', advantageSkillId: 'ts_737', balanceSkillId: 'ts_738', disadvantageSkillId: 'ts_209', aptitude: 'reverse' },
    wangyan_wangyan: {
        generalId: 'wangyan_wangyan',
        tier: 'ordinary',
        tacticalSkillId: 'ts_110', advantageSkillId: 'ts_400', balanceSkillId: 'ts_110', disadvantageSkillId: 'ts_411',
        aptitude: 'leverage',
    },
    wu_sunwu: {
        generalId: 'wu_sunwu',
        tier: 'famous',
        tacticalSkillId: 'ts_149', advantageSkillId: 'ts_001', balanceSkillId: 'ts_149', disadvantageSkillId: 'ts_018',
        strategicSkillId: 'str_02',
        aptitude: 'leverage',
    },
    hongzhou_zhuwenzheng: { generalId: 'hongzhou_zhuwenzheng', tier: 'famous', tacticalSkillId: 'ts_263', strategicSkillId: 'str_08', advantageSkillId: 'ts_633', balanceSkillId: 'ts_634', disadvantageSkillId: 'ts_263', aptitude: 'reverse' },
    zhuqian_shaoerzineng: { generalId: 'zhuqian_shaoerzineng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_001', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_036', aptitude: 'create' },
    fu_zhou_yanyan: {
        generalId: 'fu_zhou_yanyan',
        tier: 'ordinary',
        tacticalSkillId: 'ts_166', advantageSkillId: 'ts_389', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_166',
        aptitude: 'reverse',
    },
    lushui_dongzhuo: { generalId: 'lushui_dongzhuo', tier: 'ordinary', tacticalSkillId: 'ts_016', advantageSkillId: 'ts_390', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_016', aptitude: 'reverse' },
    cen_d_cenmeng: { generalId: 'cen_d_cenmeng', tier: 'ordinary', tacticalSkillId: 'ts_037', advantageSkillId: 'ts_047', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_037', aptitude: 'reverse' },
    miao_amishi: {
        generalId: 'miao_amishi',
        tier: 'ordinary',
        tacticalSkillId: 'ts_104', advantageSkillId: 'ts_402', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_104',
        aptitude: 'reverse',
    },
    jiang_s_huanggai: { generalId: 'jiang_s_huanggai', tier: 'ordinary', tacticalSkillId: 'ts_074', advantageSkillId: 'ts_074', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_008', aptitude: 'create' },
    muong_shencongyue: {
        generalId: 'muong_shencongyue',
        tier: 'ordinary',
        tacticalSkillId: 'ts_099', advantageSkillId: 'ts_001', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_099',
        aptitude: 'reverse',
    },
    panyao_panhu: {
        generalId: 'panyao_panhu',
        tier: 'ordinary',
        tacticalSkillId: 'ts_016', advantageSkillId: 'ts_004', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_016',
        aptitude: 'reverse',
    },
    chen2_zhaofan: {
        generalId: 'chen2_zhaofan',
        tier: 'ordinary',
        tacticalSkillId: 'ts_100', advantageSkillId: 'ts_021', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_100',
        aptitude: 'reverse',
    },
    qian_songjingyang: {
        generalId: 'qian_songjingyang',
        tier: 'ordinary',
        tacticalSkillId: 'ts_336', advantageSkillId: 'ts_336', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_409',
        aptitude: 'create',
    },
    jiashi_wangxuance: {
        generalId: 'jiashi_wangxuance',
        tier: 'famous',
        tacticalSkillId: 'ts_310', advantageSkillId: 'ts_310', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_017',
        strategicSkillId: 'str_07', // 借兵灭国
        aptitude: 'leverage',
    },
    yangtong_chisongdezan: {
        generalId: 'yangtong_chisongdezan',
        tier: 'famous',
        tacticalSkillId: 'ts_378', advantageSkillId: 'ts_378', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_006', strategicSkillId: 'str_14',
        aptitude: 'create',
    },
    monpa_meire: {
        generalId: 'monpa_meire',
        tier: 'ordinary',
        tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_419',
        aptitude: 'create',
    },
    xining_yangyingju: { generalId: 'xining_yangyingju', tier: 'ordinary', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_009', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_011', aptitude: 'reverse' },
    kalun_dexinga: { generalId: 'kalun_dexinga', tier: 'ordinary', tacticalSkillId: 'ts_007', advantageSkillId: 'ts_007', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_034', aptitude: 'create' },
    golog_wandezhaxi: {
        generalId: 'golog_wandezhaxi',
        tier: 'ordinary',
        tacticalSkillId: 'ts_025', advantageSkillId: 'ts_398', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_025',
        aptitude: 'reverse',
    },
    lopi_abo: {
        generalId: 'lopi_abo',
        tier: 'ordinary',
        tacticalSkillId: 'ts_025', advantageSkillId: 'ts_022', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_025',
        aptitude: 'reverse',
    },
    unassigned_donghuwang: {
        generalId: 'unassigned_donghuwang',
        tier: 'ordinary',
        tacticalSkillId: 'ts_021',
        aptitude: 'create',
    },
    dingling_weilu: {
        generalId: 'dingling_weilu',
        tier: 'ordinary',
        tacticalSkillId: 'ts_098', advantageSkillId: 'ts_001', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_098',
        aptitude: 'reverse',
    },
    hui_bunaibou: {
        generalId: 'hui_bunaibou',
        tier: 'ordinary',
        tacticalSkillId: 'ts_024',
        aptitude: 'reverse',
    },
    donghui_nanlv: {
        generalId: 'donghui_nanlv',
        tier: 'ordinary',
        tacticalSkillId: 'ts_096', advantageSkillId: 'ts_007', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_096',
        aptitude: 'reverse',
    },
    gonggu_gonggudaozhu: {
        generalId: 'gonggu_gonggudaozhu',
        tier: 'ordinary',
        tacticalSkillId: 'ts_031', advantageSkillId: 'ts_389', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_031',
        aptitude: 'reverse',
    },
    yizhi_beigou: {
        generalId: 'yizhi_beigou',
        tier: 'ordinary',
        tacticalSkillId: 'ts_016', advantageSkillId: 'ts_389', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_016',
        aptitude: 'reverse',
    },
    beihai_shamusheyun: {
        generalId: 'beihai_shamusheyun',
        tier: 'ordinary',
        tacticalSkillId: 'ts_144', advantageSkillId: 'ts_401', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_144',
        aptitude: 'reverse',
    },
    sheng_d_liyiqi: {
        generalId: 'sheng_d_liyiqi',
        tier: 'ordinary',
        tacticalSkillId: 'ts_217', advantageSkillId: 'ts_217', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_033',
        aptitude: 'create',
    },
    pyu_moluo: {
        generalId: 'pyu_moluo',
        tier: 'ordinary',
        tacticalSkillId: 'ts_151', advantageSkillId: 'ts_027', balanceSkillId: 'ts_151', disadvantageSkillId: 'ts_032',
        aptitude: 'leverage',
    },
    nongzhigao_huangshimi: {
        generalId: 'nongzhigao_huangshimi',
        tier: 'ordinary',
        tacticalSkillId: 'ts_017', advantageSkillId: 'ts_400', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_017',
        aptitude: 'reverse',
    },
    unassigned_weitou_wang: { generalId: 'unassigned_weitou_wang', tier: 'ordinary', tacticalSkillId: 'ts_018', advantageSkillId: 'ts_003', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_018', aptitude: 'reverse' }, // ???
    unassigned_yumi_wang: { generalId: 'unassigned_yumi_wang', tier: 'ordinary', tacticalSkillId: 'ts_026', advantageSkillId: 'ts_047', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_026', aptitude: 'reverse' }, // ???
    unassigned_qiemo_wang: { generalId: 'unassigned_qiemo_wang', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_031', aptitude: 'create' }, // ???
    unassigned_pishan_wang: { generalId: 'unassigned_pishan_wang', tier: 'ordinary', tacticalSkillId: 'ts_015', advantageSkillId: 'ts_389', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_048', aptitude: 'leverage' }, // ???
    ruoqiang_quhulai: { generalId: 'ruoqiang_quhulai', tier: 'ordinary', tacticalSkillId: 'ts_025', advantageSkillId: 'ts_010', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_025', aptitude: 'reverse' }, // ???
    unassigned_weili_wang: { generalId: 'unassigned_weili_wang', tier: 'ordinary', tacticalSkillId: 'ts_015', advantageSkillId: 'ts_391', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_025', aptitude: 'leverage' }, // ???
    unassigned_bailong_shuai: { generalId: 'unassigned_bailong_shuai', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_033', aptitude: 'create' }, // ?????
    unassigned_wensu_wang: { generalId: 'unassigned_wensu_wang', tier: 'ordinary', tacticalSkillId: 'ts_007', advantageSkillId: 'ts_007', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_026', aptitude: 'create' }, // ???
    duerbote_duerbote_taiji: { generalId: 'duerbote_duerbote_taiji', tier: 'ordinary', tacticalSkillId: 'ts_119', advantageSkillId: 'ts_119', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_031', aptitude: 'create' }, // ??????
    unassigned_sai_wang: { generalId: 'unassigned_sai_wang', tier: 'ordinary', tacticalSkillId: 'ts_026', advantageSkillId: 'ts_001', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_026', aptitude: 'reverse' }, // ??
    xiye_zihe: { generalId: 'xiye_zihe', tier: 'ordinary', tacticalSkillId: 'ts_069', advantageSkillId: 'ts_391', balanceSkillId: 'ts_069', disadvantageSkillId: 'ts_024', aptitude: 'leverage' }, // ???
    unassigned_huibu_boke: { generalId: 'unassigned_huibu_boke', tier: 'ordinary', tacticalSkillId: 'ts_014', advantageSkillId: 'ts_009', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_418', aptitude: 'leverage' }, // ????
    unassigned_faqiang_wang: { generalId: 'unassigned_faqiang_wang', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_411', aptitude: 'create' }, // ???
    unassigned_kangba_tusi: { generalId: 'unassigned_kangba_tusi', tier: 'ordinary', tacticalSkillId: 'ts_035', advantageSkillId: 'ts_390', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_035', aptitude: 'reverse' }, // ????
    unassigned_keliyaboke: { generalId: 'unassigned_keliyaboke', tier: 'ordinary', tacticalSkillId: 'ts_014', advantageSkillId: 'ts_003', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_032', aptitude: 'leverage' }, // ?????
    zhuoshi_gaopian: { generalId: 'zhuoshi_gaopian', tier: 'famous', tacticalSkillId: 'ts_305', strategicSkillId: 'str_01', advantageSkillId: 'ts_305', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_016', aptitude: 'create' }, // 高骈·临邛(镇西川)
    unassigned_yongguo_jun: { generalId: 'unassigned_yongguo_jun', tier: 'ordinary', tacticalSkillId: 'ts_025', advantageSkillId: 'ts_028', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_025', aptitude: 'reverse' }, // ????
    xingliao_dayanlin: { generalId: 'xingliao_dayanlin', tier: 'ordinary', tacticalSkillId: 'ts_204', advantageSkillId: 'ts_204', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_413', aptitude: 'create' }, // ??????
    unassigned_jingcheng_fushi: { generalId: 'unassigned_jingcheng_fushi', tier: 'ordinary', tacticalSkillId: 'ts_026', advantageSkillId: 'ts_392', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_026', aptitude: 'reverse' }, // ????
    unassigned_wangmang: { generalId: 'unassigned_wangmang', tier: 'ordinary', tacticalSkillId: 'ts_024', advantageSkillId: 'ts_005', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_024', aptitude: 'reverse' }, // ????
    xihai_d_fulianchou: { generalId: 'xihai_d_fulianchou', tier: 'ordinary', tacticalSkillId: 'ts_018', advantageSkillId: 'ts_009', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_018', aptitude: 'reverse' },
    unassigned_yaerbeige: { generalId: 'unassigned_yaerbeige', tier: 'ordinary', tacticalSkillId: 'ts_014', advantageSkillId: 'ts_391', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_024', aptitude: 'leverage' }, // 雅尔贝格
    guzgan_abuhalisi: { generalId: 'guzgan_abuhalisi', tier: 'ordinary', tacticalSkillId: 'ts_167', advantageSkillId: 'ts_028', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_167', aptitude: 'reverse' }, // 法里贡埃米尔法里亚布
    badakhshan_yaerbeige: { generalId: 'badakhshan_yaerbeige', tier: 'ordinary', tacticalSkillId: 'ts_374', advantageSkillId: 'ts_047', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_374', aptitude: 'reverse' }, // 唐护密国王法扎巴德
    kawusi_haidaer: { generalId: 'kawusi_haidaer', tier: 'ordinary', tacticalSkillId: 'ts_137', advantageSkillId: 'ts_398', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_137', aptitude: 'reverse' }, // 卡乌斯之子阿夫申吉扎克
    xianhai_shamalike: { generalId: 'xianhai_shamalike', tier: 'ordinary', tacticalSkillId: 'ts_058', advantageSkillId: 'ts_058', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_006', aptitude: 'create' }, // 乌古斯叶护养吉干
    wuhu_dukake: { generalId: 'wuhu_dukake', tier: 'ordinary', tacticalSkillId: 'ts_024', advantageSkillId: 'ts_010', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_024', aptitude: 'reverse' }, // 铁弓苏巴什真珠河
    unassigned_farighun: { generalId: 'unassigned_farighun', tier: 'ordinary', tacticalSkillId: 'ts_025', advantageSkillId: 'ts_028', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_025', aptitude: 'reverse' },
    unassigned_ali_asad: { generalId: 'unassigned_ali_asad', tier: 'ordinary', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_401', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_011', aptitude: 'reverse' },
    unassigned_afshin: { generalId: 'unassigned_afshin', tier: 'ordinary', tacticalSkillId: 'ts_015', advantageSkillId: 'ts_009', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_416', aptitude: 'leverage' },
    unassigned_aral_bek: { generalId: 'unassigned_aral_bek', tier: 'ordinary', tacticalSkillId: 'ts_014', advantageSkillId: 'ts_009', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_006', aptitude: 'leverage' },
    unassigned_seljuk: { generalId: 'unassigned_seljuk', tier: 'ordinary', tacticalSkillId: 'ts_015', advantageSkillId: 'ts_392', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_037', aptitude: 'leverage' },
    unassigned_xingan_zhang: { generalId: 'unassigned_xingan_zhang', tier: 'ordinary', tacticalSkillId: 'ts_035', advantageSkillId: 'ts_023', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_035', aptitude: 'reverse' },
    unassigned_dongping_zhang: { generalId: 'unassigned_dongping_zhang', tier: 'ordinary', tacticalSkillId: 'ts_035', advantageSkillId: 'ts_030', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_035', aptitude: 'reverse' },
    yun_wuli: { generalId: 'yun_wuli', tier: 'ordinary', tacticalSkillId: 'ts_159', advantageSkillId: 'ts_389', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_159', aptitude: 'reverse' }, // 卢氏戎子吾离陆浑关
    unassigned_yuchisheng_k: { generalId: 'unassigned_yuchisheng_k', tier: 'ordinary', tacticalSkillId: 'ts_002', advantageSkillId: 'ts_002', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_018', aptitude: 'create' }, // 尉迟胜克里雅山口
    bailong_suomai: { generalId: 'bailong_suomai', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_034', aptitude: 'create' }, // 索劢屯田楼兰三陇沙
    sai_gaijiayun: { generalId: 'sai_gaijiayun', tier: 'famous', tacticalSkillId: 'ts_339', strategicSkillId: 'str_07', advantageSkillId: 'ts_339', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_026', aptitude: 'create' }, // 盖嘉运拔换城握瑟德
    weiwuer_yusubu: { generalId: 'weiwuer_yusubu', tier: 'ordinary', tacticalSkillId: 'ts_002', advantageSkillId: 'ts_002', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_419', aptitude: 'create' }, // 玉素布阿克苏玉尔滚
    kangba_suonuomugunbu: { generalId: 'kangba_suonuomugunbu', tier: 'ordinary', tacticalSkillId: 'ts_134', advantageSkillId: 'ts_134', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_412', aptitude: 'create' }, // 索诺木衮布理塘宣抚司
    yong_lujili: { generalId: 'yong_lujili', tier: 'ordinary', tacticalSkillId: 'ts_111', advantageSkillId: 'ts_023', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_111', aptitude: 'reverse' }, // 庐戢黎庸将竹山
    jingcheng_d_yuyouzhao: { generalId: 'jingcheng_d_yuyouzhao', tier: 'famous', tacticalSkillId: 'ts_359', strategicSkillId: 'str_09', advantageSkillId: 'ts_359', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_417', aptitude: 'create' },
    unassigned_tianyi: { generalId: 'unassigned_tianyi', tier: 'ordinary', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_030', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_011', aptitude: 'reverse' }, // 田邑上党太守长子

    // ── 2026-06-20 补全：FactionGenerals 有将无档（add:check 33 条）──
    nifuhe_baerhudai: { generalId: 'nifuhe_baerhudai', tier: 'ordinary', tacticalSkillId: 'ts_025', advantageSkillId: 'ts_022', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_025', aptitude: 'reverse' },
    donghu_tuiyin: { generalId: 'donghu_tuiyin', tier: 'ordinary', tacticalSkillId: 'ts_095', advantageSkillId: 'ts_003', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_095', aptitude: 'reverse' }, // 东胡推寅
    yingzhou_ying_d_muronghuang: { generalId: 'yingzhou_ying_d_muronghuang', tier: 'famous', tacticalSkillId: 'ts_150', advantageSkillId: 'ts_150', balanceSkillId: 'ts_664', disadvantageSkillId: 'ts_665', strategicSkillId: 'str_14', aptitude: 'create' }, // 慕容皝范阳燕
    dingzhou_d_murongchui: { generalId: 'dingzhou_d_murongchui', tier: 'famous', tacticalSkillId: 'ts_210', strategicSkillId: 'str_11', advantageSkillId: 'ts_210', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_031', aptitude: 'create' }, // 慕容垂·枋头以寡击众破桓温追歼襄邑；八千鲜卑甲骑追奔兵贵神速
    oirat_ming_gaerdan: { generalId: 'oirat_ming_gaerdan', tier: 'famous', tacticalSkillId: 'ts_237', strategicSkillId: 'str_07', advantageSkillId: 'ts_237', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_020', aptitude: 'create' },
    qianhui_baiyanhu: { generalId: 'qianhui_baiyanhu', tier: 'ordinary', tacticalSkillId: 'ts_033', advantageSkillId: 'ts_392', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_033', aptitude: 'reverse' }, // 白彦虎回军
    ganden_zongkaba: { generalId: 'ganden_zongkaba', tier: 'ordinary', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_007', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_011', aptitude: 'reverse' },
    mon_monuhe: { generalId: 'mon_monuhe', tier: 'ordinary', tacticalSkillId: 'ts_034', advantageSkillId: 'ts_030', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_034', aptitude: 'reverse' }, // 摩奴诃·孟族
    weili_weilifan: { generalId: 'weili_weilifan', tier: 'ordinary', tacticalSkillId: 'ts_031', advantageSkillId: 'ts_029', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_031', aptitude: 'reverse' }, // 尉犁泛
    pishan_daihu: { generalId: 'pishan_daihu', tier: 'ordinary', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_021', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_011', aptitude: 'reverse' }, // 代胡·皮山
    nanai_zhahaluo: { generalId: 'nanai_zhahaluo', tier: 'ordinary', tacticalSkillId: 'ts_086', advantageSkillId: 'ts_390', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_086', aptitude: 'reverse' }, // 扎哈罗·那乃
    feiyaka_cemutehe: { generalId: 'feiyaka_cemutehe', tier: 'ordinary', tacticalSkillId: 'ts_152', advantageSkillId: 'ts_152', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_012', aptitude: 'create' }, // 策穆特赫·费雅喀
    tuva_qinggunzabu: { generalId: 'tuva_qinggunzabu', tier: 'ordinary', tacticalSkillId: 'ts_065', advantageSkillId: 'ts_400', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_065', aptitude: 'reverse' }, // 青滚杂卜·图瓦
    dalung_sangjiwen: { generalId: 'dalung_sangjiwen', tier: 'ordinary', tacticalSkillId: 'ts_088', advantageSkillId: 'ts_088', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_020', aptitude: 'create' }, // 桑吉温·达隆
    hor_chisang: { generalId: 'hor_chisang', tier: 'ordinary', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_029', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_011', aptitude: 'reverse' }, // 赤桑·霍尔
    dong_nangqianjiabo: { generalId: 'dong_nangqianjiabo', tier: 'ordinary', tacticalSkillId: 'ts_025', advantageSkillId: 'ts_022', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_025', aptitude: 'reverse' }, // 囊谦加波·隆庆
    xingan_hailancha: { generalId: 'xingan_hailancha', tier: 'famous', tacticalSkillId: 'ts_243', strategicSkillId: 'str_07', advantageSkillId: 'ts_243', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_411', aptitude: 'create' },
    lingqiu_zhaowuling: { generalId: 'lingqiu_zhaowuling', tier: 'famous', tacticalSkillId: 'ts_214', strategicSkillId: 'str_14', advantageSkillId: 'ts_214', balanceSkillId: 'ts_733', disadvantageSkillId: 'ts_734', aptitude: 'create' },
    unassigned_zhouyuji_nw: { generalId: 'unassigned_zhouyuji_nw', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_15', advantageSkillId: 'ts_402', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_031', aptitude: 'reverse' }, // 周遇吉·楼烦
    yumi_anguo: { generalId: 'yumi_anguo', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_013', aptitude: 'create' }, // 扜弥王安国
    keliya_fuduxin: { generalId: 'keliya_fuduxin', tier: 'ordinary', tacticalSkillId: 'ts_032', advantageSkillId: 'ts_023', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_032', aptitude: 'reverse' }, // 伏阇信·克里雅
    faqiang_niechizanpu: { generalId: 'faqiang_niechizanpu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_001', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_409', aptitude: 'create' }, // 聂赤·发羌
    niang_suonanjiabo: { generalId: 'niang_suonanjiabo', tier: 'ordinary', tacticalSkillId: 'ts_025', advantageSkillId: 'ts_005', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_025', aptitude: 'reverse' }, // 索南加波·觉木宗
    wensu_guyi: { generalId: 'wensu_guyi', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_021', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_419', aptitude: 'create' }, // 姑翼·温宿
    qiemo_anmoshenpan: { generalId: 'qiemo_anmoshenpan', tier: 'ordinary', tacticalSkillId: 'ts_018', advantageSkillId: 'ts_402', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_018', aptitude: 'reverse' }, // 安末深盘·且末
    weitou_douti: { generalId: 'weitou_douti', tier: 'ordinary', tacticalSkillId: 'ts_033', advantageSkillId: 'ts_007', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_033', aptitude: 'reverse' }, // 兜题·尉头
    eluoke_amuhaer: { generalId: 'eluoke_amuhaer', tier: 'ordinary', tacticalSkillId: 'ts_005', advantageSkillId: 'ts_005', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_040', aptitude: 'create' }, // 阿穆哈尔·鄂罗克
    dongping_langtan: { generalId: 'dongping_langtan', tier: 'ordinary', tacticalSkillId: 'ts_003', advantageSkillId: 'ts_003', balanceSkillId: 'ts_405', disadvantageSkillId: 'ts_410', aptitude: 'create' }, // 郎坦·东平
    buriat_tumenjiergale: { generalId: 'buriat_tumenjiergale', tier: 'ordinary', tacticalSkillId: 'ts_024', advantageSkillId: 'ts_400', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_024', aptitude: 'reverse' }, // 图门吉尔嘎勒·布里亚特
    baidi_baidizi: { generalId: 'baidi_baidizi', tier: 'ordinary', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_401', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_011', aptitude: 'reverse' }, // 白狄子
    kumoxi_ahuihui: { generalId: 'kumoxi_ahuihui', tier: 'ordinary', tacticalSkillId: 'ts_006', advantageSkillId: 'ts_047', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_006', aptitude: 'reverse' }, // 阿会毁·库莫奚
    haikou_wangzhi: { generalId: 'haikou_wangzhi', tier: 'ordinary', tacticalSkillId: 'ts_037', advantageSkillId: 'ts_049', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_037', aptitude: 'reverse' },
    shanshan_weituqi: { generalId: 'shanshan_weituqi', tier: 'ordinary', tacticalSkillId: 'ts_010', advantageSkillId: 'ts_010', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_035', aptitude: 'create' }, // 尉屠耆·鄯善
    pangzha_halixinge: { generalId: 'pangzha_halixinge', tier: 'famous', tacticalSkillId: 'ts_151', strategicSkillId: 'str_11', advantageSkillId: 'ts_392', balanceSkillId: 'ts_151', disadvantageSkillId: 'ts_025', aptitude: 'create' }, // 哈里·辛格·旁遮普：攻战计侵掠如火+攻城拔寨，开伯尔山口工程
    najie_minande: { generalId: 'najie_minande', tier: 'famous', tacticalSkillId: 'ts_352', strategicSkillId: 'str_13', advantageSkillId: 'ts_352', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_024', aptitude: 'create' },
    dulan_d_aihamaide: { generalId: 'dulan_d_aihamaide', tier: 'famous', tacticalSkillId: 'ts_152', strategicSkillId: 'str_01', advantageSkillId: 'ts_152', balanceSkillId: 'ts_502', disadvantageSkillId: 'ts_503', aptitude: 'leverage' }, // 艾哈迈德·杜兰尼：攻战计侵掠如火+攻城拔寨，九征印度建帝国
    muer_mujier: { generalId: 'muer_mujier', tier: 'ordinary', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_029', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_011', aptitude: 'reverse' },
    baha_gaiwamu: { generalId: 'baha_gaiwamu', tier: 'ordinary', tacticalSkillId: 'ts_104', advantageSkillId: 'ts_022', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_104', aptitude: 'reverse' },
    hali_gedaerzi: { generalId: 'hali_gedaerzi', tier: 'ordinary', tacticalSkillId: 'ts_024', advantageSkillId: 'ts_390', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_024', aptitude: 'reverse' },
    kalan_suhela: { generalId: 'kalan_suhela', tier: 'ordinary', tacticalSkillId: 'ts_110', advantageSkillId: 'ts_002', balanceSkillId: 'ts_110', disadvantageSkillId: 'ts_411', aptitude: 'leverage' }, // 苏赫拉·卡伦：敌战计避实击虚+攻城拔寨，萨珊东北铁壁
    xisi_yakubusafaer: { generalId: 'xisi_yakubusafaer', tier: 'famous', tacticalSkillId: 'ts_353', strategicSkillId: 'str_01', advantageSkillId: 'ts_353', balanceSkillId: 'ts_396', disadvantageSkillId: 'ts_409', aptitude: 'create' }, // 雅库布·萨法尔·锡斯坦：攻战计侵掠如火+攻城拔寨，铜匠起兵席卷呼罗珊
    delan_sulun: { generalId: 'delan_sulun', tier: 'famous', tacticalSkillId: 'ts_153', strategicSkillId: 'str_13', advantageSkillId: 'ts_153', balanceSkillId: 'ts_499', disadvantageSkillId: 'ts_500', aptitude: 'leverage' }, // 苏伦·德兰吉亚：敌战计避实击虚+长驱直入，帕提亚回马箭灭克拉苏
    huluo_jiyasiding: { generalId: 'huluo_jiyasiding', tier: 'famous', tacticalSkillId: 'ts_154', strategicSkillId: 'str_01', advantageSkillId: 'ts_154', balanceSkillId: 'ts_532', disadvantageSkillId: 'ts_533', aptitude: 'create' },
    aba_shapuer: { generalId: 'aba_shapuer', tier: 'famous', tacticalSkillId: 'ts_329', strategicSkillId: 'str_13', advantageSkillId: 'ts_329', balanceSkillId: 'ts_463', disadvantageSkillId: 'ts_464', aptitude: 'create' }, // 沙普尔·阿巴尔：攻战计侵掠如火+长驱直入，三破罗马擒瓦勒良
    wenling_shilang: { generalId: 'wenling_shilang', tier: 'famous', tacticalSkillId: 'ts_287', strategicSkillId: 'str_09', advantageSkillId: 'ts_287', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_045', aptitude: 'leverage' },

    qianzhou_lisheng: {
        generalId: 'qianzhou_lisheng',
        tier: 'famous',
        tacticalSkillId: 'ts_155', advantageSkillId: 'ts_155', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_040',
        strategicSkillId: 'str_03',
        aptitude: 'create',
    },
    xiao_d_xiaoyan: { generalId: 'xiao_d_xiaoyan', tier: 'famous', tacticalSkillId: 'ts_204', advantageSkillId: 'ts_204', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_034', strategicSkillId: 'str_06', aptitude: 'create' },
    unassigned_sudinfang: {
        generalId: 'unassigned_sudinfang',
        tier: 'famous',
        tacticalSkillId: 'ts_025',
        strategicSkillId: 'str_15',
        aptitude: 'create',
    },
    loufan_xuerengui: { generalId: 'loufan_xuerengui', tier: 'famous', tacticalSkillId: 'ts_216', strategicSkillId: 'str_09', advantageSkillId: 'ts_400', balanceSkillId: 'ts_216', disadvantageSkillId: 'ts_018', aptitude: 'create' },
    cai_lishuo: { generalId: 'cai_lishuo', tier: 'famous', tacticalSkillId: 'ts_003', strategicSkillId: 'str_15', advantageSkillId: 'ts_003', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_720', aptitude: 'create' }, // 石勒：改用通用攻战典故，避免误挂李愬专属史事
    qingyuan_bd_zhoudewei: { generalId: 'qingyuan_bd_zhoudewei', tier: 'famous', tacticalSkillId: 'ts_218', strategicSkillId: 'str_12', advantageSkillId: 'ts_002', balanceSkillId: 'ts_218', disadvantageSkillId: 'ts_034', aptitude: 'create' },
    heyuan_d_heichichangzhi: {
        generalId: 'heyuan_d_heichichangzhi',
        tier: 'famous',
        tacticalSkillId: 'ts_300', advantageSkillId: 'ts_300', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_006',
        strategicSkillId: 'str_08',
        aptitude: 'create',
    },
    wuzhou_d_wangxiaojie: {
        generalId: 'wuzhou_d_wangxiaojie',
        tier: 'famous',
        tacticalSkillId: 'ts_297',
        strategicSkillId: 'str_08',
        aptitude: 'create',
    },
    changshaguo_xinqiji: { generalId: 'changshaguo_xinqiji', tier: 'ordinary', tacticalSkillId: 'ts_176', advantageSkillId: 'ts_401', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_176', aptitude: 'reverse' },
    qian_d_yudayou: { generalId: 'qian_d_yudayou', tier: 'famous', tacticalSkillId: 'ts_288', strategicSkillId: 'str_02', advantageSkillId: 'ts_288', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_026', aptitude: 'create' },
    chuzhou_d_huangfuhui: {
        generalId: 'chuzhou_d_huangfuhui',
        tier: 'ordinary',
        tacticalSkillId: 'ts_038', advantageSkillId: 'ts_005', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_038',
        aptitude: 'reverse',
    },
    shule_aersilan: {
        generalId: 'shule_aersilan',
        tier: 'ordinary',
        tacticalSkillId: 'ts_099', advantageSkillId: 'ts_030', balanceSkillId: 'ts_406', disadvantageSkillId: 'ts_099',
        aptitude: 'reverse',
    },
    liguo_zhaoshe: { generalId: 'liguo_zhaoshe', tier: 'famous', tacticalSkillId: 'ts_189', strategicSkillId: 'str_05', advantageSkillId: 'ts_399', balanceSkillId: 'ts_697', disadvantageSkillId: 'ts_189', aptitude: 'leverage' },
    hongnong_jun_yangsu: { generalId: 'hongnong_jun_yangsu', tier: 'famous', tacticalSkillId: 'ts_194', strategicSkillId: 'str_02', advantageSkillId: 'ts_194', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_418', aptitude: 'create' },
    weihaiwei_sudingfang: {
        generalId: 'weihaiwei_sudingfang',
        tier: 'famous',
        tacticalSkillId: 'ts_116', advantageSkillId: 'ts_116', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_008',
        strategicSkillId: 'str_07',
        aptitude: 'create',
    }, // 苏定方：灭西突厥、平百济，长驱万里
    // ── 2026-06-29 新增：马殷 ──
    yingzhou_d2_licunxu: { generalId: 'yingzhou_d2_licunxu', tier: 'famous', tacticalSkillId: 'ts_120', strategicSkillId: 'str_01', advantageSkillId: 'ts_120', balanceSkillId: 'ts_628', disadvantageSkillId: 'ts_629', aptitude: 'create' },
    anxi_guoxin: { generalId: 'anxi_guoxin', tier: 'famous', tacticalSkillId: 'ts_296', advantageSkillId: 'ts_002', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_296', strategicSkillId: 'str_08', aptitude: 'reverse' },
    ahaomu_laqite: { generalId: 'ahaomu_laqite', tier: 'famous', tacticalSkillId: 'ts_343', strategicSkillId: 'str_10', advantageSkillId: 'ts_343', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_025', aptitude: 'leverage' },
    dongshengwei_wangyue: { generalId: 'dongshengwei_wangyue', tier: 'famous', tacticalSkillId: 'ts_251', strategicSkillId: 'str_13', aptitude: 'create', advantageSkillId: 'ts_251', balanceSkillId: 'ts_735', disadvantageSkillId: 'ts_736', },
    funan_fanman: { generalId: 'funan_fanman', tier: 'famous', tacticalSkillId: 'ts_342', strategicSkillId: 'str_14', advantageSkillId: 'ts_342', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_419', aptitude: 'create' },
    gurkha_baduersaye: { generalId: 'gurkha_baduersaye', tier: 'famous', tacticalSkillId: 'ts_325', strategicSkillId: 'str_10', advantageSkillId: 'ts_325', balanceSkillId: 'ts_520', disadvantageSkillId: 'ts_521', aptitude: 'create' },
    huige_gulipeiluo: { generalId: 'huige_gulipeiluo', tier: 'famous', tacticalSkillId: 'ts_133', strategicSkillId: 'str_13', advantageSkillId: 'ts_133', balanceSkillId: 'ts_529', disadvantageSkillId: 'ts_530', aptitude: 'create' },
    kala_satuke: { generalId: 'kala_satuke', tier: 'ordinary', tacticalSkillId: 'ts_005', advantageSkillId: 'ts_005', balanceSkillId: 'ts_408', disadvantageSkillId: 'ts_025', aptitude: 'create' },
    lancang_faang: { generalId: 'lancang_faang', tier: 'famous', tacticalSkillId: 'ts_324', strategicSkillId: 'str_13', advantageSkillId: 'ts_324', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_008', aptitude: 'create' },
    liuzhou_shenxiyi: { generalId: 'liuzhou_shenxiyi', tier: 'famous', tacticalSkillId: 'ts_323', strategicSkillId: 'str_08', advantageSkillId: 'ts_323', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_041', aptitude: 'create' },
    luming_luxiangsheng: { generalId: 'luming_luxiangsheng', tier: 'famous', tacticalSkillId: 'ts_179', strategicSkillId: 'str_03', advantageSkillId: 'ts_179', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_036', aptitude: 'create' },
    wuzhou_limu: { generalId: 'wuzhou_limu', tier: 'famous', tacticalSkillId: 'ts_241', strategicSkillId: 'str_05', advantageSkillId: 'ts_241', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_413', aptitude: 'leverage' },
    weiyuan_d_niangengyao: { generalId: 'weiyuan_d_niangengyao', tier: 'famous', tacticalSkillId: 'ts_272', strategicSkillId: 'str_07', advantageSkillId: 'ts_272', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_711', aptitude: 'create' },
    shaodang_mitang: { generalId: 'shaodang_mitang', tier: 'ordinary', tacticalSkillId: 'ts_009', advantageSkillId: 'ts_009', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_037', aptitude: 'create' },
    yanqi_longtuqizhi: { generalId: 'yanqi_longtuqizhi', tier: 'ordinary', tacticalSkillId: 'ts_026', advantageSkillId: 'ts_009', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_026', aptitude: 'reverse' },
    yuezhi_xihou: { generalId: 'yuezhi_xihou', tier: 'ordinary', tacticalSkillId: 'ts_096', advantageSkillId: 'ts_021', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_096', aptitude: 'reverse' },
    zizhou_wangjian: { generalId: 'zizhou_wangjian', tier: 'famous', tacticalSkillId: 'ts_322', strategicSkillId: 'str_14', advantageSkillId: 'ts_322', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_414', aptitude: 'create' },
    choros_tuohuan: { generalId: 'choros_tuohuan', tier: 'famous', tacticalSkillId: 'ts_228', strategicSkillId: 'str_01', advantageSkillId: 'ts_228', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_419', aptitude: 'create' },
    chenla_duyebamo: { generalId: 'chenla_duyebamo', tier: 'famous', tacticalSkillId: 'ts_129', strategicSkillId: 'str_14', advantageSkillId: 'ts_129', balanceSkillId: 'ts_484', disadvantageSkillId: 'ts_485', aptitude: 'create' },
    weiming_huhanxie: { generalId: 'weiming_huhanxie', tier: 'ordinary', tacticalSkillId: 'ts_379' , advantageSkillId: 'ts_379', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_419', aptitude: 'create' },
    xiazhou_lijiqian: { generalId: 'xiazhou_lijiqian', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_13' , advantageSkillId: 'ts_001', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_006', aptitude: 'create' },
    shizhou_liucong: { generalId: 'shizhou_liucong', tier: 'ordinary', tacticalSkillId: 'ts_247' , advantageSkillId: 'ts_247', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_417', aptitude: 'create' },

    yanzhou_zhongshiheng: { generalId: 'yanzhou_zhongshiheng', tier: 'ordinary', tacticalSkillId: 'ts_006', advantageSkillId: 'ts_001', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_006', aptitude: 'leverage' },
    yansui_wangwei: { generalId: 'yansui_wangwei', tier: 'ordinary', tacticalSkillId: 'ts_409', advantageSkillId: 'ts_047', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_409', aptitude: 'reverse' },
    tongma_taishici: { generalId: 'tongma_taishici', tier: 'ordinary', tacticalSkillId: 'ts_159', advantageSkillId: 'ts_399', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_159', aptitude: 'reverse' },
};

export function getGeneralProfile(generalId: string | undefined): GeneralProfile | null {
    if (!generalId) return null;
    return GENERAL_PROFILES[generalId] ?? null;
}

/** v1 baseEffect → 旧 effect 桥接（ts_xxx 武将挂载后引擎兼容） */
const V1_EFFECT_BRIDGE: Record<string, { effect: TacticalEffect; timing: TacticalTiming }> = {
    ally_power_mult:            { effect: 'ally_mult_1_2',      timing: 'opening' },
    first_sortie_power_mult:    { effect: 'ally_mult_1_2',      timing: 'opening' },
    enemy_sub_troops_opening:   { effect: 'enemy_sub_troops',   timing: 'opening' },
    ally_add_troops_comeback:   { effect: 'ally_add_troops',    timing: 'comeback' },
    win_casualty_reduction:     { effect: 'ally_casualty_reduce', timing: 'opening' },
    // ── 命运系 ──
    luck_variance_self:         { effect: 'ally_luck_up',       timing: 'opening' },
    luck_variance_enemy:        { effect: 'enemy_luck_down',    timing: 'opening' },
    luck_lock_self:             { effect: 'ally_luck_lock',     timing: 'opening' },
    recompute_comeback:         { effect: 'ally_recompute',     timing: 'comeback' },
    // ── 兵力系 ──
    ally_add_troops_opening:    { effect: 'ally_add_troops',    timing: 'opening' },
    // ── 战损系 ──
    elite_casualty_reduction:   { effect: 'ally_elite_casualty', timing: 'opening' },
    lose_enemy_casualty_boost:  { effect: 'lose_effect',        timing: 'comeback' },
    lose_zero_enemy_recovery:   { effect: 'lose_effect',        timing: 'comeback' },
    post_recovery_rate:         { effect: 'ally_recovery',      timing: 'comeback' },
    // ── 对抗系 ──
    negate_enemy_skill:         { effect: 'enemy_counter',      timing: 'opening' },
    partial_negate_enemy_skill: { effect: 'enemy_counter',      timing: 'opening' },
    steal_enemy_skill:          { effect: 'enemy_counter',      timing: 'opening' },
    reflect_enemy_opening_cut:  { effect: 'opening_counter',    timing: 'opening' },
    nullify_enemy_opening_cut:  { effect: 'opening_counter',    timing: 'opening' },
    cancel_enemy_terrain_buff:  { effect: 'terrain_counter',    timing: 'opening' },
    halve_enemy_terrain_buff:   { effect: 'terrain_counter',    timing: 'opening' },
    // ts_029 肉薄骨并（dual_sub_troops_opening）已由 v1 原生路径实现双向削兵（GeneralSkillCombat + combat-model）。
};

/** v1 phase → 旧 timing（side_comeback 条件技的 phase 被桥接到 comeback timing） */
function bridgeV1PhaseToTiming(entry: { phase: string; condition: string }): TacticalTiming {
    if (entry.condition === 'side_comeback') return 'comeback';
    if (entry.phase === 'mid_battle_comeback') return 'comeback';
    return 'opening';
}

export function getTacticalSkillDef(skillId: string | null | undefined): TacticalSkillDef | null {
    if (!skillId) return null; // 防御：无战术技（null/空）直接返回，避免下方 startsWith 崩溃
    const direct = TACTICAL_SKILL_CATALOG[skillId];
    if (direct) return direct;
    // v1 桥接：武将已迁移到 ts_xxx，用 v1 catalog 合成旧格式 def
    if (!skillId.startsWith('ts_')) return null;
    const v1 = getTacticalSkillEntry(skillId);
    if (!v1) return null;
    const bridge = V1_EFFECT_BRIDGE[v1.baseEffect];
    if (!bridge) return null;
    const timing = bridgeV1PhaseToTiming(v1);
    const onceEffects: TacticalEffect[] = ['ally_add_troops', 'enemy_sub_troops', 'ally_invincible'];
    return {
        id: v1.id,
        grid: `v1-${v1.index}`,
        displayName: v1.displayName,
        timing,
        effect: bridge.effect,
        magnitude: v1.magnitude,
        isOncePerBattle: timing === 'comeback' || onceEffects.includes(bridge.effect),
    };
}

export {
    getTacticalSkillEntry,
    getTacticalSkillEntryForGeneral,
    TACTICAL_SKILL_ENTRIES_V1,
    TACTICAL_SKILL_BY_ID,
    type TacticalSkillEntry,
    type TacticalSeries,
    type TacticalBaseEffect,
} from './TacticalSkillCatalog';

export function getStrategicSkillDef(skillId: string): StrategicSkillDef | null {
    return STRATEGIC_SKILL_CATALOG[skillId] ?? null;
}

// @ts-ignore
if (import.meta.hot) {
    // @ts-ignore
    import.meta.hot.accept((newModule: any) => {
        if (!newModule?.GENERAL_PROFILES) return;
        const target = GENERAL_PROFILES as Record<string, any>;
        for (const key of Object.keys(target)) delete target[key];
        Object.assign(target, newModule.GENERAL_PROFILES);
        console.log(`[HMR] GeneralSkills → ${Object.keys(newModule.GENERAL_PROFILES).length} 条武将技已热更新`);
    });
};
