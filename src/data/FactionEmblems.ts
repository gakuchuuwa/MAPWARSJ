/**
 * 旗号图案（纹章/徽记）试水表 —— 2026-10-24 主人「要不改一下试试，不行再次换回来」
 *
 * 只给**非东亚汉字圈**势力登记图案：旗面不再画「托勒」「塞琉」这种两字截断音译。
 * 日本另走家纹（kamon）旗：战国武士本就用家纹指物旗（2026-10-24 主人「日本的呢」）。
 * 图案两种来源，统一烘成 `public/emblem-flags/{KEY}_{w|b}.png`（4帧×6朝向雪碧图）：
 *   · ICON：game-icons.net 现成单色图标（CC BY 3.0，署名见 docs/02-design/旗号图案-图标素材来源.md）
 *   · HAND：手绘粗线条符号（`scratch/_emblem_symbols.py`，自绘无版权问题）
 *   · KAMON：日本家纹手绘（`scratch/_kamon_symbols.py`，按各家史实家纹，自绘无版权问题）
 * 烘焙：`scratch/_bake_emblem_sprites.py`。
 *
 * 回退：删掉本表条目 = 该势力立刻回汉字旗号；整表清空 = 全部回汉字。
 * 汉字文化圈（中国各朝/朝鲜/越南/吐蕃/契丹/女真…）**不登记**，照旧用旗号汉字；
 * 日本各家登记家纹（上杉/大友/宇都宫/龙造寺/南部/少弐/松前/对马/伊贺/一向宗/琉球 家纹难画或史实吃不准，仍用汉字）。
 * ⚠ 试水版符号按文化圈分派、同圈共用（旗面色不同仍可分辨）；定稿前不得当正式旗号数据。
 */
export const FACTION_EMBLEM: Readonly<Record<string, string>> = {
    // ── 罗马与希腊 ──
    luoma_diguo: 'EAGLE',
    baizanting: 'BYZ_CROSS',
    lagoniya: 'SPARTAN_HELM',
    xila: 'OWL',           // 雅典娜猫头鹰（雅典）
    maqidun: 'SUN',        // 马其顿·维吉纳太阳
    tuolemi: 'SUN',
    sailiugu: 'SUN',
    antigonid: 'SUN',

    // ── 西欧／中欧 ──
    falanji: 'FLEUR',
    gaolu: 'FLEUR',
    bogendigongguo: 'FLEUR',
    yinggelan: 'LATIN_CROSS',
    wende: 'IRON_CROSS',
    tiaodun_qishi: 'IRON_CROSS',
    baojian_qishi: 'IRON_CROSS',
    huohengsuolun: 'IRON_CROSS',
    yelusalengwg: 'JERUSALEM_CROSS',
    shengdian_qishi: 'TEMPLAR_SHIELD',
    maerta_qishi: 'JERUSALEM_CROSS',
    bolan: 'SHIELD',
    litaowan: 'SHIELD',
    boximiya: 'SHIELD',
    mazhaer: 'SHIELD',
    xigete: 'SHIELD',
    donggete: 'SHIELD',
    kasidiliya: 'SHIELD',
    xibanya: 'SHIELD',
    alagong: 'SHIELD',
    jiatailuoniya: 'SHIELD',
    putaoya: 'SHIELD',
    puxiangyindu: 'SHIELD',
    fodejiao: 'SHIELD',
    xixiliwangguo: 'SHIELD',
    kelimiya: 'SHIELD',
    kelite: 'SHIELD',
    tuosikana: 'SHIELD',
    lunbadi: 'SHIELD',
    salai: 'SHIELD',

    // ── 北欧／不列颠／东欧 ──
    danmai: 'DRAKKAR',
    kaernute: 'DRAKKAR',
    nuowei: 'DRAKKAR',
    ruidian_si: 'DRAKKAR',
    weiershigongguo: 'LATIN_CROSS',
    bulietani: 'LATIN_CROSS',
    keernuwaye: 'LATIN_CROSS',
    piketai: 'LATIN_CROSS',
    scotland: 'LATIN_CROSS',
    dalriada: 'LATIN_CROSS',
    jialatai: 'LATIN_CROSS',
    luosi: 'BYZ_CROSS',
    mosike_gongguo: 'BYZ_CROSS',
    eluosi_diguo: 'BYZ_CROSS',
    damolaweiya: 'BYZ_CROSS',
    baojialiya: 'BYZ_CROSS',
    vidin_tsardom: 'BYZ_CROSS',
    baojiaer: 'TAMGA',     // 伏尔加保加尔：草原塔木加
    wulaertu: 'BYZ_CROSS',
    gelujiya: 'BYZ_CROSS',
    ethiopia: 'BYZ_CROSS',
    zhagewei: 'BYZ_CROSS',

    // ── 波斯／中亚 ──
    aqimeinide: 'HERALDIC_SUN',
    sashan: 'HERALDIC_SUN',
    safawei_d: 'HERALDIC_SUN',
    huarazim: 'HERALDIC_SUN',

    // ── 伊斯兰 ──
    maidina: 'CRESCENT',
    abasi: 'CRESCENT',
    ayoubu: 'CRESCENT',
    mamuluke: 'CRESCENT',
    womaya: 'CRESCENT',
    gulaishi: 'CRESCENT',
    osman: 'CRESCENT',
    seljuq: 'CRESCENT',
    luomu: 'CRESCENT',
    yidelisi: 'CRESCENT',
    mulabite: 'CRESCENT',
    muwaxide: 'CRESCENT',
    hamade: 'CRESCENT',
    aguelabu: 'CRESCENT',

    // ── 草原 ──
    menggu_d: 'TAMGA',     // 草原印记（蒙古/诸部）
    dzungar: 'TAMGA',
    khoshut: 'TAMGA',
    tuerhute: 'TAMGA',
    kaerka: 'TAMGA',
    tujue: 'TAMGA',
    tatar: 'TAMGA',
    jinzhang: 'TAMGA',
    kazakh: 'TAMGA',
    kuman_oleshky: 'TAMGA',
    kesa: 'TAMGA',
    xiongren: 'TAMGA',
    xiongnu: 'TAMGA',
    yada: 'TAMGA',

    // ── 非洲 ──
    manding: 'SNAKE',
    jienei: 'SNAKE',

    // ── 印度 ──
    kongque: 'CARTWHEEL',
    mowoer: 'CARTWHEEL',
    deli: 'CARTWHEEL',
    xike: 'CARTWHEEL',
    kanata: 'CARTWHEEL',
    taimier: 'CARTWHEEL',
    kalinga: 'CARTWHEEL',
    kosala: 'CARTWHEEL',
    shunga: 'CARTWHEEL',
    anga: 'CARTWHEEL',
    malli: 'CARTWHEEL',
    boluo: 'CARTWHEEL',
    gujarat: 'CARTWHEEL',
    gurjara: 'CARTWHEEL',
    pandiya: 'CARTWHEEL',
    bulu: 'CARTWHEEL',
    zhuluo: 'TIGER',       // 朱罗王朝·虎徽

    // ── 东南亚 ──
    malai: 'SAILBOAT',
    malacca: 'SAILBOAT',
    sanfoqi: 'SAILBOAT',
    manzheboyi: 'SAILBOAT',
    medang: 'SAILBOAT',
    sulu: 'SAILBOAT',
    ternate: 'SAILBOAT',
    minangkabau: 'SAILBOAT',
    chenla: 'PAGODA',
    miandian: 'PAGODA',
    pagan: 'PAGODA',
    konbaung: 'PAGODA',
    ava: 'PAGODA',
    hantawadi: 'PAGODA',
    arakan: 'PAGODA',

    // ── 美洲 ──
    aztec: 'PYRAMID',
    maya: 'PYRAMID',
    inca: 'SUN',
    muisca: 'SUN',
    mapuche: 'STAR7',
    tupi: 'FEATHER',
    tupinijin: 'FEATHER',
    // ── 日本（家纹旗）──
    oda: 'MOKKO',            // 织田木瓜
    toyotomi: 'KIRI',        // 丰臣五七桐
    tokugawa: 'AOI',         // 德川三叶葵
    takeda: 'TAKEDA_BISHI',  // 武田菱
    sanada: 'ROKUMONSEN',    // 真田六文钱
    shimazu: 'SHIMAZU_CROSS',// 岛津丸十字
    hojo: 'MITSUUROKO',      // 北条三鳞
    mori: 'ICHIMONJI',       // 毛利一文字三星
    ashikaga: 'HIKIRYO',     // 足利二つ引两
    imagawa: 'HIKIRYO',      // 今川二つ引两
    ouchi: 'OOUCHI_BISHI',   // 大内菱
    amago: 'YOTSUME',        // 尼子四目结
    chosokabe: 'KATABAMI',   // 长宗我部片喰
    genji: 'SASARINDO',      // 源氏笹龙胆
    genji_iyo: 'SASARINDO',  // 源氏·伊予同纹
    heishi: 'AGEHACHO',      // 平氏扬羽蝶
    nanchou: 'KIKU',         // 南朝菊纹
    date_d: 'SASA',          // 伊达仙台笹
    suwa_d: 'KAJI',          // 诹访梶叶
    fujiwara: 'FUJI',        // 奥州藤原下藤
    // ── 欧洲（扩编 2026-10-24）──
    aboerleiya: 'SHIELD',
    aiaoniya: 'SHIELD',
    amaniyake: 'FLEUR',
    aodesuosi: 'SHIELD',
    aquidan: 'LATIN_CROSS',
    asikanani: 'IRON_CROSS',
    bafaliya: 'IRON_CROSS',
    batawei: 'IRON_CROSS',
    bendou: 'BYZ_CROSS',
    boootiya: 'SHIELD',
    bosi_puluosi: 'TAMGA',
    bosiniya: 'BYZ_CROSS',
    bulabante: 'IRON_CROSS',
    daniebo: 'BYZ_CROSS',
    dasaleiti: 'SHIELD',
    didi: 'IRON_CROSS',
    fulandesi: 'FLEUR',
    gesake: 'BYZ_CROSS',
    habusibao: 'IRON_CROSS',
    hansa: 'SHIELD',
    jialixiya: 'BYZ_CROSS',
    jileinaijia: 'SHIELD',
    kaliya: 'SHIELD',
    keerjisi: 'BYZ_CROSS',
    keluodiya: 'BYZ_CROSS',
    lagusa: 'BYZ_CROSS',
    ldiya: 'SHIELD',
    leangongguo: 'SHIELD',
    maixiya: 'LATIN_CROSS',
    mangsite: 'LATIN_CROSS',
    meikelunbao: 'IRON_CROSS',
    moerdaweiya: 'BYZ_CROSS',
    nidelan: 'SHIELD',
    odrysian_late: 'SHIELD',
    ouka: 'BYZ_CROSS',
    pajiama: 'SHIELD',
    peilieya_gongguo: 'BYZ_CROSS',
    pomeilaniya: 'IRON_CROSS',
    pufaerci: 'IRON_CROSS',
    puluowangsi: 'FLEUR',
    pusikefu_gongheguo: 'BYZ_CROSS',
    qiernigeweifu_gongguo: 'BYZ_CROSS',
    ruishi: 'SHIELD',
    safuyi: 'SHIELD',
    saierweiya: 'BYZ_CROSS',
    samtskhe: 'BYZ_CROSS',
    seleisi: 'SHIELD',
    shiwaben: 'IRON_CROSS',
    sijitai: 'TAMGA',
    suzidaer: 'BYZ_CROSS',
    talanduo: 'SHIELD',
    teweier_gongguo: 'BYZ_CROSS',
    tuomengde: 'LATIN_CROSS',
    walajiyia: 'BYZ_CROSS',
    weijing_york: 'DRAKKAR',
    wulaertu_guo: 'BYZ_CROSS',
    xideweina: 'BYZ_CROSS',
    xierwan: 'BYZ_CROSS',
    yasuer: 'SHIELD',
    yilisi: 'SHIELD',
    yipilusi: 'SHIELD',

    // ── 草原/中亚（扩编 2026-10-24）──
    aertai: 'TAMGA',
    an: 'TAMGA',
    anushidgin: 'HERALDIC_SUN',
    ashide: 'TAMGA',
    ashina: 'TAMGA',
    badakhshan: 'HERALDIC_SUN',
    baidi: 'TAMGA',
    bayegu: 'TAMGA',
    buriat: 'TAMGA',
    choros: 'TAMGA',
    chuyue: 'TAMGA',
    dada_ming: 'TAMGA',
    dulan_d: 'HERALDIC_SUN',
    duolu: 'TAMGA',
    fanyanna: 'HERALDIC_SUN',
    gaoche: 'TAMGA',
    geluolu: 'TAMGA',
    guishuang: 'HERALDIC_SUN',
    hongirad: 'TAMGA',
    houliao: 'TAMGA',
    huite: 'TAMGA',
    huyan: 'TAMGA',
    jie: 'TAMGA',
    julushi: 'HERALDIC_SUN',
    juqu_d: 'TAMGA',
    kawusi: 'HERALDIC_SUN',
    keerkezi: 'TAMGA',
    kereyid: 'TAMGA',
    kumoxi: 'TAMGA',
    mamon: 'HERALDIC_SUN',
    mangshi: 'TAMGA',
    naiman: 'TAMGA',
    oirat_ming: 'TAMGA',
    ongut: 'TAMGA',
    qiepantuo: 'TAMGA',
    rouran: 'TAMGA',
    saman: 'HERALDIC_SUN',
    shatuo: 'TAMGA',
    sogdian: 'HERALDIC_SUN',
    sunite: 'TAMGA',
    suogediyana: 'HERALDIC_SUN',
    sute: 'HERALDIC_SUN',
    tiemuer: 'HERALDIC_SUN',
    tomara_gwalior: 'HERALDIC_SUN',
    tumed: 'TAMGA',
    wugu_d: 'TAMGA',
    wuhu: 'TAMGA',
    wusun: 'TAMGA',
    wuzhumuqin: 'TAMGA',
    xiajiasi: 'TAMGA',
    xianhai: 'TAMGA',
    xibo_d: 'TAMGA',
    xiemian: 'TAMGA',
    xierhe: 'TAMGA',
    xijue: 'TAMGA',
    xiliao: 'TAMGA',
    yanda: 'TAMGA',
    yidier: 'TAMGA',
    yilihanguo_d: 'HERALDIC_SUN',
    yuezhi: 'TAMGA',
    zhadalan: 'TAMGA',
    zhuerqi: 'TAMGA',
    zubu: 'TAMGA',

    // ── 近东/古典（扩编 2026-10-24）──
    adiyabeina: 'ZIGGURAT',
    aiji: 'ANKH',
    ailan: 'HERALDIC_SUN',
    ansxi: 'HERALDIC_SUN',
    antiaokegongguo: 'CRESCENT',
    aosiruowen: 'WINGED_SUN',
    bendou_d: 'SHIELD',
    buni: 'SAILBOAT',
    dedan: 'WINGED_SUN',
    emesene: 'WINGED_SUN',
    feilisidin: 'SAILBOAT',
    fulijiya: 'SHIELD',
    heti: 'WINGED_SUN',
    huluo: 'HERALDIC_SUN',
    jialedi: 'ZIGGURAT',
    jiazini: 'HERALDIC_SUN',
    kanan: 'SAILBOAT',
    kapaduoxiya: 'SHIELD',
    midi: 'HERALDIC_SUN',
    nabatai: 'WINGED_SUN',
    paermila: 'WINGED_SUN',
    saerbadaer: 'HERALDIC_SUN',
    saipulusi: 'SHIELD',
    sumeier: 'ZIGGURAT',
    teluoyi: 'SHIELD',
    wuer: 'ZIGGURAT',
    xibolai: 'STAR',
    xikesuosi: 'ANKH',
    xisi: 'HERALDIC_SUN',
    yashu: 'ZIGGURAT',

    // ── 印度（扩编 2026-10-24）──
    adile: 'CARTWHEEL',
    ahaomu: 'CARTWHEEL',
    aolisha: 'CARTWHEEL',
    aolitai: 'CARTWHEEL',
    aswaka: 'CARTWHEEL',
    jiashi_d: 'CARTWHEEL',
    jieri: 'CARTWHEEL',
    mallabhum: 'CARTWHEEL',
    mojietuo: 'CARTWHEEL',
    qutb_shahi: 'CARTWHEEL',
    sengjialuo: 'CARTWHEEL',
    shiyuzu: 'CARTWHEEL',
    suomunate: 'CARTWHEEL',
    zhelouqi: 'CARTWHEEL',

    // ── 东南亚（扩编 2026-10-24）──
    basha_d: 'PAGODA',
    chamorro: 'SAILBOAT',
    champa: 'PAGODA',
    dongxu: 'PAGODA',
    funan: 'PAGODA',
    jingpozu: 'PAGODA',
    luohu: 'PAGODA',
    maynila: 'SAILBOAT',
    meitai: 'PAGODA',
    mon: 'PAGODA',
    pyu: 'PAGODA',
    shuizhen: 'PAGODA',
    siam: 'PAGODA',
    taiyuan: 'PAGODA',
    voc: 'SAILBOAT',
    xingwei: 'PAGODA',

    // ── 美洲（扩编 2026-10-24）──
    aimala: 'SUN',
    cueva: 'SUN',
    gualani: 'FEATHER',
    naweierbuta: 'STAR',
    qimu: 'SUN',
    tailuona: 'SUN',
    taino_d: 'STAR',
    talasike: 'PYRAMID',
    tamoyue: 'FEATHER',
    teweierqie: 'STAR',
    tutul_xiu: 'PYRAMID',
    yilaka: 'SUN',
    yiluokui: 'FEATHER',

    // ── 美洲/殖民（扩编 2026-10-24）──
    foluolida: 'SHIELD',
    taino: 'SHIELD',
    xinfalanxi: 'FLEUR',
    xingelana: 'SHIELD',
    xinnidelan: 'SHIELD',
    xinxibanya: 'SHIELD',

    // ── 非洲（扩编 2026-10-24）──
    adal: 'CRESCENT',
    guanche: 'SUN',
    kushi: 'PYRAMID',
    nasier: 'CRESCENT',
    saimien: 'BYZ_CROSS',
    suosuo: 'SERPENT',
    zhayan: 'CRESCENT',

    // ── 杂项（扩编 2026-10-24）──
    chanka: 'SUN',

    // ── 日本（扩编 2026-10-24）──
    nanbu_shi: 'CRANE',
    otomo_d: 'KYOYO',
    ryukyu: 'TOMOE',
    uesugi: 'CHOU',
    utsunomiya: 'TOMOE',

};

/** 该势力是否走图案旗号；返回 null = 照旧画汉字。 */
export function getFactionEmblemKey(factionId: string): string | null {
    if (!factionId) return null;
    return FACTION_EMBLEM[factionId] ?? null;
}

