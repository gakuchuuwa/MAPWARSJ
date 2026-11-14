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
    "aba_shapuer": [
        {
            "generalId": "aba_shapuer",
            "battleId": "aba_shapuer@244",
            "battleName": "米西奇之战",
            "battleYear": 244,
            "battleType": "field",
            "role": "attacker",
            "targetName": "米西奇",
            "targetLat": 33.35,
            "targetLng": 43.78,
            "myTroops": 15000,
            "enemyFactionId": "luoma_diguo",
            "enemyFactionName": "罗马帝国",
            "enemyGeneralId": "bfe_cb_luoma_diguo_8",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "戈尔迪安三世敢循河叩我泰西封门户，吾必教其折戟米西奇原野。"
                },
                {
                    "speaker": "player",
                    "text": "罗马鹰旗已复卡莱，今日必入泰西封。"
                }
            ]
        }
    ],
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
            "enemyGeneralId": "midi_astyages",
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
            "enemyGeneralId": "ldiya_keluoyisi",
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
    "beidi_yaochang": [
        {
            "generalId": "beidi_yaochang",
            "battleId": "beidi_yaochang@389",
            "battleName": "大界之战",
            "battleYear": 389,
            "battleType": "field",
            "role": "attacker",
            "targetName": "新平",
            "targetLat": 35.03,
            "targetLng": 108.08,
            "myTroops": 15000,
            "enemyFactionId": "fushi",
            "enemyFactionName": "苻秦",
            "enemyGeneralId": "bfe_cb_fushi_4",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "苻登倾巢逼安定而大界辎重老营空虚，吾乘夜潜师奇袭必断其根本。"
                },
                {
                    "speaker": "player",
                    "text": "三军皆刻死休二字，定取弑君贼姚苌首级。"
                }
            ]
        }
    ],
    "bendou_d_mitelidati": [
        {
            "generalId": "bendou_d_mitelidati",
            "battleId": "bendou_d_mitelidati@-74",
            "battleName": "卡尔西顿之战",
            "battleYear": -74,
            "battleType": "field",
            "role": "attacker",
            "targetName": "卡尔西顿",
            "targetLat": 40.98,
            "targetLng": 29.03,
            "myTroops": 15000,
            "enemyFactionId": "luoma_gongheguo",
            "enemyFactionName": "罗马共和国",
            "enemyGeneralId": "bfe_cb_luoma_diguo_6",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "罗马执政官科塔退缩卡尔西顿港，孤水陆并进夺焚其舰，壮士可愿同攻？"
                },
                {
                    "speaker": "player",
                    "text": "愿随大王水陆破敌！"
                }
            ]
        },
        {
            "generalId": "bendou_d_mitelidati",
            "battleId": "bendou_d_mitelidati@-66",
            "battleName": "尼科波利斯之战",
            "battleYear": -66,
            "battleType": "field",
            "role": "attacker",
            "targetName": "尼科波利斯",
            "targetLat": 40.06,
            "targetLng": 38.25,
            "myTroops": 15000,
            "enemyFactionId": "luoma_gongheguo",
            "enemyFactionName": "罗马共和国",
            "enemyGeneralId": "qiliqiya_pangpei",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "罗马新帅庞培断我盟援紧追不舍，今夜暂宿利库斯深谷待渡大河，壮士可愿护孤杀出重围？"
                },
                {
                    "speaker": "player",
                    "text": "誓死护卫大王突围！"
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
            "enemyFactionName": "田齐",
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
    "bfe3_38": [
        {
            "generalId": "bfe3_38",
            "battleId": "bfe3_38@-97",
            "battleName": "余吾水之战",
            "battleYear": -97,
            "battleType": "field",
            "role": "attacker",
            "targetName": "余吾水",
            "targetLat": 46.8,
            "targetLng": 106.5,
            "myTroops": 15000,
            "enemyFactionId": "han_d",
            "enemyFactionName": "刘汉",
            "enemyGeneralId": "bfe3_36",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "汉将李广利倾师犯塞，孤徙家口于余吾水北，亲率铁骑南岸待之，壮士同战否？"
                },
                {
                    "speaker": "player",
                    "text": "愿随单于击退汉师！"
                }
            ]
        }
    ],
    "bfe3_79": [
        {
            "generalId": "bfe3_79",
            "battleId": "bfe3_79@272",
            "battleName": "埃梅萨之战",
            "battleYear": 272,
            "battleMonth": 6,
            "battleType": "field",
            "role": "attacker",
            "targetName": "埃梅萨",
            "targetLat": 34.73,
            "targetLng": 36.71,
            "myTroops": 15000,
            "enemyFactionId": "paermila",
            "enemyFactionName": "帕尔米拉",
            "enemyGeneralId": "paermila_zhinuobiya",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "帕尔米拉重骑酷暑易疲，吾以轻骑诱撤再挥步兵锤击，芝诺比娅必溃。"
                },
                {
                    "speaker": "player",
                    "text": "帕尔米拉重装铁骑冲锋，足踏碎罗马步阵。"
                }
            ]
        },
        {
            "generalId": "bfe3_79",
            "battleId": "bfe3_79@274",
            "battleName": "卡塔隆平原之战",
            "battleYear": 274,
            "battleType": "field",
            "role": "attacker",
            "targetName": "兰斯",
            "targetLat": 49.02,
            "targetLng": 4.35,
            "myTroops": 15000,
            "enemyFactionId": "gallic_empire",
            "enemyFactionName": "高卢帝国",
            "enemyGeneralId": "bfe_cb_gallic_empire_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "帕尔米拉既平，岂容高卢久裂，泰特里库斯一世归命必全性命。"
                },
                {
                    "speaker": "player",
                    "text": "高卢骄兵挟主难制，愿归命陛下求全。"
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
    "bfe_crassus": [
        {
            "generalId": "bfe_crassus",
            "battleId": "bfe_crassus@-71",
            "battleName": "西拉鲁斯河之战",
            "battleYear": -71,
            "battleType": "field",
            "role": "attacker",
            "targetName": "西拉鲁斯河",
            "targetLat": 40.48,
            "targetLng": 14.94,
            "myTroops": 15000,
            "enemyFactionId": "seleisi",
            "enemyFactionName": "色雷斯",
            "enemyGeneralId": "bfe_cb_seleisi_2",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "叛首斯巴达克斯北走卢卡尼亚，赶在庞培夺功前孤必一战荡平，壮士同往否？"
                },
                {
                    "speaker": "player",
                    "text": "愿随统帅荡平叛军！"
                }
            ]
        }
    ],
    "bfe_zhanghe": [
        {
            "generalId": "bfe_zhanghe",
            "battleId": "bfe_zhanghe@231",
            "battleName": "木门道之战",
            "battleYear": 231,
            "battleType": "field",
            "role": "attacker",
            "targetName": "木门道",
            "targetLat": 34.36,
            "targetLng": 105.51,
            "myTroops": 15000,
            "enemyFactionId": "shu",
            "enemyFactionName": "蜀汉",
            "enemyGeneralId": "huizhou_zhugeliang",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "兵法围城必阙，归军勿追，大都督既严令追蹑诸葛亮，郃纵知前谷有伏亦唯以身殉国。"
                },
                {
                    "speaker": "player",
                    "text": "木门林密谷深，强弩已为张隽义备妥。"
                }
            ]
        }
    ],
    "cai_lishuo": [
        {
            "generalId": "cai_lishuo",
            "battleId": "cai_lishuo@314",
            "battleName": "蓟城之战",
            "battleYear": 314,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "北京",
            "targetCityId": "city_beijing",
            "targetLat": 39.9,
            "targetLng": 116.41,
            "myTroops": 15000,
            "enemyFactionId": "dongjin",
            "enemyFactionName": "司马晋",
            "enemyGeneralId": "bfe_cb_dongjin_3",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "王彭祖昏妄欲僭号，吾卑辞骄其心，星夜潜师入蓟驱牛羊塞街必擒之。"
                },
                {
                    "speaker": "player",
                    "text": "石公远来必是奉表推戴，何须设防。"
                }
            ]
        },
        {
            "generalId": "cai_lishuo",
            "battleId": "cai_lishuo@328",
            "battleName": "洛阳之战",
            "battleYear": 328,
            "battleType": "field",
            "role": "attacker",
            "targetName": "洛阳城西",
            "targetLat": 34.63,
            "targetLng": 112.41,
            "myTroops": 15000,
            "enemyFactionId": "han_zhao",
            "enemyFactionName": "汉赵",
            "enemyGeneralId": "han_zhao_liuyao",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "洛阳危急若失则河津难保，成皋天险刘曜不守乃天授我也，吾亲披甲出西阳门必擒刘曜。"
                },
                {
                    "speaker": "player",
                    "text": "高候新破石虎，石勒纵自来亦不过添俘。"
                }
            ]
        }
    ],
    "cao_d_caocao": [
        {
            "generalId": "cao_d_caocao",
            "battleId": "cao_d_caocao@198",
            "battleName": "下邳之战",
            "battleYear": 198,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "下邳",
            "targetCityId": "city_xiapi",
            "targetLat": 33.889,
            "targetLng": 117.878,
            "myTroops": 15000,
            "enemyFactionId": "lvbu",
            "enemyFactionName": "徐州",
            "enemyGeneralId": "pizhou_lvbu",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "吕奉先反复无常，昔袭吾兖州今复结袁术为乱徐土，决泗沂二水灌城看尔往何处飞。"
                },
                {
                    "speaker": "player",
                    "text": "吾有赤兔画戟与并州健儿，岂受尔缚。"
                }
            ]
        },
        {
            "generalId": "cao_d_caocao",
            "battleId": "cao_d_caocao@211",
            "battleName": "潼关之战",
            "battleYear": 211,
            "battleType": "field",
            "role": "attacker",
            "targetName": "潼关",
            "targetLat": 34.54,
            "targetLng": 110.29,
            "myTroops": 15000,
            "enemyFactionId": "xiliangjun",
            "enemyFactionName": "西凉军",
            "enemyGeneralId": "cangsong_machao",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "关西诸将每添一部孤便多一分喜色，马孟起徒恃匹夫之勇，离间计成便为孤囊中之物。"
                },
                {
                    "speaker": "player",
                    "text": "西凉长矛铁骑在手，定取曹贼首级祭父。"
                }
            ]
        }
    ],
    "caoren": [
        {
            "generalId": "caoren",
            "battleId": "caoren@209",
            "battleName": "江陵之战",
            "battleYear": 209,
            "battleType": "siege",
            "role": "defender",
            "targetName": "江陵",
            "targetCityId": "city_ying",
            "targetLat": 30.35,
            "targetLng": 112.18,
            "myTroops": 15000,
            "enemyFactionId": "sunwu_d",
            "enemyFactionName": "孙吴",
            "enemyGeneralId": "jiujiang_zhouyu",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "丞相托我以荆州门户，周公瑾纵携赤壁新胜之威，牛金被围吾必亲披甲跃马入阵救出。"
                },
                {
                    "speaker": "player",
                    "text": "江陵已成孤岛，且看子孝能撑几时。"
                }
            ]
        },
        {
            "generalId": "caoren",
            "battleId": "caoren@223",
            "battleName": "濡须口之战",
            "battleYear": 223,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "濡须口",
            "targetCityId": "city_jingkou",
            "targetLat": 31.58,
            "targetLng": 117.92,
            "myTroops": 15000,
            "enemyFactionId": "sunwu_d",
            "enemyFactionName": "孙吴",
            "enemyGeneralId": "bfe_cb_sunwu_d_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "孙权背叛大魏藩臣之约，吾奉诏统步骑直捣濡须中洲，朱桓兵少岂能当大司马雷霆。"
                },
                {
                    "speaker": "player",
                    "text": "胜负在将不在众寡，濡须水城早待来犯。"
                }
            ]
        }
    ],
    "chenghan_lite": [
        {
            "generalId": "chenghan_lite",
            "battleId": "chenghan_lite@303",
            "battleName": "成都之战",
            "battleYear": 303,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "成都",
            "targetCityId": "city_chengdu",
            "targetLat": 30.57,
            "targetLng": 104.07,
            "myTroops": 15000,
            "enemyFactionId": "dongjin",
            "enemyFactionName": "司马晋",
            "enemyGeneralId": "bfe_cb_dongjin_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "罗尚背信残虐六郡流民，吾既破张微入成都少城，当安抚蜀民与约法三章共开新局。"
                },
                {
                    "speaker": "player",
                    "text": "李特分营就食已露破绽，正宜联坞壁劫之。"
                }
            ]
        }
    ],
    "chu_guanyu": [
        {
            "generalId": "chu_guanyu",
            "battleId": "chu_guanyu@200",
            "battleName": "白马之战",
            "battleYear": 200,
            "battleType": "field",
            "role": "attacker",
            "targetName": "白马",
            "targetLat": 35.53,
            "targetLng": 114.52,
            "myTroops": 15000,
            "enemyFactionId": "yuan_shao",
            "enemyFactionName": "冀州",
            "enemyGeneralId": "bfe_cb_yuan_shao_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "吾受曹公厚恩，誓立大效乃去，望见颜良麾盖如插标耳，某当单骑刺之以解白马之围。"
                },
                {
                    "speaker": "player",
                    "text": "河北大军在此，来将通名受死。"
                }
            ]
        }
    ],
    "danyang_huanwen": [
        {
            "generalId": "danyang_huanwen",
            "battleId": "danyang_huanwen@354",
            "battleName": "蓝田灞水之战",
            "battleYear": 354,
            "battleType": "field",
            "role": "attacker",
            "targetName": "长安",
            "targetLat": 34.27,
            "targetLng": 108.93,
            "myTroops": 15000,
            "enemyFactionId": "fushi",
            "enemyFactionName": "苻秦",
            "enemyGeneralId": "bfe_cb_fushi_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "吾统荆楚劲卒越武关入三辅，蓝田既破，今进驻霸上抚慰遗黎，苻健闭长安孤城岂能久存。"
                },
                {
                    "speaker": "player",
                    "text": "关中麦青已尽清野，晋军粮绝自当退走。"
                }
            ]
        },
        {
            "generalId": "danyang_huanwen",
            "battleId": "danyang_huanwen@369",
            "battleName": "枋头之战",
            "battleYear": 369,
            "battleType": "field",
            "role": "attacker",
            "targetName": "枋头",
            "targetLat": 35.56,
            "targetLng": 114.43,
            "myTroops": 15000,
            "enemyFactionId": "murong",
            "enemyFactionName": "慕容燕",
            "enemyGeneralId": "dingzhou_d_murongchui",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "吾开水道直抵枋头逼邺都，惜石门未通粮匮，退军须严防慕容垂追骑。"
                },
                {
                    "speaker": "player",
                    "text": "桓公归途焦渴行阵已乱，燕骑正当疾击襄邑。"
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
    "dingzhou_d_murongchui": [
        {
            "generalId": "dingzhou_d_murongchui",
            "battleId": "dingzhou_d_murongchui@384",
            "battleName": "邺城之战",
            "battleYear": 384,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "安阳",
            "targetCityId": "city_anyang",
            "targetLat": 36.33,
            "targetLng": 114.43,
            "myTroops": 15000,
            "enemyFactionId": "fushi",
            "enemyFactionName": "苻秦",
            "enemyGeneralId": "bfe_cb_fushi_2",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "天命复归大燕，孤兴师围旧都邺城，引漳水灌城阙西路，苻丕难久支。"
                },
                {
                    "speaker": "player",
                    "text": "邺都三台高峻且谢玄晋援将至，誓死不降。"
                }
            ]
        },
        {
            "generalId": "dingzhou_d_murongchui",
            "battleId": "dingzhou_d_murongchui@394",
            "battleName": "长子之战",
            "battleYear": 394,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "长子",
            "targetCityId": "city_shangdang",
            "targetLat": 36.149,
            "targetLng": 113.008,
            "myTroops": 15000,
            "enemyFactionId": "murong",
            "enemyFactionName": "慕容燕",
            "enemyGeneralId": "xiongding_murongyong",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "慕容永害吾宗亲窃据上党，朕声趋滏口实出天井关，必拔长子诛逆贼。"
                },
                {
                    "speaker": "player",
                    "text": "太行关隘重重，且向晋魏乞师共拒中山。"
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
    "fushi_wangmeng": [
        {
            "generalId": "fushi_wangmeng",
            "battleId": "fushi_wangmeng@370",
            "battleName": "晋阳之战",
            "battleYear": 370,
            "battleMonth": 9,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "晋阳",
            "targetCityId": "city_taiyuan",
            "targetLat": 37.87,
            "targetLng": 112.55,
            "myTroops": 15000,
            "enemyFactionId": "murong",
            "enemyFactionName": "慕容燕",
            "enemyGeneralId": "bfe_cb_murong_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "壶关已克，吾留苟苌缀潞川，亲会杨安潜掘地道必拔慕容庄晋阳坚城。"
                },
                {
                    "speaker": "player",
                    "text": "晋阳深池崇墉且太傅大军在潞，岂惧地道。"
                }
            ]
        }
    ],
    "gen_alaric": [
        {
            "generalId": "gen_alaric",
            "battleId": "gen_alaric@402",
            "battleName": "波伦提亚之战",
            "battleYear": 402,
            "battleType": "field",
            "role": "attacker",
            "targetName": "都灵",
            "targetLat": 44.68,
            "targetLng": 7.89,
            "myTroops": 15000,
            "enemyFactionId": "luoma_diguo",
            "enemyFactionName": "罗马帝国",
            "enemyGeneralId": "bfe_cb_luoma_diguo_10",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "霍诺留避困米兰，今日恰逢复活佳节休兵祈祷，岂料斯提里科竟遣异教阿兰骑兵破例突营。"
                },
                {
                    "speaker": "player",
                    "text": "兵不厌诈，保卫意大利岂分节日晨昏。"
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
    "gen_civilis": [
        {
            "generalId": "gen_civilis",
            "battleId": "gen_civilis@70",
            "battleName": "卡斯特拉韦特拉之战",
            "battleYear": 70,
            "battleType": "field",
            "role": "attacker",
            "targetName": "卡斯特拉韦特拉",
            "targetLat": 51.66,
            "targetLng": 6.45,
            "myTroops": 15000,
            "enemyFactionId": "luoma_diguo",
            "enemyFactionName": "罗马帝国",
            "enemyGeneralId": "bfe_cb_luoma_diguo_7",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "莱茵大河与沼泽皆助巴塔维自由之师，凯里亚利斯远来骄兵，必陷泥淖没顶。"
                },
                {
                    "speaker": "player",
                    "text": "罗马内战已平，军团铁鹰必靖莱茵。"
                }
            ]
        }
    ],
    "gen_constantine_great": [
        {
            "generalId": "gen_constantine_great",
            "battleId": "gen_constantine_great@324",
            "battleName": "阿德里安堡之战",
            "battleYear": 324,
            "battleType": "field",
            "role": "attacker",
            "targetName": "埃迪尔内",
            "targetLat": 41.678,
            "targetLng": 26.559,
            "myTroops": 15000,
            "enemyFactionId": "luoma_diguo",
            "enemyFactionName": "罗马帝国",
            "enemyGeneralId": "bfe_cb_luoma_diguo_9",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "东西共治裂痕既深，吾架桥佯攻正面而潜师浅滩迂回山背，李锡尼色雷斯大营今日必破。"
                },
                {
                    "speaker": "player",
                    "text": "通杜贾河与高坡坚垒在手，看尔如何渡河。"
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
            "enemyGeneralId": "lagoniya_agesilaus",
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
    "gen_hannibal": [
        {
            "generalId": "gen_hannibal",
            "battleId": "gen_hannibal@-218",
            "battleName": "特雷比亚河之战",
            "battleYear": -218,
            "battleType": "field",
            "role": "attacker",
            "targetName": "特雷比亚河",
            "targetLat": 45.05,
            "targetLng": 9.6,
            "myTroops": 15000,
            "enemyFactionId": "luoma_gongheguo",
            "enemyFactionName": "罗马共和国",
            "enemyGeneralId": "bfe_cb_luoma_diguo_3",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "罗马执政官塞姆普罗尼乌斯躁进贪功，冬至雪寒，孤设芦林伏兵诱其涉冰河，壮士同击否？"
                },
                {
                    "speaker": "player",
                    "text": "愿随统帅雪岸破敌！"
                }
            ]
        },
        {
            "generalId": "gen_hannibal",
            "battleId": "gen_hannibal@-202",
            "battleName": "扎马之战",
            "battleYear": -202,
            "battleType": "field",
            "role": "attacker",
            "targetName": "扎马",
            "targetLat": 36.11,
            "targetLng": 9.29,
            "myTroops": 15000,
            "enemyFactionId": "luoma_gongheguo",
            "enemyFactionName": "罗马共和国",
            "enemyGeneralId": "bfe_cb_luoma_diguo_4",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "罗马少帅西庇阿携努米底亚叛骑逼我北非国门，孤虽老兵不齐亦当死战护国，壮士同往否？"
                },
                {
                    "speaker": "player",
                    "text": "誓随统帅血战扎马！"
                }
            ]
        }
    ],
    "gen_julian_apostate": [
        {
            "generalId": "gen_julian_apostate",
            "battleId": "gen_julian_apostate@363",
            "battleName": "泰西封之战",
            "battleYear": 363,
            "battleType": "field",
            "role": "attacker",
            "targetName": "巴格达",
            "targetLat": 33.09,
            "targetLng": 44.58,
            "myTroops": 15000,
            "enemyFactionId": "sashan",
            "enemyFactionName": "萨珊",
            "enemyGeneralId": "bfe_cb_sashan_2",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "皇家运河既通，吾夜渡底格里斯河破象骑大阵，直叩沙普尔二世王都。"
                },
                {
                    "speaker": "player",
                    "text": "泰西封城高墙厚，波斯主力云集岂容久留。"
                }
            ]
        }
    ],
    "gen_julius_caesar": [
        {
            "generalId": "gen_julius_caesar",
            "battleId": "gen_julius_caesar@-48",
            "battleName": "法萨卢斯之战",
            "battleYear": -48,
            "battleType": "field",
            "role": "attacker",
            "targetName": "法萨卢斯",
            "targetLat": 39.29,
            "targetLng": 22.38,
            "myTroops": 15000,
            "enemyFactionId": "luoma_gongheguo",
            "enemyFactionName": "罗马共和国",
            "enemyGeneralId": "qiliqiya_pangpei",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "庞培恃众下山列阵法萨卢斯，孤暗抽精锐设第四斜线专破其骄骑，壮士可愿持枪迎刺敌骑？"
                },
                {
                    "speaker": "player",
                    "text": "愿随统帅决胜色萨利！"
                }
            ]
        },
        {
            "generalId": "gen_julius_caesar",
            "battleId": "gen_julius_caesar@-47",
            "battleName": "泽拉之战",
            "battleYear": -47,
            "battleType": "field",
            "role": "attacker",
            "targetName": "泽拉",
            "targetLat": 40.3,
            "targetLng": 35.89,
            "myTroops": 15000,
            "enemyFactionId": "bendou_d",
            "enemyFactionName": "本都",
            "enemyGeneralId": "bfe_cb_bendou_d_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "本都王法尔纳克二世趁内战窃据小亚，今竟狂妄仰攻我泽拉高营，壮士可愿随孤闪电破之？"
                },
                {
                    "speaker": "player",
                    "text": "愿随统帅速平本都！"
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
            "enemyGeneralId": "bfe_cb_boootiya_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "伊斯梅尼亚斯煽动底比斯背盟挑衅，某已先抵哈利亚托斯，壮士可愿随我先拔头筹？"
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
                    "text": "福基斯统帅奥诺马库斯盗圣地金银募兵渎神，孤戴月桂南讨，壮士可愿同诛渎神之徒？"
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
    "guzhu_tianyu": [
        {
            "generalId": "guzhu_tianyu",
            "battleId": "guzhu_tianyu@233",
            "battleName": "成山之战",
            "battleYear": 233,
            "battleType": "field",
            "role": "attacker",
            "targetName": "成山",
            "targetLat": 37.4,
            "targetLng": 122.68,
            "myTroops": 15000,
            "enemyFactionId": "sunwu_d",
            "enemyFactionName": "孙吴",
            "enemyGeneralId": "bfe_cb_sunwu_d_2",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "周贺浮海自辽东归，秋深风急必畏漂荡而泊成山海岛，吾预先据险设伏直如守株待兔。"
                },
                {
                    "speaker": "player",
                    "text": "海路隐秘，岂料曹魏兵马早已守在成山。"
                }
            ]
        }
    ],
    "han_d_liubang": [
        {
            "generalId": "han_d_liubang",
            "battleId": "han_d_liubang@-205",
            "battleName": "彭城之战",
            "battleYear": -205,
            "battleType": "field",
            "role": "attacker",
            "targetName": "彭城",
            "targetLat": 34.27,
            "targetLng": 117.18,
            "myTroops": 15000,
            "enemyFactionId": "chuguo",
            "enemyFactionName": "楚国",
            "enemyGeneralId": "xichu_xiangyu",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "项羽弑义帝而困于齐地，孤统五诸侯兵直捣空虚彭城以讨大逆，壮士可愿随孤东征？"
                },
                {
                    "speaker": "player",
                    "text": "愿随汉王讨逆入彭城！"
                }
            ]
        },
        {
            "generalId": "han_d_liubang",
            "battleId": "han_d_liubang@-202",
            "battleName": "垓下之战",
            "battleYear": -202,
            "battleType": "field",
            "role": "attacker",
            "targetName": "垓下",
            "targetLat": 33.32,
            "targetLng": 117.36,
            "myTroops": 15000,
            "enemyFactionId": "chuguo",
            "enemyFactionName": "楚国",
            "enemyGeneralId": "xichu_xiangyu",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "鸿沟放虎终留后患，今韩信彭越英布诸路毕集垓下，孤当一战定乾坤，壮士随孤合围否？"
                },
                {
                    "speaker": "player",
                    "text": "愿随汉王一统宇内！"
                }
            ]
        }
    ],
    "han_zhao_liuyao": [
        {
            "generalId": "han_zhao_liuyao",
            "battleId": "han_zhao_liuyao@316",
            "battleName": "长安之战",
            "battleYear": 316,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "长安",
            "targetCityId": "city_changan",
            "targetLat": 34.27,
            "targetLng": 108.93,
            "myTroops": 15000,
            "enemyFactionId": "dongjin",
            "enemyFactionName": "司马晋",
            "enemyGeneralId": "bfe_cb_dongjin_4",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "洛阳早已丘墟，长安外援俱绝，吾断渭水截诸路勤王之师，晋主司马邺唯有衔璧出降一途。"
                },
                {
                    "speaker": "player",
                    "text": "城中粮尽蒸民涂炭，朕宁忍辱出降以活遗黎。"
                }
            ]
        }
    ],
    "helian_helianbobo": [
        {
            "generalId": "helian_helianbobo",
            "battleId": "helian_helianbobo@418",
            "battleName": "青泥之战",
            "battleYear": 418,
            "battleType": "field",
            "role": "attacker",
            "targetName": "长安",
            "targetLat": 34.18,
            "targetLng": 109.15,
            "myTroops": 15000,
            "enemyFactionId": "liusong",
            "enemyFactionName": "刘宋",
            "enemyGeneralId": "bfe_cb_liusong_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "刘裕东归委稚子刘义真守长安内乱自戕，朕据咸阳截青泥，必克三辅。"
                },
                {
                    "speaker": "player",
                    "text": "关中诸将火并已坏大局，唯速退保蓝田武关。"
                }
            ]
        }
    ],
    "huizhou_zhugeliang": [
        {
            "generalId": "huizhou_zhugeliang",
            "battleId": "huizhou_zhugeliang@225",
            "battleName": "南中之战",
            "battleYear": 225,
            "battleType": "field",
            "role": "attacker",
            "targetName": "滇池",
            "targetLat": 25.05,
            "targetLng": 102.7,
            "myTroops": 15000,
            "enemyFactionId": "dianguo",
            "enemyFactionName": "滇国",
            "enemyGeneralId": "bfe_cb_dianguo_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "攻城为下攻心为上，孟获既为南中夷汉所服，吾当折其心而永靖南疆。"
                },
                {
                    "speaker": "player",
                    "text": "山川险阻皆我熟识，若丞相再纵定不敢反。"
                }
            ]
        },
        {
            "generalId": "huizhou_zhugeliang",
            "battleId": "huizhou_zhugeliang@234",
            "battleName": "五丈原之战",
            "battleYear": 234,
            "battleType": "field",
            "role": "attacker",
            "targetName": "五丈原",
            "targetLat": 34.3,
            "targetLng": 107.63,
            "myTroops": 15000,
            "enemyFactionId": "caowei",
            "enemyFactionName": "曹魏",
            "enemyGeneralId": "sima_d_simayi",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "亮出斜谷屯田渭滨，鞠躬尽瘁死而后已，司马仲达受巾帼竟不敢出战乎。"
                },
                {
                    "speaker": "player",
                    "text": "任凭武侯百般激将，吾唯奉诏坚守耗其岁月。"
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
    "jingzhou_gs_huangfusong": [
        {
            "generalId": "jingzhou_gs_huangfusong",
            "battleId": "jingzhou_gs_huangfusong@184",
            "battleName": "广宗之战",
            "battleYear": 184,
            "battleType": "field",
            "role": "attacker",
            "targetName": "广宗",
            "targetLat": 37.02,
            "targetLng": 115.42,
            "myTroops": 15000,
            "enemyFactionId": "baibo",
            "enemyFactionName": "黄巾",
            "enemyGeneralId": "bfe_cb_baibo_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "长社火威已破颍川群寇，张梁尔兄既殁尚敢抗拒天兵，今闭营蓄锐，破贼只在旦夕。"
                },
                {
                    "speaker": "player",
                    "text": "苍天已死黄天当立，广宗义众岂畏官军。"
                }
            ]
        }
    ],
    "jinling_tandaoji": [
        {
            "generalId": "jinling_tandaoji",
            "battleId": "jinling_tandaoji@417",
            "battleName": "潼关之战",
            "battleYear": 417,
            "battleType": "field",
            "role": "attacker",
            "targetName": "潼关",
            "targetLat": 34.54,
            "targetLng": 110.29,
            "myTroops": 15000,
            "enemyFactionId": "hou_qin",
            "enemyFactionName": "姚秦",
            "enemyGeneralId": "bfe_yao_shao",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "姚绍塞潼关更遣姚鸾绝粮道，吾当偕沈林子夜破敌垒挫其锋芒。"
                },
                {
                    "speaker": "player",
                    "text": "潼关乃大秦咽喉，老夫有死而已断不让路。"
                }
            ]
        },
        {
            "generalId": "jinling_tandaoji",
            "battleId": "jinling_tandaoji@431",
            "battleName": "历城之战",
            "battleYear": 431,
            "battleType": "field",
            "role": "attacker",
            "targetName": "历下",
            "targetLat": 36.67,
            "targetLng": 117,
            "myTroops": 15000,
            "enemyFactionId": "tuoba",
            "enemyFactionName": "拓跋魏",
            "enemyGeneralId": "bfe_cb_tuoba_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "吾军粮尽若露怯必为魏骑所乘，今夜唱筹量沙，看叔孙建安敢追逼。"
                },
                {
                    "speaker": "player",
                    "text": "檀公粮储如山恐设奇伏，切莫追击速斩降卒。"
                }
            ]
        }
    ],
    "jiujiang_zhouyu": [
        {
            "generalId": "jiujiang_zhouyu",
            "battleId": "jiujiang_zhouyu@209",
            "battleName": "江陵之战",
            "battleYear": 209,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "江陵",
            "targetCityId": "city_ying",
            "targetLat": 30.35,
            "targetLng": 112.18,
            "myTroops": 15000,
            "enemyFactionId": "caowei",
            "enemyFactionName": "曹魏",
            "enemyGeneralId": "caoren",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "赤壁余烬未冷，江陵孤城外援已绝，曹子孝虽善战，瑜带伤督阵必夺此全楚锁钥。"
                },
                {
                    "speaker": "player",
                    "text": "江陵城坚粮足，曹某誓死不退半步。"
                }
            ]
        }
    ],
    "juqu_d_juqumengxun": [
        {
            "generalId": "juqu_d_juqumengxun",
            "battleId": "juqu_d_juqumengxun@420",
            "battleName": "蓼泉之战",
            "battleYear": 420,
            "battleType": "field",
            "role": "attacker",
            "targetName": "张掖",
            "targetLat": 39.25,
            "targetLng": 99.85,
            "myTroops": 15000,
            "enemyFactionId": "yangguan",
            "enemyFactionName": "西凉",
            "enemyGeneralId": "bfe_cb_yangguan_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "吾扬言南伐西秦实则潜返张掖，更使广宗诈献城印诱李歆贪功深入，蓼泉重围必灭西凉。"
                },
                {
                    "speaker": "player",
                    "text": "不听宋太后泣谏悔之晚矣，唯死战不退。"
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
    "langzhou_zhangfei": [
        {
            "generalId": "langzhou_zhangfei",
            "battleId": "langzhou_zhangfei@208",
            "battleName": "长坂坡之战",
            "battleYear": 208,
            "battleType": "field",
            "role": "attacker",
            "targetName": "当阳",
            "targetLat": 30.82,
            "targetLng": 111.79,
            "myTroops": 15000,
            "enemyFactionId": "caowei",
            "enemyFactionName": "曹魏",
            "enemyGeneralId": "cao_d_caocao",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "身是张益德也，可来共决死，曹阿瞒虎豹轻骑虽疾，休想越此当阳断桥一步。"
                },
                {
                    "speaker": "player",
                    "text": "彼据水断桥必有伏兵，诸军切莫轻进。"
                }
            ]
        }
    ],
    "li_s_mayuan": [
        {
            "generalId": "li_s_mayuan",
            "battleId": "li_s_mayuan@49",
            "battleName": "壶头山之战",
            "battleYear": 49,
            "battleType": "field",
            "role": "attacker",
            "targetName": "壶头山",
            "targetLat": 29.117,
            "targetLng": 110.467,
            "myTroops": 15000,
            "enemyFactionId": "wuling",
            "enemyFactionName": "五溪",
            "enemyGeneralId": "wuling_xiangdancheng",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "男儿当死于边野，以马革裹尸还葬耳，相单程负险抗命，老夫虽皓首必破此山。"
                },
                {
                    "speaker": "player",
                    "text": "壶头绝壁湍流如箭，汉船休想寸进。"
                }
            ]
        }
    ],
    "liu_yingbu": [
        {
            "generalId": "liu_yingbu",
            "battleId": "liu_yingbu@-202",
            "battleName": "垓下之战",
            "battleYear": -202,
            "battleType": "field",
            "role": "attacker",
            "targetName": "垓下",
            "targetLat": 33.32,
            "targetLng": 117.36,
            "myTroops": 15000,
            "enemyFactionId": "chuguo",
            "enemyFactionName": "楚国",
            "enemyGeneralId": "xichu_xiangyu",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "汉王许裂地封王，某已自淮南北上城父绝楚归路，今会猎项羽于垓下，壮士同往否？"
                },
                {
                    "speaker": "player",
                    "text": "愿随淮南王合围破楚！"
                }
            ]
        }
    ],
    "lu_zhangliao": [
        {
            "generalId": "lu_zhangliao",
            "battleId": "lu_zhangliao@207",
            "battleName": "白狼山之战",
            "battleYear": 207,
            "battleType": "field",
            "role": "attacker",
            "targetName": "白狼山",
            "targetLat": 41.4,
            "targetLng": 119.64,
            "myTroops": 15000,
            "enemyFactionId": "wuhuan",
            "enemyFactionName": "乌桓",
            "enemyGeneralId": "wuhuan_tadun",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "虏众虽盛而行列未整，正乃天赐丞相破胡良机，辽请执麾先登，必斩蹋顿于马下。"
                },
                {
                    "speaker": "player",
                    "text": "塞外控弦铁骑齐集，岂容汉军生离柳城。"
                }
            ]
        }
    ],
    "lulin_liuxiu": [
        {
            "generalId": "lulin_liuxiu",
            "battleId": "lulin_liuxiu@24",
            "battleName": "邯郸之战",
            "battleYear": 24,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "邯郸",
            "targetCityId": "city_handan",
            "targetLat": 36.61,
            "targetLng": 114.49,
            "myTroops": 15000,
            "enemyFactionId": "zhao",
            "enemyFactionName": "赵国",
            "enemyGeneralId": "bfe_cb_zhao_3",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "吾持节北渡镇慰河北，王郎何人，敢假托刘氏宗亲妄窃赵宫，今必拔城诛伪。"
                },
                {
                    "speaker": "player",
                    "text": "邯郸金城汤池，河北尽附，岂惧孤军。"
                }
            ]
        },
        {
            "generalId": "lulin_liuxiu",
            "battleId": "lulin_liuxiu@27",
            "battleName": "宜阳之战",
            "battleYear": 27,
            "battleType": "field",
            "role": "attacker",
            "targetName": "宜阳",
            "targetLat": 34.52,
            "targetLng": 112.18,
            "myTroops": 15000,
            "enemyFactionId": "chimei",
            "enemyFactionName": "赤眉",
            "enemyGeneralId": "chimei_fanchong",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "赤眉困敝东归，朕已陈六师于宜阳塞其去路，樊崇若识天命解甲，当保不死。"
                },
                {
                    "speaker": "player",
                    "text": "吾辈转战关河力竭，愿奉盆子归命。"
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
    "murong_murongke": [
        {
            "generalId": "murong_murongke",
            "battleId": "murong_murongke@356",
            "battleName": "广固之战",
            "battleYear": 356,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "广固",
            "targetCityId": "city_linzi",
            "targetLat": 36.73,
            "targetLng": 118.44,
            "myTroops": 15000,
            "enemyFactionId": "xianbei",
            "enemyFactionName": "鲜卑",
            "enemyGeneralId": "bfe_cb_xianbei_2",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "段龛不守黄河任吾济师已成瓮鳖，今筑长围困广固，必坐收齐鲁之地。"
                },
                {
                    "speaker": "player",
                    "text": "吾弟段羆骁勇且求救东晋，岂甘坐以待毙。"
                }
            ]
        }
    ],
    "pulei_dougu": [
        {
            "generalId": "pulei_dougu",
            "battleId": "pulei_dougu@74",
            "battleName": "车师之战",
            "battleYear": 74,
            "battleType": "field",
            "role": "attacker",
            "targetName": "务涂城",
            "targetLat": 43.989,
            "targetLng": 89.58,
            "myTroops": 15000,
            "enemyFactionId": "chagatai",
            "enemyFactionName": "车师",
            "enemyGeneralId": "bfe_cb_chagatai_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "汉师越蒲类破白山直趋务涂，车师王安得若识大体速出归命，可保社稷无恙。"
                },
                {
                    "speaker": "player",
                    "text": "天朝铁骑神速至此，安得愿脱冠稽首。"
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
    "qiliqiya_pangpei": [
        {
            "generalId": "qiliqiya_pangpei",
            "battleId": "qiliqiya_pangpei@-63",
            "battleName": "耶路撒冷之战",
            "battleYear": -63,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "耶路撒冷",
            "targetCityId": "city_yelusaleng",
            "targetLat": 31.77,
            "targetLng": 35.21,
            "myTroops": 15000,
            "enemyFactionId": "hasmonean",
            "enemyFactionName": "哈斯蒙尼王国",
            "enemyGeneralId": "gen_aristobulus_ii",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "阿里斯托布鲁斯二世反复无信闭守圣殿山，某调推罗攻城巨械北面强拔之，壮士同登城否？"
                },
                {
                    "speaker": "player",
                    "text": "愿随统帅先登破城！"
                }
            ]
        },
        {
            "generalId": "qiliqiya_pangpei",
            "battleId": "qiliqiya_pangpei@-48",
            "battleName": "法萨卢斯之战",
            "battleYear": -48,
            "battleType": "field",
            "role": "attacker",
            "targetName": "法萨卢斯",
            "targetLat": 39.29,
            "targetLng": 22.38,
            "myTroops": 15000,
            "enemyFactionId": "luoma_gongheguo",
            "enemyFactionName": "罗马共和国",
            "enemyGeneralId": "gen_julius_caesar",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "叛将恺撒困于色萨利，众贵催战，某集重骑左翼卷其侧背，壮士同护共和否？"
                },
                {
                    "speaker": "player",
                    "text": "愿随统帅捍卫罗马！"
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
    "qingqiang_jiangwei": [
        {
            "generalId": "qingqiang_jiangwei",
            "battleId": "qingqiang_jiangwei@256",
            "battleName": "段谷之战",
            "battleYear": 256,
            "battleType": "field",
            "role": "attacker",
            "targetName": "段谷",
            "targetLat": 34.48,
            "targetLng": 105.68,
            "myTroops": 15000,
            "enemyFactionId": "caowei",
            "enemyFactionName": "曹魏",
            "enemyGeneralId": "wudu_dengai",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "吾约胡济会师上邽共取陇右，岂料邓士载预断行藏先据段谷山险，唯当奋力冲关一战。"
                },
                {
                    "speaker": "player",
                    "text": "狄道之后早防伯约东出，段谷便是绝路。"
                }
            ]
        },
        {
            "generalId": "qingqiang_jiangwei",
            "battleId": "qingqiang_jiangwei@263",
            "battleName": "剑阁之战",
            "battleYear": 263,
            "battleType": "siege",
            "role": "defender",
            "targetName": "剑门关",
            "targetCityId": "city_jianmenguan",
            "targetLat": 32.28,
            "targetLng": 105.53,
            "myTroops": 15000,
            "enemyFactionId": "caowei",
            "enemyFactionName": "曹魏",
            "enemyGeneralId": "bfe_cb_caowei_4",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "汉中虽失，剑阁一夫当关自足锁死钟士季倾国大军，蜀汉存亡吾当以热血守此雄关。"
                },
                {
                    "speaker": "player",
                    "text": "伯约若肯归命大魏，何愁不享封侯之贵。"
                }
            ]
        }
    ],
    "qu_d_quyi": [
        {
            "generalId": "qu_d_quyi",
            "battleId": "qu_d_quyi@195",
            "battleName": "鲍丘水之战",
            "battleYear": 195,
            "battleType": "field",
            "role": "attacker",
            "targetName": "鲍丘水",
            "targetLat": 39.88,
            "targetLng": 116.75,
            "myTroops": 15000,
            "enemyFactionId": "you",
            "enemyFactionName": "幽州",
            "enemyGeneralId": "hejian_gongsunzan",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "昔界桥一战已折尔白马骄锋，公孙瓒今复害刘牧虐幽州，吾必于鲍丘水畔再碎尔阵。"
                },
                {
                    "speaker": "player",
                    "text": "幽燕健儿尚在，岂容尔冀州叛将逞凶。"
                }
            ]
        }
    ],
    "ranwei_d_ranmin": [
        {
            "generalId": "ranwei_d_ranmin",
            "battleId": "ranwei_d_ranmin@351",
            "battleName": "襄国之战",
            "battleYear": 351,
            "battleType": "field",
            "role": "attacker",
            "targetName": "邢台",
            "targetLat": 37.07,
            "targetLng": 114.5,
            "myTroops": 15000,
            "enemyFactionId": "hou_zhao",
            "enemyFactionName": "石赵",
            "enemyGeneralId": "bfe_cb_hou_zhao_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "苍亭既捷，石祗困襄国敢引鲜卑羌胡来犯，朕纵血战必踏平石氏巢穴。"
                },
                {
                    "speaker": "player",
                    "text": "燕羌铁骑已自外合围，冉闵今日插翅难飞。"
                }
            ]
        },
        {
            "generalId": "ranwei_d_ranmin",
            "battleId": "ranwei_d_ranmin@352",
            "battleName": "廉台之战",
            "battleYear": 352,
            "battleType": "field",
            "role": "attacker",
            "targetName": "廉台",
            "targetLat": 38.23,
            "targetLng": 115.02,
            "myTroops": 15000,
            "enemyFactionId": "murong",
            "enemyFactionName": "慕容燕",
            "enemyGeneralId": "murong_murongke",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "朕执双刃矛跨朱龙战马，纵慕容恪连环锁骑合围，亦当浴血杀透敌阵。"
                },
                {
                    "speaker": "player",
                    "text": "冉闵勇而无谋粮匮卒寡，连环铁骑合围可擒。"
                }
            ]
        }
    ],
    "ruo_wangjian": [
        {
            "generalId": "ruo_wangjian",
            "battleId": "ruo_wangjian@-228",
            "battleName": "东阳之战",
            "battleYear": -228,
            "battleType": "field",
            "role": "attacker",
            "targetName": "东阳",
            "targetLat": 36.75,
            "targetLng": 114.95,
            "myTroops": 15000,
            "enemyFactionId": "zhao",
            "enemyFactionName": "赵国",
            "enemyGeneralId": "bfe_cb_zhao_2",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "赵廷自毁长城冤杀李牧，新帅赵葱无能，某当一鼓渡漳灭赵，壮士可愿同收邯郸？"
                },
                {
                    "speaker": "player",
                    "text": "愿随老将军荡平赵境！"
                }
            ]
        },
        {
            "generalId": "ruo_wangjian",
            "battleId": "ruo_wangjian@-227",
            "battleName": "易水之战",
            "battleYear": -227,
            "battleType": "field",
            "role": "attacker",
            "targetName": "易水",
            "targetLat": 39.27,
            "targetLng": 115.5,
            "myTroops": 15000,
            "enemyFactionId": "yan",
            "enemyFactionName": "燕国",
            "enemyGeneralId": "bfe_cb_yan_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "燕太子丹遣刺客行凶咸阳，秦王震怒命某北讨，今燕代合兵易水，壮士可愿同雪国耻？"
                },
                {
                    "speaker": "player",
                    "text": "愿随上将军踏破易水！"
                }
            ]
        }
    ],
    "ruzhou_sunjian": [
        {
            "generalId": "ruzhou_sunjian",
            "battleId": "ruzhou_sunjian@184",
            "battleName": "宛城之战",
            "battleYear": 184,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "宛城",
            "targetCityId": "city_nanyang",
            "targetLat": 32.956,
            "targetLng": 112.516,
            "myTroops": 15000,
            "enemyFactionId": "baibo",
            "enemyFactionName": "黄巾",
            "enemyGeneralId": "bfe_cb_baibo_2",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "黄巾窃据南阳重镇，吾忝佐朱公讨逆，今日必亲冒矢石先登破城，斩赵弘以靖荆豫。"
                },
                {
                    "speaker": "player",
                    "text": "宛城壁高壕深，官军屡攻何曾损我分毫。"
                }
            ]
        },
        {
            "generalId": "ruzhou_sunjian",
            "battleId": "ruzhou_sunjian@191",
            "battleName": "襄阳之战",
            "battleYear": 191,
            "battleMonth": 11,
            "battleType": "field",
            "role": "attacker",
            "targetName": "襄阳",
            "targetLat": 32.01,
            "targetLng": 112.12,
            "myTroops": 15000,
            "enemyFactionId": "jingzhou",
            "enemyFactionName": "荆州",
            "enemyGeneralId": "bfe_cb_jingzhou_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "刘景升据荆襄断南阳粮道，黄祖小辈敢陈兵樊邓拒我，且看某踏破尔营直取襄阳。"
                },
                {
                    "speaker": "player",
                    "text": "汉水天堑岘山险峻，江东兵休夸海口。"
                }
            ]
        }
    ],
    "sailiugu_antiaoke": [
        {
            "generalId": "sailiugu_antiaoke",
            "battleId": "sailiugu_antiaoke@-217",
            "battleName": "拉菲亚之战",
            "battleYear": -217,
            "battleType": "field",
            "role": "attacker",
            "targetName": "拉菲亚",
            "targetLat": 31.29,
            "targetLng": 34.24,
            "myTroops": 15000,
            "enemyFactionId": "tuolemi",
            "enemyFactionName": "托勒密",
            "enemyGeneralId": "bfe_cb_tuolemi_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "埃及王托勒密四世携非洲象群北拒拉菲亚，孤统高大印度战象与银盾军破之，壮士同冲否？"
                },
                {
                    "speaker": "player",
                    "text": "愿随陛下冲破敌翼！"
                }
            ]
        },
        {
            "generalId": "sailiugu_antiaoke",
            "battleId": "sailiugu_antiaoke@-190",
            "battleName": "马格尼西亚之战",
            "battleYear": -190,
            "battleType": "field",
            "role": "attacker",
            "targetName": "马格尼西亚",
            "targetLat": 38.61,
            "targetLng": 27.43,
            "myTroops": 15000,
            "enemyFactionId": "luoma_gongheguo",
            "enemyFactionName": "罗马共和国",
            "enemyGeneralId": "bfe_cb_luoma_diguo_5",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "罗马帅卢基乌斯西庇阿跨海逼我腹地，孤集铁骑战象决战，壮士同往否？"
                },
                {
                    "speaker": "player",
                    "text": "愿随大帝迎击罗马！"
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
            "enemyGeneralId": "qin_mengao",
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
    "shanyue_sunce": [
        {
            "generalId": "shanyue_sunce",
            "battleId": "shanyue_sunce@196",
            "battleName": "会稽之战",
            "battleYear": 196,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "会稽",
            "targetCityId": "city_kuaiji",
            "targetLat": 29.987,
            "targetLng": 120.582,
            "myTroops": 15000,
            "enemyFactionId": "han_d",
            "enemyFactionName": "刘汉",
            "enemyGeneralId": "bfe_cb_han_d_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "曲阿吴郡皆已望风归顺，王景兴腐儒不知天命敢阻固陵钱塘，吾当奇袭查渎破尔会稽。"
                },
                {
                    "speaker": "player",
                    "text": "浙江风涛险恶，我当凭水死守保境。"
                }
            ]
        },
        {
            "generalId": "shanyue_sunce",
            "battleId": "shanyue_sunce@199",
            "battleName": "沙羡之战",
            "battleYear": 199,
            "battleType": "field",
            "role": "attacker",
            "targetName": "武昌",
            "targetLat": 30.53,
            "targetLng": 114.32,
            "myTroops": 15000,
            "enemyFactionId": "jingzhou",
            "enemyFactionName": "荆州",
            "enemyGeneralId": "bfe_cb_jingzhou_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "黄祖昔于岘山暗算先君，血海深仇未尝一日敢忘，今日沙羡相逢必碎尔水陆全军。"
                },
                {
                    "speaker": "player",
                    "text": "荆州铁骑舟师齐集，何惧江东小儿。"
                }
            ]
        }
    ],
    "shizhao_d_shihu": [
        {
            "generalId": "shizhao_d_shihu",
            "battleId": "shizhao_d_shihu@323",
            "battleName": "广固之战",
            "battleYear": 323,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "广固",
            "targetCityId": "city_linzi",
            "targetLat": 36.73,
            "targetLng": 118.44,
            "myTroops": 15000,
            "enemyFactionId": "dongjin",
            "enemyFactionName": "司马晋",
            "enemyGeneralId": "bfe_cb_dongjin_5",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "青齐膏腴之地岂容曹嶷首鼠两端，吾已拔临淄毁尔羽翼，广固孤城若不速降必屠无遗。"
                },
                {
                    "speaker": "player",
                    "text": "广固负山带涧险绝东方，岂易旦夕攻拔。"
                }
            ]
        }
    ],
    "shizhou_liucong": [
        {
            "generalId": "shizhou_liucong",
            "battleId": "shizhou_liucong@309",
            "battleName": "洛阳西明门之战",
            "battleYear": 309,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "洛阳",
            "targetCityId": "city_luoyang",
            "targetLat": 34.62,
            "targetLng": 112.45,
            "myTroops": 15000,
            "enemyFactionId": "dongjin",
            "enemyFactionName": "司马晋",
            "enemyGeneralId": "bfe_cb_dongjin_2",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "吾奉诏叩洛既破宜阳，洛阳已在铁蹄之下，司马越龟缩宫城能奈我何。"
                },
                {
                    "speaker": "player",
                    "text": "凉州北宫纯劲卒在城，正待刘聪骄怠夜击。"
                }
            ]
        }
    ],
    "shu_liubei": [
        {
            "generalId": "shu_liubei",
            "battleId": "shu_liubei@202",
            "battleName": "博望坡之战",
            "battleYear": 202,
            "battleType": "field",
            "role": "attacker",
            "targetName": "博望",
            "targetLat": 33.15,
            "targetLng": 112.78,
            "myTroops": 15000,
            "enemyFactionId": "caowei",
            "enemyFactionName": "曹魏",
            "enemyGeneralId": "bfe_cb_caowei_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "吾驻新野北窥许洛，夏侯元让恃胜骄进，今自烧屯营伪遁诱入险隘，必教彼有进无退。"
                },
                {
                    "speaker": "player",
                    "text": "刘备孤穷败寇自焚营垒，急追勿失。"
                }
            ]
        },
        {
            "generalId": "shu_liubei",
            "battleId": "shu_liubei@222",
            "battleName": "夷陵之战",
            "battleYear": 222,
            "battleType": "field",
            "role": "attacker",
            "targetName": "夷陵",
            "targetLat": 30.7,
            "targetLng": 111.28,
            "myTroops": 15000,
            "enemyFactionId": "sunwu_d",
            "enemyFactionName": "孙吴",
            "enemyGeneralId": "yidou_luxun",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "东吴背盟袭取荆州害吾云长，朕今亲统巴蜀虎贲顺江讨逆，不破陆逊誓不还成都。"
                },
                {
                    "speaker": "player",
                    "text": "陛下盛怒远来，逊当谨守要害徐图后举。"
                }
            ]
        }
    ],
    "shuofang_weiqing": [
        {
            "generalId": "shuofang_weiqing",
            "battleId": "shuofang_weiqing@-127",
            "battleName": "河南之战",
            "battleYear": -127,
            "battleType": "field",
            "role": "attacker",
            "targetName": "河南地",
            "targetLat": 40.75,
            "targetLng": 108.5,
            "myTroops": 15000,
            "enemyFactionId": "xiongnu",
            "enemyFactionName": "匈奴",
            "enemyGeneralId": "bfe_cb_xiongnu_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "军臣单于犯边，某拟自云中西绕高阙合围河南地，壮士可愿同收故土？"
                },
                {
                    "speaker": "player",
                    "text": "愿随将军光复河套！"
                }
            ]
        },
        {
            "generalId": "shuofang_weiqing",
            "battleId": "shuofang_weiqing@-124",
            "battleName": "漠南之战",
            "battleYear": -124,
            "battleType": "field",
            "role": "attacker",
            "targetName": "漠南",
            "targetLat": 41.5,
            "targetLng": 106.8,
            "myTroops": 15000,
            "enemyFactionId": "xiongnu",
            "enemyFactionName": "匈奴",
            "enemyGeneralId": "xiongnu_yizhixie",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "伊稚斜单于新立狂傲，其右贤王屯高阙外醉卧无备，某率轻骑乘夜奇袭其庭，壮士同往否？"
                },
                {
                    "speaker": "player",
                    "text": "愿随车骑将军夜捣胡庭！"
                }
            ]
        }
    ],
    "sima_d_simayi": [
        {
            "generalId": "sima_d_simayi",
            "battleId": "sima_d_simayi@234",
            "battleName": "五丈原之战",
            "battleYear": 234,
            "battleType": "field",
            "role": "attacker",
            "targetName": "五丈原",
            "targetLat": 34.3,
            "targetLng": 107.63,
            "myTroops": 15000,
            "enemyFactionId": "shu",
            "enemyFactionName": "蜀汉",
            "enemyGeneralId": "huizhou_zhugeliang",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "诸葛孔明志大而不见机，食少事烦岂能久乎，吾背渭水高垒按甲，忍小忿正以全国家大计。"
                },
                {
                    "speaker": "player",
                    "text": "仲达拥重兵而甘藏深垒，何颜统御关陇。"
                }
            ]
        },
        {
            "generalId": "sima_d_simayi",
            "battleId": "sima_d_simayi@238",
            "battleName": "襄平之战",
            "battleYear": 238,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "襄平",
            "targetCityId": "city_liaoyang",
            "targetLat": 41.27,
            "targetLng": 123.17,
            "myTroops": 15000,
            "enemyFactionId": "gongsun_d",
            "enemyFactionName": "辽东",
            "enemyGeneralId": "bfe_cb_gongsun_d_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "贼弃城远拒辽隧正欲老我师也，今张旗南向实则倍道直捣其巢穴襄平，公孙文懿插翅难逃。"
                },
                {
                    "speaker": "player",
                    "text": "辽水暴涨霖雨连绵，魏军焉能近我王城。"
                }
            ]
        }
    ],
    "suzhou_huoqubing": [
        {
            "generalId": "suzhou_huoqubing",
            "battleId": "suzhou_huoqubing@-119",
            "battleName": "漠北之战",
            "battleYear": -119,
            "battleType": "field",
            "role": "attacker",
            "targetName": "漠北",
            "targetLat": 47.7,
            "targetLng": 109.1,
            "myTroops": 15000,
            "enemyFactionId": "xiongnu",
            "enemyFactionName": "匈奴",
            "enemyGeneralId": "xiongnu_yizhixie",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "大军绝漠捣龙庭，某率铁骑出代郡寻敌主力，封狼居胥正在此行，壮士同驰否？"
                },
                {
                    "speaker": "player",
                    "text": "愿随骠骑将军封狼居胥！"
                }
            ]
        }
    ],
    "tuoba_tuobagui": [
        {
            "generalId": "tuoba_tuobagui",
            "battleId": "tuoba_tuobagui@397",
            "battleName": "柏肆之战",
            "battleYear": 397,
            "battleType": "field",
            "role": "attacker",
            "targetName": "真定",
            "targetLat": 38.13,
            "targetLng": 114.59,
            "myTroops": 15000,
            "enemyFactionId": "murong",
            "enemyFactionName": "慕容燕",
            "enemyGeneralId": "bfe_murongbao",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "慕容宝夜渡滹沱劫吾柏肆营，朕移营外燃炬击鼓反扑，必破燕卒于冰河。"
                },
                {
                    "speaker": "player",
                    "text": "乘黑夜顺风烧魏营，定报参合陂血海深仇。"
                }
            ]
        },
        {
            "generalId": "tuoba_tuobagui",
            "battleId": "tuoba_tuobagui@402",
            "battleName": "柴壁之战",
            "battleYear": 402,
            "battleType": "field",
            "role": "attacker",
            "targetName": "临汾",
            "targetLat": 35.72,
            "targetLng": 111.18,
            "myTroops": 15000,
            "enemyFactionId": "hou_qin",
            "enemyFactionName": "姚秦",
            "enemyGeneralId": "bfe_cb_hou_qin_2",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "姚平孤军困柴壁如入笼中，朕渡汾西筑重围水陆俱绝，姚兴隔岸莫能救。"
                },
                {
                    "speaker": "player",
                    "text": "圣主大军近在汾西蒙坑，柴壁将士誓突重围。"
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
            "enemyGeneralId": "antigonid_demetrius",
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
    "wang_d_liuyu": [
        {
            "generalId": "wang_d_liuyu",
            "battleId": "wang_d_liuyu@404",
            "battleName": "覆舟山之战",
            "battleYear": 404,
            "battleType": "field",
            "role": "attacker",
            "targetName": "金陵",
            "targetLat": 32.05,
            "targetLng": 118.77,
            "myTroops": 15000,
            "enemyFactionId": "huanchu",
            "enemyFactionName": "桓楚",
            "enemyGeneralId": "bfe_cb_huanchu_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "桓玄篡逆神人共愤，吾设疑旗于覆舟山上乘风纵火，一鼓必克金陵。"
                },
                {
                    "speaker": "player",
                    "text": "京口义兵寡少，覆舟山重兵足可碾碎。"
                }
            ]
        },
        {
            "generalId": "wang_d_liuyu",
            "battleId": "wang_d_liuyu@417",
            "battleName": "长安之战",
            "battleYear": 417,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "长安",
            "targetCityId": "city_changan",
            "targetLat": 34.27,
            "targetLng": 108.93,
            "myTroops": 15000,
            "enemyFactionId": "hou_qin",
            "enemyFactionName": "姚秦",
            "enemyGeneralId": "bfe_cb_hou_qin_3",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "吾破魏骑克潼关直叩渭桥，蒙冲已抵长安城北，姚泓唯余出降一途。"
                },
                {
                    "speaker": "player",
                    "text": "潼关渭桥皆陷，宗社已倾唯有舆榇诣军门。"
                }
            ]
        }
    ],
    "wazhai_zhanghan": [
        {
            "generalId": "wazhai_zhanghan",
            "battleId": "wazhai_zhanghan@-209",
            "battleName": "戏水之战",
            "battleYear": -209,
            "battleType": "field",
            "role": "attacker",
            "targetName": "戏水",
            "targetLat": 34.39,
            "targetLng": 109.25,
            "myTroops": 15000,
            "enemyFactionId": "chuguo",
            "enemyFactionName": "楚国",
            "enemyGeneralId": "bfe_cb_chuguo_2",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "楚寇周章破函谷直逼骊山戏水，咸阳无兵，某请赦骊山徒铸剑迎敌，壮士可愿共挽危秦？"
                },
                {
                    "speaker": "player",
                    "text": "愿随少府杀退楚师！"
                }
            ]
        },
        {
            "generalId": "wazhai_zhanghan",
            "battleId": "wazhai_zhanghan@-207",
            "battleName": "巨鹿之战",
            "battleYear": -207,
            "battleType": "field",
            "role": "attacker",
            "targetName": "巨鹿漳水",
            "targetLat": 37.22,
            "targetLng": 115.03,
            "myTroops": 15000,
            "enemyFactionId": "chuguo",
            "enemyFactionName": "楚国",
            "enemyGeneralId": "xichu_xiangyu",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "王离围赵巨鹿，某屯棘原筑甬道输粟，今项羽破釜渡河犯我粮道，壮士可愿同御狂楚？"
                },
                {
                    "speaker": "player",
                    "text": "愿随将军力保甬道！"
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
            "enemyFactionId": "jiangqi",
            "enemyFactionName": "姜齐",
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
    "wudu_dengai": [
        {
            "generalId": "wudu_dengai",
            "battleId": "wudu_dengai@256",
            "battleName": "段谷之战",
            "battleYear": 256,
            "battleType": "field",
            "role": "attacker",
            "targetName": "段谷",
            "targetLat": 34.48,
            "targetLng": 105.68,
            "myTroops": 15000,
            "enemyFactionId": "shu",
            "enemyFactionName": "蜀汉",
            "enemyGeneralId": "qingqiang_jiangwei",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "洮西之后蜀人必乘胜东向，吾早据武城山与上邽诸险，姜维失胡济之援入段谷必败无疑。"
                },
                {
                    "speaker": "player",
                    "text": "纵胡济未至，吾岂畏尔陇右守兵。"
                }
            ]
        }
    ],
    "wuling_xiangdancheng": [
        {
            "generalId": "wuling_xiangdancheng",
            "battleId": "wuling_xiangdancheng@49",
            "battleName": "壶头山之战",
            "battleYear": 49,
            "battleType": "siege",
            "role": "defender",
            "targetName": "壶头山",
            "targetCityId": "city_wulingshan",
            "targetLat": 29.117,
            "targetLng": 110.467,
            "myTroops": 15000,
            "enemyFactionId": "han_d",
            "enemyFactionName": "刘汉",
            "enemyGeneralId": "li_s_mayuan",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "五溪崇山激流乃吾族世守藩篱，马援虽名震交趾，今入壶头绝峡休想越雷池一步。"
                },
                {
                    "speaker": "player",
                    "text": "朝廷天威讨逆，山险岂能久恃。"
                }
            ]
        }
    ],
    "wuwu_d_lvmeng": [
        {
            "generalId": "wuwu_d_lvmeng",
            "battleId": "wuwu_d_lvmeng@213",
            "battleName": "濡须口之战",
            "battleYear": 213,
            "battleType": "siege",
            "role": "defender",
            "targetName": "濡须口",
            "targetCityId": "city_jingkou",
            "targetLat": 31.58,
            "targetLng": 117.92,
            "myTroops": 15000,
            "enemyFactionId": "caowei",
            "enemyFactionName": "曹魏",
            "enemyGeneralId": "cao_d_caocao",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "夹水筑立船坞正为今日御曹，曹公水军甫下船未站稳，蒙请乘机急击必获全胜。"
                },
                {
                    "speaker": "player",
                    "text": "生子当如孙仲谋，江东阵容严整未可轻图。"
                }
            ]
        },
        {
            "generalId": "wuwu_d_lvmeng",
            "battleId": "wuwu_d_lvmeng@214",
            "battleName": "皖城之战",
            "battleYear": 214,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "潜山",
            "targetCityId": "city_qianshan",
            "targetLat": 30.617,
            "targetLng": 116.485,
            "myTroops": 15000,
            "enemyFactionId": "caowei",
            "enemyFactionName": "曹魏",
            "enemyGeneralId": "bfe_cb_caowei_2",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "皖城田肥水盛，若待张辽救至便难图矣，蒙请于平旦亲擂战鼓，不至食时必破朱光。"
                },
                {
                    "speaker": "player",
                    "text": "城坚池深且合肥张文远将至，何惧急攻。"
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
    "xianyu_hanxin": [
        {
            "generalId": "xianyu_hanxin",
            "battleId": "xianyu_hanxin@-203",
            "battleName": "潍水之战",
            "battleYear": -203,
            "battleType": "field",
            "role": "attacker",
            "targetName": "潍水",
            "targetLat": 36.42,
            "targetLng": 119.41,
            "myTroops": 15000,
            "enemyFactionId": "chuguo",
            "enemyFactionName": "楚国",
            "enemyGeneralId": "bfe_cb_chuguo_3",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "楚将龙且恃勇轻我，吾已备沙囊塞潍水上游，佯败诱其半渡决水淹之，壮士可愿同斩龙且？"
                },
                {
                    "speaker": "player",
                    "text": "愿随齐王决水破楚！"
                }
            ]
        },
        {
            "generalId": "xianyu_hanxin",
            "battleId": "xianyu_hanxin@-202",
            "battleName": "垓下之战",
            "battleYear": -202,
            "battleType": "field",
            "role": "attacker",
            "targetName": "垓下",
            "targetLat": 33.32,
            "targetLng": 117.36,
            "myTroops": 15000,
            "enemyFactionId": "chuguo",
            "enemyFactionName": "楚国",
            "enemyGeneralId": "xichu_xiangyu",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "项羽虽神勇不过匹夫之刚，今某执掌中军布多层进退奇阵合围之，壮士可愿随我竟此全功？"
                },
                {
                    "speaker": "player",
                    "text": "愿随大将军决胜垓下！"
                }
            ]
        }
    ],
    "xiayang_d_dengyu": [
        {
            "generalId": "xiayang_d_dengyu",
            "battleId": "xiayang_d_dengyu@25",
            "battleName": "安邑之战",
            "battleYear": 25,
            "battleMonth": 6,
            "battleType": "field",
            "role": "attacker",
            "targetName": "安邑",
            "targetLat": 35.15,
            "targetLng": 111,
            "myTroops": 15000,
            "enemyFactionId": "gengshi",
            "enemyFactionName": "更始",
            "enemyGeneralId": "jibei_wangkuang",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "樊参新授首于解南，王匡尔曹合乌合之众来救河东，吾当一鼓荡平以开西关。"
                },
                {
                    "speaker": "player",
                    "text": "关中劲旅云集安邑，岂容尔偏师猖獗。"
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
            "enemyGeneralId": "bfe_achish",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "迦特王亚吉率非利士军屯利乏音谷欲断南北，孤当亲往迎击，壮士可愿同赴？"
                },
                {
                    "speaker": "player",
                    "text": "愿随大王破敌！"
                }
            ]
        }
    ],
    "xibolai_majiabi": [
        {
            "generalId": "xibolai_majiabi",
            "battleId": "xibolai_majiabi@-165",
            "battleName": "以马忤斯之战",
            "battleYear": -165,
            "battleType": "field",
            "role": "attacker",
            "targetName": "以马忤斯",
            "targetLat": 31.84,
            "targetLng": 34.99,
            "myTroops": 15000,
            "enemyFactionId": "sailiugu",
            "enemyFactionName": "塞琉古帝国",
            "enemyGeneralId": "bfe_cb_sailiugu_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "塞琉古将高尔吉亚分兵夜袭我山营，吾弃空寨燃火反扑其以马忤斯本营，壮士敢随行否？"
                },
                {
                    "speaker": "player",
                    "text": "愿随统帅夜捣敌巢！"
                }
            ]
        },
        {
            "generalId": "xibolai_majiabi",
            "battleId": "xibolai_majiabi@-164",
            "battleName": "伯特夙之战",
            "battleYear": -164,
            "battleType": "field",
            "role": "attacker",
            "targetName": "伯特夙",
            "targetLat": 31.59,
            "targetLng": 35.09,
            "myTroops": 15000,
            "enemyFactionId": "sailiugu",
            "enemyFactionName": "塞琉古帝国",
            "enemyGeneralId": "bfe_cb_sailiugu_2",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "摄政吕西亚斯绕南路自以土买逼我伯特夙，击退此獠便可光复耶路撒冷圣殿，壮士同战否？"
                },
                {
                    "speaker": "player",
                    "text": "誓随统帅光复圣城！"
                }
            ]
        }
    ],
    "xichu_xiangyu": [
        {
            "generalId": "xichu_xiangyu",
            "battleId": "xichu_xiangyu@-207",
            "battleName": "巨鹿之战",
            "battleYear": -207,
            "battleType": "field",
            "role": "attacker",
            "targetName": "巨鹿漳水",
            "targetLat": 37.22,
            "targetLng": 115.03,
            "myTroops": 15000,
            "enemyFactionId": "qin",
            "enemyFactionName": "秦国",
            "enemyGeneralId": "bfe3_17",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "宋义畏秦不前孤已斩之，今渡漳水沉船破釜只留三日粮，不灭王离誓不还，壮士敢死否？"
                },
                {
                    "speaker": "player",
                    "text": "誓随鲁公破釜死战！"
                }
            ]
        },
        {
            "generalId": "xichu_xiangyu",
            "battleId": "xichu_xiangyu@-202",
            "battleName": "垓下之战",
            "battleYear": -202,
            "battleType": "field",
            "role": "attacker",
            "targetName": "垓下",
            "targetLat": 33.32,
            "targetLng": 117.36,
            "myTroops": 15000,
            "enemyFactionId": "han_d",
            "enemyFactionName": "刘汉",
            "enemyGeneralId": "xianyu_hanxin",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "韩信合诸侯之众困孤于垓下，四面虽皆楚歌，孤犹能为公等快战斩将，壮士愿随孤突围否？"
                },
                {
                    "speaker": "player",
                    "text": "誓随霸王决死突围！"
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
    "xiyuduhu_banchao": [
        {
            "generalId": "xiyuduhu_banchao",
            "battleId": "xiyuduhu_banchao@73",
            "battleName": "鄯善之战",
            "battleYear": 73,
            "battleType": "field",
            "role": "attacker",
            "targetName": "扜泥城",
            "targetLat": 40.516,
            "targetLng": 89.92,
            "myTroops": 15000,
            "enemyFactionId": "shanshan",
            "enemyFactionName": "鄯善",
            "enemyGeneralId": "bfe_cb_shanshan_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "不入虎穴焉得虎子，北虏使者甫至而鄯善王广礼敬顿衰，今夜必纵火斩使以定其心。"
                },
                {
                    "speaker": "player",
                    "text": "汉使神威如天降，鄯善举国愿归汉家。"
                }
            ]
        },
        {
            "generalId": "xiyuduhu_banchao",
            "battleId": "xiyuduhu_banchao@94",
            "battleName": "焉耆之战",
            "battleYear": 94,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "员渠城",
            "targetCityId": "city_yanqi",
            "targetLat": 42.06,
            "targetLng": 86.56,
            "myTroops": 15000,
            "enemyFactionId": "yanqi",
            "enemyFactionName": "焉耆",
            "enemyGeneralId": "bfe_cb_yanqi_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "焉耆昔害陈都护，今复绝苇桥拒王师，元孟与尔主若不束手赴营，必夷员渠。"
                },
                {
                    "speaker": "player",
                    "text": "苇桥已断险隘在握，且看汉军如何飞渡。"
                }
            ]
        }
    ],
    "yangzhou_wangping": [
        {
            "generalId": "yangzhou_wangping",
            "battleId": "yangzhou_wangping@231",
            "battleName": "南围之战",
            "battleYear": 231,
            "battleType": "field",
            "role": "attacker",
            "targetName": "祁山",
            "targetLat": 34.23,
            "targetLng": 105.28,
            "myTroops": 15000,
            "enemyFactionId": "caowei",
            "enemyFactionName": "曹魏",
            "enemyGeneralId": "bfe_zhanghe",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "丞相委平独守南围以缀祁山，张隽义虽统劲卒铺天盖地而来，吾当据垒死拒绝不退移。"
                },
                {
                    "speaker": "player",
                    "text": "蜀军主力已赴卤城，且先踏平此座孤围。"
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
    "yidou_luxun": [
        {
            "generalId": "yidou_luxun",
            "battleId": "yidou_luxun@228",
            "battleName": "石亭之战",
            "battleYear": 228,
            "battleType": "field",
            "role": "attacker",
            "targetName": "石亭",
            "targetLat": 30.72,
            "targetLng": 116.72,
            "myTroops": 15000,
            "enemyFactionId": "caowei",
            "enemyFactionName": "曹魏",
            "enemyGeneralId": "bfe_cb_caowei_3",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "曹文烈贵戚骄帅，误信周鲂断发诈降孤军深入皖北石亭，逊统三军合击必碎其全师。"
                },
                {
                    "speaker": "player",
                    "text": "周鲂既献郡印，吾何惜深入取东吴全境。"
                }
            ]
        }
    ],
    "yingzhou_ying_d_muronghuang": [
        {
            "generalId": "yingzhou_ying_d_muronghuang",
            "battleId": "yingzhou_ying_d_muronghuang@342",
            "battleName": "丸都之战",
            "battleYear": 342,
            "battleType": "field",
            "role": "attacker",
            "targetName": "丸都",
            "targetLat": 41.12,
            "targetLng": 126.18,
            "myTroops": 15000,
            "enemyFactionId": "gaogouli",
            "enemyFactionName": "高句丽",
            "enemyGeneralId": "bfe_cb_gaogouli_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "高钊重防平坦北道，吾以偏师诱敌而亲统劲旅潜出南道狭谷，丸都必破。"
                },
                {
                    "speaker": "player",
                    "text": "南道木底险窄难行，吾已置重兵于北路迎敌。"
                }
            ]
        },
        {
            "generalId": "yingzhou_ying_d_muronghuang",
            "battleId": "yingzhou_ying_d_muronghuang@344",
            "battleName": "威德城之战",
            "battleYear": 344,
            "battleType": "field",
            "role": "attacker",
            "targetName": "朝阳",
            "targetLat": 41.57,
            "targetLng": 120.45,
            "myTroops": 15000,
            "enemyFactionId": "xianbei",
            "enemyFactionName": "鲜卑",
            "enemyGeneralId": "bfe_cb_xianbei_1",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "高句丽既服，宇文逸豆归屡寇吾境，孤当偕慕容翰一战荡平漠南。"
                },
                {
                    "speaker": "player",
                    "text": "涉夜干精骑在前，誓死捍卫紫蒙川故土。"
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
            "enemyFactionId": "luoma_gongheguo",
            "enemyFactionName": "罗马共和国",
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
            "enemyFactionId": "luoma_gongheguo",
            "enemyFactionName": "罗马共和国",
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
    "you_gengyan": [
        {
            "generalId": "you_gengyan",
            "battleId": "you_gengyan@29",
            "battleName": "祝阿之战",
            "battleYear": 29,
            "battleMonth": 10,
            "battleType": "field",
            "role": "attacker",
            "targetName": "历下",
            "targetLat": 36.73,
            "targetLng": 116.82,
            "myTroops": 15000,
            "enemyFactionId": "qi_zhangbu",
            "enemyFactionName": "张齐",
            "enemyGeneralId": "bfe_cb_qi_2",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "济水已渡，祝阿旦夕可拔，费邑若敢自历下来援巨里，正落吾围城打援彀中。"
                },
                {
                    "speaker": "player",
                    "text": "齐军连营泰山济水，定教尔有来无回。"
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
    "yuzhou_zuti": [
        {
            "generalId": "yuzhou_zuti",
            "battleId": "yuzhou_zuti@319",
            "battleName": "浚仪谯城之战",
            "battleYear": 319,
            "battleType": "field",
            "role": "attacker",
            "targetName": "谯县",
            "targetLat": 33.88,
            "targetLng": 115.77,
            "myTroops": 15000,
            "enemyFactionId": "hou_zhao",
            "enemyFactionName": "石赵",
            "enemyGeneralId": "shizhao_d_shihu",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "陈川叛附胡虏，石虎虽统骑南援，吾设奇于浚仪平川定教羯骑北遁。"
                },
                {
                    "speaker": "player",
                    "text": "陈川既归大赵，吾当统精骑踏平豫州晋营。"
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
    "zhong_xiexuan": [
        {
            "generalId": "zhong_xiexuan",
            "battleId": "zhong_xiexuan@379",
            "battleName": "君川之战",
            "battleYear": 379,
            "battleType": "field",
            "role": "attacker",
            "targetName": "淮安",
            "targetLat": 33.5,
            "targetLng": 119.13,
            "myTroops": 15000,
            "enemyFactionId": "fushi",
            "enemyFactionName": "苻秦",
            "enemyGeneralId": "bfe_cb_fushi_3",
            "enemyTroops": 15000,
            "introLines": [
                {
                    "speaker": "general",
                    "text": "彭超南围三阿逼广陵，吾统新建京口北府劲卒连捷，决战君川必靖淮南。"
                },
                {
                    "speaker": "player",
                    "text": "襄阳彭城皆已归秦，区区江左新军何足道哉。"
                }
            ]
        }
    ],
};
