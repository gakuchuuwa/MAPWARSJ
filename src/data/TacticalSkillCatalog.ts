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
    | 'counter'   // 对抗系
    | 'morale';   // 士气系

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
        magnitude: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_003', layer: 'tactical', series: 'enhance', index: 3,
        displayName: '长驱直入', sourceQuote: '《战国策·燕策》：“长驱至齐，齐王遁逃。”',
        baseEffect: 'ally_power_mult', condition: 'terrain_plain', phase: 'opening_roll',
        magnitude: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_004', layer: 'tactical', series: 'enhance', index: 4,
        displayName: '中流击楫', sourceQuote: '《晋书·祖逖传》：“中流击楫而誓。”',
        baseEffect: 'ally_power_mult', condition: 'terrain_sea', phase: 'opening_roll',
        magnitude: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_005', layer: 'tactical', series: 'enhance', index: 5,
        displayName: '摧城拔寨', sourceQuote: '《三国演义》：“先主怒……摧城拔寨。”',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_attacker', phase: 'opening_roll',
        magnitude: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_006', layer: 'tactical', series: 'enhance', index: 6,
        displayName: '金城汤池', sourceQuote: '《汉书·蒯通传》：“皆为金城汤池，不可攻也。”',
        baseEffect: 'ally_power_mult', condition: 'battle_siege_defender', phase: 'opening_roll',
        magnitude: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_007', layer: 'tactical', series: 'enhance', index: 7,
        displayName: '原野交锋', sourceQuote: '《史记·项羽本纪》：“与汉王原野争锋。”',
        baseEffect: 'ally_power_mult', condition: 'battle_field', phase: 'opening_roll',
        magnitude: 1.25, engineStatus: 'ready',
        // 【2026-07-03 主人定】描述写「野战加成」，但游戏中野战少、攻城多，故 battle_field
        // 引擎语义 = 进攻方加成：攻城/野战只要我方进攻即 ×1.25，仅守城方不吃（见 TacticalSkillResolver）。
        note: '原野争锋 ×1.25：描述为野战加成，实战按【进攻方】结算（攻城/野战通吃，守城不吃），避免野战稀少辜负名将',
    },
    {
        id: 'ts_008', layer: 'tactical', series: 'enhance', index: 8,
        displayName: '以寡击众', sourceQuote: '《三国志·吴主传》：“能以寡击众者，唯有周瑜。”',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
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
        baseEffect: 'luck_variance_self', condition: 'always', phase: 'opening_roll',
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
        magnitude: 0.1, engineStatus: 'ready', legacyTacId: 'tac_02',
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
        magnitude: 0.15, engineStatus: 'ready',
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
        magnitude: 0.2, engineStatus: 'ready',
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
        displayName: '赤壁东风', sourceQuote: '《三国志·吴书·周瑜传》：“时风盛猛，悉延烧岸上营落。”',
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
        magnitude: 0.3, engineStatus: 'ready',
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
        magnitude: 0.5, engineStatus: 'ready',
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
        id: 'ts_046', layer: 'tactical', series: 'counter', index: 46,
        displayName: '暗度陈仓', sourceQuote: '《史记·淮阴侯列传》：“明修栈道，暗度陈仓。”',
        baseEffect: 'cancel_enemy_terrain_buff', condition: 'always', phase: 'opening_roll',
        magnitude: 1, engineStatus: 'ready',
        note: '地形对抗：引擎侧待接线（仅 combat-model 工具支持）',
    },
    {
        id: 'ts_047', layer: 'tactical', series: 'counter', index: 47,
        displayName: '声东击西', sourceQuote: '《通典·兵典》：“声言击东，其实击西。”',
        baseEffect: 'halve_enemy_terrain_buff', condition: 'always', phase: 'opening_roll',
        magnitude: 0.5, engineStatus: 'ready',
        note: '地形对抗：引擎侧待接线（仅 combat-model 工具支持）',
    },
    {
        id: 'ts_048', layer: 'tactical', series: 'counter', index: 48,
        displayName: '空城退敌', sourceQuote: '《三国志·蜀书·赵云传》注引《云别传》：“更大开门，偃旗息鼓。”',
        baseEffect: 'nullify_enemy_opening_cut', condition: 'self_troops_below_enemy_pct', phase: 'pre_opening_troops',
        magnitude: 0.3, engineStatus: 'ready',
        note: '己兵<敌30% 时，敌先声类技失效',
    },
];

// ── 六、士气系 ─────────────────────────────────────────────
const MORALE: TacticalSkillEntry[] = [
    {
        id: 'ts_049', layer: 'tactical', series: 'morale', index: 49,
        displayName: '一鼓作气', sourceQuote: '《左传·庄公十年》：“夫战，勇气也。一鼓作气，再而衰，三而竭。”',
        baseEffect: 'first_sortie_power_mult', condition: 'first_sortie', phase: 'opening_roll',
        magnitude: 1.25, engineStatus: 'ready',
        note: '出征首战×1.25（桥接 ally_mult_1_2 + first_sortie 门控）；契合名将远征首战爆发看点',
    },
];

// ── 七、T0专属战术技 ───────────────────────────────────────────
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
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.45, engineStatus: 'ready',
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

// ── 八、T1专属战术技（15人） ───────────────────────────────────────────
const UNIQUE_T1: TacticalSkillEntry[] = [
    {
        id: 'ts_062', layer: 'tactical', series: 'enhance', index: 62,
        displayName: '奉天靖难', sourceQuote: '《明史·成祖本纪》：“奉天靖难，推毂群帅。”',
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
        displayName: '兼并诸羌', sourceQuote: '《新唐书·吐蕃传》：“遂并诸羌，雄霸西域。”',
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
        displayName: '回军靖难', sourceQuote: '《朝鲜王朝实录》：“大王回军靖难，定鼎立国。”',
        baseEffect: 'ally_power_mult', condition: 'ratio_underdog', phase: 'opening_roll',
        magnitude: 1.4, engineStatus: 'ready',
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
        magnitude: 0.7, engineStatus: 'ready',
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
        magnitude: 1.3, engineStatus: 'ready',
    },
    {
        id: 'ts_084', layer: 'tactical', series: 'fate', index: 84,
        displayName: '铁骑蹙敌', sourceQuote: '《明史·李成梁传》：“多选健卒，铁骑蹙敌。”',
        baseEffect: 'luck_variance_self', condition: 'always', phase: 'opening_roll',
        magnitude: 1.3, engineStatus: 'ready',
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
        magnitude: 0.6, engineStatus: 'ready',
    },
    {
        id: 'ts_087', layer: 'tactical', series: 'casualty', index: 87,
        displayName: '鼓行而西', sourceQuote: '《辽史·太祖本纪》：“鼓行而西，迭克诸部。”',
        baseEffect: 'lose_zero_enemy_recovery', condition: 'always', phase: 'post_battle',
        magnitude: 1.0, engineStatus: 'ready',
    },
    {
        id: 'ts_088', layer: 'tactical', series: 'enhance', index: 88,
        displayName: '勒兵大破', sourceQuote: '《周书·突厥传》：“土门勒兵击之，大破茹茹。”',
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
        magnitude: 0.65, engineStatus: 'ready',
    },
];

export const TACTICAL_SKILL_ENTRIES_V1: TacticalSkillEntry[] = [
    ...ENHANCE,
    ...FATE,
    ...TROOP,
    ...CASUALTY,
    ...COUNTER,
    ...MORALE,
    ...UNIQUE_T0,
    ...UNIQUE_T1,
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
    | 'underdog'      // 绝境/AI 专属：以少打多族，明星军团近乎不触发
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
    // 专属系（不进随机池，只走写死分配，标 limited 以防万一）
    ts_051: 'limited', ts_052: 'limited', ts_053: 'limited',
    ts_054: 'limited', ts_056: 'limited', ts_057: 'limited',
    ts_058: 'limited', ts_059: 'limited', ts_060: 'limited', ts_061: 'limited',
    ts_062: 'limited', ts_063: 'limited', ts_064: 'limited', ts_065: 'limited',
    ts_066: 'limited', ts_067: 'limited', ts_068: 'limited', ts_069: 'limited',
    ts_070: 'limited', ts_071: 'limited', ts_072: 'limited', ts_073: 'limited',
    ts_074: 'limited', ts_075: 'limited', ts_076: 'limited',
};

export function getTacticalAssignTier(skillId: string): TacticalAssignTier | null {
    return TACTICAL_ASSIGN_TIER[skillId] ?? null;
}
