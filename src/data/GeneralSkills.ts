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

/** 守军系统技 effect（非战术十格 / 战略六格） */
export type GarrisonSystemEffect = 'pass_garrison_mult';

export interface GarrisonSystemSkillDef {
    id: string;
    displayName: string;
    effect: GarrisonSystemEffect;
    magnitude: number;
}

export const PASS_GARRISON_DEFENSE_SKILL: GarrisonSystemSkillDef = {
    id: 'garr_pass_juxian',
    displayName: '拒险而战',
    effect: 'pass_garrison_mult',
    magnitude: 1.2,
};

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
    zhudi: { generalId: 'zhudi', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_01' }, // 靖难军白沟突击
    yuqian: { generalId: 'yuqian', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 京师保卫战
    lisheng: { generalId: 'lisheng', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 保境：断敌粮道后反击
    yangxingmi: { generalId: 'yangxingmi', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_02' }, // 清口之战破孙儒、守淮南
    wangping: { generalId: 'wangping', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 244年兴势之战据险大破曹爽
    anuluvtuo: { generalId: 'anuluvtuo', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 蒲甘王朝东征西讨
    machao: { generalId: 'machao', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 潼关决死突击
    baiba: { generalId: 'baiba', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 龟兹内乱：哀兵复国
    lunqinling: { generalId: 'lunqinling', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 龙支之战据险抗击唐军
    chengjisihan: { generalId: 'chengjisihan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_01' }, // 蒙古西征神速奔袭
    dazuorong: { generalId: 'dazuorong', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 渤海开基：筑城固守建国
    jiangganzan: { generalId: 'jiangganzan', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_06' }, // 金岘大捷：守土反击破辽
    zulijunshi: { generalId: 'zulijunshi', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_06' }, // 凑川败后据九州水师固守
    tiemuer: { generalId: 'tiemuer', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_01' }, // 六年征服千里闪击
    nalixuan: { generalId: 'nalixuan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_06' }, // 象战击杀缅甸王储复国
    fuhao: { generalId: 'fuhao', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 征伐土方武丁妇好率军突击
    lvbu: { generalId: 'lvbu', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 濮阳陷阵、下邳决死
    hanxin: { generalId: 'hanxin', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 暗度陈仓出奇击三秦
    wuqi: { generalId: 'wuqi', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_02' }, // 治魏军严明后破秦五城
    nuerhachi: { generalId: 'nuerhachi', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 萨尔浒野战突击
    jinyixin: { generalId: 'jinyixin', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_03' }, // 萨円大捷守城反攻
    sangjiaer: { generalId: 'sangjiaer', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 中亚草原对峙以逸待变
    menggong: { generalId: 'menggong', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_02' }, // 枣阳孤城死守破蒙古
    yangxingmi: { generalId: 'yangxingmi', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_02' }, // 清口之战破孙儒守淮南
    nanmuzhengcheng: { generalId: 'nanmuzhengcheng', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 千早城笼城死守抗幕府
    chenwang: { generalId: 'chenwang', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 马韩辰王治月支国
    chengmingzhen: { generalId: 'chengmingzhen', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_06' }, // 卑沙城水陆并进攻克
    kangwang: { generalId: 'kangwang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 奴儿干都司戍边
    ashinayandu: { generalId: 'ashinayandu', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 阿尔泰金山突厥
    peishenfu: { generalId: 'peishenfu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 朅盘陀石头城戍守
    hanritianzhongwang: { generalId: 'hanritianzhongwang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 公主堡渴盘陀戍守
    cewangzhabu: { generalId: 'cewangzhabu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 札萨克图汗部
    amursana: { generalId: 'amursana', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 金山辉特部反清
    liujintang: { generalId: 'liujintang', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_02' }, // 达坂城收复新疆
    shatuonasu: { generalId: 'shatuonasu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 独山城处月部
    manasi: { generalId: 'manasi', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 柯尔克孜史诗英雄
    zhangyao: { generalId: 'zhangyao', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_02' }, // 星星峡嵩武军入疆
    banchao: { generalId: 'banchao', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 阳关定远侯通西域
    chelingwubashi: { generalId: 'chelingwubashi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 布尔根乌梁海部
    // ── 日本 ──
    dechuangjiakang: { generalId: 'dechuangjiakang', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 关原后稳坐江户待变
    wutianxinxuan: { generalId: 'wutianxinxuan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 川中岛铁骑突击
    shangshanqianxin: { generalId: 'shangshanqianxin', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 川中岛车悬突击
    fengchenxiuji: { generalId: 'fengchenxiuji', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_01' }, // 鸟取忍城粮道奇袭
    zhentianxingcun: { generalId: 'zhentianxingcun', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 大阪夏之阵赤备突击
    yidazhengzong: { generalId: 'yidazhengzong', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 独眼兜冲阵
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
    nanmuzhengcheng: { generalId: 'nanmuzhengcheng', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 千早城笼城死守抗幕府
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
    chenwang: { generalId: 'chenwang', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 马韩辰王治月支国
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
    chengmingzhen: { generalId: 'chengmingzhen', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_06' }, // 卑沙城水陆并进攻克
    kangwang: { generalId: 'kangwang', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 奴儿干都司戍边区 ──
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
    sharhuda: { generalId: 'sharhuda', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_02' }, // 宁古塔章京击退俄军斯捷潘诺夫
    yelvabaoji: { generalId: 'yelvabaoji', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 燕京游击断粮
    yelvxiuge: { generalId: 'yelvxiuge', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 满城大败宋师以逸待劳
    wanyanloushi: { generalId: 'wanyanloushi', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_02' }, // 襄阳六年围城（@大金会宁）
    shilu: { generalId: 'shilu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 完颜始祖据黑水故地
    menglelun: { generalId: 'menglelun', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 雅克萨达斡尔据寨
    yilv: { generalId: 'yilv', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 义律部哀兵守境
        liguang: { generalId: 'liguang', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 飞将军雁门
    ashinayandu: { generalId: 'ashinayandu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 突厥金山
    yuwentai: { generalId: 'yuwentai', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 沙苑以少胜多
    yexian: { generalId: 'yexian', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 土木之变
// ── 草原区 2026-06-18 ──
    yelvdeguang: { generalId: 'yelvdeguang', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_02' }, // 灭后唐取汴京
    xiwanghuilibao: { generalId: 'xiwanghuilibao', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 奚王自立，决死抗战
    chisipijia: { generalId: 'chisipijia', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 葛逻禄纵横西域外交
    chuormahan: { generalId: 'chuormahan', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_01' }, // 西征波斯快速穿插
    tuoheituoa: { generalId: 'tuoheituoa', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 蔑儿乞十余年死战成吉思汗
    yexian: { generalId: 'yexian', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_03' }, // 土木堡以逸待劳大破明军
    andahan: { generalId: 'andahan', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 庚戌之变长驱围北京
    yesugai: { generalId: 'yesugai', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_01' }, // 也速该草原奔袭
    yuwentai: { generalId: 'yuwentai', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 沙苑据险大破高欢
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
    gulipeiluo: { generalId: 'gulipeiluo', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 骨力裴罗统一回鹘诸部
    dougu: { generalId: 'dougu', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_02' }, // 东汉窦固击北匈奴于蒲类海
    zakulan: { generalId: 'zakulan', tier: 'ordinary', tacticalSkillId: 'tac_02' }, // 锡伯神箭手传说
    puguhuaien: { generalId: 'puguhuaien', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_02' }, // 平乱后叛唐据守
    zhaheganbu: { generalId: 'zhaheganbu', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 克烈部游击混战
    tuolei: { generalId: 'tuolei', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 三峰山奇袭灭金主力
    zhamuhe: { generalId: 'zhamuhe', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 十三翼之战草原奇袭
    sachabieqi: { generalId: 'sachabieqi', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 主儿乞部决战
    chechenhanshuolei: { generalId: 'chechenhanshuolei', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 车臣部驻牧固守
        peishenfu: { generalId: 'peishenfu', tier: 'ordinary', tacticalSkillId: 'tac_10' },
    hanritianzhong: { generalId: 'hanritianzhong', tier: 'ordinary', tacticalSkillId: 'tac_10' },
    cewangzhabu: { generalId: 'cewangzhabu', tier: 'ordinary', tacticalSkillId: 'tac_10' },
    amuersana: { generalId: 'amuersana', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' },
    liujintang: { generalId: 'liujintang', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' },
    shatuonasu: { generalId: 'shatuonasu', tier: 'ordinary', tacticalSkillId: 'tac_10' },
    manasi: { generalId: 'manasi', tier: 'ordinary', tacticalSkillId: 'tac_10' },
    yuchiyao: { generalId: 'yuchiyao', tier: 'ordinary', tacticalSkillId: 'tac_10' },
    zhangyao_x: { generalId: 'zhangyao_x', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' },
    chelingwubashi: { generalId: 'chelingwubashi', tier: 'ordinary', tacticalSkillId: 'tac_10' },
// ── 西域区 2026-06-18 ──
    xian_suoche_wang: { generalId: 'xian_suoche_wang', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 莎车王纵横西域外交
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
    sheyeboluo: { generalId: 'sheyeboluo', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 阇耶波罗守高附抗加兹尼
    xibanni: { generalId: 'xibanni', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 昔班尼攻布哈拉建汗国
    liejiaomi: { generalId: 'liejiaomi', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 乌孙昆莫西迁奇袭月氏
        ganshouchang: { generalId: 'ganshouchang', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 与陈汤共灭郅支

// ── 中亚区 2026-06-18 ──
    mohemo: { generalId: 'mohemo', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 花剌子模鼎盛
    hasimu: { generalId: 'hasimu', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 哈萨克汗国统一
    dewasitiqi: { generalId: 'dewasitiqi', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 粟特抗阿拉伯
    touluoman: { generalId: 'touluoman', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 嚈哒征服印度
    moxianluojuluo: { generalId: 'moxianluojuluo', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 嚈哒帝国残暴统治北印度
    yile: { generalId: 'yile', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 花剌子模沙抗西辽
    muhanmodeguli: { generalId: 'muhanmodeguli', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 古尔征服北印度
    jianisejia: { generalId: 'jianisejia', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 贵霜帝国极盛
    baqiman: { generalId: 'baqiman', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 钦察游击抗蒙
    wugua: { generalId: 'wugua', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 大宛王抗汉
    qiujiuque: { generalId: 'qiujiuque', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 贵霜奠基统一五部
    alimukuli: { generalId: 'alimukuli', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 浩罕抗俄
    agubai: { generalId: 'agubai', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 哲德沙尔建国
    yinalechihei: { generalId: 'yinalechihei', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 讹答剌守城
    shijingtang: { generalId: 'shijingtang', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 石氏割让燕云
    mameng: { generalId: 'mameng', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_02' }, // 马蒙起兵夺哈里发
    shile: { generalId: 'shile', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 石勒奴隶到皇帝
    shaboluo: { generalId: 'shaboluo', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 十箭部落西突厥
    // ── 中国将·西域 2026-06-18 ──
    chentang: { generalId: 'chentang', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_01' }, // 建昭三年六校分道诛郅支于都赖水
    banchao: { generalId: 'banchao', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 不入虎穴焉得虎子
    gaoxianzhi: { generalId: 'gaoxianzhi', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 葱岭远征小勃律
    genggong: { generalId: 'genggong', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 疏勒孤军苦撑
    sudinfang: { generalId: 'sudinfang', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 灭西突厥擒沙钵罗
    peixingjian: { generalId: 'peixingjian', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_02' }, // 计擒都支兵不血刃
        yuezhongqi: { generalId: 'yuezhongqi', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 清代名将征青海
    dashibatuer: { generalId: 'dashibatuer', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 和硕特汗

// ── 青藏区 2026-06-18 ──
    songzanganbu: { generalId: 'songzanganbu', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 统一青藏
    houjunji: { generalId: 'houjunji', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_02' }, // 松州破吐蕃
    baduersaye: { generalId: 'baduersaye', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 廓尔喀侵藏
    gongbumangbuzhi: { generalId: 'gongbumangbuzhi', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 工布小王
    basiba: { generalId: 'basiba', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 萨迦帝师
    xiazhongawanglangjie: { generalId: 'xiazhongawanglangjie', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 不丹建国
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
    gusiluo: { generalId: 'gusiluo', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 青唐破西夏
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
      wufu: { generalId: 'wufu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 清溪关
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
    zhangzhensun: { generalId: 'zhangzhensun', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 韶关抗元·大庾岭殉国
    houandou: { generalId: 'houandou', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 陈朝开国元勋
    weichaoyuan: { generalId: 'weichaoyuan', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 布依起义
      wulin: { generalId: 'wulin', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 剑门关抗金
      liubei: { generalId: 'liubei', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 永安托孤
    wulin: { generalId: 'wulin', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 守蜀名将
    wangping: { generalId: 'wangping', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 兴势破曹爽
    yangyinglong: { generalId: 'yangyinglong', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 播州末代
    lite: { generalId: 'lite', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 成汉开国
    suonuomu: { generalId: 'suonuomu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 小金川土司
    wufu_zd: { generalId: 'wufu_zd', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 明代平南中
    wumian_dz: { generalId: 'wumian_dz', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 侗族起义
    azi_wm: { generalId: 'azi_wm', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 乌蒙土司
// ── 巴蜀区 2026-06-18 ──
    zhugeliang: { generalId: 'zhugeliang', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 以逸待劳北伐（未出子午谷）
    weiyan: { generalId: 'weiyan', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 略阳阳溪守汉中
    wujie: { generalId: 'wujie', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 和尚原仙人关守蜀口
    baochao: { generalId: 'baochao', tier: 'famous', tacticalSkillId: 'tac_08', strategicSkillId: 'str_04' }, // 霆军以寡击众
    yuezhongqi: { generalId: 'yuezhongqi', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 平罗卜藏丹津
    qinliangyu: { generalId: 'qinliangyu', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 白杆兵抗清
    guanyu: { generalId: 'guanyu', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_06' }, // 水淹七军
    lvwenhuan: { generalId: 'lvwenhuan', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 守襄阳六年抗元
    jixin: { generalId: 'jixin', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 荥阳诳楚
    lidingguo_dx: { generalId: 'lidingguo_dx', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 大西抗清
    changhong: { generalId: 'changhong', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 资中先贤
    luxun: { generalId: 'luxun', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_06' }, // 夷陵火攻
    xiangyan: { generalId: 'xiangyan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_03' }, // 楚将破李信
    zhongxiang: { generalId: 'zhongxiang', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 洞庭起义
    lite: { generalId: 'lite', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 流民起义
    wangjian_dy: { generalId: 'wangjian_dy', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 钓鱼城炮击蒙哥
    yangnandang: { generalId: 'yangnandang', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_05' }, // 仇池拓土
    shaluoben_x: { generalId: 'shaluoben_x', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 金川抗清
    yangyinglong: { generalId: 'yangyinglong', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 播州之役
    puhu: { generalId: 'puhu', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 宕渠賨人随张飞
    zhangfei: { generalId: 'zhangfei', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 巴西破张郃
    tanhou: { generalId: 'tanhou', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 土司起义
    xiangdakun: { generalId: 'xiangdakun', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 向王天子
    tanhou_td: { generalId: 'tanhou_td', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 慈利土司
    ranshouzhong: { generalId: 'ranshouzhong', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 酉阳土司
    shamoke: { generalId: 'shamoke', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 五溪蛮王
    kuaiyue: { generalId: 'kuaiyue', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 蒯氏谋士
    fanmu: { generalId: 'fanmu', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 板楯助汉
    shechongming: { generalId: 'shechongming', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 奢安之乱
    ada: { generalId: 'ada', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 僰人末代
    chendao: { generalId: 'chendao', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 白毦兵断后
    luoshao: { generalId: 'luoshao', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 乌蒙土官
    zhaoyun: { generalId: 'zhaoyun', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 长坂坡救主
    pengshichou: { generalId: 'pengshichou', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 溪州铜柱
    shiliudeng: { generalId: 'shiliudeng', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 苗民起义
      feilv: { generalId: 'feilv', tier: 'ordinary', tacticalSkillId: 'tac_10' },
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
    lubode: { generalId: 'lubode', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 筑居延塞
    juqumengxun: { generalId: 'juqumengxun', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 北凉灭西凉
    // ── 中原区 2026-06-18 ──
    liguang: { generalId: 'liguang', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 飞将军
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
    chensheng: { generalId: 'chensheng', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 大泽乡起义
    liuqi: { generalId: 'liuqi', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 顺昌破金
    caocao: { generalId: 'caocao', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_04' }, // 官渡之战
    weixiaokuan: { generalId: 'weixiaokuan', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 玉壁之战
    xusheng_wu: { generalId: 'xusheng_wu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 吴将疑城
    mizhu: { generalId: 'mizhu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 资助刘备
    guotai_bb: { generalId: 'guotai_bb', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 白波军
    geshuhan: { generalId: 'geshuhan', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 潼关守将
    zongze: { generalId: 'zongze', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 东京留守
    miyue: { generalId: 'miyue', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 宣太后
    limaozhen: { generalId: 'limaozhen', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 岐国军阀
    kouxun: { generalId: 'kouxun', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 云台河内
    mengzongzheng_jn: { generalId: 'mengzongzheng', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 三关之捷

    lvmeng: { generalId: 'lvmeng', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_06' }, // 白衣渡江
    zhoubo: { generalId: 'zhoubo', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 安刘氏
    liuyan_ly: { generalId: 'liuyan_ly', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 舂陵起兵
    jifa: { generalId: 'jifa', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 武王伐纣
    quanrongwang: { generalId: 'quanrongwang', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 犬戎弑幽王
    chairong: { generalId: 'chairong', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 高平之战·殿前诸班
    caishudu: { generalId: 'caishudu', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 蔡国始祖
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
    qihuangong: { generalId: 'qihuangong', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 杞桓公
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
    mafang: { generalId: 'mafang', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 马太师
    tuobagui: { generalId: 'tuobagui', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 参合陂
    liukun: { generalId: 'liukun', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 并州孤守
    zhangrou: { generalId: 'zhangrou', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 保定重建
    quyi: { generalId: 'quyi', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 界桥先登破白马
    gaochanggong: { generalId: 'gaochanggong', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 邙山五百骑
    yanzhenqing: { generalId: 'yanzhenqing', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 平原抗安史
    gongsunzan: { generalId: 'gongsunzan', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 白马义从
    wusangui: { generalId: 'wusangui', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_04' }, // 山海关
    liangshidu_ls: { generalId: 'liangshidu_ls', tier: 'ordinary', tacticalSkillId: 'tac_09' }, // 梁国割据
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
    zouyao: { generalId: 'zouyao', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 东瓯王
    doulian: { generalId: 'doulian', tier: 'ordinary', tacticalSkillId: 'tac_07' }, // 若敖夜袭
    chuzhuangwang: { generalId: 'chuzhuangwang', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 邲之战
    luxun_sunwu: { generalId: 'luxun_sunwu', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_06' }, // 夷陵火攻·江陵镇守
    goujian: { generalId: 'goujian', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 卧薪尝胆
    hetengjiao: { generalId: 'hetengjiao', tier: 'ordinary', tacticalSkillId: 'tac_06' }, // 衡州抗清
    zhaopusheng: { generalId: 'zhaopusheng', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 双刀赵
    yangzhong: { generalId: 'yangzhong', tier: 'ordinary', tacticalSkillId: 'tac_08' }, // 隋国公
    mayin: { generalId: 'mayin', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 马楚开国
    zhangshicheng: { generalId: 'zhangshicheng', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 大周盐丁
    liuyu: { generalId: 'liuyu', tier: 'famous', tacticalSkillId: 'tac_02', strategicSkillId: 'str_05' }, // 却月阵灭南燕
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
    wentianxiang: { generalId: 'wentianxiang', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 勤王抗元
    chunshenjun_h: { generalId: 'chunshenjun_h', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 黄国后裔
    yuyunwen: { generalId: 'yuyunwen', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_06' }, // 采石大捷
    wumingche: { generalId: 'wumingche', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 太建北伐
    xiexuan: { generalId: 'xiexuan', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_04' }, // 淝水之战
    yuanshu_zn: { generalId: 'yuanshu_zn', tier: 'ordinary', tacticalSkillId: 'tac_10' }, // 仲家皇帝
    suonuomu: { generalId: 'suonuomu', tier: 'famous', tacticalSkillId: 'tac_05', strategicSkillId: 'str_05' }, // 金川碉楼抗清
    zhangxianzhong: { generalId: 'zhangxianzhong', tier: 'famous', tacticalSkillId: 'tac_03', strategicSkillId: 'str_04' }, // 大西王
    sunquan: { generalId: 'sunquan', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_06' }, // 赤壁抗曹
    lianpo: { generalId: 'lianpo', tier: 'famous', tacticalSkillId: 'tac_01', strategicSkillId: 'str_05' }, // 长平据守
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
