/**
 * 主将队（第 10 队）—— 🔴 [2026-09-23 主人定，硬规定]
 *
 * 主人原话：「现在的军团都是9队阵型，我想添加一队，改为10队阵型。亚历山大可以用英雄·骑马亚历山大，
 *           hero_mounted_alexander这个素材。」「我现在说的才是硬规定。现在战略，战术都改为10队。」
 *
 * 10 队 = 编制 9 队（骑兵 / 步兵 / 远程三排，比例规则不变）+ **主将队 1 队**。
 *   · 位置：前排正中再往前 —— 全阵的矛头（亚历山大亲率伙伴骑兵冲在最前，维基百科 Battle of the Granicus「亲统右翼」）；
 *   · 兵种：主将有专属英雄素材（指定兵模）就用它；没有 → 用本军团配置的英雄主队；再没有 → 用本军团前排的兵种（主将亲兵出自前锋）。
 *   · 兵力：与其余 9 队一起平分全军兵力，军团总兵力不变。
 * 编制数据（各层军团表）一个字不改；第 10 队在展开编制时追加。据点城防不带主将，仍是 9 队。
 * 🔴 剧本模式：每个主角武将的主将队兵种在事件编辑器里**必选**（事件字段 commanderUnit），按素材样貌选、不看兵名。
 */
import { getScriptCommanderUnit } from '../events/scriptPeriod';

/** 武将 → 专属英雄兵种（WAR_TYPES 键）。只登记有现成素材的 */
export const GENERAL_HERO_UNITS: Readonly<Record<string, string>> = {
    // 中原/三国
    cao_d_caocao: 'hero_caocao',
    shu_liubei: 'hero_liubei',
    huizhou_zhugeliang: 'hero_zhugeliang',
    chu_guanyu: 'hero_guanyu',
    langzhou_zhangfei: 'hero_zhangfei',
    pizhou_lvbu: 'hero_lubu',
    ruzhou_sunjian: 'hero_sunjian',
    shanyue_sunce: 'hero_sunce',
    sunwu_d_sunquan: 'hero_sunquan',

    // 草原游牧
    menggu_d_chengjisihan: 'hero_genghiskhan',   // 2026-10-31 同人同兵模：原借用速不台，改用本人英雄·成吉思汗
    wuliangha_subutai: 'hero_subotai',
    xiongren_atila: 'hero_attila',
    gen_kotyan: 'hero_kotyankhan',
    gen_kuchlug: 'hero_kushluk',
    gen_girgen: 'hero_girgenkhan',
    // gen_qutlugh 已撤（2026-10-31 复核）：DE 的「英雄·忽都鲁」是 Qutlugh Nigar Khanum（巴布尔之母，卒 1505，女将），
    // 与本库费尔干纳的「忽都鲁」（1335–1385）不是一个人 → 回落军团默认主将兵模。

    // 希腊/马其顿
    gen_alexander_great: 'hero_mounted_alexander',
    gen_philip_ii: 'hero_macedonian_commander',
    gen_parmenion: 'hero_parmenion',
    gen_perdiccas: 'hero_perdiccas',
    gen_cleitus: 'hero_cleitus',
    gen_brasidas: 'hero_brasidas',
    gen_lysander: 'hero_lysander',
    gen_aristides: 'hero_aristides',
    gen_seuthes_iii: 'hero_thracian_chieftain',

    // 波斯
    gen_artaphernes: 'hero_artaphernes',
    gen_datis: 'hero_datis',
    // saman_yisimayi 已撤（2026-10-31 复核）：萨曼王朝 伊斯玛仪（849–907）与萨法维「沙阿·伊斯玛仪」（1487–1524）不是一个人；
    // DE 的「英雄·亦思马因·波斯」（hero_ismail，战力 84）是萨法维沙阿的幼年版，同属萨法维，不能给萨曼 → 回落军团默认主将兵模。
    gen_thoros: 'hero_thoros',

    // 西欧
    gen_edward_longshanks: 'hero_edwardlongshanks',
    gen_william_wallace: 'hero_williamwallace',
    gen_joanofarc: 'hero_joanofarc',
    gen_john_fearless: 'hero_johnthefearless',
    gen_philip_good: 'hero_philipthegood',
    gen_bernard_armagnac: 'hero_bernardarmagnac',
    gen_ulrich_jungingen: 'hero_ulrichvonjungingen',
    gen_gilbert: 'hero_gilbertdeclare',
    gen_llywelyn: 'hero_llywelynapgruffydd',
    gen_dafydd: 'hero_dafyddapgruffydd',

    // 地中海
    gen_robert_guiscard: 'hero_robertguiscard',
    gen_bohemond: 'hero_bohemond',

    // 东欧斯拉夫蛮族
    gen_alaric: 'hero_alaric',
    gen_ataulf: 'hero_ataulf',
    gen_jadwiga: 'hero_jadwiga',
    gen_vytautas_great: 'hero_vytautasthegreat',
    gen_kestutis: 'hero_kestutis',
    gen_algirdas: 'hero_algirdas',
    gen_jan_zizka: 'hero_janzizka',
    gen_ivaylo: 'hero_ivaylo',

    // 中东/南亚/东南亚/非洲/美洲
    talike_talike: 'hero_tariqibnziyad',
    gen_osman_i: 'hero_osman',
    gen_bolusi: 'porus_elephant',
    zhuluo_lajialajia: 'hero_generalaraiyan',
    gen_gajah_mada: 'hero_gajahmada',
    leloi: 'hero_leloi',
    gen_dinhle: 'hero_dinhle',
    hantawadi_mangyinglong: 'bayinnaung_elephant',
    gen_dagnajan: 'dagnajan_elephant',
    gen_gidajan: 'hero_gidajan',
    gen_yodit: 'hero_yodit',
    gen_sundjata: 'hero_sundjata',
    gen_sumanguru: 'hero_sumanguru',
    gen_pachacuti: 'hero_pachacuti',
    gen_pacanchiq: 'hero_pacanchique',
    gen_lautaro: 'hero_lautaro',
    gen_galvarino: 'hero_galvarino',
    gen_guacolda: 'hero_guacolda',
    gen_arariboia: 'hero_arariboiamelee',
    gen_cunhambebe: 'hero_cunhambebe',
    // 2026-10-05 主人令「英雄对齐游戏中的英雄」：游戏里同名武将直接用同名英雄
    gelujiya_tamaer: 'hero_tamar',
    qincha_baqiman: 'hero_cumanchief',
    aiaoniya_alisita: 'hero_aristagoras',
    gen_jogaila: 'hero_jogaila',
    // nuowei_halaer 已撤（2026-10-31）：DE 的「哈拉尔」＝哈拉尔·哈德拉达（1015–1066，青年版），
    // 与库内挪威「哈拉尔」（850–933，美发王）不是一个人 → 回落军团默认主将兵模。

    // 🔴 [2026-10-31 主人令「游戏中的武将战术模式登场的时候，请使用与自己相同的兵模作为主将队。
    //    如果有重复的兵模，例如亚历山大有骑马的和步兵的，骑兵类优先，战力高的优先」]
    //    逐个核对 218 个英雄兵模与 1675 名武将，只登记**同一个人**（同名异人不登记，如 腓特烈二世≠巴巴罗萨、
    //    曼萨·穆萨≠穆萨·伊本·奴萨尔、大流士三世≠大流士一世、奥斯曼·巴巴罗萨≠腓特烈·巴巴罗萨）；船形英雄
    //    （李舜臣龟船、莱夫·埃里克松长船、尼阿库斯旗舰）按 §3.4 不用。
    //    同一人有多个兵模时：骑兵优先，同类取战力高（熙德取骑马坎培多尔、地米斯托克利取骑马版、伊斯玛仪取沙阿版 201>84）。
    //    对照底账：scratch/_hero_general_match_20261031.txt
    gen_artemisia: 'hero_artemisia',
    gen_roger_i: 'hero_rogerbosso',              // 罗杰一世（博索）
    gen_leonidas: 'hero_leonidas',
    gen_theodoric_great: 'hero_theodoricthegoth',
    gen_el_cid: 'hero_elcidcampeador',           // 骑马版（cav 217）优先于步战熙德
    bfe2_cleon: 'hero_cleon',
    gen_themistocles: 'hero_themistocles',       // 战力 281 > 步战版 211
    gen_miltiades: 'hero_miltiades',
    gen_henry_v: 'hero_henryv',
    mazhaer_bela_iv: 'hero_belaiv',
    gen_charles_martel: 'hero_charlesmartel',
    gen_charlemagne: 'hero_charlemagne',
    bfe_sigismund: 'hero_emperorsigismund',
    weihaiwei_sudingfang: 'hero_sudingfang',
    jingmen_zhaoyun: 'hero_zhaoyun',
    bfe3_71: 'hero_yuanshao',
    lushui_dongzhuo: 'hero_dongzhuo',
    dongxu_mangruiti: 'hero_tabinshwehti',
    gen_wang_tong: 'hero_wangtong',
    jiujiang_zhouyu: 'hero_zhouyu',
    gen_mustafa_pasha: 'hero_mustafapasha',
    aqimeinide_daliushi: 'hero_darius',          // 大流士一世（DE 大流士＝马拉松时代）
    gen_ibrahim_lodi: 'hero_ibrahimlodi',
    babuer_babuer: 'hero_babur',                 // 战力 163 > 年轻的巴布尔 117
    gen_mihirabhoja: 'hero_mihirabhoja',
    owari_zhitianxinchang: 'hero_nobunaga',
    zhelouqi_puliteweilajie: 'hero_prithviraj',
    wende_heinrich_loewe: 'hero_henrythelion',
    baizanting_belisarius: 'hero_belisarius',
    gen_vlad_impaler: 'hero_vladdracula',
    yilihanguo_yisimeier: 'hero_shahismail',     // 萨法维 伊斯玛仪一世（沙阿版 201 > 幼年版 hero_ismail 84）
    zhuluo_lajindela: 'hero_rajendrachola',

    // 2026-10-31 复核补登（同一人、有本人兵模、原来漏登）
    ayoubu_salaheding: 'hero_saladin',           // 萨拉赫丁（1138–1193·大马士革）＝萨拉丁
    gen_black_prince: 'hero_theblackprince',     // 黑太子爱德华（阿基坦·波尔多）
    tiemuer_tiemuer: 'hero_tamerlane',           // 帖木儿（1336–1405·撒马尔罕）
    an_xibanni: 'hero_shaybanikhan',             // 昔班尼（1451–1510·布哈拉）
    gen_alexander_nef: 'hero_alexandernevski',   // 涅夫斯基（1221–1263·拉多加）
    gen_mikhail_tver: 'hero_mikhailoftver',      // 特维尔亲王米哈伊尔（1271–1318·特维尔）

    // 2026-10-31 补将：DE 人物兵模逐个配上本人武将
    yinggelan_lionheart: 'hero_richardthelionheart',
    yinggelan_henryii: 'hero_henryii',
    yinggelan_clare: 'hero_richarddeclare',
    yinggelan_fastolf: 'hero_sirjohnfastolf',
    weiershi_arthur: 'hero_kingarthur',
    yinggelan_lancelot: 'hero_lancelot',
    yinggelan_gawain: 'hero_gawain',
    weiershi_mordred: 'hero_mordred',
    yinggelan_tristan: 'hero_tristan',
    yinggelan_robinhood: 'hero_robinhood',
    yinggelan_littlejohn: 'hero_littlejohn',
    yinggelan_nottingham: 'hero_sheriffofnottingham',
    yinggelan_friartuck: 'hero_friartuck',
    yinggelan_aethelfrith: 'hero_aethelfrith',
    yinggelan_tostig: 'hero_tostig',
    gaolu_conqueror: 'hero_williamtheconqueror',
    gaolu_roland: 'hero_roland',
    gaolu_reynald: 'hero_reynalddechatillon',
    gaolu_lahire: 'hero_lahire',
    gaolu_alencon: 'hero_dukedalencon',
    amaniyake_bernard: 'hero_bernardarmagnac',
    gaolu_bertrand: 'hero_sieurbertrand',
    gaolu_demetz: 'hero_sieurdemetz',
    gaolu_josselyne: 'hero_guyjosselyne',
    gaolu_graville: 'hero_lorddegraville',
    gaolu_richemont: 'hero_constablerichemont',
    nuowei_hardrada: 'hero_haraldhardrada',
    nuowei_erikred: 'hero_erikthered',
    nuowei_hrolf: 'hero_hrolftheganger',
    nuowei_ulf: 'hero_ulf',
    nuowei_halldor: 'hero_halldor',
    nuowei_kalf: 'hero_kalfarnason',
    nuowei_finn: 'hero_finnarnason',
    nuowei_einar: 'hero_einarpaunchshaker',
    kasidiliya_alfonso: 'hero_kingalfonso',
    kasidiliya_sancho: 'hero_kingsancho',
    xibanya_orellana: 'hero_franciscodeorellana',
    xibanya_gonzalo: 'hero_gonzalopizarro',
    yuenan_lelai: 'hero_lelai',
    yuenan_letrien: 'hero_letrien',
    yuenan_luunhanchu: 'hero_luunhanchu',
    yuenan_buibi: 'hero_buibi',
    chenla_suryavarman: 'hero_suryavarmani',
    chenla_jayaviravarman: 'hero_jayaviravarman',
    chenla_udayaditya: 'hero_udayadityavarmani',
    feierganna_qutlugh: 'hero_qutlugh',
    jinzhang_tokhtamysh: 'hero_tokhtamyshkhan',
    jinzhang_urus: 'hero_uruskhan',
    inca_topayupanqui: 'hero_topayupanqui',
    inca_huayna: 'hero_huaynacapac',
    han_liubiao: 'hero_liubiao',
    han_yanbaihu: 'hero_whitetigeryan',
    han_yuji: 'hero_yuji',
    baibo_zhangjue: 'hero_zhangjue',
    ethiopia_abraha: 'hero_abrahaelephant',
    ethiopia_yekuno: 'hero_yekunoamlak',
    shiwaben_barbarossa: 'hero_frederickbarbarossa',
    wende_siegfried: 'hero_siegfried',
    kelimiya_embriaco: 'hero_guglielmoembriaco',
    lunbadi_sforza: 'hero_sforza',
    maqidun_hephaistion: 'hero_hephaistion',
    maqidun_nearchos: 'hero_nearchos',
    manzheboyi_radenwijaya: 'hero_radenwijaya',
    manzheboyi_jayanegara: 'hero_jayanegara',
    mosike_dmitry: 'hero_dmitryofmoscow',
    luosi_yury: 'hero_yury',
    wulaertu_mleh: 'hero_mleh',
    wulaertu_stephan: 'hero_stephan',
    gelujiya_ivane: 'hero_ivane',
    gelujiya_zakare: 'hero_zakare',
    gurjara_chand: 'hero_chandbardai',
    gurjara_sanyogita: 'hero_sanyogita',
    kanata_amoghavarsha: 'hero_amoghavarsha',
    xiongren_bleda: 'hero_bledathehun',
    bolan_zawisza: 'hero_zawiszatheblack',
    sashan_khosrow: 'hero_khosrau',
    baojialiya_konstantin: 'hero_tsarkonstantin',
    osman_selim: 'hero_selimthegrim',
    mazhaer_toldi: 'hero_miklostoldi',
    womaya_musa: 'hero_musaibnnusayr',
    maya_pacal: 'hero_pacalii',
    aztec_itzcoatl: 'hero_itzcoatl',
    aztec_cuauhtemoc: 'hero_cuauhtemoc',
    bogendi_jacqueline: 'hero_jacquelineofhainaut',
    jiaohuangguo_leoi: 'hero_popeleoi',
    gen_minamoto_yoritomo: 'hero_minamoto',   // 源赖朝（兵模改名「英雄 源赖朝 日本」）
    nanchou_kitabatake: 'hero_kitabatake',
    sashan_shah: 'hero_shahking',
    abasi_imam: 'hero_imam',
    gaolu_bureau: 'hero_jeanbureau',
    gaolu_lorrain: 'hero_jeandelorrain',
};

/**
 * 主将队用哪个兵种：剧本事件里选定的 > 武将专属英雄（指定兵模） > 军团显式配置的英雄主队（commanderUnit） > 本军团前排兵种。
 * 🔴 [2026-10-24 主人令「陆逊首战的敌对武将是刘备，但是刘备的主将队武将却是诸葛亮的兵模，请优先使用指定兵模」]
 *    武将有自己的专属英雄兵模（GENERAL_HERO_UNITS）时优先用它，不许被军团默认主队兵模压掉
 *    （例：古典时代巴蜀军团默认 hero_zhugeliang，刘备出阵仍该用 hero_liubei）。
 * 🔴 [2026-10-18 主人令「你把英雄的军团套上他本人的兵模不就可以了。也就不需要英雄随机池了」]
 *    军团 commanderUnit 只给**没有专属英雄的武将**兜底，不再走 248 英雄随机池。
 */
export function commanderUnitOf(generalId: string | null | undefined, expandedSlots: readonly string[], ctx?: { factionId?: string | null; seedKey?: string; legionCommanderUnit?: string | null }): string | null {
    const picked = generalId ? getScriptCommanderUnit(generalId) : null;
    const hero = generalId ? GENERAL_HERO_UNITS[generalId] : undefined;
    const legionCmd = ctx?.legionCommanderUnit ? ctx.legionCommanderUnit : null;
    return picked ?? hero ?? legionCmd ?? expandedSlots[0] ?? null;
}

/** 编制 9 队展开后追加主将队 → 10 队；不是 9 队的（异常/旧数据）原样返回 */
export function withCommander(generalId: string | null | undefined, expandedSlots: string[], ctx?: { factionId?: string | null; seedKey?: string; hasElite?: boolean; legionCommanderUnit?: string | null }): string[] {
    if (expandedSlots.length !== 9) return expandedSlots;
    // 🔴 [2026-10-08 主人令「没有武将，或者没有精锐的军团，不要出现第十队」] 无将、或明确无精锐 → 不追加主将队（取代 2026-10-05「每个军团都必须有主将队」）
    if (!generalId || ctx?.hasElite === false) return expandedSlots;
    const cmd = commanderUnitOf(generalId, expandedSlots, ctx);
    return cmd ? [...expandedSlots, cmd] : expandedSlots;
}
