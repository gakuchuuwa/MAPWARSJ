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
 * 命名口径：**不写** `attackerLegionName` / `defenderLegionName`。
 *    军团名有唯一真源（`FactionCompositions.legionName`，马其顿 =「古典时代马其顿军团」；
 *    未配置的势力走 `getCultureLegionName(region)`），此处再写一份就是第二处真源，
 *    且极易把**精锐番号**（伙伴骑兵/希腊雇佣兵）误当**军团名**——那是命名铁律明令禁止的。
 *    精锐无需在此指定：由势力自动解析（maqidun→伙伴骑兵 T0 / xiaofulijiya→希腊雇佣兵 T2）。
 */
import type { HistoricalEvent } from '../types/core';

export const HISTORICAL_EVENT_SCRIPT: HistoricalEvent[] = [
    {
        year: -334,
        // 春（0）。史料记此役在 5 月前后；主人未指定季节，取春。
        season: 0,
        type: 'field_battle',
        title: '公元前334年 格拉尼库斯河战役',
        description:
            '马其顿大胜：亚历山大强渡急流击溃波斯联军，小亚细亚门户大开；'
            + '阿尔西提斯战后自尽。',
        fieldBattleData: {
            title: '格拉尼库斯河战役',
            description:
                '亚历山大亲率伙伴骑兵强渡格拉尼库斯河，击溃波斯联军；'
                + '阿尔西提斯战后自尽。',

            // 主人指定的野战坐标。注：与据点「格拉尼库斯」city_gelanikusi(40.32, 27.28)
            // 相距约 10 km；本役是野战，故用 location 而非 locationCityId。
            location: { lat: 40.23, lng: 27.24 },
            marchWaypoints: ['city_anfeibolisi', 'city_yanghe'],

            // ── 攻方：马其顿 亚历山大 ──
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 40000,
            attackerSourceCityId: 'city_salonica',      // 佩拉（马其顿首都，东征出发点）

            // ── 守方：小弗里吉亚（赫勒斯滂弗里吉亚，波斯）阿尔西提斯 ──
            // 🔴 [2026-09-11 主人定] 守方统帅 = **阿尔西提斯**（`xiaofulijiya_aerxitis`）。
            //    他是本役波斯方最高统帅，且数据全齐：立绘 / 技能(ts_001, ordinary) /
            //    成名世纪(-4) / 时代(antiquity)，其势力精锐正是「希腊雇佣兵」(T2)。
            //    据点侧亦自洽：达斯基利翁 city_dasijiliweng 的 note 原文即
            //    「阿契美尼德波斯赫勒斯滂-弗里吉亚总督要塞，阿尔西提斯总督治所」，
            //    所在区组名为 GREEK_MERCENARY。
            defenderFactionId: 'xiaofulijiya',
            defenderGeneralId: 'xiaofulijiya_aerxitis',
            defenderTroops: 25000,
            defenderSourceCityId: 'city_dasijiliweng',

            result: 'attacker_win',                     // 写真历史：马其顿必胜
            autoEnterRTS: true,                          // 进战术模式（13）
        },

        // 「据点归亚历山大」的落点：达斯基利翁（波斯方本营、阿尔西提斯治所）。
        // 主人只说「据点归亚历山大」未指定具体哪座城，此处依史实选定，可一句话更换。
        cityUpdates: [
            { cityId: 'city_dasijiliweng', factionId: 'maqidun' },
        ],
    },
    {
        year: -333,
        // 秋（2）。史料记此役在前 333 年 11 月。
        season: 2,
        type: 'field_battle',
        title: '公元前333年 伊苏斯战役',
        description:
            '马其顿决定性胜利：亚历山大强渡皮纳鲁斯河直扑大流士御驾；'
            + '大流士弃车逃离，王室家眷悉数被俘。',
        fieldBattleData: {
            title: '伊苏斯战役',
            description:
                '亚历山大亲率右翼伙伴骑兵渡河突破波斯左翼，'
                + '大流士三世弃车逃离，王室家眷被俘。',

            // 皮纳鲁斯河畔（伊苏斯城东南约 12 km），野战用 location。
            location: { lat: 36.7583, lng: 36.2250 },
            marchWaypoints: ['city_adana'],      // 阿达纳（奇里乞亚，附近已有据点）

            // ── 攻方：马其顿 亚历山大 ──
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 45000,                 // 史料 40000–45000
            attackerSourceCityId: 'city_salonica',

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
            //    史实就是波斯人多势众、马其顿以少胜多 → 取史料保守中值 8 万。
            //    （胜负不靠改兵数解决：13 战术模式的胜负在演出里打出来，见 docs 与 Scene13WarLayer）
            defenderTroops: 80000,                 // 史料 60000–100000（保守中值）
            // 🔴 出兵据点必须是**真城**（原写 `city_yisusi` —— 伊苏斯已改独立战场，那座城不存在了，属历史遗留缺陷）
            defenderSourceCityId: 'city_bosibolisi',

            result: 'attacker_win',
            autoEnterRTS: true,
        },

        // 🔴 [2026-09-12 主人定] **不写 `cityUpdates`**：伊苏斯是**战场**（`bf_yisusi`），
        //    战场**没有势力**（不是据点，也没有自己的 factionId），不存在「易主」这回事。
        //    原先那句 `{ cityId: 'city_yisusi', factionId: 'maqidun' }` 是错误逻辑，主人指出后已删 ——
        //    它会让一座战场走一遍占城流程
        //    （`CityManager.updateCity`：写 `fallenAtYear`、重置将/精名额、播占城播报与烟雾）。
    },

    // ═══════════════════════════════════════════════════════════════
    // 前 332 年 · 亚历山大剧本**第三段**：推罗围城战（Tyro，公元前332年1月–7/8月）
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
        title: '公元前332年 推罗围城战',
        description:
            '亚历山大填海筑堤直逼岛城，历时七月破推罗；波斯地中海舰队基地被彻底拔除。',
        siegeData: {
            title: '推罗围城战',                     // 🔴 横幅一律显示**战役名**（§三之二 横幅标题铁律）
            description:
                '亚历山大拆推罗陆城、伐黎巴嫩雪松筑跨海长堤，联合塞浦路斯与腓尼基舰队约 220 艘'
                + '封锁南北两港；七月破城，数万军民被屠或被贩为奴。',
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 35000,                   // 史料 35000–40000
            attackerSourceCityId: 'city_salonica',   // 佩拉（剧本主角军团的起兵据点）
            defenderCityId: 'city_tuile',            // 推罗（岛城；守方城内正规守军 8000–10000，取城防默认值）
            defenderGeneralId: 'kanan_azemier',      // 推罗末代国王阿泽米尔（势力「迦南」）
            result: 'attacker_win',                  // 写真历史
            autoEnterRTS: true,                      // 进战术模式（13）
            // 行军：伊苏斯 → 安提俄基亚 → 推罗（主人「方向对就行」；**只用已有据点**，绝不新建路标）
            // 行军：**只留目标城本身**（推罗）。
            // 🔴 [2026-09-12 主人报障「怎么打阿卡了？不去加沙」] 教训：这引擎里"路标"就是
            //    `expeditionTargetCityId` ＝**要去打的城**（到了就打），所以**绝不能拿别国的城当路标**
            //    —— 我原先写了 `['city_antiejiya','city_tuile']`，安提俄基亚属塞琉古(`sailiugu`)，
            //    军团路过就会顺手把它打了。沿途城邦归降（马拉图斯/比布鲁斯/西顿…）**只写文案**。
            marchWaypoints: ['city_tuile'],
        },
        // 战后归属：推罗归马其顿（真城；战场才不许写易主）
        cityUpdates: [{ cityId: 'city_tuile', factionId: 'maqidun' }],
    },

    // ═══════════════════════════════════════════════════════════════
    // 前 332 年秋 · 亚历山大剧本**第四章**：加沙围城战（Siege of Gaza，前332年9–10月）
    // ═══════════════════════════════════════════════════════════════
    // 史料（主人给定）：加沙坐落在约 75 m 高的陡峭沙丘高地上，传统攻城槌无法作业 →
    //   马其顿军堆筑巨型环形土山推攻城器、并挖地道破坏城墙基底，历时约 2 个月、四次总攻破城。
    //   守将巴提斯（Batis，波斯任命的加沙总督）力竭被俘遭处决；城内男子几遭屠尽、妇孺被贩为奴；
    //   通往埃及的大门就此敞开。马其顿陆军 35000–40000（另有自推罗海运来的弩炮/攻城器械）；
    //   守军约 1 万（阿拉伯雇佣兵 + 本地驻军）+ 城内避难平民数万。
    // 🔴 走**剧本攻城通道**（`type:'siege'`，与推罗同一套）；本章的年份只作标题与 HUD 校准 ——
    //    触发已改为**顺序章节链**（主人「一个脚本完成后，直接下一个，看年干什么」）。
    {
        year: -332,
        season: 2,                                   // 秋（史料 9–10 月）
        type: 'siege',
        title: '公元前332年 加沙围城战',
        description:
            '亚历山大在沙丘高地上堆筑环形土山、挖地道破坏墙基，四次总攻破加沙；通往埃及的门户彻底敞开。',
        siegeData: {
            title: '加沙围城战',                     // 🔴 横幅一律显示**战役名**（§三之二 横幅标题铁律）
            description:
                '加沙踞约 75 m 高的陡峭沙丘，攻城槌无法作业；马其顿军堆筑巨型环形土山推攻城器，'
                + '并挖地道破坏城墙基底，历时约两月、四次总攻破城；守将巴提斯被处决，男子几遭屠尽、妇孺为奴。',
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 35000,                   // 史料 35000–40000
            attackerSourceCityId: 'city_salonica',   // 佩拉（剧本主角军团的起兵据点）
            defenderCityId: 'city_jiasa',            // 加沙（城防 10000＝史料守军约 1 万）
            defenderGeneralId: 'feilisidin_batisi',  // 守将巴提斯（势力「腓利斯丁」）
            result: 'attacker_win',                  // 写真历史
            autoEnterRTS: true,
            // 行军：推罗 → 阿卡 → 加沙（你给的 5 站里只有「阿卡」是已有据点；按铁律只用已有据点、绝不新建路标）
            // 行军：**只留目标城本身**（加沙）。
            // 🔴 [2026-09-12 主人报障「怎么打阿卡了？不去加沙」] 原写 `['city_ake','city_jiasa']`，
            //    而阿卡属**耶路撒冷王国**(`yelusalengwg`) —— 是别国的城，军团路过就把它打了 ✗。
            //    路标=要去打的城，所以中间不许插别国据点；史实上阿卡/约帕等"不战而降"只写文案。
            marchWaypoints: ['city_jiasa'],
        },
        // 战后归属：加沙归马其顿（真城）
        cityUpdates: [{ cityId: 'city_jiasa', factionId: 'maqidun' }],
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
