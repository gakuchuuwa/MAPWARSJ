/**
 * 据点建立年代（前 334 年之后才建立的古典据点，开局 -334 不显示，到了建立年代才上图）。
 *
 * 🔴 [2026-09-23 主人定「添加一个建立年代，到了年代据点再显示」]
 *    起因：时代分层用「锚点武将时代」做代理，古典时代（起始~400）里混着大量
 *    前 334 年（亚历山大东征开始）之后才建立的城（希腊化城市 / 罗马城 / 安息萨珊城 / 贵霜匈奴），
 *    开局 -334 就把它们显示出来，违背历史。
 *
 * 口径：负数 = 公元前。**只记录「建立年代晚于 -334」的据点**；不在表里的据点默认
 *    前 334 年之前就已存在（开局即显示）。年代取学界共识；只知世纪 / 大致年代者
 *    取世纪起点或约数，注释标注「约」。
 *
 * 显隐：`ScriptCityVisibility` 里 `foundedYear > 当前事件年份 → 不显示`。
 */
export const CITY_FOUNDED_YEAR: Record<string, number> = {
    // ── 希腊化城市（亚历山大及其继承者所建）──
    city_yalishanda: -331,      // 亚历山大城，前 331 年亚历山大所建（学界共识）
    city_seuthopolis: -330,     // 塞乌托波利斯，约前 330 年塞乌特斯三世营建（奥德里西亚王都）
    city_antiejiya: -300,       // 安条克，前 300 年塞琉古一世所建
    city_beileinisi: -280,      // 贝雷尼斯，约前 280 年托勒密二世建红海港

    // ── 安息 / 萨珊 ──
    city_nisa: -247,            // 尼萨，前 247 年安息建国后第一首都（约）
    city_feiluzhabade: 224,     // 菲鲁扎巴德，224 年阿尔达希尔一世所建（萨珊第一城）
    city_nishabuer: 260,        // 尼沙布尔，约 260 年沙普尔一世萨珊省治

    // ── 罗马帝国欧洲城 ──
    city_teerier: -16,          // 特里尔，前 16 年罗马（奥古斯都）建
    city_sitelasibao: -12,      // 斯特拉斯堡，前 12 年罗马建
    city_utrecht: -47,          // 乌特勒支，约前 47 年罗马要塞
    city_jiemu: -46,            // 杰姆（蒂斯德鲁斯），约前 46 年罗马

    // ── 匈奴 / 印度 / 东非 ──
    city_zhizhicheng: -50,      // 郅支城，约前 50 年郅支单于
    city_sangqi: -250,          // 桑奇，约前 250 年阿育王始建佛塔
    city_aksum: -50,            // 阿克苏姆，约前 1 世纪阿克苏姆王国兴起
    city_gelanikusi: -333,      // 格拉尼库斯，按前 334 战役起名的城寨（前 334 年尚无此城）

    // ── 纳巴泰 ──
    city_peitra: -300,          // 佩特拉，约前 300 年纳巴泰人定居建城（英文维基 "settled in the 4th century BC"）

    // ── 汉西域 / 河西 ──
    city_zhangye: -111,         // 张掖，前 111 年汉武帝元鼎六年设张掖郡
    city_wuwei: -176,           // 姑臧（武威），约前 176 年匈奴占河西筑盖臧城（音讹为姑臧）
    city_chigucheng: -161,      // 赤谷城，约前 161 年乌孙西迁伊犁建都（百度百科）
    city_yiluolucheng: -177,    // 龟兹（伊逻卢城 / 汉代延城），约前 2 世纪龟兹国

    // ── 中国秦汉以后新建 / 更名的城 ──
    city_tuodongcheng: -279,    // 滇池，约前 279 年庄蹻入滇建滇国
    city_datong: -295,          // 大同（平城），约前 295 年战国赵建平城
    city_hefei: -221,           // 合肥，约前 221 年秦置合肥县
    city_lanzhou: -81,          // 皋兰（兰州），前 81 年汉昭帝始元六年置金城郡
    city_fuyu: -200,            // 黄龙府（夫余），约前 2 世纪夫余建国（前 108 年已立国）
    city_wuchang: 221,          // 武昌，221 年孙权筑武昌城（改鄂县为武昌）
    city_chaoyang: 341,         // 朝阳（龙城），341 年慕容皝筑龙城

    // ── 欧洲（罗马古典 + 中世纪都城）──
    city_cordoba: -169,         // 科尔多瓦，前 169 年罗马建（英文维基 "In 169 BC"）
    city_bali: -250,            // 巴黎，约前 250 年巴黎西人建 Lutetia（前 3 世纪中叶）
    city_buersa: -202,          // 布尔萨，约前 202 年比提尼亚建（Cius / Prusa）

    // ── 西亚 / 中亚伊斯兰、金帐 ──
    city_bageda: 762,           // 巴格达，762 年阿拔斯哈里发曼苏尔建
    city_salai: 1240,           // 萨莱（新萨莱），约 1240 年拔都建金帐汗国都城

    // ── 印度 / 东南亚 ──
    city_deli: 736,             // 德里，约 736 年 Tomar 拉吉普特王朝建 Dhillika
    city_agela: 1504,           // 阿格拉，1504 年 Sikandar Lodi 建
    city_gaodacheng: 750,       // 高达城，750 年波罗帝国建都（Gopala）
    city_hengbi: 1336,          // 亨比，1336 年毗奢耶那伽罗帝国建都
    city_angkor: 802,           // 吴哥，802 年阇耶跋摩二世建都
    city_sanfoqi: 683,          // 巨港，约 683 年室利佛逝建都

    // ── 中国（秦汉以后建城 / 后世都城）──
    city_changan: -202,         // 长安，前 202 年汉高祖建长安城
    city_panyu: -214,           // 番禺，前 214 年秦设南海郡
    city_nanjing: -333,         // 金陵，前 333 年楚威王置金陵邑
    city_hangzhou: -221,        // 杭州，前 221 年秦设钱塘县
    city_qingjingsi: 282,       // 刺桐（泉州），282 年西晋设晋安郡

    // ── 东北亚（女真 / 新罗 / 日本）──
    city_huining: 1115,         // 会宁府，1115 年完颜阿骨打建金上京
    city_jincheng_silla: -57,   // 金城（庆州），前 57 年新罗建国都城
    city_kyoto: 794,            // 京都（平安京），794 年桓武天皇迁都
    city_edo: 1457,             // 江户城，1457 年太田道灌筑江户城

    // ── 据点名首次出现（坐标上更早有城，但用的是后世著名时期的名字）──
    city_junshitandingbao: 330, // 君士坦丁堡，330 年君士坦丁大帝落成命名（此前叫拜占庭，前 657 建）
    city_luoyang: -300,         // 洛阳，约前 300 年战国「洛水之阳」得名（此前叫洛邑，前 1046 营建）
    city_bianliang: 907,        // 开封，907 年后梁改汴州为开封府（此前叫大梁，前 364 建）
    city_beijing: 1421,         // 北京，1421 年明成祖迁都北京（此前叫蓟城/幽州/大都）
    city_yangzhou: -120,        // 广陵，约前 120 年汉代置广陵国（此前叫邗城，前 486 建）

    // ── 欧洲中城（罗马城 + 中世纪城）──
    city_lundun: -43,           // 伦敦，前 43 年罗马建 Londinium
    city_lyon: -43,             // 里昂，前 43 年罗马建 Lugdunum
    city_kelong: -38,           // 科隆，前 38 年罗马建 Colonia Agrippina
    city_milan: -222,           // 米兰，前 222 年罗马建 Mediolanum
    city_florence: -59,         // 佛罗伦萨，前 59 年罗马建 Florentia
    city_sofia: 1300,           // 索非亚，约 14 世纪得名 Sofia（前身 Serdica 前 29 年罗马建）
    city_venice: 421,           // 威尼斯，421 年建
    city_naples: -470,          // 那不勒斯，约前 470 年希腊建 Neapolis
    city_feisi: 789,            // 非斯，789 年伊德里斯一世建
    city_malajiashen: 1070,     // 马拉喀什，1070 年阿尔摩拉维德建
    city_madeli: 850,           // 马德里，约 850 年阿拉伯建
    city_granada: 750,          // 格拉纳达，约 750 年阿拉伯建
    city_bulage: 870,           // 布拉格，约 870 年建
    city_kelakefu: 700,         // 克拉科夫，约 700 年维斯瓦人建
    city_huasha: 1300,          // 华沙，约 1300 年建
    city_sidedegelmo: 1252,     // 斯德哥尔摩，约 1252 年建
    city_shengpidebao: 1703,    // 圣彼得堡，1703 年彼得大帝建
    city_lisiben: -200,         // 里斯本，约前 200 年罗马 Olissipo（更早腓尼基/卢西塔尼亚聚落）
    city_seville: -200,         // 塞维利亚，约前 200 年罗马 Hispalis
    city_toledo: -200,          // 托莱多，约前 200 年罗马 Toletum
    city_barcelona: -15,        // 巴塞罗那，约前 15 年罗马建 Barcino
    city_genoa: -400,           // 热那亚，约前 400 年利古里亚人建 Genua
    city_weiyeena: -15,         // 维也纳，约前 15 年罗马建 Vindobona
    city_lansi: -50,            // 兰斯，约前 50 年 Remi 部落首府 Durocortorum
    city_budapeisi: -89,        // 布达佩斯，约前 89 年罗马建 Aquincum（布达）
    city_timbuktu: 1100,        // 廷巴克图，约 1100 年建

    // ── 美洲中城 ──
    city_tenochtitlan: 1325,    // 特诺奇提特兰，1325 年阿兹特克建
    city_havana: 1519,          // 哈瓦那，1519 年西班牙建
    city_salvador: 1549,        // 萨尔瓦多，1549 年葡建（巴伊亚首府）

    // ── 中东中城 ──
    city_mosike: 1147,          // 莫斯科，1147 年首见记载
    city_maidina: 622,          // 麦地那，622 年先知迁徙（前身 Yathrib）
    city_samaila: 836,          // 萨迈拉，836 年阿拔斯建
    city_bashila: 636,          // 巴士拉，636 年阿拉伯军事营地
    city_kokand: 1740,          // 浩罕，约 1740 年浩罕汗国建
    city_aidesa: -302,          // 埃德萨，约前 302 年塞琉古建

    // ── 印度 / 东南亚 / 西域中城 ──
    city_guoa: 1510,            // 果阿旧城，1510 年葡占
    city_tanjiawuer: 850,       // 坦贾武尔，约 850 年朱罗王朝建
    city_pagan: 849,            // 蒲甘，849 年建
    city_ayutthaya: 1350,       // 阿瑜陀耶，1350 年建
    city_malacca: 1400,         // 马六甲，约 1400 年拜里米苏拉建
    city_karakorum: 1220,       // 哈拉和林，1220 年成吉思汗建
    city_shenglong: 1010,       // 昇龙，1010 年李朝迁都
    city_teluowulan: 1293,      // 特罗武兰，1293 年满者伯夷建
    city_luoxie: 633,           // 逻些（拉萨），633 年松赞干布迁都
    city_dunhuang: -111,        // 敦煌，前 111 年汉武帝设敦煌郡

    // ── 中国 / 东亚中城 ──
    city_xingqingfu2: 1033,     // 兴庆府，1033 年西夏建兴庆府
    city_tongwancheng: 413,     // 统万城，413 年赫连勃勃建
    city_guihua: 1575,          // 归化城，1575 年俺答汗建
    city_shangdu: 1256,         // 上都，1256 年忽必烈建
    city_linhuang: 918,         // 临潢府，918 年辽建上京
    city_kaesong: 918,          // 开城，918 年高丽建开京
    city_hanseong: 1394,        // 汉城，1394 年李朝迁都汉阳
    city_shuri: 1429,           // 首里，1429 年尚巴志建
    city_ningan: 742,           // 龙泉府，约 742 年渤海迁都上京
    city_kamakura: 1180,        // 镰仓，1180 年源赖朝入镰仓

    // ── 古典中城（城名是秦汉隋唐定的，前 334 年后才叫这名）──
    city_cangwu: -111,          // 苍梧，前 111 年汉武帝设苍梧郡
    city_ying: -278,            // 江陵，约前 278 年秦拔郢设江陵（此前叫郢都）
    city_linfen: 581,           // 临汾，581 年隋设临汾县（此前叫平阳）
};
