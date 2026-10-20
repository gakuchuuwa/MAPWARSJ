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

    // 🔴 [2026-09-19 主人令] 村上武吉**已归位为据点守将**（能岛城，伊予势力），
    //    不再属于战场人物表 —— 此处原条目已移除（他重新有了自己的城）。
    // ── 沙隆战役（451）西罗马方主帅 ──────────────────────────────
    // ── 哈利卡纳苏斯围城战（前334）波斯方主帅 ────────────────────
    // ── 巴尔干战役（前335）守方主帅 —— 🔴 [2026-09-25 主人「甲，批准」] ──────────
    //    底比斯本城的锚定武将是伊巴密浓达（公元前362年已死），不能动；这一仗的守将按史料另立，
    //    剧本攻城时由 scriptPeriod.getScriptSiegeDefenderGeneral 顶到城防上。
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
    // 🔴 [2026-10-20 主人令「621 虎牢关敌将空着，现在该怎么弄就怎么弄」] 窦建德为史有其人（夏王 573–621），仅在该战出场，登记为战场人物，不重建已删的「夏」势力
    // 🔴 [2026-10-20 首战规则] 867 尼沙普尔：塔希尔王朝末王穆罕默德·伊本·塔希尔（史有其人，生卒不详）
    // 🔴 [2026-10-20 首战规则] 962 阿勒颇：拜占庭皇帝尼基弗鲁斯二世（史有其人）
    // 🔴 [2026-10-20 首战规则] 前275 大象之战：高卢首领姓名不载，拟名「卢塔里乌斯」
    bfe_gaul_chief: { generalId: 'bfe_gaul_chief', generalName: '卢塔里乌斯', factionId: 'gaolu_luoma', portrait: '', note: '史无载，拟名：前275 年安条克一世破高卢人之役，高卢首领姓名未传。' },
    // 🔴 [2026-10-20 首战规则] 1744 努瓦科特：加德满都马拉王姓名不载，拟名「拉纳吉特·马拉」
    bfe_malla_king: { generalId: 'bfe_malla_king', generalName: '拉纳吉特·马拉', factionId: 'gurkha', portrait: '', note: '史无载，拟名：1744 年廓尔喀攻努瓦科特时马拉王姓名未确载。' },
    // 🔴 [2026-10-20 首战规则] 1514 斯摩棱斯克：立陶宛守将尤里·格列博维奇（史有其人，生卒不详）
    bfe_zhao_handa_guard: { generalId: 'bfe_zhao_handa_guard', generalName: '赵午', factionId: 'zhao', portrait: '', note: '史无载，拟名：前353 年桂陵之战时邯郸赵军守将姓名未传。' },
    bfe_gandhara_king: { generalId: 'bfe_gandhara_king', generalName: '婆罗那', factionId: 'jibin', portrait: '', note: '史无载，拟名：498 年犍陀罗远征时罽宾／犍陀罗王姓名未传。' },
    bfe_shaah_sultan: { generalId: 'bfe_shaah_sultan', generalName: '阿达利', factionId: 'xiaoa', portrait: '', note: '史无载，拟名：1529 年欣比拉库雷之役肖阿苏丹姓名未传。' },
    bfe_phagmo_depsi: { generalId: 'bfe_phagmo_depsi', generalName: '札巴坚赞', factionId: 'lang_clan', portrait: '', note: '史无载，拟名：1618 年羊卓之战帕竹第司姓名未确载。' },
    bfe_tsangpa_general: { generalId: 'bfe_tsangpa_general', generalName: '丹增', factionId: 'tsangpa', portrait: '', note: '史无载，拟名：1639 年普纳卡之战藏巴军主将姓名未载。' },
    bfe_portuguese_officer: { generalId: 'bfe_portuguese_officer', generalName: '迪奥戈·苏亚雷斯', factionId: 'putaoya', portrait: '', note: '史无载，拟名：1641 年姆博罗雷之战葡萄牙军官姓名未传。' },
    bfe_azov_pasha: { generalId: 'bfe_azov_pasha', generalName: '侯赛因帕夏', factionId: 'osman', portrait: '', note: '史无载，拟名：1641 年阿速夫围城奥斯曼统帅姓名未确载。' },
    bfe_tayson_general: { generalId: 'bfe_tayson_general', generalName: '阮文宝', factionId: 'dayue', portrait: '', note: '史无载，拟名：1801 年归仁守将姓名未载。' },
    bfe_multan_governor: { generalId: 'bfe_multan_governor', generalName: '穆扎法尔汗', factionId: 'dulan_d', portrait: '', note: '史无载，拟名：1818 年木尔坦杜兰尼总督姓名未载。' },
    bfe_jamrud_commander: { generalId: 'bfe_jamrud_commander', generalName: '汗·瓦利', factionId: 'dulan_d', portrait: '', note: '史无载，拟名：1837 年贾姆鲁德要塞守将姓名未载。' },
    // 🔴 [2026-10-20 首战规则] 1716 科孚：奥斯曼远征统帅姓名未确载，拟名「达马德·阿里帕夏」
    bfe_corfu_ottoman: { generalId: 'bfe_corfu_ottoman', generalName: '达马德·阿里帕夏', factionId: 'osman', portrait: '', note: '史无载，拟名：1716 年科孚岛围攻奥斯曼统帅姓名未确载。' },
    // 🔴 [2026-10-20 首战规则] 1605 苏菲扬：奥斯曼统帅姓名未确载，拟名「尤素福帕夏」
    bfe_yusuf_pasha: { generalId: 'bfe_yusuf_pasha', generalName: '尤素福帕夏', factionId: 'osman', portrait: '', note: '史无载，拟名：1605 年苏菲扬战役奥斯曼统帅姓名未确载。' },
    // 🔴 [2026-10-20 首战规则] 1575 德尔纳特：葡萄牙要塞司令姓名不载，拟名「若昂·德·梅斯基塔」
    bfe_ternate_portuguese: { generalId: 'bfe_ternate_portuguese', generalName: '若昂·德·梅斯基塔', factionId: 'putaoya', portrait: '', note: '史无载，拟名：1575 年德尔纳特逐葡战，葡萄牙要塞司令姓名未传。' },
    // 🔴 [2026-10-20 首战规则] 1248 塞维利亚围城：守将姓名不载，拟名「阿布·贝克尔」
    bfe_sevilla_guard: { generalId: 'bfe_sevilla_guard', generalName: '阿布·贝克尔', factionId: 'muwaxide', portrait: '', note: '史无载，拟名：1248 年塞维利亚围城守将姓名未传。' },
    // 🔴 [2026-10-20 首战规则] 1366 加里波利：奥斯曼守将姓名不载，拟名「哈桑·贝伊」
    bfe_gallipoli_guard: { generalId: 'bfe_gallipoli_guard', generalName: '哈桑·贝伊', factionId: 'osman', portrait: '', note: '史无载，拟名：1366 年萨伏依十字军攻加里波利，奥斯曼守将姓名未传。' },
    // 🔴 [2026-10-20 首战规则] 1354 帕竹攻灭萨迦：萨迦末代本钦姓名不载，拟名「旺尊」
    bfe_sakya_ponchen: { generalId: 'bfe_sakya_ponchen', generalName: '旺尊', factionId: 'khon', portrait: '', note: '史无载，拟名：1354 年绛曲坚赞攻灭萨迦时萨迦本钦姓名未传。' },
    // 🔴 [2026-10-20 首战规则] 745 桑乾河：奚／契丹联军首领，拟名奚王「李延宠」（奚王李延宠见于唐开元末，此役按奚部首领拟名）
    bfe_xiwang_liyanchong: { generalId: 'bfe_xiwang_liyanchong', generalName: '李延宠', factionId: 'kumo', portrait: '', note: '拟名：745 年桑乾河之战奚／契丹联军首领，姓名不载，按奚王拟名。' },
    // 🔴 [2026-10-20 首战规则] 1101 十字军：伦巴第十字军统领「阿尔伯特」（史有其人，生卒不详）
    // 🔴 [2026-10-20 首战规则] 1111 萨尔尼察河：库曼汗姓名不载，拟名「沙鲁」
    bfe_kuman_khan: { generalId: 'bfe_kuman_khan', generalName: '沙鲁', factionId: 'kuman_oleshky', portrait: '', note: '史无载，拟名：1111 年萨尔尼察河之战库曼汗姓名未传。' },
    // 🔴 [2026-10-20 首战规则] 645 辽东城之战：高句丽守将姓名不载，拟名「高延武」（高句丽王族姓高）
    bfe_liaodong_guard: { generalId: 'bfe_liaodong_guard', generalName: '高延武', factionId: 'gaogouli', portrait: '', note: '史无载，拟名：645 年唐攻辽东城，高句丽守将姓名未传。' },
    // 🔴 [2026-10-20 首战规则] 662 天山之战：铁勒九姓首领姓名不载，拟名叶护「骨利干」
    bfe_tiele_yehu: { generalId: 'bfe_tiele_yehu', generalName: '骨利干', factionId: 'tujue', portrait: '', note: '史无载，拟名：662 年薛仁贵天山破铁勒，铁勒九姓首领姓名未传。' },
    // 🔴 [2026-10-20 首战规则] 965 萨尔克尔之战：可萨汗姓名不载，拟名「伊尔克」
    bfe_khazar_khan: { generalId: 'bfe_khazar_khan', generalName: '伊尔克', factionId: 'kesa', portrait: '', note: '史无载，拟名：965 年斯维亚托斯拉夫破可萨，可萨汗姓名未传。' },
    // 🔴 [2026-10-20 首战规则] 1242 楚德湖冰上战役条顿/利沃尼亚骑士团主将姓名未传 → 拟名战场人物（立绘留空）
    bfe_teutonic_jiang: {
        generalId: 'bfe_teutonic_jiang',
        generalName: '条顿骑士团主将',
        factionId: 'tiaodun_qishi',
        portrait: '',
        note: '史无载，拟名：1242 年楚德湖冰上战役，条顿/利沃尼亚骑士团主将姓名未传。',
    },
    // 🔴 [2026-10-20 首战规则] 1292 兰甘亨夺取洛坤，单马令王国（三佛齐属国）守将姓名未传 → 拟名战场人物（立绘留空）
    bfe_tambralinga_jiang: {
        generalId: 'bfe_tambralinga_jiang',
        generalName: '单马令守将',
        factionId: 'sanfoqi',
        portrait: '',
        note: '史无载，拟名：1292 年兰甘亨攻洛坤，单马令王国守将姓名未传。',
    },
    // 🔴 [2026-10-20 首战规则] 1292 孟莱攻哈利奔猜，末代孟王姓名未传 → 拟名战场人物（立绘留空）
    bfe_hariphunchai_wang: {
        generalId: 'bfe_hariphunchai_wang',
        generalName: '哈利奔猜王',
        factionId: 'mon',
        portrait: '',
        note: '史无载，拟名：1292 年孟莱攻灭哈利奔猜，末代孟王姓名未传。',
    },
    // 🔴 [2026-10-20 首战规则] 1302 巴菲乌斯战役拜占庭守将姓名未传 → 拟名战场人物（立绘留空）
    bfe_bapheus_shoujiang: {
        generalId: 'bfe_bapheus_shoujiang',
        generalName: '巴菲乌斯拜占庭守将',
        factionId: 'baizanting',
        portrait: '',
        note: '史无载，拟名：1302 年奥斯曼破拜占庭于巴菲乌斯，拜占庭守将姓名未传。',
    },
    // 🔴 [2026-10-20 首战规则] 1303 奇托尔攻城战拉其普特守将姓名未传 → 拟名战场人物（立绘留空）
    bfe_chittor_shoujiang: {
        generalId: 'bfe_chittor_shoujiang',
        generalName: '奇托尔拉其普特守将',
        factionId: 'suomunate',
        portrait: '',
        note: '史无载，拟名：1303 年阿拉乌丁攻奇托尔，拉其普特守将姓名未传。',
    },
    // 🔴 [2026-10-20 首战规则] 1321 伊尔平河战役罗斯诸公主帅姓名未传 → 拟名战场人物（立绘留空）
    bfe_irpen_jiang: {
        generalId: 'bfe_irpen_jiang',
        generalName: '伊尔平河罗斯主将',
        factionId: 'luosi',
        portrait: '',
        note: '史无载，拟名：1321 年格迪米纳斯败罗斯诸公于伊尔平河，罗斯主将姓名未传。',
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
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_jin_general: {
        generalId: 'bfe_jin_general',
        generalName: '晋军主将 栾施',
        factionId: 'jin',
        portrait: '',
        note: '实有其人（晋大夫栾施）；此役晋军主将史无载，取同期晋将拟任。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_ba_rebel: {
        generalId: 'bfe_ba_rebel',
        generalName: '巴国叛首 巴稷',
        factionId: 'ba',
        portrait: '',
        note: '史无载，拟名：巴国内乱首领名字未传。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_persian_rebel: {
        generalId: 'bfe_persian_rebel',
        generalName: '波斯叛首 阿萨西斯',
        factionId: 'aqimeinide',
        portrait: '',
        note: '史无载，拟名：卡曼尼亚地方叛军首领名字未传。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_qielan_lord: {
        generalId: 'bfe_qielan_lord',
        generalName: '且兰君 耆',
        factionId: 'miao_qing',
        portrait: '',
        note: '史无载，拟名：且兰君长名字未传。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_roman_merchant: {
        generalId: 'bfe_roman_merchant',
        generalName: '罗马行商首领 卢基乌斯·李锡尼乌斯',
        factionId: 'luoma_diguo',
        portrait: '',
        note: '史无载，拟名：塞纳布姆被杀的罗马行商首领名字未传。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_zhang_hong: {
        generalId: 'bfe_zhang_hong',
        generalName: '越嶲太守',
        factionId: 'panjun',
        portrait: '',
        note: '史无载，拟名（不具名）：越嶲太守讨任贵，正史无明载。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    bfe_zhang_qiao: {
        generalId: 'bfe_zhang_qiao',
        generalName: '益州太守 张乔',
        factionId: 'panjun',
        portrait: '',
        note: '史无载，拟名：此役汉军主将史无载，取同期益州太守张乔拟任。',
    },
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
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
        generalName: '苏莱曼沙',
        factionId: 'panjun',
        portrait: '',
        note: '史无载，拟名：伊儿汗国残部将领，名字未传。',
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
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    // 🔴 [2026-10-20 主人令「要给武将起名字」] 起义（panjun）首战补的敌将
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_xianyun_chief: {
        generalId: 'bfe2_xianyun_chief',
        generalName: '猃狁酋 允格',
        factionId: 'panjun',
        portrait: '',
        note: '史无载，拟名：猃狁首领名字未传。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_yun_lord: {
        generalId: 'bfe2_yun_lord',
        generalName: '郧君 熊咺',
        factionId: 'panjun',
        portrait: '',
        note: '史无载，拟名：郧国国君名字未传。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    bfe2_memphis_warden: {
        generalId: 'bfe2_memphis_warden',
        generalName: '帕迪阿蒙',
        factionId: 'panjun',
        portrait: '',
        note: '史无载，拟名：孟菲斯守将名字未传。',
    },
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
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
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
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
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    // 🔴 [2026-10-20 主人令「双方武将必须实名」] 首战回补·第二批
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_3: {
        generalId: 'bfe3_3',
        generalName: '楼烦王',
        factionId: 'loufan',
        portrait: '',
        note: '史无载，拟名：楼烦王（史未载具体名讳），《史记·赵世家》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
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
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_21: {
        generalId: 'bfe3_21',
        generalName: '锡诺普执政官',
        factionId: 'bendou_d',
        portrait: '',
        note: '史无载，拟名：锡诺普为黑海南岸独立希腊化城邦，波利比乌斯《通史》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_26: {
        generalId: 'bfe3_26',
        generalName: '月氏王',
        factionId: 'yuezhi',
        portrait: '',
        note: '史无载，拟名：乌孙昆莫猎骄靡击走西迁大月氏王（大月氏王被杀，史未记名），《汉书·张骞传》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
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
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
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
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_47: {
        generalId: 'bfe3_47',
        generalName: '莎车王',
        factionId: 'shache',
        portrait: '',
        note: '史无载，拟名：汉代西域子合国与莎车国冲突，《汉书·西域传》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
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
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
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
        generalName: '狄奥菲洛斯',
        factionId: 'panjun',
        portrait: '',
        note: '史无载，拟名：赫尔迈奥斯残部（高附希腊化末王残党）首领，姓名未传，《后汉书·西域传》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
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
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_84: {
        generalId: 'bfe3_84',
        generalName: '麦罗埃国王',
        factionId: 'kushi',
        portrait: '',
        note: '史无载，拟名：阿克苏姆埃扎纳碑铭记载其出兵攻灭麦罗埃（库施末期王）',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    bfe3_89: {
        generalId: 'bfe3_89',
        generalName: '高车酋长',
        factionId: 'gaoche',
        portrait: '',
        note: '史无载，拟名：柔然社仑破高车诸部立柔然汗国，《魏书·蠕蠕传》',
    },
    // 🔴 [2026-10-20 主人查史料回填·古典时代] 首战敌将
    // 1213 中山之战：金中山守将姓名未载，拟名「完颜守忠」
    bfe_jin_zhongshan: { generalId: 'bfe_jin_zhongshan', generalName: '完颜守忠', factionId: 'jin_d', portrait: '', note: '史无载，拟名：1213 年蒙古攻中山时金军守将姓名未传。' },
    // 1372 河西之战：元亦集乃路守将姓名未载，拟名「朵儿只」
    bfe_yuan_hexi: { generalId: 'bfe_yuan_hexi', generalName: '朵儿只', factionId: 'yuan', portrait: '', note: '史无载，拟名：1372 年明军攻河西时元军守将姓名未传。' },
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
