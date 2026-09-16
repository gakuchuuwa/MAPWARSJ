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
        description: '马其顿大胜：亚历山大强渡急流击溃波斯联军，小亚细亚门户大开；阿尔西提斯战后自尽。',
        fieldBattleData: {
            title: '格拉尼库斯河战役',
            description: '亚历山大亲率伙伴骑兵强渡格拉尼库斯河，击溃波斯联军；阿尔西提斯战后自尽。',

            // 主人指定的野战坐标。注：与据点「格拉尼库斯」city_gelanikusi(40.32, 27.28)
            // 相距约 10 km；本役是野战，故用 location 而非 locationCityId。
            location: { lat: 40.23, lng: 27.24 },
            marchWaypoints: ['city_anfeibolisi', 'city_yanghe'],

            // ── 攻方：马其顿 亚历山大 ──
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            // 🔴 [2026-09-16 主人定]「原文35000，战场就要35000」——
            //    赶路播报里写的是「三万五千名跨海而来的希腊与马其顿健儿」，数据必须与文案同口径。
            attackerTroops: 35000,
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
            // 同上，按播报原文：「两万波斯铁骑与近两万精锐希腊雇佣重步兵」≈ 40000。
            //    平衡：35000 : 40000 = 0.875，落在八环战力比 [0.8,1.2] 带内，不会一边倒；
            //    攻方略劣也正是史实——亚历山大是仰攻陡岸强渡取胜，不是以多欺少。
            defenderTroops: 40000,
            defenderSourceCityId: 'city_dasijiliweng',

            result: 'attacker_win',                     // 写真历史：马其顿必胜
            autoEnterRTS: true,                          // 进战术模式（13）
        },

        // 「据点归亚历山大」的落点：达斯基利翁（波斯方本营、阿尔西提斯治所）。
        // 主人只说「据点归亚历山大」未指定具体哪座城，此处依史实选定，可一句话更换。
        cityUpdates: [{ cityId: 'city_dasijiliweng', factionId: 'maqidun' }],
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
            location: { lat: 36.7583, lng: 36.225 },
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
        description: '马其顿军全面彻底的胜利：亚历山大历时七月强行填筑跨海长堤攻破推罗海岛坚固石墙；拔除波斯在地中海的海军基地，推罗城易主归马其顿。',
        siegeData: {
            title: '推罗围城战',                     // 🔴 横幅一律显示战役名
            description: '亚历山大率约 35,000–40,000 步骑大军填海筑堤直逼海岛石墙，攻破推罗要塞；推罗国王阿泽米尔库斯率守军力战，推罗陷落。',
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 35000,                   // 史料 35000–40000 步骑
            attackerSourceCityId: 'city_salonica',   // 佩拉
            defenderCityId: 'city_tuile',            // 推罗
            defenderGeneralId: 'kanan_azemier',      // 推罗末代国王阿泽米尔库斯
            defenderTroops: 10000,                   // 史料守军约 8,000–10,000
            result: 'attacker_win',                  // 写真历史：攻城彻底胜利
            autoEnterRTS: true,                      // 进战术模式（13）
            marchWaypoints: ['city_tuile'],
        },
        // 🔴 战后归属（主人定：如果是攻城战，战斗要改据点归属。一切按历史，无论输赢）：推罗归马其顿
        cityUpdates: [{ cityId: 'city_tuile', factionId: 'maqidun' }],
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
            attackerTroops: 14000,                   // 史料 10,000 至 17,000 先锋精锐
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
            defenderTroops: 25000,
            defenderSourceCityId: 'city_bosibolisi', // 波斯波利斯

            result: 'attacker_win',                  // 写真历史：马其顿迂回奇袭获胜
            autoEnterRTS: true,                      // 进战术模式（13）
        },
        // 🔴 战后归属：扫清最后屏障，波斯波利斯易主归马其顿
        cityUpdates: [{ cityId: 'city_bosibolisi', factionId: 'maqidun' }],
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
    },

    // ═══════════════════════════════════════════════════════════════
    // 前 328 年冬 · 亚历山大平定中亚：索格底亚那岩山围攻战（Siege of the Sogdian Rock，前328年冬）
    // ═══════════════════════════════════════════════════════════════
    {
        year: -328,
        season: 3,                                   // 冬（史料：前328年冬至前327年初，严冬雪夜攀登冰冻绝壁）
        type: 'field_battle',
        title: '公元前328年 索格底亚那岩山围攻战',
        description: '马其顿军完胜：索格底亚那大贵族奥克夏特斯依四面悬崖峭壁死守岩山要塞；亚历山大选派300名精锐攀岩死士深夜沿冰雪冻壁奇袭登顶，守军心理彻底崩溃不战而降；奥克夏特斯归降，亚历山大迎娶罗克珊娜平定中亚反抗。',
        fieldBattleData: {
            title: '索格底亚那岩山围攻战',
            description: '奥克夏特斯扼守险峰绝壁要塞，亚历山大选派300攀岩死士雪夜渗透奇袭登顶，守军心理崩溃归降。',
            // 苏尔汉河州贝孙岭险峰（北纬 38°58'00", 东经 67°02'00"）
            location: { lat: 38.9667, lng: 67.0333 },

            // ── 攻方：马其顿军先锋部队 亚历山大大帝 ──
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 10000,                   // 围攻先锋精锐主力部队
            attackerSourceCityId: 'city_salonica',   // 佩拉

            // ── 守方：索格底亚那守军 奥克夏特斯 ──
            defenderFactionId: 'sogdian',
            defenderGeneralId: 'sogdian_aokexiate',
            defenderTroops: 30000,                   // 史料守军约 30,000 人（含起义武装与军民）
            defenderSourceCityId: 'city_varaksha',   // 瓦拉赫沙

            result: 'attacker_win',                  // 写真历史：守军不战而降
            autoEnterRTS: true,                      // 进战术模式（13）
        },
    },

    // ═══════════════════════════════════════════════════════════════
    // 前 327 年春 · 亚历山大进军印度：马萨加围城战（Siege of Massaga，前327年春）
    // ═══════════════════════════════════════════════════════════════
    {
        year: -327,
        season: 0,                                   // 春（史料：前327年春进军斯瓦特河谷）
        type: 'field_battle',
        title: '公元前327年 马萨加围城战',
        description: '马其顿军苦战攻克要塞获胜：亚历山大进军斯瓦特河谷围攻马萨加险要坚城；马其顿攻城塔与攻城锤昼夜猛轰城墙裂口，阿斯瓦卡首领阿萨卡诺斯阵亡，克莱奥菲斯女王率部投降；要塞被全面攻破，为进军印度扫清通道。',
        fieldBattleData: {
            title: '马萨加围城战',
            description: '亚历山大率攻城重型机械围攻马萨加险要要塞，阿萨卡诺斯阵亡后克莱奥菲斯女王统领全城力战投降，马其顿军攻克要塞。',
            // 斯瓦特河谷查克达拉古要塞（北纬 34°40'15", 东经 71°50'30"）
            location: { lat: 34.6708, lng: 71.8417 },

            // ── 攻方：马其顿军 亚历山大大帝 ──
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 22000,                   // 史料约 20,000 至 25,000 人（中值）
            attackerSourceCityId: 'city_salonica',   // 佩拉

            // ── 守方：阿斯瓦卡守军 克莱奥菲斯女王 ──
            defenderFactionId: 'aswaka',
            defenderGeneralId: 'aswaka_cleophis',
            defenderTroops: 39000,                   // 史料 30,000 本土步兵 + 2,000 骑兵 + 7,000 雇佣军（含30头战象）
            defenderSourceCityId: 'city_baishawa',   // 临近根据地白沙瓦（犍陀罗）

            result: 'attacker_win',                  // 写真历史：攻克要塞获胜
            autoEnterRTS: true,                      // 进战术模式（13）
        },
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
    },

    // ═══════════════════════════════════════════════════════════════
    // 前 325 年春 · 亚历山大南撤清剿：马里斯城围攻战（Siege of the Mallian Citadel，前325年春）
    // ═══════════════════════════════════════════════════════════════
    {
        year: -325,
        season: 0,                                   // 春（史料：前325年春沿印度河河谷清剿）
        type: 'field_battle',
        title: '公元前325年 马里斯城围攻战',
        description: '马其顿军惨烈攻克卫城获胜：亚历山大率军沿印度河清剿围攻马利砖石卫城，亲自登梯突入城内庭院与守军血战，胸部中箭射穿肺叶倒地；愤怒的马其顿士卒砸开城门破城彻底屠戮守军，亚历山大侥幸脱险但肺伤终生未愈；随后马其顿军彻底控制印度河下游，横渡格德罗西亚荒漠回师。',
        fieldBattleData: {
            title: '马里斯城围攻战',
            description: '亚历山大亲自登梯突入马里斯砖石卫城血战身负重伤（胸部贯穿），赶来救驾的马其顿士卒怒破城门攻克要塞。',
            // 木尔坦卫城古要塞遗址（北纬 30°11'50", 东经 71°28'30"）
            location: { lat: 30.1972, lng: 71.475 },

            // ── 攻方：马其顿军主力分队 亚历山大大帝 ──
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'gen_alexander_great',
            attackerTroops: 13000,                   // 史料参战主力精锐分队约 10,000 至 15,000 人（中值）
            attackerSourceCityId: 'city_salonica',   // 佩拉

            // ── 守方：马利（摩罗婆）联军 马利首领 ──
            defenderFactionId: 'malli',
            defenderGeneralId: 'malli_leader',
            defenderTroops: 54000,                   // 史料约 50,000 步兵 + 3,000 骑兵 + 1,000 战车
            defenderSourceCityId: 'city_meng',       // 蒙格

            result: 'attacker_win',                  // 写真历史：攻破卫城惨胜获胜
            autoEnterRTS: true,                      // 进战术模式（13）
        },
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
    },

    // ═══════════════════════════════════════════════════════════════
    // 前 323 年秋 · 拉米亚战争爆发：普拉塔纳斯战役（Battle of Platana，前323年秋）
    // ═══════════════════════════════════════════════════════════════
    {
        year: -323,
        season: 2,                                   // 秋（史料：前323年秋亚历山大死讯传开后希腊各城邦爆发拉米亚战争）
        type: 'field_battle',
        title: '公元前323年 普拉塔纳斯战役',
        description: '希腊反马其顿联军全面大胜：亚历山大巴比伦逝世后希腊城邦爆发独立战争，莱奥斯塞尼斯统帅雅典与希腊联军在马里亚克湾平原迎击安提帕特；决战时刻色萨利精锐骑兵临阵倒戈反戈一击，马其顿军侧后彻底崩溃死伤惨重；安提帕特退守拉米亚坚城被围，拉开继业者纷争乱世大幕。',
        fieldBattleData: {
            title: '普拉塔纳斯战役',
            description: '希腊联军在普拉塔纳平原与马其顿常备军激战，色萨利精锐骑兵阵前倒戈，莱奥斯塞尼斯大破安提帕特。',
            // 马里亚克湾沿海平原（北纬 38°48'30", 东经 22°43'10"）
            location: { lat: 38.8083, lng: 22.7194 },

            // ── 攻方：希腊反马其顿联军 莱奥斯塞尼斯 ──
            attackerFactionId: 'xila',
            attackerGeneralId: 'xila_leosthenes',
            attackerTroops: 28000,                   // 史料参战联军约 25,000 至 30,000 人（中值）
            attackerSourceCityId: 'city_yadian',     // 雅典

            // ── 守方：马其顿帝国本土守军 安提帕特 ──
            defenderFactionId: 'maqidun',
            defenderGeneralId: 'maqidun_antipater',
            defenderTroops: 13600,                   // 史料约 13,000 步兵 + 600 骑兵
            defenderSourceCityId: 'city_salonica',   // 佩拉

            result: 'attacker_win',                  // 写真历史：希腊联军大胜
            autoEnterRTS: true,                      // 进战术模式（13）
        },
    },

    // ═══════════════════════════════════════════════════════════════
    // 前 322 年夏 · 拉米亚战争终局：克兰农战役（Battle of Crannon，前322年夏）
    // ═══════════════════════════════════════════════════════════════
    {
        year: -322,
        season: 1,                                   // 夏（史料：前322年8–9月盛夏平原大决战）
        type: 'field_battle',
        title: '公元前322年 克兰农战役',
        description: '马其顿联军大获全胜：安提帕特与克拉特罗斯精锐合兵发起全面反攻，以压倒性重装长矛老兵方阵碾碎希腊同盟步兵阵线；希腊骑兵见防线瓦解被迫脱离，同盟分崩离析；马其顿进驻雅典强行废除民主政体改立寡头统治，拉米亚战争彻底终结，希腊古典城邦政治时代宣告落幕。',
        fieldBattleData: {
            title: '克兰农战役',
            description: '安提帕特与克拉特罗斯合兵指挥老兵重装方阵全线突击，压倒性冲击瓦解希腊同盟步兵防线。',
            // 色萨利克兰农平原（北纬 39°31'10", 东经 22°19'40"）
            location: { lat: 39.5194, lng: 22.3278 },

            // ── 攻方：马其顿帝国联军 安提帕特 ──
            attackerFactionId: 'maqidun',
            attackerGeneralId: 'maqidun_antipater',
            attackerTroops: 45000,                   // 史料约 43,000 至 48,000 人（中值）
            attackerSourceCityId: 'city_salonica',   // 佩拉

            // ── 守方：希腊反马其顿同盟军 安提菲洛斯 ──
            defenderFactionId: 'xila',
            defenderGeneralId: 'xila_antiphilus',
            defenderTroops: 28500,                   // 史料约 28,500 人（25,000 步兵 + 3,500 骑兵）
            defenderSourceCityId: 'city_yadian',     // 雅典

            result: 'attacker_win',                  // 写真历史：马其顿联军大获全胜
            autoEnterRTS: true,                      // 进战术模式（13）
        },
    },

    // ═══════════════════════════════════════════════════════════════
    // 前 321 年春 · 继业者内战爆发：赫勒斯滂战役（Battle of the Hellespont，前321年春）
    // ═══════════════════════════════════════════════════════════════
    {
        year: -321,
        season: 0,                                   // 春（史料：前321年春，第一次继业者战争关键决战）
        type: 'field_battle',
        title: '公元前321年 赫勒斯滂战役',
        description: '欧迈尼斯军大获全胜：第一次继业者战争爆发，欧迈尼斯在达达尼尔海峡南岸迎击克拉特罗斯叛军；欧迈尼斯封锁敌帅身份令两翼精锐重骑兵全速钳形突击，克拉特罗斯战马受创落马遭践踏阵亡，欧迈尼斯单挑手刃叛将涅俄普托勒摩斯；反摄政同盟步兵阵被围缴械投降，欧迈尼斯一战封神。',
        fieldBattleData: {
            title: '赫勒斯滂战役',
            description: '欧迈尼斯指挥两翼卡帕多细亚精锐重骑兵全速钳形冲锋，克拉特罗斯落马阵亡，欧迈尼斯阵斩叛将。',
            // 恰纳卡莱达达尼尔海峡以南内陆平原（北纬 40°09'00", 东经 26°24'00"）
            location: { lat: 40.15, lng: 26.4 },

            // ── 攻方：帝国中央军（摄政派）/ 卡帕多细亚 欧迈尼斯 ──
            attackerFactionId: 'kapaduoxiya',
            attackerGeneralId: 'gen_eumenes',
            attackerTroops: 25000,                   // 史料 25,000 人（20,000 步兵 + 5,000 精锐重骑兵）
            attackerSourceCityId: 'city_dasijiliweng', // 达斯基利翁（小亚细亚赫勒斯滂弗里吉亚首府要塞）

            // ── 守方：反摄政同盟军 / 马其顿 克拉特罗斯 ──
            defenderFactionId: 'maqidun',
            defenderGeneralId: 'maqidun_craterus',
            defenderTroops: 22000,                   // 史料 22,000 人（20,000 精锐马其顿老兵方阵 + 2,000 骑兵）
            defenderSourceCityId: 'city_salonica',   // 佩拉

            result: 'attacker_win',                  // 写真历史：欧迈尼斯大获全胜
            autoEnterRTS: true,                      // 进战术模式（13）
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
