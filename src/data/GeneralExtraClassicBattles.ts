/**
 * GeneralExtraClassicBattles.ts —— 名将的第二、第三场经典战
 *
 * 🔴 [2026-11-11 主人定「一个名将多场经典战，按年份触发；只要经典战役」]
 *   · 第一场仍在 `GeneralFirstBattles.ts`（键＝generalId）；这里只放**补选**的后几场，每位最多再加两场。
 *   · 只收史上有名的大战，不收小规模冲突。
 *   · 每场必须写 `battleId`（全局唯一，惯例 `<generalId>@<年份>`），播报表、完成记录都按它认。
 *   · 由 `tools/classic-briefings/import-extra.mts` 从云盘「经典战补选表」导入生成，不要手改。
 */
import type { GeneralFirstBattle } from './GeneralFirstBattles';

export const GENERAL_EXTRA_CLASSIC_BATTLES: Readonly<Record<string, readonly GeneralFirstBattle[]>> = {
    "ailan_julushi": [
        {
            "generalId": "ailan_julushi",
            "battleId": "ailan_julushi@-550",
            "battleName": "帕萨尔加德之战",
            "battleYear": -550,
            "battleType": "field",
            "role": "attacker",
            "targetName": "帕萨尔加德",
            "targetLat": 30.19,
            "targetLng": 53.17,
            "myTroops": 15000,
            "enemyFactionId": "midi",
            "enemyFactionName": "米底",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "米底王阿斯提阿格斯亲统大军压境，波斯儿郎退无可退，壮士可愿随我决死反击？"
                },
                {
                    "speaker": "player",
                    "text": "愿随大王开创霸业！"
                }
            ]
        },
        {
            "generalId": "ailan_julushi",
            "battleId": "ailan_julushi@-547",
            "battleName": "提姆布拉之战",
            "battleYear": -547,
            "battleType": "field",
            "role": "attacker",
            "targetName": "提姆布拉",
            "targetLat": 38.48,
            "targetLng": 28.04,
            "myTroops": 15000,
            "enemyFactionId": "ldiya",
            "enemyFactionName": "吕底亚",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "吕底亚王克罗伊索斯自恃铁骑甲于西方，孤将以奇阵破之，壮士可愿随阵冲锋？"
                },
                {
                    "speaker": "player",
                    "text": "愿随大王踏平撒狄！"
                }
            ]
        }
    ],
    "bfe2_esarhaddon": [
        {
            "generalId": "bfe2_esarhaddon",
            "battleId": "bfe2_esarhaddon@-673",
            "battleName": "佩鲁西姆之战",
            "battleYear": -673,
            "battleType": "field",
            "role": "attacker",
            "targetName": "佩鲁西姆",
            "targetLat": 31.04,
            "targetLng": 32.55,
            "myTroops": 15000,
            "enemyFactionId": "aiji",
            "enemyFactionName": "埃及",
            "enemyGeneralId": "dibisi_tahaerka",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "埃及法老塔哈尔卡屡诱西疆诸邦叛我，朕决意穿越沙碛直取佩鲁西姆，壮士敢同行否？"
                },
                {
                    "speaker": "player",
                    "text": "愿随陛下远征尼罗！"
                }
            ]
        }
    ],
    "dibisi_tahaerka": [
        {
            "generalId": "dibisi_tahaerka",
            "battleId": "dibisi_tahaerka@-671",
            "battleName": "孟菲斯之战",
            "battleYear": -671,
            "battleType": "siege",
            "role": "defender",
            "targetName": "孟菲斯",
            "targetCityId": "city_mengfeisi",
            "targetLat": 29.85,
            "targetLng": 31.25,
            "myTroops": 15000,
            "enemyFactionId": "yashu",
            "enemyFactionName": "亚述",
            "enemyGeneralId": "bfe2_esarhaddon",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "亚述王以撒哈顿卷土重来，兵锋已逼孟菲斯白墙之下，壮士可愿助孤死守国都？"
                },
                {
                    "speaker": "player",
                    "text": "誓与法老共守白墙！"
                }
            ]
        }
    ],
    "gen_chabrias": [
        {
            "generalId": "gen_chabrias",
            "battleId": "gen_chabrias@-357",
            "battleName": "基奥斯之战",
            "battleYear": -357,
            "battleType": "field",
            "role": "attacker",
            "targetName": "基奥斯港",
            "targetLat": 38.37,
            "targetLng": 26.14,
            "myTroops": 15000,
            "enemyFactionId": "aiaoniya",
            "enemyFactionName": "基奥斯",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "基奥斯诸邦背弃海上盟约，某当驾舰直入敌港挫其逆焰，壮士可愿同舟死战？"
                },
                {
                    "speaker": "player",
                    "text": "愿与将军同舟共济！"
                }
            ]
        }
    ],
    "gen_lysander": [
        {
            "generalId": "gen_lysander",
            "battleId": "gen_lysander@-406",
            "battleName": "诺提姆之战",
            "battleYear": -406,
            "battleType": "field",
            "role": "attacker",
            "targetName": "诺提姆海角",
            "targetLat": 37.99,
            "targetLng": 26.85,
            "myTroops": 15000,
            "enemyFactionId": "xila",
            "enemyFactionName": "雅典",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "雅典主帅远出，副手安提奥库斯骄狂无谋，某欲诱而歼之，壮士可愿随舰出击？"
                },
                {
                    "speaker": "player",
                    "text": "愿随统帅海上破敌！"
                }
            ]
        },
        {
            "generalId": "gen_lysander",
            "battleId": "gen_lysander@-395",
            "battleName": "哈利亚托斯之战",
            "battleYear": -395,
            "battleType": "field",
            "role": "attacker",
            "targetName": "哈利亚托斯",
            "targetLat": 38.38,
            "targetLng": 23.09,
            "myTroops": 15000,
            "enemyFactionId": "boootiya",
            "enemyFactionName": "底比斯",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "底比斯背盟挑衅，某已先率北路友军抵近哈利亚托斯，壮士可愿随我先拔头筹？"
                },
                {
                    "speaker": "player",
                    "text": "愿随将军冲锋陷阵！"
                }
            ]
        }
    ],
    "gen_themistocles": [
        {
            "generalId": "gen_themistocles",
            "battleId": "gen_themistocles@-480",
            "battleName": "萨拉米斯之战",
            "battleYear": -480,
            "battleType": "field",
            "role": "attacker",
            "targetName": "萨拉米斯海峡",
            "targetLat": 37.95,
            "targetLng": 23.57,
            "myTroops": 15000,
            "enemyFactionId": "aqimeinide",
            "enemyFactionName": "阿契美尼德",
            "enemyGeneralId": "bfe2_xerxes_i",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "波斯舰群势大，唯诱入萨拉米斯狭道方能一举破之，壮士可愿登舰共挽狂澜？"
                },
                {
                    "speaker": "player",
                    "text": "愿随将军决战海峡！"
                }
            ]
        }
    ],
    "jialedi_nibujianisa": [
        {
            "generalId": "jialedi_nibujianisa",
            "battleId": "jialedi_nibujianisa@-605",
            "battleName": "卡基米什之战",
            "battleYear": -605,
            "battleType": "field",
            "role": "attacker",
            "targetName": "卡基米什",
            "targetLat": 36.83,
            "targetLng": 38.02,
            "myTroops": 15000,
            "enemyFactionId": "aiji",
            "enemyFactionName": "埃及",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "埃及法老尼科二世盘踞卡基米什扼我西路，孤当强渡大河破之，壮士可愿同渡？"
                },
                {
                    "speaker": "player",
                    "text": "愿随王储踏破敌营！"
                }
            ]
        }
    ],
    "jin_xianzhen": [
        {
            "generalId": "jin_xianzhen",
            "battleId": "jin_xianzhen@-627",
            "battleName": "殽之战",
            "battleYear": -627,
            "battleType": "field",
            "role": "attacker",
            "targetName": "殽山",
            "targetLat": 34.72,
            "targetLng": 111.3,
            "myTroops": 15000,
            "enemyFactionId": "qin",
            "enemyFactionName": "秦国",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "秦师远道袭郑无功而返，必经殽山险隘，吾欲设伏歼之，壮士可愿同往？"
                },
                {
                    "speaker": "player",
                    "text": "愿随元帅伏击秦师！"
                }
            ]
        }
    ],
    "wu_fuchai": [
        {
            "generalId": "wu_fuchai",
            "battleId": "wu_fuchai@-484",
            "battleName": "艾陵之战",
            "battleYear": -484,
            "battleType": "field",
            "role": "attacker",
            "targetName": "艾陵",
            "targetLat": 36.22,
            "targetLng": 117.75,
            "myTroops": 15000,
            "enemyFactionId": "qi",
            "enemyFactionName": "齐国",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "齐军骄横侵鲁，孤亲统吴师北渡江淮与之决战艾陵，壮士可愿同夺中原威名？"
                },
                {
                    "speaker": "player",
                    "text": "愿随吴王大破齐师！"
                }
            ]
        },
        {
            "generalId": "wu_fuchai",
            "battleId": "wu_fuchai@-473",
            "battleName": "姑苏之战",
            "battleYear": -473,
            "battleType": "siege",
            "role": "defender",
            "targetName": "姑苏",
            "targetCityId": "city_gusu",
            "targetLat": 31.3,
            "targetLng": 120.62,
            "myTroops": 15000,
            "enemyFactionId": "yue",
            "enemyFactionName": "越国",
            "enemyGeneralId": "yue_goujian",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "勾践忘恩负义合围姑苏，吴国危在旦夕，壮士可愿与孤背城死战、力挽狂澜？"
                },
                {
                    "speaker": "player",
                    "text": "誓与大王死守姑苏！"
                }
            ]
        }
    ],
    "xibolai_dawei": [
        {
            "generalId": "xibolai_dawei",
            "battleId": "xibolai_dawei@-995",
            "battleName": "利乏音谷之战",
            "battleYear": -995,
            "battleType": "field",
            "role": "attacker",
            "targetName": "利乏音谷",
            "targetLat": 31.76,
            "targetLng": 35.2,
            "myTroops": 15000,
            "enemyFactionId": "feilisidin",
            "enemyFactionName": "非利士",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "非利士联军陈兵利乏音谷欲断南北声气，孤当亲往迎击，壮士可愿同赴沙场？"
                },
                {
                    "speaker": "player",
                    "text": "愿随大王破敌！"
                }
            ]
        }
    ],
    "yashu_saergong": [
        {
            "generalId": "yashu_saergong",
            "battleId": "yashu_saergong@-720",
            "battleName": "卡尔卡尔之战",
            "battleYear": -720,
            "battleType": "field",
            "role": "attacker",
            "targetName": "卡尔卡尔",
            "targetLat": 35.74,
            "targetLng": 36.33,
            "myTroops": 15000,
            "enemyFactionId": "yalan",
            "enemyFactionName": "亚兰",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "哈马特僭主伊卢比迪煽动西方诸城背叛帝国，朕亲率王师西讨，壮士可愿随征？"
                },
                {
                    "speaker": "player",
                    "text": "愿为陛下前驱！"
                }
            ]
        },
        {
            "generalId": "yashu_saergong",
            "battleId": "yashu_saergong@-710",
            "battleName": "巴比伦之战",
            "battleYear": -710,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "巴比伦",
            "targetCityId": "city_babilun",
            "targetLat": 32.54,
            "targetLng": 44.42,
            "myTroops": 15000,
            "enemyFactionId": "jialedi",
            "enemyFactionName": "迦勒底",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "迦勒底首领米罗达巴拉旦窃据巴比伦十余载，朕今南下收复圣城，壮士可愿同行？"
                },
                {
                    "speaker": "player",
                    "text": "愿随陛下收复名都！"
                }
            ]
        }
    ],
    "yue_goujian": [
        {
            "generalId": "yue_goujian",
            "battleId": "yue_goujian@-496",
            "battleName": "槜李之战",
            "battleYear": -496,
            "battleType": "field",
            "role": "attacker",
            "targetName": "槜李",
            "targetLat": 30.72,
            "targetLng": 120.72,
            "myTroops": 15000,
            "enemyFactionId": "wu",
            "enemyFactionName": "吴国",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "吴王阖闾乘我新丧大举来犯，孤欲于槜李设奇破其严阵，壮士可愿助越迎敌？"
                },
                {
                    "speaker": "player",
                    "text": "愿助越王挫彼骄兵！"
                }
            ]
        },
        {
            "generalId": "yue_goujian",
            "battleId": "yue_goujian@-478",
            "battleName": "笠泽之战",
            "battleYear": -478,
            "battleType": "field",
            "role": "attacker",
            "targetName": "笠泽",
            "targetLat": 31.15,
            "targetLng": 120.65,
            "myTroops": 15000,
            "enemyFactionId": "wu",
            "enemyFactionName": "吴国",
            "enemyGeneralId": "wu_fuchai",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "吴国饥疲而夫差尽起余勇拒守笠泽，孤拟乘夜分翼惑敌渡江，壮士可愿同渡？"
                },
                {
                    "speaker": "player",
                    "text": "愿随越王夜渡破吴！"
                }
            ]
        }
    ],
};
