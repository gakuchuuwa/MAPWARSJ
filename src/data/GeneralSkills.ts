/**
 * 武将技数据（格号 = 机制真理，displayName = 展示皮肤）
 * 设计文档：docs/02-design/GENERAL_SKILLS_武将技系统.md
 * AI 分配标签：src/data/GeneralSkillTags.ts（品阶 + 五种战术风格）
 *
 * 战略 S①–S⑥；战术名将①–⑤开局 / 普将⑥–⑩逆局≤50%血。
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
    | 'attacker_power_mult'
    | 'defender_power_mult'
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
    /** 一次性技能（加兵/减兵/无敌），每场每侧仅触发一次；乘区技（×1.2/×0.8）为 false，每帧重算 */
    isOncePerBattle?: boolean;
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
    tac_01: { id: 'tac_01', grid: '①', displayName: '以逸待劳', timing: 'opening', effect: 'ally_add_troops', magnitude: 0.09, isOncePerBattle: true },
    tac_02: { id: 'tac_02', grid: '②', displayName: '避实击虚', timing: 'opening', effect: 'enemy_sub_troops', magnitude: 0.09, isOncePerBattle: true },
    tac_03: { id: 'tac_03', grid: '③', displayName: '侵掠如火', timing: 'opening', effect: 'ally_mult_1_2', magnitude: 1.2 },
    tac_04: { id: 'tac_04', grid: '④', displayName: '不战而屈', timing: 'opening', effect: 'enemy_mult_0_8', magnitude: 0.8 },
    tac_05: { id: 'tac_05', grid: '⑤', displayName: '不动如山', timing: 'opening', effect: 'ally_invincible', magnitude: 3, isOncePerBattle: true },
    tac_06: { id: 'tac_06', grid: '⑥', displayName: '哀兵必胜', timing: 'comeback', effect: 'ally_add_troops', magnitude: 0.09, isOncePerBattle: true },
    tac_07: { id: 'tac_07', grid: '⑦', displayName: '攻其不备', timing: 'comeback', effect: 'enemy_sub_troops', magnitude: 0.09, isOncePerBattle: true },
    tac_08: { id: 'tac_08', grid: '⑧', displayName: '置之死地', timing: 'comeback', effect: 'ally_mult_1_2', magnitude: 1.2, isOncePerBattle: true },
    tac_09: { id: 'tac_09', grid: '⑨', displayName: '釜底抽薪', timing: 'comeback', effect: 'enemy_mult_0_8', magnitude: 0.8, isOncePerBattle: true },
    tac_10: { id: 'tac_10', grid: '⑩', displayName: '深沟高垒', timing: 'comeback', effect: 'ally_invincible', magnitude: 3, isOncePerBattle: true },
};

/** 战略六格（因粮于敌见 EXPEDITION_FORAGE_SKILL，不占战略格） */
export const STRATEGIC_SKILL_CATALOG: Record<string, StrategicSkillDef> = {
    str_01: { id: 'str_01', grid: 'S①', displayName: '兵贵神速', effect: 'march_speed_mult', magnitude: 1.5 },
    // S②攻城拔寨已并入 S③所向披靡（2026-06-27）：攻城/野战不再分技，统一为「进攻方专用」
    str_03: { id: 'str_03', grid: 'S③', displayName: '所向披靡', effect: 'attacker_power_mult', magnitude: 1.5 },
    str_04: { id: 'str_04', grid: 'S④', displayName: '长驱直入', effect: 'plain_power_mult', magnitude: 1.5 },
    str_05: { id: 'str_05', grid: 'S⑤', displayName: '居高临下', effect: 'mountain_power_mult', magnitude: 1.5 },
    str_06: { id: 'str_06', grid: 'S⑥', displayName: '乘风破浪', effect: 'water_power_mult', magnitude: 1.5 },
    str_07: { id: 'str_07', grid: 'S⑦', displayName: '因粮于敌', effect: 'post_battle_troop_pct', magnitude: 0.09 },
    str_08: { id: 'str_08', grid: 'S⑧', displayName: '固若金汤', effect: 'defender_power_mult', magnitude: 1.5 },
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
    magnitude: 0.09,
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
    wuzhou_d_wuzetian: { generalId: 'wuzhou_d_wuzetian', tier: 'famous', tacticalSkillId: 'tac_04', strategicSkillId: 'str_07' },
    guishuang_qiuqiujiu: { generalId: 'guishuang_qiuqiujiu', tier: 'ordinary', tacticalSkillId: 'tac_10' },
    qidan_shulvping: { generalId: 'qidan_shulvping', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 辽太祖皇后，政治手腕削弱对手
    hui_bunaihou: { generalId: 'hui_bunaihou', tier: 'ordinary', tacticalSkillId: 'tac_08' },
    // ── 中国及外围 ──
    xin_baiqi: { generalId: 'xin_baiqi', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // S③所向披靡 + ③侵掠如火（歼灭战神）
    qin_wangjian: { generalId: 'qin_wangjian', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_03' }, // S②攻城拔寨 + ⑤不动如山（灭国统帅，坚壁挫楚）
    qin_simacuo: { generalId: 'qin_simacuo', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // S⑤居高临下 + ②避实击虚（越岭平蜀，奇袭楚国）
    qin_wangben: { generalId: 'qin_wangben', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_01' }, // S①兵贵神速 + ③侵掠如火（闪击燕齐，水淹大梁）
    qin_mengtian: { generalId: 'qin_mengtian', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // S④长驱直入 + ①以逸待劳（北击匈奴，驻守长城）
    qin_yingji: { generalId: 'qin_yingji', tier: 'famous', tacticalSkillId: 'tac_04', strategicSkillId: 'str_07' }, // S⑦因粮于敌 + ④不战而屈（君主全能调度）
    beidi_yaochang: { generalId: 'beidi_yaochang', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_03' }, // S②攻城拔寨 + ②避实击虚（擒杀苻坚，攻克长安）
    unassigned_simacuo: { generalId: 'unassigned_simacuo', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 前316年灭蜀苴巴
    tang_lishimin: { generalId: 'tang_lishimin', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 虎牢关轻骑冲阵
    unassigned_direnjie: { generalId: 'unassigned_direnjie', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 退突厥：间谍离间后反击
    pinghai_laihuer: { generalId: 'pinghai_laihuer', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 征东：水师突击平壤焚舰
    jianzhou_nvzhen_limanzhu: { generalId: 'jianzhou_nvzhen_limanzhu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 建州：聚合诸部筑城自守
    unassigned_zhangliang: { generalId: 'unassigned_zhangliang', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 征东：唐水军渡海攻坚
    mushi_muchong: { generalId: 'mushi_muchong', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 代北：北魏开国翼戴
    lai_wangshifan: { generalId: 'lai_wangshifan', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 平卢：反朱温决死突击
    xiongding_murongyong: { generalId: 'xiongding_murongyong', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 西燕：亡国哀兵复起
    chanzhou_chairong: { generalId: 'chanzhou_chairong', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 澶州：周世宗亲征
    linhu_zhaowulingwang: { generalId: 'linhu_zhaowulingwang', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 胡服骑射：破林胡灭楼烦
    xianyu_hanxin: { generalId: 'xianyu_hanxin', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 韩信背水一战
    shizhao_d_shihu: { generalId: 'shizhao_d_shihu', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 邺都：暴虐突袭
    unassigned_loufanwang: { generalId: 'unassigned_loufanwang', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 楼烦：亡部哀兵复起
    shanrong_tianchou: { generalId: 'shanrong_tianchou', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 无终·田畴导曹操奇袭乌桓
    xie_cj_d_xingfangde: { generalId: 'xie_cj_d_xingfangde', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 信州：垒山筑寨据守抗元
    wan_liuyuan: { generalId: 'wan_liuyuan', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 刘源皖口
    huang_d_sunshuao: { generalId: 'huang_d_sunshuao', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 期思：筑芍陂兴水利
    wenzhou_zhangcong: { generalId: 'wenzhou_zhangcong', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 永嘉：整顿海防编练水师
    qianzhong_wubayue: { generalId: 'qianzhong_wubayue', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 乾嘉：苗民决死破清军
    dangchang_liangmiding: { generalId: 'dangchang_liangmiding', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 宕昌：守羌堡据险
    liao_houhongyuan: { generalId: 'liao_houhongyuan', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 巴僚：酋帅哀兵守土
    sou_gaodingyuan: { generalId: 'sou_gaodingyuan', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 越巂：反蜀决死突围
    unassigned_duwenxiu: { generalId: 'unassigned_duwenxiu', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 回军：哀兵复起
    qingqiang_jiangwei: { generalId: 'qingqiang_jiangwei', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 北伐：避实击虚九伐中原
    qingyi_fanchangsheng: { generalId: 'qingyi_fanchangsheng', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 范长生天师道
    guangping_ruanwenzhang: { generalId: 'guangping_ruanwenzhang', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 广平：象兵水师哀兵抗西山
    nanzhong_mazhong: { generalId: 'nanzhong_mazhong', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 南中：镇抚夷汉固守边郡
    yueyi_zhangyi: { generalId: 'yueyi_zhangyi', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 张嶷越嶲
    jingjiang_qushisi: { generalId: 'jingjiang_qushisi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 永安：固守靖江破李成栋
    duanzhou_d_caojin: { generalId: 'duanzhou_d_caojin', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 端州：据城拒侬智高
    monong_anong: { generalId: 'monong_anong', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 邦敦：哀兵退守
    basha_d_daogengmeng: { generalId: 'basha_d_daogengmeng', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 上丁：象兵雄踞
    leizhou_limao_leizhou: { generalId: 'leizhou_limao_leizhou', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 雷州：驻防海康
    ketagalan_huangqingyun: { generalId: 'ketagalan_huangqingyun', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 艋舺：汛防戍守
    shuizhen_oudaren: { generalId: 'shuizhen_oudaren', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 三菩：戍卒驻守
    pingnan_musheng: { generalId: 'pingnan_musheng', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 腾越：征讨麓川屡立战功
    jingdong_taohong: { generalId: 'jingdong_taohong', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 银生：坚守退敌
    ava_sijifa: { generalId: 'ava_sijifa', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 阿瓦：哀兵退守
    dian_duanjianwei: { generalId: 'dian_duanjianwei', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 通海：南诏都督镇守
    unassigned_monuha: { generalId: 'unassigned_monuha', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 直通：孟族国王
    luohu_ganmuding: { generalId: 'luohu_ganmuding', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 呵叻：罗斛驻守
    ailao_leilao: { generalId: 'ailao_leilao', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 永昌：哀牢决死反叛
    mingzheng_jianzandechang: { generalId: 'mingzheng_jianzandechang', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 打箭炉：从征金川
    hani_d_zhebi: { generalId: 'hani_d_zhebi', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 思陀：从征安南
    unassigned_piqiluomo: { generalId: 'unassigned_piqiluomo', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 骠国：守城戍卒
    ali_gandancaiwang: { generalId: 'ali_gandancaiwang', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 阿里：远征拉达克
    gaoliang_fengang: { generalId: 'gaoliang_fengang', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 高凉：平僚威震岭南
    bailan_pabala: { generalId: 'bailan_pabala', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 昌都：率僧兵守城
    jiantang_sangjiejia: { generalId: 'jiantang_sangjiejia', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 建塘：第巴摄政遣防
    kongsa_kongsayiduo: { generalId: 'kongsa_kongsayiduo', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 甘孜：从征瞻对
    unassigned_lazanghan: { generalId: 'unassigned_lazanghan', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 黑河宗：卫拉特突骑
    gling_lingesar: { generalId: 'gling_lingesar', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_06' }, // 岭国：史诗英雄
    unassigned_nangqianwang: { generalId: 'unassigned_nangqianwang', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 隆庆：二十五族盟主
    unassigned_huoerkangsa: { generalId: 'unassigned_huoerkangsa', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 索宗：协剿波密
    daca_dacajilong: { generalId: 'daca_dacajilong', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 八宿：活佛差民武装
    gongtang_gongtangang: { generalId: 'gongtang_gongtangang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 吉麦：牧民武装
    unassigned_juemuba: { generalId: 'unassigned_juemuba', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 觉木：宗谿驻兵
    unassigned_dalonghuofo: { generalId: 'unassigned_dalonghuofo', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 类乌齐：抵御盗匪
    nanjie_nanjiewangqiu: { generalId: 'nanjie_nanjiewangqiu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 日土：边军驻防
    unassigned_zhudi: { generalId: 'unassigned_zhudi', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_01' }, // 靖难军白沟突击
    ming_d_zhudi: { generalId: 'ming_d_zhudi', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 靖难野战·五征漠北·所向披靡
    jinling_tandaoji: { generalId: 'jinling_tandaoji', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 唱筹量沙·三十六计走为上
    yang_zhou_yangxingmi: { generalId: 'yang_zhou_yangxingmi', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_03' }, // 清口之战破孙儒、守淮南
    yangzhou_wangping: { generalId: 'yangzhou_wangping', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 244年兴势之战据险大破曹爽
    pagan_anuluvtuo: { generalId: 'pagan_anuluvtuo', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 蒲甘王朝东征西讨
    unassigned_machao: { generalId: 'unassigned_machao', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 潼关决死突击
    qiuci_baiba: { generalId: 'qiuci_baiba', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 龟兹内乱：哀兵复国
    menggu_d_chengjisihan: { generalId: 'menggu_d_chengjisihan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_01' }, // 蒙古西征神速奔袭
    bohai_dazuorong: { generalId: 'bohai_dazuorong', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 渤海开基：筑城固守建国
    goryeo_jiangganzan: { generalId: 'goryeo_jiangganzan', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_06' }, // 金岘大捷：守土反击破辽
    ashikaga_zulijunshi: { generalId: 'ashikaga_zulijunshi', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_06' }, // 凑川败后据九州水师固守
    tiemuer_tiemuer: { generalId: 'tiemuer_tiemuer', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_01' }, // 六年征服千里闪击
    siam_nalixuan: { generalId: 'siam_nalixuan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_06' }, // 象战击杀缅甸王储复国
    shang_fuhao: { generalId: 'shang_fuhao', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 征伐土方武丁妇好率军突击
    pizhou_lvbu: { generalId: 'pizhou_lvbu', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 下邳飞将
    han_d_liubang: { generalId: 'han_d_liubang', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_07' }, // S⑦因粮于敌 + ②避实击虚（君主全能调度）

    wei_wuqi: { generalId: 'wei_wuqi', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_03' }, // 治魏军严明后破秦五城
    manzhou_nuerhachi: { generalId: 'manzhou_nuerhachi', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 萨尔浒野战突击
    xinluo_jinyixin: { generalId: 'xinluo_jinyixin', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_03' }, // 萨円大捷守城反攻
    seljuq_sangjiaer: { generalId: 'seljuq_sangjiaer', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 中亚草原对峙以逸待变
    zaoyang_d_menggong: { generalId: 'zaoyang_d_menggong', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_03' }, // 枣阳孤城死守破蒙古
    yamato_nanmuzhengcheng: { generalId: 'yamato_nanmuzhengcheng', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 千早城笼城死守抗幕府
    chen3_chenwang: { generalId: 'chen3_chenwang', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 马韩辰王治月支国
    jilizhou_chengmingzhen: { generalId: 'jilizhou_chengmingzhen', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_06' }, // 卑沙城水陆并进攻克
    nuergan_kangwang: { generalId: 'nuergan_kangwang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 奴儿干都司戍边
    ashina_ashinayandu: { generalId: 'ashina_ashinayandu', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 阿尔泰金山突厥
    yiwu_hanshen: { generalId: 'yiwu_hanshen', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 哈密忠顺王苦峪抗也先
    hepan_peishenfu: { generalId: 'hepan_peishenfu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 朅盘陀石头城戍守
    unassigned_cewangzhabu: { generalId: 'unassigned_cewangzhabu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 札萨克图汗部
    unassigned_amursana: { generalId: 'unassigned_amursana', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 金山辉特部反清
    chuyue_shatuonasu: { generalId: 'chuyue_shatuonasu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 独山城处月部
    keerkezi_manasi: { generalId: 'keerkezi_manasi', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 柯尔克孜史诗英雄
    unassigned_zhangyao: { generalId: 'unassigned_zhangyao', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 星星峡嵩武军入疆
    xiyuduhu_banchao: { generalId: 'xiyuduhu_banchao', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 疏勒·36骑定西域
    yangguan_banyong: { generalId: 'yangguan_banyong', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 阳关·班勇续通西域
    wulianghai_chelingwubashi: { generalId: 'wulianghai_chelingwubashi', tier: 'ordinary', tacticalSkillId: 'tac_10' },
    tumengken_tumengken: { generalId: 'tumengken_tumengken', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 赛音诺颜抗卫拉特
    bayegu_qulishi: { generalId: 'bayegu_qulishi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 拔野古助唐灭薛延陀
    zubu_mogusi: { generalId: 'zubu_mogusi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 阻卜酋长叛辽
    wuzhumuqin_duoerji: { generalId: 'wuzhumuqin_duoerji', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 乌珠穆沁随征噶尔丹
    unassigned_feizigu: { generalId: 'unassigned_feizigu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 白狄肥国肥子鼓集宁
    shiwei_saigou: { generalId: 'shiwei_saigou', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 室韦大酋长塞呴俱轮泊元和入朝
    sunite_sunitezasake: { generalId: 'sunite_sunitezasake', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 苏尼特札萨克
    bulat_boduanchaer: { generalId: 'bulat_boduanchaer', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 蒙古始祖孛端察儿石勒喀河
    unassigned_danjin: { generalId: 'unassigned_danjin', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 首任唐努总管丹津 // 布尔根乌梁海部
    // ── 日本 ──
    edo_dechuangjiakang: { generalId: 'edo_dechuangjiakang', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 关原后稳坐江户待变
    kai_wutianxinxuan: { generalId: 'kai_wutianxinxuan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 川中岛铁骑突击
    echigo_shangshanqianxin: { generalId: 'echigo_shangshanqianxin', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 川中岛车悬突击
    hashiba_fengchenxiuji: { generalId: 'hashiba_fengchenxiuji', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_01' }, // 鸟取忍城粮道奇袭
    sanada_d_zhentianxingcun: { generalId: 'sanada_d_zhentianxingcun', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 大阪夏之阵赤备突击
    date_d_yidazhengzong: { generalId: 'date_d_yidazhengzong', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 独眼兜冲阵
    owari_zhitianxinchang: { generalId: 'owari_zhitianxinchang', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_03' }, // 桶狭间奇袭破今川
    totomi_sakaitadatsugu: { generalId: 'totomi_sakaitadatsugu', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 浜松城·德川四天王
    jinchuan_jinchuanyiyuan: { generalId: 'jinchuan_jinchuanyiyuan', tier: 'famous', tacticalSkillId: 'tac_04', strategicSkillId: 'str_04' }, // 东海道第一弓取·大军压境
    aki_maoliyuanjiu: { generalId: 'aki_maoliyuanjiu', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_06' }, // 严岛夜袭少胜多
    satsuma_daojinjiajiu: { generalId: 'satsuma_daojinjiajiu', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 钓野伏·冲田畷耳川合战
    otomo_d_lihuadaoxue: { generalId: 'otomo_d_lihuadaoxue', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 迁冈筑城拒敌
    higo_d_juchiwuguang: { generalId: 'higo_d_juchiwuguang', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 菊池河山战突击
    aizu_pushengshixiang: { generalId: 'aizu_pushengshixiang', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 会津五奉行据山城维稳
    chosokabe_changzongwobuyuanqin: { generalId: 'chosokabe_changzongwobuyuanqin', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 长宗我部奇袭统一四国
    izumo_shanzhonglujie: { generalId: 'izumo_shanzhonglujie', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 局部守战逆袭
    unassigned_lingmuzhongxiu: { generalId: 'unassigned_lingmuzhongxiu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 筑寨固守
    iga_d_baididanbo: { generalId: 'iga_d_baididanbo', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 伊贺忍者夜袭
    jibei2_qingshuizongzhi: { generalId: 'jibei2_qingshuizongzhi', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_08' }, // 备中高松城笼城死守
    sagami_hojoujiyasu: { generalId: 'sagami_hojoujiyasu', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_08' }, // 小田原城·天下第一坚城
    mino_otaniyoshitsugu: { generalId: 'mino_otaniyoshitsugu', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 不破关·关原死战
    suwa_d_zoufanglaizhong: { generalId: 'suwa_d_zoufanglaizhong', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 诹访据险反击
    shimotsuke_yudugongguanggang: { generalId: 'shimotsuke_yudugongguanggang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 宇都宫筑城固守
    iyo_d_cunshangwuji: { generalId: 'iyo_d_cunshangwuji', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 村上水军奇袭
    nanbu_nanbuqingzheng: { generalId: 'nanbu_nanbuqingzheng', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 南部藩境守反击
    unassigned_yuxiduozhijia: { generalId: 'unassigned_yuxiduozhijia', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 离间毛利后取备前
    osumi_ganfujianxu: { generalId: 'osumi_ganfujianxu', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 肝付水军奇袭
    fujiwara_yuanyijing: { generalId: 'fujiwara_yuanyijing', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_06' }, // 屋岛冲夜袭
    kakizaki_liqiqingguang: { generalId: 'kakizaki_liqiqingguang', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 虾夷边境守反击
    ayinu_hushemoquan: { generalId: 'ayinu_hushemoquan', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 阿伊努战：绝境奋起
    so_zongyizhi: { generalId: 'so_zongyizhi', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 对朝奇袭
    taira_pingzhisheng: { generalId: 'taira_pingzhisheng', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_06' }, // 坛浦决战水师覆没前死战（非④）
    // ── 朝鲜 ──
    joseon_lichenggui: { generalId: 'joseon_lichenggui', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 威化岛斩首奇袭
    gaogouli_yizhiwende: { generalId: 'gaogouli_yizhiwende', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_06' }, // 萨水之战以逸待劳破隋
    baiji_jiebai: { generalId: 'baiji_jiebai', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 车昌野隘突击
    zhen_zhenxuan: { generalId: 'zhen_zhenxuan', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 断粮离间后会战
    danluo_jintongjing: { generalId: 'danluo_jintongjing', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 金通精守城逆袭
    sambyeol_lishunchen: { generalId: 'sambyeol_lishunchen', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_06' }, // 鸣梁海龟船诱敌待发
    gaya_jinshoulu: { generalId: 'gaya_jinshoulu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 金官伽倻筑城
    woju_yinguan: { generalId: 'woju_yinguan', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_03' }, // 勿里伐高句丽久战拖敌
    xuantu_yuangaisuwen: { generalId: 'xuantu_yuangaisuwen', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_08' }, // 安市围城守城破唐
    ssangseong_cuiying: { generalId: 'ssangseong_cuiying', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 太宗条外长城据守
    ssangseong_lizichun: { generalId: 'ssangseong_lizichun', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 李子春哀兵
    chungju_d_quanli: { generalId: 'chungju_d_quanli', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_08' }, // 幸州大捷·据垒守城
    sabeol_jinshimin: { generalId: 'sabeol_jinshimin', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_08' }, // 晋州大捷·守城战死
    // ── 东北
    manzhou_d_duergan: { generalId: 'manzhou_d_duergan', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_03' }, // 山海关入关闪击
    dajin_wanyanaguda: { generalId: 'dajin_wanyanaguda', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_01' }, // 阿骨打破辽神速
    wuliangha_zhelemei: { generalId: 'wuliangha_zhelemei', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_01' }, // 者勒蔑轻骑奇袭救主（未挂势）
    unassigned_naierbuhua: { generalId: 'unassigned_naierbuhua', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 永乐北伐兀良哈败乃儿不花
    fuyu_weichoutai: { generalId: 'fuyu_weichoutai', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 扶余据城固守
    jurchen_wanyanzongbi: { generalId: 'jurchen_wanyanzongbi', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 郾城铁浮屠平原突击（@女真五国城）
    aisin_d_huangtaiji: { generalId: 'aisin_d_huangtaiji', tier: 'famous', tacticalSkillId: 'tac_04', strategicSkillId: 'str_03' }, // 松锦战后洪承畴部归降
    mohe_wanyanzonghan: { generalId: 'mohe_wanyanzonghan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 攻破汴京
    unassigned_tanshihuai: { generalId: 'unassigned_tanshihuai', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 鲜卑草原长途奔袭
    suolun_bomuboguoer: { generalId: 'suolun_bomuboguoer', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 索伦部反清死战
    dongxia_puxianwannu: { generalId: 'dongxia_puxianwannu', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 割据辽东建立东夏国
    wula_buzhantai: { generalId: 'wula_buzhantai', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 断粮后会战
    yehe_jintaiji: { generalId: 'yehe_jintaiji', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 金太祖哀兵逆袭
    keerqin_aoba: { generalId: 'keerqin_aoba', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 科尔沁奥巴归附后骑袭
    wure_wuzhaodu: { generalId: 'wure_wuzhaodu', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 元末断粮破敌
    houliao_yelvliuge: { generalId: 'houliao_yelvliuge', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 涿州筑垒固守
    unassigned_wangtai: { generalId: 'unassigned_wangtai', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 王台部寨固守
    jinzhou_lichengliang: { generalId: 'jinzhou_lichengliang', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 擒王杲、破阿台奇袭
    zu_d_zudashou: { generalId: 'zu_d_zudashou', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_08' }, // 宁远锦州·红夷炮坚壁守城
    wanzhou_shangguankui: { generalId: 'wanzhou_shangguankui', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 万州天生城抗元
    chenzhou_d_zhanggao: { generalId: 'chenzhou_d_zhanggao', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 辰州戍守
    mao_wenlong_maowenlong: { generalId: 'mao_wenlong_maowenlong', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 皮岛东江据岛固守
    dawoer_baldaqi: { generalId: 'dawoer_baldaqi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 精奇里江达斡尔首领归附清朝
    heishui_nishuli: { generalId: 'heishui_nishuli', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 黑水靺鞨首领唐黑水都督
    yeren_nvzhen_boke: { generalId: 'yeren_nvzhen_boke', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 索伦副都统雅克萨之战
    wuji_yilizhi: { generalId: 'wuji_yilizhi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 勿吉首领朝贡北魏
    jilin_fujun: { generalId: 'jilin_fujun', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 吉林将军屯田戍边
    dongdan_yelvbei: { generalId: 'dongdan_yelvbei', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 东丹王以敖东城为都
    kuye_kuye_qiuzhang: { generalId: 'kuye_kuye_qiuzhang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 库页岛费雅喀
    sushen_tudiji: { generalId: 'sushen_tudiji', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 靺鞨首领突地稽归唐
    yilou_naoya: { generalId: 'yilou_naoya', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 挹娄首领助战高句丽
    maomingan_gentemuer: { generalId: 'maomingan_gentemuer', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 达斡尔酋长格尔必齐
    unassigned_kaolangwu: { generalId: 'unassigned_kaolangwu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 囊哈儿卫指挥考郎兀
    unassigned_hazheng: { generalId: 'unassigned_hazheng', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 兀列河卫哈正诺托罗
    unassigned_hudamu: { generalId: 'unassigned_hudamu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 野人女真忽答木盆奴里
    unassigned_mangka: { generalId: 'unassigned_mangka', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 费雅喀族长莽喀普禄
    unassigned_xiyangha: { generalId: 'unassigned_xiyangha', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 女真大酋长西阳哈瓦伦
    hezhe_sharhuda: { generalId: 'hezhe_sharhuda', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_03' }, // 宁古塔章京击退俄军斯捷潘诺夫
    liao_d_yelvabaoji: { generalId: 'liao_d_yelvabaoji', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 统一契丹灭渤海
    yel_yelvxiuge: { generalId: 'yel_yelvxiuge', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 满城大败宋师以逸待劳
    yizhou_wanyanloushi: { generalId: 'yizhou_wanyanloushi', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 富平之战大破张浚五路宋军
    unassigned_shilu: { generalId: 'unassigned_shilu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 完颜始祖据黑水故地
    unassigned_menglelun: { generalId: 'unassigned_menglelun', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 雅克萨达斡尔据寨
    unassigned_yilv: { generalId: 'unassigned_yilv', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 义律部哀兵守境
        wuzhou_liguang: { generalId: 'wuzhou_liguang', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 飞将军雁门
    yuwen_yuwentai: { generalId: 'yuwen_yuwentai', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 沙苑以少胜多
    wala_yexian: { generalId: 'wala_yexian', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 土木之变
// ── 草原区 2026-06-18 ──
    unassigned_yelvdeguang: { generalId: 'unassigned_yelvdeguang', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 灭后唐取汴京
    kumo_xiwanghuilibao: { generalId: 'kumo_xiwanghuilibao', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 奚王自立，决死抗战
    geluolu_chisipijia: { generalId: 'geluolu_chisipijia', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 葛逻禄纵横西域外交
    ogodei_chuormahan: { generalId: 'ogodei_chuormahan', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_01' }, // 西征波斯快速穿插
    merkit_tuoheituoa: { generalId: 'merkit_tuoheituoa', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 蔑儿乞十余年死战成吉思汗
    tumed_andahan: { generalId: 'tumed_andahan', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 庚戌之变长驱围北京
    kiyad_yesugai: { generalId: 'kiyad_yesugai', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_01' }, // 也速该草原奔袭
    unassigned_mahamu: { generalId: 'unassigned_mahamu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 忽兰忽失温后重整
    xiajiasi_are: { generalId: 'xiajiasi_are', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_01' }, // 黠戛斯灭回鹘神速
    xiongnu_maodun: { generalId: 'xiongnu_maodun', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_03' }, // 白登围刘邦以逸待劳
    murong_murongke: { generalId: 'murong_murongke', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 廉台之战连环马灭冉魏
    wuhuan_tadun: { generalId: 'wuhuan_tadun', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 白狼山死战曹操
    yuan_d_hubilie: { generalId: 'yuan_d_hubilie', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_03' }, // 襄阳围城六年灭宋
    mengwu_hebulerhan: { generalId: 'mengwu_hebulerhan', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 蒙兀山城抗金
    shatuo_likeyong: { generalId: 'shatuo_likeyong', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 飞虎子骑突黄巢
    xueyantuo_yinan: { generalId: 'xueyantuo_yinan', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 薛延陀脱离西突厥待机立国
    unassigned_pijiaquekehan: { generalId: 'unassigned_pijiaquekehan', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 回纥漠北固基
    kereyid_wanghan: { generalId: 'kereyid_wanghan', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 克烈部固守草原霸主
    naiman_taiyanghan: { generalId: 'naiman_taiyanghan', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 乃蛮末代决战哀兵
    tatar_mieguzhen: { generalId: 'tatar_mieguzhen', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 塔塔儿长期死战蒙古
    tushetu_tuxietuhan: { generalId: 'tushetu_tuxietuhan', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 土谢图固守部境
    zhasaketu_zhasaketuhan: { generalId: 'zhasaketu_zhasaketuhan', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 扎萨克图外交周旋
    gaoche_afuzhiluo: { generalId: 'gaoche_afuzhiluo', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_01' }, // 高车西迁先稳后打
    tujue_ashinatumen: { generalId: 'tujue_ashinatumen', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 突厥灭柔然铁骑突击
    da_yuan_kuokuotiemuer: { generalId: 'da_yuan_kuokuotiemuer', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 北元山地游击抗明
    yujiulu_yujiulv: { generalId: 'yujiulu_yujiulv', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 柔然南下围魏帝
    yaoluoge_yaoluogepusa: { generalId: 'yaoluoge_yaoluogepusa', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 药罗葛早期周旋
    jalair_muhuali: { generalId: 'jalair_muhuali', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_03' }, // 太师国王稳步经略中原
    hongirad_dexuechan: { generalId: 'hongirad_dexuechan', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 弘吉剌部固守
    choros_tuohuan: { generalId: 'choros_tuohuan', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 脱欢统一卫拉特待机
    tiele_qibiheli: { generalId: 'tiele_qibiheli', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_06' }, // 征高句丽水陆并进
    ashide_ashidejieli: { generalId: 'ashide_ashidejieli', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 颉利南下奇袭渭水
    duolu_ashinahelu: { generalId: 'duolu_ashinahelu', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 西突厥十姓外交整合
    cheshihou_cheshihouwang: { generalId: 'cheshihou_cheshihouwang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 车师后王固守
    kaerka_abadaikehan: { generalId: 'kaerka_abadaikehan', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 喀尔喀统一待变
    huyan_huyanwang: { generalId: 'huyan_huyanwang', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 呼衍王西域游击
    chahar_lindanhan: { generalId: 'chahar_lindanhan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_01' }, // 整合右翼蒙古诸部
    ongut_alagusi: { generalId: 'ongut_alagusi', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 汪古部外交附蒙
    rouran_shelun: { generalId: 'rouran_shelun', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_01' }, // 柔然脱鲜卑神速立国
    chagatai_tuhulutiemuer: { generalId: 'chagatai_tuhulutiemuer', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 东察合台统一蒙兀儿斯坦
    huihu_dongmohedagan: { generalId: 'huihu_dongmohedagan', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 回鹘·合骨咄禄毗伽可汗
    huige_gulipeiluo: { generalId: 'huige_gulipeiluo', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 骨力裴罗统一回鹘诸部
    huizhou_zhugeliang: { generalId: 'huizhou_zhugeliang', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 诸葛亮元戎弩
    pulei_dougu: { generalId: 'pulei_dougu', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 蒲类海大破北匈奴呼衍王
    xibo_d_zakulan: { generalId: 'xibo_d_zakulan', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 锡伯神箭手传说
    pugu_puguhuaien: { generalId: 'pugu_puguhuaien', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_03' }, // 平乱后叛唐据守

    pugu_ashinagudulu: { generalId: 'pugu_ashinagudulu', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_03' }, // 后突厥汗国重建者
    kelie_zhaheganbu: { generalId: 'kelie_zhaheganbu', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 克烈部游击混战
    borjigin_tuolei: { generalId: 'borjigin_tuolei', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 三峰山奇袭灭金主力
    zhadalan_zhamuhe: { generalId: 'zhadalan_zhamuhe', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 十三翼之战正面击溃铁木真
    zhuerqi_sachabieqi: { generalId: 'zhuerqi_sachabieqi', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 主儿乞部决战
    chechen_chechenhanshuolei: { generalId: 'chechen_chechenhanshuolei', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 车臣部驻牧固守
        kepantuo_hanritianzhong: { generalId: 'kepantuo_hanritianzhong', tier: 'ordinary', tacticalSkillId: 'tac_10' },
    huite_amuersana: { generalId: 'huite_amuersana', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' },
    unassigned_yuchiyao: { generalId: 'unassigned_yuchiyao', tier: 'ordinary', tacticalSkillId: 'tac_10' },
    xingxingxia_zhangyao_x: { generalId: 'xingxingxia_zhangyao_x', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' },
    xingxingxia_guoxiaoke: { generalId: 'xingxingxia_guoxiaoke', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 郭孝恪置死地
// ── 西域区 2026-06-18 ──
    shache_xian_suoche_wang: { generalId: 'shache_xian_suoche_wang', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 莎车王纵横西域外交
    yao_liuyuan: { generalId: 'yao_liuyuan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' },
    kong_d_kongrong: { generalId: 'kong_d_kongrong', tier: 'ordinary', tacticalSkillId: 'tac_10' },
    tongma_liuang: { generalId: 'tongma_liuang', tier: 'ordinary', tacticalSkillId: 'tac_08' },
    yanchuan_d_hanyu: { generalId: 'yanchuan_d_hanyu', tier: 'ordinary', tacticalSkillId: 'tac_09' },
    guide_d_xiaohe: { generalId: 'guide_d_xiaohe', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 萧何深沟高垒
    tongzhou_yangzhiji: { generalId: 'tongzhou_yangzhiji', tier: 'ordinary', tacticalSkillId: 'tac_10' },
    unassigned_chenpan: { generalId: 'unassigned_chenpan', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 疏勒王联汉奇袭
    dzungar_gaerdancelin: { generalId: 'dzungar_gaerdancelin', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 和通泊以逸待劳歼清军
    anxi_guoxin: { generalId: 'anxi_guoxin', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_08' }, // 安西孤城坚守半世纪
    yanqi_longtuqizhi: { generalId: 'yanqi_longtuqizhi', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 焉耆王劫掠商道游击
    tuerhute_wobaxi: { generalId: 'tuerhute_wobaxi', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_01' }, // 土尔扈特万里东归
    gaochang_quwentai: { generalId: 'gaochang_quwentai', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 高昌王据城抗唐
    yarkand_abuladitifu: { generalId: 'yarkand_abuladitifu', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 叶尔羌名将死战准清
    yiduhu_baershu: { generalId: 'yiduhu_baershu', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 亦都护外交归附蒙古
    yuchi_weichiyao: { generalId: 'yuchi_weichiyao', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_08' }, // 于阗王入唐勤王守城
    zhuxie_zhuxiechixin: { generalId: 'zhuxie_zhuxiechixin', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 朱邪赤心骑破庞勋
    saman_yisimayi: { generalId: 'saman_yisimayi', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 萨曼埃米尔巴尔赫以逸待劳
    kala_satuke: { generalId: 'kala_satuke', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 喀喇汗圣战统一
    tujishi_sulukehan: { generalId: 'tujishi_sulukehan', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 突骑施公牛抗阿拉伯
    xiliao_yelvdashi: { generalId: 'xiliao_yelvdashi', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_01' }, // 西辽西迁卡特万以少胜多
    jiazini_mahamaode: { generalId: 'jiazini_mahamaode', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 马哈茂德十七征印度
    an_xibanni: { generalId: 'an_xibanni', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 昔班尼攻布哈拉建汗国
    wusun_liejiaomi: { generalId: 'wusun_liejiaomi', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 乌孙昆莫西迁奇袭月氏
        xijue_ganshouchang: { generalId: 'xijue_ganshouchang', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_01' }, // 与陈汤六校分道共灭郅支

// ── 中亚区 2026-06-18 ──
    huarazim_mohemo: { generalId: 'huarazim_mohemo', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 花剌子模鼎盛
    kazakh_hasimu: { generalId: 'kazakh_hasimu', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 哈萨克汗国统一
    sogdian_dewasitiqi: { generalId: 'sogdian_dewasitiqi', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 粟特抗阿拉伯
    yanda_touluoman: { generalId: 'yanda_touluoman', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 嚈哒征服印度
    yada_ahexiong: { generalId: 'yada_ahexiong', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 嚈哒王破萨珊，杀卑路斯一世
    anushidgin_yile: { generalId: 'anushidgin_yile', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 花剌子模沙抗西辽
    unassigned_muhanmodeguli: { generalId: 'unassigned_muhanmodeguli', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_03' }, // 第二次塔兰战役佯败破印军
    jibin_jianisejia: { generalId: 'jibin_jianisejia', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 迦腻色迦夏都迦毕试，贵霜极盛野战征服
    qincha_baqiman: { generalId: 'qincha_baqiman', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 钦察游击抗蒙
    dayuan_wugua: { generalId: 'dayuan_wugua', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 大宛王抗汉
    kokand_alimukuli: { generalId: 'kokand_alimukuli', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 浩罕抗俄
    unassigned_agubai: { generalId: 'unassigned_agubai', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 哲德沙尔建国
    dayuzi_yinalechihei: { generalId: 'dayuzi_yinalechihei', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 讹答剌守城
    shi_clan_moheduotutun: { generalId: 'shi_clan_moheduotutun', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 石国王·唐册封吐屯
    mamon_mameng: { generalId: 'mamon_mameng', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_03' }, // 马蒙起兵夺哈里发
    jie_sijinti: { generalId: 'jie_sijinti', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 羯霜那·唐册封史国王
    unassigned_shaboluo: { generalId: 'unassigned_shaboluo', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 十箭部落西突厥
    maer_d_bahelamuchubin: { generalId: 'maer_d_bahelamuchubin', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 萨珊名将·呼罗珊边境机动作战
    wugu_d_tugelile: { generalId: 'wugu_d_tugelile', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 1040丹达内克胜伽色尼建塞尔柱
    loulan_suojie: { generalId: 'loulan_suojie', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 精绝屯田戍边抗北匈奴
    adao_d_mafushou: { generalId: 'adao_d_mafushou', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 昆岗军台守驿
    wuyuan_d_chengui: { generalId: 'wuyuan_d_chengui', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 度辽将军守五原北塞
    chenli_d_wutang: { generalId: 'chenli_d_wutang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 度辽将军护南匈奴
    nuoyan_d_sanyinnuoyan: { generalId: 'nuoyan_d_sanyinnuoyan', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 赛音诺颜部
    wuli_d_celeng: { generalId: 'wuli_d_celeng', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 定边左副将军乌里雅苏台
    wudu_zhangyi: { generalId: 'wudu_zhangyi', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 蜀汉后期名将
    baishui_yanghuai: { generalId: 'baishui_yanghuai', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 白水关守将
    dangzhou_dengai: { generalId: 'dangzhou_dengai', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 偷渡阴平裹毡滚崖灭蜀
    jiluo_d_douxian: { generalId: 'jiluo_d_douxian', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 燕然勒石破北匈奴
    unassigned_qizhijian: { generalId: 'unassigned_qizhijian', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 东汉鲜卑大人寇边
    heisha_d_houlilu: { generalId: 'heisha_d_houlilu', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 匈奴右贤王自立单于
    khoja_apakhoja: { generalId: 'khoja_apakhoja', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 白山派领袖据守休循
    fanyanna_fanyanna_wang: { generalId: 'fanyanna_fanyanna_wang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 梵衍那王率僧兵御大食
    kangju_chebishi: { generalId: 'kangju_chebishi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 石国王车鼻施康卡
    zhaowu_timuermieli: { generalId: 'zhaowu_timuermieli', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 忽毡英雄装甲战船抗蒙古
    qiepantuo_humi_wang: { generalId: 'qiepantuo_humi_wang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 护密王守瓦罕走廊
    // ── 中国将·西域 2026-06-18 ──
    quli_chentang: { generalId: 'quli_chentang', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_01' }, // 建昭三年六校分道诛郅支于都赖水
    nandou_sushili: { generalId: 'nandou_sushili', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 小勃律王据守孽多
    unassigned_genggong: { generalId: 'unassigned_genggong', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 疏勒孤军苦撑
    juandu_peixingjian: { generalId: 'juandu_peixingjian', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_03' }, // 计擒都支兵不血刃
    
// ── 青藏区 2026-06-18 ──
    tubo_songzanganbu: { generalId: 'tubo_songzanganbu', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 统一青藏
    song2_houjunji: { generalId: 'song2_houjunji', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_03' }, // 松州破吐蕃
    gurkha_baduersaye: { generalId: 'gurkha_baduersaye', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 廓尔喀侵藏
    gongbu_gongbumangbuzhi: { generalId: 'gongbu_gongbumangbuzhi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 工布小王
    khon_basiba: { generalId: 'khon_basiba', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 萨迦帝师
    xiadun_xiazhongawanglangjie: { generalId: 'xiadun_xiazhongawanglangjie', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 不丹建国
    gar_lunqinling: { generalId: 'gar_lunqinling', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 大非川以逸待劳破薛仁贵
    duomi_lunkongre: { generalId: 'duomi_lunkongre', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 吐蕃末将
    dulan_dashibatuer: { generalId: 'dulan_dashibatuer', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 青海蒙古亲王
    tufa_d_tufanutan: { generalId: 'tufa_d_tufanutan', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 南凉君主
    qifu_d_qifuchipan: { generalId: 'qifu_d_qifuchipan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 西秦灭南凉
    tuyu_d_kualv: { generalId: 'tuyu_d_kualv', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 吐谷浑可汗
    anding_wei_buyantiemuer: { generalId: 'anding_wei_buyantiemuer', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 安定王
    gaxa_zhashiduanzhubu: { generalId: 'gaxa_zhashiduanzhubu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 噶厦代本
    jinchuan_g_shaluoben: { generalId: 'jinchuan_g_shaluoben', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 金川固守
    xiangxiong_limixia_x: { generalId: 'xiangxiong_limixia_x', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 象雄末王
    ladakh_senggelangjie: { generalId: 'ladakh_senggelangjie', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 拉达克王
    khoshut_gushihan: { generalId: 'khoshut_gushihan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 和硕特入藏
    nvguo_mojie: { generalId: 'nvguo_mojie', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 女国女王
    karmapa_queyingduoji: { generalId: 'karmapa_queyingduoji', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 噶玛巴活佛
    xianlingqiang_dianling: { generalId: 'xianlingqiang_dianling', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 先零羌
    shaodang_mitang: { generalId: 'shaodang_mitang', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 烧当羌
    lang_clan_jiangqujianzan: { generalId: 'lang_clan_jiangqujianzan', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 帕竹立国
    xiutu_xiutuwang: { generalId: 'xiutu_xiutuwang', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 休屠王
    gandenpozhang_dibasangjiejiacuo: { generalId: 'gandenpozhang_dibasangjiejiacuo', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 第巴摄政
    khyungpo_qiongbobangse: { generalId: 'khyungpo_qiongbobangse', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 吐蕃大论
    gar_kham_dengbazeren: { generalId: 'gar_kham_dengbazeren', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 德格土司
    lanzhou_zhaochongguo: { generalId: 'lanzhou_zhaochongguo', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 河湟屯田平羌
    supi_xinuoluo: { generalId: 'supi_xinuoluo', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 苏毗附唐
    tsangpa_pengcuonanjie: { generalId: 'tsangpa_pengcuonanjie', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 藏巴汗立国
    spurgyal_dariniansai: { generalId: 'spurgyal_dariniansai', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 悉补野奠基
    galangdiba_wangqindundui: { generalId: 'galangdiba_wangqindundui', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 波密抗清
    fuguo_yizeng: { generalId: 'fuguo_yizeng', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 附国王
    bailang_tangzeng: { generalId: 'bailang_tangzeng', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 白狼王
    humi_humiwang: { generalId: 'humi_humiwang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 护密王
    xiaobolu_meijinmang: { generalId: 'xiaobolu_meijinmang', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 小勃律破吐蕃
    guge_chizhaxichabade: { generalId: 'guge_chizhaxichabade', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 古格末王
    pazhu_redangunsangpa: { generalId: 'pazhu_redangunsangpa', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 江孜法王
  // ── 滇缅区 2026-06-18 ──
    chenla_sheyebamoqishi: { generalId: 'chenla_sheyebamoqishi', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 驱逐占婆收复吴哥
    dali_duansiping: { generalId: 'dali_duansiping', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 灭大义宁建大理
    dongxu_mangruiti: { generalId: 'dongxu_mangruiti', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 统一缅甸中南部
    mu_lijiang_muzeng: { generalId: 'mu_lijiang_muzeng', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 木天王拓土
    dianguo_zhuangqiao: { generalId: 'dianguo_zhuangqiao', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 威定滇池王滇
    konbaung_yongjiya: { generalId: 'konbaung_yongjiya', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 贡榜复国
    nanzhao_geluofeng: { generalId: 'nanzhao_geluofeng', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 天宝战争击唐
    wuman_cuanguiwang: { generalId: 'wuman_cuanguiwang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 东爨乌蛮首领
    dai_daoyingmeng: { generalId: 'dai_daoyingmeng', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 车里宣慰征缅
    taiyuan_manglai: { generalId: 'taiyuan_manglai', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 兰纳灭哈里奔猜
    suke_langanheng: { generalId: 'suke_langanheng', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 素可泰扩张
    luchuan_sirenfa: { generalId: 'luchuan_sirenfa', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 麓川大败明军
    kunming_yi_lucheng: { generalId: 'kunming_yi_lucheng', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 昆明夷斩类牢
    cuanshi_cuanlongyan: { generalId: 'cuanshi_cuanlongyan', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 爨氏镇南中
    baiman_gaoshengtai: { generalId: 'baiman_gaoshengtai', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 大理权相
    champa_zhipenge: { generalId: 'champa_zhipenge', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_06' }, // 占婆水师破越
    qiong_rengui: { generalId: 'qiong_rengui', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 邛谷王据郡
    hantawadi_mangyinglong: { generalId: 'hantawadi_mangyinglong', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 东吁帝国鼎盛
      daozhou_yangzaixing: { generalId: 'daozhou_yangzaixing', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 麦岭关
  // ── 岭南/越南/台湾区 2026-06-18 ──
    guangzhou_liuyin: { generalId: 'guangzhou_liuyin', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 清海军节度岭南
    luoping_zhangshijie: { generalId: 'luoping_zhangshijie', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_06' }, // 崖山海战
    chaozhou_d_mafa: { generalId: 'chaozhou_d_mafa', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 马发潮州
    chendiaoyan_chendiaoyan: { generalId: 'chendiaoyan_chendiaoyan', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 漳州抗元
    dengmaoqi_dengmaoqi: { generalId: 'dengmaoqi_dengmaoqi', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 铲平王起义
    geng_gengjingzhong: { generalId: 'geng_gengjingzhong', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 靖南王叛清
    longwu_huangdaozhou: { generalId: 'longwu_huangdaozhou', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 隆武抗清
    jing_dingbuling: { generalId: 'jing_dingbuling', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 丁朝统一
    paiwan_alugu: { generalId: 'paiwan_alugu', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 牡丹社抗倭
    ming_zheng_zhengchenggong: { generalId: 'ming_zheng_zhengchenggong', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_06' }, // 收复台湾
    unassigned_ruanhuang: { generalId: 'unassigned_ruanhuang', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 广南奠基
    zhuang_d_washifuren: { generalId: 'zhuang_d_washifuren', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 俍兵抗倭
    nanyue_zhaotuo: { generalId: 'nanyue_zhaotuo', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 南越武王·绝道聚兵守五岭
    zhancheng_zhimin: { generalId: 'zhancheng_zhimin', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 占城王和亲
    xiou_yixusong: { generalId: 'xiou_yixusong', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 西瓯抗秦
    gouding_wubo: { generalId: 'gouding_wubo', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 句町助汉
    chen_chenbaxian: { generalId: 'chen_chenbaxian', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_06' }, // 陈朝开国
    dayu_wangshouren: { generalId: 'dayu_wangshouren', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 平定南赣
    paiyao_huanggua4: { generalId: 'paiyao_huanggua4', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 排瑶起义
    yingzhou_liulong_ying: { generalId: 'yingzhou_liulong_ying', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 南汉高祖
    linyi_fanyangmai: { generalId: 'linyi_fanyangmai', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 林邑王抗南朝
    xian_d_xianfuren: { generalId: 'xian_d_xianfuren', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 俚人平定岭南
    luodian_shexiang: { generalId: 'luodian_shexiang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 水西土司
    nong2_nongzhigao: { generalId: 'nong2_nongzhigao', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 侬峒反宋
    guizhou_lidingguo: { generalId: 'guizhou_lidingguo', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 两蹶名王
    taiping_shidakai: { generalId: 'taiping_shidakai', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 翼王征战
    dongzu_wumian: { generalId: 'dongzu_wumian', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 侗族起义
    tian_sizhou_tianyougong: { generalId: 'tian_sizhou_tianyougong', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 思州土官
    luoyue_zhengce: { generalId: 'luoyue_zhengce', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 骆越反汉
    li_s_mayuan: { generalId: 'li_s_mayuan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_06' }, // 伏波平交趾
    trinh_zhengsong: { generalId: 'trinh_zhengsong', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_03' }, // 郑主破莫
    dacheng_chenkai: { generalId: 'dacheng_chenkai', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 大成国起义
    dayue_chenguojun: { generalId: 'dayue_chenguojun', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_06' }, // 抗蒙三捷
    shengmiao_baoli_miao: { generalId: 'shengmiao_baoli_miao', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 苗民起义
    miao_qing_yangwanzhe: { generalId: 'miao_qing_yangwanzhe', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 苗军统帅
    unassigned_zhuyoulang: { generalId: 'unassigned_zhuyoulang', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 永历帝抗清
    xinjiang_maji: { generalId: 'xinjiang_maji', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 肇庆摧锋军抗元
    liren_funanshe: { generalId: 'liren_funanshe', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 黎族起义
    unassigned_liuyongfu: { generalId: 'unassigned_liuyongfu', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 黑旗抗法·丛林山地游击
    yelang_duotong: { generalId: 'yelang_duotong', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 夜郎王
    zangke_xielongyu: { generalId: 'zangke_xielongyu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 牂牁归唐
    xinggu_cuanxi: { generalId: 'xinggu_cuanxi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 兴古从征
    guangxin_shixie: { generalId: 'guangxin_shixie', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 交趾割据
    ryukyu_shangbazhi: { generalId: 'ryukyu_shangbazhi', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_06' }, // 琉球三山统一
    shaozhou_zhangzhensun: { generalId: 'shaozhou_zhangzhensun', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 韶关抗元·大庾岭殉国
    shixing_houandou: { generalId: 'shixing_houandou', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 陈朝开国元勋
    buyi_d_weichaoyuan: { generalId: 'buyi_d_weichaoyuan', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 布依起义
      lizhou_d_liaohua: { generalId: 'lizhou_d_liaohua', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 廖化置死地
      kui_gongsunshu: { generalId: 'kui_gongsunshu', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_08' }, // 公孙述白帝
    yang_bozhou_yangyinglong: { generalId: 'yang_bozhou_yangyinglong', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 播州末代
    chenghan_lite: { generalId: 'chenghan_lite', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 成汉开国
    jinchuan_x_suonuomu: { generalId: 'jinchuan_x_suonuomu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 小金川土司
    zuo_d_wufu_zd: { generalId: 'zuo_d_wufu_zd', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 明代平南中
    wumeng_azi_wm: { generalId: 'wumeng_azi_wm', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 乌蒙土司
// ── 巴蜀区 2026-06-18 ──
    unassigned_zhuran: { generalId: 'unassigned_zhuran', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_08' }, // 江陵守·名震敌国
    shu_liubei: { generalId: 'shu_liubei', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 刘备成都
    unassigned_weiyan: { generalId: 'unassigned_weiyan', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 略阳阳溪守汉中
    fengzhou_wujie: { generalId: 'fengzhou_wujie', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 和尚原仙人关守蜀口
    unassigned_baochao: { generalId: 'unassigned_baochao', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 霆军以寡击众
    qinghai_yuezhongqi: { generalId: 'qinghai_yuezhongqi', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 平罗卜藏丹津
    tujia_d_qinliangyu: { generalId: 'tujia_d_qinliangyu', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 白杆兵抗清
    shuixi_anbangyan: { generalId: 'shuixi_anbangyan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 奢安之乱
    chu_guanyu: { generalId: 'chu_guanyu', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_06' }, // 水淹七军
    xiangzhou_lvwenhuan: { generalId: 'xiangzhou_lvwenhuan', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_08' }, // 守襄阳六年抗元
    guo_jixin: { generalId: 'guo_jixin', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 荥阳诳楚
    unassigned_lidingguo_dx: { generalId: 'unassigned_lidingguo_dx', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 大西抗清
    zi_changhong: { generalId: 'zi_changhong', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 资中先贤
    yidou_luxun: { generalId: 'yidou_luxun', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_06' }, // 夷陵火攻
    unassigned_xiangyan: { generalId: 'unassigned_xiangyan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 楚将破李信
    zhongxiang_zhongxiang: { generalId: 'zhongxiang_zhongxiang', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 武陵钟相起义攻占州县
    hezhou_wangjian_dy: { generalId: 'hezhou_wangjian_dy', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_08' }, // 钓鱼城炮击蒙哥·守城36年
    qiuchi_yangnandang: { generalId: 'qiuchi_yangnandang', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 仇池拓土
    unassigned_shaluoben_x: { generalId: 'unassigned_shaluoben_x', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 金川抗清
    cong_puhu: { generalId: 'cong_puhu', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 宕渠賨人随张飞
    langzhou_zhangfei: { generalId: 'langzhou_zhangfei', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 瓦口关山道破张郃
    tan_d_tanhou: { generalId: 'tan_d_tanhou', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 土司起义
    xiang_d_xiangdakun: { generalId: 'xiang_d_xiangdakun', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 向王天子
    unassigned_tanhou_td: { generalId: 'unassigned_tanhou_td', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 慈利土司
    ran_d_ranshouzhong: { generalId: 'ran_d_ranshouzhong', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 酉阳土司
    wuxi_shamoke: { generalId: 'wuxi_shamoke', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 五溪蛮王
    kuai_kuaiyue: { generalId: 'kuai_kuaiyue', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 蒯氏谋士
    bandun_fanmu: { generalId: 'bandun_fanmu', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 板楯助汉
    she_shechongming: { generalId: 'she_shechongming', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 叙永奢崇明起兵反明
    boren_ada: { generalId: 'boren_ada', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 僰人末代
    unassigned_chendao: { generalId: 'unassigned_chendao', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 白毦兵断后
    unassigned_luoshao: { generalId: 'unassigned_luoshao', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 乌蒙土官
    jingmen_zhaoyun: { generalId: 'jingmen_zhaoyun', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 长坂坡救主
    unassigned_pengshichou: { generalId: 'unassigned_pengshichou', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 溪州铜柱
    miaomin_shiliudeng: { generalId: 'miaomin_shiliudeng', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 苗民起义
      xiqin_xuerengao: { generalId: 'xiqin_xuerengao', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 薛举据折墌抗唐
    beidi_sunang: { generalId: 'beidi_sunang', tier: 'ordinary', tacticalSkillId: 'tac_10' },
    baiyang_mengtian: { generalId: 'baiyang_mengtian', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 高阙塞长城戍守
  // ── 河西区 2026-06-18 ──
    didao_duanjiong: { generalId: 'didao_duanjiong', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 逢义山破羌·狄道
    suzhou_huoqubing: { generalId: 'suzhou_huoqubing', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_01' }, // 骠骑将军闪电战
    liangzhou_zhanggui: { generalId: 'liangzhou_zhanggui', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 前凉保全河西
    unassigned_lihao_dunhuang: { generalId: 'unassigned_lihao_dunhuang', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 西凉开国
    unassigned_xinqingji: { generalId: 'unassigned_xinqingji', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 破羌将军
    dashun_lizicheng: { generalId: 'dashun_lizicheng', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 大顺灭明
    zhai_han_dongyi: { generalId: 'zhai_han_dongyi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 翟王守上郡
    ganzhou_dourong: { generalId: 'ganzhou_dourong', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 河西五郡
    unassigned_zhaoponu: { generalId: 'unassigned_zhaoponu', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 破楼兰
    shazhou_zhangyichao: { generalId: 'shazhou_zhangyichao', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 归义收复河西
    dongshengwei_wangyue_ming: { generalId: 'dongshengwei_wangyue_ming', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 红盐池大捷
    guiyi_caoyijin: { generalId: 'guiyi_caoyijin', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 归义军节度使
    weiming_lijiaqian: { generalId: 'weiming_lijiaqian', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 西夏太祖
    unassigned_lisheng_tang: { generalId: 'unassigned_lisheng_tang', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 神策平泾原
    unassigned_chuliji: { generalId: 'unassigned_chuliji', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 崤函据守
    helian_helianbobo: { generalId: 'helian_helianbobo', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 统万城阳武
    chile_hulvjin: { generalId: 'chile_hulvjin', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 敕勒酋长
    chijin_qiewangshijia: { generalId: 'chijin_qiewangshijia', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 赤斤蒙古卫
    shuofang_weiqing: { generalId: 'shuofang_weiqing', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 取河南地
    woye_huangfugui: { generalId: 'woye_huangfugui', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 度辽将军平羌
    yeli_yeliwangrong: { generalId: 'yeli_yeliwangrong', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 定川寨破宋
    hunxie_hunxiewang: { generalId: 'hunxie_hunxiewang', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 浑邪降汉
    guazhou_zhangshougui: { generalId: 'guazhou_zhangshougui', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_08' }, // 瓜州空城破吐蕃
    kang_liangshidu: { generalId: 'kang_liangshidu', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 梁帝割据
    yingli_jilasiyi: { generalId: 'yingli_jilasiyi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 守应理抗蒙
    dangxiang_liyuanhao: { generalId: 'dangxiang_liyuanhao', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 好水川大捷
    huizhou_yaodui: { generalId: 'huizhou_yaodui', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 会州箭贯耳
    huan_zhongshidao: { generalId: 'huan_zhongshidao', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 种家将守边
    wei2_hunjian: { generalId: 'wei2_hunjian', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 朔方破吐蕃
    lingwu_guoziyi: { generalId: 'lingwu_guoziyi', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 中兴名将
    dingxiang_d_lijing: { generalId: 'dingxiang_d_lijing', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 贞观四年李靖率三千骑出恶阳岭夜袭定襄城
    xiayang_d_dengyu: { generalId: 'xiayang_d_dengyu', tier: 'famous', tacticalSkillId: 'tac_04', strategicSkillId: 'str_07' }, // 邓禹·云台二十八将之首·延揽英雄不战而屈
    ningkou_lubode: { generalId: 'ningkou_lubode', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_08' }, // 筑居延塞
    juyan_d_liling: { generalId: 'juyan_d_liling', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 荆楚五千步卒出居延战匈奴（《史记·李将军列传》）
    unassigned_liuquan: { generalId: 'unassigned_liuquan', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 隋破吐谷浑、河源积石屯田（《隋书·刘权传》）
    juqu_d_juqumengxun: { generalId: 'juqu_d_juqumengxun', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 北凉灭西凉
    // ── 中原区 2026-06-18 ──
    li_lx_d_lichong: { generalId: 'li_lx_d_lichong', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 秦陇西郡守·李氏始祖
    sunqin_sunchuanting: { generalId: 'sunqin_sunchuanting', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 潼关抗李自成
    tianxiong_tianchengsi: { generalId: 'tianxiong_tianchengsi', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 魏博藩镇
    ranwei_d_ranmin: { generalId: 'ranwei_d_ranmin', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 杀胡令
    jin_xianzhen: { generalId: 'jin_xianzhen', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 城濮崤山
    huangfu_huangfusong: { generalId: 'huangfu_huangfusong', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 平黄巾
    unassigned_masui: { generalId: 'unassigned_masui', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 洹水破田悦
    wang_d_wangdao: { generalId: 'wang_d_wangdao', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 王与马共天下
    chimei_fanchong: { generalId: 'chimei_fanchong', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 赤眉入长安
    zhengzhou_chenqingzhi: { generalId: 'zhengzhou_chenqingzhi', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 七千白袍入洛阳
    xichu_xiangyu: { generalId: 'xichu_xiangyu', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 巨鹿彭城
    wazhai_limi_wz: { generalId: 'wazhai_limi_wz', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 瓦岗夺兴洛仓
    jiaodong_tiandan: { generalId: 'jiaodong_tiandan', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_08' }, // 即墨守城五年·火牛破燕
    jibei_xuxuan_cm: { generalId: 'jibei_xuxuan_cm', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 赤眉丞相
    qi_qihuangong: { generalId: 'qi_qihuangong', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_03' }, // 尊王攘夷·九合诸侯
    huaiyang_zhouyafu: { generalId: 'huaiyang_zhouyafu', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_08' }, // 坚壁不出平七国
    yingzhou_d_liuqi: { generalId: 'yingzhou_d_liuqi', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 顺昌破金
    cao_d_caocao: { generalId: 'cao_d_caocao', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 官渡之战
    long2_weixiaokuan: { generalId: 'long2_weixiaokuan', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_08' }, // 玉壁之战·气死高欢
    dongxian_sunbin: { generalId: 'dongxian_sunbin', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 围魏救赵·马陵伏击
    mi_mizhu: { generalId: 'mi_mizhu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 资助刘备
    baibo_guotai_bb: { generalId: 'baibo_guotai_bb', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 白波军
    unassigned_geshuhan: { generalId: 'unassigned_geshuhan', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 潼关守将
    ruzhou_sunjian: { generalId: 'ruzhou_sunjian', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 江东猛虎·破虏将军
    yaozhou_limaozhen: { generalId: 'yaozhou_limaozhen', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 岐国军阀
    zhi_state_caocan: { generalId: 'zhi_state_caocan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 曹参身被七十创攻城略地功最多
    yiyang_d_mengzongzheng: { generalId: 'yiyang_d_mengzongzheng', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 三关之捷

    wuwu_d_lvmeng: { generalId: 'wuwu_d_lvmeng', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_06' }, // 白衣渡江
    yangshao_zhoubo: { generalId: 'yangshao_zhoubo', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_08' }, // 诛诸吕安刘氏固若金汤
    unassigned_liuyan_ly: { generalId: 'unassigned_liuyan_ly', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 舂陵起兵
    zhou_jifa: { generalId: 'zhou_jifa', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 武王伐纣
    quanrong_quanrongwang: { generalId: 'quanrong_quanrongwang', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 犬戎弑幽王
    unassigned_chairong: { generalId: 'unassigned_chairong', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 高平之战·殿前诸班
    ruo_wangjian: { generalId: 'ruo_wangjian', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_03' }, // 王翦灭楚灭赵：敌战计避实击虚+攻城拔寨
    unassigned_luhunrongwang: { generalId: 'unassigned_luhunrongwang', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 陆浑戎
    sizhou_hanshizhong: { generalId: 'sizhou_hanshizhong', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 黄天荡
    unassigned_diqing: { generalId: 'unassigned_diqing', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 面涅将军
    yin_dixin: { generalId: 'yin_dixin', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 纣王征东夷
    liwang_liguangbi: { generalId: 'liwang_liguangbi', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 太原守城·河间突骑
    han_baoyuan_han: { generalId: 'han_baoyuan_han', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 韩将暴鸢
    bailian_wangconger: { generalId: 'bailian_wangconger', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 白莲教起义
    shen_shenbo: { generalId: 'shen_shenbo', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 申国受封
    sima_d_simayi: { generalId: 'sima_d_simayi', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 冢虎
    unassigned_zhaoshe: { generalId: 'unassigned_zhaoshe', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 阏与之战
    huai_zhuyuanzhang: { generalId: 'huai_zhuyuanzhang', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 洪武大帝
    shangzhou_shangyang: { generalId: 'shangzhou_shangyang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 商鞅变法
    yue_d_yuefei: { generalId: 'yue_d_yuefei', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 郾城颍昌平原破铁浮屠
    unassigned_yuanshao: { generalId: 'unassigned_yuanshao', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 四世三公
    xinping_haozhao: { generalId: 'xinping_haozhao', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_08' }, // 陈仓守城·拒诸葛亮
    yuzhou_zuti: { generalId: 'yuzhou_zuti', tier: 'famous', tacticalSkillId: 'tac_04', strategicSkillId: 'str_03' }, // 杞桓公
    mengcheng_d_gaoqiong: { generalId: 'mengcheng_d_gaoqiong', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 澶渊主战
    liang_d_zhangxun: { generalId: 'liang_d_zhangxun', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_08' }, // 睢阳守城·杀妾犒军
    lulin_liuxiu: { generalId: 'lulin_liuxiu', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 昆阳之战三千破百万
    unassigned_fankuai: { generalId: 'unassigned_fankuai', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 鸿门宴
    hao_d_changyuchun: { generalId: 'hao_d_changyuchun', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 常十万
    bozhou_d_luzhonglian: { generalId: 'bozhou_d_luzhonglian', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 义不帝秦
    song_zhaokuangyin: { generalId: 'song_zhaokuangyin', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 陈桥兵变
    dang_d_zhuwen: { generalId: 'dang_d_zhuwen', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 后梁太祖
    // ── 北方区 2026-06-18 ──
    gongsun_d_gongsundu: { generalId: 'gongsun_d_gongsundu', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 辽东割据
    unassigned_yanganer2: { generalId: 'unassigned_yanganer2', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 红袄天顺
    xuan_mafang: { generalId: 'xuan_mafang', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 开国第一功臣
    tuoba_tuobagui: { generalId: 'tuoba_tuobagui', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 参合陂
    bing_liukun: { generalId: 'bing_liukun', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 晋阳孤守抗刘渊
    unassigned_zhangrou: { generalId: 'unassigned_zhangrou', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 保定重建
    qu_d_quyi: { generalId: 'qu_d_quyi', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 界桥先登破白马
    gaoqi_d_gaohuan: { generalId: 'gaoqi_d_gaohuan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 神武帝
    pingyuan_yanzhenqing: { generalId: 'pingyuan_yanzhenqing', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 平原抗安史
    hejian_gongsunzan: { generalId: 'hejian_gongsunzan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 白马义从
    linyu_wusangui: { generalId: 'linyu_wusangui', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 山海关
    unassigned_liangshidu_ls: { generalId: 'unassigned_liangshidu_ls', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 梁国割据
    liangshidu_longjia: { generalId: 'liangshidu_longjia', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 雕阴抗秦兵败
    yangshe_yangshezhi: { generalId: 'yangshe_yangshezhi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 铜鞮大夫
    guzhu_tianyu: { generalId: 'guzhu_tianyu', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 征北将军镇乌桓鲜卑
    dizhou_wangyanzhang: { generalId: 'dizhou_wangyanzhang', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 王铁枪乐安破晋
    dai_d_tuobashiyijian: { generalId: 'dai_d_tuobashiyijian', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 代国基业
    erzhu_erzhurong: { generalId: 'erzhu_erzhurong', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 滏口七千破三十万
    zhe_d_zheyuqing: { generalId: 'zhe_d_zheyuqing', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 子河汊破辽
    heng1_limu_yanyue: { generalId: 'heng1_limu_yanyue', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 雁门破匈奴
    yan_leyi: { generalId: 'yan_leyi', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_03' }, // 伐齐下七十城
    unassigned_zhongshiheng: { generalId: 'unassigned_zhongshiheng', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 环州筑城
    liguo_zhaoshe_zd: { generalId: 'liguo_zhaoshe_zd', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 阏与之战
    yunzhong_tuobaliwei: { generalId: 'yunzhong_tuobaliwei', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 拓跋始祖
    // ── 北方关隘 2026-06-19 ──
    you_wangba: { generalId: 'you_wangba', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 耿况上谷突骑
    unassigned_zhouyuji: { generalId: 'unassigned_zhouyuji', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 宁武殉国
    yi_yuqian: { generalId: 'yi_yuqian', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_08' }, // 京师保卫战·固若金汤
    huo_songlaosheng: { generalId: 'huo_songlaosheng', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 宋老生霍邑
        wuling_xiangdancheng: { generalId: 'wuling_xiangdancheng', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 武陵蛮反马援

// ── 江南区 2026-06-18 ──
    suzhou_d_shikefa: { generalId: 'suzhou_d_shikefa', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_08' }, // 扬州十日·孤城死守
    jiujiang_zhouyu: { generalId: 'jiujiang_zhouyu', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_06' }, // 赤壁火攻
    fangla_fangla_jn: { generalId: 'fangla_fangla_jn', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 圣公起义
    fang_guozhen_fangguozhen: { generalId: 'fang_guozhen_fangguozhen', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 方国珍割据浙东
    ouyue_zouyao: { generalId: 'ouyue_zouyao', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 东瓯王
    ruochu_doulian: { generalId: 'ruochu_doulian', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 若敖夜袭
    mi_chu_chuzhuangwang: { generalId: 'mi_chu_chuzhuangwang', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 邲之战
    unassigned_luxun_sunwu: { generalId: 'unassigned_luxun_sunwu', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_06' }, // 夷陵火攻·江陵镇守
    yue_goujian: { generalId: 'yue_goujian', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 卧薪尝胆
    heng_hetengjiao: { generalId: 'heng_hetengjiao', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 衡州抗清
    xushouhui_zhaopusheng: { generalId: 'xushouhui_zhaopusheng', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 双刀赵
    sui_yangjian: { generalId: 'sui_yangjian', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 隋文帝
    yang_aner_yanganer: { generalId: 'yang_aner_yanganer', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 杨安儿红袄军克登莱
    unassigned_mayin: { generalId: 'unassigned_mayin', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 马楚开国
    qi_d_qijiguang: { generalId: 'qi_d_qijiguang', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 戚继光横屿灭倭
    yezongliu_yezongliu: { generalId: 'yezongliu_yezongliu', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 叶宗留矿工起义
    zhangshicheng_zhangshicheng: { generalId: 'zhangshicheng_zhangshicheng', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 大周盐丁
    gumie_liuyu: { generalId: 'gumie_liuyu', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_06' }, // 却月阵水陆协同灭南燕
    hu_d_husansheng: { generalId: 'hu_d_husansheng', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 胡三省浙东义兵抗元
    unassigned_ganning: { generalId: 'unassigned_ganning', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_06' }, // 锦帆百骑
    wuyue_qianliu: { generalId: 'wuyue_qianliu', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 吴越开国
    qiufu_qiufu_jn: { generalId: 'qiufu_qiufu_jn', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 裘甫起义
    shenshi_shenqingzhi: { generalId: 'shenshi_shenqingzhi', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 沈氏老将
    huangwang_huangchao: { generalId: 'huangwang_huangchao', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 冲天大将军
    lujian_zhanghuangyan: { generalId: 'lujian_zhanghuangyan', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 鲁监抗清
    linshihong_linshihong: { generalId: 'linshihong_linshihong', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 楚帝鄱阳
        liu_yingbu: { generalId: 'liu_yingbu', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 九江王
    unassigned_wangchao: { generalId: 'unassigned_wangchao', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 光州入闽
    shuntian_linshuangwen: { generalId: 'shuntian_linshuangwen', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 顺天起义
    chunshen_huangxie: { generalId: 'chunshen_huangxie', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 春申君
    shanyue_sunce: { generalId: 'shanyue_sunce', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_06' }, // 江东小霸王·席卷六郡
    she_ethnic_leiwanxing: { generalId: 'she_ethnic_leiwanxing', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 畲民起义
    unassigned_pushougeng: { generalId: 'unassigned_pushougeng', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 泉州蒲氏
    wang_s_wanghua: { generalId: 'wang_s_wanghua', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 汪华保境
    kejia_wentianxiang: { generalId: 'kejia_wentianxiang', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 勤王抗元·闽粤赣募兵沾边客家
    tingzhou_d_chenmin: { generalId: 'tingzhou_d_chenmin', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 瑞金·陈敏破敌军抗元
    chu_d_lukang: { generalId: 'chu_d_lukang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 庐江太守守城抗孙策
    ying_caojingzong: { generalId: 'ying_caojingzong', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 梁郢州刺史据城退魏（《梁书·曹景宗传》）
    fu2_zhoudi: { generalId: 'fu2_zhoudi', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 陈周迪据临川拒讨
    ouyang_ouyangyi: { generalId: 'ouyang_ouyangyi', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 梁欧阳頠庐陵蛮兵
    unassigned_chunshenjun_h: { generalId: 'unassigned_chunshenjun_h', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 黄国后裔
    danyang_yuyunwen: { generalId: 'danyang_yuyunwen', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_06' }, // 采石大捷
    chizhou_wumingche: { generalId: 'chizhou_wumingche', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 太建北伐
    zhong_xiexuan: { generalId: 'zhong_xiexuan', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 淝水之战
    yuan_cj_d_yuanshu_zn: { generalId: 'yuan_cj_d_yuanshu_zn', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 仲家皇帝
    daxi_ming_zhangxianzhong: { generalId: 'daxi_ming_zhangxianzhong', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 大西王
    sunwu_d_sunquan: { generalId: 'sunwu_d_sunquan', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_06' }, // 赤壁抗曹
    zhao_lianpo: { generalId: 'zhao_lianpo', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 长平据守
// ── 2026-06-20 批量补充缺失档案 ──
    unassigned_liduozuo: {
        generalId: 'unassigned_liduozuo',
        tier: 'ordinary',
        tacticalSkillId: 'tac_06',
    },
    min_wangshenzhi: {
        generalId: 'min_wangshenzhi',
        tier: 'famous',
        tacticalSkillId: 'tac_02',
        strategicSkillId: 'str_01',
    },
    quanzhou_liucongxiao: {
        generalId: 'quanzhou_liucongxiao',
        tier: 'ordinary',
        tacticalSkillId: 'tac_08',
    },
    unassigned_yangyizhong: {
        generalId: 'unassigned_yangyizhong',
        tier: 'famous',
        tacticalSkillId: 'tac_04',
        strategicSkillId: 'str_03',
    },
    kaga_d_xiajianlaizheng: {
        generalId: 'kaga_d_xiajianlaizheng',
        tier: 'ordinary',
        tacticalSkillId: 'tac_10',
    },
    lelang_wangqi: {
        generalId: 'lelang_wangqi',
        tier: 'ordinary',
        tacticalSkillId: 'tac_06',
    },
    anmei_yuwandaqin: {
        generalId: 'anmei_yuwandaqin',
        tier: 'ordinary',
        tacticalSkillId: 'tac_07',
    },
    naju_d_wangjian_kr: {
        generalId: 'naju_d_wangjian_kr',
        tier: 'famous',
        tacticalSkillId: 'tac_03',
        strategicSkillId: 'str_03',
    },
    huimo_gaoyanshou: {
        generalId: 'huimo_gaoyanshou',
        tier: 'ordinary',
        tacticalSkillId: 'tac_09',
    },
    aola_menglielun: {
        generalId: 'aola_menglielun',
        tier: 'ordinary',
        tacticalSkillId: 'tac_10',
    },
    ewenki_bombogor: {
        generalId: 'ewenki_bombogor',
        tier: 'ordinary',
        tacticalSkillId: 'tac_06',
    },
    haixi_nvzhen_baiyindali: {
        generalId: 'haixi_nvzhen_baiyindali',
        tier: 'ordinary',
        tacticalSkillId: 'tac_07',
    },
    dazhen_wanyantiege: {
        generalId: 'dazhen_wanyantiege',
        tier: 'ordinary',
        tacticalSkillId: 'tac_08',
    },
    xianbei_tuobamao: {
        generalId: 'xianbei_tuobamao',
        tier: 'famous',
        tacticalSkillId: 'tac_04',
        strategicSkillId: 'str_04',
    },
    dada_ming_dayanhan: {
        generalId: 'dada_ming_dayanhan',
        tier: 'famous',
        tacticalSkillId: 'tac_05',
        strategicSkillId: 'str_05',
    },
    luzhou_zhangwenxiu: {
        generalId: 'luzhou_zhangwenxiu',
        tier: 'ordinary',
        tacticalSkillId: 'tac_06',
    },
    tuoming_tuomin: {
        generalId: 'tuoming_tuomin',
        tier: 'ordinary',
        tacticalSkillId: 'tac_07',
    },
    pisha_yuchisheng: {
        generalId: 'pisha_yuchisheng',
        tier: 'ordinary',
        tacticalSkillId: 'tac_08',
    },
    lu_zhangliao: {
        generalId: 'lu_zhangliao',
        tier: 'famous',
        tacticalSkillId: 'tac_03',
        strategicSkillId: 'str_06',
    },
    unassigned_angui: {
        generalId: 'unassigned_angui',
        tier: 'ordinary',
        tacticalSkillId: 'tac_10',
    },
    guangwu_xinwuxian: {
        generalId: 'guangwu_xinwuxian',
        tier: 'ordinary',
        tacticalSkillId: 'tac_09',
    },
    nguyen_guangnan_ruanfuying: {
        generalId: 'nguyen_guangnan_ruanfuying',
        tier: 'famous',
        tacticalSkillId: 'tac_02',
        strategicSkillId: 'str_01',
    },
    fushi_fuhong: {
        generalId: 'fushi_fuhong',
        tier: 'famous',
        tacticalSkillId: 'tac_03',
        strategicSkillId: 'str_03',
    },
    ba_bamanzi: {
        generalId: 'ba_bamanzi',
        tier: 'ordinary',
        tacticalSkillId: 'tac_08',
    },
    zhongshan_yangaoging: {
        generalId: 'zhongshan_yangaoging',
        tier: 'ordinary',
        tacticalSkillId: 'tac_10',
    },
    unassigned_duanxiushi: {
        generalId: 'unassigned_duanxiushi',
        tier: 'ordinary',
        tacticalSkillId: 'tac_06',
    },
    jinan_tiexuan: {
        generalId: 'jinan_tiexuan',
        tier: 'ordinary',
        tacticalSkillId: 'tac_07',
    },
    unassigned_guandingfu: {
        generalId: 'unassigned_guandingfu',
        tier: 'ordinary',
        tacticalSkillId: 'tac_08',
    },
    dixiang_wangmang: {
        generalId: 'dixiang_wangmang',
        tier: 'ordinary',
        tacticalSkillId: 'tac_09', // ⑨釜底抽薪（昆阳大败之主）
    },
    qing_wanyanchenheshang: {
        generalId: 'qing_wanyanchenheshang',
        tier: 'famous',
        tacticalSkillId: 'tac_03',
        strategicSkillId: 'str_03',
    },
    zhuozhou_anlushan: {
        generalId: 'zhuozhou_anlushan',
        tier: 'famous',
        tacticalSkillId: 'tac_01',
        strategicSkillId: 'str_04',
    },
    changshan_yanyangzhao: {
        generalId: 'changshan_yanyangzhao',
        tier: 'famous',
        tacticalSkillId: 'tac_02',
        strategicSkillId: 'str_05',
    },
    wangyan_wangyan_tx: {
        generalId: 'wangyan_wangyan_tx',
        tier: 'ordinary',
        tacticalSkillId: 'tac_10',
    },
    wu_sunwu: {
        generalId: 'wu_sunwu',
        tier: 'famous',
        tacticalSkillId: 'tac_04',
        strategicSkillId: 'str_06',
    },
    hongzhou_zhuwenzheng: {
        generalId: 'hongzhou_zhuwenzheng',
        tier: 'ordinary',
        tacticalSkillId: 'tac_10',
    },
    zhuqian_shaozizheng: {
        generalId: 'zhuqian_shaozizheng',
        tier: 'ordinary',
        tacticalSkillId: 'tac_06',
    },
    fu_zhou_yanyan: {
        generalId: 'fu_zhou_yanyan',
        tier: 'ordinary',
        tacticalSkillId: 'tac_10',
    },
    lushui_beigongboyu: {
        generalId: 'lushui_beigongboyu',
        tier: 'ordinary',
        tacticalSkillId: 'tac_09',
    },
    cen_d_cenmeng: {
        generalId: 'cen_d_cenmeng',
        tier: 'ordinary',
        tacticalSkillId: 'tac_08',
    },
    miao_amishi: {
        generalId: 'miao_amishi',
        tier: 'ordinary',
        tacticalSkillId: 'tac_09',
    },
    jiang_s_huanggai: {
        generalId: 'jiang_s_huanggai',
        tier: 'famous',
        tacticalSkillId: 'tac_03',
        strategicSkillId: 'str_06',
    }, // 赤壁苦肉计·火烧曹船·乘风破浪
    muong_shencongyue: {
        generalId: 'muong_shencongyue',
        tier: 'ordinary',
        tacticalSkillId: 'tac_10',
    },
    panyao_panhu: {
        generalId: 'panyao_panhu',
        tier: 'ordinary',
        tacticalSkillId: 'tac_09',
    },
    chen2_zhaofan: {
        generalId: 'chen2_zhaofan',
        tier: 'ordinary',
        tacticalSkillId: 'tac_09',
    },
    qian_songjingyang: {
        generalId: 'qian_songjingyang',
        tier: 'ordinary',
        tacticalSkillId: 'tac_10',
    },
    jiashi_lixuance: {
        generalId: 'jiashi_lixuance',
        tier: 'ordinary',
        tacticalSkillId: 'tac_09',
    },
    yangtong_chisongdezan: {
        generalId: 'yangtong_chisongdezan',
        tier: 'ordinary',
        tacticalSkillId: 'tac_08',
    },
    monpa_meireiluozhujiacuo: {
        generalId: 'monpa_meireiluozhujiacuo',
        tier: 'ordinary',
        tacticalSkillId: 'tac_10',
    },
    xining_yangyingju: {
        generalId: 'xining_yangyingju',
        tier: 'ordinary',
        tacticalSkillId: 'tac_10',
    },
    kalun_dexinga: {
        generalId: 'kalun_dexinga',
        tier: 'ordinary',
        tacticalSkillId: 'tac_10',
    },
    golog_wandezhaxi: {
        generalId: 'golog_wandezhaxi',
        tier: 'ordinary',
        tacticalSkillId: 'tac_09',
    },
    lopi_abo: {
        generalId: 'lopi_abo',
        tier: 'ordinary',
        tacticalSkillId: 'tac_09',
    },
    unassigned_donghuwang: {
        generalId: 'unassigned_donghuwang',
        tier: 'ordinary',
        tacticalSkillId: 'tac_09',
    },
    dingling_dinglingwang: {
        generalId: 'dingling_dinglingwang',
        tier: 'ordinary',
        tacticalSkillId: 'tac_09',
    },
    hui_bunaibou: {
        generalId: 'hui_bunaibou',
        tier: 'ordinary',
        tacticalSkillId: 'tac_09',
    },
    donghui_nanlv: {
        generalId: 'donghui_nanlv',
        tier: 'ordinary',
        tacticalSkillId: 'tac_09',
    },
    gonggu_gonggudaozhu: {
        generalId: 'gonggu_gonggudaozhu',
        tier: 'ordinary',
        tacticalSkillId: 'tac_10',
    },
    yizhi_yizhiwang: {
        generalId: 'yizhi_yizhiwang',
        tier: 'ordinary',
        tacticalSkillId: 'tac_10',
    },
    beihai_ayinuqiuzhang: {
        generalId: 'beihai_ayinuqiuzhang',
        tier: 'ordinary',
        tacticalSkillId: 'tac_09',
    },
    sheng_d_liyiqi: {
        generalId: 'sheng_d_liyiqi',
        tier: 'ordinary',
        tacticalSkillId: 'tac_07',
    },
    pyu_molingtuo: {
        generalId: 'pyu_molingtuo',
        tier: 'ordinary',
        tacticalSkillId: 'tac_10',
    },
    nongzhigao_huangshimi: {
        generalId: 'nongzhigao_huangshimi',
        tier: 'ordinary',
        tacticalSkillId: 'tac_10',
    },


    unassigned_weitou_wang: { generalId: 'unassigned_weitou_wang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ???
    unassigned_yumi_wang: { generalId: 'unassigned_yumi_wang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ???
    unassigned_qiemo_wang: { generalId: 'unassigned_qiemo_wang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ???
    unassigned_pishan_wang: { generalId: 'unassigned_pishan_wang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ???
    ruoqiang_ruoqiang_wang: { generalId: 'ruoqiang_ruoqiang_wang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ???
    unassigned_weili_wang: { generalId: 'unassigned_weili_wang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ???
    unassigned_bailong_shuai: { generalId: 'unassigned_bailong_shuai', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ?????
    unassigned_wensu_wang: { generalId: 'unassigned_wensu_wang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ???
    duerbote_duerbote_taiji: { generalId: 'duerbote_duerbote_taiji', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ??????
    unassigned_sai_wang: { generalId: 'unassigned_sai_wang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ??
    xiye_xiye_wang: { generalId: 'xiye_xiye_wang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ???
    unassigned_huibu_boke: { generalId: 'unassigned_huibu_boke', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ????
    unassigned_faqiang_wang: { generalId: 'unassigned_faqiang_wang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ???
    unassigned_kangba_tusi: { generalId: 'unassigned_kangba_tusi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ????
    unassigned_keliyaboke: { generalId: 'unassigned_keliyaboke', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ?????
    zhuoshi_zhuowangsun: { generalId: 'zhuoshi_zhuowangsun', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ???
    unassigned_yongguo_jun: { generalId: 'unassigned_yongguo_jun', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ????
    xingliao_dayanlin: { generalId: 'xingliao_dayanlin', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ??????
    unassigned_jingcheng_fushi: { generalId: 'unassigned_jingcheng_fushi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ????
    unassigned_wangmang: { generalId: 'unassigned_wangmang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ????

    xihai_d_fulianchou: { generalId: 'xihai_d_fulianchou', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 吐谷浑可汗伏俟城

    unassigned_yaerbeige: { generalId: 'unassigned_yaerbeige', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 雅尔贝格

    guzgan_abulihalisi: { generalId: 'guzgan_abulihalisi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 法里贡埃米尔法里亚布
    badakhshan_luozhentan: { generalId: 'badakhshan_luozhentan', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 唐护密国王法扎巴德
    kawusi_haidaer: { generalId: 'kawusi_haidaer', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 卡乌斯之子阿夫申吉扎克
    xianhai_shamalike: { generalId: 'xianhai_shamalike', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 乌古斯叶护养吉干
    wuhu_dukake: { generalId: 'wuhu_dukake', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 铁弓苏巴什真珠河
    unassigned_farighun: { generalId: 'unassigned_farighun', tier: 'ordinary', tacticalSkillId: 'tac_10' },
    unassigned_ali_asad: { generalId: 'unassigned_ali_asad', tier: 'ordinary', tacticalSkillId: 'tac_10' },
    unassigned_afshin: { generalId: 'unassigned_afshin', tier: 'ordinary', tacticalSkillId: 'tac_10' },
    unassigned_aral_bek: { generalId: 'unassigned_aral_bek', tier: 'ordinary', tacticalSkillId: 'tac_10' },
    unassigned_seljuk: { generalId: 'unassigned_seljuk', tier: 'ordinary', tacticalSkillId: 'tac_10' },
    unassigned_xingan_zhang: { generalId: 'unassigned_xingan_zhang', tier: 'ordinary', tacticalSkillId: 'tac_10' },
    unassigned_dongping_zhang: { generalId: 'unassigned_dongping_zhang', tier: 'ordinary', tacticalSkillId: 'tac_10' },



    yun_wuli: { generalId: 'yun_wuli', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 卢氏戎子吾离陆浑关

    unassigned_yuchisheng_k: { generalId: 'unassigned_yuchisheng_k', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 尉迟胜克里雅山口
    bailong_suomai: { generalId: 'bailong_suomai', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 索劢屯田楼兰三陇沙
    sai_gejiayun: { generalId: 'sai_gejiayun', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 盖嘉运拔换城握瑟德
    weiwuer_yusubu: { generalId: 'weiwuer_yusubu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 玉素布阿克苏玉尔滚
    kangba_suonuomugunbu: { generalId: 'kangba_suonuomugunbu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 索诺木衮布理塘宣抚司
    yong_lujili: { generalId: 'yong_lujili', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 庐戢黎庸将竹山
    jingcheng_d_yuyouzhao: { generalId: 'jingcheng_d_yuyouzhao', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 鱼有沼镜城笼耳
    unassigned_tianyi: { generalId: 'unassigned_tianyi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 田邑上党太守长子

    // ── 2026-06-20 补全：FactionGenerals 有将无档（add:check 33 条）──
    nifuhe_barhudai: { generalId: 'nifuhe_barhudai', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 巴尔虎代·尼夫河
    donghu_tuiyin: { generalId: 'donghu_tuiyin', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 东胡推寅
    yingzhou_ying_d_muronghuang: { generalId: 'yingzhou_ying_d_muronghuang', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 慕容皝范阳燕
    oirat_ming_gaerdan: { generalId: 'oirat_ming_gaerdan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 噶尔丹准噶尔
    jilimi_takuna: { generalId: 'jilimi_takuna', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 塔库纳·吉里密
    qianhui_baiyanhu: { generalId: 'qianhui_baiyanhu', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 白彦虎回军
    ganden_zongkaba: { generalId: 'ganden_zongkaba', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 宗喀巴·甘丹
    mon_monuhe: { generalId: 'mon_monuhe', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 摩奴诃·孟族
    weili_fan_d: { generalId: 'weili_fan_d', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 尉犁泛
    pishan_daihu: { generalId: 'pishan_daihu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 代胡·皮山
    nanai_zhahaluo: { generalId: 'nanai_zhahaluo', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 扎哈罗·那乃
    feiyaka_cemutehe: { generalId: 'feiyaka_cemutehe', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 策穆特赫·费雅喀
    tuva_qinggunzabu: { generalId: 'tuva_qinggunzabu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 青滚杂卜·图瓦
    dalung_sangjiwen: { generalId: 'dalung_sangjiwen', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 桑吉温·达隆
    hor_chisang: { generalId: 'hor_chisang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 赤桑·霍尔
    dong_nangqianjiabo: { generalId: 'dong_nangqianjiabo', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 囊谦加波·隆庆
    xingan_kalunshiwei: { generalId: 'xingan_kalunshiwei', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 海兰察·兴安
    lingqiu_zhaowuling: { generalId: 'lingqiu_zhaowuling', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 赵武灵王·灵丘
    unassigned_zhouyuji_nw: { generalId: 'unassigned_zhouyuji_nw', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 周遇吉·楼烦
    yumi_anguo: { generalId: 'yumi_anguo', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 扜弥王安国
    keliya_fuduxin: { generalId: 'keliya_fuduxin', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 伏阇信·克里雅
    faqiang_niechizanpu: { generalId: 'faqiang_niechizanpu', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 聂赤·发羌
    niang_suonanjiabo: { generalId: 'niang_suonanjiabo', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 索南加波·觉木宗
    wensu_guyi: { generalId: 'wensu_guyi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 姑翼·温宿
    qiemo_anmoshenpan: { generalId: 'qiemo_anmoshenpan', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 安末深盘·且末
    weitou_douti: { generalId: 'weitou_douti', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 兜题·尉头
    eluoke_amuhar: { generalId: 'eluoke_amuhar', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 阿穆哈尔·鄂罗克
    dongping_langtan: { generalId: 'dongping_langtan', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 郎坦·东平
    buriat_tumenjiergale: { generalId: 'buriat_tumenjiergale', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 图门吉尔嘎勒·布里亚特
    baidi_baidibushuai: { generalId: 'baidi_baidibushuai', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 白狄子
    kumoxi_ahuihui: { generalId: 'kumoxi_ahuihui', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 阿会毁·库莫奚
    haikou_wangzhi_pirate: { generalId: 'haikou_wangzhi_pirate', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_06' }, // 汪直·海寇
    shanshan_weituqi: { generalId: 'shanshan_weituqi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 尉屠耆·鄯善
  pangzha_halixingge: { generalId: 'pangzha_halixingge', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 哈里·辛格·旁遮普：攻战计侵掠如火+攻城拔寨，开伯尔山口工程
  najie_minande: { generalId: 'najie_minande', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 米南德·那竭：攻战计侵掠如火+攻城拔寨，印度-希腊东进兴都库什
  dulan_d_aihamaide: { generalId: 'dulan_d_aihamaide', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 艾哈迈德·杜兰尼：攻战计侵掠如火+攻城拔寨，九征印度建帝国
  muer_mujier: { generalId: 'muer_mujier', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 穆吉尔·穆尔加布：哀兵必胜守小木鹿
  baha_gaiwamu: { generalId: 'baha_gaiwamu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 盖瓦姆·巴哈尔兹：深沟高垒守泰巴德
  hali_subashi: { generalId: 'hali_subashi', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 苏巴什·哈里：置之死地丹达纳克破阵
  kalan_suhela: { generalId: 'kalan_suhela', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_03' }, // 苏赫拉·卡伦：敌战计避实击虚+攻城拔寨，萨珊东北铁壁
  xisi_yakubusafaer: { generalId: 'xisi_yakubusafaer', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 雅库布·萨法尔·锡斯坦：攻战计侵掠如火+攻城拔寨，铜匠起兵席卷呼罗珊
  delan_sulun: { generalId: 'delan_sulun', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 苏伦·德兰吉亚：敌战计避实击虚+长驱直入，帕提亚回马箭灭克拉苏
  huluo_abumusilin: { generalId: 'huluo_abumusilin', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 阿布·穆斯林·呼罗珊：敌战计避实击虚+长驱直入，黑旗席卷波斯
  aba_shapuer: { generalId: 'aba_shapuer', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 沙普尔·阿巴尔：攻战计侵掠如火+长驱直入，三破罗马擒瓦勒良
    wenling_shilang: {
        generalId: 'wenling_shilang',
        tier: 'famous',
        tacticalSkillId: 'tac_02',
        strategicSkillId: 'str_04',
    },

    qianzhou_lisheng: {
        generalId: 'qianzhou_lisheng',
        tier: 'famous',
        tacticalSkillId: 'tac_01',
        strategicSkillId: 'str_04',
    },
    xiao_d_xiaomohe: {
        generalId: 'xiao_d_xiaomohe',
        tier: 'famous',
        tacticalSkillId: 'tac_03',
        strategicSkillId: 'str_03',
    },
    unassigned_sudinfang: {
        generalId: 'unassigned_sudinfang',
        tier: 'famous',
        tacticalSkillId: 'tac_02',
        strategicSkillId: 'str_04',
    },
    loufan_xuerengui: {
        generalId: 'loufan_xuerengui',
        tier: 'famous',
        tacticalSkillId: 'tac_02',
        strategicSkillId: 'str_04',
    },
    cai_lisu: {
        generalId: 'cai_lisu',
        tier: 'famous',
        tacticalSkillId: 'tac_02',
        strategicSkillId: 'str_04',
    },
    qingyuan_bd_zhoudewei: {
        generalId: 'qingyuan_bd_zhoudewei',
        tier: 'famous',
        tacticalSkillId: 'tac_03',
        strategicSkillId: 'str_04',
    },
    heyuan_d_heichichangzhi: {
        generalId: 'heyuan_d_heichichangzhi',
        tier: 'famous',
        tacticalSkillId: 'tac_01',
        strategicSkillId: 'str_05',
    },
    wuzhou_d_wangxiaojie: {
        generalId: 'wuzhou_d_wangxiaojie',
        tier: 'famous',
        tacticalSkillId: 'tac_03',
        strategicSkillId: 'str_04',
    },
    changshaguo_xinqiji: {
        generalId: 'changshaguo_xinqiji',
        tier: 'famous',
        tacticalSkillId: 'tac_03',
        strategicSkillId: 'str_05',
    },
    qian_d_yudayou: {
        generalId: 'qian_d_yudayou',
        tier: 'famous',
        tacticalSkillId: 'tac_02',
        strategicSkillId: 'str_04',
    },
    chuzhou_d_dugao: {
        generalId: 'chuzhou_d_dugao',
        tier: 'famous',
        tacticalSkillId: 'tac_05',
        strategicSkillId: 'str_05',
    },
    shule_aersilan: {
        generalId: 'shule_aersilan',
        tier: 'famous',
        tacticalSkillId: 'tac_03',
        strategicSkillId: 'str_04',
    },
    liguo_wangmeng: {
        generalId: 'liguo_wangmeng',
        tier: 'famous',
        tacticalSkillId: 'tac_04',
        strategicSkillId: 'str_01',
    },
    hongnong_jun_yangsu: {
        generalId: 'hongnong_jun_yangsu',
        tier: 'famous',
        tacticalSkillId: 'tac_03',
        strategicSkillId: 'str_06',
    }, // 杨素：灭陈水师破建康，五牙舰平江南
    weihaiwei_sudingfang: {
        generalId: 'weihaiwei_sudingfang',
        tier: 'famous',
        tacticalSkillId: 'tac_02',
        strategicSkillId: 'str_04',
    }, // 苏定方：灭西突厥、平百济，长驱万里
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
