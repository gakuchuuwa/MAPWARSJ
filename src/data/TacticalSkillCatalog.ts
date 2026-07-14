/**
 * 战术技数据表（793 条，含通用池 49 + T0/T1/T2 名将专属 + 大批量配发技）
 * layer=tactical；战略技将来同表加 layer=strategic。
 * 本文件只定义数据，战斗挂钩见 TacticalSkillResolver.ts / GeneralSkillCombat.ts。
 */
import type { BattleType } from '../combat/CombatSystem';
import type { LandTerrainKind } from '../world/land-sea';

export type SkillLayer = 'tactical' | 'strategic';

/** @deprecated 旧五系组织标签（仅数据层内部残留，不参与战斗/分配判定）。设计分类以三势六计为准。 */
export type TacticalSeries =
    | 'enhance'
    | 'fate'
    | 'troop'
    | 'casualty'
    | 'counter';

/** 结算时点（按战斗流程排序） */
export type TacticalSkillPhase =
    | 'pre_opening_troops'    // 掷点前：实兵增减
    | 'opening_roll'          // 开局掷点 / 战力乘区 / luck 方差
    | 'mid_battle_passive'    // 战斗中被动（减伤等）
    | 'mid_battle_comeback'   // 逆局重掷
    | 'post_battle';          // 战后结算

/** 引擎实现状态 */
export type TacticalEngineStatus = 'ready' | 'hook' | 'new';

/**
 * 基础效果（10 机制模板展开；同名不同条件/档位 = 不同条目）
 * 注：#19 风声鹤唳 与 #12 破釜沉舟 数学等价（扰敌 luck ≈ 己方 luck 拉宽），平衡须联动调。
 */
export type TacticalBaseEffect =
    | 'ally_power_mult'
    | 'luck_variance_self'
    | 'luck_variance_enemy'
    | 'luck_lock_self'
    | 'recompute_comeback'
    | 'enemy_sub_troops_opening'
    | 'ally_add_troops_opening'
    | 'ally_add_troops_comeback'
    | 'dual_sub_troops_opening'
    | 'win_casualty_reduction'
    | 'lose_enemy_casualty_boost'
    | 'post_recovery_rate'
    | 'lose_zero_enemy_recovery'
    | 'elite_casualty_reduction'
    | 'negate_enemy_skill'
    | 'partial_negate_enemy_skill'
    | 'steal_enemy_skill'
    | 'reflect_enemy_opening_cut'
    | 'cancel_enemy_terrain_buff'
    | 'halve_enemy_terrain_buff'
    | 'nullify_enemy_opening_cut'
    | 'battle_duration_mult'    // 战斗时长乘区：<1=加速结束，>1=拖延
    | 'first_sortie_power_mult'
    | 'first_sortie_comeback_mult';

/** 触发条件（观众可辨者优先） */
export type TacticalSkillCondition =
    | 'always'
    | 'terrain_mountain'
    | 'terrain_plain'
    | 'terrain_sea'
    | 'battle_siege_attacker'
    | 'battle_siege_defender'
    | 'battle_field'
    | 'ratio_underdog'
    | 'self_troops_reach_ten_thousand'
    | 'enemy_different_culture'
    | 'enemy_famous_general'
    | 'side_comeback'
    | 'enemy_troops_below_pct'
    | 'self_troops_below_enemy_pct'
    | 'lose_as_underdog'
    | 'has_elite_legion'
    | 'first_sortie'
    | 'siege_attacker_on_water';

export interface TacticalSkillEntry {
    id: string;
    layer: 'tactical';
    series: TacticalSeries;
    /** 列表序号 1–49（定稿编号） */
    index: number;
    displayName: string;
    sourceQuote: string;
    baseEffect: TacticalBaseEffect;
    condition: TacticalSkillCondition;
    phase: TacticalSkillPhase;
    /** 主参数：乘区、削兵比例、减伤比例、恢复率目标、阈值等 */
    magnitude: number;
    /** luck 下限 / 副参数（如双削比例大档） */
    luckMin?: number;
    luckMax?: number;
    /** 逆局重掷触发线（占开战兵力比例，默认 0.8） */
    comebackThreshold?: number;
    /** 互斥组：同组一将只能持一（如死地后生 vs 济河焚舟） */
    mutexGroup?: string;
    engineStatus: TacticalEngineStatus;
    /** 旧 tac_01–tac_10 兼容映射（迁移期） */
    legacyTacId?: string;
    /** 备注：皮肤关系、平衡注意等 */
    note?: string;
    /** 第一标签：技能用途分类（通用 / 攻击 / 防御），控制攻防六槽分配 */
    usageTag?: '双行' | '攻击' | '防御';
    // ── 编辑器内联元数据（2026-07-14 起，skill-editor.html 写入；内联为唯一权威，缺省回退散表→推导）──
    /** 三势标签（优势/均势/劣势）；内联优先于 SKILL_SITUATION_TAG 散表 */
    situationTag?: SkillSituationTag;
    /** 典故主 generalId（在册武将）；有主 = 专属，无主 = 通用（内联优先于 SKILL_CHARACTER/SKILL_EXCLUSIVE_TAG） */
    ownerGeneralId?: string;
    /** 典故主显示名（与 ownerGeneralId 同步写入，展示与出处一致性校验用） */
    ownerName?: string;
    /** 条目状态：active=在役（默认）/ retired=退役（不参与分配与覆盖检查） */
    status?: 'active' | 'retired';
}

/** 条件判定上下文（Resolver 入参） */
export interface TacticalConditionContext {
    battleType: BattleType;
    terrain: LandTerrainKind | null;
    selfTroops: number;
    enemyTroops: number;
    selfInitialTroops: number;
    enemyInitialTroops: number;
    selfIsAttacker: boolean;
    selfHasFamousGeneral: boolean;
    enemyHasFamousGeneral: boolean;
    selfDifferentCultureFromEnemy: boolean;
    selfHasEliteLegion: boolean;
    isFirstSortieSinceDepart: boolean;
    /** 当前侧是否已达逆局阈值 */
    sideInComeback: boolean;
}

// ── 三类六种（唯一判据代码；条文见 docs/02-design/武将技-分类逻辑说明.md）──────
// 分类只看 baseEffect（第1步 效果→六种）＋ 劣势 condition 强制覆盖（第3步），
// 不看典故、不看技名、不看 series（仅是内部组织标签，勿混）。

/** 六种（手法家族，借三十六计六套之名） */
export type TacticalSixSet =
    | 'gongzhan'   // 攻战·机：加己攻
    | 'shengzhan'  // 胜战·全：减敌兵
    | 'dizhan'     // 敌战·衡：更随机
    | 'hunzhan'    // 混战·乱：克夺反
    | 'bingzhan'   // 并战·借：减己损
    | 'baizhan';   // 败战·险：败不垒

/** 三类（战局标签，与 GeneralSkillCombat.BattleSituation 同字面量） */
export type TacticalTriClass = 'advantage' | 'balance' | 'disadvantage';

export const SIX_SET_LABEL: Readonly<Record<TacticalSixSet, string>> = {
    gongzhan: '攻战', shengzhan: '胜战', dizhan: '敌战',
    hunzhan: '混战', bingzhan: '并战', baizhan: '败战',

};

export const TRI_CLASS_LABEL: Readonly<Record<TacticalTriClass, string>> = {
    advantage: '优势技（碾压计）', balance: '均势技（破局计）', disadvantage: '劣势技（翻盘计）',
};

/** 第1步：baseEffect → 六种（Record 穷举，新增 effect 不配则编译报错） */
export const EFFECT_TO_SIX_SET: Readonly<Record<TacticalBaseEffect, TacticalSixSet>> = {
    // 攻战·机（加己攻）
    ally_power_mult: 'gongzhan',
    first_sortie_power_mult: 'gongzhan',
    // 胜战·全（减敌兵）
    enemy_sub_troops_opening: 'shengzhan',
    dual_sub_troops_opening: 'shengzhan',
    // 敌战·衡（更随机；方差效果由 VARIANCE_EFFECTS 强制归劣势）
    luck_variance_self: 'dizhan',
    luck_variance_enemy: 'dizhan',
    luck_lock_self: 'dizhan',
    // 混战·乱（克夺反 + 增兵破局）
    ally_add_troops_opening: 'hunzhan',
    steal_enemy_skill: 'hunzhan',
    negate_enemy_skill: 'hunzhan',
    partial_negate_enemy_skill: 'hunzhan',
    reflect_enemy_opening_cut: 'hunzhan',
    nullify_enemy_opening_cut: 'hunzhan',
    cancel_enemy_terrain_buff: 'hunzhan',
    halve_enemy_terrain_buff: 'hunzhan',
    battle_duration_mult: 'hunzhan',
    // 并战·借（减己损）
    win_casualty_reduction: 'bingzhan',
    elite_casualty_reduction: 'bingzhan',
    post_recovery_rate: 'bingzhan',
    // 败战·险（败不垒 + 首战逆袭）
    lose_enemy_casualty_boost: 'baizhan',
    recompute_comeback: 'baizhan',
    lose_zero_enemy_recovery: 'baizhan',
    ally_add_troops_comeback: 'baizhan',
    first_sortie_comeback_mult: 'baizhan',
};

/** 第2步：六种 → 三类（攻·胜=优势 / 敌·混=均势 / 并·败=劣势） */
export const SIX_SET_TO_TRI_CLASS: Readonly<Record<TacticalSixSet, TacticalTriClass>> = {
    gongzhan: 'advantage', shengzhan: 'advantage',
    dizhan: 'balance', hunzhan: 'balance',
    bingzhan: 'disadvantage', baizhan: 'disadvantage',
};

/** 第3步：劣势才触发的 condition —— 强制归劣势（唯一覆盖规则，如破釜沉舟） */
export const UNDERDOG_CONDITIONS: ReadonlySet<TacticalSkillCondition> = new Set([
    'ratio_underdog',
    'self_troops_below_enemy_pct',
    'side_comeback',
    'lose_as_underdog',
]);

/** 方差/投机效果 —— 扩大随机性是劣势策略，强制归劣势 */
export const VARIANCE_EFFECTS: ReadonlySet<TacticalBaseEffect> = new Set<TacticalBaseEffect>([
    'luck_variance_self',
    // luck_variance_enemy 归 dizhan→均势（散阵遏骑/溃围断后/拔帜易帜 等名将专属均局技）
    'luck_lock_self',
    'recompute_comeback',
]);

export function getTacticalSixSet(entry: TacticalSkillEntry): TacticalSixSet {
    return EFFECT_TO_SIX_SET[entry.baseEffect];
}

export function getTacticalTriClass(entry: TacticalSkillEntry): TacticalTriClass {
    if (UNDERDOG_CONDITIONS.has(entry.condition)) return 'disadvantage';
    if (VARIANCE_EFFECTS.has(entry.baseEffect)) return 'disadvantage';
    return SIX_SET_TO_TRI_CLASS[EFFECT_TO_SIX_SET[entry.baseEffect]];
}

// ── 一、攻战/胜战类（ally_power_mult / enemy_sub_troops）──
const ENHANCE: TacticalSkillEntry[] = [
    {
        id: 'ts_001', layer: 'tactical', series: 'enhance', index: 1,
        displayName: '百战不殆', sourceQuote: '《孙子兵法·谋攻》：“知彼知己，百战不殆。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready', legacyTacId: 'tac_01',
    },
    {
        id: 'ts_002', layer: 'tactical', series: 'enhance', index: 2,
        displayName: '居高临下', sourceQuote: '《后汉书·马援传》：“据高临下，势如劈竹。”',
        baseEffect: 'ally_power_mult', condition: 'terrain_mountain', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_003', layer: 'tactical', series: 'enhance', index: 3,
        displayName: '长驱直入', sourceQuote: '《战国策·燕策》：“长驱至齐，齐王遁逃。”',
        baseEffect: 'ally_power_mult', condition: 'terrain_plain', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_004', ownerName: '祖逖', ownerGeneralId: 'yuzhou_zuti', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'troop', index: 4,
        displayName: '中流击楫', sourceQuote: '《晋书·祖逖传》：“中流击楫而誓。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_005', layer: 'tactical', series: 'enhance', index: 5,
        displayName: '摧城拔寨', sourceQuote: '《三国演义》：“先主怒……摧城拔寨。”',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_attacker', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_006', usageTag: '防御', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 6,
        displayName: '金城汤池', sourceQuote: '《汉书·蒯通传》：“皆为金城汤池，不可攻也。”',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_defender', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_007', ownerName: '项羽', ownerGeneralId: 'xichu_xiangyu', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 7,
        displayName: '原野交锋', sourceQuote: '《史记·项羽本纪》：“与汉王原野争锋。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
        // 【2026-07-03 主人定】描述写「野战加成」，但游戏中野战少、攻城多，故 battle_field
        // 引擎语义 = 进攻方加成：攻城/野战只要我方进攻即 ×1.25，仅守城方不吃（见 TacticalSkillResolver）。
        note: '原野争锋 ×1.25：描述为野战加成，实战按【进攻方】结算（攻城/野战通吃，守城不吃），避免野战稀少辜负名将',
    },
    {
        id: 'ts_008', usageTag: '攻击', situationTag: '劣势', ownerGeneralId: 'jiujiang_zhouyu', layer: 'tactical', series: 'enhance', index: 8,
        displayName: '以寡击众', sourceQuote: '兵力劣势下主动出击以少打多，绝境搏杀，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_009', layer: 'tactical', series: 'enhance', index: 9,
        displayName: '扫穴犁庭', sourceQuote: '《明史》：“犁其庭，扫其闾，绝其本根。”',
        baseEffect: 'ally_power_mult', condition: 'enemy_different_culture', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
        note: '需将势力文化区传入战斗层；【2026-07-03】×1.3→×1.25：跨文化交战率~92%=准无条件，×1.3 长期压过基准锚点',
    },
    {
        id: 'ts_010', layer: 'tactical', series: 'enhance', index: 10,
        displayName: '擒贼擒王', sourceQuote: '《杜甫·前出塞》：“射人先射马，擒贼先擒王。”',
        baseEffect: 'ally_power_mult', condition: 'enemy_famous_general', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_011', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 11,
        displayName: '绝地反击', sourceQuote: '《孙子兵法·九地》：“投之亡地然后存，陷之死地然后生。”',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready'},
    {
        id: 'ts_049', layer: 'tactical', series: 'enhance', index: 49,
        displayName: '一鼓作气', sourceQuote: '《左传·庄公十年》：“夫战，勇气也。一鼓作气，再而衰，三而竭。”',
        baseEffect: 'first_sortie_power_mult', condition: 'first_sortie', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
        note: '出征首战×1.25（桥接 ally_mult_1_2 + first_sortie 门控）；契合名将远征首战爆发看点',
    },

    {
        id: 'ts_815', usageTag: '防御', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 815,
        displayName: '以逸待劳', sourceQuote: '《三十六计·第四计》：困敌之势，不以战，损刚益柔。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_816', ownerGeneralId: 'xianyu_hanxin', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 816,
        displayName: '声东击西', sourceQuote: '《三十六计·第六计》：敌志乱萃，不虞，坤下兑上之象。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
];

// ── 二、敌战/混战类（luck_variance / steal / negate）──
const FATE: TacticalSkillEntry[] = [
    {
        id: 'ts_012', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 12,
        displayName: '破釜沉舟', ownerName: '项羽', ownerGeneralId: 'xichu_xiangyu', sourceQuote: '【项羽】巨鹿之战破釜沉舟，绝地反击大破秦军。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.5, engineStatus: 'ready',
        mutexGroup: 'deep_gamble',
        note: '深劣势(本方<敌70%)·纯方差[0.5,1.5]；与 ts_020 济河焚舟同 deep_gamble 组二选一（本技全开方差博上限，济河下限0.9稳赌）；巨鹿以少击多决死'},
    {
        id: 'ts_013', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 13,
        displayName: '背水一战', sourceQuote: '《史记·淮阴侯列传》：“信乃使万人先行，出，背水阵。”（韩信）',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.5, engineStatus: 'ready'},
    {
        id: 'ts_014', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 14,
        displayName: '步步为营', sourceQuote: '败军后撤时稳扎稳打边退边建营垒巩固防线，多将皆有。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_015', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 15,
        displayName: '进退有度', sourceQuote: '败局中从容调度退而不溃保存实力，多将皆有。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_016', usageTag: '双行', situationTag: '劣势', layer: 'tactical', series: 'fate', index: 16,
        displayName: '见机而作', sourceQuote: '《周易·系辞下》：“君子见机而作，不俟终日。”',
        baseEffect: 'recompute_comeback', condition: 'side_comeback', phase: 'mid_battle_comeback',
        magnitude: 1, comebackThreshold: 0.8, engineStatus: 'ready',
    },
    {
        id: 'ts_017', layer: 'tactical', series: 'fate', index: 17,
        displayName: '转败为功', sourceQuote: '《史记·管晏列传》：“善因祸而为福，转败而为功。”',
        baseEffect: 'recompute_comeback', condition: 'side_comeback', phase: 'mid_battle_comeback',
        magnitude: 1, comebackThreshold: 0.5, engineStatus: 'ready',
    },
    {
        id: 'ts_018', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 18,
        displayName: '死地后生', sourceQuote: '《孙膑兵法》：“必死者可生，必生者可死。”',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
        note: '浅劣势(本方<敌100%)·独占方差[0.5,1.5]；破釜/济河需<70%敌不触发此窗口→死地在70%~100%劣势区独占，不再被济河严格压制'},
    {
        id: 'ts_019', ownerName: '谢玄', ownerGeneralId: 'zhong_xiexuan', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 19,
        displayName: '风声鹤唳', sourceQuote: '【谢玄】淝水之战秦军溃败，风声鹤唳',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
        note: '淝水追击溃敌，己方乘胜摧锋；谢玄率北府兵趁势掩杀，秦军全线崩溃。'},
    {
        id: 'ts_020', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 20,
        displayName: '济河焚舟', sourceQuote: '《左传·僖公二十八年》：“济河焚舟，示无还心。”',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.5, engineStatus: 'ready',
        mutexGroup: 'deep_gamble',
        note: '深劣势(本方<敌70%)·上偏稳赌[0.9,1.5]均值1.2；与 ts_012 破釜沉舟同 deep_gamble 组二选一（本技下限0.9稳，破釜全开方差博上限）'},
];

// ── 三、兵力增减技（enemy_sub_troops / ally_add_troops / dual）──
const TROOP: TacticalSkillEntry[] = [
    {
        id: 'ts_021', layer: 'tactical', series: 'troop', index: 21,
        displayName: '先声夺人', sourceQuote: '《左传·襄公二十六年》：“先人有夺人之心。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready', legacyTacId: 'tac_02',
    },
    {
        id: 'ts_022', ownerName: '曹操', ownerGeneralId: 'cao_d_caocao', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'troop', index: 22,
        displayName: '乘瑕袭隙', sourceQuote: '【曹操】官渡之战袭乌巢，乘其不备',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
        // 【2026-07-03】削20%→15%：always 高频 + 103 将持有，削20%→触发时~90% 超高频上限88%。
        // 降至15%→×1.176→~82%，回归「广发型温和削兵」；削敌阶梯 先声夺人10% < 本技15% < 夜半劫营25%(稀有个位数名将)。
    },
    {
        id: 'ts_023', ownerName: '狄青', ownerGeneralId: 'zhai_han_diqing', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'troop', index: 23,
        displayName: '夜半劫营', sourceQuote: '【狄青】夜袭昆仑关，乘夜破敌',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
        note: '稀有大档；【2026-07-03】30%→25%：削30% 胜率~99% 无悬念；稀有度靠分配层（仅个位数名将），不加逆局门槛（夜袭=开局奇袭）',
    },
    {
        id: 'ts_024', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'troop', index: 24,
        displayName: '反戈一击', sourceQuote: '《尚书·武成》：“前徒倒戈，攻于后以北。”',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.25, engineStatus: 'ready',
        note: 'magnitude=0.25 → 25%概率否决敌技（2026-07-13 起 negate 按 magnitude 概率触发，修复此前必否决 bug）',
    },
    {
        id: 'ts_025', usageTag: '双行', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 25,
        displayName: '重整旗鼓', sourceQuote: '《左传·成公二年》：“师乃复整旗鼓。”',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
        note: '补兵封顶开战上限；仅兵力少于敌军时触发（逆风局战前重整）'},
    {
        id: 'ts_026', layer: 'tactical', series: 'troop', index: 26,
        displayName: '百折不挠', ownerName: '蔡邕', sourceQuote: '《汉书·蔡邕传》：“百折不挠者，期报国也。”',
        baseEffect: 'ally_add_troops_comeback', condition: 'side_comeback', phase: 'mid_battle_comeback',
        magnitude: 0.12, engineStatus: 'ready', legacyTacId: 'tac_06',
        note: '逆局归队，按开战兵力×0.12补员，封顶开战上限（2026-07-04 由0.2下调）',
    },
    {
        id: 'ts_027', layer: 'tactical', series: 'troop', index: 27,
        displayName: '四面楚歌', ownerName: '韩信', sourceQuote: '《史记·项羽本纪》：“夜闻汉军四面皆楚歌。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_siege_attacker', phase: 'pre_opening_troops',
        magnitude: 0.09, engineStatus: 'ready',
    },
    {
        id: 'ts_028', layer: 'tactical', series: 'troop', index: 28,
        displayName: '半渡而击', sourceQuote: '《孙子兵法·行军》：“令半渡而击之，利。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'terrain_sea', phase: 'pre_opening_troops',
        magnitude: 0.09, engineStatus: 'ready',
        mutexGroup: 'water_opening_cut',
    },
    {
        id: 'ts_029', layer: 'tactical', series: 'troop', index: 29,
        displayName: '肉薄骨并', sourceQuote: '《三国志·典韦传》：宛城断后，短兵接战，肉搏而死',
        baseEffect: 'dual_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
        note: '火牛陷阵大档=15% 皮肤，同机制',
    },
    {
        id: 'ts_030', layer: 'tactical', series: 'troop', index: 30,
        displayName: '借风纵火', ownerName: '周瑜', sourceQuote: '【周瑜】赤壁借东风火烧曹营',
        baseEffect: 'enemy_sub_troops_opening', condition: 'siege_attacker_on_water', phase: 'pre_opening_troops',
        magnitude: 0.09, engineStatus: 'ready',
        mutexGroup: 'water_opening_cut',
    },
];

// ── 四、并战/败战类（casualty_reduction / recovery / bite）──
const CASUALTY: TacticalSkillEntry[] = [
    {
        id: 'ts_031', usageTag: '双行', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 31,
        displayName: '游刃有余', sourceQuote: '《庄子·养生主》：“恢恢乎其于游刃必有余地矣。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready'},
    {
        id: 'ts_032', usageTag: '双行', situationTag: '优势', layer: 'tactical', series: 'troop', index: 32,
        displayName: '兵不血刃', sourceQuote: '《荀子·议兵》：“远者慕其德，兵不血刃。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready'},
    {
        id: 'ts_033', layer: 'tactical', series: 'casualty', index: 33,
        displayName: '绝境逆搏', sourceQuote: '《左传·宣公十二年》：“困兽犹斗，况国相乎！”',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.25, engineStatus: 'ready',
        note: '败时咬人：胜方本场战损×1.5；胜方保底存活 10% 初始兵',
    },
    {
        id: 'ts_034', layer: 'tactical', series: 'casualty', index: 34,
        displayName: '宁为玉碎', sourceQuote: '《北齐书·元景安传》：“大丈夫宁为玉碎，不为瓦全。”',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.25, engineStatus: 'ready',
        note: '败时咬人：胜方本场战损×2；胜方保底存活 10% 初始兵',
    },
    {
        id: 'ts_035', layer: 'tactical', series: 'casualty', index: 35,
        displayName: '休养生息', sourceQuote: '《唐书·高祖纪》：“扫除烦苛，与民休息。”',
        baseEffect: 'post_recovery_rate', condition: 'always', phase: 'post_battle',
        magnitude: 0.5, engineStatus: 'ready',
    },
    {
        id: 'ts_036', ownerName: '吴起', ownerGeneralId: 'wei_wuqi', usageTag: '双行', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 36,
        displayName: '爱兵如子', sourceQuote: '《孙子兵法·地形》：“视卒如婴儿，故可与之赴深溪。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready'},
    {
        id: 'ts_037', layer: 'tactical', series: 'casualty', index: 37,
        displayName: '众志成城', sourceQuote: '《国语·周语下》：“众心成城，众口铄金。”',
        baseEffect: 'win_casualty_reduction', condition: 'battle_siege_defender', phase: 'mid_battle_passive',
        magnitude: 0.5, engineStatus: 'ready',
        note: '守城胜时战损再减半',
    },
    {
        id: 'ts_038', layer: 'tactical', series: 'casualty', index: 38,
        displayName: '虽败犹荣', ownerName: '羊祜', sourceQuote: '《晋书·羊祜传》：“虽败犹有荣也。”',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'lose_as_underdog', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '以少敌多而败，咬人：胜方本场战损×2；胜方保底存活 10% 初始兵',
    },
    {
        id: 'ts_039', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'troop', index: 39,
        displayName: '斩草除根', sourceQuote: '《左传·隐公六年》：“绝其本根，勿使能殖。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
        note: '我败时，胜方战后恢复率归零'},
    {
        id: 'ts_040', usageTag: '双行', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 40,
        displayName: '如臂使指', sourceQuote: '《汉书·贾谊传》：“如身之使臂，臂之使指，莫不制从。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready'},
    {
        id: 'ts_041', usageTag: '双行', situationTag: '优势', layer: 'tactical', series: 'troop', index: 41,
        displayName: '穷寇勿迫', sourceQuote: '《孙子兵法·军争》：“归师勿遏，围师必阙，穷寇勿迫。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
        note: '敌兵<20% 时己方战损-40%'},
];

// ── 五、对抗反制技（negate / partial_negate / steal / reflect）──
const COUNTER: TacticalSkillEntry[] = [
    {
        id: 'ts_042', layer: 'tactical', series: 'counter', index: 42,
        displayName: '料敌机先', sourceQuote: '《孙膑兵法·威王问》：“料敌将者，以机先之。”',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 0.25, status: 'retired', engineStatus: 'ready',
        note: '完全否决敌方战术技（视为无技）；敌无将/无技时不触发。magnitude=1 → 100%否决（negate 按 magnitude 概率触发）',
    },
    {
        id: 'ts_043', layer: 'tactical', series: 'counter', index: 43,
        displayName: '借策还施', sourceQuote: '《三国志·郭嘉传》注引：“因其计而用之。”',
        baseEffect: 'partial_negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 0.25, engineStatus: 'ready',
        note: 'magnitude=0.7 是【70%概率完全否决敌技】，非按比例缩放；字段名 partial_negate 易误读，实现走概率门（跨量纲通用+直播悬念）',
    },
    {
        id: 'ts_044', layer: 'tactical', series: 'counter', index: 44,
        displayName: '以子之矛', sourceQuote: '《韩非子·难一》：“以子之矛，陷子之盾，何如？”',
        baseEffect: 'steal_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 0.5, engineStatus: 'ready',
        note: '绝品：magnitude=0.5 → 50%概率夺取敌技为己用，失败则仅否决。【2026-07-03 定】不设100%夺取（否决+复制双收益过强）；直播牌面「夺【破釜沉舟】为己用」',
    },
    {
        id: 'ts_045', usageTag: '防御', situationTag: '均势', layer: 'tactical', series: 'counter', index: 45,
        displayName: '诱敌深入', sourceQuote: '《孙子兵法·计》：“利而诱之，乱而取之。”',
        baseEffect: 'reflect_enemy_opening_cut', condition: 'battle_siege_defender', phase: 'pre_opening_troops',
        magnitude: 1, engineStatus: 'ready',
    },
    {
        id: 'ts_046', layer: 'tactical', series: 'fate', index: 46,
        displayName: '暗度陈仓', sourceQuote: '《史记·淮阴侯列传》：“明修栈道，暗度陈仓。”',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready',
        note: '地形对抗：引擎侧待接线（仅 combat-model 工具支持）',
    },
    {
        id: 'ts_047', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'troop', index: 47,
        displayName: '指南打北', sourceQuote: '《通典·兵典》：“声言击东，其实击西。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
        note: '地形对抗：引擎侧待接线（仅 combat-model 工具支持）',
    },
    {
        id: 'ts_048', layer: 'tactical', series: 'casualty', index: 48,
        displayName: '空城退敌', ownerName: '赵云', sourceQuote: '《三国志·蜀书·赵云传》注引《云别传》：“更大开门，偃旗息鼓。”',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.25, engineStatus: 'ready',
        note: '己兵<敌30% 时，敌先声类技失效',
    },
];

// ── 七、T0 贴合战术技 ───────────────────────────────────────────
const UNIQUE_T0: TacticalSkillEntry[] = [
    {
        id: 'ts_051', layer: 'tactical', series: 'enhance', index: 51,
        displayName: '所向无前', ownerName: '李世民', sourceQuote: '《旧唐书·太宗本纪》：“义旗跃马，所向无前。”',
        baseEffect: 'ally_power_mult', condition: 'enemy_famous_general', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_052', layer: 'tactical', series: 'enhance', index: 52,
        displayName: '封狼居胥', sourceQuote: '《汉书·霍去病传》：“封狼居胥山，禅于姑衍。”',
        baseEffect: 'first_sortie_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
        note: '【霍去病】T0专属；轻骑驰突全域适用（2026-07-11 连战模拟校准：原首战门控致连攻第2场起无战术技）',
    },
    {
        id: 'ts_053', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 53,
        displayName: '无坚不摧', sourceQuote: '《吴子兵法·图国》：“击之必破，无坚不摧。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready'},
    {
        id: 'ts_054', ownerName: '刘秀', ownerGeneralId: 'lulin_liuxiu', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 54,
        displayName: '流星坠营', sourceQuote: '【刘秀】昆阳之战流星坠营激励士气',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.5, engineStatus: 'ready'},
    {
        id: 'ts_056', ownerName: '李靖', ownerGeneralId: 'dingxiang_d_lijing', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'troop', index: 56,
        displayName: '乘夜掩至', sourceQuote: '【李靖】率三千骑趁夜掩至定襄袭破颉利可汗',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_siege_attacker', phase: 'pre_opening_troops',
        magnitude: 0.09, engineStatus: 'ready',
    },
    {
        id: 'ts_057', layer: 'tactical', series: 'enhance', index: 57,
        displayName: '满万无敌', ownerName: '完颜阿骨打', sourceQuote: '【完颜阿骨打】女真不满万，满万不可敌，护步答冈',
        baseEffect: 'ally_power_mult', condition: 'self_troops_reach_ten_thousand', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_058', ownerName: '努尔哈赤', ownerGeneralId: 'manzhou_nuerhachi', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 58,
        displayName: '并力一向', sourceQuote: '【努尔哈赤】凭尔几路来我只一路去，萨尔浒',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_059', layer: 'tactical', series: 'counter', index: 59,
        displayName: '长生天佑', sourceQuote: '大蒙古国圣旨固定起首：“长生天气力里，大福荫护助里”。（成吉思汗）',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
        note: '【成吉思汗】T0专属；苍天佑助稳态进取（2026-07-11 慢慢直播连战校准：原纯免疫削兵无攻面，连战偏软）',
    },
    {
        id: 'ts_060', layer: 'tactical', series: 'fate', index: 60,
        displayName: '必死则生', ownerName: '李舜臣', sourceQuote: '【李舜臣】鸣梁海战必死则生',
        baseEffect: 'recompute_comeback', condition: 'side_comeback', phase: 'mid_battle_comeback',
        magnitude: 1, comebackThreshold: 0.9, engineStatus: 'ready',
    },
    {
        id: 'ts_061', ownerName: '陈国峻', ownerGeneralId: 'dayue_chenguojun', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 61,
        displayName: '以短制长', sourceQuote: '【陈国峻】白藤江以竹刺制蒙古骑兵',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready'},
];

// ── 八、T1 贴合战术技（15人） ───────────────────────────────────────────
const UNIQUE_T1: TacticalSkillEntry[] = [
    {
        id: 'ts_062', layer: 'tactical', series: 'enhance', index: 62,
        displayName: '长驱摧阵', sourceQuote: '《明史·成祖本纪》：“奉天靖难，推毂群帅。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_063', layer: 'tactical', series: 'troop', index: 63,
        displayName: '所向摧陷', ownerName: '常遇春', ownerGeneralId: 'ming_changyuchun', sourceQuote: '【常遇春】自言十万众横行天下，冲锋摧阵',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_064', ownerName: '班超', ownerGeneralId: 'xiyuduhu_banchao', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'fate', index: 64,
        displayName: '虎穴奇袭', sourceQuote: '《后汉书·班超传》：“不入虎穴，不得虎子。当今之计，独有因夜以火攻虏。”',
        baseEffect: 'partial_negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 0.25, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_065', layer: 'tactical', series: 'fate', index: 65,
        displayName: '凭坚摧锋', ownerName: '袁崇焕', sourceQuote: '《明史·袁崇焕传》：“凭坚城用大炮，是以所向无前。”',
        baseEffect: 'luck_variance_enemy', condition: 'battle_siege_defender', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.6, luckMax: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_066', layer: 'tactical', series: 'enhance', index: 66,
        displayName: '鸣镝所向', ownerName: '冒顿', sourceQuote: '【冒顿】鸣镝弑父训练骑兵，所向必射',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_067', layer: 'tactical', series: 'enhance', index: 67,
        displayName: '长驱入关', ownerName: '多尔衮', sourceQuote: '【多尔衮】清军入关长驱直入',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_attacker', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_068', layer: 'tactical', series: 'troop', index: 68,
        displayName: '乘虚直捣', ownerName: '李自成', sourceQuote: '【李自成】乘明空虚直捣北京',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_069', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 69,
        displayName: '出奇捣虚', sourceQuote: '攻敌薄弱处以牵制其攻势延缓败局，多将皆有。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_070', layer: 'tactical', series: 'enhance', index: 70,
        displayName: '席卷驰突', sourceQuote: '《新唐书·吐蕃传》：“遂并诸羌，雄霸西域。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_071', layer: 'tactical', series: 'troop', index: 71,
        displayName: '锐不可当', ownerName: '项羽', ownerGeneralId: 'xichu_xiangyu', sourceQuote: '【项羽】巨鹿破釜沉舟锐不可当',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_072', ownerName: '张辽', ownerGeneralId: 'lu_zhangliao', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 72,
        displayName: '回军突袭', sourceQuote: '【张辽】《三国志·张辽传》：合肥败退中回军突袭孙权。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_073', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 73,
        displayName: '以弱敌强', sourceQuote: '《吴子兵法·应变》：“以寡击众，以弱敌强。”',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready'},
    {
        id: 'ts_074', layer: 'tactical', series: 'enhance', index: 74,
        displayName: '前无坚阵', ownerName: '吕布', sourceQuote: '【吕布】虓虎之勇，冲阵无坚不摧',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_075', layer: 'tactical', series: 'fate', index: 75,
        displayName: '出没如神', ownerName: '石达开', sourceQuote: '《清史稿·洪秀全传》：“达开尤狡捷，出没如神。”',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.6, luckMax: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_076', layer: 'tactical', series: 'enhance', index: 76,
        displayName: '如墙而进', ownerName: '完颜宗弼', sourceQuote: '【完颜宗弼】《宋史》：金军铁浮屠如墙而进',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_077', usageTag: '防御', situationTag: '优势', layer: 'tactical', series: 'troop', index: 77,
        displayName: '长围久困', sourceQuote: '《清史稿·太宗本纪》：“长围久困，城中食尽。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready'},
    {
        id: 'ts_078', layer: 'tactical', series: 'counter', index: 78,
        displayName: '白衣渡江', sourceQuote: '《三国志·吕蒙传》：“蒙乃密收兵，白衣渡江。”',
        baseEffect: 'steal_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 0.5, engineStatus: 'ready',
    },
    {
        id: 'ts_079', layer: 'tactical', series: 'enhance', index: 79,
        displayName: '两蹶名王', ownerName: '李定国', sourceQuote: '【李定国】两蹶名王天下震动',
        baseEffect: 'ally_power_mult', condition: 'enemy_famous_general', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_080', layer: 'tactical', series: 'troop', index: 80,
        displayName: '踏雪破阵', ownerName: '拖雷', sourceQuote: '《元史·睿宗传》：“会大雪，睿宗乘雪击之。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_081', ownerName: '宇文泰', ownerGeneralId: 'yuwen_yuwentai', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'troop', index: 81,
        displayName: '苇泽奋击', sourceQuote: '【宇文泰】沙苑芦苇藏兵奋击高欢',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready'},
    {
        id: 'ts_082', layer: 'tactical', series: 'enhance', index: 82,
        displayName: '飞虎突阵', sourceQuote: '《旧五代史·武皇纪》：“军中号为飞虎子。”',
        baseEffect: 'first_sortie_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_083', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 83,
        displayName: '铁枪拔阵', sourceQuote: '《新五代史·王彦章传》：“持一铁枪，乘马大呼。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_084', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 84,
        displayName: '铁骑蹙敌', ownerName: '耶律休哥', sourceQuote: '【耶律休哥】高梁河之战铁骑蹙宋军',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready'},
    {
        id: 'ts_085', layer: 'tactical', series: 'troop', index: 85,
        displayName: '铁甲冲突', ownerName: '完颜宗弼', sourceQuote: '【完颜宗弼】金兀术率铁浮屠重甲骑兵冲锋陷阵',
        baseEffect: 'first_sortie_power_mult', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_086', ownerName: '慕容恪', ownerGeneralId: 'murong_murongke', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 86,
        displayName: '整暇破疲', sourceQuote: '【慕容恪】以严整之军击破疲惫之敌',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready'},
    {
        id: 'ts_087', ownerName: '柴荣', ownerGeneralId: 'chanzhou_chairong', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 87,
        displayName: '鼓行而西', sourceQuote: '【柴荣】高平之战后鼓行北伐',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready'},
    {
        id: 'ts_088', layer: 'tactical', series: 'troop', index: 88,
        displayName: '勒兵摧阵', ownerName: '李世民', sourceQuote: '【李世民】虎牢关勒兵摧窦建德阵',
        baseEffect: 'enemy_sub_troops_opening', condition: 'first_sortie', phase: 'pre_opening_troops',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_089', layer: 'tactical', series: 'enhance', index: 89,
        displayName: '风卷残云', ownerName: '徐达', sourceQuote: '【徐达】北伐灭元如风卷残云',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_090', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 90,
        displayName: '合围聚歼', sourceQuote: '《孙子兵法·谋攻》：“十则围之，五则攻之。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready'},
    {
        id: 'ts_091', layer: 'tactical', series: 'fate', index: 91,
        displayName: '阻险御敌', ownerName: '吴玠', sourceQuote: '【吴玠】和尚原据险御金兵',
        baseEffect: 'luck_variance_enemy', condition: 'terrain_mountain', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.6, luckMax: 1.4, engineStatus: 'ready',
    },
    // ── 第三批 T1（13人；ID 避开迁移中的 095-106 区段）──
    {
        id: 'ts_092', layer: 'tactical', series: 'enhance', index: 92,
        displayName: '痛饮黄龙', sourceQuote: '《宋史·岳飞传》：“直抵黄龙府，与诸君痛饮尔。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_093', layer: 'tactical', series: 'casualty', index: 93,
        displayName: '鸳鸯阵法', sourceQuote: '《纪效新书·鸳鸯阵》；戚继光台州九战九捷。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_094', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 94,
        displayName: '廓清朔漠', ownerName: '蓝玉', sourceQuote: '【蓝玉】捕鱼儿海之战廓清北元',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_107', layer: 'tactical', series: 'troop', index: 107,
        displayName: '倍道奔袭', ownerName: '曹操', sourceQuote: '《三国志·武帝纪》：“太祖乃留辎重，轻兵兼道以出……斩蹋顿。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_108', layer: 'tactical', series: 'enhance', index: 108,
        displayName: '倾国压境',  ownerName: '王翦', sourceQuote: '《史记·白起王翦列传》：“王翦将兵六十万……大破楚军。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_109', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 109,
        displayName: '奋身陷阵', sourceQuote: '《宋史·太祖本纪》：“高平之战……士皆奋命，北汉兵大败。”',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready'},
    {
        id: 'ts_110', usageTag: '双行', situationTag: '优势', layer: 'tactical', series: 'troop', index: 110,
        displayName: '望旗遁去', ownerName: '薛仁贵', sourceQuote: '【薛仁贵】三箭定天山敌望旗遁去',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready'},
    {
        id: 'ts_111', layer: 'tactical', series: 'fate', index: 111,
        displayName: '屡蹶复振', ownerName: '李自成', sourceQuote: '《明史·李自成传》：“独与刘宗敏等十八骑溃围出……后复大炽。”',
        baseEffect: 'recompute_comeback', condition: 'side_comeback', phase: 'mid_battle_comeback',
        magnitude: 1, comebackThreshold: 0.85, engineStatus: 'ready',
    },
    {
        id: 'ts_112', ownerName: '狄青', ownerGeneralId: 'gaoliang_geshuhan', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 112,
        displayName: '夜度昆仑', sourceQuote: '【狄青】《宋史·狄青传》：夜袭昆仑关，一战定乾坤。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready'},
    {
        id: 'ts_113', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 113,
        displayName: '义旗西指', ownerName: '张议潮', sourceQuote: '【张议潮】归义军义旗西指收复河西',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_114', layer: 'tactical', series: 'enhance', index: 114,
        displayName: '奇兵斩将', sourceQuote: '《信长公记》：“桶狭间山……今川义元讨死。”',
        baseEffect: 'nullify_enemy_opening_cut', condition: 'always', phase: 'opening_roll',
        magnitude: 1.5, engineStatus: 'ready',
    },
    {
        id: 'ts_115', layer: 'tactical', series: 'enhance', index: 115,
        displayName: '横扫西陲', ownerName: '帖木儿', sourceQuote: '《明史·帖木儿传》：“拓地数千里，西域诸国咸畏服。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_116', layer: 'tactical', series: 'enhance', index: 116,
        displayName: '摧军擒王', ownerName: '苏定方', sourceQuote: '【苏定方】灭西突厥擒沙钵罗可汗',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_attacker', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    // ── 第四批 T1（补定义悬空 095-105；阿骨打/完颜宗弼另归位现成技，不占此段）──
    {
        id: 'ts_095', usageTag: '防御', situationTag: '均势', layer: 'tactical', series: 'fate', index: 95,
        displayName: '练锐拒虏', ownerName: '杨延昭', sourceQuote: '【杨延昭】戍边练锐拒辽军',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1.0, engineStatus: 'ready'},
    {
        id: 'ts_096', ownerName: '廉颇', ownerGeneralId: 'zhao_lianpo', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 96,
        displayName: '坚壁挫锐', sourceQuote: '【廉颇】《史记·廉颇列传》：长平坚壁拒王龁，秦军终不能克。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready'},
    {
        id: 'ts_097', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 97,
        displayName: '荡寇摧凶', ownerName: '崔莹', sourceQuote: '《高丽史·崔莹传》：“莹击倭于鸿山，大破之。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready'},
    {
        id: 'ts_098', layer: 'tactical', series: 'fate', index: 98,
        displayName: '哀兵制胜', sourceQuote: '《老子》：“抗兵相加，哀者胜矣。”',
        baseEffect: 'recompute_comeback', condition: 'side_comeback', phase: 'mid_battle_comeback',
        magnitude: 1, comebackThreshold: 0.8, engineStatus: 'ready',
    },
    {
        id: 'ts_099', layer: 'tactical', series: 'fate', index: 99,
        displayName: '据险破众', sourceQuote: '《宣祖实录》：“权栗保幸州山城，以寡击众，倭大败。”',
        baseEffect: 'luck_variance_enemy', condition: 'battle_siege_defender', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.6, luckMax: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_100', layer: 'tactical', series: 'casualty', index: 100,
        displayName: '殊死却敌', ownerName: '耿恭', ownerGeneralId: 'xiyu_genggong', sourceQuote: '【耿恭】疏勒城殊死却敌，十三将士生还玉门。',
        baseEffect: 'win_casualty_reduction', condition: 'battle_siege_defender', phase: 'mid_battle_passive',
        magnitude: 0.5, engineStatus: 'ready',
    },
    {
        id: 'ts_102', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'troop', index: 102,
        displayName: '席卷八荒', ownerName: '成吉思汗', sourceQuote: '【成吉思汗】蒙古西征席卷八荒',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_103', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 103,
        displayName: '避锐远遁', ownerName: '刘邦', sourceQuote: '【刘邦】避项羽锋锐远遁荥阳以西',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready'},
    {
        id: 'ts_104', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 104,
        displayName: '负险固守', sourceQuote: '《后汉书·东夷传》：“夫余以员栅为城，恃险固守。”',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready'},
    // ── 第五批 T1（10 位名将补贴合技；ID ts_117-126 顺延）──
    {
        id: 'ts_117', layer: 'tactical', series: 'enhance', index: 117,
        displayName: '牧野鹰扬', ownerName: '姬发', sourceQuote: '【姬发】武王伐纣牧野鹰扬',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_118', layer: 'tactical', series: 'counter', index: 118,
        displayName: '一匡天下', ownerName: '李世民', sourceQuote: '【李世民】玄武门后一匡天下',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
    },
    {
        id: 'ts_119', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'troop', index: 119,
        displayName: '追奔逐北', sourceQuote: '《辽史·耶律休哥传》：“宋兵大溃，追奔逐北，杀获甚众。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_120', layer: 'tactical', series: 'enhance', index: 120,
        displayName: '铁骑突出', sourceQuote: '白居易《琵琶行》：“银瓶乍破水浆迸，铁骑突出刀枪鸣。”',
        baseEffect: 'first_sortie_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_121', layer: 'tactical', series: 'enhance', index: 121,
        displayName: '破关夺隘', ownerName: '司马错', sourceQuote: '《华阳国志·蜀志》：“秦使司马错伐蜀，灭之。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_122', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 122,
        displayName: '辟土开疆', sourceQuote: '《宋史·王韶传》：“韶入熙河，拓地二千余里。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_123', ownerName: '孙武', ownerGeneralId: 'wu_sunwu', usageTag: '双行', situationTag: '优势', layer: 'tactical', series: 'troop', index: 123,
        displayName: '不战屈人', sourceQuote: '【孙武】不战而屈人之兵',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready'},
    {
        id: 'ts_124', layer: 'tactical', series: 'troop', index: 124,
        displayName: '长驱饮马', ownerName: '俺答', sourceQuote: '《明史·鞑靼传》：“俺答帅众薄都城，纵掠畿甸。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_125', layer: 'tactical', series: 'fate', index: 125,
        displayName: '转战千里', ownerName: '黄巢', sourceQuote: '【黄巢】唐末起义军转战千里',
        baseEffect: 'recompute_comeback', condition: 'side_comeback', phase: 'mid_battle_comeback',
        magnitude: 1, comebackThreshold: 0.85, engineStatus: 'ready',
    },
    {
        id: 'ts_126', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 126,
        displayName: '东挡西杀', sourceQuote: '《宋史·孟珙传》：“珙连破北军，威名震于境外。”',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready'},
    // ── 第六批 T1（29 位名将补贴合技；ID ts_127-155）──
    {
        id: 'ts_127', ownerName: '德川家康', ownerGeneralId: 'sima_d_simayi', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 127,
        displayName: '隐忍伺机', sourceQuote: '【司马懿】《晋书·宣帝纪》：对蜀闭垒不战，隐忍待时，终成大业。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready'},
    {
        id: 'ts_128', layer: 'tactical', series: 'enhance', index: 128,
        displayName: '突骑摧坚', ownerName: '桑贾尔', sourceQuote: '志费尼《世界征服者史》：“桑贾尔统突骑，雄踞呼罗珊。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_129', layer: 'tactical', series: 'enhance', index: 129,
        displayName: '象阵摧锋', sourceQuote: '周达观《真腊风土记》：“其国乘象以战，阇耶跋摩拓土却敌。”',
        baseEffect: 'first_sortie_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_130', usageTag: '防御', situationTag: '优势', layer: 'tactical', series: 'troop', index: 130,
        displayName: '示弱诱歼', ownerName: '廉颇', sourceQuote: '《史记·廉颇蔺相如列传》：“李牧多为奇陈……大破杀匈奴十余万骑。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready'},
    {
        id: 'ts_131', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 131,
        displayName: '摧坚擒王', ownerName: '侯君集', sourceQuote: '【侯君集】灭高昌擒其王',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_132', layer: 'tactical', series: 'enhance', index: 132,
        displayName: '威服诸部', sourceQuote: '《明史·鞑靼传》：“达延汗尽有故元之众，威服诸部。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_133', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 133,
        displayName: '建牙破敌', ownerName: '骨力裴罗', sourceQuote: '《旧唐书·回纥传》：“骨力裴罗击破突厥，遂建牙拓地。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready'},
    {
        id: 'ts_134', usageTag: '双行', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 134,
        displayName: '号令如山', ownerName: '社仑', sourceQuote: '《魏书·蠕蠕传》：“社仑始立军法，千人为军，百人为幢。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready'},
    {
        id: 'ts_135', layer: 'tactical', series: 'troop', index: 135,
        displayName: '刺山飞泉', ownerName: '耿恭', ownerGeneralId: 'xiyu_genggong', sourceQuote: '【耿恭】疏勒城刺山得泉',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_siege_defender', phase: 'pre_opening_troops',
        magnitude: 0.5, engineStatus: 'ready',
    },
    {
        id: 'ts_136', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 136,
        displayName: '疾风劲骑', ownerName: '速不台', sourceQuote: '【速不台】蒙古西征疾风劲骑',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_137', layer: 'tactical', series: 'fate', index: 137,
        displayName: '安边御寇', ownerName: '李牧', sourceQuote: '【李牧】北拒匈奴安边御寇',
        baseEffect: 'luck_variance_enemy', condition: 'battle_siege_defender', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.6, luckMax: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_138', ownerName: '项羽', ownerGeneralId: 'xichu_xiangyu', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'counter', index: 138,
        displayName: '以寡摧盟', sourceQuote: '【项羽】巨鹿以寡兵摧破诸侯联军',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready'},
    {
        id: 'ts_139', layer: 'tactical', series: 'enhance', index: 139,
        displayName: '兵雄四方', ownerName: '摩诃末', sourceQuote: '志费尼《世界征服者史》：“摩诃末之国，兵雄西域，控弦百万。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_140', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 140,
        displayName: '控弦制胜', ownerName: '冒顿', sourceQuote: '【冒顿】控弦三十万雄踞北方',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_141', layer: 'tactical', series: 'enhance', index: 141,
        displayName: '弯刀陷阵', sourceQuote: '《廓尔喀纪略》：“廓夷持弯刀，习山地战，剽悍难敌。”',
        baseEffect: 'ally_power_mult', condition: 'terrain_mountain', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_142', layer: 'tactical', series: 'enhance', index: 142,
        displayName: '巨象蹈坚', ownerName: '莽应龙', sourceQuote: '《明史·缅甸传》：“莽应龙乘象督战，并吞诸部。”',
        baseEffect: 'first_sortie_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_143', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 143,
        displayName: '揭竿突阵', ownerName: '陈胜', sourceQuote: '【陈胜】揭竿而起绝地突阵反秦',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready'},
    {
        id: 'ts_144', ownerName: '袁崇焕', ownerGeneralId: 'zu_d_yuanchonghuan', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 144,
        displayName: '坚城折锐', sourceQuote: '【袁崇焕】宁远坚城折努尔哈赤锐',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready'},
    {
        id: 'ts_145', ownerName: '司马懿', ownerGeneralId: 'sima_d_simayi', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 145,
        displayName: '养锐蓄势', sourceQuote: '【司马懿】对蜀作战以守为攻养锐蓄势',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready'},
    {
        id: 'ts_146', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 146,
        displayName: '先机制敌', ownerName: '曲端', sourceQuote: '《宋史·曲端传》：“端善料敌，所向克捷，威震西陲。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready'},
    {
        id: 'ts_147', usageTag: '双行', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 147,
        displayName: '决胜千里', ownerName: '柴荣', sourceQuote: '《旧五代史·世宗纪》：“世宗神武雄略，决胜于千里。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready'},
    {
        id: 'ts_148', layer: 'tactical', series: 'enhance', index: 148,
        displayName: '突骑陷坚', sourceQuote: '《明史·吴三桂传》：“选夷丁为突骑，冲坚陷阵，莫之能当。”',
        baseEffect: 'first_sortie_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_149', layer: 'tactical', series: 'counter', index: 149,
        displayName: '庙算制胜', sourceQuote: '围魏救赵庙算制胜',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 0.25, engineStatus: 'ready',
    },
    {
        id: 'ts_150', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 150,
        displayName: '驰突破阵', ownerName: '吕布', sourceQuote: '【吕布】驰突破阵骁勇无双',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_151', layer: 'tactical', series: 'fate', index: 151,
        displayName: '扼险却敌', ownerName: '哈里辛格', sourceQuote: '《锡克史》载哈里辛格·纳尔瓦：扼守开伯尔，阿富汗畏之。',
        baseEffect: 'luck_variance_enemy', condition: 'terrain_mountain', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.6, luckMax: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_152', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 152,
        displayName: '决战破盟', sourceQuote: '波斯史载艾哈迈德沙：于帕尼帕特大破马拉塔联军。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready'},
    {
        id: 'ts_153', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 153,
        displayName: '回马控弦', ownerName: '拖雷', sourceQuote: '【拖雷】蒙古骑兵回马控弦战术',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready'},
    {
        id: 'ts_154', layer: 'tactical', series: 'enhance', index: 154,
        displayName: '黑旗蔽日', sourceQuote: '阿拉伯史载阿布·穆斯林：于木鹿升起黑旗，呼罗珊群雄景从，遂覆白衣大食。',
        baseEffect: 'first_sortie_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_155', layer: 'tactical', series: 'enhance', index: 155,
        displayName: '摧锋定倾', ownerName: '刘秀', sourceQuote: '【刘秀】昆阳摧锋定倾扶汉',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    // ── 第七批：T0缺口 + T2头部名将（ts_156-167；项羽/韩信认领招牌不占号）──
    {
        id: 'ts_156', layer: 'tactical', series: 'enhance', index: 156,
        displayName: '赤备突阵', ownerName: '武田信玄', sourceQuote: '【武田信玄】赤备骑兵突击敌阵，势不可挡',
        baseEffect: 'first_sortie_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_157', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'enhance', index: 157,
        displayName: '草木皆兵', ownerName: '谢玄', sourceQuote: '【谢玄】《晋书·谢玄传》：淝水之战秦军溃败，草木皆兵风声鹤唳。',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_158', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'troop', index: 158,
        displayName: '歼锐无遗', ownerName: '白起', sourceQuote: '《史记·白起列传》：“前后斩首虏四十五万人。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_159',  ownerGeneralId: 'huizhou_zhugeliang', usageTag: '双行', situationTag: '均势', layer: 'tactical', series: 'fate', index: 159,
        displayName: '治戎为长', sourceQuote: '【诸葛亮】治戎为长治军有方',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1.0, engineStatus: 'ready'},
    {
        id: 'ts_160', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 160,
        displayName: '骄敌聚歼', ownerName: '李牧', sourceQuote: '《史记·廉颇蔺相如列传》：“李牧多为奇陈……大破杀匈奴十余万骑。”',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready'},
    {
        id: 'ts_161', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'enhance', index: 161,
        displayName: '摧锋夺气', sourceQuote: '败局中摧毁敌锋锐夺回战场士气，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_162', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 162,
        displayName: '裹毡疾进', ownerName: '邓艾', sourceQuote: '【邓艾】《三国志·邓艾传》：阴平道裹毡而下，翻越天险灭蜀。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_163', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 163,
        displayName: '白袍破阵', ownerName: '陈庆之', sourceQuote: '【陈庆之】《梁书·陈庆之传》：七千白袍横扫中原，以少打多攻克洛阳。',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_164', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 164,
        displayName: '火牛奔冲', ownerName: '田单', sourceQuote: '【田单】《史记·田单列传》：即墨火牛阵大破燕军，绝地翻盘复国。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.5, engineStatus: 'ready',
    },
    {
        id: 'ts_165', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'troop', index: 165,
        displayName: '减灶诱歼',  ownerGeneralId: 'qi_sunbin', sourceQuote: '【孙膑】《史记·孙子吴起列传》：马陵道减灶示弱诱庞涓深入设伏全歼。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_166', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 166,
        displayName: '背城借一', sourceQuote: '《左传·成公二年》：“请收合余烬，背城借一。”《左传·成公二年》：“请收合余烬，背城借一。”背城决死一战，通用。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_167', layer: 'tactical', series: 'casualty', index: 167,
        displayName: '守死遏敌', ownerName: '张巡', sourceQuote: '【张巡】睢阳守死遏叛军',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'battle_siege_defender', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '守城城破身死，咬人：胜方本场战损×2（睢阳死守，杀敌十二万，蔽遮江淮）；胜方保底存活 10% 初始兵',
    },
    // ── 第八批：T2 名将（ts_168-181）──
    {
        id: 'ts_168', layer: 'tactical', series: 'fate', index: 168,
        displayName: '百败不折', ownerName: '刘备', ownerGeneralId: 'shu_liubei', sourceQuote: '《三国志·先主传》评：“折而不挠，终不为下。”（刘备）',
        baseEffect: 'recompute_comeback', condition: 'side_comeback', phase: 'mid_battle_comeback',
        magnitude: 1, comebackThreshold: 0.85, engineStatus: 'ready',
    },
    {
        id: 'ts_169', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'enhance', index: 169,
        displayName: '无当拒锋', ownerName: '王平', sourceQuote: '【王平】蜀汉无当飞军以步制骑，拒敌锋锐。',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_170', usageTag: '防御', situationTag: '优势', layer: 'tactical', series: 'troop', index: 170,
        displayName: '横江扼敌', sourceQuote: '横截江面扼制敌军水陆并进，如韩世忠黄天荡等，多将皆有此战。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_171', usageTag: '双行', situationTag: '均势', layer: 'tactical', series: 'fate', index: 171,
        displayName: '风林火山', ownerName: '武田信玄', sourceQuote: '【武田信玄】日本战国武田家军旗，其疾如风，其徐如林，侵掠如火，不动如山。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_172', layer: 'tactical', series: 'casualty', index: 172,
        displayName: '奇正守险', ownerName: '诸葛亮', ownerGeneralId: 'huizhou_zhugeliang', sourceQuote: '【诸葛亮】北伐奇正并用守险',
        baseEffect: 'win_casualty_reduction', condition: 'battle_siege_defender', phase: 'mid_battle_passive',
        magnitude: 0.3, luckMin: 0.6, luckMax: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_173', usageTag: '防御', situationTag: '优势', layer: 'tactical', series: 'troop', index: 173,
        displayName: '诱敌疲歼', ownerName: '周亚夫', sourceQuote: '【周亚夫】《史记·绛侯周勃世家》：平七国之乱坚壁不出断敌粮道，待敌疲后一举击破。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_174', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'enhance', index: 174,
        displayName: '却月破骑', ownerName: '刘裕', sourceQuote: '【刘裕】《宋书·武帝纪》：却月阵背水以步制骑，大破北魏铁骑。',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_175', layer: 'tactical', series: 'enhance', index: 175,
        displayName: '勇锐略地', ownerName: '孙策', sourceQuote: '【孙策】以千人起兵勇锐略地横扫江东六郡',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_176', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'enhance', index: 176,
        displayName: '孤骑擒将', ownerName: '辛弃疾', sourceQuote: '【辛弃疾】《宋史·辛弃疾传》：率五十骑突入五万金营擒叛将张安国。',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_177', layer: 'tactical', series: 'fate', index: 177,
        displayName: '卧薪尝胆', ownerName: '勾践', sourceQuote: '【勾践】卧薪尝胆灭吴',
        baseEffect: 'recompute_comeback', condition: 'side_comeback', phase: 'mid_battle_comeback',
        magnitude: 1, comebackThreshold: 0.85, engineStatus: 'ready',
    },
    {
        id: 'ts_178', usageTag: '双行', situationTag: '均势', layer: 'tactical', series: 'fate', index: 178,
        displayName: '聚米制胜', ownerName: '马援', sourceQuote: '【马援】《后汉书·马援传》：聚米为山指画地形，沙盘推演料敌制胜。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_179', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'enhance', index: 179,
        displayName: '奋勇陷坚', sourceQuote: '勇猛冲入敌阵攻坚，如卢象升等，多将皆有此勇。',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_180', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'troop', index: 180,
        displayName: '百骑劫营', ownerName: '甘宁', sourceQuote: '【甘宁】《三国志·甘宁传》：率百骑夜劫曹营，不折一人而还。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_181', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'troop', index: 181,
        displayName: '雪夜奇袭', ownerName: '李愬', sourceQuote: '【李愬】《旧唐书·李愬传》：雪夜入蔡州擒吴元济。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_182', layer: 'tactical', series: 'troop', index: 182,
        displayName: '火焚连舰', ownerName: '朱元璋', sourceQuote: '《明史·太祖本纪》：“乘风纵火，焚友谅舟，湖水尽赤。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_183', layer: 'tactical', series: 'troop', index: 183,
        displayName: '乘风纵火', sourceQuote: '《后汉书·皇甫嵩传》：“嵩因夜纵火，大呼，奔击其阵。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_184', layer: 'tactical', series: 'fate', index: 184,
        displayName: '深壁扼粮', ownerName: '周亚夫', sourceQuote: '《史记·绛侯周勃世家》：“亚夫坚壁不出，绝吴楚粮道。”',
        baseEffect: 'luck_variance_enemy', condition: 'battle_siege_defender', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.6, luckMax: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_185', usageTag: '双行', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 185,
        displayName: '令行禁止', ownerName: '周亚夫', sourceQuote: '军纪严明如孙武斩美姬、周亚夫细柳营，无单一专属武将。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_186', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'troop', index: 186,
        displayName: '潜锋设伏', sourceQuote: '隐藏锋芒设置伏兵，如崤之战晋伏秦等，多将皆有此战术。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_187', usageTag: '双行', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 187,
        displayName: '愈挫愈奋', ownerName: '刘备', sourceQuote: '【刘备】《三国志·先主传》：屡败屡战折而不挠，终建蜀汉。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_188', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 188,
        displayName: '隐锋待时', ownerName: '勾践', sourceQuote: '【勾践】《史记·越王勾践世家》：卧薪尝胆隐忍二十年待时灭吴。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_189', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'enhance', index: 189,
        displayName: '狭路争锋', ownerName: '赵奢', sourceQuote: '【赵奢】《史记·廉颇蔺相如列传》：阏与之战狭路相逢勇者胜。',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_190', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 190,
        displayName: '乘危夺鼎', sourceQuote: '趁乱局夺取政权以弱胜强逆转形势，多将皆有。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_191', layer: 'tactical', series: 'enhance', index: 191,
        displayName: '蚕食摧坚', sourceQuote: '《旧五代史·梁太祖纪》：温兼并四邻，蚕食唐祚。',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_attacker', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_192', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 192,
        displayName: '劲弩番射', ownerName: '吴玠', sourceQuote: '强弩轮番射击压制敌军，秦弩兵、吴玠驻队矢等常用战术。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_193', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'troop', index: 193,
        displayName: '临机决水', ownerName: '韩信', sourceQuote: '【韩信】《史记·淮阴侯列传》：潍水之战决水半渡而击龙且。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_194', layer: 'tactical', series: 'enhance', index: 194,
        displayName: '正兵决荡', ownerName: '杨素', sourceQuote: '《隋书·杨素传》：悉召所部成列而战，一战破之。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_195', layer: 'tactical', series: 'fate', index: 195,
        displayName: '诈降毙帅', sourceQuote: '《明史·铁铉传》：诈请降，下铁板几毙燕王。',
        baseEffect: 'luck_variance_enemy', condition: 'battle_siege_defender', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.6, luckMax: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_196', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 196,
        displayName: '一箭落雕', ownerName: '斛律光', sourceQuote: '【斛律光】《北齐书·斛律光传》：射落大雕箭术无双，号落雕都督。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
        // 2026-07-11 慢慢直播：原 luck 0.5–1.5 方差连战不稳；仅 jiyuan_huluguang 使用
    },
    {
        id: 'ts_197', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 197,
        displayName: '凭堞折冲', sourceQuote: '凭借城墙垛口击退敌军冲锋，守城通用战术，如韦孝宽玉璧等。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_198', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'enhance', index: 198,
        displayName: '勇冠三军', sourceQuote: '勇敢为三军之首，如项羽、吕布等多将可称。',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_199', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'enhance', index: 199,
        displayName: '率锐破雄', sourceQuote: '率领精锐击破强敌，如张辽合肥之战等，多将皆有此勇。',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_200', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'fate', index: 200,
        displayName: '登旅致师', ownerName: '张辽', sourceQuote: '古代致师挑战，两军对垒时单车或单骑突阵挑战，如许褚、张辽等。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_201', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 201,
        displayName: '麾兵力战', sourceQuote: '指挥全军奋力作战，如赵匡胤高平之战等多将皆有此指挥能力。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_202', layer: 'tactical', series: 'enhance', index: 202,
        displayName: '邀击擒渠', ownerName: '李靖', sourceQuote: '【李靖】阴山邀击，擒颉利可汗。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_203', usageTag: '双行', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 203,
        displayName: '驱徒成军', ownerName: '章邯', sourceQuote: '【章邯】《史记·秦始皇本纪》：率骊山囚徒成军镇压陈胜起义。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_204', usageTag: '双行', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 204,
        displayName: '倡义靖乱', sourceQuote: '倡导义兵平定祸乱，如刘秀、刘备等多将皆以此起家。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_205', usageTag: '双行', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 205,
        displayName: '运筹先定', sourceQuote: '败军之中冷静筹划先稳住阵脚再图反击，多将皆有。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_206', usageTag: '防御', situationTag: '均势', layer: 'tactical', series: 'fate', index: 206,
        displayName: '持重克乱', sourceQuote: '以稳重指挥克服军中混乱，如周亚夫、周勃等多将皆有此能。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_207', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 207,
        displayName: '胡骑南牧', sourceQuote: '《晋书·刘元海载记》：召集五部，众至五万。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_208', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 208,
        displayName: '夜拔坚城', sourceQuote: '趁夜突袭攻克坚城，如李靖袭定襄等，多将皆有此战法。',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_attacker', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_209', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 209,
        displayName: '汲水凝冰', ownerName: '杨延昭', sourceQuote: '【杨延昭】《宋史·杨延昭传》：汲水灌城凝冰守遂城，坚不可上。防御典范。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_210', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 210,
        displayName: '老骥雄飞', ownerName: '廉颇', sourceQuote: '老将暮年奋发建功，如慕容垂、廉颇等，无单一专属。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_211', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'fate', index: 211,
        displayName: '死地奋决', ownerName: '项羽', ownerGeneralId: 'xichu_xiangyu', sourceQuote: '【项羽】巨鹿破釜沉舟，陷之死地而后生，奋勇决战。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_212', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 212,
        displayName: '结围御虏', sourceQuote: '《三国志·田豫传》：豫因地形，回车结围御鲜卑。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_213', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 213,
        displayName: '白马摧锋', ownerName: '公孙瓒', sourceQuote: '【公孙瓒】白马义从骑兵摧锋陷阵',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_214', usageTag: '双行', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 214,
        displayName: '胡服骑射', ownerName: '赵武灵王', sourceQuote: '【赵武灵王】《史记·赵世家》：推行胡服骑射改革强军。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_215', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 215,
        displayName: '凿隧破围', ownerName: '耿恭', ownerGeneralId: 'xiyu_genggong', sourceQuote: '《旧唐书·李光弼传》：太原掘地道，出兵破史思明。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_216', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'troop', index: 216,
        displayName: '三箭慑虏', ownerName: '薛仁贵', sourceQuote: '【薛仁贵】《旧唐书·薛仁贵传》：三箭定天山。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_217', layer: 'tactical', series: 'troop', index: 217,
        displayName: '楼船焚垒', ownerName: '来护儿', sourceQuote: '《隋书·来护儿传》：护儿率楼船，泛海入平壤。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_218', layer: 'tactical', series: 'fate', index: 218,
        displayName: '骁锋陷阵', ownerName: '高长恭', sourceQuote: '【高长恭】邙山之战戴铁面具，骁锋陷阵大破北周。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.6, luckMax: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_219', usageTag: '防御', situationTag: '均势', layer: 'tactical', series: 'troop', index: 219,
        displayName: '强弩破骑', sourceQuote: '《后汉书·袁绍传》：麴义八百强弩，破瓒白马义从。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_220', layer: 'tactical', series: 'troop', index: 220,
        displayName: '奄袭虏庭', sourceQuote: '《明史·蓝玉传》：捕鱼儿海，奄至虏营，尽俘之。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_221', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 221,
        displayName: '虓虎陷阵', ownerName: '吕布', sourceQuote: '【吕布】虓虎之勇陷阵冲锋',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_222', layer: 'tactical', series: 'troop', index: 222,
        displayName: '诱锋夹截', sourceQuote: '诱庞涓前锋深入，设伏夹截大破魏军。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_223', layer: 'tactical', series: 'enhance', index: 223,
        displayName: '横扫连城', ownerName: '乐毅', sourceQuote: '【乐毅】下齐七十余城',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_attacker', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_224', usageTag: '双行', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 224,
        displayName: '有志竟成', ownerName: '耿弇', sourceQuote: '《后汉书·耿弇传》：有志者事竟成。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_225', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 225,
        displayName: '奋疾破虏', ownerName: '折御卿', sourceQuote: '《宋史·折御卿传》：子河汊大破契丹。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_226', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 226,
        displayName: '蓄锐倾覆', sourceQuote: '《旧唐书·安禄山传》：蓄锐范阳，举兵倾唐。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_227', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 227,
        displayName: '破军立鼎', ownerName: '燕铁木儿', sourceQuote: '《元史·燕铁木儿传》：两都之战，拥立文宗定鼎。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_228', layer: 'tactical', series: 'enhance', index: 228,
        displayName: '并骑破阵', sourceQuote: '《明史·瓦剌传》：脱欢并诸部，破阿鲁台。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_229', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 229,
        displayName: '率部破柔', ownerName: '拓跋珪', sourceQuote: '【拓跋珪】《魏书·太祖纪》：率部击破柔然。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_230', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 230,
        displayName: '孤军诛单', sourceQuote: '《裴岑纪功碑》：岑将郡兵三千，诛呼衍王。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_231', layer: 'tactical', series: 'enhance', index: 231,
        displayName: '专征破垒', ownerName: '木华黎', sourceQuote: '《元史·木华黎传》：封太师国王，专征经略中原。',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_attacker', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_232', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'troop', index: 232,
        displayName: '绝漠追奔', ownerName: '霍去病', sourceQuote: '【霍去病】漠北绝漠追匈奴',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_233', layer: 'tactical', series: 'enhance', index: 233,
        displayName: '控弦称雄', ownerName: '耶律阿保机', sourceQuote: '【耶律阿保机】契丹控弦称雄草原',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_234', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 234,
        displayName: '却敌全师', sourceQuote: '败退中击退追兵保全军队完整撤回，多将皆有。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_235', layer: 'tactical', series: 'enhance', index: 235,
        displayName: '席卷江表', sourceQuote: '《元史·伯颜传》：伯颜下临安，灭宋。',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_attacker', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_236', usageTag: '防御', situationTag: '均势', layer: 'tactical', series: 'troop', index: 236,
        displayName: '连环锁骑', sourceQuote: '《晋书·慕容恪载记》：以铁锁连马为方阵，擒冉闵。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_237', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 237,
        displayName: '驼阵横行', sourceQuote: '《清史稿·噶尔丹传》：结驼城为阵，纵横漠北。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_238', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 238,
        displayName: '收众奋击', ownerName: '石勒', sourceQuote: '【石勒】《晋书·石勒载记》：收拢流民奋击建后赵。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_239', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 239,
        displayName: '驱虏通西', sourceQuote: '《后汉书·窦固传》：击破呼衍王，取伊吾，通西域。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_240', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 240,
        displayName: '锋镝先驱', sourceQuote: '《旧唐书·契苾何力传》：每战身先，为诸军锋。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_241', layer: 'tactical', series: 'troop', index: 241,
        displayName: '张翼包歼', ownerName: '李牧', sourceQuote: '《史记》：李牧张左右翼击之，大破匈奴十余万骑。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_242', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 242,
        displayName: '袭帐破汗', ownerName: '李靖', sourceQuote: '【李靖】《旧唐书·李靖传》：趁夜袭破颉利可汗牙帐。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_243', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 243,
        displayName: '骁锐陷锋', ownerName: '海兰察', sourceQuote: '《清史稿·海兰察传》：每战身先，屡陷坚阵。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_244', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 244,
        displayName: '收众破突', sourceQuote: '《旧唐书·薛延陀传》：夷男叛突厥，自立为可汗。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_245', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 245,
        displayName: '勇决破众', ownerName: '英布', sourceQuote: '【英布】《史记·黥布列传》：以勇猛决绝破秦军。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_246', layer: 'tactical', series: 'enhance', index: 246,
        displayName: '席卷海宇', ownerName: '徐达', sourceQuote: '【徐达】北伐中原席卷海宇，推翻元朝统治。',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_attacker', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_247', usageTag: '双行', situationTag: '均势', layer: 'tactical', series: 'fate', index: 247,
        displayName: '纠盟合众', sourceQuote: '《元朝秘史》：札木合纠合诸部，十三翼战。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_248', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 248,
        displayName: '连岁抗虏', ownerName: '岳飞', sourceQuote: '【岳飞】连年北伐抗金，持续抵抗外敌。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_249', usageTag: '防御', situationTag: '优势', layer: 'tactical', series: 'troop', index: 249,
        displayName: '却胡筑塞', sourceQuote: '《史记·蒙恬列传》：却匈奴七百余里，筑长城。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_250', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 250,
        displayName: '铁鹞冲坚', sourceQuote: '《宋史·夏国传》：元昊选骁勇为铁鹞子。（李元昊）',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_251', layer: 'tactical', series: 'troop', index: 251,
        displayName: '奇袭虏巢', ownerName: '王越', sourceQuote: '《明史·王越传》：袭红盐池、威宁海，破鞑靼。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_252', usageTag: '双行', situationTag: '均势', layer: 'tactical', series: 'fate', index: 252,
        displayName: '五郡连兵', ownerName: '窦融', sourceQuote: '【窦融】《后汉书·窦融传》：东汉初经营河西五郡联兵。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_253', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 253,
        displayName: '张乐却虏', ownerName: '赵云', sourceQuote: '【赵云】《云别传》：汉水空营大开营门张乐却虏，疑兵退曹。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_254', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 254,
        displayName: '飘忽夺地', ownerName: '赫连勃勃', sourceQuote: '《晋书·赫连勃勃载记》：勃勃善用骑，飘忽拓地。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_255', layer: 'tactical', series: 'enhance', index: 255,
        displayName: '筑垒蚕食', ownerName: '种师道', sourceQuote: '《宋史·种师道传》：持重筑垒，拓边破夏。',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_attacker', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_256', usageTag: '防御', situationTag: '均势', layer: 'tactical', series: 'fate', index: 256,
        displayName: '枭雄据河', sourceQuote: '割据一方据河自守，如沮渠蒙逊建北凉等多将皆有。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_257', layer: 'tactical', series: 'troop', index: 257,
        displayName: '水淹七军', ownerName: '关羽', sourceQuote: '《三国志·关羽传》：会大霖雨，汉水溢，禁七军皆没。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_258', layer: 'tactical', series: 'enhance', index: 258,
        displayName: '奋先摧坚', sourceQuote: '《明史·常遇春传》：每战辄先登，所向克捷。',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_attacker', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_259', layer: 'tactical', series: 'enhance', index: 259,
        displayName: '亲帅摧城', sourceQuote: '《晋书·桓温传》：温亲帅灭成汉。',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_attacker', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_260', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 260,
        displayName: '奇计擒藩', ownerName: '王守仁', sourceQuote: '用奇计擒获藩镇敌将，如王守仁擒宸濠等多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_261', layer: 'tactical', series: 'troop', index: 261,
        displayName: '火攻破舰', ownerName: '周瑜', sourceQuote: '【周瑜】赤壁火攻烧毁曹军战舰',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_262', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 262,
        displayName: '唱筹量沙', ownerName: '檀道济', sourceQuote: '【檀道济】《南史·檀道济传》：以沙充米唱筹骗北魏，全军而退。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_263', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 263,
        displayName: '婴城挫众', ownerName: '朱文正', sourceQuote: '【朱文正】《明史·朱文正传》：洪都婴城挫陈友谅大军。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_264', usageTag: '防御', situationTag: '优势', layer: 'tactical', series: 'troop', index: 264,
        displayName: '屯田制敌', ownerName: '赵充国', sourceQuote: '【赵充国】《汉书·赵充国传》：河湟屯田以守制敌，不战而屈羌。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_265', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 265,
        displayName: '据水断桥', ownerName: '张飞', sourceQuote: '【张飞】《三国志·张飞传》：长坂坡据水断桥喝退曹军。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_266', usageTag: '双行', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 266,
        displayName: '单骑退蕃', ownerName: '郭子仪', sourceQuote: '【郭子仪】《旧唐书·郭子仪传》：单骑入回纥大营退回纥吐蕃联军。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_267', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'troop', index: 267,
        displayName: '饮马问鼎', sourceQuote: '《左传·宣十二年》：楚子观兵于周疆，问鼎之轻重。（熊旅）',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_268', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 268,
        displayName: '合诏摧虏', sourceQuote: '《南诏德化碑》：阁罗凤合六诏之众，拒唐破蕃。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_269', layer: 'tactical', series: 'troop', index: 269,
        displayName: '合兵摧城', ownerName: '努尔哈赤', sourceQuote: '【努尔哈赤】合兵灭叶赫、萨尔浒',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_siege_attacker', phase: 'pre_opening_troops',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_270', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 270,
        displayName: '锐志摧远', sourceQuote: '《三国志·姜维传》：维锐志进取，九伐中原，破王经于洮西。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_271', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 271,
        displayName: '白杆勤王', ownerName: '秦良玉', sourceQuote: '【秦良玉】《明史·秦良玉传》：率白杆兵北上勤王抗清。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_272', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 272,
        displayName: '疾骑平蕃', ownerName: '年羹尧', sourceQuote: '《清史稿·年羹尧传》：年羹尧奇袭平青海。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_273', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 273,
        displayName: '铁壁挫锋', sourceQuote: '防线如铁壁挫败敌军锋锐，如吕文焕守襄阳等多将皆有。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_274', layer: 'tactical', series: 'enhance', index: 274,
        displayName: '奋击摧敌', ownerName: '常遇春', ownerGeneralId: 'ming_changyuchun', sourceQuote: '【常遇春】号称十万众横行天下，每战辄先登，奋击摧敌。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_275', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 275,
        displayName: '远飏破锥', sourceQuote: '远飞高飏击破锥形阵，游击战术，如李如松碧蹄馆等多将皆有。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_276', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 276,
        displayName: '长驱蹙虏', sourceQuote: '《史记·卫将军骠骑列传》：青至笼城，出朔方，击右贤王，收河南地。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_277', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 277,
        displayName: '虽远必诛', ownerName: '陈汤', sourceQuote: '【陈汤】明犯强汉者虽远必诛',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_278', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'troop', index: 278,
        displayName: '火燔连营', ownerName: '陆逊', sourceQuote: '【陆逊】《三国志·陆逊传》：夷陵之战火烧刘备七百里连营。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_279', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 279,
        displayName: '雷厉摧锋', ownerName: '张巡', sourceQuote: '【张巡】死守睢阳面中六矢岿然不动，雷厉风行摧破敌锋。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_280', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 280,
        displayName: '倍道诛逆', sourceQuote: '加倍行军速度诛灭叛逆，如司马懿平孟达等多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_281', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 281,
        displayName: '车悬奔冲', ownerName: '上杉谦信', sourceQuote: '【上杉谦信】日本战国车悬阵轮番冲锋破敌。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_282', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 282,
        displayName: '疾锋摧盟', sourceQuote: '快速突击摧垮敌军联盟，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_283', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 283,
        displayName: '逾岭袭国', ownerName: '司马错', sourceQuote: '翻越山岭袭击敌国，如邓艾偷渡阴平、司马错灭蜀等。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_284', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'troop', index: 284,
        displayName: '诡道擒渠', sourceQuote: '用诡诈之计擒获敌军首领，如裴行俭执都支等多将皆有。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_285', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 285,
        displayName: '越沙摧垒', sourceQuote: '穿越沙漠摧毁敌军营垒，如侯君集灭高昌等多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_286', usageTag: '防御', situationTag: '优势', layer: 'tactical', series: 'troop', index: 286,
        displayName: '凭险摧锐', ownerName: '吴玠', sourceQuote: '【吴玠】《宋史·吴玠传》：和尚原据险大破金军精锐。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_287', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 287,
        displayName: '楼船踏浪', sourceQuote: '大型楼船水战冲击敌水寨，如刘裕楼船北伐等多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_288', layer: 'tactical', series: 'troop', index: 288,
        displayName: '荡海歼寇', sourceQuote: '《明史·俞大猷传》：破倭于海上，数有功，世称俞家军。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_289', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 289,
        displayName: '戈船破阵', sourceQuote: '战船冲击敌水军阵型，如周瑜赤壁水战等多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_290', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 290,
        displayName: '保境安边', sourceQuote: '保卫边境安定边疆，如蒙恬、李广等边将，多将皆有。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_291', layer: 'tactical', series: 'enhance', index: 291,
        displayName: '破碉摧堡', ownerName: '阿桂', sourceQuote: '《清史稿·阿桂传》：攻金川碉卡，凡克碉数千，遂平两金川。',
        baseEffect: 'ally_power_mult', condition: 'terrain_mountain', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_292', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 292,
        displayName: '奇袭夺帐', ownerName: '李靖', sourceQuote: '奇袭夺取敌军大帐，如李靖袭颉利、岳钟琪袭青海等。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_293', layer: 'tactical', series: 'troop', index: 293,
        displayName: '壅水灌垒', ownerName: '王贲', sourceQuote: '《史记·王翦列传》：王贲引河沟灌大梁，城坏，魏王假降，遂灭魏。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_294', usageTag: '防御', situationTag: '均势', layer: 'tactical', series: 'fate', index: 294,
        displayName: '先据山险', sourceQuote: '抢先占据山险地利，如赵奢阏与之战据北山等多将皆有。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_295', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 295,
        displayName: '振旅摧锋', sourceQuote: '整顿军队后发动冲锋，如李世民虎牢关等多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_296', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 296,
        displayName: '孤守绝域', ownerName: '郭昕', sourceQuote: '【郭昕】《旧唐书·郭昕传》：安西都护孤守龟兹数十年。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_297', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'counter', index: 297,
        displayName: '长驱摧垒', ownerName: '常遇春', ownerGeneralId: 'ming_changyuchun', sourceQuote: '长途奔袭摧毁敌军堡垒，如常遇春北伐等多将皆有。',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
    },
    {
        id: 'ts_298', layer: 'tactical', series: 'casualty', index: 298,
        displayName: '据河自固', ownerName: '梁师都', sourceQuote: '【梁师都】据朔方河套自固',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_299', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 299,
        displayName: '孤城却众', ownerName: '耿恭', sourceQuote: '【耿恭】《后汉书·耿恭传》：疏勒孤城却匈奴数万众。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_300', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'troop', index: 300,
        displayName: '夜袭破虏', sourceQuote: '趁夜突袭击破敌军营寨，多将皆有。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_301', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 301,
        displayName: '建牙摧敌', sourceQuote: '建立将旗稳定指挥摧毁敌军，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_302', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 302,
        displayName: '破敌奠基', sourceQuote: '击破敌军奠定帝王基业，如刘邦灭项羽等多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_303', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 303,
        displayName: '恃象横行', sourceQuote: '依靠战象在战场上横行冲击，南方多国常用。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_304', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 304,
        displayName: '摧锋破垒', sourceQuote: '摧毁敌锋攻破堡垒扩大战果，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_305', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 305,
        displayName: '破阵摧坚', sourceQuote: '正面冲垮敌阵摧毁坚垒，如曹操官渡之战等多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_306', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 306,
        displayName: '乘丧摧垒', sourceQuote: '趁敌国国丧时攻打，如蒙古灭金等多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_307', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 307,
        displayName: '摧坚破阵', sourceQuote: '连续摧毁坚垒突破敌阵，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_308', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 308,
        displayName: '收部摧庭', sourceQuote: '收编溃散部众后反攻摧毁敌指挥中心，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_309', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'counter', index: 309,
        displayName: '寡骑破众', ownerName: '张辽', ownerGeneralId: 'lu_zhangliao', sourceQuote: '【张辽】《三国志·张辽传》：逍遥津八百骑兵破孙权十万，寡骑破众。',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_310', layer: 'tactical', series: 'enhance', index: 310,
        displayName: '借兵破竺', sourceQuote: '《旧唐书·天竺传》：王玄策发吐蕃、泥婆罗兵，破中天竺，擒阿罗那顺以归。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_311', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 311,
        displayName: '并力诛渠', ownerName: '石勒', sourceQuote: '【石勒】《晋书·石勒载记》：集中兵力诛杀王浚等割据首领。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_312', layer: 'tactical', series: 'enhance', index: 312,
        displayName: '控弦拒虏', sourceQuote: '《旧唐书·突厥传》：苏禄收突骑施余众，控弦数十万，屡拒大食东侵。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_313', layer: 'tactical', series: 'enhance', index: 313,
        displayName: '西迁破月', sourceQuote: '《汉书·西域传》：昆莫猎骄靡西攻破大月氏，徙居其地，遂雄西域。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_314', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 314,
        displayName: '连破摧城', sourceQuote: '连续攻破多座城池，如乐毅下齐七十城等多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_315', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'troop', index: 315,
        displayName: '设伏歼锐', ownerName: '孙膑', ownerGeneralId: 'qi_sunbin', sourceQuote: '【孙膑】《史记·孙子吴起列传》：马陵设伏歼灭魏军精锐。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_316', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 316,
        displayName: '先犯破盟', sourceQuote: '率先出击打破敌军联盟，如赤壁孙刘联军等多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_317', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 317,
        displayName: '摧垒代兴', sourceQuote: '摧毁敌垒取而代之兴盛，如刘邦灭秦等多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_318', usageTag: '双行', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 318,
        displayName: '恩威服众',  sourceQuote: '【诸葛亮】《三国志·诸葛亮传》：七擒孟获攻心为上，恩威服众。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_319', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 319,
        displayName: '破阵摧军', sourceQuote: '正面攻破敌阵冲垮全军，如白起长平之战等多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_320', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'enhance', index: 320,
        displayName: '婴城拒逆', ownerName: '张巡', sourceQuote: '【张巡】《新唐书·张巡传》：死守睢阳，婴城拒敌。',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_321', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'enhance', index: 321,
        displayName: '坚垒挫锋', sourceQuote: '以坚固营垒抵挡并挫败敌军锋锐，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_322', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 322,
        displayName: '连破坚垒', sourceQuote: '连续攻破多座坚城，如秦灭六国等多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_323', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 323,
        displayName: '狼兵荡寇', sourceQuote: '广西狼兵出征扫荡倭寇，勇猛善战。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_324', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 324,
        displayName: '并力摧城', sourceQuote: '集中兵力全力攻城强行突破，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_325', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 325,
        displayName: '越岭摧城', sourceQuote: '翻越山岭攻城拔寨，如韩信出陈仓等多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_326', usageTag: '防御', situationTag: '优势', layer: 'tactical', series: 'troop', index: 326,
        displayName: '扼险歼师', ownerName: '吴玠', sourceQuote: '【吴玠】《宋史·吴玠传》：和尚原据险大歼金军。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_327', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 327,
        displayName: '扫荡摧坚', sourceQuote: '大规模扫荡摧毁敌军坚固据点，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_328', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 328,
        displayName: '骁锋摧叛', sourceQuote: '精锐部队快速平定叛乱，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_329', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'troop', index: 329,
        displayName: '合围俘君', sourceQuote: '四面合围擒获敌国君主，灭国之功，多将皆有。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_330', layer: 'tactical', series: 'enhance', index: 330,
        displayName: '黄山破敌', sourceQuote: '《三国史记》：金庾信黄山破百济，协唐灭丽，成三韩一统之业。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_331', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 331,
        displayName: '劫营破敌', ownerName: '甘宁', sourceQuote: '【甘宁】《三国志·甘宁传》：百骑夜劫曹营不折一人，以寡击众。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_332', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 332,
        displayName: '鏖兵破垒', sourceQuote: '艰苦鏖战攻克敌军营垒，均势下的硬仗。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_333', layer: 'tactical', series: 'enhance', index: 333,
        displayName: '倡义附盟', sourceQuote: '《元史·耶律留哥传》：留哥起兵辽东，破金军，附蒙古，建东辽。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_334', usageTag: '双行', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 334,
        displayName: '镇抚遐荒', ownerName: '沐英', sourceQuote: '【沐英】《明史·沐英传》：镇守云南抚定边疆。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_335', usageTag: '防御', situationTag: '优势', layer: 'tactical', series: 'troop', index: 335,
        displayName: '世镇摧锋', sourceQuote: '世代镇守边关传承抗敌锋锐，多将皆有。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_336', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 336,
        displayName: '聚众摧军', ownerName: '陈胜', sourceQuote: '【陈胜】《史记·陈涉世家》：揭竿聚众摧毁秦军。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_337', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 337,
        displayName: '长驱夺城', sourceQuote: '长驱直入连续夺取城池，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_338', usageTag: '防御', situationTag: '优势', layer: 'tactical', series: 'troop', index: 338,
        displayName: '恃险困敌', sourceQuote: '利用险要地形围困敌军，多将皆有。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_339', layer: 'tactical', series: 'troop', index: 339,
        displayName: '奔袭擒渠', ownerName: '盖嘉运', sourceQuote: '《旧唐书·突骑施传》：盖嘉运袭碎叶，破突骑施，擒吐火仙可汗。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_340', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 340,
        displayName: '陷城夺都', sourceQuote: '攻克城池夺取敌国都城，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_341', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'troop', index: 341,
        displayName: '远驱破国', ownerName: '苏定方', sourceQuote: '【苏定方】《旧唐书·苏定方传》：远征千里灭西突厥。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_342', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 342,
        displayName: '楼船摧岸', sourceQuote: '水军楼船冲击摧毁岸防工事，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_343', layer: 'tactical', series: 'troop', index: 343,
        displayName: '舟师歼锐', ownerName: '拉其特', sourceQuote: '《阿萨姆编年史》：拉其特萨莱加特水战大破莫卧儿舟师，保阿萨姆。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_344', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 344,
        displayName: '裹毡疾进', sourceQuote: '【邓艾】《三国志·邓艾传》：阴平道裹毡而下灭蜀。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, status: 'retired', engineStatus: 'ready',
    },
    {
        id: 'ts_345', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 345,
        displayName: '破敌开幕', sourceQuote: '击破敌军开创全新局面，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_346', layer: 'tactical', series: 'troop', index: 346,
        displayName: '火矢焚舟', sourceQuote: '《阴德太平记》：村上水军以焙烙火矢焚织田舟师于木津川口。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_347', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 347,
        displayName: '泛海夺城', ownerName: '郑成功', sourceQuote: '【郑成功】《清史稿·郑成功传》：跨海收复台湾。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_348', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 348,
        displayName: '驱象摧阵', sourceQuote: '驱使战象冲垮敌军阵型，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_349', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 349,
        displayName: '收众摧锋', ownerName: '石勒', sourceQuote: '【石勒】《晋书·石勒载记》：收拢流民奋击摧敌。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_350', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 350,
        displayName: '老谋荡寇', sourceQuote: '老将凭智谋扫荡敌寇，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_351', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'troop', index: 351,
        displayName: '昼伏夜击', sourceQuote: '昼间隐藏夜间出击，出奇制胜，多将皆有。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_352', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 352,
        displayName: '征伐开疆', sourceQuote: '大规模征伐开拓疆土，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_353', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 353,
        displayName: '聚众摧坚', sourceQuote: '聚集部众摧毁坚固防御，多将皆有。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_354', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 354,
        displayName: '连征摧远', sourceQuote: '连续征战征服远方，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_355', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 355,
        displayName: '摧锋弑君', sourceQuote: '摧破敌军斩杀敌国君主，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_356', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 356,
        displayName: '飞军摧逆', sourceQuote: '神速军队摧毁叛逆，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_357', usageTag: '双行', situationTag: '优势', layer: 'tactical', series: 'troop', index: 357,
        displayName: '威震绝域', ownerName: '班超', sourceQuote: '【班超】《后汉书·班超传》：定远西域，威震绝域。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_358', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 358,
        displayName: '铁骑破锐', sourceQuote: '铁骑冲锋击破敌军精锐，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_359', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 359,
        displayName: '深入捣巢', ownerName: '霍去病', sourceQuote: '【霍去病】《史记·卫将军骠骑列传》：深入漠北捣匈奴王庭。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_360', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 360,
        displayName: '疾驱灭国', sourceQuote: '快速行军一举灭国，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_361', usageTag: '双行', situationTag: '优势', layer: 'tactical', series: 'troop', index: 361,
        displayName: '攻心摧部', ownerName: '诸葛亮', sourceQuote: '【诸葛亮】《三国志·诸葛亮传》：七擒孟获攻心为上。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_362', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 362,
        displayName: '越沙破垒', sourceQuote: '穿越沙漠攻破敌军堡垒，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_363', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'troop', index: 363,
        displayName: '迂回袭砦', sourceQuote: '迂回绕后突袭敌军营寨，多将皆有。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_364', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 364,
        displayName: '席卷摧邻', sourceQuote: '横扫邻国吞并领土，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_365', layer: 'tactical', series: 'troop', index: 365,
        displayName: '扼江破舰', sourceQuote: '《清史稿》：沙尔虎达战罗刹于松花江，焚其舟舰，镇宁古塔。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_366', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'troop', index: 366,
        displayName: '夜渡袭城', sourceQuote: '趁夜渡河突袭攻城，多将皆有。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_367', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 367,
        displayName: '摧锋拓边', sourceQuote: '摧毁敌锋锐开拓边境，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_368', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'enhance', index: 368,
        displayName: '据隘御侵', sourceQuote: '据守关隘抵御入侵，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_369', layer: 'tactical', series: 'casualty', index: 369,
        displayName: '碉守挫锐', sourceQuote: '《清史稿》：莎罗奔恃大金川碉卡，久抗清军，官兵屡挫。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_370', layer: 'tactical', series: 'enhance', index: 370,
        displayName: '逾岭破阵', sourceQuote: '《拉达克王统记》：僧格朗杰越山扩张，征古格、象雄，拉达克极盛。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_371', layer: 'tactical', series: 'enhance', index: 371,
        displayName: '秉钺制敌', ownerName: '琼波邦色', sourceQuote: '《敦煌吐蕃文书》：琼波邦色为苏毗大论，秉兵柄，屡制强敌。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_372', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 372,
        displayName: '奔袭陷城', sourceQuote: '长途奔袭攻陷城池，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_373', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'enhance', index: 373,
        displayName: '复土摧坚', ownerName: '祖逖', sourceQuote: '【祖逖】《晋书·祖逖传》：北伐收复失地，中流击楫。',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_374', layer: 'tactical', series: 'casualty', index: 374,
        displayName: '据险保民', sourceQuote: '《十国春秋》：钱镠破孙儒、平董昌，据两浙保境安民，建吴越。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_375', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'enhance', index: 375,
        displayName: '骁锋陷阵', sourceQuote: '骁勇先锋冲入敌阵以少打多，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.1, status: 'retired', engineStatus: 'ready',
    },
    {
        id: 'ts_376', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'enhance', index: 376,
        displayName: '奋锐破坚', sourceQuote: '振奋锐气攻破坚阵败中求胜，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_377', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 377,
        displayName: '摧锋靖边', sourceQuote: '摧毁敌锋安定边境，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_378', layer: 'tactical', series: 'enhance', index: 378,
        displayName: '乘虚陷阙', ownerName: '赤松德赞', sourceQuote: '《旧唐书·吐蕃传》：赤松德赞乘虚入寇，陷长安，立傀儡，吐蕃极盛。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_379', layer: 'tactical', series: 'troop', index: 379,
        displayName: '奄袭夺城', sourceQuote: '《宋史·夏国传》：李继迁出没无常，奄袭灵州，据银夏，奠西夏之基。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_380', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'troop', index: 380,
        displayName: '风雨掩袭', sourceQuote: '借风雨掩护突袭敌军，多将皆有。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_381', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 381,
        displayName: '千枪突阵', sourceQuote: '密集长枪方阵冲锋陷阵，如金军铁浮屠等多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_382', layer: 'tactical', series: 'troop', index: 382,
        displayName: '决堰歼敌', ownerName: '姜邯赞', sourceQuote: '《高丽史》：姜邯赞堰水兴化镇，契丹半渡决之，龟州追歼十万。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_383', usageTag: '双行', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 383,
        displayName: '闻鸡起舞', ownerName: '祖逖', ownerGeneralId: 'yuzhou_zuti', sourceQuote: '【祖逖】《晋书·祖逖传》：闻鸡起舞立志北伐，虽处劣势不坠其志。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_384', usageTag: '双行', situationTag: '均势', layer: 'tactical', series: 'fate', index: 384,
        displayName: '精达事机', sourceQuote: '精明通达把握战机，无单一专属武将。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3, comebackThreshold: 0.8, engineStatus: 'ready',
    },
    {
        id: 'ts_385', layer: 'tactical', series: 'casualty', index: 385,
        displayName: '嚼齿吞贼', sourceQuote: '《旧唐书·张巡传》："大呼辄眦裂血面，嚼齿皆碎……气吞逆贼。"',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'battle_siege_defender', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '守城败时咬人：胜方(攻方)本场战损×2；契合张巡守睢阳虽陷、蔽遮江淮拖垮叛军的定位',
    },
    {
        id: 'ts_386', usageTag: '防御', situationTag: '均势', layer: 'tactical', series: 'counter', index: 386,
        displayName: '拔刀刺山', ownerName: '耿恭', ownerGeneralId: 'xiyu_genggong', sourceQuote: '【耿恭】《后汉书·耿恭传》：疏勒城拔刀刺山飞泉，绝境求生。',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
    },
    {
        id: 'ts_387', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 387,
        displayName: '保境安民', ownerName: '钱镠', sourceQuote: '【钱镠】《旧五代史·钱镠传》：吴越国王修筑海塘保境安民。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_388', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 388,
        displayName: '孤胆陷阵', ownerName: '吕布', sourceQuote: '【吕布】《三国志·吕布传》：以骁勇闻名，常单骑冲阵，孤胆陷阵。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },

];

// ── T1 精锐·泛区名将专属技（24将×3局） ──────────────
const UNIQUE_T1_GENERAL: TacticalSkillEntry[] = [
    {
        id: 'ts_462', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'troop', index: 462,
        displayName: '合围攻心', ownerName: '白起', sourceQuote: '【白起】《史记·白起列传》：长平之战围困赵军瓦解其心。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_463', layer: 'tactical', series: 'fate', index: 463,
        displayName: '分进乱阵', ownerName: '沙普尔', sourceQuote: '沙普尔历史记载：沙普尔分路进击搅乱罗马防线',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【沙普尔】T1精锐·三势精修·势create·均局专属',
    },
    {
        id: 'ts_464', layer: 'tactical', series: 'casualty', index: 464,
        displayName: '溃流遏追', ownerName: '沙普尔', sourceQuote: '沙普尔历史记载：沙普尔溃退中以骑兵逆击遏止追兵',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '【沙普尔】T1精锐·三势精修·势create·劣局专属',
    },
    {
        id: 'ts_465', layer: 'tactical', series: 'enhance', index: 465,
        displayName: '围城困崩', ownerName: '皇太极', sourceQuote: '皇太极历史记载：松锦围城断粮困死明军主力',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.09, engineStatus: 'ready',
        note: '【皇太极】T1精锐·三势精修·势reverse·优局专属',
    },
    {
        id: 'ts_466', usageTag: '防御', situationTag: '优势', layer: 'tactical', series: 'troop', index: 466,
        displayName: '长围断援', ownerName: '白起', sourceQuote: '【白起】《史记·白起列传》：长平围赵绝其粮道与援兵，长围断援。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05,engineStatus: 'ready',
    },
    {
        id: 'ts_467', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 467,
        displayName: '间行除患', sourceQuote: '秘密行动铲除祸患，多将皆有。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_468', layer: 'tactical', series: 'enhance', index: 468,
        displayName: '风涛掩击', ownerName: '毛利元就', sourceQuote: '毛利元就历史记载：严岛风涛夜袭陶晴贤大营',
        baseEffect: 'nullify_enemy_opening_cut', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【毛利元就】T1精锐·三势精修·势leverage·优局专属',
    },
    {
        id: 'ts_469', layer: 'tactical', series: 'fate', index: 469,
        displayName: '郡山诱击', ownerName: '毛利元就', sourceQuote: '毛利元就历史记载：吉田郡山诱敌深入两面夹击尼子军',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【毛利元就】T1精锐·三势精修·势leverage·均局专属',
    },
    {
        id: 'ts_470', layer: 'tactical', series: 'casualty', index: 470,
        displayName: '笼城疲敌', ownerName: '毛利元就', sourceQuote: '毛利元就历史记载：吉田郡山笼城固守消耗尼子军',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.5, engineStatus: 'ready',
        note: '【毛利元就】T1精锐·三势精修·势leverage·劣局专属',
    },
    {
        id: 'ts_471', usageTag: '防御', situationTag: '均势', layer: 'tactical', series: 'troop', index: 471,
        displayName: '据险摧锋', ownerName: '吴玠', sourceQuote: '【吴玠】《宋史·吴玠传》：和尚原据险要摧破金军先锋。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_472', layer: 'tactical', series: 'counter', index: 472,
        displayName: '垒山遏骑', sourceQuote: '大祚荣历史记载：筑城垒山遏制唐军骑兵',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【大祚荣】T1精锐·三势精修·势reverse·均局专属',
    },
    {
        id: 'ts_473', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 473,
        displayName: '间道退敌', sourceQuote: '走小路奇袭击退敌军，如韩世忠黄天荡等多将皆有。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_474', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 474,
        displayName: '踏雪溃阵', ownerName: '李愬', sourceQuote: '【李愬】《旧唐书·李愬传》：雪夜入蔡州冲垮敌阵。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_475', layer: 'tactical', series: 'fate', index: 475,
        displayName: '假道迂击', sourceQuote: '拖雷历史记载：假道南宋迂回攻金侧翼',
        baseEffect: 'partial_negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【拖雷】T1精锐·三势精修·势create·均局专属',
    },
    {
        id: 'ts_476', layer: 'tactical', series: 'casualty', index: 476,
        displayName: '散骑整众', ownerName: '拖雷', sourceQuote: '拖雷历史记载：散骑溃退中重整部队保存主力',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.5, engineStatus: 'ready',
        note: '【拖雷】T1精锐·三势精修·势create·劣局专属',
    },
    {
        id: 'ts_477', layer: 'tactical', series: 'enhance', index: 477,
        displayName: '倍道摧坚', ownerName: '曹操', sourceQuote: '曹操历史记载：倍道兼行五日内摧灭袁尚',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.09, engineStatus: 'ready',
        note: '【曹操】T1精锐·三势精修·势leverage·优局专属',
    },
    {
        id: 'ts_478', layer: 'tactical', series: 'counter', index: 478,
        displayName: '截粮疲敌', ownerName: '白起', sourceQuote: '【白起】《史记》：长平之战绝赵粮道，饿困赵军四十六日',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【曹操】T1精锐·三势精修·势leverage·均局专属',
    },
    {
        id: 'ts_479', layer: 'tactical', series: 'casualty', index: 479,
        displayName: '据营止溃', ownerName: '司马懿', ownerGeneralId: 'wei_simayi', sourceQuote: '【司马懿】坚壁拒守五丈原，据营止溃耗死诸葛亮。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.5, engineStatus: 'ready',
        note: '【曹操】T1精锐·三势精修·势leverage·劣局专属',
    },
    {
        id: 'ts_480', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 480,
        displayName: '长驱贯阵', sourceQuote: '长驱直入贯穿敌阵，如项羽彭城之战等多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_481', layer: 'tactical', series: 'fate', index: 481,
        displayName: '虚实扰敌', ownerName: '柴荣', sourceQuote: '柴荣历史记载：虚实扰敌疲耗南唐水寨',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【柴荣】T1精锐·三势精修·势create·均局专属',
    },
    {
        id: 'ts_482', layer: 'tactical', series: 'casualty', index: 482,
        displayName: '背城遏锋', ownerName: '柴荣', sourceQuote: '柴荣历史记载：淮南背城遏锋击退南唐反攻',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '【柴荣】T1精锐·三势精修·势create·劣局专属',
    },
    {
        id: 'ts_483', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 483,
        displayName: '象冲突阵', sourceQuote: '战象集群冲锋突破敌军阵线，南方多国常用。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_484', layer: 'tactical', series: 'fate', index: 484,
        displayName: '林沼设伏', sourceQuote: '阇耶跋摩历史记载：林沼设伏诱敌深入覆灭',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【阇耶跋摩】T1精锐·三势精修·势create·均局专属',
    },
    {
        id: 'ts_485', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'troop', index: 485,
        displayName: '散象溃敌', sourceQuote: '惊散敌方战象使其反踏本阵，多将皆有。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_486', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'troop', index: 486,
        displayName: '捣虚袭隙', ownerName: '曹操', sourceQuote: '【曹操】《三国志·武帝纪》：官渡袭乌巢断袁绍粮草，捣虚袭隙。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_487', layer: 'tactical', series: 'fate', index: 487,
        displayName: '沙尘掩袭', ownerName: '扩廓帖木儿', sourceQuote: '扩廓帖木儿历史记载：沙尘掩护突袭明军大营',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【扩廓帖木儿】T1精锐·三势精修·势create·均局专属',
    },
    {
        id: 'ts_488', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 488,
        displayName: '诈北设伏', ownerName: '冒顿', sourceQuote: '【冒顿】《史记·匈奴列传》：白登之围前佯败诱汉军入伏。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_489', layer: 'tactical', series: 'enhance', index: 489,
        displayName: '威服摧盟', sourceQuote: '达延汗历史记载：威服漠南各部摧破联盟',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.09, engineStatus: 'ready',
        note: '【达延汗】T1精锐·三势精修·势create·优局专属',
    },
    {
        id: 'ts_490', layer: 'tactical', series: 'fate', index: 490,
        displayName: '分道疲敌', sourceQuote: '达延汗历史记载：分道出击疲敌各部使其降服',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【达延汗】T1精锐·三势精修·势create·均局专属',
    },
    {
        id: 'ts_491', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 491,
        displayName: '溃围整旅', sourceQuote: '突围后重新整编残部，如刘备多次败后重整等多将皆有。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_492', usageTag: '双行', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 492,
        displayName: '屡蹶振击', ownerName: '刘备', ownerGeneralId: 'shu_liubei', sourceQuote: '【刘备】《三国志·先主传》：屡败屡战折而不挠，屡蹶振击。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_493', layer: 'tactical', series: 'fate', index: 493,
        displayName: '流动作势', ownerName: '李自成', sourceQuote: '李自成历史记载：流动作势调动明军疲于奔命',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【李自成】T1精锐·三势精修·势create·均局专属',
    },
    {
        id: 'ts_494', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 494,
        displayName: '散营惑敌', sourceQuote: '分散营寨迷惑敌军，如赵云空营计等多将皆有。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_495', layer: 'tactical', series: 'enhance', index: 495,
        displayName: '转战摧虚', ownerName: '张献忠', sourceQuote: '张献忠历史记载：转战千里摧击明军薄弱州邑',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.09, engineStatus: 'ready',
        note: '【张献忠】T1精锐·三势精修·势create·优局专属',
    },
    {
        id: 'ts_496', layer: 'tactical', series: 'fate', index: 496,
        displayName: '设伏夹截', ownerName: '张献忠', sourceQuote: '张献忠历史记载：设伏山谷夹截追击明军',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【张献忠】T1精锐·三势精修·势create·均局专属',
    },
    {
        id: 'ts_497', layer: 'tactical', series: 'casualty', index: 497,
        displayName: '溃途收众', ownerName: '张献忠', sourceQuote: '张献忠历史记载：溃途收拢流散部众复振军势',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.5, engineStatus: 'ready',
        note: '【张献忠】T1精锐·三势精修·势create·劣局专属',
    },
    {
        id: 'ts_498', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 498,
        displayName: '驰射回锋', sourceQuote: '骑兵驰骋中回身射箭，如帕提亚战术等多族骑兵皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_499', layer: 'tactical', series: 'fate', index: 499,
        displayName: '伪遁诱截', ownerName: '苏伦', sourceQuote: '苏伦历史记载：伪遁诱敌深入帕提亚腹地',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【苏伦】T1精锐·三势精修·势create·均局专属',
    },
    {
        id: 'ts_500', layer: 'tactical', series: 'casualty', index: 500,
        displayName: '绝地逆摧', ownerName: '苏伦', sourceQuote: '苏伦历史记载：绝地逆摧反击突破重围',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '【苏伦】T1精锐·三势精修·势create·劣局专属',
    },
    {
        id: 'ts_501', layer: 'tactical', series: 'enhance', index: 501,
        displayName: '破盟摧众', sourceQuote: '艾哈迈德历史记载：破敌联盟摧其众军统一阿富汗',
        baseEffect: 'partial_negate_enemy_skill', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【艾哈迈德】T1精锐·三势精修·势create·优局专属',
    },
    {
        id: 'ts_502', layer: 'tactical', series: 'fate', index: 502,
        displayName: '间使离敌', sourceQuote: '艾哈迈德历史记载：间使离间敌盟内部使其瓦解',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【艾哈迈德】T1精锐·三势精修·势create·均局专属',
    },
    {
        id: 'ts_503', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 503,
        displayName: '据险退敌', sourceQuote: '依靠险要地势击退敌军进攻，多将皆有。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_504', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 504,
        displayName: '分进合击', sourceQuote: '多路分进最终汇合围歼，如蒙古三路攻金等多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_505', layer: 'tactical', series: 'fate', index: 505,
        displayName: '诈退设伏', ownerName: '噶勒丹策凌', sourceQuote: '噶勒丹策凌历史记载：诈退设伏诱清军深入',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【噶勒丹策凌】T1精锐·三势精修·势create·均局专属',
    },
    {
        id: 'ts_506', layer: 'tactical', series: 'casualty', index: 506,
        displayName: '聚散再战', ownerName: '噶勒丹策凌', sourceQuote: '噶勒丹策凌历史记载：光显寺聚散余部再战突围',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.5, engineStatus: 'ready',
        note: '【噶勒丹策凌】T1精锐·三势精修·势create·劣局专属',
    },
    {
        id: 'ts_507', usageTag: '防御', situationTag: '均势', layer: 'tactical', series: 'fate', index: 507,
        displayName: '后发摧敌', sourceQuote: '防御反击，待敌锐气尽失后出击，多将皆有。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_508', layer: 'tactical', series: 'fate', index: 508,
        displayName: '持重疲彼', ownerName: '德川家康', sourceQuote: '德川家康历史记载：长久手持重不出疲敌待机',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【德川家康】T1精锐·三势精修·势leverage·均局专属',
    },
    {
        id: 'ts_509', layer: 'tactical', series: 'casualty', index: 509,
        displayName: '笼城挫锐', ownerName: '德川家康', sourceQuote: '德川家康历史记载：大坂冬之阵笼城挫锐退丰臣军',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '【德川家康】T1精锐·三势精修·势leverage·劣局专属',
    },
    {
        id: 'ts_510', layer: 'tactical', series: 'enhance', index: 510,
        displayName: '冲阵摧众', ownerName: '尔朱荣', sourceQuote: '尔朱荣历史记载：滏口破阵摧灭葛荣百万军',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.09, engineStatus: 'ready',
        note: '【尔朱荣】T1精锐·三势精修·势create·优局专属',
    },
    {
        id: 'ts_511', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 511,
        displayName: '并阵夹击', sourceQuote: '两翼阵列同时夹击敌军，如坎尼会战等多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05,engineStatus: 'ready',
    },
    {
        id: 'ts_512', layer: 'tactical', series: 'casualty', index: 512,
        displayName: '溃军斩将', ownerName: '尔朱荣', sourceQuote: '尔朱荣历史记载：溃败中以骑突斩敌主将逆转',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '【尔朱荣】T1精锐·三势精修·势create·劣局专属',
    },
    {
        id: 'ts_513', usageTag: '防御', situationTag: '均势', layer: 'tactical', series: 'fate', index: 513,
        displayName: '待劳摧锐', sourceQuote: '以逸待劳，待敌疲惫后摧毁其精锐，多将皆有。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_514', layer: 'tactical', series: 'fate', index: 514,
        displayName: '据高遏骑', sourceQuote: '论钦陵历史记载：据高遏骑截唐军退路',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【论钦陵】T1精锐·三势精修·势create·均局专属',
    },
    {
        id: 'ts_515', layer: 'tactical', series: 'casualty', index: 515,
        displayName: '间道逆摧', sourceQuote: '论钦陵历史记载：间道逆摧反击突破唐军重围',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '【论钦陵】T1精锐·三势精修·势create·劣局专属',
    },
    {
        id: 'ts_516', layer: 'tactical', series: 'enhance', index: 516,
        displayName: '两蹶摧锋', sourceQuote: '李定国历史记载：两蹶名王摧锋桂林衡阳',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.09, engineStatus: 'ready',
        note: '【李定国】T1精锐·三势精修·势reverse·优局专属',
    },
    {
        id: 'ts_517', layer: 'tactical', series: 'fate', index: 517,
        displayName: '伏山断道', sourceQuote: '李定国历史记载：伏山断道截清军退路',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【李定国】T1精锐·三势精修·势reverse·均局专属',
    },
    {
        id: 'ts_518', layer: 'tactical', series: 'casualty', index: 518,
        displayName: '焚舟死战', ownerName: '李定国', sourceQuote: '李定国历史记载：焚舟表死志决战清军',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '【李定国】T1精锐·三势精修·势reverse·劣局专属',
    },
    {
        id: 'ts_519', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 519,
        displayName: '雪岭摧垒', ownerName: '高仙芝', sourceQuote: '翻越雪山攻破敌军堡垒，如高仙芝征小勃律等多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_520', layer: 'tactical', series: 'fate', index: 520,
        displayName: '断道截粮', ownerName: '巴都尔萨野', sourceQuote: '巴都尔萨野历史记载：断道截粮饥困守军',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【巴都尔萨野】T1精锐·三势精修·势create·均局专属',
    },
    {
        id: 'ts_521', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 521,
        displayName: '散兵扰后', sourceQuote: '派遣小股兵力不断骚扰敌军后方，多将皆有。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_522', layer: 'tactical', series: 'enhance', index: 522,
        displayName: '象蹈摧坚', ownerName: '莽应龙', sourceQuote: '莽应龙历史记载：白象践踏阿瑜陀耶步阵摧毁其坚',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.09, engineStatus: 'ready',
        note: '【莽应龙】T1精锐·三势精修·势create·优局专属',
    },
    {
        id: 'ts_523', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 523,
        displayName: '象阵扰敌', sourceQuote: '战象阵列骚扰震慑敌军，如南方诸国作战。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05,engineStatus: 'ready',
    },
    {
        id: 'ts_524', layer: 'tactical', series: 'casualty', index: 524,
        displayName: '逆锋摧追', ownerName: '莽应龙', sourceQuote: '莽应龙历史记载：逆锋摧追倒退敌军',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '【莽应龙】T1精锐·三势精修·势create·劣局专属',
    },
    {
        id: 'ts_525', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 525,
        displayName: '兵雄摧阵', sourceQuote: '兵力雄厚正面碾压敌军阵型，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_526', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 526,
        displayName: '退避疲敌', sourceQuote: '主动退避以消耗敌军，如司马懿对蜀等多将皆有。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3,engineStatus: 'ready',
    },
    {
        id: 'ts_527', layer: 'tactical', series: 'casualty', index: 527,
        displayName: '散众溃围', ownerName: '摩诃末', sourceQuote: '摩诃末历史记载：散众分走溃围保全余部',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.5, engineStatus: 'ready',
        note: '【摩诃末】T1精锐·三势精修·势create·劣局专属',
    },
    {
        id: 'ts_528', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 528,
        displayName: '建帐摧敌', sourceQuote: '建立营帐步步推进摧毁敌军，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_529', layer: 'tactical', series: 'fate', index: 529,
        displayName: '纵骑扰后', ownerName: '骨力裴罗', sourceQuote: '骨力裴罗历史记载：纵骑扰后疲耗突厥',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【骨力裴罗】T1精锐·三势精修·势create·均局专属',
    },
    {
        id: 'ts_530', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 530,
        displayName: '盟兵共御', sourceQuote: '联盟各军共同防御强敌，多将皆有。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_531', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 531,
        displayName: '黑旗摧阵', sourceQuote: '黑旗冲锋陷阵摧敌，如刘永福黑旗军抗法等。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_532', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 532,
        displayName: '重骑截锋', sourceQuote: '重装骑兵拦截敌先锋，如唐玄甲军等多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05,engineStatus: 'ready',
    },
    {
        id: 'ts_533', layer: 'tactical', series: 'casualty', index: 533,
        displayName: '据垒疲敌', sourceQuote: '吉亚斯丁历史记载：据垒疲敌耗其锐气',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.5, engineStatus: 'ready',
        note: '【吉亚斯丁】T1精锐·三势精修·势create·劣局专属',
    },
];

// ── T1 精锐·泛区名将24(第二批) ──────────────
const UNIQUE_T1_GENERAL2: TacticalSkillEntry[] = [
    {
        id: 'ts_534', layer: 'tactical', series: 'enhance', index: 534,
        displayName: '绝漠掩袭', sourceQuote: '窦宪专题记载',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
        note: '【窦宪】T1精锐·三势精修·势create',
    },
    {
        id: 'ts_535', layer: 'tactical', series: 'counter', index: 535,
        displayName: '驱牧扰敌', sourceQuote: '窦宪专题记载',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【窦宪】T1精锐·三势精修·势leverage',
    },
    {
        id: 'ts_536', layer: 'tactical', series: 'casualty', index: 536,
        displayName: '散骑断后', sourceQuote: '窦宪专题记载',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '【窦宪】T1精锐·三势精修·势reverse',
    },
    {
        id: 'ts_537', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'troop', index: 537,
        displayName: '设伏摧锋',  ownerGeneralId: 'qi_sunbin', sourceQuote: '【孙膑】《史记·孙子吴起列传》：马陵道设伏歼灭庞涓。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_538', layer: 'tactical', series: 'fate', index: 538,
        displayName: '退师崩敌', ownerName: '先轸', sourceQuote: '先轸专题记载',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【先轸】T1精锐·三势精修·势leverage',
    },
    {
        id: 'ts_539', layer: 'tactical', series: 'casualty', index: 539,
        displayName: '陷阵死战', ownerName: '先轸', sourceQuote: '先轸专题记载',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '【先轸】T1精锐·三势精修·势reverse',
    },
    {
        id: 'ts_540', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 540,
        displayName: '飞骑蹙敌', sourceQuote: '骑兵快速压迫敌军，如霍去病漠北之战等多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_541', layer: 'tactical', series: 'fate', index: 541,
        displayName: '诱锋夹围', ownerName: '李成梁', sourceQuote: '李成梁专题记载',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【李成梁】T1精锐·三势精修·势leverage',
    },
    {
        id: 'ts_542', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 542,
        displayName: '据寨疲敌', sourceQuote: '坚守营寨消耗敌军，如廉颇长平之战等多将皆有。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_543', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 543,
        displayName: '回军袭阵', ownerName: '张辽', sourceQuote: '【张辽】《三国志·张辽传》：合肥之战回军突袭孙权。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_544', layer: 'tactical', series: 'fate', index: 544,
        displayName: '持重伺隙', ownerName: '李成桂', sourceQuote: '李成桂专题记载',
        baseEffect: 'steal_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 0.5, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【李成桂】T1精锐·三势精修·势leverage',
    },
    {
        id: 'ts_545', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 545,
        displayName: '佯北诱截', sourceQuote: '假装败退引诱敌军进入伏击圈截杀，多将皆有。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_546', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 546,
        displayName: '如墙摧阵', sourceQuote: '重步兵如墙推进冲垮敌阵，如刘裕却月阵等多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_547', layer: 'tactical', series: 'fate', index: 547,
        displayName: '分道耗敌', sourceQuote: '完颜宗弼专题记载',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【完颜宗弼】T1精锐·三势精修·势leverage',
    },
    {
        id: 'ts_548', layer: 'tactical', series: 'casualty', index: 548,
        displayName: '溃围整众', ownerName: '完颜宗弼', sourceQuote: '完颜宗弼专题记载',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.5, engineStatus: 'ready',
        note: '【完颜宗弼】T1精锐·三势精修·势reverse',
    },
    {
        id: 'ts_549', layer: 'tactical', series: 'enhance', index: 549,
        displayName: '控弦摧阵', sourceQuote: '哈斯木专题记载',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.09, engineStatus: 'ready',
        note: '【哈斯木】T1精锐·三势精修·势create',
    },
    {
        id: 'ts_550', layer: 'tactical', series: 'counter', index: 550,
        displayName: '散骑扰后', sourceQuote: '哈斯木专题记载',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【哈斯木】T1精锐·三势精修·势leverage',
    },
    {
        id: 'ts_551', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 551,
        displayName: '退避诱深', sourceQuote: '主动退避引诱敌军深入，如冒顿白登之围等多将皆有。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_552', layer: 'tactical', series: 'enhance', index: 552,
        displayName: '锐骑摧坚', ownerName: '固始汗', sourceQuote: '固始汗专题记载',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
        note: '【固始汗】T1精锐·三势精修·势create',
    },
    {
        id: 'ts_553', layer: 'tactical', series: 'counter', index: 553,
        displayName: '迂道截援', ownerName: '固始汗', sourceQuote: '固始汗专题记载',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【固始汗】T1精锐·三势精修·势leverage',
    },
    {
        id: 'ts_554', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 554,
        displayName: '凭险却敌', sourceQuote: '依靠险要地势击退敌军，如吴玠和尚原等多将皆有。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_555', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 555,
        displayName: '复土摧敌', ownerName: '祖逖', ownerGeneralId: 'yuzhou_zuti', sourceQuote: '【祖逖】《晋书·祖逖传》：北伐收复失地，中流击楫。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_556', layer: 'tactical', series: 'counter', index: 556,
        displayName: '散兵袭扰', ownerName: '雍笈牙', sourceQuote: '雍笈牙专题记载',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【雍笈牙】T1精锐·三势精修·势leverage',
    },
    {
        id: 'ts_557', layer: 'tactical', series: 'casualty', index: 557,
        displayName: '笼城挫敌', ownerName: '雍笈牙', sourceQuote: '雍笈牙专题记载',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '【雍笈牙】T1精锐·三势精修·势reverse',
    },
    {
        id: 'ts_558', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 558,
        displayName: '以弱摧强', ownerName: '谢玄', sourceQuote: '【谢玄】《晋书·谢玄传》：淝水之战以寡敌众，以弱摧强。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_559', layer: 'tactical', series: 'counter', index: 559,
        displayName: '伏林截道', ownerName: '黎利', sourceQuote: '黎利专题记载',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【黎利】T1精锐·三势精修·势leverage',
    },
    {
        id: 'ts_560', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 560,
        displayName: '散众游扰', sourceQuote: '分散游击骚扰敌军，如黄巢流动作战等多将皆有。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_561', layer: 'tactical', series: 'enhance', index: 561,
        displayName: '鼓行摧阵', ownerName: '耶律阿保机', sourceQuote: '耶律阿保机专题记载',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
        note: '【耶律阿保机】T1精锐·三势精修·势create',
    },
    {
        id: 'ts_562', layer: 'tactical', series: 'counter', index: 562,
        displayName: '纵骑扰敌', ownerName: '耶律阿保机', sourceQuote: '耶律阿保机专题记载',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【耶律阿保机】T1精锐·三势精修·势leverage',
    },
    {
        id: 'ts_563', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 563,
        displayName: '据垒整众', sourceQuote: '据守营垒整顿溃散部队，如周亚夫细柳营等多将皆有。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_564', layer: 'tactical', series: 'troop', index: 564,
        displayName: '胡服摧阵', sourceQuote: '赵武灵王专题记载',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 1.1, engineStatus: 'ready',
        note: '【赵武灵王】T1精锐·三势精修·势create',
    },
    {
        id: 'ts_565', layer: 'tactical', series: 'counter', index: 565,
        displayName: '轻骑扰边', sourceQuote: '赵武灵王专题记载',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【赵武灵王】T1精锐·三势精修·势leverage',
    },
    {
        id: 'ts_566', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 566,
        displayName: '塞道遏敌', sourceQuote: '堵塞道路遏制敌军追击掩护撤退，多将皆有。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_567', layer: 'tactical', series: 'enhance', index: 567,
        displayName: '合兵摧垒', ownerName: '仆固怀恩', sourceQuote: '仆固怀恩专题记载',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
        note: '【仆固怀恩】T1精锐·三势精修·势create',
    },
    {
        id: 'ts_568', layer: 'tactical', series: 'counter', index: 568,
        displayName: '谍间离敌', ownerName: '仆固怀恩', sourceQuote: '仆固怀恩专题记载',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【仆固怀恩】T1精锐·三势精修·势leverage',
    },
    {
        id: 'ts_569', layer: 'tactical', series: 'casualty', index: 569,
        displayName: '回军断后', ownerName: '仆固怀恩', sourceQuote: '仆固怀恩专题记载',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '【仆固怀恩】T1精锐·三势精修·势reverse',
    },
    {
        id: 'ts_570', layer: 'tactical', series: 'enhance', index: 570,
        displayName: '并力摧坚', sourceQuote: '努尔哈赤专题记载',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
        note: '【努尔哈赤】T1精锐·三势精修·势create',
    },
    {
        id: 'ts_571', layer: 'tactical', series: 'casualty', index: 571,
        displayName: '减灶诱敌', ownerName: '孙膑', ownerGeneralId: 'qi_sunbin', sourceQuote: '【孙膑】马陵之战减灶诱敌，使庞涓分兵轻进。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 1.25,engineStatus: 'ready',
        note: '【努尔哈赤】T1精锐·三势精修·势leverage',
    },
    {
        id: 'ts_572', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 572,
        displayName: '据险整旅', sourceQuote: '据守险要重新整顿军队败中求存，多将皆有。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_573', layer: 'tactical', series: 'enhance', index: 573,
        displayName: '长驱摧敌', sourceQuote: '朱棣专题记载',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
        note: '【朱棣】T1精锐·三势精修·势create',
    },
    {
        id: 'ts_574', usageTag: '防御', situationTag: '均势', layer: 'tactical', series: 'fate', index: 574,
        displayName: '持重挫敌', ownerName: '廉颇', sourceQuote: '【廉颇】《史记·廉颇列传》：长平持重对峙，挫秦军锐气。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
    },
    {
        id: 'ts_575', layer: 'tactical', series: 'casualty', index: 575,
        displayName: '间道突围', sourceQuote: '朱棣专题记载',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '【朱棣】T1精锐·三势精修·势reverse',
    },
    {
        id: 'ts_576', layer: 'tactical', series: 'enhance', index: 576,
        displayName: '风卷摧阵', ownerName: '绰儿马罕', sourceQuote: '绰儿马罕专题记载',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
        note: '【绰儿马罕】T1精锐·三势精修·势create',
    },
    {
        id: 'ts_577', layer: 'tactical', series: 'counter', index: 577,
        displayName: '假道迂袭', ownerName: '绰儿马罕', sourceQuote: '绰儿马罕专题记载',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【绰儿马罕】T1精锐·三势精修·势leverage',
    },
    {
        id: 'ts_578', layer: 'tactical', series: 'casualty', index: 578,
        displayName: '散骑遏追', ownerName: '绰儿马罕', sourceQuote: '绰儿马罕专题记载',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '【绰儿马罕】T1精锐·三势精修·势reverse',
    },
    {
        id: 'ts_579', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 579,
        displayName: '奇兵斩首', ownerName: '关羽', sourceQuote: '【关羽】《三国志·关羽传》：白马之战斩颜良，奇兵斩首。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_580', layer: 'tactical', series: 'fate', index: 580,
        displayName: '诱敌夹击', sourceQuote: '织田信长专题记载',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【织田信长】T1精锐·三势精修·势leverage',
    },
    {
        id: 'ts_581', layer: 'tactical', series: 'casualty', index: 581,
        displayName: '笼城耗敌', ownerName: '织田信长', sourceQuote: '织田信长专题记载',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '【织田信长】T1精锐·三势精修·势reverse',
    },
    {
        id: 'ts_582', usageTag: '防御', situationTag: '优势', layer: 'tactical', series: 'troop', index: 582,
        displayName: '扼险摧锋',  sourceQuote: '【吴玠】《宋史·吴玠传》：和尚原扼守险要摧破金军先锋。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_583', layer: 'tactical', series: 'counter', index: 583,
        displayName: '据山遏骑', sourceQuote: '哈里辛格专题记载',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【哈里辛格】T1精锐·三势精修·势leverage',
    },
    {
        id: 'ts_584', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 584,
        displayName: '散卒扰后', sourceQuote: '派遣散兵骚扰敌军后方使其疲于应对，多将皆有。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_585', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 585,
        displayName: '鸳鸯阵摧', ownerName: '戚继光', sourceQuote: '【戚继光】《明史·戚继光传》：鸳鸯阵抗倭，以步制骑。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_586', usageTag: '防御', situationTag: '均势', layer: 'tactical', series: 'fate', index: 586,
        displayName: '叠阵疲敌', sourceQuote: '多梯队阵型轮番防御消耗敌军体力，多将皆有。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
    },
    {
        id: 'ts_587', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 587,
        displayName: '叠垒退敌', sourceQuote: '构建多层营垒逐步击退敌军，如吴玠守蜀等多将皆有。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_588', layer: 'tactical', series: 'enhance', index: 588,
        displayName: '摧锋定难', ownerName: '李晟', sourceQuote: '李晟专题记载',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
        note: '【李晟】T1精锐·三势精修·势create',
    },
    {
        id: 'ts_589', layer: 'tactical', series: 'counter', index: 589,
        displayName: '间道截粮', ownerName: '李晟', sourceQuote: '李晟专题记载',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【李晟】T1精锐·三势精修·势leverage',
    },
    {
        id: 'ts_590', layer: 'tactical', series: 'casualty', index: 590,
        displayName: '孤军死战', ownerName: '李晟', sourceQuote: '李晟专题记载',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '【李晟】T1精锐·三势精修·势reverse',
    },
    {
        id: 'ts_591', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 591,
        displayName: '摧枯破险', sourceQuote: '凭借优势兵力强行攻破险关，如秦灭六国等多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_592', layer: 'tactical', series: 'fate', index: 592,
        displayName: '假道伐交', ownerName: '司马错', sourceQuote: '司马错专题记载',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【司马错】T1精锐·三势精修·势leverage',
    },
    {
        id: 'ts_593', layer: 'tactical', series: 'casualty', index: 593,
        displayName: '据险退师', ownerName: '司马错', sourceQuote: '司马错专题记载',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.5, engineStatus: 'ready',
        note: '【司马错】T1精锐·三势精修·势reverse',
    },
    {
        id: 'ts_594', usageTag: '双行', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 594,
        displayName: '号令摧阵', ownerName: '孙武', sourceQuote: '【孙武】《史记·孙子吴起列传》：斩美姬整肃军纪，号令摧阵。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_595', layer: 'tactical', series: 'fate', index: 595,
        displayName: '纵骑疲敌', ownerName: '社仑', sourceQuote: '社仑专题记载',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【社仑】T1精锐·三势精修·势leverage',
    },
    {
        id: 'ts_596', layer: 'tactical', series: 'casualty', index: 596,
        displayName: '溃走聚众', ownerName: '社仑', sourceQuote: '社仑专题记载',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.5, engineStatus: 'ready',
        note: '【社仑】T1精锐·三势精修·势reverse',
    },
    {
        id: 'ts_597', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 597,
        displayName: '倾国摧坚', ownerName: '王翦', sourceQuote: '【王翦】《史记·白起王翦列传》：灭楚倾全国兵力，倾国摧坚。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_598', usageTag: '防御', situationTag: '均势', layer: 'tactical', series: 'fate', index: 598,
        displayName: '深垒疲敌', sourceQuote: '深沟高垒固守消耗敌军粮食与锐气，多将皆有。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
    },
    {
        id: 'ts_599', usageTag: '双行', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 599,
        displayName: '遣间离敌', ownerName: '田单', sourceQuote: '【田单】《史记·田单列传》：反间计使燕王换将乐毅，遣间离敌。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_600', layer: 'tactical', series: 'enhance', index: 600,
        displayName: '突骑摧阵', ownerName: '桑贾尔', sourceQuote: '桑贾尔专题记载',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
        note: '【桑贾尔】T1精锐·三势精修·势create',
    },
    {
        id: 'ts_601', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 601,
        displayName: '分道夹截', sourceQuote: '多路分进合击，如韩信井陉之战等多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05,engineStatus: 'ready',
    },
    {
        id: 'ts_602', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 602,
        displayName: '据垒耗敌', sourceQuote: '据守营垒消耗敌军为反击创造机会，多将皆有。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_603', layer: 'tactical', series: 'enhance', index: 603,
        displayName: '不战屈敌', ownerName: '王忠嗣', sourceQuote: '王忠嗣专题记载',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.09, engineStatus: 'ready',
        note: '【王忠嗣】T1精锐·三势精修·势create',
    },
    {
        id: 'ts_604', layer: 'tactical', series: 'fate', index: 604,
        displayName: '持重俟机', ownerName: '王忠嗣', sourceQuote: '王忠嗣专题记载',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【王忠嗣】T1精锐·三势精修·势leverage',
    },
    {
        id: 'ts_605', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 605,
        displayName: '塞道遏锋', sourceQuote: '阻塞道路遏制敌军先锋突进，多将皆有。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
];

// ── T1 精锐·泛区名将(第三批) ──────────────
const UNIQUE_T1_GENERAL3: TacticalSkillEntry[] = [
    {
        id: 'ts_606', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 606,
        displayName: '鸦军突陷', ownerName: '李克用', sourceQuote: '【李克用】《旧五代史·武皇纪》：沙陀鸦儿军冲锋陷阵。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_607', layer: 'tactical', series: 'counter', index: 607,
        displayName: '诱锋合击', ownerName: '李克用', sourceQuote: '《史传》李克用：诱朱温孤军冒进伏兵夹击',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【李克用】T1精锐·三势精修·势create·均',
    },
    {
        id: 'ts_608', layer: 'tactical', series: 'casualty', index: 608,
        displayName: '聚溃断后', ownerName: '李克用', sourceQuote: '《史传》李克用：沙陀军被围聚拢溃兵断后保全主力',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.5, engineStatus: 'ready',
        note: '【李克用】T1精锐·三势精修·势create·劣',
    },
    {
        id: 'ts_609', layer: 'tactical', series: 'enhance', index: 609,
        displayName: '义旗摧阵', ownerName: '张议潮', sourceQuote: '《史传》张议潮：归义军起义连克瓜沙驱逐吐蕃',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
        note: '【张议潮】T1精锐·三势精修·势create·优',
    },
    {
        id: 'ts_610', layer: 'tactical', series: 'counter', index: 610,
        displayName: '间道扰敌', ownerName: '张议潮', sourceQuote: '《史传》张议潮：轻骑抄小路袭吐蕃粮道使其退',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【张议潮】T1精锐·三势精修·势create·均',
    },
    {
        id: 'ts_611', layer: 'tactical', series: 'casualty', index: 611,
        displayName: '婴城挫锐', ownerName: '张议潮', sourceQuote: '《史传》张议潮：据城固守滚木礌石杀伤吐蕃迫其撤围',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '【张议潮】T1精锐·三势精修·势create·劣',
    },
    {
        id: 'ts_612', layer: 'tactical', series: 'enhance', index: 612,
        displayName: '驱象破阵', ownerName: '纳黎萱', sourceQuote: '《史传》纳黎萱：乘战象冲入缅军中军践踏敌阵',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
        note: '【纳黎萱】T1精锐·三势精修·势create·优',
    },
    {
        id: 'ts_613', layer: 'tactical', series: 'fate', index: 613,
        displayName: '林沼伏击', ownerName: '纳黎萱', sourceQuote: '《史传》纳黎萱：丛林沼泽设伏待缅军半渡而击',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【纳黎萱】T1精锐·三势精修·势create·均',
    },
    {
        id: 'ts_614', layer: 'tactical', series: 'casualty', index: 614,
        displayName: '逆锋断后', ownerName: '纳黎萱', sourceQuote: '《史传》纳黎萱：皇家象兵断后逆击追兵掩护主力',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '【纳黎萱】T1精锐·三势精修·势create·劣',
    },
    {
        id: 'ts_615', layer: 'tactical', series: 'enhance', index: 615,
        displayName: '席卷奔突', sourceQuote: '《史传》松赞干布：骑兵席卷驰突连破苏毗羊同',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
        note: '【松赞干布】T1精锐·三势精修·势create·优',
    },
    {
        id: 'ts_616', layer: 'tactical', series: 'counter', index: 616,
        displayName: '诱敌设伏', ownerName: '松赞干布', sourceQuote: '《史传》松赞干布：诱吐谷浑入山谷伏兵尽出',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【松赞干布】T1精锐·三势精修·势create·均',
    },
    {
        id: 'ts_617', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 617,
        displayName: '据山遏敌', sourceQuote: '占据山地遏制敌军进攻，多将皆有。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_618', layer: 'tactical', series: 'enhance', index: 618,
        displayName: '勒骑摧阵', sourceQuote: '《史传》阿史那土门：勒兵列阵冲锋大破柔然主力',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
        note: '【阿史那土门】T1精锐·三势精修·势create·优',
    },
    {
        id: 'ts_619', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 619,
        displayName: '分道合击', sourceQuote: '多路分进最终汇合总攻，如蒙古三路攻金等多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05,engineStatus: 'ready',
    },
    {
        id: 'ts_620', layer: 'tactical', series: 'casualty', index: 620,
        displayName: '远遁保众', sourceQuote: '《史传》阿史那土门：遭柔然围剿远遁金山保全部众',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.5, engineStatus: 'ready',
        note: '【阿史那土门】T1精锐·三势精修·势create·劣',
    },
    {
        id: 'ts_621', layer: 'tactical', series: 'enhance', index: 621,
        displayName: '长驱破垒', ownerName: '俺答', sourceQuote: '《史传》俺答汗：土默特骑兵长驱破边墙直逼北京',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
        note: '【俺答汗】T1精锐·三势精修·势create·优',
    },
    {
        id: 'ts_622', layer: 'tactical', series: 'counter', index: 622,
        displayName: '纵骑袭扰', ownerName: '俺答', sourceQuote: '《史传》俺答汗：轻骑骚扰明军哨所粮道',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【俺答汗】T1精锐·三势精修·势create·均',
    },
    {
        id: 'ts_623', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 623,
        displayName: '佯北诈截', ownerName: '冒顿', sourceQuote: '【冒顿】《史记·匈奴列传》：白登之围前佯败诱汉军。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_624', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 624,
        displayName: '乘虚捣隙', sourceQuote: '趁敌军防线空虚突入扩大战果，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_625', layer: 'tactical', series: 'counter', index: 625,
        displayName: '迂道夹截', ownerName: '也先', sourceQuote: '《史传》也先：偏师迂回敌侧后与正面夹击鞑靼',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【也先】T1精锐·三势精修·势create·均',
    },
    {
        id: 'ts_626', layer: 'tactical', series: 'casualty', index: 626,
        displayName: '断后整旅', ownerName: '也先', sourceQuote: '《史传》也先：土木堡后断后收拢部队撤回草原',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.5, engineStatus: 'ready',
        note: '【也先】T1精锐·三势精修·势create·劣',
    },
    {
        id: 'ts_627', layer: 'tactical', series: 'enhance', index: 627,
        displayName: '摧军擒酋', sourceQuote: '《史传》苏定方：精骑直冲西突厥牙帐擒沙钵罗',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
        note: '【苏定方】T1精锐·三势精修·势create·优',
    },
    {
        id: 'ts_628', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 628,
        displayName: '间道奇袭', ownerName: '邓艾', sourceQuote: '【邓艾】《三国志·邓艾传》：偷渡阴平小道灭蜀，间道奇袭。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25,engineStatus: 'ready',
    },
    {
        id: 'ts_629', layer: 'tactical', series: 'casualty', index: 629,
        displayName: '背水死战', sourceQuote: '《史传》苏定方：被围河边背水列阵激励死战破敌',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '【苏定方】T1精锐·三势精修·势create·劣',
    },
    {
        id: 'ts_630', usageTag: '防御', situationTag: '优势', layer: 'tactical', series: 'troop', index: 630,
        displayName: '凭险歼锐',  sourceQuote: '【吴玠】《宋史·吴玠传》：和尚原据险大破金军精锐。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_631', layer: 'tactical', series: 'counter', index: 631,
        displayName: '纵间离敌', sourceQuote: '《史传》韦皋：间谍离间吐蕃南诏使联盟破裂',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【韦皋】T1精锐·三势精修·势create·均',
    },
    {
        id: 'ts_632', usageTag: '防御', situationTag: '均势', layer: 'tactical', series: 'counter', index: 632,
        displayName: '闭垒疲敌', ownerName: '司马懿', ownerGeneralId: 'wei_simayi', sourceQuote: '【司马懿】《晋书·宣帝纪》：对蜀闭垒不出，消耗蜀军。',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 1, engineStatus: 'ready',
    },
    {
        id: 'ts_633', usageTag: '双行', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 633,
        displayName: '庙算先胜', ownerName: '孙武', sourceQuote: '【孙武】《孙子兵法·计篇》：夫未战而庙算胜者，得算多也。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_634', layer: 'tactical', series: 'fate', index: 634,
        displayName: '因形用兵', sourceQuote: '《史传》孙武：兵无常势因敌变阵扰敌部署',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【孙武】T1精锐·三势精修·势create·均',
    },
    {
        id: 'ts_635', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 635,
        displayName: '示弱骄敌', ownerName: '冒顿', sourceQuote: '【冒顿】《史记·匈奴列传》：示弱于东胡，使其骄纵后击灭。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_636', layer: 'tactical', series: 'enhance', index: 636,
        displayName: '席卷摧坚', ownerName: '速不台', sourceQuote: '《史传》速不台：蒙古铁骑席卷钦察斡罗斯破联军',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
        note: '【速不台】T1精锐·三势精修·势create·优',
    },
    {
        id: 'ts_637', layer: 'tactical', series: 'counter', index: 637,
        displayName: '假道潜袭', ownerName: '速不台', sourceQuote: '《史传》速不台：假道西夏迂回金国后方突袭',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【速不台】T1精锐·三势精修·势create·均',
    },
    {
        id: 'ts_638', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 638,
        displayName: '佯北设伏', sourceQuote: '假装败退引诱敌军进入伏击圈，多将皆有。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_639', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 639,
        displayName: '巧袭夺城', sourceQuote: '以巧计突袭夺取城池，如李愬雪夜入蔡州等多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_640', usageTag: '双行', situationTag: '均势', layer: 'tactical', series: 'fate', index: 640,
        displayName: '伪病懈敌', ownerName: '司马懿', ownerGeneralId: 'wei_simayi', sourceQuote: '【司马懿】《晋书·宣帝纪》：诈病骗曹爽，使其松懈后夺权。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
    },
    {
        id: 'ts_641', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 641,
        displayName: '固垒御敌', sourceQuote: '加固营垒抵御敌军进攻，多守将皆有此战法。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_642', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 642,
        displayName: '袭帐破阵', ownerName: '李靖', sourceQuote: '【李靖】《旧唐书·李靖传》：趁夜袭破颉利可汗牙帐。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_643', layer: 'tactical', series: 'counter', index: 643,
        displayName: '纵骑扰境', ownerName: '阿热', sourceQuote: '《史传》阿热：轻骑骚扰回鹘边境部落',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【阿热】T1精锐·三势精修·势create·均',
    },
    {
        id: 'ts_644', layer: 'tactical', series: 'casualty', index: 644,
        displayName: '间道远遁', ownerName: '阿热', sourceQuote: '《史传》阿热：回鹘反扑远遁剑河上游保存实力',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.5, engineStatus: 'ready',
        note: '【阿热】T1精锐·三势精修·势create·劣',
    },
    {
        id: 'ts_645', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 645,
        displayName: '以寡破盟', ownerName: '项羽', sourceQuote: '【项羽】《史记·项羽本纪》：巨鹿之战以少胜多破诸侯联军。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_646', layer: 'tactical', series: 'counter', index: 646,
        displayName: '间使间敌', sourceQuote: '《史传》耶律大石：遣使离间西域各部与塞尔柱',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【耶律大石】T1精锐·三势精修·势create·均',
    },
    {
        id: 'ts_647', usageTag: '双行', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 647,
        displayName: '收残再起', ownerName: '刘备', sourceQuote: '【刘备】《三国志·先主传》：屡败屡战，收拾残兵东山再起。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_648', layer: 'tactical', series: 'enhance', index: 648,
        displayName: '鸣镝摧阵', ownerName: '冒顿', sourceQuote: '【冒顿】《史记·匈奴列传》：鸣镝所向，骑兵摧阵',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
        note: '【冒顿】T1精锐·三势精修·势create·优',
    },
    {
        id: 'ts_649', layer: 'tactical', series: 'fate', index: 649,
        displayName: '诱敌示弱', ownerName: '冒顿', sourceQuote: '《史传》冒顿：示弱献马阏氏使东胡骄纵后突袭',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【冒顿】T1精锐·三势精修·势create·均',
    },
    {
        id: 'ts_650', usageTag: '防御', situationTag: '均势', layer: 'tactical', series: 'fate', index: 650,
        displayName: '退避骄敌', sourceQuote: '主动退避使敌产生骄慢之心，然后击之，多将皆有。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_651', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 651,
        displayName: '虎穴夺机', ownerName: '班超', sourceQuote: '【班超】《后汉书·班超传》：不入虎穴，焉得虎子。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_652', layer: 'tactical', series: 'counter', index: 652,
        displayName: '纵火乱敌', sourceQuote: '《史传》班超：于阗趁夜纵火扰乱趁乱攻杀',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【班超】T1精锐·三势精修·势create·均',
    },
    {
        id: 'ts_653', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 653,
        displayName: '坚壁挫敌', ownerName: '廉颇', sourceQuote: '【廉颇】《史记·廉颇列传》：长平之战坚壁挫秦军锐气。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_654', layer: 'tactical', series: 'enhance', index: 654,
        displayName: '廓清摧坚', sourceQuote: '《史传》徐达：北伐连克山东河南直捣大都',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
        note: '【徐达】T1精锐·三势精修·势create·优',
    },
    {
        id: 'ts_655', usageTag: '防御', situationTag: '优势', layer: 'tactical', series: 'troop', index: 655,
        displayName: '持重耗敌', ownerName: '司马懿', ownerGeneralId: 'wei_simayi', sourceQuote: '【司马懿】《晋书·宣帝纪》：对蜀持重相持，消耗蜀军粮草。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05,engineStatus: 'ready',
    },
    {
        id: 'ts_656', layer: 'tactical', series: 'casualty', index: 656,
        displayName: '间道脱围', sourceQuote: '《史传》徐达：被元军围困夜从间道突围撤退',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.5, engineStatus: 'ready',
        note: '【徐达】T1精锐·三势精修·势create·劣',
    },
    {
        id: 'ts_657', layer: 'tactical', series: 'enhance', index: 657,
        displayName: '连城横扫', sourceQuote: '《史传》乐毅：燕军攻齐连下七十余城',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
        note: '【乐毅】T1精锐·三势精修·势create·优',
    },
    {
        id: 'ts_658', layer: 'tactical', series: 'fate', index: 658,
        displayName: '分兵疲敌', sourceQuote: '《史传》乐毅：齐地分兵略地使齐军疲于防守',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【乐毅】T1精锐·三势精修·势create·均',
    },
    {
        id: 'ts_659', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 659,
        displayName: '缓攻懈敌', sourceQuote: '放缓进攻节奏，使敌松懈后再突发制人，多将皆有。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_660', layer: 'tactical', series: 'enhance', index: 660,
        displayName: '乘胜逐北', sourceQuote: '《史传》耶律休哥：高粱河大败宋军乘胜追奔逐北',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
        note: '【耶律休哥】T1精锐·三势精修·势create·优',
    },
    {
        id: 'ts_661', layer: 'tactical', series: 'counter', index: 661,
        displayName: '伏隘截击', ownerName: '耶律休哥', sourceQuote: '《史传》耶律休哥：险要处设伏待宋军通过截击',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【耶律休哥】T1精锐·三势精修·势create·均',
    },
    {
        id: 'ts_662', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 662,
        displayName: '深垒耗锐', ownerName: '廉颇', sourceQuote: '【廉颇】《史记·廉颇列传》：深沟高垒，消耗秦军锐气。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_663', layer: 'tactical', series: 'enhance', index: 663,
        displayName: '铁骑陷阵', sourceQuote: '《史传》慕容皝：前燕铁骑驰突破阵大败宇文部',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
        note: '【慕容皝】T1精锐·三势精修·势create·优',
    },
    {
        id: 'ts_664', layer: 'tactical', series: 'counter', index: 664,
        displayName: '设伏两击', ownerName: '慕容皝', sourceQuote: '《史传》慕容皝：设伏山谷诱段部入伏两面夹击',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【慕容皝】T1精锐·三势精修·势create·均',
    },
    {
        id: 'ts_665', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 665,
        displayName: '据险却敌', sourceQuote: '依靠险要地势击退敌军进攻，多将皆有。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_666', layer: 'tactical', series: 'enhance', index: 666,
        displayName: '摧坚擒酋', ownerName: '完颜娄室', sourceQuote: '《史传》完颜娄室：精骑直冲辽天祚帝中军擒辽帝',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
        note: '【完颜娄室】T1精锐·三势精修·势create·优',
    },
    {
        id: 'ts_667', layer: 'tactical', series: 'fate', index: 667,
        displayName: '诱敌调兵', ownerName: '完颜娄室', sourceQuote: '《史传》完颜娄室：佯攻一处诱宋军分兵趁机取城',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【完颜娄室】T1精锐·三势精修·势create·均',
    },
    {
        id: 'ts_668', layer: 'tactical', series: 'casualty', index: 668,
        displayName: '严垒遏溃', ownerName: '完颜娄室', sourceQuote: '《史传》完颜娄室：金军溃退据守营垒收拢反击',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.5, engineStatus: 'ready',
        note: '【完颜娄室】T1精锐·三势精修·势create·劣',
    },
    {
        id: 'ts_669', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 669,
        displayName: '励志克城', ownerName: '耿弇', sourceQuote: '【耿弇】《后汉书·耿弇传》：激励将士，攻克强敌。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_670', layer: 'tactical', series: 'fate', index: 670,
        displayName: '持重候隙', ownerName: '耿弇', sourceQuote: '《史传》耿弇：与张步对峙坚守待粮尽追击',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【耿弇】T1精锐·三势精修·势create·均',
    },
    {
        id: 'ts_671', layer: 'tactical', series: 'casualty', index: 671,
        displayName: '溃围求援', ownerName: '耿弇', sourceQuote: '《史传》耿弇：被围夜突围求援引援军解围',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '【耿弇】T1精锐·三势精修·势create·劣',
    },
    {
        id: 'ts_672', layer: 'tactical', series: 'enhance', index: 672,
        displayName: '鹰扬破阵', sourceQuote: '《史传》姬发：牧野虎贲三千冲锋纣军倒戈',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
        note: '【姬发】T1精锐·三势精修·势create·优',
    },
    {
        id: 'ts_673', layer: 'tactical', series: 'fate', index: 673,
        displayName: '盟誓合兵', sourceQuote: '《史传》姬发：孟津会盟八百诸侯壮大削商',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【姬发】T1精锐·三势精修·势create·均',
    },
    {
        id: 'ts_674', layer: 'tactical', series: 'casualty', index: 674,
        displayName: '据垒待援', ownerName: '姬发', sourceQuote: '《史传》姬发：伐纣前被商军围据盟津待诸侯援',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.5, engineStatus: 'ready',
        note: '【姬发】T1精锐·三势精修·势create·劣',
    },
    {
        id: 'ts_675', usageTag: '防御', situationTag: '优势', layer: 'tactical', series: 'troop', index: 675,
        displayName: '凭坚歼锋', ownerName: '袁崇焕', sourceQuote: '【袁崇焕】《明史·袁崇焕传》：宁远之战凭坚城歼敌先锋。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_676', layer: 'tactical', series: 'fate', index: 676,
        displayName: '塞道遏骑', ownerName: '袁崇焕', sourceQuote: '《史传》袁崇焕：锦州筑堡塞后金骑兵进攻道路',
        baseEffect: 'steal_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 0.5, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【袁崇焕】T1精锐·三势精修·势create·均',
    },
    {
        id: 'ts_677', layer: 'tactical', series: 'casualty', index: 677,
        displayName: '死士突摧', ownerName: '田单', sourceQuote: '【田单】即墨死士火牛阵突摧燕军',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '【袁崇焕】T1精锐·三势精修·势create·劣',
    },
];

// ── 精锐名将收口(宇文泰/帖木儿/石达开) ──────────────
const UNIQUE_T1_TAIL: TacticalSkillEntry[] = [
    {
        id: 'ts_678', layer: 'tactical', series: 'enhance', index: 678,
        displayName: '府兵摧锋', sourceQuote: '宇文泰创府兵制，练关陇精兵，正面摧敌锋锐。《周书·文帝纪》',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
        note: '【宇文泰】T0/T1精锐·三势精修·势create·优',
    },
    {
        id: 'ts_679', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 679,
        displayName: '分军迭进', sourceQuote: '分军多路轮番进攻，使敌疲于应付，多将皆用。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05,engineStatus: 'ready',
    },
    {
        id: 'ts_680', layer: 'tactical', series: 'enhance', index: 680,
        displayName: '铁骑横扫', ownerName: '帖木儿', sourceQuote: '西征波斯，铁骑横扫敌阵，数日连破数城。《帖木儿武功记》',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.1, engineStatus: 'ready',
        note: '【帖木儿】T0/T1精锐·三势精修·势create·优',
    },
    {
        id: 'ts_681', layer: 'tactical', series: 'fate', index: 681,
        displayName: '佯退伏截', ownerName: '帖木儿', sourceQuote: '与脱脱迷失战，佯退诱追，伏兵截其归路。《帖木儿武功记》',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3,engineStatus: 'ready',
        note: '【帖木儿】T0/T1精锐·三势精修·势create·均',
    },
    {
        id: 'ts_682', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 682,
        displayName: '严阵挫锐', sourceQuote: '以严整的阵型挫败敌军锐气，多将皆用。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_683', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 683,
        displayName: '出奇袭虚', ownerName: '韩信', sourceQuote: '【韩信】《史记·淮阴侯列传》：暗度陈仓，出奇袭虚。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_684', layer: 'tactical', series: 'counter', index: 684,
        displayName: '谷伏截道', sourceQuote: '山谷设伏，待湘军入圈截断首尾，分割歼之。《太平天国野史》',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【石达开】T0/T1精锐·三势精修·势create·均',
    },
    {
        id: 'ts_685', layer: 'tactical', series: 'casualty', index: 685,
        displayName: '流军游扰', sourceQuote: '天京变后远征，流动游走各省，使清军疲于奔命。《太平天国野史》',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.5, engineStatus: 'ready',
        note: '【石达开】T0/T1精锐·三势精修·势create·劣',
    },
];

// ── 三十六计补充（36 计 · 六套 × 效果，共享池） ──────────────
const SANSHILIU: TacticalSkillEntry[] = [
    {
        id: 'ts_389', usageTag: '双行', situationTag: '优势', layer: 'tactical', series: 'troop', index: 389,
        displayName: '瞒天过海', ownerName: '太史慈', sourceQuote: '三十六计之一，示假隐真，如太史慈突围等多将皆有。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
    },
    {
        id: 'ts_390', layer: 'tactical', series: 'troop', index: 390,
        displayName: '围点打援', sourceQuote: '【三十六计】围魏救赵，攻其必救，围点打援。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
        note: '【胜战计·全】孙膑；三十六计补充',
    },
    {
        id: 'ts_391', layer: 'tactical', series: 'troop', index: 391,
        displayName: '借刀杀人', sourceQuote: '【三十六计】利用矛盾借敌之手除患，借刀杀人。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
        note: '【胜战计·全】曹操；三十六计补充',
    },
    {
        id: 'ts_392', layer: 'tactical', series: 'troop', index: 392,
        displayName: '趁火打劫', ownerName: '孙策', sourceQuote: '《三国志·孙策传》：欲趁官渡相持袭许昌挟帝，未行而遇刺。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.05, engineStatus: 'ready',
        note: '【胜战计·全】孙策；三十六计补充',
    },
    {
        id: 'ts_393', layer: 'tactical', series: 'fate', index: 393,
        displayName: '无中生有', ownerName: '檀道济', sourceQuote: '《南史·檀道济传》：唱筹量沙，全军而反，魏人不敢逼。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready',
        note: '【敌战计·衡】檀道济；三十六计补充',
    },
    {
        id: 'ts_394', usageTag: '双行', situationTag: '均势', layer: 'tactical', series: 'fate', index: 394,
        displayName: '隔岸观火', ownerName: '曹操', sourceQuote: '【曹操】观袁尚袁谭相争，坐收渔利，隔岸观火。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_395', layer: 'tactical', series: 'fate', index: 395,
        displayName: '笑里藏刀', ownerName: '商鞅', sourceQuote: '《史记·商君列传》：致书公子卬约盟，饮而伏甲掳之，遂破魏。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready',
        note: '【敌战计·衡】商鞅；三十六计补充',
    },
    {
        id: 'ts_396', usageTag: '防御', situationTag: '均势', layer: 'tactical', series: 'fate', index: 396,
        displayName: '李代桃僵', sourceQuote: '三十六计之敌战计，舍小保大，均势时用，多将皆有。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_397', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'fate', index: 397,
        displayName: '顺手牵羊', sourceQuote: '三十六计之敌战计，乘隙得利，均势可用，多将皆有。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_398', layer: 'tactical', series: 'enhance', index: 398,
        displayName: '打草惊蛇', ownerName: '周亚夫', sourceQuote: '《汉书·周亚夫传》：遣轻骑绝吴楚粮道，惊动叛军，乱其部署。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
        note: '【攻战计·机】周亚夫；三十六计补充',
    },
    {
        id: 'ts_399', usageTag: '双行', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 399,
        displayName: '借尸还魂', ownerName: '刘备', sourceQuote: '【刘备】借荆州为基业，借尸还魂之策，劣势翻盘。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_400', layer: 'tactical', series: 'enhance', index: 400,
        displayName: '调虎离山', ownerName: '虞诩', sourceQuote: '《后汉书·虞诩传》：扬言援军已到，诱羌分兵，乘隙突围增灶示强。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
        note: '【攻战计·机】虞诩；三十六计补充',
    },
    {
        id: 'ts_401', layer: 'tactical', series: 'enhance', index: 401,
        displayName: '欲擒故纵', ownerName: '诸葛亮', sourceQuote: '《华阳国志》：七纵七禽，南人不复反。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
        note: '【攻战计·机】诸葛亮；三十六计补充',
    },
    {
        id: 'ts_402', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 402,
        displayName: '抛砖引玉', sourceQuote: '三十六计之攻战计，以利诱敌，优势时用，多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_403', layer: 'tactical', series: 'counter', index: 403,
        displayName: '釜底抽薪', ownerName: '李世民', sourceQuote: '《旧唐书·太宗纪》：浅水原相持，绝薛军粮道，待其溃而铁骑突击灭西秦。',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 0.25, engineStatus: 'ready',
        note: '【混战计·乱】李世民；三十六计补充',
    },
    {
        id: 'ts_404', layer: 'tactical', series: 'counter', index: 404,
        displayName: '浑水摸鱼', ownerName: '李靖', sourceQuote: '《旧唐书·李靖传》：趁秋水暴涨，萧铣不备，舰队直捣江陵灭南梁。',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 0.25, engineStatus: 'ready',
        note: '【混战计·乱】李靖；三十六计补充',
    },
    {
        id: 'ts_405', usageTag: '防御', situationTag: '均势', layer: 'tactical', series: 'counter', index: 405,
        displayName: '金蝉脱壳', sourceQuote: '三十六计之混战计，均势时脱身之计，多将皆有。',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 0.25, engineStatus: 'ready',
    },
    {
        id: 'ts_406', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'counter', index: 406,
        displayName: '关门捉贼', sourceQuote: '三十六计之混战计，优势时围歼小敌，多将皆有。',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 0.25, engineStatus: 'ready',
    },
    {
        id: 'ts_407', layer: 'tactical', series: 'counter', index: 407,
        displayName: '远交近攻', sourceQuote: '《史记·赵世家》：盟秦韩宋，专力攻中山，终灭之。',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 0.25, engineStatus: 'ready',
        note: '【混战计·乱】赵武灵王；三十六计补充',
    },
    {
        id: 'ts_408', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'counter', index: 408,
        displayName: '假道伐虢', sourceQuote: '三十六计之混战计，借路灭国，优势计，多将皆有。',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 0.25, engineStatus: 'ready',
    },
    {
        id: 'ts_409', usageTag: '双行', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 409,
        displayName: '偷梁换柱', sourceQuote: '三十六计之并战计，暗中替换，劣势时用，多将皆有。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_410', usageTag: '双行', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 410,
        displayName: '客反为主', sourceQuote: '三十六计之并战计，变被动为主动，劣势时用，多将皆有。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_411', usageTag: '双行', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 411,
        displayName: '指桑骂槐', ownerName: '孙武', sourceQuote: '【孙武】《史记·孙子吴起列传》：斩美姬整肃军纪，指桑骂槐立威。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_412', layer: 'tactical', series: 'casualty', index: 412,
        displayName: '假痴不癫', ownerName: '刘备', sourceQuote: '《三国志·先主传》：种菜灌园，闻雷失箸，曹操不疑。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
        note: '【并战计·借】刘备；三十六计补充',
    },
    {
        id: 'ts_413', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 413,
        displayName: '上屋抽梯', sourceQuote: '诱敌深入后断其退路，如刘琦求计、背水诱敌等多将皆有。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_414', usageTag: '双行', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 414,
        displayName: '树上开花', sourceQuote: '《三十六计》：借局布势力小势大，虚张声势。通用计策。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_415', layer: 'tactical', series: 'casualty', index: 415,
        displayName: '美人离间', sourceQuote: '【三十六计】以倾城之色消磨敌将意志，美人计。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '【败战计·险】勾践；三十六计补充',
    },
    {
        id: 'ts_416', usageTag: '双行', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 416,
        displayName: '反间除帅', ownerName: '田单', sourceQuote: '【田单】《史记·田单列传》：反间计使燕惠王换将，乐毅去而骑劫来。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_417', layer: 'tactical', series: 'casualty', index: 417,
        displayName: '苦肉诈降', sourceQuote: '《三国志·周瑜传》：瑜笞盖，诈降，火攻赤壁。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.25, engineStatus: 'ready',
        note: '【败战计·险】黄盖；三十六计补充',
    },
    {
        id: 'ts_418', usageTag: '双行', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 418,
        displayName: '连环离间', ownerName: '王允', sourceQuote: '【王允】《后汉书·王允传》：连环计结吕布诛董卓。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_419', layer: 'tactical', series: 'casualty', index: 419,
        displayName: '全师而退', ownerName: '刘邦', sourceQuote: '《史记·项羽本纪》：沛公起如厕，间道走霸上。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.25, engineStatus: 'ready',
        note: '【败战计·险】刘邦；三十六计补充',
    },
];

// ── T0 精锐·名将专属技（三势精修） ──────────────
const UNIQUE_T0_REVISE: TacticalSkillEntry[] = [
    {
        id: 'ts_420', layer: 'tactical', series: 'fate', index: 420,
        displayName: '散阵遏骑', sourceQuote: '《宋史·岳飞传》：步卒麻扎刀入阵，砍拐子马足，金军大乱。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready',
        note: '【岳飞】T0精锐·岳飞·势create·均局专属（三势精修）',
    },
    {
        id: 'ts_421', usageTag: '防御', situationTag: '均势', layer: 'tactical', series: 'counter', index: 421,
        displayName: '空寨掩击', ownerName: '赵云', ownerGeneralId: 'jingmen_zhaoyun', sourceQuote: '【赵云】《云别传》：汉水空营偃旗息鼓，空寨掩击退曹军。',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'post_battle',
        magnitude: 1, engineStatus: 'ready',
    },
    {
        id: 'ts_422', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 422,
        displayName: '弃辎突袭', sourceQuote: '弃辎重轻装突袭，如项羽破釜沉舟等多将皆有此勇。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_423', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 423,
        displayName: '散骑溃阵', sourceQuote: '骑兵分散突击冲垮敌阵，蒙古骑兵等游牧战术常用。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_424', layer: 'tactical', series: 'enhance', index: 424,
        displayName: '囊沙壅流', sourceQuote: '《史记·淮阴侯列传》：万只沙囊壅潍水，待楚军半渡决囊截击。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 0.09, engineStatus: 'ready',
        note: '【韩信】T0精锐·韩信·势reverse·均局专属（三势精修）',
    },
    {
        id: 'ts_425', layer: 'tactical', series: 'fate', index: 425,
        displayName: '拔帜易帜', sourceQuote: '《史记·淮阴侯列传》：遣二千骑入赵壁，拔赵帜立汉赤帜，赵军溃。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready',
        note: '【韩信】T0精锐·韩信·势reverse·均局专属（三势精修；原劣局技，改 luck_variance_enemy 后归均势）',
    },
    {
        id: 'ts_426', layer: 'tactical', series: 'casualty', index: 426,
        displayName: '晨驰摧阵', situationTag: '劣势', ownerName: '项羽', ownerGeneralId: 'xichu_xiangyu', sourceQuote: '《史记·项羽本纪》：三万精骑晨驰破彭城五十六万联军，睢水不流。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
        note: '【项羽】T0精锐·项羽·势reverse·均局专属（三势精修）',
    },
    {
        id: 'ts_427', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 427,
        displayName: '溃围断后', sourceQuote: '突围时留兵断后掩护主力撤退，多将皆有此战法。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_428', layer: 'tactical', series: 'fate', index: 428,
        displayName: '诱锋夹击', ownerName: '孙膑', ownerGeneralId: 'qi_sunbin', sourceQuote: '诱庞涓前锋深入，设伏夹截大破魏军。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready',
        note: '【吴起】T0精锐·吴起·势create·均局专属（三势精修）',
    },
    {
        id: 'ts_429', layer: 'tactical', series: 'casualty', index: 429,
        displayName: '死士断喉', sourceQuote: '《史记·孙子吴起列传》：被箭伏王尸上，叛军射尸触法被族灭七十余。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '【吴起】T0精锐·吴起·势create·劣局专属（三势精修）',
    },

    {
        id: 'ts_430', usageTag: '防御', situationTag: '均势', layer: 'tactical', series: 'troop', index: 430,
        displayName: '阵遏锋摧', ownerName: '刘裕', sourceQuote: '【刘裕】《宋书·武帝纪》：却月阵以步制骑，大破北魏铁骑。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_431', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 431,
        displayName: '溃军反扼', sourceQuote: '败退中反身扼守绝境逆袭，多将皆有此勇。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_432', layer: 'tactical', series: 'enhance', index: 432,
        displayName: '收郡疲敌',  ownerGeneralId: 'huizhou_zhugeliang', sourceQuote: '【诸葛亮】平定南中收服诸郡，疲弊敌军。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.055, phase: 'pre_opening_troops', series: 'troop', engineStatus: 'ready',
        note: '【刘秀】T0精锐·reverse·势均局专属（三势精修）',
    },
    {
        id: 'ts_433', layer: 'tactical', series: 'casualty', index: 433,
        displayName: '溃围突冲', ownerName: '张辽', sourceQuote: '【张辽】《三国志》：合肥八百人溃围突冲孙权大营',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '【刘秀】T0精锐·reverse·势劣局专属（三势精修）',
    },
    {
        id: 'ts_434', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 434,
        displayName: '白袍摧阵', ownerName: '陈庆之', sourceQuote: '【陈庆之】《梁书·陈庆之传》：七千白袍横扫中原，以少打多攻克洛阳。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_435', layer: 'tactical', series: 'casualty', index: 435,
        displayName: '绝粮伺击', ownerName: '李世民', sourceQuote: '《旧唐书·太宗本纪》：深沟高垒断薛仁杲粮道，待其饥疲一鼓破之。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '【李世民】T0精锐·create·势劣局专属（三势精修）',
    },
    {
        id: 'ts_436', layer: 'tactical', series: 'fate', index: 436,
        displayName: '纵舟乱阵', ownerName: '黄盖', sourceQuote: '【黄盖】《三国志·周瑜传》：赤壁纵火船冲乱曹军水阵',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready',
        note: '【李靖】T0精锐·create·势均局专属（三势精修）',
    },
    {
        id: 'ts_437', layer: 'tactical', series: 'casualty', index: 437,
        displayName: '佯败诱截', ownerName: '李靖', sourceQuote: '《旧唐书·李靖传》：佯败诱颉利追击，伏兵截归路大破突厥。',
        baseEffect: 'nullify_enemy_opening_cut', condition: 'always', phase: 'post_battle',
        magnitude: 0.09, engineStatus: 'ready',
        note: '【李靖】T0精锐·create·势劣局专属（三势精修）',
    },
    {
        id: 'ts_438', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'troop', index: 438,
        displayName: '鹤翼散击', sourceQuote: '鹤翼阵分击合围，散击包抄，如李牧等多国常用。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_439', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'troop', index: 439,
        displayName: '潮截归路', ownerName: '村上武吉', sourceQuote: '【村上武吉】日本村上水军利用潮汐截断敌船归路。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_440', layer: 'tactical', series: 'enhance', index: 440,
        displayName: '风涛火攻', ownerName: '黄盖', sourceQuote: '【黄盖】赤壁之战乘风纵火，伏兵遏击曹军水师。',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【陈国峻】T0精锐·reverse·势均局专属（三势精修）',
    },
    {
        id: 'ts_441', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'troop', index: 441,
        displayName: '散舟火扰', sourceQuote: '火船分散冲击扰乱敌水阵，如鄱阳湖等多有水战用此。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_442', layer: 'tactical', series: 'enhance', index: 442,
        displayName: '凿道迂摧', ownerName: '木华黎', sourceQuote: '《元史·太祖本纪》：野狐岭正面佯攻，木华黎山间凿道迂回侧后。',
        baseEffect: 'steal_enemy_skill', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.167, engineStatus: 'ready',
        note: '【成吉思汗】T0精锐·create·势优局专属（三势精修）；2026-07-11 略提削敌以配慢慢直播连战',
    },
    {
        id: 'ts_443', layer: 'tactical', series: 'casualty', index: 443,
        displayName: '溃走整众', sourceQuote: '《蒙古秘史》卷四：十三翼溃退中整众而走，主力保全。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.5, engineStatus: 'ready',
        note: '【成吉思汗】T0精锐·create·势劣局专属（三势精修）',
    },
    {
        id: 'ts_444', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 444,
        displayName: '中军截阵', ownerName: '李世民', sourceQuote: '【李世民】虎牢关率玄甲军直冲窦建德中军大阵。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_445', layer: 'tactical', series: 'casualty', index: 445,
        displayName: '背壕死突', sourceQuote: '《金史·太祖本纪》：背壕列阵断己归路，死战突贯辽军前队。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '【完颜阿骨打】T0精锐·create·势劣局专属（三势精修）',
    },
    {
        id: 'ts_446', usageTag: '防御', situationTag: '均势', layer: 'tactical', series: 'fate', index: 446,
        displayName: '结阵待隙', ownerName: '多尔衮', sourceQuote: '结阵防守等待敌露破绽，如多尔衮一片石结阵等多将皆有。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_447', layer: 'tactical', series: 'casualty', index: 447,
        displayName: '分道掩退', ownerName: '多尔衮', sourceQuote: '《清史稿·多尔衮传》：分兵佯攻掩护，主军乘夜退走全军未溃。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.5, engineStatus: 'ready',
        note: '【多尔衮】T0精锐·create·势劣局专属（三势精修）',
    },
];


// ── T1 精锐·赵宋区·名将专属技 ──────────────
const UNIQUE_T1_ZHAO: TacticalSkillEntry[] = [
    {
        id: 'ts_448', layer: 'tactical', series: 'enhance', index: 448,
        displayName: '诱营掩袭', ownerName: '赵匡胤', sourceQuote: '《宋史·赵匡胤传》相关记载：清流关夜遣军绕营后，正面佯攻，伏兵掩杀，皇甫晖败走。《宋史·太祖本纪》',
        baseEffect: 'partial_negate_enemy_skill', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【赵匡胤】T1精锐·赵宋区·势create·均局专属（三势精修）',
    },
    {
        id: 'ts_449', layer: 'tactical', series: 'casualty', index: 449,
        displayName: '溃流断遏', ownerName: '赵匡胤', sourceQuote: '《宋史·赵匡胤传》相关记载：寿州友军溃退，率殿后精骑扼守隘口横击追兵，溃兵收拢整编。《宋史·太祖本纪》',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.5, engineStatus: 'ready',
        note: '【赵匡胤】T1精锐·赵宋区·势create·劣局专属（三势精修）',
    },
    {
        id: 'ts_450', usageTag: '防御', situationTag: '均势', layer: 'tactical', series: 'troop', index: 450,
        displayName: '塞道遏冲', sourceQuote: '堵塞道路遏制骑兵冲锋，如王坚钓鱼城塞道等多将皆有。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_451', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 451,
        displayName: '死士逆摧', ownerName: '田单', sourceQuote: '【田单】《史记·田单列传》：火牛阵死士突袭破燕军。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_452', layer: 'tactical', series: 'enhance', index: 452,
        displayName: '叠砦疲敌', ownerName: '孟珙', sourceQuote: '《宋史·孟珙传》相关记载：黄州城外设层砦互为掎角，金军屡犯屡耗，力竭自退。《宋史·孟珙传》',
        baseEffect: 'nullify_enemy_opening_cut', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【孟珙】T1精锐·赵宋区·势reverse·均局专属（三势精修）',
    },
    {
        id: 'ts_453', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'troop', index: 453,
        displayName: '间道夺粮', ownerName: '曹操', sourceQuote: '【曹操】《三国志·武帝纪》：官渡之战间道奇袭乌巢烧粮。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_454', layer: 'tactical', series: 'enhance', index: 454,
        displayName: '伏隘截锋', ownerName: '杨业', sourceQuote: '《宋史·杨业传》相关记载：雁门出数百骑诱敌入山隘，伏兵断其首尾，大破辽军。《宋史·杨业传》',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【杨业】T1精锐·赵宋区·势reverse·均局专属（三势精修）',
    },
    {
        id: 'ts_455', layer: 'tactical', series: 'casualty', index: 455,
        displayName: '断后摧追', ownerName: '杨业', sourceQuote: '《宋史·杨业传》相关记载：雍熙败退，掩护百姓内迁，残兵断后力战，重伤被擒绝食死。《宋史·杨业传》',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '【杨业】T1精锐·赵宋区·势reverse·劣局专属（三势精修）',
    },
    {
        id: 'ts_456', layer: 'tactical', series: 'enhance', index: 456,
        displayName: '散骑扰牧', sourceQuote: '《宋史·王韶传》相关记载：熙河派轻骑深入蕃区袭扰畜群，吐蕃各部疲于救援，联盟自裂。《宋史·王韶传》',
        baseEffect: 'steal_enemy_skill', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【王韶】T1精锐·赵宋区·势create·均局专属（三势精修）',
    },
    {
        id: 'ts_457', usageTag: '防御', situationTag: '均势', layer: 'tactical', series: 'fate', index: 457,
        displayName: '断道遏援', sourceQuote: '切断道路阻挡援军围点打援，如王韶河州断道等。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_458', usageTag: '防御', situationTag: '均势', layer: 'tactical', series: 'troop', index: 458,
        displayName: '叠伏遏骑', sourceQuote: '多重伏兵遏制骑兵冲击，如曲端延安叠伏等多将皆有。',
        baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
    },
    {
        id: 'ts_459', layer: 'tactical', series: 'casualty', index: 459,
        displayName: '严垒止溃', ownerName: '曲端', sourceQuote: '《宋史·曲端传》相关记载：陕西诸路溃败，收拢散卒退守泾州，严令不得出战，军势复振。《宋史·曲端传》',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.5, engineStatus: 'ready',
        note: '【曲端】T1精锐·赵宋区·势create·劣局专属（三势精修）',
    },
    {
        id: 'ts_460', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 460,
        displayName: '鼓噪乱阵', sourceQuote: '齐声鼓噪扰乱敌阵，如刘秀昆阳之战等多将皆有。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.05, engineStatus: 'ready',
    },
    {
        id: 'ts_461', layer: 'tactical', series: 'enhance', index: 461,
        displayName: '溃旅扼门', ownerName: '耿恭', ownerGeneralId: 'xiyu_genggong', sourceQuote: '《宋史·狄青传》相关记载：溃兵争涌入营门，持刀立门勒令返身列阵拒敌，夏军见复整遂退。《宋史·狄青传》',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 0.5, engineStatus: 'ready',
        note: '【狄青】T1精锐·赵宋区·势create·劣局专属（三势精修）',
    },
];

const UNIQUE_T1_PRECISION: TacticalSkillEntry[] = [
    { id: 'ts_686', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 686, displayName: '据险持重', ownerName: '廉颇', sourceQuote: '【廉颇】《史记·廉颇列传》：长平坚壁拒王龁，据险持重。', baseEffect: 'win_casualty_reduction', condition: 'ratio_underdog', phase: 'mid_battle_passive', magnitude: 0.3, engineStatus: 'ready' },
    { id: 'ts_687', layer: 'tactical', series: 'fate', index: 687, displayName: '步阵遏骑', sourceQuote: '以步兵拒突厥骑', baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll', magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready', note: '【步阵遏骑】三势精修·均局' },
    { id: 'ts_688', layer: 'tactical', series: 'fate', index: 688, displayName: '设伏疲敌', sourceQuote: '枣阳设伏疲金', baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll', magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready', note: '【设伏疲敌】三势精修·均局' },
    { id: 'ts_689', layer: 'tactical', series: 'fate', index: 689, displayName: '游骑扰阵', sourceQuote: '【匈奴】控弦之士来去如风，游骑扰阵疲弊汉军。', baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll', magnitude: 1, luckMin: 0.5, luckMax: 1.5, engineStatus: 'ready', note: '【游骑扰阵】三势精修·均局' },
    { id: 'ts_690', layer: 'tactical', series: 'fate', index: 690, displayName: '周旋疲敌', ownerName: '彭越', sourceQuote: '【彭越】在楚军后方游击，与项羽周旋疲敌。', baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll', magnitude: 1, luckMin: 0.5, luckMax: 1.5, engineStatus: 'ready', note: '【周旋疲敌】三势精修·均局' },
    { id: 'ts_691', layer: 'tactical', series: 'fate', index: 691, displayName: '联部破盟', ownerName: '苏秦', sourceQuote: '【苏秦】佩六国相印，合纵联部破秦国之盟。', baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll', magnitude: 1, luckMin: 0.5, luckMax: 1.5, engineStatus: 'ready', note: '【联部破盟】三势精修·均局' },
    { id: 'ts_692', layer: 'tactical', series: 'fate', index: 692, displayName: '越险掩袭', sourceQuote: '鵯越奇袭', baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll', magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready', note: '【越险掩袭】三势精修·均局' },
    { id: 'ts_693', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 693, displayName: '绝漠追袭', ownerName: '霍去病', sourceQuote: '【霍去病】《史记·卫将军骠骑列传》：漠北封狼居胥，绝漠追袭。', baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll', magnitude: 1.05, engineStatus: 'ready' },
    { id: 'ts_694', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 694, displayName: '连郡拒敌', sourceQuote: '联合诸郡共拒强敌，如窦融保河西五郡等多将皆有。', baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive', magnitude: 1.25, engineStatus: 'ready' },
    { id: 'ts_695', layer: 'tactical', series: 'casualty', index: 695, displayName: '阵变惑敌', ownerName: '诸葛亮', ownerGeneralId: 'huizhou_zhugeliang', sourceQuote: '八阵图', baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'mid_battle_passive', magnitude: 1.25, engineStatus: 'ready', note: '【阵变惑敌】三势精修·均局' },
    { id: 'ts_696', layer: 'tactical', series: 'fate', index: 696, displayName: '飘忽袭扰', sourceQuote: '飘忽游击', baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll', magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready', note: '【飘忽袭扰】三势精修·均局' },
    { id: 'ts_697', layer: 'tactical', series: 'fate', index: 697, displayName: '骄兵诱溃', sourceQuote: '阏与示弱', baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll', magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready', note: '【骄兵诱溃】三势精修·均局' },
    { id: 'ts_698', layer: 'tactical', series: 'fate', index: 698, displayName: '驰突扰阵', sourceQuote: '贵霜驰突', baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll', magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready', note: '【驰突扰阵】三势精修·均局' },
    { id: 'ts_699', layer: 'tactical', series: 'fate', index: 699, displayName: '火器遏冲', ownerName: '袁崇焕', sourceQuote: '【袁崇焕】宁远红夷大炮遏后金冲势', baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll', magnitude: 1, luckMin: 0.5, luckMax: 1.5, engineStatus: 'ready', note: '【火器遏冲】三势精修·均局' },
    { id: 'ts_700', layer: 'tactical', series: 'fate', index: 700, displayName: '诱敌据险', ownerName: '吴玠', sourceQuote: '【吴玠】和尚原诱敌深入，据险大破金军。', baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll', magnitude: 1, luckMin: 0.5, luckMax: 1.5, engineStatus: 'ready', note: '【诱敌据险】三势精修·均局' },
    { id: 'ts_701', layer: 'tactical', series: 'counter', index: 701, displayName: '纵间戕帅', ownerName: '斛律光', sourceQuote: '反间杀斛律光', baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll', magnitude: 0.05, engineStatus: 'ready', note: '【纵间戕帅】三势精修·均局' },
    { id: 'ts_702', layer: 'tactical', series: 'troop', index: 702, displayName: '倍道袭擒', sourceQuote: '奔袭擒孟达', baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops', magnitude: 0.05, engineStatus: 'ready', note: '【倍道袭擒】三势精修·优局' },
    { id: 'ts_703', layer: 'tactical', series: 'enhance', index: 703, displayName: '恩威抚讨', ownerName: '桑吉温', sourceQuote: '【桑吉温】在藏区恩威并施，抚讨兼顾平定局势。', baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll', magnitude: 1.05, engineStatus: 'ready', note: '【恩威抚讨】三势精修·优局' },
    { id: 'ts_704', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 704, displayName: '据垒固守', ownerName: '周亚夫', sourceQuote: '【周亚夫】《史记·绛侯周勃世家》：细柳营据垒固守。', baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive', magnitude: 1.25, engineStatus: 'ready' },
    { id: 'ts_705', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'troop', index: 705, displayName: '伏锐歼敌',  sourceQuote: '【孙膑】《史记·孙子吴起列传》：马陵道隘口伏击庞涓。', baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops', magnitude: 0.1, engineStatus: 'ready' },
    { id: 'ts_706', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'troop', index: 706, displayName: '钓野诱歼', ownerName: '岛津家久', sourceQuote: '【岛津家久】日本战国岛津家"钓野伏"诱敌合围。', baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops', magnitude: 0.1, engineStatus: 'ready' },
    { id: 'ts_707', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 707, displayName: '草人诱射', ownerName: '张巡', sourceQuote: '【张巡】《新唐书·张巡传》：睢阳草人借箭，智守孤城。', baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive', magnitude: 1.25, engineStatus: 'ready' },
    { id: 'ts_708', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'troop', index: 708, displayName: '石炮摧锋', sourceQuote: '投石机摧毁敌军先锋，攻城利器，如襄阳炮等多将皆有。', baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops', magnitude: 0.1, engineStatus: 'ready' },
    { id: 'ts_709', usageTag: '防御', situationTag: '均势', layer: 'tactical', series: 'troop', index: 709, displayName: '据险摧敌', ownerName: '王坚', sourceQuote: '【王坚】《宋史·王坚传》：钓鱼城据险毙蒙哥。', baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops', magnitude: 0.1, engineStatus: 'ready' },
    { id: 'ts_710', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 710, displayName: '斩将肃阵', ownerName: '关羽', sourceQuote: '【关羽】《三国志·关羽传》：斩颜良解白马围，万军之中取上将首级。', baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll', magnitude: 1.05, engineStatus: 'ready' },
    { id: 'ts_711', layer: 'tactical', series: 'casualty', index: 711, displayName: '穷搜死战', ownerName: '张巡', sourceQuote: '【张巡】睢阳粮尽，掘鼠雀穷搜死战抗击燕军。', baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle', magnitude: 1.25, engineStatus: 'ready', note: '【穷搜死战】三势精修·劣局' },
    { id: 'ts_712', layer: 'tactical', series: 'fate', index: 712, displayName: '溃师复振', sourceQuote: '东昌后反击', baseEffect: 'recompute_comeback', condition: 'side_comeback', phase: 'mid_battle_comeback', magnitude: 1, comebackThreshold: 0.8, engineStatus: 'ready', note: '【溃师复振】三势精修·劣局' },
    { id: 'ts_713', layer: 'tactical', series: 'casualty', index: 713, displayName: '据险死拒', ownerName: '耿恭', sourceQuote: '疏勒城据险死拒，匈奴数月攻之不下。', baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive', magnitude: 0.3, engineStatus: 'ready', note: '【据险死拒】三势精修·劣局' },
    { id: 'ts_714', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 714, displayName: '攻坚摧碉', ownerName: '阿桂', sourceQuote: '【阿桂】清平大小金川以火炮攻坚摧碉堡。', baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll', magnitude: 1.05, engineStatus: 'ready' },
    { id: 'ts_715', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 715, displayName: '矫制绝诛', ownerName: '陈汤', sourceQuote: '【陈汤】《汉书·陈汤传》：矫诏发兵灭郅支单于。', baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll', magnitude: 1.05, engineStatus: 'ready' },
    { id: 'ts_716', layer: 'tactical', series: 'casualty', index: 716, displayName: '据城退敌', ownerName: '刘仁恭', sourceQuote: '【刘仁恭】据幽州退朱温', baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive', magnitude: 0.3, engineStatus: 'ready', note: '【据城退敌】三势精修·劣局' },
    { id: 'ts_717', layer: 'tactical', series: 'casualty', index: 717, displayName: '刮骨溃围', sourceQuote: '麦城突围', baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle', magnitude: 1.25, engineStatus: 'ready', note: '【刮骨溃围】三势精修·劣局' },
    { id: 'ts_718', layer: 'tactical', series: 'casualty', index: 718, displayName: '据垒死守', sourceQuote: '据垒死守', baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive', magnitude: 0.3, engineStatus: 'ready', note: '【据垒死守】三势精修·劣局' },
    { id: 'ts_719', layer: 'tactical', series: 'casualty', index: 719, displayName: '火攻溃围', sourceQuote: '长社火攻', baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle', magnitude: 1.25, engineStatus: 'ready', note: '【火攻溃围】三势精修·劣局' },
    { id: 'ts_720', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 720, displayName: '整众反击', sourceQuote: '败退中整顿残部发起反击，减损求存，多将皆有此能。', baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive', magnitude: 0.3, engineStatus: 'ready' },
    { id: 'ts_721', usageTag: '防御', situationTag: '均势', layer: 'tactical', series: 'troop', index: 721, displayName: '据险歼锐',  sourceQuote: '【吴玠】《宋史·吴玠传》：和尚原据险大破金军。', baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops', magnitude: 0.1, engineStatus: 'ready' },
    { id: 'ts_722', layer: 'tactical', series: 'fate', index: 722, displayName: '孤军渡江', situationTag: '均势', ownerName: '祖逖', ownerGeneralId: 'yuzhou_zuti', sourceQuote: '孤军渡江', baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll', magnitude: 1, luckMin: 0.7, luckMax: 1.3, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready', note: '【孤军渡江】三势精修·劣局' },
    { id: 'ts_723', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 723, displayName: '陷阵摧锋', sourceQuote: '冲入敌阵摧毁锋锐，如吕布、张辽、高长恭等多将常用。', baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive', magnitude: 1.25, engineStatus: 'ready' },
    { id: 'ts_724', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 724, displayName: '誓师济河', ownerName: '祖逖', ownerGeneralId: 'yuzhou_zuti', sourceQuote: '誓师渡河决死一战，破釜沉舟之志，如祖逖中流击楫等，无单一专属。', baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive', magnitude: 1.25, engineStatus: 'ready' },
    { id: 'ts_725', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'troop', index: 725, displayName: '绝域摧锋', ownerName: '侯君集', sourceQuote: '长途远征在极远之地摧破敌军，如侯君集灭高昌、班超定西域等。', baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops', magnitude: 0.05, engineStatus: 'ready' },
    { id: 'ts_726', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 726, displayName: '先登强弩', sourceQuote: '攻城时率先登城并以强弩射击，破城锐器，如界桥之战等。', baseEffect: 'ally_power_mult', condition: 'battle_siege_attacker', phase: 'opening_roll', magnitude: 1.1, engineStatus: 'ready' },
    { id: 'ts_727', layer: 'tactical', series: 'fate', index: 727, displayName: '轻锐扰阵', sourceQuote: '讨黄巾轻锐扰敌', baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll', magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready', note: '【轻锐扰阵】三势精修·均局' },
    { id: 'ts_728', layer: 'tactical', series: 'casualty', index: 728, displayName: '孤军死斗', sourceQuote: '岘山孤军死', baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle', magnitude: 1.25, engineStatus: 'ready', note: '【孤军死斗】三势精修·劣局' },
    { id: 'ts_729', usageTag: '防御', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 729, displayName: '坚壁养锐', ownerName: '司马懿', ownerGeneralId: 'wei_simayi', sourceQuote: '【司马懿】《晋书·宣帝纪》：对蜀闭垒不出，养精蓄锐待敌自退。', baseEffect: 'ally_power_mult', condition: 'always', phase: 'mid_battle_passive', magnitude: 1.05, engineStatus: 'ready' },
    { id: 'ts_730', usageTag: '防御', situationTag: '均势', layer: 'tactical', series: 'fate', index: 730, displayName: '持重待疲', sourceQuote: '以稳重防守消耗敌军，待其疲惫再寻战机，多将皆有此守。', baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll', magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready' },
    { id: 'ts_731', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'troop', index: 731, displayName: '奇袭摧阵', sourceQuote: '以奇兵突袭冲垮敌阵，如甘宁百骑劫营等多将皆有。', baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops', magnitude: 0.1, engineStatus: 'ready' },
    { id: 'ts_732', layer: 'tactical', series: 'casualty', index: 732, displayName: '断后殉节', sourceQuote: '陈家谷', baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle', magnitude: 1.25, engineStatus: 'ready', note: '【断后殉节】三势精修·劣局' },
    { id: 'ts_733', layer: 'tactical', series: 'fate', index: 733, displayName: '驰骋扰阵', ownerName: '项羽', sourceQuote: '【项羽】垓下率二十八骑驰骋扰阵，汉军披靡。', baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll', magnitude: 1, luckMin: 0.5, luckMax: 1.5, engineStatus: 'ready', note: '【驰骋扰阵】三势精修·均局' },
    { id: 'ts_734', layer: 'tactical', series: 'casualty', index: 734, displayName: '驰掠脱困', ownerName: '赵云', sourceQuote: '【赵云】长坂坡七进七出，驰掠突围脱困。', baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle', magnitude: 1.25, engineStatus: 'ready', note: '【驰掠脱困】三势精修·劣局' },
    { id: 'ts_735', layer: 'tactical', series: 'fate', index: 735, displayName: '轻骑驰扰', ownerName: '李世民', sourceQuote: '【李世民】率轻骑昼夜驰扰，疲弊刘武周大军。', baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll', magnitude: 1, luckMin: 0.5, luckMax: 1.5, engineStatus: 'ready', note: '【轻骑驰扰】三势精修·均局' },
    { id: 'ts_736', layer: 'tactical', series: 'casualty', index: 736, displayName: '孤军力斗', ownerName: '刘邦', sourceQuote: '彭城之战以三万孤军力斗刘邦联军。', baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle', magnitude: 1.25, engineStatus: 'ready', note: '【孤军力斗】三势精修·劣局' },
    { id: 'ts_737', usageTag: '攻击', situationTag: '均势', layer: 'tactical', series: 'troop', index: 737, displayName: '伏隘摧锋', ownerName: '孙膑', sourceQuote: '【孙膑】《史记·孙子吴起列传》：马陵道隘口伏击庞涓。', baseEffect: 'ally_add_troops_opening', condition: 'always', phase: 'pre_opening_troops', magnitude: 0.1, engineStatus: 'ready' },
    { id: 'ts_738', layer: 'tactical', series: 'fate', index: 738, displayName: '疑兵惑敌', sourceQuote: '疑兵惑敌', baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll', magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready', note: '【疑兵惑敌】三势精修·均局' },
    { id: 'ts_739', layer: 'tactical', series: 'enhance', index: 739, displayName: '陷阵摧坚', sourceQuote: '汾北冲阵', baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll', magnitude: 1.05, engineStatus: 'ready', note: '【陷阵摧坚】三势精修·优局' },
    { id: 'ts_740', usageTag: '双行', situationTag: '均势', layer: 'tactical', series: 'fate', index: 740, displayName: '整军挫锐', sourceQuote: '整顿阵型挫败敌军锐气，攻守转换之法，多将皆有。', baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll', magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready' },
];

const UNIQUE_T1_EXPAND: TacticalSkillEntry[] = [
    // ts_741 已删除（八百壮士，1937年近现代典故，不符合游戏时代设定）
    { id: 'ts_742', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 742, displayName: '孤注一掷', sourceQuote: '倾尽残存兵力作最后一搏败中求胜，如刘裕等，多将皆有此勇。', baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive', magnitude: 1.25, engineStatus: 'ready' },
    { id: 'ts_743', layer: 'tactical', series: 'counter', index: 743, displayName: '断道绝险', sourceQuote: '《三国志·张郃传》街亭之战张郃断马谡汲水之道', baseEffect: 'cancel_enemy_terrain_buff', condition: 'always', phase: 'opening_roll', magnitude: 1, engineStatus: 'ready' },
    { id: 'ts_744', layer: 'tactical', series: 'counter', index: 744, displayName: '暗渡陈仓', sourceQuote: '《史记·淮阴侯列传》韩信绕开正面险要，出奇兵平定三秦', baseEffect: 'cancel_enemy_terrain_buff', condition: 'always', phase: 'opening_roll', magnitude: 1, engineStatus: 'ready' },
    { id: 'ts_745', layer: 'tactical', series: 'counter', index: 745, displayName: '引蛇出洞', sourceQuote: '《三十六计》战术，引诱敌人离开坚固阵地', baseEffect: 'cancel_enemy_terrain_buff', condition: 'always', phase: 'opening_roll', magnitude: 1, engineStatus: 'ready' },
    { id: 'ts_746', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 746, displayName: '白马救围', ownerName: '公孙瓒', sourceQuote: '【公孙瓒】《后汉书·公孙瓒传》：白马义从驰援解围。', baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive', magnitude: 1.25, engineStatus: 'ready' },
    { id: 'ts_747', layer: 'tactical', series: 'counter', index: 747, displayName: '平地起雷', sourceQuote: '【火器战术】神机营火器齐发，声若平地起雷。', baseEffect: 'cancel_enemy_terrain_buff', condition: 'always', phase: 'opening_roll', magnitude: 1, engineStatus: 'ready' },
    { id: 'ts_748', usageTag: '双行', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 748, displayName: '围魏救赵', ownerName: '孙膑', ownerGeneralId: 'qi_sunbin', sourceQuote: '【孙膑】《史记·孙子吴起列传》：攻其必救，解友军之围。', baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive', magnitude: 0.3, engineStatus: 'ready' },
    { id: 'ts_749', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'troop', index: 749, displayName: '威震逍遥', ownerName: '张辽', ownerGeneralId: 'lu_zhangliao', sourceQuote: '【张辽】《三国志·张辽传》：逍遥津八百人冲孙权十万大营。', baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops', magnitude: 1.5, engineStatus: 'ready' },
    { id: 'ts_750', layer: 'tactical', series: 'counter', index: 750, displayName: '敲山震虎', sourceQuote: '隐语战术，通过攻击旁侧来动摇敌方主力据点', baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll', magnitude: 0.5, engineStatus: 'ready' },
    { id: 'ts_751', layer: 'tactical', series: 'counter', index: 751, displayName: '退避三舍', sourceQuote: '《左传·僖公二十二年》城濮之战晋文公主动后退避开楚军锋芒', baseEffect: 'nullify_enemy_opening_cut', condition: 'always', phase: 'opening_roll', magnitude: 1, engineStatus: 'ready' },
    { id: 'ts_752', layer: 'tactical', series: 'counter', index: 752, displayName: '结营凭险', ownerName: '陆逊', sourceQuote: '《三国志·陆逊传》夷陵之战陆逊坚守不出，拒敌锋锐', baseEffect: 'nullify_enemy_opening_cut', condition: 'always', phase: 'opening_roll', magnitude: 1, engineStatus: 'ready' },
    { id: 'ts_753', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 753, displayName: '按甲休兵', sourceQuote: '按兵不动休整队伍，伺机再战止损蓄力，多将皆有此守。', baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive', magnitude: 0.3, engineStatus: 'ready' },
    { id: 'ts_754', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 754, displayName: '偃旗息鼓', ownerName: '赵云', ownerGeneralId: 'jingmen_zhaoyun', sourceQuote: '【赵云】《三国志·赵云传》：汉水空营偃旗息鼓退曹军。', baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive', magnitude: 1.25, engineStatus: 'ready' },

    { id: 'ts_756', usageTag: '双行', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 756, displayName: '单刀赴会', ownerName: '关羽', sourceQuote: '【关羽】《三国志·关羽传》：单刀赴鲁肃宴，胆略脱身。', baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive', magnitude: 1.25, engineStatus: 'ready' },
    { id: 'ts_757', layer: 'tactical', series: 'counter', index: 757, displayName: '壁垒森严', sourceQuote: '形容营垒防御极其严密，令敌军无隙可乘', baseEffect: 'nullify_enemy_opening_cut', condition: 'always', phase: 'opening_roll', magnitude: 1, engineStatus: 'ready' },
    { id: 'ts_758', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 758, displayName: '坚如磐石', sourceQuote: '防守固若磐石，虽处劣势亦不可动摇，多将皆有此守。', baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive', magnitude: 1.25, engineStatus: 'ready' },
    { id: 'ts_759', layer: 'tactical', series: 'counter', index: 759, displayName: '反客为主', sourceQuote: '《三十六计》乘隙插足，扼其主机，将敌方优势化为己用', baseEffect: 'steal_enemy_skill', condition: 'always', phase: 'opening_roll', magnitude: 0.5, engineStatus: 'ready' },
    { id: 'ts_760', layer: 'tactical', series: 'counter', index: 760, displayName: '临阵倒戈', sourceQuote: '《尚书·武成》牧野之战商军前徒倒戈，敌军战术反助我方', baseEffect: 'steal_enemy_skill', condition: 'always', phase: 'opening_roll', magnitude: 0.5, engineStatus: 'ready' },
    { id: 'ts_761', usageTag: '双行', situationTag: '均势', layer: 'tactical', series: 'counter', index: 761, displayName: '草船借箭', ownerName: '诸葛亮', ownerGeneralId: 'huizhou_zhugeliang', sourceQuote: '【诸葛亮】草船借箭化敌之攻为己用，以智取胜。', baseEffect: 'steal_enemy_skill', condition: 'always', phase: 'opening_roll', magnitude: 0.5, engineStatus: 'ready' },
    { id: 'ts_762', layer: 'tactical', series: 'counter', index: 762, displayName: '借东风势',  sourceQuote: '《三国演义》诸葛亮借东风，窃取天时为己方火攻之利', baseEffect: 'steal_enemy_skill', condition: 'always', phase: 'opening_roll', magnitude: 0.5, engineStatus: 'ready' },
    { id: 'ts_763', layer: 'tactical', series: 'counter', index: 763, displayName: '移花接木', sourceQuote: '巧妙偷换手段，将敌方施加的技能转移化用', baseEffect: 'steal_enemy_skill', condition: 'always', phase: 'opening_roll', magnitude: 0.5, engineStatus: 'ready' },
    { id: 'ts_764', layer: 'tactical', series: 'counter', index: 764, displayName: '减灶斩将', sourceQuote: '《史记·孙子吴起列传》马陵之战孙膡减灶诱庞涓，以退为进斩之', baseEffect: 'reflect_enemy_opening_cut', condition: 'always', phase: 'opening_roll', magnitude: 1, engineStatus: 'ready' },
    { id: 'ts_765', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'troop', index: 765, displayName: '火烧连营', ownerName: '陆逊', sourceQuote: '【陆逊】《三国志·陆逊传》：夷陵之战火攻刘备七百里连营。', baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops', magnitude: 0.05, engineStatus: 'ready' },
    { id: 'ts_766', layer: 'tactical', series: 'counter', index: 766, displayName: '请君入瓮', sourceQuote: '《资治通鉴》周兴酷吏被来俊臣以其人之道还治其人之身', baseEffect: 'reflect_enemy_opening_cut', condition: 'always', phase: 'opening_roll', magnitude: 1, engineStatus: 'ready' },
    { id: 'ts_767', layer: 'tactical', series: 'counter', index: 767, displayName: '借力打力', sourceQuote: '太极拳理，将敌方开局猛攻的动能反弹给对方', baseEffect: 'reflect_enemy_opening_cut', condition: 'always', phase: 'opening_roll', magnitude: 1, engineStatus: 'ready' },
    { id: 'ts_768', layer: 'tactical', series: 'counter', index: 768, displayName: '诱敌伏击', sourceQuote: '故意暴露出破绽承受小损，换取合围全歼的巨大战果', baseEffect: 'reflect_enemy_opening_cut', condition: 'always', phase: 'opening_roll', magnitude: 1, engineStatus: 'ready' },
    { id: 'ts_769', layer: 'tactical', series: 'counter', index: 769, displayName: '连环妙计', sourceQuote: '《三十六计》将多兵众，不可以敌，使其自累，化解半数攻势', baseEffect: 'partial_negate_enemy_skill', condition: 'always', phase: 'opening_roll', magnitude: 0.25, engineStatus: 'ready' },
    { id: 'ts_770', layer: 'tactical', series: 'enhance', index: 770, displayName: '锦囊妙计', ownerName: '诸葛亮', ownerGeneralId: 'huizhou_zhugeliang', sourceQuote: '《三国演义》诸葛亮预留锦囊，在关键时刻化解敌方计谋', baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll', magnitude: 0.25, engineStatus: 'ready' },    { id: 'ts_772', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 772, displayName: '割须弃袍', ownerName: '曹操', sourceQuote: '【曹操】潼关之战败逃割须弃袍，虽狼狈亦得以脱身。', baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive', magnitude: 1.25, engineStatus: 'ready' },
    { id: 'ts_773', layer: 'tactical', series: 'counter', index: 773, displayName: '辕门射戟', ownerName: '吕布', sourceQuote: '《三国志·吕布传》吕布射戟解纪灵之围，强行中止敌方攻势', baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll', magnitude: 0.25, status: 'retired', engineStatus: 'ready' },
    { id: 'ts_774', usageTag: '双行', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 774, displayName: '击鼓骂曹', ownerName: '祢衡', sourceQuote: '【祢衡】《后汉书·祢衡传》：裸衣击鼓羞辱曹操，以气夺人。', baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive', magnitude: 1.25, engineStatus: 'ready' },
    { id: 'ts_775', layer: 'tactical', series: 'counter', index: 775, displayName: '兵不厌诈', sourceQuote: '《韩非子·难一》战阵之间，不厌诈伪，以此看破敌方诡计', baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll', magnitude: 0.25, engineStatus: 'ready' },
    { id: 'ts_776', layer: 'tactical', series: 'counter', index: 776, displayName: '反间奇谋', sourceQuote: '利用敌方内部矛盾，使敌方战术布置直接瘱痪', baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll', magnitude: 0.25, engineStatus: 'ready' },
    // ── 2026-07-12 三格劣局补全：20 武将劣势格专属（史料·败战/并战）──
    { id: 'ts_777', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 777, displayName: '备边固守', sourceQuote: '边防长期守备稳守御敌，如妇好驻守边境等多将皆有。', baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive', magnitude: 1.25, engineStatus: 'ready' },
    { id: 'ts_778', layer: 'tactical', series: 'casualty', index: 778, displayName: '林伏脱身', sourceQuote: '《伊贺乱记》：伊贺众遭织田军围剿，散入密林脱身，保存首领。', baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle', magnitude: 1.25, engineStatus: 'ready', note: '【百地丹波】势reverse·劣局专属' },
    { id: 'ts_779', layer: 'tactical', series: 'casualty', index: 779, displayName: '鹤城殉节', ownerName: '张巡', sourceQuote: '【张巡】死守孤城，城破后宁死不屈壮烈殉节。', baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle', magnitude: 1.25, engineStatus: 'ready', note: '【蒲生氏乡】势reverse·劣局专属' },
    { id: 'ts_780', usageTag: '防御', situationTag: '均势', layer: 'tactical', series: 'fate', index: 780, displayName: '金城御海', sourceQuote: '凭借坚城防御海上入侵者，如金首露筑伽倻城等，守海之法。', baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll', magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready' },
    { id: 'ts_781', layer: 'tactical', series: 'casualty', index: 781, displayName: '河畔聚部', ownerName: '沙牟奢允', sourceQuote: '【沙牟奢允】在河畔聚集部众绝地自保', baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive', magnitude: 0.3, engineStatus: 'ready', note: '【孛端察儿】势reverse·劣局专属' },
    { id: 'ts_782', usageTag: '防御', situationTag: '均势', layer: 'tactical', series: 'fate', index: 782, displayName: '南道自固', sourceQuote: '退据南道自我巩固保存实力，守势待时之法，多将皆有。', baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll', magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready' },
    { id: 'ts_783', usageTag: '防御', situationTag: '均势', layer: 'tactical', series: 'fate', index: 783, displayName: '谷隘拒侵', sourceQuote: '在山谷关隘处拒敌入侵，如梵衍那国据险拒大食等，守险之法。', baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll', magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready' },
    { id: 'ts_784', usageTag: '防御', situationTag: '均势', layer: 'tactical', series: 'fate', index: 784, displayName: '摄政据隘', sourceQuote: '掌权时派兵据守险隘以防变乱，守险自固之法。', baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll', magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready' },
    { id: 'ts_785', usageTag: '防御', situationTag: '均势', layer: 'tactical', series: 'fate', index: 785, displayName: '遣防据险', sourceQuote: '派遣兵力据守险要地形，守险之法，多将皆有。', baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll', magnitude: 1, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready' },
    { id: 'ts_786', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 786, displayName: '平叛定贼', sourceQuote: '率军平定内部叛乱，优势碾压，如高升泰诛杨义贞等多将皆有此功。', baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll', magnitude: 1.05, engineStatus: 'ready' },
    { id: 'ts_787', layer: 'tactical', series: 'casualty', index: 787, displayName: '退据美山', ownerName: '刀更孟', sourceQuote: '【刀更孟】傣族首领退守美山自保', baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive', magnitude: 0.3, engineStatus: 'ready', note: '【制蓬峨】势create·劣局专属' },
    { id: 'ts_788', layer: 'tactical', series: 'casualty', index: 788, displayName: '徼徼存众', sourceQuote: '《华阳国志·南中志》：爨部从征失利，收缩保存部曲。', baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive', magnitude: 0.3, engineStatus: 'ready', note: '【爨习】势reverse·劣局专属' },
    { id: 'ts_789', layer: 'tactical', series: 'casualty', index: 789, displayName: '刎颈存城', sourceQuote: '《华阳国志·巴志》：巴蔓子自刎存巴，军民绝境死战。', baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle', magnitude: 1.25, engineStatus: 'ready', note: '【巴蔓子】势reverse·劣局专属' },
    { id: 'ts_790', layer: 'tactical', series: 'casualty', index: 790, displayName: '败走存氐', sourceQuote: '《宋书·萧承之传》：杨难当攻萧承之四十日，氐军败而不溃，保存主力南退。', baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive', magnitude: 0.3, engineStatus: 'ready', note: '【杨难当】势create·劣局专属' },
    { id: 'ts_791', layer: 'tactical', series: 'casualty', index: 791, displayName: '賨人助守', ownerName: '范目', sourceQuote: '【范目】依靠巴賨部落协助汉军防守', baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive', magnitude: 0.3, engineStatus: 'ready', note: '【范目】势reverse·劣局专属' },
    { id: 'ts_792', layer: 'tactical', series: 'casualty', index: 792, displayName: '河湖死守', sourceQuote: '《旧唐书·颜真卿传》：河朔起兵，真卿据平原河湖死守拒贼。', baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive', magnitude: 0.3, engineStatus: 'ready', note: '【颜真卿】势create·劣局专属' },
    { id: 'ts_793', layer: 'tactical', series: 'casualty', index: 793, displayName: '林中保全', ownerName: '图门吉尔嘎勒', sourceQuote: '布里亚特部史：图门吉尔嘎勒率部散入贝加尔林中，保全部众。', baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive', magnitude: 0.3, engineStatus: 'ready', note: '【图门吉尔嘎勒】势reverse·劣局专属' },
    { id: 'ts_794', layer: 'tactical', series: 'casualty', index: 794, displayName: '真珠聚族', sourceQuote: '《突厥民族史》：乌古斯先祖都卡克于真珠河畔聚结部族。', baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive', magnitude: 0.3, engineStatus: 'ready', note: '【都卡克】势reverse·劣局专属' },
    { id: 'ts_795', layer: 'tactical', series: 'casualty', index: 795, displayName: '西北固守', sourceQuote: '《弥兰陀王问经》背景：米南德据西北印度华氏城固守，威震诸邦。', baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive', magnitude: 0.3, engineStatus: 'ready', note: '【米南德】势create·劣局专属' },
    { id: 'ts_796', layer: 'tactical', series: 'casualty', index: 796, displayName: '御边据险', ownerName: '图门吉尔嘎勒', sourceQuote: '【图门吉尔嘎勒】守御边境据守险要', baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive', magnitude: 0.3, engineStatus: 'ready', note: '【戈达尔兹】势reverse·劣局专属' },
    // ── 名将专属新技 ──
    { id: 'ts_801', usageTag: '攻击', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 801, displayName: '夜火焚营', sourceQuote: '夜半火攻焚烧敌营，如黄盖火烧赤壁等多将皆有。', baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive', magnitude: 1.25, engineStatus: 'ready' },
    { id: 'ts_802', usageTag: '防御', situationTag: '均势', layer: 'tactical', series: 'fate', index: 802, displayName: '疏勒孤忠', ownerName: '耿恭', ownerGeneralId: 'xiyu_genggong', sourceQuote: '【耿恭】《后汉书·耿恭传》：孤军守疏勒城凿山得泉，十三将士归玉门。', baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll', magnitude: 1.5, luckMin: 0.7, luckMax: 1.3, luckMin: 0.7, luckMax: 1.3, engineStatus: 'ready' },
    // ── 帝王专属 ──
    { id: 'ts_806', usageTag: '防御', situationTag: '劣势', layer: 'tactical', series: 'casualty', index: 806, displayName: '日月重开', ownerName: '于谦', sourceQuote: '【于谦】《明史·于谦传》：北京保卫战扭转乾坤，日月重开。', baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'mid_battle_passive', magnitude: 1.5, engineStatus: 'ready' },
    { id: 'ts_807', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 807, displayName: '开皇一统', ownerName: '杨坚', sourceQuote: '【杨坚】《隋书·高祖纪》：灭陈统一，结束三百年分裂。', baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll', magnitude: 1.05, engineStatus: 'ready' },
    // ── 战斗时长 ──
    { id: 'ts_808', usageTag: '攻击', situationTag: '优势', layer: 'tactical', series: 'enhance', index: 808, displayName: '疾风迅雷', ownerName: '速不台', sourceQuote: '如疾风迅雷般快速突击，如速不台蒙古西征等，无单一专属。', baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll', magnitude: 1.05, engineStatus: 'ready' },
    { id: 'ts_809', layer: 'tactical', series: 'troop', index: 809, displayName: '以拖待变', sourceQuote: '《孙子兵法·虚实》：“先处战地而待敌者佚，后处战地而趋战者劳。”', baseEffect: 'battle_duration_mult', condition: 'always', phase: 'opening_roll', magnitude: 1.4, engineStatus: 'hook', note: '【通用】劣势局·拖延待援：战斗时长×1.4（延长40%）；引擎接线待Step2' },
    // ── 名计绝品副本（一人一张，2026-07-14 重铺时创立）──
    { id: 'ts_810', layer: 'tactical', series: 'counter', index: 810, displayName: '料敌机先', ownerName: '孙膑', sourceQuote: '【孙膑】《史记》：马陵道预判庞涓行程设伏', baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll', magnitude: 1.0, engineStatus: 'ready', note: '【孙膑】绝品·专属·一人一张·原主复活' },
    { id: 'ts_811', layer: 'tactical', series: 'counter', index: 811, displayName: '长平合围', ownerName: '白起', sourceQuote: '《三十六计·混战计》：“小敌困之。”（白起·长平合围）', baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll', magnitude: 1.0, engineStatus: 'ready', note: '【白起】绝品·专属·长平围歼典故' },
    { id: 'ts_812', layer: 'tactical', series: 'counter', index: 812, displayName: '乌巢断粮', ownerName: '曹操', sourceQuote: '《三十六计·混战计》：“不敌其力，而消其势。”（曹操·乌巢烧粮）', baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll', magnitude: 1.0, engineStatus: 'ready', note: '【曹操】绝品·专属·乌巢断粮典故' },
    { id: 'ts_813', layer: 'tactical', series: 'counter', index: 813, displayName: '辕门射戟', ownerName: '吕布', sourceQuote: '《三国志·吕布传》：布于沛城设宴，树戟于营门，一箭中戟小支，慑退纪灵三万兵。', baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll', magnitude: 1.0, engineStatus: 'ready', note: '【吕布】绝品·专属·辕门射戟原主' },
    { id: 'ts_814', layer: 'tactical', series: 'counter', index: 814, displayName: '将计就计', sourceQuote: '《三国志·贾诩传》注引：“因其计而用之。”（司马懿）', baseEffect: 'partial_negate_enemy_skill', condition: 'always', phase: 'opening_roll', magnitude: 0.7, engineStatus: 'ready', note: '【司马懿】绝品·专属·借敌之计反制·原主复活' },

    {
        id: 'ts_818', layer: 'tactical', series: 'casualty', index: 818,
        displayName: '空城退敌', sourceQuote: '《三十六计·第三十二计》：虚者虚之，疑中生疑，刚柔之际，奇而复奇。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.25, status: 'retired', engineStatus: 'ready',
    },
    {
        id: 'ts_819', layer: 'tactical', series: 'casualty', index: 819,
        displayName: '反间除帅', sourceQuote: '《三十六计·第三十三计》：疑中之疑，比之自内，不自失也。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.25, status: 'retired', engineStatus: 'ready',
    },
    {
        id: 'ts_820', layer: 'tactical', series: 'casualty', index: 820,
        displayName: '苦肉诈降', sourceQuote: '《三十六计·第三十四计》：人不自害，受害必真，假真真假，间以得行。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.25, status: 'retired', engineStatus: 'ready',
    },
    {
        id: 'ts_821', layer: 'tactical', series: 'casualty', index: 821,
        displayName: '连环离间', sourceQuote: '《三十六计·第三十五计》：将多兵众，不可以敌，使其自累，以杀其势。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.25, status: 'retired', engineStatus: 'ready',
    },
    {
        id: 'ts_822', layer: 'tactical', series: 'casualty', index: 822,
        displayName: '走为上计', sourceQuote: '《三十六计·第三十六计》：全师避敌，左次无咎，未失常也。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.25, engineStatus: 'ready',
    },
];

export const TACTICAL_SKILL_ENTRIES_V1: TacticalSkillEntry[] = [
    ...ENHANCE,
    ...FATE,
    ...TROOP,
    ...CASUALTY,
    ...COUNTER,
    ...UNIQUE_T0,
    ...UNIQUE_T1,
    ...SANSHILIU,
    ...UNIQUE_T0_REVISE,
    ...UNIQUE_T1_ZHAO,
    ...UNIQUE_T1_GENERAL,
    ...UNIQUE_T1_GENERAL2,
    ...UNIQUE_T1_GENERAL3,
    ...UNIQUE_T1_TAIL,
    ...UNIQUE_T1_PRECISION,
    ...UNIQUE_T1_EXPAND,
];

export const TACTICAL_SKILL_BY_ID: Readonly<Record<string, TacticalSkillEntry>> = Object.fromEntries(
    TACTICAL_SKILL_ENTRIES_V1.map((e) => [e.id, e]),
);

/** 旧 tac_01–tac_10 → v1 条目（多对一时取首个 legacy 映射） */
export const LEGACY_TAC_TO_V1: Readonly<Record<string, string>> = (() => {
    const map: Record<string, string> = {};
    for (const e of TACTICAL_SKILL_ENTRIES_V1) {
        if (e.legacyTacId && !map[e.legacyTacId]) {
            map[e.legacyTacId] = e.id;
        }
    }
    return map;
})();

/**
 * 【旧 ID 兼容】已退役 tac_* 到现行 ts_* 的映射（2026-07-03）
 * 保留 legacyTacId 仅用于读取旧数据；禁止据此设计或分配新武将。
 */
export const LEGACY_ARCHETYPE_TO_V1: Readonly<Record<string, string>> = {
    'tac_01': 'ts_001', // 以逸待劳 -> 百战不殆
    'tac_02': 'ts_022', // 避实击虚 -> 攻其不备 (20% 更接近旧版 16.7%)
    'tac_03': 'ts_007', // 侵掠如火 -> 原野交锋
    'tac_04': 'ts_022', // 不战而屈 -> 攻其不备 (无敌战力乘区，近似削敌)
    'tac_05': 'ts_031', // 不动如山 -> 游刃有余
    'tac_06': 'ts_026', // 哀兵必胜 -> 百折不挠
    'tac_07': 'ts_024', // 攻其不备 -> 反戈一击
    'tac_08': 'ts_011', // 置之死地 -> 绝地反击
    'tac_09': 'ts_024', // 釜底抽薪 -> 反戈一击
    'tac_10': 'ts_014', // 深沟高垒 -> 步步为营
};

export function getTacticalSkillEntry(skillId: string): TacticalSkillEntry | null {
    return TACTICAL_SKILL_BY_ID[skillId] ?? null;
}

export function getTacticalSkillEntryForGeneral(tacticalSkillId: string): TacticalSkillEntry | null {
    const direct = getTacticalSkillEntry(tacticalSkillId);
    if (direct) return direct;
    const mapped = LEGACY_TAC_TO_V1[tacticalSkillId];
    return mapped ? getTacticalSkillEntry(mapped) : null;
}

/**
 * ── 分配层策略（2026-07-03 立）──
 * 战术技「单层平衡」的第二道闸门（第一道=条件稀有度）。
 * 主人裁定：条件技「触发即爆发」是设计意图（战术深度/直播看点），
 * 靠触发率 + 本分配层摊薄；无条件/准无条件强技则靠此层限量，防乱发污染均势 AI 生态。
 * 见 tactical:balance 审计与 docs/02-design/战术技条件权重报告.md 第十节受众分层。
 */
export type TacticalAssignTier =
    | 'common'        // 大众可发：无条件温和(≤锚点85%) 或 真条件技(靠地形/敌情自然摊薄)
    | 'limited'       // 限量：无条件/准无条件强技(触发时>88%)，优先 AI 或个位数名将，禁大众过图 buff
    | 'ai_defensive'  // AI 守将：守城/咬人/拦截（玩家 92% 为攻方，被动遭遇才是高光）
    | 'underdog'      // 绝境/AI 限定：以少打多族，明星军团近乎不触发
    | 'gamble'        // 慎发明星：无条件加方差，跟随军团抽到易爆冷砸场
    | 'star_survival';// 跟随名将首选：稳健/存活（明星军团必胜→靠这个活久、少换镜头）

/**
 * 分配层映射（id → tier）。集中一处便于审计；未列入者审计报缺。
 * limited 四技（ts_009 扫穴犁庭 / ts_022 攻其不备 / ts_023 夜半劫营 / ts_030 赤壁东风）
 * 是触发时 >88% 的无条件/准无条件强技，务必限量。
 */
export const TACTICAL_ASSIGN_TIER: Readonly<Record<string, TacticalAssignTier>> = {

    // 强化系
    ts_001: 'common', ts_002: 'common', ts_003: 'common', ts_004: 'common',
    ts_005: 'common', ts_006: 'ai_defensive', ts_007: 'common', ts_008: '攻击',
    // 命运系
    // 兵力系
    // 战损系（未接引擎，先定分配意图）
    ts_037: '防御', ts_038: '双行', ts_039: '攻击',
    // 对抗系（未接引擎）
    // 士气系
    // 贴合系（不进随机池，只走写死分配，标 limited 以防万一）
    ts_062: 'limited', ts_063: 'limited', ts_064: '攻击', ts_065: '防御',
    // 第二批 T1 补登记（ts_077-091：此前定义了贴合技却漏登 limited）
    // 第五批 T1 补贴合（ts_117-126）
    // 第六批 T1 补贴合（ts_127-155）
    ts_139: '攻击', ts_140: '攻击', ts_141: '攻击', ts_142: '攻击',
    // 第七批（ts_156-167）
    ts_160: '防御', ts_161: '攻击', ts_162: '攻击', ts_163: '攻击',
    // 第八批（ts_168-181）
};

export function getTacticalAssignTier(skillId: string): TacticalAssignTier | null {
    return TACTICAL_ASSIGN_TIER[skillId] ?? null;
}

// ── 技能标签：第一标签 双行/攻击/防御 ──
export type SkillUsageTag = '双行' | '攻击' | '防御';

/** 第一标签查找表（id → 双行/攻击/防御），未列入 = 双行 */export const SKILL_CHARACTER: Readonly<Record<string, string>> = {
    ts_002: '马谡',
    ts_003: '曹操/卫青',
    ts_005: '乐毅',
    ts_009: '李长吉/白起',
    ts_010: '杜甫',
    ts_012: '项羽',
    ts_013: '韩信',
    ts_017: '陆逊',
    ts_021: '王通',
    ts_028: '宋襄公',
    ts_030: '周瑜/黄盖',
    ts_034: '元景安',
    ts_035: '汉高祖刘邦',
    ts_037: '国语',
    ts_043: '慕容恪',
    ts_044: '赵武灵王',
    ts_048: '诸葛亮/赵云',
    ts_049: '曹刿',
    ts_052: '霍去病',
    ts_057: '完颜阿骨打',
    ts_059: '成吉思汗',
    ts_060: '李舜臣',
    ts_062: '霍去病/艾哈迈德/哈里辛格/桑贾尔/完颜娄室/暴鸢/鬬廉/宗义智/酒井忠次/雅库布萨法尔/鱼有沼/侯安都/曹景宗/吴复/高延寿/宋老生/程名振/王颀/阿波/高琼',
    ts_063: '常遇春',
    ts_066: '冒顿单于/冒顿',
    ts_067: '多尔衮',
    ts_068: '李自成',
    ts_070: '成吉思汗',
    ts_071: '项羽',
    ts_074: '吕布',
    ts_076: '完颜宗弼',
    ts_078: '吕蒙',
    ts_079: '薛仁贵/李定国',
    ts_082: '李存孝',
    ts_083: '高宠/王彦章',
    ts_085: '完颜宗弼',
    ts_088: '李世民',
    ts_089: '徐达',
    ts_091: '吴玠',
    ts_092: '岳飞',
    ts_093: '戚继光',
    ts_094: '蓝玉',
    ts_100: '耿恭',
    ts_102: '成吉思汗',
    ts_108: '苻坚',
    ts_111: '刘备/黎利/李克用/刘邦/李存勖/阮福映/山中鹿介',
    ts_113: '刘裕/张议潮',
    ts_115: '左宗棠/曹操/论钦陵/慕容恪/阿伏至罗/皇甫嵩/玛纳斯/盖嘉运',
    ts_116: '苏定方',
    ts_117: '姜子牙/姬发',
    ts_118: '李世民',
    ts_119: '蒙恬',
    ts_120: '白居易',
    ts_122: '汉武帝/阇耶跋摩/摩诃末/迦腻色迦/兰甘亨/赤松德赞',
    ts_125: '黄巢',
    ts_128: '刘秀',
    ts_129: '沐英/莽应龙/纳黎萱/莽瑞体/阿奴律陀',
    ts_131: '侯君集',
    ts_132: '诸葛亮/达延汗',
    ts_135: '耿恭',
    ts_136: '速不台',
    ts_137: '李牧',
    ts_139: '唐太宗',
    ts_140: '冒顿',
    ts_141: '阿拉伯/蒙古',
    ts_142: '林邑/占城',
    ts_148: '光武帝刘秀',
    ts_150: '吕布/沙陀那速/扎哈罗/塔库纳/齐查伊/穆吉尔',
    ts_154: '刘黑闼',
    ts_155: '刘秀',
    ts_156: '武田信玄/真田幸村',
    ts_157: '苻坚',
    ts_158: '白起',
    ts_162: '邓艾',
    ts_163: '陈庆之',
    ts_164: '田单',
    ts_166: '左传',
    ts_167: '张巡',
    ts_168: '刘备',
    ts_169: '王平',
    ts_171: '武田信玄/上杉谦信',
    ts_172: '诸葛亮',
    ts_173: '周亚夫',
    ts_174: '刘裕',
    ts_175: '孙策',
    ts_177: '勾践',
    ts_178: '马援',
    ts_179: '高长恭',
    ts_180: '甘宁',
    ts_181: '李愬',
    ts_183: '黄盖',
    ts_185: '周亚夫/司马穰苴',
    ts_187: '曾国藩',
    ts_189: '赵奢',
    ts_190: '司马炎/姚苌/朱温/董卓/陈敏/王建/顿莫贺达干/沮渠蒙逊/杨难当/刘聪/萧衍/刘渊/皇甫晖/蒲鲜万奴/论恐热/耿精忠/刘隐/阿里木库力/林士弘/公孙五楼/欧阳頠/李昪/刘知远/慕容永/刘龑',
    ts_191: '秦国',
    ts_192: '李陵',
    ts_196: '薛仁贵/斛律光',
    ts_197: '郝昭',
    ts_199: '白起',
    ts_200: '春秋战国',
    ts_202: '李靖',
    ts_203: '章邯',
    ts_204: '李渊',
    ts_205: '张良/述律平/张镐/黄歇/德薛禅/蒯越/索额图/杨应琚/羊舌职/阿卜杜拉提夫/苌弘',
    ts_207: '匈奴/突厥/蹋顿/头罗曼/呴犁湖/末羯/夸吕/阿史德颉利/呼衍王/郁久闾大檀',
    ts_211: '项羽',
    ts_212: '戚继光',
    ts_213: '公孙瓒',
    ts_214: '赵武灵王',
    ts_215: '耿恭',
    ts_216: '薛仁贵',
    ts_219: '李陵/麴义',
    ts_220: '霍去病/阿史那燕都',
    ts_221: '吕布',
    ts_222: '白起',
    ts_223: '乐毅/李勣',
    ts_224: '耿弇',
    ts_228: '关羽/张飞',
    ts_229: '拓跋珪',
    ts_230: '苏定方',
    ts_232: '霍去病',
    ts_233: '耶律阿保机',
    ts_235: '孙策/长宗我部元亲',
    ts_236: '呼延灼/庞统',
    ts_237: '西夏/阿拉伯',
    ts_238: '刘备/石勒/高欢',
    ts_239: '张骞/班超',
    ts_240: '陈胜/吴广',
    ts_242: '李靖/陈霸先',
    ts_244: '刘邦/大祚荣/李成桂/固始汗/李特/阿史那骨咄禄/耶律留哥/乞伏炽磐/猎骄靡/阿睦尔撒纳',
    ts_245: '英布',
    ts_246: '郑成功/皇太极/徐达/丰臣秀吉/朱元璋/伯颜',
    ts_247: '苏秦/袁绍/骨力裴罗/吉亚斯丁/仆固怀恩/社仑/足利尊氏/脱欢/段思平/法昂/阁罗凤/尚巴志/悉诺逻/图格里勒/札木合/登巴泽仁/阿布哈里斯/阿巴岱汗/海达尔/王汗/敢木丁',
    ts_248: '岳飞',
    ts_249: '蒙恬',
    ts_250: '李元昊/野利旺荣',
    ts_252: '李存勖/窦融',
    ts_257: '关羽',
    ts_258: '先轸',
    ts_259: '柴荣/李世民',
    ts_261: '周瑜',
    ts_262: '檀道济',
    ts_263: '王坚/铁铉/于谦/朱文正/颜真卿/史可法/孟宗政/陆康/严颜/何腾蛟/瞿式耜/王师范/黄道周/谢枋得/颜杲卿',
    ts_264: '赵充国',
    ts_265: '张飞/贾逵',
    ts_266: '王忠嗣/郭子仪',
    ts_267: '楚庄王',
    ts_268: '诸葛亮/姜维',
    ts_269: '努尔哈赤',
    ts_270: '陈汤',
    ts_271: '秦良玉',
    ts_273: '曹仁',
    ts_274: '常遇春',
    ts_275: '李如松',
    ts_276: '卫青',
    ts_277: '陈汤',
    ts_278: '陆逊',
    ts_279: '雷万春/张巡',
    ts_280: '朱棣',
    ts_281: '上杉谦信',
    ts_282: '成吉思汗',
    ts_283: '邓艾/巴都尔萨野/司马错/孟莱/庄蹻/高仙芝',
    ts_284: '田单',
    ts_285: '卫青',
    ts_286: '吴玠',
    ts_287: '杨素',
    ts_288: '戚继光/郑成功/李亿祺/卢镗',
    ts_289: '汉武帝',
    ts_290: '李广',
    ts_291: '阿桂/岳钟琪/策楞/郎坦/德兴阿',
    ts_294: '马谡',
    ts_295: '高欢',
    ts_296: '耿恭/郭昕',
    ts_297: '常遇春',
    ts_298: '梁师都',
    ts_299: '张巡',
    ts_301: '李光弼',
    ts_302: '孙策',
    ts_303: '占城/林邑',
    ts_305: '常遇春',
    ts_306: '李存勖',
    ts_307: '蓝玉',
    ts_309: '张辽',
    ts_310: '王玄策/石敬瑭',
    ts_311: '石勒',
    ts_312: '赵武灵王',
    ts_313: '张骞/大月氏/耶律大石/昔班尼',
    ts_314: '乐毅/沙普尔',
    ts_315: '孙膑',
    ts_317: '周武王',
    ts_320: '于谦',
    ts_323: '瓦氏夫人',
    ts_325: '邓艾',
    ts_326: '吴玠',
    ts_327: '多尔衮/清军',
    ts_328: '郭子仪',
    ts_329: '苏定方',
    ts_330: '皇太极',
    ts_331: '甘宁',
    ts_333: '袁绍',
    ts_334: '沐英',
    ts_335: '沐英',
    ts_336: '陈胜/方腊/林爽文/王聪儿/韦朝元/陈开',
    ts_341: '苏定方',
    ts_342: '杨素/来护儿/高骈',
    ts_344: '邓艾',
    ts_345: '朱元璋',
    ts_346: '黄盖',
    ts_347: '郑成功',
    ts_348: '南汉/占城',
    ts_349: '刘备',
    ts_350: '王猛',
    ts_351: '游击战术',
    ts_352: '汉武帝',
    ts_353: '黄巢/杨安儿/郭太/符南蛇/侬智高/奢崇明/潘新简/滇零/陈吊眼/邓茂七/吴勉/石柳邓/黄瓜四/吴八月/裘甫/包利/安邦彦/库尔班/覃垕/妥明/青滚杂卜/大延琳/赵普胜/叶宗留',
    ts_354: '成吉思汗',
    ts_355: '宇文化及/项羽',
    ts_356: '王平',
    ts_357: '班超/陈汤',
    ts_358: '完颜宗弼/斛律金',
    ts_359: '卫青',
    ts_360: '苏定方/杨怀',
    ts_365: '周瑜/黄盖',
    ts_367: '班超/陈汤',
    ts_369: '耿恭/莎罗奔/索诺木衮布/杨应龙',
    ts_370: '邓艾',
    ts_373: '岳飞',
    ts_374: '王坚/岑猛/爨龙颜/木增/爨习/囊谦加波/尉仇台/囊谦千户/孔萨益多/冉守忠/申伯/爨归王',
    ts_375: '高长恭',
    ts_377: '李广',
    ts_379: '吕蒙',
    ts_381: '杨再兴',
    ts_383: '祖逖',
    ts_384: '郭嘉',
    ts_385: '张巡',
    ts_386: '耿恭',
    ts_387: '卫青/马殷/李暠/张轨/奢香夫人/赵佗/范长生/冼夫人/士燮/王审知/留从效/汪华',
    ts_390: '双行',
    ts_400: '三十六计',
    ts_408: '晋献公/三十六计',
    ts_411: '孙武',
    ts_414: '虞诩',
    ts_415: '连环计',
    ts_416: '田单',
    ts_417: '黄盖',
    ts_418: '王允',
    ts_420: '戚继光',
    ts_421: '赵云',
    ts_426: '霍去病',
    ts_428: '孙膑',
    ts_429: '荆轲',
    ts_431: '先轸',
    ts_434: '陈庆之',
    ts_438: '李牧',
    ts_439: '郑成功/村上武吉',
    ts_440: '黄盖',
    ts_443: '刘备',
    ts_444: '李世民',
    ts_445: '朱文正',
    ts_450: '张飞',
    ts_451: '田单',
    ts_453: '曹操/屈利失',
    ts_454: '孙膑/沈希仪/俞大猷',
    ts_456: '卫青',
    ts_458: '刘裕',
    ts_461: '耿恭',
    ts_462: '项羽/刘邦',
    ts_467: '邓艾',
    ts_470: '张巡',
    ts_472: '马援',
    ts_474: '李愬',
    ts_475: '晋献公',
    ts_479: '司马懿',
    ts_480: '卫青',
    ts_482: '左传/阶伯',
    ts_483: '占城/林邑',
    ts_484: '田忌',
    ts_485: '沐英',
    ts_487: '张巡',
    ts_488: '冒顿单于',
    ts_489: '苏秦/张仪',
    ts_490: '乐毅',
    ts_491: '项羽/燕帖木儿',
    ts_492: '刘备',
    ts_495: '黄巢',
    ts_498: '帕提亚',
    ts_499: '拖雷',
    ts_501: '朱元璋',
    ts_502: '田单',
    ts_507: '慕容恪',
    ts_509: '张巡/楠木正成/金时敏/诹访赖重/清水宗治/宇都宫广纲/帖木儿灭里',
    ts_514: '刘裕',
    ts_515: '邓艾',
    ts_516: '薛仁贵',
    ts_517: '庞涓/孙膑',
    ts_522: '南汉',
    ts_523: '沐英',
    ts_526: '晋文公',
    ts_530: '袁绍/曹议金/吴棠/范蔓/突地稽/赵范/刀应勐/巴尔达齐/吴允诚/奥巴/札合敢不/三音诺颜/阿剌兀思/多尔济',
    ts_531: '刘黑闼',
    ts_532: '完颜宗弼',
    ts_533: '司马懿/孟烈伦',
    ts_534: '卫青/绰儿马罕/甘丹才旺',
    ts_535: '匈奴/工布莽布支',
    ts_536: '张飞',
    ts_539: '高长恭/杨再兴',
    ts_540: '公孙瓒',
    ts_542: '郝昭',
    ts_543: '马超',
    ts_546: '戚继光',
    ts_547: '乐毅',
    ts_549: '突厥/匈奴',
    ts_550: '游击战术',
    ts_555: '祖逖',
    ts_557: '张巡/北条氏康',
    ts_560: '彭越/黄巢',
    ts_561: '桓温',
    ts_564: '赵武灵王',
    ts_565: '匈奴/突厥',
    ts_566: '张飞',
    ts_568: '王猛',
    ts_570: '刘裕',
    ts_571: '孙膑',
    ts_572: '郝昭',
    ts_573: '卫青',
    ts_575: '邓艾',
    ts_577: '晋献公',
    ts_580: '李牧/米南德',
    ts_583: '马援',
    ts_587: '郝昭',
    ts_588: '郭子仪',
    ts_590: '耿恭/卢象升/冉闵/孙传庭/大谷吉继',
    ts_591: '白起',
    ts_592: '苏秦/张仪',
    ts_594: '岳飞',
    ts_597: '苻坚/王翦',
    ts_599: '陈平',
    ts_600: '光武帝',
    ts_603: '孙武',
    ts_605: '张飞',
    ts_606: '李克用',
    ts_611: '张巡/唐缯',
    ts_612: '林邑/占城',
    ts_613: '田忌',
    ts_615: '成吉思汗',
    ts_620: '晋文公',
    ts_622: '匈奴',
    ts_623: '冒顿单于',
    ts_628: '邓艾/李晟/巴赫拉姆楚宾',
    ts_629: '韩信/平知盛',
    ts_631: '陈平',
    ts_632: '司马懿',
    ts_633: '孙武',
    ts_634: '孙武',
    ts_637: '吕蒙',
    ts_640: '司马懿',
    ts_641: '郝昭',
    ts_643: '匈奴/突厥',
    ts_646: '王猛',
    ts_647: '刘备/达什巴图尔/车臣汗硕垒',
    ts_650: '晋文公',
    ts_652: '黄盖',
    ts_655: '司马懿',
    ts_656: '刘备/卫律',
    ts_658: '乐毅',
    ts_662: '王翦/刘仁恭',
    ts_663: '完颜铁哥/周德威/阿尔斯兰/契苾何力/朱邪赤心/戈达尔兹/姚兕/苏赫拉/南部晴政',
    ts_668: '周亚夫/雅尔贝格',
    ts_671: '张巡',
    ts_673: '袁绍/金首露/盖瓦姆',
    ts_676: '张飞',
    ts_677: '田单',
    ts_678: '李渊/李世民',
    ts_680: '常遇春',
    ts_684: '庞涓/孙膑',
    ts_685: '彭越/张献忠/石达开/黄巢/白狄子/根特木尔/汪直',
    ts_686: '廉颇',
    ts_687: '刘裕',
    ts_689: '成吉思汗',
    ts_691: '努尔哈赤',
    ts_692: '邓艾',
    ts_693: '卫青/霍去病',
    ts_694: '李存勖',
    ts_696: '游击战术',
    ts_699: '袁崇焕',
    ts_701: '王猛',
    ts_711: '冉闵',
    ts_712: '刘备/扩廓帖木儿/于禁/金通精/张煌言/阿大/菊池武光/毛文龙/杨完者/巴奇曼/迷唐/阿史那贺鲁/周迪/车鼻施/回离保/廖化/白彦虎/去胡来',
    ts_714: '阿桂',
    ts_715: '陈汤',
    ts_716: '刘仁恭',
    ts_718: '张巡/曲端/黄青云/僧格朗杰/索劼/马福寿/扎什端珠布/阮文张/陶洪/侯弘远/申从岳/南杰旺秋/宋景阳/区大任',
    ts_722: '祖逖',
    ts_723: '黄忠',
    ts_724: '祖逖',
    ts_725: '侯君集',
    ts_726: '李陵',
    ts_728: '耿恭/李陵',
    ts_729: '司马懿',
    ts_732: '张巡/许远',
    ts_736: '李陵',
    ts_742: '苻坚',
    ts_743: '马谡',
    ts_744: '韩信',
    ts_746: '公孙瓒',
    ts_747: '耿弇',
    ts_748: '孙膑',
    ts_749: '张辽',
    ts_750: '三十六计延展',
    ts_751: '晋文公重耳',
    ts_754: '赵云',
    ts_756: '关羽/鲁肃',
    ts_760: '周武王',
    ts_761: '诸葛亮',
    ts_763: '三十六计延展',
    ts_765: '陆逊',
    ts_766: '来俊臣/周兴',
    ts_767: '太极兵法',
    ts_769: '王允',
    ts_770: '诸葛亮',
    ts_772: '曹操',
    ts_773: '吕布',
    ts_774: '祢衡',
    ts_775: '韩非子',
    ts_776: '田单',
    ts_777: '李广/沙尔虎达/折御卿/富俊',
    ts_778: '孙膑/百地丹波',
    ts_779: '张世杰',
    ts_780: '戚继光',
    ts_781: '朱文正/沙牟奢允',
    ts_782: '尉仇台',
    ts_784: '多尔衮',
    ts_786: '郭子仪',
    ts_787: '占婆王/刀更孟/且旺失加/谢尔/遮比/阿侬',
    ts_788: '班超',
    ts_789: '张巡/许远/巴蔓子',
    ts_790: '杨茂搜/氐王',
    ts_791: '板楯蛮/賨人/范目/朴胡',
    ts_792: '朱元璋/拉其特',
    ts_793: '陈友谅/思任发/思机法',
    ts_794: '真珠可汗',
    ts_795: '左宗棠',
    ts_796: '卫青/李广/图门吉尔嘎勒',
    ts_802: '耿恭',
    ts_807: '杨坚',
    ts_808: '骑兵战术',
};

export function getSkillCharacter(skillId: string): string | undefined {
    // 内联典故主名（编辑器写入）优先 → 散表
    const entry = getTacticalSkillEntry(skillId);
    if (entry?.ownerName) return entry.ownerName;
    return SKILL_CHARACTER[skillId];
}