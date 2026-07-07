/**
 * 战术技 v1 数据表（49 条定稿）
 * layer=tactical；战略技将来同表加 layer=strategic。
 * 本文件只定义数据，战斗挂钩见 TacticalSkillResolver.ts / GeneralSkillCombat.ts。
 */
import type { BattleType } from '../combat/CombatSystem';
import type { LandTerrainKind } from '../world/land-sea';

export type SkillLayer = 'tactical' | 'strategic';

/** 六系（戏码分类，供 UI / 分配 / 审计） */
export type TacticalSeries =
    | 'enhance'   // 强化系
    | 'fate'      // 命运系
    | 'troop'     // 兵力系
    | 'casualty'  // 战损系
    | 'counter';  // 对抗系

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
    | 'first_sortie_power_mult';

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

// ── 一、强化系 ─────────────────────────────────────────────
const ENHANCE: TacticalSkillEntry[] = [
    {
        id: 'ts_001', layer: 'tactical', series: 'enhance', index: 1,
        displayName: '百战不殆', sourceQuote: '《孙子兵法·谋攻》：“知彼知己，百战不殆。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.2, engineStatus: 'ready', legacyTacId: 'tac_01',
    },
    {
        id: 'ts_002', layer: 'tactical', series: 'enhance', index: 2,
        displayName: '居高临下', sourceQuote: '《后汉书·马援传》：“据高临下，势如劈竹。”',
        baseEffect: 'ally_power_mult', condition: 'terrain_mountain', phase: 'opening_roll',
        magnitude: 1.65, engineStatus: 'ready',
    },
    {
        id: 'ts_003', layer: 'tactical', series: 'enhance', index: 3,
        displayName: '长驱直入', sourceQuote: '《战国策·燕策》：“长驱至齐，齐王遁逃。”',
        baseEffect: 'ally_power_mult', condition: 'terrain_plain', phase: 'opening_roll',
        magnitude: 1.5, engineStatus: 'ready',
    },
    {
        id: 'ts_004', layer: 'tactical', series: 'enhance', index: 4,
        displayName: '中流击楫', sourceQuote: '《晋书·祖逖传》：“中流击楫而誓。”',
        baseEffect: 'ally_power_mult', condition: 'terrain_sea', phase: 'opening_roll',
        magnitude: 1.65, engineStatus: 'ready',
    },
    {
        id: 'ts_005', layer: 'tactical', series: 'enhance', index: 5,
        displayName: '摧城拔寨', sourceQuote: '《三国演义》：“先主怒……摧城拔寨。”',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_attacker', phase: 'opening_roll',
        magnitude: 1.45, engineStatus: 'ready',
    },
    {
        id: 'ts_006', layer: 'tactical', series: 'enhance', index: 6,
        displayName: '金城汤池', sourceQuote: '《汉书·蒯通传》：“皆为金城汤池，不可攻也。”',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_defender', phase: 'opening_roll',
        magnitude: 1.55, engineStatus: 'ready',
    },
    {
        id: 'ts_007', layer: 'tactical', series: 'enhance', index: 7,
        displayName: '原野交锋', sourceQuote: '《史记·项羽本纪》：“与汉王原野争锋。”',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
        // 【2026-07-03 主人定】描述写「野战加成」，但游戏中野战少、攻城多，故 battle_field
        // 引擎语义 = 进攻方加成：攻城/野战只要我方进攻即 ×1.25，仅守城方不吃（见 TacticalSkillResolver）。
        note: '原野争锋 ×1.25：描述为野战加成，实战按【进攻方】结算（攻城/野战通吃，守城不吃），避免野战稀少辜负名将',
    },
    {
        id: 'ts_008', layer: 'tactical', series: 'enhance', index: 8,
        displayName: '以寡击众', sourceQuote: '《三国志·吴主传》：“能以寡击众者，唯有周瑜。”',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.55, engineStatus: 'ready',
    },
    {
        id: 'ts_009', layer: 'tactical', series: 'enhance', index: 9,
        displayName: '扫穴犁庭', sourceQuote: '《明史》：“犁其庭，扫其闾，绝其本根。”',
        baseEffect: 'ally_power_mult', condition: 'enemy_different_culture', phase: 'opening_roll',
        magnitude: 1.25, engineStatus: 'ready',
        note: '需将势力文化区传入战斗层；【2026-07-03】×1.3→×1.25：跨文化交战率~92%=准无条件，×1.3 长期压过基准锚点',
    },
    {
        id: 'ts_010', layer: 'tactical', series: 'enhance', index: 10,
        displayName: '擒贼擒王', sourceQuote: '《杜甫·前出塞》：“射人先射马，擒贼先擒王。”',
        baseEffect: 'ally_power_mult', condition: 'enemy_famous_general', phase: 'opening_roll',
        magnitude: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_011', layer: 'tactical', series: 'enhance', index: 11,
        displayName: '绝地反击', sourceQuote: '《孙子兵法·九地》：“投之亡地然后存，陷之死地然后生。”',
        baseEffect: 'ally_power_mult', condition: 'side_comeback', phase: 'opening_roll',
        magnitude: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_049', layer: 'tactical', series: 'enhance', index: 49,
        displayName: '一鼓作气', sourceQuote: '《左传·庄公十年》：“夫战，勇气也。一鼓作气，再而衰，三而竭。”',
        baseEffect: 'first_sortie_power_mult', condition: 'first_sortie', phase: 'opening_roll',
        magnitude: 1.25, engineStatus: 'ready',
        note: '出征首战×1.25（桥接 ally_mult_1_2 + first_sortie 门控）；契合名将远征首战爆发看点；原士气系并入强化系',
    },
];

// ── 二、命运系 ─────────────────────────────────────────────
const FATE: TacticalSkillEntry[] = [
    {
        id: 'ts_012', layer: 'tactical', series: 'fate', index: 12,
        displayName: '破釜沉舟', sourceQuote: '《史记·项羽本纪》：“皆沉船，破釜甑，烧庐舍。”',
        baseEffect: 'luck_variance_self', condition: 'self_troops_below_enemy_pct', phase: 'opening_roll',
        magnitude: 0.7, luckMin: 0.5, luckMax: 1.5, engineStatus: 'ready',
        mutexGroup: 'deep_gamble',
        note: '深劣势(本方<敌70%)·纯方差[0.5,1.5]；与 ts_020 济河焚舟同 deep_gamble 组二选一（本技全开方差博上限，济河下限0.9稳赌）；巨鹿以少击多决死',
    },
    {
        id: 'ts_013', layer: 'tactical', series: 'fate', index: 13,
        displayName: '背水一战', sourceQuote: '《史记·淮阴侯列传》：“信乃使万人先行，出，背水阵。”',
        baseEffect: 'luck_variance_self', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.65, luckMax: 1.35, engineStatus: 'ready',
    },
    {
        id: 'ts_014', layer: 'tactical', series: 'fate', index: 14,
        displayName: '步步为营', sourceQuote: '《三国志·陆逊传》：“未至十余里，步步为营。”',
        baseEffect: 'luck_lock_self', condition: 'always', phase: 'opening_roll',
        magnitude: 1.0, engineStatus: 'ready',
    },
    {
        id: 'ts_015', layer: 'tactical', series: 'fate', index: 15,
        displayName: '进退有度', sourceQuote: '《左传·成公十六年》：“师之耳目，在吾旗鼓，进退有度。”',
        baseEffect: 'luck_variance_self', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.9, luckMax: 1.1, engineStatus: 'ready',
    },
    {
        id: 'ts_016', layer: 'tactical', series: 'fate', index: 16,
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
        id: 'ts_018', layer: 'tactical', series: 'fate', index: 18,
        displayName: '死地后生', sourceQuote: '《孙膑兵法》：“必死者可生，必生者可死。”',
        baseEffect: 'luck_variance_self', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.5, luckMax: 1.5, engineStatus: 'ready',
        note: '浅劣势(本方<敌100%)·独占方差[0.5,1.5]；破釜/济河需<70%敌不触发此窗口→死地在70%~100%劣势区独占，不再被济河严格压制',
    },
    {
        id: 'ts_019', layer: 'tactical', series: 'fate', index: 19,
        displayName: '风声鹤唳', sourceQuote: '《晋书·谢玄传》：“闻风声鹤唳，皆以为王师已至。”',
        baseEffect: 'luck_variance_enemy', condition: 'battle_siege_defender', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.5, luckMax: 1.5, engineStatus: 'ready',
        note: '扰敌 luck（作用于攻方掷点）；【2026-07-03】always→守城防御方限定：淝水系防御战，无条件扰敌全表最强(+19pt)过载；守城技触发率天然低，落「AI守将吃翻盘技」受众分层',
    },
    {
        id: 'ts_020', layer: 'tactical', series: 'fate', index: 20,
        displayName: '济河焚舟', sourceQuote: '《左传·僖公二十八年》：“济河焚舟，示无还心。”',
        baseEffect: 'luck_variance_self', condition: 'self_troops_below_enemy_pct', phase: 'opening_roll',
        magnitude: 0.7, luckMin: 0.9, luckMax: 1.5, engineStatus: 'ready',
        mutexGroup: 'deep_gamble',
        note: '深劣势(本方<敌70%)·上偏稳赌[0.9,1.5]均值1.2；与 ts_012 破釜沉舟同 deep_gamble 组二选一（本技下限0.9稳，破釜全开方差博上限）',
    },
];

// ── 三、兵力系 ─────────────────────────────────────────────
const TROOP: TacticalSkillEntry[] = [
    {
        id: 'ts_021', layer: 'tactical', series: 'troop', index: 21,
        displayName: '先声夺人', sourceQuote: '《左传·襄公二十六年》：“先人有夺人之心。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready', legacyTacId: 'tac_02',
    },
    {
        id: 'ts_022', layer: 'tactical', series: 'troop', index: 22,
        displayName: '攻其不备', sourceQuote: '《孙子兵法·计》：“攻其无备，出其不意。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        // 【2026-07-03】削20%→15%：always 高频 + 103 将持有，削20%→触发时~90% 超高频上限88%。
        // 降至15%→×1.176→~82%，回归「广发型温和削兵」；削敌阶梯 先声夺人10% < 本技15% < 夜半劫营25%(稀有个位数名将)。
    },
    {
        id: 'ts_023', layer: 'tactical', series: 'troop', index: 23,
        displayName: '夜半劫营', sourceQuote: '《三国志·甘宁传》：“夜衔枚至曹公营，斩首数十级。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.25, engineStatus: 'ready',
        note: '稀有大档；【2026-07-03】30%→25%：削30% 胜率~99% 无悬念；稀有度靠分配层（仅个位数名将），不加逆局门槛（夜袭=开局奇袭）',
    },
    {
        id: 'ts_024', layer: 'tactical', series: 'troop', index: 24,
        displayName: '反戈一击', sourceQuote: '《尚书·武成》：“前徒倒戈，攻于后以北。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'side_comeback', phase: 'pre_opening_troops',
        magnitude: 0.25, engineStatus: 'ready',
    },
    {
        id: 'ts_025', layer: 'tactical', series: 'troop', index: 25,
        displayName: '重整旗鼓', sourceQuote: '《左传·成公二年》：“师乃复整旗鼓。”',
        baseEffect: 'ally_add_troops_opening', condition: 'ratio_underdog', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '补兵封顶开战上限；仅兵力少于敌军时触发（逆风局战前重整）',
    },
    {
        id: 'ts_026', layer: 'tactical', series: 'troop', index: 26,
        displayName: '百折不挠', sourceQuote: '《汉书·蔡邕传》：“百折不挠者，期报国也。”',
        baseEffect: 'ally_add_troops_comeback', condition: 'side_comeback', phase: 'mid_battle_comeback',
        magnitude: 0.12, engineStatus: 'ready', legacyTacId: 'tac_06',
        note: '逆局归队，按开战兵力×0.12补员，封顶开战上限（2026-07-04 由0.2下调）',
    },
    {
        id: 'ts_027', layer: 'tactical', series: 'troop', index: 27,
        displayName: '四面楚歌', sourceQuote: '《史记·项羽本纪》：“夜闻汉军四面皆楚歌。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_siege_attacker', phase: 'pre_opening_troops',
        magnitude: 0.222, engineStatus: 'ready',
    },
    {
        id: 'ts_028', layer: 'tactical', series: 'troop', index: 28,
        displayName: '半渡而击', sourceQuote: '《孙子兵法·行军》：“令半渡而击之，利。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'terrain_sea', phase: 'pre_opening_troops',
        magnitude: 0.2, engineStatus: 'ready',
        mutexGroup: 'water_opening_cut',
    },
    {
        id: 'ts_029', layer: 'tactical', series: 'troop', index: 29,
        displayName: '肉薄骨并', sourceQuote: '《汉书·陈汤传》：“肉薄骨并，血流成阵。”',
        baseEffect: 'dual_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.1, engineStatus: 'ready',
        note: '火牛陷阵大档=15% 皮肤，同机制',
    },
    {
        id: 'ts_030', layer: 'tactical', series: 'troop', index: 30,
        displayName: '借风纵火', sourceQuote: '《三国志·吴书·周瑜传》：“时风盛猛，悉延烧岸上营落。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'siege_attacker_on_water', phase: 'pre_opening_troops',
        magnitude: 0.4, engineStatus: 'ready',
        mutexGroup: 'water_opening_cut',
    },
];

// ── 四、战损系 ─────────────────────────────────────────────
const CASUALTY: TacticalSkillEntry[] = [
    {
        id: 'ts_031', layer: 'tactical', series: 'casualty', index: 31,
        displayName: '游刃有余', sourceQuote: '《庄子·养生主》：“恢恢乎其于游刃必有余地矣。”',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.35, engineStatus: 'ready',
    },
    {
        id: 'ts_032', layer: 'tactical', series: 'casualty', index: 32,
        displayName: '兵不血刃', sourceQuote: '《荀子·议兵》：“远者慕其德，兵不血刃。”',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.6, engineStatus: 'ready',
    },
    {
        id: 'ts_033', layer: 'tactical', series: 'casualty', index: 33,
        displayName: '困兽犹斗', sourceQuote: '《左传·宣公十二年》：“困兽犹斗，况国相乎！”',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '败时咬人：胜方本场战损×1.5；胜方保底存活 10% 初始兵',
    },
    {
        id: 'ts_034', layer: 'tactical', series: 'casualty', index: 34,
        displayName: '宁为玉碎', sourceQuote: '《北齐书·元景安传》：“大丈夫宁为玉碎，不为瓦全。”',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 2.0, engineStatus: 'ready',
        note: '败时咬人：胜方本场战损×2；胜方保底存活 10% 初始兵',
    },
    {
        id: 'ts_035', layer: 'tactical', series: 'casualty', index: 35,
        displayName: '休养生息', sourceQuote: '《唐书·高祖纪》：“扫除烦苛，与民休息。”',
        baseEffect: 'post_recovery_rate', condition: 'always', phase: 'post_battle',
        magnitude: 0.5, engineStatus: 'ready',
    },
    {
        id: 'ts_036', layer: 'tactical', series: 'casualty', index: 36,
        displayName: '爱兵如子', sourceQuote: '《孙子兵法·地形》：“视卒如婴儿，故可与之赴深溪。”',
        baseEffect: 'post_recovery_rate', condition: 'always', phase: 'post_battle',
        magnitude: 0.7, engineStatus: 'ready',
    },
    {
        id: 'ts_037', layer: 'tactical', series: 'casualty', index: 37,
        displayName: '众志成城', sourceQuote: '《国语·周语下》：“众心成城，众口铄金。”',
        baseEffect: 'win_casualty_reduction', condition: 'battle_siege_defender', phase: 'mid_battle_passive',
        magnitude: 0.55, engineStatus: 'ready',
        note: '守城胜时战损再减半',
    },
    {
        id: 'ts_038', layer: 'tactical', series: 'casualty', index: 38,
        displayName: '虽败犹荣', sourceQuote: '《晋书·羊祜传》：“虽败犹有荣也。”',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'lose_as_underdog', phase: 'post_battle',
        magnitude: 2.0, engineStatus: 'ready',
        note: '以少敌多而败，咬人：胜方本场战损×2；胜方保底存活 10% 初始兵',
    },
    {
        id: 'ts_039', layer: 'tactical', series: 'casualty', index: 39,
        displayName: '斩草除根', sourceQuote: '《左传·隐公六年》：“绝其本根，勿使能殖。”',
        baseEffect: 'lose_zero_enemy_recovery', condition: 'always', phase: 'post_battle',
        magnitude: 0, engineStatus: 'ready',
        note: '我败时，胜方战后恢复率归零',
    },
    {
        id: 'ts_040', layer: 'tactical', series: 'casualty', index: 40,
        displayName: '如臂使指', sourceQuote: '《汉书·贾谊传》：“如身之使臂，臂之使指，莫不制从。”',
        baseEffect: 'elite_casualty_reduction', condition: 'has_elite_legion', phase: 'mid_battle_passive',
        magnitude: 0.2, engineStatus: 'ready',
    },
    {
        id: 'ts_041', layer: 'tactical', series: 'casualty', index: 41,
        displayName: '穷寇勿迫', sourceQuote: '《孙子兵法·军争》：“归师勿遏，围师必阙，穷寇勿迫。”',
        baseEffect: 'win_casualty_reduction', condition: 'enemy_troops_below_pct', phase: 'mid_battle_passive',
        magnitude: 0.4, engineStatus: 'ready',
        note: '敌兵<20% 时己方战损-40%',
    },
];

// ── 五、对抗系 ─────────────────────────────────────────────
const COUNTER: TacticalSkillEntry[] = [
    {
        id: 'ts_042', layer: 'tactical', series: 'counter', index: 42,
        displayName: '料敌机先', sourceQuote: '《孙膑兵法·威王问》：“料敌将者，以机先之。”',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '完全否决敌方战术技（视为无技）；敌无将/无技时不触发。magnitude=1 占位',
    },
    {
        id: 'ts_043', layer: 'tactical', series: 'counter', index: 43,
        displayName: '将计就计', sourceQuote: '《三国志·郭嘉传》注引：“因其计而用之。”',
        baseEffect: 'partial_negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 0.7, engineStatus: 'ready',
        note: 'magnitude=0.7 是【70%概率完全否决敌技】，非按比例缩放；字段名 partial_negate 易误读，实现走概率门（跨量纲通用+直播悬念）',
    },
    {
        id: 'ts_044', layer: 'tactical', series: 'counter', index: 44,
        displayName: '以子之矛', sourceQuote: '《韩非子·难一》：“以子之矛，陷子之盾，何如？”',
        baseEffect: 'steal_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 0.5, engineStatus: 'ready',
        note: '绝品：magnitude=0.5 → 50%概率夺取敌技为己用（按敌技五家族 switch 自用），失败则仅否决。【2026-07-03 定】不设100%夺取（否决+复制双收益过强，破坏49技内部平衡）；直播牌面「夺【破釜沉舟】为己用」',
    },
    {
        id: 'ts_045', layer: 'tactical', series: 'counter', index: 45,
        displayName: '诱敌深入', sourceQuote: '《孙子兵法·计》：“利而诱之，乱而取之。”',
        baseEffect: 'reflect_enemy_opening_cut', condition: 'battle_siege_defender', phase: 'pre_opening_troops',
        magnitude: 1, engineStatus: 'ready',
    },
    {
        id: 'ts_046', layer: 'tactical', series: 'fate', index: 46,
        displayName: '暗度陈仓', sourceQuote: '《史记·淮阴侯列传》：“明修栈道，暗度陈仓。”',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.55, luckMax: 1.0, engineStatus: 'ready',
        note: '地形对抗：引擎侧待接线（仅 combat-model 工具支持）',
    },
    {
        id: 'ts_047', layer: 'tactical', series: 'troop', index: 47,
        displayName: '声东击西', sourceQuote: '《通典·兵典》：“声言击东，其实击西。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.12, engineStatus: 'ready',
        note: '地形对抗：引擎侧待接线（仅 combat-model 工具支持）',
    },
    {
        id: 'ts_048', layer: 'tactical', series: 'casualty', index: 48,
        displayName: '空城退敌', sourceQuote: '《三国志·蜀书·赵云传》注引《云别传》：“更大开门，偃旗息鼓。”',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '己兵<敌30% 时，敌先声类技失效',
    },
];

// ── 七、T0 贴合战术技 ───────────────────────────────────────────
const UNIQUE_T0: TacticalSkillEntry[] = [
    {
        id: 'ts_051', layer: 'tactical', series: 'enhance', index: 51,
        displayName: '所向无前', sourceQuote: '《旧唐书·太宗本纪》：“义旗跃马，所向无前。”',
        baseEffect: 'ally_power_mult', condition: 'enemy_famous_general', phase: 'opening_roll',
        magnitude: 1.35, engineStatus: 'ready',
    },
    {
        id: 'ts_052', layer: 'tactical', series: 'enhance', index: 52,
        displayName: '封狼居胥', sourceQuote: '《汉书·霍去病传》：“封狼居胥山，禅于姑衍。”',
        baseEffect: 'first_sortie_power_mult', condition: 'first_sortie', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_053', layer: 'tactical', series: 'fate', index: 53,
        displayName: '无坚不摧', sourceQuote: '《吴子兵法·图国》：“击之必破，无坚不摧。”',
        baseEffect: 'luck_lock_self', condition: 'always', phase: 'opening_roll',
        magnitude: 1.15, engineStatus: 'ready',
    },
    {
        id: 'ts_054', layer: 'tactical', series: 'fate', index: 54,
        displayName: '流星坠营', sourceQuote: '《后汉书·光武帝纪》：“夜有流星坠营中，昼有云如坏山。”',
        baseEffect: 'luck_variance_enemy', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.1, luckMax: 0.8, engineStatus: 'ready',
    },
    {
        id: 'ts_056', layer: 'tactical', series: 'troop', index: 56,
        displayName: '乘夜掩至', sourceQuote: '《旧唐书·李靖传》：“靖乃率骁骑三千...乘夜掩至定襄。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_siege_attacker', phase: 'pre_opening_troops',
        magnitude: 0.2, engineStatus: 'ready',
    },
    {
        id: 'ts_057', layer: 'tactical', series: 'enhance', index: 57,
        displayName: '满万无敌', sourceQuote: '《三朝北盟会编》载金国初年俗语：“女真兵若满万则不可敌。”',
        baseEffect: 'ally_power_mult', condition: 'self_troops_reach_ten_thousand', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_058', layer: 'tactical', series: 'enhance', index: 58,
        displayName: '并力一向', sourceQuote: '《孙子兵法·九地》：“并敌一向，千里杀将。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.25, engineStatus: 'ready',
    },
    {
        id: 'ts_059', layer: 'tactical', series: 'counter', index: 59,
        displayName: '长生天佑', sourceQuote: '大蒙古国圣旨固定起首：“长生天气力里，大福荫护助里”。',
        baseEffect: 'nullify_enemy_opening_cut', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 1.0, engineStatus: 'ready',
    },
    {
        id: 'ts_060', layer: 'tactical', series: 'fate', index: 60,
        displayName: '必死则生', sourceQuote: '《乱中日记》载鸣梁海战前军令：“必死则生，必生则死。”',
        baseEffect: 'recompute_comeback', condition: 'side_comeback', phase: 'mid_battle_comeback',
        magnitude: 1, comebackThreshold: 0.9, engineStatus: 'ready',
    },
    {
        id: 'ts_061', layer: 'tactical', series: 'troop', index: 61,
        displayName: '以短制长', sourceQuote: '陈国峻兵法名言：“以短制长，我国之兵法也。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_siege_defender', phase: 'pre_opening_troops',
        magnitude: 0.25, engineStatus: 'ready',
    },
];

// ── 八、T1 贴合战术技（15人） ───────────────────────────────────────────
const UNIQUE_T1: TacticalSkillEntry[] = [
    {
        id: 'ts_062', layer: 'tactical', series: 'enhance', index: 62,
        displayName: '长驱摧阵', sourceQuote: '《明史·成祖本纪》：“奉天靖难，推毂群帅。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.35, engineStatus: 'ready',
    },
    {
        id: 'ts_063', layer: 'tactical', series: 'troop', index: 63,
        displayName: '所向摧陷', sourceQuote: '《魏书·尔朱荣传》：“荣亲乘马，大呼陷阵，所向摧陷。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
    },
    {
        id: 'ts_064', layer: 'tactical', series: 'fate', index: 64,
        displayName: '虎穴奇袭', sourceQuote: '《后汉书·班超传》：“不入虎穴，不得虎子。当今之计，独有因夜以火攻虏。”',
        baseEffect: 'luck_variance_self', condition: 'self_troops_below_enemy_pct', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.6, luckMax: 2.0, engineStatus: 'ready',
    },
    {
        id: 'ts_065', layer: 'tactical', series: 'fate', index: 65,
        displayName: '凭坚摧锋', sourceQuote: '《明史·袁崇焕传》：“凭坚城用大炮，是以所向无前。”',
        baseEffect: 'luck_variance_enemy', condition: 'battle_siege_defender', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.1, luckMax: 0.8, engineStatus: 'ready',
    },
    {
        id: 'ts_066', layer: 'tactical', series: 'enhance', index: 66,
        displayName: '鸣镝所向', sourceQuote: '《史记·匈奴列传》：“鸣镝所射而不悉射者，斩之。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_067', layer: 'tactical', series: 'enhance', index: 67,
        displayName: '长驱入关', sourceQuote: '《清史稿·睿忠亲王多尔衮传》：“长驱入关，定鼎燕京。”',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_attacker', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_068', layer: 'tactical', series: 'troop', index: 68,
        displayName: '乘虚直捣', sourceQuote: '《明史纪事本末》：“也先乘虚直捣，势如破竹。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
    },
    {
        id: 'ts_069', layer: 'tactical', series: 'fate', index: 69,
        displayName: '出奇捣虚', sourceQuote: '《明史·扩廓帖木儿传》：“扩廓忽出奇兵捣之，大败明军。”',
        baseEffect: 'luck_variance_self', condition: 'always', phase: 'opening_roll',
        magnitude: 0.8, luckMin: 0.5, luckMax: 1.5, engineStatus: 'ready',
    },
    {
        id: 'ts_070', layer: 'tactical', series: 'enhance', index: 70,
        displayName: '席卷驰突', sourceQuote: '《新唐书·吐蕃传》：“遂并诸羌，雄霸西域。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_071', layer: 'tactical', series: 'enhance', index: 71,
        displayName: '锐不可当', sourceQuote: '《清史稿·藩部传》：“固始汗纠兵西指，锐不可当。”',
        baseEffect: 'ally_power_mult', condition: 'first_sortie', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_072', layer: 'tactical', series: 'enhance', index: 72,
        displayName: '回军突袭', sourceQuote: '《朝鲜王朝实录》：“大王回军靖难，定鼎立国。”',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.55, engineStatus: 'ready',
    },
    {
        id: 'ts_073', layer: 'tactical', series: 'fate', index: 73,
        displayName: '以弱敌强', sourceQuote: '《平吴大诰》：“以弱敌强，以寡敌众。”',
        baseEffect: 'luck_variance_self', condition: 'self_troops_below_enemy_pct', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.5, luckMax: 1.8, engineStatus: 'ready',
    },
    {
        id: 'ts_074', layer: 'tactical', series: 'enhance', index: 74,
        displayName: '前无坚阵', sourceQuote: '《后汉书·刘盆子传》：“拥众百万，前无坚阵。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_075', layer: 'tactical', series: 'fate', index: 75,
        displayName: '出没如神', sourceQuote: '《清史稿·洪秀全传》：“达开尤狡捷，出没如神。”',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.2, luckMax: 0.8, engineStatus: 'ready',
    },
    {
        id: 'ts_076', layer: 'tactical', series: 'enhance', index: 76,
        displayName: '如墙而进', sourceQuote: '《宋史·岳飞传》：“其将帅有破阵同死之心，故其军如墙而进。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_077', layer: 'tactical', series: 'fate', index: 77,
        displayName: '长围久困', sourceQuote: '《清史稿·太宗本纪》：“长围久困，城中食尽。”',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.55, luckMax: 0.95, engineStatus: 'ready',
    },
    {
        id: 'ts_078', layer: 'tactical', series: 'counter', index: 78,
        displayName: '白衣渡江', sourceQuote: '《三国志·吕蒙传》：“蒙乃密收兵，白衣渡江。”',
        baseEffect: 'steal_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1.0, engineStatus: 'ready',
    },
    {
        id: 'ts_079', layer: 'tactical', series: 'enhance', index: 79,
        displayName: '两蹶名王', sourceQuote: '《永历实录》：“定国两蹶名王，天下震动。”',
        baseEffect: 'ally_power_mult', condition: 'enemy_famous_general', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_080', layer: 'tactical', series: 'troop', index: 80,
        displayName: '踏雪破阵', sourceQuote: '《元史·睿宗传》：“会大雪，睿宗乘雪击之。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.25, engineStatus: 'ready',
    },
    {
        id: 'ts_081', layer: 'tactical', series: 'troop', index: 81,
        displayName: '苇泽奋击', sourceQuote: '《周书·文帝纪》：“于渭曲苇泽中奋击，大破之。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'self_troops_below_enemy_pct', phase: 'pre_opening_troops',
        magnitude: 0.35, engineStatus: 'ready',
    },
    {
        id: 'ts_082', layer: 'tactical', series: 'enhance', index: 82,
        displayName: '飞虎突阵', sourceQuote: '《旧五代史·武皇纪》：“军中号为飞虎子。”',
        baseEffect: 'first_sortie_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_083', layer: 'tactical', series: 'enhance', index: 83,
        displayName: '铁枪拔阵', sourceQuote: '《新五代史·王彦章传》：“持一铁枪，乘马大呼。”',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_084', layer: 'tactical', series: 'fate', index: 84,
        displayName: '铁骑蹙敌', sourceQuote: '《明史·李成梁传》：“多选健卒，铁骑蹙敌。”',
        baseEffect: 'luck_variance_self', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.9, luckMax: 1.45, engineStatus: 'ready',
    },
    {
        id: 'ts_085', layer: 'tactical', series: 'enhance', index: 85,
        displayName: '铁甲冲突', sourceQuote: '《台湾外纪》：“铁人冲突，所向披靡。”',
        baseEffect: 'first_sortie_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.35, engineStatus: 'ready',
    },
    {
        id: 'ts_086', layer: 'tactical', series: 'fate', index: 86,
        displayName: '以逸待劳', sourceQuote: '《新唐书·吐蕃传》：“钦陵悉众拒战，以逸待劳。”',
        baseEffect: 'luck_variance_enemy', condition: 'self_troops_below_enemy_pct', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.2, luckMax: 0.85, engineStatus: 'ready',
    },
    {
        id: 'ts_087', layer: 'tactical', series: 'casualty', index: 87,
        displayName: '鼓行而西', sourceQuote: '《辽史·太祖本纪》：“鼓行而西，迭克诸部。”',
        baseEffect: 'lose_zero_enemy_recovery', condition: 'always', phase: 'post_battle',
        magnitude: 1.0, engineStatus: 'ready',
    },
    {
        id: 'ts_088', layer: 'tactical', series: 'enhance', index: 88,
        displayName: '勒兵摧阵', sourceQuote: '《周书·突厥传》：“土门勒兵击之，大破茹茹。”',
        baseEffect: 'ally_power_mult', condition: 'first_sortie', phase: 'opening_roll',
        magnitude: 1.35, engineStatus: 'ready',
    },
    {
        id: 'ts_089', layer: 'tactical', series: 'enhance', index: 89,
        displayName: '风卷残云', sourceQuote: '《元史》：“统兵西讨，威震西域。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_090', layer: 'tactical', series: 'counter', index: 90,
        displayName: '合围聚歼', sourceQuote: '《清史稿》：“贼设疑诱战，我军中伏。”',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1.0, engineStatus: 'ready',
    },
    {
        id: 'ts_091', layer: 'tactical', series: 'fate', index: 91,
        displayName: '阻险御敌', sourceQuote: '《新唐书·渤海传》：“祚荣引众阻险以御之。”',
        baseEffect: 'luck_variance_enemy', condition: 'terrain_mountain', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.25, luckMax: 0.85, engineStatus: 'ready',
    },
    // ── 第三批 T1（13人；ID 避开迁移中的 095-106 区段）──
    {
        id: 'ts_092', layer: 'tactical', series: 'enhance', index: 92,
        displayName: '痛饮黄龙', sourceQuote: '《宋史·岳飞传》：“直抵黄龙府，与诸君痛饮尔。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_093', layer: 'tactical', series: 'casualty', index: 93,
        displayName: '鸳鸯阵法', sourceQuote: '《纪效新书·鸳鸯阵》；戚继光台州九战九捷。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.5, engineStatus: 'ready',
    },
    {
        id: 'ts_094', layer: 'tactical', series: 'enhance', index: 94,
        displayName: '廓清朔漠', sourceQuote: '《明史·徐达传》：“元帝北遁，遂克大都。”',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_107', layer: 'tactical', series: 'troop', index: 107,
        displayName: '倍道奔袭', sourceQuote: '《三国志·武帝纪》：“太祖乃留辎重，轻兵兼道以出……斩蹋顿。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.2, engineStatus: 'ready',
    },
    {
        id: 'ts_108', layer: 'tactical', series: 'enhance', index: 108,
        displayName: '倾国压境', sourceQuote: '《史记·白起王翦列传》：“王翦将兵六十万……大破楚军。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_109', layer: 'tactical', series: 'enhance', index: 109,
        displayName: '奋身陷阵', sourceQuote: '《宋史·太祖本纪》：“高平之战……士皆奋命，北汉兵大败。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.35, engineStatus: 'ready',
    },
    {
        id: 'ts_110', layer: 'tactical', series: 'fate', index: 110,
        displayName: '望旗遁去', sourceQuote: '《宋史·杨业传》：“契丹望见业旌旗即引去。”',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.15, luckMax: 0.85, engineStatus: 'ready',
    },
    {
        id: 'ts_111', layer: 'tactical', series: 'fate', index: 111,
        displayName: '屡蹶复振', sourceQuote: '《明史·李自成传》：“独与刘宗敏等十八骑溃围出……后复大炽。”',
        baseEffect: 'recompute_comeback', condition: 'side_comeback', phase: 'mid_battle_comeback',
        magnitude: 1, comebackThreshold: 0.85, engineStatus: 'ready',
    },
    {
        id: 'ts_112', layer: 'tactical', series: 'troop', index: 112,
        displayName: '夜度昆仑', sourceQuote: '《宋史·狄青传》：“青出敌不意……一夕绝昆仑关。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_siege_attacker', phase: 'pre_opening_troops',
        magnitude: 0.25, engineStatus: 'ready',
    },
    {
        id: 'ts_113', layer: 'tactical', series: 'enhance', index: 113,
        displayName: '义旗西指', sourceQuote: '《资治通鉴》：“张议潮以瓜、沙等十一州归于唐。”',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_114', layer: 'tactical', series: 'enhance', index: 114,
        displayName: '奇兵斩将', sourceQuote: '《信长公记》：“桶狭间山……今川义元讨死。”',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.5, engineStatus: 'ready',
    },
    {
        id: 'ts_115', layer: 'tactical', series: 'enhance', index: 115,
        displayName: '横扫西陲', sourceQuote: '《明史·帖木儿传》：“拓地数千里，西域诸国咸畏服。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_116', layer: 'tactical', series: 'enhance', index: 116,
        displayName: '摧军擒王', sourceQuote: '《旧唐书·苏定方传》：“前后灭三国，皆生擒其主。”',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_attacker', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    // ── 第四批 T1（补定义悬空 095-105；阿骨打/完颜宗弼另归位现成技，不占此段）──
    {
        id: 'ts_095', layer: 'tactical', series: 'casualty', index: 95,
        displayName: '练锐拒虏', sourceQuote: '《高丽史·尹瓘传》：“瓘请置别武班，练锐卒以备女真。”',
        baseEffect: 'win_casualty_reduction', condition: 'battle_siege_defender', phase: 'mid_battle_passive',
        magnitude: 0.55, engineStatus: 'ready',
    },
    {
        id: 'ts_096', layer: 'tactical', series: 'fate', index: 96,
        displayName: '坚壁挫锐', sourceQuote: '《新唐书·高丽传》：“帝攻安市不能下，遂班师。”',
        baseEffect: 'luck_variance_enemy', condition: 'battle_siege_defender', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.15, luckMax: 0.8, engineStatus: 'ready',
    },
    {
        id: 'ts_097', layer: 'tactical', series: 'casualty', index: 97,
        displayName: '荡寇摧凶', sourceQuote: '《高丽史·崔莹传》：“莹击倭于鸿山，大破之。”',
        baseEffect: 'win_casualty_reduction', condition: 'battle_siege_defender', phase: 'mid_battle_passive',
        magnitude: 0.5, engineStatus: 'ready',
    },
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
        magnitude: 1, luckMin: 0.2, luckMax: 0.85, engineStatus: 'ready',
    },
    {
        id: 'ts_100', layer: 'tactical', series: 'casualty', index: 100,
        displayName: '殊死却敌', sourceQuote: '《宣祖实录》：“金时敏守晋州，力战却敌，中丸而卒。”',
        baseEffect: 'win_casualty_reduction', condition: 'battle_siege_defender', phase: 'mid_battle_passive',
        magnitude: 0.55, engineStatus: 'ready',
    },
    {
        id: 'ts_102', layer: 'tactical', series: 'enhance', index: 102,
        displayName: '席卷八荒', sourceQuote: '《元史·速不台传》：“身历百战，所向克捷。”',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_103', layer: 'tactical', series: 'fate', index: 103,
        displayName: '避锐远遁', sourceQuote: '《明史·成祖本纪》：“燕王出古北口，乃儿不花望风遁去。”',
        baseEffect: 'luck_variance_self', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.6, luckMax: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_104', layer: 'tactical', series: 'fate', index: 104,
        displayName: '负险固守', sourceQuote: '《后汉书·东夷传》：“夫余以员栅为城，恃险固守。”',
        baseEffect: 'luck_variance_enemy', condition: 'battle_siege_defender', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.3, luckMax: 0.9, engineStatus: 'ready',
    },
    // ── 第五批 T1（10 位名将补贴合技；ID ts_117-126 顺延）──
    {
        id: 'ts_117', layer: 'tactical', series: 'enhance', index: 117,
        displayName: '牧野鹰扬', sourceQuote: '《诗经·大雅·大明》：“维师尚父，时维鹰扬。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_118', layer: 'tactical', series: 'enhance', index: 118,
        displayName: '一匡天下', sourceQuote: '《隋书·高祖纪》：“九州无事，区宇一匡。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_119', layer: 'tactical', series: 'enhance', index: 119,
        displayName: '追奔逐北', sourceQuote: '《辽史·耶律休哥传》：“宋兵大溃，追奔逐北，杀获甚众。”',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_120', layer: 'tactical', series: 'enhance', index: 120,
        displayName: '铁骑突出', sourceQuote: '《资治通鉴·后梁纪》：“晋王亲帅铁骑，驰犯其阵。”',
        baseEffect: 'first_sortie_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_121', layer: 'tactical', series: 'enhance', index: 121,
        displayName: '摧枯拉朽', sourceQuote: '《华阳国志·蜀志》：“秦使司马错伐蜀，灭之。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.35, engineStatus: 'ready',
    },
    {
        id: 'ts_122', layer: 'tactical', series: 'enhance', index: 122,
        displayName: '辟土开疆', sourceQuote: '《宋史·王韶传》：“韶入熙河，拓地二千余里。”',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_123', layer: 'tactical', series: 'fate', index: 123,
        displayName: '不战屈人', sourceQuote: '《旧唐书·王忠嗣传》：“吾不欲以数万人之命易一官。”',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.4, luckMax: 0.95, engineStatus: 'ready',
    },
    {
        id: 'ts_124', layer: 'tactical', series: 'troop', index: 124,
        displayName: '长驱饮马', sourceQuote: '《明史·鞑靼传》：“俺答帅众薄都城，纵掠畿甸。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.2, engineStatus: 'ready',
    },
    {
        id: 'ts_125', layer: 'tactical', series: 'fate', index: 125,
        displayName: '转战千里', sourceQuote: '《明史·张献忠传》：“往来湖广、四川间，飘忽不常。”',
        baseEffect: 'recompute_comeback', condition: 'side_comeback', phase: 'mid_battle_comeback',
        magnitude: 1, comebackThreshold: 0.85, engineStatus: 'ready',
    },
    {
        id: 'ts_126', layer: 'tactical', series: 'casualty', index: 126,
        displayName: '东挡西杀', sourceQuote: '《宋史·孟珙传》：“珙连破北军，威名震于境外。”',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.5, engineStatus: 'ready',
    },
    // ── 第六批 T1（29 位名将补贴合技；ID ts_127-155）──
    {
        id: 'ts_127', layer: 'tactical', series: 'enhance', index: 127,
        displayName: '后发制人', sourceQuote: '《日本外史》：“家康隐忍持重，后发而制人。”',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_128', layer: 'tactical', series: 'enhance', index: 128,
        displayName: '突骑摧坚', sourceQuote: '志费尼《世界征服者史》：“桑贾尔统突骑，雄踞呼罗珊。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.35, engineStatus: 'ready',
    },
    {
        id: 'ts_129', layer: 'tactical', series: 'enhance', index: 129,
        displayName: '象阵摧锋', sourceQuote: '周达观《真腊风土记》：“其国乘象以战，阇耶跋摩拓土却敌。”',
        baseEffect: 'first_sortie_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_130', layer: 'tactical', series: 'enhance', index: 130,
        displayName: '示弱诱歼', sourceQuote: '《岛津国史》：“家久善用钓野伏，以寡破众。”',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.55, engineStatus: 'ready',
    },
    {
        id: 'ts_131', layer: 'tactical', series: 'enhance', index: 131,
        displayName: '摧坚擒王', sourceQuote: '《金史·娄室传》：“娄室追辽主，长驱数千里，所向摧破。”',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_132', layer: 'tactical', series: 'enhance', index: 132,
        displayName: '威服诸部', sourceQuote: '《明史·鞑靼传》：“达延汗尽有故元之众，威服诸部。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.35, engineStatus: 'ready',
    },
    {
        id: 'ts_133', layer: 'tactical', series: 'enhance', index: 133,
        displayName: '建牙破敌', sourceQuote: '《旧唐书·回纥传》：“骨力裴罗击破突厥，遂建牙拓地。”',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_134', layer: 'tactical', series: 'enhance', index: 134,
        displayName: '号令如山', sourceQuote: '《魏书·蠕蠕传》：“社仑始立军法，千人为军，百人为幢。”',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_135', layer: 'tactical', series: 'casualty', index: 135,
        displayName: '刺山飞泉', sourceQuote: '《后汉书·耿恭传》：“恭仰天祝，飞泉奔出，众皆称万岁。”',
        baseEffect: 'win_casualty_reduction', condition: 'battle_siege_defender', phase: 'mid_battle_passive',
        magnitude: 0.5, engineStatus: 'ready',
    },
    {
        id: 'ts_136', layer: 'tactical', series: 'enhance', index: 136,
        displayName: '疾风劲骑', sourceQuote: '《新唐书·回鹘传》：“回鹘劲骑，驰突剽疾如风。”',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_137', layer: 'tactical', series: 'fate', index: 137,
        displayName: '安边御寇', sourceQuote: '《晋书·凉武昭王传》：“暠保境安民，抚循河右。”',
        baseEffect: 'luck_variance_enemy', condition: 'battle_siege_defender', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.3, luckMax: 0.9, engineStatus: 'ready',
    },
    {
        id: 'ts_138', layer: 'tactical', series: 'enhance', index: 138,
        displayName: '以寡摧盟', sourceQuote: '《辽史·天祚帝纪》：“大石以少击众，大败塞尔柱之师。”',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.55, engineStatus: 'ready',
    },
    {
        id: 'ts_139', layer: 'tactical', series: 'enhance', index: 139,
        displayName: '兵雄四方', sourceQuote: '志费尼《世界征服者史》：“摩诃末之国，兵雄西域，控弦百万。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_140', layer: 'tactical', series: 'enhance', index: 140,
        displayName: '控弦制胜', sourceQuote: '波斯史载哈萨克哈斯木汗：控弦二十万，草原称雄。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_141', layer: 'tactical', series: 'enhance', index: 141,
        displayName: '弯刀陷阵', sourceQuote: '《廓尔喀纪略》：“廓夷持弯刀，习山地战，剽悍难敌。”',
        baseEffect: 'ally_power_mult', condition: 'terrain_mountain', phase: 'opening_roll',
        magnitude: 1.65, engineStatus: 'ready',
    },
    {
        id: 'ts_142', layer: 'tactical', series: 'enhance', index: 142,
        displayName: '巨象蹈坚', sourceQuote: '《明史·缅甸传》：“莽应龙乘象督战，并吞诸部。”',
        baseEffect: 'first_sortie_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_143', layer: 'tactical', series: 'enhance', index: 143,
        displayName: '揭竿突阵', sourceQuote: '《晋书·李特载记》：“特纠合流民，众推为主，突骑陷阵。”',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.55, engineStatus: 'ready',
    },
    {
        id: 'ts_144', layer: 'tactical', series: 'fate', index: 144,
        displayName: '坚城折锐', sourceQuote: '《宋史·王坚传》：“坚婴城固守，蒙哥中飞石，卒于城下。”',
        baseEffect: 'luck_variance_enemy', condition: 'battle_siege_defender', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.15, luckMax: 0.8, engineStatus: 'ready',
    },
    {
        id: 'ts_145', layer: 'tactical', series: 'enhance', index: 145,
        displayName: '养锐蓄势', sourceQuote: '《旧唐书·田承嗣传》：“择军中骁健者为牙兵，畜养自固。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_146', layer: 'tactical', series: 'enhance', index: 146,
        displayName: '先机制敌', sourceQuote: '《宋史·曲端传》：“端善料敌，所向克捷，威震西陲。”',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_147', layer: 'tactical', series: 'enhance', index: 147,
        displayName: '决胜千里', sourceQuote: '《旧五代史·世宗纪》：“世宗神武雄略，决胜于千里。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_148', layer: 'tactical', series: 'enhance', index: 148,
        displayName: '突骑陷坚', sourceQuote: '《明史·吴三桂传》：“选夷丁为突骑，冲坚陷阵，莫之能当。”',
        baseEffect: 'first_sortie_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_149', layer: 'tactical', series: 'counter', index: 149,
        displayName: '庙算制胜', sourceQuote: '《孙子兵法·计篇》：“未战而庙算胜者，得算多也。”',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
    },
    {
        id: 'ts_150', layer: 'tactical', series: 'enhance', index: 150,
        displayName: '驰突破阵', sourceQuote: '《晋书·慕容皝载记》：“皝东征西讨，拓地辽碣。”',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_151', layer: 'tactical', series: 'fate', index: 151,
        displayName: '扼险却敌', sourceQuote: '《锡克史》载哈里辛格·纳尔瓦：扼守开伯尔，阿富汗畏之。',
        baseEffect: 'luck_variance_enemy', condition: 'terrain_mountain', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.2, luckMax: 0.85, engineStatus: 'ready',
    },
    {
        id: 'ts_152', layer: 'tactical', series: 'enhance', index: 152,
        displayName: '决战破盟', sourceQuote: '波斯史载艾哈迈德沙：于帕尼帕特大破马拉塔联军。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_153', layer: 'tactical', series: 'troop', index: 153,
        displayName: '回马控弦', sourceQuote: '普鲁塔克《克拉苏传》：“安息铁骑回身发矢，罗马之军覆没于卡莱。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.25, engineStatus: 'ready',
    },
    {
        id: 'ts_154', layer: 'tactical', series: 'enhance', index: 154,
        displayName: '黑旗蔽日', sourceQuote: '阿拉伯史载阿布·穆斯林：于木鹿升起黑旗，呼罗珊群雄景从，遂覆白衣大食。',
        baseEffect: 'first_sortie_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.35, engineStatus: 'ready',
    },
    {
        id: 'ts_155', layer: 'tactical', series: 'enhance', index: 155,
        displayName: '摧锋定倾', sourceQuote: '《旧唐书·李晟传》：“晟率师收复京城，戡定朱泚之乱。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.35, engineStatus: 'ready',
    },
    // ── 第七批：T0缺口 + T2头部名将（ts_156-167；项羽/韩信认领招牌不占号）──
    {
        id: 'ts_156', layer: 'tactical', series: 'enhance', index: 156,
        displayName: '赤备突阵', sourceQuote: '《日本战史·大阪之阵》：“真田赤备突入德川本阵，家康几殆。”',
        baseEffect: 'first_sortie_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_157', layer: 'tactical', series: 'enhance', index: 157,
        displayName: '草木皆兵', sourceQuote: '《晋书·谢玄传》：“坚望八公山草木，皆以为晋兵。”',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.5, engineStatus: 'ready',
    },
    {
        id: 'ts_158', layer: 'tactical', series: 'enhance', index: 158,
        displayName: '歼锐无遗', sourceQuote: '《史记·白起列传》：“前后斩首虏四十五万人。”',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.45, engineStatus: 'ready',
    },
    {
        id: 'ts_159', layer: 'tactical', series: 'casualty', index: 159,
        displayName: '治戎为长', sourceQuote: '《三国志·诸葛亮传》：“亮治戎为长，抚民为本，约官职、从权制。”',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.5, engineStatus: 'ready',
    },
    {
        id: 'ts_160', layer: 'tactical', series: 'enhance', index: 160,
        displayName: '骄敌聚歼', sourceQuote: '《史记·廉颇蔺相如列传》：“李牧多为奇陈……大破杀匈奴十余万骑。”',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_161', layer: 'tactical', series: 'enhance', index: 161,
        displayName: '摧锋夺气', sourceQuote: '《三国志·张辽传》：“辽被甲持戟，陷陈杀数十人，冲垒而入。”',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.55, engineStatus: 'ready',
    },
    {
        id: 'ts_162', layer: 'tactical', series: 'troop', index: 162,
        displayName: '裹毡疾进', sourceQuote: '《三国志·邓艾传》：“艾以毡自裹，推转而下，山高谷深，至为艰险。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.25, engineStatus: 'ready',
    },
    {
        id: 'ts_163', layer: 'tactical', series: 'enhance', index: 163,
        displayName: '白袍破阵', sourceQuote: '《梁书·陈庆之传》：“名师大将莫自牢，千兵万马避白袍。”',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.5, engineStatus: 'ready',
    },
    {
        id: 'ts_164', layer: 'tactical', series: 'enhance', index: 164,
        displayName: '火牛奔冲', sourceQuote: '《史记·田单列传》：“燃其端，牛尾热，怒而奔燕军。”',
        baseEffect: 'first_sortie_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_165', layer: 'tactical', series: 'enhance', index: 165,
        displayName: '减灶诱歼', sourceQuote: '《史记·孙子吴起列传》：“使齐军入魏地为十万灶……庞涓自刭。”',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_166', layer: 'tactical', series: 'fate', index: 166,
        displayName: '背城借一', sourceQuote: '《明史·于谦传》：“也先挟上皇薄京城，谦身自督战，寇引却。”',
        baseEffect: 'luck_variance_enemy', condition: 'battle_siege_defender', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.15, luckMax: 0.8, engineStatus: 'ready',
    },
    {
        id: 'ts_167', layer: 'tactical', series: 'casualty', index: 167,
        displayName: '守死遏敌', sourceQuote: '《旧唐书·张巡传》：“守睢阳……蔽遮江淮，屏障江南。”',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'battle_siege_defender', phase: 'post_battle',
        magnitude: 2.0, engineStatus: 'ready',
        note: '守城城破身死，咬人：胜方本场战损×2（睢阳死守，杀敌十二万，蔽遮江淮）；胜方保底存活 10% 初始兵',
    },
    // ── 第八批：T2 名将（ts_168-181）──
    {
        id: 'ts_168', layer: 'tactical', series: 'fate', index: 168,
        displayName: '百败不折', sourceQuote: '《三国志·先主传》评：“折而不挠，终不为下。”',
        baseEffect: 'recompute_comeback', condition: 'side_comeback', phase: 'mid_battle_comeback',
        magnitude: 1, comebackThreshold: 0.85, engineStatus: 'ready',
    },
    {
        id: 'ts_169', layer: 'tactical', series: 'enhance', index: 169,
        displayName: '无当拒锋', sourceQuote: '《三国志·王平传》：“统五部兼当营事，号无当飞军。”',
        baseEffect: 'ally_power_mult', condition: 'terrain_mountain', phase: 'opening_roll',
        magnitude: 1.65, engineStatus: 'ready',
    },
    {
        id: 'ts_170', layer: 'tactical', series: 'enhance', index: 170,
        displayName: '横江扼敌', sourceQuote: '《宋史·韩世忠传》：“以八千人邀击兀术十万众于黄天荡，相持四十八日。”',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_171', layer: 'tactical', series: 'enhance', index: 171,
        displayName: '风林火山', sourceQuote: '《甲阳军鉴》：“其疾如风，其徐如林，侵掠如火，不动如山。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_172', layer: 'tactical', series: 'fate', index: 172,
        displayName: '奇正守险', sourceQuote: '《太平记》：“正成保千早城，以寡制众，幕府大军攻之不能下。”',
        baseEffect: 'luck_variance_enemy', condition: 'battle_siege_defender', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.15, luckMax: 0.8, engineStatus: 'ready',
    },
    {
        id: 'ts_173', layer: 'tactical', series: 'enhance', index: 173,
        displayName: '诱敌疲歼', sourceQuote: '《三国史记·乙支文德传》：“伪降诱敌，半渡萨水而击，隋军大溃。”',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_174', layer: 'tactical', series: 'enhance', index: 174,
        displayName: '却月破骑', sourceQuote: '《宋书·武帝纪》：“军至却月，以车百乘为阵，大破魏骑。”',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.45, engineStatus: 'ready',
    },
    {
        id: 'ts_175', layer: 'tactical', series: 'enhance', index: 175,
        displayName: '勇锐略地', sourceQuote: '《三国志·孙策传》：“策转斗千里，尽有江东，人号小霸王。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_176', layer: 'tactical', series: 'enhance', index: 176,
        displayName: '孤骑擒将', sourceQuote: '《宋史·辛弃疾传》：“弃疾赴敌营，缚取张安国，率五十骑驰还。”',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.55, engineStatus: 'ready',
    },
    {
        id: 'ts_177', layer: 'tactical', series: 'fate', index: 177,
        displayName: '卧薪尝胆', sourceQuote: '《史记·越王勾践世家》：“置胆于坐，坐卧即仰胆，饮食亦尝胆。”',
        baseEffect: 'recompute_comeback', condition: 'side_comeback', phase: 'mid_battle_comeback',
        magnitude: 1, comebackThreshold: 0.85, engineStatus: 'ready',
    },
    {
        id: 'ts_178', layer: 'tactical', series: 'enhance', index: 178,
        displayName: '聚米制胜', sourceQuote: '《后汉书·马援传》：“援聚米为山谷，指画形势，帝曰：虏在吾目中矣。”',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_179', layer: 'tactical', series: 'enhance', index: 179,
        displayName: '奋勇陷坚', sourceQuote: '《明史·卢象升传》：“象升每临阵，身先士卒，锋镝交于前，士皆用命。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_180', layer: 'tactical', series: 'enhance', index: 180,
        displayName: '百骑劫营', sourceQuote: '《三国志·甘宁传》：“宁乃选百余人，夜斫曹营，斩得数十级而还。”',
        baseEffect: 'first_sortie_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_181', layer: 'tactical', series: 'enhance', index: 181,
        displayName: '雪夜奇袭', sourceQuote: '《旧唐书·李愬传》：“愬乘雪夜袭蔡州，擒吴元济。”',
        baseEffect: 'first_sortie_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_182', layer: 'tactical', series: 'troop', index: 182,
        displayName: '火焚连舰', sourceQuote: '《明史·太祖本纪》：“乘风纵火，焚友谅舟，湖水尽赤。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
    },
    {
        id: 'ts_183', layer: 'tactical', series: 'troop', index: 183,
        displayName: '乘风纵火', sourceQuote: '《后汉书·皇甫嵩传》：“嵩因夜纵火，大呼，奔击其阵。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
    },
    {
        id: 'ts_184', layer: 'tactical', series: 'fate', index: 184,
        displayName: '深壁扼粮', sourceQuote: '《史记·绛侯周勃世家》：“亚夫坚壁不出，绝吴楚粮道。”',
        baseEffect: 'luck_variance_enemy', condition: 'battle_siege_defender', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.1, luckMax: 0.8, engineStatus: 'ready',
    },
    {
        id: 'ts_185', layer: 'tactical', series: 'enhance', index: 185,
        displayName: '令行禁止', sourceQuote: '《史记·司马穰苴列传》：“约束既定，士卒皆争奋出为之赴战。”',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_186', layer: 'tactical', series: 'troop', index: 186,
        displayName: '潜锋设伏', sourceQuote: '《左传·僖公三十三年》：“晋人御师必于崤，败秦师于崤。”',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
    },
    {
        id: 'ts_187', layer: 'tactical', series: 'fate', index: 187,
        displayName: '愈挫愈奋', sourceQuote: '《史记·高祖本纪》：“汉王深壁而守之，卒破项籍。”',
        baseEffect: 'luck_variance_self', condition: 'self_troops_below_enemy_pct', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.6, luckMax: 2.0, engineStatus: 'ready',
    },
    {
        id: 'ts_188', layer: 'tactical', series: 'fate', index: 188,
        displayName: '隐锋待时', sourceQuote: '《晋书·宣帝纪》：“内忌之而外宽，潜谋除之。”',
        baseEffect: 'luck_variance_self', condition: 'always', phase: 'opening_roll',
        magnitude: 0.8, luckMin: 0.5, luckMax: 1.5, engineStatus: 'ready',
    },
    {
        id: 'ts_189', layer: 'tactical', series: 'enhance', index: 189,
        displayName: '狭路争锋', sourceQuote: '《史记·廉颇蔺相如列传》：“其道远险狭，譬之两鼠斗于穴中，将勇者胜。”',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.55, engineStatus: 'ready',
    },
    {
        id: 'ts_190', layer: 'tactical', series: 'fate', index: 190,
        displayName: '乘危夺鼎', sourceQuote: '《晋书·姚苌载记》：苌乘苻氏之乱，禽坚僭立。',
        baseEffect: 'luck_variance_self', condition: 'always', phase: 'opening_roll',
        magnitude: 0.8, luckMin: 0.5, luckMax: 1.5, engineStatus: 'ready',
    },
    {
        id: 'ts_191', layer: 'tactical', series: 'enhance', index: 191,
        displayName: '蚕食摧坚', sourceQuote: '《旧五代史·梁太祖纪》：温兼并四邻，蚕食唐祚。',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_attacker', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_192', layer: 'tactical', series: 'troop', index: 192,
        displayName: '劲弩番射', sourceQuote: '《宋史·吴玠传》：选劲弩，分番迭射，谓之驻队矢。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
    },
    {
        id: 'ts_193', layer: 'tactical', series: 'troop', index: 193,
        displayName: '临机决水', sourceQuote: '《梁书·韦睿传》：睿决淮水以灌魏营。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
    },
    {
        id: 'ts_194', layer: 'tactical', series: 'enhance', index: 194,
        displayName: '正兵决荡', sourceQuote: '《隋书·杨素传》：悉召所部成列而战，一战破之。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.35, engineStatus: 'ready',
    },
    {
        id: 'ts_195', layer: 'tactical', series: 'fate', index: 195,
        displayName: '诈降毙帅', sourceQuote: '《明史·铁铉传》：诈请降，下铁板几毙燕王。',
        baseEffect: 'luck_variance_enemy', condition: 'battle_siege_defender', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.1, luckMax: 0.8, engineStatus: 'ready',
    },
    {
        id: 'ts_196', layer: 'tactical', series: 'fate', index: 196,
        displayName: '一箭落雕', sourceQuote: '《北齐书·斛律光传》：射一大雕，号落雕都督。',
        baseEffect: 'luck_variance_self', condition: 'always', phase: 'opening_roll',
        magnitude: 0.8, luckMin: 0.5, luckMax: 1.5, engineStatus: 'ready',
    },
    {
        id: 'ts_197', layer: 'tactical', series: 'fate', index: 197,
        displayName: '凭堞折冲', sourceQuote: '《周书·韦孝宽传》：玉璧被围，孝宽随方御之。',
        baseEffect: 'luck_variance_enemy', condition: 'battle_siege_defender', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.1, luckMax: 0.8, engineStatus: 'ready',
    },
    {
        id: 'ts_198', layer: 'tactical', series: 'enhance', index: 198,
        displayName: '勇冠三军', sourceQuote: '《晋书·载记》：闵勇力绝人，屡破胡军。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_199', layer: 'tactical', series: 'enhance', index: 199,
        displayName: '率锐破雄', sourceQuote: '《三国志·孙破虏传》：坚收兵，大破卓军，枭华雄。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_200', layer: 'tactical', series: 'enhance', index: 200,
        displayName: '登旅致师', sourceQuote: '甲骨卜辞：登妇好三千，登旅万，呼伐羌方。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_201', layer: 'tactical', series: 'enhance', index: 201,
        displayName: '麾兵力战', sourceQuote: '《宋史·太祖纪》：高平之战，匡胤麾兵力战。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.35, engineStatus: 'ready',
    },
    {
        id: 'ts_202', layer: 'tactical', series: 'troop', index: 202,
        displayName: '邀击擒渠', sourceQuote: '《明史·孙传庭传》：设伏黑水峪，擒高迎祥。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.22, engineStatus: 'ready',
    },
    {
        id: 'ts_203', layer: 'tactical', series: 'enhance', index: 203,
        displayName: '驱徒成军', sourceQuote: '《史记》：章邯赦骊山徒，成军击破周文。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_204', layer: 'tactical', series: 'enhance', index: 204,
        displayName: '倡义靖乱', sourceQuote: '《梁书·武帝纪》：雍州倡义，顺流而下。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_205', layer: 'tactical', series: 'fate', index: 205,
        displayName: '运筹先定', sourceQuote: '《后汉书·邓禹传》：禹为光武谋画，图天下之策。',
        baseEffect: 'luck_variance_self', condition: 'always', phase: 'opening_roll',
        magnitude: 0.8, luckMin: 0.5, luckMax: 1.5, engineStatus: 'ready',
    },
    {
        id: 'ts_206', layer: 'tactical', series: 'enhance', index: 206,
        displayName: '持重克乱', sourceQuote: '《史记·绛侯世家》：勃厚重少文，卒安刘氏。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_207', layer: 'tactical', series: 'enhance', index: 207,
        displayName: '胡骑南牧', sourceQuote: '《晋书·刘元海载记》：召集五部，众至五万。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_208', layer: 'tactical', series: 'enhance', index: 208,
        displayName: '夜拔坚城', sourceQuote: '《旧唐书·李勣传》：勣攻拔其城，遂灭高丽。',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_attacker', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_209', layer: 'tactical', series: 'fate', index: 209,
        displayName: '汲水凝冰', sourceQuote: '《宋史·杨延昭传》：汲水灌城，旦悉为冰，坚不可上。',
        baseEffect: 'luck_variance_enemy', condition: 'battle_siege_defender', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.1, luckMax: 0.8, engineStatus: 'ready',
    },
    {
        id: 'ts_210', layer: 'tactical', series: 'enhance', index: 210,
        displayName: '老骥雄飞', sourceQuote: '《晋书·慕容垂载记》：垂枋头破晋，复燕祚。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_211', layer: 'tactical', series: 'enhance', index: 211,
        displayName: '死地奋决', sourceQuote: '《北齐书·神武纪》：韩陵死战，破尔朱兆。',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.55, engineStatus: 'ready',
    },
    {
        id: 'ts_212', layer: 'tactical', series: 'fate', index: 212,
        displayName: '结围御虏', sourceQuote: '《三国志·田豫传》：豫因地形，回车结围御鲜卑。',
        baseEffect: 'luck_variance_self', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.6, luckMax: 2.0, engineStatus: 'ready',
    },
    {
        id: 'ts_213', layer: 'tactical', series: 'enhance', index: 213,
        displayName: '白马摧锋', sourceQuote: '《后汉书·公孙瓒传》：常乘白马为骑，号白马义从。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_214', layer: 'tactical', series: 'enhance', index: 214,
        displayName: '胡服骑射', sourceQuote: '《史记·赵世家》：胡服骑射以教百姓。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.35, engineStatus: 'ready',
    },
    {
        id: 'ts_215', layer: 'tactical', series: 'fate', index: 215,
        displayName: '凿隧破围', sourceQuote: '《旧唐书·李光弼传》：太原掘地道，出兵破史思明。',
        baseEffect: 'luck_variance_enemy', condition: 'battle_siege_defender', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.1, luckMax: 0.8, engineStatus: 'ready',
    },
    {
        id: 'ts_216', layer: 'tactical', series: 'fate', index: 216,
        displayName: '三箭慑虏', sourceQuote: '《旧唐书·薛仁贵传》：将军三箭定天山。',
        baseEffect: 'luck_variance_self', condition: 'always', phase: 'opening_roll',
        magnitude: 0.8, luckMin: 0.5, luckMax: 1.5, engineStatus: 'ready',
    },
    {
        id: 'ts_217', layer: 'tactical', series: 'troop', index: 217,
        displayName: '楼船焚垒', sourceQuote: '《隋书·来护儿传》：护儿率楼船，泛海入平壤。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
    },
    {
        id: 'ts_218', layer: 'tactical', series: 'fate', index: 218,
        displayName: '诱骄致溃', sourceQuote: '《旧五代史·周德威传》：柏乡诱梁军，骄惰而溃。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.2, luckMax: 0.9, engineStatus: 'ready',
    },
    {
        id: 'ts_219', layer: 'tactical', series: 'troop', index: 219,
        displayName: '强弩破骑', sourceQuote: '《后汉书·袁绍传》：麴义八百强弩，破瓒白马义从。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
    },
    {
        id: 'ts_220', layer: 'tactical', series: 'troop', index: 220,
        displayName: '奄袭虏庭', sourceQuote: '《明史·蓝玉传》：捕鱼儿海，奄至虏营，尽俘之。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
    },
    {
        id: 'ts_221', layer: 'tactical', series: 'enhance', index: 221,
        displayName: '虓虎陷阵', sourceQuote: '《晋书·石季龙载记》：季龙骁勇，攻洛阳擒刘曜。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_222', layer: 'tactical', series: 'troop', index: 222,
        displayName: '蹑归聚歼', sourceQuote: '《魏书·太祖纪》：参合陂蹑燕归军，聚而歼之。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.22, engineStatus: 'ready',
    },
    {
        id: 'ts_223', layer: 'tactical', series: 'enhance', index: 223,
        displayName: '横扫连城', sourceQuote: '《史记·乐毅列传》：并护五国之兵，下齐七十余城。',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_attacker', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_224', layer: 'tactical', series: 'enhance', index: 224,
        displayName: '有志竟成', sourceQuote: '《后汉书·耿弇传》：有志者事竟成。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.35, engineStatus: 'ready',
    },
    {
        id: 'ts_225', layer: 'tactical', series: 'enhance', index: 225,
        displayName: '奋疾破虏', sourceQuote: '《宋史·折御卿传》：子河汊大破契丹。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_226', layer: 'tactical', series: 'enhance', index: 226,
        displayName: '蓄锐倾覆', sourceQuote: '《旧唐书·安禄山传》：蓄锐范阳，举兵倾唐。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_227', layer: 'tactical', series: 'enhance', index: 227,
        displayName: '破军立鼎', sourceQuote: '《元史·燕铁木儿传》：两都之战，拥立文宗定鼎。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.35, engineStatus: 'ready',
    },
    {
        id: 'ts_228', layer: 'tactical', series: 'enhance', index: 228,
        displayName: '并骑破阵', sourceQuote: '《明史·瓦剌传》：脱欢并诸部，破阿鲁台。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.35, engineStatus: 'ready',
    },
    {
        id: 'ts_229', layer: 'tactical', series: 'enhance', index: 229,
        displayName: '率部破柔', sourceQuote: '《魏书·高车传》：阿伏至罗率部自立，屡破柔然。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_230', layer: 'tactical', series: 'enhance', index: 230,
        displayName: '孤军诛单', sourceQuote: '《裴岑纪功碑》：岑将郡兵三千，诛呼衍王。',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.55, engineStatus: 'ready',
    },
    {
        id: 'ts_231', layer: 'tactical', series: 'enhance', index: 231,
        displayName: '专征破垒', sourceQuote: '《元史·木华黎传》：封太师国王，专征经略中原。',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_attacker', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_232', layer: 'tactical', series: 'enhance', index: 232,
        displayName: '绝漠追奔', sourceQuote: '《后汉书·窦宪传》：出塞三千余里，追北单于。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_233', layer: 'tactical', series: 'enhance', index: 233,
        displayName: '控弦称雄', sourceQuote: '《元朝秘史》：王汗雄据克烈，破蔑儿乞乃蛮。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_234', layer: 'tactical', series: 'fate', index: 234,
        displayName: '却敌全师', sourceQuote: '《金史》：金伐蒙古，合不勒败其追兵而还。',
        baseEffect: 'luck_variance_self', condition: 'always', phase: 'opening_roll',
        magnitude: 0.8, luckMin: 0.5, luckMax: 1.5, engineStatus: 'ready',
    },
    {
        id: 'ts_235', layer: 'tactical', series: 'enhance', index: 235,
        displayName: '席卷江表', sourceQuote: '《元史·伯颜传》：伯颜下临安，灭宋。',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_attacker', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_236', layer: 'tactical', series: 'enhance', index: 236,
        displayName: '连环锁骑', sourceQuote: '《晋书·慕容恪载记》：以铁锁连马为方阵，擒冉闵。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_237', layer: 'tactical', series: 'enhance', index: 237,
        displayName: '驼阵横行', sourceQuote: '《清史稿·噶尔丹传》：结驼城为阵，纵横漠北。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_238', layer: 'tactical', series: 'enhance', index: 238,
        displayName: '收众奋击', sourceQuote: '《旧唐书·突厥传》：骨咄禄收集余众，复兴突厥。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.35, engineStatus: 'ready',
    },
    {
        id: 'ts_239', layer: 'tactical', series: 'enhance', index: 239,
        displayName: '驱虏通西', sourceQuote: '《后汉书·窦固传》：击破呼衍王，取伊吾，通西域。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_240', layer: 'tactical', series: 'enhance', index: 240,
        displayName: '锋镝先驱', sourceQuote: '《旧唐书·契苾何力传》：每战身先，为诸军锋。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_241', layer: 'tactical', series: 'troop', index: 241,
        displayName: '张翼包歼', sourceQuote: '《史记》：李牧张左右翼击之，大破匈奴十余万骑。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.22, engineStatus: 'ready',
    },
    {
        id: 'ts_242', layer: 'tactical', series: 'enhance', index: 242,
        displayName: '袭帐破汗', sourceQuote: '《新唐书·回鹘传》：黠戛斯破回鹘牙帐，杀其可汗。',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_attacker', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_243', layer: 'tactical', series: 'enhance', index: 243,
        displayName: '骁锐陷锋', sourceQuote: '《清史稿·海兰察传》：每战身先，屡陷坚阵。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_244', layer: 'tactical', series: 'enhance', index: 244,
        displayName: '收众破突', sourceQuote: '《旧唐书·薛延陀传》：夷男叛突厥，自立为可汗。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_245', layer: 'tactical', series: 'enhance', index: 245,
        displayName: '勇决破众', sourceQuote: '《旧唐书·回纥传》：菩萨勇决，五千破突厥十万。',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.55, engineStatus: 'ready',
    },
    {
        id: 'ts_246', layer: 'tactical', series: 'enhance', index: 246,
        displayName: '席卷海宇', sourceQuote: '《元史·世祖纪》：世祖混一海宇。',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_attacker', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_247', layer: 'tactical', series: 'enhance', index: 247,
        displayName: '纠盟合众', sourceQuote: '《元朝秘史》：札木合纠合诸部，十三翼战。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_248', layer: 'tactical', series: 'enhance', index: 248,
        displayName: '连岁抗虏', sourceQuote: '《辽史》：磨古斯叛，连岁破辽边军。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_249', layer: 'tactical', series: 'enhance', index: 249,
        displayName: '却胡筑塞', sourceQuote: '《史记·蒙恬列传》：却匈奴七百余里，筑长城。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_250', layer: 'tactical', series: 'enhance', index: 250,
        displayName: '铁鹞冲坚', sourceQuote: '《宋史·夏国传》：元昊选骁勇为铁鹞子。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_251', layer: 'tactical', series: 'troop', index: 251,
        displayName: '奇袭虏巢', sourceQuote: '《明史·王越传》：袭红盐池、威宁海，破鞑靼。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.22, engineStatus: 'ready',
    },
    {
        id: 'ts_252', layer: 'tactical', series: 'enhance', index: 252,
        displayName: '五郡连兵', sourceQuote: '《后汉书·窦融传》：统五郡精兵，会击隗嚣。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_253', layer: 'tactical', series: 'fate', index: 253,
        displayName: '张乐却虏', sourceQuote: '《旧唐书·张守珪传》：置酒作乐，虏疑而退。',
        baseEffect: 'luck_variance_enemy', condition: 'battle_siege_defender', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.1, luckMax: 0.8, engineStatus: 'ready',
    },
    {
        id: 'ts_254', layer: 'tactical', series: 'enhance', index: 254,
        displayName: '飘忽夺地', sourceQuote: '《晋书·赫连勃勃载记》：勃勃善用骑，飘忽拓地。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_255', layer: 'tactical', series: 'enhance', index: 255,
        displayName: '筑垒蚕食', sourceQuote: '《宋史·种师道传》：持重筑垒，拓边破夏。',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_attacker', phase: 'opening_roll',
        magnitude: 1.45, engineStatus: 'ready',
    },
    {
        id: 'ts_256', layer: 'tactical', series: 'enhance', index: 256,
        displayName: '枭雄据河', sourceQuote: '《晋书·沮渠蒙逊载记》：据河西，建北凉，灭西凉。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.35, engineStatus: 'ready',
    },
    {
        id: 'ts_257', layer: 'tactical', series: 'troop', index: 257,
        displayName: '水淹七军', sourceQuote: '《三国志·关羽传》：会大霖雨，汉水溢，禁七军皆没。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
    },
    {
        id: 'ts_258', layer: 'tactical', series: 'enhance', index: 258,
        displayName: '奋先摧坚', sourceQuote: '《明史·常遇春传》：每战辄先登，所向克捷。',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_attacker', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_259', layer: 'tactical', series: 'enhance', index: 259,
        displayName: '亲帅摧城', sourceQuote: '《晋书·桓温传》：温亲帅灭成汉。',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_attacker', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_260', layer: 'tactical', series: 'enhance', index: 260,
        displayName: '奇计擒藩', sourceQuote: '《明史·王守仁传》：以奇计擒宸濠。',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.55, engineStatus: 'ready',
    },
    {
        id: 'ts_261', layer: 'tactical', series: 'troop', index: 261,
        displayName: '火攻破舰', sourceQuote: '《三国志·周瑜传》：瑜烧其船舰，大破曹公。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
    },
    {
        id: 'ts_262', layer: 'tactical', series: 'fate', index: 262,
        displayName: '唱筹量沙', sourceQuote: '《南史·檀道济传》：夜唱筹量沙，全军而反。',
        baseEffect: 'luck_variance_enemy', condition: 'battle_siege_defender', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.1, luckMax: 0.8, engineStatus: 'ready',
    },
    {
        id: 'ts_263', layer: 'tactical', series: 'fate', index: 263,
        displayName: '婴城挫众', sourceQuote: '《明史·朱文正传》：守洪都八十五日，友谅围之终不克。',
        baseEffect: 'luck_variance_enemy', condition: 'battle_siege_defender', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.1, luckMax: 0.8, engineStatus: 'ready',
    },
    {
        id: 'ts_264', layer: 'tactical', series: 'enhance', index: 264,
        displayName: '屯田制敌', sourceQuote: '《汉书·赵充国传》：充国屯田，不战而屈羌。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.35, engineStatus: 'ready',
    },
    {
        id: 'ts_265', layer: 'tactical', series: 'enhance', index: 265,
        displayName: '据水断桥', sourceQuote: '《三国志·张飞传》：飞据水断桥，瞋目横矛，敌无敢近者。',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.55, engineStatus: 'ready',
    },
    {
        id: 'ts_266', layer: 'tactical', series: 'enhance', index: 266,
        displayName: '单骑退蕃', sourceQuote: '《旧唐书·郭子仪传》：单骑见回纥，蕃众舍兵下拜。',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.55, engineStatus: 'ready',
    },
    {
        id: 'ts_267', layer: 'tactical', series: 'enhance', index: 267,
        displayName: '饮马问鼎', sourceQuote: '《左传·宣十二年》：楚子观兵于周疆，问鼎之轻重。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_268', layer: 'tactical', series: 'enhance', index: 268,
        displayName: '合诏摧虏', sourceQuote: '《南诏德化碑》：阁罗凤合六诏之众，拒唐破蕃。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_269', layer: 'tactical', series: 'enhance', index: 269,
        displayName: '合兵摧城', sourceQuote: '《旧唐书·仆固怀恩传》：怀恩与子仪收复两京。',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_attacker', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_270', layer: 'tactical', series: 'enhance', index: 270,
        displayName: '锐志摧远', sourceQuote: '《三国志·姜维传》：维锐志进取，九伐中原，破王经于洮西。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_271', layer: 'tactical', series: 'enhance', index: 271,
        displayName: '白杆勤王', sourceQuote: '《明史·秦良玉传》：白杆兵屡破贼，千里勤王。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_272', layer: 'tactical', series: 'enhance', index: 272,
        displayName: '疾骑平蕃', sourceQuote: '《清史稿·年羹尧传》：年羹尧奇袭平青海。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_273', layer: 'tactical', series: 'fate', index: 273,
        displayName: '铁壁挫锋', sourceQuote: '《宋史·吕文焕传》：守襄阳，蒙古围之六载不下。铁壁挫锋——守城挫敌锐气。',
        baseEffect: 'luck_variance_enemy', condition: 'battle_siege_defender', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.1, luckMax: 0.8, engineStatus: 'ready',
    },
    {
        id: 'ts_274', layer: 'tactical', series: 'enhance', index: 274,
        displayName: '奋击摧敌', sourceQuote: '《新五代史·吴世家》：行密杀儒，众溃不敢犯。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_275', layer: 'tactical', series: 'enhance', index: 275,
        displayName: '远飏破锥', sourceQuote: '《宋史·刘锜传》：顺昌之捷，兀术锜不能支。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_276', layer: 'tactical', series: 'enhance', index: 276,
        displayName: '长驱蹙虏', sourceQuote: '《史记·卫将军骠骑列传》：青至笼城，出朔方，击右贤王，收河南地。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_277', layer: 'tactical', series: 'enhance', index: 277,
        displayName: '虽远必诛', sourceQuote: '《汉书·陈汤传》：明犯强汉者，虽远必诛。矫制发兵，斩郅支单于。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_278', layer: 'tactical', series: 'troop', index: 278,
        displayName: '火燔连营', sourceQuote: '《三国志·陆逊传》：命各持一把茅以火攻拔之，破先主四十余营。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
    },
    {
        id: 'ts_279', layer: 'tactical', series: 'enhance', index: 279,
        displayName: '雷厉摧锋', sourceQuote: '《晋书·苻坚载记》：猛与慕容评战于潞川，评众大败，遂灭之。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_280', layer: 'tactical', series: 'enhance', index: 280,
        displayName: '倍道诛逆', sourceQuote: '《日本外史》：秀吉自中国倍道还袭，破明智光秀于山崎。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_281', layer: 'tactical', series: 'enhance', index: 281,
        displayName: '车悬奔冲', sourceQuote: '《甲阳军鉴》：上杉军以车悬之阵，轮番冲突于川中岛。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_282', layer: 'tactical', series: 'enhance', index: 282,
        displayName: '疾锋摧盟', sourceQuote: '《奥羽永庆军记》：政宗摺上原一战大破芦名，遂并南奥。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_283', layer: 'tactical', series: 'enhance', index: 283,
        displayName: '逾岭袭国', sourceQuote: '《旧唐书·高仙芝传》：逾葱岭、涉播密，袭破小勃律，虏其王。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_284', layer: 'tactical', series: 'troop', index: 284,
        displayName: '诡道擒渠', sourceQuote: '《旧唐书·裴行俭传》：以计诱执阿史那都支，不战而缚其渠帅。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
    },
    {
        id: 'ts_285', layer: 'tactical', series: 'enhance', index: 285,
        displayName: '越沙摧垒', sourceQuote: '《旧唐书·侯君集传》：行碛数千里，克高昌，虏其王以归。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_286', layer: 'tactical', series: 'enhance', index: 286,
        displayName: '凭险摧锐', sourceQuote: '《新唐书·韦皋传》：镇蜀二十一年，凭山险数破吐蕃，取维州。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_287', layer: 'tactical', series: 'enhance', index: 287,
        displayName: '楼船踏浪', sourceQuote: '《清史稿·施琅传》：督舟师进澎湖，大败刘国轩，遂定台湾。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_288', layer: 'tactical', series: 'troop', index: 288,
        displayName: '荡海歼寇', sourceQuote: '《明史·俞大猷传》：破倭于海上，数有功，世称俞家军。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
    },
    {
        id: 'ts_289', layer: 'tactical', series: 'enhance', index: 289,
        displayName: '戈船破阵', sourceQuote: '《史记·南越列传》：佗击并桂林、象郡，以兵威役属瓯骆。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_290', layer: 'tactical', series: 'casualty', index: 290,
        displayName: '保境安边', sourceQuote: '《隋书·谯国夫人传》：怀集百越，数州晏然，历梁陈隋而境内安。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.5, engineStatus: 'ready',
    },
    {
        id: 'ts_291', layer: 'tactical', series: 'enhance', index: 291,
        displayName: '破碉摧堡', sourceQuote: '《清史稿·阿桂传》：攻金川碉卡，凡克碉数千，遂平两金川。',
        baseEffect: 'ally_power_mult', condition: 'terrain_mountain', phase: 'opening_roll',
        magnitude: 1.65, engineStatus: 'ready',
    },
    {
        id: 'ts_292', layer: 'tactical', series: 'troop', index: 292,
        displayName: '奇袭夺帐', sourceQuote: '《清史稿·岳钟琪传》：轻骑袭罗卜藏丹津营，擒其母妻，青海平。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
    },
    {
        id: 'ts_293', layer: 'tactical', series: 'troop', index: 293,
        displayName: '壅水灌垒', sourceQuote: '《史记·王翦列传》：王贲引河沟灌大梁，城坏，魏王假降，遂灭魏。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
    },
    {
        id: 'ts_294', layer: 'tactical', series: 'enhance', index: 294,
        displayName: '先据山险', sourceQuote: '《史记·廉颇蔺相如列传》：奢急趋据北山，纵兵击之，大破秦军于阏与。',
        baseEffect: 'ally_power_mult', condition: 'terrain_mountain', phase: 'opening_roll',
        magnitude: 1.65, engineStatus: 'ready',
    },
    {
        id: 'ts_295', layer: 'tactical', series: 'enhance', index: 295,
        displayName: '振旅摧锋', sourceQuote: '《后汉书·皇甫规传》：规讨先零诸羌，斩获数千，威震西陲。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_296', layer: 'tactical', series: 'enhance', index: 296,
        displayName: '孤守绝域', sourceQuote: '《资治通鉴》：郭昕守安西，与中国隔绝，坚持四十余年不下。',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_defender', phase: 'opening_roll',
        magnitude: 1.45, engineStatus: 'ready',
    },
    {
        id: 'ts_297', layer: 'tactical', series: 'enhance', index: 297,
        displayName: '长驱摧垒', sourceQuote: '《旧唐书·王孝杰传》：大破吐蕃，复取安西四镇，置安西都护府。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_298', layer: 'tactical', series: 'casualty', index: 298,
        displayName: '据河自固', sourceQuote: '《晋书·张轨传》：轨保据河右，破鲜卑若罗拔能，奠前凉之基。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.5, engineStatus: 'ready',
    },
    {
        id: 'ts_299', layer: 'tactical', series: 'enhance', index: 299,
        displayName: '孤城却众', sourceQuote: '《元史》：士诚据高邮，脱脱百万之众围之不下，卒溃去。',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_defender', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_300', layer: 'tactical', series: 'troop', index: 300,
        displayName: '夜袭破虏', sourceQuote: '《旧唐书·黑齿常之传》：将精骑夜袭吐蕃于良非川，破之。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
    },
    {
        id: 'ts_301', layer: 'tactical', series: 'enhance', index: 301,
        displayName: '建牙摧敌', sourceQuote: '《北史·吐谷浑传》：夸吕始自号可汗，居伏俟城，拓地称雄青海。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_302', layer: 'tactical', series: 'enhance', index: 302,
        displayName: '破敌奠基', sourceQuote: '《多桑蒙古史》：伊斯玛仪擒萨法尔王阿慕尔，奠萨曼王朝之业。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_303', layer: 'tactical', series: 'enhance', index: 303,
        displayName: '恃象横行', sourceQuote: '《明史·云南土司传》：思任发驱象阵拒明军，麓川屡挫王师。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_304', layer: 'tactical', series: 'enhance', index: 304,
        displayName: '摧锋破垒', sourceQuote: '《缅甸史》：莽瑞体统一下缅诸邦，奠东吁王朝之基。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_305', layer: 'tactical', series: 'enhance', index: 305,
        displayName: '破阵摧坚', sourceQuote: '《新唐书·高骈传》：骈大破南诏，复交趾，筑大罗城以镇之。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_306', layer: 'tactical', series: 'enhance', index: 306,
        displayName: '乘丧摧垒', sourceQuote: '《晋书·乞伏炽磐载记》：炽磐乘丧灭南凉，拓地扩西秦之疆。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_307', layer: 'tactical', series: 'enhance', index: 307,
        displayName: '摧坚破阵', sourceQuote: '《琉璃宫史》：阿奴律陀统一缅甸，灭直通取三藏，建蒲甘帝国。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_308', layer: 'tactical', series: 'enhance', index: 308,
        displayName: '收部摧庭', sourceQuote: '《中亚史》：昔班尼征服河中，逐帖木儿后裔，立昔班尼汗国。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_309', layer: 'tactical', series: 'enhance', index: 309,
        displayName: '寡骑破众', sourceQuote: '《金史·完颜陈和尚传》：大昌原以四百骑破蒙古八千，忠孝军名震天下。',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.55, engineStatus: 'ready',
    },
    {
        id: 'ts_310', layer: 'tactical', series: 'enhance', index: 310,
        displayName: '合兵摧城', sourceQuote: '《旧唐书·天竺传》：王玄策发吐蕃、泥婆罗兵，破中天竺，擒阿罗那顺以归。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_311', layer: 'tactical', series: 'enhance', index: 311,
        displayName: '并力诛渠', sourceQuote: '《汉书·陈汤传》：甘延寿与汤俱出，合围康居，斩郅支单于首。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_312', layer: 'tactical', series: 'enhance', index: 312,
        displayName: '控弦拒虏', sourceQuote: '《旧唐书·突厥传》：苏禄收突骑施余众，控弦数十万，屡拒大食东侵。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_313', layer: 'tactical', series: 'enhance', index: 313,
        displayName: '西迁破月', sourceQuote: '《汉书·西域传》：昆莫猎骄靡西攻破大月氏，徙居其地，遂雄西域。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_314', layer: 'tactical', series: 'enhance', index: 314,
        displayName: '连破摧城', sourceQuote: '《泰北编年史》：孟莱王并诸勐，灭哈里奔猜，建兰纳王朝。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_315', layer: 'tactical', series: 'troop', index: 315,
        displayName: '设伏歼锐', sourceQuote: '《宋史·夏国传》：野利旺荣伏兵好水川，宋师入伏大败，任福战死。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
    },
    {
        id: 'ts_316', layer: 'tactical', series: 'enhance', index: 316,
        displayName: '先犯破盟', sourceQuote: '《左传·桓公十一年》：斗廉先犯郧师于蒲骚，四国之众溃。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_317', layer: 'tactical', series: 'enhance', index: 317,
        displayName: '摧垒代兴', sourceQuote: '《西藏王臣记》：绛曲坚赞灭萨迦，统一卫藏，建帕竹政权。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_318', layer: 'tactical', series: 'casualty', index: 318,
        displayName: '恩威服众', sourceQuote: '《三国志·张嶷传》：嶷恩威并著，越巂诸夷率服，南中晏然。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.5, engineStatus: 'ready',
    },
    {
        id: 'ts_319', layer: 'tactical', series: 'enhance', index: 319,
        displayName: '破阵摧军', sourceQuote: '《中亚史》：图格里勒丹丹坎大破伽色尼军，建塞尔柱帝国。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_320', layer: 'tactical', series: 'enhance', index: 320,
        displayName: '婴城拒逆', sourceQuote: '《旧唐书·浑瑊传》：瑊守奉天，昼夜拒朱泚，城赖以全。',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_defender', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_321', layer: 'tactical', series: 'enhance', index: 321,
        displayName: '坚垒挫锋', sourceQuote: '《宋史·孟宗政传》：宗政守枣阳，屡挫金人，号孟虎，镇襄汉。',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_defender', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_322', layer: 'tactical', series: 'enhance', index: 322,
        displayName: '连破坚垒', sourceQuote: '《新五代史·前蜀世家》：王建削平东西两川诸镇，遂王于蜀。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_323', layer: 'tactical', series: 'enhance', index: 323,
        displayName: '狼兵荡寇', sourceQuote: '《明史·沈希仪传》：希仪统狼兵，平广西瑶壮之乱，所向克捷。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_324', layer: 'tactical', series: 'enhance', index: 324,
        displayName: '并力摧城', sourceQuote: '《琅勃拉邦纪年》：法昂统一老挝诸勐，建澜沧王国。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_325', layer: 'tactical', series: 'enhance', index: 325,
        displayName: '越岭摧城', sourceQuote: '《廓尔喀纪略》：巴都尔萨野越山攻战，征服尼泊尔诸部，屡侵后藏。',
        baseEffect: 'ally_power_mult', condition: 'terrain_mountain', phase: 'opening_roll',
        magnitude: 1.65, engineStatus: 'ready',
    },
    {
        id: 'ts_326', layer: 'tactical', series: 'troop', index: 326,
        displayName: '扼险歼师', sourceQuote: '《南诏德化碑》：段俭魏拒唐军于西洱河，大破之，鲜于仲通仅以身免。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
    },
    {
        id: 'ts_327', layer: 'tactical', series: 'enhance', index: 327,
        displayName: '扫荡摧坚', sourceQuote: '《陈书·高祖纪》：霸先平侯景、破北齐，扫荡祸乱，遂受禅建陈。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_328', layer: 'tactical', series: 'enhance', index: 328,
        displayName: '骁锋摧叛', sourceQuote: '《陈书·侯安都传》：安都骁勇，破王琳、平留异，为陈室名将。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_329', layer: 'tactical', series: 'enhance', index: 329,
        displayName: '合围俘君', sourceQuote: '《罗马帝国衰亡史》：沙普尔围埃德萨，大败罗马，生俘皇帝瓦莱里安。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_330', layer: 'tactical', series: 'enhance', index: 330,
        displayName: '并力摧城', sourceQuote: '《三国史记》：金庾信黄山破百济，协唐灭丽，成三韩一统之业。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_331', layer: 'tactical', series: 'troop', index: 331,
        displayName: '夜战破众', sourceQuote: '《关八州古战录》：氏康河越夜袭，以少击破联军八万，遂霸关东。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
    },
    {
        id: 'ts_332', layer: 'tactical', series: 'enhance', index: 332,
        displayName: '鏖兵破垒', sourceQuote: '《大南实录》：阮福映灭西山朝，混一南北，建阮朝，称嘉隆帝。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_333', layer: 'tactical', series: 'enhance', index: 333,
        displayName: '倡义附盟', sourceQuote: '《元史·耶律留哥传》：留哥起兵辽东，破金军，附蒙古，建东辽。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_334', layer: 'tactical', series: 'casualty', index: 334,
        displayName: '镇抚遐荒', sourceQuote: '《三国志·马忠传》：忠平南中叛乱，恩信著于殊俗，镇庲降十余年。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.5, engineStatus: 'ready',
    },
    {
        id: 'ts_335', layer: 'tactical', series: 'enhance', index: 335,
        displayName: '世镇摧锋', sourceQuote: '《明史·沐晟传》：晟世镇云南，征麓川、定安南，拓西南之土。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_336', layer: 'tactical', series: 'enhance', index: 336,
        displayName: '聚众摧军', sourceQuote: '《后汉书·西羌传》：滇零称天子于北地，聚众屡破汉军，震动三辅。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_337', layer: 'tactical', series: 'enhance', index: 337,
        displayName: '长驱夺城', sourceQuote: '《宋史·广源州蛮传》：侬智高破邕州，连陷岭南诸城，进围广州。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_338', layer: 'tactical', series: 'enhance', index: 338,
        displayName: '恃险困敌', sourceQuote: '《后汉书·马援传》：五溪蛮相单程据险，汉军刘尚全没，援亦困于壶头。',
        baseEffect: 'ally_power_mult', condition: 'terrain_mountain', phase: 'opening_roll',
        magnitude: 1.55, engineStatus: 'ready',
    },
    {
        id: 'ts_339', layer: 'tactical', series: 'troop', index: 339,
        displayName: '奔袭擒渠', sourceQuote: '《旧唐书·突骑施传》：盖嘉运袭碎叶，破突骑施，擒吐火仙可汗。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
    },
    {
        id: 'ts_340', layer: 'tactical', series: 'enhance', index: 340,
        displayName: '陷城夺都', sourceQuote: '《三国史记》：甄萱起兵，陷庆州弑王，建后百济，争雄后三国。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_341', layer: 'tactical', series: 'enhance', index: 341,
        displayName: '远驱破国', sourceQuote: '《史记·西南夷列传》：庄蹻将楚军循江略地，至滇池，因王其地。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_342', layer: 'tactical', series: 'enhance', index: 342,
        displayName: '楼船摧岸', sourceQuote: '《梁书·扶南传》：范蔓造大船，泛海攻屈都昆等国，拓地五六千里。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_343', layer: 'tactical', series: 'troop', index: 343,
        displayName: '舟师歼锐', sourceQuote: '《阿萨姆编年史》：拉其特萨莱加特水战大破莫卧儿舟师，保阿萨姆。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
    },
    {
        id: 'ts_344', layer: 'tactical', series: 'troop', index: 344,
        displayName: '绝崖驰袭', sourceQuote: '《平家物语》：义经鹎越逆落，纵骑下绝崖，奇袭平氏于一之谷。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
    },
    {
        id: 'ts_345', layer: 'tactical', series: 'enhance', index: 345,
        displayName: '破敌开幕', sourceQuote: '《太平记》：足利尊氏凑川破楠木正成，遂开幕府于室町。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_346', layer: 'tactical', series: 'troop', index: 346,
        displayName: '火矢焚舟', sourceQuote: '《阴德太平记》：村上水军以焙烙火矢焚织田舟师于木津川口。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
    },
    {
        id: 'ts_347', layer: 'tactical', series: 'enhance', index: 347,
        displayName: '泛海夺城', sourceQuote: '《大越史记全书》：制蓬峨屡浮海入寇，破大越，攻陷升龙。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_348', layer: 'tactical', series: 'enhance', index: 348,
        displayName: '驱象摧阵', sourceQuote: '《暹罗史》：纳黎萱乘象决战，破缅军象阵，复国拓疆。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_349', layer: 'tactical', series: 'enhance', index: 349,
        displayName: '收众摧锋', sourceQuote: '《西藏通史》：彭措南杰统一卫藏，建藏巴汗政权。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_350', layer: 'tactical', series: 'enhance', index: 350,
        displayName: '老谋荡寇', sourceQuote: '《宋书·沈庆之传》：庆之历平蛮叛，老而弥壮，为刘宋宿将。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_351', layer: 'tactical', series: 'troop', index: 351,
        displayName: '昼伏夜击', sourceQuote: '《旧唐书·程名振传》：名振昼息夜行，掩袭高丽于贵端水，破之。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
    },
    {
        id: 'ts_352', layer: 'tactical', series: 'enhance', index: 352,
        displayName: '征伐开疆', sourceQuote: '《弥兰陀王问经》：弥兰陀（米南德）雄踞西北印度，征伐拓地，威震诸邦。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_353', layer: 'tactical', series: 'enhance', index: 353,
        displayName: '聚众摧坚', sourceQuote: '《波斯史》：雅库布起于寒微，聚众建萨法尔，征服波斯东部。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_354', layer: 'tactical', series: 'enhance', index: 354,
        displayName: '连征摧远', sourceQuote: '《伽色尼史》：马哈茂德十七次远征印度，掠地无算，伽色尼极盛。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_355', layer: 'tactical', series: 'enhance', index: 355,
        displayName: '摧锋弑君', sourceQuote: '《魏书·嚈哒传》：嚈哒大破萨珊，杀波斯王卑路斯，称雄中亚。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_356', layer: 'tactical', series: 'enhance', index: 356,
        displayName: '飞军摧逆', sourceQuote: '《元史》：杨完者统苗军，屡破红巾，号飞军，为元室倚重。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_357', layer: 'tactical', series: 'enhance', index: 357,
        displayName: '威震绝域', sourceQuote: '《后汉书·西域传》：迦腻色迦盛时，兼并印度、中亚，贵霜为大国。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_358', layer: 'tactical', series: 'enhance', index: 358,
        displayName: '铁骑破锐', sourceQuote: '《萨珊史》：巴赫拉姆楚宾以铁骑大破西突厥于赫拉特，威名震波斯。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_359', layer: 'tactical', series: 'enhance', index: 359,
        displayName: '深入捣巢', sourceQuote: '《明史·鱼有沼传》：有沼深入建州，捣李满住之巢，破女真。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_360', layer: 'tactical', series: 'enhance', index: 360,
        displayName: '疾驱灭国', sourceQuote: '《金史·完颜宗翰传》：宗翰疾驱南下，俘天祚帝，破汴京，灭辽亡宋。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_361', layer: 'tactical', series: 'enhance', index: 361,
        displayName: '攻心摧部', sourceQuote: '《后汉书·西域传》：丘就却攻灭五翕侯，自立为王，国号贵霜。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_362', layer: 'tactical', series: 'enhance', index: 362,
        displayName: '越沙破垒', sourceQuote: '《西藏通史》：甘丹才旺率和硕特军越碛征拉达克，拓阿里之地。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_363', layer: 'tactical', series: 'troop', index: 363,
        displayName: '迂回袭砦', sourceQuote: '《三河物语》：酒井忠次迂回鸢巢山，奇袭武田后砦，长筱遂大捷。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
    },
    {
        id: 'ts_364', layer: 'tactical', series: 'enhance', index: 364,
        displayName: '席卷摧邻', sourceQuote: '《土佐物语》：长宗我部元亲以一领具足并阿波、赞岐，统一四国。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_365', layer: 'tactical', series: 'troop', index: 365,
        displayName: '扼江破舰', sourceQuote: '《清史稿》：沙尔虎达战罗刹于松花江，焚其舟舰，镇宁古塔。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
    },
    {
        id: 'ts_366', layer: 'tactical', series: 'troop', index: 366,
        displayName: '夜渡袭城', sourceQuote: '《旧唐书·郭孝恪传》：孝恪夜渡水，掩袭焉耆，破其城，经略西域。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
    },
    {
        id: 'ts_367', layer: 'tactical', series: 'enhance', index: 367,
        displayName: '摧锋拓边', sourceQuote: '《印度史》：头罗曼率阿尔洪嚈哒南侵，破诸国，据西北印度。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_368', layer: 'tactical', series: 'enhance', index: 368,
        displayName: '据隘御侵', sourceQuote: '《不丹史》：夏仲阿旺朗杰据险筑宗，屡退西藏入侵，统一不丹。',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_defender', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
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
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_371', layer: 'tactical', series: 'enhance', index: 371,
        displayName: '秉钺制敌', sourceQuote: '《敦煌吐蕃文书》：琼波邦色为苏毗大论，秉兵柄，屡制强敌。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_372', layer: 'tactical', series: 'enhance', index: 372,
        displayName: '奔袭陷城', sourceQuote: '《旧唐书·吐蕃传》：悉诺逻恭禄轻兵奔袭，陷瓜州，唐师震恐。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_373', layer: 'tactical', series: 'enhance', index: 373,
        displayName: '复土摧坚', sourceQuote: '《琉璃宫史》：雍笈牙起于寒微，破孟族，复缅甸，建贡榜王朝。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_374', layer: 'tactical', series: 'casualty', index: 374,
        displayName: '据险保民', sourceQuote: '《十国春秋》：钱镠破孙儒、平董昌，据两浙保境安民，建吴越。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.3, engineStatus: 'ready',
    },
    {
        id: 'ts_375', layer: 'tactical', series: 'enhance', index: 375,
        displayName: '骁锋陷阵', sourceQuote: '《史记·黥布列传》：布常为军锋，从项羽破秦，勇冠诸侯，王九江。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_376', layer: 'tactical', series: 'enhance', index: 376,
        displayName: '奋锐破坚', sourceQuote: '《梁书·曹景宗传》：景宗骁勇，钟离之役奋击，大破北魏数十万众。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_377', layer: 'tactical', series: 'enhance', index: 377,
        displayName: '摧锋靖边', sourceQuote: '《汉书·辛武贤传》：武贤击西羌于河湟，斩获甚众，威震边陲。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_378', layer: 'tactical', series: 'enhance', index: 378,
        displayName: '乘虚陷阙', sourceQuote: '《旧唐书·吐蕃传》：赤松德赞乘虚入寇，陷长安，立傀儡，吐蕃极盛。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_379', layer: 'tactical', series: 'troop', index: 379,
        displayName: '奄袭夺城', sourceQuote: '《宋史·夏国传》：李继迁出没无常，奄袭灵州，据银夏，奠西夏之基。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
    },
    {
        id: 'ts_380', layer: 'tactical', series: 'troop', index: 380,
        displayName: '风雨掩袭', sourceQuote: '《阴德太平记》：元就乘风雨夜渡海，掩袭严岛，破陶晴贤二万众。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
    },
    {
        id: 'ts_381', layer: 'tactical', series: 'enhance', index: 381,
        displayName: '千枪突阵', sourceQuote: '《太平记》：菊池武光以千本枪列阵猛突，筑后川大破北朝之军。',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_382', layer: 'tactical', series: 'troop', index: 382,
        displayName: '决堰歼敌', sourceQuote: '《高丽史》：姜邯赞堰水兴化镇，契丹半渡决之，龟州追歼十万。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
    },
    {
        id: 'ts_383', layer: 'tactical', series: 'enhance', index: 383,
        displayName: '闻鸡起舞', sourceQuote: '《晋书·祖逖传》："中夜闻鸡鸣，蹴琨觉曰：此非恶声也，因起舞。"',
        baseEffect: 'first_sortie_power_mult', condition: 'first_sortie', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_384', layer: 'tactical', series: 'fate', index: 384,
        displayName: '精达事机', sourceQuote: '《三国志·贾逵传》评："精达事机，威恩兼著。"',
        baseEffect: 'recompute_comeback', condition: 'side_comeback', phase: 'mid_battle_comeback',
        magnitude: 1, comebackThreshold: 0.8, engineStatus: 'ready',
    },
    {
        id: 'ts_385', layer: 'tactical', series: 'casualty', index: 385,
        displayName: '嚼齿吞贼', sourceQuote: '《旧唐书·张巡传》："大呼辄眦裂血面，嚼齿皆碎……气吞逆贼。"',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'battle_siege_defender', phase: 'post_battle',
        magnitude: 2.0, engineStatus: 'ready',
        note: '守城败时咬人：胜方(攻方)本场战损×2；契合张巡守睢阳虽陷、蔽遮江淮拖垮叛军的定位',
    },
    {
        id: 'ts_386', layer: 'tactical', series: 'enhance', index: 386,
        displayName: '刺山飞泉', sourceQuote: '《后汉书·耿恭传》："仰天叹曰：闻昔贰师将军拔佩刀刺山，飞泉涌出。"',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.55, engineStatus: 'ready',
    },
    {
        id: 'ts_387', layer: 'tactical', series: 'enhance', index: 387,
        displayName: '保境安民', sourceQuote: '《钱氏家训》："民为社稷之本，务须保民、保国、保天下。"（吴越三世相承，境内晏然。）',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_defender', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
    },
    {
        id: 'ts_388', layer: 'tactical', series: 'enhance', index: 388,
        displayName: '孤胆陷阵', sourceQuote: '《三国志·蜀书·赵云传》注引《云别传》："云将数十骑轻行出围……先主曰：子龙一身都是胆也。"',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.55, engineStatus: 'ready',
        note: '赵云长坂坡冲阵救主、汉水以数十骑出围破众；以少打多时爆发。绝地反击(ts_011)的赵云专属签名版',
    },

];

// ── T1 精锐·泛区名将专属技（24将×3局） ──────────────
const UNIQUE_T1_GENERAL: TacticalSkillEntry[] = [
    {
        id: 'ts_462', layer: 'tactical', series: 'enhance', index: 462,
        displayName: '合围攻心', sourceQuote: '沙普尔历史记载：沙普尔二世围攻罗马城塞并施心理威压',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【沙普尔】T1精锐·三势精修·势create·优局专属',
    },
    {
        id: 'ts_463', layer: 'tactical', series: 'fate', index: 463,
        displayName: '分进乱阵', sourceQuote: '沙普尔历史记载：沙普尔分路进击搅乱罗马防线',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.55, luckMax: 1.0,engineStatus: 'ready',
        note: '【沙普尔】T1精锐·三势精修·势create·均局专属',
    },
    {
        id: 'ts_464', layer: 'tactical', series: 'casualty', index: 464,
        displayName: '溃流遏追', sourceQuote: '沙普尔历史记载：沙普尔溃退中以骑兵逆击遏止追兵',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 2.0, engineStatus: 'ready',
        note: '【沙普尔】T1精锐·三势精修·势create·劣局专属',
    },
    {
        id: 'ts_465', layer: 'tactical', series: 'enhance', index: 465,
        displayName: '围城困崩', sourceQuote: '皇太极历史记载：松锦围城断粮困死明军主力',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【皇太极】T1精锐·三势精修·势reverse·优局专属',
    },
    {
        id: 'ts_466', layer: 'tactical', series: 'fate', index: 466,
        displayName: '长围断援', sourceQuote: '皇太极历史记载：大凌河长围久困绝敌外援使其自溃',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.55, luckMax: 1.0,engineStatus: 'ready',
        note: '【皇太极】T1精锐·三势精修·势reverse·均局专属',
    },
    {
        id: 'ts_467', layer: 'tactical', series: 'casualty', index: 467,
        displayName: '间行除患', sourceQuote: '皇太极历史记载：皇太极纵反间计除袁崇焕',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 2.0, engineStatus: 'ready',
        note: '【皇太极】T1精锐·三势精修·势reverse·劣局专属',
    },
    {
        id: 'ts_468', layer: 'tactical', series: 'enhance', index: 468,
        displayName: '风涛掩击', sourceQuote: '毛利元就历史记载：严岛风涛夜袭陶晴贤大营',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【毛利元就】T1精锐·三势精修·势leverage·优局专属',
    },
    {
        id: 'ts_469', layer: 'tactical', series: 'fate', index: 469,
        displayName: '诱锋夹击', sourceQuote: '毛利元就历史记载：吉田郡山诱敌深入两面夹击尼子军',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.55, luckMax: 1.0,engineStatus: 'ready',
        note: '【毛利元就】T1精锐·三势精修·势leverage·均局专属',
    },
    {
        id: 'ts_470', layer: 'tactical', series: 'casualty', index: 470,
        displayName: '笼城疲敌', sourceQuote: '毛利元就历史记载：吉田郡山笼城固守消耗尼子军',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.25, engineStatus: 'ready',
        note: '【毛利元就】T1精锐·三势精修·势leverage·劣局专属',
    },
    {
        id: 'ts_471', layer: 'tactical', series: 'enhance', index: 471,
        displayName: '据险摧锋', sourceQuote: '大祚荣历史记载：天门岭据险设伏击溃唐军',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【大祚荣】T1精锐·三势精修·势reverse·优局专属',
    },
    {
        id: 'ts_472', layer: 'tactical', series: 'counter', index: 472,
        displayName: '垒山遏骑', sourceQuote: '大祚荣历史记载：筑城垒山遏制唐军骑兵',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【大祚荣】T1精锐·三势精修·势reverse·均局专属',
    },
    {
        id: 'ts_473', layer: 'tactical', series: 'casualty', index: 473,
        displayName: '间道退敌', sourceQuote: '大祚荣历史记载：间道扰敌后方逼迫唐军退兵',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 2.0, engineStatus: 'ready',
        note: '【大祚荣】T1精锐·三势精修·势reverse·劣局专属',
    },
    {
        id: 'ts_474', layer: 'tactical', series: 'enhance', index: 474,
        displayName: '踏雪溃阵', sourceQuote: '拖雷历史记载：三峰山踏雪急袭溃灭金军主力',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【拖雷】T1精锐·三势精修·势create·优局专属',
    },
    {
        id: 'ts_475', layer: 'tactical', series: 'fate', index: 475,
        displayName: '假道迂击', sourceQuote: '拖雷历史记载：假道南宋迂回攻金侧翼',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.55, luckMax: 1.0,engineStatus: 'ready',
        note: '【拖雷】T1精锐·三势精修·势create·均局专属',
    },
    {
        id: 'ts_476', layer: 'tactical', series: 'casualty', index: 476,
        displayName: '散骑整众', sourceQuote: '拖雷历史记载：散骑溃退中重整部队保存主力',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.25, engineStatus: 'ready',
        note: '【拖雷】T1精锐·三势精修·势create·劣局专属',
    },
    {
        id: 'ts_477', layer: 'tactical', series: 'enhance', index: 477,
        displayName: '倍道摧坚', sourceQuote: '曹操历史记载：倍道兼行五日内摧灭袁尚',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【曹操】T1精锐·三势精修·势leverage·优局专属',
    },
    {
        id: 'ts_478', layer: 'tactical', series: 'counter', index: 478,
        displayName: '截粮疲敌', sourceQuote: '曹操历史记载：乌巢截粮焚积谷袁军自溃',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【曹操】T1精锐·三势精修·势leverage·均局专属',
    },
    {
        id: 'ts_479', layer: 'tactical', series: 'casualty', index: 479,
        displayName: '据营止溃', sourceQuote: '曹操历史记载：赤壁败退据营垒止溃稳阵',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.25, engineStatus: 'ready',
        note: '【曹操】T1精锐·三势精修·势leverage·劣局专属',
    },
    {
        id: 'ts_480', layer: 'tactical', series: 'enhance', index: 480,
        displayName: '长驱贯阵', sourceQuote: '柴荣历史记载：高平之战长驱贯阵勇破北汉',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【柴荣】T1精锐·三势精修·势create·优局专属',
    },
    {
        id: 'ts_481', layer: 'tactical', series: 'fate', index: 481,
        displayName: '虚实扰敌', sourceQuote: '柴荣历史记载：虚实扰敌疲耗南唐水寨',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.55, luckMax: 1.0,engineStatus: 'ready',
        note: '【柴荣】T1精锐·三势精修·势create·均局专属',
    },
    {
        id: 'ts_482', layer: 'tactical', series: 'casualty', index: 482,
        displayName: '背城遏锋', sourceQuote: '柴荣历史记载：淮南背城遏锋击退南唐反攻',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 2.0, engineStatus: 'ready',
        note: '【柴荣】T1精锐·三势精修·势create·劣局专属',
    },
    {
        id: 'ts_483', layer: 'tactical', series: 'enhance', index: 483,
        displayName: '象冲突阵', sourceQuote: '阇耶跋摩历史记载：象兵冲突敌阵踏破敌军防线',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【阇耶跋摩】T1精锐·三势精修·势create·优局专属',
    },
    {
        id: 'ts_484', layer: 'tactical', series: 'fate', index: 484,
        displayName: '林沼设伏', sourceQuote: '阇耶跋摩历史记载：林沼设伏诱敌深入覆灭',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.55, luckMax: 1.0,engineStatus: 'ready',
        note: '【阇耶跋摩】T1精锐·三势精修·势create·均局专属',
    },
    {
        id: 'ts_485', layer: 'tactical', series: 'casualty', index: 485,
        displayName: '散象溃敌', sourceQuote: '阇耶跋摩历史记载：象阵四散扰溃敌军各部',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.25, engineStatus: 'ready',
        note: '【阇耶跋摩】T1精锐·三势精修·势create·劣局专属',
    },
    {
        id: 'ts_486', layer: 'tactical', series: 'enhance', index: 486,
        displayName: '捣虚袭隙', sourceQuote: '扩廓帖木儿历史记载：出奇捣虚袭破明军薄弱处',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【扩廓帖木儿】T1精锐·三势精修·势create·优局专属',
    },
    {
        id: 'ts_487', layer: 'tactical', series: 'fate', index: 487,
        displayName: '沙尘掩袭', sourceQuote: '扩廓帖木儿历史记载：沙尘掩护突袭明军大营',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.55, luckMax: 1.0,engineStatus: 'ready',
        note: '【扩廓帖木儿】T1精锐·三势精修·势create·均局专属',
    },
    {
        id: 'ts_488', layer: 'tactical', series: 'casualty', index: 488,
        displayName: '诈北设伏', sourceQuote: '扩廓帖木儿历史记载：诈败佯北诱明军入伏',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 2.0, engineStatus: 'ready',
        note: '【扩廓帖木儿】T1精锐·三势精修·势create·劣局专属',
    },
    {
        id: 'ts_489', layer: 'tactical', series: 'enhance', index: 489,
        displayName: '威服摧盟', sourceQuote: '达延汗历史记载：威服漠南各部摧破联盟',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【达延汗】T1精锐·三势精修·势create·优局专属',
    },
    {
        id: 'ts_490', layer: 'tactical', series: 'fate', index: 490,
        displayName: '分道疲敌', sourceQuote: '达延汗历史记载：分道出击疲敌各部使其降服',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.55, luckMax: 1.0,engineStatus: 'ready',
        note: '【达延汗】T1精锐·三势精修·势create·均局专属',
    },
    {
        id: 'ts_491', layer: 'tactical', series: 'casualty', index: 491,
        displayName: '溃围整旅', sourceQuote: '达延汗历史记载：溃围中整旅收拢草原余部',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.25, engineStatus: 'ready',
        note: '【达延汗】T1精锐·三势精修·势create·劣局专属',
    },
    {
        id: 'ts_492', layer: 'tactical', series: 'enhance', index: 492,
        displayName: '屡蹶振击', sourceQuote: '李自成历史记载：屡败屡起振旅再击潼关',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【李自成】T1精锐·三势精修·势create·优局专属',
    },
    {
        id: 'ts_493', layer: 'tactical', series: 'fate', index: 493,
        displayName: '流动作势', sourceQuote: '李自成历史记载：流动作势调动明军疲于奔命',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.55, luckMax: 1.0,engineStatus: 'ready',
        note: '【李自成】T1精锐·三势精修·势create·均局专属',
    },
    {
        id: 'ts_494', layer: 'tactical', series: 'casualty', index: 494,
        displayName: '散营惑敌', sourceQuote: '李自成历史记载：溃退中散营分走迷惑追兵',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 2.0, engineStatus: 'ready',
        note: '【李自成】T1精锐·三势精修·势create·劣局专属',
    },
    {
        id: 'ts_495', layer: 'tactical', series: 'enhance', index: 495,
        displayName: '转战摧虚', sourceQuote: '张献忠历史记载：转战千里摧击明军薄弱州邑',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【张献忠】T1精锐·三势精修·势create·优局专属',
    },
    {
        id: 'ts_496', layer: 'tactical', series: 'fate', index: 496,
        displayName: '设伏夹截', sourceQuote: '张献忠历史记载：设伏山谷夹截追击明军',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.55, luckMax: 1.0,engineStatus: 'ready',
        note: '【张献忠】T1精锐·三势精修·势create·均局专属',
    },
    {
        id: 'ts_497', layer: 'tactical', series: 'casualty', index: 497,
        displayName: '溃途收众', sourceQuote: '张献忠历史记载：溃途收拢流散部众复振军势',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.25, engineStatus: 'ready',
        note: '【张献忠】T1精锐·三势精修·势create·劣局专属',
    },
    {
        id: 'ts_498', layer: 'tactical', series: 'enhance', index: 498,
        displayName: '驰射回锋', sourceQuote: '苏伦历史记载：卡莱之战回马驰射崩溃罗马军团',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【苏伦】T1精锐·三势精修·势create·优局专属',
    },
    {
        id: 'ts_499', layer: 'tactical', series: 'fate', index: 499,
        displayName: '伪遁诱截', sourceQuote: '苏伦历史记载：伪遁诱敌深入帕提亚腹地',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.55, luckMax: 1.0,engineStatus: 'ready',
        note: '【苏伦】T1精锐·三势精修·势create·均局专属',
    },
    {
        id: 'ts_500', layer: 'tactical', series: 'casualty', index: 500,
        displayName: '绝地逆摧', sourceQuote: '苏伦历史记载：绝地逆摧反击突破重围',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 2.0, engineStatus: 'ready',
        note: '【苏伦】T1精锐·三势精修·势create·劣局专属',
    },
    {
        id: 'ts_501', layer: 'tactical', series: 'enhance', index: 501,
        displayName: '破盟摧众', sourceQuote: '艾哈迈德历史记载：破敌联盟摧其众军统一阿富汗',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【艾哈迈德】T1精锐·三势精修·势create·优局专属',
    },
    {
        id: 'ts_502', layer: 'tactical', series: 'fate', index: 502,
        displayName: '间使离敌', sourceQuote: '艾哈迈德历史记载：间使离间敌盟内部使其瓦解',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.55, luckMax: 1.0,engineStatus: 'ready',
        note: '【艾哈迈德】T1精锐·三势精修·势create·均局专属',
    },
    {
        id: 'ts_503', layer: 'tactical', series: 'casualty', index: 503,
        displayName: '据险退敌', sourceQuote: '艾哈迈德历史记载：据险设垒遏退莫卧儿军',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.25, engineStatus: 'ready',
        note: '【艾哈迈德】T1精锐·三势精修·势create·劣局专属',
    },
    {
        id: 'ts_504', layer: 'tactical', series: 'enhance', index: 504,
        displayName: '分进合击', sourceQuote: '噶勒丹策凌历史记载：和通泊分进合击歼灭清军',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【噶勒丹策凌】T1精锐·三势精修·势create·优局专属',
    },
    {
        id: 'ts_505', layer: 'tactical', series: 'fate', index: 505,
        displayName: '诈退设伏', sourceQuote: '噶勒丹策凌历史记载：诈退设伏诱清军深入',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.55, luckMax: 1.0,engineStatus: 'ready',
        note: '【噶勒丹策凌】T1精锐·三势精修·势create·均局专属',
    },
    {
        id: 'ts_506', layer: 'tactical', series: 'casualty', index: 506,
        displayName: '聚散再战', sourceQuote: '噶勒丹策凌历史记载：光显寺聚散余部再战突围',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.25, engineStatus: 'ready',
        note: '【噶勒丹策凌】T1精锐·三势精修·势create·劣局专属',
    },
    {
        id: 'ts_507', layer: 'tactical', series: 'enhance', index: 507,
        displayName: '后发摧敌', sourceQuote: '德川家康历史记载：关原后发制人摧灭丰臣',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【德川家康】T1精锐·三势精修·势leverage·优局专属',
    },
    {
        id: 'ts_508', layer: 'tactical', series: 'fate', index: 508,
        displayName: '持重疲彼', sourceQuote: '德川家康历史记载：长久手持重不出疲敌待机',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.55, luckMax: 1.0,engineStatus: 'ready',
        note: '【德川家康】T1精锐·三势精修·势leverage·均局专属',
    },
    {
        id: 'ts_509', layer: 'tactical', series: 'casualty', index: 509,
        displayName: '笼城挫锐', sourceQuote: '德川家康历史记载：大坂冬之阵笼城挫锐退丰臣军',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 2.0, engineStatus: 'ready',
        note: '【德川家康】T1精锐·三势精修·势leverage·劣局专属',
    },
    {
        id: 'ts_510', layer: 'tactical', series: 'enhance', index: 510,
        displayName: '冲阵摧众', sourceQuote: '尔朱荣历史记载：滏口破阵摧灭葛荣百万军',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【尔朱荣】T1精锐·三势精修·势create·优局专属',
    },
    {
        id: 'ts_511', layer: 'tactical', series: 'fate', index: 511,
        displayName: '并阵夹击', sourceQuote: '尔朱荣历史记载：并阵夹击冲乱敌军大阵',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.55, luckMax: 1.0,engineStatus: 'ready',
        note: '【尔朱荣】T1精锐·三势精修·势create·均局专属',
    },
    {
        id: 'ts_512', layer: 'tactical', series: 'casualty', index: 512,
        displayName: '溃军斩将', sourceQuote: '尔朱荣历史记载：溃败中以骑突斩敌主将逆转',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 2.0, engineStatus: 'ready',
        note: '【尔朱荣】T1精锐·三势精修·势create·劣局专属',
    },
    {
        id: 'ts_513', layer: 'tactical', series: 'enhance', index: 513,
        displayName: '待劳摧锐', sourceQuote: '论钦陵历史记载：大非川以逸待劳摧薛仁贵锐师',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【论钦陵】T1精锐·三势精修·势create·优局专属',
    },
    {
        id: 'ts_514', layer: 'tactical', series: 'fate', index: 514,
        displayName: '据高遏骑', sourceQuote: '论钦陵历史记载：据高遏骑截唐军退路',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.55, luckMax: 1.0,engineStatus: 'ready',
        note: '【论钦陵】T1精锐·三势精修·势create·均局专属',
    },
    {
        id: 'ts_515', layer: 'tactical', series: 'casualty', index: 515,
        displayName: '间道逆摧', sourceQuote: '论钦陵历史记载：间道逆摧反击突破唐军重围',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 2.0, engineStatus: 'ready',
        note: '【论钦陵】T1精锐·三势精修·势create·劣局专属',
    },
    {
        id: 'ts_516', layer: 'tactical', series: 'enhance', index: 516,
        displayName: '两蹶摧锋', sourceQuote: '李定国历史记载：两蹶名王摧锋桂林衡阳',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【李定国】T1精锐·三势精修·势reverse·优局专属',
    },
    {
        id: 'ts_517', layer: 'tactical', series: 'fate', index: 517,
        displayName: '伏山断道', sourceQuote: '李定国历史记载：伏山断道截清军退路',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.55, luckMax: 1.0,engineStatus: 'ready',
        note: '【李定国】T1精锐·三势精修·势reverse·均局专属',
    },
    {
        id: 'ts_518', layer: 'tactical', series: 'casualty', index: 518,
        displayName: '焚舟死战', sourceQuote: '李定国历史记载：焚舟表死志决战清军',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 2.0, engineStatus: 'ready',
        note: '【李定国】T1精锐·三势精修·势reverse·劣局专属',
    },
    {
        id: 'ts_519', layer: 'tactical', series: 'enhance', index: 519,
        displayName: '雪岭摧垒', sourceQuote: '巴都尔萨野历史记载：雪岭翻越摧破藏军壁垒',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【巴都尔萨野】T1精锐·三势精修·势create·优局专属',
    },
    {
        id: 'ts_520', layer: 'tactical', series: 'fate', index: 520,
        displayName: '断道截粮', sourceQuote: '巴都尔萨野历史记载：断道截粮饥困守军',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.55, luckMax: 1.0,engineStatus: 'ready',
        note: '【巴都尔萨野】T1精锐·三势精修·势create·均局专属',
    },
    {
        id: 'ts_521', layer: 'tactical', series: 'casualty', index: 521,
        displayName: '散兵扰后', sourceQuote: '巴都尔萨野历史记载：散兵扰后牵制敌军援兵',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.25, engineStatus: 'ready',
        note: '【巴都尔萨野】T1精锐·三势精修·势create·劣局专属',
    },
    {
        id: 'ts_522', layer: 'tactical', series: 'enhance', index: 522,
        displayName: '象蹈摧坚', sourceQuote: '莽应龙历史记载：白象践踏阿瑜陀耶步阵摧毁其坚',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【莽应龙】T1精锐·三势精修·势create·优局专属',
    },
    {
        id: 'ts_523', layer: 'tactical', series: 'fate', index: 523,
        displayName: '象阵扰敌', sourceQuote: '莽应龙历史记载：象阵纵横扰乱敌军',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.55, luckMax: 1.0,engineStatus: 'ready',
        note: '【莽应龙】T1精锐·三势精修·势create·均局专属',
    },
    {
        id: 'ts_524', layer: 'tactical', series: 'casualty', index: 524,
        displayName: '逆锋摧追', sourceQuote: '莽应龙历史记载：逆锋摧追倒退敌军',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 2.0, engineStatus: 'ready',
        note: '【莽应龙】T1精锐·三势精修·势create·劣局专属',
    },
    {
        id: 'ts_525', layer: 'tactical', series: 'enhance', index: 525,
        displayName: '兵雄摧阵', sourceQuote: '摩诃末历史记载：兵雄势盛摧击西辽阵线',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【摩诃末】T1精锐·三势精修·势create·优局专属',
    },
    {
        id: 'ts_526', layer: 'tactical', series: 'fate', index: 526,
        displayName: '退避疲敌', sourceQuote: '摩诃末历史记载：退避坚城疲耗蒙古远征军',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.55, luckMax: 1.0,engineStatus: 'ready',
        note: '【摩诃末】T1精锐·三势精修·势create·均局专属',
    },
    {
        id: 'ts_527', layer: 'tactical', series: 'casualty', index: 527,
        displayName: '散众溃围', sourceQuote: '摩诃末历史记载：散众分走溃围保全余部',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.25, engineStatus: 'ready',
        note: '【摩诃末】T1精锐·三势精修·势create·劣局专属',
    },
    {
        id: 'ts_528', layer: 'tactical', series: 'enhance', index: 528,
        displayName: '建帐摧敌', sourceQuote: '骨力裴罗历史记载：建牙立帐摧破后突厥',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【骨力裴罗】T1精锐·三势精修·势create·优局专属',
    },
    {
        id: 'ts_529', layer: 'tactical', series: 'fate', index: 529,
        displayName: '纵骑扰后', sourceQuote: '骨力裴罗历史记载：纵骑扰后疲耗突厥',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.55, luckMax: 1.0,engineStatus: 'ready',
        note: '【骨力裴罗】T1精锐·三势精修·势create·均局专属',
    },
    {
        id: 'ts_530', layer: 'tactical', series: 'casualty', index: 530,
        displayName: '盟兵共御', sourceQuote: '骨力裴罗历史记载：盟结诸部共御外敌',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.25, engineStatus: 'ready',
        note: '【骨力裴罗】T1精锐·三势精修·势create·劣局专属',
    },
    {
        id: 'ts_531', layer: 'tactical', series: 'enhance', index: 531,
        displayName: '黑旗摧阵', sourceQuote: '吉亚斯丁历史记载：黑旗壮军摧破敌军',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【吉亚斯丁】T1精锐·三势精修·势create·优局专属',
    },
    {
        id: 'ts_532', layer: 'tactical', series: 'fate', index: 532,
        displayName: '重骑截锋', sourceQuote: '吉亚斯丁历史记载：重骑截锋冲断敌军',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.55, luckMax: 1.0,engineStatus: 'ready',
        note: '【吉亚斯丁】T1精锐·三势精修·势create·均局专属',
    },
    {
        id: 'ts_533', layer: 'tactical', series: 'casualty', index: 533,
        displayName: '据垒疲敌', sourceQuote: '吉亚斯丁历史记载：据垒疲敌耗其锐气',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.25, engineStatus: 'ready',
        note: '【吉亚斯丁】T1精锐·三势精修·势create·劣局专属',
    },
];

// ── 三十六计补充（36 计 · 六套 × 效果，共享池） ──────────────
const SANSHILIU: TacticalSkillEntry[] = [
    {
        id: 'ts_389', layer: 'tactical', series: 'troop', index: 389,
        displayName: '瞒天过海', sourceQuote: '《旧唐书·薛仁贵传》：张帷幕覆沙土于船，太宗不觉渡海。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.12, engineStatus: 'ready',
        note: '【胜战计·全】薛仁贵；三十六计补充',
    },
    {
        id: 'ts_390', layer: 'tactical', series: 'troop', index: 390,
        displayName: '围魏救赵', sourceQuote: '《史记·孙子吴起列传》：直捣大梁，魏军回救，破于桂陵。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.12, engineStatus: 'ready',
        note: '【胜战计·全】孙膑；三十六计补充',
    },
    {
        id: 'ts_391', layer: 'tactical', series: 'troop', index: 391,
        displayName: '借刀杀人', sourceQuote: '《三国志·武帝纪》：阴使孙权图羽，借吴刀除心腹。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.12, engineStatus: 'ready',
        note: '【胜战计·全】曹操；三十六计补充',
    },
    {
        id: 'ts_392', layer: 'tactical', series: 'troop', index: 392,
        displayName: '趁火打劫', sourceQuote: '《三国志·孙策传》：欲趁官渡相持袭许昌挟帝，未行而遇刺。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'always', phase: 'pre_opening_troops',
        magnitude: 0.12, engineStatus: 'ready',
        note: '【胜战计·全】孙策；三十六计补充',
    },
    {
        id: 'ts_393', layer: 'tactical', series: 'fate', index: 393,
        displayName: '无中生有', sourceQuote: '《南史·檀道济传》：唱筹量沙，全军而反，魏人不敢逼。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.55, luckMax: 1.0, engineStatus: 'ready',
        note: '【敌战计·衡】檀道济；三十六计补充',
    },
    {
        id: 'ts_394', layer: 'tactical', series: 'fate', index: 394,
        displayName: '隔岸观火', sourceQuote: '《晋书·慕容垂载记》：淝水溃，唯垂军三万独完，不援苻坚，北归建燕。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.55, luckMax: 1.0, engineStatus: 'ready',
        note: '【敌战计·衡】慕容垂；三十六计补充',
    },
    {
        id: 'ts_395', layer: 'tactical', series: 'fate', index: 395,
        displayName: '笑里藏刀', sourceQuote: '《史记·商君列传》：致书公子卬约盟，饮而伏甲掳之，遂破魏。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.55, luckMax: 1.0, engineStatus: 'ready',
        note: '【敌战计·衡】商鞅；三十六计补充',
    },
    {
        id: 'ts_396', layer: 'tactical', series: 'fate', index: 396,
        displayName: '李代桃僵', sourceQuote: '《三国志·陆逊传》：孙桓部吸引刘备前锋，逊按兵寻机，火烧连营破蜀。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.55, luckMax: 1.0, engineStatus: 'ready',
        note: '【敌战计·衡】陆逊；三十六计补充',
    },
    {
        id: 'ts_397', layer: 'tactical', series: 'fate', index: 397,
        displayName: '顺手牵羊', sourceQuote: '《三国志·吕蒙传》：诈病代己，白衣渡江袭荆州。',
        baseEffect: 'luck_variance_enemy', condition: 'always', phase: 'opening_roll',
        magnitude: 1, luckMin: 0.55, luckMax: 1.0, engineStatus: 'ready',
        note: '【敌战计·衡】吕蒙；三十六计补充',
    },
    {
        id: 'ts_398', layer: 'tactical', series: 'enhance', index: 398,
        displayName: '打草惊蛇', sourceQuote: '《汉书·周亚夫传》：遣轻骑绝吴楚粮道，惊动叛军，乱其部署。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.3, engineStatus: 'ready',
        note: '【攻战计·机】周亚夫；三十六计补充',
    },
    {
        id: 'ts_399', layer: 'tactical', series: 'enhance', index: 399,
        displayName: '借尸还魂', sourceQuote: '《史记·项羽本纪》：求楚怀王孙心，立以为楚怀王，从民所望。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.3, engineStatus: 'ready',
        note: '【攻战计·机】项梁；三十六计补充',
    },
    {
        id: 'ts_400', layer: 'tactical', series: 'enhance', index: 400,
        displayName: '调虎离山', sourceQuote: '《后汉书·虞诩传》：扬言援军已到，诱羌分兵，乘隙突围增灶示强。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.3, engineStatus: 'ready',
        note: '【攻战计·机】虞诩；三十六计补充',
    },
    {
        id: 'ts_401', layer: 'tactical', series: 'enhance', index: 401,
        displayName: '欲擒故纵', sourceQuote: '《华阳国志》：七纵七禽，南人不复反。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.3, engineStatus: 'ready',
        note: '【攻战计·机】诸葛亮；三十六计补充',
    },
    {
        id: 'ts_402', layer: 'tactical', series: 'enhance', index: 402,
        displayName: '抛砖引玉', sourceQuote: '《史记·李牧列传》：纵畜牧诱匈奴深入，合围大破，十余岁不敢近赵。',
        baseEffect: 'ally_power_mult', condition: 'always', phase: 'opening_roll',
        magnitude: 1.3, engineStatus: 'ready',
        note: '【攻战计·机】李牧；三十六计补充',
    },
    {
        id: 'ts_403', layer: 'tactical', series: 'counter', index: 403,
        displayName: '釜底抽薪', sourceQuote: '《旧唐书·太宗纪》：浅水原相持，绝薛军粮道，待其溃而铁骑突击灭西秦。',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【混战计·乱】李世民；三十六计补充',
    },
    {
        id: 'ts_404', layer: 'tactical', series: 'counter', index: 404,
        displayName: '浑水摸鱼', sourceQuote: '《旧唐书·李靖传》：趁秋水暴涨，萧铣不备，舰队直捣江陵灭南梁。',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【混战计·乱】李靖；三十六计补充',
    },
    {
        id: 'ts_405', layer: 'tactical', series: 'counter', index: 405,
        displayName: '金蝉脱壳', sourceQuote: '《三国志·孙坚传》：坚败，祖茂脱坚赤帻，坚由间道得免。',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【混战计·乱】孙坚；三十六计补充',
    },
    {
        id: 'ts_406', layer: 'tactical', series: 'counter', index: 406,
        displayName: '关门捉贼', sourceQuote: '《史记·白起列传》：诈败诱赵括出垒，奇兵绝后，围歼四十万。',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【混战计·乱】白起；三十六计补充',
    },
    {
        id: 'ts_407', layer: 'tactical', series: 'counter', index: 407,
        displayName: '远交近攻', sourceQuote: '《史记·赵世家》：盟秦韩宋，专力攻中山，终灭之。',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【混战计·乱】赵武灵王；三十六计补充',
    },
    {
        id: 'ts_408', layer: 'tactical', series: 'counter', index: 408,
        displayName: '假道伐虢', sourceQuote: '《三国志·周瑜传》：赤壁后与曹仁战南郡，刘备借荆州，瑜谋假道伐蜀以取之，事未成而薨。',
        baseEffect: 'negate_enemy_skill', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '【混战计·乱】周瑜；三十六计补充',
    },
    {
        id: 'ts_409', layer: 'tactical', series: 'casualty', index: 409,
        displayName: '偷梁换柱', sourceQuote: '《史记·赵奢传》：去邯郸三十里坚壁二十八日示弱，卷甲急行抢北山大破秦军。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.2, engineStatus: 'ready',
        note: '【并战计·借】赵奢；三十六计补充',
    },
    {
        id: 'ts_410', layer: 'tactical', series: 'casualty', index: 410,
        displayName: '反客为主', sourceQuote: '《晋书·宣帝纪》：诈疾十年，高平陵闭城夺兵，诛曹爽三族，由辅臣易天下之主。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.2, engineStatus: 'ready',
        note: '【并战计·借】司马懿；三十六计补充',
    },
    {
        id: 'ts_411', layer: 'tactical', series: 'casualty', index: 411,
        displayName: '指桑骂槐', sourceQuote: '《史记·孙子吴起列传》：斩吴王宠姬以徇，宫女皆中规矩。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.2, engineStatus: 'ready',
        note: '【并战计·借】孙武；三十六计补充',
    },
    {
        id: 'ts_412', layer: 'tactical', series: 'casualty', index: 412,
        displayName: '假痴不癫', sourceQuote: '《三国志·先主传》：种菜灌园，闻雷失箸，曹操不疑。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.2, engineStatus: 'ready',
        note: '【并战计·借】刘备；三十六计补充',
    },
    {
        id: 'ts_413', layer: 'tactical', series: 'casualty', index: 413,
        displayName: '上屋抽梯', sourceQuote: '《吴子》：佯走诱秦入谷，伏兵绝归路，夹击尽歼。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.2, engineStatus: 'ready',
        note: '【并战计·借】吴起；三十六计补充',
    },
    {
        id: 'ts_414', layer: 'tactical', series: 'casualty', index: 414,
        displayName: '树上开花', sourceQuote: '《三国志·张飞传》：据水断桥，使二十骑曳柴扬尘，曹军不敢近。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.2, engineStatus: 'ready',
        note: '【并战计·借】张飞；三十六计补充',
    },
    {
        id: 'ts_415', layer: 'tactical', series: 'casualty', index: 415,
        displayName: '倾城误敌', sourceQuote: '《吴越春秋》：得苎萝山鬻薪之女西施、郑旦，献于吴。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'ratio_underdog', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '【败战计·险】勾践；三十六计补充',
    },
    {
        id: 'ts_416', layer: 'tactical', series: 'casualty', index: 416,
        displayName: '反间除帅', sourceQuote: '《三国志·周瑜传》：使蒋干窃伪书，曹操诛蔡瑁张允。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '【败战计·险】周瑜；三十六计补充',
    },
    {
        id: 'ts_417', layer: 'tactical', series: 'casualty', index: 417,
        displayName: '苦肉诈降', sourceQuote: '《三国志·周瑜传》：瑜笞盖，诈降，火攻赤壁。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '【败战计·险】黄盖；三十六计补充',
    },
    {
        id: 'ts_418', layer: 'tactical', series: 'casualty', index: 418,
        displayName: '连环离间', sourceQuote: '《后汉书·王允传》：王允结吕布为内应，诛董卓。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '【败战计·险】吕布；三十六计补充',
    },
    {
        id: 'ts_419', layer: 'tactical', series: 'casualty', index: 419,
        displayName: '全师而退', sourceQuote: '《史记·项羽本纪》：沛公起如厕，间道走霸上。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 1.5, engineStatus: 'ready',
        note: '【败战计·险】刘邦；三十六计补充',
    },
];

// ── T0 精锐·名将专属技（三势精修） ──────────────
const UNIQUE_T0_REVISE: TacticalSkillEntry[] = [
    {
        id: 'ts_420', layer: 'tactical', series: 'enhance', index: 420,
        displayName: '散阵遏骑', sourceQuote: '《宋史·岳飞传》：步卒麻扎刀入阵，砍拐子马足，金军大乱。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【岳飞】T0精锐·岳飞·势create·均局专属（三势精修）',
    },
    {
        id: 'ts_421', layer: 'tactical', series: 'casualty', index: 421,
        displayName: '空寨掩击', sourceQuote: '《宋史·岳飞传》：五百背嵬突入金营，数万金军溃散。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 2.0, engineStatus: 'ready',
        note: '【岳飞】T0精锐·岳飞·势create·劣局专属（三势精修）',
    },
    {
        id: 'ts_422', layer: 'tactical', series: 'enhance', index: 422,
        displayName: '弃辎突袭', sourceQuote: '《汉书·卫青霍去病传》：取食于敌，轻骑驰突数千里。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【霍去病】T0精锐·霍去病·势create·均局专属（三势精修）',
    },
    {
        id: 'ts_423', layer: 'tactical', series: 'casualty', index: 423,
        displayName: '散骑溃阵', sourceQuote: '《汉书·卫青霍去病传》：八百骑脱离大军，斩单于祖父辈二千余。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 2.0, engineStatus: 'ready',
        note: '【霍去病】T0精锐·霍去病·势create·劣局专属（三势精修）',
    },
    {
        id: 'ts_424', layer: 'tactical', series: 'enhance', index: 424,
        displayName: '囊沙壅流', sourceQuote: '《史记·淮阴侯列传》：万只沙囊壅潍水，待楚军半渡决囊截击。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【韩信】T0精锐·韩信·势reverse·均局专属（三势精修）',
    },
    {
        id: 'ts_425', layer: 'tactical', series: 'casualty', index: 425,
        displayName: '拔帜易帜', sourceQuote: '《史记·淮阴侯列传》：遣二千骑入赵壁，拔赵帜立汉赤帜，赵军溃。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 2.0, engineStatus: 'ready',
        note: '【韩信】T0精锐·韩信·势reverse·劣局专属（三势精修）',
    },
    {
        id: 'ts_426', layer: 'tactical', series: 'enhance', index: 426,
        displayName: '晨驰摧阵', sourceQuote: '《史记·项羽本纪》：三万精骑晨驰破彭城五十六万联军，睢水不流。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【项羽】T0精锐·项羽·势reverse·均局专属（三势精修）',
    },
    {
        id: 'ts_427', layer: 'tactical', series: 'casualty', index: 427,
        displayName: '溃围断后', sourceQuote: '《史记·项羽本纪》：垓下突围自断后，斩汉军数百，二十八骑犹列阵。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'post_battle',
        magnitude: 0.25, engineStatus: 'ready',
        note: '【项羽】T0精锐·项羽·势reverse·劣局专属（三势精修）',
    },
    {
        id: 'ts_428', layer: 'tactical', series: 'enhance', index: 428,
        displayName: '诱锋夹截', sourceQuote: '《吴子·图国》：示弱诱秦前锋深入，两翼截断，秦军溃乱。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【吴起】T0精锐·吴起·势create·均局专属（三势精修）',
    },
    {
        id: 'ts_429', layer: 'tactical', series: 'casualty', index: 429,
        displayName: '死士断喉', sourceQuote: '《史记·孙子吴起列传》：被箭伏王尸上，叛军射尸触法被族灭七十余。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 2.0, engineStatus: 'ready',
        note: '【吴起】T0精锐·吴起·势create·劣局专属（三势精修）',
    },

    {
        id: 'ts_430', layer: 'tactical', series: 'enhance', index: 430,
        displayName: '阵遏锋摧', sourceQuote: '《晋书·谢玄传》：八千北府兵急渡淝水，直冲秦前锋，朱序后方大呼秦军败。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【谢玄】T0精锐·reverse·势均局专属（三势精修）',
    },
    {
        id: 'ts_431', layer: 'tactical', series: 'casualty', index: 431,
        displayName: '溃军反扼', sourceQuote: '《晋书·谢玄传》：以少兵扼险要水道，阻遏秦军长驱。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.25, engineStatus: 'ready',
        note: '【谢玄】T0精锐·reverse·势劣局专属（三势精修）',
    },
    {
        id: 'ts_432', layer: 'tactical', series: 'enhance', index: 432,
        displayName: '收郡疲敌', sourceQuote: '《后汉书·光武帝纪》：分遣将领招抚郡县，断铜马补给，粮尽自溃。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【刘秀】T0精锐·reverse·势均局专属（三势精修）',
    },
    {
        id: 'ts_433', layer: 'tactical', series: 'casualty', index: 433,
        displayName: '溃围突冲', sourceQuote: '《后汉书·光武帝纪》：十三骑乘夜溃围求援，内外夹击破莽军。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 2.0, engineStatus: 'ready',
        note: '【刘秀】T0精锐·reverse·势劣局专属（三势精修）',
    },
    {
        id: 'ts_434', layer: 'tactical', series: 'enhance', index: 434,
        displayName: '贯阵摧坚', sourceQuote: '《旧唐书·太宗本纪》：三千五百玄甲贯夏军十万大阵，阵后张唐帜，夏军溃乱。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【李世民】T0精锐·create·势均局专属（三势精修）',
    },
    {
        id: 'ts_435', layer: 'tactical', series: 'casualty', index: 435,
        displayName: '绝粮伺击', sourceQuote: '《旧唐书·太宗本纪》：深沟高垒断薛仁杲粮道，待其饥疲一鼓破之。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 2.0, engineStatus: 'ready',
        note: '【李世民】T0精锐·create·势劣局专属（三势精修）',
    },
    {
        id: 'ts_436', layer: 'tactical', series: 'enhance', index: 436,
        displayName: '纵舟乱阵', sourceQuote: '《旧唐书·李靖传》：火舟纵流入敌水寨焚其战船，乘烟掩杀破寨。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【李靖】T0精锐·create·势均局专属（三势精修）',
    },
    {
        id: 'ts_437', layer: 'tactical', series: 'casualty', index: 437,
        displayName: '佯败诱截', sourceQuote: '《旧唐书·李靖传》：佯败诱颉利追击，伏兵截归路大破突厥。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 2.0, engineStatus: 'ready',
        note: '【李靖】T0精锐·create·势劣局专属（三势精修）',
    },
    {
        id: 'ts_438', layer: 'tactical', series: 'enhance', index: 438,
        displayName: '鹤翼散击', sourceQuote: '《李忠武公全书》：鹤翼阵散开包围，龟船居中突入日舰。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【李舜臣】T0精锐·reverse·势均局专属（三势精修）',
    },
    {
        id: 'ts_439', layer: 'tactical', series: 'casualty', index: 439,
        displayName: '潮截归路', sourceQuote: '《李忠武公全书》：十二船借鸣梁潮汐截断日舰退路，趁乱击溃。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 2.0, engineStatus: 'ready',
        note: '【李舜臣】T0精锐·reverse·势劣局专属（三势精修）',
    },
    {
        id: 'ts_440', layer: 'tactical', series: 'enhance', index: 440,
        displayName: '伏桩遏舟', sourceQuote: '《大越史记全书》：江底植桩，诱元船入，退潮桩出搁浅火攻破之。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【陈国峻】T0精锐·reverse·势均局专属（三势精修）',
    },
    {
        id: 'ts_441', layer: 'tactical', series: 'casualty', index: 441,
        displayName: '散舟火扰', sourceQuote: '《大越史记全书》：小船载火具夜入元军水寨，四处纵火乱敌。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 2.0, engineStatus: 'ready',
        note: '【陈国峻】T0精锐·reverse·势劣局专属（三势精修）',
    },
    {
        id: 'ts_442', layer: 'tactical', series: 'enhance', index: 442,
        displayName: '凿道迂摧', sourceQuote: '《元史·太祖本纪》：野狐岭正面佯攻，木华黎山间凿道迂回侧后。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【成吉思汗】T0精锐·create·势均局专属（三势精修）',
    },
    {
        id: 'ts_443', layer: 'tactical', series: 'casualty', index: 443,
        displayName: '溃走整众', sourceQuote: '《蒙古秘史》卷四：十三翼溃退中整众而走，主力保全。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.25, engineStatus: 'ready',
        note: '【成吉思汗】T0精锐·create·势劣局专属（三势精修）',
    },
    {
        id: 'ts_444', layer: 'tactical', series: 'enhance', index: 444,
        displayName: '中军截阵', sourceQuote: '《金史·太祖本纪》：护步答冈精兵直突辽中军，斩首指挥，辽军全溃。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【完颜阿骨打】T0精锐·create·势均局专属（三势精修）',
    },
    {
        id: 'ts_445', layer: 'tactical', series: 'casualty', index: 445,
        displayName: '背壕死突', sourceQuote: '《金史·太祖本纪》：背壕列阵断己归路，死战突贯辽军前队。',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 2.0, engineStatus: 'ready',
        note: '【完颜阿骨打】T0精锐·create·势劣局专属（三势精修）',
    },
    {
        id: 'ts_446', layer: 'tactical', series: 'enhance', index: 446,
        displayName: '结阵待隙', sourceQuote: '《清史稿·多尔衮传》：一片石结阵不出，待两军疲敝侧击破闯军。',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【多尔衮】T0精锐·create·势均局专属（三势精修）',
    },
    {
        id: 'ts_447', layer: 'tactical', series: 'casualty', index: 447,
        displayName: '分道掩退', sourceQuote: '《清史稿·多尔衮传》：分兵佯攻掩护，主军乘夜退走全军未溃。',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.25, engineStatus: 'ready',
        note: '【多尔衮】T0精锐·create·势劣局专属（三势精修）',
    },
];


// ── T1 精锐·赵宋区·名将专属技 ──────────────
const UNIQUE_T1_ZHAO: TacticalSkillEntry[] = [
    {
        id: 'ts_448', layer: 'tactical', series: 'enhance', index: 448,
        displayName: '诱营掩袭', sourceQuote: '《宋史·赵匡胤传》相关记载：清流关夜遣军绕营后，正面佯攻，伏兵掩杀，皇甫晖败走。《宋史·太祖本纪》',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【赵匡胤】T1精锐·赵宋区·势create·均局专属（三势精修）',
    },
    {
        id: 'ts_449', layer: 'tactical', series: 'casualty', index: 449,
        displayName: '溃流断遏', sourceQuote: '《宋史·赵匡胤传》相关记载：寿州友军溃退，率殿后精骑扼守隘口横击追兵，溃兵收拢整编。《宋史·太祖本纪》',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.25, engineStatus: 'ready',
        note: '【赵匡胤】T1精锐·赵宋区·势create·劣局专属（三势精修）',
    },
    {
        id: 'ts_450', layer: 'tactical', series: 'enhance', index: 450,
        displayName: '塞道遏冲', sourceQuote: '《宋史·王坚传》相关记载：钓鱼山设多重塞垒，箭石交替遏阻蒙军冲锋，久攻不克。《宋史·王坚传》',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【王坚】T1精锐·赵宋区·势reverse·均局专属（三势精修）',
    },
    {
        id: 'ts_451', layer: 'tactical', series: 'casualty', index: 451,
        displayName: '死士逆摧', sourceQuote: '《宋史·王坚传》相关记载：外城将陷，募死士逆冲蒙军先锋推出寨外，蒙哥督战受伤。《宋史·王坚传》',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 2.0, engineStatus: 'ready',
        note: '【王坚】T1精锐·赵宋区·势reverse·劣局专属（三势精修）',
    },
    {
        id: 'ts_452', layer: 'tactical', series: 'enhance', index: 452,
        displayName: '叠砦疲敌', sourceQuote: '《宋史·孟珙传》相关记载：黄州城外设层砦互为掎角，金军屡犯屡耗，力竭自退。《宋史·孟珙传》',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【孟珙】T1精锐·赵宋区·势reverse·均局专属（三势精修）',
    },
    {
        id: 'ts_453', layer: 'tactical', series: 'casualty', index: 453,
        displayName: '间道夺粮', sourceQuote: '《宋史·孟珙传》相关记载：蔡州遣轻兵出间道夺金军城外存粮，金军食尽城破。《宋史·孟珙传》',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 2.0, engineStatus: 'ready',
        note: '【孟珙】T1精锐·赵宋区·势reverse·劣局专属（三势精修）',
    },
    {
        id: 'ts_454', layer: 'tactical', series: 'enhance', index: 454,
        displayName: '伏隘截锋', sourceQuote: '《宋史·杨业传》相关记载：雁门出数百骑诱敌入山隘，伏兵断其首尾，大破辽军。《宋史·杨业传》',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【杨业】T1精锐·赵宋区·势reverse·均局专属（三势精修）',
    },
    {
        id: 'ts_455', layer: 'tactical', series: 'casualty', index: 455,
        displayName: '断后摧追', sourceQuote: '《宋史·杨业传》相关记载：雍熙败退，掩护百姓内迁，残兵断后力战，重伤被擒绝食死。《宋史·杨业传》',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 2.0, engineStatus: 'ready',
        note: '【杨业】T1精锐·赵宋区·势reverse·劣局专属（三势精修）',
    },
    {
        id: 'ts_456', layer: 'tactical', series: 'enhance', index: 456,
        displayName: '散骑扰牧', sourceQuote: '《宋史·王韶传》相关记载：熙河派轻骑深入蕃区袭扰畜群，吐蕃各部疲于救援，联盟自裂。《宋史·王韶传》',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【王韶】T1精锐·赵宋区·势create·均局专属（三势精修）',
    },
    {
        id: 'ts_457', layer: 'tactical', series: 'casualty', index: 457,
        displayName: '断道遏援', sourceQuote: '《宋史·王韶传》相关记载：河州遭蕃部前后夹击，精兵扼险隘断其援道，急攻破城。《宋史·王韶传》',
        baseEffect: 'lose_enemy_casualty_boost', condition: 'always', phase: 'post_battle',
        magnitude: 2.0, engineStatus: 'ready',
        note: '【王韶】T1精锐·赵宋区·势create·劣局专属（三势精修）',
    },
    {
        id: 'ts_458', layer: 'tactical', series: 'enhance', index: 458,
        displayName: '叠伏遏骑', sourceQuote: '《宋史·曲端传》相关记载：延安阵前设数道绊马索陷坑，金骑冲锋人马交绊，阵型自乱。《宋史·曲端传》',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【曲端】T1精锐·赵宋区·势create·均局专属（三势精修）',
    },
    {
        id: 'ts_459', layer: 'tactical', series: 'casualty', index: 459,
        displayName: '严垒止溃', sourceQuote: '《宋史·曲端传》相关记载：陕西诸路溃败，收拢散卒退守泾州，严令不得出战，军势复振。《宋史·曲端传》',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.25, engineStatus: 'ready',
        note: '【曲端】T1精锐·赵宋区·势create·劣局专属（三势精修）',
    },
    {
        id: 'ts_460', layer: 'tactical', series: 'enhance', index: 460,
        displayName: '鼓噪乱阵', sourceQuote: '《宋史·狄青传》相关记载：戴铜面具冲入敌阵，令士兵四面擂鼓鸣金，夏军不辨虚实自乱。《宋史·狄青传》',
        baseEffect: 'enemy_sub_troops_opening', condition: 'battle_field', phase: 'pre_opening_troops',
        magnitude: 0.15, engineStatus: 'ready',
        note: '【狄青】T1精锐·赵宋区·势create·均局专属（三势精修）',
    },
    {
        id: 'ts_461', layer: 'tactical', series: 'casualty', index: 461,
        displayName: '溃旅扼门', sourceQuote: '《宋史·狄青传》相关记载：溃兵争涌入营门，持刀立门勒令返身列阵拒敌，夏军见复整遂退。《宋史·狄青传》',
        baseEffect: 'win_casualty_reduction', condition: 'always', phase: 'mid_battle_passive',
        magnitude: 0.25, engineStatus: 'ready',
        note: '【狄青】T1精锐·赵宋区·势create·劣局专属（三势精修）',
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
 * 【批量迁移地基】旧 10 技到 V1 战术技的完整映射表（2026-07-03 定稿）
 * 不动现有 legacyTacId 避免影响运行时，此表专用于将 GeneralSkills.ts 中的旧 tac_xxx 批量替换为 ts_xxx。
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

export function listTacticalSkillsBySeries(series: TacticalSeries): TacticalSkillEntry[] {
    return TACTICAL_SKILL_ENTRIES_V1.filter((e) => e.series === series);
}

/**
 * ── 分配层策略（2026-07-03 立）──────────────────────────────
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
    ts_389: 'common',
    ts_390: 'common',
    ts_391: 'common',
    ts_392: 'common',
    ts_393: 'common',
    ts_394: 'common',
    ts_395: 'common',
    ts_396: 'common',
    ts_397: 'common',
    ts_398: 'common',
    ts_399: 'common',
    ts_400: 'common',
    ts_401: 'common',
    ts_402: 'common',
    ts_403: 'common',
    ts_404: 'common',
    ts_405: 'common',
    ts_406: 'common',
    ts_407: 'common',
    ts_408: 'common',
    ts_409: 'common',
    ts_410: 'common',
    ts_411: 'common',
    ts_412: 'common',
    ts_413: 'common',
    ts_414: 'common',
    ts_415: 'common',
    ts_416: 'common',
    ts_417: 'common',
    ts_418: 'common',
    ts_419: 'common',
    // 强化系
    ts_001: 'common', ts_002: 'common', ts_003: 'common', ts_004: 'common',
    ts_005: 'common', ts_006: 'ai_defensive', ts_007: 'common', ts_008: 'underdog',
    ts_009: 'limited', ts_010: 'common', ts_011: 'common',
    // 命运系
    ts_012: 'underdog', ts_013: 'gamble', ts_014: 'star_survival', ts_015: 'star_survival',
    ts_016: 'common', ts_017: 'common', ts_018: 'underdog', ts_019: 'ai_defensive',
    ts_020: 'underdog',
    // 兵力系
    ts_021: 'common', ts_022: 'limited', ts_023: 'limited', ts_024: 'common',
    ts_025: 'common', ts_026: 'common', ts_027: 'common', ts_028: 'common',
    ts_029: 'common', ts_030: 'limited',
    // 战损系（未接引擎，先定分配意图）
    ts_031: 'star_survival', ts_032: 'star_survival', ts_033: 'ai_defensive',
    ts_034: 'ai_defensive', ts_035: 'star_survival', ts_036: 'star_survival',
    ts_037: 'star_survival', ts_038: 'ai_defensive', ts_039: 'common',
    ts_040: 'star_survival', ts_041: 'common',
    // 对抗系（未接引擎）
    ts_042: 'common', ts_043: 'common', ts_044: 'common', ts_045: 'ai_defensive',
    ts_046: 'common', ts_047: 'common', ts_048: 'ai_defensive',
    // 士气系
    ts_049: 'common',
    // 贴合系（不进随机池，只走写死分配，标 limited 以防万一）
    ts_051: 'limited', ts_052: 'limited', ts_053: 'limited',
    ts_054: 'limited', ts_056: 'limited', ts_057: 'limited',
    ts_058: 'limited', ts_059: 'limited', ts_060: 'limited', ts_061: 'limited',
    ts_062: 'limited', ts_063: 'limited', ts_064: 'limited', ts_065: 'limited',
    ts_066: 'limited', ts_067: 'limited', ts_068: 'limited', ts_069: 'limited',
    ts_070: 'limited', ts_071: 'limited', ts_072: 'limited', ts_073: 'limited',
    ts_074: 'limited', ts_075: 'limited', ts_076: 'limited',
    ts_092: 'limited', ts_093: 'limited', ts_094: 'limited',
    ts_095: 'limited', ts_096: 'limited', ts_097: 'limited', ts_098: 'limited',
    ts_099: 'limited', ts_100: 'limited', ts_102: 'limited', ts_103: 'limited',
    ts_104: 'limited',
    ts_107: 'limited', ts_108: 'limited', ts_109: 'limited', ts_110: 'limited',
    ts_111: 'limited', ts_112: 'limited', ts_113: 'limited', ts_114: 'limited',
    ts_115: 'limited', ts_116: 'limited',
    // 第二批 T1 补登记（ts_077-091：此前定义了贴合技却漏登 limited）
    ts_077: 'limited', ts_078: 'limited', ts_079: 'limited', ts_080: 'limited',
    ts_081: 'limited', ts_082: 'limited', ts_083: 'limited', ts_084: 'limited',
    ts_085: 'limited', ts_086: 'limited', ts_087: 'limited', ts_088: 'limited',
    ts_089: 'limited', ts_090: 'limited', ts_091: 'limited',
    // 第五批 T1 补贴合（ts_117-126）
    ts_117: 'limited', ts_118: 'limited', ts_119: 'limited', ts_120: 'limited',
    ts_121: 'limited', ts_122: 'limited', ts_123: 'limited', ts_124: 'limited',
    ts_125: 'limited', ts_126: 'limited',
    // 第六批 T1 补贴合（ts_127-155）
    ts_127: 'limited', ts_128: 'limited', ts_129: 'limited', ts_130: 'limited',
    ts_131: 'limited', ts_132: 'limited', ts_133: 'limited', ts_134: 'limited',
    ts_135: 'limited', ts_136: 'limited', ts_137: 'limited', ts_138: 'limited',
    ts_139: 'limited', ts_140: 'limited', ts_141: 'limited', ts_142: 'limited',
    ts_143: 'limited', ts_144: 'limited', ts_145: 'limited', ts_146: 'limited',
    ts_147: 'limited', ts_148: 'limited', ts_149: 'limited', ts_150: 'limited',
    ts_151: 'limited', ts_152: 'limited', ts_153: 'limited', ts_154: 'limited',
    ts_155: 'limited',
    // 第七批（ts_156-167）
    ts_156: 'limited', ts_157: 'limited', ts_158: 'limited', ts_159: 'limited',
    ts_160: 'limited', ts_161: 'limited', ts_162: 'limited', ts_163: 'limited',
    ts_164: 'limited', ts_165: 'limited', ts_166: 'limited', ts_167: 'limited',
    // 第八批（ts_168-181）
    ts_168: 'limited', ts_169: 'limited', ts_170: 'limited', ts_171: 'limited',
    ts_172: 'limited', ts_173: 'limited', ts_174: 'limited', ts_175: 'limited',
    ts_176: 'limited', ts_177: 'limited', ts_178: 'limited', ts_179: 'limited',
    ts_180: 'limited', ts_181: 'limited',
    ts_182: 'common', ts_183: 'common', ts_184: 'common', ts_185: 'common', ts_186: 'common', ts_187: 'common', ts_188: 'common', ts_189: 'underdog',
    ts_190: 'common', ts_191: 'common', ts_192: 'common', ts_193: 'common', ts_194: 'common', ts_195: 'common', ts_196: 'common', ts_197: 'common', ts_198: 'common', ts_199: 'common', ts_200: 'common', ts_201: 'common', ts_202: 'common', ts_203: 'common', ts_204: 'common', ts_205: 'common', ts_206: 'common', ts_207: 'common',
    ts_208: 'common', ts_209: 'common', ts_210: 'common', ts_211: 'underdog', ts_212: 'common', ts_213: 'common', ts_214: 'common', ts_215: 'common', ts_216: 'common', ts_217: 'common', ts_218: 'common', ts_219: 'common', ts_220: 'common', ts_221: 'common', ts_222: 'common', ts_223: 'common', ts_224: 'common', ts_225: 'common', ts_226: 'common',
    ts_227: 'common', ts_228: 'common', ts_229: 'common', ts_230: 'underdog', ts_231: 'common', ts_232: 'common', ts_233: 'common', ts_234: 'common', ts_235: 'common', ts_236: 'common', ts_237: 'common', ts_238: 'common', ts_239: 'common', ts_240: 'common', ts_241: 'common',
    ts_242: 'common', ts_243: 'common', ts_244: 'common', ts_245: 'underdog', ts_246: 'common', ts_247: 'common', ts_248: 'common', ts_249: 'common', ts_250: 'common', ts_251: 'common', ts_252: 'common', ts_253: 'common', ts_254: 'common', ts_255: 'common', ts_256: 'common',
    ts_257: 'common', ts_258: 'common', ts_259: 'common', ts_260: 'underdog', ts_261: 'common', ts_262: 'common', ts_263: 'common', ts_264: 'common', ts_265: 'underdog', ts_266: 'underdog', ts_267: 'common', ts_268: 'common', ts_269: 'common', ts_270: 'common', ts_271: 'common', ts_272: 'common', ts_273: 'common', ts_274: 'common', ts_275: 'common',
    ts_276: 'common', ts_277: 'common', ts_278: 'common', ts_279: 'common', ts_280: 'common', ts_281: 'common', ts_282: 'common', ts_283: 'common', ts_284: 'common', ts_285: 'common', ts_286: 'common', ts_287: 'common', ts_288: 'common', ts_289: 'common', ts_290: 'common', ts_291: 'common', ts_292: 'common',
    ts_293: 'common', ts_294: 'common', ts_295: 'common', ts_296: 'common', ts_297: 'common', ts_298: 'common', ts_299: 'common', ts_300: 'common', ts_301: 'common', ts_302: 'common', ts_303: 'common', ts_304: 'common', ts_305: 'common', ts_306: 'common', ts_307: 'common', ts_308: 'common', ts_309: 'common',
    ts_310: 'common', ts_311: 'common', ts_312: 'common', ts_313: 'common', ts_314: 'common', ts_315: 'common', ts_316: 'common', ts_317: 'common', ts_318: 'common', ts_319: 'common', ts_320: 'common', ts_321: 'common', ts_322: 'common', ts_323: 'common', ts_324: 'common', ts_325: 'common', ts_326: 'common',
    ts_327: 'common', ts_328: 'common', ts_329: 'common', ts_330: 'common', ts_331: 'common', ts_332: 'common', ts_333: 'common', ts_334: 'common', ts_335: 'common', ts_336: 'common', ts_337: 'common', ts_338: 'common', ts_339: 'common', ts_340: 'common', ts_341: 'common', ts_342: 'common', ts_343: 'common',
    ts_344: 'common', ts_345: 'common', ts_346: 'common', ts_347: 'common', ts_348: 'common', ts_349: 'common', ts_350: 'common', ts_351: 'common', ts_352: 'common', ts_353: 'common', ts_354: 'common', ts_355: 'common', ts_356: 'common', ts_357: 'common', ts_358: 'common', ts_359: 'common', ts_360: 'common',
    ts_361: 'common', ts_362: 'common', ts_363: 'common', ts_364: 'common', ts_365: 'common', ts_366: 'common', ts_367: 'common', ts_368: 'common', ts_369: 'common', ts_370: 'common', ts_371: 'common', ts_372: 'common', ts_373: 'common', ts_374: 'common', ts_375: 'common', ts_376: 'common', ts_377: 'common', ts_378: 'common',
    ts_379: 'common', ts_380: 'common', ts_381: 'common', ts_382: 'common',
    ts_383: 'limited', ts_384: 'limited', ts_385: 'ai_defensive', ts_386: 'underdog',
    ts_420: 'limited',
    ts_421: 'limited',
    ts_422: 'limited',
    ts_423: 'limited',
    ts_424: 'limited',
    ts_425: 'limited',
    ts_426: 'limited',
    ts_427: 'limited',
    ts_428: 'limited',
    ts_429: 'limited',
    ts_430: 'limited',
    ts_431: 'limited',
    ts_432: 'limited',
    ts_433: 'limited',
    ts_434: 'limited',
    ts_435: 'limited',
    ts_436: 'limited',
    ts_437: 'limited',
    ts_438: 'limited',
    ts_439: 'limited',
    ts_440: 'limited',
    ts_441: 'limited',
    ts_442: 'limited',
    ts_443: 'limited',
    ts_444: 'limited',
    ts_445: 'limited',
    ts_446: 'limited',
    ts_447: 'limited',
    ts_448: 'limited',
    ts_449: 'limited',
    ts_450: 'limited',
    ts_451: 'limited',
    ts_452: 'limited',
    ts_453: 'limited',
    ts_454: 'limited',
    ts_455: 'limited',
    ts_456: 'limited',
    ts_457: 'limited',
    ts_458: 'limited',
    ts_459: 'limited',
    ts_460: 'limited',
    ts_461: 'limited',
    ts_462: 'limited',
    ts_463: 'limited',
    ts_464: 'limited',
    ts_465: 'limited',
    ts_466: 'limited',
    ts_467: 'limited',
    ts_468: 'limited',
    ts_469: 'limited',
    ts_470: 'limited',
    ts_471: 'limited',
    ts_472: 'limited',
    ts_473: 'limited',
    ts_474: 'limited',
    ts_475: 'limited',
    ts_476: 'limited',
    ts_477: 'limited',
    ts_478: 'limited',
    ts_479: 'limited',
    ts_480: 'limited',
    ts_481: 'limited',
    ts_482: 'limited',
    ts_483: 'limited',
    ts_484: 'limited',
    ts_485: 'limited',
    ts_486: 'limited',
    ts_487: 'limited',
    ts_488: 'limited',
    ts_489: 'limited',
    ts_490: 'limited',
    ts_491: 'limited',
    ts_492: 'limited',
    ts_493: 'limited',
    ts_494: 'limited',
    ts_495: 'limited',
    ts_496: 'limited',
    ts_497: 'limited',
    ts_498: 'limited',
    ts_499: 'limited',
    ts_500: 'limited',
    ts_501: 'limited',
    ts_502: 'limited',
    ts_503: 'limited',
    ts_504: 'limited',
    ts_505: 'limited',
    ts_506: 'limited',
    ts_507: 'limited',
    ts_508: 'limited',
    ts_509: 'limited',
    ts_510: 'limited',
    ts_511: 'limited',
    ts_512: 'limited',
    ts_513: 'limited',
    ts_514: 'limited',
    ts_515: 'limited',
    ts_516: 'limited',
    ts_517: 'limited',
    ts_518: 'limited',
    ts_519: 'limited',
    ts_520: 'limited',
    ts_521: 'limited',
    ts_522: 'limited',
    ts_523: 'limited',
    ts_524: 'limited',
    ts_525: 'limited',
    ts_526: 'limited',
    ts_527: 'limited',
    ts_528: 'limited',
    ts_529: 'limited',
    ts_530: 'limited',
    ts_531: 'limited',
    ts_532: 'limited',
    ts_533: 'limited',
    ts_387: 'ai_defensive',
    ts_388: 'underdog',

};

export function getTacticalAssignTier(skillId: string): TacticalAssignTier | null {
    return TACTICAL_ASSIGN_TIER[skillId] ?? null;
}
