/**
 * 玩家「环球 / 航行」模式的知名历史商路链（由东向西单向推进、逐据点一跳直连、零回头路）。
 *
 *  · 环球（globe）：严格由东向西沿历史著名商路推进（共 133 座不重复据点，相邻两站 100% 为路网一跳直连）：
 *      日本九州 → 对马海峡 → 朝鲜半岛南北大道 → 辽西走廊 → 燕赵太行东麓官道 → 洛阳 → 崤函古道 → 长安 →
 *      丝绸之路陇右段 → 河西走廊 → 西域北道（楼兰、焉耆、龟兹、拨换城、疏勒）→ 葱岭 → 费尔干纳 →
 *      河中粟特大道（撒马尔罕、布哈拉）→ 呼罗珊大道（木鹿、图斯、尼沙布尔、达姆甘、里海门、雷伊、哈马丹）→
 *      🔴 [2026-11-10 主人令「我要的一条历史上最知名的商路」] 巴格达→君堡改走史上最知名的一条主干（唯一商线，不再串南支）：
 *      两河与幼发拉底商线（巴格达、巴比伦、阿纳特、塔普萨库斯渡口、阿勒颇）→ 安提俄基亚与贝伦—伊苏斯—奇里乞亚道（途经伊苏斯再到阿达纳）→
 *      安纳托利亚大道（科尼亚、戈尔迪乌姆、瑟于特、尼凯亚、君士坦丁堡）→ 巴尔干与多瑙河走廊（埃迪尔内、索非亚、贝尔格莱德、布达佩斯、维也纳）→
 *      北意大利与南法走廊（威尼斯、维罗纳、米兰、热那亚、阿维尼翁、纳博讷）→ 伊比利亚大道（巴塞罗那、巴伦西亚、马德里、托莱多、科尔多瓦、塞维利亚、加的斯）→
 *      西属印度宝船西行信风航线（加那利特尔德、佛得角里贝拉、小安的列斯马提尼克、圣多明各、皇家港、哈瓦那、韦拉克鲁斯）→
 *      墨西哥亚洲皇家陆道（韦拉克鲁斯、特诺奇提特兰/墨西哥城、阿卡普尔科）→
 *      马尼拉大帆船太平洋航线（关岛、帕拉帕格、马尼拉、台湾大员 → 回长崎成环）。
 *
 *  · 航行（sail）：严格由东向西沿海上丝绸之路与大航海时代航线推进（共 64 座不重复港口，全部为海路一跳直连）：
 *      长崎 → 浙闽粤沿海（宁波、台州、福州、漳州、澎湖、泉州、广州、雷州、崖州）→ 交趾占城 → 昆仑岛 → 淡马锡 →
 *      马六甲海峡 → 尼科巴 → 锡兰加勒 → 印度西岸（小葛兰、古里、孟买、卡拉奇）→ 霍尔木兹 → 亚丁 →
 *      东非斯瓦希里海岸（泽拉、摩加迪沙、蒙巴萨、莫桑比克、索法拉）→ 好望角 → 圣赫勒拿 →
 *      巴西沿岸（萨尔瓦多、卡布弗里乌、圣维森特）→ 布宜诺斯艾利斯 → 圣胡利安 → 麦哲伦海峡 →
 *      南美与中美西岸（瓦尔迪维亚、康塞普西翁、瓦尔帕莱索、阿里卡、利马、瓜亚基尔、巴拿马、雷亚莱霍、阿卡普尔科）→
 *      马尼拉大帆船航线横渡太平洋（阿卡普尔科直航关岛、菲律宾、台湾、琉球、九州 → 回长崎成环）。
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

/** 环球：严格由东向西的历史著名陆上丝绸之路与环球商路（133 站全唯一，逐站一跳直连） */
export const GLOBE_CHAIN: TourStop[] = [
    // 日本与对马海峡（长崎 → 原之辻 → 对马 → 金海）
    S('city_nagasaki'), S('city_yuanzhishi'), S('city_tsushima'), S('city_gimhae'),
    // 朝鲜半岛官道与辽东辽西走廊（金海 → 晋州 → 全州 → 汉城 → 开城 → 平壤 → 辽阳 → 宁远 → 山海关）
    L('city_jinju'), L('city_suncheon_k'), L('city_jeonju'), L('city_sabi'), L('city_yuezhi'),
    L('city_hanseong'), L('city_kaesong'), L('city_haeju'), L('city_pyongyang'), L('city_xicheng'),
    L('city_longwan'), L('city_wugucheng'), L('city_liaoyang'), L('city_anshicheng'), L('city_tuhe'),
    L('city_ningyuan'), L('city_shanhaiguan'),
    // 燕赵太行东麓官道与崤函古道（山海关 → 北京 → 真定 → 邯郸 → 安阳 → 洛阳 → 函谷关 → 潼关 → 长安）
    L('city_feiru'), L('city_wuzhong'), L('city_beijing'), L('city_fanyang'), L('city_baoding'),
    L('city_zhongshan'), L('city_zhending'), L('city_xingtai'), L('city_handan'), L('city_anyang'),
    L('city_zhaoge'), L('city_huojia'), L('city_hulaoguan'), L('city_luoyang'), L('city_mianchi'),
    // 崤函古道（洛阳 → 渑池 → 函谷关 → 潼关 → 长安）｜🔴 [2026-11-10 逐段复查] 原走陆浑关属崤山南道，按「最知名商路」改走北崤道正线（渑池会盟在这条干道上）。
    L('city_hanguguan'), L('city_tongguan'), L('city_changan'),
    // 丝绸之路：关中 → 陇右 → 河西走廊 → 敦煌 → 玉门关
    L('city_qishan'), L('city_longzhou'), L('city_tianshui'), L('city_longxi'), L('city_lintao'),
    L('city_lanzhou'), L('city_lingju'), L('city_chiwubao'), L('city_wuwei'), L('city_shandan'),
    L('city_zhangye'), L('city_jiuquan'), L('city_chijin'), L('city_jinchangcheng'), L('city_dunhuang'),
    L('city_yumenguan'),
    // 丝绸之路：西域北道（三陇沙 → 楼兰扜泥城 → 尉犁库尔勒 → 轮台 → 它乾城 → 龟兹伊逻卢 → 拨换城 → 疏勒）
    L('city_sanlongsha'), L('city_loulan'), L('city_weili'), L('city_luntai'), L('city_taqian'),
    L('city_yiluolucheng'), L('city_yuergun'), L('city_bohuancheng'), L('city_dashicheng'), L('city_shule'),
    // 丝绸之路：葱岭 → 费尔干纳 → 河中粟特大道（疏勒 → 伊尔克什坦 → 奥什 → 浩罕 → 苦盏 → 撒马尔罕 → 布哈拉 → 阿姆城）
    L('city_yierkeshentan'), L('city_xiuxun'), L('city_aoshen'), L('city_kokand'), L('city_huzhan'),
    L('city_julushicheng'), L('city_jizhake'), L('city_samaerhan'), L('city_bukhara'), L('city_amucheng'),
    // 呼罗珊大道与波斯主干（木鹿 → 萨拉赫斯 → 图斯 → 尼沙布尔 → 白哈格 → 比斯塔姆 → 达姆甘 → 里海门 → 雷伊 → 哈马丹 → 巴格达）
    // 🔴 [2026-11-09 主人问「走里海门还是走兹拉卡塔」] 呼罗珊大道走厄尔布尔士山南麓：达姆甘（库米斯／百门城）→ 里海门 → 雷伊
    //    （伊西多尔《帕提亚驿程志》与伊斯兰地理书的驿道都是这条）；兹拉卡塔在山北里海岸，只是支线，不在主干上。
    L('city_merv'), L('city_salahesi'), L('city_tusi'), L('city_nishabuer'), L('city_baihage'),
    L('city_bistam'), L('city_damugan'), L('city_lihaimen'), L('city_leiyi'), L('city_hamadan'), L('city_hulewan'),
    L('city_bageda'),
    // 🔴 [2026-11-10 主人令「我要的一条历史上最知名的商路」] 巴格达→君堡改走史上最知名的一条主干，不再串南支：
    //    巴格达 → 巴比伦 → 幼发拉底（阿纳特/希特）→ 塔普萨库斯渡口 → 阿勒颇 → 安提俄基亚 →（伊苏斯战场）→ 阿达纳。
    //    依据：Inalcik 1994《An Economic and Social History of the Ottoman Empire》「Aleppo connected with Baghdad by a
    //    well-travelled caravan route which followed the course of the Euphrates」；奥斯曼右线＝伊斯坦布尔→科尼亚→古莱克
    //    隘口→阿达纳→米西斯→帕亚斯→贝伦→安塔基亚→阿勒颇（商栈网 46 座客栈全在对这条）；希罗多德 V.52–54 御道在塔普萨
    //    库斯一带幼发拉底渡河西折。原帕尔米拉—大马士革—贝鲁特南支是「巴格达→叙利亚都会/埃及」的另一条分支，历史上
    //    商队不会串起来再去君堡，从链上删去（帕尔米拉、埃梅萨、大马士革、贝鲁特、拉塔基亚五城据点不动，只是不再入链）。
    L('city_babilun'), L('city_anate'), L('city_tapusakusi'), L('city_alepo'), L('city_antiejiya'),
    // 小亚细亚皇家大道（阿达纳 → 科尼亚/伊科尼乌姆 → 戈尔迪乌姆 → 瑟于特 → 尼凯亚 → 君士坦丁堡）
    L('city_adana'), L('city_yikeniwumu'), L('city_geerdiweng'), L('city_seyute'), L('city_nixiya'),
    L('city_junshitandingbao'),
    // 巴尔干与多瑙河走廊（埃迪尔内 → 普罗夫迪夫 → 索非亚 → 尼什 → 贝尔格莱德 → 塞格德 → 布达佩斯 → 维也纳）
    L('city_aidiernei'), L('city_plovdiv'), L('city_sofia'), L('city_nis'), L('city_belgrade'),
    L('city_saigede'), L('city_budapeisi'), L('city_weiyeena'), L('city_gradeci'),
    // 北意大利、南法与伊比利亚大道（威尼斯 → 维罗纳 → 米兰 → 热那亚 → 阿维尼翁 → 纳博讷 → 巴塞罗那 → 巴伦西亚 → 马德里 → 托莱多 → 科尔多瓦 → 塞维利亚 → 加的斯）
    L('city_venice'), L('city_verona'), L('city_milan'), L('city_genoa'), L('city_avignon'),
    L('city_nabone'), L('city_barcelona'), L('city_valencia'), L('city_madeli'), L('city_toledo'),
    L('city_cordoba'), L('city_seville'), L('city_jiadisi'),
    // 西属印度宝船大西洋西行信风航线（加的斯 → 加那利特尔德 → 佛得角里贝拉 → 小安的列斯马提尼克 → 圣多明各 → 皇家港 → 哈瓦那 → 韦拉克鲁斯）
    S('city_telde'), S('city_ribeira'), S('city_martinique'), S('city_shengduomingge'), S('city_portroyal'),
    S('city_havana'), S('city_veracruz'),
    // 墨西哥亚洲皇家大道 Camino Real（韦拉克鲁斯 → 特诺奇提特兰/墨西哥城 → 阿卡普尔科）
    L('city_tenochtitlan'), L('city_acapulco'),
    // 太平洋马尼拉大帆船航线（阿卡普尔科 → 关岛 → 帕拉帕格 → 马尼拉 → 台湾大员 → 回长崎成环）
    ...GALLEON_SEA_TAIL,
];

/** 航行：严格由东向西的海上丝绸之路与大航海环线（62 港全唯一，逐港一跳直连） */
export const SAIL_CHAIN: TourStop[] = [
    // 东海与南海西行主航道（长崎 → 宁波 → 台州 → 福州 → 漳州 → 澎湖 → 泉州 → 广州 → 海康 → 珠崖 → 乂安 → 云屯 → 洞海城 → 昆仑岛 → 满剌加 → 亚齐）
    // 🔴 [2026-11-10 主人令「不要画路，只连接据点，直接昆仑岛至马六甲」] 海峡段站序改正：原走 昆仑岛 → 淡马锡 → 亚齐 → 满剌加——亚齐在苏门答腊西北端（西）、满剌加在东，西行先窜过亚齐再折回东，海峡来回横渡两次；
    //    按主人指示改走 昆仑岛 → 满剌加 → 亚齐，三条衔接全是现有海路直连边（昆仑岛—满剌加、亚齐—满剌加、亚齐—尼科巴），不画新路；淡马锡只是不再入链，据点本身不动。
    //    史序依据：满剌加＝郑和舰队基地与官厂；明针路西行序 满剌加 → 哑齐 → 翠蓝屿，满剌加在东、亚齐在西，西行必先满剌加后亚齐。
    S('city_nagasaki'), S('city_qingyuan_zj'), S('city_taizhou_zj'), S('city_fuzhou'), S('city_zhangzhou'),
    S('city_penghu'), S('city_qingjingsi'), S('city_panyu'), S('city_haikang'), S('city_yazhou'),
    S('city_yian'), S('city_yuntun'), S('city_donghai'), S('city_kunlundao'),
    S('city_malacca'), S('city_yaqi'),
    // 印度洋西行主航道（尼科巴 → 锡兰加勒 → 小葛兰 → 古里 → 孟买 → 卡拉奇 → 霍尔木兹 → 亚丁）
    S('city_nikoba'), S('city_jiale'), S('city_quilon'), S('city_guli'),
    S('city_mumbai'), S('city_kalaqi'), S('city_hormuz'), S('city_aden'),
    // 东非斯瓦希里海岸南下至好望角（摩加迪沙 → 蒙巴萨 → 莫桑比克 → 索法拉 → 好望角）
    // 🔴 [2026-11-10 主人令「塞拉没必要连接」] 亚丁 → 摩加迪沙直接用现有直连海路（季风直渡阿拉伯海—东非段，郑和 «古里→木骨都束» 直渡同一走廊）；
    //    塞拉（泽拉）是曼德海峡把口＋阿比西尼亚高原商队出海港（陆上商队线），不在这条海路主干上，只是不再入链，据点不动。
    S('city_mogadishu'), S('city_mombasa'), S('city_mozambique'), S('city_sofala'), S('city_cape_town'),
    // 南大西洋横渡与南美东岸南下至麦哲伦海峡（圣赫勒拿 → 萨尔瓦多 → 卡布弗里乌 → 圣维森特 → 布宜诺斯艾利斯 → 圣胡利安 → 费利佩港）
    S('city_sainthelena'), S('city_salvador'), S('city_kabufoliwu'), S('city_saovicente'),
    S('city_buenosaires'), S('city_sanjulian'), S('city_felipe'),
    // 南美与中美太平洋岸北上至阿卡普尔科（瓦尔迪维亚 → 康塞普西翁 → 瓦尔帕莱索 → 阿里卡 → 利马 → 瓜亚基尔 → 巴拿马 → 雷亚莱霍 → 阿卡普尔科）
    S('city_valdivia'), S('city_concepcion'), S('city_valparaiso'), S('city_arica'), S('city_lima'),
    S('city_guayaquil'), S('city_banama'), S('city_realejo'), S('city_acapulco'),
    // 横渡太平洋西行回长崎：马尼拉大帆船航线（阿卡普尔科 → 关岛 → 帕拉帕格 → 马尼拉）→ 台湾大员 → 艋舺 → 钓鱼岛 → 琉球首里 → 萨摩 → 府内 → 赤间关 → 原之辻 → 太宰府 → 五岛 → 长崎
    // 🔴 [2026-11-09 主人令] 拿掉檀香山、汤加、南马都尔：大帆船阿卡普尔科西行直航关岛，历史上不经这三处（汤加、波纳佩更是南绕一大圈）
    S('city_hagatna'), S('city_palapag'),
    S('city_manila'), S('city_tainan'), S('city_mengjia'), S('city_diaoyudao'), S('city_gugudao'),
    S('city_shuri'), S('city_akakinagusuku'), S('city_akaogicheng'), S('city_satsuma'), S('city_funei'),
    S('city_songshan'), S('city_chijianguan'), S('city_yuanzhishi'), S('city_taizaifu'), S('city_goto'),
];

/** 环球合并总链：先走一圈陆路（GLOBE_CHAIN，133 站），再走一圈海路（SAIL_CHAIN，62 港），首尾在长崎无缝衔接循环 */
export const TOUR_CHAIN: readonly TourStop[] = [...GLOBE_CHAIN, ...SAIL_CHAIN];

export function getTourChain(): readonly TourStop[] {
    return TOUR_CHAIN;
}
