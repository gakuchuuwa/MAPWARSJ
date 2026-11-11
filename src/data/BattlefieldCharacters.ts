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
    bfe_cb_boootiya_1: { generalId: 'bfe_cb_boootiya_1', generalName: '伊斯梅尼亚斯', factionId: 'boootiya', note: '🔴 [经典战导入] 哈利亚托斯之战敌方主将' },
    bfe_cb_yan_1: { generalId: 'bfe_cb_yan_1', generalName: '太子丹', factionId: 'yan', note: '🔴 [经典战导入] 衍水之战敌方主将' },
    bfe_cb_zhao_1: { generalId: 'bfe_cb_zhao_1', generalName: '扈辄', factionId: 'zhao', note: '🔴 [经典战导入] 平阳之战敌方主将' },
    bfe_cb_qin_2: { generalId: 'bfe_cb_qin_2', generalName: '蒙骜', factionId: 'qin', note: '🔴 [经典战导入] 河外之战敌方主将' },
    bfe_cb_wei_1: { generalId: 'bfe_cb_wei_1', generalName: '公孙喜', factionId: 'wei', note: '🔴 [经典战导入] 伊阙之战敌方主将' },
    bfe_cb_luoma_diguo_2: { generalId: 'bfe_cb_luoma_diguo_2', generalName: '登塔图斯', factionId: 'luoma_diguo', note: '🔴 [经典战导入] 贝内文图姆之战敌方主将' },
    bfe_cb_luoma_diguo_1: { generalId: 'bfe_cb_luoma_diguo_1', generalName: '德西乌斯', factionId: 'luoma_diguo', note: '🔴 [经典战导入] 阿斯库路姆之战敌方主将' },
    bfe_cb_seleisi_1: { generalId: 'bfe_cb_seleisi_1', generalName: '利西马科斯', factionId: 'seleisi', note: '🔴 [经典战导入] 库鲁佩迪安之战敌方主将' },
    bfe_cb_maqidun_1: { generalId: 'bfe_cb_maqidun_1', generalName: '欧墨涅斯', factionId: 'maqidun', note: '🔴 [经典战导入] 帕莱塔西奈之战敌方主将' },
    bfe_cb_chuguo_1: { generalId: 'bfe_cb_chuguo_1', generalName: '楚顷襄王', factionId: 'chuguo', note: '🔴 [经典战导入] 黔中之战敌方主将' },
    bfe_cb_antigonid_1: { generalId: 'bfe_cb_antigonid_1', generalName: '德米特里一世', factionId: 'antigonid', note: '🔴 [经典战导入] 加沙之战敌方主将' },
    bfe_cb_lagoniya_1: { generalId: 'bfe_cb_lagoniya_1', generalName: '阿格西劳斯二世', factionId: 'lagoniya', note: '🔴 [经典战导入] 曼丁尼亚之战敌方主将' },
    bfe_cb_kaliya_1: { generalId: 'bfe_cb_kaliya_1', generalName: '摩索拉斯', factionId: 'kaliya', note: '🔴 [经典战导入] 基奥斯之战敌方主将' },
    bfe_cb_xila_1: { generalId: 'bfe_cb_xila_1', generalName: '安提奥库斯', factionId: 'xila', note: '🔴 [经典战导入] 诺提姆之战敌方主将' },
    bfe_cb_wu_1: { generalId: 'bfe_cb_wu_1', generalName: '阖闾', factionId: 'wu', note: '🔴 [经典战导入] 槜李之战敌方主将' },
    bfe_cb_qi_1: { generalId: 'bfe_cb_qi_1', generalName: '国书', factionId: 'qi', note: '🔴 [经典战导入] 艾陵之战敌方主将' },
    bfe_cb_ldiya_1: { generalId: 'bfe_cb_ldiya_1', generalName: '克罗伊索斯', factionId: 'ldiya', note: '🔴 [经典战导入] 提姆布拉之战敌方主将' },
    bfe_cb_midi_1: { generalId: 'bfe_cb_midi_1', generalName: '阿斯提阿格斯', factionId: 'midi', note: '🔴 [经典战导入] 帕萨尔加德之战敌方主将' },
    bfe_cb_aiji_1: { generalId: 'bfe_cb_aiji_1', generalName: '尼科二世', factionId: 'aiji', note: '🔴 [经典战导入] 卡基米什之战敌方主将' },
    bfe_cb_qin_1: { generalId: 'bfe_cb_qin_1', generalName: '孟明视', factionId: 'qin', note: '🔴 [经典战导入] 殽之战敌方主将' },
    bfe_cb_jialedi_1: { generalId: 'bfe_cb_jialedi_1', generalName: '米罗达巴拉旦', factionId: 'jialedi', note: '🔴 [经典战导入] 巴比伦之战敌方主将' },
    bfe_cb_yalan_1: { generalId: 'bfe_cb_yalan_1', generalName: '伊卢比迪', factionId: 'yalan', note: '🔴 [经典战导入] 卡尔卡尔之战敌方主将' },
    bfe_cb_libiya_1: { generalId: 'bfe_cb_libiya_1', generalName: '斯彭迪乌斯', factionId: 'libiya', note: '🔴 [经典战导入] 利比亚名将：第一次布匿战争后北非利比亚诸城与雇佣兵反迦太基联军统帅' },
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
