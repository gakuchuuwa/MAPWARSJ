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

    // #12 克罗伊斯 (-595 ~ -546) — 公元前560年以弗所攻城战
    ldiya_keluoyisi: {
        generalId: 'ldiya_keluoyisi',
        battleName: '以弗所之战',
        battleYear: -560,
        battleType: 'siege',
        targetName: '以弗所',
        targetCityId: 'city_yifusuo',
        targetLat: 37.94,
        targetLng: 27.34,
        myTroops: 30000,
        enemyFactionId: 'aiaoniya',
        enemyFactionName: '爱奥尼亚',
        enemyGeneralName: '平达罗斯',
        enemyTroops: 18000,
        introLines: [
            { speaker: 'general', text: '爱奥尼亚沿海名城以弗所富甲一方，僭主平达罗斯负隅顽抗。我吕底亚铁骑已经集结完毕，你可愿随我西征以弗所？' },
            { speaker: 'player', text: '愿随克罗伊斯陛下出征，攻下以弗所名城！' },
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

    // #19 巴西达斯 (-465 ~ -422) — 公元前422年安菲波利斯/哈尔基季基会战
    gen_brasidas: {
        generalId: 'gen_brasidas',
        battleName: '安菲波利斯会战',
        battleYear: -422,
        battleType: 'field',
        targetName: '哈尔基季基',
        targetCityId: 'city_aolinsuosi',
        targetLat: 40.29,
        targetLng: 23.35,
        myTroops: 12000,
        enemyFactionId: 'xila',
        enemyFactionName: '阿提卡',
        enemyGeneralName: '克里昂',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '雅典主战派统帅克里昂率远征军北上色雷斯，企图夺回爱琴海北岸重镇！趁敌军阵脚未稳，你可愿随我率斯巴达勇士迎头痛击克里昂？' },
            { speaker: 'player', text: '愿随巴西达斯将军出击，一战击溃克里昂的雅典远征军！' },
        ],
    },

    // #20 吕山德 (-445 ~ -395) — 公元前405年羊河/赫勒斯滂决战
    gen_lysander: {
        generalId: 'gen_lysander',
        battleName: '羊河之战',
        battleYear: -405,
        battleType: 'field',
        targetName: '赫勒斯滂对岸',
        targetCityId: 'city_teluoyi',
        targetLat: 39.9575,
        targetLng: 26.2389,
        myTroops: 25000,
        enemyFactionId: 'xila',
        enemyFactionName: '阿提卡',
        enemyGeneralName: '科农',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '雅典将军科农率主力陈兵赫勒斯滂海峡，已经连续数日轻敌松懈！今正是雷霆出击、终结伯罗奔尼撒战争的决胜之机，你可愿随我突袭雅典大军？' },
            { speaker: 'player', text: '愿随吕山德统帅奇袭赫勒斯滂，一战全歼雅典主力！' },
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
