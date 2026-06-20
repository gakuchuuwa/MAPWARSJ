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
    displayName: string;
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

/** 战略六格（因粮于敌见 EXPEDITION_FORAGE_SKILL，不占战略格） */
export const STRATEGIC_SKILL_CATALOG: Record<string, StrategicSkillDef> = {
    str_01: { id: 'str_01', grid: 'S①', displayName: '兵贵神速', effect: 'march_speed_mult', magnitude: 1.2 },
    str_02: { id: 'str_02', grid: 'S②', displayName: '攻城拔寨', effect: 'siege_power_mult', magnitude: 1.2 },
    str_03: { id: 'str_03', grid: 'S③', displayName: '所向披靡', effect: 'field_power_mult', magnitude: 1.2 },
    str_04: { id: 'str_04', grid: 'S④', displayName: '长驱直入', effect: 'plain_power_mult', magnitude: 1.2 },
    str_05: { id: 'str_05', grid: 'S⑤', displayName: '居高临下', effect: 'mountain_power_mult', magnitude: 1.2 },
    str_06: { id: 'str_06', grid: 'S⑥', displayName: '乘风破浪', effect: 'water_power_mult', magnitude: 1.2 },
};

/**
 * 远征军系统技：胜后「因粮于敌」补兵（远征断粮、就食于敌）。
 * 仅远征军（army.expeditionTargetCityId）享；**非战略格 / 非战术格**，独立系统技，不占名将技格。
 */
export interface ExpeditionSystemSkillDef {
    displayName: string;
}
export const EXPEDITION_FORAGE_SKILL: ExpeditionSystemSkillDef = {
    displayName: '因粮于敌',
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
 * 分布目标（2026-06-18 均化）：名将①–⑤各约 11–15；③侵掠如火 ≤15；④不战而屈极少；S③所向披靡 ≤10
 */
export const GENERAL_PROFILES: Record<string, GeneralProfile> = {
    // ── 中国及外围 ──
    baiqi: { generalId: 'baiqi', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_02' }, // 鄢郢水攻破楚都
    simacuo: { generalId: 'simacuo', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 前316年灭蜀苴巴
    lishimin: { generalId: 'lishimin', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 虎牢关轻骑冲阵
    direnjie: { generalId: 'direnjie', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 退突厥：间谍离间后反击
    laihuer: { generalId: 'laihuer', tier: 'ordinary', tacticalSkillId: 'tac_03' }, // 征东：水师突击平壤焚舰
    limanzhu: { generalId: 'limanzhu', tier: 'ordinary', tacticalSkillId: 'tac_05' }, // 建州：聚合诸部筑城自守
    zhangliang: { generalId: 'zhangliang', tier: 'ordinary', tacticalSkillId: 'tac_03' }, // 征东：唐水军渡海攻坚
    muchong: { generalId: 'muchong', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 代北：北魏开国翼戴
    wangshifan: { generalId: 'wangshifan', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 平卢：反朱温决死突击
    murongyong: { generalId: 'murongyong', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 西燕：亡国哀兵复起
    lijilong: { generalId: 'lijilong', tier: 'ordinary', tacticalSkillId: 'tac_05' }, // 澶州：据城固守射杀辽将
    zhaowulingwang: { generalId: 'zhaowulingwang', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 胡服骑射：破林胡灭楼烦
    zhongshanchenggong: { generalId: 'zhongshanchenggong', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 中山：筑城自保守边
    shihu: { generalId: 'shihu', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 邺都：暴虐突袭
    loufanwang: { generalId: 'loufanwang', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 楼烦：亡部哀兵复起
    qihuangong_qi: { generalId: 'qihuangong_qi', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_03' }, // 尊王攘夷：伐山戎救燕远征
    xingfangde: { generalId: 'xingfangde', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 信州：垒山筑寨据守抗元
    lidian: { generalId: 'lidian', tier: 'ordinary', tacticalSkillId: 'tac_05' }, // 合肥：据城固守拒孙权
    sunshuao: { generalId: 'sunshuao', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 期思：筑芍陂兴水利
    zhangcong: { generalId: 'zhangcong', tier: 'ordinary', tacticalSkillId: 'tac_05' }, // 永嘉：整顿海防编练水师
    wubayue: { generalId: 'wubayue', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 乾嘉：苗民决死破清军
    liangmiding: { generalId: 'liangmiding', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 宕昌：守羌堡据险
    houhongyuan: { generalId: 'houhongyuan', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 巴僚：酋帅哀兵守土
    gaodingyuan: { generalId: 'gaodingyuan', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 越巂：反蜀决死突围
    duwenxiu: { generalId: 'duwenxiu', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 回军：哀兵复起
    jiangwei: { generalId: 'jiangwei', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 北伐：避实击虚九伐中原
    qingyiwang: { generalId: 'qingyiwang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 青衣：据山筑垒自守
    ruanwenzhang: { generalId: 'ruanwenzhang', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 广平：象兵水师哀兵抗西山
    mazhong: { generalId: 'mazhong', tier: 'ordinary', tacticalSkillId: 'tac_05' }, // 南中：镇抚夷汉固守边郡
    jiaohuang: { generalId: 'jiaohuang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 越嶲：戍守邛都
    qushisi: { generalId: 'qushisi', tier: 'ordinary', tacticalSkillId: 'tac_05' }, // 永安：固守靖江破李成栋
    caojin: { generalId: 'caojin', tier: 'ordinary', tacticalSkillId: 'tac_05' }, // 端州：据城拒侬智高
    anong: { generalId: 'anong', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 邦敦：哀兵退守
    daogengmeng: { generalId: 'daogengmeng', tier: 'ordinary', tacticalSkillId: 'tac_03' }, // 上丁：象兵雄踞
    limao_leizhou: { generalId: 'limao_leizhou', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 雷州：驻防海康
    huangqingyun: { generalId: 'huangqingyun', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 艋舺：汛防戍守
    oudaren: { generalId: 'oudaren', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 三菩：戍卒驻守
    musheng: { generalId: 'musheng', tier: 'ordinary', tacticalSkillId: 'tac_03' }, // 腾越：征讨麓川屡立战功
    taohong: { generalId: 'taohong', tier: 'ordinary', tacticalSkillId: 'tac_05' }, // 银生：坚守退敌
    sijifa: { generalId: 'sijifa', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 阿瓦：哀兵退守
    duanjianwei: { generalId: 'duanjianwei', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 通海：南诏都督镇守
    monuha: { generalId: 'monuha', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 直通：孟族国王
    ganmuding: { generalId: 'ganmuding', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 呵叻：罗斛驻守
    leilao: { generalId: 'leilao', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 永昌：哀牢决死反叛
    jianzandechang: { generalId: 'jianzandechang', tier: 'ordinary', tacticalSkillId: 'tac_03' }, // 打箭炉：从征金川
    zhebi: { generalId: 'zhebi', tier: 'ordinary', tacticalSkillId: 'tac_03' }, // 思陀：从征安南
    piqiluomo: { generalId: 'piqiluomo', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 骠国：守城戍卒
    gandancaiwang: { generalId: 'gandancaiwang', tier: 'ordinary', tacticalSkillId: 'tac_03' }, // 阿里：远征拉达克
    fengang: { generalId: 'fengang', tier: 'ordinary', tacticalSkillId: 'tac_03' }, // 高凉：平僚威震岭南
    pabala: { generalId: 'pabala', tier: 'ordinary', tacticalSkillId: 'tac_05' }, // 昌都：率僧兵守城
    sangjiejia: { generalId: 'sangjiejia', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 建塘：第巴摄政遣防
    kongsayiduo: { generalId: 'kongsayiduo', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 甘孜：从征瞻对
    lazanghan: { generalId: 'lazanghan', tier: 'ordinary', tacticalSkillId: 'tac_02' }, // 黑河宗：卫拉特突骑
    lingesar: { generalId: 'lingesar', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_06' }, // 岭国：史诗英雄
    nangqianwang: { generalId: 'nangqianwang', tier: 'ordinary', tacticalSkillId: 'tac_03' }, // 隆庆：二十五族盟主
    huoerkangsa: { generalId: 'huoerkangsa', tier: 'ordinary', tacticalSkillId: 'tac_03' }, // 索宗：协剿波密
    dacajilong: { generalId: 'dacajilong', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 八宿：活佛差民武装
    gongtangang: { generalId: 'gongtangang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 吉麦：牧民武装
    juemuba: { generalId: 'juemuba', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 觉木：宗谿驻兵
    dalonghuofo: { generalId: 'dalonghuofo', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 类乌齐：抵御盗匪
    nanjiewangqiu: { generalId: 'nanjiewangqiu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 日土：边军驻防
    zhudi: { generalId: 'zhudi', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_01' }, // 靖难军白沟突击
    yuqian: { generalId: 'yuqian', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 京师保卫战
    tandaoji: { generalId: 'tandaoji', tier: 'famous', tacticalSkillId: 'tac_09' }, // 唱筹量沙：断敌粮道后反击
    yangxingmi: { generalId: 'yangxingmi', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_02' }, // 清口之战破孙儒、守淮南
    wangping: { generalId: 'wangping', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 244年兴势之战据险大破曹爽
    anuluvtuo: { generalId: 'anuluvtuo', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 蒲甘王朝东征西讨
    machao: { generalId: 'machao', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 潼关决死突击
    baiba: { generalId: 'baiba', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 龟兹内乱：哀兵复国
    chengjisihan: { generalId: 'chengjisihan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_01' }, // 蒙古西征神速奔袭
    dazuorong: { generalId: 'dazuorong', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 渤海开基：筑城固守建国
    jiangganzan: { generalId: 'jiangganzan', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_06' }, // 金岘大捷：守土反击破辽
    zulijunshi: { generalId: 'zulijunshi', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_06' }, // 凑川败后据九州水师固守
    tiemuer: { generalId: 'tiemuer', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_01' }, // 六年征服千里闪击
    nalixuan: { generalId: 'nalixuan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_06' }, // 象战击杀缅甸王储复国
    fuhao: { generalId: 'fuhao', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 征伐土方武丁妇好率军突击
    lvbu: { generalId: 'lvbu', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 下邳飞将
    hanxin: { generalId: 'hanxin', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 暗度陈仓出奇击三秦
    wuqi: { generalId: 'wuqi', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_02' }, // 治魏军严明后破秦五城
    nuerhachi: { generalId: 'nuerhachi', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 萨尔浒野战突击
    jinyixin: { generalId: 'jinyixin', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_03' }, // 萨円大捷守城反攻
    sangjiaer: { generalId: 'sangjiaer', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 中亚草原对峙以逸待变
    menggong: { generalId: 'menggong', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_02' }, // 枣阳孤城死守破蒙古
    nanmuzhengcheng: { generalId: 'nanmuzhengcheng', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 千早城笼城死守抗幕府
    chenwang: { generalId: 'chenwang', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 马韩辰王治月支国
    chengmingzhen: { generalId: 'chengmingzhen', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_06' }, // 卑沙城水陆并进攻克
    kangwang: { generalId: 'kangwang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 奴儿干都司戍边
    ashinayandu: { generalId: 'ashinayandu', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 阿尔泰金山突厥
    hanshen: { generalId: 'hanshen', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 哈密忠顺王苦峪抗也先
    peishenfu: { generalId: 'peishenfu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 朅盘陀石头城戍守
    cewangzhabu: { generalId: 'cewangzhabu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 札萨克图汗部
    amursana: { generalId: 'amursana', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 金山辉特部反清
    shatuonasu: { generalId: 'shatuonasu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 独山城处月部
    manasi: { generalId: 'manasi', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 柯尔克孜史诗英雄
    zhangyao: { generalId: 'zhangyao', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_02' }, // 星星峡嵩武军入疆
    banchao: { generalId: 'banchao', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 疏勒·36骑定西域
    banyong: { generalId: 'banyong', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 阳关·班勇续通西域
    chelingwubashi: { generalId: 'chelingwubashi', tier: 'ordinary', tacticalSkillId: 'tac_10' },
    tumengken: { generalId: 'tumengken', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 赛音诺颜抗卫拉特
    qulishi: { generalId: 'qulishi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 拔野古助唐灭薛延陀
    mogusi: { generalId: 'mogusi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 阻卜酋长叛辽
    duoerji: { generalId: 'duoerji', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 乌珠穆沁随征噶尔丹
    feizigu: { generalId: 'feizigu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 白狄肥国肥子鼓集宁
    saigou: { generalId: 'saigou', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 室韦大酋长塞呴俱轮泊元和入朝
    sunitezasake: { generalId: 'sunitezasake', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 苏尼特札萨克
    boduanchaer: { generalId: 'boduanchaer', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 蒙古始祖孛端察儿石勒喀河
    danjin: { generalId: 'danjin', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 首任唐努总管丹津 // 布尔根乌梁海部
    // ── 日本 ──
    dechuangjiakang: { generalId: 'dechuangjiakang', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 关原后稳坐江户待变
    wutianxinxuan: { generalId: 'wutianxinxuan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 川中岛铁骑突击
    shangshanqianxin: { generalId: 'shangshanqianxin', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 川中岛车悬突击
    fengchenxiuji: { generalId: 'fengchenxiuji', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_01' }, // 鸟取忍城粮道奇袭
    zhentianxingcun: { generalId: 'zhentianxingcun', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 大阪夏之阵赤备突击
    yidazhengzong: { generalId: 'yidazhengzong', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 独眼兜冲阵
    zhitianxinchang: { generalId: 'zhitianxinchang', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_02' }, // 桶狭间奇袭破今川
    sakaitadatsugu: { generalId: 'sakaitadatsugu', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 浜松城·德川四天王
    jinchuanyiyuan: { generalId: 'jinchuanyiyuan', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 骏河经营逐个蚕食周边（非④非防反）
    maoliyuanjiu: { generalId: 'maoliyuanjiu', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_06' }, // 严岛夜袭少胜多
    daojinjiajiu: { generalId: 'daojinjiajiu', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_06' }, // 冲冠编队儿岛水军突击
    lihuadaoxue: { generalId: 'lihuadaoxue', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 迁冈筑城拒敌
    juchiwuguang: { generalId: 'juchiwuguang', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 菊池河山战突击
    pushengshixiang: { generalId: 'pushengshixiang', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 会津五奉行据山城维稳
    changzongwobuyuanqin: { generalId: 'changzongwobuyuanqin', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 长宗我部奇袭统一四国
    shanzhonglujie: { generalId: 'shanzhonglujie', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 局部守战逆袭
    lingmuzhongxiu: { generalId: 'lingmuzhongxiu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 筑寨固守
    baididanbo: { generalId: 'baididanbo', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 伊贺忍者夜袭
    qingshuizongzhi: { generalId: 'qingshuizongzhi', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 备中高松城笼城死守
    hojoujiyasu: { generalId: 'hojoujiyasu', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 箱根关·相模守备
    otaniyoshitsugu: { generalId: 'otaniyoshitsugu', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 不破关·关原死战
    zoufanglaizhong: { generalId: 'zoufanglaizhong', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 诹访据险反击
    yudugongguanggang: { generalId: 'yudugongguanggang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 宇都宫筑城固守
    cunshangwuji: { generalId: 'cunshangwuji', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 村上水军奇袭
    nanbuqingzheng: { generalId: 'nanbuqingzheng', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 南部藩境守反击
    yuxiduozhijia: { generalId: 'yuxiduozhijia', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 离间毛利后取备前
    ganfujianxu: { generalId: 'ganfujianxu', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 肝付水军奇袭
    yuanyijing: { generalId: 'yuanyijing', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_06' }, // 屋岛冲夜袭
    liqiqingguang: { generalId: 'liqiqingguang', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 虾夷边境守反击
    hushemoquan: { generalId: 'hushemoquan', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 阿伊努战：绝境奋起
    zongyizhi: { generalId: 'zongyizhi', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 对朝奇袭
    pingzhisheng: { generalId: 'pingzhisheng', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_06' }, // 坛浦决战水师覆没前死战（非④）
    // ── 朝鲜 ──
    lichenggui: { generalId: 'lichenggui', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 威化岛斩首奇袭
    yizhiwende: { generalId: 'yizhiwende', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_06' }, // 萨水之战以逸待劳破隋
    jiebai: { generalId: 'jiebai', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 车昌野隘突击
    zhenxuan: { generalId: 'zhenxuan', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 断粮离间后会战
    jintongjing: { generalId: 'jintongjing', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 金通精守城逆袭
    lishunchen: { generalId: 'lishunchen', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_06' }, // 鸣梁海龟船诱敌待发
    zhengdi: { generalId: 'zhengdi', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 郑地奇袭
    jinshoulu: { generalId: 'jinshoulu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 金官伽倻筑城
    yinguan: { generalId: 'yinguan', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_02' }, // 勿里伐高句丽久战拖敌
    yuangaisuwen: { generalId: 'yuangaisuwen', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 安市围城守城破唐
    cuiying: { generalId: 'cuiying', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 太宗条外长城据守
    quanli: { generalId: 'quanli', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_03' }, // 泗川堤大捷筑堤守击
    jinshimin: { generalId: 'jinshimin', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 咸从津设伏击退（非④）
    // ── 东北
    duergan: { generalId: 'duergan', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_02' }, // 山海关入关闪击
    wanyanaguda: { generalId: 'wanyanaguda', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_01' }, // 阿骨打破辽神速
    zhelemei: { generalId: 'zhelemei', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_01' }, // 者勒蔑轻骑奇袭救主（未挂势）
    naierbuhua: { generalId: 'naierbuhua', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_02' }, // 永乐北伐兀良哈败乃儿不花
    weichoutai: { generalId: 'weichoutai', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 扶余据城固守
    wanyanzongbi: { generalId: 'wanyanzongbi', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 郾城铁浮屠平原突击（@女真五国城）
    huangtaiji: { generalId: 'huangtaiji', tier: 'famous', tacticalSkillId: 'tac_04', strategicSkillId: 'str_02' }, // 松锦战后洪承畴部归降
    wanyanzonghan: { generalId: 'wanyanzonghan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_02' }, // 攻破汴京
    tanshihuai: { generalId: 'tanshihuai', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 鲜卑草原长途奔袭
    bomuboguoer: { generalId: 'bomuboguoer', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 蒙古陷阵先锋
    puxianwannu: { generalId: 'puxianwannu', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 红袄军决死突击
    buzhantai: { generalId: 'buzhantai', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 断粮后会战
    jintaiji: { generalId: 'jintaiji', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 金太祖哀兵逆袭
    aoba: { generalId: 'aoba', tier: 'ordinary', tacticalSkillId: 'tac_02' }, // 科尔沁奥巴归附后骑袭
    wuzhaodu: { generalId: 'wuzhaodu', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 元末断粮破敌
    yelvliuge: { generalId: 'yelvliuge', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 涿州筑垒固守
    wangtai: { generalId: 'wangtai', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 王台部寨固守
    lichengliang: { generalId: 'lichengliang', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 擒王杲、破阿台奇袭
    zudashou: { generalId: 'zudashou', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 宁远大捷红夷炮守城破努尔哈赤
    shangguankui: { generalId: 'shangguankui', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 万州天生城抗元
    zhanggao: { generalId: 'zhanggao', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 辰州戍守
    maowenlong: { generalId: 'maowenlong', tier: 'ordinary', tacticalSkillId: 'tac_05' }, // 皮岛东江据岛固守
    baldaqi: { generalId: 'baldaqi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 精奇里江达斡尔首领归附清朝
    nishuli: { generalId: 'nishuli', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 黑水靺鞨首领唐黑水都督
    boke: { generalId: 'boke', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 索伦副都统雅克萨之战
    yilizhi: { generalId: 'yilizhi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 勿吉首领朝贡北魏
    fujun: { generalId: 'fujun', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 吉林将军屯田戍边
    yelvbei: { generalId: 'yelvbei', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 东丹王以敖东城为都
    kuye_qiuzhang: { generalId: 'kuye_qiuzhang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 库页岛费雅喀
    tudiji: { generalId: 'tudiji', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 靺鞨首领突地稽归唐
    naoya: { generalId: 'naoya', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 挹娄首领助战高句丽
    gentemuer: { generalId: 'gentemuer', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 达斡尔酋长格尔必齐
    kaolangwu: { generalId: 'kaolangwu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 囊哈儿卫指挥考郎兀
    hazheng: { generalId: 'hazheng', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 兀列河卫哈正诺托罗
    hudamu: { generalId: 'hudamu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 野人女真忽答木盆奴里
    mangka: { generalId: 'mangka', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 费雅喀族长莽喀普禄
    xiyangha: { generalId: 'xiyangha', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 女真大酋长西阳哈瓦伦
    sharhuda: { generalId: 'sharhuda', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_02' }, // 宁古塔章京击退俄军斯捷潘诺夫
    yelvabaoji: { generalId: 'yelvabaoji', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 燕京游击断粮
    yelvxiuge: { generalId: 'yelvxiuge', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 满城大败宋师以逸待劳
    wanyanloushi: { generalId: 'wanyanloushi', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_02' }, // 襄阳六年围城（@大金会宁）
    shilu: { generalId: 'shilu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 完颜始祖据黑水故地
    menglelun: { generalId: 'menglelun', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 雅克萨达斡尔据寨
    yilv: { generalId: 'yilv', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 义律部哀兵守境
        liguang: { generalId: 'liguang', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 飞将军雁门
    yuwentai: { generalId: 'yuwentai', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 沙苑以少胜多
    yexian: { generalId: 'yexian', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 土木之变
// ── 草原区 2026-06-18 ──
    yelvdeguang: { generalId: 'yelvdeguang', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_02' }, // 灭后唐取汴京
    xiwanghuilibao: { generalId: 'xiwanghuilibao', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 奚王自立，决死抗战
    chisipijia: { generalId: 'chisipijia', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 葛逻禄纵横西域外交
    chuormahan: { generalId: 'chuormahan', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_01' }, // 西征波斯快速穿插
    tuoheituoa: { generalId: 'tuoheituoa', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 蔑儿乞十余年死战成吉思汗
    andahan: { generalId: 'andahan', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 庚戌之变长驱围北京
    yesugai: { generalId: 'yesugai', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_01' }, // 也速该草原奔袭
    mahamu: { generalId: 'mahamu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 忽兰忽失温后重整
    are: { generalId: 'are', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_01' }, // 黠戛斯灭回鹘神速
    maodun: { generalId: 'maodun', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_03' }, // 白登围刘邦以逸待劳
    murongke: { generalId: 'murongke', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 广固连环马灭冉魏
    tadun: { generalId: 'tadun', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 白狼山死战曹操
    hubilie: { generalId: 'hubilie', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_02' }, // 襄阳围城六年灭宋
    hebulerhan: { generalId: 'hebulerhan', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 蒙兀山城抗金
    likeyong: { generalId: 'likeyong', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 飞虎子骑突黄巢
    yinan: { generalId: 'yinan', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 薛延陀脱离西突厥待机立国
    pijiaquekehan: { generalId: 'pijiaquekehan', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 回纥漠北固基
    wanghan: { generalId: 'wanghan', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 克烈部固守草原霸主
    taiyanghan: { generalId: 'taiyanghan', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 乃蛮末代决战哀兵
    mieguzhen: { generalId: 'mieguzhen', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 塔塔儿长期死战蒙古
    tuxietuhan: { generalId: 'tuxietuhan', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 土谢图固守部境
    zhasaketuhan: { generalId: 'zhasaketuhan', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 扎萨克图外交周旋
    afuzhiluo: { generalId: 'afuzhiluo', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_01' }, // 高车西迁先稳后打
    ashinatumen: { generalId: 'ashinatumen', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 突厥灭柔然铁骑突击
    kuokuotiemuer: { generalId: 'kuokuotiemuer', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 北元山地游击抗明
    yujiulv: { generalId: 'yujiulv', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 柔然南下围魏帝
    yaoluogepusa: { generalId: 'yaoluogepusa', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 药罗葛早期周旋
    muhuali: { generalId: 'muhuali', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_02' }, // 太师国王稳步经略中原
    dexuechan: { generalId: 'dexuechan', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 弘吉剌部固守
    tuohuan: { generalId: 'tuohuan', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 脱欢统一卫拉特待机
    qibiheli: { generalId: 'qibiheli', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_06' }, // 征高句丽水陆并进
    ashidejieli: { generalId: 'ashidejieli', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 颉利南下奇袭渭水
    ashinahelu: { generalId: 'ashinahelu', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 西突厥十姓外交整合
    cheshihouwang: { generalId: 'cheshihouwang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 车师后王固守
    abadaikehan: { generalId: 'abadaikehan', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 喀尔喀统一待变
    huyanwang: { generalId: 'huyanwang', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 呼衍王西域游击
    lindanhan: { generalId: 'lindanhan', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_01' }, // 林丹汗西迁急行军
    alagusi: { generalId: 'alagusi', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 汪古部外交附蒙
    shelun: { generalId: 'shelun', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_01' }, // 柔然脱鲜卑神速立国
    tuhulutiemuer: { generalId: 'tuhulutiemuer', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 东察合台统一蒙兀儿斯坦
    dongmohedagan: { generalId: 'dongmohedagan', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 回鹘·合骨咄禄毗伽可汗
    gulipeiluo: { generalId: 'gulipeiluo', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 骨力裴罗统一回鹘诸部
    dougu: { generalId: 'dougu', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_02' }, // 东汉窦固击北匈奴于蒲类海
    zakulan: { generalId: 'zakulan', tier: 'ordinary', tacticalSkillId: 'tac_02' }, // 锡伯神箭手传说
    puguhuaien: { generalId: 'puguhuaien', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_02' }, // 平乱后叛唐据守
    zhaheganbu: { generalId: 'zhaheganbu', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 克烈部游击混战
    tuolei: { generalId: 'tuolei', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 三峰山奇袭灭金主力
    zhamuhe: { generalId: 'zhamuhe', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 十三翼之战草原奇袭
    sachabieqi: { generalId: 'sachabieqi', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 主儿乞部决战
    chechenhanshuolei: { generalId: 'chechenhanshuolei', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 车臣部驻牧固守
        hanritianzhong: { generalId: 'hanritianzhong', tier: 'ordinary', tacticalSkillId: 'tac_10' },
    amuersana: { generalId: 'amuersana', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' },
    yuchiyao: { generalId: 'yuchiyao', tier: 'ordinary', tacticalSkillId: 'tac_10' },
    zhangyao_x: { generalId: 'zhangyao_x', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' },
// ── 西域区 2026-06-18 ──
    xian_suoche_wang: { generalId: 'xian_suoche_wang', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 莎车王纵横西域外交
    liuyuan: { generalId: 'liuyuan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' },
    kongrong: { generalId: 'kongrong', tier: 'ordinary', tacticalSkillId: 'tac_10' },
    liuang: { generalId: 'liuang', tier: 'ordinary', tacticalSkillId: 'tac_08' },
    hanyu: { generalId: 'hanyu', tier: 'ordinary', tacticalSkillId: 'tac_09' },
    mashumou: { generalId: 'mashumou', tier: 'ordinary', tacticalSkillId: 'tac_10' },
    yangzhiji: { generalId: 'yangzhiji', tier: 'ordinary', tacticalSkillId: 'tac_10' },
    chenpan: { generalId: 'chenpan', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 疏勒王联汉奇袭
    gaerdancelin: { generalId: 'gaerdancelin', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 和通泊以逸待劳歼清军
    guoxin: { generalId: 'guoxin', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_02' }, // 安西孤城坚守半世纪
    longtuqizhi: { generalId: 'longtuqizhi', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 焉耆王劫掠商道游击
    wobaxi: { generalId: 'wobaxi', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_01' }, // 土尔扈特万里东归
    quwentai: { generalId: 'quwentai', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 高昌王据城抗唐
    abuladitifu: { generalId: 'abuladitifu', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 叶尔羌名将死战准清
    baershu: { generalId: 'baershu', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 亦都护外交归附蒙古
    weichiyao: { generalId: 'weichiyao', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_02' }, // 于阗王入唐勤王守城
    zhuxiechixin: { generalId: 'zhuxiechixin', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 朱邪赤心骑破庞勋
    yisimayi: { generalId: 'yisimayi', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 萨曼埃米尔巴尔赫以逸待劳
    satuke: { generalId: 'satuke', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 喀喇汗圣战统一
    sulukehan: { generalId: 'sulukehan', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 突骑施公牛抗阿拉伯
    yelvdashi: { generalId: 'yelvdashi', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_01' }, // 西辽西迁卡特万以少胜多
    mahamaode: { generalId: 'mahamaode', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 马哈茂德十七征印度
    xibanni: { generalId: 'xibanni', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 昔班尼攻布哈拉建汗国
    liejiaomi: { generalId: 'liejiaomi', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 乌孙昆莫西迁奇袭月氏
        ganshouchang: { generalId: 'ganshouchang', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 与陈汤共灭郅支

// ── 中亚区 2026-06-18 ──
    mohemo: { generalId: 'mohemo', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 花剌子模鼎盛
    hasimu: { generalId: 'hasimu', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 哈萨克汗国统一
    dewasitiqi: { generalId: 'dewasitiqi', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 粟特抗阿拉伯
    touluoman: { generalId: 'touluoman', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 嚈哒征服印度
    ahexiong: { generalId: 'ahexiong', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 嚈哒王破萨珊，杀卑路斯一世
    yile: { generalId: 'yile', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 花剌子模沙抗西辽
    muhanmodeguli: { generalId: 'muhanmodeguli', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 古尔征服北印度
    jianisejia: { generalId: 'jianisejia', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 贵霜帝国极盛
    baqiman: { generalId: 'baqiman', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 钦察游击抗蒙
    wugua: { generalId: 'wugua', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 大宛王抗汉
    aersilan: { generalId: 'aersilan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 喀喇汗灭于阗
    qiujiuque: { generalId: 'qiujiuque', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 贵霜奠基统一五部
    alimukuli: { generalId: 'alimukuli', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 浩罕抗俄
    agubai: { generalId: 'agubai', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 哲德沙尔建国
    yinalechihei: { generalId: 'yinalechihei', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 讹答剌守城
    moheduotutun: { generalId: 'moheduotutun', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 石国王·唐册封吐屯
    mameng: { generalId: 'mameng', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_02' }, // 马蒙起兵夺哈里发
    sijinti: { generalId: 'sijinti', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 羯霜那·唐册封史国王
    shaboluo: { generalId: 'shaboluo', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 十箭部落西突厥
    bahelamuchubin: { generalId: 'bahelamuchubin', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 萨珊名将·呼罗珊边境机动作战
    tugelile: { generalId: 'tugelile', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 1040丹达内克胜伽色尼建塞尔柱
    suojie: { generalId: 'suojie', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 精绝屯田戍边抗北匈奴
    mafushou: { generalId: 'mafushou', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 昆岗军台守驿
    chengui: { generalId: 'chengui', tier: 'famous', tacticalSkillId: 'tac_10', strategicSkillId: 'str_04' }, // 度辽将军守五原北塞
    wutang: { generalId: 'wutang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 度辽将军护南匈奴
    sanyinnuoyan: { generalId: 'sanyinnuoyan', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 赛音诺颜部
    celeng: { generalId: 'celeng', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 定边左副将军乌里雅苏台
    zhangyi: { generalId: 'zhangyi', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 蜀汉后期名将
    yanghuai: { generalId: 'yanghuai', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 白水关守将
    dengai: { generalId: 'dengai', tier: 'famous', tacticalSkillId: 'tac_07', strategicSkillId: 'str_04' }, // 偷渡阴平灭蜀
    douxian: { generalId: 'douxian', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 燕然勒石破北匈奴
    qizhijian: { generalId: 'qizhijian', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 东汉鲜卑大人寇边
    houlilu: { generalId: 'houlilu', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 匈奴右贤王自立单于
    apakhoja: { generalId: 'apakhoja', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 白山派领袖据守休循
    fanyanna_wang: { generalId: 'fanyanna_wang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 梵衍那王率僧兵御大食
    chebishi: { generalId: 'chebishi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 石国王车鼻施康卡
    timuermieli: { generalId: 'timuermieli', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 忽毡英雄装甲战船抗蒙古
    humi_wang: { generalId: 'humi_wang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 护密王守瓦罕走廊
    // ── 中国将·西域 2026-06-18 ──
    chentang: { generalId: 'chentang', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_01' }, // 建昭三年六校分道诛郅支于都赖水
    sushili: { generalId: 'sushili', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 小勃律王据守孽多
    genggong: { generalId: 'genggong', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 疏勒孤军苦撑
    sudinfang: { generalId: 'sudinfang', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 灭西突厥擒沙钵罗
    peixingjian: { generalId: 'peixingjian', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_02' }, // 计擒都支兵不血刃
    
// ── 青藏区 2026-06-18 ──
    songzanganbu: { generalId: 'songzanganbu', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 统一青藏
    houjunji: { generalId: 'houjunji', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_02' }, // 松州破吐蕃
    baduersaye: { generalId: 'baduersaye', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 廓尔喀侵藏
    gongbumangbuzhi: { generalId: 'gongbumangbuzhi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 工布小王
    basiba: { generalId: 'basiba', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 萨迦帝师
    xiazhongawanglangjie: { generalId: 'xiazhongawanglangjie', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 不丹建国
    lunqinling: { generalId: 'lunqinling', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 大非川以逸待劳破薛仁贵
    lunkongre: { generalId: 'lunkongre', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 吐蕃末将
    dashibatuer: { generalId: 'dashibatuer', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 青海蒙古亲王
    tufanutan: { generalId: 'tufanutan', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 南凉君主
    qifuchipan: { generalId: 'qifuchipan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_02' }, // 西秦灭南凉
    kualv: { generalId: 'kualv', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 吐谷浑可汗
    buyantiemuer: { generalId: 'buyantiemuer', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 安定王
    zhashiduanzhubu: { generalId: 'zhashiduanzhubu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 噶厦代本
    shaluoben: { generalId: 'shaluoben', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 金川固守
    limixia_x: { generalId: 'limixia_x', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 象雄末王
    senggelangjie: { generalId: 'senggelangjie', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 拉达克王
    gushihan: { generalId: 'gushihan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 和硕特入藏
    mojie: { generalId: 'mojie', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 女国女王
    queyingduoji: { generalId: 'queyingduoji', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 噶玛巴活佛
    dianling: { generalId: 'dianling', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 先零羌
    mitang: { generalId: 'mitang', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 烧当羌
    jiangqujianzan: { generalId: 'jiangqujianzan', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 帕竹立国
    xiutuwang: { generalId: 'xiutuwang', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 休屠王
    dibasangjiejiacuo: { generalId: 'dibasangjiejiacuo', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 第巴摄政
    qiongbobangse: { generalId: 'qiongbobangse', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 吐蕃大论
    dengbazeren: { generalId: 'dengbazeren', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 德格土司
    zhaochongguo: { generalId: 'zhaochongguo', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 河湟屯田平羌
    xinuoluo: { generalId: 'xinuoluo', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 苏毗附唐
    pengcuonanjie: { generalId: 'pengcuonanjie', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 藏巴汗立国
    dariniansai: { generalId: 'dariniansai', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 悉补野奠基
    wangqindundui: { generalId: 'wangqindundui', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 波密抗清
    yizeng: { generalId: 'yizeng', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 附国王
    tangzeng: { generalId: 'tangzeng', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 白狼王
    humiwang: { generalId: 'humiwang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 护密王
    meijinmang: { generalId: 'meijinmang', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 小勃律破吐蕃
    chizhaxichabade: { generalId: 'chizhaxichabade', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 古格末王
    redangunsangpa: { generalId: 'redangunsangpa', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 江孜法王
  // ── 滇缅区 2026-06-18 ──
    sheyebamoqishi: { generalId: 'sheyebamoqishi', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 驱逐占婆收复吴哥
    duansiping: { generalId: 'duansiping', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 灭大义宁建大理
    mangruiti: { generalId: 'mangruiti', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 统一缅甸中南部
    muzeng: { generalId: 'muzeng', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 木天王拓土
    zhuangqiao: { generalId: 'zhuangqiao', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 威定滇池王滇
    yongjiya: { generalId: 'yongjiya', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 贡榜复国
    geluofeng: { generalId: 'geluofeng', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 天宝战争击唐
    cuanguiwang: { generalId: 'cuanguiwang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 东爨乌蛮首领
    daoyingmeng: { generalId: 'daoyingmeng', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 车里宣慰征缅
    manglai: { generalId: 'manglai', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 兰纳灭哈里奔猜
    langanheng: { generalId: 'langanheng', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 素可泰扩张
    sirenfa: { generalId: 'sirenfa', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 麓川大败明军
    lucheng: { generalId: 'lucheng', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 昆明夷斩类牢
    cuanlongyan: { generalId: 'cuanlongyan', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 爨氏镇南中
    gaoshengtai: { generalId: 'gaoshengtai', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 大理权相
    zhipenge: { generalId: 'zhipenge', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_06' }, // 占婆水师破越
    rengui: { generalId: 'rengui', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 邛谷王据郡
    mangyinglong: { generalId: 'mangyinglong', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 东吁帝国鼎盛
      yangzaixing: { generalId: 'yangzaixing', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_02' }, // 麦岭关
  // ── 岭南/越南/台湾区 2026-06-18 ──
    liuyin: { generalId: 'liuyin', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 清海军节度岭南
    zhangshijie: { generalId: 'zhangshijie', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_06' }, // 崖山海战
    chendiaoyan: { generalId: 'chendiaoyan', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 漳州抗元
    dengmaoqi: { generalId: 'dengmaoqi', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 铲平王起义
    gengjingzhong: { generalId: 'gengjingzhong', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 靖南王叛清
    huangdaozhou: { generalId: 'huangdaozhou', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 隆武抗清
    dingbuling: { generalId: 'dingbuling', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_02' }, // 丁朝统一
    alugu: { generalId: 'alugu', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 牡丹社抗倭
    zhengchenggong: { generalId: 'zhengchenggong', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_06' }, // 收复台湾
    ruanhuang: { generalId: 'ruanhuang', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 广南奠基
    washifuren: { generalId: 'washifuren', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 俍兵抗倭
    zhaotuo: { generalId: 'zhaotuo', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 南越武王
    zhimin: { generalId: 'zhimin', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 占城王和亲
    yixusong: { generalId: 'yixusong', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 西瓯抗秦
    wubo: { generalId: 'wubo', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 句町助汉
    chenbaxian: { generalId: 'chenbaxian', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_06' }, // 陈朝开国
    wangshouren: { generalId: 'wangshouren', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 平定南赣
    huanggua4: { generalId: 'huanggua4', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 排瑶起义
    liulong_ying: { generalId: 'liulong_ying', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 南汉高祖
    fanyangmai: { generalId: 'fanyangmai', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 林邑王抗南朝
    xianfuren: { generalId: 'xianfuren', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 俚人平定岭南
    shexiang: { generalId: 'shexiang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 水西土司
    nongzhigao: { generalId: 'nongzhigao', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 侬峒反宋
    lidingguo: { generalId: 'lidingguo', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 两蹶名王
    shidakai: { generalId: 'shidakai', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 翼王征战
    wumian: { generalId: 'wumian', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 侗族起义
    tianyougong: { generalId: 'tianyougong', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 思州土官
    zhengce: { generalId: 'zhengce', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 骆越反汉
    mayuan: { generalId: 'mayuan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_06' }, // 伏波平交趾
    zhengsong: { generalId: 'zhengsong', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_02' }, // 郑主破莫
    chenkai: { generalId: 'chenkai', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 大成国起义
    chenguojun: { generalId: 'chenguojun', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_06' }, // 抗蒙三捷
    baoli_miao: { generalId: 'baoli_miao', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 苗民起义
    yangwanzhe: { generalId: 'yangwanzhe', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 苗军统帅
    zhuyoulang: { generalId: 'zhuyoulang', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 永历帝抗清
    maji: { generalId: 'maji', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 肇庆摧锋军抗元
    funanshe: { generalId: 'funanshe', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 黎族起义
    liuyongfu: { generalId: 'liuyongfu', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 黑旗抗法
    duotong: { generalId: 'duotong', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 夜郎王
    xielongyu: { generalId: 'xielongyu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 牂牁归唐
    cuanxi: { generalId: 'cuanxi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 兴古从征
    shixie: { generalId: 'shixie', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 交趾割据
    shangbazhi: { generalId: 'shangbazhi', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_06' }, // 琉球三山统一
    zhangzhensun: { generalId: 'zhangzhensun', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 韶关抗元·大庾岭殉国
    houandou: { generalId: 'houandou', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 陈朝开国元勋
    weichaoyuan: { generalId: 'weichaoyuan', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 布依起义
      wulin: { generalId: 'wulin', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 剑门关抗金
      liubei: { generalId: 'liubei', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 永安托孤
    yangyinglong: { generalId: 'yangyinglong', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 播州末代
    lite: { generalId: 'lite', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 成汉开国
    suonuomu: { generalId: 'suonuomu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 小金川土司
    wufu_zd: { generalId: 'wufu_zd', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 明代平南中
    azi_wm: { generalId: 'azi_wm', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 乌蒙土司
// ── 巴蜀区 2026-06-18 ──
    zhuran: { generalId: 'zhuran', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 江陵守·名震敌国
    zhugeliang: { generalId: 'zhugeliang', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 以逸待劳北伐（未出子午谷）
    weiyan: { generalId: 'weiyan', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 略阳阳溪守汉中
    wujie: { generalId: 'wujie', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 和尚原仙人关守蜀口
    baochao: { generalId: 'baochao', tier: 'famous', tacticalSkillId: 'tac_08', strategicSkillId: 'str_04' }, // 霆军以寡击众
    yuezhongqi: { generalId: 'yuezhongqi', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 平罗卜藏丹津
    qinliangyu: { generalId: 'qinliangyu', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 白杆兵抗清
    anbangyan: { generalId: 'anbangyan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 奢安之乱
    guanyu: { generalId: 'guanyu', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_06' }, // 水淹七军
    lvwenhuan: { generalId: 'lvwenhuan', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 守襄阳六年抗元
    jixin: { generalId: 'jixin', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 荥阳诳楚
    lidingguo_dx: { generalId: 'lidingguo_dx', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 大西抗清
    changhong: { generalId: 'changhong', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 资中先贤
    luxun: { generalId: 'luxun', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_06' }, // 夷陵火攻
    xiangyan: { generalId: 'xiangyan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 楚将破李信
    zhongxiang: { generalId: 'zhongxiang', tier: 'famous', tacticalSkillId: 'tac_08', strategicSkillId: 'str_05' }, // 武陵钟相起义攻占州县
    wangjian_dy: { generalId: 'wangjian_dy', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 钓鱼城炮击蒙哥
    yangnandang: { generalId: 'yangnandang', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 仇池拓土
    shaluoben_x: { generalId: 'shaluoben_x', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 金川抗清
    puhu: { generalId: 'puhu', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 宕渠賨人随张飞
    zhangfei: { generalId: 'zhangfei', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 巴西破张郃
    tanhou: { generalId: 'tanhou', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 土司起义
    xiangdakun: { generalId: 'xiangdakun', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 向王天子
    tanhou_td: { generalId: 'tanhou_td', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 慈利土司
    ranshouzhong: { generalId: 'ranshouzhong', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 酉阳土司
    shamoke: { generalId: 'shamoke', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 五溪蛮王
    kuaiyue: { generalId: 'kuaiyue', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 蒯氏谋士
    fanmu: { generalId: 'fanmu', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 板楯助汉
    shechongming: { generalId: 'shechongming', tier: 'famous', tacticalSkillId: 'tac_08', strategicSkillId: 'str_04' }, // 叙永奢崇明起兵反明
    ada: { generalId: 'ada', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 僰人末代
    chendao: { generalId: 'chendao', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 白毦兵断后
    luoshao: { generalId: 'luoshao', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 乌蒙土官
    zhaoyun: { generalId: 'zhaoyun', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 长坂坡救主
    pengshichou: { generalId: 'pengshichou', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 溪州铜柱
    shiliudeng: { generalId: 'shiliudeng', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 苗民起义
      xuerengao: { generalId: 'xuerengao', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 薛仁杲据折墌抗唐
    sunang: { generalId: 'sunang', tier: 'ordinary', tacticalSkillId: 'tac_10' },
    mengtian: { generalId: 'mengtian', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 高阙塞长城戍守
  // ── 河西区 2026-06-18 ──
    duanjiong: { generalId: 'duanjiong', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 逢义山破羌·狄道
    huoqubing: { generalId: 'huoqubing', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 骠骑将军河西走廊
    zhanggui: { generalId: 'zhanggui', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 前凉保全河西
    lihao_dunhuang: { generalId: 'lihao_dunhuang', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 西凉开国
    xinqingji: { generalId: 'xinqingji', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 破羌将军
    lizicheng: { generalId: 'lizicheng', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 大顺灭明
    dongyi: { generalId: 'dongyi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 翟王守上郡
    dourong: { generalId: 'dourong', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 河西五郡
    zhaoponu: { generalId: 'zhaoponu', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 破楼兰
    zhangyichao: { generalId: 'zhangyichao', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 归义收复河西
    wangyue_ming: { generalId: 'wangyue_ming', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 红盐池大捷
    caoyijin: { generalId: 'caoyijin', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 归义军节度使
    lijiaqian: { generalId: 'lijiaqian', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 西夏太祖
    lisheng_tang: { generalId: 'lisheng_tang', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 神策平泾原
    chuliji: { generalId: 'chuliji', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 崤函据守
    helianbobo: { generalId: 'helianbobo', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 统万城阳武
    hulvjin: { generalId: 'hulvjin', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 敕勒酋长
    qiewangshijia: { generalId: 'qiewangshijia', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 赤斤蒙古卫
    weiqing: { generalId: 'weiqing', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 取河南地
    huangfugui: { generalId: 'huangfugui', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 度辽将军平羌
    yeliwangrong: { generalId: 'yeliwangrong', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 定川寨破宋
    hunxiewang: { generalId: 'hunxiewang', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 浑邪降汉
    zhangshougui: { generalId: 'zhangshougui', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 瓜州空城破吐蕃
    liangshidu: { generalId: 'liangshidu', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 梁帝割据
    jilasiyi: { generalId: 'jilasiyi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 守应理抗蒙
    liyuanhao: { generalId: 'liyuanhao', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 好水川大捷
    yaodui: { generalId: 'yaodui', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 会州箭贯耳
    zhongshidao: { generalId: 'zhongshidao', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 种家将守边
    hunjian: { generalId: 'hunjian', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 朔方破吐蕃
    guoziyi: { generalId: 'guoziyi', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 中兴名将
    lijing: { generalId: 'lijing', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 贞观四年李靖率三千骑出恶阳岭夜袭定襄城
    liji: { generalId: 'liji', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 李勣（徐世勣）唐开国名将
    lubode: { generalId: 'lubode', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 筑居延塞
    liling: { generalId: 'liling', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 荆楚五千步卒出居延战匈奴（《史记·李将军列传》）
    liuquan: { generalId: 'liuquan', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 隋破吐谷浑、河源积石屯田（《隋书·刘权传》）
    juqumengxun: { generalId: 'juqumengxun', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 北凉灭西凉
    // ── 中原区 2026-06-18 ──
    lichong: { generalId: 'lichong', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 秦陇西郡守·李氏始祖
    sunchuanting: { generalId: 'sunchuanting', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 潼关抗李自成
    tianchengsi: { generalId: 'tianchengsi', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 魏博藩镇
    ranmin: { generalId: 'ranmin', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 杀胡令
    xianzhen: { generalId: 'xianzhen', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 城濮崤山
    huangfusong: { generalId: 'huangfusong', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 平黄巾
    masui: { generalId: 'masui', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 洹水破田悦
    wangdao: { generalId: 'wangdao', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 王与马共天下
    fanchong: { generalId: 'fanchong', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 赤眉入长安
    chenqingzhi: { generalId: 'chenqingzhi', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 七千白袍入洛阳
    xiangyu: { generalId: 'xiangyu', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 巨鹿彭城
    limi_wz: { generalId: 'limi_wz', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 瓦岗夺兴洛仓
    tiandan: { generalId: 'tiandan', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 即墨火牛
    xuxuan_cm: { generalId: 'xuxuan_cm', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 赤眉丞相
    sunbin: { generalId: 'sunbin', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 围魏救赵·长驱直入（陆战奇谋，非水战）
    zhouyafu: { generalId: 'zhouyafu', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 周亚夫平七国：敌战计避实击虚+长驱直入
    liuqi: { generalId: 'liuqi', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 顺昌破金
    caocao: { generalId: 'caocao', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 官渡之战
    weixiaokuan: { generalId: 'weixiaokuan', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 玉壁之战
    xusheng_wu: { generalId: 'xusheng_wu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 吴将疑城
    mizhu: { generalId: 'mizhu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 资助刘备
    guotai_bb: { generalId: 'guotai_bb', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 白波军
    geshuhan: { generalId: 'geshuhan', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 潼关守将
    zongze: { generalId: 'zongze', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 东京留守
    limaozhen: { generalId: 'limaozhen', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 岐国军阀
    caocan: { generalId: 'caocan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_02' }, // 曹参身被七十创攻城略地功最多
    mengzongzheng_jn: { generalId: 'mengzongzheng', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 三关之捷

    lvmeng: { generalId: 'lvmeng', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_06' }, // 白衣渡江
    zhoubo: { generalId: 'zhoubo', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 安刘氏
    liuyan_ly: { generalId: 'liuyan_ly', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 舂陵起兵
    jifa: { generalId: 'jifa', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 武王伐纣
    quanrongwang: { generalId: 'quanrongwang', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 犬戎弑幽王
    chairong: { generalId: 'chairong', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 高平之战·殿前诸班
    wangjian: { generalId: 'wangjian', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_02' }, // 王翦灭楚灭赵：敌战计避实击虚+攻城拔寨
    luhunrongwang: { generalId: 'luhunrongwang', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 陆浑戎
    hanshizhong: { generalId: 'hanshizhong', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 黄天荡
    diqing: { generalId: 'diqing', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 面涅将军
    dixin: { generalId: 'dixin', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 纣王征东夷
    liguangbi: { generalId: 'liguangbi', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 太原守城·河间突骑
    baoyuan_han: { generalId: 'baoyuan_han', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 韩将暴鸢
    liufutong: { generalId: 'liufutong', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 红巾白莲
    shenbo: { generalId: 'shenbo', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 申国受封
    simayi: { generalId: 'simayi', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 冢虎
    zhaoshe: { generalId: 'zhaoshe', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 阏与之战
    zhuyuanzhang: { generalId: 'zhuyuanzhang', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 洪武大帝
    shangyang: { generalId: 'shangyang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 商鞅变法
    yuefei: { generalId: 'yuefei', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 郾城大捷
    yuanshao: { generalId: 'yuanshao', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 四世三公
    haozhao: { generalId: 'haozhao', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 陈仓守城
    zuti: { generalId: 'zuti', tier: 'famous', tacticalSkillId: 'tac_04', strategicSkillId: 'str_03' }, // 杞桓公
    gaoqiong: { generalId: 'gaoqiong', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 澶渊主战
    zhangxun: { generalId: 'zhangxun', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 睢阳守城
    liuxiu: { generalId: 'liuxiu', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 昆阳之战
    fankuai: { generalId: 'fankuai', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 鸿门宴
    changyuchun: { generalId: 'changyuchun', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 常十万
    luzhonglian: { generalId: 'luzhonglian', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 义不帝秦
    zhaokuangyin: { generalId: 'zhaokuangyin', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 陈桥兵变
    zhuwen: { generalId: 'zhuwen', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 后梁太祖
    // ── 北方区 2026-06-18 ──
    gongsundu: { generalId: 'gongsundu', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 辽东割据
    yanganer2: { generalId: 'yanganer2', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 红袄天顺
    mafang: { generalId: 'mafang', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 开国第一功臣
    tuobagui: { generalId: 'tuobagui', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 参合陂
    liukun: { generalId: 'liukun', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 晋阳孤守抗刘渊
    zhangrou: { generalId: 'zhangrou', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 保定重建
    quyi: { generalId: 'quyi', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 界桥先登破白马
    gaochanggong: { generalId: 'gaochanggong', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 邙山五百骑
    yanzhenqing: { generalId: 'yanzhenqing', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 平原抗安史
    gongsunzan: { generalId: 'gongsunzan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 白马义从
    wusangui: { generalId: 'wusangui', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 山海关
    liangshidu_ls: { generalId: 'liangshidu_ls', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 梁国割据
    longjia: { generalId: 'longjia', tier: 'ordinary', tacticalSkillId: 'tac_05' }, // 雕阴抗秦兵败
    yangshezhi: { generalId: 'yangshezhi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 铜鞮大夫
    tianyu: { generalId: 'tianyu', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 征北将军镇乌桓鲜卑
    wangyanzhang: { generalId: 'wangyanzhang', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 王铁枪乐安破晋
    tuobashiyijian: { generalId: 'tuobashiyijian', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 代国基业
    erzhurong: { generalId: 'erzhurong', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 滏口七千破三十万
    zheyuqing: { generalId: 'zheyuqing', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 子河汊破辽
    limu_yanyue: { generalId: 'limu_yanyue', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 雁门破匈奴
    leyi: { generalId: 'leyi', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_02' }, // 伐齐下七十城
    zhongshiheng: { generalId: 'zhongshiheng', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 环州筑城
    zhaoshe_zd: { generalId: 'zhaoshe_zd', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 阏与之战
    tuobaliwei: { generalId: 'tuobaliwei', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 拓跋始祖
    // ── 北方关隘 2026-06-19 ──
    wangba: { generalId: 'wangba', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 王霸上谷突骑
    zhouyuji: { generalId: 'zhouyuji', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 宁武殉国
    yanghong: { generalId: 'yanghong', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 明代紫荆关戍守
    huoshuchu: { generalId: 'huoshuchu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 霍国始封君
        xiangdancheng: { generalId: 'xiangdancheng', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 武陵蛮反马援

// ── 江南区 2026-06-18 ──
    shikefa: { generalId: 'shikefa', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 扬州孤守
    zhouyu: { generalId: 'zhouyu', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_06' }, // 赤壁火攻
    fangla_jn: { generalId: 'fangla_jn', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 圣公起义
    fangguozhen: { generalId: 'fangguozhen', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 方国珍割据浙东
    zouyao: { generalId: 'zouyao', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 东瓯王
    doulian: { generalId: 'doulian', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 若敖夜袭
    chuzhuangwang: { generalId: 'chuzhuangwang', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 邲之战
    luxun_sunwu: { generalId: 'luxun_sunwu', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_06' }, // 夷陵火攻·江陵镇守
    goujian: { generalId: 'goujian', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 卧薪尝胆
    hetengjiao: { generalId: 'hetengjiao', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 衡州抗清
    zhaopusheng: { generalId: 'zhaopusheng', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 双刀赵
    yangzhong: { generalId: 'yangzhong', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 隋国公
    yanganer: { generalId: 'yanganer', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 杨安儿红袄军克登莱
    mayin: { generalId: 'mayin', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 马楚开国
    qijiguang: { generalId: 'qijiguang', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 戚继光横屿灭倭
    yezongliu: { generalId: 'yezongliu', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 叶宗留矿工起义
    zhangshicheng: { generalId: 'zhangshicheng', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 大周盐丁
    liuyu: { generalId: 'liuyu', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 却月阵灭南燕
    husansheng: { generalId: 'husansheng', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 胡三省浙东义兵抗元
    ganning: { generalId: 'ganning', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_06' }, // 锦帆百骑
    qianliu: { generalId: 'qianliu', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 吴越开国
    qiufu_jn: { generalId: 'qiufu_jn', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 裘甫起义
    shenqingzhi: { generalId: 'shenqingzhi', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 沈氏老将
    huangchao: { generalId: 'huangchao', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 冲天大将军
    zhanghuangyan: { generalId: 'zhanghuangyan', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 鲁监抗清
    linshihong: { generalId: 'linshihong', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 楚帝鄱阳
    mengzongzheng: { generalId: 'mengzongzheng', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 枣阳守城
    yingbu: { generalId: 'yingbu', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 九江王
    wangchao: { generalId: 'wangchao', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 光州入闽
    linshuangwen: { generalId: 'linshuangwen', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 顺天起义
    huangxie: { generalId: 'huangxie', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 春申君
    zulang: { generalId: 'zulang', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 山越大帅
    leiwanxing: { generalId: 'leiwanxing', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 畲民起义
    pushougeng: { generalId: 'pushougeng', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 泉州蒲氏
    wanghua: { generalId: 'wanghua', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 汪华保境
    wentianxiang: { generalId: 'wentianxiang', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 勤王抗元·闽粤赣募兵沾边客家
    chuguangyi: { generalId: 'chuguangyi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 储氏望族诗人；舒州团练沾边
    caojingzong: { generalId: 'caojingzong', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 梁郢州刺史据城退魏（《梁书·曹景宗传》）
    zhoudi: { generalId: 'zhoudi', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 陈周迪据临川拒讨
    ouyangyi: { generalId: 'ouyangyi', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 梁欧阳頠庐陵蛮兵
    chunshenjun_h: { generalId: 'chunshenjun_h', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 黄国后裔
    yuyunwen: { generalId: 'yuyunwen', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_06' }, // 采石大捷
    wumingche: { generalId: 'wumingche', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 太建北伐
    xiexuan: { generalId: 'xiexuan', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 淝水之战
    yuanshu_zn: { generalId: 'yuanshu_zn', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 仲家皇帝
    zhangxianzhong: { generalId: 'zhangxianzhong', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 大西王
    sunquan: { generalId: 'sunquan', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_06' }, // 赤壁抗曹
    lianpo: { generalId: 'lianpo', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 长平据守
// ── 2026-06-20 批量补充缺失档案 ──
    liduozuo: {
        generalId: 'liduozuo',
        tacticalSkillId: 'tac_01',
    },
    wangshenzhi: {
        generalId: 'wangshenzhi',
        tacticalSkillId: 'tac_02',
        strategicSkillId: 'str_01',
    },
    liucongxiao: {
        generalId: 'liucongxiao',
        tacticalSkillId: 'tac_03',
    },
    yangyizhong: {
        generalId: 'yangyizhong',
        tacticalSkillId: 'tac_04',
        strategicSkillId: 'str_02',
    },
    xiajianlaizheng: {
        generalId: 'xiajianlaizheng',
        tacticalSkillId: 'tac_05',
    },
    wangqi: {
        generalId: 'wangqi',
        tacticalSkillId: 'tac_06',
    },
    yuwandaqin: {
        generalId: 'yuwandaqin',
        tacticalSkillId: 'tac_07',
    },
    wangjian_kr: {
        generalId: 'wangjian_kr',
        tacticalSkillId: 'tac_08',
        strategicSkillId: 'str_03',
    },
    gaoyanshou: {
        generalId: 'gaoyanshou',
        tacticalSkillId: 'tac_09',
    },
    menglielun: {
        generalId: 'menglielun',
        tacticalSkillId: 'tac_10',
    },
    bombogor: {
        generalId: 'bombogor',
        tacticalSkillId: 'tac_01',
    },
    baiyindali: {
        generalId: 'baiyindali',
        tacticalSkillId: 'tac_02',
    },
    wanyantiege: {
        generalId: 'wanyantiege',
        tacticalSkillId: 'tac_03',
    },
    tuobamao: {
        generalId: 'tuobamao',
        tacticalSkillId: 'tac_04',
        strategicSkillId: 'str_04',
    },
    dayanhan: {
        generalId: 'dayanhan',
        tacticalSkillId: 'tac_05',
        strategicSkillId: 'str_05',
    },
    zhangwenxiu: {
        generalId: 'zhangwenxiu',
        tacticalSkillId: 'tac_06',
    },
    tuomin: {
        generalId: 'tuomin',
        tacticalSkillId: 'tac_07',
    },
    yuchisheng: {
        generalId: 'yuchisheng',
        tacticalSkillId: 'tac_08',
    },
    zhangliao: {
        generalId: 'zhangliao',
        tacticalSkillId: 'tac_09',
        strategicSkillId: 'str_06',
    },
    angui: {
        generalId: 'angui',
        tacticalSkillId: 'tac_10',
    },
    xinwuxian: {
        generalId: 'xinwuxian',
        tacticalSkillId: 'tac_01',
    },
    ruanfuying: {
        generalId: 'ruanfuying',
        tacticalSkillId: 'tac_02',
        strategicSkillId: 'str_01',
    },
    fuhong: {
        generalId: 'fuhong',
        tacticalSkillId: 'tac_03',
        strategicSkillId: 'str_02',
    },
    bamanzi: {
        generalId: 'bamanzi',
        tacticalSkillId: 'tac_04',
    },
    yangaoging: {
        generalId: 'yangaoging',
        tacticalSkillId: 'tac_05',
    },
    duanxiushi: {
        generalId: 'duanxiushi',
        tacticalSkillId: 'tac_06',
    },
    tiexuan: {
        generalId: 'tiexuan',
        tacticalSkillId: 'tac_07',
    },
    guandingfu: {
        generalId: 'guandingfu',
        tacticalSkillId: 'tac_08',
    },
    zhangxiu: {
        generalId: 'zhangxiu',
        tacticalSkillId: 'tac_09',
    },
    wanyanchenheshang: {
        generalId: 'wanyanchenheshang',
        tacticalSkillId: 'tac_10',
        strategicSkillId: 'str_03',
    },
    anlushan: {
        generalId: 'anlushan',
        tacticalSkillId: 'tac_01',
        strategicSkillId: 'str_04',
    },
    yanyangzhao: {
        generalId: 'yanyangzhao',
        tacticalSkillId: 'tac_02',
        strategicSkillId: 'str_05',
    },
    wangyan_tx: {
        generalId: 'wangyan_tx',
        tacticalSkillId: 'tac_03',
    },
    sunwu: {
        generalId: 'sunwu',
        tacticalSkillId: 'tac_04',
        strategicSkillId: 'str_06',
    },
    zhuwenzheng: {
        generalId: 'zhuwenzheng',
        tacticalSkillId: 'tac_05',
    },
    shaozizheng: {
        generalId: 'shaozizheng',
        tacticalSkillId: 'tac_06',
    },
    yanyan: {
        generalId: 'yanyan',
        tacticalSkillId: 'tac_05',
    },
    beigongboyu: {
        generalId: 'beigongboyu',
        tacticalSkillId: 'tac_09',
    },
    cenmeng: {
        generalId: 'cenmeng',
        tacticalSkillId: 'tac_03',
    },
    amishi: {
        generalId: 'amishi',
        tacticalSkillId: 'tac_09',
    },
    jiangwan: {
        generalId: 'jiangwan',
        tacticalSkillId: 'tac_10',
    },
    shencongyue: {
        generalId: 'shencongyue',
        tacticalSkillId: 'tac_05',
    },
    panhu: {
        generalId: 'panhu',
        tacticalSkillId: 'tac_09',
    },
    zhaofan: {
        generalId: 'zhaofan',
        tacticalSkillId: 'tac_09',
    },
    songjingyang: {
        generalId: 'songjingyang',
        tacticalSkillId: 'tac_05',
    },
    lixuance: {
        generalId: 'lixuance',
        tacticalSkillId: 'tac_04',
    },
    chisongdezan: {
        generalId: 'chisongdezan',
        tacticalSkillId: 'tac_03',
    },
    meireiluozhujiacuo: {
        generalId: 'meireiluozhujiacuo',
        tacticalSkillId: 'tac_05',
    },
    yangyingju: {
        generalId: 'yangyingju',
        tacticalSkillId: 'tac_10',
    },
    dexinga: {
        generalId: 'dexinga',
        tacticalSkillId: 'tac_05',
    },
    wandezhaxi: {
        generalId: 'wandezhaxi',
        tacticalSkillId: 'tac_09',
    },
    abo: {
        generalId: 'abo',
        tacticalSkillId: 'tac_09',
    },
    donghuwang: {
        generalId: 'donghuwang',
        tacticalSkillId: 'tac_09',
    },
    dinglingwang: {
        generalId: 'dinglingwang',
        tacticalSkillId: 'tac_09',
    },
    bunaibou: {
        generalId: 'bunaibou',
        tacticalSkillId: 'tac_09',
    },
    nanlv: {
        generalId: 'nanlv',
        tacticalSkillId: 'tac_09',
    },
    gonggudaozhu: {
        generalId: 'gonggudaozhu',
        tacticalSkillId: 'tac_10',
    },
    yizhiwang: {
        generalId: 'yizhiwang',
        tacticalSkillId: 'tac_10',
    },
    ayinuqiuzhang: {
        generalId: 'ayinuqiuzhang',
        tacticalSkillId: 'tac_09',
    },
    liyiqi: {
        generalId: 'liyiqi',
        tacticalSkillId: 'tac_02',
    },
    gongsunshu: {
        generalId: 'gongsunshu',
        tacticalSkillId: 'tac_05',
    },
    molingtuo: {
        generalId: 'molingtuo',
        tacticalSkillId: 'tac_10',
    },
    huangshimi: {
        generalId: 'huangshimi',
        tacticalSkillId: 'tac_10',
    },


    weitou_wang: { generalId: 'weitou_wang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ???
    yumi_wang: { generalId: 'yumi_wang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ???
    qiemo_wang: { generalId: 'qiemo_wang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ???
    pishan_wang: { generalId: 'pishan_wang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ???
    ruoqiang_wang: { generalId: 'ruoqiang_wang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ???
    weili_wang: { generalId: 'weili_wang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ???
    bailong_shuai: { generalId: 'bailong_shuai', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ?????
    wensu_wang: { generalId: 'wensu_wang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ???
    duerbote_taiji: { generalId: 'duerbote_taiji', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ??????
    sai_wang: { generalId: 'sai_wang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ??
    xiye_wang: { generalId: 'xiye_wang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ???
    huibu_boke: { generalId: 'huibu_boke', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ????
    faqiang_wang: { generalId: 'faqiang_wang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ???
    kangba_tusi: { generalId: 'kangba_tusi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ????
    keliyaboke: { generalId: 'keliyaboke', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ?????
    zhuowangsun: { generalId: 'zhuowangsun', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ???
    yongguo_jun: { generalId: 'yongguo_jun', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ????
    dayanlin: { generalId: 'dayanlin', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ??????
    jingcheng_fushi: { generalId: 'jingcheng_fushi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ????
    wangmang: { generalId: 'wangmang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // ????

    fulianchou: { generalId: 'fulianchou', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 吐谷浑可汗伏俟城

    yaerbeige: { generalId: 'yaerbeige', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 雅尔贝格

    abulihalisi: { generalId: 'abulihalisi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 法里贡埃米尔法里亚布
    luozhentan: { generalId: 'luozhentan', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 唐护密国王法扎巴德
    haidaer: { generalId: 'haidaer', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 卡乌斯之子阿夫申吉扎克
    shamalike: { generalId: 'shamalike', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 乌古斯叶护养吉干
    dukake: { generalId: 'dukake', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 铁弓苏巴什真珠河
    farighun: { generalId: 'farighun', tier: 'ordinary', tacticalSkillId: 'tac_10' },
    ali_asad: { generalId: 'ali_asad', tier: 'ordinary', tacticalSkillId: 'tac_10' },
    afshin: { generalId: 'afshin', tier: 'ordinary', tacticalSkillId: 'tac_10' },
    aral_bek: { generalId: 'aral_bek', tier: 'ordinary', tacticalSkillId: 'tac_10' },
    seljuk: { generalId: 'seljuk', tier: 'ordinary', tacticalSkillId: 'tac_10' },
    xingan_zhang: { generalId: 'xingan_zhang', tier: 'ordinary', tacticalSkillId: 'tac_10' },
    dongping_zhang: { generalId: 'dongping_zhang', tier: 'ordinary', tacticalSkillId: 'tac_10' },



    wuli: { generalId: 'wuli', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 卢氏戎子吾离陆浑关

    yuchisheng_k: { generalId: 'yuchisheng_k', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 尉迟胜克里雅山口
    suomai: { generalId: 'suomai', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 索劢屯田楼兰三陇沙
    gejiayun: { generalId: 'gejiayun', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 盖嘉运拔换城握瑟德
    yusubu: { generalId: 'yusubu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 玉素布阿克苏玉尔滚
    suonuomugunbu: { generalId: 'suonuomugunbu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 索诺木衮布理塘宣抚司
    lujili: { generalId: 'lujili', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 庐戢黎庸将竹山
    yuyouzhao: { generalId: 'yuyouzhao', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 鱼有沼镜城笼耳
    tianyi: { generalId: 'tianyi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 田邑上党太守长子

    // ── 2026-06-20 补全：FactionGenerals 有将无档（add:check 33 条）──
    barhudai: { generalId: 'barhudai', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 巴尔虎代·尼夫河
    tuiyin: { generalId: 'tuiyin', tier: 'ordinary', tacticalSkillId: 'tac_02' }, // 东胡推寅
    muronghuang: { generalId: 'muronghuang', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 慕容皝范阳燕
    gaerdan: { generalId: 'gaerdan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 噶尔丹准噶尔
    takuna: { generalId: 'takuna', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 塔库纳·吉里密
    baiyanhu: { generalId: 'baiyanhu', tier: 'famous', tacticalSkillId: 'tac_08', strategicSkillId: 'str_04' }, // 白彦虎回军
    zongkaba: { generalId: 'zongkaba', tier: 'ordinary', tacticalSkillId: 'tac_01' }, // 宗喀巴·甘丹
    monuhe: { generalId: 'monuhe', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 摩奴诃·孟族
    fan_d: { generalId: 'fan_d', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 尉犁泛
    daihu: { generalId: 'daihu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 代胡·皮山
    zhahaluo: { generalId: 'zhahaluo', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 扎哈罗·那乃
    cemutehe: { generalId: 'cemutehe', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 策穆特赫·费雅喀
    qinggunzabu: { generalId: 'qinggunzabu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 青滚杂卜·图瓦
    sangjiwen: { generalId: 'sangjiwen', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 桑吉温·达隆
    chisang: { generalId: 'chisang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 赤桑·霍尔
    nangqianjiabo: { generalId: 'nangqianjiabo', tier: 'ordinary', tacticalSkillId: 'tac_05' }, // 囊谦加波·隆庆
    kalunshiwei: { generalId: 'kalunshiwei', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 海兰察·兴安
    zhaowuling: { generalId: 'zhaowuling', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 赵武灵王·灵丘
    zhouyuji_nw: { generalId: 'zhouyuji_nw', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 周遇吉·楼烦
    anguo: { generalId: 'anguo', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 扜弥王安国
    fuduxin: { generalId: 'fuduxin', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 伏阇信·克里雅
    niechizanpu: { generalId: 'niechizanpu', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 聂赤·发羌
    suonanjiabo: { generalId: 'suonanjiabo', tier: 'ordinary', tacticalSkillId: 'tac_05' }, // 索南加波·觉木宗
    guyi: { generalId: 'guyi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 姑翼·温宿
    anmoshenpan: { generalId: 'anmoshenpan', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 安末深盘·且末
    douti: { generalId: 'douti', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 兜题·尉头
    amuhar: { generalId: 'amuhar', tier: 'ordinary', tacticalSkillId: 'tac_02' }, // 阿穆哈尔·鄂罗克
    langtan: { generalId: 'langtan', tier: 'ordinary', tacticalSkillId: 'tac_02' }, // 郎坦·东平
    tumenjiergale: { generalId: 'tumenjiergale', tier: 'ordinary', tacticalSkillId: 'tac_02' }, // 图门吉尔嘎勒·布里亚特
    baidibushuai: { generalId: 'baidibushuai', tier: 'ordinary', tacticalSkillId: 'tac_03' }, // 白狄子
    ahuihui: { generalId: 'ahuihui', tier: 'ordinary', tacticalSkillId: 'tac_02' }, // 阿会毁·库莫奚
    wangzhi_pirate: { generalId: 'wangzhi_pirate', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_06' }, // 汪直·海寇
    weituqi: { generalId: 'weituqi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 尉屠耆·鄯善
  halixingge: { generalId: 'halixingge', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_02' }, // 哈里·辛格·旁遮普：攻战计侵掠如火+攻城拔寨，开伯尔山口工程
  minande: { generalId: 'minande', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_02' }, // 米南德·那竭：攻战计侵掠如火+攻城拔寨，印度-希腊东进兴都库什
  aihamaide: { generalId: 'aihamaide', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_02' }, // 艾哈迈德·杜兰尼：攻战计侵掠如火+攻城拔寨，九征印度建帝国
  mujier: { generalId: 'mujier', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 穆吉尔·穆尔加布：哀兵必胜守小木鹿
  gaiwamu: { generalId: 'gaiwamu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 盖瓦姆·巴哈尔兹：深沟高垒守泰巴德
  subashi: { generalId: 'subashi', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 苏巴什·哈里：置之死地丹达纳克破阵
  suhela: { generalId: 'suhela', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_02' }, // 苏赫拉·卡伦：敌战计避实击虚+攻城拔寨，萨珊东北铁壁
  yakubusafaer: { generalId: 'yakubusafaer', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_02' }, // 雅库布·萨法尔·锡斯坦：攻战计侵掠如火+攻城拔寨，铜匠起兵席卷呼罗珊
  sulun: { generalId: 'sulun', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 苏伦·德兰吉亚：敌战计避实击虚+长驱直入，帕提亚回马箭灭克拉苏
  abumusilin: { generalId: 'abumusilin', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 阿布·穆斯林·呼罗珊：敌战计避实击虚+长驱直入，黑旗席卷波斯
  shapuer: { generalId: 'shapuer', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 沙普尔·阿巴尔：攻战计侵掠如火+长驱直入，三破罗马擒瓦勒良
    shilang: {
        generalId: 'shilang',
        tier: 'famous',
        tacticalSkillId: 'tac_02',
        strategicSkillId: 'str_04',
    },

    lisheng: {
        generalId: 'lisheng',
        tier: 'famous',
        tacticalSkillId: 'tac_01',
        strategicSkillId: 'str_04',
    },
    xiaomohe: {
        generalId: 'xiaomohe',
        tier: 'famous',
        tacticalSkillId: 'tac_03',
    },
    sudinfang: {
        generalId: 'sudinfang',
        tier: 'famous',
        tacticalSkillId: 'tac_02',
        strategicSkillId: 'str_04',
    },
    xuerengui: {
        generalId: 'xuerengui',
        tier: 'famous',
        tacticalSkillId: 'tac_02',
        strategicSkillId: 'str_04',
    },
    lisu: {
        generalId: 'lisu',
        tier: 'famous',
        tacticalSkillId: 'tac_02',
        strategicSkillId: 'str_04',
    },
    zhoudewei: {
        generalId: 'zhoudewei',
        tier: 'famous',
        tacticalSkillId: 'tac_03',
        strategicSkillId: 'str_04',
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