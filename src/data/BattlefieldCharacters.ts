/**
 * 战场人物 —— 🔴 [2026-09-19 主人定] 「缺少的人物，做成战场人物。人物和战场点绑定。」
 *
 * 主人原话：「缺少的人物，做成战场人物。人物和战场点绑定。以后我要考虑要不要把战场做成据点之一。」
 *
 * ── 为什么要单开一张表，不塞进 `FactionGenerals` ────────────────────────
 *   战场人物**只属于某个战场**，不属于任何据点。而 `FACTION_GENERALS` 的消费方是
 *   「一势力一将领」的**开局/守城掷将**（`getFactionGeneral` → `getCityAnchoredGeneral`），
 *   把窦建德塞进 `tang` 或 `zheng` 键下，他就会在乱斗里被随机掷到某座城当守将
 *   —— 那是「东边打完西边又打」，与主人这条定案正相反。
 *   所以本表独立：**只有战场（`bf_*`）会读它**，城池掷将永远读不到。
 *
 * ── 消费方（三个，都是"战场要用这位将"时才查）────────────────────────
 *   1. `BattlefieldData.roster` —— 战场自身记录在场人物（编辑器可编）；
 *   2. `getGeneralRecordByGeneralId`（`FactionGenerals.ts`）的**兜底**：
 *      `HistoricalEventManager.spawnBattlefieldSide` 与 13 战术模式都靠它拿将领名与立绘；
 *   3. 以后玩家在选边对话框里看到的那两位主帅。
 *
 * ── 立绘纪律（铁律，不可越）────────────────────────────────────────
 *   🔴 **立绘一律由主人亲自放**；AI 永久禁止新增、生成、替换、分配任何武将立绘。
 *   故本表 `portrait` 一律留空 → 运行时走 `resolveGeneralPortraitPath` 的
 *   **势力池 → 文化池**回落（与 `FactionGenerals` 里美洲那批新将完全同一套规矩）。
 *   `portraitProposedPath` 只是**给主人的建议落点**（按既有命名：势力key_中文名拼音.png），
 *   主人放好图后把路径填进 `portrait` 即可，AI 不代填、不代建文件。
 */

/** 一位只在场战上出现的人物 */
export interface BattlefieldCharacter {
    /** 人物 id（与武将同一命名空间，运行时靠 `getGeneralRecordByGeneralId` 兜底解析） */
    generalId: string;
    /** 人物名（军情 / 名牌 / 选边对话框显示） */
    generalName: string;
    /**
     * 所属势力 id。
     * ⚠️ 这些势力**可能一座据点都没有**（如窦建德的「夏」、王世充的「郑」）——
     *    那是史实：他们在项目里只以战场人物的身份存在，不参与乱斗夺城。
     */
    factionId: string;
    /** 立绘路径：**留空 = 走势力/文化池回落**；填了就必须是主人亲自放的图 */
    portrait?: string;
    /** 建议落点（AI 只写路径建议，不建文件、不绑定） */
    portraitProposedPath?: string;
    /** 史料备注：此人在这场战役里的身份 */
    note?: string;
}

/**
 * 战场人物总表。
 * 键 = `generalId`，方便按 id 直查；顺序无关。
 */
export const BATTLEFIELD_CHARACTERS: Readonly<Record<string, BattlefieldCharacter>> = {
    // 🔴 [2026-09-25 主人令「删除，删除干净」] 虎牢关战役（621）夏方主帅**窦建德**的战场人物记录已删除：
    //    那一仗已全删、势力 `xia` 也没有任何据点，记录成了悬空引用。日后若重建虎牢关一战，再按本表规矩重建。
    // 🔴 [2026-09-19 主人令「都给我删了」] 王世充的记录已删除：
    //    他唯一的归属是 `zheng`（郑）这个势力，而郑是**我给虎牢关多建的第三方** ——
    //    虎牢关这一仗只有攻(唐·李世民)守(夏·窦建德)两方，王世充当时被围在洛阳、根本不在虎牢关。
    //    势力与人物一起删，不留悬空引用。日后若做「洛阳之战」，再一并重建。

    // ── 坎尼战役（前216）罗马方主帅 ──────────────────────────────
    baolusi: {
        generalId: 'baolusi',
        generalName: '保卢斯',
        factionId: 'luoma_diguo',
        portrait: '',
        portraitProposedPath: '/assets/LATIN/luoma_diguo_baolusi.png',
        note: '卢基乌斯·埃米利乌斯·保卢斯，公元前216年罗马执政官，坎尼战役中阵亡。史料：波利比乌斯《历史·第三卷》、李维《罗马史·第二十二卷》。',
    },
    waluo: {
        generalId: 'waluo',
        generalName: '瓦罗',
        factionId: 'luoma_diguo',
        portrait: '',
        portraitProposedPath: '/assets/LATIN/luoma_diguo_waluo.png',
        note: '盖乌斯·特伦提乌斯·瓦罗，公元前216年罗马执政官，坎尼战役当日执掌罗马军令，战败后逃回。史料：李维《罗马史·第二十二卷》。',
    },

    // 🔴 [2026-09-19 主人令] 村上武吉**已归位为据点守将**（能岛城，伊予势力），
    //    不再属于战场人物表 —— 此处原条目已移除（他重新有了自己的城）。
    // ── 沙隆战役（451）西罗马方主帅 ──────────────────────────────
    // ── 哈利卡纳苏斯围城战（前334）波斯方主帅 ────────────────────
    halikanasu_memnon: {
        generalId: 'halikanasu_memnon',
        generalName: '门农',
        factionId: 'aqimeinide',
        portrait: '',                       // 🔴 等主人放图；空 = 走池子回落
        portraitProposedPath: '/assets/PERSIAN/halikanasu_memnon.png',
        note: '罗得岛的门农，波斯麾下希腊雇佣军名将。公元前334年米利都战后受任小亚细亚总指挥、统率波斯舰队，亲自布置哈利卡纳苏斯防御，携舰队泊于港内准备长期对抗；城破前夜与卡里亚总督欧戎托巴提斯一同弃城撤退，此后转攻爱琴海诸岛，公元前333年病死。史料：阿里安《亚历山大远征记》卷一、中文维基百科「哈利卡那索斯圍城戰」。',
    },
    // ── 巴尔干战役（前335）守方主帅 —— 🔴 [2026-09-25 主人「甲，批准」] ──────────
    //    底比斯本城的锚定武将是伊巴密浓达（公元前362年已死），不能动；这一仗的守将按史料另立，
    //    剧本攻城时由 scriptPeriod.getScriptSiegeDefenderGeneral 顶到城防上。
    dibisi_phoinix: {
        generalId: 'dibisi_phoinix',
        generalName: '菲尼克斯',
        factionId: 'boootiya',
        portrait: '',
        portraitProposedPath: '/assets/GREEK/boootiya_feinikesi.png',
        note: '底比斯主将菲尼克斯（Phoinix），公元前335年底比斯起兵反马其顿、据城死战，与普罗提特斯同为守方指挥，城破战死。史料：英文维基百科 Battle of Thebes 信息框 commander2 = Phoinix †、Prothytes †。',
    },
    jite_shouling: {
        generalId: 'jite_shouling',
        generalName: '科托罗',
        factionId: 'seleisi',
        portrait: '',
        portraitProposedPath: '/assets/THRACIAN/jite_shouling.png',
        note: '多瑙河北岸盖塔人（Getae，色雷斯北支，信永生）国王科托罗（Cothelas）。史料（阿里安《远征记》I.3）记盖塔人约四千骑兵、一万余步兵列阵相阻。',
    },
    aitiliusi: {
        generalId: 'aitiliusi',
        generalName: '埃提乌斯',
        factionId: 'luoma_diguo',
        portrait: '',
        portraitProposedPath: '/assets/LATIN/luoma_diguo_aitiliusi.png',
        note: '弗拉维乌斯·埃提乌斯，西罗马末代名将、「最后的罗马人」；451年沙隆战役统率罗马-西哥特联军击退阿提拉。史料：约达尼斯《哥特史》、普罗柯比《战史》。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_kadesh_king: {
        generalId: 'bfe_kadesh_king',
        generalName: '卡迭石王 苏穆阿达德',
        factionId: 'kanan',
        portrait: '',
        note: '史无载，拟名：前1457年米吉多之战，迦南—卡迭石联军由卡迭石王统领，其名未传。',
    },
    // 🔴 [2026-10-20 首战规则] 572 年伦巴第围帕维亚，东罗马（拜占庭）守将姓名未传 → 拟名战场人物（立绘留空）
    bfe_pavia_shoujiang: {
        generalId: 'bfe_pavia_shoujiang',
        generalName: '帕维亚东罗马守将',
        factionId: 'baizanting',
        portrait: '',
        note: '史无载，拟名：572 年帕维亚（Ticinum）围城战，守军为东罗马（拜占庭）驻军，守将姓名未传。',
    },
    // 🔴 [2026-10-20 首战规则] 686 年三佛齐征爪哇，马打蓝守将姓名未传 → 拟名战场人物（立绘留空）
    bfe_jawa_shoujiang: {
        generalId: 'bfe_jawa_shoujiang',
        generalName: '马打蓝守城将',
        factionId: 'medang',
        portrait: '',
        note: '史无载，拟名：686 年三佛齐征爪哇之战，马打蓝（Medang）守城将姓名未传。',
    },
    // 🔴 [2026-10-20 首战规则] 749 年哥舒翰夺石堡城，吐蕃守将姓名未传 → 拟名战场人物（立绘留空）
    bfe_shibaocheng_shoujiang: {
        generalId: 'bfe_shibaocheng_shoujiang',
        generalName: '石堡城吐蕃守将',
        factionId: 'tubo',
        portrait: '',
        note: '史无载，拟名：749 年哥舒翰攻石堡城，吐蕃守将姓名未传。',
    },
    // 🔴 [2026-10-20 首战规则] 838 年阿拔斯攻阿莫里姆，拜占庭守将姓名未传 → 拟名战场人物（立绘留空）
    bfe_amorium_shoujiang: {
        generalId: 'bfe_amorium_shoujiang',
        generalName: '阿莫里姆守将',
        factionId: 'baizanting',
        portrait: '',
        note: '史无载，拟名：838 年阿拔斯哈里发穆塔西姆攻阿莫里姆，拜占庭守将姓名未传。',
    },
    // 🔴 [2026-10-20 首战规则] 848 年张议潮沙州起义，吐蕃守将姓名未传 → 拟名战场人物（立绘留空）
    bfe_shazhou_shoujiang: {
        generalId: 'bfe_shazhou_shoujiang',
        generalName: '沙州吐蕃守将',
        factionId: 'tubo',
        portrait: '',
        note: '史无载，拟名：848 年张议潮逐吐蕃守军复沙州，吐蕃守将姓名未传。',
    },
    // 🔴 [2026-10-20 首战规则] 878 年黄巢破仙霞关，唐守将姓名未传 → 拟名战场人物（立绘留空）
    bfe_xianxia_shoujiang: {
        generalId: 'bfe_xianxia_shoujiang',
        generalName: '仙霞关唐守将',
        factionId: 'tang',
        portrait: '',
        note: '史无载，拟名：878 年黄巢开山七百里破仙霞关，唐军守将姓名未传。',
    },
    // 🔴 [2026-10-20 首战规则] 1036 年基辅罗斯逐佩切涅格人，佩切涅格可汗姓名未传 → 拟名战场人物（立绘留空）
    bfe_pecheneg_khan: {
        generalId: 'bfe_pecheneg_khan',
        generalName: '佩切涅格汗',
        factionId: 'kumanni',
        portrait: '',
        note: '史无载，拟名：1036 年雅罗斯拉夫逐佩切涅格人于基辅城下，佩切涅格可汗姓名未传。',
    },
    // 🔴 [2026-10-20 首战规则] 1068 米西尔梅里之战，西西里酋长国守将姓名未传 → 拟名战场人物（立绘留空）
    bfe_sicily_shoujiang: {
        generalId: 'bfe_sicily_shoujiang',
        generalName: '米西尔梅里守将',
        factionId: 'xixiliwangguo',
        portrait: '',
        note: '史无载，拟名：1068 年罗杰一世攻米西尔梅里，西西里酋长国守将姓名未传。',
    },
    // 🔴 [2026-10-20 首战规则] 1130 年完颜宗弼攻明州，南宋守将姓名未传 → 拟名战场人物（立绘留空）
    bfe_mingzhou_shoujiang: {
        generalId: 'bfe_mingzhou_shoujiang',
        generalName: '明州守将',
        factionId: 'song',
        portrait: '',
        note: '史无载，拟名：1130 年完颜宗弼（金兀术）攻明州，南宋守将姓名未传。',
    },
    // 🔴 [2026-10-20 首战规则] 1107 年高丽尹瓘逐曷懒甸女真，女真首领姓名未传 → 拟名战场人物（立绘留空）
    bfe_helan_dian_shouling: {
        generalId: 'bfe_helan_dian_shouling',
        generalName: '曷懒甸女真首领',
        factionId: 'jurchen',
        portrait: '',
        note: '史无载，拟名：1107 年高丽尹瓘拓九城，曷懒甸女真首领姓名未传。',
    },
    // 🔴 [2026-10-20 首战规则] 1204 特拉布宗立国，拜占庭割据势力主将姓名未传 → 拟名战场人物（立绘留空）
    bfe_trebizond_shoujiang: {
        generalId: 'bfe_trebizond_shoujiang',
        generalName: '特拉布宗割据主将',
        factionId: 'baizanting',
        portrait: '',
        note: '史无载，拟名：1204 年阿历克塞在特拉布宗立国，拜占庭割据势力主将姓名未传。',
    },
    // 🔴 [2026-10-20 首战规则] 1217 孟宗政襄阳击退金军，金军主将姓名未传 → 拟名战场人物（立绘留空）
    bfe_jin_xiangyang_jiang: {
        generalId: 'bfe_jin_xiangyang_jiang',
        generalName: '攻襄阳金将',
        factionId: 'dajin',
        portrait: '',
        note: '史无载，拟名：1217 年金军攻襄阳，主将姓名未传。',
    },
    // 🔴 [2026-10-20 首战规则] 1218 木华黎拔太原，金太原守将姓名未传 → 拟名战场人物（立绘留空）
    bfe_jin_taiyuan_shoujiang: {
        generalId: 'bfe_jin_taiyuan_shoujiang',
        generalName: '太原金军守将',
        factionId: 'dajin',
        portrait: '',
        note: '史无载，拟名：1218 年木华黎攻太原，金军守将姓名未传。',
    },
    // 🔴 [2026-10-20 首战规则] 1228 大昌原之战蒙古军主将姓名未传 → 拟名战场人物（立绘留空）
    bfe_mongol_dachangyuan_jiang: {
        generalId: 'bfe_mongol_dachangyuan_jiang',
        generalName: '大昌原蒙古主将',
        factionId: 'menggu_d',
        portrait: '',
        note: '史无载，拟名：1228 年完颜陈和尚大昌原胜蒙古军，蒙古主将姓名未传。',
    },
    // 🔴 [2026-10-20 首战规则] 1152 年拜占庭攻奇里乞亚，拜占庭军主将姓名未传 → 拟名战场人物（立绘留空）
    bfe_cilicia_shoujiang: {
        generalId: 'bfe_cilicia_shoujiang',
        generalName: '拜占庭奇里乞亚主将',
        factionId: 'baizanting',
        portrait: '',
        note: '史无载，拟名：1152 年拜占庭军攻奇里乞亚，主将姓名未传。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_achish: {
        generalId: 'bfe_achish',
        generalName: '迦特王 亚吉',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：《撒母耳记》非利士迦特王亚吉。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_jin_general: {
        generalId: 'bfe_jin_general',
        generalName: '晋军主将 栾施',
        factionId: 'jin',
        portrait: '',
        note: '实有其人（晋大夫栾施）；此役晋军主将史无载，取同期晋将拟任。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_prince_chao: {
        generalId: 'bfe_prince_chao',
        generalName: '王子朝',
        factionId: 'zhou',
        portrait: '',
        note: '实有其人：周景王之子，王子朝之乱。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_cleombrotus: {
        generalId: 'bfe_cleombrotus',
        generalName: '斯巴达将 克里奥姆布罗图斯',
        factionId: 'lagoniya',
        portrait: '',
        note: '实有其人：斯巴达摄政王克里奥姆布罗图斯。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_ba_rebel: {
        generalId: 'bfe_ba_rebel',
        generalName: '巴国叛首 巴稷',
        factionId: 'ba',
        portrait: '',
        note: '史无载，拟名：巴国内乱首领名字未传。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_callias: {
        generalId: 'bfe_callias',
        generalName: '卡尔基斯僭主 卡利斯',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：优卑亚卡尔基斯僭主卡利斯。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_persian_rebel: {
        generalId: 'bfe_persian_rebel',
        generalName: '波斯叛首 阿萨西斯',
        factionId: 'aqimeinide',
        portrait: '',
        note: '史无载，拟名：卡曼尼亚地方叛军首领名字未传。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_bomilcar: {
        generalId: 'bfe_bomilcar',
        generalName: '迦太基将 波米尔卡',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：迦太基将领波米尔卡。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_gaius_livius: {
        generalId: 'bfe_gaius_livius',
        generalName: '罗马舰队司令 盖乌斯·李维乌斯',
        factionId: 'luoma_diguo',
        portrait: '',
        note: '实有其人：罗马舰队指挥李维乌斯·萨利纳托尔。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_qielan_lord: {
        generalId: 'bfe_qielan_lord',
        generalName: '且兰君 耆',
        factionId: 'miao_qing',
        portrait: '',
        note: '史无载，拟名：且兰君长名字未传。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_ma_heluo: {
        generalId: 'bfe_ma_heluo',
        generalName: '马何罗',
        factionId: 'han_d',
        portrait: '',
        note: '实有其人：汉武帝时谋逆者马何罗。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_roman_merchant: {
        generalId: 'bfe_roman_merchant',
        generalName: '罗马行商首领 卢基乌斯·李锡尼乌斯',
        factionId: 'luoma_diguo',
        portrait: '',
        note: '史无载，拟名：塞纳布姆被杀的罗马行商首领名字未传。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_li_song: {
        generalId: 'bfe_li_song',
        generalName: '更始将 李松',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：更始政权将领李松。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_ren_guang: {
        generalId: 'bfe_ren_guang',
        generalName: '任光',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：东汉云台将任光。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_su_ding: {
        generalId: 'bfe_su_ding',
        generalName: '交趾太守 苏定',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：东汉交趾太守苏定。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_zhang_hong: {
        generalId: 'bfe_zhang_hong',
        generalName: '越嶲太守 张鸿',
        factionId: 'panjun',
        portrait: '',
        note: '史载参考：东汉越嶲太守张鸿讨任贵（史无明文，取近载）。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_guangde: {
        generalId: 'bfe_guangde',
        generalName: '于阗王 广德',
        factionId: 'yuchi',
        portrait: '',
        note: '实有其人：于阗王广德。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_zhang_qiao: {
        generalId: 'bfe_zhang_qiao',
        generalName: '益州太守 张乔',
        factionId: 'panjun',
        portrait: '',
        note: '史无载，拟名：此役汉军主将史无载，取同期益州太守张乔拟任。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_meherdates: {
        generalId: 'bfe_meherdates',
        generalName: '梅哈尔达特',
        factionId: 'ansxi',
        portrait: '',
        note: '实有其人：帕提亚争位者梅哈尔达特。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_gao_zhihui: {
        generalId: 'bfe_gao_zhihui',
        generalName: '高智慧',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：隋初江南叛乱首领高智慧。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_yin_ziqi: {
        generalId: 'bfe_yin_ziqi',
        generalName: '尹子奇',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：安史叛将尹子奇。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_wu_yuanji: {
        generalId: 'bfe_wu_yuanji',
        generalName: '吴元济',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：淮西节度使吴元济。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_sun_ru: {
        generalId: 'bfe_sun_ru',
        generalName: '孙儒',
        factionId: 'cai',
        portrait: '',
        note: '实有其人：唐末军阀孙儒。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_isaac_komnenos: {
        generalId: 'bfe_isaac_komnenos',
        generalName: '伊萨克·科穆宁',
        factionId: 'saipulusi',
        portrait: '',
        note: '实有其人：塞浦路斯割据者伊萨克·科穆宁。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_nikaido_sadefuji: {
        generalId: 'bfe_nikaido_sadefuji',
        generalName: '幕府军大将 二阶堂贞藤',
        factionId: 'genji',
        portrait: '',
        note: '史无载，拟名：幕府攻千早城的大将史无载。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_ilkhani_general: {
        generalId: 'bfe_ilkhani_general',
        generalName: '伊儿汗国残将 苏莱曼沙',
        factionId: 'panjun',
        portrait: '',
        note: '史无载，拟名：伊儿汗国残部首领名字未传。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_luang_prabang_king: {
        generalId: 'bfe_luang_prabang_king',
        generalName: '琅勃拉邦王 坎豪',
        factionId: 'liaozu',
        portrait: '',
        note: '史无载，拟名：琅勃拉邦古邦首领名字未传。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_wako_chief_a: {
        generalId: 'bfe_wako_chief_a',
        generalName: '倭寇首领 源赖澄',
        factionId: 'panjun',
        portrait: '',
        note: '史无载，拟名：此役倭寇首领名字未传。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_ajibaldo: {
        generalId: 'bfe_ajibaldo',
        generalName: '阿只拔都',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：荒山大捷被斩的倭寇首领阿只拔都。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_rasul_khan: {
        generalId: 'bfe_rasul_khan',
        generalName: '果阿守将 拉苏尔汗',
        factionId: 'adile',
        portrait: '',
        note: '实有其人：比贾布尔果阿守将拉苏尔汗。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_zhu_chenhao: {
        generalId: 'bfe_zhu_chenhao',
        generalName: '宁王 朱宸濠',
        factionId: 'hongzhou',
        portrait: '',
        note: '实有其人：宁王朱宸濠。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_xu_hai: {
        generalId: 'bfe_xu_hai',
        generalName: '徐海',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：嘉靖倭寇首领徐海。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_chen_dong: {
        generalId: 'bfe_chen_dong',
        generalName: '陈东',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：嘉靖倭寇首领陈东。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_sonom: {
        generalId: 'bfe_sonom',
        generalName: '索诺木',
        factionId: 'jinchuan_g',
        portrait: '',
        note: '实有其人：大金川土司索诺木。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_yahdun_lim: {
        generalId: 'bfe2_yahdun_lim',
        generalName: '亚赫敦·林',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：马里王（约前1820–前1796在位），前1796年时在位。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_ramses_ii: {
        generalId: 'bfe2_ramses_ii',
        generalName: '拉美西斯二世',
        factionId: 'aiji',
        portrait: '',
        note: '实有其人：埃及法老，前1274年卡迭石战役统帅。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_enlil_nadin_ahi: {
        generalId: 'bfe2_enlil_nadin_ahi',
        generalName: '恩利尔纳丁·阿基',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：加喜特巴比伦末王（前1157年被埃兰所俘）。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_shalmaneser_iii: {
        generalId: 'bfe2_shalmaneser_iii',
        generalName: '沙尔马那塞尔三世',
        factionId: 'yashu',
        portrait: '',
        note: '实有其人：亚述王（前859–前824在位）。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_xianyun_chief: {
        generalId: 'bfe2_xianyun_chief',
        generalName: '猃狁酋 允格',
        factionId: 'panjun',
        portrait: '',
        note: '史无载，拟名：猃狁首领名字未传。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_rezin: {
        generalId: 'bfe2_rezin',
        generalName: '利汛',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：亚兰—大马士革王，前732年城破身亡。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_yun_lord: {
        generalId: 'bfe2_yun_lord',
        generalName: '郧君 熊咺',
        factionId: 'panjun',
        portrait: '',
        note: '史无载，拟名：郧国国君名字未传。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_bao_shuya: {
        generalId: 'bfe2_bao_shuya',
        generalName: '鲍叔牙',
        factionId: 'qi',
        portrait: '',
        note: '实有其人：齐军主帅。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_esarhaddon: {
        generalId: 'bfe2_esarhaddon',
        generalName: '以撒哈顿',
        factionId: 'yashu',
        portrait: '',
        note: '实有其人：亚述王（前681–前669在位）。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_memphis_warden: {
        generalId: 'bfe2_memphis_warden',
        generalName: '帕迪阿蒙',
        factionId: 'panjun',
        portrait: '',
        note: '史无载，拟名：孟菲斯守将名字未传。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_ziyu: {
        generalId: 'bfe2_ziyu',
        generalName: '子玉',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：楚军主帅成得臣（子玉）。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_sin_shar_ishkun: {
        generalId: 'bfe2_sin_shar_ishkun',
        generalName: '辛·沙尔·伊什昆',
        factionId: 'yashu',
        portrait: '',
        note: '实有其人：亚述末王，前612年尼尼微城破身亡。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_chu_zhuangwang: {
        generalId: 'bfe2_chu_zhuangwang',
        generalName: '楚庄王',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：楚庄王熊侣。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_xun_linfu: {
        generalId: 'bfe2_xun_linfu',
        generalName: '荀林父',
        factionId: 'jin',
        portrait: '',
        note: '实有其人：晋军主帅荀林父。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_qi_qinggong: {
        generalId: 'bfe2_qi_qinggong',
        generalName: '齐顷公',
        factionId: 'qi',
        portrait: '',
        note: '实有其人：齐顷公。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_nabonidus: {
        generalId: 'bfe2_nabonidus',
        generalName: '那波尼德',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：新巴比伦末王那波尼德。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_nidintu_bel: {
        generalId: 'bfe2_nidintu_bel',
        generalName: '尼丁图-贝尔',
        factionId: 'jialedi',
        portrait: '',
        note: '实有其人：前522年自称尼布甲尼撒四世的巴比伦叛首。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_zi_chang: {
        generalId: 'bfe2_zi_chang',
        generalName: '子常',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：楚令尹囊瓦（子常）。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_xerxes_i: {
        generalId: 'bfe2_xerxes_i',
        generalName: '薛西斯一世',
        factionId: 'aqimeinide',
        portrait: '',
        note: '实有其人：波斯大王薛西斯一世。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_mardonius: {
        generalId: 'bfe2_mardonius',
        generalName: '马尔多尼乌斯',
        factionId: 'bosidiguo',
        portrait: '',
        note: '实有其人：前479年波斯军统帅马尔多尼乌斯。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_cleon: {
        generalId: 'bfe2_cleon',
        generalName: '克里昂',
        factionId: 'xila',
        portrait: '',
        note: '实有其人：雅典将军克里昂，前422年阵亡。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_conon: {
        generalId: 'bfe2_conon',
        generalName: '科农',
        factionId: 'xila',
        portrait: '',
        note: '实有其人：雅典海军将领科农。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_qin_general_a: {
        generalId: 'bfe2_qin_general_a',
        generalName: '秦庶长 嬴封',
        factionId: 'qin',
        portrait: '',
        note: '史无载，拟名：此役秦军主将名字未传。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_heraclea_tyrant: {
        generalId: 'bfe2_heraclea_tyrant',
        generalName: '克里奥尼穆斯',
        factionId: 'panjun',
        portrait: '',
        note: '史无载，拟名：赫拉克利亚城守将名字未传。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_pollis: {
        generalId: 'bfe2_pollis',
        generalName: '波利斯',
        factionId: 'panjun',
        portrait: '',
        note: '史载异说：斯巴达海军统帅（前376年纳克索斯海战）。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_pharnabazus: {
        generalId: 'bfe2_pharnabazus',
        generalName: '法那巴佐斯',
        factionId: 'bosidiguo',
        portrait: '',
        note: '实有其人：波斯总督，前373年远征埃及统帅。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_cleombrotus_i: {
        generalId: 'bfe2_cleombrotus_i',
        generalName: '克勒翁布罗图斯一世',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：斯巴达王，前371年留克特拉战死。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_lucanian_chief: {
        generalId: 'bfe2_lucanian_chief',
        generalName: '斯托马',
        factionId: 'panjun',
        portrait: '',
        note: '史无载，拟名：卢卡尼亚首领名字未传。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_qin_general_b: {
        generalId: 'bfe2_qin_general_b',
        generalName: '秦庶长 嬴改',
        factionId: 'qin',
        portrait: '',
        note: '史无载，拟名：此役秦军主将名字未传。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_pang_juan: {
        generalId: 'bfe2_pang_juan',
        generalName: '庞涓',
        factionId: 'wei',
        portrait: '',
        note: '实有其人：魏将庞涓，前342年马陵战死。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_gongzi_ang: {
        generalId: 'bfe2_gongzi_ang',
        generalName: '公子卬',
        factionId: 'wei',
        portrait: '',
        note: '实有其人：魏将公子卬。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_theagenes: {
        generalId: 'bfe2_theagenes',
        generalName: '特阿格尼斯',
        factionId: 'boootiya',
        portrait: '',
        note: '实有其人：前338年底比斯主将特阿格尼斯。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_antiphilus: {
        generalId: 'bfe2_antiphilus',
        generalName: '安提菲卢斯',
        factionId: 'maqidun',
        portrait: '',
        note: '实有其人：前322年拉米亚战争雅典联军统帅安提菲卢斯。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_dhanananda: {
        generalId: 'bfe2_dhanananda',
        generalName: '达那难陀',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：难陀王朝末王达那难陀。',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_2: {
        generalId: 'bfe3_2',
        generalName: '芦子霸王',
        factionId: 'shu',
        portrait: '',
        note: '实有其人：开明十二世（末代蜀王／芦子霸王），《华阳国志·蜀志》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_3: {
        generalId: 'bfe3_3',
        generalName: '楼烦王',
        factionId: 'loufan',
        portrait: '',
        note: '史无载，拟名：楼烦王（史未载具体名讳），《史记·赵世家》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_4: {
        generalId: 'bfe3_4',
        generalName: '拉维利乌斯',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：执政官普布利乌斯·瓦莱里乌斯·拉维利乌斯，普鲁塔克《希腊罗马名人传》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_11: {
        generalId: 'bfe3_11',
        generalName: '罗马副执政官',
        factionId: 'panjun',
        portrait: '',
        note: '史无载，拟名：该阶段执政官卢基乌斯·凯基利乌斯·梅特路斯或前线统帅，波利比乌斯《通史》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_12: {
        generalId: 'bfe3_12',
        generalName: '匈奴单于',
        factionId: 'xiongnu',
        portrait: '',
        note: '史无载，拟名：战国晚期匈奴单于（头曼之前史无详名），《史记·廉颇蔺相如列传》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_16: {
        generalId: 'bfe3_16',
        generalName: '桀骏',
        factionId: 'xiou',
        portrait: '',
        note: '实有其人：译吁宋死后推桀骏为将继续抗秦，《淮南子·人间训》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_18: {
        generalId: 'bfe3_18',
        generalName: '陈馀',
        factionId: 'zhao',
        portrait: '',
        note: '实有其人：成安君陈馀（与赵王歇），《史记·淮阴侯列传》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_19: {
        generalId: 'bfe3_19',
        generalName: '斯科帕斯',
        factionId: 'tuolemi',
        portrait: '',
        note: '实有其人：埃托利亚雇佣军统帅斯科帕斯，波利比乌斯《通史》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_21: {
        generalId: 'bfe3_21',
        generalName: '锡诺普执政官',
        factionId: 'bendou_d',
        portrait: '',
        note: '史无载，拟名：锡诺普为黑海南岸独立希腊化城邦，波利比乌斯《通史》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_22: {
        generalId: 'bfe3_22',
        generalName: '驺郢',
        factionId: 'yue',
        portrait: '',
        note: '实有其人：闽越王驺郢，《史记·东越列传》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_23: {
        generalId: 'bfe3_23',
        generalName: '塞隆',
        factionId: 'sailiugu',
        portrait: '',
        note: '实有其人：叙利亚军司令塞隆（Seron），《马加比一书》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_25: {
        generalId: 'bfe3_25',
        generalName: '埃拉拉',
        factionId: 'zhuluo',
        portrait: '',
        note: '实有其人：朱罗王／达罗毗荼入侵者埃拉拉（Elara），斯里兰卡《大史》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_26: {
        generalId: 'bfe3_26',
        generalName: '月氏王',
        factionId: 'yuezhi',
        portrait: '',
        note: '史无载，拟名：乌孙昆莫猎骄靡击走西迁大月氏王（大月氏王被杀，史未记名），《汉书·张骞传》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_27: {
        generalId: 'bfe3_27',
        generalName: '婆苏密多罗',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：巽伽王朝普希亚米特拉之孙婆苏密多罗，迦梨陀娑《摩罗维迦与阿耆尼密多罗》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_29: {
        generalId: 'bfe3_29',
        generalName: '纳巴泰海盗首领',
        factionId: 'alabo',
        portrait: '',
        note: '史无载，拟名：托勒密王朝红海商路驱逐纳巴泰海盗，阿加索尔基德斯《论红海》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_30: {
        generalId: 'bfe3_30',
        generalName: '匈奴左贤王',
        factionId: 'xiongnu',
        portrait: '',
        note: '史无载，拟名：元光六年匈奴骑兵围李广，《史记·李将军列传》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_33: {
        generalId: 'bfe3_33',
        generalName: '邦国首领',
        factionId: 'tubo',
        portrait: '',
        note: '史无载，拟名：赞普聂赤赞普一统雅隆诸邦，《贤者喜宴》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_35: {
        generalId: 'bfe3_35',
        generalName: '公孙敖',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：汉因受降城被围派公孙敖筑塞及守城，《汉书·匈奴传》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_39: {
        generalId: 'bfe3_39',
        generalName: '开陵侯',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：汉开陵侯成娩率楼兰六国兵击车师，《汉书·西域传》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_41: {
        generalId: 'bfe3_41',
        generalName: '奇里乞亚海盗首领',
        factionId: 'panjun',
        portrait: '',
        note: '史无载，拟名：庞培平定地中海奇里乞亚海盗同盟，普鲁塔克《庞培传》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_42: {
        generalId: 'bfe3_42',
        generalName: '龟兹贵族',
        factionId: 'qiuci',
        portrait: '',
        note: '史无载，拟名：龟兹副王姑翼被汉立温宿王所杀，汉廷立白霸，《汉书·西域传》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_43: {
        generalId: 'bfe3_43',
        generalName: '杨玉',
        factionId: 'xianlingqiang',
        portrait: '',
        note: '实有其人：先零首领杨玉、犹非，《汉书·赵充国传》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_44: {
        generalId: 'bfe3_44',
        generalName: '靡忘',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：罕羌首领靡忘，《汉书·赵充国传》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_45: {
        generalId: 'bfe3_45',
        generalName: '郑吉',
        factionId: 'xiyuduhu',
        portrait: '',
        note: '实有其人：首任西域都护郑吉，《汉书·郑吉传》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_47: {
        generalId: 'bfe3_47',
        generalName: '莎车王',
        factionId: 'shache',
        portrait: '',
        note: '史无载，拟名：汉代西域子合国与莎车国冲突，《汉书·西域传》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_50: {
        generalId: 'bfe3_50',
        generalName: '头兰',
        factionId: 'yelang',
        portrait: '',
        note: '实有其人：牂柯夜郎王兴反，毋波击杀夜郎侯头兰，《汉书·西南夷传》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_51: {
        generalId: 'bfe3_51',
        generalName: '佩特罗尼乌斯',
        factionId: 'luoma_diguo',
        portrait: '',
        note: '实有其人：罗马埃及省总督盖乌斯·佩特罗尼乌斯，斯特拉波《地理学》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_53: {
        generalId: 'bfe3_53',
        generalName: '且末王',
        factionId: 'qiemo',
        portrait: '',
        note: '史无载，拟名：去胡来为婼羌国王，抗御且末，《汉书·西域传》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_54: {
        generalId: 'bfe3_54',
        generalName: '匈奴奥鞬日逐王',
        factionId: 'xiongnu',
        portrait: '',
        note: '史无载，拟名：新莽天凤年间鲜卑拓跋推寅率部南迁与匈奴边部战，《魏书·序纪》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_55: {
        generalId: 'bfe3_55',
        generalName: '斯基泰首领',
        factionId: 'sijitai',
        portrait: '',
        note: '史无载，拟名：提比略封阿斯普尔格斯为博斯普鲁斯王抗斯基泰',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_56: {
        generalId: 'bfe3_56',
        generalName: '王寻',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：王莽大司空王邑、大司徒王寻（王寻阵亡），《后汉书·光武帝纪》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_57: {
        generalId: 'bfe3_57',
        generalName: '樊参',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：更始定安王王匡、大将军樊参（樊参被斩），《后汉书·邓禹传》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_58: {
        generalId: 'bfe3_58',
        generalName: '张步',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：割据齐地军阀张步，《后汉书·耿弇传》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_59: {
        generalId: 'bfe3_59',
        generalName: '叙利亚行省提督',
        factionId: 'luoma_diguo',
        portrait: '',
        note: '史无载，拟名：奥斯若恩阿布加尔五世时期对抗罗马东部防线驻军，塔西佗《编年史》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_60: {
        generalId: 'bfe3_60',
        generalName: '索头部酋领',
        factionId: 'yunzhong',
        portrait: '',
        note: '史无载，拟名：索头鲜卑早期推拓跋毛为五部酋长，《魏书·序纪》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_62: {
        generalId: 'bfe3_62',
        generalName: '赫尔迈奥斯残部',
        factionId: 'panjun',
        portrait: '',
        note: '史无载，拟名：贵霜丘就却灭高附希腊化末王残余政权，《后汉书·西域传》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_63: {
        generalId: 'bfe3_63',
        generalName: '霍尔多尼乌斯',
        factionId: 'luoma_diguo',
        portrait: '',
        note: '实有其人：罗马莱茵军团统帅霍尔多尼乌斯·弗拉克库斯，塔西佗《历史》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_65: {
        generalId: 'bfe3_65',
        generalName: '帕提亚总督',
        factionId: 'panjun',
        portrait: '',
        note: '史无载，拟名：迦腻色迦一世驱逐帕提亚安息势力定都富楼沙，拉巴塔克铭文',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_66: {
        generalId: 'bfe3_66',
        generalName: '零昌残党首领',
        factionId: 'panjun',
        portrait: '',
        note: '史无载，拟名：延熹四年皇甫规平定陇右并州零羌叛军，《后汉书·皇甫规传》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_67: {
        generalId: 'bfe3_67',
        generalName: '王国',
        factionId: 'liangzhou',
        portrait: '',
        note: '实有其人：凉州叛军推王国为统帅围陈仓，《后汉书·皇甫嵩传》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_68: {
        generalId: 'bfe3_68',
        generalName: '严纲',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：公孙瓒以严纲为先锋骑兵，麴义斩严纲，《三国志·公孙瓒传》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_75: {
        generalId: 'bfe3_75',
        generalName: '刘胄',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：汶山及南中夷帅刘胄作乱，马忠斩之，《三国志·马忠传》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_76: {
        generalId: 'bfe3_76',
        generalName: '曹爽',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：魏大将军曹爽、夏侯玄南征入骆谷，《三国志·王平传》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_80: {
        generalId: 'bfe3_80',
        generalName: '张微',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：晋广汉太守张微（张嶷之孙，被斩），《晋书·李特载记》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_83: {
        generalId: 'bfe3_83',
        generalName: '李势',
        factionId: 'chenghan',
        portrait: '',
        note: '实有其人：成汉末代皇帝李势，《晋书·桓温传》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_84: {
        generalId: 'bfe3_84',
        generalName: '麦罗埃国王',
        factionId: 'kushi',
        portrait: '',
        note: '史无载，拟名：阿克苏姆埃扎纳碑铭记载其出兵攻灭麦罗埃（库施末期王）',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_85: {
        generalId: 'bfe3_85',
        generalName: '石琨',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：后赵汝阴王石琨率张春等十万大军伐闵，《晋书·冉闵载记》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_86: {
        generalId: 'bfe3_86',
        generalName: '克诺多马尔',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：阿拉曼尼国王克诺多马尔，阿米亚努斯·马尔切利努斯《罗马史》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_87: {
        generalId: 'bfe3_87',
        generalName: '慕容评',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：前燕太傅太原王慕容评，《晋书·王猛传》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_89: {
        generalId: 'bfe3_89',
        generalName: '高车酋长',
        factionId: 'gaoche',
        portrait: '',
        note: '史无载，拟名：柔然社仑破高车诸部立柔然汗国，《魏书·蠕蠕传》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_90: {
        generalId: 'bfe3_90',
        generalName: '慕容超',
        factionId: 'panjun',
        portrait: '',
        note: '实有其人：南燕末主慕容超，《宋书·武帝纪》',
    },
};

/** 按 id 取战场人物（查不到返回 null） */
export function getBattlefieldCharacter(generalId: string): BattlefieldCharacter | null {
    return BATTLEFIELD_CHARACTERS[generalId] ?? null;
}

/** 某位人物是不是「只在场战上出现的人」（不参与城池掷将） */
export function isBattlefieldCharacter(generalId: string): boolean {
    return Object.prototype.hasOwnProperty.call(BATTLEFIELD_CHARACTERS, generalId);
}

/** 取全部战场人物（编辑器下拉用，按名字排序） */
export function getAllBattlefieldCharacters(): BattlefieldCharacter[] {
    return Object.values(BATTLEFIELD_CHARACTERS)
        .slice()
        .sort((a, b) => a.generalName.localeCompare(b.generalName, 'zh'));
}
