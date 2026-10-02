/**
 * HistoricalEventScript.ts — 历史脚本 · 逐年事件链（**战斗定义**）
 *
 * 字段口径 = `src/types/core.ts` 的 `HistoricalEvent` / `FieldBattleData`（**现役**类型）。
 * 故本文件受 `tsc` 校验：字段名或取值写错直接编译不过，不会像裸 JSON 那样静默失效。
 *
 * 🔴 驱动方式（主人 2026-09-11 定）：**复活历史事件系统**，剧本独立于玩家发生——
 *    无论玩家去不去找亚历山大、接不接任务，事件都按年照跑。
 *    （现成的 `GeneralFirstExpeditionTargets` 走不通：那张表头定死了「仅跟拍军团会远征，
 *      AI 军团永不远征」，前提正是"玩家跟着他"，与本要求相冲。）
 *
 * 📖 全部需求、行军路线、定案与实施记录见主人那份文档：
 *    `docs/02-design/systems/历史进程框架.md` §十五（2026-09-11 追加）。
 *
 * 🔴🔴 **要再加一场野战？照数组里第一条（-334 格拉尼库斯河）抄。**
 *    它是主人 2026-09-12 指定的**野战样本**（「把格拉尼库斯河战役的脚本作为野战的样本。以后再次添加野战可以照着做」）。
 *    逐字段说明 + 必填清单（13 条）+ 验收命令 + 照抄时的坑，全在
 *    `docs/02-design/systems/历史进程框架.md` **§15.10 野战样本**。
 *    同时别忘在 `src/data/Battlefields.ts` 加一条**同坐标**的战场
 *    （参考 `bf_gelanikusihe`）：🔴 **战场不是据点**（主人 2026-09-12：「把战场独立出来，不做为据点，
 *    就叫战场。一个地名而已。类似奇观」），所以**不进 `cities_v2`**，也不带势力/兵力，
 *    由 `src/map/BattlefieldLayer.ts` 独立图层渲染；武将可选、**纯剧情、永不出征**。
 *
 * ⚠️ 为什么放 `src/data/` 而不是 JSON：
 *    项目里 `src/public/scripts/demo_battle.json` 是**孤立残留**——Vite 静态目录是根 `public/`
 *    （`vite.config.ts` 未设 `publicDir`，用默认值），`src/public/` 不被任何代码引用、
 *    也不对外可访问。数据放 `src/data/` 是本项目惯例，且能被 import + 类型校验。
 *
 * 命名口径：`attackerLegionName` / `defenderLegionName` **只许填剧本军团**（第四层 `src/data/scriptLegions.ts`，2026-09-23 起）。
 *    军团名有唯一真源（`FactionCompositions.legionName`，马其顿 =「古典时代马其顿军团」；
 *    未配置的势力走 `getCultureLegionName(region)`），此处再写一份就是第二处真源，
 *    且极易把**精锐番号**（伙伴骑兵/希腊雇佣兵）误当**军团名**——那是命名铁律明令禁止的。
 *    精锐无需在此指定：由势力自动解析（maqidun→伙伴骑兵 T0 / xiaofulijiya→希腊雇佣兵 T2）。
 */
import type { HistoricalEvent } from '../types/core';
import {
    BATTLEFIELDS,
    BATTLEFIELD_MATCH_DEG,
    battlefieldLocationOf,
    findBattlefieldOfGeneralEvent,
    siegeSiteId,
} from './Battlefields';

export const HISTORICAL_EVENT_SCRIPT: HistoricalEvent[] = [
    // ═══ 🔴 [2026-09-25 主人「甲，批准」一次做完] 巴尔干战役（前335）三场：海姆斯山 → 佩利昂 → 底比斯 ═══
    //    英文维基「亚历山大战役」总表 Balkans 一栏的三场，亚历山大均亲统；开局年份随之由 -334 提前到 -335（GameConfig.TIME）。
    {
        year: -335,
        season: 0,                                   // 春：英文维基 Balkan campaign「in the spring of 335 BC, he advanced into Thrace」
        generalId: 'gen_alexander_great',
        type: 'field_battle',
        title: '公元前335年 海姆斯山战役',
        battleBriefing: '色雷斯人自山脊推下沉重木车呼啸砸向山道。马其顿方阵迅速开列通道，避无可避者俯卧紧扣重盾任巨车碾过。轻步兵与弓手顶着矢石向山顶密集攒射，亚历山大亲率近卫、持盾卫队与阿格里安人自左路仰攻，双方在车垒前展开肉搏厮杀！',
        description: '马其顿军团获胜：自治的色雷斯人据海姆斯山脊、以大车连成营垒，欲推车冲散登山的马其顿军团；亚历山大令步兵遇车则散开让路、来不及散开就伏地举盾，弓手射乱色雷斯人的阵，方阵登顶击溃守敌，北上之路就此打通。本场为野战，不涉据点易主。',
        dialogue: '希腊已在我脚下俯首，大军开拔在即，我要的是能踏碎亚洲的锋刃与铁蹄。既然来投我麾下，便握紧你的兵刃，跟上我的骑兵。能随我战至大地尽头的，帝国与荣耀任你分取；跟不上的，尸骨便留在荒原。',
        fieldBattleData: {
            title: '海姆斯山战役',
            battleBriefing: '色雷斯人自山脊推下沉重木车呼啸砸向山道。马其顿方阵迅速开列通道，避无可避者俯卧紧扣重盾任巨车碾过。轻步兵与弓手顶着矢石向山顶密集攒射，亚历山大亲率近卫、持盾卫队与阿格里安人自左路仰攻，双方在车垒前展开肉搏厮杀！',
            description: '公元前335年春，马其顿军团北上平定色雷斯，到了海姆斯山下，自治的色雷斯人据守山脊、以大车为垒，要把车推下来冲散队伍；亚历山大令步兵遇车散开或伏地以盾覆身，弓手射乱色雷斯人的阵，方阵一路登顶，色雷斯人溃散。',
            // 战场坐标：维基未指明山口，取希普卡山口（英文维基 Shipka Pass 42.767,25.317），与 Battlefields.bf_haimusishan 一字不差
            location: { lat: 42.767, lng: 25.317 },
            // 路标：自佩拉东行至安菲波利斯，北上经菲利波波利斯（普罗夫迪夫，前342 年腓力二世所建）到海姆斯山下
            marchWaypoints: ['city_anfeibolisi', 'city_plovdiv'],
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 23000,
            attackerSourceCityId: 'city_salonica',      // 第一场：自马其顿本土（佩拉）起兵
            attackerLegionName: '马其顿军团',
            defenderFactionId: 'seleisi',
            defenderGeneralId: 'gen_seuthes_iii',
            defenderTroops: 8000,
            defenderLegionName: '色雷斯军团',
            result: 'attacker_win',
            autoEnterRTS: true,
        },
        commanderUnit: 'hero_mounted_alexander',
        // 对手主将队：塞乌特斯三世——骑马的色雷斯酋长（素材样貌：头盔、金胸甲、披风的色雷斯骑将）
        foeCommanderUnit: 'hero_thracian_chieftain',
        sources: {
            battle: { level: 'fact', text: '英文维基百科 Balkan campaign of Alexander the Great（Battle of Mount Haemus 重定向至此）：马其顿军团北上平定色雷斯，在海姆斯山与据守山脊的色雷斯人交战，野战。' },
            time: { level: 'fact', text: '英文维基百科 Balkan campaign of Alexander the Great：「in the spring of 335 BC, he advanced into Thrace」，季节取春。' },
            place: { level: 'inferred', text: '英文维基百科 Balkan campaign 只记「Mount Haemus」（巴尔干山脉），未指明哪一处山口；Triballi 条目亦只记「crossed the Haemus ranges」。取今人最常引的希普卡山口，坐标用英文维基 Shipka Pass 信息框 42.767,25.317 —— 合理推定。' },
            attacker: { level: 'fact', text: '英文维基百科 Balkan campaign of Alexander the Great：马其顿，亚历山大亲统；阿格里安人首领朗加罗斯率部沿途来会。' },
            attackerTroops: { level: 'fact', text: '英文维基百科 Balkan campaign of Alexander the Great 信息框 strength：重步兵一万二千、轻步兵八千、骑兵三千，合二万三千。' },
            attackerLegion: { level: 'fact', text: '同东征诸役：马其顿军团，前伙伴骑兵、中方阵步兵、后远程，鱼鳞阵 3-4-2；同一支军队整场战争不换。' },
            defender: { level: 'fact', text: '英文维基百科 Balkan campaign of Alexander the Great：守山的是「Thracian garrison」（阿里安称自治的色雷斯人），首领未留名 → 按主人批准称「色雷斯首领」；势力取现有「色雷斯」。' },
            defenderTroops: { level: 'inferred', text: '维基无守方兵数。同一战役中格泰人一万四千、特里巴利人一役阵亡三千，据山扼守、以大车为垒的自治色雷斯人当以数千计，取 8000（不超过攻方二倍）—— 合理推定。' },
            defenderLegion: { level: 'popular', text: '色雷斯人以标枪手（佩尔塔斯特）散兵先战、长刃步兵随后，山地骑兵最少 → 剧本军团「色雷斯军团」雁行 4-3-2（见 scriptLegions.ts 出处）。' },
            route: { level: 'fact', text: '阿里安《远征记》I.1 与英文维基 Balkan campaign：自佩拉经安菲波利斯，绕潘盖翁山北麓走廊至菲利比；渡内斯托斯河，将奥尔贝鲁斯山置于左侧，穿罗多彼山隘口经帕扎尔吉克入上色雷斯平原，抵菲利波波利斯（普罗夫迪夫）；在卡赞勒克谷地集结，进抵海姆斯山（希普卡山口）。佩拉至海姆斯山全程四段全线矢量道路贯通，实测 578 km。🔴 [2026-10-03 注] 阿里安 I.1 原文记「第十日抵海姆斯山」（arrived at mount Haemus on the tenth day）；按主人 2026-09-25 令「兵力、人数、日程、里程、件数、次数一律不落数字」，文案写「连日疾行」，精确日程只留本依据栏。' },
            result: { level: 'fact', text: '英文维基百科 Balkan campaign of Alexander the Great：方阵登顶，击溃色雷斯人；本场为野战，不涉据点易主。' },
            briefing: { level: 'fact', text: '英文维基百科 Balkan campaign of Alexander the Great：腓力二世在女儿婚宴上遇刺、亚历山大被拥立；绕奥萨山迫色萨利人归附、在科林斯受推为统帅；公元前335年春北上色雷斯、阿格里安人朗加罗斯来会；色雷斯人以大车为垒守山脊。文案不写兵力确数。' },
        },
    },
    {
        year: -335,
        season: 0,                                   // 春：阿里安 I.3「海姆斯山之役后第三天」追特里巴利人至多瑙河，夜渡击吉特人
        generalId: 'gen_alexander_great',
        type: 'field_battle',
        title: '公元前335年 多瑙河渡河战役',
        battleBriefing: '深夜的多瑙河水流湍急，亚历山大集结皮帐填充干草制成浮囊，配合征集来的独木舟，率领骑兵与步兵在夜色掩护下强渡天险。清晨薄雾散去，数千马其顿方阵步兵与伙伴骑兵已在北岸的麦田间列阵完毕。随着号角吹响，伙伴骑兵踏过高耸的麦浪发起集群冲锋，正面长矛方阵如林推进，吉特人的轻骑兵与步兵仓皇拉开弓弦，却连马其顿骑兵的第一波冲锋都没能顶住，纷纷逃回多瑙河边的城里。',
        description: '马其顿军团大胜：海姆斯山役后亚历山大追特里巴利人至多瑙河，见北岸吉特人列阵相阻，搜罗独木舟、以皮囊填草充作浮具，连夜强渡天险；吉特人未及骑兵交火即溃散，亚历山大占领并平毁吉特人的城、祭神后当天撤回南岸。本场为野战，不涉据点易主。',
        fieldBattleData: {
            title: '多瑙河渡河战役',
            battleBriefing: '深夜的多瑙河水流湍急，亚历山大集结皮帐填充干草制成浮囊，配合征集来的独木舟，率领骑兵与步兵在夜色掩护下强渡天险。清晨薄雾散去，数千马其顿方阵步兵与伙伴骑兵已在北岸的麦田间列阵完毕。随着号角吹响，伙伴骑兵踏过高耸的麦浪发起集群冲锋，正面长矛方阵如林推进，吉特人的轻骑兵与步兵仓皇拉开弓弦，却连马其顿骑兵的第一波冲锋都没能顶住，纷纷逃回多瑙河边的城里。',
            description: '公元前335年春，多瑙河北岸。海姆斯山一役色雷斯人溃散，亚历山大挥师北上追特里巴利人，兵锋直抵多瑙河。特里巴利残部与色雷斯人退入河心岛，北岸吉特人列阵相阻。亚历山大搜罗沿岸独木舟、以皮囊填草充作浮具，趁夜色强渡欧陆第一大河；吉特人被这神速渡河震慑，未及骑兵初次交火即溃散，先逃入城、再弃城逃入荒野。亚历山大占领并平毁盖塔人的城，祭宙斯、赫拉克勒斯与河神，当天撤回南岸。',
            // 战场坐标：阿里安 I.4 记吉特人的城「离多瑙河约 1 帕拉桑（≈5.5 公里）」——德鲁斯塔尔渡口（44.12,27.26）北边，合理推定
            location: { lat: 44.19, lng: 27.26 },
            // 路标：自上一场落点海姆斯山战场北上，经德鲁斯塔尔（多瑙河南岸渡口）渡河至北岸吉特人的城（阿里安 I.3-4）
            marchWaypoints: ['city_delusitaer'],
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 23000,
            attackerSourceCityId: 'city_plovdiv',      // 出兵据点＝军团此刻在哪：上一场海姆斯山战场，取那年离战场最近且已存在的据点（普罗夫迪夫）
            attackerLegionName: '马其顿军团',
            defenderFactionId: 'seleisi',
            defenderGeneralId: 'jite_shouling',
            defenderTroops: 14000,
            defenderLegionName: '色雷斯军团',
            result: 'attacker_win',
            autoEnterRTS: true,
        },
        commanderUnit: 'hero_mounted_alexander',
        // 对手主将队：吉特人君主科托罗（色雷斯北支）——骑马的色雷斯酋长（同海姆斯山那场，素材样貌：头盔、金胸甲、披风的色雷斯骑将）
        foeCommanderUnit: 'hero_thracian_chieftain',
        sources: {
            battle: { level: 'fact', text: '阿里安《远征记》I.3-4：海姆斯山役后亚历山大追特里巴利人至多瑙河，以皮囊填草、独木舟连夜强渡，在北岸击吉特人；英文维基百科 Alexander\'s Balkan campaign 记此役为强渡多瑙河击吉特人，野战。' },
            time: { level: 'fact', text: '阿里安《远征记》I.3：「On the third day after the battle（海姆斯山之役后第三天）Alexander reached the river Ister」，季节取春。' },
            place: { level: 'inferred', text: '阿里安《远征记》I.4 记吉特人的城「distant about a parasang from the Ister」（离多瑙河约 1 帕拉桑 ≈ 5.5 公里）。取多瑙河下游锡利斯特拉（德鲁斯塔尔）渡口北岸一带 44.19,27.26 —— 合理推定。' },
            attacker: { level: 'fact', text: '阿里安《远征记》I.3-4：马其顿，亚历山大亲统；命尼卡诺尔领方阵，自率骑兵居右翼。' },
            attackerTroops: { level: 'fact', text: '阿里安《远征记》I.3 原文：渡河者「1,500 cavalry and 4,000 infantry」；本场攻方填巴尔干远征全军 23000（同海姆斯山一役，英文维基 Balkan campaign 信息框），渡河部队 5500 记于史料。' },
            attackerLegion: { level: 'fact', text: '同东征诸役：马其顿军团，前伙伴骑兵、中方阵步兵、后远程，鱼鳞阵 3-4-2；同一支军队整场战争不换。' },
            defender: { level: 'fact', text: '阿里安《远征记》I.3：吉特人（Getae）为多瑙河北岸「信永生」的色雷斯北支部族，守将取吉特人君主科托罗（Cothelas）；势力套用「色雷斯」。' },
            defenderTroops: { level: 'fact', text: '阿里安《远征记》I.3 原文：吉特人「about 4,000 cavalry and more than 10,000 infantry」，取 14000。' },
            defenderLegion: { level: 'popular', text: '套用剧本军团「色雷斯军团」（吉特为色雷斯北支，同一打法）：前色雷斯标枪手 4、中长刃斩手 3、后轻骑兵 2，雁行 4-3-2（见 scriptLegions.ts 出处）。' },
            route: { level: 'fact', text: '阿里安《远征记》I.2-4：海姆斯山役后追特里巴利人北上，至多瑙河（伊斯特河）；特里巴利人与色雷斯人退入河心岛，亚历山大决定渡河击北岸吉特人。自海姆斯山战场经德鲁斯塔尔（多瑙河南岸渡口）渡河至北岸。' },
            result: { level: 'fact', text: '阿里安《远征记》I.4：吉特人未及骑兵初次交火即溃散，弃城逃入荒野；亚历山大占领平毁其城、祭神后当天撤回南岸。本场为野战，不涉据点易主。' },
            briefing: { level: 'fact', text: '阿里安《远征记》I.3-4：多瑙河为欧陆第一大河；亚历山大以皮囊填草充浮具、搜罗独木舟夜渡；吉特人列阵北岸相阻。文案不写兵力确数。' },
        },
    },
    {
        year: -335,
        season: 1,                                   // 夏：多瑙河之役后闻伊利里亚人叛，西进佩利昂（英文维基 Siege of Pelium）
        generalId: 'gen_alexander_great',
        type: 'siege',
        title: '公元前335年 佩利昂战役',
        battleBriefing: '然而陶兰提援军接踵而至，伊利里亚联军抢占四周制高点，将扎营狭谷的马其顿军团重重围困。亚历山大在谷底平地列阵操演，长矛方阵在鸦雀无声中变换队列、长矛齐刷刷转向，山头观望的敌军看得目瞪口呆。趁敌军阵脚松动，亚历山大果断指挥部队迅速占领渡口高地，并于深夜亲率轻步兵与弓箭手对守备松懈的敌军营地发动突袭，马其顿精锐冲入敌营，喊杀声响彻夜空。',
        description: '马其顿军团取佩利昂：伊利里亚王克莱图斯据佩利昂要塞，陶兰提王格劳基亚斯引兵来援、占据四周高地，一度把马其顿军团逼退到河对岸；几天后亚历山大趁夜突袭，伊利里亚人猝不及防大败，克莱图斯焚城逃往格劳基亚斯境内，伊利里亚与马其顿之间的山口从此握在马其顿手中。',
        siegeData: {
            title: '佩利昂战役',
            battleBriefing: '然而陶兰提援军接踵而至，伊利里亚联军抢占四周制高点，将扎营狭谷的马其顿军团重重围困。亚历山大在谷底平地列阵操演，长矛方阵在鸦雀无声中变换队列、长矛齐刷刷转向，山头观望的敌军看得目瞪口呆。趁敌军阵脚松动，亚历山大果断指挥部队迅速占领渡口高地，并于深夜亲率轻步兵与弓箭手对守备松懈的敌军营地发动突袭，马其顿精锐冲入敌营，喊杀声响彻夜空。',
            description: '克莱图斯据佩利昂要塞死守，格劳基亚斯的援军占据周围高地；亚历山大初攻不下、被迫退到河对岸，几天后乘夜突袭，击溃伊利里亚人，克莱图斯焚城而逃。',
            // 路标：史载自多瑙河经阿格里安人之地与派奥尼亚南下至佩利昂（阿里安 I.5）。沿线重要的已有据点是**索非亚（塞尔迪卡）**——
            // 🔴 [2026-09-25 主人定「线都是连接据点的，不能横跨，必须经过重要的据点」] 故本场路标写索非亚：
            //    军团走 上一场落点（德鲁斯塔尔，多瑙河渡河战役打完撤回的南岸渡口）→ 索非亚 → 佩利昂，即经阿格里安人之地—派奥尼亚—林基斯蒂斯那条史料道。
            //    索非亚在前335 按「据点名首次出现」口径不上图，但**不显示≠不存在**，当路标合规。
            // 🔴 [2026-09-30 加多瑙河渡河战役] 德鲁斯塔尔已是上一场（多瑙河渡河）的落点，本场从德鲁斯塔尔出发，路标只写索非亚
            marchWaypoints: ['city_sofia'],
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 23000,
            attackerSourceCityId: 'city_delusitaer',   // 出兵据点＝军团此刻在哪：上一场多瑙河渡河战场（打完撤回南岸德鲁斯塔尔渡口）
            attackerLegionName: '马其顿军团',
            defenderFactionId: 'dasaleiti',
            defenderGeneralId: 'dasaleiti_kleitos',
            defenderTroops: 7000,
            defenderCityId: 'city_peiliang',
            defenderLegionName: '伊利里亚军团',
            result: 'attacker_win',
            autoEnterRTS: true,
        },
        cityUpdates: [{ cityId: 'city_peiliang', factionId: 'maqidun' }],
        commanderUnit: 'hero_mounted_alexander',
        // 对手主将队：素材样貌为骑马、披斗篷的巴尔干贵族骑将（按样貌选，与名字同为「克雷图斯」纯属巧合）
        // 🔴 [2026-10-02 修] 这一行原来**只有注释、没有字段**（`foeCommanderUnit` 缺失）——
        //    第 10 队会没有英雄兵模，编辑器（「对手主将队兵种必须选」）本来就不许存盘。
        //    按 §二.5「先保年代，再尽样子」取同代骑马蛮族首领 hero_thracian_chieftain
        //    （塞乌特斯三世，前331–300 在位，与亚历山大同代；色雷斯紧挨伊利里亚）。
        //    ⚠️ 特意**不**用名字撞车的 `hero_cleitus`（英雄·克雷图斯）：那是马其顿的「黑」克雷图斯，
        //    与佩利昂守将克莱图斯（巴尔迪利斯之子）不是同一个人；且规则是**只看样式**，
        //    马其顿甲士在样式次序里低于骑马蛮族首领。
        foeCommanderUnit: 'hero_thracian_chieftain',
        briefing: '北疆事了，大军掉头南返，沿伊斯克尔峡谷穿行巴尔干群山，昼夜兼程赶往塞尔迪卡。西北的伊利里亚人趁大军北征起兵，克莱图斯与陶兰提王格劳基亚斯连兵起事——这一趟回师，正是要赶在两部合兵之前先定西境。\n\n【索非亚】大军自塞尔迪卡西进，越阿格里安群山、沿埃里贡河谷直插伊利里亚边境。佩利昂是这一带最坚固的城池，伊利里亚首领克莱图斯据四周高地扼险死守，这一仗就是要抢在陶兰提援军赶到之前把要塞拔掉。',
        sources: {
            battle: { level: 'fact', text: '英文维基百科 Siege of Pelium：公元前335年亚历山大攻伊利里亚人所据的佩利昂要塞，攻城战；克莱图斯焚城而逃，要塞入马其顿之手。' },
            time: { level: 'fact', text: '英文维基百科 Siege of Pelium 信息框 date = 335 BC；正文记亚历山大在多瑙河征战时闻伊利里亚之叛，其后西进，季节取夏。' },
            route: { level: 'fact', text: '英文维基百科 Battle at Lyginus River（独立条目）与 Balkan campaign：海姆斯山（战车之战）之后亚历山大北入特里巴利人之地，于莱吉努斯河畔击破其军（3,000 人战死），西尔穆斯退守多瑙河中的波伊刻岛；亚历山大自拜占庭调船上溯，又渡多瑙河击盖塔人，随后闻伊利里亚之叛，折返西南经阿格里安人之地／派奥尼亚进兵佩利昂。游戏路线：自上一处战场（海姆斯山）→ 德鲁斯塔尔（多瑙河畔）→ 布加勒斯特（北岸）→ 索非亚 → 佩利昂；编辑器「行军路线实测」已跑（2026-09-25 复测沿路 1231 公里、红 0）。🔴 [2026-09-25 主人补路] 末段「索非亚-佩利昂（经阿格里安人之地、派奥尼亚）」由主人补绘：索非亚 → 丘斯滕迪尔 → 库马诺沃 → 斯科普里 → 基切沃 → 奥赫里德 → 佩利昂；补路前这一段绕回佩拉、末段离路直行 140 公里 ✗，补后末段离路 0 公里。' },
            place: { level: 'inferred', text: '英文维基百科 Pelion (Illyria)：佩利昂在察贡山口附近、伊利里亚与马其顿边界，确切位置无定论；取温尼弗里斯说、莱恩·福克斯称「决定性论证」的兹韦兹代（Zvezdë，英文维基坐标 40.7306,20.8625）为据点坐标 —— 以知名度最大的说法合理推定。' },
            attacker: { level: 'fact', text: '英文维基百科 Siege of Pelium 信息框：马其顿，亚历山大、菲罗塔斯。' },
            attackerTroops: { level: 'fact', text: '英文维基百科 Siege of Pelium 信息框 strength1 = 23,000（重步兵一万二千、轻步兵八千、骑兵三千）。' },
            attackerLegion: { level: 'fact', text: '同东征诸役：马其顿军团，鱼鳞阵 3-4-2；同一支军队整场战争不换。' },
            defender: { level: 'fact', text: '英文维基百科 Siege of Pelium 信息框 commander2 = Kleitos（克莱图斯，巴尔迪利斯之子）、Glaukias（陶兰提王）；据点佩利昂为伊利里亚人达萨雷提部之城（Pelion (Illyria) 条目）。主人批准：势力定名「达萨雷提」。' },
            defenderTroops: { level: 'fact', text: '英文维基百科 Siege of Pelium 信息框 strength2 = 7,000；伤亡 马其顿二千、伊利里亚五千。' },
            defenderLegion: { level: 'popular', text: '伊利里亚步兵持矛盾、兼用标枪投石、骑兵不多 → 剧本军团「伊利里亚军团」雁行 4-3-2（见 scriptLegions.ts 出处）。' },
            result: { level: 'fact', text: '英文维基百科 Siege of Pelium：初攻不下退过河，三日后夜袭击溃伊利里亚人，克莱图斯焚城逃往格劳基亚斯境内；攻城战按史实易主，佩利昂归马其顿。' },
            briefing: { level: 'fact', text: '英文维基百科 Balkan campaign of Alexander the Great：击特里巴利人、以皮帐作筏渡多瑙河吓退格泰人；Siege of Pelium：克莱图斯与格劳基亚斯之叛、佩利昂扼山口。🔴 [2026-10-03 修] 阿里安《远征记》I.5 原文：亚历山大进至阿格里安人与派奥尼亚人之地时得报「克莱图斯（巴尔迪利斯之子）已反，陶兰提王格劳基阿斯归附于此人」，遂决意即刻进兵；佩利昂是伊利里亚达萨雷提部之城，**克莱图斯抢先占住此城**（「因它是那一带最强的城」），并非佩利昂向马其顿告急求救 —— 原第 3 路文案「佩利昂要塞告急…去救马其顿的西门」把守属关系写反，已改为「克莱图斯与陶兰提王格劳基亚斯连兵起事…先定西境」；Siege of Pelium 正文：克莱图斯据说以三童男、三童女、三黑羊祭神后迎战（「据说」一句从此出）。文案不写兵力确数。' },
        },
    },
    {
        year: -335,
        season: 2,                                   // 秋：英文维基 Battle of Thebes 记其在佩利昂之后，两周急行军入维奥蒂亚
        generalId: 'gen_alexander_great',
        type: 'siege',
        title: '公元前335年 底比斯战役',
        battleBriefing: '在底比斯城下，佩尔狄卡斯的前锋部队未等总攻信号便强行冲破了城外栅栏防线，与冲出的底比斯守军在通往赫拉克勒斯神庙的洼道陷入厮杀。底比斯守军背水一战，将马其顿前锋逼退；亚历山大在阵后见状，立即投入全部持盾卫队与长矛方阵主力发起反冲锋，顺着守军退入城门缝隙挤压进城内，刀光剑影在城内街道各处全面爆发。',
        description: '马其顿军团取底比斯：佩利昂一战亚历山大负伤，希腊各地误传亚历山大已战死，底比斯流亡者回城鼓动起兵、围困卫城卡德米亚的马其顿守军；亚历山大日夜兼程急行军南下直抵城下，底比斯人拒绝和解，城破后被夷为平地，幸存者尽数卖为奴隶，希腊各邦从此不敢再动，亚历山大得以放手东征。',
        siegeData: {
            title: '底比斯战役',
            battleBriefing: '在底比斯城下，佩尔狄卡斯的前锋部队未等总攻信号便强行冲破了城外栅栏防线，与冲出的底比斯守军在通往赫拉克勒斯神庙的洼道陷入厮杀。底比斯守军背水一战，将马其顿前锋逼退；亚历山大在阵后见状，立即投入全部持盾卫队与长矛方阵主力发起反冲锋，顺着守军退入城门缝隙挤压进城内，刀光剑影在城内街道各处全面爆发。',
            description: '底比斯人拒不接受和解条件，据城死战；马其顿军团攻入城中，底比斯主将菲尼克斯、普罗提特斯战死，城破后全城被夷平。',
            // 路标：史载穿过色萨利、经温泉关入维奥蒂亚；沿途无那一年已存在且在路网上的据点，按路网走
            marchWaypoints: ['city_pelina'],   // 🔴 [2026-09-30 按阿里安 I.7] 佩利昂 →（经埃奥达亚、埃利米奥提斯、斯廷法亚、帕拉瓦亚）第七天到色萨利的佩利纳 → 第六天入彼奥提亚（越过温泉关以南）。此前用佩拉作路标是路网缺据点造成的绕路，主人已建佩利纳
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 33000,
            attackerSourceCityId: 'city_peiliang',   // 出兵据点＝军团此刻在哪：上一场佩利昂攻城，就在那座城
            attackerLegionName: '马其顿军团',
            defenderFactionId: 'boootiya',
            defenderGeneralId: 'dibisi_phoinix',
            defenderTroops: 15000,
            defenderCityId: 'city_thebes',
            defenderLegionName: '底比斯军团',
            result: 'attacker_win',
            autoEnterRTS: true,
        },
        cityUpdates: [{ cityId: 'city_thebes', factionId: 'maqidun' }],
        commanderUnit: 'hero_mounted_alexander',
        // 对手主将队：素材样貌为持圆盾长矛的希腊重装步兵将领（底比斯守城主将为重装步兵统领）
        foeCommanderUnit: 'hero_brasidas',
        briefing: '佩利昂一战方歇，希腊各邦便盛传亚历山大重伤阵亡，底比斯流亡者趁势归城起兵，围了卡德米亚卫城的马其顿驻军。亚历山大不待休整，率全军昼夜兼程南下，强越温泉关直插维奥蒂亚腹地。',
        sources: {
            battle: { level: 'fact', text: '英文维基百科 Battle of Thebes：公元前335年亚历山大攻底比斯，战于城外与城中，攻城战；城破后被夷平。' },
            time: { level: 'fact', text: '英文维基百科 Battle of Thebes 信息框 date = 335 BC；正文记其在佩利昂之后、两周急行军入维奥蒂亚，季节取秋。' },
            place: { level: 'fact', text: '英文维基百科 Battle of Thebes 信息框坐标 38°19′15″N 23°19′04″E；游戏据点「底比斯」city_thebes 38.32,23.31，与之吻合。' },
            attacker: { level: 'fact', text: '英文维基百科 Battle of Thebes 信息框：马其顿与科林斯同盟，亚历山大亲统。' },
            attackerTroops: { level: 'fact', text: '英文维基百科 Battle of Thebes 信息框 strength1 = 33,000（步兵三万、骑兵三千）。' },
            attackerLegion: { level: 'fact', text: '同东征诸役：马其顿军团，鱼鳞阵 3-4-2；同一支军队整场战争不换。' },
            defender: { level: 'fact', text: '英文维基百科 Battle of Thebes 信息框 commander2 = Phoinix †、Prothytes †：守将取菲尼克斯。底比斯本城锚定武将伊巴密浓达前362 年已死，不用；剧本攻城由 scriptPeriod.getScriptSiegeDefenderGeneral 把城防守将指到菲尼克斯。' },
            defenderTroops: { level: 'fact', text: '英文维基百科 Battle of Thebes 信息框 strength2 = 15,000；伤亡 战死六千、被俘三万。' },
            defenderLegion: { level: 'popular', text: '底比斯以重装步兵方阵为主、维奥蒂亚骑兵为辅；前排步兵取**圣队兵模**（`sacred_band`，希腊底比斯圣队高级）—— 按主人 2026-10-02 口径「看样式不看名字」：圣队前338 年虽在喀罗尼亚覆灭，覆灭的是那支部队的番号，波奥提亚重装步兵的样式照旧，与三级「古典时代希腊军团」前排同款 → 剧本军团「底比斯军团」雁行 4-3-2（见 scriptLegions.ts 出处）。' },
            route: { level: 'fact', text: '英文维基百科 Battle of Thebes：自佩利昂南下，两周急行军三百余英里，第七天入色萨利、再一周入维奥蒂亚，经温泉关。沿途无那一年已存在且在路网上的据点，按路网走。路网现况（2026-09-29 实测）：库里没有色萨利、温泉关一线的据点，佩利昂到底比斯只能走 佩利昂 → 佩拉 → 德尔斐 → 底比斯（589 公里，约 1.7 倍）；这是路网所限，不是史实路线。播报因此不点名佩拉、坦佩谷、德尔斐，只写史载的「穿色萨利、过温泉关」。' },
            result: { level: 'fact', text: '英文维基百科 Battle of Thebes：马其顿胜，底比斯被夷为平地，幸存者尽卖为奴；攻城战按史实易主，底比斯归马其顿（游戏无「毁城」机制，只作易主）。' },
            briefing: { level: 'fact', text: '英文维基百科 Battle of Thebes：亚历山大在佩利昂负伤、德摩斯梯尼找人作证其已死；流亡者杀两名亲马其顿首领、围卡德米亚；两周急行军、第七天入色萨利；底比斯人以为来者是安提帕特；维奥蒂亚诸城离去、雅典按兵不动、斯巴达援军止于科林斯地峡。文案不写兵力确数。' },
        },
    },
    {
        year: -334,
        // 春（0）。史料记此役在 5 月前后；主人未指定季节，取春。
        season: 0,
        startCityId: 'city_salonica',
        type: 'field_battle',
        title: '公元前334年 格拉尼库斯河战役',
        battleBriefing: '面对守在陡峭东岸的波斯联军，部将帕曼纽劝亚历山大不要当日强渡：波斯军占着高岸，不如就地扎营、等天明朝渡。亚历山大不肯，说渡过赫勒斯滂竟被一条小河拦住、波斯人就要壮胆，随即亲自率领伙伴骑兵斜向突入格拉尼库斯河的湍急水流中。波斯骑兵在岸边居高临下倾泻标枪，亚历山大顶着矢石率领骑兵斜插登岸，一矛刺中冲在最前的大流士女婿密特里达提，把此人挑落马下；波斯将领罗萨西斯挥刀劈裂了亚历山大的战盔，斯皮特里达提又自背后举刀；危急关头，克莱图斯挥剑砍断了敌将挥向亚历山大后背的手臂，后方的马其顿重长矛骑兵随即源源不断涌上河滩，双方主将在狭窄的岸头展开血肉横飞的近身拉锯。',
        description: '马其顿大胜：亚历山大强渡急流击溃波斯联军，小亚细亚门户大开；阿尔西提斯战后自尽。',
        fieldBattleData: {
            title: '格拉尼库斯河战役',
            battleBriefing: '面对守在陡峭东岸的波斯联军，部将帕曼纽劝亚历山大不要当日强渡：波斯军占着高岸，不如就地扎营、等天明朝渡。亚历山大不肯，说渡过赫勒斯滂竟被一条小河拦住、波斯人就要壮胆，随即亲自率领伙伴骑兵斜向突入格拉尼库斯河的湍急水流中。波斯骑兵在岸边居高临下倾泻标枪，亚历山大顶着矢石率领骑兵斜插登岸，一矛刺中冲在最前的大流士女婿密特里达提，把此人挑落马下；波斯将领罗萨西斯挥刀劈裂了亚历山大的战盔，斯皮特里达提又自背后举刀；危急关头，克莱图斯挥剑砍断了敌将挥向亚历山大后背的手臂，后方的马其顿重长矛骑兵随即源源不断涌上河滩，双方主将在狭窄的岸头展开血肉横飞的近身拉锯。',
            description: '亚历山大亲率伙伴骑兵强渡格拉尼库斯河，击溃波斯联军；阿尔西提斯战后自尽。',

            // 英文维基 Battle of the Granicus 信息框坐标；本役是野战，故用 location 而非 locationCityId。
            location: { lat: 40.3167, lng: 27.2811 },
            // 🔴 [2026-09-28 主人定死四大铁律：第一片收官佩拉过冬，第二片开春自佩拉东征]
            //    🔴 [2026-10-03 修] 播报不写「佩拉誓师」——阿里安 I.11 记祭宙斯与奥林匹亚赛会在埃盖，
            //      史料无「佩拉誓师」；起点仍是【佩拉】，四大铁律不变，仅把无出处的那四个字改成「大军自佩拉开拔」。
            //    自佩拉东征：安菲波利斯集结 → 羊河登船渡赫勒斯滂 → 特洛伊祭雅典娜 → 进抵格拉尼库斯河
            marchWaypoints: ['city_anfeibolisi', 'city_yanghe', 'city_teluoyi'],

            // ── 攻方：马其顿 亚历山大 ──
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            // 🔴 [2026-09-16 主人定]「原文35000，战场就要35000」= 播报与数据必须同口径。
            // 🔴 [2026-09-23 主人定「一切以维基百科为准」] 数据改取英文维基 Battle of the Granicus 信息框 18100
            //    （步兵一万三千、骑兵五千一百），播报随之改成同一组数字；编辑器 ⑪ 自动核对。
            attackerTroops: 18100,
            // 🔴 [2026-09-28 主人定死四大铁律] 第二片起点为【佩拉】（春季自佩拉开拔东征，实测 0 公里）
            attackerSourceCityId: 'city_salonica',
            // 🔴 [2026-09-23] 剧本军团（第四层，src/data/scriptLegions.ts）：按此役史实配三兵种，乱斗不受影响
            attackerLegionName: '马其顿军团',

            // ── 守方：小弗里吉亚（赫勒斯滂弗里吉亚，波斯）阿尔西提斯 ──
            // 🔴 [2026-09-11 主人定] 守方统帅 = **阿尔西提斯**（`xiaofulijiya_aerxitis`）。
            //    他是本役波斯方最高统帅，且数据全齐：立绘 / 技能(ts_001, ordinary) /
            //    成名世纪(-4) / 时代(antiquity)，其势力精锐正是「希腊雇佣兵」(T2)。
            //    据点侧亦自洽：达斯基利翁 city_dasijiliweng 的 note 原文即
            //    「阿契美尼德波斯赫勒斯滂-弗里吉亚总督要塞，阿尔西提斯总督治所」，
            //    所在区组名为 GREEK_MERCENARY。
            defenderFactionId: 'xiaofulijiya',
            defenderGeneralId: 'xiaofulijiya_aerxitis',
            // 英文维基信息框：骑兵一万五千、步兵一万二千 = 27000；播报写同一组数字。
            defenderTroops: 27000,
            defenderSourceCityId: 'city_dasijiliweng',
            defenderLegionName: '波斯总督军团',   // 剧本军团：小亚细亚诸总督联军

            result: 'attacker_win',                     // 写真历史：马其顿必胜
            autoEnterRTS: true,                          // 进战术模式（13）
        },

        // 「据点归亚历山大」的落点：达斯基利翁（波斯方本营、阿尔西提斯治所）。
        // 主人只说「据点归亚历山大」未指定具体哪座城，此处依史实选定，可一句话更换。
        cityUpdates: [{ cityId: 'city_dasijiliweng', factionId: 'maqidun' }, { cityId: 'city_sifaerde', factionId: 'maqidun' }],   // 萨蒂斯（吕底亚首府）：密特里尼斯献城（阿里安 I.17）
        generalId: 'gen_alexander_great',
        commanderUnit: 'hero_mounted_alexander',   // 主将队：素材样貌为骑马的亚历山大
        // 对手主将队：阿尔塔弗涅斯——阿契美尼德萨迪斯总督，与此役小亚细亚诸总督同文化同身份；素材样貌为金甲红马衣的波斯贵族骑将
        foeCommanderUnit: 'hero_datis',   // 🔴 [2026-10-02 主人令「hero_datis 可以给其他军团」] 小亚细亚诸总督联军主帅阿尔西提斯 —— 取骑马执长矛的古典波斯统帅样（英雄·达提斯，同代同族）
        // 🔴 [2026-09-23] 武将邀约对白。史料：东征名义为报复薛西斯焚毁雅典神庙（阿里安《亚历山大远征记》II.14 致大流士书）；
        //    波斯小亚细亚诸总督集结于格拉尼库斯河迎战（同书 I.12）。
        // 途经但前334年还不存在的据点：鲁西翁为中世纪地名
        absentCities: ['city_luxiweng'],
        // 🔴 [2026-09-23] 资料清单：每项依据与可信级别（src/data/eventSources.ts），编辑器里每项必填
        sources: { battle: { level: 'fact', text: '英文维基百科 Battle of the Granicus：格拉尼库斯河战役，野战，亚历山大强渡河流进攻据守东岸的波斯军。据阿里安《远征记》I.13：部将帕曼纽（远征军副帅、老将）劝亚历山大不要当日强渡、主张就地扎营等天明再渡，亚历山大不从而即刻强渡 —— 他说渡过赫勒斯滂之后竟被一条小河拦住，波斯人就要壮起胆来。' }, time: { level: 'fact', text: '英文维基百科 Battle of the Granicus：公元前334年5月，初春自马其顿出发，20天抵塞斯托斯，季节取春。' }, place: { level: 'fact', text: '英文维基百科 Battle of the Granicus：格拉尼库斯河即今土耳其比加河；坐标取信息框 40.3167,27.2811。' }, attacker: { level: 'fact', text: '英文维基百科 Battle of the Granicus：马其顿与希腊同盟，亚历山大亲统右翼，帕曼纽统左翼。' }, attackerTroops: { level: 'fact', text: '英文维基百科 Battle of the Granicus 信息框：马其顿军团投入此役共18100人。' }, attackerLegion: { level: 'fact', text: '英文维基百科 Ancient Macedonian army：史称马其顿军团；伙伴骑兵作矛头、方阵跟进、克里特弓箭手掩护，前358至公元前331年一贯如此，故前骑兵、中步兵、后远程。比例按 Battle of the Granicus 信息框：骑兵5100、步兵12000、远程1000，步兵最多，取鱼鳞阵 前3中4后2，远程最少只能2人。' }, defender: { level: 'fact', text: '英文维基百科 Battle of the Granicus：阿契美尼德小亚细亚诸总督联军，古史未明言主帅，现代学者认为赫勒斯滂弗里吉亚总督阿尔西提斯总领；门农等同在军中。' }, defenderTroops: { level: 'fact', text: '英文维基百科 Battle of the Granicus 信息框：波斯军14000至40000人，按标准取区间中值27000。' }, defenderLegion: { level: 'popular', text: '英文维基百科 Battle of the Granicus：诸总督联军无专名，称波斯总督军团；骑兵沿东岸列阵在前，步兵列其后高地，含数千希腊雇佣兵；信息框中值骑兵15000、步兵12000，取雁行阵 前骑兵4中步兵3后远程2；远程无明载，按阿契美尼德军团以弓手著称补一排。' }, route: { level: 'fact', text: '英文维基百科 Battle of the Granicus：自马其顿经色雷斯至塞斯托斯，大军由塞斯托斯渡至阿拜多斯，亚历山大自埃莱乌斯渡海登西格翁角，谒伊利昂，经阿里斯巴、佩尔科特、兰普萨库斯至格拉尼库斯河。游戏路线：佩拉、安菲波利斯、羊河近塞斯托斯、坐船至特洛伊即伊利昂、沿海岸东进；途经据点鲁西翁为中世纪地名、格拉尼库斯为按战役起名的城寨，公元前334年皆无此城，列入那一年不存在，路照走、城不显示。2026-09-28 定死四大铁律：第一片收官佩拉过冬，第二片开春自佩拉东征。🔴 [2026-10-03 修] 阿里安《远征记》I.11 原文：开春自马其顿向赫勒斯滂进军，马其顿与希腊事务交安提帕特；行前在埃盖献祭宙斯奥林匹俄斯、举行奥林匹亚赛会；帕曼纽率骑兵与步兵主力自塞斯托斯渡至阿拜多斯（一百六十艘战船外另有许多商船），亚历山大自埃莱乌斯登船、亲操舵位，行至海峡中央祭波塞冬与海中仙女、以金杯奠酒，全副甲胄第一个踏上亚洲土地，随后登伊利昂祭特洛伊的雅典娜 —— 史料既无「佩拉誓师」，也无「趁夜渡海」，原第 7／8 路文案两处已据此删改。路线：自佩拉开拔，经安菲波利斯至羊河登船渡赫勒斯滂，至特洛伊谒雅典娜神庙，沿海岸东进抵格拉尼库斯河。实测红 0、提示 0。' }, result: { level: 'fact', text: '英文维基百科 Battle of the Granicus：马其顿胜，亚历山大取得小亚细亚半壁；战后据点达斯基利翁即阿尔西提斯治所归马其顿。阿里安《亚历山大远征记》I.17：战后亚历山大进军萨蒂斯，守将密特里尼斯献城、交出卫城与国库，萨蒂斯（吕底亚首府）亦归马其顿，成为他小亚细亚第一个大本营。' }, briefing: { level: 'fact', text: '英文维基百科 Battle of the Granicus：门农献焦土之策被拒、帕曼纽劝明晨再渡被拒；波斯骑兵沿东岸列阵、希腊雇佣兵在后；播报兵力只写大军，不写确数。英文维基百科 Alexander the Great：生于公元前356年7月，此役时周岁二十一，按中国虚岁计二十二。阿里安《远征记》I.10：底比斯覆灭后阿卡迪亚人处死主战领袖、埃利斯人迎回亲马其顿流亡者、埃托利亚各部遣使请赦、雅典遣使称贺 —— 斯巴达不在此列（未入科林斯同盟、始终未遣使输诚），故赶路播报不写斯巴达。阿里安《远征记》I.11：亚历山大班师马其顿、在埃盖祭宙斯并举行奥林匹亚赛会，来春启程赴赫勒斯滂，把马其顿与希腊托付安提帕特。' } },
    },
    // ── 由战场事件编辑器生成（/battlefield-editor.html）──
    {
        year: -334,
        season: 1,
        generalId: 'gen_alexander_great',
        sources: { battle: { level: 'fact', text: '英文维基百科 Siege of Miletus：公元前334年马其顿与阿契美尼德波斯之间的攻城战，亚历山大东征中的第一场攻城战与海战交锋；中文维基百科「米利都圍城戰」同条记其为东征中与波斯之间的第一场攻城战。' }, time: { level: 'popular', text: '英文维基百科 Siege of Miletus 信息框 date = 334 BC；中文维基百科同条目亦记公元前334年，两者均未给月份。此役在格拉尼库斯河战役（公元前334年5月）之后、哈利卡纳苏斯围城（公元前334年冬）之前，故季节取夏。可信级别：通行说法。' }, place: { level: 'fact', text: '英文维基百科 Siege of Miletus 信息框 coordinates 37°31′49″N 27°16′42″E（今土耳其艾登省迪迪姆的 Balat），即波斯治下的希腊城邦米利都（中文维基百科「米利都圍城戰」：愛奧尼亞的米利都）；本据点记录取其坐标 37.5303,27.2783。' }, attacker: { level: 'fact', text: '英文维基百科 Siege of Miletus 信息框 commander1 = Alexander the Great、Nicanor（帕曼纽之子，率舰队封锁港口）；中文维基百科「米利都圍城戰」：亚历山大亲统陆军，并先分派部队进攻伊奥尼亚境内尚未臣服的城镇，尼卡诺尔率马其顿舰队（一百六十艘）先占莱德岛。' }, attackerTroops: { level: 'inferred', text: '中、英文维基信息框均未给陆上兵数（英文信息框 strength1 只给 160 ships；中文信息框记「陸軍不明，艦隊160艘」）。同一支马其顿军团于两个月前在格拉尼库斯为 18,100 人（英文维基 Battle of the Granicus 信息框），此后未获大补，中文维基另记其先分兵去取伊奥尼亚未服城镇，故取 18,000 —— 合理推定。' }, attackerLegion: { level: 'fact', text: '同东征诸役：马其顿军团（前伙伴骑兵、中方阵步兵、后克里特弓箭手，鱼鳞阵 3-4-2，整场战争不换）。此役陆军以投石机轰击城墙、自缺口攻入（中文维基百科「米利都圍城戰」引阿里安《亚历山大远征记》卷一）。' }, defender: { level: 'fact', text: '英文维基百科 Siege of Miletus 信息框 commander2 = Hegesistratus（赫格西斯特），即米利都的波斯驻军守将；中文维基百科「米利都圍城戰」：他本欲向亚历山大献城，因附近波斯守军尚未远离、加上波斯舰队承诺来援而反悔；同条记波斯守军事先把兵力集中于米利都内城。' }, defenderTroops: { level: 'inferred', text: '英文维基百科 Siege of Miletus 信息框 strength2 = 400 ships (not engaged) + 300 Milesians；中文维基百科信息框记「陸軍不明，數量遠少於馬其頓軍」，正文记守城主力为希腊雇佣兵、另有波斯守军据内城，城破时少部分退守城外小岛（岛上即那三百名决意死战的希腊雇佣兵）、其余大多被消灭。据此全城守军当以千计，取 3000（远少于攻方，与中文维基「數量遠少於馬其頓軍」一致）—— 合理推定。' }, defenderLegion: { level: 'fact', text: '中文维基百科「米利都圍城戰」（据阿里安《亚历山大远征记》卷一）：守城主力为希腊雇佣兵，另有波斯守军据内城；波斯舰队四百艘停泊米克利，因马其顿舰队守住港口而无法支援。英文维基百科信息框 combatant2 = Achaemenid Empire、Milesian allies。守方军团取剧本军团「波斯驻军团」（🔴 [2026-10-02 主人令] 新立的第四层军团：**城防／要塞守军**，三排 前远程3（城头弓弩）/ 中步兵4（守城主力＝雇佣重步兵）/ 后骑兵2（城内预备），鱼鳞 3-4-2）。米利都守军是「希腊雇佣兵主力＋波斯守军据内城」，不是大流士亲统的主力野战军，故不再用「阿契美尼德军团」（那一支是伊苏斯、高加米拉那种帝国主力会战用的）。' }, route: { level: 'fact', text: '中文维基百科「米利都圍城戰」背景节（据阿里安《亚历山大远征记》卷一）：格拉尼库斯战后波斯小亚细亚诸总督多阵亡，赫勒斯滂弗里吉亚全归亚历山大，萨第斯、以弗所相继投降，米利都守将亦曾允降；亚历山大再分兵取伊奥尼亚未服城镇、自率其余南下米利都。游戏路线：自上一处战场（格拉尼库斯）进占萨迪斯（密特里尼斯献城）并在萨迪斯休整誓师 → 以弗所 → 米利都；彻底消除渡海折返欧洲羊河的违背史实走线。编辑器实测：战场 → 萨迪斯 242 公里，萨迪斯 → 以弗所 137 公里，以弗所 → 米利都 66 公里，末段离路 0 公里，红 0。' }, result: { level: 'fact', text: '英文维基百科 Siege of Miletus：马其顿胜，territory = Alexander controls Ionia。中文维基百科「米利都圍城戰」（据阿里安《亚历山大远征记》卷一）：马其顿陆海并进，陆军以投石机破墙自缺口入城，尼卡诺尔舰队封住港口使波斯舰队无法支援，城内波斯守军大多被消灭，全城落入亚历山大之手；退守小岛的希腊雇佣兵被亚历山大收编入自己的军队。故本场「战后归属」按历史写米利都归马其顿。' }, briefing: { level: 'fact', text: '英文维基百科 Battle of the Granicus 后续节（据阿里安《远征记》I.17）：此战后**达斯基利翁由波斯守军弃城、帕曼纽进占**（不是守将献城）；亚历山大继进萨迪斯，萨迪斯投降，守将密特里尼斯交出卫城与国库；再至以弗所，该城希腊雇佣兵守军亦弃城他走。米利都守将赫格西斯特（英文维基百科 Siege of Miletus 信息框 commander2 = Hegesistratus）本已允降，因波斯舰队承诺来援而反悔。中、英文维基百科「米利都圍城戰」与阿里安《亚历山大远征记》卷一：尼卡诺尔先率舰队占莱德岛并把部队运上岛；三日后波斯舰队才到，只得在更远的米克利下锚；帕曼纽请战被亚历山大回绝（自认舰队数量与海战技巧都不及腓尼基、塞浦路斯水手）；亚历山大派菲罗塔斯前往米克利断其取水补给，波斯舰队退往萨摩斯、终于离开米利都海域；战后亚历山大解散海军，改以陆军夺取波斯所有海军基地。文案按主人规矩不写兵力确数。' } },
        type: 'siege',
        title: '公元前334年 米利都战役',
        briefing: '小亚细亚的城门顺着这条大道一扇扇打开：达斯基利翁的波斯守军弃城而走，萨迪斯的密特里尼斯交出卫城与国库。大军继续南下，经以弗所直指爱奥尼亚的港口米利都——守将赫格西斯特本已允降，听说波斯舰队许诺来援，又闭门固守。',
        battleBriefing: '米利都城外，马其顿陆军把攻城槌与投石机推到城墙脚下，重重砸向厚重的石墙；菲洛塔斯前出米克利，截断守军从海上取水的路。随着城墙被轰开一道缺口，马其顿持盾卫队手持重盾与短剑，踩着碎石瓦砾发起登城强冲，双方在缺口处展开白热化的争夺厮杀。',
        description: '马其顿军团取米利都：亚历山大先分兵扫平伊奥尼亚尚未臣服的城镇，自率主力南下围城；帕曼纽之子尼卡诺尔抢先占住莱德岛，把波斯舰队逼在港外。陆军以投石机轰塌城墙、自缺口突入，守军大多被歼，退守小岛的希腊雇佣兵被亚历山大收编入伍。米利都归马其顿，伊奥尼亚全境臣服；此战之后亚历山大认清马其顿舰队敌不过波斯海军，解散海军，改以陆军逐座拔掉波斯的海军基地。',
        siegeData: {
            title: '米利都战役',
            battleBriefing: '米利都城外，马其顿陆军把攻城槌与投石机推到城墙脚下，重重砸向厚重的石墙；菲洛塔斯前出米克利，截断守军从海上取水的路。随着城墙被轰开一道缺口，马其顿持盾卫队手持重盾与短剑，踩着碎石瓦砾发起登城强冲，双方在缺口处展开白热化的争夺厮杀。',
            description: '米利都守军以希腊雇佣兵为主力、波斯守军据内城，凭城墙与港口死守；马其顿陆军以投石机轰击城墙、自缺口攻入，尼卡诺尔率舰队封锁港口使波斯舰队无法支援，城遂破。',
            marchWaypoints: ['city_sifaerde', 'city_yifusuo'],   // 史料：格拉尼库斯战后先进占萨迪斯（密特里尼斯献城）、再南下以弗所、米利都 —— 军团走过去，不是瞬移
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 18000,
            attackerSourceCityId: 'city_yanghe',   // 出兵据点＝军团此刻在哪＝格拉尼库斯战场最近的据点（羊河）；萨迪斯是途经，写在路标里（AGENTS §三.1：史料里中途去过的地方一律是路标）
            attackerLegionName: '马其顿军团',
            defenderGeneralId: 'yiaoniya_hegesistratus',
            defenderTroops: 3000,
            defenderCityId: 'city_miletus',
            // 🔴 [2026-10-02 主人令「另立一支波斯驻军就该新建一个四级军团」] 城防守军改用新立的第四层军团「波斯驻军团」
            defenderLegionName: '波斯驻军团',
            result: 'attacker_win',
            autoEnterRTS: true,
        },
        cityUpdates: [{ cityId: 'city_miletus', factionId: 'maqidun' }],
        // 🔴 [2026-10-02 修] 这一场原来**两个主将队字段都没有**（`commanderUnit` / `foeCommanderUnit` 皆缺）——
        //    双方第 10 队都没有英雄兵模，编辑器（「主将队兵种必须选」「对手主将队兵种没选」）本来就不许存盘。
        commanderUnit: 'hero_mounted_alexander',   // 主将队：素材样貌为骑马的亚历山大（与本剧本其余各场同一人同一样子）
        // 对手主将队：守方主帅赫格西斯特是**米利都的守将**（希腊人，拜占庭—米利都一路的守城指挥，
        //    项目自己的史料依据写作「米利都的波斯驻军守将」；立绘也归在 /assets/GREEK/）。
        //    🔴 [2026-10-02 对齐] 取 `hero_aristides`（同代希腊甲士形象）—— 与**隔壁同类守城战**的既有取法一致：
        //    哈利卡纳苏斯（守将门农，同为波斯麾下的希腊守城名将）= hero_aristides、加沙（守将巴提斯）= hero_aristides、
        //    推罗与底比斯 = hero_brasidas。主将队是**主帅本人那支队**，按人取样式；
        //    军团三排是「阿契美尼德军团」那是**军队**的样式，两码事（门农那场也是波斯军团 + 希腊主帅兵模）。
        foeCommanderUnit: 'hero_aristides',
    },
    // ── 由战场事件编辑器生成（/battlefield-editor.html）──
    {
        year: -334,
        season: 2,
        generalId: 'gen_alexander_great',
        sources: { battle: { level: 'fact', text: '英文维基百科 Siege of Halicarnassus：公元前334年马其顿与阿契美尼德波斯的攻城战（亚历山大东征中的攻城战）；中文维基百科「哈利卡那索斯圍城戰」同条记其为东征中与波斯之间的一场攻城战。🔴 [2026-10-03 修] 阿里安《远征记》I.20–I.21：围城首日亚历山大「朝通往**米拉萨**的城门方向」领兵逼近城墙，城内守军出城接战、被逐回城内；数日后佩尔狄卡斯营两名士兵莽撞攻墙（面向卫城、**大部分朝向米拉萨**的那段墙），引发双方激战。**「明多斯」方向那一路是另一回事** —— 亚历山大带近卫夜奔明多斯城、想里应外合夺城（未成），不是这场肉搏的战场。原旁白写「在**明多斯门前**…爆发惨烈的肉搏攻防」，地点写错，已改为「在通往米拉萨的城门下」。夜袭烧器械一句**有出处、保留**（中文维基「哈利卡那索斯圍城戰」：亚历山大填平护城河架起投石机后，波斯守军企图发动夜袭破坏攻城器具，被马其顿军击退；据阿里安《远征记》卷一）。' }, time: { level: 'popular', text: '英文维基百科 Siege of Halicarnassus 信息框 date = 334 BC；中文维基百科同条目亦记公元前334年，两者均未给月份。此役在米利都围城（夏）之后，围城结束后亚历山大遣新婚士兵回乡过冬（英文维基 Aftermath 节），故季节取秋。可信级别：通行说法。' }, place: { level: 'fact', text: '英文维基百科 Siege of Halicarnassus 信息框 coordinates 37.0333,27.4333（今土耳其博德鲁姆），即卡里亚都城哈利卡纳苏斯（摩索拉斯陵墓所在）；本据点记录坐标 37.03,27.43 与之一致。' }, attacker: { level: 'fact', text: '英文维基百科 Siege of Halicarnassus 信息框 commander1 = Alexander the Great；中文维基百科「哈利卡那索斯圍城戰」：亚历山大亲统陆军围城，部将佩尔狄卡斯所部亦在阵中（营中两名士兵冒进引燃总攻）。' }, attackerTroops: { level: 'inferred', text: '中、英文维基信息框均未给双方兵力（英文只给伤亡 16 : 170）。同一支马其顿军团自格拉尼库斯（英文维基 Battle of the Granicus 信息框 18,100）连战未获大补，其间又分兵留守、另有部队被派去取伊奥尼亚未服城镇，故沿用前两场的量级取 18,000 —— 合理推定。' }, attackerLegion: { level: 'fact', text: '同东征诸役：马其顿军团（前伙伴骑兵、中方阵步兵、后克里特弓箭手，鱼鳞阵 3-4-2，整场战争不换）。此役陆军填平护城河、架投石机轰城，并自被撞开的城墙缺口攻入（中文维基百科「哈利卡那索斯圍城戰」，据阿里安《亚历山大远征记》卷一）。' }, defender: { level: 'fact', text: '英文维基百科 Siege of Halicarnassus 信息框 commander2 = Orontobates、Memnon of Rhodes；中文维基百科同条：米利都战后波斯在哈利卡纳苏斯集结重兵，希腊雇佣军将领**罗得岛的门农受任小亚细亚总指挥、统率波斯舰队**并主持防务；卡里亚总督为**欧戎托巴提斯**（皮克索达拉斯之婿，皮克索达拉斯卒后由大流士三世任命）。本场守方主帅取门农。' }, defenderTroops: { level: 'inferred', text: '中、英文维基信息框均未给守方兵力（英文信息框只给伤亡 170）。中文维基记波斯在城中「聚集大批部队和希腊雇佣军」、以希腊雇佣军为主力，且能连日出城反击、夜袭烧器械、城破前从容整队夜遁，其众当以千计；按前一场米利都同一口径取 3,000（远少于攻方 18,000）—— 合理推定。' }, defenderLegion: { level: 'fact', text: '中文维基百科「哈利卡那索斯圍城戰」（据阿里安《亚历山大远征记》卷一）：守城主力为希腊雇佣军，另有波斯守军；波斯舰队泊于港内策应，援军曾乘船自海上抵达。守方军团取剧本军团「波斯驻军团」（🔴 [2026-10-02 主人令] 新立的第四层军团 = 城防守军：前远程3 / 中步兵4 / 后骑兵2，鱼鳞 3-4-2）。英文维基信息框 combatant2 = Achaemenid Empire，但门农麾下是「希腊雇佣军主力＋波斯守军、波斯舰队泊港策应」的**城防军**，与伊苏斯、高加米拉那种大流士亲统的主力野战军（阿契美尼德军团）不是同一支，故拆开。' }, route: { level: 'fact', text: '中文维基百科「哈利卡那索斯圍城戰」背景节（据阿里安《亚历山大远征记》卷一）：米利都围城战后，波斯在卡里亚的哈利卡纳苏斯集结部队与希腊雇佣军；亚历山大进入卡里亚境内，前女王阿妲献出要塞阿林达来投，随即围城。游戏路线：自上一处战场（米利都，攻城战＝那座城）开拔，沿主人新修的「米利都-哈利卡纳苏斯」道路南下直抵该城；阿林达不在据点库中，按铁律不新建、不写路标。' }, result: { level: 'fact', text: '英文维基百科 Siege of Halicarnassus：马其顿胜，territory = Alexander captures Caria。中文维基百科「哈利卡那索斯圍城戰」（据阿里安《亚历山大远征记》卷一）：门农与欧戎托巴提斯见城墙已倒一段、伤兵日增，决定弃城；波斯残军趁夜退出并焚烧城中军需，当晚风大，全城陷入火海；战后亚历山大仅得一座残城，留部分军队驻守，并把卡里亚交给阿妲统领。故本场「战后归属」按历史写哈利卡纳苏斯归马其顿（卫城仍为波斯守军据守，其后始下）。' }, briefing: { level: 'fact', text: '中、英文维基百科「哈利卡那索斯圍城戰」与阿里安《亚历山大远征记》卷一：内应约开城门未成、守军拼死抵抗而波斯援军乘船抵达，亚历山大先攻旁近要塞无功；其后填壕架炮，守军夜袭烧器械被击退；佩尔狄卡斯营中两名士兵冒进引来总攻，城墙被撞开、泥瓦匠旋即补砌新墙；连日轰城双方僵持，守军伤亡渐重；门农与欧戎托巴提斯决意弃城，残军夜遁纵火，风助火势焚毁全城；亚历山大急令追击并扑火救民，战后把卡里亚交阿妲。文案按主人规矩不写兵力确数。' } },
        commanderUnit: 'hero_mounted_alexander',
        foeCommanderUnit: 'hero_aristides',
        type: 'siege',
        title: '公元前334年 哈利卡纳苏斯战役',
        briefing: '大军南下卡里亚，直取哈利卡纳苏斯。',
        battleBriefing: '在哈利卡纳苏斯深堑与三重城墙前，马其顿工程兵在巨型攻城塔掩护下填平护城河，双方投石机与弩炮在城上城下疯狂交火。波斯名将门农多次组织敢死队趁夜色出城放火焚烧攻城器械；在通往米拉萨的城门下，马其顿士兵与城内守军在攻城土堆与坍塌城墙间爆发了惨烈的肉搏攻防，波斯守军从内侧高塔倾泻箭雨与滚油，浓烟与杀声笼罩着整座坍塌的城墙。',
        description: '马其顿军团取哈利卡纳苏斯：亚历山大先攻旁近要塞无功，转而填壕架炮强攻坚城；守军夜袭烧器械、白日居高反击，双方僵持多日，城墙终被撞开一段。门农与欧戎托巴提斯见伤兵日增，决意弃城，波斯残军趁夜退出并纵火焚城，风大火烈全城化为火海。亚历山大急令追击扑火、救护百姓，最后到手的不过是座残城；哈利卡纳苏斯归马其顿，卡里亚交由前女王阿妲统领。',
        siegeData: {
            title: '哈利卡纳苏斯战役',
            battleBriefing: '在哈利卡纳苏斯深堑与三重城墙前，马其顿工程兵在巨型攻城塔掩护下填平护城河，双方投石机与弩炮在城上城下疯狂交火。波斯名将门农多次组织敢死队趁夜色出城放火焚烧攻城器械；在通往米拉萨的城门下，马其顿士兵与城内守军在攻城土堆与坍塌城墙间爆发了惨烈的肉搏攻防，波斯守军从内侧高塔倾泻箭雨与滚油，浓烟与杀声笼罩着整座坍塌的城墙。',
            description: '守军以希腊雇佣军为主力、波斯舰队泊于港内策应，凭护城河、投石机与城墙死守；马其顿军团填平壕沟、架炮轰墙，自被撞开的缺口强攻，守军当夜弃城纵火，城破。',
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 18000,
            attackerSourceCityId: 'city_miletus',
            attackerLegionName: '马其顿军团',
            defenderGeneralId: 'halikanasu_memnon',
            defenderTroops: 3000,
            defenderCityId: 'city_halikanasu',
            // 🔴 [2026-10-02 主人令] 城防守军改用新立的第四层军团「波斯驻军团」（门农麾下守军＝希腊雇佣军主力＋波斯守军）
            defenderLegionName: '波斯驻军团',
            result: 'attacker_win',
            autoEnterRTS: true,
        },
        cityUpdates: [{ cityId: 'city_halikanasu', factionId: 'maqidun' }],
    },
    {
        year: -333,
        // 秋（2）。史料记此役在前 333 年 11 月。
        season: 2,
        type: 'field_battle',
        title: '公元前333年 伊苏斯战役',
        battleBriefing: '在狭窄的皮纳鲁斯河平原上，波斯重骑兵在沿海右翼强渡河流，给帕曼纽率领的马其顿左翼施加了巨大压力；中路的希腊雇佣兵方阵在河岸陡坡与马其顿长矛手陷入惨烈撕咬。亚历山大在右翼密切注视战场，敏锐捕捉到波斯中军与左翼交接处的防线缝隙，随即亲自率领伙伴骑兵组成精锐楔形阵，如利刃般直插大流士的战车座驾，近卫骑兵与波斯皇家侍卫在大流士战车前展开生死厮杀。',
        description: '马其顿决定性胜利：亚历山大强渡皮纳鲁斯河直扑大流士御驾；大流士弃车逃离，王室家眷悉数被俘。',
        fieldBattleData: {
            title: '伊苏斯战役',
            battleBriefing: '在狭窄的皮纳鲁斯河平原上，波斯重骑兵在沿海右翼强渡河流，给帕曼纽率领的马其顿左翼施加了巨大压力；中路的希腊雇佣兵方阵在河岸陡坡与马其顿长矛手陷入惨烈撕咬。亚历山大在右翼密切注视战场，敏锐捕捉到波斯中军与左翼交接处的防线缝隙，随即亲自率领伙伴骑兵组成精锐楔形阵，如利刃般直插大流士的战车座驾，近卫骑兵与波斯皇家侍卫在大流士战车前展开生死厮杀。',
            description: '亚历山大亲率右翼伙伴骑兵渡河突破波斯左翼，大流士三世弃车逃离，王室家眷被俘。',

            // 皮纳鲁斯河畔（伊苏斯城东南约 12 km），野战用 location。
            location: { lat: 36.7525, lng: 36.1923 },   // 英文维基 Battle of Issus 信息框
            // 戈尔迪乌姆出发，经安卡拉（古安库拉）、伊科尼乌姆（古吕考尼亚/科尼亚）、阿达纳（塔尔苏斯附近），南下伊苏斯
            // 🔴 [2026-09-23 主人授权「你不会根据历史，制定真实的行军路线吗？」] 补上伊科尼乌姆当路标：
            //    史载亚历山大前333年自戈尔迪乌姆东至安库拉，再南下经卡帕多西亚、过托罗斯山（奇里乞亚门）入奇里乞亚；
            //    提亚纳、奇里乞亚门项目里没有据点，按铁律「用附近已有据点连接，绝不新建」，
            //    路网实测南下走的就是伊科尼乌姆一线（安卡拉→阿达纳 直接寻路即「途经 伊科尼乌姆→阿达纳」）。
            //    实测（scratch/_probe_route_waypoints.mjs）：安卡拉→伊科尼乌姆 直线232km/路网251km（1.09x）、
            //    伊科尼乌姆→阿达纳 直线304km/路网359km（1.18x），都在 400km 与 1.6x 之内；
            //    不补它则安卡拉→阿达纳 一段直线 407km，超过编辑器 400km 上限。
            marchWaypoints: ['city_peierge', 'city_geerdiweng', 'city_ankala', 'city_tiyana', 'city_adana'],   // 段2-4：阿斯彭杜斯 → 戈尔迪乌姆 → 安卡拉 → 提亚纳 → 阿达纳 → 伊苏斯

            // ── 攻方：马其顿 亚历山大 ──
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerLegionName: '马其顿军团',   // 剧本军团：亚历山大所率马其顿军团，整场东征同一支
            attackerTroops: 37000,                 // 英文维基 Battle of Issus 信息框：约 37000
            attackerSourceCityId: 'city_halikanasu',   // 出兵据点＝军团此刻在哪：上一场（前334年冬哈利卡纳苏斯围城）打完就停在那座城；戈尔迪乌姆是沿途路标

            // ── 守方：阿契美尼德（波斯）· 大流士 ──
            // 🔴 [2026-09-12 主人定「现在守方写的是 boluosi（波斯帝国）改成阿契美尼德，可以吗」→ 可以，照办]
            //    理由（实测）：① 史实上伊苏斯的波斯方就是**阿契美尼德帝国**，`boluosi`(波斯帝国) 与
            //    `aqimeinide`(阿契美尼德) 本来就是同一政权、在项目里重复了；② `boluosi` **一个据点都没有**
            //    （四公理报 `noCity 1`，其首都还挂在不存在的 `city_yisusi` 上）→ 已整条删除；
            //    ③ 阿契美尼德四件套现成且齐全：据点波斯波利斯 / 旗号「阿契」/ 武将「大流士」/ 精锐不死军 T2。
            defenderFactionId: 'aqimeinide',
            // 🔴 [2026-09-12 主人「看历史啊」] 伊苏斯主帅＝**大流士三世**（东征时期在位的阿契美尼德大王）
            defenderGeneralId: 'daliushi_iii',
            // 🔴 [2026-09-12 主人定] **兵力按史料，不许为凑胜负动兵数**（原话「加兵违背历史，要符合历史」）。
            //    史实就是波斯人多势众、马其顿以少胜多 → 取英文维基信息框区间中值，播报写同一个数。
            //    （胜负不靠改兵数解决：13 战术模式的胜负在演出里打出来，见 docs 与 Scene13WarLayer）
            defenderTroops: 74000,                 // 英文维基信息框：现代估计 5 万–10 万；中值 75000 超出守方≤攻方 2 倍（37000×2），取区间内最近的 74000
            // 🔴 出兵据点必须是**真城**（原写 `city_yisusi` —— 伊苏斯已改独立战场，那座城不存在了，属历史遗留缺陷）
            defenderSourceCityId: 'city_bosibolisi',
            defenderLegionName: '阿契美尼德军团',   // 剧本军团：大流士三世所率阿契美尼德王军

            result: 'attacker_win',
            autoEnterRTS: true,
        },

        // 🔴 [2026-09-12 主人定 → 2026-09-25 按新规改] 伊苏斯是**战场**（`bf_yisusi`），战果本来只体现在战场；但主人 2026-09-24 定「野战后按历史写战后归属」，故本场补伊苏斯战后确实易主的据点：帕曼纽南下取大马士革（阿里安 II.11）。
        //    战场**没有势力**（不是据点，也没有自己的 factionId），不存在「易主」这回事。
        //    原先那句 `{ cityId: 'city_yisusi', factionId: 'maqidun' }` 是错误逻辑，主人指出后已删 ——
        //    它会让一座战场走一遍占城流程
        //    （`CityManager.updateCity`：写 `fallenAtYear`、重置将/精名额、播占城播报与烟雾）。
        generalId: 'gen_alexander_great',
        commanderUnit: 'hero_mounted_alexander',   // 主将队：素材样貌为骑马的亚历山大
        // 对手主将队：🔴 [2026-09-23 主人定「兵模没有的话，就用同时代的人就行，看样子，不要看名字」]
        //    项目里没有大流士三世本人的英雄兵模（public/SUCAI 只有 ARTAPHERNES 与 DATIS 两个波斯英雄）。
        //    原用 hero_datis（达提斯）—— 那是**前490年马拉松**的波斯统帅，与伊苏斯前333年差 157 年，
        //    素材样貌也是银灰甲灰马、色调偏欧式（对照图：scratch/_hero_compare.png）。
        //    改用 hero_artaphernes（阿尔塔弗涅斯，前334年阿契美尼德萨迪斯总督）：**同时代**，
        //    样貌是金甲红披风的波斯贵族骑将，与「大流士三世御驾」这一路的形象相符。
        //    按主人令**只看样貌与年代，不看名字**（是谁不追究）。
        foeCommanderUnit: 'hero_tsarkonstantin',   // 🔴 [2026-10-02 主人令「换」] 阿契美尼德军团主将队改用 hero_tsarkonstantin（双马具装车驾：大流士三世在伊苏斯、高加米拉皆乘战车督战）
        // 🔴 [2026-09-24 主人怒斥「怎么从加沙到的孟菲斯？」同一类毛病] 出兵据点＝军团此刻在哪＝哈利卡纳苏斯（上一场落点）；
        //    戈尔迪乌姆写在路标里（前333年春在此斩断戈尔迪之结），军团走过去，不瞬移 492 公里
        // 🔴 [2026-09-23] 资料清单：每项依据与可信级别（src/data/eventSources.ts）
        sources: { battle: { level: 'fact', text: '英文维基百科 Battle of Issus：伊苏斯战役，野战，两军在皮纳鲁斯河两岸会战。🔴 [2026-10-03 修] 翼向以阿里安《远征记》II.8 原文为准：马其顿军「一列列重装步兵朝右面的山、朝左面的海展开」（**左翼临海**，由帕曼纽总领），大流士把骑兵「大部分放在**临海的右翼**、正对帕曼纽」，因为那一带地势便于骑兵机动，另把两万人摆在左翼山麓、正对亚历山大的右翼。原第 8 场旁白写「波斯重骑兵在沿海**左翼**强渡河流」把波斯翼向写反，已改为「沿海右翼」。' }, time: { level: 'fact', text: '英文维基百科 Battle of Issus 信息框：公元前333年11月5日，季节取秋。' }, place: { level: 'fact', text: '英文维基百科 Battle of Issus：伊苏斯城以南的皮纳鲁斯河，今土耳其哈塔伊省；坐标取信息框 36.7525,36.1923。海湾到群山之间仅2.6公里。' }, attacker: { level: 'fact', text: '英文维基百科 Battle of Issus：马其顿与希腊同盟，亚历山大亲统右翼伙伴骑兵，帕曼纽统左翼。' }, attackerTroops: { level: 'fact', text: '英文维基百科 Battle of Issus 信息框：马其顿军团共约37000人。' }, attackerLegion: { level: 'fact', text: '同格拉尼库斯河战役：马其顿军团，前骑兵、中方阵、后远程，鱼鳞阵；此役亚历山大仍亲率伙伴骑兵为决胜一击。' }, defender: { level: 'fact', text: '英文维基百科 Battle of Issus：阿契美尼德帝国，大流士三世亲征。' }, defenderTroops: { level: 'fact', text: '英文维基百科 Battle of Issus 信息框：现代估计5万至10万，中值75000；主人定守方不超过攻方2倍，37000×2=74000，在区间内，取74000。' }, defenderLegion: { level: 'fact', text: '英文维基百科 Military of the Achaemenid Empire：职业常备军统称 spāda，后世通称阿契美尼德军团。英文维基百科 Battle of Issus：骑兵约1.8万、长生军与希腊雇佣兵及亚美尼亚步兵约6万、轻步兵3万至8万；波斯骑兵率先渡河冲击，故前骑兵中步兵后远程，鹤翼阵2-4-3。' }, route: { level: 'fact', text: '英文维基百科 Alexander the Great 与 Battle of the Granicus：格拉尼库斯战后亚历山大南下，经萨迪斯、以弗所、米利都，公元前334年秋冬围哈利卡纳苏斯，其后北上弗里吉亚；公元前333年春在戈尔迪乌姆斩断戈尔迪之结，东至安库拉，再南下经卡帕多西亚、过托罗斯山即奇里乞亚门入奇里乞亚，驻军塔尔苏斯，得知大流士在巴比伦集结大军后南下，于伊苏斯迎战。游戏路线：出发地＝上一处战场（哈利卡纳苏斯），不写出发据点（军团此刻就在那座城里，写了就是瞬移）；途经 戈尔迪乌姆 → 安卡拉即古安库拉 → 伊科尼乌姆 → 阿达纳即塔尔苏斯附近 → 伊苏斯（以弗所那一段属格拉尼库斯～米利都两场，本场自哈利卡纳苏斯出发不再绕回以弗所）。🔴 [2026-09-25 复测] 两处缺口**都已修**：① 阿达纳→伊苏斯战场 原 226 公里／2.74 倍（安提俄基亚-阿达纳那条路朝西南绕），接入「⚔伊苏斯-阿达纳」支线后 **67 公里／0.82 倍**、末段离路 0 ✓。② 哈利卡纳苏斯→戈尔迪乌姆 原 **952 公里／1.93 倍** ✗ —— 路网带军团先回米利都、以弗所再北上，等于把前两场走过的海岸线倒着走一遍；按史料补绘「哈利卡纳苏斯-戈尔迪乌姆（经吕基亚、潘菲利亚海岸、凯莱奈）」后 **744 公里／直线 492 公里＝1.51 倍** ✓，走线 哈利卡纳苏斯 → 马尔马里斯 → 费特希耶 → 卡什 → 米拉 → 佩尔格 → 阿斯彭多斯 → 萨加拉索斯 → 凯莱奈（今迪纳尔）→ 阿菲永 → 戈尔迪乌姆，正是阿里安 I.24–29 记的那条「沿吕基亚—潘菲利亚海岸东行、再经皮西迪亚北上」的道。本场红 0。' }, result: { level: 'fact', text: '英文维基百科 Battle of Issus：马其顿胜，大流士弃军逃走，母亲、妻子、两个女儿被俘；伊苏斯是战场，无据点易主。阿里安《亚历山大远征记》II.11：伊苏斯战后亚历山大派帕曼纽南下，取大马士革、夺得波斯王室与总督寄存的战金，大马士革归马其顿。' }, briefing: { level: 'fact', text: '英文维基百科 Battle of Issus：海湾到群山仅2.6公里即两英里；大流士绕到马其顿军团后方占领伊苏斯、砍去伤病员之手；马其顿军团约3.7万，波斯军按中值7.5万，播报写三万七千、七万五千；方阵居中、亚历山大率伙伴骑兵在右翼。' } },
        // 伊苏斯战后：帕曼纽奉命南下取大马士革，夺得波斯王室与总督寄存的战金（阿里安 II.11）
        cityUpdates: [{ cityId: 'city_damasikusi', factionId: 'maqidun' }],
    },

    // ═══════════════════════════════════════════════════════════════
    // 前 332 年 · 亚历山大剧本**第三段**：推罗战役（Tyro，公元前332年1月–7/8月）
    // ═══════════════════════════════════════════════════════════════
    // 史料（主人给定）：马其顿陆军 35000–40000；中后期联合塞浦路斯与倒戈腓尼基舰队共约
    //   220–224 艘战船封锁推罗南北两港；城内正规守军 8000–10000、战船约 80 艘、避难军民 3–4 万。
    //   亚历山大拆推罗陆城、伐黎巴嫩雪松筑近 1 公里跨海长堤（宽约 60 m），以改装攻城舰撞城槌
    //   配合步兵突击攻破南墙；城破后 6000–8000 守军阵亡、约 3 万平民被贩为奴，海岛因填堤淤积**永久成半岛**。
    // 🔴 这一章走的是**剧本攻城通道**（`type: 'siege'`，2026-09-12 主人令「写呀，不写怎么继续？」）：
    //    与野战同一条路，只有终点不同 —— 走完 `marchWaypoints` 后**奔目标城**，抵达城下即交给
    //    引擎现成的 `SiegeManager.startSiegeWithArmy`（AI 攻城与野战战后链在用的同一个入口）。
    {
        year: -332,
        season: 0,                                   // 春（史料：1 月起围城，历约 7 个月至夏末）
        type: 'siege',
        title: '公元前332年 推罗战役',
        battleBriefing: '面对孤悬海岛、城堞巍峨的推罗坚城，亚历山大筑造长堤直通海岛，推罗人则出动火船撞毁攻城塔。亚历山大随即集结数百战舰封锁港口，将巨型攻城槌架设于双体战船之上，从海面持续轰击南侧城墙。随着海墙被轰出一道创口，持盾卫队军官阿德梅托斯率先率登城小队从吊桥跳上城头，亚历山大紧随登城小队踏入缺口，登城勇士与推罗守军在狭窄的城墙塔楼上展开血战。',
        description: '马其顿军团全面彻底的胜利：亚历山大费时数月强行填筑跨海长堤，攻破推罗海岛坚固石墙；拔除波斯在地中海的海军基地，推罗城易主归马其顿。',
        siegeData: {
            title: '推罗战役',                     // 🔴 横幅一律显示战役名
            battleBriefing: '面对孤悬海岛、城堞巍峨的推罗坚城，亚历山大筑造长堤直通海岛，推罗人则出动火船撞毁攻城塔。亚历山大随即集结数百战舰封锁港口，将巨型攻城槌架设于双体战船之上，从海面持续轰击南侧城墙。随着海墙被轰出一道创口，持盾卫队军官阿德梅托斯率先率登城小队从吊桥跳上城头，亚历山大紧随登城小队踏入缺口，登城勇士与推罗守军在狭窄的城墙塔楼上展开血战。',
            description: '亚历山大率数万步骑大军填海筑堤直逼海岛石墙，攻破推罗要塞；推罗国王阿泽米尔库斯率守军力战，推罗陷落。',
            marchWaypoints: ['city_latajiya'],   // 🔴 [2026-09-25 主人令「同步游戏，同步编辑器」] 段 3-1 途经点为「比布鲁斯、西顿」（库里无此二据点），改用沿海现成据点拉塔基亚作路标：自阿达纳沿腓尼基海岸南下
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerLegionName: '马其顿军团',   // 剧本军团：亚历山大所率马其顿军团，整场东征同一支
            attackerTroops: 37500,                   // 史料 35000–40000 步骑
            // 🔴 [2026-09-23 主人报「船队不对呀」同源问题] 攻方出兵据点原写佩拉（马其顿本土）——前332年亚历山大在腓尼基海岸。
            // 🔴 [2026-09-24 主人「历史上哪年有了哪个据点，就显示哪个据点」] 后改的拉塔基亚（古劳迪西亚）约前300年塞琉古才建，
            //    前332年还不存在 → 改阿达纳：离伊苏斯战场最近、那一年已有的城（与默认出发地同一判据）。
            attackerSourceCityId: 'city_adana',
            // 🔴 [2026-09-19 主人令「一个战场一个防守方的武将一个势力一个精锐」] 守方势力显式写明：

            //    推罗末代国王阿泽米尔库斯 = 迦南（推罗）。此前这条没写势力，按势力取精锐番号就取不到。

            defenderFactionId: 'kanan',

            defenderGeneralId: 'kanan_azemier',      // 推罗末代国王阿泽米尔库斯
            defenderTroops: 9000,                   // 史料守军约 8,000–10,000
            result: 'attacker_win',                  // 写真历史：攻城彻底胜利
            autoEnterRTS: true,                      // 进战术模式（13）
            defenderLegionName: '推罗军团',
            defenderCityId: 'city_tuile',
        },
        generalId: 'gen_alexander_great',
        // 赶路播报：攻城战没有战场记录，播报存在事件本身（原在战场表 bf_tuile 上，已随战场记录移除）
        briefing: '皮纳鲁斯河岸的厮杀刚停，大军便掉头沿腓尼基海岸南下，专收波斯舰队的母港：阿拉多斯与比布鲁斯开门，西顿交出港湾。前332年春，远征军兵临推罗，守军闭门不纳；没有舰队，只能往海里填出一条路。',
        commanderUnit: 'hero_mounted_alexander',   // 主将队：素材样貌为骑马的亚历山大
        sources: { battle: { level: 'fact', text: '英文维基百科 Siege of Tyre (332 BC)：推罗围城战，攻城战；马其顿军团填海筑堤攻打海岛城邦推罗。' }, time: { level: 'fact', text: '英文维基百科 Siege of Tyre：公元前332年1月起围，历约七个月至夏末；季节取春。' }, place: { level: 'fact', text: '英文维基百科 Siege of Tyre (332 BC)：推罗为今黎巴嫩海岸外约一千米的海岛城邦；本场是攻城战，地点就是被攻据点「推罗」（city_tuile），坐标 33.2709,35.1962。' }, attacker: { level: 'fact', text: '英文维基百科 Siege of Tyre：马其顿与希腊同盟，亚历山大亲统。' }, attackerTroops: { level: 'popular', text: '英文维基百科 Siege of Tyre (332 BC) 信息框只给舰队（马其顿 120 艘）、未给陆军兵数；英文维基百科 Alexander the Great 记伊苏斯战后马其顿军团约 35,000–40,000 人，据此沿用 37500 —— 可信级别：通行说法（**不是信息框值**）。' }, attackerLegion: { level: 'fact', text: '同格拉尼库斯河战役：马其顿军团，前伙伴骑兵、中方阵步兵、后克里特弓箭手，鱼鳞阵 3-4-2。' }, defender: { level: 'fact', text: '英文维基百科 Siege of Tyre：推罗城邦（腓尼基/迦南），末代国王阿泽米尔库斯；时属阿契美尼德波斯治下。' }, defenderTroops: { level: 'popular', text: '英文维基百科 Siege of Tyre (332 BC) 信息框只给舰队（推罗 80 艘）、未给守军兵数；守军 8,000–10,000 一说取自通行叙述，取 9000；另有避难军民 3–4 万（非战斗人员，不计入）。信息框 casualties2 记阵亡 6,000–7,000、钉死 2,000（阿里安 II.24.4），与守军量级相合 —— 可信级别：通行说法（**不是信息框值**）。' }, defenderLegion: { level: 'fact', text: '英文维基百科 Siege of Tyre 与阿里安《亚历山大远征记》：推罗守军以步兵守城为主，城头弩炮与弓手据墙射击，骑兵最少（腓尼基海岛城邦不产骑兵）；三排 前远程3 / 中步兵4 / 后骑兵2，取鱼鳞阵，落成剧本军团「推罗军团」。' }, route: { level: 'fact', text: '英文维基百科 Alexander the Great 与 Siege of Tyre (332 BC)：公元前333年11月伊苏斯战役后，亚历山大沿海岸南下腓尼基，阿拉多斯、比布鲁斯以次归附，经西顿（推罗以北约40公里）于公元前332年1月自北面进围推罗。游戏路线：自上一处战场（伊苏斯）直接开拔，沿海岸大道南下抵推罗 —— 本场不写出发据点、不设航点（出发地按「同一武将上一场打完的地方」取，那一年还不存在的城不当落脚点）。阿卡在推罗以南39公里、属反方向，不作航点；项目没有西顿、比布鲁斯据点，按铁律用附近已有据点连接、绝不新建。' }, result: { level: 'fact', text: '英文维基百科 Siege of Tyre：马其顿胜；城破后守军阵亡约 6,000–8,000，平民多被贩为奴；推罗易主归马其顿，跨海长堤淤积使海岛此后永久成为半岛。' }, briefing: { level: 'fact', text: '英文维基百科 Siege of Tyre：跨海长堤宽约六十米、城距大陆近千米、推罗战船约八十艘、城破守军阵亡约 6,000–8,000。播报里兵力只写「数万」「数千」，不写确数。' } },
        foeCommanderUnit: 'hero_brasidas',
        // 出发据点不写：剧本期连续行军从伊苏斯战场直接开拔；玩家不在军中时，默认在上一场打完处附近那一年已有的城（阿达纳）
        absentCities: ['city_ake'],
        cityUpdates: [{ cityId: 'city_tuile', factionId: 'maqidun' }],
    },
    // ═══════════════════════════════════════════════════════════════
    // 前 331 年秋 · 亚历山大决战波斯：高加米拉战役（Battle of Gaugamela，前331年10月）
    // ═══════════════════════════════════════════════════════════════
    // ── 由战场事件编辑器生成（/battlefield-editor.html）──
    {
        year: -332,
        season: 2,
        generalId: 'gen_alexander_great',
        sources: { battle: { level: 'fact', text: '英文维基百科 Siege of Gaza (332 BC)：亚历山大东征中的攻城战，公元前332年马其顿军团攻取加沙要塞。' }, time: { level: 'fact', text: '英文维基百科 Siege of Gaza (332 BC)：公元前332年10月破城（围城历时约两月；日文维基作三个月，从英文）。季节取秋。' }, place: { level: 'fact', text: '英文维基百科 Siege of Gaza (332 BC)：加沙要塞踞于高地、距海约五英里，控扼叙利亚通往埃及的大道，城墙高逾十八米；坐标取本据点记录 31.5017,34.4668。' }, attacker: { level: 'fact', text: '英文维基百科 Siege of Gaza (332 BC)：马其顿军团，亚历山大亲统。' }, attackerTroops: { level: 'fact', text: '英文维基百科 Siege of Gaza (332 BC) 信息框 strength1 = 45,000（含自推罗调来的攻城部队）。' }, attackerLegion: { level: 'fact', text: '同东征诸役：马其顿军团，前伙伴骑兵、中方阵步兵、后克里特弓箭手，鱼鳞阵 3-4-2。' }, defender: { level: 'fact', text: '英文维基百科 Siege of Gaza (332 BC)：要塞守将巴提斯（Batis），时属阿契美尼德波斯治下，拒不投降。' }, defenderTroops: { level: 'fact', text: '英文维基百科 Siege of Gaza (332 BC) 信息框 strength2 = 15,000（出处 Engels 1980《Alexander the Great and the Logistics of the Macedonian Army》第 54–70 页）；同条 casualties2 记加沙方面阵亡 11,000，量级相合。兵数取信息框值，不定为城陷伤亡数。' }, defenderLegion: { level: 'fact', text: '英文维基百科 Siege of Gaza (332 BC)：守方为波斯守军与阿拉伯雇佣兵（本据点精锐番号即「加沙雇佣兵」），凭高墙、土山与弩炮据守；番号取「波斯驻军团」（🔴 [2026-10-02 主人令] 新立的第四层军团 = 城防守军：前远程3 / 中步兵4 / 后骑兵2，鱼鳞 3-4-2）——巴提斯所部是**要塞守军**（波斯守军＋阿拉伯雇佣兵），不是大流士亲统的主力野战军。' }, route: { level: 'fact', text: '英文维基百科 Siege of Gaza (332 BC) 与 Siege of Tyre (332 BC)：亚历山大公元前332年夏取推罗后率军南下进围加沙，并把推罗用过的攻城器械一并运来破其高墙（承前一场）。游戏路线：自上一处战场（推罗）直接开拔南下抵加沙，路网取道阿音贾鲁特—耶路撒冷—加沙，273 公里（直线 208）。战后：自加沙南下埃及（佩鲁西姆—孟菲斯—亚历山大城），孟菲斯归马其顿、亚历山大在孟菲斯加冕为法老（本场 cityUpdates 已写）；公元前331年回师，军团自加沙开拔北上（见下一场路标）。' }, result: { level: 'fact', text: '英文维基百科 Siege of Gaza (332 BC)：马其顿胜。城破后男丁被杀、妇孺贩为奴，加沙方面阵亡约一万；巴提斯拒不投降，按库尔提乌斯所记被拖于战车之后处死；加沙入马其顿之手。英文维基百科 Alexander the Great 与 Siege of Gaza (332 BC)：加沙既下，通往埃及的门户打开，亚历山大随即进军埃及，波斯埃及总督马扎克斯不战而降，孟菲斯归马其顿，他并在孟菲斯加冕为法老。故本场「战后归属」按历史写两处易主：加沙、孟菲斯。' }, briefing: { level: 'fact', text: '英文维基百科 Siege of Gaza (332 BC)：加沙踞高地、城墙高逾十八米，马其顿军团筑土山、调推罗攻城器械破墙；守军曾出击烧器械，亚历山大在反击中肩部受伤。英文维基百科 Alexander the Great：加沙既下亚历山大进军埃及，马扎克斯不战而降。文案按主人规矩不写兵力确数。' } },
        commanderUnit: 'hero_mounted_alexander',
        foeCommanderUnit: 'hero_aristides',
        type: 'siege',
        title: '公元前332年 加沙战役',
        battleBriefing: '加沙要塞踞于高耸的沙丘之上，守将巴提斯严防死守。亚历山大下令运来推罗的重型攻城器械，并动用全军土石筑起环绕全城的巨大土坡，将投石机抬升至与城墙平齐高度。加沙守军多次出城突袭火烧器械，亚历山大战中肩部被弩箭贯穿仍带伤指挥；随着攻城槌轰塌局部墙体，马其顿士兵架起云梯登城，双方在坍塌的沙土城墙上方展开激烈绞杀。',
        description: '马其顿军团取加沙：亚历山大调来推罗用过的攻城器械，破加沙的高地坚城，接连强攻后入城；守将巴提斯拒不投降被处死，加沙易主，通往埃及的门户就此打开。',
        siegeData: {
            title: '加沙战役',
            battleBriefing: '加沙要塞踞于高耸的沙丘之上，守将巴提斯严防死守。亚历山大下令运来推罗的重型攻城器械，并动用全军土石筑起环绕全城的巨大土坡，将投石机抬升至与城墙平齐高度。加沙守军多次出城突袭火烧器械，亚历山大战中肩部被弩箭贯穿仍带伤指挥；随着攻城槌轰塌局部墙体，马其顿士兵架起云梯登城，双方在坍塌的沙土城墙上方展开激烈绞杀。',
            description: '巴提斯凭高地坚城与阿拉伯雇佣兵死守；马其顿军团筑土山、架推罗器械破墙，接连强攻后破城。',
            marchWaypoints: [],   // 🔴 [2026-09-30 主人定隐藏阿卡] 推罗直达加沙 214 km，中途不点名阿卡
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 45000,                   // 英文维基 Siege of Gaza (332 BC) 信息框 strength1 = 45,000
            attackerSourceCityId: 'city_tuile',
            attackerLegionName: '马其顿军团',
            defenderGeneralId: 'feilisidin_batisi',
            defenderTroops: 15000,                   // 信息框 strength2 = 15,000（Engels 1980《Alexander the Great and the Logistics of the Macedonian Army》）
            defenderCityId: 'city_jiasa',
            // 🔴 [2026-10-02 主人令] 城防守军改用新立的第四层军团「波斯驻军团」（巴提斯所部＝波斯守军＋阿拉伯雇佣兵）
            defenderLegionName: '波斯驻军团',
            result: 'attacker_win',
            autoEnterRTS: true,
        },
        // 🔴 [2026-09-27/09-30 主人定「阿卡没用不要显示了。而且离推罗太近了」] 隐藏阿卡，仅方式②显示灰色名字
        absentCities: ['city_ake'],
        cityUpdates: [{ cityId: 'city_jiasa', factionId: 'maqidun' }, { cityId: 'city_mengfeisi', factionId: 'maqidun' }],
        briefing: '海岸上最后一座不肯开门的城是加沙。巴提斯据高地要塞，扼住往埃及的大道，闭门不纳。',
    },
    {
        year: -331,
        season: 2,                                   // 秋（史料：前331年10月1日）
        type: 'field_battle',
        title: '公元前331年 高加米拉战役',
        battleBriefing: '高加米拉广袤的平原上，波斯的镰刀战车呼啸着冲向马其顿阵线，被阿格里安轻步兵用标枪与乱箭纷纷截住分散。亚历山大指挥全军向右侧斜向漂移，吸引波斯左翼骑兵跟进拉扯，导致波斯中军阵线撕裂出一道巨大的裂口。亚历山大抓住这瞬息即逝的战机，率领伙伴骑兵组成庞大的楔形尖峰，与近卫步兵一道直刺波斯中军的核心，双方主力在战场中央爆发了全线激烈的碰撞。',
        description: '马其顿决定性胜利：大流士三世在平野布下镰刀战车与两翼骑兵，亚历山大以方阵居中牵制、亲率伙伴骑兵自右翼撕开缺口，直扑大流士本阵；大流士弃阵东逃，美索不达米亚与波斯半壁就此易主。',
        fieldBattleData: {
            title: '高加米拉战役',
            battleBriefing: '高加米拉广袤的平原上，波斯的镰刀战车呼啸着冲向马其顿阵线，被阿格里安轻步兵用标枪与乱箭纷纷截住分散。亚历山大指挥全军向右侧斜向漂移，吸引波斯左翼骑兵跟进拉扯，导致波斯中军阵线撕裂出一道巨大的裂口。亚历山大抓住这瞬息即逝的战机，率领伙伴骑兵组成庞大的楔形尖峰，与近卫步兵一道直刺波斯中军的核心，双方主力在战场中央爆发了全线激烈的碰撞。',
            description: '大流士以镰刀战车与两翼骑兵猛攻，帕曼纽左翼死守；亚历山大率伙伴骑兵自右翼插入缺口，直取大流士本阵，波斯全军崩溃。',
            // 摩苏尔以东广阔平原（北纬 36°21'46", 东经 43°15'00"）
            location: { lat: 36.56, lng: 43.444 },
            // 🔴 [2026-09-23 主人报「船队不对呀」：马其顿军团沿叙利亚海岸坐船] 英文维基 Battle of Gaugamela：
            //    前331年晚春或初夏自埃及出发，向东北穿过叙利亚，七八月至幼发拉底河塔普萨库斯，九月下旬至底格里斯河。
            //    路标取沿途已有据点：加沙（前332年加沙围城）、阿卡（推罗已是战场，取其近旁）、大马士革、
            //    塔普萨库斯（前331年7月渡幼发拉底，阿里安 III.7）、尼西比斯、尼尼微，全程陆路。
            //    🔴 [2026-10-02 主人定案改走阿勒颇] 实测沿路网走的是 推罗→阿勒颇（468km）→塔普萨库斯（149km）→埃德萨→尼西比斯→尼尼微，全程陆路且避开叙利亚大漠。
            marchWaypoints: ['city_peiluximu', 'city_mengfeisi', 'city_yalishanda', 'city_matelugang', 'city_xiwa', 'city_baihaliye', 'city_mengfeisi', 'city_peiluximu', 'city_jiasa', 'city_tuile', 'city_alepo', 'city_tapusakusi', 'city_nixibisi', 'city_niniwei'],   // 段3-3：加沙→佩鲁西姆→孟菲斯→亚历山大→马特鲁→锡瓦→拜哈里耶（东归穿黑白沙漠，363 km）→回孟菲斯（333 km）（阿里安 III.3-4）；段4-1：回程经佩鲁西姆→加沙→推罗→阿勒颇→塔普萨库斯（渡幼发拉底，III.7）→尼西比斯→尼尼微→高加米拉

            // ── 攻方：马其顿与希腊联军 亚历山大 ──
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerLegionName: '马其顿军团',   // 剧本军团：亚历山大所率马其顿军团，整场东征同一支
            attackerTroops: 47000,                   // 史料 47,000 人（约 40,000 步兵 + 7,000 骑兵）
            attackerSourceCityId: 'city_jiasa',

            // ── 守方：波斯阿契美尼德帝国大军 大流士三世 ──
            defenderFactionId: 'aqimeinide',
            defenderGeneralId: 'daliushi_iii',
            defenderTroops: 94000,                   // 信息框 strength2 = 现代估计 50,000–250,000；中值 150,000 超「守方 ≤ 攻方×2」(47000×2=94000)，取区间内最近的 94000
            defenderSourceCityId: 'city_bosibolisi',

            result: 'attacker_win',                  // 写真历史：马其顿决定性胜利
            autoEnterRTS: true,                      // 进战术模式（13）
            defenderLegionName: '阿契美尼德军团',
        },
        // 🔴 [2026-09-24 主人定「野战后，根据历史，据点也要有归属问题」] 高加米拉战后按史实易主的据点：
        //    英文维基百科 Battle of the Uxian Defile 背景节：亚历山大进抵巴比伦，总督马扎欧斯献城，
        //    休整数日并设为第二基地；自巴比伦走二十日至波斯冬都苏萨。美索不达米亚与苏锡安那两城归马其顿。
        cityUpdates: [{ cityId: 'city_babilun', factionId: 'maqidun' }, { cityId: 'city_susa', factionId: 'maqidun' }],
        absentCities: ['city_ake'],
        generalId: 'gen_alexander_great',
        // 🔴 [2026-09-24 主人怒斥「怎么从加沙到的孟菲斯？？？还史料如此？」] 出兵据点＝**军团此刻在哪**：
        //    上一场（前332年秋加沙围城）打完，军团就停在加沙；原来写孟菲斯（理由「史料：自埃及出发」）＝
        //    把军团从加沙白送 358 公里到孟菲斯，属瞬移。埃及那一节本来就在路标里（佩鲁西姆→孟菲斯→亚历山大城→佩鲁西姆→加沙），军团走过去。
        commanderUnit: 'hero_mounted_alexander',   // 主将队：素材样貌为骑马的亚历山大
        sources: { battle: { level: 'fact', text: '英文/中文维基百科 Battle of Gaugamela（高加米拉战役）：公元前331年马其顿与阿契美尼德波斯的决战，野战。' }, time: { level: 'fact', text: '维基百科高加米拉战役信息框：公元前331年10月1日，季节取秋。' }, place: { level: 'fact', text: '维基百科高加米拉战役信息框：战场可能在今伊拉克库尔德斯坦艾比尔附近的提尔·高美尔（Tel Gomel）周遭，坐标 36.56,43.444。' }, attacker: { level: 'fact', text: '维基百科高加米拉战役：马其顿王国与泛希腊同盟，亚历山大亲统，帕曼纽、菲罗塔斯、克拉特鲁斯、佩尔狄卡斯等分领各部。' }, attackerTroops: { level: 'fact', text: '维基百科高加米拉战役信息框：40,000 名步兵 + 7,000 名骑兵 = 47,000（Green 2013）。' }, attackerLegion: { level: 'fact', text: '维基百科高加米拉战役「Initial dispositions」：马其顿方阵居中双列推进，亚历山大率伙伴骑兵自右翼突破，帕曼纽率色萨利与色雷斯骑兵守左翼，克里特与希腊雇佣兵在右中；编成仍取马其顿军团（前伙伴骑兵、中方阵步兵、后克里特弓箭手，鱼鳞阵 3-4-2）。' }, defender: { level: 'fact', text: '维基百科高加米拉战役：阿契美尼德帝国，大流士三世亲统；贝苏斯领左翼（巴克特里亚、斯基泰等），马扎欧斯领右翼（叙利亚、米底、美索不达米亚等）。' }, defenderTroops: { level: 'fact', text: '维基百科高加米拉战役信息框 strength2 = 现代估计 50,000–250,000（Brill\'s Companion to Military Defeat，2017，第 78 页；古史作 250,000–1,000,000）。区间中值 150,000 超出主人定的「守方 ≤ 攻方×2」（47,000×2 = 94,000），故取区间内最近的 94,000。' }, defenderLegion: { level: 'fact', text: '维基百科高加米拉战役「Initial dispositions」：大流士居中率精锐步兵（「苹果持兵」/希腊人所称长生军）与马尔迪亚弓手，两翼为各地骑兵，阵前布镰刀战车，另有十五头印度战象（战中未见出动、后在营中被缴，推为撤走）；编成取剧本军团「阿契美尼德军团」（同一支波斯军，与伊苏斯、格拉尼库斯同一番号）。' }, route: { level: 'fact', text: '维基百科 Battle of Gaugamela 与 Siege of Gaza (332 BC)：加沙战后亚历山大南下埃及，波斯埃及总督马扎克斯不战而降（埃及无战事）；公元前331年在孟菲斯受冕为法老，并于尼罗河口建亚历山大城，随后西行锡瓦求阿蒙神谕，再回师北上推罗，经叙利亚北渡幼发拉底，东进至高加米拉。游戏路线：自上一处战场（加沙）开拔 → 佩鲁西姆 → 孟菲斯 → 亚历山大城 → 加沙 → 推罗 → 阿勒颇 → 塔普萨库斯（渡幼发拉底）→ 埃德萨 → 尼西比斯 → 尼尼微 → 高加米拉。（原数据写「自孟菲斯出发」＝把军团白送过去，已改为走出去。）' }, result: { level: 'fact', text: '维基百科高加米拉战役：马其顿决定性胜利。大流士弃阵东逃，波斯帝国半壁江山与巴比伦在内的美索不达米亚全境入亚历山大之手；阿契美尼德方面伤亡据库尔提乌斯约四万，马其顿方面伤亡极轻（阿里安记百名步兵、千名骑兵）。战后巴比伦总督马扎欧斯献城、波斯冬都苏萨随后亦入马其顿之手（英文维基百科 Battle of the Uxian Defile 背景节），故本场据点归属写巴比伦与苏萨归马其顿。' }, briefing: { level: 'fact', text: '维基百科高加米拉战役：大流士为之铲平战场植被以便镰刀战车驰突，并布十五头印度战象（战中撤回）；马其顿方阵居中推进、两翼后斜，亚历山大率伙伴骑兵绕至右翼缺口直扑大流士本阵。文案按主人规矩不写兵力确数。' } },
        foeCommanderUnit: 'hero_tsarkonstantin',   // 🔴 [2026-10-02 主人令「换」] 阿契美尼德军团主将队改用 hero_tsarkonstantin（双马具装车驾：大流士三世在伊苏斯、高加米拉皆乘战车督战）
    },

    // ── 由战场事件编辑器生成（/battlefield-editor.html）──
    {
        year: -331,
        season: 3,
        generalId: 'gen_alexander_great',
        sources: { battle: { level: 'fact', text: '英文维基百科 Battle of the Uxian Defile：乌克西亚隘口之战，马其顿军团对扎格罗斯山乌克西亚部落的野战，战场在苏萨以东的山道。' }, time: { level: 'fact', text: '英文维基百科 Battle of the Uxian Defile 信息框 date = 331 BC；该条目背景节记亚历山大取巴比伦、休整数日，再走二十日至苏萨，自苏萨向山地隘口进军；日文维基百科同条目记此役为公元前331年12月，故季节取冬。' }, place: { level: 'inferred', text: '英文维基百科 Battle of the Uxian Defile 信息框 location = East of Susa，coordinates 32°11′26″N 48°15′2″E；🔴 该坐标与苏萨城条目的 32°11′26″N 48°15′28″E 仅差约 0.7 公里，即信息框标的其实就是苏萨城本身，与同一条目正文「East of Susa」「战斗发生在苏萨与波斯波利斯之间的山脉」自相矛盾。英文维基百科 Uxians 条目、日文维基百科与波斯文维基百科均未给隘口坐标。故按主人定口径「查不到用知名度最大的说法，再没有按史地合理推定」：以正文为准，取苏萨以东约六十公里、去波斯波利斯大道上进入扎格罗斯山的第一处山口，坐标 32.0457,48.8506，取自该大道在路网上的实际走线，战场正落在道上。可信级别：合理推定。' }, attacker: { level: 'fact', text: '英文维基百科 Battle of the Uxian Defile：马其顿与科林斯同盟，亚历山大亲统；战斗中克拉特鲁斯率盾卫占据高地，亚历山大自率其余将士走北路。' }, attackerTroops: { level: 'fact', text: '英文维基百科 Battle of the Uxian Defile 信息框 strength1 = 8,000 infantry，攻方兵力取 8000。' }, attackerLegion: { level: 'fact', text: '同格拉尼库斯、伊苏斯、推罗、加沙、高加米拉五场：马其顿军团，前伙伴骑兵、中方阵步兵、后克里特弓箭手，鱼鳞阵 3-4-2；同一支军队整场战争不换。' }, defender: { level: 'fact', text: '英文维基百科 Battle of the Uxian Defile 信息框 combatant2 = Uxians，commander2 = Madates；英文维基百科 Uxians：乌克西亚人为扎格罗斯山中非伊朗裔半游牧部落联盟，分平原定居与山地游牧两支，平原一支降、山地一支索要买路钱，由马达泰斯统领。' }, defenderTroops: { level: 'inferred', text: '英文维基百科 Battle of the Uxian Defile 信息框 strength2 = Unknown，该条目与英文维基百科 Uxians 均未给守方兵数；波斯文维基无对应条目可补。按史地合理推定：乌克西亚为半游牧部落联盟，既能向历代波斯诸王索取过路贡、又以险隘伏击马其顿全军，部众当以千计而不下数千，取 5000。可信级别：合理推定。' }, defenderLegion: { level: 'fact', text: '英文维基百科 Uxians：该部落联盟以放牧羊群与劫掠为生，被 Nearchus 列为西南四大掠夺民族之一；Battle of the Uxian Defile 记其据山隘设伏、退往高地后被合围。🔴 史料只记其弓矢与山地袭扰，**从不记载乌克西亚骑兵**（阿里安《远征记》记其战败后岁贡「马百匹、牛五百头、羊三万只」，马只占贡赋牲畜极小一份，且是战败赔纳之物，不是战力）；故编成不排骑兵排，取前远程、中步兵、后远程（第二线弓手），雁行阵 4-3-2，落成剧本军团「乌克西亚军团」。' }, route: { level: 'fact', text: '英文维基百科 Battle of the Uxian Defile 背景节：高加米拉战后亚历山大进抵巴比伦，总督马扎欧斯献城，休整数日并设为第二基地；自巴比伦走二十日至冬都苏萨，自苏萨向山地隘口进军。游戏路线：自上一处战场（高加米拉）开拔 → 尼尼微 → 亚述城 → 巴比伦 → 苏萨 → 乌克西亚隘口；苏萨以东一段按主人 2026-09-24 新建的巴比伦—苏萨道路与苏萨—波斯波利斯大道走，编辑器实测各段绕远不超过 1.32 倍。⚠️ 尼尼微与前 612 年被毁的亚述城在当年已属废墟，只作路网途经点使用，本场播报不再提这两座城。' }, result: { level: 'fact', text: '英文维基百科 Battle of the Uxian Defile：马其顿胜，部落战士被四面合围后遭歼灭，幸存者求和，议定年贡 100 匹马、500 头牛、3 万只羊；英文维基百科 Uxians：此后乌克西亚人一度重获独立，大流士三世之母西绪甘比斯曾出面交涉释放以马达泰斯为首的乌克西亚俘虏。本场为野战，不涉据点易主。' }, briefing: { level: 'fact', text: '英文维基百科 Battle of the Uxian Defile 与 Uxians：亚历山大因巴比伦城墙高厚、墙内农田足以久守而唯恐波斯人据城重整，结果马扎欧斯献城并留任总督；取苏萨得金甚多，并送金回马其顿供安提帕特对斯巴达作战；乌克西亚人半游牧、靠放牧劫掠为生并向过境军队索费。文案按主人规矩不写兵力确数。' } },
        commanderUnit: 'hero_mounted_alexander',
        foeCommanderUnit: 'hero_artaphernes',
        type: 'field_battle',
        title: '公元前331年 乌克西亚隘口战役',
        battleBriefing: '面对占据峡谷要道强索过路财物的乌克西亚山民，亚历山大在夜幕掩护下亲率持盾卫队与轻步兵，攀登北侧陡峭山路绕至敌军后方营落。次日清晨，马其顿突袭部队突然从山顶俯冲而下袭击乌克西亚人的大本营，迫使敌军惊慌失措地向峡谷奔逃，而克拉特鲁斯早已率领精兵堵截在隘口高处，山谷上下的伏击部队同时发起围攻。',
        description: '马其顿军团获胜：亚历山大以分兵之策破了乌克西亚隘口。克拉特鲁斯先据高地断乌克西亚人的退路，亚历山大亲率精锐走北路袭取部落村落，再以接连强行军夺下隘口；乌克西亚人退往高地，正撞上守候已久的方阵，被四面合围。此战之后，通往波斯腹地的山道尽开，幸存者乞和，议定年贡马匹、牛羊。本场为野战，不涉据点易主。',
        fieldBattleData: {
            title: '乌克西亚隘口战役',
            battleBriefing: '面对占据峡谷要道强索过路财物的乌克西亚山民，亚历山大在夜幕掩护下亲率持盾卫队与轻步兵，攀登北侧陡峭山路绕至敌军后方营落。次日清晨，马其顿突袭部队突然从山顶俯冲而下袭击乌克西亚人的大本营，迫使敌军惊慌失措地向峡谷奔逃，而克拉特鲁斯早已率领精兵堵截在隘口高处，山谷上下的伏击部队同时发起围攻。',
            description: '公元前331年冬，扎格罗斯山脉东缘的乌克西亚隘口。乌克西亚人自恃险隘，向来往军队索取买路钱，认定马其顿人也会照波斯旧例纳贡，故只在山口静候。亚历山大应下纳贡之约，却选在约定之日分兵：克拉特鲁斯率盾卫抢占高地，堵死部落战士的退路；亚历山大自率精锐走北路，强袭乌克西亚人的村落，随后以接连强行军夺取隘口。部落战士退向高地，正撞上守候已久的马其顿方阵，被四面合围后歼灭。',
            location: { lat: 32.0457, lng: 48.8506 },
            marchWaypoints: ['city_aerbeila', 'city_bageda', 'city_babilun', 'city_susa'],   // 段4-2（底本 R31–R35）：高加米拉战场 → 阿尔贝拉（收波斯辎重，81 km）→ 巴格达（沿底格里斯河南下经亚述城废墟与萨迈拉，414 km；这一站就是古俄皮斯/西蒂斯平原，只作路网途经点，那年图上不显示、播报也不念这个名字）→ 巴比伦（88 km，受降休整）→ 苏萨（皇家大道 480 km）→ 乌克西亚隘口（102 km）（阿里安 III.15-17）
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 8000,
            attackerSourceCityId: 'city_niniwei',   // 出兵据点＝军团此刻在哪：上一场高加米拉战场，按 §三.1 取那年离战场最近且已存在的据点＝尼尼微（34 公里）；巴比伦是沿途路标
            attackerLegionName: '马其顿军团',
            defenderFactionId: 'wukexiya',
            defenderGeneralId: 'wukexiya_madates',
            defenderTroops: 5000,
            defenderLegionName: '乌克西亚军团',
            result: 'attacker_win',
            autoEnterRTS: true,
        },
    },
    // ── 由战场事件编辑器生成（/battlefield-editor.html）──
    {
        year: -330,
        // 🔴 [2026-09-25 主人指出「实际上它发生在年初」] 波斯门之战在**前330年1月**
        //    英文维基 Battle of the Persian Gate 信息框 date = 330 BC、正文记一月，属该年**年初**；
        //    游戏一年四季按春夏秋冬排、冬在年末，原写 season: 3（冬）会被算到前330年**年底**，
        //    与上一场乌克西亚隘口（前331年冬）之间凭空隔出整整一年。
        //    故本场记**春**（season 0）＝前330年年初 —— 与前332年推罗同一处理（推罗 1 月起围城，同样记春）。
        //    文案按史实写「前330年1月」，不写季节。
        season: 0,
        generalId: 'gen_alexander_great',
        sources: { battle: { level: 'fact', text: '英文维基百科 Battle of the Persian Gate：波斯门战役，公元前330年冬马其顿军团与阿契美尼德波斯军在波斯门隘口的野战，隘口最窄处只容数人并行。' }, time: { level: 'fact', text: '英文维基百科 Battle of the Persian Gate：公元前330年冬，阿里奥巴赞斯据隘口抵挡马其顿军团约一个月；条目信息框 date = 330 BC。波斯文维基百科 نبرد دربند پارس 亦记此役在公元前330年。🔴 日历口径：游戏一年只有春夏秋冬四季、冬季排在年末，而本役在公元前330年**1月**属该年年初，故数据记春（season 0），使它落在公元前330年年初、紧接公元前331年冬的乌克西亚隘口之后；文案按史实写「公元前330年1月」。' }, place: { level: 'fact', text: '英文维基百科 Battle of the Persian Gate 信息框 location = Persian Gate, near Persepolis，coordinates 30°42′30″N 51°35′55″E，即今伊朗法尔斯省波斯波利斯西北的扎格罗斯山口；按主人定口径坐标取信息框值 30.7083,51.5986。波斯文维基百科 نبرد دربند پارس 记战场在**今贝赫贝汉附近**，属当地语种说法，一并记录以备核对。' }, attacker: { level: 'fact', text: '英文维基百科 Battle of the Persian Gate：马其顿与科林斯同盟，亚历山大亲统；攻隘受挫后亲率精兵夜间翻山绕至守军背后，托勒密与佩尔狄卡斯分路合围，克拉特鲁斯留守营中牵制。' }, attackerTroops: { level: 'fact', text: '英文维基百科 Battle of the Persian Gate 信息框 strength1 = 17,000 picked fighters，攻方兵力取 17000；正文另记阿里安称面对的马其顿军团逾一万人。' }, attackerLegion: { level: 'fact', text: '同东征前五场与乌克西亚隘口：马其顿军团，前伙伴骑兵、中方阵步兵、后克里特弓箭手，鱼鳞阵 3-4-2；同一支军队整场战争不换。' }, defender: { level: 'fact', text: '英文维基百科 Battle of the Persian Gate 信息框 combatant2 = Achaemenid Empire，commander2 = Ariobarzanes of Persis 与 Youtab，两人皆记阵亡；阿里奥巴赞斯受命阻止马其顿军团进入波斯本土。' }, defenderTroops: { level: 'fact', text: '英文维基百科 Battle of the Persian Gate 信息框 strength2 列两说：阿里安记 40,000 步兵与 700 骑兵；现代估计 700–2,000，Encyclopædia Iranica 认为至多 2,000，但同处说明多数现代史家仍照阿里安、库尔提乌斯与狄奥多罗斯取值。按主人定 1:2（守方不超过攻方 2 倍）：17000 × 2 = 34000，取 34000。波斯文维基百科 نبرد دربند پارس 记阿里奥巴赞斯所部为 700 步兵与 40 骑兵，一并记录。' }, defenderLegion: { level: 'fact', text: '英文维基百科 Battle of the Persian Gate：守军据石垒居高临下，北坡滚石、南坡弓矢。守方军团取剧本军团「波斯驻军团」（🔴 [2026-10-02 主人令] 新立的第四层军团 = 城防／要塞守军：前远程3 / 中步兵4 / 后骑兵2，鱼鳞 3-4-2）。阿里奥巴赞斯据石垒的守军是**隘口守军**（居高临下、滚石与弓矢），不是大流士亲统的主力野战军（阿契美尼德军团），故拆开。' }, route: { level: 'fact', text: '英文维基百科 Battle of the Persian Gate 背景节：取苏萨后亚历山大分兵，帕曼纽率一半人马沿御道东进，亚历山大自取通往波斯本土的山路；沿途先平乌克西亚人，再入波斯门，入隘时未派斥候而中伏。游戏路线：自上一处战场（乌克西亚隘口，苏萨以东约六十公里）继续沿苏萨—波斯波利斯大道东南行，入扎格罗斯山至波斯门。🔴 [2026-09-25 主人授权画路后已修] 原来路网没有「苏萨—波斯门—波斯波利斯」这条道：寻路只在据点入路，而隘口一百五十一公里内没有据点，编辑器实测这一段沿路 905 公里、直线 300 公里 = 3.01 倍，末段还要离路直行 151 公里 ✗✗ —— 先退回苏萨、再一路开到波斯波利斯，然后折回 151 公里才到波斯门。已按史料补绘这条路（端点苏萨↔波斯波利斯，8 个点，线形穿过隘口坐标 30.7083,51.5986）。复测本场：沿路 402 公里 = 1.34 倍，末段离路 0 公里，提示 0 项 ✓。' }, result: { level: 'fact', text: '英文维基百科 Battle of the Persian Gate：马其顿突破隘口。阿里奥巴赞斯据险死守近一月，其部尽没；他本人或战死于最后的冲锋，或北逃后向亚历山大归降；另有史家记其退至波斯波利斯，城门被守库贵族提里达特斯关闭，遂在城外被歼。战后亚历山大任命弗拉索尔特斯继其位，进占波斯波利斯并取其府库，波斯波利斯由此归马其顿（故本场据点归属写波斯波利斯易主）；公元前330年5月焚波斯波利斯王宫。' }, briefing: { level: 'fact', text: '英文维基百科 Battle of the Persian Gate 与波斯文维基百科 نبرد دربند پارس：隘口最窄处只容数人并行，波斯军自北坡投石、南坡射箭；波斯文维基记一名当地牧羊人或农夫为亚历山大指路绕行，阿里奥巴赞斯与数名骑兵脱逃。文案按主人规矩不写兵力确数。' } },
        commanderUnit: 'hero_mounted_alexander',
        foeCommanderUnit: 'hero_artaphernes',
        type: 'field_battle',
        title: '公元前330年 波斯门战役',
        battleBriefing: '扎格罗斯山脉雪深路滑的波斯门隘口内，波斯总督阿里奥巴赞斯居高临下滚落巨石、投掷矢石，将进入狭谷的马其顿前锋死死压制。亚历山大留下克拉特鲁斯在正面扎营伪装，自己则在战俘与当地牧羊人指引下，率精兵深夜冒着严寒冰雪，沿着悬崖峭壁上的羊肠险径攀爬绕后。拂晓时分，号角声在波斯阵地后方高地陡然吹响，前后两路马其顿军团向峡谷内的波斯防线发动夹击，双方在积雪覆盖的狭窄隘口内展开绝地搏杀。',
        description: '马其顿军团获胜：亚历山大强攻波斯门受挫、全军被压在窄道中伤亡惨重，弃尸而退；后来得俘虏或当地牧羊人引路，亚历山大亲率精兵趁夜翻山绕至守军背后，托勒密与佩尔狄卡斯分路合围，克拉特鲁斯在营中牵制，终于突破隘口。阿里奥巴赞斯据险死守许久，此战被视为亚历山大东征中最凶险的一关；战后通往波斯波利斯的最后一道屏障扫清，波斯波利斯归马其顿。',
        fieldBattleData: {
            title: '波斯门战役',
            battleBriefing: '扎格罗斯山脉雪深路滑的波斯门隘口内，波斯总督阿里奥巴赞斯居高临下滚落巨石、投掷矢石，将进入狭谷的马其顿前锋死死压制。亚历山大留下克拉特鲁斯在正面扎营伪装，自己则在战俘与当地牧羊人指引下，率精兵深夜冒着严寒冰雪，沿着悬崖峭壁上的羊肠险径攀爬绕后。拂晓时分，号角声在波斯阵地后方高地陡然吹响，前后两路马其顿军团向峡谷内的波斯防线发动夹击，双方在积雪覆盖的狭窄隘口内展开绝地搏杀。',
            description: '公元前330年1月，扎格罗斯山脉的波斯门隘口。这条山口最窄处只容数人并行，北坡巨石、南坡箭雨，波斯总督阿里奥巴赞斯据垒扼守。马其顿军团初次深入窄道便被压在当中，前军退不出、后军还在涌入，成队被砸死射死，亚历山大被迫弃下阵亡者才撤回全军。此后阿里奥巴赞斯坚守许久，直到俘虏或当地牧羊人把绕到波斯军背后的山路指给了亚历山大：亚历山大亲率精兵夜间翻山，摸上隘口守军的头顶，托勒密与佩尔狄卡斯分路合围，克拉特鲁斯留营牵制。波斯军前后受敌，隘口终被突破。',
            location: { lat: 30.7083, lng: 51.5986 },
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 17000,
            attackerSourceCityId: 'city_susa',
            attackerLegionName: '马其顿军团',
            defenderFactionId: 'aqimeinide',
            defenderGeneralId: 'aqimeinide_aertabazanuosi',
            defenderTroops: 34000,
            defenderSourceCityId: 'city_bosibolisi',
            // 🔴 [2026-10-02 主人令] 隘口守军改用新立的第四层军团「波斯驻军团」（阿里奥巴赞斯据石垒的守军，非大流士主力野战军）
            defenderLegionName: '波斯驻军团',
            result: 'attacker_win',
            autoEnterRTS: true,
        },
        // 🔴 [2026-09-24 主人定「野战后，根据历史，据点也要有归属问题」] 波斯门战后按史实易主的据点：
        //    英文维基百科 Battle of the Persian Gate：突破隘口后亚历山大进占波斯波利斯并取其府库，波斯波利斯归马其顿。
        cityUpdates: [{ cityId: 'city_bosibolisi', factionId: 'maqidun' }],
    },
    // ═══════════════════════════════════════════════════════════════
    // 前 329 年夏 · 追亡逐北 · 中亚：居鲁士城围攻（Siege of Cyropolis）
    //    🔴 [2026-09-25 主人令「把缺少的战役加上」] 英文维基有独立条目 → A 档，年份落在第 9 场（前330年1月 波斯门）
    //    与第 10 场（前329 秋 锡尔河）之间；数据按年份自动排序，故本场插在这里，第 10 场的出发地随之改为本场落点。
    //    B 档并入背景：前330 全年追击大流士、米底—里海门—赫尔卡尼亚—阿里亚—德兰吉亚那—阿拉霍西亚行军、
    //    加兹尼过冬、越兴都库什取巴克特拉、贝苏斯被绑送处死 —— 都写进本场播报。
    // ═══════════════════════════════════════════════════════════════
    {
        year: -329,
        season: 1,                                   // 夏（英文维基 Siege of Cyropolis 信息框 date = 329 BC；Chronology 条目记 7 月）
        generalId: 'gen_alexander_great',
        sources: {
            battle: { level: 'fact', text: '英文维基百科 Siege of Cyropolis：公元前329年亚历山大攻取粟特七座城寨中最大最坚的居鲁士城，马其顿胜。该役有独立条目，故本场单列成场。' },
            time: { level: 'fact', text: '英文维基百科 Siege of Cyropolis 信息框 date = 329 BC；同站 Chronology of the expedition of Alexander the Great into Asia 记该役在 7 月，故季节取夏。' },
            place: { level: 'inferred', text: '该条目信息框给坐标 40.2833,69.6333，那正是库里「忽毡」所在地（相距约 4 公里，且忽毡在前329 过不了年代闸门：其锚定武将帖木儿灭里属城堡时代）；同站 Chronology 条目另记 Cyropolis = Uroteppa（今塔吉克斯坦伊斯塔拉夫尚 39.91,69.00），本场据点取后者 —— 合理推定。本场是攻城战，地点就是被攻据点「居鲁士城」。' },
            attacker: { level: 'fact', text: '英文维基百科 Siege of Cyropolis 信息框 commander1 = 亚历山大（注明 WIA 负伤）与克拉特鲁斯（亦注明 WIA）；同条目记亚历山大先遣克拉特鲁斯围城，本人亲至城下并从干涸水道入城。' },
            attackerTroops: { level: 'fact', text: '英文维基百科 Siege of Cyropolis 信息框 strength1 = 10,000，取 10000。' },
            attackerLegion: { level: 'fact', text: '同东征诸役：马其顿军团（前伙伴骑兵、中方阵步兵、后克里特弓箭手，鱼鳞阵 3-4-2，整场战争不换）。此役据同条目：以弩炮轰城，命一队人自干涸水道潜入城内、开城门放入大军。' },
            defender: { level: 'fact', text: '阿里安《远征记》4.1.5：粟特反抗亚历山大的四大起义领军统帅之一卡塔涅斯（Catanes），主持药杀水南北要塞防务；此役居鲁士城守军约一万五千人据城死守。' },
            defenderTroops: { level: 'fact', text: '英文维基百科 Siege of Cyropolis 信息框 strength2 = 15,000；同条目另记阿里安称守军约一万五千、第一阶段阵亡八千；守方 15000 ≤ 攻方×2。' },
            defenderLegion: { level: 'inferred', text: '守方即粟特人，故取剧本军团「粟特军团」（前327 索格狄亚那岩那支，同一支军队整场战争不换）—— 合理推定。' },
            route: { level: 'inferred', text: '自上一场落点波斯门战场最近且那一年已存在的据点波斯波利斯开拔，按英文维基 Chronology 条目所记这一年的行军设路标：埃克巴坦那（哈马丹）→ 拉盖（雷伊）→ 里海门（达姆甘一带）→ 苏西亚（图斯）→ 阿里亚／德兰吉亚那（泰巴德、法拉）→ 阿拉霍西亚（坎大哈）→ 加兹尼 → 喀布尔 → 巴克特拉（蓝氏城）→ 马拉坎达（撒马尔罕）→ 居鲁士城 —— 合理推定。' },
            result: { level: 'fact', text: '英文维基百科 Siege of Cyropolis 信息框 result = Macedonian victory、territory = Cyropolis captured by Macedon；同条目记约八千人阵亡、余众退入内堡断水一天后投降；故本场据点归属写居鲁士城归马其顿。' },
            briefing: { level: 'fact', text: '阿里安《远征记》III.26 与库尔提乌斯 VI.11：前330 年秋大军进至德兰吉亚那的普拉达（今法拉），查出骑兵主将菲罗塔斯参与谋逆，依法处死后又遣快骑赴米底处死其父帕曼纽。播报所据史事：英文维基百科 Chronology 与 Battle of Jaxartes —— 大流士之死、北上米底取埃克巴坦那、出里海门入赫尔卡尼亚、东行阿里亚／德兰吉亚那／阿拉霍西亚、加兹尼过冬、越兴都库什取巴克特拉、贝苏斯被部下绑送处死（其弑君后逃回巴克特里亚、自立为波斯国王一节见阿里安《远征记》III.25 与库尔提乌斯 V.9–13，第 41 路播报据此写明大军为何继续东进）；文案按主人规矩不写兵力确数。' },
        },
        commanderUnit: 'hero_mounted_alexander',   // 主将队：素材样貌为骑马的亚历山大
        // 对手主将队：🔴 [2026-10-02 主人令「换」→这 4 支，样貌符合历史就行]
        //    粟特武装以甲胄骑兵为招牌 —— 取 hero_kotyankhan（英雄·忽炭汗）：人马皆甲的具装骑领主，
        //    与守方中排那支「粟特甲胄骑兵高级」同一路样式（原来借的色雷斯酋长是披风持剑的巴尔干样、不同源）。
        foeCommanderUnit: 'hero_kotyankhan',   // 🔴 [2026-10-02 主人令「换」→这 4 支，样貌符合历史就行] 场14 居鲁士城·粟特军团 主帅阿里马泽斯/粟特甲骑领主
        type: 'siege',
        title: '公元前329年 亚历山大东征居鲁士城战役',
        battleBriefing: '面对粟特前线极为坚固的居鲁士城，克拉特鲁斯在城外用攻城槌和投石机持续轰击牵制守军注意力。亚历山大敏锐注意到一条贯穿城墙下方的干涸引水暗渠，亲自率领一队精兵猫腰潜入暗道，摸进城内强行撬开城门。城内粟特守军发现后蜂拥杀来，抛掷巨石打伤亚历山大的头颈，马其顿城外大军此时已顺着敞开的城门涌入城内，双方在城门广场与干涸水道口爆发血腥肉搏。',
        description: '公元前329年夏，亚历山大自波斯腹地东来，先拔掉这一带大半城寨，快得守军来不及相互救援；剩下的以居鲁士城最大最坚。亚历山大命克拉特鲁斯先围居鲁士城，掘壕立栅、架上攻城器械，使守军不敢分兵去救别处。随后亚历山大亲至城下，以弩炮轰击城墙。',
        siegeData: {
            title: '居鲁士城战役',
            battleBriefing: '面对粟特前线极为坚固的居鲁士城，克拉特鲁斯在城外用攻城槌和投石机持续轰击牵制守军注意力。亚历山大敏锐注意到一条贯穿城墙下方的干涸引水暗渠，亲自率领一队精兵猫腰潜入暗道，摸进城内强行撬开城门。城内粟特守军发现后蜂拥杀来，抛掷巨石打伤亚历山大的头颈，马其顿城外大军此时已顺着敞开的城门涌入城内，双方在城门广场与干涸水道口爆发血腥肉搏。',
            description: '攻城器械把城墙砸得摇摇欲坠时，亚历山大命一队人从那道干涸的水道钻进城里，亚历山大也在这一队人里；进城后这队人打开城门，放进大军。守军见城已破，回身拼死反扑：一块石头砸在亚历山大头颈上，克拉特鲁斯被一箭射伤。守军终被击退，大半死于城破之时；余众退入城中内堡，断水之后投降。',
            // 出发地＝军团此刻在哪：上一场（波斯门野战）落点最近且那一年已存在的据点 ＝ 波斯波利斯
            // 史料：按 Chronology 条目所记这一年的行军设路标（米底 → 里海门 → 赫尔卡尼亚 → 图斯 → 阿里亚/德兰吉亚那
            //       → 阿拉霍西亚 → 加兹尼 → 喀布尔 → 巴克特拉 → 马拉坎达）→ 居鲁士城
            // 🔴 [2026-09-25 主人令「重新整理 5-1 段的行军路线」]
            //    按主人给的 35 站走廊重排：波斯波利斯 → 伊斯法罕 → 哈马丹 → 雷伊 → 里海门 → 达姆甘
            //    → 白哈格（萨卜泽瓦尔）→ 尼沙布尔 → 图斯 → 泰巴德 → 赫拉特 → 法拉 → 博斯特（格里什克）
            //    → 坎大哈 → 哥疾宁（加兹尼）→ 高附（喀布尔）→ 蓝氏城 → 撒马尔罕 →（居鲁士城）。🔴 [2026-10-02 主人令] 必须途径「比斯塔姆」：兹拉卡塔 ➜ 比斯塔姆 为主人新画直连翻山路（176km），出山口即比斯塔姆，再沿呼罗珊大道直达白哈格（245km，合计421km）；若漏掉比斯塔姆，寻路器会贪图省18km而强行原路倒退回达姆甘（干达母）折返跑，故必须锁定比斯塔姆途经点；② 坎大哈 → 喀布尔 之间补入「哥疾宁」：两城直线 458 公里 > 400 上限，而底本实测那条路本来就经哥疾宁（拆开后两腿都在闸内，全程 481 公里不变）；③ 段14 现 15 路、5117 公里。
            //    比原版多出 里海门 / 白哈格 / 赫拉特 / 博斯特 四站（原版漏了里海门天险与阿利亚首府赫拉特）。
            //    ⚠️ 主人走廊里的 德拉普萨卡（昆都士）暂**未**写入：路网里喀布尔往北那道兴都库什山路（萨朗/哈瓦克）尚未连通，
            //       实测 喀布尔 → 德拉普萨卡 沿路 664 公里、2.7 倍（直线只 244），军团会被绕到蓝氏城再折回来 —— 等那条路连好再插回。
            marchWaypoints: ['city_yisifahan', 'city_hamadan', 'city_leiyi', 'city_lihaimen', 'city_damugan', 'city_zilakata', 'city_bistam', 'city_baihage', 'city_nishabuer', 'city_tusi', 'city_taibade', 'city_helate_city', 'city_fala', 'city_kandaha', 'city_jiaseni', 'city_gaofu', 'city_lanshi', 'city_samaerhan', 'city_jizhake'],
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 10000,
            attackerSourceCityId: 'city_bosibolisi',
            attackerLegionName: '马其顿军团',
            defenderGeneralId: 'julushi_catanes',
            defenderTroops: 15000,
            defenderCityId: 'city_julushicheng',
            defenderLegionName: '粟特军团',
            result: 'attacker_win',
            autoEnterRTS: true,
        },
        // 🔴 攻城战必须写被攻据点的易主（§铁律 3）：居鲁士城归马其顿
        cityUpdates: [{ cityId: 'city_julushicheng', factionId: 'maqidun' }],
        briefing: '山口已开，大军循山径下到普尔瓦尔河边，架桥渡过，一路直下波斯波利斯。\n\n【波斯波利斯】波斯波利斯的宫殿与府库都交了出来，大军住了下来。开春放火烧了宫殿，拔营北上，沿皇家驿道顶风冒雪疾行，经伊斯法罕往米底的埃克巴坦那去——大流士正在那边收拢残部。\n\n【伊斯法罕】自伊斯法罕北进，沿山间走廊疾行，过古尔帕耶甘补水，直上米底高原。\n\n【古尔帕耶甘】穿过崇山，大军抵米底重镇埃克巴坦那。大流士已带亲军东去，城里只剩府库。亚历山大遣散愿回乡的希腊同盟兵，把波斯波利斯运来的金银封存城中卫城，交给帕曼纽坐镇看守，随后亲率轻骑与近卫昼夜追赶。\n\n【哈马丹】轻骑连日疾驰抵拉盖，前锋报：大流士已越过里海门往东去了。亚历山大令全军歇几日、补足干粮水袋，再沿厄尔布尔士山麓追下去。\n\n【雷伊】穿过里海门进入赫尔卡尼亚，传来消息：巴克特里亚总督贝苏斯已对波斯国王大流士下手。亚历山大命人收殓遗体送回波斯波利斯安葬，随后翻厄尔布尔士密林，抵里海边的兹拉卡塔扎营。\n\n【兹拉卡塔】贝苏斯逃回巴克特里亚自立为王，亚历山大决意追讨弑君者：在兹拉卡塔整军东进，翻过比斯塔姆的高山隘口，横穿呼罗珊的干旱荒原，经白哈格驿道日夜疾行。帕提亚与赫尔卡尼亚各部首领接连来投，大军直扑呼罗珊重镇图斯。\n\n【白哈格】沿水草渐丰的山前大道开进，大军进驻呼罗珊枢纽图斯。当地总督来投，就地整队备战东进。\n\n【图斯】自图斯东南入阿里亚，总督萨提巴赞尼斯先出迎，待大军前出便断了后路。亚历山大回师奔袭阿塔考纳，萨提巴赞尼斯弃城而走。大军就地筑城设防，即阿里亚的亚历山大城。\n\n【赫拉特】南下穿德兰吉亚那沙漠，进驻普罗夫塔西亚。在此查出骑兵主将菲罗塔斯谋逆，依法处死，并遣快骑赴埃克巴坦那处置帕曼纽。\n\n【法拉】大军沿赫尔曼德河与阿尔甘达卜河谷东进，深入阿拉霍西亚。沿途风沙酷热，叛部被逐一清剿，大军在要冲筑起亚历山大城。全军在此休整，准备翻越兴都库什山去追贝苏斯。\n\n【坎大哈】前329年严冬，大军自阿拉霍西亚的亚历山大城逆流而上，钻进兴都库什的峡谷。天寒雪深，粮运不继，人马冻馁难行，沿途尽是光秃的雪岭。队伍翻过雪线，在谷地筑起高加索的亚历山大城做越山大营。\n\n【喀布尔】春暖雪融，主力强翻卡瓦克山口，骤然出现在巴克特里亚平原。贝苏斯烧了粮草退往乌浒水以北；前锋长驱直入，占下首府德拉普萨卡，进驻蓝氏城。亚历山大在蓝氏城整军，准备南渡乌浒水擒拿贝苏斯。\n\n【蓝氏城】大军用塞满干草的皮帐渡过水急流深的乌浒水，进入粟特。贝苏斯的部将斯皮塔米尼斯把贝苏斯押来献上，亚历山大命托勒密押解示众。大军继续直入粟特名城马拉坎达。\n\n【撒马尔罕】东北行穿山间隘口，直逼药杀水畔的居鲁士城。北疆诸部已反，此城是粟特诸城寨中最大最坚的一座，非拔不可。',
    },

    // ── 由战场事件编辑器生成（/battlefield-editor.html）──

    {

        year: -329,
        season: 2,
        generalId: 'gen_alexander_great',
        sources: { battle: { level: 'fact', text: '英文维基百科 Battle of Jaxartes：公元前329年亚历山大与塞种（Saka）在药杀水（今锡尔河）的野战，马其顿胜；中文维基百科「亚历山大三世」同记其渡河北击草原游牧。' }, time: { level: 'fact', text: '英文维基百科 Battle of Jaxartes 信息框 date = 329 BC；同条目战役地图标注「Battle of Jaxartes October 329 BC」，故季节取秋。' }, place: { level: 'fact', text: '英文维基百科 Battle of Jaxartes 信息框 coordinates 40°17′00″N 69°37′00″E、location = Syr Darya（今锡尔河，战场跨乌兹别克、塔吉克、吉尔吉斯、哈萨克边境，在古塔什干西南、苦盏东北）；本战场记录取 40.2833,69.6167。' }, attacker: { level: 'fact', text: '英文维基百科 Battle of Jaxartes 信息框 combatant1 = Macedonia、League of Corinth，commander1 = Alexander the Great —— 亚历山大亲统。' }, attackerTroops: { level: 'fact', text: '英文维基百科 Battle of Jaxartes 信息框 strength1 = 6,000，攻方兵力取 6000；同信息框伤亡记马其顿阵亡 160、伤 1,000。' }, attackerLegion: { level: 'fact', text: '同东征诸役：马其顿军团（前伙伴骑兵、中方阵步兵、后克里特弓箭手，鱼鳞阵 3-4-2，整场战争不换）。此役据英文维基正文：塞种低估马其顿「artillery、fleet、cavalry、infantry」的协同，亚历山大令全军**同时齐渡**、以砲兵与弓箭手掩护，渡后以弓箭手与骑兵击破塞种包围（Dani & Bernard 1994：crossed the river and broke through the encircling Sakas with the help of his archers and cavalry）。' }, defender: { level: 'fact', text: '英文维基百科 Battle of Jaxartes 信息框 combatant2 = Saka（塞种/萨迦）、commander2 = Satraces（萨特拉克斯）；正文记约 1,200 名塞种被围歼、**含其主帅 Satraces**，另俘 150 人、缴马 1,800。' }, defenderTroops: { level: 'inferred', text: '英文维基百科 Battle of Jaxartes 信息框 strength2 = Unknown，条目与中文维基均未给塞种兵数。据其阵亡约 1,200（含主帅）、被俘 150、缴马 1,800，其众当以千计；取 6,000（并守守方 ≤ 攻方×2 = 12,000）—— 合理推定。' }, defenderLegion: { level: 'fact', text: '英文维基百科 Battle of Jaxartes：塞种据药杀水北岸，自信可在马其顿半渡登陆时取胜，以骑射手为主要打击手段。编成取剧本军团「斯基泰军团」：前骑兵=斯基泰骑射手 4、中步兵=塞种萨迦斧兵 3、后远程=巴克特里亚弓手 2，雁行 4-3-2（同一支军队整场战争不换）。' }, route: { level: 'fact', text: '英文维基百科 Battle of Jaxartes 背景节（引 Dani & Bernard 1994）：亚历山大先据马拉坎达（撒马尔罕，粟特王夏都），因忧药杀水以北的塞种而北进，过居鲁士城沿途取七座要塞，抵阿契美尼德疆界药杀水，遂渡河破围。游戏路线（2026-09-25 补录居鲁士城之后）：自上一场落点居鲁士城开拔 → 忽毡（亚历山大·埃斯哈塔，前329 建于苦盏）→ 锡尔河战场（末段 5 公里），全程陆路：波斯波利斯 → 亚兹德 → 伊斯法罕 → 雷伊 → 达姆甘 → 尼沙布尔 → 图斯 → 萨拉赫斯 → 木鹿 → 阿母城（乌浒水渡口） → 布哈拉 → 撒马尔罕（马拉坎达） → 忽毡（居鲁士城）→ 锡尔河战场；编辑器「行军路线实测」已跑。' }, result: { level: 'fact', text: '英文维基百科 Battle of Jaxartes 信息框 result = Macedonian victory。塞种约 1,200 阵亡（含主帅 Satraces）、150 被俘、1,800 匹马被缴；马其顿阵亡 160、伤 1,000。战后亚历山大在河南岸筑城（亚历山大·埃斯哈塔，今苦盏一带）以定北疆，故本场「战后归属」按历史写忽毡归马其顿。' }, briefing: { level: 'fact', text: '英文维基百科 Battle of Jaxartes 正文：塞种占北岸，自信能在马其顿登陆时将其击败，却低估了马其顿砲兵、舰队、骑兵与步兵的协同；亚历山大令全军同时齐渡，使对岸骑射手面对更多目标，随后以弓箭手与骑兵破其包围，约 1,200 塞种被围歼、含主帅。文案按主人规矩不写兵力确数。' } },
        commanderUnit: 'hero_mounted_alexander',
        // 对手主将队：🔴 [2026-10-02 主人令「换」→这 4 支，样貌符合历史就行]
        //    （2026-09-24 曾从「速不台」改到「色雷斯酋长」；本轮改按**样貌**定）
        //    塞种是草原游牧骑射民族 —— 取 hero_kushluk（英雄·屈出律）：皮裘 + 大弓 + 草原坐骑，
        //    库里唯一一副「弓骑首领」的样子。
        foeCommanderUnit: 'hero_kushluk',   // 🔴 [2026-10-02 主人令「换」→这 4 支，样貌符合历史就行] 场15 锡尔河·斯基泰军团 塞种骑射首领
        type: 'field_battle',
        title: '公元前329年 亚历山大东征锡尔河战役',
        battleBriefing: '面对停留在药杀水北岸不断射箭挑衅的塞种游牧骑兵，亚历山大首次将城防弩炮与投石机架设于渡船上，向对岸倾泻重型巨矢掩护部队乘坐皮筏强渡。渡河后，亚历山大故意派出一支骑枪骑兵深入诱敌，引诱习惯游击围射的塞种骑兵包围这支孤军；随后马其顿轻骑兵、弓箭手与长矛方阵从两侧迅速张开包围网，将机动游牧骑兵死死合拢在内圈，双方在河岸平原上展开密集的骑射与长矛混战。',
        description: '公元前329年秋，亚历山大平定中亚诸行省，挥师进抵药杀水畔。北方斯基泰游牧骑兵隔河陈兵挑衅，嘲弄马其顿大军不敢涉足草原。亚历山大命军团以投石机与弩炮密集齐射压制对岸，全军乘皮筏强行渡河，与草原骑兵在旷野展开决战。',
        fieldBattleData: {
            title: '锡尔河战役',
            battleBriefing: '面对停留在药杀水北岸不断射箭挑衅的塞种游牧骑兵，亚历山大首次将城防弩炮与投石机架设于渡船上，向对岸倾泻重型巨矢掩护部队乘坐皮筏强渡。渡河后，亚历山大故意派出一支骑枪骑兵深入诱敌，引诱习惯游击围射的塞种骑兵包围这支孤军；随后马其顿轻骑兵、弓箭手与长矛方阵从两侧迅速张开包围网，将机动游牧骑兵死死合拢在内圈，双方在河岸平原上展开密集的骑射与长矛混战。',
            description: '药杀水畔，马其顿弩炮破空齐射，射穿斯基泰前锋重铠，游牧阵型大乱。亚历山大亲率近卫骑兵与轻骑兵突入敌阵，以步骑协同之法两翼包夹，破解斯基泰回旋奔射之术。斯基泰主帅萨特拉克斯力战阵亡，游牧大军溃散北遁，帝国东北疆界自此底定。',
            location: { lat: 40.2833, lng: 69.6167 },
            marchWaypoints: ['city_huzhan'],
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 6000,
            // 🔴 [2026-09-25 补录居鲁士城之后改链] 军团此刻在上一场落点＝居鲁士城（前329 夏），故本场自居鲁士城开拔；
            //    路标只留忽毡（亚历山大·埃斯哈塔，前329 建于苦盏），战场就在忽毡以南 5 公里处。
            attackerSourceCityId: 'city_julushicheng',
            attackerLegionName: '马其顿军团',
            defenderFactionId: 'sijitai',
            defenderGeneralId: 'sijitai_satraces',
            defenderTroops: 6000,
            defenderSourceCityId: 'city_huzhan',
            defenderLegionName: '斯基泰军团',
            result: 'attacker_win',
            autoEnterRTS: true,
        },
        cityUpdates: [{ cityId: 'city_huzhan', factionId: 'maqidun' }],
    },
    // ═══════════════════════════════════════════════════════════════
    // 前 327 年早春 · 平定索格狄亚那：索格狄亚那岩（Siege of the Sogdian Rock，327 BC）
    // ═══════════════════════════════════════════════════════════════
    {
        year: -327,
        season: 0,                                   // 春（英文维基：captured in the early spring of 327 BC）
        generalId: 'gen_alexander_great',
        sources: {
            battle: { level: 'fact', text: '英文维基百科 Siege of the Sogdian Rock：公元前327年早春马其顿军团攻取索格狄亚那岩（又名阿里马泽斯之岩，Rock of Ariamazes）的攻城战，属亚历山大征服阿契美尼德帝国过程中的一役。' },
            time: { level: 'fact', text: '英文维基百科 Siege of the Sogdian Rock：条目正文记 captured in the early spring of 327 BC，信息框 date = 327 BC。故季节取春。' },
            place: { level: 'inferred', text: '英文维基百科 Siege of the Sogdian Rock 正文第一句写 near Samarkand，信息框却给 40.4N,69.4E（忽毡旁），两处自相矛盾；阿里安《远征记》卷四 18–19 记此岩在诺塔卡（今沙赫里萨布兹）冬营附近、巴克特里亚与粟特交界的山区；学术公认在撒马尔罕以南的吉萨尔山脉 / 铁门关 / 拜孙山区（乌兹别克斯坦考古学院）。坐标取拜孙一带 38.21,67.02 —— 合理推定。🔴 [2026-09-30 血训 #11] 旧坐标 40.4,69.4 机械照搬维基信息框野指标，导致岩堡错位 300 公里到北疆忽毡旁、18 个月真实转战被抹杀，已修正。' },
            attacker: { level: 'fact', text: '英文维基百科 Siege of the Sogdian Rock 信息框 combatant1 = Macedon、League of Corinth，commander1 = Alexander the Great —— 亚历山大亲统。' },
            attackerTroops: { level: 'fact', text: '英文维基百科 Siege of the Sogdian Rock 信息框 strength1 = 300；同信息框 casualties1 = 30，正与正文「夜间攀崖时摔死三十人」相合，可见该 300 即那支夜攀队，故攻方兵力取 300。' },
            attackerLegion: { level: 'fact', text: '同东征诸役：马其顿军团（前伙伴骑兵、中方阵步兵、后克里特弓箭手，鱼鳞阵 3-4-2，整场战争不换）。此役据英文维基正文：亚历山大悬重赏募人攀崖，三百人夜间徒手攀上绝壁，摔死三十人。' },
            defender: { level: 'fact', text: '英文维基百科 Siege of the Sogdian Rock 信息框 combatant2 = Sogdiana，commander2 = Arimazes；本场守方主帅取阿里马泽斯，同条目记该岩堡为他所据。' },
            defenderTroops: { level: 'inferred', text: '英文维基百科 Siege of the Sogdian Rock 信息框 strength2 = Unknown，正文亦未给岩堡守军兵数。按 §一.2 守方 ≤ 攻方×2 与「查不到按史地合理推定」：岩堡守军以据险为本，取 600 —— 合理推定。' },
            defenderLegion: { level: 'fact', text: '英文维基百科 Siege of the Sogdian Rock 与 Sogdia：守方为粟特，凭绝壁据守，主帅阿里马泽斯；同条目记守军在山顶出现马其顿人之后即降。编成取剧本军团「粟特军团」：前骑兵=粟特甲胄骑兵 3、中步兵=塞种萨迦斧兵 4、后远程=巴克特里亚弓手 2，鱼鳞 3-4-2（同一支军队整场战争不换）。' },
            route: { level: 'fact', text: '阿里安《远征记》卷四 1–18：前329年秋锡尔河战后亚历山大筑最远亚历山大城（忽毡），随即因斯皮塔米尼斯叛乱围攻马拉坎达（撒马尔罕）而率军南下解围；此后一年余在粟特与大夏之间拉锯平叛；前328年12月部将科伊诺斯在加拜之战击溃斯皮塔米尼斯（为马萨革泰人所杀送首）；前328/327年冬亚历山大全军在诺塔卡（今沙赫里萨布兹）冬营大休整；前327年早春从诺塔卡冬营开拔南下，直取吉萨尔山脉中的索格狄亚那岩。游戏路线：自上一场落点忽毡开拔 → 居鲁士城 → 吉扎克 → 撒马尔罕（马拉坎达）→ 诺塔卡（前328/327冬营大营）→ 索格狄亚那岩。🔴 [2026-09-30 血训 #11 修路线] 旧路线从忽毡直达 35 公里外的假岩堡，抹杀了 18 个月真实转战。' },
            result: { level: 'fact', text: '英文维基百科 Siege of the Sogdian Rock 信息框 result = Macedonian victory，territory = Alexander captures Sogdiana；正文记守军不战而降，故本场据点归属写索格狄亚那岩归马其顿。同条目另记岩上俘虏中有奥克夏特斯之女罗克珊娜，亚历山大后来娶其为妻。' },
            briefing: { level: 'fact', text: '播报所据史事：英文维基百科 Spitamenes —— 公元前328年12月加拜之战科伊诺斯破斯皮塔米尼斯，斯皮塔米尼斯为马萨革泰首领所杀、首级送亚历山大；英文维基百科 Siege of the Sogdian Rock —— 公元前327年早春取岩堡，夜攀者摔死三十人，守军见旗而降。文案按主人规矩不写兵力确数。' },
        },
        commanderUnit: 'hero_mounted_alexander',   // 主将队：素材样貌为骑马的亚历山大
        // 对手主将队：🔴 [2026-10-02 主人令「换」→这 4 支，样貌符合历史就行]
        //    索格狄亚那岩的守军仍是粟特人 —— 与居鲁士城同一处理，取 hero_kotyankhan（人马皆甲的具装骑领主）。
        foeCommanderUnit: 'hero_kotyankhan',   // 🔴 [2026-10-02 主人令「换」→这 4 支，样貌符合历史就行] 场16 索格狄亚那岩·粟特军团 岩堡首领
        type: 'siege',
        title: '公元前327年 亚历山大东征索格狄亚那岩战役',
        battleBriefing: '耸立于绝壁之上的索格狄亚那岩要塞守军居高临下嘲讽马其顿军团需要“长翅膀的人”才能攻克。亚历山大遴选一批精通攀岩的勇士，在深夜借着铁帐钉与麻绳，徒手攀爬垂直险绝的冰岩悬崖。拂晓时分，登顶战士在敌军后方的山峰绝顶挥舞白色布条发出信号，城下马其顿大军号角齐鸣，亚历山大派使者向守军高呼“翼人已至”，山顶上的攀岩勇士与下方大军同时摆出强攻姿态。',
        description: '马其顿军团取索格狄亚那岩：阿里马泽斯凭绝壁自恃不可攻，亚历山大悬赏募人夜攀，敢死者徒手攀上岩顶，天明在山顶挥旗示意；守军以为天兵降临，不战而降。奥克夏特斯之女罗克珊娜即在岩上，亚历山大后来娶之为妻。',
        siegeData: {
            title: '索格狄亚那岩战役',
            battleBriefing: '耸立于绝壁之上的索格狄亚那岩要塞守军居高临下嘲讽马其顿军团需要“长翅膀的人”才能攻克。亚历山大遴选一批精通攀岩的勇士，在深夜借着铁帐钉与麻绳，徒手攀爬垂直险绝的冰岩悬崖。拂晓时分，登顶战士在敌军后方的山峰绝顶挥舞白色布条发出信号，城下马其顿大军号角齐鸣，亚历山大派使者向守军高呼“翼人已至”，山顶上的攀岩勇士与下方大军同时摆出强攻姿态。',
            description: '岩堡四面绝壁，无路可攻；马其顿军团以绳索铁钉趁夜攀崖，自守军不曾设防的崖面摸上岩顶，天明自上而下挥旗呐喊。守军见顶上尽是马其顿人，军心崩溃，开堡投降。',
            // 出发地＝军团此刻在哪＝上一场落点（锡尔河战场）→ 最近且那年已有的据点＝忽毡（§三.1）
            // 史料走动写成路标：马拉坎达 → 乌浒水渡口 → 回程马拉坎达 → 忽毡 → 岩堡
            marchWaypoints: ['city_samaerhan', 'city_lanshi', 'city_samaerhan'],   // 🔴 [2026-10-02 主人令] 撒马尔罕→索格狄亚那岩合为一路（移出诺塔卡，途经诺塔卡但不断路）：忽毡 → 撒马尔罕 → 蓝氏城 → 撒马尔罕 → 索格狄亚那岩
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 300,
            // 🔴 出兵据点＝军团此刻在哪：上一场落点（锡尔河战场/忽毡）＝忽毡（前329 所筑最远亚历山大城，归马其顿）
            attackerSourceCityId: 'city_huzhan',
            attackerLegionName: '马其顿军团',
            defenderGeneralId: 'suogediyana_arimazes',
            defenderTroops: 600,
            defenderCityId: 'city_suogediyanayan',
            defenderLegionName: '粟特军团',
            result: 'attacker_win',
            autoEnterRTS: true,
        },
        // 🔴 攻城战必须写被攻据点的易主（§铁律 3）：岩堡归马其顿，territory = Alexander captures Sogdiana
        cityUpdates: [{ cityId: 'city_suogediyanayan', factionId: 'maqidun' }],
        // 赶路播报（攻城战的播报存在事件本身）：B 档并入背景的前328 之事也写在这里
        // 🔴 [2026-10-02 主人令] 本段 4 条路（忽毡→撒马尔罕 288km / 撒马尔罕→蓝氏城 401km / 蓝氏城→撒马尔罕 401km / 撒马尔罕→索格狄亚那岩 224km；移出诺塔卡合并为一路），
        //    严格按「一路一句」配 4 句：起步句 + 每路一段（空行分隔，挂点从段表读）。字数按公里折算。
        briefing: '药杀水畔的营盘还没坐热，急报便到：斯皮塔米尼斯正围攻马拉坎达。亚历山大点起主力昼夜回师，横穿荒原直趋马拉坎达。\n\n【撒马尔罕】马拉坎达的围解了，亚历山大在粟特各要冲设戍，以据点连环清剿残部，自己率主力南渡乌浒水回蓝氏城过冬。军中的醉宴上，亚历山大失手杀了诤友克雷图斯，绝食数日才重新理政。\n\n【蓝氏城】前327年早春，亚历山大重整大军北渡乌浒水，重返马拉坎达大营。粟特平原虽已压平，残余豪强仍盘踞在深山绝壁的石堡里。大军向喀什卡达里亚河谷挺进，去拔最后一处险要。\n\n【撒马尔罕】经诺塔卡穿谷而行，进逼索格狄亚那岩。守军凭险扬言只有生出双翼才登得上，粟特残部就倚着这处绝壁。',
    },
    // ═══════════════════════════════════════════════════════════════
    // 前 327 年秋 · 东征印度：马萨加围城战（Cophen campaign · Siege of Massaga，327 BC）
    // ═══════════════════════════════════════════════════════════════
    {
        year: -327,
        season: 2,                                   // 秋（战役信息框 date = May 327 – March 326 BC；马萨加为该战役首战，按月序推秋 —— 合理推定）
        generalId: 'gen_alexander_great',
        sources: {
            battle: { level: 'fact', text: '英文维基百科 Cophen campaign 的 Siege of Massaga 节：公元前327年马其顿军团攻取阿斯瓦卡人首府马萨加的攻城战。该战役无独立条目，本场按其条目内这一节设计（主人总纲：维基有这个信息就可以设计）。' },
            time: { level: 'inferred', text: '英文维基百科 Cophen campaign 信息框 date = May 327 BC – March 326 BC；同条目记马萨加为该战役第一战（其后依次为 Bazira、Ora、Aornos）。条目未给月份，按月序推秋 —— 合理推定。' },
            place: { level: 'inferred', text: '英文维基百科 Cophen campaign：马萨加为阿萨卡诺伊阿斯瓦卡人最大的设防城市与首府，位于斯瓦特河谷；条目未给坐标，按史地取斯瓦特河谷门户 Chakdara 一带 34.65,72.03 —— 合理推定。本场是攻城战，地点就是被攻据点「马萨加」。' },
            attacker: { level: 'fact', text: '英文维基百科 Cophen campaign 信息框 commander1 = Alexander the Great（并注明 WIA 负伤），另有 Craterus、Perdiccas、Ptolemy、Leonnatus 分领各部；同条目记亚历山大在马萨加城下亲率方阵冲阵并负伤。' },
            attackerTroops: { level: 'inferred', text: '英文维基百科 Cophen campaign 信息框未给双方兵力。同一支马其顿军团在公元前327年接收新兵后约三万众，此役为科芬河谷分路进军中的一路，取 20000 —— 合理推定。同条目另记此役马其顿阵亡不超过二十五人。' },
            attackerLegion: { level: 'fact', text: '同东征诸役：马其顿军团（前伙伴骑兵、中方阵步兵、后克里特弓箭手，鱼鳞阵 3-4-2，整场战争不换）。此役据同条目：亚历山大佯退诱敌、以弓手与标枪骑兵及阿格里安尼人反击、亲率方阵冲阵；攻城时筑塔楼土垒、桥上强攻。' },
            defender: { level: 'fact', text: '英文维基百科 Cophen campaign 信息框 combatant2 = Aśvaka、Guraeans，commander2 = Cleophis；同条目记马萨加由女王克莱奥菲斯守城，另雇自印度河对岸的雇佣兵助守。' },
            defenderTroops: { level: 'inferred', text: '英文维基百科 Cophen campaign 记阿萨卡诺伊人自印度河对岸雇来 7000 名雇佣兵（Fuller 1959, p.245），城防部落守军人数未载；按「查不到按史地合理推定」取 10000，并守守方 ≤ 攻方×2 —— 合理推定。' },
            defenderLegion: { level: 'inferred', text: '英文维基百科 Cophen campaign 的 Siege of Massaga 节：守军自城头抛射弓矢、石块乃至火球，雇佣兵步战最为顽强；🔴 该条**没有记载阿斯瓦卡的骑兵兵数**（文中出现骑兵的是马其顿自己与邻境 Suastos 一带的两千骑），故后列取骑兵属推定：阿斯瓦卡（Aśvaka，梵语「马」）本为产马之族，近旁谷地又有骑兵两千的记载，故后列取印度西北骑手 2。编成取剧本军团「阿斯瓦卡军团」：前远程=层压复合弓手 4、中步兵=印度部落民 3、后骑兵=什里瓦姆沙骑手 2，雁行 4-3-2（同一支军队整场战争不换）—— 合理推定。' },
            route: { level: 'fact', text: '英文维基百科 Cophen campaign：亚历山大公元前327年春自巴克特里亚越兴都库什南下（途中建亚历山大里亚即今贝格拉姆），抵科芬河谷后先取周边，再东进斯瓦特攻马萨加。游戏路线：自上一处战场（索格狄亚那岩）开拔 → 蓝氏城即巴克特拉 → 巴米扬 → 喀布尔 → 难揭即那竭（科芬河谷）→ 马萨加；编辑器「行军路线实测」已跑。' },
            result: { level: 'fact', text: '英文维基百科 Cophen campaign：马萨加陷落。同条目记守军议降后弃营夜遁、被马其顿军团围歼于高地，随后马萨加被取、守军尽杀，马其顿阵亡不超过二十五人；故本场据点归属写马萨加归马其顿。同条目另记其后亚历山大遣科伊诺斯取 Bazira、遣阿尔塞塔斯等围 Ora。' },
            briefing: { level: 'fact', text: '播报所据史事：英文维基百科 Cophen campaign——公元前327年亚历山大越兴都库什南下入科芬河谷，马萨加为阿斯瓦卡人首府与最大设防城市，由克莱奥菲斯守城、另雇印度河对岸雇佣兵；同条目记马其顿阵亡不超过二十五人、城破后守军尽杀。文案按主人规矩不写兵力确数。' },
        },
        commanderUnit: 'hero_mounted_alexander',   // 主将队：素材样貌为骑马的亚历山大
        // 对手主将队：🔴 照 §二.5「看样子和年代选，不看名字」，本时代没有印度/阿斯瓦卡的英雄兵模，
        //    守城的是**女王**克莱奥菲斯。古典段唯一的女将兵模 hero_artemisia（英雄·阿尔特米西亚）
        //    素材**是一艘战船**（armorTags 含 16 = 战舰甲级）—— 🔴 [2026-10-02 主人令
        //    「舰队不应该作为英雄的第10队」] 陆战第 10 队绝不能出舰队。
        //    🔴 [2026-10-02 主人令「换」→这 4 支，样貌符合历史就行] 阿斯瓦卡是印度河上游（斯瓦特谷）山民 ——
        //    取 hero_prithviraj（英雄·普里特维拉吉）：缠头、长袍、持剑的印度部族首领样。
        foeCommanderUnit: 'hero_prithviraj',   // 🔴 [2026-10-02 主人令「换」→这 4 支，样貌符合历史就行] 场17 马萨加·阿斯瓦卡军团 阿萨卡诺伊首领
        type: 'siege',
        title: '公元前327年 亚历山大东征马萨加战役',
        battleBriefing: '在斯瓦特谷地险要的马萨加要塞下，守军与雇佣兵凭借深沟高墙坚守，女王克莱奥菲斯亲临城头指挥。马其顿军团筑起巨大的攻城塔，搭设木桥跨越深沟，亚历山大战中脚踝被流箭射中，血流不止却依然伫立阵前挥剑督战。巨型攻城槌重重轰击城墙，投石机向城内倾泻重石，马其顿突击队顺着搭上城头的桥板发起冲锋，双方在木桥与城墙防线间陷入拉锯鏖战。',
        description: '马其顿军团取马萨加：亚历山大佯退诱敌，把出城的阿斯瓦卡人引到坡下以弓矢与骑兵反击，亲率方阵冲阵，本人负伤；随后连日筑土垒塔楼、以弩炮与弓手压住墙头，再强攻数日，佣兵首领战死，守军议降后夜遁被围歼，马萨加城破、守军尽杀。',
        siegeData: {
            title: '马萨加战役',
            battleBriefing: '在斯瓦特谷地险要的马萨加要塞下，守军与雇佣兵凭借深沟高墙坚守，女王克莱奥菲斯亲临城头指挥。马其顿军团筑起巨大的攻城塔，搭设木桥跨越深沟，亚历山大战中脚踝被流箭射中，血流不止却依然伫立阵前挥剑督战。巨型攻城槌重重轰击城墙，投石机向城内倾泻重石，马其顿突击队顺着搭上城头的桥板发起冲锋，双方在木桥与城墙防线间陷入拉锯鏖战。',
            description: '阿斯瓦卡人凭高墙与城头弓矢、石块、火球死守，雇佣兵尤为顽强；马其顿军团先强攻不下，转而筑土垒、架塔楼，把弓手与投石手送上塔顶压制墙头，再由盾卫自塔桥冲城。桥塌人坠、死伤甚众，直到佣兵首领阵亡，守军才肯议降。',
            // 出发地＝军团此刻在哪＝上一场落点（索格狄亚那岩，攻城战＝那座城）
            // 史料：自索格狄亚那南下经马拉坎达、渡乌浒水至巴克特拉，再越兴都库什入科芬河谷
            marchWaypoints: ['city_lanshi', 'city_fanyanna', 'city_gaofu', 'city_dinggucheng'],   // 🔴 [2026-09-30 铁律修正] 史实直进路线：索格狄亚那岩南下大夏首府蓝氏城（全军集结誓师）→ 翻越兴都库什山至巴米扬 → 喀布尔河谷 → 难揭 → 挺进斯瓦特河谷攻取马萨加。绝不折返跑诺塔卡！
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 20000,
            attackerSourceCityId: 'city_suogediyanayan',
            attackerLegionName: '马其顿军团',
            defenderGeneralId: 'aswaka_cleophis',
            defenderTroops: 10000,
            defenderCityId: 'city_masaga',
            defenderLegionName: '阿斯瓦卡军团',
            result: 'attacker_win',
            autoEnterRTS: true,
        },
        // 🔴 攻城战必须写被攻据点的易主（§铁律 3）：马萨加归马其顿
        cityUpdates: [{ cityId: 'city_masaga', factionId: 'maqidun' }],
        // 🔴 [2026-10-01 同步游戏] 本段 3 条路（索格狄亚那岩→蓝氏城 177km / 蓝氏城→喀布尔 496km / 喀布尔→马萨加 354km），
        //    严格按「一路一句」配 3 句：起步句 + 每路一段（空行分隔，挂点从 82 路表读）。字数按公里折算。
        briefing: '粟特的山谷静了下来。亚历山大娶罗克珊娜，诸部来附，大军南渡乌浒水回蓝氏城。\n\n【蓝氏城】前327年春末，大军再翻兴都库什山，沿高附河谷回到高加索的亚历山大城大营。在此分兵：佩尔狄卡斯与赫费斯提翁带主力走开伯尔山口去印度河架桥，亚历山大自领轻装精锐北上斯瓦特，扫荡山间诸部。\n\n【喀布尔】大军沿斯瓦特河谷的悬崖推进，一路拔寨，直抵阿萨卡诺伊部首城马萨加。此城卡住斯瓦特深处的山道，城里囤着部族战士与印度雇佣骑兵——不拿下就过不去。',
    },
    // ═══════════════════════════════════════════════════════════════
    // 前 326 年春 · 东征印度：奥诺斯岩围城战（Siege of Aornos；亚历山大一生最后一次围城）
    //    B 档并入背景（§零之二「维基没有独立条目、只在别的条目里一段带过」）：
    //    前327 冬 奥拉围城战与巴济拉之弃城 —— 都无独立条目，写进本场赶路播报。
    // ═══════════════════════════════════════════════════════════════
    {
        year: -326,
        season: 0,                                   // 春（英文维基百科 Aornos 条目正文记围城在 前326年4月 —— Sastri 1988, p.54）
        generalId: 'gen_alexander_great',
        sources: {
            battle: { level: 'fact', text: '英文维基百科 Aornos 条目：奥诺斯岩是亚历山大最后一次围城，地点为今巴基斯坦开伯尔-普什图省印度河上游峡谷湾上的 Pir Sar 山脊；同条 Cophen campaign 的 Siege of Aornus 节记该役在 前327/326 年之冬。本场按其独立条目设计，攻城战一场对一个维基条目。' },
            time: { level: 'inferred', text: '英文维基百科 Aornos 条目正文记围城在 前326 年 4 月（Sastri 1988, p.54）；同条 Cophen campaign 信息框 date = May 327 BC – March 326 BC、正文记围城在 前327/326 之冬。两处英文维基略有出入，取春，与下一场海达斯佩斯河战役（公元前326年5月）先后相接 —— 合理推定。' },
            place: { level: 'inferred', text: '英文维基百科 Aornos 条目：该岩在印度河上游峡谷湾之上、Gunangar Shamshi Khel 之西，条目所附照片说明为 Shangla District；条目本身没有信息框坐标，故取维基数据 Pir Sar 34.82,72.88，该点反查地名落在 Shangla 县，与照片说明一致。西语维基信息框另给 34.7067,72.4528，该点落在斯瓦特河谷的赛杜谢里夫，与英文正文的印度河峡谷不合，不取 —— 合理推定。本场是攻城战，地点就是被攻据点「奥诺斯岩」。' },
            attacker: { level: 'fact', text: '英文维基百科 Aornos 条目：亚历山大亲率此役，本人随前锋登丘时被守军推下的巨石打退；同条记托勒密与书记官先夺西侧山脊、筑栅掘壕，亚历山大以弩炮与土坡逼近崖壁，最后拽绳攀上崖顶，为雅典娜·尼刻立坛。' },
            attackerTroops: { level: 'inferred', text: '英文维基百科两个条目均未给双方兵力。此处是狭窄山脊上的攻坚，只容一部兵力展开，取 15000。同条 Cophen campaign 记亚历山大此前分兵，一路由佩尔狄卡斯与赫费斯提翁沿科芬河前进 —— 合理推定。' },
            attackerLegion: { level: 'fact', text: '同东征诸役：马其顿军团（前伙伴骑兵、中方阵步兵、后克里特弓箭手，鱼鳞阵 3-4-2，整场战争不换）。此役据同条：先夺西侧山脊为据点、以木料树枝泥土填涧筑坡送弩炮近崖、夺与崖顶相连的小丘、最后拽绳攀崖登顶。' },
            defender: { level: 'fact', text: '狄奥多罗斯《历史丛书》17.86：马萨加陷落后，阿萨卡诺斯王之弟阿夫里凯斯（Aphrikes，库尔提乌斯记为 Eryx）率部众退入险峻山地抵抗；据 W. Heckel 考证其为奥诺斯岩战役期间阿萨卡诺斯武装统帅。' },
            defenderTroops: { level: 'inferred', text: '英文维基百科未给守方兵力。守军是斯瓦特河谷溃散的部落人众与邻近山民，据崖顶以滚石死守，取 6000，并守守方 ≤ 攻方×2 —— 合理推定。' },
            defenderLegion: { level: 'inferred', text: '同条 Cophen campaign：奥拉、巴济拉溃散下来的都是阿斯瓦卡人众，故本场守方仍取剧本军团「阿斯瓦卡军团」：前远程=层压复合弓手 4、中步兵=印度部落民 3、后骑兵=什里瓦姆沙骑手 2，雁行 4-3-2。同一支阿斯瓦卡部落军，整场战争不换 —— 合理推定。' },
            route: { level: 'fact', text: '英文维基百科 Cophen campaign 的 Sieges of Bazira and Ora 节与 Siege of Aornus 节：亚历山大先南下平定白沙瓦河谷、切断阿比萨雷斯渡印度河之路，再由印度河右岸北上，自南面攻奥诺斯岩。游戏路线：自上一场落点马萨加开拔 → 白沙瓦即白沙瓦河谷 → 阿托克即印度河渡口要塞 → 奥诺斯岩；编辑器「行军路线实测」已跑。' },
            result: { level: 'fact', text: '英文维基百科 Aornos 条目：马其顿胜。守军先以滚石打退攀上小丘的前锋、擂鼓三日相庆，随后趁夜弃岩而走；亚历山大拽绳攀上最后一段崖面，登顶后据说为雅典娜·尼刻立坛，并为阵亡者立冢。同条 Cophen campaign 记奥诺斯岩取下后，通向印度河的道路再无障碍，故本场据点归属写奥诺斯岩归马其顿。' },
            briefing: { level: 'fact', text: '播报所据史事：英文维基百科 Cophen campaign 的 Sieges of Bazira and Ora 节 —— 马萨加破后，亚历山大遣科伊诺斯往巴济拉、遣阿尔塞塔斯、阿塔罗斯与德米特里乌斯围奥拉；奥拉人出城突袭被击退，亚历山大闻阿比萨雷斯将渡印度河救奥拉而改道先取奥拉；奥拉陷落后巴济拉守军弃城投奔奥诺斯岩。同条 Siege of Aornus 节 —— 托勒密与书记官夺西侧山脊、填涧筑坡、夺相连小丘、守军弃岩夜遁、亚历山大攀崖登顶立坛。文案按主人规矩不写兵力确数。' },
        },
        commanderUnit: 'hero_mounted_alexander',   // 主将队：素材样貌为骑马的亚历山大
        // 对手主将队：🔴 [2026-10-02 主人令「换」→这 4 支，样貌符合历史就行]
        //    阿斯瓦卡山民 —— 与马萨加同一处理，取 hero_prithviraj（缠头长袍持剑的印度部族首领样）。
        foeCommanderUnit: 'hero_prithviraj',   // 🔴 [2026-10-02 主人令「换」→这 4 支，样貌符合历史就行] 场18 奥诺斯岩·阿斯瓦卡军团 崖堡首领
        type: 'siege',
        title: '公元前326年 亚历山大东征奥诺斯岩战役',
        battleBriefing: '面对耸立于印度河深谷之上、号称连大力神赫拉克勒斯都未能攻克的奥诺斯岩天险，亚历山大凭临峡谷深渊，下令砍伐树木填土筑造高耸的巨型土堆，将投石机推进至射程之内。投石机向对岸石壁倾泻矢石掩护，亚历山大率领先锋小队沿着麻绳攀爬最后一段近乎垂直的岩壁；崖顶守军推落巨石、倾下矢石，先锋顶着落石与矢雨一寸寸挪上那片高地平台。',
        description: '马其顿军团取奥诺斯岩：先遣队抢占西侧山脊、筑栅掘壕为据点，点火的信号反被守军看见，峡谷里缠斗许久才重新聚拢；随后在北面以木料、树枝与泥土填涧堆坡，把弩炮推近崖壁。之后夺下与崖顶相连的小丘，亚历山大亲率前锋登丘时被守军推下的巨石打退，守军擂鼓相庆。当夜守军弃岩而走，亚历山大拽着绳索攀上最后一段崖面，登上崖顶，据说为雅典娜·尼刻立坛。',
        siegeData: {
            title: '奥诺斯岩战役',
            battleBriefing: '面对耸立于印度河深谷之上、号称连大力神赫拉克勒斯都未能攻克的奥诺斯岩天险，亚历山大凭临峡谷深渊，下令砍伐树木填土筑造高耸的巨型土堆，将投石机推进至射程之内。投石机向对岸石壁倾泻矢石掩护，亚历山大率领先锋小队沿着麻绳攀爬最后一段近乎垂直的岩壁；崖顶守军推落巨石、倾下矢石，先锋顶着落石与矢雨一寸寸挪上那片高地平台。',
            description: '守军据崖顶死守。北面深涧是上崖唯一的门户，马其顿人填涧筑坡、把弩炮推近崖壁时，守军从崖上推下巨石，把攀上小丘的前锋打退，擂鼓相庆。夜里守军弃岩遁走，崖顶遂空。',
            // 出发地＝军团此刻在哪＝上一场落点（马萨加，攻城战＝那座城）
            // 史料：马萨加破后先南下平定白沙瓦河谷，再沿印度河右岸北上自南面攻岩
            marchWaypoints: ['city_baishawa'],
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 15000,
            attackerSourceCityId: 'city_masaga',
            attackerLegionName: '马其顿军团',
            defenderGeneralId: 'aornos_aphrikes',
            defenderTroops: 6000,
            defenderCityId: 'city_aonuosiyan',
            defenderLegionName: '阿斯瓦卡军团',
            result: 'attacker_win',
            autoEnterRTS: true,
        },
        // 🔴 攻城战必须写被攻据点的易主（§铁律 3）：奥诺斯岩归马其顿
        cityUpdates: [{ cityId: 'city_aonuosiyan', factionId: 'maqidun' }],
        briefing: '大军出斯瓦特谷地南下，进驻佩乌克劳提斯。\n\n【白沙瓦】残部退保奥诺斯岩，凭深涧与绝壁死守。亚历山大亲率精锐进逼崖下，必拔。',
    },
    // ═══════════════════════════════════════════════════════════════
    // 前 326 年夏 · 东征印度：海达斯佩斯河战役（Battle of the Hydaspes，对波鲁斯；东征伤亡最重的一役）
    //    B 档并入背景（§零之二「无独立条目、只在一段里带过的受降过场」）：
    //    渡印度河、尼萨受降、塔克西拉归附结盟 —— 都写进本场赶路播报，不单列成场。
    // ═══════════════════════════════════════════════════════════════
    {
        year: -326,
        season: 1,                                   // 夏（英文维基百科 Battle of the Hydaspes 信息框 date = May 326 BC）
        generalId: 'gen_alexander_great',
        sources: {
            battle: { level: 'fact', text: '英文维基百科 Battle of the Hydaspes：公元前326年5月马其顿军团与波鲁斯治下的保拉瓦人在海达斯佩斯河即今杰赫勒姆河畔的野战，马其顿胜；同条记这是亚历山大东征中伤亡较重的一役，波鲁斯是其最顽强的对手。' },
            time: { level: 'fact', text: '英文维基百科 Battle of the Hydaspes 信息框 date = May 326 BC，故季节取夏。' },
            place: { level: 'fact', text: '英文维基百科 Battle of the Hydaspes 信息框 coordinates 32°49′40″N 73°38′20″E，即 32.8278,73.6389；location = Hydaspes River 今杰赫勒姆河，今巴基斯坦旁遮普省。本场是野战，战场记录取该坐标，与剧本这一场的 location 一字不差。' },
            attacker: { level: 'fact', text: '英文维基百科 Battle of the Hydaspes 信息框 combatant1 = 马其顿帝国、科林斯同盟、犍陀罗，commander1 = 亚历山大、克拉特鲁斯、科伊诺斯、塔克西列斯；同条正文记亚历山大亲率伙伴骑兵冲击印度左翼。' },
            attackerTroops: { level: 'fact', text: '英文维基百科 Battle of the Hydaspes 信息框 strength1 = 45,000–47,000，其中步兵 40,000、骑兵 5,000–7,000 及亚洲盟军，取区间中值 46000；同条正文记约 40,000 步兵与 5,000 骑兵渡河参战，克拉特鲁斯另率一部留在西岸营中。' },
            attackerLegion: { level: 'fact', text: '同东征诸役：马其顿军团（前伙伴骑兵、中方阵步兵、后克里特弓箭手，鱼鳞阵 3-4-2，整场战争不换）。此役据同条正文：先以达赫骑射手骚扰印度右翼、伙伴骑兵冲其左翼、科伊诺斯抄其后路，再以方阵萨里沙顶住战象，轻装兵砍象奴刺象眼。' },
            defender: { level: 'fact', text: '英文维基百科 Battle of the Hydaspes 信息框 combatant2 = Pauravas 保拉瓦人，commander2 = 波鲁斯、Spitakes 与波鲁斯诸子；同条正文记波鲁斯不依印度诸王乘战车的旧例，亲自骑乘阵中最高大的战象督战。' },
            defenderTroops: { level: 'inferred', text: '英文维基百科 Battle of the Hydaspes 信息框 strength2 = 22,000–54,000，其中步兵 20,000–50,000、骑兵 2,000–4,000、战象 85–200、战车 1,000，取区间中值 38000，并守守方 ≤ 攻方×2 —— 合理推定。' },
            defenderLegion: { level: 'fact', text: '英文维基百科 Battle of the Hydaspes：印度军以战车列于两翼骑兵之前、步兵居中、战象每隔五十尺列于步兵阵前，故步卒与战象为全军主体，先接敌的是两翼骑兵。编成取剧本军团「保拉瓦军团」：前骑兵=什里瓦姆沙骑手 2、中排=印度部落民步兵 3 + 南亚战象 1、后远程=印度长弓 3，鹤翼 2-4-3；主帅波鲁斯亲乘御驾战象（porus_elephant）统领第十队。' },
            route: { level: 'fact', text: '英文维基百科 Cophen campaign 与 Battle of the Hydaspes：亚历山大取奥诺斯岩后南下渡印度河，塔克西拉王献城结盟，再东进至海达斯佩斯河；游戏路线自上一场落点奥诺斯岩开拔 → 阿托克即印度河渡口 → 沿路东南经蒙格一带 → 海达斯佩斯河畔战场；编辑器「行军路线实测」已跑。' },
            result: { level: 'fact', text: '英文维基百科 Battle of the Hydaspes 信息框 result = Macedonian victory，territory = 马其顿并吞海达斯佩斯河至希法色斯河即今比亚斯河之间的大部分旁遮普。同条记波鲁斯被俘后答「像国王对待另一位国王那样待我」，亚历山大让他继续保有自己的国土，并在战场处建尼卡亚城、在对岸建布凯法拉城以纪念战死的布塞法洛斯。故本场据点不易主：波鲁斯仍为其国之主，故不写据点归属。' },
            briefing: { level: 'fact', text: '播报所据史事：英文维基百科 Battle of the Hydaspes 背景与战前机动两节 —— 取奥诺斯岩后渡印度河、塔克西拉王结盟共击波鲁斯；B 档并入背景的尼萨受降即狄奥尼索斯传说、渡河与结盟三事都写在本文；文案按主人规矩不写兵力确数。' },
        },
        commanderUnit: 'hero_mounted_alexander',   // 主将队：素材样貌为骑马的亚历山大
        // 对手主将队：波鲁斯专属英雄兵模 porus_elephant（波鲁斯王战象，史实波鲁斯亲自骑乘阵中最高大战象督战）
        foeCommanderUnit: 'porus_elephant',
        type: 'field_battle',
        title: '公元前326年 亚历山大东征海达斯佩斯河战役',
        battleBriefing: '滂沱雷雨夜中，亚历山大率部队绕道上游远处的隐蔽河湾强渡海达斯佩斯河。波鲁斯王发觉后，将成群战象排在阵前如同一道道移动城墙，两侧布满骑兵与战车。亚历山大先派骑射手压制波鲁斯左翼骑兵，亲率伙伴骑兵正面猛冲；科伊诺斯带一队骑兵绕到敌军背后，两面夹击。正面马其顿长矛方阵则迎向践踏而来的庞大战象，步兵向驭手投掷标枪、近身斫击战象，发疯的战象与混战的步骑兵在泥泞的河滩上绞杀在一起。',
        description: '公元前326年夏，亚历山大进抵海达斯佩斯河。波鲁斯率大军在南岸列阵，战象当先，决意不让马其顿人过河。亚历山大连日沿河上下佯动，终于在雷雨之夜自上游河岛偷渡成功，全军人马悄然登上南岸，与波鲁斯的主力在河畔旷野正面相遇。',
        fieldBattleData: {
            title: '海达斯佩斯河战役',
            battleBriefing: '滂沱雷雨夜中，亚历山大率部队绕道上游远处的隐蔽河湾强渡海达斯佩斯河。波鲁斯王发觉后，将成群战象排在阵前如同一道道移动城墙，两侧布满骑兵与战车。亚历山大先派骑射手压制波鲁斯左翼骑兵，亲率伙伴骑兵正面猛冲；科伊诺斯带一队骑兵绕到敌军背后，两面夹击。正面马其顿长矛方阵则迎向践踏而来的庞大战象，步兵向驭手投掷标枪、近身斫击战象，发疯的战象与混战的步骑兵在泥泞的河滩上绞杀在一起。',
            description: '波鲁斯以战象居中、步兵紧随，骑兵与战车分列两翼，阵势如墙。亚历山大避开正面：先以骑射手骚扰印度军左翼，再以伙伴骑兵冲击同一翼，诱使印度骑兵来回奔援，由科伊诺斯抄后路，把印度骑兵先行打散。战象随后压上，马其顿方阵以萨里沙长矛迎面顶住，轻装兵专砍象奴、刺象眼。巨兽负痛回冲，反把自家阵列搅乱。波鲁斯力战至最后，伤重被俘。',
            location: { lat: 32.8278, lng: 73.6389 },   // 英文维基百科信息框 32°49′40″N 73°38′20″E
            // 出发地＝军团此刻在哪＝上一场落点（奥诺斯岩，攻城战＝那座城）
            // 史料：取奥诺斯岩后南下渡印度河，塔克西拉献城结盟，再东进至海达斯佩斯河
            marchWaypoints: ['city_atuoke'],
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 46000,
            attackerSourceCityId: 'city_aonuosiyan',
            attackerLegionName: '马其顿军团',
            defenderFactionId: 'bulu',
            defenderGeneralId: 'gen_bolusi',
            defenderTroops: 38000,
            defenderSourceCityId: 'city_meng',
            defenderLegionName: '保拉瓦军团',
            result: 'attacker_win',
            autoEnterRTS: true,
        },
        // 野战按历史写战后归属（§铁律 3）：本场**无据点易主** —— 波鲁斯被俘后仍保有国土，蒙格仍属补噜
    },
    // ═══════════════════════════════════════════════════════════════
    // 前 325 年春 · 东征印度：马里斯战役（Mallian campaign · Siege of the citadel）
    //    亚历山大一生最重的一次负伤 —— 攻城时胸口中箭，全军一度以为他已死。
    //    B 档并入背景（§零之二「无独立条目、只在一段里带过的过场」）：
    //    停留波鲁斯境内三十天、受降三十七座城、阿比萨雷斯来附、希法色斯河畔全军拒进、造船南下 —— 都写进本场播报。
    // ═══════════════════════════════════════════════════════════════
    {
        year: -325,
        season: 0,                                   // 春（英文维基百科 Mallian campaign 信息框 date 止于 前325年2月；围攻卫城为其高潮 —— 合理推定）
        generalId: 'gen_alexander_great',
        sources: {
            battle: { level: 'fact', text: '英文维基百科 Mallian campaign：公元前326年11月至公元前325年2月马其顿军团对马利人即摩罗婆的战役，马其顿胜；同条 Siege of the citadel 节记亚历山大亲率攻城、登城时中箭重伤，是他一生最重的一次负伤。' },
            time: { level: 'inferred', text: '英文维基百科 Mallian campaign 信息框 date = November 326 BC – February 325 BC；同条正文记围攻卫城为全役高潮、亚历山大重伤后数日方脱险，故本场取战役末期 —— 合理推定。' },
            place: { level: 'inferred', text: '英文维基百科 Mallian campaign 正文记马利人的都城被认定为今日木尔坦，维基自注该认定不十分确定；据点坐标取英文维基百科 Multan 条目信息框 30°11′N 71°28′E —— 合理推定。本场是攻城战，地点就是被攻据点「马里斯」。' },
            attacker: { level: 'fact', text: '英文维基百科 Mallian campaign 信息框 commander1 = 亚历山大（并注明 WIA 负伤）、赫费斯提翁、佩同、克拉特鲁斯；同条 Siege of the citadel 节记亚历山大把全军分为两路，自领一路攻城，并亲自扛梯登城。' },
            attackerTroops: { level: 'inferred', text: '英文维基百科 Mallian campaign 信息框未给双方兵力。同条记此役为分兵行动、且全军此前已在海达斯佩斯河折损，围攻马利都城的一路取 20000 —— 合理推定。' },
            attackerLegion: { level: 'fact', text: '同东征诸役：马其顿军团（前伙伴骑兵、中方阵步兵、后克里特弓箭手，鱼鳞阵 3-4-2，整场战争不换）。此役据同条：以扭力弩炮破门、掘第二层墙基，登城时梯子被人挤断、亚历山大与少数随从被困墙头。' },
            defender: { level: 'fact', text: '英文维基百科 Mallian campaign 信息框 combatant2 = Mallians 马利人即摩罗婆，commander2 = Various；同条记马利人几乎全数退入都城卫城死守，亚历山大跳入城内时当场刺死其首领。' },
            defenderTroops: { level: 'inferred', text: '英文维基百科 Mallian campaign 记马利与奥克西德拉卡两族一度结盟、合计步兵九万、骑兵一万、战车九百，又记另一座卫城内马利人被杀五千、阿里安估马利人众五万；守卫城的守军与居民取 12000，并守守方 ≤ 攻方×2 —— 合理推定。' },
            defenderLegion: { level: 'inferred', text: '同条记马利人据卫城以弓矢投石拒守、步卒为主体，两族结盟时骑兵仅占十一分之一。编成取剧本军团「马利军团」：前远程=印度长弓 3、中步兵=印度部落民 4、后骑兵=什里瓦姆沙骑手 2，鱼鳞 3-4-2（同一支军队整场战争不换）—— 合理推定。' },
            route: { level: 'inferred', text: '自上一场落点海达斯佩斯河战场最近且那一年已存在的据点蒙格开拔。据同条：亚历山大在波鲁斯境内停留三十天后东进、至希法色斯河遇全军拒进而南返，其后造船沿河南下、再穿旱地急袭马利人的城。这一带库里没有可作路标的据点，最近的拉合尔在东北、不在南下路上，故本场不设路标，末段自路网末端直行入马利境内 —— 合理推定。' },
            result: { level: 'fact', text: '英文维基百科 Mallian campaign 信息框 result = Macedonian victory。同条 Siege of the citadel 节与 Result 节：卫城被攻破、城内居民尽杀；亚历山大胸口中箭，箭头由随军医生割开伤口取出，数日间生死未卜，全军一度以为他已死；他后来乘船露面方安军心。故本场据点归属写马里斯归马其顿。' },
            briefing: { level: 'fact', text: '播报所据史事：英文维基百科 Mallian campaign 背景节 —— 海达斯佩斯河后亚历山大在波鲁斯境内停留三十天并排解波鲁斯与塔克西拉的旧怨、受降三十七座城、阿比萨雷斯来附；军至希法色斯河因久雨与伤亡而全军拒进，亚历山大被迫南返；其后造船沿河南下并穿旱地奇袭马利。文案按主人规矩不写兵力确数。' },
        },
        commanderUnit: 'hero_mounted_alexander',   // 主将队：素材样貌为骑马的亚历山大
        // 对手主将队：🔴 [2026-10-02 主人令「换」→这 4 支，样貌符合历史就行]
        //    马利人（摩罗婆）是旁遮普印度部族 —— 取 hero_rajendrachola（英雄·罗贞陀罗·朱罗）：
        //    白袍金饰、持大弓的印度王／首领样。
        foeCommanderUnit: 'hero_rajendrachola',   // 🔴 [2026-10-02 主人令「换」→这 4 支，样貌符合历史就行] 场20 马里斯·马利军团 摩罗波罗
        type: 'siege',
        title: '公元前325年 亚历山大东征马里斯战役',
        battleBriefing: '在马利人要塞的围攻战中，亚历山大见云梯登城受阻，大怒之下亲自夺过云梯率先登顶，与佩乌塞斯塔斯等几名侍卫直接跳入城墙内侧。城内敌军蜂拥围攻，一支重箭贯穿了亚历山大的胸铠击中肺部，亚历山大倒在墙边血流如注。佩乌塞斯塔斯举起特洛伊雅典娜神盾死死守护在亚历山大身前，城外惊恐的马其顿士兵疯狂撞击城门、搭梯翻墙冲入城内，双方在城堡内院里围绕着倒下的国王展开决死血战。',
        description: '公元前325年春，亚历山大自海达斯佩斯河一路南下，穿旱地急进，连夜扑到马利人的城下。马利人把老幼家当都搬进了都城卫城，据墙死守。马其顿军团破了外门，在墙根下掘墙；亚历山大嫌攻城太慢，亲自扛梯登城，随同登城的只有寥寥数人，梯子被人挤断，亚历山大被困在墙头。',
        siegeData: {
            title: '马里斯战役',
            battleBriefing: '在马利人要塞的围攻战中，亚历山大见云梯登城受阻，大怒之下亲自夺过云梯率先登顶，与佩乌塞斯塔斯等几名侍卫直接跳入城墙内侧。城内敌军蜂拥围攻，一支重箭贯穿了亚历山大的胸铠击中肺部，亚历山大倒在墙边血流如注。佩乌塞斯塔斯举起特洛伊雅典娜神盾死死守护在亚历山大身前，城外惊恐的马其顿士兵疯狂撞击城门、搭梯翻墙冲入城内，双方在城堡内院里围绕着倒下的国王展开决死血战。',
            description: '马利人几乎全数退入卫城，城墙绕城甚长。马其顿军团撞开一道城门，攻进外城，接着掘内层墙基。亚历山大等得不耐烦，亲自扛起梯子登城，身后只跟了少数亲兵。梯子承受不住后面涌上来的兵，断成两截。马利人认出亚历山大的铠甲与身手，一齐投掷标枪射箭。亚历山大不肯跳回自己人怀里，反身跃入城内，当场刺死守军主帅摩罗波罗，随即被一支箭射穿胸甲，血与气从伤口里嘶嘶冒出。亚历山大背靠城墙撑了一阵，终于大量失血昏倒。墙外的马其顿人以为亚历山大已经死了，撞开城门，把城中人尽数杀死。亚历山大被抬到帐中，医生割开伤口取出箭镞；此后数日一直在生死之间，直到能起身，才让全军看见主帅还活着。',
            // 出发地＝军团此刻在哪：上一场（海达斯佩斯河野战）落点最近且那一年已存在的据点 ＝ 蒙格
            // 史料：自波鲁斯境内南下沿河而行，再穿旱地急袭马利人的城。这一带库里没有可作路标的据点 → 不设路标。
            marchWaypoints: [],   // 🔴 [2026-09-30 主人定：40 公里以内的点视为一个点，取历史上有名气的，含战场] 蒙格（相传尼卡亚旧址）离海达斯佩斯河战场只有 23 公里，视为战场这一个点，不再单独当路标；出发地＝上一场落点（战场）→ 马里斯
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 20000,
            attackerSourceCityId: 'city_meng',
            attackerLegionName: '马其顿军团',
            defenderGeneralId: 'malli_malavapala',
            defenderTroops: 12000,
            defenderCityId: 'city_malisi',
            defenderLegionName: '马利军团',
            result: 'attacker_win',
            autoEnterRTS: true,
        },
        // 🔴 攻城战必须写被攻据点的易主（§铁律 3）：马里斯归马其顿
        cityUpdates: [{ cityId: 'city_malisi', factionId: 'maqidun' }],
        briefing: '波鲁斯复位之后，大军东进过阿塞西尼斯河与拉维河，直抵希法色斯河；久战思归的将士哗变，不肯再东。回师顺印度河南下——马里斯人扼住渡口，非拔不可。',
    },
    // ═══════════════════════════════════════════════════════════════
    // 前 324 年冬 · 归途：科塞亚战役（Cossaean campaign）—— 亚历山大一生最后一次冬季战役
    //    B 档并入背景（§零之二「无独立条目、只在一段里带过的过场」）：
    //    印度河下行与婆罗门城中毒箭、尼阿库斯回航、大军穿格德罗西亚沙漠、苏萨婚礼与免债、欧皮斯兵变、
    //    赫费斯提翁之死 —— 都写在本场战场记录的赶路播报里，不单列成场。本场之后，亚历山大剧本即到头。
    // ═══════════════════════════════════════════════════════════════
    {
        year: -324,
        season: 3,                                   // 冬（英文维基百科 Cossaei：该役为亚历山大 324/323 年冬季的最后一役）
        generalId: 'gen_alexander_great',
        sources: {
            battle: { level: 'fact', text: '英文维基百科 Cossaei：科塞亚人是扎格罗斯山地部落，善射、穴居，靠劫掠与向来往军队索取买路钱为生，连波斯诸王每年往返埃克巴坦那与巴比伦都得付买路钱，历代波斯诸王都未能征服；亚历山大率军征讨并将其平定，该役是其 324/323 年冬季的最后一役。狄奥多罗斯 17.111 记此事。' },
            time: { level: 'inferred', text: '英文维基百科 Cossaei 明记该役为「亚历山大 324/323 年冬季的最后一役」；上一场（马利都城）在公元前325年春，故本场取 前324 年冬 —— 合理推定。' },
            place: { level: 'inferred', text: '英文维基百科 Cossaei 记其地为苏西亚纳与米底之间的扎格罗斯山地，即今伊朗卢里斯坦一带，条目未给坐标；本场是野战，战场取该山地中今霍拉马巴德一带 33.49,48.36 —— 合理推定。' },
            attacker: { level: 'fact', text: '狄奥多罗斯 17.111：亚历山大亲率轻装机动部队征讨科塞亚人，先夺其入山要道；英文维基百科 Cossaei 亦记 Alexander led his forces against them and subdued them。' },
            attackerTroops: { level: 'inferred', text: '英文维基百科与狄奥多罗斯均未给双方兵力；狄奥多罗斯明记此役是「以轻装部队」出征的山区清剿，取 12000 —— 合理推定。' },
            attackerLegion: { level: 'fact', text: '同东征诸役：马其顿军团（前伙伴骑兵、中方阵步兵、后克里特弓箭手，鱼鳞阵 3-4-2，整场战争不换）。此役据狄奥多罗斯：先夺进山路口，随后分区清剿、逐段扫平村寨与牧场。' },
            defender: { level: 'fact', text: '英文维基百科 Cossaei 与斯特拉波 15.3.6：科塞亚人为扎格罗斯山地部落、加喜特人（Kassites）后裔，穴居善射，从未接受外族统治；取加喜特正统战王名卡什提利亚什（Kashtiliash）。' },
            defenderTroops: { level: 'inferred', text: '英文维基百科 Cossaei 引斯特拉波：科塞亚人曾一次派出 13,000 人助埃利迈人作战，可见其众以万计；本场守方取 8000，并守守方 ≤ 攻方×2 —— 合理推定。' },
            defenderLegion: { level: 'inferred', text: '英文维基百科 Cossaei：该族为扎格罗斯山地部落，「以弓矢为武器」（armed with bows and arrows）、善射（expert bowmen）、穴居、以劫掠与买路钱为生；🔴 全条只记弓矢，**从未记载科塞亚骑兵**。编成取剧本军团「科塞亚军团」：前远程=波斯系弓手 4、中步兵=山地部落民 3、后远程=高地复合弓手 2，雁行 4-3-2，不排骑兵排，与同一地区同一打法的乌克西亚军团同排法（同一支军队整场战争不换）—— 合理推定。' },
            route: { level: 'inferred', text: '自上一场落点马里斯开拔，沿格德罗西亚海岸西行：帕塔拉（印度河三角洲）→ 兰巴基亚 → 奥拉 → 特尔巴特（克奇河谷）→ 普拉（格德罗西亚首府）→ 卡曼尼亚，再转回波斯腹地经波斯波利斯 → 苏萨 → 巴格达（欧皮斯一带，前324年欧皮斯兵变处）→ 呼勒万（札格罗斯山门）→ 哈马丹入扎格罗斯科塞亚境，平科塞亚后班师巴比伦（前323年病逝，全剧终点）。史料：亚历山大亲率主力沿格德罗西亚海岸西返，经卡尔马尼亚回到波斯腹地，公元前324年先后在苏萨与米底，其后动身回巴比伦途中平定科塞亚；走北路取道阿拉霍西亚与德兰吉亚那的是克拉特鲁斯那一路，不是主角这一路。路网实测各段皆通 —— 合理推定。' },
            result: { level: 'fact', text: '狄奥多罗斯 17.111：亚历山大先夺入山要道，屡战皆胜，斩获甚众，科塞亚人被迫以臣服换回被俘者；英文维基百科 Cossaei 记该族 at least for a time 被征服。故本场马其顿胜；科塞亚人没有可易主的据点，故本场不写据点归属。' },
            briefing: { level: 'fact', text: '阿里安《远征记》VII.14 与普鲁塔克《亚历山大传》72：前324 年秋大军自苏萨北上米底，抵埃克巴坦那，主将赫费斯提翁急病身故，亚历山大令全军停乐志哀、备极哀荣。播报所据史事：英文维基百科 Indian campaign of Alexander the Great 与 Gedrosia —— 印度河下行至帕塔拉、婆罗门城下中毒箭、尼阿库斯沿海回航、大军穿格德罗西亚沙漠而大损；英文维基百科 Alexander the Great —— 公元前324年苏萨婚礼与免除旧债、欧皮斯兵变、赫费斯提翁死于埃克巴坦那；末段「利比亚、迦太基与伊比利亚的使节云集朝觐」据阿里安《远征记》VII.15（Loeb/Chinnock 译本 VII.15.4–6：Libyans、Bruttians、Lucanians、Tyrrhenians 遣使祝贺，Carthaginians 亦称此时遣使；Ethiopians、Scythians of Europe、Gauls、Iberians 遣使求盟——**原文名单里没有希腊城邦**，2026-10-03 据此把初稿的「希腊」改掉）。文案按主人规矩不写兵力确数。' },
        },
        commanderUnit: 'hero_mounted_alexander',   // 主将队：素材样貌为骑马的亚历山大
        // 对手主将队：照 §二.5「先保年代，再尽样子」——科塞亚是扎格罗斯山地部落，本时代没有其本族英雄兵模，
        //    故取同代、文化区挨着的波斯系英雄兵模 hero_artaphernes（英雄·阿尔塔弗涅斯，阿契美尼德萨迪斯总督）。
        foeCommanderUnit: 'hero_artaphernes',
        type: 'field_battle',
        title: '公元前324年 亚历山大东征科塞亚战役',
        battleBriefing: '面对退守扎格罗斯深山险谷的科塞亚部落，亚历山大在严冬中将军队分为数路纵队，与托勒密分头包抄。马其顿轻装步兵与阿格里安投枪手攀登积雪覆盖的悬崖高地，切断科塞亚人的山退路线；亚历山大亲自率领骑兵与持盾卫队沿山谷绝壁强行推进，直扑敌军的深山聚落，双方在密林深壑与悬崖乱石间展开残酷的搜剿激战。',
        description: '公元前324年冬，亚历山大自米底南下回巴比伦，取道扎格罗斯山中的科塞亚境。科塞亚人是山地部落，穴居善射，向来靠劫掠与买路钱过活，波斯历代诸王都拿科塞亚人没有办法。亚历山大不与科塞亚人讲和：先以轻装部队抢占几处入山的隘口，随后分路进剿，把科塞亚人的村寨与牧场逐段扫平。',
        fieldBattleData: {
            title: '科塞亚战役',
            battleBriefing: '面对退守扎格罗斯深山险谷的科塞亚部落，亚历山大在严冬中将军队分为数路纵队，与托勒密分头包抄。马其顿轻装步兵与阿格里安投枪手攀登积雪覆盖的悬崖高地，切断科塞亚人的山退路线；亚历山大亲自率领骑兵与持盾卫队沿山谷绝壁强行推进，直扑敌军的深山聚落，双方在密林深壑与悬崖乱石间展开残酷的搜剿激战。',
            description: '科塞亚人散住在几道山梁与洞穴里，仗着地势险，向来不怕大军。马其顿军团这次带的不是重装方阵，而是轻装的弓手与投枪兵：马其顿军团沿山脊疾进，先夺隘口，再自上而下压向村寨。科塞亚人据石垒射箭，箭法极准，马其顿人一时讨不到便宜，便改用火攻与围困，把一处一处山梁割开。寨破之后青壮多被生擒，山里的牲口与储粮尽落马其顿军团之手。',
            location: { lat: 33.49, lng: 48.36 },   // 扎格罗斯山地、今卢里斯坦霍拉马巴德一带（条目未给坐标 —— 合理推定）
            // 出发地＝军团此刻在哪＝上一场落点（马里斯，攻城战＝那座城）
            // 史料：自印度西返，经格德罗西亚与波斯腹地，前324年冬自米底南下回巴比伦时穿科塞亚境
            // 沿格德罗西亚海岸西行：马里斯 → 帕塔拉 → 兰巴基亚 → 奥拉 → 特尔巴特 → 普拉 → 卡曼尼亚 → 波斯波利斯 → 苏萨 → 巴格达（欧皮斯一带） → 呼勒万（札格罗斯山门） → 哈马丹 → 科塞亚 → 巴比伦（前323年病逝，全剧终点）
            marchWaypoints: ['city_aluoer', 'city_patala', 'city_lanbaqiya', 'city_aola', 'city_teerbate', 'city_pula', 'city_kamanniya', 'city_xierzhan', 'city_bosibolisi', 'city_susa', 'city_bageda', 'city_hulewan', 'city_hamadan'],   // 🔴 [2026-10-02 主人令] 马里斯→阿罗尔（441km）合为一路（移出乌奇）；亚历山大沿海西返：阿罗尔 → 帕塔拉 → 兰巴基亚 → 奥拉 → 特尔巴特 → 普拉 → 卡曼尼亚 → 锡尔詹（底本第 196 行记「沿途过锡尔詹」；补它是因为 卡曼尼亚→波斯波利斯 直线 491 公里 > 400 上限）→ 波斯波利斯 → 苏萨 → 巴格达 → 呼勒万 → 哈马丹 → 科塞亚。🔴 [2026-10-02 逐场复核] ① 补「锡尔詹」一站（卡曼尼亚→波斯波利斯 直线 491 公里 > 400 上限；底本第 196 行本就记「沿途过锡尔詹」，且它在禁念名表里 —— 只作路网途经点，播报不念）；② 编辑器还报「波斯波利斯→苏萨 直线 508 公里」，**已核不处理**：这条腿的走线被路网锁死在皇家大道上（段表实测 波斯波利斯 → ⚔波斯门 → ⚔乌克西亚隘口 → 苏萨，正是史料那条路），而库里这条走廊上没有任何中间据点（实测直线 70 公里内 0 座城）、战场节点又不能当路标（试过，编辑器判红），故不改、不报
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 12000,
            attackerSourceCityId: 'city_malisi',
            attackerLegionName: '马其顿军团',
            defenderFactionId: 'kesaiya',
            defenderGeneralId: 'kesaiya_kashtiliash',
            defenderTroops: 8000,
            defenderSourceCityId: '',
            defenderLegionName: '科塞亚军团',
            result: 'attacker_win',
            autoEnterRTS: true,
        },
        // 野战按历史写战后归属：科塞亚人没有可易主的据点，本场不写据点归属
    },
];

/**
 * 取某一年要跑的剧本事件（该年第一条，没有则 null）。
 *
 * 消费者：
 *   · `HistoricalEventManager.updateEvents` —— 按年触发（剧本**独立于玩家**发生）；
 *   · `PlayerQuestSystem` 自动模式 —— 据此把玩家导向当年的剧本主角（主人 2026-09-11 定：
 *     「自动模式打开，玩家 -334 年要去找亚历山大接任务」）。
 */
export function getScriptEventForYear(year: number): HistoricalEvent | null {
    return HISTORICAL_EVENT_SCRIPT.find((e) => e.year === year) ?? null;
}

/**
 * 取某一年剧本的**攻方军团出发城**（= 玩家该去面见主角的地点）。
 * 攻方主帅不在城中时（已率军出征），调用方按既有「认人不认城」逻辑转成追出城，
 * 故此处只回答"哪座城"，不回答"人在不在"。
 */
export function getScriptProtagonistCityId(year: number): string | null {
    return getScriptEventForYear(year)?.fieldBattleData?.attackerSourceCityId ?? null;
}

/**
 * 🔴 [2026-09-19 主人定] **某位武将的那一场真实历史战役** —— 「一个武将一个真实的历史事件」。
 *
 * 主人原话：「我希望和武将对话后，加入武将军团，然后触发事件任务。……
 *   之前是时间来触发，我想改为找到武将后，第一次触发，每个武将一个真实的历史事件，然后就随机。」
 *
 * ── 判据只有一条：`HistoricalEvent.generalId === generalId` ──────────────
 *   ⚠️ **不看攻守双方主帅**（`siegeData` / `fieldBattleData` 里的 `attackerGeneralId` /
 *   `defenderGeneralId`）。那两位是「这一仗谁打谁」，本字段是「这一仗是谁的」。
 *   同一位武将完全可能出现在别人的事件里当对手 —— 那不是他自己的事件。
 *   （把两者混起来，会出现「打了伊苏斯，大流士也算打过了他自己那一场」这种错。）
 *
 * ── 排序：年份早的优先 ───────────────────────────────────────────────
 *   同一位武将将来若被挂上多条事件，**取年份最早的那一场** —— 与
 *   `PlayerQuestSystem.findNextAvailableBattlefield` 原本「按年份由先到后」的口径一致，
 *   结果确定、不随数据行序变化。
 *
 * @returns 该武将的事件；没挂（或挂了但没配战场）时返回 null，调用方回落走乱斗
 */
export function findHistoricalEventOfGeneral(
    generalId: string,
    cityPos: (id: string) => { lat: number; lng: number } | undefined,
): { event: HistoricalEvent; battlefieldId: string } | null {
    return findHistoricalEventsOfGeneral(generalId, cityPos)[0] ?? null;
}

/**
 * 🔴 [2026-09-19 主人定] **这位武将名下的全部史实战役**，按年份早→晚排好。
 *
 * 主人定案：「一位武将有 11 场戏时，**按年份早→晚依次解锁**」——
 * 亚历山大东征正是这种情况（他一个人打了 -334 格拉努库斯河 → -324 科塞亚 共 11 场）。
 *
 * 为什么要返回**数组**而不是单场：原先只取最早那一场，于是「打完第一场后
 * `isBattlefieldFought` 把它筛掉 → 返回 null → 这位武将再也没有事件可接」，
 * 11 场戏只能玩到 1 场。调用方（`PlayerQuestSystem.generalEventFor`）负责挑
 * 「此刻该接哪一场」，并在某场一时去不了（寻路失败）时退到下一场，不把整条线钉死。
 */
/**
 * 这场事件打的是**哪一块战场**（配不上 → null）。
 *
 * 🔴 抽成独立函数的原因：`findHistoricalEventsOfGeneral`（按**武将**查他在打哪块战场）
 *    与 `findGeneralOfBattlefield`（按**战场**反查归属武将）必须**同一口径**，
 *    否则剧本模式「先找该战场的武将」会与「找到武将接他的战役」两边打架。
 *
 * 攻城战**一律显式指名**，不比坐标：
 *   · 战场要塞（`targetBattlefieldId`，如一之谷 `bf_yinotani`）→ 直接就是那块战场；
 *   · 普通攻城（打下某座**据点**）→ 按战场记录上的 `eventCityId` 认。
 *   为什么不比坐标：战场标牌标在**史实地点**，而攻城打的是目标本身，两者差几十公里
 *   （一之谷 ↔ 最近据点相差 43km），任何合理的度容差都盖不住。
 */
export function resolveEventBattlefieldId(
    event: HistoricalEvent,
    cityPos: (id: string) => { lat: number; lng: number } | undefined,
): string | null {
    if (event.type === 'siege') {
        const sd = event.siegeData;
        if (sd?.targetBattlefieldId) {
            return BATTLEFIELDS.some((b) => b.id === sd.targetBattlefieldId) ? sd.targetBattlefieldId : null;
        }
        // 🔴 [2026-09-24 主人定「攻城战必须有据点……攻城战，你搞什么战场呀」] 攻城战没有战场记录：
        //    编号 = 被攻据点 + 年份（见 siegeSiteId），不画任何战场标牌
        const cityId = sd?.defenderCityId;
        return cityId ? siegeSiteId(cityId, event.year) : null;
    }
    // 野战：坐标由 battlefieldLocationOf 统一求出（与运行时、编辑器三处同口径）
    const loc = battlefieldLocationOf(event.siegeData ?? event.fieldBattleData, cityPos);
    return findBattlefieldOfGeneralEvent(event.year, loc)?.id ?? null;
}

/**
 * 🔴 [2026-09-19 主人令「也改成先找该战场的武将对话、随他一起去」]
 * **这块战场归属哪位武将** —— 剧本模式要先找到他、与他对话，再随他一起赶赴战场，
 * 而不是让玩家一个人跑到战场去就地选边。
 *
 * 判据 = 战场事件的 `generalId`（「这场仗是谁的」，不是攻守主帅）。
 * 同一块战场只会有一场事件（全面检查脚本 `_audit_events_full.ts` 保证），故返回唯一命中。
 */
export function findGeneralOfBattlefield(
    battlefieldId: string,
    cityPos: (id: string) => { lat: number; lng: number } | undefined,
): string | null {
    if (!battlefieldId) return null;
    for (const event of HISTORICAL_EVENT_SCRIPT) {
        if (!event.generalId) continue;
        if (resolveEventBattlefieldId(event, cityPos) === battlefieldId) return event.generalId;
    }
    return null;
}

export function findHistoricalEventsOfGeneral(
    generalId: string,
    cityPos: (id: string) => { lat: number; lng: number } | undefined,
): Array<{ event: HistoricalEvent; battlefieldId: string }> {
    if (!generalId) return [];
    const mine = HISTORICAL_EVENT_SCRIPT
        .filter((e) => e.generalId === generalId)
        .sort((a, b) => a.year - b.year || (a.season ?? 0) - (b.season ?? 0));
    const out: Array<{ event: HistoricalEvent; battlefieldId: string }> = [];
    for (const event of mine) {
        const bfId = resolveEventBattlefieldId(event, cityPos);
        if (bfId) out.push({ event, battlefieldId: bfId });
    }
    return out;
}

/**
 * ── 备注（写在此处免得散落各处）────────────────────────────────
 *
 * 1. 🔴 [2026-09-11 主人定] 守方统帅已定为 **阿尔西提斯**，本役波斯方最高统帅，
 *    数据零新增（立绘/技能/世纪/时代/精锐全齐）。原提过的**门农**作废，
 *    未在库中建立任何记录——将来若要用他，需补 `general-skills/profiles`、
 *    `GeneralCenturies`、`GeneralEra`，且**立绘必须主人提供**
 *    （铁律：AI 永久禁止新增/分配/替换任何武将立绘）。
 *
 * 2. 引擎：本文件由 `HistoricalEventManager.updateEvents` 按 `year` 逐年驱动（剧本独立于玩家发生），
 *    已复活（2026-09-11）；`SCRIPT_BATTLE_ENABLED` 已于 2026-09-12 翻回 true（抵达野战场即开战）。
 */
