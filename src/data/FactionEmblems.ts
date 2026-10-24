/**
 * 旗号图案（纹章/徽记）试水表 —— 2026-10-24 主人「要不改一下试试，不行再次换回来」
 *
 * 只给**非东亚汉字圈**势力登记图案：旗面不再画「托勒」「塞琉」这种两字截断音译。
 * 图案两种来源，统一烘成 `public/emblem-flags/{KEY}_{w|b}.png`（4帧×6朝向雪碧图）：
 *   · ICON：game-icons.net 现成单色图标（CC BY 3.0，署名见 docs/02-design/旗号图案-图标素材来源.md）
 *   · HAND：手绘粗线条符号（`scratch/_emblem_symbols.py`，自绘无版权问题）
 * 烘焙：`scratch/_bake_emblem_sprites.py`。
 *
 * 回退：删掉本表条目 = 该势力立刻回汉字旗号；整表清空 = 全部回汉字。
 * 汉字文化圈（中国各朝/日本/朝鲜/越南/吐蕃/契丹/女真…）**不登记**，照旧用旗号汉字。
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
};

/** 该势力是否走图案旗号；返回 null = 照旧画汉字。 */
export function getFactionEmblemKey(factionId: string): string | null {
    if (!factionId) return null;
    return FACTION_EMBLEM[factionId] ?? null;
}

