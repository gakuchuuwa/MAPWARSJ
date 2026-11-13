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
    bfe_cb_tuoba_1: { generalId: 'bfe_cb_tuoba_1', generalName: '叔孙建', factionId: 'tuoba', portrait: '/assets/XIANBEI/bfe_cb_tuoba_1.png', note: '🔴 [经典战导入] 历城之战敌方主将' },
    bfe_cb_yangguan_1: { generalId: 'bfe_cb_yangguan_1', generalName: '李歆', factionId: 'yangguan', portrait: '/assets/KHITAN/bfe_cb_yangguan_1.png', note: '🔴 [经典战导入] 蓼泉之战敌方主将' },
    bfe_cb_luoma_diguo_10: { generalId: 'bfe_cb_luoma_diguo_10', generalName: '斯提里科', factionId: 'luoma_diguo', portrait: '/assets/ROMA/bfe_cb_luoma_diguo_10.png', note: '🔴 [经典战导入] 波伦提亚之战敌方主将' },
    bfe_cb_hou_qin_3: { generalId: 'bfe_cb_hou_qin_3', generalName: '姚泓', factionId: 'hou_qin', portrait: '/assets/CENTRAL/bfe_cb_hou_qin_3.png', note: '🔴 [经典战导入] 长安之战敌方主将' },
    bfe_cb_liusong_1: { generalId: 'bfe_cb_liusong_1', generalName: '刘义真', factionId: 'liusong', portrait: '/assets/JIANGNAN/bfe_cb_liusong_1.png', note: '🔴 [经典战导入] 青泥之战敌方主将' },
    bfe_cb_hou_qin_2: { generalId: 'bfe_cb_hou_qin_2', generalName: '姚平', factionId: 'hou_qin', portrait: '/assets/CENTRAL/bfe_cb_hou_qin_2.png', note: '🔴 [经典战导入] 柴壁之战敌方主将' },
    bfe_cb_fushi_4: { generalId: 'bfe_cb_fushi_4', generalName: '苻登', factionId: 'fushi', portrait: '/assets/CENTRAL/bfe_cb_fushi_4.png', note: '🔴 [经典战导入] 大界之战敌方主将' },
    bfe_cb_fushi_3: { generalId: 'bfe_cb_fushi_3', generalName: '彭超', factionId: 'fushi', portrait: '/assets/CENTRAL/bfe_cb_fushi_3.png', note: '🔴 [经典战导入] 君川之战敌方主将' },
    bfe_cb_murong_1: { generalId: 'bfe_cb_murong_1', generalName: '慕容庄', factionId: 'murong', portrait: '/assets/XIANBEI/bfe_cb_murong_1.png', note: '🔴 [经典战导入] 晋阳之战敌方主将' },
    bfe_cb_fushi_2: { generalId: 'bfe_cb_fushi_2', generalName: '苻丕', factionId: 'fushi', portrait: '/assets/CENTRAL/bfe_cb_fushi_2.png', note: '🔴 [经典战导入] 邺城之战敌方主将' },
    bfe_cb_sashan_2: { generalId: 'bfe_cb_sashan_2', generalName: '沙普尔二世', factionId: 'sashan', portrait: '/assets/SASANIAN/bfe_cb_sashan_2.png', note: '🔴 [经典战导入] 泰西封之战敌方主将' },
    bfe_cb_xianbei_2: { generalId: 'bfe_cb_xianbei_2', generalName: '段龛', factionId: 'xianbei', portrait: '/assets/XIANBEI/bfe_cb_xianbei_2.png', note: '🔴 [经典战导入] 广固之战敌方主将' },
    bfe_cb_hou_zhao_1: { generalId: 'bfe_cb_hou_zhao_1', generalName: '石祗', factionId: 'hou_zhao', portrait: '/assets/WEI/bfe_cb_hou_zhao_1.png', note: '🔴 [经典战导入] 襄国之战敌方主将' },
    bfe_cb_fushi_1: { generalId: 'bfe_cb_fushi_1', generalName: '苻健', factionId: 'fushi', portrait: '/assets/CENTRAL/bfe_cb_fushi_1.png', note: '🔴 [经典战导入] 蓝田灞水之战敌方主将' },
    bfe_cb_xianbei_1: { generalId: 'bfe_cb_xianbei_1', generalName: '宇文逸豆归', factionId: 'xianbei', portrait: '/assets/XIANBEI/bfe_cb_xianbei_1.png', note: '🔴 [经典战导入] 威德城之战敌方主将' },
    bfe_cb_gaogouli_1: { generalId: 'bfe_cb_gaogouli_1', generalName: '高钊', factionId: 'gaogouli', portrait: '/assets/KOREA/bfe_cb_gaogouli_1.png', note: '🔴 [经典战导入] 丸都之战敌方主将' },
    bfe_cb_dongjin_5: { generalId: 'bfe_cb_dongjin_5', generalName: '曹嶷', factionId: 'dongjin', portrait: '/assets/CENTRAL/bfe_cb_dongjin_5.png', note: '🔴 [经典战导入] 广固之战敌方主将' },
    bfe_cb_dongjin_4: { generalId: 'bfe_cb_dongjin_4', generalName: '司马邺', factionId: 'dongjin', portrait: '/assets/CENTRAL/bfe_cb_dongjin_4.png', note: '🔴 [经典战导入] 长安之战敌方主将' },
    bfe_cb_luoma_diguo_9: { generalId: 'bfe_cb_luoma_diguo_9', generalName: '李锡尼', factionId: 'luoma_diguo', portrait: '/assets/ROMA/bfe_cb_luoma_diguo_9.png', note: '🔴 [经典战导入] 阿德里安堡之战敌方主将' },
    bfe_cb_dongjin_3: { generalId: 'bfe_cb_dongjin_3', generalName: '王浚', factionId: 'dongjin', portrait: '/assets/CENTRAL/bfe_cb_dongjin_3.png', note: '🔴 [经典战导入] 蓟城之战敌方主将' },
    bfe_cb_dongjin_2: { generalId: 'bfe_cb_dongjin_2', generalName: '司马越', factionId: 'dongjin', portrait: '/assets/CENTRAL/bfe_cb_dongjin_2.png', note: '🔴 [经典战导入] 洛阳西明门之战敌方主将' },
    bfe_cb_dongjin_1: { generalId: 'bfe_cb_dongjin_1', generalName: '罗尚', factionId: 'dongjin', portrait: '/assets/CENTRAL/bfe_cb_dongjin_1.png', note: '🔴 [经典战导入] 成都之战敌方主将' },
    bfe_cb_luoma_diguo_8: { generalId: 'bfe_cb_luoma_diguo_8', generalName: '戈尔迪安三世', factionId: 'luoma_diguo', portrait: '/assets/ROMA/bfe_cb_luoma_diguo_8.png', note: '🔴 [经典战导入] 米西奇之战敌方主将' },
    bfe_cb_caowei_4: { generalId: 'bfe_cb_caowei_4', generalName: '钟会', factionId: 'caowei', portrait: '/assets/CENTRAL/bfe_cb_caowei_4.png', note: '🔴 [经典战导入] 剑阁之战敌方主将' },
    bfe_cb_gongsun_d_1: { generalId: 'bfe_cb_gongsun_d_1', generalName: '公孙渊', factionId: 'gongsun_d', portrait: '/assets/WEI/bfe_cb_gongsun_d_1.png', note: '🔴 [经典战导入] 襄平之战敌方主将' },
    bfe_cb_dianguo_1: { generalId: 'bfe_cb_dianguo_1', generalName: '孟获', factionId: 'dianguo', portrait: '/assets/BASHU/bfe_cb_dianguo_1.png', note: '🔴 [经典战导入] 南中之战敌方主将' },
    bfe_cb_sunwu_d_2: { generalId: 'bfe_cb_sunwu_d_2', generalName: '周贺', factionId: 'sunwu_d', portrait: '/assets/JIANGNAN/bfe_cb_sunwu_d_2.png', note: '🔴 [经典战导入] 成山之战敌方主将' },
    bfe_cb_caowei_3: { generalId: 'bfe_cb_caowei_3', generalName: '曹休', factionId: 'caowei', portrait: '/assets/CENTRAL/bfe_cb_caowei_3.png', note: '🔴 [经典战导入] 石亭之战敌方主将' },
    bfe_cb_yuan_shao_1: { generalId: 'bfe_cb_yuan_shao_1', generalName: '颜良', factionId: 'yuan_shao', portrait: '/assets/CENTRAL/bfe_cb_yuan_shao_1.png', note: '🔴 [经典战导入] 白马之战敌方主将' },
    bfe_cb_caowei_2: { generalId: 'bfe_cb_caowei_2', generalName: '朱光', factionId: 'caowei', portrait: '/assets/CENTRAL/bfe_cb_caowei_2.png', note: '🔴 [经典战导入] 皖城之战敌方主将' },
    bfe_cb_caowei_1: { generalId: 'bfe_cb_caowei_1', generalName: '夏侯惇', factionId: 'caowei', portrait: '/assets/CENTRAL/bfe_cb_caowei_1.png', note: '🔴 [经典战导入] 博望坡之战敌方主将' },
    bfe_cb_sunwu_d_1: { generalId: 'bfe_cb_sunwu_d_1', generalName: '朱桓', factionId: 'sunwu_d', portrait: '/assets/JIANGNAN/bfe_cb_sunwu_d_1.png', note: '🔴 [经典战导入] 濡须口之战敌方主将' },
    bfe_cb_han_d_1: { generalId: 'bfe_cb_han_d_1', generalName: '王朗', factionId: 'han_d', portrait: '/assets/CENTRAL/bfe_cb_han_d_1.png', note: '🔴 [经典战导入] 会稽之战敌方主将' },
    bfe_cb_baibo_2: { generalId: 'bfe_cb_baibo_2', generalName: '赵弘', factionId: 'baibo', portrait: '/assets/WEI/bfe_cb_baibo_2.png', note: '🔴 [经典战导入] 宛城之战敌方主将' },
    bfe_cb_baibo_1: { generalId: 'bfe_cb_baibo_1', generalName: '张梁', factionId: 'baibo', portrait: '/assets/WEI/bfe_cb_baibo_1.png', note: '🔴 [经典战导入] 广宗之战敌方主将' },
    bfe_cb_yanqi_1: { generalId: 'bfe_cb_yanqi_1', generalName: '元孟', factionId: 'yanqi', portrait: '/assets/WESTERN/bfe_cb_yanqi_1.png', note: '🔴 [经典战导入] 焉耆之战敌方主将' },
    bfe_cb_shanshan_1: { generalId: 'bfe_cb_shanshan_1', generalName: '广', factionId: 'shanshan', portrait: '/assets/WESTERN/bfe_cb_shanshan_1.png', note: '🔴 [经典战导入] 鄯善之战敌方主将' },
    bfe_cb_chagatai_1: { generalId: 'bfe_cb_chagatai_1', generalName: '安得', factionId: 'chagatai', portrait: '/assets/WESTERN/bfe_cb_chagatai_1.png', note: '🔴 [经典战导入] 车师之战敌方主将' },
    bfe_cb_luoma_diguo_7: { generalId: 'bfe_cb_luoma_diguo_7', generalName: '凯里亚利斯', factionId: 'luoma_diguo', portrait: '/assets/ROMA/bfe_cb_luoma_diguo_7.png', note: '🔴 [经典战导入] 卡斯特拉韦特拉之战敌方主将' },
    bfe_cb_qi_2: { generalId: 'bfe_cb_qi_2', generalName: '费邑', factionId: 'qi', portrait: '/assets/CENTRAL/bfe_cb_qi_2.png', note: '🔴 [经典战导入] 祝阿之战敌方主将' },
    bfe_cb_zhao_3: { generalId: 'bfe_cb_zhao_3', generalName: '王郎', factionId: 'zhao', portrait: '/assets/WEI/bfe_cb_zhao_3.png', note: '🔴 [经典战导入] 邯郸之战敌方主将' },
    bfe_cb_bendou_d_1: { generalId: 'bfe_cb_bendou_d_1', generalName: '法尔纳克二世', factionId: 'bendou_d', portrait: '/assets/BYZANTINE/bfe_cb_bendou_d_1.png', note: '🔴 [经典战导入] 泽拉之战敌方主将' },
    bfe_cb_seleisi_2: { generalId: 'bfe_cb_seleisi_2', generalName: '斯巴达克斯', factionId: 'seleisi', portrait: '/assets/THRACIAN/bfe_cb_seleisi_2.png', note: '🔴 [经典战导入] 西拉鲁斯河之战敌方主将' },
    bfe_cb_luoma_diguo_6: { generalId: 'bfe_cb_luoma_diguo_6', generalName: '科塔', factionId: 'luoma_diguo', portrait: '/assets/ROMA/bfe_cb_luoma_diguo_6.png', note: '🔴 [经典战导入] 卡尔西顿之战敌方主将' },
    bfe_cb_xiongnu_1: { generalId: 'bfe_cb_xiongnu_1', generalName: '军臣单于', factionId: 'xiongnu', portrait: '/assets/XIANBEI/bfe_cb_xiongnu_1.png', note: '🔴 [经典战导入] 河南之战敌方主将' },
    bfe_cb_sailiugu_2: { generalId: 'bfe_cb_sailiugu_2', generalName: '吕西亚斯', factionId: 'sailiugu', portrait: '/assets/GREECE/bfe_cb_sailiugu_2.png', note: '🔴 [经典战导入] 伯特夙之战敌方主将' },
    bfe_cb_sailiugu_1: { generalId: 'bfe_cb_sailiugu_1', generalName: '高尔吉亚', factionId: 'sailiugu', portrait: '/assets/GREECE/bfe_cb_sailiugu_1.png', note: '🔴 [经典战导入] 以马忤斯之战敌方主将' },
    bfe_cb_luoma_diguo_5: { generalId: 'bfe_cb_luoma_diguo_5', generalName: '卢基乌斯西庇阿', factionId: 'luoma_diguo', portrait: '/assets/ROMA/bfe_cb_luoma_diguo_5.png', note: '🔴 [经典战导入] 马格尼西亚之战敌方主将' },
    bfe_cb_tuolemi_1: { generalId: 'bfe_cb_tuolemi_1', generalName: '托勒密四世', factionId: 'tuolemi', portrait: '/assets/ORIE/bfe_cb_tuolemi_1.png', note: '🔴 [经典战导入] 拉菲亚之战敌方主将' },
    bfe_cb_chuguo_3: { generalId: 'bfe_cb_chuguo_3', generalName: '龙且', factionId: 'chuguo', portrait: '/assets/JIANGNAN/bfe_cb_chuguo_3.png', note: '🔴 [经典战导入] 潍水之战敌方主将' },
    bfe_cb_chuguo_2: { generalId: 'bfe_cb_chuguo_2', generalName: '周章', factionId: 'chuguo', portrait: '/assets/JIANGNAN/bfe_cb_chuguo_2.png', note: '🔴 [经典战导入] 戏水之战敌方主将' },
    bfe_cb_luoma_diguo_4: { generalId: 'bfe_cb_luoma_diguo_4', generalName: '西庇阿', factionId: 'luoma_diguo', portrait: '/assets/ROMA/bfe_cb_luoma_diguo_4.png', note: '🔴 [经典战导入] 扎马之战敌方主将' },
    bfe_cb_luoma_diguo_3: { generalId: 'bfe_cb_luoma_diguo_3', generalName: '塞姆普罗尼乌斯', factionId: 'luoma_diguo', portrait: '/assets/ROMA/bfe_cb_luoma_diguo_3.png', note: '🔴 [经典战导入] 特雷比亚河之战敌方主将' },
    bfe_cb_zhao_2: { generalId: 'bfe_cb_zhao_2', generalName: '赵葱', factionId: 'zhao', portrait: '/assets/WEI/bfe_cb_zhao_2.png', note: '🔴 [经典战导入] 东阳之战敌方主将' },
    bfe_cb_manzhou_d_1: { generalId: 'bfe_cb_manzhou_d_1', generalName: '傅恒', factionId: 'manzhou_d', portrait: '/assets/NORTHEAST/bfe_cb_manzhou_d_1.png', note: '🔴 [经典战导入] 新街之战敌方主将' },
    bfe_cb_tubo_2: { generalId: 'bfe_cb_tubo_2', generalName: '阿旺策凌', factionId: 'tubo', portrait: '/assets/TIBET/bfe_cb_tubo_2.png', note: '🔴 [经典战导入] 桌子山之战敌方主将' },
    bfe_cb_ladakh_1: { generalId: 'bfe_cb_ladakh_1', generalName: '释迦嘉措', factionId: 'ladakh', portrait: '/assets/TIBET/bfe_cb_ladakh_1.png', note: '🔴 [经典战导入] 拉达克之战敌方主将' },
    bfe_cb_xibanya_1: { generalId: 'bfe_cb_xibanya_1', generalName: '布拉卡蒙特', factionId: 'xibanya', portrait: '/assets/SPANISH/bfe_cb_xibanya_1.png', note: '🔴 [经典战导入] 波多韦洛之战敌方主将' },
    bfe_cb_toyotomi_1: { generalId: 'bfe_cb_toyotomi_1', generalName: '细川忠兴', factionId: 'toyotomi', portrait: '/assets/JAPAN/bfe_cb_toyotomi_1.png', note: '🔴 [经典战导入] 晋州之战敌方主将' },
    bfe_cb_oda_1: { generalId: 'bfe_cb_oda_1', generalName: '真锅贞友', factionId: 'oda', portrait: '/assets/JAPAN/bfe_cb_oda_1.png', note: '🔴 [经典战导入] 木津川口之战敌方主将' },
    bfe_cb_ming_d_1: { generalId: 'bfe_cb_ming_d_1', generalName: '朱祁镇', factionId: 'ming_d', portrait: '/assets/WEI/bfe_cb_ming_d_1.png', note: '🔴 [经典战导入] 土木堡之战敌方主将' },
    bfe_cb_yinggelan_1: { generalId: 'bfe_cb_yinggelan_1', generalName: '威廉·德·拉·波尔', factionId: 'yinggelan', portrait: '/assets/BRITONS/bfe_cb_yinggelan_1.png', note: '🔴 [经典战导入] 奥尔良之战敌方主将' },
    bfe_cb_menggu_d_2: { generalId: 'bfe_cb_menggu_d_2', generalName: '塔尔吉', factionId: 'menggu_d', portrait: '/assets/MONGOL/bfe_cb_menggu_d_2.png', note: '🔴 [经典战导入] 德里之战敌方主将' },
    bfe_cb_menggu_d_1: { generalId: 'bfe_cb_menggu_d_1', generalName: '朵儿伯朵黑申', factionId: 'menggu_d', portrait: '/assets/MONGOL/bfe_cb_menggu_d_1.png', note: '🔴 [经典战导入] 木尔坦之战敌方主将' },
    bfe_cb_heishi_1: { generalId: 'bfe_cb_heishi_1', generalName: '平维盛', factionId: 'heishi', portrait: '/assets/JAPAN/bfe_cb_heishi_1.png', note: '🔴 [经典战导入] 富士川之战敌方主将' },
    bfe_cb_lunbadi_1: { generalId: 'bfe_cb_lunbadi_1', generalName: '雷蒙德四世', factionId: 'lunbadi', portrait: '/assets/FRANKS/bfe_cb_lunbadi_1.png', note: '🔴 [经典战导入] 梅尔济丰战役敌方主将' },
    bfe_cb_liao_d_1: { generalId: 'bfe_cb_liao_d_1', generalName: '萧绰', factionId: 'liao_d', portrait: '/assets/XIANBEI/bfe_cb_liao_d_1.png', note: '🔴 [经典战导入] 遂城之战敌方主将' },
    bfe_cb_bohai_1: { generalId: 'bfe_cb_bohai_1', generalName: '大諲譔', factionId: 'bohai', portrait: '/assets/NORTHEAST/bfe_cb_bohai_1.png', note: '🔴 [经典战导入] 忽汗城之战敌方主将' },
    bfe_cb_tahirid_2: { generalId: 'bfe_cb_tahirid_2', generalName: '易卜拉欣·本·伊利亚斯', factionId: 'tahirid', portrait: '/assets/SASANIAN/bfe_cb_tahirid_2.png', note: '🔴 [经典战导入] 赫拉特之战敌方主将' },
    bfe_cb_xiaobolu_1: { generalId: 'bfe_cb_xiaobolu_1', generalName: '苏失利之', factionId: 'xiaobolu', portrait: '/assets/TIBET/bfe_cb_xiaobolu_1.png', note: '🔴 [经典战导入] 连云堡之战敌方主将' },
    bfe_cb_dalriada_1: { generalId: 'bfe_cb_dalriada_1', generalName: '敦加尔', factionId: 'dalriada', portrait: '/assets/CELTS/bfe_cb_dalriada_1.png', note: '🔴 [经典战导入] 邓哈芬之战敌方主将' },
    bfe_cb_tubo_1: { generalId: 'bfe_cb_tubo_1', generalName: '跋地设', factionId: 'tubo', portrait: '/assets/TIBET/bfe_cb_tubo_1.png', note: '🔴 [经典战导入] 烽子山之战敌方主将' },
    bfe_cb_tujue_1: { generalId: 'bfe_cb_tujue_1', generalName: '欲谷设', factionId: 'tujue', portrait: '/assets/MONGOL/bfe_cb_tujue_1.png', note: '🔴 [经典战导入] 马鬣山之战敌方主将' },
    bfe_cb_sashan_1: { generalId: 'bfe_cb_sashan_1', generalName: '斯姆巴特', factionId: 'sashan', portrait: '/assets/SASANIAN/bfe_cb_sashan_1.png', note: '🔴 [经典战导入] 吉兰之战敌方主将' },
    bfe_cb_hou_qin_1: { generalId: 'bfe_cb_hou_qin_1', generalName: '姚洸', factionId: 'hou_qin', portrait: '/assets/CENTRAL/bfe_cb_hou_qin_1.png', note: '🔴 [经典战导入] 洛阳之战敌方主将' },
    bfe_cb_tufa_d_1: { generalId: 'bfe_cb_tufa_d_1', generalName: '秃发虎台', factionId: 'tufa_d', portrait: '/assets/KHITAN/bfe_cb_tufa_d_1.png', note: '🔴 [经典战导入] 乐都之战敌方主将' },
    bfe_cb_aizu_ashina_1: { generalId: 'bfe_cb_aizu_ashina_1', generalName: '芦名盛氏', factionId: 'aizu_ashina', portrait: '/assets/JAPAN/bfe_cb_aizu_ashina_1.png', note: '🔴 [经典战导入] 芦名家名将：会津战国大名、芦名氏第十六代当主' },
    bfe_cb_jingzhou_1: { generalId: 'bfe_cb_jingzhou_1', generalName: '黄祖', factionId: 'jingzhou', portrait: '/assets/CENTRAL/bfe_cb_jingzhou_1.png', note: '🔴 [经典战导入] 荆州名将：江夏太守' },
    bfe_cb_boootiya_1: { generalId: 'bfe_cb_boootiya_1', generalName: '伊斯梅尼亚斯', factionId: 'boootiya', portrait: '/assets/GREECE/bfe_cb_boootiya_1.png', note: '🔴 [经典战导入] 哈利亚托斯之战敌方主将' },
    bfe_cb_yan_1: { generalId: 'bfe_cb_yan_1', generalName: '太子丹', factionId: 'yan', portrait: '/assets/XIANBEI/bfe_cb_yan_1.png', note: '🔴 [经典战导入] 衍水之战敌方主将' },
    bfe_cb_zhao_1: { generalId: 'bfe_cb_zhao_1', generalName: '扈辄', factionId: 'zhao', portrait: '/assets/CENTRAL/bfe_cb_zhao_1.png', note: '🔴 [经典战导入] 平阳之战敌方主将' },
    bfe_cb_qin_2: { generalId: 'bfe_cb_qin_2', generalName: '蒙骜', factionId: 'qin', portrait: '/assets/CENTRAL/bfe_cb_qin_2.png', note: '🔴 [经典战导入] 河外之战敌方主将' },
    bfe_cb_wei_1: { generalId: 'bfe_cb_wei_1', generalName: '公孙喜', factionId: 'wei', portrait: '/assets/CENTRAL/bfe_cb_wei_1.png', note: '🔴 [经典战导入] 伊阙之战敌方主将' },
    bfe_cb_luoma_diguo_2: { generalId: 'bfe_cb_luoma_diguo_2', generalName: '登塔图斯', factionId: 'luoma_diguo', portrait: '/assets/ROMA/bfe_cb_luoma_diguo_2.png', note: '🔴 [经典战导入] 贝内文图姆之战敌方主将' },
    bfe_cb_luoma_diguo_1: { generalId: 'bfe_cb_luoma_diguo_1', generalName: '德西乌斯', factionId: 'luoma_diguo', portrait: '/assets/ROMA/bfe_cb_luoma_diguo_1.png', note: '🔴 [经典战导入] 阿斯库路姆之战敌方主将' },
    bfe_cb_seleisi_1: { generalId: 'bfe_cb_seleisi_1', generalName: '利西马科斯', factionId: 'seleisi', portrait: '/assets/THRACIAN/bfe_cb_seleisi_1.png', note: '🔴 [经典战导入] 库鲁佩迪安之战敌方主将' },
    bfe_cb_maqidun_1: { generalId: 'bfe_cb_maqidun_1', generalName: '欧墨涅斯', factionId: 'maqidun', portrait: '/assets/MACEDONIAN/bfe_cb_maqidun_1.png', note: '🔴 [经典战导入] 帕莱塔西奈之战敌方主将' },
    bfe_cb_chuguo_1: { generalId: 'bfe_cb_chuguo_1', generalName: '楚顷襄王', factionId: 'chuguo', portrait: '/assets/JIANGNAN/bfe_cb_chuguo_1.png', note: '🔴 [经典战导入] 黔中之战敌方主将' },
    bfe_cb_antigonid_1: { generalId: 'bfe_cb_antigonid_1', generalName: '德米特里一世', factionId: 'antigonid', portrait: '/assets/MACEDONIAN/bfe_cb_antigonid_1.png', note: '🔴 [经典战导入] 加沙之战敌方主将' },
    bfe_cb_lagoniya_1: { generalId: 'bfe_cb_lagoniya_1', generalName: '阿格西劳斯二世', factionId: 'lagoniya', portrait: '/assets/SPARTANS/bfe_cb_lagoniya_1.png', note: '🔴 [经典战导入] 曼丁尼亚之战敌方主将' },
    bfe_cb_kaliya_1: { generalId: 'bfe_cb_kaliya_1', generalName: '摩索拉斯', factionId: 'kaliya', portrait: '/assets/GREECE/bfe_cb_kaliya_1.png', note: '🔴 [经典战导入] 基奥斯之战敌方主将' },
    bfe_cb_xila_1: { generalId: 'bfe_cb_xila_1', generalName: '安提奥库斯', factionId: 'xila', portrait: '/assets/ATHENIANS/bfe_cb_xila_1.png', note: '🔴 [经典战导入] 诺提姆之战敌方主将' },
    bfe_cb_wu_1: { generalId: 'bfe_cb_wu_1', generalName: '阖闾', factionId: 'wu', portrait: '/assets/JIANGNAN/bfe_cb_wu_1.png', note: '🔴 [经典战导入] 槜李之战敌方主将' },
    bfe_cb_qi_1: { generalId: 'bfe_cb_qi_1', generalName: '国书', factionId: 'qi', portrait: '/assets/JIANGNAN/bfe_cb_qi_1.png', note: '🔴 [经典战导入] 艾陵之战敌方主将' },
    bfe_cb_ldiya_1: { generalId: 'bfe_cb_ldiya_1', generalName: '克罗伊索斯', factionId: 'ldiya', portrait: '/assets/GREECE/bfe_cb_ldiya_1.png', note: '🔴 [经典战导入] 提姆布拉之战敌方主将' },
    bfe_cb_midi_1: { generalId: 'bfe_cb_midi_1', generalName: '阿斯提阿格斯', factionId: 'midi', portrait: '/assets/PERSIAN/bfe_cb_midi_1.png', note: '🔴 [经典战导入] 帕萨尔加德之战敌方主将' },
    bfe_cb_aiji_1: { generalId: 'bfe_cb_aiji_1', generalName: '尼科二世', factionId: 'aiji', portrait: '/assets/ORIE/bfe_cb_aiji_1.png', note: '🔴 [经典战导入] 卡基米什之战敌方主将' },
    bfe_cb_qin_1: { generalId: 'bfe_cb_qin_1', generalName: '孟明视', factionId: 'qin', portrait: '/assets/CENTRAL/bfe_cb_qin_1.png', note: '🔴 [经典战导入] 殽之战敌方主将' },
    bfe_cb_jialedi_1: { generalId: 'bfe_cb_jialedi_1', generalName: '米罗达巴拉旦', factionId: 'jialedi', portrait: '/assets/ORIE/bfe_cb_jialedi_1.png', note: '🔴 [经典战导入] 巴比伦之战敌方主将' },
    bfe_cb_yalan_1: { generalId: 'bfe_cb_yalan_1', generalName: '伊卢比迪', factionId: 'yalan', portrait: '/assets/ORIE/bfe_cb_yalan_1.png', note: '🔴 [经典战导入] 卡尔卡尔之战敌方主将' },
    bfe_cb_libiya_1: { generalId: 'bfe_cb_libiya_1', generalName: '斯彭迪乌斯', factionId: 'libiya', portrait: '/assets/BERBER/bfe_cb_libiya_1.png', note: '🔴 [经典战导入] 利比亚名将：第一次布匿战争后北非利比亚诸城与雇佣兵反迦太基联军统帅' },
    // 🔴 [2026-10-24 主人令「把武将中，没有名字的武将删除」]
    //   本表原登记的一批「史无载、按军职／民族拟名」的战场人物
    //   （帕维亚东罗马守将、匈奴左贤王、卡迭石王 苏穆阿达德 等共 85 位）已按令全部删除；
    //   对应经典战条目已去掉 `enemyGeneralId`，敌方主帅按引擎兜底显示为「{enemyFactionName}武将」。
    //   本表只登记**史有其人、有真名**的战场人物（例：下面这位曼努埃尔·皮雷斯）。
    bfe_portuguese_officer: { generalId: 'bfe_portuguese_officer', generalName: '皮雷斯', factionId: 'putaoya', portrait: '/assets/PORTUGUESE/bfe_portuguese_officer.png', note: '史有其人：1641 年姆博罗雷之战圣保罗 bandeira 主将 Manuel Pires（副将 Jerónimo Pedroso de Barros）；生卒无载，仅此战出场。' },

    // 🔴 [2026-11-08] 马哈木（瓦剌，顺宁王）已升级为正式据点武将（FactionGenerals 瓦剌块／科布多／瓦剌骑兵 T1），
    //    按 2026-10-25 口径本表不再保留其条目；朱棣「忽兰忽失温之战」的 enemyGeneralId 照旧解析到他本人。

    // 🔴 [2026-11-08 主人令] 原第三～六批知名战登记的 12 位战场人物（哈罗德二世、姆斯季斯拉夫、噶尔丹策零、
    //    萧挞凛、苻叡、阿鲁台、姚绍、陈敬瑄、陈睿宗、王琳、刘尚、少弐赖尚）已全部按标准升级为正式据点武将。

    // 🔴 [2026-10-25 经典战敌将复核 → 同日升级] 原本登记为战场人物的 58 位「该战真实对方指挥官」，
    //    已按主人令「新增武将要符合标准」升级为**正式据点武将**（进 FactionGenerals / profiles / GeneralEra / GeneralLifeYears / GeneralCenturies，
    //    配据点＋势力＋时代＋名将/普将＋精锐 T0–T4，立绘留空），本表不再保留他们的条目。
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
