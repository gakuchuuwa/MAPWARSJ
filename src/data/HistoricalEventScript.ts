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
    {
        year: -334,
        // 春（0）。史料记此役在 5 月前后；主人未指定季节，取春。
        season: 0,
        type: 'field_battle',
        title: '公元前334年 格拉尼库斯河战役',
        description: '马其顿大胜：亚历山大强渡急流击溃波斯联军，小亚细亚门户大开；阿尔西提斯战后自尽。',
        fieldBattleData: {
            title: '格拉尼库斯河战役',
            description: '亚历山大亲率伙伴骑兵强渡格拉尼库斯河，击溃波斯联军；阿尔西提斯战后自尽。',

            // 英文维基 Battle of the Granicus 信息框坐标；本役是野战，故用 location 而非 locationCityId。
            location: { lat: 40.3167, lng: 27.2811 },
            // 🔴 [2026-09-23] 加特洛伊：阿里安《亚历山大远征记》I.11——亚历山大渡赫勒斯滂后先登岸伊利昂（特洛伊）祭祀，再会合大军进军格拉尼库斯河
            marchWaypoints: ['city_anfeibolisi', 'city_yanghe', 'city_teluoyi'],

            // ── 攻方：马其顿 亚历山大 ──
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            // 🔴 [2026-09-16 主人定]「原文35000，战场就要35000」= 播报与数据必须同口径。
            // 🔴 [2026-09-23 主人定「一切以维基百科为准」] 数据改取英文维基 Battle of the Granicus 信息框 18100
            //    （步兵一万三千、骑兵五千一百），播报随之改成同一组数字；编辑器 ⑪ 自动核对。
            attackerTroops: 18100,
            attackerSourceCityId: 'city_salonica',      // 佩拉（马其顿首都，东征出发点）
            // 🔴 [2026-09-23] 剧本军团（第四层，src/data/scriptLegions.ts）：按此役史实配三兵种，乱斗不受影响
            attackerLegionName: '马其顿军',

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
            defenderLegionName: '波斯总督联军',   // 剧本军团：小亚细亚诸总督联军

            result: 'attacker_win',                     // 写真历史：马其顿必胜
            autoEnterRTS: true,                          // 进战术模式（13）
        },

        // 「据点归亚历山大」的落点：达斯基利翁（波斯方本营、阿尔西提斯治所）。
        // 主人只说「据点归亚历山大」未指定具体哪座城，此处依史实选定，可一句话更换。
        cityUpdates: [{ cityId: 'city_dasijiliweng', factionId: 'maqidun' }],
        generalId: 'gen_alexander_great',
        commanderUnit: 'hero_mounted_alexander',   // 主将队：素材样貌为骑马的亚历山大
        // 对手主将队：阿尔塔弗涅斯——阿契美尼德萨迪斯总督，与此役小亚细亚诸总督同文化同身份；素材样貌为金甲红马衣的波斯贵族骑将
        foeCommanderUnit: 'hero_artaphernes',
        // 🔴 [2026-09-23] 武将邀约对白。史料：东征名义为报复薛西斯焚毁雅典神庙（阿里安《亚历山大远征记》II.14 致大流士书）；
        //    波斯小亚细亚诸总督集结于格拉尼库斯河迎战（同书 I.12）。
        // 🔴 [2026-09-23] 途经但前334年还不存在的据点：鲁西翁为中世纪地名，格拉尼库斯为按战役起名的城寨
        absentCities: ['city_luxiweng', 'city_gelanikusi'],
        inviteText: '朋友，你来得正好。我将渡过赫勒斯滂，进兵亚细亚，向波斯讨还当年薛西斯焚毁雅典神庙的旧账。波斯诸总督已在格拉尼库斯河畔集结，我要亲率伙伴骑兵破敌。你可愿随我东征？',
        // 🔴 [2026-09-23] 资料清单：每项依据与可信级别（src/data/eventSources.ts），编辑器里每项必填
        sources: { battle: { level: 'fact', text: '英文维基百科 Battle of the Granicus：格拉尼库斯河战役，野战，亚历山大强渡河流进攻据守东岸的波斯军。' }, time: { level: 'fact', text: '英文维基百科 Battle of the Granicus：前334年5月，初春自马其顿出发，20天抵塞斯托斯，季节取春。' }, place: { level: 'fact', text: '英文维基百科 Battle of the Granicus：格拉尼库斯河即今土耳其比加河；坐标取信息框 40.3167,27.2811。' }, attacker: { level: 'fact', text: '英文维基百科 Battle of the Granicus：马其顿与希腊同盟，亚历山大亲统右翼，帕曼纽统左翼。' }, attackerTroops: { level: 'fact', text: '英文维基百科 Battle of the Granicus 信息框：马其顿军投入此役共18100人。' }, attackerLegion: { level: 'fact', text: '英文维基百科 Ancient Macedonian army：史称马其顿军；伙伴骑兵作矛头、方阵跟进、克里特弓箭手掩护，前358至前331年一贯如此，故前骑兵、中步兵、后远程。比例按 Battle of the Granicus 信息框：骑兵5100、步兵12000、远程1000，步兵最多，取鱼鳞阵 前3中4后2，远程最少只能2人。' }, defender: { level: 'fact', text: '英文维基百科 Battle of the Granicus：阿契美尼德小亚细亚诸总督联军，古史未明言主帅，现代学者认为赫勒斯滂弗里吉亚总督阿尔西提斯总领；门农等同在军中。' }, defenderTroops: { level: 'fact', text: '英文维基百科 Battle of the Granicus 信息框：波斯军14000至40000人，按标准取区间中值27000。' }, defenderLegion: { level: 'popular', text: '英文维基百科 Battle of the Granicus：诸总督联军无专名，称波斯总督联军；骑兵沿东岸列阵在前，步兵列其后高地，含数千希腊雇佣兵；信息框中值骑兵15000、步兵12000，取雁行阵 前骑兵4中步兵3后远程2；远程无明载，按阿契美尼德军以弓手著称补一排。' }, route: { level: 'fact', text: '英文维基百科 Battle of the Granicus：自马其顿经色雷斯至塞斯托斯，大军由塞斯托斯渡至阿拜多斯，亚历山大自埃莱乌斯渡海登西格翁角，谒伊利昂，经阿里斯巴、佩尔科特、兰普萨库斯至格拉尼库斯河。游戏路线：佩拉、安菲波利斯、羊河近塞斯托斯、坐船至特洛伊即伊利昂、沿海岸东进；途经据点鲁西翁为中世纪地名、格拉尼库斯为按战役起名的城寨，前334年皆无此城，列入那一年不存在，路照走、城不显示。' }, result: { level: 'fact', text: '英文维基百科 Battle of the Granicus：马其顿胜，亚历山大取得小亚细亚半壁；战后据点达斯基利翁即阿尔西提斯治所归马其顿。' }, invite: { level: 'fact', text: '阿里安《亚历山大远征记》II.14 亚历山大致大流士书：东征名义为报复波斯当年入侵希腊；对白措辞为撰写，史事有据。' }, briefing: { level: 'fact', text: '英文维基百科 Battle of the Granicus：门农献焦土之策被拒、帕曼纽劝明晨再渡被拒；波斯骑兵沿东岸列阵、希腊雇佣兵在后；播报兵力只写大军，不写确数。英文维基百科 Alexander the Great：生于前356年7月，此役时周岁二十一，按中国虚岁计二十二。' } },
    },
    {
        year: -333,
        // 秋（2）。史料记此役在前 333 年 11 月。
        season: 2,
        type: 'field_battle',
        title: '公元前333年 伊苏斯战役',
        description: '马其顿决定性胜利：亚历山大强渡皮纳鲁斯河直扑大流士御驾；大流士弃车逃离，王室家眷悉数被俘。',
        fieldBattleData: {
            title: '伊苏斯战役',
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
            marchWaypoints: ['city_ankala', 'city_yikeniwumu', 'city_adana'],

            // ── 攻方：马其顿 亚历山大 ──
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerLegionName: '马其顿军',   // 剧本军团：亚历山大所率马其顿军，整场东征同一支
            attackerTroops: 37000,                 // 英文维基 Battle of Issus 信息框：约 37000
            attackerSourceCityId: 'city_geerdiweng',   // 戈尔迪乌姆：前333年春亚历山大在此斩断戈尔迪之结后南下

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
            defenderLegionName: '阿契美尼德军',   // 剧本军团：大流士三世所率阿契美尼德王军

            result: 'attacker_win',
            autoEnterRTS: true,
        },

        // 🔴 [2026-09-12 主人定] **不写 `cityUpdates`**：伊苏斯是**战场**（`bf_yisusi`），
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
        foeCommanderUnit: 'hero_artaphernes',
        // 军团出发据点：亚历山大前333年春在戈尔迪乌姆，不回佩拉（英文维基 Alexander the Great）
        startCityId: 'city_geerdiweng',
        // 阿达纳挂的「蛇堡」是中世纪亚美尼亚城堡，前333年尚无 → 本场不显示该城（路照走）
        absentCities: ['city_adana'],
        inviteText: '朋友，你来得正好。我在戈尔迪乌姆斩断了那个无人能解的结，传说解开它的人将成为亚细亚之王。大流士已在巴比伦集结大军，我要越过托罗斯山，进入奇里乞亚迎战他。你可愿随我同往？',
        // 🔴 [2026-09-23] 资料清单：每项依据与可信级别（src/data/eventSources.ts）
        sources: { battle: { level: 'fact', text: '英文维基百科 Battle of Issus：伊苏斯战役，野战，两军在皮纳鲁斯河两岸会战。' }, time: { level: 'fact', text: '英文维基百科 Battle of Issus 信息框：前333年11月5日，季节取秋。' }, place: { level: 'fact', text: '英文维基百科 Battle of Issus：伊苏斯城以南的皮纳鲁斯河，今土耳其哈塔伊省；坐标取信息框 36.7525,36.1923。海湾到群山之间仅2.6公里。' }, attacker: { level: 'fact', text: '英文维基百科 Battle of Issus：马其顿与希腊同盟，亚历山大亲统右翼伙伴骑兵，帕曼纽统左翼。' }, attackerTroops: { level: 'fact', text: '英文维基百科 Battle of Issus 信息框：马其顿军共约37000人。' }, attackerLegion: { level: 'fact', text: '同格拉尼库斯河战役：马其顿军，前骑兵、中方阵、后远程，鱼鳞阵；此役亚历山大仍亲率伙伴骑兵为决胜一击。' }, defender: { level: 'fact', text: '英文维基百科 Battle of Issus：阿契美尼德帝国，大流士三世亲征。' }, defenderTroops: { level: 'fact', text: '英文维基百科 Battle of Issus 信息框：现代估计5万至10万，中值75000；主人定守方不超过攻方2倍，37000×2=74000，在区间内，取74000。' }, defenderLegion: { level: 'fact', text: '英文维基百科 Military of the Achaemenid Empire：职业常备军统称 spāda，后世通称阿契美尼德军。英文维基百科 Battle of Issus：骑兵约1.8万、长生军与希腊雇佣兵及亚美尼亚步兵约6万、轻步兵3万至8万；波斯骑兵率先渡河冲击，故前骑兵中步兵后远程，鹤翼阵2-4-3。' }, route: { level: 'fact', text: '英文维基百科 Alexander the Great：亚历山大在弗里吉亚古都戈尔迪乌姆斩断戈尔迪之结，前333年春越过托罗斯山进入奇里乞亚，病后向叙利亚进军，又回师奇里乞亚在伊苏斯击败大流士。英文维基百科 Battle of Issus：亚历山大驻塔尔苏斯，得知大流士在巴比伦集结大军后南下。游戏路线：戈尔迪乌姆、安卡拉即古安库拉、伊科尼乌姆即古吕考尼亚（史载经卡帕多西亚过奇里乞亚关，提亚纳与奇里乞亚门项目里没有据点，按铁律用附近已有据点连接、绝不新建，故以路网实走的伊科尼乌姆作中间路标）、阿达纳即塔尔苏斯附近、伊苏斯。' }, result: { level: 'fact', text: '英文维基百科 Battle of Issus：马其顿胜，大流士弃军逃走，母亲、妻子、两个女儿被俘；伊苏斯是战场，无据点易主。' }, invite: { level: 'fact', text: '英文维基百科 Alexander the Great：戈尔迪乌姆斩断戈尔迪之结，传说能解开者将为亚细亚之王；英文维基百科 Battle of Issus：大流士在巴比伦集结大军。对白措辞为撰写，史事有据。' }, briefing: { level: 'fact', text: '英文维基百科 Battle of Issus：海湾到群山仅2.6公里即两英里；大流士绕到马其顿军后方占领伊苏斯、砍去伤病员之手；马其顿军约3.7万，波斯军按中值7.5万，播报写三万七千、七万五千；方阵居中、亚历山大率伙伴骑兵在右翼。' } },
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
        description: '马其顿军全面彻底的胜利：亚历山大历时七月强行填筑跨海长堤攻破推罗海岛坚固石墙；拔除波斯在地中海的海军基地，推罗城易主归马其顿。',
        siegeData: {
            title: '推罗战役',                     // 🔴 横幅一律显示战役名
            description: '亚历山大率数万步骑大军填海筑堤直逼海岛石墙，攻破推罗要塞；推罗国王阿泽米尔库斯率守军力战，推罗陷落。',
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerLegionName: '马其顿军',   // 剧本军团：亚历山大所率马其顿军，整场东征同一支
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
            defenderLegionName: '推罗军',
            defenderCityId: 'city_tuile',
        },
        generalId: 'gen_alexander_great',
        // 赶路播报：攻城战没有战场记录，播报存在事件本身（原在战场表 bf_tuile 上，已随战场记录移除）
        briefing: '公元前332年孟春，地中海东岸的推罗古城峭立海中，惊涛拍岸。这座腓尼基海上霸主依托距大陆近千米的天然海岛与深沟高垒，断然拒绝马其顿军队入城祭祀的要求，倚仗舰队与千余守军负隅顽抗。为了彻底剪除波斯帝国的制海权，亚历山大下令伐尽黎巴嫩山脉的林木，在惊涛骇浪间向孤岛强行构筑一道六十米宽的巍峨筑道。数月间，推罗人以火船冲撞、弩炮轰击与蛙人破障死守海疆，马其顿则调集塞浦路斯巨舰与攻城石弩日夜推进。漫天箭雨穿透海雾，两座高达百尺的攻城木塔正顶着沸油逼近被砸开缺口的海墙，一场决定东地中海命运的血战已扑面而来。',
        commanderUnit: 'hero_mounted_alexander',   // 主将队：素材样貌为骑马的亚历山大
        inviteText: '朋友，你来得正好。推罗人拒绝我入城向他们的神献祭，自恃海岛天险、城高墙厚。我已下令伐尽黎巴嫩山的雪松，要在海上筑一道长堤，把他们的海军一并拔掉。你可愿随我一同围城？',
        sources: { battle: { level: 'fact', text: '英文维基百科 Siege of Tyre (332 BC)：推罗围城战，攻城战；马其顿军填海筑堤攻打海岛城邦推罗。' }, time: { level: 'fact', text: '英文维基百科 Siege of Tyre：前332年1月起围，历约七个月至夏末；季节取春。' }, place: { level: 'fact', text: '英文维基百科 Siege of Tyre (332 BC)：推罗为今黎巴嫩海岸外约一千米的海岛城邦；本场是攻城战，地点就是被攻据点「推罗」（city_tuile），坐标 33.2709,35.1962。' }, attacker: { level: 'fact', text: '英文维基百科 Siege of Tyre：马其顿与希腊同盟，亚历山大亲统。' }, attackerTroops: { level: 'fact', text: '英文维基百科 Alexander the Great 与 Siege of Tyre：伊苏斯战后马其顿军约 35,000–40,000 人，按标准取区间中值 37500。' }, attackerLegion: { level: 'fact', text: '同格拉尼库斯河战役：马其顿军，前伙伴骑兵、中方阵步兵、后克里特弓箭手，鱼鳞阵 3-4-2。' }, defender: { level: 'fact', text: '英文维基百科 Siege of Tyre：推罗城邦（腓尼基/迦南），末代国王阿泽米尔库斯；时属阿契美尼德波斯治下。' }, defenderTroops: { level: 'fact', text: '英文维基百科 Siege of Tyre：城内正规守军约 8,000–10,000 人，另有避难军民 3–4 万（非战斗人员，不计入）。按标准取信息框区间中值 9000。' }, defenderLegion: { level: 'fact', text: '英文维基百科 Siege of Tyre 与阿里安《亚历山大远征记》：推罗守军以步兵守城为主，城头弩炮与弓手据墙射击，骑兵最少（腓尼基海岛城邦不产骑兵）；三排 前远程3 / 中步兵4 / 后骑兵2，取鱼鳞阵，落成剧本军团「推罗军」。' }, route: { level: 'fact', text: '英文维基百科 Alexander the Great 与 Siege of Tyre (332 BC)：前333年11月伊苏斯战役后，亚历山大沿海岸南下腓尼基，阿拉多斯、比布鲁斯以次归附，经西顿（推罗以北约40公里）于前332年1月自北面进围推罗。游戏路线：自上一处战场（伊苏斯）直接开拔，沿海岸大道南下抵推罗 —— 本场不写出发据点、不设航点（出发地按「同一武将上一场打完的地方」取，那一年还不存在的城不当落脚点）。阿卡在推罗以南39公里、属反方向，不作航点；项目没有西顿、比布鲁斯据点，按铁律用附近已有据点连接、绝不新建。' }, result: { level: 'fact', text: '英文维基百科 Siege of Tyre：马其顿胜；城破后守军阵亡约 6,000–8,000，平民多被贩为奴；推罗易主归马其顿，跨海长堤淤积使海岛此后永久成为半岛。' }, invite: { level: 'fact', text: '英文维基百科 Siege of Tyre：推罗人拒绝亚历山大入城向城中的麦勒卡特（希腊称赫拉克勒斯）献祭，是围城的直接导火索。对白措辞为撰写，史事有据。' }, briefing: { level: 'fact', text: '英文维基百科 Siege of Tyre：跨海长堤宽约六十米、城距大陆近千米、推罗战船约八十艘、城破守军阵亡约 6,000–8,000。播报里兵力只写「数万」「千余」，不写确数。' } },
        foeCommanderUnit: 'hero_brasidas',
        // 出发据点不写：剧本期连续行军从伊苏斯战场直接开拔；玩家不在军中时，默认在上一场打完处附近那一年已有的城（阿达纳）
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
        inviteText: '朋友，你来得正好。前头的推罗已经拿下，攻城器械也一并运到了。加沙这座城踞在通往埃及的大道上，巴提斯不肯低头——他以为一道高墙就能挡住我。你可愿随我再围一次城？',
        sources: { battle: { level: 'fact', text: '英文维基百科 Siege of Gaza (332 BC)：亚历山大东征中的攻城战，前332年马其顿军攻取加沙要塞。' }, time: { level: 'fact', text: '英文维基百科 Siege of Gaza (332 BC)：前332年10月破城（围城历时约两月；日文维基作三个月，从英文）。季节取秋。' }, place: { level: 'fact', text: '英文维基百科 Siege of Gaza (332 BC)：加沙要塞踞于高地、距海约五英里，控扼叙利亚通往埃及的大道，城墙高逾十八米；坐标取本据点记录 31.5017,34.4668。' }, attacker: { level: 'fact', text: '英文维基百科 Siege of Gaza (332 BC)：马其顿军，亚历山大亲统。' }, attackerTroops: { level: 'inferred', text: '英文维基百科 Siege of Gaza (332 BC) 未给攻方兵数；同一支马其顿军推罗战后未获大补，沿用伊苏斯与推罗两场的 35,000–40,000，取 37500 —— 合理推定。' }, attackerLegion: { level: 'fact', text: '同东征诸役：马其顿军，前伙伴骑兵、中方阵步兵、后克里特弓箭手，鱼鳞阵 3-4-2。' }, defender: { level: 'fact', text: '英文维基百科 Siege of Gaza (332 BC)：要塞守将巴提斯（Batis），时属阿契美尼德波斯治下，拒不投降。' }, defenderTroops: { level: 'inferred', text: '英文维基百科 Siege of Gaza (332 BC)：城破时加沙方面阵亡约一万（男丁被杀、妇孺为奴），据此守方兵力取 10000 —— 合理推定（史无守军确数）。' }, defenderLegion: { level: 'fact', text: '英文维基百科 Siege of Gaza (332 BC)：守方为波斯守军与阿拉伯雇佣兵（本据点精锐番号即「加沙雇佣兵」），凭高墙、土山与弩炮据守；番号取阿契美尼德军（巴提斯所部属波斯军系）。' }, route: { level: 'fact', text: '英文维基百科 Siege of Gaza (332 BC) 与 Siege of Tyre (332 BC)：亚历山大前332年夏取推罗后率军南下进围加沙，并把推罗用过的攻城器械一并运来破其高墙（承前一场）。游戏路线：自上一处战场（推罗）直接开拔南下抵加沙，路网取道阿音贾鲁特—耶路撒冷—加沙，273 公里（直线 208）。战后：自加沙南下埃及（佩鲁西姆—孟菲斯），为下一场自孟菲斯出发的战役铺路。' }, result: { level: 'fact', text: '英文维基百科 Siege of Gaza (332 BC)：马其顿胜。城破后男丁被杀、妇孺贩为奴，加沙方面阵亡约一万；巴提斯拒不投降，按库尔提乌斯所记被拖于战车之后处死；加沙入马其顿之手，通往埃及的门户就此打开。' }, invite: { level: 'fact', text: '邀约对白所据史事：英文维基百科 Siege of Gaza (332 BC)：巴提斯拒不投降，亚历山大以推罗运来的攻城器械破墙，三次强攻后入城；对白措辞为撰写。' }, briefing: { level: 'fact', text: '英文维基百科 Siege of Gaza (332 BC)：加沙踞高地、城墙高逾十八米，马其顿军筑土山、调推罗攻城器械破墙；守军曾出击烧器械，亚历山大在反击中肩部受伤。文案按主人规矩不写兵力确数。' } },
        commanderUnit: 'hero_mounted_alexander',
        foeCommanderUnit: 'hero_aristides',
        type: 'siege',
        title: '公元前332年 加沙战役',
        description: '马其顿军取加沙：亚历山大调来推罗用过的攻城器械，破其高地坚城，三次强攻后入城；守将巴提斯拒不投降被处死，加沙易主，通往埃及的门户就此打开。',
        siegeData: {
            title: '加沙战役',
            description: '巴提斯凭高地坚城与阿拉伯雇佣兵死守；马其顿军筑土山、架推罗器械破墙，三次强攻后破城。',
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 37500,
            attackerSourceCityId: 'city_tuile',
            attackerLegionName: '马其顿军',
            defenderGeneralId: 'feilisidin_batisi',
            defenderTroops: 10000,
            defenderCityId: 'city_jiasa',
            defenderLegionName: '阿契美尼德军',
            result: 'attacker_win',
            autoEnterRTS: true,
        },
        cityUpdates: [{ cityId: 'city_jiasa', factionId: 'maqidun' }],
    },
    {
        year: -331,
        season: 2,                                   // 秋（史料：前331年10月1日）
        type: 'field_battle',
        title: '公元前331年 高加米拉战役',
        description: '马其顿决定性胜利：大流士三世在平野布下镰刀战车与两翼骑兵，亚历山大以方阵居中牵制、亲率伙伴骑兵自右翼撕开缺口，直扑大流士本阵；大流士弃阵东逃，美索不达米亚与波斯半壁就此易主。',
        fieldBattleData: {
            title: '高加米拉战役',
            description: '大流士以镰刀战车与两翼骑兵猛攻，帕曼纽左翼死守；亚历山大率伙伴骑兵自右翼插入缺口，直取大流士本阵，波斯全军崩溃。',
            // 摩苏尔以东广阔平原（北纬 36°21'46", 东经 43°15'00"）
            location: { lat: 36.56, lng: 43.444 },
            // 🔴 [2026-09-23 主人报「船队不对呀」：马其顿军沿叙利亚海岸坐船] 英文维基 Battle of Gaugamela：
            //    前331年晚春或初夏自埃及出发，向东北穿过叙利亚，七八月至幼发拉底河塔普萨库斯，九月下旬至底格里斯河。
            //    路标取沿途已有据点：加沙（前332年加沙围城）、阿卡（推罗已是战场，取其近旁）、大马士革、
            //    阿勒颇（近塔普萨库斯）、埃德萨（渡幼发拉底后东进），全程陆路。
            marchWaypoints: ['city_peiluximu', 'city_mengfeisi', 'city_yalishanda', 'city_peiluximu', 'city_jiasa', 'city_tuile', 'city_damasikusi', 'city_alepo', 'city_aidesa', 'city_niniwei'],

            // ── 攻方：马其顿与希腊联军 亚历山大大帝 ──
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerLegionName: '马其顿军',   // 剧本军团：亚历山大所率马其顿军，整场东征同一支
            attackerTroops: 47000,                   // 史料 47,000 人（约 40,000 步兵 + 7,000 骑兵）
            attackerSourceCityId: 'city_mengfeisi',

            // ── 守方：波斯阿契美尼德帝国大军 大流士三世 ──
            defenderFactionId: 'aqimeinide',
            defenderGeneralId: 'daliushi_iii',
            defenderTroops: 85000,                   // 现代史学界估计 50,000 至 100,000 人（中高值）
            defenderSourceCityId: 'city_bosibolisi',

            result: 'attacker_win',                  // 写真历史：马其顿决定性胜利
            autoEnterRTS: true,                      // 进战术模式（13）
            defenderLegionName: '阿契美尼德军',
        },
        generalId: 'gen_alexander_great',
        // 军团出发据点：前331年亚历山大自埃及出发（英文维基 Battle of Gaugamela），不是上一场推罗近旁的阿卡
        commanderUnit: 'hero_mounted_alexander',   // 主将队：素材样貌为骑马的亚历山大
        inviteText: '朋友，你来得正好。大流士又派人来了，这回连女儿和半个帝国都舍得给——我都没要。他挑了块铲得干干净净的平野，好让他的镰刀战车跑起来。可惜他也给我留了一条路：他的中军。你可愿随我走这一趟？',
        sources: { battle: { level: 'fact', text: '英文/中文维基百科 Battle of Gaugamela（高加米拉战役）：前331年马其顿与阿契美尼德波斯的决战，野战。' }, time: { level: 'fact', text: '维基百科高加米拉战役信息框：前331年10月1日，季节取秋。' }, place: { level: 'fact', text: '维基百科高加米拉战役信息框：战场可能在今伊拉克库尔德斯坦艾比尔附近的提尔·高美尔（Tel Gomel）周遭，坐标 36.56,43.444。' }, attacker: { level: 'fact', text: '维基百科高加米拉战役：马其顿王国与泛希腊同盟，亚历山大亲统，帕曼纽、菲罗塔斯、克拉特鲁斯、佩尔狄卡斯等分领各部。' }, attackerTroops: { level: 'fact', text: '维基百科高加米拉战役信息框：40,000 名步兵 + 7,000 名骑兵 = 47,000（Green 2013）。' }, attackerLegion: { level: 'fact', text: '维基百科高加米拉战役「Initial dispositions」：马其顿方阵居中双列推进，亚历山大率伙伴骑兵自右翼突破，帕曼纽率色萨利与色雷斯骑兵守左翼，克里特与希腊雇佣兵在右中；编成仍取马其顿军（前伙伴骑兵、中方阵步兵、后克里特弓箭手，鱼鳞阵 3-4-2）。' }, defender: { level: 'fact', text: '维基百科高加米拉战役：阿契美尼德帝国，大流士三世亲统；贝苏斯领左翼（巴克特里亚、斯基泰等），马扎欧斯领右翼（叙利亚、米底、美索不达米亚等）。' }, defenderTroops: { level: 'fact', text: '维基百科高加米拉战役信息框：现代文献估计 50,000–120,000，按标准取区间中值 85,000（守/攻 = 1.81，在 1:2 之内）。' }, defenderLegion: { level: 'fact', text: '维基百科高加米拉战役「Initial dispositions」：大流士居中率精锐步兵（「苹果持兵」/希腊人所称长生军）与马尔迪亚弓手，两翼为各地骑兵，阵前布镰刀战车，另有十五头印度战象（战中未见出动、后在营中被缴，推为撤走）；编成取剧本军团「阿契美尼德军」（同一支波斯军，与伊苏斯、格拉尼库斯同一番号）。' }, route: { level: 'fact', text: '维基百科 Battle of Gaugamela 与 Siege of Gaza (332 BC)：加沙战后亚历山大南下埃及，波斯埃及总督马扎克斯不战而降（埃及无战事）；前331年在孟菲斯受冕为法老，并于尼罗河口建亚历山大城，随后西行锡瓦求阿蒙神谕，再回师北上推罗，经叙利亚北渡幼发拉底，东进至高加米拉。游戏路线：自上一处战场（加沙）开拔 → 佩鲁西姆 → 孟菲斯 → 亚历山大城 → 加沙 → 推罗 → 大马士革 → 阿勒颇 → 埃德萨 → 尼尼微 → 高加米拉。（原数据写「自孟菲斯出发」＝把军团白送过去，已改为走出去。）' }, result: { level: 'fact', text: '维基百科高加米拉战役：马其顿决定性胜利。大流士弃阵东逃，波斯帝国半壁江山与巴比伦在内的美索不达米亚全境入亚历山大之手；阿契美尼德方面伤亡据库尔提乌斯约四万，马其顿方面伤亡极轻（阿里安记百名步兵、千名骑兵）。本场为野战，不涉据点易主。' }, invite: { level: 'fact', text: '邀约对白所据史事：维基百科高加米拉战役：大流士三世三次遣使求和（赎回眷属、割让哈吕斯河以西、乃至愿与亚历山大平起平坐），亚历山大皆拒；决战前大流士在巴比伦重整大军、平野布阵以待。对白措辞为撰写。' }, briefing: { level: 'fact', text: '维基百科高加米拉战役：大流士为之铲平战场植被以便镰刀战车驰突，并布十五头印度战象（战中撤回）；马其顿方阵居中推进、两翼后斜，亚历山大率伙伴骑兵绕至右翼缺口直扑大流士本阵。文案按主人规矩不写兵力确数。' } },
        foeCommanderUnit: 'hero_artaphernes',
    },

    // ── 由战场事件编辑器生成（/battlefield-editor.html）──
    {
        year: -331,
        season: 3,
        generalId: 'gen_alexander_great',
        inviteText: '朋友，你来得正好。前头那座山里有乌克西亚人——连大流士的父辈过境，也得给他们一笔买路钱。他们派了人来，要我也照付。我答应了，说定日子走大道、如约纳贡。可你想想：他们既然在山口等着收钱，就绝不会想到我从北边的山路上去，更不会想到克拉特鲁斯已经站在他们的退路上。走吧，这一趟不费多少工夫，却能让通往波斯腹地的山门全开。',
        sources: { battle: { level: 'fact', text: '英文维基百科 Battle of the Uxian Defile：乌克西亚隘口之战，马其顿军对扎格罗斯山乌克西亚部落的野战，战场在苏萨以东的山道。' }, time: { level: 'fact', text: '英文维基百科 Battle of the Uxian Defile 信息框 date = 331 BC；该条目背景节记亚历山大取巴比伦、休整数日，再走二十日至苏萨，自苏萨向山地隘口进军；日文维基百科同条目记此役为前331年12月，故季节取冬。' }, place: { level: 'inferred', text: '英文维基百科 Battle of the Uxian Defile 信息框 location = East of Susa，coordinates 32°11′26″N 48°15′2″E；🔴 该坐标与苏萨城条目的 32°11′26″N 48°15′28″E 仅差约 0.7 公里，即信息框标的其实就是苏萨城本身，与同一条目正文「East of Susa」「战斗发生在苏萨与波斯波利斯之间的山脉」自相矛盾。英文维基百科 Uxians 条目、日文维基百科与波斯文维基百科均未给隘口坐标。故按主人定口径「查不到用知名度最大的说法，再没有按史地合理推定」：以正文为准，取苏萨以东约六十公里、去波斯波利斯大道上进入扎格罗斯山的第一处山口，坐标 32.0457,48.8506，取自该大道在路网上的实际走线，战场正落在道上。可信级别：合理推定。' }, attacker: { level: 'fact', text: '英文维基百科 Battle of the Uxian Defile：马其顿与科林斯同盟，亚历山大亲统；战斗中克拉特鲁斯率盾卫占据高地，亚历山大自率其余将士走北路。' }, attackerTroops: { level: 'fact', text: '英文维基百科 Battle of the Uxian Defile 信息框 strength1 = 8,000 infantry，攻方兵力取 8000。' }, attackerLegion: { level: 'fact', text: '同格拉尼库斯、伊苏斯、推罗、加沙、高加米拉五场：马其顿军，前伙伴骑兵、中方阵步兵、后克里特弓箭手，鱼鳞阵 3-4-2；同一支军队整场战争不换。' }, defender: { level: 'fact', text: '英文维基百科 Battle of the Uxian Defile 信息框 combatant2 = Uxians，commander2 = Madates；英文维基百科 Uxians：乌克西亚人为扎格罗斯山中非伊朗裔半游牧部落联盟，分平原定居与山地游牧两支，平原一支降、山地一支索要买路钱，由马达泰斯统领。' }, defenderTroops: { level: 'inferred', text: '英文维基百科 Battle of the Uxian Defile 信息框 strength2 = Unknown，该条目与英文维基百科 Uxians 均未给守方兵数；波斯文维基无对应条目可补。按史地合理推定：乌克西亚为半游牧部落联盟，既能向历代波斯大王索取过路贡、又以险隘伏击马其顿全军，部众当以千计而不下数千，取 5000。可信级别：合理推定。' }, defenderLegion: { level: 'fact', text: '英文维基百科 Uxians：该部落联盟以放牧与劫掠为生，被 Nearchus 列为西南四大掠夺民族之一；Battle of the Uxian Defile 记其据山隘设伏、退往高地后被合围。故编成以前远程、中步兵、后骑兵，取雁行阵 4-3-2，落成剧本军团「乌克西亚军」。' }, route: { level: 'fact', text: '英文维基百科 Battle of the Uxian Defile 背景节：高加米拉战后亚历山大进抵巴比伦，总督马扎欧斯献城，休整数日并设为第二基地；自巴比伦走二十日至冬都苏萨，自苏萨向山地隘口进军。游戏路线：自上一处战场（高加米拉）开拔 → 尼尼微 → 亚述城 → 巴比伦 → 苏萨 → 乌克西亚隘口；苏萨以东一段按主人 2026-09-24 新建的巴比伦—苏萨道路与苏萨—波斯波利斯大道走，编辑器实测各段绕远不超过 1.32 倍。⚠️ 尼尼微与前 612 年被毁的亚述城在当年已属废墟，只作路网途经点使用，本场播报不再提这两座城。' }, result: { level: 'fact', text: '英文维基百科 Battle of the Uxian Defile：马其顿胜，部落战士被四面合围后遭歼灭，幸存者求和，议定年贡 100 匹马、500 头牛、3 万只羊；英文维基百科 Uxians：此后乌克西亚人一度重获独立，大流士三世之母西绪甘比斯曾出面交涉释放以马达泰斯为首的乌克西亚俘虏。本场为野战，不涉据点易主。' }, invite: { level: 'fact', text: '邀约对白所据史事：英文维基百科 Battle of the Uxian Defile：乌克西亚人遣使要求亚历山大照波斯旧例交纳买路钱，亚历山大应下，称将按约定之日走大道纳贡，实则分兵走北路；对白措辞为撰写。' }, briefing: { level: 'fact', text: '英文维基百科 Battle of the Uxian Defile 与 Uxians：亚历山大因巴比伦城墙高厚、墙内农田足以久守而唯恐波斯人据城重整，结果马扎欧斯献城并留任总督；取苏萨得金甚多，并送金回马其顿供安提帕特对斯巴达作战；乌克西亚人半游牧、靠放牧劫掠为生并向过境军队索费。文案按主人规矩不写兵力确数。' } },
        commanderUnit: 'hero_mounted_alexander',
        foeCommanderUnit: 'hero_artaphernes',
        type: 'field_battle',
        title: '公元前331年 乌克西亚隘口战役',
        description: '马其顿军获胜：亚历山大以分兵之策破了乌克西亚隘口。克拉特鲁斯先据高地断其退路，亚历山大亲率精锐走北路袭取部落村落，再以接连强行军夺下隘口；乌克西亚人退往高地，正撞上守候已久的方阵，被四面合围。此战之后，通往波斯腹地的山道尽开，幸存者乞和，议定年贡马匹、牛羊。本场为野战，不涉据点易主。',
        fieldBattleData: {
            title: '乌克西亚隘口战役',
            description: '公元前331年冬，扎格罗斯山脉东缘的乌克西亚隘口。乌克西亚人自恃险隘，向来往军队索取买路钱，认定马其顿人也会照波斯旧例纳贡，故只在山口静候。亚历山大应下纳贡之约，却选在约定之日分兵：克拉特鲁斯率盾卫抢占高地，堵死部落战士的退路；亚历山大自率精锐走北路，强袭其村落，随后以接连强行军夺取隘口。部落战士退向高地，正撞上守候已久的马其顿方阵，被四面合围后歼灭。',
            location: { lat: 32.0457, lng: 48.8506 },
            marchWaypoints: ['city_niniwei', 'city_yashucheng', 'city_babilun', 'city_susa'],
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 8000,
            attackerSourceCityId: 'city_babilun',
            attackerLegionName: '马其顿军',
            defenderFactionId: 'wukexiya',
            defenderGeneralId: 'wukexiya_madates',
            defenderTroops: 5000,
            defenderLegionName: '乌克西亚军',
            result: 'attacker_win',
            autoEnterRTS: true,
        },
    },
    // ── 由战场事件编辑器生成（/battlefield-editor.html）──
    {
        year: -330,
        season: 3,
        generalId: 'gen_alexander_great',
        inviteText: '朋友，前头那道山口叫波斯门，窄得只容数人并行——北坡是滚石，南坡是箭雨，阿里奥巴赞斯已经在那里垒起石墙等着我们。上一次我轻敌冒进，没有派斥候，全军人马被压在窄道里，成队死在石头和箭下，连阵亡者的尸体都没能带回来。这个耻辱我记着。这回不一样：找个俘虏，或是一个认得山路的牧羊人，让他带我从背后上去。只要一次夜袭，这道门就是我们的了。',
        sources: { battle: { level: 'fact', text: '英文维基百科 Battle of the Persian Gate：波斯门战役，前330年冬马其顿军与阿契美尼德波斯军在波斯门隘口的野战，隘口最窄处只容数人并行。' }, time: { level: 'fact', text: '英文维基百科 Battle of the Persian Gate：前330年冬，阿里奥巴赞斯据隘口抵挡马其顿军约一个月；条目信息框 date = 330 BC。波斯文维基百科 نبرد دربند پارس 亦记此役在前330年。' }, place: { level: 'fact', text: '英文维基百科 Battle of the Persian Gate 信息框 location = Persian Gate, near Persepolis，coordinates 30°42′30″N 51°35′55″E，即今伊朗法尔斯省波斯波利斯西北的扎格罗斯山口；按主人定口径坐标取信息框值 30.7083,51.5986。波斯文维基百科 نبرد دربند پارس 记战场在**今贝赫贝汉附近**，属当地语种说法，一并记录以备核对。' }, attacker: { level: 'fact', text: '英文维基百科 Battle of the Persian Gate：马其顿与科林斯同盟，亚历山大亲统；攻隘受挫后亲率精兵夜间翻山绕至守军背后，托勒密与佩尔狄卡斯分路合围，克拉特鲁斯留守营中牵制。' }, attackerTroops: { level: 'fact', text: '英文维基百科 Battle of the Persian Gate 信息框 strength1 = 17,000 picked fighters，攻方兵力取 17000；正文另记阿里安称面对的马其顿军逾一万人。' }, attackerLegion: { level: 'fact', text: '同东征前五场与乌克西亚隘口：马其顿军，前伙伴骑兵、中方阵步兵、后克里特弓箭手，鱼鳞阵 3-4-2；同一支军队整场战争不换。' }, defender: { level: 'fact', text: '英文维基百科 Battle of the Persian Gate 信息框 combatant2 = Achaemenid Empire，commander2 = Ariobarzanes of Persis 与 Youtab，两人皆记阵亡；阿里奥巴赞斯受命阻止马其顿军进入波斯本土。' }, defenderTroops: { level: 'fact', text: '英文维基百科 Battle of the Persian Gate 信息框 strength2 列两说：阿里安记 40,000 步兵与 700 骑兵；现代估计 700–2,000，Encyclopædia Iranica 认为至多 2,000，但同处说明多数现代史家仍照阿里安、库尔提乌斯与狄奥多罗斯取值。按主人定 1:2（守方不超过攻方 2 倍）：17000 × 2 = 34000，取 34000。波斯文维基百科 نبرد دربند پارس 记阿里奥巴赞斯所部为 700 步兵与 40 骑兵，一并记录。' }, defenderLegion: { level: 'fact', text: '英文维基百科 Battle of the Persian Gate：守军据石垒居高临下，北坡滚石、南坡弓矢。守方军团取剧本军团「阿契美尼德军」，与格拉尼库斯、伊苏斯、高加米拉同一番号，整场战争不换。' }, route: { level: 'fact', text: '英文维基百科 Battle of the Persian Gate 背景节：取苏萨后亚历山大分兵，帕曼纽率一半人马沿御道东进，亚历山大自取通往波斯本土的山路；沿途先平乌克西亚人，再入波斯门，入隘时未派斥候而中伏。游戏路线：自上一处战场（乌克西亚隘口，苏萨以东约六十公里）继续沿苏萨—波斯波利斯大道东南行，入扎格罗斯山至波斯门。⚠️ 路网缺口：寻路只在据点入路，而隘口一百五十一公里内没有据点，故编辑器实测末段须离路直行一百五十一公里、经苏萨与波斯波利斯的绕行段达 838 公里，绕远 2.34 倍；实际那条大道从隘口旁约五公里处经过。已报主人，待其决定在隘口附近加据点或另作安排。' }, result: { level: 'fact', text: '英文维基百科 Battle of the Persian Gate：马其顿突破隘口。阿里奥巴赞斯据险死守近一月，其部尽没；他本人或战死于最后的冲锋，或北逃后向亚历山大归降；另有史家记其退至波斯波利斯，城门被守库贵族提里达特斯关闭，遂在城外被歼。战后亚历山大任命弗拉索尔特斯继其位，进占波斯波利斯并取其府库，前330年5月焚波斯波利斯王宫。本场为野战，不涉据点易主。' }, invite: { level: 'fact', text: '邀约对白所据史事：英文维基百科 Battle of the Persian Gate：亚历山大入隘口时未派斥候、中伏受重创并弃阵亡者而退；其后由俘虏或当地牧羊人引路绕至守军背后。对白措辞为撰写。' }, briefing: { level: 'fact', text: '英文维基百科 Battle of the Persian Gate 与波斯文维基百科 نبرد دربند پارس：隘口最窄处只容数人并行，波斯军自北坡投石、南坡射箭；波斯文维基记一名当地牧羊人或农夫为亚历山大指路绕行，阿里奥巴赞斯与数名骑兵脱逃。文案按主人规矩不写兵力确数。' } },
        commanderUnit: 'hero_mounted_alexander',
        foeCommanderUnit: 'hero_artaphernes',
        type: 'field_battle',
        title: '公元前330年 波斯门战役',
        description: '马其顿军获胜：亚历山大强攻波斯门受挫、全军被压在窄道中伤亡惨重，弃尸而退；其后得俘虏或当地牧羊人引路，亲率精兵趁夜翻山绕至守军背后，托勒密与佩尔狄卡斯分路合围，克拉特鲁斯在营中牵制，终于突破隘口。阿里奥巴赞斯据险死守近一月，此战被视为亚历山大东征中最凶险的一关；战后通往波斯波利斯的最后一道屏障扫清。本场为野战，不涉据点易主。',
        fieldBattleData: {
            title: '波斯门战役',
            description: '公元前330年冬，扎格罗斯山脉的波斯门隘口。这条山口最窄处只容数人并行，北坡巨石、南坡箭雨，波斯总督阿里奥巴赞斯据垒扼守。马其顿军初次深入窄道便被压在当中，前军退不出、后军还在涌入，成队被砸死射死，亚历山大被迫弃下阵亡者才撤回全军。此后阿里奥巴赞斯坚守近一月，直到一个俘虏或当地牧羊人把绕到波斯军背后的山路指给了亚历山大：他亲率精兵夜间翻山，摸上隘口守军的头顶，托勒密与佩尔狄卡斯分路合围，克拉特鲁斯留营牵制。波斯军前后受敌，隘口终被突破。',
            location: { lat: 30.7083, lng: 51.5986 },
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 17000,
            attackerSourceCityId: 'city_susa',
            attackerLegionName: '马其顿军',
            defenderFactionId: 'aqimeinide',
            defenderGeneralId: 'aqimeinide_aertabazanuosi',
            defenderTroops: 34000,
            defenderSourceCityId: 'city_bosibolisi',
            defenderLegionName: '阿契美尼德军',
            result: 'attacker_win',
            autoEnterRTS: true,
        },
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
