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
    //   对应首战条目已去掉 `enemyGeneralId`，敌方主帅按引擎兜底显示为「{enemyFactionName}武将」。
    //   本表只登记**史有其人、有真名**的战场人物（例：下面这位曼努埃尔·皮雷斯）。
    bfe_portuguese_officer: { generalId: 'bfe_portuguese_officer', generalName: '曼努埃尔·皮雷斯', factionId: 'putaoya', portrait: '/assets/PORTUGUESE/bfe_portuguese_officer.png', note: '史有其人：1641 年姆博罗雷之战圣保罗 bandeira 主将 Manuel Pires（副将 Jerónimo Pedroso de Barros）；生卒无载，仅此战出场。' },

    // 🔴 [2026-10-25 首战敌将复核] 以下为「首战该战的真实对方指挥官」——库中原本没有，按主人 2026-09-19「缺少的人物，做成战场人物」登记；
    //    只在这一仗出场、不进城池掷将、立绘一律留空（走势力/文化池回落），逐条改自 GeneralFirstBattles 的 enemyGeneralId。
    bfe_rusa_i: { generalId: 'bfe_rusa_i', generalName: '鲁萨一世', factionId: 'wulaertu_guo', note: '史有其人：前714 乌拉尔图王（前735–714 在位），萨尔贡二世第八次远征的对手；原条目误填萨尔杜里一世。' },
    bfe_qijie: { generalId: 'bfe_qijie', generalName: '骑劫', factionId: 'yan', note: '史有其人：前279 即墨之战燕军主将，代乐毅；田单火牛阵所破（《史记·田单列传》）。' },
    bfe_chuzi: { generalId: 'bfe_chuzi', generalName: '触子', factionId: 'qi', note: '史有其人：前284 济西之战齐军主将（《战国策·齐策》），为乐毅所破。' },
    bfe_lifu: { generalId: 'bfe_lifu', generalName: '栗腹', factionId: 'yan', note: '史有其人：前251 鄗之战燕军主将，为廉颇所擒（《史记·燕召公世家》）。' },
    bfe_touman: { generalId: 'bfe_touman', generalName: '头曼', factionId: 'xiongnu', note: '史有其人：前215 蒙恬所逐匈奴单于（《史记·匈奴列传》）；冒顿前209 才杀父自立。' },
    bfe_xiangliang: { generalId: 'bfe_xiangliang', generalName: '项梁', factionId: 'chuguo', note: '史有其人：秦末楚军主帅，前208 定陶为章邯所袭杀（《史记·项羽本纪》）。' },
    bfe_crassus: { generalId: 'bfe_crassus', generalName: '克拉苏', factionId: 'luoma_diguo', note: '史有其人：罗马前三头之一，前53 卡莱之战统帅，兵败被杀（普鲁塔克《克拉苏传》）。' },
    bfe_zhanghe: { generalId: 'bfe_zhanghe', generalName: '张郃', factionId: 'wei', note: '史有其人：曹魏名将，215 巴西宕渠之战为张飞所破（《三国志·张郃传》）。' },
    bfe_andragoras: { generalId: 'bfe_andragoras', generalName: '安德拉戈拉斯', factionId: 'sailiugu', note: '史有其人：塞琉古所署帕提亚总督，前238 为阿尔沙克一世所败（尤斯提努斯 41.4）。' },
    bfe_mendenus: { generalId: 'bfe_mendenus', generalName: '门德努斯', factionId: 'maqidun', note: '史有其人：前329 波利提美图斯河之战马其顿偏师主将（阿里安 4.5）。' },
    bfe_erigius: { generalId: 'bfe_erigius', generalName: '埃里吉乌斯', factionId: 'maqidun', note: '史有其人：前330 讨萨提巴扎尼斯、阵前斩之的马其顿将领（阿里安 3.28）。' },
    bfe_shulezhong: { generalId: 'bfe_shulezhong', generalName: '疏勒王忠', factionId: 'shule', note: '史有其人：东汉疏勒叛王，为班超所平（《后汉书·班超传》）。' },
    bfe_zhangping: { generalId: 'bfe_zhangping', generalName: '章平', factionId: 'qin', note: '史有其人：雍王章邯之弟，前205 好畤、景陵为周勃曹参所破（《史记·绛侯周勃世家》）。' },
    bfe_wangjing: { generalId: 'bfe_wangjing', generalName: '王经', factionId: 'wei', note: '史有其人：曹魏雍州刺史，255 洮西为姜维所破（《三国志·姜维传》）。' },
    bfe_wangyan: { generalId: 'bfe_wangyan', generalName: '王衍', factionId: 'jin', note: '史有其人：西晋太尉，311 宁平城行台元帅，为石勒所执（《资治通鉴》卷八七）。' },
    bfe_zhanghedu: { generalId: 'bfe_zhanghedu', generalName: '张贺度', factionId: 'hou_zhao', note: '史有其人：后赵将领，350 苍亭之战为冉闵所破（《资治通鉴》卷九八）。' },
    bfe_murongbao: { generalId: 'bfe_murongbao', generalName: '慕容宝', factionId: 'da_yan', note: '史有其人：后燕太子，395 参合陂之战主帅，为拓跋珪所破（《资治通鉴》卷一〇八）。' },
    bfe_yangyu: { generalId: 'bfe_yangyu', generalName: '杨昱', factionId: 'tuoba', note: '史有其人：北魏东南道大都督，529 守荥阳，城破为陈庆之执获（《资治通鉴》梁中大通元年）。' },
    bfe_vahan: { generalId: 'bfe_vahan', generalName: '瓦汉', factionId: 'baizanting', note: '史有其人：拜占庭亚美尼亚籍统帅，636 雅穆克战役主帅（Battle of Yarmouk）。' },
    bfe_likaigu: { generalId: 'bfe_likaigu', generalName: '李楷固', factionId: 'wuzhou_d', note: '史有其人：武周玉钤卫大将军，698 天门岭追击大祚荣而大败（《新唐书·渤海传》）。' },
    bfe_abdullah_ali: { generalId: 'bfe_abdullah_ali', generalName: '阿卜杜拉·本·阿里', factionId: 'abasi', note: '史有其人：阿拔斯宗室，754 尼西比斯争位兵败被擒（712–764）。' },
    bfe_leo_phokas: { generalId: 'bfe_leo_phokas', generalName: '老利奥·福卡斯', factionId: 'baizanting', note: '史有其人：拜占庭野战军统帅，917 阿海洛斯之战败于西美昂（Battle of Achelous）。' },
    bfe_bulcsu: { generalId: 'bfe_bulcsu', generalName: '布尔丘', factionId: 'mazhaer', note: '史有其人：马扎尔 harka，955 莱希河之战马扎尔军主将，战败被处死（Battle of Lechfeld）。' },
    bfe_liurenshan: { generalId: 'bfe_liurenshan', generalName: '刘仁赡', factionId: 'nantang', note: '史有其人：南唐寿州守将，957 后周攻寿春，坚守不下（《资治通鉴》显德三至四年）。' },
    bfe_chengong: { generalId: 'bfe_chengong', generalName: '陈珙', factionId: 'song', note: '史有其人：北宋知邕州，1052 侬智高破邕州时被执（《宋史纪事本末·侬智高》）。' },
    bfe_muhammad_ghur: { generalId: 'bfe_muhammad_ghur', generalName: '穆罕默德·古尔', factionId: 'huluo', note: '史有其人：古尔苏丹，1191 第一次塔兰战役主帅（First Battle of Tarain）。' },
    bfe_youxian: { generalId: 'bfe_youxian', generalName: '游显', factionId: 'menggu_d', note: '史有其人：蒙古所署襄阳副达鲁花赤，1239 京襄之战为宋军所擒（《新元史·游显传》）。' },
    bfe_umar: { generalId: 'bfe_umar', generalName: '乌马儿', factionId: 'menggu_d', note: '史有其人：元朝水军统帅，1288 白藤江之战被俘（Battle of Bạch Đằng）。' },
    bfe_chagatai: { generalId: 'bfe_chagatai', generalName: '察合台', factionId: 'menggu_d', note: '史有其人：蒙古宗王，1221 与窝阔台共攻乌奇（志费尼《世界征服者史》）。' },
    bfe_kniprode: { generalId: 'bfe_kniprode', generalName: '克尼普罗德', factionId: 'tiaodun_qishi', note: '史有其人：条顿大团长（1352–1382 在任），1370 鲁道战役主帅（Battle of Rudau）。' },
    bfe_suleiman_pasha: { generalId: 'bfe_suleiman_pasha', generalName: '哈德姆·苏莱曼帕夏', factionId: 'osman', note: '史有其人：鲁米利亚贝伊莱尔贝伊，1475 瓦斯卢伊战役奥斯曼军统帅（Battle of Vaslui）。' },
    bfe_frederick_iii: { generalId: 'bfe_frederick_iii', generalName: '腓特烈三世', factionId: 'habusibao', note: '史有其人：神圣罗马皇帝（1452–1493 在位），1485 维也纳围城守方（Siege of Vienna 1485）。' },
    bfe_yibula: { generalId: 'bfe_yibula', generalName: '亦不剌', factionId: 'menggu_d', note: '史有其人：蒙古右翼太师，1510 达兰特哩衮之战为达延汗所败、逃青海（《蒙古源流》）。' },
    bfe_doria: { generalId: 'bfe_doria', generalName: '安德烈亚·多里亚', factionId: 'kelimiya', note: '史有其人：热那亚海军名将，1538 普雷韦扎海战神圣同盟舰队统帅（Battle of Preveza）。' },
    bfe_takayutpi: { generalId: 'bfe_takayutpi', generalName: '多迦逾毕', factionId: 'hantawadi', note: '史有其人：汉达瓦底（白古）末王，1538–39 东吁攻勃固时守方（Toungoo–Hanthawaddy War）。' },
    bfe_mingyiswa: { generalId: 'bfe_mingyiswa', generalName: '明耶苏瓦', factionId: 'dongxu', note: '史有其人：东吁王储（莽应里之子），1593 廊沙拉之战主帅，阵亡（Battle of Nong Sarai）。' },
    bfe_potocki: { generalId: 'bfe_potocki', generalName: '斯特凡·波托茨基', factionId: 'bolan', note: '史有其人：波兰盖特曼，1648 黄水战役波军统帅，兵败被俘（Battle of Zhovti Vody）。' },
    bfe_fuquan: { generalId: 'bfe_fuquan', generalName: '福全', factionId: 'manzhou_d', note: '史有其人：清抚远大将军（裕亲王），1690 乌兰布通之战清军主帅（Battle of Ulan Butung）。' },
    bfe_tsering_dondub: { generalId: 'bfe_tsering_dondub', generalName: '大策凌敦多布', factionId: 'dzungar', note: '史有其人：准噶尔名将，1720 清军入藏时准噶尔守军统帅（Chinese expedition to Tibet 1720）。' },
    bfe_zengguoquan: { generalId: 'bfe_zengguoquan', generalName: '曾国荃', factionId: 'manzhou_d', note: '史有其人：湘军统帅，1862 雨花台之战被李秀成围攻的守方主帅（太平天国史）。' },
    bfe_xiaoceling: { generalId: 'bfe_xiaoceling', generalName: '小策零敦多布', factionId: 'dzungar', note: '史有其人：准噶尔将领，1731 和通泊之战前线指挥（维基「和通泊之战」）。' },
    bfe_mahathammaracha: { generalId: 'bfe_mahathammaracha', generalName: '玛欣他拉提拉', factionId: 'siam', note: '史有其人：阿瑜陀耶王（1569 即位），1569 城破时守方（Burmese–Siamese War 1568–69）。' },
    bfe_quzhisheng: { generalId: 'bfe_quzhisheng', generalName: '麴智盛', factionId: 'gaochang', note: '史有其人：高昌末王，640 唐军围高昌城时守方（麴文泰已病死）（《旧唐书·高昌传》）。' },
    bfe_arslan_shah: { generalId: 'bfe_arslan_shah', generalName: '阿尔斯兰沙', factionId: 'jiazini', note: '史有其人：伽色尼苏丹（1116–1117 在位），1117 沙赫拉巴德之战败于桑贾尔。' },
    bfe_bogislaw_i: { generalId: 'bfe_bogislaw_i', generalName: '博吉斯拉夫一世', factionId: 'pomeilaniya', note: '史有其人：波美拉尼亚公爵（1156–1187 在位），1184 亚斯蒙德海战守方；库中 1454 那位是另一人。' },
    bfe_wanggeon: { generalId: 'bfe_wanggeon', generalName: '王建', factionId: 'goryeo', note: '史有其人：高丽太祖（877–943），927 公山/曹洞岘之战为甄萱所败；库中 zizhou_wangjian 是前蜀王建，同名不同人。' },
    bfe_oda_nobuhide: { generalId: 'bfe_oda_nobuhide', generalName: '织田信秀', factionId: 'oda', note: '史有其人：织田信长之父，1548 小豆坂之战织田方主将（信长时年 14）；《信长公记》。' },
    bfe_liuping: { generalId: 'bfe_liuping', generalName: '刘平', factionId: 'song', note: '史有其人：鄜延路副都部署，1040 三川口宋军主将（与石元孙、郭遵）；《续资治通鉴长编》康定元年。' },
    bfe_taobao: { generalId: 'bfe_taobao', generalName: '桃豹', factionId: 'hou_zhao', note: '史有其人：后赵将领，320 与祖逖争蓬陂坞（东西二台）；维基「祖逖」。' },
    bfe_ashina_duzhi: { generalId: 'bfe_ashina_duzhi', generalName: '阿史那都支', factionId: 'tujue', note: '史有其人：西突厥十姓可汗，679–680 裴行俭以计擒于碎叶；《资治通鉴》卷二〇二。' },
    bfe_achaemenes: { generalId: 'bfe_achaemenes', generalName: '阿凯门尼斯', factionId: 'aqimeinide', note: '史有其人：薛西斯之弟、波斯舰队统帅，前480 阿特米西乌姆（优卑亚）海战；希罗多德 7–8 卷。' },
    bfe_huyan_wang: { generalId: 'bfe_huyan_wang', generalName: '呼衍王', factionId: 'huyan', note: '史有其人：东汉北匈奴呼衍王，73 年窦固破之于蒲类海（《后汉书·窦固传》）；库中「呼衍蒲奴」为混拼。' },
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
