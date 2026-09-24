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
    // ── 由战场事件编辑器生成（/battlefield-editor.html）──
    {
        year: -334,
        season: 1,
        generalId: 'gen_alexander_great',
        inviteText: '朋友，你来得正好。前头就是米利都——伊奥尼亚最大的城。守将本已答应把城交给我，是波斯舰队给了他胆子，他才变卦，如今只肯拿中立换我退兵，好让波斯人的船靠港。我不做这个买卖。你看好了：我拿投石机砸开他的墙，尼卡诺尔把港口封死，看那支舰队还能不能给他送进一粒粮。你可愿随我打这一仗？',
        sources: { battle: { level: 'fact', text: '英文维基百科 Siege of Miletus：前334年马其顿与阿契美尼德波斯之间的攻城战，亚历山大东征中的第一场攻城战与海战交锋；中文维基百科「米利都圍城戰」同条记其为东征中与波斯之间的第一场攻城战。' }, time: { level: 'popular', text: '英文维基百科 Siege of Miletus 信息框 date = 334 BC；中文维基百科同条目亦记前334年，两者均未给月份。此役在格拉尼库斯河战役（前334年5月）之后、哈利卡纳苏斯围城（前334年冬）之前，故季节取夏。可信级别：通行说法。' }, place: { level: 'fact', text: '英文维基百科 Siege of Miletus 信息框 coordinates 37°31′49″N 27°16′42″E（今土耳其艾登省迪迪姆的 Balat），即波斯治下的希腊城邦米利都（中文维基百科「米利都圍城戰」：愛奧尼亞的米利都）；本据点记录取其坐标 37.5303,27.2783。' }, attacker: { level: 'fact', text: '英文维基百科 Siege of Miletus 信息框 commander1 = Alexander the Great、Nicanor（帕曼纽之子，率舰队封锁港口）；中文维基百科「米利都圍城戰」：亚历山大亲统陆军，并先分派部队进攻伊奥尼亚境内尚未臣服的城镇，尼卡诺尔率马其顿舰队（一百六十艘）先占莱德岛。' }, attackerTroops: { level: 'inferred', text: '中、英文维基信息框均未给陆上兵数（英文信息框 strength1 只给 160 ships；中文信息框记「陸軍不明，艦隊160艘」）。同一支马其顿军于两个月前在格拉尼库斯为 18,100 人（英文维基 Battle of the Granicus 信息框），此后未获大补，中文维基另记其先分兵去取伊奥尼亚未服城镇，故取 18,000 —— 合理推定。' }, attackerLegion: { level: 'fact', text: '同东征诸役：马其顿军（前伙伴骑兵、中方阵步兵、后克里特弓箭手，鱼鳞阵 3-4-2，整场战争不换）。此役陆军以投石机轰击城墙、自缺口攻入（中文维基百科「米利都圍城戰」引阿里安《亚历山大远征记》卷一）。' }, defender: { level: 'fact', text: '英文维基百科 Siege of Miletus 信息框 commander2 = Hegesistratus（赫格西斯特），即米利都的波斯驻军守将；中文维基百科「米利都圍城戰」：他本欲向亚历山大献城，因附近波斯守军尚未远离、加上波斯舰队承诺来援而反悔；同条记波斯守军事先把兵力集中于米利都内城。' }, defenderTroops: { level: 'inferred', text: '英文维基百科 Siege of Miletus 信息框 strength2 = 400 ships (not engaged) + 300 Milesians；中文维基百科信息框记「陸軍不明，數量遠少於馬其頓軍」，正文记守城主力为希腊雇佣兵、另有波斯守军据内城，城破时少部分退守城外小岛（岛上即那三百名决意死战的希腊雇佣兵）、其余大多被消灭。据此全城守军当以千计，取 3000（远少于攻方，与中文维基「數量遠少於馬其頓軍」一致）—— 合理推定。' }, defenderLegion: { level: 'fact', text: '中文维基百科「米利都圍城戰」（据阿里安《亚历山大远征记》卷一）：守城主力为希腊雇佣兵，另有波斯守军据内城；波斯舰队四百艘停泊米克利，因马其顿舰队守住港口而无法支援。英文维基百科信息框 combatant2 = Achaemenid Empire、Milesian allies。守方军团取剧本军团「阿契美尼德军」（与格拉尼库斯、伊苏斯、加沙同一番号）。' }, route: { level: 'fact', text: '中文维基百科「米利都圍城戰」背景节（据阿里安《亚历山大远征记》卷一）：格拉尼库斯战后波斯小亚细亚诸总督多阵亡，赫勒斯滂弗里吉亚全归亚历山大，萨第斯、以弗所相继投降，米利都守将亦曾允降；亚历山大再分兵取伊奥尼亚未服城镇、自率其余南下米利都。游戏路线：自上一处战场（格拉尼库斯）开拔 → 斯法尔德（萨第斯） → 以弗所 → 米利都；米利都库里原无这座城，按 §二之二 添加据点（末段自以弗所直走野地 45.9 公里，属提示级、不新建道路）。出兵据点记羊河：军团此刻在格拉尼库斯战场，按 §三.1 取那一年离战场最近且已存在的据点（58 公里）；达斯基利翁在战场以东约 68 公里，是战后进占的据点，不作出发点。' }, result: { level: 'fact', text: '英文维基百科 Siege of Miletus：马其顿胜，territory = Alexander controls Ionia。中文维基百科「米利都圍城戰」（据阿里安《亚历山大远征记》卷一）：马其顿陆海并进，陆军以投石机破墙自缺口入城，尼卡诺尔舰队封住港口使波斯舰队无法支援，城内波斯守军大多被消灭，全城落入亚历山大之手；退守小岛的希腊雇佣兵被亚历山大收编入自己的军队。故本场「战后归属」按历史写米利都归马其顿。' }, invite: { level: 'fact', text: '邀约对白所据史事：中文维基百科「米利都圍城戰」（据阿里安《亚历山大远征记》卷一）——米利都市民代表与守城主力希腊雇佣兵的代表来见亚历山大，请其解除围城，米利都愿守中立并对马其顿、波斯双方开放城市与港口；亚历山大一口回绝，要他们次日准备决战。对白措辞为撰写。' }, briefing: { level: 'fact', text: '中、英文维基百科「米利都圍城戰」与阿里安《亚历山大远征记》卷一：尼卡诺尔先率舰队占莱德岛并把部队运上岛；三日后波斯舰队才到，只得在更远的米克利下锚；帕曼纽请战被亚历山大回绝（自认舰队数量与海战技巧都不及腓尼基、塞浦路斯水手）；亚历山大派菲罗塔斯前往米克利断其取水补给，波斯舰队退往萨摩斯、终于离开米利都海域；战后亚历山大解散海军，改以陆军夺取波斯所有海军基地。文案按主人规矩不写兵力确数。' } },
        commanderUnit: 'hero_mounted_alexander',
        foeCommanderUnit: 'hero_aristagoras',
        briefing: '格拉尼库斯河一仗打完，波斯在小亚细亚的总督几乎死绝，赫勒斯滂弗里吉亚全境落到亚历山大手里；萨第斯、以弗所相继开门投降。米利都的波斯驻军守将赫格西斯特本也答应献城，可附近的波斯军还没走远，波斯舰队又许诺来援，他便反悔了，只肯让米利都保持中立、对双方都开放港口。\n\n亚历山大不肯讲这个价：他先分兵去取伊奥尼亚尚未臣服的城镇，自己带着剩下的人马直趋米利都。帕曼纽之子尼卡诺尔抢先一步，率马其顿舰队占住城外的莱德岛，把兵运上岛去。三天之后，波斯舰队才姗姗赶到，见莱德岛已被人占住，只得在更远的米克利下锚。\n\n帕曼纽劝亚历山大趁势打一场海战，亚历山大回绝了：马其顿的船比人家少，水手也不如腓尼基、塞浦路斯人老练，输了更要动摇希腊本土。他只让舰队守住港口，一步不出。\n\n第二天，陆海两军同时动手。陆军架起投石机轰击城墙，从缺口冲进城去；尼卡诺尔的舰队封死港口，叫波斯舰队一粒粮也送不进来。城里的守军大多被歼，只有少数人退到城外小岛上——那队希腊雇佣兵已经决意死战，亚历山大看了不忍，说他们是忠诚而高尚的战士，把他们收编进自己的军中，岛上其余的人都放了。\n\n此后他又派菲罗塔斯去米克利，断了波斯舰队的取水与补给。波斯舰队退到萨摩斯，终于离开米利都海域。经此一仗，亚历山大认清马其顿舰队敌不过波斯海军，索性解散了自己的海军，改定一条大策：用陆军把波斯所有的海军基地一座座拔掉，让那支舰队无港可归。',
        type: 'siege',
        title: '公元前334年 米利都战役',
        description: '马其顿军取米利都：亚历山大先分兵扫平伊奥尼亚尚未臣服的城镇，自率主力南下围城；帕曼纽之子尼卡诺尔抢先占住莱德岛，把波斯舰队逼在港外。陆军以投石机轰塌城墙、自缺口突入，守军大多被歼，退守小岛的希腊雇佣兵被亚历山大收编入伍。米利都归马其顿，伊奥尼亚全境臣服；此战之后亚历山大认清马其顿舰队敌不过波斯海军，解散海军，改以陆军逐座拔掉波斯的海军基地。',
        siegeData: {
            title: '米利都战役',
            description: '米利都守军以希腊雇佣兵为主力、波斯守军据内城，凭城墙与港口死守；马其顿陆军以投石机轰击城墙、自缺口攻入，尼卡诺尔率舰队封锁港口使波斯舰队无法支援，城遂破。',
            marchWaypoints: ['city_sifaerde', 'city_yifusuo'],
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 18000,
            attackerSourceCityId: 'city_yanghe',   // 出兵据点＝军团此刻在哪：上一场格拉尼库斯战场，按 §三.1 取那年离战场最近且已存在的据点＝羊河（58 公里）
            attackerLegionName: '马其顿军',
            defenderGeneralId: 'yiaoniya_hegesistratus',
            defenderTroops: 3000,
            defenderCityId: 'city_miletus',
            defenderLegionName: '阿契美尼德军',
            result: 'attacker_win',
            autoEnterRTS: true,
        },
        cityUpdates: [{ cityId: 'city_miletus', factionId: 'maqidun' }],
    },
    // ── 由战场事件编辑器生成（/battlefield-editor.html）──
    {
        year: -334,
        season: 2,
        generalId: 'gen_alexander_great',
        inviteText: '朋友，前头是哈利卡纳苏斯——卡里亚的坚城。门农在那里等着我：他刚当上波斯在小亚细亚的总指挥，手里还攥着一支舰队，港里泊得满满的，摆明了要跟我耗。城防他加固过不止一遍，护城河又宽又深。你看着，我把壕填了、把投石机架上去，一段一段把他的墙打下来。你可愿随我打这一仗？',
        sources: { battle: { level: 'fact', text: '英文维基百科 Siege of Halicarnassus：前334年马其顿与阿契美尼德波斯的攻城战（亚历山大东征中的攻城战）；中文维基百科「哈利卡那索斯圍城戰」同条记其为东征中与波斯之间的一场攻城战。' }, time: { level: 'popular', text: '英文维基百科 Siege of Halicarnassus 信息框 date = 334 BC；中文维基百科同条目亦记前334年，两者均未给月份。此役在米利都围城（夏）之后，围城结束后亚历山大遣新婚士兵回乡过冬（英文维基 Aftermath 节），故季节取秋。可信级别：通行说法。' }, place: { level: 'fact', text: '英文维基百科 Siege of Halicarnassus 信息框 coordinates 37.0333,27.4333（今土耳其博德鲁姆），即卡里亚都城哈利卡纳苏斯（摩索拉斯陵墓所在）；本据点记录坐标 37.03,27.43 与之一致。' }, attacker: { level: 'fact', text: '英文维基百科 Siege of Halicarnassus 信息框 commander1 = Alexander the Great；中文维基百科「哈利卡那索斯圍城戰」：亚历山大亲统陆军围城，部将佩尔狄卡斯所部亦在阵中（营中两名士兵冒进引燃总攻）。' }, attackerTroops: { level: 'inferred', text: '中、英文维基信息框均未给双方兵力（英文只给伤亡 16 : 170）。同一支马其顿军自格拉尼库斯（英文维基 Battle of the Granicus 信息框 18,100）连战未获大补，其间又分兵留守、另有部队被派去取伊奥尼亚未服城镇，故沿用前两场的量级取 18,000 —— 合理推定。' }, attackerLegion: { level: 'fact', text: '同东征诸役：马其顿军（前伙伴骑兵、中方阵步兵、后克里特弓箭手，鱼鳞阵 3-4-2，整场战争不换）。此役陆军填平护城河、架投石机轰城，并自被撞开的城墙缺口攻入（中文维基百科「哈利卡那索斯圍城戰」，据阿里安《亚历山大远征记》卷一）。' }, defender: { level: 'fact', text: '英文维基百科 Siege of Halicarnassus 信息框 commander2 = Orontobates、Memnon of Rhodes；中文维基百科同条：米利都战后波斯在哈利卡纳苏斯集结重兵，希腊雇佣军将领**罗得岛的门农受任小亚细亚总指挥、统率波斯舰队**并主持防务；卡里亚总督为**欧戎托巴提斯**（皮克索达拉斯之婿，皮克索达拉斯卒后由大流士三世任命）。本场守方主帅取门农。' }, defenderTroops: { level: 'inferred', text: '中、英文维基信息框均未给守方兵力（英文信息框只给伤亡 170）。中文维基记波斯在城中「聚集大批部队和希腊雇佣军」、以希腊雇佣军为主力，且能连日出城反击、夜袭烧器械、城破前从容整队夜遁，其众当以千计；按前一场米利都同一口径取 3,000（远少于攻方 18,000）—— 合理推定。' }, defenderLegion: { level: 'fact', text: '中文维基百科「哈利卡那索斯圍城戰」（据阿里安《亚历山大远征记》卷一）：守城主力为希腊雇佣军，另有波斯守军；波斯舰队泊于港内策应，援军曾乘船自海上抵达。守方军团取剧本军团「阿契美尼德军」（英文维基信息框 combatant2 = Achaemenid Empire，与格拉尼库斯、伊苏斯、加沙同一番号）。' }, route: { level: 'fact', text: '中文维基百科「哈利卡那索斯圍城戰」背景节（据阿里安《亚历山大远征记》卷一）：米利都围城战后，波斯在卡里亚的哈利卡纳苏斯集结部队与希腊雇佣军；亚历山大进入卡里亚境内，前女王阿妲献出要塞阿林达来投，随即围城。游戏路线：自上一处战场（米利都，攻城战＝那座城）开拔，沿主人新修的「米利都-哈利卡纳苏斯」道路南下直抵该城；阿林达不在据点库中，按铁律不新建、不写路标。' }, result: { level: 'fact', text: '英文维基百科 Siege of Halicarnassus：马其顿胜，territory = Alexander captures Caria。中文维基百科「哈利卡那索斯圍城戰」（据阿里安《亚历山大远征记》卷一）：门农与欧戎托巴提斯见城墙已倒一段、伤兵日增，决定弃城；波斯残军趁夜退出并焚烧城中军需，当晚风大，全城陷入火海；战后亚历山大仅得一座残城，留部分军队驻守，并把卡里亚交给阿妲统领。故本场「战后归属」按历史写哈利卡纳苏斯归马其顿（卫城仍为波斯守军据守，其后始下）。' }, invite: { level: 'fact', text: '邀约对白所据史事：中文维基百科「哈利卡那索斯圍城戰」——门农受任小亚细亚总指挥、统率波斯舰队，在哈利卡纳苏斯加强防御并令舰队泊于港口；亚历山大填平护城河、架投石机轰城。对白措辞为撰写。' }, briefing: { level: 'fact', text: '中、英文维基百科「哈利卡那索斯圍城戰」与阿里安《亚历山大远征记》卷一：内应约开城门未成、守军拼死抵抗而波斯援军乘船抵达，亚历山大先攻旁近要塞无功；其后填壕架炮，守军夜袭烧器械被击退；佩尔狄卡斯营中两名士兵冒进引来总攻，城墙被撞开、泥瓦匠旋即补砌新墙；连日轰城双方僵持，守军伤亡渐重；门农与欧戎托巴提斯决意弃城，残军夜遁纵火，风助火势焚毁全城；亚历山大急令追击并扑火救民，战后把卡里亚交阿妲。文案按主人规矩不写兵力确数。' } },
        commanderUnit: 'hero_mounted_alexander',
        foeCommanderUnit: 'hero_aristides',
        briefing: '米利都既下，波斯把兵力与希腊雇佣军一齐集中到卡里亚的哈利卡纳苏斯。罗得岛的门农刚受任小亚细亚总指挥、又统率着波斯舰队，他把城防处处加固，舰队就泊在港里，摆明了要在这里跟亚历山大耗下去。\n\n亚历山大进入卡里亚境内，被废黜的前女王阿妲带着她仅剩的要塞阿林达来投。可哈利卡纳苏斯握着大兵，这一仗只能硬打。\n\n他先想拿城旁那座要塞当跳板：城中内应约定时辰开城，可他带着小部队赶到墙下时，内应已被波斯军发觉，城门没有开。他命人挖墙脚强攻，守军拼死抵抗，波斯的援军又乘船赶到，他只得收兵，回头专心围哈利卡纳苏斯。\n\n填平护城河、架起投石机之后，波斯守军夜里出城来烧器械，被马其顿军打退。过了几天，佩尔狄卡斯营里两名士兵莽撞逼近城墙，竟引得双方大打一场：城墙被撞开一段，城里的泥瓦匠很快又砌起一道新墙。此后连日投石轰城，守军不断出城反击，墙上的守兵居高临下打下来，双方都没讨到便宜，只是守军伤亡一天天重起来。\n\n门农与欧戎托巴提斯见城墙已倒了一段、伤兵日渐增多，决意弃城。波斯残军趁夜退出，并放火烧了城中军需；那一夜风大，火把整座哈利卡纳苏斯吞了进去。亚历山大急令追击，又命人扑火、救护城中百姓——他最后到手的，只是一座残城。他留下部分军队驻守，把卡里亚交给阿妲统领，继续东进。',
        type: 'siege',
        title: '公元前334年 哈利卡纳苏斯战役',
        description: '马其顿军取哈利卡纳苏斯：亚历山大先攻旁近要塞无功，转而填壕架炮强攻坚城；守军夜袭烧器械、白日居高反击，双方僵持多日，城墙终被撞开一段。门农与欧戎托巴提斯见伤兵日增，决意弃城，波斯残军趁夜退出并纵火焚城，风大火烈全城化为火海。亚历山大急令追击扑火、救护百姓，最后只得到一座残城；哈利卡纳苏斯归马其顿，卡里亚交由前女王阿妲统领。',
        siegeData: {
            title: '哈利卡纳苏斯战役',
            description: '守军以希腊雇佣军为主力、波斯舰队泊于港内策应，凭护城河、投石机与城墙死守；马其顿军填平壕沟、架炮轰墙，自被撞开的缺口强攻，守军当夜弃城纵火，城破。',
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 18000,
            attackerSourceCityId: 'city_miletus',
            attackerLegionName: '马其顿军',
            defenderGeneralId: 'halikanasu_memnon',
            defenderTroops: 3000,
            defenderCityId: 'city_halikanasu',
            defenderLegionName: '阿契美尼德军',
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
            marchWaypoints: ['city_geerdiweng', 'city_ankala', 'city_yikeniwumu', 'city_adana'],

            // ── 攻方：马其顿 亚历山大 ──
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerLegionName: '马其顿军',   // 剧本军团：亚历山大所率马其顿军，整场东征同一支
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
        // 🔴 [2026-09-24 主人怒斥「怎么从加沙到的孟菲斯？」同一类毛病] 出兵据点＝军团此刻在哪＝哈利卡纳苏斯（上一场落点）；
        //    戈尔迪乌姆写在路标里（前333年春在此斩断戈尔迪之结），军团走过去，不瞬移 492 公里
        // 阿达纳挂的「蛇堡」是中世纪亚美尼亚城堡，前333年尚无 → 本场不显示该城（路照走）
        absentCities: ['city_adana'],
        inviteText: '朋友，你来得正好。我在戈尔迪乌姆斩断了那个无人能解的结，传说解开它的人将成为亚细亚之王。大流士已在巴比伦集结大军，我要越过托罗斯山，进入奇里乞亚迎战他。你可愿随我同往？',
        // 🔴 [2026-09-23] 资料清单：每项依据与可信级别（src/data/eventSources.ts）
        sources: { battle: { level: 'fact', text: '英文维基百科 Battle of Issus：伊苏斯战役，野战，两军在皮纳鲁斯河两岸会战。' }, time: { level: 'fact', text: '英文维基百科 Battle of Issus 信息框：前333年11月5日，季节取秋。' }, place: { level: 'fact', text: '英文维基百科 Battle of Issus：伊苏斯城以南的皮纳鲁斯河，今土耳其哈塔伊省；坐标取信息框 36.7525,36.1923。海湾到群山之间仅2.6公里。' }, attacker: { level: 'fact', text: '英文维基百科 Battle of Issus：马其顿与希腊同盟，亚历山大亲统右翼伙伴骑兵，帕曼纽统左翼。' }, attackerTroops: { level: 'fact', text: '英文维基百科 Battle of Issus 信息框：马其顿军共约37000人。' }, attackerLegion: { level: 'fact', text: '同格拉尼库斯河战役：马其顿军，前骑兵、中方阵、后远程，鱼鳞阵；此役亚历山大仍亲率伙伴骑兵为决胜一击。' }, defender: { level: 'fact', text: '英文维基百科 Battle of Issus：阿契美尼德帝国，大流士三世亲征。' }, defenderTroops: { level: 'fact', text: '英文维基百科 Battle of Issus 信息框：现代估计5万至10万，中值75000；主人定守方不超过攻方2倍，37000×2=74000，在区间内，取74000。' }, defenderLegion: { level: 'fact', text: '英文维基百科 Military of the Achaemenid Empire：职业常备军统称 spāda，后世通称阿契美尼德军。英文维基百科 Battle of Issus：骑兵约1.8万、长生军与希腊雇佣兵及亚美尼亚步兵约6万、轻步兵3万至8万；波斯骑兵率先渡河冲击，故前骑兵中步兵后远程，鹤翼阵2-4-3。' }, route: { level: 'fact', text: '英文维基百科 Alexander the Great 与 Battle of the Granicus：格拉尼库斯战后亚历山大南下，经萨迪斯、以弗所、米利都，前334年秋冬围哈利卡纳苏斯，其后北上弗里吉亚；前333年春在古都戈尔迪乌姆斩断戈尔迪之结，东至安库拉，再南下经卡帕多西亚、过托罗斯山即奇里乞亚门入奇里乞亚，驻军塔尔苏斯，得知大流士在巴比伦集结大军后南下，于伊苏斯迎战。游戏路线：出发地＝上一处战场（哈利卡纳苏斯），不写出发据点（军团此刻就在那座城里，写了就是瞬移）；途经 戈尔迪乌姆 → 安卡拉即古安库拉 → 伊科尼乌姆 → 阿达纳即塔尔苏斯附近 → 伊苏斯（以弗所那一段属格拉尼库斯～米利都两场，本场自哈利卡纳苏斯出发不再绕回以弗所）。⚠️ 路网缺口两处，已报主人建路：哈利卡纳苏斯→戈尔迪乌姆 893 公里、绕远 1.81 倍；阿达纳→伊苏斯战场 226 公里、绕远 2.74 倍（安提俄基亚-阿达纳那条路朝西南绕，军团先往西南再折回东北）。' }, result: { level: 'fact', text: '英文维基百科 Battle of Issus：马其顿胜，大流士弃军逃走，母亲、妻子、两个女儿被俘；伊苏斯是战场，无据点易主。' }, invite: { level: 'fact', text: '英文维基百科 Alexander the Great：戈尔迪乌姆斩断戈尔迪之结，传说能解开者将为亚细亚之王；英文维基百科 Battle of Issus：大流士在巴比伦集结大军。对白措辞为撰写，史事有据。' }, briefing: { level: 'fact', text: '英文维基百科 Battle of Issus：海湾到群山仅2.6公里即两英里；大流士绕到马其顿军后方占领伊苏斯、砍去伤病员之手；马其顿军约3.7万，波斯军按中值7.5万，播报写三万七千、七万五千；方阵居中、亚历山大率伙伴骑兵在右翼。' } },
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
        sources: { battle: { level: 'fact', text: '英文维基百科 Siege of Gaza (332 BC)：亚历山大东征中的攻城战，前332年马其顿军攻取加沙要塞。' }, time: { level: 'fact', text: '英文维基百科 Siege of Gaza (332 BC)：前332年10月破城（围城历时约两月；日文维基作三个月，从英文）。季节取秋。' }, place: { level: 'fact', text: '英文维基百科 Siege of Gaza (332 BC)：加沙要塞踞于高地、距海约五英里，控扼叙利亚通往埃及的大道，城墙高逾十八米；坐标取本据点记录 31.5017,34.4668。' }, attacker: { level: 'fact', text: '英文维基百科 Siege of Gaza (332 BC)：马其顿军，亚历山大亲统。' }, attackerTroops: { level: 'inferred', text: '英文维基百科 Siege of Gaza (332 BC) 未给攻方兵数；同一支马其顿军推罗战后未获大补，沿用伊苏斯与推罗两场的 35,000–40,000，取 37500 —— 合理推定。' }, attackerLegion: { level: 'fact', text: '同东征诸役：马其顿军，前伙伴骑兵、中方阵步兵、后克里特弓箭手，鱼鳞阵 3-4-2。' }, defender: { level: 'fact', text: '英文维基百科 Siege of Gaza (332 BC)：要塞守将巴提斯（Batis），时属阿契美尼德波斯治下，拒不投降。' }, defenderTroops: { level: 'inferred', text: '英文维基百科 Siege of Gaza (332 BC)：城破时加沙方面阵亡约一万（男丁被杀、妇孺为奴），据此守方兵力取 10000 —— 合理推定（史无守军确数）。' }, defenderLegion: { level: 'fact', text: '英文维基百科 Siege of Gaza (332 BC)：守方为波斯守军与阿拉伯雇佣兵（本据点精锐番号即「加沙雇佣兵」），凭高墙、土山与弩炮据守；番号取阿契美尼德军（巴提斯所部属波斯军系）。' }, route: { level: 'fact', text: '英文维基百科 Siege of Gaza (332 BC) 与 Siege of Tyre (332 BC)：亚历山大前332年夏取推罗后率军南下进围加沙，并把推罗用过的攻城器械一并运来破其高墙（承前一场）。游戏路线：自上一处战场（推罗）直接开拔南下抵加沙，路网取道阿音贾鲁特—耶路撒冷—加沙，273 公里（直线 208）。战后：自加沙南下埃及（佩鲁西姆—孟菲斯—亚历山大城），孟菲斯归马其顿、亚历山大在孟菲斯加冕为法老（本场 cityUpdates 已写）；前331年回师，军团自加沙开拔北上（见下一场路标）。' }, result: { level: 'fact', text: '英文维基百科 Siege of Gaza (332 BC)：马其顿胜。城破后男丁被杀、妇孺贩为奴，加沙方面阵亡约一万；巴提斯拒不投降，按库尔提乌斯所记被拖于战车之后处死；加沙入马其顿之手。英文维基百科 Alexander the Great 与 Siege of Gaza (332 BC)：加沙既下，通往埃及的门户打开，亚历山大随即进军埃及，波斯埃及总督马扎克斯不战而降，孟菲斯归马其顿，他并在孟菲斯加冕为法老。故本场「战后归属」按历史写两处易主：加沙、孟菲斯。' }, invite: { level: 'fact', text: '邀约对白所据史事：英文维基百科 Siege of Gaza (332 BC)：巴提斯拒不投降，亚历山大以推罗运来的攻城器械破墙，三次强攻后入城；对白措辞为撰写。' }, briefing: { level: 'fact', text: '英文维基百科 Siege of Gaza (332 BC)：加沙踞高地、城墙高逾十八米，马其顿军筑土山、调推罗攻城器械破墙；守军曾出击烧器械，亚历山大在反击中肩部受伤。英文维基百科 Alexander the Great：加沙既下亚历山大进军埃及，马扎克斯不战而降。文案按主人规矩不写兵力确数。' } },
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
        cityUpdates: [{ cityId: 'city_jiasa', factionId: 'maqidun' }, { cityId: 'city_mengfeisi', factionId: 'maqidun' }],
        briefing: '推罗既下，亚历山大沿海南下，直取通往埃及大道上的加沙。这座城踞在高地上，距海约五英里，城墙高逾十八米，守将巴提斯拒不投降。\n\n马其顿军把推罗用过的攻城器械一并运来，在城下筑起土山。守军曾出城焚烧器械，亚历山大在反击中肩部受伤，仍三次强攻不止。\n\n城破之后，加沙的男丁被杀、妇孺被贩为奴；巴提斯拒不低头，按库尔提乌斯所记被拖在战车之后处死。通往埃及的门户就此打开。\n\n亚历山大随即进军埃及，波斯埃及总督马扎克斯不战而降，孟菲斯归马其顿，他并在孟菲斯加冕为法老。',
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
            attackerSourceCityId: 'city_jiasa',

            // ── 守方：波斯阿契美尼德帝国大军 大流士三世 ──
            defenderFactionId: 'aqimeinide',
            defenderGeneralId: 'daliushi_iii',
            defenderTroops: 85000,                   // 现代史学界估计 50,000 至 100,000 人（中高值）
            defenderSourceCityId: 'city_bosibolisi',

            result: 'attacker_win',                  // 写真历史：马其顿决定性胜利
            autoEnterRTS: true,                      // 进战术模式（13）
            defenderLegionName: '阿契美尼德军',
        },
        // 🔴 [2026-09-24 主人定「野战后，根据历史，据点也要有归属问题」] 高加米拉战后按史实易主的据点：
        //    英文维基百科 Battle of the Uxian Defile 背景节：亚历山大进抵巴比伦，总督马扎欧斯献城，
        //    休整数日并设为第二基地；自巴比伦走二十日至波斯冬都苏萨。美索不达米亚与苏锡安那两城归马其顿。
        cityUpdates: [{ cityId: 'city_babilun', factionId: 'maqidun' }, { cityId: 'city_susa', factionId: 'maqidun' }],
        generalId: 'gen_alexander_great',
        // 🔴 [2026-09-24 主人怒斥「怎么从加沙到的孟菲斯？？？还史料如此？」] 出兵据点＝**军团此刻在哪**：
        //    上一场（前332年秋加沙围城）打完，军团就停在加沙；原来写孟菲斯（理由「史料：自埃及出发」）＝
        //    把军团从加沙白送 358 公里到孟菲斯，属瞬移。埃及那一节本来就在路标里（佩鲁西姆→孟菲斯→亚历山大城→佩鲁西姆→加沙），军团走过去。
        commanderUnit: 'hero_mounted_alexander',   // 主将队：素材样貌为骑马的亚历山大
        inviteText: '朋友，你来得正好。大流士又派人来了，这回连女儿和半个帝国都舍得给——我都没要。他挑了块铲得干干净净的平野，好让他的镰刀战车跑起来。可惜他也给我留了一条路：他的中军。你可愿随我走这一趟？',
        sources: { battle: { level: 'fact', text: '英文/中文维基百科 Battle of Gaugamela（高加米拉战役）：前331年马其顿与阿契美尼德波斯的决战，野战。' }, time: { level: 'fact', text: '维基百科高加米拉战役信息框：前331年10月1日，季节取秋。' }, place: { level: 'fact', text: '维基百科高加米拉战役信息框：战场可能在今伊拉克库尔德斯坦艾比尔附近的提尔·高美尔（Tel Gomel）周遭，坐标 36.56,43.444。' }, attacker: { level: 'fact', text: '维基百科高加米拉战役：马其顿王国与泛希腊同盟，亚历山大亲统，帕曼纽、菲罗塔斯、克拉特鲁斯、佩尔狄卡斯等分领各部。' }, attackerTroops: { level: 'fact', text: '维基百科高加米拉战役信息框：40,000 名步兵 + 7,000 名骑兵 = 47,000（Green 2013）。' }, attackerLegion: { level: 'fact', text: '维基百科高加米拉战役「Initial dispositions」：马其顿方阵居中双列推进，亚历山大率伙伴骑兵自右翼突破，帕曼纽率色萨利与色雷斯骑兵守左翼，克里特与希腊雇佣兵在右中；编成仍取马其顿军（前伙伴骑兵、中方阵步兵、后克里特弓箭手，鱼鳞阵 3-4-2）。' }, defender: { level: 'fact', text: '维基百科高加米拉战役：阿契美尼德帝国，大流士三世亲统；贝苏斯领左翼（巴克特里亚、斯基泰等），马扎欧斯领右翼（叙利亚、米底、美索不达米亚等）。' }, defenderTroops: { level: 'fact', text: '维基百科高加米拉战役信息框：现代文献估计 50,000–120,000，按标准取区间中值 85,000（守/攻 = 1.81，在 1:2 之内）。' }, defenderLegion: { level: 'fact', text: '维基百科高加米拉战役「Initial dispositions」：大流士居中率精锐步兵（「苹果持兵」/希腊人所称长生军）与马尔迪亚弓手，两翼为各地骑兵，阵前布镰刀战车，另有十五头印度战象（战中未见出动、后在营中被缴，推为撤走）；编成取剧本军团「阿契美尼德军」（同一支波斯军，与伊苏斯、格拉尼库斯同一番号）。' }, route: { level: 'fact', text: '维基百科 Battle of Gaugamela 与 Siege of Gaza (332 BC)：加沙战后亚历山大南下埃及，波斯埃及总督马扎克斯不战而降（埃及无战事）；前331年在孟菲斯受冕为法老，并于尼罗河口建亚历山大城，随后西行锡瓦求阿蒙神谕，再回师北上推罗，经叙利亚北渡幼发拉底，东进至高加米拉。游戏路线：自上一处战场（加沙）开拔 → 佩鲁西姆 → 孟菲斯 → 亚历山大城 → 加沙 → 推罗 → 大马士革 → 阿勒颇 → 埃德萨 → 尼尼微 → 高加米拉。（原数据写「自孟菲斯出发」＝把军团白送过去，已改为走出去。）' }, result: { level: 'fact', text: '维基百科高加米拉战役：马其顿决定性胜利。大流士弃阵东逃，波斯帝国半壁江山与巴比伦在内的美索不达米亚全境入亚历山大之手；阿契美尼德方面伤亡据库尔提乌斯约四万，马其顿方面伤亡极轻（阿里安记百名步兵、千名骑兵）。战后巴比伦总督马扎欧斯献城、波斯冬都苏萨随后亦入马其顿之手（英文维基百科 Battle of the Uxian Defile 背景节），故本场据点归属写巴比伦与苏萨归马其顿。' }, invite: { level: 'fact', text: '邀约对白所据史事：维基百科高加米拉战役：大流士三世三次遣使求和（赎回眷属、割让哈吕斯河以西、乃至愿与亚历山大平起平坐），亚历山大皆拒；决战前大流士在巴比伦重整大军、平野布阵以待。对白措辞为撰写。' }, briefing: { level: 'fact', text: '维基百科高加米拉战役：大流士为之铲平战场植被以便镰刀战车驰突，并布十五头印度战象（战中撤回）；马其顿方阵居中推进、两翼后斜，亚历山大率伙伴骑兵绕至右翼缺口直扑大流士本阵。文案按主人规矩不写兵力确数。' } },
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
            attackerSourceCityId: 'city_niniwei',   // 出兵据点＝军团此刻在哪：上一场高加米拉战场，按 §三.1 取那年离战场最近且已存在的据点＝尼尼微（34 公里）；巴比伦是沿途路标
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
        sources: { battle: { level: 'fact', text: '英文维基百科 Battle of the Persian Gate：波斯门战役，前330年冬马其顿军与阿契美尼德波斯军在波斯门隘口的野战，隘口最窄处只容数人并行。' }, time: { level: 'fact', text: '英文维基百科 Battle of the Persian Gate：前330年冬，阿里奥巴赞斯据隘口抵挡马其顿军约一个月；条目信息框 date = 330 BC。波斯文维基百科 نبرد دربند پارس 亦记此役在前330年。' }, place: { level: 'fact', text: '英文维基百科 Battle of the Persian Gate 信息框 location = Persian Gate, near Persepolis，coordinates 30°42′30″N 51°35′55″E，即今伊朗法尔斯省波斯波利斯西北的扎格罗斯山口；按主人定口径坐标取信息框值 30.7083,51.5986。波斯文维基百科 نبرد دربند پارس 记战场在**今贝赫贝汉附近**，属当地语种说法，一并记录以备核对。' }, attacker: { level: 'fact', text: '英文维基百科 Battle of the Persian Gate：马其顿与科林斯同盟，亚历山大亲统；攻隘受挫后亲率精兵夜间翻山绕至守军背后，托勒密与佩尔狄卡斯分路合围，克拉特鲁斯留守营中牵制。' }, attackerTroops: { level: 'fact', text: '英文维基百科 Battle of the Persian Gate 信息框 strength1 = 17,000 picked fighters，攻方兵力取 17000；正文另记阿里安称面对的马其顿军逾一万人。' }, attackerLegion: { level: 'fact', text: '同东征前五场与乌克西亚隘口：马其顿军，前伙伴骑兵、中方阵步兵、后克里特弓箭手，鱼鳞阵 3-4-2；同一支军队整场战争不换。' }, defender: { level: 'fact', text: '英文维基百科 Battle of the Persian Gate 信息框 combatant2 = Achaemenid Empire，commander2 = Ariobarzanes of Persis 与 Youtab，两人皆记阵亡；阿里奥巴赞斯受命阻止马其顿军进入波斯本土。' }, defenderTroops: { level: 'fact', text: '英文维基百科 Battle of the Persian Gate 信息框 strength2 列两说：阿里安记 40,000 步兵与 700 骑兵；现代估计 700–2,000，Encyclopædia Iranica 认为至多 2,000，但同处说明多数现代史家仍照阿里安、库尔提乌斯与狄奥多罗斯取值。按主人定 1:2（守方不超过攻方 2 倍）：17000 × 2 = 34000，取 34000。波斯文维基百科 نبرد دربند پارس 记阿里奥巴赞斯所部为 700 步兵与 40 骑兵，一并记录。' }, defenderLegion: { level: 'fact', text: '英文维基百科 Battle of the Persian Gate：守军据石垒居高临下，北坡滚石、南坡弓矢。守方军团取剧本军团「阿契美尼德军」，与格拉尼库斯、伊苏斯、高加米拉同一番号，整场战争不换。' }, route: { level: 'fact', text: '英文维基百科 Battle of the Persian Gate 背景节：取苏萨后亚历山大分兵，帕曼纽率一半人马沿御道东进，亚历山大自取通往波斯本土的山路；沿途先平乌克西亚人，再入波斯门，入隘时未派斥候而中伏。游戏路线：自上一处战场（乌克西亚隘口，苏萨以东约六十公里）继续沿苏萨—波斯波利斯大道东南行，入扎格罗斯山至波斯门。⚠️ 路网缺口：寻路只在据点入路，而隘口一百五十一公里内没有据点，故编辑器实测末段须离路直行一百五十一公里、经苏萨与波斯波利斯的绕行段达 838 公里，绕远 2.34 倍；实际那条大道从隘口旁约五公里处经过。已报主人，待其决定在隘口附近加据点或另作安排。' }, result: { level: 'fact', text: '英文维基百科 Battle of the Persian Gate：马其顿突破隘口。阿里奥巴赞斯据险死守近一月，其部尽没；他本人或战死于最后的冲锋，或北逃后向亚历山大归降；另有史家记其退至波斯波利斯，城门被守库贵族提里达特斯关闭，遂在城外被歼。战后亚历山大任命弗拉索尔特斯继其位，进占波斯波利斯并取其府库，波斯波利斯由此归马其顿（故本场据点归属写波斯波利斯易主）；前330年5月焚波斯波利斯王宫。' }, invite: { level: 'fact', text: '邀约对白所据史事：英文维基百科 Battle of the Persian Gate：亚历山大入隘口时未派斥候、中伏受重创并弃阵亡者而退；其后由俘虏或当地牧羊人引路绕至守军背后。对白措辞为撰写。' }, briefing: { level: 'fact', text: '英文维基百科 Battle of the Persian Gate 与波斯文维基百科 نبرد دربند پارس：隘口最窄处只容数人并行，波斯军自北坡投石、南坡射箭；波斯文维基记一名当地牧羊人或农夫为亚历山大指路绕行，阿里奥巴赞斯与数名骑兵脱逃。文案按主人规矩不写兵力确数。' } },
        commanderUnit: 'hero_mounted_alexander',
        foeCommanderUnit: 'hero_artaphernes',
        type: 'field_battle',
        title: '公元前330年 波斯门战役',
        description: '马其顿军获胜：亚历山大强攻波斯门受挫、全军被压在窄道中伤亡惨重，弃尸而退；其后得俘虏或当地牧羊人引路，亲率精兵趁夜翻山绕至守军背后，托勒密与佩尔狄卡斯分路合围，克拉特鲁斯在营中牵制，终于突破隘口。阿里奥巴赞斯据险死守近一月，此战被视为亚历山大东征中最凶险的一关；战后通往波斯波利斯的最后一道屏障扫清，波斯波利斯归马其顿。',
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
        // 🔴 [2026-09-24 主人定「野战后，根据历史，据点也要有归属问题」] 波斯门战后按史实易主的据点：
        //    英文维基百科 Battle of the Persian Gate：突破隘口后亚历山大进占波斯波利斯并取其府库，波斯波利斯归马其顿。
        cityUpdates: [{ cityId: 'city_bosibolisi', factionId: 'maqidun' }],
    },
    // ── 由战场事件编辑器生成（/battlefield-editor.html）──
    {
        year: -329,
        season: 2,
        generalId: 'gen_alexander_great',
        inviteText: '朋友，你来得正好。眼前这道药杀水是帝国疆界的尽头，对岸的斯基泰游牧骑兵已经列在河滩上，隔水叫骂，说我连渡河的胆量都没有。他们打的是半渡而击的主意：等我的人马泡在水里，好用骑射一个一个点名。我偏不让他们如意——砲车与弓手先压住对岸，全军同时下水，一鼓作气冲上北岸；脚一沾地，他们的回旋奔射就讨不到便宜了。你可愿随我渡这一趟？',
        sources: { battle: { level: 'fact', text: '英文维基百科 Battle of Jaxartes：前329年亚历山大与塞种（Saka）在药杀水（今锡尔河）的野战，马其顿胜；中文维基百科「亚历山大大帝」同记其渡河北击草原游牧。' }, time: { level: 'fact', text: '英文维基百科 Battle of Jaxartes 信息框 date = 329 BC；同条目战役地图标注「Battle of Jaxartes October 329 BC」，故季节取秋。' }, place: { level: 'fact', text: '英文维基百科 Battle of Jaxartes 信息框 coordinates 40°17′00″N 69°37′00″E、location = Syr Darya（今锡尔河，战场跨乌兹别克、塔吉克、吉尔吉斯、哈萨克边境，在古塔什干西南、苦盏东北）；本战场记录取 40.2833,69.6167。' }, attacker: { level: 'fact', text: '英文维基百科 Battle of Jaxartes 信息框 combatant1 = Macedonia、League of Corinth，commander1 = Alexander the Great —— 亚历山大亲统。' }, attackerTroops: { level: 'fact', text: '英文维基百科 Battle of Jaxartes 信息框 strength1 = 6,000，攻方兵力取 6000；同信息框伤亡记马其顿阵亡 160、伤 1,000。' }, attackerLegion: { level: 'fact', text: '同东征诸役：马其顿军（前伙伴骑兵、中方阵步兵、后克里特弓箭手，鱼鳞阵 3-4-2，整场战争不换）。此役据英文维基正文：塞种低估马其顿「artillery、fleet、cavalry、infantry」的协同，亚历山大令全军**同时齐渡**、以砲兵与弓箭手掩护，渡后以弓箭手与骑兵击破塞种包围（Dani & Bernard 1994：crossed the river and broke through the encircling Sakas with the help of his archers and cavalry）。' }, defender: { level: 'fact', text: '英文维基百科 Battle of Jaxartes 信息框 combatant2 = Saka（塞种/萨迦）、commander2 = Satraces（萨特拉克斯）；正文记约 1,200 名塞种被围歼、**含其主帅 Satraces**，另俘 150 人、缴马 1,800。' }, defenderTroops: { level: 'inferred', text: '英文维基百科 Battle of Jaxartes 信息框 strength2 = Unknown，条目与中文维基均未给塞种兵数。据其阵亡约 1,200（含主帅）、被俘 150、缴马 1,800，其众当以千计；取 6,000（并守守方 ≤ 攻方×2 = 12,000）—— 合理推定。' }, defenderLegion: { level: 'fact', text: '英文维基百科 Battle of Jaxartes：塞种据药杀水北岸，自信可在马其顿半渡登陆时取胜，以骑射手为主要打击手段。编成取剧本军团「斯基泰军」：前骑兵=斯基泰骑射手 4、中步兵=塞种萨迦斧兵 3、后远程=巴克特里亚弓手 2，雁行 4-3-2（同一支军队整场战争不换）。' }, route: { level: 'fact', text: '英文维基百科 Battle of Jaxartes 背景节（引 Dani & Bernard 1994）：亚历山大先据马拉坎达（撒马尔罕，粟特王夏都），因忧药杀水以北的塞种而北进，过居鲁士城沿途取七座要塞，抵阿契美尼德疆界药杀水，遂渡河破围。游戏路线（自上一处战场波斯门开拔，全程陆路）：波斯波利斯 → 亚兹德 → 伊斯法罕 → 雷伊 → 达姆甘 → 尼沙布尔 → 图斯 → 萨拉赫斯 → 木鹿 → 阿母城（乌浒水渡口） → 布哈拉 → 撒马尔罕（马拉坎达） → 忽毡（居鲁士城）→ 锡尔河战场；编辑器「行军路线实测」已跑。' }, result: { level: 'fact', text: '英文维基百科 Battle of Jaxartes 信息框 result = Macedonian victory。塞种约 1,200 阵亡（含主帅 Satraces）、150 被俘、1,800 匹马被缴；马其顿阵亡 160、伤 1,000。战后亚历山大在河南岸筑城（亚历山大·埃斯哈塔，今苦盏一带）以定北疆，故本场「战后归属」按历史写忽毡归马其顿。' }, invite: { level: 'fact', text: '邀约对白所据史事：英文维基百科 Battle of Jaxartes —— 塞种据北岸陈兵、打算趁马其顿半渡而击，并嘲弄其不敢渡河。对白措辞为撰写，史事有据。' }, briefing: { level: 'fact', text: '英文维基百科 Battle of Jaxartes 正文：塞种占北岸，自信能在马其顿登陆时将其击败，却低估了马其顿砲兵、舰队、骑兵与步兵的协同；亚历山大令全军同时齐渡，使对岸骑射手面对更多目标，随后以弓箭手与骑兵破其包围，约 1,200 塞种被围歼、含主帅。文案按主人规矩不写兵力确数。' } },
        commanderUnit: 'hero_mounted_alexander',
        // 🔴 [2026-09-24 主人「速不台，13 世纪蒙古人，与塞种主帅年代差得远……符合历史」]
        //    原来选 `hero_subotai`（速不台，13 世纪）＝与**前329 年的塞种主帅**差约 1600 年，不合历史。
        //    照 §二.5「看样子和年代选，不看名字」改取 **英雄·塞乌特斯三世**（`hero_thracian_chieftain`）：
        //    名册里没有塞种/斯基泰的英雄兵模（`SCYTHIAN_*` 是兵种不是英雄兵模，草原英雄兵模全是中世纪的：
        //    阿提拉 5 世纪、库曼/钦察/蒙古 11–13 世纪），故取**与亚历山大同代**的骑马蛮族首领（色雷斯紧挨斯基泰）。
        foeCommanderUnit: 'hero_thracian_chieftain',
        type: 'field_battle',
        title: '公元前329年 亚历山大东征锡尔河战役',
        description: '公元前329年秋，亚历山大平定中亚诸行省，挥师进抵锡尔河畔。北方斯基泰游牧骑兵隔河陈兵挑衅，嘲弄马其顿大军不敢涉足草原。亚历山大命军团以投石机与弩炮密集齐射压制对岸，全军乘皮筏强行渡河，与草原骑兵在旷野展开决战。',
        fieldBattleData: {
            title: '锡尔河战役',
            description: '锡尔河畔，马其顿弩炮破空齐射，射穿斯基泰前锋重铠，游牧阵型大乱。亚历山大亲率近卫骑兵与轻骑兵突入敌阵，以步骑协同之法两翼包夹，破解斯基泰回旋奔射之术。斯基泰主帅萨特拉克斯力战阵亡，游牧大军溃散北遁，帝国东北疆界自此底定。',
            location: { lat: 40.2833, lng: 69.6167 },
            marchWaypoints: ['city_bosibolisi', 'city_yazide', 'city_yisifahan', 'city_leiyi', 'city_damugan', 'city_nishabuer', 'city_tusi', 'city_salahesi', 'city_merv', 'city_amucheng', 'city_bukhara', 'city_samaerhan', 'city_huzhan'],
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 6000,
            attackerSourceCityId: 'city_bosibolisi',
            attackerLegionName: '马其顿军',
            defenderFactionId: 'sijitai',
            defenderGeneralId: 'sijitai_satraces',
            defenderTroops: 6000,
            defenderSourceCityId: 'city_huzhan',
            defenderLegionName: '斯基泰军',
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
        inviteText: '朋友，你看那道崖——阿里马泽斯说，除非我长出翅膀，否则休想上去。他把这话当笑话讲给我听。我倒要看看：人上不去的地方，是不是真就没人上得去。我已经放了赏，让敢冒险的人今夜去试；只要有人能摸到顶上，这一仗就先赢了一半。你可愿随我等着看？',
        sources: {
            battle: { level: 'fact', text: '英文维基百科 Siege of the Sogdian Rock：前327年早春马其顿军攻取索格狄亚那岩（又名阿里马泽斯之岩，Rock of Ariamazes）的攻城战，属亚历山大征服阿契美尼德帝国过程中的一役。' },
            time: { level: 'fact', text: '英文维基百科 Siege of the Sogdian Rock：条目正文记 captured in the early spring of 327 BC，信息框 date = 327 BC。故季节取春。' },
            place: { level: 'fact', text: '英文维基百科 Siege of the Sogdian Rock 信息框 coordinates 40.4 N, 69.4 E、location = Sogdiana, present-day Tajikistan；本据点记录取 40.4,69.4。⚠️ 同条目正文写 near Samarkand，与信息框坐标自相矛盾，按 §一.1「坐标以信息框为准」取信息框值。本场是攻城战。' },
            attacker: { level: 'fact', text: '英文维基百科 Siege of the Sogdian Rock 信息框 combatant1 = Macedon、League of Corinth，commander1 = Alexander the Great —— 亚历山大亲统。' },
            attackerTroops: { level: 'fact', text: '英文维基百科 Siege of the Sogdian Rock 信息框 strength1 = 300；同信息框 casualties1 = 30，正与正文「夜间攀崖时摔死三十人」相合，可见该 300 即那支夜攀队，故攻方兵力取 300。' },
            attackerLegion: { level: 'fact', text: '同东征诸役：马其顿军（前伙伴骑兵、中方阵步兵、后克里特弓箭手，鱼鳞阵 3-4-2，整场战争不换）。此役据英文维基正文：亚历山大悬重赏募人攀崖，三百人夜间徒手攀上绝壁，摔死三十人。' },
            defender: { level: 'fact', text: '英文维基百科 Siege of the Sogdian Rock 信息框 combatant2 = Sogdiana，commander2 = Arimazes；本场守方主帅取阿里马泽斯，同条目记该岩堡为他所据。' },
            defenderTroops: { level: 'inferred', text: '英文维基百科 Siege of the Sogdian Rock 信息框 strength2 = Unknown，正文亦未给岩堡守军兵数。按 §一.2 守方 ≤ 攻方×2 与「查不到按史地合理推定」：岩堡守军以据险为本，取 600 —— 合理推定。' },
            defenderLegion: { level: 'fact', text: '英文维基百科 Siege of the Sogdian Rock 与 Sogdia：守方为粟特，凭绝壁据守，主帅阿里马泽斯；同条目记守军在山顶出现马其顿人之后即降。编成取剧本军团「粟特军」：前骑兵=粟特甲胄骑兵 3、中步兵=塞种萨迦斧兵 4、后远程=巴克特里亚弓手 2，鱼鳞 3-4-2（同一支军队整场战争不换）。' },
            route: { level: 'fact', text: '英文维基百科 Spitamenes 与 Siege of the Sogdian Rock：前329年药杀水之战后斯皮塔米尼斯仍据马拉坎达一带；部将科伊诺斯于前328年12月在加拜之战将其击破，斯皮塔米尼斯随后为马萨革泰人所杀；亚历山大在巴克特里亚过冬，前327年早春北上索格狄亚那攻取该岩。游戏路线：自上一处战场（锡尔河）开拔 → 撒马尔罕即马拉坎达 → 阿母城即乌浒水渡口、巴克特里亚方向 → 撒马尔罕 → 忽毡即居鲁士城 → 索格狄亚那岩；编辑器「行军路线实测」已跑。' },
            result: { level: 'fact', text: '英文维基百科 Siege of the Sogdian Rock 信息框 result = Macedonian victory，territory = Alexander captures Sogdiana；正文记守军不战而降，故本场据点归属写索格狄亚那岩归马其顿。同条目另记岩上俘虏中有奥克夏特斯之女罗克珊娜，亚历山大后来娶其为妻。' },
            invite: { level: 'fact', text: '邀约对白所据史事：英文维基百科 Siege of the Sogdian Rock —— 阿里马泽斯自恃绝壁，答马其顿招降时称亚历山大须有「长了翅膀的兵」方能上岩。对白措辞为撰写，史事有据。' },
            briefing: { level: 'fact', text: '播报所据史事：英文维基百科 Spitamenes —— 前328年12月加拜之战科伊诺斯破斯皮塔米尼斯，斯皮塔米尼斯为马萨革泰首领所杀、首级送亚历山大；英文维基百科 Siege of the Sogdian Rock —— 前327年早春取岩堡，夜攀者摔死三十人，守军见旗而降。文案按主人规矩不写兵力确数。' },
        },
        commanderUnit: 'hero_mounted_alexander',   // 主将队：素材样貌为骑马的亚历山大
        // 对手主将队：🔴 照 §二.5「看样子和年代选，不看名字」，本时代没有粟特英雄兵模（名册里草原/中亚英雄兵模全是中世纪的），
        //    故取**与亚历山大同代**的骑马蛮族首领（hero_thracian_chieftain = 英雄·塞乌特斯三世，前331–300 在位）。
        foeCommanderUnit: 'hero_thracian_chieftain',
        type: 'siege',
        title: '公元前327年 亚历山大东征索格狄亚那岩战役',
        description: '马其顿军取索格狄亚那岩：阿里马泽斯凭绝壁自恃不可攻，亚历山大悬赏募人夜攀，敢死者徒手攀上岩顶，天明在山顶挥旗示意；守军以为天兵降临，不战而降。奥克夏特斯之女罗克珊娜即在岩上，亚历山大后来娶之为妻。',
        siegeData: {
            title: '索格狄亚那岩战役',
            description: '岩堡四面绝壁，无路可攻；马其顿军以绳索铁钉趁夜攀崖，自守军不曾设防的崖面摸上岩顶，天明自上而下挥旗呐喊。守军见顶上尽是马其顿人，军心崩溃，开堡投降。',
            // 出发地＝军团此刻在哪＝上一场落点（锡尔河战场）→ 最近且那年已有的据点＝忽毡（§三.1）
            // 史料走动写成路标：马拉坎达 → 乌浒水渡口 → 回程马拉坎达 → 忽毡 → 岩堡
            marchWaypoints: ['city_samaerhan', 'city_amucheng', 'city_samaerhan', 'city_huzhan'],
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 300,
            // 🔴 出兵据点＝军团此刻在哪：上一场落点（锡尔河战场）最近且那一年已存在的据点
            //    ＝贵山城（忽毡在前327 过不了年代闸门，故不算；照 resolveEventStartCityId 算出来的写）
            attackerSourceCityId: 'city_guishancheng',
            attackerLegionName: '马其顿军',
            defenderGeneralId: 'suogediyana_arimazes',
            defenderTroops: 600,
            defenderCityId: 'city_suogediyanayan',
            defenderLegionName: '粟特军',
            result: 'attacker_win',
            autoEnterRTS: true,
        },
        // 🔴 攻城战必须写被攻据点的易主（§铁律 3）：岩堡归马其顿，territory = Alexander captures Sogdiana
        cityUpdates: [{ cityId: 'city_suogediyanayan', factionId: 'maqidun' }],
        // 赶路播报（攻城战的播报存在事件本身）：B 档并入背景的两件前328 之事也写在这里
        briefing: '加拜一战之后，斯皮塔米尼斯再也没能聚起人马。他退往北方草原，指望马萨革泰人替他报仇，那些人却砍下他的头，派人送到亚历山大帐前求和——中亚这场拖了两年的叛乱，至此才算了结。\n\n亚历山大在巴克特里亚过了冬。前327年的早春，他率军北上索格狄亚那，去拔掉叛军最后几处巢穴。挡在路上的，是索格狄亚那岩：一座立在绝壁之上的岩堡，四面刀削一般，向被称为不可攻。堡里的首领阿里马泽斯自恃天险，回绝马其顿人的招降时说，亚历山大除非有长了翅膀的兵，否则休想上来。\n\n亚历山大没有强攻。他召集全军，许下重赏，问谁愿意去爬那道崖。',
    },
    // ═══════════════════════════════════════════════════════════════
    // 前 327 年秋 · 东征印度：马萨加围城战（Cophen campaign · Siege of Massaga，327 BC）
    // ═══════════════════════════════════════════════════════════════
    {
        year: -327,
        season: 2,                                   // 秋（战役信息框 date = May 327 – March 326 BC；马萨加为该战役首战，按月序推秋 —— 合理推定）
        generalId: 'gen_alexander_great',
        inviteText: '朋友，前头那座城叫马萨加，是阿斯瓦卡人的首府，也是这一带最大的设防城市。守城的是一位女王——克莱奥菲斯。她不肯降，还从印度河对岸重金请来了一批雇佣兵，自以为凭高墙险地就能把我挡在城外。你看好了：我不硬爬她的墙。我要在她眼皮底下堆起一座土垒、架起塔楼，把弓手与投石手送上塔顶，一段一段把人从墙头赶下去。你可愿随我打这一仗？',
        sources: {
            battle: { level: 'fact', text: '英文维基百科 Cophen campaign 的 Siege of Massaga 节：前327年马其顿军攻取阿斯瓦卡人首府马萨加的攻城战。该战役无独立条目，本场按其条目内这一节设计（主人总纲：维基有这个信息就可以设计）。' },
            time: { level: 'inferred', text: '英文维基百科 Cophen campaign 信息框 date = May 327 BC – March 326 BC；同条目记马萨加为该战役第一战（其后依次为 Bazira、Ora、Aornos）。条目未给月份，按月序推秋 —— 合理推定。' },
            place: { level: 'inferred', text: '英文维基百科 Cophen campaign：马萨加为阿萨卡诺伊阿斯瓦卡人最大的设防城市与首府，位于斯瓦特河谷；条目未给坐标，按史地取斯瓦特河谷门户 Chakdara 一带 34.65,72.03 —— 合理推定。本场是攻城战，地点就是被攻据点「马萨加」。' },
            attacker: { level: 'fact', text: '英文维基百科 Cophen campaign 信息框 commander1 = Alexander the Great（并注明 WIA 负伤），另有 Craterus、Perdiccas、Ptolemy、Leonnatus 分领各部；同条目记亚历山大在马萨加城下亲率方阵冲阵并负伤。' },
            attackerTroops: { level: 'inferred', text: '英文维基百科 Cophen campaign 信息框未给双方兵力。同一支马其顿军在前327年接收新兵后约三万众，此役为科芬河谷分路进军中的一路，取 20000 —— 合理推定。同条目另记此役马其顿阵亡不超过二十五人。' },
            attackerLegion: { level: 'fact', text: '同东征诸役：马其顿军（前伙伴骑兵、中方阵步兵、后克里特弓箭手，鱼鳞阵 3-4-2，整场战争不换）。此役据同条目：亚历山大佯退诱敌、以弓手与标枪骑兵及阿格里安尼人反击、亲率方阵冲阵；攻城时筑塔楼土垒、桥上强攻。' },
            defender: { level: 'fact', text: '英文维基百科 Cophen campaign 信息框 combatant2 = Aśvaka、Guraeans，commander2 = Cleophis；同条目记马萨加由女王克莱奥菲斯守城，另雇自印度河对岸的雇佣兵助守。' },
            defenderTroops: { level: 'inferred', text: '英文维基百科 Cophen campaign 记阿萨卡诺伊人自印度河对岸雇来 7000 名雇佣兵（Fuller 1959, p.245），城防部落守军人数未载；按「查不到按史地合理推定」取 10000，并守守方 ≤ 攻方×2 —— 合理推定。' },
            defenderLegion: { level: 'fact', text: '英文维基百科 Cophen campaign 的 Siege of Massaga 节：守军自城头抛射弓矢、石块乃至火球，雇佣兵步战最为顽强，山地部落骑兵最少。编成取剧本军团「阿斯瓦卡军」：前远程=层压复合弓手 4、中步兵=印度部落民 3、后骑兵=什里瓦姆沙骑手 2，雁行 4-3-2（同一支军队整场战争不换）。' },
            route: { level: 'fact', text: '英文维基百科 Cophen campaign：亚历山大前327年春自巴克特里亚越兴都库什南下（途中建亚历山大里亚即今贝格拉姆），抵科芬河谷后先取周边，再东进斯瓦特攻马萨加。游戏路线：自上一处战场（索格狄亚那岩）开拔 → 蓝氏城即巴克特拉 → 巴米扬 → 喀布尔 → 难揭即那竭（科芬河谷）→ 马萨加；编辑器「行军路线实测」已跑。' },
            result: { level: 'fact', text: '英文维基百科 Cophen campaign：马萨加陷落。同条目记守军议降后弃营夜遁、被马其顿军围歼于高地，随后马萨加被取、守军尽杀，马其顿阵亡不超过二十五人；故本场据点归属写马萨加归马其顿。同条目另记其后亚历山大遣科伊诺斯取 Bazira、遣阿尔塞塔斯等围 Ora。' },
            invite: { level: 'fact', text: '邀约对白所据史事：英文维基百科 Cophen campaign 信息框 commander2 = Cleophis（女王克莱奥菲斯守城）；同条目记阿萨卡诺伊人雇自印度河对岸的雇佣兵、守军凭城头弓矢石块火球顽抗，马其顿人以塔楼土垒多日强攻。对白措辞为撰写，史事有据。' },
            briefing: { level: 'fact', text: '播报所据史事：英文维基百科 Cophen campaign——前327年亚历山大越兴都库什南下入科芬河谷，马萨加为阿斯瓦卡人首府与最大设防城市，由克莱奥菲斯守城、另雇印度河对岸雇佣兵；同条目记马其顿阵亡不超过二十五人、城破后守军尽杀。文案按主人规矩不写兵力确数。' },
        },
        commanderUnit: 'hero_mounted_alexander',   // 主将队：素材样貌为骑马的亚历山大
        // 对手主将队：🔴 照 §二.5「看样子和年代选，不看名字」，本时代没有印度/阿斯瓦卡的英雄兵模，
        //    守城的是**女王**克莱奥菲斯 → 取古典段唯一的女将英雄兵模 hero_artemisia（英雄·阿尔特米西亚，前5世纪卡里亚女王）。
        foeCommanderUnit: 'hero_artemisia',
        type: 'siege',
        title: '公元前327年 亚历山大东征马萨加战役',
        description: '马其顿军取马萨加：亚历山大佯退诱敌，把出城的阿斯瓦卡人引到坡下以弓矢与骑兵反击，亲率方阵冲阵，本人负伤；随后筑土垒塔楼九日、以弩炮与弓手压住墙头，桥上强攻两日，佣兵首领战死，守军议降后夜遁被围歼，马萨加城破、守军尽杀。',
        siegeData: {
            title: '马萨加战役',
            description: '阿斯瓦卡人凭高墙与城头弓矢、石块、火球死守，雇佣兵尤为顽强；马其顿军先强攻不下，转而筑土垒、架塔楼，把弓手与投石手送上塔顶压制墙头，再由盾卫自塔桥冲城。桥塌人坠、死伤甚众，直到佣兵首领阵亡，守军才肯议降。',
            // 出发地＝军团此刻在哪＝上一场落点（索格狄亚那岩，攻城战＝那座城）
            // 史料：自索格狄亚那南下经马拉坎达、渡乌浒水至巴克特拉，再越兴都库什入科芬河谷
            marchWaypoints: ['city_samaerhan', 'city_bukhara', 'city_amucheng', 'city_lanshi', 'city_fanyanna', 'city_gaofu', 'city_dinggucheng'],
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 20000,
            attackerSourceCityId: 'city_suogediyanayan',
            attackerLegionName: '马其顿军',
            defenderGeneralId: 'aswaka_cleophis',
            defenderTroops: 10000,
            defenderCityId: 'city_masaga',
            defenderLegionName: '阿斯瓦卡军',
            result: 'attacker_win',
            autoEnterRTS: true,
        },
        // 🔴 攻城战必须写被攻据点的易主（§铁律 3）：马萨加归马其顿
        cityUpdates: [{ cityId: 'city_masaga', factionId: 'maqidun' }],
        briefing: '越过兴都库什山，马其顿大军自巴克特里亚南下，进抵科芬河谷。前327年秋，亚历山大沿河谷东进，直指阿斯瓦卡人的首府马萨加——那是这一带最大的设防城市，城墙高厚，城下就是斯瓦特河的急流。\n\n守城的是女王克莱奥菲斯。她不肯开门，还从印度河对岸重金请来一批久经战阵的雇佣兵，凭这些人守住了每一段墙头。城内守军自城头抛下弓矢、石块与火球，马其顿人第一次强攻便被打了回来。\n\n亚历山大没有硬拼。他命人就地筑起土垒、架上塔楼，把弓手与投石手送到塔顶，居高临下把守军从墙头压下去。',
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
        inviteText: '朋友，你看那座岩。当地人管它叫奥诺斯，意思是连鸟都飞不上去的地方——传说赫拉克勒斯当年也没能把它拿下来。四面都是刀削的绝壁，崖顶却又平又宽，有泉水，能种地，围是围不死它的。守在上面的，是斯瓦特河谷逃出来的那些人，他们把这座岩当成最后的窝。我偏要上去。你随我去看看：人到底能不能比鸟先到那儿。',
        sources: {
            battle: { level: 'fact', text: '英文维基百科 Aornos 条目：奥诺斯岩是亚历山大最后一次围城，地点为今巴基斯坦开伯尔-普什图省印度河上游峡谷湾上的 Pir Sar 山脊；同条 Cophen campaign 的 Siege of Aornus 节记该役在 前327/326 年之冬。本场按其独立条目设计，攻城战一场对一个维基条目。' },
            time: { level: 'inferred', text: '英文维基百科 Aornos 条目正文记围城在 前326 年 4 月（Sastri 1988, p.54）；同条 Cophen campaign 信息框 date = May 327 BC – March 326 BC、正文记围城在 前327/326 之冬。两处英文维基略有出入，取春，与下一场海达斯佩斯河战役（前326年5月）先后相接 —— 合理推定。' },
            place: { level: 'inferred', text: '英文维基百科 Aornos 条目：该岩在印度河上游峡谷湾之上、Gunangar Shamshi Khel 之西，条目所附照片说明为 Shangla District；条目本身没有信息框坐标，故取维基数据 Pir Sar 34.82,72.88，该点反查地名落在 Shangla 县，与照片说明一致。西语维基信息框另给 34.7067,72.4528，该点落在斯瓦特河谷的赛杜谢里夫，与英文正文的印度河峡谷不合，不取 —— 合理推定。本场是攻城战，地点就是被攻据点「奥诺斯岩」。' },
            attacker: { level: 'fact', text: '英文维基百科 Aornos 条目：亚历山大亲率此役，本人随前锋登丘时被守军推下的巨石打退；同条记托勒密与书记官先夺西侧山脊、筑栅掘壕，亚历山大以弩炮与土坡逼近崖壁，最后拽绳攀上崖顶，为雅典娜·尼刻立坛。' },
            attackerTroops: { level: 'inferred', text: '英文维基百科两个条目均未给双方兵力。此处是狭窄山脊上的攻坚，只容一部兵力展开，取 15000。同条 Cophen campaign 记亚历山大此前分兵，一路由佩尔狄卡斯与赫费斯提翁沿科芬河前进 —— 合理推定。' },
            attackerLegion: { level: 'fact', text: '同东征诸役：马其顿军（前伙伴骑兵、中方阵步兵、后克里特弓箭手，鱼鳞阵 3-4-2，整场战争不换）。此役据同条：先夺西侧山脊为据点、以木料树枝泥土填涧筑坡送弩炮近崖、夺与崖顶相连的小丘、最后拽绳攀崖登顶。' },
            defender: { level: 'inferred', text: '英文维基百科 Cophen campaign 的 Sieges of Bazira and Ora 节：奥拉陷落后，巴济拉的守军弃城投奔奥诺斯岩，各处溃散的部落人众也聚在岩上；两个条目均未载守将姓名，故按「地名＋首领」记为奥诺斯首领，与马利首领、科塞亚首领同一记法 —— 合理推定。' },
            defenderTroops: { level: 'inferred', text: '英文维基百科未给守方兵力。守军是斯瓦特河谷溃散的部落人众与邻近山民，据崖顶以滚石死守，取 6000，并守守方 ≤ 攻方×2 —— 合理推定。' },
            defenderLegion: { level: 'inferred', text: '同条 Cophen campaign：奥拉、巴济拉溃散下来的都是阿斯瓦卡人众，故本场守方仍取剧本军团「阿斯瓦卡军」：前远程=层压复合弓手 4、中步兵=印度部落民 3、后骑兵=什里瓦姆沙骑手 2，雁行 4-3-2。同一支阿斯瓦卡部落军，整场战争不换 —— 合理推定。' },
            route: { level: 'fact', text: '英文维基百科 Cophen campaign 的 Sieges of Bazira and Ora 节与 Siege of Aornus 节：亚历山大先南下平定白沙瓦河谷、切断阿比萨雷斯渡印度河之路，再由印度河右岸北上，自南面攻奥诺斯岩。游戏路线：自上一场落点马萨加开拔 → 白沙瓦即白沙瓦河谷 → 阿托克即印度河渡口要塞 → 奥诺斯岩；编辑器「行军路线实测」已跑。' },
            result: { level: 'fact', text: '英文维基百科 Aornos 条目：马其顿胜。守军先以滚石打退攀上小丘的前锋、擂鼓三日相庆，随后趁夜弃岩而走；亚历山大拽绳攀上最后一段崖面，登顶后为雅典娜·尼刻立坛，并为阵亡者立冢。同条 Cophen campaign 记奥诺斯岩取下后，通向印度河的道路再无障碍，故本场据点归属写奥诺斯岩归马其顿。' },
            invite: { level: 'fact', text: '邀约对白所据史事：英文维基百科 Aornos 条目记该岩希腊语意为「无鸟」，阿里安记亚历山大要胜过传说中未能攻下此堡的赫拉克勒斯；同条记崖顶平坦、有天然泉水、宽到可以耕种，因此围不死它。对白措辞为撰写，史事有据。' },
            briefing: { level: 'fact', text: '播报所据史事：英文维基百科 Cophen campaign 的 Sieges of Bazira and Ora 节 —— 马萨加破后，亚历山大遣科伊诺斯往巴济拉、遣阿尔塞塔斯、阿塔罗斯与德米特里乌斯围奥拉；奥拉人出城突袭被击退，亚历山大闻阿比萨雷斯将渡印度河救奥拉而改道先取奥拉；奥拉陷落后巴济拉守军弃城投奔奥诺斯岩。同条 Siege of Aornus 节 —— 托勒密与书记官夺西侧山脊、填涧筑坡、夺相连小丘、守军弃岩夜遁、亚历山大攀崖登顶立坛。文案按主人规矩不写兵力确数。' },
        },
        commanderUnit: 'hero_mounted_alexander',   // 主将队：素材样貌为骑马的亚历山大
        // 对手主将队：🔴 照 §二.5「先保年代，再尽样子」——本时代没有印度山民首领的英雄兵模
        //    （porus_elephant 是骑象的王，用于岩堡山民不合），故取同代的骑马蛮族首领
        //    hero_thracian_chieftain（英雄·塞乌特斯三世，前331–300 在位），与第 11 场岩堡守将同一处理。
        foeCommanderUnit: 'hero_thracian_chieftain',
        type: 'siege',
        title: '公元前326年 亚历山大东征奥诺斯岩战役',
        description: '马其顿军取奥诺斯岩：先遣队抢占西侧山脊、筑栅掘壕为据点，点火的信号反被守军看见，峡谷里缠斗两日才重新聚拢；随后在北面以木料、树枝与泥土填涧堆坡，把弩炮推近崖壁。第三日夺下与崖顶相连的小丘，亚历山大亲率前锋登丘时被守军推下的巨石打退，守军擂鼓三日相庆。当夜守军弃岩而走，亚历山大拽着绳索攀上最后一段崖面，登上崖顶，为雅典娜·尼刻立坛。',
        siegeData: {
            title: '奥诺斯岩战役',
            description: '守军据崖顶死守。北面深涧是上崖唯一的门户，马其顿人填涧筑坡、把弩炮推近崖壁时，他们从崖上推下巨石，把攀上小丘的前锋打退，擂鼓三日。夜里他们弃岩遁走，崖顶遂空。',
            // 出发地＝军团此刻在哪＝上一场落点（马萨加，攻城战＝那座城）
            // 史料：马萨加破后先南下平定白沙瓦河谷，再沿印度河右岸北上自南面攻岩
            marchWaypoints: ['city_baishawa', 'city_atuoke'],
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 15000,
            attackerSourceCityId: 'city_masaga',
            attackerLegionName: '马其顿军',
            defenderGeneralId: 'aornos_chief',
            defenderTroops: 6000,
            defenderCityId: 'city_aonuosiyan',
            defenderLegionName: '阿斯瓦卡军',
            result: 'attacker_win',
            autoEnterRTS: true,
        },
        // 🔴 攻城战必须写被攻据点的易主（§铁律 3）：奥诺斯岩归马其顿
        cityUpdates: [{ cityId: 'city_aonuosiyan', factionId: 'maqidun' }],
        briefing: '马萨加一破，阿斯瓦卡人再没能守住自己的河谷。入冬以后，亚历山大遣科伊诺斯往巴济拉，另遣阿尔塞塔斯、阿塔罗斯与德米特里乌斯去围奥拉。奥拉人出城突袭，被打了回去；巴济拉却凭山势死守不降。亚历山大率军北上巴济拉，途中听说阿比萨雷斯要渡印度河来救奥拉，当即改道先取奥拉。奥拉陷落，巴济拉的守军见大势已去，弃城投奔奥诺斯岩。\n\n前326年春，马其顿军越过白沙瓦河谷，沿印度河右岸北上，直指这座岩。当地人说它叫奥诺斯，意思是鸟都飞不上去；传说赫拉克勒斯当年也没能攻下。崖顶平坦，有泉，能耕种，围不死它。守在上面的，是斯瓦特河谷溃散下来的部落人众——他们把这处岩当作最后的退路。\n\n亚历山大先取西侧山脊为据点，再在北面填涧筑坡，把弩炮推近崖壁。第三日夺得与崖顶相连的小丘，前锋被巨石打退；当夜守军弃岩而走，他拽着绳索亲自攀上最后一段崖面，在崖顶为雅典娜·尼刻立坛。',
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
        inviteText: '朋友，你看对岸。波鲁斯把战象一字排在河滩上，就等着我渡河——我若硬渡，人马困在水里，正好让那些巨兽踩成泥。我不给他这个机会。上游有一处多林的河岛，河水在那里分了汊，人可以涉过去；路我已经摸清了，只等一个黑夜。今夜有雷雨，正好盖住动静：我率精锐先渡，克拉特鲁斯留在营中虚张声势。等他知道我已经到了他这一侧，这一仗就好打了。你可愿随我先渡？',
        sources: {
            battle: { level: 'fact', text: '英文维基百科 Battle of the Hydaspes：前326年5月马其顿军与波鲁斯治下的保拉瓦人在海达斯佩斯河即今杰赫勒姆河畔的野战，马其顿胜；同条记这是亚历山大东征中伤亡较重的一役，波鲁斯是其最顽强的对手。' },
            time: { level: 'fact', text: '英文维基百科 Battle of the Hydaspes 信息框 date = May 326 BC，故季节取夏。' },
            place: { level: 'fact', text: '英文维基百科 Battle of the Hydaspes 信息框 coordinates 32°49′40″N 73°38′20″E，即 32.8278,73.6389；location = Hydaspes River 今杰赫勒姆河，今巴基斯坦旁遮普省。本场是野战，战场记录取该坐标，与剧本这一场的 location 一字不差。' },
            attacker: { level: 'fact', text: '英文维基百科 Battle of the Hydaspes 信息框 combatant1 = 马其顿帝国、科林斯同盟、犍陀罗，commander1 = 亚历山大、克拉特鲁斯、科伊诺斯、塔克西列斯；同条正文记亚历山大亲率伙伴骑兵冲击印度左翼。' },
            attackerTroops: { level: 'fact', text: '英文维基百科 Battle of the Hydaspes 信息框 strength1 = 45,000–47,000，其中步兵 40,000、骑兵 5,000–7,000 及亚洲盟军，取区间中值 46000；同条正文记约 40,000 步兵与 5,000 骑兵渡河参战，克拉特鲁斯另率一部留在北岸营中。' },
            attackerLegion: { level: 'fact', text: '同东征诸役：马其顿军（前伙伴骑兵、中方阵步兵、后克里特弓箭手，鱼鳞阵 3-4-2，整场战争不换）。此役据同条正文：先以达赫骑射手骚扰印度右翼、伙伴骑兵冲其左翼、科伊诺斯抄其后路，再以方阵萨里沙顶住战象，轻装兵砍象奴刺象眼。' },
            defender: { level: 'fact', text: '英文维基百科 Battle of the Hydaspes 信息框 combatant2 = Pauravas 保拉瓦人，commander2 = 波鲁斯、Spitakes 与波鲁斯诸子；同条正文记波鲁斯不依印度诸王乘战车的旧例，亲自骑乘阵中最高大的战象督战。' },
            defenderTroops: { level: 'inferred', text: '英文维基百科 Battle of the Hydaspes 信息框 strength2 = 22,000–54,000，其中步兵 20,000–50,000、骑兵 2,000–4,000、战象 85–200、战车 1,000，取区间中值 38000，并守守方 ≤ 攻方×2 —— 合理推定。' },
            defenderLegion: { level: 'fact', text: '英文维基百科 Battle of the Hydaspes：印度军以战车列于两翼骑兵之前、步兵居中、战象每隔五十尺列于步兵阵前，故战象与步卒为全军主体，先接敌的是两翼骑兵。编成取剧本军团「保拉瓦军」：前骑兵=什里瓦姆沙骑手 2、中步兵=南亚战象 4、后远程=印度长弓 3，鹤翼 2-4-3（同一支军队整场战争不换）。' },
            route: { level: 'fact', text: '英文维基百科 Cophen campaign 与 Battle of the Hydaspes：亚历山大取奥诺斯岩后南下渡印度河，塔克西拉王献城结盟，再东进至海达斯佩斯河；游戏路线自上一场落点奥诺斯岩开拔 → 阿托克即印度河渡口 → 沿路东南经蒙格一带 → 海达斯佩斯河畔战场；编辑器「行军路线实测」已跑。' },
            result: { level: 'fact', text: '英文维基百科 Battle of the Hydaspes 信息框 result = Macedonian victory，territory = 马其顿并吞海达斯佩斯河至希法色斯河即今比亚斯河之间的大部分旁遮普。同条记波鲁斯被俘后答「像国王对待另一位国王那样待我」，亚历山大让他继续保有自己的国土，并在战场处建尼卡亚城、在对岸建布凯法拉城以纪念战死的布塞法洛斯。故本场据点不易主：波鲁斯仍为其国之主，故不写据点归属。' },
            invite: { level: 'fact', text: '邀约对白所据史事：英文维基百科 Battle of the Hydaspes —— 波鲁斯在南岸列阵拒渡，亚历山大连日佯动、以假王帐与频繁调动迷惑对手，最终在上游多林河岛趁雷雨夜偷渡，克拉特鲁斯留北岸牵制。对白措辞为撰写，史事有据。' },
            briefing: { level: 'fact', text: '播报所据史事：英文维基百科 Battle of the Hydaspes 背景与战前机动两节 —— 取奥诺斯岩后渡印度河、塔克西拉王结盟共击波鲁斯；B 档并入背景的尼萨受降即狄奥尼索斯传说、渡河与结盟三事都写在本文；文案按主人规矩不写兵力确数。' },
        },
        commanderUnit: 'hero_mounted_alexander',   // 主将队：素材样貌为骑马的亚历山大
        // 对手主将队：🔴 游戏里有波鲁斯专属英雄兵模 porus_elephant（波鲁斯王战象），
        //    但编辑器「对手主将队」硬检查只认 hero_ 开头的 id（src/battlefield-editor/main.ts 第 516 行），
        //    porus_elephant 会被判红、不许存盘；故本场照 §二.5 规则原文取 hero_* 里同代、文化区挨着的
        //    英雄·达提斯（hero_datis，前5世纪波斯统帅，骑马）—— 已在史料依据里写明此事，等主人定是否放宽该检查。
        foeCommanderUnit: 'hero_datis',
        type: 'field_battle',
        title: '公元前326年 亚历山大东征海达斯佩斯河战役',
        description: '公元前326年夏，亚历山大进抵海达斯佩斯河。波鲁斯率大军在南岸列阵，战象当先，决意不让马其顿人过河。亚历山大连日沿河上下佯动，终于在雷雨之夜自上游河岛偷渡成功，全军人马悄然登上南岸，与波鲁斯的主力在河畔旷野正面相遇。',
        fieldBattleData: {
            title: '海达斯佩斯河战役',
            description: '波鲁斯以战象居中、步兵紧随，骑兵与战车分列两翼，阵势如墙。亚历山大避开正面：先以骑射手骚扰其右翼，再亲率伙伴骑兵冲击其左翼，诱使印度骑兵来回奔援，由科伊诺斯抄其后路，把印度骑兵先行打散。战象随后压上，马其顿方阵以萨里沙长矛迎面顶住，轻装兵专砍象奴、刺象眼。巨兽负痛回冲，反把自家阵列搅乱。波鲁斯力战至最后，伤重被俘。',
            location: { lat: 32.8278, lng: 73.6389 },   // 英文维基百科信息框 32°49′40″N 73°38′20″E
            // 出发地＝军团此刻在哪＝上一场落点（奥诺斯岩，攻城战＝那座城）
            // 史料：取奥诺斯岩后南下渡印度河，塔克西拉献城结盟，再东进至海达斯佩斯河
            marchWaypoints: ['city_atuoke'],
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 46000,
            attackerSourceCityId: 'city_aonuosiyan',
            attackerLegionName: '马其顿军',
            defenderFactionId: 'bulu',
            defenderGeneralId: 'gen_bolusi',
            defenderTroops: 38000,
            defenderSourceCityId: 'city_meng',
            defenderLegionName: '保拉瓦军',
            result: 'attacker_win',
            autoEnterRTS: true,
        },
        // 野战按历史写战后归属（§铁律 3）：本场**无据点易主** —— 波鲁斯被俘后仍保有国土，蒙格仍属补噜
        briefing: '海达斯佩斯河一战，是亚历山大东征以来最吃力的一仗。波鲁斯的战象冲乱了马其顿方阵，人马死伤之重，此前诸役未有。波鲁斯本人战至最后，伤重落马被俘。亚历山大问他愿受怎样的对待，他答：像国王对待另一位国王那样待我。亚历山大依言让他继续做他的国王，国土一如旧日；又命人在战场处筑尼卡亚城、在对岸筑布凯法拉城，纪念死在那里的战马布塞法洛斯。',
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
