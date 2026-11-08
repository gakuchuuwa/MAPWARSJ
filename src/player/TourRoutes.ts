/**
 * 玩家「环球 / 航行」模式的知名商路链（2026-11-08 升级为「逐据点一跳直连 + 多绕行广覆盖 + 零回头路」环线）。
 *
 *  · 环球（globe）：绝对优先陆路，相邻两站 100% 为路网直连据点，蜿蜒走遍朝鲜、东北、华北、山东、江淮、江南、
 *    浙闽、湖广、巴蜀、荆襄、关中、河套、河西走廊、西域南北道、河中、呼罗珊、波斯、巴格达、帕尔米拉、阿勒颇、
 *    大马士革、黎凡特海岸、安纳托利亚、巴尔干、希腊、多瑙河、意大利、法兰西、伊比利亚、墨西哥，共 452 座不重复据点，零回头路；
 *  · 航行（sail）：纯海路逐港一跳直连，走遍东海、南海、香料群岛、孟加拉湾、印度东西岸、波斯湾、红海口、东非海岸、
 *    好望角、西非、巴西、麦哲伦海峡、南美西岸、太平洋岛链、菲律宾、台湾、琉球、九州，共 96 座不重复港口，零跨站折返。
 */
export interface TourStop {
    id: string;
    by: 'land' | 'sea';
}

const L = (id: string): TourStop => ({ id, by: 'land' });
const S = (id: string): TourStop => ({ id, by: 'sea' });

/** 大帆船航线（1565 起）：阿卡普尔科 → 关岛 → 萨马岛帕拉帕格 → 马尼拉 → 台湾大员（链尾接链头长崎成环） */
const GALLEON_SEA_TAIL: TourStop[] = [
    S('city_hagatna'),
    S('city_palapag'),
    S('city_manila'),
    S('city_tainan'),
];

/** 环球：逐据点一跳直连、多绕行广覆盖、零回头路的环球商路（452 站全唯一） */
export const GLOBE_CHAIN: TourStop[] = [
    // 日本与对马海峡（长崎 → 原之辻 → 对马 → 金海）
    S('city_nagasaki'), S('city_yuanzhishi'), S('city_tsushima'), S('city_gimhae'),
    // 朝鲜半岛与东北（金海 → 汉城 → 平壤 → 东北腹地 → 辽东 → 辽西 → 山海关）
    L('city_jinju'), L('city_suncheon_k'), L('city_jeonju'), L('city_sabi'), L('city_yuezhi'),
    L('city_shangzhou'), L('city_jincheng_silla'), L('city_heseluo'), L('city_hanseong'), L('city_kaesong'),
    L('city_haeju'), L('city_pyongyang'), L('city_deokwon'), L('city_hamhung'), L('city_longer'),
    L('city_xupin'), L('city_yalu'), L('city_huifa'), L('city_longtanshancheng'), L('city_kuanchengzi'),
    L('city_bamiancheng'), L('city_daerhan'), L('city_chifeng'), L('city_jilishan'), L('city_jicheng'),
    L('city_guangning'), L('city_shenyang'), L('city_salhu'), L('city_hetuala'), L('city_tongjiajiang'),
    L('city_guoneicheng'), L('city_xicheng'), L('city_longwan'), L('city_wugucheng'), L('city_liaoyang'),
    L('city_anshicheng'), L('city_tuhe'), L('city_ningyuan'), L('city_shanhaiguan'),
    // 华北、山东、淮北、河北、塞北与山西（山海关 → 齐鲁 → 梁宋 → 幽燕 → 雁北 → 三晋 → 河内 → 洛阳）
    L('city_feiru'), L('city_wuzhong'), L('city_piaoyujin'), L('city_wenan'), L('city_hejian'),
    L('city_qingchi'), L('city_wudingzhou'), L('city_linzi'), L('city_dengzhou'), L('city_wendeng'),
    L('city_jimo'), L('city_jiaoxi'), L('city_mulingguan'), L('city_ju'), L('city_langya'),
    L('city_tancheng'), L('city_lanling'), L('city_pengcheng'), L('city_yucheng'), L('city_shangqiu'),
    L('city_yongqiu'), L('city_bianliang'), L('city_dingtao'), L('city_qufu'), L('city_boyang'),
    L('city_licheng'), L('city_pingyuan'), L('city_jingzhou2'), L('city_xindu'), L('city_liyang'),
    L('city_xingtai'), L('city_zhending'), L('city_zhongshan'), L('city_baoding'), L('city_fanyang'),
    L('city_beijing'), L('city_juyongguan'), L('city_xuanhua'), L('city_daixian'), L('city_feihu'),
    L('city_pingxingguan'), L('city_yanmenguan'), L('city_zhangguojuncheng'), L('city_datong'), L('city_wuzhousai'),
    L('city_shengle'), L('city_eyangling'), L('city_piantouguan'), L('city_ningwuguan'), L('city_taiyuan'),
    L('city_lishi'), L('city_lingshiguan'), L('city_linfen'), L('city_baibogu'), L('city_shangdang'),
    L('city_eyu'), L('city_handan'), L('city_anyang'), L('city_daming'), L('city_liaocheng'),
    L('city_puyang'), L('city_zhaoge'), L('city_huojia'), L('city_hulaoguan'), L('city_xinzheng'),
    L('city_xuchang'), L('city_luoyang'),
    // 江淮、江南、浙闽、湖广、黔中、巴蜀、荆襄、汉中与陇右（洛阳 → 江南 → 湖广 → 巴蜀 → 关中长安）
    L('city_guangchengguan'), L('city_yancheng2'), L('city_huaiyang'), L('city_shunchang'), L('city_shouxian'),
    L('city_hefei'), L('city_jingkou'), L('city_jiuzi'), L('city_wanling'), L('city_dusong'),
    L('city_hangzhou'), L('city_kuaiji'), L('city_qingyuan_zj'), L('city_ninghai'), L('city_taizhou_zj'),
    L('city_wenzhou'), L('city_chuzhou_zj'), L('city_chimushan'), L('city_zhenghe'), L('city_jianning'),
    L('city_chongan'), L('city_yiyang'), L('city_xianxia'), L('city_quzhou'), L('city_qingxi'),
    L('city_yixian'), L('city_datong2'), L('city_wancheng'), L('city_chaisang'), L('city_qichun'),
    L('city_wuchang'), L('city_baling'), L('city_changsha'), L('city_wuling'), L('city_chenzhou2'),
    L('city_yuanzhou'), L('city_zhenyuan'), L('city_qielancheng'), L('city_hailongtun'), L('city_piandaoshui'),
    L('city_xiushan'), L('city_bamian'), L('city_laifeng'), L('city_fuling'), L('city_shizhu'),
    L('city_nanpu'), L('city_baidicheng2'), L('city_yiling'), L('city_ying'), L('city_dangyang'),
    L('city_shicheng'), L('city_xiangyang'), L('city_junzhou'), L('city_yunyang'), L('city_jinzhou_shanxi'),
    L('city_ziwu'), L('city_yangxian'), L('city_hanzhong'), L('city_jianmenguan'), L('city_baishuiguan'),
    L('city_mianyang'), L('city_zizhou_d'), L('city_diaoyucheng'), L('city_chongqing'), L('city_jiangyang'),
    L('city_bodao'), L('city_leshan'), L('city_chengdu'), L('city_maozhou'), L('city_songzhou'),
    L('city_panzhou'), L('city_diezhou'), L('city_dangchang'), L('city_longxi'), L('city_tianshui'),
    L('city_qiuchi'), L('city_ganquanyi'), L('city_lueyang'), L('city_huixian'), L('city_dasanguan'),
    L('city_qishan'), L('city_changan'),
    // 陕北、河套、西夏、河湟、河西走廊与西域南北两道（长安 → 朔方 → 河西 → 天山 → 塔里木 → 疏勒）
    L('city_jinsuoguan'), L('city_fushi'), L('city_jingbianbao'), L('city_tongwancheng'), L('city_yulin'),
    L('city_dongshengzhou'), L('city_ordos'), L('city_hetao'), L('city_linrong'), L('city_keyimen'),
    L('city_xingqingfu2'), L('city_lingzhou'), L('city_quyancheng'), L('city_jingsai'), L('city_fangqu'),
    L('city_xingqing'), L('city_zhedi'), L('city_binzhou2'), L('city_anding'), L('city_xiaoguan'),
    L('city_weirong'), L('city_zuli'), L('city_mingsha'), L('city_aowei'), L('city_chiwubao'),
    L('city_lingju'), L('city_lanzhou'), L('city_yunwu'), L('city_ledou'), L('city_qingtang'),
    L('city_haomen'), L('city_wuwei'), L('city_shandan'), L('city_zhangye'), L('city_biaoshi'),
    L('city_jianshuijinguan'), L('city_jiuquan'), L('city_chijin'), L('city_jinchangcheng'), L('city_xingxingxia'),
    L('city_hamiwei'), L('city_bieshibali'), L('city_wutucheng'), L('city_dabancheng'), L('city_tuokexun'),
    L('city_yanqi'), L('city_weili'), L('city_loulan'), L('city_sanlongsha'), L('city_yumenguan'),
    L('city_dunhuang'), L('city_yangguan'), L('city_ruoqiang'), L('city_gasinaoer'), L('city_niubiziliang'),
    L('city_sapi'), L('city_gasikou'), L('city_jingjue'), L('city_yumi'), L('city_yutian2'),
    L('city_mazhatage'), L('city_kungang'), L('city_dawushenkate'), L('city_yiluolucheng'), L('city_yuergun'),
    L('city_bohuancheng'), L('city_weitoucheng'), L('city_wosedecheng'), L('city_paixiucheng'), L('city_shule'),
    // 帕米尔、费尔干纳、河中、吐火罗、犍陀罗与呼罗珊（疏勒 → 撒马尔罕 → 布哈拉 → 白沙瓦 → 喀布尔 → 赫拉特 → 尼沙布尔）
    L('city_yierkeshentan'), L('city_xiuxun'), L('city_aoshen'), L('city_guishancheng'), L('city_ahexikesi'),
    L('city_kokand'), L('city_huzhan'), L('city_julushicheng'), L('city_jizhake'), L('city_samaerhan'),
    L('city_jieshuangna'), L('city_bukhara'), L('city_varaksha'), L('city_dargan'), L('city_amucheng'),
    L('city_merv'), L('city_pengdi'), L('city_malulude'), L('city_fariyab'), L('city_xiwanjin'),
    L('city_lanshi'), L('city_huoguocheng'), L('city_fayzabad'), L('city_huoluoge'), L('city_humicheng'),
    L('city_hunduduo'), L('city_gongzhubao'), L('city_nieduo'), L('city_aonuosiyan'), L('city_masaga'),
    L('city_baishawa'), L('city_dinggucheng'), L('city_gaofu'), L('city_fanyanna'), L('city_helate'),
    L('city_helate_city'), L('city_taibade'), L('city_salahesi'), L('city_nisa'), L('city_tusi'),
    L('city_nishabuer'),
    // 波斯高原与两河流域（尼沙布尔 → 雷伊 → 大不里士 → 哈马丹 → 伊斯法罕 → 波斯波利斯 → 巴士拉 → 巴比伦 → 巴格达）
    L('city_baihage'), L('city_bistam'), L('city_zilakata'), L('city_damugan'), L('city_lihaimen'),
    L('city_leiyi'), L('city_jiaziwen'), L('city_zanzhan'), L('city_dabulishi'), L('city_malagai'),
    L('city_aerbeila'), L('city_hamadan'), L('city_guerpayegan'), L('city_yisifahan'), L('city_yazide'),
    L('city_bam_citadel'), L('city_kamanniya'), L('city_xierzhan'), L('city_bosibolisi'), L('city_feiluzhabade'),
    L('city_bashila'), L('city_wuer'), L('city_wuluke'), L('city_babilun'), L('city_susa'),
    L('city_bageda'),
    // 上美索不达米亚与叙利亚沙漠（巴格达 → 萨迈拉 → 尼尼微 → 埃德萨 → 帕尔米拉/塔德莫尔）
    L('city_samaila'), L('city_yashucheng'), L('city_niniwei'), L('city_nixibisi'), L('city_aidesa'),
    L('city_tapusakusi'), L('city_tademoer'),
    // 黎凡特与大马士革商路（塔德莫尔 → 阿勒颇 → 埃梅萨 → 大马士革 → 阿卡 → 推罗 → 贝鲁特 → 拉塔基亚 → 安提俄基亚 → 阿达纳）
    L('city_alepo'),
    L('city_emesa'),
    L('city_damasikusi'),
    L('city_ake'),
    L('city_tuile'),
    L('city_beirut'),
    L('city_latajiya'),
    L('city_antiejiya'),
    L('city_adana'),
    // 安纳托利亚全境环线（阿达纳 → 特拉布宗 → 锡瓦斯 → 安卡拉 → 伊科尼乌姆 → 爱琴海沿岸 → 特洛伊 → 布尔萨 → 尼凯亚 → 君士坦丁堡）
    L('city_waka'), L('city_erzincan'), L('city_telabuzong'), L('city_themiskyra'), L('city_amaxiya'),
    L('city_sivas'), L('city_hatusha'), L('city_ankala'), L('city_tiyana'), L('city_yikeniwumu'),
    L('city_geerdiweng'), L('city_kailaina'), L('city_peierge'), L('city_halikanasu'), L('city_miletus'),
    L('city_yifusuo'), L('city_kelazuomeinai'), L('city_peierjiameng'), L('city_teluoyi'), L('city_gelanikusi'),
    L('city_dasijiliweng'), L('city_buersa'), L('city_seyute'), L('city_nixiya'), L('city_junshitandingbao'),
    // 巴尔干、希腊、多瑙河与中欧（君士坦丁堡 → 保加利亚 → 希腊全境 → 塞尔维亚 → 瓦拉几亚 → 贝尔格莱德 → 布达佩斯 → 维也纳 → 威尼斯）
    L('city_luxiweng'), L('city_aidiernei'), L('city_puleisilafu'), L('city_teernuowo'), L('city_seuthopolis'),
    L('city_plovdiv'), L('city_anfeibolisi'), L('city_salonica'), L('city_pelina'), L('city_deerfei'),
    L('city_thebes'), L('city_kalisituosi'), L('city_yadian'), L('city_sparta'), L('city_aolinpiya'),
    L('city_anbulajiya'), L('city_peiliang'), L('city_prilep'), L('city_skopje'), L('city_sofia'),
    L('city_nis'), L('city_baba_vida'), L('city_bucharest'), L('city_teergewishite'), L('city_agesi'),
    L('city_huneiduolala'), L('city_saigede'), L('city_belgrade'), L('city_budapeisi'), L('city_weiyeena'),
    L('city_gradeci'), L('city_venice'),
    // 意大利、瑞士与法兰西（威尼斯 → 佛罗伦萨 → 罗马 → 热那亚 → 米兰 → 都灵 → 日内瓦 → 巴塞尔 → 斯特拉斯堡 → 第戎 → 里昂）
    L('city_verona'), L('city_florence'), L('city_luoma'), L('city_pisa'), L('city_genoa'),
    L('city_milan'), L('city_turin'), L('city_shangbeili'), L('city_geneva'), L('city_basaier'),
    L('city_sitelasibao'), L('city_dijon'), L('city_lyon'),
    // 法兰西南境与伊比利亚全境（里昂 → 波尔多 → 图卢兹 → 巴塞罗那 → 布尔戈斯 → 波尔图 → 里斯本 → 科尔多瓦 → 马德里 → 格拉纳达 → 塞维利亚 → 加的斯）
    L('city_avignon'), L('city_nabone'), L('city_toulouse'), L('city_oushi'), L('city_bayonne'),
    L('city_pamplona'), L('city_burgos'), L('city_numantia'), L('city_zaragoza'), L('city_barcelona'),
    L('city_valencia'), L('city_madeli'), L('city_salamanca'), L('city_la_mota'), L('city_braganca'),
    L('city_boertu'), L('city_coimbra'), L('city_lisiben'), L('city_evora'), L('city_badajoz'),
    L('city_merida'), L('city_toledo'), L('city_cordoba'), L('city_seville'), L('city_granada'),
    L('city_jiadisi'),
    // 大西洋宝船航线（加的斯 → 特尔德 → 百慕大 → 哈瓦那 → 韦拉克鲁斯）
    S('city_telde'), S('city_bermuda'), S('city_havana'), S('city_veracruz'),
    // 墨西哥陆路（韦拉克鲁斯 → 特诺奇提特兰 → 钦聪灿 → 阿卡普尔科）
    L('city_tenochtitlan'), L('city_tzintzuntzan'), L('city_acapulco'),
    // 太平洋大帆船航线（阿卡普尔科 → 关岛 → 帕拉帕格 → 马尼拉 → 台湾大员 → 回长崎成环）
    ...GALLEON_SEA_TAIL,
];

/** 航行：逐港一跳直连、零回头路的纯海路大航海环线（96 港全唯一） */
export const SAIL_CHAIN: TourStop[] = [
    // 日本九州 → 东海 → 浙闽粤沿海与海南交趾（逐港一跳直连）
    S('city_nagasaki'), S('city_qingyuan_zj'), S('city_taizhou_zj'), S('city_fuzhou'), S('city_zhangzhou'),
    S('city_penghu'), S('city_qingjingsi'), S('city_panyu'), S('city_haikang'), S('city_yazhou'),
    S('city_yian'), S('city_yuntun'), S('city_donghai'), S('city_kunlundao'),
    // 南海 → 暹罗湾 → 马来半岛 → 爪哇与香料群岛 → 马六甲
    S('city_dupan'), S('city_tunwuli'), S('city_danmaxi'), S('city_pattani'), S('city_sanfoqi'),
    S('city_batavia'), S('city_deernate'), S('city_ambon'), S('city_banda'), S('city_wandan'),
    S('city_yaqi'), S('city_malacca'),
    // 孟加拉湾 → 印度东岸 → 锡兰 → 印度西岸 → 波斯湾 → 阿拉伯海 → 亚丁
    S('city_nikoba'), S('city_kelunpo'), S('city_danta'), S('city_danmoledi'), S('city_jidagang'),
    S('city_thaton'), S('city_puli'), S('city_madras'), S('city_jiale'), S('city_quilon'),
    S('city_guli'), S('city_mumbai'), S('city_kalaqi'), S('city_aola'), S('city_bashila'),
    S('city_hormuz'), S('city_surat'), S('city_suomunate'), S('city_guoa'), S('city_aden'),
    // 东非斯瓦希里海岸 → 好望角
    S('city_zeila'), S('city_mogadishu'), S('city_mombasa'), S('city_barawa'), S('city_kilwa'),
    S('city_malindi'), S('city_mozambique'), S('city_sofala'), S('city_cape_town'),
    // 南大西洋 → 西非几内亚湾 → 佛得角 → 圣赫勒拿 → 巴西沿岸 → 麦哲伦海峡
    S('city_sainthelena'), S('city_luanda'), S('city_elmina'), S('city_ribeira'), S('city_olinda'),
    S('city_guanabara'), S('city_salvador'), S('city_kabufoliwu'), S('city_saovicente'), S('city_buenosaires'),
    S('city_sanjulian'), S('city_felipe'),
    // 南美西岸 → 中美太平洋岸 → 阿卡普尔科
    S('city_valdivia'), S('city_concepcion'), S('city_valparaiso'), S('city_arica'), S('city_lima'),
    S('city_guayaquil'), S('city_banama'), S('city_realejo'), S('city_acapulco'),
    // 太平洋岛链 → 关岛 → 菲律宾 → 台湾 → 琉球 → 九州 → 回长崎成环
    S('city_honolulu'), S('city_mua'), S('city_nanmadol'), S('city_hagatna'), S('city_palapag'),
    S('city_manila'), S('city_tainan'), S('city_mengjia'), S('city_diaoyudao'), S('city_gugudao'),
    S('city_shuri'), S('city_akakinagusuku'), S('city_akaogicheng'), S('city_satsuma'), S('city_funei'),
    S('city_songshan'), S('city_chijianguan'), S('city_yuanzhishi'), S('city_taizaifu'), S('city_goto'),
];

export function getTourChain(mode: 'globe' | 'sail'): readonly TourStop[] {
    return mode === 'globe' ? GLOBE_CHAIN : SAIL_CHAIN;
}
