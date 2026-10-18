/**
 * 武将首次会面·历史首战设定（GeneralFirstBattles）
 *
 * 规则：
 * 1. 玩家首次找到该武将时，触发符合其真实历史战役的对话场景。
 * 2. 对话结束后，玩家加入该势力，武将按史实配备兵力（10,000 ~ 100,000），
 *    无视沿途其他城池与军团（scriptMarchExempt + __scriptPinned），直奔历史战场。
 * 3. 对手设定：
 *    - 若史料明确记载对手武将姓名，则将战场敌帅设为该对手；
 *    - 若史料未载具体姓名，则按其历史所属势力设为「{势力名}武将」。
 *    - 敌方兵力同样按历史配置（10,000 ~ 100,000）。
 * 4. 战斗类型：
 *    - 'field'：野战（可在战场坐标或直接在据点坐标打野战，不转攻城）；
 *    - 'siege'：攻城战（直奔目标据点发起攻城）。
 * 5. 首战打完后解除锁定，继续随机攻打其他势力直至战败，再引导玩家前往下一位武将。
 */

export interface FirstBattleDialogueLine {
    speaker: 'general' | 'player';
    text: string;
}

export interface GeneralFirstBattle {
    /** 我方名将 ID */
    generalId: string;
    /** 历史战役名称 */
    battleName: string;
    /** 历史发生年份（公元前为负） */
    battleYear: number;
    /** 战斗形态：'field' 野战（含据点位置野战） | 'siege' 攻城战 */
    battleType: 'field' | 'siege';
    /** 战场或目标据点显示名称 */
    targetName: string;
    /** 目标据点 ID（攻城战必填；据点位置野战可选填以校准坐标） */
    targetCityId?: string;
    /** 战场纬度 */
    targetLat: number;
    /** 战场经度 */
    targetLng: number;
    /** 我方历史配备兵力（10,000 ~ 100,000） */
    myTroops: number;
    /** 对手所属势力 ID（对应 FACTIONS 表） */
    enemyFactionId: string;
    /** 对手历史势力名称（不知道具体敌将姓名时，自动显示为「{enemyFactionName}武将」） */
    enemyFactionName: string;
    /** 对手武将 ID（若对手在 FactionGenerals 中已有档案，可复用其立绘） */
    enemyGeneralId?: string;
    /** 对手历史武将姓名（若为空则自动采用 `${enemyFactionName}武将`） */
    enemyGeneralName?: string;
    /** 对手历史配备兵力（10,000 ~ 100,000） */
    enemyTroops: number;
    /** 玩家首次会面时的历史场景对话 */
    introLines: FirstBattleDialogueLine[];
}

export const GENERAL_FIRST_BATTLES: Readonly<Record<string, GeneralFirstBattle>> = {
    // #1 吉甫 (-852 ~ -775) — 周宣王五年（前823年）太原北伐猃狁之战
    zhou_jifu: {
        generalId: 'zhou_jifu',
        battleName: '太原北伐之战',
        battleYear: -823,
        battleType: 'field',
        targetName: '泾阳太原之野',
        targetCityId: 'city_anding',
        targetLat: 35.18,
        targetLng: 107.88,
        myTroops: 36000,
        enemyFactionId: 'quanrong',
        enemyFactionName: '猃狁',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '猃狁匪茹，整居焦获，侵镐及方，至于泾阳！王命吉甫统六师戎车北伐，壮士可愿随我同驱戎狄？' },
            { speaker: 'player', text: '愿随太师整驾出征，薄伐猃狁，至于太原，以靖王畿！' },
        ],
    },

    // #2 提格拉特 (-795 ~ -727) — 公元前732年大马士革围城战
    guyashu_tigelate: {
        generalId: 'guyashu_tigelate',
        battleName: '大马士革围城战',
        battleYear: -732,
        battleType: 'siege',
        targetName: '大马士革',
        targetCityId: 'city_damasikusi',
        targetLat: 33.5131,
        targetLng: 36.3094,
        myTroops: 45000,
        enemyFactionId: 'womaya',
        enemyFactionName: '亚兰',
        enemyGeneralName: '利汛',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '亚兰王利汛纠合黎凡特诸邦背叛亚述。我已整编亚述常备王军，正欲西进踏平大马士革，你可愿随军出征？' },
            { speaker: 'player', text: '愿入亚述王军帐下，随陛下直取大马士革！' },
        ],
    },

    // #3 萨尔贡 (-762 ~ -705) — 公元前714年远征乌拉尔图之战
    yashu_saergong: {
        generalId: 'yashu_saergong',
        battleName: '乌拉尔图远征战',
        battleYear: -714,
        battleType: 'field',
        targetName: '图什帕',
        targetCityId: 'city_tushpa',
        targetLat: 38.5,
        targetLng: 43.37,
        myTroops: 50000,
        enemyFactionId: 'wulaertu_guo',
        enemyFactionName: '乌拉尔图',
        enemyGeneralId: 'wulaertu_guo_saerdu',
        enemyGeneralName: '鲁萨一世',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '北方乌拉尔图王鲁萨一世屡窥我亚述北境。我大军即将翻越扎格罗斯山脉直捣图什帕，勇士可愿同行？' },
            { speaker: 'player', text: '愿随萨尔贡陛下北征乌拉尔图，扬威群山之巅！' },
        ],
    },

    // #4 鬬廉 (-750 ~ -690) — 公元前701年蒲骚之战
    ruochu_doulian: {
        generalId: 'ruochu_doulian',
        battleName: '蒲骚之战',
        battleYear: -701,
        battleType: 'field',
        targetName: '云梦蒲骚',
        targetCityId: 'city_yunmeng',
        targetLat: 31.02,
        targetLng: 113.75,
        myTroops: 20000,
        enemyFactionId: 'mi_chu',
        enemyFactionName: '郧国',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '郧人军于蒲骚，将与随、绞、州、蓼四邑合兵攻我楚师。师克在和不在众，壮士可愿随我抢在诸侯合围前锐师夜击郧军？' },
            { speaker: 'player', text: '愿随将军疾驰云梦蒲骚，一战击溃郧国主力！' },
        ],
    },

    // #5 塔哈尔卡 (-710 ~ -664) — 公元前673年佩鲁西姆迎击亚述之战
    dibisi_tahaerka: {
        generalId: 'dibisi_tahaerka',
        battleName: '佩鲁西姆保卫战',
        battleYear: -673,
        battleType: 'field',
        targetName: '佩鲁西姆',
        targetCityId: 'city_peiluximu',
        targetLat: 31.0417,
        targetLng: 32.545,
        myTroops: 40000,
        enemyFactionId: 'yashu',
        enemyFactionName: '亚述',
        enemyGeneralName: '阿萨尔哈东',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '亚述王阿萨尔哈东率铁骑大举进犯埃及东门佩鲁西姆！我已集结上下埃及与努比亚大军北上迎敌，你可愿随我保卫阿蒙神之土？' },
            { speaker: 'player', text: '愿随法老北赴佩鲁西姆，将亚述入侵之师击退于国门之外！' },
        ],
    },

    // #6 萨姆提克 (-685 ~ -610) — 公元前656年一统孟菲斯之战
    xikesuosi_samutike: {
        generalId: 'xikesuosi_samutike',
        battleName: '孟菲斯统一战',
        battleYear: -656,
        battleType: 'siege',
        targetName: '孟菲斯',
        targetCityId: 'city_mengfeisi',
        targetLat: 29.85,
        targetLng: 31.25,
        myTroops: 30000,
        enemyFactionId: 'aiji',
        enemyFactionName: '孟菲斯',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '埃及分裂日久，唯有拔除盘踞孟菲斯的割据旧藩，方能重铸上下埃及一统。大军即刻南下，你可愿随我出征？' },
            { speaker: 'player', text: '愿随陛下挥师孟菲斯，再造埃及一统之业！' },
        ],
    },

    // #7 先轸 (-660 ~ -627) — 公元前632年城濮之战
    jin_xianzhen: {
        generalId: 'jin_xianzhen',
        battleName: '城濮之战',
        battleYear: -632,
        battleType: 'field',
        targetName: '城濮',
        targetCityId: 'city_puyang',
        targetLat: 35.7621,
        targetLng: 115.0291,
        myTroops: 30000,
        enemyFactionId: 'chu',
        enemyFactionName: '楚国',
        enemyGeneralName: '子玉',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '楚令尹子玉率师北上，退避三舍已报楚恩，今当在城濮之野与楚军决一死战！壮士可愿入我晋国中军，共破强楚？' },
            { speaker: 'player', text: '愿随原轸元帅奔赴城濮，以虎皮蒙马冲阵，大破子玉楚师！' },
        ],
    },

    // #8 那波帕拉萨 (-658 ~ -605) — 公元前612年尼尼微攻城战
    sumeier_nabopalasa: {
        generalId: 'sumeier_nabopalasa',
        battleName: '尼尼微攻城战',
        battleYear: -612,
        battleType: 'siege',
        targetName: '尼尼微',
        targetCityId: 'city_niniwei',
        targetLat: 36.36,
        targetLng: 43.15,
        myTroops: 50000,
        enemyFactionId: 'yashu',
        enemyFactionName: '亚述',
        enemyGeneralName: '辛沙里施昆',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '亚述暴政压迫两河流域已久！我巴比伦大军正沿底格里斯河北上，誓要攻破尼尼微，终结亚述王辛沙里施昆的统治，你可愿随军北伐？' },
            { speaker: 'player', text: '愿随陛下挥师北上，攻克尼尼微巨城！' },
        ],
    },

    // #9 尼布甲尼撒 (-634 ~ -562) — 公元前587年耶路撒冷围城战
    jialedi_nibujianisa: {
        generalId: 'jialedi_nibujianisa',
        battleName: '耶路撒冷围城战',
        battleYear: -587,
        battleType: 'siege',
        targetName: '耶路撒冷',
        targetCityId: 'city_yelusaleng',
        targetLat: 31.77,
        targetLng: 35.21,
        myTroops: 50000,
        enemyFactionId: 'xibolai',
        enemyFactionName: '希伯来',
        enemyGeneralName: '西底家',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '犹大王西底家背弃盟约，据耶路撒冷坚城自守。我迦勒底大军即日西征，不破耶路撒冷誓不还朝，你可愿同往？' },
            { speaker: 'player', text: '愿随尼布甲尼撒陛下西征，踏平耶路撒冷城垣！' },
        ],
    },

    // #10 熊旅 (-626 ~ -591) — 公元前597年邲之战
    mi_chu_xionglv: {
        generalId: 'mi_chu_xionglv',
        battleName: '邲之战',
        battleYear: -597,
        battleType: 'field',
        targetName: '郑郊邲地',
        targetCityId: 'city_xinzheng',
        targetLat: 34.4,
        targetLng: 113.74,
        myTroops: 40000,
        enemyFactionId: 'jin',
        enemyFactionName: '晋国',
        enemyGeneralName: '荀林父',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '寡人三年不鸣，一鸣惊人！今晋国中军元帅荀林父率三军渡河南下救郑，正可于邲地一决雌雄，壮士可愿随寡人饮马黄河？' },
            { speaker: 'player', text: '愿随楚王北上中原，于邲地大破荀林父晋军！' },
        ],
    },

    // #11 居鲁士二世 (-600 ~ -530) — 公元前539年巴比伦之战
    ailan_julushi: {
        generalId: 'ailan_julushi',
        battleName: '巴比伦之战',
        battleYear: -539,
        battleType: 'siege',
        targetName: '巴比伦',
        targetCityId: 'city_babilun',
        targetLat: 32.5425,
        targetLng: 44.4211,
        myTroops: 60000,
        enemyFactionId: 'jialedi',
        enemyFactionName: '迦勒底',
        enemyGeneralId: 'wuer_boshasha',
        enemyGeneralName: '伯沙撒',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '米底与吕底亚皆已臣服，唯巴比伦巨城尚在摄政王伯沙撒手中。我六万波斯大军即将西进两河，你可愿随我共取巴比伦？' },
            { speaker: 'player', text: '愿随居鲁士陛下西进，一举攻克巴比伦城！' },
        ],
    },

    // #12 克罗伊斯 (-595 ~ -546) — 公元前546年斯法尔德（萨第斯）会战（本城就地开战）
    ldiya_keluoyisi: {
        generalId: 'ldiya_keluoyisi',
        battleName: '斯法尔德之战',
        battleYear: -546,
        battleType: 'field',
        targetName: '斯法尔德',
        targetCityId: 'city_sifaerde',
        targetLat: 38.48,
        targetLng: 28.03,
        myTroops: 40000,
        enemyFactionId: 'ailan',
        enemyFactionName: '波斯',
        enemyGeneralId: 'ailan_julushi',
        enemyGeneralName: '居鲁士二世',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '波斯王居鲁士二世率大军追击至此，已陈兵我都城斯法尔德城外平原！我吕底亚精锐铁骑尽在此处，你可愿随我就地迎战波斯大军？' },
            { speaker: 'player', text: '愿随克罗伊斯陛下出城列阵，于斯法尔德平原迎战居鲁士二世！' },
        ],
    },

    // #13 大流士一世 (-550 ~ -486) — 公元前521年平定巴比伦之战
    aqimeinide_daliushi: {
        generalId: 'aqimeinide_daliushi',
        battleName: '巴比伦平叛之战',
        battleYear: -521,
        battleType: 'siege',
        targetName: '巴比伦',
        targetCityId: 'city_babilun',
        targetLat: 32.5425,
        targetLng: 44.4211,
        myTroops: 50000,
        enemyFactionId: 'jialedi',
        enemyFactionName: '迦勒底',
        enemyGeneralName: '尼丁图·贝尔',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '巴比伦叛首尼丁图·贝尔妄称先王之子，据巴比伦举兵谋逆。我亲率不死军与波斯主力西征讨逆，你可愿随王师出战？' },
            { speaker: 'player', text: '愿奉万王之王号令，随大军西征荡平巴比伦叛军！' },
        ],
    },

    // #14 孙武 (-545 ~ -470) — 公元前506年柏举之战
    wu_sunwu: {
        generalId: 'wu_sunwu',
        battleName: '柏举之战',
        battleYear: -506,
        battleType: 'field',
        targetName: '柏举',
        targetCityId: 'city_yunmeng',
        targetLat: 31.02,
        targetLng: 113.75,
        myTroops: 30000,
        enemyFactionId: 'chu',
        enemyFactionName: '楚国',
        enemyGeneralName: '囊瓦',
        enemyTroops: 60000,
        introLines: [
            { speaker: 'general', text: '兵贵神速，攻其无备，出其不意！今我吴师三万自淮入汉，楚令尹囊瓦率大军仓促迎战于柏举，壮士可愿随我千里破楚？' },
            { speaker: 'player', text: '愿随孙将军奇袭柏举，以三万精兵击破囊瓦楚军主力！' },
        ],
    },

    // #15 达提斯 (-535 ~ -490) — 公元前490年马拉松之战
    gen_datis: {
        generalId: 'gen_datis',
        battleName: '马拉松之战',
        battleYear: -490,
        battleType: 'field',
        targetName: '马拉松',
        targetCityId: 'city_yadian',
        targetLat: 37.98,
        targetLng: 23.72,
        myTroops: 25000,
        enemyFactionId: 'xila',
        enemyFactionName: '阿提卡',
        enemyGeneralName: '米太亚得',
        enemyTroops: 11000,
        introLines: [
            { speaker: 'general', text: '优卑亚诸城已下，唯有雅典仍敢抗拒波斯王命！我军即将渡过海峡登陆马拉松平原，与雅典将领米太亚得决战，你可愿随军冲锋？' },
            { speaker: 'player', text: '愿随达提斯统帅渡海西进，决战马拉松平原！' },
        ],
    },

    // #16 阿尔塔弗涅斯 (-530 ~ -485) — 公元前494年米利都围城战
    gen_artaphernes: {
        generalId: 'gen_artaphernes',
        battleName: '米利都围城战',
        battleYear: -494,
        battleType: 'siege',
        targetName: '米利都',
        targetCityId: 'city_miletus',
        targetLat: 37.5303,
        targetLng: 27.2783,
        myTroops: 40000,
        enemyFactionId: 'yiaoniya',
        enemyFactionName: '伊奥尼亚',
        enemyGeneralId: 'yiaoniya_hegesistratus',
        enemyGeneralName: '阿里斯塔格拉斯',
        enemyTroops: 18000,
        introLines: [
            { speaker: 'general', text: '伊奥尼亚诸邦叛乱皆以米利都为首脑！我已调集波斯小亚细亚全部兵力直扑米利都，只要攻克此城便可一举平定沿海，你可愿同行？' },
            { speaker: 'player', text: '愿随阿尔塔弗涅斯总督挥师南下，攻破米利都坚城！' },
        ],
    },

    // #17 阿里斯提德 (-530 ~ -468) — 公元前479年普拉提亚之战
    gen_aristides: {
        generalId: 'gen_aristides',
        battleName: '普拉提亚之战',
        battleYear: -479,
        battleType: 'field',
        targetName: '普拉提亚',
        targetCityId: 'city_thebes',
        targetLat: 38.32,
        targetLng: 23.31,
        myTroops: 38000,
        enemyFactionId: 'bosidiguo',
        enemyFactionName: '波斯帝国',
        enemyGeneralName: '马多尼乌斯',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '波斯统帅马多尼乌斯率五万大军屯驻波奥蒂亚平原！我正率希腊同盟重装步兵北上普拉提亚与波斯陆军决一死战，勇士可愿并肩作战？' },
            { speaker: 'player', text: '愿随阿里斯提德将军奔赴普拉提亚，彻底击溃马多尼乌斯的波斯主力！' },
        ],
    },

    // #18 地米斯托 (-524 ~ -459) — 公元前480年希波决战
    gen_themistocles: {
        generalId: 'gen_themistocles',
        battleName: '优卑亚抗波之战',
        battleYear: -480,
        battleType: 'field',
        targetName: '卡里斯托斯',
        targetCityId: 'city_kalisituosi',
        targetLat: 38.01,
        targetLng: 24.42,
        myTroops: 30000,
        enemyFactionId: 'bosidiguo',
        enemyFactionName: '波斯帝国',
        enemyGeneralId: 'gen_datis',
        enemyGeneralName: '薛西斯一世',
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '波斯大军压境，希腊存亡在此一举！我雅典全军已经整装待发，准备迎头痛击波斯入侵之师，你可愿随我保卫自由之邦？' },
            { speaker: 'player', text: '愿随地米斯托克利将军出征，誓死痛击波斯大军！' },
        ],
    },

    // #19 巴西达斯 (-465 ~ -422) — 公元前422年安菲波利斯之战（本城就地开战）
    gen_brasidas: {
        generalId: 'gen_brasidas',
        battleName: '安菲波利斯之战',
        battleYear: -422,
        battleType: 'field',
        targetName: '安菲波利斯',
        targetCityId: 'city_anfeibolisi',
        targetLat: 40.82,
        targetLng: 23.85,
        myTroops: 12000,
        enemyFactionId: 'xila',
        enemyFactionName: '阿提卡',
        enemyGeneralName: '克里昂',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '雅典统帅克里昂已率军逼近安菲波利斯城下，敌军侦察大意、队列松散！正当此时打开城门雷霆突击，你可愿随我就地迎战克里昂？' },
            { speaker: 'player', text: '愿随巴西达斯将军出城突击，就地击溃克里昂的雅典大军！' },
        ],
    },

    // #20 吕山德 (-445 ~ -395) — 公元前405年羊河之战（本城就地开战）
    gen_lysander: {
        generalId: 'gen_lysander',
        battleName: '羊河之战',
        battleYear: -405,
        battleType: 'field',
        targetName: '羊河',
        targetCityId: 'city_yanghe',
        targetLat: 40.332,
        targetLng: 26.6,
        myTroops: 25000,
        enemyFactionId: 'xila',
        enemyFactionName: '阿提卡',
        enemyGeneralName: '科农',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '雅典将军科农率主力陈兵羊河滩头，连续数日轻敌懈怠、士卒四散觅食！今正是终结伯罗奔尼撒战争的决胜之机，你可愿随我就地突袭雅典大军？' },
            { speaker: 'player', text: '愿随吕山德统帅就地出击，于羊河全歼雅典主力！' },
        ],
    },

    // #21 吴起 (-440 ~ -381) — 公元前389年阴晋之战
    wei_wuqi: {
        generalId: 'wei_wuqi',
        battleName: '阴晋之战',
        battleYear: -389,
        battleType: 'field',
        targetName: '河西阴晋',
        targetCityId: 'city_xiayangdu',
        targetLat: 35.58,
        targetLng: 110.65,
        myTroops: 50000,
        enemyFactionId: 'qin',
        enemyFactionName: '秦国',
        enemyTroops: 100000,
        introLines: [
            { speaker: 'general', text: '秦惠公倾举国之师进逼河西阴晋！我魏武卒五万皆披三属之甲、操十二石之弩，正欲渡河迎击秦军，壮士可愿随我一战破秦？' },
            { speaker: 'player', text: '愿入吴将军魏武卒帐下，奔赴河西大破秦师！' },
        ],
    },

    // #22 阿泰阿斯 (-429 ~ -339) — 公元前339年斯基泰草原会战（本城就地开战）
    sijitai_ateas: {
        generalId: 'sijitai_ateas',
        battleName: '斯基泰草原会战',
        battleYear: -339,
        battleType: 'field',
        targetName: '塔纳伊斯',
        targetCityId: 'city_asu',
        targetLat: 47.23,
        targetLng: 39.7,
        myTroops: 30000,
        enemyFactionId: 'maqidun',
        enemyFactionName: '马其顿',
        enemyGeneralId: 'gen_philip_ii',
        enemyGeneralName: '腓力二世',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '马其顿王腓力二世妄图染指黑海北岸草原！我虽年近九旬，仍能披甲挽弓，勇士可愿随我就地迎战马其顿大军？' },
            { speaker: 'player', text: '愿随阿泰阿斯大王策马出击，迎战腓力二世！' },
        ],
    },

    // #23 阿契塔 (-428 ~ -347) — 公元前367年塔兰托保卫战（本城就地开战）
    talanduo_aqita: {
        generalId: 'talanduo_aqita',
        battleName: '塔兰托保卫战',
        battleYear: -367,
        battleType: 'field',
        targetName: '塔兰托',
        targetCityId: 'city_talanduo',
        targetLat: 40.47,
        targetLng: 17.24,
        myTroops: 25000,
        enemyFactionId: 'baerta',
        enemyFactionName: '卢卡尼亚',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '卢卡尼亚山地诸部再度南下进犯大希腊各邦，兵锋已抵塔兰托城外！公民全军已经列阵，你可愿随我就地迎击敌军？' },
            { speaker: 'player', text: '愿随阿契塔将军出城迎战，捍卫塔兰托与大希腊同盟！' },
        ],
    },

    // #24 内克塔内布 (-420 ~ -360) — 公元前373年尼罗河三角洲抗波之战
    aiji_neiketaneibu: {
        generalId: 'aiji_neiketaneibu',
        battleName: '佩鲁西姆抗波之战',
        battleYear: -373,
        battleType: 'field',
        targetName: '佩鲁西姆',
        targetCityId: 'city_peiluximu',
        targetLat: 31.0417,
        targetLng: 32.545,
        myTroops: 50000,
        enemyFactionId: 'bosidiguo',
        enemyFactionName: '波斯帝国',
        enemyGeneralName: '法尔纳巴佐斯',
        enemyTroops: 70000,
        introLines: [
            { speaker: 'general', text: '波斯统帅法尔纳巴佐斯率大军进犯尼罗河门户佩鲁西姆！趁尼罗河泛滥在即，你可愿随我北上佩鲁西姆迎头痛击波斯入侵之师？' },
            { speaker: 'player', text: '愿随法老北赴佩鲁西姆，将法尔纳巴佐斯大军逐出埃及！' },
        ],
    },

    // #25 卡布里亚斯 (-420 ~ -357) — 公元前376年纳克索斯之战（本城就地开战）
    gen_chabrias: {
        generalId: 'gen_chabrias',
        battleName: '纳克索斯之战',
        battleYear: -376,
        battleType: 'field',
        targetName: '希马鲁塔',
        targetCityId: 'city_chimarros',
        targetLat: 36.965,
        targetLng: 25.53,
        myTroops: 20000,
        enemyFactionId: 'lagoniya',
        enemyFactionName: '拉哥尼亚',
        enemyGeneralName: '波利斯',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '斯巴达统帅波利斯率军封锁纳克索斯岛，企图掐断雅典粮道！全军已在希马鲁塔严阵以待，勇士可愿随我就地迎战波利斯？' },
            { speaker: 'player', text: '愿随卡布里亚斯将军就地决战，击溃斯巴达统帅波利斯！' },
        ],
    },

    // #26 伊巴密浓达 (-418 ~ -362) — 公元前371年留克特拉之战（本城就地开战）
    gen_epaminondas: {
        generalId: 'gen_epaminondas',
        battleName: '留克特拉之战',
        battleYear: -371,
        battleType: 'field',
        targetName: '底比斯',
        targetCityId: 'city_thebes',
        targetLat: 38.32,
        targetLng: 23.31,
        myTroops: 11000,
        enemyFactionId: 'lagoniya',
        enemyFactionName: '拉哥尼亚',
        enemyGeneralName: '克列奥姆布罗托',
        enemyTroops: 12000,
        introLines: [
            { speaker: 'general', text: '斯巴达王克列奥姆布罗托已率军闯入波奥蒂亚平原！我将以五十列纵深斜线阵与底比斯圣队直击斯巴达右翼，勇士可愿随我就地决战？' },
            { speaker: 'player', text: '愿随伊巴密浓达将军于底比斯城外列阵，一举折断斯巴达长矛！' },
        ],
    },

    // #27 琉孔一世 (-410 ~ -355) — 公元前380年卡法（费奥多西亚）围城战
    bosi_puluosi_liukong: {
        generalId: 'bosi_puluosi_liukong',
        battleName: '费奥多西亚围城战',
        battleYear: -380,
        battleType: 'siege',
        targetName: '卡法',
        targetCityId: 'city_kafa',
        targetLat: 45.03,
        targetLng: 35.38,
        myTroops: 25000,
        enemyFactionId: 'taolika',
        enemyFactionName: '陶里卡',
        enemyTroops: 18000,
        introLines: [
            { speaker: 'general', text: '克里米亚良港卡法乃是黑海谷物贸易的咽喉，必须收入博斯普鲁斯王国版图！大军即将西征围城，你可愿随我出战？' },
            { speaker: 'player', text: '愿随琉孔一世陛下西进，攻克卡法坚城！' },
        ],
    },

    // #28 帕曼纽 (-400 ~ -330) — 公元前334年格拉尼库斯河之战（本城就地开战）
    gen_parmenion: {
        generalId: 'gen_parmenion',
        battleName: '格拉尼库斯河之战',
        battleYear: -334,
        battleType: 'field',
        targetName: '格拉尼库斯',
        targetCityId: 'city_gelanikusi',
        targetLat: 40.32,
        targetLng: 27.28,
        myTroops: 35000,
        enemyFactionId: 'kaliya',
        enemyFactionName: '波斯帝国',
        enemyGeneralId: 'halikanasu_memnon',
        enemyGeneralName: '门农',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '波斯名将门农与小亚细亚诸总督已陈兵格拉尼库斯河东岸！我正统率马其顿左翼重骑与方阵涉水进击，勇士可愿随我就地破敌？' },
            { speaker: 'player', text: '愿随帕曼纽老帅强渡格拉尼库斯河，击溃门农的波斯大军！' },
        ],
    },

    // #29 阿尔塔巴佐斯 (-389 ~ -325) — 公元前330年赫卡尼亚保卫战（本城就地开战）
    hekaniya_artabazos: {
        generalId: 'hekaniya_artabazos',
        battleName: '赫卡尼亚之战',
        battleYear: -330,
        battleType: 'field',
        targetName: '兹拉卡塔',
        targetCityId: 'city_zilakata',
        targetLat: 36.84,
        targetLng: 54.43,
        myTroops: 20000,
        enemyFactionId: 'maqidun',
        enemyFactionName: '马其顿',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '马其顿远征军已翻越厄尔布尔士山脉逼近赫卡尼亚首府兹拉卡塔！我军虽处逆境，亦当披甲一战，你可愿随我就地迎敌？' },
            { speaker: 'player', text: '愿随阿尔塔巴佐斯总督于兹拉卡塔就地列阵，迎战马其顿军！' },
        ],
    },

    // #30 孙膑 (-382 ~ -316) — 公元前342年马陵之战（本城就地开战）
    dongxian_sunbin: {
        generalId: 'dongxian_sunbin',
        battleName: '马陵之战',
        battleYear: -342,
        battleType: 'field',
        targetName: '郯城马陵道',
        targetCityId: 'city_tancheng',
        targetLat: 34.549568,
        targetLng: 118.317261,
        myTroops: 50000,
        enemyFactionId: 'wei',
        enemyFactionName: '魏国',
        enemyGeneralName: '庞涓',
        enemyTroops: 80000,
        introLines: [
            { speaker: 'general', text: '魏将庞涓自恃骁勇，见我齐军逐日减灶，果弃步军而率轻锐日夜兼程追入马陵险道！万弩俱已伏定，壮士可愿随我就地举火歼敌？' },
            { speaker: 'player', text: '愿随孙军师于马陵道万弩齐发，一战击杀庞涓！' },
        ],
    },

    // #31 腓力二世 (-382 ~ -336) — 公元前338年喀罗尼亚之战
    gen_philip_ii: {
        generalId: 'gen_philip_ii',
        battleName: '喀罗尼亚之战',
        battleYear: -338,
        battleType: 'field',
        targetName: '底比斯喀罗尼亚',
        targetCityId: 'city_thebes',
        targetLat: 38.32,
        targetLng: 23.31,
        myTroops: 32000,
        enemyFactionId: 'boootiya',
        enemyFactionName: '波奥蒂亚',
        enemyGeneralName: '忒阿革涅斯',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '底比斯将领忒阿革涅斯与雅典联军阻我南下之路，陈兵喀罗尼亚平原！我马其顿长枪方阵即将南征决战，勇士可愿随我一统希腊？' },
            { speaker: 'player', text: '愿随腓力二世陛下南征喀罗尼亚，确立马其顿霸权！' },
        ],
    },

    // #32 马泽乌斯 (-380 ~ -318) — 公元前331年塔普萨库斯渡口阻击战（本城就地开战）
    xuliya_shoujiang: {
        generalId: 'xuliya_shoujiang',
        battleName: '塔普萨库斯阻击战',
        battleYear: -331,
        battleType: 'field',
        targetName: '塔普萨库斯',
        targetCityId: 'city_tapusakusi',
        targetLat: 35.91,
        targetLng: 38.53,
        myTroops: 30000,
        enemyFactionId: 'maqidun',
        enemyFactionName: '马其顿',
        enemyGeneralId: 'gen_parmenion',
        enemyGeneralName: '帕曼纽',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '马其顿老帅帕曼纽率军正在塔普萨库斯强架浮桥，企图渡过幼发拉底河深入美索不达米亚！我波斯铁骑已在此严阵以待，你可愿随我就地迎战？' },
            { speaker: 'player', text: '愿随马泽乌斯总督于幼发拉底河畔就地出击，痛击帕曼纽！' },
        ],
    },

    // #33 伊阿宋 (-380 ~ -324) — 公元前374年色萨利南征福基斯之战
    hesitiya_yiasong: {
        generalId: 'hesitiya_yiasong',
        battleName: '福基斯远征战',
        battleYear: -374,
        battleType: 'field',
        targetName: '德尔斐',
        targetCityId: 'city_deerfei',
        targetLat: 38.48,
        targetLng: 22.5,
        myTroops: 28000,
        enemyFactionId: 'fujisi',
        enemyFactionName: '福基斯',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '色萨利四邦已尽归我统率，唯南境福基斯诸城仍抗命不从！我色萨利精锐骑兵即将南下德尔斐，勇士可愿随军出征？' },
            { speaker: 'player', text: '愿随伊阿宋统帅策马南下，威服福基斯诸邦！' },
        ],
    },

    // #34 萨提巴扎尼斯 (-375 ~ -328) — 公元前329年阿里亚会战（本城就地开战）
    aliya_satibazanishi: {
        generalId: 'aliya_satibazanishi',
        battleName: '阿里亚会战',
        battleYear: -329,
        battleType: 'field',
        targetName: '赫拉特',
        targetCityId: 'city_helate_city',
        targetLat: 34.34,
        targetLng: 62.19,
        myTroops: 20000,
        enemyFactionId: 'maqidun',
        enemyFactionName: '马其顿',
        enemyGeneralName: '埃里吉乌斯',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '马其顿将军埃里吉乌斯率军杀奔赫拉特而来！我阿里亚铁骑宁死不屈，誓在赫拉特城外与敌决一死战，勇士可愿随我就地迎敌？' },
            { speaker: 'player', text: '愿随萨提巴扎尼斯总督于赫拉特就地列阵，迎战埃里吉乌斯！' },
        ],
    },

    // #35 斯皮塔米尼斯 (-370 ~ -328) — 公元前329年波利提美图斯河之战
    sute_spitamenes: {
        generalId: 'sute_spitamenes',
        battleName: '波利提美图斯河之战',
        battleYear: -329,
        battleType: 'field',
        targetName: '撒马尔罕',
        targetCityId: 'city_samaerhan',
        targetLat: 39.6542,
        targetLng: 66.9597,
        myTroops: 25000,
        enemyFactionId: 'maqidun',
        enemyFactionName: '马其顿',
        enemyGeneralName: '法尔努克',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '马其顿将领法尔努克率军孤军深入撒马尔罕河谷！我粟特与达해游牧骑射手已集结完毕，正可以骑射游击将其全歼，你可愿随我出击？' },
            { speaker: 'player', text: '愿随斯皮塔米尼斯将军奔袭撒马尔罕，围歼法尔努克所部！' },
        ],
    },

    // #36 贝苏斯 (-370 ~ -329) — 公元前330年里海门阻击战（本城就地开战）
    eerbulushi_beisusi: {
        generalId: 'eerbulushi_beisusi',
        battleName: '里海门阻击战',
        battleYear: -330,
        battleType: 'field',
        targetName: '里海门',
        targetCityId: 'city_lihaimen',
        targetLat: 35.25,
        targetLng: 52.34,
        myTroops: 30000,
        enemyFactionId: 'maqidun',
        enemyFactionName: '马其顿',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '马其顿追兵已逼近里海门峡谷要隘！我已集结巴克特里亚与东方各行省精锐扼守此处，你可愿随我就地迎战马其顿军？' },
            { speaker: 'player', text: '愿随贝苏斯总督扼守里海门，就地痛击来犯之敌！' },
        ],
    },

    // #37 托勒密一世 (-367 ~ -282) — 公元前321年尼罗河保卫战
    tuolemi_tuolemi: {
        generalId: 'tuolemi_tuolemi',
        battleName: '尼罗河保卫战',
        battleYear: -321,
        battleType: 'field',
        targetName: '佩鲁西姆',
        targetCityId: 'city_peiluximu',
        targetLat: 31.0417,
        targetLng: 32.545,
        myTroops: 35000,
        enemyFactionId: 'xiaaiji',
        enemyFactionName: '马其顿摄政军',
        enemyGeneralId: 'gen_perdiccas',
        enemyGeneralName: '佩尔狄卡斯',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '帝国摄政佩尔狄卡斯统大军强攻尼罗河东门佩鲁西姆，妄图夺我埃及基业！大军即刻东进迎击，勇士可愿随我保卫埃及？' },
            { speaker: 'player', text: '愿随托勒密陛下奔赴佩鲁西姆，击退佩尔狄卡斯大军！' },
        ],
    },

    // #38 涅阿库斯 (-360 ~ -300) — 公元前325年奥里泰远征战
    xinde_patalawang: {
        generalId: 'xinde_patalawang',
        battleName: '奥里泰远征战',
        battleYear: -325,
        battleType: 'field',
        targetName: '兰巴基亚',
        targetCityId: 'city_lanbaqiya',
        targetLat: 25.81,
        targetLng: 66.62,
        myTroops: 20000,
        enemyFactionId: 'aolitai',
        enemyFactionName: '奥里泰',
        enemyGeneralId: 'aolitai_shouling',
        enemyGeneralName: '拉托尼斯',
        enemyTroops: 18000,
        introLines: [
            { speaker: 'general', text: '我军自印度河重镇帕塔拉西航开辟海道，奥里泰首领拉托尼斯率部在兰巴基亚阻截补给！你可愿随我西进击破拉托尼斯？' },
            { speaker: 'player', text: '愿随涅阿库斯统帅出征兰巴基亚，打通西航要道！' },
        ],
    },

    // #39 亚历山大 (-356 ~ -323) — 公元前334年格拉尼库斯河之战
    gen_alexander_great: {
        generalId: 'gen_alexander_great',
        battleName: '格拉尼库斯河之战',
        battleYear: -334,
        battleType: 'field',
        targetName: '格拉尼库斯',
        targetCityId: 'city_gelanikusi',
        targetLat: 40.32,
        targetLng: 27.28,
        myTroops: 35000,
        enemyFactionId: 'kaliya',
        enemyFactionName: '波斯帝国',
        enemyGeneralId: 'halikanasu_memnon',
        enemyGeneralName: '门农',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '马其顿大军已整装待发，我正要提兵渡过赫勒斯滂海峡，于格拉尼库斯河迎战波斯名将门农！有胆气者，便随我伙伴骑兵一同冲锋！' },
            { speaker: 'player', text: '愿随亚历山大东征，于格拉尼库斯河击破波斯大军！' },
        ],
    },

    // #40 司马错 (-350 ~ -280) — 公元前316年秦灭巴蜀之战
    qin_simacuo: {
        generalId: 'qin_simacuo',
        battleName: '秦灭巴蜀之战',
        battleYear: -316,
        battleType: 'siege',
        targetName: '南郑',
        targetCityId: 'city_hanzhong',
        targetLat: 33.07,
        targetLng: 107.02,
        myTroops: 50000,
        enemyFactionId: 'han_d',
        enemyFactionName: '蜀国',
        enemyGeneralName: '芦子霸',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '得蜀则得楚，楚亡则天下并矣！今秦王拜某为帅，统兵自石牛道南下伐蜀，壮士可愿随我克定汉中与巴蜀之地？' },
            { speaker: 'player', text: '愿随司马将军翻越秦岭，一举攻取南郑、平定巴蜀！' },
        ],
    },

    // #41 赵雍 (-340 ~ -295) — 公元前300年北破林胡楼烦之战
    lingqiu_zhaowuling: {
        generalId: 'lingqiu_zhaowuling',
        battleName: '北破楼烦之战',
        battleYear: -300,
        battleType: 'field',
        targetName: '雁门关',
        targetCityId: 'city_yanmenguan',
        targetLat: 39.19,
        targetLng: 112.87,
        myTroops: 50000,
        enemyFactionId: 'loufan',
        enemyFactionName: '楼烦',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '寡人推行胡服骑射，今赵国铁骑已成！正欲北出平型与雁门，一举荡平林胡、楼烦控弦之骑，壮士可愿随寡人纵马塞北？' },
            { speaker: 'player', text: '愿随赵王驰骋雁门塞外，大破楼烦骑兵！' },
        ],
    },

    // #42 旃陀罗笈多 (-340 ~ -297) — 公元前321年摩揭陀王舍城之战
    kongque_zhantuoluo: {
        generalId: 'kongque_zhantuoluo',
        battleName: '摩揭陀统一战',
        battleYear: -321,
        battleType: 'siege',
        targetName: '王舍城',
        targetCityId: 'city_wangshecheng',
        targetLat: 25.03,
        targetLng: 85.42,
        myTroops: 60000,
        enemyFactionId: 'mojietuo',
        enemyFactionName: '难陀王朝',
        enemyGeneralName: '陀那难陀',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '难陀君主陀那难陀横征暴敛，恒河百姓苦不堪言！我已集结孔雀大军与战象军团，即将进取王舍城一统北印，勇士可愿同行？' },
            { speaker: 'player', text: '愿随旃陀罗笈多陛下出征，攻克王舍城开创孔雀基业！' },
        ],
    },

    // #43 白起 (-332 ~ -257) — 公元前260年长平之战（本城就地开战）
    xin_baiqi: {
        generalId: 'xin_baiqi',
        battleName: '长平之战',
        battleYear: -260,
        battleType: 'field',
        targetName: '上党长平',
        targetCityId: 'city_shangdang',
        targetLat: 36.148974,
        targetLng: 113.008118,
        myTroops: 100000,
        enemyFactionId: 'zhao',
        enemyFactionName: '赵国',
        enemyGeneralName: '赵括',
        enemyTroops: 100000,
        introLines: [
            { speaker: 'general', text: '赵将赵括徒读父书，不知合变，已全军堕入我长平袋形伏击阵中！我奇兵已截断赵军粮道，壮士可愿随我就地合围歼灭赵括主力？' },
            { speaker: 'player', text: '愿随武安君于长平就地出击，一战全歼赵括大军！' },
        ],
    },

    // #44 皮洛士 (-319 ~ -272) — 公元前280年赫拉克利亚之战
    yipilusi_piluoshi: {
        generalId: 'yipilusi_piluoshi',
        battleName: '赫拉克利亚之战',
        battleYear: -280,
        battleType: 'field',
        targetName: '塔兰托',
        targetCityId: 'city_talanduo',
        targetLat: 40.47,
        targetLng: 17.24,
        myTroops: 30000,
        enemyFactionId: 'luoma_diguo',
        enemyFactionName: '罗马',
        enemyGeneralName: '拉维努斯',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '罗马执政官拉维努斯率罗马军团南下进逼大希腊重镇塔兰托！我伊庇鲁斯方阵与战象已准备跨海驰援，勇士可愿随我迎战罗马军团？' },
            { speaker: 'player', text: '愿随皮洛士陛下渡海西征，于塔兰托击败罗马执政官拉维努斯！' },
        ],
    },

    // #45 田单 (-315 ~ -250) — 公元前279年即墨火牛阵之战（本城就地开战）
    jiaodong_tiandan: {
        generalId: 'jiaodong_tiandan',
        battleName: '即墨火牛阵之战',
        battleYear: -279,
        battleType: 'field',
        targetName: '即墨',
        targetCityId: 'city_jimo',
        targetLat: 36.403591,
        targetLng: 120.445862,
        myTroops: 20000,
        enemyFactionId: 'yan',
        enemyFactionName: '燕国',
        enemyGeneralName: '骑劫',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '燕将骑劫中我反间取代乐毅，燕军军心已乱！城中千余火牛已缚刃灌脂，今夜便凿城出击直冲燕营，壮士可愿随我死战复齐？' },
            { speaker: 'player', text: '愿随田将军驱火牛夜袭燕营，就地斩杀骑劫、光复齐国！' },
        ],
    },

    // #46 乐毅 (-315 ~ -245) — 公元前284年济西伐齐之战
    yan_leyi: {
        generalId: 'yan_leyi',
        battleName: '济西伐齐之战',
        battleYear: -284,
        battleType: 'siege',
        targetName: '即墨齐境',
        targetCityId: 'city_jimo',
        targetLat: 36.403591,
        targetLng: 120.445862,
        myTroops: 60000,
        enemyFactionId: 'jiaodong',
        enemyFactionName: '齐国',
        enemyGeneralName: '触子',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '燕昭王筑黄金台拜某为上将军，统合五国精兵南下伐齐以报国仇！大军即刻直指齐境，壮士可愿随我席卷齐城？' },
            { speaker: 'player', text: '愿随昌国君统兵南下，大破齐将触子、连下齐境诸城！' },
        ],
    },

    // #47 欧迈尼斯 (-310 ~ -241) — 公元前262年斯法尔德（萨第斯）之战
    pajiama_oumainisi: {
        generalId: 'pajiama_oumainisi',
        battleName: '萨第斯独立之战',
        battleYear: -262,
        battleType: 'field',
        targetName: '斯法尔德',
        targetCityId: 'city_sifaerde',
        targetLat: 38.48,
        targetLng: 28.03,
        myTroops: 25000,
        enemyFactionId: 'sailiugu',
        enemyFactionName: '塞琉古',
        enemyGeneralName: '安条克一世',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '塞琉古国王安条克一世率大军进逼斯法尔德，企图扼杀我帕加马独立之业！我军即将主动出击迎战安条克，勇士可愿同行？' },
            { speaker: 'player', text: '愿随欧迈尼斯统帅奔赴斯法尔德，击败塞琉古王安条克一世！' },
        ],
    },

    // #48 廉颇 (-305 ~ -222) — 公元前251年鄗代破燕之战（本城就地开战）
    zhao_lianpo: {
        generalId: 'zhao_lianpo',
        battleName: '鄗代之战',
        battleYear: -251,
        battleType: 'field',
        targetName: '邯郸鄗地',
        targetCityId: 'city_handan',
        targetLat: 36.61,
        targetLng: 114.49,
        myTroops: 50000,
        enemyFactionId: 'yan',
        enemyFactionName: '燕国',
        enemyGeneralName: '栗腹',
        enemyTroops: 60000,
        introLines: [
            { speaker: 'general', text: '燕相栗腹欺我赵国新经长平之痛，竟倾大军南下进犯邯郸北郊！老夫虽年迈，尚能一战斩栗腹之首，壮士可愿随我就地迎敌？' },
            { speaker: 'player', text: '愿随廉老将军于邯郸城外就地出击，大破燕军、阵斩栗腹！' },
        ],
    },

    // #49 王翦 (-303 ~ -214) — 公元前224年秦灭楚之战
    ruo_wangjian: {
        generalId: 'ruo_wangjian',
        battleName: '秦灭楚淮北之战',
        battleYear: -224,
        battleType: 'field',
        targetName: '寿春',
        targetCityId: 'city_shouxian',
        targetLat: 32.57,
        targetLng: 116.78,
        myTroops: 100000,
        enemyFactionId: 'chu',
        enemyFactionName: '楚国',
        enemyGeneralName: '项燕',
        enemyTroops: 100000,
        introLines: [
            { speaker: 'general', text: '大王倾秦国精兵拜老夫为帅，出武关南下灭楚！楚大将军项燕正统楚国主力屯驻淮南寿春，壮士可愿随老夫一举荡平强楚？' },
            { speaker: 'player', text: '愿随王老将军统十万秦师南下寿春，大破楚帅项燕！' },
        ],
    },

    // #50 魏无忌 (-300 ~ -243) — 公元前257年邯郸救赵之战
    shang_weiwuji: {
        generalId: 'shang_weiwuji',
        battleName: '窃符救赵之战',
        battleYear: -257,
        battleType: 'field',
        targetName: '邯郸',
        targetCityId: 'city_handan',
        targetLat: 36.61,
        targetLng: 114.49,
        myTroops: 80000,
        enemyFactionId: 'qin',
        enemyFactionName: '秦国',
        enemyGeneralName: '王龁',
        enemyTroops: 80000,
        introLines: [
            { speaker: 'general', text: '秦将王龁昼夜猛攻邯郸，赵国旦夕将亡，唇亡则魏齿必寒！无忌已得虎符精选八万敢死之士，即刻北上救赵，壮士可愿同赴国难？' },
            { speaker: 'player', text: '愿随信陵君疾驰邯郸，击破王龁秦军、解邯郸之围！' },
        ],
    },

    // #51 李牧 (-290 ~ -229) — 公元前244年代郡破匈奴之战（本城就地开战）
    wuzhou_limu: {
        generalId: 'wuzhou_limu',
        battleName: '代郡破匈奴之战',
        battleYear: -244,
        battleType: 'field',
        targetName: '善无塞',
        targetCityId: 'city_wuzhousai',
        targetLat: 39.998214,
        targetLng: 112.420349,
        myTroops: 80000,
        enemyFactionId: 'xiongnu',
        enemyFactionName: '匈奴',
        enemyTroops: 100000,
        introLines: [
            { speaker: 'general', text: '我驻守雁门善无数年坚壁不出，今匈奴单于果轻敌举十万控弦大军倾巢来犯！选车得千三百乘、选骑得万三千匹，壮士可愿随我就地张左右翼合围匈奴？' },
            { speaker: 'player', text: '愿随李牧将军于善无塞外就地展开大阵，一战歼灭匈奴十万铁骑！' },
        ],
    },

    // #52 赵奢 (-290 ~ -267) — 公元前269年阏与之战（本城就地开战）
    liguo_zhaoshe: {
        generalId: 'liguo_zhaoshe',
        battleName: '阏与之战',
        battleYear: -269,
        battleType: 'field',
        targetName: '阏与',
        targetCityId: 'city_eyu',
        targetLat: 36.487,
        targetLng: 113.381,
        myTroops: 45000,
        enemyFactionId: 'qin',
        enemyFactionName: '秦国',
        enemyGeneralName: '胡伤',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '道远险狭，譬之两鼠斗于穴中，将勇者胜！秦将胡伤已陈兵阏与城下，我军已抢占北山制高点，壮士可愿随我就地俯冲破秦？' },
            { speaker: 'player', text: '狭路相逢勇者胜！愿随马服君于阏与就地大破胡伤秦军！' },
        ],
    },

    // #53 阿尔沙克 (-280 ~ -217) — 公元前247年帕提亚独立之战（本城就地开战）
    ansxi_aershake: {
        generalId: 'ansxi_aershake',
        battleName: '帕提亚立国之战',
        battleYear: -247,
        battleType: 'field',
        targetName: '尼萨',
        targetCityId: 'city_nisa',
        targetLat: 37.9,
        targetLng: 58.2,
        myTroops: 25000,
        enemyFactionId: 'sailiugu',
        enemyFactionName: '塞琉古',
        enemyGeneralName: '安德拉戈拉斯',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '塞琉古总督安德拉戈拉斯率军进逼尼萨！我帕提亚重装铁骑与轻骑射手已列阵城外，勇士可愿随我就地迎战、开创安息基业？' },
            { speaker: 'player', text: '愿随阿尔沙克陛下于尼萨就地出击，击溃安德拉戈拉斯！' },
        ],
    },

    // #54 哈米尔卡 (-275 ~ -228) — 公元前237年伊比利亚征服战
    gen_hamilcar: {
        generalId: 'gen_hamilcar',
        battleName: '伊比利亚远征战',
        battleYear: -237,
        battleType: 'siege',
        targetName: '塞维利亚',
        targetCityId: 'city_seville',
        targetLat: 37.38,
        targetLng: -5.99,
        myTroops: 30000,
        enemyFactionId: 'guadaer',
        enemyFactionName: '伊比利亚',
        enemyGeneralName: '伊斯托拉提乌斯',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '要向罗马复仇，必先经营伊比利亚！首领伊斯托拉提乌斯据守瓜达尔基维尔河重镇塞维利亚，你可愿随我北上攻取此城？' },
            { speaker: 'player', text: '愿随哈米尔卡统帅进军塞维利亚，平定伊比利亚南境！' },
        ],
    },

    // #55 刘邦 (-256 ~ -195) — 公元前206年还定三秦之战
    han_d_liubang: {
        generalId: 'han_d_liubang',
        battleName: '还定三秦之战',
        battleYear: -206,
        battleType: 'field',
        targetName: '陇右陈仓',
        targetCityId: 'city_tianshui',
        targetLat: 34.58,
        targetLng: 105.73,
        myTroops: 50000,
        enemyFactionId: 'wazhai',
        enemyFactionName: '雍国',
        enemyGeneralId: 'wazhai_zhanghan',
        enemyGeneralName: '章邯',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '明修栈道，暗度陈仓！今我汉军自南郑北出故道，雍王章邯仓促率军迎战，壮士可愿随吾一战平定三秦、东向以争天下？' },
            { speaker: 'player', text: '愿随汉王北出陈仓，击破章邯、还定三秦！' },
        ],
    },

    // #56 蒙恬 (-250 ~ -210) — 公元前215年北逐匈奴之战
    baiyang_mengtian: {
        generalId: 'baiyang_mengtian',
        battleName: '北逐匈奴之战',
        battleYear: -215,
        battleType: 'field',
        targetName: '头曼城',
        targetCityId: 'city_toumancheng',
        targetLat: 41.302589,
        targetLng: 108.50647,
        myTroops: 100000,
        enemyFactionId: 'xiongnu',
        enemyFactionName: '匈奴',
        enemyGeneralName: '头曼单于',
        enemyTroops: 80000,
        introLines: [
            { speaker: 'general', text: '始皇帝命某统大军北出高阙塞，收河南地、筑万里长城！匈奴头曼单于主力就在阴山头曼城下，壮士可愿随我却匈奴七百余里？' },
            { speaker: 'player', text: '愿随蒙将军北出高阙塞，直捣头曼城、痛击头曼单于！' },
        ],
    },

    // #57 汉尼拔 (-247 ~ -183) — 公元前202年扎马会战（本城就地开战）
    gen_hannibal: {
        generalId: 'gen_hannibal',
        battleName: '扎马会战',
        battleYear: -202,
        battleType: 'field',
        targetName: '迦太基扎马',
        targetCityId: 'city_jiataji',
        targetLat: 36.85,
        targetLng: 10.32,
        myTroops: 50000,
        enemyFactionId: 'luoma_diguo',
        enemyFactionName: '罗马',
        enemyGeneralName: '大西庇阿',
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '罗马统帅大西庇阿已率军登陆北非，逼近迦太基城南扎马平原！我八十头战象与百战老兵已列阵完毕，勇士可愿随我就地决战？' },
            { speaker: 'player', text: '愿随汉尼拔统帅于扎马平原就地迎战，痛击大西庇阿的罗马军团！' },
        ],
    },

    // #58 章邯 (-245 ~ -205) — 公元前208年定陶之战（本城就地开战）
    wazhai_zhanghan: {
        generalId: 'wazhai_zhanghan',
        battleName: '定陶之战',
        battleYear: -208,
        battleType: 'field',
        targetName: '定陶',
        targetCityId: 'city_dingtao',
        targetLat: 35.200716,
        targetLng: 115.471802,
        myTroops: 60000,
        enemyFactionId: 'xichu',
        enemyFactionName: '楚国',
        enemyGeneralName: '项梁',
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '楚将项梁连胜而骄，屯兵定陶城外毫无防备！今夜风雨大作，正可率我大秦锐士疾趋夜袭楚营，壮士可愿随我就地斩杀项梁？' },
            { speaker: 'player', text: '愿随章将军于定陶乘夜突袭，一战击破项梁楚军！' },
        ],
    },

    // #59 英布 (-245 ~ -196) — 公元前204年淮南寿春之战
    liu_yingbu: {
        generalId: 'liu_yingbu',
        battleName: '寿春争夺战',
        battleYear: -204,
        battleType: 'siege',
        targetName: '寿春',
        targetCityId: 'city_shouxian',
        targetLat: 32.57,
        targetLng: 116.78,
        myTroops: 40000,
        enemyFactionId: 'xichu',
        enemyFactionName: '西楚',
        enemyGeneralName: '龙且',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '楚将龙且据守淮南重镇寿春！某既与汉王合谋破楚，当先自六安起兵夺回寿春，壮士可愿随我冲锋陷阵？' },
            { speaker: 'player', text: '愿随九江王挥师北上，攻克寿春重镇！' },
        ],
    },

    // #60 安条克 (-241 ~ -187) — 公元前200年帕尼翁/大马士革之战
    sailiugu_antiaoke: {
        generalId: 'sailiugu_antiaoke',
        battleName: '帕尼翁会战',
        battleYear: -200,
        battleType: 'field',
        targetName: '大马士革',
        targetCityId: 'city_damasikusi',
        targetLat: 33.5131,
        targetLng: 36.3094,
        myTroops: 50000,
        enemyFactionId: 'tuolemi',
        enemyFactionName: '托勒密',
        enemyGeneralName: '斯科帕斯',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '托勒密名将斯科帕斯率埃及大军北上争夺叙利亚与黎凡特！我塞琉古铁甲骑兵与银盾军团即刻南下大马士革迎战，勇士可愿同行？' },
            { speaker: 'player', text: '愿随安条克三世陛下南征，于帕尼翁击溃斯科帕斯大军！' },
        ],
    },

    // #61 周勃 (-240 ~ -169) — 公元前203年洛阳攻城战
    yangshao_zhoubo: {
        generalId: 'yangshao_zhoubo',
        battleName: '洛阳攻城战',
        battleYear: -203,
        battleType: 'siege',
        targetName: '洛阳',
        targetCityId: 'city_luoyang',
        targetLat: 34.62,
        targetLng: 112.45,
        myTroops: 40000,
        enemyFactionId: 'xichu',
        enemyFactionName: '河南国',
        enemyGeneralName: '申阳',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '河南王申阳依附西楚、扼守洛阳要冲！某奉命统重兵自渑池东进，誓为汉军先登攻破洛阳，壮士可愿随我攻城？' },
            { speaker: 'player', text: '愿随绛侯东进洛阳，先登破城！' },
        ],
    },

    // #62 赵佗 (-240 ~ -137) — 公元前204年一统岭南之战（本城就地开战）
    nanyue_zhaotuo: {
        generalId: 'nanyue_zhaotuo',
        battleName: '岭南立国之战',
        battleYear: -204,
        battleType: 'field',
        targetName: '龙川',
        targetCityId: 'city_longchuan',
        targetLat: 24.1,
        targetLng: 115.26,
        myTroops: 35000,
        enemyFactionId: 'chu',
        enemyFactionName: '长沙国',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '中原扰攘，老夫绝新道、聚兵自守以保岭南安宁！今北境长沙军南下窥伺龙川，壮士可愿随老夫就地迎击来犯之师？' },
            { speaker: 'player', text: '愿随南越武王于龙川就地出战，击退北境来犯之军！' },
        ],
    },

    // #63 冒顿 (-234 ~ -174) — 公元前200年白登平城之战
    xiongnu_maodun: {
        generalId: 'xiongnu_maodun',
        battleName: '白登之战',
        battleYear: -200,
        battleType: 'field',
        targetName: '平城白登',
        targetCityId: 'city_wuzhousai',
        targetLat: 39.998214,
        targetLng: 112.420349,
        myTroops: 100000,
        enemyFactionId: 'han_d',
        enemyFactionName: '汉国',
        enemyGeneralId: 'han_d_liubang',
        enemyGeneralName: '刘邦',
        enemyTroops: 80000,
        introLines: [
            { speaker: 'general', text: '汉帝刘邦亲率大军北出平城，不知我四十万控弦精骑已四面设伏！鸣镝所向万矢齐发，勇士可愿随我南下合围汉军于白登山？' },
            { speaker: 'player', text: '愿随冒顿单于鸣镝南下，于平城白登山合围刘邦大军！' },
        ],
    },

    // #64 项羽 (-232 ~ -202) — 公元前205年彭城之战（本城就地开战）
    xichu_xiangyu: {
        generalId: 'xichu_xiangyu',
        battleName: '彭城之战',
        battleYear: -205,
        battleType: 'field',
        targetName: '彭城',
        targetCityId: 'city_pengcheng',
        targetLat: 34.27,
        targetLng: 117.18,
        myTroops: 30000,
        enemyFactionId: 'han_d',
        enemyFactionName: '汉国',
        enemyGeneralId: 'han_d_liubang',
        enemyGeneralName: '刘邦',
        enemyTroops: 100000,
        introLines: [
            { speaker: 'general', text: '刘邦趁吾东征齐地，竟纠合五诸侯大军袭据彭城，日夜置酒高会！吾亲率三万精骑自鲁南疾驰至此，壮士可愿随霸王就地冲阵，一战破其十万之众？' },
            { speaker: 'player', text: '愿随西楚霸王于彭城就地雷霆冲锋，大破刘邦诸侯联军！' },
        ],
    },

    // #65 韩信 (-231 ~ -196) — 公元前204年井陉背水之战（本城就地开战）
    xianyu_hanxin: {
        generalId: 'xianyu_hanxin',
        battleName: '井陉背水之战',
        battleYear: -204,
        battleType: 'field',
        targetName: '井陉关',
        targetCityId: 'city_jingxingguan',
        targetLat: 38.02,
        targetLng: 114,
        myTroops: 30000,
        enemyFactionId: 'zhao',
        enemyFactionName: '赵国',
        enemyGeneralName: '陈余',
        enemyTroops: 100000,
        introLines: [
            { speaker: 'general', text: '置之死地而后生，亡地而后存！赵成安君陈余号称二十万大军屯于井陉口，我军今日背绵蔓水列阵，另遣两千轻骑拔赵旗立汉赤帜，壮士可愿随我就地决战？' },
            { speaker: 'player', text: '愿随淮阴侯于井陉口背水死战，一举击斩陈余、破赵立帜！' },
        ],
    },

    // #66 周亚夫 (-199 ~ -143) — 公元前154年平定七国之乱·昌邑睢阳之战
    huaiyang_zhouyafu: {
        generalId: 'huaiyang_zhouyafu',
        battleName: '睢阳平叛之战',
        battleYear: -154,
        battleType: 'field',
        targetName: '睢阳商丘',
        targetCityId: 'city_shangqiu',
        targetLat: 34.44,
        targetLng: 115.65,
        myTroops: 60000,
        enemyFactionId: 'wu',
        enemyFactionName: '吴国',
        enemyGeneralName: '刘濞',
        enemyTroops: 80000,
        introLines: [
            { speaker: 'general', text: '吴王刘濞纠合七国叛军猛攻梁地睢阳，锐气正盛而粮道绵长！我已遣轻骑绝其淮泗运道，今叛军饥疲欲退，壮士可愿随我挥师商丘一战荡平七国叛军？' },
            { speaker: 'player', text: '愿随周太尉奔赴睢阳商丘，追击并彻底荡平刘濞叛军！' },
        ],
    },

    // #67 犹大马加比 (-190 ~ -160) — 公元前164年耶路撒冷光复战（本城就地开战）
    xibolai_majiabi: {
        generalId: 'xibolai_majiabi',
        battleName: '耶路撒冷光复战',
        battleYear: -164,
        battleType: 'field',
        targetName: '耶路撒冷',
        targetCityId: 'city_yelusaleng',
        targetLat: 31.77,
        targetLng: 35.21,
        myTroops: 15000,
        enemyFactionId: 'sailiugu',
        enemyFactionName: '塞琉古',
        enemyGeneralName: '吕西亚斯',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '塞琉古摄政吕西亚斯率大军进逼耶路撒冷山地！为洁净圣殿、重获自由，勇士可愿随我就地迎战塞琉古大军？' },
            { speaker: 'player', text: '愿随犹大·马加比于耶路撒冷就地奋战，击退吕西亚斯！' },
        ],
    },

    // #68 米南德 (-185 ~ -130) — 公元前155年犍陀罗远征战
    najie_minande: {
        generalId: 'najie_minande',
        battleName: '犍陀罗远征战',
        battleYear: -155,
        battleType: 'siege',
        targetName: '白沙瓦',
        targetCityId: 'city_baishawa',
        targetLat: 34.01,
        targetLng: 71.58,
        myTroops: 35000,
        enemyFactionId: 'jibin',
        enemyFactionName: '罽宾',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '我希腊-巴克特里亚军团已翻越兴都库什山，正欲东出开伯尔山口进取犍陀罗名城白沙瓦！勇士可愿随军东征印度？' },
            { speaker: 'player', text: '愿随米南德一世陛下东出开伯尔山口，攻占白沙瓦！' },
        ],
    },

    // #69 杜图伽摩尼 (-161 ~ -137) — 公元前161年阿努拉德普拉之战（本城就地开战）
    sengjialuo_dutugamo: {
        generalId: 'sengjialuo_dutugamo',
        battleName: '阿努拉德普拉之战',
        battleYear: -161,
        battleType: 'field',
        targetName: '阿努拉德',
        targetCityId: 'city_anulade',
        targetLat: 8.3533,
        targetLng: 80.3956,
        myTroops: 30000,
        enemyFactionId: 'zhuluo',
        enemyFactionName: '朱罗',
        enemyGeneralName: '埃拉拉',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '朱罗君主埃拉拉盘踞阿努拉德普拉日久！我已跨上王象卡杜拉，率僧伽罗十勇士与大军在城下列阵决战，你可愿随我就地冲锋？' },
            { speaker: 'player', text: '愿随杜图伽摩尼陛下于阿努拉德就地决战，击破埃拉拉大军！' },
        ],
    },

    // #70 卫青 (-154 ~ -106) — 公元前127年收复河南地之战
    shuofang_weiqing: {
        generalId: 'shuofang_weiqing',
        battleName: '河南地之战',
        battleYear: -127,
        battleType: 'field',
        targetName: '河套',
        targetCityId: 'city_hetao',
        targetLat: 40.75,
        targetLng: 107.4,
        myTroops: 50000,
        enemyFactionId: 'xiongnu',
        enemyFactionName: '匈奴',
        enemyGeneralName: '白羊王',
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '匈奴白羊王、楼烦王盘踞河套，屡次南下袭扰长安北境！陛下命青率铁骑迂回西进合围河套，壮士可愿随我荡平河南地、置朔方郡？' },
            { speaker: 'player', text: '愿随卫大将军铁骑奔袭河套，一战击溃白羊王、收复河南地！' },
        ],
    },

    // #71 霍去病 (-140 ~ -117) — 公元前121年河西之战（本城就地开战）
    suzhou_huoqubing: {
        generalId: 'suzhou_huoqubing',
        battleName: '河西之战',
        battleYear: -121,
        battleType: 'field',
        targetName: '酒泉河西',
        targetCityId: 'city_jiuquan',
        targetLat: 39.7822,
        targetLng: 98.3414,
        myTroops: 30000,
        enemyFactionId: 'hunxie',
        enemyFactionName: '匈奴',
        enemyGeneralName: '浑邪王',
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '匈奴浑邪王、休屠王盘踞河西走廊，扼断西域通道！去病奉诏率精骑出陇西、过焉支山，壮士可愿随我于此就地冲杀、打通河西？' },
            { speaker: 'player', text: '愿随冠军侯铁骑纵横河西，一战击破浑邪王主力！' },
        ],
    },

    // #72 赵充国 (-137 ~ -52) — 公元前61年平定先零羌之战
    lanzhou_zhaochongguo: {
        generalId: 'lanzhou_zhaochongguo',
        battleName: '平定先零羌之战',
        battleYear: -61,
        battleType: 'field',
        targetName: '湟水允吾',
        targetCityId: 'city_yunwu',
        targetLat: 36.301845,
        targetLng: 102.897949,
        myTroops: 40000,
        enemyFactionId: 'xianlingqiang',
        enemyFactionName: '先零羌',
        enemyGeneralName: '杨玉',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '先零羌首领杨玉叛汉犯边，渡湟水窥伺金城！老夫年逾七旬，更当持重缓进、以屯田困敌，壮士可愿随我西进允吾平定羌乱？' },
            { speaker: 'player', text: '愿随营平侯渡湟水西征允吾，稳扎稳打荡平先零羌！' },
        ],
    },

    // #73 密特里达梯 (-135 ~ -63) — 公元前89年阿姆尼亚斯河之战（本城就地开战）
    bendou_d_mitelidati: {
        generalId: 'bendou_d_mitelidati',
        battleName: '阿姆尼亚斯河之战',
        battleYear: -89,
        battleType: 'field',
        targetName: '阿马西亚',
        targetCityId: 'city_amaxiya',
        targetLat: 40.65,
        targetLng: 35.83,
        myTroops: 50000,
        enemyFactionId: 'luoma_diguo',
        enemyFactionName: '罗马',
        enemyGeneralName: '卡西乌斯',
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '罗马总督卡西乌斯唆使比提尼亚进犯我本都疆土，前锋已逼近阿马西亚阿姆尼亚斯河畔！本都镰刀战车与重步兵已整装待发，勇士可愿随我就地迎战？' },
            { speaker: 'player', text: '愿随密特里达梯国王就地出击，用镰刀战车粉碎罗马与比提尼亚联军！' },
        ],
    },

    // #74 阿雷塔斯 (-115 ~ -60) — 公元前65年耶路撒冷围城战
    nabatai_aleitasi: {
        generalId: 'nabatai_aleitasi',
        battleName: '耶路撒冷围城战',
        battleYear: -65,
        battleType: 'siege',
        targetName: '耶路撒冷',
        targetCityId: 'city_yelusaleng',
        targetLat: 31.77,
        targetLng: 35.21,
        myTroops: 40000,
        enemyFactionId: 'xibolai',
        enemyFactionName: '希伯来',
        enemyGeneralName: '亚里斯托布鲁斯',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '犹太篡位者亚里斯托布鲁斯盘踞耶路撒冷圣殿山，侵夺我纳巴泰边境十二城！我大漠骑兵已集结佩特拉，勇士可愿随我北上围攻耶路撒冷？' },
            { speaker: 'player', text: '愿随阿雷塔斯国王自佩特拉北上，兵临耶路撒冷城下！' },
        ],
    },

    // #75 辛武贤 (-110 ~ -50) — 公元前61年破罕开羌之战
    guangwu_xinwuxian: {
        generalId: 'guangwu_xinwuxian',
        battleName: '破罕开羌之战',
        battleYear: -61,
        battleType: 'field',
        targetName: '允吾',
        targetCityId: 'city_yunwu',
        targetLat: 36.301845,
        targetLng: 102.897949,
        myTroops: 30000,
        enemyFactionId: 'xianlingqiang',
        enemyFactionName: '罕开羌',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '诸羌屯聚湟水允吾一带，某奉诏拜破羌将军，当乘盛夏率轻骑自令居急进痛击羌人，壮士可愿随我出征？' },
            { speaker: 'player', text: '愿随辛将军铁骑疾趋允吾，雷霆一击荡平诸羌！' },
        ],
    },

    // #76 庞培 (-106 ~ -48) — 公元前67年奇里乞亚平海盗之战（本城就地开战）
    qiliqiya_pangpei: {
        generalId: 'qiliqiya_pangpei',
        battleName: '奇里乞亚平海盗之战',
        battleYear: -67,
        battleType: 'field',
        targetName: '阿达纳科拉凯西翁',
        targetCityId: 'city_adana',
        targetLat: 37.0,
        targetLng: 35.3213,
        myTroops: 50000,
        enemyFactionId: 'sailiugu',
        enemyFactionName: '奇里乞亚',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '地中海群盗最后的主力已退守奇里乞亚阿达纳海岸要塞！元老院授我全权扫荡海疆，勇士可愿随我于此就地发起总攻？' },
            { speaker: 'player', text: '愿随庞培统帅于奇里乞亚就地决战，彻底肃清东地中海群盗！' },
        ],
    },

    // #77 恺撒 (-100 ~ -44) — 公元前52年阿莱西亚之战
    gen_julius_caesar: {
        generalId: 'gen_julius_caesar',
        battleName: '阿莱西亚之战',
        battleYear: -52,
        battleType: 'siege',
        targetName: '第戎阿莱西亚',
        targetCityId: 'city_dijon',
        targetLat: 47.32,
        targetLng: 5.04,
        myTroops: 50000,
        enemyFactionId: 'gaolu',
        enemyFactionName: '高卢',
        enemyGeneralName: '维钦托利',
        enemyTroops: 80000,
        introLines: [
            { speaker: 'general', text: '高卢全境部族在维钦托利号召下固守阿莱西亚要塞，企图一举推翻罗马统治！我第十二军团即将北越阿尔卑斯山筑双重壁垒围城，勇士可愿随我出征高卢？' },
            { speaker: 'player', text: '愿随恺撒统帅远征阿莱西亚，击败维钦托利、平定高卢全境！' },
        ],
    },

    // #78 苏伦 (-84 ~ -52) — 公元前53年卡莱之战
    delan_sulun: {
        generalId: 'delan_sulun',
        battleName: '卡莱之战',
        battleYear: -53,
        battleType: 'field',
        targetName: '埃德萨卡莱',
        targetCityId: 'city_aidesa',
        targetLat: 37.15,
        targetLng: 38.7825,
        myTroops: 15000,
        enemyFactionId: 'luoma_diguo',
        enemyFactionName: '罗马',
        enemyGeneralName: '克拉苏',
        enemyGeneralId: 'gen_julius_caesar',
        enemyTroops: 42000,
        introLines: [
            { speaker: 'general', text: '罗马三巨头克拉苏率七个军团强渡幼发拉底河，深入卡莱荒原！我帕提亚千峰骆驼满载箭矢，轻重铁骑已蓄势待发，勇士可愿随我西进卡莱射穿罗马方阵？' },
            { speaker: 'player', text: '愿随苏伦统帅奔赴卡莱荒原，以帕提亚铁骑全歼克拉苏大军！' },
        ],
    },

    // #79 陈汤 (-75 ~ -6) — 公元前36年郅支城之战
    quli_chentang: {
        generalId: 'quli_chentang',
        battleName: '郅支城之战',
        battleYear: -36,
        battleType: 'siege',
        targetName: '它乾郅支城',
        targetCityId: 'city_taqian',
        targetLat: 41.875,
        targetLng: 83.59,
        myTroops: 40000,
        enemyFactionId: 'xiongnu',
        enemyFactionName: '北匈奴',
        enemyGeneralName: '郅支单于',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '郅支单于杀汉使臣、胁迫西域诸国，自恃远在绝域不可讨伐！汤与甘都护已矫制发西域戊己校尉及诸国兵，壮士可愿随我直捣郅支城，昭明犯强汉者虽远必诛？' },
            { speaker: 'player', text: '明犯强汉者，虽远必诛！愿随陈副校尉攻破郅支城，斩郅支单于之首！' },
        ],
    },

    // #80 丘就却 (-20 ~ 80) — 公元45年高附攻灭安息之战
    guishuang_qiujiuque: {
        generalId: 'guishuang_qiujiuque',
        battleName: '高附统一战',
        battleYear: 45,
        battleType: 'siege',
        targetName: '喀布尔高附',
        targetCityId: 'city_gaofu',
        targetLat: 34.55,
        targetLng: 69.2,
        myTroops: 45000,
        enemyFactionId: 'ansxi',
        enemyFactionName: '安息',
        enemyGeneralName: '赫尔迈乌斯',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '我贵霜翎侯已并吞大夏其余四部，唯南境高附城仍在安息与印度希腊残部手中！勇士可愿随我越兴都库什山南下，攻取高附成就贵霜大业？' },
            { speaker: 'player', text: '愿随贵霜大王南下攻取高附，开创横跨中亚与北印的贵霜帝国！' },
        ],
    },

    // #81 马援 (-14 ~ 49) — 公元42年浪泊平交趾之战（本城就地开战）
    li_s_mayuan: {
        generalId: 'li_s_mayuan',
        battleName: '浪泊平交趾之战',
        battleYear: 42,
        battleType: 'field',
        targetName: '海门合浦',
        targetCityId: 'city_hepu',
        targetLat: 21.663,
        targetLng: 109.207,
        myTroops: 30000,
        enemyFactionId: 'xiou',
        enemyFactionName: '交趾',
        enemyGeneralName: '征侧',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '交趾征侧、征贰聚众反叛，侵扰岭南诸郡！老夫奉光武帝诏拜伏波将军，男儿当死于边野以马革裹尸还，壮士可愿随我于此海门就地破敌？' },
            { speaker: 'player', text: '愿随马伏波将军就地迎击交趾叛军，立铜柱以定南疆！' },
        ],
    },

    // #82 刘秀 (-5 ~ 57) — 公元23年昆阳之战（本城就地开战）
    lulin_liuxiu: {
        generalId: 'lulin_liuxiu',
        battleName: '昆阳之战',
        battleYear: 23,
        battleType: 'field',
        targetName: '昆阳',
        targetCityId: 'city_kunyang',
        targetLat: 33.22,
        targetLng: 113.22,
        myTroops: 20000,
        enemyFactionId: 'han_d',
        enemyFactionName: '新莽',
        enemyGeneralName: '王寻',
        enemyTroops: 100000,
        introLines: [
            { speaker: 'general', text: '新莽大司徒王寻、大司空王邑倾全国精兵围困昆阳，旌旗百里、钲鼓震天！秀已自郾城、定陵调集援军，正欲直冲其中坚本营，壮士可愿随我于昆阳城外就地决死一战？' },
            { speaker: 'player', text: '愿随刘将军直捣王寻中坚大营，于昆阳城下一战覆灭新莽主力！' },
        ],
    },

    // #83 邓禹 (2 ~ 58) — 公元25年龙门渡河破关中之战（本城就地开战）
    xiayang_d_dengyu: {
        generalId: 'xiayang_d_dengyu',
        battleName: '龙门渡河之战',
        battleYear: 25,
        battleType: 'field',
        targetName: '龙门夏阳',
        targetCityId: 'city_xiayangdu',
        targetLat: 35.602,
        targetLng: 110.452,
        myTroops: 30000,
        enemyFactionId: 'han_d',
        enemyFactionName: '更始',
        enemyGeneralName: '王匡',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '更始守将王匡、成丹合兵十万扼守河东与龙门渡口，阻我西进关中之路！今日六月甲申吉日，壮士可愿随我于此龙门渡口就地挥师击斩敌将？' },
            { speaker: 'player', text: '愿随邓大司徒于龙门渡口就地破敌，饮马渭水、席卷关中！' },
        ],
    },

    // #84 耿弇 (3 ~ 58) — 公元29年临淄平张步之战
    you_gengyan: {
        generalId: 'you_gengyan',
        battleName: '临淄平张步之战',
        battleYear: 29,
        battleType: 'field',
        targetName: '临淄',
        targetCityId: 'city_linzi',
        targetLat: 36.88,
        targetLng: 118.43,
        myTroops: 35000,
        enemyFactionId: 'qi',
        enemyFactionName: '齐境',
        enemyGeneralName: '张步',
        enemyTroops: 60000,
        introLines: [
            { speaker: 'general', text: '齐地割据枭雄张步拥兵二十万盘踞剧县与临淄，陛下亲征在途！贼势方盛，我不宜把未灭之贼留给君父，壮士可愿随我挥师东下临淄，一举荡平张步？' },
            { speaker: 'player', text: '愿随耿建威大将军东下临淄，在陛下驾临前彻底击溃张步大军！' },
        ],
    },

    // #85 西维利斯 (25 ~ 80) — 公元69年巴塔维起义之战（本城就地开战）
    gen_civilis: {
        generalId: 'gen_civilis',
        battleName: '巴塔维起义之战',
        battleYear: 69,
        battleType: 'field',
        targetName: '乌特勒支莱茵河',
        targetCityId: 'city_utrecht',
        targetLat: 52.09,
        targetLng: 5.12,
        myTroops: 25000,
        enemyFactionId: 'luoma_diguo',
        enemyFactionName: '罗马',
        enemyGeneralName: '卢佩尔库斯',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '罗马帝国趁四帝内乱强征我巴塔维青年为奴，其莱茵河军团统帅卢佩尔库斯已逼近乌特勒支湿地！勇士可愿随我举起自由大旗，就地全歼罗马莱茵军团？' },
            { speaker: 'player', text: '愿随西维利斯首领于莱茵河畔就地奋战，粉碎罗马军团的枷锁！' },
        ],
    },

    // #86 窦固 (25 ~ 88) — 公元73年天山蒲类海之战（本城就地开战）
    pulei_dougu: {
        generalId: 'pulei_dougu',
        battleName: '天山蒲类海之战',
        battleYear: 73,
        battleType: 'field',
        targetName: '巴里坤蒲类海',
        targetCityId: 'city_balikun',
        targetLat: 43.6,
        targetLng: 93.0,
        myTroops: 30000,
        enemyFactionId: 'huyan',
        enemyFactionName: '北匈奴',
        enemyGeneralName: '呼衍王',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '北匈奴呼衍王盘踞天山蒲类海，断绝西域三十六国通汉之道！固奉明帝诏率酒泉、敦煌精骑出塞至此，壮士可愿随我于蒲类海畔就地击斩呼衍王？' },
            { speaker: 'player', text: '愿随窦奉车都尉于蒲类海畔就地出击，痛击呼衍王、重开西域门户！' },
        ],
    },

    // #87 班超 (32 ~ 102) — 公元91年龟兹平定之战（本城就地开战）
    xiyuduhu_banchao: {
        generalId: 'xiyuduhu_banchao',
        battleName: '西域平定之战',
        battleYear: 91,
        battleType: 'field',
        targetName: '它乾城',
        targetCityId: 'city_taqian',
        targetLat: 41.875,
        targetLng: 83.59,
        myTroops: 25000,
        enemyFactionId: 'qiuci',
        enemyFactionName: '龟兹',
        enemyGeneralName: '尤利多',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '不入虎穴，焉得虎子！龟兹王尤利多恃北匈奴余威抗拒汉命，已率军逼近它乾城下！超已合于阗、疏勒诸国精兵，壮士可愿随我于此就地决战、威震西域五十国？' },
            { speaker: 'player', text: '愿随班都护于它乾城下就地迎战，彻底折服龟兹与西域诸国！' },
        ],
    },

    // #88 窦宪 (50 ~ 92) — 公元89年稽落山之战（本城就地开战）
    jiluo_d_douxian: {
        generalId: 'jiluo_d_douxian',
        battleName: '稽落山之战',
        battleYear: 89,
        battleType: 'field',
        targetName: '涿邪稽落山',
        targetCityId: 'city_luhun',
        targetLat: 43.58829,
        targetLng: 104.661255,
        myTroops: 50000,
        enemyFactionId: 'xiongnu',
        enemyFactionName: '北匈奴',
        enemyGeneralName: '北单于',
        enemyTroops: 60000,
        introLines: [
            { speaker: 'general', text: '北单于主力正在涿邪山与稽落山之间列阵！我大汉三军会合南匈奴、乌桓、鲜卑精骑已出塞三千里，壮士可愿随我于此就地大破北单于、登燕然山刻石纪功？' },
            { speaker: 'player', text: '愿随窦车骑将军于稽落山就地决战，荡平北匈奴、勒石燕然！' },
        ],
    },

    // #89 迦腻色迦 (78 ~ 144) — 公元127年富楼沙会战（本城就地开战）
    jibin_jianisejia: {
        generalId: 'jibin_jianisejia',
        battleName: '富楼沙会战',
        battleYear: 127,
        battleType: 'field',
        targetName: '白沙瓦富楼沙',
        targetCityId: 'city_baishawa',
        targetLat: 34.01,
        targetLng: 71.52,
        myTroops: 50000,
        enemyFactionId: 'ansxi',
        enemyFactionName: '帕提亚',
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '帕提亚大军东侵我犍陀罗王都富楼沙！我贵霜重甲铁骑与战象已在白沙瓦城外列阵，勇士可愿随我众王之王就地迎击帕提亚入侵者？' },
            { speaker: 'player', text: '愿随迦腻色迦大王于白沙瓦城外就地决战，全歼帕提亚远征军！' },
        ],
    },

    // #90 皇甫规 (104 ~ 174) — 公元161年朔方平羌之战（本城就地开战）
    woye_huangfugui: {
        generalId: 'woye_huangfugui',
        battleName: '朔方平羌之战',
        battleYear: 161,
        battleType: 'field',
        targetName: '临戎',
        targetCityId: 'city_linrong',
        targetLat: 40.3,
        targetLng: 107.0,
        myTroops: 30000,
        enemyFactionId: 'xianlingqiang',
        enemyFactionName: '先零羌',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '先零诸羌合兵寇略关中与并凉二州，前锋已逼近朔方临戎城下！规奉诏持节监关西兵，正欲整肃军纪、迎头痛击，壮士可愿随我就地破羌？' },
            { speaker: 'player', text: '愿随皇甫中郎将于临戎城外就地出战，一举肃清三秦与朔方羌患！' },
        ],
    },

    // #91 皇甫嵩 (135 ~ 195) — 公元188年陈仓破王国之战（本城就地开战）
    jingzhou_gs_huangfusong: {
        generalId: 'jingzhou_gs_huangfusong',
        battleName: '平定凉州王国之战',
        battleYear: 188,
        battleType: 'field',
        targetName: '安定陇右',
        targetCityId: 'city_anding',
        targetLat: 35.327451,
        targetLng: 107.358398,
        myTroops: 40000,
        enemyFactionId: 'qin',
        enemyFactionName: '凉州叛军',
        enemyGeneralName: '王国',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '凉州叛将王国、韩遂合兵十余万攻围陈仓、疲敝退走！兵法有云善用兵者击其惰归，壮士可愿随我于此陇右安定就地乘胜掩杀王国大军？' },
            { speaker: 'player', text: '愿随皇甫左将军击其惰归，就地连破王国叛军！' },
        ],
    },

    // #92 麴义 (150 ~ 195) — 公元191年界桥之战（本城就地开战）
    qu_d_quyi: {
        generalId: 'qu_d_quyi',
        battleName: '界桥之战',
        battleYear: 191,
        battleType: 'field',
        targetName: '界桥',
        targetCityId: 'city_jieqiao',
        targetLat: 36.95,
        targetLng: 115.5,
        myTroops: 25000,
        enemyFactionId: 'you',
        enemyFactionName: '公孙瓒军',
        enemyGeneralName: '严纲',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '公孙瓒自恃白马义从精锐，命冀州刺史严纲率万骑直冲我界桥大阵！某麾下八百先登死士与千张强弩已伏于盾后，壮士可愿随我就地迎战、万弩齐发？' },
            { speaker: 'player', text: '愿随麴将军率混合强弩先登死士，于界桥就地射垮白马义从、斩杀严纲！' },
        ],
    },

    // #93 曹操 (155 ~ 220) — 公元200年官渡之战
    cao_d_caocao: {
        generalId: 'cao_d_caocao',
        battleName: '官渡之战',
        battleYear: 200,
        battleType: 'field',
        targetName: '开封官渡',
        targetCityId: 'city_bianliang',
        targetLat: 34.8,
        targetLng: 114.31,
        myTroops: 40000,
        enemyFactionId: 'qu_d',
        enemyFactionName: '袁绍军',
        enemyGeneralName: '袁绍',
        enemyTroops: 100000,
        introLines: [
            { speaker: 'general', text: '袁本初拥冀、青、幽、并四州之众，统十万大军南渡黄河屯兵官渡！许攸来降献计乌巢粮仓空虚，壮士可愿随孟德疾驰官渡、奇袭乌巢一战定北方？' },
            { speaker: 'player', text: '愿随曹丞相北赴官渡，火烧乌巢、击溃袁绍十万大军！' },
        ],
    },

    // #94 孙坚 (155 ~ 191) — 公元191年阳人聚之战（本城就地开战）
    ruzhou_sunjian: {
        generalId: 'ruzhou_sunjian',
        battleName: '阳人聚之战',
        battleYear: 191,
        battleType: 'field',
        targetName: '广成关阳人',
        targetCityId: 'city_guangchengguan',
        targetLat: 34.139089,
        targetLng: 112.887268,
        myTroops: 30000,
        enemyFactionId: 'wuzhou_d',
        enemyFactionName: '董卓军',
        enemyGeneralName: '胡轸',
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '逆贼董卓焚毁洛阳，遣大都护胡轸、吕布率精兵来攻我广成关阳人聚！彼军将帅不和，壮士可愿随文台于关前就地出击、斩华雄破吕布？' },
            { speaker: 'player', text: '愿随孙破虏将军于广成关就地迎战，痛击董卓西凉军！' },
        ],
    },

    // #95 关羽 (160 ~ 220) — 公元219年襄樊水淹七军之战
    chu_guanyu: {
        generalId: 'chu_guanyu',
        battleName: '水淹七军之战',
        battleYear: 219,
        battleType: 'field',
        targetName: '襄阳樊城',
        targetCityId: 'city_xiangyang',
        targetLat: 32.01,
        targetLng: 112.12,
        myTroops: 40000,
        enemyFactionId: 'bozhou_d',
        enemyFactionName: '曹魏',
        enemyGeneralName: '于禁',
        enemyGeneralId: 'bozhou_d_yujin',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '汉中王已克定军山，命某自江陵北伐襄樊！今汉水秋霖暴涨，曹魏左将军于禁、庞德督七军屯于罾口川低地，壮士可愿随关某乘大水直取襄樊、水淹七军？' },
            { speaker: 'player', text: '愿随关将军自江陵挥师北上襄樊，水淹七军、生擒于禁威震华夏！' },
        ],
    },

    // #96 刘备 (161 ~ 223) — 公元219年汉中定军山之战
    shu_liubei: {
        generalId: 'shu_liubei',
        battleName: '汉中定军山之战',
        battleYear: 219,
        battleType: 'field',
        targetName: '南郑定军山',
        targetCityId: 'city_hanzhong',
        targetLat: 33.07,
        targetLng: 107.02,
        myTroops: 50000,
        enemyFactionId: 'cao_d',
        enemyFactionName: '曹魏',
        enemyGeneralName: '夏侯渊',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '汉中乃益州咽喉，若失汉中则三蜀无险可守！曹魏征西将军夏侯渊正据守南郑定军山，备欲率大军自成都北上夺取汉中，壮士可愿随我共兴汉室？' },
            { speaker: 'player', text: '愿随玄德公北上汉中定军山，斩夏侯渊、克复汉中！' },
        ],
    },

    // #97 张飞 (165 ~ 221) — 公元215年巴西宕渠之战（本城就地开战）
    langzhou_zhangfei: {
        generalId: 'langzhou_zhangfei',
        battleName: '巴西宕渠之战',
        battleYear: 215,
        battleType: 'field',
        targetName: '阆中宕渠',
        targetCityId: 'city_langzhong_gucheng',
        targetLat: 31.583,
        targetLng: 105.97,
        myTroops: 30000,
        enemyFactionId: 'cao_d',
        enemyFactionName: '曹魏',
        enemyGeneralName: '张郃',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '曹魏名将张郃率军南下进犯我巴西郡，现正屯兵阆中宕渠山道！山道狭窄首尾不能相救，壮士可愿随俺老张从山间小路断其首尾、就地大破张郃？' },
            { speaker: 'player', text: '愿随张车骑将军于阆中宕渠就地出击，杀得张郃弃马攀山而逃！' },
        ],
    },

    // #98 曹仁 (168 ~ 223) — 公元208年江陵保卫战
    caoren: {
        generalId: 'caoren',
        battleName: '江陵保卫战',
        battleYear: 208,
        battleType: 'field',
        targetName: '江陵',
        targetCityId: 'city_ying',
        targetLat: 30.35,
        targetLng: 112.18,
        myTroops: 35000,
        enemyFactionId: 'jiujiang',
        enemyFactionName: '东吴',
        enemyGeneralName: '周瑜',
        enemyGeneralId: 'jiujiang_zhouyu',
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '东吴大都督周瑜率数万精兵渡江猛扑我荆州重镇江陵！前锋牛金被围，仁纵死亦当亲率壮骑突入吴阵救出袍泽，壮士可愿随我南驰江陵血战周瑜？' },
            { speaker: 'player', text: '将军真天人也！愿随曹征南将军疾驰江陵，奋勇冲阵挫败周瑜锋芒！' },
        ],
    },

    // #99 张辽 (169 ~ 222) — 公元215年合肥逍遥津之战（本城就地开战）
    lu_zhangliao: {
        generalId: 'lu_zhangliao',
        battleName: '合肥逍遥津之战',
        battleYear: 215,
        battleType: 'field',
        targetName: '合肥逍遥津',
        targetCityId: 'city_hefei',
        targetLat: 31.82,
        targetLng: 117.23,
        myTroops: 20000,
        enemyFactionId: 'shanyue',
        enemyFactionName: '东吴',
        enemyGeneralName: '孙权',
        enemyTroops: 100000,
        introLines: [
            { speaker: 'general', text: '孙权亲统十万大军围攻合肥！丞相教令已至，命我等于贼军未合之时逆击折其盛势！辽今夜募八百陷阵死士，明日平旦直冲孙权麾盖，壮士可愿随我就地决战？' },
            { speaker: 'player', text: '愿随张前将军披甲陷阵，于合肥逍遥津就地杀穿吴军十万大营！' },
        ],
    },

    // #100 田豫 (171 ~ 252) — 公元233年马城破轲比能之战（本城就地开战）
    guzhu_tianyu: {
        generalId: 'guzhu_tianyu',
        battleName: '平定鲜卑轲比能之战',
        battleYear: 233,
        battleType: 'field',
        targetName: '肥如卢龙塞',
        targetCityId: 'city_feiru',
        targetLat: 39.89,
        targetLng: 118.89,
        myTroops: 25000,
        enemyFactionId: 'tuoba',
        enemyFactionName: '鲜卑',
        enemyGeneralName: '轲比能',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '鲜卑大人轲比能统控漠南诸部，率数万骑兵南下寇边，前锋已逼近肥如卢龙塞！豫久镇北疆深知胡骑虚实，壮士可愿随我设伏诱敌、就地击破轲比能？' },
            { speaker: 'player', text: '愿随田护乌桓校尉于肥如塞下就地迎敌，大破轲比能鲜卑铁骑！' },
        ],
    },

    // #101 周瑜 (175 ~ 210) — 公元208年赤壁之战（本城就地开战）
    jiujiang_zhouyu: {
        generalId: 'jiujiang_zhouyu',
        battleName: '赤壁之战',
        battleYear: 208,
        battleType: 'field',
        targetName: '柴桑赤壁',
        targetCityId: 'city_chaisang',
        targetLat: 29.6802,
        targetLng: 115.9964,
        myTroops: 30000,
        enemyFactionId: 'cao_d',
        enemyFactionName: '曹军',
        enemyGeneralName: '曹操',
        enemyGeneralId: 'cao_d_caocao',
        enemyTroops: 100000,
        introLines: [
            { speaker: 'general', text: '曹操驱北方之众顺江东下，号称八十万，连环战船已逼近柴桑赤壁江面！今夜东南风起，黄公覆火攻蒙冲斗舰已备，壮士可愿随公瑾于大江之上就地火烧赤壁？' },
            { speaker: 'player', text: '愿随周大都督扬帆出击，火烧赤壁、将曹操大军付之一炬！' },
        ],
    },

    // #102 孙策 (175 ~ 200) — 公元195年神亭岭平江东之战（本城就地开战）
    shanyue_sunce: {
        generalId: 'shanyue_sunce',
        battleName: '平定江东之战',
        battleYear: 195,
        battleType: 'field',
        targetName: '宛陵牛渚',
        targetCityId: 'city_wanling',
        targetLat: 30.9333,
        targetLng: 118.75,
        myTroops: 25000,
        enemyFactionId: 'danyang',
        enemyFactionName: '扬州军',
        enemyGeneralName: '刘繇',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '扬州刺史刘繇据守曲阿与牛渚大营，阻我渡江创业之路！策率父兄旧部渡江至此，兵锋所向无人敢当，壮士可愿随我于此宛陵就地冲杀、横扫江东六郡？' },
            { speaker: 'player', text: '愿随孙小霸王于江东就地出战，一举击溃刘繇大军、奠定基业！' },
        ],
    },

    // #103 吕蒙 (178 ~ 220) — 公元213年濡须口保卫战（本城就地开战）
    wuwu_d_lvmeng: {
        generalId: 'wuwu_d_lvmeng',
        battleName: '濡须口保卫战',
        battleYear: 213,
        battleType: 'field',
        targetName: '濡须口',
        targetCityId: 'city_jingkou',
        targetLat: 31.58,
        targetLng: 117.92,
        myTroops: 35000,
        enemyFactionId: 'cao_d',
        enemyFactionName: '曹军',
        enemyGeneralName: '曹操',
        enemyGeneralId: 'cao_d_caocao',
        enemyTroops: 70000,
        introLines: [
            { speaker: 'general', text: '曹操亲率大军南下濡须口，欲在江岸立坞水陆并进！蒙献策筑濡须坞夹水坚守，趁彼立营未定正好迎头痛击，壮士可愿随子明于濡须口就地破曹？' },
            { speaker: 'player', text: '愿随吕将军据守濡须坞就地出击，令曹操感叹生子当如孙仲谋而退！' },
        ],
    },

    // #104 司马懿 (179 ~ 251) — 公元234年五丈原陇右阻击战
    sima_d_simayi: {
        generalId: 'sima_d_simayi',
        battleName: '陇右卤城之战',
        battleYear: 231,
        battleType: 'field',
        targetName: '天水卤城',
        targetCityId: 'city_tianshui',
        targetLat: 34.58,
        targetLng: 105.73,
        myTroops: 60000,
        enemyFactionId: 'huizhou_d',
        enemyFactionName: '蜀汉',
        enemyGeneralName: '诸葛亮',
        enemyGeneralId: 'huizhou_zhugeliang',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '蜀相诸葛亮统倾国之兵四出祁山，现正屯兵天水卤城一带抢割陇上麦粮！陛下命老夫督关中雍凉诸军西进御蜀，壮士可愿随我西赴天水与诸葛孔明一决雌雄？' },
            { speaker: 'player', text: '愿随司马大都督西赴天水陇右，挫败诸葛亮北伐大军！' },
        ],
    },

    // #105 阿尔达希尔 (180 ~ 242) — 公元224年荷姆兹甘平原之战（本城就地开战）
    sashan_aerdaxier: {
        generalId: 'sashan_aerdaxier',
        battleName: '荷姆兹甘平原之战',
        battleYear: 224,
        battleType: 'field',
        targetName: '菲鲁扎巴德',
        targetCityId: 'city_feiluzhabade',
        targetLat: 28.85,
        targetLng: 52.53,
        myTroops: 40000,
        enemyFactionId: 'ansxi',
        enemyFactionName: '安息',
        enemyGeneralName: '阿尔达班四世',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '安息末王阿尔达班四世率帕提亚全军逼近法尔斯荷姆兹甘平原，欲扑灭我萨珊复兴之火！我萨珊具装铁骑已披挂整齐，勇士可愿随我就地决战、重铸波斯万王之王荣耀？' },
            { speaker: 'player', text: '愿随阿尔达希尔大王就地冲锋，击斩阿尔达班四世、开创萨珊波斯帝国！' },
        ],
    },

    // #106 诸葛亮 (181 ~ 234) — 公元231年北伐祁山卤城之战
    huizhou_zhugeliang: {
        generalId: 'huizhou_zhugeliang',
        battleName: '北伐卤城之战',
        battleYear: 231,
        battleType: 'field',
        targetName: '天水卤城',
        targetCityId: 'city_tianshui',
        targetLat: 34.58,
        targetLng: 105.73,
        myTroops: 50000,
        enemyFactionId: 'sima_d',
        enemyFactionName: '曹魏',
        enemyGeneralName: '司马懿',
        enemyGeneralId: 'sima_d_simayi',
        enemyTroops: 60000,
        introLines: [
            { speaker: 'general', text: '先帝创业未半而中道崩殂，今南方已定、兵甲已足，当奖率三军北定中原！曹魏大都督司马懿已率军进抵天水卤城，壮士可愿随亮以元戎连弩北上天水痛击魏军？' },
            { speaker: 'player', text: '愿随诸葛丞相北出祁山、进逼天水卤城，大破司马懿主力、克复汉室！' },
        ],
    },

    // #107 陆逊 (183 ~ 245) — 公元222年夷陵猇亭之战（本城就地开战）
    yidou_luxun: {
        generalId: 'yidou_luxun',
        battleName: '夷陵猇亭之战',
        battleYear: 222,
        battleType: 'field',
        targetName: '夷陵猇亭',
        targetCityId: 'city_yiling',
        targetLat: 30.7,
        targetLng: 111.28,
        myTroops: 50000,
        enemyFactionId: 'shu',
        enemyFactionName: '蜀汉',
        enemyGeneralName: '刘备',
        enemyGeneralId: 'shu_liubei',
        enemyTroops: 70000,
        introLines: [
            { speaker: 'general', text: '蜀主刘备倾国东征，自巫峡至夷陵连营七百里！今盛夏酷暑，蜀军疲敝移营深林之中，破敌正在今日！壮士可愿随伯言各持茅草、于夷陵就地火烧连营？' },
            { speaker: 'player', text: '愿随陆大都督于夷陵猇亭就地纵火出击，火烧蜀军四十余营！' },
        ],
    },

    // #108 王平 (185 ~ 248) — 公元244年兴势之战（本城就地开战）
    yangzhou_wangping: {
        generalId: 'yangzhou_wangping',
        battleName: '兴势之战',
        battleYear: 244,
        battleType: 'field',
        targetName: '兴势山',
        targetCityId: 'city_yangxian',
        targetLat: 33.352,
        targetLng: 107.582,
        myTroops: 30000,
        enemyFactionId: 'cao_d',
        enemyFactionName: '曹魏',
        enemyGeneralName: '曹爽',
        enemyTroops: 80000,
        introLines: [
            { speaker: 'general', text: '曹魏大将军曹爽统十万大军入骆谷，直扑我汉中门户兴势山！关中道远，若放贼出谷则汉中危矣，某已率无当飞军据守兴势山岭，壮士可愿随我就地迎头痛击魏军？' },
            { speaker: 'player', text: '愿随王镇北大将军率无当飞军据险死战，将曹爽大军死死挡在兴势山下！' },
        ],
    },

    // #109 马忠 (188 ~ 249) — 公元233年平定南中刘胄之战（本城就地开战）
    nanzhong_mazhong: {
        generalId: 'nanzhong_mazhong',
        battleName: '平定南中之战',
        battleYear: 233,
        battleType: 'field',
        targetName: '宛温南中',
        targetCityId: 'city_wanwen',
        targetLat: 25.09,
        targetLng: 104.89,
        myTroops: 25000,
        enemyFactionId: 'cuanshi',
        enemyFactionName: '南中叛军',
        enemyGeneralName: '刘胄',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '南中豪帅刘胄聚众复叛，骚动诸郡逼近宛温！丞相拜某为庲降都督总摄南疆，正欲一战斩刘胄以安边夷，壮士可愿随我于此就地讨贼？' },
            { speaker: 'player', text: '愿随马庲降都督于宛温就地出击，斩杀刘胄、安定南中七郡！' },
        ],
    },

    // #110 邓艾 (197 ~ 264) — 公元263年偷渡阴平灭蜀之战
    wudu_dengai: {
        generalId: 'wudu_dengai',
        battleName: '绵竹成都灭蜀之战',
        battleYear: 263,
        battleType: 'siege',
        targetName: '成都绵竹',
        targetCityId: 'city_chengdu',
        targetLat: 30.57,
        targetLng: 104.07,
        myTroops: 30000,
        enemyFactionId: 'shu',
        enemyFactionName: '蜀汉',
        enemyGeneralName: '诸葛瞻',
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '姜维主力被钟会牵制于剑阁，阴平小道虽悬崖绝壁七百里无人烟，然出其不意直捣江油、绵竹与成都，不世之功就在眼前！壮士可愿随老夫裹毡滚山、奇袭成都？' },
            { speaker: 'player', text: '愿随邓征西将军自武都阴平奇袭南下，破诸葛瞻、兵临成都城下！' },
        ],
    },

    // #111 姜维 (202 ~ 264) — 公元255年洮西大捷
    qingqiang_jiangwei: {
        generalId: 'qingqiang_jiangwei',
        battleName: '洮西大捷',
        battleYear: 255,
        battleType: 'field',
        targetName: '武都狄道',
        targetCityId: 'city_ganquanyi',
        targetLat: 33.4293,
        targetLng: 105.1419,
        myTroops: 45000,
        enemyFactionId: 'wudu',
        enemyFactionName: '曹魏',
        enemyGeneralName: '王经',
        enemyTroops: 55000,
        introLines: [
            { speaker: 'general', text: '丞相遗志未酬，维纵九死亦当克复中原！今曹魏雍州刺史王经渡洮水迎战，背水列阵乃兵家大忌，壮士可愿随伯约北出武都洮西，杀魏军数万于洮水之中？' },
            { speaker: 'player', text: '愿随姜大将军北出伐魏，于洮西大破王经、重振大汉声威！' },
        ],
    },

    // #112 沙普尔 (215 ~ 270) — 公元260年埃德萨之战
    aba_shapuer: {
        generalId: 'aba_shapuer',
        battleName: '埃德萨之战',
        battleYear: 260,
        battleType: 'field',
        targetName: '埃德萨',
        targetCityId: 'city_aidesa',
        targetLat: 37.15,
        targetLng: 38.7825,
        myTroops: 60000,
        enemyFactionId: 'luoma_diguo',
        enemyFactionName: '罗马帝国',
        enemyGeneralName: '瓦勒良',
        enemyTroops: 70000,
        introLines: [
            { speaker: 'general', text: '罗马皇帝瓦勒良亲率七万大军东进美索不达米亚，企图解埃德萨之围！我伊朗与非伊朗万王之王的萨珊铁骑已整装待发，勇士可愿随我西征埃德萨、活捉罗马皇帝？' },
            { speaker: 'player', text: '愿随沙普尔大王西进埃德萨，全歼罗马主力、生擒瓦勒良皇帝！' },
        ],
    },

    // #113 芝诺比娅 (240 ~ 274) — 公元272年伊姆前会战
    paermila_zhinuobiya: {
        generalId: 'paermila_zhinuobiya',
        battleName: '安提俄基亚会战',
        battleYear: 272,
        battleType: 'field',
        targetName: '安提俄基亚',
        targetCityId: 'city_antiejiya',
        targetLat: 36.2,
        targetLng: 36.16,
        myTroops: 45000,
        enemyFactionId: 'luoma_diguo',
        enemyFactionName: '罗马帝国',
        enemyGeneralName: '奥勒良',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '罗马皇帝奥勒良率军进犯叙利亚，已逼近奥龙特斯河畔的安提俄基亚！我帕尔米拉重装具装骑兵与沙漠弓手绝不向罗马屈膝，勇士可愿随本女王迎战奥勒良？' },
            { speaker: 'player', text: '愿随芝诺比娅女王挥师安提俄基亚，以帕尔米拉铁骑迎击奥勒良！' },
        ],
    },

    // #114 李特 (250 ~ 303) — 公元301年绵竹破罗尚之战（本城就地开战）
    chenghan_lite: {
        generalId: 'chenghan_lite',
        battleName: '绵竹鹿头关之战',
        battleYear: 301,
        battleType: 'field',
        targetName: '鹿头关绵竹',
        targetCityId: 'city_mianzhuguan',
        targetLat: 31.32549,
        targetLng: 104.172363,
        myTroops: 30000,
        enemyFactionId: 'shu',
        enemyFactionName: '西晋',
        enemyGeneralName: '罗尚',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '关陇六郡流民入蜀求活，西晋益州刺史罗尚非但不加抚恤，反而发大军逼迫劫掠我鹿头关绵竹大营！官逼民反，壮士可愿随我于此鹿头关就地设伏痛击晋军？' },
            { speaker: 'player', text: '愿随李镇北大将军于鹿头关就地奋战，大破罗尚晋军、开创巴蜀基业！' },
        ],
    },

    // #115 祖逖 (266 ~ 321) — 公元320年雍丘破桃豹之战（本城就地开战）
    yuzhou_zuti: {
        generalId: 'yuzhou_zuti',
        battleName: '雍丘北伐之战',
        battleYear: 320,
        battleType: 'field',
        targetName: '雍丘',
        targetCityId: 'city_yongqiu',
        targetLat: 34.55,
        targetLng: 114.78,
        myTroops: 30000,
        enemyFactionId: 'cai',
        enemyFactionName: '后赵',
        enemyGeneralName: '桃豹',
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '祖逖中流击楫，誓不清中原而复济者有如大江！今石勒遣大将桃豹率数万骑来争雍丘，壮士可愿随我于雍丘城外就地合围痛击后赵胡骑、收复黄河以南？' },
            { speaker: 'player', text: '愿随祖豫州于雍丘就地血战，大破桃豹后赵军、光复中原山河！' },
        ],
    },

    // #116 君士坦丁 (272 ~ 337) — 公元312年米尔维安大桥之战
    gen_constantine_great: {
        generalId: 'gen_constantine_great',
        battleName: '米尔维安大桥之战',
        battleYear: 312,
        battleType: 'field',
        targetName: '罗马米尔维安桥',
        targetCityId: 'city_luoma',
        targetLat: 41.9,
        targetLng: 12.49,
        myTroops: 40000,
        enemyFactionId: 'luoma_diguo',
        enemyFactionName: '西罗马',
        enemyGeneralName: '马克森提乌斯',
        enemyTroops: 60000,
        introLines: [
            { speaker: 'general', text: '僭主马克森提乌斯盘踞永恒之城罗马，在台伯河米尔维安大桥布下重兵！苍穹之上已现“凭此记号你必得胜”之异象，勇士可愿随我自特里尔南下罗马一统帝国？' },
            { speaker: 'player', text: '愿随君士坦丁大帝挥师南下罗马，在米尔维安大桥击溃马克森提乌斯！' },
        ],
    },

    // #117 石勒 (274 ~ 333) — 公元311年宁平城之战（本城就地开战）
    cai_lishuo: {
        generalId: 'cai_lishuo',
        battleName: '苦县宁平城之战',
        battleYear: 311,
        battleType: 'field',
        targetName: '新蔡宁平',
        targetCityId: 'city_chenjun',
        targetLat: 32.75,
        targetLng: 114.98,
        myTroops: 50000,
        enemyFactionId: 'yuzhou',
        enemyFactionName: '西晋',
        enemyGeneralName: '王衍',
        enemyTroops: 80000,
        introLines: [
            { speaker: 'general', text: '西晋太尉王衍率十万晋军主力扶东海王灵柩东归，现已行至新蔡苦县宁平城一带！晋室王公清谈误国、军心涣散，壮士可愿随我轻骑围而射之、就地全歼西晋最后的野战主力？' },
            { speaker: 'player', text: '愿随石将军铁骑合围，于宁平城就地覆灭王衍十万晋军！' },
        ],
    },

    // #118 慕容皝 (297 ~ 348) — 公元342年龙城破石虎之战（本城就地开战）
    yingzhou_ying_d_muronghuang: {
        generalId: 'yingzhou_ying_d_muronghuang',
        battleName: '龙城高句丽与后赵之战',
        battleYear: 342,
        battleType: 'field',
        targetName: '朝阳龙城',
        targetCityId: 'city_chaoyang',
        targetLat: 41.57,
        targetLng: 120.45,
        myTroops: 40000,
        enemyFactionId: 'cai',
        enemyFactionName: '后赵',
        enemyGeneralName: '石虎',
        enemyTroops: 70000,
        introLines: [
            { speaker: 'general', text: '后赵天王石虎纠合数十万大军北犯我燕国都城朝阳龙城！彼军远来粮道漫长，我大燕铁骑正可凭坚城待其疲敝而逆击之，壮士可愿随本王就地破敌？' },
            { speaker: 'player', text: '愿随燕王于龙城之下就地出击，杀得石虎后赵大军丢盔弃甲！' },
        ],
    },

    // #119 桓温 (312 ~ 373) — 公元347年桓温灭成汉之战
    danyang_huanwen: {
        generalId: 'danyang_huanwen',
        battleName: '成都笮桥灭蜀之战',
        battleYear: 347,
        battleType: 'siege',
        targetName: '成都',
        targetCityId: 'city_chengdu',
        targetLat: 30.57,
        targetLng: 104.07,
        myTroops: 30000,
        enemyFactionId: 'chenghan',
        enemyFactionName: '成汉',
        enemyGeneralName: '李势',
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '大丈夫不能流芳百世，亦当遗臭万年！今巴蜀成汉主李势荒淫无道，温已率江东精锐溯江而上弃舟步进，壮士可愿随我直取成都笮桥、一战平蜀？' },
            { speaker: 'player', text: '愿随桓大司马溯江入蜀，于成都城下击破李势、收复巴蜀之地！' },
        ],
    },

    // #120 埃扎纳 (320 ~ 360) — 公元350年麦罗埃远征战（本城就地开战）
    gen_ezana: {
        generalId: 'gen_ezana',
        battleName: '阿克苏姆远征库施之战',
        battleYear: 350,
        battleType: 'field',
        targetName: '阿克苏姆',
        targetCityId: 'city_aksum',
        targetLat: 14.13,
        targetLng: 38.72,
        myTroops: 35000,
        enemyFactionId: 'saimien',
        enemyFactionName: '库施',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '北方努比亚与库施诸部屡次袭扰我阿克苏姆商队与边境！我众王之王已整顿大军，勇士可愿随我于此出击、彻底终结库施王国的威权？' },
            { speaker: 'player', text: '愿随埃扎纳国王就地挥师，大破库施大军、扬威红海与尼罗河畔！' },
        ],
    },

    // #121 冉闵 (322 ~ 352) — 公元350年苍亭破襄国之战（本城就地开战）
    ranwei_d_ranmin: {
        generalId: 'ranwei_d_ranmin',
        battleName: '巨鹿苍亭之战',
        battleYear: 350,
        battleType: 'field',
        targetName: '巨鹿',
        targetCityId: 'city_liyang',
        targetLat: 37.22,
        targetLng: 115.04,
        myTroops: 30000,
        enemyFactionId: 'cai',
        enemyFactionName: '后赵',
        enemyGeneralName: '石祗',
        enemyTroops: 70000,
        introLines: [
            { speaker: 'general', text: '后赵残主石祗纠合诸胡十余万众猛扑我巨鹿！朕跨朱龙宝马，左手双刃矛、右手钩戟，正欲率大魏锐士迎头冲杀，壮士可愿随朕就地死战？' },
            { speaker: 'player', text: '愿随冉天王于巨鹿就地血战，冲杀石祗叛军、保卫中州百姓！' },
        ],
    },

    // #122 慕容恪 (323 ~ 367) — 公元352年廉台之战
    murong_murongke: {
        generalId: 'murong_murongke',
        battleName: '魏昌廉台之战',
        battleYear: 352,
        battleType: 'field',
        targetName: '中山廉台',
        targetCityId: 'city_zhongshan',
        targetLat: 38.4708,
        targetLng: 115.0626,
        myTroops: 50000,
        enemyFactionId: 'ranwei_d',
        enemyFactionName: '冉魏',
        enemyGeneralName: '冉闵',
        enemyGeneralId: 'ranwei_d_ranmin',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '冉闵虽勇猛无敌，然步卒少而饥疲，现已退入中山魏昌廉台林间！恪已备下五千连环铁马锁阵，诱敌入平地而合围之，壮士可愿随我南下中山擒拿冉闵？' },
            { speaker: 'player', text: '愿随太原王南下中山廉台，以连环马阵合围生擒冉闵！' },
        ],
    },

    // #123 王猛 (325 ~ 375) — 公元370年潞川灭前燕之战
    fushi_wangmeng: {
        generalId: 'fushi_wangmeng',
        battleName: '潞川灭燕之战',
        battleYear: 370,
        battleType: 'field',
        targetName: '洛阳潞川',
        targetCityId: 'city_luoyang',
        targetLat: 34.62,
        targetLng: 112.45,
        myTroops: 60000,
        enemyFactionId: 'murong',
        enemyFactionName: '前燕',
        enemyGeneralName: '慕容评',
        enemyTroops: 100000,
        introLines: [
            { speaker: 'general', text: '前燕太傅慕容评统三十万大军屯于潞川，然彼贪鄙无厌、竟向士卒卖水卖薪！秦王天王亲托国政于猛，已遣轻骑奇袭焚其粮草，壮士可愿随我东进决战、一战灭燕？' },
            { speaker: 'player', text: '愿随王丞相东出潞川，乘燕军粮尽军乱一举覆灭前燕主力！' },
        ],
    },

    // #124 慕容垂 (326 ~ 396) — 公元369年枋头之战
    dingzhou_d_murongchui: {
        generalId: 'dingzhou_d_murongchui',
        battleName: '枋头之战',
        battleYear: 369,
        battleType: 'field',
        targetName: '开封枋头',
        targetCityId: 'city_bianliang',
        targetLat: 34.8,
        targetLng: 114.31,
        myTroops: 50000,
        enemyFactionId: 'danyang',
        enemyFactionName: '东晋',
        enemyGeneralName: '桓温',
        enemyGeneralId: 'danyang_huanwen',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '东晋大司马桓温北伐深入枋头，今粮道已断、焚舟步退！垂已先遣八千精骑疾驰襄邑伏于东涧，正欲前后夹击追亡逐北，壮士可愿随我南下痛击桓温？' },
            { speaker: 'player', text: '愿随吴王铁骑南下枋头与襄邑，追击大破桓温北伐晋军！' },
        ],
    },

    // #125 尤里安 (331 ~ 363) — 公元357年斯特拉斯堡之战（本城就地开战）
    gen_julian_apostate: {
        generalId: 'gen_julian_apostate',
        battleName: '斯特拉斯堡之战',
        battleYear: 357,
        battleType: 'field',
        targetName: '斯特拉斯堡',
        targetCityId: 'city_sitelasibao',
        targetLat: 48.57,
        targetLng: 7.75,
        myTroops: 15000,
        enemyFactionId: 'rierman',
        enemyFactionName: '阿勒曼尼',
        enemyGeneralName: '科诺多马尔',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '阿勒曼尼大王科诺多马尔联合七部日耳曼国王渡过莱茵河，正在斯特拉斯堡城外列阵！为了高卢行省的安危，勇士可愿随本凯撒就地迎战、将日耳曼人赶回莱茵河东岸？' },
            { speaker: 'player', text: '愿随尤里安凯撒于斯特拉斯堡就地决战，生擒阿勒曼尼王科诺多马尔！' },
        ],
    },

    // #126 谢玄 (343 ~ 388) — 公元383年淝水之战（本城就地开战）
    zhong_xiexuan: {
        generalId: 'zhong_xiexuan',
        battleName: '淝水之战',
        battleYear: 383,
        battleType: 'field',
        targetName: '寿春淝水',
        targetCityId: 'city_shouxian',
        targetLat: 32.59,
        targetLng: 116.8,
        myTroops: 80000,
        enemyFactionId: 'fushi',
        enemyFactionName: '前秦',
        enemyGeneralName: '苻坚',
        enemyTroops: 100000,
        introLines: [
            { speaker: 'general', text: '前秦天王苻坚号称百万大军南下，投鞭断流，前锋已列阵于寿春淝水西岸！玄已请秦军稍退以渡水决战，壮士可愿随我北府兵乘其后退自乱之际，渡淝水就地掩杀？' },
            { speaker: 'player', text: '愿随谢康乐率北府精兵于寿春淝水就地出击，令秦军风声鹤唳、草木皆兵！' },
        ],
    },

    // #127 社仑 (360 ~ 410) — 公元402年漠北立汗庭之战（本城就地开战）
    rouran_shelun: {
        generalId: 'rouran_shelun',
        battleName: '漠北平高车之战',
        battleYear: 402,
        battleType: 'field',
        targetName: '赛尔乌苏漠北',
        targetCityId: 'city_saierwusu',
        targetLat: 44.818872,
        targetLng: 106.800842,
        myTroops: 40000,
        enemyFactionId: 'gaoche',
        enemyFactionName: '高车',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '我柔然已渡大漠北据弱洛水，然高车敕勒诸部仍不服王化，集结大军来攻赛尔乌苏王庭！勇士可愿随本丘豆伐可汗就地纵马迎敌、一统大漠南北？' },
            { speaker: 'player', text: '愿随社仑可汗于赛尔乌苏就地出击，收服高车诸部、威震漠北！' },
        ],
    },

    // #128 刘裕 (363 ~ 422) — 公元410年广固灭南燕之战
    wang_d_liuyu: {
        generalId: 'wang_d_liuyu',
        battleName: '广固灭南燕之战',
        battleYear: 410,
        battleType: 'siege',
        targetName: '临淄广固',
        targetCityId: 'city_linzi',
        targetLat: 36.88,
        targetLng: 118.43,
        myTroops: 60000,
        enemyFactionId: 'murong',
        enemyFactionName: '南燕',
        enemyGeneralName: '慕容超',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '金戈铁马，气吞万里如虎！南燕主慕容超纵兵南掠淮北，竟不守大岘山之险，已成我瓮中之鳖！壮士可愿随刘寄奴自琅琊北过泰山、直捣广固临淄灭亡南燕？' },
            { speaker: 'player', text: '愿随刘太尉挥师北伐过岘山，攻克广固、生擒慕容超！' },
        ],
    },

    // #129 沮渠蒙逊 (368 ~ 433) — 公元412年姑臧夺河西之战
    juqu_d_juqumengxun: {
        generalId: 'juqu_d_juqumengxun',
        battleName: '河西破南凉之战',
        battleYear: 412,
        battleType: 'field',
        targetName: '张掖姑臧',
        targetCityId: 'city_zhangye',
        targetLat: 38.93,
        targetLng: 100.45,
        myTroops: 35000,
        enemyFactionId: 'tufa_d',
        enemyFactionName: '南凉',
        enemyGeneralName: '秃发傉檀',
        enemyGeneralId: 'tufa_d_tufanutan',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '南凉王秃发傉檀屡次进犯我北凉河西走廊！今我军兵精粮足，当自表氏挥师东进夺取张掖与姑臧，壮士可愿随本王一战确立北凉霸业？' },
            { speaker: 'player', text: '愿随河西王东进张掖，大破秃发傉檀、席卷河西走廊！' },
        ],
    },

    // #130 亚拉里克 (370 ~ 410) — 公元410年罗马围城之战
    gen_alaric: {
        generalId: 'gen_alaric',
        battleName: '罗马围城之战',
        battleYear: 410,
        battleType: 'siege',
        targetName: '罗马城',
        targetCityId: 'city_luoma',
        targetLat: 41.9,
        targetLng: 12.49,
        myTroops: 40000,
        enemyFactionId: 'luoma_diguo',
        enemyFactionName: '西罗马',
        enemyGeneralName: '霍诺留',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '西罗马皇帝霍诺留屡次背信弃义，拒绝给我西哥特族人合法的定居之地！密草比疏草更容易割刈，勇士可愿随我挥师北上攻破罗马撒拉里亚城门？' },
            { speaker: 'player', text: '愿随亚拉里克国王进军罗马，用刀剑为西哥特人夺取应得的荣耀！' },
        ],
    },

    // #131 拓跋珪 (371 ~ 409) — 公元395年参合陂之战（本城就地开战）
    tuoba_tuobagui: {
        generalId: 'tuoba_tuobagui',
        battleName: '参合陂之战',
        battleYear: 395,
        battleType: 'field',
        targetName: '大同参合陂',
        targetCityId: 'city_datong',
        targetLat: 40.08,
        targetLng: 113.3,
        myTroops: 40000,
        enemyFactionId: 'dingzhou',
        enemyFactionName: '后燕',
        enemyGeneralName: '慕容宝',
        enemyTroops: 70000,
        introLines: [
            { speaker: 'general', text: '后燕太子慕容宝率八万大军远征五原，因黄河冰未合而烧船夜遁，现正宿营于大同东侧参合陂谷地！彼军以我远在河西必不设防，壮士可愿随朕精选两万铁骑倍道兼行、就地夜袭参合陂？' },
            { speaker: 'player', text: '愿随魏王铁骑神速突袭，于参合陂就地全歼慕容宝后燕大军！' },
        ],
    },

    // #132 赫连勃勃 (381 ~ 425) — 公元407年阳武下口破南凉之战（本城就地开战）
    helian_helianbobo: {
        generalId: 'helian_helianbobo',
        battleName: '阳武下口之战',
        battleYear: 407,
        battleType: 'field',
        targetName: '统万城阳武',
        targetCityId: 'city_tongwancheng',
        targetLat: 38.024286,
        targetLng: 109.14917,
        myTroops: 30000,
        enemyFactionId: 'tufa_d',
        enemyFactionName: '南凉',
        enemyGeneralName: '秃发傉檀',
        enemyGeneralId: 'tufa_d_tufanutan',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '南凉王秃发傉檀率五万众北犯我大夏统万城下！阳武下口山道狭长，朕已诱其深入险谷，壮士可愿随朕以铁骑截断首尾、就地筑京观以显武功？' },
            { speaker: 'player', text: '愿随大夏天王于统万城外就地合围，大破秃发傉檀南凉主力！' },
        ],
    },

    // #133 乞伏炽磐 (386 ~ 428) — 公元414年乐都灭南凉之战
    qifu_d_qifuchipan: {
        generalId: 'qifu_d_qifuchipan',
        battleName: '乐都灭南凉之战',
        battleYear: 414,
        battleType: 'siege',
        targetName: '允吾乐都',
        targetCityId: 'city_yunwu',
        targetLat: 36.301845,
        targetLng: 102.897949,
        myTroops: 30000,
        enemyFactionId: 'tufa_d',
        enemyFactionName: '南凉',
        enemyGeneralName: '秃发虎台',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '南凉王秃发傉檀西击乙弗，仅留太子秃发虎台留守乐都允吾！天赐良机不可失，壮士可愿随本王自枹罕轻骑倍道兼行、一举攻克乐都吞并南凉？' },
            { speaker: 'player', text: '愿随西秦王自枹罕疾驰北上，奇袭攻克乐都、一战灭亡南凉！' },
        ],
    },

    // #134 阿提拉 (406 ~ 453) — 公元451年帝国会战（本城就地开战）
    xiongren_atila: {
        generalId: 'xiongren_atila',
        battleName: '多瑙河破罗马之战',
        battleYear: 447,
        battleType: 'field',
        targetName: '塞格德多瑙河',
        targetCityId: 'city_saigede',
        targetLat: 46.25,
        targetLng: 20.15,
        myTroops: 70000,
        enemyFactionId: 'luoma_diguo',
        enemyFactionName: '罗马帝国',
        enemyGeneralName: '阿纳加斯特',
        enemyTroops: 60000,
        introLines: [
            { speaker: 'general', text: '我是上帝之鞭阿提拉，我铁蹄踏过之处寸草不生！罗马帝国统帅阿纳加斯特竟敢率军渡过多瑙河逼近我蒂萨河塞格德王庭，勇士可愿随我策马弯弓、就地踏平罗马军团？' },
            { speaker: 'player', text: '愿随阿提拉大单于策马冲锋，于塞格德多瑙河畔就地粉碎罗马军团！' },
        ],
    },

    // #135 阿赫雄 (430 ~ 484) — 公元484年赫拉特大破波斯之战（本城就地开战）
    yada_ahexiong: {
        generalId: 'yada_ahexiong',
        battleName: '呼罗珊大破萨珊之战',
        battleYear: 484,
        battleType: 'field',
        targetName: '悉万斤呼罗珊',
        targetCityId: 'city_xiwanjin',
        targetLat: 36.66,
        targetLng: 65.75,
        myTroops: 50000,
        enemyFactionId: 'sashan',
        enemyFactionName: '萨珊波斯',
        enemyGeneralName: '卑路斯一世',
        enemyTroops: 70000,
        introLines: [
            { speaker: 'general', text: '萨珊波斯万王之王卑路斯一世背弃盟约，亲率十万铁骑东犯我嚈哒悉万斤王庭！我已在阵前掘下数里长的深壕陷马坑，勇士可愿随我诱敌入伏、就地全歼波斯王室大军？' },
            { speaker: 'player', text: '愿随阿赫雄大王于悉万斤就地诱敌伏击，令卑路斯一世与波斯铁骑葬身壕沟！' },
        ],
    },

    // #136 韦睿 (442 ~ 520) — 公元507年钟离大捷（本城就地开战）
    hao_d_weirui: {
        generalId: 'hao_d_weirui',
        battleName: '钟离大捷',
        battleYear: 507,
        battleType: 'field',
        targetName: '钟离邵阳洲',
        targetCityId: 'city_bengbu',
        targetLat: 32.92,
        targetLng: 117.38,
        myTroops: 50000,
        enemyFactionId: 'tuoba',
        enemyFactionName: '北魏',
        enemyGeneralName: '元英',
        enemyTroops: 100000,
        introLines: [
            { speaker: 'general', text: '北魏中山王元英、杨大眼统数十万众围困钟离，在淮水邵阳洲上架设跨淮浮桥！今春淮水暴涨，正可乘高舰纵火焚其浮桥，壮士可愿随老夫于钟离就地反击、杀得魏军投淮死者十余万？' },
            { speaker: 'player', text: '愿随韦豫州于钟离就地火烧邵阳洲浮桥，大破元英与杨大眼北魏主力！' },
        ],
    },

    // #137 狄奥多里克 (454 ~ 526) — 公元493年拉文纳围城战（本城就地开战）
    gen_theodoric_great: {
        generalId: 'gen_theodoric_great',
        battleName: '拉文纳之战',
        battleYear: 493,
        battleType: 'siege',
        targetName: '拉文纳',
        targetCityId: 'city_ravenna',
        targetLat: 44.41,
        targetLng: 12.2,
        myTroops: 40000,
        enemyFactionId: 'rierman',
        enemyFactionName: '意大利王国',
        enemyGeneralName: '奥多亚克',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '篡夺罗马王冠的奥多亚克已在阿达河连败，退入沼泽环绕的拉文纳坚城做困兽之斗！我东哥特大军已合围拉文纳，勇士可愿随我就地发起最后总攻、一统意大利？' },
            { speaker: 'player', text: '愿随狄奥多里克大王于拉文纳就地攻城，击败奥多亚克、建立东哥特王国！' },
        ],
    },

    // #138 头罗曼 (455 ~ 515) — 公元498年犍陀罗南征之战
    yanda_touluoman: {
        generalId: 'yanda_touluoman',
        battleName: '犍陀罗南征之战',
        battleYear: 498,
        battleType: 'field',
        targetName: '白沙瓦犍陀罗',
        targetCityId: 'city_baishawa',
        targetLat: 34.01,
        targetLng: 71.52,
        myTroops: 50000,
        enemyFactionId: 'jibin',
        enemyFactionName: '笈多帝国',
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '我阿尔洪白匈奴铁骑已饮马阿姆河，南方便是富庶的犍陀罗与印度平原！勇士可愿随本大王自德拉普萨卡翻越山口，直下白沙瓦击溃笈多守军？' },
            { speaker: 'player', text: '愿随头罗曼大王铁骑南下白沙瓦，征服犍陀罗与北印平原！' },
        ],
    },

    // #139 萧衍 (464 ~ 549) — 公元501年建康起义灭东昏侯之战
    xiao_d_xiaoyan: {
        generalId: 'xiao_d_xiaoyan',
        battleName: '建康平乱之战',
        battleYear: 501,
        battleType: 'siege',
        targetName: '金陵建康',
        targetCityId: 'city_nanjing',
        targetLat: 32.05,
        targetLng: 118.77,
        myTroops: 50000,
        enemyFactionId: 'jinling',
        enemyFactionName: '南齐',
        enemyGeneralName: '王珍国',
        enemyTroops: 60000,
        introLines: [
            { speaker: 'general', text: '南齐东昏侯萧宝卷暴虐无道、诛戮勋臣！衍已自襄阳起义师顺江东下，南齐卫尉王珍国正陈兵建康朱雀航，壮士可愿随我攻克建康、吊民伐罪？' },
            { speaker: 'player', text: '愿随萧公顺江东指金陵建康，击破朱雀航守军、开创大梁盛世！' },
        ],
    },

    // #140 克洛维 (466 ~ 511) — 公元486年苏瓦松之战（本城就地开战）
    gen_clovis_i: {
        generalId: 'gen_clovis_i',
        battleName: '高卢苏瓦松之战',
        battleYear: 486,
        battleType: 'field',
        targetName: '里昂高卢',
        targetCityId: 'city_lyon',
        targetLat: 45.76,
        targetLng: 4.83,
        myTroops: 30000,
        enemyFactionId: 'luoma_diguo',
        enemyFactionName: '苏瓦松王国',
        enemyGeneralName: '西亚格里乌斯',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '高卢最后的罗马统治者西亚格里乌斯仍在抗拒我法兰克人的王权！我撒利法兰克战斧兵已集结完毕，勇士可愿随我就地迎战、终结罗马在高卢最后的残余统治？' },
            { speaker: 'player', text: '愿随克洛维国王于高卢就地决战，击败西亚格里乌斯、奠定法兰克王国霸业！' },
        ],
    },
};

export function getGeneralFirstBattle(generalId: string | null | undefined): GeneralFirstBattle | null {
    if (!generalId) return null;
    return GENERAL_FIRST_BATTLES[generalId] ?? null;
}

export function getFirstBattleEnemySyntheticId(generalId: string): string {
    return `fb_enemy_${generalId}`;
}

export function isFirstBattleEnemySyntheticId(id: string | null | undefined): boolean {
    return !!id && id.startsWith('fb_enemy_');
}

export function getFirstBattleByEnemySyntheticId(id: string | null | undefined): GeneralFirstBattle | null {
    if (!id || !id.startsWith('fb_enemy_')) return null;
    const ownerGeneralId = id.slice('fb_enemy_'.length);
    return GENERAL_FIRST_BATTLES[ownerGeneralId] ?? null;
}

export function resolveFirstBattleEnemyDisplayName(fb: GeneralFirstBattle): string {
    const trimmed = fb.enemyGeneralName?.trim();
    if (trimmed) return trimmed;
    return `${fb.enemyFactionName}武将`;
}
