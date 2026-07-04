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
    | 'ally_invincible';

export type StrategicEffect =
    // ── v1 五系（2026-07-03 重设计：战略技 = 大地图效果）──
    | 'march_speed_mult'          // 行军：全局提速（✅现役）
    | 'mountain_march_immunity'   // 行军：山地行军免减速（Step2 接 Army.updateTerrainSpeed）
    | 'ignore_small_city_zoc'     // 行军：无视小城 ZOC（Step2 接 findHostileCityInZOC）
    | 'skip_post_battle_rest'     // 补给：胜后免休整立即开拔（Step2 接 startPostBattleRest）
    | 'field_resupply'            // 补给：远离本土缓慢回血（Step2 接 FollowResupplySystem）
    | 'post_battle_troop_pct'     // 补给：胜后就食补员（✅现役）
    | 'city_growth_mult'          // 爆兵：出身城增长×2（Step2 接 CityManager.updateTroops；无须坐城）
    | 'recruit_cooldown_mult'     // 爆兵：出征时出身城募兵冷却减半（Step2 接 RecruitmentSystem）
    | 'attacker_power_mult'       // 战斗：攻方乘区（✅现役；唯一保留的战斗层战略技，限量 ≤30）
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
     * 隐藏胜后续航：地图系战略技（行军/爆兵/补给类）的名将，胜后按自身当前兵 × 此比例静默补血。
     * 用于让这些"大地图收益"技在连续战斗里也能体现名将价值，避免续航垫底。
     * ⚠️ 静默：不写战斗日志、不显示 UI 标签（与因粮于敌 post_battle_troop_pct 的可见回血区分）。
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
 * 战略技 v1（2026-07-03 重设计）：五系 9 技，战略技 = 大地图效果
 *   行军：str_01 兵贵神速 / str_10 如履平地 / str_11 直捣黄龙
 *   补给：str_12 乘胜追击 / str_13 以战养战 / str_07 因粮于敌
 *   爆兵：str_14 足食足兵 / str_15 招兵买马
 *   战斗：str_03 所向披靡（唯一保留的战斗乘区，限量 ≤30）
 *   二期：传檄而定（攻兵力悬殊敌小城概率不战而下，必须走城池易主管线）——引擎就绪前不入表
 * 退役（2026-07-03）：str_04 长驱直入 / str_05 居高临下 / str_06 乘风破浪 / str_08 固若金汤
 *   ——地形/守方战斗乘区与战术层 ts_002–004 / ts_006 重复（双吃），删除。
 *   ⚠️ Step2 接引擎时必须同步：暗度陈仓/声东击西的对抗靶从战略地形乘区扩到战术地形技
 *   （见 TacticalSkillResolver TODO(v1-migration)），否则那 4 个持有者变死技。
 * 命名注记：履险如夷不叫「如履平地」（战术 ts_002 已用）；直捣黄龙不叫「长驱直入」（战术 ts_003 已用）。
 */
export const STRATEGIC_SKILL_CATALOG: Record<string, StrategicSkillDef> = {
    // ── 行军系 ──（hiddenPostBattlePct: 地图技的隐藏 1% 胜后续航，静默不显示，仅体现名将连战价值）
    str_01: { id: 'str_01', grid: 'S①', displayName: '兵贵神速', effect: 'march_speed_mult', magnitude: 1.5, engineStatus: 'ready', hiddenPostBattlePct: 0.01, note: '隐藏胜后续航 1%（静默，不显示）' },
    str_10: { id: 'str_10', grid: 'S⑩', displayName: '如履平地', effect: 'mountain_march_immunity', magnitude: 1, engineStatus: 'ready', hiddenPostBattlePct: 0.01, note: '山地按平原速度走；magnitude 占位；隐藏胜后续航 1%（静默，不显示）' },
    str_11: { id: 'str_11', grid: 'S⑪', displayName: '直捣黄龙', effect: 'ignore_small_city_zoc', magnitude: 1, engineStatus: 'ready', hiddenPostBattlePct: 0.01, note: '仅无视 small_city 级 ZOC，大城仍拦截；隐藏胜后续航 1%（静默，不显示）' },
    // ── 补给系 ──
    str_12: { id: 'str_12', grid: 'S⑫', displayName: '乘胜追击', effect: 'skip_post_battle_rest', magnitude: 0, engineStatus: 'ready', hiddenPostBattlePct: 0.01, note: '胜后休整时长置 0；隐藏胜后续航 1%（静默，不显示）' },
    str_13: { id: 'str_13', grid: 'S⑬', displayName: '以战养战', effect: 'field_resupply', magnitude: 1, engineStatus: 'ready', note: '远离本土缓回血；FollowResupplySystem.tickStrategicFieldResupply' },
    str_07: { id: 'str_07', grid: 'S⑦', displayName: '因粮于敌', effect: 'post_battle_troop_pct', magnitude: 0.02, engineStatus: 'ready' },
    // ── 爆兵系 ──
    str_14: { id: 'str_14', grid: 'S⑭', displayName: '足食足兵', effect: 'city_growth_mult', magnitude: 2, engineStatus: 'ready', hiddenPostBattlePct: 0.01, note: '出征期间出身城增长率×2（getCityAnchoredStrategicMagnitude，无须坐城）；隐藏胜后续航 1%（静默，不显示）' },
    str_15: { id: 'str_15', grid: 'S⑮', displayName: '招兵买马', effect: 'recruit_cooldown_mult', magnitude: 0.5, engineStatus: 'ready', hiddenPostBattlePct: 0.01, note: '出征离城后可再募（RecruitmentSystem.cityHasActiveLegion）；隐藏胜后续航 1%（静默，不显示）' },
    // ── 战斗系（唯一保留，限量 ≤30，与战术攻城技跨层叠加=名将牌面）──
    str_03: { id: 'str_03', grid: 'S③', displayName: '所向披靡', effect: 'attacker_power_mult', magnitude: 1.5, engineStatus: 'ready' },
};

/**
 * 远征军系统技：胜后「因粮于敌」补兵（远征断粮、就食于敌）。
 * 仅远征军（army.expeditionTargetCityId）享；**非战略格 / 非战术格**，独立系统技，不占名将技格。
 */
export interface ExpeditionSystemSkillDef {
    displayName: string;
    effect: 'post_battle_troop_pct';
    magnitude: number;
}
export const EXPEDITION_FORAGE_SKILL: ExpeditionSystemSkillDef = {
    displayName: '因粮于敌',
    effect: 'post_battle_troop_pct',
    magnitude: 0.02,
};

/** 守军系统技 effect（非战术十格 / 战略六格） */
export type GarrisonSystemEffect = 'pass_garrison_mult';

export interface GarrisonSystemSkillDef {
    displayName: string;
}

export const PASS_GARRISON_DEFENSE_SKILL: GarrisonSystemSkillDef = {
    displayName: '拒险而战',
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
    wuzhou_d_wuzetian: { generalId: 'wuzhou_d_wuzetian', tier: 'ordinary', tacticalSkillId: 'ts_021' },    guishuang_qiuqiujiu: { generalId: 'guishuang_qiuqiujiu', tier: 'ordinary', tacticalSkillId: 'ts_035' },    qidan_shulvping: { generalId: 'qidan_shulvping', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 辽太祖皇后，政治手腕削弱对手
    // ── 中国及外围 ──
    hui_bunaihou: { generalId: 'hui_bunaihou', tier: 'ordinary', tacticalSkillId: 'ts_026' },
    xin_baiqi: { generalId: 'xin_baiqi', tier: 'famous', tacticalSkillId: 'ts_158', strategicSkillId: 'str_03' }, // 白起·人屠：伊阙破魏韩联军、长平破赵括，专破敌军名将统帅（擒贼擒王）
    qin_simacuo: { generalId: 'qin_simacuo', tier: 'famous', tacticalSkillId: 'ts_022', strategicSkillId: 'str_10' }, // S⑤居高临下 + ②避实击虚（越岭平蜀，奇袭楚国）
    qin_wangben: { generalId: 'qin_wangben', tier: 'famous', tacticalSkillId: 'ts_005', strategicSkillId: 'str_01' }, // S①兵贵神速 + ③侵掠如火（闪击燕齐，水淹大梁）
    qin_mengtian: { generalId: 'qin_mengtian', tier: 'ordinary', tacticalSkillId: 'ts_036' }, // S④长驱直入 + ①以逸待劳（北击匈奴，驻守长城）
    qin_yingji: { generalId: 'qin_yingji', tier: 'famous', tacticalSkillId: 'ts_121', strategicSkillId: 'str_10' },    beidi_yaochang: { generalId: 'beidi_yaochang', tier: 'ordinary', tacticalSkillId: 'ts_027' }, // S②攻城拔寨 + ②避实击虚（擒杀苻坚，攻克长安）
    unassigned_simacuo: { generalId: 'unassigned_simacuo', tier: 'ordinary', tacticalSkillId: 'ts_024' }, // 前316年灭蜀苴巴
    tang_lishimin: { generalId: 'tang_lishimin', tier: 'famous', tacticalSkillId: 'ts_051', strategicSkillId: 'str_10' }, // 所向无前（天策破阵）
    unassigned_direnjie: { generalId: 'unassigned_direnjie', tier: 'ordinary', tacticalSkillId: 'ts_019' }, // 退突厥：间谍离间后反击
    pinghai_laihuer: { generalId: 'pinghai_laihuer', tier: 'ordinary', tacticalSkillId: 'ts_030' }, // 征东：水师突击平壤焚舰
    jianzhou_nvzhen_limanzhu: { generalId: 'jianzhou_nvzhen_limanzhu', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 建州：聚合诸部筑城自守
    unassigned_zhangliang: { generalId: 'unassigned_zhangliang', tier: 'ordinary', tacticalSkillId: 'ts_028' }, // 征东：唐水军渡海攻坚
    mushi_muchong: { generalId: 'mushi_muchong', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 代北：北魏开国翼戴
    lai_wangshifan: { generalId: 'lai_wangshifan', tier: 'ordinary', tacticalSkillId: 'ts_034' }, // 平卢：反朱温决死突击
    xiongding_murongyong: { generalId: 'xiongding_murongyong', tier: 'ordinary', tacticalSkillId: 'ts_017' }, // 西燕：亡国哀兵复起
    chanzhou_chairong: { generalId: 'chanzhou_chairong', tier: 'famous', tacticalSkillId: 'ts_147', strategicSkillId: 'str_11' }, // 澶州：周世宗亲征
    linhu_zhaowulingwang: { generalId: 'linhu_zhaowulingwang', tier: 'ordinary', tacticalSkillId: 'ts_029' },    xianyu_hanxin: { generalId: 'xianyu_hanxin', tier: 'famous', tacticalSkillId: 'ts_013', strategicSkillId: 'str_12' },    shizhao_d_shihu: { generalId: 'shizhao_d_shihu', tier: 'ordinary', tacticalSkillId: 'ts_026' }, // 邺都：暴虐突袭
    unassigned_loufanwang: { generalId: 'unassigned_loufanwang', tier: 'ordinary', tacticalSkillId: 'ts_017' }, // 楼烦：亡部哀兵复起
    shanrong_tianchou: { generalId: 'shanrong_tianchou', tier: 'ordinary', tacticalSkillId: 'ts_001' },    xie_cj_d_xingfangde: { generalId: 'xie_cj_d_xingfangde', tier: 'ordinary', tacticalSkillId: 'ts_006' }, // 信州：垒山筑寨据守抗元
    wan_liuyuan: { generalId: 'wan_liuyuan', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // 刘源皖口
    huang_d_sunshuao: { generalId: 'huang_d_sunshuao', tier: 'ordinary', tacticalSkillId: 'ts_024' }, // 期思：筑芍陂兴水利
    wenzhou_zhangcong: { generalId: 'wenzhou_zhangcong', tier: 'ordinary', tacticalSkillId: 'ts_028' }, // 永嘉：整顿海防编练水师
    qianzhong_wubayue: { generalId: 'qianzhong_wubayue', tier: 'ordinary', tacticalSkillId: 'ts_034' }, // 乾嘉：苗民决死破清军
    dangchang_liangmiding: { generalId: 'dangchang_liangmiding', tier: 'famous', tacticalSkillId: 'ts_026', strategicSkillId: 'str_10' },    liao_houhongyuan: { generalId: 'liao_houhongyuan', tier: 'ordinary', tacticalSkillId: 'ts_006' }, // 巴僚：酋帅哀兵守土
    sou_gaodingyuan: { generalId: 'sou_gaodingyuan', tier: 'ordinary', tacticalSkillId: 'ts_039' }, // 越巂：反蜀决死突围
    unassigned_duwenxiu: { generalId: 'unassigned_duwenxiu', tier: 'ordinary', tacticalSkillId: 'ts_017' }, // 回军：哀兵复起
    qingqiang_jiangwei: { generalId: 'qingqiang_jiangwei', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_13' }, // 北伐：避实击虚九伐中原
    qingyi_fanchangsheng: { generalId: 'qingyi_fanchangsheng', tier: 'ordinary', tacticalSkillId: 'ts_014' }, // 范长生天师道
    guangping_ruanwenzhang: { generalId: 'guangping_ruanwenzhang', tier: 'ordinary', tacticalSkillId: 'ts_028' }, // 广平：象兵水师哀兵抗西山
    nanzhong_mazhong: { generalId: 'nanzhong_mazhong', tier: 'ordinary', tacticalSkillId: 'ts_006' }, // 南中：镇抚夷汉固守边郡
    yueyi_zhangyi: { generalId: 'yueyi_zhangyi', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_10' }, // 张嶷越嶲
    jingjiang_qushisi: { generalId: 'jingjiang_qushisi', tier: 'ordinary', tacticalSkillId: 'ts_041' }, // 永安：固守靖江破李成栋
    duanzhou_d_caojin: { generalId: 'duanzhou_d_caojin', tier: 'ordinary', tacticalSkillId: 'ts_035' }, // 端州：据城拒侬智高
    monong_anong: { generalId: 'monong_anong', tier: 'ordinary', tacticalSkillId: 'ts_017' }, // 邦敦：哀兵退守
    basha_d_daogengmeng: { generalId: 'basha_d_daogengmeng', tier: 'ordinary', tacticalSkillId: 'ts_035' }, // 上丁：象兵雄踞
    leizhou_limao_leizhou: { generalId: 'leizhou_limao_leizhou', tier: 'ordinary', tacticalSkillId: 'ts_026' }, // 雷州：驻防海康
    ketagalan_huangqingyun: { generalId: 'ketagalan_huangqingyun', tier: 'ordinary', tacticalSkillId: 'ts_006' }, // 艋舺：汛防戍守
    shuizhen_oudaren: { generalId: 'shuizhen_oudaren', tier: 'ordinary', tacticalSkillId: 'ts_006' }, // 三菩：戍卒驻守
    pingnan_musheng: { generalId: 'pingnan_musheng', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // 腾越：征讨麓川屡立战功
    jingdong_taohong: { generalId: 'jingdong_taohong', tier: 'ordinary', tacticalSkillId: 'ts_006' }, // 银生：坚守退敌
    ava_sijifa: { generalId: 'ava_sijifa', tier: 'ordinary', tacticalSkillId: 'ts_017' }, // 阿瓦：哀兵退守
    dian_duanjianwei: { generalId: 'dian_duanjianwei', tier: 'ordinary', tacticalSkillId: 'ts_024' }, // 通海：南诏都督镇守
    unassigned_monuha: { generalId: 'unassigned_monuha', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // 直通：孟族国王
    luohu_ganmuding: { generalId: 'luohu_ganmuding', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 呵叻：罗斛驻守
    ailao_leilao: { generalId: 'ailao_leilao', tier: 'ordinary', tacticalSkillId: 'ts_034' }, // 永昌：哀牢决死反叛
    mingzheng_jianzandechang: { generalId: 'mingzheng_jianzandechang', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // 打箭炉：从征金川
    hani_d_zhebi: { generalId: 'hani_d_zhebi', tier: 'ordinary', tacticalSkillId: 'ts_014' }, // 思陀：从征安南
    unassigned_piqiluomo: { generalId: 'unassigned_piqiluomo', tier: 'ordinary', tacticalSkillId: 'ts_006' }, // 骠国：守城戍卒
    ali_gandancaiwang: { generalId: 'ali_gandancaiwang', tier: 'ordinary', tacticalSkillId: 'ts_009' }, // 阿里：远征拉达克
    gaoliang_fengang: { generalId: 'gaoliang_fengang', tier: 'ordinary', tacticalSkillId: 'ts_015' },    bailan_pabala: { generalId: 'bailan_pabala', tier: 'ordinary', tacticalSkillId: 'ts_006' }, // 昌都：率僧兵守城
    jiantang_sangjiejia: { generalId: 'jiantang_sangjiejia', tier: 'ordinary', tacticalSkillId: 'ts_024' }, // 建塘：第巴摄政遣防
    kongsa_kongsayiduo: { generalId: 'kongsa_kongsayiduo', tier: 'ordinary', tacticalSkillId: 'ts_014' }, // 甘孜：从征瞻对
    unassigned_lazanghan: { generalId: 'unassigned_lazanghan', tier: 'ordinary', tacticalSkillId: 'ts_024' }, // 黑河宗：卫拉特突骑
    gling_lingesar: { generalId: 'gling_lingesar', tier: 'ordinary', tacticalSkillId: 'ts_007' }, // 岭国：史诗英雄
    unassigned_nangqianwang: { generalId: 'unassigned_nangqianwang', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // 隆庆：二十五族盟主
    unassigned_huoerkangsa: { generalId: 'unassigned_huoerkangsa', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // 索宗：协剿波密
    daca_dacajilong: { generalId: 'daca_dacajilong', tier: 'ordinary', tacticalSkillId: 'ts_014' }, // 八宿：活佛差民武装
    gongtang_gongtangang: { generalId: 'gongtang_gongtangang', tier: 'ordinary', tacticalSkillId: 'ts_035' }, // 吉麦：牧民武装
    unassigned_juemuba: { generalId: 'unassigned_juemuba', tier: 'ordinary', tacticalSkillId: 'ts_024' }, // 觉木：宗谿驻兵
    unassigned_dalonghuofo: { generalId: 'unassigned_dalonghuofo', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // 类乌齐：抵御盗匪
    nanjie_nanjiewangqiu: { generalId: 'nanjie_nanjiewangqiu', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // 日土：边军驻防
    unassigned_zhudi: { generalId: 'unassigned_zhudi', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_01' }, // 靖难军白沟突击
    ming_d_zhudi: { generalId: 'ming_d_zhudi', tier: 'famous', tacticalSkillId: 'ts_062', strategicSkillId: 'str_03' }, // 奉天靖难（靖难野战·五征漠北）
    jinling_tandaoji: { generalId: 'jinling_tandaoji', tier: 'famous', tacticalSkillId: 'ts_014', strategicSkillId: 'str_14' }, // 唱筹量沙·三十六计走为上
    yang_zhou_yangxingmi: { generalId: 'yang_zhou_yangxingmi', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_03' }, // 清口之战破孙儒、守淮南
    yangzhou_wangping: { generalId: 'yangzhou_wangping', tier: 'famous', tacticalSkillId: 'ts_169', strategicSkillId: 'str_10' }, // 244年兴势之战据险大破曹爽
    pagan_anuluvtuo: { generalId: 'pagan_anuluvtuo', tier: 'famous', tacticalSkillId: 'ts_007', strategicSkillId: 'str_03' }, // 蒲甘王朝东征西讨
    unassigned_machao: { generalId: 'unassigned_machao', tier: 'ordinary', tacticalSkillId: 'ts_038' }, // 潼关决死突击
    qiuci_baiba: { generalId: 'qiuci_baiba', tier: 'ordinary', tacticalSkillId: 'ts_017' }, // 龟兹内乱：哀兵复国
    menggu_d_chengjisihan: { generalId: 'menggu_d_chengjisihan', tier: 'famous', tacticalSkillId: 'ts_059', strategicSkillId: 'str_01' }, // 长生天佑（免疫一切开局战损）+ 兵贵神速奔袭
    bohai_dazuorong: { generalId: 'bohai_dazuorong', tier: 'famous', tacticalSkillId: 'ts_091', strategicSkillId: 'str_14' }, // 阻险御敌
    goryeo_jiangganzan: { generalId: 'goryeo_jiangganzan', tier: 'famous', tacticalSkillId: 'ts_045', strategicSkillId: 'str_14' }, // 金岘大捷：守土反击破辽
    ashikaga_zulijunshi: { generalId: 'ashikaga_zulijunshi', tier: 'ordinary', tacticalSkillId: 'ts_033' }, // 凑川败后据九州水师固守
    tiemuer_tiemuer: { generalId: 'tiemuer_tiemuer', tier: 'famous', tacticalSkillId: 'ts_115', strategicSkillId: 'str_01' }, // 六年征服千里闪击
    siam_nalixuan: { generalId: 'siam_nalixuan', tier: 'famous', tacticalSkillId: 'ts_029', strategicSkillId: 'str_13' }, // 象战击杀缅甸王储复国
    shang_fuhao: { generalId: 'shang_fuhao', tier: 'famous', tacticalSkillId: 'ts_005', strategicSkillId: 'str_03' }, // 征伐土方武丁妇好率军突击
    pizhou_lvbu: { generalId: 'pizhou_lvbu', tier: 'ordinary', tacticalSkillId: 'ts_026' }, // 下邳飞将
    han_d_liubang: { generalId: 'han_d_liubang', tier: 'famous', tacticalSkillId: 'ts_035', strategicSkillId: 'str_07' }, // S⑦因粮于敌 + ②避实击虚（君主全能调度）
    wei_wuqi: { generalId: 'wei_wuqi', tier: 'famous', tacticalSkillId: 'ts_053', strategicSkillId: 'str_03' }, // 无坚不摧（魏武卒精锐无死角高昂士气）
    manzhou_nuerhachi: { generalId: 'manzhou_nuerhachi', tier: 'famous', tacticalSkillId: 'ts_058', strategicSkillId: 'str_03' },
    xinluo_jinyixin: { generalId: 'xinluo_jinyixin', tier: 'famous', tacticalSkillId: 'ts_006', strategicSkillId: 'str_03' }, // 萨円大捷守城反攻
    seljuq_sangjiaer: { generalId: 'seljuq_sangjiaer', tier: 'famous', tacticalSkillId: 'ts_128', strategicSkillId: 'str_15' }, // 中亚草原对峙以逸待变
    zaoyang_d_menggong: { generalId: 'zaoyang_d_menggong', tier: 'famous', tacticalSkillId: 'ts_126', strategicSkillId: 'str_03' }, // 枣阳孤城死守破蒙古
    yamato_nanmuzhengcheng: { generalId: 'yamato_nanmuzhengcheng', tier: 'famous', tacticalSkillId: 'ts_172', strategicSkillId: 'str_10' }, // 千早城笼城死守抗幕府
    chen3_chenwang: { generalId: 'chen3_chenwang', tier: 'ordinary', tacticalSkillId: 'ts_041' }, // 马韩辰王治月支国
    jilizhou_chengmingzhen: { generalId: 'jilizhou_chengmingzhen', tier: 'ordinary', tacticalSkillId: 'ts_027' }, // 卑沙城水陆并进攻克
    nuergan_kangwang: { generalId: 'nuergan_kangwang', tier: 'ordinary', tacticalSkillId: 'ts_006' }, // 奴儿干都司戍边
    ashina_ashinayandu: { generalId: 'ashina_ashinayandu', tier: 'ordinary', tacticalSkillId: 'ts_007' }, // 阿尔泰金山突厥
    yiwu_hanshen: { generalId: 'yiwu_hanshen', tier: 'ordinary', tacticalSkillId: 'ts_035' }, // 哈密忠顺王苦峪抗也先
    hepan_peishenfu: { generalId: 'hepan_peishenfu', tier: 'ordinary', tacticalSkillId: 'ts_006' }, // 朅盘陀石头城戍守
    unassigned_cewangzhabu: { generalId: 'unassigned_cewangzhabu', tier: 'ordinary', tacticalSkillId: 'ts_026' }, // 札萨克图汗部
    unassigned_amursana: { generalId: 'unassigned_amursana', tier: 'ordinary', tacticalSkillId: 'ts_026', strategicSkillId: 'str_10' }, // 金山辉特部反清
    chuyue_shatuonasu: { generalId: 'chuyue_shatuonasu', tier: 'ordinary', tacticalSkillId: 'ts_026' }, // 独山城处月部
    keerkezi_manasi: { generalId: 'keerkezi_manasi', tier: 'ordinary', tacticalSkillId: 'ts_026' }, // 柯尔克孜史诗英雄
    unassigned_zhangyao: { generalId: 'unassigned_zhangyao', tier: 'ordinary', tacticalSkillId: 'ts_029' }, // 星星峡嵩武军入疆
    xiyuduhu_banchao: { generalId: 'xiyuduhu_banchao', tier: 'famous', tacticalSkillId: 'ts_064', strategicSkillId: 'str_01' }, // 虎穴奇袭（疏勒·36骑定西域）
    yangguan_banyong: { generalId: 'yangguan_banyong', tier: 'famous', tacticalSkillId: 'ts_137', strategicSkillId: 'str_07' },    wulianghai_chelingwubashi: { generalId: 'wulianghai_chelingwubashi', tier: 'ordinary', tacticalSkillId: 'ts_041' },    tumengken_tumengken: { generalId: 'tumengken_tumengken', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 赛音诺颜抗卫拉特
    bayegu_qulishi: { generalId: 'bayegu_qulishi', tier: 'ordinary', tacticalSkillId: 'ts_035' }, // 拔野古助唐灭薛延陀
    zubu_mogusi: { generalId: 'zubu_mogusi', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // 阻卜酋长叛辽
    wuzhumuqin_duoerji: { generalId: 'wuzhumuqin_duoerji', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 乌珠穆沁随征噶尔丹
    unassigned_feizigu: { generalId: 'unassigned_feizigu', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // 白狄肥国肥子鼓集宁
    shiwei_saigou: { generalId: 'shiwei_saigou', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // 室韦大酋长塞呴俱轮泊元和入朝
    sunite_sunitezasake: { generalId: 'sunite_sunitezasake', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 苏尼特札萨克
    bulat_boduanchaer: { generalId: 'bulat_boduanchaer', tier: 'ordinary', tacticalSkillId: 'ts_024' }, // 蒙古始祖孛端察儿石勒喀河
    unassigned_danjin: { generalId: 'unassigned_danjin', tier: 'ordinary', tacticalSkillId: 'ts_026' }, // 首任唐努总管丹津 // 布尔根乌梁海部
    // ── 日本 ──
    edo_dechuangjiakang: { generalId: 'edo_dechuangjiakang', tier: 'famous', tacticalSkillId: 'ts_127', strategicSkillId: 'str_12' }, // 关原后稳坐江户待变
    kai_wutianxinxuan: { generalId: 'kai_wutianxinxuan', tier: 'famous', tacticalSkillId: 'ts_171', strategicSkillId: 'str_01' }, // 川中岛铁骑突击
    echigo_shangshanqianxin: { generalId: 'echigo_shangshanqianxin', tier: 'famous', tacticalSkillId: 'ts_049', strategicSkillId: 'str_11' }, // 川中岛车悬突击
    hashiba_fengchenxiuji: { generalId: 'hashiba_fengchenxiuji', tier: 'famous', tacticalSkillId: 'ts_005', strategicSkillId: 'str_01' }, // 鸟取忍城粮道奇袭
    sanada_d_zhentianxingcun: { generalId: 'sanada_d_zhentianxingcun', tier: 'famous', tacticalSkillId: 'ts_156', strategicSkillId: 'str_11' }, // 大阪夏之阵赤备突击
    date_d_yidazhengzong: { generalId: 'date_d_yidazhengzong', tier: 'famous', tacticalSkillId: 'ts_024', strategicSkillId: 'str_12' }, // 独眼兜冲阵
    owari_zhitianxinchang: { generalId: 'owari_zhitianxinchang', tier: 'famous', tacticalSkillId: 'ts_114', strategicSkillId: 'str_03' }, // 桶狭间奇袭破今川
    totomi_sakaitadatsugu: { generalId: 'totomi_sakaitadatsugu', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_01' }, // 浜松城·德川四天王
    jinchuan_jinchuanyiyuan: { generalId: 'jinchuan_jinchuanyiyuan', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 东海道第一弓取·大军压境
    aki_maoliyuanjiu: { generalId: 'aki_maoliyuanjiu', tier: 'famous', tacticalSkillId: 'ts_023', strategicSkillId: 'str_11' }, // 严岛夜袭少胜多
    satsuma_daojinjiajiu: { generalId: 'satsuma_daojinjiajiu', tier: 'famous', tacticalSkillId: 'ts_130', strategicSkillId: 'str_12' }, // 钓野伏·冲田畷耳川合战
    otomo_d_lihuadaoxue: { generalId: 'otomo_d_lihuadaoxue', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_03' }, // 迁冈筑城拒敌
    higo_d_juchiwuguang: { generalId: 'higo_d_juchiwuguang', tier: 'ordinary', tacticalSkillId: 'ts_002' }, // 菊池河山战突击
    aizu_pushengshixiang: { generalId: 'aizu_pushengshixiang', tier: 'ordinary', tacticalSkillId: 'ts_035' }, // 会津五奉行据山城维稳
    chosokabe_changzongwobuyuanqin: { generalId: 'chosokabe_changzongwobuyuanqin', tier: 'famous', tacticalSkillId: 'ts_024', strategicSkillId: 'str_10' }, // 长宗我部奇袭统一四国
    izumo_shanzhonglujie: { generalId: 'izumo_shanzhonglujie', tier: 'ordinary', tacticalSkillId: 'ts_014' }, // 局部守战逆袭
    unassigned_lingmuzhongxiu: { generalId: 'unassigned_lingmuzhongxiu', tier: 'ordinary', tacticalSkillId: 'ts_006' }, // 筑寨固守
    iga_d_baididanbo: { generalId: 'iga_d_baididanbo', tier: 'ordinary', tacticalSkillId: 'ts_024' }, // 伊贺忍者夜袭
    jibei2_qingshuizongzhi: { generalId: 'jibei2_qingshuizongzhi', tier: 'ordinary', tacticalSkillId: 'ts_045' }, // 备中高松城笼城死守
    sagami_hojoujiyasu: { generalId: 'sagami_hojoujiyasu', tier: 'famous', tacticalSkillId: 'ts_006', strategicSkillId: 'str_14' }, // 小田原城·天下第一坚城
    mino_otaniyoshitsugu: { generalId: 'mino_otaniyoshitsugu', tier: 'ordinary', tacticalSkillId: 'ts_034' }, // 不破关·关原死战
    suwa_d_zoufanglaizhong: { generalId: 'suwa_d_zoufanglaizhong', tier: 'ordinary', tacticalSkillId: 'ts_002' }, // 诹访据险反击
    shimotsuke_yudugongguanggang: { generalId: 'shimotsuke_yudugongguanggang', tier: 'ordinary', tacticalSkillId: 'ts_037' }, // 宇都宫筑城固守
    iyo_d_cunshangwuji: { generalId: 'iyo_d_cunshangwuji', tier: 'ordinary', tacticalSkillId: 'ts_028' }, // 村上水军奇袭
    nanbu_nanbuqingzheng: { generalId: 'nanbu_nanbuqingzheng', tier: 'ordinary', tacticalSkillId: 'ts_026' }, // 南部藩境守反击
    unassigned_yuxiduozhijia: { generalId: 'unassigned_yuxiduozhijia', tier: 'ordinary', tacticalSkillId: 'ts_019' }, // 离间毛利后取备前
    osumi_ganfujianxu: { generalId: 'osumi_ganfujianxu', tier: 'ordinary', tacticalSkillId: 'ts_028' }, // 肝付水军奇袭
    fujiwara_yuanyijing: { generalId: 'fujiwara_yuanyijing', tier: 'famous', tacticalSkillId: 'ts_017', strategicSkillId: 'str_11' }, // 屋岛冲夜袭
    kakizaki_liqiqingguang: { generalId: 'kakizaki_liqiqingguang', tier: 'ordinary', tacticalSkillId: 'ts_035' }, // 虾夷边境守反击
    ayinu_hushemoquan: { generalId: 'ayinu_hushemoquan', tier: 'ordinary', tacticalSkillId: 'ts_020' }, // 阿伊努战：绝境奋起
    so_zongyizhi: { generalId: 'so_zongyizhi', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 对朝奇袭
    taira_pingzhisheng: { generalId: 'taira_pingzhisheng', tier: 'ordinary', tacticalSkillId: 'ts_033' }, // 坛浦决战水师覆没前死战（非④）
    // ── 朝鲜 ──
    joseon_lichenggui: { generalId: 'joseon_lichenggui', tier: 'famous', tacticalSkillId: 'ts_072', strategicSkillId: 'str_11' }, // 回军靖难（威化岛斩首奇袭）
    gaogouli_yizhiwende: { generalId: 'gaogouli_yizhiwende', tier: 'famous', tacticalSkillId: 'ts_173', strategicSkillId: 'str_15' },    baiji_jiebai: { generalId: 'baiji_jiebai', tier: 'famous', tacticalSkillId: 'ts_034', strategicSkillId: 'str_03' }, // 车昌野隘突击
    zhen_zhenxuan: { generalId: 'zhen_zhenxuan', tier: 'famous', tacticalSkillId: 'ts_024', strategicSkillId: 'str_15' },    danluo_jintongjing: { generalId: 'danluo_jintongjing', tier: 'ordinary', tacticalSkillId: 'ts_037' }, // 金通精守城逆袭
    sambyeol_lishunchen: { generalId: 'sambyeol_lishunchen', tier: 'famous', tacticalSkillId: 'ts_060', strategicSkillId: 'str_14' }, // 必死则生（绝地反击重掷极品）
    gaya_jinshoulu: { generalId: 'gaya_jinshoulu', tier: 'famous', tacticalSkillId: 'ts_024', strategicSkillId: 'str_10' }, // 金官伽倻筑城
    woju_yinguan: { generalId: 'woju_yinguan', tier: 'ordinary', tacticalSkillId: 'ts_095' }, // 勿里伐高句丽久战拖敌
    xuantu_yuangaisuwen: { generalId: 'xuantu_yuangaisuwen', tier: 'famous', tacticalSkillId: 'ts_096', strategicSkillId: 'str_14' }, // 安市围城守城破唐
    ssangseong_cuiying: { generalId: 'ssangseong_cuiying', tier: 'famous', tacticalSkillId: 'ts_097', strategicSkillId: 'str_14' }, // 太宗条外长城据守
    ssangseong_lizichun: { generalId: 'ssangseong_lizichun', tier: 'ordinary', tacticalSkillId: 'ts_098' }, // 李子春哀兵
    chungju_d_quanli: { generalId: 'chungju_d_quanli', tier: 'famous', tacticalSkillId: 'ts_099', strategicSkillId: 'str_14' }, // 幸州大捷·据垒守城
    sabeol_jinshimin: { generalId: 'sabeol_jinshimin', tier: 'famous', tacticalSkillId: 'ts_100', strategicSkillId: 'str_14' }, // 晋州大捷·守城战死
    // ── 东北
    manzhou_d_duergan: { generalId: 'manzhou_d_duergan', tier: 'famous', tacticalSkillId: 'ts_067', strategicSkillId: 'str_03' },
    dajin_wanyanaguda: { generalId: 'dajin_wanyanaguda', tier: 'famous', tacticalSkillId: 'ts_057', strategicSkillId: 'str_01' }, // 满万无敌（阿骨打极限兵力劣势碾压·归位现成技）
    wuliangha_subutai: { generalId: 'wuliangha_subutai', tier: 'famous', tacticalSkillId: 'ts_102', strategicSkillId: 'str_01' }, // 速不台西征破欧洲联军
    unassigned_naierbuhua: { generalId: 'unassigned_naierbuhua', tier: 'ordinary', tacticalSkillId: 'ts_103', strategicSkillId: 'str_03' }, // 永乐北伐兀良哈败乃儿不花
    fuyu_weichoutai: { generalId: 'fuyu_weichoutai', tier: 'ordinary', tacticalSkillId: 'ts_104' }, // 扶余据城固守
    jurchen_wanyanzongbi: { generalId: 'jurchen_wanyanzongbi', tier: 'famous', tacticalSkillId: 'ts_076', strategicSkillId: 'str_03' }, // 如墙而进（郾城铁浮屠平原突击·归位现成技）
    aisin_d_huangtaiji: { generalId: 'aisin_d_huangtaiji', tier: 'famous', tacticalSkillId: 'ts_077', strategicSkillId: 'str_03' }, // 长围久困
    mohe_wanyanzonghan: { generalId: 'mohe_wanyanzonghan', tier: 'famous', tacticalSkillId: 'ts_078', strategicSkillId: 'str_03' },
    suolun_bomuboguoer: { generalId: 'suolun_bomuboguoer', tier: 'ordinary', tacticalSkillId: 'ts_010' },
    wula_buzhantai: { generalId: 'wula_buzhantai', tier: 'ordinary', tacticalSkillId: 'ts_082' }, // 断粮后会战
    yehe_jintaiji: { generalId: 'yehe_jintaiji', tier: 'ordinary', tacticalSkillId: 'ts_083' }, // 金太祖哀兵逆袭
    keerqin_aoba: { generalId: 'keerqin_aoba', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 科尔沁奥巴归附后骑袭
    wure_wuzhaodu: { generalId: 'wure_wuzhaodu', tier: 'ordinary', tacticalSkillId: 'ts_085' }, // 元末断粮破敌
    houliao_yelvliuge: { generalId: 'houliao_yelvliuge', tier: 'famous', tacticalSkillId: 'ts_086', strategicSkillId: 'str_15' }, // 涿州筑垒固守
    unassigned_wangtai: { generalId: 'unassigned_wangtai', tier: 'ordinary', tacticalSkillId: 'ts_087' }, // 王台部寨固守
    jinzhou_lichengliang: { generalId: 'jinzhou_lichengliang', tier: 'famous', tacticalSkillId: 'ts_084', strategicSkillId: 'str_11' }, // 铁骑蹙敌
    zu_d_zudashou: { generalId: 'zu_d_zudashou', tier: 'famous', tacticalSkillId: 'ts_065', strategicSkillId: 'str_14' }, // 袁崇焕·凭坚摧锋（宁远凭坚城用大炮）
    wanzhou_shangguankui: { generalId: 'wanzhou_shangguankui', tier: 'ordinary', tacticalSkillId: 'ts_037' }, // 万州天生城抗元
    chenzhou_d_zhanggao: { generalId: 'chenzhou_d_zhanggao', tier: 'ordinary', tacticalSkillId: 'ts_091' }, // 辰州戍守
    mao_wenlong_maowenlong: { generalId: 'mao_wenlong_maowenlong', tier: 'famous', tacticalSkillId: 'ts_028', strategicSkillId: 'str_14' }, // 皮岛东江据岛固守
    dawoer_baldaqi: { generalId: 'dawoer_baldaqi', tier: 'ordinary', tacticalSkillId: 'ts_035' },    heishui_nishuli: { generalId: 'heishui_nishuli', tier: 'ordinary', tacticalSkillId: 'ts_035' },    yeren_nvzhen_boke: { generalId: 'yeren_nvzhen_boke', tier: 'ordinary', tacticalSkillId: 'ts_011' },    wuji_yilizhi: { generalId: 'wuji_yilizhi', tier: 'ordinary', tacticalSkillId: 'ts_024' }, // 勿吉首领朝贡北魏
    jilin_fujun: { generalId: 'jilin_fujun', tier: 'ordinary', tacticalSkillId: 'ts_029' }, // 吉林将军屯田戍边
    dongdan_yelvbei: { generalId: 'dongdan_yelvbei', tier: 'ordinary', tacticalSkillId: 'ts_026' }, // 东丹王以敖东城为都
    kuye_kuye_qiuzhang: { generalId: 'kuye_kuye_qiuzhang', tier: 'ordinary', tacticalSkillId: 'ts_028' }, // 库页岛费雅喀
    sushen_tudiji: { generalId: 'sushen_tudiji', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 靺鞨首领突地稽归唐
    yilou_naoya: { generalId: 'yilou_naoya', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // 挹娄首领助战高句丽
    maomingan_gentemuer: { generalId: 'maomingan_gentemuer', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // 达斡尔酋长格尔必齐
    unassigned_kaolangwu: { generalId: 'unassigned_kaolangwu', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 囊哈儿卫指挥考郎兀
    unassigned_hazheng: { generalId: 'unassigned_hazheng', tier: 'ordinary', tacticalSkillId: 'ts_026' }, // 兀列河卫哈正诺托罗
    unassigned_hudamu: { generalId: 'unassigned_hudamu', tier: 'ordinary', tacticalSkillId: 'ts_026' }, // 野人女真忽答木盆奴里
    unassigned_mangka: { generalId: 'unassigned_mangka', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // 费雅喀族长莽喀普禄
    unassigned_xiyangha: { generalId: 'unassigned_xiyangha', tier: 'ordinary', tacticalSkillId: 'ts_014' }, // 女真大酋长西阳哈瓦伦
    hezhe_sharhuda: { generalId: 'hezhe_sharhuda', tier: 'famous', tacticalSkillId: 'ts_033', strategicSkillId: 'str_13' },
    liao_d_yelvabaoji: { generalId: 'liao_d_yelvabaoji', tier: 'famous', tacticalSkillId: 'ts_087', strategicSkillId: 'str_03' }, // 鼓行而西
    yel_yelvxiuge: { generalId: 'yel_yelvxiuge', tier: 'famous', tacticalSkillId: 'ts_119', strategicSkillId: 'str_14' }, // 满城大败宋师以逸待劳
    yizhou_wanyanloushi: { generalId: 'yizhou_wanyanloushi', tier: 'famous', tacticalSkillId: 'ts_131', strategicSkillId: 'str_03' }, // 富平之战大破张浚五路宋军
    unassigned_shilu: { generalId: 'unassigned_shilu', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // 完颜始祖据黑水故地
    unassigned_menglelun: { generalId: 'unassigned_menglelun', tier: 'ordinary', tacticalSkillId: 'ts_035' }, // 雅克萨达斡尔据寨
    unassigned_yilv: { generalId: 'unassigned_yilv', tier: 'ordinary', tacticalSkillId: 'ts_017' }, // 义律部哀兵守境
    yuwen_yuwentai: { generalId: 'yuwen_yuwentai', tier: 'famous', tacticalSkillId: 'ts_081', strategicSkillId: 'str_15' },
    wala_yexian: { generalId: 'wala_yexian', tier: 'famous', tacticalSkillId: 'ts_068', strategicSkillId: 'str_07' }, // 乘虚直捣（土木堡之变）
// ── 草原区 2026-06-18 ──
      jiluo_d_douxian: { generalId: 'jiluo_d_douxian', tier: 'famous', tacticalSkillId: 'ts_009', strategicSkillId: 'str_12' }, // 燕然勒石破北匈奴
    unassigned_yelvdeguang: { generalId: 'unassigned_yelvdeguang', tier: 'famous', tacticalSkillId: 'ts_049', strategicSkillId: 'str_03' }, // 灭后唐取汴京
    kumo_xiwanghuilibao: { generalId: 'kumo_xiwanghuilibao', tier: 'ordinary', tacticalSkillId: 'ts_034' }, // 奚王自立，决死抗战
    geluolu_chisipijia: { generalId: 'geluolu_chisipijia', tier: 'ordinary', tacticalSkillId: 'ts_024' }, // 葛逻禄纵横西域外交
    ogodei_chuormahan: { generalId: 'ogodei_chuormahan', tier: 'famous', tacticalSkillId: 'ts_089', strategicSkillId: 'str_01' }, // 风卷残云
    merkit_tuoheituoa: { generalId: 'merkit_tuoheituoa', tier: 'ordinary', tacticalSkillId: 'ts_001' },    tumed_andahan: { generalId: 'tumed_andahan', tier: 'famous', tacticalSkillId: 'ts_124', strategicSkillId: 'str_11' }, // 庚戌之变长驱围北京
    kiyad_yesugai: { generalId: 'kiyad_yesugai', tier: 'famous', tacticalSkillId: 'ts_009', strategicSkillId: 'str_01' }, // 也速该草原奔袭
    unassigned_mahamu: { generalId: 'unassigned_mahamu', tier: 'ordinary', tacticalSkillId: 'ts_017' }, // 忽兰忽失温后重整
    xiajiasi_are: { generalId: 'xiajiasi_are', tier: 'famous', tacticalSkillId: 'ts_009', strategicSkillId: 'str_01' }, // 黠戛斯灭回鹘神速
    xiongnu_maodun: { generalId: 'xiongnu_maodun', tier: 'famous', tacticalSkillId: 'ts_066', strategicSkillId: 'str_03' }, // 鸣镝所向（白登围刘邦）
    murong_murongke: { generalId: 'murong_murongke', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_11' },
    wuhuan_tadun: { generalId: 'wuhuan_tadun', tier: 'ordinary', tacticalSkillId: 'ts_038' }, // 白狼山死战曹操
    yuan_d_hubilie: { generalId: 'yuan_d_hubilie', tier: 'famous', tacticalSkillId: 'ts_005', strategicSkillId: 'str_14' }, // 襄阳围城六年灭宋
    mengwu_hebulerhan: { generalId: 'mengwu_hebulerhan', tier: 'ordinary', tacticalSkillId: 'ts_033' }, // 蒙兀山城抗金
    shatuo_likeyong: { generalId: 'shatuo_likeyong', tier: 'famous', tacticalSkillId: 'ts_082', strategicSkillId: 'str_01' }, // 飞虎突阵
    xueyantuo_yinan: { generalId: 'xueyantuo_yinan', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_12' }, // 薛延陀脱离西突厥待机立国
    unassigned_pijiaquekehan: { generalId: 'unassigned_pijiaquekehan', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_14' }, // 回纥漠北固基
    kereyid_wanghan: { generalId: 'kereyid_wanghan', tier: 'ordinary', tacticalSkillId: 'ts_041' }, // 克烈部固守草原霸主
    naiman_taiyanghan: { generalId: 'naiman_taiyanghan', tier: 'ordinary', tacticalSkillId: 'ts_017' }, // 乃蛮末代决战哀兵
    tatar_mieguzhen: { generalId: 'tatar_mieguzhen', tier: 'ordinary', tacticalSkillId: 'ts_038' }, // 塔塔儿长期死战蒙古
    tushetu_tuxietuhan: { generalId: 'tushetu_tuxietuhan', tier: 'ordinary', tacticalSkillId: 'ts_037' }, // 土谢图固守部境
    zhasaketu_zhasaketuhan: { generalId: 'zhasaketu_zhasaketuhan', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 扎萨克图外交周旋
    gaoche_afuzhiluo: { generalId: 'gaoche_afuzhiluo', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01' }, // 高车西迁先稳后打
    tujue_ashinatumen: { generalId: 'tujue_ashinatumen', tier: 'famous', tacticalSkillId: 'ts_088', strategicSkillId: 'str_03' }, // 勒兵大破
    da_yuan_kuokuotiemuer: { generalId: 'da_yuan_kuokuotiemuer', tier: 'famous', tacticalSkillId: 'ts_069', strategicSkillId: 'str_10' }, // 出奇捣虚（北元山地游击抗明）
    yujiulu_yujiulv: { generalId: 'yujiulu_yujiulv', tier: 'famous', tacticalSkillId: 'ts_003', strategicSkillId: 'str_13' },
    yaoluoge_yaoluogepusa: { generalId: 'yaoluoge_yaoluogepusa', tier: 'ordinary', tacticalSkillId: 'ts_024' }, // 药罗葛早期周旋
    jalair_muhuali: { generalId: 'jalair_muhuali', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_03' },    hongirad_dexuechan: { generalId: 'hongirad_dexuechan', tier: 'ordinary', tacticalSkillId: 'ts_037' }, // 弘吉剌部固守
    choros_tuohuan: { generalId: 'choros_tuohuan', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_15' },    tiele_qibiheli: { generalId: 'tiele_qibiheli', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_01' }, // 征高句丽水陆并进
    ashide_ashidejieli: { generalId: 'ashide_ashidejieli', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_11' }, // 颉利南下奇袭渭水
    duolu_ashinahelu: { generalId: 'duolu_ashinahelu', tier: 'ordinary', tacticalSkillId: 'ts_024' }, // 西突厥十姓外交整合
    cheshihou_cheshihouwang: { generalId: 'cheshihou_cheshihouwang', tier: 'ordinary', tacticalSkillId: 'ts_011' },    kaerka_abadaikehan: { generalId: 'kaerka_abadaikehan', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_15' }, // 喀尔喀统一待变
    huyan_huyanwang: { generalId: 'huyan_huyanwang', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 呼衍王西域游击
    chahar_lindanhan: { generalId: 'chahar_lindanhan', tier: 'famous', tacticalSkillId: 'ts_018', strategicSkillId: 'str_13' },    ongut_alagusi: { generalId: 'ongut_alagusi', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 汪古部外交附蒙
    rouran_shelun: { generalId: 'rouran_shelun', tier: 'famous', tacticalSkillId: 'ts_134', strategicSkillId: 'str_01' }, // 柔然脱鲜卑神速立国
    chagatai_tuhulutiemuer: { generalId: 'chagatai_tuhulutiemuer', tier: 'famous', tacticalSkillId: 'ts_135', strategicSkillId: 'str_10' },
    pulei_dougu: { generalId: 'pulei_dougu', tier: 'famous', tacticalSkillId: 'ts_024', strategicSkillId: 'str_03' }, // 蒲类海大破北匈奴呼衍王
    xibo_d_zakulan: { generalId: 'xibo_d_zakulan', tier: 'ordinary', tacticalSkillId: 'ts_011' },    pugu_puguhuaien: { generalId: 'pugu_puguhuaien', tier: 'famous', tacticalSkillId: 'ts_033', strategicSkillId: 'str_01' }, // 平乱后叛唐据守
    pugu_ashinagudulu: { generalId: 'pugu_ashinagudulu', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_15' }, // 后突厥汗国重建者
    kelie_zhaheganbu: { generalId: 'kelie_zhaheganbu', tier: 'ordinary', tacticalSkillId: 'ts_021' },    borjigin_tuolei: { generalId: 'borjigin_tuolei', tier: 'famous', tacticalSkillId: 'ts_080', strategicSkillId: 'str_10' }, // 三峰山奇袭灭金主力
    zhadalan_zhamuhe: { generalId: 'zhadalan_zhamuhe', tier: 'famous', tacticalSkillId: 'ts_007', strategicSkillId: 'str_15' },
    zhuerqi_sachabieqi: { generalId: 'zhuerqi_sachabieqi', tier: 'ordinary', tacticalSkillId: 'ts_026' }, // 主儿乞部决战
    chechen_chechenhanshuolei: { generalId: 'chechen_chechenhanshuolei', tier: 'ordinary', tacticalSkillId: 'ts_037' }, // 车臣部驻牧固守
    kepantuo_hanritianzhong: { generalId: 'kepantuo_hanritianzhong', tier: 'ordinary', tacticalSkillId: 'ts_035' },    huite_amuersana: { generalId: 'huite_amuersana', tier: 'ordinary', tacticalSkillId: 'ts_007' },    unassigned_yuchiyao: { generalId: 'unassigned_yuchiyao', tier: 'ordinary', tacticalSkillId: 'ts_011' },    xingxingxia_zhangyao_x: { generalId: 'xingxingxia_zhangyao_x', tier: 'ordinary', tacticalSkillId: 'ts_021' },    xingxingxia_guoxiaoke: { generalId: 'xingxingxia_guoxiaoke', tier: 'famous', tacticalSkillId: 'ts_035', strategicSkillId: 'str_14' }, // 郭孝恪置死地
// ── 西域区 2026-06-18 ──
    shache_xian_suoche_wang: { generalId: 'shache_xian_suoche_wang', tier: 'ordinary', tacticalSkillId: 'ts_024' }, // 莎车王纵横西域外交
    yao_liuyuan: { generalId: 'yao_liuyuan', tier: 'famous', tacticalSkillId: 'ts_014', strategicSkillId: 'str_13' },    kong_d_kongrong: { generalId: 'kong_d_kongrong', tier: 'ordinary', tacticalSkillId: 'ts_041' },    tongma_liuang: { generalId: 'tongma_liuang', tier: 'ordinary', tacticalSkillId: 'ts_015' },    yanchuan_d_hanyu: { generalId: 'yanchuan_d_hanyu', tier: 'ordinary', tacticalSkillId: 'ts_021' },    guide_d_xiaohe: { generalId: 'guide_d_xiaohe', tier: 'ordinary', tacticalSkillId: 'ts_014' }, // 萧何深沟高垒
    tongzhou_liuzhiyuan: { generalId: 'tongzhou_liuzhiyuan', tier: 'ordinary', tacticalSkillId: 'ts_041' },    unassigned_chenpan: { generalId: 'unassigned_chenpan', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 疏勒王联汉奇袭
    dzungar_gaerdancelin: { generalId: 'dzungar_gaerdancelin', tier: 'famous', tacticalSkillId: 'ts_090', strategicSkillId: 'str_10' },
    tuerhute_wobaxi: { generalId: 'tuerhute_wobaxi', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_10' }, // 土尔扈特万里东归
    gaochang_quwentai: { generalId: 'gaochang_quwentai', tier: 'ordinary', tacticalSkillId: 'ts_024' },    yarkand_abuladitifu: { generalId: 'yarkand_abuladitifu', tier: 'ordinary', tacticalSkillId: 'ts_039' }, // 叶尔羌名将死战准清
    yiduhu_baershu: { generalId: 'yiduhu_baershu', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 亦都护外交归附蒙古
    yuchi_weichiyao: { generalId: 'yuchi_weichiyao', tier: 'ordinary', tacticalSkillId: 'ts_037' }, // 于阗王入唐勤王守城
    zhuxie_zhuxiechixin: { generalId: 'zhuxie_zhuxiechixin', tier: 'ordinary', tacticalSkillId: 'ts_007' }, // 朱邪赤心骑破庞勋
    saman_yisimayi: { generalId: 'saman_yisimayi', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_10' }, // 萨曼埃米尔巴尔赫以逸待劳
    tujishi_sulukehan: { generalId: 'tujishi_sulukehan', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_01' },
    xiliao_yelvdashi: { generalId: 'xiliao_yelvdashi', tier: 'famous', tacticalSkillId: 'ts_138', strategicSkillId: 'str_01' },    jiazini_mahamaode: { generalId: 'jiazini_mahamaode', tier: 'famous', tacticalSkillId: 'ts_049', strategicSkillId: 'str_07' }, // 马哈茂德十七征印度
    an_xibanni: { generalId: 'an_xibanni', tier: 'famous', tacticalSkillId: 'ts_007', strategicSkillId: 'str_15' }, // 昔班尼攻布哈拉建汗国
    wusun_liejiaomi: { generalId: 'wusun_liejiaomi', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_11' }, // 乌孙昆莫西迁奇袭月氏
    xijue_ganshouchang: { generalId: 'xijue_ganshouchang', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 与陈汤六校分道共灭郅支

// ── 中亚区 2026-06-18 ──
    huarazim_mohemo: { generalId: 'huarazim_mohemo', tier: 'famous', tacticalSkillId: 'ts_139', strategicSkillId: 'str_11' },    kazakh_hasimu: { generalId: 'kazakh_hasimu', tier: 'famous', tacticalSkillId: 'ts_140', strategicSkillId: 'str_07' }, // 哈萨克汗国统一
    sogdian_dewasitiqi: { generalId: 'sogdian_dewasitiqi', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // 粟特抗阿拉伯
    yanda_touluoman: { generalId: 'yanda_touluoman', tier: 'famous', tacticalSkillId: 'ts_024', strategicSkillId: 'str_12' },    yada_ahexiong: { generalId: 'yada_ahexiong', tier: 'ordinary', tacticalSkillId: 'ts_026' },    anushidgin_yile: { generalId: 'anushidgin_yile', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // 花剌子模沙抗西辽
    unassigned_muhanmodeguli: { generalId: 'unassigned_muhanmodeguli', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_12' }, // 第二次塔兰战役佯败破印军
    jibin_jianisejia: { generalId: 'jibin_jianisejia', tier: 'famous', tacticalSkillId: 'ts_020', strategicSkillId: 'str_03' }, // 迦腻色迦夏都迦毕试，贵霜极盛野战征服
    qincha_baqiman: { generalId: 'qincha_baqiman', tier: 'ordinary', tacticalSkillId: 'ts_014' }, // 钦察游击抗蒙
    dayuan_wugua: { generalId: 'dayuan_wugua', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // 大宛王抗汉
    kokand_alimukuli: { generalId: 'kokand_alimukuli', tier: 'ordinary', tacticalSkillId: 'ts_014' }, // 浩罕抗俄
    unassigned_agubai: { generalId: 'unassigned_agubai', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_10' }, // 哲德沙尔建国
    dayuzi_yinalechihei: { generalId: 'dayuzi_yinalechihei', tier: 'ordinary', tacticalSkillId: 'ts_037' }, // 讹答剌守城
    shi_clan_moheduotutun: { generalId: 'shi_clan_moheduotutun', tier: 'ordinary', tacticalSkillId: 'ts_024' }, // 石国王·唐册封吐屯
    mamon_mameng: { generalId: 'mamon_mameng', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_13' }, // 马蒙起兵夺哈里发
    jie_sijinti: { generalId: 'jie_sijinti', tier: 'ordinary', tacticalSkillId: 'ts_029' }, // 羯霜那·唐册封史国王
    unassigned_shaboluo: { generalId: 'unassigned_shaboluo', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_13' }, // 十箭部落西突厥
    maer_d_bahelamuchubin: { generalId: 'maer_d_bahelamuchubin', tier: 'ordinary', tacticalSkillId: 'ts_014' },
    wugu_d_tugelile: { generalId: 'wugu_d_tugelile', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_01' }, // 1040丹达内克胜伽色尼建塞尔柱
    loulan_suojie: { generalId: 'loulan_suojie', tier: 'ordinary', tacticalSkillId: 'ts_037' }, // 精绝屯田戍边抗北匈奴
    adao_d_mafushou: { generalId: 'adao_d_mafushou', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // 昆岗军台守驿
    wuyuan_d_chengui: { generalId: 'wuyuan_d_chengui', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_14' }, // 度辽将军守五原北塞
    chenli_d_wutang: { generalId: 'chenli_d_wutang', tier: 'ordinary', tacticalSkillId: 'ts_026' }, // 度辽将军护南匈奴
    nuoyan_d_sanyinnuoyan: { generalId: 'nuoyan_d_sanyinnuoyan', tier: 'ordinary', tacticalSkillId: 'ts_035' }, // 赛音诺颜部
    wuli_d_celeng: { generalId: 'wuli_d_celeng', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_07' }, // 定边左副将军乌里雅苏台

    unassigned_qizhijian: { generalId: 'unassigned_qizhijian', tier: 'ordinary', tacticalSkillId: 'ts_031' }, // 东汉鲜卑大人寇边
    heisha_d_houlilu: { generalId: 'heisha_d_houlilu', tier: 'famous', tacticalSkillId: 'ts_007', strategicSkillId: 'str_15' }, // 匈奴右贤王自立单于
    khoja_apakhoja: { generalId: 'khoja_apakhoja', tier: 'ordinary', tacticalSkillId: 'ts_037' }, // 白山派领袖据守休循
    fanyanna_fanyanna_wang: { generalId: 'fanyanna_fanyanna_wang', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // 梵衍那王率僧兵御大食
    kangju_chebishi: { generalId: 'kangju_chebishi', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // 石国王车鼻施康卡
    zhaowu_timuermieli: { generalId: 'zhaowu_timuermieli', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_01' }, // 忽毡英雄装甲战船抗蒙古
    qiepantuo_humi_wang: { generalId: 'qiepantuo_humi_wang', tier: 'ordinary', tacticalSkillId: 'ts_026' }, // 护密王守瓦罕走廊
    // ── 中国将·西域 2026-06-18 ──
    quli_chentang: { generalId: 'quli_chentang', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_11' }, // 建昭三年六校分道诛郅支于都赖水
    nandou_sushili: { generalId: 'nandou_sushili', tier: 'ordinary', tacticalSkillId: 'ts_037' }, // 小勃律王据守孽多
    unassigned_genggong: { generalId: 'unassigned_genggong', tier: 'famous', tacticalSkillId: 'ts_020', strategicSkillId: 'str_14' }, // 疏勒孤军苦撑
    juandu_peixingjian: { generalId: 'juandu_peixingjian', tier: 'famous', tacticalSkillId: 'ts_014', strategicSkillId: 'str_11' },
    
// ── 青藏区 2026-06-18 ──
    tubo_songzanganbu: { generalId: 'tubo_songzanganbu', tier: 'famous', tacticalSkillId: 'ts_070', strategicSkillId: 'str_10' }, // 兼并诸羌（统一青藏）
    song2_houjunji: { generalId: 'song2_houjunji', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_07' },
    gongbu_gongbumangbuzhi: { generalId: 'gongbu_gongbumangbuzhi', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 工布小王
    khon_basiba: { generalId: 'khon_basiba', tier: 'ordinary', tacticalSkillId: 'ts_014' }, // 萨迦帝师
    xiadun_xiazhongawanglangjie: { generalId: 'xiadun_xiazhongawanglangjie', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_10' }, // 不丹建国
    gar_lunqinling: { generalId: 'gar_lunqinling', tier: 'famous', tacticalSkillId: 'ts_086', strategicSkillId: 'str_10' }, // 以逸待劳
    duomi_lunkongre: { generalId: 'duomi_lunkongre', tier: 'ordinary', tacticalSkillId: 'ts_014' }, // 吐蕃末将
    dulan_dashibatuer: { generalId: 'dulan_dashibatuer', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 青海蒙古亲王
    tufa_d_tufanutan: { generalId: 'tufa_d_tufanutan', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_07' }, // 南凉君主
    qifu_d_qifuchipan: { generalId: 'qifu_d_qifuchipan', tier: 'famous', tacticalSkillId: 'ts_007', strategicSkillId: 'str_03' },
    tuyu_d_kualv: { generalId: 'tuyu_d_kualv', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_12' }, // 吐谷浑可汗
    dafeichuan_nuohebo: { generalId: 'dafeichuan_nuohebo', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 吐谷浑末代可汗
    gaxa_zhashiduanzhubu: { generalId: 'gaxa_zhashiduanzhubu', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 噶厦代本
    jinchuan_g_shaluoben: { generalId: 'jinchuan_g_shaluoben', tier: 'famous', tacticalSkillId: 'ts_037', strategicSkillId: 'str_14' }, // 金川固守
    xiangxiong_limixia_x: { generalId: 'xiangxiong_limixia_x', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // 象雄末王
    ladakh_senggelangjie: { generalId: 'ladakh_senggelangjie', tier: 'famous', tacticalSkillId: 'ts_024', strategicSkillId: 'str_10' }, // 拉达克王
    khoshut_gushihan: { generalId: 'khoshut_gushihan', tier: 'famous', tacticalSkillId: 'ts_071', strategicSkillId: 'str_10' }, // 锐不可当（和硕特入藏）
    nvguo_mojie: { generalId: 'nvguo_mojie', tier: 'ordinary', tacticalSkillId: 'ts_026' }, // 女国女王
    karmapa_queyingduoji: { generalId: 'karmapa_queyingduoji', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // 噶玛巴活佛
    xianlingqiang_dianling: { generalId: 'xianlingqiang_dianling', tier: 'ordinary', tacticalSkillId: 'ts_011' },
    lang_clan_jiangqujianzan: { generalId: 'lang_clan_jiangqujianzan', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_10' }, // 帕竹立国
    xiutu_xiutuwang: { generalId: 'xiutu_xiutuwang', tier: 'ordinary', tacticalSkillId: 'ts_014' }, // 休屠王
    gandenpozhang_dibasangjiejiacuo: { generalId: 'gandenpozhang_dibasangjiejiacuo', tier: 'ordinary', tacticalSkillId: 'ts_024' },    khyungpo_qiongbobangse: { generalId: 'khyungpo_qiongbobangse', tier: 'famous', tacticalSkillId: 'ts_015', strategicSkillId: 'str_11' }, // 吐蕃大论
    gar_kham_dengbazeren: { generalId: 'gar_kham_dengbazeren', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // 德格土司
    lanzhou_zhaochongguo: { generalId: 'lanzhou_zhaochongguo', tier: 'famous', tacticalSkillId: 'ts_019', strategicSkillId: 'str_14' },
    supi_xinuoluo: { generalId: 'supi_xinuoluo', tier: 'ordinary', tacticalSkillId: 'ts_024' }, // 苏毗附唐
    tsangpa_pengcuonanjie: { generalId: 'tsangpa_pengcuonanjie', tier: 'famous', tacticalSkillId: 'ts_029', strategicSkillId: 'str_01' }, // 藏巴汗立国
    spurgyal_dariniansai: { generalId: 'spurgyal_dariniansai', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // 悉补野奠基
    galangdiba_wangqindundui: { generalId: 'galangdiba_wangqindundui', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // 波密抗清
    fuguo_yizeng: { generalId: 'fuguo_yizeng', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // 附国王
    bailang_tangzeng: { generalId: 'bailang_tangzeng', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 白狼王
    humi_humiwang: { generalId: 'humi_humiwang', tier: 'ordinary', tacticalSkillId: 'ts_026' }, // 护密王
    xiaobolu_meijinmang: { generalId: 'xiaobolu_meijinmang', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_10' }, // 小勃律破吐蕃
    guge_chizhaxichabade: { generalId: 'guge_chizhaxichabade', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // 古格末王
    // ── 滇缅区 2026-06-18 ──
    pazhu_redangunsangpa: { generalId: 'pazhu_redangunsangpa', tier: 'ordinary', tacticalSkillId: 'ts_014' },
    chenla_sheyebamoqishi: { generalId: 'chenla_sheyebamoqishi', tier: 'famous', tacticalSkillId: 'ts_129', strategicSkillId: 'str_10' }, // 驱逐占婆收复吴哥
    dali_duansiping: { generalId: 'dali_duansiping', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_11' }, // 灭大义宁建大理
    dongxu_mangruiti: { generalId: 'dongxu_mangruiti', tier: 'famous', tacticalSkillId: 'ts_007', strategicSkillId: 'str_13' }, // 统一缅甸中南部
    mu_lijiang_muzeng: { generalId: 'mu_lijiang_muzeng', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 木天王拓土
    dianguo_zhuangqiao: { generalId: 'dianguo_zhuangqiao', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_10' },
    konbaung_yongjiya: { generalId: 'konbaung_yongjiya', tier: 'famous', tacticalSkillId: 'ts_009', strategicSkillId: 'str_15' },    nanzhao_geluofeng: { generalId: 'nanzhao_geluofeng', tier: 'famous', tacticalSkillId: 'ts_020', strategicSkillId: 'str_10' }, // 天宝战争击唐
    wuman_cuanguiwang: { generalId: 'wuman_cuanguiwang', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // 东爨乌蛮首领
    dai_daoyingmeng: { generalId: 'dai_daoyingmeng', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // 车里宣慰征缅
    taiyuan_manglai: { generalId: 'taiyuan_manglai', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_14' }, // 兰纳灭哈里奔猜
    suke_langanheng: { generalId: 'suke_langanheng', tier: 'famous', tacticalSkillId: 'ts_014', strategicSkillId: 'str_07' }, // 素可泰扩张
    luchuan_sirenfa: { generalId: 'luchuan_sirenfa', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_10' }, // 麓川大败明军
    kunming_yi_lucheng: { generalId: 'kunming_yi_lucheng', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 昆明夷斩类牢
    cuanshi_cuanlongyan: { generalId: 'cuanshi_cuanlongyan', tier: 'ordinary', tacticalSkillId: 'ts_024' }, // 爨氏镇南中
    baiman_gaoshengtai: { generalId: 'baiman_gaoshengtai', tier: 'ordinary', tacticalSkillId: 'ts_024' }, // 大理权相
    champa_zhipenge: { generalId: 'champa_zhipenge', tier: 'famous', tacticalSkillId: 'ts_028', strategicSkillId: 'str_01' }, // 占婆水师破越
    qiong_rengui: { generalId: 'qiong_rengui', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // 邛谷王据郡
    hantawadi_mangyinglong: { generalId: 'hantawadi_mangyinglong', tier: 'famous', tacticalSkillId: 'ts_142', strategicSkillId: 'str_12' }, // 东吁帝国鼎盛
    daozhou_yangzaixing: { generalId: 'daozhou_yangzaixing', tier: 'famous', tacticalSkillId: 'ts_007', strategicSkillId: 'str_11' }, // 麦岭关
  // ── 岭南/越南/台湾区 2026-06-18 ──
    guangzhou_liuyin: { generalId: 'guangzhou_liuyin', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_10' }, // 清海军节度岭南
    luoping_zhangshijie: { generalId: 'luoping_zhangshijie', tier: 'famous', tacticalSkillId: 'ts_034', strategicSkillId: 'str_10' }, // 崖山海战
    chaozhou_d_mafa: { generalId: 'chaozhou_d_mafa', tier: 'ordinary', tacticalSkillId: 'ts_024' }, // 马发潮州
    chendiaoyan_chendiaoyan: { generalId: 'chendiaoyan_chendiaoyan', tier: 'ordinary', tacticalSkillId: 'ts_014' }, // 漳州抗元
    dengmaoqi_dengmaoqi: { generalId: 'dengmaoqi_dengmaoqi', tier: 'ordinary', tacticalSkillId: 'ts_035' }, // 铲平王起义
    geng_gengjingzhong: { generalId: 'geng_gengjingzhong', tier: 'ordinary', tacticalSkillId: 'ts_024' }, // 靖南王叛清
    longwu_huangdaozhou: { generalId: 'longwu_huangdaozhou', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // 隆武抗清
    jing_dingbuling: { generalId: 'jing_dingbuling', tier: 'famous', tacticalSkillId: 'ts_011', strategicSkillId: 'str_12' }, // 丁朝统一
    paiwan_alugu: { generalId: 'paiwan_alugu', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // 牡丹社抗倭
    ming_zheng_zhengchenggong: { generalId: 'ming_zheng_zhengchenggong', tier: 'famous', tacticalSkillId: 'ts_085', strategicSkillId: 'str_13' },
    unassigned_ruanhuang: { generalId: 'unassigned_ruanhuang', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_10' }, // 广南奠基
    zhuang_d_washifuren: { generalId: 'zhuang_d_washifuren', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_15' }, // 俍兵抗倭
    nanyue_zhaotuo: { generalId: 'nanyue_zhaotuo', tier: 'famous', tacticalSkillId: 'ts_014', strategicSkillId: 'str_14' },
    zhancheng_zhimin: { generalId: 'zhancheng_zhimin', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 占城王和亲
    xiou_yixusong: { generalId: 'xiou_yixusong', tier: 'ordinary', tacticalSkillId: 'ts_035' }, // 西瓯抗秦
    gouding_wubo: { generalId: 'gouding_wubo', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 句町助汉
    chen_chenbaxian: { generalId: 'chen_chenbaxian', tier: 'famous', tacticalSkillId: 'ts_006', strategicSkillId: 'str_07' },
    dayu_wangshouren: { generalId: 'dayu_wangshouren', tier: 'famous', tacticalSkillId: 'ts_014', strategicSkillId: 'str_10' }, // 平定南赣
    paiyao_huanggua4: { generalId: 'paiyao_huanggua4', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 排瑶起义
    yingzhou_liulong_ying: { generalId: 'yingzhou_liulong_ying', tier: 'famous', tacticalSkillId: 'ts_024', strategicSkillId: 'str_12' }, // 南汉高祖
    linyi_fanyangmai: { generalId: 'linyi_fanyangmai', tier: 'ordinary', tacticalSkillId: 'ts_026' }, // 林邑王抗南朝
    xian_d_xianfuren: { generalId: 'xian_d_xianfuren', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_10' }, // 俚人平定岭南
    luodian_shexiang: { generalId: 'luodian_shexiang', tier: 'ordinary', tacticalSkillId: 'ts_035' }, // 水西土司
    nong2_nongzhigao: { generalId: 'nong2_nongzhigao', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // 侬峒反宋
    guizhou_lidingguo: { generalId: 'guizhou_lidingguo', tier: 'famous', tacticalSkillId: 'ts_079', strategicSkillId: 'str_10' }, // 两蹶名王
    taiping_shidakai: { generalId: 'taiping_shidakai', tier: 'famous', tacticalSkillId: 'ts_075', strategicSkillId: 'str_13' }, // 出没如神（翼王征战）
    dongzu_wumian: { generalId: 'dongzu_wumian', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // 侗族起义
    tian_sizhou_tianyougong: { generalId: 'tian_sizhou_tianyougong', tier: 'ordinary', tacticalSkillId: 'ts_035' }, // 思州土官
    luoyue_zhengce: { generalId: 'luoyue_zhengce', tier: 'ordinary', tacticalSkillId: 'ts_035' }, // 骆越反汉
    li_s_mayuan: { generalId: 'li_s_mayuan', tier: 'famous', tacticalSkillId: 'ts_007', strategicSkillId: 'str_15' },
    leloi: { generalId: 'leloi', tier: 'famous', tacticalSkillId: 'ts_073', strategicSkillId: 'str_07' }, // 以弱敌强（黎利抗明）
    dacheng_chenkai: { generalId: 'dacheng_chenkai', tier: 'ordinary', tacticalSkillId: 'ts_035' }, // 大成国起义
    dayue_chenguojun: { generalId: 'dayue_chenguojun', tier: 'famous', tacticalSkillId: 'ts_061', strategicSkillId: 'str_12' }, // 以短制长（白藤江抗蒙三捷开局削兵）
    shengmiao_baoli_miao: { generalId: 'shengmiao_baoli_miao', tier: 'ordinary', tacticalSkillId: 'ts_024' }, // 苗民起义
    miao_qing_yangwanzhe: { generalId: 'miao_qing_yangwanzhe', tier: 'ordinary', tacticalSkillId: 'ts_026' }, // 苗军统帅
    unassigned_zhuyoulang: { generalId: 'unassigned_zhuyoulang', tier: 'ordinary', tacticalSkillId: 'ts_035' }, // 永历帝抗清
    xinjiang_maji: { generalId: 'xinjiang_maji', tier: 'ordinary', tacticalSkillId: 'ts_033' }, // 肇庆摧锋军抗元
    liren_funanshe: { generalId: 'liren_funanshe', tier: 'ordinary', tacticalSkillId: 'ts_035' }, // 黎族起义
    unassigned_liuyongfu: { generalId: 'unassigned_liuyongfu', tier: 'famous', tacticalSkillId: 'ts_017', strategicSkillId: 'str_10' }, // 黑旗抗法·丛林山地游击
    yelang_duotong: { generalId: 'yelang_duotong', tier: 'ordinary', tacticalSkillId: 'ts_001' }, // 夜郎王
    zangke_xielongyu: { generalId: 'zangke_xielongyu', tier: 'ordinary', tacticalSkillId: 'ts_024' }, // 牂牁归唐
    xinggu_cuanxi: { generalId: 'xinggu_cuanxi', tier: 'ordinary', tacticalSkillId: 'ts_026' }, // 兴古从征
    guangxin_shixie: { generalId: 'guangxin_shixie', tier: 'ordinary', tacticalSkillId: 'ts_001' }, // 交趾割据
    ryukyu_shangbazhi: { generalId: 'ryukyu_shangbazhi', tier: 'famous', tacticalSkillId: 'ts_007', strategicSkillId: 'str_10' }, // 琉球三山统一
    shaozhou_zhangzhensun: { generalId: 'shaozhou_zhangzhensun', tier: 'ordinary', tacticalSkillId: 'ts_038' }, // 韶关抗元·大庾岭殉国
    shixing_houandou: { generalId: 'shixing_houandou', tier: 'famous', tacticalSkillId: 'ts_007', strategicSkillId: 'str_13' }, // 陈朝开国元勋
    buyi_d_weichaoyuan: { generalId: 'buyi_d_weichaoyuan', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // 布依起义
    lizhou_d_liaohua: { generalId: 'lizhou_d_liaohua', tier: 'ordinary', tacticalSkillId: 'ts_014' }, // 廖化置死地
    kui_gongsunshu: { generalId: 'kui_gongsunshu', tier: 'ordinary', tacticalSkillId: 'ts_031' }, // 公孙述白帝
    yang_bozhou_yangyinglong: { generalId: 'yang_bozhou_yangyinglong', tier: 'ordinary', tacticalSkillId: 'ts_026' }, // 播州末代
    chenghan_lite: { generalId: 'chenghan_lite', tier: 'famous', tacticalSkillId: 'ts_143', strategicSkillId: 'str_15' }, // 成汉开国
    agui: { generalId: 'agui', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_13' },    zuo_d_wufu_zd: { generalId: 'zuo_d_wufu_zd', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 明代平南中
    wumeng_azi_wm: { generalId: 'wumeng_azi_wm', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 乌蒙土司
// ── 巴蜀区 2026-06-18 ──
      huizhou_zhugeliang: { generalId: 'huizhou_zhugeliang', tier: 'famous', tacticalSkillId: 'ts_159', strategicSkillId: 'str_14' }, // 诸葛亮六出祁山·八阵图（空城退敌）
      wudu_zhangyi: { generalId: 'wudu_zhangyi', tier: 'famous', tacticalSkillId: 'ts_162', strategicSkillId: 'str_01' },
      baishui_yanghuai: { generalId: 'baishui_yanghuai', tier: 'ordinary', tacticalSkillId: 'ts_014' },
      dangzhou_dengai: { generalId: 'dangzhou_dengai', tier: 'famous', tacticalSkillId: 'ts_046', strategicSkillId: 'str_10' },
    unassigned_zhuran: { generalId: 'unassigned_zhuran', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_14' }, // 江陵守·名震敌国
    shu_liubei: { generalId: 'shu_liubei', tier: 'famous', tacticalSkillId: 'ts_168', strategicSkillId: 'str_07' }, // 刘备成都
    unassigned_weiyan: { generalId: 'unassigned_weiyan', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_14' }, // 略阳阳溪守汉中
    fengzhou_wujie: { generalId: 'fengzhou_wujie', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_14' }, // 和尚原仙人关守蜀口
    unassigned_baochao: { generalId: 'unassigned_baochao', tier: 'famous', tacticalSkillId: 'ts_020', strategicSkillId: 'str_12' }, // 霆军以寡击众
    qinghai_yuezhongqi: { generalId: 'qinghai_yuezhongqi', tier: 'famous', tacticalSkillId: 'ts_007', strategicSkillId: 'str_13' },
    tujia_d_qinliangyu: { generalId: 'tujia_d_qinliangyu', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_10' }, // 白杆兵抗清
    shuixi_anbangyan: { generalId: 'shuixi_anbangyan', tier: 'ordinary', tacticalSkillId: 'ts_029' }, // 奢安之乱
    chu_guanyu: { generalId: 'chu_guanyu', tier: 'famous', tacticalSkillId: 'ts_010', strategicSkillId: 'str_12' },
    xiangzhou_lvwenhuan: { generalId: 'xiangzhou_lvwenhuan', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_14' },
    guo_jixin: { generalId: 'guo_jixin', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // 荥阳诳楚
    unassigned_lidingguo_dx: { generalId: 'unassigned_lidingguo_dx', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 大西抗清
    zi_changhong: { generalId: 'zi_changhong', tier: 'ordinary', tacticalSkillId: 'ts_035' }, // 资中先贤
    yidou_luxun: { generalId: 'yidou_luxun', tier: 'famous', tacticalSkillId: 'ts_030', strategicSkillId: 'str_01' }, // 夷陵火攻
    unassigned_xiangyan: { generalId: 'unassigned_xiangyan', tier: 'famous', tacticalSkillId: 'ts_007', strategicSkillId: 'str_03' }, // 楚将破李信
    zhongxiang_ganning: { generalId: 'zhongxiang_ganning', tier: 'famous', tacticalSkillId: 'ts_180', strategicSkillId: 'str_10' },    hezhou_wangjian_dy: { generalId: 'hezhou_wangjian_dy', tier: 'famous', tacticalSkillId: 'ts_144', strategicSkillId: 'str_14' }, // 钓鱼城炮击蒙哥·守城36年
    qiuchi_yangnandang: { generalId: 'qiuchi_yangnandang', tier: 'famous', tacticalSkillId: 'ts_007', strategicSkillId: 'str_10' },
    cong_puhu: { generalId: 'cong_puhu', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 宕渠賨人随张飞
    langzhou_zhangfei: { generalId: 'langzhou_zhangfei', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_11' },
    tan_d_tanhou: { generalId: 'tan_d_tanhou', tier: 'ordinary', tacticalSkillId: 'ts_035' }, // 土司起义
    xiang_d_xiangdakun: { generalId: 'xiang_d_xiangdakun', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 向王天子
    unassigned_tanhou_td: { generalId: 'unassigned_tanhou_td', tier: 'ordinary', tacticalSkillId: 'ts_035' }, // 慈利土司
    ran_d_ranshouzhong: { generalId: 'ran_d_ranshouzhong', tier: 'ordinary', tacticalSkillId: 'ts_014' }, // 酉阳土司
    wuxi_shamoke: { generalId: 'wuxi_shamoke', tier: 'ordinary', tacticalSkillId: 'ts_011' },    kuai_kuaiyue: { generalId: 'kuai_kuaiyue', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 蒯氏谋士
    bandun_fanmu: { generalId: 'bandun_fanmu', tier: 'ordinary', tacticalSkillId: 'ts_024' }, // 板楯助汉
    she_shechongming: { generalId: 'she_shechongming', tier: 'famous', tacticalSkillId: 'ts_011', strategicSkillId: 'str_15' }, // 叙永奢崇明起兵反明
    boren_ada: { generalId: 'boren_ada', tier: 'ordinary', tacticalSkillId: 'ts_035' }, // 僰人末代
    unassigned_chendao: { generalId: 'unassigned_chendao', tier: 'ordinary', tacticalSkillId: 'ts_031', strategicSkillId: 'str_07' }, // 白毦兵断后
    unassigned_luoshao: { generalId: 'unassigned_luoshao', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 乌蒙土官
    jingmen_zhaoyun: { generalId: 'jingmen_zhaoyun', tier: 'famous', tacticalSkillId: 'ts_011', strategicSkillId: 'str_15' }, // 长坂坡救主（绝地反击）
    unassigned_pengshichou: { generalId: 'unassigned_pengshichou', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 溪州铜柱
    xidong_mayuan: { generalId: 'xidong_mayuan', tier: 'famous', tacticalSkillId: 'ts_178', strategicSkillId: 'str_13' }, // 马援·聚米为山谷指画形势（后汉书本人典故）；伏波将军远征交趾五溪以战养战
    miaomin_shiliudeng: { generalId: 'miaomin_shiliudeng', tier: 'ordinary', tacticalSkillId: 'ts_026' }, // 苗民起义
    xiqin_xuerengao: { generalId: 'xiqin_xuerengao', tier: 'famous', tacticalSkillId: 'ts_007', strategicSkillId: 'str_15' },    beidi_sunang: { generalId: 'beidi_sunang', tier: 'ordinary', tacticalSkillId: 'ts_015' },    baiyang_mengtian: { generalId: 'baiyang_mengtian', tier: 'ordinary', tacticalSkillId: 'ts_033' }, // 高阙塞长城戍守
  // ── 河西区 2026-06-18 ──
    didao_duanjiong: { generalId: 'didao_duanjiong', tier: 'famous', tacticalSkillId: 'ts_122', strategicSkillId: 'str_10' },    suzhou_huoqubing: { generalId: 'suzhou_huoqubing', tier: 'famous', tacticalSkillId: 'ts_052', strategicSkillId: 'str_01' }, // 封狼居胥（大纵深穿插闪电战）
    liangzhou_zhanggui: { generalId: 'liangzhou_zhanggui', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_13' },
    unassigned_lihao_dunhuang: { generalId: 'unassigned_lihao_dunhuang', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_15' }, // 西凉开国
    unassigned_xinqingji: { generalId: 'unassigned_xinqingji', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_11' }, // 破羌将军
    dashun_lizicheng: { generalId: 'dashun_lizicheng', tier: 'famous', tacticalSkillId: 'ts_111', strategicSkillId: 'str_11' }, // 大顺灭明
    zhai_han_diqing: { generalId: 'zhai_han_diqing', tier: 'famous', tacticalSkillId: 'ts_112', strategicSkillId: 'str_07' },    ganzhou_dourong: { generalId: 'ganzhou_dourong', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_12' },    unassigned_zhaoponu: { generalId: 'unassigned_zhaoponu', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_13' }, // 破楼兰
    shazhou_zhangyichao: { generalId: 'shazhou_zhangyichao', tier: 'famous', tacticalSkillId: 'ts_113', strategicSkillId: 'str_10' }, // 归义收复河西
    guiyi_caoyijin: { generalId: 'guiyi_caoyijin', tier: 'ordinary', tacticalSkillId: 'ts_024' },
    unassigned_lisheng_tang: { generalId: 'unassigned_lisheng_tang', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_11' }, // 神策平泾原
    unassigned_chuliji: { generalId: 'unassigned_chuliji', tier: 'famous', tacticalSkillId: 'ts_033', strategicSkillId: 'str_10' }, // 崤函据守
    helian_helianbobo: { generalId: 'helian_helianbobo', tier: 'famous', tacticalSkillId: 'ts_007', strategicSkillId: 'str_14' }, // 统万城阳武
    chile_hulvjin: { generalId: 'chile_hulvjin', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_07' },    chijin_qiewangshijia: { generalId: 'chijin_qiewangshijia', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 赤斤蒙古卫
    shuofang_weiqing: { generalId: 'shuofang_weiqing', tier: 'famous', tacticalSkillId: 'ts_009', strategicSkillId: 'str_11' }, // 取河南地
    woye_huangfugui: { generalId: 'woye_huangfugui', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_12' }, // 度辽将军平羌
    yeli_yeliwangrong: { generalId: 'yeli_yeliwangrong', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 定川寨破宋
    hunxie_hunxiewang: { generalId: 'hunxie_hunxiewang', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 浑邪降汉
    guazhou_zhangshougui: { generalId: 'guazhou_zhangshougui', tier: 'famous', tacticalSkillId: 'ts_048', strategicSkillId: 'str_14' }, // 瓜州空城破吐蕃
    kang_liangshidu: { generalId: 'kang_liangshidu', tier: 'ordinary', tacticalSkillId: 'ts_024' }, // 梁帝割据
    yingli_jilasiyi: { generalId: 'yingli_jilasiyi', tier: 'ordinary', tacticalSkillId: 'ts_026' }, // 守应理抗蒙
    dangxiang_liyuanhao: { generalId: 'dangxiang_liyuanhao', tier: 'famous', tacticalSkillId: 'ts_024', strategicSkillId: 'str_01' }, // 好水川大捷
    huizhou_yaodui: { generalId: 'huizhou_yaodui', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_10' }, // 会州箭贯耳
    huan_zhongshidao: { generalId: 'huan_zhongshidao', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_14' }, // 种家将守边
    wei2_hunjian: { generalId: 'wei2_hunjian', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_10' }, // 朔方破吐蕃
    lingwu_guoziyi: { generalId: 'lingwu_guoziyi', tier: 'famous', tacticalSkillId: 'ts_036', strategicSkillId: 'str_13' },
    dingxiang_d_lijing: { generalId: 'dingxiang_d_lijing', tier: 'famous', tacticalSkillId: 'ts_056', strategicSkillId: 'str_10' }, // 乘夜掩至（李靖率三千骑雪夜袭定襄）
    xiayang_d_dengyu: { generalId: 'xiayang_d_dengyu', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_07' },
    ningkou_lubode: { generalId: 'ningkou_lubode', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_14' },    unassigned_liuquan: { generalId: 'unassigned_liuquan', tier: 'ordinary', tacticalSkillId: 'ts_031' }, // 隋破吐谷浑、河源积石屯田（《隋书·刘权传》）
    juqu_d_juqumengxun: { generalId: 'juqu_d_juqumengxun', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_11' }, // 北凉灭西凉
    // ── 中原区 2026-06-18 ──
    li_lx_d_lichong: { generalId: 'li_lx_d_lichong', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_01' },    sunqin_sunchuanting: { generalId: 'sunqin_sunchuanting', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_14' }, // 潼关抗李自成
    tianxiong_tianchengsi: { generalId: 'tianxiong_tianchengsi', tier: 'famous', tacticalSkillId: 'ts_145', strategicSkillId: 'str_15' }, // 魏博藩镇
    ranwei_d_ranmin: { generalId: 'ranwei_d_ranmin', tier: 'famous', tacticalSkillId: 'ts_003', strategicSkillId: 'str_07' }, // 杀胡令
    jin_xianzhen: { generalId: 'jin_xianzhen', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_12' }, // 城濮崤山
    jingzhou_gs_huangfusong: { generalId: 'jingzhou_gs_huangfusong', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_12' },
    unassigned_masui: { generalId: 'unassigned_masui', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 洹水破田悦
    wang_d_wangdao: { generalId: 'wang_d_wangdao', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // 王与马共天下
    chimei_fanchong: { generalId: 'chimei_fanchong', tier: 'famous', tacticalSkillId: 'ts_074', strategicSkillId: 'str_13' }, // 前无坚阵（赤眉入长安）
    zhengzhou_chenqingzhi: { generalId: 'zhengzhou_chenqingzhi', tier: 'famous', tacticalSkillId: 'ts_163', strategicSkillId: 'str_15' }, // 七千白袍入洛阳
    xichu_xiangyu: { generalId: 'xichu_xiangyu', tier: 'famous', tacticalSkillId: 'ts_012', strategicSkillId: 'str_03' }, // 破釜沉舟（巨鹿之战）
    wazhai_limi_wz: { generalId: 'wazhai_limi_wz', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_07' },    jiaodong_tiandan: { generalId: 'jiaodong_tiandan', tier: 'famous', tacticalSkillId: 'ts_164', strategicSkillId: 'str_01' }, // 田单·纵反间于燕使骑劫代乐毅，即墨火牛破燕（以子之矛·反用敌计）
    jibei_xuxuan_cm: { generalId: 'jibei_xuxuan_cm', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // 赤眉丞相
    qi_qihuangong: { generalId: 'qi_qihuangong', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_15' }, // 尊王攘夷·九合诸侯
    huaiyang_zhouyafu: { generalId: 'huaiyang_zhouyafu', tier: 'famous', tacticalSkillId: 'ts_014', strategicSkillId: 'str_14' }, // 坚壁不出平七国
    yingzhou_d_liuqi: { generalId: 'yingzhou_d_liuqi', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_11' }, // 顺昌破金
    cao_d_caocao: { generalId: 'cao_d_caocao', tier: 'famous', tacticalSkillId: 'ts_107', strategicSkillId: 'str_07' }, // 曹操·官渡纳许攸计烧乌巢断粮、渭南离间马超韩遂（将计就计·反用敌谋）
    bozhou_d_yujin: { generalId: 'bozhou_d_yujin', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_14' }, // 于禁·五子良将假节钺·治军精整
    long2_weixiaokuan: { generalId: 'long2_weixiaokuan', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_14' }, // 玉壁之战·气死高欢
    dongxian_sunbin: { generalId: 'dongxian_sunbin', tier: 'famous', tacticalSkillId: 'ts_165', strategicSkillId: 'str_11' },    mi_mizhu: { generalId: 'mi_mizhu', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // 资助刘备
    baibo_guotai_bb: { generalId: 'baibo_guotai_bb', tier: 'ordinary', tacticalSkillId: 'ts_035' }, // 白波军
    unassigned_geshuhan: { generalId: 'unassigned_geshuhan', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_14' }, // 潼关守将
    shanzhou_wangzhongsi: { generalId: 'shanzhou_wangzhongsi', tier: 'famous', tacticalSkillId: 'ts_007', strategicSkillId: 'str_14' }, // 王忠嗣·青海湖大破吐蕃；四镇节度使养强边军
    weizhou_weigao: { generalId: 'weizhou_weigao', tier: 'famous', tacticalSkillId: 'ts_010', strategicSkillId: 'str_14' }, // 韦皋·神川擒论莽热·经营剑南
    ruzhou_sunjian: { generalId: 'ruzhou_sunjian', tier: 'famous', tacticalSkillId: 'ts_029', strategicSkillId: 'str_11' }, // 江东猛虎·破虏将军（肉薄骨并）
    yaozhou_limaozhen: { generalId: 'yaozhou_limaozhen', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 岐国军阀
    jiyuan_huluguang: { generalId: 'jiyuan_huluguang', tier: 'famous', tacticalSkillId: 'ts_014', strategicSkillId: 'str_12' }, // 斛律光 落雕都督
    yiyang_d_mengzongzheng: { generalId: 'yiyang_d_mengzongzheng', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_13' }, // 三关之捷
    wuwu_d_lvmeng: { generalId: 'wuwu_d_lvmeng', tier: 'famous', tacticalSkillId: 'ts_078', strategicSkillId: 'str_10' }, // 白衣渡江
    li_bian: { generalId: 'li_bian', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_14' }, // 南唐烈祖，保境息民，固若金汤
    yangshao_zhoubo: { generalId: 'yangshao_zhoubo', tier: 'famous', tacticalSkillId: 'ts_014', strategicSkillId: 'str_14' }, // 诛诸吕安刘氏固若金汤
    unassigned_liuyan_ly: { generalId: 'unassigned_liuyan_ly', tier: 'famous', tacticalSkillId: 'ts_007', strategicSkillId: 'str_11' }, // 舂陵起兵
    zhou_jifa: { generalId: 'zhou_jifa', tier: 'famous', tacticalSkillId: 'ts_117', strategicSkillId: 'str_12' }, // 武王伐纣
    quanrong_quanrongwang: { generalId: 'quanrong_quanrongwang', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // 犬戎弑幽王
    unassigned_chairong: { generalId: 'unassigned_chairong', tier: 'famous', tacticalSkillId: 'ts_007', strategicSkillId: 'str_01' }, // 高平之战·殿前诸班
    song_zhaokuangyin: { generalId: 'song_zhaokuangyin', tier: 'famous', tacticalSkillId: 'ts_011', strategicSkillId: 'str_14' },
    ruo_wangjian: { generalId: 'ruo_wangjian', tier: 'famous', tacticalSkillId: 'ts_108', strategicSkillId: 'str_03' }, // 王翦灭楚稳扎稳打少损（兵不血刃）    unassigned_luhunrongwang: { generalId: 'unassigned_luhunrongwang', tier: 'ordinary', tacticalSkillId: 'ts_014' }, // 陆浑戎
    sizhou_hanshizhong: { generalId: 'sizhou_hanshizhong', tier: 'famous', tacticalSkillId: 'ts_170', strategicSkillId: 'str_13' }, // 黄天荡
    yin_dixin: { generalId: 'yin_dixin', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // 纣王征东夷
    liwang_liguangbi: { generalId: 'liwang_liguangbi', tier: 'famous', tacticalSkillId: 'ts_041', strategicSkillId: 'str_14' },
    han_baoyuan_han: { generalId: 'han_baoyuan_han', tier: 'ordinary', tacticalSkillId: 'ts_014' }, // 韩将暴鸢
    bailian_wangconger: { generalId: 'bailian_wangconger', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // 白莲教起义
    shen_shenbo: { generalId: 'shen_shenbo', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // 申国受封
    sima_d_simayi: { generalId: 'sima_d_simayi', tier: 'famous', tacticalSkillId: 'ts_014', strategicSkillId: 'str_14' },
    unassigned_zhaoshe: { generalId: 'unassigned_zhaoshe', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_07' }, // 阏与之战
    huai_zhuyuanzhang: { generalId: 'huai_zhuyuanzhang', tier: 'famous', tacticalSkillId: 'ts_014', strategicSkillId: 'str_11' }, // 洪武大帝
    shangzhou_shangyang: { generalId: 'shangzhou_shangyang', tier: 'ordinary', tacticalSkillId: 'ts_024' }, // 商鞅变法
    yue_d_yuefei: { generalId: 'yue_d_yuefei', tier: 'famous', tacticalSkillId: 'ts_092', strategicSkillId: 'str_03' },
    unassigned_yuanshao: { generalId: 'unassigned_yuanshao', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_12' }, // 四世三公
    xinping_haozhao: { generalId: 'xinping_haozhao', tier: 'famous', tacticalSkillId: 'ts_034', strategicSkillId: 'str_14' }, // 陈仓守城·拒诸葛亮
    yuzhou_zuti: { generalId: 'yuzhou_zuti', tier: 'famous', tacticalSkillId: 'ts_004', strategicSkillId: 'str_15' },
    mengcheng_d_gaoqiong: { generalId: 'mengcheng_d_gaoqiong', tier: 'ordinary', tacticalSkillId: 'ts_035' }, // 澶渊主战
    liang_d_zhangxun: { generalId: 'liang_d_zhangxun', tier: 'famous', tacticalSkillId: 'ts_167', strategicSkillId: 'str_14' }, // 睢阳守城·杀妾犒军
    lulin_liuxiu: { generalId: 'lulin_liuxiu', tier: 'famous', tacticalSkillId: 'ts_054', strategicSkillId: 'str_13' }, // 流星坠营（昆阳之战位面之子干扰敌军）
    unassigned_fankuai: { generalId: 'unassigned_fankuai', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // 鸿门宴
    hao_d_changyuchun: { generalId: 'hao_d_changyuchun', tier: 'famous', tacticalSkillId: 'ts_049', strategicSkillId: 'str_14' },
    dang_d_zhuwen: { generalId: 'dang_d_zhuwen', tier: 'famous', tacticalSkillId: 'ts_007', strategicSkillId: 'str_07' }, // 后梁太祖
    // ── 北方区 2026-06-18 ──
    gongsun_d_gongsundu: { generalId: 'gongsun_d_gongsundu', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_14' }, // 辽东割据
    unassigned_yanganer2: { generalId: 'unassigned_yanganer2', tier: 'ordinary', tacticalSkillId: 'ts_026' }, // 红袄天顺
    xuan_mafang: { generalId: 'xuan_mafang', tier: 'famous', tacticalSkillId: 'ts_094', strategicSkillId: 'str_11' }, // 开国第一功臣
    tuoba_tuobagui: { generalId: 'tuoba_tuobagui', tier: 'famous', tacticalSkillId: 'ts_007', strategicSkillId: 'str_11' },
    bing_liukun: { generalId: 'bing_liukun', tier: 'famous', tacticalSkillId: 'ts_026', strategicSkillId: 'str_14' }, // 晋阳坚守（百折不挠）    unassigned_zhangrou: { generalId: 'unassigned_zhangrou', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // 保定重建
    qu_d_quyi: { generalId: 'qu_d_quyi', tier: 'famous', tacticalSkillId: 'ts_049', strategicSkillId: 'str_13' }, // 界桥先登破白马
    gaoqi_d_gaohuan: { generalId: 'gaoqi_d_gaohuan', tier: 'famous', tacticalSkillId: 'ts_007', strategicSkillId: 'str_15' }, // 神武帝
    pingyuan_yanzhenqing: { generalId: 'pingyuan_yanzhenqing', tier: 'ordinary', tacticalSkillId: 'ts_026' }, // 平原抗安史
    hejian_gongsunzan: { generalId: 'hejian_gongsunzan', tier: 'ordinary', tacticalSkillId: 'ts_029' }, // 白马义从
    linyu_wusangui: { generalId: 'linyu_wusangui', tier: 'famous', tacticalSkillId: 'ts_148', strategicSkillId: 'str_15' },
    unassigned_liangshidu_ls: { generalId: 'unassigned_liangshidu_ls', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 梁国割据
    liangshidu_longjia: { generalId: 'liangshidu_longjia', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // 雕阴抗秦兵败
    yangshe_yangshezhi: { generalId: 'yangshe_yangshezhi', tier: 'ordinary', tacticalSkillId: 'ts_041' }, // 铜鞮大夫
    guzhu_tianyu: { generalId: 'guzhu_tianyu', tier: 'ordinary', tacticalSkillId: 'ts_014' }, // 征北将军镇乌桓鲜卑
    dizhou_wangyanzhang: { generalId: 'dizhou_wangyanzhang', tier: 'famous', tacticalSkillId: 'ts_083', strategicSkillId: 'str_07' }, // 铁枪拔阵
    dai_d_shijingtang: { generalId: 'dai_d_shijingtang', tier: 'famous', tacticalSkillId: 'ts_007', strategicSkillId: 'str_01' }, // 兵贵神速+侵掠如火
    erzhu_erzhurong: { generalId: 'erzhu_erzhurong', tier: 'famous', tacticalSkillId: 'ts_063', strategicSkillId: 'str_11' }, // 所向摧陷（滏口七千破三十万）
    zhe_d_zheyuqing: { generalId: 'zhe_d_zheyuqing', tier: 'ordinary', tacticalSkillId: 'ts_035' }, // 子河汊破辽
    heng1_limu_yanyue: { generalId: 'heng1_limu_yanyue', tier: 'famous', tacticalSkillId: 'ts_110', strategicSkillId: 'str_12' }, // 李牧·雁门十余年料敌示弱，一战破匈奴十万（料敌机先·否决敌技）    yan_leyi: { generalId: 'yan_leyi', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_14' }, // 伐齐下七十城
    unassigned_zhongshiheng: { generalId: 'unassigned_zhongshiheng', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_14' }, // 环州筑城
    liguo_zhaoshe_zd: { generalId: 'liguo_zhaoshe_zd', tier: 'famous', tacticalSkillId: 'ts_035', strategicSkillId: 'str_10' }, // 阏与之战
    // ── 北方关隘 2026-06-19 ──
    yunzhong_tuobaliwei: { generalId: 'yunzhong_tuobaliwei', tier: 'ordinary', tacticalSkillId: 'ts_002' },
    you_wangba: { generalId: 'you_wangba', tier: 'ordinary', tacticalSkillId: 'ts_029' }, // 耿况上谷突骑
    unassigned_zhouyuji: { generalId: 'unassigned_zhouyuji', tier: 'famous', tacticalSkillId: 'ts_038', strategicSkillId: 'str_13' }, // 宁武殉国
    yi_yuqian: { generalId: 'yi_yuqian', tier: 'famous', tacticalSkillId: 'ts_166', strategicSkillId: 'str_14' }, // 京师保卫战·固若金汤
    huo_songlaosheng: { generalId: 'huo_songlaosheng', tier: 'ordinary', tacticalSkillId: 'ts_016' }, // 宋老生霍邑
    // ── 江南区 2026-06-18 ──
    wuling_xiangdancheng: { generalId: 'wuling_xiangdancheng', tier: 'ordinary', tacticalSkillId: 'ts_011' },
    suzhou_d_shikefa: { generalId: 'suzhou_d_shikefa', tier: 'famous', tacticalSkillId: 'ts_039', strategicSkillId: 'str_14' },
    jiujiang_zhouyu: { generalId: 'jiujiang_zhouyu', tier: 'famous', tacticalSkillId: 'ts_030', strategicSkillId: 'str_15' }, // 赤壁火攻
    fangla_fangla_jn: { generalId: 'fangla_fangla_jn', tier: 'ordinary', tacticalSkillId: 'ts_011' },    fang_guozhen_fangguozhen: { generalId: 'fang_guozhen_fangguozhen', tier: 'ordinary', tacticalSkillId: 'ts_014' }, // 方国珍割据浙东
    ouyue_zouyao: { generalId: 'ouyue_zouyao', tier: 'ordinary', tacticalSkillId: 'ts_016' }, // 东瓯王
    ruochu_doulian: { generalId: 'ruochu_doulian', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 若敖夜袭
    mi_chu_chuzhuangwang: { generalId: 'mi_chu_chuzhuangwang', tier: 'famous', tacticalSkillId: 'ts_026', strategicSkillId: 'str_07' }, // 邲之战
    unassigned_luxun_sunwu: { generalId: 'unassigned_luxun_sunwu', tier: 'famous', tacticalSkillId: 'ts_030', strategicSkillId: 'str_14' }, // 夷陵火攻·江陵镇守
    yue_goujian: { generalId: 'yue_goujian', tier: 'famous', tacticalSkillId: 'ts_177', strategicSkillId: 'str_13' }, // 卧薪尝胆
    heng_hetengjiao: { generalId: 'heng_hetengjiao', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // 衡州抗清
    xushouhui_zhaopusheng: { generalId: 'xushouhui_zhaopusheng', tier: 'ordinary', tacticalSkillId: 'ts_035' },
    lu_zhangliao: { generalId: 'lu_zhangliao', tier: 'famous', tacticalSkillId: 'ts_161', strategicSkillId: 'str_11' }, // 逍遥津之战（以寡击众）
    sui_yangjian: { generalId: 'sui_yangjian', tier: 'famous', tacticalSkillId: 'ts_118', strategicSkillId: 'str_11' }, // 隋文帝
    yang_aner_yanganer: { generalId: 'yang_aner_yanganer', tier: 'famous', tacticalSkillId: 'ts_007', strategicSkillId: 'str_12' }, // 杨安儿红袄军克登莱
    unassigned_mayin: { generalId: 'unassigned_mayin', tier: 'famous', tacticalSkillId: 'ts_024', strategicSkillId: 'str_10' }, // 马楚开国
    qi_d_qijiguang: { generalId: 'qi_d_qijiguang', tier: 'famous', tacticalSkillId: 'ts_093', strategicSkillId: 'str_11' },
    yezongliu_yezongliu: { generalId: 'yezongliu_yezongliu', tier: 'ordinary', tacticalSkillId: 'ts_014' },    zhangshicheng_zhangshicheng: { generalId: 'zhangshicheng_zhangshicheng', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_13' }, // 大周盐丁
    gumie_liuyu: { generalId: 'gumie_liuyu', tier: 'famous', tacticalSkillId: 'ts_174', strategicSkillId: 'str_01' }, // 却月阵水陆协同灭南燕
    hu_d_husansheng: { generalId: 'hu_d_husansheng', tier: 'ordinary', tacticalSkillId: 'ts_026' }, // 胡三省浙东义兵抗元
    unassigned_ganning: { generalId: 'unassigned_ganning', tier: 'famous', tacticalSkillId: 'ts_026', strategicSkillId: 'str_01' }, // 锦帆百骑
    wuyue_qianliu: { generalId: 'wuyue_qianliu', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_15' },
    qiufu_qiufu_jn: { generalId: 'qiufu_qiufu_jn', tier: 'ordinary', tacticalSkillId: 'ts_026' }, // 裘甫起义
    shenshi_shenqingzhi: { generalId: 'shenshi_shenqingzhi', tier: 'ordinary', tacticalSkillId: 'ts_029' }, // 沈氏老将
    huangwang_huangchao: { generalId: 'huangwang_huangchao', tier: 'famous', tacticalSkillId: 'ts_029', strategicSkillId: 'str_07' }, // 冲天大将军
    lujian_zhanghuangyan: { generalId: 'lujian_zhanghuangyan', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // 鲁监抗清
    linshihong_linshihong: { generalId: 'linshihong_linshihong', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // 楚帝鄱阳
    liu_yingbu: { generalId: 'liu_yingbu', tier: 'famous', tacticalSkillId: 'ts_024', strategicSkillId: 'str_07' }, // 九江王
    unassigned_wangchao: { generalId: 'unassigned_wangchao', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // 光州入闽
    shuntian_linshuangwen: { generalId: 'shuntian_linshuangwen', tier: 'ordinary', tacticalSkillId: 'ts_015' },    chunshen_huangxie: { generalId: 'chunshen_huangxie', tier: 'ordinary', tacticalSkillId: 'ts_035' }, // 春申君
    shanyue_sunce: { generalId: 'shanyue_sunce', tier: 'famous', tacticalSkillId: 'ts_175', strategicSkillId: 'str_15' }, // 江东小霸王·席卷六郡（先声夺人）
    she_ethnic_leiwanxing: { generalId: 'she_ethnic_leiwanxing', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // 畲民起义
    unassigned_pushougeng: { generalId: 'unassigned_pushougeng', tier: 'ordinary', tacticalSkillId: 'ts_033' }, // 泉州蒲氏
    wang_s_wanghua: { generalId: 'wang_s_wanghua', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // 汪华保境
    kejia_wentianxiang: { generalId: 'kejia_wentianxiang', tier: 'ordinary', tacticalSkillId: 'ts_031' }, // 勤王抗元·闽粤赣募兵沾边客家
    tingzhou_d_chenmin: { generalId: 'tingzhou_d_chenmin', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_11' }, // 瑞金·陈敏破敌军抗元
    chu_d_lukang: { generalId: 'chu_d_lukang', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // 庐江太守守城抗孙策
    ying_caojingzong: { generalId: 'ying_caojingzong', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_14' }, // 梁郢州刺史据城退魏（《梁书·曹景宗传》）
    fu2_zhoudi: { generalId: 'fu2_zhoudi', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_14' }, // 陈周迪据临川拒讨
    ouyang_ouyangyi: { generalId: 'ouyang_ouyangyi', tier: 'famous', tacticalSkillId: 'ts_007', strategicSkillId: 'str_13' }, // 梁欧阳頠庐陵蛮兵
    unassigned_chunshenjun_h: { generalId: 'unassigned_chunshenjun_h', tier: 'ordinary', tacticalSkillId: 'ts_035' }, // 黄国后裔
    danyang_yuyunwen: { generalId: 'danyang_yuyunwen', tier: 'ordinary', tacticalSkillId: 'ts_011' },    chizhou_wumingche: { generalId: 'chizhou_wumingche', tier: 'famous', tacticalSkillId: 'ts_007', strategicSkillId: 'str_07' },    zhong_xiexuan: { generalId: 'zhong_xiexuan', tier: 'famous', tacticalSkillId: 'ts_157', strategicSkillId: 'str_01' }, // 风声鹤唳（淝水之战）
    yuan_cj_d_yuanshu_zn: { generalId: 'yuan_cj_d_yuanshu_zn', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // 仲家皇帝
    daxi_ming_zhangxianzhong: { generalId: 'daxi_ming_zhangxianzhong', tier: 'famous', tacticalSkillId: 'ts_125', strategicSkillId: 'str_12' }, // 大西王
    sunwu_d_sunquan: { generalId: 'sunwu_d_sunquan', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // 赤壁抗曹
    // ── 2026-06-20 批量补充缺失档案 ──
    zhao_lianpo: { generalId: 'zhao_lianpo', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_13' },
    unassigned_liduozuo: {
        generalId: 'unassigned_liduozuo',
        tier: 'ordinary',
        tacticalSkillId: 'ts_026',
    },
    min_wangshenzhi: {
        generalId: 'min_wangshenzhi',
        tier: 'famous',
        tacticalSkillId: 'ts_016',
        strategicSkillId: 'str_01',
    },
    quanzhou_liucongxiao: {
        generalId: 'quanzhou_liucongxiao',
        tier: 'ordinary',
        tacticalSkillId: 'ts_035',
    },
    unassigned_yangyizhong: {
        generalId: 'unassigned_yangyizhong',
        tier: 'famous',
        tacticalSkillId: 'ts_016',
        strategicSkillId: 'str_11',
    },
    kaga_d_xiajianlaizheng: {
        generalId: 'kaga_d_xiajianlaizheng',
        tier: 'ordinary',
        tacticalSkillId: 'ts_014',
    },
    lelang_wangqi: {
        generalId: 'lelang_wangqi',
        tier: 'ordinary',
        tacticalSkillId: 'ts_035',
    },
    anmei_yuwandaqin: {
        generalId: 'anmei_yuwandaqin',
        tier: 'ordinary',
        tacticalSkillId: 'ts_016',
    },
    naju_d_wangjian_kr: { generalId: 'naju_d_wangjian_kr', tier: 'famous', tacticalSkillId: 'ts_018', strategicSkillId: 'str_11' },
    huimo_gaoyanshou: {
        generalId: 'huimo_gaoyanshou',
        tier: 'ordinary',
        tacticalSkillId: 'ts_016',
    },
    aola_menglielun: {
        generalId: 'aola_menglielun',
        tier: 'ordinary',
        tacticalSkillId: 'ts_014',
    },
    ewenki_bombogor: {
        generalId: 'ewenki_bombogor',
        tier: 'ordinary',
        tacticalSkillId: 'ts_035',
    },
    haixi_nvzhen_baiyindali: { generalId: 'haixi_nvzhen_baiyindali', tier: 'ordinary', tacticalSkillId: 'ts_024' },
    dazhen_wanyantiege: { generalId: 'dazhen_wanyantiege', tier: 'ordinary', tacticalSkillId: 'ts_014' },
    xianbei_tuobamao: {
        generalId: 'xianbei_tuobamao',
        tier: 'ordinary',
        tacticalSkillId: 'ts_016',
    },
    dada_ming_dayanhan: {
        generalId: 'dada_ming_dayanhan',
        tier: 'famous',
        tacticalSkillId: 'ts_132',
        strategicSkillId: 'str_07',
    },
    luzhou_zhangwenxiu: {
        generalId: 'luzhou_zhangwenxiu',
        tier: 'ordinary',
        tacticalSkillId: 'ts_014',
    },
    tuoming_tuomin: {
        generalId: 'tuoming_tuomin',
        tier: 'ordinary',
        tacticalSkillId: 'ts_024',
    },
    pisha_yuchisheng: {
        generalId: 'pisha_yuchisheng',
        tier: 'ordinary',
        tacticalSkillId: 'ts_026',
    },

    unassigned_angui: {
        generalId: 'unassigned_angui',
        tier: 'ordinary',
        tacticalSkillId: 'ts_011',
    },
    guangwu_xinwuxian: {
        generalId: 'guangwu_xinwuxian',
        tier: 'ordinary',
        tacticalSkillId: 'ts_016',
    },
    nguyen_guangnan_ruanfuying: { generalId: 'nguyen_guangnan_ruanfuying', tier: 'famous', tacticalSkillId: 'ts_016', strategicSkillId: 'str_01' },
    fushi_fuhong: {
        generalId: 'fushi_fuhong',
        tier: 'famous',
        tacticalSkillId: 'ts_007',
        strategicSkillId: 'str_12',
    },
    ba_bamanzi: {
        generalId: 'ba_bamanzi',
        tier: 'ordinary',
        tacticalSkillId: 'ts_015',
    },
    zhongshan_yangaoging: {
        generalId: 'zhongshan_yangaoging',
        tier: 'ordinary',
        tacticalSkillId: 'ts_015',
    },
    unassigned_duanxiushi: {
        generalId: 'unassigned_duanxiushi',
        tier: 'ordinary',
        tacticalSkillId: 'ts_026',
    },
    jinan_tiexuan: {
        generalId: 'jinan_tiexuan',
        tier: 'ordinary',
        tacticalSkillId: 'ts_021',
    },
    unassigned_guandingfu: {
        generalId: 'unassigned_guandingfu',
        tier: 'ordinary',
        tacticalSkillId: 'ts_026',
    },
    dixiang_wangmang: {
        generalId: 'dixiang_wangmang',
        tier: 'ordinary',
        tacticalSkillId: 'ts_022', // ⑨釜底抽薪（昆阳大败之主）
    },
    qing_wanyanchenheshang: { generalId: 'qing_wanyanchenheshang', tier: 'famous', tacticalSkillId: 'ts_146', strategicSkillId: 'str_12' },
    zhuozhou_anlushan: {
        generalId: 'zhuozhou_anlushan',
        tier: 'famous',
        tacticalSkillId: 'ts_001',
        strategicSkillId: 'str_13',
    },
    changshan_yanyangzhao: {
        generalId: 'changshan_yanyangzhao',
        tier: 'famous',
        tacticalSkillId: 'ts_016',
        strategicSkillId: 'str_15',
    },
    wangyan_wangyan_tx: {
        generalId: 'wangyan_wangyan_tx',
        tier: 'ordinary',
        tacticalSkillId: 'ts_015',
    },
    wu_sunwu: {
        generalId: 'wu_sunwu',
        tier: 'famous',
        tacticalSkillId: 'ts_149',
        strategicSkillId: 'str_07',
    },
    hongzhou_zhuwenzheng: {
        generalId: 'hongzhou_zhuwenzheng',
        tier: 'ordinary',
        tacticalSkillId: 'ts_014',
    },
    zhuqian_shaozizheng: {
        generalId: 'zhuqian_shaozizheng',
        tier: 'ordinary',
        tacticalSkillId: 'ts_015',
    },
    fu_zhou_yanyan: {
        generalId: 'fu_zhou_yanyan',
        tier: 'ordinary',
        tacticalSkillId: 'ts_035',
    },
    lushui_dongzhuo: { generalId: 'lushui_dongzhuo', tier: 'famous', tacticalSkillId: 'ts_016', strategicSkillId: 'str_11' },
    cen_d_cenmeng: {
        generalId: 'cen_d_cenmeng',
        tier: 'ordinary',
        tacticalSkillId: 'ts_015',
    },
    miao_amishi: {
        generalId: 'miao_amishi',
        tier: 'ordinary',
        tacticalSkillId: 'ts_024',
    },
    jiang_s_huanggai: {
        generalId: 'jiang_s_huanggai',
        tier: 'famous',
        tacticalSkillId: 'ts_027',
        strategicSkillId: 'str_01',
    }, // 赤壁苦肉计·火烧曹船·乘风破浪
    muong_shencongyue: {
        generalId: 'muong_shencongyue',
        tier: 'ordinary',
        tacticalSkillId: 'ts_026',
    },
    panyao_panhu: {
        generalId: 'panyao_panhu',
        tier: 'ordinary',
        tacticalSkillId: 'ts_016',
    },
    chen2_zhaofan: {
        generalId: 'chen2_zhaofan',
        tier: 'ordinary',
        tacticalSkillId: 'ts_016',
    },
    qian_songjingyang: {
        generalId: 'qian_songjingyang',
        tier: 'ordinary',
        tacticalSkillId: 'ts_011',
    },
    jiashi_lixuance: {
        generalId: 'jiashi_lixuance',
        tier: 'famous',
        tacticalSkillId: 'ts_021',
        strategicSkillId: 'str_07', // 借兵灭国
    },
    yangtong_chisongdezan: {
        generalId: 'yangtong_chisongdezan',
        tier: 'ordinary',
        tacticalSkillId: 'ts_015',
    },
    monpa_meireiluozhujiacuo: {
        generalId: 'monpa_meireiluozhujiacuo',
        tier: 'ordinary',
        tacticalSkillId: 'ts_026',
    },
    xining_yangyingju: {
        generalId: 'xining_yangyingju',
        tier: 'ordinary',
        tacticalSkillId: 'ts_011',
    },
    kalun_dexinga: { generalId: 'kalun_dexinga', tier: 'ordinary', tacticalSkillId: 'ts_035' },
    golog_wandezhaxi: {
        generalId: 'golog_wandezhaxi',
        tier: 'ordinary',
        tacticalSkillId: 'ts_025',
    },
    lopi_abo: {
        generalId: 'lopi_abo',
        tier: 'ordinary',
        tacticalSkillId: 'ts_025',
    },
    unassigned_donghuwang: {
        generalId: 'unassigned_donghuwang',
        tier: 'ordinary',
        tacticalSkillId: 'ts_021',
    },
    dingling_dinglingwang: {
        generalId: 'dingling_dinglingwang',
        tier: 'ordinary',
        tacticalSkillId: 'ts_021',
    },
    hui_bunaibou: {
        generalId: 'hui_bunaibou',
        tier: 'ordinary',
        tacticalSkillId: 'ts_024',
    },
    donghui_nanlv: {
        generalId: 'donghui_nanlv',
        tier: 'ordinary',
        tacticalSkillId: 'ts_021',
    },
    gonggu_gonggudaozhu: {
        generalId: 'gonggu_gonggudaozhu',
        tier: 'ordinary',
        tacticalSkillId: 'ts_026',
    },
    yizhi_yizhiwang: {
        generalId: 'yizhi_yizhiwang',
        tier: 'ordinary',
        tacticalSkillId: 'ts_026',
    },
    beihai_ayinuqiuzhang: {
        generalId: 'beihai_ayinuqiuzhang',
        tier: 'ordinary',
        tacticalSkillId: 'ts_024',
    },
    sheng_d_liyiqi: {
        generalId: 'sheng_d_liyiqi',
        tier: 'ordinary',
        tacticalSkillId: 'ts_021',
    },
    pyu_molingtuo: {
        generalId: 'pyu_molingtuo',
        tier: 'ordinary',
        tacticalSkillId: 'ts_014',
    },
    nongzhigao_huangshimi: {
        generalId: 'nongzhigao_huangshimi',
        tier: 'ordinary',
        tacticalSkillId: 'ts_014',
    },
    unassigned_weitou_wang: { generalId: 'unassigned_weitou_wang', tier: 'ordinary', tacticalSkillId: 'ts_018' }, // ???
    unassigned_yumi_wang: { generalId: 'unassigned_yumi_wang', tier: 'ordinary', tacticalSkillId: 'ts_026' }, // ???
    unassigned_qiemo_wang: { generalId: 'unassigned_qiemo_wang', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // ???
    unassigned_pishan_wang: { generalId: 'unassigned_pishan_wang', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // ???
    ruoqiang_ruoqiang_wang: { generalId: 'ruoqiang_ruoqiang_wang', tier: 'ordinary', tacticalSkillId: 'ts_026' }, // ???
    unassigned_weili_wang: { generalId: 'unassigned_weili_wang', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // ???
    unassigned_bailong_shuai: { generalId: 'unassigned_bailong_shuai', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // ?????
    unassigned_wensu_wang: { generalId: 'unassigned_wensu_wang', tier: 'ordinary', tacticalSkillId: 'ts_007' }, // ???
    duerbote_duerbote_taiji: { generalId: 'duerbote_duerbote_taiji', tier: 'ordinary', tacticalSkillId: 'ts_024' }, // ??????
    unassigned_sai_wang: { generalId: 'unassigned_sai_wang', tier: 'ordinary', tacticalSkillId: 'ts_026' }, // ??
    xiye_xiye_wang: { generalId: 'xiye_xiye_wang', tier: 'ordinary', tacticalSkillId: 'ts_025' }, // ???
    unassigned_huibu_boke: { generalId: 'unassigned_huibu_boke', tier: 'ordinary', tacticalSkillId: 'ts_014' }, // ????
    unassigned_faqiang_wang: { generalId: 'unassigned_faqiang_wang', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // ???
    unassigned_kangba_tusi: { generalId: 'unassigned_kangba_tusi', tier: 'ordinary', tacticalSkillId: 'ts_035' }, // ????
    unassigned_keliyaboke: { generalId: 'unassigned_keliyaboke', tier: 'ordinary', tacticalSkillId: 'ts_014' }, // ?????
    zhuoshi_zhuowangsun: { generalId: 'zhuoshi_zhuowangsun', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // ???
    unassigned_yongguo_jun: { generalId: 'unassigned_yongguo_jun', tier: 'ordinary', tacticalSkillId: 'ts_025' }, // ????
    xingliao_dayanlin: { generalId: 'xingliao_dayanlin', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // ??????
    unassigned_jingcheng_fushi: { generalId: 'unassigned_jingcheng_fushi', tier: 'ordinary', tacticalSkillId: 'ts_026' }, // ????
    unassigned_wangmang: { generalId: 'unassigned_wangmang', tier: 'ordinary', tacticalSkillId: 'ts_024' }, // ????
    xihai_d_fulianchou: { generalId: 'xihai_d_fulianchou', tier: 'ordinary', tacticalSkillId: 'ts_018' }, // 吐谷浑可汗伏俟城
    unassigned_yaerbeige: { generalId: 'unassigned_yaerbeige', tier: 'ordinary', tacticalSkillId: 'ts_014' }, // 雅尔贝格
    guzgan_abulihalisi: { generalId: 'guzgan_abulihalisi', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // 法里贡埃米尔法里亚布
    badakhshan_luozhentan: { generalId: 'badakhshan_luozhentan', tier: 'ordinary', tacticalSkillId: 'ts_014' }, // 唐护密国王法扎巴德
    kawusi_haidaer: { generalId: 'kawusi_haidaer', tier: 'ordinary', tacticalSkillId: 'ts_014' }, // 卡乌斯之子阿夫申吉扎克
    xianhai_shamalike: { generalId: 'xianhai_shamalike', tier: 'ordinary', tacticalSkillId: 'ts_014' }, // 乌古斯叶护养吉干
    wuhu_dukake: { generalId: 'wuhu_dukake', tier: 'ordinary', tacticalSkillId: 'ts_024' }, // 铁弓苏巴什真珠河
    unassigned_farighun: { generalId: 'unassigned_farighun', tier: 'ordinary', tacticalSkillId: 'ts_025' },    unassigned_ali_asad: { generalId: 'unassigned_ali_asad', tier: 'ordinary', tacticalSkillId: 'ts_011' },    unassigned_afshin: { generalId: 'unassigned_afshin', tier: 'ordinary', tacticalSkillId: 'ts_015' },    unassigned_aral_bek: { generalId: 'unassigned_aral_bek', tier: 'ordinary', tacticalSkillId: 'ts_014' },    unassigned_seljuk: { generalId: 'unassigned_seljuk', tier: 'ordinary', tacticalSkillId: 'ts_015' },    unassigned_xingan_zhang: { generalId: 'unassigned_xingan_zhang', tier: 'ordinary', tacticalSkillId: 'ts_035' },    unassigned_dongping_zhang: { generalId: 'unassigned_dongping_zhang', tier: 'ordinary', tacticalSkillId: 'ts_035' },    yun_wuli: { generalId: 'yun_wuli', tier: 'ordinary', tacticalSkillId: 'ts_041' }, // 卢氏戎子吾离陆浑关
    unassigned_yuchisheng_k: { generalId: 'unassigned_yuchisheng_k', tier: 'ordinary', tacticalSkillId: 'ts_002' }, // 尉迟胜克里雅山口
    bailong_suomai: { generalId: 'bailong_suomai', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 索劢屯田楼兰三陇沙
    sai_gejiayun: { generalId: 'sai_gejiayun', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // 盖嘉运拔换城握瑟德
    weiwuer_yusubu: { generalId: 'weiwuer_yusubu', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 玉素布阿克苏玉尔滚
    kangba_suonuomugunbu: { generalId: 'kangba_suonuomugunbu', tier: 'ordinary', tacticalSkillId: 'ts_014' }, // 索诺木衮布理塘宣抚司
    yong_lujili: { generalId: 'yong_lujili', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // 庐戢黎庸将竹山
    jingcheng_d_yuyouzhao: { generalId: 'jingcheng_d_yuyouzhao', tier: 'ordinary', tacticalSkillId: 'ts_025' }, // 鱼有沼镜城笼耳
    unassigned_tianyi: { generalId: 'unassigned_tianyi', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // 田邑上党太守长子

    // ── 2026-06-20 补全：FactionGenerals 有将无档（add:check 33 条）──
    nifuhe_barhudai: { generalId: 'nifuhe_barhudai', tier: 'ordinary', tacticalSkillId: 'ts_025' }, // 巴尔虎代·尼夫河
    donghu_tuiyin: { generalId: 'donghu_tuiyin', tier: 'ordinary', tacticalSkillId: 'ts_025' }, // 东胡推寅
    yingzhou_ying_d_muronghuang: { generalId: 'yingzhou_ying_d_muronghuang', tier: 'famous', tacticalSkillId: 'ts_150', strategicSkillId: 'str_13' }, // 慕容皝范阳燕
    dingzhou_d_murongchui: { generalId: 'dingzhou_d_murongchui', tier: 'famous', tacticalSkillId: 'ts_008', strategicSkillId: 'str_01' }, // 慕容垂·枋头以寡击众破桓温追歼襄邑；八千鲜卑甲骑追奔兵贵神速
    oirat_ming_gaerdan: { generalId: 'oirat_ming_gaerdan', tier: 'famous', tacticalSkillId: 'ts_011', strategicSkillId: 'str_12' },
    qianhui_baiyanhu: { generalId: 'qianhui_baiyanhu', tier: 'ordinary', tacticalSkillId: 'ts_007' }, // 白彦虎回军
    ganden_zongkaba: { generalId: 'ganden_zongkaba', tier: 'ordinary', tacticalSkillId: 'ts_011' },    mon_monuhe: { generalId: 'mon_monuhe', tier: 'ordinary', tacticalSkillId: 'ts_025' }, // 摩奴诃·孟族
    weili_fan_d: { generalId: 'weili_fan_d', tier: 'ordinary', tacticalSkillId: 'ts_031' }, // 尉犁泛
    pishan_daihu: { generalId: 'pishan_daihu', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // 代胡·皮山
    nanai_zhahaluo: { generalId: 'nanai_zhahaluo', tier: 'ordinary', tacticalSkillId: 'ts_035' }, // 扎哈罗·那乃
    feiyaka_cemutehe: { generalId: 'feiyaka_cemutehe', tier: 'ordinary', tacticalSkillId: 'ts_029' }, // 策穆特赫·费雅喀
    tuva_qinggunzabu: { generalId: 'tuva_qinggunzabu', tier: 'ordinary', tacticalSkillId: 'ts_035' }, // 青滚杂卜·图瓦
    dalung_sangjiwen: { generalId: 'dalung_sangjiwen', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // 桑吉温·达隆
    hor_chisang: { generalId: 'hor_chisang', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // 赤桑·霍尔
    dong_nangqianjiabo: { generalId: 'dong_nangqianjiabo', tier: 'ordinary', tacticalSkillId: 'ts_025' }, // 囊谦加波·隆庆
    xingan_kalunshiwei: { generalId: 'xingan_kalunshiwei', tier: 'famous', tacticalSkillId: 'ts_007', strategicSkillId: 'str_15' },    lingqiu_zhaowuling: { generalId: 'lingqiu_zhaowuling', tier: 'famous', tacticalSkillId: 'ts_007', strategicSkillId: 'str_01' },    unassigned_zhouyuji_nw: { generalId: 'unassigned_zhouyuji_nw', tier: 'famous', tacticalSkillId: 'ts_031', strategicSkillId: 'str_15' }, // 周遇吉·楼烦
    yumi_anguo: { generalId: 'yumi_anguo', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 扜弥王安国
    keliya_fuduxin: { generalId: 'keliya_fuduxin', tier: 'ordinary', tacticalSkillId: 'ts_026' }, // 伏阇信·克里雅
    faqiang_niechizanpu: { generalId: 'faqiang_niechizanpu', tier: 'ordinary', tacticalSkillId: 'ts_001' }, // 聂赤·发羌
    niang_suonanjiabo: { generalId: 'niang_suonanjiabo', tier: 'ordinary', tacticalSkillId: 'ts_025' }, // 索南加波·觉木宗
    wensu_guyi: { generalId: 'wensu_guyi', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 姑翼·温宿
    qiemo_anmoshenpan: { generalId: 'qiemo_anmoshenpan', tier: 'ordinary', tacticalSkillId: 'ts_015' }, // 安末深盘·且末
    weitou_douti: { generalId: 'weitou_douti', tier: 'ordinary', tacticalSkillId: 'ts_033' }, // 兜题·尉头
    eluoke_amuhar: { generalId: 'eluoke_amuhar', tier: 'ordinary', tacticalSkillId: 'ts_021' }, // 阿穆哈尔·鄂罗克
    dongping_langtan: { generalId: 'dongping_langtan', tier: 'ordinary', tacticalSkillId: 'ts_024' }, // 郎坦·东平
    buriat_tumenjiergale: { generalId: 'buriat_tumenjiergale', tier: 'ordinary', tacticalSkillId: 'ts_024' }, // 图门吉尔嘎勒·布里亚特
    baidi_baidibushuai: { generalId: 'baidi_baidibushuai', tier: 'ordinary', tacticalSkillId: 'ts_011' }, // 白狄子
    kumoxi_ahuihui: { generalId: 'kumoxi_ahuihui', tier: 'ordinary', tacticalSkillId: 'ts_024' }, // 阿会毁·库莫奚
    haikou_wangzhi_pirate: { generalId: 'haikou_wangzhi_pirate', tier: 'ordinary', tacticalSkillId: 'ts_025' }, // 汪直·海寇
    shanshan_weituqi: { generalId: 'shanshan_weituqi', tier: 'ordinary', tacticalSkillId: 'ts_014' }, // 尉屠耆·鄯善
    pangzha_halixingge: { generalId: 'pangzha_halixingge', tier: 'famous', tacticalSkillId: 'ts_151', strategicSkillId: 'str_11' }, // 哈里·辛格·旁遮普：攻战计侵掠如火+攻城拔寨，开伯尔山口工程
    najie_minande: { generalId: 'najie_minande', tier: 'famous', tacticalSkillId: 'ts_027', strategicSkillId: 'str_11' }, // 米南德·那竭：攻战计侵掠如火+攻城拔寨，印度-希腊东进兴都库什
    dulan_d_aihamaide: { generalId: 'dulan_d_aihamaide', tier: 'famous', tacticalSkillId: 'ts_152', strategicSkillId: 'str_01' }, // 艾哈迈德·杜兰尼：攻战计侵掠如火+攻城拔寨，九征印度建帝国
    muer_mujier: { generalId: 'muer_mujier', tier: 'ordinary', tacticalSkillId: 'ts_014' },    baha_gaiwamu: { generalId: 'baha_gaiwamu', tier: 'ordinary', tacticalSkillId: 'ts_035' }, // 盖瓦姆·巴哈尔兹：深沟高垒守泰巴德
    hali_subashi: { generalId: 'hali_subashi', tier: 'ordinary', tacticalSkillId: 'ts_026' },    kalan_suhela: { generalId: 'kalan_suhela', tier: 'ordinary', tacticalSkillId: 'ts_027' }, // 苏赫拉·卡伦：敌战计避实击虚+攻城拔寨，萨珊东北铁壁
    xisi_yakubusafaer: { generalId: 'xisi_yakubusafaer', tier: 'famous', tacticalSkillId: 'ts_027', strategicSkillId: 'str_01' }, // 雅库布·萨法尔·锡斯坦：攻战计侵掠如火+攻城拔寨，铜匠起兵席卷呼罗珊
    delan_sulun: { generalId: 'delan_sulun', tier: 'famous', tacticalSkillId: 'ts_153', strategicSkillId: 'str_11' }, // 苏伦·德兰吉亚：敌战计避实击虚+长驱直入，帕提亚回马箭灭克拉苏
    huluo_abumusilin: { generalId: 'huluo_abumusilin', tier: 'famous', tacticalSkillId: 'ts_154', strategicSkillId: 'str_07' },    aba_shapuer: { generalId: 'aba_shapuer', tier: 'famous', tacticalSkillId: 'ts_010', strategicSkillId: 'str_11' }, // 沙普尔·阿巴尔：攻战计侵掠如火+长驱直入，三破罗马擒瓦勒良
    wenling_shilang: {
        generalId: 'wenling_shilang',
        tier: 'famous',
        tacticalSkillId: 'ts_025',
        strategicSkillId: 'str_12',
    },

    qianzhou_lisheng: {
        generalId: 'qianzhou_lisheng',
        tier: 'famous',
        tacticalSkillId: 'ts_155',
        strategicSkillId: 'str_13',
    },
    xiao_d_xiaomohe: { generalId: 'xiao_d_xiaomohe', tier: 'famous', tacticalSkillId: 'ts_025', strategicSkillId: 'str_11' },
    unassigned_sudinfang: {
        generalId: 'unassigned_sudinfang',
        tier: 'famous',
        tacticalSkillId: 'ts_025',
        strategicSkillId: 'str_15',
    },
    loufan_xuerengui: {
        generalId: 'loufan_xuerengui',
        tier: 'famous',
        tacticalSkillId: 'ts_021',
        strategicSkillId: 'str_07',
    },
    cai_lisu: {
        generalId: 'cai_lisu',
        tier: 'famous',
        tacticalSkillId: 'ts_181',
        strategicSkillId: 'str_11',
    },
    qingyuan_bd_zhoudewei: { generalId: 'qingyuan_bd_zhoudewei', tier: 'famous', tacticalSkillId: 'ts_007', strategicSkillId: 'str_12' },
    heyuan_d_heichichangzhi: {
        generalId: 'heyuan_d_heichichangzhi',
        tier: 'famous',
        tacticalSkillId: 'ts_001',
        strategicSkillId: 'str_13',
    },
    wuzhou_d_wangxiaojie: {
        generalId: 'wuzhou_d_wangxiaojie',
        tier: 'famous',
        tacticalSkillId: 'ts_007',
        strategicSkillId: 'str_15',
    },
    changshaguo_xinqiji: {
        generalId: 'changshaguo_xinqiji',
        tier: 'famous',
        tacticalSkillId: 'ts_176',
        strategicSkillId: 'str_07',
    },
    qian_d_yudayou: { generalId: 'qian_d_yudayou', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_11' },
    chuzhou_d_dugao: {
        generalId: 'chuzhou_d_dugao',
        tier: 'famous',
        tacticalSkillId: 'ts_031',
        strategicSkillId: 'str_12',
    },
    shule_aersilan: {
        generalId: 'shule_aersilan',
        tier: 'famous',
        tacticalSkillId: 'ts_007',
        strategicSkillId: 'str_13',
    },
    liguo_wangmeng: { generalId: 'liguo_wangmeng', tier: 'famous', tacticalSkillId: 'ts_021', strategicSkillId: 'str_01' },
    hongnong_jun_yangsu: { generalId: 'hongnong_jun_yangsu', tier: 'famous', tacticalSkillId: 'ts_049', strategicSkillId: 'str_11' },
    weihaiwei_sudingfang: {
        generalId: 'weihaiwei_sudingfang',
        tier: 'famous',
        tacticalSkillId: 'ts_116',
        strategicSkillId: 'str_13',
    }, // 苏定方：灭西突厥、平百济，长驱万里
    // ── 2026-06-29 新增：马殷 ──
    yingzhou_d2_licunxu: { generalId: 'yingzhou_d2_licunxu', tier: 'famous', tacticalSkillId: 'ts_120', strategicSkillId: 'str_13' },
    anxi_guoxin: { generalId: 'anxi_guoxin', tier: 'ordinary', tacticalSkillId: 'ts_006' },
    yanqi_longtuqizhi: { generalId: 'yanqi_longtuqizhi', tier: 'ordinary', tacticalSkillId: 'ts_009' },
};

export function getGeneralProfile(generalId: string | undefined): GeneralProfile | null {
    if (!generalId) return null;
    return GENERAL_PROFILES[generalId] ?? null;
}

/** v1 baseEffect → 旧 effect 桥接（ts_xxx 武将挂载后引擎兼容） */
const V1_EFFECT_BRIDGE: Record<string, { effect: TacticalEffect; timing: TacticalTiming }> = {
    ally_power_mult:           { effect: 'ally_mult_1_2',  timing: 'opening' },
    first_sortie_power_mult:   { effect: 'ally_mult_1_2',  timing: 'opening' },
    enemy_sub_troops_opening:  { effect: 'enemy_sub_troops', timing: 'opening' },
    ally_add_troops_comeback:  { effect: 'ally_add_troops', timing: 'comeback' },
    // ts_029 肉薄骨并（dual_sub_troops_opening）已由 v1 原生路径实现双向削兵（GeneralSkillCombat + combat-model）。
};

/** v1 phase → 旧 timing（side_comeback 条件技的 phase 被桥接到 comeback timing） */
function bridgeV1PhaseToTiming(entry: { phase: string; condition: string }): TacticalTiming {
    if (entry.condition === 'side_comeback') return 'comeback';
    if (entry.phase === 'mid_battle_comeback') return 'comeback';
    return 'opening';
}

export function getTacticalSkillDef(skillId: string): TacticalSkillDef | null {
    const direct = TACTICAL_SKILL_CATALOG[skillId];
    if (direct) return direct;
    // v1 桥接：武将已迁移到 ts_xxx，用 v1 catalog 合成旧格式 def
    if (!skillId.startsWith('ts_')) return null;
    const v1 = getTacticalSkillEntry(skillId);
    if (!v1) return null;
    const bridge = V1_EFFECT_BRIDGE[v1.baseEffect];
    if (!bridge) return null;
    return {
        id: v1.id,
        grid: `v1-${v1.index}`,
        displayName: v1.displayName,
        timing: bridgeV1PhaseToTiming(v1),
        effect: bridge.effect,
        magnitude: v1.magnitude,
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
}
