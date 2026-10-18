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
    /** 我方在此战中的攻守身份：'attacker' 进攻方（默认） | 'defender' 防守方（本地迎击/保卫战） */
    role?: 'attacker' | 'defender';
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
        role: 'attacker',
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
        role: 'attacker',
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
        role: 'attacker',
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
        role: 'attacker',
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
        role: 'attacker',
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
        role: 'attacker',
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
        role: 'attacker',
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
        role: 'attacker',
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
        role: 'attacker',
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
        role: 'attacker',
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
        role: 'attacker',
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
        role: 'defender',
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
        role: 'attacker',
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
        role: 'attacker',
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
        role: 'attacker',
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
        role: 'attacker',
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
        role: 'attacker',
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
        role: 'attacker',
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
        role: 'attacker',
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
        role: 'attacker',
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
        role: 'attacker',
        targetName: '阴晋',
        targetCityId: 'city_xiayangdu',
        targetLat: 35.58,
        targetLng: 110.65,
        myTroops: 50000,
        enemyFactionId: 'qin',
        enemyFactionName: '秦国',
        enemyGeneralName: '秦惠公',
        enemyTroops: 100000,
        introLines: [
            { speaker: 'general', text: '秦人起大军犯我西河，我已选拔魏武卒五万，以一当十！壮士可愿随我直插阴晋，痛击秦军？' },
            { speaker: 'player', text: '愿入吴将军魏武卒帐下，奔赴阴晋大破秦师！' },
        ],
    },

    // #22 阿泰阿斯 (-429 ~ -339) — 公元前339年斯基泰草原会战（本城就地开战）
    sijitai_ateas: {
        generalId: 'sijitai_ateas',
        battleName: '斯基泰草原会战',
        battleYear: -339,
        battleType: 'field',
        role: 'defender',
        targetName: '塔纳伊斯',
        targetCityId: 'city_asu',
        targetLat: 47.23,
        targetLng: 39.7,
        myTroops: 30000,
        enemyFactionId: 'maqidun',
        enemyFactionName: '马其顿',
        enemyGeneralId: 'gen_philip_ii',
        enemyGeneralName: '腓力二世',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '马其顿的腓力老贼贪图我草原的牛羊战马，竟敢跨越多瑙河！草原的勇士，上马挽弓，随我踏碎敌阵！' },
            { speaker: 'player', text: '愿随阿泰阿斯大王策马出击，迎战腓力二世！' },
        ],
    },

    // #23 阿契塔 (-428 ~ -347) — 公元前367年塔兰托保卫战（本城就地开战）
    talanduo_aqita: {
        generalId: 'talanduo_aqita',
        battleName: '塔兰托保卫战',
        battleYear: -367,
        battleType: 'field',
        role: 'defender',
        targetName: '塔兰托',
        targetCityId: 'city_talanduo',
        targetLat: 40.47,
        targetLng: 17.24,
        myTroops: 25000,
        enemyFactionId: 'baerta',
        enemyFactionName: '卢卡尼亚',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '蛮族卢卡尼亚人连年侵扰我大希腊城邦，塔兰托生死在此一举。异邦的勇士，请握紧长矛，与我共卫城邦！' },
            { speaker: 'player', text: '愿随阿契塔将军出城迎战，捍卫塔兰托与大希腊同盟！' },
        ],
    },

    // #24 内克塔内布一世 (-420 ~ -360) — 公元前373年佩鲁西姆抗波之战
    aiji_neiketaneibu: {
        generalId: 'aiji_neiketaneibu',
        battleName: '佩鲁西姆抗波之战',
        battleYear: -373,
        battleType: 'field',
        role: 'attacker',
        targetName: '佩鲁西姆',
        targetCityId: 'city_peiluximu',
        targetLat: 31.0417,
        targetLng: 32.545,
        myTroops: 40000,
        enemyFactionId: 'bosidiguo',
        enemyFactionName: '波斯帝国',
        enemyGeneralName: '法尔纳巴佐斯',
        enemyTroops: 70000,
        introLines: [
            { speaker: 'general', text: '波斯总督引希腊雇佣军企图再次奴役埃及，尼罗河泛滥在即，壮士快快入伍，随我赴佩鲁西姆决战！' },
            { speaker: 'player', text: '愿随法老北赴佩鲁西姆，将法尔纳巴佐斯大军逐出埃及！' },
        ],
    },

    // #25 卡布里亚斯 (-420 ~ -357) — 公元前376年纳克索斯海陆会战（本城就地开战）
    gen_chabrias: {
        generalId: 'gen_chabrias',
        battleName: '纳克索斯海陆会战',
        battleYear: -376,
        battleType: 'field',
        role: 'defender',
        targetName: '希马鲁塔',
        targetCityId: 'city_chimarros',
        targetLat: 36.965,
        targetLng: 25.53,
        myTroops: 20000,
        enemyFactionId: 'lagoniya',
        enemyFactionName: '斯巴达',
        enemyGeneralName: '波利斯',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '斯巴达舰队已逼近纳克索斯海湾！我军长矛已备，单膝跪地以盾迎敌。雅典的勇士，随我杀退斯巴达人！' },
            { speaker: 'player', text: '愿随卡布里亚斯将军就地决战，击溃斯巴达统帅波利斯！' },
        ],
    },

    // #26 伊巴密浓达 (-418 ~ -362) — 公元前371年留克特拉之战
    gen_epaminondas: {
        generalId: 'gen_epaminondas',
        battleName: '留克特拉之战',
        battleYear: -371,
        battleType: 'field',
        role: 'attacker',
        targetName: '留克特拉',
        targetCityId: 'city_thebes',
        targetLat: 38.32,
        targetLng: 23.31,
        myTroops: 12000,
        enemyFactionId: 'lagoniya',
        enemyFactionName: '斯巴达',
        enemyGeneralName: '克列奥姆布罗托一世',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '斯巴达的无敌神话今日必当终结！我的斜线大阵已布置妥当，英勇的壮士，随神圣军团冲锋，碾碎斯巴达王！' },
            { speaker: 'player', text: '愿随伊巴密浓达将军于留克特拉列阵冲锋，一举折断斯巴达长矛！' },
        ],
    },

    // #27 琉孔一世 (-410 ~ -355) — 公元前380年费奥多西亚攻城战
    bosi_puluosi_liukong: {
        generalId: 'bosi_puluosi_liukong',
        battleName: '费奥多西亚攻城战',
        battleYear: -380,
        battleType: 'siege',
        role: 'attacker',
        targetName: '费奥多西亚',
        targetCityId: 'city_kafa',
        targetLat: 45.03,
        targetLng: 35.38,
        myTroops: 25000,
        enemyFactionId: 'taolika',
        enemyFactionName: '赫拉克利亚',
        enemyTroops: 18000,
        introLines: [
            { speaker: 'general', text: '费奥多西亚勾结外敌阻碍黑海谷物贸易，我博斯普鲁斯大军已兵临城下。远来的勇士，入我麾下夺下坚城！' },
            { speaker: 'player', text: '愿随琉孔一世陛下西进，攻克费奥多西亚坚城！' },
        ],
    },

    // #28 帕曼纽 (-400 ~ -330) — 公元前334年格拉尼库斯河之战（本城就地开战）
    gen_parmenion: {
        generalId: 'gen_parmenion',
        battleName: '格拉尼库斯河之战',
        battleYear: -334,
        battleType: 'field',
        role: 'attacker',
        targetName: '格拉尼库斯',
        targetCityId: 'city_gelanikusi',
        targetLat: 40.32,
        targetLng: 27.28,
        myTroops: 35000,
        enemyFactionId: 'kaliya',
        enemyFactionName: '波斯帝国',
        enemyGeneralName: '罗萨西斯',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '波斯骑兵正背水列阵，国王陛下严令强渡格拉尼库斯河。勇敢的壮士，执紧萨里沙长矛，随老夫强渡破敌！' },
            { speaker: 'player', text: '愿随帕曼纽老帅强渡格拉尼库斯河，击溃波斯大军！' },
        ],
    },

    // #29 阿尔塔巴佐斯 (-389 ~ -325) — 公元前330年赫卡尼亚山地战（本城就地开战）
    hekaniya_artabazos: {
        generalId: 'hekaniya_artabazos',
        battleName: '赫卡尼亚山地战',
        battleYear: -330,
        battleType: 'field',
        role: 'defender',
        targetName: '兹拉卡塔',
        targetCityId: 'city_zilakata',
        targetLat: 36.84,
        targetLng: 54.43,
        myTroops: 20000,
        enemyFactionId: 'maqidun',
        enemyFactionName: '马其顿',
        enemyGeneralName: '克拉特鲁斯',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '大流士陛下已殁，马其顿蛮骑仍紧追不放！赫卡尼亚山林险峻，随我借地利伏击敌军先锋，保全波斯残部！' },
            { speaker: 'player', text: '愿随阿尔塔巴佐斯总督于兹拉卡塔就地列阵，迎战克拉特鲁斯！' },
        ],
    },

    // #30 孙膑 (-382 ~ -316) — 公元前342年马陵之战（本城就地开战）
    dongxian_sunbin: {
        generalId: 'dongxian_sunbin',
        battleName: '马陵之战',
        battleYear: -342,
        battleType: 'field',
        role: 'attacker',
        targetName: '马陵道',
        targetCityId: 'city_tancheng',
        targetLat: 34.549568,
        targetLng: 118.317261,
        myTroops: 50000,
        enemyFactionId: 'wei',
        enemyFactionName: '魏国',
        enemyGeneralName: '庞涓',
        enemyTroops: 80000,
        introLines: [
            { speaker: 'general', text: '魏军骄狂轻敌，庞涓正衔尾急追。我已令人沿途减灶，伏兵尽列马陵道！壮士，速速随军去收庞涓首级！' },
            { speaker: 'player', text: '愿随孙军师于马陵道万弩齐发，一战击杀庞涓！' },
        ],
    },

    // #31 腓力二世 (-382 ~ -336) — 公元前338年喀罗尼亚之战
    gen_philip_ii: {
        generalId: 'gen_philip_ii',
        battleName: '喀罗尼亚之战',
        battleYear: -338,
        battleType: 'field',
        role: 'attacker',
        targetName: '喀罗尼亚',
        targetCityId: 'city_thebes',
        targetLat: 38.32,
        targetLng: 23.31,
        myTroops: 32000,
        enemyFactionId: 'boootiya',
        enemyFactionName: '波奥蒂亚',
        enemyGeneralName: '忒阿革涅斯',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '希腊联军负隅顽抗，马其顿方阵今日便要一统全希腊！壮士，握紧长矛，与亚历山大王子一同陷阵！' },
            { speaker: 'player', text: '愿随腓力二世陛下南征喀罗尼亚，确立马其顿霸权！' },
        ],
    },

    // #32 马泽乌斯 (-380 ~ -318) — 公元前331年塔普萨库斯阻击战（本城就地开战）
    xuliya_shoujiang: {
        generalId: 'xuliya_shoujiang',
        battleName: '塔普萨库斯阻击战',
        battleYear: -331,
        battleType: 'field',
        role: 'defender',
        targetName: '塔普萨库斯',
        targetCityId: 'city_tapusakusi',
        targetLat: 35.91,
        targetLng: 38.53,
        myTroops: 30000,
        enemyFactionId: 'maqidun',
        enemyFactionName: '马其顿',
        enemyGeneralId: 'gen_alexander_great',
        enemyGeneralName: '亚历山大',
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '亚历山大正欲跨过幼发拉底河！奉大流士陛下之命，我军需焦土阻敌。远来的壮士，拿起弯刀，与我扼守渡口！' },
            { speaker: 'player', text: '愿随马泽乌斯总督于幼发拉底河畔就地扼守，阻击马其顿军！' },
        ],
    },

    // #33 斐赖的伊阿宋 (-380 ~ -324) — 公元前374年福基斯远征会战
    hesitiya_yiasong: {
        generalId: 'hesitiya_yiasong',
        battleName: '福基斯远征会战',
        battleYear: -374,
        battleType: 'field',
        role: 'attacker',
        targetName: '德尔斐',
        targetCityId: 'city_deerfei',
        targetLat: 38.48,
        targetLng: 22.5,
        myTroops: 28000,
        enemyFactionId: 'fujisi',
        enemyFactionName: '福基斯',
        enemyGeneralName: '普罗克诺斯',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '色萨利铁骑已整备完毕，整个希腊霸权唾手可得。前方的福基斯人不堪一击，勇士，随我南征德尔斐！' },
            { speaker: 'player', text: '愿随伊阿宋统帅策马南下，威服福基斯诸邦！' },
        ],
    },

    // #34 萨提巴扎尼斯 (-375 ~ -328) — 公元前328年阿里亚会战（本城就地开战）
    aliya_satibazanishi: {
        generalId: 'aliya_satibazanishi',
        battleName: '阿里亚会战',
        battleYear: -328,
        battleType: 'field',
        role: 'defender',
        targetName: '赫拉特',
        targetCityId: 'city_helate_city',
        targetLat: 34.34,
        targetLng: 62.19,
        myTroops: 20000,
        enemyFactionId: 'maqidun',
        enemyFactionName: '马其顿',
        enemyGeneralName: '埃里吉乌斯',
        enemyTroops: 22000,
        introLines: [
            { speaker: 'general', text: '西方的侵略者踏入了我们的故土阿里亚！我已经举兵反正，游牧的勇士们，随我出城与马其顿人决一死战！' },
            { speaker: 'player', text: '愿随萨提巴扎尼斯总督于赫拉特就地列阵，迎战埃里吉乌斯！' },
        ],
    },

    // #35 斯皮塔米尼斯 (-370 ~ -328) — 公元前329年波利提美图斯河之战
    sute_spitamenes: {
        generalId: 'sute_spitamenes',
        battleName: '波利提美图斯河之战',
        battleYear: -329,
        battleType: 'field',
        role: 'attacker',
        targetName: '撒马尔罕',
        targetCityId: 'city_samaerhan',
        targetLat: 39.6542,
        targetLng: 66.9597,
        myTroops: 20000,
        enemyFactionId: 'maqidun',
        enemyFactionName: '马其顿',
        enemyGeneralName: '法尔努克',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '亚历山大的偏师已被诱入泽拉夫尚河谷，粟特与塞种弓骑已经合围！壮士，上马放箭，彻底全歼敌军！' },
            { speaker: 'player', text: '愿随斯皮塔米尼斯将军奔袭撒马尔罕，围歼法尔努克所部！' },
        ],
    },

    // #36 贝苏斯 (-370 ~ -329) — 公元前330年里海门阻击战（本城就地开战）
    eerbulushi_beisusi: {
        generalId: 'eerbulushi_beisusi',
        battleName: '里海门阻击战',
        battleYear: -330,
        battleType: 'field',
        role: 'defender',
        targetName: '里海门',
        targetCityId: 'city_lihaimen',
        targetLat: 35.25,
        targetLng: 52.34,
        myTroops: 30000,
        enemyFactionId: 'maqidun',
        enemyFactionName: '马其顿',
        enemyGeneralId: 'gen_parmenion',
        enemyGeneralName: '帕曼纽',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '我已继承万王之王冠冕，东方各行省尽皆归心！马其顿大军逼近里海门，壮士，随我扼守天险，重振波斯！' },
            { speaker: 'player', text: '愿随贝苏斯扼守里海门，就地痛击来犯之敌！' },
        ],
    },

    // #37 托勒密一世 (-367 ~ -282) — 公元前321年尼罗河保卫战
    tuolemi_tuolemi: {
        generalId: 'tuolemi_tuolemi',
        battleName: '尼罗河保卫战',
        battleYear: -321,
        battleType: 'field',
        role: 'attacker',
        targetName: '佩鲁西姆',
        targetCityId: 'city_peiluximu',
        targetLat: 31.0417,
        targetLng: 32.545,
        myTroops: 35000,
        enemyFactionId: 'xiaaiji',
        enemyFactionName: '帝国摄政军',
        enemyGeneralId: 'gen_perdiccas',
        enemyGeneralName: '佩尔狄卡斯',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '摄政王佩尔狄卡斯大兵压境企图夺我埃及！骆驼要塞与尼罗河鳄鱼皆是敌军死地，壮士速来随我破敌！' },
            { speaker: 'player', text: '愿随托勒密陛下奔赴佩鲁西姆，击退佩尔狄卡斯大军！' },
        ],
    },

    // #38 涅阿库斯 (-360 ~ -300) — 公元前325年奥里泰远征战
    xinde_patalawang: {
        generalId: 'xinde_patalawang',
        battleName: '奥里泰远征战',
        battleYear: -325,
        battleType: 'field',
        role: 'attacker',
        targetName: '兰巴基亚',
        targetCityId: 'city_lanbaqiya',
        targetLat: 25.81,
        targetLng: 66.62,
        myTroops: 15000,
        enemyFactionId: 'aolitai',
        enemyFactionName: '奥里泰',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '国王命我统领舰队探索未知大洋，岸上土著部族蛮横阻击。勇敢的战士，随我离船列阵，击溃眼前顽敌！' },
            { speaker: 'player', text: '愿随涅阿库斯统帅出征兰巴基亚，击溃奥里泰阻击之敌！' },
        ],
    },

    // #39 亚历山大 (-356 ~ -323) — 公元前334年格拉尼库斯河之战
    gen_alexander_great: {
        generalId: 'gen_alexander_great',
        battleName: '格拉尼库斯河之战',
        battleYear: -334,
        battleType: 'field',
        role: 'attacker',
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
            { speaker: 'general', text: '波斯总督将大军布于对岸，以为浅滩能阻挡马其顿勇士？壮士，披上战甲，随我的同伴骑兵踏浪冲锋！' },
            { speaker: 'player', text: '愿随亚历山大东征，于格拉尼库斯河击破波斯大军！' },
        ],
    },

    // #40 司马错 (-350 ~ -280) — 公元前316年秦灭巴蜀之战
    qin_simacuo: {
        generalId: 'qin_simacuo',
        battleName: '秦灭巴蜀之战',
        battleYear: -316,
        battleType: 'siege',
        role: 'attacker',
        targetName: '葭萌关',
        targetCityId: 'city_jianmenguan',
        targetLat: 32.28,
        targetLng: 105.53,
        myTroops: 50000,
        enemyFactionId: 'shu',
        enemyFactionName: '蜀国',
        enemyGeneralName: '蜀王杜卢',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '得蜀则得楚，秦国一统之策全系于此！大军已走石牛道入蜀，壮士，入伍随某平定葭萌，尽取巴蜀沃土！' },
            { speaker: 'player', text: '愿随司马将军走石牛道南下，一举攻取葭萌、平定巴蜀！' },
        ],
    },

    // #41 赵武灵王赵雍 (-340 ~ -295) — 公元前300年北破林胡楼烦之战
    lingqiu_zhaowuling: {
        generalId: 'lingqiu_zhaowuling',
        battleName: '北破林胡楼烦之战',
        battleYear: -300,
        battleType: 'field',
        role: 'attacker',
        targetName: '雁门关',
        targetCityId: 'city_yanmenguan',
        targetLat: 39.19,
        targetLng: 112.87,
        myTroops: 50000,
        enemyFactionId: 'loufan',
        enemyFactionName: '楼烦',
        enemyGeneralName: '楼烦王',
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '我赵国胡服骑射已成，今日便要扫平林胡楼烦，拓地千里！豪杰之士，换上胡服挽良弓，随孤横扫漠南！' },
            { speaker: 'player', text: '愿随赵王驰骋雁门塞外，大破楼烦王骑兵！' },
        ],
    },

    // #42 旃陀罗笈多 (-340 ~ -297) — 公元前321年摩揭陀统一战（本城就地开战）
    kongque_zhantuoluo: {
        generalId: 'kongque_zhantuoluo',
        battleName: '摩揭陀统一战',
        battleYear: -321,
        battleType: 'siege',
        role: 'attacker',
        targetName: '华氏城',
        targetCityId: 'city_huashicheng',
        targetLat: 25.61,
        targetLng: 85.13,
        myTroops: 60000,
        enemyFactionId: 'mojietuo',
        enemyFactionName: '难陀王朝',
        enemyGeneralName: '陀那难陀',
        enemyTroops: 80000,
        introLines: [
            { speaker: 'general', text: '难陀暴君赋税苛重、民怨沸腾，考底利耶导师已为我定下破城之策！仁义之士，随孔雀战象踏碎宫门！' },
            { speaker: 'player', text: '愿随旃陀罗笈多陛下于华氏城就地总攻，推翻难陀王朝！' },
        ],
    },

    // #43 白起 (-332 ~ -257) — 公元前260年长平之战（本城就地开战）
    xin_baiqi: {
        generalId: 'xin_baiqi',
        battleName: '长平之战',
        battleYear: -260,
        battleType: 'field',
        role: 'attacker',
        targetName: '长子长平',
        targetCityId: 'city_shangdang',
        targetLat: 36.148974,
        targetLng: 113.008118,
        myTroops: 100000,
        enemyFactionId: 'zhao',
        enemyFactionName: '赵国',
        enemyGeneralName: '赵括',
        enemyTroops: 100000,
        introLines: [
            { speaker: 'general', text: '赵括狂妄轻出，赵军主力已入我合围死地！粮道已断，秦之锐士，随我坚壁截杀，务令片甲不回！' },
            { speaker: 'player', text: '愿随武安君于长平就地出击，一战全歼赵括大军！' },
        ],
    },

    // #44 皮洛士 (-319 ~ -272) — 公元前280年赫拉克利亚之战
    yipilusi_piluoshi: {
        generalId: 'yipilusi_piluoshi',
        battleName: '赫拉克利亚之战',
        battleYear: -280,
        battleType: 'field',
        role: 'attacker',
        targetName: '塔兰托',
        targetCityId: 'city_talanduo',
        targetLat: 40.47,
        targetLng: 17.24,
        myTroops: 30000,
        enemyFactionId: 'luoma_diguo',
        enemyFactionName: '罗马共和国',
        enemyGeneralName: '拉维努斯',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '罗马人的蛮勇在马其顿方阵与战象面前微不足道。大希腊正向我们求援，勇士，随我渡海将罗马军团击溃！' },
            { speaker: 'player', text: '愿随皮洛士陛下渡海西征，于塔兰托击败罗马执政官拉维努斯！' },
        ],
    },

    // #45 田单 (-315 ~ -250) — 公元前279年即墨火牛阵之战（本城就地开战）
    jiaodong_tiandan: {
        generalId: 'jiaodong_tiandan',
        battleName: '即墨火牛阵之战',
        battleYear: -279,
        battleType: 'field',
        role: 'attacker',
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
            { speaker: 'general', text: '燕军残暴辱我祖先，齐人之怒已如烈火！千头火牛今夜出城，壮士执刃随牛角杀出，光复齐国七十城！' },
            { speaker: 'player', text: '愿随田将军驱火牛夜袭燕营，就地斩杀骑劫、光复齐国！' },
        ],
    },

    // #46 乐毅 (-315 ~ -245) — 公元前284年济西伐齐之战
    yan_leyi: {
        generalId: 'yan_leyi',
        battleName: '济西伐齐之战',
        battleYear: -284,
        battleType: 'field',
        role: 'attacker',
        targetName: '济水西岸',
        targetCityId: 'city_jimo',
        targetLat: 36.403591,
        targetLng: 120.445862,
        myTroops: 60000,
        enemyFactionId: 'jiaodong',
        enemyFactionName: '齐国',
        enemyGeneralName: '触子',
        enemyTroops: 80000,
        introLines: [
            { speaker: 'general', text: '齐湣王骄暴，五国伐齐义旗已举！齐国精锐主力正屯于济西，壮士，随燕军建功立业，一战洗雪先王之耻！' },
            { speaker: 'player', text: '愿随昌国君统兵南下，于济西大破齐将触子！' },
        ],
    },

    // #47 欧迈尼斯一世 (-310 ~ -241) — 公元前262年萨第斯战役
    pajiama_oumainisi: {
        generalId: 'pajiama_oumainisi',
        battleName: '萨第斯战役',
        battleYear: -262,
        battleType: 'field',
        role: 'attacker',
        targetName: '萨第斯城下',
        targetCityId: 'city_sifaerde',
        targetLat: 38.48,
        targetLng: 28.03,
        myTroops: 25000,
        enemyFactionId: 'sailiugu',
        enemyFactionName: '塞琉古帝国',
        enemyGeneralName: '安条克一世',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '塞琉古的重税与桎梏必须终结，佩尔加蒙必须独立！敌军重装步兵已出萨第斯，壮士速来随我迎击安条克！' },
            { speaker: 'player', text: '愿随欧迈尼斯统帅奔赴萨第斯，击败塞琉古王安条克一世！' },
        ],
    },

    // #48 廉颇 (-305 ~ -222) — 公元前251年鄗代之战（本城就地开战）
    zhao_lianpo: {
        generalId: 'zhao_lianpo',
        battleName: '鄗代之战',
        battleYear: -251,
        battleType: 'field',
        role: 'defender',
        targetName: '邯郸',
        targetCityId: 'city_handan',
        targetLat: 36.61,
        targetLng: 114.49,
        myTroops: 50000,
        enemyFactionId: 'yan',
        enemyFactionName: '燕国',
        enemyGeneralName: '栗腹',
        enemyTroops: 80000,
        introLines: [
            { speaker: 'general', text: '燕国趁我长平之痛来犯我北疆，真欺赵国无人耶！老夫引兵反击，壮士，提刀随我迎击栗腹，直捣燕都！' },
            { speaker: 'player', text: '愿随廉老将军于邯郸城外就地出击，大破燕军、阵斩栗腹！' },
        ],
    },

    // #49 王翦 (-303 ~ -214) — 公元前224年破楚淮北之战
    ruo_wangjian: {
        generalId: 'ruo_wangjian',
        battleName: '破楚淮北之战',
        battleYear: -224,
        battleType: 'field',
        role: 'attacker',
        targetName: '蕲县蕲南',
        targetCityId: 'city_shouxian',
        targetLat: 32.57,
        targetLng: 116.78,
        myTroops: 100000,
        enemyFactionId: 'chu',
        enemyFactionName: '楚国',
        enemyGeneralName: '项燕',
        enemyTroops: 100000,
        introLines: [
            { speaker: 'general', text: '楚将项燕急于求胜，我军按兵不动一年，楚军气竭必乱！壮士，秦王假我六十万甲士，随老夫全线反击！' },
            { speaker: 'player', text: '愿随王老将军统秦师全线反击，大破楚帅项燕！' },
        ],
    },

    // #50 信陵君魏无忌 (-300 ~ -243) — 公元前257年窃符救赵之战
    shang_weiwuji: {
        generalId: 'shang_weiwuji',
        battleName: '窃符救赵之战',
        battleYear: -257,
        battleType: 'field',
        role: 'attacker',
        targetName: '邯郸城下',
        targetCityId: 'city_handan',
        targetLat: 36.61,
        targetLng: 114.49,
        myTroops: 80000,
        enemyFactionId: 'qin',
        enemyFactionName: '秦国',
        enemyGeneralName: '王龁',
        enemyTroops: 80000,
        introLines: [
            { speaker: 'general', text: '邯郸危在旦夕，唇亡齿寒！我已调集魏楚义军八万赶赴邯郸，壮士既怀忠义，随我解围杀退秦军！' },
            { speaker: 'player', text: '愿随信陵君疾驰邯郸，击破王龁秦军、解邯郸之围！' },
        ],
    },

    // #51 李牧 (-290 ~ -229) — 公元前244年善无破匈奴之战（本城就地开战）
    wuzhou_limu: {
        generalId: 'wuzhou_limu',
        battleName: '善无破匈奴之战',
        battleYear: -244,
        battleType: 'field',
        role: 'defender',
        targetName: '善无',
        targetCityId: 'city_wuzhousai',
        targetLat: 39.998214,
        targetLng: 112.420349,
        myTroops: 80000,
        enemyFactionId: 'xiongnu',
        enemyFactionName: '匈奴',
        enemyGeneralName: '匈奴单于',
        enemyTroops: 100000,
        introLines: [
            { speaker: 'general', text: '佯败示弱三年，匈奴十万骑兵终入塞！车阵、骑兵与强弩尽皆就位，壮士，引满弓弦，随我彻底荡平匈奴！' },
            { speaker: 'player', text: '愿随李牧将军于善无塞外就地展开大阵，一战歼灭匈奴十万铁骑！' },
        ],
    },

    // #52 赵奢 (-290 ~ -267) — 公元前269年阏与之战（本城就地开战）
    liguo_zhaoshe: {
        generalId: 'liguo_zhaoshe',
        battleName: '阏与之战',
        battleYear: -269,
        battleType: 'field',
        role: 'defender',
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
            { speaker: 'general', text: '狭路相逢勇者胜！秦军据赤梁山以为高险，我已抢先登北山高地！壮士，随我居高临下，俯冲痛击秦军！' },
            { speaker: 'player', text: '狭路相逢勇者胜！愿随马服君于阏与就地大破胡伤秦军！' },
        ],
    },

    // #53 阿尔沙克一世 (-280 ~ -217) — 公元前238年帕提亚立国会战（本城就地开战）
    ansxi_aershake: {
        generalId: 'ansxi_aershake',
        battleName: '帕提亚立国会战',
        battleYear: -238,
        battleType: 'field',
        role: 'defender',
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
            { speaker: 'general', text: '塞琉古的总督四面受敌，草原帕尼部重见天日正在今朝！草原的好男儿，抄起弓马，随我夺回帕提亚！' },
            { speaker: 'player', text: '愿随阿尔沙克陛下于尼萨就地出击，击溃安德拉戈拉斯！' },
        ],
    },

    // #54 哈米尔卡·巴卡 (-275 ~ -228) — 公元前247年埃里克山阻击战
    gen_hamilcar: {
        generalId: 'gen_hamilcar',
        battleName: '埃里克山阻击战',
        battleYear: -247,
        battleType: 'field',
        role: 'attacker',
        targetName: '埃里克山',
        targetCityId: 'city_palermo',
        targetLat: 38.11,
        targetLng: 13.36,
        myTroops: 20000,
        enemyFactionId: 'luoma_diguo',
        enemyFactionName: '罗马共和国',
        enemyGeneralName: '卡图卢斯',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '罗马军团封锁了西西里，但埃里克山峰顶仍由我迦太基掌控！勇猛的壮士，随我的利刃从后方撕碎罗马人！' },
            { speaker: 'player', text: '愿随哈米尔卡统帅奔赴西西里埃里克山，痛击罗马执政官卡图卢斯！' },
        ],
    },

    // #55 刘邦 (-256 ~ -195) — 公元前206年还定三秦之战
    han_d_liubang: {
        generalId: 'han_d_liubang',
        battleName: '还定三秦之战',
        battleYear: -206,
        battleType: 'field',
        role: 'attacker',
        targetName: '陈仓',
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
            { speaker: 'general', text: '困守汉中非大丈夫所为！韩大将军已暗度陈仓，出其不意！壮士，随乃公杀回关中，天下谁人能挡！' },
            { speaker: 'player', text: '愿随汉王北出陈仓，击破章邯、还定三秦！' },
        ],
    },

    // #56 蒙恬 (-250 ~ -210) — 公元前215年河南地逐匈奴之战（本城就地开战）
    baiyang_mengtian: {
        generalId: 'baiyang_mengtian',
        battleName: '河南地逐匈奴之战',
        battleYear: -215,
        battleType: 'field',
        role: 'defender',
        targetName: '高阙塞',
        targetCityId: 'city_gaoque',
        targetLat: 41.195202,
        targetLng: 107.166138,
        myTroops: 100000,
        enemyFactionId: 'xiongnu',
        enemyFactionName: '匈奴',
        enemyGeneralName: '头曼单于',
        enemyTroops: 80000,
        introLines: [
            { speaker: 'general', text: '始皇帝令我提甲士三十万北逐戎狄！高阙塞前烽燧已燃，壮士，随我上马收复河南地，叫胡人不敢南下！' },
            { speaker: 'player', text: '愿随蒙将军于高阙塞就地出击，痛击头曼单于、收复河南地！' },
        ],
    },

    // #57 汉尼拔 (-247 ~ -183) — 公元前216年坎尼会战
    gen_hannibal: {
        generalId: 'gen_hannibal',
        battleName: '坎尼会战',
        battleYear: -216,
        battleType: 'field',
        role: 'attacker',
        targetName: '坎尼',
        targetCityId: 'city_meierfei',
        targetLat: 40.99,
        targetLng: 15.65,
        myTroops: 50000,
        enemyFactionId: 'luoma_diguo',
        enemyFactionName: '罗马共和国',
        enemyGeneralName: '瓦罗',
        enemyTroops: 85000,
        introLines: [
            { speaker: 'general', text: '罗马人出动了八个军团想踏平我军，正中我两翼包抄之计！勇士，坚守中军凸阵，随我全歼罗马主力！' },
            { speaker: 'player', text: '愿随汉尼拔统帅奔赴坎尼平原，两翼包抄全歼罗马主力！' },
        ],
    },

    // #58 章邯 (-245 ~ -205) — 公元前208年定陶之战（本城就地开战）
    wazhai_zhanghan: {
        generalId: 'wazhai_zhanghan',
        battleName: '定陶之战',
        battleYear: -208,
        battleType: 'field',
        role: 'attacker',
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
            { speaker: 'general', text: '项梁屡胜骄狂，其军早已懈怠！我军夜衔枚出城突袭，壮士随我陷阵，一战阵斩项梁，复我大秦威名！' },
            { speaker: 'player', text: '愿随章将军于定陶乘夜突袭，一战击破项梁楚军！' },
        ],
    },

    // #59 英布 (-245 ~ -196) — 公元前207年巨鹿先锋之战
    liu_yingbu: {
        generalId: 'liu_yingbu',
        battleName: '巨鹿先锋之战',
        battleYear: -207,
        battleType: 'field',
        role: 'attacker',
        targetName: '巨鹿漳水',
        targetCityId: 'city_handan',
        targetLat: 36.61,
        targetLng: 114.49,
        myTroops: 30000,
        enemyFactionId: 'qin',
        enemyFactionName: '秦国',
        enemyGeneralName: '王离',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '项将军令我提兵渡漳水断绝秦军甬道，有进无退！不怕死的汉子，随我渡河死战，破秦军就在今日！' },
            { speaker: 'player', text: '愿随当阳君北渡漳水，断秦军甬道、大破王离秦军！' },
        ],
    },

    // #60 安条克三世 (-241 ~ -187) — 公元前200年帕尼翁会战
    sailiugu_antiaoke: {
        generalId: 'sailiugu_antiaoke',
        battleName: '帕尼翁会战',
        battleYear: -200,
        battleType: 'field',
        role: 'attacker',
        targetName: '帕尼翁',
        targetCityId: 'city_damasikusi',
        targetLat: 33.5131,
        targetLng: 36.3094,
        myTroops: 50000,
        enemyFactionId: 'tuolemi',
        enemyFactionName: '托勒密王朝',
        enemyGeneralName: '斯科帕斯',
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '叙利亚失地今日必当收回！我的重装铁甲骑兵已完成合围，壮士，随我冲垮托勒密的方阵，重振帝国荣光！' },
            { speaker: 'player', text: '愿随安条克三世陛下南征，于帕尼翁击溃斯科帕斯大军！' },
        ],
    },

    // #61 周勃 (-240 ~ -169) — 公元前205年破章平渑池之战（本城就地开战）
    yangshao_zhoubo: {
        generalId: 'yangshao_zhoubo',
        battleName: '破章平渑池之战',
        battleYear: -205,
        battleType: 'field',
        role: 'attacker',
        targetName: '渑池',
        targetCityId: 'city_mianchi',
        targetLat: 34.76,
        targetLng: 111.76,
        myTroops: 40000,
        enemyFactionId: 'wazhai',
        enemyFactionName: '雍国',
        enemyGeneralName: '章平',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '三秦负隅顽抗，章平聚众阻绝崤函！汉王令老夫攻拔渑池，壮士，执紧盾矛随我登城陷阵，斩将夺旗！' },
            { speaker: 'player', text: '愿随绛侯于渑池就地陷阵，击破章平大军！' },
        ],
    },

    // #62 赵佗 (-240 ~ -137) — 公元前214年灵渠合击百越战（本城就地开战）
    nanyue_zhaotuo: {
        generalId: 'nanyue_zhaotuo',
        battleName: '灵渠合击百越战',
        battleYear: -214,
        battleType: 'field',
        role: 'defender',
        targetName: '龙川',
        targetCityId: 'city_longchuan',
        targetLat: 24.1,
        targetLng: 115.26,
        myTroops: 35000,
        enemyFactionId: 'xiou',
        enemyFactionName: '西瓯百越',
        enemyGeneralName: '译吁宋',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '灵渠已通，平定岭南在此一战！土著百越据险夜袭，壮士随我列阵相御，为中原辟万里江山！' },
            { speaker: 'player', text: '愿随赵将军于龙川就地迎战，击破百越首领译吁宋！' },
        ],
    },

    // #63 冒顿单于 (-234 ~ -174) — 公元前200年白登之战
    xiongnu_maodun: {
        generalId: 'xiongnu_maodun',
        battleName: '白登之战',
        battleYear: -200,
        battleType: 'field',
        role: 'attacker',
        targetName: '白登山',
        targetCityId: 'city_wuzhousai',
        targetLat: 39.998214,
        targetLng: 112.420349,
        myTroops: 100000,
        enemyFactionId: 'han_d',
        enemyFactionName: '汉朝',
        enemyGeneralId: 'han_d_liubang',
        enemyGeneralName: '刘邦',
        enemyTroops: 80000,
        introLines: [
            { speaker: 'general', text: '汉帝刘邦以为我匈奴羸弱，已中计被孤围困于白登山！草原控弦之士，随孤合围，逼汉朝纳贡！' },
            { speaker: 'player', text: '愿随冒顿单于鸣镝南下，于白登山合围刘邦大军！' },
        ],
    },

    // #64 项羽 (-232 ~ -202) — 公元前205年彭城之战（本城就地开战）
    xichu_xiangyu: {
        generalId: 'xichu_xiangyu',
        battleName: '彭城之战',
        battleYear: -205,
        battleType: 'field',
        role: 'attacker',
        targetName: '彭城',
        targetCityId: 'city_pengcheng',
        targetLat: 34.27,
        targetLng: 117.18,
        myTroops: 30000,
        enemyFactionId: 'han_d',
        enemyFactionName: '汉朝联军',
        enemyGeneralId: 'han_d_liubang',
        enemyGeneralName: '刘邦',
        enemyTroops: 100000,
        introLines: [
            { speaker: 'general', text: '汉贼引诸侯大军占我彭城、掠我妇孺！我率三万铁骑奔袭千里，壮士，随我杀入敌阵，尽诛汉贼！' },
            { speaker: 'player', text: '愿随西楚霸王于彭城就地雷霆冲锋，大破刘邦诸侯联军！' },
        ],
    },

    // #65 韩信 (-231 ~ -196) — 公元前204年井陉背水之战（本城就地开战）
    xianyu_hanxin: {
        generalId: 'xianyu_hanxin',
        battleName: '井陉背水之战',
        battleYear: -204,
        battleType: 'field',
        role: 'defender',
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
            { speaker: 'general', text: '赵军仗兵多轻我背水结阵！我已遣奇兵潜夺其营，背水一战退无可退！壮士，拔剑向前，随我生擒赵王！' },
            { speaker: 'player', text: '愿随淮阴侯于井陉口背水死战，一举击斩陈余、破赵立帜！' },
        ],
    },

    // #66 周亚夫 (-199 ~ -143) — 公元前154年昌邑截粮战
    huaiyang_zhouyafu: {
        generalId: 'huaiyang_zhouyafu',
        battleName: '昌邑截粮战',
        battleYear: -154,
        battleType: 'field',
        role: 'attacker',
        targetName: '昌邑',
        targetCityId: 'city_dingtao',
        targetLat: 35.200716,
        targetLng: 115.471802,
        myTroops: 50000,
        enemyFactionId: 'wu',
        enemyFactionName: '吴楚联军',
        enemyGeneralName: '刘濞',
        enemyTroops: 80000,
        introLines: [
            { speaker: 'general', text: '吴楚叛军锐气方盛，直扑睢阳。我军坚壁不出断其粮道，敌军军心已散！壮士，铁骑出击全歼叛军！' },
            { speaker: 'player', text: '愿随周太尉奔赴昌邑，追击并彻底荡平刘濞叛军！' },
        ],
    },

    // #67 犹大·马加比 (-190 ~ -160) — 公元前166年伯特和仑之战（本城就地开战）
    xibolai_majiabi: {
        generalId: 'xibolai_majiabi',
        battleName: '伯特和仑之战',
        battleYear: -166,
        battleType: 'field',
        role: 'defender',
        targetName: '伯特和仑',
        targetCityId: 'city_yelusaleng',
        targetLat: 31.77,
        targetLng: 35.21,
        myTroops: 15000,
        enemyFactionId: 'sailiugu',
        enemyFactionName: '塞琉古帝国',
        enemyGeneralName: '塞隆',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '异教徒肆虐圣殿、逼迫族人弃绝律法！主赐我等刚毅之力，壮士，随我伏击峡谷，斩杀塞琉古大将！' },
            { speaker: 'player', text: '愿随犹大·马加比于伯特和仑就地奋战，斩杀塞隆！' },
        ],
    },

    // #68 米南德一世 (-185 ~ -130) — 公元前155年旁遮普东征会战
    najie_minande: {
        generalId: 'najie_minande',
        battleName: '旁遮普东征会战',
        battleYear: -155,
        battleType: 'field',
        role: 'attacker',
        targetName: '萨迦拉',
        targetCityId: 'city_laheer',
        targetLat: 31.55,
        targetLng: 74.35,
        myTroops: 35000,
        enemyFactionId: 'mojietuo',
        enemyFactionName: '巽伽王朝',
        enemyGeneralName: '弗沙密多罗',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '巽伽国军势已颓，此番越过印度河必一举底定旁遮普！骁勇之士，随印度-希腊战阵长驱直入，开疆拓土！' },
            { speaker: 'player', text: '愿随米南德一世陛下东进萨迦拉，击败弗沙密多罗！' },
        ],
    },

    // #69 杜图伽摩尼 (-161 ~ -137) — 公元前161年阿努拉德普拉攻城战（本城就地开战）
    sengjialuo_dutugamo: {
        generalId: 'sengjialuo_dutugamo',
        battleName: '阿努拉德普拉攻城战',
        battleYear: -161,
        battleType: 'siege',
        role: 'attacker',
        targetName: '阿努拉德',
        targetCityId: 'city_anulade',
        targetLat: 8.3533,
        targetLng: 80.3956,
        myTroops: 30000,
        enemyFactionId: 'zhuluo',
        enemyFactionName: '朱罗侵略军',
        enemyGeneralName: '埃拉拉',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '异邦占领王都已达四十四载！神圣战象坎杜拉已准备披甲冲锋，勇士，随我驱逐朱罗侵略军，光复圣城！' },
            { speaker: 'player', text: '愿随杜图伽摩尼陛下于阿努拉德就地攻城，击破埃拉拉大军！' },
        ],
    },

    // #70 卫青 (-154 ~ -106) — 公元前127年河南地收复战
    shuofang_weiqing: {
        generalId: 'shuofang_weiqing',
        battleName: '河南地收复战',
        battleYear: -127,
        battleType: 'field',
        role: 'attacker',
        targetName: '高阙塞至陇西',
        targetCityId: 'city_gaoque',
        targetLat: 41.195202,
        targetLng: 107.166138,
        myTroops: 50000,
        enemyFactionId: 'xiongnu',
        enemyFactionName: '匈奴',
        enemyGeneralName: '白羊王',
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '匈奴犯边掠我边民！天子命某将大兵出云中，西至高阙迂回包抄！壮士，跨上健马，随大将军收复朔方！' },
            { speaker: 'player', text: '愿随卫大将军铁骑奔袭高阙，一战击溃白羊王、收复河南地！' },
        ],
    },

    // #71 霍去病 (-140 ~ -117) — 公元前121年河西之战（本城就地开战）
    suzhou_huoqubing: {
        generalId: 'suzhou_huoqubing',
        battleName: '河西之战',
        battleYear: -121,
        battleType: 'field',
        role: 'attacker',
        targetName: '嘉峪关',
        targetCityId: 'city_jiuquan',
        targetLat: 39.7822,
        targetLng: 98.3414,
        myTroops: 30000,
        enemyFactionId: 'hunxie',
        enemyFactionName: '匈奴',
        enemyGeneralName: '浑邪王',
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '匈奴盘踞河西断绝丝路，天子命我统领骠骑军绝祁连山而过！壮士，速速随我策马横扫折兰卢侯，踏平浑邪休屠！' },
            { speaker: 'player', text: '愿随冠军侯铁骑纵横河西，一战击破浑邪王主力！' },
        ],
    },

    // #72 赵充国 (-137 ~ -52) — 公元前61年平定先零羌之战
    lanzhou_zhaochongguo: {
        generalId: 'lanzhou_zhaochongguo',
        battleName: '先零羌之战',
        battleYear: -61,
        battleType: 'field',
        role: 'attacker',
        targetName: '允吾',
        targetCityId: 'city_yunwu',
        targetLat: 36.301845,
        targetLng: 102.897949,
        myTroops: 40000,
        enemyFactionId: 'xianlingqiang',
        enemyFactionName: '先零羌',
        enemyGeneralName: '杨玉',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '先零诸羌诱胁罕开作乱，老臣已向天子陈屯田之策！壮士，入我军中分兵进据湟水，以持重之势招降诸羌！' },
            { speaker: 'player', text: '愿随营平侯渡湟水西征允吾，稳扎稳打荡平先零羌！' },
        ],
    },

    // #73 密特里达梯 (-135 ~ -63) — 公元前89年阿姆尼亚斯河之战（本城就地开战）
    bendou_d_mitelidati: {
        generalId: 'bendou_d_mitelidati',
        battleName: '阿姆尼亚斯河之战',
        battleYear: -89,
        battleType: 'field',
        role: 'defender',
        targetName: '阿马西亚',
        targetCityId: 'city_amaxiya',
        targetLat: 40.65,
        targetLng: 35.83,
        myTroops: 50000,
        enemyFactionId: 'luoma_diguo',
        enemyFactionName: '罗马共和国',
        enemyGeneralName: '卡西乌斯',
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '罗马贪得无厌侵吞小亚细亚，各邦早已苦不堪言！勇士，随我的铁骑与重甲步兵在阿姆尼亚斯河重创罗马军团！' },
            { speaker: 'player', text: '愿随密特里达梯国王就地出击，用镰刀战车粉碎罗马与比提尼亚联军！' },
        ],
    },

    // #74 阿雷塔斯 (-115 ~ -60) — 公元前65年耶路撒冷围城战
    nabatai_aleitasi: {
        generalId: 'nabatai_aleitasi',
        battleName: '耶路撒冷围城战',
        battleYear: -65,
        battleType: 'siege',
        role: 'attacker',
        targetName: '耶路撒冷',
        targetCityId: 'city_yelusaleng',
        targetLat: 31.77,
        targetLng: 35.21,
        myTroops: 40000,
        enemyFactionId: 'xibolai',
        enemyFactionName: '哈斯蒙尼犹太',
        enemyGeneralName: '亚里斯托布鲁斯二世',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '犹太王位之争正是我们纳巴泰扩张疆域的天赐良机！勇士，握紧兵戈随我包围耶路撒冷，彻底底定南境霸权！' },
            { speaker: 'player', text: '愿随阿雷塔斯国王自佩特拉北上，兵临耶路撒冷城下！' },
        ],
    },

    // #75 辛武贤 (-110 ~ -50) — 公元前61年破罕开羌之战
    guangwu_xinwuxian: {
        generalId: 'guangwu_xinwuxian',
        battleName: '罕开羌之战',
        battleYear: -61,
        battleType: 'field',
        role: 'attacker',
        targetName: '允吾',
        targetCityId: 'city_yunwu',
        targetLat: 36.301845,
        targetLng: 102.897949,
        myTroops: 30000,
        enemyFactionId: 'xianlingqiang',
        enemyFactionName: '罕开羌',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '破羌将军正于湟水设防，某率酒泉张掖步骑出其不备！壮士，佩刀随某直插罕羌腹地，分进合击荡平叛逆！' },
            { speaker: 'player', text: '愿随辛将军铁骑疾趋允吾，雷霆一击荡平诸羌！' },
        ],
    },

    // #76 庞培 (-106 ~ -48) — 公元前67年奇里乞亚平海盗之战（本城就地开战）
    qiliqiya_pangpei: {
        generalId: 'qiliqiya_pangpei',
        battleName: '奇里乞亚平海盗之战',
        battleYear: -67,
        battleType: 'field',
        role: 'attacker',
        targetName: '阿达纳',
        targetCityId: 'city_adana',
        targetLat: 37,
        targetLng: 35.3213,
        myTroops: 50000,
        enemyFactionId: 'sailiugu',
        enemyFactionName: '海盗同盟',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '元老院授我无限指挥权清除海寇，奇里乞亚正是贼寇总巢穴！罗马的勇士，随我海陆并进，彻底肃清整个地中海！' },
            { speaker: 'player', text: '愿随庞培统帅于奇里乞亚就地决战，彻底肃清东地中海群盗！' },
        ],
    },

    // #77 恺撒 (-100 ~ -44) — 公元前52年阿莱西亚之战
    gen_julius_caesar: {
        generalId: 'gen_julius_caesar',
        battleName: '阿莱西亚围城战',
        battleYear: -52,
        battleType: 'siege',
        role: 'attacker',
        targetName: '第戎',
        targetCityId: 'city_dijon',
        targetLat: 47.32,
        targetLng: 5.04,
        myTroops: 50000,
        enemyFactionId: 'gaolu',
        enemyFactionName: '高卢联军',
        enemyGeneralName: '维钦托利',
        enemyTroops: 80000,
        introLines: [
            { speaker: 'general', text: '维钦托利引八万蛮族据守山城，我军已修内外双重长壕！罗马勇士，随第十军团坚守壁垒，让全高卢向罗马低头！' },
            { speaker: 'player', text: '愿随恺撒统帅远征阿莱西亚，击败维钦托利、平定高卢全境！' },
        ],
    },

    // #78 苏伦 (-84 ~ -52) — 公元前53年卡莱之战
    delan_sulun: {
        generalId: 'delan_sulun',
        battleName: '卡莱之战',
        battleYear: -53,
        battleType: 'field',
        role: 'attacker',
        targetName: '卡莱',
        targetCityId: 'city_aidesa',
        targetLat: 37.15,
        targetLng: 38.7825,
        myTroops: 15000,
        enemyFactionId: 'luoma_diguo',
        enemyFactionName: '罗马共和国',
        enemyGeneralId: 'gen_julius_caesar',
        enemyGeneralName: '克拉苏',
        enemyTroops: 42000,
        introLines: [
            { speaker: 'general', text: '罗马统帅克拉苏狂妄自大，七个军团深陷荒漠！安息的游牧勇士，背负强弓换乘骆驼，用箭雨把他们埋葬在黄沙中！' },
            { speaker: 'player', text: '愿随苏伦统帅奔赴卡莱荒原，以帕提亚铁骑全歼克拉苏大军！' },
        ],
    },

    // #79 陈汤 (-75 ~ -6) — 公元前36年郅支城之战
    quli_chentang: {
        generalId: 'quli_chentang',
        battleName: '郅支城之战',
        battleYear: -36,
        battleType: 'siege',
        role: 'attacker',
        targetName: '它乾城',
        targetCityId: 'city_taqian',
        targetLat: 41.875,
        targetLng: 83.59,
        myTroops: 40000,
        enemyFactionId: 'xiongnu',
        enemyFactionName: '北匈奴',
        enemyGeneralName: '郅支单于',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '明犯强汉者，虽远必诛！郅支单于杀汉使者逃窜康居，壮士，随我假托符节统西域十五国联军，围而歼之！' },
            { speaker: 'player', text: '明犯强汉者，虽远必诛！愿随陈副校尉攻破郅支城，斩郅支单于之首！' },
        ],
    },

    // #80 丘就却 (-20 ~ 80) — 公元45年高附攻灭安息之战
    guishuang_qiujiuque: {
        generalId: 'guishuang_qiujiuque',
        battleName: '喀布尔围城战',
        battleYear: 45,
        battleType: 'siege',
        role: 'attacker',
        targetName: '喀布尔',
        targetCityId: 'city_gaofu',
        targetLat: 34.55,
        targetLng: 69.2,
        myTroops: 45000,
        enemyFactionId: 'ansxi',
        enemyFactionName: '印度-希腊王国',
        enemyGeneralName: '赫尔迈乌斯',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '大月氏五部翕侯已为我一统，南方兴都库什山正是帝国坦途！贵霜的勇士，提矛随我南下攻拔高附城，拓土开疆！' },
            { speaker: 'player', text: '愿随贵霜大王南下攻取高附，开创横跨中亚与北印的贵霜帝国！' },
        ],
    },

    // #81 马援 (-14 ~ 49) — 公元42年浪泊平交趾之战（本城就地开战）
    li_s_mayuan: {
        generalId: 'li_s_mayuan',
        battleName: '浪泊之战',
        battleYear: 42,
        battleType: 'field',
        role: 'attacker',
        targetName: '海门',
        targetCityId: 'city_hepu',
        targetLat: 21.663,
        targetLng: 109.207,
        myTroops: 30000,
        enemyFactionId: 'xiou',
        enemyFactionName: '交趾叛军',
        enemyGeneralName: '征侧',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '男儿当死于边野以马革裹尸！交趾二征悖逆朝廷聚众乱边，壮士，随伏波大军涉重瘴出浪泊，斩将立铜柱！' },
            { speaker: 'player', text: '愿随马伏波将军就地迎击交趾叛军，立铜柱以定南疆！' },
        ],
    },

    // #82 刘秀 (-5 ~ 57) — 公元23年昆阳之战（本城就地开战）
    lulin_liuxiu: {
        generalId: 'lulin_liuxiu',
        battleName: '昆阳之战',
        battleYear: 23,
        battleType: 'field',
        role: 'defender',
        targetName: '昆阳',
        targetCityId: 'city_kunyang',
        targetLat: 33.22,
        targetLng: 113.22,
        myTroops: 20000,
        enemyFactionId: 'han_d',
        enemyFactionName: '新朝',
        enemyGeneralName: '王寻',
        enemyTroops: 100000,
        introLines: [
            { speaker: 'general', text: '王莽百万伪军围我昆阳孤城，天下存亡在此一役！我亲领十三骑冲围召援，壮士随我冲击莽军中军，阵斩王寻！' },
            { speaker: 'player', text: '愿随刘将军直捣王寻中坚大营，于昆阳城下一战覆灭新莽主力！' },
        ],
    },

    // #83 邓禹 (2 ~ 58) — 公元25年龙门渡河破关中之战（本城就地开战）
    xiayang_d_dengyu: {
        generalId: 'xiayang_d_dengyu',
        battleName: '龙门渡河之战',
        battleYear: 25,
        battleType: 'field',
        role: 'attacker',
        targetName: '龙门',
        targetCityId: 'city_xiayangdu',
        targetLat: 35.602,
        targetLng: 110.452,
        myTroops: 30000,
        enemyFactionId: 'han_d',
        enemyFactionName: '更始汉军',
        enemyGeneralName: '王匡',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '更始政权纲纪废弛，主公刘秀已即大位！更始诸将阻我西进，壮士随我强渡龙门险滩，破敌首开三辅门户！' },
            { speaker: 'player', text: '愿随邓大司徒于龙门渡口就地破敌，饮马渭水、席卷关中！' },
        ],
    },

    // #84 耿弇 (3 ~ 58) — 公元29年临淄平张步之战
    you_gengyan: {
        generalId: 'you_gengyan',
        battleName: '临淄之战',
        battleYear: 29,
        battleType: 'field',
        role: 'attacker',
        targetName: '临淄',
        targetCityId: 'city_linzi',
        targetLat: 36.88,
        targetLng: 118.43,
        myTroops: 35000,
        enemyFactionId: 'qi',
        enemyFactionName: '张步军',
        enemyGeneralName: '张步',
        enemyTroops: 60000,
        introLines: [
            { speaker: 'general', text: '围城打援此乃兵家常理，张步倾巢来援正中我伏！某大腿虽中流矢亦拔剑断箭，壮士随我合击，彻底荡平齐鲁！' },
            { speaker: 'player', text: '愿随耿建威大将军东下临淄，在陛下驾临前彻底击溃张步大军！' },
        ],
    },

    // #85 西维利斯 (25 ~ 80) — 公元69年巴塔维起义之战（本城就地开战）
    gen_civilis: {
        generalId: 'gen_civilis',
        battleName: '巴塔维起义之战',
        battleYear: 69,
        battleType: 'field',
        role: 'defender',
        targetName: '乌特勒支',
        targetCityId: 'city_utrecht',
        targetLat: 52.09,
        targetLng: 5.12,
        myTroops: 25000,
        enemyFactionId: 'luoma_diguo',
        enemyFactionName: '罗马帝国',
        enemyGeneralName: '卢佩尔库斯',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '罗马内乱无道，视我们巴塔维人如奴仆牛马！勇士们，割断屈辱的长发，随我在莱茵河口撕碎罗马军团的鹰旗！' },
            { speaker: 'player', text: '愿随西维利斯首领于莱茵河畔就地奋战，粉碎罗马军团的枷锁！' },
        ],
    },

    // #86 窦固 (25 ~ 88) — 公元73年天山蒲类海之战（本城就地开战）
    pulei_dougu: {
        generalId: 'pulei_dougu',
        battleName: '天山蒲类海之战',
        battleYear: 73,
        battleType: 'field',
        role: 'attacker',
        targetName: '巴里坤',
        targetCityId: 'city_balikun',
        targetLat: 43.6,
        targetLng: 93,
        myTroops: 30000,
        enemyFactionId: 'huyan',
        enemyFactionName: '北匈奴',
        enemyGeneralName: '呼衍王',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '天子命我兵出酒泉重定西域！匈奴呼衍王尚在天山下负隅顽抗，壮士，随我铁骑奔袭蒲类海，一举逐走匈奴！' },
            { speaker: 'player', text: '愿随窦奉车都尉于蒲类海畔就地出击，痛击呼衍王、重开西域门户！' },
        ],
    },

    // #87 班超 (32 ~ 102) — 公元91年龟兹平定之战（本城就地开战）
    xiyuduhu_banchao: {
        generalId: 'xiyuduhu_banchao',
        battleName: '疏勒平叛之战',
        battleYear: 91,
        battleType: 'field',
        role: 'defender',
        targetName: '它乾城',
        targetCityId: 'city_taqian',
        targetLat: 41.875,
        targetLng: 83.59,
        myTroops: 25000,
        enemyFactionId: 'qiuci',
        enemyFactionName: '龟兹贵霜联军',
        enemyGeneralName: '尤利多',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '大丈夫无他志略，犹当效傅介子、张骞立功异域！贵霜龟兹引兵拒险，壮士，随某以夷制夷，扬汉节于绝域！' },
            { speaker: 'player', text: '愿随班都护于它乾城下就地迎战，彻底折服龟兹与西域诸国！' },
        ],
    },

    // #88 窦宪 (50 ~ 92) — 公元89年稽落山之战（本城就地开战）
    jiluo_d_douxian: {
        generalId: 'jiluo_d_douxian',
        battleName: '稽落山之战',
        battleYear: 89,
        battleType: 'field',
        role: 'attacker',
        targetName: '涿邪山',
        targetCityId: 'city_luhun',
        targetLat: 43.58829,
        targetLng: 104.661255,
        myTroops: 50000,
        enemyFactionId: 'xiongnu',
        enemyFactionName: '北匈奴',
        enemyGeneralName: '北单于',
        enemyTroops: 60000,
        introLines: [
            { speaker: 'general', text: '朝廷三路大军出朔方塞三千里，北匈奴穷蹙狼狈！壮士，随大将军出塞追击稽落山，勒石燕然，耀我国威！' },
            { speaker: 'player', text: '愿随窦车骑将军于稽落山就地决战，荡平北匈奴、勒石燕然！' },
        ],
    },

    // #89 迦腻色迦 (78 ~ 144) — 公元127年富楼沙会战（本城就地开战）
    jibin_jianisejia: {
        generalId: 'jibin_jianisejia',
        battleName: '富楼沙会战',
        battleYear: 127,
        battleType: 'field',
        role: 'defender',
        targetName: '白沙瓦',
        targetCityId: 'city_baishawa',
        targetLat: 34.01,
        targetLng: 71.52,
        myTroops: 50000,
        enemyFactionId: 'ansxi',
        enemyFactionName: '帕提亚帝国',
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '佛陀正法护佑我贵霜帝国，西方安息军旅妄图窥伺旁遮普！骁勇的甲士，随朕跨上战象引弓冲锋，扬威犍陀罗！' },
            { speaker: 'player', text: '愿随迦腻色迦大王于白沙瓦城外就地决战，全歼帕提亚远征军！' },
        ],
    },

    // #90 皇甫规 (104 ~ 174) — 公元161年朔方平羌之战（本城就地开战）
    woye_huangfugui: {
        generalId: 'woye_huangfugui',
        battleName: '朔方平羌之战',
        battleYear: 161,
        battleType: 'field',
        role: 'attacker',
        targetName: '临戎',
        targetCityId: 'city_linrong',
        targetLat: 40.3,
        targetLng: 107,
        myTroops: 30000,
        enemyFactionId: 'xianlingqiang',
        enemyFactionName: '羌族联军',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '羌人连年寇乱关陇，朔方烽烟不绝。老夫持节领兵，恩信并施！不愿归降之贼，壮士随某出塞斩将，底定西北！' },
            { speaker: 'player', text: '愿随皇甫中郎将于临戎城外就地出战，一举肃清三秦与朔方羌患！' },
        ],
    },

    // #91 皇甫嵩 (135 ~ 195) — 公元188年陈仓破王国之战（本城就地开战）
    jingzhou_gs_huangfusong: {
        generalId: 'jingzhou_gs_huangfusong',
        battleName: '陈仓保卫战',
        battleYear: 188,
        battleType: 'field',
        role: 'attacker',
        targetName: '安定',
        targetCityId: 'city_anding',
        targetLat: 35.327451,
        targetLng: 107.358398,
        myTroops: 40000,
        enemyFactionId: 'qin',
        enemyFactionName: '凉州叛军',
        enemyGeneralName: '王国',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '叛贼王国率凉州十万之众围陈仓八十余日，师老兵疲！壮士，随某出安定奇兵乘锐击之，追奔逐北破敌就在此时！' },
            { speaker: 'player', text: '愿随皇甫左将军击其惰归，就地连破王国叛军！' },
        ],
    },

    // #92 麴义 (150 ~ 195) — 公元191年界桥之战（本城就地开战）
    qu_d_quyi: {
        generalId: 'qu_d_quyi',
        battleName: '界桥之战',
        battleYear: 191,
        battleType: 'field',
        role: 'defender',
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
            { speaker: 'general', text: '公孙瓒仗白马义从纵横河北，安知我八百先登克制骑兵！壮士，随我引强弩伏于盾下，待敌骑近前一齐放箭！' },
            { speaker: 'player', text: '愿随麴将军率混合强弩先登死士，于界桥就地射垮白马义从、斩杀严纲！' },
        ],
    },

    // #93 曹操 (155 ~ 220) — 公元200年官渡之战
    cao_d_caocao: {
        generalId: 'cao_d_caocao',
        battleName: '官渡之战',
        battleYear: 200,
        battleType: 'field',
        role: 'attacker',
        targetName: '开封',
        targetCityId: 'city_bianliang',
        targetLat: 34.8,
        targetLng: 114.31,
        myTroops: 40000,
        enemyFactionId: 'qu_d',
        enemyFactionName: '袁绍军',
        enemyGeneralName: '袁绍',
        enemyTroops: 100000,
        introLines: [
            { speaker: 'general', text: '袁本初拥十万大军南下，我军虽缺粮少兵，然绍志大才疏！某已得许攸之计，壮士，换上袁军衣甲随某夜袭乌巢！' },
            { speaker: 'player', text: '愿随曹丞相北赴官渡，火烧乌巢、击溃袁绍十万大军！' },
        ],
    },

    // #94 孙坚 (155 ~ 191) — 公元191年阳人聚之战（本城就地开战）
    ruzhou_sunjian: {
        generalId: 'ruzhou_sunjian',
        battleName: '阳人聚之战',
        battleYear: 191,
        battleType: 'field',
        role: 'attacker',
        targetName: '广成关',
        targetCityId: 'city_guangchengguan',
        targetLat: 34.139089,
        targetLng: 112.887268,
        myTroops: 30000,
        enemyFactionId: 'wuzhou_d',
        enemyFactionName: '董卓军',
        enemyGeneralName: '胡轸',
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '董卓焚烧洛阳祸乱天下，天下义兵唯某敢前！胡轸吕布狂悖无谋，江东儿郎与壮士随某整军出关，誓斩华雄！' },
            { speaker: 'player', text: '愿随孙破虏将军于广成关就地迎战，痛击董卓西凉军！' },
        ],
    },

    // #95 关羽 (160 ~ 220) — 公元219年襄樊水淹七军之战
    chu_guanyu: {
        generalId: 'chu_guanyu',
        battleName: '襄樊之战',
        battleYear: 219,
        battleType: 'field',
        role: 'attacker',
        targetName: '襄阳',
        targetCityId: 'city_xiangyang',
        targetLat: 32.01,
        targetLng: 112.12,
        myTroops: 40000,
        enemyFactionId: 'bozhou_d',
        enemyFactionName: '曹操军',
        enemyGeneralId: 'bozhou_d_yujin',
        enemyGeneralName: '于禁',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '曹仁困守樊城，汉水秋雨连绵正是天赐良机！关某已备战船，水淹于禁七军威震华夏！壮士，乘舟随某杀敌建功！' },
            { speaker: 'player', text: '愿随关将军自江陵挥师北上襄樊，水淹七军、生擒于禁威震华夏！' },
        ],
    },

    // #96 刘备 (161 ~ 223) — 公元219年汉中定军山之战
    shu_liubei: {
        generalId: 'shu_liubei',
        battleName: '汉中之战',
        battleYear: 219,
        battleType: 'field',
        role: 'attacker',
        targetName: '南郑',
        targetCityId: 'city_hanzhong',
        targetLat: 33.07,
        targetLng: 107.02,
        myTroops: 50000,
        enemyFactionId: 'cao_d',
        enemyFactionName: '曹操军',
        enemyGeneralName: '夏侯渊',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '汉中乃益州咽喉，得之则兴，失之则倾！夏侯渊曹操步步紧逼，壮士，随备渡汉水据定军山，匡扶汉室在此一役！' },
            { speaker: 'player', text: '愿随玄德公北上汉中定军山，斩夏侯渊、克复汉中！' },
        ],
    },

    // #97 张飞 (165 ~ 221) — 公元215年巴西宕渠之战（本城就地开战）
    langzhou_zhangfei: {
        generalId: 'langzhou_zhangfei',
        battleName: '巴西宕渠之战',
        battleYear: 215,
        battleType: 'field',
        role: 'defender',
        targetName: '隆城',
        targetCityId: 'city_langzhong_gucheng',
        targetLat: 31.583,
        targetLng: 105.97,
        myTroops: 30000,
        enemyFactionId: 'cao_d',
        enemyFactionName: '曹操军',
        enemyGeneralName: '张郃',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '张郃欺我蜀中无人，竟敢引兵掳掠巴西！燕人张翼德在此，精选轻骑万余循山道截其前后，壮士随俺痛饮杀贼！' },
            { speaker: 'player', text: '愿随张车骑将军于阆中宕渠就地出击，杀得张郃弃马攀山而逃！' },
        ],
    },

    // #98 曹仁 (168 ~ 223) — 公元208年江陵保卫战
    caoren: {
        generalId: 'caoren',
        battleName: '江陵保卫战',
        battleYear: 208,
        battleType: 'field',
        role: 'attacker',
        targetName: '江陵',
        targetCityId: 'city_ying',
        targetLat: 30.35,
        targetLng: 112.18,
        myTroops: 35000,
        enemyFactionId: 'jiujiang',
        enemyFactionName: '孙刘联军',
        enemyGeneralId: 'jiujiang_zhouyu',
        enemyGeneralName: '周瑜',
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '赤壁虽挫，江陵坚城犹固！周瑜倾江东全力来攻，某已身先士卒杀入重围救出牛金。壮士，随某出城横冲孙军！' },
            { speaker: 'player', text: '将军真天人也！愿随曹征南将军疾驰江陵，奋勇冲阵挫败周瑜锋芒！' },
        ],
    },

    // #99 张辽 (169 ~ 222) — 公元215年合肥逍遥津之战（本城就地开战）
    lu_zhangliao: {
        generalId: 'lu_zhangliao',
        battleName: '合肥之战',
        battleYear: 215,
        battleType: 'field',
        role: 'defender',
        targetName: '合肥',
        targetCityId: 'city_hefei',
        targetLat: 31.82,
        targetLng: 117.23,
        myTroops: 20000,
        enemyFactionId: 'shanyue',
        enemyFactionName: '东吴',
        enemyGeneralName: '孙权',
        enemyTroops: 100000,
        introLines: [
            { speaker: 'general', text: '孙权十万兵压合肥，主公远在汉中！待敌围合则无路可生，某已挑八百死士！壮士，披重甲随我直捣孙权帅旗！' },
            { speaker: 'player', text: '愿随张前将军披甲陷阵，于合肥逍遥津就地杀穿吴军十万大营！' },
        ],
    },

    // #100 田豫 (171 ~ 252) — 公元233年马城破轲比能之战（本城就地开战）
    guzhu_tianyu: {
        generalId: 'guzhu_tianyu',
        battleName: '马城之战',
        battleYear: 233,
        battleType: 'field',
        role: 'defender',
        targetName: '肥如',
        targetCityId: 'city_feiru',
        targetLat: 39.89,
        targetLng: 118.89,
        myTroops: 25000,
        enemyFactionId: 'tuoba',
        enemyFactionName: '鲜卑',
        enemyGeneralName: '轲比能',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '鲜卑轲比能聚众入塞寇乱边民，合围我军于马城！老夫已置车结为重阵突围，壮士随某出奇设伏，平定胡虏！' },
            { speaker: 'player', text: '愿随田护乌桓校尉于肥如塞下就地迎敌，大破轲比能鲜卑铁骑！' },
        ],
    },

    // #101 周瑜 (175 ~ 210) — 公元208年赤壁之战（本城就地开战）
    jiujiang_zhouyu: {
        generalId: 'jiujiang_zhouyu',
        battleName: '赤壁之战',
        battleYear: 208,
        battleType: 'field',
        role: 'defender',
        targetName: '柴桑',
        targetCityId: 'city_chaisang',
        targetLat: 29.6802,
        targetLng: 115.9964,
        myTroops: 30000,
        enemyFactionId: 'cao_d',
        enemyFactionName: '曹操军',
        enemyGeneralId: 'cao_d_caocao',
        enemyGeneralName: '曹操',
        enemyTroops: 100000,
        introLines: [
            { speaker: 'general', text: '曹孟德挟汉相之名驱北方兵南侵，投鞭断流何其骄横！黄老将军苦肉火攻之策已成，壮士，随周郎扬帆借东风！' },
            { speaker: 'player', text: '愿随周大都督扬帆出击，火烧赤壁、将曹操大军付之一炬！' },
        ],
    },

    // #102 孙策 (175 ~ 200) — 公元195年神亭岭平江东之战（本城就地开战）
    shanyue_sunce: {
        generalId: 'shanyue_sunce',
        battleName: '平定江东之战',
        battleYear: 195,
        battleType: 'field',
        role: 'attacker',
        targetName: '宛陵',
        targetCityId: 'city_wanling',
        targetLat: 30.9333,
        targetLng: 118.75,
        myTroops: 25000,
        enemyFactionId: 'danyang',
        enemyFactionName: '刘繇军',
        enemyGeneralName: '刘繇',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '借兵千余渡江创基业，刘繇鼠辈据险拦路！小霸王手中长枪所向披靡，壮士，何不入我帐下，与我平定江东！' },
            { speaker: 'player', text: '愿随孙小霸王于江东就地出战，一举击溃刘繇大军、奠定基业！' },
        ],
    },

    // #103 吕蒙 (178 ~ 220) — 公元213年濡须口保卫战（本城就地开战）
    wuwu_d_lvmeng: {
        generalId: 'wuwu_d_lvmeng',
        battleName: '濡须口之战',
        battleYear: 213,
        battleType: 'field',
        role: 'defender',
        targetName: '濡须口',
        targetCityId: 'city_jingkou',
        targetLat: 31.58,
        targetLng: 117.92,
        myTroops: 35000,
        enemyFactionId: 'cao_d',
        enemyFactionName: '曹操军',
        enemyGeneralId: 'cao_d_caocao',
        enemyGeneralName: '曹操',
        enemyTroops: 70000,
        introLines: [
            { speaker: 'general', text: '曹公四十万临江，濡须坞垒已峻！我吴下阿蒙早已非昔日白丁，壮士随我坚守濡须水坞，教曹军叹生子当如孙仲谋！' },
            { speaker: 'player', text: '愿随吕将军据守濡须坞就地出击，令曹操感叹生子当如孙仲谋而退！' },
        ],
    },

    // #104 司马懿 (179 ~ 251) — 公元234年五丈原陇右阻击战
    sima_d_simayi: {
        generalId: 'sima_d_simayi',
        battleName: '上邽坚守之战',
        battleYear: 231,
        battleType: 'field',
        role: 'attacker',
        targetName: '天水',
        targetCityId: 'city_tianshui',
        targetLat: 34.58,
        targetLng: 105.73,
        myTroops: 60000,
        enemyFactionId: 'huizhou_d',
        enemyFactionName: '蜀汉',
        enemyGeneralId: 'huizhou_zhugeliang',
        enemyGeneralName: '诸葛亮',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '诸葛孔明远出祁山粮饷艰难，老夫据坚壁以挫其锋！彼欲求速战我偏按兵不动，壮士，随老夫严守陇右，耗尽蜀军！' },
            { speaker: 'player', text: '愿随司马大都督西赴天水陇右，挫败诸葛亮北伐大军！' },
        ],
    },

    // #105 阿尔达希尔 (180 ~ 242) — 公元224年荷姆兹甘平原之战（本城就地开战）
    sashan_aerdaxier: {
        generalId: 'sashan_aerdaxier',
        battleName: '荷姆兹甘平原之战',
        battleYear: 224,
        battleType: 'field',
        role: 'attacker',
        targetName: '菲鲁扎巴德',
        targetCityId: 'city_feiluzhabade',
        targetLat: 28.85,
        targetLng: 52.53,
        myTroops: 40000,
        enemyFactionId: 'ansxi',
        enemyFactionName: '安息帝国',
        enemyGeneralName: '阿尔达班四世',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '腐朽的安息王廷已经走到尽头，阿胡拉·马兹达注视着我们！勇士，随我率波斯萨珊铁骑席卷平原，开创新纪元！' },
            { speaker: 'player', text: '愿随阿尔达希尔大王就地冲锋，击斩阿尔达班四世、开创萨珊波斯帝国！' },
        ],
    },

    // #106 诸葛亮 (181 ~ 234) — 公元231年北伐祁山卤城之战
    huizhou_zhugeliang: {
        generalId: 'huizhou_zhugeliang',
        battleName: '卤城之战',
        battleYear: 231,
        battleType: 'field',
        role: 'attacker',
        targetName: '天水',
        targetCityId: 'city_tianshui',
        targetLat: 34.58,
        targetLng: 105.73,
        myTroops: 50000,
        enemyFactionId: 'sima_d',
        enemyFactionName: '曹魏',
        enemyGeneralId: 'sima_d_simayi',
        enemyGeneralName: '司马懿',
        enemyTroops: 60000,
        introLines: [
            { speaker: 'general', text: '先帝托孤托以大事，北伐中原兴复汉室在此一举！司马懿闭门不战，亮引兵割麦诱敌，壮士，随某卤城拔刀迎敌！' },
            { speaker: 'player', text: '愿随诸葛丞相北出祁山、进逼天水卤城，大破司马懿主力、克复汉室！' },
        ],
    },

    // #107 陆逊 (183 ~ 245) — 公元222年夷陵猇亭之战（本城就地开战）
    yidou_luxun: {
        generalId: 'yidou_luxun',
        battleName: '夷陵之战',
        battleYear: 222,
        battleType: 'field',
        role: 'attacker',
        targetName: '夷陵',
        targetCityId: 'city_yiling',
        targetLat: 30.7,
        targetLng: 111.28,
        myTroops: 50000,
        enemyFactionId: 'shu',
        enemyFactionName: '蜀汉',
        enemyGeneralId: 'shu_liubei',
        enemyGeneralName: '刘备',
        enemyTroops: 70000,
        introLines: [
            { speaker: 'general', text: '刘玄德连营七百里犯我江陵，初虽锐甚久必生懈！老夫示弱忍让多月，壮士，执紧火把随某夜顺风纵火，破尽蜀寨！' },
            { speaker: 'player', text: '愿随陆大都督于夷陵猇亭就地纵火出击，火烧蜀军四十余营！' },
        ],
    },

    // #108 王平 (185 ~ 248) — 公元244年兴势之战（本城就地开战）
    yangzhou_wangping: {
        generalId: 'yangzhou_wangping',
        battleName: '兴势之战',
        battleYear: 244,
        battleType: 'field',
        role: 'defender',
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
            { speaker: 'general', text: '曹爽引十万魏军越骆谷来犯，汉中大军未至！平统无当飞军据兴势绝险拒敌，壮士，握紧弓弩随我扼守关隘！' },
            { speaker: 'player', text: '愿随王镇北大将军率无当飞军据险死战，将曹爽大军死死挡在兴势山下！' },
        ],
    },

    // #109 马忠 (188 ~ 249) — 公元233年平定南中刘胄之战（本城就地开战）
    nanzhong_mazhong: {
        generalId: 'nanzhong_mazhong',
        battleName: '南中平叛之战',
        battleYear: 233,
        battleType: 'field',
        role: 'attacker',
        targetName: '宛温',
        targetCityId: 'city_wanwen',
        targetLat: 25.09,
        targetLng: 104.89,
        myTroops: 25000,
        enemyFactionId: 'cuanshi',
        enemyFactionName: '南夷叛军',
        enemyGeneralName: '刘胄',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '南夷刘胄纠合蛮夷反乱毒害边邑，丞相委某安抚南土！壮士，随我深入不毛斩杀首恶刘胄，保我南中永安！' },
            { speaker: 'player', text: '愿随马庲降都督于宛温就地出击，斩杀刘胄、安定南中七郡！' },
        ],
    },

    // #110 邓艾 (197 ~ 264) — 公元263年偷渡阴平灭蜀之战
    wudu_dengai: {
        generalId: 'wudu_dengai',
        battleName: '绵竹之战',
        battleYear: 263,
        battleType: 'siege',
        role: 'attacker',
        targetName: '成都',
        targetCityId: 'city_chengdu',
        targetLat: 30.57,
        targetLng: 104.07,
        myTroops: 30000,
        enemyFactionId: 'shu',
        enemyFactionName: '蜀汉',
        enemyGeneralName: '诸葛瞻',
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '姜维据剑阁死守，某已率偏师裹毡翻度阴平七百里绝险！壮士，随某直扑绵竹关破诸葛瞻，一战克定成都！' },
            { speaker: 'player', text: '愿随邓征西将军自武都阴平奇袭南下，破诸葛瞻、兵临成都城下！' },
        ],
    },

    // #111 姜维 (202 ~ 264) — 公元255年洮西大捷
    qingqiang_jiangwei: {
        generalId: 'qingqiang_jiangwei',
        battleName: '洮西之战',
        battleYear: 255,
        battleType: 'field',
        role: 'attacker',
        targetName: '武都',
        targetCityId: 'city_ganquanyi',
        targetLat: 33.4293,
        targetLng: 105.1419,
        myTroops: 45000,
        enemyFactionId: 'wudu',
        enemyFactionName: '曹魏',
        enemyGeneralName: '王经',
        enemyTroops: 55000,
        introLines: [
            { speaker: 'general', text: '继丞相遗志九伐中原！王经雍州主力正屯洮西，我已定合围之计，壮士，随我提汉家三尺剑，全歼魏军于洮水！' },
            { speaker: 'player', text: '愿随姜大将军北出伐魏，于洮西大破王经、重振大汉声威！' },
        ],
    },

    // #112 沙普尔 (215 ~ 270) — 公元260年埃德萨之战
    aba_shapuer: {
        generalId: 'aba_shapuer',
        battleName: '埃德萨之战',
        battleYear: 260,
        battleType: 'field',
        role: 'attacker',
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
            { speaker: 'general', text: '罗马皇帝瓦勒良亲率重军犯我两河，如今疫病已削弱其锋！萨珊的铁骑勇士，随我冲锋擒获罗马皇帝，名震天下！' },
            { speaker: 'player', text: '愿随沙普尔大王西进埃德萨，全歼罗马主力、生擒瓦勒良皇帝！' },
        ],
    },

    // #113 芝诺比娅 (240 ~ 274) — 公元272年伊姆前会战
    paermila_zhinuobiya: {
        generalId: 'paermila_zhinuobiya',
        battleName: '安提俄基亚会战',
        battleYear: 272,
        battleType: 'field',
        role: 'attacker',
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
            { speaker: 'general', text: '奥勒良妄图收回东方，拆毁我帕尔米拉的荣光！沙漠的儿女与勇士，随女王的大军引重骑突击，捍卫东方霸权！' },
            { speaker: 'player', text: '愿随芝诺比娅女王挥师安提俄基亚，以帕尔米拉铁骑迎击奥勒良！' },
        ],
    },

    // #114 李特 (250 ~ 303) — 公元301年绵竹破罗尚之战（本城就地开战）
    chenghan_lite: {
        generalId: 'chenghan_lite',
        battleName: '广汉之战',
        battleYear: 301,
        battleType: 'field',
        role: 'defender',
        targetName: '鹿头关',
        targetCityId: 'city_mianzhuguan',
        targetLat: 31.32549,
        targetLng: 104.172363,
        myTroops: 30000,
        enemyFactionId: 'shu',
        enemyFactionName: '西晋',
        enemyGeneralName: '罗尚',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '晋廷官吏逼迫流民还乡，陷我等万余户于死地！大丈夫宁死战不为鱼肉，壮士，随某据鹿头关截杀官兵，立国成汉！' },
            { speaker: 'player', text: '愿随李镇北大将军于鹿头关就地奋战，大破罗尚晋军、开创巴蜀基业！' },
        ],
    },

    // #115 祖逖 (266 ~ 321) — 公元320年雍丘破桃豹之战（本城就地开战）
    yuzhou_zuti: {
        generalId: 'yuzhou_zuti',
        battleName: '雍丘之战',
        battleYear: 320,
        battleType: 'field',
        role: 'attacker',
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
            { speaker: 'general', text: '祖某中流击楫，誓清中原！胡将桃豹屯兵西台久窥我雍丘，壮士，随某出运奇米诱敌之计，全线出击荡涤羯胡！' },
            { speaker: 'player', text: '愿随祖豫州于雍丘就地血战，大破桃豹后赵军、光复中原山河！' },
        ],
    },

    // #116 君士坦丁 (272 ~ 337) — 公元312年米尔维安大桥之战
    gen_constantine_great: {
        generalId: 'gen_constantine_great',
        battleName: '米尔维安大桥之战',
        battleYear: 312,
        battleType: 'field',
        role: 'attacker',
        targetName: '罗马城',
        targetCityId: 'city_luoma',
        targetLat: 41.9,
        targetLng: 12.49,
        myTroops: 40000,
        enemyFactionId: 'luoma_diguo',
        enemyFactionName: '罗马僭主',
        enemyGeneralName: '马克森提乌斯',
        enemyTroops: 60000,
        introLines: [
            { speaker: 'general', text: '神圣十字已于苍穹显现，此战必胜！僭主马克森提乌斯背水列阵，勇士，持神圣之徽随我冲锋，将敌军逼入台伯河！' },
            { speaker: 'player', text: '愿随君士坦丁大帝挥师南下罗马，在米尔维安大桥击溃马克森提乌斯！' },
        ],
    },

    // #117 石勒 (274 ~ 333) — 公元311年宁平城之战（本城就地开战）
    cai_lishuo: {
        generalId: 'cai_lishuo',
        battleName: '宁平城之战',
        battleYear: 311,
        battleType: 'field',
        role: 'attacker',
        targetName: '新蔡',
        targetCityId: 'city_chenjun',
        targetLat: 32.75,
        targetLng: 114.98,
        myTroops: 50000,
        enemyFactionId: 'yuzhou',
        enemyFactionName: '西晋',
        enemyGeneralName: '王衍',
        enemyTroops: 80000,
        introLines: [
            { speaker: 'general', text: '晋军十余万拥丧自洛阳南逃，王衍清谈误国死期已至！铁骑儿郎与壮士，随某引精骑合围宁平城，尽歼晋室残军！' },
            { speaker: 'player', text: '愿随石将军铁骑合围，于宁平城就地覆灭王衍十万晋军！' },
        ],
    },

    // #118 慕容皝 (297 ~ 348) — 公元342年龙城破石虎之战（本城就地开战）
    yingzhou_ying_d_muronghuang: {
        generalId: 'yingzhou_ying_d_muronghuang',
        battleName: '棘城保卫战',
        battleYear: 342,
        battleType: 'field',
        role: 'defender',
        targetName: '朝阳',
        targetCityId: 'city_chaoyang',
        targetLat: 41.57,
        targetLng: 120.45,
        myTroops: 40000,
        enemyFactionId: 'cai',
        enemyFactionName: '后赵',
        enemyGeneralName: '石虎',
        enemyTroops: 70000,
        introLines: [
            { speaker: 'general', text: '石虎倾羯赵大军数十万围我棘城十余日，贼势已衰！鲜卑壮士，披甲持槊随孤出城奋击，杀得羯胡弃甲北奔！' },
            { speaker: 'player', text: '愿随燕王于龙城之下就地出击，杀得石虎后赵大军丢盔弃甲！' },
        ],
    },

    // #119 桓温 (312 ~ 373) — 公元347年桓温灭成汉之战
    danyang_huanwen: {
        generalId: 'danyang_huanwen',
        battleName: '成都笮桥之战',
        battleYear: 347,
        battleType: 'siege',
        role: 'attacker',
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
            { speaker: 'general', text: '男儿不能流芳百世亦当遗臭万年！某引孤军泛舟万里溯流克蜀，鼓吏奋槌进军，壮士随我奋勇杀入成都，灭成汉！' },
            { speaker: 'player', text: '愿随桓大司马溯江入蜀，于成都城下击破李势、收复巴蜀之地！' },
        ],
    },

    // #120 埃扎纳 (320 ~ 360) — 公元350年麦罗埃远征战（本城就地开战）
    gen_ezana: {
        generalId: 'gen_ezana',
        battleName: '征服库施之战',
        battleYear: 350,
        battleType: 'field',
        role: 'attacker',
        targetName: '阿克苏姆',
        targetCityId: 'city_aksum',
        targetLat: 14.13,
        targetLng: 38.72,
        myTroops: 35000,
        enemyFactionId: 'saimien',
        enemyFactionName: '库施王国',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '诺巴蛮族扰我商路毁我信义，天赐力量加于阿克苏姆！骁勇的战士，握紧铜矛随朕沿尼罗河扫平麦罗埃，立石纪功！' },
            { speaker: 'player', text: '愿随埃扎纳国王就地挥师，大破库施大军、扬威红海与尼罗河畔！' },
        ],
    },

    // #121 冉闵 (322 ~ 352) — 公元350年苍亭破襄国之战（本城就地开战）
    ranwei_d_ranmin: {
        generalId: 'ranwei_d_ranmin',
        battleName: '苍亭之战',
        battleYear: 350,
        battleType: 'field',
        role: 'attacker',
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
            { speaker: 'general', text: '羯胡暴虐荼毒中原，今日某立魏国当为汉家雪恨！石祗倾国来攻，壮士，持双刃矛随我驰骋沙场，首战必荡尽胡虏！' },
            { speaker: 'player', text: '愿随冉天王于巨鹿就地血战，冲杀石祗叛军、保卫中州百姓！' },
        ],
    },

    // #122 慕容恪 (323 ~ 367) — 公元352年廉台之战
    murong_murongke: {
        generalId: 'murong_murongke',
        battleName: '廉台之战',
        battleYear: 352,
        battleType: 'field',
        role: 'attacker',
        targetName: '中山',
        targetCityId: 'city_zhongshan',
        targetLat: 38.4708,
        targetLng: 115.0626,
        myTroops: 50000,
        enemyFactionId: 'ranwei_d',
        enemyFactionName: '冉魏',
        enemyGeneralId: 'ranwei_d_ranmin',
        enemyGeneralName: '冉闵',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '冉闵勇冠三军，连败我军数仗！某已命鲜卑铁骑以铁锁连环结方阵挡其冲击，壮士，随我射住阵脚，合围生擒冉闵！' },
            { speaker: 'player', text: '愿随太原王南下中山廉台，以连环马阵合围生擒冉闵！' },
        ],
    },

    // #123 王猛 (325 ~ 375) — 公元370年潞川灭前燕之战
    fushi_wangmeng: {
        generalId: 'fushi_wangmeng',
        battleName: '潞川之战',
        battleYear: 370,
        battleType: 'field',
        role: 'attacker',
        targetName: '洛阳',
        targetCityId: 'city_luoyang',
        targetLat: 34.62,
        targetLng: 112.45,
        myTroops: 60000,
        enemyFactionId: 'murong',
        enemyFactionName: '前燕',
        enemyGeneralName: '慕容评',
        enemyTroops: 100000,
        introLines: [
            { speaker: 'general', text: '慕容评贪财鬻柴卖水，燕军军心已瓦解！大将军某已布阵潞川，破釜焚粮誓不旋踵！壮士，随我陷阵，一举灭燕！' },
            { speaker: 'player', text: '愿随王丞相东出潞川，乘燕军粮尽军乱一举覆灭前燕主力！' },
        ],
    },

    // #124 慕容垂 (326 ~ 396) — 公元369年枋头之战
    dingzhou_d_murongchui: {
        generalId: 'dingzhou_d_murongchui',
        battleName: '枋头之战',
        battleYear: 369,
        battleType: 'field',
        role: 'attacker',
        targetName: '开封',
        targetCityId: 'city_bianliang',
        targetLat: 34.8,
        targetLng: 114.31,
        myTroops: 50000,
        enemyFactionId: 'danyang',
        enemyFactionName: '东晋',
        enemyGeneralId: 'danyang_huanwen',
        enemyGeneralName: '桓温',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '桓温伐燕深入枋头，粮道已被我骑兵断绝，不得不退！壮士，随某引八千鲜卑精骑尾随截击，大破桓温就在襄邑！' },
            { speaker: 'player', text: '愿随吴王铁骑南下枋头与襄邑，追击大破桓温北伐晋军！' },
        ],
    },

    // #125 尤里安 (331 ~ 363) — 公元357年斯特拉斯堡之战（本城就地开战）
    gen_julian_apostate: {
        generalId: 'gen_julian_apostate',
        battleName: '斯特拉斯堡之战',
        battleYear: 357,
        battleType: 'field',
        role: 'defender',
        targetName: '斯特拉斯堡',
        targetCityId: 'city_sitelasibao',
        targetLat: 48.57,
        targetLng: 7.75,
        myTroops: 15000,
        enemyFactionId: 'rierman',
        enemyFactionName: '阿拉曼尼人',
        enemyGeneralName: '科诺多马尔',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '阿拉曼尼蛮族三万众渡莱茵河践踏高卢，罗马的尊严不容践踏！军团士兵与勇士，执盾拔剑随我反击，驱敌入河！' },
            { speaker: 'player', text: '愿随尤里安凯撒于斯特拉斯堡就地决战，生擒阿勒曼尼王科诺多马尔！' },
        ],
    },

    // #126 谢玄 (343 ~ 388) — 公元383年淝水之战（本城就地开战）
    zhong_xiexuan: {
        generalId: 'zhong_xiexuan',
        battleName: '淝水之战',
        battleYear: 383,
        battleType: 'field',
        role: 'defender',
        targetName: '寿春',
        targetCityId: 'city_shouxian',
        targetLat: 32.59,
        targetLng: 116.8,
        myTroops: 80000,
        enemyFactionId: 'fushi',
        enemyFactionName: '前秦',
        enemyGeneralName: '苻坚',
        enemyTroops: 100000,
        introLines: [
            { speaker: 'general', text: '苻坚投鞭断流妄图吞并江南，江东安危全系北府儿郎！秦军半渡而退，壮士，随我引精锐踏破淝水，一战定乾坤！' },
            { speaker: 'player', text: '愿随谢康乐率北府精兵于寿春淝水就地出击，令秦军风声鹤唳、草木皆兵！' },
        ],
    },

    // #127 社仑 (360 ~ 410) — 公元402年漠北立汗庭之战（本城就地开战）
    rouran_shelun: {
        generalId: 'rouran_shelun',
        battleName: '漠北平高车之战',
        battleYear: 402,
        battleType: 'field',
        role: 'attacker',
        targetName: '赛尔乌苏',
        targetCityId: 'city_saierwusu',
        targetLat: 44.818872,
        targetLng: 106.800842,
        myTroops: 40000,
        enemyFactionId: 'gaoche',
        enemyFactionName: '高车部族',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '柔然立军法千人为军、退者斩首！高车蛮夷散乱无章，草原的狼群儿郎，跨马弯弓随可汗奔袭漠北，一统大荒！' },
            { speaker: 'player', text: '愿随社仑可汗于赛尔乌苏就地出击，收服高车诸部、威震漠北！' },
        ],
    },

    // #128 刘裕 (363 ~ 422) — 公元410年广固灭南燕之战
    wang_d_liuyu: {
        generalId: 'wang_d_liuyu',
        battleName: '广固围城战',
        battleYear: 410,
        battleType: 'siege',
        role: 'attacker',
        targetName: '临淄',
        targetCityId: 'city_linzi',
        targetLat: 36.88,
        targetLng: 118.43,
        myTroops: 60000,
        enemyFactionId: 'murong',
        enemyFactionName: '南燕',
        enemyGeneralName: '慕容超',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '慕容超犯边掳掠我淮北百姓，寄奴引义师北伐直捣临朐！南燕主力已溃，壮士，随某推行围攻器械，彻底平定广固！' },
            { speaker: 'player', text: '愿随刘太尉挥师北伐过岘山，攻克广固、生擒慕容超！' },
        ],
    },

    // #129 沮渠蒙逊 (368 ~ 433) — 公元412年姑臧夺河西之战
    juqu_d_juqumengxun: {
        generalId: 'juqu_d_juqumengxun',
        battleName: '河西破南凉之战',
        battleYear: 412,
        battleType: 'field',
        role: 'attacker',
        targetName: '张掖',
        targetCityId: 'city_zhangye',
        targetLat: 38.93,
        targetLng: 100.45,
        myTroops: 35000,
        enemyFactionId: 'tufa_d',
        enemyFactionName: '南凉',
        enemyGeneralId: 'tufa_d_tufanutan',
        enemyGeneralName: '秃发傉檀',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '秃发傉檀残暴失信，竟敢举兵犯我姑臧！北凉将士同仇敌忾，壮士，速随某布伏兵于西石窟，一战断其归路！' },
            { speaker: 'player', text: '愿随河西王东进张掖，大破秃发傉檀、席卷河西走廊！' },
        ],
    },

    // #130 亚拉里克 (370 ~ 410) — 公元410年罗马围城之战
    gen_alaric: {
        generalId: 'gen_alaric',
        battleName: '罗马围城战',
        battleYear: 410,
        battleType: 'siege',
        role: 'attacker',
        targetName: '罗马城',
        targetCityId: 'city_luoma',
        targetLat: 41.9,
        targetLng: 12.49,
        myTroops: 40000,
        enemyFactionId: 'luoma_diguo',
        enemyFactionName: '西罗马帝国',
        enemyGeneralName: '霍诺留',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '皇帝居拉文纳背信弃义，黄金亦不能偿还我们的血债！西哥特的勇士们，握紧战斧随我冲破罗马城门，尽取珍宝！' },
            { speaker: 'player', text: '愿随亚拉里克国王进军罗马，用刀剑为西哥特人夺取应得的荣耀！' },
        ],
    },

    // #131 拓跋珪 (371 ~ 409) — 公元395年参合陂之战（本城就地开战）
    tuoba_tuobagui: {
        generalId: 'tuoba_tuobagui',
        battleName: '参合陂之战',
        battleYear: 395,
        battleType: 'field',
        role: 'attacker',
        targetName: '大同',
        targetCityId: 'city_datong',
        targetLat: 40.08,
        targetLng: 113.3,
        myTroops: 40000,
        enemyFactionId: 'dingzhou',
        enemyFactionName: '后燕',
        enemyGeneralName: '慕容宝',
        enemyTroops: 70000,
        introLines: [
            { speaker: 'general', text: '慕容宝骄狂南还，大军渡黑水毫无防备！北风大起飞沙走石，魏军铁骑与壮士，随孤自山后掩杀，全歼燕军精锐！' },
            { speaker: 'player', text: '愿随魏王铁骑神速突袭，于参合陂就地全歼慕容宝后燕大军！' },
        ],
    },

    // #132 赫连勃勃 (381 ~ 425) — 公元407年阳武下口破南凉之战（本城就地开战）
    helian_helianbobo: {
        generalId: 'helian_helianbobo',
        battleName: '阳武下口之战',
        battleYear: 407,
        battleType: 'field',
        role: 'defender',
        targetName: '统万城',
        targetCityId: 'city_tongwancheng',
        targetLat: 38.024286,
        targetLng: 109.14917,
        myTroops: 30000,
        enemyFactionId: 'tufa_d',
        enemyFactionName: '南凉',
        enemyGeneralId: 'tufa_d_tufanutan',
        enemyGeneralName: '秃发傉檀',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '秃发傉檀自恃众盛轻我大夏！孤示弱诱其深入阳武峡谷，胡夏勇士，随孤设伏断敌前后，叫凉军片甲不留！' },
            { speaker: 'player', text: '愿随大夏天王于统万城外就地合围，大破秃发傉檀南凉主力！' },
        ],
    },

    // #133 乞伏炽磐 (386 ~ 428) — 公元414年乐都灭南凉之战
    qifu_d_qifuchipan: {
        generalId: 'qifu_d_qifuchipan',
        battleName: '乐都围城战',
        battleYear: 414,
        battleType: 'siege',
        role: 'attacker',
        targetName: '允吾',
        targetCityId: 'city_yunwu',
        targetLat: 36.301845,
        targetLng: 102.897949,
        myTroops: 30000,
        enemyFactionId: 'tufa_d',
        enemyFactionName: '南凉',
        enemyGeneralName: '秃发虎台',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '秃发傉檀远袭白石，乐都孤城守备空虚！西秦铁骑进发如风，壮士，随某跨陇山急攻乐都城，一战灭亡南凉！' },
            { speaker: 'player', text: '愿随西秦王自枹罕疾驰北上，奇袭攻克乐都、一战灭亡南凉！' },
        ],
    },

    // #134 阿提拉 (406 ~ 453) — 公元451年帝国会战（本城就地开战）
    xiongren_atila: {
        generalId: 'xiongren_atila',
        battleName: '乌图斯会战',
        battleYear: 447,
        battleType: 'field',
        role: 'attacker',
        targetName: '塞格德',
        targetCityId: 'city_saigede',
        targetLat: 46.25,
        targetLng: 20.15,
        myTroops: 70000,
        enemyFactionId: 'luoma_diguo',
        enemyFactionName: '东罗马帝国',
        enemyGeneralName: '阿纳加斯特',
        enemyTroops: 60000,
        introLines: [
            { speaker: 'general', text: '上帝之鞭已悬在罗马人头顶！东罗马军团妄图在乌图斯河阻我铁骑，勇士们，拉满弯弓随我冲锋，收割敌军头颅！' },
            { speaker: 'player', text: '愿随阿提拉大单于策马冲锋，于塞格德多瑙河畔就地粉碎罗马军团！' },
        ],
    },

    // #135 阿赫雄 (430 ~ 484) — 公元484年赫拉特大破波斯之战（本城就地开战）
    yada_ahexiong: {
        generalId: 'yada_ahexiong',
        battleName: '呼罗珊大破萨珊之战',
        battleYear: 484,
        battleType: 'field',
        role: 'defender',
        targetName: '悉万斤',
        targetCityId: 'city_xiwanjin',
        targetLat: 36.66,
        targetLng: 65.75,
        myTroops: 50000,
        enemyFactionId: 'sashan',
        enemyFactionName: '萨珊波斯',
        enemyGeneralName: '卑路斯一世',
        enemyTroops: 70000,
        introLines: [
            { speaker: 'general', text: '萨珊王卑路斯背信弃义三犯我境！我已下令伪装干壕陷阱，勇士，随我引诱波斯重骑入网，阵斩萨珊国王！' },
            { speaker: 'player', text: '愿随阿赫雄大王于悉万斤就地诱敌伏击，令卑路斯一世与波斯铁骑葬身壕沟！' },
        ],
    },

    // #136 韦睿 (442 ~ 520) — 公元507年钟离大捷（本城就地开战）
    hao_d_weirui: {
        generalId: 'hao_d_weirui',
        battleName: '钟离之战',
        battleYear: 507,
        battleType: 'field',
        role: 'defender',
        targetName: '钟离',
        targetCityId: 'city_bengbu',
        targetLat: 32.92,
        targetLng: 117.38,
        myTroops: 50000,
        enemyFactionId: 'tuoba',
        enemyFactionName: '北魏',
        enemyGeneralName: '元英',
        enemyTroops: 100000,
        introLines: [
            { speaker: 'general', text: '元英百万之众扎连桥围钟离孤城，淮水春汛已至！某虽羸弱乘柴车，壮士，持长矛火炬随我乘舰纵火，焚断敌桥！' },
            { speaker: 'player', text: '愿随韦豫州于钟离就地火烧邵阳洲浮桥，大破元英与杨大眼北魏主力！' },
        ],
    },

    // #137 狄奥多里克 (454 ~ 526) — 公元493年拉文纳围城战（本城就地开战）
    gen_theodoric_great: {
        generalId: 'gen_theodoric_great',
        battleName: '拉文纳围城战',
        battleYear: 493,
        battleType: 'siege',
        role: 'attacker',
        targetName: '拉文纳',
        targetCityId: 'city_ravenna',
        targetLat: 44.41,
        targetLng: 12.2,
        myTroops: 40000,
        enemyFactionId: 'rierman',
        enemyFactionName: '奥多亚克王国',
        enemyGeneralName: '奥多亚克',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '蛮王奥多亚克困守沼泽拉文纳三年，粮尽援绝！东哥特的勇士们，随我合围沼泽港口，彻底定鼎全意大利！' },
            { speaker: 'player', text: '愿随狄奥多里克大王于拉文纳就地攻城，击败奥多亚克、建立东哥特王国！' },
        ],
    },

    // #138 头罗曼 (455 ~ 515) — 公元498年犍陀罗南征之战
    yanda_touluoman: {
        generalId: 'yanda_touluoman',
        battleName: '犍陀罗远征之战',
        battleYear: 498,
        battleType: 'field',
        role: 'attacker',
        targetName: '白沙瓦',
        targetCityId: 'city_baishawa',
        targetLat: 34.01,
        targetLng: 71.52,
        myTroops: 50000,
        enemyFactionId: 'jibin',
        enemyFactionName: '笈多帝国',
        enemyGeneralName: '布达笈多',
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '笈多帝国衰微内乱，富庶的旁遮普平原正待白匈奴征服！草原与高山的勇士，策马跨过开伯尔山口，随我杀入天竺！' },
            { speaker: 'player', text: '愿随头罗曼大王铁骑南下白沙瓦，征服犍陀罗与北印平原！' },
        ],
    },

    // #139 萧衍 (464 ~ 549) — 公元501年建康起义灭东昏侯之战
    xiao_d_xiaoyan: {
        generalId: 'xiao_d_xiaoyan',
        battleName: '建康攻城战',
        battleYear: 501,
        battleType: 'siege',
        role: 'attacker',
        targetName: '金陵',
        targetCityId: 'city_nanjing',
        targetLat: 32.05,
        targetLng: 118.77,
        myTroops: 50000,
        enemyFactionId: 'jinling',
        enemyFactionName: '南齐朝廷军',
        enemyGeneralName: '王珍国',
        enemyTroops: 60000,
        introLines: [
            { speaker: 'general', text: '东昏侯昏暴诛戮忠良，天下共愤！襄阳义师顺流东下已抵建康城下，壮士，随萧某督攻台城，诛除暴君再造江山！' },
            { speaker: 'player', text: '愿随萧公顺江东指金陵建康，击破朱雀航守军、开创大梁盛世！' },
        ],
    },

    // #140 克洛维 (466 ~ 511) — 公元486年苏瓦松之战（本城就地开战）
    gen_clovis_i: {
        generalId: 'gen_clovis_i',
        battleName: '苏瓦松之战',
        battleYear: 486,
        battleType: 'field',
        role: 'attacker',
        targetName: '里昂',
        targetCityId: 'city_lyon',
        targetLat: 45.76,
        targetLng: 4.83,
        myTroops: 30000,
        enemyFactionId: 'luoma_diguo',
        enemyFactionName: '罗马苏瓦松残余',
        enemyGeneralName: '西亚格里乌斯',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '罗马的高卢总督已是强弩之末！法兰克的战士们，握紧手中的投掷战斧，随我踏碎苏瓦松防线，夺下整片高卢！' },
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
