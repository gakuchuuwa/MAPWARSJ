/**
 * GeneralFirstExpeditionTargets.ts — 名将「历史首征目标」（generalId → 目标 cityId）
 *
 * 设计（2026-07；GAME_DIRECTION 远征细则扩充）：
 *   为增强慢直播叙事，给史料铁案的名将设一个「历史宿命」首征目标——
 *   要么是青史封禅/成名之战（封狼居胥/直捣黄龙/虎牢擒两王），要么是反攻宿敌老巢
 *   （李舜臣→秀吉姬路、吴起→秦锐士天水、陈国峻→忽必烈上都、耶律大石→桑贾尔木鹿）。
 *
 * 运行时规则（见 ExpeditionUI，2026-07-06 起「达标即自动远征」）：
 *   跟拍名将军团兵力够 UNLOCK_TROOPS（4万）即自动远征，先看其历史目标 H：
 *     · H 不在己方手里（没打下 / 打下后又被夺回）→ 自动锁定 H，断粮出征（无按钮、无选择面板）
 *     · H 已在己方手里（攥稳了）              → 自动选最近异文化中心（现有逻辑）
 *     · 该名将没配历史目标 / 军团无主将         → 自动选最近异文化中心
 *   即历史目标 = 该名将的执念，反复拉锯直至稳定占领。
 *
 * 锚定：绑 generalId（执念跟名将本人走，不随占城易主）。军团 Army.generalId 命中本表 → 触发。
 *   仅跟拍军团会远征（镜头=玩家唯一干预通道；AI 军团永不远征）。目标据点须 cities_v2 已存在。
 *
 * 收录：14 个 T0（传奇）+ 63 个 T1（功勋）= 77。
 *   未收录的 T1（18）为防御型（王坚/曲端）、败者（摩诃末/桑贾尔）、
 *   或标志战场在地图无据点（帖木儿/艾哈迈德等印度-波斯-占婆方向）——一律走文化中心，宁缺毋滥。
 */

export interface GeneralFirstTarget {
    /** 历史首征目标据点（cities_v2 的 cityId） */
    cityId: string;
    /** 直播看点 / 史料一句话（面板与横幅展示用） */
    label: string;
}

/** generalId → 历史首征目标。仅收史料铁案；找不到合格目标的名将不入表（走文化中心）。 */
export const GENERAL_FIRST_EXPEDITION_TARGETS: Readonly<Record<string, GeneralFirstTarget>> = {
    // ── T0 传奇名将（14）──────────────────────────────
    suzhou_huoqubing:            { cityId: 'city_langjuxu', label: '封狼居胥' },  // 霍去病·suzhou
    yue_d_yuefei:                { cityId: 'city_fuyu', label: '直捣黄龙' },  // 岳飞·yue_d
    xichu_xiangyu:               { cityId: 'city_changan', label: '入关灭秦' },  // 项羽·xichu
    tang_lishimin:               { cityId: 'city_hulaoguan', label: '虎牢擒两王' },  // 李世民·tang
    sambyeol_lishunchen:         { cityId: 'city_himeji', label: '跨海讨秀吉' },  // 李舜臣·sambyeol
    yuwen_yuwentai:              { cityId: 'city_changan', label: '入主关中' },  // 宇文泰·yuwen
    dingxiang_d_lijing:          { cityId: 'city_shengle', label: '夜袭定襄' },  // 李靖·dingxiang_d
    dajin_wanyanaguda:           { cityId: 'city_linhuang', label: '灭辽取都' },  // 完颜阿骨打·dajin
    manzhou_d_duoergun:          { cityId: 'city_beijing', label: '入关定鼎' },  // 多尔衮·manzhou_d
    menggu_d_chengjisihan:       { cityId: 'city_samaerhan', label: '西征花剌子模' },  // 成吉思汗·menggu_d
    lulin_liuxiu:                { cityId: 'city_luoyang', label: '光武中兴' },  // 刘秀·lulin
    zhong_xiexuan:               { cityId: 'city_luoyang', label: '北府北伐' },  // 谢玄·zhong
    wei_wuqi:                    { cityId: 'city_tianshui', label: '魏武卒破秦' },  // 吴起·wei
    dayue_chenguojun:            { cityId: 'city_shangdu', label: '反攻忽必烈' },  // 陈国峻·dayue

    // ── T1 功勋名将（60；防御型/败者/地图无据点者不入表，走文化中心）──────
    daxi_ming_zhangxianzhong:    { cityId: 'city_chengdu', label: '破成都建大西' },  // 张献忠·daxi_ming
    weizhou_weigao:              { cityId: 'city_luoxie', label: '镇蜀破吐蕃' },  // 韦皋·weizhou
    qin_simacuo:                 { cityId: 'city_chengdu', label: '伐灭古蜀' },  // 司马错·qin
    cao_d_caocao:                { cityId: 'city_bailangshan', label: '白狼山斩蹋顿' },  // 曹操·cao_d
    zhou_jifa:                   { cityId: 'city_anyang', label: '牧野克商' },  // 姬发·zhou
    chanzhou_chairong:           { cityId: 'city_fanyang', label: '北伐燕云' },  // 柴荣·chanzhou
    jin_xianzhen:                { cityId: 'city_shicheng', label: '城濮破楚入郢' },  // 先轸·jin
    dashun_lizicheng:            { cityId: 'city_beijing', label: '进京灭明' },  // 李自成·dashun
    ruo_wangjian:                { cityId: 'city_handan', label: '破邯郸灭赵' },  // 王翦·ruo
    qianzhou_lisheng:            { cityId: 'city_changan', label: '收复长安' },  // 李晟·qianzhou
    song_zhaokuangyin:           { cityId: 'city_taiyuan', label: '亲征北汉' },  // 赵匡胤·song
    xiliao_yelvdashi:            { cityId: 'city_merv', label: '卡特万破塞尔柱' },  // 耶律大石·xiliao
    hantawadi_mangyinglong:      { cityId: 'city_ayutthaya', label: '攻陷暹罗' },  // 莽应龙·hantawadi
    konbaung_yongjiya:           { cityId: 'city_ayutthaya', label: '灭阿瑜陀耶' },  // 雍笈牙·konbaung
    siam_nalixuan:               { cityId: 'city_bago', label: '反攻缅甸勃固' },  // 纳黎萱·siam
    zhai_han_diqing:             { cityId: 'city_yongzhou', label: '昆仑关破侬智高' },  // 狄青·zhai_han
    didao_wangshao:              { cityId: 'city_qingtang', label: '熙河开边逼青唐' },  // 王韶·didao
    shazhou_zhangyichao:         { cityId: 'city_wuwei', label: '收复河西凉州' },  // 张议潮·shazhou
    shanzhou_wangzhongsi:        { cityId: 'city_luoxie', label: '破吐蕃' },  // 王忠嗣·shanzhou
    edo_dechuanjiakang:          { cityId: 'city_himeji', label: '大坂之阵灭丰臣' },  // 德川家康·edo
    owari_zhitianxinchang:       { cityId: 'city_kyoto', label: '上洛天下布武' },  // 织田信长·owari
    aki_maoliyuanjiu:            { cityId: 'city_izumo', label: '灭尼子月山富田' },  // 毛利元就·aki
    zaoyang_d_menggong:          { cityId: 'city_xuanhu', label: '蔡州灭金' },  // 孟珙·zaoyang_d
    wu_sunwu:                    { cityId: 'city_shicheng', label: '柏举破楚入郢' },  // 孙武·wu
    joseon_lichenggui:           { cityId: 'city_shenyang', label: '威化岛图辽东' },  // 李成桂·joseon
    leloi:                       { cityId: 'city_shenglong', label: '逐明复国' },  // 黎利·leloi
    taiping_shidakai:            { cityId: 'city_nanjing', label: '定都天京' },  // 石达开·taiping
    heng1_yangye:                { cityId: 'city_datong', label: '北伐云州' },  // 杨业·heng1
    yan_leyi:                    { cityId: 'city_linzi', label: '伐齐入临淄' },  // 乐毅·yan
    erzhu_erzhurong:             { cityId: 'city_luoyang', label: '河阴之变入洛' },  // 尔朱荣·erzhu
    yingzhou_ying_d_muronghuang: { cityId: 'city_guoneicheng', label: '破高句丽陷丸都' },  // 慕容皝·yingzhou_ying_d
    ming_d_zhudi:                { cityId: 'city_nanjing', label: '靖难入京' },  // 朱棣·ming_d
    shatuo_likeyong:             { cityId: 'city_bianliang', label: '争霸破朱温' },  // 李克用·shatuo
    pugu_puguhuaien:             { cityId: 'city_fanyang', label: '平安史追范阳' },  // 仆固怀恩·lingzhou
    you_gengyan:                 { cityId: 'city_linzi', label: '平齐张步' },  // 耿弇·you
    lingqiu_zhaowuling:          { cityId: 'city_zhongshan', label: '灭中山' },  // 赵武灵王·lingqiu
    xuan_xuda:                   { cityId: 'city_beijing', label: '克大都灭元' },  // 徐达·xuan
    jinzhou_lichengliang:        { cityId: 'city_hetuala', label: '捣建州' },  // 李成梁·jinzhou
    zu_d_yuanchonghuan:          { cityId: 'city_shenyang', label: '复辽取沈阳' },  // 袁崇焕·zu_d
    weihaiwei_sudingfang:        { cityId: 'city_sabi', label: '渡海灭百济' },  // 苏定方·weihaiwei
    yizhou_wanyanloushi:         { cityId: 'city_taiyuan', label: '破太原' },  // 完颜娄室·yizhou
    manzhou_nuerhachi:           { cityId: 'city_shenyang', label: '萨尔浒取沈阳' },  // 努尔哈赤·manzhou
    jurchen_wanyanzongbi:        { cityId: 'city_hangzhou', label: '搜山检海追高宗' },  // 完颜宗弼·jurchen
    aisin_d_huangtaiji:          { cityId: 'city_hanseong', label: '丙子征朝鲜' },  // 皇太极·aisin_d
    wuliangha_subutai:           { cityId: 'city_bianliang', label: '围汴灭金' },  // 速不台·wuliangha
    liao_d_yelvabaoji:           { cityId: 'city_ningan', label: '灭渤海' },  // 耶律阿保机·liao_d
    yel_yelvxiuge:               { cityId: 'city_bianliang', label: '高粱河破宋南侵' },  // 耶律休哥·yel
    borjigin_tuolei:             { cityId: 'city_bianliang', label: '三峰山灭金' },  // 拖雷·borjigin
    xiongnu_maodun:              { cityId: 'city_datong', label: '白登围汉高祖' },  // 冒顿·xiongnu
    tujue_ashinatumen:           { cityId: 'city_saierwusu', label: '破柔然建突厥' },  // 阿史那土门·tujue
    huige_gulipeiluo:            { cityId: 'city_otuken', label: '灭后突厥' },  // 骨力裴罗·huige
    wala_yexian:                 { cityId: 'city_beijing', label: '土木堡围京' },  // 也先·wala
    xiajiasi_are:                { cityId: 'city_woluduobali', label: '破回鹘牙帐' },  // 阿热·xiajiasi
    tumed_andahan:               { cityId: 'city_beijing', label: '庚戌之变围京' },  // 俺答汗·tumed
    jiluo_d_douxian:             { cityId: 'city_yanran', label: '燕然勒石破北匈奴' },  // 窦宪·jiluo_d
    tubo_songzanganbu:           { cityId: 'city_fusicheng', label: '破吐谷浑' },  // 松赞干布·tubo
    gar_lunqinling:              { cityId: 'city_dafeichuan', label: '大非川破唐' },  // 论钦陵·gar
    khoshut_gushihan:            { cityId: 'city_luoxie', label: '入藏灭藏巴汗' },  // 固始汗·khoshut
    dzungar_galedanceling:       { cityId: 'city_turkestan', label: '征哈萨克' },  // 噶勒丹策凌·dzungar
    xiyuduhu_banchao:            { cityId: 'city_yutian2', label: '定西域' },  // 班超·xiyuduhu
    // ── T1 补充（主人特批：地图确有可考宿敌/战场据点）──────
    qi_d_qijiguang:            { cityId: 'city_xiongben', label: '跨海讨倭' },  // 戚继光·qi_d（九州熊本，倭寇老巢）
    wuwu_d_lvmeng:             { cityId: 'city_ying', label: '白衣渡江擒关羽' },  // 吕蒙·wuwu_d（关羽荆州@金鳞）
    guizhou_lidingguo:         { cityId: 'city_shenyang', label: '北伐直捣清廷' },  // 李定国·guizhou（南明北伐清朝发祥地）
};

/** 查名将的历史首征目标；无则返回 null。 */
export function getGeneralFirstTarget(generalId?: string | null): GeneralFirstTarget | null {
    if (!generalId) return null;
    return GENERAL_FIRST_EXPEDITION_TARGETS[generalId] ?? null;
}
