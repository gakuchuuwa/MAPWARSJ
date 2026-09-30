/**
 * 特殊建筑（城内奇观）建成年代 —— 🔴 [2026-09-30 主人令「给每个特殊建筑添加一个建好的年代」]
 *
 * 剧本期：奇观只在「建成年代 ≤ 当前剧本年份」时才显示（哪怕挂靠据点已显示，奇观未建成也不画）。
 * 乱斗期：一律显示（不看年代）。
 * key = SUCAI_BUILDING 素材目录名（CityWonders.ts 的 asset），value = 建成年代（公元前用负数）。
 *
 * 口径：
 * - 有确切建成年份的，填确切年份（如天坛 1420、斗兽场 80、巨石阵 -3000）。
 * - 只有世纪范围的，取起始年或中点并标「约」（如斯巴达约前900）。
 * - 自然景观（伊瓜苏瀑布）填极早年 -10000，表示「自古存在」。
 * - 神话/虚构对象按相关时代填（斯芬克斯按古典底比斯 -600）。
 * - 查无确切年代、且无通行的，按史地合理推定并标「约」。
 * 改动纪律：建成年代是历史事实，改前须有出处；查不到就标「约」并留注释，不许凭空定精确数。
 */
export const WONDER_FOUNDED_YEAR: Record<string, number> = {
    // ── 主奇观（CITY_WONDER）──
    'MEDI_WONDER_ARMENIANS': -782,        // 埃里温：前782年乌拉尔图建埃勒布尼城堡（亚美尼亚纪年起点）
    'SEAS_WONDER_KHMER': 1113,            // 吴哥窟：苏利耶跋摩二世1113–1150建
    'WEST_WONDER_FRANKS': 1194,           // 沙特尔圣母主教座堂：1194–1220重建
    'ASIA_WONDER_CHINESE': 1420,          // 北京天坛：明永乐十八年（1420）建成
    'SCEN_HALL_OF_HEROES': 643,           // 长安凌烟阁：唐贞观十七年（643）置二十四功臣画像
    'PERSIAN_WONDER_ACHAEMENIDS': -518,   // 波斯波利斯：大流士一世约前518年起建
    'SLAV_WONDER_MAGYARS': 1446,          // 科文城堡：约翰·匈雅提1446年起建
    'SLAV_WONDER_BOHEMIANS': 880,         // 布拉格城堡：约880年普热米斯尔王朝建（约）
    'ASIA_WONDER_SHU': 221,               // 成都：蜀汉章武元年（221）刘备称帝定都
    'ORIE_WONDER_SARACENS': 848,          // 萨迈拉大清真寺螺旋塔：848–852
    'INDI_WONDER_HINDUSTANIS': 1193,      // 德里：顾特卜塔1193年（库特布丁·艾巴克）始建
    'MEDI_WONDER_GEORGIANS': 479,         // 第比利斯：约479年瓦赫坦格一世建城（约）
    'WEST_WONDER_BURGUNDIANS': 1402,      // 布鲁塞尔市政厅：1402–1455建
    'WEST_WONDER_CELTS': 400,             // 卡舍尔之石：芒斯特王座，约4世纪起为宗教王权中心（约）
    'EAST_WONDER_GOTHS': 520,             // 拉文纳狄奥多里克陵墓：约520年
    'INDI_WONDER_INDIANS': 1010,          // 坦贾武尔布里哈迪斯瓦拉神庙：朱罗罗阇罗阇一世1010年建成
    'SLAV_WONDER_SLAVS': 1714,            // 基日岛主显圣容教堂：1714年
    'MEDI_WONDER_BYZANTINES': 537,        // 君士坦丁堡圣索菲亚大教堂：537年
    'ASIA_WONDER_KOREANS': 645,           // 庆州皇龙寺九层木塔：645年
    'ORIE_WONDER_BERBERS': 1195,          // 拉巴特哈桑塔：穆瓦希德1195年始建
    'ASIA_WONDER_MONGOLS': 1206,          // 成吉思汗金帐：1206年建大蒙古国（约）
    'CEAS_WONDER_TATARS': 1424,           // 撒马尔罕乌鲁格别克天文台：1420年代（约）
    'SLAV_WONDER_POLES': 1038,            // 克拉科夫瓦维尔城堡：约1038年重建（约）
    'EAST_WONDER_TEUTONS': 1093,          // 拉赫的玛利亚拉赫修院：1093年
    'ASIA_WONDER_JAPANESE': 794,          // 京都（平安京）：794年
    'ASIA_WONDER_KHITANS': 1056,          // 应县佛宫寺释迦塔（应县木塔）：1056年
    'MEDI_WONDER_PORTUGUESE': 1515,       // 里斯本贝伦塔：1515年
    'ASIA_WONDER_WEI': 220,               // 洛阳（曹魏）：220年曹丕代汉定都
    'ASIA_WONDER_WU': 247,                // 上海静安寺：三国吴赤乌十年（247）
    'SEAS_WONDER_BURMESE': 1105,          // 蒲甘阿难陀寺：1105年
    'MEDI_WONDER_SICILIANS': 831,         // 巴勒莫：831年阿拉伯人入主建城（约）
    'ASIA_WONDER_VIETNAMESE': 1010,       // 昇龙：李朝1010年迁都
    'GREEK_WONDER_SPARTANS': -900,        // 斯巴达：约前10世纪多利亚人建城（约）
    'SLAV_WONDER_BULGARIANS': 907,        // 普雷斯拉夫圆形金教堂：约907年
    'MEDI_WONDER_SPANISH': 1220,          // 塞维利亚黄金塔：1220年
    'EAST_WONDER_HUNS': 400,              // 塞格德凯旋门废墟：匈人时期约5世纪（虚构奇观，按时代约）
    'SCEN_COLOSSEUM': 80,                 // 罗马斗兽场：80年（弗拉维圆形剧场）
    'MEDI_WONDER_ITALIANS': 1098,         // 热那亚圣洛伦佐大教堂：1098年
    'SLAV_WONDER_LITHUANIANS': 1323,      // 维尔纽斯：1323年格迪米纳斯大公建城
    'GREEK_WONDER_ATHENIANS': -447,       // 雅典卫城帕特农神庙：前447–432
    'SCEN_AACHEN_CATHEDRAL': 796,         // 亚琛大教堂：796–805
    'SCEN_DOME_OF_THE_ROCK': 691,         // 耶路撒冷圆顶清真寺：691年
    'ORIE_WONDER_TURKS': 1569,            // 埃迪尔内塞利米耶清真寺：1569–1575
    'MESO_WONDER_AZTECS': 1325,           // 特诺奇提特兰：1325年建城
    'MESO_WONDER_INCAS': 1100,            // 库斯科：约12世纪印加建城（约）
    'MESO_WONDER_MAYANS': 600,            // 蒂卡尔：玛雅古典期约6世纪鼎盛（约）
    'ANDE_WONDER_MAPUCHE': 1000,          // 图卡佩尔：马普切聚落，约1000年（约）
    'ANDE_WONDER_MUISCA': 1000,           // 索加莫索太阳神庙：穆伊斯卡，约1000年（约）
    'ANDE_WONDER_TUPI': -10000,           // 伊瓜苏瀑布：自然奇观，自古存在
    'SCEN_SANKORE_MADRASAH': 1327,        // 廷巴克图桑科雷经学院：约1327年
    'AFRI_WONDER_ETHIOPIANS': 1181,       // 拉利贝拉岩石教堂：拉利贝拉王1181–1221
    'SEAS_WONDER_MALAY': 778,             // 卡拉桑佛寺：778年
    'INDI_WONDER_GURJARAS': -500,         // 索姆纳特神庙：约前6世纪始建（约）
    'INDI_WONDER_BENGALIS': 770,          // 索玛普利大寺：帕拉王朝约770年
    'GREEK_WONDER_MACEDONIANS': -500,     // 佩拉：约前5世纪马其顿定都（约）
    'THRACIAN_WONDER_THRACIANS': -342,    // 普罗夫迪夫（菲利普波利斯）：腓力二世前342年建
    'ORIE_WONDER_PERSIANS': 250,          // 泰西封拱门：萨珊约3世纪起建（约）
    'CEAS_WONDER_CUMANS': 834,            // 萨尔克尔（顿河白色堡垒）：可萨834年建
    'SCEN_WONDER_BRITONS': 648,           // 温彻斯特：韦塞克斯7世纪建主教座堂（约）
    'SCEN_WONDER_SLAVS': 859,             // 诺夫哥罗德：859年首见记载（约）
    'PURU_WONDER_PURU': 746,              // 帕坦：约8世纪建（约）
    'SCEN_PAGODA_D': 1238,                // 素可泰玛哈泰寺：素可泰王朝1238年立（约）
    'MINARET_OF_JAM': 1194,               // 贾姆宣礼塔：古尔王朝约1194年
    'SCEN_PAGODA_C': 1566,                // 万象塔銮：1566年
    'SCEN_CUSHITE_PYRAMIDS': -300,        // 麦罗埃黑金字塔：约前3世纪起建（约）
    'SCEN_ANDEAN_RUINS': 500,             // 蒂亚瓦纳科太阳门：约5世纪（约）
    'SCEN_REKHADEUL_TEMPLE': 1135,        // 普里贾格纳特神庙：约12世纪建（约）
    'SCEN_INDIAN_RUINS': 1336,            // 亨比神庙群：毗奢耶那伽罗1336年建都
    'GOL_GUMBAZ': 1656,                   // 比贾布尔戈尔贡巴兹：1656年
    'WOODEN_FORT': 1565,                  // 圣奥古斯丁木堡：1565年
    'SCEN_ARCHAIC_THOLOS': -600,          // 德尔斐阿波罗神庙：约前6世纪建（约）
    'SCEN_HERO_SHRINE': -900,             // 奥林匹亚：约前10世纪（约）
    'EAST_WONDER_VIKINGS': 1180,          // 博尔贡木板教堂：约1180年（约）
    'QUIMPER_CATHEDRAL': 1239,            // 坎佩尔大教堂：1239年
    'THRACIAN_SHIPYARD_AGE2': -500,       // 瓦尔纳（奥德索斯）：约前6世纪建（约）
    'AMPHITHEATRE': 238,                  // 杰姆圆形剧场：238年
    'SCEN_FIRE_SHRINE': 400,              // 亚兹德拜火坛：萨珊约5世纪（约）
    'SCEN_ANCIENT_RUINS': -2100,          // 乌尔城塔庙：约前21世纪（约）
    'SANCHI_STUPA': -250,                 // 桑奇大佛塔：阿育王约前3世纪（约）
    'SCEN_BUDDHA_STATUE': -250,           // 菩提伽耶：约前3世纪阿育王（约）
    'AFRI_WONDER_MALIANS': 1280,          // 杰内大清真寺：约1280年建（约）
    'POENARI_CASTLE': 1215,               // 波耶纳里城堡：瓦拉几亚约13世纪（约）
    'BENG_CASTLE_AGE3': 1643,             // 比什努普尔：孟加拉17世纪神庙（约）
    'BULG_CASTLE_AGE3': 900,              // 巴巴维达城堡：约10世纪（约）
    'ETHI_CASTLE_AGE3': 1636,             // 法西尔盖比：1636年
    'FRAN_CASTLE_AGE3': 1519,             // 香波尔城堡：1519年
    'GEOR_CASTLE_AGE3': 1100,             // 阿哈尔齐赫城堡：约12世纪（约）
    'GURJ_CASTLE_AGE3': 750,              // 瓜廖尔堡：约8世纪（约）
    'INCA_CASTLE_AGE3': 1450,             // 马丘比丘：约1450年
    'INDI_CASTLE_AGE3': 1143,             // 戈尔康达堡：1143年
    'MALA_CASTLE_AGE3': 1347,             // 帕加鲁永：米南加保约14世纪（约）
    'MAYA_CASTLE_AGE3': 700,              // 乌斯马尔：玛雅古典期约7世纪（约）
    'PERS_CASTLE_AGE3': -500,             // 巴姆城堡：阿契美尼德约前5世纪起源（约）
    'POLE_CASTLE_AGE3': 1358,             // 本津城堡：1358年
    'PORT_CASTLE_AGE3': 1100,             // 布拉干萨城堡：约12世纪（约）
    'SPAN_CASTLE_AGE3': 1050,             // 拉莫塔城堡：约11世纪（约）
    'THRACIANS_CASTLE_AGE3': -325,        // 塞乌托波利斯：塞乌特斯三世约前4世纪（约）
    'MACEDONIAN_CASTLE_AGE3': -350,       // 希马罗斯城堡：马其顿约前4世纪（约）
    'PURU_CASTLE_AGE3_ATTACKUP': 1581,    // 阿托克堡：1581年
    'PURU_CASTLE_AGE3_BOTHUP': -490,      // 华氏城：摩揭陀约前5世纪建（约）
    'PURU_CASTLE_AGE3_DEFENSEUP': -550,   // 王舍城：摩揭陀约前6世纪（约）

    // ── 附加城内奇观（CITY_WONDER_EXTRA）──
    'AFRI_CASTLE_AGE3': 1070,             // 穆拉比特堡：马拉喀什1070年建城
    'ARCH_OF_CONSTANTINE': 315,           // 君士坦丁凯旋门：315年
    'ARME_CASTLE_AGE3': 1100,             // 蛇堡（莱翁克拉）：奇里乞亚亚美尼亚约12世纪（约）
    'ASIA_WONDER_JURCHENS': 1100,         // 银山塔林：辽金墓塔约11–12世纪（约）
    'ATHENIANS_CASTLE_AGE3': -447,        // 雅典卫城：帕特农神庙前447–432
    'BERB_CASTLE_AGE3': 1070,             // 马拉喀什城堡：1070年
    'BOHE_CASTLE_AGE3': 1348,             // 卡尔施泰因堡：查理四世1348年
    'BURG_CASTLE_AGE3': 1050,             // 贝尔瑟尔堡：约11世纪（约）
    'BURM_CASTLE_AGE3': 1364,             // 因瓦王城：1364年
    'EAST_CASTLE_AGE3': 1446,             // 科文城堡：1446年
    'GOTH_CASTLE_AGE3': 550,              // 曼古普堡：克里米亚哥特约6世纪（约）
    'GREAT_PYRAMID': -2560,               // 吉萨大金字塔：胡夫约前2560年
    'GREEK_SHIPYARD_AGE2': -493,          // 比雷埃夫斯军港：地米斯托克利前493年
    'HIND_CASTLE_AGE3': 1546,             // 德里古堡：约1546年（约）
    'LITH_CASTLE_AGE3': 1323,             // 维尔纽斯城堡：1323年
    'MESO_CASTLE_AGE3': 1325,             // 特诺奇提特兰大神庙：1325年
    'MUIS_CASTLE_AGE3': 1000,             // 穆伊斯卡寨：约1000年（约）
    'PAGAN_SHRINE': -1000,                // 罗姆瓦圣殿：波罗的海古代圣所（约）
    'PERSIAN_CASTLE_ACHAEMENIDS_AGE3': -518, // 波斯波利斯宫堡：前518年
    'PERSIAN_CASTLE_AGE3': -3000,         // 苏萨王城：约前4千年建城（约）
    'SCEN_CASTLE_RUINS': 1210,            // 科洛西要塞：十字军约1210年（约）
    'SCEN_CHINESE_RUINS': 598,            // 天台山国清寺：隋开皇十八年（598）
    'SCEN_PAGODA_A': 970,                 // 六和塔：约970年
    'SCEN_PAGODA_B': -500,                // 勃固瑞摩都佛塔：孟族古都约前6世纪（约）
    'SCEN_PAGODA_E': 1630,                // 柴瓦塔纳兰寺：巴萨通王1630年
    'SCEN_ROMAN_RUINS': -600,             // 庞贝古城：约前6世纪建城（约）
    'SCEN_SPHINX': -600,                  // 底比斯斯芬克斯：古典希腊约前6世纪（约）
    'SCEN_STONEHENGE': -3000,             // 巨石阵：约前3000年
    'SCEN_TORII_GATE': 593,               // 严岛神社：593年
    'SEAS_CASTLE_AGE3': 1181,             // 吴哥王城：阇耶跋摩七世1181年
    'SICI_CASTLE_AGE3': 1239,             // 乌尔西诺堡：腓特烈二世1239年
    'SPARTANS_CASTLE_AGE3': -900,         // 斯巴达堡垒：约前10世纪（约）
    'VIET_CASTLE_AGE3': 1804,             // 顺化皇城：阮朝1804年
    'VIKI_CASTLE_AGE3': 1308,             // 博胡斯堡：1308年
    'WEST_CASTLE_AGE3': 1080,             // 罗切斯特堡：1080年
    'WEST_WONDER_BRITONS': 1075,          // 奇切斯特大教堂：1075年
};
