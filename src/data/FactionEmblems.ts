/**
 * 旗号图案（纹章/徽记）试水表 —— 2026-10-24 主人「要不改一下试试，不行再次换回来」
 *
 * 只给**非东亚汉字圈**势力登记图案：旗面不再画「托勒」「塞琉」这种两字截断音译。
 * 日本另走家纹（kamon）旗：战国武士本就用家纹指物旗（2026-10-24 主人「日本的呢」）。
 * 图案来源，统一烘成 `public/emblem-flags/{KEY}_{w|b}.png`（4帧×6朝向雪碧图）：
 *   · ICON：game-icons.net 现成单色图标（CC BY 3.0，署名见 docs/02-design/旗号图案-图标素材来源.md）
 *   · HAND：手绘粗线条符号（`scratch/_emblem_symbols.py`，自绘无版权问题）
 *   · KAMON：日本家纹手绘（`scratch/_kamon_symbols.py`，按各家史实家纹，自绘无版权问题）
 * 烘焙：`scratch/_bake_emblem_sprites.py`。
 *
 * 回退：删掉本表条目 = 该势力立刻回汉字旗号；整表清空 = 全部回汉字。
 * 汉字文化圈（中国各朝/朝鲜/越南/吐蕃/契丹/女真…）**不登记**，照旧用旗号汉字；
 * 日本各家登记家纹（上杉/大友/宇都宫/龙造寺/南部/少弐/松前/对马/伊贺/一向宗/琉球 家纹难画或史实吃不准，仍用汉字）。
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
    kongque: 'CARTWHEEL',   // 孔雀帝国·法轮
    zhuluo: 'TIGER',   // 朱罗·虎
    menggu_d: 'TAMGA',   // 蒙古·塔木加
    kushi: 'PYRAMID',   // 库施·金字塔
    aqimeinide: 'WINGED_SUN',   // 阿契美尼德·翼日盘
    sashan: 'HERALDIC_SUN',   // 萨珊·日盘
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
    keluodiya: 'CROATIA_CHECKER',   // 克罗地亚·红白棋盘（šahovnica）
    litaowan: 'LITHUANIA_VYTIS',   // 立陶宛·Vytis 骑士
    luosi: 'RURIK_TRIDENT',   // 罗斯·留里克三叉戟
    mosike_gongguo: 'MOSCOW_GEORGE',   // 莫斯公国·圣乔治屠龙
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
    tuosikana: 'TUSCANY_BALLS',   // 托斯卡纳·美第奇六球
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
    huohengsuolun: 'PRUSSIA_EAGLE',   // 勃兰登堡-普鲁士·王冠黑鹰与剑杖
    wende: 'SAXONY_CRANCELIN',   // 萨克森·横条与斜贯菱环
    pufaerci: 'PALATINATE_LION',   // 普法尔茨·戴冠狮
    habusibao: 'HABSBURG_EAGLE',   // 哈布斯堡·皇帝双头鹰与奥地利盾心
    xibanya: 'SPAIN_PILLARS',   // 西班牙·海格力斯双柱（卡洛斯一世）
    jiaohuangguo: 'PAPAL_KEYS',   // 教皇国·圣彼得交叉钥匙
    yidali_wangguo: 'ITALY_SAVOY',   // 意大利王国·萨伏伊十字盾与王冠
    xilawangguo: 'GREECE_CROWNED_CROSS',   // 希腊王国·希腊十字与王冠
};

/** 该势力是否走图案旗号；返回 null = 照旧画汉字。 */
export function getFactionEmblemKey(factionId: string): string | null {
    if (!factionId) return null;
    return FACTION_EMBLEM[factionId] ?? null;
}

