/**
 * 旗号图案（纹章/徽记）试水表 —— 2026-10-24 主人「要不改一下试试，不行再次换回来」
 *
 * 只给**非东亚汉字圈**势力登记图案：旗面不再画「托勒」「塞琉」这种两字截断音译。
 * 日本另走家纹（kamon）旗：战国武士本就用家纹指物旗（2026-10-24 主人「日本的呢」）。
 * 图案来源，统一烘成 `public/emblem-flags/{KEY}_{w|b}.png`（4帧×6朝向雪碧图）：
 *   · ICON：game-icons.net 现成单色图标（CC BY 3.0，署名见 docs/02-design/旗号图案-图标素材来源.md）
 *   · HAND：手绘粗线条符号（`scratch/_emblem_symbols.py`，自绘无版权问题）
 *   · KAMON：日本家纹（`scratch/_kamon_symbols.py`，按史料图形自绘或描摹公有领域参考图）
 * 烘焙：`scratch/_bake_emblem_sprites.py`。
 *
 * 回退：删掉本表条目 = 该势力立刻回汉字旗号；整表清空 = 全部回汉字。
 * 汉字文化圈（中国各朝/朝鲜/越南/吐蕃/契丹/女真…）**不登记**，照旧用旗号汉字；
 * 日本有明证家纹的各家登记家纹；伊贺众无统一家纹、加贺一向一揆使用佛号旗，仍用汉字。
 * ⚠ [2026-10-25 主人令] 试水版「按文化圈分派、同圈共用」已废：现在一种纹章只给一个势力，
 *   没有史有明证的专属纹章就恢复字旗（旗号＝1–2 字势力简称），不许两家共用一个纹章。
 */
export const FACTION_EMBLEM: Readonly<Record<string, string>> = {
    // 🔴 [2026-10-25 主人令「要符合历史…一种纹章只能一个势力；没有新的纹章就先恢复字」]
    //    只保留**史有明证的专属纹章**，一个 KEY 只登记一家；其余势力不登记 → 走旗号汉字（1–2 字势力简称）。
    //    新增纹章一律先有素材（{KEY}_{w|b}.png）与史实依据，再在这里加一行；不许两家共用一个 KEY。
    luoma_diguo: 'EAGLE',   // 罗马帝国·军团鹰
    baizanting: 'BYZ_CROSS',   // 拜占庭·十字
    xila: 'OWL',   // 雅典·猫头鹰
    maqidun: 'SUN',   // 马其顿·维吉纳太阳
    gaolu: 'FLEUR',   // 法兰西·鸢尾
    yinggelan: 'ENGLAND_CROSS',   // 英格兰·圣乔治平十字（直臂、不外扩）
    tiaodun_qishi: 'TEUTONIC_CROSS',   // 条顿骑士团·黑十字（不是1813年后的铁十字勋章）
    yelusalengwg: 'JERUSALEM_CROSS',   // 耶路撒冷王国·耶路撒冷十字
    shengdian_qishi: 'TEMPLAR_CROSS',   // 圣殿骑士团·cross pattée（不再用通用盾）
    osman: 'CRESCENT',   // 奥斯曼·新月
    adal: 'ADAL_CRESCENT_AND_SWORD',   // 阿达尔·新月＋弯刀（2026-10-30；苏丹国无留传专属纹章，取伊斯兰苏丹国军旗通行的新月＋弯刀，KEY 独立不与奥斯曼共用）
    kongque: 'CARTWHEEL',   // 孔雀帝国·法轮
    zhuluo: 'TIGER',   // 朱罗·虎
    menggu_d: 'TAMGA',   // 蒙古·塔木加
    kushi: 'PYRAMID',   // 库施·金字塔
    aqimeinide: 'WINGED_SUN',   // 阿契美尼德·翼日盘
    mapuche: 'STAR7',   // 马普切·七角星
    aztec: 'SERPENT',   // 阿兹特克·羽蛇
    tupi: 'FEATHER',   // 图皮·羽饰
    heishi: 'AGEHACHO',   // 平氏·扬羽蝶
    tokugawa: 'AOI',   // 德川·葵
    nanbu_shi: 'CRANE',   // 南部·鹤
    fujiwara: 'FUJI',   // 奥州藤原·藤
    ashikaga: 'HIKIRYO',   // 室町足利·引两
    mori: 'ICHIMONJI',   // 毛利·一文字
    suwa_d: 'KAJI',   // 诹访·梶
    chosokabe: 'KATABAMI',   // 土佐长宗我部·片喰
    nanchou: 'KIKU',   // 南朝·菊
    toyotomi: 'KIRI',   // 丰臣·桐
    otomo_d: 'KYOYO',   // 大友·杏叶
    hojo: 'MITSUUROKO',   // 北条·三鳞
    oda: 'MOKKO',   // 织田·木瓜
    ouchi: 'OOUCHI_BISHI',   // 大内·菱
    sanada: 'ROKUMONSEN',   // 真田·六文钱
    date_d: 'SASA',   // 仙台伊达·竹雀
    genji: 'SASARINDO',   // 源氏·笹龙胆
    shimazu: 'SHIMAZU_CROSS',   // 岛津·十字
    takeda: 'TAKEDA_BISHI',   // 武田·武田菱
    ryukyu: 'TOMOE',   // 琉球·巴
    amago: 'YOTSUME',   // 尼子·四目
    // ── 2026-10-25 第一批新增史实纹章（19 种，每家一个专属 KEY）──────────────
    mazhaer: 'HUNGARY_STRIPES',   // 匈牙利·阿尔帕德红白条纹
    bolan: 'POLISH_EAGLE',   // 波兰·白鹰带冠
    boximiya: 'BOHEMIA_LION',   // 波西米亚·白狮（双尾）
    kasidiliya: 'CASTILE_CASTLE',   // 卡斯蒂利亚·城堡
    leangongguo: 'LEON_LION',   // 莱昂·狮
    alagong: 'ARAGON_STRIPES',   // 阿拉贡·红黄条纹
    putaoya: 'PORTUGAL_QUINAS',   // 葡萄牙·五盾（quinas）
    kelite: 'VENICE_LION',   // 威尼斯共和国·圣马可飞狮
    baojialiya: 'BULGARIA_LION',   // 保加利亚·狮
    saierweiya: 'SERBIA_EAGLE',   // 塞尔维亚·双头鹰
    eluosi_diguo: 'RUSSIA_EAGLE',   // 俄罗斯帝国·双头鹰
    ruidian_si: 'SWEDEN_CROWNS',   // 瑞典·三王冠
    scotland: 'SCOTLAND_SALTIRE',   // 苏格兰·圣安德鲁斜十字
    weiershigongguo: 'WALES_DRAGON',   // 威尔士公国·红龙
    xixiliwangguo: 'SICILY_TRINACRIA',   // 西西里·三曲腿
    ruishi: 'SWISS_CROSS',   // 瑞士·白十字
    didi: 'FLANDERS_LION',   // 佛兰德·狮
    bulietani: 'BRITTANY_ERMINE',   // 布列塔尼·貂纹
    nuowei: 'NORWAY_LION_AXE',   // 挪威·狮持斧
    // ── 2026-10-25 第二批新增史实纹章（13 种，每家一个专属 KEY）──────────────
    litaowan: 'LITHUANIA_VYTIS',   // 立陶宛·Vytis 骑士
    luosi: 'RURIK_TRIDENT',   // 罗斯·留里克三叉戟
    baojian_qishi: 'SWORD_BROTHERS',   // 宝剑骑士团·双剑
    maerta_qishi: 'MALTESE_CROSS',   // 圣约翰（医院骑士团）·马耳他十字
    nidelan: 'NETHERLANDS_LION',   // 尼德兰·狮持剑
    aquidan: 'AQUITAINE_LEOPARD',   // 阿奎丹·豹
    jinzhang: 'GOLDEN_TAMGA',   // 金帐·塔木加
    inca: 'INCA_SUN',   // 印加·太阳（Inti）
    bogendigongguo: 'BURGUNDY_SALTIRE',   // 勃艮第公国·斜十字
    seljuq: 'SELJUK_BOW',   // 塞尔柱·弓
    ethiopia: 'ETHIOPIA_LION',   // 埃塞俄比亚·犹大之狮
    // ── 2026-10-25 第三批新增史实纹章（16 种）────────────────────────────────
    bafaliya: 'BAVARIA_LOZENGES',   // 巴伐利亚·蓝白菱形
    moerdaweiya: 'MOLDAVIA_AUROCHS',   // 摩尔达维亚·牛头
    pomeilaniya: 'POMERANIA_GRYPHIN',   // 波美拉尼亚·狮鹫
    safuyi: 'SAVOY_KNOT',   // 萨伏伊·绳结
    gelujiya: 'GEORGIA_CROSSES',   // 格鲁吉亚·五十字
    xike: 'SIKH_KHANDA',   // 锡克帝国·坎达
    kelimiya: 'GENOA_CROSS',   // 热那亚·圣乔治十字
    bulabante: 'BRABANT_LION',   // 布拉班特·双尾狮
    bosiniya: 'BOSNIA_LILY',   // 波斯尼亚·百合
    walajiyia: 'WALLACHIA_EAGLE',   // 瓦拉几亚·鹰
    mowoer: 'MUGHAL_SUN_LION',   // 莫卧儿·狮日
    mamuluke: 'MAMLUK_LION',   // 马穆鲁克·狮
    ayoubu: 'AYYUBID_EAGLE',   // 阿尤布·鹰
    manzheboyi: 'MAJAPAHIT_BANDS',   // 满者伯夷·红白条
    siam: 'SIAM_ELEPHANT',   // 暹罗·白象
    yiluokui: 'IROQUOIS_TREE',   // 易洛魁·和平树
    // ── 2026-10-25 第四批新增史实纹章（11 种）────────────────────────────────
    deli: 'DELHI_BANNER',   // 德里苏丹国·垂旗新月
    maya: 'MAYA_JAGUAR',   // 玛雅·美洲豹
    chenla: 'KHMER_TOWERS',   // 真腊·吴哥三塔
    lunbadi: 'LOMBARD_CROWN',   // 伦巴第·铁冠
    amaniyake: 'ARMAGNAC_LION',   // 阿马尼亚克·狮
    jiatailuoniya: 'CATALONIA_BARS',   // 加泰罗尼亚·四竖条
    wulaertu: 'ARMENIA_LION',   // 亚美尼亚·狮
    bendou: 'TREBIZOND_EAGLE',   // 特拉布宗·鹰
    ldiya: 'LYDIA_LION_HEAD',   // 吕底亚·狮首
    // ── 2026-10-25 第五批新增史实纹章（14 种）────────────────────────────────
    sanfoqi: 'SRIVIJAYA_SHIP',   // 三佛齐·双帆海船
    medang: 'CANDI_TOWER',   // 马打蓝·坎蒂塔
    malacca: 'MALACCA_BANDS',   // 满剌加·条纹新月
    qimu: 'CHIMU_MOON',   // 奇穆·月
    muisca: 'MUISCA_RAFT',   // 穆伊斯卡·金筏
    manding: 'MALI_LION',   // 马里·狮与战鼓
    kapaduoxiya: 'CAPPADOCIA_LION',   // 卡帕多细亚·狮
    fulijiya: 'PHRYGIAN_CAP',   // 弗里吉亚·弗里吉亚帽
    pajiama: 'ASCLEPIUS_STAFF',   // 帕加马·蛇杖
    bendou_d: 'PONTUS_STAR_CRESCENT',   // 本都·星月
    fulandesi: 'ARTOIS_TOWER_LILY',   // 阿图瓦·塔与百合
    puluowangsi: 'PROVENCE_BARS',   // 普罗旺斯·条纹
    // ── 2026-10-25 第六批新增史实纹章（10 种）────────────────────────────────
    sailiugu: 'SELEUCID_ANCHOR',   // 塞琉古·船锚
    tuolemi: 'PTOLEMAIC_EAGLE',   // 托勒密·鹰踏闪电
    ansxi: 'PARTHIAN_ARCHER',   // 安息帝国·弓与箭袋
    kanata: 'VARAHA_BOAR',   // 维查耶纳伽尔·野猪（Varaha）
    pandiya: 'PANDAYA_FISH',   // 潘地亚·双鱼
    sengjialuo: 'SINHALA_LION',   // 僧伽罗·狮持剑
    abasi: 'ABBASID_STANDARD',   // 阿拔斯·黑旗
    muwaxide: 'ALMOHAD_LATTICE',   // 穆瓦希德·格纹
    taimier: 'MARATHA_PENNANT',   // 马拉塔·三角旗
    aswaka: 'ASVAKA_HORSE',   // 阿斯瓦卡·马
    // ── 2026-10-25 第七批（最后一批）新增史实纹章（4 种）──────────────────────
    maidina: 'RASHIDUN_EAGLE',   // 拉希顿·黑鹰旗（Uqab）
    shunga: 'TRIRATNA',   // 巽伽·三宝（triratna）
    boluo: 'DHARMA_WHEEL12',   // 波罗帝国·十二辐法轮
    ahaomu: 'AHOM_ELEPHANT',   // 阿豪姆·象
    // ── 2026-10-26 西方势力史实纹章补绘（14 家）────────────────────────────
    lagoniya: 'SPARTA_LAMBDA',   // 斯巴达·Λ（前5世纪拉刻岱蒙盾饰文献）
    boootiya: 'THEBES_BOEOTIAN_SHIELD',   // 底比斯·波俄提亚盾（城邦钱币主纹）
    buni: 'CARTHAGE_TANIT',   // 迦太基·塔尼特符（还愿碑）
    talanduo: 'TARENTUM_DOLPHIN',   // 塔兰托·海豚骑者（城邦钱币）
    danmai: 'DENMARK_CROSS',   // 丹麦·Dannebrog偏杆侧北欧十字
    asikanani: 'BRANDENBURG_EAGLE',   // 勃兰登堡藩侯国·红鹰（无普鲁士王冠）
    wende: 'SAXONY_CRANCELIN',   // 萨克森·横条与斜贯菱环
    pufaerci: 'PALATINATE_LION',   // 普法尔茨·戴冠狮
    habusibao: 'HABSBURG_EAGLE',   // 哈布斯堡·皇帝双头鹰与奥地利盾心
    xibanya: 'SPAIN_PILLARS',   // 西班牙·海格力斯双柱（卡洛斯一世）
    jiaohuangguo: 'PAPAL_KEYS',   // 教皇国·圣彼得交叉钥匙
    yidali_wangguo: 'ITALY_SAVOY',   // 意大利王国·萨伏伊十字盾与王冠
    xilawangguo: 'GREECE_CROWNED_CROSS',   // 希腊王国·希腊十字与王冠
    // ── 2026-10-26 西方势力史实纹章第二批（14 家）─────────────────────────
    meikelunbao: 'MECKLENBURG_BULL',   // 梅克伦堡·牛头（约1200年钱币、尼古劳斯1219—1255年印章）
    jileinaijia: 'CYRENE_SILPHIUM',   // 昔兰尼·罗盘草（前525—480、前435—375年钱币）
    aboerleiya: 'ARBOREA_TREE',   // 阿尔博雷亚·拔根树（马里亚诺四世1353年国徽）
    saipulusi: 'CYPRUS_LUSIGNAN',   // 塞浦路斯·吕西尼昂横条底戴冠跃狮（14世纪钱币与纹章书）
    donggete: 'THEODORIC_MONOGRAM',   // 东哥特·狄奥多里克王室花押（493—526年银币）
    xigete: 'VISIGOTH_VOTIVE_CROSS',   // 西哥特·瓜拉萨宝藏王室还愿十字架（7世纪托莱多出土，Cruz visigoda）
    nasier: 'NASRID_SHIELD',   // 纳斯尔·盾与铭文斜带（阿尔罕布拉宫及13—15世纪器物）
    kaliya: 'CARIA_LABRYS',   // 卡里亚·双刃斧（赫卡托姆尼德王朝宙斯·拉布劳恩多斯钱币）
    sesali: 'THESSALY_HORSE',   // 色萨利·马与狮首喷泉（斐莱城邦前480—400年钱币，非伊阿宋个人徽章）
    bosi_puluosi: 'BOSPORUS_PAN',   // 博斯普鲁斯·潘神头（潘提卡帕翁前4世纪钱币）
    yadian_gongguo: 'ATHENS_LA_ROCHE',   // 雅典公国·德拉罗什五红四点纹章
    shiwaben: 'SWABIA_LIONS',   // 施瓦本·霍亨斯陶芬三狮（菲利普1197年印章）
    jialixiya: 'GALICIA_LION',   // 加利西亚—沃伦·狮（14世纪上半叶地域标志）
    // ── 2026-10-26 日本史实家纹补绘（5 家）────────────────────────────────
    uesugi: 'UESUGI_SASA',   // 上杉·竹轮笹叶对雀（《见闻诸家纹》）
    utsunomiya: 'UTSUNOMIYA_TOMOE',   // 宇都宫·右三巴（《见闻诸家纹》，与琉球左三巴分开）
    shoni: 'SHONI_MEYUI',   // 少弐·寄悬目结（《蒙古袭来绘词》军旗、《见闻诸家纹》）
    kakizaki: 'MATSUMAE_WARBISHI',   // 松前·丸内割菱（四割菱加外圆，非武田菱）
    so: 'SO_YOTSUME',   // 对马宗氏·隅立四目结（小孔径四目结，非少弐寄悬目结）
    // ── 2026-10-26 大势力史实旗面第一批（7 家）────────────────────────────
    safawei_d: 'SAFAVID_LION_SUN',   // 萨法维·狮日（阿拔斯大帝时期波斯标志，不画后世佩剑）
    womaya: 'UMAYYAD_WHITE_STANDARD',   // 倭马亚·白旌（矩形白旗，不添后世新月或国徽）
    yashu: 'ASSYRIAN_LAMASSU',   // 亚述·人首翼牛拉玛苏（新亚述王宫守卫像）
    jiazini: 'GHAZNAVID_LION',   // 伽色尼·行狮（狮旗，不与萨法维狮日混用）
    jialedi: 'BABYLON_MUSHHUSHSHU',   // 迦勒底·穆什胡舒龙（新巴比伦伊什塔尔门）
    hantawadi: 'HANTHAWADDY_HAMSA',   // 汉达瓦底·金色Hintar/Hamsa神鸟
    tiemuer: 'TIMURID_ANNULETS',   // 图兰（帖木儿）·三环三角（钱币与克拉维霍使节记载）
    // ── 2026-10-26 大势力史实旗面第二批（3 家）────────────────────────────
    guishuang: 'KUSHAN_KANISHKA_TAMGA',   // 贵霜·迦腻色迦四叉塔木加（同期钱币与玛瑙印章）
    xibolai: 'ISRAEL_HASMONEAN_MENORAH',   // 以色列·七枝圣殿灯台（哈斯蒙尼王安提柯二世前40—37年钱币）
    // ── 2026-10-26 大势力史实旗面第三批（3 家）────────────────────────────
    konbaung: 'KONBAUNG_PEACOCK',   // 贡榜·开屏孔雀（晚期王令国印；王室专用纹饰与19世纪旗帜）
    sijitai: 'SCYTHIAN_KUL_OBA_STAG',   // 斯基泰·库尔奥巴金鹿（前5—前4世纪盾饰／弓囊饰，蜷腿回环鹿角）
    piketai: 'PICTISH_CRESCENT_VROD',   // 皮克特·新月与V形杖（6—9世纪本文化符号石最常见专属符号）
    // ── 2026-10-26 大势力史实旗面第四批（2 家；萨珊撤销无专属依据日盘）────────
    heti: 'HITTITE_ROYAL_WINGED_SUN',   // 赫梯·王印翼日盘与大王符号（苏庇路里乌玛一世及后继者王印）
    kesa: 'KHAZAR_COIN_TAMGA',   // 可萨·枝形塔木加（837／838年特别钱币，非留里克三叉戟）
    // ── 2026-10-26 大势力史实旗面第五批（3 家）────────────────────────────
    nabatai: 'NABATAEAN_CROSSED_CORNUCOPIAE',   // 纳巴泰·交叉双丰饶角（阿雷塔斯四世与沙盖拉特、拉贝尔二世钱币）
    aiji: 'EGYPT_SEDGE_AND_BEE',   // 埃及·莎草与蜂（法老 nswt-bjtj 王号，上下埃及王权）
    wulaertu_guo: 'URARTU_SARDURI_SHIELD',   // 乌拉尔图·三环狮牛仪仗盾（萨尔杜里二世王盾）
    // ── 2026-10-26 大势力史实旗面第六批（3 家；穆拉比特承袭阿拔斯黑旗、非专属，保留字旗）──
    falanji: 'FRANKS_CHILDERIC_BEE',   // 法兰克·希尔德里克一世王墓金蜂饰（约458—481年，墨洛温王室）
    xiongnu: 'XIONGNU_EAGLE_CROWN',   // 匈奴·阿鲁柴登鹰顶金冠（立鹰、半球冠顶与冠带）
    yilihanguo_d: 'ILKHANID_HULEGU_HARE',   // 伊利汗国·旭烈兀伊尔比尔铜币的奔兔踏月（Album 2125.2）
    // ── 2026-10-26 大势力史实旗面第七批（3 家；甘丹无可靠专属图案，保留字旗）──
    kaerka: 'KHALKHA_SOYOMBO',   // 喀尔喀·索永布（札那巴札尔1686年创制；1911年博克多汗国旗）
    tubo: 'TIBETAN_ROYAL_TOMB_LION',   // 吐蕃·琼结藏王陵蹲坐石狮（7—9世纪王陵实物，非后世雪狮旗）
    kuman_oleshky: 'CUMAN_STONE_BABA',   // 库曼·12世纪草原石雕（尖帽、捧杯祖先像，非格莱塔木加）
    // ── 2026-10-26 大势力史实旗面第八批（4 家）────────────────────────────
    aiaoniya: 'IONIA_EPHESUS_BEE',   // 爱奥尼亚·以弗所蜜蜂（前6—前4世纪城邦钱币，四翼俯视形制）
    hansa: 'HANSEATIC_COG',   // 汉萨·柯克船（汉萨城市印章与纹章；单桅方帆、首尾楼、搭接船板）
    feilisidin: 'PHILISTINE_FEATHERED_CAP',   // 非利士·羽冠（拉美西斯三世麦迪奈特·哈布浮雕的Peleset战士）
    arakan: 'ARAKAN_TRIPARTITE_SRIVATSA',   // 阿拉干·三瓣室利筏娑（本地钱币双菱中柱与外卷侧枝）
    // ── 2026-10-26 大势力史实旗面第九批（2 家；米底证据不足，保留字旗）──
    zhelouqi: 'CHAHAMANA_AJAYARAJA_LAKSHMI',   // 乔汉·阿阇耶罗阇银币四臂拉克什米结跏坐像（1110—1125年，Mitch NI 456）
    adile: 'ADIL_SHAHI_DOTTED_LEAF',   // 阿迪勒·穆罕默德·阿迪勒·沙阿第四系列点叶纹铜币（1627—1656年，G&G BJ32）
    // ── 2026-10-26 大势力史实旗面第十批（2 家；萨法尔、伊德里斯仅见铭文币，保留字旗）──
    dulan_d: 'DURRANI_ABDALI_WHEAT_SWORD',   // 杜兰尼·阿卜达利旗麦穗、剑与星（Adamec《阿富汗历史词典》p.147；麦穗亦见艾哈迈德·沙加冕传统）
    pagan: 'PAGAN_ANAWRAHTA_VOTIVE_SEAL',   // 蒲甘·阿奴律陀供养佛牌触地印佛陀、摩诃菩提式塔刹伞盖与两侧小塔（1044—1077年，图32）
    // ── 2026-10-26 大势力史实旗面第十一批（3 家；乌兹别克仅见无史料说明的现代旗图，保留字旗）──
    paermila: 'PALMYRA_ZENOBIA_CRESCENT_BUST',   // 帕尔米拉·芝诺比娅戴冠披衣右向胸像与新月（271—272年安条克币，RIC V.2）
    jieri: 'HARSHA_FAN_TAILED_PEACOCK',   // 戒日·扇尾孔雀银德拉克马（606—647年，铭文 Sri Siladitya）
    jiashi_d: 'KASHI_SCYPHATE_WHORLS',   // 迦尸·碟形银币ABBC四涡纹打印记（约前400—前350年，Rajgor 708）
    // ── 2026-10-26 大势力史实旗面第十二批（14 家）───────────────────────────
    gurjara: 'GURJARA_PRATIHARA_ADIVARAHA',   // 瞿折罗·人猪身Varaha（850—900年Adivaraha银币）
    qiajia: 'QAJAR_LION_SUN_SWORD',   // 恺加·立狮持剑与升日（卡扎尔王室标志，区别于萨法维无剑狮日）
    luomu: 'RUM_KUBADABAD_EAGLE',   // 罗姆·库巴达巴德宫双头鹰（1220年代王宫砖饰）
    shahi: 'SHAHI_RECUMBENT_NANDI',   // 沙希·卧瘤牛、鞍布与臀部三叉记（jital银币）
    antigonid: 'ANTIGONID_PAN_SHIELD',   // 安提柯·潘神马其顿盾与弯月星纹（戈纳塔斯钱币）
    gesake: 'ZAPOROZHIAN_HOST_SEAL',   // 哥萨克·1595年扎波罗热军团印的肩枪哥萨克
    yilisi: 'ELIS_EAGLE_THUNDERBOLT',   // 埃利斯·立鹰与带翼雷电（奥林匹亚城邦钱币正反面）
    kanan: 'TYRE_EAGLE_PROW_PALM',   // 迦南·推罗城邦银币的鹰立船首与肩后棕榈枝
    meitai: 'MANIPUR_PAKHANGBA_PAPHAL',   // 曼尼普尔·宁图贾王室Pakhangba盘龙结
    pyu: 'PYU_SRI_KSETRA_SRIVATSA',   // 骠族·室利世固银币的室利筏娑、日月、海螺与金刚杵
    pusikefu_gongheguo: 'PSKOV_DOVMONT_LEOPARD',   // 普斯科夫·多夫蒙特时期钱币猛兽（1425—1510年，非现代州徽）
    ouka: 'RYAZAN_FYODOR_TAMGA',   // 梁赞·费奥多尔·奥利戈维奇钱币的双卷羊首形王室塔木加
    sumeier: 'URUK_INANNA_REED_POST',   // 苏美尔·乌鲁克花瓶与印章的伊南娜芦苇环柱
    // ── 2026-10-26 大势力史实旗面第十三批（7 家）───────────────────────────
    weijing_york: 'JORVIK_RAVEN_PENNY',   // 约维克·939—941年约克乌鸦便士（左向头、正面展翼与扇形尾）
    yada: 'HEPHTHALITE_S2_TAMGA',   // 嚈哒·帝国时期钱币S2塔木加（中央圆环、双外卷叉与弯干）
    lagusa: 'RAGUSA_ST_BLAISE',   // 拉古萨·1358—1808年圣布莱斯旗（主教冠、祝福手、牧杖与城市模型）
    yipilusi: 'EPIRUS_PYRRHUS_THUNDERBOLT',   // 伊庇鲁斯·皮洛士前278年叙拉古铜币的横向带翼雷电
    mojietuo: 'MAGADHA_KARSHAPANA_PUNCHMARKS',   // 摩揭陀·早期打印记银币五印记组合（太阳、六臂印、兽印与几何印）
    lancang: 'LAN_XANG_ELEPHANT_PARASOL',   // 澜沧·建国称号“百万大象与白伞王国”的单头立象与王室白伞
    huarazim: 'KHWARAZM_MUHAMMAD_HORSEMAN',   // 花剌子模·沙阿摩诃末吉塔尔银铜币的右向持矛突骑（1200—1220年，Tye 212 / Album 1723）
    // ── 2026-10-29 大势力史实旗面第十四批（18 家）──────────────────────────
    sashan: 'SASANIAN_ATASHDAN',   // 萨珊帝国·沙普尔一世至库思老二世银德拉克马背面的三阶拜火圣坛（Atashdan）与圣火
    tujue: 'GOKTURK_ASHINA_IBEX_TAMGA',   // 突厥汗国·阙特勤碑与毗伽可汗碑额正中的阿史那王室盘角羱羊塔木加
    sogdian: 'SAMARQAND_IKHSHID_TAMGA',   // 粟特（康国）·撒马尔罕伊赫什德王朝铜币正中的圆环三叉王室塔木加
    yanda: 'ALCHON_S1_BULL_CRESCENT_TAMGA',   // 白匈奴（阿尔洪）·头罗曼与摩醯逻矩罗银币正面的S1新月托双枝心形塔木加
    huluo: 'GHURID_MUIZZ_HORSEMAN_STAR',   // 古尔王朝·穆伊兹丁吉塔尔银铜币（Tye 185）正面的左向疾驰战马与六芒星印
    kala: 'KARAKHANID_BOW_TREFOIL_TAMGA',   // 喀喇汗国·11世纪费尔干纳与喀什噶尔铜币中央的三叶结与反曲弓矢塔木加
    ailan: 'ELAM_SUSA_HORNED_SERPENTS',   // 埃兰王国·苏萨出土王室滚筒印章与青铜礼器的对称交缠双有角龙蛇（Inshushinak圣兽）
    wuer: 'UR_NAMMU_NANNA_CRESCENT_SUN',   // 乌尔第三王朝·乌尔纳姆石碑顶部的月神南纳仰月舟托八芒星盘
    xikesuosi: 'HYKSOS_APOPHIS_SCARAB_SEAL',   // 喜克索斯·第十五王朝阿波菲斯与希安王印的圣甲虫（Khepri）高举日盘纹
    suzidaer: 'SUZDAL_VLADIMIR_CROWNED_LION',   // 苏兹达尔·弗拉基米尔圣德米特里大教堂浮雕与大公印章的戴冠持十字杖行狮
    dalriada: 'DALRIADA_DUNADD_TRISKELE_CROSS',   // 达尔里阿达·王都敦阿德（Dunadd）与阿尔巴石刻的凯尔特三旋涡纹十字圆盘
    seleisi: 'ODRYSIAN_SEUTHES_STAR_WREATH',   // 色雷斯（奥德里西亚）·塞乌特斯三世钱币的橡叶王冠花环与中央八芒星
    damolaweiya: 'GREAT_MORAVIA_MIKULCICE_FALCON',   // 大摩拉维亚·米库尔奇采（Mikulčice）王室镀金饰章的展翅猎鹰（Sokol）
    champa: 'CHAMPA_MY_SON_TRISHULA',   // 占婆·美山圣地（Mỹ Sơn）王室浮雕与金印的湿婆火焰三叉戟配莲座
    dongxu: 'TAUNGOO_SUN_PEACOCK',   // 东吁王朝·光芒日轮环抱左向昂首跃立孔雀（区别于贡榜正面开屏孔雀）
    talasike: 'TARASCAN_IRECHEKWA_AXE_SUN',   // 塔拉斯科·米却肯纯佩查王室T形青铜仪式钺（Tajadera）叠嵌太阳神盘
    imagawa: 'IMAGAWA_AKADORI_HIKIRYO',   // 今川氏·《见闻诸家纹》足利一门今川氏丸内二引两家纹
    // ── 2026-11-13 多字势力图标化第十六批（17 家，消除截断二字旗）──────────────────
    liangxixili: 'TWO_SICILIES_LESSER_ARMS',   // 两西西里·波旁两西西里王徽小纹章
    epirus_despotate: 'EPIRUS_EAGLE',   // 伊庇鲁斯专制国·拜占庭科穆宁-杜卡斯金鹰
    latin_empire: 'LATIN_EMPIRE_CROSS',   // 拉丁帝国·君士坦丁堡四角小十字金十字
    anjou: 'ANJOU_FLEUR',   // 安茹王朝·卡佩安茹双百合与红色标签
    pisa: 'PISA_CROSS',   // 比萨共和国·比萨十二尖十字
    florence: 'FLORENCE_GIGLIO',   // 佛罗伦萨共和国·佛罗伦萨红百合
    gallic_empire: 'GALLIC_EMPIRE_HELM',   // 高卢帝国·波斯图穆斯罗马高卢战冠战盔
    mulabite: 'ALMORAVID_BANNER',   // 穆拉比特王朝·柏柏尔双刃剑与圣战新月
    aq_qoyunlu: 'AQ_QOYUNLU_TAMGA',   // 白羊王朝·土库曼巴扬杜尔部白羊图腾塔木加
    barakzai_afghan: 'AFGHAN_BARAKZAI_GATE',   // 巴拉克宰王朝·阿富汗清真寺拱门与双战旗
    zand_dynasty: 'ZAND_SUN_SWORD',   // 赞德王朝·波斯金日与舍施尔弯刀
    jinong: 'TOLEDO_DHUNNUN_STAR',   // 济农王朝·安达卢斯托莱多八角星印徽
    kilwa: 'KILWA_COIN_GEOMETRY',   // 基尔瓦苏丹国·斯瓦希里海皇金币八角几何徽
    mombasa: 'MOMBASA_DHOW_DAGGERS',   // 蒙巴萨苏丹国·东非达乌帆船与交错弯刀
    pattani: 'PATTANI_CANNON_CRESCENT',   // 北大年苏丹国·马来青铜大炮与星月
    hulumusi: 'HORMUZ_CARAVEL',   // 忽鲁谟斯·霍尔木兹大帆船
    aizu_ashina: 'ASHINA_MITSU_HIKIRYO',   // 会津芦名家·芦名氏家纹「丸之内三引两」
};

/** 该势力是否走图案旗号；返回 null = 照旧画汉字。 */
export function getFactionEmblemKey(factionId: string): string | null {
    if (!factionId) return null;
    return FACTION_EMBLEM[factionId] ?? null;
}

