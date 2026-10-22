/**







 * 势力将领：势力史实将领档案（一势力一将领一立绘，AI 也有）。







 *







 * 设计定案（GAME_DIRECTION.md；录入 AGENTS §2.2.0）：







 *   **一切以据点为基准**录入势力/武将；档案绑 factionId 仅为实现索引。







 *   **出场**：将/精随 **据点 cityId**（`getCityAnchoredGeneral`）；旗号随占城。







 *   例：长子→上党→白起；天水→秦→嬴稷（各城独立，禁止因白起反推秦@长子）。







 *   **互斥**——军团已带将则据点守城不得再掷将；城防已掷将则军团不得再带；共用 `City.spawnGeneralUsed`。







 *   番号随城见 ExpeditionLegions.CITY_ELITE_LEGIONS / getLegionEliteLegionName。







 *







 * 载体规则（LegionManager 维护）：







 *   锚点据点范围内，**同一将领**不能同时挂在军团与城防；全局仍守「一势力同时仅一支军团扛将」。







 *







 * 武将技生效：GeneralSkillCombat 门禁只看「军团是否带 generalId 且该 id 有档案」，







 *   不再要求跟随/远征——故 AI 将领同样触发，攻守双方各自结算。







 *







 * ── 添加新将领（三步）────────────────────────────────────────







 *   1. 本表加一行：factionId → { generalId, generalName, portrait }







 *      portrait = 专图预留路径（通常 {政权夹}/{factionId}_{generalId}.png）；无文件时







 *      自动 fallback：政权夹随机 → 文化夹随机（见 AGENTS.md §十三，禁止跨区乱抽）







 *   2. general-skills/profiles.ts 的 GENERAL_PROFILES 加 generalId 的武将技档案（不加则技能不触发）







 *   3. 立绘 PNG → 写入对应素材夹 <code>{generalId}.png</code>（F2 绑定）；F2 可校正位置







 *







 * 红线：一势力一将领；专图文件名全局唯一；fallback 仅限本政权夹与本文化夹。







 */







import { resolveGeneralPortraitPath } from '../config/portrait_defaults';







import { getBattlefieldCharacter } from './BattlefieldCharacters';







import { isGeneralOnStage, getGameMode } from './generalOnStage';







import { getGeneralProfile } from './general-skills/profiles';















export interface FactionGeneral {







    /** 将领 id（须在 GENERAL_PROFILES 有档案，否则武将技不触发） */







    generalId: string;







    /** 将领名（军情/日志显示） */







    generalName: string;







    /** 将领立绘路径 */







    portrait: string;







    /**







     * 武将专属精锐番号（2026-10-19 主人定：「一个据点，一个势力，可以多个武将，一个武将一支精锐」）。







     * 同一据点/势力下有多位武将时，每位武将各有专属精锐番号；未填则自动继承该势力精锐表的番号。







     */







    eliteName?: string;







    /** 武将专属精锐档位（0..4 对应 T0..T4；未填则回落到精锐表档位） */







    eliteTier?: 0 | 1 | 2 | 3 | 4;







    /**







     * 武将所属军团名（🔴 [2026-10-19 主人令「一个武将要有一个对应的军团」]）。







     * 军团 = 四时代 × 建筑文化；武将的军团 = 他的时代 × 所在据点的建筑文化。







     * 未填 = 与势力表（FACTION_COMPOSITIONS）挂的军团相同；同一势力里时代不同的武将才在此各写自己的军团。







     */







    legionName?: string;







    /**







     * 🔴 [2026-10-20 主人令「一个据点多个武将，一个武将一个势力，哪个武将登场挂哪个势力的旗帜」]







     * 武将自己的势力（**只用于显示**）：他带兵 / 守城 / 剧本出场时，军团旗、染色、势力名走这个势力；







     * **不改据点归属**（据点仍是原来那个势力）、不改军团编制、不改 AI 归属。







     * 不填 = 跟据点势力（旧行为）。







     */







    factionId?: string;







}















/** factionId → 开局将领。先做秦/白起跑通，其余知名势力逐个补。 */







export const FACTION_GENERALS: Readonly<Record<string, FactionGeneralEntry>> = {







    // 🔴 [2026-09-07] 下面 5 位是新建美洲文化区的开局武将。portrait 一律留空 —— 







    //    我（AI）一张图都没看过，绝不凭空编专属立绘路径（曾编过 /assets/IROQUOIS/... 之类根本不存在的夹）。







    //    留空＝走文化池回落（见 resolveGeneralPortraitPath）。等主人放图后再按约定填：







    //    **势力key_中文名拼音.png**（例：恺撒→luoma_diguo_kaisa.png、柯沙玛因→ayinu_ezo_keshamayin.png），







    //    不是英文转写。文件放进该区的物理立绘夹，不许跨区借图。







    ayinu_ezo: { generalId: 'gen_koshamain', generalName: '柯沙玛因', portrait: '/assets/JAPAN/gen_koshamain.png' },







    yiluokui: { generalId: 'gen_hiawatha', generalName: '海华沙', portrait: '/assets/AMERICA/gen_hiawatha.png' },







    qimu: { generalId: 'gen_minchancaman', generalName: '明查凯曼', portrait: '/assets/INCA/gen_minchancaman.png' },







    talasike: [







        { generalId: 'gen_tzitzipandaquare', generalName: '齐齐潘达夸雷', portrait: '/assets/AMERICA/gen_tzitzipandaquare.png' },







        // 2026-10-20：托托纳克酋长奇科马卡特（1519 年联络科尔特斯）→ 中美洲（钦聪灿）；AMERICA×帝国＝特诺奇军团







        { generalId: 'gen_chicomacatl', generalName: '奇科马卡特', portrait: '/assets/AMERICA/gen_chicomacatl.png', legionName: '帝国时代特诺奇军团' },







    ],







    tailuona: { generalId: 'gen_cuchacique', generalName: '库查西克', portrait: '/assets/INCA/gen_cuchacique.png' },







    teweierqie: { generalId: 'gen_casimiro_bigua', generalName: '卡西米罗·比格', portrait: '/assets/MAPUCHE/gen_casimiro_bigua.png' },







    xinnidelan: { generalId: 'gen_stuyvesant', generalName: '斯泰弗森特', portrait: '/assets/SAXONS/gen_stuyvesant.png' },







    xinfalanxi: { generalId: 'gen_champlain', generalName: '尚普兰', portrait: '/assets/FRANKS/gen_champlain.png' },







    xinxibanya: { generalId: 'gen_urdaneta', generalName: '乌尔达内塔', portrait: '/assets/SPANISH/gen_urdaneta.png' , legionName: '帝国时代西班牙征服军团' },







    manzheboyi: { generalId: 'gen_gajah_mada', generalName: '加查马达', portrait: '/assets/MALAY/gen_gajah_mada.png' },







    zhelouqi: { generalId: 'gen_prithviraj', generalName: '普里特维', portrait: '/assets/INDIA/zhelouqi_pulitewei.png' },







    suosuo: { generalId: 'gen_sumanguru', generalName: '苏曼古鲁', portrait: '/assets/AFRICA/suosuo_sumangulu.png' },







    antiaokegongguo: { generalId: 'gen_nur_ad_din', generalName: '努尔丁', portrait: '/assets/ORIE/antiaokegongguo_nuerding.png' },







    aoerlianggongguo: { generalId: 'gen_joanofarc', generalName: '贞德', portrait: '/assets/FRANKS/gen_joanofarc.png' },







    jinquehua: { generalId: 'gen_edward_longshanks', generalName: '长腿爱德华', portrait: '/assets/BRITONS/gen_edward_longshanks.png' },







    apuliya: [







        { generalId: 'gen_robert_guiscard', generalName: '吉斯卡尔', portrait: '/assets/SICILIANS/gen_robert_guiscard.png' },







        // 🔴 [2026-10-20 主人令「放到离他事发地最近的相同建筑风格文化的据点」「所有武将都这么处理，不要擅自添加据点」] 事发地＝贝内文托战役 → 最近同风格据点梅尔菲







        // 🔴 [2026-10-20 首战规则] 曼弗雷德＝霍亨斯陶芬家西西里王（1266 贝内文托败于安茹的卡洛）；霍亨斯陶芬无独立势力，挂神圣罗马帝国并报告；名将；封建×西西里＝封建时代西西里埃米尔军团；立绘留空







        { generalId: 'hre_manfred', legionName: '城堡时代诺曼军团', generalName: '曼弗雷德', portrait: '/assets/SICILIANS/hre_manfred.png' },







    ],







    saimien: { generalId: 'gen_yodit', generalName: '尤迪特', portrait: '/assets/ETHIOPIANS/gen_yodit.png' },







    aosimanbeiyiguo: { generalId: 'gen_osman_i', generalName: '奥斯曼一世', portrait: '/assets/TURKS/gen_osman_i.png', legionName: '城堡时代加齐突骑军团' },







    aiduoniya: { generalId: 'gen_brasidas', generalName: '巴西达斯', portrait: '/assets/ATHENIANS/gen_brasidas.png' },







    qiesuonisuosi: { generalId: 'gen_lysander', generalName: '吕山德', portrait: '/assets/ATHENIANS/gen_lysander.png' },














    // 🔴 [2026-10-20 主人令「佩尔狄卡斯挂下埃及不对，修复」] 他是亚历山大部将、帝国摄政，史实政权＝马其顿/亚历山大帝国；







    //    据点佩鲁西姆（他公元前 321/320 年征埃及、死于埃及）不改，只挂马其顿旗（武将自带势力）







    xiaaiji: { generalId: 'gen_perdiccas', generalName: '佩尔狄卡斯', portrait: '/assets/ORIE/gen_perdiccas.png', factionId: 'maqidun' , eliteName: '伙伴骑兵', eliteTier: 0 },







    kaliya: [







        { generalId: 'gen_artemisia', generalName: '阿尔特米西亚', portrait: '/assets/GREECE/gen_artemisia.png' },







        // 公元前334年哈利卡纳苏斯战役守帅（罗得岛的门农，波斯西部沿海统帅，阿里安 I.20 记其与卡里亚总督据城死守），立绘按铁律留空、待主人亲自放图分配







        { generalId: 'halikanasu_memnon', generalName: '门农', portrait: '/assets/GREECE/halikanasu_memnon.png' },







    ],







    bosidiguo: [
        { generalId: 'gen_artaphernes', generalName: '阿尔塔弗涅斯', portrait: '/assets/GREECE/gen_artaphernes.png' },
        { generalId: 'bfe2_pharnabazus', generalName: '法那巴佐斯', portrait: '/assets/GREECE/bfe2_pharnabazus.png', legionName: '古典时代爱奥尼亚军团' },
    ],







    jikelazes: { generalId: 'gen_aristides', generalName: '阿里斯提德', portrait: '/assets/ATHENIANS/gen_aristides.png' },







    adiyabeina: { generalId: 'gen_cleitus', generalName: '克雷图斯', portrait: '/assets/ORIE/gen_cleitus.png' },







    youbeiya: { generalId: 'gen_datis', generalName: '达提斯', portrait: '/assets/GREECE/gen_datis.png' },







    zeta: { generalId: 'gen_carpini', generalName: '柏朗嘉宾', portrait: '/assets/LATIN/zeta_bolangjiabin.png' },














    telakaigongguo: { generalId: 'gen_kestutis', generalName: '科斯图提斯', portrait: '/assets/LITHUANIANS/gen_kestutis.png' },







    duobuluojia: { generalId: 'gen_ivaylo', generalName: '伊瓦伊洛', portrait: '/assets/SLAVIC/duobuluojia_yiwaiyiluo.png' },







    aertai: { generalId: 'gen_kuchlug', generalName: '屈出律', portrait: '/assets/CENTRAL_ASIA/gen_kuchlug.png' },







    // 🔴 [2026-10-20 主人令「以政权为主，势力的目的是判断该不该打仗：该打的就不合并，不该打的就合并」]







    //    吉尔根汗＝库曼（钦察）汗，库曼尼亚就是库曼人的地（Cumania），与忽炭汗同一政权、不是敌人 → 统一挂库曼







    kumanni: { generalId: 'gen_girgen', generalName: '吉尔根汗', portrait: '/assets/SLAVIC/gen_girgen.png', factionId: 'kuman_oleshky' , eliteName: '库曼弓骑', eliteTier: 1 },







    kuman_oleshky: [







        { generalId: 'gen_kotyan', generalName: '忽炭汗', portrait: '/assets/CUMAN/gen_kotyan.png' },







        // 2026-10-20：克里米亚汗国奠基者哈吉·格莱（1397–1466）→ 黑海北岸库曼（克里米亚鞑靼族源）奥列什基；CUMAN×城堡＝库曼军团







        { generalId: 'gen_haci_giray', generalName: '哈吉格莱', portrait: '/assets/CUMAN/gen_haci_giray.png', legionName: '城堡时代库曼军团' },







        // 🔴 [2026-10-20 主人令「这些据点违规了……请删除。据点中有武将的话，请放到相同风格的临近据点」] 原据点 city_cimmericum 已删 → 迁奥列什基（同建筑风格最近），仍挂本政权 cimmerian







        { generalId: 'bfe_cimmerian_king', legionName: '古典时代萨尔马提亚军团', generalName: '辛梅里安王 图格达梅', portrait: '/assets/CUMAN/bfe_cimmerian_king.png' , eliteName: '辛梅里安骑', eliteTier: 4},







    ],







    // 巴奇曼＝伏尔加钦察汗；钦察＝库曼（Cuman-Kipchak 同一联盟，汉名钦察／西名库曼），与忽炭汗同一边、不是敌人 → 统一挂库曼







    qincha_saksin: { generalId: 'qincha_baqiman', generalName: '巴奇曼', portrait: '/assets/CUMAN/qincha_baqiman.png', factionId: 'kuman_oleshky' , eliteName: '库曼弓骑', eliteTier: 1 },







    feierganna: { generalId: 'gen_qutlugh', generalName: '忽都鲁', portrait: '/assets/WESTERN/gen_qutlugh.png' },







    qibucha: { generalId: 'gen_pacanchiq', generalName: '帕坎奇克', portrait: '/assets/MUISCA/gen_pacanchiq.png' },







    tamoyue: { generalId: 'gen_cunhambebe', generalName: '昆汉贝贝', portrait: '/assets/TUPI/gen_cunhambebe.png' },







    naweierbuta: { generalId: 'gen_galvarino', generalName: '加尔瓦里诺', portrait: '/assets/MAPUCHE/gen_galvarino.png' , legionName: '帝国时代安第斯游击军团' },







    alaokaniya: { generalId: 'gen_guacolda', generalName: '瓜科尔达', portrait: '/assets/MAPUCHE/gen_guacolda.png' },







    bogendigongguo: { generalId: 'gen_john_fearless', generalName: '无畏的约翰', portrait: '/assets/BURGUNDIANS/gen_john_fearless.png' },







    amaniyake: { generalId: 'gen_bernard_armagnac', generalName: '贝尔纳七世', portrait: '/assets/FRANKS/gen_bernard_armagnac.png' },







    geluositeboguo: { generalId: 'gen_gilbert', generalName: '吉尔伯特', portrait: '/assets/BRITONS/gen_gilbert.png' },







    baerta: { generalId: 'gen_alaric', generalName: '亚拉里克', portrait: '/assets/LATIN/gen_alaric.png' },







    saiputimanniya: { generalId: 'gen_ataulf', generalName: '阿陶尔夫', portrait: '/assets/GOTHS/gen_ataulf.png' },







    // 🔴 [2026-10-20 主人令「按历史来，该是什么势力就是什么势力」] 瓦卢瓦勃艮第三家同属一国 → 统一挂勃艮第公国







    bogengnidielan: { generalId: 'gen_philip_good', generalName: '好人菲利普', portrait: '/assets/BURGUNDIANS/gen_philip_good.png', factionId: 'bogendigongguo' },







    gewennesi: { generalId: 'gen_dafydd', generalName: '戴菲德', portrait: '/assets/CELTS/gen_dafydd.png' },







    weiershigongguo: { generalId: 'gen_llywelyn', generalName: '卢埃林', portrait: '/assets/CELTS/gen_llywelyn.png' },







    huanzhou: { generalId: 'gen_dinhle', generalName: '丁礼', portrait: '/assets/VIETNAMESE/gen_dinhle.png' },







    tigelei: { generalId: 'gen_gidajan', generalName: '吉达扬', portrait: '/assets/ETHIOPIANS/gen_gidajan.png' },







    luben: { generalId: 'gen_thoros', generalName: '托罗斯二世', portrait: '/assets/ORIE/gen_thoros.png' },







    xiaoa: { generalId: 'gen_dagnajan', generalName: '达格纳詹', portrait: '/assets/ETHIOPIANS/gen_dagnajan.png' },







    miandian: { generalId: 'gen_maha_thiha_thura', generalName: '摩诃·悉都', portrait: '/assets/BURMESE/gen_maha_thiha_thura.png' },







    malai: { generalId: 'gen_sang_nila_utama', generalName: '桑尼拉乌他马', portrait: '/assets/MALAY/gen_sang_nila_utama.png' },







    taimier: { generalId: 'gen_rajaram', generalName: '拉贾拉姆', portrait: '/assets/INDIA/taimier_lajialamu.png' },















    boootiya: [
        { generalId: 'bfe2_theagenes', generalName: '特阿格尼斯', portrait: '/assets/GREECE/bfe2_theagenes.png', legionName: '古典时代爱奥尼亚军团' },
        { generalId: 'bfe_callias', generalName: '卡尔基斯僭主 卡利斯', portrait: '/assets/GREECE/bfe_callias.png', factionId: 'boootiya', legionName: '古典时代爱奥尼亚军团' },







        { generalId: 'gen_epaminondas', generalName: '伊巴密浓达', portrait: '/assets/GREECE/gen_epaminondas.png' },







        // 公元前335年底比斯战役守帅（底比斯主将菲尼克斯，见剧本该场 description），立绘按铁律留空、待主人亲自放图分配







        { generalId: 'dibisi_phoinix', generalName: '菲尼克斯', portrait: '/assets/GREECE/dibisi_phoinix.png' },







    ],







    luodesi: { generalId: 'gen_villaret', generalName: '维拉雷', portrait: '/assets/FRANKS/gen_villaret.png' },







    kelite: { generalId: 'gen_morosini', generalName: '莫罗西尼', portrait: '/assets/LATIN/kelite_moluoxini.png' },







    leangongguo: [







        { generalId: 'gen_alfonso_ix', generalName: '阿方索九世', portrait: '/assets/SPANISH/gen_alfonso_ix.png' },







        // 🔴 [2026-10-20 首战规则] 拉米罗二世＝莱昂国王（939 西曼卡斯战役击败阿卜杜·拉赫曼三世）；据点萨拉曼卡（SPANISH 风格）；封建×西班牙＝封建时代摩尔游骑军团；立绘留空







        { generalId: 'gen_ramiro_ii', generalName: '拉米罗二世', portrait: '/assets/SPANISH/gen_ramiro_ii.png', legionName: '封建时代摩尔游骑军团' },







    ],







    bohepingyuan: { generalId: 'gen_cangrande', generalName: '坎格兰德', portrait: '/assets/LATIN/bohepingyuan_diaoduolike.png' },







    xixiliwangguo: [







        { generalId: 'gen_frederic_ii', generalName: '腓特烈二世', portrait: '/assets/SICILIANS/gen_frederic_ii.png' },







        // 2026-10-20 主人令「有名字的武将都要安置在据点」：诺曼人博希蒙德（塔兰托亲王、安条克亲王）→ 诺曼西西里（巴勒莫），军团随 SICILIANS×城堡＝诺曼军团







        { generalId: 'gen_bohemond', generalName: '博希蒙德', portrait: '/assets/SICILIANS/gen_bohemond.png', legionName: '城堡时代诺曼军团' },







    ],







    weixi: { generalId: 'gen_ansgar', generalName: '安斯加尔', portrait: '/assets/FRANKS/gen_ansgar.png' },















    yipilusi: { generalId: 'yipilusi_piluoshi', generalName: '皮洛士', portrait: '/assets/GREECE/yipilusi_piluoshi.png' },







    lagoniya: [
        { generalId: 'bfe2_pollis', generalName: '波利斯', portrait: '/assets/SPARTANS/bfe2_pollis.png', legionName: '古典时代斯巴达军团' },
        { generalId: 'bfe_cleombrotus', generalName: '斯巴达将 克里奥姆布罗图斯', portrait: '/assets/SPARTANS/bfe_cleombrotus.png', legionName: '古典时代斯巴达军团' },
        { generalId: 'gen_leonidas', generalName: '列奥尼达', portrait: '/assets/SPARTANS/gen_leonidas.png' },
        { generalId: 'bfe2_cleombrotus_i', generalName: '克勒翁布罗图斯一世', portrait: '/assets/SPARTANS/bfe2_cleombrotus_i.png', legionName: '古典时代斯巴达军团' },
    ],







    maqidun: [
        // 🔴 [2026-10-20 史实] 腓力二世＝马其顿国王，都城佩拉（非奥林索斯战场）；马其顿军团
        { generalId: 'gen_philip_ii', generalName: '腓力二世', portrait: '/assets/MACEDONIAN/gen_philip_ii.png', legionName: '古典时代马其顿军团' },
        // 🔴 [2026-10-20 史实] 帕曼纽＝马其顿老将，随王驻佩拉；马其顿军团
        { generalId: 'gen_parmenion', generalName: '帕曼纽', portrait: '/assets/MACEDONIAN/gen_parmenion.png', legionName: '古典时代马其顿军团' },







        { generalId: 'gen_alexander_great', generalName: '亚历山大', portrait: '/assets/MACEDONIAN/gen_alexander_great.png' },







        // 公元前323年普拉塔纳斯战役守帅（马其顿摄政、欧洲最高统帅安提帕特）。







        // 🔴 [2026-09-19 主人令「全删除」] 该战役事件已删除（武将无据点、事件触发不了）；**人物记录保留**。







        // 立绘按铁律留空走回落、待主人亲自放图分配







        { generalId: 'maqidun_antipater', generalName: '安提帕特', portrait: '/assets/MACEDONIAN/maqidun_antipater.png' },







        // 公元前321年赫勒斯滂战役反摄政同盟统帅克拉特罗斯，立绘按铁律留空走回落、待主人亲自放图分配







        { generalId: 'maqidun_craterus', generalName: '克拉特罗斯', portrait: '/assets/MACEDONIAN/maqidun_craterus.png' },







    ],







    lagusa: { generalId: 'gen_dragan', generalName: '德拉甘', portrait: '/assets/SLAVIC/lagusa_delagan.png' },















    ruidian_yota: { generalId: 'gen_charles_ix', generalName: '卡尔九世', portrait: '/assets/GERMANIC/ruidian_yota_kaerjiushi.png' },







    meikelunbao: { generalId: 'gen_henry_borwin', generalName: '博尔温', portrait: '/assets/GERMANIC/meikelunbao_hengliboluo.png' },







    didi: { generalId: 'gen_willem_juliette', generalName: '威廉一世', portrait: '/assets/GERMANIC/didi_weilianyishi.png', legionName: '城堡时代勃艮第公国军团' },







    anuo: { generalId: 'gen_ugolino', generalName: '乌戈里诺', portrait: '/assets/LATIN/anuo_wugelinuo.png' },







    guadaer: { generalId: 'gen_fernando_iii', generalName: '费尔南多', portrait: '/assets/SPANISH/gen_fernando_iii.png' },







    balunxiya: { generalId: 'gen_el_cid', generalName: '熙德', portrait: '/assets/SPANISH/gen_el_cid.png' },







    moxina: { generalId: 'gen_roger_i', generalName: '罗杰', portrait: '/assets/SICILIANS/gen_roger_i.png' },







    sading: { generalId: 'gen_eleanor', generalName: '埃莱奥诺拉', portrait: '/assets/SICILIANS/gen_eleanor.png' },







    yidelisi: [







        { generalId: 'gen_idris_i', generalName: '伊德里斯', portrait: '/assets/BERBER/yidelisi_yidelisi.png' },







        // 🔴 [2026-10-20 首战规则] 阿布·哈桑·阿里＝马林苏丹（1340 萨拉多河被卡斯蒂利亚-葡萄牙联军击败）→ 非斯（马林都城，BERBER 风格）；势力挂马格里布（库无马林独立势力，报告）；城堡×柏柏尔＝城堡时代摩尔军团；立绘留空







        { generalId: 'malin_abulhasan', generalName: '阿布·哈桑·阿里', portrait: '/assets/BERBER/malin_abulhasan.png', factionId: 'talike', legionName: '城堡时代摩尔军团' },







    ],







    qiekase: { generalId: 'gen_vyshnevetsky', generalName: '拜达', portrait: '/assets/SLAVIC/qiekase_weishenniao.png' },







    baojialiya: [







        { generalId: 'baojialiya_aseni', generalName: '阿森一世', portrait: '/assets/BULGARIANS/baojialiya_aseni.png' },







        // 🔴 [2026-10-20 首战规则] 米哈伊尔·希什曼＝保加利亚第二帝国沙皇（1330 维尔布日德战死）→ 特尔诺沃·保加利亚；普将；立绘留空







        { generalId: 'baojialiya_mikhail', legionName: '城堡时代查雷威茨禁卫军团', generalName: '米哈伊尔·希什曼', portrait: '/assets/BULGARIANS/baojialiya_mikhail.png' },







    ],







    saierdika: { generalId: 'gen_krum', generalName: '克鲁姆', portrait: '/assets/BULGARIANS/gen_krum.png' },







    bosiniya: { generalId: 'gen_tvrtko', generalName: '特夫尔特科', portrait: '/assets/SLAVIC/bosiniya_tefuerteke.png' },















    mulabite: [



        { generalId: 'gen_tashfin', generalName: '塔什芬', portrait: '/assets/BERBER/mulabite_tashenfen.png' },



        // 🔴 [2026-10-20 首战规则] 阿里·本·优素福＝穆拉比特埃米尔（1106–1143，1139 奥里基战役败于阿方索·恩里克斯）→ 马拉喀什（BERBER 风格）；封建×柏柏尔＝封建时代柏柏尔军团；立绘留空



        { generalId: 'gen_ali_ibn_yusuf', generalName: '阿里·本·优素福', portrait: '/assets/BERBER/gen_ali_ibn_yusuf.png', legionName: '封建时代柏柏尔军团' },



    ],















    zhibuluotuo: { generalId: 'gen_henry_navigator', generalName: '恩里克', portrait: '/assets/PORTUGUESE/gen_henry_navigator.png' },







    zhayan: [
        { generalId: 'gen_yaghmurasen', generalName: '亚格姆拉森', portrait: '/assets/BERBER/zhayan_yalimoluo.png' },
        // 🔴 [2026-10-20 主人令「遇到问题先看符合历史，下结论再动手」] 首战回补安置按史实复核：库赛拉＝奥雷巴柏柏尔王，阿尔塔瓦王国（今特莱姆森一带）；丹吉尔从未是他的驻地 → 放特莱姆森（zhayan，风格 BERBER）；仍挂本政权 talike
        { generalId: 'gen_kusaila', factionId: 'talike', legionName: '封建时代柏柏尔军团', generalName: '库赛拉', portrait: '/assets/BERBER/gen_kusaila.png', },
    ],







    babali: { generalId: 'gen_barbarossa', generalName: '巴巴罗萨', portrait: '/assets/BERBER/babali_babaluosa.png' },







    hamade: { generalId: 'gen_hammad', generalName: '哈马德', portrait: '/assets/BERBER/hamade_hamade.png' },







    buni: [
        { generalId: 'bfe_bomilcar', generalName: '迦太基将 波米尔卡', portrait: '/assets/BERBER/bfe_bomilcar.png', legionName: '古典时代迦太基军团' },







        { generalId: 'gen_hannibal', generalName: '汉尼拔', portrait: '/assets/BERBER/buni_hanniba.png' },







        // 2026-10-20：汪达尔国王盖萨里克（389–477，439 年取迦太基）→ 迦太基；BERBER×古典＝迦太基军团







        { generalId: 'wangdaer_gaisalike', generalName: '盖萨里克', portrait: '/assets/BERBER/wangdaer_gaisalike.png', legionName: '古典时代迦太基军团' },







    ],







    aguelabu: { generalId: 'gen_uqba', generalName: '奥克巴', portrait: '/assets/BERBER/aguelabu_aokeba.png' },







    telibolisi: [







        { generalId: 'gen_dragut', generalName: '德拉古特', portrait: '/assets/BERBER/telibolisi_delagute.png' },







        // 🔴 [2026-10-20 主人令「这些据点违规了……请删除。据点中有武将的话，请放到相同风格的临近据点」] 原据点 city_marmarica 已删 → 迁的黎波里（同建筑风格最近），仍挂本政权 libya







        { generalId: 'bfe_libyan_chief', legionName: '古典时代迦太基军团', generalName: '利比亚诸部盟主 阿迪尔', portrait: '/assets/BERBER/bfe_libyan_chief.png' , eliteName: '利比亚部兵', eliteTier: 4},







    ],







    jileinaijia: { generalId: 'gen_magas', generalName: '马加斯', portrait: '/assets/GREECE/gen_magas.png' },







    talike: [







        { generalId: 'talike_talike', generalName: '塔里克', portrait: '/assets/BERBER/talike_talike.png' },














    ],















    maixiya: { generalId: 'gen_offa_mercia', generalName: '奥法', portrait: '/assets/SAXONS/gen_offa_mercia.png' },







    nidelan: { generalId: 'gen_william_silent', generalName: '威廉奥兰治', portrait: '/assets/GERMANIC/nidelan_weilian.png' },







    boumeilaniyan: { generalId: 'gen_casimir_iv', generalName: '卡西米尔', portrait: '/assets/POLES/gen_casimir_iv.png' },







    pomeilaniya: { generalId: 'pomeilaniya_bogislaw', generalName: '博吉斯拉夫', portrait: '/assets/GERMANIC/pomeilaniya_bojisilafu.png' },  // 什切青·格里芬王朝公爵







    langgeduoke: { generalId: 'gen_raymond_v', generalName: '雷蒙五世', portrait: '/assets/FRANKS/gen_raymond_v.png' },







    aermolika: { generalId: 'gen_gilles_de_rais', generalName: '吉尔德雷斯', portrait: '/assets/FRANKS/gen_gilles_de_rais.png' },







    tuosikana: { generalId: 'gen_lorenzo_medici', generalName: '洛伦佐', portrait: '/assets/LATIN/tuosikana_luolunzuo.png' },







    yadelaiya: { generalId: 'gen_dandolo', generalName: '丹多洛', portrait: '/assets/LATIN/yadelaiya_danduoluo.png' },







    talanduo: { generalId: 'talanduo_aqita', generalName: '阿契塔', portrait: '/assets/GREECE/talanduo_aqita.png' },







    safuyi: { generalId: 'safuyi_ameidi', generalName: '阿梅迪奥', portrait: '/assets/LATIN/safuyi_ameidi.png' },







    kanpaniya: { generalId: 'gen_charles_i_naples', generalName: '卡洛', portrait: '/assets/LATIN/kanpaniya_kaluo.png' },







    jiatailuoniya: [

        { generalId: 'gen_wifred_hairy', generalName: '威弗雷德', portrait: '/assets/LATIN/jiatailuoniya_weifuleide.png' },



        // 🔴 [2026-10-20 首战规则] 阿布·叶海亚＝马略卡摩尔总督（1229 战死）；马略卡城库无据点，取最近同风格据点巴塞罗那（LATIN，加泰罗尼亚）；势力仍写穆瓦希德；立绘留空



        { generalId: 'gen_abu_yahya', generalName: '阿布·叶海亚', portrait: '/assets/LATIN/gen_abu_yahya.png', factionId: 'muwaxide', legionName: '城堡时代意大利城邦军团' },



    ],







    nasier: [



        { generalId: 'gen_muhammad_i', generalName: '穆罕默德', portrait: '/assets/SPANISH/gen_muhammad_i.png' },



        // 🔴 [2026-10-20 首战规则] 穆罕默德十二世＝格拉纳达末代苏丹（1491 城降）→ 格拉纳达（SPANISH）；城堡时代卡斯蒂利亚军团；立绘留空



        { generalId: 'gen_muhammad_xii', generalName: '穆罕默德十二世', portrait: '/assets/SPANISH/gen_muhammad_xii.png', legionName: '城堡时代卡斯蒂利亚军团' },



    ],







    liguliya: { generalId: 'gen_andrea_doria', generalName: '安德烈亚', portrait: '/assets/LATIN/liguliya_andelieya.png' },







    seleisi: [







        { generalId: 'gen_simeon_great', generalName: '西美昂', portrait: '/assets/THRACIAN/gen_simeon_great.png' },







        // 公元前335年多瑙河渡河战役守帅（多瑙河北岸盖塔人的君主科托罗，名取自剧本该场对手主将队注释与世纪表的既定记载），立绘按铁律留空、待主人亲自放图分配







        { generalId: 'jite_shouling', generalName: '科托罗', portrait: '/assets/THRACIAN/jite_shouling.png', legionName: '古典时代色雷斯军团' },







    ],







    bolisiya: { generalId: 'gen_gastold', generalName: '加斯托尔德', portrait: '/assets/LITHUANIANS/gen_gastold.png' },







    zhituo: { generalId: 'gen_zhytomyr', generalName: '日托米尔', portrait: '/assets/SLAVIC/zhituo_rituomier.png' },















    pufaerci: { generalId: 'gen_ludwig_iv', generalName: '路德维希', portrait: '/assets/GERMANIC/pufaerci_ludeweixi.png' },







    hansa: { generalId: 'gen_stortebeker', generalName: '克劳斯', portrait: '/assets/GERMANIC/hansa_kelaosi.png' },







    batawei: { generalId: 'gen_civilis', generalName: '西维利斯', portrait: '/assets/GERMANIC/batawei_xiweilisi.png' },







    weijing_york: { generalId: 'gen_eric_bloodaxe', generalName: '埃里克', portrait: '/assets/DANES/gen_eric_bloodaxe.png' },







    kanbuliya: { generalId: 'gen_william_wallace', generalName: '华莱士', portrait: '/assets/CELTS/gen_william_wallace.png' },







    gaolu_luoma: [







        { generalId: 'gen_clovis_i', generalName: '克洛维', portrait: '/assets/FRANKS/gen_clovis_i.png' },







        // 名将双身份：维钦托利（据点武将＋剧本敌将）







        { generalId: 'bfe3_46', generalName: '维钦托利', portrait: '/assets/FRANKS/bfe3_46.png', legionName: '古典时代高卢军团' , eliteName: '高卢战团', eliteTier: 3},







    ],







    aquidan: { generalId: 'gen_black_prince', generalName: '黑太子', portrait: '/assets/FRANKS/gen_black_prince.png' },







    puluowangsi: { generalId: 'gen_raymond_iv', generalName: '雷蒙四世', portrait: '/assets/FRANKS/gen_raymond_iv.png' },







    lunbadi: [
        { generalId: 'bfe_albert_lombard', generalName: '阿尔伯特·比安德拉泰', portrait: '/assets/LATIN/bfe_albert_lombard.png', legionName: '城堡时代意大利城邦军团' },



        // 🔴 [2026-10-20 首战规则] 马克西米利安·斯福尔扎＝米兰公爵（1515 马里尼亚诺败于弗朗索瓦一世）→ 米兰（LATIN）；帝国时代意大利雇佣军团；立绘留空



        { generalId: 'gen_maximilian_sforza', generalName: '马克西米利安·斯福尔扎', portrait: '/assets/LATIN/gen_maximilian_sforza.png', legionName: '帝国时代意大利雇佣军团' },







        { generalId: 'lunbadi_alboin', generalName: '阿尔博因', portrait: '/assets/LATIN/lunbadi_alboin.png' },



        // 🔴 [2026-10-20 首战规则] 皮耶罗·提埃波洛＝米兰执政官（1237 科尔特努瓦被腓特烈二世所俘）→ 米兰（LATIN）；城堡×拉丁＝城堡时代意大利城邦军团；立绘留空



        { generalId: 'gen_pietro_tiepolo', generalName: '皮耶罗·提埃波洛', portrait: '/assets/LATIN/gen_pietro_tiepolo.png', legionName: '城堡时代意大利城邦军团' },







        // 🔴 [2026-10-20 首战规则] 德西德里乌斯＝伦巴第末代国王（773 帕维亚被查理曼围降）→ 米兰·伦巴第；普将；立绘留空







        { generalId: 'lunbadi_desiderius', generalName: '德西德里乌斯', portrait: '/assets/LATIN/lunbadi_desiderius.png' },







    ],







    donggete: [
        { generalId: 'gen_theodoric_great', generalName: '狄奥多里克', portrait: '/assets/GOTHS/gen_theodoric_great.png' },
        // 🔴 [2026-10-20 主人令「遇到问题先看符合历史，下结论再动手」] 首战回补安置按史实复核：奥多亚克＝意大利王，都拉文纳，493 年在拉文纳被围杀；美因茨与他无关 → 放拉文纳（donggete，风格 GOTHS）；仍挂本政权 rierman
        { generalId: 'rierman_odoacer', factionId: 'rierman', generalName: '奥多亚克', portrait: '/assets/GOTHS/rierman_odoacer.png', eliteName: '日耳曼佣兵', eliteTier: 4 },
    ],







    xigete: [







        { generalId: 'gen_alfonso_vi', generalName: '阿方索六世', portrait: '/assets/GOTHS/gen_alfonso_vi.png' },







        // 🔴 [2026-10-20 首战规则] 罗德里克＝西哥特末代国王（711 瓜达莱特战败溺死）→ 托莱多·西哥特；普将；封建×哥特＝封建时代阿斯图里亚斯军团；立绘留空







        { generalId: 'xigete_roderic', generalName: '罗德里克', portrait: '/assets/GOTHS/xigete_roderic.png', legionName: '封建时代阿斯图里亚斯军团' , eliteName: '西哥特亲兵', eliteTier: 4 },   // 🔴 卡斯蒂骑士是 1085 年阿方索六世的，不是 711 年西哥特的兵







        // 🔴 [2026-10-20 主人令「先定据点建筑风格，再放相同风格的武将」] 叶海亚＝托莱多泰法王（1085 托莱多陷落）→ 托莱多（GOTHS 西哥特风格）；势力仍挂倭马亚（factionId）；军团＝城堡时代崖城卫队军团（GOTHS×城堡）；立绘留空







        { generalId: 'womaya_yahya', generalName: '叶海亚·卡迪尔', portrait: '/assets/GOTHS/womaya_yahya.png', factionId: 'womaya', legionName: '城堡时代崖城卫队军团' },







    ],







    andaluoxiya: [
        { generalId: 'gen_abd_al_rahman_iii', generalName: '阿卜杜拉', portrait: '/assets/SPANISH/gen_abd_al_rahman_iii.png' },
        // 🔴 [2026-10-20 主人令「遇到问题先看符合历史，下结论再动手」] 首战回补安置按史实复核：阿卜杜勒·拉赫曼·加菲基＝安达卢斯总督，驻科尔多瓦，732 年由此北征普瓦捷；大马士革是哈里发都城 → 放科尔多瓦（andaluoxiya，风格 SPANISH）；仍挂本政权 womaya
        { generalId: 'womaya_abdrahman', factionId: 'womaya', generalName: '阿卜杜勒·拉赫曼', portrait: '/assets/SPANISH/womaya_abdrahman.png' },
    ],







    alagong: [







        { generalId: 'gen_james_i_aragon', generalName: '海梅', portrait: '/assets/SPANISH/gen_james_i_aragon.png' },







        // 🔴 [2026-10-20 主人令「放到离他事发地最近的相同建筑风格文化的据点」] 马尼拉改判 MALAY，西班牙文化的莱加斯皮按规则迁离事发地（马尼拉）最近的 SPANISH 据点＝萨拉戈萨，仍挂本政权 xishudongyin







        { generalId: 'xishudongyin_lijiasipi', legionName: '帝国时代西班牙方阵军团', generalName: '莱加斯皮', portrait: '/assets/SPANISH/xishudongyin_lijiasipi.png' },







    ],







    shaiyue: { generalId: 'shaiyue_aerpade', generalName: '阿尔帕德', portrait: '/assets/SLAVIC/shaiyue_aerpade.png' },















    nuosi: { generalId: 'gen_olaf_skotkonung', generalName: '奥拉夫', portrait: '/assets/VARANGIANS/gen_olaf_skotkonung.png', legionName: '封建时代维京军团' },







    feiniqi: { generalId: 'gen_hamilcar', generalName: '哈米尔卡', portrait: '/assets/BERBER/gen_hamilcar.png' },







    xila: [
        { generalId: 'bfe2_antiphilus', generalName: '安提菲卢斯', portrait: '/assets/ATHENIANS/bfe2_antiphilus.png', legionName: '古典时代雅典军团' },
        { generalId: 'bfe2_conon', generalName: '科农', portrait: '/assets/ATHENIANS/bfe2_conon.png', legionName: '古典时代雅典军团' },
        { generalId: 'bfe2_cleon', generalName: '克里昂', portrait: '/assets/ATHENIANS/bfe2_cleon.png', legionName: '古典时代雅典军团' },







        { generalId: 'gen_themistocles', generalName: '地米斯托', portrait: '/assets/ATHENIANS/gen_themistocles.png' },







        // 🔴 [2026-10-20 首战规则] 米太亚德＝前490 马拉松之战雅典方主将（史有其人，双身份：据点武将＋达提斯首战敌将）；立绘留空走回落







        { generalId: 'gen_miltiades', generalName: '米太亚德', portrait: '/assets/ATHENIANS/gen_miltiades.png' , eliteName: '雅典重装兵', eliteTier: 2 },   // 🔴 马拉松以雅典重装步兵破波斯轻装（城里原配「萨拉米斯舰」是海军）







        // 公元前323年普拉塔纳斯战役统帅（希腊反马其顿联军统帅莱奥斯塞尼斯）。







        // 🔴 [2026-09-19 主人令「全删除」] 该战役事件已删除；**人物记录保留**。







        // 立绘按铁律留空走回落、待主人亲自放图分配







        { generalId: 'xila_leosthenes', generalName: '莱奥斯塞尼斯', portrait: '/assets/ATHENIANS/xila_leosthenes.png' },







        // 公元前322年克兰农战役希腊同盟军总司令（接替阵亡莱奥斯塞尼斯之安提菲洛斯）。







        // 🔴 [2026-09-19 主人令「全删除」] 该战役事件已删除；**人物记录保留**。







        // 立绘按铁律留空走回落、待主人亲自放图分配







        { generalId: 'xila_antiphilus', generalName: '安提菲洛斯', portrait: '/assets/ATHENIANS/xila_antiphilus.png' },







    ],







    xilagu: { generalId: 'gen_city_syracuse', generalName: '阿加索克利', portrait: '/assets/SICILIANS/gen_city_syracuse.png', legionName: '古典时代叙拉古军团' },







    fulandesi: { generalId: 'gen_robert_ii', generalName: '罗贝尔二世', portrait: '/assets/FRANKS/gen_robert_ii.png' },







    // 大胆查理＝瓦卢瓦勃艮第末代公爵，同属勃艮第公国 → 挂勃艮第公国（与无畏的约翰、好人菲利普同一国）







    bogendi: { generalId: 'bogendi_chali', generalName: '大胆查理', portrait: '/assets/BURGUNDIANS/bogendi_chali.png', factionId: 'bogendigongguo' },







    bulabante: { generalId: 'bulabante_yuehanyishi', generalName: '约翰一世', portrait: '/assets/GERMANIC/bulabante_yuehanyishi.png', legionName: '城堡时代勃艮第公国军团' },







    gaolu: [
        // 🔴 [2026-10-20 首战规则] 劳多尼耶＝法国胡格诺首领（1565 卡罗琳堡被杀）→ 巴黎（FRANKS）；帝国时代法兰西军团；立绘留空
        { generalId: 'gen_laudonniere', generalName: '劳多尼耶', portrait: '/assets/FRANKS/gen_laudonniere.png', legionName: '帝国时代法兰西军团' },







        { generalId: 'gen_charles_vii', generalName: '查理七世', portrait: '/assets/FRANKS/gen_charles_vii.png' },



        // 🔴 [2026-10-20 首战规则] 路易十一＝法国国王（1465 蒙特莱里与大胆查理交战）→ 巴黎（FRANKS）；城堡时代法兰西骑士军团；立绘留空



        { generalId: 'gen_louis_xi', generalName: '路易十一', portrait: '/assets/FRANKS/gen_louis_xi.png', legionName: '城堡时代法兰西骑士军团' },



        // 🔴 [2026-10-20 首战规则] 布锡考特＝法国元帅（1415 阿金库尔被俘）→ 巴黎（FRANKS）；城堡时代法兰西骑士军团；立绘留空



        { generalId: 'gen_boucicaut', generalName: '布锡考特', portrait: '/assets/FRANKS/gen_boucicaut.png', legionName: '城堡时代法兰西骑士军团' },







        // 🔴 [2026-10-20 首战规则] 约翰二世＝法兰西瓦卢瓦王朝国王（1356 普瓦捷被黑太子击败被俘）→ 巴黎·法兰西；普将；封建×法兰克＝封建时代法兰克军团；立绘留空







        { generalId: 'gaolu_john_ii', legionName: '城堡时代法兰西骑士军团', generalName: '约翰二世', portrait: '/assets/FRANKS/gaolu_john_ii.png' },







    ],







    kaernute: { generalId: 'gen_kaernute_kotuatousi', generalName: '科图阿图斯', portrait: '/assets/FRANKS/gen_kaernute_kotuatousi.png' },







    anggelu: { generalId: 'gen_alfred_great', generalName: '阿尔弗雷德', portrait: '/assets/SAXONS/gen_alfred_great.png' },







    yinggelan: [
        // 🔴 [2026-10-20 首战规则] 弗农＝英国海军上将（1741 卡塔赫纳围攻指挥官）→ 温彻斯特（SAXONS）；帝国时代萨克森军团；立绘留空
        { generalId: 'gen_vernon', generalName: '弗农', portrait: '/assets/SAXONS/gen_vernon.png', legionName: '帝国时代萨克森军团' },







        { generalId: 'gen_henry_v', generalName: '亨利五世', portrait: '/assets/SAXONS/gen_henry_v.png' },



        // 🔴 [2026-10-20 首战规则] 萨福克伯爵＝1429 奥尔良围城英军指挥（后被俘）→ 温彻斯特（SAXONS）；城堡时代萨克森选侯国军团；立绘留空



        { generalId: 'gen_suffolk', generalName: '萨福克伯爵', portrait: '/assets/SAXONS/gen_suffolk.png', legionName: '城堡时代萨克森选侯国军团' },







        // 🔴 [2026-10-20 首战规则] 约翰·德·瓦伦＝英格兰驻苏格兰统帅（1297 斯特灵桥被华莱士击败）→ 伦敦·英格兰；普将；封建×萨克森＝封建时代奥托铁卫军团；立绘留空







        { generalId: 'yinggelan_warenne', legionName: '城堡时代萨克森选侯国军团', generalName: '约翰·德·瓦伦', portrait: '/assets/SAXONS/yinggelan_warenne.png' },







    ],







    piketai: { generalId: 'gen_onuist_i', generalName: '奥恩格斯', portrait: '/assets/CELTS/gen_onuist_i.png' },







    gaer: [







        { generalId: 'gen_domhnall', generalName: '多姆纳尔', portrait: '/assets/CELTS/gen_domhnall.png' },







        // 🔴 [2026-10-20 首战规则] 西格特里格·丝须＝都柏林维京王（1014 克朗塔夫之战被布赖恩击败）→ 都柏林·盖尔；普将；立绘留空







        { generalId: 'gaer_sigtrygg', generalName: '西格特里格·丝须', portrait: '/assets/CELTS/gaer_sigtrygg.png' },







    ],







    mangsite: { generalId: 'mangsite_bulaienbolu', generalName: '布赖恩博鲁', portrait: '/assets/CELTS/mangsite_bulaienbolu.png' },







    tuomengde: { generalId: 'tuomengde_aobulaien', generalName: '奥布赖恩', portrait: '/assets/CELTS/tuomengde_aobulaien.png' },







    bulietani: { generalId: 'gen_alain_i', generalName: '阿兰', portrait: '/assets/BRITONS/gen_alain_i.png' },







    saierweiya: [



        { generalId: 'gen_stefan_dusan', generalName: '斯蒂芬杜尚', portrait: '/assets/SLAVIC/saierweiya_sidifendushang.png' },



        // 🔴 [2026-10-20 首战规则] 武卡辛＝塞尔维亚领主（1371 马里查战役与弟乌格列沙一同战死）→ 普里莱普无据点，取最近同风格据点贝尔格莱德（SLAVIC）；城堡×斯拉夫＝城堡时代博亚尔重骑军团；立绘留空



        { generalId: 'gen_vukasin', generalName: '武卡辛', portrait: '/assets/SLAVIC/gen_vukasin.png', legionName: '城堡时代博亚尔重骑军团' },



    ],















    luoma_diguo: [
        { generalId: 'bfe3_4', generalName: '拉维利乌斯', portrait: '/assets/ROMA/bfe3_4.png', legionName: '古典时代罗马军团' },
        { generalId: 'bfe3_63', generalName: '霍尔多尼乌斯', portrait: '/assets/ROMA/bfe3_63.png', legionName: '古典时代罗马军团' },
        { generalId: 'bfe3_51', generalName: '佩特罗尼乌斯', portrait: '/assets/ROMA/bfe3_51.png', legionName: '古典时代罗马军团' },
        { generalId: 'bfe_gaius_livius', generalName: '罗马舰队司令 盖乌斯·李维乌斯', portrait: '/assets/ROMA/bfe_gaius_livius.png', legionName: '古典时代罗马军团' },







        { generalId: 'gen_julius_caesar', generalName: '恺撒', portrait: '/assets/ROMA/gen_julius_caesar.png' },







        // 2026-10-20 主人令「有名字的武将都要安置在据点」：坎尼战役两位罗马执政官 + 末代名将埃提乌斯 → 罗马城；ROMA×古典＝罗马军团







        { generalId: 'baolusi', generalName: '保卢斯', portrait: '/assets/ROMA/baolusi.png', legionName: '古典时代罗马军团' , eliteName: '罗马军团', eliteTier: 1},







        { generalId: 'waluo', generalName: '瓦罗', portrait: '/assets/ROMA/waluo.png', legionName: '古典时代罗马军团' , eliteName: '罗马军团', eliteTier: 1},







        { generalId: 'aitiliusi', generalName: '埃提乌斯', portrait: '/assets/ROMA/aitiliusi.png', legionName: '古典时代罗马军团' , eliteName: '罗马野战军', eliteTier: 2},







        // 🔴 [2026-10-20 首战规则] 教皇利奥九世＝1053 奇维塔特之战教皇联军主帅（被诺曼人击败被俘）→ 罗马城·罗马帝国（教皇国无独立势力，挂该城势力，报告）；普将；封建×罗马＝封建时代教皇国军团；立绘留空







        { generalId: 'luoma_diguo_leo_ix', legionName: '城堡时代教廷军团', generalName: '利奥九世', portrait: '/assets/ROMA/luoma_diguo_leo_ix.png' },







        // 🔴 [2026-10-20 首战规则] 西阿格里乌斯＝苏瓦松罗马残部首领（486 苏瓦松之战被克洛维击败）→ 罗马城·罗马帝国；普将；立绘留空







        { generalId: 'luoma_xiageliwusi', generalName: '西阿格里乌斯', portrait: '/assets/ROMA/luoma_xiageliwusi.png', legionName: '古典时代罗马军团' , eliteName: '苏瓦松边军', eliteTier: 4 },   // 🔴 486 高卢罗马残部的晚期边军（原配「罗马军团」是帝国早期军团）







        // 2026-10-20 主人令「触发历史剧本时作为剧本出现，不触发时作为武将」：三位罗马皇帝落罗马城







        { generalId: 'bfe3_77', generalName: '瓦勒良', portrait: '/assets/ROMA/bfe3_77.png', legionName: '古典时代罗马军团' , eliteName: '罗马军团', eliteTier: 1},







        { generalId: 'bfe3_79', generalName: '奥勒良', portrait: '/assets/ROMA/bfe3_79.png', legionName: '古典时代罗马军团' , eliteName: '达马提亚骑', eliteTier: 2},







        { generalId: 'bfe3_81', generalName: '马克森提乌斯', portrait: '/assets/ROMA/bfe3_81.png', legionName: '古典时代罗马军团' , eliteName: '罗马禁卫军', eliteTier: 2},







        // 名将双身份：霍诺留（据点武将＋剧本敌将）







        { generalId: 'bfe3_91', generalName: '霍诺留', portrait: '/assets/ROMA/bfe3_91.png', legionName: '古典时代罗马军团' , eliteName: '西罗马卫军', eliteTier: 4},







    ],







    xiongren: { generalId: 'xiongren_atila', generalName: '阿提拉', portrait: '/assets/HUNS/xiongren_atila.png' },







    kejila: { generalId: 'kejila_shulunbao', generalName: '舒伦堡', portrait: '/assets/LATIN/kejila_shulunbao.png' },







    putaoya: { generalId: 'gen_afonso_henriques', generalName: '阿方索一世', portrait: '/assets/PORTUGUESE/gen_afonso_henriques.png' },















    habusibao: { generalId: 'gen_maximilian', generalName: '马克西米', portrait: '/assets/GERMANIC/habusibao_makeximi.png' },







    boximiya: { generalId: 'gen_jan_zizka', generalName: '扬杰斯卡', portrait: '/assets/BOHEMIANS/gen_jan_zizka.png' },







    mazhaer: [
        // 🔴 [2026-10-20 主人令「名将剧情要写最知名战役」] 拉约什二世＝匈牙利国王（1526 莫哈奇战死）→ 布达佩斯（MAGYAR）；帝国时代骠骑先锋军团；立绘留空
        { generalId: 'gen_lajos_ii', generalName: '拉约什二世', portrait: '/assets/MAGYAR/gen_lajos_ii.png', legionName: '帝国时代骠骑先锋军团' },







        { generalId: 'mazhaer_majiashi', generalName: '马加什一世', portrait: '/assets/MAGYAR/mazhaer_majiashi.png' },







        // 🔴 [2026-10-20 首战规则] 贝拉四世＝匈牙利王（1241 赛约河败于拔都，后重建王国）→ 布达佩斯·匈牙利；普将；封建×马扎尔＝封建时代马扎尔军团；立绘留空







        { generalId: 'mazhaer_bela_iv', legionName: '城堡时代匈牙利王国军团', generalName: '贝拉四世', portrait: '/assets/MAGYAR/mazhaer_bela_iv.png' },







        // 🔴 [2026-10-20 首战规则] 查理一世＝匈牙利安茹王朝国王（1330 波萨达被巴萨拉布击败）→ 布达佩斯·匈牙利；普将；城堡×马扎尔＝城堡时代匈牙利王国军团；立绘留空







        { generalId: 'mazhaer_charles_i', legionName: '城堡时代匈牙利王国军团', generalName: '查理一世', portrait: '/assets/MAGYAR/mazhaer_charles_i.png' },







    ],







    xiongyati: { generalId: 'xiongyati_yannuoshi', generalName: '匈雅提亚诺什', portrait: '/assets/MAGYAR/xiongyati_yannuoshi.png' },







    falanji: [







        { generalId: 'gen_charles_martel', generalName: '查理马特', portrait: '/assets/FRANKS/gen_charles_martel.png' },














        // 🔴 [2026-10-20 首战规则] 鲍德温一世＝第四次十字军首领、拉丁帝国皇帝（1205 阿德里安堡被卡洛扬击败被俘）→ 科隆·法兰克（拉丁帝国无独立势力，挂法兰克并报告）；名将；立绘留空







        { generalId: 'falanji_baodewen', legionName: '城堡时代法兰西骑士军团', generalName: '拉丁皇帝 鲍德温', portrait: '/assets/FRANKS/falanji_baodewen.png' },







        // 🔴 [2026-10-20 主人令「放到离他事发地最近的相同建筑风格文化的据点」「所有武将都这么处理，不要擅自添加据点」] 事发地＝沃林根战役（科隆） → 最近同风格据点科隆







        // 🔴 [2026-10-20 首战规则] 西格弗里德＝科隆大主教（1288 沃林根战役联军主帅，败于布拉班特公爵约翰一世）→ 科隆；普将；封建×法兰克＝封建时代法兰克军团；立绘留空







        { generalId: 'hre_siegfried', legionName: '城堡时代法兰西骑士军团', generalName: '西格弗里德', portrait: '/assets/FRANKS/hre_siegfried.png' },







    ],







    jialuolin: { generalId: 'gen_charlemagne', generalName: '查理曼', portrait: '/assets/FRANKS/gen_charlemagne.png' },







    rierman: [
        { generalId: 'bfe3_86', generalName: '克诺多马尔', portrait: '/assets/GERMANIC/bfe3_86.png', factionId: 'rierman', legionName: '古典时代条顿军团' },







        { generalId: 'gen_otto_great', generalName: '奥托一世', portrait: '/assets/GERMANIC/rierman_aotuoyishi.png' },














    ],







    pelianci: { generalId: 'pelianci_hengli2', generalName: '亨利二世', portrait: '/assets/GERMANIC/pelianci_hengliershi.png' },







    shiwaben: { generalId: 'gen_ulrich_augsburg', generalName: '乌尔里希', portrait: '/assets/GERMANIC/shiwaben_shengwuerlixi.png' },







    asikanani: { generalId: 'gen_albrecht_bear', generalName: '阿尔布雷', portrait: '/assets/GERMANIC/asikanani_aerbulei.png' },







    wende: { generalId: 'gen_gero_margrave', generalName: '杰罗', portrait: '/assets/GERMANIC/wende_jieluobojue.png' },







    bafaliya: [







        { generalId: 'gen_tassilo_iii', generalName: '塔西洛三世', portrait: '/assets/GERMANIC/bafaliya_taxiluosanshi.png' },







        // 🔴 [2026-10-20 主人令「放到离他事发地最近的相同建筑风格文化的据点」「所有武将都这么处理，不要擅自添加据点」] 事发地＝维特科夫山战役（布拉格） → 最近同风格据点雷根斯堡







        { generalId: 'bfe_sigismund', legionName: '城堡时代德意志骑士军团', generalName: '西吉斯蒙德', portrait: '/assets/GERMANIC/bfe_sigismund.png' , eliteName: '德意志骑士', eliteTier: 2},







        // 🔴 [2026-10-20 主人令「遇到问题先看符合历史，下结论再动手」] 首战回补安置按史实复核：卡洛曼＝东法兰克巴伐利亚王，驻雷根斯堡；科隆不是他的驻地 → 放雷根斯堡（bafaliya，风格 GERMANIC）；仍挂本政权 falanji
        { generalId: 'falanji_kalman', factionId: 'falanji', generalName: '卡洛曼', portrait: '/assets/GERMANIC/falanji_kalman.png' },
    ],







    huohengsuolun: { generalId: 'gen_frederick_i_nuremberg', generalName: '腓特烈一世', portrait: '/assets/GERMANIC/huohengsuolun_feitelieyishi.png' },







    mozeer: { generalId: 'gen_constantine_great', generalName: '君士坦丁', portrait: '/assets/LATIN/gen_constantine_great.png' },







    ruishi: { generalId: 'gen_winkelried', generalName: '温克尔里德', portrait: '/assets/GERMANIC/ruishi_ciwenli.png' },







    aersasi: { generalId: 'gen_julian_apostate', generalName: '尤里安', portrait: '/assets/GERMANIC/aersasi_youlian.png' },







    // 斯瓦托普卢克＝大摩拉维亚国王（摩拉维亚势力只是同国另一据点）→ 挂大摩拉维亚







    molaweiya: { generalId: 'gen_swatopluk', generalName: '斯瓦托', portrait: '/assets/BOHEMIANS/gen_swatopluk.png', factionId: 'damolaweiya' },







    damolaweiya: { generalId: 'gen_mojmir_i', generalName: '莫伊米尔', portrait: '/assets/BOHEMIANS/gen_mojmir_i.png' },















    luosi: { generalId: 'gen_yaroslav', generalName: '雅罗斯拉夫', portrait: '/assets/SLAVIC/luosi_yaluosilafu.png' },







    liulike: [
        { generalId: 'gen_alexander_nef', generalName: '涅夫斯基', portrait: '/assets/SLAVIC/liulike_niefusiji.png' },
        { generalId: 'gen_rurik', generalName: '留里克', portrait: '', legionName: '封建时代瓦良格军团' },
        { generalId: 'gen_sineus', generalName: '西涅乌斯', portrait: '', legionName: '封建时代瓦良格军团' },
    ],







    mosike_gongguo: [



        { generalId: 'gen_dmitry_donskoy', generalName: '顿斯科伊', portrait: '/assets/SLAVIC/mosike_gongguo_dunsikeyi.png' },



        // 🔴 [2026-10-20 首战规则] 瓦西里三世＝莫斯科大公（1521 击退克里米亚远征）→ 莫斯科（SLAVIC）；帝国时代俄罗斯军团；立绘留空



        { generalId: 'gen_vasili_iii', generalName: '瓦西里三世', portrait: '/assets/SLAVIC/gen_vasili_iii.png', legionName: '帝国时代俄罗斯军团' },



    ],







    eluosi_diguo: { generalId: 'eluosi_diguo_peter', generalName: '彼得大帝', portrait: '/assets/SLAVIC/eluosi_diguo_peter.png' },







    xieerpuhuofu_gongguo: { generalId: 'gen_vladimir_andreyevich', generalName: '勇者弗拉基', portrait: '/assets/SLAVIC/xieerpuhuofu_gongguo_yongzhefulaji.png' },







    fulajimier_gongguo: { generalId: 'gen_andrey_bogolyub', generalName: '安德烈', portrait: '/assets/SLAVIC/fulajimier_gongguo_andelie.png' },







    daniebo: [
        { generalId: 'gen_romshlav', generalName: '罗姆什拉夫', portrait: '/assets/SLAVIC/daniebo_luomushenlafu.png' },
        { generalId: 'bfe_smolensk_voivode', generalName: '尤里·格列博维奇', portrait: '/assets/SLAVIC/bfe_smolensk_voivode.png', factionId: 'litaowan', legionName: '帝国时代俄罗斯军团' },
    ],







    qiernigeweifu_gongguo: { generalId: 'gen_mstislav', generalName: '姆斯蒂', portrait: '/assets/SLAVIC/qiernigeweifu_gongguo_musidi.png' },







    jialixiya: { generalId: 'gen_daniel_galitsky', generalName: '丹尼尔', portrait: '/assets/SLAVIC/jialixiya_dannier.png' },







    pusikefu_gongheguo: { generalId: 'gen_daumantas', generalName: '道曼塔斯', portrait: '/assets/SLAVIC/pusikefu_gongheguo_daomantasi.png' },







    ouka: { generalId: 'gen_yuri_ryazan', generalName: '尤里', portrait: '/assets/SLAVIC/ouka_youli.png' },







    xideweina: { generalId: 'gen_breslav', generalName: '布列斯拉夫', portrait: '/assets/SLAVIC/xideweina_buliesilafu.png' },







    jinzhang: [







        { generalId: 'gen_batu', generalName: '拔都', portrait: '/assets/CENTRAL_ASIA/gen_batu.png' },



        // 🔴 [2026-10-20 首战规则] 库特卢格·布加＝金帐王公（1362 蓝水河三王之一，被阿尔吉尔达斯击败）→ 萨莱（CENTRAL_ASIA）；城堡×中部亚洲＝城堡时代察合台军团；立绘留空



        { generalId: 'gen_kutlug_buga', generalName: '库特卢格·布加', portrait: '/assets/CENTRAL_ASIA/gen_kutlug_buga.png', legionName: '城堡时代察合台军团' },



        // 🔴 [2026-10-20 首战规则] 马麦＝金帐权臣（1380 库利科沃被德米特里击败）→ 萨莱（CENTRAL_ASIA）；城堡时代察合台军团；立绘留空



        { generalId: 'gen_mamai', generalName: '马麦', portrait: '/assets/CENTRAL_ASIA/gen_mamai.png', legionName: '城堡时代察合台军团' },







        { generalId: 'gen_astrakhan_khan', generalName: '阿斯特拉', portrait: '/assets/CENTRAL_ASIA/gen_astrakhan_khan.png' },







        // 🔴 [2026-10-20 首战规则] 那海＝金帐权臣、实际统治者（1278 德鲁斯塔尔围攻伊瓦伊洛）→ 萨莱·金帐；名将；封建×中亚＝封建时代河中军团；立绘留空







        { generalId: 'jinzhang_nogai', legionName: '城堡时代察合台军团', generalName: '那海', portrait: '/assets/CENTRAL_ASIA/jinzhang_nogai.png' },







    ],







    baojiaer: [







        { generalId: 'gen_ulugh_muhammad', generalName: '兀鲁黑', portrait: '/assets/CENTRAL_ASIA/gen_ulugh_muhammad.png' },







        { generalId: 'gen_karasakal', generalName: '卡拉萨卡尔', portrait: '/assets/CENTRAL_ASIA/gen_karasakal.png', legionName: '帝国时代乌兹别克军团' },







    ],







    baizanting: [
        { generalId: 'bfe_isaac_komnenos', generalName: '伊萨克·科穆宁', portrait: '/assets/BYZANTINE/bfe_isaac_komnenos.png', legionName: '城堡时代拜占庭军团' },
        { generalId: 'bfe_nikephoros_ii', generalName: '尼基弗鲁斯二世', portrait: '/assets/BYZANTINE/bfe_nikephoros_ii.png', legionName: '封建时代拜占庭军区军团' },







        { generalId: 'gen_basil_ii', generalName: '巴西尔二世', portrait: '/assets/BYZANTINE/gen_basil_ii.png' },



        // 🔴 [2026-10-20 首战规则] 君士坦丁十一世＝拜占庭末帝（1453 君士坦丁堡陷落战死）→ 君士坦丁堡（BYZANTINE）；城堡时代拜占庭军团；立绘留空



        { generalId: 'gen_constantine_xi', generalName: '君士坦丁十一世', portrait: '/assets/BYZANTINE/gen_constantine_xi.png', legionName: '城堡时代拜占庭军团' },







        // 2026-10-20：尼基弗鲁斯·福卡斯（拜占庭皇帝 963–969）→ 君士坦丁堡；BYZANTINE×封建＝拜占庭军区军团







        { generalId: 'gen_nikephoros_phokas', generalName: '福卡斯', portrait: '/assets/BYZANTINE/gen_nikephoros_phokas.png', legionName: '封建时代拜占庭军区军团' },







        // 名将双身份：阿内吉斯克鲁斯（据点武将＋剧本敌将）







        { generalId: 'bfe3_92', generalName: '阿内吉斯克鲁斯', portrait: '/assets/BYZANTINE/bfe3_92.png', legionName: '古典时代东罗马军团' , eliteName: '拜占庭卫军', eliteTier: 3},







        // 🔴 [2026-10-20 首战规则] 尼基弗鲁斯一世＝拜占庭皇帝（811 普利斯卡战役战死）→ 君士坦丁堡·拜占庭；名将；立绘留空







        { generalId: 'baizanting_nikephoros_i', generalName: '尼基弗鲁斯一世', portrait: '/assets/BYZANTINE/baizanting_nikephoros_i.png' },







        // 🔴 [2026-10-20 首战规则] 罗曼努斯一世＝拜占庭海军将领/后为皇帝（917 阿海洛战役拜占庭主帅，大败）→ 君士坦丁堡·拜占庭；名将；立绘留空







        { generalId: 'baizanting_romanosi', generalName: '罗曼努斯一世', portrait: '/assets/BYZANTINE/baizanting_romanosi.png' },







        // 🔴 [2026-10-20 首战规则] 伊萨克二世·安格洛斯＝拜占庭皇帝（1190 特里亚夫纳被保加利亚阿森一世击败）→ 君士坦丁堡·拜占庭；普将；立绘留空







        { generalId: 'baizanting_isaac_ii', legionName: '城堡时代拜占庭军团', generalName: '伊萨克二世', portrait: '/assets/BYZANTINE/baizanting_isaac_ii.png' },







        // 🔴 [2026-10-20 首战规则] 阿莱克修斯五世＝拜占庭末帝（1204 君士坦丁堡被十字军攻陷）→ 君士坦丁堡·拜占庭；普将；立绘留空







        { generalId: 'baizanting_alexios_v', legionName: '城堡时代拜占庭军团', generalName: '阿莱克修斯五世', portrait: '/assets/BYZANTINE/baizanting_alexios_v.png' },







    ],







    taolika: { generalId: 'gen_aspurgus', generalName: '阿斯普尔', portrait: '/assets/BYZANTINE/gen_aspurgus.png' },







    bosi_puluosi: { generalId: 'bosi_puluosi_liukong', generalName: '琉孔一世', portrait: '/assets/GREECE/bosi_puluosi_liukong.png' },







    kelimiya: { generalId: 'gen_caffa_consul', generalName: '奥贝托·斯夸尔', portrait: '/assets/LATIN/kelimiya_aobeituosikuaer.png' },







    keluodiya: { generalId: 'gen_nikola_zrinski', generalName: '兹林斯基', portrait: '/assets/SLAVIC/gen_nikola_zrinski.png' },







    mengtainiya: { generalId: 'mengtainiya_radu_iii', generalName: '拉杜三世', portrait: '/assets/SLAVIC/mengtainiya_radu_iii.png' },







    litaowan: [







        { generalId: 'gen_gediminas', generalName: '格迪米纳斯', portrait: '/assets/LITHUANIANS/gen_gediminas.png' },







        // 2026-10-20：雅盖沃（立陶宛大公、波兰国王，约 1351–1434）→ 维尔纽斯；LITHUANIANS×城堡＝立陶宛大公国军团







        { generalId: 'gen_jogaila', generalName: '雅盖沃', portrait: '/assets/LITHUANIANS/gen_jogaila.png', legionName: '城堡时代立陶宛大公国军团' , eliteName: '立陶宛骑士', eliteTier: 3},







    ],







    bolan: { generalId: 'bolan_suobiesiji', generalName: '索别斯基', portrait: '/assets/POLES/bolan_suobiesiji.png' },







    // ── 2026-08-04 新增：普热梅斯二世（波兹南公爵/大波兰公/波兰国王）──







    dabolan: { generalId: 'gen_przemysl_ii', generalName: '普热梅斯', portrait: '/assets/POLES/gen_przemysl_ii.png' },







    dunhe: { generalId: 'gen_mikhail_tatarinov', generalName: '塔塔里诺夫', portrait: '/assets/SLAVIC/dunhe_tatalinuofu.png' },







    piyasite: { generalId: 'gen_boleslaw_brave', generalName: '勇者波列', portrait: '/assets/POLES/gen_boleslaw_brave.png' },







    hongluseniya: { generalId: 'gen_jadwiga', generalName: '雅德维加', portrait: '/assets/POLES/gen_jadwiga.png' },







    baojian_qishi: { generalId: 'gen_albert_riga', generalName: '阿尔伯特·冯·布克斯赫夫登', portrait: '/assets/GERMANIC/gen_albert_riga.png' },







    teweier_gongguo: { generalId: 'gen_mikhail_tver', generalName: '米哈伊尔', portrait: '/assets/SLAVIC/teweier_gongguo_mihayier.png' },







    suzidaer: { generalId: 'gen_dmitry_suzdal', generalName: '康斯坦丁诺', portrait: '/assets/SLAVIC/suzidaer_kangsitandingnuo.png' },







    gesake: { generalId: 'gen_bohdan_khmelnitsky', generalName: '赫梅利', portrait: '/assets/SLAVIC/gesake_hemeili.png' },







    moerdaweiya: { generalId: 'gen_stephen_great', generalName: '斯蒂芬', portrait: '/assets/SLAVIC/moerdaweiya_sidifendadi.png' },







    walajiyia: { generalId: 'gen_vlad_impaler', generalName: '弗拉德三世', portrait: '/assets/SLAVIC/walajiyia_fuladesanshi.png' },







    tiaodun_qishi: { generalId: 'gen_ulrich_jungingen', generalName: '容金根', portrait: '/assets/GERMANIC/tiaodun_qishi_wuerlixi.png' },







    liwoniya: { generalId: 'gen_prettenberg', generalName: '普雷特贝格', portrait: '/assets/GERMANIC/gen_prettenberg.png' },







    chude: { generalId: 'gen_vyacheslav_tartu', generalName: '维切斯拉夫', portrait: '/assets/LITHUANIANS/gen_vyacheslav_tartu.png' },







    kaleiliya: { generalId: 'kaleiliya_kelimu', generalName: '克利姆索博列夫', portrait: '/assets/SLAVIC/kaleiliya_kelimusuoboliefu.png' },







    deniesite: { generalId: 'gen_mehmed_giray', generalName: '迈赫迈德', portrait: '/assets/SLAVIC/deniesite_muhanmodegeli.png' },







    nieman: { generalId: 'gen_vytautas_great', generalName: '维托夫特', portrait: '/assets/LITHUANIANS/gen_vytautas_great.png' },







    fuerjia: { generalId: 'don_vorontsov', generalName: '沃隆佐夫', portrait: '/assets/SLAVIC/fuerjia_wolongzuofu_v2.png' },   // 察里津防区督军







    nuogai: { generalId: 'nogai_votkhovsky', generalName: '沃特霍夫斯基', portrait: '/assets/SLAVIC/nuogai_wotehuofusiji_v2.png' },   // 萨马拉防线守将（俄国边地）







    bashekeer: { generalId: 'bashkir_nagoy', generalName: '纳吉', portrait: '/assets/SLAVIC/bashekeer_naji_v2.png' },   // 乌法首任督军（俄国边地）







    xierhe: { generalId: 'xierhe_saerjue', generalName: '塞尔柱', portrait: '/assets/CENTRAL_ASIA/xierhe_saerjue.png' },







    beisilafu: { generalId: 'gen_sergey_belgorod', generalName: '谢尔盖', portrait: '/assets/SLAVIC/beisilafu_xieergai.png' },







    // ── 2026-08-04 新增：多涅茨（哈尔科夫团上校，抗鞑靼、扩建团境）──







    siluoboda: { generalId: 'gen_grigory_donets', generalName: '多涅茨', portrait: '/assets/SLAVIC/siluoboda_duonieci.png' },







    // ── 2026-08-04 新增：萨布罗夫（沃罗涅日首任督军，主持建堡）──







    yedi: { generalId: 'gen_semyon_saburov', generalName: '萨布罗夫', portrait: '/assets/SLAVIC/yedi_sabuluofu.png' },







    eguo_biandi: { generalId: 'eguo_zasekin', generalName: '扎谢金', portrait: '/assets/SLAVIC/eguo_zasekin.png' },   // 萨拉托夫建城者







    peilieya_gongguo: { generalId: 'gen_vladimir_monomakh', generalName: '莫诺马赫', portrait: '/assets/SLAVIC/peilieya_gongguo_monuomahe.png' },







    weijiebusike_gongguo: { generalId: 'gen_algirdas', generalName: '奥尔格尔德', portrait: '/assets/LITHUANIANS/gen_algirdas.png' },















    qin: [







        { generalId: 'qin_simacuo', generalName: '司马错', portrait: '/assets/CENTRAL/qin_simacuo.png' },







        // 🔴 [2026-10-20 主人令「放到离他事发地最近的相同建筑风格文化的据点」「所有武将都这么处理，不要擅自添加据点」] 事发地＝助光武夹击隗嚣陇右战 → 最近同风格据点天水







        { generalId: 'bfe_niu_han', generalName: '隗嚣将 牛邯', portrait: '/assets/CENTRAL/bfe_niu_han.png' , legionName: '古典时代华夏军团', eliteName: '陇西骑兵', eliteTier: 4},







    ],







    tang: [
        { generalId: 'bfe3_57', generalName: '樊参', portrait: '/assets/CENTRAL/bfe3_57.png', factionId: 'han_d', legionName: '古典时代华夏军团' },
        { generalId: 'bfe_li_song', generalName: '更始将 李松', portrait: '/assets/CENTRAL/bfe_li_song.png', factionId: 'han_d', legionName: '古典时代华夏军团' },
        { generalId: 'bfe3_35', generalName: '公孙敖', portrait: '/assets/CENTRAL/bfe3_35.png', factionId: 'han_d', legionName: '古典时代华夏军团' },
        { generalId: 'bfe3_56', generalName: '王寻', portrait: '/assets/CENTRAL/bfe3_56.png', factionId: 'dixiang', legionName: '古典时代华夏军团' },
        { generalId: 'bfe_ma_heluo', generalName: '马何罗', portrait: '/assets/CENTRAL/bfe_ma_heluo.png', factionId: 'han_d', legionName: '古典时代华夏军团' },







        { generalId: 'tang_lishimin', generalName: '李世民', portrait: '/assets/CENTRAL/tang_lishimin.png' },
        // 🔴 [2026-10-20 主人令] 李信＝秦将（前225 攻楚被项燕大破）→ 长安（秦旗，CENTRAL）；古典时代华夏军团；立绘留空
        { generalId: 'gen_li_xin', generalName: '李信', portrait: '/assets/CENTRAL/gen_li_xin.png', factionId: 'qin', legionName: '古典时代华夏军团' , eliteName: '秦锐士', eliteTier: 2},







        // 屠睢（秦将，站长安、挂秦旗）







        { generalId: 'bfe3_14', generalName: '屠睢', portrait: '/assets/CENTRAL/bfe3_14.png', legionName: '古典时代华夏军团', factionId: 'qin', eliteName: '秦锐士', eliteTier: 2 },   // 🔴 精锐随将：秦将配秦锐士（不配唐玄甲军）







        // 王离（秦将，站长安、挂秦旗）







        { generalId: 'bfe3_17', generalName: '王离', portrait: '/assets/CENTRAL/bfe3_17.png', legionName: '古典时代华夏军团', factionId: 'qin', eliteName: '秦锐士', eliteTier: 2 },   // 🔴 精锐随将：秦将配秦锐士（不配唐玄甲军）







        // 王龁（秦将，站长安、挂秦旗）







        { generalId: 'bfe3_9', generalName: '王龁', portrait: '/assets/CENTRAL/bfe3_9.png', legionName: '古典时代华夏军团', factionId: 'qin', eliteName: '秦锐士', eliteTier: 2 },   // 🔴 精锐随将：秦将配秦锐士（不配唐玄甲军）







        // 胡阳（秦将，站长安、挂秦旗）







        { generalId: 'bfe3_7', generalName: '胡阳', portrait: '/assets/CENTRAL/bfe3_7.png', legionName: '古典时代华夏军团', factionId: 'qin', eliteName: '秦锐士', eliteTier: 2 },   // 🔴 精锐随将：秦将配秦锐士（不配唐玄甲军）







        // 🔴 [2026-10-20 首战规则] 李宓＝754 唐征南诏主帅（西洱河全军覆没）→ 长安·唐国；普将；立绘留空







        // 🔴 精锐随将：754 年李宓领的是剑南戍兵，不是李世民的玄甲军







        { generalId: 'tang_limi', generalName: '李宓', portrait: '/assets/CENTRAL/tang_limi.png', legionName: '封建时代中原军团', eliteName: '剑南兵', eliteTier: 4 },







        // 🔴 [2026-10-20 首战规则] 朱泚＝784 据长安僭号的唐叛将（史实内战，双方同属唐国势力）→ 长安·唐国；普将；立绘留空







        { generalId: 'tang_zhuci', generalName: '朱泚', portrait: '/assets/CENTRAL/tang_zhuci.png', legionName: '封建时代中原军团', eliteName: '泾原乱兵', eliteTier: 4 },







        // 🔴 [2026-10-20 主人「武将安置错误请修复，例如霍去病」] 霍去病：酒泉只是传说，他没有驻过；骠骑将军驻京师 → 长安（汉国）







        { generalId: 'suzhou_huoqubing', generalName: '霍去病', portrait: '/assets/CENTRAL/suzhou_huoqubing.png', legionName: '古典时代华夏军团', factionId: 'han_d' },







        // 🔴 卫青：朔方是他收复的郡，不是驻地；大将军驻京师 → 长安（汉国）







        { generalId: 'shuofang_weiqing', generalName: '卫青', portrait: '/assets/CENTRAL/shuofang_weiqing.png', legionName: '古典时代华夏军团', factionId: 'han_d' },







        // 🔴 [2026-10-20 主人令「遇到问题先看符合历史，下结论再动手」] 首战回补安置按史实复核：宇文述＝隋左卫大将军，驻隋都大兴（长安）；汉东（随州）只是杨坚封地，与他无涉 → 放长安（tang，风格 CENTRAL）；仍挂本政权 sui
        { generalId: 'sui_yuwenshu', factionId: 'sui', generalName: '宇文述', portrait: '/assets/CENTRAL/sui_yuwenshu.png' , eliteName: '隋军府兵', eliteTier: 4 },
        // 🔴 [2026-10-20 主人令「遇到问题先看符合历史，下结论再动手」] 首战回补安置按史实复核：汪乔年＝明陕西总督，总督衙门驻西安（长安）；1642 襄城之败是出潼关救援 → 放长安（tang，风格 CENTRAL）；仍挂本政权 ming_d
        { generalId: 'gen_wang_qiaonian', factionId: 'ming_d', legionName: '城堡时代中华军团', generalName: '汪乔年', portrait: '/assets/CENTRAL/gen_wang_qiaonian.png', },
    ],







    wuzhou_d: [
        { generalId: 'bfe3_76', generalName: '曹爽', portrait: '/assets/CENTRAL/bfe3_76.png', factionId: 'cao_d', legionName: '古典时代华夏军团' },
        { generalId: 'wuzhou_d_wuzetian', generalName: '武则天', portrait: '/assets/CENTRAL/wuzhou_d_wuzetian.png' },
        { generalId: 'bfe_prince_chao', generalName: '王子朝', portrait: '/assets/CENTRAL/bfe_prince_chao.png', factionId: 'zhou', legionName: '古典时代华夏军团' },
        // 🔴 [2026-10-20 主人令「遇到问题先看符合历史，下结论再动手」] 首战回补安置按史实复核：元英＝北魏中山王，507 钟离之战时北魏已于 494 年迁都洛阳，大同（平城）已非都城 → 放洛阳（wuzhou_d，风格 CENTRAL）；仍挂本政权 tuoba
        { generalId: 'tuoba_yuanying', factionId: 'tuoba', legionName: '古典时代华夏军团', generalName: '元英', portrait: '/assets/CENTRAL/tuoba_yuanying.png' },
    ],







    ming_d: [



        { generalId: 'ming_d_zhudi', generalName: '朱棣', portrait: '/assets/WEI/ming_d_zhudi.png' },



        // 🔴 [2026-10-20 首战规则] 王振＝明司礼监太监（1449 土木堡之变统军乱政，死于乱军）→ 北京（WEI）；城堡时代燕云军团；立绘留空



        { generalId: 'gen_wangzhen', generalName: '王振', portrait: '/assets/WEI/gen_wangzhen.png', legionName: '城堡时代燕云军团' },



        // 🔴 [2026-10-20 首战规则] 王通＝明征夷将军（1426 崒泥关洞被黎利击败）→ 北京（WEI）；城堡时代燕云军团；立绘留空



        { generalId: 'gen_wang_tong', generalName: '王通', portrait: '/assets/WEI/gen_wang_tong.png', legionName: '城堡时代燕云军团' },



        // 🔴 [2026-10-20 首战规则] 王骥＝明兵部尚书（三征麓川，1441 潞江）→ 北京（WEI）；城堡时代燕云军团；立绘留空



        { generalId: 'gen_wang_ji', generalName: '王骥', portrait: '/assets/WEI/gen_wang_ji.png', legionName: '城堡时代燕云军团' },

        // 🔴 [2026-10-20 首战规则] 仇鸾＝明大同总兵（1550 庚戌之变勤王统帅）→ 北京（WEI）；城堡时代燕云军团；立绘留空

        { generalId: 'gen_qiu_luan', generalName: '仇鸾', portrait: '/assets/WEI/gen_qiu_luan.png', legionName: '城堡时代燕云军团' },

        // 🔴 [2026-10-20 首战规则] 杨镐＝明辽东经略（1619 萨尔浒四路丧师）→ 北京（WEI）；城堡时代燕云军团；立绘留空

        { generalId: 'gen_yang_hao', generalName: '杨镐', portrait: '/assets/WEI/gen_yang_hao.png', legionName: '城堡时代燕云军团' },

        // 🔴 [2026-10-20 首战规则] 洪承畴＝明蓟辽总督（1642 松锦被俘降清）→ 北京（WEI）；城堡时代燕云军团；立绘留空

        { generalId: 'gen_hong_chengchou', generalName: '洪承畴', portrait: '/assets/WEI/gen_hong_chengchou.png', legionName: '城堡时代燕云军团' },




    ],







    jinling: [



        // 🔴 [2026-10-20 首战规则] 李景隆＝建文帝南军主帅（1400 白沟河被朱棣击败）→ 南京（JIANGNAN）；城堡时代江南军团；立绘留空



        { generalId: 'gen_li_jinglong', generalName: '李景隆', portrait: '/assets/JIANGNAN/gen_li_jinglong.png', legionName: '城堡时代江南军团' },
        // 🔴 [2026-10-20 主人令「名将剧情要写他最知名的战役」] 李秀成＝太平天国忠王（1864 天京守城统帅，城破被俘）→ 金陵/南京（JIANGNAN），挂太平旗；帝国时代两江军团；立绘留空
        { generalId: 'gen_li_xiucheng', generalName: '李秀成', portrait: '/assets/JIANGNAN/gen_li_xiucheng.png', factionId: 'taiping', legionName: '起义军' },







        { generalId: 'jinling_tandaoji', generalName: '檀道济', portrait: '/assets/JIANGNAN/jinling_tandaoji.png' },







        // 🔴 [2026-10-20 首战规则] 萧宝卷＝南齐东昏侯（501 建康城破被杀）→ 金陵·南国；普将；军团按封建×江南＝封建时代江淮军团；立绘留空







        { generalId: 'nanqi_xiaobaojuan', generalName: '萧宝卷', portrait: '/assets/JIANGNAN/nanqi_xiaobaojuan.png', legionName: '封建时代江淮军团' , eliteName: '南齐台军', eliteTier: 4 },   // 🔴 南齐禁军「台军」（原配「量沙军」是刘宋檀道济的）







    ],







    guangzhou: { generalId: 'guangzhou_liuyin', generalName: '刘隐', portrait: '/assets/JIANGNAN/guangzhou_liuyin.png' },







    shu: [
        { generalId: 'bfe3_83', generalName: '李势', portrait: '/assets/BASHU/bfe3_83.png', factionId: 'shu', legionName: '古典时代巴蜀军团' },
        { generalId: 'bfe3_80', generalName: '张微', portrait: '/assets/BASHU/bfe3_80.png', factionId: 'shu', legionName: '古典时代巴蜀军团' },
        { generalId: 'bfe3_2', generalName: '芦子霸王', portrait: '/assets/BASHU/bfe3_2.png', factionId: 'shu', legionName: '古典时代巴蜀军团' },
        // 🔴 [2026-10-20 史实] 岳钟琪＝川陕总督，最知名驻扎成都；据点成都（BASHU）；帝国时代四川军团
        { generalId: 'qinghai_yuezhongqi', generalName: '岳钟琪', portrait: '/assets/BASHU/qinghai_yuezhongqi.png', factionId: 'manzhou_d', legionName: '帝国时代四川军团' },







        { generalId: 'shu_liubei', generalName: '刘备', portrait: '/assets/BASHU/shu_liubei.png' },







        // 名将双身份：诸葛瞻（据点武将＋剧本敌将）







        { generalId: 'bfe3_78', generalName: '诸葛瞻', portrait: '/assets/BASHU/bfe3_78.png', legionName: '古典时代巴蜀军团' , eliteName: '蜀汉卫军', eliteTier: 3},







    ],







    yangzhou: { generalId: 'yangzhou_wangping', generalName: '王平', portrait: '/assets/CENTRAL/yangzhou_wangping.png' },







    yang_zhou: [
        { generalId: 'bfe_sun_ru', generalName: '孙儒', portrait: '/assets/JIANGNAN/bfe_sun_ru.png', factionId: 'tang', legionName: '封建时代江淮军团' },
        { generalId: 'yang_zhou_yangxingmi', generalName: '杨行密', portrait: '/assets/JIANGNAN/yang_zhou_yangxingmi.png' },
        // 🔴 [2026-10-20 主人令/史实] 德兴阿＝清江北大营钦差大臣（正黄旗蒙古都统），大本营在扬州城郊雷塘、茱萸湾，扼瓜洲/仪征/六合；据点为扬州（广陵，JIANGNAN）；帝国时代两江军团
        { generalId: 'kalun_dexinga', generalName: '德兴阿', portrait: '/assets/JIANGNAN/kalun_dexinga.png', factionId: 'manzhou_d', legionName: '帝国时代两江军团' },
    ],







    // cheng 阳安：岳钟琪已迁赤斤@赤金堡







    pagan: { generalId: 'pagan_anulvtuo', generalName: '阿奴律陀', portrait: '/assets/BURMESE/pagan_anulvtuo.png' },







    liang_d: [







        { generalId: 'liang_d_zhangxun', generalName: '张巡', portrait: '/assets/CENTRAL/liang_d_zhangxun.png' },







        // 🔴 [2026-10-20 首战规则] 王景仁＝后梁将（911 柏乡之战主帅，被晋军击败）→ 商丘·梁国；普将；立绘留空







        { generalId: 'liang_d_wangjingren', generalName: '王景仁', portrait: '/assets/CENTRAL/liang_d_wangjingren.png' },







    ],







    qiuci: { generalId: 'qiuci_baiba', generalName: '白霸', portrait: '/assets/WESTERN/qiuci_baiba.png' },







    tubo: [







        { generalId: 'tubo_songzanganbu', generalName: '松赞干布', portrait: '/assets/TIBET/tubo_songzanganbu.png' },







        // 🔴 [2026-10-20 首战规则] 悉诺逻恭禄＝吐蕃名将（727 攻瓜州，被张守珪疑兵击退）→ 逻些·吐蕃；名将；立绘留空







        { generalId: 'tubo_xinuoluo', generalName: '悉诺逻恭禄', portrait: '/assets/TIBET/tubo_xinuoluo.png' },







        // 🔴 [2026-10-20 首战规则] 论莽热＝801 维州之战吐蕃主帅（被韦皋围歼）→ 逻些·吐蕃；普将；立绘留空







        { generalId: 'tubo_lunmangre', generalName: '论莽热', portrait: '/assets/TIBET/tubo_lunmangre.png' },














    ],







    menggu_d: [
        // 🔴 [2026-10-20 首战规则] 却图汗＝喀尔喀蒙古却图汗（1637 青海湖被固始汗击败处死）；库无喀尔喀却图部势力，借蒙古（报告）；帝国时代喀尔喀军团；立绘留空
        { generalId: 'gen_chogtu_khan', generalName: '却图汗', portrait: '/assets/MONGOL/gen_chogtu_khan.png', legionName: '帝国时代喀尔喀军团' },







        { generalId: 'menggu_d_chengjisihan', generalName: '成吉思汗', portrait: '/assets/MONGOL/menggu_d_chengjisihan.png' },







        // 🔴 [2026-10-20 首战规则] 蒙哥＝蒙古大汗（1259 攻钓鱼城，死于城下）→ 哈拉和林·蒙古；名将；封建×蒙古＝封建时代突厥军团；立绘留空







        { generalId: 'menggu_d_mongke', legionName: '城堡时代蒙古军团', generalName: '蒙哥', portrait: '/assets/MONGOL/menggu_d_mongke.png' },







    ],







    bohai: [







        { generalId: 'bohai_dazuorong', generalName: '大祚荣', portrait: '/assets/NORTHEAST/bohai_dazuorong.png' },







        // 🔴 [2026-10-20 首战规则] 大諲撰＝渤海末王（926 辽太祖攻灭忽汗城）→ 龙泉府·渤海；普将；立绘留空







        { generalId: 'bohai_dayinzhuan', generalName: '大諲撰', portrait: '/assets/NORTHEAST/bohai_dayinzhuan.png' },







    ],







    goryeo: { generalId: 'goryeo_jianghanzan', generalName: '姜邯赞', portrait: '/assets/KOREA/goryeo_jianghanzan.png' },







    ashikaga: [
        { generalId: 'ashikaga_zulizunshi', generalName: '足利尊氏', portrait: '/assets/JAPAN/ashikaga_zulizunshi.png' },
        // 🔴 [2026-10-20 首战规则] 明智光秀＝织田家臣（1582 本能寺之变后山崎败死）；库无明智势力，借室町（京都，报告）；城堡时代幕府军团；立绘留空
        { generalId: 'gen_akechi_mitsuhide', generalName: '明智光秀', portrait: '/assets/JAPAN/gen_akechi_mitsuhide.png', legionName: '城堡时代幕府军团' },
    ],







    tiemuer: { generalId: 'tiemuer_tiemuer', generalName: '帖木儿', portrait: '/assets/CENTRAL_ASIA/tiemuer_tiemuer.png' },







    siam: { generalId: 'siam_nalixuan', generalName: '纳黎萱', portrait: '/assets/KHMER/siam_nalixuan.png' },







    shang: [







        { generalId: 'shang_weiwuji', generalName: '魏无忌', portrait: '/assets/CENTRAL/shang_weiwuji.png' , legionName: '古典时代华夏军团' },







        { generalId: 'shang_fuhao', generalName: '妇好', portrait: '/assets/CENTRAL/shang_fuhao.png' , legionName: '先秦军团' },







    ],







    bing: [
        // 🔴 [2026-10-20 主人令「可以去找刘知远挂一起吗」「遇到问题先看符合历史」] 刘知远（后汉高祖，刘崇之兄）938 起任河东节度使镇太原，947 在太原称帝建后汉；一生根据地是太原（晋阳），从未以同州·长宁为驻地 → 由长宁迁晋阳与其弟刘崇同挂（河朔文化）；后汉不在势力库，不新建，仍用并州（bing）并报告
        { generalId: 'tongzhou_liuzhiyuan', factionId: 'bing', generalName: '刘知远', portrait: '/assets/WEI/tongzhou_liuzhiyuan.png', legionName: '封建时代河朔军团' },
        // 🔴 [2026-10-20 主人令「遇到问题先看符合历史」] 刘崇＝北汉世祖，都太原（晋阳），一生活动在太原；原挂上党·长子是首战回补时的临时安置，与史实不符（长子既非北汉都城，也不是他的驻地）→ 按「最知名驻扎地」放晋阳（WEI 河朔风格，与他的河朔文化一致）；北汉不在势力库，不新建势力，用晋阳所在的并州（bing）并报告
        { generalId: 'xin_liuchong', factionId: 'bing', generalName: '刘崇', portrait: '/assets/WEI/xin_liuchong.png', legionName: '封建时代河朔军团' },
        { generalId: 'bfe3_87', generalName: '慕容评', portrait: '', legionName: '古典时代太行军团' },







        { generalId: 'bing_liji', generalName: '李勣', portrait: '/assets/WEI/bing_liji.png' },







        // 名将双身份：袁绍（据点武将＋剧本敌将）







        { generalId: 'bfe3_71', generalName: '袁绍', portrait: '/assets/WEI/bfe3_71.png', legionName: '古典时代太行军团' , eliteName: '先登营', eliteTier: 2},







        // 🔴 [2026-10-20 五代抽查] 李克用：原挂光禄城（沙陀发源，不是最知名驻地）→ 晋阳（晋王都太原）；势力沙陀；精锐 沙陀鸦军 T1







        { generalId: 'shatuo_likeyong', generalName: '李克用', portrait: '/assets/WEI/shatuo_likeyong.png', factionId: 'shatuo', eliteName: '沙陀鸦军', eliteTier: 1 },







        // 🔴 [2026-10-20 五代抽查] 周德威：原挂清苑(保定)→晋阳（晋军总管随晋王）；势力沙陀；精锐 沙陀鸦军 T1







        { generalId: 'qingyuan_bd_zhoudewei', generalName: '周德威', portrait: '/assets/WEI/qingyuan_bd_zhoudewei.png', factionId: 'shatuo', eliteName: '沙陀鸦军', eliteTier: 1 },







        // 🔴 [2026-10-20 首战规则] 王禀＝北宋太原守将（1126 太原之战死守殉国）→ 晋阳（太原）·宋国；普将；封建×河朔＝封建时代河朔军团；立绘留空







        { generalId: 'song_wangbing', legionName: '城堡时代燕云军团', generalName: '王禀', portrait: '/assets/WEI/song_wangbing.png', factionId: 'song' },







        // 🔴 [2026-10-20 抽查] 李光弼：原挂乐成(河间)错——他最知名是守太原大捷（河东节度使）→ 晋阳；势力=唐国；精锐 河东军 T2







        { generalId: 'liwang_liguangbi', generalName: '李光弼', portrait: '/assets/WEI/liwang_liguangbi.png', factionId: 'tang', eliteName: '河东军', eliteTier: 2 },







    ],







    min: { generalId: 'min_wangshenzhi', generalName: '王审知', portrait: '/assets/JIANGNAN/min_wangshenzhi.png' },







    quanzhou: { generalId: 'quanzhou_liucongxiao', generalName: '留从效', portrait: '/assets/JIANGNAN/quanzhou_liucongxiao.png' },







    han_d: [







        { generalId: 'han_d_liubang', generalName: '刘邦', portrait: '/assets/CENTRAL/han_d_liubang.png' },







        // 名将双身份：李广利（据点武将＋剧本敌将）







        { generalId: 'bfe3_36', generalName: '李广利', portrait: '/assets/CENTRAL/bfe3_36.png', legionName: '古典时代华夏军团' , eliteName: '属国胡骑', eliteTier: 3},







    ],







    wei: [
        { generalId: 'bfe2_gongzi_ang', generalName: '公子卬', portrait: '/assets/WEI/bfe2_gongzi_ang.png', legionName: '古典时代太行军团' },
        { generalId: 'wei_wuqi', generalName: '吴起', portrait: '/assets/WEI/wei_wuqi.png' , legionName: '先秦军团' },
        { generalId: 'bfe2_pang_juan', generalName: '庞涓', portrait: '/assets/WEI/bfe2_pang_juan.png', legionName: '古典时代太行军团' },
    ],







    manzhou_d: [
        // 🔴 [2026-10-20 首战规则] 明瑞＝清云贵总督（1768 新街之战败于缅军，自尽）→ 沈阳（NORTHEAST）；帝国时代八旗军团；立绘留空
        { generalId: 'gen_mingrui', generalName: '明瑞', portrait: '/assets/NORTHEAST/gen_mingrui.png', legionName: '帝国时代八旗军团' },
        // 🔴 [2026-10-20 首战规则] 傅尔丹＝清靖边将军（1731 和通泊败于噶尔丹策零）→ 沈阳（NORTHEAST）；帝国时代八旗军团；立绘留空
        { generalId: 'gen_furdan', generalName: '傅尔丹', portrait: '/assets/NORTHEAST/gen_furdan.png', legionName: '帝国时代八旗军团' },
        // 🔴 [2026-10-20 首战规则] 康熙帝＝清圣祖（1690 乌兰布通亲征噶尔丹）→ 沈阳（NORTHEAST）；帝国时代八旗军团；立绘留空
        { generalId: 'gen_kangxi', generalName: '康熙', portrait: '/assets/NORTHEAST/gen_kangxi.png', legionName: '帝国时代八旗军团' },

        { generalId: 'manzhou_d_duoergun', generalName: '多尔衮', portrait: '/assets/NORTHEAST/manzhou_d_duoergun.png' },

        // 🔴 [2026-10-20 首战规则] 尼堪＝清敬谨亲王（1652 衡阳被李定国击毙）→ 沈阳（NORTHEAST）；城堡时代满洲军团；立绘留空

        { generalId: 'gen_nikan', generalName: '尼堪', portrait: '/assets/NORTHEAST/gen_nikan.png', legionName: '城堡时代大金军团' },

    ],







    xinluo: { generalId: 'xinluo_jinyuxin', generalName: '金庾信', portrait: '/assets/KOREA/xinluo_jinyuxin.png' },







    edo: { generalId: 'edo_dechuanjiakang', generalName: '德川家康', portrait: '/assets/JAPAN/edo_dechuanjiakang.png' },







    seljuq: [
        { generalId: 'seljuq_sangjiaer', generalName: '桑贾尔', portrait: '/assets/SASANIAN/seljuq_sangjiaer.png' },
        { generalId: 'bfe_tahir_king', generalName: '穆罕默德·伊本·塔希尔', portrait: '/assets/SASANIAN/bfe_tahir_king.png', factionId: 'xisi', legionName: '封建时代霍拉桑军团' },
        // 🔴 [2026-10-20 主人令「遇到问题先看符合历史，下结论再动手」] 首战回补安置按史实复核：穆斯林·本·赛义德＝呼罗珊总督，驻木鹿（梅尔夫）；724 年渴水日之战是呼罗珊军，不是大马士革 → 放木鹿（seljuq，风格 SASANIAN）；仍挂本政权 womaya
        { generalId: 'womaya_muslim', factionId: 'womaya', legionName: '封建时代霍拉桑军团', generalName: '穆斯林·本·赛义德', portrait: '/assets/SASANIAN/womaya_muslim.png' },
    ],







    chenla: { generalId: 'chenla_duyebamo', generalName: '阇耶跋摩', portrait: '/assets/KHMER/chenla_duyebamo.png' },







    sizhou: { generalId: 'sizhou_hanshizhong', generalName: '韩世忠', portrait: '/assets/CENTRAL/sizhou_hanshizhong.png' },







    // ── 日本区 2026-06-18 ──







    kai: { generalId: 'kai_wutianxinxuan', generalName: '武田信玄', portrait: '/assets/JAPAN/kai_wutianxinxuan.png' },







    echigo: { generalId: 'echigo_shangshanqianxin', generalName: '上杉谦信', portrait: '/assets/JAPAN/echigo_shangshanqianxin.png' },







    hashiba: [
        { generalId: 'hashiba_fengchenxiuji', generalName: '丰臣秀吉', portrait: '/assets/JAPAN/hashiba_fengchenxiuji.png' },
        // 🔴 [2026-10-20 首战规则] 石田三成＝西军统帅（1600 关原战败被斩）；佐和山城无据点，取姬路（JAPAN，报告）；帝国时代武家军团；立绘留空
        { generalId: 'gen_ishida_mitsunari', generalName: '石田三成', portrait: '/assets/JAPAN/gen_ishida_mitsunari.png', legionName: '帝国时代武家军团' },
    ],







    sanada_d: { generalId: 'sanada_d_zhentianxingcun', generalName: '真田幸村', portrait: '/assets/JAPAN/sanada_d_zhentianxingcun.png' },







    date_d: { generalId: 'date_d_yidazhengzong', generalName: '伊达政宗', portrait: '/assets/JAPAN/date_d_yidazhengzong.png' },







    owari: { generalId: 'owari_zhitianxinchang', generalName: '织田信长', portrait: '/assets/JAPAN/owari_zhitianxinchang.png' },







    totomi: { generalId: 'totomi_jiujingzhongci', generalName: '酒井忠次', portrait: '/assets/JAPAN/totomi_jiujingzhongci.png' },







    jinchuan: { generalId: 'jinchuan_jinchuanyiyuan', generalName: '今川义元', portrait: '/assets/JAPAN/jinchuan_jinchuanyiyuan.png' },







    aki: { generalId: 'aki_maoliyuanjiu', generalName: '毛利元就', portrait: '/assets/JAPAN/aki_maoliyuanjiu.png' },







    chosokabe: { generalId: 'chosokabe_changzongwobuyuanqin', generalName: '长宗我部', portrait: '/assets/JAPAN/chosokabe_changzongwobuyuanqin.png' },







    satsuma: { generalId: 'satsuma_daojinjiajiu', generalName: '岛津家久', portrait: '/assets/JAPAN/satsuma_daojinjiajiu.png' },







    otomo_d: { generalId: 'otomo_d_lihuadaoxue', generalName: '立花道雪', portrait: '/assets/JAPAN/otomo_d_lihuadaoxue.png' },







    izumo: { generalId: 'izumo_shanzhonglujie', generalName: '山中鹿介', portrait: '/assets/JAPAN/izumo_shanzhonglujie.png' },







    kaga_d: { generalId: 'kaga_d_xiajianlailian', generalName: '下间赖廉', portrait: '/assets/JAPAN/kaga_d_xiajianlailian.png' },







    iga_d: { generalId: 'iga_d_baididanbo', generalName: '百地丹波', portrait: '/assets/JAPAN/iga_d_baididanbo.png' },







    jibei2: { generalId: 'jibei2_qingshuizongzhi', generalName: '清水宗治', portrait: '/assets/JAPAN/jibei2_qingshuizongzhi.png' },







    yamato: { generalId: 'yamato_nanmuzhengcheng', generalName: '楠木正成', portrait: '/assets/JAPAN/yamato_nanmuzhengcheng.png' },







    aizu: { generalId: 'aizu_pushengshixiang', generalName: '蒲生氏乡', portrait: '/assets/JAPAN/aizu_pushengshixiang.png' },







    suwa_d: { generalId: 'suwa_d_zoufanglaizhong', generalName: '诹访赖重', portrait: '/assets/JAPAN/suwa_d_zoufanglaizhong.png' },







    shimotsuke: { generalId: 'shimotsuke_yudougongguanggang', generalName: '宇都宫广纲', portrait: '/assets/JAPAN/shimotsuke_yudougongguanggang.png' },







    higo_d: [
        { generalId: 'higo_d_juchiwuguang', generalName: '菊池武光', portrait: '/assets/JAPAN/higo_d_juchiwuguang.png' },
        // 🔴 [2026-10-20 首战规则] 龙造寺隆信＝肥前领主（1584 冲田畷战死）→ 熊本（JAPAN）；城堡时代幕府军团；立绘留空
        { generalId: 'gen_ryuzoji_takanobu', generalName: '龙造寺隆信', portrait: '/assets/JAPAN/gen_ryuzoji_takanobu.png', legionName: '城堡时代幕府军团' },
    ],







    iyo_d: { generalId: 'iyo_d_cunshangwuji', generalName: '村上武吉', portrait: '/assets/JAPAN/iyo_d_cunshangwuji.png' },







    nanbu: { generalId: 'nanbu_nanbuqingzheng', generalName: '南部晴政', portrait: '/assets/JAPAN/nanbu_nanbuqingzheng.png' },







    osumi: { generalId: 'osumi_ganfujianxu', generalName: '肝付兼续', portrait: '/assets/JAPAN/osumi_ganfujianxu.png' },







    // 🔴 [2026-09-19 主人令「武将和精锐和据点必须契合：最好是此处据点的守将、为此处做出贡献的、







    //    在此处镇守或当官、执行过任务也行；不要出生地在此没有贡献的人（如常山赵云）」]







    //    **镰仓的守将 = 源赖朝**（`gen_minamoto_yoritomo`）：







    //    1180 年于镰仓起兵、设**镰仓幕府**，此后坐镇镰仓施政，是整个源平合战的**总指挥**







    //    （义经、范赖都是他派出去的军势）。镰仓因他而成天下之中 —— 契合。







    //    ⚠️ 源赖朝立绘**留空** → 走政权夹 → 文化池回落；等主人放图后按约定填。







    // 🔴 [2026-09-19 主人质问「换武将和势力的时候，直接替换不就行了？为什么现在还多了一个武将」]







    //    **已直接替换**：源义经整个挪到 `genji_iyo`（松山，伊予守守地），







    //    此处原先为他「寄存记录」的那第二条已删除 —— 同一个武将不再挂两个势力键。







    //    镰仓 = 源赖朝一人，与全库「一势力 = 一据点 = 一武将」一致。







    genji: { generalId: 'gen_minamoto_yoritomo', generalName: '源赖朝', portrait: '/assets/JAPAN/genji_yuanlaichao.png' },







    // 🔴 [2026-09-19 主人令「行就换」] 松山（伊予国）的守将 = **源义经**（伊予守，伊予国即其守地）。







    //    与 genji（镰仓挂源赖朝）分开一个键：一势力一城，才能各挂各的守将。







    genji_iyo: { generalId: 'fujiwara_yuanyijing', generalName: '源义经', portrait: '/assets/JAPAN/fujiwara_yuanyijing.png' },















    // 🔴 [2026-09-19 主人令「先给奥州更换武将。新建一个」] 奥州藤原氏（陆奥·平泉）的当主。







    //    ⚠️ 立绘一律留空 → 走「本政权夹 → 本文化夹」回落（见 AGENTS.md §十三）。







    //    等主人放图后按约定填：**势力key_中文名拼音.png**（例 fujiwara_xiuheng.png）。







    fujiwara: { generalId: 'fujiwara_xiuheng', generalName: '藤原秀衡', portrait: '/assets/JAPAN/fujiwara_tengyuanxiuheng.png' },







    kakizaki: { generalId: 'kakizaki_liqiqingguang', generalName: '蛎崎庆广', portrait: '/assets/JAPAN/kakizaki_liqiqingguang.png' },







    ayinu: { generalId: 'ayinu_hushemoquan', generalName: '胡奢魔犬', portrait: '/assets/JAPAN/ayinu_hushemoquan.png' },







    so: { generalId: 'so_zongyizhi', generalName: '宗义智', portrait: '/assets/JAPAN/so_zongyizhi.png' },







    taira: [







        { generalId: 'taira_pingzhisheng', generalName: '平知盛', portrait: '/assets/JAPAN/taira_pingzhisheng.png' },







        // 🔴 [2026-10-20 首战规则] 平宗盛＝平家总帅（1180 富士川不战而溃）→ 赤间关·长门（平家）；普将；封建×日本＝封建时代平安军团；立绘留空







        { generalId: 'taira_pingzongsheng', legionName: '城堡时代幕府军团', generalName: '平宗盛', portrait: '/assets/JAPAN/taira_pingzongsheng.png' },







    ],







    lelang: { generalId: 'lelang_wangqi', generalName: '王颀', portrait: '/assets/KOREA/lelang_wangqi.png' },







    anmei: { generalId: 'anmei_yuwandaqin', generalName: '与湾大亲', portrait: '/assets/JAPAN/anmei_yuwandaqin.png' },















// ── 朝鲜区 2026-06-18 ──







    chen3: { generalId: 'chen3_jizhun', generalName: '箕准', portrait: '/assets/KOREA/chen3_jizhun.png' },







    joseon: { generalId: 'joseon_lichenggui', generalName: '李成桂', portrait: '/assets/KOREA/joseon_lichenggui.png' },







    gaogouli: [







        { generalId: 'gaogouli_yizhiwende', generalName: '乙支文德', portrait: '/assets/KOREA/gaogouli_yizhiwende.png' },







        // 名将双身份：卫满（据点武将＋剧本敌将）







        { generalId: 'bfe3_20', generalName: '卫满', portrait: '/assets/KOREA/bfe3_20.png', legionName: '古典时代高句丽军团', factionId: 'joseon' , eliteName: '义兴亲军卫', eliteTier: 1 },







        // 名将双身份：卫右渠（据点武将＋剧本敌将）







        { generalId: 'bfe3_31', generalName: '卫右渠', portrait: '/assets/KOREA/bfe3_31.png', legionName: '古典时代高句丽军团', factionId: 'joseon' , eliteName: '义兴亲军卫', eliteTier: 1 },







    ],







    baiji: { generalId: 'baiji_jiebo', generalName: '阶伯', portrait: '/assets/KOREA/baiji_jiebo.png' },







    zhen: { generalId: 'zhen_zhenxuan', generalName: '甄萱', portrait: '/assets/KOREA/zhen_zhenxuan.png' },







    danluo: { generalId: 'danluo_jintongjing', generalName: '金通精', portrait: '/assets/KOREA/danluo_jintongjing.png' },







    sambyeol: { generalId: 'sambyeol_lishunchen', generalName: '李舜臣', portrait: '/assets/KOREA/sambyeol_lishunchen.png' },







    hai2: { generalId: 'ssangseong_cuiying', generalName: '崔莹', portrait: '/assets/KOREA/ssangseong_cuiying.png' },







    gaya: { generalId: 'gaya_jinshoulu', generalName: '金首露', portrait: '/assets/KOREA/gaya_jinshoulu.png' },















    xuantu: { generalId: 'xuantu_yuangaisuwen', generalName: '渊盖苏文', portrait: '/assets/KOREA/xuantu_yuangaisuwen.png' },







    naju_d: { generalId: 'naju_d_wangjian_wangye', generalName: '王礏', portrait: '/assets/KOREA/naju_d_wangjian_wangye.png' },







    chungju_d: { generalId: 'chungju_d_quanli', generalName: '权栗', portrait: '/assets/KOREA/chungju_d_quanli.png' },







    sabeol: { generalId: 'sabeol_jinshimin', generalName: '金时敏', portrait: '/assets/KOREA/sabeol_jinshimin.png' },







        huimo: { generalId: 'huimo_gaoyanshou', generalName: '高延寿', portrait: '/assets/KOREA/huimo_gaoyanshou.png' },







    aola: { generalId: 'aola_menglielun', generalName: '孟烈伦', portrait: '/assets/NORTHEAST/aola_menglielun.png' },







    ewenki: { generalId: 'ewenki_gentemuer', generalName: '根特木尔', portrait: '/assets/NORTHEAST/ewenki_gentemuer.png' },







    haixi_nvzhen: { generalId: 'haixi_nvzhen_baiyindali', generalName: '拜音达里', portrait: '/assets/NORTHEAST/haixi_nvzhen_baiyindali.png' },







    dazhen: { generalId: 'dazhen_wanyantiege', generalName: '完颜铁哥', portrait: '/assets/NORTHEAST/dazhen_wanyantiege.png' },







    yehe: { generalId: 'yehe_jintaiji', generalName: '金台吉', portrait: '/assets/NORTHEAST/yehe_jintaiji.png' },















    guishuang: { generalId: 'guishuang_qiujiuque', generalName: '丘就却', portrait: '/assets/CENTRAL_ASIA/guishuang_qiujiuque.png' },







    // 述律平＝辽太祖皇后（契丹国号前后同一政权）→ 与耶律倍统一挂大辽







    qidan: { generalId: 'qidan_shulvping', generalName: '述律平', portrait: '/assets/XIANBEI/qidan_shulvping.png', factionId: 'liao_d' },







    hui: { generalId: 'hui_bunaihou', generalName: '不耐', portrait: '/assets/KOREA/hui_bunaihou.png' },







// ── 东北区 2026-06-18 ──







    jilizhou: { generalId: 'jilizhou_chengmingzhen', generalName: '程名振', portrait: '/assets/WEI/jilizhou_chengmingzhen.png' },







    nuergan: { generalId: 'nuergan_kangwang', generalName: '康旺', portrait: '/assets/NORTHEAST/nuergan_kangwang.png' },







    manzhou: { generalId: 'manzhou_nuerhachi', generalName: '努尔哈赤', portrait: '/assets/NORTHEAST/manzhou_nuerhachi.png' },















    wuliangha: { generalId: 'wuliangha_subutai', generalName: '速不台', portrait: '/assets/MONGOL/wuliangha_subutai.png' },







    fuyu: { generalId: 'fuyu_weichoutai', generalName: '尉仇台', portrait: '/assets/NORTHEAST/fuyu_weichoutai.png' },







    dajin: [







        { generalId: 'dajin_wanyanaguda', generalName: '完颜阿骨打', portrait: '/assets/NORTHEAST/dajin_wanyanaguda.png' },







        // 🔴 [2026-10-20 首战规则] 完颜承裕＝金军野狐岭主帅（1211 被成吉思汗大败）→ 会宁府·大金；普将；封建×东北＝封建时代渤海军团；立绘留空







        { generalId: 'dajin_wanyanchengyu', legionName: '城堡时代大金军团', generalName: '完颜承裕', portrait: '/assets/NORTHEAST/dajin_wanyanchengyu.png' },







        // 🔴 [2026-10-20 首战规则] 完颜合达＝金军三峰山主帅（1232 被拖雷击灭）→ 会宁府·大金；普将；封建时代渤海军团；立绘留空







        { generalId: 'dajin_wanyanheda', legionName: '城堡时代大金军团', generalName: '完颜合达', portrait: '/assets/NORTHEAST/dajin_wanyanheda.png' },







    ],







    yizhou: { generalId: 'yizhou_wanyanloushi', generalName: '完颜娄室', portrait: '/assets/XIANBEI/yizhou_wanyanloushi.png' },







    aisin_d: { generalId: 'aisin_d_huangtaiji', generalName: '皇太极', portrait: '/assets/NORTHEAST/aisin_d_huangtaiji.png' },







    xianbei: { generalId: 'xianbei_tuobamao', generalName: '拓跋毛', portrait: '/assets/NORTHEAST/xianbei_tuobamao.png' },







    suolun: { generalId: 'suolun_bomuboguoer', generalName: '博穆博果尔', portrait: '/assets/NORTHEAST/suolun_bomuboguoer.png' },







    dongxia: { generalId: 'dongxia_puxianwannu', generalName: '蒲鲜万奴', portrait: '/assets/NORTHEAST/dongxia_puxianwannu.png' },







    wula: { generalId: 'wula_buzhantai', generalName: '布占泰', portrait: '/assets/NORTHEAST/wula_buzhantai.png' },







    dada_ming: [



        { generalId: 'dada_ming_dayanhan', generalName: '巴图蒙克', portrait: '/assets/XIANBEI/dada_ming_dayanhan.png' },



        // 🔴 [2026-10-20 首战规则] 癿加思兰＝鞑靼太师（1473 红盐池被王越夜袭）→ 河套（XIANBEI）；城堡时代漠南蒙古军团；立绘留空



        { generalId: 'gen_beg_arslan', generalName: '癿加思兰', portrait: '/assets/XIANBEI/gen_beg_arslan.png', legionName: '城堡时代漠南蒙古军团' },



    ],







    keerqin: { generalId: 'keerqin_aoba', generalName: '奥巴', portrait: '/assets/XIANBEI/keerqin_aoba.png' },







    wure: { generalId: 'wure_wuzhaodu', generalName: '乌昭度', portrait: '/assets/NORTHEAST/wure_wuzhaodu.png' },







    houliao: { generalId: 'houliao_yelvliuge', generalName: '耶律留哥', portrait: '/assets/NORTHEAST/houliao_yelvliuge.png' },







    heishui: { generalId: 'heishui_nishuli', generalName: '倪属利稽', portrait: '/assets/NORTHEAST/heishui_nishuli.png' },







    heisha_d: { generalId: 'heisha_d_houlihu', generalName: '呴犁湖', portrait: '/assets/MONGOL/heisha_d_houlihu.png' },







    hezhe: { generalId: 'hezhe_shaerhuda', generalName: '沙尔虎达', portrait: '/assets/NORTHEAST/hezhe_shaerhuda.png' },







    dawoer: { generalId: 'dawoer_baerdaqi', generalName: '巴尔达齐', portrait: '/assets/NORTHEAST/dawoer_baerdaqi.png' },







    mohe: { generalId: 'mohe_wanyanzonghan', generalName: '完颜宗翰', portrait: '/assets/NORTHEAST/mohe_wanyanzonghan.png' },







    yeren_nvzhen: { generalId: 'yeren_nvzhen_boke', generalName: '博克', portrait: '/assets/NORTHEAST/yeren_nvzhen_boke.png' },







    wuji: { generalId: 'wuji_yilizhi', generalName: '乙力支', portrait: '/assets/NORTHEAST/wuji_yilizhi.png' },







    jilin: { generalId: 'jilin_fujun', generalName: '富俊', portrait: '/assets/NORTHEAST/jilin_fujun.png' },







    // 🔴 [2026-10-20 主人令「东丹/契丹同属辽，必须合并」] 耶律倍＝辽太子、东丹国王（东丹是辽属国）→ 统一挂大辽







    dongdan: { generalId: 'dongdan_yelvbei', generalName: '耶律倍', portrait: '/assets/NORTHEAST/dongdan_yelvbei.png', factionId: 'liao_d' },







    kuye: { generalId: 'kuye_kuye_qichayi', generalName: '齐查伊', portrait: '/assets/NORTHEAST/kuye_kuye_qichayi.png' },







    sushen: { generalId: 'sushen_tudiji', generalName: '突地稽', portrait: '/assets/NORTHEAST/sushen_tudiji.png' },







    yilou: { generalId: 'yilou_naoya', generalName: '恼犽', portrait: '/assets/NORTHEAST/yilou_naoya.png' },







    maomingan: { generalId: 'maomingan_suoetu', generalName: '索额图', portrait: '/assets/NORTHEAST/maomingan_suoetu.png' },







    jilimi: { generalId: 'jilimi_takuna', generalName: '塔库纳', portrait: '/assets/NORTHEAST/jilimi_takuna.png' },







    eluoke: { generalId: 'eluoke_amuhaer', generalName: '阿穆哈尔', portrait: '/assets/NORTHEAST/eluoke_amuhaer.png' },







    nifuhe: { generalId: 'nifuhe_baerhudai', generalName: '巴尔虎代', portrait: '/assets/NORTHEAST/nifuhe_baerhudai.png' },







    feiyaka: { generalId: 'feiyaka_cemutehe', generalName: '策穆特赫', portrait: '/assets/NORTHEAST/feiyaka_cemutehe.png' },







    nanai: { generalId: 'nanai_zhahaluo', generalName: '扎哈罗', portrait: '/assets/NORTHEAST/nanai_zhahaluo.png' },







    woju: { generalId: 'woju_yinguan', generalName: '尹瓘', portrait: '/assets/KOREA/woju_yinguan.png' },







    luzhou: { generalId: 'luzhou_zhangwenxiu', generalName: '张文休', portrait: '/assets/NORTHEAST/luzhou_zhangwenxiu.png' },







    jurchen: { generalId: 'jurchen_wanyanzongbi', generalName: '完颜宗弼', portrait: '/assets/NORTHEAST/jurchen_wanyanzongbi.png' },







        // ── 草原关隘 ──







    wuzhou: { generalId: 'wuzhou_limu', generalName: '李牧', portrait: '/assets/WEI/wuzhou_limu.png' },







    ashina: { generalId: 'ashina_ashinayandou', generalName: '阿史那燕都', portrait: '/assets/CENTRAL_ASIA/ashina_ashinayandou.png' },







    yuwen: [







        { generalId: 'yuwen_yuwentai', generalName: '宇文泰', portrait: '/assets/XIANBEI/yuwen_yuwentai.png' },







        // 🔴 [2026-10-20 首战规则] 宇文宪＝北周名将（570 攻轵关败于斛律光）→ 武川镇·宇文；名将；立绘留空







        { generalId: 'yuwen_yuwenxian', generalName: '宇文宪', portrait: '/assets/XIANBEI/yuwen_yuwenxian.png' },







    ],







    chenli_d: { generalId: 'chenli_d_zuoxianwang', generalName: '张必先', portrait: '/assets/MONGOL/chenli_d_zuoxianwang.png' },







    nuoyan_d: { generalId: 'nuoyan_d_sanyinnuoyan', generalName: '三音诺颜', portrait: '/assets/MONGOL/nuoyan_d_sanyinnuoyan.png' },







    wuli_d: { generalId: 'wuli_d_celeng', generalName: '策楞', portrait: '/assets/MONGOL/wuli_d_celeng.png' },







    jiluo_d: { generalId: 'jiluo_d_douxian', generalName: '窦宪', portrait: '/assets/MONGOL/jiluo_d_douxian.png' },







// ── 草原区 2026-06-18 ──







    liao_d: [







        { generalId: 'liao_d_yelvabaoji', generalName: '耶律阿保机', portrait: '/assets/XIANBEI/liao_d_yelvabaoji.png' },







        // 🔴 [2026-10-20 首战规则] 萧排押＝辽将（1019 龟州之战主帅，被姜邯赞大破）→ 临潢府·大辽；普将；立绘留空







        { generalId: 'liao_d_xiaopaiya', generalName: '萧排押', portrait: '/assets/XIANBEI/liao_d_xiaopaiya.png' },







        // 🔴 [2026-10-20 首战规则] 萧咄李＝辽驸马侍中（980 雁门关之战被杨业阵斩）→ 临潢府·大辽；普将；立绘留空







        { generalId: 'liao_d_xiaoduli', generalName: '萧咄李', portrait: '/assets/XIANBEI/liao_d_xiaoduli.png' },







        // 🔴 [2026-10-20 首战规则] 韩德威＝辽将（995 子河汊之战被折御卿击败）→ 临潢府·大辽；普将；立绘留空







        { generalId: 'liao_d_handewei', generalName: '韩德威', portrait: '/assets/XIANBEI/liao_d_handewei.png' },







        // 🔴 [2026-10-20 首战规则] 天祚帝＝辽末帝耶律延禧（1115 护步达冈亲征被完颜阿骨打大败）→ 临潢府·大辽；普将；立绘留空







        { generalId: 'liao_d_tianzuodi', legionName: '城堡时代漠南蒙古军团', generalName: '天祚帝', portrait: '/assets/XIANBEI/liao_d_tianzuodi.png' },







    ],







    yel: { generalId: 'yel_yelvxiuge', generalName: '耶律休哥', portrait: '/assets/XIANBEI/yel_yelvxiuge.png' },







    kumoxi: { generalId: 'kumoxi_ahuihui', generalName: '阿会毁', portrait: '/assets/XIANBEI/kumoxi_ahuihui.png' },







    kumo: { generalId: 'kumo_xiwanghuilibao', generalName: '回离保', portrait: '/assets/XIANBEI/kumo_xiwanghuilibao.png' },







    geluolu: { generalId: 'geluolu_chisipijia', generalName: '炽俟毗伽', portrait: '/assets/CENTRAL_ASIA/geluolu_chisipijia.png' },







    ogodei: { generalId: 'ogodei_chuoermahan', generalName: '绰儿马罕', portrait: '/assets/CENTRAL_ASIA/ogodei_chuoermahan.png' },







    merkit: { generalId: 'merkit_boyan', generalName: '伯颜', portrait: '/assets/MONGOL/merkit_boyan.png' },







    tumed: { generalId: 'tumed_andahan', generalName: '俺答', portrait: '/assets/XIANBEI/tumed_andahan.png' },







    kiyad: { generalId: 'kiyad_yesugai', generalName: '也速该', portrait: '/assets/MONGOL/kiyad_yesugai.png' },







    xiajiasi: { generalId: 'xiajiasi_are', generalName: '阿热', portrait: '/assets/MONGOL/xiajiasi_are.png' },







    xiongnu: [







        { generalId: 'xiongnu_maodun', generalName: '冒顿', portrait: '/assets/XIANBEI/xiongnu_maodun.png' },







        // 名将双身份：老上单于（据点武将＋剧本敌将）







        { generalId: 'bfe3_24', generalName: '老上单于', portrait: '/assets/XIANBEI/bfe3_24.png', legionName: '古典时代鲜卑军团' , eliteName: '匈奴控弦', eliteTier: 2},







        // 名将双身份：儿单于（据点武将＋剧本敌将）







        { generalId: 'bfe3_34', generalName: '儿单于', portrait: '/assets/XIANBEI/bfe3_34.png', legionName: '古典时代鲜卑军团' , eliteName: '匈奴控弦', eliteTier: 2},







        // 名将双身份：且鞮侯单于（据点武将＋剧本敌将）







        { generalId: 'bfe3_38', generalName: '且鞮侯单于', portrait: '/assets/XIANBEI/bfe3_38.png', legionName: '古典时代鲜卑军团' , eliteName: '匈奴控弦', eliteTier: 2},







        // 名将双身份：北单于（据点武将＋剧本敌将）







        { generalId: 'bfe3_64', generalName: '北单于', portrait: '/assets/XIANBEI/bfe3_64.png', legionName: '古典时代鲜卑军团' , eliteName: '北匈奴骑', eliteTier: 3},







        // 名将双身份：白羊王（据点武将＋剧本敌将）







        { generalId: 'bfe3_32', generalName: '白羊王', portrait: '/assets/XIANBEI/bfe3_32.png', legionName: '古典时代鲜卑军团' , eliteName: '白羊部骑', eliteTier: 4},







        // 名将双身份：呼韩邪单于（据点武将＋剧本敌将）







        { generalId: 'bfe3_48', generalName: '呼韩邪单于', portrait: '', legionName: '古典时代鲜卑军团' , eliteName: '匈奴控弦', eliteTier: 3},







    ],







    murong: { generalId: 'murong_murongke', generalName: '慕容恪', portrait: '/assets/XIANBEI/murong_murongke.png' },







    wuhuan: { generalId: 'wuhuan_tadun', generalName: '蹋顿', portrait: '/assets/XIANBEI/wuhuan_tadun.png' },







    yuan_d: [







        { generalId: 'yuan_d_hubilie', generalName: '忽必烈', portrait: '/assets/XIANBEI/yuan_d_hubilie.png' },







        // 🔴 [2026-10-20 首战规则] 倒剌沙＝元上都派权臣（1328 两都之战被燕帖木儿击败）→ 上都·元朝；普将；立绘留空







        { generalId: 'yuan_d_daulashah', generalName: '倒剌沙', portrait: '', legionName: '城堡时代漠南蒙古军团' },







        // 🔴 [2026-10-20 首战规则] 脱脱＝元末丞相（1354 率大军围高邮，被张士诚击退）→ 上都·元朝；普将；立绘留空







        { generalId: 'yuan_d_tuotuo', legionName: '城堡时代漠南蒙古军团', generalName: '脱脱', portrait: '' },







        // 🔴 [2026-10-20 首战规则] 蛮子海牙＝元将（1355 采石矶被常遇春击败）→ 上都·元朝；普将；立绘留空







        { generalId: 'yuan_d_manzihaiya', legionName: '城堡时代漠南蒙古军团', generalName: '蛮子海牙', portrait: '' },







    ],







    mengwu: { generalId: 'mengwu_hebulehan', generalName: '合不勒', portrait: '/assets/MONGOL/mengwu_hebulehan.png' },







    shaodang: [







        { generalId: 'shaodang_mitang', generalName: '迷唐', portrait: '/assets/TIBET/shaodang_mitang.png' },







        // 🔴 [2026-10-20 主人令「这些据点违规了……请删除。据点中有武将的话，请放到相同风格的临近据点」] 原据点 city_qiangyi 已删 → 迁玛曲（同建筑风格最近），仍挂本政权 qiangfang







        { generalId: 'bfe_qiang_bo', generalName: '羌方首领 羌伯砺', portrait: '' , legionName: '古典时代发羌军团', eliteName: '羌部骑兵', eliteTier: 4},







    ],







    xueyantuo: { generalId: 'xueyantuo_yinan', generalName: '夷男', portrait: '/assets/MONGOL/xueyantuo_yinan.png' },















    // 骨力裴罗＝回纥（后改称回鹘）汗国开国可汗，回纥/回鹘/博尔巴任回鹘是同一汗国 → 统一挂回鹘







    huige: { generalId: 'huige_gulipeiluo', generalName: '骨力裴罗', portrait: '/assets/MONGOL/huige_gulipeiluo.png', factionId: 'huihu' },







    porbazhyn_huihu: [







        // 牟羽可汗＝回鹘汗国可汗（博尔巴任只是同国据点）→ 挂回鹘







        { generalId: 'porbazhyn_mouyu', generalName: '牟羽可汗', portrait: '/assets/CENTRAL/porbazhyn_mouyu.png', factionId: 'huihu' },   // 博尔巴任专属；骨力裴罗只留卜古罕城







    ],







    huizhou_d: { generalId: 'huizhou_zhugeliang', generalName: '诸葛亮', portrait: '/assets/BASHU/huizhou_zhugeliang.png' },







    kereyid: { generalId: 'kereyid_wanghan', generalName: '脱斡霖', portrait: '/assets/MONGOL/kereyid_wanghan.png' },







    naiman: { generalId: 'naiman_taiyanghan', generalName: '塔阳', portrait: '/assets/CENTRAL_ASIA/naiman_taiyanghan.png' },







    tatar: { generalId: 'tatar_mieguzhen', generalName: '蔑古真', portrait: '/assets/MONGOL/tatar_mieguzhen.png' },







    tushetu: { generalId: 'tushetu_tuxietuhan', generalName: '衮布', portrait: '/assets/MONGOL/tushetu_tuxietuhan.png' },







    zhasaketu: { generalId: 'zhasaketu_zhasakesubadi', generalName: '素巴第', portrait: '/assets/MONGOL/zhasaketu_zhasakesubadi.png' },







    gaoche: { generalId: 'gaoche_afuzhiluo', generalName: '阿伏至罗', portrait: '/assets/MONGOL/gaoche_afuzhiluo.png' },







    tujue: [







        { generalId: 'tujue_ashinatumen', generalName: '阿史那土门', portrait: '/assets/MONGOL/tujue_ashinatumen.png' },







        // 🔴 [2026-10-20 首战规则] 颉利可汗＝东突厥末代大可汗（630 阴山之战被李靖夜袭），于都斤山·突厥；普将；立绘留空







        { generalId: 'tujue_xielikehan', generalName: '颉利可汗', portrait: '' },







        // 🔴 [2026-10-20 首战规则] 乌苏米施可汗＝后突厥末代可汗（744 被回纥骨力裴罗击灭）→ 于都斤山·突厥；普将；立绘留空







        { generalId: 'tujue_wusumishi', generalName: '乌苏米施可汗', portrait: '' },







    ],







    da_yuan: [



        { generalId: 'da_yuan_kuokuotiemuer', generalName: '扩廓帖木儿', portrait: '/assets/XIANBEI/da_yuan_kuokuotiemuer.png' },



        // 🔴 [2026-10-20 首战规则] 脱古思帖木儿＝北元后主（1388 捕鱼儿海被蓝玉袭破）→ 应昌（XIANBEI）；城堡时代漠南蒙古军团；立绘留空



        { generalId: 'gen_toghus_temur', generalName: '脱古思帖木儿', portrait: '', legionName: '城堡时代漠南蒙古军团' },



    ],







    yujiulu: { generalId: 'yujiulu_yujiulv', generalName: '郁久闾大檀', portrait: '/assets/MONGOL/yujiulu_yujiulv.png' },







    yaoluoge: { generalId: 'yaoluoge_yaoluogepusa', generalName: '药罗葛菩萨', portrait: '/assets/MONGOL/yaoluoge_yaoluogepusa.png' },







    jalair: { generalId: 'jalair_muhuali', generalName: '木华黎', portrait: '/assets/MONGOL/jalair_muhuali.png' },







    hongirad: { generalId: 'hongirad_dexuechan', generalName: '德薛禅', portrait: '/assets/MONGOL/hongirad_dexuechan.png' },







    choros: { generalId: 'choros_tuohuan', generalName: '脱欢', portrait: '/assets/CENTRAL_ASIA/choros_tuohuan.png' },







    tiele: { generalId: 'tiele_qibiheli', generalName: '契苾何力', portrait: '/assets/MONGOL/tiele_qibiheli.png' },







    ashide: { generalId: 'ashide_ashidejieli', generalName: '阿史德颉利', portrait: '/assets/CENTRAL_ASIA/ashide_ashidejieli.png' },







    duolu: { generalId: 'duolu_ashinahelu', generalName: '阿史那贺鲁', portrait: '/assets/CENTRAL_ASIA/duolu_ashinahelu.png' },







    cheshihou: { generalId: 'cheshihou_angui', generalName: '安归', portrait: '/assets/WESTERN/cheshihou_angui.png' },







    kaerka: { generalId: 'kaerka_abadaihan', generalName: '阿巴岱', portrait: '/assets/MONGOL/kaerka_abadaihan.png' },







    huyan: { generalId: 'huyan_peicen', generalName: '呼衍蒲奴', portrait: '/assets/CENTRAL_ASIA/huyan_peicen.png' },







    chahar: [







        { generalId: 'chahar_yantiemuer', generalName: '燕帖木儿', portrait: '/assets/XIANBEI/chahar_yantiemuer.png' },







        // 名将双身份：轲比能（据点武将＋剧本敌将）







        // 🔴 [2026-10-20 主人令「不可能出现同一年、同一座城，在场武将来自不同势力……如果真有，那么就是没弄对，需要换据点」]







        //    原挂盛乐，与拓跋力微（索头）在场年份重叠 195～294 → 按史迁兴和城：轲比能部在代郡、上谷塞外，弹汗山（尚义）一带；兴和城建筑 XIANBEI，军团不变







        { generalId: 'bfe3_74', generalName: '轲比能', portrait: '', legionName: '古典时代鲜卑军团', factionId: 'xianbei' , eliteName: '鲜卑弓骑', eliteTier: 4 },







    ],







    ongut: { generalId: 'ongut_alawusi', generalName: '阿剌兀思', portrait: '/assets/XIANBEI/ongut_alawusi.png' },







    rouran: [







        { generalId: 'rouran_shelun', generalName: '社仑', portrait: '/assets/MONGOL/rouran_shelun.png' },







        // 🔴 [2026-10-20 首战规则] 阿那瓌＝柔然末代可汗（552 被突厥土门击败自杀）→ 赛尔乌苏·柔然；普将；立绘留空







        //    军团按「武将时代×据点文化」：MONGOL×封建＝封建时代突厥军团







        { generalId: 'rouran_anagui', generalName: '阿那瓌', portrait: '', legionName: '封建时代突厥军团' },







    ],







    chagatai: { generalId: 'chagatai_genggong', generalName: '耿恭', portrait: '/assets/WESTERN/chagatai_genggong.png' },







    huihu: [







        { generalId: 'huihu_dunmohedagan', generalName: '顿莫贺达干', portrait: '/assets/MONGOL/huihu_dunmohedagan.png' },







        // 🔴 [2026-10-20 首战规则] 㕎馺可汗＝回鹘汗国末代可汗（840 被黠戛斯攻灭）→ 青岭牙帐·回鹘；普将；立绘留空







        { generalId: 'huihu_wusa', generalName: '㕎馺可汗', portrait: '' },







    ],







    kelie: { generalId: 'kelie_zhaheganbu', generalName: '札合敢不', portrait: '/assets/MONGOL/kelie_zhaheganbu.png' },







    pugu: { generalId: 'pugu_ashinaguduolu', generalName: '骨咄禄', portrait: '/assets/MONGOL/pugu_ashinaguduolu.png' },







    pulei: { generalId: 'pulei_dougu', generalName: '窦固', portrait: '/assets/WESTERN/pulei_dougu.png' },







    xibo_d: { generalId: 'xibo_d_tubote', generalName: '图伯特', portrait: '/assets/CENTRAL_ASIA/xibo_d_tubote.png' },







    borjigin: { generalId: 'borjigin_tuolei', generalName: '拖雷', portrait: '/assets/MONGOL/borjigin_tuolei.png' },







    zhadalan: { generalId: 'zhadalan_zhamuhe', generalName: '札木合', portrait: '/assets/MONGOL/zhadalan_zhamuhe.png' },







    zhuerqi: { generalId: 'zhuerqi_sachabieqi', generalName: '撒察别乞', portrait: '/assets/MONGOL/zhuerqi_sachabieqi.png' },







    chechen: { generalId: 'chechen_chechenhanshuolei', generalName: '硕垒', portrait: '/assets/MONGOL/chechen_chechenhanshuolei.png' },







    tumengken: { generalId: 'tumengken_tumengken', generalName: '图蒙肯', portrait: '/assets/MONGOL/tumengken_tumengken.png' },







    bayegu: { generalId: 'bayegu_qulishi', generalName: '屈利失', portrait: '/assets/MONGOL/bayegu_qulishi.png' },







    zubu: { generalId: 'zubu_mogusi', generalName: '磨古斯', portrait: '/assets/MONGOL/zubu_mogusi.png' },







    wuzhumuqin: { generalId: 'wuzhumuqin_duoerji', generalName: '多尔济', portrait: '/assets/XIANBEI/wuzhumuqin_duoerji.png' },







    baidi: { generalId: 'baidi_baidizi', generalName: '白狄子', portrait: '/assets/XIANBEI/baidi_baidizi.png' },







    shiwei: { generalId: 'shiwei_saihou', generalName: '塞呴', portrait: '/assets/MONGOL/shiwei_saihou.png' },







    sunite: { generalId: 'sunite_sousai', generalName: '叟塞', portrait: '/assets/XIANBEI/sunite_sousai.png' },







    bulat: { generalId: 'bulat_beiduanchaer', generalName: '孛端察儿', portrait: '/assets/SLAVIC/bulat_beiduanchaer.png' },







    tuva: { generalId: 'tuva_qinggunzabu', generalName: '青滚杂卜', portrait: '/assets/MONGOL/tuva_qinggunzabu.png' },







        // ── 西域关隘 ──







    hepan: { generalId: 'hepan_gaoxianzhi', generalName: '高仙芝', portrait: '/assets/WESTERN/hepan_gaoxianzhi.png' },







    yiwu: { generalId: 'yiwu_hanshen', generalName: '罕慎', portrait: '/assets/WESTERN/yiwu_hanshen.png' },







    kepantuo: { generalId: 'kepantuo_dulimi', generalName: '阇梨密', portrait: '/assets/WESTERN/kepantuo_dulimi.png' },







    huite: { generalId: 'huite_amuersana', generalName: '阿睦尔撒纳', portrait: '/assets/CENTRAL_ASIA/huite_amuersana.png' },







    tuoming: { generalId: 'tuoming_tuomin', generalName: '妥明', portrait: '/assets/WESTERN/tuoming_tuomin.png' },







    chuyue: { generalId: 'chuyue_shatuonasu', generalName: '沙陀那速', portrait: '/assets/CENTRAL_ASIA/chuyue_shatuonasu.png' },







    keerkezi: { generalId: 'keerkezi_manasi', generalName: '玛纳斯', portrait: '/assets/CENTRAL_ASIA/keerkezi_manasi.png' },







    pisha: { generalId: 'pisha_weichisheng', generalName: '尉迟胜', portrait: '/assets/WESTERN/pisha_weichisheng.png' },







    xingxingxia: { generalId: 'xingxingxia_guoxiaoke', generalName: '郭孝恪', portrait: '/assets/KHITAN/xingxingxia_guoxiaoke.png' },







    yangguan: { generalId: 'yangguan_lihao', generalName: '李暠', portrait: '/assets/KHITAN/yangguan_lihao.png' },







    wulianghai: { generalId: 'wulianghai_chelingwubashen', generalName: '车凌乌巴什', portrait: '/assets/MONGOL/wulianghai_chelingwubashen.png' },







    // 三陇沙·白龙 宁缺毋滥







// ── 西域区 2026-06-18 ──







    shache: { generalId: 'shache_xian_suoche_shachexian', generalName: '莎车贤', portrait: '/assets/WESTERN/shache_shachexian.png' },







    shule: { generalId: 'shule_aersilan', generalName: '阿尔斯兰', portrait: '/assets/WESTERN/shule_aersilan.png' },







    dzungar: { generalId: 'dzungar_galedanceling', generalName: '噶勒丹策凌', portrait: '/assets/CENTRAL_ASIA/dzungar_galedanceling.png' },







    anxi: { generalId: 'anxi_guoxin', generalName: '郭昕', portrait: '/assets/WESTERN/anxi_guoxin.png' },







    yanqi: { generalId: 'yanqi_longtuqizhi', generalName: '龙突骑支', portrait: '/assets/WESTERN/yanqi_longtuqizhi.png' },







    tuerhute: { generalId: 'tuerhute_wobaxi', generalName: '渥巴锡', portrait: '/assets/CENTRAL_ASIA/tuerhute_wobaxi.png' },














    yarkand: { generalId: 'yarkand_abudulatifu', generalName: '拉提夫', portrait: '/assets/WESTERN/yarkand_latifu.png' },







    yiduhu: [







        { generalId: 'yiduhu_baershu', generalName: '巴尔术', portrait: '/assets/WESTERN/yiduhu_baershu.png' },







        // 🔴 [2026-10-20 首战规则] 麴文泰＝高昌国王（640 唐军围城，忧惧而死）→ 高昌·亦都护（高昌国无独立势力，挂该城势力）；普将；封建×西域＝封建时代安西军团；立绘留空














    ],
    // 🔴 [2026-10-20 主人令] 麴文泰＝高昌国王（麴氏本家），从「亦都护」键移回麴氏键
    gaochang: [
        { generalId: 'yiduhu_quwentai', generalName: '麴文泰', portrait: '', legionName: '封建时代安西军团' , eliteName: '高昌戍兵', eliteTier: 4 },   // 🔴 640 高昌麴氏的戍兵（原配「西州回鹘」是 840 年后）
    ],







    yuchi: [
        { generalId: 'yuchi_weichiyao', generalName: '尉迟曜', portrait: '/assets/WESTERN/yuchi_weichiyao.png' },
        { generalId: 'bfe_guangde', generalName: '于阗王 广德', portrait: '', factionId: 'yuchi', legionName: '古典时代西域军团' },
    ],














    kala: { generalId: 'kala_satuke', generalName: '萨图克', portrait: '/assets/WESTERN/kala_satuke.png' },







    an: { generalId: 'an_xibanni', generalName: '昔班尼', portrait: '/assets/CENTRAL_ASIA/an_xibanni.png' },







    saman: { generalId: 'saman_yisimayi', generalName: '伊斯玛仪', portrait: '/assets/CENTRAL_ASIA/saman_yisimayi.png' },







    wusun: { generalId: 'wusun_liejiaomi', generalName: '猎骄靡', portrait: '/assets/CENTRAL_ASIA/wusun_liejiaomi.png' },







    tujishi: { generalId: 'tujishi_sulukehan', generalName: '苏禄', portrait: '/assets/WESTERN/tujishi_sulu.png' },







    xiliao: [







        { generalId: 'xiliao_yelvdashi', generalName: '耶律大石', portrait: '/assets/CENTRAL_ASIA/xiliao_yelvdashi.png' },







        // 🔴 [2026-10-20 首战规则] 奥斯曼＝西喀喇汗末王（1212 撒马尔罕被花剌子模摩诃末攻灭）；西喀喇汗无独立势力，按其宗主西辽挂靠并报告；普将；封建×中亚＝封建时代河中军团；立绘留空







        { generalId: 'xiliao_uthman', legionName: '城堡时代察合台军团', generalName: '奥斯曼', portrait: '' },







    ],







    jiazini: [







        { generalId: 'jiazini_mahamaode', generalName: '马哈茂德', portrait: '/assets/PERSIAN/jiazini_mahamaode.png' },







        // 🔴 [2026-10-20 首战规则] 马斯乌德＝伽色尼苏丹（1040 丹丹纳坎被塞尔柱大败）→ 哥疾宁·伽色尼；名将；立绘留空







        { generalId: 'jiazini_masud', generalName: '马斯乌德', portrait: '' },







        // 🔴 [2026-10-20 首战规则] 呼斯劳·马利克＝伽色尼末王（1175 赫拉特被古尔王朝击灭）→ 哥疾宁·伽色尼；普将；立绘留空







        { generalId: 'jiazini_khusrau_malik', legionName: '城堡时代法尔斯军团', generalName: '呼斯劳·马利克', portrait: '' },







    ],







    jibin: { generalId: 'jibin_jianisejia', generalName: '迦腻色迦', portrait: '/assets/PURU/jibin_jianisejia.png' },







    babuer: { generalId: 'babuer_babuer', generalName: '巴布尔', portrait: '/assets/MUGHAL/babuer_babuer.png' },







    danmai: [







        { generalId: 'danmai_abusalong', generalName: '阿布萨隆', portrait: '/assets/DANES/danmai_abusalong.png' },







        // 🔴 [2026-10-20 首战规则] 古思伦＝丹麦维京军首领（878 埃丁顿战败、后受洗）→ 哥本哈根·丹麦；名将；立绘留空







        { generalId: 'danmai_guthrum', generalName: '古思伦', portrait: '', legionName: '封建时代丹麦王国军团' },
        { generalId: 'danmai_harald', generalName: '蓝牙哈拉尔', portrait: '', legionName: '封建时代丹麦王国军团', eliteName: '耶灵亲兵', eliteTier: 4 },
        { generalId: 'danmai_godfred', generalName: '戈德弗雷德', portrait: '', legionName: '封建时代丹麦王国军团', eliteName: '海瑟比卫队', eliteTier: 4 },







    ],







    ruidian_si: [
        { generalId: 'ruidian_si_biergeyaer', generalName: '比尔格雅尔', portrait: '/assets/GERMANIC/ruidian_si_biergeyaer.png' },
        // 🔴 [2026-10-20 首战规则] 查理十二＝瑞典国王（1709 波尔塔瓦败于彼得一世）→ 斯德哥尔摩（GERMANIC）；帝国时代德意志佣兵军团；立绘留空
        { generalId: 'gen_charles_xii', generalName: '查理十二', portrait: '', legionName: '帝国时代德意志佣兵军团' },
    ],







    kasidiliya: [







        { generalId: 'kasidiliya_afangsuoshiyi', generalName: '阿方索十一', portrait: '/assets/SPANISH/kasidiliya_afangsuoshiyi.png' },



        // 🔴 [2026-10-20 首战规则] 胡安一世＝卡斯蒂利亚国王（1385 阿勒朱巴洛塔败于若昂一世）→ 马德里（SPANISH）；城堡×西班牙＝城堡时代卡斯蒂利亚军团；立绘留空



        { generalId: 'gen_juan_i_castile', generalName: '胡安一世', portrait: '', legionName: '城堡时代卡斯蒂利亚军团' },







        // 🔴 [2026-10-20 首战规则] 阿方索八世＝卡斯蒂利亚王（1195 阿拉科斯败于穆瓦希德，1212 托洛萨大胜）→ 马德里·卡斯蒂利亚；名将；封建×西班牙＝封建时代摩尔游骑军团；立绘留空







        { generalId: 'kasidiliya_afangsuoba', legionName: '城堡时代卡斯蒂利亚军团', generalName: '阿方索八世', portrait: '' },







    ],







    duluo: { generalId: 'duluo_sangqiao', generalName: '桑乔一世', portrait: '/assets/PORTUGUESE/duluo_sangqiao.png' },







    teluoyi: [







        { generalId: 'teluoyi_maniya', generalName: '马尼亚', portrait: '/assets/ORIE/teluoyi_maniya.png' },







        { generalId: 'teluoyi_heketuoer', generalName: '赫克托耳', portrait: '/assets/ORIE/teluoyi_heketuoer.png' },







    ],







    alabo: { generalId: 'alabo_qiyade', generalName: '齐亚德', portrait: '/assets/ORIE/alabo_qiyade.png' },







    xijue: [







        { generalId: 'xijue_ganyanshou', generalName: '郅支', portrait: '/assets/CENTRAL_ASIA/xijue_ganyanshou.png' },







        // 🔴 [2026-10-20 首战规则] 阿史那匐念＝西突厥十姓可汗（680 被裴行俭计擒于碎叶川）→ 碎叶·十箭；普将；封建×中亚＝封建时代河中军团；立绘留空







        { generalId: 'xijue_ashina_funian', generalName: '阿史那匐念', portrait: '', legionName: '封建时代河中军团' , eliteName: '十箭铁骑', eliteTier: 3 },   // 🔴 康居精骑是郅支时代的西匈奴兵，不是 680 年西突厥十姓的兵







    ],







    // 养吉干·咸海 / 真珠河·乌护 宁缺毋滥















// ── 中亚区 2026-06-18 ──







    huarazim: [







        { generalId: 'huarazim_mohemo', generalName: '摩诃末', portrait: '/assets/CENTRAL_ASIA/huarazim_mohemo.png' },







        // 🔴 [2026-10-20 首战规则] 扎兰丁＝花剌子模末代沙阿（1231 被绰儿马罕击灭）→ 玉龙杰赤·花剌子模；名将；封建×中亚＝封建时代河中军团；立绘留空







        { generalId: 'huarazim_jalal', legionName: '城堡时代察合台军团', generalName: '扎兰丁', portrait: '' },







    ],







    kazakh: { generalId: 'kazakh_hasimu', generalName: '哈斯木', portrait: '/assets/CENTRAL_ASIA/kazakh_hasimu.png' },







    // 公元前327年索格狄亚那岩守帅（Rock of Ariamazes 的岩堡首领；英文维基信息框 commander2 = Arimazes）；







    //    立绘按铁律留空走保底图，等主人亲自放图







    suogediyana: { generalId: 'suogediyana_arimazes', generalName: '阿里马泽斯', portrait: '/assets/CENTRAL_ASIA/suogediyana_alimazeshi.png' },







    sogdian: [







        { generalId: 'sogdian_dewasitiqi', generalName: '德瓦什提奇', portrait: '/assets/CENTRAL_ASIA/sogdian_dewasitiqi.png' },







        // 公元前328年索格底亚那岩山守帅（当地大贵族起义领袖奥克夏特斯），立绘按铁律留空走回落、待主人亲自放图分配







        { generalId: 'sogdian_aokexiate', generalName: '奥克夏特斯', portrait: '', legionName: '古典时代粟特军团' },







    ],







    yanda: { generalId: 'yanda_touluoman', generalName: '头罗曼', portrait: '/assets/CENTRAL_ASIA/yanda_touluoman.png' },







    yada: { generalId: 'yada_ahexiong', generalName: '阿赫雄', portrait: '/assets/CENTRAL_ASIA/yada_ahexiong.png' },







    anushidgin: { generalId: 'anushidgin_yile', generalName: '伊勒', portrait: '/assets/CENTRAL_ASIA/anushidgin_yile.png' },







    dayuan: { generalId: 'dayuan_wugua', generalName: '毋寡', portrait: '/assets/WESTERN/dayuan_wugua.png' },







    kokand: { generalId: 'kokand_alimukuli', generalName: '阿里木库力', portrait: '/assets/WESTERN/kokand_alimukuli.png' },







    dayuzi: { generalId: 'dayuzi_yinalechihei', generalName: '亦纳勒赤黑', portrait: '/assets/WESTERN/dayuzi_yinalechihei.png' },







    maer_d: { generalId: 'maer_d_bahelamuchubin', generalName: '巴赫拉姆·楚宾', portrait: '/assets/PERSIAN/maer_d_bahelamuchubin.png' },







    wugu_d: { generalId: 'wugu_d_tugelile', generalName: '图格里勒', portrait: '/assets/CENTRAL_ASIA/wugu_d_tugelile.png' },







    adao_d: { generalId: 'adao_d_mafushou', generalName: '马福寿', portrait: '/assets/WESTERN/adao_d_mafushou.png' },







    wuyuan_d: { generalId: 'wuyuan_d_chengui', generalName: '陈龟', portrait: '/assets/XIANBEI/wuyuan_d_chengui.png' },







    shi_clan: { generalId: 'shi_clan_moheduotutun', generalName: '莫贺咄吐屯', portrait: '/assets/WESTERN/shi_clan_moheduotutun.png' },







    mamon: { generalId: 'mamon_mameng', generalName: '马蒙', portrait: '/assets/CENTRAL_ASIA/mamon_mameng.png' },







    khoja: { generalId: 'khoja_apakehezhuo', generalName: '阿帕克和卓', portrait: '/assets/WESTERN/khoja_apakehezhuo.png' },







    fanyanna: { generalId: 'fanyanna_xieer', generalName: '谢尔', portrait: '/assets/CENTRAL_ASIA/fanyanna_xieer.png' },







    kangju: { generalId: 'kangju_chebishi', generalName: '车鼻施', portrait: '/assets/WESTERN/kangju_chebishi.png' },







    zhaowu: { generalId: 'zhaowu_timuermieli', generalName: '帖木儿灭里', portrait: '/assets/WESTERN/zhaowu_timuermieli.png' },







    qiepantuo: { generalId: 'qiepantuo_luozhentan', generalName: '罗真檀', portrait: '/assets/CENTRAL_ASIA/qiepantuo_luozhentan.png' },







    jie: { generalId: 'jie_sijinti', generalName: '斯谨提', portrait: '/assets/CENTRAL_ASIA/jie_sijinti.png' },







    lu: { generalId: 'lu_zhangliao', generalName: '张辽', portrait: '/assets/JIANGNAN/lu_zhangliao.png' },







    // ── 中国将·西域 2026-06-18 ──







    quli: [
        { generalId: 'bfe3_39', generalName: '开陵侯', portrait: '', factionId: 'han_d', legionName: '古典时代凉州军团' },
        { generalId: 'quli_chentang', generalName: '陈汤', portrait: '/assets/KHITAN/quli_chentang.png' },
        { generalId: 'bfe3_45', generalName: '郑吉', portrait: '', factionId: 'han_d', legionName: '古典时代凉州军团' },
    ],







    loulan: { generalId: 'loulan_suojie', generalName: '索劼', portrait: '/assets/WESTERN/loulan_suojie.png' },







    juandu: { generalId: 'juandu_peixingjian', generalName: '裴行俭', portrait: '/assets/WESTERN/juandu_peixingjian.png' },







    dulan: { generalId: 'dulan_dashibatuer', generalName: '达什巴图尔', portrait: '/assets/TIBET/dulan_dashibatuer.png' },







    heyuan_d: { generalId: 'heyuan_d_heichichangzhi', generalName: '黑齿常之', portrait: '/assets/KHITAN/heyuan_d_heichichangzhi.png' },







    // 克里雅/赤斤/西宁/卡伦/果洛 宁缺毋滥















// ── 青藏区 2026-06-18 ──







    song2: { generalId: 'song2_houjunji', generalName: '侯君集', portrait: '/assets/BASHU/song2_houjunji.png' },







    gurkha: [







        { generalId: 'gurkha_baduersaye', generalName: '巴都尔萨野', portrait: '/assets/TIBET/gurkha_badouersaye.png' },







        // 🔴 [2026-10-20 主人令「这些据点违规了……请删除。据点中有武将的话，请放到相同风格的临近据点」] 原据点 city_bhaktapur 已删 → 迁加德满都（同建筑风格最近），仍挂本政权 malla







        { generalId: 'bfe_jaya_prakash', generalName: '贾亚·普拉卡什·马拉', portrait: '' , legionName: '帝国时代卫藏军团', eliteName: '廓尔喀兵', eliteTier: 3},







    ],







    gongbu: { generalId: 'gongbu_gongbumangbuzhi', generalName: '工布莽布支', portrait: '/assets/TIBET/gongbu_gongbumangbuzhi.png' },







    khon: { generalId: 'khon_basiba', generalName: '八思巴', portrait: '/assets/TIBET/khon_basiba.png' },







    xiadun: { generalId: 'xiadun_xiazhongawanglangjie', generalName: '阿旺朗杰', portrait: '/assets/TIBET/xiadun_awanglangjie.png' },







    gar: { generalId: 'gar_lunqinling', generalName: '论钦陵', portrait: '/assets/TIBET/gar_lunqinling.png' },







    tufa_d: { generalId: 'tufa_d_tufanutan', generalName: '秃发傉檀', portrait: '/assets/KHITAN/tufa_d_tufanutan.png' },







    qifu_d: [
        { generalId: 'qifu_d_qifuchipan', generalName: '乞伏炽磐', portrait: '/assets/KHITAN/qifu_d_qifuchipan.png' },
        // 🔴 [2026-10-20 主人问「木征为什么不挂熙河」→ 按史实改] 木征＝河州（今临夏，库里的枹罕）吐蕃首领，1072～1073 王韶熙河之役所败者；熙州＝库里的狄道。上一轮误以为熙河无据点而放玛曲，现放枹罕（风格 KHITAN 河西，文化随据点）；仍挂本政权 tubo
        { generalId: 'tubo_muzheng', factionId: 'tubo', legionName: '城堡时代大夏军团', generalName: '木征', portrait: '' },
    ],







    tuyu_d: { generalId: 'tuyu_d_kualv', generalName: '夸吕', portrait: '/assets/KHITAN/tuyu_d_kualv.png' },







    duomi: { generalId: 'duomi_lunkongre', generalName: '论恐热', portrait: '/assets/KHITAN/duomi_lunkongre.png' },







    dafeichuan: { generalId: 'dafeichuan_nuohebo', generalName: '诺曷钵', portrait: '/assets/KHITAN/dafeichuan_nuohebo.png' },







    gaxa: { generalId: 'gaxa_zhashi', generalName: '扎什端珠布', portrait: '/assets/TIBET/gaxa_zhashenduanzhubu.png' },







    jinchuan_g: [
        { generalId: 'jinchuan_g_shaluoben', generalName: '莎罗奔', portrait: '/assets/TIBET/jinchuan_g_shaluoben.png' },
        { generalId: 'bfe_sonom', generalName: '索诺木', portrait: '', legionName: '帝国时代卫藏军团' },
    ],







    xiangxiong: { generalId: 'xiangxiong_limixia_x', generalName: '李迷夏', portrait: '/assets/TIBET/xiangxiong_limixia.png' },







    ladakh: { generalId: 'ladakh_senggelangjie', generalName: '僧格朗杰', portrait: '/assets/TIBET/ladakh_senggelangjie.png' },







    khoshut: [
        { generalId: 'khoshut_gushihan', generalName: '图鲁拜琥', portrait: '/assets/TIBET/khoshut_gushihan.png' },
        // 🔴 [2026-10-20 首战规则] 罗卜藏丹津＝和硕特首领（1723 反清，1724 郭密败走）→ 当雄（khoshut 首城，TIBET）；帝国时代卫藏军团；立绘留空
        { generalId: 'gen_lobsang_danjin', generalName: '罗卜藏丹津', portrait: '', legionName: '帝国时代卫藏军团' },
    ],







    nvguo: { generalId: 'nvguo_mojie', generalName: '末羯', portrait: '/assets/TIBET/nvguo_mojie.png' },







    karmapa: { generalId: 'karmapa_queyingduoji', generalName: '却英多吉', portrait: '/assets/TIBET/karmapa_queyingduoji.png' },







    xianlingqiang: [
        { generalId: 'bfe3_44', generalName: '靡忘', portrait: '', legionName: '古典时代凉州军团' },
        { generalId: 'xianlingqiang_dianling', generalName: '滇零', portrait: '/assets/KHITAN/xianlingqiang_dianling.png' },
        { generalId: 'bfe3_43', generalName: '杨玉', portrait: '', legionName: '古典时代凉州军团' },
    ],







    lang_clan: { generalId: 'lang_clan_jiangqujianzan', generalName: '绛曲坚赞', portrait: '/assets/TIBET/lang_clan_jiangqujianzan.png' },







    xiutu: { generalId: 'xiutu_jinridi', generalName: '金日磾', portrait: '/assets/KHITAN/xiutu_jinridi.png' },







    gandenpozhang: { generalId: 'gandenpozhang_dibasangjiejiacuo', generalName: '桑结嘉措', portrait: '/assets/TIBET/gandenpozhang_dibasangjiejiacuo.png' },







    khyungpo: { generalId: 'khyungpo_qiongbobangse', generalName: '琼波邦色', portrait: '/assets/TIBET/khyungpo_qiongbobangse.png' },







    gar_kham: { generalId: 'gar_kham_dengbazeren', generalName: '登巴泽仁', portrait: '/assets/TIBET/gar_kham_dengbazeren.png' },







    guangwu: { generalId: 'guangwu_xinwuxian', generalName: '辛武贤', portrait: '/assets/KHITAN/guangwu_xinwuxian.png' },







    supi: { generalId: 'supi_xinuoluo', generalName: '悉诺逻', portrait: '/assets/TIBET/supi_xinuoluo.png' },







    tsangpa: { generalId: 'tsangpa_pengcuonanjie', generalName: '彭措南杰', portrait: '/assets/TIBET/tsangpa_pengcuonanjie.png' },







    spurgyal: { generalId: 'spurgyal_dariniansai', generalName: '达日年塞', portrait: '/assets/TIBET/spurgyal_dariniansai.png' },







    galangdiba: { generalId: 'galangdiba_wangqindundui', generalName: '旺钦顿堆', portrait: '/assets/TIBET/galangdiba_wangqindundui.png' },







    fuguo: { generalId: 'fuguo_yizeng', generalName: '宜缯', portrait: '/assets/TIBET/fuguo_yizeng.png' },







    bailang: { generalId: 'bailang_tangzeng', generalName: '唐缯', portrait: '/assets/TIBET/bailang_tangzeng.png' },







    humi: { generalId: 'humi_zhentan', generalName: '真檀', portrait: '/assets/TIBET/humi_zhentan.png' },







    xiaobolu: { generalId: 'xiaobolu_meijinmang', generalName: '没谨忙', portrait: '/assets/TIBET/xiaobolu_meijinmang.png' },







    guge: { generalId: 'guge_chizhaxichabade', generalName: '扎西查巴', portrait: '/assets/TIBET/guge_chizhaxichabade.png' },







    pazhu: { generalId: 'pazhu_redangunsangpa', generalName: '热丹衮桑帕', portrait: '/assets/TIBET/pazhu_redangunsangpa.png' },







    ali: { generalId: 'ali_gandancaiwang', generalName: '甘丹才旺', portrait: '/assets/TIBET/ali_gandancaiwang.png' },














    nandou: { generalId: 'nandou_sushili', generalName: '苏失利', portrait: '/assets/TIBET/nandou_sushili.png' }, // 孽多







    bailan: { generalId: 'bailan_pabala', generalName: '帕巴拉', portrait: '/assets/TIBET/bailan_pabala.png' }, // 察木多







    jiantang: { generalId: 'jiantang_sangjiejia', generalName: '桑杰嘉措', portrait: '/assets/TIBET/jiantang_sangjiejiacuo.png' }, // 独克宗







    kongsa: { generalId: 'kongsa_kongsayiduo', generalName: '孔萨益多', portrait: '/assets/TIBET/kongsa_kongsayiduo.png' }, // 甘孜







    gling: { generalId: 'gling_lingesar', generalName: '格萨尔', portrait: '/assets/TIBET/gling_gesaer.png' },







    daca: { generalId: 'daca_dacajilong', generalName: '达擦济咙', portrait: '/assets/TIBET/daca_dacajilong.png' }, // 八宿宗







    gongtang: { generalId: 'gongtang_gongtangcang', generalName: '贡唐仓', portrait: '/assets/TIBET/gongtang_gongtangcang.png' }, // 吉麦







    nanjie: { generalId: 'nanjie_nanjiewangqiu', generalName: '南杰旺秋', portrait: '/assets/TIBET/nanjie_nanjiewangqiu.png' }, // 日土宗







    nanzhong: { generalId: 'nanzhong_mazhong', generalName: '马忠', portrait: '/assets/BASHU/nanzhong_mazhong.png' },







    yueyi: { generalId: 'yueyi_zhangyi', generalName: '张嶷', portrait: '/assets/BASHU/yueyi_zhangyi.png' },







    pingnan: { generalId: 'pingnan_muying', generalName: '沐英', portrait: '/assets/BASHU/pingnan_muying.png' },







    jingdong: { generalId: 'jingdong_taohong', generalName: '陶洪', portrait: '/assets/BASHU/jingdong_taohong.png' }, // 银生城·景东土官







    luohu: { generalId: 'luohu_ganmuding', generalName: '敢木丁', portrait: '/assets/KHMER/luohu_ganmuding.png' }, // 呵叻城·罗斛国王







    ailao: { generalId: 'ailao_leilao', generalName: '类牢', portrait: '/assets/BASHU/ailao_leilao.png' }, // 永昌·哀牢反叛







    mingzheng: { generalId: 'mingzheng_jianzandechang', generalName: '坚赞德昌', portrait: '/assets/BASHU/mingzheng_jianzandechang.png' }, // 打箭炉·明正土司







    hani_d: { generalId: 'hani_d_zhebi', generalName: '遮比', portrait: '/assets/BASHU/hani_d_zhebi.png' }, // 思陀·哈尼首领







  // ── 滇缅区 2026-06-18 ──







    dali: { generalId: 'dali_duansiping', generalName: '段思平', portrait: '/assets/BASHU/dali_duansiping.png' },







    dongxu: [
        { generalId: 'dongxu_mangruiti', generalName: '莽瑞体', portrait: '/assets/BURMESE/dongxu_mangruiti.png' },
        // 🔴 [2026-10-20 首战规则] 莽应里＝东吁王（1593 廓沙拉败于纳黎萱）→ 凯图玛蒂（BURMESE）；帝国时代缅甸军团；立绘留空
        { generalId: 'gen_nanda_bayin', generalName: '莽应里', portrait: '', legionName: '帝国时代缅甸军团' },
    ],







    meitai: { generalId: 'meitai_hagenba', generalName: '哈根巴', portrait: '/assets/BENGALIS/meitai_hagenba.png' },  // 康格拉·曼尼普尔国王







    mu_lijiang: { generalId: 'mu_lijiang_muzeng', generalName: '木增', portrait: '/assets/BASHU/mu_lijiang_muzeng.png' },







    dianguo: [







        { generalId: 'dianguo_zhuangqiao', generalName: '庄蹻', portrait: '/assets/BASHU/dianguo_zhuangqiao.png' },







        // 🔴 [2026-10-20 主人令「放到离他事发地最近的相同建筑风格文化的据点」「所有武将都这么处理，不要擅自添加据点」] 事发地＝远征平滇称王之役 → 最近同风格据点滇池







        { generalId: 'bfe_dian_chief', legionName: '古典时代巴蜀军团', generalName: '靡莫大酋 苴兰', portrait: '' , eliteName: '靡莫部兵', eliteTier: 4},







    ],







    konbaung: { generalId: 'konbaung_yongjiya', generalName: '雍笈牙', portrait: '/assets/BURMESE/konbaung_yongjiya.png' },







    hantawadi: [
        { generalId: 'hantawadi_mangyinglong', generalName: '莽应龙', portrait: '/assets/BURMESE/hantawadi_mangyinglong.png' },
        // 🔴 [2026-10-20 首战规则] 彬尼亚达拉＝汉达瓦底末王（1757 勃固被雍籍牙攻灭）→ 勃固（BURMESE）；帝国时代缅甸军团；立绘留空
        { generalId: 'gen_binnya_dala', generalName: '彬尼亚达拉', portrait: '', legionName: '帝国时代缅甸军团' },
    ],







    nanzhao: [







        { generalId: 'nanzhao_geluofeng', generalName: '阁罗凤', portrait: '/assets/BASHU/nanzhao_geluofeng.png' },







        // 🔴 [2026-10-20 首战规则] 段酋迁＝南诏将（866 守交趾被高骈击破）→ 蒙舍城·南诏；普将；立绘留空







        { generalId: 'nanzhao_duanqiuxian', generalName: '段酋迁', portrait: '' },







    ],







    wuman: [







        { generalId: 'wuman_gaipin', generalName: '盖聘', portrait: '/assets/BASHU/wuman_cuangui.png' },







    ],







    dai: { generalId: 'dai_daoyingmeng', generalName: '刀应勐', portrait: '/assets/BURMESE/dai_daoyingmeng.png' },







    taiyuan: { generalId: 'taiyuan_menglai', generalName: '孟莱', portrait: '/assets/MALAY/taiyuan_menglai.png' },







    suke: { generalId: 'suke_langanheng', generalName: '兰甘亨', portrait: '/assets/KHMER/suke_langanheng.png' },







    luchuan: [



        { generalId: 'luchuan_sirenfa', generalName: '思任发', portrait: '/assets/BURMESE/luchuan_sirenfa.png' },



        // 🔴 [2026-10-20 首战规则] 思伦发＝麓川土司（1388 定远之战被沐英击败）→ 勐卯（BURMESE）；城堡时代阿瓦军团；立绘留空



        { generalId: 'gen_si_lunfa', generalName: '思伦发', portrait: '', legionName: '城堡时代阿瓦军团' },



    ],







    kunming_yi: { generalId: 'kunming_yi_lucheng', generalName: '卤承', portrait: '/assets/BASHU/kunming_yi_lucheng.png' },







    cuanshi: { generalId: 'cuanshi_cuanlongyan', generalName: '爨龙颜', portrait: '/assets/BASHU/cuanshi_cuanlongyan.png' },







    baiman: { generalId: 'baiman_gaoshengtai', generalName: '高升泰', portrait: '/assets/BASHU/baiman_gaoshengtai.png' },







    champa: [







        { generalId: 'champa_zhipenge', generalName: '制蓬峨', portrait: '/assets/KHMER/champa_zhipenge.png' },







        // 🔴 [2026-10-20 首战规则] 阇耶因陀罗跋摩四世＝占婆王（1181 洞里萨湖水战败于阇耶跋摩七世）→ 美山·占婆；普将；封建×高棉＝封建时代高棉军团；立绘留空







        { generalId: 'champa_jaya_indravarman_iv', legionName: '城堡时代吴哥军团', generalName: '阇耶因陀罗跋摩四世', portrait: '' },







    ],







    qiong: { generalId: 'qiong_rengui', generalName: '任贵', portrait: '/assets/BASHU/qiong_rengui.png' },







    // 莽应龙已移给 dongxu







    daozhou: { generalId: 'daozhou_yangzaixing', generalName: '杨再兴', portrait: '/assets/JIANGNAN/daozhou_yangzaixing.png' },







    guangping: { generalId: 'guangping_ruanwenzhang', generalName: '阮文张', portrait: '/assets/VIETNAMESE/guangping_ruanwenzhang.png' }, // 洞海城·阮朝水师名将







    jingjiang: { generalId: 'jingjiang_qushisi', generalName: '瞿式耜', portrait: '/assets/JIANGNAN/jingjiang_qushisi.png' }, // 永安·收复广西







    duanzhou_d: { generalId: 'duanzhou_d_caojin', generalName: '曹觐', portrait: '/assets/JIANGNAN/duanzhou_d_caojin.png' }, // 肇庆·屡败侬智高







    monong: { generalId: 'monong_anong', generalName: '阿侬', portrait: '/assets/VIETNAMESE/monong_anong.png' }, // 邦敦·侬智高母







    basha_d: { generalId: 'basha_d_daogengmeng', generalName: '刀更孟', portrait: '/assets/KHMER/basha_d_daogengmeng.png' }, // 上丁·巴沙象兵







    leizhou: { generalId: 'leizhou_limao', generalName: '李茂', portrait: '/assets/JIANGNAN/leizhou_limao.png' }, // 海康·雷州卫指挥







    ketagalan: { generalId: 'ketagalan_huangqingyun', generalName: '黄青云', portrait: '/assets/JIANGNAN/ketagalan_huangqingyun.png' }, // 艋舺·凯达格兰







    shuizhen: { generalId: 'shuizhen_qudaren', generalName: '区大任', portrait: '/assets/KHMER/shuizhen_qudaren.png' }, // 三菩·水真戍







  // ── 岭南/越南/台湾区 2026-06-18 ──







    ryukyu: { generalId: 'ryukyu_shangbazhi', generalName: '尚巴志', portrait: '/assets/JAPAN/ryukyu_shangbazhi.png' },







    luoping: { generalId: 'luoping_zhangshijie', generalName: '张世杰', portrait: '/assets/JIANGNAN/luoping_zhangshijie.png' },







    chaozhou_d: { generalId: 'chaozhou_d_mafa', generalName: '马发', portrait: '/assets/JIANGNAN/chaozhou_d_mafa.png' },







    chendiaoyan: { generalId: 'chendiaoyan_chendiaoyan', generalName: '陈吊眼', portrait: '/assets/JIANGNAN/chendiaoyan_chendiaoyan.png' },







    dengmaoqi: { generalId: 'dengmaoqi_dengmaoqi', generalName: '邓茂七', portrait: '/assets/JIANGNAN/dengmaoqi_dengmaoqi.png' },







    geng: { generalId: 'geng_gengjingzhong', generalName: '耿精忠', portrait: '/assets/JIANGNAN/geng_gengjingzhong.png' },







    longwu: [
        { generalId: 'longwu_huangdaozhou', generalName: '黄道周', portrait: '/assets/JIANGNAN/longwu_huangdaozhou.png' },
        { generalId: 'bfe3_75', generalName: '刘胄', portrait: '', factionId: 'shu', legionName: '古典时代吴越军团' },
    ],







    xinjiang: { generalId: 'xinjiang_maji', generalName: '马塈', portrait: '/assets/JIANGNAN/xinjiang_maji.png' },







    jing: [







        { generalId: 'jing_dingbuling', generalName: '丁部领', portrait: '/assets/VIETNAMESE/jing_dingbuling.png' },







        // 🔴 [2026-10-20 主人令「放到离他事发地最近的相同建筑风格文化的据点」「所有武将都这么处理，不要擅自添加据点」] 事发地＝平定十二使君之战 → 最近同风格据点华闾







        { generalId: 'bfe_ngo_nhat_khanh', legionName: '封建时代瞿越军团', generalName: '吴日庆', portrait: '' , eliteName: '交趾乡兵', eliteTier: 4},







    ],







    paiwan: { generalId: 'paiwan_alugu', generalName: '阿禄古', portrait: '/assets/MALAY/paiwan_alugu.png' },







    ming_zheng: [
        { generalId: 'ming_zheng_zhengchenggong', generalName: '郑成功', portrait: '/assets/JIANGNAN/ming_zheng_zhengchenggong.png' },
        // 🔴 [2026-10-20 首战规则] 刘国轩＝明郑澎湖守将（1683 澎湖海战败于施琅）→ 承天（JIANGNAN）；帝国时代两江军团；立绘留空
        { generalId: 'gen_liu_guoxuan', generalName: '刘国轩', portrait: '', legionName: '帝国时代两江军团' },
    ],







    nguyen_guangnan: { generalId: 'nguyen_guangnan_ruanfuying', generalName: '阮福映', portrait: '/assets/VIETNAMESE/nguyen_guangnan_ruanfuying.png' },







    zhuang_d: { generalId: 'zhuang_d_washifuren', generalName: '瓦氏', portrait: '/assets/JIANGNAN/zhuang_d_washifuren.png' },







    nanyue: { generalId: 'nanyue_zhaotuo', generalName: '赵佗', portrait: '/assets/JIANGNAN/nanyue_zhaotuo.png' },







    // 制旻＝占城（占婆）国王，「占城」是占婆的汉名 → 统一挂占婆







    zhancheng: { generalId: 'zhancheng_zhimin', generalName: '制旻', portrait: '/assets/VIETNAMESE/zhancheng_zhimin.png', factionId: 'champa' , eliteName: '占婆国水师', eliteTier: 3 },







    xiou: [
        { generalId: 'bfe_su_ding', generalName: '交趾太守 苏定', portrait: '', factionId: 'han_d', legionName: '古典时代吴越军团' },
        { generalId: 'xiou_yixusong', generalName: '译吁宋', portrait: '/assets/JIANGNAN/xiou_yixusong.png' },
        { generalId: 'bfe3_16', generalName: '桀骏', portrait: '', legionName: '古典时代吴越军团' },
    ],







    xichu: { generalId: 'xichu_xiangyu', generalName: '项羽', portrait: '/assets/CENTRAL/xichu_xiangyu.png' },







    gouding: { generalId: 'gouding_wubo', generalName: '毋波', portrait: '/assets/BASHU/gouding_wubo.png' },







    chen: { generalId: 'chen_chenbaxian', generalName: '陈霸先', portrait: '/assets/JIANGNAN/chen_chenbaxian.png' },







    dayu: [







        { generalId: 'dayu_wangshouren', generalName: '王守仁', portrait: '/assets/JIANGNAN/dayu_wangshouren.png' },







        // 🔴 [2026-10-20 首战规则] 李迁仕＝高州刺史、侯景党羽（551 被冼英斩）→ 南康·大庾；普将；封建×江南＝封建时代江淮军团；立绘留空







        { generalId: 'dayu_liqianshi', generalName: '李迁仕', portrait: '', legionName: '封建时代江淮军团' , eliteName: '高州部曲', eliteTier: 4 },   // 🔴 李迁仕是高州刺史，部曲（原配「南赣标军」是明代的）







    ],







    paiyao: { generalId: 'paiyao_huangguasi', generalName: '黄瓜四', portrait: '/assets/JIANGNAN/paiyao_huangguasi.png' },







    yingzhou: { generalId: 'yingzhou_liuyan', generalName: '刘龑', portrait: '/assets/JIANGNAN/yingzhou_liuyan.png' },







    linyi: { generalId: 'linyi_fanyangmai', generalName: '范阳迈', portrait: '/assets/VIETNAMESE/linyi_fanyangmai.png' },







    xian_d: { generalId: 'xian_d_xianfuren', generalName: '冼英', portrait: '/assets/JIANGNAN/xian_d_xianfuren.png' },







    luodian: { generalId: 'luodian_shexiang', generalName: '奢香', portrait: '/assets/BASHU/luodian_shexiang.png' },







    nong2: { generalId: 'nong2_nongzhigao', generalName: '侬智高', portrait: '/assets/VIETNAMESE/nong2_nongzhigao.png' },







    taiping: { generalId: 'taiping_shidakai', generalName: '石达开', portrait: '/assets/JIANGNAN/taiping_shidakai.png' },







    dongzu: { generalId: 'dongzu_wumian', generalName: '吴勉', portrait: '/assets/BASHU/dongzu_wumian.png' },







    tian_sizhou: { generalId: 'tian_sizhou_tianyougong', generalName: '田祐恭', portrait: '/assets/BASHU/tian_sizhou_tianyougong.png' },







    luoyue: { generalId: 'luoyue_zhengce', generalName: '征侧', portrait: '/assets/JIANGNAN/luoyue_zhengce.png' },







    li_s: { generalId: 'li_s_mayuan', generalName: '马援', portrait: '/assets/JIANGNAN/li_s_mayuan.png' },







    leloi: { generalId: 'leloi', generalName: '黎利', portrait: '/assets/VIETNAMESE/leloi.png' },







    dacheng: { generalId: 'dacheng_chenkai', generalName: '陈开', portrait: '/assets/JIANGNAN/dacheng_chenkai.png' },







    dayue: [







        { generalId: 'dayue_chenguojun', generalName: '陈国峻', portrait: '/assets/VIETNAMESE/dayue_chenguojun.png' },







    ],







    shengmiao: { generalId: 'shengmiao_baoli', generalName: '包利', portrait: '/assets/BASHU/shengmiao_baoli.png' },







    miao_qing: [
        { generalId: 'miao_qing_yangwanzhe', generalName: '杨完者', portrait: '/assets/BASHU/miao_qing_yangwanzhe.png' },
        { generalId: 'bfe3_50', generalName: '头兰', portrait: '', factionId: 'miao_qing', legionName: '古典时代巴蜀军团' },
    ],







    guizhou: { generalId: 'guizhou_lidingguo', generalName: '李定国', portrait: '/assets/JIANGNAN/guizhou_lidingguo.png' },







    liren: { generalId: 'liren_funanshe', generalName: '符南蛇', portrait: '/assets/JIANGNAN/liren_funanshe.png' },







    // guangnanguo → 洞海城改为 panjun







    yelang: { generalId: 'yelang_duotong', generalName: '多同', portrait: '/assets/BASHU/yelang_duotong.png' },







    zangke: { generalId: 'zangke_xielongyu', generalName: '谢龙羽', portrait: '/assets/BASHU/zangke_xielongyu.png' },







    xinggu: { generalId: 'xinggu_cuanxi', generalName: '爨习', portrait: '/assets/BASHU/xinggu_cuanxi.png' },







    guangxin: { generalId: 'guangxin_shixie', generalName: '士燮', portrait: '/assets/JIANGNAN/guangxin_shixie.png' },







    shaozhou: { generalId: 'shaozhou_zhangzhensun', generalName: '张镇孙', portrait: '/assets/JIANGNAN/shaozhou_zhangzhensun.png' },







    shixing: { generalId: 'shixing_houandou', generalName: '侯安都', portrait: '/assets/JIANGNAN/shixing_houandou.png' },







    buyi_d: { generalId: 'buyi_d_weichaoyuan', generalName: '韦朝元', portrait: '/assets/BASHU/buyi_d_weichaoyuan.png' },







    lizhou_d: [
        { generalId: 'lizhou_d_liaohua', generalName: '廖化', portrait: '/assets/BASHU/lizhou_d_liaohua.png' },
        { generalId: 'qingqiang_jiangwei', generalName: '姜维', portrait: '/assets/BASHU/qingqiang_jiangwei.png' },
    ],







      // ── 巴蜀关隘 2026-06-19 ──







    kui: { generalId: 'kui_gongsunshu', generalName: '公孙述', portrait: '/assets/BASHU/kui_gongsunshu.png' },







    yang_bozhou: { generalId: 'yang_bozhou_yangyinglong', generalName: '杨应龙', portrait: '/assets/BASHU/yang_bozhou_yangyinglong.png' },







    chenghan: { generalId: 'chenghan_lite', generalName: '李特', portrait: '/assets/BASHU/chenghan_lite.png' },







    agui: { generalId: 'agui', generalName: '阿桂', portrait: '/assets/BASHU/agui.png' },







    zuo_d: { generalId: 'zuo_d_wufu', generalName: '吴复', portrait: '/assets/BASHU/zuo_d_wufu.png' },







    miaomin: { generalId: 'miaomin_shiliudeng', generalName: '石柳邓', portrait: '/assets/JIANGNAN/miaomin_shiliudeng.png' },







    wumeng: { generalId: 'wumeng_azi', generalName: '阿资', portrait: '/assets/BASHU/wumeng_azi.png' },







    // 勒乌围·金川 / 乌蒙山·乌蛮 宁缺毋滥







// ── 巴蜀区 2026-06-18 ──







    tujia_d: { generalId: 'tujia_d_qinliangyu', generalName: '秦良玉', portrait: '/assets/BASHU/tujia_d_qinliangyu.png' },







    shuixi: { generalId: 'shuixi_anbangyan', generalName: '安邦彦', portrait: '/assets/BASHU/shuixi_anbangyan.png' },







    xiangzhou: { generalId: 'xiangzhou_lvwenhuan', generalName: '吕文焕', portrait: '/assets/CENTRAL/xiangzhou_lvwenhuan.png' },







    zaoyang_d: { generalId: 'zaoyang_d_menggong', generalName: '孟珙', portrait: '/assets/CENTRAL/zaoyang_d_menggong.png' },







    guo: { generalId: 'guo_jixin', generalName: '纪信', portrait: '/assets/BASHU/guo_jixin.png' },







    daxi_ming: { generalId: 'daxi_ming_zhangxianzhong', generalName: '张献忠', portrait: '/assets/BASHU/daxi_ming_zhangxianzhong.png' },







    zi: { generalId: 'zi_changhong', generalName: '苌弘', portrait: '/assets/BASHU/zi_changhong.png' , legionName: '先秦军团' },







    yidou: [
        // 🔴 [2026-10-20 主人令] 甘宁＝孙吴名将（锦帆贼出身）→ 夷陵（JIANGNAN）；古典时代吴越军团；锦帆贼T3
        { generalId: 'zhongxiang_ganning', generalName: '甘宁', portrait: '/assets/JIANGNAN/zhongxiang_ganning.png', factionId: 'sunwu_d', legionName: '古典时代吴越军团', eliteName: '锦帆贼', eliteTier: 3 },







        { generalId: 'yidou_luxun', generalName: '陆逊', portrait: '/assets/JIANGNAN/yidou_luxun.png' },







        // 🔴 [2026-10-20 首战规则] 戚昕＝南陈狼尾滩守将（589 被杨素水军击破）→ 夷陵·宜都；普将；封建×江南＝封建时代江淮军团；立绘留空







        { generalId: 'yidou_qixin', generalName: '戚昕', portrait: '', legionName: '封建时代江淮军团' , eliteName: '南陈水师', eliteTier: 4 },   // 🔴 戚昕是南陈狼尾滩水军守将（原配「夷陵奇兵」是三国陆逊的）







    ],







    chu: { generalId: 'chu_guanyu', generalName: '关羽', portrait: '/assets/JIANGNAN/chu_guanyu.png' },














    fengzhou: { generalId: 'fengzhou_wujie', generalName: '吴玠', portrait: '/assets/CENTRAL/fengzhou_wujie.png' },







    fushi: [







        { generalId: 'fushi_wangmeng', generalName: '王猛', portrait: '/assets/BASHU/fushi_wangmeng.png' },







        // 名将双身份：苻融（据点武将＋剧本敌将）







        { generalId: 'bfe3_88', generalName: '苻融', portrait: '', legionName: '古典时代巴蜀军团' , eliteName: '前秦卫军', eliteTier: 3},







        // 🔴 [2026-10-20 主人令「遇到问题先看符合历史，下结论再动手」] 首战回补安置按史实复核：张浚＝南宋川陕宣抚处置使，1130 富平战后驻兴州（今略阳）；开封从未是他的驻地 → 放略阳（fushi，风格 BASHU）；仍挂本政权 song
        { generalId: 'song_zhangjun', factionId: 'song', legionName: '城堡时代川峡军团', generalName: '张浚', portrait: '' },
    ],







    wanzhou: { generalId: 'wanzhou_shangguankui', generalName: '上官夔', portrait: '/assets/BASHU/wanzhou_shangguankui.png' },







    ba: { generalId: 'ba_bamanzi', generalName: '巴蔓子', portrait: '/assets/BASHU/ba_bamanzi.png' },







    hezhou: { generalId: 'hezhou_wangjian', generalName: '王坚', portrait: '/assets/BASHU/hezhou_wangjian.png' },







    qiuchi: { generalId: 'qiuchi_yangnandang', generalName: '杨难当', portrait: '/assets/BASHU/qiuchi_yangnandang.png' },







    cong: { generalId: 'cong_puhu', generalName: '朴胡', portrait: '/assets/BASHU/cong_puhu.png' },







    langzhou: { generalId: 'langzhou_zhangfei', generalName: '张飞', portrait: '/assets/BASHU/langzhou_zhangfei.png' },







    tan_d: { generalId: 'tan_d_qinhou', generalName: '覃垕', portrait: '/assets/BASHU/tan_d_qinhou.png' },







    xiang_d: { generalId: 'xiang_d_xiangdakun', generalName: '覃大旺', portrait: '/assets/JIANGNAN/xiang_d_xiangdakun.png' },







    ran_d: { generalId: 'ran_d_ranshouzhong', generalName: '冉守忠', portrait: '/assets/BASHU/ran_d_ranshouzhong.png' },







    wuxi: { generalId: 'wuxi_shamoke', generalName: '沙摩柯', portrait: '/assets/JIANGNAN/wuxi_shamoke.png' },







    kuai: { generalId: 'kuai_kuaiyue', generalName: '蒯越', portrait: '/assets/CENTRAL/kuai_kuaiyue.png' },







    bandun: { generalId: 'bandun_fanmu', generalName: '范目', portrait: '/assets/BASHU/bandun_fanmu.png' },







    she: { generalId: 'she_shechongming', generalName: '奢崇明', portrait: '/assets/BASHU/she_shechongming.png' },







    boren: { generalId: 'boren_ada', generalName: '阿大', portrait: '/assets/BASHU/boren_ada.png' },







    jingmen: { generalId: 'jingmen_zhaoyun', generalName: '赵云', portrait: '/assets/JIANGNAN/jingmen_zhaoyun.png' },







    chenzhou_d: { generalId: 'chenzhou_d_zhanghao', generalName: '张镐', portrait: '/assets/JIANGNAN/chenzhou_d_zhanghao.png' },







    xiqin: { generalId: 'xiqin_wanyanchenheshang', generalName: '完颜陈和尚', portrait: '/assets/CENTRAL/xiqin_wanyanchenheshang.png' },







    beidi: { generalId: 'beidi_yaochang', generalName: '姚苌', portrait: '/assets/CENTRAL/beidi_yaochang.png' },







    baiyang: { generalId: 'baiyang_mengtian', generalName: '蒙恬', portrait: '/assets/XIANBEI/baiyang_mengtian.png' },







    qianzhong: { generalId: 'qianzhong_wubayue', generalName: '吴八月', portrait: '/assets/JIANGNAN/qianzhong_wubayue.png' }, // 芷江·乾嘉苗民起义







    // 🔴 [2026-10-20 主人定「藏羌一家」] 梁弥定＝宕昌羌王，羌与藏同源，挂青藏文化的封建时代吐蕃军团可以（迭部风格已按史实改青藏）
    dangchang: { generalId: 'dangchang_liangmiding', generalName: '梁弥定', portrait: '/assets/TIBET/dangchang_liangmiding.png', legionName: '封建时代吐蕃军团' },







    liao: { generalId: 'liao_houhongyuan', generalName: '侯弘远', portrait: '/assets/BASHU/liao_houhongyuan.png' }, // 江阳·僚人酋帅







    sou: { generalId: 'sou_gaodingyuan', generalName: '高定元', portrait: '/assets/BASHU/sou_gaodingyuan.png' }, // 乐山·越巂叟族首领














    qingyi: { generalId: 'qingyi_fanchangsheng', generalName: '范长生', portrait: '/assets/BASHU/qingyi_fanchangsheng.png' },















  // ── 河西区 2026-06-18 ──







    liangzhou: [
        { generalId: 'liangzhou_zhanggui', generalName: '张轨', portrait: '/assets/KHITAN/liangzhou_zhanggui.png' },
        { generalId: 'bfe3_67', generalName: '王国', portrait: '', legionName: '古典时代凉州军团' },
    ],







    lanzhou: [
        { generalId: 'lanzhou_zhaochongguo', generalName: '赵充国', portrait: '/assets/KHITAN/lanzhou_zhaochongguo.png' },
        // 🔴 [2026-10-20 史实] 杨应琚＝陕甘总督，驻兰州；据点皋兰（KHITAN 河西）；帝国时代陕甘军团
        { generalId: 'xining_yangyingju', generalName: '杨应琚', portrait: '/assets/KHITAN/xining_yangyingju.png', factionId: 'manzhou_d', legionName: '帝国时代陕甘军团' },
    ],







    wudu: { generalId: 'wudu_dengai', generalName: '邓艾', portrait: '/assets/BASHU/wudu_dengai.png' },







    baishui: { generalId: 'baishui_yanghuai', generalName: '杨怀', portrait: '/assets/BASHU/baishui_yanghuai.png' },







    dangzhou: { generalId: 'dangzhou_qiangduan', generalName: '强端', portrait: '/assets/BASHU/dangzhou_qiangduan.png' },







    didao: { generalId: 'didao_wangshao', generalName: '王韶', portrait: '/assets/CENTRAL/didao_wangshao.png' },







    dashun: { generalId: 'dashun_lizicheng', generalName: '李自成', portrait: '/assets/CENTRAL/dashun_lizicheng.png' },







    zhai_han: { generalId: 'zhai_han_diqing', generalName: '狄青', portrait: '/assets/CENTRAL/zhai_han_diqing.png' },







    ganzhou: { generalId: 'ganzhou_dourong', generalName: '窦融', portrait: '/assets/KHITAN/ganzhou_dourong.png' },







    shazhou: { generalId: 'shazhou_zhangyichao', generalName: '张议潮', portrait: '/assets/KHITAN/shazhou_zhangyichao.png' },







    dongshengwei: { generalId: 'dongshengwei_wangyue', generalName: '王越', portrait: '/assets/XIANBEI/dongshengwei_wangyue.png' },







    guiyi: { generalId: 'guiyi_caoyijin', generalName: '曹议金', portrait: '/assets/KHITAN/guiyi_caoyijin.png' },







    weiming: { generalId: 'weiming_weiminglinggong', generalName: '嵬名山', portrait: '/assets/XIANBEI/weiming_weiminglinggong.png' },







    helian: { generalId: 'helian_helianbobo', generalName: '赫连勃勃', portrait: '/assets/XIANBEI/helian_helianbobo.png' },







    chile: { generalId: 'chile_hulvjin', generalName: '斛律金', portrait: '/assets/XIANBEI/chile_hulvjin.png' },







    chijin: { generalId: 'chijin_qiewangshijia', generalName: '且旺失加', portrait: '/assets/KHITAN/chijin_qiewangshijia.png' },







    yeli: { generalId: 'yeli_yeliwangrong', generalName: '野利旺荣', portrait: '/assets/XIANBEI/yeli_yeliwangrong.png' },







    // 🔴 [2026-10-20 主人「武将安置错误请修复」] 原条目把西汉光禄勋「徐自为」错当匈奴浑邪部守将；前121 河西之战的对手是浑邪王，王号即其名（本名未传）→ 改名浑邪王，立绘留空（原图是徐自为的，不配给他）







    hunxie: { generalId: 'hunxie_xuziwei', generalName: '浑邪王', portrait: '' },







    guazhou: { generalId: 'guazhou_zhangshougui', generalName: '张守珪', portrait: '/assets/KHITAN/guazhou_zhangshougui.png' },







    kang: { generalId: 'kang_liangshidou', generalName: '梁师都', portrait: '/assets/XIANBEI/kang_liangshidou.png' },







    woye: { generalId: 'woye_huangfugui', generalName: '皇甫规', portrait: '/assets/XIANBEI/woye_huangfugui.png' },







    yingli: { generalId: 'yingli_jilasiyi', generalName: '籍辣思义', portrait: '/assets/KHITAN/yingli_jilasiyi.png' },







    dangxiang: { generalId: 'dangxiang_liyuanhao', generalName: '李元昊', portrait: '/assets/KHITAN/dangxiang_liyuanhao.png' },







    huizhou: { generalId: 'huizhou_yaosi', generalName: '姚兕', portrait: '/assets/CENTRAL/huizhou_yaosi.png' },







    huan: { generalId: 'huan_zhongshidao', generalName: '种师道', portrait: '/assets/CENTRAL/huan_zhongshidao.png' },







    wei2: { generalId: 'wei2_hunjian', generalName: '浑瑊', portrait: '/assets/KHITAN/wei2_hunjian.png' },







    // 🔴 [2026-10-20 抽查] 仆固怀恩：唐朔方节度使（原挂灵州藩镇势力）→ 势力=唐国；据点回乐（灵州/灵武）✓；精锐 朔方军 T1







    lingzhou: [







        { generalId: 'pugu_puguhuaien', generalName: '仆固怀恩', portrait: '/assets/KHITAN/pugu_puguhuaien.png', factionId: 'tang', eliteName: '朔方军', eliteTier: 1 },







        // 🔴 [2026-10-20 主人令「裴济就放灵州，用灵州的军团也是对的；裴济带领大夏军团没有问题，夏州本来就是宋地，灵州本来也有少数民族对抗李继迁」] 裴济＝北宋灵州知州（1002 城陷战死），双身份：据点武将＋该战守方主帅；军团＝灵州城的封建时代河西军团；立绘留空







        { generalId: 'song_peiji', generalName: '裴济', portrait: '', factionId: 'song', legionName: '封建时代河西军团' },







    ],







    ningkou: { generalId: 'ningkou_liling', generalName: '李陵', portrait: '/assets/KHITAN/ningkou_liling.png' },







    juqu_d: { generalId: 'juqu_d_juqumengxun', generalName: '沮渠蒙逊', portrait: '/assets/KHITAN/juqu_d_juqumengxun.png' },







        zhengzhou: { generalId: 'zhengzhou_chenqingzhi', generalName: '陈庆之', portrait: '/assets/CENTRAL/zhengzhou_chenqingzhi.png' },







    sunqin: { generalId: 'sunqin_sunchuanting', generalName: '孙传庭', portrait: '/assets/CENTRAL/sunqin_sunchuanting.png' },







    hongnong_jun: { generalId: 'hongnong_jun_yangsu', generalName: '杨素', portrait: '/assets/CENTRAL/hongnong_jun_yangsu.png' },















// ── 中原区 2026-06-18 ──







    tianxiong: { generalId: 'tianxiong_tianchengsi', generalName: '田承嗣', portrait: '/assets/CENTRAL/tianxiong_tianchengsi.png' },







    ranwei_d: { generalId: 'ranwei_d_ranmin', generalName: '冉闵', portrait: '/assets/WEI/ranwei_d_ranmin.png' },







    jin: [
        { generalId: 'jin_xianzhen', generalName: '先轸', portrait: '/assets/CENTRAL/jin_xianzhen.png' , legionName: '先秦军团' },
        { generalId: 'bfe2_xun_linfu', generalName: '荀林父', portrait: '', legionName: '古典时代华夏军团' },
    ],







    zhong: { generalId: 'zhong_xiexuan', generalName: '谢玄', portrait: '/assets/CENTRAL/zhong_xiexuan.png' },







    zhongshan: { generalId: 'zhongshan_yangaoqing', generalName: '颜杲卿', portrait: '/assets/WEI/zhongshan_yangaoqing.png' },







    jingzhou_gs: { generalId: 'jingzhou_gs_huangfusong', generalName: '皇甫嵩', portrait: '/assets/CENTRAL/jingzhou_gs_huangfusong.png' },







    wang_d: { generalId: 'wang_d_liuyu', generalName: '刘裕', portrait: '/assets/CENTRAL/wang_d_liuyu.png' },







    chimei: { generalId: 'chimei_fanchong', generalName: '樊崇', portrait: '/assets/CENTRAL/chimei_fanchong.png' },







    xiao_d: { generalId: 'xiao_d_xiaoyan', generalName: '萧衍', portrait: '/assets/CENTRAL/xiao_d_xiaoyan.png' },







    wazhai: { generalId: 'wazhai_zhanghan', generalName: '章邯', portrait: '/assets/CENTRAL/wazhai_zhanghan.png' },







    jiaodong: { generalId: 'jiaodong_tiandan', generalName: '田单', portrait: '/assets/CENTRAL/jiaodong_tiandan.png' },







    jibei: { generalId: 'jibei_wangkuang', generalName: '王匡', portrait: '/assets/CENTRAL/jibei_wangkuang.png' },







    jinan: { generalId: 'jinan_tiexuan', generalName: '铁铉', portrait: '/assets/CENTRAL/jinan_tiexuan.png' },







    qi: [
        { generalId: 'bfe3_90', generalName: '慕容超', portrait: '', legionName: '古典时代华夏军团' },
        { generalId: 'bfe3_58', generalName: '张步', portrait: '', legionName: '古典时代华夏军团' },
        { generalId: 'bfe2_bao_shuya', generalName: '鲍叔牙', portrait: '', legionName: '古典时代华夏军团' },
        { generalId: 'qi_simarangju', generalName: '司马穰苴', portrait: '/assets/CENTRAL/qi_simarangju.png' , legionName: '先秦军团' },
        { generalId: 'bfe2_qi_qinggong', generalName: '齐顷公', portrait: '', legionName: '古典时代华夏军团' },
    ],







    huaiyang: { generalId: 'huaiyang_zhouyafu', generalName: '周亚夫', portrait: '/assets/CENTRAL/huaiyang_zhouyafu.png' },







    yingzhou_d: { generalId: 'yingzhou_d_liuqi', generalName: '刘锜', portrait: '/assets/CENTRAL/yingzhou_d_liuqi.png' },







    cao_d: [







        { generalId: 'cao_d_caocao', generalName: '曹操', portrait: '/assets/CENTRAL/cao_d_caocao.png' },







        // 🔴 [2026-10-20 主人令「乐进挂殷国不对，修复」] 乐进是曹魏五子良将，与商/殷无关；







        //    原挂「殷国·朝歌」是把他籍贯「阳平卫国（县）」误当卫国故地朝歌。现归曹操本营亳州·谯县（曹魏起家地）。







        { generalId: 'yin_yuejin', generalName: '乐进', portrait: '/assets/CENTRAL/yin_yuejin.png' },







    ],







    long2: { generalId: 'long2_weixiaokuan', generalName: '韦孝宽', portrait: '/assets/CENTRAL/long2_weixiaokuan.png' },







    dongxian: { generalId: 'dongxian_sunbin', generalName: '孙膑', portrait: '/assets/CENTRAL/dongxian_sunbin.png' },







    mi: { generalId: 'mi_mizhu', generalName: '麋竺', portrait: '/assets/CENTRAL/mi_mizhu.png' },







    baibo: { generalId: 'baibo_guotai', generalName: '郭太', portrait: '/assets/CENTRAL/baibo_guotai.png' },







    ruzhou: { generalId: 'ruzhou_sunjian', generalName: '孙坚', portrait: '/assets/CENTRAL/ruzhou_sunjian.png' },







    ruo: { generalId: 'ruo_wangjian', generalName: '王翦', portrait: '/assets/CENTRAL/ruo_wangjian.png' },







    yaozhou: { generalId: 'yaozhou_limaozhen', generalName: '李茂贞', portrait: '/assets/CENTRAL/yaozhou_limaozhen.png' },







    jiyuan: { generalId: 'jiyuan_huluguang', generalName: '斛律光', portrait: '/assets/CENTRAL/jiyuan_huluguang.png' },







    // 周泰（东吴宿卫；原 wuwu_d，吕蒙迁濡须口后改挂莱国据点）







    yangshao: { generalId: 'yangshao_zhoubo', generalName: '周勃', portrait: '/assets/CENTRAL/yangshao_zhoubo.png' },







    dixiang: { generalId: 'dixiang_wangmang', generalName: '王莽', portrait: '/assets/CENTRAL/dixiang_wangmang.png' },







    zhou: [







        { generalId: 'zhou_jifu', generalName: '吉甫', portrait: '/assets/CENTRAL/zhou_jifu.png' , legionName: '先秦军团' },







        { generalId: 'zhou_jifa', generalName: '姬发', portrait: '/assets/CENTRAL/zhou_jifa.png' , legionName: '先秦军团' },







    ],







    quanrong: [







        { generalId: 'quanrong_yiquhai', generalName: '义渠骇', portrait: '/assets/CENTRAL/quanrong_yiquhai.png' },







    ],







    cai: { generalId: 'cai_lishuo', generalName: '石勒', portrait: '/assets/CENTRAL/cai_lishuo.png' },







    yun: { generalId: 'yun_wuli', generalName: '吾离', portrait: '/assets/CENTRAL/yun_wuli.png' , legionName: '先秦军团' },







    suzhou_d: { generalId: 'suzhou_d_shikefa', generalName: '史可法', portrait: '/assets/CENTRAL/suzhou_d_shikefa.png' },







    pizhou: { generalId: 'pizhou_lvbu', generalName: '吕布', portrait: '/assets/CENTRAL/pizhou_lvbu.png' },







    yin: [







        // 🔴 [2026-10-20 主人令「相同势力，归到一个势力中」] 子受＝商王帝辛（殷即商），与安阳妇好同属商 → 挂商国旗、不与商互打







        { generalId: 'yin_dixin', generalName: '子受', portrait: '/assets/CENTRAL/yin_dixin.png', factionId: 'shang' , legionName: '先秦军团' , eliteName: '虎贲多射', eliteTier: 2 },







    ],







    qing: { generalId: 'qing_quduan', generalName: '曲端', portrait: '/assets/CENTRAL/qing_quduan.png' },







    han: { generalId: 'han_baoyuan', generalName: '暴鸢', portrait: '/assets/CENTRAL/han_baoyuan.png' },







    xuguo: [
        { generalId: 'caoren', generalName: '曹仁', portrait: '/assets/CENTRAL/caoren.png' },
        { generalId: 'bfe_wu_yuanji', generalName: '吴元济', portrait: '', factionId: 'tang', legionName: '封建时代中原军团' },
    ],







    bailian: { generalId: 'bailian_wangconger', generalName: '王聪儿', portrait: '/assets/CENTRAL/bailian_wangconger.png' },







    shen: [







        { generalId: 'shen_shenbo', generalName: '申伯', portrait: '/assets/CENTRAL/shen_shenbo.png' , legionName: '先秦军团' },







        // 🔴 [2026-10-20 主人令「放到离他事发地最近的相同建筑风格文化的据点」「所有武将都这么处理，不要擅自添加据点」] 事发地＝宣王南征谢邑封国战 → 最近同风格据点安康







        { generalId: 'bfe_huaiyi_chief', legionName: '古典时代华夏军团', generalName: '淮夷首领 嬴夷吾', portrait: '' , eliteName: '淮夷弓手', eliteTier: 4},







    ],







    sima_d: { generalId: 'sima_d_simayi', generalName: '司马懿', portrait: '/assets/CENTRAL/sima_d_simayi.png' },







    liguo: { generalId: 'liguo_zhaoshe', generalName: '赵奢', portrait: '/assets/CENTRAL/liguo_zhaoshe.png' },







    huai: [







        { generalId: 'huai_zhuyuanzhang', generalName: '朱元璋', portrait: '/assets/CENTRAL/huai_zhuyuanzhang.png' },







    ],







    // 商鞅：姬姓公孙氏，本名卫鞅/公孙鞅，封于商（商於）后历代通称商鞅







    shangzhou: { generalId: 'shangzhou_shangyang', generalName: '商鞅', portrait: '/assets/CENTRAL/shangzhou_shangyang.png' },







    yuan_cj_d: { generalId: 'yuan_cj_d_lishuo', generalName: '李愬', portrait: '/assets/CENTRAL/yuan_cj_d_lishuo.png' },







    // 🔴 [2026-10-20 抽查] 郭子仪：唐中央名将（原挂新平藩镇势力）→ 势力=唐国；据点新平（邠州，他镇邠多年）✓；精锐 朔方军 T1







    xinping: { generalId: 'lingwu_guoziyi', generalName: '郭子仪', portrait: '/assets/CENTRAL/lingwu_guoziyi.png', factionId: 'tang', eliteName: '朔方军', eliteTier: 1 },







    yuzhou: { generalId: 'yuzhou_zuti', generalName: '祖逖', portrait: '/assets/CENTRAL/yuzhou_zuti.png' },







    mengcheng_d: { generalId: 'mengcheng_d_gaoqiong', generalName: '高琼', portrait: '/assets/CENTRAL/mengcheng_d_gaoqiong.png' },







    lulin: { generalId: 'lulin_liuxiu', generalName: '刘秀', portrait: '/assets/CENTRAL/lulin_liuxiu.png' },







    dang_d: [







        { generalId: 'dang_d_zhuwen', generalName: '朱温', portrait: '/assets/CENTRAL/dang_d_zhuwen.png' },







        // 🔴 [2026-10-20 首战规则] 庞师古＝朱温大将（897 清口之战被杨行密决水斩杀）→ 虞城·虞国；普将；立绘留空







        { generalId: 'dang_d_pangshigu', generalName: '庞师古', portrait: '' },







    ],







    hao_d: { generalId: 'hao_d_weirui', generalName: '韦睿', portrait: '/assets/JIANGNAN/hao_d_weirui.png' },







    bozhou_d: { generalId: 'bozhou_d_yujin', generalName: '于禁', portrait: '/assets/CENTRAL/bozhou_d_yujin.png' },







    zhuozhou: [
        { generalId: 'bfe_yin_ziqi', generalName: '尹子奇', portrait: '', legionName: '封建时代河朔军团' },







        { generalId: 'zhuozhou_anlushan', generalName: '安禄山', portrait: '/assets/WEI/zhuozhou_anlushan.png' },







        // 🔴 [2026-10-20 主人令「把剩下4位缺的敌将新建为据点武将」] 首战敌将·名将双身份（立绘留空，走回落）







        { generalId: 'gen_shi_chaoyi', generalName: '史朝义', portrait: '', legionName: '封建时代河朔军团' , eliteName: '范阳铁骑', eliteTier: 3},







        // 🔴 [2026-10-20 首战规则] 安守忠＝757 香积寺之战大燕主帅（败退）→ 范阳·涿州（大燕）；普将；立绘留空







        { generalId: 'zhuozhou_anshouzhong', generalName: '安守忠', portrait: '' },







        // 🔴 [2026-10-20 首战规则] 史思明＝757 太原之围大燕主帅（被李光弼击退）、759 邺城破唐军 → 范阳·涿州（大燕）；名将；立绘留空







        { generalId: 'zhuozhou_shisiming', generalName: '史思明', portrait: '' },







    ],







        chanzhou: { generalId: 'chanzhou_chairong', generalName: '柴荣', portrait: '/assets/CENTRAL/chanzhou_chairong.png' },







    lai: { generalId: 'lai_wangshifan', generalName: '王师范', portrait: '/assets/CENTRAL/lai_wangshifan.png' }, // 青石关·平卢节帅屡败朱温







    mushi: { generalId: 'mushi_muchong', generalName: '公孙五楼', portrait: '/assets/CENTRAL/mushi_muchong.png' },







    xiongding: { generalId: 'xiongding_murongyong', generalName: '慕容永', portrait: '/assets/CENTRAL/xiongding_murongyong.png' },















    pinghai: { generalId: 'pinghai_laihuer', generalName: '来护儿', portrait: '/assets/WEI/pinghai_laihuer.png' },







    pingyuan: { generalId: 'pingyuan_yanzhenqing', generalName: '颜真卿', portrait: '/assets/WEI/pingyuan_yanzhenqing.png' }, // 平原·首倡义兵抗安史







    linhu: { generalId: 'linhu_mafang', generalName: '马芳', portrait: '/assets/WEI/linhu_mafang.png' },







    xianyu: { generalId: 'xianyu_hanxin', generalName: '韩信', portrait: '/assets/WEI/xianyu_hanxin.png' },







    shizhao_d: [
        { generalId: 'bfe3_85', generalName: '石琨', portrait: '', legionName: '古典时代太行军团' },







        { generalId: 'shizhao_d_shihu', generalName: '石虎', portrait: '/assets/WEI/shizhao_d_shihu.png' },







    ],







    loufan: { generalId: 'loufan_xuerengui', generalName: '薛仁贵', portrait: '/assets/WEI/loufan_xuerengui.png' },







    shanrong: [







        { generalId: 'shanrong_lanyu', generalName: '蓝玉', portrait: '/assets/WEI/shanrong_lanyu.png' },







        // 🔴 [2026-10-20 主人「武将安置错误请修复」] 李广：陇西是籍贯不是驻地；飞将军守右北平 → 无终（右北平郡治，汉国）







        { generalId: 'li_lx_d_liguang', generalName: '李广', portrait: '/assets/WEI/li_lx_d_liguang.png', legionName: '古典时代太行军团', factionId: 'han_d' },







    ],















    // ── 北方关隘 2026-06-19 ──







    you: { generalId: 'you_gengyan', generalName: '耿弇', portrait: '/assets/WEI/you_gengyan.png' },







    lingqiu: { generalId: 'lingqiu_zhaowuling', generalName: '赵雍', portrait: '/assets/WEI/lingqiu_zhaowuling.png' },







    yi: { generalId: 'yi_yuqian', generalName: '于谦', portrait: '/assets/WEI/yi_yuqian.png' },







    huo: { generalId: 'huo_songlaosheng', generalName: '宋老生', portrait: '/assets/CENTRAL/huo_songlaosheng.png' },







    // ── 北方区 2026-06-18 ──







    jinzhou: { generalId: 'jinzhou_lichengliang', generalName: '李成梁', portrait: '/assets/WEI/jinzhou_lichengliang.png' },







    zu_d: { generalId: 'zu_d_yuanchonghuan', generalName: '袁崇焕', portrait: '/assets/XIANBEI/zu_d_yuanchonghuan.png' },







    mao_wenlong: { generalId: 'mao_wenlong_maowenlong', generalName: '毛文龙', portrait: '/assets/KOREA/mao_wenlong_maowenlong.png' },







    gongsun_d: { generalId: 'gongsun_d_gongsundu', generalName: '公孙度', portrait: '/assets/WEI/gongsun_d_gongsundu.png' },







    jianzhou_nvzhen: { generalId: 'jianzhou_nvzhen_limanzhu', generalName: '李满住', portrait: '/assets/NORTHEAST/jianzhou_nvzhen_limanzhu.png' }, // 浑江·建州女真卫







    weihaiwei: { generalId: 'weihaiwei_sudingfang', generalName: '苏定方', portrait: '/assets/WEI/weihaiwei_sudingfang.png' },







    xuan: { generalId: 'xuan_xuda', generalName: '徐达', portrait: '/assets/WEI/xuan_xuda.png' },







    tuoba: [







        { generalId: 'tuoba_tuobagui', generalName: '拓跋珪', portrait: '/assets/WEI/tuoba_tuobagui.png' },














    ],







    changshan: { generalId: 'changshan_yangyanzhao', generalName: '杨延昭', portrait: '/assets/WEI/changshan_yangyanzhao.png' },







    hejian: [
        { generalId: 'hejian_gongsunzan', generalName: '公孙瓒', portrait: '/assets/WEI/hejian_gongsunzan.png' }, // 文安·河间郡公孙瓒白马义从,
        { generalId: 'bfe3_68', generalName: '严纲', portrait: '', legionName: '古典时代太行军团' },
    ],







    liangshidu: { generalId: 'liangshidu_longjia', generalName: '龙贾', portrait: '/assets/WEI/liangshidu_longjia.png' },







    yangshe: { generalId: 'yangshe_yangshezhi', generalName: '羊舌职', portrait: '/assets/CENTRAL/yangshe_yangshezhi.png' , legionName: '先秦军团' }, // 铜鞮·晋羊舌氏封邑







    guzhu: { generalId: 'guzhu_tianyu', generalName: '田豫', portrait: '/assets/WEI/guzhu_tianyu.png' },







    dizhou: { generalId: 'dizhou_wangyanzhang', generalName: '王彦章', portrait: '/assets/WEI/dizhou_wangyanzhang.png' },







    qu_d: { generalId: 'qu_d_quyi', generalName: '麴义', portrait: '/assets/CENTRAL/qu_d_quyi.png' },







    gaoqi_d: [







        { generalId: 'gaoqi_d_gaohuan', generalName: '高欢', portrait: '/assets/WEI/gaoqi_d_gaohuan.png' },







        // 🔴 [2026-10-20 首战规则] 萧轨＝北齐将、556 白下之战主帅（被陈霸先击败被俘）→ 蓨城·北齐；普将；立绘留空







        { generalId: 'gaoqi_d_xiaogui', generalName: '萧轨', portrait: '' },







    ],







    wangyan: { generalId: 'wangyan_wangyan', generalName: '王彦', portrait: '/assets/WEI/wangyan_wangyan.png' },







    linyu: { generalId: 'linyu_wusangui', generalName: '吴三桂', portrait: '/assets/WEI/linyu_wusangui.png' },







    dai_d: { generalId: 'dai_d_shijingtang', generalName: '石敬瑭', portrait: '/assets/WEI/dai_d_shijingtang.png' },







    erzhu: [







        { generalId: 'erzhu_erzhurong', generalName: '尔朱荣', portrait: '/assets/WEI/erzhu_erzhurong.png' },







        // 🔴 [2026-10-20 首战规则] 尔朱兆＝尔朱氏首领（532 韩陵山之战败于高欢）→ 秀容川·尔朱；普将；立绘留空







        { generalId: 'erzhu_erzhuzhao', generalName: '尔朱兆', portrait: '' },







    ],







    zhe_d: { generalId: 'zhe_d_zheyuqing', generalName: '折御卿', portrait: '/assets/WEI/zhe_d_zheyuqing.png' },







    heng1: { generalId: 'heng1_yangye', generalName: '杨业', portrait: '/assets/WEI/heng1_yangye.png' },







    dingxiang_d: { generalId: 'dingxiang_d_lijing', generalName: '李靖', portrait: '/assets/XIANBEI/dingxiang_d_lijing.png' },







    xiayang_d: { generalId: 'xiayang_d_dengyu', generalName: '邓禹', portrait: '/assets/CENTRAL/xiayang_d_dengyu.png' },







    ying: [
        { generalId: 'bfe2_zi_chang', generalName: '子常', portrait: '', legionName: '古典时代吴越军团' },
        { generalId: 'bfe2_ziyu', generalName: '子玉', portrait: '', legionName: '古典时代吴越军团' },
        { generalId: 'bfe2_chu_zhuangwang', generalName: '楚庄王', portrait: '', legionName: '古典时代吴越军团' },







        { generalId: 'ying_caojingzong', generalName: '曹景宗', portrait: '/assets/JIANGNAN/ying_caojingzong.png' },







        // 2026-10-20 主人令：名将双身份（据点武将＋剧本敌将）







        { generalId: 'bfe3_13', generalName: '项燕', portrait: '', legionName: '古典时代吴越军团' , eliteName: '楚甲士', eliteTier: 2},







    ],







    kejia: { generalId: 'kejia_wentianxiang', generalName: '黄凤', portrait: '/assets/JIANGNAN/kejia_huangfeng.png' },







    tingzhou_d: { generalId: 'tingzhou_d_chenmin', generalName: '陈敏', portrait: '/assets/JIANGNAN/tingzhou_d_chenmin.png' },







    fu2: { generalId: 'fu2_zhoudi', generalName: '周迪', portrait: '/assets/JIANGNAN/fu2_zhoudi.png' },







    ouyang: { generalId: 'ouyang_ouyangwei', generalName: '欧阳頠', portrait: '/assets/JIANGNAN/ouyang_ouyangwei.png' },







    chu_d: { generalId: 'chu_d_lukang', generalName: '陆康', portrait: '/assets/JIANGNAN/wan_lukang.png' },







    yan: { generalId: 'yan_leyi', generalName: '乐毅', portrait: '/assets/WEI/yan_leyi.png' },







    zhao: [
        { generalId: 'bfe_ren_guang', generalName: '任光', portrait: '', factionId: 'han_d', legionName: '古典时代华夏军团' },
        { generalId: 'bfe_dou_jiande', generalName: '窦建德', portrait: '', factionId: 'zhao', legionName: '封建时代中原军团' },
        { generalId: 'bfe3_18', generalName: '陈馀', portrait: '', legionName: '古典时代华夏军团' },







        { generalId: 'zhao_lianpo', generalName: '廉颇', portrait: '/assets/CENTRAL/zhao_lianpo.png' },







        // 🔴 [2026-10-20 首战规则] 葛荣＝六镇起义河北首领（528 滏口被尔朱荣所擒），称齐帝；据点邯郸（河北）；势力＝起义；起义军团（三级）；立绘留空







        { generalId: 'zhao_gerong', generalName: '葛荣', portrait: '', factionId: 'panjun', legionName: '起义军' },







    ],







    yunzhong: { generalId: 'yunzhong_tuobaliwei', generalName: '拓跋力微', portrait: '/assets/XIANBEI/yunzhong_tuobaliwei.png' },







    yang_aner: { generalId: 'yang_aner_yangan', generalName: '杨安', portrait: '/assets/WEI/yang_aner_yangan.png' },







        xie_cj_d: { generalId: 'xie_xiefangde', generalName: '谢枋得', portrait: '/assets/JIANGNAN/xie_xiefangde.png' }, // 葛溪·信州抗元殉国







    wan: { generalId: 'wan_liuyuan', generalName: '刘源', portrait: '/assets/JIANGNAN/wan_liuyuan.png' },







    huang_d: { generalId: 'huang_d_sunshuao', generalName: '贾逵', portrait: '/assets/JIANGNAN/huang_d_sunshuao.png' },







    wenzhou: { generalId: 'wenzhou_zhangcong', generalName: '方国珍', portrait: '/assets/JIANGNAN/wenzhou_fangguozhen.png' },







    wuling: { generalId: 'wuling_xiangdancheng', generalName: '相单程', portrait: '/assets/JIANGNAN/wuling_xiangdancheng.png' },















// ── 江南区 2026-06-18 ──







    jiujiang: { generalId: 'jiujiang_zhouyu', generalName: '周瑜', portrait: '/assets/JIANGNAN/jiujiang_zhouyu.png' },







    fangla: { generalId: 'fangla_fangla', generalName: '方腊', portrait: '/assets/JIANGNAN/fangla_fangla.png' },







    fang_guozhen: { generalId: 'fang_guozhen_fangguozhen', generalName: '卢镗', portrait: '/assets/JIANGNAN/fang_guozhen_fangguozhen.png' },







    ouyue: { generalId: 'ouyue_zouyao', generalName: '驺摇', portrait: '/assets/JIANGNAN/ouyue_zouyao.png' },







    ruochu: { generalId: 'ruochu_doulian', generalName: '鬬廉', portrait: '/assets/JIANGNAN/ruochu_doulian.png' , legionName: '先秦军团' },







    wuwu_d: { generalId: 'wuwu_d_lvmeng', generalName: '吕蒙', portrait: '/assets/JIANGNAN/wuwu_d_lvmeng.png' },







    taizhou: { generalId: 'li_bian', generalName: '李昪', portrait: '/assets/JIANGNAN/taizhou_libian.png' },







    sunwu_d: [



        { generalId: 'sunwu_d_sunquan', generalName: '孙权', portrait: '/assets/JIANGNAN/sunwu_d_sunquan.png' },



        // 🔴 [2026-10-20 首战规则] 陈友谅＝陈汉皇帝（1363 鄱阳湖战死，此前围洪都）→ 武昌（JIANGNAN）；天完起义余部，按起义铁律挂起义军；立绘留空



        { generalId: 'gen_chen_youliang', generalName: '陈友谅', portrait: '', factionId: 'xushouhui', legionName: '起义军' },



    ],







    yue: [
        { generalId: 'yue_goujian', generalName: '勾践', portrait: '/assets/JIANGNAN/yue_goujian.png' , legionName: '先秦军团' },
        { generalId: 'bfe_gao_zhihui', generalName: '高智慧', portrait: '', legionName: '封建时代江淮军团' },
    ],







    heng: { generalId: 'heng_hetengjiao', generalName: '何腾蛟', portrait: '/assets/JIANGNAN/heng_hetengjiao.png' },







    xushouhui: { generalId: 'xushouhui_zhaopusheng', generalName: '赵普胜', portrait: '/assets/JIANGNAN/xushouhui_zhaopusheng.png' },







    sui: [







        { generalId: 'sui_yangjian', generalName: '杨坚', portrait: '/assets/JIANGNAN/sui_yangjian.png' },














    ],







    changshaguo: [
        { generalId: 'changshaguo_xinqiji', generalName: '辛弃疾', portrait: '/assets/JIANGNAN/changshaguo_xinqiji.png' },
        // 🔴 [2026-10-20 首战规则] 曾国藩＝湘军主帅（1855 湖口九江败于石达开）→ 长沙（JIANGNAN），挂清旗；帝国时代两江军团；立绘留空
        { generalId: 'gen_zengguofan', generalName: '曾国藩', portrait: '', factionId: 'manzhou_d', legionName: '帝国时代两江军团' },
    ],







    yue_d: { generalId: 'yue_d_lusu', generalName: '鲁肃', portrait: '/assets/JIANGNAN/yue_d_lusu.png' },







    zhangshicheng: { generalId: 'zhangshicheng_zhangshicheng', generalName: '张士诚', portrait: '/assets/JIANGNAN/zhangshicheng_zhangshicheng.png' },







    wu: [







        { generalId: 'wu_sunwu', generalName: '孙武', portrait: '/assets/JIANGNAN/wu_sunwu.png' , legionName: '先秦军团' },







        // 🔴 [2026-10-20 首战规则] 夫差＝前478 笠泽之战吴方君主（孙武前478已隐退，不能当敌将）；立绘留空走回落







        { generalId: 'wu_fuchai', generalName: '夫差', portrait: '' , legionName: '古典时代吴越军团' },







        // 2026-10-20 主人令：名将双身份（据点武将＋剧本敌将）







        { generalId: 'bfe3_28', generalName: '刘濞', portrait: '', legionName: '古典时代吴越军团' , eliteName: '吴楚步卒', eliteTier: 3},







        // 名将双身份：刘繇（据点武将＋剧本敌将）







        { generalId: 'bfe3_70', generalName: '刘繇', portrait: '', legionName: '古典时代吴越军团', factionId: 'han_d' , eliteName: '大汉材官', eliteTier: 2 },







    ],







    qian_d: [
        { generalId: 'bfe_ajibaldo', generalName: '阿只拔都', portrait: '', legionName: '帝国时代两江军团' },
        { generalId: 'qian_d_yudayou', generalName: '俞大猷', portrait: '/assets/JIANGNAN/qian_d_yudayou.png' },
        { generalId: 'bfe_xu_hai', generalName: '徐海', portrait: '', factionId: 'qian_d', legionName: '帝国时代两江军团' },
    ],







    qiufu: { generalId: 'qiufu_qiufu', generalName: '裘甫', portrait: '/assets/JIANGNAN/qiufu_qiufu.png' },







    qi_d: { generalId: 'qi_d_qijiguang', generalName: '戚继光', portrait: '/assets/JIANGNAN/qi_d_qijiguang.png' },







    yiyang_d: { generalId: 'yiyang_d_mengzongzheng', generalName: '孟宗政', portrait: '/assets/JIANGNAN/yiyang_d_mengzongzheng.png' },







    yezongliu: { generalId: 'yezongliu_yezongliu', generalName: '叶宗留', portrait: '/assets/JIANGNAN/yezongliu_yezongliu.png' },







    shenshi: { generalId: 'shenshi_wentianxiang', generalName: '文天祥', portrait: '/assets/JIANGNAN/shenshi_wentianxiang.png' },







    huangwang: { generalId: 'huangwang_huangchao', generalName: '黄巢', portrait: '/assets/JIANGNAN/huangwang_huangchao.png' },







    lujian: { generalId: 'lujian_zhanghuangyan', generalName: '张煌言', portrait: '/assets/JIANGNAN/lujian_zhanghuangyan.png' },







    linshihong: { generalId: 'linshihong_linshihong', generalName: '林士弘', portrait: '/assets/JIANGNAN/linshihong_linshihong.png' },







    liu: { generalId: 'liu_yingbu', generalName: '英布', portrait: '/assets/JIANGNAN/liu_yingbu.png' },







    // ting 已迁 wenzhou，王潮（闽国）归福建系







    shuntian: { generalId: 'shuntian_linshuangwen', generalName: '林爽文', portrait: '/assets/JIANGNAN/shuntian_linshuangwen.png' },







    chunshen: { generalId: 'chunshen_huangxie', generalName: '黄歇', portrait: '/assets/JIANGNAN/chunshen_huangxie.png' },







    mi_chu: { generalId: 'mi_chu_xionglv', generalName: '熊旅', portrait: '/assets/JIANGNAN/mi_chu_xionglv.png' , legionName: '先秦军团' },







    shanyue: { generalId: 'shanyue_sunce', generalName: '孙策', portrait: '/assets/JIANGNAN/shanyue_sunce.png' },







    she_ethnic: { generalId: 'she_ethnic_leiwanxing', generalName: '雷万兴', portrait: '/assets/JIANGNAN/she_ethnic_leiwanxing.png' },







    wang_s: { generalId: 'wang_s_wanghua', generalName: '汪华', portrait: '/assets/JIANGNAN/wang_s_wanghua.png' },







    hongzhou: [
        { generalId: 'hongzhou_zhuwenzheng', generalName: '朱文正', portrait: '/assets/JIANGNAN/hongzhou_zhuwenzheng.png' },
        { generalId: 'bfe_zhu_chenhao', generalName: '宁王 朱宸濠', portrait: '', factionId: 'ming_d', legionName: '帝国时代两江军团' },
    ],







    danyang: { generalId: 'danyang_huanwen', generalName: '桓温', portrait: '/assets/JIANGNAN/danyang_huanwen.png' },







    chizhou: { generalId: 'chizhou_changyuchun', generalName: '常遇春', portrait: '/assets/JIANGNAN/chizhou_changyuchun.png' },







    gumie: { generalId: 'gumie_liuyu', generalName: '李之芳', portrait: '/assets/JIANGNAN/gumie_liuyu.png' },







    hu_d: { generalId: 'hu_d_husansheng', generalName: '吴允诚', portrait: '/assets/JIANGNAN/hu_d_husansheng.png' },







    sagami: { generalId: 'sagami_beitiaoshikang', generalName: '北条氏康', portrait: '/assets/JAPAN/sagami_beitiaoshikang.png' },







    mino: { generalId: 'mino_dagujiji', generalName: '大谷吉继', portrait: '/assets/JAPAN/mino_dagujiji.png' },







    zhuqian: { generalId: 'zhuqian_shaoerzineng', generalName: '少贰资能', portrait: '/assets/JAPAN/zhuqian_shaoerzineng.png' },







    ssangseong: { generalId: 'ssangseong_lizichun', generalName: '李子春', portrait: '/assets/KOREA/ssangseong_lizichun.png' },







    yao: { generalId: 'yao_liuyuan', generalName: '刘渊', portrait: '/assets/CENTRAL/yao_liuyuan.png' },







    kong_d: { generalId: 'kong_d_caogui', generalName: '曹刿', portrait: '/assets/CENTRAL/kong_d_caogui.png' , legionName: '先秦军团' },







    tongma: { generalId: 'tongma_taishici', generalName: '太史慈', portrait: '/assets/CENTRAL/tongma_taishici.png' },







    yanchuan_d: { generalId: 'yanchuan_d_yuefei', generalName: '岳飞', portrait: '/assets/CENTRAL/yanchuan_d_yuefei.png' , legionName: '城堡时代中华军团' },







    guide_d: { generalId: 'guide_d_xiaohe', generalName: '萧何', portrait: '/assets/CENTRAL/guide_d_xiaohe.png' },














    fu_zhou: { generalId: 'fu_zhou_yanyan', generalName: '严颜', portrait: '/assets/BASHU/fu_zhou_yanyan.png' },







    lushui: [







        { generalId: 'lushui_dongzhuo', generalName: '董卓', portrait: '/assets/KHITAN/lushui_dongzhuo.png' },







        // 名将双身份：华雄（据点武将＋剧本敌将）







        { generalId: 'bfe3_69', generalName: '华雄', portrait: '', legionName: '古典时代凉州军团' , eliteName: '西凉铁骑', eliteTier: 3},







    ],







    cen_d: { generalId: 'cen_d_cenmeng', generalName: '岑猛', portrait: '/assets/JIANGNAN/cen_d_cenmeng.png' },







    miao: { generalId: 'miao_amishi', generalName: '阿迷氏', portrait: '/assets/BASHU/miao_amishi.png' },







    jiang_s: { generalId: 'jiang_s_huanggai', generalName: '黄盖', portrait: '/assets/JIANGNAN/jiang_s_huanggai.png' },







    muong: { generalId: 'muong_shencongyue', generalName: '申从岳', portrait: '/assets/VIETNAMESE/muong_shencongyue.png' },







    panyao: { generalId: 'panyao_pandaxiao', generalName: '盘大孝', portrait: '/assets/JIANGNAN/panyao_pandaxiao.png' },







    chen2: { generalId: 'chen2_zhaofan', generalName: '赵范', portrait: '/assets/JIANGNAN/chen2_zhaofan.png' },







    qian: { generalId: 'qian_songjingyang', generalName: '宋景阳', portrait: '/assets/BASHU/qian_songjingyang.png' },














    jiashi: { generalId: 'jiashi_wangxuance', generalName: '王玄策', portrait: '/assets/TIBET/jiashi_wangxuance.png' },







    yangtong: { generalId: 'yangtong_chisongdezan', generalName: '赤松德赞', portrait: '/assets/TIBET/yangtong_chisongdezan.png' },







    monpa: { generalId: 'monpa_meire', generalName: '洛珠嘉措', portrait: '/assets/TIBET/monpa_luozhujiacuo.png' },





















    golog: { generalId: 'golog_wandezhaxi', generalName: '完德扎西', portrait: '/assets/TIBET/golog_wandezhaxi.png' },







    lopi: { generalId: 'lopi_abo', generalName: '阿波', portrait: '/assets/TIBET/lopi_abo.png' },







    donghu: { generalId: 'donghu_tuiyin', generalName: '推寅', portrait: '/assets/XIANBEI/donghu_tuiyin.png' },







    dingling: { generalId: 'dingling_weilu', generalName: '卫律', portrait: '/assets/MONGOL/dingling_weilu.png' },







    yingzhou_ying_d: { generalId: 'yingzhou_ying_d_muronghuang', generalName: '慕容皝', portrait: '/assets/XIANBEI/yingzhou_ying_d_muronghuang.png' },







    buriat: { generalId: 'buriat_tumenjiergale', generalName: '吉尔嘎勒', portrait: '/assets/MONGOL/buriat_tumenjiergale.png' },







    oirat_ming: [







        { generalId: 'wala_yexian', generalName: '也先', portrait: '/assets/MONGOL/wala_yexian.png' },







        { generalId: 'oirat_ming_gaerdan', generalName: '噶尔丹', portrait: '/assets/MONGOL/oirat_ming_gaerdan.png', legionName: '帝国时代喀尔喀军团' },







    ],







    donghui: { generalId: 'donghui_nanlv', generalName: '南闾', portrait: '/assets/KOREA/donghui_nanlv.png' },







    gonggu: { generalId: 'gonggu_gonggudaozhu', generalName: '麻利芝', portrait: '/assets/JAPAN/gonggu_gonggudaozhu.png' },







    yizhi: { generalId: 'yizhi_beigou', generalName: '难升米', portrait: '/assets/JAPAN/yizhi_beigou.png' },







    beihai: { generalId: 'beihai_shamusheyun', generalName: '沙牟奢允', portrait: '/assets/JAPAN/beihai_shamusheyun.png' },







    sheng_d: { generalId: 'sheng_d_liyiqi', generalName: '李亿祺', portrait: '/assets/KOREA/sheng_d_liyiqi.png' },







    haikou: { generalId: 'haikou_wangzhi', generalName: '汪直', portrait: '/assets/JIANGNAN/haikou_wangzhi.png' },







    shanshan: { generalId: 'shanshan_weituqi', generalName: '尉屠耆', portrait: '/assets/WESTERN/shanshan_weituqi.png' },







    qianhui: { generalId: 'qianhui_baiyanhu', generalName: '白彦虎', portrait: '/assets/BASHU/qianhui_baiyanhu.png' },







    ava: { generalId: 'ava_minye_kyawswa', generalName: '明耶觉苏瓦', portrait: '/assets/BURMESE/ava_minye_kyawswa.png' },







    dian: { generalId: 'dian_cuanchongdao', generalName: '爨崇道', portrait: '/assets/BASHU/dian_cuanchongdao.png' },







    mon: [



        { generalId: 'mon_monuhe', generalName: '摩奴诃', portrait: '/assets/BURMESE/mon_monuhe.png' },



        // 🔴 [2026-10-20 首战规则] 罗娑陀利＝勃固孟王（1385–1421，1415 阿瓦攻达拉）→ 直通（BURMESE）；城堡时代阿瓦军团；立绘留空



        { generalId: 'gen_razadarit', generalName: '罗娑陀利', portrait: '', legionName: '城堡时代阿瓦军团' },



    ],







    ganden: { generalId: 'ganden_zongkaba', generalName: '宗喀巴', portrait: '/assets/TIBET/ganden_zongkaba.png' },







    niang: { generalId: 'niang_suonanjiabo', generalName: '索南加波', portrait: '/assets/TIBET/niang_suonanjiabo.png' },







    dalung: { generalId: 'dalung_sangjiwen', generalName: '桑吉温', portrait: '/assets/TIBET/dalung_sangjiwen.png' },







    dong: { generalId: 'dong_nangqianjiabo', generalName: '囊谦', portrait: '/assets/TIBET/dong_nangqianjiabo.png' },







    hor: { generalId: 'hor_chisang', generalName: '赤桑', portrait: '/assets/TIBET/hor_chisang.png' },







    pyu: { generalId: 'pyu_moluo', generalName: '摩罗惹', portrait: '/assets/BURMESE/pyu_moluo.png' },







    nongzhigao: { generalId: 'nongzhigao_huangshimi', generalName: '黄师宓', portrait: '/assets/JIANGNAN/nongzhigao_huangshimi.png' },







    weitou: { generalId: 'weitou_douti', generalName: '兜题', portrait: '/assets/WESTERN/weitou_douti.png' },







    yumi: { generalId: 'yumi_anguo', generalName: '安国', portrait: '/assets/WESTERN/yumi_anguo.png' },







    qiemo: { generalId: 'qiemo_anmoshenpan', generalName: '安末深盘', portrait: '/assets/WESTERN/qiemo_anmoshenpan.png' },







    pishan: { generalId: 'pishan_daihu', generalName: '代胡', portrait: '/assets/WESTERN/pishan_daihu.png' },







    ruoqiang: { generalId: 'ruoqiang_quhulai', generalName: '去胡来', portrait: '/assets/WESTERN/ruoqiang_quhulai.png' },







    weili: { generalId: 'weili_weilifan', generalName: '尉犁泛', portrait: '/assets/WESTERN/weili_weilifan.png' },







    wensu: { generalId: 'wensu_guyi', generalName: '姑翼', portrait: '/assets/WESTERN/wensu_guyi.png' },







    duerbote: { generalId: 'duerbote_duerbote_taiji', generalName: '博贝', portrait: '/assets/WESTERN/duerbote_duerbote_taiji.png' },







    xiye: { generalId: 'xiye_zihe', generalName: '子合', portrait: '/assets/WESTERN/xiye_zihe.png' },







    faqiang: { generalId: 'faqiang_niechizanpu', generalName: '聂赤', portrait: '/assets/TIBET/faqiang_niechizanpu.png' },







    zhuoshi: { generalId: 'zhuoshi_gaopian', generalName: '高骈', portrait: '/assets/BASHU/zhuoshi_gaopian.png' },







    xingliao: { generalId: 'xingliao_dayanlin', generalName: '大延琳', portrait: '/assets/KOREA/xingliao_dayanlin.png' },







    xihai_d: { generalId: 'xihai_d_fulianchou', generalName: '伏连筹', portrait: '/assets/KHITAN/xihai_d_fulianchou.png' },







    guzgan: { generalId: 'guzgan_abuhalisi', generalName: '阿布哈里斯', portrait: '/assets/PERSIAN/guzgan_abuhalisi.png' },







    kawusi: { generalId: 'kawusi_haidaer', generalName: '海达尔', portrait: '/assets/CENTRAL_ASIA/kawusi_haidaer.png' },







    xianhai: { generalId: 'xianhai_shamalike', generalName: '沙马利克', portrait: '/assets/CENTRAL_ASIA/xianhai_shamalike.png' },







    wuhu: { generalId: 'wuhu_dukake', generalName: '都卡克', portrait: '/assets/CENTRAL_ASIA/wuhu_dukake.png' },







    xingan: { generalId: 'xingan_hailancha', generalName: '海兰察', portrait: '/assets/XIANBEI/xingan_hailancha.png' },







    dongping: { generalId: 'dongping_langtan', generalName: '郎坦', portrait: '/assets/NORTHEAST/dongping_langtan.png' },







    badakhshan: { generalId: 'badakhshan_yaerbeige', generalName: '雅尔贝格', portrait: '/assets/CENTRAL_ASIA/badakhshan_yaerbeige.png' },







    keliya: { generalId: 'keliya_fuduxin', generalName: '伏阇信', portrait: '/assets/TIBET/keliya_fuduxin.png' },







    bailong: { generalId: 'bailong_suomai', generalName: '索劢', portrait: '/assets/WESTERN/bailong_suomai.png' },







    sai: { generalId: 'sai_gaijiayun', generalName: '盖嘉运', portrait: '/assets/WESTERN/sai_gaijiayun.png' },







    weiwuer: { generalId: 'weiwuer_yusubu', generalName: '玉素布', portrait: '/assets/WESTERN/weiwuer_yusubu.png' },







    kangba: { generalId: 'kangba_suonuomugunbu', generalName: '索诺木衮布', portrait: '/assets/TIBET/kangba_suonuomugunbu.png' },







    yong: { generalId: 'yong_lujili', generalName: '庐戢黎', portrait: '/assets/CENTRAL/yong_lujili.png' , legionName: '先秦军团' },







    jingcheng_d: { generalId: 'jingcheng_d_yuyouzhao', generalName: '鱼有沼', portrait: '/assets/KOREA/jingcheng_d_yuyouzhao.png' },







    // 🔴 [2026-10-20 主人令「不能让同势力的人乱打，不能白起打王龁」] 白起是秦将 → 出场挂秦（百岁模式出城即归秦）







    xin: [







        { generalId: 'xin_baiqi', generalName: '白起', portrait: '/assets/CENTRAL/xin_baiqi.png', factionId: 'qin' , eliteName: '铁鹰锐士', eliteTier: 1 },





















    ],







  pangzha: { generalId: 'pangzha_halixinge', generalName: '哈里辛格', portrait: '/assets/PURU/pangzha_halixinge.png' },







    najie: { generalId: 'najie_minande', generalName: '米南德', portrait: '/assets/PURU/najie_minande.png' },







    dulan_d: { generalId: 'dulan_d_aihamaide', generalName: '艾哈迈德', portrait: '/assets/PERSIAN/dulan_d_aihamaide.png' },







    muer: { generalId: 'muer_mujier', generalName: '穆吉尔', portrait: '/assets/PERSIAN/muer_mujier.png' },







  baha: { generalId: 'baha_gaiwamu', generalName: '盖瓦姆', portrait: '/assets/PERSIAN/baha_gaiwamu.png' },







    hali: { generalId: 'hali_gedaerzi', generalName: '戈达尔兹', portrait: '/assets/PERSIAN/hali_gedaerzi.png' },







  kalan: { generalId: 'kalan_suhela', generalName: '苏赫拉', portrait: '/assets/PERSIAN/kalan_suhela.png' },







    xisi: [







        { generalId: 'xisi_safaer', generalName: '萨法尔', portrait: '/assets/PERSIAN/xisi_safaer.png' },







        // 2026-10-20：萨法尔王朝创建者雅库布·伊本·莱斯（840–879）→ 锡斯坦（博斯特）；PERSIAN×封建＝德莱木军团







        { generalId: 'xisi_yakubusafaer', generalName: '雅库布', portrait: '', legionName: '封建时代德莱木军团' , eliteName: '萨法尔骑', eliteTier: 3},







        // 🔴 [2026-10-20 首战规则] 阿姆尔·本·莱斯＝萨法尔王朝第二任埃米尔（900 巴尔赫被萨曼伊斯玛仪生擒）→ 博斯特·锡斯坦；名将；立绘留空







        { generalId: 'xisi_amr', generalName: '阿姆尔·本·莱斯', portrait: '' },







    ],







  delan: { generalId: 'delan_sulun', generalName: '苏伦', portrait: '/assets/PERSIAN/delan_sulun.png' },







    huluo: { generalId: 'huluo_jiyasiding', generalName: '吉亚斯丁', portrait: '/assets/PERSIAN/huluo_jiyasiding.png' },







  aba: { generalId: 'aba_shapuer', generalName: '沙普尔', portrait: '/assets/PERSIAN/aba_shapuer.png', legionName: '古典时代萨珊军团' },







    wenling: { generalId: 'wenling_shilang', generalName: '施琅', portrait: '/assets/JIANGNAN/wenling_shilang.png' },







    // 🔴 [2026-10-20 抽查] 李晟：唐中央名将（原挂乾州藩镇势力）→ 势力=唐国；据点奉天（平叛驻地）✓；精锐 神策军 T2







    qianzhou: { generalId: 'qianzhou_lisheng', generalName: '李晟', portrait: '/assets/CENTRAL/qianzhou_lisheng.png', factionId: 'tang', eliteName: '神策军', eliteTier: 2 },







    wuyue: { generalId: 'wuyue_qianliu', generalName: '钱镠', portrait: '/assets/JIANGNAN/wuyue_qianliu.png' },







    shaozhou_d: { generalId: 'shaozhou_d_mayin', generalName: '马殷', portrait: '/assets/JIANGNAN/shaozhou_d_mayin.png' },















    song: [
        { generalId: 'bfe_chen_dong', generalName: '陈东', portrait: '', legionName: '城堡时代中华军团' },







        { generalId: 'song_zhaokuangyin', generalName: '赵匡胤', portrait: '/assets/CENTRAL/song_zhaokuangyin.png' },







        // 🔴 [2026-10-20 首战规则] 赵光义＝宋太宗（979 高梁河之战亲征，被耶律休哥大败）→ 开封·宋国；名将；立绘留空







        { generalId: 'song_zhaoguangyi', generalName: '赵光义', portrait: '' },







        // 🔴 [2026-10-20 首战规则] 任福＝北宋好水川之战主帅（1041 中伏战死）→ 萧关（好水川一带）·宋国；普将；立绘留空







        { generalId: 'song_renfu', generalName: '任福', portrait: '' },














    ],







    chuzhou_d: { generalId: 'chuzhou_d_huangfuhui', generalName: '皇甫晖', portrait: '/assets/JIANGNAN/chuzhou_d_huangfuhui.png' },







    xiyuduhu: { generalId: 'xiyuduhu_banchao', generalName: '班超', portrait: '/assets/KHITAN/xiyuduhu_banchao.png' },







    zizhou: { generalId: 'zizhou_wangjian', generalName: '王建', portrait: '/assets/BASHU/zizhou_wangjian.png' },







    cangzhou: { generalId: 'cangzhou_liurengong', generalName: '刘仁恭', portrait: '/assets/WEI/cangzhou_liurengong.png' },







    yuezhi: { generalId: 'yuezhi_xihou', generalName: '黄头', portrait: '/assets/KHITAN/yuezhi_xihou.png' },







    minyue: [
        { generalId: 'minyue_wuzhu', generalName: '无诸', portrait: '/assets/JIANGNAN/minyue_wuzhu.png' },
        { generalId: 'bfe3_22', generalName: '驺郢', portrait: '', legionName: '古典时代吴越军团' },
    ],







    funan: { generalId: 'funan_fanman', generalName: '范蔓', portrait: '/assets/KHMER/funan_fanman.png' },







    lancang: { generalId: 'lancang_faang', generalName: '法昂', portrait: '/assets/KHMER/lancang_faang.png' },







    ahaomu: { generalId: 'ahaomu_laqite', generalName: '拉其特', portrait: '/assets/BENGALIS/ahaomu_laqite.png' },







    elunchunzu: { generalId: 'elunchunzu_gaishan', generalName: '盖山', portrait: '/assets/NORTHEAST/elunchunzu_gaishan.png' },







    wazu: { generalId: 'wazu_banhongwang', generalName: '胡玉山', portrait: '/assets/BASHU/wazu_banhongwang.png' },







    tajikezu: { generalId: 'tajikezu_kuerban', generalName: '库尔班', portrait: '/assets/WESTERN/tajikezu_kuerban.png' },







    jingpozu: { generalId: 'jingpozu_zaodan', generalName: '早丹', portrait: '/assets/BURMESE/jingpozu_zaodan.png' },







    shuizu: { generalId: 'shuizu_panxinjian', generalName: '潘新简', portrait: '/assets/BASHU/shuizu_panxinjian.png' },







    liuzhou: { generalId: 'liuzhou_shenxiyi', generalName: '沈希仪', portrait: '/assets/JIANGNAN/liuzhou_shenxiyi.png' },







    luming: { generalId: 'luming_luxiangsheng', generalName: '卢象升', portrait: '/assets/CENTRAL/luming_luxiangsheng.png' },







    dingzhou: { generalId: 'dingzhou_d_murongchui', generalName: '慕容垂', portrait: '/assets/WEI/dingzhou_d_murongchui.png' },







    shanzhou: [
        { generalId: 'shanzhou_wangzhongsi', generalName: '王忠嗣', portrait: '/assets/KHITAN/shanzhou_wangzhongsi.png' },
        // 🔴 [2026-10-20 主人令「没有历史吗，为什么让我定」] 哥舒翰＝陇右节度使（747 起，封西平郡王），治所鄯州（今西宁一带，库里的乐都），前任王忠嗣同在此；原挂 潘寨→西宁势力（马海台，在柴达木，离鄯州六七百公里）与史实不符 → 放乐都（河西边墙要塞风格，唐蕃边塞）；势力＝唐；军团＝封建×河西（蕃汉混编的河陇军）。他军中史载有吐谷浑、突厥、铁勒、党项、羌等蕃兵，吐蕃降户无明确记载 → 不给吐蕃军团（吐蕃是他的对手）
        { generalId: 'gaoliang_geshuhan', factionId: 'tang', generalName: '哥舒翰', portrait: '/assets/KHITAN/gaoliang_geshuhan.png', legionName: '封建时代河西军团' },
    ],







    weizhou: { generalId: 'weizhou_weigao', generalName: '韦皋', portrait: '/assets/BASHU/weizhou_weigao.png' },







    yingzhou_d2: { generalId: 'yingzhou_d2_licunxu', generalName: '李存勖', portrait: '/assets/WEI/yingzhou_d2_licunxu.png' },







    dongsheng: { generalId: 'dongsheng_weishang', generalName: '魏尚', portrait: '/assets/XIANBEI/dongsheng_weishang.png' },







    weiyuan: { generalId: 'weiyuan_d_niangengyao', generalName: '年羹尧', portrait: '/assets/KHITAN/weiyuan_d_niangengyao.png' },







    yansui: { generalId: 'yansui_wangwei', generalName: '王威', portrait: '/assets/WEI/yansui_wangwei.png' },







    // 🔴 [2026-10-20 主人令「大夏/夏州本来就该合并，这是一家，一个政权，必须合并」]







    //    李继迁＝党项李氏夏州政权首领（李元昊祖父辈），与李元昊的大夏（西夏）是同一政权的前后两段







    //    → 挂大夏（dangxiang）旗；据点（靖边堡）归属不动，在场时城归大夏，退场后还原







    xiazhou: { generalId: 'xiazhou_lijiqian', generalName: '李继迁', portrait: '/assets/KHITAN/xiazhou_lijiqian.png', factionId: 'dangxiang' },







    shizhou: { generalId: 'shizhou_liucong', generalName: '刘聪', portrait: '/assets/WEI/shizhou_liucong.png' },







    yanzhou: { generalId: 'yanzhou_zhongshiheng', generalName: '种世衡', portrait: '/assets/KHITAN/yanzhou_zhongshiheng.png' },







    cangsong: { generalId: 'cangsong_machao', generalName: '马超', portrait: '/assets/KHITAN/cangsong_machao.png' },







    manghuti: { generalId: 'manghuti_weidaer', generalName: '畏答儿', portrait: '/assets/MONGOL/manghuti_weidaer.png' },







    xingwei: { generalId: 'xingwei_hanba', generalName: '罕拔', portrait: '/assets/BURMESE/xingwei_hanba.png' },







    saerbadaer: { generalId: 'saerbadaer_lazhake', generalName: '拉扎克', portrait: '/assets/PERSIAN/saerbadaer_lazhake.png' },







    kumisi: { generalId: 'kumisi_aerpu', generalName: '阿尔普', portrait: '/assets/PERSIAN/kumisi_aerpu.png' },







    shahelude: { generalId: 'shahelude_weisitamu', generalName: '维斯塔姆', portrait: '/assets/PERSIAN/shahelude_weisitamu.png' },







    ribale: { generalId: 'ribale_faheerdaolai', generalName: '法赫尔道莱', portrait: '/assets/PERSIAN/ribale_faheerdaolai.png' },







    safawei: { generalId: 'safawei_aisimaier', generalName: '艾斯迈尔', portrait: '/assets/PERSIAN/safawei_aisimaier.png' },







    yilihanguo: [







        { generalId: 'yilihanguo_yisimeier', generalName: '伊斯梅尔', portrait: '/assets/PERSIAN/yilihanguo_yisimeier.png', legionName: '城堡时代伊儿军团' },







        // 🔴 [2026-10-20 首战规则] 怯的不花＝伊儿汗国先锋主帅（1260 阿音贾鲁特被拜巴尔斯击败）→ 赞詹·伊儿汗国（阿杰姆）；名将；封建×波斯＝封建时代德莱木军团；立绘留空







        { generalId: 'yilihanguo_kitbuqa', legionName: '城堡时代伊儿军团', generalName: '怯的不花', portrait: '' },







    ],







    yilihanguo_d: { generalId: 'yilihanguo_d_hezan', generalName: '合赞', portrait: '/assets/PERSIAN/yilihanguo_d_hezan.png', legionName: '城堡时代伊儿军团' },







    asaibaijiang: { generalId: 'asaibaijiang_xuliewu', generalName: '旭烈兀', portrait: '/assets/PERSIAN/asaibaijiang_xuliewu.png', legionName: '城堡时代伊儿军团' },







    wulaertu: [
        { generalId: 'wulaertu_ajishenti', generalName: '瓦尔丹', portrait: '/assets/ARMENIANS/wulaertu_ajishenti.png' },
        { generalId: 'wulaertu_ashot3', generalName: '阿硕特三世', portrait: '', legionName: '封建时代巴格拉图尼军团', eliteName: '纳哈拉尔骑', eliteTier: 3 },
    ],







    wulaertu_guo: { generalId: 'wulaertu_guo_saerdu', generalName: '萨尔杜里', portrait: '/assets/ARMENIANS/wulaertu_guo_saerdu.png' },







    gelujiya: { generalId: 'gelujiya_tamaer', generalName: '塔玛尔', portrait: '/assets/GEORGIANS/gelujiya_tamaer.png' },







    bendou: { generalId: 'bendou_alikesai', generalName: '阿历克塞', portrait: '/assets/BYZANTINE/bendou_alikesai.png' },







    keerjisi: { generalId: 'keerjisi_bagelate', generalName: '巴格拉特', portrait: '/assets/GEORGIANS/keerjisi_bagelate.png' },







    saipulusi: { generalId: 'saipulusi_juyi', generalName: '居伊', portrait: '/assets/FRANKS/saipulusi_juyi.png' },







    bendou_d: { generalId: 'bendou_d_mitelidati', generalName: '密特里达梯', portrait: '/assets/ORIE/bendou_d_mitelidati.png' },







    heti: [







        { generalId: 'heti_alialate', generalName: '阿里阿拉特', portrait: '/assets/ORIE/heti_alialate.png' },







        { generalId: 'heti_muwatali', generalName: '穆瓦塔利', portrait: '/assets/ORIE/heti_muwatali.png' },







    ],







    fulijiya: { generalId: 'fulijiya_maidasi', generalName: '迈达斯', portrait: '/assets/ORIE/fulijiya_maidasi.png' },







    ldiya: { generalId: 'ldiya_keluoyisi', generalName: '克罗伊斯', portrait: '/assets/GREECE/ldiya_keluoyisi.png' },







    pajiama: { generalId: 'pajiama_oumainisi', generalName: '欧迈尼斯', portrait: '/assets/GREECE/pajiama_oumainisi.png' },







    bitiniya: { generalId: 'bitiniya_diaoduoer', generalName: '狄奥多尔', portrait: '/assets/BYZANTINE/bitiniya_diaoduoer.png' },







    luomu: { generalId: 'luomu_jilijie', generalName: '基利杰', portrait: '/assets/ORIE/luomu_jilijie.png', legionName: '城堡时代加齐突骑军团' },







    osman: [
        // 🔴 [2026-10-20 首战规则] 卡拉·穆斯塔法帕夏＝奥斯曼大维齐尔（1683 维也纳战败被处死）→ 布尔萨（TURKS）；帝国时代土耳其军团；立绘留空
        { generalId: 'gen_kara_mustafa', generalName: '卡拉·穆斯塔法', portrait: '', legionName: '帝国时代土耳其军团' },
        // 🔴 [2026-10-20 首战规则] 拉拉·穆斯塔法帕夏＝奥斯曼统帅（1565 马耳他大围攻）→ 布尔萨（TURKS）；帝国时代土耳其军团；立绘留空
        { generalId: 'gen_mustafa_pasha', generalName: '穆斯塔法帕夏', portrait: '', legionName: '帝国时代土耳其军团' },
        // 🔴 [2026-10-20 首战规则] 苏莱曼大帝＝奥斯曼苏丹（1566 锡盖特堡军营中病逝）→ 布尔萨（TURKS）；帝国时代土耳其军团；立绘留空
        { generalId: 'gen_suleiman', generalName: '苏莱曼', portrait: '', legionName: '帝国时代苏丹亲兵军团' },



        { generalId: 'osman_mehmed_ii', generalName: '穆罕默德二世', portrait: '/assets/TURKS/osman_mehmed_ii.png' , legionName: '城堡时代加齐突骑军团' },



        // 🔴 [2026-10-20 首战规则] 巴耶济德一世＝奥斯曼苏丹（1402 安卡拉被帖木儿击败俘死）→ 布尔萨（TURKS）；城堡时代加齐突骑军团；立绘留空



        { generalId: 'gen_bayezid_i', generalName: '巴耶济德一世', portrait: '', legionName: '城堡时代加齐突骑军团' },



    ],







    sailiugu: [
        { generalId: 'bfe3_23', generalName: '塞隆', portrait: '', legionName: '古典时代近东军团' },
        // 🔴 [2026-10-20 主人令] 塞琉古一世＝塞琉古帝国开国君主（前301 伊普苏斯破安提柯）→ 安提俄基亚（ORIE）；古典时代近东军团；立绘留空
        { generalId: 'gen_seleucus_i', generalName: '塞琉古', portrait: '', legionName: '古典时代近东军团' , eliteName: '银盾兵', eliteTier: 1},







        { generalId: 'sailiugu_antiaoke', generalName: '安条克', portrait: '/assets/ORIE/sailiugu_antiaoke.png' },







        // 名将双身份：安条克一世（据点武将＋剧本敌将）







        { generalId: 'bfe3_6', generalName: '安条克一世', portrait: '', legionName: '古典时代近东军团' , eliteName: '银盾兵', eliteTier: 1},







        // 🔴 [2026-10-20 首战规则] 雅吉·西扬＝安条克城守将（1098 十字军围城时被杀）→ 安提俄基亚·塞尔柱；普将；封建×ORIE＝封建时代哈里发军团；立绘留空







        { generalId: 'sailiugu_yaghi', legionName: '城堡时代撒拉森军团', generalName: '雅吉·西扬', portrait: '' },







    ],







    womaya: [
        { generalId: 'bfe2_rezin', generalName: '利汛', portrait: '', factionId: 'womaya', legionName: '古典时代近东军团' },







        { generalId: 'womaya_muaweiye', generalName: '穆阿维叶', portrait: '/assets/ORIE/womaya_muaweiye.png' },







        // 🔴 [2026-10-20 主人令「把剩下4位缺的敌将新建为据点武将」] 首战敌将·名将双身份（立绘留空，走回落）







        { generalId: 'gen_toghtekin', generalName: '图格特金', portrait: '', legionName: '城堡时代撒拉森军团' , eliteName: '突厥古拉姆', eliteTier: 2},





















    ],







    xibolai: [







        { generalId: 'xibolai_majiabi', generalName: '犹大马加比', portrait: '/assets/ORIE/xibolai_youdamajiabi.png' },







        { generalId: 'xibolai_dawei', generalName: '大卫', portrait: '/assets/ORIE/xibolai_dawei.png' },







        // 2026-10-20 主人令「有名字的武将也可以安置据点」：名将双身份（据点武将＋剧本敌将）







        { generalId: 'bfe3_1', generalName: '西底家', portrait: '', legionName: '古典时代近东军团' , eliteName: '犹大守军', eliteTier: 4},







        // 🔴 [2026-10-20 主人令「人物该是谁就是谁」] 哈斯蒙尼王朝的阿里斯托布鲁斯二世（前65年阿雷塔斯围耶路撒冷的守方）







        { generalId: 'gen_aristobulus_ii', generalName: '阿里斯托布鲁斯二世', portrait: '', legionName: '古典时代近东军团' , eliteName: '哈斯蒙卫军', eliteTier: 4},







    ],







    yelusalengwg: [







        { generalId: 'gen_baodewen_iv', generalName: '鲍德温四世', portrait: '/assets/FRANKS/gen_baodewen_iv.png' },







        // 2026-10-20：鲍德温一世（1058–1118，埃德萨伯爵、耶路撒冷国王）→ 耶路撒冷王国（阿卡）；FRANKS×城堡＝法兰西骑士军团







        { generalId: 'aosiruowen_baodewen', generalName: '耶路撒冷王 鲍德温', portrait: '', legionName: '城堡时代法兰西骑士军团' },







        // 🔴 [2026-10-20 首战规则] 阿马尔里克＝耶路撒冷王（1167 巴班之战十字军主帅）→ 阿卡·耶路撒冷王国；普将；封建×法兰克＝封建时代法兰克军团；立绘留空







        { generalId: 'yelusalengwg_amalric', legionName: '城堡时代法兰西骑士军团', generalName: '阿马尔里克', portrait: '' },







    ],







    shengdian_qishi: { generalId: 'shengdian_qishi_demolai', generalName: '莫莱', portrait: '/assets/FRANKS/shengdian_qishi_demolai.png' },







    maerta_qishi: { generalId: 'maerta_qishi_walaite', generalName: '瓦莱特', portrait: '/assets/LATIN/maerta_qishi_walaite.png' },







    dibisi: [







        // 🔴 [2026-10-20 主人令「按历史来，该是什么势力就是什么势力」] 塔哈尔卡＝埃及第二十五王朝法老（上埃及只是同一埃及的另一据点）→ 挂埃及







        { generalId: 'dibisi_tahaerka', generalName: '塔哈尔卡', portrait: '/assets/ORIE/dibisi_tahaerka.png', factionId: 'aiji' },







        // 🔴 [2026-10-20 主人令「相同势力，归到一个势力中」] 图特摩斯三世与拉美西斯二世同属新王国统一埃及（第十八／十九王朝）→ 挂埃及旗、不与埃及互打







        { generalId: 'dibisi_tutemosi', generalName: '图特摩斯', portrait: '/assets/ORIE/dibisi_tutemosi.png', factionId: 'aiji' },







    ],







    aiji: [







        { generalId: 'aiji_neiketaneibu', generalName: '内克塔内布', portrait: '/assets/ORIE/aiji_neiketaneibu.png' },







        { generalId: 'aiji_lameisisi', generalName: '拉美西斯', portrait: '/assets/ORIE/aiji_lameisisi.png' },







        // 🔴 [2026-10-20 首战剧情] 普萨美提克三世＝前525 佩鲁西姆之战埃及末代法老（被冈比西斯击败）→ 孟菲斯·埃及；普将；立绘留空







        { generalId: 'aiji_psamtik_iii', generalName: '普萨美提克三世', portrait: '', legionName: '古典时代近东军团' , eliteName: '希腊雇佣兵', eliteTier: 4 },   // 🔴 26 王朝法老军含希腊雇佣兵（原配「麦查伊军」是新王国前的努比亚兵）







    ],







    tuolemi: [
        { generalId: 'tuolemi_tuolemi', generalName: '托勒密一世', portrait: '/assets/ORIE/tuolemi_tuolemi.png' },
        { generalId: 'bfe3_19', generalName: '斯科帕斯', portrait: '', legionName: '古典时代近东军团' },
    ],







    jialedi: [
        { generalId: 'bfe2_yahdun_lim', generalName: '亚赫敦·林', portrait: '', factionId: 'jialedi', legionName: '古典时代近东军团' },
        { generalId: 'bfe2_nidintu_bel', generalName: '尼丁图-贝尔', portrait: '', legionName: '古典时代近东军团' },
        { generalId: 'bfe2_enlil_nadin_ahi', generalName: '恩利尔纳丁·阿基', portrait: '', legionName: '古典时代近东军团' },
        { generalId: 'jialedi_nibujianisa', generalName: '尼布甲尼撒', portrait: '/assets/ORIE/jialedi_nibujianisa.png' },
        { generalId: 'bfe2_nabonidus', generalName: '那波尼德', portrait: '', legionName: '古典时代近东军团' },
    ],







    paermila: { generalId: 'paermila_zhinuobiya', generalName: '芝诺比娅', portrait: '/assets/ORIE/paermila_zhinuobiya.png' },







    abasi: [







        { generalId: 'abasi_mansuer', generalName: '曼苏尔', portrait: '/assets/ORIE/abasi_mansuer.png' },







        // 🔴 [2026-10-20 首战规则] 穆斯塔西姆＝阿拔斯末代哈里发（1258 巴格达被旭烈兀攻陷）→ 巴格达·阿拔斯；普将；立绘留空







        { generalId: 'abasi_mustasim', legionName: '城堡时代撒拉森军团', generalName: '穆斯塔西姆', portrait: '' },







        // 🔴 [2026-10-20 首战规则] 穆瓦法克＝阿拔斯摄政、876 代尔阿库勒之战击败萨法尔军主帅 → 巴格达·阿拔斯；名将；立绘留空







        { generalId: 'abasi_muwafake', generalName: '穆瓦法克', portrait: '' },







    ],







    samaila: { generalId: 'samaila_muataisuimu', generalName: '穆阿台绥姆', portrait: '/assets/ORIE/samaila_muataisuimu.png' },







    xikesuosi: [







        { generalId: 'xikesuosi_samutike', generalName: '萨姆提克', portrait: '/assets/ORIE/xikesuosi_samutike.png' },







        { generalId: 'xikesuosi_salidi', generalName: '萨利蒂', portrait: '/assets/ORIE/xikesuosi_salidi.png' },







    ],







    yashu: [
        { generalId: 'bfe2_sin_shar_ishkun', generalName: '辛·沙尔·伊什昆', portrait: '', legionName: '古典时代近东军团' },
        { generalId: 'bfe2_shalmaneser_iii', generalName: '沙尔马那塞尔三世', portrait: '/assets/ORIE/bfe2_shalmaneser_iii.png', legionName: '古典时代近东军团' },
        { generalId: 'yashu_saergong', generalName: '萨尔贡', portrait: '/assets/ORIE/yashu_saergong.png' },
        { generalId: 'bfe2_esarhaddon', generalName: '以撒哈顿', portrait: '', legionName: '古典时代近东军团' },
    ],







    youfaladi: { generalId: 'youfaladi_yehaiya', generalName: '叶海亚·巴尔马克', portrait: '/assets/ORIE/youfaladi_yehaiya.png' },







    mamuluke: { generalId: 'mamuluke_baibaisi', generalName: '拜巴尔斯', portrait: '/assets/ORIE/mamuluke_baibaisi.png' },







    midi: [







        { generalId: 'midi_daiaokaisi', generalName: '戴奥凯斯', portrait: '/assets/PERSIAN/midi_daiaokaisi.png' },







        // 🔴 [2026-10-20] 原「科塞亚」无城战役势力已删；守将卡什提利亚什改挂米底，精锐仍用「科塞亚山兵」T4







        { generalId: 'kesaiya_kashtiliash', generalName: '卡什提利亚什', portrait: '', legionName: '古典时代阿契美尼德军团', eliteName: '科塞亚山兵', eliteTier: 4 },







    ],







    qiliqiya: { generalId: 'qiliqiya_pangpei', generalName: '庞培', portrait: '/assets/ORIE/qiliqiya_pangpei.png' },







    // 🔴 [2026-09-12 主人「什么玩意，看历史啊」] 阿契美尼德的武将改正为 **大流士三世**：







    //    ① 史实：亚历山大东征（前334–330）时期在位的大王就是大流士三世，伊苏斯/高加米拉的主帅都是他；







    //    ② 项目自己的数据早就是这么认的 —— `GeneralCenturies` 里 `'daliushi_iii': -4, // 大流士 · aqimeinide · 波斯波利斯`；







    //       原先那条 `aqimeinide_daliushi` 世纪是 **-6（＝大流士一世）**，挂到伊苏斯上就是错人 ✗。







    //    ⚠️ 立绘这一行是**恢复我此前误删的原绑定**（删 boluosi 时连带删掉的 `daliushi_iii` 档案里就是这张图），







    //       不是我新分配立绘；要换图直接改这一行。







    // 🔴 [2026-09-12 主人「据点：波斯波利斯（29.93,52.89）· 阿契美尼德 · 旗号阿契 · 精锐不死军 T2







    //    —— **武将是大流士一世**，你怎么给我搞没了」]







    //    **数组第一个 = 该势力守将 = 显示在据点上的那位** → 必须是 **大流士一世**（波斯波利斯的营建者，原配置）✓







    //    大流士三世放第二位：他**不在据点上显示**，只供**剧本调用**（伊苏斯/高加米拉主帅 =







    //    `defenderGeneralId: 'daliushi_iii'` ✓）—— 这正是主人取消「一势力一将」的用意 ✓。







    aqimeinide: [







        { generalId: 'aqimeinide_daliushi', generalName: '大流士一世', portrait: '/assets/PERSIAN/aqimeinide_daliushi.png' },







        { generalId: 'daliushi_iii', generalName: '大流士三世', portrait: '/assets/PERSIAN/daliushi_iii.png' },







        // 公元前330年波斯门战役守帅，立绘按铁律留空走回落、待主人亲自放图分配







        { generalId: 'aqimeinide_aertabazanuosi', generalName: '阿里奥巴赞斯', portrait: '/assets/PERSIAN/aqimeinide_aertabazanuosi.png' },







    ],







    sashan: [







        { generalId: 'sashan_aerdaxier', generalName: '阿尔达希尔', portrait: '/assets/SASANIAN/sashan_aerdaxier.png' },  // 菲鲁扎巴德·萨珊建立者







        // 🔴 [2026-10-20 首战规则] 卑路斯一世＝萨珊王（459–484，484 赫拉特之战被嚈哒击败身死）→ 菲鲁扎巴德·萨珊；普将；立绘留空







        { generalId: 'sashan_beilusi', generalName: '卑路斯一世', portrait: '' },







        // 🔴 [2026-10-20 首战规则] 霍斯劳二世＝萨珊末代雄主（590 借兵复国、596 平巴赫拉姆叛乱、628 被杀），菲鲁扎巴德·萨珊；







        //    名将（借兵复国、收复失地、屡破拜占庭）；军团按「封建×SASANIAN」＝封建时代霍拉桑军团；立绘留空







        { generalId: 'sashan_khosrow_ii', generalName: '霍斯劳二世', portrait: '', legionName: '封建时代霍拉桑军团' },







        // 🔴 [2026-10-20 首战剧情] 巴赫拉姆六世＝萨珊叛将、僭位之王（590 击败霍斯劳占泰西封，591 布拉拉通之战被杀）→ 菲鲁扎巴德·萨珊；名将；立绘留空







        { generalId: 'sashan_bahram_vi', generalName: '巴赫拉姆六世', portrait: '' },







    ],







    safawei_d: { generalId: 'safawei_d_abasi', generalName: '阿拔斯', portrait: '/assets/PERSIAN/safawei_d_abasi.png' },







    sumeier: [







        { generalId: 'sumeier_nabopalasa', generalName: '那波帕拉萨', portrait: '/assets/ORIE/sumeier_nabopalasa.png' },







        { generalId: 'sumeier_zhajixi', generalName: '扎吉西', portrait: '/assets/ORIE/sumeier_zhajixi.png' },







    ],







    ayoubu: [







        { generalId: 'ayoubu_salaheding', generalName: '萨拉赫丁', portrait: '/assets/ORIE/ayoubu_salaheding.png' },







        // 🔴 [2026-10-20 主人令「把剩下4位缺的敌将新建为据点武将」] 首战敌将·名将双身份（立绘留空，走回落）







        { generalId: 'gen_sayf_al_dawla', generalName: '赛弗·道莱', portrait: '', legionName: '封建时代哈里发军团' , eliteName: '哈姆丹骑', eliteTier: 2},







    ],







    // ── 2026-08-04 新增：鲍德温（埃德萨伯国首任伯爵，后为耶路撒冷国王）──







    aosiruowen: { generalId: 'gen_abgar', generalName: '阿布加尔', portrait: '/assets/ORIE/aosiruowen_abujiaer.png' },







    // 2026-07-27 补：打耳班/以弗所/安卡拉/亚述城 + 苏萨补将







    ailan: [
        { generalId: 'bfe2_mardonius', generalName: '马尔多尼乌斯', portrait: '', legionName: '古典时代阿契美尼德军团' },
        { generalId: 'bfe2_xerxes_i', generalName: '薛西斯一世', portrait: '', legionName: '古典时代阿契美尼德军团' },







        // 🔴 [2026-10-20 主人令「势力＝武将所在政权」] 居鲁士二世是阿契美尼德帝国建立者（苏萨只是他的都城据点，城归埃兰不动）







        //    → 势力挂「阿契美尼德(aqimeinide)」，不挂埃兰







        { generalId: 'ailan_julushi', generalName: '居鲁士二世', portrait: '/assets/PERSIAN/ailan_julushiershi.png', factionId: 'aqimeinide' , eliteName: '不死军', eliteTier: 2 },







        // 🔴 [2026-10-20 首战规则] 冈比西斯二世＝前524 波斯远征锡瓦时的波斯大王（大流士前522才即位）；据点苏萨、势力阿契美尼德；立绘留空







        { generalId: 'gen_cambyses', generalName: '冈比西斯二世', portrait: '', factionId: 'aqimeinide' , eliteName: '不死军', eliteTier: 2 },







        { generalId: 'ailan_shuteluke', generalName: '舒特鲁克·纳克昆特', portrait: '/assets/PERSIAN/ailan_shuteluke.png' },







        // 🔴 [2026-10-20] 原「乌克西亚」无城战役势力已删；首领马达泰斯改挂埃兰，精锐仍用「乌克西亚弓」T3







        { generalId: 'wukexiya_madates', generalName: '马达泰斯', portrait: '', legionName: '古典时代阿契美尼德军团', eliteName: '乌克西亚弓', eliteTier: 3 },







    ],







    kesa: { generalId: 'kesa_bulan', generalName: '布兰', portrait: '/assets/PERSIAN/kesa_bulan.png' },







    aiaoniya: { generalId: 'aiaoniya_alisita', generalName: '阿里斯塔', portrait: '/assets/GREECE/aiaoniya_alisita.png' },







    // 公元前334年米利都围城战守将（波斯驻米利都守军统领，中文维基百科「米利都圍城戰」作赫格西斯特拉塔斯），立绘按铁律留空、待主人亲自放图分配







    yiaoniya: { generalId: 'yiaoniya_hegesistratus', generalName: '赫格西斯特', portrait: '/assets/GREECE/yiaoniya_hegesistratus.png' },







    jialatai: { generalId: 'jialatai_deaota', generalName: '德奥塔鲁斯', portrait: '/assets/ORIE/jialatai_deaota.png' },







    guyashu: [







        { generalId: 'guyashu_tigelate', generalName: '提格拉特', portrait: '/assets/ORIE/guyashu_tigelate.png' },







        { generalId: 'guyashu_shamushi', generalName: '沙姆希阿达', portrait: '/assets/ORIE/guyashu_shamushi.png' },







    ],







    ansxi: [
        { generalId: 'bfe_meherdates', generalName: '梅哈尔达特', portrait: '', legionName: '古典时代阿契美尼德军团' },







        { generalId: 'ansxi_aershake', generalName: '阿尔沙克', portrait: '/assets/PERSIAN/ansxi_aershake.png' },







        // 名将双身份：阿尔达班四世（据点武将＋剧本敌将）







        { generalId: 'bfe3_73', generalName: '阿尔达班四世', portrait: '', legionName: '古典时代阿契美尼德军团' , eliteName: '安息铁骑', eliteTier: 3},







    ],







    nabatai: { generalId: 'nabatai_aleitasi', generalName: '阿雷塔斯', portrait: '/assets/ORIE/nabatai_aleitasi.png' },







    xike: { generalId: 'xike_lanjite', generalName: '兰季特辛格', portrait: '/assets/INDIA/xike_lanjite.png' },







    deli: [
        // 🔴 [2026-10-20 首战规则] 萨达希夫·拉奥·巴乌＝马拉塔统帅（1761 第三次帕尼帕特战死）；库无马拉塔势力，借德里（报告）；帝国时代莫卧儿军团；立绘留空
        { generalId: 'gen_sadashivrao', generalName: '萨达希夫', portrait: '', legionName: '帝国时代莫卧儿军团' },
        // 🔴 [2026-10-20 首战规则] 赫穆＝苏尔帝国将军（1556 第二次帕尼帕特战败被杀）；苏尔无独立势力，借德里（报告）；帝国时代莫卧儿军团；立绘留空
        { generalId: 'gen_hemu', generalName: '赫穆', portrait: '', legionName: '帝国时代莫卧儿军团' },



        { generalId: 'deli_alawuding', generalName: '阿拉乌丁', portrait: '/assets/MUGHAL/deli_alawuding.png' },



        // 🔴 [2026-10-20 首战规则] 易卜拉欣·洛迪＝德里苏丹（1526 第一次帕尼帕特战死）→ 德里（MUGHAL）；帝国时代莫卧儿军团；立绘留空



        { generalId: 'gen_ibrahim_lodi', generalName: '易卜拉欣·洛迪', portrait: '', legionName: '帝国时代莫卧儿军团' },



    ],







    mowoer: { generalId: 'mowoer_akeba', generalName: '阿克巴', portrait: '/assets/MUGHAL/mowoer_akeba.png' },







    jieri: [
        { generalId: 'jieri_jieriwang', generalName: '哈尔沙', portrait: '/assets/INDIA/jieri_jieriwang.png' },
    ],







    kongque: [
        { generalId: 'bfe2_dhanananda', generalName: '达那难陀', portrait: '', legionName: '古典时代贵霜军团' },







        { generalId: 'kongque_zhantuoluo', generalName: '旃陀罗笈多', portrait: '/assets/PURU/kongque_zhantuoluo.png' },







        // 🔴 [2026-10-20 首战规则] 阿罗那顺＝中天竺篡位王（648 被王玄策借兵擒获）→ 华氏城·孔雀（中天竺无独立势力，挂该城势力）；普将；封建×普鲁＝封建时代沙希军团；立绘留空







        { generalId: 'kongque_aluonashun', generalName: '阿罗那顺', portrait: '', legionName: '封建时代沙希军团' , eliteName: '中天竺象兵', eliteTier: 4 },   // 🔴 648 年中天竺的象兵（原配「孔雀战象」是前 3 世纪孔雀王朝的）







    ],







    mojietuo: { generalId: 'mojietuo_pinbisuoluo', generalName: '频毗娑罗', portrait: '/assets/PURU/mojietuo_pinbisuoluo.png' },







    // 2026-09-12 主人三条规矩：军团要有武将・武将要有所属据点势力。







    // 古典时代孟加拉（2026-10-16 名册名【古典时代高陀军团】）需要一位古典孟加拉武将 = 毗阇耶（大史记其自孟加拉僧伽补罗出海、







    // 征服楞伽建僧伽罗王朝，约公元前543年，古典）。**数组第一位＝守将，仍是达磨波罗**（绝不挤掉）。







    // 立绘留空＝走文化池回落，由主人放图。







    boluo: [







        { generalId: 'boluo_damoboluo', generalName: '达磨波罗', portrait: '/assets/BENGALIS/boluo_damoboluo.png' },







        { generalId: 'boluo_vijaya', generalName: '毗阇耶', portrait: '', legionName: '古典时代高陀军团' },







        // 🔴 [2026-10-20 主人令「遇到问题先看符合历史，下结论再动手」] 首战回补安置按史实复核：设赏迦＝高达（孟加拉）国王、戒日王死敌，根据地孟加拉，不是戒日王都曲女城 → 放高达城（boluo，风格 BENGALIS）；仍挂本政权 jieri
        { generalId: 'gen_shashanka', generalName: '设赏迦', portrait: '', factionId: 'boluo', },
    ],







    sumo: { generalId: 'sumo_sumowang', generalName: '苏摩', portrait: '/assets/BENGALIS/sumo_sumowang.png' },







    jiashi_d: { generalId: 'jiashi_jiashiwang_d', generalName: '梵摩达', portrait: '/assets/INDIA/jiashi_d_jiashiwang.png' },







    zhuluo: [
        { generalId: 'bfe3_25', generalName: '埃拉拉', portrait: '', legionName: '古典时代泰米尔军团' },







        { generalId: 'zhuluo_lajialajia', generalName: '拉贾拉贾一世', portrait: '/assets/INDIA/zhuluo_lajialajiayishi.png' },







        // 2026-10-20：朱罗帝国拉金德拉一世（1014–1044 在位，远征南洋）→ 坦贾武尔；INDIA×封建＝朱罗军团







        { generalId: 'zhuluo_lajindela', generalName: '拉金德拉一世', portrait: '', legionName: '封建时代朱罗军团' },







    ],







    pandiya: { generalId: 'pandiya_jiatawaerman', generalName: '贾塔瓦尔曼', portrait: '/assets/INDIA/pandiya_jiatawaerman.png' },







    beileinisi: { generalId: 'beileinisi_tuolemiershi', generalName: '托勒密二世', portrait: '/assets/ORIE/beileinisi_tuolemiershi.png' },







    dedan: { generalId: 'dedan_dedanwang', generalName: '卡比里尔', portrait: '/assets/ORIE/dedan_dedanwang.png' },







    maidina: [







        { generalId: 'maidina_halide', generalName: '哈立德', portrait: '/assets/ORIE/maidina_halide.png' },







        // 🔴 [2026-10-20 首战规则] 阿里＝第四任正统哈里发（656 骆驼之战胜、657 隋芬之战对穆阿维叶）→ 麦地那·拉希顿；名将；封建×ORIE＝封建时代哈里发军团；立绘留空







        { generalId: 'maidina_ali', generalName: '阿里', portrait: '' },







    ],







    gulaishi: { generalId: 'gulaishi_aibu', generalName: '艾布苏富扬', portrait: '/assets/ORIE/gulaishi_aibu.png' },







    xierwan: { generalId: 'xierwan_farukusha', generalName: '法鲁克沙', portrait: '/assets/ORIE/xierwan_farukusha.png' },







    xiemian: { generalId: 'xiemian_xiemianwang', generalName: '齐贝尔', portrait: '/assets/CENTRAL_ASIA/xiemian_xiemianwang.png' },







    yidier: { generalId: 'yidier_yidiewang', generalName: '约瑟夫', portrait: '/assets/CENTRAL_ASIA/yidier_yidiewang.png' },







    salai: [







        { generalId: 'salai_salaiwang', generalName: '埃迪古', portrait: '/assets/CENTRAL_ASIA/salai_salaiwang.png' },







        { generalId: 'gen_onas_khan', generalName: '欧拿斯', portrait: '/assets/CENTRAL_ASIA/gen_onas_khan.png', legionName: '帝国时代乌兹别克军团' },







    ],







    mangshi: { generalId: 'mangshi_mangshiwang', generalName: '恰格里', portrait: '/assets/CENTRAL_ASIA/mangshi_mangewang.png' },







    aztec: { generalId: 'gen_cuauhtemoc', generalName: '库奥特莫克', portrait: '/assets/AMERICA/aztec_kuaotemoke.png' },







    inca: [



        { generalId: 'gen_topa_inca', generalName: '图帕克', portrait: '/assets/INCA/gen_topa_inca.png' },



        // 🔴 [2026-10-20 首战规则] 阿塔瓦尔帕＝印加末帝（1532 卡哈马卡被皮萨罗俘杀）→ 库斯科（INCA）；帝国时代塔万廷军团；立绘留空



        { generalId: 'gen_atahualpa', generalName: '阿塔瓦尔帕', portrait: '', legionName: '帝国时代塔万廷军团' },



    ],







    maya: [
        { generalId: 'gen_jasawchan', generalName: '亚斯纳昌', portrait: '/assets/MAYANS/gen_jasawchan.png' },
        { generalId: 'gen_pakal', generalName: '帕卡尔', portrait: '', legionName: '封建时代尤卡坦军团', eliteName: '帕伦克矛兵', eliteTier: 4 },
    ],







    mapuche: { generalId: 'gen_lautaro', generalName: '劳塔罗', portrait: '/assets/MAPUCHE/gen_lautaro.png', legionName: '帝国时代安第斯游击军团' },







    muisca: { generalId: 'gen_saguamanchica', generalName: '萨瓜曼奇卡', portrait: '/assets/MUISCA/gen_saguamanchica.png' },







    tupi: [







        { generalId: 'gen_arariboia', generalName: '阿拉里博亚', portrait: '/assets/TUPI/gen_arariboia.png' },







        // 2026-10-20：图皮尼金酋长蒂巴里萨（16 世纪，巴西）→ 图皮（瓜纳巴拉）；TUPI×帝国＝塔莫约军团







        { generalId: 'gen_tibirica', generalName: '蒂巴里萨', portrait: '', legionName: '帝国时代塔莫约军团' },







    ],







    xibanya: [



        { generalId: 'xibanya_pisaluo', generalName: '皮萨罗', portrait: '/assets/SPANISH/xibanya_pisaluo.png' , legionName: '帝国时代西班牙征服军团' },



        // 🔴 [2026-10-20 首战规则] 瓦尔迪维亚＝智利征服者（1553 图卡佩尔被劳塔罗击杀）→ 利马（SPANISH）；帝国时代西班牙方阵军团；立绘留空



        { generalId: 'gen_valdivia', generalName: '瓦尔迪维亚', portrait: '', legionName: '帝国时代西班牙方阵军团' },



        // 🔴 [2026-10-20 首战规则] 梅迪纳科利公爵＝西班牙统帅（1560 杰尔巴岛海战败于奥斯曼）→ 利马（SPANISH）；帝国时代西班牙方阵军团；立绘留空



        { generalId: 'gen_medinaceli', generalName: '梅迪纳科利', portrait: '', legionName: '帝国时代西班牙方阵军团' },



    ],  // 利马·征服印加的西班牙征服者







    manding: { generalId: 'gen_sundjata', generalName: '松迪亚塔', portrait: '/assets/AFRICA/manding_songdiyata.png' },







    ethiopia: { generalId: 'gen_ezana', generalName: '埃扎纳', portrait: '/assets/ETHIOPIANS/gen_ezana.png' },







    zhagewei: { generalId: 'zhagewei_gebulei', generalName: '拉利贝拉', portrait: '/assets/ETHIOPIANS/zhagewei_gebulei.png' },







    adal: { generalId: 'adal_ghazi', generalName: '格拉尼', portrait: '/assets/AFRICA/adal_gelani.png' },







    malacca: { generalId: 'gen_parameswara', generalName: '拜里米苏拉', portrait: '/assets/MALAY/gen_parameswara.png' },







    sanfoqi: [







        { generalId: 'sanfoqi_dapunta', generalName: '达本陀', portrait: '/assets/MALAY/sanfoqi_dapunta.png' },







        // 🔴 [2026-10-20 主人令「把剩下4位缺的敌将新建为据点武将」] 首战敌将·名将双身份（立绘留空，走回落）







        { generalId: 'gen_sangrama_vijayottungavarman', generalName: '桑格拉玛', portrait: '', legionName: '封建时代三佛齐军团' , eliteName: '三佛齐水军', eliteTier: 3},







    ],







    medang: { generalId: 'gen_panangkaran', generalName: '帕南卡兰', portrait: '/assets/MALAY/gen_panangkaran.png' },







    ternate: { generalId: 'ternate_babula', generalName: '巴布拉', portrait: '/assets/MALAY/ternate_babula.png' },







    sulu: [







        { generalId: 'sulu_paduka', generalName: '巴杜卡', portrait: '/assets/MALAY/sulu_paduka.png' },







    ],







    // 🔴 [2026-10-20 主人令「先确定马尼拉什么建筑风格，再确定据点放什么相同风格的武将」] 马尼拉改判 MALAY ⇒ 挂马来文化的拉者苏莱曼三世（事发地＝马尼拉），仍挂本政权 maynila







    maynila: { generalId: 'bfe_rajah_sulayman', legionName: '帝国时代马六甲军团', generalName: '拉者苏莱曼三世', portrait: '' , eliteName: '马尼拉战团', eliteTier: 4},







    gurjara: [







        { generalId: 'gen_mihirabhoja', generalName: '迷企罗波阇', portrait: '/assets/GURJARAS/gen_mihirabhoja.png' },







        // 🔴 [2026-10-20 首战规则] 瓦萨拉贾＝瞿折罗-普腊蒂哈腊王（790 争曲女城，曾破波罗军）→ 帕坦·瞿折罗；名将；立绘留空







        { generalId: 'gurjara_vatsaraja', generalName: '瓦萨拉贾', portrait: '' },







        // 🔴 [2026-10-20 首战规则] 那加巴塔二世＝瞿折罗王（820 大破波罗军）→ 帕坦·瞿折罗；名将；立绘留空







        { generalId: 'gurjara_nagabhata_ii', generalName: '那加巴塔二世', portrait: '' },







        // 🔴 [2026-10-20 主人令「遇到问题先看符合历史，下结论再动手」] 首战回补安置按史实复核：毗摩一世＝索兰基（Chaulukya）王，都阿尼尔瓦达＝今帕坦；索姆纳特只是 1026 年被劫之地 → 放帕坦（gurjara，风格 GURJARAS）；仍挂本政权 suomunate
        { generalId: 'suomunate_bhima_i', factionId: 'suomunate', generalName: '毗摩一世', portrait: '', },
    ],







    suomunate: [







        { generalId: 'suomunate_kumalapala', generalName: '库马拉帕拉', portrait: '/assets/GURJARAS/suomunate_kumalapala.png' },














    ],







    sengjialuo: [







        { generalId: 'sengjialuo_dutugamo', generalName: '杜图伽摩尼', portrait: '/assets/PURU/sengjialuo_dutugamo.png' },







        // 🔴 [2026-10-20 首战规则] 摩哂陀五世＝僧伽罗王（993 朱罗攻陷阿努拉德普拉，被俘）→ 阿努拉德·僧伽罗；普将；封建×普鲁＝封建时代沙希军团；立绘留空







        { generalId: 'sengjialuo_mahinda_v', generalName: '摩哂陀五世', portrait: '', legionName: '封建时代沙希军团' },







    ],







    puxiangyindu: { generalId: 'puxiangyindu_albukeerke', generalName: '阿尔布克尔克', portrait: '/assets/PORTUGUESE/puxiangyindu_albukeerke.png', legionName: '帝国时代葡萄牙风琴军团' },







    // 🔴 [2026-10-18 主人令] 建筑风格定武将：韦拉克鲁斯 SPANISH→西班牙将、哈瓦那 SPANISH→西班牙将、圣维森特 PORTUGUESE→葡萄牙将；新武将 portrait 留空，走文化池回落。







    tupinijin: { generalId: 'gen_martim_afonso', generalName: '马丁·阿方索', portrait: '/assets/PORTUGUESE/tupinijin_madingafangsuo.png', factionId: 'putaoya', legionName: '帝国时代葡萄牙风琴军团' },







    tuotuonake: { generalId: 'gen_cortes', generalName: '科尔特斯', portrait: '/assets/SPANISH/tuotuonake_keertesi.png' , legionName: '帝国时代西班牙征服军团' },







    taino: [







        { generalId: 'gen_velazquez', generalName: '贝拉斯克斯', portrait: '/assets/SPANISH/taino_beilasikesi.png' , legionName: '帝国时代西班牙征服军团' },







    ],







    taino_d: [







        // 🔴 [2026-10-20 主人令「武将文化一定要符合建筑风格」] 哈土依＝泰诺人反抗领袖（1478–1512，古巴）→ 亚拉（TUPI 原住民风格）；文化 TUPI×帝国＝帝国时代塔莫约军团；立绘留空







        { generalId: 'gen_hatuey', generalName: '哈土依', portrait: '', legionName: '帝国时代塔莫约军团' },







    ],







    guanche: { generalId: 'gen_bentejui', generalName: '本特胡伊', portrait: '/assets/AFRICA/gen_bentejui.png' },







    // 🔴 [2026-10-13 主人令「添加一个据点，关岛」] 阿加尼亚·查莫罗：1671 年反抗西班牙的查莫罗领袖（英文维基 Hurao 条目）







    chamorro: { generalId: 'gen_hurao', generalName: '胡劳', portrait: '/assets/MALAY/gen_hurao.png' },







    fodejiao: { generalId: 'gen_noli', generalName: '诺利', portrait: '/assets/PORTUGUESE/gen_noli.png' },







    baiyiya: { generalId: 'gen_tome_sousa', generalName: '托梅', portrait: '/assets/PORTUGUESE/gen_tome_sousa.png' },







    yasuer: { generalId: 'gen_cipriano_figueiredo', generalName: '西普里亚诺', portrait: '/assets/PORTUGUESE/gen_cipriano_figueiredo.png' , legionName: '帝国时代葡萄牙风琴军团' },







    liaozu: { generalId: 'liaozu_saitatila', generalName: '赛塔提腊', portrait: '/assets/KHMER/liaozu_saitatila.png' },







    kushi: { generalId: 'kushi_amanilunnasi', generalName: '阿玛尼伦纳斯', portrait: '/assets/AFRICA/kushi_amanilunnasi.png' },







    aimala: { generalId: 'aimala_katali', generalName: '卡塔里', portrait: '/assets/INCA/aimala_katali.png' },







    aolisha: { generalId: 'aolisha_anatabamo', generalName: '阿纳塔跋摩', portrait: '/assets/INDIA/aolisha_anatabamo.png' },







    kanata: { generalId: 'kanata_lamalaya', generalName: '拉玛拉亚', portrait: '/assets/INDIA/kanata_lamalaya.png' },







    adile: [
        { generalId: 'adile_adilesha', generalName: '阿迪勒沙', portrait: '/assets/INDIA/adile_adilesha.png' },
        { generalId: 'bfe_rasul_khan', generalName: '果阿守将 拉苏尔汗', portrait: '', legionName: '帝国时代科罗曼德尔军团' },
    ],







    foluolida: { generalId: 'foluolida_meinendeshi', generalName: '梅嫩德斯', portrait: '/assets/SPANISH/foluolida_meinendeshi.png' , legionName: '帝国时代西班牙征服军团' },







    fujisi: { generalId: 'fujisi_fujiweng', generalName: '福基翁', portrait: '/assets/GREECE/fujisi_fujiweng.png' },







    yilisi: [







        { generalId: 'yilisi_yifeituosi', generalName: '伊菲托斯', portrait: '/assets/GREECE/yilisi_yifeituosi.png' },







        // 🔴 [2026-10-20 主人令「这些据点违规了……请删除。据点中有武将的话，请放到相同风格的临近据点」] 原据点 city_pisatis 已删 → 迁奥林匹亚（同建筑风格最近），仍挂本政权 pisa







        { generalId: 'bfe_pisa_king', generalName: '皮萨王 潘塔琉斯', portrait: '' , legionName: '古典时代爱奥尼亚军团', eliteName: '皮萨骑兵', eliteTier: 4},







    ],







    nuowei: { generalId: 'nuowei_halaer', generalName: '哈拉尔', portrait: '/assets/VIKINGS/nuowei_halaer.png' },







    keernuwaye: { generalId: 'keernuwaye_geladelong', generalName: '格拉德隆', portrait: '/assets/BRITONS/keernuwaye_geladelong.png' },







    aodesuosi: { generalId: 'aodesuosi_aodesuosi', generalName: '奥德索斯首领', portrait: '/assets/THRACIAN/aodesuosi_aodesuosi.png' },







    disidelusi: { generalId: 'disidelusi_disidelusi', generalName: '蒂斯德鲁斯督造', portrait: '/assets/ROMA/disidelusi_disidelusi.png' },







    yisatisi: [







        { generalId: 'yisatisi_falukezhade', generalName: '法鲁克扎德', portrait: '/assets/PERSIAN/yisatisi_falukezhade.png' },







        // 2026-10-20：古波斯行省总督伊萨提斯（前 6 世纪）→ 亚兹德；PERSIAN×古典＝阿契美尼德军团







        { generalId: 'yisatisi_yisatisi', generalName: '伊萨提斯', portrait: '', legionName: '古典时代阿契美尼德军团' , eliteName: '亚兹德骑', eliteTier: 4},







    ],







    wuer: [







        { generalId: 'wuer_boshasha', generalName: '伯沙撒', portrait: '/assets/ORIE/wuer_boshasha.png' },







        { generalId: 'wuer_wuernamu', generalName: '乌尔纳姆', portrait: '/assets/ORIE/wuer_wuernamu.png' },







    ],







    pidisha: { generalId: 'pidisha_pidisha', generalName: '毗底沙邑长', portrait: '/assets/PURU/pidisha_pidisha.png' },







    jiaye: { generalId: 'jiaye_punafamo', generalName: '普那伐摩', portrait: '/assets/PURU/jiaye_punafamo.png' },







    jienei: { generalId: 'jienei_jienei', generalName: '杰内领主', portrait: '/assets/AFRICA/jienei_jienei.png' },







    kuertaiya: { generalId: 'gen_basarab_i', generalName: '巴萨拉布', portrait: '/assets/SLAVIC/gen_basarab_i.png' },







    muwaxide: { generalId: 'muwaxide_yakubu', generalName: '雅库布·曼苏尔', portrait: '/assets/BERBER/muwaxide_yakubu.png' },







    varendra: { generalId: 'varendra_devapala', generalName: '提婆波罗', portrait: '/assets/BENGALIS/varendra_devapala.png' },







    chatigangren: { generalId: 'chatigangren_wumeide', generalName: '乌梅德汗', portrait: '/assets/BENGALIS/chatigangren_wumeide.png' },







    duonaobaojia: [







        { generalId: 'duonaobaojia_tzimiskes', generalName: '齐米斯基', portrait: '/assets/BULGARIANS/duonaobaojia_tzimiskes.png' },







        // 🔴 [2026-10-20 首战规则] 萨穆伊尔＝保加利亚第一王国沙皇（1014 克雷迪昂战役惨败）→ 普雷斯拉夫·多瑙保加；名将；立绘留空







        { generalId: 'duonaobaojia_samuel', generalName: '萨穆伊尔', portrait: '' },







    ],







    lumiliya: { generalId: 'lumiliya_lalashahin', generalName: '拉拉沙欣', portrait: '/assets/TURKS/lumiliya_lalashahin.png' },







    yilaka: { generalId: 'yilaka_tundama', generalName: '通达马', portrait: '/assets/MUISCA/yilaka_tundama.png' },







    xingelana: { generalId: 'xingelana_dawila', generalName: '达维拉', portrait: '/assets/SPANISH/xingelana_dawila.png' , legionName: '帝国时代西班牙征服军团' },







    xiyindu: { generalId: 'xiyindu_batuoluome', generalName: '巴托洛梅', portrait: '/assets/SPANISH/xiyindu_batuoluome.png' },







    jialebi: { generalId: 'jialebi_brasilesuo', generalName: '布拉斯莱索', portrait: '/assets/SPANISH/jialebi_brasilesuo.png' },







    gualani: { generalId: 'gualani_nicolas', generalName: '尼古拉斯', portrait: '/assets/TUPI/gualani_nicolas.png' },







    xiadunhe: { generalId: 'xiadunhe_sviatoslav', generalName: '斯维亚托斯拉夫', portrait: '/assets/SLAVIC/xiadunhe_siweiyatuosilafu.png' },







    bulu: { generalId: 'gen_bolusi', generalName: '波鲁斯', portrait: '/assets/PURU/gen_bolusi.png' },







    xiaofulijiya: { generalId: 'xiaofulijiya_aerxitis', generalName: '阿尔西提斯', portrait: '/assets/PERSIAN/xiaofulijiya_aerxitis.png' },







    // 🔴 推罗·阿泽米尔库斯（Azemilcus，推罗末代国王，公元前332年守岛城）。显示名限 ≤5 字 → 「阿泽米尔」。







    //    portrait 留空 = 走文化池回落（见本文件既有约定），**立绘由主人放图后填，AI 不指定**。







    kanan: { generalId: 'kanan_azemier', generalName: '阿泽米尔', portrait: '/assets/ORIE/kanan_azemier.png' },







    // 🔴 加沙·巴提斯（Batis，史载波斯任命的加沙守将，围城中力竭被俘遭处决）。portrait 留空＝走文化池回落，立绘由主人放图







    feilisidin: [
        { generalId: 'feilisidin_batisi', generalName: '巴提斯', portrait: '/assets/ORIE/feilisidin_batisi.png' },
        { generalId: 'bfe_achish', generalName: '迦特王 亚吉', portrait: '', legionName: '古典时代近东军团' },
    ],







    mallabhum: { generalId: 'gen_bir_hambir', generalName: '比尔汉比尔', portrait: '/assets/BENGALIS/gen_bir_hambir.png' },







    vidin_tsardom: { generalId: 'gen_ivan_sratsimir', generalName: '伊凡斯拉齐', portrait: '/assets/BULGARIANS/gen_ivan_sratsimir.png' },







    gondarine: { generalId: 'gen_fasilides', generalName: '法西里德', portrait: '/assets/ETHIOPIANS/gen_fasilides.png' },







    valois_angouleme: { generalId: 'gen_francis_i', generalName: '弗朗索瓦', portrait: '/assets/FRANKS/gen_francis_i.png' },







    samtskhe: { generalId: 'gen_sargis_jaqeli', generalName: '萨尔吉斯', portrait: '/assets/GEORGIANS/gen_sargis_jaqeli.png' },







    tomara_gwalior: { generalId: 'gen_man_singh_tomar', generalName: '曼辛格', portrait: '/assets/MUGHAL/gen_man_singh_tomar.png' },







    tawantinsuyu: { generalId: 'gen_pachacuti', generalName: '帕查库提', portrait: '/assets/INCA/gen_pachacuti.png' },







    qutb_shahi: { generalId: 'gen_ibrahim_qutb', generalName: '易卜拉欣', portrait: '/assets/INDIA/gen_ibrahim_qutb.png' },







    minangkabau: { generalId: 'gen_adityawarman', generalName: '阿迪蒂亚', portrait: '/assets/MALAY/gen_adityawarman.png' },







    tutul_xiu: { generalId: 'gen_chan_chak', generalName: '查克王', portrait: '/assets/MAYANS/gen_chan_chak.png' },







    kerman_bam: { generalId: 'gen_yaqub_saffar', generalName: '雅各布', portrait: '/assets/PERSIAN/kerman_bam_yagebu.png' },







    lesser_poland: { generalId: 'gen_casimir_great', generalName: '卡齐米日', portrait: '/assets/POLES/gen_casimir_great.png' },







    braganza_house: { generalId: 'gen_joao_i', generalName: '若昂一世', portrait: '/assets/PORTUGUESE/gen_joao_i.png' },







    trastamara: { generalId: 'gen_ferdinand_ii', generalName: '斐迪南二世', portrait: '/assets/SPANISH/trastamara_feidinanershi.png' },







    odrysian_late: { generalId: 'gen_seuthes_iii', generalName: '塞乌特斯', portrait: '/assets/THRACIAN/gen_seuthes_iii.png' },







    // ⚠️ [2026-09-11] 卡洛扬**立绘待主人提供**：立绘归主人专属，AI 依铁律不得新增/分配/代配，







    //    故此处 portrait 留空串（`resolveGeneralPortraitPath('')` 有兜底，不会崩）。请主人补图后回填路径。







    jialiboli: { generalId: 'jialiboli_kaluoyang', generalName: '卡洛扬', portrait: '/assets/BYZANTINE/jialiboli_kaluoyang.png' },







    naxos_ancient: { generalId: 'gen_chabrias', generalName: '卡布里亚斯', portrait: '/assets/GREECE/gen_chabrias.png' },







    sijitai: [







        { generalId: 'sijitai_ateas', generalName: '阿泰阿斯', portrait: '/assets/GREECE/sijitai_ateas.png' },







        // 公元前329年锡尔河战役斯基泰骑兵领袖，立绘按铁律留空走回落、待主人亲自放图分配







        { generalId: 'sijitai_satraces', generalName: '萨特拉克斯', portrait: '/assets/GREECE/sijitai_satraces.png' },







    ],







    yamaxun: [







        { generalId: 'yamaxun_faernake', generalName: '法尔纳克', portrait: '/assets/ORIE/yamaxun_faernake.png' },







        { generalId: 'yamaxun_xibolvte', generalName: '希波吕忒', portrait: '/assets/ORIE/yamaxun_xibolvte.png' },







    ],







    // 🔴 [2026-10-20 主人令「按历史来，该是什么势力就是什么势力」] 博尼法提乌斯＝西罗马阿非利加守将；







    //    西罗马是罗马帝国西半（395 分治），同属罗马 → 挂罗马帝国（与埃提乌斯、霍诺留同国）







    xiluoma: { generalId: 'gen_bonifatius', generalName: '博尼法提乌斯', portrait: '/assets/ROMA/wangdaer_bonifatiwusi.png', factionId: 'luoma_diguo' },







    // 公元前327年马萨加战役守帅（阿萨卡诺伊/阿斯瓦卡女王克莱奥菲斯），立绘按铁律留空走回落、待主人亲自放图分配







    aswaka: { generalId: 'aswaka_cleophis', generalName: '克莱奥菲斯', portrait: '/assets/PURU/aswaka_cleophis.png' },







    // 公元前326年奥诺斯岩围城战守帅（史料未载守将姓名 → 按「地名＋首领」记，与马利首领、科塞亚首领同一记法）；







    //    立绘按铁律留空走保底图，等主人亲自放图







    aornos: { generalId: 'aornos_aphrikes', generalName: '阿夫里凯斯', portrait: '/assets/PURU/aornos_aphrikes.png' },







    // 公元前329年居鲁士城围攻守帅（史料未载守将姓名 → 按「地名＋首领」记，与马利首领、奥诺斯首领同一记法）；







    //    立绘按铁律留空走保底图，等主人亲自放图







    julushi: { generalId: 'julushi_catanes', generalName: '卡塔涅斯', portrait: '/assets/CENTRAL_ASIA/julushi_kataniesi.png' },







    // 公元前325年马里斯战役守帅（马利/摩罗婆同盟首领），立绘按铁律留空走回落、待主人亲自放图分配







    malli: { generalId: 'malli_malavapala', generalName: '摩罗波罗', portrait: '/assets/PURU/malli_malavapala.png' },







    // 🔴 [2026-10-20 主人令「每个武将都要给安置据点」] 原「科塞亚」「乌克西亚」两个无城战役势力已删：







    //    卡什提利亚什 → 米底（哈马丹）、马达泰斯 → 埃兰（苏萨），条目在各自城势力下（带 eliteName 保住原精锐番号）。







    // 🔴 [2026-09-25 主人批准新建佩利昂] 公元前335年佩利昂围城战守帅（伊利里亚王克莱图斯，巴尔迪利斯之子；







    //    英文维基 Siege of Pelium 信息框 commander2 = Kleitos, Glaukias），立绘按铁律留空走回落、待主人亲自放图分配







    dasaleiti: { generalId: 'dasaleiti_kleitos', generalName: '克莱图斯', portrait: '/assets/THRACIAN/dasaleiti_kleitos.png' },







    hesitiya: { generalId: 'hesitiya_yiasong', generalName: '伊阿宋', portrait: '/assets/GREECE/hesitiya_yiasong.png' },







    hekaniya: { generalId: 'hekaniya_artabazos', generalName: '阿尔塔巴佐斯', portrait: '/assets/PERSIAN/hekaniya_aertabazuosi.png' },







    kapaduoxiya: { generalId: 'kapaduoxiya_sabiktas', generalName: '萨比克塔斯', portrait: '/assets/ORIE/kapaduoxiya_sabiktas.png' },







    maermajika: { generalId: 'maermajika_paraetos', generalName: '帕拉伊托斯', portrait: '/assets/ORIE/maermajika_paraetos.png' },   // 马特鲁港守将（史无实考驻守者，按据点相关性选配；立绘留空走回落）







    ameng: { generalId: 'ameng_jisi', generalName: '阿曼阿托', portrait: '/assets/ORIE/ameng_jisi.png' },   // 锡瓦绿洲（阿蒙神庙大祭司）







    eerbulushi: { generalId: 'eerbulushi_beisusi', generalName: '贝苏斯', portrait: '/assets/PERSIAN/eerbulushi_beisusi.png' },   // 里海门守将（立绘留空走回落）







    aliya: [







        { generalId: 'aliya_satibazanishi', generalName: '萨提巴扎尼斯', portrait: '/assets/PERSIAN/aliya_satibazanishi.png' },   // 赫拉特守将（立绘留空）







        // 🔴 [2026-10-20 首战规则] 穆罕默德·本·塔希尔＝塔希尔王朝末王（867 希拉特被萨法尔击败）→ 赫拉特·阿利亚（塔希尔无独立势力，挂该城势力，报告）；普将；封建×波斯＝封建时代德莱木军团；立绘留空







        { generalId: 'aliya_muhammad_tahir', generalName: '穆罕默德·本·塔希尔', portrait: '', legionName: '封建时代德莱木军团' },







    ],







    xuliya: { generalId: 'xuliya_shoujiang', generalName: '马泽乌斯', portrait: '/assets/ORIE/xuliya_shoujiang.png' },   // 塔普萨库斯（阿契美尼德王朝幼发拉底河重镇及两河流域总督）







    emesene: { generalId: 'emesene_xierkuhe', generalName: '希尔库赫', portrait: '/assets/ORIE/emesene_xierkuhe.png' },   // 🔴 [2026-10-04 建埃梅萨] 希尔库赫 Asad ad-Din Shirkuh（萨拉丁之叔、霍姆斯长官、三征埃及）。⚠️ 立绘文件尚未存在，待主人补























    sute: { generalId: 'sute_spitamenes', generalName: '斯皮塔米尼斯', portrait: '/assets/CENTRAL_ASIA/sute_sipitaminisi.png' },   // 诺塔卡守将（史料：在诺塔卡把贝苏斯交给托勒密，阿里安 IV.1）







    xinde: { generalId: 'xinde_patalawang', generalName: '涅阿库斯', portrait: '/assets/INDIA/xinde_nieakusi.png' },   // 帕塔拉（自帕塔拉起航开辟波斯湾航道之名将）







    jiduoluoxiya: { generalId: 'jiduoluoxiya_xibiertiwusi', generalName: '西比尔提乌斯', portrait: '/assets/PERSIAN/jiduoluoxiya_xibiertiwusi.png' },   // 普拉（亚历山大任命的吉德罗西亚总督，阿里安 VI.27）







    aolitai: { generalId: 'aolitai_shouling', generalName: '拉托尼斯', portrait: '/assets/INDIA/aolitai_latuonisi.png' },   // 兰巴基亚（奥里泰人首领）







    shiyuzu: { generalId: 'shiyuzu_aolaqiuzhang', generalName: '阿波罗多洛斯', portrait: '/assets/INDIA/shiyuzu_aboluoduoluosi.png' },  // 奥拉（格德罗西亚边缘防区希腊裔长官）







    kamanniyaxingsheng: { generalId: 'kamanniya_zongdu', generalName: '阿斯普兰斯', portrait: '/assets/PERSIAN/kamanniyaxingsheng_asipulansi.png' },   // 卡曼尼亚（卡曼尼亚行省波斯总督）







    keerman: { generalId: 'keerman_xierzhan_shoujiang', generalName: '霍斯劳', portrait: '/assets/PERSIAN/keerman_huosilao.png' },   // 锡尔詹（萨珊波斯克尔曼/锡尔詹守将）







    zhageluosi: { generalId: 'zhageluosi_guanjiang', generalName: '巴赫拉姆', portrait: '/assets/SASANIAN/zhageluosi_guanjiang.png' },   // 呼勒万（经守扎格罗斯要冲呼勒万关隘之将）







    lulisitan: { generalId: 'lulisitan_shoujiang', generalName: '舒特鲁克', portrait: '/assets/SASANIAN/lulisitan_shoujiang.png' },   // 伊拉姆（统治伊拉姆与苏萨地区的埃兰君主）







    golpayegan_diqu: { generalId: 'golpayegan_yicheng', generalName: '尼扎姆', portrait: '/assets/SASANIAN/golpayegan_yicheng.png' },   // 古尔帕耶甘（经略波斯腹地交通与要道的统帅）







    meisuobudamiya: { generalId: 'meisuobudamiya_shoujiang', generalName: '萨宾', portrait: '/assets/ORIE/meisuobudamiya_shoujiang.png' },   // 尼西比斯（东部边境名将，曾镇守尼西比斯）







    panfeiliya: { generalId: 'panfeiliya_apollonios', generalName: '阿波罗尼奥斯', portrait: '/assets/GREECE/panfeiliya_apollonios.png' },







    baihaliye: { generalId: 'baihaliye_djedkhonsu', generalName: '杰德孔苏', portrait: '/assets/ORIE/baihaliye_djedkhonsu.png' },







    kuida: { generalId: 'kuida_chakar', generalName: '恰卡尔', portrait: '/assets/PERSIAN/kuida_chakar.png' },







    zhalange: { generalId: 'zhalange_barsaentes', generalName: '巴尔塞恩特斯', portrait: '/assets/PERSIAN/zhalange_baersaientesi.png' },







    maikelan: { generalId: 'maikelan_punong', generalName: '普农', portrait: '/assets/PERSIAN/maikelan_punong.png' },   // 特尔巴特（霍特氏族传奇首领，普纳古堡镇守者）







    // 🔴 [2026-09-19 主人令「都给我删了」] `kapaduoxiya`（卡帕多细亚）与其主帅欧迈尼斯的记录已删除 ——







    //    该势力是前321「赫勒斯滂战役」的产物，而那一仗已被主人令全删，势力成了没有任何战役在用的孤儿。,







    muertan: { generalId: 'muertan_naxierding', generalName: '纳西尔丁', portrait: '/assets/PURU/muertan_naxierding.png' },







    muxikani: { generalId: 'muxikani_muxikanuosi', generalName: '穆西卡诺斯', portrait: '/assets/PURU/muxikani_muxikanuosi.png' },







    xindu: { generalId: 'xindu_bahelamuhan', generalName: '巴赫拉姆汗', portrait: '/assets/PURU/xindu_bahelamuhan.png' },







    // ── 🔴 [2026-10-20 主人令「看武将，以武将来定义势力」] 起义占位首战改挂真实政权：敌将落为本势力据点武将（立绘留空） ──







    dalriada: { generalId: 'bfe_dalriada_king', generalName: '达尔里阿达王 费尔古斯·麦克·埃赫达赫', portrait: '' , legionName: '封建时代高王近卫军团', eliteName: '盖尔战团', eliteTier: 4},







    scotland: { generalId: 'gen_john_comyn', generalName: '约翰·科明', portrait: '' , legionName: '城堡时代盖尔军团', eliteName: '苏格兰枪兵', eliteTier: 4},







    chanka: { generalId: 'bfe_chanca_chief', generalName: '昌卡部族盟主 阿斯塔瓦兰卡', portrait: '' , legionName: '城堡时代印加军团', eliteName: '昌卡战团', eliteTier: 4},







    ouchi: { generalId: 'bfe_sue_harutaka', generalName: '陶晴贤', portrait: '' , legionName: '帝国时代武家军团', eliteName: '大内水军', eliteTier: 3},







    cueva: { generalId: 'bfe_darien_chief', generalName: '达连酋长 库纳', portrait: '' , legionName: '帝国时代格查武士军团', eliteName: '库埃瓦战团', eliteTier: 4},







    gujarat: { generalId: 'bfe_muzaffar_shah', generalName: '穆扎法尔·沙阿三世', portrait: '' , legionName: '帝国时代古吉拉特军团', eliteName: '古吉拉特骑', eliteTier: 3},







    arakan: { generalId: 'bfe_arakan_general', generalName: '阿拉干守将 阿萨杜拉', portrait: '' , legionName: '帝国时代缅甸军团', eliteName: '阿拉干战象', eliteTier: 3},







    voc: { generalId: 'bfe_coyett', generalName: '揆一', portrait: '' , legionName: '帝国时代马六甲军团', eliteName: '荷兰守备', eliteTier: 4},







    kosala: { generalId: 'bfe_prasenajit', generalName: '拘萨罗王 波斯匿', portrait: '' , legionName: '古典时代泰米尔军团', eliteName: '拘萨罗象兵', eliteTier: 3},







    kalinga: { generalId: 'bfe_kalinga_king', generalName: '羯陵伽王 婆摩', portrait: '' , legionName: '古典时代泰米尔军团', eliteName: '羯陵伽象兵', eliteTier: 3},







    anga: { generalId: 'bfe_anga_king', generalName: '鸯伽王 达摩婆罗', portrait: '' , legionName: '古典时代贵霜军团', eliteName: '鸯伽弓手', eliteTier: 4},







    shunga: [
        { generalId: 'bfe_pushyamitra', generalName: '巽伽王 普沙密多罗', portrait: '' , legionName: '古典时代泰米尔军团', eliteName: '巽伽卫军', eliteTier: 3},
        { generalId: 'bfe3_27', generalName: '婆苏密多罗', portrait: '', legionName: '古典时代泰米尔军团' },
    ],







    antigonid: { generalId: 'bfe_antigonus', generalName: '安提柯一世', portrait: '' , legionName: '古典时代马其顿军团', eliteName: '伙伴骑兵', eliteTier: 1},







    // 🔴 [2026-10-20 主人批准] 驻地型新增：保定（张柔）/嘉峪关（冯胜）/常德（钟相）/延恩（苏建）/格拉尼库斯（阿萨米斯）/沙陀（朱邪赤心）
    shatuo: [
        { generalId: 'zhuxie_zhuxiechixin', generalName: '朱邪赤心', portrait: '/assets/XIANBEI/zhuxie_zhuxiechixin.png', legionName: '封建时代契丹军团' },
    ],
    qingyuan_bd: [
        { generalId: 'gen_zhang_rou', generalName: '张柔', portrait: '', legionName: '城堡时代燕云军团' },
    ],
    suzhou: [
        { generalId: 'gen_feng_sheng', generalName: '冯胜', portrait: '', legionName: '帝国时代陕甘军团' },
    ],
    zhongxiang: [
        { generalId: 'zhongxiang_zhongxiang', generalName: '钟相', portrait: '', legionName: '起义军' },
    ],
    shuofang: [
        { generalId: 'shuofang_sujian', generalName: '苏建', portrait: '', factionId: 'han_d', legionName: '古典时代鲜卑军团' },
    ],
    mixiya: [
        { generalId: 'mixiya_arsames', generalName: '阿萨米斯', portrait: '', legionName: '古典时代爱奥尼亚军团' },
    ],
};















/** 🔴 [2026-09-12 主人「**一势力一将，这个规则取消**」]







 *  势力可以挂**多个将**：本表现在允许值是「单个将」或「将的数组」两种写法（老数据一字不用改）。







 *  · 取「该势力的守将」= 优先取当前在场（登场～退场）的将，无在场或乱斗则取数组**第一个**（`getFactionGeneral`）；







 *  · 取全部 = `getFactionGenerals`；







 *  · `generalId → 档案` 的反查（F2 立绘 / 名牌）照样一份索引里全找得到。







 */







export type FactionGeneralEntry = FactionGeneral | readonly FactionGeneral[];















/** 把某势力的条目归一成数组（单值也变成长度 1 的数组） */







export function getFactionGenerals(factionId: string): FactionGeneral[] {







    const entry = (FACTION_GENERALS as Record<string, FactionGeneralEntry | undefined>)[factionId];







    if (!entry) return [];







    return Array.isArray(entry) ? [...entry] : [entry as FactionGeneral];







}















/**







 * 取某势力的全部武将（已解析阶段姓名与立绘路径，且名将排在普将之前，保持各自内部先后次序）。







 * 🔴 [2026-10-19 主人定：「一个据点，一个势力，可以多个武将，一个武将一支精锐」]







 */







export function getFactionGeneralsResolved(factionId: string): FactionGeneral[] {







    let list = getFactionGenerals(factionId);







    // 🔴 [2026-10-20 主人令「乱斗模式的话，一个据点一个武将一个势力，多武将不并存」]







    //    乱斗：只留一位 —— 优先本势力的武将（不带别家 factionId），名将优先（见下方排序）；







    //    据点只有带别家势力的武将（如长子只有白起）→ 照样用他，乱斗里军团势力不随武将变，仍是据点势力。







    const melee = getGameMode() === 'melee';







    if (!list.length) return [];







    if (melee) {







        const native = list.filter((g) => !g.factionId || g.factionId === factionId);







        if (native.length) list = native;







    }







    const resolved = list.map((g, idx) => {







        const portrait = _generalPortraitOverrides[g.generalId] ?? g.portrait;







        const isFamous = getGeneralProfile(g.generalId)?.tier === 'famous';







        return {







            item: {







                ...g,







                generalName: stageGeneralName(g.generalId, g.generalName),







                portrait: resolveGeneralPortraitPath(portrait, { factionId, generalId: g.generalId }),







            },







            isFamous,







            idx,







        };







    });







    resolved.sort((a, b) => {







        if (a.isFamous !== b.isFamous) return a.isFamous ? -1 : 1;







        return a.idx - b.idx;







    });







    const out = resolved.map((r) => r.item);







    return melee ? out.slice(0, 1) : out;







}















/** 取某势力的开局名将（多个将时优先取当前在场且未被 excludeGeneralIds 占用的名将，否则取在场首将或数组第一个）；未配置返回 null */







export function getFactionGeneral(







    factionId: string,







    excludeGeneralIds?: ReadonlySet<string>,







): FactionGeneral | null {







    const resolved = getFactionGeneralsResolved(factionId);







    if (!resolved.length) return null;







    if (excludeGeneralIds && excludeGeneralIds.size > 0) {







        const availableOnStage = resolved.find(







            (g) => isGeneralOnStage(g.generalId) && !excludeGeneralIds.has(g.generalId),







        );







        if (availableOnStage) return availableOnStage;







    }







    return resolved.find((g) => isGeneralOnStage(g.generalId)) ?? resolved[0] ?? null;







}















/** 🔴 [2026-10-16 主人定] 剧本期武将不在「登场年～卒年」内 → 换名（立绘不变）。







 *  🔴 [2026-10-20 主人令「没有武将的，不再用XX势力+将军，一律都叫将军」] 原「势力+将军」作废 ⇒ 一律「将军」







 *     （起因：播报「格鲁吉亚格鲁吉亚将军」说两次势力）。







 *  乱斗 / 编辑器 / 在场 → 原名。 */







function stageGeneralName(generalId: string, name: string): string {







    return isGeneralOnStage(generalId) ? name : '将军';







}















/** 武将所属军团名：武将自己写了就用它，否则用势力表挂的军团。🔴 [2026-10-19 主人令「一个武将要有一个对应的军团」] */







export function getGeneralOwnLegionName(generalId: string | null | undefined): string | null {







    if (!generalId) return null;







    for (const entry of Object.values(FACTION_GENERALS as Record<string, FactionGeneralEntry>)) {







        const list = Array.isArray(entry) ? entry : [entry as FactionGeneral];







        const hit = list.find((g) => g.generalId === generalId);







        if (hit) return hit.legionName ?? null;







    }







    return null;







}















/** 按 generalId 查势力表条目（F2 绑立绘 / 名牌显示） */







const _generalPortraitOverrides: Record<string, string> = {};















/** F2 绑定后热更新（写盘完成前即时生效；HMR 后以 FactionGenerals.ts 为准） */







export function setGeneralPortraitOverride(generalId: string, portraitPath: string): void {







    _generalPortraitOverrides[generalId] = portraitPath;







}















/**







 * `generalId → { factionId, 档案 }` 反向索引（惰性建一次）。







 *







 * 🔴 [2026-09-05 修「玩家移动时战略画面卡」] 改前这个函数是







 * `for (const [factionId, general] of Object.entries(FACTION_GENERALS))` ——







 * **每次调用都把 800+ 条的对象摊成一个全新数组再线性扫**。







 * 而它在 `GlobalUnitRenderer.renderInfo` 里是**每帧每个单位**调一次（画军团名牌要查将领名），







 * 一屏二十支军团就是每秒上千次 × 800 次遍历 + 上千个临时数组，CPU Profile 实测占 2.3%，







 * 且制造的垃圾直接推高 GC 频率。







 * 语义保持不变：同一 generalId 挂在多个势力下时仍取**第一个**（与原 for 循环一致）。







 */







let _generalIdIndex: Map<string, { factionId: string; general: FactionGeneral }> | null = null;















function getGeneralIdIndex(): Map<string, { factionId: string; general: FactionGeneral }> {







    if (_generalIdIndex) return _generalIdIndex;







    const index = new Map<string, { factionId: string; general: FactionGeneral }>();







    for (const [factionId, entry] of Object.entries(FACTION_GENERALS)) {







        // 🔴 [2026-09-12 一势力一将取消] 条目可能是数组 → 逐个登记；同一 generalId 仍取**第一个**（语义不变）







        const list = Array.isArray(entry) ? entry : [entry as FactionGeneral];







        for (const general of list) {







            if (!index.has(general.generalId)) index.set(general.generalId, { factionId, general });







        }







    }







    _generalIdIndex = index;







    return index;







}















/** 按 generalId 查武将原始条目与所属势力（供「一个武将一支精锐」查询武将专属精锐配置） */







export function getRawGeneralByGeneralId(







    generalId: string | null | undefined,







): { factionId: string; general: FactionGeneral } | null {







    if (!generalId) return null;







    return getGeneralIdIndex().get(generalId) ?? null;







}















export function getFactionIdOfGeneral(generalId: string | null | undefined): string | null {







    if (!generalId) return null;







    const hit = getGeneralIdIndex().get(generalId);







    if (hit) return hit.factionId;







    // 战场人物（窦建德 / 平知盛式的"只在场战上出现"的人）也有势力归属，同样答得出来







    return getBattlefieldCharacter(generalId)?.factionId ?? null;







}















/**







 * 🔴 [2026-10-20 主人令「一个武将一个势力，哪个武将登场挂哪个势力的旗帜」]







 * 武将**自己的势力**；不填返回 null＝跟据点势力。







 * 🔴 [2026-10-20 主人令「百岁模式，出城的军团是真归秦了，但长安这座城本身仍属唐国」]







 *    百岁模式下它也是出城军团的**真实势力**（敌我、占城归属都按它，见 `Army.generalId`）；







 *    据点归属仍用 `getFactionIdOfGeneral`（取据点势力），据点本身不变。







 */







export function getGeneralOwnFactionId(generalId: string | null | undefined): string | null {







    if (!generalId) return null;







    return getGeneralIdIndex().get(generalId)?.general.factionId ?? null;







}















export function getGeneralRecordByGeneralId(







    generalId: string,







    options?: { region?: import('../systems/RegionSystem').RegionType },







): FactionGeneral | null {







    const hit = getGeneralIdIndex().get(generalId);







    if (!hit) {







        // 🔴 [2026-09-19 主人定] 兜底：**战场人物**（窦建德 / 王世充 / 保卢斯 / 瓦罗 / 埃提乌斯…）。







        //    主人原话「缺少的人物，做成战场人物。人物和战场点绑定。」







        //    它们不在 `FACTION_GENERALS` 里（塞进去会被城池掷将掷到，那是"东边打完西边又打"），







        //    但战场要用它们当主帅：`spawnBattlefieldSide` 与 13 战术模式都走本函数拿将领名与立绘，







        //    不兜这一下，人物就"有 id 没名字"。







        //    立绘照旧走 resolveGeneralPortraitPath（战场人物的 portrait 通常留空 → 势力池/文化池回落）。







        const bfChar = getBattlefieldCharacter(generalId);







        if (!bfChar) return null;







        const dedicated = _generalPortraitOverrides[generalId] ?? bfChar.portrait ?? '';







        return {







            generalId: bfChar.generalId,







            // 🔴 [2026-10-20 主人令「姬发的剧本敌对武将错误」] 战场人物不在生卒年表里，isGeneralOnStage 对他们恒为 false，







            //    被一律念成「将军」；战场人物只在那一仗出场，名字始终显示真名，不走在场闸。







            generalName: bfChar.generalName,







            portrait: resolveGeneralPortraitPath(dedicated, {







                factionId: bfChar.factionId,







                region: options?.region,







                generalId,







            }),







        };







    }







    // 立绘 override 每次现取：它可以在运行时被改（setGeneralPortraitOverride），不能进索引







    const dedicated = _generalPortraitOverrides[generalId] ?? hit.general.portrait;







    return {







        ...hit.general,







        generalName: stageGeneralName(generalId, hit.general.generalName),







        portrait: resolveGeneralPortraitPath(dedicated, {







            factionId: hit.factionId,







            region: options?.region,







            generalId,







        }),







    };







}















// @ts-ignore







if (import.meta.hot) {







    // @ts-ignore







    import.meta.hot.accept((newModule: any) => {







        if (!newModule?.FACTION_GENERALS) return;







        const target = FACTION_GENERALS as Record<string, FactionGeneral>;







        for (const key of Object.keys(target)) delete (target as any)[key];







        Object.assign(target, newModule.FACTION_GENERALS);







        _generalIdIndex = null;   // 表变了，反向索引作废，下次查询重建







        console.log(`[HMR] FactionGenerals → ${Object.keys(newModule.FACTION_GENERALS).length} 条武将已热更新`);







    });







}







