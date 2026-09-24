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
    // ── 虎牢关战役（621）夏方主帅 ────────────────────────────────
    doujiande: {
        generalId: 'doujiande',
        generalName: '窦建德',
        factionId: 'xia',
        portrait: '',                       // 🔴 等主人放图；空 = 走池子回落
        portraitProposedPath: '/assets/CENTRAL/xia_doujiande.png',
        note: '夏王窦建德，河北义军之主；621年虎牢关战役率十万众西援洛阳王世充，兵败被擒。史料：《旧唐书·窦建德传》《资治通鉴·唐纪五》。',
    },
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
        note: '卢基乌斯·埃米利乌斯·保卢斯，前216年罗马执政官，坎尼战役中阵亡。史料：波利比乌斯《历史·第三卷》、李维《罗马史·第二十二卷》。',
    },
    waluo: {
        generalId: 'waluo',
        generalName: '瓦罗',
        factionId: 'luoma_diguo',
        portrait: '',
        portraitProposedPath: '/assets/LATIN/luoma_diguo_waluo.png',
        note: '盖乌斯·特伦提乌斯·瓦罗，前216年罗马执政官，坎尼战役当日执掌罗马军令，战败后逃回。史料：李维《罗马史·第二十二卷》。',
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
        note: '罗得岛的门农，波斯麾下希腊雇佣军名将。前334年米利都战后受任小亚细亚总指挥、统率波斯舰队，亲自布置哈利卡纳苏斯防御，携舰队泊于港内准备长期对抗；城破前夜与卡里亚总督欧戎托巴提斯一同弃城撤退，此后转攻爱琴海诸岛，前333年病死。史料：阿里安《亚历山大远征记》卷一、中文维基百科「哈利卡那索斯圍城戰」。',
    },
    aitiliusi: {
        generalId: 'aitiliusi',
        generalName: '埃提乌斯',
        factionId: 'luoma_diguo',
        portrait: '',
        portraitProposedPath: '/assets/LATIN/luoma_diguo_aitiliusi.png',
        note: '弗拉维乌斯·埃提乌斯，西罗马末代名将、「最后的罗马人」；451年沙隆战役统率罗马-西哥特联军击退阿提拉。史料：约达尼斯《哥特史》、普罗柯比《战史》。',
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
