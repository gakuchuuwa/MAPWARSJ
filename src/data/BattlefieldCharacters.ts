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
    // 🔴 [2026-10-24 主人令「把武将中，没有名字的武将删除」]
    //   本表原登记的一批「史无载、按军职／民族拟名」的战场人物
    //   （帕维亚东罗马守将、匈奴左贤王、卡迭石王 苏穆阿达德 等共 85 位）已按令全部删除；
    //   对应经典战条目已去掉 `enemyGeneralId`，敌方主帅按引擎兜底显示为「{enemyFactionName}武将」。
    //   本表只登记**史有其人、有真名**的战场人物（例：下面这位曼努埃尔·皮雷斯）。
    bfe_portuguese_officer: { generalId: 'bfe_portuguese_officer', generalName: '皮雷斯', factionId: 'putaoya', portrait: '/assets/PORTUGUESE/bfe_portuguese_officer.png', note: '史有其人：1641 年姆博罗雷之战圣保罗 bandeira 主将 Manuel Pires（副将 Jerónimo Pedroso de Barros）；生卒无载，仅此战出场。' },

    // 🔴 [2026-11-08] 马哈木（瓦剌，顺宁王）已升级为正式据点武将（FactionGenerals 瓦剌块／科布多／瓦剌骑兵 T1），
    //    按 2026-10-25 口径本表不再保留其条目；朱棣「忽兰忽失温之战」的 enemyGeneralId 照旧解析到他本人。

    // 🔴 [2026-11-08 补知名战·第三批] 只在这一战出场的实名敌帅
    bfe_harold_godwinson: {
        generalId: 'bfe_harold_godwinson',
        generalName: '哈罗德二世',
        factionId: 'yinggelan',
        portraitProposedPath: '/assets/BRITONS/bfe_harold_godwinson.png',
        note: '史有其人：英格兰末代盎格鲁-撒克逊国王哈罗德·戈德温森（1066 年 1 月即位）；同年 9 月破挪威军于斯坦福桥，10 月 14 日于黑斯廷斯为诺曼底公爵威廉所败、战死（《盎格鲁-撒克逊编年史》1066 年条）。立绘留空。',
    },
    bfe_mstislav_kiev: {
        generalId: 'bfe_mstislav_kiev',
        generalName: '姆斯季斯拉夫',
        factionId: 'luosi',
        portraitProposedPath: '/assets/SLAVIC/bfe_mstislav_kiev.png',
        note: '史有其人：基辅大公姆斯季斯拉夫·罗曼诺维奇，1223 年迦勒迦河之战为罗斯-钦察联军三主帅之一（另两位为加利奇的姆斯季斯拉夫、切尔尼戈夫的姆斯季斯拉夫），联军大败，他被蒙古军俘杀。立绘留空。',
    },
    bfe_galdan_tseren: {
        generalId: 'bfe_galdan_tseren',
        generalName: '噶尔丹策零',
        factionId: 'oirat_ming',
        portraitProposedPath: '/assets/MONGOL/bfe_galdan_tseren.png',
        note: '史有其人：准噶尔浑台吉噶尔丹策零（1727–1745 在位），雍正九年（1731）和通泊大破清军，同年于光显寺（额尔德尼召）为喀尔喀亲王策棱所败（《清史稿·策棱传》）。立绘留空。',
    },

    // 🔴 [2026-11-08 补知名战·第四批]
    bfe_xiaotalin: {
        generalId: 'bfe_xiaotalin',
        generalName: '萧挞凛',
        factionId: 'liao_d',
        portraitProposedPath: '/assets/HEXI/bfe_xiaotalin.png',
        note: '史有其人：辽统军使萧挞凛（萧挞览），辽圣宗与承天太后南征的前线统军；统和十七年（999）率军攻宋遂城，二十二年（1004）澶州城下被宋军床子弩射死（《辽史·萧挞凛传》《宋史·真宗纪》）。立绘留空。',
    },
    bfe_fu_rui: {
        generalId: 'bfe_fu_rui',
        generalName: '苻叡',
        factionId: 'fushi',
        portraitProposedPath: '/assets/CENTRAL/bfe_fu_rui.png',
        note: '史有其人：前秦苻坚之子、巨鹿公苻叡，前秦建元二十年（384）与姚苌战于北地，兵败被杀（《晋书·苻坚载记》《晋书·姚苌载记》）。立绘留空。',
    },
    bfe_alutai: {
        generalId: 'bfe_alutai',
        generalName: '阿鲁台',
        factionId: 'dada_ming',
        portraitProposedPath: '/assets/MONGOL/bfe_alutai.png',
        note: '史有其人：鞑靼（东蒙古）太师阿鲁台，永乐间屡与瓦剌争雄，宣德九年（1434）为瓦剌脱欢所袭杀（《明史·鞑靼传》）。立绘留空。',
    },
    bfe_yao_shao: {
        generalId: 'bfe_yao_shao',
        generalName: '姚绍',
        factionId: 'hou_qin',
        portraitProposedPath: '/assets/CENTRAL/bfe_yao_shao.png',
        note: '史有其人：后秦东平公姚绍，义熙十二年（416）晋军北伐，他与姚洸等守洛阳、潼关拒之，兵败（《晋书·姚泓载记》《宋书·檀道济传》）。立绘留空。',
    },

    // 🔴 [2026-11-08 补知名战·第五批]
    bfe_chen_jingxuan: {
        generalId: 'bfe_chen_jingxuan',
        generalName: '陈敬瑄',
        factionId: 'tang',
        portraitProposedPath: '/assets/CENTRAL/bfe_chen_jingxuan.png',
        note: '史有其人：唐西川节度使陈敬瑄（田令孜之兄），据成都；大顺二年（891）为王建围困，粮尽出降（《旧唐书·陈敬瑄传》《资治通鉴》卷二五八）。立绘留空。',
    },
    bfe_tran_duc_tong: {
        generalId: 'bfe_tran_duc_tong',
        generalName: '陈睿宗',
        factionId: 'dayue',
        portraitProposedPath: '/assets/VIETNAMESE/bfe_tran_duc_tong.png',
        note: '史有其人：大越陈朝皇帝陈睿宗（陈曔，1372–1377 在位），1377 年亲征占城，于尸耐（Thị Nại）中伏兵败、战死阵中（《大越史记全书·陈纪》）。立绘留空。',
    },
    bfe_wang_lin: {
        generalId: 'bfe_wang_lin',
        generalName: '王琳',
        factionId: 'nan_liang',
        portraitProposedPath: '/assets/JIANGNAN/bfe_wang_lin.png',
        note: '史有其人：梁将王琳，陈霸先代梁后据湘州举兵；天嘉元年（560）为陈将侯安都等所破，走投北齐（《陈书·侯安都传》《资治通鉴》卷一六七）。立绘留空。',
    },

    // 🔴 [2026-11-08 补知名战·第六批]
    bfe_liu_shang: {
        generalId: 'bfe_liu_shang',
        generalName: '刘尚',
        factionId: 'han_d',
        portraitProposedPath: '/assets/CENTRAL/bfe_liu_shang.png',
        note: '史有其人：东汉武威将军刘尚，建武二十三年（47）率南郡、长沙、武陵兵万余人溯沅水击武陵蛮，轻敌入险，全军覆没（《后汉书·南蛮西南夷列传》「尚军大败，悉没」）。立绘留空。',
    },
    bfe_shoni_yorihisa: {
        generalId: 'bfe_shoni_yorihisa',
        generalName: '少弐赖尚',
        factionId: 'shoni',
        portraitProposedPath: '/assets/JAPAN/bfe_shoni_yorihisa.png',
        note: '史有其人：北朝方九州探题少弐赖尚，正平十四年（1359）率足利幕府军在筑后川与南朝菊池武光决战，大败（《太平记》卷三十三；《大日本史料》同年条）。立绘留空。',
    },

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
