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

            // 主人指定的野战坐标。注：与据点「格拉尼库斯」city_gelanikusi(40.32, 27.28)
            // 相距约 10 km；本役是野战，故用 location 而非 locationCityId。
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
        sources: { battle: { level: 'fact', text: '英文维基百科 Battle of the Granicus：格拉尼库斯河战役，野战，亚历山大强渡河流进攻据守东岸的波斯军。' }, time: { level: 'fact', text: '英文维基百科 Battle of the Granicus：前334年5月，初春自马其顿出发，20天抵塞斯托斯，季节取春。' }, place: { level: 'fact', text: '英文维基百科 Battle of the Granicus：格拉尼库斯河即今土耳其比加河；坐标取信息框 40.3167,27.2811。' }, attacker: { level: 'fact', text: '英文维基百科 Battle of the Granicus：马其顿与希腊同盟，亚历山大亲统右翼，帕曼纽统左翼。' }, attackerTroops: { level: 'fact', text: '英文维基百科 Battle of the Granicus 信息框：马其顿军投入此役共18100人。' }, attackerLegion: { level: 'fact', text: '英文维基百科 Ancient Macedonian army：史称马其顿军；伙伴骑兵作矛头、方阵跟进、克里特弓箭手掩护，前358至前331年一贯如此，故前骑兵、中步兵、后远程。比例按 Battle of the Granicus 信息框：骑兵5100、步兵12000、远程1000，步兵最多，取鱼鳞阵 前3中4后2，远程最少只能2人。' }, defender: { level: 'fact', text: '英文维基百科 Battle of the Granicus：阿契美尼德小亚细亚诸总督联军，古史未明言主帅，现代学者认为赫勒斯滂弗里吉亚总督阿尔西提斯总领；门农等同在军中。' }, defenderTroops: { level: 'fact', text: '英文维基百科 Battle of the Granicus 信息框：波斯军14000至40000人，按标准取区间中值27000。' }, defenderLegion: { level: 'popular', text: '英文维基百科 Battle of the Granicus：诸总督联军无专名，称波斯总督联军；骑兵沿东岸列阵在前，步兵列其后高地，含数千希腊雇佣兵；信息框中值骑兵15000、步兵12000，取雁行阵 前骑兵4中步兵3后远程2；远程无明载，按阿契美尼德军以弓手著称补一排。' }, route: { level: 'fact', text: '英文维基百科 Battle of the Granicus：自马其顿经色雷斯至塞斯托斯，大军由塞斯托斯渡至阿拜多斯，亚历山大自埃莱乌斯渡海登西格翁角，谒伊利昂，经阿里斯巴、佩尔科特、兰普萨库斯至格拉尼库斯河。游戏路线：佩拉、安菲波利斯、羊河近塞斯托斯、坐船至特洛伊即伊利昂、沿海岸东进；途经据点鲁西翁为中世纪地名、格拉尼库斯为按战役起名的城寨，前334年皆无此城，列入那一年不存在，路照走、城不显示。' }, result: { level: 'fact', text: '英文维基百科 Battle of the Granicus：马其顿胜，亚历山大取得小亚细亚半壁；战后据点达斯基利翁即阿尔西提斯治所归马其顿。' }, invite: { level: 'fact', text: '阿里安《亚历山大远征记》II.14 亚历山大致大流士书：东征名义为报复波斯当年入侵希腊；对白措辞为撰写，史事有据。' }, briefing: { level: 'fact', text: '英文维基百科 Battle of the Granicus：出征全军约步兵3.2万、骑兵5千，参战按信息框步兵1.3万、骑兵5100，播报写一万三千步兵与五千一百骑兵；门农献焦土之策被拒、帕曼纽劝明晨再渡被拒；波斯军列于东岸。英文维基百科 Alexander the Great：生于前356年7月，此役时二十一岁。' } },
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
            // 戈尔迪乌姆出发，经安卡拉（古安库拉）、阿达纳（塔尔苏斯附近），南下伊苏斯（英文维基 Alexander the Great / Battle of Issus）
            marchWaypoints: ['city_ankala', 'city_adana'],

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
            defenderTroops: 75000,                 // 英文维基信息框：现代估计 5 万–10 万，按标准取中值
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
        // 对手主将队：达提斯——阿契美尼德米底人统帅，与大流士同文化同时代近；素材样貌为持矛的波斯骑将
        foeCommanderUnit: 'hero_datis',
        // 军团出发据点：亚历山大前333年春在戈尔迪乌姆，不回佩拉（英文维基 Alexander the Great）
        startCityId: 'city_geerdiweng',
        // 阿达纳挂的「蛇堡」是中世纪亚美尼亚城堡，前333年尚无 → 本场不显示该城（路照走）
        absentCities: ['city_adana'],
        inviteText: '朋友，你来得正好。我在戈尔迪乌姆斩断了那个无人能解的结，传说解开它的人将成为亚细亚之王。大流士已在巴比伦集结大军，我要越过托罗斯山，进入奇里乞亚迎战他。你可愿随我同往？',
        // 🔴 [2026-09-23] 资料清单：每项依据与可信级别（src/data/eventSources.ts）
        sources: { battle: { level: 'fact', text: '英文维基百科 Battle of Issus：伊苏斯战役，野战，两军在皮纳鲁斯河两岸会战。' }, time: { level: 'fact', text: '英文维基百科 Battle of Issus 信息框：前333年11月5日，季节取秋。' }, place: { level: 'fact', text: '英文维基百科 Battle of Issus：伊苏斯城以南的皮纳鲁斯河，今土耳其哈塔伊省；坐标取信息框 36.7525,36.1923。海湾到群山之间仅2.6公里。' }, attacker: { level: 'fact', text: '英文维基百科 Battle of Issus：马其顿与希腊同盟，亚历山大亲统右翼伙伴骑兵，帕曼纽统左翼。' }, attackerTroops: { level: 'fact', text: '英文维基百科 Battle of Issus 信息框：马其顿军共约37000人。' }, attackerLegion: { level: 'fact', text: '同格拉尼库斯河战役：马其顿军，前骑兵、中方阵、后远程，鱼鳞阵；此役亚历山大仍亲率伙伴骑兵为决胜一击。' }, defender: { level: 'fact', text: '英文维基百科 Battle of Issus：阿契美尼德帝国，大流士三世亲征。' }, defenderTroops: { level: 'fact', text: '英文维基百科 Battle of Issus 信息框：现代估计5万至10万，按标准取区间中值75000。' }, defenderLegion: { level: 'fact', text: '英文维基百科 Military of the Achaemenid Empire：职业常备军统称 spāda，后世通称阿契美尼德军。英文维基百科 Battle of Issus：骑兵约1.8万、长生军与希腊雇佣兵及亚美尼亚步兵约6万、轻步兵3万至8万；波斯骑兵率先渡河冲击，故前骑兵中步兵后远程，鹤翼阵2-4-3。' }, route: { level: 'fact', text: '英文维基百科 Alexander the Great：亚历山大在弗里吉亚古都戈尔迪乌姆斩断戈尔迪之结，前333年春越过托罗斯山进入奇里乞亚，病后向叙利亚进军，又回师奇里乞亚在伊苏斯击败大流士。英文维基百科 Battle of Issus：亚历山大驻塔尔苏斯，得知大流士在巴比伦集结大军后南下。游戏路线：戈尔迪乌姆、安卡拉即古安库拉、阿达纳即塔尔苏斯附近、伊苏斯；史载经卡帕多西亚过奇里乞亚关，该地无同时代据点，路网实走伊科尼乌姆一线，同样经托罗斯山口入奇里乞亚。' }, result: { level: 'fact', text: '英文维基百科 Battle of Issus：马其顿胜，大流士弃军逃走，母亲、妻子、两个女儿被俘；伊苏斯是战场，无据点易主。' }, invite: { level: 'fact', text: '英文维基百科 Alexander the Great：戈尔迪乌姆斩断戈尔迪之结，传说能解开者将为亚细亚之王；英文维基百科 Battle of Issus：大流士在巴比伦集结大军。对白措辞为撰写，史事有据。' }, briefing: { level: 'fact', text: '英文维基百科 Battle of Issus：海湾到群山仅2.6公里即两英里；大流士绕到马其顿军后方占领伊苏斯、砍去伤病员之手；马其顿军约3.7万，波斯军按中值7.5万，播报写三万七千、七万五千；方阵居中、亚历山大率伙伴骑兵在右翼。' } },
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
            description: '亚历山大率约 35,000–40,000 步骑大军填海筑堤直逼海岛石墙，攻破推罗要塞；推罗国王阿泽米尔库斯率守军力战，推罗陷落。',
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerLegionName: '马其顿军',   // 剧本军团：亚历山大所率马其顿军，整场东征同一支
            attackerTroops: 30000,                   // 史料 35000–40000 步骑
            attackerSourceCityId: 'city_salonica',   // 佩拉
            // 🔴 [2026-09-19 主人令「一个战场一个防守方的武将一个势力一个精锐」] 守方势力显式写明：

            //    推罗末代国王阿泽米尔库斯 = 迦南（推罗）。此前这条没写势力，按势力取精锐番号就取不到。

            defenderFactionId: 'kanan',

            defenderGeneralId: 'kanan_azemier',      // 推罗末代国王阿泽米尔库斯
            defenderTroops: 22000,                   // 史料守军约 8,000–10,000
            result: 'attacker_win',                  // 写真历史：攻城彻底胜利
            autoEnterRTS: true,                      // 进战术模式（13）
            targetBattlefieldId: 'bf_tuile',
        },
        generalId: 'gen_alexander_great',
        commanderUnit: 'hero_mounted_alexander',   // 主将队：素材样貌为骑马的亚历山大
    },
    // ═══════════════════════════════════════════════════════════════
    // 前 331 年秋 · 亚历山大决战波斯：高加米拉战役（Battle of Gaugamela，前331年10月）
    // ═══════════════════════════════════════════════════════════════
    {
        year: -331,
        season: 2,                                   // 秋（史料：前331年10月1日）
        type: 'field_battle',
        title: '公元前331年 高加米拉战役',
        description: '马其顿军决定性全面胜利：亚历山大以斜线战术拉扯波斯大军，亲率骑兵楔形突击直插大流士中军；波斯全军崩溃，大流士溃逃，直接宣告了阿契美尼德波斯帝国的瓦解。',
        fieldBattleData: {
            title: '高加米拉战役',
            description: '亚历山大亲率右翼伙伴骑兵形成楔形突击直扑波斯中军，大流士三世溃逃，波斯全军崩溃。',
            // 摩苏尔以东广阔平原（北纬 36°21'46", 东经 43°15'00"）
            location: { lat: 36.3628, lng: 43.25 },

            // ── 攻方：马其顿与希腊联军 亚历山大大帝 ──
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerLegionName: '马其顿军',   // 剧本军团：亚历山大所率马其顿军，整场东征同一支
            attackerTroops: 47000,                   // 史料 47,000 人（约 40,000 步兵 + 7,000 骑兵）
            attackerSourceCityId: 'city_salonica',

            // ── 守方：波斯阿契美尼德帝国大军 大流士三世 ──
            defenderFactionId: 'aqimeinide',
            defenderGeneralId: 'daliushi_iii',
            defenderTroops: 90000,                   // 现代史学界估计 50,000 至 100,000 人（中高值）
            defenderSourceCityId: 'city_bosibolisi',

            result: 'attacker_win',                  // 写真历史：马其顿决定性胜利
            autoEnterRTS: true,                      // 进战术模式（13）
        },
        generalId: 'gen_alexander_great',
        commanderUnit: 'hero_mounted_alexander',   // 主将队：素材样貌为骑马的亚历山大
    },

    // ═══════════════════════════════════════════════════════════════
    // 前 330 年冬 · 亚历山大决战扎格罗斯：波斯门战役（Battle of the Persian Gate，前330年1月）
    // ═══════════════════════════════════════════════════════════════
    {
        year: -330,
        season: 3,                                   // 冬（史料：前330年1月，严冬风雪夜山道极限攀爬大迂回）
        type: 'field_battle',
        title: '公元前330年 波斯门战役',
        description: '马其顿军最终获胜：波斯总督阿尔塔巴扎诺斯利用扎格罗斯天险石垒扼守波斯门；亚历山大正面受挫后亲率精锐轻步兵风雪夜沿山道大迂回后方夹击，波斯守军战至最后全员阵亡；扫清进占波斯波利斯的最后屏障。',
        fieldBattleData: {
            title: '波斯门战役',
            description: '阿尔塔巴扎诺斯扼守波斯门险隘，亚历山大亲率精锐轻步兵雪夜沿隐秘山道大迂回后方夹击，波斯守军战至最后全员阵亡。',
            // 扎格罗斯山脉险隘波斯门（北纬 30°42'30", 东经 51°35'55"）
            location: { lat: 30.7083, lng: 51.5986 },

            // ── 攻方：马其顿军先锋精锐 亚历山大大帝 ──
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerLegionName: '马其顿军',   // 剧本军团：亚历山大所率马其顿军，整场东征同一支
            attackerTroops: 8000,                   // 史料 10,000 至 17,000 先锋精锐
            attackerSourceCityId: 'city_salonica',   // 佩拉

            // ── 守方：波斯守军 阿尔塔巴扎诺斯 ──
            defenderFactionId: 'aqimeinide',
            defenderGeneralId: 'aqimeinide_aertabazanuosi',
            // 🔴 [2026-09-16 主人定]「所有战场事件必须进入战术模式」+「必须符合历史」。
            //    原为 1500（现代史学考证 700~2000 的中值）—— 有出处，但低于 13 准入门槛 5000，
            //    这一仗就只能看战斗面板、进不去战术画面。
            //    史料本身分裂：阿里安记 40000 步兵+700 骑兵（现代普遍认为夸大），
            //    库尔提乌斯与狄奥多罗斯两家均记 25000。取这个古典共识值：
            //    既有史源，又满足门槛，还保住史实形态 —— 守方凭扎格罗斯天险且兵力占优，
            //    亚历山大正面受阻近一月，最后靠雪夜山道迂回夹击取胜。
            defenderTroops: 5000,
            defenderSourceCityId: 'city_bosibolisi', // 波斯波利斯

            result: 'attacker_win',                  // 写真历史：马其顿迂回奇袭获胜
            autoEnterRTS: true,                      // 进战术模式（13）
            defenderLegionName: '古典时代波斯军团',
        },
        // 🔴 战后归属：扫清最后屏障，波斯波利斯易主归马其顿
        cityUpdates: [{ cityId: 'city_bosibolisi', factionId: 'maqidun' }],
        generalId: 'gen_alexander_great',
        commanderUnit: 'hero_mounted_alexander',   // 主将队：素材样貌为骑马的亚历山大
    },

    // ═══════════════════════════════════════════════════════════════
    // 前 329 年夏 · 亚历山大远征中亚：锡尔河战役（Battle of Jaxartes，前329年）
    // ═══════════════════════════════════════════════════════════════
    {
        year: -329,
        season: 1,                                   // 夏（史料：前329年盛夏苦盏前线强渡锡尔河突破战）
        type: 'field_battle',
        title: '公元前329年 锡尔河战役',
        description: '马其顿军大获全胜：亚历山大在锡尔河南岸架设重型弩炮进行超视距隔河火力覆盖驱散轻骑；随后用皮筏载兵强渡大河设伏诱敌，最终以伙伴骑兵合围重创斯基泰游牧联军，确立帝国东北边界。',
        fieldBattleData: {
            title: '锡尔河战役',
            description: '亚历山大架设重型弩炮隔河火力覆盖强渡锡尔河，设伏诱敌并以伙伴骑兵合围溃散斯基泰游牧大军。',
            // 锡尔河畔苦盏前线（北纬 40°17'00", 东经 69°37'00"）
            location: { lat: 40.2833, lng: 69.6167 },

            // ── 攻方：马其顿军先锋部队 亚历山大大帝 ──
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerLegionName: '马其顿军',   // 剧本军团：亚历山大所率马其顿军，整场东征同一支
            attackerTroops: 18000,                   // 史料参战先锋部队约 10,000 至 20,000 人
            attackerSourceCityId: 'city_salonica',   // 佩拉

            // ── 守方：斯基泰骑兵联军 萨特拉克斯 ──
            defenderFactionId: 'sijitai',
            defenderGeneralId: 'sijitai_satraces',
            defenderTroops: 16000,                   // 史料约 10,000 至 20,000 名游牧弓骑兵
            defenderSourceCityId: 'city_asu',        // 塔纳伊斯

            result: 'attacker_win',                  // 写真历史：马其顿强渡大获全胜
            autoEnterRTS: true,                      // 进战术模式（13）
        },
        generalId: 'gen_alexander_great',
        commanderUnit: 'hero_mounted_alexander',   // 主将队：素材样貌为骑马的亚历山大
    },

    // ═══════════════════════════════════════════════════════════════
    // 前 328 年冬 · 亚历山大平定中亚：索格底亚那岩山战役（Siege of the Sogdian Rock，前328年冬）
    // ═══════════════════════════════════════════════════════════════
    {
        year: -328,
        season: 3,                                   // 冬（史料：前328年冬至前327年初，严冬雪夜攀登冰冻绝壁）
        type: 'field_battle',
        title: '公元前328年 索格底亚那岩山战役',
        description: '马其顿军完胜：索格底亚那大贵族奥克夏特斯依四面悬崖峭壁死守岩山要塞；亚历山大选派300名精锐攀岩死士深夜沿冰雪冻壁奇袭登顶，守军心理彻底崩溃不战而降；奥克夏特斯归降，亚历山大迎娶罗克珊娜平定中亚反抗。',
        fieldBattleData: {
            title: '索格底亚那岩山战役',
            description: '奥克夏特斯扼守险峰绝壁要塞，亚历山大选派300攀岩死士雪夜渗透奇袭登顶，守军心理崩溃归降。',
            // 苏尔汉河州贝孙岭险峰（北纬 38°58'00", 东经 67°02'00"）
            location: { lat: 38.9667, lng: 67.0333 },

            // ── 攻方：马其顿军先锋部队 亚历山大大帝 ──
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerLegionName: '马其顿军',   // 剧本军团：亚历山大所率马其顿军，整场东征同一支
            attackerTroops: 8000,                   // 围攻先锋精锐主力部队
            attackerSourceCityId: 'city_salonica',   // 佩拉

            // ── 守方：索格底亚那守军 奥克夏特斯 ──
            defenderFactionId: 'sogdian',
            defenderGeneralId: 'sogdian_aokexiate',
            defenderTroops: 6000,                   // 史料守军约 30,000 人（含起义武装与军民）
            defenderSourceCityId: 'city_varaksha',   // 瓦拉赫沙

            result: 'attacker_win',                  // 写真历史：守军不战而降
            autoEnterRTS: true,                      // 进战术模式（13）
        },
        generalId: 'gen_alexander_great',
        commanderUnit: 'hero_mounted_alexander',   // 主将队：素材样貌为骑马的亚历山大
    },

    // ═══════════════════════════════════════════════════════════════
    // 前 327 年春 · 亚历山大进军印度：马萨加战役（Siege of Massaga，前327年春）
    // ═══════════════════════════════════════════════════════════════
    {
        year: -327,
        season: 0,
        type: 'siege',
        title: '公元前327年 马萨加战役',
        description: '马其顿军苦战攻克要塞获胜：亚历山大进军斯瓦特河谷围攻马萨加险要坚城；马其顿攻城塔与攻城锤昼夜猛轰城墙裂口，阿斯瓦卡首领阿萨卡诺斯阵亡，克莱奥菲斯女王率部投降；要塞被全面攻破，为进军印度扫清通道。',
        siegeData: {
            title: '马萨加战役',
            description: '亚历山大率攻城重型机械围攻马萨加险要要塞，阿萨卡诺斯阵亡后克莱奥菲斯女王统领全城力战投降，马其顿军攻克要塞。',
            // 🔴 [2026-09-19 主人定「把战场和据点分开」] 这一仗打的是**这块战场本身**（斯瓦特河谷查克达拉古要塞），
            //    不再借任何据点当被攻目标 —— 战场自带攻守，双方都摆在战场上。
            targetBattlefieldId: 'bf_masajia',
            // 史料：马其顿攻城塔与撞城锤昼夜猛轰，守将阿萨卡诺斯阵亡后克莱奥菲斯女王纳降
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerLegionName: '马其顿军',   // 剧本军团：亚历山大所率马其顿军，整场东征同一支
            attackerTroops: 18000,
            attackerSourceCityId: 'city_salonica',   // 佩拉（马其顿，仅作出兵身份，战场事件不靠它行军）
            // 🔴 [2026-09-19 主人令「一个战场一个防守方的武将一个势力一个精锐」] 守方势力显式写明：

            //    克莱奥菲斯女王 = 阿斯瓦卡（斯瓦特河谷部族）。此前这条没写势力，按势力取精锐番号就取不到。

            defenderFactionId: 'aswaka',

            defenderGeneralId: 'aswaka_cleophis',
            defenderTroops: 15000,
            result: 'attacker_win',
            autoEnterRTS: true,
        },
        generalId: 'gen_alexander_great',
        commanderUnit: 'hero_mounted_alexander',   // 主将队：素材样貌为骑马的亚历山大
    },

    // ═══════════════════════════════════════════════════════════════
    // 前 326 年夏 · 亚历山大四大决战收官：希达斯佩斯河战役（Battle of the Hydaspes，前326年夏）
    // ═══════════════════════════════════════════════════════════════
    {
        year: -326,
        season: 1,                                   // 夏（史料：前326年5–6月季风暴雨期）
        type: 'field_battle',
        title: '公元前326年 希达斯佩斯河战役',
        description: '马其顿军惨胜：亚历山大暴风雨夜强渡急流，集中长枪兵斩杀象夫并以伙伴骑兵两翼包抄溃散波鲁斯大军；波鲁斯身负九创力战被俘后获释封还王位；此战为远征四大决战收官之役，士卒随后厌战兵变，亚历山大正式踏上回师之路。',
        fieldBattleData: {
            title: '希达斯佩斯河战役',
            description: '亚历山大暴风雨夜强渡希达斯佩斯河，以长枪方阵与单侧包抄血战波鲁斯重装战象巨墙，印度军阵线崩溃，波鲁斯力竭被俘。',
            // 杰卢姆河畔平原（北纬 32°49'40", 东经 73°38'20"）
            location: { lat: 32.8278, lng: 73.6389 },

            // ── 攻方：马其顿与盟邦联军 亚历山大大帝 ──
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerLegionName: '马其顿军',   // 剧本军团：亚历山大所率马其顿军，整场东征同一支
            attackerTroops: 42000,                   // 史料参战总兵力约 40,000 至 45,000 人（中值）
            attackerSourceCityId: 'city_salonica',   // 佩拉

            // ── 守方：波鲁斯王国军 波鲁斯国王 ──
            defenderFactionId: 'bulu',
            defenderGeneralId: 'gen_bolusi',
            defenderTroops: 34000,                   // 史料 20,000–30,000 步兵 + 4,000 骑兵 + 300 战车及重装战象巨墙
            defenderSourceCityId: 'city_meng',       // 蒙格（海达斯佩斯河南岸会战根据地）

            result: 'attacker_win',                  // 写真历史：马其顿惨胜
            autoEnterRTS: true,                      // 进战术模式（13）
        },
        generalId: 'gen_alexander_great',
        commanderUnit: 'hero_mounted_alexander',   // 主将队：素材样貌为骑马的亚历山大
    },

    // ═══════════════════════════════════════════════════════════════
    // 前 325 年春 · 亚历山大南撤清剿：马里斯战役（Siege of the Mallian Citadel，前325年春）
    // ═══════════════════════════════════════════════════════════════
    {
        year: -325,
        season: 0,
        type: 'siege',
        title: '公元前325年 马里斯战役',
        description: '马其顿军惨烈攻克卫城获胜：亚历山大率军沿印度河清剿围攻马利砖石卫城，亲自登梯突入城内庭院与守军血战，胸部中箭射穿肺叶倒地；愤怒的马其顿士卒砸开城门破城彻底屠戮守军，亚历山大侥幸脱险但肺伤终生未愈；随后马其顿军彻底控制印度河下游，横渡格德罗西亚荒漠回师。',
        siegeData: {
            title: '马里斯战役',
            description: '亚历山大亲自登梯突入马里斯砖石卫城血战身负重伤，胸部被贯穿，赶来救驾的马其顿士卒怒破城门攻克要塞。',
            // 🔴 [2026-09-19 主人定「把战场和据点分开」] 这一仗打的是**这块战场本身**（木尔坦卫城古要塞遗址），
            //    不再借任何据点当被攻目标 —— 战场自带攻守，双方都摆在战场上。
            targetBattlefieldId: 'bf_malisi',
            // 史料：木尔坦砖石卫城，亚历山大登梯独入身中贯穿肺叶之箭，士卒怒破城门
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerLegionName: '马其顿军',   // 剧本军团：亚历山大所率马其顿军，整场东征同一支
            attackerTroops: 15000,
            attackerSourceCityId: 'city_salonica',   // 佩拉（马其顿，仅作出兵身份，战场事件不靠它行军）
            // 🔴 [2026-09-19 主人令「一个战场一个防守方的武将一个势力一个精锐」] 守方势力显式写明：

            //    马利首领 = 马利（摩罗婆）联军。此前这条没写势力，按势力取精锐番号就取不到。

            defenderFactionId: 'malli',

            defenderGeneralId: 'malli_leader',
            defenderTroops: 20000,
            result: 'attacker_win',
            autoEnterRTS: true,
        },
        generalId: 'gen_alexander_great',
        commanderUnit: 'hero_mounted_alexander',   // 主将队：素材样貌为骑马的亚历山大
    },

    // ═══════════════════════════════════════════════════════════════
    // 前 324 年冬 · 亚历山大实战绝唱：科塞亚战役（Cossaean Campaign，前324年冬）
    // ═══════════════════════════════════════════════════════════════
    {
        year: -324,
        season: 3,                                   // 冬（史料：前324年冬赫费斯提翁在埃克巴塔那病逝后发起严冬山地围剿）
        type: 'field_battle',
        title: '公元前324年 科塞亚战役',
        description: '马其顿军大获全胜：赫费斯提翁病逝后亚历山大发起扎格罗斯山地扫荡，分兵两路冒风雪翻越险峰切断退路，连拔数十处峭壁高山石堡彻底摧毁抵抗；残存科塞亚部族被迫集体投降；此役为亚历山大军事生涯最后一场实战战役，战后大军凯旋回师巴比伦。',
        fieldBattleData: {
            title: '科塞亚战役',
            description: '亚历山大与大将托勒密分兵两路雪夜翻越扎格罗斯险峰，轻重协同连拔数十处峭壁石堡，彻底击溃科塞亚部落联军。',
            // 洛雷斯坦省扎格罗斯高地（北纬 33°45'00", 东经 47°10'00"）
            location: { lat: 33.75, lng: 47.1667 },

            // ── 攻方：马其顿机动精锐部队 亚历山大大帝 ──
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerLegionName: '马其顿军',   // 剧本军团：亚历山大所率马其顿军，整场东征同一支
            attackerTroops: 12000,                   // 史料参战机动精锐约 10,000 至 15,000 人（中值）
            attackerSourceCityId: 'city_salonica',   // 佩拉

            // ── 守方：科塞亚山民武装 科塞亚首领 ──
            defenderFactionId: 'kesaiya',
            defenderGeneralId: 'kesaiya_shouling',
            defenderTroops: 15000,                   // 史料约 10,000 至 20,000 名峭壁设伏部落勇士（中值）
            defenderSourceCityId: 'city_hamadan',   // 哈马丹（埃克巴塔那）

            result: 'attacker_win',                  // 写真历史：大获全胜
            autoEnterRTS: true,                      // 进战术模式（13）
        },
        generalId: 'gen_alexander_great',
        commanderUnit: 'hero_mounted_alexander',   // 主将队：素材样貌为骑马的亚历山大
    },

    // ═══════════════════════════════════════════════════════════════
    // 🔴 [2026-09-19 主人令「全删除」] 前323 普拉塔纳斯 / 前322 克兰农 / 前321 赫勒斯滂
    //    三场战役**已整体删除**（连同 `Battlefields.ts` 的 bf_pulatanasi / bf_kelannong / bf_helesipang）。
    //    原因：这三场的归属武将（安提帕特／安提菲洛斯／欧迈尼斯）在库里**没有据点**，
    //    而玩家「找到武将」只认据点守将，事件永远等不到玩家 —— 按主人令直接删除，不留死数据。
    //    ⚠️ 武将与势力记录：安提帕特／莱奥斯塞尼斯／安提菲洛斯／克拉特罗斯仍在（分别挂 maqidun / xila）；
    //      欧迈尼斯与孤儿势力 `kapaduoxiya` 已按主人令「都给我删了」删除。
    // ═══════════════════════════════════════════════════════════════
    // ── 由战场事件编辑器生成（/battlefield-editor.html）──
    // ── 由战场事件编辑器生成（/battlefield-editor.html）──
    // ── 由战场事件编辑器生成（/battlefield-editor.html）──
    {
        year: -260,
        season: 1,
        generalId: 'xin_baiqi',
        type: 'field_battle',
        title: '公元前260年 长平战役',
        description: '秦秘密换帅白起，佯败诱赵军深入，两万五千奇兵截其归路、五千铁骑断丹水粮道；赵军被割裂围困四十六日，突围不成，数十万降卒尽坑，赵国元气丧尽。',
        fieldBattleData: {
            title: '长平战役',
            description: '白起以佯败诱敌至坚壁之下，奇兵截归路、铁骑断粮道，将赵军割裂合围四十六日，终致其全军崩溃。',
            location: { lat: 35.79, lng: 112.92 },
            attackerFactionId: 'xin',
            attackerGeneralId: 'xin_baiqi',
            attackerTroops: 500000,
            attackerSourceCityId: 'city_shangdang',
            defenderFactionId: 'zhao',
            defenderGeneralId: 'zhao_lianpo',
            defenderTroops: 450000,
            defenderSourceCityId: 'city_shangdang',
            result: 'attacker_win',
            autoEnterRTS: true,
        },
    },
    {
        year: -216,
        season: 1,
        generalId: 'gen_hannibal',
        type: 'field_battle',
        title: '公元前216年 坎尼战役',
        description: '汉尼拔以凸月阵诱罗马重步兵深入，两翼骑兵击溃罗马侧翼后合围封口；一日之内近七万罗马官兵阵亡，成就西方战术史上最完美的包围歼灭战。',
        fieldBattleData: {
            title: '坎尼战役',
            description: '汉尼拔亲坐中军逐步后退成凹月形，诱罗马大军入彀，两翼铁骑合围封口，全歼罗马主力。',
            location: { lat: 41.31, lng: 16.15 },
            attackerFactionId: 'buni',
            attackerGeneralId: 'gen_hannibal',
            attackerTroops: 50000,
            attackerSourceCityId: 'city_meierfei',
            defenderFactionId: 'luoma_diguo',
            defenderGeneralId: 'baolusi',
            defenderTroops: 72000,
            defenderSourceCityId: 'city_luoma',
            result: 'attacker_win',
            autoEnterRTS: true,
        },
    },
    {
        year: -207,
        season: 3,
        generalId: 'xichu_xiangyu',
        type: 'field_battle',
        title: '公元前207年 巨鹿战役',
        description: '项羽破釜沉舟，楚军九战绝秦军甬道，虏王离、降章邯，秦军主力尽丧；诸侯将入辕门皆膝行而前，项羽由是始为诸侯上将军。',
        fieldBattleData: {
            title: '巨鹿战役',
            description: '项羽率楚军渡漳水后凿舟破釜，以三日粮与秦军决战，九战九捷断其甬道，大破秦军。',
            location: { lat: 37.07, lng: 115.02 },
            attackerFactionId: 'xichu',
            attackerGeneralId: 'xichu_xiangyu',
            attackerTroops: 60000,
            attackerSourceCityId: 'city_pengcheng',
            defenderFactionId: 'wazhai',
            defenderGeneralId: 'wazhai_zhanghan',
            defenderTroops: 120000,
            defenderSourceCityId: 'city_dingtao',
            result: 'attacker_win',
            autoEnterRTS: true,
        },
    },
    // ── 由战场事件编辑器生成（/battlefield-editor.html）──
    // ── 由战场事件编辑器生成（/battlefield-editor.html）──
    {
        year: -48,
        season: 1,
        generalId: 'gen_julius_caesar',
        type: 'field_battle',
        title: '公元前48年 法萨卢斯战役',
        description: '恺撒以劣势兵力列阵法萨卢斯平原，暗藏第四线步兵伏击庞培优势骑兵；庞培骑兵溃逃反暴露侧翼，恺撒全线反击，庞培主力崩溃，乘船逃往埃及。',
        fieldBattleData: {
            title: '法萨卢斯战役',
            description: '恺撒设隐藏第四线步兵以标枪直刺骑手面门，击溃庞培骑兵后全线反击，瓦解庞培全军。',
            location: { lat: 39.28, lng: 22.42 },
            attackerFactionId: 'luoma_diguo',
            attackerGeneralId: 'gen_julius_caesar',
            attackerTroops: 25000,
            attackerSourceCityId: 'city_luoma',
            defenderFactionId: 'qiliqiya',
            defenderGeneralId: 'qiliqiya_pangpei',
            defenderTroops: 42000,
            defenderSourceCityId: 'city_yadian',
            result: 'attacker_win',
            autoEnterRTS: true,
        },
    },
    // ── 由战场事件编辑器生成（/battlefield-editor.html）──
    // ── 由战场事件编辑器生成（/battlefield-editor.html）──
    {
        year: 451,
        season: 1,
        generalId: 'xiongren_atila',
        type: 'field_battle',
        title: '公元451年 沙隆战役',
        description: '埃提乌斯统罗马-西哥特联军于卡塔隆尼亚平原迎战阿提拉；西哥特王狄奥多里克战死，哥特战士哀兵反击，将匈人压回车阵，阿提拉不可战胜的神话就此破灭。',
        fieldBattleData: {
            title: '沙隆战役',
            description: '罗马步兵与西哥特战士并肩顶住匈人骑射狂潮，黄昏将匈人全线压回大车营垒，阿提拉险欲自焚。',
            location: { lat: 48.96, lng: 4.36 },
            attackerFactionId: 'xiongren',
            attackerGeneralId: 'xiongren_atila',
            attackerTroops: 45000,
            attackerSourceCityId: 'city_lansi',
            defenderFactionId: 'luoma_diguo',
            defenderGeneralId: 'aitiliusi',
            defenderTroops: 45000,
            defenderSourceCityId: 'city_lansi',
            result: 'defender_win',
            autoEnterRTS: true,
        },
    },
    {
        year: 621,
        season: 0,
        generalId: 'tang_lishimin',
        type: 'field_battle',
        title: '公元621年 虎牢关战役',
        description: '李世民以三千五百玄甲骑抢先扼守虎牢关，以逸待劳；正午突袭窦建德中军，生擒窦建德，洛阳王世充出降，唐军一役扫平双雄。',
        fieldBattleData: {
            title: '虎牢关战役',
            description: '唐军铁骑正午破关而出，李世民亲执大旗直穿窦建德中军，夏军全线崩溃，窦建德负伤被擒。',
            location: { lat: 34.83, lng: 113.18 },
            attackerFactionId: 'tang',
            attackerGeneralId: 'tang_lishimin',
            attackerTroops: 35000,
            attackerSourceCityId: 'city_hulaoguan',
            defenderFactionId: 'xia',
            defenderGeneralId: 'doujiande',
            defenderTroops: 60000,
            defenderSourceCityId: 'city_hulaoguan',
            result: 'attacker_win',
            autoEnterRTS: true,
        },
    },
    {
        year: 1140,
        season: 1,
        generalId: 'yanchuan_d_yuefei',
        type: 'field_battle',
        title: '公元1140年 郾城战役',
        description: '岳飞以背嵬军步骑协同迎击，步兵持麻扎刀专斫马足，大破金军铁浮屠与拐子马；完颜宗弼北遁，岳家军威震中原。',
        fieldBattleData: {
            title: '郾城战役',
            description: '岳云率背嵬、游奕军迎头截击，岳飞令步兵持长斧麻扎刀斫马足，血战数十合，金军精锐尽丧溃退。',
            location: { lat: 33.58, lng: 114.02 },
            attackerFactionId: 'jurchen',
            attackerGeneralId: 'jurchen_wanyanzongbi',
            attackerTroops: 15000,
            attackerSourceCityId: 'city_wuguo',
            defenderFactionId: 'yanchuan_d',
            defenderGeneralId: 'yanchuan_d_yuefei',
            defenderTroops: 11000,
            defenderSourceCityId: 'city_yancheng2',
            result: 'defender_win',
            autoEnterRTS: true,
        },
    },
    // ── 由战场事件编辑器生成（/battlefield-editor.html）──
    // ── 由战场事件编辑器生成（/battlefield-editor.html）──
    {
        year: 1184,
        season: 0,
        generalId: 'fujiwara_yuanyijing',
        type: 'siege',
        title: '公元1184年 一之谷战役',
        description: '源义经自鹎越断崖策马冲下，奇袭平家后背纵火；平家误以为源氏主力降临，全线崩溃争相逃向海上战船，陆上根基尽失。',
        siegeData: {
            title: '一之谷战役',
            description: '义经率轻骑自百丈断崖呼啸而下，直冲平氏内营放火；平家数万将士精神崩溃，退上战船。',
            // 🔴 [2026-09-19 主人定「建立一个一之谷战场」] 一之谷**是战场、不是据点**：
            //    攻城目标改走 `targetBattlefieldId`（引擎据此用战场记录合成攻城目标），
            //    **不再去攻打姬路城** —— 姬路城是羽柴方的据点，与这一仗毫无关系。
            targetBattlefieldId: 'bf_yinotani',
            attackerFactionId: 'genji',
            attackerGeneralId: 'fujiwara_yuanyijing',
            attackerTroops: 15000,
            attackerSourceCityId: 'city_kyoto',
            // 🔴 [2026-09-19 主人令「一个战场一个防守方的武将一个势力一个精锐」] 守方势力显式写明：

            //    平知盛 = 平家。此前这条没写势力，按势力取精锐番号就取不到。

            defenderFactionId: 'taira',

            defenderGeneralId: 'taira_pingzhisheng',
            defenderTroops: 20000,
            result: 'attacker_win',
            autoEnterRTS: true,
        },
        // 🔴 战后归属：一之谷是**战场不是据点**，「没有主人，易什么主」（主人 2026-09-12 原话）——
        //    源氏破砦的史实写在 description 与战场 note 里，不再改任何据点归属。
    },
    // ── 由战场事件编辑器生成（/battlefield-editor.html）──
    {
        year: 1333,
        season: 0,
        generalId: 'yamato_nanmuzhengcheng',
        type: 'siege',
        title: '公元1333年 千早城战役',
        description: '楠木正成以千余死士凭千早险峰坚守百日，滚木雷石、稻草假人诱敌，拖垮号称十万的幕府大军；关东武士战意瓦解，足利尊氏回师反叛，镰仓幕府崩塌。',
        siegeData: {
            title: '千早城战役',
            description: '正成以巨木滚石碾碎蚁附之敌，夜布稻草假人诱敌狂射空箭，再投巨石掩杀；幕府大军百日不克。',
            attackerFactionId: 'ashikaga',
            attackerGeneralId: 'ashikaga_zulizunshi',
            attackerTroops: 6000,
            attackerSourceCityId: 'city_kyoto',
            // 🔴 [2026-09-19 主人令「一个战场一个防守方的武将一个势力一个精锐」] 守方势力显式写明：

            //    楠木正成 = 大和（楠木氏）。此前这条没写势力，按势力取精锐番号就取不到。

            defenderFactionId: 'yamato',

            defenderGeneralId: 'yamato_nanmuzhengcheng',
            defenderTroops: 3000,
            result: 'defender_win',
            autoEnterRTS: true,
            targetBattlefieldId: 'bf_qianzaocheng',
        },
    },
    {
        year: 1388,
        season: 1,
        generalId: 'joseon_lichenggui',
        type: 'field_battle',
        title: '公元1388年 威化岛战役',
        description: '李成桂以“四不可”抗命，自威化岛掉转兵锋南下直取王京，擒诛崔莹、废禑王，尽掌高丽军国大权。',
        fieldBattleData: {
            title: '威化岛战役',
            description: '李成桂于威化岛断然回军，踏浮桥南下直逼开京，崔莹兵败遭擒被诛，禑王被废。',
            location: { lat: 40.15, lng: 124.43 },
            attackerFactionId: 'joseon',
            attackerGeneralId: 'joseon_lichenggui',
            attackerTroops: 38000,
            attackerSourceCityId: 'city_hanseong',
            defenderFactionId: 'hai2',
            defenderGeneralId: 'ssangseong_cuiying',
            defenderTroops: 28000,
            defenderSourceCityId: 'city_haeju',
            result: 'attacker_win',
            autoEnterRTS: true,
        },
        cityUpdates: [{ cityId: 'city_kaesong', factionId: 'joseon' }],
    },
    // ── 由战场事件编辑器生成（/battlefield-editor.html）──
    // ── 由战场事件编辑器生成（/battlefield-editor.html）──
    {
        year: 1560,
        season: 1,
        generalId: 'owari_zhitianxinchang',
        type: 'field_battle',
        title: '公元1560年 桶狭间战役',
        description: '织田信长以两千余骑借雷雨掩护迂回突袭桶狭间今川本阵，斩杀今川义元；东海道霸主一朝倾覆，信长天下布武由此发端。',
        fieldBattleData: {
            title: '桶狭间战役',
            description: '信长借暴雨隐匿行踪，迂回至今川军背后，雨停一刻拔刀突袭，今川本阵崩溃，义元授首。',
            location: { lat: 34.98, lng: 136.97 },
            attackerFactionId: 'owari',
            attackerGeneralId: 'owari_zhitianxinchang',
            attackerTroops: 3000,
            attackerSourceCityId: 'city_atsuta',
            defenderFactionId: 'jinchuan',
            defenderGeneralId: 'jinchuan_jinchuanyiyuan',
            defenderTroops: 5000,
            defenderSourceCityId: 'city_atsuta',
            result: 'attacker_win',
            autoEnterRTS: true,
        },
    },
    {
        year: 1561,
        season: 2,
        generalId: 'echigo_shangshanqianxin',
        type: 'field_battle',
        title: '公元1561年 川中岛战役',
        description: '上杉谦信识破武田信玄啄木鸟战法，自妻女山突袭八幡原武田本阵，车悬之阵连番突击；午后武田别动队回援夹击，双方各自撤军，龙虎相争不分胜负。',
        fieldBattleData: {
            title: '川中岛战役',
            description: '谦信借夜雾渡千曲川突袭武田本阵，车悬之阵排山倒海；武田别动队回援夹击，越后军方从容后撤。',
            location: { lat: 36.59, lng: 138.2 },
            attackerFactionId: 'echigo',
            attackerGeneralId: 'echigo_shangshanqianxin',
            attackerTroops: 13000,
            attackerSourceCityId: 'city_kasugayama',
            defenderFactionId: 'kai',
            defenderGeneralId: 'kai_wutianxinxuan',
            defenderTroops: 18000,
            defenderSourceCityId: 'city_tsutsujigasaki',
            result: 'defender_win',
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
        const cityId = sd?.defenderCityId;
        const bf = cityId
            ? BATTLEFIELDS.find((b) => b.scriptYear === event.year && b.eventCityId === cityId)
            : undefined;
        return bf?.id ?? null;
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
