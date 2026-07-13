/**
 * 武将技 · 类型与效果枚举（从 GeneralSkills.ts 拆出，2026-07-13）
 * 只放 type/interface/枚举标签，不放数据；数据见 catalogs.ts / profiles.ts。
 */
import type { CityType } from '../../types/core';

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

    | 'equal_power_mult'          // 兵力接近时战力 ×1.3（因敌制胜，原所向披靡改）

    | 'advantage_skill_effect_mult'   // 优势时战术技效果 ×1.2（威震华夏）

    | 'disadvantage_power_mult'       // 劣势时自身战力 ×1.4（以寡击众）

    // ── 军团速 ──

    | 'march_speed_mult'          // 全局提速

    | 'mountain_march_immunity'   // 山地按平原速度

    | 'ignore_small_city_zoc'     // 无视小城 ZOC

    | 'skip_post_battle_rest'     // 胜后免休整（乘胜追击，连续行军节奏）

    // ── 加兵 ──

    | 'field_resupply'                // 远离本土缓回血（以战养战）

    | 'post_battle_troop_pct'         // 胜后补兵（因粮于敌）

    | 'recruit_troops_mult'           // 征兵时出征兵力 ×1.1（调兵遣将）

    // ── 据点兵 / 防务 ──

    | 'city_growth_mult'              // 出身城增长 ×2（足食足兵）

    | 'recruit_cooldown_mult'         // 征兵冷却 ×0.5（招兵买马）

    | 'garrison_defense_mult'         // 守城城防战力 ×1.3（固若金汤）

    | 'siege_approach_attrition'      // 军团逼近据点时每秒减兵 magnitude（坚壁清野）

    | 'garrison_reserve_troops'       // 征兵时城市最低留兵 magnitude（屯兵经略）

    // ── 视野（隐蔽）──

    | 'hide_during_peacetime'        // 非战斗时军团不可见（神出鬼没）

    | 'hide_troop_count'             // 非战斗时兵力数字隐藏（偃旗息鼓）

    | 'bluff_troop_count'            // 非战斗时兵力显示 ×2（虚张声势）

    // ── 威慑 ──

    | 'intimidate_instant_win'       // 兵力优势时概率不战而胜（不战而屈）

    | 'pre_battle_intimidate'        // 战前削敌兵（先声夺人）

    | 'skip_disadvantaged_siege'     // 劣势时概率跳过此城（越城而走）

    // ── 纵横 ──

    | 'sabotage_garrison'             // 攻城前消耗守城将/精出场配额（釜底抽薪）

    | 'lure_tiger_leave_mountain'     // 攻城前守城将/精组建军团出征（调虎离山）

    | 'third_party_siege'             // 攻城前调用附近据点出兵助攻（坐收渔翁）

    // ── 奇策 ──

    | 'post_battle_recruit_enemy_pct' // 胜后收编敌方开战总兵

    | 'terrain_tactical_double';       // 地形匹配时战术技翻倍






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



/**

 * 战略技六大类（2026-07-12 定名）

 * 管大地图：行军 / 续航 / 隐蔽 / 压敌 / 合纵 / 守土；不进战斗乘区（战斗归战术技）。

 */

export type StrategicCategory =

    | 'speed'       // 加速类

    | 'supply'      // 加兵类

    | 'vision'      // 视野类

    | 'deterrence'  // 威慑类

    | 'diplomacy'   // 纵横类

    | 'defense'     // 防务类

    | 'tactical';   // 战术类（战斗面板乘区）



export const STRATEGIC_CATEGORY_LABEL: Readonly<Record<StrategicCategory, string>> = {

    speed: '加速类',

    supply: '加兵类',

    vision: '视野类',

    deterrence: '威慑类',

    diplomacy: '纵横类',

    defense: '防务类',

    tactical: '战术类',

};



export interface StrategicSkillDef {

    id: string;

    grid: string;

    displayName: string;

    effect: StrategicEffect;

    magnitude: number;

    /** 引擎接线状态：ready=真实生效；new=数据就位、Step2 接引擎前不生效（诚实标注，audit 依赖） */

    engineStatus: 'ready' | 'new';

    /** 战略六大类（见 STRATEGIC_CATEGORY_LABEL） */

    category?: StrategicCategory;

    /** 攻城胜后按城型补兵（str_07 因粮于敌）：关隘1%/小城2%/中城3%/大城4% */

    postBattlePctByCityType?: Partial<Record<CityType, number>>;

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

    // ── 攻防六槽（v4 2026-07-13）──

    /** 攻城·优势局技；未配回退 advantageSkillId */

    atkAdvantageSkillId?: string;

    /** 攻城·均势局技；未配回退 balanceSkillId */

    atkBalanceSkillId?: string;

    /** 攻城·劣势局技；未配回退 disadvantageSkillId */

    atkDisadvantageSkillId?: string;

    /** 守城·优势局技；未配回退 advantageSkillId */

    defAdvantageSkillId?: string;

    /** 守城·均势局技；未配回退 balanceSkillId */

    defBalanceSkillId?: string;

    /** 守城·劣势局技；未配回退 disadvantageSkillId */

    defDisadvantageSkillId?: string;

    /** 三势天赋：造势create / 借势leverage / 逆势reverse（③整合·势×局适性系数表用） */

    aptitude?: 'create' | 'leverage' | 'reverse';

    /** 攻防风格 */

    attackStyle?: 'attack' | 'defense' | 'balanced';

    /** 已核史但无法合法归入攻守三类：非统军人物、身份待考或史料不足 */

    attackStyleStatus?: 'not_applicable_or_unresolved';

}
