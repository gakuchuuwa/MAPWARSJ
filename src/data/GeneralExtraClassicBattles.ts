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
            "enemyGeneralId": "bfe_cb_midi_1",
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
            "enemyGeneralId": "bfe_cb_ldiya_1",
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
    "bfe2_pang_juan": [
        {
            "generalId": "bfe2_pang_juan",
            "battleId": "bfe2_pang_juan@-353",
            "battleName": "桂陵之战",
            "battleYear": -353,
            "battleType": "field",
            "role": "attacker",
            "targetName": "桂陵",
            "targetLat": 35.29,
            "targetLng": 115.07,
            "myTroops": 15000,
            "enemyFactionId": "qi",
            "enemyFactionName": "齐国",
            "enemyGeneralId": "qi_tianji",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "孤方攻克邯郸，齐将田忌竟敢乘虚袭我大梁，吾必回师踏平齐营，壮士可愿同返？"
                },
                {
                    "speaker": "player",
                    "text": "愿随将军回师破齐！"
                }
            ]
        }
    ],
    "bfe3_13": [
        {
            "generalId": "bfe3_13",
            "battleId": "bfe3_13@-224",
            "battleName": "蕲南之战",
            "battleYear": -224,
            "battleType": "field",
            "role": "attacker",
            "targetName": "蕲县蕲南",
            "targetLat": 33.62,
            "targetLng": 117.02,
            "myTroops": 15000,
            "enemyFactionId": "qin",
            "enemyFactionName": "秦国",
            "enemyGeneralId": "ruo_wangjian",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "王翦老谋深算坚壁逾岁以老我师，孤当移营东就决一死战，壮士可愿护楚祚到底？"
                },
                {
                    "speaker": "player",
                    "text": "誓随上柱国血战护楚！"
                }
            ]
        }
    ],
    "bfe3_9": [
        {
            "generalId": "bfe3_9",
            "battleId": "bfe3_9@-257",
            "battleName": "邯郸之战",
            "battleYear": -257,
            "battleType": "field",
            "role": "attacker",
            "targetName": "邯郸城下",
            "targetLat": 36.61,
            "targetLng": 114.49,
            "myTroops": 15000,
            "enemyFactionId": "wei",
            "enemyFactionName": "魏国",
            "enemyGeneralId": "shang_weiwuji",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "邯郸孤城困守已久，今魏无忌夺晋鄙兵符北来犯营，壮士可愿随我迎击魏楚援师？"
                },
                {
                    "speaker": "player",
                    "text": "愿随将军迎战联军！"
                }
            ]
        }
    ],
    "bfe_antigonus": [
        {
            "generalId": "bfe_antigonus",
            "battleId": "bfe_antigonus@-317",
            "battleName": "帕莱塔西奈之战",
            "battleYear": -317,
            "battleType": "field",
            "role": "attacker",
            "targetName": "帕莱塔西奈",
            "targetLat": 32.85,
            "targetLng": 51.55,
            "myTroops": 15000,
            "enemyFactionId": "maqidun",
            "enemyFactionName": "马其顿",
            "enemyGeneralId": "bfe_cb_maqidun_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "欧墨涅斯挟王室旧部与东方诸总督据险相抗，某当以奇骑挽局，壮士可愿同驰高原？"
                },
                {
                    "speaker": "player",
                    "text": "愿随统帅决战高原！"
                }
            ]
        },
        {
            "generalId": "bfe_antigonus",
            "battleId": "bfe_antigonus@-316",
            "battleName": "加比埃奈之战",
            "battleYear": -316,
            "battleType": "field",
            "role": "attacker",
            "targetName": "加比埃奈",
            "targetLat": 32.65,
            "targetLng": 52.1,
            "myTroops": 15000,
            "enemyFactionId": "maqidun",
            "enemyFactionName": "马其顿",
            "enemyGeneralId": "bfe_cb_maqidun_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "盐漠尘起蔽天，某欲趁烟尘遣铁骑奇夺银盾老营辎重，壮士可愿随骑突袭？"
                },
                {
                    "speaker": "player",
                    "text": "愿随大帅奇袭敌营！"
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
    "dongxian_sunbin": [
        {
            "generalId": "dongxian_sunbin",
            "battleId": "dongxian_sunbin@-353",
            "battleName": "桂陵之战",
            "battleYear": -353,
            "battleType": "field",
            "role": "attacker",
            "targetName": "桂陵",
            "targetLat": 35.29,
            "targetLng": 115.07,
            "myTroops": 15000,
            "enemyFactionId": "wei",
            "enemyFactionName": "魏国",
            "enemyGeneralId": "bfe2_pang_juan",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "庞涓倾锐围赵而魏都空虚，某献批亢捣虚之策于桂陵待之，壮士可愿同设此局？"
                },
                {
                    "speaker": "player",
                    "text": "愿听军师妙算破魏！"
                }
            ]
        }
    ],
    "gen_alexander_great": [
        {
            "generalId": "gen_alexander_great",
            "battleId": "gen_alexander_great@-333",
            "battleName": "伊苏斯之战",
            "battleYear": -333,
            "battleType": "field",
            "role": "attacker",
            "targetName": "伊苏斯",
            "targetLat": 36.84,
            "targetLng": 36.16,
            "myTroops": 15000,
            "enemyFactionId": "aqimeinide",
            "enemyFactionName": "阿契美尼德",
            "enemyGeneralId": "daliushi_iii",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "大流士三世断我后路陈兵伊苏斯狭岸，天赐良机，壮士敢随孤直取其麾盖否？"
                },
                {
                    "speaker": "player",
                    "text": "愿随陛下直捣黄龙！"
                }
            ]
        },
        {
            "generalId": "gen_alexander_great",
            "battleId": "gen_alexander_great@-331",
            "battleName": "高加米拉之战",
            "battleYear": -331,
            "battleType": "field",
            "role": "attacker",
            "targetName": "高加米拉",
            "targetLat": 36.36,
            "targetLng": 43.25,
            "myTroops": 15000,
            "enemyFactionId": "aqimeinide",
            "enemyFactionName": "阿契美尼德",
            "enemyGeneralId": "daliushi_iii",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "大流士三世尽集东方铁骑镰刀车于高加米拉旷野，孤不屑夜袭窃胜，壮士愿白昼决死否？"
                },
                {
                    "speaker": "player",
                    "text": "愿随陛下决胜旷野！"
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
            "enemyFactionId": "kaliya",
            "enemyFactionName": "卡里亚",
            "enemyGeneralId": "bfe_cb_kaliya_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "摩索拉斯唆使基奥斯诸邦叛盟，某当驾舰直入敌港挫其逆焰，壮士可愿同舟死战？"
                },
                {
                    "speaker": "player",
                    "text": "愿与将军同舟共济！"
                }
            ]
        }
    ],
    "gen_epaminondas": [
        {
            "generalId": "gen_epaminondas",
            "battleId": "gen_epaminondas@-362",
            "battleName": "曼丁尼亚之战",
            "battleYear": -362,
            "battleType": "field",
            "role": "attacker",
            "targetName": "曼丁尼亚",
            "targetLat": 37.62,
            "targetLng": 22.39,
            "myTroops": 15000,
            "enemyFactionId": "lagoniya",
            "enemyFactionName": "斯巴达",
            "enemyGeneralId": "bfe_cb_lagoniya_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "斯巴达联雅典诸邦阻我于曼丁尼亚，某再布斜阵一举破之，壮士可愿随左翼先登？"
                },
                {
                    "speaker": "player",
                    "text": "愿随统帅直捣敌阵！"
                }
            ]
        }
    ],
    "gen_hamilcar": [
        {
            "generalId": "gen_hamilcar",
            "battleId": "gen_hamilcar@-240",
            "battleName": "巴格拉达斯河之战",
            "battleYear": -240,
            "battleType": "field",
            "role": "attacker",
            "targetName": "巴格拉达斯河",
            "targetLat": 37.02,
            "targetLng": 10.07,
            "myTroops": 15000,
            "enemyFactionId": "libiya",
            "enemyFactionName": "利比亚",
            "enemyGeneralId": "bfe_cb_libiya_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "叛首斯彭迪乌斯锁死河桥困我孤城，今夜东风退潮沙洲可涉，壮士敢随我踏浪奇出否？"
                },
                {
                    "speaker": "player",
                    "text": "愿随统帅踏浪破贼！"
                }
            ]
        }
    ],
    "gen_li_xin": [
        {
            "generalId": "gen_li_xin",
            "battleId": "gen_li_xin@-226",
            "battleName": "衍水之战",
            "battleYear": -226,
            "battleType": "field",
            "role": "attacker",
            "targetName": "衍水",
            "targetLat": 41.27,
            "targetLng": 123.17,
            "myTroops": 15000,
            "enemyFactionId": "yan",
            "enemyFactionName": "燕国",
            "enemyGeneralId": "bfe_cb_yan_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "燕太子丹败逃辽东衍水苟延残喘，某率轻骑追歼其师以绝祸根，壮士可愿快马同行？"
                },
                {
                    "speaker": "player",
                    "text": "愿随将军追奔辽东！"
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
            "enemyGeneralId": "bfe_cb_xila_1",
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
    "gen_parmenion": [
        {
            "generalId": "gen_parmenion",
            "battleId": "gen_parmenion@-333",
            "battleName": "伊苏斯之战",
            "battleYear": -333,
            "battleType": "field",
            "role": "attacker",
            "targetName": "伊苏斯",
            "targetLat": 36.84,
            "targetLng": 36.16,
            "myTroops": 15000,
            "enemyFactionId": "aqimeinide",
            "enemyFactionName": "阿契美尼德",
            "enemyGeneralId": "daliushi_iii",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "大流士三世重骑尽压海滨，老夫奉命死扼左翼不失寸土，壮士可愿同守滨海防线？"
                },
                {
                    "speaker": "player",
                    "text": "愿随老帅死守铁砧！"
                }
            ]
        },
        {
            "generalId": "gen_parmenion",
            "battleId": "gen_parmenion@-331",
            "battleName": "高加米拉之战",
            "battleYear": -331,
            "battleType": "field",
            "role": "attacker",
            "targetName": "高加米拉",
            "targetLat": 36.36,
            "targetLng": 43.25,
            "myTroops": 15000,
            "enemyFactionId": "aqimeinide",
            "enemyFactionName": "阿契美尼德",
            "enemyGeneralId": "daliushi_iii",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "旷野无险可依，老夫统左翼独当波斯重骑狂潮，壮士可愿与我并肩血战到底？"
                },
                {
                    "speaker": "player",
                    "text": "誓随老帅血战不退！"
                }
            ]
        }
    ],
    "gen_philip_ii": [
        {
            "generalId": "gen_philip_ii",
            "battleId": "gen_philip_ii@-352",
            "battleName": "番红花原之战",
            "battleYear": -352,
            "battleType": "field",
            "role": "attacker",
            "targetName": "番红花原",
            "targetLat": 39.19,
            "targetLng": 22.75,
            "myTroops": 15000,
            "enemyFactionId": "phokis",
            "enemyFactionName": "福基斯",
            "enemyGeneralId": "phokis_aonuomakusi",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "福基斯统帅奥诺马尔库斯盗圣地金银募兵渎神，孤戴月桂南讨，壮士可愿同诛渎神之徒？"
                },
                {
                    "speaker": "player",
                    "text": "愿随大王荡平叛军！"
                }
            ]
        }
    ],
    "gen_seleucus_i": [
        {
            "generalId": "gen_seleucus_i",
            "battleId": "gen_seleucus_i@-309",
            "battleName": "巴比伦之战",
            "battleYear": -309,
            "battleType": "field",
            "role": "attacker",
            "targetName": "巴比伦郊野",
            "targetLat": 32.54,
            "targetLng": 44.42,
            "myTroops": 15000,
            "enemyFactionId": "antigonid",
            "enemyFactionName": "安提柯",
            "enemyGeneralId": "bfe_antigonus",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "安提柯一世倾师来夺巴比伦，孤拟拂晓乘敌未起奇袭其营，壮士可愿披甲夜出？"
                },
                {
                    "speaker": "player",
                    "text": "愿随大王拂晓破敌！"
                }
            ]
        },
        {
            "generalId": "gen_seleucus_i",
            "battleId": "gen_seleucus_i@-281",
            "battleName": "库鲁佩迪安之战",
            "battleYear": -281,
            "battleType": "field",
            "role": "attacker",
            "targetName": "库鲁佩迪安",
            "targetLat": 38.6,
            "targetLng": 27.6,
            "myTroops": 15000,
            "enemyFactionId": "seleisi",
            "enemyFactionName": "色雷斯",
            "enemyGeneralId": "bfe_cb_seleisi_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "利西马科斯杀子乱政、人心瓦解，老夫渡河西讨，当与这位故友作最后了断，壮士同往否？"
                },
                {
                    "speaker": "player",
                    "text": "愿随陛下席卷小亚！"
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
            "battleMonth": 9,
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
            "enemyGeneralId": "bfe_cb_aiji_1",
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
            "enemyGeneralId": "bfe_cb_qin_1",
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
    "kongque_zhantuoluo": [
        {
            "generalId": "kongque_zhantuoluo",
            "battleId": "kongque_zhantuoluo@-305",
            "battleName": "印度河之战",
            "battleYear": -305,
            "battleType": "field",
            "role": "attacker",
            "targetName": "印度河畔",
            "targetLat": 31.6,
            "targetLng": 71.05,
            "myTroops": 15000,
            "enemyFactionId": "sailiugu",
            "enemyFactionName": "塞琉古帝国",
            "enemyGeneralId": "gen_seleucus_i",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "塞琉古挟西方余威东渡印度河欲复旧疆，朕统孔雀象阵迎击，壮士可愿共卫山河？"
                },
                {
                    "speaker": "player",
                    "text": "愿随陛下击退西师！"
                }
            ]
        }
    ],
    "maqidun_craterus": [
        {
            "generalId": "maqidun_craterus",
            "battleId": "maqidun_craterus@-326",
            "battleName": "海达斯佩斯河之战",
            "battleYear": -326,
            "battleType": "field",
            "role": "attacker",
            "targetName": "海达斯佩斯河",
            "targetLat": 32.65,
            "targetLng": 73.51,
            "myTroops": 15000,
            "enemyFactionId": "bulu",
            "enemyFactionName": "波罗婆",
            "enemyGeneralId": "gen_bolusi",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "印度王波鲁斯列巨象锁死河岸，某坐镇本营吸引其主力，壮士可愿随我强渡合击？"
                },
                {
                    "speaker": "player",
                    "text": "愿随将军强渡破象！"
                }
            ]
        }
    ],
    "qi_tianji": [
        {
            "generalId": "qi_tianji",
            "battleId": "qi_tianji@-353",
            "battleName": "桂陵之战",
            "battleYear": -353,
            "battleType": "field",
            "role": "attacker",
            "targetName": "桂陵",
            "targetLat": 35.29,
            "targetLng": 115.07,
            "myTroops": 15000,
            "enemyFactionId": "wei",
            "enemyFactionName": "魏国",
            "enemyGeneralId": "bfe2_pang_juan",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "魏帅庞涓久攻赵都疲敝南归，某已陈师桂陵以逸待劳，壮士可愿同擒敌酋？"
                },
                {
                    "speaker": "player",
                    "text": "愿随将军生擒庞涓！"
                }
            ]
        }
    ],
    "qin_hengyi": [
        {
            "generalId": "qin_hengyi",
            "battleId": "qin_hengyi@-234",
            "battleName": "平阳之战",
            "battleYear": -234,
            "battleType": "field",
            "role": "attacker",
            "targetName": "平阳",
            "targetLat": 36.28,
            "targetLng": 114.37,
            "myTroops": 15000,
            "enemyFactionId": "zhao",
            "enemyFactionName": "赵国",
            "enemyGeneralId": "bfe_cb_zhao_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "赵国老将已去，新帅扈辄不知兵而妄出平阳救应，某当一鼓歼之，壮士可愿同斩敌帅？"
                },
                {
                    "speaker": "player",
                    "text": "愿随将军阵斩敌帅！"
                }
            ]
        }
    ],
    "qin_simacuo": [
        {
            "generalId": "qin_simacuo",
            "battleId": "qin_simacuo@-280",
            "battleName": "黔中之战",
            "battleYear": -280,
            "battleType": "field",
            "role": "attacker",
            "targetName": "黔中",
            "targetLat": 28.9,
            "targetLng": 110.4,
            "myTroops": 15000,
            "enemyFactionId": "chuguo",
            "enemyFactionName": "楚国",
            "enemyGeneralId": "bfe_cb_chuguo_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "昔年灭蜀正为今日顺流伐楚，某奉诏自巴蜀奇袭黔中，壮士可愿登舟东下？"
                },
                {
                    "speaker": "player",
                    "text": "愿随老将军顺流破楚！"
                }
            ]
        }
    ],
    "shang_weiwuji": [
        {
            "generalId": "shang_weiwuji",
            "battleId": "shang_weiwuji@-247",
            "battleName": "河外之战",
            "battleYear": -247,
            "battleType": "field",
            "role": "attacker",
            "targetName": "河外",
            "targetLat": 34.65,
            "targetLng": 110.95,
            "myTroops": 15000,
            "enemyFactionId": "qin",
            "enemyFactionName": "秦国",
            "enemyGeneralId": "bfe_cb_qin_2",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "秦帅蒙骜连拔三晋重城，某今统五国合纵之师西击强秦，壮士可愿同叩函谷雄关？"
                },
                {
                    "speaker": "player",
                    "text": "愿随信陵君追奔函谷！"
                }
            ]
        }
    ],
    "tuolemi_tuolemi": [
        {
            "generalId": "tuolemi_tuolemi",
            "battleId": "tuolemi_tuolemi@-312",
            "battleName": "加沙之战",
            "battleYear": -312,
            "battleType": "field",
            "role": "attacker",
            "targetName": "加沙",
            "targetLat": 31.5,
            "targetLng": 34.47,
            "myTroops": 15000,
            "enemyFactionId": "antigonid",
            "enemyFactionName": "安提柯",
            "enemyGeneralId": "bfe_cb_antigonid_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "安提柯留少子德米特里一世屯兵加沙，孤与盟友设钉阵破其战象，壮士可愿同出西奈？"
                },
                {
                    "speaker": "player",
                    "text": "愿随埃及之主破敌！"
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
            "enemyGeneralId": "bfe_cb_qi_1",
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
    "wuzhou_limu": [
        {
            "generalId": "wuzhou_limu",
            "battleId": "wuzhou_limu@-244",
            "battleName": "雁门之战",
            "battleYear": -244,
            "battleType": "field",
            "role": "attacker",
            "targetName": "雁门",
            "targetLat": 39.19,
            "targetLng": 112.87,
            "myTroops": 15000,
            "enemyFactionId": "xiongnu",
            "enemyFactionName": "匈奴",
            "enemyGeneralId": "bfe_touman",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "将士蓄锐数载皆思一战，今单于头曼倾巢入套，吾张左右翼尽歼之，壮士可愿同驰塞外？"
                },
                {
                    "speaker": "player",
                    "text": "愿随将军荡平胡骑！"
                }
            ]
        },
        {
            "generalId": "wuzhou_limu",
            "battleId": "wuzhou_limu@-232",
            "battleName": "番吾之战",
            "battleYear": -232,
            "battleType": "field",
            "role": "attacker",
            "targetName": "番吾",
            "targetLat": 38.22,
            "targetLng": 114.35,
            "myTroops": 15000,
            "enemyFactionId": "qin",
            "enemyFactionName": "秦国",
            "enemyGeneralId": "ruo_wangjian",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "秦师南北并进欲钳击邯郸，某弃南就北先破番吾王翦一路，壮士可愿随我北迎强秦？"
                },
                {
                    "speaker": "player",
                    "text": "愿随武安君再挫秦锋！"
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
    "xin_baiqi": [
        {
            "generalId": "xin_baiqi",
            "battleId": "xin_baiqi@-293",
            "battleName": "伊阙之战",
            "battleYear": -293,
            "battleType": "field",
            "role": "attacker",
            "targetName": "伊阙",
            "targetLat": 34.55,
            "targetLng": 112.47,
            "myTroops": 15000,
            "enemyFactionId": "wei",
            "enemyFactionName": "魏国",
            "enemyGeneralId": "bfe_cb_wei_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "韩魏联军屯于伊阙互存观望，某欲设疑牵韩而先碎公孙喜魏阵，壮士可愿同往？"
                },
                {
                    "speaker": "player",
                    "text": "愿随将军击破联军！"
                }
            ]
        },
        {
            "generalId": "xin_baiqi",
            "battleId": "xin_baiqi@-278",
            "battleName": "鄢郢之战",
            "battleYear": -278,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "郢都",
            "targetCityId": "city_ying",
            "targetLat": 30.35,
            "targetLng": 112.18,
            "myTroops": 15000,
            "enemyFactionId": "chuguo",
            "enemyFactionName": "楚国",
            "enemyGeneralId": "bfe_cb_chuguo_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "孤军入楚贵在破釜沉舟，某已水灌鄢城，今直指楚王老巢郢都，壮士可愿同拔王城？"
                },
                {
                    "speaker": "player",
                    "text": "愿随大良造踏平郢都！"
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
            "enemyGeneralId": "bfe_cb_yalan_1",
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
            "enemyGeneralId": "bfe_cb_jialedi_1",
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
    "yipilusi_piluoshi": [
        {
            "generalId": "yipilusi_piluoshi",
            "battleId": "yipilusi_piluoshi@-279",
            "battleName": "阿斯库路姆之战",
            "battleYear": -279,
            "battleType": "field",
            "role": "attacker",
            "targetName": "阿斯库路姆",
            "targetLat": 41.21,
            "targetLng": 15.56,
            "myTroops": 15000,
            "enemyFactionId": "luoma_diguo",
            "enemyFactionName": "罗马帝国",
            "enemyGeneralId": "bfe_cb_luoma_diguo_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "罗马执政官德西乌斯造抗象战车复来寻战，孤当引出平地破之，壮士可愿再挫强敌？"
                },
                {
                    "speaker": "player",
                    "text": "愿随大王再破罗马！"
                }
            ]
        },
        {
            "generalId": "yipilusi_piluoshi",
            "battleId": "yipilusi_piluoshi@-275",
            "battleName": "贝内文图姆之战",
            "battleYear": -275,
            "battleType": "field",
            "role": "attacker",
            "targetName": "贝内文图姆",
            "targetLat": 41.13,
            "targetLng": 14.78,
            "myTroops": 15000,
            "enemyFactionId": "luoma_diguo",
            "enemyFactionName": "罗马帝国",
            "enemyGeneralId": "bfe_cb_luoma_diguo_2",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "罗马两军尚未合流，孤乘夜翻山奇袭登塔图斯高营以求速决，壮士可愿随我夜行？"
                },
                {
                    "speaker": "player",
                    "text": "愿随大王乘夜出奇！"
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
            "enemyGeneralId": "bfe_cb_wu_1",
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
    "zhao_lianpo": [
        {
            "generalId": "zhao_lianpo",
            "battleId": "zhao_lianpo@-260",
            "battleName": "长平之战",
            "battleYear": -260,
            "battleType": "field",
            "role": "attacker",
            "targetName": "长平",
            "targetLat": 35.8,
            "targetLng": 112.92,
            "myTroops": 15000,
            "enemyFactionId": "qin",
            "enemyFactionName": "秦国",
            "enemyGeneralId": "bfe3_9",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "秦将王龁锋芒正炽进逼长平，老夫决意深沟高垒挫其锐气，壮士可愿同守石长城？"
                },
                {
                    "speaker": "player",
                    "text": "愿随老将军坚守挫秦！"
                }
            ]
        }
    ],
};
