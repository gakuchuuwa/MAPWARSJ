/**
 * 武将首次会面·历史成名战设定（GeneralFirstBattles）
 *
 * 规则：
 * 1. 玩家首次找到该武将时，触发符合其真实历史战役的对话场景。
 * 2. 对话结束后，玩家加入该势力，武将按史实配备兵力，
 *    无视沿途其他城池与军团（scriptMarchExempt + __scriptPinned），直奔历史战场。
 * 3. 对手设定：
 *    - 若史料明确记载对手武将姓名，则将战场敌帅设为该对手；
 *    - 若史料未载具体姓名，则按其历史所属势力设为「{势力名}武将」。
 *    - 敌方兵力同样按历史配置。
 * 4. 战斗类型：
 *    - 'field'：野战（可在战场坐标或直接在据点坐标打野战，不转攻城）；
 *    - 'siege'：攻城战（直奔目标据点发起攻城）。
 * 5. 成名战打完后解除锁定，继续随机攻打其他势力直至战败，再引导玩家前往下一位武将。
 *
 * 📌 录入进度备忘（2026-10-19；2026-10-25 按主人令清理）：
 * - 现库 475 条：**全部为名将**（成名战只对名将生效）。
 * - 🔴 [2026-10-25 主人令「成名战只做名将；普将的可以直接删除」] 普将成名战条目共 87 条已全部删除（其中 17 条有历史问题者先行删除，其余 70 条一并清掉）。
 * - 🔴 [2026-10-25 按史修正] 62 条名将成名战的敌将改为该战真实在场者（58 位新增战场人物，见 BattlefieldCharacters）；22 条生卒年数据一并修正。
 */

import { getGeneralProfile } from './general-skills/profiles';

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
    /** 🔴 [2026-10-21 主人令「奖励不要搞最近据点，按历史做成指定据点」] 野战打赢后奖励的据点（按史实指定）；没填的暂按旧规则取离战场最近的 */
    rewardCityId?: string;
    /** 战场纬度 */
    targetLat: number;
    /** 战场经度 */
    targetLng: number;
    /** 我方历史配备兵力 */
    myTroops: number;
    /** 对手所属势力 ID（对应 FACTIONS 表） */
    enemyFactionId: string;
    /** 对手历史势力名称（不知道具体敌将姓名时，自动显示为「{enemyFactionName}武将」） */
    enemyFactionName: string;
    /** 对手武将 ID（若对手在 FactionGenerals 中已有档案，可复用其立绘） */
    enemyGeneralId?: string;
    /** 对手历史配备兵力 */
    enemyTroops: number;
    /** 玩家首次会面时的历史场景对话 */
    introLines: FirstBattleDialogueLine[];
}

export const GENERAL_FIRST_BATTLES: Readonly<Record<string, GeneralFirstBattle>> = {
    // 🔴 [2026-10-25 补B] 尼基弗鲁斯 — 961 干地亚之战（收复克里特；敌帅阿齐兹）
    baizanting_nikephoros_phokas: {
        generalId: 'baizanting_nikephoros_phokas',
        battleName: '干地亚之战',
        battleYear: 961,
        battleType: 'field',
        role: 'attacker',
        targetName: '干地亚',
        targetLat: 35.34,
        targetLng: 25.13,
        myTroops: 20000,
        enemyFactionId: 'aguelabu',
        enemyFactionName: '阿格拉布',
        enemyGeneralId: 'bfe_abdulaziz_crete',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '克里特埃米尔阿齐兹据干地亚顽抗，其埃米尔国出自凯鲁万阿格拉布。我拜占庭大军已登陆克里特，你可愿随我拔除此岛、收复失地？' },
            { speaker: 'player', text: '愿随福卡斯登陆克里特，击破阿齐兹，收复干地亚！' },
        ],
    },

    // 🔴 [2026-10-25 补B] 科洛科特罗尼斯 — 1821 瓦尔泰齐之战（守村击退凯哈亚·穆斯塔法；敌帅穆斯塔法）
    xilawangguo_kolokotronis: {
        generalId: 'xilawangguo_kolokotronis',
        battleName: '瓦尔泰齐之战',
        battleYear: 1821,
        battleType: 'field',
        role: 'defender',
        targetName: '瓦尔泰齐',
        targetLat: 37.5,
        targetLng: 22.35,
        myTroops: 10000,
        enemyFactionId: 'osman',
        enemyFactionName: '奥斯曼',
        enemyGeneralId: 'bfe_kehaya_mustafa',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '胡尔希德帕夏的副帅凯哈亚穆斯塔法率五千奥斯曼与阿尔巴尼亚军从特里波利察出击，三路围攻瓦尔泰齐。我希腊军已在村外山地设防，你可愿随我据险迎敌？' },
            { speaker: 'player', text: '愿随科洛科特罗尼斯死守瓦尔泰齐，击退穆斯塔法！' },
        ],
    },

    // 🔴 [2026-10-25 补B] 加里波第 — 1860 卡拉塔菲米之战（千人远征首捷；敌帅兰迪）
    yidali_wangguo_garibaldi: {
        generalId: 'yidali_wangguo_garibaldi',
        battleName: '卡拉塔菲米之战',
        battleYear: 1860,
        battleType: 'field',
        role: 'attacker',
        targetName: '卡拉塔菲米',
        targetLat: 37.9,
        targetLng: 12.85,
        myTroops: 10000,
        enemyFactionId: 'liangxixili',
        enemyFactionName: '两西西里',
        enemyGeneralId: 'bfe_landi',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '兰迪率两西西里军据守卡拉塔菲米高地。我红衫军只有千人，但西西里人已望风来投，你可愿随我仰攻破敌？' },
            { speaker: 'player', text: '愿随加里波第强攻卡拉塔菲米，击溃兰迪的两西西里军！' },
        ],
    },

    // 🔴 [2026-10-25 补B] 华伦斯坦 — 1626 德绍桥之战（敌帅曼斯菲尔德）
    boximiya_wallenstein: {
        generalId: 'boximiya_wallenstein',
        battleName: '德绍桥之战',
        battleYear: 1626,
        battleType: 'field',
        role: 'attacker',
        targetName: '德绍桥',
        targetLat: 51.83,
        targetLng: 12.24,
        myTroops: 20000,
        enemyFactionId: 'boximiya',
        enemyFactionName: '波西米亚',
        enemyGeneralId: 'bfe_mansfeld',
        enemyTroops: 12000,
        introLines: [
            { speaker: 'general', text: '曼斯菲尔德率新教雇佣军据守易北河德绍桥，企图切断我军补给。我帝国军已在桥头展开，你可愿随我强攻夺桥？' },
            { speaker: 'player', text: '愿随华伦斯坦强攻德绍桥，击破曼斯菲尔德！' },
        ],
    },
    // 🔴 [2026-10-25 补B] 阿斯基亚 — 1493 安法奥之战（敌帅桑尼巴鲁）
    songhai_askia_muhammad: {
        generalId: 'songhai_askia_muhammad',
        battleName: '安法奥之战',
        battleYear: 1493,
        battleType: 'field',
        role: 'attacker',
        targetName: '安法奥',
        targetLat: 16.27,
        targetLng: 0.05,
        myTroops: 20000,
        enemyFactionId: 'songhai',
        enemyFactionName: '桑海',
        enemyGeneralId: 'bfe_sonni_baru',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '桑尼巴鲁继位后失尽军心，我已联合诸部起兵。今日在安法奥平原决战，你可愿随我推翻旧主、另立新朝？' },
            { speaker: 'player', text: '愿随阿斯基亚决战安法奥，开创桑海新朝！' },
        ],
    },
    // 🔴 [2026-10-25 补B] 埃雷克莱二世 — 1795 克尔察尼西之战（敌帅阿迦穆罕默德）
    gelujiya_erekle_ii: {
        generalId: 'gelujiya_erekle_ii',
        battleName: '克尔察尼西之战',
        battleYear: 1795,
        battleType: 'field',
        role: 'defender',
        targetName: '克尔察尼西',
        targetLat: 41.6,
        targetLng: 44.8,
        myTroops: 20000,
        enemyFactionId: 'qiajia',
        enemyFactionName: '恺加',
        enemyGeneralId: 'bfe_agha_mohammad',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '阿迦穆罕默德率波斯大军进逼第比利斯，已抵克尔察尼西。我格鲁吉亚军已列阵御敌，你可愿随我保卫都城？' },
            { speaker: 'player', text: '愿随埃雷克莱二世死守克尔察尼西，挡住阿迦穆罕默德！' },
        ],
    },

    // 🔴 [2026-10-25 补B] 贝利撒留 — 530 达拉之战（守城击退萨珊；敌帅佩罗泽斯）
    baizanting_belisarius: {
        generalId: 'baizanting_belisarius',
        battleName: '达拉之战',
        battleYear: 530,
        battleType: 'siege',
        role: 'defender',
        targetName: '达拉',
        targetLat: 37.18,
        targetLng: 40.56,
        myTroops: 25000,
        enemyFactionId: 'sashan',
        enemyFactionName: '萨珊',
        enemyGeneralId: 'bfe_perozes',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '萨珊大将佩罗泽斯率四万波斯军进围达拉，城墙已受投石猛攻。我拜占庭守军二万五千已在城头列阵，你可愿随我死守此塞？' },
            { speaker: 'player', text: '愿随贝利撒留死守达拉，把佩罗泽斯的波斯军挡在城墙之下！' },
        ],
    },
    // 🔴 [2026-10-25 补B] 维里亚图斯 — 前 147 卢西塔尼亚伏击（灭罗马军杀维特里乌斯）
    luxitaniya_viriathus: {
        generalId: 'luxitaniya_viriathus',
        battleName: '卢西塔尼亚之战',
        battleYear: -147,
        battleType: 'field',
        role: 'attacker',
        targetName: '卢西塔尼亚',
        targetLat: 40.0,
        targetLng: -6.0,
        myTroops: 10000,
        enemyFactionId: 'luoma_diguo',
        enemyFactionName: '罗马',
        enemyGeneralId: 'bfe_vetilius',
        enemyTroops: 9000,
        introLines: [
            { speaker: 'general', text: '罗马将维特里乌斯率军深入卢西塔尼亚，正沿谷道推进。我已在山隘两侧布下伏兵，你可愿随我合围，全歼这支罗马军？' },
            { speaker: 'player', text: '愿随维里亚图斯伏击维特里乌斯，让罗马人记住卢西塔尼亚的山谷！' },
        ],
    },
    // 🔴 [2026-10-25 补B] 奥斯特罗格斯基 — 1514 奥尔沙之战（大胜莫斯科；敌帅切利亚德宁）
    litaowan_ostrogski: {
        generalId: 'litaowan_ostrogski',
        battleName: '奥尔沙之战',
        battleYear: 1514,
        battleType: 'field',
        role: 'attacker',
        targetName: '奥尔沙',
        targetLat: 54.5,
        targetLng: 30.4,
        myTroops: 30000,
        enemyFactionId: 'mosike_gongguo',
        enemyFactionName: '莫斯科',
        enemyGeneralId: 'bfe_chelyadnin',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '莫斯科统帅切利亚德宁率大军渡第聂伯河而来，企图夺回斯摩棱斯克。我军已在奥尔沙对岸列阵，你可愿随我半渡而击？' },
            { speaker: 'player', text: '愿随奥斯特罗格斯基在奥尔沙大破莫斯科军！' },
        ],
    },
    // 🔴 [2026-10-25 补B] 欧根亲王 — 1697 曾塔之战（大败奥斯曼；敌苏丹穆斯塔法二世）
    habusibao_eugene: {
        generalId: 'habusibao_eugene',
        battleName: '曾塔之战',
        battleYear: 1697,
        battleType: 'field',
        role: 'attacker',
        targetName: '曾塔',
        targetLat: 45.38,
        targetLng: 20.25,
        myTroops: 50000,
        enemyFactionId: 'osman',
        enemyFactionName: '奥斯曼',
        enemyGeneralId: 'bfe_mustafa_ii',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '苏丹穆斯塔法二世率八万奥斯曼军围攻曾塔，正渡蒂萨河。我军五万已在其侧翼展开，你可愿随我趁其半渡突袭，一举击溃奥斯曼主力？' },
            { speaker: 'player', text: '愿随欧根亲王在曾塔大破穆斯塔法二世！' },
        ],
    },

    // 🔴 [2026-10-25 补B] 赫梅利尼茨基 — 1648 黄水之战（哥萨克起义首捷；敌帅波托茨基）
    gesake_khmelnytsky: {
        generalId: 'gesake_khmelnytsky',
        battleName: '黄水之战',
        battleYear: 1648,
        battleType: 'field',
        role: 'attacker',
        targetName: '黄水',
        targetLat: 48.35,
        targetLng: 33.5,
        myTroops: 5000,
        enemyFactionId: 'bolan',
        enemyFactionName: '波兰',
        enemyGeneralId: 'bfe_potocki',
        enemyTroops: 4000,
        introLines: [
            { speaker: 'general', text: '波兰军已进至黄水河畔，波托茨基麾下翼骑与雇佣步兵正渡河而来。我哥萨克全军已在河湾列阵，你可愿随我迎击，断其归路？' },
            { speaker: 'player', text: '愿随赫梅利尼茨基迎战波托茨基，在黄水河畔大破波兰军！' },
        ],
    },

    // #1 吉甫 (-852 ~ -775) — 周宣王五年（前823年）太原北伐猃狁之战

    // #2 提格拉特 (-795 ~ -727) — 公元前732年大马士革之战
    guyashu_tigelate: {
        generalId: 'guyashu_tigelate',
        battleName: '大马士革之战',
        battleYear: -732,
        battleType: 'siege',
        role: 'attacker',
        targetName: '大马士革',
        targetCityId: 'city_damasikusi',
        targetLat: 33.5131,
        targetLng: 36.3094,
        myTroops: 45000,
        enemyFactionId: 'yalan',   // 🔴 [2026-10-25 按史] 敌将势力对齐
        enemyFactionName: '亚兰',
        enemyGeneralId: 'bfe2_rezin',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '亚兰王利汛纠合黎凡特诸邦背叛亚述。我已整编亚述常备王军，正欲西进踏平大马士革，你可愿随军出征？' },
            { speaker: 'player', text: '愿入亚述王军帐下，随陛下直取大马士革！' },
        ],
    },

    // #3 萨尔贡 (-762 ~ -705) — 公元前714年远征乌拉尔图之战
    yashu_saergong: {
        generalId: 'yashu_saergong',
        battleName: '乌拉尔图之战',
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
        enemyGeneralId: 'bfe_rusa_i',   // 🔴 [2026-10-25 按史] 前714 乌拉尔图王为鲁萨一世（前735–714），原填萨尔杜里一世（前828 卒）
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '北方乌拉尔图王鲁萨一世屡窥我亚述北境。我大军即将翻越扎格罗斯山脉直捣图什帕，勇士可愿同行？' },
            { speaker: 'player', text: '愿随萨尔贡陛下北征乌拉尔图，扬威群山之巅！' },
        ],
    },

    // #4 鬬廉 (-750 ~ -690) — 公元前701年蒲骚之战

    // #5 塔哈尔卡 (-710 ~ -664) — 公元前673年佩鲁西姆迎击亚述之战
    dibisi_tahaerka: {
        generalId: 'dibisi_tahaerka',
        battleName: '佩鲁西姆之战',
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
        enemyGeneralId: 'bfe2_esarhaddon',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '亚述王阿萨尔哈东率铁骑大举进犯埃及东门佩鲁西姆！我已集结上下埃及与努比亚大军北上迎敌，你可愿随我保卫阿蒙神之土？' },
            { speaker: 'player', text: '愿随法老北赴佩鲁西姆，将亚述入侵之师击退于国门之外！' },
        ],
    },

    // #6 萨姆提克 (-685 ~ -610) — 公元前656年一统孟菲斯之战

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
        enemyFactionId: 'chuguo',
        enemyFactionName: '楚国',
        enemyGeneralId: 'bfe2_ziyu',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '楚令尹子玉率师北上，退避三舍已报楚恩，今当在城濮之野与楚军决一死战！壮士可愿入我晋国中军，共破强楚？' },
            { speaker: 'player', text: '愿随原轸元帅奔赴城濮，以虎皮蒙马冲阵，大破子玉楚师！' },
        ],
    },

    // #8 那波帕拉萨 (-658 ~ -605) — 公元前612年尼尼微之战
    sumeier_nabopalasa: {
        generalId: 'sumeier_nabopalasa',
        battleName: '尼尼微之战',
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
        enemyGeneralId: 'bfe2_sin_shar_ishkun',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '亚述暴政压迫两河流域已久！我巴比伦大军正沿底格里斯河北上，誓要攻破尼尼微，终结亚述王辛沙里施昆的统治，你可愿随军北伐？' },
            { speaker: 'player', text: '愿随陛下挥师北上，攻克尼尼微巨城！' },
        ],
    },

    // #9 尼布甲尼撒 (-634 ~ -562) — 公元前587年耶路撒冷之战
    jialedi_nibujianisa: {
        generalId: 'jialedi_nibujianisa',
        battleName: '耶路撒冷之战',
        battleYear: -587,
        battleType: 'siege',
        role: 'attacker',
        targetName: '耶路撒冷',
        targetCityId: 'city_yelusaleng',
        targetLat: 31.77,
        targetLng: 35.21,
        myTroops: 40000,
        enemyFactionId: 'xibolai',
        enemyFactionName: '希伯来',
        enemyGeneralId: 'bfe3_1',   // 西底家＝同一人，指向据点武将，不用重复的战场人物
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
        enemyGeneralId: 'bfe2_xun_linfu',
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
        myTroops: 50000,
        enemyFactionId: 'jialedi',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '迦勒底',
        enemyGeneralId: 'wuer_boshasha',
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
        enemyFactionId: 'aqimeinide',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '波斯',
        enemyGeneralId: 'ailan_julushi',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '波斯王居鲁士二世率大军追击至此，已陈兵我都城斯法尔德城外平原！我吕底亚精锐铁骑尽在此处，你可愿随我就地迎战波斯大军？' },
            { speaker: 'player', text: '愿随克罗伊斯陛下出城列阵，于斯法尔德平原迎战居鲁士二世！' },
        ],
    },

    // #13 大流士一世 (-550 ~ -486) — 公元前521年平定巴比伦之战
    aqimeinide_daliushi: {
        generalId: 'aqimeinide_daliushi',
        battleName: '巴比伦之战',
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
        enemyGeneralId: 'bfe2_nidintu_bel',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '巴比伦叛首尼丁图贝尔妄称先王之子，据巴比伦举兵谋逆。我亲率不死军与波斯主力西征讨逆，你可愿随王师出战？' },
            { speaker: 'player', text: '愿奉万王之王号令，随大军西征巴比伦！' },
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
        enemyFactionId: 'chuguo',
        enemyFactionName: '楚国',
        enemyGeneralId: 'bfe2_zi_chang',
        enemyTroops: 50000,
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
        myTroops: 22000,
        enemyFactionId: 'xila',
        enemyFactionName: '阿提卡',
        enemyGeneralId: 'gen_miltiades',   // 🔴 [2026-10-20 成名战规则] 前490 马拉松雅典主将是米太亚德，不是前490后才崛起的地米斯托
        enemyTroops: 11000,
        introLines: [
            { speaker: 'general', text: '优卑亚诸城已下，唯有雅典仍敢抗拒波斯王命！我军即将渡过海峡登陆马拉松平原，与雅典将领米太亚德决战，你可愿随军冲锋？' },
            { speaker: 'player', text: '愿随达提斯统帅渡海西进，决战马拉松平原！' },
        ],
    },

    // #16 阿尔塔弗涅斯 (-530 ~ -485) — 公元前498年撒狄之战（原写米利都围城：前494 米利都守将史无确名）
    gen_artaphernes: {
        generalId: 'gen_artaphernes',
        // 🔴 [2026-10-25 按史修复「米利都 -494 守将无名」] 改选同一次伊奥尼亚起义的撒狄之战（前498）：阿尔塔弗涅斯以吕底亚总督守撒狄卫城，伊奥尼亚起义军主将＝阿里斯塔戈拉斯（阿里斯塔，库中已有）；依据希罗多德 5.99–102。
        battleName: '撒狄之战',
        battleYear: -498,
        battleType: 'siege',
        role: 'defender',
        targetName: '撒狄卫城',
        targetCityId: 'city_sifaerde',
        targetLat: 38.48,
        targetLng: 28.03,
        myTroops: 20000,
        enemyFactionId: 'aiaoniya',
        enemyFactionName: '伊奥尼亚',
        enemyGeneralId: 'aiaoniya_alisita',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '阿里斯塔戈拉斯蛊惑伊奥尼亚诸邦叛我大王，雅典战舰助其攻我撒狄！外城火起，卫城尚在我手——壮士，随本总督死守石墙，待波斯援军合围叛军！' },
            { speaker: 'player', text: '愿随阿尔塔弗涅斯总督死守撒狄卫城，击退伊奥尼亚叛军！' },
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
        enemyFactionId: 'aqimeinide',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '波斯帝国',
        enemyGeneralId: 'bfe2_mardonius',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '波斯统帅马多尼乌斯率五万大军屯驻波奥蒂亚平原！我正率希腊同盟重装步兵北上普拉提亚与波斯陆军决一死战，勇士可愿并肩作战？' },
            { speaker: 'player', text: '愿随阿里斯提德将军奔赴普拉提亚，彻底击溃马多尼乌斯的波斯主力！' },
        ],
    },

    // #18 地米斯托 (-524 ~ -459) — 公元前480年希波决战
    gen_themistocles: {
        generalId: 'gen_themistocles',
        battleName: '阿尔特米西昂之战',
        battleYear: -480,
        battleType: 'field',
        role: 'attacker',
        targetName: '卡里斯托斯',
        targetCityId: 'city_kalisituosi',
        targetLat: 38.01,
        targetLng: 24.42,
        myTroops: 30000,
        enemyFactionId: 'aqimeinide',
        enemyFactionName: '波斯帝国',
        enemyGeneralId: 'bfe_achaemenes',   // 🔴 [2026-10-25 按史] 前480 优卑亚（阿特米西乌姆）波斯舰队统帅＝阿凯门尼斯（达提斯前490 已死）
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
        enemyGeneralId: 'bfe2_cleon',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '雅典统帅克里昂已率军逼近安菲波利斯城下，敌军侦察大意、队列松散！正当此时打开城门雷霆突击，你可愿随我就地迎战克里昂？' },
            { speaker: 'player', text: '愿随巴西达斯将军出城突击，就地击溃克里昂的雅典大军！' },
        ],
    },

    // #20 吕山德 (-445 ~ -395) — 公元前405年羊河之战
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
        enemyGeneralId: 'bfe2_conon',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '雅典将军科农率主力陈兵羊河滩头，连续数日轻敌懈怠、士卒四散觅食！今正是终结伯罗奔尼撒战争的决胜之机，你可愿随我突袭雅典大军？' },
            { speaker: 'player', text: '愿随吕山德统帅出击，于羊河全歼雅典主力！' },
        ],
    },

    // #21 吴起 (-440 ~ -381) — 公元前389年阴晋之战

    // #22 阿泰阿斯 (-429 ~ -339) — 公元前339年多瑙河之战（本城就地开战）
    sijitai_ateas: {
        generalId: 'sijitai_ateas',
        battleName: '多瑙河之战',
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
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '马其顿的腓力老贼贪图我草原的牛羊战马，竟敢跨越多瑙河！草原的勇士，上马挽弓，随我踏碎敌阵！' },
            { speaker: 'player', text: '愿随阿泰阿斯大王策马出击，迎战腓力二世！' },
        ],
    },

    // #23 阿契塔 (-428 ~ -347) — 公元前367年塔兰托保卫战（本城就地开战）

    // #24 内克塔内布一世 (-420 ~ -360) — 公元前373年佩鲁西姆之战
    aiji_neiketaneibu: {
        generalId: 'aiji_neiketaneibu',
        battleName: '佩鲁西姆之战',
        battleYear: -373,
        battleType: 'field',
        role: 'attacker',
        targetName: '佩鲁西姆',
        targetCityId: 'city_peiluximu',
        targetLat: 31.0417,
        targetLng: 32.545,
        myTroops: 40000,
        enemyFactionId: 'aqimeinide',
        enemyFactionName: '波斯帝国',
        enemyGeneralId: 'bfe2_pharnabazus',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '波斯总督引希腊雇佣军企图再次奴役埃及，尼罗河泛滥在即，壮士快快入伍，随我赴佩鲁西姆决战！' },
            { speaker: 'player', text: '愿随法老北赴佩鲁西姆，将法尔纳巴佐斯大军逐出埃及！' },
        ],
    },

    // #25 卡布里亚斯 (-420 ~ -357) — 公元前376年纳克索斯之战（本城就地开战）
    gen_chabrias: {
        generalId: 'gen_chabrias',
        battleName: '纳克索斯之战',
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
        enemyGeneralId: 'bfe2_pollis',
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
        enemyGeneralId: 'bfe2_cleombrotus_i',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '斯巴达的无敌神话今日必当终结！我的斜线大阵已布置妥当，英勇的壮士，随神圣军团冲锋，碾碎斯巴达王！' },
            { speaker: 'player', text: '愿随伊巴密浓达将军于留克特拉列阵冲锋，一举折断斯巴达长矛！' },
        ],
    },

    // #27 琉孔一世 (-410 ~ -355) — 公元前380年费奥多西亚攻城战

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
        enemyFactionId: 'aqimeinide',   // 🔴 [2026-10-28 按史] 前334 格拉尼库斯敌军是阿契美尼德波斯；原挂卡里亚（错：卡里亚只是波斯行省）
        enemyFactionName: '波斯帝国',
        enemyGeneralId: 'halikanasu_memnon',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '波斯骑兵正背水列阵，国王陛下严令强渡格拉尼库斯河。勇敢的壮士，执紧萨里沙长矛，随老夫强渡破敌！' },
            { speaker: 'player', text: '愿随帕曼纽老帅强渡格拉尼库斯河，击溃波斯大军！' },
        ],
    },

    // #29 阿尔塔巴佐斯 (-389 ~ -325) — 公元前330年赫卡尼亚之战（本城就地开战）
    hekaniya_artabazos: {
        generalId: 'hekaniya_artabazos',
        battleName: '赫卡尼亚之战',
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
        enemyGeneralId: 'gen_alexander_great',
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
        enemyGeneralId: 'bfe2_pang_juan',
        enemyTroops: 50000,
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
        enemyGeneralId: 'bfe2_theagenes',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '希腊联军负隅顽抗，马其顿方阵今日便要一统全希腊！壮士，握紧长矛，与亚历山大王子一同陷阵！' },
            { speaker: 'player', text: '愿随腓力二世陛下南征喀罗尼亚，确立马其顿霸权！' },
        ],
    },

    // #32 马泽乌斯 (-380 ~ -318) — 公元前331年塔普萨库斯之战（本城就地开战）
    xuliya_shoujiang: {
        generalId: 'xuliya_shoujiang',
        battleName: '塔普萨库斯之战',
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
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '亚历山大正欲跨过幼发拉底河！奉大流士陛下之命，我军需焦土阻敌。远来的壮士，拿起弯刀，与我扼守渡口！' },
            { speaker: 'player', text: '愿随马泽乌斯总督于幼发拉底河畔就地扼守，阻击马其顿军！' },
        ],
    },

    // #33 斐赖的伊阿宋 (-380 ~ -324) — 公元前374年福基斯之战
    hesitiya_yiasong: {
        generalId: 'hesitiya_yiasong',
        battleName: '福基斯之战',
        battleYear: -374,
        battleType: 'field',
        role: 'attacker',
        targetName: '德尔斐',
        targetCityId: 'city_deerfei',
        targetLat: 38.48,
        targetLng: 22.5,
        myTroops: 28000,
        enemyFactionId: 'xila',
        enemyFactionName: '福基斯',
        enemyGeneralId: 'fujisi_fujiweng',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '色萨利铁骑已整备完毕，整个希腊霸权唾手可得。前方的福基斯人不堪一击，勇士，随我南征德尔斐！' },
            { speaker: 'player', text: '愿随伊阿宋统帅策马南下，威服福基斯诸邦！' },
        ],
    },

    // #34 萨提巴扎尼斯 (-375 ~ -328) — 公元前328年阿里亚之战（本城就地开战）
    aliya_satibazanishi: {
        generalId: 'aliya_satibazanishi',
        battleName: '阿里亚之战',
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
        enemyGeneralId: 'bfe_erigius',   // 🔴 [2026-10-25 按史] 前330 讨萨提巴扎尼斯＝埃里吉乌斯阵斩之（亚历山大未亲临）
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
        enemyGeneralId: 'bfe_mendenus',   // 🔴 [2026-10-25 按史] 前329 波利提美图斯河之战马其顿方＝门德努斯偏师（亚历山大不在场）
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '亚历山大的偏师已被诱入泽拉夫尚河谷，粟特与塞种弓骑已经合围！壮士，上马放箭，彻底全歼敌军！' },
            { speaker: 'player', text: '愿随斯皮塔米尼斯将军奔袭撒马尔罕，围歼法尔努克所部！' },
        ],
    },

    // #36 贝苏斯 (-370 ~ -329) — 公元前331年高加米拉之战（巴克特里亚左翼）
    // 🔴 [2026-10-24 主人令「贝苏斯守里海门核对后改为阿里奥巴尔扎内斯或换战役」] 原「里海门阻击战」是错战：
    //    前330年冬死守隘口的是波西斯总督阿里奥巴赞斯（波斯门，Persian Gate，近波斯波利斯），不是贝苏斯；
    //    里海门（Caspian Gates）只是大流士被贝苏斯一党擒拿处。贝苏斯本人当时在巴克特里亚，未守该门。
    //    按史换战役：贝苏斯参加了前331年高加米拉之战，为波斯左翼提供巴克特里亚、索格底亚那、印度与塞种兵
    //    （英文维基百科 Bessus：took part in the Battle of Gaugamela … supplied Bactrians, Sogdians, Indians, Saka）。
    //    战场取 Battlefields.ts 的 bf_gaojiamila（36.56,43.444）；野战不锚城，免得打到 35km 外的尼尼微。
    eerbulushi_beisusi: {
        generalId: 'eerbulushi_beisusi',
        battleName: '高加米拉之战',
        battleYear: -331,
        battleType: 'field',
        role: 'defender',
        targetName: '高加米拉平原',
        targetCityId: 'city_niniwei',   // 🔴 [2026-10-25 按史] 城库无该战场，锚最近据点 尼尼微（约 34 km）
        targetLat: 36.56,
        targetLng: 43.444,
        myTroops: 30000,
        enemyFactionId: 'maqidun',
        enemyFactionName: '马其顿',
        enemyGeneralId: 'gen_alexander_great',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '大流士王集波斯、巴克特里亚、索格底亚那与塞种之众于高加米拉，某率巴克特里亚铁骑当左翼！马其顿方阵已压上，壮士，随我纵骑冲阵，护住王旗！' },
            { speaker: 'player', text: '愿随贝苏斯总督决战高加米拉，破马其顿军！' },
        ],
    },

    // #37 托勒密一世 (-367 ~ -282) — 公元前321年尼罗河之战
    tuolemi_tuolemi: {
        generalId: 'tuolemi_tuolemi',
        battleName: '尼罗河之战',
        battleYear: -321,
        battleType: 'field',
        role: 'attacker',
        targetName: '佩鲁西姆',
        targetCityId: 'city_peiluximu',
        targetLat: 31.0417,
        targetLng: 32.545,
        myTroops: 35000,
        enemyFactionId: 'maqidun',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '帝国摄政军',
        enemyGeneralId: 'gen_perdiccas',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '摄政王佩尔狄卡斯大兵压境企图夺我埃及！骆驼要塞与尼罗河鳄鱼皆是敌军死地，壮士速来随我破敌！' },
            { speaker: 'player', text: '愿随托勒密陛下奔赴佩鲁西姆，击退佩尔狄卡斯大军！' },
        ],
    },

    // #38 涅阿库斯 (-360 ~ -300) — 公元前325年奥里泰之战
    xinde_patalawang: {
        generalId: 'xinde_patalawang',
        battleName: '奥里泰之战',
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
        enemyGeneralId: 'aolitai_shouling',
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
        enemyFactionId: 'aqimeinide',   // 🔴 [2026-10-28 按史] 前334 格拉尼库斯敌军是阿契美尼德波斯；原挂卡里亚（错：卡里亚只是波斯行省）
        enemyFactionName: '波斯帝国',
        enemyGeneralId: 'halikanasu_memnon',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '波斯总督将大军布于对岸，以为浅滩能阻挡马其顿勇士？壮士，披上战甲，随我的同伴骑兵踏浪冲锋！' },
            { speaker: 'player', text: '愿随亚历山大东征，于格拉尼库斯河击破波斯大军！' },
        ],
    },

    // #40 司马错 (-350 ~ -280) — 公元前316年葭萌之战
    qin_simacuo: {
        generalId: 'qin_simacuo',
        battleName: '葭萌之战',
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
        enemyGeneralId: 'bfe3_2',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '得蜀则得楚，秦国一统之策全系于此！大军已走石牛道入蜀，壮士，入伍随某平定葭萌，尽取巴蜀沃土！' },
            { speaker: 'player', text: '愿随司马将军走石牛道南下，一举攻取葭萌、平定巴蜀！' },
        ],
    },

    // #41 赵武灵王赵雍 (-340 ~ -295) — 公元前300年北破林胡楼烦之战

    // #42 旃陀罗笈多 (-340 ~ -297) — 公元前321年华氏城之战（本城就地开战）
    kongque_zhantuoluo: {
        generalId: 'kongque_zhantuoluo',
        battleName: '华氏城之战',
        battleYear: -321,
        battleType: 'siege',
        role: 'attacker',
        targetName: '华氏城',
        targetCityId: 'city_huashicheng',
        targetLat: 25.61,
        targetLng: 85.13,
        myTroops: 38000,
        enemyFactionId: 'mojietuo',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '难陀王朝',
        enemyGeneralId: 'bfe2_dhanananda',
        enemyTroops: 50000,
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
        myTroops: 50000,
        enemyFactionId: 'zhao',
        enemyFactionName: '赵国',
        enemyGeneralId: 'zhao_lianpo',
        enemyTroops: 50000,
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
        enemyGeneralId: 'bfe3_4',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '罗马人的蛮勇在马其顿方阵与战象面前微不足道。大希腊正向我们求援，勇士，随我渡海将罗马军团击溃！' },
            { speaker: 'player', text: '愿随皮洛士陛下渡海西征，于塔兰托击败罗马执政官拉维努斯！' },
        ],
    },

    // #45 田单 (-315 ~ -250) — 公元前279年即墨之战（本城就地开战）
    jiaodong_tiandan: {
        generalId: 'jiaodong_tiandan',
        battleName: '即墨之战',
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
        enemyGeneralId: 'bfe_qijie',   // 🔴 [2026-10-25 按史] 前279 即墨之战燕军主将＝骑劫（乐毅已降赵），田单火牛阵所破
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '燕军残暴辱我祖先，齐人之怒已如烈火！千头火牛今夜出城，壮士执刃随牛角杀出，光复齐国七十城！' },
            { speaker: 'player', text: '愿随田将军驱火牛夜袭燕营，就地斩杀骑劫、光复齐国！' },
        ],
    },

    // #46 乐毅 (-315 ~ -245) — 公元前284年济西之战
    yan_leyi: {
        generalId: 'yan_leyi',
        battleName: '济西之战',
        battleYear: -284,
        battleType: 'field',
        role: 'attacker',
        targetName: '济水西岸',
        targetCityId: 'city_jimo',
        targetLat: 36.403591,
        targetLng: 120.445862,
        myTroops: 38000,
        enemyFactionId: 'qi',
        enemyFactionName: '齐国',
        enemyGeneralId: 'bfe_chuzi',   // 🔴 [2026-10-25 按史] 前284 济西之战齐军主将＝触子（田单时为临淄市掾）
        enemyTroops: 50000,
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
        enemyGeneralId: 'bfe3_6',
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
        enemyGeneralId: 'bfe_lifu',   // 🔴 [2026-10-25 按史] 前251 鄗之战燕军主将＝栗腹（乐毅前279 已降赵）
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '燕国趁我长平之痛来犯我北疆，真欺赵国无人耶！老夫引兵反击，壮士，提刀随我迎击栗腹，直捣燕都！' },
            { speaker: 'player', text: '愿随廉老将军于邯郸城外就地出击，大破燕军、阵斩栗腹！' },
        ],
    },

    // #49 王翦 (-303 ~ -214) — 公元前224年蕲南之战
    ruo_wangjian: {
        generalId: 'ruo_wangjian',
        battleName: '蕲南之战',
        battleYear: -224,
        battleType: 'field',
        role: 'attacker',
        targetName: '蕲县蕲南',
        targetCityId: 'city_shouxian',
        targetLat: 32.57,
        targetLng: 116.78,
        myTroops: 50000,
        enemyFactionId: 'chuguo',
        enemyFactionName: '楚国',
        enemyGeneralId: 'bfe3_13',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '楚将项燕急于求胜，我军按兵不动一年，楚军气竭必乱！壮士，秦王假我六十万甲士，随老夫全线反击！' },
            { speaker: 'player', text: '愿随王老将军统秦师全线反击，大破楚帅项燕！' },
        ],
    },

    // #50 信陵君魏无忌 (-300 ~ -243) — 公元前257年邯郸之战
    shang_weiwuji: {
        generalId: 'shang_weiwuji',
        battleName: '邯郸之战',
        battleYear: -257,
        battleType: 'field',
        role: 'attacker',
        targetName: '邯郸城下',
        targetCityId: 'city_handan',
        targetLat: 36.61,
        targetLng: 114.49,
        myTroops: 50000,
        enemyFactionId: 'qin',
        enemyFactionName: '秦国',
        enemyGeneralId: 'bfe3_9',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '邯郸危在旦夕，唇亡齿寒！我已调集魏楚义军八万赶赴邯郸，壮士既怀忠义，随我解围杀退秦军！' },
            { speaker: 'player', text: '愿随信陵君疾驰邯郸，击破王龁秦军、解邯郸之围！' },
        ],
    },

    // #51 李牧 (-290 ~ -229) — 公元前244年善无破匈奴之战（本城就地开战）

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
        enemyGeneralId: 'bfe3_7',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '狭路相逢勇者胜！秦军据赤梁山以为高险，我已抢先登北山高地！壮士，随我居高临下，俯冲痛击秦军！' },
            { speaker: 'player', text: '狭路相逢勇者胜！愿随马服君于阏与就地大破胡伤秦军！' },
        ],
    },

    // #53 阿尔沙克一世 (-280 ~ -217) — 公元前238年帕提亚之战（本城就地开战）
    ansxi_aershake: {
        generalId: 'ansxi_aershake',
        battleName: '帕提亚之战',
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
        enemyGeneralId: 'bfe_andragoras',   // 🔴 [2026-10-25 按史] 前238 帕提亚立国的对手＝塞琉古叛将安德拉戈拉斯（安条克三世时年 3 岁）
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '塞琉古的总督四面受敌，草原帕尼部重见天日正在今朝！草原的好男儿，抄起弓马，随我夺回帕提亚！' },
            { speaker: 'player', text: '愿随阿尔沙克陛下于尼萨就地出击，击溃安德拉戈拉斯！' },
        ],
    },

    // #54 哈米尔卡·巴卡 (-275 ~ -228) — 公元前247年埃里克山阻击战

    // #55 刘邦 (-256 ~ -195) — 公元前206年陈仓之战
    han_d_liubang: {
        generalId: 'han_d_liubang',
        battleName: '陈仓之战',
        battleYear: -206,
        battleType: 'field',
        role: 'attacker',
        targetName: '陈仓',
        targetCityId: 'city_tianshui',
        targetLat: 34.58,
        targetLng: 105.73,
        myTroops: 50000,
        enemyFactionId: 'qin',
        enemyFactionName: '雍国',
        enemyGeneralId: 'wazhai_zhanghan',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '困守汉中非大丈夫所为！韩大将军已暗度陈仓，出其不意！壮士，随乃公杀回关中，天下谁人能挡！' },
            { speaker: 'player', text: '愿随汉王北出陈仓，击破章邯、还定三秦！' },
        ],
    },

    // #56 蒙恬 (-250 ~ -210) — 公元前215年高阙之战（本城就地开战）
    baiyang_mengtian: {
        generalId: 'baiyang_mengtian',
        battleName: '高阙之战',
        battleYear: -215,
        battleType: 'field',
        role: 'defender',
        targetName: '高阙塞',
        targetCityId: 'city_gaoque',
        targetLat: 41.195202,
        targetLng: 107.166138,
        myTroops: 50000,
        enemyFactionId: 'xiongnu',
        enemyFactionName: '匈奴',
        enemyGeneralId: 'bfe_touman',   // 🔴 [2026-10-25 按史] 前215 蒙恬所逐匈奴单于＝头曼（冒顿前209 才杀父自立）
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '始皇帝令我提甲士三十万北逐戎狄！高阙塞前烽燧已燃，壮士，随我上马收复河南地，叫胡人不敢南下！' },
            { speaker: 'player', text: '愿随蒙将军于高阙塞就地出击，痛击头曼单于、收复河南地！' },
        ],
    },

    // #57 汉尼拔 (-247 ~ -183) — 公元前216年坎尼之战
    gen_hannibal: {
        generalId: 'gen_hannibal',
        battleName: '坎尼之战',
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
        enemyGeneralId: 'waluo',
        enemyTroops: 50000,
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
        myTroops: 50000,
        enemyFactionId: 'chuguo',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '楚国',
        enemyGeneralId: 'bfe_xiangliang',   // 🔴 [2026-10-25 按史] 前208 定陶之战章邯所袭杀者＝项梁（项羽在雍丘）
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '项梁屡胜骄狂，其军早已懈怠！我军夜衔枚出城突袭，壮士随我陷阵，一战阵斩项梁，复我大秦威名！' },
            { speaker: 'player', text: '愿随章将军于定陶乘夜突袭，一战击破项梁楚军！' },
        ],
    },

    // #59 英布 (-245 ~ -196) — 公元前207年巨鹿之战
    liu_yingbu: {
        generalId: 'liu_yingbu',
        battleName: '巨鹿之战',
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
        enemyGeneralId: 'bfe3_17',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '项将军令我提兵渡漳水断绝秦军甬道，有进无退！不怕死的汉子，随我渡河死战，破秦军就在今日！' },
            { speaker: 'player', text: '愿随当阳君北渡漳水，断秦军甬道、大破王离秦军！' },
        ],
    },

    // #60 安条克三世 (-241 ~ -187) — 公元前200年帕尼翁之战
    sailiugu_antiaoke: {
        generalId: 'sailiugu_antiaoke',
        battleName: '帕尼翁之战',
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
        enemyGeneralId: 'bfe3_19',
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '叙利亚失地今日必当收回！我的重装铁甲骑兵已完成合围，壮士，随我冲垮托勒密的方阵，重振帝国荣光！' },
            { speaker: 'player', text: '愿随安条克三世陛下南征，于帕尼翁击溃斯科帕斯大军！' },
        ],
    },

    // #61 周勃 (-240 ~ -169) — 公元前205年渑池之战（本城就地开战）
    yangshao_zhoubo: {
        generalId: 'yangshao_zhoubo',
        battleName: '渑池之战',
        battleYear: -205,
        battleType: 'field',
        role: 'attacker',
        targetName: '渑池',
        targetCityId: 'city_mianchi',
        targetLat: 34.76,
        targetLng: 111.76,
        myTroops: 40000,
        enemyFactionId: 'qin',
        enemyFactionName: '雍国',
        enemyGeneralId: 'bfe_zhangping',   // 🔴 [2026-10-25 按史] 前205 好畤/景陵所破＝章平（章邯正困守废丘）
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '三秦负隅顽抗，章平聚众阻绝崤函！汉王令老夫攻拔渑池，壮士，执紧盾矛随我登城陷阵，斩将夺旗！' },
            { speaker: 'player', text: '愿随绛侯于渑池就地陷阵，击破章平大军！' },
        ],
    },

    // #62 赵佗 (-240 ~ -137) — 公元前214年番禺之战（本城就地开战）
    nanyue_zhaotuo: {
        generalId: 'nanyue_zhaotuo',
        battleName: '番禺之战',
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
        enemyGeneralId: 'bfe3_16',
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
        myTroops: 50000,
        enemyFactionId: 'han_d',
        enemyFactionName: '汉朝',
        enemyGeneralId: 'han_d_liubang',
        enemyTroops: 40000,
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
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '汉贼引诸侯大军占我彭城、掠我妇孺！我率三万铁骑奔袭千里，壮士，随我杀入敌阵，尽诛汉贼！' },
            { speaker: 'player', text: '愿随西楚霸王于彭城就地雷霆冲锋，大破刘邦诸侯联军！' },
        ],
    },

    // #65 韩信 (-231 ~ -196) — 公元前204年井陉之战（本城就地开战）
    xianyu_hanxin: {
        generalId: 'xianyu_hanxin',
        battleName: '井陉之战',
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
        enemyGeneralId: 'bfe3_18',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '赵军仗兵多轻我背水结阵！我已遣奇兵潜夺其营，背水一战退无可退！壮士，拔剑向前，随我生擒赵王！' },
            { speaker: 'player', text: '愿随淮阴侯于井陉口背水死战，一举击斩陈余、破赵立帜！' },
        ],
    },

    // #66 周亚夫 (-199 ~ -143) — 公元前154年昌邑之战
    huaiyang_zhouyafu: {
        generalId: 'huaiyang_zhouyafu',
        battleName: '昌邑之战',
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
        enemyGeneralId: 'bfe3_28',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '吴楚联军锐气方盛，直扑睢阳。我军坚壁不出断其粮道，敌军军心已散！壮士，铁骑出击全歼吴楚联军！' },
            { speaker: 'player', text: '愿随周太尉奔赴昌邑，追击并彻底荡平刘濞所部！' },
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
        enemyGeneralId: 'bfe3_23',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '异教徒肆虐圣殿、逼迫族人弃绝律法！主赐我等刚毅之力，壮士，随我伏击峡谷，斩杀塞琉古大将！' },
            { speaker: 'player', text: '愿随犹大马加比于伯特和仑就地奋战，斩杀塞隆！' },
        ],
    },

    // #68 米南德一世 (-185 ~ -130) — 公元前155年旁遮普之战
    najie_minande: {
        generalId: 'najie_minande',
        battleName: '旁遮普之战',
        battleYear: -155,
        battleType: 'field',
        role: 'attacker',
        targetName: '萨迦拉',
        targetCityId: 'city_laheer',
        targetLat: 31.55,
        targetLng: 74.35,
        myTroops: 35000,
        enemyFactionId: 'shunga',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '巽伽王朝',
        enemyGeneralId: 'bfe3_27',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '巽伽国军势已颓，此番越过印度河必一举底定旁遮普！骁勇之士，随印度-希腊战阵长驱直入，开疆拓土！' },
            { speaker: 'player', text: '愿随米南德一世陛下东进萨迦拉，击败弗沙密多罗！' },
        ],
    },

    // #69 杜图伽摩尼 (-161 ~ -137) — 公元前161年阿努拉德普拉之战（本城就地开战）
    sengjialuo_dutugamo: {
        generalId: 'sengjialuo_dutugamo',
        battleName: '阿努拉德普拉之战',
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
        enemyGeneralId: 'bfe3_25',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '异邦占领王都已达四十四载！神圣战象坎杜拉已准备披甲冲锋，勇士，随我驱逐朱罗侵略军，光复圣城！' },
            { speaker: 'player', text: '愿随杜图伽摩尼陛下于阿努拉德就地攻城，击破埃拉拉大军！' },
        ],
    },

    // #70 卫青 (-154 ~ -106) — 公元前127年河南地收复战

    // #71 霍去病 (-140 ~ -117) — 公元前121年河西之战（本城就地开战）

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
        enemyGeneralId: 'bfe3_43',
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
        enemyGeneralId: 'gen_julius_caesar',
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '罗马贪得无厌侵吞小亚细亚，各邦早已苦不堪言！勇士，随我的铁骑与重甲步兵在阿姆尼亚斯河重创罗马军团！' },
            { speaker: 'player', text: '愿随密特里达梯国王就地出击，用镰刀战车粉碎罗马与比提尼亚联军！' },
        ],
    },

    // #74 阿雷塔斯 (-115 ~ -60) — 公元前65年耶路撒冷之战
    nabatai_aleitasi: {
        generalId: 'nabatai_aleitasi',
        battleName: '耶路撒冷之战',
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
        enemyGeneralId: 'gen_aristobulus_ii',
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
        enemyGeneralId: 'bfe3_44',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '破羌将军正于湟水设防，某率酒泉张掖步骑出其不备！壮士，佩刀随某直插罕羌腹地，分进合击荡平罕开诸羌！' },
            { speaker: 'player', text: '愿随辛将军铁骑疾趋允吾，雷霆一击荡平诸羌！' },
        ],
    },

    // #76 庞培 (-106 ~ -48) — 公元前67年奇里乞亚平海盗之战（本城就地开战）

    // #77 恺撒 (-100 ~ -44) — 公元前52年阿莱西亚之战
    gen_julius_caesar: {
        generalId: 'gen_julius_caesar',
        battleName: '阿莱西亚之战',
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
        enemyGeneralId: 'bfe3_46',
        enemyTroops: 50000,
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
        enemyGeneralId: 'bfe_crassus',   // 🔴 [2026-10-25 按史] 前53 卡莱之战罗马统帅＝克拉苏（恺撒在高卢）
        enemyTroops: 15000,
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
        enemyFactionId: 'xiongnu',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '北匈奴',
        enemyGeneralId: 'xijue_ganyanshou',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '明犯强汉者，虽远必诛！郅支单于杀汉使者逃窜康居，壮士，随我假托符节统西域十五国联军，围而歼之！' },
            { speaker: 'player', text: '明犯强汉者，虽远必诛！愿随陈副校尉攻破郅支城，斩郅支单于之首！' },
        ],
    },

    // #80 丘就却 (-20 ~ 80) — 公元45年高附攻灭安息之战

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
        enemyFactionId: 'luoyue',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '徵侧',
        enemyGeneralId: 'luoyue_zhengce',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '男儿当死于边野以马革裹尸！交趾二征悖逆朝廷聚众乱边，壮士，随伏波大军涉重瘴出浪泊，斩将立铜柱！' },
            { speaker: 'player', text: '愿随马伏波将军就地迎击徵侧所部，立铜柱以定南疆！' },
        ],
    },

    // #82 刘秀 (-5 ~ 57) — 公元23年昆阳之战（本城就地开战）
    lulin_liuxiu: {
        generalId: 'lulin_liuxiu',
        battleName: '昆阳之战',
        battleYear: 23,
        battleType: 'siege',
        role: 'defender',
        targetName: '昆阳',
        targetCityId: 'city_kunyang',
        targetLat: 33.22,
        targetLng: 113.22,
        myTroops: 20000,
        enemyFactionId: 'dixiang',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '新朝',
        enemyGeneralId: 'bfe3_56',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '王莽百万伪军围我昆阳孤城，天下存亡在此一役！我亲领十三骑冲围召援，壮士随我冲击莽军中军，阵斩王寻！' },
            { speaker: 'player', text: '愿随刘将军直捣王寻中坚大营，于昆阳城下一战覆灭新莽主力！' },
        ],
    },

    // #83 邓禹 (2 ~ 58) — 公元25年龙门渡河破关中之战（本城就地开战）
    xiayang_d_dengyu: {
        generalId: 'xiayang_d_dengyu',
        battleName: '龙门之战',
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
        enemyGeneralId: 'bfe3_57',
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
        enemyGeneralId: 'bfe3_58',
        enemyTroops: 50000,
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
        enemyGeneralId: 'bfe3_63',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '罗马内乱无道，视我们巴塔维人如奴仆牛马！勇士们，割断屈辱的长发，随我在莱茵河口撕碎罗马军团的鹰旗！' },
            { speaker: 'player', text: '愿随西维利斯首领于莱茵河畔就地奋战，粉碎罗马军团的枷锁！' },
        ],
    },

    // #86 窦固 (25 ~ 88) — 公元73年天山蒲类海之战（战场在巴里坤；窦固据点＝敦煌，>300km → 按 2026-10-25 规则直接去战场接任务）
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
        enemyGeneralId: 'bfe_huyan_wang',   // 🔴 [2026-10-25 按史] 73 蒲类海对手是北匈奴呼衍王（库中「呼衍蒲奴」为混拼）
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '天子命我兵出酒泉重定西域！匈奴呼衍王尚在天山下负隅顽抗，壮士，随我铁骑奔袭蒲类海，一举逐走匈奴！' },
            { speaker: 'player', text: '愿随窦奉车都尉于蒲类海畔就地出击，痛击呼衍王、重开西域门户！' },
        ],
    },

    // #87 班超 (32 ~ 102) — 公元86年损中破疏勒叛王忠（原写91年它乾：敌将忠卒于90，年代不合）
    xiyuduhu_banchao: {
        generalId: 'xiyuduhu_banchao',
        battleName: '疏勒之战',
        battleYear: 86,
        battleType: 'field',
        role: 'defender',
        targetName: '损中',
        targetCityId: 'city_shule',
        targetLat: 39.47,
        targetLng: 75.98,
        myTroops: 25000,
        enemyFactionId: 'shule',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '疏勒',
        enemyGeneralId: 'bfe_shulezhong',   // 🔴 [2026-10-25 按史] 疏勒叛王榆勒（忠）；《后汉书·班超传》元和三年（86）忠借康居兵据损中，超伏兵斩之
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '疏勒王忠叛汉，借康居之兵据守损中，欲断我西域南道！大丈夫无他志略，犹当效傅介子、张骞立功异域——壮士，随某以夷制夷，斩忠以定疏勒！' },
            { speaker: 'player', text: '愿随班都护进击损中，平疏勒之叛、扬汉节于绝域！' },
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
        enemyGeneralId: 'bfe3_64',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '朝廷三路大军出朔方塞三千里，北匈奴穷蹙狼狈！壮士，随大将军出塞追击稽落山，勒石燕然，耀我国威！' },
            { speaker: 'player', text: '愿随窦车骑将军于稽落山就地决战，荡平北匈奴、勒石燕然！' },
        ],
    },

    // #89 迦腻色迦 (78 ~ 144) — 公元127年富楼沙会战（本城就地开战）

    // #90 皇甫规 (104 ~ 174) — 公元161年朔方平羌之战（本城就地开战）

    // #91 皇甫嵩 (135 ~ 195) — 公元188年陈仓破王国之战（本城就地开战）
    jingzhou_gs_huangfusong: {
        generalId: 'jingzhou_gs_huangfusong',
        battleName: '陈仓之战',
        battleYear: 188,
        battleType: 'field',
        role: 'attacker',
        targetName: '安定',
        targetCityId: 'city_anding',
        targetLat: 35.327451,
        targetLng: 107.358398,
        myTroops: 40000,
        enemyFactionId: 'liangzhou',   // 🔴 [2026-10-26 按史] 王国＝汉末凉州之乱叛首，归新势力「凉州」（不再与皇甫嵩同为汉国 → 成名战不再走「同势力→叛军」占位）
        enemyFactionName: '凉州',
        enemyGeneralId: 'bfe3_67',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '王国率凉州十万之众围陈仓八十余日，师老兵疲！壮士，随某出安定奇兵乘锐击之，追奔逐北破敌就在此时！' },
            { speaker: 'player', text: '愿随皇甫左将军击其惰归，就地连破王国所部！' },
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
        targetCityId: 'city_daming',
        targetLat: 36.95,
        targetLng: 115.5,
        myTroops: 25000,
        enemyFactionId: 'you',
        enemyFactionName: '公孙瓒军',
        enemyGeneralId: 'bfe3_68',
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
        enemyFactionId: 'yuan_shao',
        enemyFactionName: '袁绍军',
        enemyGeneralId: 'bfe3_71',
        enemyTroops: 50000,
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
        enemyFactionId: 'han_d',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '董卓军',
        enemyGeneralId: 'bfe3_69',
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
        enemyFactionId: 'wei',
        enemyFactionName: '曹操军',
        enemyGeneralId: 'bozhou_d_yujin',
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
        enemyFactionId: 'wei',
        enemyFactionName: '曹操军',
        enemyGeneralId: 'cao_d_caocao',
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
        enemyFactionId: 'wei',
        enemyFactionName: '曹操军',
        enemyGeneralId: 'bfe_zhanghe',   // 🔴 [2026-10-25 按史] 215 巴西宕渠之战＝张飞破张郃（曹操在汉中/邺）
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '张郃欺我蜀中无人，竟敢引兵掳掠巴西！燕人张翼德在此，精选轻骑万余循山道截其前后，壮士随俺痛饮杀贼！' },
            { speaker: 'player', text: '愿随张车骑将军于阆中宕渠就地出击，杀得张郃弃马攀山而逃！' },
        ],
    },

    // #98 曹仁 (168 ~ 223) — 公元219年樊城之战
    caoren: {
        generalId: 'caoren',
        battleName: '樊城之战',
        battleYear: 219,
        battleType: 'siege',
        role: 'defender',
        targetName: '樊城',
        targetCityId: 'city_xiangyang',
        targetLat: 32.01,
        targetLng: 112.12,
        myTroops: 10000,
        enemyFactionId: 'shu',
        enemyFactionName: '蜀汉',
        enemyGeneralId: 'chu_guanyu',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '关羽水淹七军、乘舟临城！某已沉白马与全军盟誓：死守樊城，半步不退！壮士，随某登城拒敌，教蜀军寸步难移！' },
            { speaker: 'player', text: '愿随大将军死守樊城，任关羽滔天大水，我军自坚如磐石！' },
        ],
    },

    // #99 张辽 (169 ~ 222) — 公元215年合肥逍遥津之战（本城就地开战）
    lu_zhangliao: {
        generalId: 'lu_zhangliao',
        battleName: '合肥之战',
        battleYear: 215,
        battleType: 'siege',
        role: 'defender',
        targetName: '合肥',
        targetCityId: 'city_hefei',
        targetLat: 31.82,
        targetLng: 117.23,
        myTroops: 20000,
        enemyFactionId: 'sunwu_d',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '东吴',
        enemyGeneralId: 'sunwu_d_sunquan',
        enemyTroops: 20000,
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
        battleType: 'siege',
        role: 'defender',
        targetName: '肥如',
        targetCityId: 'city_feiru',
        targetLat: 39.89,
        targetLng: 118.89,
        myTroops: 25000,
        enemyFactionId: 'xianbei',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '鲜卑',
        enemyGeneralId: 'bfe3_74',
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
        enemyFactionId: 'wei',
        enemyFactionName: '曹操军',
        enemyGeneralId: 'cao_d_caocao',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '曹孟德挟汉相之名驱北方兵南侵，投鞭断流何其骄横！黄老将军苦肉火攻之策已成，壮士，随周郎扬帆借东风！' },
            { speaker: 'player', text: '愿随周大都督扬帆出击，火烧赤壁、将曹操大军付之一炬！' },
        ],
    },

    // #102 孙策 (175 ~ 200) — 公元195年神亭岭平江东之战（本城就地开战）
    shanyue_sunce: {
        generalId: 'shanyue_sunce',
        battleName: '曲阿之战',
        battleYear: 195,
        battleType: 'field',
        role: 'attacker',
        targetName: '宛陵',
        targetCityId: 'city_wanling',
        targetLat: 30.9333,
        targetLng: 118.75,
        myTroops: 25000,
        enemyFactionId: 'han_d',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '刘繇军',
        enemyGeneralId: 'bfe3_70',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '借兵千余渡江创基业，刘繇鼠辈据险拦路！小霸王手中长枪所向披靡，壮士，何不入我帐下，与我平定江东！' },
            { speaker: 'player', text: '愿随孙小霸王于江东就地出战，一举击溃刘繇大军、奠定基业！' },
        ],
    },

    // #103 吕蒙 (178 ~ 220) — 公元219年白衣渡江袭荆州（攻城：江陵）
    //   🔴 [2026-10-28 主人令「吕蒙的成名战对手怎么是曹操，这个不对吧？请修复」] 原写 213 年濡须口对曹操——
    //   那是孙权亲当曹操的仗，不是吕蒙本人的名战。改吕蒙最知名一役：219 年白衣渡江取荆州，
    //   对手＝督荆州事的关羽（蜀）。史实：吕蒙称病回建业、陆逊卑辞使关羽尽撤后防北赴樊城，
    //   蒙伏精兵于艨艟、白衣摇橹尽收江边屯候；公安傅士仁、江陵糜芳相继降，关羽回师军散、败走麦城。
    wuwu_d_lvmeng: {
        generalId: 'wuwu_d_lvmeng',
        battleName: '荆州之战',
        battleYear: 219,
        battleType: 'siege',
        role: 'attacker',
        targetName: '江陵',
        targetCityId: 'city_ying',
        targetLat: 30.35,
        targetLng: 112.18,
        myTroops: 30000,
        enemyFactionId: 'shu',
        enemyFactionName: '蜀国',
        enemyGeneralId: 'chu_guanyu',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '陆伯言一纸卑辞，关羽已尽撤荆州守备北赴樊城。我白衣摇橹、精兵尽伏艨艟，江边屯候一个不留——公安已下，江陵便在眼前。壮士，随我顺流入城，断关羽归路！' },
            { speaker: 'player', text: '愿随吕将军白衣渡江，直取江陵，断关羽后路！' },
        ],
    },

    // #104 司马懿 (179 ~ 251) — 公元234年五丈原陇右阻击战
    sima_d_simayi: {
        generalId: 'sima_d_simayi',
        battleName: '上邽之战',
        battleYear: 231,
        battleType: 'field',
        role: 'attacker',
        targetName: '天水',
        targetCityId: 'city_tianshui',
        targetLat: 34.58,
        targetLng: 105.73,
        myTroops: 50000,
        enemyFactionId: 'shu',
        enemyFactionName: '蜀汉',
        enemyGeneralId: 'huizhou_zhugeliang',
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
        enemyGeneralId: 'bfe3_73',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '腐朽的安息王廷已经走到尽头，阿胡拉马兹达注视着我们！勇士，随我率波斯萨珊铁骑席卷平原，开创新纪元！' },
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
        enemyFactionId: 'wei',
        enemyFactionName: '曹魏',
        enemyGeneralId: 'sima_d_simayi',
        enemyTroops: 50000,
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
        enemyTroops: 50000,
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
        battleType: 'siege',
        role: 'defender',
        targetName: '兴势山',
        targetCityId: 'city_yangxian',
        targetLat: 33.352,
        targetLng: 107.582,
        myTroops: 30000,
        enemyFactionId: 'wei',
        enemyFactionName: '曹魏',
        enemyGeneralId: 'bfe3_76',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '曹爽引十万魏军越骆谷来犯，汉中大军未至！平统无当飞军据兴势绝险拒敌，壮士，握紧弓弩随我扼守关隘！' },
            { speaker: 'player', text: '愿随王镇北大将军率无当飞军据险死战，将曹爽大军死死挡在兴势山下！' },
        ],
    },

    // #109 马忠 (188 ~ 249) — 公元233年平定南中刘胄之战（本城就地开战）
    nanzhong_mazhong: {
        generalId: 'nanzhong_mazhong',
        battleName: '蜻蛉之战',
        battleYear: 233,
        battleType: 'field',
        role: 'attacker',
        targetName: '宛温',
        targetCityId: 'city_wanwen',
        targetLat: 25.09,
        targetLng: 104.89,
        myTroops: 25000,
        enemyFactionId: 'shu',   // 🔴 [2026-10-25 按史] 敌将势力对齐
        enemyFactionName: '刘胄',
        enemyGeneralId: 'bfe3_75',
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
        enemyGeneralId: 'bfe3_78',
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
        enemyFactionId: 'wei',
        enemyFactionName: '曹魏',
        enemyGeneralId: 'bfe_wangjing',   // 🔴 [2026-10-25 按史] 255 洮西之战＝姜维破雍州刺史王经（邓艾在洛阳）
        enemyTroops: 50000,
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
        myTroops: 43000,
        enemyFactionId: 'luoma_diguo',
        enemyFactionName: '罗马帝国',
        enemyGeneralId: 'bfe3_77',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '罗马皇帝瓦勒良亲率重军犯我两河，如今疫病已削弱其锋！萨珊的铁骑勇士，随我冲锋擒获罗马皇帝，名震天下！' },
            { speaker: 'player', text: '愿随沙普尔大王西进埃德萨，全歼罗马主力、生擒瓦勒良皇帝！' },
        ],
    },

    // #113 芝诺比娅 (240 ~ 274) — 公元272年伊姆前会战
    paermila_zhinuobiya: {
        generalId: 'paermila_zhinuobiya',
        battleName: '安条克之战',
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
        enemyGeneralId: 'bfe3_79',
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
        battleType: 'siege',
        role: 'defender',
        targetName: '鹿头关',
        targetCityId: 'city_mianzhuguan',
        targetLat: 31.32549,
        targetLng: 104.172363,
        myTroops: 30000,
        enemyFactionId: 'shu',
        enemyFactionName: '西晋',
        enemyGeneralId: 'bfe3_80',
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
        enemyFactionId: 'hou_zhao',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '石赵',
        enemyGeneralId: 'bfe_taobao',   // 🔴 [2026-10-25 按史] 320 蓬陂坞与祖逖相持的是后赵桃豹（石勒在襄国）
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
        targetName: '罗马',
        targetCityId: 'city_luoma',
        targetLat: 41.9,
        targetLng: 12.49,
        myTroops: 40000,
        enemyFactionId: 'luoma_diguo',
        enemyFactionName: '罗马僭主',
        enemyGeneralId: 'bfe3_81',
        enemyTroops: 50000,
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
        enemyFactionId: 'jin',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '西晋',
        enemyGeneralId: 'bfe_wangyan',   // 🔴 [2026-10-25 按史] 311 宁平城行台元帅＝太尉王衍（祖逖不在该军）
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '晋军十余万拥丧自洛阳南逃，王衍清谈误国死期已至！铁骑儿郎与壮士，随某引精骑合围宁平城，尽歼晋室残军！' },
            { speaker: 'player', text: '愿随石将军铁骑合围，于宁平城就地覆灭王衍十万晋军！' },
        ],
    },

    // #118 慕容皝 (297 ~ 348) — 公元342年龙城破石虎之战（本城就地开战）
    yingzhou_ying_d_muronghuang: {
        generalId: 'yingzhou_ying_d_muronghuang',
        battleName: '棘城之战',
        battleYear: 342,
        battleType: 'siege',
        role: 'defender',
        targetName: '朝阳',
        targetCityId: 'city_chaoyang',
        targetLat: 41.57,
        targetLng: 120.45,
        myTroops: 40000,
        enemyFactionId: 'hou_zhao',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '石赵',
        enemyGeneralId: 'shizhao_d_shihu',
        enemyTroops: 50000,
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
        enemyFactionId: 'chenghan',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '成汉',
        enemyGeneralId: 'bfe3_83',
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '男儿不能流芳百世亦当遗臭万年！某引孤军泛舟万里溯流克蜀，鼓吏奋槌进军，壮士随我奋勇杀入成都，灭成汉！' },
            { speaker: 'player', text: '愿随桓大司马溯江入蜀，于成都城下击破李势、收复巴蜀之地！' },
        ],
    },

    // #120 埃扎纳 (320 ~ 360) — 公元350年麦罗埃远征战（本城就地开战）

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
        enemyFactionId: 'hou_zhao',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '石赵',
        enemyGeneralId: 'bfe_zhanghedu',   // 🔴 [2026-10-25 按史] 350 苍亭之战＝张贺度（石琨在邯郸另路）
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '羯胡暴虐荼毒中原，今日某立魏国当为汉家雪恨！石祗倾国来攻，壮士，持双刃矛随我驰骋沙场，成名战必荡尽胡虏！' },
            { speaker: 'player', text: '愿随冉天王于巨鹿就地血战，冲杀石祗所部、保卫中州百姓！' },
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
        myTroops: 30000,
        enemyFactionId: 'murong',
        enemyFactionName: '前燕',
        enemyGeneralId: 'bfe3_87',
        enemyTroops: 50000,
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
        enemyFactionId: 'dongjin',
        enemyFactionName: '司马晋',
        enemyGeneralId: 'danyang_huanwen',
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
        enemyFactionId: 'falanji',
        enemyFactionName: '阿拉曼尼人',
        enemyGeneralId: 'bfe3_86',
        enemyTroops: 15000,
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
        myTroops: 40000,
        enemyFactionId: 'fushi',
        enemyFactionName: '前秦',
        enemyGeneralId: 'bfe3_88',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '苻坚投鞭断流妄图吞并江南，江东安危全系北府儿郎！秦军半渡而退，壮士，随我引精锐踏破淝水，一战定乾坤！' },
            { speaker: 'player', text: '愿随谢康乐率北府精兵于寿春淝水就地出击，令秦军风声鹤唳、草木皆兵！' },
        ],
    },

    // #127 社仑 (360 ~ 410) — 公元402年漠北立汗庭之战（本城就地开战）

    // #128 刘裕 (363 ~ 422) — 公元410年广固灭南燕之战
    wang_d_liuyu: {
        generalId: 'wang_d_liuyu',
        battleName: '广固之战',
        battleYear: 410,
        battleType: 'siege',
        role: 'attacker',
        targetName: '临淄',
        targetCityId: 'city_linzi',
        targetLat: 36.88,
        targetLng: 118.43,
        myTroops: 50000,
        enemyFactionId: 'murong',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '南燕',
        enemyGeneralId: 'bfe3_90',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '慕容超犯边掳掠我淮北百姓，寄奴引义师北伐直捣临朐！南燕主力已溃，壮士，随某推行围攻器械，彻底平定广固！' },
            { speaker: 'player', text: '愿随刘太尉挥师北伐过岘山，攻克广固、生擒慕容超！' },
        ],
    },

    // #129 沮渠蒙逊 (368 ~ 433) — 公元412年姑臧夺河西之战
    juqu_d_juqumengxun: {
        generalId: 'juqu_d_juqumengxun',
        battleName: '穷泉之战',
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
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '秃发傉檀残暴失信，竟敢举兵犯我姑臧！北凉将士同仇敌忾，壮士，速随某布伏兵于西石窟，一战断其归路！' },
            { speaker: 'player', text: '愿随河西王东进张掖，大破秃发傉檀、席卷河西走廊！' },
        ],
    },

    // #130 亚拉里克 (370 ~ 410) — 公元410年罗马围城之战
    gen_alaric: {
        generalId: 'gen_alaric',
        battleName: '罗马之战',
        battleYear: 410,
        battleType: 'siege',
        role: 'attacker',
        targetName: '罗马',
        targetCityId: 'city_luoma',
        targetLat: 41.9,
        targetLng: 12.49,
        myTroops: 40000,
        enemyFactionId: 'luoma_diguo',
        enemyFactionName: '西罗马帝国',
        enemyGeneralId: 'bfe3_91',
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
        enemyFactionId: 'da_yan',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '后燕',
        enemyGeneralId: 'bfe_murongbao',   // 🔴 [2026-10-25 按史] 395 参合陂燕军主帅＝太子慕容宝（慕容垂在中山患病）
        enemyTroops: 50000,
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
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '秃发傉檀自恃众盛轻我大夏！孤示弱诱其深入阳武峡谷，胡夏勇士，随孤设伏断敌前后，叫凉军片甲不留！' },
            { speaker: 'player', text: '愿随大夏天王于统万城外就地合围，大破秃发傉檀南凉主力！' },
        ],
    },

    // #133 乞伏炽磐 (386 ~ 428) — 公元414年乐都灭南凉之战
    qifu_d_qifuchipan: {
        generalId: 'qifu_d_qifuchipan',
        battleName: '乐都之战',
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
        enemyGeneralId: 'tufa_d_tufanutan',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '秃发傉檀远袭白石，乐都孤城守备空虚！西秦铁骑进发如风，壮士，随某跨陇山急攻乐都城，一战灭亡南凉！' },
            { speaker: 'player', text: '愿随西秦王自枹罕疾驰北上，奇袭攻克乐都、一战灭亡南凉！' },
        ],
    },

    // #134 阿提拉 (406 ~ 453) — 公元451年帝国会战（本城就地开战）
    xiongren_atila: {
        generalId: 'xiongren_atila',
        battleName: '乌图斯河之战',
        battleYear: 447,
        battleType: 'field',
        role: 'attacker',
        targetName: '塞格德',
        targetCityId: 'city_saigede',
        targetLat: 46.25,
        targetLng: 20.15,
        myTroops: 50000,
        enemyFactionId: 'baizanting',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '东罗马帝国',
        enemyGeneralId: 'bfe3_92',
        enemyTroops: 43000,
        introLines: [
            { speaker: 'general', text: '上帝之鞭已悬在罗马人头顶！东罗马军团妄图在乌图斯河阻我铁骑，勇士们，拉满弯弓随我冲锋，收割敌军头颅！' },
            { speaker: 'player', text: '愿随阿提拉大单于策马冲锋，于塞格德多瑙河畔就地粉碎罗马军团！' },
        ],
    },

    // #135 阿赫雄 (430 ~ 484) — 公元484年赫拉特大破波斯之战（本城就地开战）
    yada_ahexiong: {
        generalId: 'yada_ahexiong',
        battleName: '赫拉特之战',
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
        enemyGeneralId: 'sashan_beilusi',   // 🔴 [2026-10-20 成名战规则] 萨珊王卑路斯一世（484 此役战死）
        enemyTroops: 50000,
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
        battleType: 'siege',
        role: 'defender',
        targetName: '钟离',
        targetCityId: 'city_bengbu',
        targetLat: 32.92,
        targetLng: 117.38,
        myTroops: 50000,
        enemyFactionId: 'tuoba',
        enemyFactionName: '北魏',
        enemyGeneralId: 'tuoba_yuanying',   // 🔴 [2026-10-20 成名战规则] 钟离之战北魏主帅元英
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '元英百万之众扎连桥围钟离孤城，淮水春汛已至！某虽羸弱乘柴车，壮士，持长矛火炬随我乘舰纵火，焚断敌桥！' },
            { speaker: 'player', text: '愿随韦豫州于钟离就地火烧邵阳洲浮桥，大破元英与杨大眼北魏主力！' },
        ],
    },

    // #137 狄奥多里克 (454 ~ 526) — 公元493年拉文纳之战（本城就地开战）
    gen_theodoric_great: {
        generalId: 'gen_theodoric_great',
        battleName: '拉文纳之战',
        battleYear: 493,
        battleType: 'siege',
        role: 'attacker',
        targetName: '拉文纳',
        targetCityId: 'city_ravenna',
        targetLat: 44.41,
        targetLng: 12.2,
        myTroops: 40000,
        enemyFactionId: 'falanji',
        enemyFactionName: '奥多亚克王国',
        enemyGeneralId: 'rierman_odoacer',   // 🔴 [2026-10-20 成名战规则] 493 拉文纳守方即奥多亚克本人
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '蛮王奥多亚克困守沼泽拉文纳三年，粮尽援绝！东哥特的勇士们，随我合围沼泽港口，彻底定鼎全意大利！' },
            { speaker: 'player', text: '愿随狄奥多里克大王于拉文纳就地攻城，击败奥多亚克、建立东哥特王国！' },
        ],
    },

    // #138 头罗曼 (455 ~ 515) — 公元498年犍陀罗南征之战

    // #139 萧衍 (464 ~ 549) — 公元501年建康起义灭东昏侯之战
    xiao_d_xiaoyan: {
        generalId: 'xiao_d_xiaoyan',
        battleName: '建康之战',
        battleYear: 501,
        battleType: 'siege',
        role: 'attacker',
        targetName: '金陵',
        targetCityId: 'city_nanjing',
        targetLat: 32.05,
        targetLng: 118.77,
        myTroops: 50000,
        enemyFactionId: 'nanqi',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '南齐朝廷军',
        enemyGeneralId: 'nanqi_xiaobaojuan',   // 🔴 [2026-10-20 成名战规则] 建康守方是东昏侯萧宝卷
        enemyTroops: 50000,
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
        targetName: '苏瓦松',   // 🔴 [2026-10-20 成名战规则] 城库无苏瓦松，锚定同地区最近的兰斯（约 60 公里）；坐标用苏瓦松史实地点
        targetCityId: 'city_lansi',
        targetLat: 49.38,
        targetLng: 3.32,
        myTroops: 30000,
        enemyFactionId: 'luoma_diguo',
        enemyFactionName: '罗马苏瓦松残余',
        enemyGeneralId: 'luoma_xiageliwusi',   // 🔴 [2026-10-20 成名战规则] 罗马苏瓦松残部首领西阿格里乌斯
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '罗马的高卢总督已是强弩之末！法兰克的战士们，握紧手中的投掷战斧，随我踏碎苏瓦松防线，夺下整片高卢！' },
            { speaker: 'player', text: '愿随克洛维国王于高卢就地决战，击败西阿格里乌斯、奠定法兰克王国霸业！' },
        ],
    },

    // #141 陈庆之 (484 ~ 539) — 公元529年荥阳之战
    zhengzhou_chenqingzhi: {
        generalId: 'zhengzhou_chenqingzhi',
        battleName: '荥阳之战',
        battleYear: 529,
        battleType: 'siege',
        role: 'attacker',
        targetName: '荥阳',
        targetCityId: 'city_hulaoguan',
        targetLat: 34.81,
        targetLng: 113.17,
        myTroops: 10000,
        enemyFactionId: 'tuoba',
        enemyFactionName: '北魏',
        enemyGeneralId: 'bfe_yangyu',   // 🔴 [2026-10-25 按史] 529 守荥阳＝东南道大都督杨昱（尔朱荣在晋阳/洛阳一线）
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '白袍军孤军深入转战千里，杨昱坚守荥阳负隅顽抗，元天穆大军在后。壮士，随某擂鼓攻城，一战定中原！' },
            { speaker: 'player', text: '愿随陈庆之将军共赴荥阳之战，大破北魏敌军！' },
        ],
    },

    // #142 阿史那土门 (490 ~ 552) — 公元552年怀荒之战
    tujue_ashinatumen: {
        generalId: 'tujue_ashinatumen',
        battleName: '怀荒之战',
        battleYear: 552,
        battleType: 'field',
        role: 'attacker',
        targetName: '怀荒镇北',
        targetCityId: 'city_xinghe',
        targetLat: 41.15,
        targetLng: 114.7,
        myTroops: 50000,
        enemyFactionId: 'rouran',
        enemyFactionName: '柔然',
        enemyGeneralId: 'rouran_anagui',   // 🔴 [2026-10-20 成名战规则] 柔然末代可汗阿那瓌（552 被突厥击败）
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '柔然蛮主辱我锻奴，今日便是大漠易主之时！草原的勇士，拔出弯刀跨上骏马，随伊利可汗踏碎柔然王庭！' },
            { speaker: 'player', text: '愿随阿史那土门将军共赴怀荒之战，大破柔然敌军！' },
        ],
    },

    // #143 尔朱荣 (493 ~ 530) — 公元528年滏口之战
    erzhu_erzhurong: {
        generalId: 'erzhu_erzhurong',
        battleName: '滏口之战',
        battleYear: 528,
        battleType: 'field',
        role: 'attacker',
        targetName: '滏口陉',
        targetCityId: 'city_handan',
        targetLat: 36.61,
        targetLng: 114.49,
        myTroops: 15000,
        enemyFactionId: 'liuzhen',
        enemyFactionName: '葛荣',
        enemyGeneralId: 'zhao_gerong',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '葛荣贼众虽号百万，然乌合之众各怀异心！某以精骑分道潜伏，人备生绢，壮士，随老夫突阵生擒贼首！' },
            { speaker: 'player', text: '愿随尔朱荣将军共赴滏口之战，大破葛荣军！' },
        ],
    },

    // #144 高欢 (496 ~ 547) — 公元532年韩陵山之战
    gaoqi_d_gaohuan: {
        generalId: 'gaoqi_d_gaohuan',
        battleName: '韩陵山之战',
        battleYear: 532,
        battleType: 'field',
        role: 'defender',
        targetName: '安阳韩陵山',
        targetCityId: 'city_anyang',
        targetLat: 36.1,
        targetLng: 114.39,
        myTroops: 30000,
        enemyFactionId: 'erzhu',
        enemyFactionName: '尔朱氏',
        enemyGeneralId: 'erzhu_erzhuzhao',   // 🔴 [2026-10-20 成名战规则] 韩陵山尔朱军主帅是尔朱兆（原势力误填商国）
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '尔朱残暴祸乱中原，今日驱四方胡骑围我韩陵！牛车结阵退无可退，河北男儿与壮士，随高某并力死战！' },
            { speaker: 'player', text: '愿随高欢将军共守韩陵山之战，大破尔朱军阀敌军！' },
        ],
    },

    // #145 陈霸先 (503 ~ 559) — 公元556年白下之战
    chen_chenbaxian: {
        generalId: 'chen_chenbaxian',
        battleName: '白下之战',
        battleYear: 556,
        battleType: 'siege',
        role: 'defender',
        targetName: '建康白下城',
        targetCityId: 'city_nanjing',
        targetLat: 32.05,
        targetLng: 118.77,
        myTroops: 30000,
        enemyFactionId: 'gaoqi_d',
        enemyFactionName: '北齐联军',
        enemyGeneralId: 'gaoqi_d_xiaogui',   // 🔴 [2026-10-20 成名战规则] 白下之战北齐主帅是萧轨（原势力误填南国）
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '北齐强虏渡江扎连营，企图灭我江南社稷！江东风雨大作敌疲粮尽，壮士，握紧长戈随某乘夜截杀敌寨！' },
            { speaker: 'player', text: '愿随陈霸先将军共守白下之战，大破北齐联军敌军！' },
        ],
    },

    // #146 宇文泰 (505 ~ 556) — 公元537年沙苑之战
    yuwen_yuwentai: {
        generalId: 'yuwen_yuwentai',
        battleName: '沙苑之战',
        battleYear: 537,
        battleType: 'field',
        role: 'defender',
        targetName: '华阴沙苑',
        targetCityId: 'city_tongguan',
        targetLat: 34.54,
        targetLng: 110.29,
        myTroops: 15000,
        enemyFactionId: 'gaoqi_d',
        enemyFactionName: '东魏',
        enemyGeneralId: 'gaoqi_d_gaohuan',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '高欢倾国二十万犯关中，关陇存亡系于此战！渭水芦苇荡已伏奇兵，壮士，随某听鼓声并起，长槊破敌！' },
            { speaker: 'player', text: '愿随宇文泰将军共守沙苑之战，大破东魏敌军！' },
        ],
    },

    // #147 韦孝宽 (509 ~ 580) — 公元546年玉壁之战
    long2_weixiaokuan: {
        generalId: 'long2_weixiaokuan',
        battleName: '玉壁之战',
        battleYear: 546,
        battleType: 'siege',
        role: 'defender',
        targetName: '绛州玉壁城',
        targetCityId: 'city_xiayangdu',
        targetLat: 35.602,
        targetLng: 110.452,
        myTroops: 15000,
        enemyFactionId: 'gaoqi_d',
        enemyFactionName: '东魏',
        enemyGeneralId: 'gaoqi_d_gaohuan',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '高欢倾十万大军围我孤城，地道飞楼极尽其巧，尽被老夫所破！玉壁坚城在此，壮士，随我誓死扼守关隘！' },
            { speaker: 'player', text: '愿随韦孝宽将军共守玉壁之战，大破东魏敌军！' },
        ],
    },

    // #148 冼英 (512 ~ 602) — 公元551年大皋口之战
    xian_d_xianfuren: {
        generalId: 'xian_d_xianfuren',
        battleName: '大皋口之战',
        battleYear: 551,
        battleType: 'siege',
        role: 'attacker',
        targetName: '赣石',
        targetCityId: 'city_qianzhou',
        targetLat: 25.8509,
        targetLng: 114.93,
        myTroops: 20000,
        enemyFactionId: 'nan_liang',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '侯景',
        enemyGeneralId: 'dayu_liqianshi',   // 🔴 [2026-10-20 成名战规则] 551 守方主将是李迁仕
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '李迁仕依附侯景扰乱岭表，老身已布诈降伏兵之计！百越勇士，持刀枪随我潜袭敌营，一举荡平李迁仕！' },
            { speaker: 'player', text: '愿随冼英将军共赴大皋口之战，大破侯景军！' },
        ],
    },

    // #149 斛律光 (515 ~ 572) — 公元570年轵关之战（本城就地开战）
    jiyuan_huluguang: {
        generalId: 'jiyuan_huluguang',
        battleName: '轵关之战',
        battleYear: 570,
        battleType: 'siege',
        role: 'defender',
        targetName: '轵关',
        targetCityId: 'city_zhiguan',
        targetLat: 35.15,
        targetLng: 112.3,
        myTroops: 30000,
        enemyFactionId: 'yuwen',
        enemyFactionName: '北周',
        enemyGeneralId: 'yuwen_yuwenxian',   // 🔴 [2026-10-20 成名战规则] 570 轵关之战北周主帅是宇文宪
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '周虏屡犯我轵关要隘，某奉命修筑要塞截断其道！落雕都督神弓在此，壮士，挽弓随某阻敌关下，教敌丧胆！' },
            { speaker: 'player', text: '愿随斛律光将军共守轵关之战，大破北周敌军！' },
        ],
    },

    // #150 阿尔博因 (530 ~ 572) — 公元572年帕维亚之战

    // #151 杨素 (544 ~ 606) — 公元589年狼山江战役
    hongnong_jun_yangsu: {
        generalId: 'hongnong_jun_yangsu',
        battleName: '狼山江战役',
        battleYear: 589,
        battleType: 'field',
        role: 'attacker',
        targetName: '宜昌三峡',
        targetCityId: 'city_yiling',
        targetLat: 30.7,
        targetLng: 111.28,
        myTroops: 40000,
        enemyFactionId: 'chen',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '南陈',
        enemyGeneralId: 'yidou_qixin',   // 🔴 [2026-10-20 成名战规则] 589 狼尾滩陈军守将戚昕
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '大隋天兵顺流东下荡平江南！黄龙巨舰旌旗蔽日，陈将戚昕据江顽抗，壮士，登舟随老夫冲破长江天堑！' },
            { speaker: 'player', text: '愿随杨素将军共赴狼山江战役，大破南陈敌军！' },
        ],
    },

    // #152 来护儿 (545 ~ 618) — 公元590年会稽之战（本城就地开战）
    pinghai_laihuer: {
        generalId: 'pinghai_laihuer',
        battleName: '会稽之战',
        battleYear: 590,
        battleType: 'field',
        role: 'attacker',
        targetName: '杭州湾漂渝津',
        targetCityId: 'city_piaoyujin',
        targetLat: 39.02,
        targetLng: 117.6,
        myTroops: 25000,
        enemyFactionId: 'sui',   // 🔴 [2026-10-25 按史] 敌将势力对齐
        enemyFactionName: '高智慧',
        enemyGeneralId: 'bfe_gao_zhihui',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '高智慧据水阻险聚众，老夫提水军浮海而至漂渝津！壮士，拔刀随老将涉险登岸，奇袭斩杀高智慧！' },
            { speaker: 'player', text: '愿随来护儿将军共赴会稽之战，大破高智慧军！' },
        ],
    },

    // #153 维斯塔姆 (550 ~ 596) — 公元596年吉兰之战（本城就地开战）
    shahelude_weisitamu: {
        generalId: 'shahelude_weisitamu',
        battleName: '吉兰之战',
        battleYear: 596,
        battleType: 'field',
        role: 'defender',
        targetName: '比斯塔姆',
        targetCityId: 'city_bistam',
        targetLat: 36.48,
        targetLng: 55,
        myTroops: 30000,
        enemyFactionId: 'sashan',
        enemyFactionName: '萨珊波斯',
        enemyGeneralId: 'sashan_khosrow_ii',   // 🔴 [2026-10-20 成名战规则] 596 吉兰会战对手是霍斯劳二世（维斯塔姆之乱）
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '库思老小儿忘恩负义倒行逆施，自封万王之王！厄尔布尔士群山是我们的要塞，波斯勇士，随我迎击伪王！' },
            { speaker: 'player', text: '愿随维斯塔姆将军共守吉兰之战，大破萨珊波斯敌军！' },
        ],
    },

    // #154 乙支文德 (560 ~ 620) — 公元612年萨水之战
    gaogouli_yizhiwende: {
        generalId: 'gaogouli_yizhiwende',
        battleName: '萨水之战',
        battleYear: 612,
        battleType: 'field',
        role: 'defender',
        targetName: '萨水河畔',
        targetCityId: 'city_xicheng',
        targetLat: 39.62,
        targetLng: 125.66,
        myTroops: 50000,
        enemyFactionId: 'sui',
        enemyFactionName: '隋朝',
        enemyGeneralId: 'sui_yuwenshu',   // 🔴 [2026-10-20 成名战规则] 612 萨水隋军主帅宇文述（原势力误填乐浪）
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '隋军数十万深入粮尽已是强弩之末！神策究天文妙算穷地理，萨水决堤就在今朝，勇士，随我半渡而击！' },
            { speaker: 'player', text: '愿随乙支文德将军共守萨水之战，大破隋朝敌军！' },
        ],
    },

    // #155 李靖 (571 ~ 649) — 公元630年阴山之战（本城就地开战）
    dingxiang_d_lijing: {
        generalId: 'dingxiang_d_lijing',
        battleName: '阴山之战',
        battleYear: 630,
        battleType: 'field',
        role: 'attacker',
        targetName: '恶阳岭',
        targetCityId: 'city_eyangling',
        targetLat: 39.91,
        targetLng: 111.65,
        // 🔴 [2026-10-20 兵力规则] 李靖夜袭本为三千精骑，按「守方≤攻方×2」取 2 万，颉利牙帐 4 万＝2 倍
        myTroops: 20000,
        enemyFactionId: 'tujue',
        enemyFactionName: '东突厥',
        enemyGeneralId: 'tujue_xielikehan',   // 🔴 [2026-10-20 成名战规则] 630 阴山夜袭对手是颉利可汗
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '颉利退守铁山心存侥幸！大雾弥漫良机稍纵即逝，某率三千精骑夜衔枚疾进，壮士，随药师直捣虏廷活捉可汗！' },
            { speaker: 'player', text: '愿随李靖将军共赴阴山之战，大破东突厥敌军！' },
        ],
    },

    // #156 侯君集 (590 ~ 643) — 公元640年高昌之战
    song2_houjunji: {
        generalId: 'song2_houjunji',
        battleName: '高昌之战',
        battleYear: 640,
        battleType: 'siege',
        role: 'attacker',
        targetName: '吐鲁番高昌城',
        targetCityId: 'city_gaochangcheng',
        targetLat: 42.8533,
        targetLng: 89.53,
        myTroops: 40000,
        enemyFactionId: 'gaochang',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '高昌国',
        enemyGeneralId: 'bfe_quzhisheng',   // 🔴 [2026-10-25 按史] 640 唐军围高昌城时守方＝麴智盛（麴文泰已病死）
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '麴氏阻遏西域商路藐视天威！大军涉流沙数千里飞越葱岭，抛石机巢车已立，壮士，随某破城扬大唐威烈！' },
            { speaker: 'player', text: '愿随侯君集将军共赴高昌之战，大破高昌国敌军！' },
        ],
    },

    // #157 夷男 (590 ~ 645) — 公元628年铁山之战
    xueyantuo_yinan: {
        generalId: 'xueyantuo_yinan',
        battleName: '铁山之战',
        battleYear: 628,
        battleType: 'field',
        role: 'attacker',
        targetName: '燕然山北',
        targetCityId: 'city_yanran',
        targetLat: 46.276728,
        targetLng: 102.801819,
        myTroops: 43000,
        enemyFactionId: 'tujue',
        enemyFactionName: '东突厥',
        enemyGeneralId: 'tujue_xielikehan',   // 🔴 [2026-10-20 成名战规则] 628 东突厥可汗即颉利（原势力误填仆骨）
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '颉利暴虐大漠离心，薛延陀铁勒诸部今日翻身为主！控弦引箭的铁勒好男儿，随真珠可汗踏碎金顶大帐！' },
            { speaker: 'player', text: '愿随夷男将军共赴铁山之战，大破东突厥敌军！' },
        ],
    },

    // #158 哈尔沙 (590 ~ 647) — 公元618年曲女城之战
    jieri_jieriwang: {
        generalId: 'jieri_jieriwang',
        battleName: '曲女城之战',
        battleYear: 618,
        battleType: 'field',
        role: 'attacker',
        targetName: '曲女城郊',
        targetCityId: 'city_qunvcheng',
        targetLat: 27.05,
        targetLng: 79.92,
        myTroops: 50000,
        enemyFactionId: 'boluo',
        enemyFactionName: '高达王国',
        enemyGeneralId: 'gen_shashanka',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '凶残的设赏迦害我兄长辱我姊妹！恒河圣水见证正道，勇猛的象兵军团已披坚执锐，勇士，随朕诛灭国贼！' },
            { speaker: 'player', text: '愿随哈尔沙将军共赴曲女城之战，大破高达王国敌军！' },
        ],
    },

    // #159 苏定方 (592 ~ 667) — 公元657年拽咥河之战
    weihaiwei_sudingfang: {
        generalId: 'weihaiwei_sudingfang',
        battleName: '拽咥河之战',
        battleYear: 657,
        battleType: 'field',
        role: 'attacker',
        targetName: '准噶尔三齐针',
        targetCityId: 'city_tingzhou',
        targetLat: 26.26,
        targetLng: 116.65,
        myTroops: 15000,
        enemyFactionId: 'duolu',
        enemyFactionName: '西突厥',
        enemyGeneralId: 'duolu_ashinahelu',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '贺鲁引十万骑据山下企图困我，其众虽多皆乌合！老夫步军据高地结圆阵，壮士，挽弓随某乘锐突击斩将！' },
            { speaker: 'player', text: '愿随苏定方将军共赴拽咥河之战，大破西突厥敌军！' },
        ],
    },

    // #160 哈立德 (592 ~ 642) — 公元636年雅穆克战役
    maidina_halide: {
        generalId: 'maidina_halide',
        battleName: '雅穆克战役',
        battleYear: 636,
        battleType: 'field',
        role: 'attacker',
        targetName: '雅穆克河谷',
        targetCityId: 'city_damasikusi',
        targetLat: 33.5131,
        targetLng: 36.3094,
        myTroops: 30000,
        enemyFactionId: 'baizanting',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '拜占庭帝国',
        enemyGeneralId: 'bfe_vahan',   // 🔴 [2026-10-25 按史] 636 雅穆克拜占庭主帅＝瓦汉（穆阿维叶是阿拉伯一方）
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '拜占庭军团重铠罗列兵力数倍于我，然狂风与风沙正助真主之剑！勇士，提利刃随安拉之剑撕裂拜占庭方阵！' },
            { speaker: 'player', text: '愿随哈立德将军共赴雅穆克战役，大破拜占庭帝国敌军！' },
        ],
    },

    // #161 李勣 (594 ~ 669) — 公元645年辽东城攻坚战

    // #162 金庾信 (595 ~ 673) — 公元660年黄山伐之战
    xinluo_jinyuxin: {
        generalId: 'xinluo_jinyuxin',
        battleName: '黄山伐之战',
        battleYear: 660,
        battleType: 'field',
        role: 'attacker',
        targetName: '忠清南道论山',
        targetCityId: 'city_sabi',
        targetLat: 36.255354,
        targetLng: 126.949768,
        myTroops: 20000,
        enemyFactionId: 'baiji',
        enemyFactionName: '百济',
        enemyGeneralId: 'baiji_jiebo',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '阶伯引五千死士誓死抗拒，花郎道儿郎前仆后继！唐罗联军灭百济在即，勇士，随老夫全线压上踏平黄山伐！' },
            { speaker: 'player', text: '愿随金庾信将军共赴黄山伐之战，大破百济敌军！' },
        ],
    },

    // #163 李世民 (598 ~ 649) — 公元621年虎牢关之战
    tang_lishimin: {
        generalId: 'tang_lishimin',
        battleName: '虎牢关之战',
        battleYear: 621,
        battleType: 'siege',
        role: 'defender',
        targetName: '虎牢关',
        targetCityId: 'city_hulaoguan',
        targetLat: 34.81,
        targetLng: 113.17,
        myTroops: 20000,
        // 🔴 [2026-10-20 主人令「窦建德的夏，历史是怎么称呼的，就改为什么」] 窦建德 618 年称夏王、国号「夏」（《旧唐书》《新唐书》正史称呼；「大夏」为后世别称），故显示名用「夏」
        enemyFactionId: 'douxia',   // 🔴 [2026-10-25 按史] 敌将势力对齐
        enemyFactionName: '夏',
        enemyGeneralId: 'bfe_dou_jiande',   // 🔴 [2026-10-20 主人令] 621 虎牢关敌将＝夏王窦建德（该事件两边实名）
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '窦建德倾巢来救王世充，骄兵易破！某引玄甲黑骑扼守虎牢，待其阵动一战擒双王！壮士，执槊随秦王破阵！' },
            { speaker: 'player', text: '愿随李世民将军共守虎牢关之战，大破夏军！' },
        ],
    },

    // #164 穆阿维叶 (602 ~ 680) — 公元657年隋欣战役
    womaya_muaweiye: {
        generalId: 'womaya_muaweiye',
        battleName: '隋欣战役',
        battleYear: 657,
        battleType: 'field',
        role: 'defender',
        targetName: '幼发拉底河隋欣',
        targetCityId: 'city_tapusakusi',
        targetLat: 35.91,
        targetLng: 38.53,
        myTroops: 43000,
        enemyFactionId: 'maidina',
        enemyFactionName: '正统哈里发',
        enemyGeneralId: 'maidina_ali',   // 🔴 [2026-10-20 成名战规则] 657 隋芬之战穆阿维叶的对手是哈里发阿里（原势力误填叙利亚＝己方）
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '叙利亚将士百战精锐，幼发拉底河畔旗帜招展！为大义与公理而战，勇士，随我列阵枪矛相抗，誓不退缩！' },
            { speaker: 'player', text: '愿随穆阿维叶将军共守隋欣战役，大破正统哈里发敌军！' },
        ],
    },

    // #165 王玄策 (612 ~ 672) — 公元648年茶镈和罗城之战
    jiashi_wangxuance: {
        generalId: 'jiashi_wangxuance',
        battleName: '茶镈和罗城之战',
        battleYear: 648,
        battleType: 'siege',
        role: 'attacker',
        targetName: '茶镈和罗城',
        targetCityId: 'city_huashicheng',
        targetLat: 25.61,
        targetLng: 85.13,
        // 🔴 [2026-10-20 兵力规则] 王玄策借吐蕃泥婆罗兵约九千余，按「守方≤攻方×2」取 1.5 万，中天竺 3 万＝2 倍
        myTroops: 15000,
        enemyFactionId: 'kongque',
        enemyFactionName: '中天竺',
        enemyGeneralId: 'kongque_aluonashun',   // 🔴 [2026-10-20 成名战规则] 648 中天竺王是阿罗那顺
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '阿罗那顺背信篡位掠我使团！某借吐蕃泥婆罗万骑兵临城下，壮士，持刀斧随某斩关夺城生擒阿罗那顺！' },
            { speaker: 'player', text: '愿随王玄策将军共赴茶镈和罗城之战，大破中天竺敌军！' },
        ],
    },

    // #166 薛仁贵 (614 ~ 683) — 公元662年天山三箭定天山之战

    // #167 松赞干布 (617 ~ 650) — 公元638年松州之战
    // 🔴 [2026-10-25 主人令「成名战＝最知名的战争，游戏里套用的第一站，不是一生第一仗」] 松州之战＝唐蕃第一次战役、松赞干布最知名之战；629 年平叛不算成名战。
    // 🔴 [2026-10-25 按史修正] 敌将原填李世民（未离长安、不在场）→ 唐当弥道行军大总管侯君集；阔水道先锋牛进达九月夜袭松州城下吐蕃营、斩千余级，松赞干布引兵退、遣使谢罪复请婚（《旧唐书·吐蕃传》《资治通鉴》卷一九五）。兵力：史载吐蕃二十余万（含夸大，按规则缩放为八万）、唐步骑五万照史。
    tubo_songzanganbu: {
        generalId: 'tubo_songzanganbu',
        battleName: '松州之战',
        battleYear: 638,
        battleType: 'siege',
        role: 'attacker',
        targetName: '松州嘉诚',
        targetCityId: 'city_songzhou',
        targetLat: 32.787239,
        targetLng: 103.625793,
        myTroops: 50000,
        enemyFactionId: 'tang',
        enemyFactionName: '唐朝',
        enemyGeneralId: 'song2_houjunji',   // 🔴 [2026-10-25 按史] 638 松州，唐当弥道行军大总管侯君集（牛进达为阔水道先锋，夜袭破营）
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '唐主不肯许婚，使者又言吐谷浑从中离间！赞普已统高原勇士南下松州，以兵逼婚——雪域的勇士，敲响铜鼓挺起长矛，随孤围城耀威！' },
            { speaker: 'player', text: '愿随赞普兵临松州，逼唐许婚！' },
        ],
    },

    // #168 裴行俭 (619 ~ 682) — 公元680年平定西突厥阿史那匐念之战
    juandu_peixingjian: {
        generalId: 'juandu_peixingjian',
        battleName: '碎叶城之战',
        battleYear: 680,
        battleType: 'field',
        role: 'attacker',
        targetName: '碎叶川',
        targetCityId: 'city_suiye',
        targetLat: 42.8,
        targetLng: 75.2667,
        myTroops: 40000,
        enemyFactionId: 'xijue',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '西突厥',
        enemyGeneralId: 'bfe_ashina_duzhi',   // 🔴 [2026-10-25 按史] 679–680 裴行俭碎叶擒的是西突厥十姓可汗阿史那都支
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '兵者诡道也，老夫施反间断其羽翼，虚造伪装直逼其营！壮士，佩刀随某长驱直入碎叶川，不战而屈人之兵！' },
            { speaker: 'player', text: '愿随裴行俭将军共赴平定西突厥阿史那匐念之战，大破西突厥敌军！' },
        ],
    },

    // #169 奥克巴 (622 ~ 683) — 公元682年韦斯卡拉之战
    gen_uqba: {
        generalId: 'gen_uqba',
        battleName: '韦斯卡拉之战',
        battleYear: 682,
        battleType: 'field',
        role: 'attacker',
        targetName: '凯鲁万北草原',
        targetCityId: 'city_kailuwan',
        targetLat: 35.67,
        targetLng: 10.1,
        myTroops: 25000,
        enemyFactionId: 'mulabite',
        enemyFactionName: '柏柏尔联军',
        enemyGeneralId: 'gen_kusaila',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '大军纵横北非直至大洋波涛！拜占庭与柏柏尔溃兵再聚草莽，勇士，挥舞弯刀随我冲锋，让号角响彻马格里布！' },
            { speaker: 'player', text: '愿随奥克巴将军共赴韦斯卡拉之战，大破柏柏尔联军敌军！' },
        ],
    },

    // #170 黑齿常之 (630 ~ 689) — 公元678年烽子山之战
    heyuan_d_heichichangzhi: {
        generalId: 'heyuan_d_heichichangzhi',
        battleName: '烽子山之战',
        battleYear: 678,
        battleType: 'field',
        role: 'attacker',
        targetName: '青海湖烽子山',
        targetCityId: 'city_dafeichuan',
        targetLat: 36.1379,
        targetLng: 100.7611,
        myTroops: 10000,
        enemyFactionId: 'tubo',
        enemyFactionName: '吐蕃',
        enemyGeneralId: 'gar_lunqinling',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '诸军溃退唐旗有蒙尘之险！某已募死士五百乘夜衔枚潜袭烽子山，壮士，拔刀随我拔寨斩将，力挽狂澜！' },
            { speaker: 'player', text: '愿随黑齿常之将军共赴烽子山之战，大破吐蕃敌军！' },
        ],
    },

    // #171 达本陀 (630 ~ 689) — 公元686年征讨爪哇之战

    // #172 论钦陵 (635 ~ 699) — 公元670年大非川之战
    gar_lunqinling: {
        generalId: 'gar_lunqinling',
        battleName: '大非川之战',
        battleYear: 670,
        battleType: 'field',
        role: 'defender',
        targetName: '青海大非川',
        targetCityId: 'city_dafeichuan',
        targetLat: 36.1379,
        targetLng: 100.7611,
        myTroops: 50000,
        enemyFactionId: 'tang',
        enemyFactionName: '唐朝',
        enemyGeneralId: 'loufan_xuerengui',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '唐将仁贵引大军十万远征吐谷浑，其辎重留后互不策应！赞普铁骑已据险遮截，勇士，随我全歼唐军于大非川！' },
            { speaker: 'player', text: '愿随论钦陵将军共守大非川之战，大破唐朝敌军！' },
        ],
    },

    // #173 大祚荣 (645 ~ 719) — 公元698年天门岭之战
    bohai_dazuorong: {
        generalId: 'bohai_dazuorong',
        battleName: '天门岭之战',
        battleYear: 698,
        battleType: 'field',
        role: 'defender',
        targetName: '辽东天门岭',
        targetCityId: 'city_shenyang',
        targetLat: 41.80203,
        targetLng: 123.43689,
        myTroops: 20000,
        enemyFactionId: 'wuzhou_d',
        enemyFactionName: '武周',
        enemyGeneralId: 'bfe_likaigu',   // 🔴 [2026-10-25 按史] 698 天门岭追击大祚荣＝武周李楷固（武则天在洛阳）
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '武周契丹追兵紧追不舍，靺鞨遗民退无可退！借天门岭隘道设伏，勇士，随我擂鼓下石，立震国之基业！' },
            { speaker: 'player', text: '愿随大祚荣将军共守天门岭之战，大破武周敌军！' },
        ],
    },

    // #174 骨咄禄 (650 ~ 692) — 公元682年云州之战（按史：《旧唐书·薛仁贵传》《新唐书·突厥传》永淳元年骨咄禄起兵寇并州、云州，唐代州都督薛仁贵率军北击之于云州）
    pugu_ashinaguduolu: {
        generalId: 'pugu_ashinaguduolu',
        battleName: '云州之战',
        battleYear: 682,
        battleType: 'field',
        role: 'attacker',
        targetName: '云州',
        targetCityId: 'city_datong',
        targetLat: 40.09,
        targetLng: 113.30,
        myTroops: 20000,
        enemyFactionId: 'tang',
        enemyFactionName: '唐',
        enemyGeneralId: 'loufan_xuerengui',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '突厥男儿臣服唐廷五十年，今日阿史那血脉复立可汗之旗！草原的狼群，随我南下直扑云州，与唐将薛仁贵决一死战！' },
            { speaker: 'player', text: '愿随骨咄禄可汗共赴云州之战，迎击唐朝敌军！' },
        ],
    },

    // #175 塔里克 (670 ~ 720) — 公元711年瓜达莱特战役
    talike_talike: {
        generalId: 'talike_talike',
        battleName: '瓜达莱特战役',
        battleYear: 711,
        battleType: 'field',
        role: 'attacker',
        targetName: '瓜达莱特河畔',
        targetCityId: 'city_jiadisi',
        targetLat: 36.52,
        targetLng: -6.28,
        myTroops: 15000,
        enemyFactionId: 'xigete',
        enemyFactionName: '西哥特王国',
        enemyGeneralId: 'xigete_roderic',   // 🔴 [2026-10-20 成名战规则] 711 瓜达莱特守方是西哥特末王罗德里克（原势力误填腓尼基）
        // 🔴 [2026-10-20 兵力规则] 史实西哥特 2.5–3 万，按「守方≤攻方×2」取 3 万（原 3.5 万＝2.33 倍）
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '身后是浩瀚重洋，眼前是金戈顽敌，退路已断！为了荣耀与信仰，勇士们，拔出利刃随我踏平西哥特军阵！' },
            { speaker: 'player', text: '愿随塔里克将军共赴瓜达莱特战役，大破西哥特王国敌军！' },
        ],
    },

    // #176 张守珪 (684 ~ 740) — 公元727年瓜州之战（本城就地开战）
    guazhou_zhangshougui: {
        generalId: 'guazhou_zhangshougui',
        battleName: '瓜州之战',
        battleYear: 727,
        battleType: 'siege',
        role: 'defender',
        targetName: '瓜州晋昌',
        targetCityId: 'city_jinchangcheng',
        targetLat: 40.5346,
        targetLng: 95.820007,
        myTroops: 20000,
        enemyFactionId: 'tubo',
        enemyFactionName: '吐蕃',
        enemyGeneralId: 'tubo_xinuoluo',   // 🔴 [2026-10-20 成名战规则] 727 瓜州吐蕃主帅悉诺逻恭禄
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '吐蕃虏骑破边犯我瓜州城下，老夫坐城楼吹笙宴饮设疑兵！敌疑不敢进，壮士，随某引伏兵乘夜出击斩首！' },
            { speaker: 'player', text: '愿随张守珪将军共守瓜州之战，大破吐蕃敌军！' },
        ],
    },

    // #177 苏禄 (685 ~ 738) — 公元724年渴水日之战
    tujishi_sulukehan: {
        generalId: 'tujishi_sulukehan',
        battleName: '渴水日之战',
        battleYear: 724,
        battleType: 'field',
        role: 'attacker',
        targetName: '扎拉夫尚河畔',
        targetCityId: 'city_samaerhan',
        targetLat: 39.6525,
        targetLng: 66.9714,
        myTroops: 40000,
        enemyFactionId: 'womaya',
        enemyFactionName: '倭马亚王朝',
        enemyGeneralId: 'womaya_muslim',   // 🔴 [2026-10-20 成名战规则] 724 渴水日倭马亚主帅穆斯林（原势力误填图兰）
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '倭马亚大食军深陷河中荒漠，水源尽断渴疲交加！突骑施的弓骑勇士，随莫贺达干引箭奔驰，全歼大食重骑！' },
            { speaker: 'player', text: '愿随苏禄将军共赴渴水日之战，大破倭马亚王朝敌军！' },
        ],
    },

    // #178 查理马特 (688 ~ 741) — 公元732年普瓦捷战役
    gen_charles_martel: {
        generalId: 'gen_charles_martel',
        battleName: '普瓦捷战役',
        battleYear: 732,
        battleType: 'field',
        role: 'defender',
        targetName: '图尔与普瓦捷之间',
        targetCityId: 'city_chambord',
        targetLat: 47.616,
        targetLng: 1.517,
        myTroops: 30000,
        enemyFactionId: 'womaya',
        enemyFactionName: '倭马亚王朝',
        enemyGeneralId: 'womaya_abdrahman',   // 🔴 [2026-10-20 成名战规则] 732 普瓦捷倭马亚主帅拉赫曼（原势力误填瓦卢瓦）
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '异教徒铁骑席卷比利牛斯山，法兰克高卢生死在此一举！重装方阵坚如磐石，勇士们，随铁锤查理誓死顶住冲击！' },
            { speaker: 'player', text: '愿随查理马特将军共守普瓦捷战役，大破倭马亚王朝敌军！' },
        ],
    },

    // #179 奥恩格斯 (690 ~ 761) — 公元736年邓哈芬之战
    gen_onuist_i: {
        generalId: 'gen_onuist_i',
        battleName: '邓哈芬之战',
        battleYear: 736,
        battleType: 'siege',
        role: 'attacker',
        targetName: '邓哈芬山寨',
        targetCityId: 'city_dunadd',
        targetLat: 56.0914,
        targetLng: -5.4875,
        myTroops: 15000,
        enemyFactionId: 'dalriada',
        enemyFactionName: '达尔里阿达',
        enemyGeneralId: 'bfe_dalriada_king',
        enemyTroops: 12000,
        introLines: [
            { speaker: 'general', text: '达尔里阿达蛮族屡屡窥伺高地，皮克特的群狼绝不忍让！勇敢的高地战士，涂上战纹握紧战斧，随我踏平其要塞！' },
            { speaker: 'player', text: '愿随奥恩格斯将军共赴邓哈芬之战，大破达尔里阿达敌军！' },
        ],
    },

    // #180 郭子仪 (697 ~ 781) — 公元757年香积寺之战
    lingwu_guoziyi: {
        generalId: 'lingwu_guoziyi',
        battleName: '香积寺之战',
        battleYear: 757,
        battleType: 'field',
        role: 'attacker',
        targetName: '长安香积寺西',
        targetCityId: 'city_changan',
        targetLat: 34.27,
        targetLng: 108.93,
        myTroops: 50000,
        enemyFactionId: 'da_yan',
        enemyFactionName: '大燕',
        enemyGeneralId: 'zhuozhou_anshouzhong',   // 🔴 [2026-10-20 成名战规则] 757 香积寺大燕主帅安守忠（原势力误填唐国）
        enemyTroops: 44000,
        introLines: [
            { speaker: 'general', text: '逆胡乱华两京沦陷，今日社稷倾覆全看香积寺一战！李嗣业陌刀在前，壮士，随老夫引回纥大军夹攻，收复长安！' },
            { speaker: 'player', text: '愿随郭子仪将军共赴香积寺之战，大破大燕军！' },
        ],
    },

    // #181 高仙芝 (702 ~ 755) — 公元747年连云堡之战
    hepan_gaoxianzhi: {
        generalId: 'hepan_gaoxianzhi',
        battleName: '连云堡之战',
        battleYear: 747,
        battleType: 'siege',
        role: 'attacker',
        targetName: '阿诺越拔城',   // 🔴 [2026-10-20 成名战规则] 阿诺越拔在小勃律，锚定其都城孽多（原填柘折城＝塔什干，距离两千公里）
        targetCityId: 'city_nieduo',
        targetLat: 35.92,
        targetLng: 74.3,
        myTroops: 10000,
        enemyFactionId: 'xiaobolu',
        enemyFactionName: '小勃律国',
        enemyGeneralId: 'nandou_sushili',   // 🔴 [2026-10-20 成名战规则] 747 小勃律王苏失利（原势力误填石氏）
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '吐蕃结纳小勃律断绝西域朝贡，某率汉军翻越葱岭冰川险峰！壮士，持陌刀随我飞夺藤桥，直捣阿诺越拔坚城！' },
            { speaker: 'player', text: '愿随高仙芝将军共赴连云堡之战，大破小勃律国敌军！' },
        ],
    },

    // #182 安禄山 (703 ~ 757) — 公元756年灵宝西原之战
    zhuozhou_anlushan: {
        generalId: 'zhuozhou_anlushan',
        battleName: '灵宝西原之战',
        battleYear: 756,
        battleType: 'field',
        role: 'attacker',
        targetName: '灵宝隘道',
        targetCityId: 'city_hanguguan',
        targetLat: 34.615131,
        targetLng: 110.915222,
        myTroops: 40000,
        enemyFactionId: 'tang',   // 🔴 2026-10-20 修正：敌军是唐军，原填哥舒翰的潘州势力
        enemyFactionName: '唐朝',
        enemyGeneralId: 'gaoliang_geshuhan',
        // 🔴 [2026-10-20 兵力规则] 唐军号称二十万，按「守方≤攻方×2」取 8 万（我方 4 万）
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '唐天子昏聩杨国忠弄权，范阳精骑早已天下无敌！隘道狭窄诱其进兵，壮士随我燕军万骑顺风放火，直取潼关！' },
            { speaker: 'player', text: '愿随安禄山将军共赴灵宝西原之战，大破唐朝敌军！' },
        ],
    },

    // #183 哥舒翰 (704 ~ 757) — 公元749年苦拔天险夺石堡城之战

    // #184 骨力裴罗 (705 ~ 747) — 公元744年萨河内山之战
    huige_gulipeiluo: {
        generalId: 'huige_gulipeiluo',
        battleName: '萨河内山之战',
        battleYear: 744,
        battleType: 'field',
        role: 'attacker',
        targetName: '漠北卜古罕城',
        targetCityId: 'city_woluduobali',
        targetLat: 47.8,
        targetLng: 107.5,
        myTroops: 40000,
        enemyFactionId: 'tujue',
        enemyFactionName: '后突厥',
        enemyGeneralId: 'tujue_wusumishi',   // 🔴 [2026-10-20 成名战规则] 744 后突厥末代可汗乌苏米施
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '后突厥内乱天命已尽，漠北草原归于回纥正是今日！勇悍的九姓儿郎，挽满强弓随怀仁可汗冲锋，尽取漠北！' },
            { speaker: 'player', text: '愿随骨力裴罗将军共赴萨河内山之战，大破后突厥敌军！' },
        ],
    },

    // #185 王忠嗣 (705 ~ 749) — 公元745年桑乾河重创奚契丹之战

    // #186 李光弼 (708 ~ 764) — 公元757年太原之战
    liwang_liguangbi: {
        generalId: 'liwang_liguangbi',
        battleName: '太原之战',
        battleYear: 757,
        battleType: 'siege',
        role: 'defender',
        targetName: '太原城下',
        targetCityId: 'city_taiyuan',
        targetLat: 37.87,
        targetLng: 112.55,
        myTroops: 15000,
        enemyFactionId: 'da_yan',
        enemyFactionName: '大燕',
        enemyGeneralId: 'zhuozhou_shisiming',   // 🔴 [2026-10-20 成名战规则] 757 太原之围大燕主帅史思明（原势力误填并州）
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '史思明十万精锐围攻太原，老夫修地道发飞石以奇谋破其百策！壮士，坚守岗塞随某伺机出击，叫贼兵饮恨坚城！' },
            { speaker: 'player', text: '愿随李光弼将军共守太原之战，大破大燕军！' },
        ],
    },

    // #187 张巡 (709 ~ 757) — 公元757年睢阳之战（本城就地开战）
    liang_d_zhangxun: {
        generalId: 'liang_d_zhangxun',
        battleName: '睢阳之战',
        battleYear: 757,
        battleType: 'siege',
        role: 'defender',
        targetName: '商丘睢阳城',
        targetCityId: 'city_shangqiu',
        targetLat: 34.41,
        targetLng: 115.66,
        myTroops: 10000,
        enemyFactionId: 'da_yan',
        enemyFactionName: '大燕',
        enemyGeneralId: 'bfe_yin_ziqi',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '睢阳乃江淮咽喉，若睢阳陷则江淮尽失！尹子奇十三万兵围城，某唯有食肉尽节，壮士，操戈随某登陴死守！' },
            { speaker: 'player', text: '愿随张巡将军共守睢阳之战，大破大燕军！' },
        ],
    },

    // #188 阁罗凤 (712 ~ 779) — 公元754年西洱河之战
    nanzhao_geluofeng: {
        generalId: 'nanzhao_geluofeng',
        battleName: '西洱河之战',
        battleYear: 754,
        battleType: 'field',
        role: 'defender',
        targetName: '大理西洱河',
        targetCityId: 'city_mengshe',
        targetLat: 25.058278,
        targetLng: 100.500183,
        myTroops: 50000,
        enemyFactionId: 'tang',
        enemyFactionName: '唐朝',
        enemyGeneralId: 'tang_limi',   // 🔴 [2026-10-20 成名战规则] 754 征南诏唐军主帅李宓
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '鲜于仲通李宓贪暴欺凌六诏，大唐十万天兵深入重瘴！南诏父老退无可退，勇士，随我背水截击，尽覆唐军！' },
            { speaker: 'player', text: '愿随阁罗凤将军共守西洱河之战，大破唐朝敌军！' },
        ],
    },

    // #189 曼苏尔 (714 ~ 775) — 公元754年尼西比斯之战
    abasi_mansuer: {
        generalId: 'abasi_mansuer',
        battleName: '尼西比斯之战',
        battleYear: 754,
        battleType: 'field',
        role: 'attacker',
        targetName: '尼西比斯',
        targetCityId: 'city_nixibisi',
        targetLat: 37.07,
        targetLng: 41.22,
        myTroops: 30000,
        enemyFactionId: 'abasi',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '阿卜杜拉',
        enemyGeneralId: 'bfe_abdullah_ali',   // 🔴 [2026-10-25 按史] 754 尼西比斯＝阿卜杜拉（原填 891–961 的拉赫曼三世，差一个半世纪）
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '叔父阿卜杜拉勾结叙利亚残党图谋篡夺大统！阿布穆斯林大军已出，勇士，随真主哈里发扫除阿卜杜拉党羽巩固王权！' },
            { speaker: 'player', text: '愿随曼苏尔将军共赴尼西比斯之战，大破阿卜杜拉军！' },
        ],
    },

    // #190 仆固怀恩 (715 ~ 765) — 公元762年邙山之战
    pugu_puguhuaien: {
        generalId: 'pugu_puguhuaien',
        battleName: '邙山之战',
        battleYear: 762,
        battleType: 'field',
        role: 'attacker',
        targetName: '洛阳邙山',
        targetCityId: 'city_luoyang',
        targetLat: 34.62,
        targetLng: 112.45,
        myTroops: 50000,
        enemyFactionId: 'da_yan',
        enemyFactionName: '大燕',
        enemyGeneralId: 'gen_shi_chaoyi',   // 🔴 [2026-10-20 成名战规则] 762 洛阳邙山守方是史朝义（原势力误填武周）
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '燕贼残喘洛阳邙山据险列阵，回纥铁骑与朔方死士俱在此！老夫身先士卒斩将陷阵，壮士，拍马随某踏平贼营！' },
            { speaker: 'player', text: '愿随仆固怀恩将军共赴邙山之战，大破大燕军！' },
        ],
    },

    // #191 李晟 (727 ~ 793) — 公元784年长安之战
    qianzhou_lisheng: {
        generalId: 'qianzhou_lisheng',
        battleName: '长安之战',
        battleYear: 784,
        battleType: 'siege',
        role: 'attacker',
        targetName: '长安光泰门',
        targetCityId: 'city_changan',
        targetLat: 34.27,
        targetLng: 108.93,
        myTroops: 20000,
        enemyFactionId: 'da_qin',
        enemyFactionName: '大秦',
        // 🔴 [2026-10-20 成名战规则] 784 收复长安＝唐国内战，朱泚僭号据城，双方同属唐国势力（史实内战）
        // 🔴 [2026-10-28 主人令「一个势力不要开战，要不就分开势力」] 敌方改挂朱泚自立的「大秦」（784 已改国号汉，同一政权前后相承记一家）
        enemyGeneralId: 'tang_zhuci',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '朱泚称帝盘踞宫阙，天子避狄奉天！西平王李晟引孤军扎营城下誓死复仇，壮士，推云梯随某血战光泰门！' },
            { speaker: 'player', text: '愿随李晟将军共赴长安之战，大破朱泚军！' },
        ],
    },

    // #192 浑瑊 (736 ~ 799) — 公元783年奉天之战
    wei2_hunjian: {
        generalId: 'wei2_hunjian',
        battleName: '奉天之战',
        battleYear: 783,
        battleType: 'siege',
        role: 'defender',
        targetName: '奉天城下',
        targetCityId: 'city_fengtian',
        targetLat: 34.53,
        targetLng: 108.24,
        myTroops: 15000,
        enemyFactionId: 'da_qin',   // 🔴 [2026-10-28 主人令「一个势力不要开战，要不就分开势力」] 奉天围城的朱泚已单立「大秦」（原误并 tang＝唐打唐）
        enemyFactionName: '大秦',
        enemyGeneralId: 'tang_zhuci',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '贼兵造云桥连昼夜急攻奉天，乘舆蒙尘万分危急！老夫血战壕前火焚贼桥，壮士，握紧矛槊随某誓死护卫皇城！' },
            { speaker: 'player', text: '愿随浑瑊将军共守奉天之战，大破朱泚军！' },
        ],
    },

    // #193 赤松德赞 (742 ~ 797) — 公元763年长安之战
    yangtong_chisongdezan: {
        generalId: 'yangtong_chisongdezan',
        battleName: '长安之战',
        battleYear: 763,
        battleType: 'siege',
        role: 'attacker',
        targetName: '长安城',
        targetCityId: 'city_changan',
        targetLat: 34.27,
        targetLng: 108.93,
        myTroops: 50000,
        enemyFactionId: 'tang',
        enemyFactionName: '唐朝',
        enemyGeneralId: 'lingwu_guoziyi',   // 🔴 [2026-10-20 成名战规则] 763 长安守方唐军统帅郭子仪（复用现有武将）
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '唐室内乱四方勤王乏绝，雪域雄师东下泾州兵临关中！吐蕃的勇士们，高举雄狮战旗，随赞普长驱杀入长安城！' },
            { speaker: 'player', text: '愿随赤松德赞将军共赴长安之战，大破唐朝敌军！' },
        ],
    },

    // #194 韦皋 (745 ~ 805) — 公元801年维州之战（本城就地开战）
    weizhou_weigao: {
        generalId: 'weizhou_weigao',
        battleName: '维州之战',
        battleYear: 801,
        battleType: 'field',
        role: 'attacker',
        targetName: '维州薛寨',
        targetCityId: 'city_xuecheng',
        targetLat: 31.43,
        targetLng: 103.16,
        // 🔴 [2026-10-20 兵力规则] 史载吐蕃十六万围维州，按「守方≤攻方×2」取我军 4 万、吐蕃 8 万
        myTroops: 40000,
        enemyFactionId: 'tubo',
        enemyFactionName: '吐蕃',
        enemyGeneralId: 'tubo_lunmangre',   // 🔴 [2026-10-20 成名战规则] 801 维州吐蕃主帅论莽热
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '吐蕃倾十六万大军围我维州薛寨，妄图窥蜀！老夫出奇兵绝其栈道据险痛击，壮士，提川弩随某围歼论莽热！' },
            { speaker: 'player', text: '愿随韦皋将军共赴维州之战，大破吐蕃敌军！' },
        ],
    },

    // #195 达磨波罗 (745 ~ 810) — 公元790年曲女城之战
    boluo_damoboluo: {
        generalId: 'boluo_damoboluo',
        battleName: '曲女城之战',
        battleYear: 790,
        battleType: 'field',
        role: 'attacker',
        targetName: '卡瑙季郊外',
        targetCityId: 'city_qunvcheng',
        targetLat: 27.05,
        targetLng: 79.92,
        myTroops: 50000,
        enemyFactionId: 'gurjara',
        enemyFactionName: '瞿折罗-普腊蒂哈腊',
        enemyGeneralId: 'gurjara_vatsaraja',   // 🔴 [2026-10-20 成名战规则] 790 曲女城争霸对手是瞿折罗王瓦萨拉贾（原势力误填戒日帝国）
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '恒河两岸佛光辉映，三强争霸卡瑙季霸权在此一役！波罗的战象军团与勇士，随法王开疆拓土，威临北印度！' },
            { speaker: 'player', text: '愿随达磨波罗将军共赴曲女城之战，大破瞿折罗-普腊蒂哈腊敌军！' },
        ],
    },

    // #196 查理曼 (748 ~ 814) — 公元773年帕维亚之战
    gen_charlemagne: {
        generalId: 'gen_charlemagne',
        battleName: '帕维亚之战',
        battleYear: 773,
        battleType: 'siege',
        role: 'attacker',
        targetName: '帕维亚',
        targetCityId: 'city_milan',
        targetLat: 45.46,
        targetLng: 9.19,
        myTroops: 40000,
        enemyFactionId: 'lunbadi',
        enemyFactionName: '伦巴第王国',
        enemyGeneralId: 'lunbadi_desiderius',   // 🔴 [2026-10-20 成名战规则] 773 帕维亚守方伦巴第王德西德里乌斯
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '伦巴第蛮王背弃盟约冒犯罗马圣座，法兰克铁甲骑士已跨过阿尔卑斯雪山！勇士，随孤合围帕维亚，铸就帝国铁冠！' },
            { speaker: 'player', text: '愿随查理曼将军共赴帕维亚之战，大破伦巴第王国敌军！' },
        ],
    },

    // #197 克鲁姆 (755 ~ 814) — 公元811年普利斯卡战役
    gen_krum: {
        generalId: 'gen_krum',
        battleName: '普利斯卡战役',
        battleYear: 811,
        battleType: 'field',
        role: 'defender',
        targetName: '瓦尔比察峡谷',
        targetCityId: 'city_puleisilafu',
        targetLat: 43.142315,
        targetLng: 26.813148,
        myTroops: 35000,
        enemyFactionId: 'baizanting',
        enemyFactionName: '拜占庭帝国',
        enemyGeneralId: 'baizanting_nikephoros_i',   // 🔴 [2026-10-20 成名战规则] 811 普利斯卡拜占庭皇帝尼基弗鲁斯一世（原势力误填多瑙保加＝己方）
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '拜占庭皇帝焚我王都烧杀抢掠，其军已入狭窄峡谷！保加利亚的勇士们，举起战斧推下滚石，随可汗将敌军埋葬于隘口！' },
            { speaker: 'player', text: '愿随克鲁姆将军共守普利斯卡战役，大破拜占庭帝国敌军！' },
        ],
    },

    // #198 李愬 (773 ~ 821) — 公元817年蔡州之战（本城就地开战）
    yuan_cj_d_lishuo: {
        generalId: 'yuan_cj_d_lishuo',
        battleName: '蔡州之战',
        battleYear: 817,
        battleType: 'siege',
        role: 'attacker',
        targetName: '悬瓠',
        targetCityId: 'city_xuanhu',
        targetLat: 33.01,
        targetLng: 114.36,
        myTroops: 10000,
        enemyFactionId: 'tang',
        enemyFactionName: '淮西镇',
        enemyGeneralId: 'bfe_wu_yuanji',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '淮西阻兵三十年，风雪大作正是天赐良机！某已令夜驱群鸭鹅掩行伍声息，壮士，披坚执锐随老夫直插蔡州擒吴元济！' },
            { speaker: 'player', text: '愿随李愬将军共赴蔡州之战，大破淮西军！' },
        ],
    },

    // #199 提婆波罗 (788 ~ 850) — 公元820年摩揭陀之战
    varendra_devapala: {
        generalId: 'varendra_devapala',
        battleName: '摩揭陀之战',
        battleYear: 820,
        battleType: 'field',
        role: 'attacker',
        targetName: '卡瑙季郊外',
        targetCityId: 'city_qunvcheng',
        targetLat: 27.05,
        targetLng: 79.92,
        myTroops: 50000,
        enemyFactionId: 'gurjara',
        enemyFactionName: '瞿折罗-普腊蒂哈腊',
        enemyGeneralId: 'gurjara_nagabhata_ii',   // 🔴 [2026-10-20 成名战规则] 820 曲女城北伐对手是瞿折罗王那加巴塔二世
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '恒河两岸佛法昌明，三邦纷争尽归波罗！战象披甲铁蹄震地，勇士，随我统领雄师北伐中原，让正义之旗插遍全印度！' },
            { speaker: 'player', text: '愿随提婆波罗将军共赴摩揭陀之战，大破瞿折罗-普腊蒂哈腊敌军！' },
        ],
    },

    // #200 穆阿台绥姆 (796 ~ 842) — 公元838年阿莫里姆围城战

    // #201 张议潮 (799 ~ 872) — 公元848年沙州起义复唐之战（本城就地开战）

    // #202 阿热 (800 ~ 850) — 公元840年鄂尔浑城之战
    xiajiasi_are: {
        generalId: 'xiajiasi_are',
        battleName: '鄂尔浑城之战',
        battleYear: 840,
        battleType: 'siege',
        role: 'attacker',
        targetName: '鄂尔浑河窝鲁朵八里',
        targetCityId: 'city_woluduocheng',
        targetLat: 47.698601,
        targetLng: 102.631531,
        myTroops: 50000,
        enemyFactionId: 'huihu',
        enemyFactionName: '回鹘汗国',
        enemyGeneralId: 'huihu_wusa',   // 🔴 [2026-10-20 成名战规则] 840 回鹘末代可汗㕎馺
        enemyTroops: 43000,
        introLines: [
            { speaker: 'general', text: '回鹘残暴掠我坚昆百年，二十年血战今日必了！大雪纷飞正是神迹，黠戛斯十万勇士，随阿热引骑兵踏平其金顶汗帐！' },
            { speaker: 'player', text: '愿随阿热将军共赴鄂尔浑城之战，大破回鹘汗国敌军！' },
        ],
    },

    // #203 黄巢 (820 ~ 884) — 公元878年破仙霞关入闽之战（本城就地开战）

    // #204 高骈 (821 ~ 887) — 公元866年交趾之战
    zhuoshi_gaopian: {
        generalId: 'zhuoshi_gaopian',
        battleName: '交趾之战',
        battleYear: 866,
        battleType: 'siege',
        role: 'attacker',
        targetName: '安南宋平城',
        targetCityId: 'city_shenglong',
        targetLat: 21.03,
        targetLng: 105.85,
        myTroops: 30000,
        enemyFactionId: 'nanzhao',
        enemyFactionName: '南诏',
        enemyGeneralId: 'nanzhao_duanqiuxian',   // 🔴 [2026-10-20 成名战规则] 866 交趾南诏守将段酋迁
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '南诏蛮贼侵占安南荼毒黎民，老夫统天德精锐浮海远征！飞石云梯尽摧敌堞，壮士，随高公登城陷阵，一战底定交趾！' },
            { speaker: 'player', text: '愿随高骈将军共赴交趾之战，大破南诏敌军！' },
        ],
    },

    // #205 斯瓦托 (830 ~ 894) — 公元871年摩拉维亚之战（本城就地开战）
    gen_swatopluk: {
        generalId: 'gen_swatopluk',
        battleName: '摩拉维亚之战',
        battleYear: 871,
        battleType: 'field',
        role: 'defender',
        targetName: '奥尔穆茨',
        targetCityId: 'city_aoermuci',
        targetLat: 49.59,
        targetLng: 17.25,
        myTroops: 25000,
        enemyFactionId: 'falanji',
        enemyFactionName: '东法兰克王国',
        enemyGeneralId: 'falanji_kalman',   // 🔴 [2026-10-20 成名战规则] 871 攻摩拉维亚的东法兰克主帅卡洛曼
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '日耳曼法兰克军团企图奴役斯拉夫族人，背信弃义入犯家园！斯拉夫勇士们，拔出长剑随斯瓦托普卢克大公守土死战！' },
            { speaker: 'player', text: '愿随斯瓦托将军共守摩拉维亚之战，大破东法兰克王国敌军！' },
        ],
    },

    // #206 萨法尔 (840 ~ 900) — 公元867年赫拉特之战
    xisi_safaer: {
        generalId: 'xisi_safaer',
        battleName: '赫拉特之战',
        battleYear: 867,
        battleType: 'field',
        role: 'attacker',
        targetName: '赫拉特郊外',
        targetCityId: 'city_helate_city',
        targetLat: 34.34,
        targetLng: 62.19,
        myTroops: 25000,
        enemyFactionId: 'abasi',   // 🔴 [2026-10-25 按史] 敌将势力对齐
        enemyFactionName: '塔希尔王朝',
        enemyGeneralId: 'aliya_muhammad_tahir',   // 🔴 [2026-10-20 成名战规则] 867 希拉特守方是塔希尔王朝塔希尔
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '塔希尔总督苛政害民，阿拔斯走狗何足挂齿！锡斯坦铜匠之子举义旗，勇士，持战斧随萨法尔纵马奔驰，收复赫拉特！' },
            { speaker: 'player', text: '愿随萨法尔将军共赴赫拉特之战，大破塔希尔王朝敌军！' },
        ],
    },


    // #208 阿尔弗雷德 (849 ~ 899) — 公元878年埃丁顿战役
    gen_alfred_great: {
        generalId: 'gen_alfred_great',
        battleName: '埃丁顿战役',
        battleYear: 878,
        battleType: 'field',
        role: 'attacker',
        targetName: '埃丁顿',
        targetCityId: 'city_winchester',
        targetLat: 51.06,
        targetLng: -1.31,
        myTroops: 15000,
        enemyFactionId: 'danmai',
        enemyFactionName: '维京丹麦军',
        enemyGeneralId: 'danmai_guthrum',   // 🔴 [2026-10-20 成名战规则] 878 埃丁顿对手是丹麦维京首领古思伦（原势力误填英格兰＝己方）
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '丹麦维京野人焚毁教堂屠戮故土，威塞克斯退无可退！盾墙已立圣剑在手，撒克逊勇士们，随阿尔弗雷德全线冲锋！' },
            { speaker: 'player', text: '愿随阿尔弗雷德将军共赴埃丁顿战役，大破维京丹麦军敌军！' },
        ],
    },

    // #209 伊斯玛仪 (849 ~ 907) — 公元900年巴尔赫之战
    saman_yisimayi: {
        generalId: 'saman_yisimayi',
        battleName: '巴尔赫之战',
        battleYear: 900,
        battleType: 'field',
        role: 'defender',
        targetName: '巴尔赫郊外',
        targetCityId: 'city_lanshi',
        targetLat: 36.71248,
        targetLng: 67.08252,
        myTroops: 20000,
        enemyFactionId: 'xisi',
        enemyFactionName: '锡斯坦',
        enemyGeneralId: 'xisi_amr',   // 🔴 [2026-10-20 成名战规则] 900 巴尔赫萨法尔主帅阿姆尔（原势力误填贵霜）
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '阿姆尔骄兵五万渡阿姆河欲灭我萨曼，其兵虽众民心已背！呼罗珊与河中的勇士，随我据险死战，一战生擒萨法尔王！' },
            { speaker: 'player', text: '愿随伊斯玛仪将军共守巴尔赫之战，大破锡斯坦敌军！' },
        ],
    },

    // #210 钱镠 (852 ~ 932) — 公元887年杭州之战（本城就地开战）
    wuyue_qianliu: {
        generalId: 'wuyue_qianliu',
        battleName: '杭州之战',
        battleYear: 887,
        battleType: 'siege',
        role: 'defender',
        targetName: '杭州',
        targetCityId: 'city_hangzhou',
        targetLat: 30.25,
        targetLng: 120.16,
        myTroops: 15000,
        enemyFactionId: 'tang',
        enemyFactionName: '孙儒',
        enemyGeneralId: 'bfe_sun_ru',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '淮西贼寇孙儒残暴嗜血，分兵残虐两浙百姓！老夫率八都儿郎固守钱塘江畔，壮士，随钱某设伏夹击，保全吴越家园！' },
            { speaker: 'player', text: '愿随钱镠将军共守杭州之战，大破孙儒军！' },
        ],
    },

    // #211 杨行密 (852 ~ 905) — 公元897年清口之战
    yang_zhou_yangxingmi: {
        generalId: 'yang_zhou_yangxingmi',
        battleName: '清口之战',
        battleYear: 897,
        battleType: 'field',
        role: 'defender',
        targetName: '淮阴清口',
        targetCityId: 'city_huaiyin',
        targetLat: 33.5,
        targetLng: 119.13,
        myTroops: 30000,
        enemyFactionId: 'hou_liang',
        enemyFactionName: '朱温汴军',
        enemyGeneralId: 'dang_d_pangshigu',   // 🔴 [2026-10-20 成名战规则] 897 清口朱温军主帅庞师古（原势力误填泗州）
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '朱温大将庞师古引汴州精锐七万压境，扎营洼地不知兵法！某已决淮河之水灌敌，壮士，持长槊随某乘夜斩杀师古！' },
            { speaker: 'player', text: '愿随杨行密将军共守清口之战，大破朱温汴军敌军！' },
        ],
    },

    // #212 朱温 (852 ~ 912) — 公元884年柏谷之战
    dang_d_zhuwen: {
        generalId: 'dang_d_zhuwen',
        battleName: '柏谷之战',
        battleYear: 884,
        battleType: 'field',
        role: 'attacker',
        targetName: '亳州柏谷台',
        targetCityId: 'city_qiaojun',
        targetLat: 33.88,
        targetLng: 115.77,
        myTroops: 40000,
        enemyFactionId: 'huangwang',
        enemyFactionName: '大齐',
        enemyGeneralId: 'huangwang_huangchao',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '黄巢草寇势穷力竭窜逃陈州，某奉朝廷节钺尽起宣武精骑追歼！壮士，随某趁风雷之势纵马掩杀，彻底肃清贼乱！' },
            { speaker: 'player', text: '愿随朱温将军共赴柏谷之战，大破大齐军！' },
        ],
    },

    // #213 李克用 (856 ~ 908) — 公元883年梁田坡之战
    shatuo_likeyong: {
        generalId: 'shatuo_likeyong',
        battleName: '梁田坡之战',
        battleYear: 883,
        battleType: 'field',
        role: 'attacker',
        targetName: '长安梁田坡',
        targetCityId: 'city_changan',
        targetLat: 34.27,
        targetLng: 108.93,
        myTroops: 35000,
        enemyFactionId: 'huangwang',
        enemyFactionName: '大齐',
        enemyGeneralId: 'huangwang_huangchao',   // 🔴 [2026-10-20 成名战规则] 883 梁田坡守方是黄巢大齐军（原势力误填唐国）
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '独眼沙陀儿郎纵横塞北，黄巢据关中！鸦军黑甲铁骑势不可当，壮士，换上战马随某踏破贼寨，光复大唐长安！' },
            { speaker: 'player', text: '愿随李克用将军共赴梁田坡之战，大破大齐军！' },
        ],
    },

    // #214 周德威 (858 ~ 918) — 公元911年柏乡之战
    qingyuan_bd_zhoudewei: {
        generalId: 'qingyuan_bd_zhoudewei',
        battleName: '柏乡之战',
        battleYear: 911,
        battleType: 'field',
        role: 'attacker',
        targetName: '邢州柏乡',
        targetCityId: 'city_xingtai',
        targetLat: 37.07,
        targetLng: 114.5,
        // 🔴 [2026-10-20 兵力规则] 柏乡晋军约 3.5 万，按「守方≤攻方×2」与梁军 7 万配平
        myTroops: 35000,
        enemyFactionId: 'hou_liang',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '朱梁',
        enemyGeneralId: 'liang_d_wangjingren',   // 🔴 [2026-10-20 成名战规则] 911 柏乡后梁主帅王景仁（原势力误填石赵）
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '梁军重装铁甲龙骧卫虽坚，然驱长途利在速决！某引沙陀轻骑诱其疲惫，待其阵动，壮士，随老夫全军铁骑突阵！' },
            { speaker: 'player', text: '愿随周德威将军共赴柏乡之战，大破后梁敌军！' },
        ],
    },

    // #215 王彦章 (863 ~ 923) — 公元923年德胜口之战
    dizhou_wangyanzhang: {
        generalId: 'dizhou_wangyanzhang',
        battleName: '德胜口之战',
        battleYear: 923,
        battleType: 'field',
        role: 'attacker',
        targetName: '澶州德胜口',
        targetCityId: 'city_puyang',
        targetLat: 35.7621,
        targetLng: 115.0291,
        myTroops: 20000,
        enemyFactionId: 'shatuo',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '后唐',
        enemyGeneralId: 'yingzhou_d2_licunxu',   // 🔴 [2026-10-25 按史] 923 德胜口是王彦章攻后唐李存勖的德胜南北城；原填柴荣（921 年生，此年两岁，后周世宗在二十多年后）
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '晋贼造浮桥锁大河扼我咽喉，铁枪王彦章受命三天必破贼寨！手持六十斤铁枪，壮士，随某驾战舟斩断浮桥生擒敌将！' },
            { speaker: 'player', text: '愿随王彦章将军共赴德胜口之战，大破后唐敌军！' },
        ],
    },

    // #216 西美昂 (864 ~ 927) — 公元917年阿海洛战役
    gen_simeon_great: {
        generalId: 'gen_simeon_great',
        battleName: '阿海洛战役',
        battleYear: 917,
        battleType: 'field',
        role: 'attacker',
        targetName: '安基阿鲁斯阿海洛河',
        targetCityId: 'city_waerna',
        targetLat: 43.214,
        targetLng: 27.915,
        myTroops: 40000,
        enemyFactionId: 'baizanting',
        enemyFactionName: '拜占庭帝国',
        enemyGeneralId: 'bfe_leo_phokas',   // 🔴 [2026-10-25 按史] 917 阿海洛斯拜占庭野战军＝老利奥福卡斯（罗曼努斯在舰队）
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '拜占庭帝国倾举国军团妄图覆灭保加利亚！我伏兵已潜藏于高岗丘陵，勇士们，随沙皇全线反击，将敌人赶入黑海！' },
            { speaker: 'player', text: '愿随西美昂将军共赴阿海洛战役，大破拜占庭帝国敌军！' },
        ],
    },

    // #217 甄萱 (867 ~ 936) — 公元927年曹洞岘之战
    zhen_zhenxuan: {
        generalId: 'zhen_zhenxuan',
        battleName: '曹洞岘之战',
        battleYear: 927,
        battleType: 'field',
        role: 'attacker',
        targetName: '大邱公山',
        targetCityId: 'city_jincheng_silla',
        targetLat: 35.808912,
        targetLng: 129.210205,
        myTroops: 30000,
        enemyFactionId: 'goryeo',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '高丽',
        enemyGeneralId: 'bfe_wanggeon',   // 🔴 [2026-10-25 按史] 927 公山曹洞岘＝高丽太祖王建（库里 zizhou_wangjian 是前蜀王建，同名不同人）
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '王建贼党妄称正统，孤提后百济精兵奇袭新罗王都！公山峡谷伏兵已毕，勇士，随孤合围王建，射杀其大将申崇谦！' },
            { speaker: 'player', text: '愿随甄萱将军共赴曹洞岘之战，大破高丽敌军！' },
        ],
    },

    // #218 耶律阿保机 (872 ~ 926) — 公元926年忽汗城之战
    liao_d_yelvabaoji: {
        generalId: 'liao_d_yelvabaoji',
        battleName: '忽汗城之战',
        battleYear: 926,
        battleType: 'siege',
        role: 'attacker',
        targetName: '渤海上京龙泉府',
        targetCityId: 'city_ningan',
        targetLat: 44.128997,
        targetLng: 129.295349,
        myTroops: 50000,
        enemyFactionId: 'bohai',
        enemyFactionName: '渤海国',
        enemyGeneralId: 'bohai_dayinzhuan',   // 🔴 [2026-10-20 成名战规则] 926 渤海末王大諲撰
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '天皇帝得神龙之瑞，契丹铁骑踏破长白黑水！忽汗城三面受围旦夕可破，八部勇士，拉满角弓随阿保机踏平渤海！' },
            { speaker: 'player', text: '愿随耶律阿保机将军共赴忽汗城之战，大破渤海国敌军！' },
        ],
    },


    // #220 阿卜杜拉 (891 ~ 961) — 公元939年萨拉曼卡战役
    gen_abd_al_rahman_iii: {
        generalId: 'gen_abd_al_rahman_iii',
        battleName: '萨拉曼卡战役',
        battleYear: 939,
        battleType: 'field',
        role: 'attacker',
        targetName: '萨拉曼卡锡曼卡斯',
        targetCityId: 'city_salamanca',
        targetLat: 40.96,
        targetLng: -5.66,
        myTroops: 50000,
        enemyFactionId: 'leangongguo',
        enemyFactionName: '莱昂王国',
        enemyGeneralId: 'gen_ramiro_ii',
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '北方基督徒蛮族侵犯安达卢西亚疆界！哈里发亲率全西甲军团圣战出征，勇士，持大马士革利刃随我踏平杜罗河防线！' },
            { speaker: 'player', text: '愿随阿卜杜拉将军共赴萨拉曼卡战役，大破莱昂王国敌军！' },
        ],
    },

    // #221 奥托一世 (912 ~ 973) — 公元955年莱希菲尔德战役
    gen_otto_great: {
        generalId: 'gen_otto_great',
        battleName: '莱希菲尔德战役',
        battleYear: 955,
        battleType: 'field',
        role: 'attacker',
        targetName: '奥格斯堡莱希河畔',
        targetCityId: 'city_aogesibao',
        targetLat: 48.37,
        targetLng: 10.89,
        myTroops: 15000,
        enemyFactionId: 'mazhaer',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '马扎尔游牧同盟',
        enemyGeneralId: 'bfe_bulcsu',   // 🔴 [2026-10-25 按史] 955 莱希河马扎尔军主将＝布尔丘（乌尔里希是奥托一方的奥格斯堡主教）
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '匈牙利骑兵掳掠德意志数十年，今日暴雨淋湿其弓弦！神圣圣矛在孤王手中，日耳曼勇士们，重铠长矛冲锋，全歼蛮骑！' },
            { speaker: 'player', text: '愿随奥托一世将军共赴莱希菲尔德战役，大破马扎尔游牧同盟敌军！' },
        ],
    },

    // #222 柴荣 (921 ~ 959) — 公元954年高平之战
    chanzhou_chairong: {
        generalId: 'chanzhou_chairong',
        battleName: '高平之战',
        battleYear: 954,
        battleType: 'field',
        role: 'defender',
        targetName: '泽州高平巴公原',
        targetCityId: 'city_shangdang',
        targetLat: 36.148974,
        targetLng: 113.008118,
        myTroops: 30000,
        enemyFactionId: 'hou_han',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '北汉契丹联军',
        enemyGeneralId: 'xin_liuchong',   // 🔴 [2026-10-20 成名战规则] 954 高平之战北汉主刘崇
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '樊爱能何徽临阵脱逃，朕御驾亲临岂能苟且偷生！主辱臣死正在今日，壮士，随朕拔剑策马直冲刘崇中军，誓死破敌！' },
            { speaker: 'player', text: '愿随柴荣将军共守高平之战，大破北汉契丹联军敌军！' },
        ],
    },

    // #223 丁部领 (924 ~ 979) — 公元968年华闾之战（本城就地开战）
    jing_dingbuling: {
        generalId: 'jing_dingbuling',
        battleName: '华闾之战',
        battleYear: 968,
        battleType: 'field',
        role: 'attacker',
        targetName: '华闾',
        targetCityId: 'city_hoalu',
        targetLat: 20.25,
        targetLng: 105.9167,
        myTroops: 30000,
        enemyFactionId: 'daquyue',
        enemyFactionName: '十二使君',
        enemyGeneralId: 'bfe_ngo_nhat_khanh',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '交趾各州割据混战民不聊生，万胜王起于华闾洞定天下！安南好男儿，随孤引山林藤甲水军分进合击，一统江山！' },
            { speaker: 'player', text: '愿随丁部领将军共赴华闾之战，大破十二使君敌军！' },
        ],
    },

    // #224 齐米斯基 (925 ~ 976) — 公元971年多罗斯托隆之战
    duonaobaojia_tzimiskes: {
        generalId: 'duonaobaojia_tzimiskes',
        battleName: '多罗斯托隆之战',
        battleYear: 971,
        battleType: 'siege',
        role: 'attacker',
        targetName: '硅利斯特拉多罗斯托隆',
        targetCityId: 'city_delusitaer',
        targetLat: 44.12,
        targetLng: 27.26,
        myTroops: 40000,
        enemyFactionId: 'luosi',
        enemyFactionName: '基辅罗斯',
        enemyGeneralId: 'xiadunhe_sviatoslav',
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '罗斯野蛮人侵入多瑙河残害臣民，重装甲骑兵已合围多罗斯托隆！铁甲勇士，举起十字架与喷火器，随朕覆灭罗斯！' },
            { speaker: 'player', text: '愿随齐米斯基将军共赴多罗斯托隆之战，大破基辅罗斯敌军！' },
        ],
    },

    // #225 赵匡胤 (927 ~ 976) — 公元957年紫金山之战
    song_zhaokuangyin: {
        generalId: 'song_zhaokuangyin',
        battleName: '紫金山之战',
        battleYear: 957,
        battleType: 'siege',
        role: 'attacker',
        targetName: '寿春城下',
        targetCityId: 'city_shouxian',
        targetLat: 32.59,
        targetLng: 116.8,
        myTroops: 40000,
        enemyFactionId: 'nantang',
        enemyFactionName: '南唐',
        enemyGeneralId: 'bfe_liurenshan',   // 🔴 [2026-10-25 按史] 957 守寿春＝刘仁赡（皇甫晖 956 已死）
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '周世宗御驾亲征淮南，南唐重兵屯驻寿春负隅顽抗！某殿前都虞候身先士卒破城擒皇甫晖，壮士，随某陷阵立大功！' },
            { speaker: 'player', text: '愿随赵匡胤将军共赴紫金山之战，大破南唐敌军！' },
        ],
    },

    // #226 耶律休哥 (930 ~ 998) — 公元979年高梁河之战
    yel_yelvxiuge: {
        generalId: 'yel_yelvxiuge',
        battleName: '高梁河之战',
        battleYear: 979,
        battleType: 'field',
        role: 'attacker',
        targetName: '幽州高梁河',
        targetCityId: 'city_beijing',
        targetLat: 39.9,
        targetLng: 116.41,
        // 🔴 [2026-10-20 兵力规则] 宋军号称三十万，按「守方≤攻方×2」把辽军取 4 万
        myTroops: 40000,
        enemyFactionId: 'song',
        enemyFactionName: '北宋',
        enemyGeneralId: 'song_zhaoguangyi',   // 🔴 [2026-10-20 成名战规则] 979 高梁河宋军主帅是宋太宗赵光义（原势力误填大明）
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '宋主赵光义围困幽州数旬兵疲意沮！孤率精骑人执两炬自高梁河两翼合抄，契丹勇士，随于越将军长槊踏碎宋阵！' },
            { speaker: 'player', text: '愿随耶律休哥将军共赴高梁河之战，大破北宋敌军！' },
        ],
    },

    // #227 杨业 (932 ~ 986) — 公元980年雁门之战（本城就地开战）
    heng1_yangye: {
        generalId: 'heng1_yangye',
        battleName: '雁门之战',
        battleYear: 980,
        battleType: 'siege',
        role: 'defender',
        targetName: '雁门关',
        targetCityId: 'city_yanmenguan',
        targetLat: 39.19,
        targetLng: 112.87,
        myTroops: 10000,
        enemyFactionId: 'liao_d',
        enemyFactionName: '辽国',
        enemyGeneralId: 'liao_d_xiaoduli',   // 🔴 [2026-10-20 成名战规则] 980 雁门关辽军主帅萧咄李（被杨业阵斩）
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '辽寇十万大军犯雁门，正面强攻关险！无敌杨业已选精骑千余从后谷绕其背后，壮士，随老夫据险出奇痛歼胡虏！' },
            { speaker: 'player', text: '愿随杨业将军共守雁门之战，大破辽国敌军！' },
        ],
    },

    // #228 布赖恩博鲁 (941 ~ 1014) — 公元1014年克朗塔夫战役
    mangsite_bulaienbolu: {
        generalId: 'mangsite_bulaienbolu',
        battleName: '克朗塔夫战役',
        battleYear: 1014,
        battleType: 'field',
        role: 'attacker',
        targetName: '都柏林克朗塔夫',
        targetCityId: 'city_dublin',
        targetLat: 53.34,
        targetLng: -6.26,
        myTroops: 20000,
        enemyFactionId: 'dublin',
        enemyFactionName: '都柏林王国',
        // 🔴 [2026-10-28 按史] 敌方势力＝都柏林王国（原挂「达尔里阿达」错：1014 守都柏林的是北欧王西格特里格）
        enemyGeneralId: 'gaer_sigtrygg',   // 🔴 [2026-10-20 成名战规则] 1014 克朗塔夫都柏林维京王西格特里格
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '异邦维京海盗奴役爱尔兰数百年，至高王布赖恩亲临战场！爱尔兰的勇士们，举起阔剑为了自由与天主，血战破敌！' },
            { speaker: 'player', text: '愿随布赖恩博鲁将军共赴克朗塔夫战役，大破都柏林王国敌军！' },
        ],
    },

    // #229 斯维亚托斯拉夫 (942 ~ 972) — 公元965年萨尔克尔要塞之战（本城就地开战）

    // #230 拉贾拉贾一世 (947 ~ 1014) — 公元993年阿努拉德普拉之战
    zhuluo_lajialajia: {
        generalId: 'zhuluo_lajialajia',
        battleName: '阿努拉德普拉之战',
        battleYear: 993,
        battleType: 'siege',
        role: 'attacker',
        targetName: '锡兰阿努拉德普拉',
        targetCityId: 'city_anulade',
        targetLat: 8.3533,
        targetLng: 80.3956,
        myTroops: 45000,
        enemyFactionId: 'sengjialuo',
        enemyFactionName: '僧伽罗王国',
        enemyGeneralId: 'sengjialuo_mahinda_v',   // 🔴 [2026-10-20 成名战规则] 993 僧伽罗王摩哂陀五世
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '朱罗战船跨越保克海峡，象兵军团践踏锡兰故地！湿婆大神庇佑征服之王，勇士，持战矛随朕登岸破城，夺下全岛！' },
            { speaker: 'player', text: '愿随拉贾拉贾一世将军共赴阿努拉德普拉之战，大破僧伽罗王国敌军！' },
        ],
    },

    // #231 姜邯赞 (948 ~ 1031) — 公元1019年龟州之战
    goryeo_jianghanzan: {
        generalId: 'goryeo_jianghanzan',
        battleName: '龟州之战',
        battleYear: 1019,
        battleType: 'field',
        role: 'defender',
        targetName: '平安北道龟州',
        targetCityId: 'city_xicheng',
        targetLat: 39.62,
        targetLng: 125.66,
        myTroops: 50000,
        enemyFactionId: 'liao_d',
        enemyFactionName: '辽国',
        enemyGeneralId: 'liao_d_xiaopaiya',   // 🔴 [2026-10-20 成名战规则] 1019 龟州辽军主帅萧排押
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '契丹契丹十万精骑败退归国必经龟州，老夫已决三桥川之水断其前路！风雨骤作敌阵大乱，高丽勇士随老臣合击全歼！' },
            { speaker: 'player', text: '愿随姜邯赞将军共守龟州之战，大破辽国敌军！' },
        ],
    },

    // #232 折御卿 (958 ~ 995) — 公元995年子河汊之战（本城就地开战）
    zhe_d_zheyuqing: {
        generalId: 'zhe_d_zheyuqing',
        battleName: '子河汊之战',
        battleYear: 995,
        battleType: 'field',
        role: 'attacker',
        targetName: '府谷子河汊',
        targetCityId: 'city_fuzhou_fugu',
        targetLat: 39.0278,
        targetLng: 111.0583,
        myTroops: 20000,
        enemyFactionId: 'liao_d',
        enemyFactionName: '辽国',
        enemyGeneralId: 'liao_d_handewei',   // 🔴 [2026-10-20 成名战规则] 995 子河汊辽军主帅韩德威
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '辽帅韩德威聚众犯塞直窥府州，某诱其深入子河汊谷道伏兵齐发！折家将满门忠烈在此，壮士，随某策马痛斩辽虏！' },
            { speaker: 'player', text: '愿随折御卿将军共赴子河汊之战，大破辽国敌军！' },
        ],
    },

    // #233 巴西尔二世 (958 ~ 1025) — 公元1014年克雷迪昂战役
    gen_basil_ii: {
        generalId: 'gen_basil_ii',
        battleName: '克雷迪昂战役',
        battleYear: 1014,
        battleType: 'field',
        role: 'attacker',
        targetName: '斯特鲁马河克雷迪昂',
        targetCityId: 'city_anfeibolisi',
        targetLat: 40.82,
        targetLng: 23.85,
        myTroops: 30000,
        enemyFactionId: 'baojialiya',
        enemyFactionName: '保加利亚第一王国',
        enemyGeneralId: 'duonaobaojia_samuel',   // 🔴 [2026-10-20 成名战规则] 1014 克雷迪昂保加利亚沙皇萨穆伊尔（原势力误填埃多尼亚）
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '萨穆埃尔据险筑木石长城阻我罗马军团，某已密遣偏师翻越险峰绕其后背！斩杀者罗马的勇士，夹攻敌寨全歼蛮敌！' },
            { speaker: 'player', text: '愿随巴西尔二世将军共赴克雷迪昂战役，大破保加利亚第一王国敌军！' },
        ],
    },

    // #234 李继迁 (963 ~ 1004) — 公元1002年灵州之战
    xiazhou_lijiqian: {
        generalId: 'xiazhou_lijiqian',
        battleName: '灵州之战',
        battleYear: 1002,
        battleType: 'siege',
        role: 'attacker',
        targetName: '灵州城下',
        targetCityId: 'city_lingzhou',
        targetLat: 37.998341,
        targetLng: 106.295471,
        myTroops: 35000,
        enemyFactionId: 'song',
        enemyFactionName: '北宋',
        enemyGeneralId: 'song_peiji',   // 🔴 [2026-10-20 主人令] 1002 灵州守将裴济（据点武将+剧本敌将，双身份）
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '宋廷欲夺我定难五州断我祖业，党项儿郎绝不为奴！灵州被困数月粮绝水源尽，勇士们，随本统领拔城立西夏千秋业！' },
            { speaker: 'player', text: '愿随李继迁将军共赴灵州之战，大破北宋敌军！' },
        ],
    },

    // #235 勇者波列 (967 ~ 1025) — 公元1015年布达申之战
    gen_boleslaw_brave: {
        generalId: 'gen_boleslaw_brave',
        battleName: '布达申之战',
        battleYear: 1015,
        battleType: 'field',
        role: 'defender',
        targetName: '萨克森布达申',
        targetCityId: 'city_bulage',
        targetLat: 50.07,
        targetLng: 14.43,
        myTroops: 25000,
        enemyFactionId: 'wende',
        enemyFactionName: '神圣罗马帝国',
        enemyGeneralId: 'pelianci_hengli2',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '神圣罗马帝国皇帝引大军三路侵略波兰故土，沼泽深林尽是我们杀敌疆场！皮雅斯特的勇士，随波列斯瓦夫誓死保卫波兰！' },
            { speaker: 'player', text: '愿随勇者波列将军共守布达申之战，大破神圣罗马帝国敌军！' },
        ],
    },

    // #236 马哈茂德 (971 ~ 1030) — 公元1026年索姆纳特神庙之战
    jiazini_mahamaode: {
        generalId: 'jiazini_mahamaode',
        battleName: '索姆纳特神庙之战',
        battleYear: 1026,
        battleType: 'siege',
        role: 'attacker',
        targetName: '古吉拉特索姆纳特',
        targetCityId: 'city_suomunate',
        targetLat: 20.8878,
        targetLng: 70.4014,
        myTroops: 50000,
        enemyFactionId: 'suomunate',
        enemyFactionName: '拉其普特联军',
        enemyGeneralId: 'suomunate_bhima_i',   // 🔴 [2026-10-20 成名战规则] 1026 索姆纳特守方是索兰基王毗摩一世
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '跨越大漠荒原直抵印度洋之滨，异教徒坚城负隅顽抗！伽色尼真主战将无所畏惧，突厥勇士，推云梯随苏丹摧毁坚壁！' },
            { speaker: 'player', text: '愿随马哈茂德将军共赴索姆纳特神庙之战，大破拉其普特联军敌军！' },
        ],
    },

    // #237 雅罗斯拉夫 (978 ~ 1054) — 公元1036年基辅逐佩切涅格人之战（本城就地开战）

    // #238 图格里勒 (990 ~ 1063) — 公元1040年丹丹纳坎战役
    wugu_d_tugelile: {
        generalId: 'wugu_d_tugelile',
        battleName: '丹丹纳坎战役',
        battleYear: 1040,
        battleType: 'field',
        role: 'attacker',
        targetName: '梅尔夫丹丹纳坎',
        targetCityId: 'city_merv',
        targetLat: 37.61641,
        targetLng: 62.234802,
        // 🔴 [2026-10-20 兵力规则] 伽色尼号称五万，按「守方≤攻方×2」把塞尔柱取 2.5 万
        myTroops: 25000,
        enemyFactionId: 'jiazini',
        enemyFactionName: '伽色尼帝国',
        enemyGeneralId: 'jiazini_masud',   // 🔴 [2026-10-20 成名战规则] 1040 丹丹纳坎伽色尼苏丹马斯乌德（原势力误填塞尔柱＝己方）
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '伽色尼战象重铠空有虚名，深陷荒漠早已水源枯竭军心涣散！塞尔柱游牧勇士，随贝伊骑射合围，夺取整个呼罗珊！' },
            { speaker: 'player', text: '愿随图格里勒将军共赴丹丹纳坎战役，大破伽色尼帝国敌军！' },
        ],
    },

    // #239 野利旺荣 (995 ~ 1043) — 公元1041年好水川之战
    yeli_yeliwangrong: {
        generalId: 'yeli_yeliwangrong',
        battleName: '好水川之战',
        battleYear: 1041,
        battleType: 'field',
        role: 'attacker',
        targetName: '隆德好水川',
        targetCityId: 'city_xiaoguan',
        targetLat: 35.657289,
        targetLng: 106.32019,
        myTroops: 45000,
        enemyFactionId: 'song',
        enemyFactionName: '北宋',
        enemyGeneralId: 'song_renfu',   // 🔴 [2026-10-20 成名战规则] 1041 好水川宋军主帅任福
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '宋将任福贪功轻进，已入我夏军设伏口袋绝地！某置泥封鸽笼为号，开笼飞鸟鼓角大噪，壮士，随某引铁鹞子合围聚歼！' },
            { speaker: 'player', text: '愿随野利旺荣将军共赴好水川之战，大破北宋敌军！' },
        ],
    },

    // #240 李元昊 (1003 ~ 1048) — 公元1040年三川口之战
    dangxiang_liyuanhao: {
        generalId: 'dangxiang_liyuanhao',
        battleName: '三川口之战',
        battleYear: 1040,
        battleType: 'field',
        role: 'attacker',
        targetName: '延州三川口',
        targetCityId: 'city_fushi',
        targetLat: 36.59,
        targetLng: 109.48,
        myTroops: 50000,
        enemyFactionId: 'song',
        enemyFactionName: '北宋',
        enemyGeneralId: 'bfe_liuping',   // 🔴 [2026-10-25 按史] 1040 三川口宋军主将＝刘平（狄青时为延州小校）
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '赵宋朝廷斥我僭号视我为寇，今日孤统十万铁鹞子横绝延州！三川口雪谷已围刘平石元孙，党项儿郎随孤生擒宋帅！' },
            { speaker: 'player', text: '愿随李元昊将军共赴三川口之战，大破北宋敌军！' },
        ],
    },

    // #241 狄青 (1008 ~ 1057) — 公元1053年昆仑关之战
    zhai_han_diqing: {
        generalId: 'zhai_han_diqing',
        battleName: '昆仑关之战',
        battleYear: 1053,
        battleType: 'field',
        role: 'attacker',
        targetName: '宾州昆仑关',
        targetCityId: 'city_yongzhou',
        targetLat: 22.81,
        targetLng: 108.31,
        myTroops: 30000,
        enemyFactionId: 'nongzhigao',
        enemyFactionName: '大南国',
        enemyGeneralId: 'nong2_nongzhigao',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '侬智高称帝涂炭岭南，阻据昆仑天险！某以元宵张灯结彩麻痹侬智高，大军冒大雨夜袭天险，壮士，佩铜面随某破关！' },
            { speaker: 'player', text: '愿随狄青将军共赴昆仑关之战，大破大南国军！' },
        ],
    },

    // #242 塔什芬 (1009 ~ 1106) — 公元1086年萨拉卡战役
    gen_tashfin: {
        generalId: 'gen_tashfin',
        battleName: '萨拉卡战役',
        battleYear: 1086,
        battleType: 'field',
        role: 'attacker',
        targetName: '巴达霍斯萨拉卡',
        targetCityId: 'city_seville',
        targetLat: 37.38,
        targetLng: -5.98,
        myTroops: 30000,
        enemyFactionId: 'xigete',
        enemyFactionName: '卡斯蒂利亚王国',
        enemyGeneralId: 'gen_alfonso_vi',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '西班牙国王阿方索气焰嚣张妄图尽逐信众，穆拉比特蒙面军渡海迎战！骆驼鼓声如雷霆，沙漠勇士，随我踏破卡斯蒂利亚阵线！' },
            { speaker: 'player', text: '愿随塔什芬将军共赴萨拉卡战役，大破卡斯蒂利亚王国敌军！' },
        ],
    },

    // #243 阿奴律陀 (1014 ~ 1077) — 公元1057年直通之战
    pagan_anulvtuo: {
        generalId: 'pagan_anulvtuo',
        battleName: '直通之战',
        battleYear: 1057,
        battleType: 'siege',
        role: 'attacker',
        targetName: '直通王城',
        targetCityId: 'city_thaton',
        targetLat: 16.5333,
        targetLng: 97.6333,
        myTroops: 40000,
        enemyFactionId: 'mon',
        enemyFactionName: '直通孟族王国',
        enemyGeneralId: 'mon_monuhe',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '直通蛮王拒交佛陀三藏圣典，无道必失天命！蒲甘象兵与长矛军团顺江而下，勇敢的战士，随大王攻破直通弘扬正法！' },
            { speaker: 'player', text: '愿随阿奴律陀将军共赴直通之战，大破直通孟族王国敌军！' },
        ],
    },

    // #244 吉斯卡尔 (1015 ~ 1085) — 公元1053年奇维塔特战役
    gen_robert_guiscard: {
        generalId: 'gen_robert_guiscard',
        battleName: '奇维塔特战役',
        battleYear: 1053,
        battleType: 'field',
        role: 'attacker',
        targetName: '福贾奇维塔特',
        targetCityId: 'city_meierfei',
        targetLat: 40.99,
        targetLng: 15.65,
        myTroops: 15000,
        enemyFactionId: 'jiaohuangguo',   // 🔴 [2026-10-25 按史] 敌将势力对齐
        enemyFactionName: '教皇教宗国神圣联军',
        enemyGeneralId: 'luoma_diguo_leo_ix',   // 🔴 [2026-10-20 成名战规则] 1053 奇维塔特教皇联军主帅利奥九世
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '教皇与施瓦本德意志重剑士视我们为狡黠盗贼，但诺曼骑士无坚不摧！勇士们，拔出长剑随罗贝尔全线冲锋，生擒教皇！' },
            { speaker: 'player', text: '愿随罗贝尔吉斯卡尔将军共赴奇维塔特战役，大破教皇教宗国神圣联军敌军！' },
        ],
    },

    // #245 侬智高 (1025 ~ 1055) — 公元1052年邕州之战
    nong2_nongzhigao: {
        generalId: 'nong2_nongzhigao',
        battleName: '邕州之战',
        battleYear: 1052,
        battleType: 'siege',
        role: 'attacker',
        targetName: '南宁邕州城',
        targetCityId: 'city_yongzhou',
        targetLat: 22.81,
        targetLng: 108.31,
        myTroops: 20000,
        enemyFactionId: 'song',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '北宋',
        enemyGeneralId: 'bfe_chengong',   // 🔴 [2026-10-25 按史] 1052 守邕州＝知州陈珙（黄师宓是侬智高自己的谋主）
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '交趾欺凌朝廷不顾，广源壮汉岂受任人宰割之辱！某统五千壮汉开山斩木破邕州，壮士，举战旗随我斩知州建大南国！' },
            { speaker: 'player', text: '愿随侬智高将军共赴邕州之战，大破北宋敌军！' },
        ],
    },

    // #246 王韶 (1030 ~ 1081) — 公元1073年踏白城之战
    didao_wangshao: {
        generalId: 'didao_wangshao',
        battleName: '踏白城之战',
        battleYear: 1073,
        battleType: 'field',
        role: 'attacker',
        targetName: '熙州洮河沿岸',
        targetCityId: 'city_lintao',
        targetLat: 35.37,
        targetLng: 103.86,
        myTroops: 30000,
        enemyFactionId: 'tubo',
        enemyFactionName: '吐蕃唃厮啰',
        enemyGeneralId: 'tubo_muzheng',   // 🔴 [2026-10-20 成名战规则] 1073 熙河吐蕃首领木征
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '西夏断右臂正在平定熙河！某献平戎三策引孤军深入断吐蕃归路，番兵虽众皆利在诱降，壮士，拔剑随某收复河湟六州！' },
            { speaker: 'player', text: '愿随王韶将军共赴踏白城之战，大破吐蕃唃厮啰敌军！' },
        ],
    },

    // #247 罗杰 (1031 ~ 1101) — 公元1068年米西尔梅里战役

    // #248 尹瓘 (1040 ~ 1111) — 公元1107年北拓九城逐女真之战（本城就地开战）

    // #249 阿方索六世 (1040 ~ 1109) — 公元1085年托莱多之战（本城就地开战）
    gen_alfonso_vi: {
        generalId: 'gen_alfonso_vi',
        battleName: '托莱多之战',
        battleYear: 1085,
        battleType: 'siege',
        role: 'attacker',
        targetName: '托莱多',
        targetCityId: 'city_toledo',
        targetLat: 39.86,
        targetLng: -4.02,
        myTroops: 30000,
        enemyFactionId: 'womaya',
        enemyFactionName: '托莱多泰法王国',
        enemyGeneralId: 'womaya_yahya',   // 🔴 [2026-10-20 成名战规则] 1085 托莱多泰法王叶海亚
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '塔霍河环抱的托莱多孤立无援，西哥特旧邦光复正在此日！卡斯蒂利亚骑士与勇士，推攻城锤随全西班牙皇帝拿下圣城！' },
            { speaker: 'player', text: '愿随阿方索六世将军共赴托莱多之战，大破托莱多泰法王国敌军！' },
        ],
    },


    // #251 莫诺马赫 (1053 ~ 1125) — 公元1111年萨尔尼察河战役

    // #252 完颜阿骨打 (1068 ~ 1123) — 公元1115年护步达冈之战
    dajin_wanyanaguda: {
        generalId: 'dajin_wanyanaguda',
        battleName: '护步达冈之战',
        battleYear: 1115,
        battleType: 'field',
        role: 'attacker',
        targetName: '护步达冈',
        targetCityId: 'city_boduo',
        targetLat: 45.4265,
        targetLng: 124.6591,
        myTroops: 20000,
        enemyFactionId: 'liao_d',
        enemyFactionName: '辽国',
        enemyGeneralId: 'liao_d_tianzuodi',   // 🔴 [2026-10-20 成名战规则] 1115 护步达冈辽军由天祚帝亲征
        // 🔴 [2026-10-20 兵力规则] 辽军号称十万，按「守方≤攻方×2」取 4 万（女真 2 万）
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '契丹昏君提兵七十万欲灭我女真！女真不满万，满万不可敌，唯死战以求生！壮士，挽硬弓随阿骨打冲锋，一战灭辽！' },
            { speaker: 'player', text: '愿随完颜阿骨打将军共赴护步达冈之战，大破辽国敌军！' },
        ],
    },

    // #253 完颜娄室 (1076 ~ 1130) — 公元1130年富平之战
    yizhou_wanyanloushi: {
        generalId: 'yizhou_wanyanloushi',
        battleName: '富平之战',
        battleYear: 1130,
        battleType: 'field',
        role: 'attacker',
        targetName: '富平',
        targetCityId: 'city_jinsuoguan',
        targetLat: 35.19,
        targetLng: 109.11,
        myTroops: 40000,
        enemyFactionId: 'song',
        enemyFactionName: '南宋',
        enemyGeneralId: 'song_zhangjun',   // 🔴 [2026-10-20 成名战规则] 1130 富平宋军五路主帅张浚
        // 🔴 [2026-10-20 兵力规则] 宋军号称数十万，按「守方≤攻方×2」取 8 万（金军 4 万）
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '宋军聚五路精锐号四十万屯于富平，看似势大实如散沙！某已探得芦苇泊薄弱之虚，壮士，随万胜将军铁骑直贯中军！' },
            { speaker: 'player', text: '愿随完颜娄室将军共赴富平之战，大破南宋敌军！' },
        ],
    },

    // #254 基利杰 (1079 ~ 1107) — 公元1101年梅尔济丰战役
    luomu_jilijie: {
        generalId: 'luomu_jilijie',
        battleName: '梅尔济丰战役',
        battleYear: 1101,
        battleType: 'field',
        role: 'defender',
        targetName: '梅尔济丰',
        targetCityId: 'city_amaxiya',
        targetLat: 40.65,
        targetLng: 35.83,
        myTroops: 25000,
        enemyFactionId: 'lunbadi',
        enemyFactionName: '伦巴第十字军',
        enemyGeneralId: 'bfe_albert_lombard',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '西欧十字军贪残成性，妄图穿过安纳托利亚荒原！我突厥弓骑已断其水泉，勇士，张弓引箭随苏丹伏击，全歼狂徒！' },
            { speaker: 'player', text: '愿随基利杰将军共守梅尔济丰战役，大破伦巴第十字军敌军！' },
        ],
    },

    // #255 完颜宗翰 (1080 ~ 1137) — 公元1126年太原之战
    mohe_wanyanzonghan: {
        generalId: 'mohe_wanyanzonghan',
        battleName: '太原之战',
        battleYear: 1126,
        battleType: 'siege',
        role: 'attacker',
        targetName: '太原',
        targetCityId: 'city_taiyuan',
        targetLat: 37.87,
        targetLng: 112.55,
        myTroops: 50000,
        enemyFactionId: 'song',
        enemyFactionName: '北宋',
        enemyGeneralId: 'song_wangbing',   // 🔴 [2026-10-20 成名战规则] 1126 太原守将王禀
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '太原孤城坚守二百余日，宋人已食尽援绝！某引大金精骑飞石填壕，壮士，扛云梯随粘罕登城，彻底拔除河东门户！' },
            { speaker: 'player', text: '愿随完颜宗翰将军共赴太原之战，大破北宋敌军！' },
        ],
    },

    // #256 桑贾尔 (1085 ~ 1157) — 公元1117年加兹尼之战
    seljuq_sangjiaer: {
        generalId: 'seljuq_sangjiaer',
        battleName: '加兹尼之战',
        battleYear: 1117,
        battleType: 'field',
        role: 'attacker',
        targetName: '加兹尼沙赫拉巴德',
        targetCityId: 'city_jiaseni',
        targetLat: 33.55,
        targetLng: 68.42,
        myTroops: 35000,
        enemyFactionId: 'jiazini',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '加兹尼王朝',
        enemyGeneralId: 'bfe_arslan_shah',   // 🔴 [2026-10-25 按史] 1117 沙赫拉巴德＝伽色尼苏丹阿尔斯兰沙（疏勒阿尔斯兰是另一人）
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '加兹尼不尊塞尔柱苏丹之命，朕亲率铁甲战骑长驱翻越雪山！骁勇的信士，随大苏丹踏平其阵线，重整东方秩序！' },
            { speaker: 'player', text: '愿随桑贾尔将军共赴加兹尼之战，大破加兹尼王朝敌军！' },
        ],
    },

    // #257 耶律大石 (1087 ~ 1143) — 公元1141年卡特万之战
    xiliao_yelvdashi: {
        generalId: 'xiliao_yelvdashi',
        battleName: '卡特万之战',
        battleYear: 1141,
        battleType: 'field',
        role: 'attacker',
        targetName: '撒马尔罕卡特万草原',
        targetCityId: 'city_samaerhan',
        targetLat: 39.6525,
        targetLng: 66.9714,
        myTroops: 30000,
        enemyFactionId: 'seljuq',
        enemyFactionName: '塞尔柱帝国',
        enemyGeneralId: 'seljuq_sangjiaer',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '塞尔柱蛮主倾西方十万甲兵妄图逐我契丹！大石已分铁骑为三路夹击其肋，壮士，拔胡刀随朕陷阵，定鼎中亚西辽！' },
            { speaker: 'player', text: '愿随耶律大石将军共赴卡特万之战，大破塞尔柱帝国敌军！' },
        ],
    },

    // #258 韩世忠 (1089 ~ 1151) — 公元1130年黄天荡之战
    sizhou_hanshizhong: {
        generalId: 'sizhou_hanshizhong',
        battleName: '黄天荡之战',
        battleYear: 1130,
        battleType: 'field',
        role: 'defender',
        targetName: '建康黄天荡',
        targetCityId: 'city_nanjing',
        targetLat: 32.05,
        targetLng: 118.77,
        myTroops: 20000,
        enemyFactionId: 'dajin',
        enemyFactionName: '金朝',
        enemyGeneralId: 'jurchen_wanyanzongbi',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '金兀术搜山检海蹂躏江南，今欲渡江北遁！韩某引巨舰海鳅锁死江口，夫人梁红玉擂鼓助威，壮士，操戈随某困死虏骑！' },
            { speaker: 'player', text: '愿随韩世忠将军共守黄天荡之战，大破金朝敌军！' },
        ],
    },

    // #259 吴玠 (1093 ~ 1139) — 公元1131年和尚原之战
    fengzhou_wujie: {
        generalId: 'fengzhou_wujie',
        battleName: '和尚原之战',
        battleYear: 1131,
        battleType: 'siege',
        role: 'defender',
        targetName: '宝鸡和尚原',
        targetCityId: 'city_dasanguan',
        targetLat: 34.28,
        targetLng: 106.95,
        myTroops: 15000,
        enemyFactionId: 'dajin',
        enemyFactionName: '金朝',
        enemyGeneralId: 'jurchen_wanyanzongbi',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '金贼并力窥蜀，列阵数十里！某扼守险隘结硬阵，选神臂弓硬弩轮番齐射，壮士，随某据险死守，教金兵无一人得还！' },
            { speaker: 'player', text: '愿随吴玠将军共守和尚原之战，大破金朝敌军！' },
        ],
    },

    // #260 刘锜 (1098 ~ 1162) — 公元1140年顺昌之战（本城就地开战）
    yingzhou_d_liuqi: {
        generalId: 'yingzhou_d_liuqi',
        battleName: '顺昌之战',
        battleYear: 1140,
        battleType: 'siege',
        role: 'defender',
        targetName: '顺昌',
        targetCityId: 'city_shunchang',
        targetLat: 32.9,
        targetLng: 115.81,
        myTroops: 20000,
        enemyFactionId: 'dajin',
        enemyFactionName: '金朝',
        enemyGeneralId: 'jurchen_wanyanzongbi',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '兀术引铁浮屠拐子马十万逼城，某已凿沉归舟誓死守顺昌！壮士，执大斧利刃随八字军出城背水截杀，破敌立功！' },
            { speaker: 'player', text: '愿随刘锜将军共守顺昌之战，大破金朝敌军！' },
        ],
    },

    // #261 完颜宗弼 (1098 ~ 1148) — 公元1130年明州之战

    // #262 希尔库赫 (1100 ~ 1146) — 公元1167年巴班之战
    emesene_xierkuhe: {
        generalId: 'emesene_xierkuhe',
        battleName: '巴班之战',
        battleYear: 1167,
        battleType: 'field',
        role: 'defender',
        targetName: '阿斯尤特巴班',
        targetCityId: 'city_wasaite',
        targetLat: 25.7,
        targetLng: 32.64,
        myTroops: 15000,
        enemyFactionId: 'yelusalengwg',
        enemyFactionName: '法兰克十字军',
        enemyGeneralId: 'yelusalengwg_amalric',   // 🔴 [2026-10-20 成名战规则] 1167 巴班之战十字军主帅耶路撒冷王阿马尔里克
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '十字军与开罗逆臣勾结犯境！沙漠峡谷已伏我精骑，勇士，握紧战矛随老夫迎头痛击，全歼狂妄的拉丁骑士！' },
            { speaker: 'player', text: '愿随希尔库赫将军共守巴班之战，大破法兰克十字军敌军！' },
        ],
    },

    // #263 岳飞 (1103 ~ 1142) — 公元1140年郾城之战（本城就地开战）
    yanchuan_d_yuefei: {
        generalId: 'yanchuan_d_yuefei',
        battleName: '郾城之战',
        battleYear: 1140,
        battleType: 'field',
        role: 'defender',
        targetName: '郾城',
        targetCityId: 'city_yancheng2',
        targetLat: 33.58,
        targetLng: 114.03,
        myTroops: 25000,
        enemyFactionId: 'dajin',
        enemyFactionName: '金朝',
        enemyGeneralId: 'jurchen_wanyanzongbi',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '金兀术倾铁浮屠倾巢来袭，此正壮士报国雪耻之日！岳云已统背嵬军迎战，壮士，提麻扎刀随某上阵斫敌马足，直捣黄龙！' },
            { speaker: 'player', text: '愿随岳飞将军共守郾城之战，大破金朝敌军！' },
        ],
    },

    // #264 丹多洛 (1107 ~ 1205) — 公元1204年君士坦丁堡之战
    gen_dandolo: {
        generalId: 'gen_dandolo',
        battleName: '君士坦丁堡之战',
        battleYear: 1204,
        battleType: 'siege',
        role: 'attacker',
        targetName: '君士坦丁堡金角湾',
        targetCityId: 'city_junshitandingbao',
        targetLat: 41.01,
        targetLng: 28.97,
        myTroops: 30000,
        enemyFactionId: 'baizanting',
        enemyFactionName: '拜占庭帝国',
        enemyGeneralId: 'baizanting_alexios_v',   // 🔴 [2026-10-20 成名战规则] 1204 君士坦丁堡拜占庭末帝阿莱克修斯五世
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '拜占庭背弃诺言赖账不付！老夫虽盲，仍乘旗舰直插金角湾飞架登城！威尼斯勇士，随总督攻上城头，夺取罗马帝国财富！' },
            { speaker: 'player', text: '愿随丹多洛将军共赴君士坦丁堡之战，大破拜占庭帝国敌军！' },
        ],
    },

    // #265 阿方索一世 (1109 ~ 1185) — 公元1139年奥里基战役
    gen_afonso_henriques: {
        generalId: 'gen_afonso_henriques',
        battleName: '奥里基战役',
        battleYear: 1139,
        battleType: 'field',
        role: 'attacker',
        targetName: '奥里基草原',
        targetCityId: 'city_lisiben',
        targetLat: 38.72,
        targetLng: -9.13,
        myTroops: 15000,
        enemyFactionId: 'mulabite',
        enemyFactionName: '穆拉比特王朝',
        enemyGeneralId: 'gen_ali_ibn_yusuf',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '五位摩尔王联军企图扼杀葡萄牙，主基督已在梦中许我胜利！勇士们，举起白底蓝十字盾牌随国王冲锋，立国就在今日！' },
            { speaker: 'player', text: '愿随阿方索一世将军共赴奥里基战役，大破穆拉比特王朝敌军！' },
        ],
    },

    // #266 托罗斯二世 (1120 ~ 1169) — 公元1152年奇里乞亚保卫战（本城就地开战）

    // #267 阇耶跋摩 (1125 ~ 1218) — 公元1181年洞里萨湖之战
    chenla_duyebamo: {
        generalId: 'chenla_duyebamo',
        battleName: '洞里萨湖之战',
        battleYear: 1181,
        battleType: 'field',
        role: 'attacker',
        targetName: '洞里萨湖',
        targetCityId: 'city_angkor',
        targetLat: 13.41,
        targetLng: 103.87,
        myTroops: 30000,
        enemyFactionId: 'champa',
        enemyFactionName: '占婆王国',
        enemyGeneralId: 'champa_jaya_indravarman_iv',   // 🔴 [2026-10-20 成名战规则] 1181 洞里萨湖占婆王阇耶因陀罗跋摩四世
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '占婆盗贼乘水路焚毁我吴哥圣城！高棉儿郎岂可受辱，水上战船已列阵如林，勇士，随朕奋勇荡舟，斩尽占婆贼寇！' },
            { speaker: 'player', text: '愿随阇耶跋摩将军共赴洞里萨湖之战，大破占婆王国敌军！' },
        ],
    },

    // #268 阿布萨隆 (1128 ~ 1201) — 公元1184年吕根岛之战
    danmai_abusalong: {
        generalId: 'danmai_abusalong',
        battleName: '吕根岛之战',
        battleYear: 1184,
        battleType: 'field',
        role: 'defender',
        targetName: '吕根岛亚斯蒙德',
        targetCityId: 'city_shiqieqing',
        targetLat: 53.43,
        targetLng: 14.55,
        myTroops: 20000,
        enemyFactionId: 'pomeilaniya',
        enemyFactionName: '波美拉尼亚公国',
        enemyGeneralId: 'bfe_bogislaw_i',   // 🔴 [2026-10-25 按史] 1184 亚斯蒙德＝波美拉尼亚公爵博吉斯拉夫一世（1454 那位是另一人）
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '斯拉夫异教舰队突袭我丹麦海疆！主教一手执十字架一手执长剑，勇士们，迎着波涛扬帆撞击，彻底征服波罗的海！' },
            { speaker: 'player', text: '愿随阿布萨隆将军共守吕根岛之战，大破波美拉尼亚公国敌军！' },
        ],
    },

    // #269 萨拉赫丁 (1138 ~ 1193) — 公元1187年哈丁战役
    ayoubu_salaheding: {
        generalId: 'ayoubu_salaheding',
        battleName: '哈丁战役',
        battleYear: 1187,
        battleType: 'field',
        role: 'attacker',
        targetName: '哈丁角丘陵',
        targetCityId: 'city_damasikusi',
        targetLat: 32.53,
        targetLng: 35.44,
        myTroops: 35000,
        enemyFactionId: 'saipulusi',
        enemyFactionName: '耶路撒冷王国',
        enemyGeneralId: 'saipulusi_juyi',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '十字军军团干渴难耐，已深陷哈丁角无水绝境！烈火与浓烟顺风而起，安拉的勇士，拔出马刀随苏丹冲锋，光复耶路撒冷！' },
            { speaker: 'player', text: '愿随萨拉丁将军共赴哈丁战役，大破耶路撒冷王国敌军！' },
        ],
    },

    // #270 吉亚斯丁 (1140 ~ 1203) — 公元1175年拉合尔之战
    huluo_jiyasiding: {
        generalId: 'huluo_jiyasiding',
        battleName: '拉合尔之战',
        battleYear: 1175,
        battleType: 'siege',
        role: 'attacker',
        targetName: '赫拉特城',
        targetCityId: 'city_helate_city',
        targetLat: 34.34,
        targetLng: 62.19,
        myTroops: 35000,
        enemyFactionId: 'jiazini',
        enemyFactionName: '加兹尼残部',
        enemyGeneralId: 'jiazini_khusrau_malik',   // 🔴 [2026-10-20 成名战规则] 1175 伽色尼末王呼斯劳
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '伽色尼末造残民荼毒呼罗珊，古尔王朝当立天下！战象开道长矛森严，勇士，随吉亚斯丁大王攻克赫拉特，威加东方！' },
            { speaker: 'player', text: '愿随吉亚斯丁将军共赴拉合尔之战，大破加兹尼残部敌军！' },
        ],
    },

    // #271 源赖朝 (1147 ~ 1199) — 公元1180年富士川之战
    gen_minamoto_yoritomo: {
        generalId: 'gen_minamoto_yoritomo',
        battleName: '富士川之战',
        battleYear: 1180,
        battleType: 'field',
        role: 'defender',
        targetName: '骏河富士川畔',
        targetCityId: 'city_junfucheng',
        targetLat: 34.97,
        targetLng: 138.38,
        myTroops: 25000,
        enemyFactionId: 'heishi',
        enemyFactionName: '平家',
        enemyGeneralId: 'taira_pingzongsheng',   // 🔴 [2026-10-20 成名战规则] 1180 富士川平家总帅平宗盛
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '平家暴虐荼毒朝纲，关东武士义旗已立！富士川群鸟齐飞惊破平氏胆魂，壮士，策马挽雕弓随某追杀，开创武家幕府！' },
            { speaker: 'player', text: '愿随源赖朝将军共守富士川之战，大破平家敌军！' },
        ],
    },

    // #272 居伊 (1150 ~ 1194) — 公元1192年塞浦路斯之战（本城就地开战）
    saipulusi_juyi: {
        generalId: 'saipulusi_juyi',
        battleName: '塞浦路斯之战',
        battleYear: 1192,
        battleType: 'siege',
        role: 'attacker',
        targetName: '尼科西亚',
        targetCityId: 'city_nikexiya',
        targetLat: 35.18,
        targetLng: 33.38,
        myTroops: 15000,
        enemyFactionId: 'baizanting',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '塞浦路斯',
        enemyGeneralId: 'bfe_isaac_komnenos',
        enemyTroops: 18000,
        introLines: [
            { speaker: 'general', text: '耶路撒冷虽陷，天主已赐我塞浦路斯乐土！圣殿骑士已拔剑前趋，英勇的骑士，随居伊国王登岸破城，再铸十字军王国！' },
            { speaker: 'player', text: '愿随居伊将军共赴塞浦路斯之战，大破塞浦路斯割据军敌军！' },
        ],
    },

    // #273 阿森一世 (1155 ~ 1196) — 公元1190年特里亚夫纳战役
    baojialiya_aseni: {
        generalId: 'baojialiya_aseni',
        battleName: '特里亚夫纳战役',
        battleYear: 1190,
        battleType: 'field',
        role: 'attacker',
        targetName: '巴尔干山脉特里亚夫纳',
        targetCityId: 'city_teernuowo',
        targetLat: 43.08,
        targetLng: 25.65,
        myTroops: 20000,
        enemyFactionId: 'baizanting',
        enemyFactionName: '拜占庭帝国',
        enemyGeneralId: 'baizanting_isaac_ii',   // 🔴 [2026-10-20 成名战规则] 1190 特里亚夫纳拜占庭皇帝伊萨克二世
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '拜占庭皇帝狼狈撤军，正被困于巴尔干狭隘山道！滚石檑木封死前后，保加利亚勇士，随沙皇全线击杀，光复帝国！' },
            { speaker: 'player', text: '愿随阿森一世将军共赴特里亚夫纳战役，大破拜占庭帝国敌军！' },
        ],
    },

    // #274 源义经 (1159 ~ 1189) — 公元1185年坛之浦之战
    fujiwara_yuanyijing: {
        generalId: 'fujiwara_yuanyijing',
        battleName: '坛之浦之战',
        battleYear: 1185,
        battleType: 'field',
        role: 'attacker',
        targetName: '下关坛之浦海域',
        targetCityId: 'city_chijianguan',
        targetLat: 33.95,
        targetLng: 130.93,
        myTroops: 20000,
        enemyFactionId: 'heishi',
        enemyFactionName: '平家',
        enemyGeneralId: 'taira_pingzhisheng',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '平家末路负隅顽抗，八艘飞跃斩将夺旗就在今朝！水流转急顺风逆袭，壮士，引白羽箭随义经疾驰登舟，全歼平氏！' },
            { speaker: 'player', text: '愿随源义经将军共赴坛之浦之战，大破平家敌军！' },
        ],
    },

    // #275 雅库布 (1160 ~ 1199) — 公元1195年阿拉科斯战役
    muwaxide_yakubu: {
        generalId: 'muwaxide_yakubu',
        battleName: '阿拉科斯战役',
        battleYear: 1195,
        battleType: 'field',
        role: 'attacker',
        targetName: '阿尔马格罗阿拉科斯',
        targetCityId: 'city_toledo',
        targetLat: 39.86,
        targetLng: -4.02,
        myTroops: 40000,
        enemyFactionId: 'kasidiliya',
        enemyFactionName: '卡斯蒂利亚王国',
        enemyGeneralId: 'kasidiliya_afangsuoba',   // 🔴 [2026-10-20 成名战规则] 1195 阿拉科斯卡斯蒂利亚王阿方索八世
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '卡斯蒂利亚傲慢蛮主妄图荡尽安达卢西亚！圣战号角吹响，柏柏尔与安达卢西亚联军进发，勇士随哈里发彻底粉碎敌阵！' },
            { speaker: 'player', text: '愿随雅库布将军共赴阿拉科斯战役，大破卡斯蒂利亚王国敌军！' },
        ],
    },

    // #276 鲍德温四世 (1161 ~ 1185) — 公元1177年蒙吉萨战役
    gen_baodewen_iv: {
        generalId: 'gen_baodewen_iv',
        battleName: '蒙吉萨战役',
        battleYear: 1177,
        battleType: 'field',
        role: 'attacker',
        targetName: '拉姆拉蒙吉萨',
        targetCityId: 'city_yelusaleng',
        targetLat: 31.77,
        targetLng: 35.21,
        myTroops: 10000,
        enemyFactionId: 'ayoubu',
        enemyFactionName: '阿尤布王朝',
        enemyGeneralId: 'ayoubu_salaheding',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '萨拉丁狂兵三万深入抢掠军容散乱！朕虽麻风残躯，真十字架下圣骑永存！勇士，随少年国王五百骑冲锋，斩尽敌锋！' },
            { speaker: 'player', text: '愿随鲍德温四世将军共赴蒙吉萨战役，大破阿尤布王朝敌军！' },
        ],
    },

    // #277 成吉思汗 (1162 ~ 1227) — 公元1211年野狐岭之战
    menggu_d_chengjisihan: {
        generalId: 'menggu_d_chengjisihan',
        battleName: '野狐岭之战',
        battleYear: 1211,
        battleType: 'field',
        role: 'attacker',
        targetName: '张家口野狐岭',
        targetCityId: 'city_xinghe',
        targetLat: 41.15,
        targetLng: 114.7,
        myTroops: 30000,
        enemyFactionId: 'dajin',
        enemyFactionName: '金朝',
        enemyGeneralId: 'dajin_wanyanchengyu',   // 🔴 [2026-10-20 成名战规则] 1211 野狐岭金军主帅完颜承裕
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '金国压迫残害我蒙古诸部百年！长生天护佑苍狼白鹿的子孙，大军扼死山隘，草原勇士，随大汗万骑踏平金国主力！' },
            { speaker: 'player', text: '愿随成吉思汗将军共赴野狐岭之战，大破金朝敌军！' },
        ],
    },

    // #278 孟宗政 (1163 ~ 1223) — 公元1217年襄阳击退金军保卫战


    // #280 摩诃末 (1169 ~ 1220) — 公元1212年撒马尔罕之战
    huarazim_mohemo: {
        generalId: 'huarazim_mohemo',
        battleName: '撒马尔罕之战',
        battleYear: 1212,
        battleType: 'siege',
        role: 'attacker',
        targetName: '撒马尔罕城外',
        targetCityId: 'city_samaerhan',
        targetLat: 39.6525,
        targetLng: 66.9714,
        myTroops: 50000,
        enemyFactionId: 'xiliao',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '西喀喇汗国',
        enemyGeneralId: 'xiliao_uthman',   // 🔴 [2026-10-20 成名战规则] 1212 撒马尔罕西喀喇汗末王奥斯曼
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '西喀喇汗国残党悖逆天理拒降我沙阿！河中沃野尽当归入花剌子模疆域，突厥与伊朗勇士，随朕引铁甲骑兵一战拔城！' },
            { speaker: 'player', text: '愿随摩诃末将军共赴撒马尔罕之战，大破西喀喇汗国敌军！' },
        ],
    },

    // #281 木华黎 (1170 ~ 1223) — 公元1218年破金拔太原之战

    // #282 卡洛扬 (1170 ~ 1207) — 公元1205年阿德里安堡战役
    jialiboli_kaluoyang: {
        generalId: 'jialiboli_kaluoyang',
        battleName: '阿德里安堡战役',
        battleYear: 1205,
        battleType: 'field',
        role: 'attacker',
        targetName: '阿德里安堡近郊',
        // 🔴 [2026-10-24 主人令「锚点错了攻城战照样打错地方」] 原 targetCityId=city_deli（德里）、坐标也抄成德里；
        //    阿德里安堡＝埃迪尔内（city_aidiernei，41.6781,26.5591），按史改锚。
        targetCityId: 'city_aidiernei',
        targetLat: 41.6781,
        targetLng: 26.5591,
        myTroops: 30000,
        enemyFactionId: 'falanji',
        enemyFactionName: '拉丁帝国',
        enemyGeneralId: 'falanji_baodewen',   // 🔴 [2026-10-20 成名战规则] 1205 阿德里安堡拉丁帝国皇帝鲍德温一世
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '拉丁十字军骄横跋扈，妄图把保加利亚变为领地！库曼骑兵已诱敌深入，保加利亚勇士，随罗马杀手设伏生擒其皇帝！' },
            { speaker: 'player', text: '愿随卡洛扬将军共赴阿德里安堡战役，大破拉丁帝国敌军！' },
        ],
    },

    // #283 纳西尔丁 (1175 ~ 1228) — 公元1221年木尔坦之战（本城就地开战）
    muertan_naxierding: {
        generalId: 'muertan_naxierding',
        battleName: '木尔坦之战',
        battleYear: 1221,
        battleType: 'siege',
        role: 'defender',
        targetName: '乌奇',
        targetCityId: 'city_wuqi',
        targetLat: 29.24,
        targetLng: 71.05,
        myTroops: 25000,
        enemyFactionId: 'menggu_d',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '察合台蒙古军',
        enemyGeneralId: 'bfe_chagatai',   // 🔴 [2026-10-25 按史] 1221 攻乌奇＝察合台、窝阔台所部（帖木儿灭里是花剌子模守将）
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '蒙古蛮骑席卷花剌子模兵锋指印度！木尔坦坚垒粮饷充盈，真主庇佑信徒，勇士，随老夫据险开弓，教鞑靼铁骑折戟！' },
            { speaker: 'player', text: '愿随纳西尔丁将军共守木尔坦之战，大破察合台蒙古军敌军！' },
        ],
    },


    // #285 阿历克塞 (1182 ~ 1222) — 公元1204年特拉布宗立国会战（本城就地开战）


    // #287 松迪亚塔 (1190 ~ 1255) — 公元1235年基里纳战役
    gen_sundjata: {
        generalId: 'gen_sundjata',
        battleName: '基里纳战役',
        battleYear: 1235,
        battleType: 'field',
        role: 'attacker',
        targetName: '尼日尔河基里纳',
        targetCityId: 'city_kumubi',
        targetLat: 15.77,
        targetLng: -7.97,
        myTroops: 20000,
        enemyFactionId: 'suosuo',
        enemyFactionName: '苏索王国',
        enemyGeneralId: 'gen_sumanguru',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '巫王苏曼古鲁残暴虐杀我曼丁哥族人！神圣雄狮已经苏醒，手执神木强弓，非洲的勇士们，随松迪亚塔扫除暴君立马里！' },
            { speaker: 'player', text: '愿随松迪亚塔将军共赴基里纳战役，大破苏索王国敌军！' },
        ],
    },

    // #288 拖雷 (1191 ~ 1232) — 公元1232年三峰山之战
    borjigin_tuolei: {
        generalId: 'borjigin_tuolei',
        battleName: '三峰山之战',
        battleYear: 1232,
        battleType: 'field',
        role: 'attacker',
        targetName: '禹州三峰山',
        targetCityId: 'city_xinzheng',
        targetLat: 34.4,
        targetLng: 113.74,
        myTroops: 40000,
        enemyFactionId: 'dajin',
        enemyFactionName: '金朝',
        enemyGeneralId: 'dajin_wanyanheda',   // 🔴 [2026-10-20 成名战规则] 1232 金军三峰山主帅完颜合达
        // 🔴 [2026-10-20 兵力规则] 金军号称十五万，按「守方≤攻方×2」取 8 万（拖雷 4 万）
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '金军精锐尽聚三峰山，大雪暴降天助我也！敌疲冻馁已如待宰羔羊，草原勇士，随某四面击鼓掩杀，斩尽金朝最后骨血！' },
            { speaker: 'player', text: '愿随拖雷将军共赴三峰山之战，大破金朝敌军！' },
        ],
    },

    // #289 完颜陈和尚 (1192 ~ 1232) — 公元1228年大昌原之战

    // #290 腓特烈二世 (1194 ~ 1250) — 公元1237年科尔特努瓦战役
    gen_frederic_ii: {
        generalId: 'gen_frederic_ii',
        battleName: '科尔特努瓦战役',
        battleYear: 1237,
        battleType: 'field',
        role: 'attacker',
        targetName: '贝加莫科尔特努瓦',
        targetCityId: 'city_milan',
        targetLat: 45.46,
        targetLng: 9.19,
        myTroops: 25000,
        enemyFactionId: 'lunbadi',
        enemyFactionName: '伦巴第同盟',
        enemyGeneralId: 'gen_pietro_tiepolo',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '伦巴第同盟诸城邦藐视神圣罗马皇权！撒拉逊弓箭手与德意志重骑兵结阵，勇士，随世界奇人皇帝冲杀，夺取卡罗乔战车！' },
            { speaker: 'player', text: '愿随腓特烈二世将军共赴科尔特努瓦战役，大破伦巴第同盟敌军！' },
        ],
    },

    // #291 孟珙 (1195 ~ 1246) — 公元1239年襄阳之战
    zaoyang_d_menggong: {
        generalId: 'zaoyang_d_menggong',
        battleName: '襄阳之战',
        battleYear: 1239,
        battleType: 'siege',
        role: 'attacker',
        targetName: '襄阳城下',
        targetCityId: 'city_xiangyang',
        targetLat: 32.01,
        targetLng: 112.12,
        myTroops: 35000,
        enemyFactionId: 'menggu_d',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '蒙古仆从军',
        enemyGeneralId: 'bfe_youxian',   // 🔴 [2026-10-25 按史] 1239 襄阳守将＝游显（吕文焕 1225 年生，此年 14 岁）
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '襄汉乃东南门户，重镇陷敌天下痛心！孟某调集精锐水陆并进，断其浮桥焚其粮草，壮士，持长槊随某夺回襄阳重镇！' },
            { speaker: 'player', text: '愿随孟珙将军共赴襄阳之战，大破蒙古仆从军敌军！' },
        ],
    },

    // #292 王坚 (1198 ~ 1264) — 公元1259年钓鱼城之战（本城就地开战）
    hezhou_wangjian: {
        generalId: 'hezhou_wangjian',
        battleName: '钓鱼城之战',
        battleYear: 1259,
        battleType: 'siege',
        role: 'defender',
        targetName: '钓鱼城',
        targetCityId: 'city_diaoyucheng',
        targetLat: 30.04,
        targetLng: 106.3,
        myTroops: 20000,
        enemyFactionId: 'menggu_d',
        enemyFactionName: '蒙古帝国',
        enemyGeneralId: 'menggu_d_mongke',   // 🔴 [2026-10-20 成名战规则] 1259 钓鱼城蒙古大汗蒙哥
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '鞑靼大汗倾举国倾巢来攻我钓鱼险峰！蜀中男儿据天险绝壁，飞石巨炮俱备，壮士，随某誓死坚守，教大汗饮恨绝壁！' },
            { speaker: 'player', text: '愿随王坚将军共守钓鱼城之战，大破蒙古帝国敌军！' },
        ],
    },

    // #293 费尔南多 (1201 ~ 1252) — 公元1248年塞维利亚之战战（本城就地开战）

    // #294 拔都 (1207 ~ 1256) — 公元1241年赛约河之战
    gen_batu: {
        generalId: 'gen_batu',
        battleName: '赛约河之战',
        battleYear: 1241,
        battleType: 'field',
        role: 'attacker',
        targetName: '穆希赛约河畔',
        targetCityId: 'city_saigede',
        targetLat: 46.25,
        targetLng: 20.15,
        myTroops: 50000,
        enemyFactionId: 'mazhaer',
        enemyFactionName: '匈牙利王国',
        enemyGeneralId: 'mazhaer_bela_iv',   // 🔴 [2026-10-20 成名战规则] 1241 赛约河匈牙利王贝拉四世
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '匈牙利重骑兵据桥结车阵自固，速不台已乘夜潜渡下流截其归路！金帐勇士，随拔都汗万骑破桥夹击，席卷多瑙河！' },
            { speaker: 'player', text: '愿随拔都将军共赴赛约河之战，大破匈牙利王国敌军！' },
        ],
    },

    // #295 海梅 (1208 ~ 1276) — 公元1229年马略卡之战
    gen_james_i_aragon: {
        generalId: 'gen_james_i_aragon',
        battleName: '马略卡之战',
        battleYear: 1229,
        battleType: 'siege',
        role: 'attacker',
        targetName: '帕尔马马略卡城',
        targetCityId: 'city_barcelona',
        targetLat: 41.38,
        targetLng: 2.17,
        myTroops: 20000,
        enemyFactionId: 'muwaxide',
        enemyFactionName: '摩尔人总督',
        enemyGeneralId: 'gen_abu_yahya',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '摩尔海盗袭我加泰罗尼亚海港！阿拉贡与巴塞罗那舰队已封锁全岛，英勇的骑士，踏平沙滩随海梅一世攻克城寨立功！' },
            { speaker: 'player', text: '愿随海梅将军共赴马略卡之战，大破摩尔人总督敌军！' },
        ],
    },

    // #296 忽必烈 (1215 ~ 1294) — 公元1273年襄樊之战
    yuan_d_hubilie: {
        generalId: 'yuan_d_hubilie',
        battleName: '襄樊之战',
        battleYear: 1273,
        battleType: 'siege',
        role: 'attacker',
        targetName: '襄樊城下',
        targetCityId: 'city_xiangyang',
        targetLat: 32.01,
        targetLng: 112.12,
        myTroops: 50000,
        enemyFactionId: 'song',
        enemyFactionName: '南宋',
        enemyGeneralId: 'xiangzhou_lvwenhuan',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '围困樊城六载，回回巨炮已至，飞石如雷声震天地！破襄樊则江南门户洞开，各族将士与壮士，随世祖破城混一海内！' },
            { speaker: 'player', text: '愿随忽必烈将军共赴襄樊之战，大破南宋敌军！' },
        ],
    },

    // #297 旭烈兀 (1218 ~ 1265) — 公元1258年巴格达之战
    asaibaijiang_xuliewu: {
        generalId: 'asaibaijiang_xuliewu',
        battleName: '巴格达之战',
        battleYear: 1258,
        battleType: 'siege',
        role: 'attacker',
        targetName: '巴格达城下',
        targetCityId: 'city_bageda',
        targetLat: 33.33,
        targetLng: 44.37,
        myTroops: 50000,
        enemyFactionId: 'abasi',
        enemyFactionName: '阿拔斯哈里发国',
        enemyGeneralId: 'abasi_mustasim',   // 🔴 [2026-10-20 成名战规则] 1258 阿拔斯末代哈里发穆斯塔西姆
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '阿拔斯哈里发拒不纳贡妄图抗拒天兵！底格里斯河已被我筑坝断流，蒙古与亚美尼亚甲士，随伊儿汗发炮登城，荡平古都！' },
            { speaker: 'player', text: '愿随旭烈兀将军共赴巴格达之战，大破阿拔斯哈里发国敌军！' },
        ],
    },

    // #298 涅夫斯基 (1221 ~ 1263) — 公元1242年楚德湖冰上战役

    // #299 拜巴尔斯 (1223 ~ 1277) — 公元1260年阿音贾鲁特战役
    mamuluke_baibaisi: {
        generalId: 'mamuluke_baibaisi',
        battleName: '阿音贾鲁特战役',
        battleYear: 1260,
        battleType: 'field',
        role: 'attacker',
        targetName: '阿音贾鲁特泉水山谷',
        targetCityId: 'city_damasikusi',
        targetLat: 32.53,
        targetLng: 35.44,
        myTroops: 25000,
        enemyFactionId: 'yilihanguo_d',   // 🔴 [2026-10-28 按史] 1260 阿音贾鲁特敌军是旭烈兀伊利汗国（原挂萨法维；萨法维 1501 年才建国，晚了 240 年，错）
        enemyFactionName: '伊利汗国',
        enemyGeneralId: 'yilihanguo_kitbuqa',   // 🔴 [2026-10-20 成名战规则] 1260 阿音贾鲁特伊儿汗国先锋怯的不花
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '蒙古蛮骑席卷天下未曾一败，今入狭谷伏击圈！马穆鲁克铁骑誓死保卫伊斯兰世界，勇士，拔出大马士革钢刀随我全歼怯的不花！' },
            { speaker: 'player', text: '愿随拜巴尔斯将军共赴阿音贾鲁特战役，大破伊儿汗国蒙古军敌军！' },
        ],
    },

    // #300 卡洛 (1226 ~ 1285) — 公元1266年贝内文托战役
    gen_charles_i_naples: {
        generalId: 'gen_charles_i_naples',
        battleName: '贝内文托战役',
        battleYear: 1266,
        battleType: 'field',
        role: 'attacker',
        targetName: '贝加莫贝内文托',
        targetCityId: 'city_naples',
        targetLat: 40.85,
        targetLng: 14.26,
        myTroops: 25000,
        enemyFactionId: 'xixiliwangguo',
        enemyFactionName: '霍亨斯陶芬西西里',
        enemyGeneralId: 'hre_manfred',   // 🔴 [2026-10-20 成名战规则] 1266 贝内文托霍亨斯陶芬曼弗雷德
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '霍亨斯陶芬异端败落在此一役，教皇圣旗指引法兰西骑士！勇士们，挺平长枪冲垮其撒拉逊弓箭手，随安茹伯爵夺取王冠！' },
            { speaker: 'player', text: '愿随卡洛将军共赴贝内文托战役，大破霍亨斯陶芬西西里敌军！' },
        ],
    },

    // #301 陈国峻 (1228 ~ 1300) — 公元1288年白藤江之战
    dayue_chenguojun: {
        generalId: 'dayue_chenguojun',
        battleName: '白藤江之战',
        battleYear: 1288,
        battleType: 'field',
        role: 'attacker',
        targetName: '白藤江入海口',
        targetCityId: 'city_shenglong',
        targetLat: 21.03,
        targetLng: 105.85,
        myTroops: 40000,
        enemyFactionId: 'yuan_d',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '大元',
        enemyGeneralId: 'bfe_umar',   // 🔴 [2026-10-25 按史] 1288 白藤江元水军＝乌马儿（忽必烈在大都）
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '元寇三度犯我南陲！江底已密布裹铁巨桩，待潮退敌船倾覆，大越子民与壮士，随兴道王鸣金合围，生擒元将扬威白藤江！' },
            { speaker: 'player', text: '愿随陈国峻将军共赴白藤江之战，大破大元敌军！' },
        ],
    },

    // #302 伯颜 (1236 ~ 1295) — 公元1275年焦山之战
    merkit_boyan: {
        generalId: 'merkit_boyan',
        battleName: '焦山之战',
        battleYear: 1275,
        battleType: 'field',
        role: 'attacker',
        targetName: '镇江焦山大江',
        targetCityId: 'city_yangzhou',
        targetLat: 32.393,
        targetLng: 119.42,
        myTroops: 50000,
        enemyFactionId: 'song',
        enemyFactionName: '南宋',
        enemyGeneralId: 'luoping_zhangshijie',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '宋师万艘战船碇泊焦山结成长蛇大阵！某命左右两翼发火箭强弩顺风夹攻，烈火蔽天！壮士，随右丞相艨艟陷阵，一荡江南！' },
            { speaker: 'player', text: '愿随伯颜将军共赴焦山之战，大破南宋敌军！' },
        ],
    },

    // #303 兰甘亨 (1237 ~ 1298) — 公元1292年夺取洛坤会战

    // #304 孟莱 (1238 ~ 1317) — 公元1292年攻克哈利奔猜之战

    // #305 长腿爱德华 (1239 ~ 1307) — 公元1298年福尔柯克战役
    gen_edward_longshanks: {
        generalId: 'gen_edward_longshanks',
        battleName: '福尔柯克战役',
        battleYear: 1298,
        battleType: 'field',
        role: 'attacker',
        targetName: '福尔柯克',
        targetCityId: 'city_aidingbao',
        targetLat: 55.95,
        targetLng: -3.18,
        myTroops: 30000,
        enemyFactionId: 'scotland',
        enemyFactionName: '苏格兰王国',
        enemyGeneralId: 'gen_william_wallace',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '苏格兰人排成长矛刺猬圆阵死守！威尔士长弓手放箭如飞蝗射乱敌阵，英格兰骑士与勇士，随国王端枪冲锋踏碎苏格兰军！' },
            { speaker: 'player', text: '愿随长腿爱德华将军共赴福尔柯克战役，大破苏格兰王国敌军！' },
        ],
    },

    // #306 伊瓦伊洛 (1240 ~ 1281) — 公元1278年德鲁斯塔尔之战（本城就地开战）
    gen_ivaylo: {
        generalId: 'gen_ivaylo',
        battleName: '德鲁斯塔尔之战',
        battleYear: 1278,
        battleType: 'siege',
        role: 'defender',
        targetName: '德鲁斯塔尔',
        targetCityId: 'city_delusitaer',
        targetLat: 44.12,
        targetLng: 27.26,
        myTroops: 20000,
        enemyFactionId: 'jinzhang',
        enemyFactionName: '金帐汗国',
        enemyGeneralId: 'jinzhang_nogai',   // 🔴 [2026-10-20 成名战规则] 1278 德鲁斯塔尔金帐那海
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '鞑靼鞑靼铁骑焚毁村庄，贵族懦夫闭门不出！我养猪人揭竿而起为保家园，勇士们，握紧铁叉战斧随沙皇出城，诛杀鞑靼蛮骑！' },
            { speaker: 'player', text: '愿随伊瓦伊洛将军共守德鲁斯塔尔之战，大破金帐汗国敌军！' },
        ],
    },

    // #307 约翰一世 (1252 ~ 1294) — 公元1288年沃林根战役
    bulabante_yuehanyishi: {
        generalId: 'bulabante_yuehanyishi',
        battleName: '沃林根战役',
        battleYear: 1288,
        battleType: 'field',
        role: 'attacker',
        targetName: '科隆沃林根草地',
        targetCityId: 'city_kelong',
        targetLat: 50.93,
        targetLng: 6.95,
        myTroops: 15000,
        enemyFactionId: 'koln',
        enemyFactionName: '科隆大主教区',
        // 🔴 [2026-10-28 按史] 敌方势力＝科隆大主教区（原挂「法兰克」错：1288 出兵者是科隆大主教西格弗里德所部）；势力色随新势力
        enemyGeneralId: 'hre_siegfried',   // 🔴 [2026-10-20 成名战规则] 1288 沃林根科隆大主教西格弗里德
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '科隆主教与卢森堡骑兵妄夺林堡公国！正义在我手中，布拉班特骑士们，拉紧马缰平举长矛，随公爵冲垮封建联军！' },
            { speaker: 'player', text: '愿随约翰一世将军共赴沃林根战役，大破科隆大主教区敌军！' },
        ],
    },

    // #308 奥斯曼一世 (1258 ~ 1326) — 公元1302年巴菲乌斯战役

    // #309 阿拉乌丁 (1266 ~ 1316) — 公元1303年奇托尔攻城战

    // #310 华莱士 (1270 ~ 1305) — 公元1297年斯特灵桥之战
    gen_william_wallace: {
        generalId: 'gen_william_wallace',
        battleName: '斯特灵桥之战',
        battleYear: 1297,
        battleType: 'field',
        role: 'attacker',
        targetName: '斯特灵桥畔',
        targetCityId: 'city_aidingbao',
        targetLat: 55.95,
        targetLng: -3.18,
        myTroops: 15000,
        enemyFactionId: 'yinggelan',
        enemyFactionName: '英格兰王国',
        enemyGeneralId: 'yinggelan_warenne',   // 🔴 [2026-10-20 成名战规则] 1297 斯特灵桥英格兰统帅瓦伦
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '英格兰骑士半数过桥乱不成队，木桥狭窄退路尽断！为了苏格兰的自由，高地勇士们，端平巨矛随我自山顶冲锋，斩尽侵略者！' },
            { speaker: 'player', text: '愿随威廉华莱士将军共赴斯特灵桥之战，大破英格兰王国敌军！' },
        ],
    },

    // #311 巴萨拉布 (1270 ~ 1352) — 公元1330年波萨达战役
    gen_basarab_i: {
        generalId: 'gen_basarab_i',
        battleName: '波萨达战役',
        battleYear: 1330,
        battleType: 'field',
        role: 'defender',
        targetName: '波萨达狭谷',
        targetCityId: 'city_agesi',
        targetLat: 45.353,
        targetLng: 24.635,
        myTroops: 15000,
        enemyFactionId: 'mazhaer',
        enemyFactionName: '匈牙利王国',
        enemyGeneralId: 'mazhaer_charles_i',   // 🔴 [2026-10-20 成名战规则] 1330 波萨达匈牙利王查理一世
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '匈牙利国王恃强深入瓦拉几亚峡谷，四周悬崖插翅难逃！伏兵居高临下滚石如雨，勇士们，拔出战刀随大公彻底覆灭敌骑！' },
            { speaker: 'player', text: '愿随巴萨拉布将军共守波萨达战役，大破匈牙利王国敌军！' },
        ],
    },

    // #312 格迪米纳斯 (1275 ~ 1341) — 公元1321年伊尔平河战役

    // #313 燕帖木儿 (1285 ~ 1333) — 公元1328年两都之战
    chahar_yantiemuer: {
        generalId: 'chahar_yantiemuer',
        battleName: '两都之战',
        battleYear: 1328,
        battleType: 'field',
        role: 'attacker',
        targetName: '通州北湖',
        targetCityId: 'city_beijing',
        targetLat: 39.9,
        targetLng: 116.41,
        myTroops: 30000,
        enemyFactionId: 'yuan_d',
        enemyFactionName: '上都倒剌沙军',
        enemyGeneralId: 'yuan_d_daulashah',   // 🔴 [2026-10-20 成名战规则] 1328 两都之战元上都派倒剌沙
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '上都叛臣擅立幼主乱天下大统！某佩剑掌禁军奉迎文宗，壮士，随太平王铁骑横冲通州，击溃逆藩匡正社稷！' },
            { speaker: 'player', text: '愿随燕帖木儿将军共赴两都之战，大破上都倒剌沙军敌军！' },
        ],
    },

    // #314 楠木正成 (1294 ~ 1336) — 公元1333年千早城保卫战（本城就地开战）

    // #315 阿尔吉尔达斯 (1296 ~ 1377) — 公元1362年蓝水河战役
    gen_algirdas: {
        generalId: 'gen_algirdas',
        battleName: '蓝水河战役',
        battleYear: 1362,
        battleType: 'field',
        role: 'attacker',
        targetName: '第聂伯河蓝水支流',
        targetCityId: 'city_cherkasy',
        targetLat: 49.44,
        targetLng: 32.06,
        myTroops: 30000,
        enemyFactionId: 'jinzhang',
        enemyFactionName: '金帐汗国',
        enemyGeneralId: 'gen_kutlug_buga',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '鞑靼鞑靼三位秃儿汗企图阻我收复乌克兰土地！金帐游牧弓骑已乱，立陶宛勇士，随大公重装骑兵冲破敌阵，饮马黑海！' },
            { speaker: 'player', text: '愿随阿尔吉尔达斯将军共赴蓝水河战役，大破金帐汗国敌军！' },
        ],
    },

    // #316 科斯图提斯 (1297 ~ 1382) — 公元1370年鲁道战役
    gen_kestutis: {
        generalId: 'gen_kestutis',
        battleName: '鲁道战役',
        battleYear: 1370,
        battleType: 'field',
        role: 'attacker',
        targetName: '柯尼斯堡鲁道村',
        targetCityId: 'city_kenisibao',
        targetLat: 54.71,
        targetLng: 20.51,
        myTroops: 25000,
        enemyFactionId: 'tiaodun_qishi',
        enemyFactionName: '条顿骑士团',
        enemyGeneralId: 'bfe_kniprode',   // 🔴 [2026-10-25 按史] 1370 鲁道条顿主帅＝大团长克尼普罗德（容金根 1360 才生）
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '条顿十字魔军年年犯我边境屠戮祭司！今日风雪连天短兵相接，异教高贵好男儿，举起阔剑随大公血战冰原，斩杀大骑士长！' },
            { speaker: 'player', text: '愿随科斯图提斯将军共赴鲁道战役，大破条顿骑士团敌军！' },
        ],
    },

    // #317 绛曲坚赞 (1302 ~ 1364) — 公元1354年击灭萨迦本钦之战

    // #318 足利尊氏 (1305 ~ 1358) — 公元1336年凑川之战
    ashikaga_zulizunshi: {
        generalId: 'ashikaga_zulizunshi',
        battleName: '凑川之战',
        battleYear: 1336,
        battleType: 'field',
        role: 'attacker',
        targetName: '摄津凑川水陆原野',
        targetCityId: 'city_himeji',
        targetLat: 34.8394,
        targetLng: 134.6939,
        myTroops: 40000,
        enemyFactionId: 'nanchou',
        enemyFactionName: '南朝朝廷军',
        enemyGeneralId: 'yamato_nanmuzhengcheng',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '后醍醐帝偏狭失德武家共诛之！尊氏水陆并进五十万骑压凑川，楠木困守河口，壮士，执刀枪随将军破敌登岸，定鼎幕府！' },
            { speaker: 'player', text: '愿随足利尊氏将军共赴凑川之战，大破南朝朝廷军敌军！' },
        ],
    },

    // #319 伊斯梅尔 (1305 ~ 1335) — 公元1335年赞詹平乱之战（本城就地开战）

    // #320 斯蒂芬杜尚 (1308 ~ 1355) — 公元1330年维尔布日德战役
    gen_stefan_dusan: {
        generalId: 'gen_stefan_dusan',
        battleName: '维尔布日德战役',
        battleYear: 1330,
        battleType: 'field',
        role: 'attacker',
        targetName: '维尔布日德',
        targetCityId: 'city_sofia',
        targetLat: 42.7,
        targetLng: 23.32,
        myTroops: 20000,
        enemyFactionId: 'baojialiya',
        enemyFactionName: '保加利亚王国',
        enemyGeneralId: 'baojialiya_mikhail',   // 🔴 [2026-10-20 成名战规则] 1330 维尔布日德保加利亚沙皇希什曼
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '保加利亚与拜占庭联兵来犯我塞尔维亚边城！年轻的杜尚率重骑突袭其不备，勇士，挺枪冲杀生擒保加利亚沙皇！' },
            { speaker: 'player', text: '愿随斯蒂芬杜尚将军共赴维尔布日德战役，大破保加利亚王国敌军！' },
        ],
    },

    // #321 阿方索十一 (1311 ~ 1350) — 公元1340年萨拉多河战役
    kasidiliya_afangsuoshiyi: {
        generalId: 'kasidiliya_afangsuoshiyi',
        battleName: '萨拉多河战役',
        battleYear: 1340,
        battleType: 'field',
        role: 'attacker',
        targetName: '塔里法萨拉多河',
        targetCityId: 'city_xiuta',
        targetLat: 35.89,
        targetLng: -5.31,
        myTroops: 30000,
        enemyFactionId: 'malin',
        enemyFactionName: '马林苏丹国',
        // 🔴 [2026-10-28 按史] 敌方势力＝马林王朝（原挂「穆拉比特」错：1340 萨拉多河出兵方是马林苏丹阿布·哈桑）
        enemyGeneralId: 'malin_abulhasan',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '北非与格拉纳达倾数十万众围塔里法！圣地亚哥十字战旗引路，卡斯蒂利亚骑士，随国王马踏萨拉多河，尽覆摩尔敌酋！' },
            { speaker: 'player', text: '愿随阿方索十一将军共赴萨拉多河战役，大破马林苏丹国敌军！' },
        ],
    },

    // #322 崔莹 (1316 ~ 1388) — 公元1376年鸿山大捷

    // #323 法昂 (1316 ~ 1393) — 公元1353年统一老挝夺琅勃拉邦战（本城就地开战）

    // #324 张士诚 (1321 ~ 1367) — 公元1354年高邮之战
    zhangshicheng_zhangshicheng: {
        generalId: 'zhangshicheng_zhangshicheng',
        battleName: '高邮之战',
        battleYear: 1354,
        battleType: 'siege',
        role: 'defender',
        targetName: '扬州高邮城',
        targetCityId: 'city_yangzhou',
        targetLat: 32.393,
        targetLng: 119.42,
        myTroops: 25000,
        enemyFactionId: 'yuan_d',
        enemyFactionName: '元朝',
        enemyGeneralId: 'yuan_d_tuotuo',   // 🔴 [2026-10-20 成名战规则] 1354 高邮元军主帅脱脱
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '元朝太师脱脱引天下百万之众筑长壕困我孤城！十八条扁担起义兄弟誓死不降，壮士，随诚王出死力登陴坚守，迎击鞑虏！' },
            { speaker: 'player', text: '愿随张士诚将军共守高邮之战，大破元朝敌军！' },
        ],
    },

    // #325 朱元璋 (1328 ~ 1398) — 公元1363年鄱阳湖之战
    huai_zhuyuanzhang: {
        generalId: 'huai_zhuyuanzhang',
        battleName: '鄱阳湖之战',
        battleYear: 1363,
        battleType: 'field',
        role: 'defender',
        targetName: '鄱阳湖康郎山',
        targetCityId: 'city_raozhou',
        targetLat: 28.99,
        targetLng: 116.66,
        myTroops: 30000,
        enemyFactionId: 'xushouhui',
        enemyFactionName: '大汉国',
        enemyGeneralId: 'gen_chen_youliang',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '陈友谅驾巨舰联锁欲并吞江东！徐达常遇春诸将决死在前，风向骤转顺风放火，壮士，执火炬随某火烧巨舰，一战定乾坤！' },
            { speaker: 'player', text: '愿随朱元璋将军共守鄱阳湖之战，大破大汉国敌军！' },
        ],
    },

    // #326 扩廓帖木儿 (1330 ~ 1375) — 公元1372年岭北之战
    da_yuan_kuokuotiemuer: {
        generalId: 'da_yuan_kuokuotiemuer',
        battleName: '岭北之战',
        battleYear: 1372,
        battleType: 'field',
        role: 'defender',
        targetName: '图拉河畔土拉荒原',
        targetCityId: 'city_kulun',
        targetLat: 47.92,
        targetLng: 106.84,
        myTroops: 50000,
        enemyFactionId: 'ming_d',
        enemyFactionName: '大明',
        enemyGeneralId: 'xuan_xuda',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '明军三路十五万北伐远涉大漠！王保保示弱诱其深进荒野伏兵齐起，大元蒙古儿郎，随齐王回马挽弓，全歼明军先锋！' },
            { speaker: 'player', text: '愿随扩廓帖木儿将军共守岭北之战，大破大明敌军！' },
        ],
    },

    // #327 黑太子 (1330 ~ 1376) — 公元1356年普瓦捷战役
    gen_black_prince: {
        generalId: 'gen_black_prince',
        battleName: '普瓦捷战役',
        battleYear: 1356,
        battleType: 'field',
        role: 'defender',
        targetName: '普瓦捷近郊树林',
        targetCityId: 'city_chambord',
        targetLat: 47.616,
        targetLng: 1.517,
        myTroops: 15000,
        enemyFactionId: 'gaolu',
        enemyFactionName: '法兰西王国',
        enemyGeneralId: 'gaolu_john_ii',   // 🔴 [2026-10-20 成名战规则] 1356 普瓦捷法兰西王约翰二世
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '法兰西重骑三倍于我逼近灌木林！长弓手两翼布防，马蹄陷阱已就，勇士们，随黑太子拔剑反击生擒法兰西国王！' },
            { speaker: 'player', text: '愿随黑太子将军共守普瓦捷战役，大破法兰西王国敌军！' },
        ],
    },

    // #328 常遇春 (1330 ~ 1369) — 公元1355年采石之战
    chizhou_changyuchun: {
        generalId: 'chizhou_changyuchun',
        battleName: '采石之战',
        battleYear: 1355,
        battleType: 'field',
        role: 'attacker',
        targetName: '当涂采石矶',
        targetCityId: 'city_jiuzi',
        targetLat: 31.55,
        targetLng: 118.47,
        myTroops: 15000,
        enemyFactionId: 'yuan_d',
        enemyFactionName: '元朝',
        enemyGeneralId: 'yuan_d_manzihaiya',   // 🔴 [2026-10-20 成名战规则] 1355 采石矶元将蛮子海牙
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '元将列水寨封锁长江天险！某乘轻舟单槊抢先登岸，横冲敌阵如入无人之境，壮士，执刀随某飞渡采石矶，首克江南！' },
            { speaker: 'player', text: '愿随常遇春将军共赴采石之战，大破元朝敌军！' },
        ],
    },

    // #329 拉拉沙欣 (1330 ~ 1388) — 公元1371年马里查战役
    lumiliya_lalashahin: {
        generalId: 'lumiliya_lalashahin',
        battleName: '马里查战役',
        battleYear: 1371,
        battleType: 'field',
        role: 'attacker',
        targetName: '斯维伦格勒马里查河畔',
        targetCityId: 'city_aidiernei',
        targetLat: 41.6781,
        targetLng: 26.5591,
        myTroops: 15000,
        enemyFactionId: 'saierweiya',
        enemyFactionName: '塞尔维亚巴尔干联军',
        enemyGeneralId: 'gen_vukasin',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '塞尔维亚联军营地酗酒喧嚣不知警备！奥斯曼大维齐尔引精骑夜衔枚潜袭，勇士，随我杀入敌寨，将七万蛮敌驱入河中！' },
            { speaker: 'player', text: '愿随拉拉沙欣将军共赴马里查战役，大破塞尔维亚巴尔干联军敌军！' },
        ],
    },

    // #330 徐达 (1332 ~ 1385) — 公元1368年太原之战
    xuan_xuda: {
        generalId: 'xuan_xuda',
        battleName: '太原之战',
        battleYear: 1368,
        battleType: 'field',
        role: 'attacker',
        targetName: '太原城下',
        targetCityId: 'city_taiyuan',
        targetLat: 37.87,
        targetLng: 112.55,
        myTroops: 50000,
        enemyFactionId: 'yuan_d',
        enemyFactionName: '北元',
        enemyGeneralId: 'da_yuan_kuokuotiemuer',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '王保保倾巢出援企图夜袭明营！大将徐达早已探知其谋，遣奇兵反袭其老营，壮士随大将军夜持短刃突入，生擒贼众数万！' },
            { speaker: 'player', text: '愿随徐达将军共赴太原之战，大破北元敌军！' },
        ],
    },

    // #331 阿梅迪奥 (1334 ~ 1383) — 公元1366年加里波利十字军战役

    // #332 李成桂 (1335 ~ 1408) — 公元1380年荒山之战
    joseon_lichenggui: {
        generalId: 'joseon_lichenggui',
        battleName: '荒山之战',
        battleYear: 1380,
        battleType: 'field',
        role: 'attacker',
        targetName: '全罗道云峰荒山',
        targetCityId: 'city_suncheon_k',
        targetLat: 34.9652,
        targetLng: 127.4991,
        myTroops: 25000,
        enemyFactionId: 'haikou',
        enemyFactionName: '日本倭寇联军',
        enemyGeneralId: 'bfe_ajibaldo',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '贼将阿只拔都铜甲护面纵横杀戮！李某挽雕弓一箭射脱其金兜鍪，再发贯喉！三军鼓噪，高丽勇士随某全歼万余倭寇！' },
            { speaker: 'player', text: '愿随李成桂将军共赴荒山之战，大破日本倭寇联军敌军！' },
        ],
    },

    // #333 帖木儿 (1336 ~ 1405) — 公元1402年安卡拉战役
    tiemuer_tiemuer: {
        generalId: 'tiemuer_tiemuer',
        battleName: '安卡拉战役',
        battleYear: 1402,
        battleType: 'field',
        role: 'attacker',
        targetName: '安卡拉丘陵楚布克洼地',
        targetCityId: 'city_ankala',
        targetLat: 39.9289,
        targetLng: 32.8547,
        myTroops: 50000,
        enemyFactionId: 'osman',
        enemyFactionName: '奥斯曼帝国',
        enemyGeneralId: 'gen_bayezid_i',
        enemyTroops: 44000,
        introLines: [
            { speaker: 'general', text: '奥斯曼雷霆苏丹引兵千里疲惫干渴！某掘断其水源设下象兵铁阵，撒马尔罕勇士，随埃米尔纵铁骑冲锋生擒巴耶济德！' },
            { speaker: 'player', text: '愿随帖木儿将军共赴安卡拉战役，大破奥斯曼帝国敌军！' },
        ],
    },

    // #334 朱文正 (1336 ~ 1365) — 公元1363年洪都之战（本城就地开战）
    hongzhou_zhuwenzheng: {
        generalId: 'hongzhou_zhuwenzheng',
        battleName: '洪都之战',
        battleYear: 1363,
        battleType: 'siege',
        role: 'defender',
        targetName: '豫章',
        targetCityId: 'city_hongzhou',
        targetLat: 28.68,
        targetLng: 115.88,
        myTroops: 30000,
        enemyFactionId: 'xushouhui',
        enemyFactionName: '大汉国',
        enemyGeneralId: 'gen_chen_youliang',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '陈友谅六十万大军以楼船压境昼夜急攻洪都！某拆屋填城死守八十五日，壮士，握紧刀枪随大都督死守残堞待主上大军！' },
            { speaker: 'player', text: '愿随朱文正将军共守洪都之战，大破大汉国敌军！' },
        ],
    },

    // #335 蓝玉 (1338 ~ 1393) — 公元1388年捕鱼儿海之战
    shanrong_lanyu: {
        generalId: 'shanrong_lanyu',
        battleName: '捕鱼儿海之战',
        battleYear: 1388,
        battleType: 'field',
        role: 'attacker',
        targetName: '贝尔湖捕鱼儿海',
        targetCityId: 'city_erguna',
        targetLat: 48.061537,
        targetLng: 117.78717,
        myTroops: 38000,
        enemyFactionId: 'yuan_d',
        enemyFactionName: '北元',
        enemyGeneralId: 'gen_toghus_temur',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '大军深入大漠风沙蔽日，鞑靼后主无备！某命穴地炊烟潜渡湖水掩其不备，勇士，拔出佩刀随蓝将军陷阵生擒元主太子！' },
            { speaker: 'player', text: '愿随蓝玉将军共赴捕鱼儿海之战，大破北元敌军！' },
        ],
    },

    // #336 沐英 (1345 ~ 1392) — 公元1388年定边之战
    pingnan_muying: {
        generalId: 'pingnan_muying',
        battleName: '定边之战',
        battleYear: 1388,
        battleType: 'field',
        role: 'attacker',
        targetName: '云南定远归化',
        targetCityId: 'city_weichu',
        targetLat: 25.045791,
        targetLng: 101.574097,
        myTroops: 30000,
        enemyFactionId: 'luchuan',
        enemyFactionName: '麓川王国',
        enemyGeneralId: 'gen_si_lunfa',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '思伦发驱三十万狂徒纵百头战象来犯！某设神机箭火器三段连环射其象鼻，象反奔踩敌，壮士，随西平侯纵马掩杀建功！' },
            { speaker: 'player', text: '愿随沐英将军共赴定边之战，大破麓川王国敌军！' },
        ],
    },

    // #337 顿斯科伊 (1350 ~ 1389) — 公元1380年库利科沃战役
    gen_dmitry_donskoy: {
        generalId: 'gen_dmitry_donskoy',
        battleName: '库利科沃战役',
        battleYear: 1380,
        battleType: 'field',
        role: 'attacker',
        targetName: '顿河畔库利科沃原野',
        targetCityId: 'city_liangzan',
        targetLat: 54.62,
        targetLng: 39.74,
        myTroops: 40000,
        enemyFactionId: 'jinzhang',
        enemyFactionName: '金帐汗国',
        enemyGeneralId: 'gen_mamai',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '鞑靼鞑靼两百年枷锁今日必断！顿河已被抛在身后退无可退，莫斯科的斯拉夫勇士，换上战甲随大公伏兵齐发踏碎金帐！' },
            { speaker: 'player', text: '愿随顿斯科伊将军共赴库利科沃战役，大破金帐汗国敌军！' },
        ],
    },

    // #338 维托夫特 (1350 ~ 1430) — 公元1410年格伦瓦尔德战役
    gen_vytautas_great: {
        generalId: 'gen_vytautas_great',
        battleName: '格伦瓦尔德战役',
        battleYear: 1410,
        battleType: 'field',
        role: 'attacker',
        targetName: '坦能堡格伦瓦尔德',
        targetCityId: 'city_kenisibao',
        targetLat: 54.71,
        targetLng: 20.51,
        myTroops: 50000,
        enemyFactionId: 'tiaodun_qishi',
        enemyFactionName: '条顿骑士团',
        enemyGeneralId: 'gen_ulrich_jungingen',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '条顿大团长重铠列阵不可一世！某引立陶宛轻骑佯败诱其分散阵形，波兰立陶宛勇士，随维陶塔斯全线反击斩杀大团长！' },
            { speaker: 'player', text: '愿随维陶塔斯将军共赴格伦瓦尔德战役，大破条顿骑士团敌军！' },
        ],
    },

    // #339 勇者弗拉基 (1353 ~ 1410) — 公元1380年库利科沃战役
    gen_vladimir_andreyevich: {
        generalId: 'gen_vladimir_andreyevich',
        battleName: '库利科沃战役',
        battleYear: 1380,
        battleType: 'field',
        role: 'attacker',
        targetName: '库利科沃橡树林',
        targetCityId: 'city_liangzan',
        targetLat: 54.62,
        targetLng: 39.74,
        myTroops: 15000,
        enemyFactionId: 'jinzhang',
        enemyFactionName: '金帐汗国',
        enemyGeneralId: 'gen_mamai',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '莫斯科中军苦战血流漂杵！我精骑伏于橡树林中待时而发，鞑靼阵脚已浮动，勇士们，端平战矛随谢尔普霍夫亲王突袭！' },
            { speaker: 'player', text: '愿随勇者弗拉基将军共赴库利科沃战役，大破金帐汗国敌军！' },
        ],
    },

    // #340 若昂一世 (1357 ~ 1433) — 公元1385年阿勒朱巴洛塔战役
    gen_joao_i: {
        generalId: 'gen_joao_i',
        battleName: '阿勒朱巴洛塔战役',
        battleYear: 1385,
        battleType: 'field',
        role: 'defender',
        targetName: '莱里亚阿勒朱巴洛塔',
        targetCityId: 'city_lisiben',
        targetLat: 38.72,
        targetLng: -9.13,
        myTroops: 15000,
        enemyFactionId: 'kasidiliya',
        enemyFactionName: '卡斯蒂利亚王国',
        enemyGeneralId: 'gen_juan_i_castile',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '卡斯蒂利亚重甲骑士企图吞并葡萄牙王国！长壕尖桩已密布丘陵，英格兰长弓齐发，勇士随阿维斯骑士团长捍卫独立！' },
            { speaker: 'player', text: '愿随若昂一世将军共守阿勒朱巴洛塔战役，大破卡斯蒂利亚王国敌军！' },
        ],
    },

    // #341 朱棣 (1360 ~ 1424) — 公元1400年白沟河之战
    ming_d_zhudi: {
        generalId: 'ming_d_zhudi',
        battleName: '白沟河之战',
        battleYear: 1400,
        battleType: 'field',
        role: 'attacker',
        targetName: '雄县白沟河',
        targetCityId: 'city_fanyang',
        targetLat: 39.48,
        targetLng: 115.98,
        myTroops: 40000,
        enemyFactionId: 'ming_d',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '建文朝廷军',
        enemyGeneralId: 'gen_li_jinglong',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '齐黄奸佞削藩乱政，奉天靖难在此一战！李景隆六十万虽多乌合耳，妖风折其帅旗，壮士，随燕王玄甲精骑直捣中坚！' },
            { speaker: 'player', text: '愿随朱棣将军共赴白沟河之战，大破建文朝廷军敌军！' },
        ],
    },

    // #342 扬杰斯卡 (1360 ~ 1424) — 公元1420年维特科夫山战役
    gen_jan_zizka: {
        generalId: 'gen_jan_zizka',
        battleName: '维特科夫山战役',
        battleYear: 1420,
        battleType: 'siege',
        role: 'defender',
        targetName: '布拉格维特科夫山',
        targetCityId: 'city_bulage',
        targetLat: 50.07,
        targetLng: 14.43,
        myTroops: 10000,
        enemyFactionId: 'bafaliya',
        enemyFactionName: '神圣罗马帝国',
        enemyGeneralId: 'bfe_sigismund',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '罗马教皇与皇帝发十字军践踏波希米亚！独眼杰斯卡以战车结堡垒铁链相扣，胡斯勇士，手握铁枷战锤随我砸碎骑士铠甲！' },
            { speaker: 'player', text: '愿随扬杰式卡将军共守维特科夫山战役，大破神圣罗马帝国敌军！' },
        ],
    },

    // #343 铁铉 (1366 ~ 1402) — 公元1400年济南之战（本城就地开战）
    jinan_tiexuan: {
        generalId: 'jinan_tiexuan',
        battleName: '济南之战',
        battleYear: 1400,
        battleType: 'siege',
        role: 'defender',
        targetName: '历下',
        targetCityId: 'city_licheng',
        targetLat: 36.67,
        targetLng: 117,
        myTroops: 25000,
        enemyFactionId: 'ming_d',
        enemyFactionName: '燕军',
        enemyGeneralId: 'ming_d_zhudi',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '燕贼反叛直逼济南城下，诈筑长堤决水灌城！铁某诈降悬闸下砸燕主马首，画像高悬，壮士，随我誓死登城拒守三月！' },
            { speaker: 'player', text: '愿随铁铉将军共守济南之战，大破燕军敌军！' },
        ],
    },

    // #344 黎利 (1385 ~ 1433) — 公元1426年崒泥关洞战役
    leloi: {
        generalId: 'leloi',
        battleName: '崒泥关洞战役',
        battleYear: 1426,
        battleType: 'field',
        role: 'attacker',
        targetName: '美德崒泥关洞',
        targetCityId: 'city_hoabinh',
        targetLat: 20.7667,
        targetLng: 105.3333,
        myTroops: 20000,
        enemyFactionId: 'ming_d',
        enemyFactionName: '大明',
        enemyGeneralId: 'gen_wang_tong',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '明军总兵王通企图夹攻我义军！蓝山豪杰据泥泞隘道设伏，象兵穿林出击，安南子民随黎利拔顺天神剑，复我大越江山！' },
            { speaker: 'player', text: '愿随黎利将军共赴崒泥关洞战役，大破大明敌军！' },
        ],
    },

    // #345 亨利五世 (1386 ~ 1422) — 公元1415年阿金库尔战役
    gen_henry_v: {
        generalId: 'gen_henry_v',
        battleName: '阿金库尔战役',
        battleYear: 1415,
        battleType: 'field',
        role: 'defender',
        targetName: '加来近郊阿金库尔林间',
        targetCityId: 'city_calais',
        targetLat: 50.95,
        targetLng: 1.85,
        myTroops: 12000,
        enemyFactionId: 'gaolu',
        enemyFactionName: '法兰西王国',
        enemyGeneralId: 'gen_boucicaut',
        enemyTroops: 12000,
        introLines: [
            { speaker: 'general', text: '我们是少数人，幸运的少数人，我们生死与共的兄弟！泥泞狭谷正是法兰西重骑死地，勇士们，拉满长弓射落傲慢骑兵！' },
            { speaker: 'player', text: '愿随亨利五世将军共守阿金库尔战役，大破法兰西王国敌军！' },
        ],
    },

    // #346 明耶觉苏瓦 (1391 ~ 1415) — 公元1415年达拉之战
    ava_minye_kyawswa: {
        generalId: 'ava_minye_kyawswa',
        battleName: '达拉之战',
        battleYear: 1415,
        battleType: 'siege',
        role: 'attacker',
        targetName: '仰光达拉城',
        targetCityId: 'city_bago',
        targetLat: 17.3333,
        targetLng: 96.4667,
        myTroops: 25000,
        enemyFactionId: 'mon',
        enemyFactionName: '勃固王国',
        enemyGeneralId: 'gen_razadarit',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '四十年阿瓦与勃固争霸止于今日！缅甸水陆战象顺伊洛瓦底江齐进，勇士，随阿瓦王储跨象破关，一战扫灭南方孟族！' },
            { speaker: 'player', text: '愿随明耶觉苏瓦将军共赴达拉之战，大破勃固王国敌军！' },
        ],
    },

    // #347 帕查库提 (1391 ~ 1471) — 公元1438年库斯科之战
    gen_pachacuti: {
        generalId: 'gen_pachacuti',
        battleName: '库斯科之战',
        battleYear: 1438,
        battleType: 'siege',
        role: 'defender',
        targetName: '库斯科近郊查查潘帕',
        targetCityId: 'city_cusco',
        targetLat: -13.52,
        targetLng: -71.97,
        myTroops: 20000,
        enemyFactionId: 'chanka',
        enemyFactionName: '昌卡',
        enemyGeneralId: 'bfe_chanca_chief',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '昌卡凶蛮围攻库斯科，父兄逃遁唯某坚守！太阳神将地面的石头皆化作我方战士，印加勇士，举起石斧长矛随我誓死血战！' },
            { speaker: 'player', text: '愿随帕查库特克将军共守库斯科之战，大破昌卡敌军！' },
        ],
    },

    // #348 思任发 (1395 ~ 1446) — 公元1441年麓川之战
    luchuan_sirenfa: {
        generalId: 'luchuan_sirenfa',
        battleName: '麓川之战',
        battleYear: 1441,
        battleType: 'field',
        role: 'defender',
        targetName: '保山潞江东岸',
        targetCityId: 'city_baoshan',
        targetLat: 25.11,
        targetLng: 99.16,
        myTroops: 35000,
        enemyFactionId: 'ming_d',
        enemyFactionName: '大明',
        enemyGeneralId: 'gen_wang_ji',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '明廷发三征麓川大军图灭我傣邦！怒江天堑险阻密林连绵，战象重矢扼守渡口，勇士，随诏法顺流截击，叫明军折戟深壑！' },
            { speaker: 'player', text: '愿随思任发将军共守麓川之战，大破大明敌军！' },
        ],
    },

    // #349 于谦 (1398 ~ 1457) — 公元1449年北京之战
    yi_yuqian: {
        generalId: 'yi_yuqian',
        battleName: '北京之战',
        battleYear: 1449,
        battleType: 'siege',
        role: 'defender',
        targetName: '德胜门城外',
        targetCityId: 'city_beijing',
        targetLat: 39.9,
        targetLng: 116.41,
        myTroops: 38000,
        enemyFactionId: 'oirat_ming',
        enemyFactionName: '瓦剌蒙古',
        enemyGeneralId: 'wala_yexian',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '土木之变社稷垂危，南迁之议即当斩！于某关闭九门誓与九门共存亡，神机营列阵在前，壮士，随某出德胜门破瓦剌胡骑！' },
            { speaker: 'player', text: '愿随于谦将军共守北京之战，大破瓦剌蒙古敌军！' },
        ],
    },

    // #350 匈雅提亚诺什 (1406 ~ 1456) — 公元1456年贝尔格莱德之战
    xiongyati_yannuoshi: {
        generalId: 'xiongyati_yannuoshi',
        battleName: '贝尔格莱德之战',
        battleYear: 1456,
        battleType: 'siege',
        role: 'defender',
        targetName: '贝尔格莱德要塞',
        targetCityId: 'city_belgrade',
        targetLat: 44.78,
        targetLng: 20.45,
        myTroops: 30000,
        enemyFactionId: 'osman',
        enemyFactionName: '奥斯曼帝国',
        enemyGeneralId: 'osman_mehmed_ii',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '征服者苏丹携百门巨炮意图踏碎欧洲门户！十字军民兵与匈牙利骑士，随白骑士驾舟撞碎敌舰队，誓死守卫多瑙要塞！' },
            { speaker: 'player', text: '愿随匈雅提亚诺什将军共守贝尔格莱德之战，大破奥斯曼帝国敌军！' },
        ],
    },

    // #351 也先 (1407 ~ 1454) — 公元1449年土木堡之战
    wala_yexian: {
        generalId: 'wala_yexian',
        battleName: '土木堡之战',
        battleYear: 1449,
        battleType: 'field',
        role: 'attacker',
        targetName: '怀来土木堡',
        targetCityId: 'city_juyongguan',
        targetLat: 40.28,
        targetLng: 116.06,
        myTroops: 40000,
        enemyFactionId: 'ming_d',
        enemyFactionName: '大明',
        enemyGeneralId: 'gen_wangzhen',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '明皇率五十万大军亲征却困于土木无水绝地！佯退诱敌掘水壕合围，瓦剌雄鹰，跨马拔刀随太师冲锋，全歼明军俘虏皇帝！' },
            { speaker: 'player', text: '愿随也先将军共赴土木堡之战，大破大明敌军！' },
        ],
    },

    // #352 贞德 (1412 ~ 1431) — 公元1429年奥尔良之战
    gen_joanofarc: {
        generalId: 'gen_joanofarc',
        battleName: '奥尔良之战',
        battleYear: 1429,
        battleType: 'siege',
        role: 'attacker',
        targetName: '奥尔良托雷勒要塞',
        targetCityId: 'city_chambord',
        targetLat: 47.616,
        targetLng: 1.517,
        myTroops: 12000,
        enemyFactionId: 'yinggelan',
        enemyFactionName: '英格兰王国',
        enemyGeneralId: 'gen_suffolk',
        enemyTroops: 18000,
        introLines: [
            { speaker: 'general', text: '天使的声音指引法兰西！圣剑已拔出，主必使奥尔良重获自由！英格兰人的棱堡已在眼前，勇士们，随少女贞德爬梯破城！' },
            { speaker: 'player', text: '愿随贞德将军共赴奥尔良之战，大破英格兰王国敌军！' },
        ],
    },

    // #353 王越 (1423 ~ 1498) — 公元1473年红盐池之战
    dongshengwei_wangyue: {
        generalId: 'dongshengwei_wangyue',
        battleName: '红盐池之战',
        battleYear: 1473,
        battleType: 'field',
        role: 'attacker',
        targetName: '鄂尔多斯红盐池',
        targetCityId: 'city_quyancheng',
        targetLat: 37.7794,
        targetLng: 107.4078,
        myTroops: 20000,
        enemyFactionId: 'dada_ming',
        enemyFactionName: '鞑靼蒙古',
        enemyGeneralId: 'gen_beg_arslan',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '蒙古虏骑深入河套劫掠边民，其巢穴红盐池空虚！老夫选精骑人衔枚马裹蹄雪夜长途奔袭，壮士，执快刀随军焚其金帐！' },
            { speaker: 'player', text: '愿随王越将军共赴红盐池之战，大破鞑靼蒙古敌军！' },
        ],
    },

    // #354 弗拉德三世 (1431 ~ 1476) — 公元1462年特尔戈维什泰之战（本城就地开战）
    gen_vlad_impaler: {
        generalId: 'gen_vlad_impaler',
        battleName: '特尔戈维什泰之战',
        battleYear: 1462,
        battleType: 'field',
        role: 'attacker',
        targetName: '特尔戈维',
        targetCityId: 'city_teergewishite',
        targetLat: 44.86,
        targetLng: 25.46,
        myTroops: 15000,
        enemyFactionId: 'osman',
        enemyFactionName: '奥斯曼帝国',
        enemyGeneralId: 'osman_mehmed_ii',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '奥斯曼大军深入我领土！今夜孤身着突厥铠甲潜入苏丹大营制造混乱，勇士，拔出利刃随穿刺公夜袭，教异教徒魂飞魄散！' },
            { speaker: 'player', text: '愿随弗拉德三世将军共赴特尔戈维什泰之战，大破奥斯曼帝国敌军！' },
        ],
    },

    // #355 穆罕默德二世 (1432 ~ 1481) — 公元1453年君士坦丁堡之战
    osman_mehmed_ii: {
        generalId: 'osman_mehmed_ii',
        battleName: '君士坦丁堡之战',
        battleYear: 1453,
        battleType: 'siege',
        role: 'attacker',
        targetName: '君士坦丁堡狄奥多西城墙',
        targetCityId: 'city_junshitandingbao',
        targetLat: 41.01,
        targetLng: 28.97,
        myTroops: 30000,
        enemyFactionId: 'baizanting',
        enemyFactionName: '拜占庭帝国',
        enemyGeneralId: 'gen_constantine_xi',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '战船已在陆上拖行越过加拉太入金角湾，乌尔班巨炮轰塌千载坚城！安拉的加齐圣战勇士，随苏丹登上云梯踏破千年帝都！' },
            { speaker: 'player', text: '愿随穆罕默德二世将军共赴君士坦丁堡之战，大破拜占庭帝国敌军！' },
        ],
    },

    // #356 大胆查理 (1433 ~ 1477) — 公元1465年蒙特莱里战役
    bogendi_chali: {
        generalId: 'bogendi_chali',
        battleName: '蒙特莱里战役',
        battleYear: 1465,
        battleType: 'field',
        role: 'attacker',
        targetName: '巴黎近郊蒙特莱里',
        targetCityId: 'city_bali',
        targetLat: 48.85,
        targetLng: 2.35,
        myTroops: 20000,
        enemyFactionId: 'gaolu',
        enemyFactionName: '法兰西王国',
        enemyGeneralId: 'gen_louis_xi',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '谨慎狡诈的蜘蛛国王妄图削弱勃艮第独立！铁甲骑士排山倒海，火炮列阵在前，勃艮第勇士，随大胆查理长枪冲锋击退法军！' },
            { speaker: 'player', text: '愿随大胆查理将军共赴蒙特莱里战役，大破法兰西王国敌军！' },
        ],
    },

    // #357 斯蒂芬 (1433 ~ 1504) — 公元1475年瓦斯卢伊战役
    gen_stephen_great: {
        generalId: 'gen_stephen_great',
        battleName: '瓦斯卢伊战役',
        battleYear: 1475,
        battleType: 'field',
        role: 'defender',
        targetName: '雅西近郊瓦斯卢伊沼泽',
        targetCityId: 'city_yaxi',
        targetLat: 47.16,
        targetLng: 27.58,
        myTroops: 40000,
        enemyFactionId: 'osman',
        enemyFactionName: '奥斯曼帝国',
        enemyGeneralId: 'bfe_suleiman_pasha',   // 🔴 [2026-10-25 按史] 1475 瓦斯卢伊奥斯曼军＝哈德姆·苏莱曼帕夏（穆罕默德二世未亲征）
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '突厥大军十万之众压境，浓雾大作沼泽陷足！战角自山谷四方响起，摩尔达维亚勇士，随大公万箭齐发将侵略者埋入泥潭！' },
            { speaker: 'player', text: '愿随斯蒂芬将军共守瓦斯卢伊战役，大破奥斯曼帝国敌军！' },
        ],
    },

    // #358 图帕克 (1440 ~ 1493) — 公元1470年昌昌之战
    gen_topa_inca: {
        generalId: 'gen_topa_inca',
        battleName: '昌昌之战',
        battleYear: 1470,
        battleType: 'siege',
        role: 'attacker',
        targetName: '特鲁希略昌昌城',
        targetCityId: 'city_chanchan',
        targetLat: -8.11,
        targetLng: -79.07,
        myTroops: 40000,
        enemyFactionId: 'qimu',
        enemyFactionName: '奇穆帝国',
        enemyGeneralId: 'gen_minchancaman',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '奇穆暴君依仗昌昌泥砖高墙抗拒太阳！某断其灌溉运河引太阳神火逼降，印加战士，握紧铜斧随印加王踏平沿海立千秋伟业！' },
            { speaker: 'player', text: '愿随图帕克将军共赴昌昌之战，大破奇穆帝国敌军！' },
        ],
    },

    // #359 马加什一世 (1443 ~ 1490) — 公元1485年维也纳之战
    mazhaer_majiashi: {
        generalId: 'mazhaer_majiashi',
        battleName: '维也纳之战',
        battleYear: 1485,
        battleType: 'siege',
        role: 'attacker',
        targetName: '维也纳城下',
        targetCityId: 'city_weiyeena',
        targetLat: 48.2,
        targetLng: 16.37,
        myTroops: 30000,
        enemyFactionId: 'habusibao',
        enemyFactionName: '哈布斯堡神圣罗马',
        enemyGeneralId: 'bfe_frederick_iii',   // 🔴 [2026-10-25 按史] 1485 维也纳守方＝皇帝腓特烈三世（马克西米连在尼德兰）
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '哈布斯堡皇帝夺我匈牙利圣冠，黑军佣兵今日必雪此耻！重装火枪步兵包围多瑙坚城，勇士，随渡鸦之王踏入维也纳皇宫！' },
            { speaker: 'player', text: '愿随马加什一世将军共赴维也纳之战，大破哈布斯堡神圣罗马敌军！' },
        ],
    },

    // #360 昔班尼 (1451 ~ 1510) — 公元1500年撒马尔罕之战
    an_xibanni: {
        generalId: 'an_xibanni',
        battleName: '撒马尔罕之战',
        battleYear: 1500,
        battleType: 'siege',
        role: 'attacker',
        targetName: '撒马尔罕城下',
        targetCityId: 'city_samaerhan',
        targetLat: 39.6525,
        targetLng: 66.9714,
        myTroops: 35000,
        enemyFactionId: 'mowoer',
        enemyFactionName: '帖木儿帝国',
        enemyGeneralId: 'babuer_babuer',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '帖木儿后裔内讧不绝天命已移！乌兹别克草原铁骑如黑云压城，真主的雄鹰已展翅，勇士，引弓随可汗踏破撒马尔罕定江山！' },
            { speaker: 'player', text: '愿随昔班尼将军共赴撒马尔罕之战，大破帖木儿帝国敌军！' },
        ],
    },

    // #361 斐迪南二世 (1452 ~ 1516) — 公元1491年格拉纳达之战
    gen_ferdinand_ii: {
        generalId: 'gen_ferdinand_ii',
        battleName: '格拉纳达之战',
        battleYear: 1491,
        battleType: 'siege',
        role: 'attacker',
        targetName: '格拉纳达阿尔罕布拉',
        targetCityId: 'city_granada',
        targetLat: 37.17,
        targetLng: -3.6,
        myTroops: 50000,
        enemyFactionId: 'nasier',
        enemyFactionName: '格拉纳达酋长国',
        enemyGeneralId: 'gen_muhammad_xii',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '八百年收复失地之战已至终局！基督圣旗已插在圣菲营地，天主教双王在此，勇士，持长矛随孤攻克摩尔人最后堡垒！' },
            { speaker: 'player', text: '愿随斐迪南二世将军共赴格拉纳达之战，大破格拉纳达酋长国敌军！' },
        ],
    },

    // #362 阿尔布克尔克 (1453 ~ 1515) — 公元1510年果阿之战（本城就地开战）
    puxiangyindu_albukeerke: {
        generalId: 'puxiangyindu_albukeerke',
        battleName: '果阿之战',
        battleYear: 1510,
        battleType: 'siege',
        role: 'attacker',
        targetName: '果阿',
        targetCityId: 'city_guoa',
        targetLat: 15.5023,
        targetLng: 73.9117,
        myTroops: 15000,
        enemyFactionId: 'adile',
        enemyFactionName: '比贾布尔苏丹国',
        enemyGeneralId: 'bfe_rasul_khan',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '曼陀维河口的潮水正合风帆！卡拉克帆船火炮齐射，印度洋的门户必须归葡萄牙，勇敢的水兵，随老督宪拔剑抢滩登城！' },
            { speaker: 'player', text: '愿随阿尔布克尔克将军共赴果阿之战，大破比贾布尔苏丹国敌军！' },
        ],
    },

    // #363 迈赫迈德 (1465 ~ 1523) — 公元1521年莫斯科之战
    gen_mehmed_giray: {
        generalId: 'gen_mehmed_giray',
        battleName: '莫斯科之战',
        battleYear: 1521,
        battleType: 'field',
        role: 'attacker',
        targetName: '莫斯科奥卡河畔',
        targetCityId: 'city_mosike',
        targetLat: 55.75,
        targetLng: 37.61,
        myTroops: 50000,
        enemyFactionId: 'mosike_gongguo',
        enemyFactionName: '莫斯科大公国',
        enemyGeneralId: 'gen_vasili_iii',
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '莫斯科大公胆怯闭门！克里米亚与喀山铁骑漫山遍野踏破奥卡河防线，草原的雄鹰们，挽弓纵马随汗王收割胜利、勒石索贡！' },
            { speaker: 'player', text: '愿随迈赫迈德将军共赴莫斯科之战，大破莫斯科大公国敌军！' },
        ],
    },

    // #364 王守仁 (1472 ~ 1529) — 公元1519年安庆之战
    dayu_wangshouren: {
        generalId: 'dayu_wangshouren',
        battleName: '安庆之战',
        battleYear: 1519,
        battleType: 'field',
        role: 'attacker',
        targetName: '鄱阳湖黄家渡',
        targetCityId: 'city_raozhou',
        targetLat: 28.99,
        targetLng: 116.66,
        myTroops: 35000,
        enemyFactionId: 'ming_d',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '宁王',
        enemyGeneralId: 'bfe_zhu_chenhao',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '宸濠起兵荼毒江右！某提义兵围魏救赵直捣南昌，宁王引楼船还战必自焚，壮士，随阳明提兵借火攻夹击，致良知于行阵！' },
            { speaker: 'player', text: '愿随王守仁将军共赴安庆之战，大破宁王军！' },
        ],
    },

    // #365 巴图蒙克 (1474 ~ 1517) — 公元1510年达兰特尔格之战
    dada_ming_dayanhan: {
        generalId: 'dada_ming_dayanhan',
        battleName: '达兰特尔格之战',
        battleYear: 1510,
        battleType: 'field',
        role: 'attacker',
        targetName: '鄂尔多斯达兰特尔格',
        targetCityId: 'city_dongshengzhou',
        targetLat: 39.810643,
        targetLng: 109.959412,
        myTroops: 40000,
        enemyFactionId: 'menggu_d',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '右翼蒙古部族',
        enemyGeneralId: 'bfe_yibula',   // 🔴 [2026-10-25 按史] 1510 达兰特哩衮右翼首领＝太师亦不剌（俺答 1507 年生，此年 3 岁）
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '黄金家族的血脉绝不容异姓逆臣僭越！达延汗亲统左翼察哈尔万户南下，控弦的蒙古儿郎，随孤马踏连营重统六万户草原！' },
            { speaker: 'player', text: '愿随巴图蒙克将军共赴达兰特尔格之战，大破右翼蒙古部族敌军！' },
        ],
    },

    // #366 巴巴罗萨 (1478 ~ 1546) — 公元1538年普雷韦扎之战
    gen_barbarossa: {
        generalId: 'gen_barbarossa',
        battleName: '普雷韦扎之战',
        battleYear: 1538,
        battleType: 'field',
        role: 'attacker',
        targetName: '普雷韦扎海湾',
        targetCityId: 'city_anbulajiya',
        targetLat: 39.16,
        targetLng: 20.98,
        myTroops: 30000,
        enemyFactionId: 'kelimiya',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '神圣同盟联军',
        enemyGeneralId: 'gen_andrea_doria',   // 🔴 [2026-10-25 按史] 1538 普雷韦扎神圣同盟舰队＝安德烈亚·多里亚（皮萨罗在秘鲁）
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '基督教联合舰队巨舰如林，然各怀鬼胎！加莱桨帆船借风破浪，真主的红胡子在此，勇士们，点燃火炮随我撕碎多利亚的铁索！' },
            { speaker: 'player', text: '愿随巴巴罗萨将军共赴普雷韦扎之战，大破神圣同盟联军敌军！' },
        ],
    },

    // #367 皮萨罗 (1478 ~ 1541) — 公元1532年卡哈马卡之战
    xibanya_pisaluo: {
        generalId: 'xibanya_pisaluo',
        battleName: '卡哈马卡之战',
        battleYear: 1532,
        battleType: 'field',
        role: 'attacker',
        targetName: '卡哈马卡广场',
        targetCityId: 'city_chanchan',
        targetLat: -8.11,
        targetLng: -79.07,
        myTroops: 10000,
        enemyFactionId: 'inca',
        enemyFactionName: '印加帝国',
        enemyGeneralId: 'gen_atahualpa',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '异邦皇帝深信神谕毫无戒备！广场四周伏兵火铳已装填铅弹，为了西班牙与黄金，勇敢的征服者们，随我拔剑直扑印加帝王！' },
            { speaker: 'player', text: '愿随皮萨罗将军共赴卡哈马卡之战，大破印加帝国敌军！' },
        ],
    },

    // #368 巴布尔 (1483 ~ 1530) — 公元1526年第一次帕尼帕特战役
    babuer_babuer: {
        generalId: 'babuer_babuer',
        battleName: '第一次帕尼帕特战役',
        battleYear: 1526,
        battleType: 'field',
        role: 'attacker',
        targetName: '帕尼帕特原野',
        targetCityId: 'city_deli',
        targetLat: 28.61,
        targetLng: 77.23,
        myTroops: 20000,
        enemyFactionId: 'deli',
        enemyFactionName: '德里苏丹国',
        enemyGeneralId: 'gen_ibrahim_lodi',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '洛提十万大军驱百头战象来犯！某以牛皮车阵锁链护前，奥斯曼火绳枪火炮环列，勇士，随帖木儿之孙万骑出侧翼合围立国！' },
            { speaker: 'player', text: '愿随巴布尔将军共赴第一次帕尼帕特战役，大破德里苏丹国敌军！' },
        ],
    },

    // #369 德拉古特 (1485 ~ 1565) — 公元1560年杰尔巴岛之战
    gen_dragut: {
        generalId: 'gen_dragut',
        battleName: '杰尔巴岛之战',
        battleYear: 1560,
        battleType: 'field',
        role: 'attacker',
        targetName: '杰尔巴岛海面',
        targetCityId: 'city_jiemu',
        targetLat: 35.296,
        targetLng: 10.706,
        myTroops: 25000,
        enemyFactionId: 'xibanya',
        enemyFactionName: '西班牙基督教同盟',
        enemyGeneralId: 'gen_medinaceli',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '西班牙舰队妄图封锁北非海岸，今已尽入杰尔巴浅滩迷局！苏丹的加齐海军顺风合围，地中海的水手们，挥起弯刀随我夺船俘舰！' },
            { speaker: 'player', text: '愿随德拉古特将军共赴杰尔巴岛之战，大破西班牙基督教同盟敌军！' },
        ],
    },


    // #371 瓦莱特 (1494 ~ 1568) — 公元1565年马耳他之战（本城就地开战）
    maerta_qishi_walaite: {
        generalId: 'maerta_qishi_walaite',
        battleName: '马耳他之战',
        battleYear: 1565,
        battleType: 'siege',
        role: 'defender',
        targetName: '马耳他',
        targetCityId: 'city_malta',
        targetLat: 35.9,
        targetLng: 14.44,
        myTroops: 10000,
        enemyFactionId: 'osman',
        enemyFactionName: '奥斯曼帝国',
        enemyGeneralId: 'gen_mustafa_pasha',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '奥斯曼大军四万环伺圣埃尔莫孤堡，地中海咽喉在此一举！医院骑士团无畏生死，誓守圣约翰旗帜，勇士，执枪登城随我共存亡！' },
            { speaker: 'player', text: '愿随瓦莱特将军共守马耳他之战，大破奥斯曼帝国敌军！' },
        ],
    },

    // #372 弗朗索瓦 (1494 ~ 1547) — 公元1515年马里尼亚诺战役
    gen_francis_i: {
        generalId: 'gen_francis_i',
        battleName: '马里尼亚诺战役',
        battleYear: 1515,
        battleType: 'field',
        role: 'attacker',
        targetName: '米兰近郊马里尼亚诺',
        targetCityId: 'city_milan',
        targetLat: 45.46,
        targetLng: 9.19,
        myTroops: 35000,
        enemyFactionId: 'lunbadi',
        enemyFactionName: '瑞士长矛雇佣军',
        enemyGeneralId: 'gen_maximilian_sforza',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '号称无敌的瑞士长矛方阵妄阻朕进军米兰！法兰西重装骑兵与野战重炮早已严阵以待，勇士，挺枪策马随国王践踏敌方阵列！' },
            { speaker: 'player', text: '愿随弗朗索瓦将军共赴马里尼亚诺战役，大破瑞士长矛雇佣军敌军！' },
        ],
    },

    // #373 毛利元就 (1497 ~ 1571) — 公元1555年严岛之战
    aki_maoliyuanjiu: {
        generalId: 'aki_maoliyuanjiu',
        battleName: '严岛之战',
        battleYear: 1555,
        battleType: 'field',
        role: 'attacker',
        targetName: '安芸严岛宫岛海域',
        targetCityId: 'city_yoshida',
        targetLat: 34.438616,
        targetLng: 132.530823,
        myTroops: 10000,
        enemyFactionId: 'ouchi',
        enemyFactionName: '大内',
        enemyGeneralId: 'bfe_sue_harutaka',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '陶晴贤引三万众深入严岛狭窄绝境！狂风暴雨正是神佛相助，某水军已焚其退船，壮士，拔出打刀随元就夜袭敌营一举定西国！' },
            { speaker: 'player', text: '愿随毛利元就将军共赴严岛之战，大破大内敌军！' },
        ],
    },

    // #374 达维拉 (1500 ~ 1560) — 公元1514年征服达连之战

    // #375 巴赫拉姆汗 (1501 ~ 1561) — 公元1556年第二次帕尼帕特战役
    xindu_bahelamuhan: {
        generalId: 'xindu_bahelamuhan',
        battleName: '第二次帕尼帕特战役',
        battleYear: 1556,
        battleType: 'field',
        role: 'attacker',
        targetName: '帕尼帕特平原',
        targetCityId: 'city_deli',
        targetLat: 28.61,
        targetLng: 77.23,
        myTroops: 20000,
        enemyFactionId: 'sur',
        enemyFactionName: '苏尔帝国',
        // 🔴 [2026-10-28 按史] 敌方势力＝苏尔王朝（原挂「德里苏丹国」错：1556 出兵方是苏尔王朝，赫穆为其主将）
        enemyGeneralId: 'gen_hemu',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '赫穆领千头披甲战象企图阻遏帝国中兴！少年阿克巴之威全在此战，神射手已射穿敌目，勇士，持矛随老帅突入中军全歼敌军！' },
            { speaker: 'player', text: '愿随巴赫拉姆汗将军共赴第二次帕尼帕特战役，大破苏尔帝国敌军！' },
        ],
    },


    // #377 俞大猷 (1503 ~ 1579) — 公元1555年王江泾之战
    qian_d_yudayou: {
        generalId: 'qian_d_yudayou',
        battleName: '王江泾之战',
        battleYear: 1555,
        battleType: 'field',
        role: 'attacker',
        targetName: '嘉兴王江泾',
        targetCityId: 'city_jiaxing',
        targetLat: 30.75,
        targetLng: 120.76,
        myTroops: 15000,
        enemyFactionId: 'haikou',
        enemyFactionName: '日本倭寇联军',
        enemyGeneralId: 'bfe_xu_hai',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '倭贼深入浙西焚掠数郡，气焰骄狂！某部俞家军长枪大牌阵势严密，此东南平倭第一战，壮士，持荆楚长剑随某合击，斩尽贼酋！' },
            { speaker: 'player', text: '愿随俞大猷将军共赴王江泾之战，大破日本倭寇联军敌军！' },
        ],
    },

    // #378 格拉尼 (1506 ~ 1542) — 公元1529年欣比拉库雷战役

    // #379 俺答 (1507 ~ 1582) — 公元1550年通州之战
    tumed_andahan: {
        generalId: 'tumed_andahan',
        battleName: '通州之战',
        battleYear: 1550,
        battleType: 'field',
        role: 'attacker',
        targetName: '通州密云城郊',
        targetCityId: 'city_gubeikou',
        targetLat: 40.69,
        targetLng: 117.16,
        myTroops: 50000,
        enemyFactionId: 'ming_d',
        enemyFactionName: '明朝',
        enemyGeneralId: 'gen_qiu_luan',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '明廷闭关绝贡视我草原为狄戎！俺答汗亲引土默特铁骑越古北口直逼京畿，各部儿郎与勇士，长箭引满随孤策马，逼明皇开贡互市！' },
            { speaker: 'player', text: '愿随俺答将军共赴通州之战，大破明朝敌军！' },
        ],
    },

    // #380 兹林斯基 (1508 ~ 1566) — 公元1566年锡盖特堡之战
    gen_nikola_zrinski: {
        generalId: 'gen_nikola_zrinski',
        battleName: '锡盖特堡之战',
        battleYear: 1566,
        battleType: 'siege',
        role: 'defender',
        targetName: '锡盖特堡要塞',
        targetCityId: 'city_gradeci',
        targetLat: 45.81,
        targetLng: 15.97,
        myTroops: 10000,
        enemyFactionId: 'osman',
        enemyFactionName: '奥斯曼帝国',
        enemyGeneralId: 'gen_suleiman',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '苏莱曼苏丹倾十万苏丹亲兵围我孤垒！外城虽焚老夫战刀未断，基督的骑士与克罗地亚勇士，随我打开城门决死冲锋，流芳百世！' },
            { speaker: 'player', text: '愿随兹林斯基将军共守锡盖特堡之战，大破奥斯曼帝国敌军！' },
        ],
    },

    // #381 北条氏康 (1515 ~ 1571) — 公元1546年河越之战
    sagami_beitiaoshikang: {
        generalId: 'sagami_beitiaoshikang',
        battleName: '河越之战',
        battleYear: 1546,
        battleType: 'field',
        role: 'attacker',
        targetName: '武藏河越城下',
        targetCityId: 'city_edo',
        targetLat: 35.75,
        targetLng: 139.8007,
        myTroops: 15000,
        enemyFactionId: 'uesugi',
        enemyFactionName: '关东联军',
        enemyGeneralId: 'echigo_shangshanqianxin',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '关东管领聚八万乌合围我河越城半年！敌军懈怠营中酗酒，相模儿郎脱去战甲轻装夜行，壮士，随相模之狮夜袭踏平八万敌营！' },
            { speaker: 'player', text: '愿随北条氏康将军共赴河越之战，大破关东联军敌军！' },
        ],
    },

    // #382 莽应龙 (1516 ~ 1581) — 公元1569年阿瑜陀耶之战
    hantawadi_mangyinglong: {
        generalId: 'hantawadi_mangyinglong',
        battleName: '阿瑜陀耶之战',
        battleYear: 1569,
        battleType: 'siege',
        role: 'attacker',
        targetName: '阿瑜陀耶城下',
        targetCityId: 'city_ayutthaya',
        targetLat: 14.35,
        targetLng: 100.58,
        myTroops: 50000,
        enemyFactionId: 'siam',
        enemyFactionName: '阿瑜陀耶暹罗王国',
        enemyGeneralId: 'bfe_mahathammaracha',   // 🔴 [2026-10-25 按史] 1569 阿瑜陀耶守方＝玛欣他拉提拉（纳黎萱时年 14、在缅方）
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '暹罗白象王抗拒天威拒纳盟贡！缅甸水陆大象与火器大军掘壕围城十月，勇士，持战斧随勃印曩大王踏平坚城，混一中南半岛！' },
            { speaker: 'player', text: '愿随莽应龙将军共赴阿瑜陀耶之战，大破阿瑜陀耶暹罗王国敌军！' },
        ],
    },

    // #383 莽瑞体 (1516 ~ 1550) — 公元1538年勃固之战
    dongxu_mangruiti: {
        generalId: 'dongxu_mangruiti',
        battleName: '勃固之战',
        battleYear: 1538,
        battleType: 'siege',
        role: 'attacker',
        targetName: '勃固城下',
        targetCityId: 'city_bago',
        targetLat: 17.3333,
        targetLng: 96.4667,
        myTroops: 40000,
        enemyFactionId: 'hantawadi',
        enemyFactionName: '白古王国',
        enemyGeneralId: 'bfe_takayutpi',   // 🔴 [2026-10-25 按史] 1538 勃固守方＝多迦逾毕（莽应龙是东吁一方主将）
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '孟族古都据守海湾天险，老王虽坚其众已乱！葡萄牙火枪手与东吁战象并力攻城，勇士们，执盾随国王踏平护城壕，立东吁霸业！' },
            { speaker: 'player', text: '愿随莽瑞体将军共赴勃固之战，大破白古王国敌军！' },
        ],
    },

    // #384 今川义元 (1519 ~ 1560) — 公元1548年小豆坂之战
    jinchuan_jinchuanyiyuan: {
        generalId: 'jinchuan_jinchuanyiyuan',
        battleName: '小豆坂之战',
        battleYear: 1548,
        battleType: 'field',
        role: 'attacker',
        targetName: '三河小豆坂',
        targetCityId: 'city_atsuta',
        targetLat: 35.12,
        targetLng: 136.95,
        myTroops: 25000,
        enemyFactionId: 'oda',
        enemyFactionName: '织田氏',
        enemyGeneralId: 'bfe_oda_nobuhide',   // 🔴 [2026-10-25 按史] 1548 小豆坂织田方主将＝织田信秀（信长时年 14，不宜作主将）
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '尾张弹正忠欲争三河，此地乃西进海道关节点！雪斋禅师与今川精骑已占高冈，东海道第一弓取在此，壮士，跨鞍随我扫灭织田！' },
            { speaker: 'player', text: '愿随今川义元将军共赴小豆坂之战，大破织田氏敌军！' },
        ],
    },

    // #385 梅嫩德斯 (1519 ~ 1574) — 公元1565年卡罗琳堡之战
    foluolida_meinendeshi: {
        generalId: 'foluolida_meinendeshi',
        battleName: '卡罗琳堡之战',
        battleYear: 1565,
        battleType: 'siege',
        role: 'attacker',
        targetName: '佛罗里达卡罗琳堡',
        targetCityId: 'city_shengaogusiding',
        targetLat: 29.897,
        targetLng: -81.313,
        myTroops: 10000,
        enemyFactionId: 'gaolu',
        enemyFactionName: '法兰西胡格诺派',
        enemyGeneralId: 'gen_laudonniere',
        enemyTroops: 12000,
        introLines: [
            { speaker: 'general', text: '法国异端竟敢在佛罗里达海岸私建城堡阻断西班牙航路！飓风暴雨正是突袭良机，远征骑士，随总督涉沼泽踏平卡罗琳要塞！' },
            { speaker: 'player', text: '愿随梅嫩德斯将军共赴卡罗琳堡之战，大破法兰西胡格诺派敌军！' },
        ],
    },

    // #386 武田信玄 (1521 ~ 1573) — 公元1572年三方原之战
    kai_wutianxinxuan: {
        generalId: 'kai_wutianxinxuan',
        battleName: '三方原之战',
        battleYear: 1572,
        battleType: 'field',
        role: 'attacker',
        targetName: '远江三方原高地',
        targetCityId: 'city_hamamatsu',
        targetLat: 34.71,
        targetLng: 137.73,
        myTroops: 30000,
        enemyFactionId: 'tokugawa',
        enemyFactionName: '德川织田联军',
        enemyGeneralId: 'edo_dechuanjiakang',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '风林火山红旗所指，天下武家尽低头！家康狂妄轻出于平原迎敌，某鱼鳞阵已成，甲斐赤备骑兵与壮士，随信玄彻底踏平德川！' },
            { speaker: 'player', text: '愿随武田信玄将军共赴三方原之战，大破德川织田联军敌军！' },
        ],
    },

    // #387 李成梁 (1526 ~ 1615) — 公元1574年古勒城之战
    jinzhou_lichengliang: {
        generalId: 'jinzhou_lichengliang',
        battleName: '古勒城之战',
        battleYear: 1574,
        battleType: 'siege',
        role: 'attacker',
        targetName: '建州古勒山寨',
        targetCityId: 'city_salhu',
        targetLat: 41.841,
        targetLng: 124.046,
        myTroops: 20000,
        enemyFactionId: 'manzhou_d',
        enemyFactionName: '建州右卫女真',
        enemyGeneralId: 'bfe_wanggao',   // 🔴 [2026-10-25 按史] 1574 古勒寨对手＝建州右卫王杲（努尔哈赤时年 15，在李成梁帐下）
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '王杲残暴杀掠汉民阻绝边市！辽东铁骑长驱直入山险，巨石火器破其寨木，壮士，随宁远伯引辽东劲旅踏平虏巢，扬威绝域！' },
            { speaker: 'player', text: '愿随李成梁将军共赴古勒城之战，大破建州右卫女真敌军！' },
        ],
    },

    // #388 戚继光 (1528 ~ 1588) — 公元1558年岑港之战（原写台州花街：当役倭寇首领史无确名，按主人令「没名字不能算经典战役」换掉）
    qi_d_qijiguang: {
        generalId: 'qi_d_qijiguang',
        // 🔴 [2026-10-25 按史换战役] 台州花街 1561 倭寇首领史无确名（陈东 1556 已死），不当成名战；改选 1558 岑港之战——王直伏诛后其养子王滶（本名毛海峰）据舟山岑港，俞大猷与参将戚继光攻灭之（《明史纪事本末》卷55、《倭变事略》）。
        battleName: '岑港之战',
        battleYear: 1558,
        battleType: 'siege',
        role: 'attacker',
        targetName: '舟山岑港',
        targetCityId: 'city_qingyuan_zj',
        targetLat: 30.07,
        targetLng: 122.0,
        myTroops: 20000,
        enemyFactionId: 'haikou',
        enemyFactionName: '海寇',
        enemyGeneralId: 'haikou_maohaifeng',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '王直伏诛，其养子王滶（毛海峰）仍据舟山岑港，扬言为父报仇，屡败官军！总督命我与俞大猷合兵进剿——壮士，随我水陆并进，拔此海寇巢穴！' },
            { speaker: 'player', text: '愿随戚继光将军攻破岑港，剿灭王滶海寇！' },
        ],
    },

    // #389 巴布拉 (1528 ~ 1583) — 公元1575年逐葡驱逐圣约翰战（本城就地开战）

    // #390 上杉谦信 (1530 ~ 1578) — 公元1561年第四次川中岛之战
    echigo_shangshanqianxin: {
        generalId: 'echigo_shangshanqianxin',
        battleName: '第四次川中岛之战',
        battleYear: 1561,
        battleType: 'field',
        role: 'attacker',
        targetName: '信浓川中岛八幡原',
        targetCityId: 'city_ueda',
        targetLat: 36.4025,
        targetLng: 138.2464,
        myTroops: 15000,
        enemyFactionId: 'takeda',
        enemyFactionName: '武田氏',
        enemyGeneralId: 'kai_wutianxinxuan',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '毗沙门天战旗高悬！武田啄木鸟之计已被老夫识破，趁浓雾车悬阵直插八幡原！越后男儿与壮士，提太刀随谦信直取信玄本阵！' },
            { speaker: 'player', text: '愿随上杉谦信将军共赴第四次川中岛之战，大破武田氏敌军！' },
        ],
    },

    // #391 织田信长 (1534 ~ 1582) — 公元1560年桶狭间之战
    owari_zhitianxinchang: {
        generalId: 'owari_zhitianxinchang',
        battleName: '桶狭间之战',
        battleYear: 1560,
        battleType: 'field',
        role: 'attacker',
        targetName: '尾张桶狭间洼地',
        targetCityId: 'city_atsuta',
        targetLat: 35.12,
        targetLng: 136.95,
        myTroops: 10000,
        enemyFactionId: 'imagawa',
        enemyFactionName: '今川氏',
        enemyGeneralId: 'jinchuan_jinchuanyiyuan',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '人间五十年，去事宛如梦幻！今川义元四万上洛大军歇息于山洼，骤雨正歇，尾张热血男儿，随信长全军突击取义元首级！' },
            { speaker: 'player', text: '愿随织田信长将军共赴桶狭间之战，大破今川氏敌军！' },
        ],
    },

    // #392 劳塔罗 (1534 ~ 1557) — 公元1553年图卡佩尔战役（本城就地开战）
    gen_lautaro: {
        generalId: 'gen_lautaro',
        battleName: '图卡佩尔战役',
        battleYear: 1553,
        battleType: 'field',
        role: 'attacker',
        targetName: '图卡佩尔堡垒郊外',
        targetCityId: 'city_tucapel',
        targetLat: -37.7,
        targetLng: -73.4,
        myTroops: 20000,
        enemyFactionId: 'xibanya',
        enemyFactionName: '智利西班牙军',
        enemyGeneralId: 'gen_valdivia',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '西班牙侵略者自命为神，铁甲骏马终会疲累！马普切族人按波浪轮番冲锋，安第斯勇士，握紧重木战棍随我踏平征服者堡垒！' },
            { speaker: 'player', text: '愿随劳塔罗将军共赴图卡佩尔战役，大破智利西班牙军敌军！' },
        ],
    },

    // #393 权栗 (1537 ~ 1599) — 公元1593年幸州之战
    chungju_d_quanli: {
        generalId: 'chungju_d_quanli',
        battleName: '幸州之战',
        battleYear: 1593,
        battleType: 'siege',
        role: 'defender',
        targetName: '京畿道幸州山城',
        targetCityId: 'city_hanseong',
        targetLat: 37.52,
        targetLng: 126.98,
        myTroops: 15000,
        enemyFactionId: 'toyotomi',
        enemyFactionName: '日本丰臣侵朝军',
        enemyGeneralId: 'bfe_ukita_hideie',   // 🔴 [2026-10-25 按史] 1593 幸州朝鲜侵攻军总大将＝宇喜多秀家（秀吉在名护屋）
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '倭将统精兵三万连番猛攻山城，妇女运石僧兵浴血！某置飞震天雷与神机箭扼险以守，高丽壮士，坚壁执矛随元帅誓守幸州！' },
            { speaker: 'player', text: '愿随权栗将军共守幸州之战，大破日本丰臣侵朝军敌军！' },
        ],
    },

    // #394 丰臣秀吉 (1537 ~ 1598) — 公元1582年山崎之战
    hashiba_fengchenxiuji: {
        generalId: 'hashiba_fengchenxiuji',
        battleName: '山崎之战',
        battleYear: 1582,
        battleType: 'field',
        role: 'attacker',
        targetName: '山城山崎天王山',
        targetCityId: 'city_kyoto',
        targetLat: 35.01,
        targetLng: 135.77,
        myTroops: 30000,
        enemyFactionId: 'ashikaga',
        enemyFactionName: '明智氏',
        enemyGeneralId: 'gen_akechi_mitsuhide',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '明智光秀弑君本能寺天地不容！中国大返军五日三转已抵天王山下，先登者封万石，勇士们，随羽柴秀吉踏平明智军阵为主公报仇！' },
            { speaker: 'player', text: '愿随丰臣秀吉将军共赴山崎之战，大破明智氏敌军！' },
        ],
    },

    // #395 长宗我部 (1539 ~ 1599) — 公元1582年中富川之战
    chosokabe_changzongwobuyuanqin: {
        generalId: 'chosokabe_changzongwobuyuanqin',
        battleName: '中富川之战',
        battleYear: 1582,
        battleType: 'field',
        role: 'attacker',
        targetName: '阿波中富川河畔',
        targetCityId: 'city_himeji',
        targetLat: 34.8394,
        targetLng: 134.6939,
        myTroops: 25000,
        enemyFactionId: 'toyotomi',
        enemyFactionName: '三好氏',
        enemyGeneralId: 'bfe_sogo_kazumasa',   // 🔴 [2026-10-25 按史] 1582 中富川阿波方主将＝十河存保（秀吉与四国无关）
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '土佐一领具足半农半兵皆敢死之士！中富川浅滩已在眼前，渡河破敌则四国尽入掌中，壮士，执大枪随元亲冲锋一统四国！' },
            { speaker: 'player', text: '愿随长宗我部将军共赴中富川之战，大破三好氏敌军！' },
        ],
    },

    // #396 阿克巴 (1542 ~ 1605) — 公元1573年艾哈迈达巴德之战
    mowoer_akeba: {
        generalId: 'mowoer_akeba',
        battleName: '艾哈迈达巴德之战',
        battleYear: 1573,
        battleType: 'field',
        role: 'attacker',
        targetName: '艾哈迈达巴德郊外',
        targetCityId: 'city_patan',
        targetLat: 23.84,
        targetLng: 72.12,
        myTroops: 15000,
        enemyFactionId: 'gujarat',
        enemyFactionName: '古吉拉特',
        enemyGeneralId: 'bfe_muzaffar_shah',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '九天九夜狂飙八百里翻越大漠，敌军尚在梦中！大帝亲临战阵何惧顽敌，莫卧儿铁甲精骑与勇士，随朕长枪策马彻底平定西海！' },
            { speaker: 'player', text: '愿随阿克巴将军共赴艾哈迈达巴德之战，大破古吉拉特军！' },
        ],
    },

    // #397 德川家康 (1543 ~ 1616) — 公元1600年关原之战
    edo_dechuanjiakang: {
        generalId: 'edo_dechuanjiakang',
        battleName: '关原之战',
        battleYear: 1600,
        battleType: 'field',
        role: 'attacker',
        targetName: '美浓关原盆地',
        targetCityId: 'city_fuwa',
        targetLat: 35.3577,
        targetLng: 136.4602,
        myTroops: 50000,
        enemyFactionId: 'toyotomi',
        enemyFactionName: '西军诸大名联军',
        enemyGeneralId: 'gen_ishida_mitsunari',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '治部少辅兴无名之师图乱天下！浓雾已散金扇马印前趋，小早川内应已发，东军豪杰与壮士，随内府一齐冲锋，定天下大势！' },
            { speaker: 'player', text: '愿随德川家康将军共赴关原之战，大破西军诸大名联军敌军！' },
        ],
    },

    // #398 李舜臣 (1545 ~ 1598) — 公元1597年鸣梁之战（本城就地开战）
    sambyeol_lishunchen: {
        generalId: 'sambyeol_lishunchen',
        battleName: '鸣梁之战',
        battleYear: 1597,
        battleType: 'field',
        role: 'defender',
        targetName: '鸣梁海峡水域',
        targetCityId: 'city_jindo',
        targetLat: 34.487,
        targetLng: 126.263,
        myTroops: 10000,
        enemyFactionId: 'toyotomi',
        enemyFactionName: '日本水军',
        enemyGeneralId: 'bfe_todo_takakage',   // 🔴 [2026-10-25 按史] 1597 鸣梁日本水军统率＝藤堂高虎（秀吉在名护屋）
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '今臣尚存战船十二，贼虽千艘不可轻我！鸣梁险峡潮流倒卷，必死则生幸生则死，水军健儿随统制使龟船开炮，尽碎倭舰！' },
            { speaker: 'player', text: '愿随李舜臣将军共守鸣梁之战，大破日本水军敌军！' },
        ],
    },

    // 🔴 [2026-10-24 主人令「龙造寺已经删除，删干净」] 原 #399 岛津家久「冲田畷之战（1584）」——
    //    该仗守方主帅是龙造寺隆信；「龙造寺」势力无自有据点、已整家删除（见 factions.ts 2026-10-24 记录），
    //    敌将不存在 → 该成名战一并删除，避免运行时把敌将错挂成南朝「菊池武光」（1319~1373，年份不符）。

    // #400 金时敏 (1554 ~ 1592) — 公元1592年晋州之战
    sabeol_jinshimin: {
        generalId: 'sabeol_jinshimin',
        battleName: '晋州之战',
        battleYear: 1592,
        battleType: 'siege',
        role: 'defender',
        targetName: '晋州城下',
        targetCityId: 'city_suncheon_k',
        targetLat: 34.9652,
        targetLng: 127.4991,
        myTroops: 10000,
        enemyFactionId: 'toyotomi',
        enemyFactionName: '日本丰臣侵朝军',
        enemyGeneralId: 'bfe_ukita_hideie',   // 🔴 [2026-10-25 按史] 1592 第一次晋州攻城总大将＝宇喜多秀家（秀吉在名护屋）
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '倭兵三万并力犯晋州，此湖南全罗之屏障也！某已备玄字铳筒沸油毒火，死守待援，壮士，登陴随晋州牧开炮拒敌共存亡！' },
            { speaker: 'player', text: '愿随金时敏将军共守晋州之战，大破日本丰臣侵朝军敌军！' },
        ],
    },

    // #401 纳黎萱 (1555 ~ 1605) — 公元1593年廓沙拉之战
    siam_nalixuan: {
        generalId: 'siam_nalixuan',
        battleName: '廓沙拉之战',
        battleYear: 1593,
        battleType: 'field',
        role: 'defender',
        targetName: '素攀武里廊沙拉',
        targetCityId: 'city_ayutthaya',
        targetLat: 14.35,
        targetLng: 100.58,
        myTroops: 35000,
        enemyFactionId: 'dongxu',
        enemyFactionName: '缅甸东吁王国',
        enemyGeneralId: 'bfe_mingyiswa',   // 🔴 [2026-10-25 按史] 1593 廊沙拉缅军＝王储明耶苏瓦（莽应里留守勃固）
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '缅甸大军渡河犯我阿瑜陀耶！黑王子战象突入敌重围，在此狭路相逢决死象战，勇士，持长战矛随国王诛杀缅甸王储！' },
            { speaker: 'player', text: '愿随纳黎萱将军共守廓沙拉之战，大破缅甸东吁王国敌军！' },
        ],
    },

    // #402 努尔哈赤 (1559 ~ 1626) — 公元1619年萨尔浒之战（本城就地开战）
    manzhou_nuerhachi: {
        generalId: 'manzhou_nuerhachi',
        battleName: '萨尔浒之战',
        battleYear: 1619,
        battleType: 'field',
        role: 'defender',
        targetName: '萨尔浒山野',
        targetCityId: 'city_salhu',
        targetLat: 41.841,
        targetLng: 124.046,
        myTroops: 45000,
        enemyFactionId: 'ming_d',
        enemyFactionName: '明朝',
        enemyGeneralId: 'gen_yang_hao',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '凭尔几路来，我只一路去！明将杜松分兵冒进深涉山谷，八旗铁骑已据吉林崖天险，满洲勇士，随覆育列国汗冲锋横扫汉兵！' },
            { speaker: 'player', text: '愿随努尔哈赤将军共守萨尔浒之战，大破明朝敌军！' },
        ],
    },

    // #403 伊达政宗 (1567 ~ 1636) — 公元1589年摺上原之战
    date_d_yidazhengzong: {
        generalId: 'date_d_yidazhengzong',
        battleName: '摺上原之战',
        battleYear: 1589,
        battleType: 'field',
        role: 'attacker',
        targetName: '会津磐梯山摺上原',
        targetCityId: 'city_tsuruga',
        targetLat: 37.4878,
        targetLng: 139.9297,
        myTroops: 25000,
        enemyFactionId: 'toyotomi',
        enemyFactionName: '芦名佐竹联军',
        enemyGeneralId: 'bfe_ashina_yoshihiro',   // 🔴 [2026-10-25 按史] 1589 摺上原对手＝芦名义广（蒲生氏乡当时在伊势松坂）
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '芦名佐竹联兵图阻伊达霸业！摺上原逆风转顺风，黑胫巾骑兵铁炮齐发，独眼龙在此，奥羽好男儿随某横扫敌阵定会津！' },
            { speaker: 'player', text: '愿随伊达政宗将军共赴摺上原之战，大破芦名佐竹联军敌军！' },
        ],
    },

    // #404 阿拔斯 (1571 ~ 1629) — 公元1605年苏菲扬战役

    // #405 秦良玉 (1574 ~ 1648) — 公元1621年浑河之战
    tujia_d_qinliangyu: {
        generalId: 'tujia_d_qinliangyu',
        battleName: '浑河之战',
        battleYear: 1621,
        battleType: 'field',
        // 🔴 [2026-10-25 主人令「秦良玉从石柱带兵跑 1899 公里去沈阳救援，这是攻方，跑出城的都是攻方……努尔哈赤才是防守」]
        role: 'attacker',
        targetName: '沈阳浑河两岸',
        targetCityId: 'city_shenyang',
        targetLat: 41.80203,
        targetLng: 123.43689,
        myTroops: 10000,
        enemyFactionId: 'manzhou_d',
        enemyFactionName: '后金',
        enemyGeneralId: 'manzhou_nuerhachi',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '辽左陷落沈阳垂危，白杆兵万里勤王岂惜一死！长矛钩镰勾连结阵抗建州重骑，土家壮士，随某佩刀死战，报国显千秋忠烈！' },
            { speaker: 'player', text: '愿随秦良玉将军共赴浑河之战，大破后金敌军！' },
        ],
    },

    // #406 图鲁拜琥 (1582 ~ 1655) — 公元1637年青海湖之战
    khoshut_gushihan: {
        generalId: 'khoshut_gushihan',
        battleName: '青海湖之战',
        battleYear: 1637,
        battleType: 'field',
        role: 'attacker',
        targetName: '青海湖库库诺尔',
        targetCityId: 'city_fusicheng',
        targetLat: 36.76089,
        targetLng: 99.742126,
        myTroops: 30000,
        enemyFactionId: 'menggu_d',
        enemyFactionName: '喀尔喀绰克图喀拉汗',
        enemyGeneralId: 'gen_chogtu_khan',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '绰克图摧残黄教戕害雪域！和硕特八旗拔营自天山入青海，格鲁派护法法王在此，蒙古勇士，挽满硬弓随顾始汗平定青海！' },
            { speaker: 'player', text: '愿随图鲁拜琥将军共赴青海湖之战，大破喀尔喀绰克图喀拉汗敌军！' },
        ],
    },

    // #407 袁崇焕 (1584 ~ 1630) — 公元1626年宁远之战（本城就地开战）
    zu_d_yuanchonghuan: {
        generalId: 'zu_d_yuanchonghuan',
        battleName: '宁远之战',
        battleYear: 1626,
        battleType: 'siege',
        role: 'defender',
        targetName: '宁远城',
        targetCityId: 'city_ningyuan',
        targetLat: 40.618,
        targetLng: 120.72,
        myTroops: 20000,
        enemyFactionId: 'manzhou_d',
        enemyFactionName: '后金',
        enemyGeneralId: 'manzhou_nuerhachi',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '老奴引十三万铁骑席卷关外，言必克宁远！某独与坚城誓共存亡，红夷大炮药石俱备，关外壮士，随袁督师坚守杀贼立不世功！' },
            { speaker: 'player', text: '愿随袁崇焕将军共守宁远之战，大破后金敌军！' },
        ],
    },

    // #408 彭措南杰 (1586 ~ 1621) — 公元1618年后藏统一攻克羊卓战

    // #409 皇太极 (1592 ~ 1643) — 公元1642年松锦之战
    aisin_d_huangtaiji: {
        generalId: 'aisin_d_huangtaiji',
        battleName: '松锦之战',
        battleYear: 1642,
        battleType: 'field',
        role: 'attacker',
        targetName: '锦州松山乳峰山',
        // 🔴 [2026-10-24 主人令] 松山堡在锦州（41.05,121.1），原 city_songshan 是伊予松山（日本 33.8185,132.7505）；
        //    改锚 nearest 徒河（41.12,121.14，距松山堡 8km）。
        targetCityId: 'city_tuhe',
        targetLat: 41.05,
        targetLng: 121.1,
        myTroops: 35000,
        enemyFactionId: 'ming_d',
        enemyFactionName: '明朝',
        enemyGeneralId: 'gen_hong_chengchou',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '洪承畴十三万精锐粮道尽被我断于笔架山！锦州已围三年松山插翅难飞，满蒙汉八旗将士，随大清皇帝长壕合围全歼明军！' },
            { speaker: 'player', text: '愿随皇太极将军共赴松锦之战，大破明朝敌军！' },
        ],
    },

    // #410 孙传庭 (1593 ~ 1643) — 公元1642年阌乡之战
    sunqin_sunchuanting: {
        generalId: 'sunqin_sunchuanting',
        battleName: '阌乡之战',
        battleYear: 1642,
        battleType: 'field',
        role: 'attacker',
        targetName: '阌乡黑石渡沼泽',
        targetCityId: 'city_hanguguan',
        targetLat: 34.615131,
        targetLng: 110.915222,
        myTroops: 35000,
        enemyFactionId: 'dashun',
        enemyFactionName: '大顺',
        enemyGeneralId: 'dashun_lizicheng',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '闯贼流窜中原屠戮生灵！秦军火车硬弩扼守黑石隘口，老夫亲督铁骑两翼截击，壮士，随总督出死力斩贼，力保关陕！' },
            { speaker: 'player', text: '愿随孙传庭将军共赴阌乡之战，大破大顺军！' },
        ],
    },

    // #411 阿旺朗杰 (1594 ~ 1651) — 公元1639年五次击退藏巴汗之战


    // #413 卢象升 (1600 ~ 1639) — 公元1635年朱阳关之战
    luming_luxiangsheng: {
        generalId: 'luming_luxiangsheng',
        battleName: '朱阳关之战',
        battleYear: 1635,
        battleType: 'field',
        role: 'attacker',
        targetName: '汝州叶县原野',
        targetCityId: 'city_kunyang',
        targetLat: 33.22,
        targetLng: 113.22,
        myTroops: 25000,
        enemyFactionId: 'dashun',
        enemyFactionName: '闯军',
        enemyGeneralId: 'dashun_lizicheng',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '贼氛燎原践踏祖宗宗庙！天雄军忠义为旗，所向陷阵，老夫身被数创未退一步，义勇壮士，手握长刀随总督突阵平定中原！' },
            { speaker: 'player', text: '愿随卢象升将军共赴朱阳关之战，大破闯军！' },
        ],
    },

    // #414 乌梅德汗 (1600 ~ 1660) — 公元1666年收复吉大港之战（本城就地开战）

    // #415 尼古拉斯 (1600 ~ 1660) — 公元1641年姆博罗雷战役
    // 🔴 [2026-10-24 按史修正] 尼古拉斯＝Nicolás Ñeenguirú（Concepción 大酋长），1641-03-11 率耶稣会传教区
    //    瓜拉尼民兵在 Cerro Mbororé（乌拉圭河西岸，今阿根廷米西奥内斯省 Panambí，-27.72472,-54.91556）击退圣保罗 bandeira。
    //    史实兵力：瓜拉尼 4000–4200（300 支火枪＋1 门炮）vs 葡方 450 bandeirante＋2700 图皮辅助（约 3150）；
    //    葡方主将 Manuel Pires（副将 Jerónimo Pedroso de Barros）。城库无姆博罗雷据点，targetCityId 仅作最近据点锚定
    //    （伊瓜苏约 231 km），targetLat/Lng 按史实战场填，不抄据点坐标。
    gualani_nicolas: {
        generalId: 'gualani_nicolas',
        battleName: '姆博罗雷战役',
        battleYear: 1641,
        battleType: 'field',
        role: 'defender',
        targetName: '乌拉圭河姆博罗雷',
        targetCityId: 'city_yiguasu',
        targetLat: -27.72472,
        targetLng: -54.91556,
        myTroops: 4200,
        enemyFactionId: 'putaoya',
        enemyFactionName: '葡萄牙',
        enemyGeneralId: 'bfe_portuguese_officer',
        enemyTroops: 3150,
        introLines: [
            { speaker: 'general', text: '圣保罗奴隶贩子乘木筏企图焚毁教区掳掠族人！耶稣会铳剑已发，瓜拉尼的勇士们，拉紧长弓架舟封江，随我斩杀捕奴强盗！' },
            { speaker: 'player', text: '愿随尼古拉斯将军共守姆博罗雷战役，大破葡萄牙敌军！' },
        ],
    },

    // #416 李自成 (1606 ~ 1645) — 公元1642年襄城之战
    dashun_lizicheng: {
        generalId: 'dashun_lizicheng',
        battleName: '襄城之战',
        battleYear: 1642,
        battleType: 'field',
        role: 'attacker',
        targetName: '襄城郾城间平原',
        targetCityId: 'city_yancheng2',
        targetLat: 33.58,
        targetLng: 114.03,
        myTroops: 50000,
        enemyFactionId: 'ming_d',
        enemyFactionName: '明朝',
        enemyGeneralId: 'gen_wang_qiaonian',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '崇祯昏暴官逼民反，陕军汪乔年掘我祖坟辱我义军！罗汝才诸营合兵二十万并进，闯王大旗所向，壮士，随某跨马破阵生擒总督！' },
            { speaker: 'player', text: '愿随李自成将军共赴襄城之战，大破明朝敌军！' },
        ],
    },

    // #417 塔塔里诺夫 (1610 ~ 1665) — 公元1641年阿速夫保卫战

    // #418 多尔衮 (1612 ~ 1650) — 公元1644年山海关之战
    manzhou_d_duoergun: {
        generalId: 'manzhou_d_duoergun',
        battleName: '山海关之战',
        battleYear: 1644,
        battleType: 'field',
        role: 'attacker',
        targetName: '山海关一片石海滩',
        targetCityId: 'city_shanhaiguan',
        targetLat: 40,
        targetLng: 119.8,
        myTroops: 38000,
        enemyFactionId: 'dashun',
        enemyFactionName: '大顺',
        enemyGeneralId: 'dashun_lizicheng',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '闯贼破京害君，吴三桂开关请援！风沙漫天白旄一挥，八旗铁骑疾雷掩杀，壮士，握紧马槊随摄政王踏破顺军，定鼎燕京！' },
            { speaker: 'player', text: '愿随多尔衮将军共赴山海关之战，大破大顺军！' },
        ],
    },

    // #419 李定国 (1621 ~ 1662) — 公元1652年衡州之战
    guizhou_lidingguo: {
        generalId: 'guizhou_lidingguo',
        battleName: '衡州之战',
        battleYear: 1652,
        battleType: 'field',
        role: 'attacker',
        targetName: '衡州衡阳城下',
        targetCityId: 'city_linzheng',
        targetLat: 26.89,
        targetLng: 112.6,
        myTroops: 40000,
        enemyFactionId: 'manzhou_d',
        enemyFactionName: '清朝',
        enemyGeneralId: 'gen_nikan',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '誓复大明两蹶名王！满清敬谨亲王领八旗精锐来迎，象阵伏兵早已布满演武坪，壮士，拔刀随晋王陷阵合围，阵斩满洲统帅！' },
            { speaker: 'player', text: '愿随李定国将军共赴衡州之战，大破清朝敌军！' },
        ],
    },

    // #420 施琅 (1621 ~ 1696) — 公元1683年澎湖之战（本城就地开战）
    wenling_shilang: {
        generalId: 'wenling_shilang',
        battleName: '澎湖之战',
        battleYear: 1683,
        battleType: 'field',
        role: 'attacker',
        targetName: '澎湖',
        targetCityId: 'city_penghu',
        targetLat: 23.5,
        targetLng: 119.5,
        myTroops: 35000,
        enemyFactionId: 'ming_zheng',
        enemyFactionName: '明郑台湾军',
        enemyGeneralId: 'gen_liu_guoxuan',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '台湾据海孤悬三十年，此混一海宇开辟波涛之时！某以五点梅花水阵乘南风压境，壮士，乘艨艟随靖海侯炮击贼舰，克复澎湖！' },
            { speaker: 'player', text: '愿随施琅将军共赴澎湖之战，大破明郑台湾军敌军！' },
        ],
    },

    // #421 郑成功 (1624 ~ 1662) — 公元1661年热兰遮城之战（本城就地开战）
    ming_zheng_zhengchenggong: {
        generalId: 'ming_zheng_zhengchenggong',
        battleName: '热兰遮城之战',
        battleYear: 1661,
        battleType: 'siege',
        role: 'attacker',
        targetName: '承天府热兰遮城',
        targetCityId: 'city_tainan',
        targetLat: 22.99,
        targetLng: 120.2,
        myTroops: 20000,
        enemyFactionId: 'voc',
        enemyFactionName: '荷兰东印度公司',
        enemyGeneralId: 'bfe_coyett',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '台湾者中国之土地也！红毛荷兰窃据三十八年，今大明铁人军乘潮登鹿耳门，壮士，随国姓爷战船火炮齐发，驱除荷夷光复东宁！' },
            { speaker: 'player', text: '愿随郑成功将军共赴热兰遮城之战，大破荷兰东印度公司敌军！' },
        ],
    },

    // #422 索别斯基 (1629 ~ 1696) — 公元1683年维也纳之战
    bolan_suobiesiji: {
        generalId: 'bolan_suobiesiji',
        battleName: '维也纳之战',
        battleYear: 1683,
        battleType: 'field',
        role: 'attacker',
        targetName: '维也纳卡伦堡山丘',
        targetCityId: 'city_weiyeena',
        targetLat: 48.2,
        targetLng: 16.37,
        myTroops: 40000,
        enemyFactionId: 'osman',
        enemyFactionName: '奥斯曼帝国',
        enemyGeneralId: 'gen_kara_mustafa',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '维也纳城墙已塌破在旦夕，异教徒将毁灭基督教欧洲！翼骑兵的羽翼在风中轰鸣，勇士们，端平超长矛随波兰国王冲入敌营！' },
            { speaker: 'player', text: '愿随索别斯基将军共赴维也纳之战，大破奥斯曼帝国敌军！' },
        ],
    },

    // #423 噶尔丹 (1645 ~ 1697) — 公元1690年乌兰布通之战
    oirat_ming_gaerdan: {
        generalId: 'oirat_ming_gaerdan',
        battleName: '乌兰布通之战',
        battleYear: 1690,
        battleType: 'field',
        role: 'defender',
        targetName: '赤峰乌兰布通高岗',
        targetCityId: 'city_yingchang',
        targetLat: 43.385052,
        targetLng: 116.82312,
        myTroops: 30000,
        enemyFactionId: 'manzhou_d',
        enemyFactionName: '清朝',
        enemyGeneralId: 'bfe_fuquan',   // 🔴 [2026-10-25 按史] 1690 乌兰布通清军＝抚远大将军福全（康熙病返博洛和屯）
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '清帝发重兵压准噶尔境！某率卫拉特铁骑连营据山坚守、控弦待发，卫拉特蒙古勇士，随博硕克图汗血战待击！' },
            { speaker: 'player', text: '愿随噶尔丹将军共守乌兰布通之战，大破清朝敌军！' },
        ],
    },

    // #424 舒伦堡 (1661 ~ 1747) — 公元1716年科孚岛保卫战（本城就地开战）

    // #425 彼得大帝 (1672 ~ 1725) — 公元1709年波尔塔瓦战役
    eluosi_diguo_peter: {
        generalId: 'eluosi_diguo_peter',
        battleName: '波尔塔瓦战役',
        battleYear: 1709,
        battleType: 'field',
        role: 'attacker',
        targetName: '乌克兰波尔塔瓦原野',
        targetCityId: 'city_haerkefu',
        targetLat: 49.9935,
        targetLng: 36.2304,
        myTroops: 45000,
        enemyFactionId: 'ruidian_si',
        enemyFactionName: '瑞典帝国',
        enemyGeneralId: 'gen_charles_xii',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '瑞典北方雄狮深陷严冬泥沼！红星棱堡已锁死退路，沙皇近代近卫军炮声如雷，俄罗斯勇士，上刺刀随大帝冲锋，开创大帝国！' },
            { speaker: 'player', text: '愿随彼得大帝将军共赴波尔塔瓦战役，大破瑞典帝国敌军！' },
        ],
    },

    // #426 年羹尧 (1679 ~ 1726) — 公元1724年桌子山之战
    weiyuan_d_niangengyao: {
        generalId: 'weiyuan_d_niangengyao',
        battleName: '桌子山之战',
        battleYear: 1724,
        battleType: 'field',
        role: 'attacker',
        targetName: '青海柴达木郭密寨',
        targetCityId: 'city_dafeichuan',
        targetLat: 36.1379,
        targetLng: 100.7611,
        myTroops: 30000,
        enemyFactionId: 'khoshut',
        enemyFactionName: '青海和硕特',
        enemyGeneralId: 'gen_lobsang_danjin',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '罗卜藏丹津妄图再乱西陲！抚远大将军发铁骑人衔枚马裹蹄穷追千里直捣贼帐，壮士，随抚帅雪夜分道包抄，彻底底定青海！' },
            { speaker: 'player', text: '愿随年羹尧将军共赴桌子山之战，大破罗卜藏丹津军！' },
        ],
    },

    // #427 岳钟琪 (1686 ~ 1754) — 公元1720年拉萨之战
    qinghai_yuezhongqi: {
        generalId: 'qinghai_yuezhongqi',
        battleName: '拉萨之战',
        battleYear: 1720,
        battleType: 'siege',
        role: 'attacker',
        targetName: '巴塘理塘木栅坚寨',
        targetCityId: 'city_litangzong',
        targetLat: 30,
        targetLng: 100.27,
        myTroops: 20000,
        enemyFactionId: 'dzungar',
        enemyFactionName: '准噶尔西藏守军',
        enemyGeneralId: 'bfe_tsering_dondub',   // 🔴 [2026-10-25 按史] 1720 西藏准噶尔守军＝大策凌敦多布（噶勒丹策凌 1727 才继位）
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '准噶尔寇乱西藏戕害达赖！某为前锋提绿营穿雪山峡谷夺三桥踏平巴塘，壮士，持火绳枪随威信公长驱入拉萨，扬大清龙旗！' },
            { speaker: 'player', text: '愿随岳钟琪将军共赴拉萨之战，大破准噶尔西藏守军敌军！' },
        ],
    },

    // #428 噶勒丹策凌 (1695 ~ 1745) — 公元1731年和通泊之战
    dzungar_galedanceling: {
        generalId: 'dzungar_galedanceling',
        battleName: '和通泊之战',
        battleYear: 1731,
        battleType: 'field',
        role: 'attacker',
        targetName: '科布多和通泊湖畔',
        targetCityId: 'city_kobdo',
        targetLat: 48.01,
        targetLng: 91.64,
        myTroops: 30000,
        enemyFactionId: 'manzhou_d',
        enemyFactionName: '清朝',
        enemyGeneralId: 'gen_furdan',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '清廷北路大将军傅尔丹远涉科布多！某引诱其深进和通泊沼泽乱石滩合围，准噶尔骑射勇士，随台吉四面合抄全歼清军主力！' },
            { speaker: 'player', text: '愿随噶勒丹策凌将军共赴和通泊之战，大破清朝敌军！' },
        ],
    },

    // #429 布拉斯莱索 (1700 ~ 1765) — 公元1741年卡塔赫纳战役（本城就地开战）
    jialebi_brasilesuo: {
        generalId: 'jialebi_brasilesuo',
        battleName: '卡塔赫纳战役',
        battleYear: 1741,
        battleType: 'siege',
        role: 'defender',
        targetName: '卡塔赫纳圣菲利佩堡',
        targetCityId: 'city_katachena',
        targetLat: 10.4266,
        targetLng: -75.5442,
        myTroops: 10000,
        enemyFactionId: 'yinggelan',
        enemyFactionName: '大英帝国皇家海军',
        enemyGeneralId: 'gen_vernon',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '英国皇家海军百艘战舰倾泻炮火企图夺我加勒比！老夫虽独眼一腿一臂，圣菲利佩棱堡永不可破，勇士，随海军中将开炮破舰！' },
            { speaker: 'player', text: '愿随布拉斯莱索将军共守卡塔赫纳战役，大破大英帝国皇家海军敌军！' },
        ],
    },

    // #430 雍笈牙 (1714 ~ 1760) — 公元1757年勃固之战
    konbaung_yongjiya: {
        generalId: 'konbaung_yongjiya',
        battleName: '勃固之战',
        battleYear: 1757,
        battleType: 'siege',
        role: 'attacker',
        targetName: '勃固城下',
        targetCityId: 'city_bago',
        targetLat: 17.3333,
        targetLng: 96.4667,
        myTroops: 40000,
        enemyFactionId: 'hantawadi',
        enemyFactionName: '后复兴汉达瓦底',
        enemyGeneralId: 'gen_binnya_dala',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '孟族再陷阿瓦践踏缅人尊严！瑞波村木栅已扩为帝国洪流，战象轰击城门，缅甸好男儿，随雍笈牙大王拔取勃固一统江山！' },
            { speaker: 'player', text: '愿随雍笈牙将军共赴勃固之战，大破后复兴汉达瓦底敌军！' },
        ],
    },

    // #431 阿桂 (1717 ~ 1797) — 公元1775年勒乌围之战（本城就地开战）
    agui: {
        generalId: 'agui',
        battleName: '勒乌围之战',
        battleYear: 1775,
        battleType: 'siege',
        role: 'attacker',
        targetName: '金川勒乌围石碉',
        targetCityId: 'city_meinuozhai',
        targetLat: 31,
        targetLng: 102.4,
        myTroops: 40000,
        enemyFactionId: 'jinchuan_g',
        enemyFactionName: '大金川土司',
        enemyGeneralId: 'bfe_sonom',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '金川石碉倚崖拔地插翅难攻！定西将军已移巨炮开暗道连破陡险，健锐营与壮士，背负火铳随阿公攀岩陷阵，扫平顽酋！' },
            { speaker: 'player', text: '愿随阿桂将军共赴勒乌围之战，大破大金川土司敌军！' },
        ],
    },

    // #432 摩诃悉都 (1720 ~ 1800) — 公元1768年新街之战
    gen_maha_thiha_thura: {
        generalId: 'gen_maha_thiha_thura',
        battleName: '新街之战',
        battleYear: 1768,
        battleType: 'field',
        role: 'defender',
        targetName: '曼德勒新街八莫要塞',
        targetCityId: 'city_mengmao',
        targetLat: 24.01,
        targetLng: 97.85,
        myTroops: 30000,
        enemyFactionId: 'manzhou_d',
        enemyFactionName: '清朝',
        enemyGeneralId: 'gen_mingrui',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '清军经略统满洲劲旅深进丛林！某分兵断其粮道设伏象阵于新街，缅甸勇士们，密林拔刀随大将截击，让清军折戟江畔！' },
            { speaker: 'player', text: '愿随摩诃悉都将军共守新街之战，大破清朝敌军！' },
        ],
    },

    // #433 艾哈迈德 (1722 ~ 1772) — 公元1761年第三次帕尼帕特战役
    dulan_d_aihamaide: {
        generalId: 'dulan_d_aihamaide',
        battleName: '第三次帕尼帕特战役',
        battleYear: 1761,
        battleType: 'field',
        role: 'attacker',
        targetName: '帕尼帕特平原',
        targetCityId: 'city_deli',
        targetLat: 28.61,
        targetLng: 77.23,
        myTroops: 35000,
        enemyFactionId: 'deli',
        enemyFactionName: '马拉塔帝国同盟',
        enemyGeneralId: 'gen_sadashivrao',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '马拉塔百万战车妄图逐尽北方信仰！阿富汗骆驼回旋炮与重骑兵已扼断敌咽喉，普什图勇士，随珍珠之珠沙阿马踏敌营定南亚！' },
            { speaker: 'player', text: '愿随艾哈迈德将军共赴第三次帕尼帕特战役，大破马拉塔帝国同盟敌军！' },
        ],
    },


    // #435 巴都尔萨野 (1757 ~ 1797) — 公元1768年加德满都之战
    gurkha_baduersaye: {
        generalId: 'gurkha_baduersaye',
        battleName: '加德满都之战',
        battleYear: 1768,
        battleType: 'siege',
        role: 'attacker',
        targetName: '加德满都王宫大院',
        targetCityId: 'city_kathmandu',
        targetLat: 27.715138,
        targetLng: 85.185242,
        myTroops: 15000,
        enemyFactionId: 'gurkha',
        enemyFactionName: '马拉王朝',
        enemyGeneralId: 'bfe_jaya_prakash',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '因陀罗节狂欢之夜神明指引！廓尔喀弯刀嗜血无双，三谷马拉旧邦当为大尼泊尔一统，山岳勇士，握紧库克里弯刀随孤破门！' },
            { speaker: 'player', text: '愿随巴都尔萨野将军共赴加德满都之战，大破马拉王朝敌军！' },
        ],
    },

    // #436 阮福映 (1762 ~ 1820) — 公元1801年归仁攻城彻底灭西山战

    // #437 兰季特辛格 (1780 ~ 1839) — 公元1818年夺取木尔坦战役

    // #438 哈里辛格 (1791 ~ 1837) — 公元1837年贾姆鲁德战役

    // #439 石达开 (1831 ~ 1863) — 公元1855年湖口之战
    taiping_shidakai: {
        generalId: 'taiping_shidakai',
        battleName: '湖口之战',
        battleYear: 1855,
        battleType: 'field',
        role: 'attacker',
        targetName: '湖口梅家洲大江',
        targetCityId: 'city_chaisang',
        targetLat: 29.6802,
        targetLng: 115.9964,
        myTroops: 30000,
        enemyFactionId: 'manzhou_d',
        enemyFactionName: '清朝湘军水陆军',
        enemyGeneralId: 'gen_zengguofan',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '曾妖统湘军水师狂言荡平金陵！某以小舟断敌内江外江，火焚湘军巨舰逼曾国藩投水，天国将士与壮士，随翼王出击痛斩清妖！' },
            { speaker: 'player', text: '愿随石达开将军共赴湖口之战，大破清朝湘军水陆军敌军！' },
        ],
    },

    // #440 妇好 (-1220 ~ -1200) — 公元前1215年妇好伐羌之战

    // #441 舒特鲁克·纳洪特 (-1185 ~ -1155) — 公元前1158年巴比伦之战
    ailan_shuteluke: {
        generalId: 'ailan_shuteluke',
        battleName: '巴比伦之战',
        battleYear: -1158,
        battleType: 'siege',
        role: 'attacker',
        targetName: '巴比伦内城',
        targetCityId: 'city_babilun',
        targetLat: 32.542,
        targetLng: 44.421,
        myTroops: 40000,
        enemyFactionId: 'jialedi',
        enemyFactionName: '加喜特巴比伦王国',
        enemyGeneralId: 'bfe2_enlil_nadin_ahi',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '两河流域的富庶城邦尽在眼前，埃兰战车已踏破底格里斯河防线！勇士，随本王合围巴比伦城，夺取汉谟拉比法典石碑耀威苏萨！' },
            { speaker: 'player', text: '愿随舒特鲁克将军共赴巴比伦之战，大破加喜特巴比伦王国！' },
        ],
    },

    // #442 沙姆希·阿达德一世 (-1808 ~ -1776) — 公元前1796年廷巴克图之战
    // 🔴 [2026-10-20 修正] 马里在幼发拉底河畔（不是底格里斯），城库里没有马里据点 → 按模糊历史锚定同河最近的
    //    幼发拉底城邦「阿纳特」（约95公里）作攻城落点、坐标仍用马里（34.55/40.89）；敌方原本误填「亚述(yashu)」，
    //    改为守方马里王国的城邦势力「幼发拉底」，敌将仍是马里王亚赫敦林。
    guyashu_shamushi: {
        generalId: 'guyashu_shamushi',
        battleName: '廷巴克图之战',
        battleYear: -1796,
        battleType: 'siege',
        role: 'attacker',
        targetName: '幼发拉底河畔马里',
        targetCityId: 'city_anate',
        targetLat: 34.55,
        targetLng: 40.89,
        myTroops: 35000,
        enemyFactionId: 'mari_ancient',   // 🔴 [2026-10-25 按史] 敌将势力对齐
        enemyFactionName: '马里王国',
        enemyGeneralId: 'bfe2_yahdun_lim',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '阿淑尔至高之神赐予本王统御上美索不达米亚之权柄！幼发拉底河重镇马里指日可下，亚述的勇士，持铜矛随宇宙之王破城立霸！' },
            { speaker: 'player', text: '愿随沙姆希阿达德将军共赴廷巴克图之战，大破马里王国！' },
        ],
    },

    // #443 周武王姬发 (-1046 ~ -1043) — 公元前1046年牧野之战
    zhou_jifa: {
        generalId: 'zhou_jifa',
        battleName: '牧野之战',
        battleYear: -1046,
        battleType: 'field',
        role: 'attacker',
        targetName: '朝歌南郊牧野',
        targetCityId: 'city_zhaoge',   // 🔴 [2026-10-25 按史] 城库无该战场，锚最近据点 朝歌（约 30 km）
        // 🔴 [2026-10-20 主人令「牧野战场的坐标也不对吧」] 《史记·周本纪》牧野在朝歌南七十里（约30公里），今新乡卫辉一带；
        //   原写安阳 city_anyang（殷墟，离牧野约90公里）会把战场摆到安阳。不绑据点，按坐标就地开战，奖励据点取最近的朝歌。
        targetLat: 35.35,
        targetLng: 114.05,
        rewardCityId: 'city_zhaoge',   // 牧野战后周军入朝歌，商亡（《史记·周本纪》）
        myTroops: 45000,
        enemyFactionId: 'shang',
        enemyFactionName: '商朝大军',
        enemyGeneralId: 'yin_dixin',   // 🔴 子受＝帝辛，与朝歌据点武将是同一人（双身份），不再另立战场人物
        // 🔴 [2026-10-20 主人令「史记称商军七十万，这就是游戏不合理；按合理的设计兵力」]
        //    周军 4.5 万＝《史记》实数（戎车三百乘、虎贲三千、甲士四万五千）；商军不取七十万/十七万，
        //    按「守方 ≤ 攻方×2」的游戏口径取 9 万，既保「商众周寡」的史实态势，又不出现以多打少的失衡。
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '商王受无道暴虐百姓，孤率戎车三百乘、虎贲三千人、甲士四万五千人会诸侯于牧野！壮士，左杖黄钺右秉白旄，随孤一战克商！' },
            { speaker: 'player', text: '愿随姬发将军共赴牧野之战，大破商朝大军！' },
        ],
    },

    // #444 穆瓦塔里二世 (-1295 ~ -1272) — 公元前1274年卡迭石之战
    heti_muwatali: {
        generalId: 'heti_muwatali',
        battleName: '卡迭石之战',
        battleYear: -1274,
        battleType: 'field',
        role: 'attacker',
        targetName: '奥龙特斯河畔卡迭石',
        targetCityId: 'city_emesa',   // 🔴 [2026-10-20 按成名战规则④] 卡迭石（Tell Nebi Mend）在奥龙特斯河谷，最近据点＝埃梅萨（霍姆斯，约 26 公里）；原填大马士革（约 120 公里）
        targetLat: 34.558,
        targetLng: 36.519,
        myTroops: 40000,
        enemyFactionId: 'aiji',
        enemyFactionName: '新王国埃及大军',
        enemyGeneralId: 'aiji_lameisisi',   // 🔴 [2026-10-20 双身份] 拉美西斯二世就是据点武将「拉美西斯」（孟菲斯），不另用战场人物 bfe2_ramses_ii
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '埃及年轻法老轻兵冒进，阿蒙军团与拉军团已首尾脱节！赫梯三千五百乘三人重型战车已潜伏河东，勇士，随大王渡河拦腰截断敌阵！' },
            { speaker: 'player', text: '愿随穆瓦塔里二世将军共赴卡迭石之战，大破新王国埃及大军！' },
        ],
    },

    // #445 大卫王 (-1010 ~ -970) — 公元前1025年以拉谷之战（原写利乏音谷：该役史无确名敌将）
    xibolai_dawei: {
        generalId: 'xibolai_dawei',
        // 🔴 [2026-10-25 按史修复「利乏音谷敌将不明」] 利乏音谷（撒下5）未载非利士主将姓名；改选大卫最知名之战——以拉谷对歌利亚（撒上17），敌将歌利亚有本名、在场。
        battleName: '以拉谷之战',
        battleYear: -1025,
        battleType: 'field',
        role: 'defender',
        targetName: '以拉谷',
        targetCityId: 'city_yelusaleng',
        targetLat: 31.69,
        targetLng: 34.96,
        myTroops: 30000,
        enemyFactionId: 'feilisidin',
        enemyFactionName: '非利士五城同盟',
        enemyGeneralId: 'feilisidin_geliya',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '非利士大军压向以拉谷，那巨人歌利亚日日索战，以色列营中无人敢应！我奉万军之耶和华的名出战——壮士，随我过谷，斩此狂徒！' },
            { speaker: 'player', text: '愿随大卫迎战歌利亚，击破非利士军！' },
        ],
    },

    // #446 图特摩斯三世 (-1479 ~ -1425) — 公元前1457年米吉多战役

    // #447 拉美西斯二世 (-1279 ~ -1213) — 公元前1274年卡迭石之战
    aiji_lameisisi: {
        generalId: 'aiji_lameisisi',
        battleName: '卡迭石之战',
        battleYear: -1274,
        battleType: 'field',
        role: 'attacker',
        targetName: '奥龙特斯河畔卡迭石',
        targetCityId: 'city_emesa',   // 🔴 [2026-10-20 按成名战规则④] 卡迭石（Tell Nebi Mend）在奥龙特斯河谷，最近据点＝埃梅萨（霍姆斯，约 26 公里）；原填大马士革（约 120 公里）
        targetLat: 34.558,
        targetLng: 36.519,
        myTroops: 25000,
        enemyFactionId: 'heti',
        enemyFactionName: '赫梯帝国大军',
        enemyGeneralId: 'heti_muwatali',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '赫梯重型战车渡河突袭我阿蒙王帐，然战神蒙图与阿蒙神庇佑本法老！埃及的复合弓骑与近卫战车，随拉美西斯六入敌阵将赫梯人赶入河中！' },
            { speaker: 'player', text: '愿随拉美西斯二世将军共赴卡迭石之战，大破赫梯帝国大军！' },
        ],
    },

    // #448 大流士三世 (-336 ~ -330) — 公元前333年伊苏斯之战
    daliushi_iii: {
        generalId: 'daliushi_iii',
        battleName: '伊苏斯之战',
        battleYear: -333,
        battleType: 'field',
        role: 'attacker',
        targetName: '伊苏斯皮纳罗斯河畔',
        targetCityId: 'city_adana',
        targetLat: 36.838,
        targetLng: 36.165,
        myTroops: 50000,
        enemyFactionId: 'maqidun',
        enemyFactionName: '马其顿远征军',
        enemyGeneralId: 'gen_alexander_great',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '马其顿狂童亚历山大深入奇里乞亚，本万王之王已亲统不死军与希腊重装雇佣军抄其后路！波斯的勇士，随朕于皮纳罗斯河畔碾碎侵略者！' },
            { speaker: 'player', text: '愿随大流士三世将军共赴伊苏斯之战，大破马其顿远征军！' },
        ],
    },

    // #449 门农 (-360 ~ -333) — 公元前334年哈利卡纳苏斯之战
    halikanasu_memnon: {
        generalId: 'halikanasu_memnon',
        battleName: '哈利卡纳苏斯之战',
        battleYear: -334,
        battleType: 'siege',
        role: 'defender',
        targetName: '哈利卡纳苏斯城防壕沟',
        targetCityId: 'city_halikanasu',
        targetLat: 37.038,
        targetLng: 27.424,
        myTroops: 20000,
        enemyFactionId: 'maqidun',
        enemyFactionName: '马其顿攻城军',
        enemyGeneralId: 'gen_alexander_great',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '亚历山大驱攻城塔逼近卡里亚海港，深阔护城壕与双卫城固若金汤，波斯舰队已封锁爱琴海！希腊雇佣兵勇士，随门农出城夜袭焚毁敌军攻城械！' },
            { speaker: 'player', text: '愿随门农将军共守哈利卡纳苏斯之战，大破马其顿攻城军！' },
        ],
    },

    // #450 克拉特鲁斯 (-350 ~ -321) — 公元前322年克兰农战役
    maqidun_craterus: {
        generalId: 'maqidun_craterus',
        battleName: '克兰农战役',
        battleYear: -322,
        battleType: 'field',
        role: 'attacker',
        targetName: '色萨利克兰农平原',
        // 🔴 [2026-10-24 主人令] 克兰农（39.52,22.2）nearest 佩利纳 24km；原锚底比斯偏 165km。
        targetCityId: 'city_pelina',
        targetLat: 39.52,
        targetLng: 22.2,
        myTroops: 45000,
        enemyFactionId: 'xila',
        enemyFactionName: '雅典希腊反马其顿联军',
        enemyGeneralId: 'xila_antiphilus',
        enemyTroops: 28000,
        introLines: [
            { speaker: 'general', text: '雅典与埃托利亚人趁亚历山大驾崩举兵围困安提帕特，某已率东征百战老兵自奇里乞亚驰援色萨利！马其顿银盾勇士，挺起萨里沙长矛随我击溃联军！' },
            { speaker: 'player', text: '愿随克拉特鲁斯将军共赴克兰农战役，大破雅典希腊反马其顿联军！' },
        ],
    },

    // #441 申伯 — 公元前821年宣王南征谢邑封国战

    // #446 庐戢黎 — 公元前611年庸楚决战白石之战

    // #447 杰德孔苏 — 公元前600年绿洲击退柏柏尔之战

    // #457 司马穰苴 — 公元前520年击退晋燕平反封疆之战

    // #466 奥德索斯首领 — 公元前339年瓦尔纳拒击腓力二世战

    // #476 阿斯普兰斯 — 公元前325年卡曼尼亚山岳围剿战

    // #485 龙贾 — 公元前366年雕阴之战

    // #493 巴蔓子 — 公元前350年借楚兵平内乱酬楚战

    // #511 法尔纳克 — 公元前183年占领锡诺普开基之役

    // #512 毗底沙邑长 — 公元前180年抵抗巽伽东进防御战

    // #513 猎骄靡 — 公元前160年破大月氏逐出伊犁之战

    // #514 李广 — 公元前129年右北平百骑射雕出伏战

    // #515 阿波罗多洛斯 — 公元前150年查戈斯海峡拒击海盗战

    // #517 聂赤 — 公元前127年雅隆河谷一统六部之役

    // #518 多同 — 公元前111年夜郎抗且兰之乱自守战

    // #519 徐自为 — 公元前104年筑遮虏障出五原讨匈奴

    // #526 安归 — 公元前90年汉使破车师攻交河之战

    // #530 科图阿图斯 — 公元前52年塞纳布姆暴动击杀罗马商人

    // #531 姑翼 — 公元前65年温宿斩龟兹立国自守战

    // #532 子合 — 公元前50年葱岭古道截击莎车之战

    // #536 去胡来 — 公元前10年婼羌守险拒且末并吞战

    // #537 推寅 — 公元20年鲜卑大泽南迁拓土之战

    // #538 阿布加尔 — 公元30年幼发拉底河抗击罗马战

    // #539 拓跋毛 — 公元30年统领五部出石室开基战

    // #542 阿斯普尔 — 公元20年博斯普鲁斯自立击斯基泰

    // #544 任贵 — 公元42年邛都反汉自立袭越巂战

    // #546 卤承 — 公元45年昆明夷拒汉越巂平叛战

    // 🔴 [2026-10-20 主人令「先确定这些是名将吗，是的话请设定剧情事件，事件分三种，防守，攻城，野战」]
    // #550 盖萨里克 (389 ~ 477) — 公元430年希波之战（汪达尔—阿兰人渡海入阿非利加后围攻西罗马阿非利加伯爵博尼法提乌斯据守的希波，围城十四个月，圣奥古斯丁卒于围城中；出处：Possidius《奥古斯丁传》、Procopius《汪达尔战争》I.3）
    wangdaer_gaisalike: {
        generalId: 'wangdaer_gaisalike',
        battleName: '希波之战',
        battleYear: 430,
        battleType: 'siege',
        role: 'attacker',
        targetName: '希波',
        targetCityId: 'city_xibo',
        targetLat: 36.90,
        targetLng: 7.76,
        myTroops: 20000,
        enemyFactionId: 'luoma_diguo',
        enemyFactionName: '西罗马',
        enemyGeneralId: 'gen_bonifatius',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '汪达尔与阿兰之众已渡海登岸，阿非利加伯爵博尼法提乌斯退守希波。我要把这座港城团团围住，你可愿随我攻城？' },
            { speaker: 'player', text: '愿随国王围住希波，断其海陆，迫博尼法提乌斯出降！' },
        ],
    },

    // #551 博希蒙德 (1054 ~ 1111) — 公元1097年多利留姆之战（第一次十字军前锋纵队在多利留姆遭罗姆苏丹基利杰·阿尔斯兰一世伏击，博希蒙德结营死守至后队戈弗雷来援，反击大破突厥军；出处：《法兰克人行传》Gesta Francorum、安娜·科穆宁娜《阿历克塞传》）
    gen_bohemond: {
        generalId: 'gen_bohemond',
        battleName: '多利留姆之战',
        battleYear: 1097,
        battleType: 'field',
        role: 'attacker',
        targetName: '多利留姆',
        targetCityId: 'city_seyute',   // 🔴 [2026-10-25 按史] 城库无该战场，锚最近据点 瑟于特（约 40 km）
        targetLat: 39.78,
        targetLng: 30.52,
        myTroops: 20000,
        enemyFactionId: 'luomu',
        enemyFactionName: '罗姆',
        enemyGeneralId: 'luomu_jilijie',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '尼西亚已下，罗姆苏丹基利杰收拢骑兵埋伏在多利留姆一带。我率前锋先行，你可愿随我穿过安纳托利亚高原？' },
            { speaker: 'player', text: '愿随亲王前锋结阵迎敌，挡住突厥骑射，等后队来援一举击溃！' },
        ],
    },

    // #552 牟羽可汗 (730 ~ 779) — 公元762年洛阳之战（登里可汗应唐代宗之请，会同唐军于洛阳北邙山击溃史朝义，收复东都；出处：《旧唐书·回纥传》《资治通鉴》卷222）
    porbazhyn_mouyu: {
        generalId: 'porbazhyn_mouyu',
        battleName: '洛阳之战',
        battleYear: 762,
        battleType: 'field',
        role: 'attacker',
        targetName: '洛阳邙山',
        targetCityId: 'city_luoyang',
        targetLat: 34.62,
        targetLng: 112.45,
        myTroops: 40000,
        enemyFactionId: 'da_yan',
        enemyFactionName: '大燕',   // 🔴 [2026-10-20 主人令「历史叫什么就用什么」] 史朝义自称大燕（安禄山756年称帝国号大燕，史思明、史朝义沿用）
        enemyGeneralId: 'gen_shi_chaoyi',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '史朝义据洛阳不下，唐廷借我回纥兵马收复东都。我愿率骑兵先破贼阵，你可愿随我出战？' },
            { speaker: 'player', text: '愿随可汗纵马冲阵，击溃史朝义，收复洛阳！' },
        ],
    },


    // #554 鲍德温一世 (1058 ~ 1118) — 公元1105年第三次拉姆拉之战（耶路撒冷国王鲍德温一世以少击多，大破埃及法蒂玛军与大马士革图格特金联军；出处：沙特尔的富尔彻《耶路撒冷史》）
    aosiruowen_baodewen: {
        generalId: 'aosiruowen_baodewen',
        battleName: '拉姆拉之战',
        battleYear: 1105,
        battleType: 'field',
        role: 'attacker',
        targetName: '拉姆拉',
        targetCityId: 'city_yelusaleng',   // 🔴 [2026-10-25 按史] 城库无该战场，锚最近据点 耶路撒冷（约 37 km）
        targetLat: 31.93,
        targetLng: 34.87,
        myTroops: 12000,
        enemyFactionId: 'womaya',
        enemyFactionName: '倭马亚',
        enemyGeneralId: 'gen_toghtekin',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '埃及人与大马士革的图格特金联兵北上，要夺回海岸。我手中骑士不多，但绝不退让，你可愿随我迎战？' },
            { speaker: 'player', text: '愿随国王列阵迎击，击溃图格特金，守住耶路撒冷王国！' },
        ],
    },

    // 🔴 [2026-10-20 成名战剧情] 米太亚德（雅典名将）— 公元前490年马拉松之战
    gen_miltiades: {
        generalId: 'gen_miltiades',
        battleName: '马拉松之战',
        battleYear: -490,
        battleType: 'field',
        role: 'defender',
        targetName: '马拉松平原',
        targetCityId: 'city_yadian',
        targetLat: 38.12,
        targetLng: 23.98,
        myTroops: 11000,
        enemyFactionId: 'aqimeinide',
        enemyFactionName: '波斯帝国',
        enemyGeneralId: 'gen_datis',
        enemyTroops: 11000,
        introLines: [
            { speaker: 'general', text: '波斯大军已在马拉松平原登陆，雅典孤城无援！但我军重甲步兵正面可破其轻装弓骑，勇士，随我全线压上，一举冲垮蛮兵阵列！' },
            { speaker: 'player', text: '愿随米太亚德将军决战马拉松平原，大破波斯帝国敌军！' },
        ],
    },
    // 🔴 [2026-10-20 成名战剧情] 夫差（吴王）— 公元前494年夫椒之战
    wu_fuchai: {
        generalId: 'wu_fuchai',
        battleName: '夫椒之战',
        battleYear: -494,
        battleType: 'field',
        role: 'attacker',
        targetName: '太湖夫椒山',
        targetCityId: 'city_gusu',
        targetLat: 31.06,
        targetLng: 120.13,
        myTroops: 30000,
        enemyFactionId: 'yue',
        enemyFactionName: '越国',
        enemyGeneralId: 'yue_goujian',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '先王阖闾伐越殉于槜李，此仇不共戴天！越军恃勇轻进已陷湖畔泥淖，吴军精甲水陆并进，勇士，随孤生擒勾践！' },
            { speaker: 'player', text: '愿随夫差大王于夫椒山决战，大破越国敌军！' },
        ],
    },
    // 🔴 [2026-10-20 成名战剧情] 宇文宪（北周齐王）— 公元564年邙山之战
    yuwen_yuwenxian: {
        generalId: 'yuwen_yuwenxian',
        battleName: '邙山之战',
        battleYear: 564,
        battleType: 'field',
        role: 'attacker',
        targetName: '洛阳北邙山',
        targetCityId: 'city_luoyang',
        targetLat: 34.95,
        targetLng: 112.45,
        myTroops: 50000,
        enemyFactionId: 'gaoqi_d',
        enemyFactionName: '高齐',
        enemyGeneralId: 'jiyuan_huluguang',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '洛阳被围日久，北齐斛律光率精骑来援。邙山列阵，周军步骑当以严整破其锋锐——尔等随本王压阵冲其中军！' },
            { speaker: 'player', text: '愿随宇文宪将军于邙山列阵，大破北齐援军！' },
        ],
    },
    // 🔴 [2026-10-20 成名战剧情] 冈比西斯二世（波斯大王）— 公元前525年佩鲁西姆之战
    gen_cambyses: {
        generalId: 'gen_cambyses',
        battleName: '佩鲁西姆之战',
        battleYear: -525,
        battleType: 'siege',
        role: 'attacker',
        targetName: '佩鲁西姆要塞',
        targetCityId: 'city_peiluximu',
        targetLat: 31.04,
        targetLng: 32.55,
        myTroops: 50000,
        enemyFactionId: 'aiji',
        enemyFactionName: '埃及',
        enemyGeneralId: 'aiji_psamtik_iii',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '埃及门户佩鲁西姆横在尼罗河口，法老普萨美提克三世据墙死守。波斯弓手已架云梯，勇士，随本王夺下此关，尼罗河便是波斯的行省！' },
            { speaker: 'player', text: '愿随冈比西斯大王强攻佩鲁西姆，大破埃及敌军！' },
        ],
    },
    // 🔴 [2026-10-20 成名战剧情] 霍斯劳二世（萨珊）— 591 年布拉拉通之战：借拜占庭兵复国，对巴赫拉姆六世
    //    史实内战：巴赫拉姆是萨珊叛将僭主，双方同为萨珊政权，故敌方势力仍填 sashan（内战同旗属史实，非错误）
    sashan_khosrow_ii: {
        generalId: 'sashan_khosrow_ii',
        battleName: '布拉拉通之战',
        battleYear: 591,
        battleType: 'field',
        role: 'attacker',
        targetName: '布拉拉通平原',
        targetCityId: 'city_malagai',
        targetLat: 37.0,
        targetLng: 46.5,
        myTroops: 40000,
        enemyFactionId: 'sashan',
        enemyFactionName: '萨珊波斯',
        enemyGeneralId: 'sashan_bahram_vi',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '巴赫拉姆僭称万王之王，踞泰西封而辱我王室！今借拜占庭援军东归，波斯与罗马联军并进，勇士，随本王于布拉拉通平原一战定社稷！' },
            { speaker: 'player', text: '愿随霍斯劳大王于布拉拉通决战，击破巴赫拉姆叛军、复我萨珊江山！' },
        ],
    },
    gen_zengguofan: {
        generalId: 'gen_zengguofan',
        battleName: '天京之战',
        battleYear: 1864,
        battleType: 'siege',
        role: 'attacker',
        targetName: '金陵天京',
        targetCityId: 'city_nanjing',
        targetLat: 32.05,
        targetLng: 118.77,
        myTroops: 50000,
        enemyFactionId: 'taiping',
        enemyFactionName: '太平天国',
        enemyGeneralId: 'gen_li_xiucheng',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '金陵孤城，贼势已穷。本帅统湘军水陆合围，先断粮道、再破钟山营垒！壮士，随我合围天京，一战克复金陵！' },
            { speaker: 'player', text: '愿随曾帅合围天京，攻破金陵，荡平太平军！' },
        ],
    },
    hre_manfred: {
        generalId: 'hre_manfred',
        battleName: '贝内文托战役',
        battleYear: 1266,
        battleType: 'field',
        role: 'defender',
        targetName: '贝加莫贝内文托',
        targetCityId: 'city_naples',
        targetLat: 40.85,
        targetLng: 14.26,
        myTroops: 30000,
        enemyFactionId: 'xixiliwangguo',
        enemyFactionName: '坎帕尼亚',
        enemyGeneralId: 'gen_charles_i_naples',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '查理（卡洛）挟教廷之威来犯，此战关乎霍亨斯陶芬社稷！壮士，随本将在贝内文托列阵，教他知道什么是帝国之军！' },
            { speaker: 'player', text: '愿随曼弗雷德王决战贝内文托，击破卡洛军！' },
        ],
    },
    gen_ramiro_ii: {
        generalId: 'gen_ramiro_ii',
        battleName: '萨拉曼卡战役',
        battleYear: 939,
        battleType: 'field',
        role: 'defender',
        targetName: '萨拉曼卡锡曼卡斯',
        targetCityId: 'city_salamanca',
        targetLat: 40.96,
        targetLng: -5.66,
        myTroops: 45000,
        enemyFactionId: 'womaya',
        enemyFactionName: '安达卢西亚',
        enemyGeneralId: 'gen_abd_al_rahman_iii',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '阿卜杜拉倾科尔多瓦之众北犯，莱昂与卡斯蒂的国土寸步不让！壮士，随本将于西曼卡斯列阵，一战破摩尔大军！' },
            { speaker: 'player', text: '愿随拉米罗国王迎战阿卜杜拉，守住莱昂！' },
        ],
    },
    gen_mamai: {
        generalId: 'gen_mamai',
        battleName: '库利科沃战役',
        battleYear: 1380,
        battleType: 'field',
        role: 'defender',
        targetName: '顿河畔库利科沃原野',
        targetCityId: 'city_liangzan',
        targetLat: 54.62,
        targetLng: 39.74,
        myTroops: 50000,
        enemyFactionId: 'mosike_gongguo',
        enemyFactionName: '莫斯科',
        enemyGeneralId: 'gen_dmitry_donskoy',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '莫斯科的德米特里竟敢拒纳贡赋！本帅统金帐之众北征，踏平库利科沃原野，叫罗斯人再不敢抬头！' },
            { speaker: 'player', text: '愿随马麦汗征战库利科沃，击破莫斯科军！' },
        ],
    },
    gen_constantine_xi: {
        generalId: 'gen_constantine_xi',
        battleName: '君士坦丁堡之战',
        battleYear: 1453,
        battleType: 'siege',
        role: 'defender',
        targetName: '君士坦丁堡狄奥多西城墙',
        targetCityId: 'city_junshitandingbao',
        targetLat: 41.01,
        targetLng: 28.97,
        myTroops: 15000,
        enemyFactionId: 'osman',
        enemyFactionName: '奥斯曼',
        enemyGeneralId: 'osman_mehmed_ii',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '穆罕默德倾国来攻，狄奥多西城墙是罗马最后的屏障！壮士，随朕死守君士坦丁堡，与城共存亡！' },
            { speaker: 'player', text: '愿随陛下死守君士坦丁堡，击退奥斯曼大军！' },
        ],
    },
    gen_ishida_mitsunari: {
        generalId: 'gen_ishida_mitsunari',
        battleName: '关原之战',
        battleYear: 1600,
        battleType: 'field',
        role: 'defender',
        targetName: '美浓关原盆地',
        targetCityId: 'city_fuwa',
        targetLat: 35.3577,
        targetLng: 136.4602,
        myTroops: 50000,
        enemyFactionId: 'tokugawa',
        enemyFactionName: '武藏',
        enemyGeneralId: 'edo_dechuanjiakang',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '德川内府僭越犯上，西军诸将已会于关原！此战定天下归属，壮士，随本将布阵笹尾山，一战讨逆！' },
            { speaker: 'player', text: '愿随石田治部少辅于关原决战，击破德川军！' },
        ],
    },
    gen_charles_xii: {
        generalId: 'gen_charles_xii',
        battleName: '波尔塔瓦战役',
        battleYear: 1709,
        battleType: 'field',
        role: 'defender',
        targetName: '乌克兰波尔塔瓦原野',
        targetCityId: 'city_haerkefu',
        targetLat: 49.9935,
        targetLng: 36.2304,
        myTroops: 25000,
        enemyFactionId: 'eluosi_diguo',
        enemyFactionName: '俄罗斯帝国',
        enemyGeneralId: 'eluosi_diguo_peter',
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '彼得沙皇集兵波尔塔瓦，本王的卡罗林军虽疲亦不惧战！壮士，随本王冲锋，叫俄国人记住瑞典的刀锋！' },
            { speaker: 'player', text: '愿随查理国王于波尔塔瓦冲锋，击破俄军！' },
        ],
    },
    malin_abulhasan: {
        generalId: 'malin_abulhasan',
        battleName: '萨拉多河战役',
        battleYear: 1340,
        battleType: 'field',
        role: 'defender',
        targetName: '塔里法萨拉多河',
        targetCityId: 'city_xiuta',
        targetLat: 35.89,
        targetLng: -5.31,
        myTroops: 50000,
        enemyFactionId: 'kasidiliya',
        enemyFactionName: '卡斯蒂利亚',
        enemyGeneralId: 'kasidiliya_afangsuoshiyi',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '卡斯蒂利亚与葡萄牙联军竟敢陈兵萨拉多河！马林与格拉纳达之众已会，壮士，随本苏丹强渡萨拉多河，一举破敌！' },
            { speaker: 'player', text: '愿随马林苏丹于萨拉多河决战，击破卡斯蒂利亚军！' },
        ],
    },
    gen_ali_ibn_yusuf: {
        generalId: 'gen_ali_ibn_yusuf',
        battleName: '奥里基战役',
        battleYear: 1139,
        battleType: 'field',
        role: 'defender',
        targetName: '奥里基草原',
        targetCityId: 'city_lisiben',
        targetLat: 38.72,
        targetLng: -9.13,
        myTroops: 30000,
        enemyFactionId: 'putaoya',
        enemyFactionName: '葡萄牙',
        enemyGeneralId: 'gen_afonso_henriques',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '阿方索恩里克斯僭称葡萄牙之王，竟敢来犯！穆拉比特的军旗从未退过，壮士，随本埃米尔于奥里基迎战，叫他片甲不回！' },
            { speaker: 'player', text: '愿随阿里埃米尔决战奥里基，击破葡萄牙军！' },
        ],
    },
    gen_muhammad_xii: {
        generalId: 'gen_muhammad_xii',
        battleName: '格拉纳达之战',
        battleYear: 1491,
        battleType: 'siege',
        role: 'defender',
        targetName: '格拉纳达阿尔罕布拉',
        targetCityId: 'city_granada',
        targetLat: 37.17,
        targetLng: -3.6,
        myTroops: 30000,
        enemyFactionId: 'kasidiliya',
        enemyFactionName: '特拉斯塔',
        enemyGeneralId: 'gen_ferdinand_ii',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '卡斯蒂利亚大军围我格拉纳达，阿尔罕布拉宫危在旦夕！壮士，随本苏丹凭险死守，护我摩尔最后的家园！' },
            { speaker: 'player', text: '愿随格拉纳达苏丹死守阿尔罕布拉，击退卡斯蒂利亚军！' },
        ],
    },
    gen_louis_xi: {
        generalId: 'gen_louis_xi',
        battleName: '蒙特莱里战役',
        battleYear: 1465,
        battleType: 'field',
        role: 'defender',
        targetName: '巴黎近郊蒙特莱里',
        targetCityId: 'city_bali',
        targetLat: 48.85,
        targetLng: 2.35,
        myTroops: 25000,
        enemyFactionId: 'bogendigongguo',
        enemyFactionName: '勃艮第公国',
        enemyGeneralId: 'bogendi_chali',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '大胆查理联结诸侯作乱，法兰西王权岂容挑衅！壮士，随朕于蒙特莱里列阵，教勃艮第知道谁才是法兰西之主！' },
            { speaker: 'player', text: '愿随法王决战蒙特莱里，击破勃艮第军！' },
        ],
    },
    gen_boucicaut: {
        generalId: 'gen_boucicaut',
        battleName: '阿金库尔战役',
        battleYear: 1415,
        battleType: 'field',
        role: 'attacker',
        targetName: '加来近郊阿金库尔林间',
        targetCityId: 'city_calais',
        targetLat: 50.95,
        targetLng: 1.85,
        myTroops: 24000,
        enemyFactionId: 'yinggelan',
        enemyFactionName: '英格兰',
        enemyGeneralId: 'gen_henry_v',
        enemyTroops: 12000,
        introLines: [
            { speaker: 'general', text: '英王亨利孤军深入，法军十倍于敌！壮士，随本元帅于阿金库尔列阵，围歼英军，为法兰西雪耻！' },
            { speaker: 'player', text: '愿随布锡考特元帅决战阿金库尔，击破英军！' },
        ],
    },
    gen_suffolk: {
        generalId: 'gen_suffolk',
        battleName: '奥尔良之战',
        battleYear: 1429,
        battleType: 'siege',
        role: 'defender',
        targetName: '奥尔良托雷勒要塞',
        targetCityId: 'city_chambord',
        targetLat: 47.616,
        targetLng: 1.517,
        myTroops: 18000,
        enemyFactionId: 'gaolu',
        enemyFactionName: '奥尔良公国',
        enemyGeneralId: 'gen_joanofarc',
        enemyTroops: 12000,
        introLines: [
            { speaker: 'general', text: '奥尔良城破在即，法兰西竟遣一介村姑来援？壮士，随本伯爵据垒迎击，叫那圣女有来无回！' },
            { speaker: 'player', text: '愿随萨福克伯爵死围奥尔良，击破法军援兵！' },
        ],
    },
    jinzhang_nogai: {
        generalId: 'jinzhang_nogai',
        battleName: '德鲁斯塔尔之战',
        battleYear: 1278,
        battleType: 'siege',
        role: 'attacker',
        targetName: '德鲁斯塔尔',
        targetCityId: 'city_delusitaer',
        targetLat: 44.12,
        targetLng: 27.26,
        myTroops: 35000,
        enemyFactionId: 'baojialiya',
        enemyFactionName: '多布罗加',
        enemyGeneralId: 'gen_ivaylo',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '伊瓦伊洛这牧猪奴竟敢聚众作乱！金帐的兵锋从未退过，壮士，随本帅于德鲁斯塔尔列阵，一战碾碎叛军！' },
            { speaker: 'player', text: '愿随那海元帅决战德鲁斯塔尔，击破伊瓦伊洛！' },
        ],
    },
    baizanting_nikephoros_i: {
        generalId: 'baizanting_nikephoros_i',
        battleName: '普利斯卡战役',
        battleYear: 811,
        battleType: 'field',
        role: 'attacker',
        targetName: '瓦尔比察峡谷',
        targetCityId: 'city_puleisilafu',
        targetLat: 43.142315,
        targetLng: 26.813148,
        myTroops: 50000,
        enemyFactionId: 'baojialiya',   // 🔴 [2026-10-28 按史] 811 瓦尔比察—普利斯卡敌军是克鲁姆的保加利亚第一帝国；原写城名「塞尔迪卡」（错，塞尔迪卡是城不是政权）
        enemyFactionName: '保加利亚',
        enemyGeneralId: 'gen_krum',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '克鲁姆的保加尔人屡犯边陲，朕今亲征普利斯卡，必以罗马军威荡平蛮族！壮士，随朕进兵！' },
            { speaker: 'player', text: '愿随陛下亲征普利斯卡，击破保加尔军！' },
        ],
    },
    baizanting_romanosi: {
        generalId: 'baizanting_romanosi',
        battleName: '阿海洛战役',
        battleYear: 917,
        battleType: 'field',
        role: 'defender',
        targetName: '安基阿鲁斯阿海洛河',
        targetCityId: 'city_waerna',
        targetLat: 43.214,
        targetLng: 27.915,
        myTroops: 50000,
        enemyFactionId: 'baojialiya',   // 🔴 [2026-10-28 按史] 917 阿海洛敌军是西美昂的保加利亚第一帝国；原写「色雷斯」地名（错）
        enemyFactionName: '保加利亚',
        enemyGeneralId: 'gen_simeon_great',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '西美昂僭称沙皇，竟敢犯我色雷斯！壮士，随朕于阿海洛布阵，叫保加尔人知道罗马的箭雨！' },
            { speaker: 'player', text: '愿随罗曼努斯皇帝决战阿海洛，击破西美昂！' },
        ],
    },
    gen_wang_ji: {
        generalId: 'gen_wang_ji',
        battleName: '麓川之战',
        battleYear: 1441,
        battleType: 'field',
        role: 'attacker',
        targetName: '保山潞江东岸',
        targetCityId: 'city_baoshan',
        targetLat: 25.11,
        targetLng: 99.16,
        myTroops: 40000,
        enemyFactionId: 'luchuan',
        enemyFactionName: '麓川',
        enemyGeneralId: 'luchuan_sirenfa',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '麓川思任发叛服无常，本帅奉旨三征麓川！壮士，随本帅渡潞江，直捣叛巢，不破麓川不还师！' },
            { speaker: 'player', text: '愿随王尚书三征麓川，渡潞江破叛军！' },
        ],
    },
    gen_vukasin: {
        generalId: 'gen_vukasin',
        battleName: '马里查战役',
        battleYear: 1371,
        battleType: 'field',
        role: 'defender',
        targetName: '斯维伦格勒马里查河畔',
        targetCityId: 'city_aidiernei',
        targetLat: 41.6781,
        targetLng: 26.5591,
        myTroops: 30000,
        enemyFactionId: 'osman',
        enemyFactionName: '鲁米利亚',
        enemyGeneralId: 'lumiliya_lalashahin',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '奥斯曼人犯我塞尔维亚疆土，本公与弟乌格列沙尽起马其顿之众！壮士，随本公于马里查河列阵，教突厥人有来无回！' },
            { speaker: 'player', text: '愿随武卡辛公决战马里查河，击破奥斯曼军！' },
        ],
    },
    gen_yang_hao: {
        generalId: 'gen_yang_hao',
        battleName: '萨尔浒之战',
        battleYear: 1619,
        battleType: 'field',
        role: 'attacker',
        targetName: '萨尔浒山野',
        targetCityId: 'city_salhu',
        targetLat: 41.841,
        targetLng: 124.046,
        myTroops: 50000,
        enemyFactionId: 'manzhou_d',
        enemyFactionName: '爱新觉罗',
        enemyGeneralId: 'manzhou_nuerhachi',
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '建州女真叛明自立，本经略统四路大军誓师辽左！壮士，随本经略进兵萨尔浒，一战荡平努尔哈赤！' },
            { speaker: 'player', text: '愿随杨经略四路进兵萨尔浒，击破建州军！' },
        ],
    },
    tubo_xinuoluo: {
        generalId: 'tubo_xinuoluo',
        battleName: '瓜州之战',
        battleYear: 727,
        battleType: 'siege',
        role: 'attacker',
        targetName: '瓜州晋昌',
        targetCityId: 'city_jinchangcheng',
        targetLat: 40.5346,
        targetLng: 95.820007,
        myTroops: 40000,
        enemyFactionId: 'tang',
        enemyFactionName: '瓜州',
        enemyGeneralId: 'guazhou_zhangshougui',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '瓜州晋昌孤城在望，瓜州张守珪据守其中。悉诺逻恭禄今提兵攻城，壮士，随本将破城立功！' },
            { speaker: 'player', text: '愿随悉诺逻恭禄将军于瓜州之战决战，击破张守珪！' },
        ],
    },
    menggu_d_mongke: {
        generalId: 'menggu_d_mongke',
        battleName: '钓鱼城之战',
        battleYear: 1259,
        battleType: 'siege',
        role: 'attacker',
        targetName: '钓鱼城',
        targetCityId: 'city_diaoyucheng',
        targetLat: 30.04,
        targetLng: 106.3,
        myTroops: 40000,
        enemyFactionId: 'song',
        enemyFactionName: '合州',
        enemyGeneralId: 'hezhou_wangjian',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '钓鱼城孤城在望，合州王坚据守其中。蒙哥今提兵攻城，壮士，随本将破城立功！' },
            { speaker: 'player', text: '愿随蒙哥将军于钓鱼城之战决战，击破王坚！' },
        ],
    },
    gen_akechi_mitsuhide: {
        generalId: 'gen_akechi_mitsuhide',
        battleName: '山崎之战',
        battleYear: 1582,
        battleType: 'field',
        role: 'defender',
        targetName: '山城山崎天王山',
        targetCityId: 'city_kyoto',
        targetLat: 35.01,
        targetLng: 135.77,
        myTroops: 15000,
        enemyFactionId: 'toyotomi',
        enemyFactionName: '播磨',
        enemyGeneralId: 'hashiba_fengchenxiuji',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '播磨丰臣秀吉引军来犯山城山崎天王山，明智光秀今率众迎战！壮士，随本将列阵，一战破敌！' },
            { speaker: 'player', text: '愿随明智光秀将军于山崎之战决战，击破丰臣秀吉！' },
        ],
    },
    gen_furdan: {
        generalId: 'gen_furdan',
        battleName: '和通泊之战',
        battleYear: 1731,
        battleType: 'field',
        role: 'defender',
        targetName: '科布多和通泊湖畔',
        targetCityId: 'city_kobdo',
        targetLat: 48.01,
        targetLng: 91.64,
        myTroops: 25000,
        enemyFactionId: 'dzungar',
        enemyFactionName: '绰罗斯',
        enemyGeneralId: 'bfe_xiaoceling',   // 🔴 [2026-10-25 按史] 1731 和通泊前线指挥＝小策零敦多布（噶勒丹策凌在后方定策）
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '绰罗斯噶勒丹策凌引军来犯科布多和通泊湖畔，傅尔丹今率众迎战！壮士，随本将列阵，一战破敌！' },
            { speaker: 'player', text: '愿随傅尔丹将军于和通泊之战决战，击破噶勒丹策凌！' },
        ],
    },
    gen_kangxi: {
        generalId: 'gen_kangxi',
        battleName: '乌兰布通之战',
        battleYear: 1690,
        battleType: 'field',
        role: 'attacker',
        targetName: '赤峰乌兰布通高岗',
        targetCityId: 'city_yingchang',
        targetLat: 43.385052,
        targetLng: 116.82312,
        myTroops: 50000,
        enemyFactionId: 'oirat_ming',
        enemyFactionName: '卫拉特',
        enemyGeneralId: 'oirat_ming_gaerdan',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '卫拉特噶尔丹屯兵赤峰乌兰布通高岗，康熙当先发制人！壮士，随本将进兵，一战破敌！' },
            { speaker: 'player', text: '愿随康熙将军于乌兰布通之战决战，击破噶尔丹！' },
        ],
    },
    gen_nikan: {
        generalId: 'gen_nikan',
        battleName: '衡州之战',
        battleYear: 1652,
        battleType: 'field',
        role: 'defender',
        targetName: '衡州衡阳城下',
        targetCityId: 'city_linzheng',
        targetLat: 26.89,
        targetLng: 112.6,
        myTroops: 50000,
        enemyFactionId: 'longwu',   // 🔴 [2026-10-25 按史] 敌将档案势力对齐（旗号/军团/势力色随史）
        enemyFactionName: '桂州',
        enemyGeneralId: 'guizhou_lidingguo',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '桂州李定国引军来犯衡州衡阳城下，尼堪今率众迎战！壮士，随本将列阵，一战破敌！' },
            { speaker: 'player', text: '愿随尼堪将军于衡州之战决战，击破李定国！' },
        ],
    },
    // 🔴 [2026-10-24 主人令「龙造寺已经删除，删干净」] 原龙造寺隆信本人的成名战（冲田畷之战 1584，守方）：
    //    龙造寺势力无自有据点，整家删除 → 本人武将与成名战一并删除（见 factions.ts 2026-10-24 记录）。
    gen_beg_arslan: {
        generalId: 'gen_beg_arslan',
        battleName: '红盐池之战',
        battleYear: 1473,
        battleType: 'field',
        role: 'defender',
        targetName: '鄂尔多斯红盐池',
        targetCityId: 'city_quyancheng',
        targetLat: 37.7794,
        targetLng: 107.4078,
        myTroops: 30000,
        enemyFactionId: 'ming_d',
        enemyFactionName: '东胜',
        enemyGeneralId: 'dongshengwei_wangyue',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '东胜王越引军来犯鄂尔多斯红盐池，癿加思兰今率众迎战！壮士，随本将列阵，一战破敌！' },
            { speaker: 'player', text: '愿随癿加思兰将军于红盐池之战决战，击破王越！' },
        ],
    },
    jiazini_masud: {
        generalId: 'jiazini_masud',
        battleName: '丹丹纳坎战役',
        battleYear: 1040,
        battleType: 'field',
        role: 'defender',
        targetName: '梅尔夫丹丹纳坎',
        targetCityId: 'city_merv',
        targetLat: 37.61641,
        targetLng: 62.234802,
        myTroops: 50000,
        enemyFactionId: 'wugu_d',
        enemyFactionName: '乌古斯',
        enemyGeneralId: 'wugu_d_tugelile',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '乌古斯图格里勒引军来犯梅尔夫丹丹纳坎，马斯乌德今率众迎战！壮士，随本将列阵，一战破敌！' },
            { speaker: 'player', text: '愿随马斯乌德将军于丹丹纳坎战役决战，击破图格里勒！' },
        ],
    },
    danmai_guthrum: {
        generalId: 'danmai_guthrum',
        battleName: '埃丁顿战役',
        battleYear: 878,
        battleType: 'field',
        role: 'defender',
        targetName: '埃丁顿',
        targetCityId: 'city_winchester',
        targetLat: 51.06,
        targetLng: -1.31,
        myTroops: 20000,
        enemyFactionId: 'yinggelan',
        enemyFactionName: '盎格鲁',
        enemyGeneralId: 'gen_alfred_great',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '盎格鲁阿尔弗雷德引军来犯埃丁顿，古思伦今率众迎战！壮士，随本将列阵，一战破敌！' },
            { speaker: 'player', text: '愿随古思伦将军于埃丁顿战役决战，击破阿尔弗雷德！' },
        ],
    },
    gen_juan_i_castile: {
        generalId: 'gen_juan_i_castile',
        battleName: '阿勒朱巴洛塔战役',
        battleYear: 1385,
        battleType: 'field',
        role: 'attacker',
        targetName: '莱里亚阿勒朱巴洛塔',
        targetCityId: 'city_lisiben',
        targetLat: 38.72,
        targetLng: -9.13,
        myTroops: 30000,
        enemyFactionId: 'putaoya',
        enemyFactionName: '布拉干萨家',
        enemyGeneralId: 'gen_joao_i',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '布拉干萨家若昂一世屯兵莱里亚阿勒朱巴洛塔，胡安一世当先发制人！壮士，随本将进兵，一战破敌！' },
            { speaker: 'player', text: '愿随胡安一世将军于阿勒朱巴洛塔战役决战，击破若昂一世！' },
        ],
    },
    kasidiliya_afangsuoba: {
        generalId: 'kasidiliya_afangsuoba',
        battleName: '阿拉科斯战役',
        battleYear: 1195,
        battleType: 'field',
        role: 'defender',
        targetName: '阿尔马格罗阿拉科斯',
        targetCityId: 'city_toledo',
        targetLat: 39.86,
        targetLng: -4.02,
        myTroops: 35000,
        enemyFactionId: 'muwaxide',
        enemyFactionName: '穆瓦希德',
        enemyGeneralId: 'muwaxide_yakubu',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '穆瓦希德雅库布引军来犯阿尔马格罗阿拉科斯，阿方索八世今率众迎战！壮士，随本将列阵，一战破敌！' },
            { speaker: 'player', text: '愿随阿方索八世将军于阿拉科斯战役决战，击破雅库布！' },
        ],
    },
    gen_lobsang_danjin: {
        generalId: 'gen_lobsang_danjin',
        battleName: '桌子山之战',
        battleYear: 1724,
        battleType: 'field',
        role: 'defender',
        targetName: '青海柴达木郭密寨',
        targetCityId: 'city_dafeichuan',
        targetLat: 36.1379,
        targetLng: 100.7611,
        myTroops: 40000,
        enemyFactionId: 'manzhou_d',
        enemyFactionName: '亹源',
        enemyGeneralId: 'weiyuan_d_niangengyao',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '亹源年羹尧引军来犯青海柴达木郭密寨，罗卜藏丹津今率众迎战！壮士，随本将列阵，一战破敌！' },
            { speaker: 'player', text: '愿随罗卜藏丹津将军于桌子山之战决战，击破年羹尧！' },
        ],
    },
    gen_nanda_bayin: {
        generalId: 'gen_nanda_bayin',
        battleName: '廓沙拉之战',
        battleYear: 1593,
        battleType: 'field',
        role: 'attacker',
        targetName: '素攀武里廊沙拉',
        targetCityId: 'city_ayutthaya',
        targetLat: 14.35,
        targetLng: 100.58,
        myTroops: 50000,
        enemyFactionId: 'siam',
        enemyFactionName: '暹罗',
        enemyGeneralId: 'siam_nalixuan',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '暹罗纳黎萱屯兵素攀武里廊沙拉，莽应里当先发制人！壮士，随本将进兵，一战破敌！' },
            { speaker: 'player', text: '愿随莽应里将军于廓沙拉之战决战，击破纳黎萱！' },
        ],
    },
    gen_liu_guoxuan: {
        generalId: 'gen_liu_guoxuan',
        battleName: '澎湖之战',
        battleYear: 1683,
        battleType: 'field',
        role: 'defender',
        targetName: '澎湖',
        targetCityId: 'city_penghu',
        targetLat: 23.5,
        targetLng: 119.5,
        myTroops: 30000,
        enemyFactionId: 'manzhou_d',
        enemyFactionName: '温陵',
        enemyGeneralId: 'wenling_shilang',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '温陵施琅引军来犯澎湖，刘国轩今率众迎战！壮士，随本将列阵，一战破敌！' },
            { speaker: 'player', text: '愿随刘国轩将军于澎湖之战决战，击破施琅！' },
        ],
    },
    zhao_gerong: {
        generalId: 'zhao_gerong',
        battleName: '滏口之战',
        battleYear: 528,
        battleType: 'field',
        role: 'defender',
        targetName: '滏口陉',
        targetCityId: 'city_handan',
        targetLat: 36.61,
        targetLng: 114.49,
        myTroops: 30000,
        enemyFactionId: 'erzhu',
        enemyFactionName: '尔朱契胡',
        enemyGeneralId: 'erzhu_erzhurong',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '尔朱尔朱荣引军来犯滏口陉，葛荣今率众迎战！壮士，随本将列阵，一战破敌！' },
            { speaker: 'player', text: '愿随葛荣将军于滏口之战决战，击破尔朱荣！' },
        ],
    },
    gen_chen_youliang: {
        generalId: 'gen_chen_youliang',
        battleName: '鄱阳湖之战',
        battleYear: 1363,
        battleType: 'field',
        role: 'attacker',
        targetName: '鄱阳湖康郎山',
        targetCityId: 'city_raozhou',
        targetLat: 28.99,
        targetLng: 116.66,
        myTroops: 50000,
        enemyFactionId: 'ming_d',
        enemyFactionName: '淮州',
        enemyGeneralId: 'huai_zhuyuanzhang',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '淮州朱元璋屯兵鄱阳湖康郎山，陈友谅当先发制人！壮士，随本将进兵，一战破敌！' },
            { speaker: 'player', text: '愿随陈友谅将军于鄱阳湖之战决战，击破朱元璋！' },
        ],
    },
    gen_razadarit: {
        generalId: 'gen_razadarit',
        battleName: '达拉之战',
        battleYear: 1415,
        battleType: 'siege',
        role: 'defender',
        targetName: '仰光达拉城',
        targetCityId: 'city_bago',
        targetLat: 17.3333,
        targetLng: 96.4667,
        myTroops: 30000,
        enemyFactionId: 'ava',
        enemyFactionName: '阿瓦王国',
        enemyGeneralId: 'ava_minye_kyawswa',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '阿瓦王国明耶觉苏瓦倾众围仰光达拉城，罗娑陀利誓与城共存亡！壮士，随本将凭城死守，叫他有来无回！' },
            { speaker: 'player', text: '愿随罗娑陀利将军于达拉之战决战，击破明耶觉苏瓦！' },
        ],
    },
    xisi_amr: {
        generalId: 'xisi_amr',
        battleName: '巴尔赫之战',
        battleYear: 900,
        battleType: 'field',
        role: 'attacker',
        targetName: '巴尔赫郊外',
        targetCityId: 'city_lanshi',
        targetLat: 36.71248,
        targetLng: 67.08252,
        myTroops: 40000,
        enemyFactionId: 'saman',
        enemyFactionName: '萨曼',
        enemyGeneralId: 'saman_yisimayi',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '萨曼伊斯玛仪屯兵巴尔赫郊外，阿姆尔当先发制人！壮士，随本将进兵，一战破敌！' },
            { speaker: 'player', text: '愿随阿姆尔将军于巴尔赫之战决战，击破伊斯玛仪！' },
        ],
    },
    song_zhaoguangyi: {
        generalId: 'song_zhaoguangyi',
        battleName: '高梁河之战',
        battleYear: 979,
        battleType: 'field',
        role: 'defender',
        targetName: '幽州高梁河',
        targetCityId: 'city_beijing',
        targetLat: 39.9,
        targetLng: 116.41,
        myTroops: 50000,
        enemyFactionId: 'liao_d',
        enemyFactionName: '耶律',
        enemyGeneralId: 'yel_yelvxiuge',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '耶律耶律休哥引军来犯幽州高梁河，赵光义今率众迎战！壮士，随本将列阵，一战破敌！' },
            { speaker: 'player', text: '愿随赵光义将军于高梁河之战决战，击破耶律休哥！' },
        ],
    },
    yilihanguo_kitbuqa: {
        generalId: 'yilihanguo_kitbuqa',
        battleName: '阿音贾鲁特战役',
        battleYear: 1260,
        battleType: 'field',
        role: 'defender',
        targetName: '阿音贾鲁特泉水山谷',
        targetCityId: 'city_damasikusi',
        targetLat: 32.53,
        targetLng: 35.44,
        myTroops: 20000,
        enemyFactionId: 'mamuluke',
        enemyFactionName: '马穆鲁克',
        enemyGeneralId: 'mamuluke_baibaisi',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '马穆鲁克拜巴尔斯引军来犯阿音贾鲁特泉水山谷，怯的不花今率众迎战！壮士，随本将列阵，一战破敌！' },
            { speaker: 'player', text: '愿随怯的不花将军于阿音贾鲁特战役决战，击破拜巴尔斯！' },
        ],
    },
    gen_kara_mustafa: {
        generalId: 'gen_kara_mustafa',
        battleName: '维也纳之战',
        battleYear: 1683,
        battleType: 'field',
        role: 'defender',
        targetName: '维也纳卡伦堡山丘',
        targetCityId: 'city_weiyeena',
        targetLat: 48.2,
        targetLng: 16.37,
        myTroops: 50000,
        enemyFactionId: 'bolan',
        enemyFactionName: '波兰',
        enemyGeneralId: 'bolan_suobiesiji',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '波兰索别斯基引军来犯维也纳卡伦堡山丘，卡拉穆斯塔法今率众迎战！壮士，随本将列阵，一战破敌！' },
            { speaker: 'player', text: '愿随卡拉穆斯塔法将军于维也纳之战决战，击破索别斯基！' },
        ],
    },
    gen_mustafa_pasha: {
        generalId: 'gen_mustafa_pasha',
        battleName: '马耳他之战',
        battleYear: 1565,
        battleType: 'siege',
        role: 'attacker',
        targetName: '马耳他',
        targetCityId: 'city_malta',
        targetLat: 35.9,
        targetLng: 14.44,
        myTroops: 20000,
        enemyFactionId: 'maerta_qishi',
        enemyFactionName: '圣约翰',
        enemyGeneralId: 'maerta_qishi_walaite',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '马耳他孤城在望，圣约翰瓦莱特据守其中。穆斯塔法帕夏今提兵攻城，壮士，随本将破城立功！' },
            { speaker: 'player', text: '愿随穆斯塔法帕夏将军于马耳他之战决战，击破瓦莱特！' },
        ],
    },
    womaya_abdrahman: {
        generalId: 'womaya_abdrahman',
        battleName: '普瓦捷战役',
        battleYear: 732,
        battleType: 'field',
        role: 'attacker',
        targetName: '图尔与普瓦捷之间',
        targetCityId: 'city_chambord',
        targetLat: 47.616,
        targetLng: 1.517,
        myTroops: 40000,
        enemyFactionId: 'falanji',
        enemyFactionName: '法兰克',
        enemyGeneralId: 'gen_charles_martel',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '法兰克查理马特屯兵图尔与普瓦捷之间，拉赫曼当先发制人！壮士，随本将进兵，一战破敌！' },
            { speaker: 'player', text: '愿随拉赫曼将军于普瓦捷战役决战，击破查理马特！' },
        ],
    },
    abasi_muwafake: {
        generalId: 'abasi_muwafake',
        battleName: '代尔阿库勒之战',
        battleYear: 876,
        battleType: 'field',
        role: 'defender',
        targetName: '巴格达下游代尔阿库勒',
        targetCityId: 'city_bageda',
        targetLat: 33.33,
        targetLng: 44.37,
        myTroops: 45000,
        enemyFactionId: 'xisi',
        enemyFactionName: '克尔曼',
        enemyGeneralId: 'xisi_yakubusafaer',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '克尔曼雅各布引军来犯巴格达下游代尔阿库勒，穆瓦法克今率众迎战！壮士，随本将列阵，一战破敌！' },
            { speaker: 'player', text: '愿随穆瓦法克将军于代尔阿库勒之战决战，击破雅各布！' },
        ],
    },
    sashan_bahram_vi: {
        generalId: 'sashan_bahram_vi',
        battleName: '布拉拉通之战',
        battleYear: 591,
        battleType: 'field',
        role: 'defender',
        targetName: '布拉拉通平原',
        targetCityId: 'city_malagai',
        targetLat: 37,
        targetLng: 46.5,
        myTroops: 30000,
        enemyFactionId: 'sashan',
        enemyFactionName: '萨珊',
        enemyGeneralId: 'sashan_khosrow_ii',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '萨珊霍斯劳二世引军来犯布拉拉通平原，巴赫拉姆六世今率众迎战！壮士，随本将列阵，一战破敌！' },
            { speaker: 'player', text: '愿随巴赫拉姆六世将军于布拉拉通之战决战，击破霍斯劳二世！' },
        ],
    },
    gen_sadashivrao: {
        generalId: 'gen_sadashivrao',
        battleName: '第三次帕尼帕特战役',
        battleYear: 1761,
        battleType: 'field',
        role: 'defender',
        targetName: '帕尼帕特平原',
        targetCityId: 'city_deli',
        targetLat: 28.61,
        targetLng: 77.23,
        myTroops: 50000,
        enemyFactionId: 'dulan_d',
        enemyFactionName: '杜兰尼',
        enemyGeneralId: 'dulan_d_aihamaide',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '杜兰尼艾哈迈德引军来犯帕尼帕特平原，萨达希夫今率众迎战！壮士，随本将列阵，一战破敌！' },
            { speaker: 'player', text: '愿随萨达希夫将军于第三次帕尼帕特战役决战，击破艾哈迈德！' },
        ],
    },
    gen_hemu: {
        generalId: 'gen_hemu',
        battleName: '第二次帕尼帕特战役',
        battleYear: 1556,
        battleType: 'field',
        role: 'defender',
        targetName: '帕尼帕特平原',
        targetCityId: 'city_deli',
        targetLat: 28.61,
        targetLng: 77.23,
        myTroops: 40000,
        enemyFactionId: 'mowoer',   // 🔴 [2026-10-28 按史] 1556 第二次帕尼帕特我方是莫卧儿帝国巴赫拉姆汗（阿克巴摄政）；原写「信度」（错）
        enemyFactionName: '莫卧儿帝国',
        enemyGeneralId: 'xindu_bahelamuhan',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '信度巴赫拉姆汗引军来犯帕尼帕特平原，赫穆今率众迎战！壮士，随本将列阵，一战破敌！' },
            { speaker: 'player', text: '愿随赫穆将军于第二次帕尼帕特战役决战，击破巴赫拉姆汗！' },
        ],
    },
    gen_ibrahim_lodi: {
        generalId: 'gen_ibrahim_lodi',
        battleName: '第一次帕尼帕特战役',
        battleYear: 1526,
        battleType: 'field',
        role: 'defender',
        targetName: '帕尼帕特原野',
        targetCityId: 'city_deli',
        targetLat: 28.61,
        targetLng: 77.23,
        myTroops: 40000,
        enemyFactionId: 'mowoer',
        enemyFactionName: '喀布尔斯坦',
        enemyGeneralId: 'babuer_babuer',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '喀布尔斯坦巴布尔引军来犯帕尼帕特原野，易卜拉欣洛迪今率众迎战！壮士，随本将列阵，一战破敌！' },
            { speaker: 'player', text: '愿随易卜拉欣洛迪将军于第一次帕尼帕特战役决战，击破巴布尔！' },
        ],
    },
    gen_shashanka: {
        generalId: 'gen_shashanka',
        battleName: '曲女城之战',
        battleYear: 618,
        battleType: 'field',
        role: 'defender',
        targetName: '曲女城郊',
        targetCityId: 'city_qunvcheng',
        targetLat: 27.05,
        targetLng: 79.92,
        myTroops: 50000,
        enemyFactionId: 'jieri',
        enemyFactionName: '戒日帝国',
        enemyGeneralId: 'jieri_jieriwang',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '戒日帝国哈尔沙引军来犯曲女城郊，设赏迦今率众迎战！壮士，随本将列阵，一战破敌！' },
            { speaker: 'player', text: '愿随设赏迦将军于曲女城之战决战，击破哈尔沙！' },
        ],
    },
    maidina_ali: {
        generalId: 'maidina_ali',
        battleName: '隋欣战役',
        battleYear: 657,
        battleType: 'field',
        role: 'attacker',
        targetName: '幼发拉底河隋欣',
        targetCityId: 'city_tapusakusi',
        targetLat: 35.91,
        targetLng: 38.53,
        myTroops: 50000,
        enemyFactionId: 'womaya',
        enemyFactionName: '倭马亚',
        enemyGeneralId: 'womaya_muaweiye',
        enemyTroops: 43000,
        introLines: [
            { speaker: 'general', text: '倭马亚穆阿维叶屯兵幼发拉底河隋欣，阿里当先发制人！壮士，随本将进兵，一战破敌！' },
            { speaker: 'player', text: '愿随阿里将军于隋欣战役决战，击破穆阿维叶！' },
        ],
    },
    gen_atahualpa: {
        generalId: 'gen_atahualpa',
        battleName: '卡哈马卡之战',
        battleYear: 1532,
        battleType: 'field',
        role: 'defender',
        targetName: '卡哈马卡广场',
        targetCityId: 'city_chanchan',
        targetLat: -8.11,
        targetLng: -79.07,
        myTroops: 20000,
        enemyFactionId: 'xibanya',
        enemyFactionName: '西班牙',
        enemyGeneralId: 'xibanya_pisaluo',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '西班牙皮萨罗引军来犯卡哈马卡广场，阿塔瓦尔帕今率众迎战！壮士，随本将列阵，一战破敌！' },
            { speaker: 'player', text: '愿随阿塔瓦尔帕将军于卡哈马卡之战决战，击破皮萨罗！' },
        ],
    },
    gen_valdivia: {
        generalId: 'gen_valdivia',
        battleName: '图卡佩尔战役',
        battleYear: 1553,
        battleType: 'field',
        role: 'defender',
        targetName: '图卡佩尔堡垒郊外',
        targetCityId: 'city_tucapel',
        targetLat: -37.7,
        targetLng: -73.4,
        myTroops: 10000,
        enemyFactionId: 'mapuche',
        enemyFactionName: '马普切',
        enemyGeneralId: 'gen_lautaro',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '马普切劳塔罗引军来犯图卡佩尔堡垒郊外，瓦尔迪维亚今率众迎战！壮士，随本将列阵，一战破敌！' },
            { speaker: 'player', text: '愿随瓦尔迪维亚将军于图卡佩尔战役决战，击破劳塔罗！' },
        ],
    },
    gurjara_vatsaraja: {
        generalId: 'gurjara_vatsaraja',
        battleName: '曲女城之战',
        battleYear: 790,
        battleType: 'field',
        role: 'defender',
        targetName: '卡瑙季郊外',
        targetCityId: 'city_qunvcheng',
        targetLat: 27.05,
        targetLng: 79.92,
        myTroops: 45000,
        enemyFactionId: 'boluo',
        enemyFactionName: '波罗帝国',
        enemyGeneralId: 'boluo_damoboluo',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '波罗帝国达磨波罗引军来犯卡瑙季郊外，瓦萨拉贾今率众迎战！壮士，随本将列阵，一战破敌！' },
            { speaker: 'player', text: '愿随瓦萨拉贾将军于曲女城之战决战，击破达磨波罗！' },
        ],
    },
    gurjara_nagabhata_ii: {
        generalId: 'gurjara_nagabhata_ii',
        battleName: '摩揭陀之战',
        battleYear: 820,
        battleType: 'field',
        role: 'defender',
        targetName: '卡瑙季郊外',
        targetCityId: 'city_qunvcheng',
        targetLat: 27.05,
        targetLng: 79.92,
        myTroops: 50000,
        enemyFactionId: 'boluo',
        enemyFactionName: '伐连陀',
        enemyGeneralId: 'varendra_devapala',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '伐连陀提婆波罗引军来犯卡瑙季郊外，那加巴塔二世今率众迎战！壮士，随本将列阵，一战破敌！' },
            { speaker: 'player', text: '愿随那加巴塔二世将军于摩揭陀之战决战，击破提婆波罗！' },
        ],
    },
    duonaobaojia_samuel: {
        generalId: 'duonaobaojia_samuel',
        battleName: '克雷迪昂战役',
        battleYear: 1014,
        battleType: 'field',
        role: 'defender',
        targetName: '斯特鲁马河克雷迪昂',
        targetCityId: 'city_anfeibolisi',
        targetLat: 40.82,
        targetLng: 23.85,
        myTroops: 35000,
        enemyFactionId: 'baizanting',
        enemyFactionName: '拜占庭',
        enemyGeneralId: 'gen_basil_ii',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '拜占庭巴西尔二世引军来犯斯特鲁马河克雷迪昂，萨穆伊尔今率众迎战！壮士，随本将列阵，一战破敌！' },
            { speaker: 'player', text: '愿随萨穆伊尔将军于克雷迪昂战役决战，击破巴西尔二世！' },
        ],
    },
    gen_hong_chengchou: {
        generalId: 'gen_hong_chengchou',
        battleName: '松锦之战',
        battleYear: 1642,
        battleType: 'siege',
        role: 'defender',
        targetName: '松山乳峰山',
        // 🔴 [2026-10-24 主人令] 松山堡在锦州（41.05,121.1）；原锚 city_songshan 是伊予松山（日本），改锚 nearest 徒河（距松山堡 8km）。
        targetCityId: 'city_tuhe',
        targetLat: 41.05,
        targetLng: 121.1,
        myTroops: 50000,
        enemyFactionId: 'manzhou_d',
        enemyFactionName: '大清',
        enemyGeneralId: 'aisin_d_huangtaiji',   // [FIX 2026-10-24] 原写 gen_huangtaiji（全库无此人）→ 据点在册实为 aisin_d_huangtaiji（大清·赫图阿拉）
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '皇太极举国来围松锦，洪承畴受命督师，十三万大军岂能坐困！壮士，随本督凭垒死守、待机破围！' },
            { speaker: 'player', text: '愿随洪督师死守松锦，击破清军！' },
        ],
    },
    gen_kusaila: {
        generalId: 'gen_kusaila',
        battleName: '塔胡达之战',
        battleYear: 683,
        battleType: 'field',
        role: 'attacker',
        targetName: '塔胡达',
        targetCityId: 'city_bujiaya',   // 🔴 [2026-10-25 按史] 城库无该战场，锚最近据点 布佳亚（约 189 km）
        // 🔴 [2026-10-24 主人令] 塔胡达（35.5,6.5）50km 内无据点；野战不锚 189km 外的布佳亚，按史实坐标打。

        targetLat: 35.5,
        targetLng: 6.5,
        myTroops: 40000,
        enemyFactionId: 'aguelabu',
        enemyFactionName: '阿拉伯',
        enemyGeneralId: 'gen_uqba',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '欧克巴孤军深入马格里布，本王的柏柏尔勇士已在塔胡达设伏！壮士，随本王合围，叫阿拉伯人全军覆没！' },
            { speaker: 'player', text: '愿随库赛拉王于塔胡达设伏，围歼欧克巴！' },
        ],
    },
    falanji_baodewen: {
        generalId: 'falanji_baodewen',
        battleName: '君士坦丁堡之战',
        battleYear: 1204,
        battleType: 'siege',
        role: 'attacker',
        targetName: '君士坦丁堡狄奥多西城墙',
        targetCityId: 'city_junshitandingbao',
        targetLat: 41.01,
        targetLng: 28.98,
        myTroops: 20000,
        enemyFactionId: 'baizanting',
        enemyFactionName: '拜占庭',
        enemyGeneralId: 'baizanting_alexios_v',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '君士坦丁堡富甲天下却守备空虚，本伯爵统十字军破城，拉丁帝国当立于此！壮士，随我登城！' },
            { speaker: 'player', text: '愿随鲍德温伯爵攻破君士坦丁堡！' },
        ],
    },
    gen_vasili_iii: {
        generalId: 'gen_vasili_iii',
        battleName: '斯摩棱斯克之战',
        battleYear: 1514,
        battleType: 'siege',
        role: 'attacker',
        targetName: '斯摩棱斯克城',
        targetCityId: 'city_simolengsike',
        targetLat: 54.78,
        targetLng: 32.05,
        myTroops: 30000,
        enemyFactionId: 'litaowan',
        enemyFactionName: '立陶宛',
        enemyGeneralId: 'bfe_smolensk_voivode',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '斯摩棱斯克本是罗斯故土，立陶宛据之已久！本大公亲统大军围城，夺回这座西部门户！壮士，随我攻城！' },
            { speaker: 'player', text: '愿随瓦西里大公攻取斯摩棱斯克！' },
        ],
    },
    gen_li_xiucheng: {
        generalId: 'gen_li_xiucheng',
        battleName: '雨花台之战',
        battleYear: 1862,
        battleType: 'field',
        role: 'attacker',
        targetName: '天京雨花台',
        targetCityId: 'city_nanjing',
        targetLat: 31.99,
        targetLng: 118.78,
        myTroops: 50000,
        enemyFactionId: 'manzhou_d',
        enemyFactionName: '大清',
        enemyGeneralId: 'bfe_zengguoquan',   // 🔴 [2026-10-25 按史] 1862 雨花台被围的湘军主帅＝曾国荃（曾国藩坐镇安庆）
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '湘军扎营雨花台，围我天京！本忠王亲率太平军十三王救驾，此战当破湘军营、解天京之围！壮士，随我冲阵！' },
            { speaker: 'player', text: '愿随忠王破雨花台湘军营，解天京之围！' },
        ],
    },
    zhuozhou_shisiming: {
        generalId: 'zhuozhou_shisiming',
        battleName: '邺城之战',
        battleYear: 759,
        battleType: 'field',
        role: 'attacker',
        targetName: '邺城',
        targetCityId: 'city_handan',
        targetLat: 36.33,
        targetLng: 114.4,
        myTroops: 50000,
        enemyFactionId: 'tang',
        enemyFactionName: '唐',
        enemyGeneralId: 'lingwu_guoziyi',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '唐军九节度使围我邺城，名义上六十万，实则各怀私心！本帅统范阳铁骑突阵，一战可破！壮士，随我冲！' },
            { speaker: 'player', text: '愿随史思明突阵，击破唐九节度使联军！' },
        ],
    },
    gen_suleiman: {
        generalId: 'gen_suleiman',
        battleName: '莫哈奇之战',
        battleYear: 1526,
        battleType: 'field',
        role: 'attacker',
        targetName: '莫哈奇原野',
        targetCityId: 'city_saigede',   // 🔴 [2026-10-25 按史] 城库无该战场，锚最近据点 塞格德（约 122 km）
        // 🔴 [2026-10-24 主人令] 莫哈奇（45.87,18.66）50km 内无据点；野战不锚 123km 外的塞格德，按史实坐标打。

        targetLat: 45.87,
        targetLng: 18.66,
        myTroops: 50000,
        enemyFactionId: 'mazhaer',
        enemyFactionName: '匈牙利',
        enemyGeneralId: 'gen_lajos_ii',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '匈牙利王拉约什二世集骑士之众于莫哈奇，本苏丹亲统奥斯曼大军南下，此战定匈牙利之命运！壮士，随我布阵！' },
            { speaker: 'player', text: '愿随苏莱曼苏丹决战莫哈奇，击破匈牙利军！' },
        ],
    },
    gen_bayezid_i: {
        generalId: 'gen_bayezid_i',
        battleName: '尼科堡战役',
        battleYear: 1396,
        battleType: 'field',
        role: 'attacker',
        targetName: '尼科堡',
        targetCityId: 'city_teernuowo',   // 🔴 [2026-10-25 按史] 城库无该战场，锚最近据点 特尔诺沃（约 92 km）
        // 🔴 [2026-10-24 主人令] 尼科堡（43.7,24.9）50km 内无据点；野战不锚 92km 外的特尔诺沃，按史实坐标打。

        targetLat: 43.7,
        targetLng: 24.9,
        myTroops: 30000,
        enemyFactionId: 'bafaliya',
        enemyFactionName: '神圣罗马',
        enemyGeneralId: 'bfe_sigismund',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '西吉斯蒙德纠集欧洲十字军来犯，本苏丹已在尼科堡列阵！壮士，随我以雷霆之势碾碎这群法兰克骑士！' },
            { speaker: 'player', text: '愿随巴耶济德苏丹决战尼科堡，击破十字军！' },
        ],
    },
    huarazim_jalal: {
        generalId: 'huarazim_jalal',
        battleName: '印度河之战',
        battleYear: 1221,
        battleType: 'field',
        role: 'defender',
        targetName: '印度河畔',
        targetCityId: 'city_baishawa',
        targetLat: 33.5,
        targetLng: 71.5,
        myTroops: 30000,
        enemyFactionId: 'menggu_d',
        enemyFactionName: '蒙古',
        enemyGeneralId: 'menggu_d_chengjisihan',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '成吉思汗亲追至此，花剌子模的最后一支军已退到印度河！本沙尔基亚（沙）宁死不降，壮士，随我背河死战！' },
            { speaker: 'player', text: '愿随扎兰丁背印度河死战，力拒成吉思汗！' },
        ],
    },
    gen_lajos_ii: {
        generalId: 'gen_lajos_ii',
        battleName: '莫哈奇之战',
        battleYear: 1526,
        battleType: 'field',
        role: 'defender',
        targetName: '莫哈奇原野',
        targetCityId: 'city_saigede',   // 🔴 [2026-10-25 按史] 城库无该战场，锚最近据点 塞格德（约 122 km）
        // 🔴 [2026-10-24 主人令] 莫哈奇（45.87,18.66）50km 内无据点；野战不锚 123km 外的塞格德，按史实坐标打。

        targetLat: 45.87,
        targetLng: 18.66,
        myTroops: 30000,
        enemyFactionId: 'osman',
        enemyFactionName: '奥斯曼',
        enemyGeneralId: 'gen_suleiman',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '苏莱曼倾奥斯曼之众南下，匈牙利王国存亡在此一战！壮士，随本王于莫哈奇原野列阵，死战不退！' },
            { speaker: 'player', text: '愿随拉约什国王决战莫哈奇，力拒奥斯曼大军！' },
        ],
    },
    bfe3_46: {
        generalId: 'bfe3_46',
        battleName: '阿莱西亚之战',
        battleYear: -52,
        battleType: 'siege',
        role: 'defender',
        targetName: '阿莱西亚城',
        // 🔴 [2026-10-24 主人令] 阿莱西亚（47.54,4.5）城库无对应据点；nearest 第戎 47km（原锚里昂偏 200km）。
        targetCityId: 'city_dijon',
        targetLat: 47.54,
        targetLng: 4.5,
        myTroops: 50000,
        enemyFactionId: 'luoma_diguo',
        enemyFactionName: '罗马',
        enemyGeneralId: 'gen_julius_caesar',
        enemyTroops: 38000,
        introLines: [
            { speaker: 'general', text: '凯撒倾罗马军团围我阿莱西亚，高卢诸部已约起援兵！壮士，随本王凭城死守，内外夹击，叫罗马人折戟于此！' },
            { speaker: 'player', text: '愿随维钦托利王死守阿莱西亚，击破凯撒！' },
        ],
    },
    aitiliusi: {
        generalId: 'aitiliusi',
        battleName: '沙隆之战',
        battleYear: 451,
        battleType: 'field',
        role: 'attacker',
        targetName: '卡塔隆平原沙隆',
        targetCityId: 'city_lansi',
        targetLat: 48.96,
        targetLng: 4.37,
        myTroops: 50000,
        enemyFactionId: 'xiongren',
        enemyFactionName: '匈人',
        enemyGeneralId: 'xiongren_atila',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '阿提拉已至沙隆，西罗马与西哥特联军今日同阵！壮士，随本将军据高地先发，叫匈人知道罗马的军威！' },
            { speaker: 'player', text: '愿随埃提乌斯决战沙隆，击破阿提拉！' },
        ],
    },
    bfe3_79: {
        generalId: 'bfe3_79',
        battleName: '帕尔米拉之战',
        battleYear: 272,
        battleType: 'siege',
        role: 'attacker',
        targetName: '帕尔米拉城',
        // 🔴 [2026-10-24 主人令] 城库有 city_tademoer（塔德莫尔＝帕尔米拉，34.55,38.27）；原锚大马士革偏 214km。
        targetCityId: 'city_tademoer',
        targetLat: 34.55,
        targetLng: 38.27,
        myTroops: 30000,
        enemyFactionId: 'paermila',
        enemyFactionName: '帕尔米拉',
        enemyGeneralId: 'paermila_zhinuobiya',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '帕尔米拉虽远，罗马不可分裂！朕提兵东征，先取此城，再收高卢，重归一统！壮士，随朕攻城！' },
            { speaker: 'player', text: '愿随奥勒良皇帝攻取帕尔米拉，重归一统！' },
        ],
    },
    gen_jogaila: {
        generalId: 'gen_jogaila',
        battleName: '格伦瓦德之战',
        battleYear: 1410,
        battleType: 'field',
        role: 'attacker',
        targetName: '格伦瓦德原野',
        targetCityId: 'city_gdansk',   // 🔴 [2026-10-25 按史] 城库无该战场，锚最近据点 格但斯克（约 135 km）
        // 🔴 [2026-10-24 主人令] 格伦瓦德（53.49,20.09）nearest 格但斯克仍 135km；野战不锚城，按史实坐标打。

        targetLat: 53.49,
        targetLng: 20.09,
        myTroops: 39000,
        enemyFactionId: 'tiaodun_qishi',
        enemyFactionName: '条顿骑士团',
        enemyGeneralId: 'gen_ulrich_jungingen',   // 🔴 [2026-10-25 按史] 1410 格伦瓦德条顿大团长＝乌尔里希·冯·容金根（原填奥格斯堡主教乌尔里希，卒 973，不在场）
        enemyTroops: 27000,
        introLines: [
            { speaker: 'general', text: '条顿骑士团欺我立陶宛与波兰久矣，今日两国联军会猎格伦瓦德！壮士，随朕冲阵，踏破骑士团铁甲！' },
            { speaker: 'player', text: '愿随雅盖沃国王决战格伦瓦德，击破条顿骑士团！' },
        ],
    },
    bfe3_9: {
        generalId: 'bfe3_9',
        battleName: '长平之战',
        battleYear: -260,
        battleType: 'field',
        role: 'attacker',
        targetName: '长平',
        targetCityId: 'city_shangdang',
        targetLat: 35.8,
        targetLng: 112.9,
        myTroops: 50000,
        enemyFactionId: 'zhao',
        enemyFactionName: '赵国',
        enemyGeneralId: 'zhao_lianpo',
        enemyTroops: 45000,
        introLines: [
            { speaker: 'general', text: '赵军据长平壁不出，廉颇老成！本将奉秦王之命攻坚，先夺其西垒，断其粮道！壮士，随我冲！' },
            { speaker: 'player', text: '愿随王龁将军强攻长平，击破赵军！' },
        ],
    },
    bfe3_38: {
        generalId: 'bfe3_38',
        battleName: '浚稽山之战',
        battleYear: -99,
        battleType: 'field',
        role: 'attacker',
        targetName: '浚稽山',
        targetCityId: 'city_kereyid',   // 🔴 [2026-10-25 按史] 城库无该战场，锚最近据点 汪吉河（约 80 km）
        // 🔴 [2026-10-24 主人令] 本方史实坐标（46,104）50km 内无据点；野战不锚 179km 外的浚稽山城，按史实坐标打。

        targetLat: 46,
        targetLng: 104,
        myTroops: 20000,
        enemyFactionId: 'han_d',
        enemyFactionName: '汉',
        enemyGeneralId: 'ningkou_liling',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '汉将李陵孤军深入，只五千步卒！本单于八万骑围于浚稽山，断其归路，叫他插翅难逃！' },
            { speaker: 'player', text: '愿随且鞮侯单于围歼李陵孤军！' },
        ],
    },
    bfe3_13: {
        generalId: 'bfe3_13',
        battleName: '城父之战',
        battleYear: -225,
        battleType: 'field',
        role: 'defender',
        targetName: '城父',
        // 🔴 [2026-10-24 主人令] 城父（33.5,115.8）在谯县附近 42km；原锚虎牢关偏 283km，改锚 nearest 谯县。
        targetCityId: 'city_qiaojun',
        targetLat: 33.5,
        targetLng: 115.8,
        myTroops: 40000,
        enemyFactionId: 'qin',
        enemyFactionName: '秦',
        enemyGeneralId: 'gen_li_xin',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '李信轻兵深入，三日三夜不顿舍！我楚军示弱诱之，今当追而击之！壮士，随本将反攻，破秦军！' },
            { speaker: 'player', text: '愿随项燕将军反击秦军，破李信！' },
        ],
    },
    gen_sayf_al_dawla: {
        generalId: 'gen_sayf_al_dawla',
        battleName: '阿勒颇之战',
        battleYear: 962,
        battleType: 'siege',
        role: 'defender',
        targetName: '阿勒颇城',
        targetCityId: 'city_alepo',
        targetLat: 36.2,
        targetLng: 37.16,
        myTroops: 20000,
        enemyFactionId: 'baizanting',
        enemyFactionName: '拜占庭',
        enemyGeneralId: 'baizanting_nikephoros_phokas',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '拜占庭皇帝尼基弗鲁斯倾国而来，阿勒颇城是哈姆丹之屏障！壮士，随本埃米尔凭城死守，教训希腊人！' },
            { speaker: 'player', text: '愿随赛弗道莱死守阿勒颇，击退拜占庭军！' },
        ],
    },
    bfe_antigonus: {
        generalId: 'bfe_antigonus',
        battleName: '伊普苏斯之战',
        battleYear: -301,
        battleType: 'field',
        role: 'attacker',
        targetName: '伊普苏斯平原',
        targetCityId: 'city_kailaina',
        targetLat: 38.5,
        targetLng: 30.5,
        myTroops: 50000,
        enemyFactionId: 'sailiugu',
        enemyFactionName: '塞琉古',
        enemyGeneralId: 'gen_seleucus_i',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '塞琉古、利西马科斯联军逼我亲子皆陷危局，此战定继业者之天下！壮士，随本王以战象与重骑冲阵！' },
            { speaker: 'player', text: '愿随安提柯王决战伊普苏斯，击破塞琉古联军！' },
        ],
    },
    gen_li_xin: {
        generalId: 'gen_li_xin',
        battleName: '城父之战',
        battleYear: -225,
        battleType: 'field',
        role: 'attacker',
        targetName: '城父',
        // 🔴 [2026-10-24 主人令] 城父（33.5,115.8）在谯县附近 42km；原锚虎牢关偏 283km，改锚 nearest 谯县。
        targetCityId: 'city_qiaojun',
        targetLat: 33.5,
        targetLng: 115.8,
        myTroops: 50000,
        enemyFactionId: 'chuguo',
        enemyFactionName: '楚',
        enemyGeneralId: 'bfe3_13',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '楚人怯战，本将奉秦王之命率二十万轻兵深入，三日三夜不顿舍，直取城父！壮士，随我速进，一战灭楚！' },
            { speaker: 'player', text: '愿随李信将军奔袭城父，破楚军！' },
        ],
    },
    gen_seleucus_i: {
        generalId: 'gen_seleucus_i',
        battleName: '伊普苏斯之战',
        battleYear: -301,
        battleType: 'field',
        role: 'attacker',
        targetName: '伊普苏斯平原',
        targetCityId: 'city_kailaina',
        targetLat: 38.5,
        targetLng: 30.5,
        myTroops: 50000,
        enemyFactionId: 'antigonid',
        enemyFactionName: '安提柯',
        enemyGeneralId: 'bfe_antigonus',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '安提柯独霸小亚，继业者岂能坐视！本将与利西马科斯合兵，战象先出，重骑继之！壮士，随我决战伊普苏斯！' },
            { speaker: 'player', text: '愿随塞琉古决战伊普苏斯，击破安提柯！' },
        ],
    },
    bfe2_esarhaddon: {
        generalId: 'bfe2_esarhaddon',
        battleName: '孟菲斯之战',
        battleYear: -671,
        battleType: 'siege',
        role: 'attacker',
        targetName: '孟菲斯',
        targetCityId: 'city_mengfeisi',
        targetLat: 29.85,
        targetLng: 31.25,
        myTroops: 50000,
        enemyFactionId: 'aiji',
        enemyFactionName: '埃及',
        enemyGeneralId: 'dibisi_tahaerka',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '塔哈尔卡据孟菲斯而抗亚述，本王亲统大军南下，先破下埃及诸城，再取孟菲斯！壮士，随我攻城！' },
            { speaker: 'player', text: '愿随亚述王攻取孟菲斯，击破埃及军！' },
        ],
    },
    bfe_dou_jiande: {
        generalId: 'bfe_dou_jiande',
        battleName: '虎牢关之战',
        battleYear: 621,
        battleType: 'field',
        role: 'attacker',
        targetName: '虎牢关',
        targetCityId: 'city_hulaoguan',
        targetLat: 34.81,
        targetLng: 113.17,
        myTroops: 50000,
        enemyFactionId: 'tang',
        enemyFactionName: '唐',
        enemyGeneralId: 'tang_lishimin',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '洛阳围急，本王亲率十万之众南下救之！李世民兵少，我军既至，可一战破唐！壮士，随我进兵虎牢！' },
            { speaker: 'player', text: '愿随夏王进兵虎牢，击破唐军！' },
        ],
    },
    // #FB-唐 郭孝恪 (644) — 焉耆之战（夜袭焉耆城，虏其王龙突骑支；《旧唐书·卷八三》步骑三千出银山道）
    xingxingxia_guoxiaoke: {
        generalId: 'xingxingxia_guoxiaoke',
        battleName: '焉耆之战',
        battleYear: 644,
        battleType: 'siege',
        role: 'attacker',
        targetName: '焉耆城',
        targetCityId: 'city_yanqi',
        targetLat: 42.06,
        targetLng: 86.56,
        myTroops: 10000,          // 《旧唐书·郭孝恪传》步骑三千
        enemyFactionId: 'yanqi',
        enemyFactionName: '焉耆',
        enemyGeneralId: 'yanqi_longtuqizhi',
        enemyTroops: 10000,       // 获首虏七千级为战果，按守方≤攻方×2 取上限
        introLines: [
            { speaker: 'general', text: '焉耆王龙突骑支背我归了西突厥，朝贡断绝，天山南路只当他自家门户。某今领西州道行军总管，率步骑三千出银山道——今夜浮水登城，先取此王！' },
            { speaker: 'player', text: '愿随郭都护出银山道，夜袭焉耆！' },
            { speaker: 'general', text: '焉耆城四面皆水，恃险不设斥候，正是天赐之隙。其弟栗婆准愿作乡导，路熟可以疾行。' },
            { speaker: 'player', text: '谨受命，倍道兼行！' },
        ],
    },

    // #FB-唐 契苾何力 (635) — 突沦川之战（自选骁骑千余袭破吐谷浑牙帐；《旧唐书·卷一〇九》）
    tiele_qibiheli: {
        generalId: 'tiele_qibiheli',
        battleName: '突沦川之战',
        battleYear: 635,
        battleType: 'field',
        role: 'attacker',
        targetName: '突沦川',
        targetCityId: 'city_jingjue',   // 库内无突沦川；精绝为最近据点（约 277km），仅登记锚点
        targetLat: 38.15,
        targetLng: 85.53,
        myTroops: 10000,
        enemyFactionId: 'xihai_d',
        enemyFactionName: '吐谷浑',
        enemyGeneralId: 'xihai_d_fuyun',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '吐谷浑可汗伏允的牙帐就扎在突沦川，他若奔了于阗，大碛里再寻他便如捞针。某自选骁骑千余，今夜直入突沦川，踹他的牙帐！' },
            { speaker: 'player', text: '愿随将军直捣突沦川！' },
            { speaker: 'general', text: '虏无城郭，逐水草而居，不乘其聚居掩取，一朝云散便白费马力。碛中无水，刺马血也要饮——尔曹可敢随某？' },
            { speaker: 'player', text: '敢！千骑已备，只待号令！' },
        ],
    },

    // #FB-唐 王师范 (903) — 石楼之战（登莱兵＋淮南七千合击汴军，青州将张士枭斩朱友宁；《通鉴·卷二六四》）
    lai_wangshifan: {
        generalId: 'lai_wangshifan',
        battleName: '石楼之战',
        battleYear: 903,
        battleType: 'field',
        role: 'defender',
        targetName: '石楼',
        targetCityId: 'city_linzi',   // 库内无石楼据点；临淄最近（约 31km），坐标按石楼史实值
        targetLat: 36.62,
        targetLng: 118.55,
        myTroops: 20000,
        enemyFactionId: 'hou_liang',
        enemyFactionName: '朱梁',
        enemyGeneralId: 'liang_d_zhuyouning',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '朱友宁屠了博昌，又拔临淄，兵锋已抵青州城下。某已帅登、莱两军扎成两栅，就钉在石楼等他来啃！' },
            { speaker: 'player', text: '愿随王节度使死守石楼！' },
            { speaker: 'general', text: '淮南王茂章的七千步骑已到，汴军远来疲敝；等他啃钝了两栅，两镇并力一出，米河边上再分胜负！' },
            { speaker: 'player', text: '末将听令，两栅已固！' },
        ],
    },


    // #FB-唐 程名振 (645) — 622 洺水之战（原写沙卑城 645：守将史失其名，按四闸「对阵有名」换锚洺水；2026-10-25）
    jilizhou_chengmingzhen: {
        generalId: 'jilizhou_chengmingzhen',
        // 🔴 [2026-10-25 按《MAPWAR 武将分级标准》四闸] ④对阵有名：沙卑城守将史失其名→不能作代表战役；改锚 622 洺水之战——程名振随李世民征刘黑闼，受命领千余袭其粮道、尽毁舟车粮草（《旧唐书·程名振传》），敌帅刘黑闼有名。
        battleName: '洺水之战',
        battleYear: 622,
        battleType: 'field',
        role: 'attacker',
        targetName: '洺水',
        targetCityId: 'city_handan',
        targetLat: 36.68,
        targetLng: 114.85,
        myTroops: 30000,
        enemyFactionId: 'handong',
        enemyFactionName: '汉东',
        enemyGeneralId: 'handong_liuheita',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '刘黑闼复据洺州，与秦王隔洺水对垒，靠冀、贝、沧、瀛水陆运粮。我本河北人，路熟——今夜领千余骑去，烧尽他的舟车粮草，看他还拿什么撑！' },
            { speaker: 'player', text: '愿随程总管夜袭刘军粮道，断其粮草！' },
        ],
    },
    // #FB-后梁 朱友宁 (903) — 石楼之战（汴军攻青州，王师范两栅拒之；《通鉴·卷二六四》）
    liang_d_zhuyouning: {
        generalId: 'liang_d_zhuyouning',
        battleName: '石楼之战',
        battleYear: 903,
        battleType: 'field',
        role: 'attacker',
        targetName: '石楼',
        targetCityId: 'city_linzi',   // 库内无石楼据点；临淄最近（约 31km），坐标按石楼史实值
        targetLat: 36.62,
        targetLng: 118.55,
        myTroops: 30000,
        enemyFactionId: 'tang',
        enemyFactionName: '唐',
        enemyGeneralId: 'lai_wangshifan',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '博昌已平，临淄已拔，青州只剩王师范缩在石楼扎下的两栅里。某领所部汴军三万直压上去——破了这两栅，青州便是囊中之物！' },
            { speaker: 'player', text: '愿随朱将军进兵石楼！' },
            { speaker: 'general', text: '登、莱兵不过乡团凑数，淮南来的那七千人也远来疲敝。先攻他一栅，看他拿什么守！' },
            { speaker: 'player', text: '末将愿为先锋！' },
        ],
    },
    // 小策零敦多布 (1700 ~ 1750) — 公元1731年和通泊之战（清军西进，准噶尔诱伏反击）
    bfe_xiaoceling: {
        generalId: 'bfe_xiaoceling',
        battleName: '和通泊之战',
        battleYear: 1731,
        battleType: 'field',
        role: 'defender',
        targetName: '和通泊',
        targetCityId: 'city_kobdo',   // 已核：和通泊故地在科布多附近，库内锚科布多（约 50 km 内）
        targetLat: 48.01,
        targetLng: 91.64,
        // 准噶尔约 3 万、清军约 2.4 万；守方（准）≤ 攻方（清）×2 ✓
        myTroops: 30000,
        enemyFactionId: 'manzhou_d',   // 已核
        enemyFactionName: '大清',
        enemyGeneralId: 'gen_furdan',   // 已核：1731 清靖边将军傅尔丹（1680–1755，在世）
        enemyTroops: 24000,
        introLines: [
            { speaker: 'general', text: '傅尔丹孤军深入，正入我彀中！和通泊水草早已断绝其归路，诸部伏兵齐起，随我合围破敌！' },
            { speaker: 'player', text: '愿随策零敦多布将军共赴和通泊之战，大破大清敌军！' },
        ],
    },

    // 曾国荃 (1824 ~ 1890) — 公元1864年克天京之战
    bfe_zengguoquan: {
        generalId: 'bfe_zengguoquan',
        battleName: '天京之战',
        battleYear: 1864,
        battleType: 'siege',
        role: 'attacker',
        targetName: '天京',
        targetCityId: 'city_nanjing',   // 已核：天京即金陵（南京）
        targetLat: 32.05,
        targetLng: 118.77,
        // 湘军约 5 万围城，太平军守军约 1 万（久困饥疲）；守方 ≤ 攻方×2 ✓
        myTroops: 20000,
        enemyFactionId: 'taiping',   // 已核
        enemyFactionName: '太平',
        enemyGeneralId: 'gen_li_xiucheng',   // 已核：1864 守天京之忠王李秀成（1823–1864，在世）
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '围城两载，地道已抵城根，火药将发！吉字营的儿郎，随我破门登城，先入者有赏！' },
            { speaker: 'player', text: '愿随曾国荃将军共赴天京之战，大破太平军敌军！' },
        ],
    },

    // 多里亚 (1466 ~ 1560) — 公元1538年普雷韦扎之战（神圣同盟舰队对奥斯曼舰队）
    gen_andrea_doria: {
        generalId: 'gen_andrea_doria',
        battleName: '普雷韦扎之战',
        battleYear: 1538,
        battleType: 'field',
        role: 'defender',
        targetName: '普雷韦扎海面',
        targetCityId: 'city_anbulajiya',   // 已核：安布拉基亚（今阿尔塔）距普雷韦扎约 30 km，库内最近同文化据点
        targetLat: 38.96,
        targetLng: 20.75,
        // 神圣同盟约 4 万（按舰船与乘员折算，不照抄夸大）、奥斯曼约 3 万；守方 ≤ 攻方×2 ✓
        myTroops: 40000,
        enemyFactionId: 'osman',   // 已核
        enemyFactionName: '奥斯曼',
        enemyGeneralId: 'gen_barbarossa',   // 已核：1538 奥斯曼舰队统帅海雷丁（1478–1546，在世）
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '巴巴罗萨的桨帆船已扼住海湾，各国舰队各怀观望。某据阵以待、占住风势，待其散乱再击，诸君稳住阵脚！' },
            { speaker: 'player', text: '愿随多里亚将军共赴普雷韦扎之战，迎击奥斯曼舰队！' },
        ],
    },

    // 福全 (1653 ~ 1703) — 公元1690年乌兰布通之战
    bfe_fuquan: {
        generalId: 'bfe_fuquan',
        battleName: '乌兰布通之战',
        battleYear: 1690,
        battleType: 'field',
        role: 'attacker',
        targetName: '乌兰布通',
        targetCityId: 'city_yingchang',   // 已核：应昌距乌兰布通约 119 km，库内最近同文化（XIANBEI）据点
        targetLat: 42.40,
        targetLng: 117.35,
        // 清军约 4 万，噶尔丹军约 2 万（驼城）；守方 ≤ 攻方×2 ✓
        myTroops: 40000,
        enemyFactionId: 'oirat_ming',   // 已核
        enemyFactionName: '卫拉特',
        enemyGeneralId: 'oirat_ming_gaerdan',   // 已核：1690 噶尔丹（1645–1697，在世）
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '噶尔丹缚驼卧地、上覆箱垛，号为驼城。我以火炮轰其中坚，步骑两翼夹进，随我破此驼城！' },
            { speaker: 'player', text: '愿随福全将军共赴乌兰布通之战，大破卫拉特敌军！' },
        ],
    },

    // 高丽太祖 (877 ~ 943) — 公元927年公山之战（曹洞岘，与甄萱条为同一战役的反向）
    // 李勣 (594 ~ 669) — 公元630年白道之战（通漠道行军总管）
    bing_liji: {
        generalId: 'bing_liji',
        battleName: '白道之战',
        battleYear: 630,
        battleType: 'field',
        role: 'attacker',
        targetName: '白道',
        targetCityId: 'city_shengle',   // 已核：盛乐距白道岭约 55 km，库内最近同文化（XIANBEI）据点；白道在阴山南麓
        targetLat: 40.87,
        targetLng: 111.60,
        // 唐军约 3 万、颉利军约 4 万；守方（突厥）≤ 攻方（唐）×2 ✓
        myTroops: 30000,
        enemyFactionId: 'tujue',   // 已核
        enemyFactionName: '东突厥',
        enemyGeneralId: 'tujue_xielikehan',   // 已核：630 颉利可汗（580–634，在世）
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '颉利退保铁山、又欲渡碛北遁，白道是其必经。某已先据碛口断其归路，诸军合击，勿令可汗走脱！' },
            { speaker: 'player', text: '愿随李勣将军共赴白道之战，大破东突厥敌军！' },
        ],
    },

    song_lijilong: {
        generalId: 'song_lijilong',
        battleName: '唐河之战',
        battleYear: 989,
        battleType: 'field',
        role: 'defender',
        targetName: '唐河',
        targetCityId: 'city_zhongshan',
        targetLat: 38.72,
        targetLng: 115.00,
        myTroops: 30000,
        enemyFactionId: 'liao_d',
        enemyFactionName: '大辽',
        enemyGeneralId: 'yel_yelvxiuge',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '休哥挟八万骑压唐河而来，欲断我定州粮道。诸军据北岸结阵，弓弩先发，静塞马军待其阵乱再冲——此河一失，河北门户尽开。' },
            { speaker: 'player', text: '愿随李将军列阵唐河北岸，先折辽军前锋！' },
        ],
    },

    arakan_mingbin: {
        generalId: 'arakan_mingbin',
        battleName: '妙乌之战',
        battleYear: 1547,
        battleType: 'siege',
        role: 'defender',
        targetName: '妙乌',
        targetCityId: 'city_miaowu',
        targetLat: 20.5925,
        targetLng: 93.1953,
        myTroops: 10000,
        enemyFactionId: 'dongxu',
        enemyFactionName: '东吁',
        enemyGeneralId: 'dongxu_mangruiti',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '缅王自勃固倾国而来，要夺我妙乌。城倚山临水，我以战象守街巷、火器据塔楼，诸军塞门死战，勿使一骑入王宫。' },
            { speaker: 'player', text: '愿随明彬王守妙乌，城在人在！' },
        ],
    },

    jalair_muhuali: {
        generalId: 'jalair_muhuali',
        battleName: '野狐岭之战',
        battleYear: 1211,
        battleType: 'field',
        role: 'attacker',
        targetName: '野狐岭',
        targetCityId: 'city_xuanhua',
        targetLat: 40.95,
        targetLng: 114.75,
        myTroops: 30000,
        enemyFactionId: 'dajin',
        enemyFactionName: '大金',
        enemyGeneralId: 'dajin_wanyanchengyu',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '金人以重兵扼野狐岭獾儿嘴，自以为骑不得过。今我舍大道，令敢死士攀崖先登，冲其阵心——岭破，则居庸已在掌中。' },
            { speaker: 'player', text: '愿随木华黎将军攀岭先登，破金军大阵！' },
        ],
    },

    scotland_johngraham: {
        generalId: 'scotland_johngraham',
        battleName: '基利克兰基战役',
        battleYear: 1689,
        battleType: 'field',
        role: 'attacker',
        targetName: '基利克兰基',
        targetCityId: 'city_yinfeineisi',
        targetLat: 56.77,
        targetLng: -4.37,
        myTroops: 2400,
        enemyFactionId: 'scotland',
        enemyFactionName: '苏格兰',
        enemyGeneralId: 'scotland_hughmackay',
        enemyTroops: 2000,
        introLines: [
            { speaker: 'general', text: '麦凯的政府军堵在山口，等的就是我去仰攻。今夜翻过山脊直扑他营盘，高地人一冲进去，火枪再装填已来不及。' },
            { speaker: 'player', text: '愿随邓迪子爵夜袭基利克兰基，冲垮政府军！' },
        ],
    },
    xibanya_aerwa: {
        generalId: 'xibanya_aerwa',
        battleName: '米尔贝格战役',
        battleYear: 1547,
        battleType: 'field',
        role: 'attacker',
        targetName: '米尔贝格',
        targetCityId: 'city_bolandengbao',
        targetLat: 51.43,
        targetLng: 13.22,
        myTroops: 24000,
        enemyFactionId: 'wende',
        enemyFactionName: '萨克森',
        enemyGeneralId: 'wende_johnfriedrich',
        enemyTroops: 12000,
        introLines: [
            { speaker: 'general', text: '萨克森选侯把营盘扎在易北河对岸，自以为水阔难渡。今我以西班牙老兵为前锋，趁晨雾抢渡、直冲其营，只要拿下选侯本人，诸路新教诸侯便各自散了。' },
            { speaker: 'player', text: '愿随阿尔瓦公爵抢渡易北河，生擒萨克森选侯！' },
        ],
    },
    yamato_nanmuzhengcheng: {
        generalId: 'yamato_nanmuzhengcheng',
        battleName: '凑川之战',
        battleYear: 1336,
        battleType: 'field',
        role: 'defender',
        targetName: '凑川',
        targetCityId: 'city_kyoto',
        targetLat: 34.68,
        targetLng: 135.18,
        myTroops: 10000,
        enemyFactionId: 'ashikaga',
        enemyFactionName: '室町',
        enemyGeneralId: 'ashikaga_zulizunshi',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '尊氏挟九州之众东上，我兵不足千。凑川两岸筑垒、引水为田，以地狭制其骑兵；此身可捐，天皇不可辱。' },
            { speaker: 'player', text: '愿随楠木公死守凑川，为南朝尽忠！' },
        ],
    },

    qiliqiya_pangpei: {
        generalId: 'qiliqiya_pangpei',
        battleName: '法萨卢斯之战',
        battleYear: -48,
        battleType: 'field',
        role: 'defender',
        targetName: '法萨卢斯',
        targetCityId: 'city_salonica',
        targetLat: 39.28,
        targetLng: 22.38,
        myTroops: 44000,
        enemyFactionId: 'luoma_diguo',
        enemyFactionName: '罗马帝国',
        enemyGeneralId: 'gen_julius_caesar',
        enemyTroops: 22000,
        introLines: [
            { speaker: 'general', text: '恺撒兵少而锐，利在速战。我据高地坚阵以老其师，七千骑专击其右翼——他不来战，粮尽自溃。' },
            { speaker: 'player', text: '愿随庞培大将列阵法萨卢斯，破恺撒军！' },
        ],
    },

    xiadunhe_sviatoslav: {
        generalId: 'xiadunhe_sviatoslav',
        battleName: '多罗斯托隆之战',
        battleYear: 971,
        battleType: 'siege',
        role: 'defender',
        targetName: '多罗斯托隆',
        targetCityId: 'city_puleisilafu',
        targetLat: 44.12,
        targetLng: 27.26,
        myTroops: 20000,
        enemyFactionId: 'baizanting',   // 🔴 [2026-10-28 按史] 971 多罗斯托隆守军是被拜占庭（约翰一世·齐米斯基斯）围困的罗斯军（原写保加利亚，错）
        enemyFactionName: '拜占庭帝国',
        enemyGeneralId: 'duonaobaojia_tzimiskes',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '罗马人焚舟而来，火器当先。城在河曲，我据墙栅以箭雨短兵相持；若阵前斩其大将，罗斯军不退。' },
            { speaker: 'player', text: '愿随斯维亚托斯拉夫王死守多罗斯托隆！' },
        ],
    },

    // 完颜陈和尚 (1192 ~ 1232) — 公元1231年倒回谷之战（忠孝军迎击速不台）
    xiqin_wanyanchenheshang: {
        generalId: 'xiqin_wanyanchenheshang',
        battleName: '倒回谷之战',
        battleYear: 1231,
        battleType: 'field',
        role: 'defender',
        targetName: '倒回谷',
        targetCityId: 'city_changan',   // 已核：库无蓝田/倒回谷据点，取最近同文化（CENTRAL）据点长安，战场在蓝田，距长安约 35 公里
        targetLat: 34.15,
        targetLng: 109.32,
        myTroops: 10000,
        enemyFactionId: 'menggu_d',   // 已核
        enemyFactionName: '蒙古',
        enemyGeneralId: 'wuliangha_subutai',   // 已核（速不台 1176—1248，1231 在世）
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '蒙古军远来疲敝，忠孝军随我据倒回谷迎击，扼住谷口，不许其窥关中！' },
            { speaker: 'player', text: '愿随陈和尚死守倒回谷口，大破速不台蒙古军！' },
        ],
    },

    // 完颜宗弼 (1098 ~ 1148) — 公元1130年富平之战（铁浮图冲宋五路）
    jurchen_wanyanzongbi: {
        generalId: 'jurchen_wanyanzongbi',
        battleName: '富平之战',
        battleYear: 1130,
        battleType: 'field',
        role: 'attacker',
        targetName: '富平',
        targetCityId: 'city_changan',   // 已核：库无富平据点，取最近同文化（CENTRAL）据点长安，富平距长安约 55 公里
        targetLat: 34.75,
        targetLng: 109.18,
        myTroops: 29000,
        enemyFactionId: 'song',   // 已核
        enemyFactionName: '赵宋',
        enemyGeneralId: 'song_zhangjun',   // 已核（张浚 1097—1164，1130 在任川陕主帅）
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '宋军五路聚于富平，营垒虽众而号令不一。铁浮图随我直冲其中军，破此一阵，关中便入我手！' },
            { speaker: 'player', text: '愿随四太子于富平冲阵，击破张浚五路宋军！' },
        ],
    },

    // 项梁 (-260 ~ -208) — 公元前208年定陶之战（章邯夜袭，本城就地开战）
    bfe_xiangliang: {
        generalId: 'bfe_xiangliang',
        battleName: '定陶之战',
        battleYear: -208,
        battleType: 'field',
        role: 'defender',
        targetName: '定陶',
        targetCityId: 'city_dingtao',   // 已核
        targetLat: 35.200716,
        targetLng: 115.471802,
        myTroops: 45000,
        enemyFactionId: 'qin',   // 已核
        enemyFactionName: '秦国',
        enemyGeneralId: 'wazhai_zhanghan',   // 已核（章邯 -245~-205，前208 在任）
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '秦军连败于我，章邯必来衔枚夜袭。全军谨守营垒，轮番张弩，勿得懈怠！' },
            { speaker: 'player', text: '愿随项梁将军坚守定陶大营，迎击章邯秦军！' },
        ],
    },

    // 薛仁贵 (614 ~ 683) — 公元670年大非川之战
    loufan_xuerengui: {
        generalId: 'loufan_xuerengui',
        battleName: '大非川之战',
        battleYear: 670,
        battleType: 'field',
        role: 'attacker',
        targetName: '大非川',
        targetCityId: 'city_dafeichuan',   // 已核
        targetLat: 36.1379,
        targetLng: 100.7611,
        myTroops: 50000,
        enemyFactionId: 'tubo',   // 已核
        enemyFactionName: '吐蕃',
        enemyGeneralId: 'gar_lunqinling',   // 已核（论钦陵 635—699，670 在任吐蕃大论）
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '辎重留于大非川，我率轻骑先取乌海。吐蕃论钦陵必倾众来争，诸军扼守川口，勿使敌骑冲断我军！' },
            { speaker: 'player', text: '愿随薛将军先取乌海，回师大非川击破论钦陵吐蕃军！' },
        ],
    },

    // 雅库布 (840 ~ 879) — 公元873年内沙布尔之战（萨法尔灭塔希尔）
    xisi_yakubusafaer: {
        generalId: 'xisi_yakubusafaer',
        battleName: '内沙布尔之战',
        battleYear: 873,
        battleType: 'siege',
        role: 'attacker',
        targetName: '尼沙布尔',
        targetCityId: 'city_nishabuer',   // 已核
        targetLat: 36.2133,
        targetLng: 58.7958,
        myTroops: 12000,
        enemyFactionId: 'abasi',   // 已核（库内塔希尔势力记作 abasi）
        enemyFactionName: '阿拔斯',
        enemyGeneralId: 'aliya_muhammad_tahir',   // 已核（塔希尔 820—873，873 为卒年、在位）
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '塔希尔末王据尼沙布尔，军心已散。萨法尔骑随我直趋城下，取其都城，呼罗珊便定！' },
            { speaker: 'player', text: '愿随雅库布攻取尼沙布尔，击破塔希尔！' },
        ],
    },

    // 杨洪 (1381 ~ 1451) — 公元1449年宣府之战（也先挟上皇至城下，闭门不纳）
    ming_yanghong: {
        generalId: 'ming_yanghong',
        battleName: '宣府之战',
        battleYear: 1449,
        battleType: 'siege',
        role: 'defender',
        targetName: '宣府',
        targetCityId: 'city_xuanhua',   // 已核（宣府即宣化）
        targetLat: 40.609,
        targetLng: 115.052,
        myTroops: 20000,
        enemyFactionId: 'oirat_ming',   // 已核
        enemyFactionName: '卫拉特',
        enemyGeneralId: 'wala_yexian',   // 已核（也先 1407—1454，1449 在任）
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '也先挟上皇至城下，欲以虚言赚开城门。宣府乃京师北门，城门一步不可开，众军登陴死守！' },
            { speaker: 'player', text: '愿随杨总兵坚守宣府城，挫也先卫拉特军！' },
        ],
    },
    // #FB-批2 safawei_d_abasi (1605) — 苏丹尼耶之战
    safawei_d_abasi: {
        generalId: 'safawei_d_abasi',
        battleName: '苏丹尼耶之战',
        battleYear: 1605,
        battleType: 'field',
        role: 'defender',
        targetName: '苏菲安',
        targetCityId: 'city_dabulishi',
        targetLat: 38.05,
        targetLng: 46.3,
        myTroops: 50000,
        enemyFactionId: 'osman',
        enemyFactionName: '奥斯曼',
        enemyGeneralId: 'bfe_sinan_pasha',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '奥斯曼大军恃众而来，粮道已为我轻骑所断！诸军且战且退、诱其离阵，待其侧翼空虚，再从两翼合击。' },
            { speaker: 'player', text: '愿随阿拔斯沙阿共赴苏丹尼耶之战，击破奥斯曼大军！' },
        ],
    },

    // #FB-批2 deli_alawuding (1303) — 德里之战
    deli_alawuding: {
        generalId: 'deli_alawuding',
        battleName: '德里之战',
        battleYear: 1303,
        battleType: 'siege',
        role: 'defender',
        targetName: '德里',
        targetCityId: 'city_deli',
        targetLat: 28.61,
        targetLng: 77.23,
        myTroops: 30000,
        enemyFactionId: 'menggu_d',
        enemyFactionName: '蒙古',
        enemyGeneralId: 'bfe_qutlugh_khwaja',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '蒙古铁骑已抵城下，四郊尽焚、只余孤城！诸军据城死守，弓弩齐发，待其师老粮尽，再开城掩杀。' },
            { speaker: 'player', text: '愿随阿拉乌丁苏丹共赴德里之战，击退蒙古大军！' },
        ],
    },

    // #FB-批2 bfe_tsering_dondub (1717) — 拉萨之战
    bfe_tsering_dondub: {
        generalId: 'bfe_tsering_dondub',
        battleName: '拉萨之战',
        battleYear: 1717,
        battleType: 'siege',
        role: 'attacker',
        targetName: '逻些',
        targetCityId: 'city_luoxie',
        targetLat: 29.65,
        targetLng: 91.17,
        myTroops: 6000,
        enemyFactionId: 'khoshut',
        enemyFactionName: '和硕特',
        enemyGeneralId: 'khoshut_lhasang',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '和硕特部久据雪域，我大军已逾天山、涉大漠而来。拉藏汗兵马未集，随我直趋逻些，一鼓而下！' },
            { speaker: 'player', text: '愿随策凌敦多布将军共赴拉萨之战，击破和硕特军！' },
        ],
    },

    // #FB-批2 gen_feng_sheng (1387) — 金山之战
    gen_feng_sheng: {
        generalId: 'gen_feng_sheng',
        battleName: '金山之战',
        battleYear: 1387,
        battleType: 'field',
        role: 'attacker',
        targetName: '金山',
        targetCityId: 'city_shenyang',
        targetLat: 43,
        targetLng: 123.5,
        myTroops: 50000,
        enemyFactionId: 'yuan_d',
        enemyFactionName: '大元',
        enemyGeneralId: 'yuan_nahachu',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '纳哈出拥众屯金山，恃辽东远隔，不肯归命。我以二十万众分道出塞，先扼其归路，再遣使招之——兵临而不血刃，方为上策。' },
            { speaker: 'player', text: '愿随冯将军出塞金山，迫纳哈出来降！' },
        ],
    },

    // #FB-批2 bfe_wanggeon (936) — 一善之战
    bfe_wanggeon: {
        generalId: 'bfe_wanggeon',
        battleName: '一善之战',
        battleYear: 936,
        battleType: 'field',
        role: 'attacker',
        targetName: '一善',
        targetCityId: 'city_jeonju',
        targetLat: 36.12,
        targetLng: 128.3,
        myTroops: 50000,
        enemyFactionId: 'baiji',
        enemyFactionName: '百济',
        enemyGeneralId: 'baiji_shenjian',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '甄萱已为其子所幽，后百济人心离贰。今三军并进，直指一善，降者不杀、归者复业——三韩当于此役归一。' },
            { speaker: 'player', text: '愿随松岳王建亲征一善，收后百济！' },
        ],
    },

    // #FB-批2 gaoliang_geshuhan (756) — 灵宝西原之战
    gaoliang_geshuhan: {
        generalId: 'gaoliang_geshuhan',
        battleName: '灵宝西原之战',
        battleYear: 756,
        battleType: 'field',
        role: 'attacker',
        targetName: '潼关',
        targetCityId: 'city_tongguan',
        targetLat: 34.54,
        targetLng: 110.29,
        myTroops: 50000,
        enemyFactionId: 'da_yan',
        enemyFactionName: '大燕',
        enemyGeneralId: 'dayan_cuiqianyou',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '朝廷屡使促战，我只得出关。崔乾祐据灵宝险道，必以火攻邀我于谷中——诸军勿乱队，骑军护两翼，遇烟勿退。' },
            { speaker: 'player', text: '愿随哥舒将军出潼关，破燕军险伏！' },
        ],
    },

    // #FB-批2 adal_ghazi (1529) — 申布拉库雷之战
    adal_ghazi: {
        generalId: 'adal_ghazi',
        battleName: '申布拉库雷之战',
        battleYear: 1529,
        battleType: 'field',
        role: 'attacker',
        targetName: '申布拉库雷',
        targetCityId: 'city_fasil_fort',
        targetLat: 12,
        targetLng: 38.5,
        myTroops: 12000,
        enemyFactionId: 'ethiopia',
        enemyFactionName: '埃塞俄比亚',
        enemyGeneralId: 'ethiopia_lebnadengel',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '阿比西尼亚皇帝亲统大军来拒，其兵多而阵疏。我以火铳居前、骑军绕其两翼，破其中军，高原诸郡自会开门。' },
            { speaker: 'player', text: '愿随格拉尼冲阵，破埃塞皇帝本军！' },
        ],
    },

    // #FB-批2 hou_zhou_guowei (949) — 河中之战
    hou_zhou_guowei: {
        generalId: 'hou_zhou_guowei',
        battleName: '河中之战',
        battleYear: 949,
        battleType: 'siege',
        role: 'attacker',
        targetName: '河中',
        targetCityId: 'city_tongguan',
        targetLat: 34.85,
        targetLng: 110.33,
        myTroops: 50000,
        enemyFactionId: 'hou_han',
        enemyFactionName: '沙陀汉',
        enemyGeneralId: 'houhan_lishouzhen',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '守贞据河中坚城，外连三镇，欲使我师老于城下。今筑长围、断其粮道，分军守要，待其自溃——不必急攻。' },
            { speaker: 'player', text: '愿随郭枢密围河中，擒李守贞！' },
        ],
    },

    // #FB-批2 pangzha_halixinge (1823) — 瑙谢拉之战
    pangzha_halixinge: {
        generalId: 'pangzha_halixinge',
        battleName: '瑙谢拉之战',
        battleYear: 1823,
        battleType: 'field',
        role: 'defender',
        targetName: '瑙谢拉',
        targetCityId: 'city_baishawa',
        targetLat: 34.02,
        targetLng: 71.95,
        myTroops: 10000,
        enemyFactionId: 'dulan_d',
        enemyFactionName: '杜兰尼',
        enemyGeneralId: 'dulan_azimuhan',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '阿扎姆汗率喀布尔之众渡印度河来争白沙瓦，其众虽多，辎重在后。我据瑙谢拉城垒，待其半渡而击，火铳队伏于河岸。' },
            { speaker: 'player', text: '愿随哈里辛格扼瑙谢拉，破阿富汗军！' },
        ],
    },

    // #FB-批2 gen_hamilcar (-238) — 锯谷之战
    gen_hamilcar: {
        generalId: 'gen_hamilcar',
        battleName: '锯谷之战',
        battleYear: -238,
        battleType: 'field',
        role: 'attacker',
        targetName: '锯谷',
        targetCityId: 'city_jiataji',
        targetLat: 36.6,
        targetLng: 10.1,
        myTroops: 25000,
        enemyFactionId: 'buni',
        enemyFactionName: '迦太基',
        enemyGeneralId: 'buni_mathos',
        enemyTroops: 35000,
        introLines: [
            { speaker: 'general', text: '叛佣据平原、恃象军，我却要引他入谷。诸军夜出，据两侧高地，待其入谷而塞其口——此战不在多杀，在断其粮与退路。' },
            { speaker: 'player', text: '愿随哈米尔卡入谷，围歼叛佣！' },
        ],
    },

    // #FB-批2 huangwang_huangchao (880) — 潼关之战
    huangwang_huangchao: {
        generalId: 'huangwang_huangchao',
        battleName: '潼关之战',
        battleYear: 880,
        battleType: 'siege',
        role: 'attacker',
        targetName: '潼关',
        targetCityId: 'city_tongguan',
        targetLat: 34.54,
        targetLng: 110.29,
        myTroops: 50000,
        enemyFactionId: 'tang',
        enemyFactionName: '李唐',
        enemyGeneralId: 'tang_qikerang',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '唐廷尽发神策与关东之兵守潼关，然禁军多市井新募，不足当锋。我自禁坑绕其后，前后夹击，关破则长安在望。' },
            { speaker: 'player', text: '愿随黄王破潼关，直取长安！' },
        ],
    },

    // #FB-批2 suzhou_huoqubing (-121) — 河西之战
    suzhou_huoqubing: {
        generalId: 'suzhou_huoqubing',
        battleName: '河西之战',
        battleYear: -121,
        battleType: 'field',
        role: 'attacker',
        targetName: '焉支山',
        targetCityId: 'city_zhangye',
        targetLat: 38.8,
        targetLng: 101.1,
        myTroops: 10000,
        enemyFactionId: 'xiongnu',
        enemyFactionName: '匈奴',
        enemyGeneralId: 'xiongnu_hunxiewang',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '匈奴右地恃祁连、焉支为险，谓我骑不能深入。今轻骑万人转战五日，过焉支、逾居延，见其王庭即击——不取辎重，只求破阵。' },
            { speaker: 'player', text: '愿随霍骠骑深入河西，破浑邪王部！' },
        ],
    },

    // #FB-批2 lang_clan_jiangqujianzan (1354) — 萨迦之战
    lang_clan_jiangqujianzan: {
        generalId: 'lang_clan_jiangqujianzan',
        battleName: '萨迦之战',
        battleYear: 1354,
        battleType: 'siege',
        role: 'attacker',
        targetName: '萨迦',
        targetCityId: 'city_sajia',
        targetLat: 29.1,
        targetLng: 87.67,
        myTroops: 15000,
        enemyFactionId: 'khon',
        enemyFactionName: '萨迦昆',
        enemyGeneralId: 'khon_wangzun',
        enemyTroops: 15000,
        introLines: [
            { speaker: 'general', text: '萨迦恃元廷为援，本钦挟寺产自固。我自雅隆发兵，先断其四路粮道，再围大寺——寺僧不战则抚之，本钦不降则攻之。' },
            { speaker: 'player', text: '愿随绛曲坚赞围萨迦寺，擒本钦旺尊！' },
        ],
    },

    // #FB-批2 bfe_crassus (-53) — 卡莱之战
    bfe_crassus: {
        generalId: 'bfe_crassus',
        battleName: '卡莱之战',
        battleYear: -53,
        battleType: 'field',
        role: 'attacker',
        targetName: '卡莱',
        targetCityId: 'city_alepo',
        targetLat: 36.87,
        targetLng: 39.03,
        myTroops: 20000,
        enemyFactionId: 'ansxi',
        enemyFactionName: '安息帝国',
        enemyGeneralId: 'ansxi_surena',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '安息人不敢野战，只以弓骑绕射。我以七军团结方阵、骑军护侧，稳步向卡莱——只要不被诱入旷野，其箭不足畏。' },
            { speaker: 'player', text: '愿随克拉苏深入安息，取卡莱！' },
        ],
    },

    // #FB-批2 bfe_kniprode (1370) — 鲁道之战
    bfe_kniprode: {
        generalId: 'bfe_kniprode',
        battleName: '鲁道之战',
        battleYear: 1370,
        battleType: 'field',
        role: 'defender',
        targetName: '鲁道',
        targetCityId: 'city_kenisibao',
        targetLat: 54.75,
        targetLng: 20.7,
        myTroops: 15000,
        enemyFactionId: 'litaowan',
        enemyFactionName: '立陶宛',
        enemyGeneralId: 'gen_algirdas',
        enemyTroops: 25000,
        introLines: [
            { speaker: 'general', text: '立陶宛两公合兵越境，欲乘秋收掠普鲁士。我以兄弟骑士列阵于鲁道平原，重骑居中、弩手护两翼，待其骑军冲阵而后反卷。' },
            { speaker: 'player', text: '愿随大团长列阵鲁道，破立陶宛军！' },
        ],
    },

    // #FB-批2 xike_lanjite (1818) — 木尔坦之战
    xike_lanjite: {
        generalId: 'xike_lanjite',
        battleName: '木尔坦之战',
        battleYear: 1818,
        battleType: 'siege',
        role: 'attacker',
        targetName: '木尔坦',
        targetCityId: 'city_malisi',
        targetLat: 30.2,
        targetLng: 71.47,
        myTroops: 20000,
        enemyFactionId: 'dulan_d',
        enemyFactionName: '杜兰尼',
        enemyGeneralId: 'dulan_muzaffarkhan',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '穆扎法尔汗据木尔坦坚堡，屡附喀布尔而叛我。今遣米斯尔迪万昌德统兵，掘壕断水、以重炮毁其女墙——降者免死。' },
            { speaker: 'player', text: '愿随兰季特辛格攻木尔坦，平阿富汗守军！' },
        ],
    },

    // #FB-批2 wuzhou_limu (-233) — 肥之战
    wuzhou_limu: {
        generalId: 'wuzhou_limu',
        battleName: '肥之战',
        battleYear: -233,
        battleType: 'field',
        role: 'defender',
        targetName: '肥下',
        targetCityId: 'city_zhending',
        targetLat: 38.03,
        targetLng: 115.03,
        myTroops: 40000,
        enemyFactionId: 'qin',
        enemyFactionName: '秦国',
        enemyGeneralId: 'qin_hengyi',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '秦军远来争肥下，锐气在锋而不在久。诸军据垒勿动，待其气衰，我自率精骑出其后，一战可走桓齮！' },
            { speaker: 'player', text: '愿随李牧将军据肥下迎击，大破桓齮秦军！' },
        ],
    },

    // #FB-批2 yiyang_d_mengzongzheng (1217) — 枣阳之战
    yiyang_d_mengzongzheng: {
        generalId: 'yiyang_d_mengzongzheng',
        battleName: '枣阳之战',
        battleYear: 1217,
        battleType: 'siege',
        role: 'defender',
        targetName: '枣阳',
        targetCityId: 'city_zaoyang',
        targetLat: 32.13,
        targetLng: 112.75,
        myTroops: 20000,
        enemyFactionId: 'dajin',
        enemyFactionName: '大金',
        enemyGeneralId: 'dajin_wanyaneke',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '金人举众压城，意在必取枣阳。分军守四隅，伏弩列于瓮城，待其蚁附而发！' },
            { speaker: 'player', text: '愿随孟宗政坚守枣阳，打退完颜讹可金军！' },
        ],
    },

    // #FB-批2 gen_vladimir_monomakh (1096) — 特鲁别日河之战
    gen_vladimir_monomakh: {
        generalId: 'gen_vladimir_monomakh',
        battleName: '特鲁别日河之战',
        battleYear: 1096,
        battleType: 'field',
        role: 'defender',
        targetName: '特鲁别日河',
        targetCityId: 'city_jifu',
        targetLat: 50.2,
        targetLng: 30.5,
        myTroops: 30000,
        enemyFactionId: 'kuman_oleshky',
        enemyFactionName: '库曼',
        enemyGeneralId: 'kuman_tugorkan',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '库曼汗图戈尔坎焚掠而归，辎重累道，正是击之之时。诸军渡特鲁别日河，分两翼夹击，勿使其列阵！' },
            { speaker: 'player', text: '愿随莫诺马赫渡河夹击，击破图戈尔坎库曼军！' },
        ],
    },

    // #FB-批2 samaila_muataisuimu (838) — 阿莫里乌姆之战
    samaila_muataisuimu: {
        generalId: 'samaila_muataisuimu',
        battleName: '阿莫里乌姆之战',
        battleYear: 838,
        battleType: 'siege',
        role: 'attacker',
        targetName: '阿莫里乌姆',
        targetCityId: 'city_ankala',
        targetLat: 39.02,
        targetLng: 31.15,
        myTroops: 50000,
        enemyFactionId: 'baizanting',
        enemyFactionName: '拜占庭',
        enemyGeneralId: 'baizanting_diaofeilusi',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '狄奥斐卢斯敢犯我边，我便直取其阿莫里乌姆。分军断其援道，砲车昼夜攻其西门，城破之日，拜占庭胆寒！' },
            { speaker: 'player', text: '愿随哈里发亲征阿莫里乌姆，大破狄奥斐卢斯拜占庭军！' },
        ],
    },

    // #FB-批2 bfe_muhammad_ghur (1192) — 第二次塔拉因之战
    bfe_muhammad_ghur: {
        generalId: 'bfe_muhammad_ghur',
        battleName: '第二次塔拉因之战',
        battleYear: 1192,
        battleType: 'field',
        role: 'attacker',
        targetName: '塔拉因',
        targetCityId: 'city_deli',
        targetLat: 29.9,
        targetLng: 76.6,
        myTroops: 50000,
        enemyFactionId: 'zhelouqi',
        enemyFactionName: '乔汉',
        enemyGeneralId: 'zhelouqi_puliteweilajie',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '去岁在此折了一阵，今日再临塔拉因。骑阵分作四队轮番冲之，佯退诱其象阵离阵，待其乱而合击！' },
            { speaker: 'player', text: '愿随古尔苏丹再战塔拉因，击破普里特维拉杰乔汉军！' },
        ],
    },

    // #FB-批2 gen_alexander_nef (1242) — 冰上之战
    gen_alexander_nef: {
        generalId: 'gen_alexander_nef',
        battleName: '冰上之战',
        battleYear: 1242,
        battleType: 'field',
        role: 'defender',
        targetName: '楚德湖',
        targetCityId: 'city_pusikefu',
        targetLat: 58.7,
        targetLng: 27.5,
        myTroops: 5000,
        enemyFactionId: 'baojian_qishi',
        enemyFactionName: '宝剑骑士团',
        enemyGeneralId: 'baojian_herman',
        enemyTroops: 3000,
        introLines: [
            { speaker: 'general', text: '条顿骑士铁甲楔阵最利冲阵，然湖冰滑薄、阵形难展。中军退诱其入冰，两翼合围，专斫其马足！' },
            { speaker: 'player', text: '愿随亚历山大涅夫斯基诱敌入冰，歼灭条顿骑士团！' },
        ],
    },

    // #FB-批2 bfe2_pang_juan (-341) — 马陵之战
    bfe2_pang_juan: {
        generalId: 'bfe2_pang_juan',
        battleName: '马陵之战',
        battleYear: -341,
        battleType: 'field',
        role: 'attacker',
        targetName: '马陵',
        targetCityId: 'city_puyang',
        targetLat: 35.98,
        targetLng: 115.67,
        myTroops: 50000,
        enemyFactionId: 'qi',
        enemyFactionName: '齐国',
        enemyGeneralId: 'qi_tianji',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'general', text: '齐军深入我境，行迹散乱、灶数日减，是怯也。轻骑随我昼夜追之，至马陵隘口一举破其军！' },
            { speaker: 'player', text: '愿随庞涓将军追击齐军，于马陵破田忌！' },
        ],
    },

    // #FB-批2 nguyen_guangnan_ruanfuying (1801) — 富春之战
    nguyen_guangnan_ruanfuying: {
        generalId: 'nguyen_guangnan_ruanfuying',
        battleName: '富春之战',
        battleYear: 1801,
        battleType: 'siege',
        role: 'attacker',
        targetName: '富春',
        targetCityId: 'city_fuchun',
        targetLat: 16.4667,
        targetLng: 107.5833,
        myTroops: 30000,
        enemyFactionId: 'yuenan',
        enemyFactionName: '越南',
        enemyGeneralId: 'yuenan_ruanguangzuan',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '富春是西山根本，城破则其众胆落。水师扼其海口，步军架銃象攻其南门，一战而复旧都！' },
            { speaker: 'player', text: '愿随阮福映攻取富春，击破阮光缵西山军！' },
        ],
    },

    // #FB-批2 kejila_shulunbao (1716) — 科孚之战
    kejila_shulunbao: {
        generalId: 'kejila_shulunbao',
        battleName: '科孚之战',
        battleYear: 1716,
        battleType: 'siege',
        role: 'defender',
        targetName: '科孚',
        targetCityId: 'city_kefu',
        targetLat: 39.62,
        targetLng: 19.92,
        myTroops: 10000,
        enemyFactionId: 'osman',
        enemyFactionName: '奥斯曼',
        enemyGeneralId: 'osman_kapadan',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '奥斯曼舰队已入海峡，陆师必自新旧堡之间登陆。诸堡炮位勿乱发，待其蚁附城下，铳炮齐下！' },
            { speaker: 'player', text: '愿随舒伦堡元帅死守科孚，打退卡帕丹帕夏奥斯曼军！' },
        ],
    },

    // #FB-批2 gen_thoros (1152) — 马米斯特拉之战
    gen_thoros: {
        generalId: 'gen_thoros',
        battleName: '马米斯特拉之战',
        battleYear: 1152,
        battleType: 'field',
        role: 'defender',
        targetName: '马米斯特拉',
        targetCityId: 'city_adana',
        targetLat: 36.957,
        targetLng: 35.624,
        myTroops: 7500,
        enemyFactionId: 'baizanting',
        enemyFactionName: '拜占庭',
        enemyGeneralId: 'bfe_andronikos_komnenos',
        enemyTroops: 12000,
        introLines: [
            { speaker: 'general', text: '拜占庭人已围住马米斯特拉，营垒连成一片，只等雨停放晴攻城。' },
            { speaker: 'general', text: '壮士，今夜雨大，随我从城门杀出，冲他中军大营。' },
            { speaker: 'player', text: '愿随亲王夜袭拜占庭军营，解马米斯特拉之围！' },
        ],
    },

    // #FB-批2 shanzhou_wangzhongsi (744) — 萨河内山之战
    shanzhou_wangzhongsi: {
        generalId: 'shanzhou_wangzhongsi',
        battleName: '萨河内山之战',
        battleYear: 744,
        battleType: 'field',
        role: 'attacker',
        targetName: '萨河内山',
        targetCityId: 'city_toumancheng',
        targetLat: 46.5,
        targetLng: 103,
        myTroops: 20000,
        enemyFactionId: 'tujue',
        enemyFactionName: '突厥',
        enemyGeneralId: 'tujue_abo_dagan',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '突厥左厢十一部在萨河内山前联营，正等我军远来疲敝。' },
            { speaker: 'general', text: '壮士，随我登山列阵，直冲其中坚，先夺其旗鼓。' },
            { speaker: 'player', text: '愿随节度使北进萨河内山，与突厥十一部一会！' },
        ],
    },

    // #FB-批2 shuofang_weiqing (-119) — 漠北之战
    shuofang_weiqing: {
        generalId: 'shuofang_weiqing',
        battleName: '漠北之战',
        battleYear: -119,
        battleType: 'field',
        role: 'attacker',
        targetName: '漠北',
        targetCityId: 'city_toumancheng',
        targetLat: 44.5,
        targetLng: 111.5,
        myTroops: 50000,
        enemyFactionId: 'xiongnu',
        enemyFactionName: '匈奴',
        enemyGeneralId: 'xiongnu_yizhixie',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'general', text: '单于亲率部众在漠北立营，此战系北边十年安危。' },
            { speaker: 'general', text: '壮士，随我以武刚车环列为营，纵骑直取单于中坚。' },
            { speaker: 'player', text: '愿随大将军出定襄、越漠北，直捣单于王庭！' },
        ],
    },

    // #FB-批2 gen_yaroslav (1019) — 阿尔塔河之战
    gen_yaroslav: {
        generalId: 'gen_yaroslav',
        battleName: '阿尔塔河之战',
        battleYear: 1019,
        battleType: 'field',
        role: 'attacker',
        targetName: '阿尔塔河',
        targetCityId: 'city_jifu',
        targetLat: 50.07,
        targetLng: 31.45,
        myTroops: 10000,
        enemyFactionId: 'luosi',
        enemyFactionName: '罗斯',
        enemyGeneralId: 'luosi_svyatopolk',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '斯维亚托波尔克借佩切涅格骑兵占了基辅，如今在阿尔塔河对岸列阵。' },
            { speaker: 'general', text: '诺夫哥罗德与瓦兰吉的战士都已集齐，壮士，随我渡河。' },
            { speaker: 'player', text: '愿随大公渡阿尔塔河，逐斯维亚托波尔克！' },
        ],
    },

    // #FB-批2 bfe_zhanghe (228) — 街亭之战
    bfe_zhanghe: {
        generalId: 'bfe_zhanghe',
        battleName: '街亭之战',
        battleYear: 228,
        battleType: 'field',
        role: 'attacker',
        targetName: '街亭',
        targetCityId: 'city_tianshui',
        targetLat: 35.02,
        targetLng: 106.1,
        myTroops: 20000,
        enemyFactionId: 'shu',
        enemyFactionName: '蜀国',
        enemyGeneralId: 'shu_masu',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '马谡弃城上山，街亭是陇右咽喉，蜀军踞险则陇右诸郡皆危。' },
            { speaker: 'general', text: '壮士，随我断其汲道，四面逼山。' },
            { speaker: 'player', text: '愿随张将军夺街亭，绝蜀军水道！' },
        ],
    },

    // #FB-批2 gen_zhang_rou (1233) — 蔡州之战
    gen_zhang_rou: {
        generalId: 'gen_zhang_rou',
        battleName: '蔡州之战',
        battleYear: 1233,
        battleType: 'siege',
        role: 'attacker',
        targetName: '蔡州',
        targetCityId: 'city_xuanhu',   // 🔴 [2026-10-25] 蔡州＝悬瓠（汝南）同一城，城库只立 city_xuanhu → 锚悬瓠；targetName 仍写史称「蔡州」
        targetLat: 33,
        targetLng: 114.36,
        myTroops: 20000,
        enemyFactionId: 'dajin',
        enemyFactionName: '大金',
        enemyGeneralId: 'dajin_wanyan_zhongde',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '金主退保蔡州，四面合围已成，攻城之具皆备。' },
            { speaker: 'general', text: '壮士，随我推云梯登城，先夺南面敌楼。' },
            { speaker: 'player', text: '愿随张万户攻蔡州孤城！' },
        ],
    },
    // #FB-批2b ansxi_surena (-53) — 卡莱之战（与 bfe_crassus 同一役反向）
    ansxi_surena: {
        generalId: 'ansxi_surena',
        battleName: '卡莱之战',
        battleYear: -53,
        battleType: 'field',
        role: 'defender',
        targetName: '卡莱',
        targetCityId: 'city_alepo',
        targetLat: 36.87,
        targetLng: 39.03,
        myTroops: 10000,
        enemyFactionId: 'luoma_diguo',
        enemyFactionName: '安息帝国',
        enemyGeneralId: 'bfe_crassus',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'player', text: '愿随苏莱纳将军困死这支罗马军！' },
            { speaker: 'player', text: '末将已备骆驼箭矢，只等号令！' },
        ],
    },


    // #FB-批2b qin_hengyi (-233) — 肥之战（与 wuzhou_limu 同一役反向）
    qin_hengyi: {
        generalId: 'qin_hengyi',
        battleName: '肥之战',
        battleYear: -233,
        battleType: 'field',
        role: 'attacker',
        targetName: '肥下',
        targetCityId: 'city_zhending',
        targetLat: 38.03,
        targetLng: 115.03,
        myTroops: 50000,
        enemyFactionId: 'zhao',
        enemyFactionName: '秦国',
        enemyGeneralId: 'wuzhou_limu',
        enemyTroops: 40000,
        introLines: [
            { speaker: 'player', text: '愿随桓将军进兵肥下！' },
            { speaker: 'player', text: '末将愿领先登死士！' },
        ],
    },

    // #FB-批2b kuman_tugorkan (1096) — 特鲁别日河之战（与 gen_vladimir_monomakh 同一役反向）
    kuman_tugorkan: {
        generalId: 'kuman_tugorkan',
        battleName: '特鲁别日河之战',
        battleYear: 1096,
        battleType: 'field',
        role: 'attacker',
        targetName: '特鲁别日河',
        targetCityId: 'city_jifu',
        targetLat: 50.2,
        targetLng: 30.5,
        myTroops: 20000,
        enemyFactionId: 'peilieya_gongguo',
        enemyFactionName: '库曼',
        enemyGeneralId: 'gen_vladimir_monomakh',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'player', text: '愿随汗爷渡河抢渡口！' },
            { speaker: 'player', text: '遵命，且战且退！' },
        ],
    },

    // #FB-批2b baizanting_diaofeilusi (838) — 阿莫里乌姆之战（与 samaila_muataisuimu 同一役反向）
    baizanting_diaofeilusi: {
        generalId: 'baizanting_diaofeilusi',
        battleName: '阿莫里乌姆之战',
        battleYear: 838,
        battleType: 'siege',
        role: 'defender',
        targetName: '阿莫里乌姆',
        targetCityId: 'city_ankala',
        targetLat: 39.02,
        targetLng: 31.15,
        myTroops: 30000,
        enemyFactionId: 'abasi',
        enemyFactionName: '拜占庭',
        enemyGeneralId: 'samaila_muataisuimu',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'player', text: '愿随皇帝救阿莫里乌姆！' },
            { speaker: 'player', text: '末将在城头死守！' },
        ],
    },

    // #FB-批2b zhelouqi_puliteweilajie (1192) — 第二次塔拉因之战（与 bfe_muhammad_ghur 同一役反向）
    zhelouqi_puliteweilajie: {
        generalId: 'zhelouqi_puliteweilajie',
        battleName: '第二次塔拉因之战',
        battleYear: 1192,
        battleType: 'field',
        role: 'defender',
        targetName: '塔拉因',
        targetCityId: 'city_deli',
        targetLat: 29.9,
        targetLng: 76.6,
        myTroops: 50000,
        enemyFactionId: 'huluo',
        enemyFactionName: '乔汉',
        enemyGeneralId: 'bfe_muhammad_ghur',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'player', text: '愿随大王迎击古尔！' },
            { speaker: 'player', text: '末将紧守水源！' },
        ],
    },

    // #FB-批2b baojian_herman (1242) — 冰上之战（与 gen_alexander_nef 同一役反向）
    baojian_herman: {
        generalId: 'baojian_herman',
        battleName: '冰上之战',
        battleYear: 1242,
        battleType: 'field',
        role: 'attacker',
        targetName: '楚德湖',
        targetCityId: 'city_pusikefu',
        targetLat: 58.7,
        targetLng: 27.5,
        myTroops: 3000,
        enemyFactionId: 'luosi',
        enemyFactionName: '宝剑骑士团',
        enemyGeneralId: 'gen_alexander_nef',
        enemyTroops: 3000,
        introLines: [
            { speaker: 'player', text: '愿随主教进军冰湖！' },
            { speaker: 'player', text: '末将先探冰面！' },
        ],
    },

    // #FB-批2b qi_tianji (-341) — 马陵之战（与 bfe2_pang_juan 同一役反向）
    qi_tianji: {
        generalId: 'qi_tianji',
        battleName: '马陵之战',
        battleYear: -341,
        battleType: 'field',
        role: 'defender',
        targetName: '马陵',
        targetCityId: 'city_puyang',
        targetLat: 35.98,
        targetLng: 115.67,
        myTroops: 50000,
        enemyFactionId: 'wei',
        enemyFactionName: '齐国',
        enemyGeneralId: 'bfe2_pang_juan',
        enemyTroops: 50000,
        introLines: [
            { speaker: 'player', text: '愿随田将军伏兵马陵！' },
            { speaker: 'player', text: '末将已备强弩！' },
        ],
    },

    // #FB-批2b osman_kapadan (1716) — 科孚之战（与 kejila_shulunbao 同一役反向）
    osman_kapadan: {
        generalId: 'osman_kapadan',
        battleName: '科孚之战',
        battleYear: 1716,
        battleType: 'siege',
        role: 'attacker',
        targetName: '科孚',
        targetCityId: 'city_kefu',
        targetLat: 39.62,
        targetLng: 19.92,
        myTroops: 33000,
        enemyFactionId: 'kelite',
        enemyFactionName: '奥斯曼',
        enemyGeneralId: 'kejila_shulunbao',
        enemyTroops: 33000,
        introLines: [
            { speaker: 'player', text: '愿随帕夏围断科孚！' },
            { speaker: 'player', text: '末将听令掘壕！' },
        ],
    },

    // #FB-批2b yilihanguo_yisimeier (1510) — 梅尔夫之战（萨法维伊斯梅尔一世破昔班尼汗）
    yilihanguo_yisimeier: {
        generalId: 'yilihanguo_yisimeier',
        battleName: '梅尔夫之战',
        battleYear: 1510,
        battleType: 'field',
        role: 'attacker',
        targetName: '梅尔夫',
        targetCityId: 'city_merv',
        targetLat: 37.6164,
        targetLng: 62.2348,
        myTroops: 17000,
        enemyFactionId: 'an',
        enemyFactionName: '布哈拉',
        enemyGeneralId: 'an_xibanni',
        enemyTroops: 28000,
        introLines: [
            { speaker: 'general', text: '昔班尼的骑兵比我多，可他把营垒扎在梅尔夫城下，背水而无退路。我红头军只冲他中军——擒了汗，他的部众自散！' },
            { speaker: 'player', text: '愿随沙阿冲其中军！' },
            { speaker: 'general', text: '莫与他的骑射缠斗，先压他的左翼，待其阵乱，一齐突入。' },
            { speaker: 'player', text: '得令，全军压上！' },
        ],
    },
    // #FB-换役 taiyuan_menglai (1296) — 哈剌彭之战（兰纳攻南奔，孟族末王伊巴）
    taiyuan_menglai: {
        generalId: 'taiyuan_menglai',
        battleName: '哈剌彭之战',
        battleYear: 1296,
        battleType: 'siege',
        role: 'attacker',
        targetName: '哈剌彭',
        targetCityId: 'city_chingkham',
        targetLat: 18.58,
        targetLng: 99.01,
        myTroops: 30000,
        enemyFactionId: 'mon',
        enemyFactionName: '孟族',
        enemyGeneralId: 'halapeng_yiba',
        enemyTroops: 20000,
        introLines: [
            { speaker: 'general', text: '哈剌彭的孟人占着南奔的河谷，卡在我兰纳与素可泰之间。今回师南下，先拔它的城，再定清迈的基业。' },
            { speaker: 'player', text: '愿随孟莱王取哈剌彭！' },
            { speaker: 'general', text: '孟人善守，城上多设强弩；先断其城外稻田与汲道，逼他出城。' },
            { speaker: 'player', text: '末将听令，断其粮道！' },
        ],
    },

    // #FB-换役 ssangseong_cuiying (1374) — 牧胡之乱·明月浦（讨耽罗牧胡，敌大元）
    ssangseong_cuiying: {
        generalId: 'ssangseong_cuiying',
        battleName: '明月浦之战',
        battleYear: 1374,
        battleType: 'field',
        role: 'attacker',
        targetName: '明月浦',
        targetCityId: 'city_xingzhuting',
        targetLat: 33.51,
        targetLng: 126.52,
        myTroops: 20000,
        enemyFactionId: 'yuan_d',
        enemyFactionName: '大元',
        enemyGeneralId: 'yuan_shidielibisi',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '耽罗的牧胡仗着海远，杀了朝廷的差官，还占着济州的马场。某领战舰三百一十四艘、士卒二万五千，渡海去把明月浦踏平。' },
            { speaker: 'player', text: '愿随崔元帅渡海讨牧胡！' },
            { speaker: 'general', text: '牧胡多骑，海边无遮拦，先以水军断其船，再以步卒结阵压上——不叫一人走脱。' },
            { speaker: 'player', text: '得令，船队起锚！' },
        ],
    },

    // #FB-换役 satsuma_daojinjiajiu (1587) — 户次川之战（丰臣军来攻，岛津迎击）
    satsuma_daojinjiajiu: {
        generalId: 'satsuma_daojinjiajiu',
        battleName: '户次川之战',
        battleYear: 1587,
        battleType: 'field',
        role: 'defender',
        targetName: '户次川',
        targetCityId: 'city_funei',
        targetLat: 33.21,
        targetLng: 131.60,
        myTroops: 12000,
        enemyFactionId: 'toyotomi',
        enemyFactionName: '丰臣家',
        enemyGeneralId: 'bfe_sogo_kazumasa',
        enemyTroops: 6000,
        introLines: [
            { speaker: 'general', text: '丰臣大军进了丰后，分兵冒进，队形拉得太长。某领岛津武士一万二千，就伏在户次川两岸等他半渡。' },
            { speaker: 'player', text: '愿随岛津家久公伏击丰臣军！' },
            { speaker: 'general', text: '十河存保为先锋，正是他冒进；待其骑队入川，铳阵先打、武士再切其侧。' },
            { speaker: 'player', text: '得令，两岸伏兵就位！' },
        ],
    },

    // #FB-换役 gen_fernando_iii (1248) — 塞维利亚之战（敌穆瓦希德，城守阿夏塔夫）
    gen_fernando_iii: {
        generalId: 'gen_fernando_iii',
        battleName: '塞维利亚之战',
        battleYear: 1248,
        battleType: 'siege',
        role: 'attacker',
        targetName: '塞维利亚',
        targetCityId: 'city_seville',
        targetLat: 37.38,
        targetLng: -5.98,
        myTroops: 24000,
        enemyFactionId: 'muwaxide',
        enemyFactionName: '穆瓦希德',
        enemyGeneralId: 'muwaxide_axatafu',
        enemyTroops: 12000,
        introLines: [
            { speaker: 'general', text: '塞维利亚是安达卢斯的第一大城，它的船队控着瓜达尔基维尔河。某已封河、断其援，只等城中断粮。' },
            { speaker: 'player', text: '愿随国王取塞维利亚！' },
            { speaker: 'general', text: '阿夏塔夫守城是穆瓦希德的宗室，城上多置弩炮；先架浮桥、断其河运，再劝他开城。' },
            { speaker: 'player', text: '末将听令，封锁河面！' },
        ],
    },
    // #FB-补 lunbadi_alboin (567) — 革皮德之战（伦巴第与阿瓦尔合击革皮德）
    lunbadi_alboin: {
        generalId: 'lunbadi_alboin',
        battleName: '革皮德之战',
        battleYear: 567,
        battleType: 'field',
        role: 'attacker',
        targetName: '蒂萨河',
        targetCityId: 'city_budapeisi',
        targetLat: 46.6,
        targetLng: 20.2,
        myTroops: 20000,
        enemyFactionId: 'gepids',
        enemyFactionName: '革皮德',
        enemyGeneralId: 'gepids_cunimund',
        enemyTroops: 30000,
        introLines: [
            { speaker: 'general', text: '革皮德人仗着蒂萨河的地利，还想在潘诺尼亚称王。某与阿瓦尔人盟誓：这一仗打完，河那边的地归伦巴第。' },
            { speaker: 'player', text: '愿随阿尔博因王渡河！' },
            { speaker: 'general', text: '革皮德兵多而杂，阿瓦尔骑先绕其侧后，某领撒克斯刀卫直冲中军——斩其王，余众自散。' },
            { speaker: 'player', text: '得令，长刀出鞘！' },
        ],
    },

    // #FB-补 gen_roger_i (1063) — 切拉米之战（罗杰一世破卡尔比德西西里军）
    gen_roger_i: {
        generalId: 'gen_roger_i',
        battleName: '切拉米之战',
        battleYear: 1063,
        battleType: 'field',
        role: 'attacker',
        targetName: '切拉米',
        targetCityId: 'city_palermo',
        targetLat: 37.82,
        targetLng: 14.13,
        myTroops: 10000,
        enemyFactionId: 'kalbids',
        enemyFactionName: '卡尔比德',
        enemyGeneralId: 'kalbids_ibnhawwas',
        enemyTroops: 10000,
        introLines: [
            { speaker: 'general', text: '西西里的埃米尔纠了六千人来夺切拉米。某只带三千诺曼骑士与步卒——兵少，正好走山道，打他个措手不及。' },
            { speaker: 'player', text: '愿随罗杰伯爵迎战！' },
            { speaker: 'general', text: '摩尔人善射，莫在开阔地与他耗；先据高阜，待其仰攻散乱，铁骑自上一冲而下。' },
            { speaker: 'player', text: '得令，抢占高地！' },
        ],
    },
};

export function getGeneralFirstBattle(generalId: string | null | undefined): GeneralFirstBattle | null {
    if (!generalId) return null;
    // 🔴 [2026-10-24 主人「只要名将有剧情就行」] 成名战只对名将生效；普将的成名战数据保留，不触发
    if (getGeneralProfile(generalId)?.tier !== 'famous') return null;
    return GENERAL_FIRST_BATTLES[generalId] ?? null;
}

const completedFirstBattleGenerals = new Set<string>();

export function markFirstBattleCompleted(generalId: string | null | undefined): void {
    if (!generalId) return;
    completedFirstBattleGenerals.add(generalId);
}

export function isFirstBattleCompleted(generalId: string | null | undefined): boolean {
    if (!generalId) return false;
    return completedFirstBattleGenerals.has(generalId);
}

export function clearCompletedFirstBattles(): void {
    completedFirstBattleGenerals.clear();
}

/**
 * 守己方城类的成名战武将（battleType === 'siege' && role === 'defender'）：
 * 在玩家尚未与其触发并完成成名战前，留在城中等候玩家，不提前由 AI 募兵出征；
 * 攻其他城与野战类的武将不限制出征，玩家无论在城中还是野外找到该武将均可直接奔赴战场开战。
 */
export function shouldGeneralWaitInCityForFirstBattle(
    generalId: string | null | undefined,
    _cityId?: string | null,
): boolean {
    if (!generalId || isFirstBattleCompleted(generalId)) return false;
    const fb = getGeneralFirstBattle(generalId);
    if (!fb) return false;
    return fb.battleType === 'siege' && fb.role === 'defender';
}

// @ts-ignore
if (import.meta.hot) {
    // @ts-ignore
    import.meta.hot.accept((newModule: any) => {
        if (!newModule?.GENERAL_FIRST_BATTLES) return;
        const target = GENERAL_FIRST_BATTLES as Record<string, GeneralFirstBattle>;
        for (const key of Object.keys(target)) delete target[key];
        Object.assign(target, newModule.GENERAL_FIRST_BATTLES);
    });
}

