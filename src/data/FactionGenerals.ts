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
import { HUGUANG_CITY_IDS } from './cities_v2';















export interface FactionGeneral {







    /** 将领 id（须在 GENERAL_PROFILES 有档案，否则武将技不触发） */







    generalId: string;

    /**
     * 🔴 [2026-10-23 主人改机制] **武将挂在哪个据点** ＝ `cityId`。
     * 据点出将一律按 `cityId` 筛（`getCityAnchoredGenerals`），不再按据点的势力取整份名单；
     * 归并势力时只改 `factionId`，`cityId` 不动（挪武将是另一个任务）。
     */

    cityId?: string;







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
    desheng: [
        { generalId: 'desheng_liutong', factionId: 'desheng', cityId: 'city_yunyang', legionName: '起义军', generalName: '刘通', portrait: '', eliteName: '荆襄流民', eliteTier: 4 },   // 🔴 [2026-11-01 补将] 明成化荆襄流民起义首领，据郧阳、称汉王、建元德胜（《明朝军事史》郧阳地区农民起义）
    ],
    wuzhou_yijun: [
        { generalId: 'wuzhou_wangwenjin', factionId: 'wuzhou_yijun', cityId: 'city_wuzhou', legionName: '起义军', generalName: '汪文进', portrait: '', eliteName: '婺州乡兵', eliteTier: 4 },   // 🔴 [2026-11-01 补将] 隋末据婺州，以蔡道人为司空拒守乐安（《隋朝军事史》：叛首汪文进以蔡道人为司空，拒守于乐安）
    ],
    zhangchu: [
        { generalId: 'zhangchu_chensheng', factionId: 'zhangchu', cityId: 'city_huaiyang', legionName: '起义军', generalName: '陈胜', portrait: '', eliteName: '大泽戍卒', eliteTier: 4 },   // 🔴 [2026-11-01 补将] 陈王都陈（宛丘即陈国故都），张楚政权立于陈（《史记·陈涉世家》）；文化随据点＝CENTRAL
    ],
    // ── 2026-10-24 环非洲新将（普将：皆为一隅镇守/城邦之主，无战略级胜绩；立绘留空）──
    kilwa: { generalId: 'kilwa_suleiman', generalName: '苏莱曼哈桑', cityId: 'city_kilwa', portrait: '/assets/AFRICA/kilwa_sulaimanbenhasang.png', eliteName: '埃塞卫兵', eliteTier: 4 },
    mombasa: { generalId: 'mombasa_yusuf', generalName: '优素福', cityId: 'city_mombasa', portrait: '/assets/AFRICA/mombasa_yousufubenhasang.png', eliteName: '埃塞卫兵', eliteTier: 4 },
    mogadishu: { generalId: 'mogadishu_abubakr', generalName: '阿布伯克尔', cityId: 'city_mogadishu', portrait: '/assets/AFRICA/mogadishu_abubokeer.png', eliteName: '埃塞卫兵', eliteTier: 4 },
    zuraid: { generalId: 'zuraid_yasir', generalName: '亚西尔', cityId: 'city_aden', portrait: '/assets/ORIE/zuraid_yaxierbenbilale.png', eliteName: '阿拉伯步兵', eliteTier: 4 },
    pattani: { generalId: 'gen_rajah_hijau', factionId: 'pattani', cityId: 'city_pattani', generalName: '拉者伊祖', portrait: '/assets/MALAY/gen_rajah_hijau.png', legionName: '帝国时代马六甲军团', eliteName: '大年御象军', eliteTier: 2 },








    // 🔴 [2026-09-07] 下面 5 位是新建美洲文化区的开局武将。portrait 一律留空 —— 







    //    我（AI）一张图都没看过，绝不凭空编专属立绘路径（曾编过 /assets/IROQUOIS/... 之类根本不存在的夹）。







    //    留空＝走文化池回落（见 resolveGeneralPortraitPath）。等主人放图后再按约定填：







    //    **势力key_中文名拼音.png**（例：恺撒→luoma_diguo_kaisa.png、柯沙玛因→ayinu_ezo_keshamayin.png），







    //    不是英文转写。文件放进该区的物理立绘夹，不许跨区借图。







    ayinu_ezo: [








        { generalId: 'gen_koshamain', cityId: 'city_moyoro', generalName: '柯沙玛因', portrait: '/assets/JAPAN/gen_koshamain.png', eliteName: '日本足轻', eliteTier: 4 },
        { generalId: 'ayinu_hushemoquan', factionId: 'ayinu_ezo', cityId: 'city_bailao', generalName: '胡奢魔犬', portrait: '/assets/JAPAN/ayinu_hushemoquan.png', eliteName: '日本足轻', eliteTier: 4 },








    
        { generalId: 'beihai_shamusheyun', factionId: 'ayinu_ezo', cityId: 'city_zonggu', legionName: '帝国时代武家军团', generalName: '沙牟奢允', portrait: '/assets/JAPAN/beihai_shamusheyun.png', eliteName: '虾夷弓兵', eliteTier: 3 },








    ],







    yiluokui: { generalId: 'gen_hiawatha', cityId: 'city_onondaga', generalName: '海华沙', portrait: '/assets/AMERICA/gen_hiawatha.png', legionName: '城堡时代易洛魁军团', eliteName: '美洲民兵', eliteTier: 4 },   // 🔴 [2026-10-26] 三级专用军团（易洛魁战士）







    qimu: [
        
{ generalId: 'gen_minchancaman', cityId: 'city_chanchan', generalName: '明查凯曼', portrait: '/assets/INCA/gen_minchancaman.png', eliteName: '印加民兵', eliteTier: 4 }
,
        // 🔴 [2026-10-25 补B] 塔卡伊纳莫（约 9 世纪末–10 世纪初，奇穆王国传说开国君主与统帅；据《特鲁希略匿名史》率船队登陆莫切河谷筑昌昌，子孙征服莫切河谷上下游）｜势力 奇穆｜据点 昌昌（INCA 文化，莫切河谷）｜普将（传说成分）｜精锐「奇穆矛兵」T4｜立绘留空
        { generalId: 'bfe_taycanamo', factionId: 'qimu', cityId: 'city_chanchan', generalName: '塔卡伊纳莫', portrait: '/assets/INCA/bfe_taycanamo.png', eliteName: '奇穆矛兵', eliteTier: 4 },
    ],







    talasike: [







        { generalId: 'gen_tzitzipandaquare', cityId: 'city_tzintzuntzan', generalName: '齐齐潘达夸雷', portrait: '/assets/AMERICA/gen_tzitzipandaquare.png', eliteName: '美洲民兵', eliteTier: 4 },







        // 2026-10-20：托托纳克酋长奇科马卡特（1519 年联络科尔特斯）→ 中美洲（钦聪灿）；AMERICA×帝国＝特诺奇军团







        { generalId: 'gen_chicomacatl', cityId: 'city_tzintzuntzan', generalName: '奇科马卡特', portrait: '/assets/AMERICA/gen_chicomacatl.png', legionName: '帝国时代特诺奇军团', eliteName: '美洲民兵', eliteTier: 4 },







    ],







    tailuona: { generalId: 'gen_cuchacique', cityId: 'city_teyuna', generalName: '库查西克', portrait: '/assets/INCA/gen_cuchacique.png', eliteName: '印加民兵', eliteTier: 4 },







    teweierqie: { generalId: 'gen_casimiro_bigua', cityId: 'city_sanjulian', generalName: '比格', portrait: '/assets/MAPUCHE/gen_casimiro_bigua.png', eliteName: '马普切战士', eliteTier: 4 },







    xinnidelan: { generalId: 'gen_stuyvesant', cityId: 'city_newamsterdam', generalName: '斯泰弗森特', portrait: '/assets/SAXONS/gen_stuyvesant.png', eliteName: '日耳曼民兵', eliteTier: 4 },







    xinfalanxi: { generalId: 'gen_champlain', cityId: 'city_quebec', generalName: '尚普兰', portrait: '/assets/FRANKS/gen_champlain.png', eliteName: '法兰克民兵', eliteTier: 4 },







    xinxibanya: [








        { generalId: 'gen_urdaneta', cityId: 'city_acapulco', generalName: '乌尔达内塔', portrait: '/assets/SPANISH/gen_urdaneta.png' , legionName: '帝国时代西班牙征服军团', eliteName: '西班牙民兵', eliteTier: 4 },
        { generalId: 'xiyindu_batuoluome', factionId: 'xinxibanya', cityId: 'city_shengduomingge', generalName: '巴托洛梅', portrait: '/assets/SPANISH/xiyindu_batuoluome.png', eliteName: '西班牙民兵', eliteTier: 4 },








    
        { generalId: 'gen_cortes', factionId: 'xinxibanya', cityId: 'city_veracruz', generalName: '科尔特斯', portrait: '/assets/SPANISH/tuotuonake_keertesi.png' , legionName: '帝国时代西班牙征服军团', eliteName: '西班牙民兵', eliteTier: 4 },








    ],







    manzheboyi: [
        { generalId: 'gen_gajah_mada', cityId: 'city_teluowulan', generalName: '加查马达', portrait: '/assets/MALAY/gen_gajah_mada.png', eliteName: '马来兵', eliteTier: 4 },
        { generalId: 'manzheboyi_radenwijaya', factionId: 'manzheboyi', cityId: 'city_teluowulan', generalName: '拉登甲亮', portrait: '/assets/MALAY/manzheboyi_radenwijaya.png', eliteName: '满者伯夷兵', eliteTier: 3 },
        { generalId: 'manzheboyi_jayanegara', factionId: 'manzheboyi', cityId: 'city_teluowulan', generalName: '贾亚纳加拉', portrait: '/assets/MALAY/manzheboyi_jayanegara.png', eliteName: '巽他卫队', eliteTier: 4 },
    ],







    zhelouqi: [
        { generalId: 'zhelouqi_puliteweilajie', factionId: 'zhelouqi', cityId: 'city_ajiemier', generalName: '普里特维拉杰', portrait: '/assets/INDIA/zhelouqi_puliteweilajie.png', eliteName: '拉其普特骑', eliteTier: 2 },   // 🔴 [2026-10-25 按史] 成名战敌将；乔汉王，1192 第二次塔拉因战败被俘；据点阿杰梅尔（INDIA，其都城）；用势力精锐拉其普特骑
    ],







    suosuo: { generalId: 'gen_sumanguru', cityId: 'city_kumubi', generalName: '苏曼古鲁', portrait: '/assets/AFRICA/suosuo_sumangulu.png', eliteName: '部落民兵', eliteTier: 4 },
    ghana_diguo: { generalId: 'ghana_tongka_manin', cityId: 'city_kumubi', generalName: '马宁', portrait: '/assets/AFRICA/ghana_tongka_manin.png', eliteName: '部落民兵', eliteTier: 4 },







    antiaokegongguo: { generalId: 'gen_nur_ad_din', cityId: 'city_latajiya', generalName: '努尔丁', portrait: '/assets/ORIE/antiaokegongguo_nuerding.png', eliteName: '阿拉伯步兵', eliteTier: 4 },






    saimien: { generalId: 'gen_yodit', cityId: 'city_saimien', generalName: '尤迪特', portrait: '/assets/ETHIOPIANS/gen_yodit.png', eliteName: '埃塞卫兵', eliteTier: 4 },













    // 🔴 [2026-10-20 主人令「佩尔狄卡斯挂下埃及不对，修复」] 他是亚历山大部将、帝国摄政，史实政权＝马其顿/亚历山大帝国；







    //    据点佩鲁西姆（他公元前 321/320 年征埃及、死于埃及）不改，只挂马其顿旗（武将自带势力）






    kaliya: [







        { generalId: 'gen_artemisia', cityId: 'city_halikanasu', generalName: '阿尔特米西亚', portrait: '/assets/GREECE/gen_artemisia.png', eliteName: '希腊步兵', eliteTier: 4 },







        // 公元前334年哈利卡纳苏斯战役守帅（罗得岛的门农，波斯西部沿海统帅，阿里安 I.20 记其与卡里亚总督据城死守），立绘按铁律留空、待主人亲自放图分配







        { generalId: 'halikanasu_memnon', factionId: 'aqimeinide', cityId: 'city_halikanasu', generalName: '门农', portrait: '/assets/GREECE/halikanasu_memnon.png', eliteName: '罗德岛弓手', eliteTier: 3 },   // 🔴 [2026-10-28 按史] 门农＝罗德岛人、大流士三世波斯军的都督（前334 格拉尼库斯、334–333 守哈利卡纳苏斯）；原挂卡里亚行省（错，他并非卡里亚政权的人）；据点留哈利卡纳苏斯＝他的守城指挥所







    ],






    adiyabeina: { generalId: 'gen_cleitus', cityId: 'city_salonica', generalName: '克雷图斯', portrait: '/assets/ORIE/gen_cleitus.png', eliteName: '马其顿兵', eliteTier: 4 },






    aertai: { generalId: 'gen_kuchlug', cityId: 'city_yeerdishi', generalName: '屈出律', portrait: '/assets/CENTRAL_ASIA/gen_kuchlug.png', eliteName: '河中骑兵', eliteTier: 4 },







    // 🔴 [2026-10-20 主人令「以政权为主，势力的目的是判断该不该打仗：该打的就不合并，不该打的就合并」]







    //    吉尔根汗＝库曼（钦察）汗，库曼尼亚就是库曼人的地（Cumania），与忽炭汗同一政权、不是敌人 → 统一挂库曼






    kuman_oleshky: [
        { generalId: 'kuman_tugorkan', factionId: 'kuman_oleshky', cityId: 'city_oleshky', generalName: '图戈尔坎', portrait: '/assets/CUMAN/kuman_tugorkan.png', eliteName: '库曼弓骑', eliteTier: 3 },   // 🔴 [2026-10-25 按史] 成名战敌将；库曼汗，1096 特鲁别日河战死；据点奥列什基（CUMAN）；用势力精锐库曼弓骑







        { generalId: 'gen_kotyan', cityId: 'city_oleshky', generalName: '忽炭汗', portrait: '/assets/CUMAN/gen_kotyan.png', eliteName: '库曼骑手', eliteTier: 4 },







        // 2026-10-20：克里米亚汗国奠基者哈吉·格莱（1397–1466）→ 黑海北岸库曼（克里米亚鞑靼族源）奥列什基；CUMAN×城堡＝库曼军团







        { generalId: 'gen_haci_giray', cityId: 'city_oleshky', generalName: '哈吉格莱', portrait: '/assets/CUMAN/gen_haci_giray.png', legionName: '城堡时代库曼军团', eliteName: '库曼骑手', eliteTier: 4 },







        // 🔴 [2026-10-20 主人令「这些据点违规了……请删除。据点中有武将的话，请放到相同风格的临近据点」] 原据点 city_cimmericum 已删 → 迁奥列什基（同建筑风格最近），仍挂本政权 cimmerian







        { generalId: 'bfe_cimmerian_king', cityId: 'city_oleshky', legionName: '古典时代萨尔马提亚军团', generalName: '图格达梅', portrait: '/assets/CUMAN/bfe_cimmerian_king.png' , eliteName: '辛梅里安骑', eliteTier: 4},







    
        { generalId: 'qincha_baqiman', cityId: 'city_saksin', generalName: '巴奇曼', portrait: '/assets/CUMAN/qincha_baqiman.png', factionId: 'kuman_oleshky' , eliteName: '钦察部骑', eliteTier: 4 },








    
        { generalId: 'gen_girgen', legionName: '城堡时代库曼军团', cityId: 'city_mierkefu', generalName: '吉尔根汗', portrait: '/assets/SLAVIC/gen_girgen.png', factionId: 'kuman_oleshky' , eliteName: '钦察游骑', eliteTier: 4 },







    ],







    // 巴奇曼＝伏尔加钦察汗；钦察＝库曼（Cuman-Kipchak 同一联盟，汉名钦察／西名库曼），与忽炭汗同一边、不是敌人 → 统一挂库曼






    feierganna: [
        { generalId: 'gen_qutlugh', cityId: 'city_ahexikesi', generalName: '忽都鲁', portrait: '/assets/WESTERN/gen_qutlugh.png', eliteName: '西域兵', eliteTier: 4 },
        { generalId: 'feierganna_qutlugh', factionId: 'feierganna', cityId: 'city_samaerhan', generalName: '忽都鲁妮佳尔', portrait: '/assets/CENTRAL_ASIA/feierganna_qutlugh.png', eliteName: '草原弓骑', eliteTier: 4 },
    ],






    tamoyue: { generalId: 'gen_cunhambebe', cityId: 'city_kabufoliwu', generalName: '昆汉贝贝', portrait: '/assets/TUPI/gen_cunhambebe.png', eliteName: '图皮战士', eliteTier: 4 },







    naweierbuta: { generalId: 'gen_galvarino', cityId: 'city_kelipuli', generalName: '加尔瓦里诺', portrait: '/assets/MAPUCHE/gen_galvarino.png' , legionName: '帝国时代安第斯游击军团', eliteName: '马普切战士', eliteTier: 4 },






    bogendi_wangguo: [
        // 🔴 [2026-10-25 主人令「为某文化某时代立点」] 勃艮第王国（古典）｜贡迪奥克（436–473，451 沙隆之战率勃艮第军与埃提乌斯联军抗阿提拉）；据点 日内瓦＝王国 443–461 年都城；普将；立绘留空；精锐「勃艮第斧兵」T4
        { generalId: 'bogendi_gundioc', factionId: 'bogendi_wangguo', cityId: 'city_geneva', generalName: '贡迪奥克', portrait: '/assets/BURGUNDIANS/bogendi_gundioc.png', eliteName: '勃艮第斧兵', eliteTier: 4 },
        // 🔴 [2026-10-25 主人令「存在就建」] 勃艮第王国（封建）｜鲁道夫一世（888–912，上勃艮第王国开国者，888 圣莫里斯加冕）；据点 日内瓦＝上勃艮第王国核心；普将（实胜缺决定性大捷）；立绘留空；精锐「汝拉骑队」T4
        { generalId: 'bogendi_rudolf_i', factionId: 'bogendi_wangguo', cityId: 'city_geneva', generalName: '鲁道夫一世', portrait: '/assets/BURGUNDIANS/bogendi_rudolf_i.png', eliteName: '汝拉骑队', eliteTier: 4 },
    ],
    bogendigongguo: [








        { generalId: 'gen_john_fearless', cityId: 'city_dijon', generalName: '无畏的约翰', portrait: '/assets/BURGUNDIANS/gen_john_fearless.png', eliteName: '勃艮第民兵', eliteTier: 4 },
        { generalId: 'bogendi_chali', cityId: 'city_dijon', generalName: '大胆查理', portrait: '/assets/BURGUNDIANS/bogendi_chali.png', factionId: 'bogendigongguo', eliteName: '勃艮第骑士', eliteTier: 2 },








    
        { generalId: 'gen_philip_good', cityId: 'city_lier', generalName: '好人菲利普', portrait: '/assets/BURGUNDIANS/gen_philip_good.png', factionId: 'bogendigongguo', eliteName: '勃艮第民兵', eliteTier: 4 },








        // 🔴 [2026-10-24 险要补将·镇守] 普雷西＝勃艮第公爵无畏约翰重臣，1419 年蒙特罗会谈随侍驻防；普将；精锐「勃艮第卫队」T4
        { generalId: 'montereau_pressy', generalName: '普雷西', factionId: 'bogendigongguo', cityId: 'city_mengteluo', portrait: '/assets/BURGUNDIANS/bogendigongguo_rangdepuleixi.png', eliteName: '勃艮第卫队', eliteTier: 4 },
        { generalId: 'bogendi_jacqueline', factionId: 'bogendigongguo', cityId: 'city_bruges', generalName: '埃诺的杰奎琳', portrait: '/assets/BURGUNDIANS/bogendi_jacqueline.png', eliteName: '埃诺卫队', eliteTier: 4 },
    ],







    amaniyake: [
        { generalId: 'gen_bernard_armagnac', cityId: 'city_oushi', generalName: '贝尔纳七世', portrait: '/assets/FRANKS/gen_bernard_armagnac.png', eliteName: '法兰克民兵', eliteTier: 4 },
    ],






    // 🔴 [2026-10-20 主人令「按历史来，该是什么势力就是什么势力」] 瓦卢瓦勃艮第三家同属一国 → 统一挂勃艮第公国






    weiershigongguo: [







        { generalId: 'gen_llywelyn', cityId: 'city_hawadeng', generalName: '卢埃林', portrait: '/assets/CELTS/gen_llywelyn.png', eliteName: '凯尔特兵', eliteTier: 4 },
        { generalId: 'gen_dafydd', factionId: 'weiershigongguo', cityId: 'city_hawadeng', generalName: '戴菲德', portrait: '/assets/CELTS/gen_dafydd.png', eliteName: '凯尔特兵', eliteTier: 4 },







        { generalId: 'weiershi_arthur', factionId: 'weiershigongguo', cityId: 'city_kanafeng', generalName: '亚瑟王', portrait: '/assets/BRITONS/weiershi_arthur.png', eliteName: '不列颠矛兵', eliteTier: 4 },
        { generalId: 'weiershi_mordred', factionId: 'weiershigongguo', cityId: 'city_kanafeng', generalName: '莫特列德', portrait: '/assets/BRITONS/weiershi_mordred.png', eliteName: '叛军矛兵', eliteTier: 4 },
    ],






    miandian: { generalId: 'gen_maha_thiha_thura', cityId: 'city_santaguan', generalName: '摩诃悉都', portrait: '/assets/BURMESE/gen_maha_thiha_thura.png', eliteName: '缅甸战象', eliteTier: 2 },







    malai: { generalId: 'gen_sang_nila_utama', cityId: 'city_danmaxi', generalName: '桑尼拉乌他马', portrait: '/assets/MALAY/gen_sang_nila_utama.png', eliteName: '马来兵', eliteTier: 4 },







    taimier: { generalId: 'gen_rajaram', cityId: 'city_jinqi', generalName: '拉贾拉姆', portrait: '/assets/INDIA/taimier_lajialamu.png', eliteName: '印度步兵', eliteTier: 4 },















    boootiya: [
        { generalId: 'bfe2_theagenes', cityId: 'city_thebes', generalName: '特阿格尼斯', portrait: '/assets/GREECE/bfe2_theagenes.png', legionName: '古典时代赫拉斯军团', eliteName: '希腊步兵', eliteTier: 4 },
        { generalId: 'bfe_callias', cityId: 'city_thebes', generalName: '卡利斯', portrait: '/assets/GREECE/bfe_callias.png', factionId: 'boootiya', legionName: '古典时代赫拉斯军团', eliteName: '希腊步兵', eliteTier: 4 },







        { generalId: 'gen_epaminondas', cityId: 'city_thebes', generalName: '伊巴密浓达', portrait: '/assets/GREECE/gen_epaminondas.png', eliteName: '底比斯圣队', eliteTier: 1 },







        // 公元前335年底比斯战役守帅（底比斯主将菲尼克斯，见剧本该场 description），立绘按铁律留空、待主人亲自放图分配







        { generalId: 'dibisi_phoinix', cityId: 'city_thebes', generalName: '菲尼克斯', portrait: '/assets/GREECE/dibisi_phoinix.png', eliteName: '希腊步兵', eliteTier: 4 },







    ],






    kelite: [







        { generalId: 'gen_morosini', cityId: 'city_knossos', generalName: '莫罗西尼', portrait: '/assets/LATIN/kelite_moluoxini.png', eliteName: '意大利民兵', eliteTier: 4 },
        { generalId: 'gen_cangrande', legionName: '城堡时代意大利雇兵军团', factionId: 'kelite', cityId: 'city_verona', generalName: '坎格兰德', portrait: '/assets/LATIN/bohepingyuan_diaoduolike.png', eliteName: '意大利民兵', eliteTier: 4 },







    
        { generalId: 'gen_dandolo', legionName: '城堡时代意大利雇兵军团', factionId: 'kelite', cityId: 'city_venice', generalName: '丹多洛', portrait: '/assets/LATIN/yadelaiya_danduoluo.png', eliteName: '威尼斯桨手', eliteTier: 2 },







    
        { generalId: 'kejila_shulunbao', factionId: 'kelite', cityId: 'city_kefu', generalName: '舒伦堡', portrait: '/assets/LATIN/kejila_shulunbao.png', eliteName: '雇佣枪兵', eliteTier: 3 },







    ],







    leangongguo: [







        { generalId: 'gen_alfonso_ix', cityId: 'city_salamanca', generalName: '阿方索九世', portrait: '/assets/SPANISH/gen_alfonso_ix.png', eliteName: '西班牙民兵', eliteTier: 4 },







        // 🔴 [2026-10-20 成名战规则] 拉米罗二世＝莱昂国王（939 西曼卡斯战役击败阿卜杜·拉赫曼三世）；据点萨拉曼卡（SPANISH 风格）；封建×西班牙＝封建时代摩尔游骑军团；立绘留空







        { generalId: 'gen_ramiro_ii', cityId: 'city_salamanca', generalName: '拉米罗二世', portrait: '/assets/SPANISH/gen_ramiro_ii.png', legionName: '封建时代摩尔游骑军团', eliteName: '阿拉贡骑士', eliteTier: 3 },







    ],






    xixiliwangguo: [







        { generalId: 'gen_frederic_ii', cityId: 'city_palermo', generalName: '腓特烈二世', portrait: '/assets/SICILIANS/gen_frederic_ii.png', eliteName: '神圣罗马骑', eliteTier: 3 },







        // 2026-10-20 主人令「有名字的武将都要安置在据点」：诺曼人博希蒙德（塔兰托亲王、安条克亲王）→ 诺曼西西里（巴勒莫），军团随 SICILIANS×城堡＝诺曼军团







        { generalId: 'gen_bohemond', cityId: 'city_palermo', generalName: '博希蒙德', portrait: '/assets/SICILIANS/gen_bohemond.png', legionName: '城堡时代诺曼军团', eliteName: '诺曼骑士', eliteTier: 2 },







    
        { generalId: 'gen_robert_guiscard', factionId: 'xixiliwangguo', cityId: 'city_meierfei', generalName: '罗贝尔吉斯卡尔', portrait: '/assets/SICILIANS/gen_robert_guiscard.png', eliteName: '诺曼骑士', eliteTier: 2 },
        { generalId: 'hre_manfred', factionId: 'xixiliwangguo', cityId: 'city_meierfei', legionName: '城堡时代诺曼军团', generalName: '曼弗雷德', portrait: '/assets/SICILIANS/hre_manfred.png', eliteName: '施瓦本骑士', eliteTier: 3 },








    
        { generalId: 'gen_roger_i', factionId: 'xixiliwangguo', cityId: 'city_messina', generalName: '罗杰一世', portrait: '/assets/SICILIANS/gen_roger_i.png', eliteName: '诺曼骑士', eliteTier: 2 },







    
        { generalId: 'gen_charles_i_naples', legionName: '城堡时代意大利雇兵军团', factionId: 'xixiliwangguo', cityId: 'city_naples', generalName: '卡洛', portrait: '/assets/LATIN/kanpaniya_kaluo.png', eliteName: '安茹骑士', eliteTier: 3 },







    
        { generalId: 'gen_city_syracuse', factionId: 'xixiliwangguo', cityId: 'city_syracuse', generalName: '阿加索克利', portrait: '/assets/SICILIANS/gen_city_syracuse.png', legionName: '古典时代叙拉古军团', eliteName: '西西里兵', eliteTier: 4 },







    ],














    yipilusi: { generalId: 'yipilusi_piluoshi', cityId: 'city_anbulajiya', generalName: '皮洛士', portrait: '/assets/GREECE/yipilusi_piluoshi.png', eliteName: '伊庇方阵', eliteTier: 2 },







    lagoniya: [
        { generalId: 'bfe2_pollis', cityId: 'city_sparta', generalName: '波利斯', portrait: '/assets/SPARTANS/bfe2_pollis.png', legionName: '古典时代斯巴达军团', eliteName: '斯巴达兵', eliteTier: 4 },
        { generalId: 'bfe_cleombrotus', cityId: 'city_sparta', generalName: '克里奥姆布罗图斯', portrait: '/assets/SPARTANS/bfe_cleombrotus.png', legionName: '古典时代斯巴达军团', eliteName: '斯巴达兵', eliteTier: 4 },
        { generalId: 'gen_leonidas', cityId: 'city_sparta', generalName: '列奥尼达', portrait: '/assets/SPARTANS/gen_leonidas.png', eliteName: '斯巴达兵', eliteTier: 4 },
        { generalId: 'bfe2_cleombrotus_i', cityId: 'city_sparta', generalName: '克勒翁布罗图斯一世', portrait: '/assets/SPARTANS/bfe2_cleombrotus_i.png', legionName: '古典时代斯巴达军团', eliteName: '斯巴达兵', eliteTier: 4 },
    
        { generalId: 'gen_brasidas', legionName: '古典时代雅典军团', factionId: 'lagoniya', cityId: 'city_sparta', generalName: '巴西达斯', portrait: '/assets/ATHENIANS/gen_brasidas.png', eliteName: '斯巴达重步', eliteTier: 2 },








    
        { generalId: 'gen_lysander', legionName: '古典时代斯巴达军团', factionId: 'lagoniya', cityId: 'city_sparta', generalName: '吕山德', portrait: '/assets/ATHENIANS/gen_lysander.png', eliteName: '斯巴达重步', eliteTier: 2 },








    ],







    maqidun: [
        // 🔴 [2026-10-20 史实] 腓力二世＝马其顿国王，都城佩拉（非奥林索斯战场）；马其顿军团
        { generalId: 'gen_philip_ii', cityId: 'city_salonica', generalName: '腓力二世', portrait: '/assets/MACEDONIAN/gen_philip_ii.png', legionName: '古典时代马其顿军团', eliteName: '马其顿方阵', eliteTier: 1 },
        // 🔴 [2026-10-20 史实] 帕曼纽＝马其顿老将，随王驻佩拉；马其顿军团
        { generalId: 'gen_parmenion', cityId: 'city_salonica', generalName: '帕曼纽', portrait: '/assets/MACEDONIAN/gen_parmenion.png', legionName: '古典时代马其顿军团', eliteName: '银盾兵', eliteTier: 2 },







        { generalId: 'gen_alexander_great', cityId: 'city_salonica', generalName: '亚历山大', portrait: '/assets/MACEDONIAN/gen_alexander_great.png', eliteName: '伙友骑兵', eliteTier: 1 },







        // 公元前323年普拉塔纳斯战役守帅（马其顿摄政、欧洲最高统帅安提帕特）。







        // 🔴 [2026-09-19 主人令「全删除」] 该战役事件已删除（武将无据点、事件触发不了）；**人物记录保留**。







        // 立绘按铁律留空走回落、待主人亲自放图分配







        { generalId: 'maqidun_antipater', cityId: 'city_salonica', generalName: '安提帕特', portrait: '/assets/MACEDONIAN/maqidun_antipater.png', eliteName: '马其顿兵', eliteTier: 4 },







        // 公元前321年赫勒斯滂战役反摄政同盟统帅克拉特罗斯，立绘按铁律留空走回落、待主人亲自放图分配







        { generalId: 'maqidun_craterus', cityId: 'city_salonica', generalName: '克拉特罗斯', portrait: '/assets/MACEDONIAN/maqidun_craterus.png', eliteName: '马其顿方阵', eliteTier: 1 },







    
        { generalId: 'hesitiya_yiasong', legionName: '古典时代赫拉斯军团', factionId: 'sesali', cityId: 'city_pelina', generalName: '伊阿宋', portrait: '/assets/GREECE/hesitiya_yiasong.png', eliteName: '色萨利骑', eliteTier: 3  },   // 按史：伊阿宋为费莱/色萨利僭主，统色萨利骑兵，非马其顿伙伴骑兵（Xenophon《希腊史》VI.1.19）








    
        { generalId: 'jiduoluoxiya_xibiertiwusi', legionName: '古典时代阿契美尼德军团', factionId: 'maqidun', cityId: 'city_pula', generalName: '西比尔提乌斯', portrait: '/assets/PERSIAN/jiduoluoxiya_xibiertiwusi.png', eliteName: '普拉戍卒', eliteTier: 4  },   // 按史：西比尔提乌斯前 316 受安提柯拨归银盾兵（Argyraspides）统辖（Diodorus XIX.48；复用现有银盾兵 T1 同番号）








    








        { generalId: 'bfe_mendenus', factionId: 'maqidun', cityId: 'city_salonica', generalName: '门德努斯', portrait: '/assets/MACEDONIAN/bfe_mendenus.png', eliteName: '马其顿兵', eliteTier: 4 },
        { generalId: 'bfe_erigius', factionId: 'maqidun', cityId: 'city_salonica', generalName: '埃里吉乌斯', portrait: '/assets/MACEDONIAN/bfe_erigius.png', eliteName: '希腊同盟骑', eliteTier: 4 },
        { generalId: 'maqidun_hephaistion', factionId: 'maqidun', cityId: 'city_salonica', generalName: '赫菲斯提昂', portrait: '/assets/MACEDONIAN/maqidun_hephaistion.png', eliteName: '伙伴骑兵', eliteTier: 3 },
        { generalId: 'maqidun_nearchos', factionId: 'maqidun', cityId: 'city_salonica', generalName: '尼阿库斯', portrait: '/assets/MACEDONIAN/maqidun_nearchos.png', eliteName: '马其顿矛兵', eliteTier: 4 },
    ],







    lagusa: { generalId: 'gen_dragan', cityId: 'city_ragusa', generalName: '德拉甘', portrait: '/assets/SLAVIC/lagusa_delagan.png', eliteName: '罗斯民兵', eliteTier: 4 },






    meikelunbao: { generalId: 'gen_henry_borwin', cityId: 'city_rostock', generalName: '博尔温', portrait: '/assets/GERMANIC/meikelunbao_hengliboluo.png', eliteName: '日耳曼民兵', eliteTier: 4 },







    didi: { generalId: 'gen_willem_juliette', cityId: 'city_bruges', generalName: '威廉一世', portrait: '/assets/GERMANIC/didi_weilianyishi.png', legionName: '城堡时代尼德兰军团', eliteName: '勃艮第民兵', eliteTier: 4 },






    yidelisi: [







        { generalId: 'gen_idris_i', cityId: 'city_feisi', generalName: '伊德里斯', portrait: '/assets/BERBER/yidelisi_yidelisi.png', eliteName: '柏柏尔骑手', eliteTier: 4 },







        // 🔴 [2026-10-20 成名战规则] 阿布哈桑＝马林苏丹（1340 萨拉多河被卡斯蒂利亚-葡萄牙联军击败）→ 非斯（马林都城，BERBER 风格）；势力挂马格里布（库无马林独立势力，报告）；城堡×柏柏尔＝城堡时代摩尔军团；立绘留空







        { generalId: 'malin_abulhasan', cityId: 'city_feisi', generalName: '阿布哈桑', portrait: '/assets/BERBER/malin_abulhasan.png', factionId: 'malin', legionName: '城堡时代摩尔军团', eliteName: '柏柏尔轻骑', eliteTier: 3 },   // 🔴 [2026-10-28 主人批修] 阿布哈桑＝马林王朝苏丹（1340 里奥萨拉多、1333 攻直布罗陀）；原挂穆拉比特错（马林≠穆拉比特、晚约 3 个世纪）；据点仍非斯＝其都城；军团＝城堡×摩尔格（与文化同条）；专属精锐「马拉喀什军」T3 照旧







    ],






    baojialiya: [
        // 🔴 [2026-10-25 补B] 拉德科·迪米特里耶夫（1859–1918，保加利亚第 3 集团军统帅；1912 第一次巴尔干战争洛зен格勒、吕莱布尔加兹大胜奥斯曼东色雷斯集团军）｜势力 保加利亚｜据点 普罗夫迪夫（THRACIAN 文化，北色雷斯）｜普将（存疑）｜精锐「保加利亚军」T4｜立绘留空
        { generalId: 'bfe_dimitriev', factionId: 'baojialiya', cityId: 'city_plovdiv', generalName: '迪米特里耶夫', portrait: '/assets/THRACIAN/bfe_dimitriev.png', eliteName: '保加利亚军', eliteTier: 4 },
        // 🔴 [2026-10-25 补B] 彼得德良（？–1041，1040 反拜占庭大起义统帅，据斯科普里席卷马其顿与希腊北部）｜势力 保加利亚｜据点 斯科普里（MACEDONIAN 文化，瓦尔达尔河流域）｜普将（实败）｜精锐「马其顿义军」T4｜立绘留空
        { generalId: 'bfe_peter_delyan', factionId: 'baojialiya', cityId: 'city_skopje', legionName: '封建时代塞萨洛尼基军团', generalName: '彼得德良', portrait: '/assets/MACEDONIAN/bfe_peter_delyan.png', eliteName: '马其顿义军', eliteTier: 4 },
        // 🔴 [2026-10-25 补B] 代尔切夫（1872–1903，马其顿内部革命组织 IMRO 最高军事组织者，以斯科普里—什蒂普为活动大本营）｜势力 保加利亚｜据点 斯科普里（MACEDONIAN 文化）｜普将（存疑）｜精锐「马其顿游击」T4｜立绘留空
        { generalId: 'bfe_gotse_delchev', factionId: 'baojialiya', cityId: 'city_skopje', generalName: '代尔切夫', portrait: '/assets/MACEDONIAN/bfe_gotse_delchev.png', eliteName: '马其顿游击', eliteTier: 4 },
        // 🔴 [2026-10-25 补B] 瓦西尔·列夫斯基（1837–1873，保加利亚民族起义领袖）｜势力 保加利亚｜据点 索非亚（BULGARIANS 文化）｜普将｜精锐「保加利亚军」T4｜立绘留空
        { generalId: 'baojialiya_levski', factionId: 'baojialiya', cityId: 'city_sofia', generalName: '列夫斯基', portrait: '/assets/BULGARIANS/baojialiya_levski.png', eliteName: '保加利亚军', eliteTier: 4 },







        { generalId: 'baojialiya_aseni', cityId: 'city_teernuowo', generalName: '阿森一世', portrait: '/assets/BULGARIANS/baojialiya_aseni.png', eliteName: '保加卫队', eliteTier: 3 },







        // 🔴 [2026-10-20 成名战规则] 希什曼＝保加利亚第二帝国沙皇（1330 维尔布日德战死）→ 特尔诺沃·保加利亚；普将；立绘留空







        { generalId: 'baojialiya_mikhail', cityId: 'city_teernuowo', legionName: '城堡时代默西亚军团', generalName: '希什曼', portrait: '/assets/BULGARIANS/baojialiya_mikhail.png', eliteName: '保加利亚兵', eliteTier: 4 },







    
        { generalId: 'duonaobaojia_tzimiskes', factionId: 'baizanting', cityId: 'city_junshitandingbao', legionName: '封建时代罗曼尼亚军团', generalName: '齐米斯基', portrait: '/assets/BULGARIANS/duonaobaojia_tzimiskes.png', eliteName: '拜占庭铁甲', eliteTier: 2 },
        { generalId: 'duonaobaojia_samuel', factionId: 'baojialiya', cityId: 'city_sofia', legionName: '封建时代保加利亚军团', generalName: '萨穆伊尔', portrait: '/assets/BULGARIANS/duonaobaojia_samuel.png', eliteName: '保加卫队', eliteTier: 3 },








    
        { generalId: 'gen_krum', legionName: '封建时代保加利亚军团', factionId: 'baojialiya', cityId: 'city_sofia', generalName: '克鲁姆', portrait: '/assets/BULGARIANS/gen_krum.png', eliteName: '保加卫队', eliteTier: 3 },







    
        { generalId: 'gen_ivaylo', legionName: '城堡时代博亚尔军团', factionId: 'baojialiya', cityId: 'city_teernuowo', generalName: '伊瓦伊洛', portrait: '/assets/SLAVIC/duobuluojia_yiwaiyiluo.png', eliteName: '保加卫队', eliteTier: 3 },







    
        { generalId: 'jialiboli_kaluoyang', factionId: 'baojialiya', cityId: 'city_teernuowo', legionName: '城堡时代默西亚军团', generalName: '卡洛扬', portrait: '/assets/BYZANTINE/jialiboli_kaluoyang.png', eliteName: '保加卫队', eliteTier: 3 },


        // 🔴 [2026-10-25 主人令「全面修复」] 西美昂＝保加利亚第一帝国沙皇（893–927），原误挂色雷斯；归保加利亚
        { generalId: 'gen_simeon_great', cityId: 'city_puleisilafu', generalName: '西美昂', portrait: '/assets/THRACIAN/gen_simeon_great.png', eliteName: '保加卫队', eliteTier: 3 },







        { generalId: 'baojialiya_konstantin', factionId: 'baojialiya', cityId: 'city_teernuowo', generalName: '君士坦丁沙皇', portrait: '/assets/BULGARIANS/baojialiya_konstantin.png', eliteName: '保加利亚骑', eliteTier: 4 },
    ],






    bosiniya: { generalId: 'gen_tvrtko', cityId: 'city_sarajevo', generalName: '特夫尔特科', portrait: '/assets/SLAVIC/bosiniya_tefuerteke.png', eliteName: '罗斯民兵', eliteTier: 4 },















    mulabite: [



        { generalId: 'gen_tashfin', cityId: 'city_malajiashen', generalName: '塔什芬', portrait: '/assets/BERBER/mulabite_tashenfen.png', eliteName: '柏柏尔轻骑', eliteTier: 3 },



        // 🔴 [2026-10-20 成名战规则] 阿里优素福＝穆拉比特埃米尔（1106–1143，1139 奥里基战役败于阿方索·恩里克斯）→ 马拉喀什（BERBER 风格）；封建×柏柏尔＝封建时代柏柏尔军团；立绘留空



        { generalId: 'gen_ali_ibn_yusuf', cityId: 'city_malajiashen', generalName: '阿里优素福', portrait: '/assets/BERBER/gen_ali_ibn_yusuf.png', eliteName: '柏柏尔轻骑', eliteTier: 3 },



    
        { generalId: 'talike_talike', factionId: 'womaya', cityId: 'city_danjier', legionName: '封建时代柏柏尔军团', generalName: '塔里克', portrait: '/assets/BERBER/talike_talike.png', eliteName: '柏柏尔轻骑', eliteTier: 3 },
















    ],






    zhayan: [
        { generalId: 'gen_yaghmurasen', cityId: 'city_teleimusen', generalName: '亚格姆拉森', portrait: '/assets/BERBER/zhayan_yalimoluo.png', eliteName: '柏柏尔骑手', eliteTier: 4 },
        // 🔴 [2026-10-20 主人令「遇到问题先看符合历史，下结论再动手」] 成名战回补安置按史实复核：库赛拉＝奥雷巴柏柏尔王，阿尔塔瓦王国（今特莱姆森一带）；丹吉尔从未是他的驻地 → 放特莱姆森（zhayan，风格 BERBER）；仍挂本政权 talike
        { generalId: 'gen_kusaila', cityId: 'city_kailuwan', factionId: 'mulabite', legionName: '封建时代柏柏尔军团', generalName: '库赛拉', portrait: '/assets/BERBER/gen_kusaila.png', eliteName: '柏柏尔轻骑', eliteTier: 3 },
    ],






    hamade: { generalId: 'gen_hammad', cityId: 'city_bujiaya', generalName: '哈马德', portrait: '/assets/BERBER/hamade_hamade.png', eliteName: '柏柏尔骑手', eliteTier: 4 },







    buni: [
        { generalId: 'buni_mathos', factionId: 'buni', cityId: 'city_jiataji', generalName: '马托斯', portrait: '/assets/BERBER/buni_mathos.png', eliteName: '柏柏尔骑手', eliteTier: 4 },   // 🔴 [2026-10-25 按史] 成名战敌将；雇佣兵战争叛军首领，前238 锯谷被擒处死；库无利比亚叛乱方势力，暂以 buni 迦太基作同势力内战处理；据点迦太基城（BERBER）；用势力精锐努米底亚骑
        { generalId: 'bfe_bomilcar', cityId: 'city_jiataji', generalName: '波米尔卡', portrait: '/assets/BERBER/bfe_bomilcar.png', legionName: '古典时代迦太基军团', eliteName: '柏柏尔骑手', eliteTier: 4 },







        { generalId: 'gen_hannibal', cityId: 'city_jiataji', generalName: '汉尼拔', portrait: '/assets/BERBER/buni_hanniba.png', eliteName: '迦太基圣团', eliteTier: 2 },







        // 2026-10-20：汪达尔国王盖萨里克（389–477，439 年取迦太基）→ 迦太基；BERBER×古典＝迦太基军团







        { generalId: 'wangdaer_gaisalike', cityId: 'city_jiataji', generalName: '盖萨里克', portrait: '/assets/BERBER/wangdaer_gaisalike.png', legionName: '古典时代迦太基军团', eliteName: '汪达尔骑', eliteTier: 3 },







    
        { generalId: 'gen_hamilcar', factionId: 'buni', cityId: 'city_jiadisi', generalName: '哈米尔卡', portrait: '/assets/BERBER/gen_hamilcar.png', eliteName: '努米底亚骑', eliteTier: 3 },








    ],







    aguelabu: [
        
{ generalId: 'gen_uqba', cityId: 'city_kailuwan', generalName: '奥克巴', portrait: '/assets/BERBER/aguelabu_aokeba.png', eliteName: '凯鲁万骑', eliteTier: 3 }
,
        // 🔴 [2026-10-25 补B] 阿齐兹（克里特埃米尔，961 干地亚陷落时在位；克里特埃米尔国出自阿格拉布，据凯鲁万）｜势力 阿格拉布｜据点 凯鲁万（BERBER 文化）｜普将｜精锐「克里特军」T4｜立绘留空
        { generalId: 'bfe_abdulaziz_crete', factionId: 'aguelabu', cityId: 'city_kailuwan', generalName: '阿齐兹', portrait: '/assets/BERBER/bfe_abdulaziz_crete.png', eliteName: '克里特军', eliteTier: 4 },
    ],






    jileinaijia: { generalId: 'gen_magas', cityId: 'city_banjiaxi', generalName: '马加斯', portrait: '/assets/GREECE/gen_magas.png', eliteName: '希腊步兵', eliteTier: 4 },














    maixiya: { generalId: 'gen_offa_mercia', cityId: 'city_oxford', generalName: '奥法', portrait: '/assets/SAXONS/gen_offa_mercia.png', eliteName: '英格兰民兵', eliteTier: 4 },







    nidelan: [
        { generalId: 'gen_william_silent', cityId: 'city_hague', generalName: '威廉奥兰治', portrait: '/assets/GERMANIC/nidelan_weilian.png', eliteName: '日耳曼民兵', eliteTier: 4 },
        { generalId: 'capetown_riebeeck', generalName: '里贝克', cityId: 'city_cape_town', factionId: 'nidelan', eliteName: '开普守军', eliteTier: 4, portrait: '/assets/GERMANIC/nidelan_yangfanlibeike.png' },
    ],






    pomeilaniya: [
        { generalId: 'pomeilaniya_bogislaw', cityId: 'city_shiqieqing', generalName: '博吉斯拉夫十世', portrait: '/assets/GERMANIC/pomeilaniya_bojisilafu.png', eliteName: '日耳曼民兵', eliteTier: 4 },  // 什切青·格里芬王朝公爵,
        { generalId: 'bfe_bogislaw_i', factionId: 'pomeilaniya', cityId: 'city_shiqieqing', generalName: '博吉斯拉夫一世', portrait: '/assets/GERMANIC/bfe_bogislaw_i.png', eliteName: '格里芬卫队', eliteTier: 4 },
    ],






    tuosikana: [








        { generalId: 'gen_lorenzo_medici', cityId: 'city_florence', generalName: '洛伦佐', portrait: '/assets/LATIN/tuosikana_luolunzuo.png', eliteName: '意大利民兵', eliteTier: 4 },
        { generalId: 'gen_ugolino', factionId: 'tuosikana', cityId: 'city_pisa', generalName: '乌戈里诺', portrait: '/assets/LATIN/anuo_wugelinuo.png', eliteName: '意大利民兵', eliteTier: 4 },








    ],






    talanduo: { generalId: 'talanduo_aqita', cityId: 'city_talanduo', generalName: '阿契塔', portrait: '/assets/GREECE/talanduo_aqita.png', eliteName: '希腊步兵', eliteTier: 4 },







    safuyi: { generalId: 'safuyi_ameidi', cityId: 'city_shangbeili', generalName: '阿梅迪奥', portrait: '/assets/LATIN/safuyi_ameidi.png', eliteName: '意大利民兵', eliteTier: 4 },






    jiatailuoniya: [

        { generalId: 'gen_wifred_hairy', cityId: 'city_barcelona', generalName: '威弗雷德', portrait: '/assets/LATIN/jiatailuoniya_weifuleide.png', eliteName: '意大利民兵', eliteTier: 4 },



        // 🔴 [2026-10-20 成名战规则] 阿布叶海亚＝马略卡摩尔总督（1229 战死）；马略卡城库无据点，取最近同风格据点巴塞罗那（LATIN，加泰罗尼亚）；势力仍写穆瓦希德；立绘留空



        { generalId: 'gen_abu_yahya', cityId: 'city_labate', generalName: '阿布叶海亚', portrait: '/assets/LATIN/gen_abu_yahya.png', factionId: 'muwaxide', legionName: '城堡时代摩尔军团', eliteName: '柏柏尔骑手', eliteTier: 4 },



    ],







    nasier: [



        { generalId: 'gen_muhammad_i', cityId: 'city_granada', generalName: '穆罕默德', portrait: '/assets/SPANISH/gen_muhammad_i.png', eliteName: '阿拉伯步兵', eliteTier: 4 },



        // 🔴 [2026-10-20 成名战规则] 穆罕默德十二世＝格拉纳达末代苏丹（1491 城降）→ 格拉纳达（SPANISH）；城堡时代卡斯蒂利亚军团；立绘留空



        { generalId: 'gen_muhammad_xii', cityId: 'city_granada', generalName: '穆罕默德十二世', portrait: '/assets/SPANISH/gen_muhammad_xii.png', eliteName: '纳斯尔卫队', eliteTier: 3 },



    ],






    seleisi: [







        // （西美昂已按史归保加利亚，见 baojialiya 块）







        // 公元前335年多瑙河渡河战役守帅（多瑙河北岸盖塔人的君主科托罗，名取自剧本该场对手主将队注释与世纪表的既定记载），立绘按铁律留空、待主人亲自放图分配







        { generalId: 'jite_shouling', cityId: 'city_plovdiv', generalName: '科托罗', portrait: '/assets/THRACIAN/jite_shouling.png', legionName: '古典时代色雷斯军团', eliteName: '色雷斯兵', eliteTier: 4 },







    ],














    pufaerci: { generalId: 'gen_ludwig_iv', cityId: 'city_heidelberg', generalName: '路德维希', portrait: '/assets/GERMANIC/pufaerci_ludeweixi.png', eliteName: '日耳曼民兵', eliteTier: 4 },







    hansa: [








        { generalId: 'gen_stortebeker', cityId: 'city_hamburg', generalName: '克劳斯', portrait: '/assets/GERMANIC/hansa_kelaosi.png', eliteName: '日耳曼民兵', eliteTier: 4 },
        { generalId: 'gen_ansgar', legionName: '封建时代法兰克军团', factionId: 'hansa', cityId: 'city_bremen', generalName: '安斯加尔', portrait: '/assets/FRANKS/gen_ansgar.png', eliteName: '法兰克民兵', eliteTier: 4 },








    ],







    batawei: { generalId: 'gen_civilis', cityId: 'city_utrecht', generalName: '西维利斯', portrait: '/assets/GERMANIC/batawei_xiweilisi.png', eliteName: '巴达维卫队', eliteTier: 3 },







    weijing_york: { generalId: 'gen_eric_bloodaxe', cityId: 'city_york', generalName: '埃里克', portrait: '/assets/DANES/gen_eric_bloodaxe.png', eliteName: '丹麦民兵', eliteTier: 4 },













    puluowangsi: [
        // 🔴 [2026-10-24 主人令] 雷蒙四世＝图卢兹伯爵（首府图卢兹）；势力归法兰西（factionId: gaolu），存于此块仅历史原因。
        //    军团按「势力时代（法兰克=feudal）× 据点文化（FRANKS）」解析，仍是「封建时代法兰克军团」，无需写 legionName。
        { generalId: 'gen_raymond_iv', factionId: 'gaolu', cityId: 'city_toulouse', generalName: '雷蒙四世', portrait: '/assets/FRANKS/gen_raymond_iv.png', eliteName: '法兰西骑士', eliteTier: 3 },
        // 🔴 [2026-10-24 修复「普罗旺斯 无武将」] 普罗旺斯伯国自己的将：贝朗热（1198–1245，普罗旺斯伯爵 1209–1245，
        //    都艾克斯 Aix）。按史：普罗旺斯伯国是真实政权（势力清理 plan-A 定 keep）；他镇守/治理普罗旺斯 → 势力＝普罗旺斯；
        //    城库无艾克斯，按「同文化的最近据点，远也照取」取普罗旺斯境内 FRANKS 的阿维尼翁（约 70km）。
        //    普将（无战役级大捷，以联姻外交与伯国治理著称）；精锐番号「普罗旺斯骑」T3；立绘留空（AI 不配图）。
        { generalId: 'gen_raymond_berenguer_iv', factionId: 'puluowangsi', cityId: 'city_avignon', generalName: '贝朗热', portrait: '/assets/FRANKS/gen_raymond_berenguer_iv.png', eliteName: '普罗旺斯骑', eliteTier: 3 },
    ],







    lunbadi: [
        { generalId: 'bfe_albert_lombard', cityId: 'city_milan', generalName: '比安德拉泰', portrait: '/assets/LATIN/bfe_albert_lombard.png', legionName: '城堡时代意大利雇兵军团', eliteName: '意大利民兵', eliteTier: 4 },



        // 🔴 [2026-10-20 成名战规则] 斯福尔扎＝米兰公爵（1515 马里尼亚诺败于弗朗索瓦一世）→ 米兰（LATIN）；帝国时代意大利雇佣军团；立绘留空



        { generalId: 'gen_maximilian_sforza', cityId: 'city_milan', generalName: '斯福尔扎', portrait: '/assets/LATIN/gen_maximilian_sforza.png', legionName: '帝国时代意大利皇家军团', eliteName: '意大利民兵', eliteTier: 4 },







        { generalId: 'lunbadi_alboin', cityId: 'city_milan', generalName: '阿尔博因', portrait: '/assets/LATIN/lunbadi_alboin.png', eliteName: '伦巴第骑兵', eliteTier: 3 },



        // 🔴 [2026-10-20 成名战规则] 提埃波洛＝米兰执政官（1237 科尔特努瓦被腓特烈二世所俘）→ 米兰（LATIN）；城堡×拉丁＝城堡时代意大利城邦军团；立绘留空



        { generalId: 'gen_pietro_tiepolo', cityId: 'city_milan', generalName: '提埃波洛', portrait: '/assets/LATIN/gen_pietro_tiepolo.png', legionName: '城堡时代意大利雇兵军团', eliteName: '意大利民兵', eliteTier: 4 },







        // 🔴 [2026-10-20 成名战规则] 德西德里乌斯＝伦巴第末代国王（773 帕维亚被查理曼围降）→ 米兰·伦巴第；普将；立绘留空







        { generalId: 'lunbadi_desiderius', cityId: 'city_milan', generalName: '德西德里乌斯', portrait: '/assets/LATIN/lunbadi_desiderius.png', eliteName: '意大利民兵', eliteTier: 4 },







        { generalId: 'lunbadi_sforza', factionId: 'lunbadi', cityId: 'city_milan', generalName: '弗朗切斯科斯福尔扎', portrait: '/assets/LATIN/lunbadi_sforza.png', eliteName: '米兰佣兵', eliteTier: 2 },
    ],







    donggete: [
        { generalId: 'gen_theodoric_great', cityId: 'city_ravenna', generalName: '狄奥多里克', portrait: '/assets/GOTHS/gen_theodoric_great.png', eliteName: '东哥特铁骑', eliteTier: 2 },
        // 🔴 [2026-10-25 主人定「B」] 贝里格（Berig，Jordanes《哥特史》记 率哥特人自 Scandza 迁出的王；约 1–2 世纪，史源转述、传说成分）｜势力 东哥特（donggete 时代＝古典）｜据点 维斯比（哥特兰）｜普将（无实胜、无对阵）｜精锐「哥特战团」T4｜立绘留空
        { generalId: 'donggete_berig', factionId: 'donggete', cityId: 'city_weishibi', generalName: '贝里格', portrait: '/assets/VIKINGS/donggete_berig.png', eliteName: '哥特战团', eliteTier: 4 },
        // 🔴 [2026-10-20 主人令「遇到问题先看符合历史，下结论再动手」] 成名战回补安置按史实复核：奥多亚克＝意大利王，都拉文纳，493 年在拉文纳被围杀；美因茨与他无关 → 放拉文纳（donggete，风格 GOTHS）；仍挂本政权 rierman
        // 🔴 [2026-10-24 主人口径「据点、武将、势力、精锐、军团都是一个文化」] 武将文化=GOTHS（拉文纳风格）× 时代 antiquity → 古典时代西哥特军团；不再继承法兰克势力编制
        { generalId: 'rierman_odoacer', cityId: 'city_ravenna', legionName: '古典时代哥特军团', factionId: 'falanji', generalName: '奥多亚克', portrait: '/assets/GOTHS/rierman_odoacer.png', eliteName: '日耳曼佣兵', eliteTier: 4 },
    ],







    xigete: [







        { generalId: 'gen_alfonso_vi', cityId: 'city_toledo', generalName: '阿方索六世', portrait: '/assets/GOTHS/gen_alfonso_vi.png', eliteName: '托莱多骑', eliteTier: 3 },







        // 🔴 [2026-10-20 成名战规则] 罗德里克＝西哥特末代国王（711 瓜达莱特战败溺死）→ 托莱多·西哥特；普将；封建×哥特＝封建时代阿斯图里亚斯军团；立绘留空







        { generalId: 'xigete_roderic', cityId: 'city_toledo', generalName: '罗德里克', portrait: '/assets/GOTHS/xigete_roderic.png', legionName: '封建时代阿斯图里亚斯军团' , eliteName: '西哥特亲兵', eliteTier: 4 },   // 🔴 卡斯蒂骑士是 1085 年阿方索六世的，不是 711 年西哥特的兵







        // 🔴 [2026-10-20 主人令「先定据点建筑风格，再放相同风格的武将」] 叶海亚＝托莱多泰法王（1085 托莱多陷落）→ 托莱多（GOTHS 西哥特风格）；势力仍挂倭马亚（factionId）；军团＝城堡时代伊比利亚军团（GOTHS×城堡）；立绘留空







        { generalId: 'womaya_yahya', cityId: 'city_cordoba', generalName: '卡迪尔', portrait: '/assets/GOTHS/womaya_yahya.png', factionId: 'womaya', legionName: '城堡时代撒拉森军团', eliteName: '阿拉伯步兵', eliteTier: 4 },







    
        { generalId: 'gen_alaric', factionId: 'xigete', cityId: 'city_toledo', legionName: '古典时代意大利亚军团', generalName: '亚拉里克', portrait: '/assets/LATIN/gen_alaric.png', eliteName: '西哥特骑兵', eliteTier: 2 },








    
        { generalId: 'gen_ataulf', legionName: '古典时代哥特军团', factionId: 'xigete', cityId: 'city_nabone', generalName: '阿陶尔夫', portrait: '/assets/GOTHS/gen_ataulf.png', eliteName: '哥特战士', eliteTier: 4 },








    ],






    alagong: [







        { generalId: 'gen_james_i_aragon', cityId: 'city_zaragoza', generalName: '海梅', portrait: '/assets/SPANISH/gen_james_i_aragon.png', eliteName: '阿拉贡骑士', eliteTier: 3 },







        // 🔴 [2026-10-20 主人令「放到离他事发地最近的相同建筑风格文化的据点」] 马尼拉改判 MALAY，西班牙文化的莱加斯皮按规则迁离事发地（马尼拉）最近的 SPANISH 据点＝萨拉戈萨，仍挂本政权 xishudongyin







        { generalId: 'xishudongyin_lijiasipi', factionId: 'kasidiliya', cityId: 'city_seville', legionName: '帝国时代西班牙方阵军团', generalName: '莱加斯皮', portrait: '/assets/SPANISH/xishudongyin_lijiasipi.png', eliteName: '西班牙方阵', eliteTier: 2 },







    
        { generalId: 'gen_el_cid', factionId: 'kasidiliya', cityId: 'city_valencia', generalName: '熙德', portrait: '/assets/SPANISH/gen_el_cid.png', eliteName: '西班牙民兵', eliteTier: 4 },








    
        { generalId: 'gen_eleanor', factionId: 'aboerleiya', eliteName: '岛屿佣兵', eliteTier: 4, cityId: 'city_oristano', legionName: '城堡时代诺曼军团', generalName: '埃莱奥诺拉', portrait: '/assets/SICILIANS/gen_eleanor.png' },







    ],






    xila: [
        { generalId: 'bfe2_conon', cityId: 'city_yadian', generalName: '科农', portrait: '/assets/ATHENIANS/bfe2_conon.png', legionName: '古典时代雅典军团', eliteName: '雅典公民兵', eliteTier: 4 },
        { generalId: 'bfe2_cleon', cityId: 'city_yadian', generalName: '克里昂', portrait: '/assets/ATHENIANS/bfe2_cleon.png', legionName: '古典时代雅典军团', eliteName: '雅典公民兵', eliteTier: 4 },







        { generalId: 'gen_themistocles', cityId: 'city_yadian', generalName: '地米斯托克利', portrait: '/assets/ATHENIANS/gen_themistocles.png', eliteName: '雅典重装兵', eliteTier: 2 },







        // 🔴 [2026-10-20 成名战规则] 米太亚德＝前490 马拉松之战雅典方主将（史有其人，双身份：据点武将＋达提斯成名战敌将）；立绘留空走回落







        { generalId: 'gen_miltiades', cityId: 'city_yadian', generalName: '米太亚德', portrait: '/assets/ATHENIANS/gen_miltiades.png' , eliteName: '雅典重装兵', eliteTier: 2 },   // 🔴 马拉松以雅典重装步兵破波斯轻装（城里原配「萨拉米斯舰」是海军）







        // 公元前323年普拉塔纳斯战役统帅（希腊反马其顿联军统帅莱奥斯塞尼斯）。







        // 🔴 [2026-09-19 主人令「全删除」] 该战役事件已删除；**人物记录保留**。







        // 立绘按铁律留空走回落、待主人亲自放图分配







        { generalId: 'xila_leosthenes', cityId: 'city_yadian', generalName: '莱奥斯塞尼斯', portrait: '/assets/ATHENIANS/xila_leosthenes.png', eliteName: '雅典公民兵', eliteTier: 4 },







        // 公元前322年克兰农战役希腊同盟军总司令（接替阵亡莱奥斯塞尼斯之安提菲洛斯）。







        // 🔴 [2026-09-19 主人令「全删除」] 该战役事件已删除；**人物记录保留**。







        // 立绘按铁律留空走回落、待主人亲自放图分配







        { generalId: 'xila_antiphilus', cityId: 'city_yadian', generalName: '安提菲卢斯', portrait: '/assets/ATHENIANS/xila_antiphilus.png', legionName: '古典时代雅典军团', eliteName: '雅典公民兵', eliteTier: 4 },







    
        { generalId: 'gen_aristides', factionId: 'xila', cityId: 'city_yadian', generalName: '阿里斯提德', portrait: '/assets/ATHENIANS/gen_aristides.png', eliteName: '雅典重装兵', eliteTier: 2 },








    
        { generalId: 'fujisi_fujiweng', factionId: 'xila', cityId: 'city_yadian', legionName: '古典时代雅典军团', generalName: '福基翁', portrait: '/assets/GREECE/fujisi_fujiweng.png', eliteName: '雅典公民兵', eliteTier: 4 },








    
        { generalId: 'gen_chabrias', factionId: 'xila', cityId: 'city_yadian', legionName: '古典时代雅典军团', generalName: '卡布里亚斯', portrait: '/assets/GREECE/gen_chabrias.png', eliteName: '雅典重装兵', eliteTier: 2 },








    ],






    fulandesi: { generalId: 'gen_robert_ii', cityId: 'city_calais', generalName: '罗贝尔二世', portrait: '/assets/FRANKS/gen_robert_ii.png', eliteName: '法兰克民兵', eliteTier: 4 },







    // 大胆查理＝瓦卢瓦勃艮第末代公爵，同属勃艮第公国 → 挂勃艮第公国（与无畏的约翰、好人菲利普同一国）






    bulabante: { generalId: 'bulabante_yuehanyishi', cityId: 'city_bulusaier', generalName: '约翰一世', portrait: '/assets/GERMANIC/bulabante_yuehanyishi.png', legionName: '城堡时代尼德兰军团', eliteName: '勃艮第骑士', eliteTier: 2 },







    gaolu: [
        // 🔴 [2026-10-20 成名战规则] 劳多尼耶＝法国胡格诺首领（1565 卡罗琳堡被杀）→ 巴黎（FRANKS）；帝国时代法兰西军团；立绘留空
        { generalId: 'gen_laudonniere', cityId: 'city_bali', generalName: '劳多尼耶', portrait: '/assets/FRANKS/gen_laudonniere.png', legionName: '帝国时代法兰西军团', eliteName: '法兰克民兵', eliteTier: 4 },







        { generalId: 'gen_charles_vii', cityId: 'city_bali', generalName: '查理七世', portrait: '/assets/FRANKS/gen_charles_vii.png', eliteName: '法兰克民兵', eliteTier: 4 },



        // 🔴 [2026-10-20 成名战规则] 路易十一＝法国国王（1465 蒙特莱里与大胆查理交战）→ 巴黎（FRANKS）；城堡时代法兰西骑士军团；立绘留空



        { generalId: 'gen_louis_xi', cityId: 'city_bali', generalName: '路易十一', portrait: '/assets/FRANKS/gen_louis_xi.png', legionName: '城堡时代法兰西骑士军团', eliteName: '法兰西骑士', eliteTier: 3 },



        // 🔴 [2026-10-20 成名战规则] 布锡考特＝法国元帅（1415 阿金库尔被俘）→ 巴黎（FRANKS）；城堡时代法兰西骑士军团；立绘留空



        { generalId: 'gen_boucicaut', cityId: 'city_bali', generalName: '布锡考特', portrait: '/assets/FRANKS/gen_boucicaut.png', legionName: '城堡时代法兰西骑士军团', eliteName: '法兰西骑士', eliteTier: 3 },







        // 🔴 [2026-10-20 成名战规则] 约翰二世＝法兰西瓦卢瓦王朝国王（1356 普瓦捷被黑太子击败被俘）→ 巴黎·法兰西；普将；封建×法兰克＝封建时代法兰克军团；立绘留空







        { generalId: 'gaolu_john_ii', cityId: 'city_bali', legionName: '城堡时代法兰西骑士军团', generalName: '约翰二世', portrait: '/assets/FRANKS/gaolu_john_ii.png', eliteName: '法兰克民兵', eliteTier: 4 },







    
        { generalId: 'gen_raymond_v', factionId: 'gaolu', cityId: 'city_toulouse', generalName: '雷蒙五世', portrait: '/assets/FRANKS/gen_raymond_v.png', eliteName: '法兰克民兵', eliteTier: 4 },








    
        { generalId: 'gen_francis_i', legionName: '帝国时代法兰西军团', factionId: 'gaolu', cityId: 'city_chambord', generalName: '弗朗索瓦', portrait: '/assets/FRANKS/gen_francis_i.png', eliteName: '法兰西骑士', eliteTier: 3 },








    
        { generalId: 'gen_joanofarc', factionId: 'gaolu', cityId: 'city_chambord', generalName: '贞德', portrait: '/assets/FRANKS/gen_joanofarc.png', eliteName: '圣女卫队', eliteTier: 2 },








        { generalId: 'gaolu_conqueror', factionId: 'gaolu', cityId: 'city_calais', generalName: '征服者威廉', portrait: '/assets/FRANKS/gaolu_conqueror.png', eliteName: '诺曼骑士', eliteTier: 1 },
        { generalId: 'gaolu_roland', factionId: 'gaolu', cityId: 'city_oushi', generalName: '罗兰', portrait: '/assets/FRANKS/gaolu_roland.png', eliteName: '法兰克卫队', eliteTier: 3 },
        { generalId: 'gaolu_reynald', factionId: 'gaolu', cityId: 'city_avignon', generalName: '沙蒂永的雷纳德', portrait: '/assets/FRANKS/gaolu_reynald.png', eliteName: '法兰克骑士', eliteTier: 3 },
        { generalId: 'gaolu_lahire', factionId: 'gaolu', cityId: 'city_lansi', generalName: '拉海尔', portrait: '/assets/FRANKS/gaolu_lahire.png', eliteName: '法兰克骑兵', eliteTier: 3 },
        { generalId: 'gaolu_alencon', factionId: 'gaolu', cityId: 'city_lansi', generalName: '阿朗松公爵', portrait: '/assets/FRANKS/gaolu_alencon.png', eliteName: '法兰克骑兵', eliteTier: 3 },
        { generalId: 'gaolu_bertrand', factionId: 'gaolu', cityId: 'city_bordeaux', generalName: '伯特兰爵士', portrait: '/assets/FRANKS/gaolu_bertrand.png', eliteName: '法兰克弓手', eliteTier: 4 },
        { generalId: 'gaolu_demetz', factionId: 'gaolu', cityId: 'city_lansi', generalName: '德梅斯爵士', portrait: '/assets/FRANKS/gaolu_demetz.png', eliteName: '法兰克骑士', eliteTier: 4 },
        { generalId: 'gaolu_josselyne', factionId: 'gaolu', cityId: 'city_lansi', generalName: '盖佐斯尔立', portrait: '/assets/FRANKS/gaolu_josselyne.png', eliteName: '法兰克侍从', eliteTier: 4 },
        { generalId: 'gaolu_graville', factionId: 'gaolu', cityId: 'city_lansi', generalName: '格拉维尔领主', portrait: '/assets/FRANKS/gaolu_graville.png', eliteName: '法兰克弓手', eliteTier: 4 },
        { generalId: 'gaolu_richemont', factionId: 'gaolu', cityId: 'city_lansi', generalName: '理察蒙', portrait: '/assets/FRANKS/gaolu_richemont.png', eliteName: '布列塔尼兵', eliteTier: 3 },
        { generalId: 'gaolu_bureau', factionId: 'gaolu', cityId: 'city_bali', generalName: '让彼罗', portrait: '/assets/FRANKS/gaolu_bureau.png', eliteName: '法兰西炮队', eliteTier: 2 },
        { generalId: 'gaolu_lorrain', factionId: 'gaolu', cityId: 'city_bali', generalName: '让德洛兰', portrait: '/assets/FRANKS/gaolu_lorrain.png', eliteName: '攻城工匠', eliteTier: 4 },
        { generalId: 'gaolu_jeannehachette', factionId: 'gaolu', cityId: 'city_bali', generalName: '让娜阿谢', portrait: '/assets/FRANKS/gaolu_jeannehachette.png', eliteName: '博韦民兵', eliteTier: 4 },
    ],







    kaernute: { generalId: 'gen_kaernute_kotuatousi', cityId: 'city_shatteer', generalName: '科图阿图斯', portrait: '/assets/FRANKS/gen_kaernute_kotuatousi.png', eliteName: '法兰克民兵', eliteTier: 4 },






    yinggelan: [
        // 🔴 [2026-10-24 主人令] 弗农＝英国海军上将（1741 卡塔赫纳围攻指挥官）；城库无牙买加/皇家港，
        //    按「无合适据点取离战场最近的同风格城」改挂新阿姆斯特丹（SAXONS，3375km；比温彻斯特 8420km 近）；军团不变。
        // 🔴 [2026-10-25 主人令「全面修复」] 弗农＝英国海军上将，原挂新阿姆斯特丹（日耳曼文化）与本人文化不符；
        //    按「无合适据点取离事发地（卡塔赫纳）最近的同风格城」改挂坎佩尔（BRITONS，7769km，最近的同文化城）。
        { generalId: 'gen_vernon', cityId: 'city_kanpeier', generalName: '弗农', portrait: '/assets/SAXONS/gen_vernon.png', eliteName: '英格兰骑士', eliteTier: 3 },







        { generalId: 'gen_henry_v', cityId: 'city_winchester', generalName: '亨利五世', portrait: '/assets/SAXONS/gen_henry_v.png', eliteName: '英格兰长弓', eliteTier: 1 },



        // 🔴 [2026-10-20 成名战规则] 萨福克伯爵＝1429 奥尔良围城英军指挥（后被俘）→ 温彻斯特（SAXONS）；城堡时代易北河军团；立绘留空



        { generalId: 'gen_suffolk', cityId: 'city_winchester', generalName: '萨福克伯爵', portrait: '/assets/SAXONS/gen_suffolk.png', eliteName: '英格兰骑士', eliteTier: 3 },







        // 🔴 [2026-10-20 成名战规则] 瓦伦＝英格兰驻苏格兰统帅（1297 斯特灵桥被华莱士击败）→ 伦敦·英格兰；普将；封建×萨克森＝封建时代奥斯特法伦军团；立绘留空







        { generalId: 'yinggelan_warenne', cityId: 'city_lundun', generalName: '瓦伦', portrait: '/assets/SAXONS/yinggelan_warenne.png', eliteName: '英格兰民兵', eliteTier: 4 },







    
        { generalId: 'gen_alfred_great', factionId: 'yinggelan', cityId: 'city_winchester', generalName: '阿尔弗雷德', portrait: '/assets/SAXONS/gen_alfred_great.png', eliteName: '韦塞克斯兵', eliteTier: 3 },







    
        { generalId: 'gen_edward_longshanks', legionName: '城堡时代英格兰军团', factionId: 'yinggelan', cityId: 'city_kanafeng', generalName: '长腿爱德华', portrait: '/assets/BRITONS/gen_edward_longshanks.png', eliteName: '威尔士长弓', eliteTier: 2 },







    
        { generalId: 'gen_gilbert', legionName: '城堡时代英格兰军团', factionId: 'yinggelan', cityId: 'city_geluosite', generalName: '吉尔伯特', portrait: '/assets/BRITONS/gen_gilbert.png', eliteName: '英格兰民兵', eliteTier: 4 },







        { generalId: 'yinggelan_lionheart', factionId: 'yinggelan', cityId: 'city_lundun', generalName: '狮心王理查', portrait: '/assets/BRITONS/yinggelan_lionheart.png', eliteName: '狮心卫队', eliteTier: 2 },
        { generalId: 'yinggelan_henryii', factionId: 'yinggelan', cityId: 'city_lundun', generalName: '英格兰亨利二世', portrait: '/assets/BRITONS/yinggelan_henryii.png', eliteName: '英格兰骑士', eliteTier: 3 },
        { generalId: 'yinggelan_clare', factionId: 'yinggelan', cityId: 'city_kanafeng', generalName: '理查德克莱尔', portrait: '/assets/BRITONS/yinggelan_clare.png', eliteName: '威尔士弓手', eliteTier: 3 },
        { generalId: 'yinggelan_fastolf', factionId: 'yinggelan', cityId: 'city_lundun', generalName: '约翰法斯托夫', portrait: '/assets/BRITONS/yinggelan_fastolf.png', eliteName: '东盎弓手', eliteTier: 4 },
        { generalId: 'yinggelan_lancelot', factionId: 'yinggelan', cityId: 'city_winchester', generalName: '兰斯洛特', portrait: '/assets/BRITONS/yinggelan_lancelot.png', eliteName: '圆桌骑士', eliteTier: 4 },
        { generalId: 'yinggelan_gawain', factionId: 'yinggelan', cityId: 'city_geluosite', generalName: '高文爵士', portrait: '/assets/BRITONS/yinggelan_gawain.png', eliteName: '圆桌骑士', eliteTier: 4 },
        { generalId: 'yinggelan_tristan', factionId: 'yinggelan', cityId: 'city_norwich', generalName: '崔士坦爵士', portrait: '/assets/BRITONS/yinggelan_tristan.png', eliteName: '圆桌骑士', eliteTier: 4 },
        { generalId: 'yinggelan_robinhood', factionId: 'yinggelan', cityId: 'city_norwich', generalName: '罗宾汉', portrait: '/assets/BRITONS/yinggelan_robinhood.png', eliteName: '绿林弓手', eliteTier: 4 },
        { generalId: 'yinggelan_littlejohn', factionId: 'yinggelan', cityId: 'city_norwich', generalName: '小约翰', portrait: '/assets/BRITONS/yinggelan_littlejohn.png', eliteName: '绿林棍手', eliteTier: 4 },
        { generalId: 'yinggelan_nottingham', factionId: 'yinggelan', cityId: 'city_norwich', generalName: '诺丁安的郡长', portrait: '/assets/BRITONS/yinggelan_nottingham.png', eliteName: '郡守卫队', eliteTier: 4 },
        { generalId: 'yinggelan_friartuck', factionId: 'yinggelan', cityId: 'city_norwich', generalName: '塔克修士', portrait: '/assets/BRITONS/yinggelan_friartuck.png', eliteName: '修士卫队', eliteTier: 4 },
        { generalId: 'yinggelan_aethelfrith', factionId: 'yinggelan', cityId: 'city_bulunruike', generalName: '艾特尔弗里思', portrait: '/assets/SAXONS/yinggelan_aethelfrith.png', eliteName: '诺森卫队', eliteTier: 4 },
        { generalId: 'yinggelan_tostig', factionId: 'yinggelan', cityId: 'city_magedebao', generalName: '托斯蒂格', portrait: '/assets/SAXONS/yinggelan_tostig.png', eliteName: '诺森斧兵', eliteTier: 4 },
        { generalId: 'gen_black_prince', factionId: 'yinggelan', cityId: 'city_lundun', generalName: '黑太子', portrait: '/assets/FRANKS/gen_black_prince.png', eliteName: '英格兰长弓', eliteTier: 1 },
    ],







    piketai: [
        { generalId: 'gen_onuist_i', cityId: 'city_aidingbao', generalName: '奥恩格斯', portrait: '/assets/CELTS/gen_onuist_i.png', eliteName: '凯尔特战团', eliteTier: 3 },
        // 🔴 [2026-10-25 主人令「存在就建」] 卡尔加库斯（Calgacus，83/84 蒙斯格劳庇乌斯战役，喀里多尼亚抗罗马联军领袖，塔西佗《阿古利可拉传》）；势力 皮克特；据点 斯昆（皮克特/阿尔巴王都，距喀里多尼亚核心 73km，同文化最近）；普将（战败，实胜闸不过）；精锐「皮克特战团」T4；立绘留空
        { generalId: 'piketai_calgacus', factionId: 'piketai', cityId: 'city_scone', generalName: '卡尔加库斯', portrait: '/assets/CELTS/piketai_calgacus.png', eliteName: '皮克特战团', eliteTier: 4 },
    ],






    mangsite: { generalId: 'mangsite_bulaienbolu', cityId: 'city_kasheer', generalName: '布赖恩博鲁', portrait: '/assets/CELTS/mangsite_bulaienbolu.png', eliteName: '爱尔兰斧兵', eliteTier: 3 },







    tuomengde: { generalId: 'tuomengde_aobulaien', cityId: 'city_limerick', generalName: '奥布赖恩', portrait: '/assets/CELTS/tuomengde_aobulaien.png', eliteName: '凯尔特兵', eliteTier: 4 },







    bulietani: [








        { generalId: 'gen_alain_i', cityId: 'city_rennes', generalName: '阿兰', portrait: '/assets/BRITONS/gen_alain_i.png', eliteName: '英格兰民兵', eliteTier: 4 },
        { generalId: 'gen_gilles_de_rais', legionName: '城堡时代法兰西骑士军团', factionId: 'bulietani', cityId: 'city_nantes', generalName: '吉尔德雷斯', portrait: '/assets/FRANKS/gen_gilles_de_rais.png', eliteName: '法兰克民兵', eliteTier: 4 },








    ],







    saierweiya: [



        { generalId: 'gen_stefan_dusan', eliteName: '杜尚兵团', eliteTier: 2, cityId: 'city_skopje', generalName: '斯蒂芬杜尚', portrait: '/assets/SLAVIC/saierweiya_sidifendushang.png' },



        // 🔴 [2026-10-20 成名战规则] 武卡辛＝塞尔维亚领主（1371 马里查战役与弟乌格列沙一同战死）→ 普里莱普无据点，取最近同风格据点贝尔格莱德（SLAVIC）；城堡×斯拉夫＝城堡时代博亚尔重骑军团；立绘留空



        { generalId: 'gen_vukasin', eliteName: '普里莱普军', eliteTier: 3, cityId: 'city_prilep', generalName: '武卡辛', portrait: '/assets/SLAVIC/gen_vukasin.png', legionName: '城堡时代博亚尔军团' }, // 普里莱普领主本部



    
        { generalId: 'gen_carpini', legionName: '城堡时代意大利雇兵军团', factionId: 'saierweiya', cityId: 'city_antiwali', generalName: '柏朗嘉宾', portrait: '/assets/LATIN/zeta_bolangjiabin.png', eliteName: '意大利民兵', eliteTier: 4 },








    ],















    luoma_diguo: [
        // 🔴 [2026-10-25 补B] 维特里乌斯（Vetilius，前 2 世纪罗马将领；前 147 被维里亚图斯伏击杀）｜势力 罗马帝国｜据点 罗马城（ROMA 文化）｜普将（实败）｜精锐「罗马军团兵」T4｜立绘留空
        { generalId: 'bfe_vetilius', factionId: 'luoma_diguo', cityId: 'city_luoma', generalName: '维特里乌斯', portrait: '/assets/ROMA/bfe_vetilius.png', eliteName: '罗马军团兵', eliteTier: 4 },
        { generalId: 'bfe3_4', cityId: 'city_luoma', generalName: '拉维利乌斯', portrait: '/assets/ROMA/bfe3_4.png', legionName: '古典时代罗马军团', eliteName: '罗马军团兵', eliteTier: 4 },
        { generalId: 'bfe3_63', cityId: 'city_luoma', generalName: '霍尔多尼乌斯', portrait: '/assets/ROMA/bfe3_63.png', legionName: '古典时代罗马军团', eliteName: '罗马军团兵', eliteTier: 4 },
        { generalId: 'bfe3_51', cityId: 'city_luoma', generalName: '佩特罗尼乌斯', portrait: '/assets/ROMA/bfe3_51.png', legionName: '古典时代罗马军团', eliteName: '罗马军团兵', eliteTier: 4 },
        { generalId: 'bfe_gaius_livius', cityId: 'city_luoma', generalName: '李维乌斯', portrait: '/assets/ROMA/bfe_gaius_livius.png', legionName: '古典时代罗马军团', eliteName: '罗马军团兵', eliteTier: 4 },







        { generalId: 'gen_julius_caesar', cityId: 'city_luoma', generalName: '恺撒', portrait: '/assets/ROMA/gen_julius_caesar.png', eliteName: '罗马军团', eliteTier: 1 },







        // 2026-10-20 主人令「有名字的武将都要安置在据点」：坎尼战役两位罗马执政官 + 末代名将埃提乌斯 → 罗马城；ROMA×古典＝罗马军团







        { generalId: 'baolusi', cityId: 'city_luoma', generalName: '保卢斯', portrait: '/assets/ROMA/baolusi.png', legionName: '古典时代罗马军团' , eliteName: '罗马骑士', eliteTier: 3},







        { generalId: 'waluo', cityId: 'city_luoma', generalName: '瓦罗', portrait: '/assets/ROMA/waluo.png', legionName: '古典时代罗马军团' , eliteName: '同盟骑兵', eliteTier: 4},







        { generalId: 'aitiliusi', cityId: 'city_luoma', generalName: '埃提乌斯', portrait: '/assets/ROMA/aitiliusi.png', legionName: '古典时代罗马军团' , eliteName: '罗马野战军', eliteTier: 2},







        // 🔴 [2026-10-20 成名战规则] 教皇利奥九世＝1053 奇维塔特之战教皇联军主帅（被诺曼人击败被俘）→ 罗马城·罗马帝国（教皇国无独立势力，挂该城势力，报告）；普将；封建×罗马＝封建时代拉丁姆军团；立绘留空







        { generalId: 'luoma_diguo_leo_ix', factionId: 'jiaohuangguo', cityId: 'city_luoma', legionName: '城堡时代罗马教廷军团', generalName: '利奥九世', portrait: '/assets/ROMA/luoma_diguo_leo_ix.png', eliteName: '圣彼得卫队', eliteTier: 4 },   // 按史：教皇直属「milites beati Petri」，1053 奇维塔泰之战教皇军（普将 T4）,







        // 🔴 [2026-10-20 成名战规则] 西阿格里乌斯＝苏瓦松罗马残部首领（486 苏瓦松之战被克洛维击败）→ 罗马城·罗马帝国；普将；立绘留空







        { generalId: 'luoma_xiageliwusi', cityId: 'city_bali', generalName: '西阿格里乌斯', portrait: '/assets/ROMA/luoma_xiageliwusi.png', legionName: '古典时代高卢军团' , eliteName: '苏瓦松边军', eliteTier: 4 },   // 🔴 486 高卢罗马残部的晚期边军（原配「罗马军团」是帝国早期军团）







        // 2026-10-20 主人令「触发历史剧本时作为剧本出现，不触发时作为武将」：三位罗马皇帝落罗马城







        { generalId: 'bfe3_77', cityId: 'city_luoma', generalName: '瓦勒良', portrait: '/assets/ROMA/bfe3_77.png', legionName: '古典时代罗马军团' , eliteName: '帕提卡', eliteTier: 3},







        { generalId: 'bfe3_79', cityId: 'city_luoma', generalName: '奥勒良', portrait: '/assets/ROMA/bfe3_79.png', legionName: '古典时代罗马军团' , eliteName: '达马提亚骑', eliteTier: 2},







        { generalId: 'bfe3_81', cityId: 'city_luoma', generalName: '马克森提乌斯', portrait: '/assets/ROMA/bfe3_81.png', legionName: '古典时代罗马军团' , eliteName: '罗马禁卫军', eliteTier: 2},







        // 名将双身份：霍诺留（据点武将＋剧本敌将）







        { generalId: 'bfe3_91', cityId: 'city_luoma', generalName: '霍诺留', portrait: '/assets/ROMA/bfe3_91.png', legionName: '古典时代罗马军团' , eliteName: '西罗马卫军', eliteTier: 4},







    
        { generalId: 'gen_clovis_i', legionName: '封建时代法兰克军团', factionId: 'falanji', cityId: 'city_bali', generalName: '克洛维', portrait: '/assets/FRANKS/gen_clovis_i.png', eliteName: '法兰克战团', eliteTier: 2 },
        { generalId: 'bfe3_46', factionId: 'gaolu', cityId: 'city_bali', generalName: '维钦托利', portrait: '/assets/FRANKS/bfe3_46.png', legionName: '古典时代高卢军团' , eliteName: '高卢战团', eliteTier: 3},
















    
        { generalId: 'gen_constantine_great', legionName: '古典时代罗马军团', factionId: 'luoma_diguo', cityId: 'city_teerier', generalName: '君士坦丁', portrait: '/assets/LATIN/gen_constantine_great.png', eliteName: '罗马重步', eliteTier: 3 },
















    
        { generalId: 'gen_julian_apostate', factionId: 'luoma_diguo', cityId: 'city_lyon', legionName: '古典时代罗马军团', generalName: '尤里安', portrait: '/assets/GERMANIC/aersasi_youlian.png', eliteName: '罗马重步', eliteTier: 3 },
















    
        { generalId: 'gen_bonifatius', cityId: 'city_xibo', generalName: '博尼法提乌斯', portrait: '/assets/ROMA/wangdaer_bonifatiwusi.png', factionId: 'luoma_diguo', eliteName: '罗马军团兵', eliteTier: 4 },
















    
        { generalId: 'disidelusi_disidelusi', factionId: 'luoma_diguo', cityId: 'city_jiemu', generalName: '蒂斯德鲁斯督造', portrait: '/assets/ROMA/disidelusi_disidelusi.png', eliteName: '罗马军团兵', eliteTier: 4 },
















    
        { generalId: 'qiliqiya_pangpei', legionName: '古典时代近东军团', factionId: 'luoma_diguo', cityId: 'city_adana', generalName: '庞培', portrait: '/assets/ORIE/qiliqiya_pangpei.png', eliteName: '罗马军团', eliteTier: 1 },
















    
        { generalId: 'meisuobudamiya_shoujiang', legionName: '古典时代近东军团', factionId: 'luoma_diguo', cityId: 'city_nixibisi', generalName: '萨宾', portrait: '/assets/ORIE/meisuobudamiya_shoujiang.png', eliteName: '阿拉伯步兵', eliteTier: 4 },
















        { generalId: 'bfe_crassus', factionId: 'luoma_diguo', cityId: 'city_luoma', generalName: '克拉苏', portrait: '/assets/ROMA/bfe_crassus.png', eliteName: '高卢骑兵', eliteTier: 3 },
    ],







    xiongren: [
        { generalId: 'xiongren_atila', cityId: 'city_saigede', generalName: '阿提拉', portrait: '/assets/HUNS/xiongren_atila.png', eliteName: '匈人铁骑', eliteTier: 1 },
        { generalId: 'xiongren_bleda', factionId: 'xiongren', cityId: 'city_saigede', generalName: '布莱达', portrait: '/assets/HUNS/xiongren_bleda.png', eliteName: '匈人骑射', eliteTier: 3 },
    ],






    putaoya: [








        { generalId: 'gen_afonso_henriques', eliteName: '奥利克军', eliteTier: 2, cityId: 'city_coimbra', generalName: '阿方索一世', portrait: '/assets/PORTUGUESE/gen_afonso_henriques.png' }, // 1139 奥利克战役葡萄牙本部
        { generalId: 'gen_henry_navigator', factionId: 'putaoya', cityId: 'city_lisiben', generalName: '恩里克', portrait: '/assets/PORTUGUESE/gen_henry_navigator.png', eliteName: '葡萄牙兵', eliteTier: 4 },








    
        { generalId: 'duluo_sangqiao', factionId: 'putaoya', cityId: 'city_boertu', generalName: '桑乔一世', portrait: '/assets/PORTUGUESE/duluo_sangqiao.png', eliteName: '葡萄牙兵', eliteTier: 4 },








    
        { generalId: 'gen_joao_i', factionId: 'putaoya', cityId: 'city_lisiben', generalName: '若昂一世', portrait: '/assets/PORTUGUESE/gen_joao_i.png', eliteName: '葡萄牙骑士', eliteTier: 3 },







        { generalId: 'mozambique_ataide', generalName: '阿泰德', cityId: 'city_mozambique', factionId: 'putaoya', eliteName: '莫桑比克兵', eliteTier: 4, portrait: '/assets/PORTUGUESE/putaoya_ataide.png' },
        { generalId: 'luanda_novais', generalName: '诺瓦伊斯', cityId: 'city_luanda', factionId: 'putaoya', eliteName: '黑战军', eliteTier: 4, portrait: '/assets/PORTUGUESE/putaoya_nuowayisi.png' },
        // 🔴 [2026-10-24 险要补将·镇守] 阿方索＝布拉干萨公爵（若昂一世之子），以布拉干萨城堡为世袭驻守根基；普将；精锐「葡萄牙卫队」T4
        { generalId: 'putaoya_afonso', generalName: '阿方索', factionId: 'putaoya', cityId: 'city_braganca', portrait: '/assets/PORTUGUESE/putaoya_afangsuo.png', eliteName: '葡萄牙卫队', eliteTier: 4 },
    ],















    habusibao: [
        // 🔴 [2026-10-25 补B] 欧根亲王（1663–1736，哈布斯堡名将；1697 曾塔大捷）｜势力 哈布斯堡｜据点 塞格德（HUNS 文化，多瑙河）｜名将｜精锐「帝国胸甲骑」T1｜立绘留空｜成名战待补
        { generalId: 'habusibao_eugene', factionId: 'habusibao', cityId: 'city_saigede', generalName: '欧根亲王', portrait: '/assets/HUNS/habusibao_eugene.png', eliteName: '帝国胸甲骑', eliteTier: 1 },
        { generalId: 'gen_maximilian', cityId: 'city_weiyeena', generalName: '马克西米', portrait: '/assets/GERMANIC/habusibao_makeximi.png', eliteName: '日耳曼民兵', eliteTier: 4 },
        { generalId: 'bfe_frederick_iii', factionId: 'habusibao', cityId: 'city_weiyeena', generalName: '腓特烈三世', portrait: '/assets/GERMANIC/bfe_frederick_iii.png', eliteName: '帝国骑士', eliteTier: 4 },
    ],







    boximiya: [
        // 🔴 [2026-10-25 补B] 曼斯菲尔德（1580–1626，新教雇佣军统帅；1626 德绍桥败于华伦斯坦）｜势力 波西米亚｜据点 布拉格（BOHEMIANS 文化）｜普将｜精锐「新教雇佣兵」T4｜立绘留空
        { generalId: 'bfe_mansfeld', factionId: 'boximiya', cityId: 'city_bulage', generalName: '曼斯菲尔德', portrait: '/assets/BOHEMIANS/bfe_mansfeld.png', eliteName: '新教雇佣兵', eliteTier: 4 },
        // 🔴 [2026-10-25 补A] 华伦斯坦（1583–1634，三十年战争帝国军统帅；1626 德绍桥胜）｜势力 波西米亚｜据点 布拉格（BOHEMIANS 文化）｜名将｜精锐「华伦斯坦军」T1｜立绘留空｜成名战待补
        { generalId: 'boximiya_wallenstein', factionId: 'boximiya', cityId: 'city_bulage', generalName: '华伦斯坦', portrait: '/assets/BOHEMIANS/boximiya_wallenstein.png', eliteName: '华伦斯坦军', eliteTier: 1 },








        { generalId: 'gen_jan_zizka', cityId: 'city_bulage', generalName: '扬杰式卡', portrait: '/assets/BOHEMIANS/gen_jan_zizka.png', eliteName: '胡斯战车', eliteTier: 1 },
        { generalId: 'gen_swatopluk', cityId: 'city_aoermuci', legionName: '封建时代波希米亚军团', generalName: '斯瓦托', portrait: '/assets/BOHEMIANS/gen_swatopluk.png', factionId: 'damolaweiya', eliteName: '摩拉维亚骑', eliteTier: 3 },








    ],







    mazhaer: [
        // 🔴 [2026-10-20 主人令「名将剧情要写最知名战役」] 拉约什二世＝匈牙利国王（1526 莫哈奇战死）→ 布达佩斯（MAGYAR）；帝国时代骠骑先锋军团；立绘留空
        { generalId: 'gen_lajos_ii', cityId: 'city_budapeisi', generalName: '拉约什二世', portrait: '/assets/MAGYAR/gen_lajos_ii.png', legionName: '帝国时代骠骑先锋军团', eliteName: '匈牙利黑军', eliteTier: 2 },







        { generalId: 'mazhaer_majiashi', cityId: 'city_budapeisi', generalName: '马加什一世', portrait: '/assets/MAGYAR/mazhaer_majiashi.png', eliteName: '匈牙利黑军', eliteTier: 2 },







        // 🔴 [2026-10-20 成名战规则] 贝拉四世＝匈牙利王（1241 赛约河败于拔都，后重建王国）→ 布达佩斯·匈牙利；普将；封建×马扎尔＝封建时代马扎尔军团；立绘留空







        { generalId: 'mazhaer_bela_iv', cityId: 'city_budapeisi', legionName: '城堡时代匈牙利王国军团', generalName: '贝拉四世', portrait: '/assets/MAGYAR/mazhaer_bela_iv.png', eliteName: '马扎尔骑手', eliteTier: 4 },







        // 🔴 [2026-10-20 成名战规则] 查理一世＝匈牙利安茹王朝国王（1330 波萨达被巴萨拉布击败）→ 布达佩斯·匈牙利；普将；城堡×马扎尔＝城堡时代匈牙利王国军团；立绘留空







        { generalId: 'mazhaer_charles_i', cityId: 'city_budapeisi', legionName: '城堡时代匈牙利王国军团', generalName: '查理一世', portrait: '/assets/MAGYAR/mazhaer_charles_i.png', eliteName: '马扎尔骑手', eliteTier: 4 },







    
        { generalId: 'shaiyue_aerpade', factionId: 'mazhaer', cityId: 'city_budapeisi', legionName: '封建时代马扎尔军团', generalName: '阿尔帕德', portrait: '/assets/SLAVIC/shaiyue_aerpade.png', eliteName: '马扎尔骑手', eliteTier: 4 },








    
        { generalId: 'xiongyati_yannuoshi', factionId: 'mazhaer', cityId: 'city_belgrade', generalName: '匈雅提亚诺什', portrait: '/assets/MAGYAR/xiongyati_yannuoshi.png', eliteName: '匈牙利黑军', eliteTier: 2 },








        { generalId: 'bfe_bulcsu', factionId: 'mazhaer', cityId: 'city_budapeisi', generalName: '布尔丘', portrait: '/assets/MAGYAR/bfe_bulcsu.png', eliteName: '马扎尔骑射', eliteTier: 3 },
        { generalId: 'mazhaer_toldi', factionId: 'mazhaer', cityId: 'city_budapeisi', generalName: '米克罗斯陶笛', portrait: '/assets/MAGYAR/mazhaer_toldi.png', eliteName: '马扎尔骠骑', eliteTier: 3 },
    ],






    falanji: [







        { generalId: 'gen_charles_martel', cityId: 'city_kelong', generalName: '查理马特', portrait: '/assets/FRANKS/gen_charles_martel.png', eliteName: '法兰克重骑', eliteTier: 2 },














        // 🔴 [2026-10-20 成名战规则] 鲍德温一世＝第四次十字军首领、拉丁帝国皇帝（1205 阿德里安堡被卡洛扬击败被俘）→ 科隆·法兰克（拉丁帝国无独立势力，挂法兰克并报告）；名将；立绘留空







        { generalId: 'falanji_baodewen', cityId: 'city_bali', legionName: '城堡时代法兰西骑士军团', generalName: '鲍德温九世', portrait: '/assets/FRANKS/falanji_baodewen.png', eliteName: '圣殿骑士', eliteTier: 2 },







        // 🔴 [2026-10-20 主人令「放到离他事发地最近的相同建筑风格文化的据点」「所有武将都这么处理，不要擅自添加据点」] 事发地＝沃林根战役（科隆） → 最近同风格据点科隆







        // 🔴 [2026-10-20 成名战规则] 西格弗里德＝科隆大主教（1288 沃林根战役联军主帅，败于布拉班特公爵约翰一世）→ 科隆；普将；封建×法兰克＝封建时代法兰克军团；立绘留空







        { generalId: 'hre_siegfried', factionId: 'koln', cityId: 'city_kelong', legionName: '城堡时代法兰西骑士军团', generalName: '西格弗里德', portrait: '/assets/FRANKS/hre_siegfried.png', eliteName: '法兰克民兵', eliteTier: 4 },   // 🔴 [2026-10-28 主人批立] 西格弗里德＝科隆大主教（1288 沃林根战败）；势力按其历史政权「科隆大主教区」（主人定：武将历史是哪个政权就是哪个势力）；军团仍城堡×法兰西格（与文化同条）







    
        { generalId: 'bfe3_86', cityId: 'city_meiyinci', generalName: '克诺多马尔', portrait: '/assets/GERMANIC/bfe3_86.png', factionId: 'falanji', legionName: '古典时代日耳曼尼亚军团', eliteName: '日耳曼民兵', eliteTier: 4 },
        { generalId: 'gen_otto_great', factionId: 'falanji', cityId: 'city_magedebao', generalName: '奥托一世', portrait: '/assets/GERMANIC/rierman_aotuoyishi.png', eliteName: '萨克森重骑', eliteTier: 2 },








    
        { generalId: 'gen_charlemagne', factionId: 'falanji', cityId: 'city_yachen', generalName: '查理曼', portrait: '/assets/FRANKS/gen_charlemagne.png', eliteName: '加洛林铁骑', eliteTier: 1 },








    ],






    shiwaben: [
        { generalId: 'gen_ulrich_augsburg', cityId: 'city_aogesibao', generalName: '乌尔里希', portrait: '/assets/GERMANIC/shiwaben_shengwuerlixi.png', eliteName: '日耳曼民兵', eliteTier: 4 },
        { generalId: 'shiwaben_barbarossa', factionId: 'shiwaben', cityId: 'city_aogesibao', generalName: '腓特烈巴巴罗萨', portrait: '/assets/GERMANIC/shiwaben_barbarossa.png', eliteName: '施瓦本骑士', eliteTier: 2 },
    ],







    asikanani: { generalId: 'gen_albrecht_bear', cityId: 'city_bolandengbao', generalName: '阿尔布雷', portrait: '/assets/GERMANIC/asikanani_aerbulei.png', eliteName: '日耳曼民兵', eliteTier: 4 },







    xinbuli: [
        // 🔴 [2026-10-25 主人令「存在就建」] 波伊奥里克斯（Boiorix，辛布里王，前 101 韦尔切利战死；辛布里战争）｜势力 辛布里｜据点 耶灵（日德兰中部，辛布里起源最近同文化据点）｜普将（存疑）｜精锐「辛布里战团」T4｜立绘留空
        { generalId: 'xinbuli_boiorix', factionId: 'xinbuli', cityId: 'city_jelling', generalName: '波伊奥里克斯', portrait: '/assets/DANES/xinbuli_boiorix.png', eliteName: '辛布里战团', eliteTier: 4 },
    ],
    awaer: [
        // 🔴 [2026-10-25 主人令「按区域代表补四时代」] 巴彦（阿瓦尔可汗，562–602，攻西尔米乌姆、626 围君士坦丁堡）｜势力 阿瓦尔｜据点 塞格德（潘诺尼亚，匈人文化城）｜普将（有胜有败，存疑）｜精锐「阿瓦尔骑队」T4｜立绘留空
        { generalId: 'awaer_bayan', factionId: 'awaer', cityId: 'city_saigede', generalName: '巴彦', portrait: '/assets/HUNS/awaer_bayan.png', eliteName: '阿瓦尔骑队', eliteTier: 4 },
    ],
    yidali_wangguo: [
        // 🔴 [2026-10-25 补A] 加里波第（1807–1882，意大利统一名将；1860 千人远征、1862/1867 攻罗马）｜势力 意大利王国｜据点 罗马城（ROMA 文化）｜名将｜精锐「红衫军」T1｜立绘留空｜成名战待补
        { generalId: 'yidali_wangguo_garibaldi', factionId: 'yidali_wangguo', cityId: 'city_luoma', generalName: '加里波第', portrait: '/assets/ROMA/yidali_wangguo_garibaldi.png', eliteName: '红衫军', eliteTier: 1 },
    ],
    luxitaniya: [
        // 🔴 [2026-10-25 补A] 维里亚图斯（约前 180–前 139，卢西塔尼亚抗罗马名将；前 147–前 139 伊比利亚战争）｜势力 卢西塔尼亚｜据点 里斯本（PORTUGUESE 文化）｜名将｜精锐「卢西塔标枪」T1｜立绘留空｜成名战待补
        { generalId: 'luxitaniya_viriathus', factionId: 'luxitaniya', cityId: 'city_lisiben', generalName: '维里亚图斯', portrait: '/assets/PORTUGUESE/luxitaniya_viriathus.png', eliteName: '卢西塔标枪', eliteTier: 1 },
    ],
    tuoerkete: [
        // 🔴 [2026-10-25 补A] 托皮尔岑（约 900–947，托尔特克首领，传说人物非神；图拉 建 托尔特克 国家）｜势力 托尔特克｜据点 特诺奇提特兰（AMERICA 文化）｜普将（④闸敌将无实名）｜精锐「托尔特克矛」T4｜立绘留空
        { generalId: 'tuoerkete_topiltzin', factionId: 'tuoerkete', cityId: 'city_tenochtitlan', generalName: '托皮尔岑', portrait: '/assets/AMERICA/tuoerkete_topiltzin.png', eliteName: '托尔特克矛', eliteTier: 4 },
    ],
    yadian_gongguo: [
        // 🔴 [2026-10-25 补A] 拉罗什（约 1170–1234，雅典公国开国公爵）｜势力 雅典公国｜据点 雅典（ATHENIANS 文化）｜普将（实胜存疑）｜精锐「雅典骑士」T4｜立绘留空
        { generalId: 'yadian_gongguo_otto', factionId: 'yadian_gongguo', cityId: 'city_yadian', generalName: '拉罗什', portrait: '/assets/ATHENIANS/yadian_gongguo_otto.png', eliteName: '雅典骑士', eliteTier: 4 },
    ],
    mayapan: [
        // 🔴 [2026-10-25 补A] 胡纳克（约 1220–1300，玛雅潘霸主，1283 攻陷奇琴伊察；传说有名字、非神）｜势力 玛雅潘｜据点 乌斯马尔（MAYANS 文化）｜普将（④闸敌将无实名）｜精锐「玛雅潘劲卒」T4｜立绘留空
        { generalId: 'mayapan_hunac_ceel', factionId: 'mayapan', cityId: 'city_uxmal', generalName: '胡纳克', portrait: '/assets/MAYANS/mayapan_hunac_ceel.png', eliteName: '玛雅潘劲卒', eliteTier: 4 },
    ],
    songhai: [
        // 🔴 [2026-10-25 补B] 桑尼巴鲁（Sonni Baru，桑海末代桑尼；1493 安法奥败于阿斯基亚）｜势力 桑海｜据点 廷巴克图（AFRICA 文化）｜普将｜精锐「桑海王军」T4｜立绘留空
        { generalId: 'bfe_sonni_baru', factionId: 'songhai', cityId: 'city_timbuktu', generalName: '桑尼巴鲁', portrait: '/assets/AFRICA/bfe_sonni_baru.png', eliteName: '桑海王军', eliteTier: 4 },
        // 🔴 [2026-10-25 补A] 阿斯基亚（1443–1538，桑海帝国开创者；1493 篡位、征服马里）｜势力 桑海｜据点 廷巴克图（AFRICA 文化）｜名将｜精锐「桑海骑兵」T1｜立绘留空｜成名战待补
        { generalId: 'songhai_askia_muhammad', factionId: 'songhai', cityId: 'city_timbuktu', generalName: '阿斯基亚', portrait: '/assets/AFRICA/songhai_askia_muhammad.png', eliteName: '桑海骑兵', eliteTier: 1 },
    ],
    shahi: [
        // 🔴 [2026-10-25 补A] 贾亚帕拉（约 940–1002，印度教沙希王；1001 白沙瓦败于伽色尼）｜势力 沙希｜据点 白沙瓦（PURU 文化）｜普将（实胜缺）｜精锐「沙希战象」T4｜立绘留空
        { generalId: 'shahi_jayapala', factionId: 'shahi', cityId: 'city_baishawa', generalName: '贾亚帕拉', portrait: '/assets/PURU/shahi_jayapala.png', eliteName: '沙希战象', eliteTier: 4 },
    ],
    xisa: [
        // 🔴 [2026-10-25 补A] 查斯塔纳（约 78–130，西萨特拉普王；抗沙卡、护佛法，铭文可考）｜势力 西萨特拉普｜据点 帕坦（GURJARAS 文化）｜普将（实胜不明）｜精锐「萨卡骑兵」T4｜立绘留空
        { generalId: 'xisa_chastana', factionId: 'xisa', cityId: 'city_patan', generalName: '查斯塔纳', portrait: '/assets/GURJARAS/xisa_chastana.png', eliteName: '萨卡骑兵', eliteTier: 4 },
    ],
    xilawangguo: [
        // 🔴 [2026-10-25 补B] 扬尼斯·古拉斯（1791–1826，希腊独立战争阿提卡战区最高军事长官、雅典卫城司令；1824 马拉松击败奥斯曼军，1826 卫城围攻中阵亡）｜势力 希腊王国｜据点 雅典（ATHENIANS 文化，阿提卡）｜普将｜精锐「阿提卡义军」T4｜立绘留空
        { generalId: 'bfe_gouras', factionId: 'xilawangguo', cityId: 'city_yadian', generalName: '古拉斯', portrait: '/assets/ATHENIANS/bfe_gouras.png', eliteName: '阿提卡义军', eliteTier: 4 },
        // 🔴 [2026-10-25 补B] 乔治斯·卡拉伊斯卡基斯（1782–1827，希腊独立战争陆军元帅；1826–27 以埃莱夫西纳、比雷埃夫斯为大本营，战死于法利罗）｜势力 希腊王国｜据点 雅典（ATHENIANS 文化，阿提卡）｜普将｜精锐「希腊轻骑」T4｜立绘留空
        { generalId: 'bfe_karaiskakis', factionId: 'xilawangguo', cityId: 'city_yadian', generalName: '卡拉伊斯卡基斯', portrait: '/assets/ATHENIANS/bfe_karaiskakis.png', eliteName: '希腊轻骑', eliteTier: 4 },
        // 🔴 [2026-10-25 补A] 科洛科特罗尼斯（1770–1843，希腊独立战争名将；1821 瓦尔特齐、1822 收复科林斯）｜势力 希腊王国｜据点 底比斯（GREECE 文化，爱琴海区域同文化最近据点）｜名将｜精锐「希腊起义军」T1｜立绘留空｜成名战待补
        { generalId: 'xilawangguo_kolokotronis', factionId: 'xilawangguo', cityId: 'city_thebes', generalName: '科洛科特罗尼斯', portrait: '/assets/GREECE/xilawangguo_kolokotronis.png', eliteName: '希腊起义军', eliteTier: 1 },
        { generalId: 'xilawangguo_petros', factionId: 'xilawangguo', cityId: 'city_sparta', generalName: '马夫罗米哈利斯', portrait: '/assets/SPARTANS/xilawangguo_petros.png', eliteName: '马尼山兵', eliteTier: 4 }   // [2026-10-31 键名订正：xilawangguo_mani → xilawangguo]
    ],
    ante: [
        // 🔴 [2026-10-25 补B] 博兹（约 350–376，安特首领，376 战哥特王维尼塔里乌斯，有实名）｜势力 安特｜据点 基辅（SLAVIC 文化，第聂伯）｜普将｜精锐「安特战斧」T4｜立绘留空
        { generalId: 'ante_boz', factionId: 'ante', cityId: 'city_jifu', generalName: '博兹', portrait: '/assets/SLAVIC/ante_boz.png', eliteName: '安特战斧', eliteTier: 4 },
    ],
    suweihui: [
        // 🔴 [2026-10-25 补B] 马罗博杜斯（约前 30–公元 37，马科曼尼人国王；前 9 年率部迁入波希米亚盆地，建 7 万步兵＋4000 骑兵的军事王国，罗马视为心腹大患）｜势力 苏维汇｜据点 布拉格（BOHEMIANS 文化，波希米亚盆地）｜普将｜精锐「马科曼尼兵」T4｜立绘留空
        { generalId: 'bfe_maroboduus', factionId: 'suweihui', cityId: 'city_bulage', generalName: '马罗博杜斯', portrait: '/assets/BOHEMIANS/bfe_maroboduus.png', eliteName: '马科曼尼兵', eliteTier: 4 },
        // 🔴 [2026-10-25 补B] 雷基亚尔（5 世纪苏维汇王，与西哥特争伊比利亚，有实名）｜势力 苏维汇｜据点 波尔图（PORTUGUESE 文化，加利西亚）｜普将｜精锐「苏维汇重骑」T4｜立绘留空
        { generalId: 'suweihui_requiarius', factionId: 'suweihui', cityId: 'city_boertu', generalName: '雷基亚尔', portrait: '/assets/PORTUGUESE/suweihui_requiarius.png', eliteName: '苏维汇重骑', eliteTier: 4 },
    ],
    yibiluliya: [
        // 🔴 [2026-10-25 补B] 法尔纳瓦兹一世（前 3 世纪伊比利亚王，格鲁吉亚史上首个王朝）｜势力 伊比利亚｜据点 第比利斯（GEORGIANS 文化，卡特利）｜普将｜精锐「伊比利亚矛兵」T4｜立绘留空
        { generalId: 'yibiluliya_pharnavaz', factionId: 'yibiluliya', cityId: 'city_dibilisi', generalName: '法尔纳瓦兹一世', portrait: '/assets/GEORGIANS/yibiluliya_pharnavaz.png', eliteName: '伊比利亚兵', eliteTier: 4 },
    ],
    yicha: [
        // 🔴 [2026-10-25 补B] 卡内克（16 世纪伊察王，有实名；佩滕伊察）｜势力 伊察｜据点 蒂卡尔（MAYANS 文化，佩滕）｜普将｜精锐「伊察弓手」T4｜立绘留空
        { generalId: 'yicha_canek', factionId: 'yicha', cityId: 'city_tikal', generalName: '卡内克', portrait: '/assets/MAYANS/yicha_canek.png', eliteName: '伊察弓手', eliteTier: 4 },
    ],
    mengjiala: [
        // 🔴 [2026-10-25 补B] 沙姆斯丁（伊利亚斯·沙，1342–1358 孟加拉苏丹）｜势力 孟加拉｜据点 戈尔冈（BENGALIS 文化）｜普将｜精锐「孟加拉战象」T4｜立绘留空
        { generalId: 'mengjiala_shamsuddin', factionId: 'mengjiala', cityId: 'city_geergang', generalName: '沙姆斯丁', portrait: '/assets/BENGALIS/mengjiala_shamsuddin.png', eliteName: '孟加拉战象', eliteTier: 4 },
    ],
    yili: [
        // 🔴 [2026-10-25 补B] 巴托（Bato，前 6–9 年 伊利里亚/潘诺尼亚大起义领袖，有实名）｜势力 伊利里亚｜据点 布达佩斯（MAGYAR 文化，潘诺尼亚）｜普将｜精锐「伊利里亚军」T4｜立绘留空
        { generalId: 'yili_bato', factionId: 'yili', cityId: 'city_budapeisi', generalName: '巴托', portrait: '/assets/MAGYAR/yili_bato.png', eliteName: '伊利里亚军', eliteTier: 4 },
    ],
    daqiya: [
        // 🔴 [2026-10-25 补B] 布雷比斯塔（前 82–44 达契亚王，统一达契亚部落）｜势力 达契亚｜据点 索非亚（BULGARIANS 文化，巴尔干）｜普将｜精锐「达契亚弯刀」T4｜立绘留空
        { generalId: 'daqiya_burebista', factionId: 'daqiya', cityId: 'city_sofia', generalName: '布雷比斯塔', portrait: '/assets/BULGARIANS/daqiya_burebista.png', eliteName: '达契亚弯刀', eliteTier: 4 },
    ],
    qiajia: [
        // 🔴 [2026-10-25 补B] 阿迦穆罕默德（1742–1797，恺加王朝建立者；1795 克尔察尼西大破格鲁吉亚）｜势力 恺加｜据点 卡曼尼亚（PERSIAN 文化）｜名将｜精锐「恺加骑兵」T1｜立绘留空｜成名战待补
        { generalId: 'bfe_agha_mohammad', factionId: 'qiajia', cityId: 'city_kamanniya', generalName: '阿迦穆罕默德', portrait: '/assets/PERSIAN/bfe_agha_mohammad.png', eliteName: '恺加骑兵', eliteTier: 1 },
    ],
    liangxixili: [
        // 🔴 [2026-10-25 补B] 兰迪（Landi，两西西里将军；1860 卡拉塔菲米 败于加里波第）｜势力 两西西里｜据点 巴勒莫（SICILIANS 文化）｜普将｜精锐「西西里线列」T4｜立绘留空
        { generalId: 'bfe_landi', factionId: 'liangxixili', cityId: 'city_palermo', generalName: '兰迪', portrait: '/assets/SICILIANS/bfe_landi.png', eliteName: '西西里线列', eliteTier: 4 },
    ],
    arevaci: [
        // 🔴 [2026-10-25 补B] 雷图格诺斯（？–前133，凯尔特伊比利亚阿雷瓦西人统帅；努曼提亚守城抗罗马二十年，前133 城破殉城）｜势力 阿雷瓦西｜据点 努曼提亚（SPANISH 文化，梅塞塔高原）｜普将｜精锐「努曼提亚兵」T4｜立绘留空
        { generalId: 'bfe_rhetogenes', factionId: 'arevaci', cityId: 'city_numantia', generalName: '雷图格诺斯', portrait: '/assets/SPANISH/bfe_rhetogenes.png', eliteName: '努曼提亚兵', eliteTier: 4 },
    ],
    taluma: [
        // 🔴 [2026-10-25 补B] 普尔纳跋摩（395–434 在位，塔鲁玛迦拉极盛期君主；图古、芝阿鲁腾梵文碑铭记其身披重甲统战象水陆大军、攻破摧毁敌国 21 座设防城）｜势力 塔鲁玛迦拉｜据点 巴达维亚（MALAY 文化，西爪哇）｜普将｜精锐「巽他战象」T4｜立绘留空
        { generalId: 'bfe_purnavarman', factionId: 'taluma', cityId: 'city_batavia', generalName: '普尔纳跋摩', portrait: '/assets/MALAY/bfe_purnavarman.png', eliteName: '巽他战象', eliteTier: 4 },
    ],
    wende: [
        // 🔴 [2026-10-25 主人令「存在就建」] 亨吉斯特（449 率撒克逊人入不列颠、肯特王；比德《英吉利教会史》《盎格鲁-撒克逊编年史》记载，半史）｜势力 萨克森｜据点 马格德堡（撒克逊核心，同文化据点）｜普将（存疑）｜精锐「撒克逊战团」T4｜立绘留空
        { generalId: 'wende_hengist', factionId: 'wende', cityId: 'city_magedebao', generalName: '亨吉斯特', portrait: '/assets/SAXONS/wende_hengist.png', eliteName: '撒克逊战团', eliteTier: 4 },
        // 🔴 [2026-10-25 主人令「存在就建」] 狮子亨利（Heinrich der Löwe，1129–1195，萨克森+巴伐利亚公爵）｜势力 萨克森｜据点 不伦瑞克（其居城/都城）｜普将（有胜有败、存疑）｜精锐「萨克森骑士」T4｜立绘留空
        { generalId: 'wende_heinrich_loewe', factionId: 'wende', cityId: 'city_bulunruike', generalName: '狮子亨利', portrait: '/assets/SAXONS/wende_heinrich_loewe.png', eliteName: '萨克森骑士', eliteTier: 4 },
        // 🔴 [2026-10-25 主人令「有知名度高的将领先加」] 萨克森选侯 约翰腓特烈（1503–1554，施马尔卡尔登联盟领袖，1547 米尔贝格被俘）；势力 萨克森；据点 马格德堡（维滕贝格不在城库，取最近同文化据点）；普将；精锐「萨克森卫队」T4；立绘留空
        { generalId: 'wende_johnfriedrich', factionId: 'wende', cityId: 'city_magedebao', generalName: '约翰腓特烈', portrait: '/assets/SAXONS/wende_johnfriedrich.png', eliteName: '萨克森卫队', eliteTier: 4 },








        { generalId: 'gen_gero_margrave', cityId: 'city_magedebao', generalName: '杰罗', portrait: '/assets/GERMANIC/wende_jieluobojue.png', eliteName: '萨克森民兵', eliteTier: 4 },
        { generalId: 'pelianci_hengli2', legionName: '城堡时代条顿骑士军团', factionId: 'wende', cityId: 'city_lahexiuyuan', generalName: '亨利二世', portrait: '/assets/GERMANIC/pelianci_hengliershi.png', eliteName: '日耳曼民兵', eliteTier: 4 },








        { generalId: 'wende_siegfried', factionId: 'wende', cityId: 'city_aogesibao', generalName: '齐格菲', portrait: '/assets/GERMANIC/wende_siegfried.png', eliteName: '萨克森卫队', eliteTier: 4 },
    ],







    bafaliya: [







        { generalId: 'gen_tassilo_iii', cityId: 'city_leigensibao', generalName: '塔西洛三世', portrait: '/assets/GERMANIC/bafaliya_taxiluosanshi.png', eliteName: '日耳曼民兵', eliteTier: 4 },







        // 🔴 [2026-10-20 主人令「放到离他事发地最近的相同建筑风格文化的据点」「所有武将都这么处理，不要擅自添加据点」] 事发地＝维特科夫山战役（布拉格） → 最近同风格据点雷根斯堡







        { generalId: 'bfe_sigismund', cityId: 'city_leigensibao', legionName: '城堡时代条顿骑士军团', generalName: '西吉斯蒙德', portrait: '/assets/GERMANIC/bfe_sigismund.png' , eliteName: '德意志骑士', eliteTier: 2},







        // 🔴 [2026-10-20 主人令「遇到问题先看符合历史，下结论再动手」] 成名战回补安置按史实复核：卡洛曼＝东法兰克巴伐利亚王，驻雷根斯堡；科隆不是他的驻地 → 放雷根斯堡（bafaliya，风格 GERMANIC）；仍挂本政权 falanji
        { generalId: 'falanji_kalman', cityId: 'city_leigensibao', legionName: '封建时代东法兰克军团', factionId: 'falanji', generalName: '卡洛曼', portrait: '/assets/GERMANIC/falanji_kalman.png', eliteName: '日耳曼民兵', eliteTier: 4 },
    ],







    huohengsuolun: { generalId: 'gen_frederick_i_nuremberg', cityId: 'city_niulunbao', generalName: '腓特烈一世', portrait: '/assets/GERMANIC/huohengsuolun_feitelieyishi.png', eliteName: '日耳曼民兵', eliteTier: 4 },






    ruishi: { generalId: 'gen_winkelried', cityId: 'city_basaier', generalName: '温克尔里德', portrait: '/assets/GERMANIC/ruishi_ciwenli.png', eliteName: '日耳曼民兵', eliteTier: 4 },






    // 斯瓦托普卢克＝大摩拉维亚国王（摩拉维亚势力只是同国另一据点）→ 挂大摩拉维亚






    damolaweiya: { generalId: 'gen_mojmir_i', cityId: 'city_buernuo', generalName: '莫伊米尔', portrait: '/assets/BOHEMIANS/gen_mojmir_i.png', eliteName: '波西米亚兵', eliteTier: 4 },















    luosi: [
        // 🔴 [2026-10-25 按史] 德米特里·亚历山德罗维奇（1250–1294，涅夫斯基之子，诺夫哥罗德王公 1276–1292）｜势力 罗斯｜据点 诺夫哥罗德（其王公驻地，SLAVIC 文化）｜普将｜精锐「诺夫战团」T4｜立绘留空
        { generalId: 'luosi_dmitry_aleksandrovich', factionId: 'luosi', cityId: 'city_nuofugeerdede', generalName: '德米特里', portrait: '/assets/SLAVIC/luosi_dmitry_aleksandrovich.png', eliteName: '诺夫战团', eliteTier: 4 },
        { generalId: 'luosi_svyatopolk', factionId: 'luosi', cityId: 'city_jifu', generalName: '斯维亚托波尔克', portrait: '/assets/SLAVIC/luosi_svyatopolk.png', eliteName: '罗斯民兵', eliteTier: 4 },   // 🔴 [2026-10-25 按史] 成名战敌将；基辅大公约980-1019，1019 阿尔塔河败死；据点基辅（SLAVIC）；用势力精锐瓦兰吉卫队
















        { generalId: 'gen_yaroslav', cityId: 'city_jifu', generalName: '雅罗斯拉夫', portrait: '/assets/SLAVIC/luosi_yaluosilafu.png', eliteName: '罗斯亲兵', eliteTier: 3 },
        { generalId: 'gen_alexander_nef', factionId: 'luosi', cityId: 'city_nuofugeerdede', generalName: '亚历山大涅夫斯基', portrait: '/assets/SLAVIC/liulike_niefusiji.png', eliteName: '罗斯亲兵', eliteTier: 3 },
        { generalId: 'gen_rurik', factionId: 'luosi', cityId: 'city_ladoga', generalName: '留里克', portrait: '/assets/VARANGIANS/gen_rurik.png', legionName: '封建时代瓦良格军团', eliteName: '瓦良格兵', eliteTier: 4 },
        { generalId: 'gen_sineus', factionId: 'luosi', cityId: 'city_baihu', generalName: '西涅乌斯', portrait: '/assets/VARANGIANS/gen_sineus.png', legionName: '封建时代瓦良格军团', eliteName: '瓦良格兵', eliteTier: 4 },
















    
        { generalId: 'gen_vyacheslav_tartu', factionId: 'luosi', cityId: 'city_youliyefu', generalName: '维切斯拉夫', portrait: '/assets/LITHUANIANS/gen_vyacheslav_tartu.png', eliteName: '立陶宛兵', eliteTier: 4 },
















    
        { generalId: 'kaleiliya_kelimu', legionName: '帝国时代俄罗斯军团', factionId: 'luosi', cityId: 'city_jiridao', generalName: '克利姆索博列夫', portrait: '/assets/SLAVIC/kaleiliya_kelimusuoboliefu.png', eliteName: '罗斯民兵', eliteTier: 4 },
















    
        { generalId: 'xiadunhe_sviatoslav', factionId: 'luosi', cityId: 'city_jifu', generalName: '斯维亚托斯拉夫', portrait: '/assets/SLAVIC/xiadunhe_siweiyatuosilafu.png', eliteName: '罗斯亲兵', eliteTier: 3 },
















        { generalId: 'luosi_yury', factionId: 'luosi', cityId: 'city_nuofugeerdede', generalName: '尤里博戈柳布斯基', portrait: '/assets/SLAVIC/luosi_yury.png', eliteName: '罗斯亲兵', eliteTier: 4 },
    ],






    mosike_gongguo: [
        // 🔴 [2026-10-25 补B] 切利亚德宁（Ivan Chelyadnin，1514 奥尔沙会战莫斯科军统帅，被俘）｜势力 莫斯公国｜据点 莫斯科（SLAVIC 文化）｜普将（实败）｜精锐「莫斯科军」T4｜立绘留空
        { generalId: 'bfe_chelyadnin', factionId: 'mosike_gongguo', cityId: 'city_mosike', generalName: '切利亚德宁', portrait: '/assets/SLAVIC/bfe_chelyadnin.png', eliteName: '莫斯科军', eliteTier: 4 },



        { generalId: 'gen_dmitry_donskoy', cityId: 'city_mosike', generalName: '顿斯科伊', portrait: '/assets/SLAVIC/mosike_gongguo_dunsikeyi.png', eliteName: '莫斯科卫队', eliteTier: 2 },



        // 🔴 [2026-10-20 成名战规则] 瓦西里三世＝莫斯科大公（1521 击退克里米亚远征）→ 莫斯科（SLAVIC）；帝国时代俄罗斯军团；立绘留空



        { generalId: 'gen_vasili_iii', cityId: 'city_mosike', generalName: '瓦西里三世', portrait: '/assets/SLAVIC/gen_vasili_iii.png', legionName: '帝国时代俄罗斯军团', eliteName: '莫斯科卫队', eliteTier: 2 },



    
        { generalId: 'gen_vladimir_andreyevich', factionId: 'mosike_gongguo', cityId: 'city_xieerpuhuofu', generalName: '勇者弗拉基', portrait: '/assets/SLAVIC/xieerpuhuofu_gongguo_yongzhefulaji.png', eliteName: '罗斯重骑', eliteTier: 3 },







    ],







    eluosi_diguo: [
        // 🔴 [2026-10-25 补B] 阿普拉克辛（1659–1728，沙俄北方战区将领；大北方战争驻拉多加—伊尔门湖防线，1700–1708 屡败瑞典军）｜势力 俄罗斯帝国｜据点 拉多加（VARANGIANS 文化）｜普将｜精锐「北方军团」T4｜立绘留空
        { generalId: 'eluosi_diguo_apraksin', factionId: 'eluosi_diguo', cityId: 'city_ladoga', legionName: '帝国时代北境长斧军团', generalName: '阿普拉克辛', portrait: '/assets/VARANGIANS/eluosi_diguo_apraksin.png', eliteName: '北方军团', eliteTier: 4 },








        { generalId: 'eluosi_diguo_peter', cityId: 'city_shengpidebao', generalName: '彼得大帝', portrait: '/assets/SLAVIC/eluosi_diguo_peter.png', eliteName: '俄国近卫', eliteTier: 2 },
        { generalId: 'gen_grigory_donets', factionId: 'eluosi_diguo', cityId: 'city_haerkefu', generalName: '多涅茨', portrait: '/assets/SLAVIC/siluoboda_duonieci.png', eliteName: '罗斯民兵', eliteTier: 4 },








    
        { generalId: 'gen_semyon_saburov', factionId: 'eluosi_diguo', cityId: 'city_woluonerizh', generalName: '萨布罗夫', portrait: '/assets/SLAVIC/yedi_sabuluofu.png', eliteName: '罗斯民兵', eliteTier: 4 },








    
        { generalId: 'don_vorontsov', factionId: 'eluosi_diguo', cityId: 'city_shengpidebao', generalName: '沃隆佐夫', portrait: '/assets/SLAVIC/fuerjia_wolongzuofu_v2.png', eliteName: '罗斯民兵', eliteTier: 4 },








    
        { generalId: 'nogai_votkhovsky', factionId: 'eluosi_diguo', cityId: 'city_samala', generalName: '沃特霍夫斯基', portrait: '/assets/SLAVIC/nuogai_wotehuofusiji_v2.png', eliteName: '罗斯民兵', eliteTier: 4 },








    
        { generalId: 'bashkir_nagoy', factionId: 'eluosi_diguo', cityId: 'city_wufa', generalName: '纳吉', portrait: '/assets/SLAVIC/bashekeer_naji_v2.png', eliteName: '罗斯民兵', eliteTier: 4 },








    
        { generalId: 'gen_sergey_belgorod', factionId: 'eluosi_diguo', cityId: 'city_bieergeleide', generalName: '谢尔盖', portrait: '/assets/SLAVIC/beisilafu_xieergai.png', eliteName: '罗斯民兵', eliteTier: 4 },








    
        { generalId: 'eguo_zasekin', factionId: 'eluosi_diguo', cityId: 'city_salatuofu', generalName: '扎谢金', portrait: '/assets/SLAVIC/eguo_zasekin.png', eliteName: '罗斯民兵', eliteTier: 4 },








    
        { generalId: 'bulat_beiduanchaer', factionId: 'menggu_d', cityId: 'city_burhan', generalName: '孛端察儿', portrait: '/assets/SLAVIC/bulat_beiduanchaer.png', eliteName: '蒙古部兵', eliteTier: 4  },   // 按史：孛端察儿为成吉思汗十世祖（约 10 世纪），怯薛 1204 年才建








    ],






    daniebo: [
        { generalId: 'gen_romshlav', cityId: 'city_simolengsike', generalName: '罗姆什拉夫', portrait: '/assets/SLAVIC/daniebo_luomushenlafu.png', eliteName: '罗斯民兵', eliteTier: 4 },
        { generalId: 'bfe_smolensk_voivode', cityId: 'city_simolengsike', generalName: '格列博维奇', portrait: '/assets/SLAVIC/bfe_smolensk_voivode.png', factionId: 'litaowan', legionName: '帝国时代俄罗斯军团', eliteName: '罗斯民兵', eliteTier: 4 },
    ],







    qiernigeweifu_gongguo: { generalId: 'gen_mstislav', cityId: 'city_qiernigeweifu', generalName: '姆斯蒂', portrait: '/assets/SLAVIC/qiernigeweifu_gongguo_musidi.png', eliteName: '罗斯民兵', eliteTier: 4 },







    jialixiya: [








        { generalId: 'gen_daniel_galitsky', cityId: 'city_jialiqi', generalName: '丹尼尔', portrait: '/assets/SLAVIC/jialixiya_dannier.png', eliteName: '罗斯民兵', eliteTier: 4 },
        { generalId: 'gen_zhytomyr', legionName: '封建时代基辅罗斯军团', factionId: 'jialixiya', cityId: 'city_zhytomyr', generalName: '日托米尔', portrait: '/assets/SLAVIC/zhituo_rituomier.png', eliteName: '罗斯民兵', eliteTier: 4 },








    ],







    pusikefu_gongheguo: { generalId: 'gen_daumantas', cityId: 'city_pusikefu', generalName: '道曼塔斯', portrait: '/assets/SLAVIC/pusikefu_gongheguo_daomantasi.png', eliteName: '罗斯民兵', eliteTier: 4 },







    ouka: { generalId: 'gen_yuri_ryazan', cityId: 'city_liangzan', generalName: '尤里', portrait: '/assets/SLAVIC/ouka_youli.png', eliteName: '罗斯民兵', eliteTier: 4 },







    xideweina: { generalId: 'gen_breslav', cityId: 'city_boluocike', generalName: '布列斯拉夫', portrait: '/assets/SLAVIC/xideweina_buliesilafu.png', eliteName: '罗斯民兵', eliteTier: 4 },







    jinzhang: [







        { generalId: 'gen_batu', cityId: 'city_salai', generalName: '拔都', portrait: '/assets/CENTRAL_ASIA/gen_batu.png', eliteName: '金帐骑兵', eliteTier: 2 },



        // 🔴 [2026-10-20 成名战规则] 库特卢格＝金帐王公（1362 蓝水河三王之一，被阿尔吉尔达斯击败）→ 萨莱（CENTRAL_ASIA）；城堡×中部亚洲＝城堡时代察合台军团；立绘留空



        { generalId: 'gen_kutlug_buga', cityId: 'city_salai', generalName: '库特卢格', portrait: '/assets/CENTRAL_ASIA/gen_kutlug_buga.png', legionName: '城堡时代河中军团', eliteName: '河中骑兵', eliteTier: 4 },



        // 🔴 [2026-10-20 成名战规则] 马麦＝金帐权臣（1380 库利科沃被德米特里击败）→ 萨莱（CENTRAL_ASIA）；城堡时代察合台军团；立绘留空



        { generalId: 'gen_mamai', cityId: 'city_salai', generalName: '马麦', portrait: '/assets/CENTRAL_ASIA/gen_mamai.png', legionName: '城堡时代河中军团', eliteName: '金帐骑兵', eliteTier: 2 },







        { generalId: 'gen_astrakhan_khan', cityId: 'city_salai', generalName: '阿斯特拉', portrait: '/assets/CENTRAL_ASIA/gen_astrakhan_khan.png', eliteName: '河中骑兵', eliteTier: 4 },







        // 🔴 [2026-10-20 成名战规则] 那海＝金帐权臣、实际统治者（1278 德鲁斯塔尔围攻伊瓦伊洛）→ 萨莱·金帐；名将；封建×中亚＝封建时代河中军团；立绘留空







        { generalId: 'jinzhang_nogai', cityId: 'city_salai', legionName: '城堡时代河中军团', generalName: '那海', portrait: '/assets/CENTRAL_ASIA/jinzhang_nogai.png', eliteName: '金帐骑兵', eliteTier: 2 },







        { generalId: 'jinzhang_tokhtamysh', factionId: 'jinzhang', cityId: 'city_salai', generalName: '脱脱迷失汗', portrait: '/assets/CENTRAL_ASIA/jinzhang_tokhtamysh.png', eliteName: '金帐骑兵', eliteTier: 3 },
        { generalId: 'jinzhang_urus', factionId: 'jinzhang', cityId: 'city_salai', generalName: '兀鲁思汗', portrait: '/assets/CENTRAL_ASIA/jinzhang_urus.png', eliteName: '金帐骑兵', eliteTier: 4 },
    ],







    baojiaer: [







        { generalId: 'gen_ulugh_muhammad', cityId: 'city_kashan', generalName: '兀鲁黑', portrait: '/assets/CENTRAL_ASIA/gen_ulugh_muhammad.png', eliteName: '河中骑兵', eliteTier: 4 },







        { generalId: 'gen_karasakal', cityId: 'city_kashan', generalName: '卡拉萨卡尔', portrait: '/assets/CENTRAL_ASIA/gen_karasakal.png', legionName: '帝国时代突厥斯坦军团', eliteName: '河中骑兵', eliteTier: 4 },







    ],







    baizanting: [
        // 🔴 [2026-10-25 补B] 巴列奥略（1409–1465，摩里亚专制君；君士坦丁十一世之弟，守摩里亚）｜势力 拜占庭｜据点 斯巴达（SPARTANS 文化，摩里亚）｜普将｜精锐「摩里亚守军」T4｜立绘留空
        { generalId: 'baizanting_thomas', factionId: 'baizanting', cityId: 'city_sparta', generalName: '巴列奥略', portrait: '/assets/SPARTANS/baizanting_thomas.png', eliteName: '摩里亚守军', eliteTier: 4 },
        // 🔴 [2026-10-25 补B] 阿波卡夫（10 世纪末拜占庭摩里亚军区长官；997 年保加利亚沙皇撒慕尔南侵时坐镇斯巴达组织防务）｜势力 拜占庭｜据点 斯巴达（SPARTANS 文化，拉科尼亚）｜普将｜精锐「拉科尼亚守军」T4｜立绘留空
        { generalId: 'bfe_apokaukos', factionId: 'baizanting', cityId: 'city_sparta', generalName: '阿波卡夫', portrait: '/assets/SPARTANS/bfe_apokaukos.png', eliteName: '拉科尼亚兵', eliteTier: 4 },
        // 🔴 [2026-10-25 补B] 乔治·马尼亚克（？–1043，拜占庭名将；1038–1040 西西里远征军最高统帅，罗梅塔与特罗伊纳大破阿拉伯军、收复墨西拿与叙拉古等十三城）｜势力 拜占庭｜据点 锡拉库萨（SICILIANS 文化）｜普将（存疑）｜精锐「西西里远征」T4｜立绘留空
        { generalId: 'bfe_maniakes', factionId: 'baizanting', cityId: 'city_syracuse', generalName: '马尼亚克', portrait: '/assets/SICILIANS/bfe_maniakes.png', eliteName: '诺曼佣兵', eliteTier: 3 },
        // 🔴 [2026-10-25 补B] 阿加利阿诺斯·孔托斯克莱斯（？–727，拜占庭希腊军区统帅；726–727 联合爱琴海水手起义、率舰队北上进攻君士坦丁堡）｜势力 拜占庭｜据点 底比斯（GREECE 文化，希腊军区首府）｜普将（实败）｜精锐「希腊军区兵」T4｜立绘留空
        { generalId: 'bfe_kontoskeles', factionId: 'baizanting', cityId: 'city_thebes', generalName: '孔托斯克莱斯', portrait: '/assets/GREECE/bfe_kontoskeles.png', eliteName: '希腊军区兵', eliteTier: 4 },
        // 🔴 [2026-10-25 补B] 维塔利安（？–520，东罗马色雷斯联邦军统帅；513–515 三次率色雷斯军进逼君士坦丁堡）｜势力 拜占庭｜据点 普罗夫迪夫（THRACIAN 文化，色雷斯）｜普将（实败）｜精锐「色雷斯军」T4｜立绘留空
        { generalId: 'bfe_vitalian', factionId: 'baizanting', cityId: 'city_plovdiv', generalName: '维塔利安', portrait: '/assets/THRACIAN/bfe_vitalian.png', eliteName: '色雷斯军', eliteTier: 4 },
        // 🔴 [2026-10-25 补B] 阿历克塞·布拉纳斯（？–1187，阿德里安堡将门；1185 莫西诺波利斯全歼诺曼西西里军）｜势力 拜占庭｜据点 普罗夫迪夫（THRACIAN 文化）｜普将｜精锐「色雷斯骑兵」T4｜立绘留空
        { generalId: 'bfe_alexios_branas', factionId: 'baizanting', cityId: 'city_plovdiv', generalName: '布拉纳斯', portrait: '/assets/THRACIAN/bfe_alexios_branas.png', eliteName: '色雷斯骑兵', eliteTier: 4 },
        // 🔴 [2026-10-25 补B] 尼基弗鲁斯（912–969，拜占庭名将；961 收复克里特、965 奇里乞亚、969 安条克；卡帕多西亚家族）｜势力 拜占庭｜据点 伊科尼乌姆（TURKS 文化，安纳托利亚军区）｜名将｜精锐「拜占庭铁甲」T1｜立绘留空｜成名战待补
        { generalId: 'baizanting_nikephoros_phokas', factionId: 'baizanting', cityId: 'city_yikeniwumu', legionName: '封建时代卡帕多细亚铁甲军团', generalName: '尼基弗鲁斯二世', portrait: '/assets/TURKS/baizanting_nikephoros_phokas.png', eliteName: '拜占庭铁甲', eliteTier: 1 },
        // 🔴 [2026-10-25 补B] 君士坦丁十一世（1405–1453，摩里亚专制君、末代拜占庭皇帝）｜势力 拜占庭｜据点 斯巴达（SPARTANS 文化，摩里亚）｜普将（实败）｜精锐「摩里亚重甲」T4｜立绘留空
        // 🔴 [2026-10-25 补A] 贝利撒留（505–565，拜占庭名将；达拉 530 胜波斯、533 灭汪达尔、536 收复罗马）｜势力 拜占庭｜据点 罗马城（ROMA 文化，拉丁姆）｜名将｜精锐「拜占庭重骑」T1｜立绘留空｜成名战待补
        { generalId: 'baizanting_belisarius', factionId: 'baizanting', cityId: 'city_junshitandingbao', legionName: '封建时代拉丁姆军团', generalName: '贝利撒留', portrait: '/assets/ROMA/baizanting_belisarius.png', eliteName: '拜占庭重骑', eliteTier: 1 },
        { generalId: 'baizanting_diaofeilusi', factionId: 'baizanting', cityId: 'city_junshitandingbao', generalName: '狄奥斐卢斯', portrait: '/assets/BYZANTINE/baizanting_diaofeilusi.png', eliteName: '拜占庭重骑', eliteTier: 3 },   // 🔴 [2026-10-25 按史] 成名战敌将；拜占庭皇帝 813-842，838 阿莫里乌姆失陷；据点君士坦丁堡（BYZANTINE）；用势力精锐铁甲圣骑
        { generalId: 'bfe_andronikos_komnenos', factionId: 'baizanting', cityId: 'city_junshitandingbao', generalName: '科穆宁', portrait: '/assets/BYZANTINE/bfe_andronikos_komnenos.png', eliteName: '拜占庭兵', eliteTier: 4 },   // 🔴 [2026-10-25 按史] 成名战敌将；拜占庭将领、后为皇帝（1183-1185）；1152 围马米斯特拉败退；据点君士坦丁堡（BYZANTINE）；用势力精锐铁甲圣骑
        { generalId: 'bfe_isaac_komnenos', cityId: 'city_junshitandingbao', generalName: '伊萨克', portrait: '/assets/BYZANTINE/bfe_isaac_komnenos.png', legionName: '城堡时代拜占庭军团', eliteName: '拜占庭兵', eliteTier: 4 },







        { generalId: 'gen_basil_ii', cityId: 'city_junshitandingbao', generalName: '巴西尔二世', portrait: '/assets/BYZANTINE/gen_basil_ii.png', eliteName: '拜占庭铁甲', eliteTier: 2 },



        // 🔴 [2026-10-20 成名战规则] 君士坦丁十一世＝拜占庭末帝（1453 君士坦丁堡陷落战死）→ 君士坦丁堡（BYZANTINE）；城堡时代拜占庭军团；立绘留空



        { generalId: 'gen_constantine_xi', cityId: 'city_junshitandingbao', generalName: '君士坦丁十一世', portrait: '/assets/BYZANTINE/gen_constantine_xi.png', legionName: '城堡时代拜占庭军团', eliteName: '拜占庭重骑', eliteTier: 3 },







        // 2026-10-20：尼基弗鲁斯（拜占庭皇帝 963–969）→ 君士坦丁堡；BYZANTINE×封建＝拜占庭军区军团














        // 名将双身份：阿内吉斯克鲁斯（据点武将＋剧本敌将）







        { generalId: 'bfe3_92', cityId: 'city_junshitandingbao', generalName: '阿内吉斯克鲁斯', portrait: '/assets/BYZANTINE/bfe3_92.png', legionName: '古典时代博斯普鲁斯军团' , eliteName: '拜占庭卫军', eliteTier: 3},







        // 🔴 [2026-10-20 成名战规则] 尼基弗鲁斯一世＝拜占庭皇帝（811 普利斯卡战役战死）→ 君士坦丁堡·拜占庭；名将；立绘留空







        { generalId: 'baizanting_nikephoros_i', cityId: 'city_junshitandingbao', generalName: '尼基弗鲁斯一世', portrait: '/assets/BYZANTINE/baizanting_nikephoros_i.png', eliteName: '拜占庭铁甲', eliteTier: 2 },







        // 🔴 [2026-10-20 成名战规则] 罗曼努斯一世＝拜占庭海军将领/后为皇帝（917 阿海洛战役拜占庭主帅，大败）→ 君士坦丁堡·拜占庭；名将；立绘留空







        { generalId: 'baizanting_romanosi', cityId: 'city_junshitandingbao', generalName: '罗曼努斯一世', portrait: '/assets/BYZANTINE/baizanting_romanosi.png', eliteName: '拜占庭铁甲', eliteTier: 2 },







        // 🔴 [2026-10-20 成名战规则] 伊萨克二世·安格洛斯＝拜占庭皇帝（1190 特里亚夫纳被保加利亚阿森一世击败）→ 君士坦丁堡·拜占庭；普将；立绘留空







        { generalId: 'baizanting_isaac_ii', cityId: 'city_junshitandingbao', legionName: '城堡时代拜占庭军团', generalName: '伊萨克二世', portrait: '/assets/BYZANTINE/baizanting_isaac_ii.png', eliteName: '拜占庭兵', eliteTier: 4 },







        // 🔴 [2026-10-20 成名战规则] 阿莱克修斯五世＝拜占庭末帝（1204 君士坦丁堡被十字军攻陷）→ 君士坦丁堡·拜占庭；普将；立绘留空







        { generalId: 'baizanting_alexios_v', cityId: 'city_junshitandingbao', legionName: '城堡时代拜占庭军团', generalName: '阿莱克修斯五世', portrait: '/assets/BYZANTINE/baizanting_alexios_v.png', eliteName: '拜占庭兵', eliteTier: 4 },







    
        { generalId: 'bitiniya_diaoduoer', legionName: '城堡时代拜占庭军团', factionId: 'baizanting', cityId: 'city_nixiya', generalName: '狄奥多尔', portrait: '/assets/BYZANTINE/bitiniya_diaoduoer.png', eliteName: '拜占庭兵', eliteTier: 4 },








        { generalId: 'bfe_vahan', factionId: 'baizanting', cityId: 'city_junshitandingbao', generalName: '瓦汉', portrait: '/assets/BYZANTINE/bfe_vahan.png', eliteName: '东罗马甲骑', eliteTier: 3 },
        { generalId: 'bfe_leo_phokas', factionId: 'baizanting', cityId: 'city_junshitandingbao', generalName: '利奥福卡斯', portrait: '/assets/BYZANTINE/bfe_leo_phokas.png', eliteName: '帝国近卫', eliteTier: 4 },
    ],






    bosi_puluosi: [







        { generalId: 'bosi_puluosi_liukong', cityId: 'city_pantika', generalName: '琉孔一世', portrait: '/assets/GREECE/bosi_puluosi_liukong.png', eliteName: '希腊步兵', eliteTier: 4 },
        { generalId: 'gen_aspurgus', factionId: 'bosi_puluosi', cityId: 'city_pantika', legionName: '古典时代赫拉斯军团', generalName: '阿斯普尔', portrait: '/assets/BYZANTINE/gen_aspurgus.png', eliteName: '希腊步兵', eliteTier: 4 },







    ],







    kelimiya: [








        { generalId: 'gen_caffa_consul', cityId: 'city_kafa', generalName: '斯夸尔', portrait: '/assets/LATIN/kelimiya_aobeituosikuaer.png', eliteName: '意大利民兵', eliteTier: 4 },
        { generalId: 'gen_andrea_doria', legionName: '帝国时代意大利皇家军团', factionId: 'kelimiya', cityId: 'city_genoa', generalName: '安德烈亚多里亚', portrait: '/assets/LATIN/liguliya_andelieya.png', eliteName: '热那亚桨手', eliteTier: 3 },








        { generalId: 'kelimiya_embriaco', factionId: 'kelimiya', cityId: 'city_genoa', generalName: '古列尔莫', portrait: '/assets/LATIN/kelimiya_embriaco.png', eliteName: '热那亚弩手', eliteTier: 3 },
    ],







    keluodiya: { generalId: 'gen_nikola_zrinski', cityId: 'city_gradeci', generalName: '兹林斯基', portrait: '/assets/SLAVIC/gen_nikola_zrinski.png', eliteName: '克罗地亚骑', eliteTier: 3 },






    litaowan: [
        // 🔴 [2026-10-25 补B] 康斯坦丁·奥斯特罗格斯基（1460–1530，立陶宛名将；1514 奥尔沙大胜莫斯科）｜势力 立陶宛｜据点 维尔纽斯（LITHUANIANS 文化）｜名将｜精锐「立陶宛重骑」T1｜立绘留空｜成名战待补
        { generalId: 'litaowan_ostrogski', factionId: 'litaowan', cityId: 'city_weierniwusi', generalName: '奥斯特罗格斯基', portrait: '/assets/LITHUANIANS/litaowan_ostrogski.png', eliteName: '立陶宛重骑', eliteTier: 1 },







        { generalId: 'gen_gediminas', cityId: 'city_weierniwusi', generalName: '格迪米纳斯', portrait: '/assets/LITHUANIANS/gen_gediminas.png', eliteName: '立陶宛兵', eliteTier: 4 },







        // 2026-10-20：雅盖沃（立陶宛大公、波兰国王，约 1351–1434）→ 维尔纽斯；LITHUANIANS×城堡＝立陶宛大公国军团







        { generalId: 'gen_jogaila', cityId: 'city_kelakefu', generalName: '雅盖沃', portrait: '/assets/LITHUANIANS/gen_jogaila.png', legionName: '城堡时代立陶宛大公国军团' , eliteName: '立陶宛骑士', eliteTier: 3},







    
        { generalId: 'gen_gastold', factionId: 'litaowan', cityId: 'city_brest', generalName: '加斯托尔德', portrait: '/assets/LITHUANIANS/gen_gastold.png', eliteName: '立陶宛兵', eliteTier: 4 },








    
        { generalId: 'gen_vytautas_great', factionId: 'litaowan', cityId: 'city_geluodenuo', generalName: '维陶塔斯', portrait: '/assets/LITHUANIANS/gen_vytautas_great.png', eliteName: '立陶宛重骑', eliteTier: 2 },







    
        { generalId: 'gen_algirdas', factionId: 'litaowan', cityId: 'city_weijiebusike', generalName: '阿尔吉尔达斯', portrait: '/assets/LITHUANIANS/gen_algirdas.png', eliteName: '立陶宛重骑', eliteTier: 2 },







    
        { generalId: 'gen_kestutis', factionId: 'litaowan', cityId: 'city_kawunas', generalName: '科斯图提斯', portrait: '/assets/LITHUANIANS/gen_kestutis.png', eliteName: '立陶宛重骑', eliteTier: 2 },







    ],







    bolan: [








        { generalId: 'bolan_suobiesiji', cityId: 'city_huasha', generalName: '索别斯基', portrait: '/assets/POLES/bolan_suobiesiji.png', eliteName: '翼骑兵', eliteTier: 1 },
        { generalId: 'gen_casimir_iv', legionName: '城堡时代波兰王国军团', factionId: 'bolan', cityId: 'city_kelakefu', generalName: '卡西米尔', portrait: '/assets/POLES/gen_casimir_iv.png', eliteName: '波兰民兵', eliteTier: 4 },








    
        { generalId: 'gen_przemysl_ii', legionName: '城堡时代波兰王国军团', factionId: 'bolan', cityId: 'city_poznan', generalName: '普热梅斯', portrait: '/assets/POLES/gen_przemysl_ii.png', eliteName: '波兰民兵', eliteTier: 4 },








    
        { generalId: 'gen_boleslaw_brave', legionName: '封建时代波兰尼军团', factionId: 'bolan', cityId: 'city_poznan', generalName: '勇者波列', portrait: '/assets/POLES/gen_boleslaw_brave.png', eliteName: '波兰骑士', eliteTier: 3 },








    
        { generalId: 'gen_jadwiga', legionName: '城堡时代波兰王国军团', factionId: 'bolan', cityId: 'city_kelakefu', generalName: '雅德维加', portrait: '/assets/POLES/gen_jadwiga.png', eliteName: '波兰民兵', eliteTier: 4 },








    
        { generalId: 'gen_casimir_great', legionName: '城堡时代波兰王国军团', factionId: 'bolan', cityId: 'city_kelakefu', generalName: '卡齐米日', portrait: '/assets/POLES/gen_casimir_great.png', eliteName: '波兰民兵', eliteTier: 4 },









        { generalId: 'bfe_potocki', factionId: 'bolan', cityId: 'city_kelakefu', generalName: '波托茨基', portrait: '/assets/POLES/bfe_potocki.png', eliteName: '波兰翼骑', eliteTier: 4 },
        { generalId: 'bolan_zawisza', factionId: 'bolan', cityId: 'city_kelakefu', generalName: '黑衣扎维沙', portrait: '/assets/POLES/bolan_zawisza.png', eliteName: '波兰骠骑', eliteTier: 3 },
        { generalId: 'bolan_maria', factionId: 'bolan', cityId: 'city_kelakefu', generalName: '玛丽亚', portrait: '/assets/POLES/bolan_maria.png', eliteName: '安茹卫队', eliteTier: 4 },
    ],







    // ── 2026-08-04 新增：普热梅斯二世（波兹南公爵/大波兰公/波兰国王）──






    baojian_qishi: [
        { generalId: 'baojian_herman', factionId: 'baojian_qishi', cityId: 'city_liga', generalName: '赫尔曼', portrait: '/assets/GERMANIC/baojian_herman.png', eliteName: '宝剑骑士', eliteTier: 2 },   // 🔴 [2026-10-25 按史] 成名战敌将；多尔帕特主教 1224-1248，1242 楚德湖之役统条顿/利沃尼亚军；据点里加（GERMANIC）；用势力精锐里加宝剑








        { generalId: 'gen_albert_riga', cityId: 'city_liga', generalName: '布克斯赫夫登', portrait: '/assets/GERMANIC/gen_albert_riga.png', eliteName: '日耳曼民兵', eliteTier: 4 },
        { generalId: 'gen_prettenberg', legionName: '帝国时代普鲁士帝国军团', factionId: 'baojian_qishi', cityId: 'city_talin', generalName: '普雷特贝格', portrait: '/assets/GERMANIC/gen_prettenberg.png', eliteName: '日耳曼民兵', eliteTier: 4 },








    ],







    teweier_gongguo: { generalId: 'gen_mikhail_tver', cityId: 'city_teweier', generalName: '米哈伊尔', portrait: '/assets/SLAVIC/teweier_gongguo_mihayier.png', eliteName: '罗斯民兵', eliteTier: 4 },







    suzidaer: [








        { generalId: 'gen_dmitry_suzdal', cityId: 'city_xianuofugeerdede', generalName: '康斯坦丁诺', portrait: '/assets/SLAVIC/suzidaer_kangsitandingnuo.png', eliteName: '罗斯民兵', eliteTier: 4 },
        { generalId: 'gen_andrey_bogolyub', factionId: 'suzidaer', cityId: 'city_fulajimier', generalName: '安德烈', portrait: '/assets/SLAVIC/fulajimier_gongguo_andelie.png', eliteName: '罗斯民兵', eliteTier: 4 },








    ],







    gesake: [
        // 🔴 [2026-10-25 补B] 赫梅利尼茨基（1595–1657，哥萨克名将；1648 黄水、科尔逊大胜波兰）｜势力 哥萨克｜据点 谢缅杰尔（CUMAN 文化，钦察草原）｜名将｜精锐「哥萨克骑兵」T1｜立绘留空｜成名战待补
        { generalId: 'gesake_khmelnytsky', factionId: 'gesake', cityId: 'city_xiemianjieer', generalName: '赫梅利尼茨基', portrait: '/assets/CUMAN/gesake_khmelnytsky.png', eliteName: '哥萨克骑兵', eliteTier: 1 },








        { generalId: 'gen_vyshnevetsky', factionId: 'gesake', cityId: 'city_zhapoluore', generalName: '拜达', portrait: '/assets/SLAVIC/qiekase_weishenniao.png', eliteName: '罗斯民兵', eliteTier: 4 },








    
        { generalId: 'gen_mikhail_tatarinov', factionId: 'gesake', cityId: 'city_weishen', generalName: '塔塔里诺夫', portrait: '/assets/SLAVIC/dunhe_tatalinuofu.png', eliteName: '罗斯民兵', eliteTier: 4 },








    ],







    moerdaweiya: { generalId: 'gen_stephen_great', eliteName: '瓦斯卢伊军', eliteTier: 2, cityId: 'city_suceava', generalName: '斯蒂芬大帝', portrait: '/assets/SLAVIC/moerdaweiya_sidifendadi.png' },







    walajiyia: [








        { generalId: 'gen_vlad_impaler', cityId: 'city_teergewishite', generalName: '弗拉德三世', portrait: '/assets/SLAVIC/walajiyia_fuladesanshi.png', eliteName: '瓦拉几亚兵', eliteTier: 3 },
        { generalId: 'mengtainiya_radu_iii', factionId: 'walajiyia', cityId: 'city_bucharest', generalName: '拉杜三世', portrait: '/assets/SLAVIC/mengtainiya_radu_iii.png', eliteName: '罗斯民兵', eliteTier: 4 },








    
        { generalId: 'gen_basarab_i', factionId: 'walajiyia', cityId: 'city_agesi', generalName: '巴萨拉布', portrait: '/assets/SLAVIC/gen_basarab_i.png', eliteName: '瓦拉几亚兵', eliteTier: 3 },








    ],







    tiaodun_qishi: [
        { generalId: 'gen_ulrich_jungingen', cityId: 'city_kenisibao', generalName: '容金根', portrait: '/assets/GERMANIC/tiaodun_qishi_wuerlixi.png', eliteName: '日耳曼民兵', eliteTier: 4 },
        { generalId: 'bfe_kniprode', factionId: 'tiaodun_qishi', cityId: 'city_kenisibao', generalName: '克尼普罗德', portrait: '/assets/GERMANIC/bfe_kniprode.png', eliteName: '条顿骑士', eliteTier: 2 },
    ],






    xierhe: { generalId: 'xierhe_saerjue', cityId: 'city_qihe', generalName: '塞尔柱', portrait: '/assets/CENTRAL_ASIA/xierhe_saerjue.png', eliteName: '河中骑兵', eliteTier: 4 },






    // ── 2026-08-04 新增：多涅茨（哈尔科夫团上校，抗鞑靼、扩建团境）──






    // ── 2026-08-04 新增：萨布罗夫（沃罗涅日首任督军，主持建堡）──






    peilieya_gongguo: { generalId: 'gen_vladimir_monomakh', cityId: 'city_peilieyasilafu', generalName: '莫诺马赫', portrait: '/assets/SLAVIC/peilieya_gongguo_monuomahe.png', eliteName: '罗斯重骑', eliteTier: 3 },














    qin: [
        { generalId: 'qin_hengyi', factionId: 'qin', cityId: 'city_changan', generalName: '桓齮', portrait: '/assets/CENTRAL/qin_hengyi.png', eliteName: '秦关中军', eliteTier: 3 },   // 🔴 [2026-10-25 按史] 成名战敌将；秦将，前233 肥下败走桓齮；据点长安（CENTRAL，秦本部同文化）；用势力精锐铁鹰锐士







        { generalId: 'qin_simacuo', cityId: 'city_changan', generalName: '司马错', portrait: '/assets/CENTRAL/qin_simacuo.png', eliteName: '秦巴蜀军', eliteTier: 3 },







        // 🔴 [2026-10-20 主人令「放到离他事发地最近的相同建筑风格文化的据点」「所有武将都这么处理，不要擅自添加据点」] 事发地＝助光武夹击隗嚣陇右战 → 最近同风格据点天水







        { generalId: 'bfe_niu_han', cityId: 'city_tianshui', generalName: '牛邯', portrait: '/assets/CENTRAL/bfe_niu_han.png' , legionName: '古典时代华夏军团', eliteName: '陇西骑兵', eliteTier: 4},







    
        { generalId: 'wazhai_zhanghan', factionId: 'qin', cityId: 'city_changan', generalName: '章邯', portrait: '/assets/CENTRAL/wazhai_zhanghan.png', eliteName: '骊山刑徒', eliteTier: 2 },
















    
        { generalId: 'ruo_wangjian', factionId: 'qin', cityId: 'city_changan', generalName: '王翦', portrait: '/assets/CENTRAL/ruo_wangjian.png', eliteName: '秦锐士', eliteTier: 1 },
















    
        { generalId: 'yangshao_zhoubo', factionId: 'han_d', cityId: 'city_changan', generalName: '周勃', portrait: '/assets/CENTRAL/yangshao_zhoubo.png', eliteName: '沛县子弟', eliteTier: 3 },
















    
        { generalId: 'xin_baiqi', cityId: 'city_changan', generalName: '白起', portrait: '/assets/CENTRAL/xin_baiqi.png', factionId: 'qin' , eliteName: '上党锐骑', eliteTier: 2 },
















    
        { generalId: 'shangzhou_shangyang', factionId: 'qin', cityId: 'city_shangluo', generalName: '商鞅', portrait: '/assets/CENTRAL/shangzhou_shangyang.png', eliteName: '中原郡兵', eliteTier: 4 },
















    
        { generalId: 'baiyang_mengtian', factionId: 'qin', cityId: 'city_fushi', generalName: '蒙恬', portrait: '/assets/XIANBEI/baiyang_mengtian.png', eliteName: '秦北军', eliteTier: 2 },   // 🔴 [2026-10-24 主人核定] 蒙恬＝秦上郡守将，长年驻节上郡肤施（统三十万北击匈奴、筑长城直道）→ 迁肤施；军团随中原文化自动取
















    
        { generalId: 'chile_hulvjin', factionId: 'gaoqi_d', cityId: 'city_taiyuan', legionName: '封建时代河朔军团', generalName: '斛律金', portrait: '/assets/XIANBEI/chile_hulvjin.png', eliteName: '河朔骑兵', eliteTier: 4 },
















        { generalId: 'song_zhangjun', cityId: 'city_lueyang', factionId: 'song', legionName: '城堡时代川峡军团', generalName: '张浚', portrait: '/assets/BASHU/song_zhangjun.png', eliteName: '巴蜀弩士', eliteTier: 4 },
        { generalId: 'bfe_zhangping', factionId: 'qin', cityId: 'city_changan', generalName: '章平', portrait: '/assets/CENTRAL/bfe_zhangping.png', eliteName: '好畤守军', eliteTier: 4 },
    ],







    tang: [
        { generalId: 'tang_qikerang', factionId: 'tang', cityId: 'city_tongguan', generalName: '齐克让', portrait: '/assets/CENTRAL/tang_qikerang.png', eliteName: '泰宁军', eliteTier: 4 },   // 🔴 [2026-10-25 按史] 成名战敌将；泰宁节度使，880 守潼关败走；唐势力精锐玄甲军为李世民专属不可承，给本镇军号泰宁军 T4（史载藩镇名）；据点潼关（CENTRAL）
        { generalId: 'bfe3_57', cityId: 'city_changan', generalName: '樊参', portrait: '/assets/CENTRAL/bfe3_57.png', factionId: 'han_d', legionName: '古典时代华夏军团', eliteName: '中原郡兵', eliteTier: 4 },
        { generalId: 'bfe_li_song', cityId: 'city_changan', generalName: '李松', portrait: '/assets/CENTRAL/bfe_li_song.png', factionId: 'han_d', legionName: '古典时代华夏军团', eliteName: '中原郡兵', eliteTier: 4 },
        { generalId: 'bfe3_35', cityId: 'city_changan', generalName: '公孙敖', portrait: '/assets/CENTRAL/bfe3_35.png', factionId: 'han_d', legionName: '古典时代华夏军团', eliteName: '中原郡兵', eliteTier: 4 },
        { generalId: 'bfe3_56', cityId: 'city_changan', generalName: '王寻', portrait: '/assets/CENTRAL/bfe3_56.png', factionId: 'dixiang', legionName: '古典时代华夏军团', eliteName: '中原郡兵', eliteTier: 4 },
        { generalId: 'bfe_ma_heluo', cityId: 'city_changan', generalName: '马何罗', portrait: '/assets/CENTRAL/bfe_ma_heluo.png', factionId: 'han_d', legionName: '古典时代华夏军团', eliteName: '中原郡兵', eliteTier: 4 },







        // 🔴 [2026-10-25 主人令「李必怎么成了玄甲军了，按标准修改」] 玄甲军＝李世民亲统的 T0 传奇精锐（虎牢关一战擒双王、奠定唐朝），
        //    只归李世民；写在他自己条目上，不靠势力兜底（否则唐势力其他武将都会继承 T0）。
        { generalId: 'tang_lishimin', cityId: 'city_changan', generalName: '李世民', portrait: '/assets/CENTRAL/tang_lishimin.png', eliteName: '玄甲军', eliteTier: 0 },
        // 🔴 [2026-10-20 主人令] 李信＝秦将（前225 攻楚被项燕大破）→ 长安（秦旗，CENTRAL）；古典时代华夏军团；立绘留空
        { generalId: 'gen_li_xin', cityId: 'city_changan', generalName: '李信', portrait: '/assets/CENTRAL/gen_li_xin.png', factionId: 'qin', legionName: '古典时代华夏军团' , eliteName: '灭燕军', eliteTier: 2}, // 前222 与王贲灭燕、代之本部







        // 屠睢（秦将，站长安、挂秦旗）







        { generalId: 'bfe3_14', cityId: 'city_changan', generalName: '屠睢', portrait: '/assets/CENTRAL/bfe3_14.png', legionName: '古典时代华夏军团', factionId: 'qin', eliteName: '秦锐士', eliteTier: 2 },   // 🔴 精锐随将：秦将配秦锐士（不配唐玄甲军）







        // 王离（秦将，站长安、挂秦旗）














        // 王龁（秦将，站长安、挂秦旗）







        { generalId: 'bfe3_9', cityId: 'city_changan', generalName: '王龁', portrait: '/assets/CENTRAL/bfe3_9.png', legionName: '古典时代华夏军团', factionId: 'qin', eliteName: '长平军', eliteTier: 3 },   // 前260 长平前期秦军本部







        // 胡阳（秦将，站长安、挂秦旗）







        { generalId: 'bfe3_7', cityId: 'city_changan', generalName: '胡阳', portrait: '/assets/CENTRAL/bfe3_7.png', legionName: '古典时代华夏军团', factionId: 'qin', eliteName: '秦锐士', eliteTier: 2 },   // 🔴 精锐随将：秦将配秦锐士（不配唐玄甲军）







        // 🔴 [2026-10-20 成名战规则] 李宓＝754 唐征南诏主帅（西洱河全军覆没）→ 长安·唐国；普将；立绘留空







        // 🔴 精锐随将：754 年李宓领的是剑南戍兵，不是李世民的玄甲军














        // 🔴 [2026-10-20 成名战规则] 朱泚＝784 据长安僭号的唐叛将（史实内战，双方同属唐国势力）→ 长安·唐国；普将；立绘留空
        // 🔴 [2026-10-28 主人令「一个势力不要开战，要不就分开势力」] 朱泚单立势力「大秦」（783 据长安称帝，国号秦，建元应天；784 改国号汉），
        //    不再挂在唐国下，免得奉天保卫战／收复长安战出现唐打唐。







        { generalId: 'tang_zhuci', cityId: 'city_changan', factionId: 'da_qin', generalName: '朱泚', portrait: '/assets/CENTRAL/tang_zhuci.png', legionName: '封建时代中原军团', eliteName: '泾原乱兵', eliteTier: 4 },







        // 🔴 [2026-10-20 主人「武将安置错误请修复，例如霍去病」] 霍去病：酒泉只是传说，他没有驻过；骠骑将军驻京师 → 长安（汉国）







        { generalId: 'suzhou_huoqubing', cityId: 'city_changan', generalName: '霍去病', portrait: '/assets/CENTRAL/suzhou_huoqubing.png', legionName: '古典时代华夏军团', factionId: 'han_d', eliteName: '骠骑铁骑', eliteTier: 1 },







        // 🔴 卫青：朔方是他收复的郡，不是驻地；大将军驻京师 → 长安（汉国）







        { generalId: 'shuofang_weiqing', cityId: 'city_chilechuan', generalName: '卫青', portrait: '/assets/CENTRAL/shuofang_weiqing.png', legionName: '古典时代太行军团', factionId: 'han_d', eliteName: '羽林铁骑', eliteTier: 1 },







        // 🔴 [2026-10-20 主人令「遇到问题先看符合历史，下结论再动手」] 成名战回补安置按史实复核：宇文述＝隋左卫大将军，驻隋都大兴（长安）；汉东（随州）只是杨坚封地，与他无涉 → 放长安（tang，风格 CENTRAL）；仍挂本政权 sui
        { generalId: 'sui_yuwenshu', cityId: 'city_changan', legionName: '封建时代中原军团', factionId: 'sui', generalName: '宇文述', portrait: '/assets/CENTRAL/sui_yuwenshu.png' , eliteName: '隋军府兵', eliteTier: 4 },
        // 🔴 [2026-10-20 主人令「遇到问题先看符合历史，下结论再动手」] 成名战回补安置按史实复核：汪乔年＝明陕西总督，总督衙门驻西安（长安）；1642 襄城之败是出潼关救援 → 放长安（tang，风格 CENTRAL）；仍挂本政权 ming_d
        { generalId: 'gen_wang_qiaonian', cityId: 'city_changan', factionId: 'ming_d', generalName: '汪乔年', portrait: '/assets/CENTRAL/gen_wang_qiaonian.png', eliteName: '中原郡兵', eliteTier: 4 },
    
        { generalId: 'tongzhou_liuzhiyuan', cityId: 'city_taiyuan', factionId: 'hou_han', generalName: '刘知远', portrait: '/assets/WEI/tongzhou_liuzhiyuan.png', legionName: '封建时代河朔军团', eliteName: '河朔骑兵', eliteTier: 4 },
        { generalId: 'xin_liuchong', cityId: 'city_taiyuan', factionId: 'hou_han', generalName: '刘崇', portrait: '/assets/WEI/xin_liuchong.png', legionName: '封建时代河朔军团', eliteName: '河朔骑兵', eliteTier: 4 },
        { generalId: 'bing_liji', factionId: 'tang', cityId: 'city_taiyuan', legionName: '封建时代河朔军团', generalName: '李勣', portrait: '/assets/WEI/bing_liji.png', eliteName: '通漠道行军', eliteTier: 2  },   // 按史：李勣以并州都督出任通漠道行军总管，自并州北出白道破颉利（《旧唐书·卷六七·李勣传》）
        { generalId: 'shatuo_likeyong', cityId: 'city_guanglu', generalName: '李克用', portrait: '/assets/WEI/shatuo_likeyong.png', factionId: 'shatuo', eliteName: '鸦儿军', eliteTier: 1 },   // 按史：李克用所部号鸦儿军，长期为河东主力（《旧五代史·武皇纪》）；李存勖另配其亲军从马直，不把父子两代的本部混作两支。
        { generalId: 'qingyuan_bd_zhoudewei', cityId: 'city_taiyuan', legionName: '封建时代河朔军团', generalName: '周德威', portrait: '/assets/WEI/qingyuan_bd_zhoudewei.png', factionId: 'shatuo', eliteName: '白马突骑', eliteTier: 3 },
        { generalId: 'song_wangbing', cityId: 'city_taiyuan', legionName: '城堡时代燕云军团', generalName: '王禀', portrait: '/assets/WEI/song_wangbing.png', factionId: 'song', eliteName: '河朔骑兵', eliteTier: 4 },
        { generalId: 'liwang_liguangbi', cityId: 'city_taiyuan', legionName: '封建时代河朔军团', generalName: '李光弼', portrait: '/assets/WEI/liwang_liguangbi.png', factionId: 'tang', eliteName: '河东军', eliteTier: 2 },








    
        { generalId: 'zhongshan_yangaoqing', factionId: 'tang', cityId: 'city_zhending', legionName: '封建时代河朔军团', generalName: '颜杲卿', portrait: '/assets/WEI/zhongshan_yangaoqing.png', eliteName: '常山义兵', eliteTier: 4  },   // 按史：颜杲卿摄常山太守，相与起义兵断贼归路，城陷被执（《旧唐书·卷一八七下·颜杲卿传》）








    
        { generalId: 'pingyuan_yanzhenqing', factionId: 'tang', cityId: 'city_pingyuan', legionName: '封建时代河朔军团', generalName: '颜真卿', portrait: '/assets/WEI/pingyuan_yanzhenqing.png', eliteName: '河北义军', eliteTier: 3  },   // 按史：颜真卿守平原首唱大顺，河北诸郡义军共推为盟主（《旧唐书·卷一二八·颜真卿传》）








    
        { generalId: 'loufan_xuerengui', factionId: 'tang', cityId: 'city_yanmenguan', legionName: '封建时代河朔军团', generalName: '薛仁贵', portrait: '/assets/WEI/loufan_xuerengui.png', eliteName: '代州铁骑', eliteTier: 3  },   // 按史：薛仁贵检校代州都督，率代州兵云州破突厥元珍（《旧唐书·卷八三·薛仁贵传》）








    
        { generalId: 'weihaiwei_sudingfang', factionId: 'tang', cityId: 'city_luoyang', legionName: '封建时代河朔军团', generalName: '苏定方', portrait: '/assets/WEI/weihaiwei_sudingfang.png', eliteName: '神丘道行军', eliteTier: 2  },   // 按史：苏定方为神丘道行军大总管伐百济，自城山（文登）济海（《玉海·卷一八一》引《通鉴》）








    
        { generalId: 'yaozhou_limaozhen', factionId: 'tang', cityId: 'city_qishan', generalName: '李茂贞', portrait: '/assets/CENTRAL/yaozhou_limaozhen.png', eliteName: '凤翔军', eliteTier: 3  },   // 按史：据凤翔开岐王府，所统为凤翔镇兵；据点用岐山（凤翔府属县，代凤翔）（《资治通鉴·卷二五六》）








    
        { generalId: 'lai_wangshifan', factionId: 'tang', cityId: 'city_linzi', generalName: '王师范', portrait: '/assets/CENTRAL/lai_wangshifan.png', eliteName: '平卢军', eliteTier: 2  },   // 按史：平卢节度使、权淄青留后，镇青州；据点用临淄（青州属县，代青州）（《资治通鉴·卷二六四》）








    
        { generalId: 'cai_lishuo', factionId: 'hou_zhao', cityId: 'city_xingtai', legionName: '古典时代太行军团', generalName: '石勒', portrait: '/assets/CENTRAL/cai_lishuo.png', eliteName: '后赵铁骑', eliteTier: 2 },








    
        { generalId: 'yuan_cj_d_lishuo', factionId: 'tang', cityId: 'city_xiangyang', generalName: '李愬', portrait: '/assets/CENTRAL/yuan_cj_d_lishuo.png', eliteName: '六院兵马', eliteTier: 2  },   // 按史：李愬唐随牙队三千号六院兵马，皆山南东道精锐（《通鉴纪事本末》）








    
        { generalId: 'lingwu_guoziyi', cityId: 'city_binzhou2', generalName: '郭子仪', portrait: '/assets/CENTRAL/lingwu_guoziyi.png', factionId: 'tang', eliteName: '朔方军', eliteTier: 1 },








    
        { generalId: 'qianzhou_lisheng', cityId: 'city_changan', generalName: '李晟', portrait: '/assets/CENTRAL/qianzhou_lisheng.png', factionId: 'tang', eliteName: '神策军', eliteTier: 1 },   // 按史：李晟统神策军收复长安、平朱泚，神策军为长期禁军主力（《旧唐书·李晟传》《新唐书·兵志》）。








    
        { generalId: 'song2_houjunji', factionId: 'tang', cityId: 'city_songzhou', legionName: '封建时代剑南军团', generalName: '侯君集', portrait: '/assets/BASHU/song2_houjunji.png', eliteName: '当弥道行军', eliteTier: 2  },   // 按史：侯君集任当弥道行军大总管救松州，步骑五万击退吐蕃（《资治通鉴·卷一九五》）








    
        { generalId: 'zuo_d_wufu', factionId: 'ming_d', cityId: 'city_qingxiguan', generalName: '吴复', portrait: '/assets/BASHU/zuo_d_wufu.png', eliteName: '巴蜀弩士', eliteTier: 4 },








    
        { generalId: 'zangke_xielongyu', factionId: 'tang', cityId: 'city_shengjingguan', legionName: '封建时代剑南军团', generalName: '谢龙羽', portrait: '/assets/BASHU/zangke_xielongyu.png', eliteName: '牂州部兵', eliteTier: 4  },   // 按史：牂牁蛮首领，唐授牂州刺史，胜兵数万（《旧唐书·卷一九七·南蛮传》）








    
        { generalId: 'weizhou_weigao', factionId: 'tang', cityId: 'city_shimenguan', legionName: '封建时代剑南军团', eliteName: '剑南西川军', eliteTier: 1, generalName: '韦皋', portrait: '/assets/BASHU/weizhou_weigao.png' },








    
        { generalId: 'qiufu_qiufu', factionId: 'qiufu', cityId: 'city_shanxian', legionName: '起义军', generalName: '裘甫', portrait: '/assets/JIANGNAN/qiufu_qiufu.png', eliteName: '江南郡兵', eliteTier: 4 },








    
        { generalId: 'gumie_liuyu', factionId: 'manzhou_d', cityId: 'city_quzhou', legionName: '帝国时代两江军团', generalName: '李之芳', portrait: '/assets/JIANGNAN/gumie_liuyu.png', eliteName: '浙江督标', eliteTier: 4  },   // 按史：李之芳任浙江总督，统浙江绿营督标（《清史稿·李之芳传》）








    
        { generalId: 'chendiaoyan_chendiaoyan', factionId: 'chendiaoyan', cityId: 'city_zhangzhou', legionName: '起义军', generalName: '陈吊眼', portrait: '/assets/JIANGNAN/chendiaoyan_chendiaoyan.png', eliteName: '荆楚兵', eliteTier: 4 },








    
        { generalId: 'kejia_wentianxiang', factionId: 'song', cityId: 'city_tingzhou', legionName: '城堡时代江南军团', generalName: '黄凤', portrait: '/assets/JIANGNAN/kejia_huangfeng.png', eliteName: '荆楚兵', eliteTier: 4 },








    
        { generalId: 'yezongliu_yezongliu', factionId: 'yezongliu', cityId: 'city_chuzhou_zj', legionName: '起义军', generalName: '叶宗留', portrait: '/assets/JIANGNAN/yezongliu_yezongliu.png', eliteName: '江南郡兵', eliteTier: 4 },








    
        { generalId: 'chaozhou_d_mafa', factionId: 'song', cityId: 'city_haiyang', legionName: '城堡时代江南军团', generalName: '马发', portrait: '/assets/JIANGNAN/chaozhou_d_mafa.png', eliteName: '荆楚兵', eliteTier: 4 },








    
        { generalId: 'chunshen_huangxie', factionId: 'chuguo', cityId: 'city_gusu', legionName: '古典时代吴越军团', generalName: '黄歇', portrait: '/assets/JIANGNAN/chunshen_huangxie.png', eliteName: '江南郡兵', eliteTier: 4 },








    
        { generalId: 'leizhou_limao', factionId: 'tang', cityId: 'city_haikang', legionName: '封建时代江淮军团', generalName: '李茂', portrait: '/assets/JIANGNAN/leizhou_limao.png', eliteName: '雷州戍兵', eliteTier: 4  },   // 按史：唐雷州州兵戍守；李茂事迹无载，无专属番号（《新唐书·地理志》雷州条）








    
        { generalId: 'wang_s_wanghua', factionId: 'tang', cityId: 'city_yixian', legionName: '封建时代江淮军团', generalName: '汪华', portrait: '/assets/JIANGNAN/wang_s_wanghua.png', eliteName: '歙州义军', eliteTier: 4  },   // 按史：汪华据黟歙自保十余年，兼有歙宣杭睦婺饶六州之众（《旧唐书·卷五六·王雄诞传》）








    
        { generalId: 'jiang_s_huanggai', factionId: 'sunwu_d', cityId: 'city_wuling', legionName: '古典时代吴越军团', generalName: '黄盖', portrait: '/assets/JIANGNAN/jiang_s_huanggai.png', eliteName: '荆楚兵', eliteTier: 4 },








    
        { generalId: 'chenzhou_d_zhanghao', factionId: 'tang', cityId: 'city_bianliang', legionName: '封建时代中原军团', generalName: '张镐', portrait: '/assets/JIANGNAN/chenzhou_d_zhanghao.png', eliteName: '河南军', eliteTier: 4  },   // 按史：张镐兼河南节度使，诏以本军镇汴州（《旧唐书·卷一一一·张镐传》）








    
        { generalId: 'hongzhou_zhuwenzheng', factionId: 'ming_d', cityId: 'city_hongzhou', generalName: '朱文正', portrait: '/assets/JIANGNAN/hongzhou_zhuwenzheng.png', eliteName: '洪都守军', eliteTier: 3 },
        { generalId: 'bfe_zhu_chenhao', cityId: 'city_hongzhou', generalName: '朱宸濠', portrait: '/assets/JIANGNAN/bfe_zhu_chenhao.png', factionId: 'ming_d', legionName: '帝国时代两江军团', eliteName: '江南郡兵', eliteTier: 4 },








    
        { generalId: 'heng_hetengjiao', factionId: 'longwu', cityId: 'city_linzheng', legionName: '帝国时代两江军团', generalName: '何腾蛟', portrait: '/assets/JIANGNAN/heng_hetengjiao.png', eliteName: '荆楚兵', eliteTier: 4 },








    
        { generalId: 'shaozhou_zhangzhensun', factionId: 'song', cityId: 'city_panyu', legionName: '城堡时代江南军团', generalName: '张镇孙', portrait: '/assets/JIANGNAN/shaozhou_zhangzhensun.png', eliteName: '荆楚兵', eliteTier: 4 },








    
        { generalId: 'liuzhou_shenxiyi', factionId: 'ming_d', cityId: 'city_tanzhong', legionName: '帝国时代两江军团', generalName: '沈希仪', portrait: '/assets/JIANGNAN/liuzhou_shenxiyi.png', eliteName: '荆楚兵', eliteTier: 4 },








    
        { generalId: 'dingxiang_d_lijing', factionId: 'tang', cityId: 'city_piantouguan', legionName: '封建时代河朔军团', generalName: '李靖', portrait: '/assets/XIANBEI/dingxiang_d_lijing.png', eliteName: '定襄骁骑', eliteTier: 0  },   // 按史：李靖以定襄骁骑夜袭破颉利，继灭东突厥，直接改写漠南格局，符合 v3 T0（《旧唐书·卷六七·李靖传》）。








    
        { generalId: 'xingxingxia_guoxiaoke', factionId: 'tang', cityId: 'city_yiluolucheng', legionName: '封建时代安西军团', generalName: '郭孝恪', portrait: '/assets/KHITAN/xingxingxia_guoxiaoke.png', eliteName: '昆丘道行军', eliteTier: 2  },   // 按史：郭孝恪为昆丘道副大总管平龟兹，攻破伊逻卢（《旧唐书·卷八三·郭孝恪传》）








    
        { generalId: 'heyuan_d_heichichangzhi', factionId: 'tang', cityId: 'city_huashixia', legionName: '封建时代河西军团', generalName: '黑齿常之', portrait: '/assets/KHITAN/heyuan_d_heichichangzhi.png', eliteName: '河源军', eliteTier: 2  },   // 按史：黑齿常之拜河源军经略大使，良非川率精骑三千夜袭破吐蕃（《旧唐书·卷一〇九·黑齿常之传》）








    
        { generalId: 'guazhou_zhangshougui', factionId: 'tang', cityId: 'city_jinchangcheng', legionName: '封建时代河西军团', generalName: '张守珪', portrait: '/assets/KHITAN/guazhou_zhangshougui.png', eliteName: '墨离军', eliteTier: 2  },   // 按史：张守珪为瓜州刺史、墨离军使，城上置酒疑兵破吐蕃（《旧唐书·卷一〇三·张守珪传》）








    
        { generalId: 'wei2_hunjian', factionId: 'tang', cityId: 'city_fengtian', legionName: '封建时代中原军团', generalName: '浑瑊', portrait: '/assets/KHITAN/wei2_hunjian.png', eliteName: '奉天行营', eliteTier: 2  },   // 按史：浑瑊为奉天行营兵马副元帅，奉天守城中流矢格斗不已（《旧唐书·卷一三四·浑瑊传》）








    
        { generalId: 'pugu_puguhuaien', cityId: 'city_lingzhou', legionName: '封建时代河西军团', generalName: '仆固怀恩', portrait: '/assets/KHITAN/pugu_puguhuaien.png', factionId: 'tang', eliteName: '朔方突骑', eliteTier: 1 },
        { generalId: 'song_peiji', cityId: 'city_dasanguan', generalName: '裴济', portrait: '/assets/KHITAN/song_peiji.png', factionId: 'song', eliteName: '中原郡兵', eliteTier: 4 },








    
        { generalId: 'shanzhou_wangzhongsi', factionId: 'tang', cityId: 'city_lingzhou', legionName: '封建时代河西军团', generalName: '王忠嗣', portrait: '/assets/KHITAN/shanzhou_wangzhongsi.png', eliteName: '陇右骁骑', eliteTier: 1  },   // 按史：王忠嗣为朔方节度使（治灵州），频战青海、积石皆大克捷（《旧唐书·卷一〇三·王忠嗣传》）
        { generalId: 'gaoliang_geshuhan', cityId: 'city_ledou', factionId: 'tang', generalName: '哥舒翰', portrait: '/assets/KHITAN/gaoliang_geshuhan.png', legionName: '封建时代河西军团', eliteName: '河曲雕骑', eliteTier: 3  },   // 按史：哥舒翰久镇河曲、陇右，积石军设伏破吐蕃；恢复旧档专属番号，河源军独归黑齿常之（《旧唐书·哥舒翰传》）








    
        { generalId: 'jiashi_wangxuance', factionId: 'tang', cityId: 'city_changan', legionName: '封建时代中原军团', generalName: '王玄策', portrait: '/assets/TIBET/jiashi_wangxuance.png', eliteName: '吐蕃借兵', eliteTier: 3  },   // 按史：王玄策官右卫率长史（东宫右卫率府，驻长安）（《资治通鉴·卷一九九》）








        { generalId: 'fushi_wangmeng', factionId: 'fushi', cityId: 'city_changan', legionName: '古典时代华夏军团', generalName: '王猛', portrait: '/assets/BASHU/fushi_wangmeng.png', eliteName: '前秦锐士', eliteTier: 3 },
        { generalId: 'zhuozhou_anshouzhong', factionId: 'da_yan', cityId: 'city_changan', legionName: '封建时代中原军团', generalName: '安守忠', portrait: '/assets/WEI/zhuozhou_anshouzhong.png', eliteName: '中原郡兵', eliteTier: 4 },
        { generalId: 'tujue_xielikehan', factionId: 'tujue', cityId: 'city_yanran', generalName: '颉利可汗', portrait: '/assets/MONGOL/tujue_xielikehan.png', eliteName: '蒙古骑手', eliteTier: 4 },
        { generalId: 'beidi_yaochang', eliteName: '关陇铁骑', eliteTier: 1, factionId: 'hou_qin', cityId: 'city_changan', legionName: '古典时代华夏军团', generalName: '姚苌', portrait: '/assets/CENTRAL/beidi_yaochang.png' },

        // 🔴 [2026-10-24 险要补将·名将] 郭元振＝唐安西大都护、凉州都督；久视元年（700）吐蕃麹莽布支犯凉州，于赤亭大破之、斩获万余（《旧唐书·郭元振传》）；精锐「安西锐士」T3
        { generalId: 'tang_guoyuanzhen', generalName: '郭元振', factionId: 'tang', cityId: 'city_chiting', portrait: '/assets/WESTERN/tang_guoyuanzhen.png', eliteName: '安西锐士', eliteTier: 3 },
    ],







    wuzhou_d: [
        { generalId: 'bfe3_76', cityId: 'city_luoyang', generalName: '曹爽', portrait: '/assets/CENTRAL/bfe3_76.png', factionId: 'wei', legionName: '古典时代华夏军团', eliteName: '武卫营', eliteTier: 4  },   // 按史：曹爽弟曹训为武卫将军，尽据禁兵（《三国志·卷九·曹爽传》）
        { generalId: 'wuzhou_d_wuzetian', factionId: 'wuzhou_d', cityId: 'city_luoyang', generalName: '武则天', portrait: '/assets/CENTRAL/wuzhou_d_wuzetian.png', eliteName: '中原郡兵', eliteTier: 4 },
        { generalId: 'bfe_prince_chao', cityId: 'city_luoyang', generalName: '王子朝', portrait: '/assets/CENTRAL/bfe_prince_chao.png', factionId: 'zhou', legionName: '古典时代华夏军团', eliteName: '中原郡兵', eliteTier: 4 },
        // 🔴 [2026-10-20 主人令「遇到问题先看符合历史，下结论再动手」] 成名战回补安置按史实复核：元英＝北魏中山王，507 钟离之战时北魏已于 494 年迁都洛阳，大同（平城）已非都城 → 放洛阳（wuzhou_d，风格 CENTRAL）；仍挂本政权 tuoba
        { generalId: 'tuoba_yuanying', cityId: 'city_luoyang', factionId: 'tuoba', legionName: '古典时代华夏军团', generalName: '元英', portrait: '/assets/CENTRAL/tuoba_yuanying.png', eliteName: '中原郡兵', eliteTier: 4 },
        { generalId: 'gen_shi_chaoyi', factionId: 'da_yan', cityId: 'city_luoyang', generalName: '史朝义', portrait: '/assets/WEI/gen_shi_chaoyi.png', legionName: '封建时代中原军团' , eliteName: '范阳铁骑', eliteTier: 3},
        { generalId: 'bfe_likaigu', factionId: 'wuzhou_d', cityId: 'city_luoyang', generalName: '李楷固', portrait: '/assets/CENTRAL/bfe_likaigu.png', eliteName: '玉钤卫兵', eliteTier: 4 },
    ],







    ming_d: [



        { generalId: 'ming_d_zhudi', cityId: 'city_beijing', generalName: '朱棣', portrait: '/assets/WEI/ming_d_zhudi.png', eliteName: '三千营', eliteTier: 1 },



        // 🔴 [2026-10-20 成名战规则] 王振＝明司礼监太监（1449 土木堡之变统军乱政，死于乱军）→ 北京（WEI）；城堡时代燕云军团；立绘留空



        { generalId: 'gen_wangzhen', cityId: 'city_beijing', generalName: '王振', portrait: '/assets/WEI/gen_wangzhen.png', eliteName: '河朔骑兵', eliteTier: 4 },



        // 🔴 [2026-10-20 成名战规则] 王通＝明征夷将军（1426 崒泥关洞被黎利击败）→ 北京（WEI）；城堡时代燕云军团；立绘留空






        // 🔴 [2026-10-20 成名战规则] 王骥＝明兵部尚书（三征麓川，1441 潞江）→ 北京（WEI）；城堡时代燕云军团；立绘留空



        { generalId: 'gen_wang_ji', factionId: 'ming_d', cityId: 'city_tengyuecheng', generalName: '王骥', portrait: '/assets/WEI/gen_wang_ji.png', eliteName: '京营铁骑', eliteTier: 3 },

        // 🔴 [2026-10-20 成名战规则] 仇鸾＝明大同总兵（1550 庚戌之变勤王统帅）→ 北京（WEI）；城堡时代燕云军团；立绘留空


        // 🔴 [2026-10-20 成名战规则] 杨镐＝明辽东经略（1619 萨尔浒四路丧师）→ 北京（WEI）；城堡时代燕云军团；立绘留空


        // 🔴 [2026-10-20 成名战规则／2026-10-25 校正] 洪承畴＝明蓟辽总督（1639 起督蓟辽、1640 进驻宁远，1642 松锦被俘降清）
        //    → 宁远城（WEI 河朔，据点已按史改正）；成名 1641 松锦＝17 世纪＝帝国时代，军团走「时代×据点文化」自动＝帝国时代燕晋军团；立绘留空
        { generalId: 'gen_hong_chengchou', factionId: 'ming_d', cityId: 'city_ningyuan', generalName: '洪承畴', portrait: '/assets/WEI/gen_hong_chengchou.png', eliteName: '辽东铁骑', eliteTier: 2 },




    
        { generalId: 'linhu_mafang', factionId: 'ming_d', cityId: 'city_piantouguan', legionName: '帝国时代燕晋军团', generalName: '马芳', portrait: '/assets/WEI/linhu_mafang.png', eliteName: '河朔骑兵', eliteTier: 4 },








    
        { generalId: 'yi_yuqian', factionId: 'ming_d', cityId: 'city_beijing', generalName: '于谦', portrait: '/assets/WEI/yi_yuqian.png', eliteName: '京师守军', eliteTier: 3 },
        // 🔴 [2026-10-24 主人授权新增] 杨洪（1381–1451）＝明宣府镇总兵，正统年间镇守宣府，土木堡之变后独守宣府城（也先挟英宗至城下，洪闭门不纳）；宣化空缺（完颜承裕迁回会宁府）→ 按史补驻将。立绘留空
        { generalId: 'ming_yanghong', factionId: 'ming_d', cityId: 'city_xuanhua', generalName: '杨洪', portrait: '/assets/WEI/ming_yanghong.png', eliteName: '宣府铁骑', eliteTier: 3 },
        // 🔴 [2026-10-24 主人令「执行」] 郭威（904–954）＝后周太祖，后汉末以枢密使领邺都留守（邺都＝安阳），951 澶州兵变受拥立；库里原无此人。立绘留空
        { generalId: 'hou_zhou_guowei', factionId: 'hou_zhou', cityId: 'city_anyang', generalName: '郭威', portrait: '/assets/CENTRAL/hou_zhou_guowei.png', eliteName: '后周禁军', eliteTier: 2 },
        // 🔴 [2026-10-24 主人令「执行」] 李继隆（950–1005）＝北宋名将，1004 澶州之战率静塞军守澶州（濮阳＝澶州）；库里原无此人。立绘留空
        { generalId: 'song_lijilong', factionId: 'song', cityId: 'city_puyang', generalName: '李继隆', portrait: '/assets/CENTRAL/song_lijilong.png', eliteName: '静塞军', eliteTier: 2 },








    
        { generalId: 'linyu_wusangui', factionId: 'ming_d', cityId: 'city_shanhaiguan', legionName: '帝国时代燕晋军团', generalName: '吴三桂', portrait: '/assets/WEI/linyu_wusangui.png', eliteName: '关宁铁骑', eliteTier: 1 },








    
        { generalId: 'jinzhou_lichengliang', factionId: 'ming_d', cityId: 'city_tuhe', legionName: '帝国时代燕晋军团', generalName: '李成梁', portrait: '/assets/WEI/jinzhou_lichengliang.png', eliteName: '辽东铁骑', eliteTier: 2 },








    
        { generalId: 'shanrong_lanyu', factionId: 'ming_d', cityId: 'city_wuzhong', generalName: '蓝玉', portrait: '/assets/WEI/shanrong_lanyu.png', eliteName: '亲军铁骑', eliteTier: 3 },
        { generalId: 'li_lx_d_liguang', cityId: 'city_wuzhong', generalName: '李广', portrait: '/assets/WEI/li_lx_d_liguang.png', legionName: '古典时代太行军团', factionId: 'han_d', eliteName: '河朔骑兵', eliteTier: 4 },








    
        { generalId: 'xuan_xuda', factionId: 'ming_d', cityId: 'city_beijing', generalName: '徐达', portrait: '/assets/WEI/xuan_xuda.png', eliteName: '明军锐士', eliteTier: 3 },








    
        { generalId: 'yansui_wangwei', factionId: 'ming_d', cityId: 'city_yulin', legionName: '帝国时代燕晋军团', generalName: '王威', portrait: '/assets/WEI/yansui_wangwei.png', eliteName: '河朔骑兵', eliteTier: 4 },








    
        { generalId: 'jinan_tiexuan', factionId: 'ming_d', cityId: 'city_licheng', generalName: '铁铉', portrait: '/assets/CENTRAL/jinan_tiexuan.png', eliteName: '济南守军', eliteTier: 3 },








    
        { generalId: 'sunqin_sunchuanting', factionId: 'ming_d', cityId: 'city_tongguan', legionName: '帝国时代中国军团', generalName: '孙传庭', portrait: '/assets/CENTRAL/sunqin_sunchuanting.png', eliteName: '秦兵', eliteTier: 3 },








    
        { generalId: 'suzhou_d_shikefa', factionId: 'ming_d', cityId: 'city_huaiyin', legionName: '帝国时代中国军团', generalName: '史可法', portrait: '/assets/CENTRAL/suzhou_d_shikefa.png', eliteName: '中原郡兵', eliteTier: 4 },








    
        { generalId: 'huai_zhuyuanzhang', factionId: 'ming_d', cityId: 'city_nanjing', generalName: '朱元璋', portrait: '/assets/CENTRAL/huai_zhuyuanzhang.png', eliteName: '淮西子弟', eliteTier: 2 },








    
        { generalId: 'luming_luxiangsheng', factionId: 'ming_d', cityId: 'city_daming', generalName: '卢象升', portrait: '/assets/CENTRAL/luming_luxiangsheng.png', eliteName: '天雄军', eliteTier: 2 },   // 🔴 [2026-10-28 史实复核] 卢象升长期镇守、治兵、建军之所是大名（崇祯二年至六年知大名府、整饬大名兵备道整整4年，募大名子弟创「天雄军」保卫大名府）；崇祯六年冬抚治郧阳仅数月且一直在外追剿流寇，非其长期镇守据点。精锐为天雄军（T2）。同城合挂：田承嗣（唐魏博）、麴义（袁绍）。








    
        { generalId: 'yang_bozhou_yangyinglong', factionId: 'yang_bozhou', cityId: 'city_hailongtun', legionName: '帝国时代四川军团', generalName: '杨应龙', portrait: '/assets/BASHU/yang_bozhou_yangyinglong.png', eliteName: '巴蜀弩士', eliteTier: 4 },








    
        { generalId: 'wumeng_azi', factionId: 'wumeng', cityId: 'city_shimenguan', legionName: '城堡时代川峡军团', generalName: '阿资', portrait: '/assets/BASHU/wumeng_azi.png', eliteName: '巴蜀弩士', eliteTier: 4 },








    
        { generalId: 'tan_d_qinhou', factionId: 'tan_d', cityId: 'city_cili', legionName: '城堡时代川峡军团', generalName: '覃垕', portrait: '/assets/BASHU/tan_d_qinhou.png', eliteName: '荆楚兵', eliteTier: 4 },








    
        { generalId: 'ran_d_ranshouzhong', factionId: 'ming_d', cityId: 'city_xiushan', generalName: '冉守忠', portrait: '/assets/BASHU/ran_d_ranshouzhong.png', eliteName: '巴蜀弩士', eliteTier: 4 },








    
        { generalId: 'she_shechongming', factionId: 'she', cityId: 'city_yongning2', legionName: '帝国时代四川军团', generalName: '奢崇明', portrait: '/assets/BASHU/she_shechongming.png', eliteName: '巴蜀弩士', eliteTier: 4 },








    
        { generalId: 'qian_songjingyang', factionId: 'song', cityId: 'city_juzhou', generalName: '宋景阳', portrait: '/assets/BASHU/qian_songjingyang.png', eliteName: '巴蜀弩士', eliteTier: 4 },








    
        { generalId: 'tujia_d_qinliangyu', factionId: 'ming_d', cityId: 'city_shizhu', legionName: '帝国时代四川军团', generalName: '秦良玉', portrait: '/assets/BASHU/tujia_d_qinliangyu.png', eliteName: '白杆兵', eliteTier: 1 },








    
        { generalId: 'mu_lijiang_muzeng', factionId: 'ming_d', cityId: 'city_dayan', legionName: '帝国时代四川军团', generalName: '木增', portrait: '/assets/BASHU/mu_lijiang_muzeng.png', eliteName: '巴蜀弩士', eliteTier: 4 },








    
        { generalId: 'pingnan_muying', factionId: 'ming_d', cityId: 'city_tuodongcheng', generalName: '沐英', portrait: '/assets/BASHU/pingnan_muying.png', eliteName: '云南卫军', eliteTier: 3 },








    
        { generalId: 'boren_ada', factionId: 'boren', cityId: 'city_bodao', legionName: '帝国时代四川军团', generalName: '阿大', portrait: '/assets/BASHU/boren_ada.png', eliteName: '巴蜀弩士', eliteTier: 4 },








    
        { generalId: 'hani_d_zhebi', factionId: 'ming_d', cityId: 'city_situo', legionName: '帝国时代四川军团', generalName: '遮比', portrait: '/assets/BASHU/hani_d_zhebi.png', eliteName: '巴蜀弩士', eliteTier: 4 },








    
        { generalId: 'dayu_wangshouren', factionId: 'ming_d', cityId: 'city_qianzhou', legionName: '帝国时代两江军团', generalName: '王守仁', portrait: '/assets/JIANGNAN/dayu_wangshouren.png', eliteName: '阳明乡兵', eliteTier: 3 },
        { generalId: 'dayu_liqianshi', factionId: 'nan_liang', cityId: 'city_qianzhou', generalName: '李迁仕', portrait: '/assets/JIANGNAN/dayu_liqianshi.png', legionName: '封建时代江淮军团' , eliteName: '高州部曲', eliteTier: 4 },   // 🔴 李迁仕是高州刺史，部曲（原配「南赣标军」是明代的）








    
        { generalId: 'hu_d_husansheng', factionId: 'ming_d', cityId: 'city_wuwei', generalName: '吴允诚', portrait: '/assets/JIANGNAN/hu_d_husansheng.png', eliteName: '契丹骑手', eliteTier: 4 },








    
        { generalId: 'fang_guozhen_fangguozhen', factionId: 'ming_d', cityId: 'city_qingyuan_zj', legionName: '帝国时代两江军团', generalName: '卢镗', portrait: '/assets/JIANGNAN/fang_guozhen_fangguozhen.png', eliteName: '江南郡兵', eliteTier: 4 },








    
        { generalId: 'xinjiang_maji', factionId: 'song', cityId: 'city_lingqu', legionName: '城堡时代江南军团', generalName: '马塈', portrait: '/assets/JIANGNAN/xinjiang_maji.png', eliteName: '荆楚兵', eliteTier: 4 },








    
        { generalId: 'xiang_d_xiangdakun', factionId: 'ming_d', cityId: 'city_laifeng', legionName: '帝国时代两江军团', generalName: '覃大旺', portrait: '/assets/JIANGNAN/xiang_d_xiangdakun.png', eliteName: '荆楚兵', eliteTier: 4 },








    
        { generalId: 'guizhou_lidingguo', factionId: 'longwu', cityId: 'city_tuodongcheng', legionName: '帝国时代四川军团', generalName: '李定国', portrait: '/assets/JIANGNAN/guizhou_lidingguo.png', eliteName: '滇黔象兵', eliteTier: 3 },








    
        { generalId: 'chizhou_changyuchun', factionId: 'ming_d', cityId: 'city_datong2', generalName: '常遇春', portrait: '/assets/JIANGNAN/chizhou_changyuchun.png', eliteName: '前锋铁骑', eliteTier: 3 },








    
        { generalId: 'haikou_wangzhi', factionId: 'haikou', cityId: 'city_yuanzhishi', generalName: '汪直', portrait: '/assets/JIANGNAN/haikou_wangzhi.png', legionName: '起义军', eliteName: '日本足轻', eliteTier: 4 },








    
        { generalId: 'qi_d_qijiguang', factionId: 'ming_d', cityId: 'city_taizhou_zj', legionName: '帝国时代两江军团', generalName: '戚继光', portrait: '/assets/JIANGNAN/qi_d_qijiguang.png', eliteName: '戚家军', eliteTier: 1 },








    
        { generalId: 'hao_d_weirui', factionId: 'nan_liang', cityId: 'city_bengbu', legionName: '封建时代江淮军团', generalName: '韦睿', portrait: '/assets/JIANGNAN/hao_d_weirui.png', eliteName: '南梁锐卒', eliteTier: 3 },








    
        { generalId: 'dongshengwei_wangyue', factionId: 'ming_d', cityId: 'city_yulin', generalName: '王越', portrait: '/assets/XIANBEI/dongshengwei_wangyue.png', eliteName: '河套骑兵', eliteTier: 3 },








    
        { generalId: 'zu_d_yuanchonghuan', factionId: 'ming_d', cityId: 'city_ningyuan', generalName: '袁崇焕', portrait: '/assets/XIANBEI/zu_d_yuanchonghuan.png', eliteName: '关宁铁骑', eliteTier: 1 },








    
        { generalId: 'gen_feng_sheng', factionId: 'ming_d', cityId: 'city_jiuquan', generalName: '冯胜', portrait: '/assets/KHITAN/gen_feng_sheng.png', legionName: '帝国时代陕甘军团', eliteName: '河西铁骑', eliteTier: 3 },








    
        { generalId: 'chijin_qiewangshijia', factionId: 'ming_d', cityId: 'city_chijin', generalName: '且旺失加', portrait: '/assets/KHITAN/chijin_qiewangshijia.png', eliteName: '契丹骑手', eliteTier: 4 },








    
        { generalId: 'nuergan_kangwang', factionId: 'ming_d', cityId: 'city_nuergan', generalName: '康旺', portrait: '/assets/NORTHEAST/nuergan_kangwang.png', eliteName: '女真骑手', eliteTier: 4 },








    
        { generalId: 'mao_wenlong_maowenlong', factionId: 'ming_d', cityId: 'city_pidao', legionName: '帝国时代朝鲜军团', generalName: '毛文龙', portrait: '/assets/KOREA/mao_wenlong_maowenlong.png', eliteName: '朝鲜兵', eliteTier: 4 },








        { generalId: 'gen_kangxi', factionId: 'manzhou_d', cityId: 'city_shenyang', generalName: '康熙', portrait: '/assets/NORTHEAST/gen_kangxi.png', legionName: '帝国时代八旗军团', eliteName: '八旗骁骑', eliteTier: 3 },
        { generalId: 'ying_caojingzong', factionId: 'nan_liang', cityId: 'city_bengbu', legionName: '封建时代江淮军团', generalName: '曹景宗', portrait: '/assets/JIANGNAN/ying_caojingzong.png', eliteName: '南梁锐卒', eliteTier: 3 },
        { generalId: 'yuan_d_tuotuo', factionId: 'yuan_d', cityId: 'city_merkit', legionName: '城堡时代蒙古军团', generalName: '脱脱', portrait: '/assets/XIANBEI/yuan_d_tuotuo.png', eliteName: '蒙古骑手', eliteTier: 4 },
        { generalId: 'dajin_wanyanchengyu', factionId: 'dajin', cityId: 'city_huining', generalName: '完颜承裕', portrait: '/assets/NORTHEAST/dajin_wanyanchengyu.png', eliteName: '通远军', eliteTier: 4  },   // 🔴 [2026-10-25 按史] 通远军节度使（巩州，今陇西）、陕西兵马都统副使，野狐岭主帅（《金史·宗室传·承裕》）；巩州无据点 → 取最近同文化据点天水（秦州，同属陇右）；精锐与其本部通远军对应
        { generalId: 'dajin_wanyanheda', factionId: 'dajin', cityId: 'city_huining', legionName: '城堡时代女真军团', generalName: '完颜合达', portrait: '/assets/NORTHEAST/dajin_wanyanheda.png', eliteName: '亲卫军', eliteTier: 2  },   // 按史：完颜合达在卫州以亲卫军三千破蒙古（《金史·完颜合达传》）
        // 🔴 [2026-10-24 险要补将·镇守] 韩青＝明都指挥，1449 年也先攻紫荆关，死守殉国；普将；精锐「紫荆守军」T4
        { generalId: 'zijing_hanqing', generalName: '韩青', factionId: 'ming_d', cityId: 'city_zijingguan', portrait: '/assets/WEI/ming_d_hanqing.png', eliteName: '紫荆守军', eliteTier: 4 },
        // 🔴 [2026-10-24 险要补将·镇守] 周遇吉＝明山西总兵，1644 年守宁武关抗李自成，城破殉国（局部殉城，未改大局）；普将；精锐「宁武守军」T4
        { generalId: 'ningwu_zhouyuji', generalName: '周遇吉', factionId: 'ming_d', cityId: 'city_ningwuguan', portrait: '/assets/WEI/ming_d_zhouyuji.png', eliteName: '宁武守军', eliteTier: 4 },
        { generalId: 'ming_shenyourong', factionId: 'ming_d', cityId: 'city_penghu', generalName: '沈有容', portrait: '/assets/JIANGNAN/ming_shenyourong.png', eliteName: '澎湖水师', eliteTier: 4 },   // 🔴 [2026-10-25 新增] 1604 守澎湖、谕退荷兰韦麻郎（镇守/防御战）；普将；据点澎湖 JIANGNAN 文化
        { generalId: 'ming_d_wuweizhong', factionId: 'ming_d', cityId: 'city_hengyu', generalName: '吴惟忠', portrait: '/assets/JIANGNAN/ming_d_wuweizhong.png', eliteName: '横屿水师', eliteTier: 4 },   // 戚家军部将，1562 横屿之战涉海破倭（参战驻守横屿）
        { generalId: 'ming_d_tanlun', factionId: 'ming_d', cityId: 'city_gubeikou', generalName: '谭纶', portrait: '/assets/WEI/ming_d_tanlun.png', eliteName: '蓟镇守军', eliteTier: 3 },   // 明蓟辽总督，与戚继光同修古北口—山海关边墙（镇守古北口）
    ],






    shu: [
        { generalId: 'shu_haopu', factionId: 'shu', cityId: 'city_yongzhou_hn', generalName: '郝普', portrait: '', eliteName: '零陵郡兵', eliteTier: 4 },   // 🔴 [2026-11-01 补将] 零陵太守，守城不降（《三国战争史》引《三国志·吕蒙传》：惟零陵太守郝普守城不降）；文化随据点＝JIANGNAN
        { generalId: 'shu_masu', factionId: 'shu', cityId: 'city_chengdu', generalName: '马谡', portrait: '/assets/BASHU/shu_masu.png', eliteName: '巴蜀弩士', eliteTier: 4 },   // 🔴 [2026-10-25 按史] 成名战敌将；蜀汉参军，228 街亭大败；据点成都（BASHU）；用势力精锐白毦精兵
        { generalId: 'bfe3_83', cityId: 'city_chengdu', generalName: '李势', portrait: '/assets/BASHU/bfe3_83.png', factionId: 'chenghan', legionName: '古典时代巴蜀军团', eliteName: '巴蜀弩士', eliteTier: 4 },
        { generalId: 'bfe3_80', cityId: 'city_chengdu', generalName: '张微', portrait: '/assets/BASHU/bfe3_80.png', factionId: 'shu', legionName: '古典时代巴蜀军团', eliteName: '巴蜀弩士', eliteTier: 4 },
        { generalId: 'bfe3_2', cityId: 'city_chengdu', generalName: '芦子霸王', portrait: '/assets/BASHU/bfe3_2.png', factionId: 'shu', legionName: '古典时代巴蜀军团', eliteName: '巴蜀弩士', eliteTier: 4 },
        // 🔴 [2026-10-20 史实] 岳钟琪＝川陕总督，最知名驻扎成都；据点成都（BASHU）；帝国时代四川军团
        { generalId: 'qinghai_yuezhongqi', cityId: 'city_chengdu', generalName: '岳钟琪', portrait: '/assets/BASHU/qinghai_yuezhongqi.png', factionId: 'manzhou_d', legionName: '帝国时代四川军团', eliteName: '四川绿营', eliteTier: 3  },   // 按史：岳钟琪统四川绿营提标（《清史稿·岳钟琪传》）







        { generalId: 'shu_liubei', cityId: 'city_chengdu', generalName: '刘备', portrait: '/assets/BASHU/shu_liubei.png', eliteName: '白毦兵', eliteTier: 2 },







        // 名将双身份：诸葛瞻（据点武将＋剧本敌将）














    
        { generalId: 'mi_mizhu', factionId: 'shu', cityId: 'city_chengdu', legionName: '古典时代巴蜀军团', generalName: '麋竺', portrait: '/assets/CENTRAL/mi_mizhu.png', eliteName: '巴蜀弩士', eliteTier: 4 },








    
        { generalId: 'yangzhou_wangping', factionId: 'shu', cityId: 'city_yangxian', legionName: '古典时代华夏军团', generalName: '王平', portrait: '/assets/CENTRAL/yangzhou_wangping.png', eliteName: '无当飞军', eliteTier: 1 },








    
        { generalId: 'guo_jixin', factionId: 'han_d', cityId: 'city_hulaoguan', legionName: '古典时代华夏军团', generalName: '纪信', portrait: '/assets/BASHU/guo_jixin.png', eliteName: '中原郡兵', eliteTier: 4 },








    
        { generalId: 'zi_changhong', factionId: 'zhou', cityId: 'city_luoyang', generalName: '苌弘', portrait: '/assets/BASHU/zi_changhong.png' , legionName: '先秦军团', eliteName: '中原郡兵', eliteTier: 4 },








    
        { generalId: 'fu_zhou_yanyan', factionId: 'shu', cityId: 'city_chongqing', generalName: '严颜', portrait: '/assets/BASHU/fu_zhou_yanyan.png', eliteName: '巴蜀弩士', eliteTier: 4 },








    
        { generalId: 'lizhou_d_liaohua', factionId: 'shu', cityId: 'city_jianmenguan', generalName: '廖化', portrait: '/assets/BASHU/lizhou_d_liaohua.png', eliteName: '巴蜀弩士', eliteTier: 4 },
        { generalId: 'qingqiang_jiangwei', factionId: 'shu', cityId: 'city_jianmenguan', generalName: '姜维', portrait: '/assets/BASHU/qingqiang_jiangwei.png', eliteName: '陇西骑兵', eliteTier: 3 },








    
        { generalId: 'baishui_yanghuai', factionId: 'han_d', cityId: 'city_baishuiguan', legionName: '古典时代巴蜀军团', generalName: '杨怀', portrait: '/assets/BASHU/baishui_yanghuai.png', eliteName: '巴蜀弩士', eliteTier: 4 },








    
        { generalId: 'langzhou_zhangfei', factionId: 'shu', cityId: 'city_langzhong_gucheng', generalName: '张飞', portrait: '/assets/BASHU/langzhou_zhangfei.png', eliteName: '巴西突骑', eliteTier: 3 },








    
        { generalId: 'sou_gaodingyuan', factionId: 'sou', cityId: 'city_jianchang', generalName: '高定元', portrait: '/assets/BASHU/sou_gaodingyuan.png', eliteName: '巴蜀弩士', eliteTier: 4 },








    
        { generalId: 'huizhou_zhugeliang', factionId: 'shu', cityId: 'city_hanzhong', legionName: '古典时代华夏军团', generalName: '诸葛亮', portrait: '/assets/BASHU/huizhou_zhugeliang.png', eliteName: '元戎弩士', eliteTier: 2 },








    
        { generalId: 'yueyi_zhangyi', factionId: 'shu', cityId: 'city_yuegui', generalName: '张嶷', portrait: '/assets/BASHU/yueyi_zhangyi.png', eliteName: '巴蜀弩士', eliteTier: 4 },








    
        { generalId: 'nanzhong_mazhong', factionId: 'shu', cityId: 'city_tuodongcheng', generalName: '马忠', portrait: '/assets/BASHU/nanzhong_mazhong.png', eliteName: '南中夷兵', eliteTier: 3 },








    
        { generalId: 'jingmen_zhaoyun', factionId: 'shu', cityId: 'city_chengdu', legionName: '古典时代巴蜀军团', generalName: '赵云', portrait: '/assets/JIANGNAN/jingmen_zhaoyun.png', eliteName: '巴蜀弩士', eliteTier: 4 },








    
        { generalId: 'chen2_zhaofan', factionId: 'shu', cityId: 'city_guiyang', legionName: '古典时代吴越军团', generalName: '赵范', portrait: '/assets/JIANGNAN/chen2_zhaofan.png', eliteName: '荆楚兵', eliteTier: 4 },







        { generalId: 'tang_limi', factionId: 'tang', cityId: 'city_chengdu', generalName: '李宓', portrait: '/assets/CENTRAL/tang_limi.png', legionName: '封建时代剑南军团', eliteName: '剑南兵', eliteTier: 4 },
        { generalId: 'daxi_ming_zhangxianzhong', factionId: 'daxi_ming', cityId: 'city_chengdu', generalName: '张献忠', portrait: '/assets/BASHU/daxi_ming_zhangxianzhong.png', legionName: '起义军', eliteName: '大西军', eliteTier: 3 },
        { generalId: 'shu_mengda', factionId: 'shu', cityId: 'city_fangling', generalName: '孟达', portrait: '/assets/JIANGNAN/shu_mengda.png', eliteName: '房陵守军', eliteTier: 4 },   // 蜀汉宜都太守，后屯房陵、上庸置新城郡（镇守房陵）
        { generalId: 'shu_zhangyi', factionId: 'shu', cityId: 'city_fuling', generalName: '张翼', portrait: '/assets/BASHU/shu_zhangyi.png', eliteName: '涪陵守军', eliteTier: 4 },   // 蜀汉左车骑将军，历守涪陵、犍为等郡（镇守涪陵）
        { generalId: 'shu_hezhi', factionId: 'shu', cityId: 'city_leshan', generalName: '何祗', portrait: '/assets/BASHU/shu_hezhi.png', eliteName: '犍为郡兵', eliteTier: 4 },   // 蜀汉犍为太守，治南中、越嶲有声（镇守犍为，治所在今乐山）
        { generalId: 'shu_wulan', factionId: 'shu', cityId: 'city_huixian', generalName: '吴兰', portrait: '/assets/BASHU/shu_wulan.png', eliteName: '武都郡兵', eliteTier: 4 },   // 蜀汉将，218 下辨之战与曹洪、曹休对垒于武都（镇守武都）
    ],






    // cheng 阳安：岳钟琪已迁赤斤@赤金堡







    pagan: { generalId: 'pagan_anulvtuo', cityId: 'city_pagan', generalName: '阿奴律陀', portrait: '/assets/BURMESE/pagan_anulvtuo.png', eliteName: '蒲甘战象', eliteTier: 3 },






    qiuci: { generalId: 'qiuci_baiba', cityId: 'city_yiluolucheng', generalName: '白霸', portrait: '/assets/WESTERN/qiuci_baiba.png', eliteName: '西域兵', eliteTier: 4 },







    tubo: [







        { generalId: 'tubo_songzanganbu', cityId: 'city_luoxie', generalName: '松赞干布', portrait: '/assets/TIBET/tubo_songzanganbu.png', eliteName: '吐蕃禁军', eliteTier: 3 },







        // 🔴 [2026-10-20 成名战规则] 悉诺逻恭禄＝吐蕃名将（727 攻瓜州，被张守珪疑兵击退）→ 逻些·吐蕃；名将；立绘留空







        { generalId: 'tubo_xinuoluo', cityId: 'city_luoxie', generalName: '悉诺逻恭禄', portrait: '/assets/TIBET/tubo_xinuoluo.png', eliteName: '吐蕃禁军', eliteTier: 3 },







        // 🔴 [2026-10-20 成名战规则] 论莽热＝801 维州之战吐蕃主帅（被韦皋围歼）→ 逻些·吐蕃；普将；立绘留空







        { generalId: 'tubo_lunmangre', cityId: 'city_luoxie', generalName: '论莽热', portrait: '/assets/TIBET/tubo_lunmangre.png', eliteName: '吐蕃骑兵', eliteTier: 4 },














    
        { generalId: 'duomi_lunkongre', factionId: 'tubo', cityId: 'city_ledu', generalName: '论恐热', portrait: '/assets/KHITAN/duomi_lunkongre.png', eliteName: '吐蕃骑兵', eliteTier: 4 },








    
        { generalId: 'bailan_pabala', factionId: 'ganden', cityId: 'city_kangyanchuan', legionName: '城堡时代萨迦军团', generalName: '帕巴拉', portrait: '/assets/TIBET/bailan_pabala.png', eliteName: '吐蕃骑兵', eliteTier: 4 },








    
        { generalId: 'jiantang_sangjiejia', factionId: 'ganden', cityId: 'city_mufu', legionName: '帝国时代卫藏军团', generalName: '桑杰嘉措', portrait: '/assets/TIBET/jiantang_sangjiejiacuo.png', eliteName: '吐蕃骑兵', eliteTier: 4 },








    
        { generalId: 'gongbu_gongbumangbuzhi', factionId: 'tubo', cityId: 'city_nichi', generalName: '工布莽布支', portrait: '/assets/TIBET/gongbu_gongbumangbuzhi.png', eliteName: '吐蕃骑兵', eliteTier: 4 },








    
        { generalId: 'faqiang_niechizanpu', factionId: 'tubo', cityId: 'city_jiamachikang', legionName: '古典时代发羌军团', generalName: '聂赤', portrait: '/assets/TIBET/faqiang_niechizanpu.png', eliteName: '吐蕃骑兵', eliteTier: 4 },








    
        { generalId: 'spurgyal_dariniansai', factionId: 'tubo', cityId: 'city_jiamachikang', generalName: '达日年塞', portrait: '/assets/TIBET/spurgyal_dariniansai.png', eliteName: '吐蕃骑兵', eliteTier: 4 },








    
        { generalId: 'gar_lunqinling', factionId: 'tubo', cityId: 'city_dafeichuan', legionName: '封建时代吐蕃军团', generalName: '论钦陵', portrait: '/assets/TIBET/gar_lunqinling.png', eliteName: '吐蕃禁军', eliteTier: 3 },








    ],







    menggu_d: [
        { generalId: 'bfe_qutlugh_khwaja', factionId: 'menggu_d', cityId: 'city_almaliq', generalName: '忽都鲁火者', portrait: '/assets/CENTRAL_ASIA/bfe_qutlugh_khwaja.png', eliteName: '河中骑兵', eliteTier: 4 },   // 🔴 [2026-10-25 按史] 成名战敌将；察合台宗王，1303 攻德里不克；库无察合台汗国势力，以 menggu_d 蒙古代表；据点弓月城/阿力麻里（CENTRAL_ASIA）
        // 🔴 [2026-10-20 成名战规则] 却图汗＝喀尔喀蒙古却图汗（1637 青海湖被固始汗击败处死）；库无喀尔喀却图部势力，借蒙古（报告）；帝国时代喀尔喀军团；立绘留空
        { generalId: 'gen_chogtu_khan', cityId: 'city_karakorum', generalName: '却图汗', portrait: '/assets/MONGOL/gen_chogtu_khan.png', legionName: '帝国时代喀尔喀军团', eliteName: '喀尔喀重骑', eliteTier: 4  },   // 按史：却图汗为喀尔喀蒙古部首领（1637 青海湖败亡），与 1204 怯薛无涉；复用喀尔喀重骑 T4 同番号







        { generalId: 'menggu_d_chengjisihan', factionId: 'menggu_d', cityId: 'city_qudiaoalan', generalName: '成吉思汗', portrait: '/assets/MONGOL/menggu_d_chengjisihan.png', eliteName: '怯薛军', eliteTier: 0 },







        // 🔴 [2026-10-20 成名战规则] 蒙哥＝蒙古大汗（1259 攻钓鱼城，死于城下）→ 哈拉和林·蒙古；名将；封建×蒙古＝封建时代突厥军团；立绘留空







        { generalId: 'menggu_d_mongke', cityId: 'city_karakorum', legionName: '城堡时代蒙古军团', generalName: '蒙哥', portrait: '/assets/MONGOL/menggu_d_mongke.png', eliteName: '蒙古骑兵', eliteTier: 3 },







    
        { generalId: 'mengwu_hebulehan', factionId: 'menggu_d', cityId: 'city_langjuxu', generalName: '合不勒', portrait: '/assets/MONGOL/mengwu_hebulehan.png', eliteName: '蒙古部兵', eliteTier: 4  },   // 按史：合不勒为蒙古部首位称汗者（12 世纪前期），无怯薛








    
        { generalId: 'kiyad_yesugai', factionId: 'menggu_d', cityId: 'city_burhan', generalName: '也速该', portrait: '/assets/MONGOL/kiyad_yesugai.png', eliteName: '蒙古部兵', eliteTier: 4  },   // 按史：也速该为乞颜部首领、成吉思汗之父，卒时怯薛尚未成立








    
        { generalId: 'jalair_muhuali', factionId: 'menggu_d', cityId: 'city_kerulen', generalName: '木华黎', portrait: '/assets/MONGOL/jalair_muhuali.png', eliteName: '探马赤军', eliteTier: 1  },   // 按史：木华黎受命经略中原，所统为探马赤军（《元史·木华黎传》）








    
        { generalId: 'borjigin_tuolei', factionId: 'menggu_d', cityId: 'city_qudiaoalan', generalName: '拖雷', portrait: '/assets/MONGOL/borjigin_tuolei.png', eliteName: '雪你惕军', eliteTier: 2 },








    
        { generalId: 'wuliangha_subutai', factionId: 'menggu_d', cityId: 'city_saiyinshanda', generalName: '速不台', portrait: '/assets/MONGOL/wuliangha_subutai.png', eliteName: '兀良哈骑', eliteTier: 2  },   // 按史：速不台为兀良合（兀良哈）部人，本部部族千户骑兵（《元史·速不台传》）








    
        { generalId: 'manghuti_weidaer', factionId: 'menggu_d', cityId: 'city_wulihong', generalName: '畏答儿', portrait: '/assets/MONGOL/manghuti_weidaer.png', eliteName: '忙兀部兵', eliteTier: 4  },   // 按史：畏答儿为忙兀（忙忽惕）部首领，本部部族兵（《元史·畏答儿传》）








    
        { generalId: 'ogodei_chuoermahan', factionId: 'menggu_d', cityId: 'city_karakorum', legionName: '城堡时代蒙古军团', generalName: '绰儿马罕', portrait: '/assets/CENTRAL_ASIA/ogodei_chuoermahan.png', eliteName: '雪你惕军', eliteTier: 2  },   // 按史：绰儿马罕为雪你惕部人，西征统本部落军（《史集》）








        { generalId: 'bfe_youxian', factionId: 'menggu_d', cityId: 'city_xiangyang', generalName: '游显', portrait: '/assets/CENTRAL/bfe_youxian.png', eliteName: '襄阳驻军', eliteTier: 4 },
        { generalId: 'bfe_umar', factionId: 'yuan_d', cityId: 'city_hailing', generalName: '乌马儿', portrait: '/assets/WEI/bfe_umar.png', eliteName: '元军水师', eliteTier: 3 },   // 🔴 [2026-10-26 按史] 至元十三年（1276）以万户从阿术攻宋、受命守泰州（今江苏泰州＝海陵，江南文化）；原晋兴（邕州）是「无对应城取最近同文化城」兜底，非其驻扎地（《新元史·乌马儿传》）
        { generalId: 'bfe_chagatai', factionId: 'menggu_d', cityId: 'city_almaliq', generalName: '察合台', portrait: '/assets/CENTRAL_ASIA/bfe_chagatai.png', eliteName: '察合台军', eliteTier: 2 },
        { generalId: 'bfe_yibula', factionId: 'menggu_d', cityId: 'city_guihua', generalName: '亦不剌', portrait: '/assets/XIANBEI/bfe_yibula.png', eliteName: '鄂尔多斯骑', eliteTier: 3 },
    ],







    bohai: [







        { generalId: 'bohai_dazuorong', cityId: 'city_aodongcheng', generalName: '大祚荣', portrait: '/assets/NORTHEAST/bohai_dazuorong.png', eliteName: '渤海靺鞨', eliteTier: 3 },







        // 🔴 [2026-10-20 成名战规则] 大諲撰＝渤海末王（926 辽太祖攻灭忽汗城）→ 龙泉府·渤海；普将；立绘留空







        { generalId: 'bohai_dayinzhuan', cityId: 'city_ningan', generalName: '大諲撰', portrait: '/assets/NORTHEAST/bohai_dayinzhuan.png', eliteName: '女真骑手', eliteTier: 4 },







    
        { generalId: 'luzhou_zhangwenxiu', factionId: 'bohai', cityId: 'city_yalu', generalName: '张文休', portrait: '/assets/NORTHEAST/luzhou_zhangwenxiu.png', eliteName: '女真骑手', eliteTier: 4 },








    ],







    goryeo: [








        { generalId: 'goryeo_jianghanzan', cityId: 'city_kaesong', generalName: '姜邯赞', portrait: '/assets/KOREA/goryeo_jianghanzan.png', eliteName: '高丽护军', eliteTier: 3 },
        { generalId: 'woju_yinguan', factionId: 'goryeo', cityId: 'city_hamhung', legionName: '城堡时代高丽军团', generalName: '尹瓘', portrait: '/assets/KOREA/woju_yinguan.png', eliteName: '朝鲜兵', eliteTier: 4 },








    
        { generalId: 'ssangseong_cuiying', factionId: 'goryeo', cityId: 'city_kaesong', legionName: '城堡时代高丽军团', generalName: '崔莹', portrait: '/assets/KOREA/ssangseong_cuiying.png', eliteName: '高丽护军', eliteTier: 3 },








    
        { generalId: 'ssangseong_lizichun', factionId: 'goryeo', cityId: 'city_cheollyeong', legionName: '城堡时代高丽军团', generalName: '李子春', portrait: '/assets/KOREA/ssangseong_lizichun.png', eliteName: '朝鲜兵', eliteTier: 4 },








        { generalId: 'bfe_wanggeon', factionId: 'goryeo', cityId: 'city_kaesong', generalName: '松岳王建', portrait: '/assets/KOREA/bfe_wanggeon.png', eliteName: '高丽护军', eliteTier: 3 },
    ],







    yamato: [
        // 🔴 [2026-10-25 主人令「加一个最知名的就可以了」] 平安时代最知名者＝坂上田村麻吕（征夷大将军，758–811）；
        //    势力 大和（大和朝廷，封建时代）；据点 京都＝平安京（JAPAN 文化）；立绘按铁律留空；精锐「征夷军」T2。
        { generalId: 'yamato_sakanouenotamuramaro', factionId: 'yamato', cityId: 'city_kyoto', generalName: '坂上田村麻吕', portrait: '/assets/JAPAN/yamato_sakanouenotamuramaro.png', eliteName: '征夷军', eliteTier: 2 },
    ],
    ashikaga: [
        { generalId: 'ashikaga_zulizunshi', cityId: 'city_kyoto', generalName: '足利尊氏', portrait: '/assets/JAPAN/ashikaga_zulizunshi.png', eliteName: '足利武士', eliteTier: 3 },
        // 🔴 [2026-10-20 成名战规则] 明智光秀＝织田家臣（1582 本能寺之变后山崎败死）；库无明智势力，借室町（京都，报告）；城堡时代幕府军团；立绘留空
        { generalId: 'gen_akechi_mitsuhide', cityId: 'city_kyoto', generalName: '明智光秀', portrait: '/assets/JAPAN/gen_akechi_mitsuhide.png', legionName: '城堡时代幕府军团', eliteName: '明智铁炮', eliteTier: 3 },
    ],







    tiemuer: { generalId: 'tiemuer_tiemuer', cityId: 'city_samaerhan', generalName: '帖木儿', portrait: '/assets/CENTRAL_ASIA/tiemuer_tiemuer.png', eliteName: '帖木儿骑', eliteTier: 1 },







    siam: [
        { generalId: 'siam_nalixuan', cityId: 'city_ayutthaya', generalName: '纳黎萱', portrait: '/assets/KHMER/siam_nalixuan.png', eliteName: '高棉战象', eliteTier: 2 },
        { generalId: 'bfe_mahathammaracha', factionId: 'siam', cityId: 'city_ayutthaya', generalName: '玛欣他拉', portrait: '/assets/KHMER/bfe_mahathammaracha.png', eliteName: '暹罗战象', eliteTier: 4 },
    ],







    shang: [














        { generalId: 'shang_fuhao', cityId: 'city_anyang', generalName: '妇好', portrait: '/assets/CENTRAL/shang_fuhao.png' , legionName: '先秦军团', eliteName: '中原郡兵', eliteTier: 4 },







    
        { generalId: 'yin_dixin', cityId: 'city_zhaoge', generalName: '子受', portrait: '/assets/CENTRAL/yin_dixin.png', factionId: 'shang' , legionName: '先秦军团' , eliteName: '虎贲多射', eliteTier: 2 },








        { generalId: 'bfe3_87', factionId: 'murong', cityId: 'city_jicheng', generalName: '慕容评', portrait: '/assets/WEI/bfe3_87.png', eliteName: '漠南骑手', eliteTier: 4 },
        { generalId: 'bfe3_71', factionId: 'yuan_shao', cityId: 'city_anyang', generalName: '袁绍', portrait: '/assets/WEI/bfe3_71.png', legionName: '古典时代华夏军团' , eliteName: '大戟士', eliteTier: 2},   // 按史：大戟士为袁绍帐下重甲步兵；界桥先登由麴义亲统，先登营归麴义，不再主将混挂（《后汉书·袁绍传》裴注《英雄记》）。
        { generalId: 'bfe3_88', factionId: 'fushi', cityId: 'city_anyang', generalName: '苻融', portrait: '/assets/BASHU/bfe3_88.png', legionName: '古典时代华夏军团' , eliteName: '前秦卫军', eliteTier: 3},
    ],






    min: { generalId: 'min_wangshenzhi', cityId: 'city_fuzhou', generalName: '王审知', portrait: '/assets/JIANGNAN/min_wangshenzhi.png', eliteName: '荆楚兵', eliteTier: 4 },






    han_d: [
        { generalId: 'han_d_pengyue', factionId: 'han_d', cityId: 'city_dingtao', generalName: '彭越', portrait: '', eliteName: '梁地游兵', eliteTier: 4 },   // 🔴 [2026-11-01 补将] 梁王都定陶；据点=定陶（空据点补将）；文化随据点＝CENTRAL
        { generalId: 'han_d_wuyang', factionId: 'han_d', cityId: 'city_chenzhou2', generalName: '吴阳', portrait: '', eliteName: '沅陵戍卒', eliteTier: 4 },   // 🔴 [2026-11-01 补将] 汉沅陵侯，长沙王吴芮之后，居沅陵（黔中故地）；文化随据点＝JIANGNAN
        { generalId: 'han_d_sunang', factionId: 'han_d', cityId: 'city_xiaoguan', generalName: '孙卬', portrait: '', eliteName: '北地戍卒', eliteTier: 4 },   // 🔴 [2026-11-01 补将] 汉北地都尉，前166 匈奴入萧关力战殉职（《西汉军事史》：突入朝那、萧关…斩杀都尉孙卬）；文化随据点＝CENTRAL







        { generalId: 'han_d_liubang', cityId: 'city_hanzhong', generalName: '刘邦', portrait: '/assets/CENTRAL/han_d_liubang.png', eliteName: '砀郡子弟', eliteTier: 3 },







        // 名将双身份：李广利（据点武将＋剧本敌将）







        { generalId: 'bfe3_36', cityId: 'city_changan', generalName: '李广利', portrait: '/assets/CENTRAL/bfe3_36.png', legionName: '古典时代华夏军团', eliteName: '属国胡骑', eliteTier: 3 },   // 🔴 [2026-10-24 主人纠错] 李广利＝汉将（中原/华夏文化），奥什（贰师城）是西域文化，同文化硬约束第一 → 不能放奥什，回长安；出征地只能在同文化前提下才作依据







    
        { generalId: 'xianyu_hanxin', factionId: 'han_d', cityId: 'city_linzi', legionName: '古典时代华夏军团', generalName: '韩信', portrait: '/assets/WEI/xianyu_hanxin.png', eliteName: '汉军材官', eliteTier: 2 },








    
        { generalId: 'jingzhou_gs_huangfusong', factionId: 'han_d', cityId: 'city_hanguguan', generalName: '皇甫嵩', portrait: '/assets/CENTRAL/jingzhou_gs_huangfusong.png', eliteName: '西园八校', eliteTier: 2 },








    
        { generalId: 'jibei_wangkuang', factionId: 'han_d', cityId: 'city_boyang', generalName: '王匡', portrait: '/assets/CENTRAL/jibei_wangkuang.png', eliteName: '中原郡兵', eliteTier: 4 },








    
        { generalId: 'huaiyang_zhouyafu', factionId: 'han_d', cityId: 'city_changan', generalName: '周亚夫', portrait: '/assets/CENTRAL/huaiyang_zhouyafu.png', eliteName: '细柳营', eliteTier: 1 },








    
        { generalId: 'ruzhou_sunjian', factionId: 'sunwu_d', cityId: 'city_changsha', legionName: '古典时代吴越军团', generalName: '孙坚', portrait: '/assets/CENTRAL/ruzhou_sunjian.png', eliteName: '长沙子弟', eliteTier: 3 },








    
        { generalId: 'xiayang_d_dengyu', factionId: 'han_d', cityId: 'city_luoyang', generalName: '邓禹', portrait: '/assets/CENTRAL/xiayang_d_dengyu.png', eliteName: '河北突骑', eliteTier: 3 },








    
        { generalId: 'kuai_kuaiyue', factionId: 'han_d', cityId: 'city_xiangyang', generalName: '蒯越', portrait: '/assets/CENTRAL/kuai_kuaiyue.png', eliteName: '荆楚兵', eliteTier: 4 },








    
        { generalId: 'guide_d_xiaohe', factionId: 'han_d', cityId: 'city_yongcheng', generalName: '萧何', portrait: '/assets/CENTRAL/guide_d_xiaohe.png', eliteName: '中原郡兵', eliteTier: 4 },








    
        { generalId: 'lulin_liuxiu', factionId: 'han_d', cityId: 'city_kunyang', generalName: '刘秀', portrait: '/assets/CENTRAL/lulin_liuxiu.png', eliteName: '幽州突骑', eliteTier: 1 },








    
        { generalId: 'qiong_rengui', factionId: 'qiong', cityId: 'city_jianchang', legionName: '古典时代巴蜀军团', generalName: '任贵', portrait: '/assets/BASHU/qiong_rengui.png', eliteName: '巴蜀弩士', eliteTier: 4 },








    
        { generalId: 'zhuoshi_gaopian', factionId: 'tang', cityId: 'city_chengdu', legionName: '封建时代剑南军团', generalName: '高骈', portrait: '/assets/BASHU/zhuoshi_gaopian.png', eliteName: '井阑劲卒', eliteTier: 3  },   // 按史：高骈镇西川，发步骑五千追南诏至大渡河（《资治通鉴·卷二五二》）








    
        { generalId: 'liu_yingbu', factionId: 'han_d', cityId: 'city_liuxian', legionName: '古典时代吴越军团', generalName: '英布', portrait: '/assets/JIANGNAN/liu_yingbu.png', eliteName: '九江兵', eliteTier: 3 },








    
        { generalId: 'li_s_mayuan', factionId: 'han_d', cityId: 'city_hepu', legionName: '古典时代吴越军团', generalName: '马援', portrait: '/assets/JIANGNAN/li_s_mayuan.png', eliteName: '伏波军', eliteTier: 2 },









    
        { generalId: 'chu_d_lukang', factionId: 'han_d', cityId: 'city_qianshan', legionName: '古典时代吴越军团', generalName: '陆康', portrait: '/assets/JIANGNAN/wan_lukang.png', eliteName: '江南郡兵', eliteTier: 4 },







    
        { generalId: 'guangxin_shixie', factionId: 'sunwu_d', cityId: 'city_shenglong', legionName: '古典时代交趾军团', generalName: '士燮', portrait: '/assets/JIANGNAN/guangxin_shixie.png', eliteName: '越南民兵', eliteTier: 4 },







    
        { generalId: 'weiming_weiminglinggong', factionId: 'dangxiang', cityId: 'city_jilusai', generalName: '嵬名山', portrait: '/assets/XIANBEI/weiming_weiminglinggong.png', eliteName: '契丹骑手', eliteTier: 4 },







    
        { generalId: 'wuyuan_d_chengui', factionId: 'han_d', cityId: 'city_chilechuan', legionName: '古典时代太行军团', generalName: '陈龟', portrait: '/assets/XIANBEI/wuyuan_d_chengui.png', eliteName: '河朔骑兵', eliteTier: 4 },







    
        { generalId: 'jiluo_d_douxian', factionId: 'han_d', cityId: 'city_luoyang', legionName: '古典时代华夏军团', generalName: '窦宪', portrait: '/assets/MONGOL/jiluo_d_douxian.png', eliteName: '北军五校', eliteTier: 2 },







    
        { generalId: 'shuofang_sujian', cityId: 'city_quyancheng', generalName: '苏建', portrait: '/assets/XIANBEI/shuofang_sujian.png', factionId: 'han_d', legionName: '古典时代凉州军团', eliteName: '契丹骑手', eliteTier: 4 },







    
        { generalId: 'woye_huangfugui', factionId: 'han_d', cityId: 'city_jilusai', legionName: '古典时代凉州军团', generalName: '皇甫规', portrait: '/assets/XIANBEI/woye_huangfugui.png', eliteName: '契丹骑手', eliteTier: 4 },







    
        { generalId: 'dongsheng_weishang', factionId: 'han_d', cityId: 'city_chilechuan', legionName: '古典时代太行军团', generalName: '魏尚', portrait: '/assets/XIANBEI/dongsheng_weishang.png', eliteName: '河朔骑兵', eliteTier: 4 },







    
        { generalId: 'ganzhou_dourong', factionId: 'han_d', cityId: 'city_zhangye', legionName: '古典时代凉州军团', generalName: '窦融', portrait: '/assets/KHITAN/ganzhou_dourong.png', eliteName: '河西铁骑', eliteTier: 2 },







    
        { generalId: 'lanzhou_zhaochongguo', factionId: 'han_d', cityId: 'city_lanzhou', legionName: '古典时代凉州军团', generalName: '赵充国', portrait: '/assets/KHITAN/lanzhou_zhaochongguo.png', eliteName: '湟中屯田', eliteTier: 3 },
        { generalId: 'xining_yangyingju', cityId: 'city_lanzhou', generalName: '杨应琚', portrait: '/assets/KHITAN/xining_yangyingju.png', factionId: 'manzhou_d', legionName: '帝国时代陕甘军团', eliteName: '陕甘督标', eliteTier: 4  },   // 按史：杨应琚统陕甘绿营督标（《清史稿·杨应琚传》）







    
        { generalId: 'xiutu_jinridi', factionId: 'han_d', cityId: 'city_changan', legionName: '古典时代华夏军团', generalName: '金日磾', portrait: '/assets/KHITAN/xiutu_jinridi.png', eliteName: '中原郡兵', eliteTier: 4 },







    







    
        { generalId: 'quli_chentang', factionId: 'han_d', cityId: 'city_luntai', legionName: '古典时代凉州军团', generalName: '陈汤', portrait: '/assets/KHITAN/quli_chentang.png', eliteName: '西域都护', eliteTier: 3 },
        { generalId: 'bfe3_45', cityId: 'city_luntai', generalName: '郑吉', portrait: '/assets/KHITAN/bfe3_45.png', factionId: 'han_d', legionName: '古典时代凉州军团', eliteName: '契丹骑手', eliteTier: 4 },







    
        { generalId: 'lushui_dongzhuo', factionId: 'yangguan', cityId: 'city_luoyang', legionName: '古典时代华夏军团', generalName: '董卓', portrait: '/assets/KHITAN/lushui_dongzhuo.png', eliteName: '飞熊军', eliteTier: 2 },
        { generalId: 'bfe3_69', factionId: 'yangguan', cityId: 'city_guangchengguan', generalName: '华雄', portrait: '/assets/KHITAN/bfe3_69.png', legionName: '古典时代华夏军团' , eliteName: '飞熊军', eliteTier: 2},







    
        { generalId: 'guangwu_xinwuxian', factionId: 'han_d', cityId: 'city_lingju', legionName: '古典时代凉州军团', generalName: '辛武贤', portrait: '/assets/KHITAN/guangwu_xinwuxian.png', eliteName: '河西骑兵', eliteTier: 3 },







    
        { generalId: 'ningkou_liling', factionId: 'han_d', cityId: 'city_zhangye', legionName: '古典时代凉州军团', generalName: '李陵', portrait: '/assets/KHITAN/ningkou_liling.png', eliteName: '契丹骑手', eliteTier: 4 },







    
        { generalId: 'xiyuduhu_banchao', factionId: 'han_d', cityId: 'city_taqian', legionName: '古典时代凉州军团', generalName: '班超', portrait: '/assets/KHITAN/xiyuduhu_banchao.png', eliteName: '疏勒精兵', eliteTier: 3 },
        // 🔴 [2026-10-26 主人令「窦固是汉，是中原，怎么能放西域呢？河西也行呀」→「两人可以放到河西吗？」]
        //    窦固＝汉显亲侯、奉车都尉（扶风平陵人，《后汉书·窦融列传》附传）：屯凉州、永平十六年出酒泉塞、
        //    十七年出敦煌昆仑塞（击车师）——河西是他实打实的屯驻与出征集合地，故归汉国、据点放**敦煌**（河西 KHITAN，通西域门户）。
        { generalId: 'pulei_dougu', factionId: 'han_d', cityId: 'city_dunhuang', generalName: '窦固', portrait: '/assets/WESTERN/pulei_dougu.png', eliteName: '河西骑兵', eliteTier: 3 },
        // 🔴 [2026-10-26 主人令「耿恭是东汉戊己校尉（汉将）…现在挂车师不对…要改」→「两人可以放到河西吗？」]
        //    耿恭＝东汉戊己校尉（《后汉书·耿恭传》），永平十七年屯车师后部金满城、守疏勒城拒匈奴；建初元年血战突围，
        //    「三月至玉门」（玉门关属敦煌郡，河西）。他屯的汉式屯城（今奇台石城子一带）无独立据点 →
        //    按 §2.1「无合适据点取离事发地最近的相同建筑风格据点」锚**玉门关**（河西 KHITAN，比敦煌更近；亦是他生还入关之地）。
        { generalId: 'chagatai_genggong', factionId: 'han_d', cityId: 'city_yumenguan', generalName: '耿恭', portrait: '/assets/WESTERN/chagatai_genggong.png', eliteName: '戊己屯军', eliteTier: 2 },








    
        { generalId: 'yanzhou_zhongshiheng', factionId: 'song', cityId: 'city_fangqu', generalName: '种世衡', portrait: '/assets/KHITAN/yanzhou_zhongshiheng.png', eliteName: '中原郡兵', eliteTier: 4 },







    
        { generalId: 'cangsong_machao', factionId: 'shu', cityId: 'city_chengdu', legionName: '古典时代巴蜀军团', generalName: '马超', portrait: '/assets/KHITAN/cangsong_machao.png', eliteName: '巴蜀弩士', eliteTier: 4 },







        { generalId: 'bfe3_18', factionId: 'zhao', cityId: 'city_jingxingguan', generalName: '陈馀', portrait: '/assets/CENTRAL/bfe3_18.png', legionName: '古典时代太行军团', eliteName: '河朔骑兵', eliteTier: 4 },
        { generalId: 'zhao_gerong', cityId: 'city_hejian', generalName: '葛荣', portrait: '/assets/CENTRAL/zhao_gerong.png', factionId: 'liuzhen', legionName: '起义军', eliteName: '河北流民', eliteTier: 3 },
        { generalId: 'wei_wuqi', factionId: 'wei', cityId: 'city_xiayangdu', generalName: '吴起', portrait: '/assets/WEI/wei_wuqi.png' , legionName: '先秦军团', eliteName: '中原郡兵', eliteTier: 4 },
        // 🔴 [2026-10-24 险要补将·镇守] 王梁＝东汉野王令，与河内太守缪逵「北守天井关」（《后汉书·王梁传》）；普将；精锐「野王戍卒」T4
        { generalId: 'tianjing_wangliang', generalName: '王梁', factionId: 'han_d', cityId: 'city_tianjinguan', portrait: '/assets/CENTRAL/han_d_wangliang.png', eliteName: '野王戍卒', eliteTier: 4 },
        // 🔴 [2026-10-25 险要补将·镇守] 索班＝东汉西域长史，延光二年领兵出玉门关、镇守伊吾；普将；精锐「伊吾戍卒」T4
        { generalId: 'yumen_suoban', generalName: '索班', factionId: 'han_d', cityId: 'city_yumenguan', portrait: '/assets/KHITAN/han_d_suoban.png', eliteName: '伊吾戍卒', eliteTier: 4 },
        // 🔴 [2026-10-25 险要补将·镇守] 李息＝汉武帝元鼎六年与徐自为营筑阳关、玉门关，屯兵镇守丝路南道；普将；精锐「阳关戍卒」T4
        { generalId: 'yangguan_lixi', generalName: '李息', factionId: 'han_d', cityId: 'city_yangguan', portrait: '/assets/KHITAN/han_d_lixi.png', eliteName: '阳关戍卒', eliteTier: 4 },
        { generalId: 'han_liubiao', factionId: 'han_d', cityId: 'city_xiangyang', generalName: '刘表', portrait: '/assets/JIANGNAN/han_liubiao.png', eliteName: '荆州兵', eliteTier: 3 },
        { generalId: 'han_yanbaihu', factionId: 'han_d', cityId: 'city_kuaiji', generalName: '严白虎', portrait: '/assets/JIANGNAN/han_yanbaihu.png', eliteName: '江东豪强', eliteTier: 4 },
        { generalId: 'han_yuji', factionId: 'han_d', cityId: 'city_gusu', generalName: '于吉', portrait: '/assets/JIANGNAN/han_yuji.png', eliteName: '符水道众', eliteTier: 4 },
        { generalId: 'han_lubode', factionId: 'han_d', cityId: 'city_juyansai', generalName: '路博德', portrait: '/assets/KHITAN/han_lubode.png', eliteName: '居延戍卒', eliteTier: 4 },   // 汉伏波将军：元鼎六年与公孙贺出九原，筑遮虏障、屯守居延边塞（镇守遮虏障）
    ],







    wei: [
        { generalId: 'bfe2_gongzi_ang', cityId: 'city_hedong', generalName: '公子卬', portrait: '/assets/WEI/bfe2_gongzi_ang.png', legionName: '古典时代太行军团', eliteName: '河朔骑兵', eliteTier: 4 },
    
        { generalId: 'liangshidu_longjia', factionId: 'wei', cityId: 'city_yinzhou', legionName: '古典时代太行军团', generalName: '龙贾', portrait: '/assets/WEI/liangshidu_longjia.png', eliteName: '河朔骑兵', eliteTier: 4 },








    
        { generalId: 'guzhu_tianyu', factionId: 'wei', cityId: 'city_beijing', legionName: '古典时代太行军团', generalName: '田豫', portrait: '/assets/WEI/guzhu_tianyu.png', eliteName: '辽西威锋', eliteTier: 3  },   // 按史：田豫持节护乌丸校尉、威震辽西；恢复旧档专属番号，乌桓突骑独归蹋顿（《三国志·田豫传》）








    
        { generalId: 'cao_d_caocao', factionId: 'wei', cityId: 'city_xuchang', legionName: '古典时代华夏军团', generalName: '曹操', portrait: '/assets/CENTRAL/cao_d_caocao.png', eliteName: '虎豹骑', eliteTier: 1  },   // 按史：曹操亲军虎豹骑，「纯所督虎豹骑，皆天下骁锐」（《三国志·卷九·曹纯传》裴注《魏书》）








    
        { generalId: 'bfe_wu_yuanji', cityId: 'city_xuanhu', generalName: '吴元济', portrait: '/assets/CENTRAL/bfe_wu_yuanji.png', factionId: 'tang', legionName: '封建时代中原军团', eliteName: '淮西军', eliteTier: 2  },   // 按史：淮西镇兵，铁城全歼高霞寓一路（《资治通鉴·卷二四〇》）








    
        { generalId: 'sima_d_simayi', factionId: 'dongjin', cityId: 'city_luoyang', legionName: '古典时代华夏军团', generalName: '司马懿', portrait: '/assets/CENTRAL/sima_d_simayi.png', eliteName: '魏中军', eliteTier: 3  },   // 按史：司马懿夺洛阳中军兵权、平辽东统中军（《三国志·卷九·曹爽传》）








    
        { generalId: 'bozhou_d_yujin', factionId: 'wei', cityId: 'city_xiangyang', legionName: '古典时代华夏军团', generalName: '于禁', portrait: '/assets/CENTRAL/bozhou_d_yujin.png', eliteName: '七军', eliteTier: 4  },   // 按史：于禁督七军救樊城，「禁等七军皆没」（《三国志·卷一七·于禁传》）








    
        { generalId: 'wudu_dengai', factionId: 'wei', cityId: 'city_ganquanyi', legionName: '古典时代巴蜀军团', generalName: '邓艾', portrait: '/assets/BASHU/wudu_dengai.png', eliteName: '陇右兵', eliteTier: 2  },   // 按史：邓艾自阴平道行无人之地七百余里灭蜀（《三国志·卷二八·邓艾传》）








    
        { generalId: 'huang_d_sunshuao', factionId: 'wei', cityId: 'city_huangchuan', legionName: '古典时代吴越军团', generalName: '贾逵', portrait: '/assets/JIANGNAN/huang_d_sunshuao.png', eliteName: '豫州兵', eliteTier: 4  },   // 按史：贾逵为豫州刺史，石亭多设旗鼓（《三国志·卷一五·贾逵传》）








    
        { generalId: 'lelang_wangqi', factionId: 'wei', cityId: 'city_xicheng', legionName: '古典时代高句丽军团', generalName: '王颀', portrait: '/assets/KOREA/lelang_wangqi.png', eliteName: '乐浪兵', eliteTier: 4  },   // 按史：王颀以玄菟太守从毌丘俭征高句丽，据点在乐浪境，取郡兵建制（《三国志·卷二八·毌丘俭传》）








        // 🔴 [2026-10-25 主人令「张郃、王经、强端（三国魏）、王衍（西晋）、项梁（秦末楚），请修复」]
        //    与战国魏／春秋晋／战国楚同名的势力编制指针是三级「先秦军团」，这三家后世武将不跟先秦指针，
        //    按格位（势力时代 × 据点文化）手写古典军团 —— 与曹操／曹爽／司马懿／于禁／邓艾同口径。
        { generalId: 'bfe_zhanghe', factionId: 'wei', cityId: 'city_anyang', legionName: '古典时代华夏军团', generalName: '张郃', portrait: '/assets/CENTRAL/bfe_zhanghe.png', eliteName: '河北突骑', eliteTier: 2 },
        { generalId: 'bfe_wangjing', factionId: 'wei', cityId: 'city_lintao', legionName: '古典时代华夏军团', generalName: '王经', portrait: '/assets/CENTRAL/bfe_wangjing.png', eliteName: '雍州戍兵', eliteTier: 4 },
        { generalId: 'wei_xuchu', factionId: 'wei', cityId: 'city_qiaojun', generalName: '许褚', portrait: '/assets/CENTRAL/wei_xuchu.png', eliteName: '虎卫军', eliteTier: 3 },   // 谯国谯人，汉末率宗族数千家坚壁于谯，后为曹操宿卫（镇守谯县）
    ],







    manzhou_d: [
        // 🔴 [2026-10-20 成名战规则] 明瑞＝清云贵总督（1768 新街之战败于缅军，自尽）→ 沈阳（NORTHEAST）；帝国时代八旗军团；立绘留空
        // 🔴 [2026-10-20 成名战规则] 傅尔丹＝清靖边将军（1731 和通泊败于噶尔丹策零）→ 沈阳（NORTHEAST）；帝国时代八旗军团；立绘留空
        // 🔴 [2026-10-20 成名战规则] 康熙帝＝清圣祖（1690 乌兰布通亲征噶尔丹）→ 沈阳（NORTHEAST）；帝国时代八旗军团；立绘留空

        { generalId: 'manzhou_d_duoergun', cityId: 'city_shenyang', generalName: '多尔衮', portrait: '/assets/NORTHEAST/manzhou_d_duoergun.png', eliteName: '八旗铁骑', eliteTier: 1 },

        // 🔴 [2026-10-20 成名战规则] 尼堪＝清敬谨亲王（1652 衡阳被李定国击毙）→ 沈阳（NORTHEAST）；城堡时代满洲军团；立绘留空

        { generalId: 'gen_nikan', cityId: 'city_shenyang', generalName: '尼堪', portrait: '/assets/NORTHEAST/gen_nikan.png', eliteName: '八旗骁骑', eliteTier: 3 },

    
        { generalId: 'mingzheng_jianzandechang', factionId: 'manzhou_d', cityId: 'city_dajianlu', generalName: '坚赞德昌', portrait: '/assets/BASHU/mingzheng_jianzandechang.png', eliteName: '明正土兵', eliteTier: 4  },   // 按史：坚参德昌为清 明正土司（乾隆十年袭职），统土兵（《清史稿·卷五一二·土司传》）；时代随大清＝帝国，军团自动取帝国时代四川军团








    
        { generalId: 'wazu_banhongwang', factionId: 'manzhou_d', cityId: 'city_cangyuan', legionName: '帝国时代四川军团', generalName: '胡玉山', portrait: '/assets/BASHU/wazu_banhongwang.png', eliteName: '班洪土兵', eliteTier: 4  },   // 按史：胡玉山为班洪佤族土司，统部落土兵








    
        { generalId: 'qianzhong_wubayue', factionId: 'miaomin', cityId: 'city_pinglong', legionName: '起义军', generalName: '吴八月', portrait: '/assets/JIANGNAN/qianzhong_wubayue.png', eliteName: '荆楚兵', eliteTier: 4 },








    
        { generalId: 'wenling_shilang', factionId: 'manzhou_d', cityId: 'city_qingjingsi', legionName: '帝国时代两江军团', generalName: '施琅', portrait: '/assets/JIANGNAN/wenling_shilang.png', eliteName: '福建水师', eliteTier: 2  },   // 按史：施琅统福建水师，澎湖一战平台（《清史稿·施琅传》）








    
        { generalId: 'merkit_boyan', factionId: 'yuan_d', cityId: 'city_karakorum', generalName: '伯颜', portrait: '/assets/MONGOL/merkit_boyan.png', eliteName: '蒙古骑兵', eliteTier: 3 },








    
        { generalId: 'wuli_d_celeng', factionId: 'manzhou_d', cityId: 'city_zhabuhanjuntai', legionName: '帝国时代喀尔喀军团', generalName: '策棱', portrait: '/assets/MONGOL/wuli_d_celeng.png', eliteName: '赛音诺颜军', eliteTier: 1  },   // 按史：策棱（喀尔喀赛音诺颜部亲王）光显寺大捷破准噶尔（《清史稿·策棱传》）








    
        { generalId: 'xingan_hailancha', factionId: 'manzhou_d', cityId: 'city_shenyang', generalName: '海兰察', portrait: '/assets/XIANBEI/xingan_hailancha.png', eliteName: '索伦劲旅', eliteTier: 2 },








    
        { generalId: 'aisin_d_huangtaiji', factionId: 'manzhou_d', cityId: 'city_hetuala', generalName: '皇太极', portrait: '/assets/NORTHEAST/aisin_d_huangtaiji.png', eliteName: '八旗护军', eliteTier: 2 },








    
        { generalId: 'jianzhou_nvzhen_limanzhu', factionId: 'manzhou_d', cityId: 'city_tongjiajiang', generalName: '李满住', portrait: '/assets/NORTHEAST/jianzhou_nvzhen_limanzhu.png', eliteName: '建州卫兵', eliteTier: 4  },   // 按史：李满住为建州卫首领，八旗未建（《明史·朝鲜传》《清史稿·太祖纪》追述）








    
        { generalId: 'nanai_zhahaluo', factionId: 'manzhou_d', cityId: 'city_valen', generalName: '扎哈罗', portrait: '/assets/NORTHEAST/nanai_zhahaluo.png', eliteName: '赫哲猎兵', eliteTier: 4  },   // 按史：扎哈罗为那乃（赫哲）部族首领，统部落猎兵








    
        { generalId: 'manzhou_nuerhachi', factionId: 'manzhou_d', cityId: 'city_salhu', generalName: '努尔哈赤', portrait: '/assets/NORTHEAST/manzhou_nuerhachi.png', eliteName: '八旗铁骑', eliteTier: 1 },








    
        { generalId: 'jilin_fujun', factionId: 'manzhou_d', cityId: 'city_longtanshancheng', generalName: '富俊', portrait: '/assets/NORTHEAST/jilin_fujun.png', eliteName: '女真骑手', eliteTier: 4 },   // 🔴 [2026-10-25 按史] 吉林将军驻吉林乌拉（今吉林市）；宽城屯只是辖区非驻地 → 据点改龙潭山（吉林市，同文化 NORTHEAST）








    
        { generalId: 'hezhe_shaerhuda', factionId: 'manzhou_d', cityId: 'city_wuyun', generalName: '沙尔虎达', portrait: '/assets/NORTHEAST/hezhe_shaerhuda.png', eliteName: '八旗骁骑', eliteTier: 3 },








    
        { generalId: 'dongping_langtan', factionId: 'manzhou_d', cityId: 'city_yeren_base', generalName: '郎坦', portrait: '/assets/NORTHEAST/dongping_langtan.png', eliteName: '女真骑手', eliteTier: 4 },








    
        { generalId: 'maomingan_suoetu', factionId: 'manzhou_d', cityId: 'city_shenyang', generalName: '索额图', portrait: '/assets/NORTHEAST/maomingan_suoetu.png', eliteName: '女真骑手', eliteTier: 4 },








    
        { generalId: 'weiyuan_d_niangengyao', factionId: 'manzhou_d', cityId: 'city_lanzhou', legionName: '帝国时代陕甘军团', generalName: '年羹尧', portrait: '/assets/KHITAN/weiyuan_d_niangengyao.png', eliteName: '四川绿营', eliteTier: 3  },   // 按史：年羹尧平青海统川陕绿营督标（《清史稿·年羹尧传》）；移驻皋兰与清将杨应琚同城（青唐城专归秃发南凉）








        { generalId: 'bfe_fuquan', factionId: 'manzhou_d', cityId: 'city_shenyang', generalName: '福全', portrait: '/assets/WEI/bfe_fuquan.png', eliteName: '八旗护军', eliteTier: 2 },
        { generalId: 'bfe_zengguoquan', factionId: 'manzhou_d', cityId: 'city_changsha', generalName: '曾国荃', portrait: '/assets/JIANGNAN/bfe_zengguoquan.png', eliteName: '湘军吉字营', eliteTier: 2 },
        { generalId: 'bfe_wanggao', factionId: 'manzhou_d', cityId: 'city_hetuala', generalName: '王杲', portrait: '/assets/NORTHEAST/bfe_wanggao.png', eliteName: '建州骑兵', eliteTier: 4 },
        { generalId: 'adao_d_mafushou', factionId: 'manzhou_d', cityId: 'city_kungang', generalName: '马福寿', portrait: '/assets/WESTERN/adao_d_mafushou.png', eliteName: '昆岗军台营', eliteTier: 4 }   // [2026-10-31 键名订正：adao_d → manzhou_d]
    ],







    xinluo: { generalId: 'xinluo_jinyuxin', cityId: 'city_jincheng_silla', generalName: '金庾信', portrait: '/assets/KOREA/xinluo_jinyuxin.png', eliteName: '花郎骑', eliteTier: 2 },






    seljuq: [
        { generalId: 'seljuq_sangjiaer', cityId: 'city_merv', generalName: '桑贾尔', portrait: '/assets/SASANIAN/seljuq_sangjiaer.png', eliteName: '塞尔柱骑兵', eliteTier: 2 },
        // 🔴 [2026-10-20 主人令「遇到问题先看符合历史，下结论再动手」] 成名战回补安置按史实复核：穆斯林＝呼罗珊总督，驻木鹿（梅尔夫）；724 年渴水日之战是呼罗珊军，不是大马士革 → 放木鹿（seljuq，风格 SASANIAN）；仍挂本政权 womaya
        { generalId: 'womaya_muslim', cityId: 'city_merv', factionId: 'womaya', legionName: '封建时代霍拉桑军团', generalName: '穆斯林', portrait: '/assets/SASANIAN/womaya_muslim.png', eliteName: '萨珊骑手', eliteTier: 4 },
    
        { generalId: 'muer_mujier', legionName: '城堡时代法尔斯军团', factionId: 'seljuq', cityId: 'city_malulude', generalName: '穆吉尔', portrait: '/assets/PERSIAN/muer_mujier.png', eliteName: '波斯步兵', eliteTier: 4 },







    
        { generalId: 'baha_gaiwamu', legionName: '城堡时代法尔斯军团', factionId: 'seljuq', cityId: 'city_taibade', generalName: '盖瓦姆', portrait: '/assets/PERSIAN/baha_gaiwamu.png', eliteName: '波斯步兵', eliteTier: 4 },







    
        { generalId: 'hali_gedaerzi', legionName: '古典时代阿契美尼德军团', factionId: 'ansxi', cityId: 'city_salahesi', generalName: '戈达尔兹', portrait: '/assets/PERSIAN/hali_gedaerzi.png', eliteName: '波斯步兵', eliteTier: 4 },







    
        { generalId: 'kumisi_aerpu', legionName: '城堡时代法尔斯军团', factionId: 'seljuq', cityId: 'city_damugan', generalName: '阿尔普', portrait: '/assets/PERSIAN/kumisi_aerpu.png', eliteName: '波斯步兵', eliteTier: 4 },







    
        { generalId: 'ribale_faheerdaolai', legionName: '封建时代德莱木军团', factionId: 'abasi', cityId: 'city_leiyi', generalName: '法赫尔道莱', portrait: '/assets/PERSIAN/ribale_faheerdaolai.png', eliteName: '波斯步兵', eliteTier: 4 },







    
        { generalId: 'keerman_xierzhan_shoujiang', legionName: '古典时代阿契美尼德军团', factionId: 'aqimeinide', cityId: 'city_xierzhan', generalName: '霍斯劳', portrait: '/assets/PERSIAN/keerman_huosilao.png', eliteName: '波斯步兵', eliteTier: 4 },







    
        { generalId: 'golpayegan_yicheng', factionId: 'aqimeinide', cityId: 'city_helate_city', generalName: '尼扎姆', portrait: '/assets/SASANIAN/golpayegan_yicheng.png', eliteName: '波斯步兵', eliteTier: 4 },







    ],







    chenla: [
        { generalId: 'chenla_duyebamo', cityId: 'city_angkor', generalName: '阇耶跋摩', portrait: '/assets/KHMER/chenla_duyebamo.png', eliteName: '高棉战象', eliteTier: 2 },
        // 🔴 [2026-10-25 补A] 拔婆跋摩一世（约 550–600，真腊开国王；碑铭可考）｜势力 真腊｜据点 三菩（KHMER 文化）｜普将（④闸敌将无实名）｜精锐「真腊战象」T4｜立绘留空
        { generalId: 'chenla_bhavavarman', factionId: 'chenla', cityId: 'city_sanpu', generalName: '拔婆跋摩一世', portrait: '/assets/KHMER/chenla_bhavavarman.png', eliteName: '真腊战象', eliteTier: 4 },
        { generalId: 'chenla_suryavarman', factionId: 'chenla', cityId: 'city_angkor', generalName: '苏耶跋摩一世', portrait: '/assets/KHMER/chenla_suryavarman.png', eliteName: '吴哥战象', eliteTier: 2 },
        { generalId: 'chenla_jayaviravarman', factionId: 'chenla', cityId: 'city_angkor', generalName: '阇耶毗罗跋摩', portrait: '/assets/KHMER/chenla_jayaviravarman.png', eliteName: '高棉步兵', eliteTier: 4 },
        { generalId: 'chenla_udayaditya', factionId: 'chenla', cityId: 'city_angkor', generalName: '乌达雅迭耶跋摩一世', portrait: '/assets/KHMER/chenla_udayaditya.png', eliteName: '高棉卫队', eliteTier: 4 },
    ],






    // ── 日本区 2026-06-18 ──






    date_d: { generalId: 'date_d_yidazhengzong', cityId: 'city_xiantai', generalName: '伊达政宗', portrait: '/assets/JAPAN/date_d_yidazhengzong.png', eliteName: '伊达骑马', eliteTier: 3 },






    chosokabe: { generalId: 'chosokabe_changzongwobuyuanqin', cityId: 'city_okafu', generalName: '长宗我部', portrait: '/assets/JAPAN/chosokabe_changzongwobuyuanqin.png', eliteName: '一领具足', eliteTier: 2 },






    otomo_d: [
        { generalId: 'otomo_d_lihuadaoxue', cityId: 'city_taizaifu', generalName: '立花道雪', portrait: '/assets/JAPAN/otomo_d_lihuadaoxue.png', eliteName: '日本足轻', eliteTier: 4 },
        { generalId: 'otomo_sorin', factionId: 'otomo_d', cityId: 'city_funei', generalName: '大友宗麟', portrait: '/assets/JAPAN/otomo_sorin.png', eliteName: '大友水军', eliteTier: 3 },   // 🔴 [2026-10-25 新增] 大友义镇/宗麟，丰后府内馆为本据（居住/镇守）；普将
    ],






    kaga_d: { generalId: 'kaga_d_xiajianlailian', cityId: 'city_jianghu', generalName: '下间赖廉', portrait: '/assets/JAPAN/kaga_d_xiajianlailian.png', eliteName: '日本足轻', eliteTier: 4 },







    iga_d: { generalId: 'iga_d_baididanbo', cityId: 'city_nabari', generalName: '百地丹波', portrait: '/assets/JAPAN/iga_d_baididanbo.png', eliteName: '日本足轻', eliteTier: 4 },






    suwa_d: { generalId: 'suwa_d_zoufanglaizhong', cityId: 'city_gaodao', generalName: '诹访赖重', portrait: '/assets/JAPAN/suwa_d_zoufanglaizhong.png', eliteName: '日本足轻', eliteTier: 4 },






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







    genji: { generalId: 'gen_minamoto_yoritomo', cityId: 'city_kamakura', generalName: '源赖朝', portrait: '/assets/JAPAN/genji_yuanlaichao.png', eliteName: '关东武士', eliteTier: 3 },







    // 🔴 [2026-09-19 主人令「行就换」] 松山（伊予国）的守将 = **源义经**（伊予守，伊予国即其守地）。







    //    与 genji（镰仓挂源赖朝）分开一个键：一势力一城，才能各挂各的守将。







    genji_iyo: { generalId: 'fujiwara_yuanyijing', cityId: 'city_yanaginogosho', generalName: '源义经', portrait: '/assets/JAPAN/fujiwara_yuanyijing.png', eliteName: '源氏骑射', eliteTier: 3 },















    // 🔴 [2026-09-19 主人令「先给奥州更换武将。新建一个」] 奥州藤原氏（陆奥·平泉）的当主。







    //    ⚠️ 立绘一律留空 → 走「本政权夹 → 本文化夹」回落（见 AGENTS.md §十三）。







    //    等主人放图后按约定填：**势力key_中文名拼音.png**（例 fujiwara_xiuheng.png）。







    fujiwara: { generalId: 'fujiwara_xiuheng', cityId: 'city_yanaginogosho', generalName: '藤原秀衡', portrait: '/assets/JAPAN/fujiwara_tengyuanxiuheng.png', eliteName: '日本足轻', eliteTier: 4 },







    kakizaki: { generalId: 'kakizaki_liqiqingguang', cityId: 'city_katsuyama', generalName: '蛎崎庆广', portrait: '/assets/JAPAN/kakizaki_liqiqingguang.png', eliteName: '日本足轻', eliteTier: 4 },






    so: { generalId: 'so_zongyizhi', cityId: 'city_tsushima', generalName: '宗义智', portrait: '/assets/JAPAN/so_zongyizhi.png', eliteName: '日本足轻', eliteTier: 4 },














// ── 朝鲜区 2026-06-18 ──






    joseon: [








        { generalId: 'joseon_lichenggui', cityId: 'city_hanseong', generalName: '李成桂', portrait: '/assets/KOREA/joseon_lichenggui.png', eliteName: '三别抄', eliteTier: 2 },
        { generalId: 'jingcheng_d_yuyouzhao', factionId: 'joseon', cityId: 'city_longer', generalName: '鱼有沼', portrait: '/assets/KOREA/jingcheng_d_yuyouzhao.png', eliteName: '朝鲜铳手', eliteTier: 3 },








    
        { generalId: 'chungju_d_quanli', factionId: 'joseon', cityId: 'city_hanseong', legionName: '帝国时代朝鲜军团', generalName: '权栗', portrait: '/assets/KOREA/chungju_d_quanli.png', eliteName: '朝鲜铳手', eliteTier: 3 },








    
        { generalId: 'sambyeol_lishunchen', factionId: 'joseon', cityId: 'city_jindo', legionName: '帝国时代朝鲜军团', generalName: '李舜臣', portrait: '/assets/KOREA/sambyeol_lishunchen.png', eliteName: '龟船水师', eliteTier: 1 },








    
        { generalId: 'sheng_d_liyiqi', factionId: 'joseon', cityId: 'city_suncheon_k', legionName: '帝国时代朝鲜军团', generalName: '李亿祺', portrait: '/assets/KOREA/sheng_d_liyiqi.png', eliteName: '朝鲜兵', eliteTier: 4 },








    
        { generalId: 'sabeol_jinshimin', eliteName: '沙伐义兵', eliteTier: 3, factionId: 'joseon', cityId: 'city_jinju', legionName: '帝国时代朝鲜军团', generalName: '金时敏', portrait: '/assets/KOREA/sabeol_jinshimin.png' },








    ],







    gaogouli: [







        { generalId: 'gaogouli_yizhiwende', cityId: 'city_pyongyang', generalName: '乙支文德', portrait: '/assets/KOREA/gaogouli_yizhiwende.png', eliteName: '高句丽骑', eliteTier: 3 },







        // 名将双身份：卫满（据点武将＋剧本敌将）







        { generalId: 'bfe3_20', cityId: 'city_pyongyang', generalName: '卫满', portrait: '/assets/KOREA/bfe3_20.png', legionName: '古典时代高句丽军团', factionId: 'joseon' , eliteName: '浿水塞卒', eliteTier: 4 },







        // 名将双身份：卫右渠（据点武将＋剧本敌将）







        { generalId: 'bfe3_31', cityId: 'city_pyongyang', generalName: '卫右渠', portrait: '/assets/KOREA/bfe3_31.png', legionName: '古典时代高句丽军团', factionId: 'joseon' , eliteName: '王险守卒', eliteTier: 4 },







    
        // 🔴 [2026-10-25 主人令「程名振史实该放营州（营州都督兼东夷都护），朝阳改为河朔文化」] 据点 长安→朝阳（唐营州，治柳城）；文化随据点＝河朔，军团按「封建×河朔」自动取，不再手写中原军团
        { generalId: 'jilizhou_chengmingzhen', factionId: 'tang', cityId: 'city_wugucheng', generalName: '程名振', portrait: '/assets/WEI/jilizhou_chengmingzhen.png', eliteName: '高句丽弩手', eliteTier: 4  },   // 按史：程名振任营州都督兼东夷都护，镇营州（《旧唐书·卷八三·程务挺传附》）








    
        { generalId: 'xuantu_yuangaisuwen', factionId: 'gaogouli', cityId: 'city_pyongyang', generalName: '渊盖苏文', portrait: '/assets/KOREA/xuantu_yuangaisuwen.png', eliteName: '高句丽骑', eliteTier: 3 },








    
        { generalId: 'huimo_gaoyanshou', factionId: 'gaogouli', cityId: 'city_wugucheng', generalName: '高延寿', portrait: '/assets/KOREA/huimo_gaoyanshou.png', eliteName: '朝鲜兵', eliteTier: 4 },








        { generalId: 'gaogouli_liuli', factionId: 'gaogouli', cityId: 'city_guoneicheng', generalName: '琉璃明王', portrait: '/assets/KOREA/gaogouli_liuli.png', eliteName: '国内城戍卒', eliteTier: 4 },   // 🔴 [2026-10-25 新增] 类利，高句丽第二代王；公元 3 年迁都国内城（居住/镇守）；普将
    ],







    baiji: [
        { generalId: 'baiji_shenjian', factionId: 'baiji', cityId: 'city_jeonju', generalName: '神剑', portrait: '/assets/KOREA/baiji_shenjian.png', eliteName: '朝鲜兵', eliteTier: 4 },   // 🔴 [2026-10-25 按史] 成名战敌将；甄萱之子，936 一善城破出降；据点全州（KOREA，后百济都城）；用势力精锐百济五方兵








        { generalId: 'baiji_jiebo', cityId: 'city_sabi', generalName: '阶伯', portrait: '/assets/KOREA/baiji_jiebo.png', eliteName: '朝鲜兵', eliteTier: 4 },
        { generalId: 'naju_d_wangjian_wangye', factionId: 'baiji', cityId: 'city_geumseong', generalName: '王礏', portrait: '/assets/KOREA/naju_d_wangjian_wangye.png', eliteName: '朝鲜兵', eliteTier: 4 },








    
        { generalId: 'zhen_zhenxuan', factionId: 'baiji', cityId: 'city_jeonju', generalName: '甄萱', portrait: '/assets/KOREA/zhen_zhenxuan.png', eliteName: '后百济军', eliteTier: 3 },








    ],






    danluo: { generalId: 'danluo_jintongjing', cityId: 'city_xingzhuting', generalName: '金通精', portrait: '/assets/KOREA/danluo_jintongjing.png', eliteName: '朝鲜兵', eliteTier: 4 },






    gaya: { generalId: 'gaya_jinshoulu', cityId: 'city_gimhae', generalName: '金首露', portrait: '/assets/KOREA/gaya_jinshoulu.png', eliteName: '朝鲜兵', eliteTier: 4 },






    ewenki: { generalId: 'ewenki_gentemuer', cityId: 'city_nibuchu', generalName: '根特木尔', portrait: '/assets/NORTHEAST/ewenki_gentemuer.png', eliteName: '女真骑手', eliteTier: 4 },







    haixi_nvzhen: { generalId: 'haixi_nvzhen_baiyindali', cityId: 'city_huifa', generalName: '拜音达里', portrait: '/assets/NORTHEAST/haixi_nvzhen_baiyindali.png', eliteName: '女真骑手', eliteTier: 4 },






    yehe: { generalId: 'yehe_jintaiji', cityId: 'city_bamiancheng', generalName: '金台吉', portrait: '/assets/NORTHEAST/yehe_jintaiji.png', eliteName: '女真骑手', eliteTier: 4 },















    guishuang: [
















        { generalId: 'guishuang_qiujiuque', cityId: 'city_lanshi', generalName: '丘就却', portrait: '/assets/CENTRAL_ASIA/guishuang_qiujiuque.png', eliteName: '河中骑兵', eliteTier: 4 },
        { generalId: 'jibin_jianisejia', legionName: '古典时代普鲁战象军团', factionId: 'guishuang', cityId: 'city_baishawa', generalName: '迦腻色迦', portrait: '/assets/PURU/jibin_jianisejia.png', eliteName: '旁遮普兵', eliteTier: 4 },
















    
        { generalId: 'aornos_aphrikes', legionName: '古典时代普鲁战象军团', factionId: 'guishuang', cityId: 'city_aonuosiyan', generalName: '阿夫里凯斯', portrait: '/assets/PURU/aornos_aphrikes.png', eliteName: '旁遮普兵', eliteTier: 4 },
















    
        { generalId: 'najie_minande', legionName: '古典时代普鲁战象军团', factionId: 'guishuang', cityId: 'city_dinggucheng', generalName: '米南德', portrait: '/assets/PURU/najie_minande.png', eliteName: '希腊战象', eliteTier: 3 },
















    ],







    // 述律平＝辽太祖皇后（契丹国号前后同一政权）→ 与耶律倍统一挂大辽






    hui: [







        { generalId: 'hui_bunaihou', cityId: 'city_heseluo', generalName: '不耐', portrait: '/assets/KOREA/hui_bunaihou.png', eliteName: '朝鲜兵', eliteTier: 4 },
        { generalId: 'donghui_nanlv', factionId: 'hui', cityId: 'city_deokwon', generalName: '南闾', portrait: '/assets/KOREA/donghui_nanlv.png', eliteName: '朝鲜兵', eliteTier: 4 },







    ],







// ── 东北区 2026-06-18 ──






    fuyu: { generalId: 'fuyu_weichoutai', cityId: 'city_fuyu', generalName: '尉仇台', portrait: '/assets/NORTHEAST/fuyu_weichoutai.png', eliteName: '女真骑手', eliteTier: 4 },







    dajin: [
        { generalId: 'dajin_wanyaneke', factionId: 'dajin', cityId: 'city_huining', generalName: '完颜讹可', portrait: '/assets/NORTHEAST/dajin_wanyaneke.png', eliteName: '女真骑手', eliteTier: 4 },   // 🔴 [2026-10-25 按史] 成名战敌将；金将，1217-1219 攻枣阳不克；据点会宁府（NORTHEAST）；用势力精锐合扎猛安
        { generalId: 'dajin_wanyan_zhongde', factionId: 'dajin', cityId: 'city_huining', generalName: '完颜仲德', portrait: '/assets/CENTRAL/dajin_wanyan_zhongde.png', eliteName: '女真骑手', eliteTier: 4 },   // 🔴 [2026-10-25 按史] 成名战敌将；金尚书右丞、蔡州守将，1234 城破死节；🔴 蔡州＝悬瓠（汝南/汝阳，今河南汝南）同一城，唐—金称蔡州、南北朝称悬瓠，城库只立 city_xuanhu（CENTRAL），不另建蔡州点 → 据点 city_xuanhu；用势力精锐合扎猛安（金初建制，金末已废，暂按 lead 口径用势力精锐）







        { generalId: 'dajin_wanyanaguda', cityId: 'city_huining', generalName: '完颜阿骨打', portrait: '/assets/NORTHEAST/dajin_wanyanaguda.png', eliteName: '猛安谋克', eliteTier: 1 },







        // 🔴 [2026-10-20 成名战规则] 完颜承裕＝金军野狐岭主帅（1211 被成吉思汗大败）→ 会宁府·大金；普将；封建×东北＝封建时代渤海军团；立绘留空














        // 🔴 [2026-10-20 成名战规则] 完颜合达＝金军三峰山主帅（1232 被拖雷击灭）→ 会宁府·大金；普将；封建时代渤海军团；立绘留空














    
        { generalId: 'xiqin_wanyanchenheshang', factionId: 'dajin', cityId: 'city_huining', generalName: '完颜陈和尚', portrait: '/assets/CENTRAL/xiqin_wanyanchenheshang.png', eliteName: '忠孝军', eliteTier: 2  },   // 按史：忠孝军大昌原四百破八千，属特定战役战术尖刀，建制短、不作长期战略主力，依 v3 定 T2（《金史·兵志》《完颜陈和尚传》）。








    
        { generalId: 'yizhou_wanyanloushi', factionId: 'dajin', cityId: 'city_fuyu', legionName: '城堡时代女真军团', generalName: '完颜娄室', portrait: '/assets/XIANBEI/yizhou_wanyanloushi.png', eliteName: '七水部铁骑', eliteTier: 1  },   // 按史：完颜娄室出完颜部，统七水诸部骑兵，追擒天祚帝、富平破宋五路；不以军政通制「猛安谋克」冒充其专属番号（《金史·完颜娄室传》）。








    
        { generalId: 'jurchen_wanyanzongbi', factionId: 'dajin', cityId: 'city_huining', generalName: '完颜宗弼', portrait: '/assets/NORTHEAST/jurchen_wanyanzongbi.png', eliteName: '铁浮图', eliteTier: 1  },   // 按史：完颜宗弼统重甲骑兵铁浮图、拐子马两翼（《金史·完颜宗弼传》；郾城、顺昌硬战）








    
        { generalId: 'mohe_wanyanzonghan', factionId: 'dajin', cityId: 'city_huining', generalName: '完颜宗翰', portrait: '/assets/NORTHEAST/mohe_wanyanzonghan.png', eliteName: '猛安谋克', eliteTier: 1 },








    ],






    xianbei: { generalId: 'xianbei_tuobamao', cityId: 'city_gaxian', generalName: '拓跋毛', portrait: '/assets/NORTHEAST/xianbei_tuobamao.png', eliteName: '女真骑手', eliteTier: 4 },







    suolun: [








        { generalId: 'suolun_bomuboguoer', cityId: 'city_yakesa', generalName: '博穆博果尔', portrait: '/assets/NORTHEAST/suolun_bomuboguoer.png', eliteName: '女真骑手', eliteTier: 4 },
        { generalId: 'dawoer_baerdaqi', factionId: 'suolun', cityId: 'city_moergen', generalName: '巴尔达齐', portrait: '/assets/NORTHEAST/dawoer_baerdaqi.png', eliteName: '女真骑手', eliteTier: 4 },








    
        { generalId: 'aola_menglielun', factionId: 'suolun', cityId: 'city_yakesa', generalName: '孟烈伦', portrait: '/assets/NORTHEAST/aola_menglielun.png', eliteName: '女真骑手', eliteTier: 4 },








    ],







    dongxia: [








        { generalId: 'dongxia_puxianwannu', cityId: 'city_longtanshancheng', generalName: '蒲鲜万奴', portrait: '/assets/NORTHEAST/dongxia_puxianwannu.png', eliteName: '女真骑手', eliteTier: 4 },
        { generalId: 'dazhen_wanyantiege', factionId: 'dongxia', cityId: 'city_xupin', generalName: '完颜铁哥', portrait: '/assets/NORTHEAST/dazhen_wanyantiege.png', eliteName: '女真骑手', eliteTier: 4 },








    ],







    wula: { generalId: 'wula_buzhantai', cityId: 'city_wushecheng', generalName: '布占泰', portrait: '/assets/NORTHEAST/wula_buzhantai.png', eliteName: '女真骑手', eliteTier: 4 },







    dada_ming: [



        { generalId: 'dada_ming_dayanhan', cityId: 'city_hetao', generalName: '巴图蒙克', portrait: '/assets/XIANBEI/dada_ming_dayanhan.png', eliteName: '察哈尔骑', eliteTier: 3 },



        // 🔴 [2026-10-20 成名战规则] 癿加思兰＝鞑靼太师（1473 红盐池被王越夜袭）→ 河套（XIANBEI）；城堡时代漠南蒙古军团；立绘留空



        { generalId: 'gen_beg_arslan', cityId: 'city_hetao', generalName: '癿加思兰', portrait: '/assets/XIANBEI/gen_beg_arslan.png', legionName: '城堡时代漠南蒙古军团', eliteName: '瓦剌骑兵', eliteTier: 3 },



    ],







    keerqin: { generalId: 'keerqin_aoba', cityId: 'city_daerhan', generalName: '奥巴', portrait: '/assets/XIANBEI/keerqin_aoba.png', eliteName: '漠南骑手', eliteTier: 4 },







    wure: { generalId: 'wure_wuzhaodu', cityId: 'city_niman', generalName: '乌昭度', portrait: '/assets/NORTHEAST/wure_wuzhaodu.png', eliteName: '女真骑手', eliteTier: 4 },







    houliao: { generalId: 'houliao_yelvliuge', cityId: 'city_xianping', generalName: '耶律留哥', portrait: '/assets/NORTHEAST/houliao_yelvliuge.png', eliteName: '辽东骑兵', eliteTier: 3 },







    heishui: { generalId: 'heishui_nishuli', cityId: 'city_lahasusu', generalName: '倪属利稽', portrait: '/assets/NORTHEAST/heishui_nishuli.png', eliteName: '女真骑手', eliteTier: 4 },






    yeren_nvzhen: { generalId: 'yeren_nvzhen_boke', cityId: 'city_yeren_base', generalName: '博克', portrait: '/assets/NORTHEAST/yeren_nvzhen_boke.png', eliteName: '女真骑手', eliteTier: 4 },







    wuji: { generalId: 'wuji_yilizhi', cityId: 'city_boduo', generalName: '乙力支', portrait: '/assets/NORTHEAST/wuji_yilizhi.png', eliteName: '女真骑手', eliteTier: 4 },






    // 🔴 [2026-10-20 主人令「东丹/契丹同属辽，必须合并」] 耶律倍＝辽太子、东丹国王（东丹是辽属国）→ 统一挂大辽






    kuye: { generalId: 'kuye_kuye_qichayi', cityId: 'city_baizhu', generalName: '齐查伊', portrait: '/assets/NORTHEAST/kuye_kuye_qichayi.png', eliteName: '女真骑手', eliteTier: 4 },







    // 🔴 [2026-10-25 修] 突地稽＝粟末靺鞨，隋末率部内附、唐置营州（朝阳）安置（史实居住地，据点不动）。
    //    朝阳 2026-10-25 已按主人令改 WEI 河朔 → 他的军团应走「封建 × 河朔＝封建时代河朔军团」自动解；
    //    原来手写的「封建时代漠南军团」是漠南 XIANBEI 那一格的军团，与据点文化不符（文化同一链审计报错），已删掉。
    sushen: { generalId: 'sushen_tudiji', cityId: 'city_dongkang', generalName: '突地稽', portrait: '/assets/NORTHEAST/sushen_tudiji.png', eliteName: '女真骑手', eliteTier: 4 },







    yilou: { generalId: 'yilou_naoya', cityId: 'city_fenglin', generalName: '恼犽', portrait: '/assets/NORTHEAST/yilou_naoya.png', eliteName: '女真骑手', eliteTier: 4 },






    jilimi: [








        { generalId: 'jilimi_takuna', cityId: 'city_nanghar', generalName: '塔库纳', portrait: '/assets/NORTHEAST/jilimi_takuna.png', eliteName: '女真骑手', eliteTier: 4 },
        { generalId: 'nifuhe_baerhudai', factionId: 'jilimi', cityId: 'city_pennuli', legionName: '帝国时代八旗军团', generalName: '巴尔虎代', portrait: '/assets/NORTHEAST/nifuhe_baerhudai.png', eliteName: '女真骑手', eliteTier: 4 },








    ],







    eluoke: { generalId: 'eluoke_amuhaer', cityId: 'city_nuotuoluo', generalName: '阿穆哈尔', portrait: '/assets/NORTHEAST/eluoke_amuhaer.png', eliteName: '女真骑手', eliteTier: 4 },






    feiyaka: { generalId: 'feiyaka_cemutehe', cityId: 'city_qiji', generalName: '策穆特赫', portrait: '/assets/NORTHEAST/feiyaka_cemutehe.png', eliteName: '女真骑手', eliteTier: 4 },






        // ── 草原关隘 ──






    ashina: { generalId: 'ashina_ashinayandou', cityId: 'city_naiman', generalName: '阿史那燕都', portrait: '/assets/CENTRAL_ASIA/ashina_ashinayandou.png', eliteName: '河中骑兵', eliteTier: 4 },







    yuwen: [







        { generalId: 'yuwen_yuwentai', cityId: 'city_wuchuanzhen', legionName: '封建时代漠南军团', generalName: '宇文泰', portrait: '/assets/XIANBEI/yuwen_yuwentai.png', eliteName: '六镇鲜卑', eliteTier: 2 },







        // 🔴 [2026-10-20 成名战规则] 宇文宪＝北周名将（570 攻轵关败于斛律光）→ 武川镇·宇文；名将；立绘留空







        { generalId: 'yuwen_yuwenxian', cityId: 'city_wuchuanzhen', generalName: '宇文宪', portrait: '/assets/XIANBEI/yuwen_yuwenxian.png', eliteName: '六镇鲜卑', eliteTier: 2 },







    
        { generalId: 'long2_weixiaokuan', factionId: 'yuwen', cityId: 'city_longzhou', legionName: '封建时代中原军团', generalName: '韦孝宽', portrait: '/assets/CENTRAL/long2_weixiaokuan.png', eliteName: '玉壁守军', eliteTier: 3 },








    ],






// ── 草原区 2026-06-18 ──







    liao_d: [







        { generalId: 'liao_d_yelvabaoji', cityId: 'city_linhuang', generalName: '耶律阿保机', portrait: '/assets/XIANBEI/liao_d_yelvabaoji.png', eliteName: '契丹铁骑', eliteTier: 2 },







        // 🔴 [2026-10-20 成名战规则] 萧排押＝辽将（1019 龟州之战主帅，被姜邯赞大破）→ 临潢府·大辽；普将；立绘留空














        // 🔴 [2026-10-20 成名战规则] 萧咄李＝辽驸马侍中（980 雁门关之战被杨业阵斩）→ 临潢府·大辽；普将；立绘留空







        { generalId: 'liao_d_xiaoduli', cityId: 'city_linhuang', generalName: '萧咄李', portrait: '/assets/XIANBEI/liao_d_xiaoduli.png', eliteName: '漠南骑手', eliteTier: 4 },







        // 🔴 [2026-10-20 成名战规则] 韩德威＝辽将（995 子河汊之战被折御卿击败）→ 临潢府·大辽；普将；立绘留空














        // 🔴 [2026-10-20 成名战规则] 天祚帝＝辽末帝耶律延禧（1115 护步达冈亲征被完颜阿骨打大败）→ 临潢府·大辽；普将；立绘留空







        { generalId: 'liao_d_tianzuodi', cityId: 'city_linhuang', generalName: '天祚帝', portrait: '/assets/XIANBEI/liao_d_tianzuodi.png', eliteName: '漠南骑手', eliteTier: 4 },







    
        { generalId: 'qidan_shulvping', cityId: 'city_linhuang', generalName: '述律平', portrait: '/assets/XIANBEI/qidan_shulvping.png', factionId: 'liao_d', eliteName: '漠南骑手', eliteTier: 4 },








    
        { generalId: 'yel_yelvxiuge', factionId: 'liao_d', cityId: 'city_jiangsheng', generalName: '耶律休哥', portrait: '/assets/XIANBEI/yel_yelvxiuge.png', eliteName: '契丹铁骑', eliteTier: 2 },








    
        { generalId: 'dongdan_yelvbei', cityId: 'city_linhuang', generalName: '耶律倍', portrait: '/assets/NORTHEAST/dongdan_yelvbei.png', factionId: 'liao_d', eliteName: '漠南骑手', eliteTier: 4 },








    ],






    kumoxi: [







        { generalId: 'kumoxi_ahuihui', cityId: 'city_raoleshui', generalName: '阿会毁', portrait: '/assets/XIANBEI/kumoxi_ahuihui.png', eliteName: '漠南骑手', eliteTier: 4 },
        { generalId: 'kumo_xiwanghuilibao', factionId: 'kumoxi', cityId: 'city_songmo', legionName: '城堡时代漠南蒙古军团', generalName: '回离保', portrait: '/assets/XIANBEI/kumo_xiwanghuilibao.png', eliteName: '漠南骑手', eliteTier: 4 },







    ],






    geluolu: { generalId: 'geluolu_chisipijia', cityId: 'city_almaliq', generalName: '炽俟毗伽', portrait: '/assets/CENTRAL_ASIA/geluolu_chisipijia.png', eliteName: '河中骑兵', eliteTier: 4 },





    tumed: { generalId: 'tumed_andahan', cityId: 'city_guihua', generalName: '俺答', portrait: '/assets/XIANBEI/tumed_andahan.png', eliteName: '土默特骑', eliteTier: 3 },






    xiajiasi: { generalId: 'xiajiasi_are', cityId: 'city_wubusabo', generalName: '阿热', portrait: '/assets/MONGOL/xiajiasi_are.png', eliteName: '黠戛斯骑', eliteTier: 3 },







    xiongnu: [
        { generalId: 'xiongnu_hunxiewang', factionId: 'xiongnu', cityId: 'city_toumancheng', generalName: '浑邪王', portrait: '/assets/KHITAN/xiongnu_hunxiewang.png', eliteName: '漠南骑手', eliteTier: 4 },   // 🔴 [2026-10-25 按史] 成名战敌将；匈奴浑邪王，前121 河西败后降汉；据点姑臧（KHITAN，浑邪王驻牧地）；王号即其名（本名未传，沿用项目口径）；用势力精锐鸣镝精骑
        { generalId: 'xiongnu_yizhixie', factionId: 'xiongnu', cityId: 'city_toumancheng', generalName: '伊稚斜单于', portrait: '/assets/XIANBEI/xiongnu_yizhixie.png', eliteName: '漠南骑手', eliteTier: 4 },   // 🔴 [2026-10-25 按史] 成名战敌将；匈奴单于前126-前114，前119 漠北战败；据点头曼城（XIANBEI）；用势力精锐鸣镝精骑







        { generalId: 'xiongnu_maodun', cityId: 'city_toumancheng', generalName: '冒顿', portrait: '/assets/XIANBEI/xiongnu_maodun.png', eliteName: '匈奴骑兵', eliteTier: 2 },







        // 名将双身份：老上单于（据点武将＋剧本敌将）







        { generalId: 'bfe3_24', cityId: 'city_toumancheng', generalName: '老上单于', portrait: '/assets/XIANBEI/bfe3_24.png', legionName: '古典时代漠南游牧军团' , eliteName: '匈奴控弦', eliteTier: 3},







        // 名将双身份：儿单于（据点武将＋剧本敌将）







        { generalId: 'bfe3_34', cityId: 'city_toumancheng', generalName: '儿单于', portrait: '/assets/XIANBEI/bfe3_34.png', legionName: '古典时代漠南游牧军团' , eliteName: '匈奴控弦', eliteTier: 3},







        // 名将双身份：且鞮侯单于（据点武将＋剧本敌将）







        { generalId: 'bfe3_38', cityId: 'city_toumancheng', generalName: '且鞮侯单于', portrait: '/assets/XIANBEI/bfe3_38.png', legionName: '古典时代漠南游牧军团' , eliteName: '浚稽山骑', eliteTier: 2}, // 前99 浚稽山围击李陵本部







        // 名将双身份：北单于（据点武将＋剧本敌将）







        { generalId: 'bfe3_64', cityId: 'city_toumancheng', generalName: '北单于', portrait: '/assets/XIANBEI/bfe3_64.png', legionName: '古典时代漠南游牧军团' , eliteName: '北匈奴骑', eliteTier: 3},







        // 名将双身份：白羊王（据点武将＋剧本敌将）














        // 名将双身份：呼韩邪单于（据点武将＋剧本敌将）














    
        { generalId: 'chenli_d_zuoxianwang', factionId: 'xushouhui', cityId: 'city_wuchang', generalName: '张必先', portrait: '/assets/MONGOL/chenli_d_zuoxianwang.png', eliteName: '荆楚兵', eliteTier: 4 },   // 🔴 [2026-10-28 按史明示] 张必先＝陈友谅太尉、陈理托孤重臣——天完（陈友谅一系）与陈汉按「前后相承并成一家」并挂；精锐「武昌卫军」T4








        { generalId: 'bfe_touman', factionId: 'xiongnu', cityId: 'city_toumancheng', generalName: '头曼', portrait: '/assets/XIANBEI/bfe_touman.png', eliteName: '匈奴控弦', eliteTier: 3 },
    ],







    murong: [








        { generalId: 'murong_murongke', cityId: 'city_jicheng', generalName: '慕容恪', portrait: '/assets/XIANBEI/murong_murongke.png', eliteName: '慕容铁骑', eliteTier: 2 },
        { generalId: 'dingzhou_d_murongchui', factionId: 'murong', cityId: 'city_jicheng', generalName: '慕容垂', portrait: '/assets/WEI/dingzhou_d_murongchui.png', eliteName: '慕容铁骑', eliteTier: 2 },








    
        { generalId: 'xiongding_murongyong', factionId: 'murong', cityId: 'city_jicheng', generalName: '慕容永', portrait: '/assets/CENTRAL/xiongding_murongyong.png', eliteName: '漠南骑手', eliteTier: 4 },








    
        { generalId: 'yingzhou_ying_d_muronghuang', factionId: 'murong', cityId: 'city_jicheng', generalName: '慕容皝', portrait: '/assets/XIANBEI/yingzhou_ying_d_muronghuang.png', eliteName: '慕容铁骑', eliteTier: 2 },








    ],







    wuhuan: { generalId: 'wuhuan_tadun', cityId: 'city_chaoyang', generalName: '蹋顿', portrait: '/assets/XIANBEI/wuhuan_tadun.png', eliteName: '乌桓突骑', eliteTier: 4 },   // 🔴 [2026-10-28 主人批迁] 蹋顿＝三郡乌桓大人，王庭柳城（今朝阳）：镇守/居住都算（史实三条依据）；白狼山＝207 败亡战场非驻地。文化随据点（朝阳＝河朔 WEI）







    yuan_d: [
        { generalId: 'yuan_shidielibisi', factionId: 'yuan_d', cityId: 'city_xingzhuting', generalName: '石迭里必思', portrait: '/assets/KOREA/yuan_shidielibisi.png', eliteName: '朝鲜兵', eliteTier: 4 },   // 🔴 [2026-10-25 按史] 耽罗（济州）牧胡首领，1374 明月浦为高丽崔莹所斩（《高丽史·卷一一三·崔莹传》）
        { generalId: 'yuan_nahachu', factionId: 'yuan_d', cityId: 'city_yingchang', generalName: '纳哈出', portrait: '/assets/XIANBEI/yuan_nahachu.png', eliteName: '漠南骑手', eliteTier: 4 },   // 🔴 [2026-10-25 按史] 成名战敌将；元辽东太尉，1387 金山降明；据点应昌（XIANBEI）；用势力精锐秃鲁花军







        { generalId: 'yuan_d_hubilie', cityId: 'city_shangdu', generalName: '忽必烈', portrait: '/assets/XIANBEI/yuan_d_hubilie.png', eliteName: '蒙古骑兵', eliteTier: 3 },







        // 🔴 [2026-10-20 成名战规则] 倒剌沙＝元上都派权臣（1328 两都之战被燕帖木儿击败）→ 上都·元朝；普将；立绘留空







        { generalId: 'yuan_d_daulashah', cityId: 'city_shangdu', generalName: '倒剌沙', portrait: '/assets/XIANBEI/yuan_d_daulashah.png', legionName: '城堡时代漠南蒙古军团', eliteName: '漠南骑手', eliteTier: 4 },







        // 🔴 [2026-10-20 成名战规则] 脱脱＝元末丞相（1354 率大军围高邮，被张士诚击退）→ 上都·元朝；普将；立绘留空














        // 🔴 [2026-10-20 成名战规则] 蛮子海牙＝元将（1355 采石矶被常遇春击败）→ 姑孰·江南；文化随据点＝JIANGNAN；普将；立绘留空














    
        { generalId: 'gen_zhang_rou', factionId: 'yuan_d', cityId: 'city_baoding', generalName: '张柔', portrait: '/assets/WEI/gen_zhang_rou.png', legionName: '城堡时代燕云军团', eliteName: '汉军铁骑', eliteTier: 3 },








    
        { generalId: 'da_yuan_kuokuotiemuer', factionId: 'yuan_d', cityId: 'city_karakorum', legionName: '城堡时代蒙古军团', generalName: '扩廓帖木儿', portrait: '/assets/XIANBEI/da_yuan_kuokuotiemuer.png', eliteName: '蒙古骑兵', eliteTier: 3 },
        { generalId: 'gen_toghus_temur', factionId: 'yuan_d', cityId: 'city_yingchang', generalName: '脱古思帖木儿', portrait: '/assets/XIANBEI/gen_toghus_temur.png', legionName: '城堡时代漠南蒙古军团', eliteName: '漠南骑手', eliteTier: 4 },








    
        { generalId: 'chahar_yantiemuer', factionId: 'yuan_d', cityId: 'city_xinghe', generalName: '燕帖木儿', portrait: '/assets/XIANBEI/chahar_yantiemuer.png', eliteName: '蒙古骑兵', eliteTier: 3 },
        { generalId: 'bfe3_74', cityId: 'city_xinghe', generalName: '轲比能', portrait: '/assets/XIANBEI/bfe3_74.png', legionName: '古典时代漠南游牧军团', factionId: 'xianbei' , eliteName: '鲜卑弓骑', eliteTier: 4 },








    ],






    shaodang: [







        { generalId: 'shaodang_mitang', cityId: 'city_maqu', generalName: '迷唐', portrait: '/assets/TIBET/shaodang_mitang.png', eliteName: '吐蕃骑兵', eliteTier: 4 },







        // 🔴 [2026-10-20 主人令「这些据点违规了……请删除。据点中有武将的话，请放到相同风格的临近据点」] 原据点 city_qiangyi 已删 → 迁玛曲（同建筑风格最近），仍挂本政权 qiangfang














    ],







    xueyantuo: { generalId: 'xueyantuo_yinan', cityId: 'city_yanran_stone', generalName: '夷男', portrait: '/assets/MONGOL/xueyantuo_yinan.png', eliteName: '薛延陀骑', eliteTier: 3 },















    // 骨力裴罗＝回纥（后改称回鹘）汗国开国可汗，回纥/回鹘/博尔巴任回鹘是同一汗国 → 统一挂回鹘






    kereyid: [







        { generalId: 'kereyid_wanghan', cityId: 'city_kereyid', generalName: '脱斡霖', portrait: '/assets/MONGOL/kereyid_wanghan.png', eliteName: '蒙古骑手', eliteTier: 4 },
        { generalId: 'kelie_zhaheganbu', factionId: 'kereyid', cityId: 'city_douweihunhe', generalName: '札合敢不', portrait: '/assets/MONGOL/kelie_zhaheganbu.png', eliteName: '蒙古骑手', eliteTier: 4 },







    ],







    naiman: { generalId: 'naiman_taiyanghan', cityId: 'city_fuhai', generalName: '塔阳', portrait: '/assets/CENTRAL_ASIA/naiman_taiyanghan.png', eliteName: '河中骑兵', eliteTier: 4 },







    tatar: { generalId: 'tatar_mieguzhen', cityId: 'city_tatar', generalName: '蔑古真', portrait: '/assets/MONGOL/tatar_mieguzhen.png', eliteName: '蒙古骑手', eliteTier: 4 },






    gaoche: [







        { generalId: 'gaoche_afuzhiluo', cityId: 'city_junjishan', generalName: '阿伏至罗', portrait: '/assets/MONGOL/gaoche_afuzhiluo.png', eliteName: '高车骑兵', eliteTier: 3 },
        { generalId: 'dingling_weilu', factionId: 'xiongnu', cityId: 'city_xiaoyenisei', legionName: '古典时代匈奴军团', generalName: '卫律', portrait: '/assets/MONGOL/dingling_weilu.png', eliteName: '蒙古骑手', eliteTier: 4 },







    
        { generalId: 'tiele_qibiheli', factionId: 'tang', cityId: 'city_hanhai', legionName: '封建时代突厥军团', generalName: '契苾何力', portrait: '/assets/MONGOL/tiele_qibiheli.png', eliteName: '契苾部骑', eliteTier: 3  },   // 按史：铁勒契苾部酋长，自选骁骑千余夜袭突沦川（《旧唐书·卷一〇九·契苾何力传》）







    ],







    tujue: [
        { generalId: 'tujue_abo_dagan', factionId: 'tujue', cityId: 'city_otuken', generalName: '阿波达干', portrait: '/assets/XIANBEI/tujue_abo_dagan.png', eliteName: '蒙古骑手', eliteTier: 4 },   // 🔴 [2026-10-25 按史] 成名战敌将；东突厥左厢十一部首领；「阿波达干」疑为名+官号，史书仅此一称；据点头曼城（XIANBEI）；用势力精锐附离亲卫







        { generalId: 'tujue_ashinatumen', cityId: 'city_otuken', generalName: '阿史那土门', portrait: '/assets/MONGOL/tujue_ashinatumen.png', eliteName: '突厥铁骑', eliteTier: 2 },







        // 🔴 [2026-10-20 成名战规则] 颉利可汗＝东突厥末代大可汗（630 阴山之战被李靖夜袭），于都斤山·突厥；普将；立绘留空














        // 🔴 [2026-10-20 成名战规则] 乌苏米施可汗＝后突厥末代可汗（744 被回纥骨力裴罗击灭）→ 于都斤山·突厥；普将；立绘留空







        { generalId: 'tujue_wusumishi', cityId: 'city_otuken', generalName: '乌苏米施可汗', portrait: '/assets/MONGOL/tujue_wusumishi.png', eliteName: '蒙古骑手', eliteTier: 4 },







    
        { generalId: 'pugu_ashinaguduolu', factionId: 'tujue', cityId: 'city_yanran', generalName: '骨咄禄', portrait: '/assets/MONGOL/pugu_ashinaguduolu.png', eliteName: '突厥铁骑', eliteTier: 2 },








    
        { generalId: 'heisha_d_houlihu', factionId: 'xiongnu', cityId: 'city_temermen', legionName: '古典时代匈奴军团', generalName: '呴犁湖', portrait: '/assets/MONGOL/heisha_d_houlihu.png', eliteName: '蒙古骑手', eliteTier: 4 },








        { generalId: 'bfe_ashina_duzhi', factionId: 'xijue', cityId: 'city_suiye', generalName: '阿史那都支', portrait: '/assets/CENTRAL_ASIA/bfe_ashina_duzhi.png', eliteName: '十姓铁骑', eliteTier: 4 },
    ],






    hongirad: { generalId: 'hongirad_dexuechan', cityId: 'city_erguna', generalName: '德薛禅', portrait: '/assets/MONGOL/hongirad_dexuechan.png', eliteName: '蒙古骑手', eliteTier: 4 },







    choros: { generalId: 'choros_tuohuan', cityId: 'city_dzungar_basin', generalName: '脱欢', portrait: '/assets/CENTRAL_ASIA/choros_tuohuan.png', eliteName: '卫拉特骑兵', eliteTier: 3 },






    ashide: { generalId: 'ashide_ashidejieli', cityId: 'city_heishacheng', generalName: '阿史德颉利', portrait: '/assets/CENTRAL_ASIA/ashide_ashidejieli.png', eliteName: '蒙古骑手', eliteTier: 4 },







    duolu: { generalId: 'duolu_ashinahelu', cityId: 'city_beiluocheng', generalName: '阿史那贺鲁', portrait: '/assets/CENTRAL_ASIA/duolu_ashinahelu.png', eliteName: '河中骑兵', eliteTier: 4 },







    cheshihou: { generalId: 'cheshihou_angui', cityId: 'city_loulan', generalName: '安归', portrait: '/assets/WESTERN/cheshihou_angui.png', eliteName: '西域兵', eliteTier: 4 },







    kaerka: [








        { generalId: 'kaerka_abadaihan', cityId: 'city_duluohe', generalName: '阿巴岱', portrait: '/assets/MONGOL/kaerka_abadaihan.png', eliteName: '蒙古骑手', eliteTier: 4 },
        { generalId: 'tushetu_tuxietuhan', factionId: 'kaerka', cityId: 'city_kulun', generalName: '衮布', portrait: '/assets/MONGOL/tushetu_tuxietuhan.png', eliteName: '蒙古骑手', eliteTier: 4 },








    
        { generalId: 'zhasaketu_zhasakesubadi', factionId: 'kaerka', cityId: 'city_wuliyasutai', generalName: '素巴第', portrait: '/assets/MONGOL/zhasaketu_zhasakesubadi.png', eliteName: '蒙古骑手', eliteTier: 4 },








    
        { generalId: 'tumengken_tumengken', factionId: 'kaerka', cityId: 'city_baidalik', generalName: '图蒙肯', portrait: '/assets/MONGOL/tumengken_tumengken.png', eliteName: '蒙古骑手', eliteTier: 4 },








    
        { generalId: 'tuva_qinggunzabu', factionId: 'kaerka', cityId: 'city_teshuolankalun', generalName: '青滚杂卜', portrait: '/assets/MONGOL/tuva_qinggunzabu.png', eliteName: '蒙古骑手', eliteTier: 4 },








    
        { generalId: 'chechen_chechenhanshuolei', factionId: 'kaerka', cityId: 'city_bayantumen', generalName: '硕垒', portrait: '/assets/MONGOL/chechen_chechenhanshuolei.png', eliteName: '蒙古骑手', eliteTier: 4 },








    
        { generalId: 'nuoyan_d_sanyinnuoyan', eliteName: '喀尔喀重骑', eliteTier: 4, factionId: 'kaerka', cityId: 'city_hangai', generalName: '三音诺颜', portrait: '/assets/MONGOL/nuoyan_d_sanyinnuoyan.png' },








    ],







    huyan: [
        { generalId: 'huyan_peicen', cityId: 'city_naomaohu', generalName: '呼衍蒲奴', portrait: '/assets/CENTRAL_ASIA/huyan_peicen.png', eliteName: '河中骑兵', eliteTier: 4 },
        { generalId: 'bfe_huyan_wang', factionId: 'huyan', cityId: 'city_toumancheng', generalName: '呼衍王', portrait: '/assets/XIANBEI/bfe_huyan_wang.png', eliteName: '北匈奴骑', eliteTier: 3 },
    ],






    ongut: { generalId: 'ongut_alawusi', cityId: 'city_jingzhou', generalName: '阿剌兀思', portrait: '/assets/XIANBEI/ongut_alawusi.png', eliteName: '漠南骑手', eliteTier: 4 },







    rouran: [







        { generalId: 'rouran_shelun', cityId: 'city_saierwusu', generalName: '社仑', portrait: '/assets/MONGOL/rouran_shelun.png', eliteName: '蒙古骑手', eliteTier: 4 },







        // 🔴 [2026-10-20 成名战规则] 阿那瓌＝柔然末代可汗（552 被突厥土门击败自杀）→ 赛尔乌苏·柔然；普将；立绘留空







        //    军团按「武将时代×据点文化」：MONGOL×封建＝封建时代突厥军团







        { generalId: 'rouran_anagui', cityId: 'city_saierwusu', generalName: '阿那瓌', portrait: '/assets/MONGOL/rouran_anagui.png', legionName: '封建时代突厥军团', eliteName: '蒙古骑手', eliteTier: 4 },







    
        { generalId: 'yujiulu_yujiulv', factionId: 'rouran', cityId: 'city_ruoshui', generalName: '郁久闾大檀', portrait: '/assets/MONGOL/yujiulu_yujiulv.png', eliteName: '蒙古骑手', eliteTier: 4 },








    ],







    // 🔴 [2026-10-26 主人令「车师势力本该挂车师王（如车师后王姑句，库内缺，属新增武将＝③档）…要改」]
    //    姑句＝车师后王（《汉书·卷96下·西域传》：元始中，车师后王姑句以道当为拄置、亡降匈奴），王治务涂谷＝务涂城；
    //    四闸：亲统决断无载／史载实胜无／格局分量小国之王／对阵有名无 → 普将。立绘留空。
    chagatai: { generalId: 'chagatai_gouju', factionId: 'chagatai', cityId: 'city_bieshibali', generalName: '姑句', portrait: '/assets/WESTERN/chagatai_gouju.png', eliteName: '西域兵', eliteTier: 4 },







    huihu: [







        { generalId: 'huihu_dunmohedagan', cityId: 'city_woluduocheng', generalName: '顿莫贺达干', portrait: '/assets/MONGOL/huihu_dunmohedagan.png', eliteName: '蒙古骑手', eliteTier: 4 },







        // 🔴 [2026-10-20 成名战规则] 㕎馺可汗＝回鹘汗国末代可汗（840 被黠戛斯攻灭）→ 青岭牙帐·回鹘；普将；立绘留空







        { generalId: 'huihu_wusa', cityId: 'city_woluduocheng', generalName: '㕎馺可汗', portrait: '/assets/MONGOL/huihu_wusa.png', eliteName: '蒙古骑手', eliteTier: 4 },







    
        { generalId: 'porbazhyn_mouyu', cityId: 'city_woluduobali', generalName: '牟羽可汗', portrait: '/assets/CENTRAL/porbazhyn_mouyu.png', factionId: 'huihu', eliteName: '回鹘骑兵', eliteTier: 3 },   // 博尔巴任专属；骨力裴罗只留卜古罕城








    
        { generalId: 'huige_gulipeiluo', cityId: 'city_woluduobali', generalName: '骨力裴罗', portrait: '/assets/MONGOL/huige_gulipeiluo.png', factionId: 'huihu', eliteName: '回鹘骑兵', eliteTier: 3 },








    
        { generalId: 'yaoluoge_yaoluogepusa', factionId: 'huihu', cityId: 'city_suoling', generalName: '药罗葛菩萨', portrait: '/assets/MONGOL/yaoluoge_yaoluogepusa.png', eliteName: '回鹘骑兵', eliteTier: 3 },








    ],






    // 🔴 [2026-10-26] 蒲类(pulei)势力不再挂武将：窦固是汉将（汉国），已归回汉国·洛阳，
    //    见 han_d 名单（附依据）。蒲类国（巴里坤）本身在位国王史无实名，不拟名、不设武将；
    //    巴里坤保留 cities_v2 原主 pulei（乱斗开局按「无将据点＝叛军」兜底）。







    xibo_d: { generalId: 'xibo_d_tubote', cityId: 'city_yili', generalName: '图伯特', portrait: '/assets/CENTRAL_ASIA/xibo_d_tubote.png', eliteName: '河中骑兵', eliteTier: 4 },






    zhadalan: { generalId: 'zhadalan_zhamuhe', eliteName: '十三翼', eliteTier: 3, cityId: 'city_onon', generalName: '札木合', portrait: '/assets/MONGOL/zhadalan_zhamuhe.png' },







    zhuerqi: { generalId: 'zhuerqi_sachabieqi', cityId: 'city_sangguer', generalName: '撒察别乞', portrait: '/assets/MONGOL/zhuerqi_sachabieqi.png', eliteName: '蒙古骑手', eliteTier: 4 },






    bayegu: { generalId: 'bayegu_qulishi', cityId: 'city_jiluoshan', generalName: '屈利失', portrait: '/assets/MONGOL/bayegu_qulishi.png', eliteName: '蒙古骑手', eliteTier: 4 },







    zubu: { generalId: 'zubu_mogusi', cityId: 'city_teerhunjuntai', generalName: '磨古斯', portrait: '/assets/MONGOL/zubu_mogusi.png', eliteName: '蒙古骑手', eliteTier: 4 },







    wuzhumuqin: { generalId: 'wuzhumuqin_duoerji', cityId: 'city_wuliyasitai', generalName: '多尔济', portrait: '/assets/XIANBEI/wuzhumuqin_duoerji.png', eliteName: '漠南骑手', eliteTier: 4 },







    baidi: { generalId: 'baidi_baidizi', cityId: 'city_jining', generalName: '白狄子', portrait: '/assets/XIANBEI/baidi_baidizi.png', eliteName: '漠南骑手', eliteTier: 4 },







    shiwei: { generalId: 'shiwei_saihou', cityId: 'city_julunbo', generalName: '塞呴', portrait: '/assets/MONGOL/shiwei_saihou.png', eliteName: '蒙古骑手', eliteTier: 4 },







    sunite: { generalId: 'sunite_sousai', cityId: 'city_saihantala', generalName: '叟塞', portrait: '/assets/XIANBEI/sunite_sousai.png', eliteName: '漠南骑手', eliteTier: 4 },





        // ── 西域关隘 ──







    hepan: { generalId: 'hepan_gaoxianzhi', cityId: 'city_yiluolucheng', generalName: '高仙芝', portrait: '/assets/WESTERN/hepan_gaoxianzhi.png', eliteName: '安西精兵', eliteTier: 2 },







    yiwu: { generalId: 'yiwu_hanshen', cityId: 'city_hamiwei', generalName: '罕慎', portrait: '/assets/WESTERN/yiwu_hanshen.png', eliteName: '西域兵', eliteTier: 4 },







    kepantuo: { generalId: 'kepantuo_dulimi', cityId: 'city_gongzhubao', generalName: '阇梨密', portrait: '/assets/WESTERN/kepantuo_dulimi.png', eliteName: '西域兵', eliteTier: 4 },







    huite: { generalId: 'huite_amuersana', cityId: 'city_jinshan', generalName: '阿睦尔撒纳', portrait: '/assets/CENTRAL_ASIA/huite_amuersana.png', eliteName: '河中骑兵', eliteTier: 4 },







    tuoming: { generalId: 'tuoming_tuomin', cityId: 'city_wutucheng', generalName: '妥明', portrait: '/assets/WESTERN/tuoming_tuomin.png', legionName: '起义军', eliteName: '西域兵', eliteTier: 4 },







    chuyue: { generalId: 'chuyue_shatuonasu', cityId: 'city_dushancheng', generalName: '沙陀那速', portrait: '/assets/CENTRAL_ASIA/chuyue_shatuonasu.png', eliteName: '河中骑兵', eliteTier: 4 },







    keerkezi: { generalId: 'keerkezi_manasi', cityId: 'city_yierkeshentan', generalName: '玛纳斯', portrait: '/assets/CENTRAL_ASIA/keerkezi_manasi.png', eliteName: '河中骑兵', eliteTier: 4 },







    pisha: { generalId: 'pisha_weichisheng', cityId: 'city_yutian2', generalName: '尉迟胜', portrait: '/assets/WESTERN/pisha_weichisheng.png', eliteName: '西域兵', eliteTier: 4 },






    yangguan: { generalId: 'yangguan_lihao', cityId: 'city_dunhuang', generalName: '李暠', portrait: '/assets/KHITAN/yangguan_lihao.png', eliteName: '契丹骑手', eliteTier: 4 },






    // 三陇沙·白龙 宁缺毋滥







// ── 西域区 2026-06-18 ──







    shache: { generalId: 'shache_xian_suoche_shachexian', cityId: 'city_shache', generalName: '莎车贤', portrait: '/assets/WESTERN/shache_shachexian.png', eliteName: '西域兵', eliteTier: 4 },







    shule: [
        { generalId: 'shule_aersilan', cityId: 'city_shule', generalName: '阿尔斯兰', portrait: '/assets/WESTERN/shule_aersilan.png', eliteName: '西域兵', eliteTier: 4 },
        { generalId: 'bfe_shulezhong', factionId: 'shule', cityId: 'city_shule', generalName: '榆勒', portrait: '/assets/WESTERN/bfe_shulezhong.png', eliteName: '盘橐守军', eliteTier: 4 },
    ],







    dzungar: [
        { generalId: 'dzungar_galedanceling', cityId: 'city_yili', generalName: '噶勒丹策凌', portrait: '/assets/CENTRAL_ASIA/dzungar_galedanceling.png', eliteName: '准噶尔骑', eliteTier: 2 },
        { generalId: 'bfe_tsering_dondub', factionId: 'dzungar', cityId: 'city_yili', generalName: '策凌敦多布', portrait: '/assets/CENTRAL_ASIA/bfe_tsering_dondub.png', eliteName: '准噶尔骑', eliteTier: 2 },
        { generalId: 'bfe_xiaoceling', factionId: 'dzungar', cityId: 'city_yili', generalName: '策零敦多布', portrait: '/assets/CENTRAL_ASIA/bfe_xiaoceling.png', eliteName: '准噶尔骑', eliteTier: 2 },
    ],







    anxi: { generalId: 'anxi_guoxin', cityId: 'city_bohuancheng', generalName: '郭昕', portrait: '/assets/WESTERN/anxi_guoxin.png', eliteName: '西域兵', eliteTier: 4 },







    yanqi: { generalId: 'yanqi_longtuqizhi', cityId: 'city_yanqi', generalName: '龙突骑支', eliteName: '焉耆胡骑', eliteTier: 4, portrait: '/assets/WESTERN/yanqi_longtuqizhi.png' },







    tuerhute: { generalId: 'tuerhute_wobaxi', cityId: 'city_yingsuochuan', generalName: '渥巴锡', portrait: '/assets/CENTRAL_ASIA/tuerhute_wobaxi.png', eliteName: '河中骑兵', eliteTier: 4 },














    yarkand: { generalId: 'yarkand_abudulatifu', cityId: 'city_yinai', generalName: '拉提夫', portrait: '/assets/WESTERN/yarkand_abudulatifu.png', eliteName: '西域兵', eliteTier: 4 },







    yiduhu: [







        { generalId: 'yiduhu_baershu', cityId: 'city_gaochangcheng', generalName: '巴尔术', portrait: '/assets/WESTERN/yiduhu_baershu.png', eliteName: '西域兵', eliteTier: 4 },







        // 🔴 [2026-10-20 成名战规则] 麴文泰＝高昌国王（640 唐军围城，忧惧而死）→ 高昌·亦都护（高昌国无独立势力，挂该城势力）；普将；封建×西域＝封建时代安西军团；立绘留空














    ],
    // 🔴 [2026-10-20 主人令] 麴文泰＝高昌国王（麴氏本家），从「亦都护」键移回麴氏键
    gaochang: [
        { generalId: 'yiduhu_quwentai', cityId: 'city_gaochangcheng', generalName: '麴文泰', portrait: '/assets/WESTERN/yiduhu_quwentai.png', legionName: '封建时代安西军团' , eliteName: '高昌戍兵', eliteTier: 4 },   // 🔴 640 高昌麴氏的戍兵（原配「西州回鹘」是 840 年后）
        { generalId: 'bfe_quzhisheng', factionId: 'gaochang', cityId: 'city_gaochangcheng', generalName: '麴智盛', portrait: '/assets/WESTERN/bfe_quzhisheng.png', eliteName: '高昌守军', eliteTier: 4 },
    ],







    yuchi: [
        { generalId: 'yuchi_weichiyao', cityId: 'city_yutian2', generalName: '尉迟曜', portrait: '/assets/WESTERN/yuchi_weichiyao.png', eliteName: '西域兵', eliteTier: 4 },
        { generalId: 'bfe_guangde', cityId: 'city_yutian2', generalName: '广德', portrait: '/assets/WESTERN/bfe_guangde.png', factionId: 'yuchi', legionName: '古典时代西域军团', eliteName: '西域兵', eliteTier: 4 },
    
        { generalId: 'keliya_fuduxin', factionId: 'yuchi', cityId: 'city_yutian2', legionName: '封建时代安西军团', generalName: '伏阇信', portrait: '/assets/TIBET/keliya_fuduxin.png', eliteName: '西域兵', eliteTier: 4 },








    ],














    kala: { generalId: 'kala_satuke', cityId: 'city_shule', generalName: '萨图克', portrait: '/assets/WESTERN/kala_satuke.png', eliteName: '西域兵', eliteTier: 4 },







    an: { generalId: 'an_xibanni', cityId: 'city_bukhara', generalName: '昔班尼', portrait: '/assets/CENTRAL_ASIA/an_xibanni.png', eliteName: '乌兹别克兵', eliteTier: 2 },







    saman: { generalId: 'saman_yisimayi', cityId: 'city_bukhara', generalName: '伊斯玛仪', portrait: '/assets/CENTRAL_ASIA/saman_yisimayi.png', eliteName: '萨曼骑兵', eliteTier: 3 },







    wusun: { generalId: 'wusun_liejiaomi', cityId: 'city_chigucheng', generalName: '猎骄靡', portrait: '/assets/CENTRAL_ASIA/wusun_liejiaomi.png', eliteName: '河中骑兵', eliteTier: 4 },







    tujishi: { generalId: 'tujishi_sulukehan', cityId: 'city_talas', generalName: '苏禄', portrait: '/assets/WESTERN/tujishi_sulu.png', eliteName: '突骑施骑', eliteTier: 3 },







    xiliao: [







        { generalId: 'xiliao_yelvdashi', cityId: 'city_emil', generalName: '耶律大石', portrait: '/assets/CENTRAL_ASIA/xiliao_yelvdashi.png', eliteName: '契丹铁骑', eliteTier: 2 },







        // 🔴 [2026-10-20 成名战规则] 奥斯曼＝西喀喇汗末王（1212 撒马尔罕被花剌子模摩诃末攻灭）；西喀喇汗无独立势力，按其宗主西辽挂靠并报告；普将；封建×中亚＝封建时代河中军团；立绘留空







        { generalId: 'xiliao_uthman', cityId: 'city_suiye', legionName: '城堡时代河中军团', generalName: '奥斯曼', portrait: '/assets/CENTRAL_ASIA/xiliao_uthman.png', eliteName: '河中骑兵', eliteTier: 4 },







    ],







    jiazini: [







        { generalId: 'jiazini_mahamaode', cityId: 'city_jiaseni', generalName: '马哈茂德', portrait: '/assets/PERSIAN/jiazini_mahamaode.png', eliteName: '伽色尼骑兵', eliteTier: 3 },







        // 🔴 [2026-10-20 成名战规则] 马斯乌德＝伽色尼苏丹（1040 丹丹纳坎被塞尔柱大败）→ 哥疾宁·伽色尼；名将；立绘留空







        { generalId: 'jiazini_masud', cityId: 'city_jiaseni', generalName: '马斯乌德', portrait: '/assets/PERSIAN/jiazini_masud.png', eliteName: '伽色尼骑兵', eliteTier: 3 },







        // 🔴 [2026-10-20 成名战规则] 呼斯劳＝伽色尼末王（1175 赫拉特被古尔王朝击灭）→ 哥疾宁·伽色尼；普将；立绘留空







        { generalId: 'jiazini_khusrau_malik', cityId: 'city_jiaseni', legionName: '城堡时代法尔斯军团', generalName: '呼斯劳', portrait: '/assets/PERSIAN/jiazini_khusrau_malik.png', eliteName: '波斯步兵', eliteTier: 4 },







    
        { generalId: 'guzgan_abuhalisi', factionId: 'jiazini', cityId: 'city_fariyab', generalName: '阿布哈里斯', portrait: '/assets/PERSIAN/guzgan_abuhalisi.png', eliteName: '波斯步兵', eliteTier: 4 },








        { generalId: 'bfe_arslan_shah', factionId: 'jiazini', cityId: 'city_jiaseni', generalName: '阿尔斯兰沙', portrait: '/assets/PERSIAN/bfe_arslan_shah.png', eliteName: '伽色尼象兵', eliteTier: 3 },
    ],






    danmai: [
        // 🔴 [2026-10-25 主人令「存在就建」] 克里斯蒂安四世（1577–1648，丹麦-挪威国王）｜势力 丹麦｜据点 哥本哈根（丹麦首都）｜普将（卡尔马战争胜、三十年战争败，存疑）｜精锐「丹麦火枪兵」T4｜立绘留空
        { generalId: 'danmai_christian_iv', factionId: 'danmai', cityId: 'city_gebenhagen', generalName: '克里斯蒂安四世', portrait: '/assets/DANES/danmai_christian_iv.png', eliteName: '丹麦火枪兵', eliteTier: 4 },







        { generalId: 'danmai_abusalong', cityId: 'city_gebenhagen', generalName: '阿布萨隆', portrait: '/assets/DANES/danmai_abusalong.png', eliteName: '丹麦骑士', eliteTier: 3 },







        // 🔴 [2026-10-20 成名战规则] 古思伦＝丹麦维京军首领（878 埃丁顿战败、后受洗）→ 哥本哈根·丹麦；名将；立绘留空







        { generalId: 'danmai_guthrum', eliteName: '东盎军', eliteTier: 3, cityId: 'city_norwich', generalName: '古思伦', portrait: '/assets/DANES/danmai_guthrum.png' }, // 统治东盎格利亚的丹麦军本部
        { generalId: 'danmai_harald', cityId: 'city_jelling', generalName: '蓝牙哈拉尔', portrait: '/assets/DANES/danmai_harald.png', legionName: '封建时代丹人军团', eliteName: '耶灵亲兵', eliteTier: 4 },
        { generalId: 'danmai_godfred', cityId: 'city_hedeby', generalName: '戈德弗雷德', portrait: '/assets/DANES/danmai_godfred.png', legionName: '封建时代丹人军团', eliteName: '海瑟比卫队', eliteTier: 4 },







    ],







    ruidian_si: [
        { generalId: 'ruidian_si_biergeyaer', cityId: 'city_sidedegelmo', generalName: '比尔格雅尔', portrait: '/assets/GERMANIC/ruidian_si_biergeyaer.png', eliteName: '北欧民兵', eliteTier: 4 },
        // 🔴 [2026-10-20 成名战规则] 查理十二＝瑞典国王（1709 波尔塔瓦败于彼得一世）→ 斯德哥尔摩（GERMANIC）；帝国时代德意志佣兵军团；立绘留空
        { generalId: 'gen_charles_xii', cityId: 'city_sidedegelmo', generalName: '查理十二', portrait: '/assets/GERMANIC/gen_charles_xii.png', eliteName: '瑞典骑兵', eliteTier: 2 },
    
        { generalId: 'gen_charles_ix', factionId: 'ruidian_si', cityId: 'city_sidedegelmo', generalName: '卡尔九世', portrait: '/assets/GERMANIC/ruidian_yota_kaerjiushi.png', eliteName: '北欧民兵', eliteTier: 4 },








    
        { generalId: 'gen_olaf_skotkonung', factionId: 'ruidian_si', cityId: 'city_wupusala', generalName: '奥拉夫', portrait: '/assets/VARANGIANS/gen_olaf_skotkonung.png', legionName: '封建时代维京军团', eliteName: '北欧民兵', eliteTier: 4 },








    ],







    kasidiliya: [







        { generalId: 'kasidiliya_afangsuoshiyi', cityId: 'city_madeli', legionName: '城堡时代卡斯蒂利亚军团', generalName: '阿方索十一', portrait: '/assets/SPANISH/kasidiliya_afangsuoshiyi.png', eliteName: '卡斯蒂骑士', eliteTier: 3 },



        // 🔴 [2026-10-20 成名战规则] 胡安一世＝卡斯蒂利亚国王（1385 阿勒朱巴洛塔败于若昂一世）→ 马德里（SPANISH）；城堡×西班牙＝城堡时代卡斯蒂利亚军团；立绘留空



        { generalId: 'gen_juan_i_castile', cityId: 'city_madeli', generalName: '胡安一世', portrait: '/assets/SPANISH/gen_juan_i_castile.png', legionName: '城堡时代卡斯蒂利亚军团', eliteName: '卡斯蒂骑士', eliteTier: 3 },







        // 🔴 [2026-10-20 成名战规则] 阿方索八世＝卡斯蒂利亚王（1195 阿拉科斯败于穆瓦希德，1212 托洛萨大胜）→ 马德里·卡斯蒂利亚；名将；封建×西班牙＝封建时代摩尔游骑军团；立绘留空







        { generalId: 'kasidiliya_afangsuoba', cityId: 'city_madeli', legionName: '城堡时代卡斯蒂利亚军团', generalName: '阿方索八世', portrait: '/assets/SPANISH/kasidiliya_afangsuoba.png', eliteName: '卡斯蒂骑士', eliteTier: 3 },







    
        { generalId: 'gen_fernando_iii', factionId: 'kasidiliya', cityId: 'city_seville', generalName: '费尔南多', portrait: '/assets/SPANISH/gen_fernando_iii.png', eliteName: '卡斯蒂骑士', eliteTier: 3 },








    
        { generalId: 'gen_ferdinand_ii', legionName: '帝国时代西班牙方阵军团', factionId: 'kasidiliya', cityId: 'city_la_mota', generalName: '斐迪南二世', portrait: '/assets/SPANISH/trastamara_feidinanershi.png', eliteName: '西班牙方阵', eliteTier: 2 },
        // 🔴 [2026-10-24 中城补将·镇守] 贝拉尔德＝西班牙炮兵上尉，1808-05-02 马德里起义中死守蒙莱昂炮兵营、战死（《五月二日》）；马德里（SPANISH）、势力西班牙；帝国×西班牙＝帝国时代西班牙方阵军团；普将（守土殉城，无胜绩）；立绘留空
        { generalId: 'xibanya_beilaerde', generalName: '贝拉尔德', factionId: 'xibanya', cityId: 'city_madeli', portrait: '/assets/SPANISH/kasidiliya_peideluobeilaerde.png', eliteName: '蒙莱昂炮兵', eliteTier: 3, legionName: '帝国时代西班牙方阵军团' },








        { generalId: 'kasidiliya_sancho', factionId: 'kasidiliya', cityId: 'city_madeli', generalName: '桑丘国王', portrait: '/assets/SPANISH/kasidiliya_sancho.png', eliteName: '卡斯蒂骑兵', eliteTier: 3 },
    ],






    teluoyi: [







        { generalId: 'teluoyi_maniya', cityId: 'city_teluoyi', generalName: '马尼亚', portrait: '/assets/ORIE/teluoyi_maniya.png', eliteName: '阿拉伯步兵', eliteTier: 4 },







        { generalId: 'teluoyi_heketuoer', cityId: 'city_teluoyi', generalName: '赫克托耳', portrait: '/assets/ORIE/teluoyi_heketuoer.png', eliteName: '阿拉伯步兵', eliteTier: 4 },







    ],






    xijue: [







        { generalId: 'xijue_ganyanshou', factionId: 'xiongnu', cityId: 'city_toumancheng', generalName: '郅支', portrait: '/assets/CENTRAL_ASIA/xijue_ganyanshou.png', eliteName: '漠南骑手', eliteTier: 4 },







        // 🔴 [2026-10-20 成名战规则] 阿史那匐念＝西突厥十姓可汗（680 被裴行俭计擒于碎叶川）→ 碎叶·十箭；普将；封建×中亚＝封建时代河中军团；立绘留空







        { generalId: 'xijue_ashina_funian', cityId: 'city_zhizhicheng', generalName: '阿史那匐念', portrait: '/assets/CENTRAL_ASIA/xijue_ashina_funian.png', legionName: '封建时代图兰军团' , eliteName: '十箭铁骑', eliteTier: 3 },   // 🔴 康居精骑是郅支时代的西匈奴兵，不是 680 年西突厥十姓的兵







    ],







    // 养吉干·咸海 / 真珠河·乌护 宁缺毋滥















// ── 中亚区 2026-06-18 ──







    huarazim: [







        { generalId: 'huarazim_mohemo', cityId: 'city_urgench', generalName: '摩诃末', portrait: '/assets/CENTRAL_ASIA/huarazim_mohemo.png', eliteName: '花剌子模', eliteTier: 2 },







        // 🔴 [2026-10-20 成名战规则] 扎兰丁＝花剌子模末代沙阿（1231 被绰儿马罕击灭）→ 玉龙杰赤·花剌子模；名将；封建×中亚＝封建时代河中军团；立绘留空







        { generalId: 'huarazim_jalal', cityId: 'city_urgench', legionName: '城堡时代河中军团', generalName: '扎兰丁', portrait: '/assets/CENTRAL_ASIA/huarazim_jalal.png', eliteName: '花剌子模', eliteTier: 2 },







    ],







    kazakh: { generalId: 'kazakh_hasimu', cityId: 'city_turkestan', generalName: '哈斯木', portrait: '/assets/CENTRAL_ASIA/kazakh_hasimu.png', eliteName: '哈萨克骑兵', eliteTier: 3 },







    // 公元前327年索格狄亚那岩守帅（Rock of Ariamazes 的岩堡首领；英文维基信息框 commander2 = Arimazes）；







    //    立绘按铁律留空走保底图，等主人亲自放图







    suogediyana: { generalId: 'suogediyana_arimazes', cityId: 'city_suogediyanayan', generalName: '阿里马泽斯', portrait: '/assets/CENTRAL_ASIA/suogediyana_alimazeshi.png', eliteName: '河中骑兵', eliteTier: 4 },







    sogdian: [







        { generalId: 'sogdian_dewasitiqi', cityId: 'city_varaksha', generalName: '德瓦什提奇', portrait: '/assets/CENTRAL_ASIA/sogdian_dewasitiqi.png', eliteName: '河中骑兵', eliteTier: 4 },







        // 公元前328年索格底亚那岩山守帅（当地大贵族起义领袖奥克夏特斯），立绘按铁律留空走回落、待主人亲自放图分配







        { generalId: 'sogdian_aokexiate', cityId: 'city_varaksha', generalName: '奥克夏特斯', portrait: '/assets/CENTRAL_ASIA/sogdian_aokexiate.png', legionName: '古典时代粟特军团', eliteName: '河中骑兵', eliteTier: 4 },







    ],







    yanda: { generalId: 'yanda_touluoman', cityId: 'city_huoguocheng', generalName: '头罗曼', portrait: '/assets/CENTRAL_ASIA/yanda_touluoman.png', eliteName: '河中骑兵', eliteTier: 4 },







    yada: { generalId: 'yada_ahexiong', cityId: 'city_xiwanjin', generalName: '阿赫雄', portrait: '/assets/CENTRAL_ASIA/yada_ahexiong.png', eliteName: '嚈哒骑兵', eliteTier: 3 },







    anushidgin: { generalId: 'anushidgin_yile', cityId: 'city_khiva', generalName: '伊勒', portrait: '/assets/CENTRAL_ASIA/anushidgin_yile.png', eliteName: '河中骑兵', eliteTier: 4 },







    dayuan: { generalId: 'dayuan_wugua', cityId: 'city_guishancheng', generalName: '毋寡', portrait: '/assets/WESTERN/dayuan_wugua.png', eliteName: '西域兵', eliteTier: 4 },







    kokand: { generalId: 'kokand_alimukuli', cityId: 'city_kokand', generalName: '阿里木库力', portrait: '/assets/WESTERN/kokand_alimukuli.png', eliteName: '西域兵', eliteTier: 4 },







    dayuzi: { generalId: 'dayuzi_yinalechihei', cityId: 'city_sailan', generalName: '亦纳勒赤黑', portrait: '/assets/WESTERN/dayuzi_yinalechihei.png', eliteName: '西域兵', eliteTier: 4 },






    wugu_d: { generalId: 'wugu_d_tugelile', cityId: 'city_zhande', generalName: '图格里勒', portrait: '/assets/CENTRAL_ASIA/wugu_d_tugelile.png', eliteName: '乌古斯骑兵', eliteTier: 3 },












    shi_clan: { generalId: 'shi_clan_moheduotutun', cityId: 'city_tashkent', generalName: '莫贺咄吐屯', portrait: '/assets/WESTERN/shi_clan_moheduotutun.png', eliteName: '西域兵', eliteTier: 4 },







    mamon: { generalId: 'mamon_mameng', cityId: 'city_dargan', generalName: '马蒙', portrait: '/assets/CENTRAL_ASIA/mamon_mameng.png', eliteName: '河中骑兵', eliteTier: 4 },







    khoja: { generalId: 'khoja_apakehezhuo', cityId: 'city_shule', generalName: '阿帕克和卓', portrait: '/assets/WESTERN/khoja_apakehezhuo.png', eliteName: '西域兵', eliteTier: 4 },







    fanyanna: { generalId: 'fanyanna_xieer', cityId: 'city_fanyanna', generalName: '谢尔', portrait: '/assets/CENTRAL_ASIA/fanyanna_xieer.png', eliteName: '河中骑兵', eliteTier: 4 },







    kangju: { generalId: 'kangju_chebishi', cityId: 'city_kanka', generalName: '车鼻施', portrait: '/assets/WESTERN/kangju_chebishi.png', eliteName: '西域兵', eliteTier: 4 },







    zhaowu: { generalId: 'zhaowu_timuermieli', cityId: 'city_huzhan', generalName: '帖木儿灭里', portrait: '/assets/WESTERN/zhaowu_timuermieli.png', eliteName: '西域兵', eliteTier: 4 },







    qiepantuo: [








        { generalId: 'qiepantuo_luozhentan', cityId: 'city_humicheng', generalName: '罗真檀', portrait: '/assets/CENTRAL_ASIA/qiepantuo_luozhentan.png', eliteName: '河中骑兵', eliteTier: 4 },
        { generalId: 'humi_zhentan', factionId: 'qiepantuo', cityId: 'city_hunduduo', legionName: '封建时代吐蕃军团', generalName: '真檀', portrait: '/assets/TIBET/humi_zhentan.png', eliteName: '吐蕃骑兵', eliteTier: 4 },








    ],







    jie: { generalId: 'jie_sijinti', cityId: 'city_jieshuangna', generalName: '斯谨提', portrait: '/assets/CENTRAL_ASIA/jie_sijinti.png', eliteName: '河中骑兵', eliteTier: 4 },






    // ── 中国将·西域 2026-06-18 ──






    loulan: { generalId: 'loulan_suojie', cityId: 'city_jingjue', generalName: '索劼', portrait: '/assets/WESTERN/loulan_suojie.png', eliteName: '西域兵', eliteTier: 4 },







    juandu: { generalId: 'juandu_peixingjian', cityId: 'city_yiluolucheng', generalName: '裴行俭', portrait: '/assets/WESTERN/juandu_peixingjian.png', eliteName: '安西精兵', eliteTier: 2 },






    // 克里雅/赤斤/西宁/卡伦/果洛 宁缺毋滥















// ── 青藏区 2026-06-18 ──






    gurkha: [







        { generalId: 'gurkha_baduersaye', cityId: 'city_kathmandu', generalName: '巴都尔萨野', portrait: '/assets/TIBET/gurkha_badouersaye.png', eliteName: '廓尔喀兵', eliteTier: 3 },







        // 🔴 [2026-10-20 主人令「这些据点违规了……请删除。据点中有武将的话，请放到相同风格的临近据点」] 原据点 city_bhaktapur 已删 → 迁加德满都（同建筑风格最近），仍挂本政权 malla







        { generalId: 'bfe_jaya_prakash', cityId: 'city_kathmandu', generalName: '普拉卡什', portrait: '/assets/TIBET/bfe_jaya_prakash.png' , legionName: '帝国时代卫藏军团', eliteName: '廓尔喀兵', eliteTier: 3},







    ],






    khon: [
        { generalId: 'khon_basiba', cityId: 'city_sajia', generalName: '八思巴', portrait: '/assets/TIBET/khon_basiba.png', eliteName: '吐蕃骑兵', eliteTier: 4 },
        { generalId: 'khon_wangzun', factionId: 'khon', cityId: 'city_sajia', generalName: '本钦旺尊', portrait: '/assets/TIBET/khon_wangzun.png', eliteName: '吐蕃骑兵', eliteTier: 4 },   // 🔴 [2026-10-25 按史] 成名战敌将；萨迦政权末代本钦，1354 被擒；「本钦」为官号、旺尊是其名；据点萨迦（库内同城）；用势力精锐萨迦法王军
    ],







    xiadun: { generalId: 'xiadun_xiazhongawanglangjie', cityId: 'city_tingbu', generalName: '阿旺朗杰', portrait: '/assets/TIBET/xiadun_awanglangjie.png', eliteName: '吐蕃骑兵', eliteTier: 4 },






    tufa_d: { generalId: 'tufa_d_tufanutan', cityId: 'city_qingtang', generalName: '秃发傉檀', portrait: '/assets/KHITAN/tufa_d_tufanutan.png', eliteName: '漠南骑手', eliteTier: 4 }, // 按史：南凉曾都西平（青唐城），专归秃发鲜卑（漠南 XIANBEI）







    qifu_d: [
        { generalId: 'qifu_d_qifuchipan', cityId: 'city_fuhan', generalName: '乞伏炽磐', portrait: '/assets/KHITAN/qifu_d_qifuchipan.png', eliteName: '陇西骑兵', eliteTier: 3 },
        // 🔴 [2026-10-30 按史分城] 枹罕专归乞伏鲜卑（XIANBEI）；吐蕃木征移驻河湟青藏据点浇河（city_ledu，TIBET），先零羌靡忘移驻允吾（city_yunwu，TIBET）
        { generalId: 'tubo_muzheng', cityId: 'city_ledu', factionId: 'tubo', generalName: '木征', portrait: '/assets/KHITAN/tubo_muzheng.png', eliteName: '吐蕃骑兵', eliteTier: 4 },
        { generalId: 'bfe3_44', factionId: 'xianlingqiang', cityId: 'city_yunwu', generalName: '靡忘', portrait: '/assets/KHITAN/bfe3_44.png', eliteName: '吐蕃骑兵', eliteTier: 4 },
    ],






    jinchuan_g: [
        { generalId: 'jinchuan_g_shaluoben', cityId: 'city_leweizhai', generalName: '莎罗奔', portrait: '/assets/TIBET/jinchuan_g_shaluoben.png', eliteName: '吐蕃骑兵', eliteTier: 4 },
        { generalId: 'bfe_sonom', cityId: 'city_leweizhai', generalName: '索诺木', portrait: '/assets/TIBET/bfe_sonom.png', legionName: '帝国时代卫藏军团', eliteName: '吐蕃骑兵', eliteTier: 4 },
    
        { generalId: 'agui', factionId: 'manzhou_d', cityId: 'city_shenyang', generalName: '阿桂', portrait: '/assets/BASHU/agui.png', eliteName: '八旗护军', eliteTier: 2 },








    ],







    xiangxiong: [








        { generalId: 'xiangxiong_limixia_x', cityId: 'city_qionglong', generalName: '李迷夏', portrait: '/assets/TIBET/xiangxiong_limixia.png', eliteName: '吐蕃骑兵', eliteTier: 4 },
        { generalId: 'yangtong_chisongdezan', factionId: 'tubo', cityId: 'city_luoxie', generalName: '赤松德赞', portrait: '/assets/TIBET/yangtong_chisongdezan.png', eliteName: '吐蕃禁军', eliteTier: 3 },








    ],







    ladakh: [








        { generalId: 'ladakh_senggelangjie', cityId: 'city_leh', generalName: '僧格朗杰', portrait: '/assets/TIBET/ladakh_senggelangjie.png', eliteName: '吐蕃骑兵', eliteTier: 4 },
        { generalId: 'nanjie_nanjiewangqiu', factionId: 'ladakh', cityId: 'city_rituzong', generalName: '南杰旺秋', portrait: '/assets/TIBET/nanjie_nanjiewangqiu.png', eliteName: '吐蕃骑兵', eliteTier: 4 },








    ],







    khoshut: [
        { generalId: 'khoshut_lhasang', factionId: 'khoshut', cityId: 'city_luoxie', generalName: '拉藏', portrait: '/assets/TIBET/khoshut_lhasang.png', eliteName: '吐蕃骑兵', eliteTier: 4 },   // 🔴 [2026-10-25 按史] 成名战敌将；和硕特末代汗，1717 拉萨城破败死；名字只留本名（去「汗」头衔，同「固始汗」用本名先例）；据点逻些（TIBET）
        { generalId: 'khoshut_gushihan', cityId: 'city_dangxiong', generalName: '图鲁拜琥', portrait: '/assets/TIBET/khoshut_gushihan.png', eliteName: '和硕特骑', eliteTier: 3 },
        // 🔴 [2026-10-20 成名战规则] 罗卜藏丹津＝和硕特首领（1723 反清，1724 郭密败走）→ 当雄（khoshut 首城，TIBET）；帝国时代卫藏军团；立绘留空
        { generalId: 'gen_lobsang_danjin', cityId: 'city_dangxiong', generalName: '罗卜藏丹津', portrait: '/assets/TIBET/gen_lobsang_danjin.png', legionName: '帝国时代卫藏军团', eliteName: '和硕特骑', eliteTier: 3 },
    
        { generalId: 'dulan_dashibatuer', factionId: 'khoshut', cityId: 'city_taijinaier', generalName: '达什巴图尔', portrait: '/assets/TIBET/dulan_dashibatuer.png', eliteName: '吐蕃骑兵', eliteTier: 4 },








    ],






    karmapa: { generalId: 'karmapa_queyingduoji', cityId: 'city_chubusi', generalName: '却英多吉', portrait: '/assets/TIBET/karmapa_queyingduoji.png', eliteName: '吐蕃骑兵', eliteTier: 4 },







    xianlingqiang: [
        { generalId: 'bfe3_43', cityId: 'city_yunwu', generalName: '杨玉', portrait: '/assets/KHITAN/bfe3_43.png', eliteName: '吐蕃骑兵', eliteTier: 4 },
    ],







    lang_clan: [








        { generalId: 'lang_clan_jiangqujianzan', cityId: 'city_pibo', generalName: '绛曲坚赞', portrait: '/assets/TIBET/lang_clan_jiangqujianzan.png', eliteName: '帕竹骑兵', eliteTier: 3 },
        { generalId: 'niang_suonanjiabo', factionId: 'lang_clan', cityId: 'city_juemuzong', generalName: '索南加波', portrait: '/assets/TIBET/niang_suonanjiabo.png', eliteName: '吐蕃骑兵', eliteTier: 4 },








    
        { generalId: 'pazhu_redangunsangpa', factionId: 'lang_clan', cityId: 'city_jiangzi', generalName: '热丹衮桑帕', portrait: '/assets/TIBET/pazhu_redangunsangpa.png', eliteName: '吐蕃骑兵', eliteTier: 4 },








    ],






    khyungpo: { generalId: 'khyungpo_qiongbobangse', cityId: 'city_qiongbu', generalName: '琼波邦色', portrait: '/assets/TIBET/khyungpo_qiongbobangse.png', eliteName: '吐蕃骑兵', eliteTier: 4 },







    gar_kham: { generalId: 'gar_kham_dengbazeren', cityId: 'city_derge', generalName: '登巴泽仁', portrait: '/assets/TIBET/gar_kham_dengbazeren.png', eliteName: '吐蕃骑兵', eliteTier: 4 },






    supi: [







        { generalId: 'nvguo_mojie', factionId: 'supi', cityId: 'city_mapangyongcuo', generalName: '末羯', portrait: '/assets/TIBET/nvguo_mojie.png', eliteName: '吐蕃骑兵', eliteTier: 4 },







    ],







    tsangpa: { generalId: 'tsangpa_pengcuonanjie', cityId: 'city_sangzhuzi', generalName: '彭措南杰', portrait: '/assets/TIBET/tsangpa_pengcuonanjie.png', eliteName: '吐蕃骑兵', eliteTier: 4 },






    galangdiba: { generalId: 'galangdiba_wangqindundui', cityId: 'city_galangzong', generalName: '旺钦顿堆', portrait: '/assets/TIBET/galangdiba_wangqindundui.png', eliteName: '吐蕃骑兵', eliteTier: 4 },







    fuguo: { generalId: 'fuguo_yizeng', cityId: 'city_mangkangzong', generalName: '宜缯', portrait: '/assets/TIBET/fuguo_yizeng.png', eliteName: '吐蕃骑兵', eliteTier: 4 },







    bailang: { generalId: 'bailang_tangzeng', cityId: 'city_adunzi', generalName: '唐缯', portrait: '/assets/TIBET/bailang_tangzeng.png', eliteName: '吐蕃骑兵', eliteTier: 4 },






    xiaobolu: [








        { generalId: 'xiaobolu_meijinmang', cityId: 'city_nieduo', generalName: '没谨忙', portrait: '/assets/TIBET/xiaobolu_meijinmang.png', eliteName: '吐蕃骑兵', eliteTier: 4 },
        { generalId: 'nandou_sushili', factionId: 'xiaobolu', cityId: 'city_nieduo', generalName: '苏失利', portrait: '/assets/TIBET/nandou_sushili.png', eliteName: '吐蕃骑兵', eliteTier: 4 },








    ],







    guge: [








        { generalId: 'guge_chizhaxichabade', cityId: 'city_zhaburang2', generalName: '扎西查巴', portrait: '/assets/TIBET/guge_chizhaxichabade.png', eliteName: '吐蕃骑兵', eliteTier: 4 },
        { generalId: 'ali_gandancaiwang', factionId: 'ganden', cityId: 'city_gadake', legionName: '帝国时代卫藏军团', generalName: '甘丹才旺', portrait: '/assets/TIBET/ali_gandancaiwang.png', eliteName: '和硕特骑', eliteTier: 3 },








    ],






    kongsa: { generalId: 'kongsa_kongsayiduo', cityId: 'city_ganzi', generalName: '孔萨益多', portrait: '/assets/TIBET/kongsa_kongsayiduo.png', eliteName: '吐蕃骑兵', eliteTier: 4 }, // 甘孜







    gling: { generalId: 'gling_lingesar', cityId: 'city_jiegu', generalName: '格萨尔', portrait: '/assets/TIBET/gling_gesaer.png', eliteName: '吐蕃骑兵', eliteTier: 4 },







    daca: { generalId: 'daca_dacajilong', cityId: 'city_basu', generalName: '达擦济咙', portrait: '/assets/TIBET/daca_dacajilong.png', eliteName: '吐蕃骑兵', eliteTier: 4 }, // 八宿宗






    luohu: { generalId: 'luohu_ganmuding', cityId: 'city_khorat', generalName: '敢木丁', portrait: '/assets/KHMER/luohu_ganmuding.png', eliteName: '高棉步兵', eliteTier: 4 }, // 呵叻城·罗斛国王







    ailao: { generalId: 'ailao_leilao', cityId: 'city_baoshan', generalName: '类牢', portrait: '/assets/BASHU/ailao_leilao.png', eliteName: '巴蜀弩士', eliteTier: 4 }, // 永昌·哀牢反叛






  // ── 滇缅区 2026-06-18 ──







    dali: [








        { generalId: 'dali_duansiping', cityId: 'city_dali_city', generalName: '段思平', portrait: '/assets/BASHU/dali_duansiping.png', eliteName: '巴蜀弩士', eliteTier: 4 },
        { generalId: 'baiman_gaoshengtai', factionId: 'dali', cityId: 'city_dali_city', legionName: '城堡时代川峡军团', generalName: '高升泰', portrait: '/assets/BASHU/baiman_gaoshengtai.png', eliteName: '巴蜀弩士', eliteTier: 4 },








    ],







    dongxu: [
        { generalId: 'dongxu_mangruiti', cityId: 'city_dongxu_old', generalName: '莽瑞体', portrait: '/assets/BURMESE/dongxu_mangruiti.png', eliteName: '缅甸战象', eliteTier: 2 },
        // 🔴 [2026-10-20 成名战规则] 莽应里＝东吁王（1593 廓沙拉败于纳黎萱）→ 凯图玛蒂（BURMESE）；帝国时代缅甸军团；立绘留空
        { generalId: 'gen_nanda_bayin', cityId: 'city_bago', generalName: '莽应里', portrait: '/assets/BURMESE/gen_nanda_bayin.png', legionName: '帝国时代缅甸军团', eliteName: '缅甸战象', eliteTier: 2 },
        { generalId: 'bfe_mingyiswa', factionId: 'dongxu', cityId: 'city_bago', generalName: '明耶苏瓦', portrait: '/assets/BURMESE/bfe_mingyiswa.png', eliteName: '勃固象兵', eliteTier: 3 },
    ],







    meitai: { generalId: 'meitai_hagenba', cityId: 'city_kangla', generalName: '哈根巴', portrait: '/assets/BENGALIS/meitai_hagenba.png', eliteName: '孟加拉兵', eliteTier: 4 },  // 康格拉·曼尼普尔国王






    dianguo: [







        { generalId: 'dianguo_zhuangqiao', cityId: 'city_tuodongcheng', generalName: '庄蹻', portrait: '/assets/BASHU/dianguo_zhuangqiao.png', eliteName: '巴蜀弩士', eliteTier: 4 },







        // 🔴 [2026-10-20 主人令「放到离他事发地最近的相同建筑风格文化的据点」「所有武将都这么处理，不要擅自添加据点」] 事发地＝远征平滇称王之役 → 最近同风格据点滇池







        { generalId: 'bfe_dian_chief', cityId: 'city_tuodongcheng', legionName: '古典时代巴蜀军团', generalName: '苴兰', portrait: '/assets/BASHU/bfe_dian_chief.png' , eliteName: '靡莫部兵', eliteTier: 4},







        { generalId: 'gen_mingrui', factionId: 'manzhou_d', cityId: 'city_shenyang', generalName: '明瑞', portrait: '/assets/NORTHEAST/gen_mingrui.png', eliteName: '八旗护军', eliteTier: 2 },
    ],







    konbaung: { generalId: 'konbaung_yongjiya', cityId: 'city_shwebo', generalName: '雍笈牙', portrait: '/assets/BURMESE/konbaung_yongjiya.png', eliteName: '贡榜枪兵', eliteTier: 3 },







    hantawadi: [
        { generalId: 'hantawadi_mangyinglong', cityId: 'city_bago', generalName: '莽应龙', portrait: '/assets/BURMESE/hantawadi_mangyinglong.png', eliteName: '缅甸战象', eliteTier: 2 },
        // 🔴 [2026-10-20 成名战规则] 彬尼亚达拉＝汉达瓦底末王（1757 勃固被雍籍牙攻灭）→ 勃固（BURMESE）；帝国时代缅甸军团；立绘留空
        { generalId: 'gen_binnya_dala', cityId: 'city_bago', generalName: '彬尼亚达拉', portrait: '/assets/BURMESE/gen_binnya_dala.png', legionName: '帝国时代缅甸军团', eliteName: '缅甸象兵', eliteTier: 4 },
        { generalId: 'bfe_takayutpi', factionId: 'hantawadi', cityId: 'city_bago', generalName: '多迦逾毕', portrait: '/assets/BURMESE/bfe_takayutpi.png', eliteName: '勃固守军', eliteTier: 4 },
    ],







    nanzhao: [







        { generalId: 'nanzhao_geluofeng', cityId: 'city_mengshe', generalName: '阁罗凤', portrait: '/assets/BASHU/nanzhao_geluofeng.png', eliteName: '罗苴子', eliteTier: 2 },







        // 🔴 [2026-10-20 成名战规则] 段酋迁＝南诏将（866 守交趾被高骈击破）→ 蒙舍城·南诏；普将；立绘留空







        { generalId: 'nanzhao_duanqiuxian', cityId: 'city_mengshe', generalName: '段酋迁', portrait: '/assets/BASHU/nanzhao_duanqiuxian.png', eliteName: '巴蜀弩士', eliteTier: 4 },







    
        { generalId: 'jingdong_taohong', factionId: 'ming_d', cityId: 'city_yinsheng', generalName: '陶洪', portrait: '/assets/BASHU/jingdong_taohong.png', eliteName: '巴蜀弩士', eliteTier: 4 },








    
        { generalId: 'kunming_yi_lucheng', factionId: 'han_d', cityId: 'city_huichuan', legionName: '古典时代巴蜀军团', generalName: '卤承', portrait: '/assets/BASHU/kunming_yi_lucheng.png', eliteName: '巴蜀弩士', eliteTier: 4 },








    ],






    dai: { generalId: 'dai_daoyingmeng', cityId: 'city_mengle', generalName: '刀应勐', portrait: '/assets/BURMESE/dai_daoyingmeng.png', eliteName: '缅甸象兵', eliteTier: 4 },







    taiyuan: { generalId: 'taiyuan_menglai', cityId: 'city_chingkham', generalName: '孟莱', portrait: '/assets/MALAY/taiyuan_menglai.png', eliteName: '兰纳象兵', eliteTier: 3 },







    suke: { generalId: 'suke_langanheng', cityId: 'city_shuanghe', generalName: '兰甘亨', portrait: '/assets/KHMER/suke_langanheng.png', eliteName: '高棉步兵', eliteTier: 4 },







    luchuan: [



        { generalId: 'luchuan_sirenfa', cityId: 'city_mengmao', generalName: '思任发', portrait: '/assets/BURMESE/luchuan_sirenfa.png', eliteName: '麓川象兵', eliteTier: 3 },



        // 🔴 [2026-10-20 成名战规则] 思伦发＝麓川土司（1388 定远之战被沐英击败）→ 勐卯（BURMESE）；城堡时代阿瓦军团；立绘留空



        { generalId: 'gen_si_lunfa', cityId: 'city_mengmao', generalName: '思伦发', portrait: '/assets/BURMESE/gen_si_lunfa.png', legionName: '城堡时代阿瓦军团', eliteName: '缅甸象兵', eliteTier: 4 },



    ],






    cuanshi: [








        { generalId: 'cuanshi_cuanlongyan', cityId: 'city_weixian2', generalName: '爨龙颜', portrait: '/assets/BASHU/cuanshi_cuanlongyan.png', eliteName: '巴蜀弩士', eliteTier: 4 },
        { generalId: 'wuman_gaipin', factionId: 'cuanshi', cityId: 'city_wumeng', legionName: '封建时代剑南军团', generalName: '盖聘', portrait: '/assets/BASHU/wuman_cuangui.png', eliteName: '巴蜀弩士', eliteTier: 4 },








    
        { generalId: 'dian_cuanchongdao', factionId: 'cuanshi', cityId: 'city_tonghai', legionName: '封建时代剑南军团', generalName: '爨崇道', portrait: '/assets/BASHU/dian_cuanchongdao.png', eliteName: '巴蜀弩士', eliteTier: 4 },








    
        { generalId: 'xinggu_cuanxi', factionId: 'cuanshi', cityId: 'city_luoxiong', generalName: '爨习', portrait: '/assets/BASHU/xinggu_cuanxi.png', eliteName: '巴蜀弩士', eliteTier: 4 },







    ],






    champa: [







        { generalId: 'champa_zhipenge', cityId: 'city_myson', generalName: '制蓬峨', portrait: '/assets/KHMER/champa_zhipenge.png', eliteName: '高棉战象', eliteTier: 2 },







        // 🔴 [2026-10-20 成名战规则] 阇耶因陀罗跋摩四世＝占婆王（1181 洞里萨湖水战败于阇耶跋摩七世）→ 美山·占婆；普将；封建×高棉＝封建时代高棉军团；立绘留空







        { generalId: 'champa_jaya_indravarman_iv', cityId: 'city_myson', legionName: '城堡时代吴哥军团', generalName: '阇耶因陀罗跋摩四世', portrait: '/assets/KHMER/champa_jaya_indravarman_iv.png', eliteName: '高棉步兵', eliteTier: 4 },







    
        { generalId: 'linyi_fanyangmai', factionId: 'champa', cityId: 'city_xianglin', legionName: '古典时代交趾军团', generalName: '范阳迈', portrait: '/assets/VIETNAMESE/linyi_fanyangmai.png', eliteName: '越南民兵', eliteTier: 4 },







    
        { generalId: 'zhancheng_zhimin', cityId: 'city_dupan', legionName: '城堡时代大越军团', generalName: '制旻', portrait: '/assets/VIETNAMESE/zhancheng_zhimin.png', factionId: 'champa' , eliteName: '占婆国水师', eliteTier: 3 },







    ],






    // 莽应龙已移给 dongxu






    basha_d: { generalId: 'basha_d_daogengmeng', cityId: 'city_shangding', generalName: '刀更孟', portrait: '/assets/KHMER/basha_d_daogengmeng.png', eliteName: '高棉步兵', eliteTier: 4 }, // 上丁·巴沙象兵






    ketagalan: { generalId: 'ketagalan_huangqingyun', cityId: 'city_mengjia', generalName: '黄青云', portrait: '/assets/JIANGNAN/ketagalan_huangqingyun.png', eliteName: '江南郡兵', eliteTier: 4 }, // 艋舺·凯达格兰







    shuizhen: { generalId: 'shuizhen_qudaren', cityId: 'city_sanpu', generalName: '区大任', portrait: '/assets/KHMER/shuizhen_qudaren.png', eliteName: '高棉步兵', eliteTier: 4 }, // 三菩·水真戍







  // ── 岭南/越南/台湾区 2026-06-18 ──







    ryukyu: [








        { generalId: 'ryukyu_shangbazhi', cityId: 'city_shuri', generalName: '尚巴志', portrait: '/assets/JAPAN/ryukyu_shangbazhi.png', eliteName: '日本足轻', eliteTier: 4 },
        { generalId: 'anmei_yuwandaqin', factionId: 'ryukyu', cityId: 'city_akakinagusuku', legionName: '帝国时代武家军团', generalName: '与湾大亲', portrait: '/assets/JAPAN/anmei_yuwandaqin.png', eliteName: '日本足轻', eliteTier: 4 },








    
        { generalId: 'gonggu_gonggudaozhu', factionId: 'ryukyu', cityId: 'city_gugudao', generalName: '麻利芝', portrait: '/assets/JAPAN/gonggu_gonggudaozhu.png', eliteName: '日本足轻', eliteTier: 4 },








    ],






    dengmaoqi: { generalId: 'dengmaoqi_dengmaoqi', cityId: 'city_shaxian', generalName: '邓茂七', portrait: '/assets/JIANGNAN/dengmaoqi_dengmaoqi.png', legionName: '起义军', eliteName: '荆楚兵', eliteTier: 4 },






    longwu: [
        { generalId: 'longwu_huangdaozhou', cityId: 'city_jianning', generalName: '黄道周', portrait: '/assets/JIANGNAN/longwu_huangdaozhou.png', eliteName: '荆楚兵', eliteTier: 4 },
        { generalId: 'bfe3_75', cityId: 'city_jianning', generalName: '刘胄', portrait: '/assets/JIANGNAN/bfe3_75.png', factionId: 'shu', legionName: '古典时代吴越军团', eliteName: '荆楚兵', eliteTier: 4 },
    
        { generalId: 'geng_gengjingzhong', factionId: 'manzhou_d', cityId: 'city_fuzhou', legionName: '帝国时代两江军团', generalName: '耿精忠', portrait: '/assets/JIANGNAN/geng_gengjingzhong.png', eliteName: '靖南藩兵', eliteTier: 3  },   // 按史：耿精忠袭靖南王，藩下汉军藩兵（《清史稿·耿精忠传》）







        // 🔴 [2026-10-24 险要补将·镇守] 郑彩＝南明隆武朝守仙霞关，1646 年清军入闽时驻守；普将；精锐「郑氏水师」T3
        { generalId: 'xianxia_zhengcai', generalName: '郑彩', factionId: 'longwu', cityId: 'city_xianxia', portrait: '/assets/JIANGNAN/longwu_zhengcai.png', eliteName: '郑氏水师', eliteTier: 3 },
        // 🔴 [2026-10-25 险要补将·镇守] 焦琏＝南明桂林守将，古严关为桂林北门户，属其防御战区；普将；精锐「桂林守军」T4
        { generalId: 'guyan_jiaolian', generalName: '焦琏', factionId: 'longwu', cityId: 'city_guyanguan', portrait: '/assets/JIANGNAN/longwu_jiaolian.png', eliteName: '桂林守军', eliteTier: 4 },
        { generalId: 'longwu_zhengzhilong', factionId: 'longwu', cityId: 'city_yanping', generalName: '郑芝龙', portrait: '/assets/JIANGNAN/longwu_zhengzhilong.png', eliteName: '郑家水师', eliteTier: 3 },   // 南明隆武朝太师、平国公，隆武行在驻延平，郑氏水师据此（居住）
    ],






    paiwan: { generalId: 'paiwan_alugu', cityId: 'city_mudan', generalName: '阿禄古', portrait: '/assets/MALAY/paiwan_alugu.png', eliteName: '马来兵', eliteTier: 4 },







    ming_zheng: [
        { generalId: 'ming_zheng_zhengchenggong', cityId: 'city_tainan', generalName: '郑成功', portrait: '/assets/JIANGNAN/ming_zheng_zhengchenggong.png', eliteName: '铁人军', eliteTier: 1 },
        // 🔴 [2026-10-20 成名战规则] 刘国轩＝明郑澎湖守将（1683 澎湖海战败于施琅）→ 承天（JIANGNAN）；帝国时代两江军团；立绘留空
        { generalId: 'gen_liu_guoxuan', cityId: 'city_tainan', generalName: '刘国轩', portrait: '/assets/JIANGNAN/gen_liu_guoxuan.png', legionName: '帝国时代两江军团', eliteName: '明郑水师', eliteTier: 3 },
    ],






    zhuang_d: { generalId: 'zhuang_d_washifuren', cityId: 'city_tianyang', generalName: '瓦氏', portrait: '/assets/JIANGNAN/zhuang_d_washifuren.png', eliteName: '荆楚兵', eliteTier: 4 },







    nanyue: [








        { generalId: 'nanyue_zhaotuo', cityId: 'city_longchuan', generalName: '赵佗', portrait: '/assets/JIANGNAN/nanyue_zhaotuo.png', eliteName: '南越象兵', eliteTier: 3 },
        { generalId: 'shixing_houandou', factionId: 'chen', cityId: 'city_hengpuguan', legionName: '封建时代江淮军团', generalName: '侯安都', portrait: '/assets/JIANGNAN/shixing_houandou.png', eliteName: '陈军精锐', eliteTier: 3 },








    
        { generalId: 'paiyao_huangguasi', factionId: 'panyao', cityId: 'city_yangshanguan', legionName: '帝国时代两江军团', generalName: '黄瓜四', portrait: '/assets/JIANGNAN/paiyao_huangguasi.png', eliteName: '荆楚兵', eliteTier: 4 },








    ],







    // 制旻＝占城（占婆）国王，「占城」是占婆的汉名 → 统一挂占婆






    xiou: [
        { generalId: 'xiou_yixusong', cityId: 'city_bushan', generalName: '译吁宋', portrait: '/assets/JIANGNAN/xiou_yixusong.png', eliteName: '荆楚兵', eliteTier: 4 },
        { generalId: 'bfe3_16', cityId: 'city_bushan', generalName: '桀骏', portrait: '/assets/JIANGNAN/bfe3_16.png', legionName: '古典时代吴越军团', eliteName: '荆楚兵', eliteTier: 4 },
    ],














    gouding: { generalId: 'gouding_wubo', cityId: 'city_guangnan', generalName: '毋波', portrait: '/assets/BASHU/gouding_wubo.png', eliteName: '巴蜀弩士', eliteTier: 4 },







    chen: { generalId: 'chen_chenbaxian', cityId: 'city_qujiang', generalName: '陈霸先', portrait: '/assets/JIANGNAN/chen_chenbaxian.png', eliteName: '陈军精锐', eliteTier: 3 },






    luodian: [








        { generalId: 'luodian_shexiang', cityId: 'city_dafang', generalName: '奢香', portrait: '/assets/BASHU/luodian_shexiang.png', eliteName: '巴蜀弩士', eliteTier: 4 },
        { generalId: 'shuixi_anbangyan', factionId: 'luodian', cityId: 'city_bijie', legionName: '帝国时代四川军团', generalName: '安邦彦', portrait: '/assets/BASHU/shuixi_anbangyan.png', eliteName: '巴蜀弩士', eliteTier: 4 },








    ],






    taiping: [








        { generalId: 'taiping_shidakai', cityId: 'city_jintian', generalName: '石达开', portrait: '/assets/JIANGNAN/taiping_shidakai.png', legionName: '起义军', eliteName: '太平锐卒', eliteTier: 3 },
        { generalId: 'jingjiang_qushisi', factionId: 'longwu', cityId: 'city_lingqu', generalName: '瞿式耜', portrait: '/assets/JIANGNAN/jingjiang_qushisi.png', eliteName: '荆楚兵', eliteTier: 4 },








        { generalId: 'taiping_yangxiuqing', factionId: 'taiping', cityId: 'city_yongan', generalName: '杨秀清', portrait: '/assets/JIANGNAN/taiping_yangxiuqing.png', eliteName: '太平锐卒', eliteTier: 3 },   // 1851 永安建制封东王、掌军政（居住永安）
    ],






    luoyue: { generalId: 'luoyue_zhengce', cityId: 'city_shenglong', legionName: '古典时代交趾军团', generalName: '征侧', portrait: '/assets/JIANGNAN/luoyue_zhengce.png', eliteName: '越南民兵', eliteTier: 4 },






    dacheng: { generalId: 'dacheng_chenkai', cityId: 'city_jintian', generalName: '陈开', portrait: '/assets/JIANGNAN/dacheng_chenkai.png', eliteName: '荆楚兵', eliteTier: 4 },







    dayue: [







        { generalId: 'dayue_chenguojun', cityId: 'city_shenglong', generalName: '陈国峻', portrait: '/assets/VIETNAMESE/dayue_chenguojun.png', eliteName: '陈朝象兵', eliteTier: 2 },







    








    
        { generalId: 'leloi', factionId: 'dayue', cityId: 'city_xidu', generalName: '黎利', portrait: '/assets/VIETNAMESE/leloi.png', eliteName: '蓝山义军', eliteTier: 1  },   // 按史：黎利 1418 蓝山起义，十年抗明建后黎朝（《明史·安南传》《大越史记全书》）








        { generalId: 'gen_wang_tong', factionId: 'ming_d', cityId: 'city_luoyang', generalName: '王通', portrait: '/assets/WEI/gen_wang_tong.png', eliteName: '中原郡兵', eliteTier: 4 },
        { generalId: 'bfe_su_ding', cityId: 'city_shenglong', generalName: '苏定', portrait: '/assets/JIANGNAN/bfe_su_ding.png', factionId: 'han_d', legionName: '古典时代交趾军团', eliteName: '越南民兵', eliteTier: 4 },
    ],






    liren: [








        { generalId: 'liren_funanshe', cityId: 'city_yazhou', generalName: '符南蛇', portrait: '/assets/JIANGNAN/liren_funanshe.png', eliteName: '江南郡兵', eliteTier: 4 },
        { generalId: 'xian_d_xianfuren', factionId: 'liren', cityId: 'city_gaoliang', legionName: '封建时代江淮军团', generalName: '冼英', portrait: '/assets/JIANGNAN/xian_d_xianfuren.png', eliteName: '俚人女兵', eliteTier: 3 },








    ],







    // 🔴 [2026-10-25] 原注「guangnanguo → 洞海城改为 panjun」已作废：panjun 占位势力按主人令删除，
    //    洞海城及各家起义首领均归各自真实政权（越南／乾会／侗族…）。








    yelang: [








        { generalId: 'yelang_duotong', cityId: 'city_puding', generalName: '多同', portrait: '/assets/BASHU/yelang_duotong.png', eliteName: '巴蜀弩士', eliteTier: 4 },
        { generalId: 'miao_amishi', factionId: 'luodian', cityId: 'city_hezhang', legionName: '城堡时代川峡军团', generalName: '阿迷氏', portrait: '/assets/BASHU/miao_amishi.png', eliteName: '巴蜀弩士', eliteTier: 4 },








    
        { generalId: 'miao_qing_yangwanzhe', factionId: 'yuan_d', cityId: 'city_hangzhou', legionName: '城堡时代江南军团', generalName: '杨完者', portrait: '/assets/BASHU/miao_qing_yangwanzhe.png', eliteName: '江南郡兵', eliteTier: 4 },
        { generalId: 'bfe3_50', cityId: 'city_qielancheng', generalName: '头兰', portrait: '/assets/BASHU/bfe3_50.png', factionId: 'yelang', legionName: '古典时代巴蜀军团', eliteName: '巴蜀弩士', eliteTier: 4 },








    ],






      // ── 巴蜀关隘 2026-06-19 ──






    chenghan: [







        { generalId: 'chenghan_lite', cityId: 'city_mianzhuguan', generalName: '李特', portrait: '/assets/BASHU/chenghan_lite.png', eliteName: '巴氐义从', eliteTier: 3 },
        { generalId: 'liao_houhongyuan', factionId: 'chenghan', cityId: 'city_jiangyang', generalName: '侯弘远', portrait: '/assets/BASHU/liao_houhongyuan.png', eliteName: '巴蜀弩士', eliteTier: 4 },







    
        { generalId: 'qingyi_fanchangsheng', factionId: 'chenghan', cityId: 'city_chengdu', generalName: '范长生', portrait: '/assets/BASHU/qingyi_fanchangsheng.png', eliteName: '巴蜀弩士', eliteTier: 4 },







    ],






    // 勒乌围·金川 / 乌蒙山·乌蛮 宁缺毋滥







// ── 巴蜀区 2026-06-18 ──






    daxi_ming: [
        { generalId: 'bfe3_78', factionId: 'shu', cityId: 'city_mianyang', generalName: '诸葛瞻', portrait: '/assets/BASHU/bfe3_78.png', legionName: '古典时代巴蜀军团' , eliteName: '蜀汉卫军', eliteTier: 3},
    ],






    fushi: [














        // 名将双身份：苻融（据点武将＋剧本敌将）














        // 🔴 [2026-10-20 主人令「遇到问题先看符合历史，下结论再动手」] 成名战回补安置按史实复核：张浚＝南宋川陕宣抚处置使，1130 富平战后驻兴州（今略阳）；开封从未是他的驻地 → 放略阳（fushi，风格 BASHU）；仍挂本政权 song
    ],






    ba: { generalId: 'ba_bamanzi', cityId: 'city_chongqing', generalName: '巴蔓子', portrait: '/assets/BASHU/ba_bamanzi.png', eliteName: '巴蜀弩士', eliteTier: 4 },






    qiuchi: [







        { generalId: 'qiuchi_yangnandang', cityId: 'city_qiuchi', generalName: '杨难当', portrait: '/assets/BASHU/qiuchi_yangnandang.png', eliteName: '巴蜀弩士', eliteTier: 4 },
        // 🔴 [2026-10-25 主人令] 三国魏非先秦武将：不跟「先秦军团」指针，按格位（阴平 BASHU × 古典）取巴蜀军团
        { generalId: 'dangzhou_qiangduan', factionId: 'wei', cityId: 'city_dangchang', legionName: '古典时代巴蜀军团', generalName: '强端', portrait: '/assets/BASHU/dangzhou_qiangduan.png', eliteName: '阴平氐兵', eliteTier: 4  },   // 按史：阴平氐强端斩吴兰传其首（《三国志·卷一·武帝纪》）







    ],






    bandun: [







        { generalId: 'bandun_fanmu', cityId: 'city_hanchang', generalName: '范目', portrait: '/assets/BASHU/bandun_fanmu.png', eliteName: '巴蜀弩士', eliteTier: 4 },
        { generalId: 'cong_puhu', factionId: 'bandun', cityId: 'city_dangqu', generalName: '朴胡', portrait: '/assets/BASHU/cong_puhu.png', eliteName: '巴蜀弩士', eliteTier: 4 },







    ],






    // 🔴 [2026-10-20 主人定「藏羌一家」] 梁弥定＝宕昌羌王，羌与藏同源，挂青藏文化的封建时代吐蕃军团可以（迭部风格已按史实改青藏）














  // ── 河西区 2026-06-18 ──






    dashun: { generalId: 'dashun_lizicheng', cityId: 'city_changan', generalName: '李自成', portrait: '/assets/CENTRAL/dashun_lizicheng.png', legionName: '起义军', eliteName: '闯营', eliteTier: 3 },






    guiyi: [







        { generalId: 'guiyi_caoyijin', cityId: 'city_dunhuang', generalName: '曹议金', portrait: '/assets/KHITAN/guiyi_caoyijin.png', eliteName: '契丹骑手', eliteTier: 4 },
        { generalId: 'shazhou_zhangyichao', factionId: 'guiyi', cityId: 'city_dunhuang', generalName: '张议潮', portrait: '/assets/KHITAN/shazhou_zhangyichao.png', eliteName: '归义军', eliteTier: 1 },







    ],






    helian: { generalId: 'helian_helianbobo', cityId: 'city_tongwancheng', generalName: '赫连勃勃', portrait: '/assets/XIANBEI/helian_helianbobo.png', eliteName: '统万突骑', eliteTier: 3 },






    // 🔴 [2026-10-20 主人「武将安置错误请修复」] 原条目把西汉光禄勋「徐自为」错当匈奴浑邪部守将；前121 河西之战的对手是浑邪王，王号即其名（本名未传）→ 改名浑邪王，立绘留空（原图是徐自为的，不配给他）






    dangxiang: [








        { generalId: 'dangxiang_liyuanhao', cityId: 'city_xingqingfu2', generalName: '李元昊', portrait: '/assets/KHITAN/dangxiang_liyuanhao.png', eliteName: '铁鹞子', eliteTier: 0 },
        { generalId: 'yeli_yeliwangrong', factionId: 'dangxiang', cityId: 'city_keyimen', generalName: '野利旺荣', portrait: '/assets/XIANBEI/yeli_yeliwangrong.png', eliteName: '党项骑兵', eliteTier: 2 },








    
        { generalId: 'yingli_jilasiyi', factionId: 'dangxiang', cityId: 'city_mingsha', legionName: '城堡时代大夏军团', generalName: '籍辣思义', portrait: '/assets/KHITAN/yingli_jilasiyi.png', eliteName: '契丹骑手', eliteTier: 4 },







    
        { generalId: 'xiazhou_lijiqian', cityId: 'city_jingbianbao', generalName: '李继迁', portrait: '/assets/KHITAN/xiazhou_lijiqian.png', factionId: 'dangxiang', eliteName: '党项骑兵', eliteTier: 2 },   // 按史：李继迁生于银州无定河畔（今陕西靖边境，库里靖边堡），由此起兵抗宋建夏（《宋史·夏国传》）；回乐专归唐朔方军，不与唐将混居,







    ],






    // 🔴 [2026-10-20 抽查] 仆固怀恩：唐朔方节度使（原挂灵州藩镇势力）→ 势力=唐国；据点回乐（灵州/灵武）✓；精锐 朔方军 T1






    juqu_d: { generalId: 'juqu_d_juqumengxun', cityId: 'city_biaoshi', generalName: '沮渠蒙逊', portrait: '/assets/KHITAN/juqu_d_juqumengxun.png', eliteName: '卢水胡骑', eliteTier: 3 },














// ── 中原区 2026-06-18 ──







    tianxiong: { generalId: 'tianxiong_tianchengsi', cityId: 'city_daming', generalName: '田承嗣', portrait: '/assets/CENTRAL/tianxiong_tianchengsi.png', eliteName: '中原郡兵', eliteTier: 4 },







    ranwei_d: [
        { generalId: 'ranwei_d_ranmin', cityId: 'city_anyang', legionName: '古典时代华夏军团', generalName: '冉闵', portrait: '/assets/WEI/ranwei_d_ranmin.png', eliteName: '乞活军', eliteTier: 2 },
        { generalId: 'bfe_ren_guang', eliteName: '大汉材官', eliteTier: 2, cityId: 'city_xindu', generalName: '任光', portrait: '/assets/CENTRAL/bfe_ren_guang.png', factionId: 'han_d', legionName: '古典时代太行军团' },
    ],







    jin: [
        { generalId: 'jin_xianzhen', cityId: 'city_quwo', generalName: '先轸', portrait: '/assets/CENTRAL/jin_xianzhen.png' , legionName: '先秦军团', eliteName: '晋三军', eliteTier: 2 },
        { generalId: 'bfe2_xun_linfu', cityId: 'city_quwo', generalName: '荀林父', portrait: '/assets/CENTRAL/bfe2_xun_linfu.png', legionName: '古典时代华夏军团', eliteName: '中原郡兵', eliteTier: 4 },
    
        { generalId: 'yangshe_yangshezhi', factionId: 'jin', cityId: 'city_tongdi', generalName: '羊舌职', portrait: '/assets/CENTRAL/yangshe_yangshezhi.png' , legionName: '先秦军团', eliteName: '中原郡兵', eliteTier: 4 },








        // 🔴 [2026-10-25 主人令] 西晋（与春秋晋同势力）非先秦武将：不跟「先秦军团」指针，按格位取古典军团
        { generalId: 'bfe_wangyan', factionId: 'dongjin', cityId: 'city_luoyang', legionName: '古典时代华夏军团', generalName: '王衍', portrait: '/assets/CENTRAL/bfe_wangyan.png', eliteName: '晋廷禁军', eliteTier: 4 },
    ],






    chimei: { generalId: 'chimei_fanchong', cityId: 'city_ju', generalName: '樊崇', portrait: '/assets/CENTRAL/chimei_fanchong.png', legionName: '起义军', eliteName: '中原郡兵', eliteTier: 4 },






    qi: [
        { generalId: 'qi_tianji', factionId: 'qi', cityId: 'city_linzi', generalName: '田忌', portrait: '/assets/CENTRAL/qi_tianji.png', eliteName: '齐技击', eliteTier: 2 },   // 🔴 [2026-10-25 按史] 成名战敌将；齐主将，前341 马陵之战；据点临淄（CENTRAL）；库已有孙膑为军师，敌将取主帅田忌（敌方主帅口径更硬）；用势力精锐齐之技击
        { generalId: 'bfe3_90', factionId: 'murong', cityId: 'city_jicheng', generalName: '慕容超', portrait: '/assets/CENTRAL/bfe3_90.png', eliteName: '漠南骑手', eliteTier: 4 },
        { generalId: 'bfe3_58', cityId: 'city_linzi', generalName: '张步', portrait: '/assets/CENTRAL/bfe3_58.png', legionName: '古典时代华夏军团', eliteName: '中原郡兵', eliteTier: 4 },
        { generalId: 'bfe2_bao_shuya', cityId: 'city_linzi', generalName: '鲍叔牙', portrait: '/assets/CENTRAL/bfe2_bao_shuya.png', legionName: '古典时代华夏军团', eliteName: '中原郡兵', eliteTier: 4 },
        { generalId: 'qi_simarangju', cityId: 'city_linzi', generalName: '司马穰苴', portrait: '/assets/CENTRAL/qi_simarangju.png' , legionName: '先秦军团', eliteName: '中原郡兵', eliteTier: 4 },
        { generalId: 'bfe2_qi_qinggong', cityId: 'city_linzi', generalName: '齐顷公', portrait: '/assets/CENTRAL/bfe2_qi_qinggong.png', legionName: '古典时代华夏军团', eliteName: '中原郡兵', eliteTier: 4 },
    
        { generalId: 'jiaodong_tiandan', factionId: 'qi', cityId: 'city_jimo', legionName: '古典时代华夏军团', generalName: '田单', portrait: '/assets/CENTRAL/jiaodong_tiandan.png', eliteName: '即墨义军', eliteTier: 2 },








    
        { generalId: 'dongxian_sunbin', factionId: 'qi', cityId: 'city_linzi', legionName: '古典时代华夏军团', generalName: '孙膑', portrait: '/assets/CENTRAL/dongxian_sunbin.png', eliteName: '齐技击', eliteTier: 2 },







    
        { generalId: 'mushi_muchong', factionId: 'murong', cityId: 'city_linzi', legionName: '古典时代华夏军团', generalName: '公孙五楼', portrait: '/assets/CENTRAL/mushi_muchong.png', eliteName: '中原郡兵', eliteTier: 4 },







    
        { generalId: 'tongma_taishici', factionId: 'sunwu_d', cityId: 'city_hongzhou', legionName: '古典时代吴越军团', generalName: '太史慈', portrait: '/assets/CENTRAL/tongma_taishici.png', eliteName: '江南郡兵', eliteTier: 4 },







        { generalId: 'bfe_chuzi', factionId: 'qi', cityId: 'city_linzi', generalName: '触子', portrait: '/assets/CENTRAL/bfe_chuzi.png', eliteName: '齐技击', eliteTier: 3 },
        { generalId: 'qi_luzhonglian', factionId: 'qi', cityId: 'city_liaocheng', generalName: '鲁仲连', portrait: '/assets/CENTRAL/qi_luzhonglian.png', eliteName: '聊城守军', eliteTier: 4 },   // 燕将据聊城不下，他作书射入城中劝降，聊城复归于齐（居聊城）
    ],






    baibo: [
        { generalId: 'baibo_guotai', cityId: 'city_baibogu', generalName: '郭太', portrait: '/assets/CENTRAL/baibo_guotai.png', legionName: '起义军', eliteName: '中原郡兵', eliteTier: 4 },
        { generalId: 'baibo_zhangjue', factionId: 'baibo', cityId: 'city_liyang', generalName: '张角', portrait: '/assets/WEI/baibo_zhangjue.png', eliteName: '黄巾力士', eliteTier: 3 },
    ],






    // 周泰（东吴宿卫；原 wuwu_d，吕蒙迁濡须口后改挂莱国据点）






    dixiang: { generalId: 'dixiang_wangmang', cityId: 'city_changan', generalName: '王莽', portrait: '/assets/CENTRAL/dixiang_wangmang.png', eliteName: '中原郡兵', eliteTier: 4 },







    zhou: [







        { generalId: 'zhou_jifu', cityId: 'city_qishan', generalName: '吉甫', portrait: '/assets/CENTRAL/zhou_jifu.png' , legionName: '先秦军团', eliteName: '中原郡兵', eliteTier: 4 },







        { generalId: 'zhou_jifa', cityId: 'city_qishan', generalName: '姬发', portrait: '/assets/CENTRAL/zhou_jifa.png' , legionName: '先秦军团', eliteName: '周师虎贲', eliteTier: 1 },







    ],






    yun: { generalId: 'yun_wuli', cityId: 'city_lushi', generalName: '吾离', portrait: '/assets/CENTRAL/yun_wuli.png' , legionName: '先秦军团', eliteName: '中原郡兵', eliteTier: 4 },






    han: [
        { generalId: 'han_baoyuan', cityId: 'city_xinzheng', generalName: '暴鸢', portrait: '/assets/CENTRAL/han_baoyuan.png', eliteName: '中原郡兵', eliteTier: 4 },
        { generalId: 'han_fengting', factionId: 'han', cityId: 'city_shangdang', generalName: '冯亭', portrait: '/assets/CENTRAL/han_fengting.png', eliteName: '上党守军', eliteTier: 4 },   // 韩上党郡守：前262 秦取野王、上党道绝，他以郡献赵，引发长平之战（镇守上党）
    ],






    bailian: { generalId: 'bailian_wangconger', cityId: 'city_junzhou', generalName: '王聪儿', portrait: '/assets/CENTRAL/bailian_wangconger.png', legionName: '起义军', eliteName: '荆楚兵', eliteTier: 4 },







    shen: [







        { generalId: 'shen_shenbo', cityId: 'city_nanyang', generalName: '申伯', portrait: '/assets/CENTRAL/shen_shenbo.png' , legionName: '先秦军团', eliteName: '中原郡兵', eliteTier: 4 },







        // 🔴 [2026-10-20 主人令「放到离他事发地最近的相同建筑风格文化的据点」「所有武将都这么处理，不要擅自添加据点」] 事发地＝宣王南征谢邑封国战 → 最近同风格据点安康














    ],






    // 商鞅：姬姓公孙氏，本名卫鞅/公孙鞅，封于商（商於）后历代通称商鞅






    // 🔴 [2026-10-20 抽查] 郭子仪：唐中央名将（原挂新平藩镇势力）→ 势力=唐国；据点新平（邠州，他镇邠多年）✓；精锐 朔方军 T1














    // ── 北方关隘 2026-06-19 ──







    you: [








        { generalId: 'you_gengyan', factionId: 'han_d', cityId: 'city_juyongguan', legionName: '古典时代太行军团', generalName: '耿弇', portrait: '/assets/WEI/you_gengyan.png', eliteName: '幽州突骑', eliteTier: 1 },
        { generalId: 'hejian_gongsunzan', factionId: 'you', cityId: 'city_beijing', generalName: '公孙瓒', portrait: '/assets/WEI/hejian_gongsunzan.png', eliteName: '河朔骑兵', eliteTier: 4 }, // 文安·河间郡公孙瓒白马义从,
        { generalId: 'bfe3_68', factionId: 'you', cityId: 'city_beijing', generalName: '严纲', portrait: '/assets/WEI/bfe3_68.png', legionName: '古典时代太行军团', eliteName: '河朔骑兵', eliteTier: 4 },








    
        { generalId: 'cangzhou_liurengong', factionId: 'you', cityId: 'city_beijing', legionName: '封建时代河朔军团', generalName: '刘仁恭', portrait: '/assets/WEI/cangzhou_liurengong.png', eliteName: '河朔骑兵', eliteTier: 4 },








    ],






    // ── 北方区 2026-06-18 ──






    gongsun_d: [
        { generalId: 'gongsun_d_gongsundu', cityId: 'city_liaoyang', generalName: '公孙度', portrait: '/assets/WEI/gongsun_d_gongsundu.png', eliteName: '河朔骑兵', eliteTier: 4 },
        { generalId: 'gen_yang_hao', factionId: 'ming_d', cityId: 'city_liaoyang', generalName: '杨镐', portrait: '/assets/WEI/gen_yang_hao.png', eliteName: '明军铁骑', eliteTier: 3 },
        { generalId: 'liao_d_xiaopaiya', factionId: 'liao_d', cityId: 'city_linhuang', generalName: '萧排押', portrait: '/assets/XIANBEI/liao_d_xiaopaiya.png', eliteName: '漠南骑手', eliteTier: 4 },
    ],






    tuoba: [
        { generalId: 'tuoba_weijingxin', factionId: 'tuoba', cityId: 'city_tancheng', generalName: '韦敬欣', portrait: '', eliteName: '东海戍兵', eliteTier: 4 },   // 🔴 [2026-11-01 补将] 北魏东海太守，以司吾城拒守（《南北朝战争史》：魏东海太守韦敬欣以司吾城…）；东海郡治郯城；文化随据点＝CENTRAL







        { generalId: 'tuoba_tuobagui', cityId: 'city_shengle', generalName: '拓跋珪', portrait: '/assets/WEI/tuoba_tuobagui.png', eliteName: '代北铁骑', eliteTier: 3 },














    
        { generalId: 'yunzhong_tuobaliwei', factionId: 'tuoba', cityId: 'city_shengle', legionName: '古典时代漠南游牧军团', generalName: '拓跋力微', portrait: '/assets/XIANBEI/yunzhong_tuobaliwei.png', eliteName: '漠南骑手', eliteTier: 4 },







    
        { generalId: 'donghu_tuiyin', factionId: 'tuoba', cityId: 'city_bayanwula', legionName: '古典时代漠南游牧军团', generalName: '推寅', portrait: '/assets/XIANBEI/donghu_tuiyin.png', eliteName: '漠南骑手', eliteTier: 4 },







        { generalId: 'gen_qiu_luan', factionId: 'ming_d', cityId: 'city_datong', generalName: '仇鸾', portrait: '/assets/WEI/gen_qiu_luan.png', eliteName: '河朔骑兵', eliteTier: 4 },
        { generalId: 'liao_d_handewei', factionId: 'liao_d', cityId: 'city_datong', legionName: '封建时代河朔军团', generalName: '韩德威', portrait: '/assets/XIANBEI/liao_d_handewei.png', eliteName: '河朔骑兵', eliteTier: 4 },
        { generalId: 'bfe_yangyu', factionId: 'tuoba', cityId: 'city_luoyang', generalName: '杨昱', portrait: '/assets/CENTRAL/bfe_yangyu.png', eliteName: '荥阳戍卒', eliteTier: 4 },
    ],






    gaoqi_d: [







        { generalId: 'gaoqi_d_gaohuan', cityId: 'city_taiyuan', generalName: '高欢', portrait: '/assets/WEI/gaoqi_d_gaohuan.png', eliteName: '六镇鲜卑', eliteTier: 2 },







        // 🔴 [2026-10-20 成名战规则] 萧轨＝北齐将、556 白下之战主帅（被陈霸先击败被俘）→ 蓨城·北齐；普将；立绘留空







        { generalId: 'gaoqi_d_xiaogui', cityId: 'city_anyang', legionName: '封建时代中原军团', generalName: '萧轨', portrait: '/assets/WEI/gaoqi_d_xiaogui.png', eliteName: '中原郡兵', eliteTier: 4 },







    
        { generalId: 'jiyuan_huluguang', factionId: 'gaoqi_d', cityId: 'city_taiyuan', legionName: '封建时代河朔军团', generalName: '斛律光', portrait: '/assets/WEI/jiyuan_huluguang.png', eliteName: '百保鲜卑', eliteTier: 2 },








    ],






    erzhu: [







        { generalId: 'erzhu_erzhurong', cityId: 'city_xiurongchuan', generalName: '尔朱荣', portrait: '/assets/WEI/erzhu_erzhurong.png', eliteName: '契胡骑兵', eliteTier: 2 },







        // 🔴 [2026-10-20 成名战规则] 尔朱兆＝尔朱氏首领（532 韩陵山之战败于高欢）→ 秀容川·尔朱；普将；立绘留空







        { generalId: 'erzhu_erzhuzhao', cityId: 'city_xiurongchuan', generalName: '尔朱兆', portrait: '/assets/WEI/erzhu_erzhuzhao.png', eliteName: '河朔骑兵', eliteTier: 4 },







    ],






    yan: [
        { generalId: 'yan_leyi', cityId: 'city_linzi', legionName: '古典时代华夏军团', generalName: '乐毅', portrait: '/assets/WEI/yan_leyi.png', eliteName: '燕军锐士', eliteTier: 3 },
        { generalId: 'bfe_qijie', factionId: 'yan', cityId: 'city_fanyang', generalName: '骑劫', portrait: '/assets/WEI/bfe_qijie.png', eliteName: '燕国锐士', eliteTier: 4 },
        { generalId: 'bfe_lifu', factionId: 'yan', cityId: 'city_fanyang', generalName: '栗腹', portrait: '/assets/WEI/bfe_lifu.png', eliteName: '燕甲士', eliteTier: 4 },
    ],







    zhao: [
        { generalId: 'bfe_dou_jiande', cityId: 'city_handan', generalName: '窦建德', portrait: '/assets/CENTRAL/bfe_dou_jiande.png', factionId: 'douxia', legionName: '封建时代中原军团', eliteName: '夏军', eliteTier: 3 },   // 🔴 [2026-10-25] 补精锐：夏军为河北州郡戍兵（T4 存在之兵）
        { generalId: 'handong_liuheita', factionId: 'handong', cityId: 'city_handan', generalName: '刘黑闼', portrait: '/assets/CENTRAL/handong_liuheita.png', eliteName: '汉东锐卒', eliteTier: 4 },   // 2026-10-25 按史补：汉东王，622 洺水败于李世民，623 被俘杀







        { generalId: 'zhao_lianpo', cityId: 'city_handan', generalName: '廉颇', portrait: '/assets/CENTRAL/zhao_lianpo.png', eliteName: '赵边骑', eliteTier: 2 },







        // 🔴 [2026-10-20 成名战规则] 葛荣＝六镇起义河北首领（528 滏口被尔朱荣所擒），称齐帝；据点邯郸（河北）；势力＝起义；起义军团（三级）；立绘留空














    
        { generalId: 'lingqiu_zhaowuling', factionId: 'zhao', cityId: 'city_handan', legionName: '古典时代华夏军团', generalName: '赵雍', portrait: '/assets/WEI/lingqiu_zhaowuling.png', eliteName: '中原郡兵', eliteTier: 4 },








    
        { generalId: 'wuzhou_limu', factionId: 'zhao', cityId: 'city_wuzhousai', legionName: '古典时代太行军团', generalName: '李牧', portrait: '/assets/WEI/wuzhou_limu.png', eliteName: '赵边骑', eliteTier: 2 },








    
        { generalId: 'liguo_zhaoshe', factionId: 'zhao', cityId: 'city_eyu', generalName: '赵奢', portrait: '/assets/CENTRAL/liguo_zhaoshe.png', eliteName: '赵边骑', eliteTier: 2 },








        { generalId: 'zhanger', factionId: 'zhao', cityId: 'city_liyang', generalName: '张耳', portrait: '/assets/WEI/zhanger.png', eliteName: '丛台绝剑', eliteTier: 2 },   // 🔴 [2026-10-25 新增] 前207 守巨鹿数月（项羽救赵解围）；赵相→常山王；普将；据点巨鹿 WEI 文化
    ],






    yang_aner: { generalId: 'yang_aner_yangan', cityId: 'city_dengzhou', generalName: '杨安', portrait: '/assets/WEI/yang_aner_yangan.png', legionName: '起义军', eliteName: '河朔骑兵', eliteTier: 4 },






    wuling: [







        { generalId: 'wuling_xiangdancheng', cityId: 'city_wulingshan', generalName: '相单程', portrait: '/assets/JIANGNAN/wuling_xiangdancheng.png', eliteName: '五溪蛮兵', eliteTier: 3 },
        { generalId: 'wuxi_shamoke', factionId: 'wuling', cityId: 'city_bamian', generalName: '沙摩柯', portrait: '/assets/JIANGNAN/wuxi_shamoke.png', eliteName: '荆楚兵', eliteTier: 4 },







    ],















// ── 江南区 2026-06-18 ──






    fangla: { generalId: 'fangla_fangla', cityId: 'city_qingxi', generalName: '方腊', portrait: '/assets/JIANGNAN/fangla_fangla.png', legionName: '起义军', eliteName: '江南郡兵', eliteTier: 4 },






    ouyue: { generalId: 'ouyue_zouyao', cityId: 'city_wenzhou', generalName: '驺摇', portrait: '/assets/JIANGNAN/ouyue_zouyao.png', eliteName: '江南郡兵', eliteTier: 4 },






    sunwu_d: [
        { generalId: 'chu_sunfu', factionId: 'sunwu_d', cityId: 'city_luling', generalName: '孙辅', portrait: '', eliteName: '江南郡兵', eliteTier: 4 },   // 🔴 [2026-11-01 补将] 据点=庐陵（空据点补将）；文化随据点＝JIANGNAN；史据见 docs
        { generalId: 'wu_taohuang', factionId: 'sunwu_d', cityId: 'city_cangwu', generalName: '陶璜', portrait: '', eliteName: '交州兵', eliteTier: 4 },   // 🔴 [2026-11-01 补将] 苍梧太守、后交州牧（《晋朝战争史》：苍梧太守丹阳陶璜等自荆州道逾岭以入交广）；文化随据点＝JIANGNAN



        { generalId: 'sunwu_d_sunquan', cityId: 'city_wuchang', generalName: '孙权', portrait: '/assets/JIANGNAN/sunwu_d_sunquan.png', eliteName: '荆楚兵', eliteTier: 4 },



        // 🔴 [2026-10-20 成名战规则] 陈友谅＝陈汉皇帝（1363 鄱阳湖战死，此前围洪都）→ 武昌（JIANGNAN）；天完起义余部，按起义铁律挂起义军；立绘留空



        { generalId: 'gen_chen_youliang', cityId: 'city_wuchang', generalName: '陈友谅', portrait: '/assets/JIANGNAN/gen_chen_youliang.png', factionId: 'xushouhui', eliteName: '荆楚水军', eliteTier: 3 },   // 🔴 [2026-10-28 按史明示] 陈友谅＝徐寿辉（天完）部将夺位、国号汉——前后相承、彼此不打，按 AGENTS「并成一家」（同例：北汉并进后汉）故挂「天完」势力（库内无独立陈汉，属并入设计非漏建）



    
        { generalId: 'zhongxiang_ganning', cityId: 'city_yiling', generalName: '甘宁', portrait: '/assets/JIANGNAN/zhongxiang_ganning.png', factionId: 'sunwu_d', legionName: '古典时代吴越军团', eliteName: '锦帆贼', eliteTier: 2 },   // 按史：甘宁以百骑夜劫曹营、皖城先登，具明确战术高光，依 v3 定 T2（《三国志·吴书·甘宁传》）。
        { generalId: 'yidou_luxun', factionId: 'sunwu_d', cityId: 'city_yiling', generalName: '陆逊', portrait: '/assets/JIANGNAN/yidou_luxun.png', eliteName: '江东水军', eliteTier: 2 },
        { generalId: 'yidou_qixin', factionId: 'chen', cityId: 'city_yiling', generalName: '戚昕', portrait: '/assets/JIANGNAN/yidou_qixin.png', legionName: '封建时代江淮军团' , eliteName: '南陈水师', eliteTier: 4 },   // 🔴 戚昕是南陈狼尾滩水军守将（原配「夷陵奇兵」是三国陆逊的）








    
        { generalId: 'jiujiang_zhouyu', factionId: 'sunwu_d', cityId: 'city_chaisang', generalName: '周瑜', portrait: '/assets/JIANGNAN/jiujiang_zhouyu.png', eliteName: '江东水军', eliteTier: 2 },








    
        { generalId: 'wuwu_d_lvmeng', factionId: 'sunwu_d', cityId: 'city_jingkou', generalName: '吕蒙', portrait: '/assets/JIANGNAN/wuwu_d_lvmeng.png', eliteName: '江东水军', eliteTier: 2 },







    
        { generalId: 'yue_d_lusu', factionId: 'sunwu_d', cityId: 'city_baling', generalName: '鲁肃', portrait: '/assets/JIANGNAN/yue_d_lusu.png', eliteName: '荆楚兵', eliteTier: 4 },







        { generalId: 'jinling_tandaoji', factionId: 'liusong', cityId: 'city_chaisang', generalName: '檀道济', portrait: '/assets/JIANGNAN/jinling_tandaoji.png', eliteName: '北府旧部', eliteTier: 3 },
    ],







    yue: [
        { generalId: 'yue_goujian', cityId: 'city_kuaiji', generalName: '勾践', portrait: '/assets/JIANGNAN/yue_goujian.png' , legionName: '先秦军团', eliteName: '越国死士', eliteTier: 2 },
        { generalId: 'bfe_gao_zhihui', factionId: 'sui', cityId: 'city_kuaiji', generalName: '高智慧', portrait: '/assets/JIANGNAN/bfe_gao_zhihui.png', legionName: '封建时代江淮军团', eliteName: '江南郡兵', eliteTier: 4 },   // 2026-10-25 按史：隋越州反隋（同势力内战），原误挂越国
    ],






    xushouhui: { generalId: 'xushouhui_zhaopusheng', cityId: 'city_qichun', generalName: '赵普胜', portrait: '/assets/JIANGNAN/xushouhui_zhaopusheng.png', eliteName: '荆楚兵', eliteTier: 4 },







    sui: [







        { generalId: 'sui_yangjian', cityId: 'city_suizhou', generalName: '杨坚', portrait: '/assets/JIANGNAN/sui_yangjian.png', eliteName: '荆楚兵', eliteTier: 4 },














    
        { generalId: 'pinghai_laihuer', factionId: 'sui', cityId: 'city_piaoyujin', legionName: '封建时代河朔军团', generalName: '来护儿', portrait: '/assets/WEI/pinghai_laihuer.png', eliteName: '隋军水师', eliteTier: 3 },








    
        { generalId: 'hongnong_jun_yangsu', factionId: 'sui', cityId: 'city_changan', legionName: '封建时代中原军团', generalName: '杨素', portrait: '/assets/CENTRAL/hongnong_jun_yangsu.png', eliteName: '隋府兵', eliteTier: 3 },








    
        { generalId: 'huo_songlaosheng', factionId: 'sui', cityId: 'city_lingshiguan', legionName: '封建时代中原军团', generalName: '宋老生', portrait: '/assets/CENTRAL/huo_songlaosheng.png', eliteName: '中原郡兵', eliteTier: 4 },








    ],






    zhangshicheng: { generalId: 'zhangshicheng_zhangshicheng', cityId: 'city_gusu', generalName: '张士诚', portrait: '/assets/JIANGNAN/zhangshicheng_zhangshicheng.png', eliteName: '东吴锐卒', eliteTier: 3 },







    wu: [







        { generalId: 'wu_sunwu', cityId: 'city_gusu', generalName: '孙武', portrait: '/assets/JIANGNAN/wu_sunwu.png' , legionName: '先秦军团', eliteName: '吴国锐士', eliteTier: 2 },







        // 🔴 [2026-10-20 成名战规则] 夫差＝前478 笠泽之战吴方君主（孙武前478已隐退，不能当敌将）；立绘留空走回落







        { generalId: 'wu_fuchai', factionId: 'wu', cityId: 'city_gusu', generalName: '夫差', portrait: '/assets/JIANGNAN/wu_fuchai.png' , legionName: '古典时代吴越军团', eliteName: '吴国水军', eliteTier: 3 },







        // 2026-10-20 主人令：名将双身份（据点武将＋剧本敌将）














        // 名将双身份：刘繇（据点武将＋剧本敌将）














    ],






    huangwang: { generalId: 'huangwang_huangchao', cityId: 'city_changan', generalName: '黄巢', portrait: '/assets/JIANGNAN/huangwang_huangchao.png', legionName: '起义军', eliteName: '冲天军', eliteTier: 3 },







    lujian: { generalId: 'lujian_zhanghuangyan', cityId: 'city_qingyuan_zj', generalName: '张煌言', portrait: '/assets/JIANGNAN/lujian_zhanghuangyan.png', eliteName: '江南郡兵', eliteTier: 4 },







    linshihong: { generalId: 'linshihong_linshihong', cityId: 'city_raozhou', generalName: '林士弘', portrait: '/assets/JIANGNAN/linshihong_linshihong.png', eliteName: '江南郡兵', eliteTier: 4 },






    // ting 已迁 wenzhou，王潮（闽国）归福建系







    shuntian: { generalId: 'shuntian_linshuangwen', cityId: 'city_changhua_tw', generalName: '林爽文', portrait: '/assets/JIANGNAN/shuntian_linshuangwen.png', legionName: '起义军', eliteName: '江南郡兵', eliteTier: 4 },






    she_ethnic: { generalId: 'she_ethnic_leiwanxing', cityId: 'city_chimushan', generalName: '雷万兴', portrait: '/assets/JIANGNAN/she_ethnic_leiwanxing.png', eliteName: '江南郡兵', eliteTier: 4 },






    kong_d: { generalId: 'kong_d_caogui', cityId: 'city_qufu', generalName: '曹刿', portrait: '/assets/CENTRAL/kong_d_caogui.png' , legionName: '先秦军团', eliteName: '中原郡兵', eliteTier: 4 },






    cen_d: [
        { generalId: 'cen_d_cenmeng', cityId: 'city_tianyang', generalName: '岑猛', portrait: '/assets/JIANGNAN/cen_d_cenmeng.png', eliteName: '荆楚兵', eliteTier: 4 },
        { generalId: 'cen_d_cenyunhan', factionId: 'cen_d', cityId: 'city_cen', generalName: '岑云汉', portrait: '/assets/JIANGNAN/cen_d_cenyunhan.png', eliteName: '泗城土兵', eliteTier: 4 },   // 泗城州岑氏土司（治所凌云），世守右江（镇守）
    ],






    panyao: { generalId: 'panyao_pandaxiao', cityId: 'city_hezhou', generalName: '盘大孝', portrait: '/assets/JIANGNAN/panyao_pandaxiao.png', eliteName: '荆楚兵', eliteTier: 4 },




















    golog: { generalId: 'golog_wandezhaxi', cityId: 'city_niubiziliang', generalName: '完德扎西', portrait: '/assets/TIBET/golog_wandezhaxi.png', eliteName: '吐蕃骑兵', eliteTier: 4 },






    buriat: { generalId: 'buriat_tumenjiergale', cityId: 'city_chita', generalName: '吉尔嘎勒', portrait: '/assets/MONGOL/buriat_tumenjiergale.png', eliteName: '蒙古骑手', eliteTier: 4 },







    oirat_ming: [







        { generalId: 'wala_yexian', cityId: 'city_kobdo', generalName: '也先', portrait: '/assets/MONGOL/wala_yexian.png', eliteName: '瓦剌骑兵', eliteTier: 3 },







        { generalId: 'oirat_ming_gaerdan', cityId: 'city_kobdo', generalName: '噶尔丹', portrait: '/assets/MONGOL/oirat_ming_gaerdan.png', legionName: '帝国时代喀尔喀军团', eliteName: '准噶尔骑', eliteTier: 2 },







        { generalId: 'gen_furdan', factionId: 'manzhou_d', cityId: 'city_kobdo', generalName: '傅尔丹', portrait: '/assets/NORTHEAST/gen_furdan.png', legionName: '帝国时代喀尔喀军团', eliteName: '八旗骁骑', eliteTier: 3 },
    ],






    yizhi: { generalId: 'yizhi_beigou', cityId: 'city_yuanzhishi', generalName: '难升米', portrait: '/assets/JAPAN/yizhi_beigou.png', eliteName: '日本足轻', eliteTier: 4 },






    shanshan: { generalId: 'shanshan_weituqi', cityId: 'city_loulan', generalName: '尉屠耆', portrait: '/assets/WESTERN/shanshan_weituqi.png', eliteName: '西域兵', eliteTier: 4 },






    ava: { generalId: 'ava_minye_kyawswa', cityId: 'city_ava', generalName: '明耶觉苏瓦', portrait: '/assets/BURMESE/ava_minye_kyawswa.png', eliteName: '阿瓦战象', eliteTier: 3 },






    mon: [
        { generalId: 'halapeng_yiba', factionId: 'mon', cityId: 'city_thaton', generalName: '伊巴', portrait: '/assets/MALAY/halapeng_yiba.png', eliteName: '缅甸象兵', eliteTier: 4 },   // 🔴 [2026-10-25 按史] 哈剌彭（南奔）末王，孟族；1296 为兰纳孟莱所灭



        { generalId: 'mon_monuhe', cityId: 'city_thaton', generalName: '摩奴诃', portrait: '/assets/BURMESE/mon_monuhe.png', eliteName: '缅甸象兵', eliteTier: 4 },



        // 🔴 [2026-10-20 成名战规则] 罗娑陀利＝勃固孟王（1385–1421，1415 阿瓦攻达拉）→ 直通（BURMESE）；城堡时代阿瓦军团；立绘留空



        { generalId: 'gen_razadarit', cityId: 'city_thaton', generalName: '罗娑陀利', portrait: '/assets/BURMESE/gen_razadarit.png', legionName: '城堡时代阿瓦军团', eliteName: '孟族战象', eliteTier: 3 },



    ],







    ganden: [








        { generalId: 'ganden_zongkaba', cityId: 'city_luoxie', generalName: '宗喀巴', portrait: '/assets/TIBET/ganden_zongkaba.png', eliteName: '吐蕃骑兵', eliteTier: 4 },
        { generalId: 'gaxa_zhashi', factionId: 'ganden', cityId: 'city_yadong', legionName: '帝国时代卫藏军团', generalName: '扎什端珠布', portrait: '/assets/TIBET/gaxa_zhashenduanzhubu.png', eliteName: '吐蕃骑兵', eliteTier: 4 },








    
        { generalId: 'monpa_meire', factionId: 'ganden', cityId: 'city_cuona', legionName: '帝国时代卫藏军团', generalName: '洛珠嘉措', portrait: '/assets/TIBET/monpa_luozhujiacuo.png', eliteName: '吐蕃骑兵', eliteTier: 4 },








    
        { generalId: 'lopi_abo', factionId: 'ganden', cityId: 'city_metuo', legionName: '帝国时代卫藏军团', generalName: '阿波', portrait: '/assets/TIBET/lopi_abo.png', eliteName: '吐蕃骑兵', eliteTier: 4 },








    
        { generalId: 'gandenpozhang_dibasangjiejiacuo', factionId: 'ganden', cityId: 'city_luoxie', legionName: '帝国时代卫藏军团', generalName: '桑结嘉措', portrait: '/assets/TIBET/gandenpozhang_dibasangjiejiacuo.png', eliteName: '吐蕃骑兵', eliteTier: 4 },








    
        { generalId: 'kangba_suonuomugunbu', factionId: 'ganden', cityId: 'city_litangzong', legionName: '帝国时代卫藏军团', generalName: '索诺木衮布', portrait: '/assets/TIBET/kangba_suonuomugunbu.png', eliteName: '吐蕃骑兵', eliteTier: 4 },








    
        { generalId: 'gongtang_gongtangcang', factionId: 'ganden', cityId: 'city_jimai', legionName: '帝国时代卫藏军团', generalName: '贡唐仓', portrait: '/assets/TIBET/gongtang_gongtangcang.png', eliteName: '吐蕃骑兵', eliteTier: 4 },








    ],






    dalung: { generalId: 'dalung_sangjiwen', cityId: 'city_riwoche', generalName: '桑吉温', portrait: '/assets/TIBET/dalung_sangjiwen.png', eliteName: '吐蕃骑兵', eliteTier: 4 },







    dong: { generalId: 'dong_nangqianjiabo', cityId: 'city_nangqian', generalName: '囊谦', portrait: '/assets/TIBET/dong_nangqianjiabo.png', eliteName: '吐蕃骑兵', eliteTier: 4 },







    hor: { generalId: 'hor_chisang', cityId: 'city_suozong', generalName: '赤桑', portrait: '/assets/TIBET/hor_chisang.png', eliteName: '吐蕃骑兵', eliteTier: 4 },







    pyu: { generalId: 'pyu_moluo', cityId: 'city_srikshetra', generalName: '摩罗惹', portrait: '/assets/BURMESE/pyu_moluo.png', eliteName: '缅甸象兵', eliteTier: 4 },







    nongzhigao: [








        { generalId: 'nongzhigao_huangshimi', cityId: 'city_yongzhou', generalName: '黄师宓', portrait: '/assets/JIANGNAN/nongzhigao_huangshimi.png', eliteName: '荆楚兵', eliteTier: 4 },
        { generalId: 'nong2_nongzhigao', factionId: 'nongzhigao', cityId: 'city_guangyuan', legionName: '城堡时代大越军团', generalName: '侬智高', portrait: '/assets/VIETNAMESE/nong2_nongzhigao.png', eliteName: '侬军战象', eliteTier: 3 },








    
        { generalId: 'monong_anong', factionId: 'nongzhigao', cityId: 'city_guangyuan', legionName: '城堡时代大越军团', generalName: '阿侬', portrait: '/assets/VIETNAMESE/monong_anong.png', eliteName: '越南民兵', eliteTier: 4 },








    ],







    weitou: { generalId: 'weitou_douti', cityId: 'city_shule', generalName: '兜题', portrait: '/assets/WESTERN/weitou_douti.png', eliteName: '西域兵', eliteTier: 4 },







    yumi: { generalId: 'yumi_anguo', cityId: 'city_yumi', generalName: '安国', portrait: '/assets/WESTERN/yumi_anguo.png', eliteName: '西域兵', eliteTier: 4 },







    qiemo: { generalId: 'qiemo_anmoshenpan', cityId: 'city_qiemo', generalName: '安末深盘', portrait: '/assets/WESTERN/qiemo_anmoshenpan.png', eliteName: '西域兵', eliteTier: 4 },







    pishan: { generalId: 'pishan_daihu', cityId: 'city_pishan', generalName: '代胡', portrait: '/assets/WESTERN/pishan_daihu.png', eliteName: '西域兵', eliteTier: 4 },







    ruoqiang: { generalId: 'ruoqiang_quhulai', cityId: 'city_ruoqiang', generalName: '去胡来', portrait: '/assets/WESTERN/ruoqiang_quhulai.png', eliteName: '西域兵', eliteTier: 4 },







    weili: { generalId: 'weili_weilifan', cityId: 'city_weili', generalName: '尉犁泛', portrait: '/assets/WESTERN/weili_weilifan.png', eliteName: '西域兵', eliteTier: 4 },







    wensu: { generalId: 'wensu_guyi', cityId: 'city_dawushenkate', generalName: '姑翼', portrait: '/assets/WESTERN/wensu_guyi.png', eliteName: '西域兵', eliteTier: 4 },







    duerbote: [








        { generalId: 'duerbote_duerbote_taiji', cityId: 'city_buergenjuntai', generalName: '博贝', portrait: '/assets/WESTERN/duerbote_duerbote_taiji.png', eliteName: '蒙古骑手', eliteTier: 4 },
        { generalId: 'wulianghai_chelingwubashen', factionId: 'duerbote', cityId: 'city_buergenjuntai', legionName: '帝国时代喀尔喀军团', generalName: '车凌乌巴什', portrait: '/assets/MONGOL/wulianghai_chelingwubashen.png', eliteName: '蒙古骑手', eliteTier: 4 },








    ],







    xiye: { generalId: 'xiye_zihe', cityId: 'city_xiye', generalName: '子合', portrait: '/assets/WESTERN/xiye_zihe.png', eliteName: '西域兵', eliteTier: 4 },






    xingliao: { generalId: 'xingliao_dayanlin', cityId: 'city_longwan', generalName: '大延琳', portrait: '/assets/KOREA/xingliao_dayanlin.png', eliteName: '朝鲜兵', eliteTier: 4 },







    xihai_d: [








        { generalId: 'xihai_d_fulianchou', cityId: 'city_fusicheng', generalName: '伏连筹', portrait: '/assets/KHITAN/xihai_d_fulianchou.png', eliteName: '漠南骑手', eliteTier: 4 },
        { generalId: 'xihai_d_fuyun', cityId: 'city_fusicheng', generalName: '伏允', eliteName: '吐谷浑精骑', eliteTier: 3, portrait: '/assets/KHITAN/xihai_d_fuyun.png' },   // 🔴 [2026-10-25 按史] 吐谷浑可汗，635 年突沦川牙帐被契苾何力袭破（《旧唐书·卷一〇九》）；作契苾何力成名战敌将（双身份）
        { generalId: 'tuyu_d_kualv', factionId: 'xihai_d', cityId: 'city_fusicheng', generalName: '夸吕', portrait: '/assets/KHITAN/tuyu_d_kualv.png', eliteName: '漠南骑手', eliteTier: 4 },








    
        { generalId: 'dafeichuan_nuohebo', factionId: 'xihai_d', cityId: 'city_fusicheng', generalName: '诺曷钵', portrait: '/assets/KHITAN/dafeichuan_nuohebo.png', eliteName: '漠南骑手', eliteTier: 4 },








    ],






    kawusi: { generalId: 'kawusi_haidaer', cityId: 'city_jizhake', generalName: '海达尔', portrait: '/assets/CENTRAL_ASIA/kawusi_haidaer.png', eliteName: '河中骑兵', eliteTier: 4 },







    xianhai: { generalId: 'xianhai_shamalike', cityId: 'city_yangjigan', generalName: '沙马利克', portrait: '/assets/CENTRAL_ASIA/xianhai_shamalike.png', eliteName: '河中骑兵', eliteTier: 4 },







    wuhu: { generalId: 'wuhu_dukake', cityId: 'city_zhenzhuhe', generalName: '都卡克', portrait: '/assets/CENTRAL_ASIA/wuhu_dukake.png', eliteName: '河中骑兵', eliteTier: 4 },






    badakhshan: { generalId: 'badakhshan_yaerbeige', cityId: 'city_fayzabad', generalName: '雅尔贝格', portrait: '/assets/CENTRAL_ASIA/badakhshan_yaerbeige.png', eliteName: '河中骑兵', eliteTier: 4 },






    bailong: { generalId: 'bailong_suomai', cityId: 'city_sanlongsha', generalName: '索劢', portrait: '/assets/WESTERN/bailong_suomai.png', eliteName: '西域兵', eliteTier: 4 },







    sai: { generalId: 'sai_gaijiayun', cityId: 'city_wosedecheng', generalName: '盖嘉运', portrait: '/assets/WESTERN/sai_gaijiayun.png', eliteName: '北庭精兵', eliteTier: 3 },







    weiwuer: { generalId: 'weiwuer_yusubu', cityId: 'city_yuergun', generalName: '玉素布', portrait: '/assets/WESTERN/weiwuer_yusubu.png', eliteName: '西域兵', eliteTier: 4 },






    // 🔴 [2026-10-20 主人令「不能让同势力的人乱打，不能白起打王龁」] 白起是秦将 → 出场挂秦（百岁模式出城即归秦）






    dulan_d: [
        { generalId: 'dulan_azimuhan', factionId: 'dulan_d', cityId: 'city_baishawa', generalName: '阿扎姆汗', portrait: '/assets/PURU/dulan_azimuhan.png', eliteName: '旁遮普兵', eliteTier: 4 },   // 🔴 [2026-10-25 按史] 成名战敌将；杜兰尼王子，1823 瑙谢拉败死；据点白沙瓦（PURU）为当时基地；用势力精锐普什图骑
        { generalId: 'dulan_muzaffarkhan', factionId: 'dulan_d', cityId: 'city_malisi', generalName: '穆扎法尔汗', portrait: '/assets/PURU/dulan_muzaffarkhan.png', eliteName: '旁遮普兵', eliteTier: 4 },   // 🔴 [2026-10-25 按史] 成名战敌将；木尔坦阿富汗总督，1818 城破战死；据点木尔坦（PURU）；用势力精锐普什图骑








        { generalId: 'dulan_d_aihamaide', cityId: 'city_kandaha', generalName: '艾哈迈德', portrait: '/assets/PERSIAN/dulan_d_aihamaide.png', eliteName: '杜兰尼骑兵', eliteTier: 3 },
        { generalId: 'kuida_chakar', legionName: '城堡时代法尔斯军团', factionId: 'dulan_d', cityId: 'city_kuida', generalName: '恰卡尔', portrait: '/assets/PERSIAN/kuida_chakar.png', eliteName: '波斯步兵', eliteTier: 4 },








    
        { generalId: 'maikelan_punong', legionName: '封建时代德莱木军团', factionId: 'dulan_d', cityId: 'city_teerbate', generalName: '普农', portrait: '/assets/PERSIAN/maikelan_punong.png', eliteName: '波斯步兵', eliteTier: 4 },








    ],






    xisi: [







        { generalId: 'xisi_safaer', cityId: 'city_bosite', generalName: '萨法尔', portrait: '/assets/PERSIAN/xisi_safaer.png', eliteName: '萨法尔骑', eliteTier: 3 },







        // 2026-10-20：萨法尔王朝创建者雅库布·伊本·莱斯（840–879）→ 锡斯坦（博斯特）；PERSIAN×封建＝德莱木军团







        { generalId: 'xisi_yakubusafaer', cityId: 'city_bosite', generalName: '雅库布', portrait: '/assets/PERSIAN/xisi_yakubusafaer.png', legionName: '封建时代德莱木军团' , eliteName: '萨法尔骑', eliteTier: 3},







        // 🔴 [2026-10-20 成名战规则] 阿姆尔＝萨法尔王朝第二任埃米尔（900 巴尔赫被萨曼伊斯玛仪生擒）→ 博斯特·锡斯坦；名将；立绘留空







        { generalId: 'xisi_amr', cityId: 'city_bosite', generalName: '阿姆尔', portrait: '/assets/PERSIAN/xisi_amr.png', eliteName: '萨法尔骑', eliteTier: 3 },







    







    
        { generalId: 'zhalange_barsaentes', legionName: '古典时代阿契美尼德军团', factionId: 'xisi', cityId: 'city_zhalange', generalName: '巴尔塞恩特斯', portrait: '/assets/PERSIAN/zhalange_baersaientesi.png', eliteName: '波斯步兵', eliteTier: 4 },







    ],






    huluo: [
        { generalId: 'huluo_jiyasiding', cityId: 'city_helate', generalName: '吉亚斯丁', portrait: '/assets/PERSIAN/huluo_jiyasiding.png', eliteName: '古尔骑兵', eliteTier: 3 },
        { generalId: 'bfe_muhammad_ghur', factionId: 'huluo', cityId: 'city_helate', generalName: '穆罕默德古尔', portrait: '/assets/PERSIAN/bfe_muhammad_ghur.png', eliteName: '古尔牙兵', eliteTier: 3 },
    ],





    // 🔴 [2026-10-20 抽查] 李晟：唐中央名将（原挂乾州藩镇势力）→ 势力=唐国；据点奉天（平叛驻地）✓；精锐 神策军 T2






    wuyue: [







        { generalId: 'wuyue_qianliu', cityId: 'city_hangzhou', generalName: '钱镠', portrait: '/assets/JIANGNAN/wuyue_qianliu.png', eliteName: '吴越水军', eliteTier: 3 },
        { generalId: 'bfe_ajibaldo', factionId: 'haikou', cityId: 'city_tsushima', generalName: '阿只拔都', portrait: '/assets/JIANGNAN/bfe_ajibaldo.png', legionName: '起义军', eliteName: '日本足轻', eliteTier: 4 },
        { generalId: 'qian_d_yudayou', factionId: 'ming_d', cityId: 'city_qingyuan_zj', legionName: '帝国时代两江军团', generalName: '俞大猷', portrait: '/assets/JIANGNAN/qian_d_yudayou.png', eliteName: '俞家军', eliteTier: 1 },
        { generalId: 'bfe_xu_hai', cityId: 'city_satsuma', generalName: '徐海', portrait: '/assets/JIANGNAN/bfe_xu_hai.png', factionId: 'haikou', legionName: '起义军', eliteName: '日本足轻', eliteTier: 4 },
        { generalId: 'haikou_maohaifeng', factionId: 'haikou', cityId: 'city_qingyuan_zj', generalName: '毛海峰', portrait: '/assets/JIANGNAN/haikou_maohaifeng.png', legionName: '起义军', eliteName: '岑港倭兵', eliteTier: 4 },   // 按史：王直养子王滶（毛海峰）1558 据舟山岑港抗官军（《明史纪事本末》卷五五、《倭变事略》）；T4 存在之兵（守港败亡，建制可考、无独立大捷/特色兵种）,   // 2026-10-25 按史补：王直养子王滶（本名毛海峰），1558 守舟山岑港，为俞大猷、戚继光所破（《倭变事略》）







    ],














    song: [
        // 🔴 [2026-10-25 按史修] 陈东（1500–1556）＝明嘉靖倭寇首领（徐海部），盘踞柘林（松江府华亭县，今上海奉贤）、攻乍浦与桐乡；
        //    原挂开封（中原）与史不符（开封是宋都，不是他的据点）。柘林属松江府 → 取同文化（江南）最近据点「上海」。
        //    精锐按「精锐可重复」逐将是具体番号（据点文化＝江南，对应）：陈东＝「陈东倭兵」，毛海峰＝「岑港倭兵」。
        { generalId: 'bfe_chen_dong', factionId: 'haikou', cityId: 'city_shanghai', generalName: '陈东', portrait: '/assets/CENTRAL/bfe_chen_dong.png', legionName: '起义军', eliteName: '陈东倭兵', eliteTier: 4 },   // 按史：嘉靖大倭寇头目陈东部（与徐海、叶麻同伙，1556 被徐海缚献胡宗宪处死，《明史·胡宗宪传》/《倭变事略》）；T4 存在之兵（确有其部，无可考战术大捷/兵种特色）,







        { generalId: 'song_zhaokuangyin', cityId: 'city_bianliang', generalName: '赵匡胤', portrait: '/assets/CENTRAL/song_zhaokuangyin.png', eliteName: '殿前禁军', eliteTier: 2 },







        // 🔴 [2026-10-20 成名战规则] 赵光义＝宋太宗（979 高梁河之战亲征，被耶律休哥大败）→ 开封·宋国；名将；立绘留空







        { generalId: 'song_zhaoguangyi', cityId: 'city_bianliang', generalName: '赵光义', portrait: '/assets/CENTRAL/song_zhaoguangyi.png', eliteName: '禁军铁骑', eliteTier: 3 },







        // 🔴 [2026-10-20 成名战规则] 任福＝北宋好水川之战主帅（1041 中伏战死）→ 萧关（好水川一带）·宋国；普将；立绘留空







        { generalId: 'song_renfu', factionId: 'song', cityId: 'city_xingqing', generalName: '任福', portrait: '/assets/CENTRAL/song_renfu.png', eliteName: '中原郡兵', eliteTier: 4 },














    
        { generalId: 'changshan_yangyanzhao', factionId: 'song', cityId: 'city_daomaguan', generalName: '杨延昭', portrait: '/assets/WEI/changshan_yangyanzhao.png', eliteName: '杨家将兵', eliteTier: 3 },

















    
        { generalId: 'wangyan_wangyan', factionId: 'song', cityId: 'city_jinzhou_shanxi', legionName: '城堡时代中华军团', generalName: '王彦', portrait: '/assets/WEI/wangyan_wangyan.png', eliteName: '中原郡兵', eliteTier: 4 },
















    
        { generalId: 'zhe_d_zheyuqing', factionId: 'song', cityId: 'city_fuzhou_fugu', generalName: '折御卿', portrait: '/assets/WEI/zhe_d_zheyuqing.png', eliteName: '府州折家', eliteTier: 3 },
















    
        { generalId: 'heng1_yangye', factionId: 'song', cityId: 'city_yanmenguan', generalName: '杨业', portrait: '/assets/WEI/heng1_yangye.png', eliteName: '杨家将兵', eliteTier: 3 },

















    
        { generalId: 'xiangzhou_lvwenhuan', factionId: 'song', cityId: 'city_xiangyang', legionName: '城堡时代中华军团', generalName: '吕文焕', portrait: '/assets/CENTRAL/xiangzhou_lvwenhuan.png', eliteName: '荆楚兵', eliteTier: 4 },
















    
        { generalId: 'liang_d_zhangxun', factionId: 'tang', cityId: 'city_shangqiu', generalName: '张巡', portrait: '/assets/CENTRAL/liang_d_zhangxun.png', eliteName: '睢阳守军', eliteTier: 2  },   // 按史：张巡守睢阳经年，屏蔽江淮；守兵＋所募义兵，史无专名（《旧唐书·卷一八七下·张巡传》）
        { generalId: 'liang_d_wangjingren', factionId: 'hou_liang', cityId: 'city_shangqiu', generalName: '王景仁', portrait: '/assets/CENTRAL/liang_d_wangjingren.png', eliteName: '中原郡兵', eliteTier: 4 },
















    
        { generalId: 'wang_d_liuyu', eliteName: '却月阵兵', eliteTier: 2, factionId: 'liusong', cityId: 'city_nanjing', legionName: '古典时代吴越军团', generalName: '刘裕', portrait: '/assets/CENTRAL/wang_d_liuyu.png' },
















    
        { generalId: 'yingzhou_d_liuqi', factionId: 'song', cityId: 'city_shunchang', legionName: '城堡时代中华军团', generalName: '刘锜', portrait: '/assets/CENTRAL/yingzhou_d_liuqi.png', eliteName: '八字军', eliteTier: 2 },
















    
        { generalId: 'didao_wangshao', factionId: 'song', cityId: 'city_lintao', legionName: '城堡时代中华军团', generalName: '王韶', portrait: '/assets/CENTRAL/didao_wangshao.png', eliteName: '熙河锐士', eliteTier: 3 },
















    
        { generalId: 'fengzhou_wujie', factionId: 'song', cityId: 'city_dasanguan', legionName: '城堡时代中华军团', generalName: '吴玠', portrait: '/assets/CENTRAL/fengzhou_wujie.png', eliteName: '西军锐士', eliteTier: 3 },
















    
        { generalId: 'sizhou_hanshizhong', factionId: 'song', cityId: 'city_huaiyin', legionName: '城堡时代中华军团', generalName: '韩世忠', portrait: '/assets/CENTRAL/sizhou_hanshizhong.png', eliteName: '韩家军', eliteTier: 1 },
















    
        { generalId: 'zaoyang_d_menggong', factionId: 'song', cityId: 'city_zaoyang', legionName: '城堡时代中华军团', generalName: '孟珙', portrait: '/assets/CENTRAL/zaoyang_d_menggong.png', eliteName: '荆楚锐卒', eliteTier: 3 },
















    
        { generalId: 'qing_quduan', factionId: 'song', cityId: 'city_xingqing', legionName: '城堡时代中华军团', generalName: '曲端', portrait: '/assets/CENTRAL/qing_quduan.png', eliteName: '中原郡兵', eliteTier: 4 },
















    
        { generalId: 'zhai_han_diqing', factionId: 'song', cityId: 'city_fushi', legionName: '城堡时代中华军团', generalName: '狄青', portrait: '/assets/CENTRAL/zhai_han_diqing.png', eliteName: '蕃落骑兵', eliteTier: 3 },
















    
        { generalId: 'huizhou_yaosi', factionId: 'song', cityId: 'city_zuli', legionName: '城堡时代中华军团', generalName: '姚兕', portrait: '/assets/CENTRAL/huizhou_yaosi.png', eliteName: '中原郡兵', eliteTier: 4 },
















    
        // 🔴 [2026-10-25 主人令「把岳飞的军团制定为三级军团，岳家军，记住不要动我的三级军团」]
        //    岳飞单挂三级军团「岳家军」（编制、阵型、父级、战船一概不动）；其余三级军团同样一律不动。
        { generalId: 'yanchuan_d_yuefei', factionId: 'song', cityId: 'city_wuchang', generalName: '岳飞', portrait: '/assets/CENTRAL/yanchuan_d_yuefei.png' , legionName: '岳家军', eliteName: '背嵬军', eliteTier: 0 },   // 🔴 [2026-10-28 按史] 岳飞久镇鄂州（武昌）＝岳家军根基（1134 定襄阳后帅府所在）；郾城＝1140 成名战战场非驻地。军团仍三级「岳家军」（三级军团不动）
















    
        { generalId: 'huan_zhongshidao', factionId: 'song', cityId: 'city_fangqu', legionName: '城堡时代中华军团', generalName: '种师道', portrait: '/assets/CENTRAL/huan_zhongshidao.png', eliteName: '中原郡兵', eliteTier: 4 },
















    
        { generalId: 'mengcheng_d_gaoqiong', factionId: 'song', cityId: 'city_bianliang', generalName: '高琼', portrait: '/assets/CENTRAL/mengcheng_d_gaoqiong.png', eliteName: '中原郡兵', eliteTier: 4 },
















    
        { generalId: 'hezhou_wangjian', factionId: 'song', cityId: 'city_diaoyucheng', legionName: '城堡时代川峡军团', generalName: '王坚', portrait: '/assets/BASHU/hezhou_wangjian.png', eliteName: '钓鱼城兵', eliteTier: 3 },
















    
        { generalId: 'tian_sizhou_tianyougong', factionId: 'song', cityId: 'city_zhenyuan', legionName: '城堡时代川峡军团', generalName: '田祐恭', portrait: '/assets/BASHU/tian_sizhou_tianyougong.png', eliteName: '巴蜀弩士', eliteTier: 4 },
















    
        { generalId: 'wanzhou_shangguankui', factionId: 'song', cityId: 'city_nanpu', legionName: '城堡时代川峡军团', generalName: '上官夔', portrait: '/assets/BASHU/wanzhou_shangguankui.png', eliteName: '巴蜀弩士', eliteTier: 4 },
















    
        { generalId: 'zhongxiang_zhongxiang', factionId: 'zhongxiang', cityId: 'city_wuling', generalName: '钟相', portrait: '/assets/JIANGNAN/zhongxiang_zhongxiang.png', legionName: '起义军', eliteName: '荆楚兵', eliteTier: 4 },
















    
        { generalId: 'shenshi_wentianxiang', factionId: 'song', cityId: 'city_hangzhou', legionName: '城堡时代江南军团', generalName: '文天祥', portrait: '/assets/JIANGNAN/shenshi_wentianxiang.png', eliteName: '江南郡兵', eliteTier: 4 },
















    
        { generalId: 'yiyang_d_mengzongzheng', factionId: 'song', cityId: 'city_zaoyang', legionName: '城堡时代中华军团', generalName: '孟宗政', portrait: '/assets/JIANGNAN/yiyang_d_mengzongzheng.png', eliteName: '荆楚锐卒', eliteTier: 3 },
















    
        { generalId: 'luoping_zhangshijie', factionId: 'song', cityId: 'city_xinhui', legionName: '城堡时代江南军团', generalName: '张世杰', portrait: '/assets/JIANGNAN/luoping_zhangshijie.png', eliteName: '荆楚兵', eliteTier: 4 },
















    
        { generalId: 'duanzhou_d_caojin', factionId: 'song', cityId: 'city_zhaoqing', generalName: '曹觐', portrait: '/assets/JIANGNAN/duanzhou_d_caojin.png', eliteName: '荆楚兵', eliteTier: 4 },
















    
        { generalId: 'quanzhou_liucongxiao', factionId: 'nantang', cityId: 'city_qingjingsi', legionName: '封建时代江淮军团', generalName: '留从效', portrait: '/assets/JIANGNAN/quanzhou_liucongxiao.png', eliteName: '荆楚兵', eliteTier: 4 },
















    
        { generalId: 'daozhou_yangzaixing', factionId: 'song', cityId: 'city_yancheng2', legionName: '城堡时代江南军团', generalName: '杨再兴', portrait: '/assets/JIANGNAN/daozhou_yangzaixing.png', eliteName: '荆楚兵', eliteTier: 4 },
















    
        { generalId: 'ouyang_ouyangwei', factionId: 'chen', cityId: 'city_panyu', legionName: '封建时代江淮军团', generalName: '欧阳頠', portrait: '/assets/JIANGNAN/ouyang_ouyangwei.png', eliteName: '荆楚兵', eliteTier: 4 },
















    
        { generalId: 'wan_liuyuan', factionId: 'song', cityId: 'city_wancheng', legionName: '城堡时代江南军团', generalName: '刘源', portrait: '/assets/JIANGNAN/wan_liuyuan.png', eliteName: '江南郡兵', eliteTier: 4 },
















    
        { generalId: 'xie_xiefangde', factionId: 'song', cityId: 'city_yiyang', legionName: '城堡时代江南军团', generalName: '谢枋得', portrait: '/assets/JIANGNAN/xie_xiefangde.png', eliteName: '江南郡兵', eliteTier: 4 },
















    
        { generalId: 'fu2_zhoudi', factionId: 'chen', cityId: 'city_linchuan', legionName: '封建时代江淮军团', generalName: '周迪', portrait: '/assets/JIANGNAN/fu2_zhoudi.png', eliteName: '江南郡兵', eliteTier: 4 },
















        { generalId: 'bfe3_17', cityId: 'city_fushi', generalName: '王离', portrait: '/assets/CENTRAL/bfe3_17.png', legionName: '古典时代华夏军团', factionId: 'qin', eliteName: '秦锐士', eliteTier: 2 },
        { generalId: 'bfe2_pang_juan', factionId: 'wei', cityId: 'city_bianliang', generalName: '庞涓', portrait: '/assets/WEI/bfe2_pang_juan.png', legionName: '古典时代华夏军团', eliteName: '魏武卒', eliteTier: 1 },
        { generalId: 'caoren', factionId: 'wei', cityId: 'city_nanyang', legionName: '古典时代华夏军团', generalName: '曹仁', portrait: '/assets/CENTRAL/caoren.png', eliteName: '樊城守军', eliteTier: 2  },   // 按史：曹仁为魏征南将军驻宛城、守樊城拒关羽，「仁人马数千守城」沉白马盟誓（《三国志·卷九·曹仁传》）
        { generalId: 'shang_weiwuji', factionId: 'wei', cityId: 'city_bianliang', generalName: '魏无忌', portrait: '/assets/CENTRAL/shang_weiwuji.png' , legionName: '古典时代华夏军团', eliteName: '魏武卒', eliteTier: 1 },
        // 🔴 [2026-10-24 险要补将·镇守] 张濡＝南宋独松关守将，德祐元年（1275）元军破关被执（《独松关之战》）；普将；精锐「独松戍卒」T4
        { generalId: 'dusong_zhangru', generalName: '张濡', factionId: 'song', cityId: 'city_dusong', portrait: '/assets/JIANGNAN/song_zhangru.png', eliteName: '独松戍卒', eliteTier: 4 },
        // 🔴 [2026-10-25 险要补将·镇守] 董先＝岳飞部将，绍兴年间屯守义阳三关（武胜关为三关之一）；普将；精锐「义阳戍卒」T4
        { generalId: 'wusheng_dongxian', generalName: '董先', factionId: 'song', cityId: 'city_wushengguan', portrait: '/assets/JIANGNAN/song_dongxian.png', eliteName: '义阳戍卒', eliteTier: 4 },
        { generalId: 'bfe_chengong', factionId: 'song', cityId: 'city_yongzhou', generalName: '陈珙', portrait: '/assets/JIANGNAN/bfe_chengong.png', eliteName: '邕州戍卒', eliteTier: 4 },
        { generalId: 'bfe_liuping', factionId: 'song', cityId: 'city_changan', generalName: '刘平', portrait: '/assets/CENTRAL/bfe_liuping.png', eliteName: '关中禁军', eliteTier: 4 },
        { generalId: 'song_bizaiyu', factionId: 'song', cityId: 'city_zhongli', generalName: '毕再遇', portrait: '/assets/CENTRAL/song_bizaiyu.png', eliteName: '盱眙守军', eliteTier: 3 },   // 南宋开禧北伐第一勇将，1206–1207 守盱眙、六合连破金军（镇守盱眙）
        { generalId: 'song_lixianzhong', factionId: 'song', cityId: 'city_xucheng', generalName: '李显忠', portrait: '/assets/CENTRAL/song_lixianzhong.png', eliteName: '淮西军', eliteTier: 3 },   // 南宋 1163 符离之战宋军主将（统兵于此）
    ],






    yuezhi: { generalId: 'yuezhi_xihou', cityId: 'city_shandan', generalName: '黄头', portrait: '/assets/KHITAN/yuezhi_xihou.png', eliteName: '漠南骑手', eliteTier: 4 },







    minyue: [
        { generalId: 'minyue_wuzhu', cityId: 'city_chongan', generalName: '无诸', portrait: '/assets/JIANGNAN/minyue_wuzhu.png', eliteName: '荆楚兵', eliteTier: 4 },
        { generalId: 'bfe3_22', cityId: 'city_chongan', generalName: '驺郢', portrait: '/assets/JIANGNAN/bfe3_22.png', legionName: '古典时代吴越军团', eliteName: '荆楚兵', eliteTier: 4 },
    ],







    funan: { generalId: 'funan_fanman', cityId: 'city_piyetuo', generalName: '范蔓', portrait: '/assets/KHMER/funan_fanman.png', eliteName: '高棉步兵', eliteTier: 4 },







    lancang: { generalId: 'lancang_faang', cityId: 'city_langbolabang', generalName: '法昂', portrait: '/assets/KHMER/lancang_faang.png', eliteName: '高棉步兵', eliteTier: 4 },







    ahaomu: { generalId: 'ahaomu_laqite', cityId: 'city_geergang', generalName: '拉其特', portrait: '/assets/BENGALIS/ahaomu_laqite.png', eliteName: '孟加拉战象', eliteTier: 2 },







    elunchunzu: { generalId: 'elunchunzu_gaishan', cityId: 'city_huma', generalName: '盖山', portrait: '/assets/NORTHEAST/elunchunzu_gaishan.png', eliteName: '女真骑手', eliteTier: 4 },






    tajikezu: { generalId: 'tajikezu_kuerban', cityId: 'city_huoluoge', generalName: '库尔班', portrait: '/assets/WESTERN/tajikezu_kuerban.png', eliteName: '西域兵', eliteTier: 4 },







    jingpozu: { generalId: 'jingpozu_zaodan', cityId: 'city_mizhina', generalName: '早丹', portrait: '/assets/BURMESE/jingpozu_zaodan.png', eliteName: '缅甸象兵', eliteTier: 4 },






    // 🔴 [2026-10-20 主人令「大夏/夏州本来就该合并，这是一家，一个政权，必须合并」]







    //    李继迁＝党项李氏夏州政权首领（李元昊祖父辈），与李元昊的大夏（西夏）是同一政权的前后两段







    //    → 挂大夏（dangxiang）旗；据点（靖边堡）归属不动，在场时城归大夏，退场后还原






    xingwei: { generalId: 'xingwei_hanba', cityId: 'city_mubang', generalName: '罕拔', portrait: '/assets/BURMESE/xingwei_hanba.png', eliteName: '缅甸象兵', eliteTier: 4 },







    saerbadaer: { generalId: 'saerbadaer_lazhake', cityId: 'city_baihage', generalName: '拉扎克', portrait: '/assets/PERSIAN/saerbadaer_lazhake.png', eliteName: '波斯步兵', eliteTier: 4 },






    yilihanguo_d: [







        { generalId: 'yilihanguo_d_hezan', cityId: 'city_dabulishi', generalName: '合赞', portrait: '/assets/PERSIAN/yilihanguo_d_hezan.png', legionName: '城堡时代伊儿军团', eliteName: '萨珊骑手', eliteTier: 4 },
        { generalId: 'yisatisi_falukezhade', legionName: '封建时代德莱木军团', factionId: 'yilihanguo_d', cityId: 'city_yazide', generalName: '法鲁克扎德', portrait: '/assets/PERSIAN/yisatisi_falukezhade.png', eliteName: '波斯步兵', eliteTier: 4 },
        { generalId: 'yisatisi_yisatisi', factionId: 'yilihanguo_d', cityId: 'city_yazide', generalName: '伊萨提斯', portrait: '/assets/PERSIAN/yisatisi_yisatisi.png', legionName: '古典时代阿契美尼德军团' , eliteName: '亚兹德骑', eliteTier: 4},







    
        { generalId: 'asaibaijiang_xuliewu', factionId: 'yilihanguo_d', cityId: 'city_malagai', generalName: '旭烈兀', portrait: '/assets/PERSIAN/asaibaijiang_xuliewu.png', legionName: '城堡时代伊儿军团', eliteName: '蒙古骑兵', eliteTier: 3 },







    ],






    wulaertu: [
        // 🔴 [2026-10-25 补B] 达维德（17 世纪休尼克起义领袖，有实名）｜势力 亚美尼亚｜据点 埃里温（ARMENIANS 文化）｜普将｜精锐「休尼克山兵」T4｜立绘留空
        { generalId: 'wulaertu_davit_bek', factionId: 'wulaertu', cityId: 'city_ailiwen', generalName: '达维德', portrait: '/assets/ARMENIANS/wulaertu_davit_bek.png', eliteName: '休尼克山兵', eliteTier: 4 },
        { generalId: 'wulaertu_ajishenti', cityId: 'city_ailiwen', generalName: '瓦尔丹', portrait: '/assets/ARMENIANS/wulaertu_ajishenti.png', eliteName: '亚美尼亚兵', eliteTier: 4 },
        { generalId: 'wulaertu_ashot3', cityId: 'city_ani', generalName: '阿硕特三世', portrait: '/assets/ARMENIANS/wulaertu_ashot3.png', legionName: '封建时代巴格拉图尼军团', eliteName: '纳哈拉尔骑', eliteTier: 3 },
    
        { generalId: 'gen_thoros', factionId: 'wulaertu', cityId: 'city_waka', generalName: '托罗斯二世', portrait: '/assets/ORIE/gen_thoros.png', eliteName: '亚美尼亚骑', eliteTier: 2 },







        { generalId: 'wulaertu_mleh', factionId: 'wulaertu', cityId: 'city_ani', generalName: '姆莱', portrait: '/assets/ARMENIANS/wulaertu_mleh.png', eliteName: '亚美尼亚骑', eliteTier: 3 },
        { generalId: 'wulaertu_stephan', factionId: 'wulaertu', cityId: 'city_ani', generalName: '斯蒂芬（亚美尼亚）', portrait: '/assets/ARMENIANS/wulaertu_stephan.png', eliteName: '亚美尼亚兵', eliteTier: 4 },
    ],







    wulaertu_guo: [
        { generalId: 'wulaertu_guo_saerdu', cityId: 'city_tushpa', generalName: '萨尔杜里', portrait: '/assets/ARMENIANS/wulaertu_guo_saerdu.png', eliteName: '亚美尼亚兵', eliteTier: 4 },
        { generalId: 'bfe_rusa_i', factionId: 'wulaertu_guo', cityId: 'city_tushpa', generalName: '鲁萨一世', portrait: '/assets/ARMENIANS/bfe_rusa_i.png', eliteName: '图什帕卫队', eliteTier: 4 },
    ],







    gelujiya: [
        
{ generalId: 'gelujiya_tamaer', cityId: 'city_dibilisi', generalName: '塔玛尔', portrait: '/assets/GEORGIANS/gelujiya_tamaer.png', eliteName: '格鲁吉亚兵', eliteTier: 4 },
        // 🔴 [2026-10-25 补B] 埃雷克莱二世（1720–1798，格鲁吉亚王、名将；抗波斯/奥斯曼）｜势力 格鲁吉亚｜据点 第比利斯（GEORGIANS 文化）｜名将｜精锐「格鲁吉亚近卫」T1｜立绘留空｜成名战待补
        { generalId: 'gelujiya_erekle_ii', factionId: 'gelujiya', cityId: 'city_dibilisi', generalName: '埃雷克莱二世', portrait: '/assets/GEORGIANS/gelujiya_erekle_ii.png', eliteName: '高加索卫队', eliteTier: 1 },
        { generalId: 'gelujiya_ivane', factionId: 'gelujiya', cityId: 'city_dibilisi', generalName: '伊万', portrait: '/assets/GEORGIANS/gelujiya_ivane.png', eliteName: '格鲁吉亚骑', eliteTier: 3 },
        { generalId: 'gelujiya_zakare', factionId: 'gelujiya', cityId: 'city_dibilisi', generalName: '扎卡雷', portrait: '/assets/GEORGIANS/gelujiya_zakare.png', eliteName: '格鲁吉亚兵', eliteTier: 4 },
    ],







    bendou: { generalId: 'bendou_alikesai', cityId: 'city_telabuzong', generalName: '阿历克塞', portrait: '/assets/BYZANTINE/bendou_alikesai.png', eliteName: '拜占庭兵', eliteTier: 4 },







    keerjisi: { generalId: 'keerjisi_bagelate', cityId: 'city_kutayixi', generalName: '巴格拉特', portrait: '/assets/GEORGIANS/keerjisi_bagelate.png', eliteName: '格鲁吉亚兵', eliteTier: 4 },







    saipulusi: { generalId: 'saipulusi_juyi', cityId: 'city_nikexiya', generalName: '居伊', portrait: '/assets/FRANKS/saipulusi_juyi.png', eliteName: '圣殿骑士', eliteTier: 2 },







    bendou_d: [








        { generalId: 'bendou_d_mitelidati', cityId: 'city_amaxiya', generalName: '密特里达梯', portrait: '/assets/ORIE/bendou_d_mitelidati.png', eliteName: '本都枪兵', eliteTier: 3 },
        { generalId: 'yamaxun_faernake', factionId: 'bendou_d', cityId: 'city_themiskyra', generalName: '法尔纳克', portrait: '/assets/ORIE/yamaxun_faernake.png', eliteName: '阿拉伯步兵', eliteTier: 4 },
        { generalId: 'yamaxun_xibolvte', factionId: 'bendou_d', cityId: 'city_themiskyra', generalName: '希波吕忒', portrait: '/assets/ORIE/yamaxun_xibolvte.png', eliteName: '阿拉伯步兵', eliteTier: 4 },








    ],







    heti: [







        { generalId: 'heti_alialate', cityId: 'city_tiyana', generalName: '阿里阿拉特', portrait: '/assets/ORIE/heti_alialate.png', eliteName: '阿拉伯步兵', eliteTier: 4 },







        { generalId: 'heti_muwatali', cityId: 'city_hatusha', generalName: '穆瓦塔利', portrait: '/assets/ORIE/heti_muwatali.png', eliteName: '赫梯战车', eliteTier: 2 },







    ],







    fulijiya: { generalId: 'fulijiya_maidasi', cityId: 'city_geerdiweng', generalName: '迈达斯', portrait: '/assets/ORIE/fulijiya_maidasi.png', eliteName: '阿拉伯步兵', eliteTier: 4 },







    ldiya: { generalId: 'ldiya_keluoyisi', cityId: 'city_sifaerde', generalName: '克罗伊斯', portrait: '/assets/GREECE/ldiya_keluoyisi.png', eliteName: '吕底亚骑兵', eliteTier: 3 },







    pajiama: { generalId: 'pajiama_oumainisi', cityId: 'city_peierjiameng', generalName: '欧迈尼斯', portrait: '/assets/GREECE/pajiama_oumainisi.png', eliteName: '帕加马骑兵', eliteTier: 3 },






    luomu: { generalId: 'luomu_jilijie', cityId: 'city_yikeniwumu', generalName: '基利杰', portrait: '/assets/ORIE/luomu_jilijie.png', legionName: '城堡时代鲁姆塞尔柱军团', eliteName: '罗姆骑兵', eliteTier: 3 },







    osman: [
        // 🔴 [2026-10-25 补B] 伊普西兰蒂斯（1792–1828，君士坦丁堡法纳尔希腊贵族、拜占庭政治遗产继承者；1821 率神圣军团打响反奥斯曼第一枪）｜势力 希腊王国｜据点 君士坦丁堡（BYZANTINE 文化，法纳尔区）｜普将｜精锐「神圣军团」T4｜立绘留空
        { generalId: 'bfe_ypsilantis', factionId: 'xilawangguo', cityId: 'city_junshitandingbao', generalName: '伊普西兰蒂斯', portrait: '/assets/BYZANTINE/bfe_ypsilantis.png', eliteName: '神圣军团', eliteTier: 4 },
        // 🔴 [2026-10-25 补B] 穆斯塔法二世（1664–1703，奥斯曼苏丹；1697 曾塔惨败）｜势力 奥斯曼｜据点 埃迪尔内（TURKS 文化）｜普将（实败）｜精锐「近卫军」T4｜立绘留空
        { generalId: 'bfe_mustafa_ii', factionId: 'osman', cityId: 'city_aidiernei', generalName: '穆斯塔法二世', portrait: '/assets/TURKS/bfe_mustafa_ii.png', eliteName: '近卫军', eliteTier: 4 },
        { generalId: 'bfe_sinan_pasha', factionId: 'osman', cityId: 'city_aidiernei', generalName: '锡南帕夏', portrait: '/assets/TURKS/bfe_sinan_pasha.png', eliteName: '土耳其兵', eliteTier: 4 },   // 🔴 [2026-10-25 按史] 成名战敌将；奥斯曼大维齐尔，1605 苏菲安败后身死；据点埃迪尔内（TURKS）；用势力精锐苏丹亲兵
        { generalId: 'osman_kapadan', factionId: 'osman', cityId: 'city_buersa', generalName: '卡尼姆穆罕默德', portrait: '/assets/TURKS/osman_kapadan.png', eliteName: '土耳其骑兵', eliteTier: 3 },   // 🔴 [2026-10-25 按史] 成名战敌将；奥斯曼舰队统帅 Canım Hoca Mehmed Pasha，1716 围科孚败退；1715 再取摩里亚有功，四闸可过判名将；据点布尔萨（TURKS）；用势力精锐苏丹亲兵
        // 🔴 [2026-10-20 成名战规则] 卡拉穆斯塔法帕夏＝奥斯曼大维齐尔（1683 维也纳战败被处死）→ 布尔萨（TURKS）；帝国时代土耳其军团；立绘留空
        { generalId: 'gen_kara_mustafa', cityId: 'city_buersa', generalName: '卡拉穆斯塔法', portrait: '/assets/TURKS/gen_kara_mustafa.png', legionName: '帝国时代斯帕希军团', eliteName: '土耳其禁军', eliteTier: 2 },
        // 🔴 [2026-10-20 成名战规则] 拉拉·穆斯塔法帕夏＝奥斯曼统帅（1565 马耳他大围攻）→ 布尔萨（TURKS）；帝国时代土耳其军团；立绘留空
        { generalId: 'gen_mustafa_pasha', cityId: 'city_buersa', generalName: '穆斯塔法帕夏', portrait: '/assets/TURKS/gen_mustafa_pasha.png', legionName: '帝国时代斯帕希军团', eliteName: '土耳其禁军', eliteTier: 2 },
        // 🔴 [2026-10-20 成名战规则] 苏莱曼大帝＝奥斯曼苏丹（1566 锡盖特堡军营中病逝）→ 布尔萨（TURKS）；帝国时代土耳其军团；立绘留空
        { generalId: 'gen_suleiman', cityId: 'city_buersa', generalName: '苏莱曼', portrait: '/assets/TURKS/gen_suleiman.png', legionName: '帝国时代苏丹亲兵军团', eliteName: '近卫新军', eliteTier: 2 },



        { generalId: 'osman_mehmed_ii', cityId: 'city_aidiernei', generalName: '穆罕默德二世', portrait: '/assets/TURKS/osman_mehmed_ii.png' , eliteName: '苏丹亲兵', eliteTier: 1 },



        // 🔴 [2026-10-20 成名战规则] 巴耶济德一世＝奥斯曼苏丹（1402 安卡拉被帖木儿击败俘死）→ 布尔萨（TURKS）；城堡时代加齐突骑军团；立绘留空



        { generalId: 'gen_bayezid_i', cityId: 'city_buersa', generalName: '巴耶济德一世', portrait: '/assets/TURKS/gen_bayezid_i.png', legionName: '城堡时代鲁姆塞尔柱军团', eliteName: '近卫新军', eliteTier: 2 },



    
        { generalId: 'gen_mehmed_giray', factionId: 'osman', cityId: 'city_akeman', legionName: '帝国时代斯帕希军团', generalName: '迈赫迈德', portrait: '/assets/SLAVIC/deniesite_muhanmodegeli.png', eliteName: '鞑靼骑兵', eliteTier: 3 },








    
        { generalId: 'gen_osman_i', factionId: 'osman', cityId: 'city_seyute', generalName: '奥斯曼一世', portrait: '/assets/TURKS/gen_osman_i.png', legionName: '城堡时代鲁姆塞尔柱军团', eliteName: '土耳其兵', eliteTier: 4 },








    
        { generalId: 'lumiliya_lalashahin', factionId: 'osman', cityId: 'city_aidiernei', generalName: '拉拉沙欣', portrait: '/assets/TURKS/lumiliya_lalashahin.png', eliteName: '土耳其骑兵', eliteTier: 3 },








    
        { generalId: 'gen_barbarossa', factionId: 'osman', cityId: 'city_aerjier', legionName: '帝国时代巴巴里军团', generalName: '巴巴罗萨', portrait: '/assets/BERBER/babali_babaluosa.png', eliteName: '柏柏尔轻骑', eliteTier: 3 },








    
        { generalId: 'gen_dragut', factionId: 'osman', cityId: 'city_deliboli', legionName: '帝国时代巴巴里军团', generalName: '德拉古特', portrait: '/assets/BERBER/telibolisi_delagute.png', eliteName: '柏柏尔轻骑', eliteTier: 3 },








        { generalId: 'bfe_suleiman_pasha', factionId: 'osman', cityId: 'city_aidiernei', generalName: '苏莱曼帕夏', portrait: '/assets/TURKS/bfe_suleiman_pasha.png', eliteName: '鲁米利亚军', eliteTier: 4 },
        { generalId: 'osman_selim', factionId: 'osman', cityId: 'city_buersa', generalName: '冷酷者塞利姆', portrait: '/assets/TURKS/osman_selim.png', eliteName: '苏丹亲兵', eliteTier: 1 },
        { generalId: 'bfe_kehaya_mustafa', factionId: 'osman', cityId: 'city_aidiernei', generalName: '穆斯塔法', portrait: '/assets/SPARTANS/bfe_kehaya_mustafa.png', eliteName: '奥斯曼精兵', eliteTier: 4 }   // [2026-10-31 键名订正：osman_morae → osman]
    ],







    sailiugu: [
        { generalId: 'bfe3_23', cityId: 'city_antiejiya', generalName: '塞隆', portrait: '/assets/ORIE/bfe3_23.png', legionName: '古典时代近东军团', eliteName: '阿拉伯步兵', eliteTier: 4 },
        // 🔴 [2026-10-20 主人令] 塞琉古一世＝塞琉古帝国开国君主（前301 伊普苏斯破安提柯）→ 安提俄基亚（ORIE）；古典时代近东军团；立绘留空
        { generalId: 'gen_seleucus_i', cityId: 'city_antiejiya', generalName: '塞琉古', portrait: '/assets/ORIE/gen_seleucus_i.png', legionName: '古典时代近东军团' , eliteName: '银盾兵', eliteTier: 1},







        { generalId: 'sailiugu_antiaoke', cityId: 'city_antiejiya', generalName: '安条克', portrait: '/assets/ORIE/sailiugu_antiaoke.png', eliteName: '塞琉铁骑', eliteTier: 3 },







        // 名将双身份：安条克一世（据点武将＋剧本敌将）







        { generalId: 'bfe3_6', cityId: 'city_antiejiya', generalName: '安条克一世', portrait: '/assets/ORIE/bfe3_6.png', legionName: '古典时代近东军团' , eliteName: '叙利亚战象', eliteTier: 3},







        // 🔴 [2026-10-20 成名战规则] 雅吉西扬＝安条克城守将（1098 十字军围城时被杀）→ 安提俄基亚·塞尔柱；普将；封建×ORIE＝封建时代哈里发军团；立绘留空







        { generalId: 'sailiugu_yaghi', cityId: 'city_antiejiya', legionName: '城堡时代撒拉森军团', generalName: '雅吉西扬', portrait: '/assets/ORIE/sailiugu_yaghi.png', eliteName: '阿拉伯步兵', eliteTier: 4 },







        { generalId: 'bfe_andragoras', factionId: 'sailiugu', cityId: 'city_nisa', generalName: '安德拉戈拉斯', portrait: '/assets/PERSIAN/bfe_andragoras.png', eliteName: '尼萨铁骑', eliteTier: 3 },
    ],







    womaya: [
        { generalId: 'bfe2_rezin', cityId: 'city_damasikusi', generalName: '利汛', portrait: '/assets/ORIE/bfe2_rezin.png', factionId: 'yalan', legionName: '古典时代近东军团', eliteName: '亚兰战车', eliteTier: 4 },   // 按史：亚兰-大马士革王国以战车兵著称（前 853 卡卡之战、前 732 亚兰亡于亚述）；普将 T4,







        { generalId: 'womaya_muaweiye', cityId: 'city_damasikusi', generalName: '穆阿维叶', portrait: '/assets/ORIE/womaya_muaweiye.png', eliteName: '叙利亚骑兵', eliteTier: 3 },







        // 🔴 [2026-10-20 主人令「把剩下4位缺的敌将新建为据点武将」] 成名战敌将·名将双身份（立绘留空，走回落）







        { generalId: 'gen_toghtekin', cityId: 'city_damasikusi', generalName: '图格特金', portrait: '/assets/ORIE/gen_toghtekin.png', legionName: '城堡时代撒拉森军团' , eliteName: '大马士革军', eliteTier: 3}, // 大马士革阿塔贝格本部，非萨迈拉古拉姆





















    
        { generalId: 'gen_abd_al_rahman_iii', factionId: 'womaya', cityId: 'city_cordoba', generalName: '拉赫曼三世', portrait: '/assets/SPANISH/gen_abd_al_rahman_iii.png', eliteName: '安达卢斯骑', eliteTier: 3 },
        { generalId: 'womaya_abdrahman', cityId: 'city_cordoba', factionId: 'womaya', generalName: '拉赫曼', portrait: '/assets/SPANISH/womaya_abdrahman.png', eliteName: '安达卢斯骑', eliteTier: 3 },








    
        { generalId: 'alabo_qiyade', factionId: 'womaya', cityId: 'city_bashila', generalName: '齐亚德', portrait: '/assets/ORIE/alabo_qiyade.png', eliteName: '阿拉伯步兵', eliteTier: 4 },








        { generalId: 'womaya_musa', factionId: 'womaya', cityId: 'city_damasikusi', generalName: '穆萨伊本奴萨尔', portrait: '/assets/ORIE/womaya_musa.png', eliteName: '阿拉伯骑', eliteTier: 3 },
    ],







    xibolai: [







        { generalId: 'xibolai_majiabi', cityId: 'city_yelusaleng', generalName: '犹大马加比', portrait: '/assets/ORIE/xibolai_youdamajiabi.png', eliteName: '犹太勇士', eliteTier: 3 },







        { generalId: 'xibolai_dawei', cityId: 'city_yelusaleng', generalName: '大卫', portrait: '/assets/ORIE/xibolai_dawei.png', eliteName: '犹太勇士', eliteTier: 3 },







        // 2026-10-20 主人令「有名字的武将也可以安置据点」：名将双身份（据点武将＋剧本敌将）







        { generalId: 'bfe3_1', cityId: 'city_yelusaleng', generalName: '西底家', portrait: '/assets/ORIE/bfe3_1.png', legionName: '古典时代近东军团' , eliteName: '犹大守军', eliteTier: 4},







        // 🔴 [2026-10-20 主人令「人物该是谁就是谁」] 哈斯蒙尼王朝的阿里斯托布鲁斯二世（前65年阿雷塔斯围耶路撒冷的守方）







        { generalId: 'gen_aristobulus_ii', cityId: 'city_yelusaleng', generalName: '阿里斯托布鲁斯二世', portrait: '/assets/ORIE/gen_aristobulus_ii.png', legionName: '古典时代近东军团' , eliteName: '哈斯蒙卫军', eliteTier: 4},







    ],







    yelusalengwg: [







        { generalId: 'gen_baodewen_iv', cityId: 'city_ake', generalName: '鲍德温四世', portrait: '/assets/FRANKS/gen_baodewen_iv.png', eliteName: '圣殿骑士', eliteTier: 2 },







        // 2026-10-20：鲍德温一世（1058–1118，埃德萨伯爵、耶路撒冷国王）→ 耶路撒冷王国（阿卡）；FRANKS×城堡＝法兰西骑士军团







        { generalId: 'aosiruowen_baodewen', cityId: 'city_ake', generalName: '鲍德温一世', portrait: '/assets/FRANKS/aosiruowen_baodewen.png', legionName: '城堡时代法兰西骑士军团', eliteName: '圣殿骑士', eliteTier: 2 },







        // 🔴 [2026-10-20 成名战规则] 阿马尔里克＝耶路撒冷王（1167 巴班之战十字军主帅）→ 阿卡·耶路撒冷王国；普将；封建×法兰克＝封建时代法兰克军团；立绘留空







        { generalId: 'yelusalengwg_amalric', cityId: 'city_ake', generalName: '阿马尔里克', portrait: '/assets/FRANKS/yelusalengwg_amalric.png', eliteName: '法兰克民兵', eliteTier: 4 },







    ],







    shengdian_qishi: { generalId: 'shengdian_qishi_demolai', cityId: 'city_kolossi', generalName: '莫莱', portrait: '/assets/FRANKS/shengdian_qishi_demolai.png', eliteName: '法兰克民兵', eliteTier: 4 },







    maerta_qishi: [








        { generalId: 'maerta_qishi_walaite', cityId: 'city_malta', generalName: '瓦莱特', portrait: '/assets/LATIN/maerta_qishi_walaite.png', eliteName: '医院骑士', eliteTier: 2 },
        { generalId: 'gen_villaret', legionName: '城堡时代法兰西骑士军团', factionId: 'maerta_qishi', cityId: 'city_rhodes', generalName: '维拉雷', portrait: '/assets/FRANKS/gen_villaret.png', eliteName: '法兰克民兵', eliteTier: 4 },








    ],






    aiji: [
        { generalId: 'gen_harkhuf', factionId: 'aiji', cityId: 'city_aswan', generalName: '哈尔库夫', portrait: '/assets/ORIE/gen_harkhuf.png', legionName: '古典时代近东军团', eliteName: '麦杰兵', eliteTier: 2 },







        { generalId: 'aiji_neiketaneibu', cityId: 'city_peiluximu', generalName: '内克塔内布', portrait: '/assets/ORIE/aiji_neiketaneibu.png', eliteName: '埃及战车兵', eliteTier: 2 },







        { generalId: 'aiji_lameisisi', cityId: 'city_mengfeisi', generalName: '拉美西斯', portrait: '/assets/ORIE/aiji_lameisisi.png', eliteName: '埃及战车兵', eliteTier: 2 },







        // 🔴 [2026-10-20 成名战剧情] 普萨美提克三世＝前525 佩鲁西姆之战埃及末代法老（被冈比西斯击败）→ 孟菲斯·埃及；普将；立绘留空







        { generalId: 'aiji_psamtik_iii', cityId: 'city_mengfeisi', generalName: '普萨美提克三世', portrait: '/assets/ORIE/aiji_psamtik_iii.png', legionName: '古典时代近东军团' , eliteName: '希腊雇佣兵', eliteTier: 4 },   // 🔴 26 王朝法老军含希腊雇佣兵（原配「麦查伊军」是新王国前的努比亚兵）







    
        { generalId: 'ameng_jisi', factionId: 'aiji', cityId: 'city_xiwa', generalName: '阿曼阿托', portrait: '/assets/ORIE/ameng_jisi.png', eliteName: '阿拉伯步兵', eliteTier: 4 },








    
        { generalId: 'baihaliye_djedkhonsu', factionId: 'aiji', cityId: 'city_baihaliye', generalName: '杰德孔苏', portrait: '/assets/ORIE/baihaliye_djedkhonsu.png', eliteName: '阿拉伯步兵', eliteTier: 4 },








    
        { generalId: 'dibisi_tahaerka', cityId: 'city_mengfeisi', generalName: '塔哈尔卡', portrait: '/assets/ORIE/dibisi_tahaerka.png', factionId: 'aiji', eliteName: '埃及战车兵', eliteTier: 2 },
        { generalId: 'dibisi_tutemosi', cityId: 'city_wasaite', generalName: '图特摩斯三世', portrait: '/assets/ORIE/dibisi_tutemosi.png', factionId: 'aiji', eliteName: '阿拉伯步兵', eliteTier: 4 },







    
        { generalId: 'gen_perdiccas', cityId: 'city_salonica', generalName: '佩尔狄卡斯', portrait: '/assets/ORIE/gen_perdiccas.png', factionId: 'maqidun' , eliteName: '步战伙友', eliteTier: 3 },







    ],







    tuolemi: [
        { generalId: 'tuolemi_tuolemi', cityId: 'city_yalishanda', generalName: '托勒密一世', portrait: '/assets/ORIE/tuolemi_tuolemi.png', eliteName: '托勒密骑兵', eliteTier: 3 },
        { generalId: 'bfe3_19', cityId: 'city_yalishanda', generalName: '斯科帕斯', portrait: '/assets/ORIE/bfe3_19.png', legionName: '古典时代近东军团', eliteName: '阿拉伯步兵', eliteTier: 4 },
    
        { generalId: 'beileinisi_tuolemiershi', factionId: 'tuolemi', cityId: 'city_beileinisi', generalName: '托勒密二世', portrait: '/assets/ORIE/beileinisi_tuolemiershi.png', eliteName: '阿拉伯步兵', eliteTier: 4 },








    
        { generalId: 'maermajika_paraetos', factionId: 'tuolemi', cityId: 'city_matelugang', generalName: '帕拉伊托斯', portrait: '/assets/ORIE/maermajika_paraetos.png', eliteName: '阿拉伯步兵', eliteTier: 4 },








    ],







    jialedi: [
        { generalId: 'bfe2_yahdun_lim', cityId: 'city_anate', generalName: '亚赫敦林', portrait: '/assets/ORIE/bfe2_yahdun_lim.png', factionId: 'mari_ancient', legionName: '古典时代近东军团', eliteName: '马里戍卒', eliteTier: 4 },   // 🔴 [2026-10-25] 补精锐：马里城邦戍兵（T4 存在之兵）
        { generalId: 'bfe2_nidintu_bel', cityId: 'city_babilun', generalName: '尼丁图-贝尔', portrait: '/assets/ORIE/bfe2_nidintu_bel.png', legionName: '古典时代近东军团', eliteName: '阿拉伯步兵', eliteTier: 4 },
        { generalId: 'bfe2_enlil_nadin_ahi', cityId: 'city_babilun', generalName: '恩利尔纳丁', portrait: '/assets/ORIE/bfe2_enlil_nadin_ahi.png', legionName: '古典时代近东军团', eliteName: '阿拉伯步兵', eliteTier: 4 },
        { generalId: 'jialedi_nibujianisa', cityId: 'city_wuluke', generalName: '尼布甲尼撒', portrait: '/assets/ORIE/jialedi_nibujianisa.png', eliteName: '迦勒底战车', eliteTier: 3 },
        { generalId: 'bfe2_nabonidus', cityId: 'city_babilun', generalName: '那波尼德', portrait: '/assets/ORIE/bfe2_nabonidus.png', legionName: '古典时代近东军团', eliteName: '阿拉伯步兵', eliteTier: 4 },
    ],







    paermila: { generalId: 'paermila_zhinuobiya', cityId: 'city_tademoer', generalName: '芝诺比娅', portrait: '/assets/ORIE/paermila_zhinuobiya.png', eliteName: '帕尔米拉兵', eliteTier: 3 },







    abasi: [







        { generalId: 'abasi_mansuer', cityId: 'city_bageda', generalName: '曼苏尔', portrait: '/assets/ORIE/abasi_mansuer.png', eliteName: '阿拔斯禁军', eliteTier: 2 },







        // 🔴 [2026-10-20 成名战规则] 穆斯塔西姆＝阿拔斯末代哈里发（1258 巴格达被旭烈兀攻陷）→ 巴格达·阿拔斯；普将；立绘留空







        { generalId: 'abasi_mustasim', cityId: 'city_bageda', legionName: '城堡时代撒拉森军团', generalName: '穆斯塔西姆', portrait: '/assets/ORIE/abasi_mustasim.png', eliteName: '阿拉伯步兵', eliteTier: 4 },







        // 🔴 [2026-10-20 成名战规则] 穆瓦法克＝阿拔斯摄政、876 代尔阿库勒之战击败萨法尔军主帅 → 巴格达·阿拔斯；名将；立绘留空







        { generalId: 'abasi_muwafake', cityId: 'city_bageda', generalName: '穆瓦法克', portrait: '/assets/ORIE/abasi_muwafake.png', eliteName: '阿拔斯禁军', eliteTier: 2 },







    
        { generalId: 'samaila_muataisuimu', factionId: 'abasi', cityId: 'city_samaila', generalName: '穆阿台绥姆', portrait: '/assets/ORIE/samaila_muataisuimu.png', eliteName: '阿拔斯禁军', eliteTier: 2 },








    
        { generalId: 'youfaladi_yehaiya', factionId: 'abasi', cityId: 'city_anate', generalName: '巴尔马克', portrait: '/assets/ORIE/youfaladi_yehaiya.png', eliteName: '阿拉伯步兵', eliteTier: 4 },








        { generalId: 'bfe_abdullah_ali', factionId: 'abasi', cityId: 'city_damasikusi', generalName: '阿卜杜拉', portrait: '/assets/ORIE/bfe_abdullah_ali.png', eliteName: '尼西比斯军', eliteTier: 3 }, // 754 尼西比斯叛乱所部
        { generalId: 'abasi_imam', factionId: 'abasi', cityId: 'city_bageda', generalName: '伊玛目', portrait: '/assets/ORIE/abasi_imam.png', eliteName: '巴格达卫兵', eliteTier: 4 },
    ],






    xikesuosi: [







        { generalId: 'xikesuosi_samutike', factionId: 'aiji', cityId: 'city_mengfeisi', generalName: '萨姆提克', portrait: '/assets/ORIE/xikesuosi_samutike.png', eliteName: '阿拉伯步兵', eliteTier: 4 },







        { generalId: 'xikesuosi_salidi', cityId: 'city_awalisi', generalName: '萨利蒂', portrait: '/assets/ORIE/xikesuosi_salidi.png', eliteName: '阿拉伯步兵', eliteTier: 4 },







    ],







    yashu: [
        { generalId: 'bfe2_sin_shar_ishkun', cityId: 'city_niniwei', generalName: '伊什昆', portrait: '/assets/ORIE/bfe2_sin_shar_ishkun.png', legionName: '古典时代近东军团', eliteName: '阿拉伯步兵', eliteTier: 4 },
        { generalId: 'bfe2_shalmaneser_iii', cityId: 'city_niniwei', generalName: '沙尔马那塞尔三世', portrait: '/assets/ORIE/bfe2_shalmaneser_iii.png', legionName: '古典时代近东军团', eliteName: '阿拉伯步兵', eliteTier: 4 },
        { generalId: 'yashu_saergong', cityId: 'city_niniwei', generalName: '萨尔贡', portrait: '/assets/ORIE/yashu_saergong.png', eliteName: '亚述战车兵', eliteTier: 2 },
        { generalId: 'bfe2_esarhaddon', cityId: 'city_niniwei', generalName: '以撒哈顿', portrait: '/assets/ORIE/bfe2_esarhaddon.png', legionName: '古典时代近东军团', eliteName: '亚述战车兵', eliteTier: 2 },
    
        { generalId: 'guyashu_tigelate', factionId: 'yashu', cityId: 'city_yashucheng', generalName: '提格拉特', portrait: '/assets/ORIE/guyashu_tigelate.png', eliteName: '亚述战车兵', eliteTier: 2 },
        { generalId: 'guyashu_shamushi', factionId: 'yashu', cityId: 'city_yashucheng', generalName: '沙姆希阿达', portrait: '/assets/ORIE/guyashu_shamushi.png', eliteName: '亚述战车兵', eliteTier: 2 },








    ],






    mamuluke: { generalId: 'mamuluke_baibaisi', cityId: 'city_damasikusi', generalName: '拜巴尔斯', portrait: '/assets/ORIE/mamuluke_baibaisi.png', eliteName: '马穆鲁克骑', eliteTier: 1 },







    midi: [







        { generalId: 'midi_daiaokaisi', cityId: 'city_hamadan', generalName: '戴奥凯斯', portrait: '/assets/PERSIAN/midi_daiaokaisi.png', eliteName: '波斯步兵', eliteTier: 4 },







        // 🔴 [2026-10-20] 原「科塞亚」无城战役势力已删；守将卡什提利亚什改挂米底，精锐仍用「科塞亚山兵」T4







        { generalId: 'kesaiya_kashtiliash', cityId: 'city_hamadan', generalName: '卡什提利亚什', portrait: '/assets/PERSIAN/kesaiya_kashtiliash.png', legionName: '古典时代阿契美尼德军团', eliteName: '科塞亚山兵', eliteTier: 4 },







    ],






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







        { generalId: 'aqimeinide_daliushi', cityId: 'city_bosibolisi', generalName: '大流士一世', portrait: '/assets/PERSIAN/aqimeinide_daliushi.png', eliteName: '不死军', eliteTier: 2 },







        { generalId: 'daliushi_iii', cityId: 'city_bosibolisi', generalName: '大流士三世', portrait: '/assets/PERSIAN/daliushi_iii.png', eliteName: '波斯骑兵', eliteTier: 3 },







        // 公元前330年波斯门战役守帅，立绘按铁律留空走回落、待主人亲自放图分配







        { generalId: 'aqimeinide_aertabazanuosi', cityId: 'city_bosibolisi', generalName: '阿里奥巴赞斯', portrait: '/assets/PERSIAN/aqimeinide_aertabazanuosi.png', eliteName: '波斯步兵', eliteTier: 4 },







    
        { generalId: 'gen_artaphernes', legionName: '古典时代阿契美尼德军团', factionId: 'aqimeinide', cityId: 'city_bosibolisi', generalName: '阿尔塔弗涅斯', portrait: '/assets/GREECE/gen_artaphernes.png', eliteName: '不死军', eliteTier: 2 },
        { generalId: 'bfe2_pharnabazus', factionId: 'aqimeinide', cityId: 'city_kelazuomeinai', generalName: '法那巴佐斯', portrait: '/assets/GREECE/bfe2_pharnabazus.png', legionName: '古典时代赫拉斯军团', eliteName: '希腊步兵', eliteTier: 4 },








    
        { generalId: 'mixiya_arsames', factionId: 'aqimeinide', cityId: 'city_dasijiliweng', generalName: '阿萨米斯', portrait: '/assets/PERSIAN/mixiya_arsames.png', legionName: '古典时代阿契美尼德军团', eliteName: '波斯步兵', eliteTier: 4 },
        { generalId: 'bfe3_48', factionId: 'xiongnu', cityId: 'city_guanglu', generalName: '呼韩邪单于', portrait: '/assets/XIANBEI/bfe3_48.png', legionName: '古典时代漠南游牧军团' , eliteName: '匈奴控弦', eliteTier: 3},








    
        { generalId: 'gen_datis', legionName: '古典时代阿契美尼德军团', factionId: 'aqimeinide', cityId: 'city_bosibolisi', generalName: '达提斯', portrait: '/assets/GREECE/gen_datis.png', eliteName: '不死军', eliteTier: 2 },








    
        { generalId: 'panfeiliya_apollonios', factionId: 'aqimeinide', cityId: 'city_peierge', legionName: '古典时代赫拉斯军团', generalName: '阿波罗尼奥斯', portrait: '/assets/GREECE/panfeiliya_apollonios.png', eliteName: '希腊步兵', eliteTier: 4 },








    
        { generalId: 'aliya_satibazanishi', factionId: 'aqimeinide', cityId: 'city_helate_city', generalName: '萨提巴扎尼斯', portrait: '/assets/PERSIAN/aliya_satibazanishi.png', eliteName: '波斯骑兵', eliteTier: 3 },   // 赫拉特守将（立绘留空）
        { generalId: 'aliya_muhammad_tahir', factionId: 'abasi', cityId: 'city_nishabuer', generalName: '塔希尔', portrait: '/assets/SASANIAN/aliya_muhammad_tahir.png', legionName: '封建时代霍拉桑军团', eliteName: '萨珊骑手', eliteTier: 4 },








    
        { generalId: 'hekaniya_artabazos', factionId: 'aqimeinide', cityId: 'city_zilakata', generalName: '阿尔塔巴佐斯', portrait: '/assets/PERSIAN/hekaniya_aertabazuosi.png', eliteName: '波斯骑兵', eliteTier: 3 },








    
        { generalId: 'xiaofulijiya_aerxitis', factionId: 'aqimeinide', cityId: 'city_dasijiliweng', generalName: '阿尔西提斯', portrait: '/assets/PERSIAN/xiaofulijiya_aerxitis.png', eliteName: '波斯步兵', eliteTier: 4 },








    
        { generalId: 'eerbulushi_beisusi', factionId: 'aqimeinide', cityId: 'city_bosibolisi', legionName: '古典时代阿契美尼德军团', generalName: '贝苏斯', portrait: '/assets/PERSIAN/eerbulushi_beisusi.png', eliteName: '不死军', eliteTier: 2 },








    
        { generalId: 'kamanniya_zongdu', factionId: 'aqimeinide', cityId: 'city_kamanniya', generalName: '阿斯普兰斯', portrait: '/assets/PERSIAN/kamanniyaxingsheng_asipulansi.png', eliteName: '波斯步兵', eliteTier: 4 },








    
        { generalId: 'xuliya_shoujiang', legionName: '古典时代近东军团', factionId: 'aqimeinide', cityId: 'city_tapusakusi', generalName: '马泽乌斯', portrait: '/assets/ORIE/xuliya_shoujiang.png', eliteName: '波斯骑兵', eliteTier: 3 },








        { generalId: 'bfe_achaemenes', factionId: 'aqimeinide', cityId: 'city_latajiya', generalName: '阿凯门尼斯', portrait: '/assets/PERSIAN/bfe_achaemenes.png', eliteName: '腓尼基舰队', eliteTier: 2 },
    ],







    sashan: [
        // 🔴 [2026-10-25 补B] 佩罗泽斯（Perozes，萨珊将领；530 达拉之战战死）｜势力 萨珊｜据点 呼勒万（SASANIAN 文化）｜普将（实败）｜精锐「萨珊铁甲」T4｜立绘留空
        { generalId: 'bfe_perozes', factionId: 'sashan', cityId: 'city_hulewan', generalName: '佩罗泽斯', portrait: '/assets/SASANIAN/bfe_perozes.png', eliteName: '萨珊铁甲', eliteTier: 4 },







        { generalId: 'sashan_aerdaxier', cityId: 'city_feiluzhabade', generalName: '阿尔达希尔', portrait: '/assets/SASANIAN/sashan_aerdaxier.png', eliteName: '萨珊铁甲', eliteTier: 2 },  // 菲鲁扎巴德·萨珊建立者







        // 🔴 [2026-10-20 成名战规则] 卑路斯一世＝萨珊王（459–484，484 赫拉特之战被嚈哒击败身死）→ 菲鲁扎巴德·萨珊；普将；立绘留空







        { generalId: 'sashan_beilusi', cityId: 'city_feiluzhabade', generalName: '卑路斯一世', portrait: '/assets/SASANIAN/sashan_beilusi.png', eliteName: '萨珊骑手', eliteTier: 4 },







        // 🔴 [2026-10-20 成名战规则] 霍斯劳二世＝萨珊末代雄主（590 借兵复国、596 平巴赫拉姆叛乱、628 被杀），菲鲁扎巴德·萨珊；







        //    名将（借兵复国、收复失地、屡破拜占庭）；军团按「封建×SASANIAN」＝封建时代霍拉桑军团；立绘留空







        { generalId: 'sashan_khosrow_ii', cityId: 'city_feiluzhabade', generalName: '霍斯劳二世', portrait: '/assets/SASANIAN/sashan_khosrow_ii.png', legionName: '封建时代霍拉桑军团', eliteName: '萨珊重骑', eliteTier: 3 },







        // 🔴 [2026-10-20 成名战剧情] 巴赫拉姆六世＝萨珊叛将、僭位之王（590 击败霍斯劳占泰西封，591 布拉拉通之战被杀）→ 菲鲁扎巴德·萨珊；名将；立绘留空







        { generalId: 'sashan_bahram_vi', cityId: 'city_feiluzhabade', generalName: '巴赫拉姆六世', portrait: '/assets/SASANIAN/sashan_bahram_vi.png', eliteName: '萨珊重骑', eliteTier: 3 },







    
        { generalId: 'aba_shapuer', factionId: 'sashan', cityId: 'city_nishabuer', generalName: '沙普尔', portrait: '/assets/PERSIAN/aba_shapuer.png', legionName: '古典时代萨珊军团', eliteName: '萨珊铁甲', eliteTier: 2 },








    
        { generalId: 'maer_d_bahelamuchubin', legionName: '封建时代德莱木军团', factionId: 'sashan', cityId: 'city_pengdi', generalName: '楚宾', portrait: '/assets/PERSIAN/maer_d_bahelamuchubin.png', eliteName: '波斯步兵', eliteTier: 4 },








    
        { generalId: 'shahelude_weisitamu', legionName: '封建时代德莱木军团', factionId: 'sashan', cityId: 'city_bistam', generalName: '维斯塔姆', portrait: '/assets/PERSIAN/shahelude_weisitamu.png', eliteName: '萨珊铁甲', eliteTier: 2 },








    
        { generalId: 'zhageluosi_guanjiang', factionId: 'sashan', cityId: 'city_hulewan', generalName: '巴赫拉姆', portrait: '/assets/SASANIAN/zhageluosi_guanjiang.png', eliteName: '萨珊骑手', eliteTier: 4 },








        { generalId: 'sashan_khosrow', factionId: 'sashan', cityId: 'city_nishabuer', generalName: '霍斯劳一世', portrait: '/assets/SASANIAN/sashan_khosrow.png', eliteName: '萨珊铁甲', eliteTier: 2 },
        { generalId: 'sashan_shah', factionId: 'sashan', cityId: 'city_feiluzhabade', generalName: '沙阿王', portrait: '/assets/SASANIAN/sashan_shah.png', eliteName: '波斯王卫', eliteTier: 4 },
    ],







    safawei_d: [








        { generalId: 'safawei_d_abasi', cityId: 'city_yisifahan', generalName: '阿拔斯', portrait: '/assets/PERSIAN/safawei_d_abasi.png', eliteName: '红头军', eliteTier: 1 },
        { generalId: 'yilihanguo_yisimeier', factionId: 'safawei_d', cityId: 'city_zanzhan', generalName: '伊斯玛仪一世', portrait: '/assets/PERSIAN/yilihanguo_yisimeier.png', eliteName: '红头军', eliteTier: 1 },   // 按史订正（2026-10-25）：即萨法维沙阿伊斯梅尔一世（1487–1524），原条生卒 1305–1335 与「城堡时代伊儿军团」皆误，已删手写军团走势力时代×据点文化,
        { generalId: 'yilihanguo_kitbuqa', factionId: 'yilihanguo_d', cityId: 'city_zanzhan', legionName: '城堡时代伊儿军团', generalName: '怯的不花', portrait: '/assets/SASANIAN/yilihanguo_kitbuqa.png', eliteName: '蒙古骑兵', eliteTier: 3 },   // 🔴 [2026-10-28 按史] 怯的不花是旭烈兀伊利汗国的先锋统帅；原挂萨法维（1487 年才建，晚 200 多年，错）。军团同合赞/旭烈兀＝城堡时代伊儿军团








    








        { generalId: 'safawei_d_tahmasp', factionId: 'safawei_d', cityId: 'city_jiaziwen', generalName: '塔赫马斯普', portrait: '/assets/PERSIAN/safawei_d_tahmasp.png', eliteName: '古拉姆军', eliteTier: 2 },   // 萨法维沙阿（1524–1576），1548 迁都加兹温，屡破奥斯曼与乌兹别克（镇守加兹温）
    ],







    sumeier: [







        { generalId: 'sumeier_nabopalasa', cityId: 'city_babilun', generalName: '那波帕拉萨', portrait: '/assets/ORIE/sumeier_nabopalasa.png', eliteName: '巴比伦战车', eliteTier: 3 },







        { generalId: 'sumeier_zhajixi', cityId: 'city_wuluke', generalName: '扎吉西', portrait: '/assets/ORIE/sumeier_zhajixi.png', eliteName: '阿拉伯步兵', eliteTier: 4 },







    ],







    ayoubu: [







        { generalId: 'ayoubu_salaheding', cityId: 'city_damasikusi', generalName: '萨拉丁', portrait: '/assets/ORIE/ayoubu_salaheding.png', eliteName: '马穆鲁克骑', eliteTier: 1 },







        // 🔴 [2026-10-20 主人令「把剩下4位缺的敌将新建为据点武将」] 成名战敌将·名将双身份（立绘留空，走回落）







        { generalId: 'gen_sayf_al_dawla', cityId: 'city_alepo', generalName: '赛弗道莱', portrait: '/assets/ORIE/gen_sayf_al_dawla.png', legionName: '封建时代哈里发军团' , eliteName: '哈姆丹骑', eliteTier: 2},







        { generalId: 'bfe_aulax', factionId: 'ayoubu', cityId: 'city_antiejiya', generalName: '奥拉克斯', portrait: '/assets/ORIE/bfe_aulax.png', eliteName: '安条克守军', eliteTier: 4 },
    ],







    // ── 2026-08-04 新增：鲍德温（埃德萨伯国首任伯爵，后为耶路撒冷国王）──







    aosiruowen: { generalId: 'gen_abgar', cityId: 'city_aidesa', generalName: '阿布加尔', portrait: '/assets/ORIE/aosiruowen_abujiaer.png', eliteName: '阿拉伯步兵', eliteTier: 4 },







    // 2026-07-27 补：打耳班/以弗所/安卡拉/亚述城 + 苏萨补将







    ailan: [
        { generalId: 'bfe2_mardonius', factionId: 'aqimeinide', cityId: 'city_susa', generalName: '马尔多尼乌斯', portrait: '/assets/PERSIAN/bfe2_mardonius.png', legionName: '古典时代阿契美尼德军团', eliteName: '波斯步兵', eliteTier: 4 },
        { generalId: 'bfe2_xerxes_i', cityId: 'city_susa', generalName: '薛西斯一世', portrait: '/assets/PERSIAN/bfe2_xerxes_i.png', legionName: '古典时代阿契美尼德军团', eliteName: '波斯步兵', eliteTier: 4 },







        // 🔴 [2026-10-20 主人令「势力＝武将所在政权」] 居鲁士二世是阿契美尼德帝国建立者（苏萨只是他的都城据点，城归埃兰不动）







        //    → 势力挂「阿契美尼德(aqimeinide)」，不挂埃兰







        { generalId: 'ailan_julushi', cityId: 'city_susa', generalName: '居鲁士二世', portrait: '/assets/PERSIAN/ailan_julushiershi.png', factionId: 'aqimeinide' , eliteName: '波斯王军', eliteTier: 3 }, // 阿契美尼德开国征服军本部







        // 🔴 [2026-10-20 成名战规则] 冈比西斯二世＝前524 波斯远征锡瓦时的波斯大王（大流士前522才即位）；据点苏萨、势力阿契美尼德；立绘留空







        { generalId: 'gen_cambyses', cityId: 'city_susa', generalName: '冈比西斯二世', portrait: '/assets/PERSIAN/gen_cambyses.png', factionId: 'aqimeinide' , eliteName: '长生军', eliteTier: 2 }, // 前525 培琉喜阿姆胜埃及、完成征服之本部







        { generalId: 'ailan_shuteluke', cityId: 'city_susa', generalName: '纳克昆特', portrait: '/assets/PERSIAN/ailan_shuteluke.png', eliteName: '埃兰战车', eliteTier: 3 },







        // 🔴 [2026-10-20] 原「乌克西亚」无城战役势力已删；首领马达泰斯改挂埃兰，精锐仍用「乌克西亚弓」T3







        { generalId: 'wukexiya_madates', cityId: 'city_susa', generalName: '马达泰斯', portrait: '/assets/PERSIAN/wukexiya_madates.png', legionName: '古典时代阿契美尼德军团', eliteName: '乌克西亚弓', eliteTier: 3 },







    
        { generalId: 'lulisitan_shoujiang', legionName: '古典时代萨珊军团', factionId: 'ailan', cityId: 'city_yilamu', generalName: '舒特鲁克', portrait: '/assets/SASANIAN/lulisitan_shoujiang.png', eliteName: '萨珊骑手', eliteTier: 4 },








    ],







    kesa: { generalId: 'kesa_bulan', cityId: 'city_daerban', generalName: '布兰', portrait: '/assets/PERSIAN/kesa_bulan.png', eliteName: '波斯步兵', eliteTier: 4 },







    aiaoniya: [








        { generalId: 'aiaoniya_alisita', cityId: 'city_yifusuo', generalName: '阿里斯塔哥拉斯', portrait: '/assets/GREECE/aiaoniya_alisita.png', eliteName: '希腊步兵', eliteTier: 4 },
        { generalId: 'yiaoniya_hegesistratus', factionId: 'aiaoniya', cityId: 'city_miletus', generalName: '赫格西斯特', portrait: '/assets/GREECE/yiaoniya_hegesistratus.png', eliteName: '希腊步兵', eliteTier: 4 },








    ],







    // 公元前334年米利都围城战守将（波斯驻米利都守军统领，中文维基百科「米利都圍城戰」作赫格西斯特拉塔斯），立绘按铁律留空、待主人亲自放图分配






    jialatai: { generalId: 'jialatai_deaota', cityId: 'city_ankala', generalName: '德奥塔鲁斯', portrait: '/assets/ORIE/jialatai_deaota.png', eliteName: '阿拉伯步兵', eliteTier: 4 },






    ansxi: [
        { generalId: 'ansxi_surena', factionId: 'ansxi', cityId: 'city_nisa', generalName: '苏莱纳', portrait: '/assets/PERSIAN/ansxi_surena.png', eliteName: '帕提亚铁骑', eliteTier: 2 },   // 🔴 [2026-10-25 按史] 成名战敌将；苏林家族主帅，前53 卡莱全歼罗马军；四闸齐备（亲统、大胜、战区级、敌帅克拉苏实名）判名将；据点尼萨（中亚 CENTRAL_ASIA，安息旧都）；用势力精锐帕提亚铁骑
        { generalId: 'bfe_meherdates', cityId: 'city_nisa', generalName: '梅哈尔达特', portrait: '/assets/PERSIAN/bfe_meherdates.png', legionName: '古典时代粟特军团', eliteName: '河中骑兵', eliteTier: 4 },







        { generalId: 'ansxi_aershake', cityId: 'city_nisa', generalName: '阿尔沙克', portrait: '/assets/PERSIAN/ansxi_aershake.png', eliteName: '帕提亚铁骑', eliteTier: 2 },







        // 名将双身份：阿尔达班四世（据点武将＋剧本敌将）







        { generalId: 'bfe3_73', cityId: 'city_nisa', generalName: '阿尔达班四世', portrait: '/assets/PERSIAN/bfe3_73.png', legionName: '古典时代粟特军团' , eliteName: '安息铁骑', eliteTier: 3},







    
        // 🔴 [2026-10-24 主人令] 苏伦留法拉：家族领地为「推断」（House of Suren 可能在 Sakastan/阿拉霍西亚—德兰吉亚之间有地并治锡斯坦），
        //    苏伦本人无常驻可考；详见 city_fala 的 note。
        { generalId: 'delan_sulun', factionId: 'ansxi', cityId: 'city_fala', generalName: '苏伦', portrait: '/assets/PERSIAN/delan_sulun.png', eliteName: '帕提亚铁骑', eliteTier: 2 },








    
        { generalId: 'kalan_suhela', factionId: 'ansxi', cityId: 'city_tusi', generalName: '苏赫拉', portrait: '/assets/PERSIAN/kalan_suhela.png', eliteName: '波斯步兵', eliteTier: 4 },








    ],







    nabatai: { generalId: 'nabatai_aleitasi', cityId: 'city_peitra', generalName: '阿雷塔斯', portrait: '/assets/ORIE/nabatai_aleitasi.png', eliteName: '纳巴泰骑', eliteTier: 3 },







    xike: [








        { generalId: 'xike_lanjite', cityId: 'city_laheer', generalName: '兰季特辛格', portrait: '/assets/INDIA/xike_lanjite.png', eliteName: '锡克骑兵', eliteTier: 2 },
        { generalId: 'pangzha_halixinge', legionName: '帝国时代旁遮普军团', factionId: 'xike', cityId: 'city_atuoke', generalName: '哈里辛格', portrait: '/assets/PURU/pangzha_halixinge.png', eliteName: '锡克骑兵', eliteTier: 2 },








    ],







    deli: [
        // 🔴 [2026-10-20 成名战规则] 萨达希夫·拉奥·巴乌＝马拉塔统帅（1761 第三次帕尼帕特战死）；库无马拉塔势力，借德里（报告）；帝国时代莫卧儿军团；立绘留空
        { generalId: 'gen_sadashivrao', cityId: 'city_deli', generalName: '萨达希夫', portrait: '/assets/MUGHAL/gen_sadashivrao.png', legionName: '帝国时代莫卧儿军团', eliteName: '德里骑兵', eliteTier: 2 },
        // 🔴 [2026-10-20 成名战规则] 赫穆＝苏尔王朝将领（1556 第二次帕尼帕特战败被杀）
        // 🔴 [2026-10-28 主人批立] 苏尔王朝立独立势力（主人定：武将历史是哪个政权就是哪个势力）；据点仍德里＝他驻防的都城；军团＝帝国×莫卧儿格（手写）
        { generalId: 'gen_hemu', factionId: 'sur', cityId: 'city_deli', generalName: '赫穆', portrait: '/assets/MUGHAL/gen_hemu.png', legionName: '帝国时代莫卧儿军团', eliteName: '德里骑兵', eliteTier: 2 },



        { generalId: 'deli_alawuding', cityId: 'city_deli', generalName: '阿拉乌丁', portrait: '/assets/MUGHAL/deli_alawuding.png', eliteName: '德里骑兵', eliteTier: 2 },



        // 🔴 [2026-10-20 成名战规则] 洛迪＝德里苏丹（1526 第一次帕尼帕特战死）→ 德里（MUGHAL）；帝国时代莫卧儿军团；立绘留空



        { generalId: 'gen_ibrahim_lodi', cityId: 'city_deli', generalName: '易卜拉欣洛迪', portrait: '/assets/MUGHAL/gen_ibrahim_lodi.png', legionName: '帝国时代莫卧儿军团', eliteName: '德里骑兵', eliteTier: 2 },



    
        { generalId: 'xindu_bahelamuhan', legionName: '帝国时代旁遮普军团', factionId: 'mowoer', cityId: 'city_kalaqi', generalName: '巴赫拉姆汗', portrait: '/assets/PURU/xindu_bahelamuhan.png', eliteName: '旁遮普骑兵', eliteTier: 3 },   // 🔴 [2026-10-28 按史] 巴赫拉姆汗是阿克巴的莫卧儿摄政（1556 保殿山之役）；原挂德里苏丹国（1526 年已亡，错）








    
        { generalId: 'muertan_naxierding', legionName: '城堡时代五河军团', factionId: 'deli', cityId: 'city_wuqi', generalName: '纳西尔丁', portrait: '/assets/PURU/muertan_naxierding.png', eliteName: '旁遮普骑兵', eliteTier: 3 },








    ],







    mowoer: [








        { generalId: 'mowoer_akeba', cityId: 'city_agela', generalName: '阿克巴', portrait: '/assets/MUGHAL/mowoer_akeba.png', eliteName: '莫卧儿骑兵', eliteTier: 2 },
        { generalId: 'babuer_babuer', factionId: 'mowoer', cityId: 'city_gaofu', generalName: '巴布尔', portrait: '/assets/MUGHAL/babuer_babuer.png', eliteName: '莫卧儿骑兵', eliteTier: 2 },








    ],







    jieri: [
        { generalId: 'jieri_jieriwang', cityId: 'city_qunvcheng', generalName: '哈尔沙', portrait: '/assets/INDIA/jieri_jieriwang.png', eliteName: '戒日战象', eliteTier: 2 },
    ],







    kongque: [
        { generalId: 'bfe2_dhanananda', factionId: 'mojietuo', cityId: 'city_huashicheng', generalName: '达那难陀', portrait: '/assets/PURU/bfe2_dhanananda.png', eliteName: '印度斯坦兵', eliteTier: 4 },







        { generalId: 'kongque_zhantuoluo', cityId: 'city_huashicheng', generalName: '旃陀罗笈多', portrait: '/assets/PURU/kongque_zhantuoluo.png', eliteName: '孔雀战象', eliteTier: 2 },







        // 🔴 [2026-10-20 成名战规则] 阿罗那顺＝中天竺篡位王（648 被王玄策借兵擒获）→ 华氏城·孔雀（中天竺无独立势力，挂该城势力）；普将；封建×普鲁＝封建时代沙希军团；立绘留空







        { generalId: 'kongque_aluonashun', cityId: 'city_qunvcheng', generalName: '阿罗那顺', portrait: '/assets/PURU/kongque_aluonashun.png', eliteName: '中天竺象兵', eliteTier: 4 },   // 🔴 648 年中天竺的象兵（原配「孔雀战象」是前 3 世纪孔雀王朝的）







    
        { generalId: 'jiaye_punafamo', factionId: 'kongque', cityId: 'city_putijiaye', generalName: '普那伐摩', portrait: '/assets/PURU/jiaye_punafamo.png', eliteName: '印度斯坦兵', eliteTier: 4 },








    
        { generalId: 'muxikani_muxikanuosi', factionId: 'kongque', cityId: 'city_aluoer', generalName: '穆西卡诺斯', portrait: '/assets/PURU/muxikani_muxikanuosi.png', eliteName: '旁遮普兵', eliteTier: 4 },








    ],







    mojietuo: { generalId: 'mojietuo_pinbisuoluo', cityId: 'city_wangshecheng', generalName: '频毗娑罗', portrait: '/assets/PURU/mojietuo_pinbisuoluo.png', eliteName: '印度斯坦兵', eliteTier: 4 },







    // 2026-09-12 主人三条规矩：军团要有武将・武将要有所属据点势力。







    // 古典时代孟加拉（2026-10-16 名册名【古典时代高陀军团】）需要一位古典孟加拉武将 = 毗阇耶（大史记其自孟加拉僧伽补罗出海、







    // 征服楞伽建僧伽罗王朝，约公元前543年，古典）。**数组第一位＝守将，仍是达磨波罗**（绝不挤掉）。







    // 立绘留空＝走文化池回落，由主人放图。







    boluo: [







        { generalId: 'boluo_damoboluo', cityId: 'city_gaodacheng', generalName: '达磨波罗', portrait: '/assets/BENGALIS/boluo_damoboluo.png', eliteName: '孟加拉战象', eliteTier: 2 },







        { generalId: 'boluo_vijaya', cityId: 'city_gaodacheng', generalName: '毗阇耶', portrait: '/assets/BENGALIS/boluo_vijaya.png', legionName: '古典时代高陀军团', eliteName: '孟加拉兵', eliteTier: 4 },







        // 🔴 [2026-10-20 主人令「遇到问题先看符合历史，下结论再动手」] 成名战回补安置按史实复核：设赏迦＝高达（孟加拉）国王、戒日王死敌，根据地孟加拉，不是戒日王都曲女城 → 放高达城（boluo，风格 BENGALIS）；仍挂本政权 jieri
        { generalId: 'gen_shashanka', cityId: 'city_gaodacheng', generalName: '设赏迦', portrait: '/assets/BENGALIS/gen_shashanka.png', factionId: 'boluo', eliteName: '孟加拉战象', eliteTier: 2 },
    
        { generalId: 'varendra_devapala', factionId: 'boluo', cityId: 'city_gaodacheng', legionName: '封建时代波罗军团', generalName: '提婆波罗', portrait: '/assets/BENGALIS/varendra_devapala.png', eliteName: '孟加拉战象', eliteTier: 2 },








    ],






    jiashi_d: { generalId: 'jiashi_jiashiwang_d', cityId: 'city_walanaxi', generalName: '梵摩达', portrait: '/assets/INDIA/jiashi_d_jiashiwang.png', eliteName: '印度斯坦兵', eliteTier: 4 },







    zhuluo: [
        { generalId: 'bfe3_25', cityId: 'city_tanjiawuer', generalName: '埃拉拉', portrait: '/assets/INDIA/bfe3_25.png', legionName: '古典时代泰米尔军团', eliteName: '印度步兵', eliteTier: 4 },







        { generalId: 'zhuluo_lajialajia', cityId: 'city_tanjiawuer', generalName: '拉贾拉贾一世', portrait: '/assets/INDIA/zhuluo_lajialajiayishi.png', eliteName: '朱罗战象', eliteTier: 2 },







        // 2026-10-20：朱罗帝国拉金德拉一世（1014–1044 在位，远征南洋）→ 坦贾武尔；INDIA×封建＝朱罗军团







        { generalId: 'zhuluo_lajindela', cityId: 'city_tanjiawuer', generalName: '拉金德拉一世', portrait: '/assets/INDIA/zhuluo_lajindela.png', legionName: '封建时代朱罗军团', eliteName: '朱罗战象', eliteTier: 2 },







    ],







    pandiya: { generalId: 'pandiya_jiatawaerman', cityId: 'city_madula', generalName: '贾塔瓦尔曼', portrait: '/assets/INDIA/pandiya_jiatawaerman.png', eliteName: '印度步兵', eliteTier: 4 },






    dedan: { generalId: 'dedan_dedanwang', cityId: 'city_taima', generalName: '卡比里尔', portrait: '/assets/ORIE/dedan_dedanwang.png', eliteName: '阿拉伯步兵', eliteTier: 4 },







    maidina: [







        { generalId: 'maidina_halide', cityId: 'city_maidina', generalName: '哈立德', portrait: '/assets/ORIE/maidina_halide.png', eliteName: '阿拉伯轻骑', eliteTier: 2 },







        // 🔴 [2026-10-20 成名战规则] 阿里＝第四任正统哈里发（656 骆驼之战胜、657 隋芬之战对穆阿维叶）→ 麦地那·拉希顿；名将；封建×ORIE＝封建时代哈里发军团；立绘留空







        { generalId: 'maidina_ali', cityId: 'city_maidina', generalName: '阿里', portrait: '/assets/ORIE/maidina_ali.png', eliteName: '圣门卫队', eliteTier: 3 },







    ],







    gulaishi: { generalId: 'gulaishi_aibu', cityId: 'city_maijia', generalName: '艾布苏富扬', portrait: '/assets/ORIE/gulaishi_aibu.png', eliteName: '阿拉伯步兵', eliteTier: 4 },







    xierwan: { generalId: 'xierwan_farukusha', cityId: 'city_baku', generalName: '法鲁克沙', portrait: '/assets/ORIE/xierwan_farukusha.png', eliteName: '阿拉伯步兵', eliteTier: 4 },







    xiemian: { generalId: 'xiemian_xiemianwang', cityId: 'city_xiemianjieer', generalName: '齐贝尔', portrait: '/assets/CENTRAL_ASIA/xiemian_xiemianwang.png', eliteName: '库曼骑手', eliteTier: 4 },







    yidier: { generalId: 'yidier_yidiewang', cityId: 'city_yidier', generalName: '约瑟夫', portrait: '/assets/CENTRAL_ASIA/yidier_yidiewang.png', eliteName: '库曼骑手', eliteTier: 4 },







    salai: [







        { generalId: 'salai_salaiwang', cityId: 'city_salaichuke', generalName: '埃迪古', portrait: '/assets/CENTRAL_ASIA/salai_salaiwang.png', eliteName: '河中骑兵', eliteTier: 4 },







        { generalId: 'gen_onas_khan', cityId: 'city_salaichuke', generalName: '欧拿斯', portrait: '/assets/CENTRAL_ASIA/gen_onas_khan.png', legionName: '帝国时代突厥斯坦军团', eliteName: '河中骑兵', eliteTier: 4 },







    ],







    mangshi: { generalId: 'mangshi_mangshiwang', cityId: 'city_mangshilake', generalName: '恰格里', portrait: '/assets/CENTRAL_ASIA/mangshi_mangewang.png', eliteName: '河中骑兵', eliteTier: 4 },







    aztec: [
        { generalId: 'gen_cuauhtemoc', cityId: 'city_tenochtitlan', generalName: '库奥特莫克', portrait: '/assets/AMERICA/aztec_kuaotemoke.png', eliteName: '美洲民兵', eliteTier: 4 },
        { generalId: 'aztec_itzcoatl', factionId: 'aztec', cityId: 'city_tenochtitlan', generalName: '伊兹科阿图', portrait: '/assets/AMERICA/aztec_itzcoatl.png', eliteName: '墨西加战士', eliteTier: 2 },
        { generalId: 'aztec_cuauhtemoc', factionId: 'aztec', cityId: 'city_tenochtitlan', generalName: '瓜特穆斯', portrait: '/assets/AMERICA/aztec_cuauhtemoc.png', eliteName: '鹰勇士', eliteTier: 3 },
    ],







    inca: [
        { generalId: 'gen_atoc', factionId: 'inca', cityId: 'city_tumebamba', generalName: '阿托克', portrait: '/assets/INCA/gen_atoc.png', legionName: '帝国时代塔万廷军团', eliteName: '卡尼亚里军', eliteTier: 2 },



        { generalId: 'gen_topa_inca', cityId: 'city_cusco', generalName: '图帕克', portrait: '/assets/INCA/gen_topa_inca.png', eliteName: '印加武士', eliteTier: 2 },



        // 🔴 [2026-10-20 成名战规则] 阿塔瓦尔帕＝印加末帝（1532 卡哈马卡被皮萨罗俘杀）→ 库斯科（INCA）；帝国时代塔万廷军团；立绘留空



        { generalId: 'gen_atahualpa', eliteName: '卡哈马卡军', eliteTier: 3, cityId: 'city_quito', generalName: '阿塔瓦尔帕', portrait: '/assets/INCA/gen_atahualpa.png', legionName: '帝国时代塔万廷军团' }, // 1532 卡哈马卡所部



    
        { generalId: 'gen_pachacuti', factionId: 'inca', cityId: 'city_machu_picchu', generalName: '帕查库特克', portrait: '/assets/INCA/gen_pachacuti.png', eliteName: '印加武士', eliteTier: 2 },








        { generalId: 'inca_huayna', factionId: 'inca', cityId: 'city_cusco', generalName: '瓦伊纳卡帕克', portrait: '/assets/INCA/inca_huayna.png', eliteName: '印加卫队', eliteTier: 3 },
    ],







    maya: [
        { generalId: 'gen_uaxaclajuun', factionId: 'maya', cityId: 'city_copan', generalName: '十八兔', portrait: '/assets/MAYANS/gen_uaxaclajuun.png', legionName: '封建时代尤卡坦军团', eliteName: '科潘武士', eliteTier: 3 },
        // 🔴 [2026-10-25 补B] 西亚赫卡克（Siya(j) K'ak'，378–402 活跃，玛雅古典期早期最高军事统帅 Kaloomte'；蒂卡尔第 31 号石碑载 378-01-16 攻克蒂卡尔、击杀美洲虎爪一世，并征服瓦夏克吞等）｜势力 玛雅｜据点 蒂卡尔（MAYANS 文化，佩滕）｜普将（存疑）｜精锐「蒂卡尔军」T4｜立绘留空
        { generalId: 'maya_siyaj_kak', factionId: 'maya', cityId: 'city_tikal', generalName: '西亚赫卡克', portrait: '/assets/MAYANS/maya_siyaj_kak.png', eliteName: '蒂卡尔军', eliteTier: 4 },
        { generalId: 'gen_jasawchan', cityId: 'city_tikal', generalName: '亚斯纳昌', portrait: '/assets/MAYANS/gen_jasawchan.png', eliteName: '玛雅战士', eliteTier: 4 },
        { generalId: 'gen_pakal', cityId: 'city_palenque', generalName: '帕卡尔', portrait: '/assets/MAYANS/gen_pakal.png', legionName: '封建时代尤卡坦军团', eliteName: '帕伦克矛兵', eliteTier: 4 },
    ],







    mapuche: [








        { generalId: 'gen_lautaro', cityId: 'city_tucapel', generalName: '劳塔罗', portrait: '/assets/MAPUCHE/gen_lautaro.png', legionName: '帝国时代安第斯游击军团', eliteName: '马普切骑兵', eliteTier: 2 },
        { generalId: 'gen_guacolda', factionId: 'mapuche', cityId: 'city_bideluoa', generalName: '瓜科尔达', portrait: '/assets/MAPUCHE/gen_guacolda.png', eliteName: '马普切战士', eliteTier: 4 },








    ],







    muisca: [








        { generalId: 'gen_saguamanchica', cityId: 'city_bacata', generalName: '萨瓜曼奇卡', portrait: '/assets/MUISCA/gen_saguamanchica.png', eliteName: '穆伊斯卡兵', eliteTier: 4 },
        { generalId: 'gen_pacanchiq', legionName: '帝国时代格查武士军团', factionId: 'muisca', cityId: 'city_hongsa', generalName: '帕坎奇克', portrait: '/assets/MUISCA/gen_pacanchiq.png', eliteName: '穆伊斯卡兵', eliteTier: 4 },








    ],







    tupi: [







        { generalId: 'gen_arariboia', cityId: 'city_guanabara', generalName: '阿拉里博亚', portrait: '/assets/TUPI/gen_arariboia.png', eliteName: '图皮战士', eliteTier: 4 },







        // 2026-10-20：图皮尼金酋长蒂巴里萨（16 世纪，巴西）→ 图皮（瓜纳巴拉）；TUPI×帝国＝塔莫约军团







        { generalId: 'gen_tibirica', cityId: 'city_guanabara', generalName: '蒂巴里萨', portrait: '/assets/TUPI/gen_tibirica.png', legionName: '帝国时代图皮军团', eliteName: '图皮战士', eliteTier: 4 },







    ],







    xibanya: [
        // 🔴 [2026-10-25 主人令「有知名度高的将领先加」] 阿尔瓦公爵（1507–1582，西属尼德兰总督 1567–1573，驻布鲁塞尔）；势力 西班牙；据点 布鲁塞尔（BURGUNDIANS，西属尼德兰总督府）；名将；精锐「尼德兰枪兵」T2；立绘留空
        { generalId: 'xibanya_aerwa', factionId: 'xibanya', cityId: 'city_bulusaier', generalName: '阿尔瓦公爵', portrait: '/assets/BURGUNDIANS/xibanya_aerwa.png', eliteName: '尼德兰枪兵', eliteTier: 2, legionName: '帝国时代弗兰德斯军团' },   // 🔴 [2026-10-25] 西班牙势力指针＝三级海外军团（西班牙征服），欧洲本土须手写二级军团长：布鲁塞尔＝BURGUNDIANS×帝国



        { generalId: 'xibanya_pisaluo', cityId: 'city_lima', generalName: '皮萨罗', portrait: '/assets/SPANISH/xibanya_pisaluo.png' , legionName: '帝国时代西班牙征服军团', eliteName: '征服者骑', eliteTier: 3 },



        // 🔴 [2026-10-20 成名战规则] 瓦尔迪维亚＝智利征服者（1553 图卡佩尔被劳塔罗击杀）→ 利马（SPANISH）；帝国时代西班牙方阵军团；立绘留空



        { generalId: 'gen_valdivia', cityId: 'city_lima', generalName: '瓦尔迪维亚', portrait: '/assets/SPANISH/gen_valdivia.png', legionName: '帝国时代西班牙方阵军团', eliteName: '征服者骑', eliteTier: 3 },



        // 🔴 [2026-10-20 成名战规则] 梅迪纳科利公爵＝西班牙统帅（1560 杰尔巴岛海战败于奥斯曼）→ 利马（SPANISH）；帝国时代西班牙方阵军团；立绘留空



        { generalId: 'gen_medinaceli', cityId: 'city_lima', generalName: '梅迪纳科利', portrait: '/assets/SPANISH/gen_medinaceli.png', legionName: '帝国时代西班牙方阵军团', eliteName: '西班牙民兵', eliteTier: 4 },



        { generalId: 'xibanya_orellana', factionId: 'xibanya', cityId: 'city_lima', generalName: '弗朗西斯科', portrait: '/assets/SPANISH/xibanya_orellana.png', eliteName: '征服者火枪', eliteTier: 3 },
        { generalId: 'xibanya_gonzalo', factionId: 'xibanya', cityId: 'city_lima', generalName: '贡萨洛', portrait: '/assets/SPANISH/xibanya_gonzalo.png', eliteName: '征服者骑', eliteTier: 3 },
    ],  // 利马·征服印加的西班牙征服者







    manding: [
        { generalId: 'gen_sundjata', eliteName: '飞刀女兵', eliteTier: 3, cityId: 'city_niani', generalName: '松迪亚塔', portrait: '/assets/AFRICA/manding_songdiyata.png' },
        // 🔴 [2026-10-24 中城补将·镇守] 法尔巴·穆萨＝马里帝国廷巴克图太守（1353 年伊本·白图泰到廷巴克图时见到的守臣，见《伊本·白图泰游记》、英文维基 History of Timbuktu）；「法尔巴」为马里官称，按规矩只留本名「穆萨」；守土之臣、无胜绩 → 普将；城堡×非洲＝城堡时代马里军团；立绘留空
        { generalId: 'manding_musa', generalName: '穆萨', cityId: 'city_timbuktu', portrait: '/assets/AFRICA/manding_musa.png', eliteName: '法拉里卫队', eliteTier: 4 },
    ],

    // 🔴 [2026-10-24 中城补将] 明彬＝阿拉干王（1531—1554）；妙乌（BURMESE）守城：1535 逐退葡萄牙火枪队、1547 开闸水淹东吁围军，筑石墙深壕、创孟加拉湾水师；帝国×缅甸＝帝国时代缅甸军团；名将；立绘留空
    arakan: [
        { generalId: 'arakan_mingbin', generalName: '明彬', cityId: 'city_miaowu', portrait: '/assets/BURMESE/arakan_mingbin.png', eliteName: '阿拉干水师', eliteTier: 2 },
    ],







    ethiopia: [
        { generalId: 'ethiopia_lebnadengel', factionId: 'ethiopia', cityId: 'city_fasil_fort', generalName: '登格尔', portrait: '/assets/ETHIOPIANS/ethiopia_lebnadengel.png', eliteName: '埃塞卫兵', eliteTier: 4 },   // 🔴 [2026-10-25 按史] 成名战敌将；埃塞俄比亚皇帝，1529 申布拉库雷败于阿达尔军；据点法西尔堡（ETHIOPIANS）；用势力精锐弯刀勇士








        { generalId: 'gen_ezana', cityId: 'city_aksum', generalName: '埃扎纳', portrait: '/assets/ETHIOPIANS/gen_ezana.png', eliteName: '埃塞卫兵', eliteTier: 4 },
        { generalId: 'gen_gidajan', legionName: '城堡时代埃塞俄比亚军团', factionId: 'ethiopia', cityId: 'city_debuleidamo', generalName: '吉达扬', portrait: '/assets/ETHIOPIANS/gen_gidajan.png', eliteName: '埃塞卫兵', eliteTier: 4 },








    
        { generalId: 'gen_dagnajan', legionName: '封建时代拉利贝拉军团', factionId: 'ethiopia', cityId: 'city_debuleilibanuosi', generalName: '达格纳詹', portrait: '/assets/ETHIOPIANS/gen_dagnajan.png', eliteName: '埃塞卫兵', eliteTier: 4 },








    
        { generalId: 'gen_fasilides', legionName: '帝国时代阿姆哈拉军团', factionId: 'ethiopia', cityId: 'city_fasil_fort', generalName: '法西里德', portrait: '/assets/ETHIOPIANS/gen_fasilides.png', eliteName: '埃塞卫兵', eliteTier: 4 },








        { generalId: 'ethiopia_abraha', factionId: 'ethiopia', cityId: 'city_aksum', generalName: '阿布拉哈', portrait: '/assets/ETHIOPIANS/ethiopia_abraha.png', eliteName: '阿克苏姆兵', eliteTier: 3 },
        { generalId: 'ethiopia_yekuno', factionId: 'ethiopia', cityId: 'city_aksum', generalName: '耶库诺阿姆拉克', portrait: '/assets/ETHIOPIANS/ethiopia_yekuno.png', eliteName: '示巴卫队', eliteTier: 3 },
        { generalId: 'ethiopia_eleni', factionId: 'ethiopia', cityId: 'city_aksum', generalName: '埃莱妮', portrait: '/assets/ETHIOPIANS/ethiopia_eleni.png', eliteName: '埃塞卫兵', eliteTier: 4 },
    ],







    zhagewei: { generalId: 'zhagewei_gebulei', cityId: 'city_lalibeila', generalName: '拉利贝拉', portrait: '/assets/ETHIOPIANS/zhagewei_gebulei.png', eliteName: '埃塞卫兵', eliteTier: 4 },







    adal: { generalId: 'adal_ghazi', generalName: '格拉尼', cityId: 'city_zeila', portrait: '/assets/AFRICA/adal_gelani.png', eliteName: '阿达尔骑兵', eliteTier: 3 },







    malacca: { generalId: 'gen_parameswara', cityId: 'city_malacca', generalName: '拜里米苏拉', portrait: '/assets/MALAY/gen_parameswara.png', eliteName: '马来兵', eliteTier: 4 },







    sanfoqi: [







        { generalId: 'sanfoqi_dapunta', cityId: 'city_sanfoqi', generalName: '达本陀', portrait: '/assets/MALAY/sanfoqi_dapunta.png', eliteName: '马来兵', eliteTier: 4 },







        // 🔴 [2026-10-20 主人令「把剩下4位缺的敌将新建为据点武将」] 成名战敌将·名将双身份（立绘留空，走回落）







        { generalId: 'gen_sangrama_vijayottungavarman', cityId: 'city_sanfoqi', generalName: '桑格拉玛', portrait: '/assets/MALAY/gen_sangrama_vijayottungavarman.png', legionName: '封建时代三佛齐军团' , eliteName: '三佛齐水军', eliteTier: 3},







    ],







    medang: { generalId: 'gen_panangkaran', cityId: 'city_kalasan', generalName: '帕南卡兰', portrait: '/assets/MALAY/gen_panangkaran.png', eliteName: '马来兵', eliteTier: 4 },







    ternate: { generalId: 'ternate_babula', cityId: 'city_deernate', generalName: '巴布拉', portrait: '/assets/MALAY/ternate_babula.png', eliteName: '马来兵', eliteTier: 4 },







    sulu: [







        { generalId: 'sulu_paduka', cityId: 'city_huoluo', generalName: '巴杜卡', portrait: '/assets/MALAY/sulu_paduka.png', eliteName: '马来兵', eliteTier: 4 },







    ],







    // 🔴 [2026-10-20 主人令「先确定马尼拉什么建筑风格，再确定据点放什么相同风格的武将」] 马尼拉改判 MALAY ⇒ 挂马来文化的拉者苏莱曼三世（事发地＝马尼拉），仍挂本政权 maynila







    maynila: { generalId: 'bfe_rajah_sulayman', cityId: 'city_manila', legionName: '帝国时代马六甲军团', generalName: '拉者苏莱曼三世', portrait: '/assets/MALAY/bfe_rajah_sulayman.png' , eliteName: '马尼拉战团', eliteTier: 4},







    gurjara: [







        { generalId: 'gen_mihirabhoja', cityId: 'city_ajiemier', generalName: '迷企罗波阇', portrait: '/assets/GURJARAS/gen_mihirabhoja.png', eliteName: '瞿折罗兵', eliteTier: 4 },







        // 🔴 [2026-10-20 成名战规则] 瓦萨拉贾＝瞿折罗-普腊蒂哈腊王（790 争曲女城，曾破波罗军）→ 帕坦·瞿折罗；名将；立绘留空







        { generalId: 'gurjara_vatsaraja', cityId: 'city_qunvcheng', generalName: '瓦萨拉贾', portrait: '/assets/INDIA/gurjara_vatsaraja.png', eliteName: '瞿折罗战象', eliteTier: 3 },







        // 🔴 [2026-10-20 成名战规则] 那加巴塔二世＝瞿折罗王（820 大破波罗军）→ 帕坦·瞿折罗；名将；立绘留空







        { generalId: 'gurjara_nagabhata_ii', cityId: 'city_qunvcheng', generalName: '那加巴塔二世', portrait: '/assets/INDIA/gurjara_nagabhata_ii.png', eliteName: '瞿折罗战象', eliteTier: 3 },







        // 🔴 [2026-10-20 主人令「遇到问题先看符合历史，下结论再动手」] 成名战回补安置按史实复核：毗摩一世＝索兰基（Chaulukya）王，都阿尼尔瓦达＝今帕坦；索姆纳特只是 1026 年被劫之地 → 放帕坦（gurjara，风格 GURJARAS）；仍挂本政权 suomunate
        { generalId: 'suomunate_bhima_i', cityId: 'city_patan', factionId: 'suomunate', generalName: '毗摩一世', portrait: '/assets/GURJARAS/suomunate_bhima_i.png', eliteName: '瞿折罗兵', eliteTier: 4 },
    
        { generalId: 'chatigangren_wumeide', legionName: '帝国时代恒河军团', factionId: 'mowoer', cityId: 'city_jidagang', generalName: '乌梅德汗', portrait: '/assets/BENGALIS/chatigangren_wumeide.png', eliteName: '孟加拉兵', eliteTier: 4 },








        { generalId: 'gurjara_chand', factionId: 'gurjara', cityId: 'city_ajiemier', generalName: '昌德菩达一', portrait: '/assets/GURJARAS/gurjara_chand.png', eliteName: '宫廷文士', eliteTier: 4 },
        { generalId: 'gurjara_sanyogita', factionId: 'gurjara', cityId: 'city_ajiemier', generalName: '姗悦姬妲', portrait: '/assets/GURJARAS/gurjara_sanyogita.png', eliteName: '王后护卫', eliteTier: 4 },
    ],







    suomunate: [







        { generalId: 'suomunate_kumalapala', cityId: 'city_suomunate', generalName: '库马拉帕拉', portrait: '/assets/GURJARAS/suomunate_kumalapala.png', eliteName: '瞿折罗兵', eliteTier: 4 },














    ],







    sengjialuo: [







        { generalId: 'sengjialuo_dutugamo', cityId: 'city_anulade', generalName: '杜图伽摩尼', portrait: '/assets/PURU/sengjialuo_dutugamo.png', eliteName: '僧伽罗战象', eliteTier: 3 },







        // 🔴 [2026-10-20 成名战规则] 摩哂陀五世＝僧伽罗王（993 朱罗攻陷阿努拉德普拉，被俘）→ 阿努拉德·僧伽罗；普将；封建×普鲁＝封建时代沙希军团；立绘留空







        { generalId: 'sengjialuo_mahinda_v', cityId: 'city_anulade', generalName: '摩哂陀五世', portrait: '/assets/PURU/sengjialuo_mahinda_v.png', eliteName: '印度步兵', eliteTier: 4 },







    ],







    puxiangyindu: { generalId: 'puxiangyindu_albukeerke', cityId: 'city_guoa', generalName: '阿尔布克尔克', portrait: '/assets/PORTUGUESE/puxiangyindu_albukeerke.png', legionName: '帝国时代葡萄牙风琴军团', eliteName: '葡萄牙方阵', eliteTier: 3 },







    // 🔴 [2026-10-18 主人令] 建筑风格定武将：韦拉克鲁斯 SPANISH→西班牙将、哈瓦那 SPANISH→西班牙将、圣维森特 PORTUGUESE→葡萄牙将；新武将 portrait 留空，走文化池回落。







    tupinijin: [








        { generalId: 'gen_martim_afonso', cityId: 'city_saovicente', generalName: '马丁阿方索', portrait: '/assets/PORTUGUESE/tupinijin_madingafangsuo.png', factionId: 'putaoya', legionName: '帝国时代葡萄牙风琴军团', eliteName: '葡萄牙兵', eliteTier: 4 },
        { generalId: 'gen_tome_sousa', factionId: 'tupinijin', cityId: 'city_salvador', generalName: '托梅', portrait: '/assets/PORTUGUESE/gen_tome_sousa.png', eliteName: '葡萄牙兵', eliteTier: 4 },








    ],






    taino: [







        { generalId: 'gen_velazquez', cityId: 'city_havana', generalName: '贝拉斯克斯', portrait: '/assets/SPANISH/taino_beilasikesi.png' , legionName: '帝国时代西班牙征服军团', eliteName: '西班牙民兵', eliteTier: 4 },







    ],







    taino_d: [







        // 🔴 [2026-10-20 主人令「武将文化一定要符合建筑风格」] 哈土依＝泰诺人反抗领袖（1478–1512，古巴）→ 亚拉（TUPI 原住民风格）；文化 TUPI×帝国＝帝国时代塔莫约军团；立绘留空







        { generalId: 'gen_hatuey', cityId: 'city_yala', generalName: '哈土依', portrait: '/assets/TUPI/gen_hatuey.png', legionName: '帝国时代塔莫约军团', eliteName: '图皮战士', eliteTier: 4 },







    ],







    guanche: { generalId: 'gen_bentejui', cityId: 'city_telde', generalName: '本特胡伊', portrait: '/assets/AFRICA/gen_bentejui.png', eliteName: '柏柏尔骑手', eliteTier: 4 },







    // 🔴 [2026-10-13 主人令「添加一个据点，关岛」] 阿加尼亚·查莫罗：1671 年反抗西班牙的查莫罗领袖（英文维基 Hurao 条目）







    chamorro: { generalId: 'gen_hurao', cityId: 'city_hagatna', generalName: '胡劳', portrait: '/assets/MALAY/gen_hurao.png', eliteName: '马来兵', eliteTier: 4 },







    fodejiao: { generalId: 'gen_noli', cityId: 'city_ribeira', generalName: '诺利', portrait: '/assets/PORTUGUESE/gen_noli.png', eliteName: '葡萄牙兵', eliteTier: 4 },






    yasuer: { generalId: 'gen_cipriano_figueiredo', cityId: 'city_angra', generalName: '西普里亚诺', portrait: '/assets/PORTUGUESE/gen_cipriano_figueiredo.png' , legionName: '帝国时代葡萄牙风琴军团', eliteName: '葡萄牙兵', eliteTier: 4 },







    liaozu: { generalId: 'liaozu_saitatila', cityId: 'city_wanxiang', generalName: '赛塔提腊', portrait: '/assets/KHMER/liaozu_saitatila.png', eliteName: '高棉步兵', eliteTier: 4 },







    kushi: { generalId: 'kushi_amanilunnasi', generalName: '阿玛尼伦纳斯', cityId: 'city_mailuoe', portrait: '/assets/AFRICA/kushi_amanilunnasi.png', eliteName: '埃塞卫兵', eliteTier: 4 },







    aimala: { generalId: 'aimala_katali', cityId: 'city_diyawanake', generalName: '卡塔里', portrait: '/assets/INCA/aimala_katali.png', eliteName: '印加民兵', eliteTier: 4 },







    aolisha: { generalId: 'aolisha_anatabamo', cityId: 'city_puli', generalName: '阿纳塔跋摩', portrait: '/assets/INDIA/aolisha_anatabamo.png', eliteName: '印度步兵', eliteTier: 4 },







    kanata: [
        { generalId: 'kanata_lamalaya', cityId: 'city_hengbi', generalName: '拉玛拉亚', portrait: '/assets/INDIA/kanata_lamalaya.png', eliteName: '印度步兵', eliteTier: 4 },
        { generalId: 'kanata_amoghavarsha', factionId: 'kanata', cityId: 'city_hengbi', generalName: '阿目佉跋沙', portrait: '/assets/INDIA/kanata_amoghavarsha.png', eliteName: '德干象兵', eliteTier: 3 },
    ],







    adile: [
        { generalId: 'adile_adilesha', cityId: 'city_bijiabuer', generalName: '阿迪勒沙', portrait: '/assets/INDIA/adile_adilesha.png', eliteName: '印度步兵', eliteTier: 4 },
        { generalId: 'bfe_rasul_khan', cityId: 'city_bijiabuer', generalName: '拉苏尔汗', portrait: '/assets/PORTUGUESE/bfe_rasul_khan.png', eliteName: '印度步兵', eliteTier: 4 },
    ],







    foluolida: { generalId: 'foluolida_meinendeshi', cityId: 'city_shengaogusiding', generalName: '梅嫩德斯', portrait: '/assets/SPANISH/foluolida_meinendeshi.png' , legionName: '帝国时代西班牙征服军团', eliteName: '西班牙方阵', eliteTier: 2 },






    yilisi: [







        { generalId: 'yilisi_yifeituosi', cityId: 'city_aolinpiya', generalName: '伊菲托斯', portrait: '/assets/GREECE/yilisi_yifeituosi.png', eliteName: '希腊步兵', eliteTier: 4 },







        // 🔴 [2026-10-20 主人令「这些据点违规了……请删除。据点中有武将的话，请放到相同风格的临近据点」] 原据点 city_pisatis 已删 → 迁奥林匹亚（同建筑风格最近），仍挂本政权 pisa







        { generalId: 'bfe_pisa_king', cityId: 'city_aolinpiya', generalName: '潘塔琉斯', portrait: '/assets/GREECE/bfe_pisa_king.png' , legionName: '古典时代赫拉斯军团', eliteName: '皮萨骑兵', eliteTier: 4},







    ],







    nuowei: [
        { generalId: 'nuowei_halaer', cityId: 'city_boergong', generalName: '哈拉尔', portrait: '/assets/VIKINGS/nuowei_halaer.png', eliteName: '北欧民兵', eliteTier: 4 },
        { generalId: 'nuowei_hardrada', factionId: 'nuowei', cityId: 'city_boergong', generalName: '哈拉尔哈德拉达', portrait: '/assets/VIKINGS/nuowei_hardrada.png', eliteName: '瓦兰吉卫队', eliteTier: 1 },
        { generalId: 'nuowei_erikred', factionId: 'nuowei', cityId: 'city_boergong', generalName: '红胡子艾里克', portrait: '/assets/VIKINGS/nuowei_erikred.png', eliteName: '冰岛殖民队', eliteTier: 4 },
        { generalId: 'nuowei_hrolf', factionId: 'nuowei', cityId: 'city_boergong', generalName: '首领罗夫', portrait: '/assets/VIKINGS/nuowei_hrolf.png', eliteName: '诺曼突袭队', eliteTier: 3 },
        { generalId: 'nuowei_ulf', factionId: 'nuowei', cityId: 'city_boergong', generalName: '乌尔夫', portrait: '/assets/VIKINGS/nuowei_ulf.png', eliteName: '近卫斧兵', eliteTier: 4 },
        { generalId: 'nuowei_halldor', factionId: 'nuowei', cityId: 'city_boergong', generalName: '哈尔多尔', portrait: '/assets/VIKINGS/nuowei_halldor.png', eliteName: '近卫斧兵', eliteTier: 4 },
        { generalId: 'nuowei_kalf', factionId: 'nuowei', cityId: 'city_boergong', generalName: '卡尔夫', portrait: '/assets/VIKINGS/nuowei_kalf.png', eliteName: '挪威民兵', eliteTier: 4 },
        { generalId: 'nuowei_finn', factionId: 'nuowei', cityId: 'city_boergong', generalName: '芬恩', portrait: '/assets/VIKINGS/nuowei_finn.png', eliteName: '挪威民兵', eliteTier: 4 },
        { generalId: 'nuowei_einar', factionId: 'nuowei', cityId: 'city_boergong', generalName: '神射手埃纳尔', portrait: '/assets/VIKINGS/nuowei_einar.png', eliteName: '维京弓手', eliteTier: 4 },
    ],







    keernuwaye: { generalId: 'keernuwaye_geladelong', cityId: 'city_kanpeier', generalName: '格拉德隆', portrait: '/assets/BRITONS/keernuwaye_geladelong.png', eliteName: '英格兰民兵', eliteTier: 4 },













    wuer: [







        { generalId: 'wuer_boshasha', factionId: 'jialedi', cityId: 'city_wuer', generalName: '伯沙撒', portrait: '/assets/ORIE/wuer_boshasha.png', eliteName: '阿拉伯步兵', eliteTier: 4 },







        { generalId: 'wuer_wuernamu', cityId: 'city_wuer', generalName: '乌尔纳姆', portrait: '/assets/ORIE/wuer_wuernamu.png', eliteName: '阿拉伯步兵', eliteTier: 4 },







    ],












    muwaxide: [
        { generalId: 'muwaxide_yakubu', cityId: 'city_labate', generalName: '雅库布曼苏尔', portrait: '/assets/BERBER/muwaxide_yakubu.png', eliteName: '柏柏尔轻骑', eliteTier: 3 },
        { generalId: 'muwaxide_axatafu', factionId: 'muwaxide', cityId: 'city_labate', generalName: '阿夏塔夫', portrait: '/assets/SPANISH/muwaxide_axatafu.png', eliteName: '柏柏尔骑手', eliteTier: 4 },   // 🔴 [2026-10-25 按史] 塞维利亚守王，穆瓦希德宗室之子，1248 城破降卡斯蒂利亚（西语编年史 Axataf, hijo del príncipe almohade Abu Alí）
    ],






    yilaka: { generalId: 'yilaka_tundama', cityId: 'city_suojiamosuo', generalName: '通达马', portrait: '/assets/MUISCA/yilaka_tundama.png', eliteName: '穆伊斯卡兵', eliteTier: 4 },







    xingelana: [








        { generalId: 'xingelana_dawila', cityId: 'city_banama', generalName: '达维拉', portrait: '/assets/SPANISH/xingelana_dawila.png' , legionName: '帝国时代西班牙征服军团', eliteName: '西班牙民兵', eliteTier: 4 },
        { generalId: 'jialebi_brasilesuo', factionId: 'xingelana', cityId: 'city_katachena', generalName: '布拉斯莱索', portrait: '/assets/SPANISH/jialebi_brasilesuo.png', eliteName: '征服者骑', eliteTier: 3 },








    ],






    // 🔴 [2026-10-24 按史] 尼古拉斯＝Nicolás Ñeenguirú，Concepción（伊比蒂拉库阿，今阿根廷 Concepción de la Sierra）
    //    耶稣会传教区大酋长、1641 姆博罗雷守方统帅（生卒无载，活动可考 1639–1641）。游戏无 Concepción 据点，
    //    按「离事发地最近的同文化据点」取伊瓜苏（TUPI，约 231 km）——伊瓜苏不是他镇守过的城。
    gualani: { generalId: 'gualani_nicolas', cityId: 'city_yiguasu', generalName: '尼古拉斯', portrait: '/assets/TUPI/gualani_nicolas.png', eliteName: '图皮战团', eliteTier: 3 },






    bulu: { generalId: 'gen_bolusi', cityId: 'city_meng', generalName: '波鲁斯', portrait: '/assets/PURU/gen_bolusi.png', eliteName: '旁遮普兵', eliteTier: 4 },






    // 🔴 推罗·阿泽米尔库斯（Azemilcus，推罗末代国王，公元前332年守岛城）。显示名限 ≤5 字 → 「阿泽米尔」。







    //    portrait 留空 = 走文化池回落（见本文件既有约定），**立绘由主人放图后填，AI 不指定**。







    kanan: { generalId: 'kanan_azemier', cityId: 'city_tuile', generalName: '阿泽米尔', portrait: '/assets/ORIE/kanan_azemier.png', eliteName: '阿拉伯步兵', eliteTier: 4 },







    // 🔴 加沙·巴提斯（Batis，史载波斯任命的加沙守将，围城中力竭被俘遭处决）。portrait 留空＝走文化池回落，立绘由主人放图







    feilisidin: [
        { generalId: 'feilisidin_batisi', cityId: 'city_jiasa', generalName: '巴提斯', portrait: '/assets/ORIE/feilisidin_batisi.png', eliteName: '阿拉伯步兵', eliteTier: 4 },
        { generalId: 'bfe_achish', cityId: 'city_jiasa', generalName: '亚吉', portrait: '/assets/ORIE/bfe_achish.png', legionName: '古典时代近东军团', eliteName: '阿拉伯步兵', eliteTier: 4 },
        { generalId: 'feilisidin_geliya', factionId: 'feilisidin', cityId: 'city_jiasa', generalName: '歌利亚', portrait: '/assets/ORIE/feilisidin_geliya.png', eliteName: '非利士枪兵', eliteTier: 4 },   // 2026-10-25 按史补：非利士迦特猛将，大卫以拉谷之战对手
    ],







    mallabhum: { generalId: 'gen_bir_hambir', cityId: 'city_bishnupur', generalName: '比尔汉比尔', portrait: '/assets/BENGALIS/gen_bir_hambir.png', eliteName: '孟加拉兵', eliteTier: 4 },







    vidin_tsardom: { generalId: 'gen_ivan_sratsimir', cityId: 'city_baba_vida', generalName: '伊凡斯拉齐', portrait: '/assets/BULGARIANS/gen_ivan_sratsimir.png', eliteName: '保加利亚兵', eliteTier: 4 },






    samtskhe: { generalId: 'gen_sargis_jaqeli', cityId: 'city_akhaltsikhe', generalName: '萨尔吉斯', portrait: '/assets/GEORGIANS/gen_sargis_jaqeli.png', eliteName: '格鲁吉亚兵', eliteTier: 4 },







    tomara_gwalior: { generalId: 'gen_man_singh_tomar', cityId: 'city_gwalior_fort', generalName: '曼辛格', portrait: '/assets/MUGHAL/gen_man_singh_tomar.png', eliteName: '印度斯坦兵', eliteTier: 4 },






    qutb_shahi: { generalId: 'gen_ibrahim_qutb', cityId: 'city_golconda', generalName: '易卜拉欣', portrait: '/assets/INDIA/gen_ibrahim_qutb.png', eliteName: '印度步兵', eliteTier: 4 },







    minangkabau: { generalId: 'gen_adityawarman', cityId: 'city_pagaruyung', generalName: '阿迪蒂亚', portrait: '/assets/MALAY/gen_adityawarman.png', eliteName: '马来兵', eliteTier: 4 },







    tutul_xiu: { generalId: 'gen_chan_chak', cityId: 'city_uxmal', generalName: '查克王', portrait: '/assets/MAYANS/gen_chan_chak.png', eliteName: '玛雅战士', eliteTier: 4 },






    odrysian_late: { generalId: 'gen_seuthes_iii', cityId: 'city_seuthopolis', generalName: '塞乌特斯三世', portrait: '/assets/THRACIAN/gen_seuthes_iii.png', eliteName: '色雷斯兵', eliteTier: 4 },







    // ⚠️ [2026-09-11] 卡洛扬**立绘待主人提供**：立绘归主人专属，AI 依铁律不得新增/分配/代配，







    //    故此处 portrait 留空串（`resolveGeneralPortraitPath('')` 有兜底，不会崩）。请主人补图后回填路径。






    sijitai: [







        { generalId: 'sijitai_ateas', cityId: 'city_asu', generalName: '阿泰阿斯', portrait: '/assets/GREECE/sijitai_ateas.png', eliteName: '斯基泰骑兵', eliteTier: 3 },







        // 公元前329年锡尔河战役斯基泰骑兵领袖，立绘按铁律留空走回落、待主人亲自放图分配







        { generalId: 'sijitai_satraces', cityId: 'city_asu', generalName: '萨特拉克斯', portrait: '/assets/GREECE/sijitai_satraces.png', eliteName: '希腊步兵', eliteTier: 4 },







    ],






    // 🔴 [2026-10-20 主人令「按历史来，该是什么势力就是什么势力」] 博尼法提乌斯＝西罗马阿非利加守将；







    //    西罗马是罗马帝国西半（395 分治），同属罗马 → 挂罗马帝国（与埃提乌斯、霍诺留同国）






    // 公元前327年马萨加战役守帅（阿萨卡诺伊/阿斯瓦卡女王克莱奥菲斯），立绘按铁律留空走回落、待主人亲自放图分配







    aswaka: { generalId: 'aswaka_cleophis', cityId: 'city_masaga', generalName: '克莱奥菲斯', portrait: '/assets/PURU/aswaka_cleophis.png', eliteName: '旁遮普兵', eliteTier: 4 },







    // 公元前326年奥诺斯岩围城战守帅（史料未载守将姓名 → 按「地名＋首领」记，与马利首领、科塞亚首领同一记法）；







    //    立绘按铁律留空走保底图，等主人亲自放图






    // 公元前329年居鲁士城围攻守帅（史料未载守将姓名 → 按「地名＋首领」记，与马利首领、奥诺斯首领同一记法）；







    //    立绘按铁律留空走保底图，等主人亲自放图







    julushi: { generalId: 'julushi_catanes', cityId: 'city_julushicheng', generalName: '卡塔涅斯', portrait: '/assets/CENTRAL_ASIA/julushi_kataniesi.png', eliteName: '河中骑兵', eliteTier: 4 },







    // 公元前325年马里斯战役守帅（马利/摩罗婆同盟首领），立绘按铁律留空走回落、待主人亲自放图分配







    malli: { generalId: 'malli_malavapala', cityId: 'city_malisi', generalName: '摩罗波罗', portrait: '/assets/PURU/malli_malavapala.png', eliteName: '旁遮普兵', eliteTier: 4 },







    // 🔴 [2026-10-20 主人令「每个武将都要给安置据点」] 原「科塞亚」「乌克西亚」两个无城战役势力已删：







    //    卡什提利亚什 → 米底（哈马丹）、马达泰斯 → 埃兰（苏萨），条目在各自城势力下（带 eliteName 保住原精锐番号）。







    // 🔴 [2026-09-25 主人批准新建佩利昂] 公元前335年佩利昂围城战守帅（伊利里亚王克莱图斯，巴尔迪利斯之子；







    //    英文维基 Siege of Pelium 信息框 commander2 = Kleitos, Glaukias），立绘按铁律留空走回落、待主人亲自放图分配







    dasaleiti: { generalId: 'dasaleiti_kleitos', cityId: 'city_peiliang', generalName: '克莱图斯', portrait: '/assets/THRACIAN/dasaleiti_kleitos.png', eliteName: '色雷斯兵', eliteTier: 4 },






    kapaduoxiya: { generalId: 'kapaduoxiya_sabiktas', cityId: 'city_tiyana', generalName: '萨比克塔斯', portrait: '/assets/ORIE/kapaduoxiya_sabiktas.png', eliteName: '阿拉伯步兵', eliteTier: 4 },






    emesene: { generalId: 'emesene_xierkuhe', cityId: 'city_emesa', generalName: '希尔库赫', portrait: '/assets/ORIE/emesene_xierkuhe.png', eliteName: '埃梅塞尼骑', eliteTier: 3 },   // 🔴 [2026-10-04 建埃梅萨] 希尔库赫 Asad ad-Din Shirkuh（萨拉丁之叔、霍姆斯长官、三征埃及）。⚠️ 立绘文件尚未存在，待主人补























    sute: { generalId: 'sute_spitamenes', cityId: 'city_nuotaka', generalName: '斯皮塔米尼斯', portrait: '/assets/CENTRAL_ASIA/sute_sipitaminisi.png', eliteName: '粟特骑兵', eliteTier: 3 },   // 诺塔卡守将（史料：在诺塔卡把贝苏斯交给托勒密，阿里安 IV.1）






    aolitai: { generalId: 'aolitai_shouling', cityId: 'city_lanbaqiya', generalName: '拉托尼斯', portrait: '/assets/INDIA/aolitai_latuonisi.png', eliteName: '旁遮普兵', eliteTier: 4 },   // 兰巴基亚（奥里泰人首领）







    shiyuzu: { generalId: 'shiyuzu_aolaqiuzhang', cityId: 'city_aola', generalName: '阿波罗多洛斯', portrait: '/assets/INDIA/shiyuzu_aboluoduoluosi.png', eliteName: '旁遮普兵', eliteTier: 4 },  // 奥拉（格德罗西亚边缘防区希腊裔长官）






    // 🔴 [2026-09-19 主人令「都给我删了」] `kapaduoxiya`（卡帕多细亚）与其主帅欧迈尼斯的记录已删除 ——







    //    该势力是前321「赫勒斯滂战役」的产物，而那一仗已被主人令全删，势力成了没有任何战役在用的孤儿。,






    // ── 🔴 [2026-10-20 主人令「看武将，以武将来定义势力」] 起义占位成名战改挂真实政权：敌将落为本势力据点武将（立绘留空） ──







    dalriada: [








        { generalId: 'bfe_dalriada_king', cityId: 'city_dunadd', generalName: '费尔古斯', portrait: '/assets/CELTS/bfe_dalriada_king.png' , legionName: '封建时代爱尔兰军团', eliteName: '盖尔战团', eliteTier: 4},
        { generalId: 'gen_domhnall', factionId: 'dalriada', cityId: 'city_dublin', generalName: '多姆纳尔', portrait: '/assets/CELTS/gen_domhnall.png', eliteName: '凯尔特兵', eliteTier: 4 },
        { generalId: 'gaer_sigtrygg', factionId: 'dublin', cityId: 'city_dublin', generalName: '西格特里格', portrait: '/assets/CELTS/gaer_sigtrygg.png', eliteName: '凯尔特兵', eliteTier: 4 },   // 🔴 [2026-10-28 主人批立] 西格特里格＝都柏林北欧王（1014 克朗塔夫守方）；势力按其历史政权「都柏林王国」（主人定：武将历史是哪个政权就是哪个势力）；共青团多姆纳尔仍留达尔里阿达








    ],







    scotland: [
        // 🔴 [2026-10-25 主人令「存在就建」] 邓迪子爵 格雷厄姆（Bonnie Dundee，1648–1689，詹姆斯党高地起义领袖，1689 基利克兰基以少胜多、本人阵亡）｜势力 苏格兰｜据点 因弗内斯（高地起兵/集结）｜名将｜精锐「高地战团」T2｜立绘留空
        { generalId: 'scotland_johngraham', factionId: 'scotland', cityId: 'city_yinfeineisi', generalName: '格雷厄姆', portrait: '/assets/CELTS/scotland_johngraham.png', eliteName: '高地战团', eliteTier: 2 },
        // 🔴 [2026-10-25] 麦凯（1640–1692，苏格兰政府军司令；基利克兰基 1689 为邓迪之敌；史实内战、同属苏格兰势力）｜据点 爱丁堡（政府军基地）｜普将｜精锐「龙骑兵团」T4｜立绘留空
        { generalId: 'scotland_hughmackay', factionId: 'scotland', cityId: 'city_aidingbao', generalName: '麦凯', portrait: '/assets/CELTS/scotland_hughmackay.png', eliteName: '龙骑兵团', eliteTier: 4 },








        { generalId: 'gen_john_comyn', cityId: 'city_scone', generalName: '科明', portrait: '/assets/CELTS/gen_john_comyn.png' , legionName: '城堡时代盖尔军团', eliteName: '苏格兰枪兵', eliteTier: 4},
        { generalId: 'gen_william_wallace', factionId: 'scotland', cityId: 'city_carlisle', generalName: '威廉华莱士', portrait: '/assets/CELTS/gen_william_wallace.png', eliteName: '苏格兰长矛', eliteTier: 1 },








    ],







    chanka: { generalId: 'bfe_chanca_chief', cityId: 'city_andahuaylas', generalName: '阿斯塔瓦兰卡', portrait: '/assets/INCA/bfe_chanca_chief.png' , legionName: '城堡时代印加军团', eliteName: '昌卡战团', eliteTier: 4},







    ouchi: { generalId: 'bfe_sue_harutaka', cityId: 'city_yamaguchi', generalName: '陶晴贤', portrait: '/assets/JAPAN/bfe_sue_harutaka.png' , legionName: '帝国时代武家军团', eliteName: '大内水军', eliteTier: 3},














    gujarat: { generalId: 'bfe_muzaffar_shah', cityId: 'city_ahmedabad', generalName: '穆扎法尔三世', portrait: '/assets/GURJARAS/bfe_muzaffar_shah.png' , legionName: '帝国时代古吉拉特军团', eliteName: '古吉拉特骑', eliteTier: 3},














    voc: { generalId: 'bfe_coyett', cityId: 'city_tainan', generalName: '揆一', portrait: '/assets/JIANGNAN/bfe_coyett.png' , legionName: '帝国时代两江军团', eliteName: '荷兰守备', eliteTier: 4},







    kosala: { generalId: 'bfe_prasenajit', cityId: 'city_sheweicheng', generalName: '波斯匿', portrait: '/assets/INDIA/bfe_prasenajit.png' , eliteName: '拘萨罗象兵', eliteTier: 3},







    kalinga: { generalId: 'bfe_kalinga_king', cityId: 'city_danta', generalName: '婆摩', portrait: '/assets/INDIA/bfe_kalinga_king.png' , legionName: '古典时代泰米尔军团', eliteName: '羯陵伽象兵', eliteTier: 3},







    anga: { generalId: 'bfe_anga_king', cityId: 'city_zhanbo', generalName: '达摩婆罗', portrait: '/assets/PURU/bfe_anga_king.png' , eliteName: '鸯伽弓手', eliteTier: 4},







    shunga: [
        { generalId: 'bfe_pushyamitra', cityId: 'city_huashicheng', generalName: '普沙密多罗', portrait: '/assets/PURU/bfe_pushyamitra.png' , eliteName: '巽伽卫军', eliteTier: 3},
        { generalId: 'bfe3_27', cityId: 'city_huashicheng', generalName: '婆苏密多罗', portrait: '/assets/PURU/bfe3_27.png', eliteName: '印度斯坦兵', eliteTier: 4 },
    
        { generalId: 'sumo_sumowang', legionName: '古典时代高陀军团', factionId: 'shunga', cityId: 'city_danmoledi', generalName: '苏摩', portrait: '/assets/BENGALIS/sumo_sumowang.png', eliteName: '孟加拉兵', eliteTier: 4 },








    








    ],







    antigonid: { generalId: 'bfe_antigonus', cityId: 'city_kailaina', generalName: '安提柯一世', portrait: '/assets/MACEDONIAN/bfe_antigonus.png' , legionName: '古典时代马其顿军团', eliteName: '伙伴骑兵', eliteTier: 1 },







    // 🔴 [2026-10-20 主人批准] 驻地型新增：保定（张柔）/嘉峪关（冯胜）/常德（钟相）/延恩（苏建）/格拉尼库斯（阿萨米斯）/沙陀（朱邪赤心）
    shatuo: [
        // 🔴 [2026-10-24] 朱邪势力并入沙陀后，把原势力精锐番号「朱邪部兵」T3 落到本人条目（他 820 年生，早于李克用「鸦儿军」，不该借沙陀势力精锐）
        { generalId: 'zhuxie_zhuxiechixin', cityId: 'city_guanglu', generalName: '朱邪赤心', portrait: '/assets/XIANBEI/zhuxie_zhuxiechixin.png', legionName: '封建时代漠南军团', eliteName: '朱邪部兵', eliteTier: 3 },
    
        { generalId: 'yingzhou_d2_licunxu', factionId: 'shatuo', cityId: 'city_zhangguojuncheng', generalName: '李存勖', portrait: '/assets/WEI/yingzhou_d2_licunxu.png', eliteName: '河东铁骑', eliteTier: 2 },

    ],
    hou_han: [
        { generalId: 'houhan_lishouzhen', factionId: 'hou_han', cityId: 'city_tongguan', generalName: '李守贞', portrait: '/assets/CENTRAL/houhan_lishouzhen.png', eliteName: '中原郡兵', eliteTier: 4 },   // 🔴 [2026-10-25 按史] 成名战敌将；后汉叛将；948-949 为后汉内战，双方同属后汉，块内敌势力记 hou_han；据点潼关（CENTRAL，距河中 35km）；用势力精锐河东牙兵
    ],
    yuan_shao: [
        { generalId: 'qu_d_quyi', factionId: 'yuan_shao', cityId: 'city_daming', generalName: '麴义', portrait: '/assets/CENTRAL/qu_d_quyi.png', eliteName: '先登营', eliteTier: 2 },

    ],
    hou_jin: [
        { generalId: 'dai_d_shijingtang', factionId: 'hou_jin', cityId: 'city_taiyuan', generalName: '石敬瑭', portrait: '/assets/WEI/dai_d_shijingtang.png', eliteName: '河朔骑兵', eliteTier: 4 },

    ],
    hou_zhao: [
        { generalId: 'bfe3_85', factionId: 'hou_zhao', cityId: 'city_xingtai', generalName: '石琨', portrait: '/assets/WEI/bfe3_85.png', legionName: '古典时代太行军团', eliteName: '河朔骑兵', eliteTier: 4 },
        { generalId: 'shizhao_d_shihu', factionId: 'hou_zhao', cityId: 'city_xingtai', generalName: '石虎', portrait: '/assets/WEI/shizhao_d_shihu.png', eliteName: '后赵铁骑', eliteTier: 2 },

        { generalId: 'bfe_zhanghedu', factionId: 'hou_zhao', cityId: 'city_xingtai', generalName: '张贺度', portrait: '/assets/WEI/bfe_zhanghedu.png', eliteName: '襄国甲骑', eliteTier: 3 },
        { generalId: 'bfe_taobao', factionId: 'hou_zhao', cityId: 'city_xingtai', generalName: '桃豹', portrait: '/assets/WEI/bfe_taobao.png', eliteName: '后赵突骑', eliteTier: 3 },
    ],
    da_yan: [
        { generalId: 'dayan_cuiqianyou', factionId: 'da_yan', cityId: 'city_luoyang', generalName: '崔乾祐', portrait: '/assets/CENTRAL/dayan_cuiqianyou.png', eliteName: '中原郡兵', eliteTier: 4 },   // 🔴 [2026-10-25 按史] 成名战敌将；安禄山旧将，756 灵宝西原设伏破唐军；据点洛阳（CENTRAL，大燕国都）；用势力精锐曳落河
        { generalId: 'bfe_yin_ziqi', factionId: 'da_yan', cityId: 'city_fanyang', generalName: '尹子奇', portrait: '/assets/WEI/bfe_yin_ziqi.png', legionName: '封建时代河朔军团', eliteName: '河朔骑兵', eliteTier: 4 },
        { generalId: 'zhuozhou_anlushan', factionId: 'da_yan', cityId: 'city_fanyang', generalName: '安禄山', portrait: '/assets/WEI/zhuozhou_anlushan.png', eliteName: '范阳铁骑', eliteTier: 2 },
        { generalId: 'zhuozhou_shisiming', factionId: 'da_yan', cityId: 'city_fanyang', generalName: '史思明', portrait: '/assets/WEI/zhuozhou_shisiming.png', eliteName: '范阳铁骑', eliteTier: 2 },

        { generalId: 'bfe_murongbao', factionId: 'da_yan', cityId: 'city_zhongshan', generalName: '慕容宝', portrait: '/assets/WEI/bfe_murongbao.png', eliteName: '中山铁骑', eliteTier: 3 },
    ],
    hou_liang: [
        { generalId: 'dizhou_wangyanzhang', factionId: 'hou_liang', cityId: 'city_qufu', legionName: '封建时代中原军团', generalName: '王彦章', portrait: '/assets/WEI/dizhou_wangyanzhang.png', eliteName: '中原郡兵', eliteTier: 4 },

    
        { generalId: 'dang_d_zhuwen', factionId: 'hou_liang', cityId: 'city_bianliang', generalName: '朱温', portrait: '/assets/CENTRAL/dang_d_zhuwen.png', eliteName: '宣武军', eliteTier: 3 },
        { generalId: 'dang_d_pangshigu', factionId: 'hou_liang', cityId: 'city_bianliang', generalName: '庞师古', portrait: '/assets/CENTRAL/dang_d_pangshigu.png', eliteName: '中原郡兵', eliteTier: 4 },
        { generalId: 'liang_d_zhuyouning', factionId: 'hou_liang', cityId: 'city_bianliang', generalName: '朱友宁', eliteName: '宣武牙兵', eliteTier: 3, portrait: '/assets/CENTRAL/liang_d_zhuyouning.png' },   // 🔴 [2026-10-26 按史] 朱温从子、领所部宗兵守汴州，无厅子都专属依据；厅子都归朱温（《旧五代史·宗室传》）

    ],
    han_zhao: [
        { generalId: 'shizhou_liucong', factionId: 'han_zhao', cityId: 'city_linfen', legionName: '古典时代华夏军团', generalName: '刘聪', portrait: '/assets/WEI/shizhou_liucong.png', eliteName: '中原郡兵', eliteTier: 4 },

    
        { generalId: 'yao_liuyuan', factionId: 'han_zhao', cityId: 'city_linfen', legionName: '古典时代华夏军团', generalName: '刘渊', portrait: '/assets/CENTRAL/yao_liuyuan.png', eliteName: '中原郡兵', eliteTier: 4 },

        { generalId: 'han_zhao_liuyao', factionId: 'han_zhao', cityId: 'city_lishi', generalName: '刘曜', portrait: '/assets/WEI/han_zhao_liuyao.png', eliteName: '匈奴骑兵', eliteTier: 3 },   // 刘渊族子，304 年随起兵于离石，后为前赵皇帝（居住离石）
    ],
    dongjin: [
        { generalId: 'zhong_xiexuan', factionId: 'dongjin', cityId: 'city_shouxian', legionName: '古典时代华夏军团', generalName: '谢玄', portrait: '/assets/CENTRAL/zhong_xiexuan.png', eliteName: '北府兵', eliteTier: 0 },

    
        { generalId: 'yuzhou_zuti', factionId: 'dongjin', cityId: 'city_yongqiu', legionName: '古典时代华夏军团', generalName: '祖逖', portrait: '/assets/CENTRAL/yuzhou_zuti.png', eliteName: '北伐军', eliteTier: 3 },

    
        { generalId: 'danyang_huanwen', factionId: 'dongjin', cityId: 'city_jiuzi', generalName: '桓温', portrait: '/assets/JIANGNAN/danyang_huanwen.png', eliteName: '桓家北伐', eliteTier: 3 },

        { generalId: 'bfe3_13', factionId: 'chuguo', cityId: 'city_shouxian', generalName: '项燕', portrait: '/assets/JIANGNAN/bfe3_13.png', legionName: '古典时代华夏军团' , eliteName: '楚甲士', eliteTier: 2},
        { generalId: 'yuan_d_manzihaiya', factionId: 'yuan_d', cityId: 'city_shangdu', generalName: '蛮子海牙', portrait: '/assets/XIANBEI/yuan_d_manzihaiya.png', eliteName: '漠南骑手', eliteTier: 4 },
    ],
    nan_liang: [
        { generalId: 'xiao_d_xiaoyan', factionId: 'nan_liang', cityId: 'city_xiangyang', legionName: '封建时代中原军团', generalName: '萧衍', portrait: '/assets/CENTRAL/xiao_d_xiaoyan.png', eliteName: '南齐锐卒', eliteTier: 3 },

    
        { generalId: 'zhengzhou_chenqingzhi', factionId: 'nan_liang', cityId: 'city_nanjing', legionName: '封建时代江淮军团', generalName: '陈庆之', portrait: '/assets/CENTRAL/zhengzhou_chenqingzhi.png', eliteName: '白袍军', eliteTier: 1 },

    ],
    hou_qin: [

        { generalId: 'xianlingqiang_dianling', factionId: 'xianlingqiang', cityId: 'city_dafeichuan', generalName: '滇零', portrait: '/assets/KHITAN/xianlingqiang_dianling.png', eliteName: '吐蕃骑兵', eliteTier: 4 },
    ],
    yiqu: [
        { generalId: 'quanrong_yiquhai', factionId: 'yiqu', cityId: 'city_weirong', generalName: '义渠骇', portrait: '/assets/CENTRAL/quanrong_yiquhai.png', eliteName: '中原郡兵', eliteTier: 4 },

    ],
    hou_zhou: [
        { generalId: 'chanzhou_chairong', factionId: 'hou_zhou', cityId: 'city_puyang', generalName: '柴荣', portrait: '/assets/CENTRAL/chanzhou_chairong.png', eliteName: '殿前诸班', eliteTier: 2 },

    ],
    lvbu: [
        { generalId: 'pizhou_lvbu', factionId: 'lvbu', cityId: 'city_xiapi', generalName: '吕布', portrait: '/assets/CENTRAL/pizhou_lvbu.png', eliteName: '中原郡兵', eliteTier: 4 },

    ],
    chengjia: [
        { generalId: 'kui_gongsunshu', eliteName: '白帝舟师', eliteTier: 3, factionId: 'chengjia', cityId: 'city_baidicheng2', generalName: '公孙述', portrait: '/assets/BASHU/kui_gongsunshu.png' },

    ],
    qianshu: [
        { generalId: 'zizhou_wangjian', eliteName: '龙武军', eliteTier: 2, factionId: 'qianshu', cityId: 'city_chengdu', generalName: '王建', portrait: '/assets/BASHU/zizhou_wangjian.png' },

    ],
    chuguo: [
        { generalId: 'yong_lujili', factionId: 'chuguo', cityId: 'city_shangyong', generalName: '庐戢黎', portrait: '/assets/CENTRAL/yong_lujili.png' , legionName: '先秦军团', eliteName: '荆楚兵', eliteTier: 4 },

    
        { generalId: 'chu_guanyu', factionId: 'shu', cityId: 'city_ying', legionName: '古典时代荆楚军团', generalName: '关羽', portrait: '/assets/JIANGNAN/chu_guanyu.png', eliteName: '荆州水军', eliteTier: 3 },   // 🔴 [2026-10-28 按史] 关羽为刘备董督荆州事，治所江陵（长期镇守）；当阳＝被擒之地（不算据点据）。江陵＝HUGUANG，军团同那格「古典时代荆楚军团」

    
        { generalId: 'ruochu_doulian', factionId: 'chuguo', cityId: 'city_jingling', generalName: '鬬廉', portrait: '/assets/JIANGNAN/ruochu_doulian.png' , legionName: '先秦军团', eliteName: '荆楚兵', eliteTier: 4 },

    
        { generalId: 'mi_chu_xionglv', factionId: 'chuguo', cityId: 'city_ying', generalName: '熊旅', portrait: '/assets/JIANGNAN/mi_chu_xionglv.png' , legionName: '先秦军团', eliteName: '楚甲士', eliteTier: 2 },

    
        { generalId: 'bfe2_zi_chang', factionId: 'chuguo', cityId: 'city_ying', generalName: '子常', portrait: '/assets/JIANGNAN/bfe2_zi_chang.png', legionName: '古典时代吴越军团', eliteName: '荆楚兵', eliteTier: 4 },
        { generalId: 'bfe2_ziyu', factionId: 'chuguo', cityId: 'city_ying', generalName: '子玉', portrait: '/assets/JIANGNAN/bfe2_ziyu.png', legionName: '古典时代吴越军团', eliteName: '荆楚兵', eliteTier: 4 },

        // 🔴 [2026-10-25 主人令] 秦末楚（与战国楚同势力）非先秦武将：不跟「先秦军团」指针，按格位取古典军团
        { generalId: 'bfe_xiangliang', factionId: 'chuguo', cityId: 'city_pengcheng', legionName: '古典时代华夏军团', generalName: '项梁', portrait: '/assets/CENTRAL/bfe_xiangliang.png', eliteName: '吴中子弟', eliteTier: 3 },
        { generalId: 'xichu_xiangyu', factionId: 'chuguo', cityId: 'city_pengcheng', generalName: '项羽', portrait: '/assets/CENTRAL/xichu_xiangyu.png', legionName: '古典时代华夏军团', eliteName: '江东子弟', eliteTier: 1 },   // [2026-10-31 主人令「项羽是楚」] 并入楚国
        { generalId: 'chuguo_yangyouji', factionId: 'chuguo', cityId: 'city_yunmeng', generalName: '养由基', portrait: '/assets/JIANGNAN/chuguo_yangyouji.png', eliteName: '楚射士', eliteTier: 3 },   // 楚共王时大夫、神射手，「百步穿杨」；前575 鄢陵之战射晋将吕锜（居楚地云梦）
        { generalId: 'chuguo_doubobi', factionId: 'chuguo', cityId: 'city_shicheng', generalName: '斗伯比', portrait: '/assets/JIANGNAN/chuguo_doubobi.png', eliteName: '郊郢守军', eliteTier: 4 },   // 楚武王时令尹，佐楚开拓汉东；郊郢为楚别都（镇守）
        { generalId: 'chuguo_pandang', factionId: 'chuguo', cityId: 'city_yunmeng', generalName: '潘党', portrait: '/assets/JIANGNAN/chuguo_pandang.png', eliteName: '楚锐卒', eliteTier: 4 },   // 楚大夫，前575 鄢陵之战与养由基同率楚军射士（居楚地）
    ],
    liusong: [
        { generalId: 'liusong_tanshao', factionId: 'liusong', cityId: 'city_langya', generalName: '檀韶', portrait: '', eliteName: '北府兵', eliteTier: 3 },   // 🔴 [2026-11-01 补将] 刘宋琅邪太守（《晋朝战争史》：檀韶为琅邪太守，以抚新收）；文化随据点＝CENTRAL
        { generalId: 'gen_li_jinglong', factionId: 'ming_d', cityId: 'city_nanjing', generalName: '李景隆', portrait: '/assets/JIANGNAN/gen_li_jinglong.png', eliteName: '江南郡兵', eliteTier: 4 },
        { generalId: 'gen_li_xiucheng', cityId: 'city_nanjing', generalName: '李秀成', portrait: '/assets/JIANGNAN/gen_li_xiucheng.png', factionId: 'taiping', legionName: '起义军', eliteName: '太平锐卒', eliteTier: 3 },
        { generalId: 'nanqi_xiaobaojuan', factionId: 'nanqi', cityId: 'city_nanjing', generalName: '萧宝卷', portrait: '/assets/JIANGNAN/nanqi_xiaobaojuan.png', legionName: '封建时代江淮军团' , eliteName: '南齐台军', eliteTier: 4 },   // 🔴 南齐禁军「台军」（原配「量沙军」是刘宋檀道济的）

    ],
    nanqi: [
        { generalId: 'shanyue_sunce', factionId: 'sunwu_d', cityId: 'city_kuaiji', legionName: '古典时代吴越军团', generalName: '孙策', portrait: '/assets/JIANGNAN/shanyue_sunce.png', eliteName: '江东突骑', eliteTier: 3 },

    ],
    yangwu: [
        { generalId: 'lu_zhangliao', factionId: 'wei', cityId: 'city_hefei', legionName: '古典时代吴越军团', generalName: '张辽', portrait: '/assets/JIANGNAN/lu_zhangliao.png', eliteName: '合肥守军', eliteTier: 2  },   // 按史：张辽屯合肥，夜募敢从之士八百破孙权十万（《三国志·卷一七·张辽传》）

    
        { generalId: 'bfe_sun_ru', cityId: 'city_yangzhou', generalName: '孙儒', portrait: '/assets/JIANGNAN/bfe_sun_ru.png', factionId: 'tang', legionName: '封建时代江淮军团', eliteName: '淮南军', eliteTier: 3  },   // 按史：孙儒据扬州自称淮南节度使，统淮南镇兵（《资治通鉴》卷二五七、二五八）
        { generalId: 'yang_zhou_yangxingmi', factionId: 'yangwu', cityId: 'city_yangzhou', generalName: '杨行密', portrait: '/assets/JIANGNAN/yang_zhou_yangxingmi.png', eliteName: '淮南骑兵', eliteTier: 3 },
        { generalId: 'kalun_dexinga', cityId: 'city_shenyang', generalName: '德兴阿', portrait: '/assets/JIANGNAN/kalun_dexinga.png', factionId: 'manzhou_d', eliteName: '女真骑手', eliteTier: 4 },

        { generalId: 'bfe3_28', factionId: 'wu', cityId: 'city_yangzhou', generalName: '刘濞', portrait: '/assets/JIANGNAN/bfe3_28.png', legionName: '古典时代吴越军团' , eliteName: '吴楚步卒', eliteTier: 3},
        { generalId: 'bfe3_70', cityId: 'city_changzhou', generalName: '刘繇', portrait: '/assets/JIANGNAN/bfe3_70.png', legionName: '古典时代吴越军团', factionId: 'han_d' , eliteName: '大汉材官', eliteTier: 2 },
        { generalId: 'yin_yuejin', factionId: 'wei', cityId: 'city_hefei', legionName: '古典时代吴越军团', generalName: '乐进', portrait: '/assets/CENTRAL/yin_yuejin.png', eliteName: '江南郡兵', eliteTier: 4 },
    ],
    nantang: [
        { generalId: 'tingzhou_d_chenmin', factionId: 'song', cityId: 'city_ruijin', generalName: '陈敏', portrait: '/assets/JIANGNAN/tingzhou_d_chenmin.png', eliteName: '江南郡兵', eliteTier: 4 },

    
        { generalId: 'li_bian', factionId: 'nantang', cityId: 'city_hailing', generalName: '李昪', portrait: '/assets/JIANGNAN/taizhou_libian.png', eliteName: '江南郡兵', eliteTier: 4 },

    
        { generalId: 'chuzhou_d_huangfuhui', factionId: 'nantang', cityId: 'city_qingliuguan', generalName: '皇甫晖', portrait: '/assets/JIANGNAN/chuzhou_d_huangfuhui.png', eliteName: '江南郡兵', eliteTier: 4 },

        { generalId: 'bfe_liurenshan', factionId: 'nantang', cityId: 'city_shouxian', generalName: '刘仁赡', portrait: '/assets/CENTRAL/bfe_liurenshan.png', eliteName: '寿州守军', eliteTier: 4 },
    ],
    machu: [
        { generalId: 'changshaguo_xinqiji', factionId: 'song', cityId: 'city_changsha', legionName: '城堡时代江南军团', generalName: '辛弃疾', portrait: '/assets/JIANGNAN/changshaguo_xinqiji.png', eliteName: '荆楚兵', eliteTier: 4 },
        { generalId: 'gen_zengguofan', cityId: 'city_changsha', generalName: '曾国藩', portrait: '/assets/JIANGNAN/gen_zengguofan.png', factionId: 'manzhou_d', legionName: '帝国时代两江军团', eliteName: '湘军', eliteTier: 1  },   // 按史：曾国藩创湘军，平太平天国（《清史稿·曾国藩传》）

    
        { generalId: 'shaozhou_d_mayin', eliteName: '银枪效节', eliteTier: 2, factionId: 'machu', cityId: 'city_shaozhou', generalName: '马殷', portrait: '/assets/JIANGNAN/shaozhou_d_mayin.png' },

    ],
    nanhan: [
        { generalId: 'yingzhou_liuyan', eliteName: '南汉牙兵', eliteTier: 2, factionId: 'nanhan', cityId: 'city_panyu', generalName: '刘龑', portrait: '/assets/JIANGNAN/yingzhou_liuyan.png' },

    
        { generalId: 'guangzhou_liuyin', factionId: 'nanhan', cityId: 'city_panyu', generalName: '刘隐', portrait: '/assets/JIANGNAN/guangzhou_liuyin.png', eliteName: '荆楚兵', eliteTier: 4 },

    ],
    fangguozhen: [
        { generalId: 'wenzhou_zhangcong', eliteName: '浙东水军', eliteTier: 2, factionId: 'fangguozhen', cityId: 'city_wenzhou', generalName: '方国珍', portrait: '/assets/JIANGNAN/wenzhou_fangguozhen.png' },

    ],
    liang_shuofang: [
        { generalId: 'gen_xiao_xian', factionId: 'liang_shuofang', cityId: 'city_ying', legionName: '封建时代江淮军团', generalName: '萧铣', portrait: '/assets/JIANGNAN/gen_xiao_xian.png', eliteName: '八万御营', eliteTier: 2 },
        { generalId: 'kang_liangshidou', factionId: 'liang_shuofang', cityId: 'city_tongwancheng', generalName: '梁师都', portrait: '/assets/XIANBEI/kang_liangshidou.png', eliteName: '漠南骑手', eliteTier: 4 },

    ],
    qianliang: [
        { generalId: 'liangzhou_zhanggui', eliteName: '凉州大马', eliteTier: 3, factionId: 'qianliang', cityId: 'city_wuwei', generalName: '张轨', portrait: '/assets/KHITAN/liangzhou_zhanggui.png' },   // 按史：「凉州大马，横行天下」是凉州骑兵的知名风土称号，非张轨专属战略主力番号，依 v3 定 T3（《晋书·张轨传》）。
    ],
    // 🔴 [2026-10-26 主人令] 汉末凉州之乱（中平元年起兵、188 围陈仓）是**独立政权**，与「前凉」（张轨 301 开国）分开：
    //    王国为该军叛首，据姑臧（凉州治所）。依据《后汉书·董卓列传》《资治通鉴·汉纪》，皇甫嵩 188 年破其于陈仓。
    liangzhou: [
        { generalId: 'bfe3_67', factionId: 'liangzhou', cityId: 'city_wuwei', generalName: '王国', portrait: '/assets/KHITAN/bfe3_67.png', legionName: '古典时代凉州军团', eliteName: '凉州羌骑', eliteTier: 4 },
    ],
    dangchang_guo: [
        { generalId: 'dangchang_liangmiding', factionId: 'dangchang_guo', cityId: 'city_diezhou', generalName: '梁弥定', portrait: '/assets/TIBET/dangchang_liangmiding.png', legionName: '封建时代吐蕃军团', eliteName: '吐蕃骑兵', eliteTier: 4 },

    ],
    sanada: [
        { generalId: 'sanada_d_zhentianxingcun', eliteName: '赤备', eliteTier: 2, factionId: 'sanada', cityId: 'city_ueda', generalName: '真田幸村', portrait: '/assets/JAPAN/sanada_d_zhentianxingcun.png' },

    ],
    tokugawa: [
        { generalId: 'edo_dechuanjiakang', eliteName: '旗本武士', eliteTier: 1, factionId: 'tokugawa', cityId: 'city_edo', generalName: '德川家康', portrait: '/assets/JAPAN/edo_dechuanjiakang.png' },   // 按史：旗本武士为德川氏长期直属主力，但不是单独改写版图的传奇部队，依 v3 定 T1，不抬 T0。

    
        { generalId: 'totomi_jiujingzhongci', factionId: 'tokugawa', cityId: 'city_hamamatsu', generalName: '酒井忠次', portrait: '/assets/JAPAN/totomi_jiujingzhongci.png', eliteName: '三河武士', eliteTier: 3 },

    ],
    amago: [
        { generalId: 'izumo_shanzhonglujie', factionId: 'amago', cityId: 'city_izumo', generalName: '山中鹿介', portrait: '/assets/JAPAN/izumo_shanzhonglujie.png', eliteName: '日本足轻', eliteTier: 4 },

    ],
    shimazu: [
        { generalId: 'satsuma_daojinjiajiu', factionId: 'shimazu', cityId: 'city_satsuma', generalName: '岛津家久', portrait: '/assets/JAPAN/satsuma_daojinjiajiu.png', eliteName: '萨摩武士', eliteTier: 3 },

    
        { generalId: 'osumi_ganfujianxu', factionId: 'shimazu', cityId: 'city_akaogicheng', generalName: '肝付兼续', portrait: '/assets/JAPAN/osumi_ganfujianxu.png', eliteName: '日本足轻', eliteTier: 4 },

    ],
    mori: [
        { generalId: 'aki_maoliyuanjiu', factionId: 'mori', cityId: 'city_yoshida', generalName: '毛利元就', portrait: '/assets/JAPAN/aki_maoliyuanjiu.png', eliteName: '毛利水军', eliteTier: 3 },

    
        { generalId: 'iyo_d_cunshangwuji', eliteName: '村上水军', eliteTier: 1, factionId: 'mori', cityId: 'city_noshima', generalName: '村上武吉', portrait: '/assets/JAPAN/iyo_d_cunshangwuji.png' },   // 按史：能岛村上水军由村上武吉亲统，严岛等役为主力（《毛利家文书》）。

    
        { generalId: 'jibei2_qingshuizongzhi', factionId: 'mori', cityId: 'city_guizhicheng', generalName: '清水宗治', portrait: '/assets/JAPAN/jibei2_qingshuizongzhi.png', eliteName: '日本足轻', eliteTier: 4 },

    ],
    uesugi: [
        { generalId: 'echigo_shangshanqianxin', factionId: 'uesugi', cityId: 'city_kasugayama', generalName: '上杉谦信', portrait: '/assets/JAPAN/echigo_shangshanqianxin.png', eliteName: '越后骑兵', eliteTier: 2 },

    ],
    takeda: [
        { generalId: 'kai_wutianxinxuan', factionId: 'takeda', cityId: 'city_tsutsujigasaki', generalName: '武田信玄', portrait: '/assets/JAPAN/kai_wutianxinxuan.png', eliteName: '武田赤备', eliteTier: 2 },

    ],
    toyotomi: [
        { generalId: 'hashiba_fengchenxiuji', eliteName: '黄母衣众', eliteTier: 3, factionId: 'toyotomi', cityId: 'city_himeji', generalName: '丰臣秀吉', portrait: '/assets/JAPAN/hashiba_fengchenxiuji.png' },   // 按史：黄母衣众为秀吉马廻近卫与使番，具鲜明文化辨识度，但非独立战略野战主力，依 v3 定 T3。
        { generalId: 'gen_ishida_mitsunari', factionId: 'toyotomi', cityId: 'city_kyoto', generalName: '石田三成', portrait: '/assets/JAPAN/gen_ishida_mitsunari.png', legionName: '帝国时代武家军团', eliteName: '西军', eliteTier: 3 },

    
        { generalId: 'aizu_pushengshixiang', factionId: 'toyotomi', cityId: 'city_tsuruga', generalName: '蒲生氏乡', portrait: '/assets/JAPAN/aizu_pushengshixiang.png', eliteName: '日本足轻', eliteTier: 4 },

    
        { generalId: 'mino_dagujiji', factionId: 'toyotomi', cityId: 'city_fuwa', generalName: '大谷吉继', portrait: '/assets/JAPAN/mino_dagujiji.png', eliteName: '日本足轻', eliteTier: 4 },

        { generalId: 'bfe_ukita_hideie', factionId: 'toyotomi', cityId: 'city_guizhicheng', generalName: '宇喜多秀家', portrait: '/assets/JAPAN/bfe_ukita_hideie.png', eliteName: '备前兵', eliteTier: 3 },
        { generalId: 'bfe_todo_takakage', factionId: 'toyotomi', cityId: 'city_songshan', generalName: '藤堂高虎', portrait: '/assets/JAPAN/bfe_todo_takakage.png', eliteName: '藤堂水军', eliteTier: 4 },
        { generalId: 'bfe_sogo_kazumasa', factionId: 'toyotomi', cityId: 'city_kyoto', generalName: '十河存保', portrait: '/assets/JAPAN/bfe_sogo_kazumasa.png', eliteName: '三好家兵', eliteTier: 4 },
        { generalId: 'bfe_ashina_yoshihiro', factionId: 'toyotomi', cityId: 'city_xiantai', generalName: '芦名义广', portrait: '/assets/JAPAN/bfe_ashina_yoshihiro.png', eliteName: '芦名骑马', eliteTier: 4 },
    ],
    utsunomiya: [
        { generalId: 'shimotsuke_yudougongguanggang', factionId: 'utsunomiya', cityId: 'city_utsunomiya', generalName: '宇都宫广纲', portrait: '/assets/JAPAN/shimotsuke_yudougongguanggang.png', eliteName: '日本足轻', eliteTier: 4 },

    ],
    nanchou: [
        { generalId: 'higo_d_juchiwuguang', factionId: 'nanchou', cityId: 'city_xiongben', generalName: '菊池武光', portrait: '/assets/JAPAN/higo_d_juchiwuguang.png', eliteName: '菊池党', eliteTier: 3 },

    
        { generalId: 'yamato_nanmuzhengcheng', eliteName: '千早众', eliteTier: 2, factionId: 'nanchou', cityId: 'city_asuka', generalName: '楠木正成', portrait: '/assets/JAPAN/yamato_nanmuzhengcheng.png' },   // 按史：楠木正成据千早城抗镰仓军，恢复旧档专属番号；楠木党不再与菊池武光混挂（《太平记》）

        { generalId: 'nanchou_kitabatake', factionId: 'nanchou', cityId: 'city_kyoto', generalName: '北畠显家', portrait: '/assets/JAPAN/nanchou_kitabatake.png', eliteName: '南朝武士', eliteTier: 3 },
    ],
    nanbu_shi: [
        { generalId: 'nanbu_nanbuqingzheng', factionId: 'nanbu_shi', cityId: 'city_genjo', generalName: '南部晴政', portrait: '/assets/JAPAN/nanbu_nanbuqingzheng.png', eliteName: '日本足轻', eliteTier: 4 },

    ],
    shoni: [
        { generalId: 'zhuqian_shaoerzineng', factionId: 'shoni', cityId: 'city_taizaifu', generalName: '少贰资能', portrait: '/assets/JAPAN/zhuqian_shaoerzineng.png', eliteName: '日本足轻', eliteTier: 4 },

    ],
    heishi: [
        { generalId: 'taira_pingzhisheng', factionId: 'heishi', cityId: 'city_chijianguan', generalName: '平知盛', portrait: '/assets/JAPAN/taira_pingzhisheng.png', eliteName: '日本足轻', eliteTier: 4 },
        { generalId: 'taira_pingzongsheng', factionId: 'heishi', cityId: 'city_chijianguan', legionName: '城堡时代幕府军团', generalName: '平宗盛', portrait: '/assets/JAPAN/taira_pingzongsheng.png', eliteName: '日本足轻', eliteTier: 4 },

    ],
    imagawa: [
        { generalId: 'jinchuan_jinchuanyiyuan', eliteName: '远州寄进', eliteTier: 2, factionId: 'imagawa', cityId: 'city_junfucheng', generalName: '今川义元', portrait: '/assets/JAPAN/jinchuan_jinchuanyiyuan.png' },

    ],
    oda: [
        { generalId: 'owari_zhitianxinchang', factionId: 'oda', cityId: 'city_kyoto', generalName: '织田信长', portrait: '/assets/JAPAN/owari_zhitianxinchang.png', eliteName: '铁炮队', eliteTier: 2 },

        { generalId: 'bfe_oda_nobuhide', factionId: 'oda', cityId: 'city_atsuta', generalName: '织田信秀', portrait: '/assets/JAPAN/bfe_oda_nobuhide.png', eliteName: '织田足轻', eliteTier: 4 },
    ],
    hojo: [
        { generalId: 'sagami_beitiaoshikang', factionId: 'hojo', cityId: 'city_hakone', generalName: '北条氏康', portrait: '/assets/JAPAN/sagami_beitiaoshikang.png', eliteName: '小田原众', eliteTier: 3 },

    ],
    mahan: [
        { generalId: 'chen3_jizhun', factionId: 'mahan', cityId: 'city_pyongyang', generalName: '箕准', portrait: '/assets/KOREA/chen3_jizhun.png', eliteName: '弁韩步卒', eliteTier: 4 },

    ],
    daquyue: [
        { generalId: 'jing_dingbuling', eliteName: '丁朝禁卫', eliteTier: 4, factionId: 'daquyue', cityId: 'city_hoalu', generalName: '丁部领', portrait: '/assets/VIETNAMESE/jing_dingbuling.png' },   // 按史：丁朝宫廷禁卫为常规宿卫建制，缺独立战略大捷记录，依 v3 定 T4（《大越史记全书·丁纪》）。
        { generalId: 'bfe_ngo_nhat_khanh', factionId: 'daquyue', cityId: 'city_hoalu', legionName: '封建时代瞿越军团', generalName: '吴日庆', portrait: '/assets/VIETNAMESE/bfe_ngo_nhat_khanh.png' , eliteName: '交趾乡兵', eliteTier: 4},

    
        { generalId: 'gen_dinhle', factionId: 'daquyue', cityId: 'city_yian', legionName: '城堡时代大越军团', generalName: '丁礼', portrait: '/assets/VIETNAMESE/gen_dinhle.png', eliteName: '越南民兵', eliteTier: 4 },

    ],
    yuenan: [
        { generalId: 'yuenan_ruanguangzuan', factionId: 'yuenan', cityId: 'city_hoalu', generalName: '阮光缵', portrait: '/assets/VIETNAMESE/yuenan_ruanguangzuan.png', eliteName: '越南民兵', eliteTier: 4 },   // 🔴 [2026-10-25 按史] 成名战敌将；西山朝末帝 1783-1802；史实内战双方同属越南，按规则不新建势力；据点华闾（VIETNAMESE）；用势力精锐游击铳象
        { generalId: 'nguyen_guangnan_ruanfuying', factionId: 'yuenan', cityId: 'city_fuchun', generalName: '阮福映', portrait: '/assets/VIETNAMESE/nguyen_guangnan_ruanfuying.png', eliteName: '富春禁卫', eliteTier: 3 },   // 按史：富春为阮福映都城与亲军驻地，禁卫具政权与宫廷特色，不以泛称「游击铳象」抬作 T1（《大南实录》）。

    
        { generalId: 'guangping_ruanwenzhang', factionId: 'yuenan', cityId: 'city_donghai', generalName: '阮文张', portrait: '/assets/VIETNAMESE/guangping_ruanwenzhang.png', eliteName: '越南民兵', eliteTier: 4 },

        { generalId: 'yuenan_lelai', factionId: 'yuenan', cityId: 'city_xidu', generalName: '黎来', portrait: '/assets/VIETNAMESE/yuenan_lelai.png', eliteName: '蓝山义军', eliteTier: 3 },
        { generalId: 'yuenan_letrien', factionId: 'yuenan', cityId: 'city_xidu', generalName: '李篆', portrait: '/assets/VIETNAMESE/yuenan_letrien.png', eliteName: '蓝山义军', eliteTier: 4 },
        { generalId: 'yuenan_luunhanchu', factionId: 'yuenan', cityId: 'city_shenglong', generalName: '刘仁澍', portrait: '/assets/VIETNAMESE/yuenan_luunhanchu.png', eliteName: '陈朝弓手', eliteTier: 4 },
        { generalId: 'yuenan_buibi', factionId: 'yuenan', cityId: 'city_hoalu', generalName: '裴备', portrait: '/assets/VIETNAMESE/yuenan_buibi.png', eliteName: '李朝卫兵', eliteTier: 4 },
    ],
    qianhui: [
        { generalId: 'qianhui_baiyanhu', factionId: 'qianhui', cityId: 'city_xingqing', generalName: '白彦虎', portrait: '/assets/BASHU/qianhui_baiyanhu.png', legionName: '起义军', eliteName: '中原郡兵', eliteTier: 4 },
    ],
    dongzu: [
        { generalId: 'dongzu_wumian', factionId: 'dongzu', cityId: 'city_leigong', generalName: '吴勉', portrait: '/assets/BASHU/dongzu_wumian.png', eliteName: '巴蜀弩士', eliteTier: 4 },
    ],
    shengmiao: [
        { generalId: 'shengmiao_baoli', factionId: 'shengmiao', cityId: 'city_jiading', generalName: '包利', portrait: '/assets/BASHU/shengmiao_baoli.png', eliteName: '巴蜀弩士', eliteTier: 4 },
    ],
    buyi_d: [
        { generalId: 'buyi_d_weichaoyuan', factionId: 'buyi_d', cityId: 'city_luobo', generalName: '韦朝元', portrait: '/assets/BASHU/buyi_d_weichaoyuan.png', eliteName: '巴蜀弩士', eliteTier: 4 },
    ],
    shuizu: [
        { generalId: 'shuizu_panxinjian', factionId: 'shuizu', cityId: 'city_sandou', generalName: '潘新简', portrait: '/assets/BASHU/shuizu_panxinjian.png', eliteName: '巴蜀弩士', eliteTier: 4 },
    ],
    miaomin: [
        { generalId: 'miaomin_shiliudeng', factionId: 'miaomin', cityId: 'city_pinglong', generalName: '石柳邓', portrait: '/assets/JIANGNAN/miaomin_shiliudeng.png', legionName: '起义军', eliteName: '荆楚兵', eliteTier: 4 },
    ],
    gepids: [
        { generalId: 'gepids_cunimund', factionId: 'gepids', cityId: 'city_budapeisi', generalName: '库尼蒙德', portrait: '/assets/MAGYAR/gepids_cunimund.png', eliteName: '马扎尔骑手', eliteTier: 4 },   // 🔴 [2026-10-25 按史] 革皮德末王，567 为伦巴第阿尔博因与阿瓦尔所败身死（Paul the Deacon《伦巴第史》I.27）
    ],
    kalbids: [
        { generalId: 'kalbids_ibnhawwas', factionId: 'kalbids', cityId: 'city_palermo', legionName: '封建时代埃米尔军团', generalName: '哈瓦斯', portrait: '/assets/SICILIANS/kalbids_ibnhawwas.png', eliteName: '卡尔比德卫', eliteTier: 4 },   // 🔴 [2026-10-25 按史] 卡尔比德西西里埃米尔（巴勒莫），1063 切拉米为罗杰一世所败（Malaterra《西西里史》II.33）
    ],
    jiaohuangguo: [
        { generalId: 'jiaohuangguo_leoi', factionId: 'jiaohuangguo', cityId: 'city_luoma', generalName: '教皇利奥一世', portrait: '/assets/ROMA/jiaohuangguo_leoi.png', eliteName: '教廷卫队', eliteTier: 4 },
    ],
};

// [2026-10-26 主人令新增湖广] 只改迁入五省据点武将的旧二级手写军团；起义军、先秦及其他三级军团不动。
const HUGUANG_LEGION_BY_OLD: Readonly<Record<string, string>> = {
    古典时代吴越军团: '古典时代荆楚军团',
    古典时代华夏军团: '古典时代荆楚军团',
    封建时代江淮军团: '封建时代荆湘军团',
    封建时代中原军团: '封建时代荆湘军团',
    城堡时代江南军团: '城堡时代湘楚军团',
    城堡时代中华军团: '城堡时代湘楚军团',
    城堡时代川峡军团: '城堡时代湘楚军团',
    帝国时代两江军团: '帝国时代湖广军团',
    帝国时代中国军团: '帝国时代湖广军团',
};
for (const entry of Object.values(FACTION_GENERALS as Record<string, FactionGeneralEntry>)) {
    const list = Array.isArray(entry) ? entry : [entry as FactionGeneral];
    for (const general of list) {
        if (!HUGUANG_CITY_IDS.has(general.cityId) || !general.legionName) continue;
        const legionName = HUGUANG_LEGION_BY_OLD[general.legionName];
        if (legionName) general.legionName = legionName;
    }
}















/** 🔴 [2026-09-12 主人「**一势力一将，这个规则取消**」]







 *  势力可以挂**多个将**：本表现在允许值是「单个将」或「将的数组」两种写法（老数据一字不用改）。







 *  · 取「该势力的守将」= 优先取当前在场（登场～退场）的将，无在场或乱斗则取数组**第一个**（`getFactionGeneral`）；







 *  · 取全部 = `getFactionGenerals`；







 *  · `generalId → 档案` 的反查（F2 立绘 / 名牌）照样一份索引里全找得到。







 */







export type FactionGeneralEntry = FactionGeneral | readonly FactionGeneral[];















/** 把某势力的条目归一成数组（单值也变成长度 1 的数组） */























/**







 * 取某势力的全部武将（已解析阶段姓名与立绘路径，且名将排在普将之前，保持各自内部先后次序）。







 * 🔴 [2026-10-19 主人定：「一个据点，一个势力，可以多个武将，一个武将一支精锐」]







 */







// 🔴 [2026-10-23 主人令] 「某势力有哪些武将」按**武将自己的 factionId** 算（没写 factionId 的算他名单所在势力）；
//    名将优先、同一 generalId 只算一次。归并后并进唐名单的刘知远算后汉的将，新建后汉也能查到自己的将。
let _factionGeneralIndex: Map<string, CityGeneralRef[]> | null = null;

function buildFactionGeneralIndex(): Map<string, CityGeneralRef[]> {
    const map = new Map<string, CityGeneralRef[]>();
    for (const [blockFactionId, entry] of Object.entries(FACTION_GENERALS as Record<string, FactionGeneralEntry>)) {
        const list: FactionGeneral[] = Array.isArray(entry) ? [...entry] : [entry as FactionGeneral];
        for (const general of list) {
            const fid = general.factionId ?? blockFactionId;
            const arr = map.get(fid) ?? [];
            if (!arr.some((r) => r.general.generalId === general.generalId)) arr.push({ general, blockFactionId });
            map.set(fid, arr);
        }
    }
    return map;
}

function resolveGeneralRefs(refs: CityGeneralRef[]): FactionGeneral[] {
    const resolved = refs.map((r, idx) => {
        const g = r.general;
        const portrait = _generalPortraitOverrides[g.generalId] ?? g.portrait;
        const isFamous = getGeneralProfile(g.generalId)?.tier === 'famous';
        return {
            item: {
                ...g,
                factionId: g.factionId ?? r.blockFactionId,
                generalName: stageGeneralName(g.generalId, g.generalName),
                portrait: resolveGeneralPortraitPath(portrait, { factionId: r.blockFactionId, generalId: g.generalId, cityId: g.cityId }),
            },
            isFamous,
            idx,
        };
    });
    resolved.sort((a, b) => (a.isFamous !== b.isFamous ? (a.isFamous ? -1 : 1) : a.idx - b.idx));
    return resolved.map((r) => r.item);
}

/** 该势力的全部武将（按武将自己的 factionId；同一 generalId 只算一次）。归并后势力与名单块不必一一对应。 */
export function getFactionGenerals(factionId: string): FactionGeneral[] {
    if (!factionId) return [];
    if (!_factionGeneralIndex) _factionGeneralIndex = buildFactionGeneralIndex();
    return (_factionGeneralIndex.get(factionId) ?? []).map((r) => ({ ...r.general, factionId: r.general.factionId ?? r.blockFactionId }));
}

/** 该势力的全部武将（已解析阶段姓名/立绘，名将排前） */
export function getFactionGeneralsResolved(factionId: string): FactionGeneral[] {
    if (!factionId) return [];
    if (!_factionGeneralIndex) _factionGeneralIndex = buildFactionGeneralIndex();
    return resolveGeneralRefs(_factionGeneralIndex.get(factionId) ?? []);
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







            // 🔴 [2026-10-25] 条目自写的 factionId 优先于所在名单块的键（原实现只记块键，阿布·哈桑被答成「伊德里斯」）
            if (!index.has(general.generalId)) index.set(general.generalId, { factionId: general.factionId ?? factionId, general });







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















// ─────────────────────────────────────────────────────────────────────────────
// 🔴 [2026-10-23 主人改机制] 武将按 `cityId` 挂据点：cityId → 武将列表 索引。
//    据点出将一律按 cityId 筛，不再按「据点的势力」取整份名单（一个势力多据点不再互相串名单）。
//    归并势力时只改 factionId，cityId 不动。
// ─────────────────────────────────────────────────────────────────────────────
interface CityGeneralRef {
    general: FactionGeneral;
    blockFactionId: string;
}

let _cityGeneralIndex: Map<string, CityGeneralRef[]> | null = null;

function buildCityGeneralIndex(): Map<string, CityGeneralRef[]> {
    const map = new Map<string, CityGeneralRef[]>();
    for (const [blockFactionId, entry] of Object.entries(FACTION_GENERALS as Record<string, FactionGeneralEntry>)) {
        const list: FactionGeneral[] = Array.isArray(entry) ? [...entry] : [entry as FactionGeneral];
        for (const general of list) {
            const cityId = general.cityId;
            if (!cityId) continue;
            const arr = map.get(cityId) ?? [];
            arr.push({ general, blockFactionId });
            map.set(cityId, arr);
        }
    }
    return map;
}

/** 该据点的武将（原始条目，未解析阶段姓名/立绘） */
export function getCityGeneralsRaw(cityId: string | null | undefined): FactionGeneral[] {
    if (!cityId) return [];
    if (!_cityGeneralIndex) _cityGeneralIndex = buildCityGeneralIndex();
    return (_cityGeneralIndex.get(cityId) ?? []).map((r) => ({ ...r.general, factionId: r.general.factionId ?? r.blockFactionId }));
}

/** 该据点的全部武将（已解析阶段姓名/立绘，乱斗下本据点城主同政权优先、名将排前；保留全部武将以支持一据点多武将与选主投奔） */
export function getCityGeneralsResolved(cityId: string | null | undefined): FactionGeneral[] {
    if (!cityId) return [];
    if (!_cityGeneralIndex) _cityGeneralIndex = buildCityGeneralIndex();
    const refs = _cityGeneralIndex.get(cityId) ?? [];
    const owner = getGameMode() === 'melee' ? (_cityOwnerProvider?.(cityId) ?? null) : null;
    const resolved = refs.map((r, idx) => {
        const g = r.general;
        const factionId = g.factionId ?? r.blockFactionId;
        const portrait = _generalPortraitOverrides[g.generalId] ?? g.portrait;
        const isFamous = getGeneralProfile(g.generalId)?.tier === 'famous';
        const isOwnerMatch = !!owner && factionId === owner;
        return {
            item: {
                ...g,
                factionId,
                generalName: stageGeneralName(g.generalId, g.generalName),
                portrait: resolveGeneralPortraitPath(portrait, { factionId: r.blockFactionId, generalId: g.generalId, cityId: g.cityId }),
            },
            isOwnerMatch,
            isFamous,
            idx,
        };
    });
    resolved.sort((a, b) =>
        (a.isOwnerMatch !== b.isOwnerMatch ? (a.isOwnerMatch ? -1 : 1)
            : (a.isFamous !== b.isFamous ? (a.isFamous ? -1 : 1) : a.idx - b.idx)),
    );
    return resolved.map((r) => r.item);
}

/** 该据点的「守将」（在场优先，其次名将/首位）；未配置返回 null */
export function getCityGeneral(
    cityId: string | null | undefined,
    excludeGeneralIds?: ReadonlySet<string>,
): FactionGeneral | null {
    const resolved = getCityGeneralsResolved(cityId);
    if (!resolved.length) return null;
    if (excludeGeneralIds && excludeGeneralIds.size > 0) {
        const availableOnStage = resolved.find((g) => isGeneralOnStage(g.generalId) && !excludeGeneralIds.has(g.generalId));
        if (availableOnStage) return availableOnStage;
    }
    return resolved.find((g) => isGeneralOnStage(g.generalId)) ?? resolved[0] ?? null;
}

/** 据点现在归谁（运行时由 GameApp 注入；离线脚本不注入＝不按城主挑） */
let _cityOwnerProvider: ((cityId: string) => string | null) | null = null;
export function setCityOwnerProvider(fn: (cityId: string) => string | null): void { _cityOwnerProvider = fn; }

/** HMR 热更新 FACTION_GENERALS 后重建 cityId 索引 */
export function invalidateCityGeneralIndex(): void { _cityGeneralIndex = null; }

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
            factionId: bfChar.factionId,







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
        factionId: hit.factionId,







        generalName: stageGeneralName(generalId, hit.general.generalName),







        portrait: resolveGeneralPortraitPath(dedicated, {







            factionId: hit.factionId,







            region: options?.region,







            generalId,
            cityId: hit.general.cityId,







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
        _cityGeneralIndex = null; // 表变了，cityId 索引同样作废
        _factionGeneralIndex = null; // 势力索引同样作废







        console.log(`[HMR] FactionGenerals → ${Object.keys(newModule.FACTION_GENERALS).length} 条武将已热更新`);







    });







}














