import { HistoricalEvent } from '../../types/core';

export const EVENTS_QIN: HistoricalEvent[] = [
    // ═══════════════════════════════════════════════════════════════
    // 第一时代：秦东进十城（前246～前237）→ 战国末期～秦亡（前236～前208）
    // 史料来源：D:\MAPWARSJ\史料\01秦朝\
    // ═══════════════════════════════════════════════════════════════
    // ╔═══════════════════════════════════════════════════════════════╗
    // ║  事件数据模板 (三种类型)  攻城，野战，政事                       ║
    // ╚═══════════════════════════════════════════════════════════════╝
    //
    // 【通用字段】(所有类型共有)
    //   "year":        数字,      // [年份] 负数=公元前, 如 -236 = 前236年
    //   "regnalYear":  字符串,    // [年号] 如 "秦王政十一年"
    //   "title":       字符串,    // [标题] 战役/事件名称
    //   "season":      0|1|2|3,   // [季节] 0:春, 1:夏, 2:秋, 3:冬；与史实对不上一律用 0 春
    //   "description": 字符串,    // [描述] 历史事件详情 (硬核军语风, 参见 战争文案提示词.md)
    //   "type":        字符串,    // [类型] "siege" | "field_battle" | "narrative"
    //
    // 【兵力约定】不写 attackerTroops / defenderTroops → 默认各 10000。
    //             剧本只须写死 result（attacker_win / defender_win）。
    // 【秦军】全局仅一支现役军团：legionName / attackerLegionName 一律写「秦军」（见 legions.ts）。
    //
    // ────────────────────────────────────────────────────────────────
    // 【样本一】攻城战 siege — 围城夺邑、攻克据点
    // ────────────────────────────────────────────────────────────────
    // {
    //     "year": -236,
    //     "regnalYear": "秦王政十一年",
    //     "title": "秦赵阏与之战",
    //     "season": 0,
    //     "description": "秦将王翦趁赵军主力北伐燕国之际，率大军自上党出击，越太行山攻克赵国要塞阏与及橑阳。",
    //     "type": "siege",
    //     "siegeData": {
    //         "attackerFactionId": "qin",     // [攻击方势力] 参见 factions.ts
    //         "attackerCityId": "city_shangdang",   // [出发城市]   军团从这里出发 (可选, 不填则凭空生成)
    //         "defenderCityId": "city_heshun",      // [目标城市]   参见 cities.ts (必填)
    //         "legionName": "秦军",            // [军团名称] 秦国全局唯一现役军团
    //         "result": "attacker_win",           // [结果] 必填；"attacker_win" | "defender_win"
    //     }
    // },
    //
    // ────────────────────────────────────────────────────────────────
    // 【样本二】野战 field_battle — 两军对阵、野外决战
    // ────────────────────────────────────────────────────────────────
    // {
    //     "year": -234,
    //     "regnalYear": "秦王政十三年",
    //     "title": "秦赵平阳之战",
    //     "season": 0,
    //     "description": "秦将桓齮率主力自安阳挥师越漳水，于平阳野战中大破赵国南线守军，阵斩赵国大将扈辄，枭首十万余级，秦军凶威震慑赵野。",
    //     "type": "field_battle",
    //     "fieldBattleData": {
    //         "attackerSourceCityId": "city_anyang", // [攻击方出发城市] 可选
    //         "defenderSourceCityId": "city_handan"    // [防守方出发城市] 可选
    //         "locationCityId": "bf_cixian",       // [战场地点] 参见 cities.ts 中 battlefield 类型
    //         "attackerFactionId": "qin",       // [攻击方势力] 参见 factions.ts
    //         "defenderFactionId": "huihui",       // [防守方势力] 参见 factions.ts
    //         "attackerLegionName": "秦军",    // [攻击方军团] 地图上显示的名字
    //         "defenderLegionName": "赵-扈辄军",    // [防守方军团] 地图上显示的名字
    //         "attackerTroops": 100000,            // [攻击方兵力]
    //         "defenderTroops": 100000,            // [防守方兵力]
    //         "result": "attacker_win",            // [结果] "attacker_win" | "defender_win"
    //     }
    // },
    //
    // ────────────────────────────────────────────────────────────────
    // 【样本三】政事 narrative — 政治外交、人事变动、无军队动作
    // ────────────────────────────────────────────────────────────────
    // {
    //     "year": -221,
    //     "regnalYear": "秦王政二十六年",
    //     "title": "秦统一天下",
    //     "season": 0,
    //     "description": "秦王政兼并六国，一统海内，自称始皇帝，定都咸阳，废分封行郡县，书同文车同轨，天下归于一制。",
    //     "type": "narrative",       // [政事] 仅弹出文字描述，地图无军队动作
    //     "narrativeData": {
    //         "factionId": "qin"  // [关联势力] 可选，用于 UI 显示势力颜色
    //     }
    // },
    //
    // 【势力ID速查】qin=秦国  zhonghua=汉/宋/明  tianchao=楚/吴/南朝
    //                chaoxian=燕/辽/朝鲜  huihui=赵/匈奴/突厥  menggu=蒙古
    //                qiangzang=韩/羌/吐蕃  yuenan=越/南越/南诏
    // ═══════════════════════════════════════════════════════════════

    // ══════════════════════════════════════════
    // 前246～前237 秦东进十城（一年一城，春；同一支「秦军」）
    // 纪年：前246=秦王政元年 … 前237=秦王政十年（见 QinRegnalCalendar.ts）
    // ══════════════════════════════════════════
    {
        "year": -246,
        "regnalYear": "秦王政元年",
        "title": "秦军攻打汧邑",
        "season": 0,
        "description": "秦自陇右出师东向，首攻汧邑。陇道要冲，西戎据堡拒战，秦军列阵强攻以开东出孔道。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "attackerCityId": "city_tianshui",
            "defenderCityId": "city_longzhou",
            "attackerGeneralId": "baiqi",
            "attackerPortrait": "/assets/qin/baiqi.png",
            "defenderGeneralId": "xirong",
            "defenderPortrait": "/assets/qin/xirong.png",
            "result": "attacker_win",
            "legionName": "秦军"
        }
    },
    {
        "year": -245,
        "regnalYear": "秦王政二年",
        "title": "秦军攻打岐山",
        "season": 0,
        "description": "秦军自陇东再进，兵锋直指岐山。周室西垂旧畿，戎部据险，秦军强攻以拓东向之路。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "defenderCityId": "city_qishan",
            "attackerGeneralId": "baiqi",
            "attackerPortrait": "/assets/qin/baiqi.png",
            "defenderGeneralId": "xirong",
            "defenderPortrait": "/assets/qin/xirong.png",
            "result": "attacker_win",
            "legionName": "秦军"
        }
    },
    {
        "year": -244,
        "regnalYear": "秦王政三年",
        "title": "秦军攻打咸阳",
        "season": 0,
        "description": "秦军东出陇坂，直叩咸阳。关中西部腹心，周秦必争；守军据城拒战，秦军强攻以定关中基势。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "defenderCityId": "city_changan",
            "attackerGeneralId": "baiqi",
            "attackerPortrait": "/assets/qin/baiqi.png",
            "defenderGeneralId": "zhoujiang",
            "defenderPortrait": "/assets/qin/zhoujiang.png",
            "result": "attacker_win",
            "legionName": "秦军"
        }
    },
    {
        "year": -243,
        "regnalYear": "秦王政四年",
        "title": "秦军攻打下邽",
        "season": 0,
        "description": "秦军沿渭东进，攻下邽。扼渭北通道，拒守者据城，秦军强攻以连关中诸堡。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "defenderCityId": "city_weinan",
            "attackerGeneralId": "baiqi",
            "attackerPortrait": "/assets/qin/baiqi.png",
            "defenderGeneralId": "zhoujiang",
            "defenderPortrait": "/assets/qin/zhoujiang.png",
            "result": "attacker_win",
            "legionName": "秦军"
        }
    },
    {
        "year": -242,
        "regnalYear": "秦王政五年",
        "title": "秦军攻打桃林塞",
        "season": 0,
        "description": "秦军东出关陇，攻桃林塞。黄河渭水交会要隘，守军据关拒战，秦军强攻以开崤函东出之门。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "defenderCityId": "city_tongguan",
            "attackerGeneralId": "baiqi",
            "attackerPortrait": "/assets/qin/baiqi.png",
            "defenderGeneralId": "zhoujiang",
            "defenderPortrait": "/assets/qin/zhoujiang.png",
            "result": "attacker_win",
            "legionName": "秦军"
        }
    },
    {
        "year": -241,
        "regnalYear": "秦王政六年",
        "title": "秦军攻打函谷关",
        "season": 0,
        "description": "秦军兵临函谷关，叩关强攻。关东屏蔽，守军据险，秦军破关以通中原孔道。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "defenderCityId": "city_hanguguan",
            "attackerGeneralId": "baiqi",
            "attackerPortrait": "/assets/qin/baiqi.png",
            "defenderGeneralId": "zhoujiang",
            "defenderPortrait": "/assets/qin/zhoujiang.png",
            "result": "attacker_win",
            "legionName": "秦军"
        }
    },
    {
        "year": -240,
        "regnalYear": "秦王政七年",
        "title": "秦军攻打渑池",
        "season": 0,
        "description": "秦军出关东进，攻渑池。崤函东出险要，守军据城，秦军强攻以拓中原前沿。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "defenderCityId": "city_mianchi",
            "attackerGeneralId": "baiqi",
            "attackerPortrait": "/assets/qin/baiqi.png",
            "defenderGeneralId": "zhoujiang",
            "defenderPortrait": "/assets/qin/zhoujiang.png",
            "result": "attacker_win",
            "legionName": "秦军"
        }
    },
    {
        "year": -239,
        "regnalYear": "秦王政八年",
        "title": "秦军攻打洛邑",
        "season": 0,
        "description": "秦军循崤函古道东进，攻洛邑。周室旧都，守军据城拒战，秦军强攻以立中原声威。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "defenderCityId": "city_luoyang",
            "attackerGeneralId": "baiqi",
            "attackerPortrait": "/assets/qin/baiqi.png",
            "defenderGeneralId": "zhoujiang",
            "defenderPortrait": "/assets/qin/zhoujiang.png",
            "result": "attacker_win",
            "legionName": "秦军"
        }
    },
    {
        "year": -238,
        "regnalYear": "秦王政九年",
        "title": "秦军攻打天井关",
        "season": 0,
        "description": "秦军北上叩天井关，强攻关隘。太行南口险塞，守军据关，秦军破关以通上党孔道。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "defenderCityId": "city_tianjinguan",
            "attackerGeneralId": "baiqi",
            "attackerPortrait": "/assets/qin/baiqi.png",
            "defenderGeneralId": "zhoujiang",
            "defenderPortrait": "/assets/qin/zhoujiang.png",
            "result": "attacker_win",
            "legionName": "秦军"
        }
    },
    {
        "year": -237,
        "regnalYear": "秦王政十年",
        "title": "秦军攻打长子",
        "season": 0,
        "description": "秦军越太行，攻长子。上党要地，守军据城，秦军强攻以定东进最后一城，随后可转攻赵境。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "defenderCityId": "city_shangdang",
            "attackerGeneralId": "baiqi",
            "attackerPortrait": "/assets/qin/baiqi.png",
            "defenderGeneralId": "zhao_general",
            "defenderPortrait": "/assets/qin/zhao_general.png",
            "result": "attacker_win",
            "legionName": "秦军"
        }
    },

    {
        "year": -236,
        "regnalYear": "秦王政十一年",
        "title": "秦军攻打阏与",
        "season": 0,
        "description": "秦王政十一年冬，赵军主力倾巢伐燕，西线防备空虚。秦上将军王翦敏锐捕捉战机，亲率大军自上党拔营，兵锋直指太行山脊之战略要隘阏与。秦军以雷霆之势骤然发起攻城，意图一举撕开赵国西面屏障。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "defenderCityId": "city_eyu",
            "attackerCityId": "city_shangdang",
            "attackerGeneralId": "wang_jian",
            "defenderGeneralId": "zhao_general",
            "attackerPortrait": "/assets/qin/wang_jian.png",
            "defenderPortrait": "/assets/qin/zhao_general.png",
            "result": "attacker_win",
            "legionName": "秦军"
        }
    },
    {
        "year": -236,
        "regnalYear": "秦王政十一年",
        "title": "秦赵安阳之战",
        "season": 0,
        "description": "秦将桓齮统领南路大军由南阳发兵，循太行山东南麓长驱直入，势如破竹，猛攻赵国南部军事重镇安阳，破壁陷阵一举拔之。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "defenderCityId": "city_anyang",
            "attackerCityId": "city_eyu",
            "defenderGeneralId": "zhao_general",
            "defenderPortrait": "/assets/qin/zhao_general.png",
            "result": "attacker_win",
            "legionName": "秦军",
            "attackerTroops": 100000
        }
    },

    // ══════════════════════════════════════════
    // 前235～前221 秦军东进十七城（一年一城，春；同一支「秦军」）
    // 地图 defenderCityId 不变；title/description 仅用战国旧称（见下表）
    //   太原→晋阳  获嘉→修武  虎牢关→成皋  真定→东垣  范阳→武阳/督亢
    //   北京→蓟城  汴梁→大梁  宛丘→陈郢  曲阜→鲁邑
    // ══════════════════════════════════════════
    {
        "year": -235,
        "regnalYear": "秦王政十二年",
        "title": "秦军攻打晋阳",
        "season": 0,
        "description": "晋阳为秦太原郡治所，本赵龙兴之地；前246年秦已占此地设郡，今秦军以此为向东、向北攻赵之大本营，列阵强攻以固河东后方。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "defenderCityId": "city_taiyuan",
            "attackerCityId": "city_anyang",
            "defenderGeneralId": "zhao_general",
            "defenderPortrait": "/assets/qin/zhao_general.png",
            "result": "attacker_win",
            "legionName": "秦军"
        }
    },
    {
        "year": -234,
        "regnalYear": "秦王政十三年",
        "title": "秦军攻打安阳",
        "season": 0,
        "description": "安阳为赵魏交界重镇，战国时已有其名，侧有军事要地邺城。秦将桓齮自晋阳东出，于安阳—邺城一线强攻赵军，为平阳之战扫清道路。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "defenderCityId": "city_anyang",
            "attackerCityId": "city_taiyuan",
            "defenderGeneralId": "zhao_general",
            "defenderPortrait": "/assets/qin/zhao_general.png",
            "result": "attacker_win",
            "legionName": "秦军"
        }
    },
    {
        "year": -233,
        "regnalYear": "秦王政十四年",
        "title": "秦军攻打朝歌",
        "season": 0,
        "description": "朝歌为商、卫故都，战国时为赵魏交界兵家必争之地。秦军沿卫地南下，攻朝歌以连南线诸堡。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "defenderCityId": "city_zhaoge",
            "attackerCityId": "city_anyang",
            "defenderGeneralId": "zhao_general",
            "defenderPortrait": "/assets/qin/zhao_general.png",
            "result": "attacker_win",
            "legionName": "秦军"
        }
    },
    {
        "year": -232,
        "regnalYear": "秦王政十五年",
        "title": "秦军攻打修武",
        "season": 0,
        "description": "修武、共邑为魏国城邑，河内要冲（后世所称获嘉，汉武帝时始有）。秦军东进魏境，攻修武以开向成皋之路。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "defenderCityId": "city_huojia",
            "attackerCityId": "city_zhaoge",
            "defenderGeneralId": "zhoujiang",
            "defenderPortrait": "/assets/qin/zhoujiang.png",
            "result": "attacker_win",
            "legionName": "秦军"
        }
    },
    {
        "year": -231,
        "regnalYear": "秦王政十六年",
        "title": "秦军攻打成皋",
        "season": 0,
        "description": "成皋即虎牢，为韩国险关、洛阳东出咽喉；韩已割南阳予秦。秦军叩关强攻，破成皋以通中原孔道。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "defenderCityId": "city_hulaoguan",
            "attackerCityId": "city_huojia",
            "defenderGeneralId": "zhoujiang",
            "defenderPortrait": "/assets/qin/zhoujiang.png",
            "result": "attacker_win",
            "legionName": "秦军"
        }
    },
    {
        "year": -230,
        "regnalYear": "秦王政十七年",
        "title": "秦军攻打新郑",
        "season": 0,
        "description": "新郑为韩国都城。秦将内史腾自成皋一线挥师北上，攻破新郑，俘虏韩王安，韩国灭亡。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "defenderCityId": "city_xinzheng",
            "attackerCityId": "city_hulaoguan",
            "defenderGeneralId": "zhoujiang",
            "defenderPortrait": "/assets/qin/zhoujiang.png",
            "result": "attacker_win",
            "legionName": "秦军"
        }
    },
    {
        "year": -229,
        "regnalYear": "秦王政十八年",
        "title": "秦军攻打邯郸",
        "season": 0,
        "description": "邯郸为赵国都城。秦将王翦大举攻赵，兵锋直指邯郸；赵中离间计，赵王迁诛杀名将李牧，赵军据城仍难支。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "defenderCityId": "city_handan",
            "attackerCityId": "city_xinzheng",
            "attackerGeneralId": "wang_jian",
            "attackerPortrait": "/assets/qin/wang_jian.png",
            "defenderGeneralId": "zhao_general",
            "defenderPortrait": "/assets/qin/zhao_general.png",
            "result": "attacker_win",
            "legionName": "秦军"
        }
    },
    {
        "year": -228,
        "regnalYear": "秦王政十九年",
        "title": "秦军攻打东垣",
        "season": 0,
        "description": "东垣为赵国常山要地（后世真定之名始于汉代）。邯郸既下，秦军北进攻东垣，赵残部败遁，逃往代地。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "defenderCityId": "city_zhending",
            "attackerCityId": "city_handan",
            "defenderGeneralId": "zhao_general",
            "defenderPortrait": "/assets/qin/zhao_general.png",
            "result": "attacker_win",
            "legionName": "秦军"
        }
    },
    {
        "year": -227,
        "regnalYear": "秦王政二十年",
        "title": "秦军攻打武阳",
        "season": 0,
        "description": "武阳为燕国下都，督亢为燕南最肥之区（荆轲献秦之《督亢图》即此）。秦军东出，攻武阳、督亢以逼燕都。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "defenderCityId": "city_fanyang",
            "attackerCityId": "city_zhending",
            "defenderGeneralId": "zhao_general",
            "defenderPortrait": "/assets/qin/zhao_general.png",
            "result": "attacker_win",
            "legionName": "秦军"
        }
    },
    {
        "year": -226,
        "regnalYear": "秦王政二十一年",
        "title": "秦军攻打蓟城",
        "season": 0,
        "description": "蓟城为燕国都城。秦将王翦、王贲统大军猛攻蓟城，城陷，燕王喜逃往辽东。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "defenderCityId": "city_beijing",
            "attackerCityId": "city_fanyang",
            "attackerGeneralId": "wang_jian",
            "attackerPortrait": "/assets/qin/wang_jian.png",
            "defenderGeneralId": "zhao_general",
            "defenderPortrait": "/assets/qin/zhao_general.png",
            "result": "attacker_win",
            "legionName": "秦军"
        }
    },
    {
        "year": -225,
        "regnalYear": "秦王政二十二年",
        "title": "秦军攻打大梁",
        "season": 0,
        "description": "大梁为魏国都城。秦将王贲引黄河、鸿沟之水灌城，历时三月城郭崩坏，魏王假出降，魏国灭亡。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "defenderCityId": "city_bianliang",
            "attackerCityId": "city_beijing",
            "defenderGeneralId": "zhoujiang",
            "defenderPortrait": "/assets/qin/zhoujiang.png",
            "result": "attacker_win",
            "legionName": "秦军"
        }
    },
    {
        "year": -224,
        "regnalYear": "秦王政二十三年",
        "title": "秦军攻打陈郢",
        "season": 0,
        "description": "陈郢为楚国故都、重镇，楚曾避秦锋而将都迁于此。王翦率六十万大军进抵陈郢，强攻破城，大破楚军项燕。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "defenderCityId": "city_huaiyang",
            "attackerCityId": "city_bianliang",
            "attackerGeneralId": "wang_jian",
            "attackerPortrait": "/assets/qin/wang_jian.png",
            "defenderGeneralId": "zhoujiang",
            "defenderPortrait": "/assets/qin/zhoujiang.png",
            "result": "attacker_win",
            "legionName": "秦军"
        }
    },
    {
        "year": -223,
        "regnalYear": "秦王政二十四年",
        "title": "秦军攻打寿春",
        "season": 0,
        "description": "寿春为楚国都城。秦军乘胜南下，攻陷寿春，俘虏楚王负刍，楚国灭亡。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "defenderCityId": "city_shouxian",
            "attackerCityId": "city_huaiyang",
            "defenderGeneralId": "zhoujiang",
            "defenderPortrait": "/assets/qin/zhoujiang.png",
            "result": "attacker_win",
            "legionName": "秦军"
        }
    },
    {
        "year": -222,
        "regnalYear": "秦王政二十五年",
        "title": "秦军攻打鲁邑",
        "season": 0,
        "description": "鲁邑为鲁国都城，战国末为楚国所并。秦将王贲平定楚地江南，进兵鲁邑，强攻以定齐南境。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "defenderCityId": "city_qufu",
            "attackerCityId": "city_shouxian",
            "defenderGeneralId": "zhoujiang",
            "defenderPortrait": "/assets/qin/zhoujiang.png",
            "result": "attacker_win",
            "legionName": "秦军"
        }
    },
    {
        "year": -221,
        "regnalYear": "秦王政二十六年",
        "title": "秦军攻打临淄",
        "season": 0,
        "description": "临淄为齐国都城。秦将王贲避齐西线重兵，自燕南迂回南下，猝然兵临临淄，齐王建不战出降，齐国灭亡，秦统一天下。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "defenderCityId": "city_linzi",
            "attackerCityId": "city_qufu",
            "defenderGeneralId": "zhoujiang",
            "defenderPortrait": "/assets/qin/zhoujiang.png",
            "result": "attacker_win",
            "legionName": "秦军"
        }
    },
    // ──────────────────────
    // 前220年 南征百越集结
    // ──────────────────────
    {
        "year": -220,
        "regnalYear": "秦始皇二十七年",
        "title": "秦平百越之战",
        "season": 0,
        "description": "秦始皇命尉屠睢统率五十万水陆大军，兵分五路向岭南百越发起大规模战略进攻。秦军长驱直入，迅速击溃西瓯与南越诸部之分散抵抗，全面攻占岭南大部地区。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "defenderCityId": "city_guangzhou",
            "attackerCityId": "city_ying",
            "result": "attacker_win",
            "legionName": "秦军",
            "attackerTroops": 500000
        }
    },

    // ──────────────────────
    // 前219年 南征百越主攻
    // ──────────────────────
    {
        "year": -219,
        "regnalYear": "秦始皇二十八年",
        "title": "秦越西瓯之战",
        "season": 0,
        "description": "秦尉屠睢统率主力，出九疑之塞，越萌渚岭，兵锋直指西瓯。秦师与西瓯部族主力激战，势如破竹，阵斩西瓯君译吁宋，初战告捷。",
        "type": "field_battle",
        "fieldBattleData": {
            "attackerFactionId": "qin",
            "attackerLegionName": "秦军",
            "attackerTroops": 150000,
            "attackerSourceCityId": "city_jiuyi",
            "defenderFactionId": "yuenan",
            "defenderLegionName": "越-译吁宋军",
            "defenderTroops": 40000,
            "location": {
                "lat": 25.6938,
                "lng": 110.8191
            },
            "result": "attacker_win"
        }
    },
    {
        "year": -219,
        "regnalYear": "秦始皇二十八年",
        "title": "秦越番禺之战",
        "season": 0,
        "description": "秦将任嚣统领楼船秦军，兵分两路。一路自南野过横浦关，沿浈水南下；一路破阳山关，沿连江东进。两军会师于湟溪关，水陆并进，势如破竹。一举攻占番禺，据守珠江出海口。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "legionName": "秦军",
            "attackerTroops": 20000,
            "attackerCityId": "city_nanye",
            "defenderCityId": "city_panyu",
            "result": "attacker_win",
            "afterBattleChain": [
                {
                    "action": "destroy"
                }
            ]
        }
    },

    // ──────────────────────
    // 前217年 屠睢战死
    // ──────────────────────
    {
        "year": -217,
        "regnalYear": "秦始皇三十年",
        "title": "越秦西瓯之战",
        "season": 0,
        "description": "秦军兵锋深入丛薄荒野遭遇了西瓯部族的顽强游击战。越酋桀骏率众昼伏夜出，频袭粮道，致使秦尉屠睢久困腹地。至本年，桀骏集结精锐乘夜突袭秦大营，秦师疲敝大营告破。秦尉屠睢战死，伏尸流血数十万。战后待监御史禄开凿灵渠通粮。",
        "type": "field_battle",
        "fieldBattleData": {
            "attackerFactionId": "yuenan",
            "attackerLegionName": "越-桀骏军",
            "attackerTroops": 50000,
            "defenderFactionId": "qin",
            "defenderLegionName": "秦军",
            "defenderTroops": 80000,
            "location": {
                "lat": 24.3401,
                "lng": 109.5776
            },
            "result": "attacker_win",
            "siegeAfterBattleChain": [
                {
                    "action": "destroy"
                }
            ]
        }
    },

    // ──────────────────────
    // 前215年 蒙恬北逐匈奴
    // ──────────────────────
    {
        "year": -215,
        "regnalYear": "秦始皇三十二年",
        "title": "秦匈奴河南地之战",
        "season": 0,
        "description": "秦将蒙恬统兵三十万，分出上郡、萧关，钳击河南地。秦师车骑并进，扫荡匈奴右翼。头曼单于败走北渡，秦军尽复河南地，列阵黄河南岸。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "legionName": "秦军",
            "attackerTroops": 20000,
            "attackerCityId": "city_fushi",
            "defenderCityId": "city_hequ",
            "result": "attacker_win"
        }
    },
    {
        "year": -215,
        "regnalYear": "秦始皇三十二年",
        "title": "秦匈奴九原之战",
        "season": 0,
        "description": "秦军趁胜强渡黄河，抢滩登陆，一举攻克九原。蒙恬背水筑垒，重修赵长城旧基，建立北伐大营，囤积粮草，伺机决战。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "legionName": "秦军",
            "attackerTroops": 20000,
            "attackerCityId": "city_hequ",
            "defenderCityId": "city_jiuyuan",
            "result": "attacker_win"
        }
    },

    // ──────────────────────
    // 前214年 蒙恬横扫阴山 / 平定南越
    // ──────────────────────
    {
        "year": -214,
        "regnalYear": "秦始皇三十三年",
        "title": "秦匈奴高阙之战",
        "season": 0,
        "description": "秦将蒙恬自九原出击，奔袭高阙险关，横扫阴山。匈奴主力溃败，头曼弃城远遁大漠，不敢南下。秦军全据阴山，因险制塞，修筑长城。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "legionName": "秦军",
            "attackerTroops": 20000,
            "attackerCityId": "city_jiuyuan",
            "defenderCityId": "city_gaoque",
            "result": "attacker_win",
            "afterBattleChain": [
                {
                    "action": "destroy"
                }
            ]
        }
    },

    // ──────────────────────
    // 前213年 秦平定岭南
    // ──────────────────────
    {
        "year": -213,
        "regnalYear": "秦始皇三十四年",
        "title": "秦越桂林之战",
        "season": 0,
        "description": "秦将任嚣依托南海据点，主力沿西江逆流而上，兵锋直指西瓯腹地，彻底清剿西瓯残部。越人纷纷纳土归降。秦师攻占布山，控制郁江流域，置桂林郡。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "legionName": "秦军",
            "attackerTroops": 20000,
            "attackerCityId": "city_panyu",
            "defenderCityId": "city_bushan",
            "result": "attacker_win"
        }
    },
    {
        "year": -213,
        "regnalYear": "秦始皇三十四年",
        "title": "秦越象郡之战",
        "season": 0,
        "description": "秦将赵佗统率偏师，自桂林南下，进击陆梁地。征伐骆越部族，深入烟瘴之地，平定北仑河及红河三角洲。秦军于边陲要冲临尘置象郡，岭南百越全境悉平。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "qin",
            "legionName": "秦军",
            "attackerTroops": 20000,
            "attackerCityId": "city_bushan",
            "defenderCityId": "city_linchen",
            "result": "attacker_win",
            "afterBattleChain": [
                {
                    "action": "destroy"
                }
            ]
        }
    },

    // ──────────────────────
    // 前209年 大泽乡起义 / 戏水之战 / 项梁起兵 / 刘邦起兵
    // ──────────────────────
    {
        "year": -209,
        "regnalYear": "秦二世元年",
        "title": "大泽乡起义",
        "season": 0,
        "description": "秦发闾左戍卒九百人赴渔陽，途经蕲县大泽乡，遇雨失期。屯长陈胜、吴广杀秦尉，起兵反秦，旋即攻陷蕲县，随后又破陈城，据陈称王，号张楚。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "tianchao",
            "defenderCityId": "city_chencheng",
            "result": "attacker_win",
            "legionName": "张楚-陈胜军",
            "attackerTroops": 20000,
            "attackerSourceLocation": {
                "lat": 33.51,
                "lng": 117.09
            }
        }
    },
    {
        "year": -209,
        "regnalYear": "秦二世元年",
        "title": "秦楚戏水之战",
        "season": 0,
        "description": "张楚军周文率主力西进灭秦。突破函谷关，兵锋直指咸阳，秦廷震恐。秦少府章邯临危受命，以骊山刑徒七十万编组迎敌。秦军于戏水大破周文军。",
        "type": "field_battle",
        "fieldBattleData": {
            "attackerFactionId": "qin",
            "attackerLegionName": "秦军",
            "attackerTroops": 170000,
            "defenderFactionId": "tianchao",
            "defenderLegionName": "张楚-周文军",
            "location": {
                "lat": 34.4661,
                "lng": 109.4156
            },
            "result": "attacker_win"
        }
    },
    {
        "year": -209,
        "regnalYear": "秦二世元年",
        "title": "楚秦会稽之战",
        "season": 0,
        "description": "项梁使侄项羽于府中斩杀会稽郡守殷通，收编下辖各县精兵，得八千江东子弟。项梁自任会稽郡守，以项羽为裨将，正式起兵渡江北上。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "tianchao",
            "defenderCityId": "city_gusu",
            "result": "attacker_win",
            "legionName": "楚-项梁军",
            "attackerSourceLocation": {
                "lat": 31.3384,
                "lng": 121.0391
            },
            "attackerTroops": 20000,
            "afterBattleChain": [
                {
                    "action": "move_to_city",
                    "targetCityId": "city_pengcheng"
                },
                {
                    "action": "garrison"
                }
            ]
        }
    },
    {
        "year": -209,
        "regnalYear": "秦二世元年",
        "title": "楚秦砀县之战",
        "season": 0,
        "description": "沛县刘邦率百余亡命之徒被推举为沛公，整军起兵。后转进留县与张良会合，复攻砀县，三日破城，收编砀兵六千人。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "tianchao",
            "defenderCityId": "city_dangshan",
            "result": "attacker_win",
            "legionName": "楚-刘邦军",
            "attackerSourceLocation": {
                "lat": 34.6809,
                "lng": 116.8066
            },
            "attackerTroops": 20000
        }
    },

    // ──────────────────────
    // 前208年 陈胜覆亡 / 定陶之战 / 巨鹿之战
    // ──────────────────────
    {
        "year": -208,
        "regnalYear": "秦二世二年",
        "title": "秦灭张楚之战",
        "season": 0,
        "description": "秦将章邯统率骊山囚徒出函谷关，大破楚军。腊月，张楚王陈胜败走下城父，为其御庄贾所杀，张楚政权覆亡。",
        "type": "field_battle",
        "fieldBattleData": {
            "attackerFactionId": "qin",
            "attackerLegionName": "秦军",
            "attackerTroops": 70000,
            "defenderFactionId": "tianchao",
            "defenderLegionName": "张楚-陈胜军",
            "defenderTroops": 20000,
            "location": {
                "lat": 34.8445,
                "lng": 113.3324
            },
            "result": "attacker_win",
            "afterBattle": "siege",
            "afterBattleTargetCityId": "city_chencheng",
            "siegeAfterBattleChain": [
                {
                    "action": "garrison"
                }
            ]
        }
    },
    {
        "year": -208,
        "regnalYear": "秦二世二年",
        "title": "秦魏临济之战",
        "season": 0,
        "description": "秦将章邯引兵北进，击败魏军于临济。魏王求救于齐楚，齐王田儋率兵来救。章邯乘夜突袭齐楚援军，大破之，杀齐王田儋及魏相周市。魏王咎自焚，魏国再亡。",
        "type": "field_battle",
        "fieldBattleData": {
            "attackerFactionId": "qin",
            "attackerLegionName": "秦军",
            "attackerTroops": 100000,
            "defenderFactionId": "panjun",
            "defenderLegionName": "魏-周市军",
            "defenderTroops": 50000,
            "location": {
                "lat": 37.1711,
                "lng": 117.8269
            },
            "result": "attacker_win"
        }
    },
    {
        "year": -208,
        "regnalYear": "秦二世二年",
        "title": "秦楚定陶之战",
        "season": 0,
        "description": "秦军章邯利用连月霪雨、楚军骄惰，夜袭定陶大营，楚军项梁战死。章邯遂引主力北渡黄河，大破赵军，赵王歇退保巨鹿。秦将王离统率长城军合围巨鹿，赵将陈余壁于巨鹿北不敢战。",
        "type": "field_battle",
        "fieldBattleData": {
            "attackerFactionId": "qin",
            "attackerLegionName": "秦军",
            "attackerTroops": 70000,
            "defenderFactionId": "tianchao",
            "defenderLegionName": "楚-项梁军",
            "defenderTroops": 50000,
            "location": {
                "lat": 35.07,
                "lng": 115.57
            },
            "result": "attacker_win",
            "afterBattle": "move_to_city",
            "afterBattleTargetCityId": "city_julu",
            "siegeAfterBattleChain": []
        }
    },
    {
        "year": -208,
        "regnalYear": "秦二世二年",
        "title": "楚秦巨鹿之战",
        "season": 0,
        "description": "楚怀王遣宋义、项羽北上救赵，刘邦西进击秦。项羽杀宋义，破釜沉舟，连破秦军九营，大败章邯，王离被俘。诸侯联军尽皆震服，项羽自立为西楚霸王。",
        "type": "field_battle",
        "fieldBattleData": {
            "attackerFactionId": "tianchao",
            "attackerLegionName": "楚-项羽军",
            "attackerTroops": 50000,
            "defenderFactionId": "qin",
            "defenderLegionName": "秦军",
            "defenderTroops": 200000,
            "location": {
                "lat": 37.21,
                "lng": 115.02
            },
            "result": "attacker_win",
            "afterBattle": "siege",
            "afterBattleTargetCityId": "city_julu",
            "siegeAfterBattleChain": []
        }
    },
    {
        "year": -207,
        "regnalYear": "秦二世三年",
        "title": "楚秦漳污之战",
        "season": 0,
        "description": "项羽率领诸侯联军在巨鹿大胜后，乘胜逼近秦军章邯部。章邯因受秦廷赵高猜忌，遣精锐出击又遭败绩，遂于漳水南岸的殷墟向项羽投降。秦最后的主力不复存在，二十余万降卒在新安被坑杀。",
        "type": "field_battle",
        "fieldBattleData": {
            "attackerFactionId": "tianchao",
            "attackerLegionName": "楚-项羽军",
            "attackerTroops": 100000,
            "defenderFactionId": "qin",
            "defenderLegionName": "秦军",
            "defenderTroops": 200000,
            "location": {
                "lat": 36.1,
                "lng": 114.3
            },
            "result": "attacker_win"
        }
    },
    {
        "year": -207,
        "regnalYear": "秦二世三年",
        "title": "汉秦宛城之战",
        "season": 0,
        "description": "刘邦率偏师西进试图入关，行至南阳时，秦守将吕齮固守宛城。刘邦采纳张良建议，连夜回师围宛，吕齮被迫投降，为刘邦西进扫清了南阳地区的障碍。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "zhonghua",
            "legionName": "汉-刘邦军",
            "attackerTroops": 20000,
            "defenderCityId": "city_wancheng",
            "result": "attacker_win"
        }
    },
    {
        "year": -207,
        "regnalYear": "秦二世三年",
        "title": "汉秦武关之战",
        "season": 0,
        "description": "刘邦军自南阳西进，逼近秦国门户武关。此为入关重地，守军戒备。刘邦通过张良之谋，设疑兵并利诱秦将，随后乘秦军懈怠之际发动奇袭，一举攻破武关，打开了通往咸阳的大门。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "zhonghua",
            "legionName": "汉-刘邦军",
            "attackerTroops": 30000,
            "defenderCityId": "city_wuguan",
            "result": "attacker_win"
        }
    },

    {
        "year": -207,
        "regnalYear": "秦二世三年",
        "title": "汉秦蓝田之战",
        "season": 0,
        "description": "赵高逼杀秦二世胡亥，拥立子婴，子婴旋即设计刺杀赵高夷其三族。子婴清除了权臣后，派兵拒守峣关。刘邦绕过峣关，翻越蒉山，与秦军在蓝田展开大战。秦军因内乱和对王朝的失望而斗志涣散，被刘邦军彻底击溃，关中再无抵抗力量。次年初（前206年），刘邦军逼近霸上，秦王子婴捧国玺向刘邦投降，大秦帝国灭亡。此后项羽破函谷关进驻鸿门，不满刘邦先入关中，于鸿门宴上几欲击杀刘邦未果，楚汉相争序幕拉开。",
        "type": "field_battle",
        "fieldBattleData": {
            "attackerFactionId": "zhonghua",
            "attackerLegionName": "汉-刘邦军",
            "attackerTroops": 50000,
            "defenderFactionId": "qin",
            "defenderLegionName": "秦军",
            "defenderTroops": 40000,
            "location": {
                "lat": 34.15,
                "lng": 109.32
            },
            "result": "attacker_win"
        }
    }
];
