/* 自动生成，勿手改：tools/chronicle/import-mainline.mts ← 编年史 json ＋ ChronicleDirectorScript.ts */
import type { ChronicleMainlineEvent } from './ChronicleTypes';

export const CHRONICLE_MAINLINE: readonly ChronicleMainlineEvent[] = [
    {
        "id": "evt_0001",
        "baton": 1,
        "year": -550,
        "season": 2,
        "title": "帕萨尔加德之战",
        "kind": "battle",
        "place": {
            "name": "帕萨尔加德",
            "lat": 30.194,
            "lng": 53.167
        },
        "leadGeneralId": "ailan_julushi",
        "strategic": [
            "公元前五五〇年秋，统辖伊朗高原的米底王国因国王阿斯提阿格斯严苛专断而贵族离心。南方附庸波斯诸部之长居鲁士二世自安善起兵抗命，暗结米底重臣哈尔帕古斯共图大举。阿斯提阿格斯震怒，倾发米底主力御驾南征；居鲁士二世遂将家眷撤入深山，亲统波斯劲旅据守帕萨尔加德山隘迎敌。"
        ],
        "tactical": [
            "帕萨尔加德群峰夹峙、谷口逼仄，居鲁士二世依托高坡列阵。阿斯提阿格斯分兵迂回两翼高山夹击，首日压迫波斯军退保山巅；波斯妇孺出帐激愤将士，全军死志顿起。次日居鲁士二世率众自山顶呐喊俯冲，迎头撞碎仰攻敌阵，米底前军哈尔帕古斯临阵倒戈，米底大军崩溃，阿斯提阿格斯被擒，波斯霸业由此奠基。"
        ],
        "source": "那波尼德编年史；希罗多德·历史·第一卷；大马士革的尼古拉残篇",
        "winner": "defender",
        "battle": {
            "generalId": "ailan_julushi",
            "battleId": "chron:evt_0001",
            "battleName": "帕萨尔加德之战",
            "battleYear": -550,
            "battleType": "field",
            "role": "defender",
            "targetName": "帕萨尔加德",
            "chronicleCity": {
                "cityId": "city_hamadan",
                "before": "midi",
                "after": "aqimeinide"
            },
            "chronicleFrom": "city_bosibolisi",
            "targetLat": 30.194,
            "targetLng": 53.167,
            "myTroops": 15000,
            "enemyFactionId": "midi",
            "enemyFactionName": "米底",
            "enemyGeneralId": "midi_astyages",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0005",
        "baton": 1,
        "year": -547,
        "season": 2,
        "title": "普特里亚之战",
        "kind": "battle",
        "place": {
            "name": "普特里亚",
            "lat": 39.846,
            "lng": 35.333
        },
        "leadGeneralId": "ailan_julushi",
        "strategic": [
            "公元前五四七年秋，东方江淮鏖兵未歇，西亚波斯王居鲁士二世已尽收米底遗产并进驻埃克巴坦那。小亚细亚霸主吕底亚国王克罗伊索斯忌惮波斯坐大，与埃及、巴比伦及斯巴达缔结同盟后先发制人，亲统大军东渡界河哈吕斯河攻陷重镇普特里亚；居鲁士二世闻讯即刻征发诸部疾行西上迎击。"
        ],
        "tactical": [
            "普特里亚位处哈吕斯河东岸卡帕多细亚高原丘陵，城寨与荒原相连。克罗伊索斯纵吕底亚精锐长矛重骑猛冲波斯战线，居鲁士二世督率波斯步弓与山地步卒结成严阵硬顶；两军自白昼肉搏至夜幕降临，尸横原野仍未决胜负。克罗伊索斯见波斯兵势浩大且严冬将临，遂趁夜拔营西渡哈吕斯河退回都城撒狄。"
        ],
        "source": "希罗多德·历史·第一卷；波利艾努斯·战略·第七卷",
        "winner": "draw",
        "battle": {
            "generalId": "ailan_julushi",
            "battleId": "chron:evt_0005",
            "battleName": "普特里亚之战",
            "battleYear": -547,
            "battleType": "field",
            "role": "defender",
            "targetName": "普特里亚",
            "routeVia": [
                {
                    "name": "阿尔贝拉",
                    "lat": 36.19,
                    "lng": 44.01
                }
            ],
            "chronicleFrom": "city_bosibolisi",
            "targetLat": 39.846,
            "targetLng": 35.333,
            "myTroops": 15000,
            "enemyFactionId": "ldiya",
            "enemyFactionName": "吕底亚",
            "enemyGeneralId": "ldiya_keluoyisi",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0006",
        "baton": 1,
        "year": -547,
        "season": 3,
        "title": "提姆布拉会战与撒狄破城",
        "kind": "battle",
        "place": {
            "name": "撒狄提姆布拉平原",
            "lat": 38.48,
            "lng": 28.03
        },
        "leadGeneralId": "ailan_julushi",
        "strategic": [
            "公元前五四七年冬，吕底亚国王克罗伊索斯自普特里亚退返都城撒狄后，断定波斯军绝不敢冒隆冬风雪深入小亚细亚腹地，遂就地遣散随征雇佣军并传檄盟国待明春会师。波斯王居鲁士二世看破敌方麻痹，偕副帅哈尔帕古斯率领轻装主力踏雪昼夜西追，猝然兵临撒狄城东的提姆布拉平原。"
        ],
        "tactical": [
            "提姆布拉平原开阔平坦，克罗伊索斯仓促尽起吕底亚本土长矛重骑张开两翼包抄。居鲁士二世将步弓与战车收拢为纵深方阵，更采纳哈尔帕古斯计策卸下辎重骆驼列于前锋。吕底亚战马冲近闻及骆驼异味顿时惊骇倒窜，骑阵自溃；居鲁士二世挥军掩杀并追围撒狄，遣敢死士攀南侧绝壁破城，一举覆灭吕底亚王国。"
        ],
        "source": "希罗多德·历史·第一卷；色诺芬·居鲁士的教育·第七卷",
        "winner": "attacker",
        "battle": {
            "generalId": "ailan_julushi",
            "battleId": "chron:evt_0006",
            "battleName": "提姆布拉会战与撒狄破城",
            "battleYear": -547,
            "battleType": "field",
            "role": "attacker",
            "targetName": "撒狄提姆布拉平原",
            "chronicleCity": {
                "cityId": "city_sifaerde",
                "before": "ldiya",
                "after": "aqimeinide"
            },
            "chronicleFrom": "city_bosibolisi",
            "targetLat": 38.48,
            "targetLng": 28.03,
            "myTroops": 15000,
            "enemyFactionId": "ldiya",
            "enemyFactionName": "吕底亚",
            "enemyGeneralId": "ldiya_keluoyisi",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0007",
        "baton": 1,
        "year": -546,
        "season": 1,
        "title": "撒狄平叛与普里埃内攻城战",
        "kind": "battle",
        "place": {
            "name": "撒狄卫城与普里埃内",
            "lat": 38.48,
            "lng": 28.03
        },
        "leadGeneralId": "aqimeinide_mazares",
        "strategic": [
            "公元前五四六年夏，东方晋楚诸侯于宋都商丘缔结弭兵之盟暂歇中原干戈，西方波斯新占的吕底亚却烽烟再起。居鲁士二世率主力东返后，受命掌管撒狄金库的吕底亚贵族帕克提亚斯盗用王室黄金招募沿海希腊雇佣兵反叛，将波斯留守总督塔巴卢斯死死围困于撒狄卫城，居鲁士二世急遣米底名将马扎雷斯回师讨伐。"
        ],
        "tactical": [
            "撒狄卫城高踞绝壁之上，塔巴卢斯凭险苦撑待援。马扎雷斯统精骑疾驰抵近撒狄平原，帕克提亚斯慑于波斯主力军威未敢野战，弃围西逃滨海希腊城邦库迈与希俄斯，终被希俄斯人交出受俘。马扎雷斯解撒狄之围后挥师南下梅安德河平原，强攻曾协从叛乱的伊奥尼亚重镇普里埃内并破城惩戒，震慑爱琴海东岸。"
        ],
        "source": "希罗多德·历史·第一卷",
        "winner": "attacker",
        "battle": {
            "generalId": "aqimeinide_mazares",
            "battleId": "chron:evt_0007",
            "battleName": "撒狄平叛与普里埃内攻城战",
            "battleYear": -546,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "撒狄卫城与普里埃内",
            "targetCityId": "city_sifaerde",
            "chronicleCity": {
                "cityId": "city_sifaerde",
                "before": "ldiya",
                "after": "aqimeinide"
            },
            "chronicleFrom": "city_sifaerde",
            "targetLat": 38.48,
            "targetLng": 28.03,
            "myTroops": 15000,
            "enemyFactionId": "ldiya",
            "enemyFactionName": "吕底亚",
            "enemyGeneralId": "ldiya_pactyes",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0008",
        "baton": 1,
        "year": -545,
        "season": 1,
        "title": "福西亚筑山攻城战",
        "kind": "battle",
        "place": {
            "name": "福西亚港城",
            "lat": 38.67,
            "lng": 26.754
        },
        "leadGeneralId": "aqimeinide_harpagus",
        "strategic": [
            "公元前五四五年夏，波斯西疆前任统帅马扎雷斯病卒军中，居鲁士二世遂命开国功臣哈尔帕古斯接掌小亚细亚帅印，继续扫荡拒不臣服的沿海伊奥尼亚诸希腊城邦。其时航海强邦福西亚恃精良五十桨战船与巨石新墙抗命不降，哈尔帕古斯遂集结波斯与吕底亚仆从步骑，将福西亚陆路防线铁桶合围。"
        ],
        "tactical": [
            "福西亚三面环海，陆侧砌有严丝合缝的巨石高墙。哈尔帕古斯摒弃强爬云梯的消耗战法，驱策大军于城外昼夜运土垒石，堆筑直抵女墙高度的攻城土山，以密集波斯步弓居高临下压制守军。福西亚守将见土山迫顶、孤城难支，佯求停战一日商议投降，趁波斯军后撤之隙携全城妇孺尽登快船扬帆西遁，哈尔帕古斯遂入占空城。"
        ],
        "source": "希罗多德·历史·第一卷",
        "winner": "attacker",
        "battle": {
            "generalId": "aqimeinide_harpagus",
            "battleId": "chron:evt_0008",
            "battleName": "福西亚筑山攻城战",
            "battleYear": -545,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "福西亚港城",
            "targetCityId": "city_kelazuomeinai",
            "chronicleCity": {
                "cityId": "city_kelazuomeinai",
                "before": "aiaoniya",
                "after": "aqimeinide"
            },
            "chronicleFrom": "city_sifaerde",
            "targetLat": 38.67,
            "targetLng": 26.754,
            "myTroops": 15000,
            "enemyFactionId": "aiaoniya",
            "enemyFactionName": "爱奥尼亚",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0013",
        "baton": 1,
        "year": -539,
        "season": 2,
        "title": "俄庇斯河岸会战",
        "kind": "battle",
        "place": {
            "name": "底格里斯河畔俄庇斯",
            "lat": 33.18,
            "lng": 44.7
        },
        "leadGeneralId": "ailan_julushi",
        "strategic": [
            "公元前五三九年秋，西地中海海权易手之际，波斯王居鲁士二世已完成东西两翼布局，倾全国精锐西南下两河流域，直指西亚仅存的古国巴比伦。巴比伦王那波尼德因长年驻留阿拉伯绿洲泰马并改易祭祀而致国内祭司贵族离心，闻波斯大军压境，急调美索不达米亚野战主力北上，屯驻底格里斯河重镇俄庇斯阻截。"
        ],
        "tactical": [
            "俄庇斯控扼底格里斯河渡口与米底防线北端要冲，巴比伦军依托河岸运河结阵防守。居鲁士二世督波斯精骑与步弓主力强渡迪亚拉河猛攻俄庇斯正翼，归附波斯的古提姆总督戈布里亚斯率熟悉地形的当地劲旅侧击配合。巴比伦野战军一触即溃、死伤惨重，那波尼德仓皇南逃，波斯军继而不血刃占领西帕尔，直叩巴比伦城门。"
        ],
        "source": "那波尼德编年史；希罗多德·历史·第一卷",
        "winner": "attacker",
        "battle": {
            "generalId": "ailan_julushi",
            "battleId": "chron:evt_0013",
            "battleName": "俄庇斯河岸会战",
            "battleYear": -539,
            "battleType": "field",
            "role": "attacker",
            "targetName": "底格里斯河畔俄庇斯",
            "chronicleCity": {
                "cityId": "city_bageda",
                "before": "jialedi",
                "after": "aqimeinide"
            },
            "routeVia": [
                {
                    "name": "金德斯河",
                    "lat": 33.9,
                    "lng": 44.9
                }
            ],
            "chronicleFrom": "city_bosibolisi",
            "targetLat": 33.18,
            "targetLng": 44.7,
            "myTroops": 15000,
            "enemyFactionId": "jialedi",
            "enemyFactionName": "迦勒底",
            "enemyGeneralId": "bfe2_nabonidus",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0014",
        "baton": 1,
        "year": -539,
        "season": 3,
        "title": "巴比伦导河夺城战",
        "kind": "battle",
        "place": {
            "name": "巴比伦都城",
            "lat": 32.542,
            "lng": 44.421
        },
        "leadGeneralId": "ailan_julushi",
        "strategic": [
            "公元前五三九年冬十月，俄庇斯主力覆没后，巴比伦摄政王储伯沙撒收拢残兵退入号称永不可破的巴比伦巨城，恃高达数丈的双重砖墙与满城积粟准备长期固守。居鲁士二世深知强攻坚城徒耗岁月，遂一面陈兵城下麻痹守军，一面命前锋主帅戈布里亚斯率工兵悄然推进至穿城而过的幼发拉底河上游水闸。"
        ],
        "tactical": [
            "幼发拉底河自北向南贯通巴比伦内城，河口虽设铜栅却疏于防范河道干涸。趁城内彻夜欢庆宗教节庆、守卒醉卧松懈之夜，波斯工兵掘开上游堤岸将河水导入古蓄水大泽，城中水位骤降至齐膝浅滩。戈布里亚斯率突击死士顺河床涉水潜入内城，抢开铜门直捣王宫诛杀伯沙撒，居鲁士二世随即整军入城受降，巴比伦灭亡。"
        ],
        "source": "那波尼德编年史；居鲁士圆柱；希罗多德·历史·第一卷；色诺芬·居鲁士的教育",
        "winner": "attacker",
        "battle": {
            "generalId": "ailan_julushi",
            "battleId": "chron:evt_0014",
            "battleName": "巴比伦导河夺城战",
            "battleYear": -539,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "巴比伦都城",
            "targetCityId": "city_babilun",
            "chronicleCity": {
                "cityId": "city_babilun",
                "before": "jialedi",
                "after": "aqimeinide"
            },
            "routeVia": [
                {
                    "name": "西帕尔",
                    "lat": 33.06,
                    "lng": 44.25
                }
            ],
            "chronicleFrom": "city_bosibolisi",
            "targetLat": 32.542,
            "targetLng": 44.421,
            "myTroops": 15000,
            "enemyFactionId": "jialedi",
            "enemyFactionName": "迦勒底",
            "enemyGeneralId": "wuer_boshasha",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0021",
        "baton": 1,
        "year": -530,
        "season": 1,
        "title": "药杀水马萨革泰决战",
        "kind": "battle",
        "place": {
            "name": "药杀水北岸草原",
            "lat": 40.28,
            "lng": 69.62
        },
        "leadGeneralId": "ailan_julushi",
        "strategic": [
            "公元前五三〇年夏，楚灵王称霸江淮之际，横扫西亚的波斯王居鲁士二世亲率大军北出居鲁士城，决意征服药杀水彼岸的草原强族马萨革泰人。渡河前居鲁士二世立长子冈比西斯二世监国并遣返帕萨尔加德，随即架设浮桥强渡药杀水；马萨革泰女王托米丽司识破求婚缓兵之计，尽起草原各部迎战。"
        ],
        "tactical": [
            "药杀水北岸旷野无垠，马萨革泰骑士善使青铜战斧与强弓，连战马亦披护胸铜甲。居鲁士二世初以美酒佳肴设空营诱伏，擒杀女王之子斯帕尔加皮塞斯；托米丽司悲怒交加，倾全族铁骑发动决死总攻。两军先对射至箭矢俱尽，继而挺矛挥斧短兵肉搏，波斯中军久战崩裂，居鲁士二世力战阵亡，冈比西斯二世嗣登王位。"
        ],
        "source": "希罗多德·历史·第一卷；克特西亚斯·波斯史残篇",
        "winner": "defender",
        "battle": {
            "generalId": "ailan_julushi",
            "battleId": "chron:evt_0021",
            "battleName": "药杀水马萨革泰决战",
            "battleYear": -530,
            "battleType": "field",
            "role": "attacker",
            "targetName": "药杀水北岸草原",
            "chronicleFrom": "city_bosibolisi",
            "targetLat": 40.28,
            "targetLng": 69.62,
            "myTroops": 15000,
            "enemyFactionId": "sijitai",
            "enemyFactionName": "斯基泰",
            "enemyGeneralId": "sijitai_tomyris",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0025",
        "baton": 2,
        "year": -526,
        "season": 2,
        "title": "加沙要塞攻坚战",
        "kind": "battle",
        "place": {
            "name": "加沙要塞",
            "lat": 31.502,
            "lng": 34.467
        },
        "leadGeneralId": "gen_cambyses",
        "strategic": [
            "公元前五二六年秋，埃及老法老阿玛西斯二世病亡、新王普萨美提克三世初立，波斯王冈比西斯二世果断亲统大军自叙利亚南下出征。为穿越干旱绝水、宽逾数日路程的西奈荒漠，冈比西斯二世采纳投奔波斯的哈利卡纳苏斯宿将法涅斯建议与阿拉伯部族缔结皮囊驼队供水盟约，首先猛攻拒不投降的荒漠门户加沙。"
        ],
        "tactical": [
            "加沙筑于滨海高丘之上，控扼黎凡特通往尼罗河三角洲的唯一沿海大道，城中亲埃守军凭坚厚土砖高墙顽强死守。冈比西斯二世以腓尼基舰队封锁海面断其外援，陆上督波斯工兵顶盾填壕、架设攻城冲车昼夜猛撞城垣。历经连旬惨烈仰攻，波斯军终破加沙城防，清空进兵西奈沙漠与埃及国门的最后路障。"
        ],
        "source": "希罗多德·历史·第三卷；波利比乌斯史述补遗",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_cambyses",
            "battleId": "chron:evt_0025",
            "battleName": "加沙要塞攻坚战",
            "battleYear": -526,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "加沙要塞",
            "targetCityId": "city_jiasa",
            "chronicleCity": {
                "cityId": "city_jiasa",
                "before": "feilisidin",
                "after": "aqimeinide"
            },
            "chronicleFrom": "city_susa",
            "targetLat": 31.502,
            "targetLng": 34.467,
            "myTroops": 15000,
            "enemyFactionId": "feilisidin",
            "enemyFactionName": "非利士",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0026",
        "baton": 2,
        "year": -525,
        "season": 0,
        "title": "佩卢西姆决战与孟菲斯破城",
        "kind": "battle",
        "place": {
            "name": "佩卢西姆至孟菲斯",
            "lat": 29.85,
            "lng": 31.25
        },
        "leadGeneralId": "gen_cambyses",
        "strategic": [
            "公元前五二五年春，波斯王冈比西斯二世借阿拉伯万驼送水顺利穿越西奈荒漠，兵临尼罗河东支入海门户佩卢西姆。年轻的埃及法老普萨美提克三世尽起本土武士与希腊、卡里亚雇佣兵精锐在佩卢西姆沙原背城列阵，企图一战将波斯远征军挡在尼罗河三角洲之外。"
        ],
        "tactical": [
            "佩卢西姆地处沼泽与滨海沙脊夹道，两军展开正面血战，希腊与卡里亚雇佣兵拼死搏杀，波斯步弓与铁骑轮番猛冲，阵斩埃及军无数并彻底击溃防线。普萨美提克三世败退孟菲斯闭城固守，冈比西斯二世遣水陆大军溯尼罗河合围猛攻，终破孟菲斯生擒普萨美提克三世，埃及遂入并波斯。"
        ],
        "source": "希罗多德·历史·第三卷；波利艾努斯·战略·第七卷",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_cambyses",
            "battleId": "chron:evt_0026",
            "battleName": "佩卢西姆决战与孟菲斯破城",
            "battleYear": -525,
            "battleType": "field",
            "role": "attacker",
            "targetName": "佩卢西姆至孟菲斯",
            "chronicleCity": {
                "cityId": "city_mengfeisi",
                "before": "aiji",
                "after": "aqimeinide"
            },
            "routeVia": [
                {
                    "name": "佩卢西姆",
                    "lat": 31.04,
                    "lng": 32.54
                }
            ],
            "chronicleFrom": "city_susa",
            "targetLat": 29.85,
            "targetLng": 31.25,
            "myTroops": 15000,
            "enemyFactionId": "aiji",
            "enemyFactionName": "埃及",
            "enemyGeneralId": "aiji_psamtik_iii",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0028",
        "baton": 2,
        "year": -524,
        "season": 1,
        "title": "尼罗河上游远征库施之战",
        "kind": "battle",
        "place": {
            "name": "尼罗河上游第一瀑布南境",
            "lat": 24.088,
            "lng": 32.899
        },
        "leadGeneralId": "gen_cambyses",
        "strategic": [
            "公元前五二四年夏，征服埃及并迫使昔兰尼与利比亚诸部纳贡后，波斯王冈比西斯二世雄心膨胀，决意继续向非洲纵深扩张。他在底比斯分遣偏师西征锡瓦绿洲遭沙暴覆没的同时，自统波斯与埃及混编主力溯尼罗河而上，越过第一瀑布直扑南方强悍善射的库施王国。"
        ],
        "tactical": [
            "尼罗河上游努比亚河谷怪石嶙峋、赤地千里，库施长弓武士依托河岸险滩与要塞逐段袭扰阻击，并以焦土坚壁断绝波斯补给。波斯大军深入荒漠未远便耗尽随军粮草，不得不宰杀驮兽果腹；面对库施守军严密控扼的险恶峡谷与酷热荒漠，冈比西斯二世损兵折将被迫下令北撤孟菲斯，止步于象岛防线。"
        ],
        "source": "希罗多德·历史·第三卷；斯特拉波·地理志·第十七卷",
        "winner": "defender",
        "battle": {
            "generalId": "gen_cambyses",
            "battleId": "chron:evt_0028",
            "battleName": "尼罗河上游远征库施之战",
            "battleYear": -524,
            "battleType": "field",
            "role": "attacker",
            "targetName": "尼罗河上游第一瀑布南境",
            "routeVia": [
                {
                    "name": "底比斯",
                    "lat": 25.7,
                    "lng": 32.64
                }
            ],
            "chronicleFrom": "city_susa",
            "targetLat": 24.088,
            "targetLng": 32.899,
            "myTroops": 15000,
            "enemyFactionId": "kushi",
            "enemyFactionName": "库施",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0031",
        "baton": 3,
        "year": -522,
        "season": 3,
        "title": "扎扎纳会战与首克巴比伦",
        "kind": "battle",
        "place": {
            "name": "幼发拉底河畔扎扎纳与巴比伦",
            "lat": 32.542,
            "lng": 44.421
        },
        "leadGeneralId": "aqimeinide_daliushi",
        "strategic": [
            "公元前五二二年冬十二月，大流士一世刚诛杀高墨达立足未稳，埃兰与巴比伦便相继揭竿而起。巴比伦贵族尼丁图-贝尔自称那波尼德之子尼布甲尼撒三世，尽起两河兵船封锁底格里斯河渡口；大流士一世平息埃兰初乱后亲统波斯与米底劲旅西进，强渡底格里斯河直逼巴比伦外围重镇扎扎纳。"
        ],
        "tactical": [
            "大流士一世先令士卒分乘充气皮囊与战马强行泅渡底格里斯河击破阻截河防，尼丁图-贝尔急率巴比伦主力退至幼发拉底河畔的扎扎纳背水列阵。波斯铁骑与步弓在河滩原野发起雷霆突击，将巴比伦战线拦腰冲断，大批败兵被挤入幼发拉底河急流溺毙；大流士一世乘胜尾追破入巴比伦城，擒斩尼丁图-贝尔。"
        ],
        "source": "贝希斯敦铭文第一至第二栏；希罗多德·历史·第三卷",
        "winner": "attacker",
        "battle": {
            "generalId": "aqimeinide_daliushi",
            "battleId": "chron:evt_0031",
            "battleName": "扎扎纳会战与首克巴比伦",
            "battleYear": -522,
            "battleType": "field",
            "role": "attacker",
            "targetName": "幼发拉底河畔扎扎纳与巴比伦",
            "chronicleCity": {
                "cityId": "city_babilun",
                "before": "jialedi",
                "after": "aqimeinide"
            },
            "routeVia": [
                {
                    "name": "底格里斯河",
                    "lat": 33.35,
                    "lng": 44.4
                }
            ],
            "chronicleFrom": "city_hamadan",
            "targetLat": 32.542,
            "targetLng": 44.421,
            "myTroops": 15000,
            "enemyFactionId": "jialedi",
            "enemyFactionName": "迦勒底",
            "enemyGeneralId": "bfe2_nidintu_bel",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0032",
        "baton": 3,
        "year": -521,
        "season": 1,
        "title": "昆杜鲁什平定米底决战",
        "kind": "battle",
        "place": {
            "name": "米底昆杜鲁什与埃克巴坦那",
            "lat": 34.8,
            "lng": 48.51
        },
        "leadGeneralId": "aqimeinide_daliushi",
        "strategic": [
            "公元前五二一年夏，大流士一世坐镇巴比伦之际，波斯各地行省烽火齐燃，尤以米底贵族弗拉奥尔特斯在埃克巴坦那举旗复国最为凶险。大将许达尔涅斯在马鲁什仅能勉强顶住叛军攻势，大流士一世遂亲率精锐主力自巴比伦拔营东上扎格罗斯山脉，赶赴米底高原与弗拉奥尔特斯展开生死决战。"
        ],
        "tactical": [
            "昆杜鲁什山谷地势开阔起伏，弗拉奥尔特斯集结米底全境骑步精兵排开厚重战线迎击。大流士一世以不死军重步兵稳住中军阵脚，亲督波斯骑兵配合长弓箭雨猛砸米底两翼结合部；激战半日米底大军全线崩溃、死伤枕藉，弗拉奥尔特斯率少数亲骑北逃拉伽被波斯追兵生擒押回埃克巴坦那处死，高原核心重归大流士一世掌控。"
        ],
        "source": "贝希斯敦铭文第二栏",
        "winner": "attacker",
        "battle": {
            "generalId": "aqimeinide_daliushi",
            "battleId": "chron:evt_0032",
            "battleName": "昆杜鲁什平定米底决战",
            "battleYear": -521,
            "battleType": "field",
            "role": "attacker",
            "targetName": "米底昆杜鲁什与埃克巴坦那",
            "chronicleCity": {
                "cityId": "city_hamadan",
                "before": "midi",
                "after": "aqimeinide"
            },
            "chronicleFrom": "city_bosibolisi",
            "targetLat": 34.8,
            "targetLng": 48.51,
            "myTroops": 15000,
            "enemyFactionId": "midi",
            "enemyFactionName": "米底",
            "enemyGeneralId": "midi_phraortes",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0041",
        "baton": 3,
        "year": -512,
        "season": 1,
        "title": "斯特鲁马河征服佩奥尼亚之战",
        "kind": "battle",
        "place": {
            "name": "斯特鲁马河下游山口",
            "lat": 41.1,
            "lng": 23.55
        },
        "leadGeneralId": "aqimeinide_megabazus",
        "strategic": [
            "公元前五一二年夏，大流士一世自多瑙河东返撒狄，特留名将梅加巴佐斯统精兵驻留欧洲经略巴尔干南境。梅加巴佐斯先拔佩林托斯并降服爱琴海北岸色雷斯诸部，继而奉大流士一世诏令西指盛产金矿的斯特鲁马河流域，进讨强悍的佩奥尼亚王国，兵锋直逼马其顿东界。"
        ],
        "tactical": [
            "佩奥尼亚各部闻波斯军西进，尽集主力封锁通往海岸的滨海大道严阵待敌。梅加巴佐斯探明敌军虚实后，雇请色雷斯向导引波斯精锐改走人迹罕至的内陆崇山小径，绕过正面防线直插佩奥尼亚后方空虚城邑。前方佩奥尼亚联军闻家园失守顿时各自溃散回救，被波斯军分段击破，马其顿王阿明塔斯一世亦随之向波斯奉土献水。"
        ],
        "source": "希罗多德·历史·第五卷",
        "winner": "attacker",
        "battle": {
            "generalId": "aqimeinide_megabazus",
            "battleId": "chron:evt_0041",
            "battleName": "斯特鲁马河征服佩奥尼亚之战",
            "battleYear": -512,
            "battleType": "field",
            "role": "attacker",
            "targetName": "斯特鲁马河下游山口",
            "routeVia": [
                {
                    "name": "佩林索斯",
                    "lat": 40.98,
                    "lng": 27.96
                }
            ],
            "chronicleFrom": "city_teluoyi",
            "targetLat": 41.1,
            "targetLng": 23.55,
            "myTroops": 15000,
            "enemyFactionId": "paeonia",
            "enemyFactionName": "佩奥尼亚",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0056",
        "baton": 3,
        "year": -499,
        "season": 1,
        "title": "纳克索斯围城战",
        "kind": "battle",
        "place": {
            "name": "纳克索斯岛主城",
            "lat": 36.965,
            "lng": 25.53
        },
        "leadGeneralId": "aqimeinide_megabates",
        "strategic": [
            "公元前四九九年夏，鲁国围攻郈邑初定山东叛邑之际，爱琴海风云骤起。米利都僭主阿里斯塔哥拉斯欲借纳克索斯流亡贵族之请吞并该岛，遂游说波斯撒狄总督阿尔塔弗涅斯发兵助战，偕波斯统帅梅加巴特斯合统舰队扬帆西渡直扑纳克索斯。"
        ],
        "tactical": [
            "纳克索斯主城背靠海岛险峰，高筑石垣控扼港湾。因联军两帅航途失和走漏风声，岛民早已敛粮入城深沟固垒；波斯与伊奥尼亚联军登岸合围猛攻，奈何城坚粮足久攻不下。待联军军饷耗尽士气低迷，只得焚垒撤回小亚细亚，伊奥尼亚起义由此引爆。"
        ],
        "source": "希罗多德·历史·第五卷",
        "winner": "defender",
        "battle": {
            "generalId": "aqimeinide_megabates",
            "battleId": "chron:evt_0056",
            "battleName": "纳克索斯围城战",
            "battleYear": -499,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "纳克索斯岛主城",
            "targetCityId": "city_chimarros",
            "chronicleCity": {
                "cityId": "city_chimarros",
                "before": "naxos",
                "after": "naxos"
            },
            "routeVia": [
                {
                    "name": "考卡萨",
                    "lat": 38.21,
                    "lng": 25.93
                }
            ],
            "chronicleFrom": "city_miletus",
            "targetLat": 36.965,
            "targetLng": 25.53,
            "myTroops": 15000,
            "enemyFactionId": "naxos",
            "enemyFactionName": "纳克索斯",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0058",
        "baton": 3,
        "year": -498,
        "season": 1,
        "title": "撒狄奇袭战",
        "kind": "battle",
        "place": {
            "name": "吕底亚首府撒狄",
            "lat": 38.48,
            "lng": 28.03
        },
        "leadGeneralId": "gen_artaphernes",
        "strategic": [
            "公元前四九八年夏，阿里斯塔哥拉斯正式举起反叛波斯大旗，渡海求得雅典与埃雷特里亚战船驰援。趁波斯分兵围困米利都而西疆腹地空虚之机，阿里斯塔哥拉斯命兄长卡罗皮努斯率伊奥尼亚与雅典联军自以弗所登陆，循山谷秘道疾袭撒狄。"
        ],
        "tactical": [
            "撒狄下城铺展于特莫卢斯山麓河谷，内卫城高踞险峻陡崖之上。希腊重装步兵猝然杀入下城，波斯总督阿尔塔弗涅斯仓促收拢精兵退守悬崖卫城死战；混战中下城芦苇民居失火延烧全城，阿尔塔弗涅斯督守军突入集市反击，联军攻堡不克遂趁夜撤返海滨。"
        ],
        "source": "希罗多德·历史·第五卷",
        "winner": "defender",
        "battle": {
            "generalId": "gen_artaphernes",
            "battleId": "chron:evt_0058",
            "battleName": "撒狄奇袭战",
            "battleYear": -498,
            "battleType": "siege",
            "role": "defender",
            "targetName": "吕底亚首府撒狄",
            "targetCityId": "city_sifaerde",
            "chronicleCity": {
                "cityId": "city_sifaerde",
                "before": "aqimeinide",
                "after": "aqimeinide"
            },
            "chronicleFrom": "city_sifaerde",
            "targetLat": 38.48,
            "targetLng": 28.03,
            "myTroops": 15000,
            "enemyFactionId": "aiaoniya",
            "enemyFactionName": "爱奥尼亚",
            "enemyGeneralId": "aiaoniya_charopinus",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0059",
        "baton": 3,
        "year": -498,
        "season": 2,
        "title": "以弗所之战",
        "kind": "battle",
        "place": {
            "name": "以弗所城外平原",
            "lat": 37.94,
            "lng": 27.34
        },
        "leadGeneralId": "gen_artaphernes",
        "strategic": [
            "公元前四九八年秋，撒狄下城遭焚震动小亚细亚，驻防哈吕斯河以西各军区的波斯劲旅火速驰援撒狄。会合总督阿尔塔弗涅斯后，波斯追兵得悉希腊联军已翻越山岭退往海口，遂发精锐骑兵沿卡伊斯特河谷昼夜衔尾疾追，于以弗所城外截住联军。"
        ],
        "tactical": [
            "以弗所城外滨海平原开阔无险，疲惫撤退的希腊联军被迫背城结成重步兵横阵应战。波斯军发挥轻重骑兵机动优势，先以密集骑射箭雨反复杀伤希腊盾阵，继而乘联军阵脚松动发起铁骑突击；希腊防线彻底崩溃，埃雷特里亚主帅欧阿尔基德斯阵亡，雅典残军登船西返。"
        ],
        "source": "希罗多德·历史·第五卷",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_artaphernes",
            "battleId": "chron:evt_0059",
            "battleName": "以弗所之战",
            "battleYear": -498,
            "battleType": "field",
            "role": "attacker",
            "targetName": "以弗所城外平原",
            "chronicleFrom": "city_sifaerde",
            "targetLat": 37.94,
            "targetLng": 27.34,
            "myTroops": 15000,
            "enemyFactionId": "aiaoniya",
            "enemyFactionName": "爱奥尼亚",
            "enemyGeneralId": "aiaoniya_charopinus",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0066",
        "baton": 3,
        "year": -494,
        "season": 2,
        "title": "拉德海战",
        "kind": "battle",
        "place": {
            "name": "米利都港外拉德岛海域",
            "lat": 37.53,
            "lng": 27.278
        },
        "leadGeneralId": "gen_artaphernes",
        "strategic": [
            "公元前四九四年秋，东方吴越罢兵讲和之际，西亚波斯王大流士一世集结腓尼基、埃及与塞浦路斯庞大舰队，会同阿尔塔弗涅斯与米底宿将达提斯水陆直扑叛乱策源地米利都。伊奥尼亚诸邦议决弃陆保海，将全部战船聚于米利都港外拉德岛海面背水列阵。"
        ],
        "tactical": [
            "拉德岛控扼米利都海湾咽喉，福西亚名将狄奥尼修斯连日苦练穿插撞击战术，但部分盟军畏苦懈怠并暗通波斯招抚使者。决战当日两军桨舰迎面冲撞，萨摩斯与莱斯博斯分舰队竟临阵扬帆脱逃，唯希俄斯战船浴血死战冲穿敌线终因寡不敌众覆没，伊奥尼亚制海权彻底丧失。"
        ],
        "source": "希罗多德·历史·第六卷",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_artaphernes",
            "battleId": "chron:evt_0066",
            "battleName": "拉德海战",
            "battleYear": -494,
            "battleType": "field",
            "role": "attacker",
            "targetName": "米利都港外拉德岛海域",
            "chronicleFrom": "city_sifaerde",
            "targetLat": 37.53,
            "targetLng": 27.278,
            "myTroops": 15000,
            "enemyFactionId": "aiaoniya",
            "enemyFactionName": "爱奥尼亚",
            "enemyGeneralId": "aiaoniya_dionysius",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0067",
        "baton": 3,
        "year": -494,
        "season": 3,
        "title": "米利都攻城战",
        "kind": "battle",
        "place": {
            "name": "伊奥尼亚首府米利都",
            "lat": 37.53,
            "lng": 27.278
        },
        "leadGeneralId": "gen_artaphernes",
        "strategic": [
            "公元前四九四年冬，拉德海战惨败令米利都彻底断绝海上外援，波斯舰队随即封锁米利都全部海口，与陆路总督阿尔塔弗涅斯、副帅达提斯形成水陆合围。失去盟邦屏障的米利都军民拒绝乞降，全体退入高耸滨海石墙之内，与波斯主力展开绝望的城垣攻防。"
        ],
        "tactical": [
            "米利都坐落梅安德河入海半岛，三面环水、陆墙厚重。波斯军调集近东精湛攻城工兵，一面于墙根开掘地道掏空地基，一面架设重型撞车与攻城高塔昼夜猛砸城垣；外墙终告崩塌，波斯甲士蜂拥入城巷战破敌，将余众迁往两河口岸，持续数载的伊奥尼亚起义至此瓦解。"
        ],
        "source": "希罗多德·历史·第六卷",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_artaphernes",
            "battleId": "chron:evt_0067",
            "battleName": "米利都攻城战",
            "battleYear": -494,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "伊奥尼亚首府米利都",
            "targetCityId": "city_miletus",
            "chronicleCity": {
                "cityId": "city_miletus",
                "before": "aiaoniya",
                "after": "aqimeinide"
            },
            "chronicleFrom": "city_sifaerde",
            "targetLat": 37.53,
            "targetLng": 27.278,
            "myTroops": 15000,
            "enemyFactionId": "aiaoniya",
            "enemyFactionName": "爱奥尼亚",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0070",
        "baton": 3,
        "year": -492,
        "season": 1,
        "title": "马尔多尼乌斯色雷斯远征战",
        "kind": "battle",
        "place": {
            "name": "马其顿东境与阿索斯海角",
            "lat": 40.39,
            "lng": 24.17
        },
        "leadGeneralId": "bfe2_mardonius",
        "strategic": [
            "公元前四九二年夏，波斯王大流士一世彻底平定小亚细亚后，决意跨海惩戒曾助叛军的雅典与埃雷特里亚。大流士一世命女婿马尔多尼乌斯接掌西疆统帅权，先在伊奥尼亚废僭主改行民主安抚人心，旋即统水陆大军渡过赫勒斯滂海峡，沿色雷斯海岸西进马其顿。"
        ],
        "tactical": [
            "波斯舰队迫降萨索斯岛后绕行险峻突出的阿索斯海角，骤遭狂猛北风巨浪袭击，大批战船撞碎于悬崖礁石；与此同时，马尔多尼乌斯陆军在马其顿营地遭悍勇的色雷斯布里吉人乘夜奇袭，马尔多尼乌斯亲冒矢石负伤督战，反击彻底征服布里吉人并收服马其顿，方收兵东返。"
        ],
        "source": "希罗多德·历史·第六卷",
        "winner": "attacker",
        "battle": {
            "generalId": "bfe2_mardonius",
            "battleId": "chron:evt_0070",
            "battleName": "马尔多尼乌斯色雷斯远征战",
            "battleYear": -492,
            "battleType": "field",
            "role": "attacker",
            "targetName": "马其顿东境与阿索斯海角",
            "routeVia": [
                {
                    "name": "奇里乞亚",
                    "lat": 36.95,
                    "lng": 35.2
                },
                {
                    "name": "伊奥尼亚",
                    "lat": 37.94,
                    "lng": 27.34
                },
                {
                    "name": "赫勒斯滂",
                    "lat": 40.23,
                    "lng": 26.4
                }
            ],
            "chronicleFrom": "city_susa",
            "targetLat": 40.39,
            "targetLng": 24.17,
            "myTroops": 15000,
            "enemyFactionId": "seleisi",
            "enemyFactionName": "色雷斯",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0072",
        "baton": 3,
        "year": -490,
        "season": 2,
        "title": "马拉松之战",
        "kind": "battle",
        "place": {
            "name": "阿提卡东岸马拉松平原",
            "lat": 37.98,
            "lng": 23.72
        },
        "leadGeneralId": "gen_datis",
        "strategic": [
            "公元前四百九十年秋，东方晋赵鞅攻克柏人覆灭范氏与中行氏，西方大流士一世改派宿将达提斯统舰队横渡爱琴海。波斯军攻陷埃雷特里亚后，在前雅典僭主希庇亚斯引导下登陆马拉松海湾；雅典将军米太亚德力排众议，率公民重步兵与普拉提亚盟军出城封锁山口。"
        ],
        "tactical": [
            "马拉松平原三面环山、一面临海，两侧沼泽限制骑兵迂回。米太亚德针对波斯宽大战线，刻意削薄中路纵深而加厚两翼重装步兵，全军高歌跑步冲锋避开敌弓箭雨；波斯精兵虽突破希腊薄弱中路，雅典厚实两翼却击溃敌侧后迅速向内合围绞杀，追至海滩夺船大获全胜。"
        ],
        "source": "希罗多德·历史·第六卷",
        "winner": "defender",
        "battle": {
            "generalId": "gen_datis",
            "battleId": "chron:evt_0072",
            "battleName": "马拉松之战",
            "battleYear": -490,
            "battleType": "field",
            "role": "attacker",
            "targetName": "阿提卡东岸马拉松平原",
            "routeVia": [
                {
                    "name": "萨摩斯",
                    "lat": 37.69,
                    "lng": 26.94
                },
                {
                    "name": "纳克索斯",
                    "lat": 37.1,
                    "lng": 25.38
                },
                {
                    "name": "提洛",
                    "lat": 37.4,
                    "lng": 25.27
                },
                {
                    "name": "卡里斯托斯",
                    "lat": 38.02,
                    "lng": 24.42
                },
                {
                    "name": "埃雷特里亚",
                    "lat": 38.39,
                    "lng": 23.79
                }
            ],
            "chronicleFrom": "city_adana",
            "targetLat": 37.98,
            "targetLng": 23.72,
            "myTroops": 15000,
            "enemyFactionId": "xila",
            "enemyFactionName": "雅典",
            "enemyGeneralId": "gen_miltiades",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0081",
        "baton": "4",
        "year": -480,
        "season": 1,
        "title": "温泉关之战",
        "kind": "battle",
        "place": {
            "name": "中希腊门户温泉关隘口",
            "lat": 38.482,
            "lng": 22.501
        },
        "leadGeneralId": "gen_leonidas",
        "strategic": [
            "公元前四百八十年夏，波斯王薛西斯一世统领横跨欧亚的陆海大军架浮桥渡过赫勒斯滂海峡，席卷色雷斯与色萨利直扑中希腊。为争取希腊盟邦集结战备良机，斯巴达王列奥尼达一世亲率王室精锐重步兵与中希腊各邦守军，抢占依山傍海的天险温泉关阻敌。"
        ],
        "tactical": [
            "温泉关南耸绝壁、北临马利亚湾，中门通道极度狭窄。列奥尼达一世督希腊重装步兵结成铜墙盾阵，凭长矛连续两日粉碎波斯前锋与不死军仰攻；不料当地人引希达尔涅斯夜循山脊小径绕袭关后，列奥尼达一世遣散盟军主部，亲率斯巴达与忒斯皮亚壮士死战至全员殉国。"
        ],
        "source": "希罗多德·历史·第七卷；西西里的狄奥多罗斯·历史丛书·第十一卷",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_leonidas",
            "battleId": "chron:evt_0081",
            "battleName": "温泉关之战",
            "battleYear": -480,
            "battleType": "field",
            "role": "defender",
            "targetName": "中希腊门户温泉关隘口",
            "routeVia": [
                {
                    "name": "科林斯",
                    "lat": 37.91,
                    "lng": 22.88
                },
                {
                    "name": "底比斯",
                    "lat": 38.32,
                    "lng": 23.32
                }
            ],
            "chronicleFrom": "city_sparta",
            "targetLat": 38.482,
            "targetLng": 22.501,
            "myTroops": 15000,
            "enemyFactionId": "aqimeinide",
            "enemyFactionName": "阿契美尼德",
            "enemyGeneralId": "bfe2_xerxes_i",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0082",
        "baton": "4",
        "year": -480,
        "season": 2,
        "title": "萨拉米斯海战",
        "kind": "battle",
        "place": {
            "name": "雅典西侧萨拉米斯海峡",
            "lat": 37.98,
            "lng": 23.72
        },
        "leadGeneralId": "gen_themistocles",
        "strategic": [
            "公元前四百八十年秋，波斯军突破温泉关后长驱南下焚毁雅典空城，全城百姓早由雅典主帅地米斯托克利疏散至萨拉米斯岛。面对伯罗奔尼撒诸邦欲退守科林斯地峡的动摇之议，地米斯托克利密遣家仆诈降薛西斯一世，诱使波斯舰队驶入逼仄海峡求战。"
        ],
        "tactical": [
            "萨拉米斯海峡水道曲折狭窄、晨风涌浪湍急，波斯与腓尼基庞大舰群挤入水道后队列拥塞自相碰撞，连卡里亚女王阿尔特米西亚座舰亦陷险境。地米斯托克利与欧里比亚德斯挥动三列桨战船猛撞敌舰侧舷，重步兵跃舷砍杀大破敌军，迫使薛西斯一世率主力退返亚洲。"
        ],
        "source": "希罗多德·历史·第八卷；埃斯库罗斯·波斯人",
        "winner": "defender",
        "battle": {
            "generalId": "gen_themistocles",
            "battleId": "chron:evt_0082",
            "battleName": "萨拉米斯海战",
            "battleYear": -480,
            "battleType": "field",
            "role": "defender",
            "targetName": "雅典西侧萨拉米斯海峡",
            "chronicleFrom": "city_yadian",
            "targetLat": 37.98,
            "targetLng": 23.72,
            "myTroops": 15000,
            "enemyFactionId": "aqimeinide",
            "enemyFactionName": "阿契美尼德",
            "enemyGeneralId": "bfe2_xerxes_i",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0083",
        "baton": "4",
        "year": -479,
        "season": 1,
        "title": "普拉提亚之战",
        "kind": "battle",
        "place": {
            "name": "维奥蒂亚南境普拉提亚原野",
            "lat": 38.32,
            "lng": 23.31
        },
        "leadGeneralId": "gen_aristides",
        "strategic": [
            "公元前四七九年夏，东方楚国叶公沈诸梁平定白公胜之乱之际，留驻希腊的波斯统帅马尔多尼乌斯招降雅典未果，再度南下占领雅典后退至适宜骑兵驰骋的维奥蒂亚平原。斯巴达摄政帕萨尼亚斯与雅典名将阿里斯提德统领希腊重步兵联军翻越基泰龙山迎战。"
        ],
        "tactical": [
            "两军隔阿索波斯河相持多日，马尔多尼乌斯派骑兵截毁泉源迫使联军夜撤调整防线，误判联军溃逃而挥师渡河猛追。帕萨尼亚斯督斯巴达重装方阵顶住波斯柳条盾箭雨后发起反冲，阵斩马尔多尼乌斯，阿里斯提德亦击溃底比斯军并攻破波斯木寨，彻底终结波斯侵希。"
        ],
        "source": "希罗多德·历史·第九卷；普鲁塔克·希腊罗马名人传·阿里斯提德传",
        "winner": "defender",
        "battle": {
            "generalId": "gen_aristides",
            "battleId": "chron:evt_0083",
            "battleName": "普拉提亚之战",
            "battleYear": -479,
            "battleType": "field",
            "role": "defender",
            "targetName": "维奥蒂亚南境普拉提亚原野",
            "chronicleFrom": "city_yadian",
            "targetLat": 38.32,
            "targetLng": 23.31,
            "myTroops": 15000,
            "enemyFactionId": "aqimeinide",
            "enemyFactionName": "阿契美尼德",
            "enemyGeneralId": "bfe2_mardonius",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0084",
        "baton": "4",
        "year": -479,
        "season": 2,
        "title": "米卡列之战",
        "kind": "battle",
        "place": {
            "name": "小亚细亚西岸米卡列海角",
            "lat": 37.53,
            "lng": 27.278
        },
        "leadGeneralId": "lagoniya_leotychidas",
        "strategic": [
            "公元前四七九年秋，普拉提亚陆战决胜同期，斯巴达王莱奥提基达斯与雅典统帅克桑提普斯率希腊联合舰队驻泊提洛岛，应萨摩斯秘密使者之请横渡爱琴海反攻小亚细亚。驻守萨摩斯的波斯舰队慑于海战失利，退往对岸米卡列山麓拖船上滩筑寨与陆军合营。"
        ],
        "tactical": [
            "米卡列山脉直插爱琴海面，波斯统帅提格拉涅斯沿海滩修筑木石营垒护卫战船，并收缴伊奥尼亚仆从军兵械。克桑提普斯率雅典重步兵沿海岸率先猛扑破垒，莱奥提基达斯率斯巴达军翻山自侧后杀到，阵中伊奥尼亚人临阵倒戈，联军斩杀提格拉涅斯并焚毁波斯舰队。"
        ],
        "source": "希罗多德·历史·第九卷；西西里的狄奥多罗斯·历史丛书·第十一卷",
        "winner": "attacker",
        "battle": {
            "generalId": "lagoniya_leotychidas",
            "battleId": "chron:evt_0084",
            "battleName": "米卡列之战",
            "battleYear": -479,
            "battleType": "field",
            "role": "attacker",
            "targetName": "小亚细亚西岸米卡列海角",
            "routeVia": [
                {
                    "name": "萨摩斯",
                    "lat": 37.69,
                    "lng": 26.94
                }
            ],
            "chronicleFrom": "city_chimarros",
            "targetLat": 37.53,
            "targetLng": 27.278,
            "myTroops": 15000,
            "enemyFactionId": "aqimeinide",
            "enemyFactionName": "阿契美尼德",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0085",
        "baton": "4",
        "year": -478,
        "season": 1,
        "title": "拜占庭攻城战",
        "kind": "battle",
        "place": {
            "name": "博斯普鲁斯海峡要塞拜占庭",
            "lat": 41.01,
            "lng": 28.97
        },
        "leadGeneralId": "gen_aristides",
        "strategic": [
            "公元前四七八年夏，东方越王勾践乘夜偷渡笠泽重创吴师、楚惠王攻灭陈国之际，爱琴海希腊联军乘胜扩大战果。斯巴达摄政帕萨尼亚斯会同雅典统帅阿里斯提德与米太亚德之子客蒙，先扬帆南略塞浦路斯诸城，旋即北航直扑控扼黑海粮道咽喉的波斯重镇拜占庭。"
        ],
        "tactical": [
            "拜占庭三面环海，扼守欧亚两洲交汇的湍急海峡，陆侧筑有坚固石墙。联军舰队彻底切断海峡水上补给，登陆重装步兵轮番猛攻陆墙，终破坚城并俘获大批波斯王室亲贵；然帕萨尼亚斯破城后骄横跋扈私放贵俘，致使诸海邦离心转奉阿里斯提德与雅典组建提洛同盟。"
        ],
        "source": "修昔底德·伯罗奔尼撒战争史·第一卷；普鲁塔克·希腊罗马名人传·客蒙传",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_aristides",
            "battleId": "chron:evt_0085",
            "battleName": "拜占庭攻城战",
            "battleYear": -478,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "博斯普鲁斯海峡要塞拜占庭",
            "targetCityId": "city_junshitandingbao",
            "chronicleCity": {
                "cityId": "city_junshitandingbao",
                "before": "aqimeinide",
                "after": "lagoniya"
            },
            "chronicleFrom": "city_yadian",
            "targetLat": 41.01,
            "targetLng": 28.97,
            "myTroops": 15000,
            "enemyFactionId": "aqimeinide",
            "enemyFactionName": "阿契美尼德",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0087",
        "baton": "5",
        "year": -476,
        "season": 0,
        "title": "埃伊翁围城战",
        "kind": "battle",
        "place": {
            "name": "斯特鲁马河口重镇埃伊翁",
            "lat": 40.82,
            "lng": 23.85
        },
        "leadGeneralId": "xila_cimon",
        "strategic": [
            "公元前四七六年春，新成立的提洛同盟由米太亚德之子客蒙出任全军统帅，开启肃清波斯驻欧洲残余据点的首次远征。客蒙驱逐盘踞拜占庭的帕萨尼亚斯后，率同盟舰队西航色雷斯南岸，直扑控扼斯特鲁马河口金银林木资源的波斯坚城埃伊翁。"
        ],
        "tactical": [
            "埃伊翁紧邻入海河口，城垣由泥砖砌筑。客蒙先在城外野战击退波斯守将博格斯，继而扫荡周边供粮的色雷斯部族，更引河水浸泡冲塌泥砖城墙；博格斯拒受议和撤离条款，粮尽绝境下将城中金银尽沉河底并携家眷投火自焚殉国，客蒙遂拔除这座色雷斯门户重镇。"
        ],
        "source": "希罗多德·历史·第七卷；修昔底德·伯罗奔尼撒战争史·第一卷；普鲁塔克·客蒙传",
        "winner": "attacker",
        "battle": {
            "generalId": "xila_cimon",
            "battleId": "chron:evt_0087",
            "battleName": "埃伊翁围城战",
            "battleYear": -476,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "斯特鲁马河口重镇埃伊翁",
            "targetCityId": "city_anfeibolisi",
            "chronicleCity": {
                "cityId": "city_anfeibolisi",
                "before": "aqimeinide",
                "after": "xila"
            },
            "chronicleFrom": "city_yadian",
            "targetLat": 40.82,
            "targetLng": 23.85,
            "myTroops": 15000,
            "enemyFactionId": "aqimeinide",
            "enemyFactionName": "阿契美尼德",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0092",
        "baton": "5",
        "year": -470,
        "season": 1,
        "title": "提洛同盟平定纳克索斯之战",
        "kind": "battle",
        "place": {
            "name": "基克拉泽斯群岛纳克索斯城",
            "lat": 36.965,
            "lng": 25.53
        },
        "leadGeneralId": "xila_cimon",
        "strategic": [
            "公元前四百七十年夏，斯巴达查办暗通波斯的前摄政帕萨尼亚斯之际，海上霸主提洛同盟内部首次爆发盟邦退盟危机。爱琴海富庶大岛纳克索斯厌倦无休止缴纳军费与战船，公开宣布脱离提洛同盟；雅典统帅客蒙决不允许同盟解体，当即调集同盟主力舰队跨海讨伐。"
        ],
        "tactical": [
            "纳克索斯岛民依仗坚城与自身舰队据港死守，流亡东奔波斯的地米斯托克利座船亦在风暴中险入雅典封锁圈。客蒙以优势三列桨战船锁死全岛海路，登陆重步兵筑起围墙久困坚城；纳克索斯终因粮尽投降，被迫拆毁城墙、交出战船并丧失自治沦为纳贡附庸。"
        ],
        "source": "修昔底德·伯罗奔尼撒战争史·第一卷",
        "winner": "attacker",
        "battle": {
            "generalId": "xila_cimon",
            "battleId": "chron:evt_0092",
            "battleName": "提洛同盟平定纳克索斯之战",
            "battleYear": -470,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "基克拉泽斯群岛纳克索斯城",
            "targetCityId": "city_chimarros",
            "chronicleCity": {
                "cityId": "city_chimarros",
                "before": "naxos",
                "after": "xila"
            },
            "chronicleFrom": "city_yadian",
            "targetLat": 36.965,
            "targetLng": 25.53,
            "myTroops": 15000,
            "enemyFactionId": "naxos",
            "enemyFactionName": "纳克索斯",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0094",
        "baton": "5",
        "year": -466,
        "season": 1,
        "title": "欧律墨冬水陆会战",
        "kind": "battle",
        "place": {
            "name": "潘菲利亚欧律墨冬河口",
            "lat": 36.939,
            "lng": 31.172
        },
        "leadGeneralId": "xila_cimon",
        "strategic": [
            "公元前四六六年夏，东方晋知瑶再度伐郑之际，波斯在小亚细亚南岸潘菲利亚欧律墨冬河口秘密集结庞大腓尼基舰队与陆军，企图反扑爱琴海。提洛同盟统帅客蒙闻讯先发制人，率经过甲板加宽改造的三列桨战船东航迫降法塞利斯，直扑欧律墨冬河口求战。"
        ],
        "tactical": [
            "欧律墨冬河口水道略窄，波斯舰队因待援不愿远出，退入河口依托岸上陆营自保。客蒙挥舰队猛冲入河，波斯船员弃船登岸，同盟军俘毁大批敌舰；客蒙当机立断命雅典重步兵乘夜抢滩仰攻波斯陆营，历经白刃血战攻破大营，创下同日海陆双捷壮举。"
        ],
        "source": "修昔底德·伯罗奔尼撒战争史·第一卷；普鲁塔克·希腊罗马名人传·客蒙传",
        "winner": "attacker",
        "battle": {
            "generalId": "xila_cimon",
            "battleId": "chron:evt_0094",
            "battleName": "欧律墨冬水陆会战",
            "battleYear": -466,
            "battleType": "field",
            "role": "attacker",
            "targetName": "潘菲利亚欧律墨冬河口",
            "routeVia": [
                {
                    "name": "克尼多斯",
                    "lat": 36.69,
                    "lng": 27.37
                },
                {
                    "name": "法塞利斯",
                    "lat": 36.52,
                    "lng": 30.55
                }
            ],
            "chronicleFrom": "city_yadian",
            "targetLat": 36.939,
            "targetLng": 31.172,
            "myTroops": 15000,
            "enemyFactionId": "aqimeinide",
            "enemyFactionName": "阿契美尼德",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0096",
        "baton": "5",
        "year": -464,
        "season": 1,
        "title": "伊托美山黑劳士起义战",
        "kind": "battle",
        "place": {
            "name": "拉科尼亚斯巴达至伊托美山",
            "lat": 37.185,
            "lng": 21.925
        },
        "leadGeneralId": "lagoniya_archidamus_ii",
        "strategic": [
            "公元前四六四年夏，波斯新王阿尔塔薛西斯一世稳定王位、东方晋知瑶与赵襄子伐郑结怨之际，伯罗奔尼撒霸主斯巴达突遭灭顶强震。泰格托斯山崩夷平城舍，美塞尼亚黑劳士农奴与边民乘机揭竿暴动，正欲暗助萨索斯的斯巴达瞬间陷入存亡绝境。"
        ],
        "tactical": [
            "起义军蜂拥杀向毫无城墙的斯巴达市区，国王阿基达姆斯二世临危吹响战号，召集幸存公民武士抢占郊外高地结成重步兵盾阵。起义军见斯巴达主力严整未敢强冲，遂西退美塞尼亚天险伊托美山绝顶筑石垒据守；斯巴达军追至山下仰攻受挫，由此陷入旷日持久的山地围困战。"
        ],
        "source": "修昔底德·伯罗奔尼撒战争史·第一卷；西西里的狄奥多罗斯·历史丛书·第十一卷",
        "winner": "defender",
        "battle": {
            "generalId": "lagoniya_archidamus_ii",
            "battleId": "chron:evt_0096",
            "battleName": "伊托美山黑劳士起义战",
            "battleYear": -464,
            "battleType": "siege",
            "role": "defender",
            "targetName": "拉科尼亚斯巴达至伊托美山",
            "targetCityId": "city_sparta",
            "chronicleCity": {
                "cityId": "city_sparta",
                "before": "lagoniya",
                "after": "lagoniya"
            },
            "chronicleFrom": "city_sparta",
            "targetLat": 37.185,
            "targetLng": 21.925,
            "myTroops": 15000,
            "enemyFactionId": "messenia",
            "enemyFactionName": "美塞尼亚",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0102",
        "baton": "6A",
        "year": -457,
        "season": 1,
        "title": "塔纳格拉之战",
        "kind": "battle",
        "place": {
            "name": "维奥蒂亚东南塔纳格拉原野",
            "lat": 38.32,
            "lng": 23.31
        },
        "leadGeneralId": "xila_pericles",
        "strategic": [
            "公元前四五七年夏，斯巴达王室摄政尼科美德斯借援助母邦多里斯之名，统伯罗奔尼撒重步兵北越海湾进入中希腊扶持底比斯。雅典察觉斯巴达暗结城内寡头图谋颠覆民主并阻挠修筑长墙，一面封锁地峡归路，一面倾发全城兵力会合阿尔戈斯与色萨利骑兵赴塔纳格拉迎击。"
        ],
        "tactical": [
            "塔纳格拉丘陵河谷交错，流亡的客蒙赴阵请战遭拒后嘱门生奋死报国。两军重装步兵盾墙正面猛撞，客蒙门生全员战死，不料雅典侧翼的色萨利骑兵临阵叛投斯巴达并反袭辎重；两日血战死伤枕藉，尼科美德斯虽获惨胜夺路经墨伽拉南返，却已无力进逼雅典城。"
        ],
        "source": "修昔底德·伯罗奔尼撒战争史·第一卷；普鲁塔克·希腊罗马名人传·客蒙传",
        "winner": "defender",
        "battle": {
            "generalId": "xila_pericles",
            "battleId": "chron:evt_0102",
            "battleName": "塔纳格拉之战",
            "battleYear": -457,
            "battleType": "field",
            "role": "attacker",
            "targetName": "维奥蒂亚东南塔纳格拉原野",
            "chronicleFrom": "city_yadian",
            "targetLat": 38.32,
            "targetLng": 23.31,
            "myTroops": 15000,
            "enemyFactionId": "lagoniya",
            "enemyFactionName": "斯巴达",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0103",
        "baton": "6A",
        "year": -457,
        "season": 2,
        "title": "奥诺菲塔之战",
        "kind": "battle",
        "place": {
            "name": "阿索波斯河谷奥诺菲塔",
            "lat": 38.32,
            "lng": 23.31
        },
        "leadGeneralId": "xila_myronides",
        "strategic": [
            "公元前四五七年秋，斯巴达大军自塔纳格拉撤返伯罗奔尼撒甫逾两月，不屈的雅典人已重整军备决意反击。为拔除斯巴达在中希腊扶持的维奥蒂亚盟友、屏护阿提卡北疆，雅典宿将米隆尼德斯再度统领公民重装步兵翻越帕尔奈斯山脉，疾扑奥诺菲塔与维奥蒂亚联军决战。"
        ],
        "tactical": [
            "奥诺菲塔控扼阿索波斯河谷平坝，维奥蒂亚诸邦集结重步兵与精良骑兵严阵阻截。米隆尼德斯不待右翼完全展开便抓住战机挥左翼精锐猛扑敌阵，酣战击溃维奥蒂亚主力；雅典军乘胜拆毁塔纳格拉城墙，将维奥蒂亚诸城与福基斯纳入霸权，同年迫降埃吉纳并建成雅典长墙。"
        ],
        "source": "修昔底德·伯罗奔尼撒战争史·第一卷；西西里的狄奥多罗斯·历史丛书·第十一卷",
        "winner": "attacker",
        "battle": {
            "generalId": "xila_myronides",
            "battleId": "chron:evt_0103",
            "battleName": "奥诺菲塔之战",
            "battleYear": -457,
            "battleType": "field",
            "role": "attacker",
            "targetName": "阿索波斯河谷奥诺菲塔",
            "chronicleFrom": "city_yadian",
            "targetLat": 38.32,
            "targetLng": 23.31,
            "myTroops": 15000,
            "enemyFactionId": "boootiya",
            "enemyFactionName": "底比斯",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0105",
        "baton": "6A",
        "year": -455,
        "season": 1,
        "title": "吉雄港奇袭焚舰战",
        "kind": "battle",
        "place": {
            "name": "拉科尼亚海湾吉雄军港",
            "lat": 37.07,
            "lng": 22.42
        },
        "leadGeneralId": "xila_tolmides",
        "strategic": [
            "公元前四五五年夏，东方晋国知瑶联合韩魏举兵围困赵襄子于晋阳之际，希腊战场雅典借中希腊大捷之威向伯罗奔尼撒本土发动海上攻势。雅典猛将托尔米德斯奉命率精挑重装步兵与三列桨舰队南绕马利亚海角，直插斯巴达腹地唯一的海军造船基地吉雄港。"
        ],
        "tactical": [
            "吉雄港深藏拉科尼亚海湾西岸，为斯巴达海防咽喉。托尔米德斯舰队猝然突入港湾，雅典士兵抢滩击溃港口守卫，将斯巴达船坞、战船与军械库尽数焚毁；舰队旋即环航西进科林斯湾攻取卡尔基斯，并将撤离伊托美山的美塞尼亚人安置在要塞纳夫帕克托斯锁扼海口。"
        ],
        "source": "修昔底德·伯罗奔尼撒战争史·第一卷；保萨尼亚斯·希腊志·第一卷",
        "winner": "attacker",
        "battle": {
            "generalId": "xila_tolmides",
            "battleId": "chron:evt_0105",
            "battleName": "吉雄港奇袭焚舰战",
            "battleYear": -455,
            "battleType": "field",
            "role": "attacker",
            "targetName": "拉科尼亚海湾吉雄军港",
            "chronicleFrom": "city_yadian",
            "targetLat": 37.07,
            "targetLng": 22.42,
            "myTroops": 15000,
            "enemyFactionId": "lagoniya",
            "enemyFactionName": "斯巴达",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0109",
        "baton": "6A",
        "year": -450,
        "season": 1,
        "title": "塞浦路斯萨拉米斯之战",
        "kind": "battle",
        "place": {
            "name": "塞浦路斯东岸萨拉米斯海域",
            "lat": 35.12,
            "lng": 33.94
        },
        "leadGeneralId": "xila_cimon",
        "strategic": [
            "公元前四百五十年夏，西西里叙拉古在诺迈击败杜凯提乌斯同时，重掌帅印的雅典宿将客蒙借本土休战之机，统提洛同盟舰队远征塞浦路斯并围攻重镇基提翁。围城期间客蒙不幸染病卒于军中，继任将领秘不发丧拔营东航，于萨拉米斯海面迎战波斯拦击大军。"
        ],
        "tactical": [
            "塞浦路斯东端萨拉米斯海湾宽阔平缓，波斯集结腓尼基与奇里乞亚舰队配合岸上陆军企图截歼希腊撤军。雅典将士哀兵奋战，先在海面以凌厉冲角战术大破腓尼基舰队夺毁敌船，继而顺势抢滩冲上陆岸击溃波斯步骑阵列，赢下希波终战海陆双捷后全身返航雅典。"
        ],
        "source": "修昔底德·伯罗奔尼撒战争史·第一卷；西西里的狄奥多罗斯·历史丛书·第十二卷；普鲁塔克·客蒙传",
        "winner": "attacker",
        "battle": {
            "generalId": "xila_cimon",
            "battleId": "chron:evt_0109",
            "battleName": "塞浦路斯萨拉米斯之战",
            "battleYear": -450,
            "battleType": "field",
            "role": "attacker",
            "targetName": "塞浦路斯东岸萨拉米斯海域",
            "chronicleFrom": "city_yadian",
            "targetLat": 35.12,
            "targetLng": 33.94,
            "myTroops": 15000,
            "enemyFactionId": "aqimeinide",
            "enemyFactionName": "阿契美尼德",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0111",
        "baton": "6A",
        "year": -447,
        "season": 2,
        "title": "科罗尼亚之战",
        "kind": "battle",
        "place": {
            "name": "科帕伊斯湖西岸科罗尼亚",
            "lat": 38.32,
            "lng": 23.31
        },
        "leadGeneralId": "xila_tolmides",
        "strategic": [
            "公元前四四七年秋，东方楚惠王发兵东扩攻灭下蔡之际，雅典在中希腊的陆上霸权突发剧震。遭流放的维奥蒂亚寡头贵族据占奥尔霍迈诺斯与喀罗尼亚反叛，伯里克利力劝稳妥集结大军再战，素以悍勇著称的将领托尔米德斯却轻敌急进，仅率偏师志愿重步兵仓促北征。"
        ],
        "tactical": [
            "托尔米德斯初克喀罗尼亚留兵驻守，拔营南返途经科帕伊斯湖畔科罗尼亚狭窄原野时，突遭底比斯主帅斯帕尔顿统领的维奥蒂亚与优卑亚流亡联军伏击。联军凭优势兵力与精骑截断雅典行军纵队，托尔米德斯力战阵亡、残部被俘，雅典为赎战俘被迫放弃维奥蒂亚霸权。"
        ],
        "source": "修昔底德·伯罗奔尼撒战争史·第一卷；普鲁塔克·希腊罗马名人传·伯里克利传",
        "winner": "attacker",
        "battle": {
            "generalId": "xila_tolmides",
            "battleId": "chron:evt_0111",
            "battleName": "科罗尼亚之战",
            "battleYear": -447,
            "battleType": "field",
            "role": "defender",
            "targetName": "科帕伊斯湖西岸科罗尼亚",
            "chronicleFrom": "city_yadian",
            "targetLat": 38.32,
            "targetLng": 23.31,
            "myTroops": 15000,
            "enemyFactionId": "boootiya",
            "enemyFactionName": "底比斯",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0117",
        "baton": "6A",
        "year": -440,
        "season": 1,
        "title": "萨摩斯围城战",
        "kind": "battle",
        "place": {
            "name": "特拉吉亚岛海面至萨摩斯主城",
            "lat": 37.53,
            "lng": 27.278
        },
        "leadGeneralId": "xila_pericles",
        "strategic": [
            "公元前四百四十年夏，东方周考王初立之际，伯里克利初定萨摩斯改建民主制旋遭变故：流亡寡头借波斯撒狄总督皮苏特涅斯雇佣兵夜袭复辟，劫回人质并策动拜占庭同叛。面对同盟分裂危局，伯里克利偕同僚索福克勒斯亲统雅典战舰东进，于特拉吉亚海面迎敌。"
        ],
        "tactical": [
            "特拉吉亚岛扼守萨摩斯南航水道，哲学家统帅梅利苏斯率萨摩斯船队迎战。伯里克利以精练战舰穿插敌船间隙大获全胜，随即登岛筑起三道围墙水陆封锁萨摩斯城；虽中途分舰南防腓尼基水师致留守军一度受挫，伯里克利旋即回师增援困守九月，终迫萨摩斯拆墙献舰投降。"
        ],
        "source": "修昔底德·伯罗奔尼撒战争史·第一卷；普鲁塔克·希腊罗马名人传·伯里克利传",
        "winner": "attacker",
        "battle": {
            "generalId": "xila_pericles",
            "battleId": "chron:evt_0117",
            "battleName": "萨摩斯围城战",
            "battleYear": -440,
            "battleType": "field",
            "role": "attacker",
            "targetName": "特拉吉亚岛海面至萨摩斯主城",
            "chronicleFrom": "city_yadian",
            "targetLat": 37.53,
            "targetLng": 27.278,
            "myTroops": 15000,
            "enemyFactionId": "aiaoniya",
            "enemyFactionName": "爱奥尼亚",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0118",
        "baton": "6A",
        "year": -439,
        "season": 0,
        "title": "萨摩斯围城受降战",
        "kind": "battle",
        "place": {
            "name": "爱琴海东岸萨摩斯城",
            "lat": 37.53,
            "lng": 27.278
        },
        "leadGeneralId": "xila_pericles",
        "strategic": [
            "公元前四三九年春，爱琴海东岸萨摩斯邦因与米利都争夺普里埃内抗拒雅典仲裁，获波斯吕底亚总督暗助起兵反叛提洛同盟。雅典首席将军伯里克利偕将领哈格农统舰队跨海合围萨摩斯港城，阻断腓尼基船队驰援风声，决意拔除东翼离心强邦。"
        ],
        "tactical": [
            "萨摩斯城背山面海，石砌城垣坚厚严整。哈格农与伯里克利分筑陆上三道围墙锁死陆路，并以三层桨战船严密封锁海口，轮番推进带顶冲车撞击城防；守帅梅利苏斯虽曾乘隙突袭海防，终因外援断绝与城中粮尽开城投降，拆毁城墙交出战船并纳赔款。"
        ],
        "source": "修昔底德·伯罗奔尼撒战争史·第一卷；普鲁塔克·伯里克利传",
        "winner": "attacker",
        "battle": {
            "generalId": "xila_pericles",
            "battleId": "chron:evt_0118",
            "battleName": "萨摩斯围城受降战",
            "battleYear": -439,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "爱琴海东岸萨摩斯城",
            "targetCityId": "city_miletus",
            "chronicleCity": {
                "cityId": "city_miletus",
                "before": "aiaoniya",
                "after": "xila"
            },
            "chronicleFrom": "city_yadian",
            "targetLat": 37.53,
            "targetLng": 27.278,
            "myTroops": 15000,
            "enemyFactionId": "aiaoniya",
            "enemyFactionName": "爱奥尼亚",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0121",
        "baton": "6B",
        "year": -436,
        "season": 0,
        "title": "安菲波利斯拓殖破敌战",
        "kind": "battle",
        "place": {
            "name": "斯特里蒙河湾九道口",
            "lat": 40.82,
            "lng": 23.85
        },
        "leadGeneralId": "xila_hagenong",
        "strategic": [
            "公元前四三六年春，罗马痛击维伊之后，雅典将战略重心投向富产造船良木与庞盖翁山白银的北爱琴海色雷斯沿岸。此前雅典移民曾遭当地强悍的埃多尼部族覆灭，雅典遂命宿将哈格农自海港埃伊翁率重步兵与拓殖船队溯河而上，强夺斯特里蒙河湾要冲。"
        ],
        "tactical": [
            "九道口三面为斯特里蒙河深水急流环绕，一面衔接内陆丘陵，地势天成险固。埃多尼武士持轻盾标枪据守高坡阻击，哈格农以雅典重装步兵方阵稳步推进驱逐埃多尼部众，随即横跨河湾两端修筑绵延高墙将半岛彻底锁闭，建成北方重镇安菲波利斯。"
        ],
        "source": "修昔底德·伯罗奔尼撒战争史·第四卷；狄奥多罗斯·历史丛书·第十二卷",
        "winner": "attacker",
        "battle": {
            "generalId": "xila_hagenong",
            "battleId": "chron:evt_0121",
            "battleName": "安菲波利斯拓殖破敌战",
            "battleYear": -436,
            "battleType": "field",
            "role": "attacker",
            "targetName": "斯特里蒙河湾九道口",
            "chronicleCity": {
                "cityId": "city_anfeibolisi",
                "before": "seleisi",
                "after": "xila"
            },
            "chronicleFrom": "city_anfeibolisi",
            "targetLat": 40.82,
            "targetLng": 23.85,
            "myTroops": 15000,
            "enemyFactionId": "seleisi",
            "enemyFactionName": "色雷斯",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0126",
        "baton": "6B",
        "year": -429,
        "season": 2,
        "title": "诺帕克都海峡反击战",
        "kind": "battle",
        "place": {
            "name": "科林斯湾口诺帕克都外海",
            "lat": 38.392,
            "lng": 21.828
        },
        "leadGeneralId": "gen_brasidas",
        "strategic": [
            "公元前四二九年秋，雅典困降波提狄亚后，西海提督福尔米奥在里昂海峡以少胜多挫败伯罗奔尼撒舰队。斯巴达急派巴西达斯等督战委员辅佐克涅穆斯，集结优势战船重返科林斯湾口，企图引诱福尔米奥离开开阔海面，一举夺取西海基地诺帕克都。"
        ],
        "tactical": [
            "诺帕克都港外水道渐窄、北岸浅滩密布。克涅穆斯与巴西达斯佯扑诺帕克都港，诱使福尔米奥率单纵队贴岸急航回救，随即调头将雅典后卫逼搁浅滩；绝境中一艘雅典殿后快船绕锚泊商船急旋，拦腰撞沉追击的斯巴达指挥舰，福尔米奥乘乱反扑大破敌舰。"
        ],
        "source": "修昔底德·伯罗奔尼撒战争史·第二卷；波利艾努斯·战略·第三卷",
        "winner": "defender",
        "battle": {
            "generalId": "gen_brasidas",
            "battleId": "chron:evt_0126",
            "battleName": "诺帕克都海峡反击战",
            "battleYear": -429,
            "battleType": "field",
            "role": "attacker",
            "targetName": "科林斯湾口诺帕克都外海",
            "chronicleFrom": "city_aolinpiya",
            "targetLat": 38.392,
            "targetLng": 21.828,
            "myTroops": 15000,
            "enemyFactionId": "xila",
            "enemyFactionName": "雅典",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0129",
        "baton": "6B",
        "year": -426,
        "season": 3,
        "title": "奥尔派山谷伏击会战",
        "kind": "battle",
        "place": {
            "name": "安布拉基亚湾奥尔派山岗",
            "lat": 39.16,
            "lng": 20.98
        },
        "leadGeneralId": "xila_demosthenes",
        "strategic": [
            "公元前四二六年冬，战火蔓延至希腊西北部安布拉基亚湾。安布拉基亚大举进犯雅典盟友阿卡纳尼亚并占领海滨山堡奥尔派，斯巴达统帅欧律洛库斯率重步兵绕过封锁线与之会师；阿卡纳尼亚人急迎雅典名将德摩斯梯尼统掌联军帅印阻击。"
        ],
        "tactical": [
            "奥尔派背海面山，两军营垒间横亘深涧，右翼荒坡杂草丛生。德摩斯梯尼深知兵力不及敌军宽大正线，预先将精锐重步兵与标枪手暗伏于灌木洼地；待欧律洛库斯统左翼迂回包抄之际，伏兵自敌背呐喊杀出，阵斩欧律洛库斯并重创安布拉基亚主力。"
        ],
        "source": "修昔底德·伯罗奔尼撒战争史·第三卷",
        "winner": "defender",
        "battle": {
            "generalId": "xila_demosthenes",
            "battleId": "chron:evt_0129",
            "battleName": "奥尔派山谷伏击会战",
            "battleYear": -426,
            "battleType": "field",
            "role": "defender",
            "targetName": "安布拉基亚湾奥尔派山岗",
            "chronicleFrom": "city_deerfei",
            "targetLat": 39.16,
            "targetLng": 20.98,
            "myTroops": 15000,
            "enemyFactionId": "lagoniya",
            "enemyFactionName": "斯巴达",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0130",
        "baton": "7A",
        "year": -425,
        "season": 0,
        "title": "派洛斯海岬抢滩阻击战",
        "kind": "battle",
        "place": {
            "name": "美塞尼亚西岸派洛斯海岬",
            "lat": 36.96,
            "lng": 21.66
        },
        "leadGeneralId": "xila_demosthenes",
        "strategic": [
            "公元前四二五年春，雅典舰队赴西西里途中遇风暴停靠美塞尼亚海岬派洛斯。随船名将德摩斯梯尼洞察此处可动摇斯巴达腹地黑劳士统治，力劝兵士搬石筑垒留守；正在阿提卡劫掠的斯巴达军闻讯急撤主力，调集舰队由猛将巴西达斯率队强攻派洛斯。"
        ],
        "tactical": [
            "派洛斯海岬礁石嶙峋、海浪汹涌，仅容少数船只抵岸。德摩斯梯尼亲率重步兵与美塞尼亚盾兵立于礁石死守，巴西达斯立于船首高呼舵手不惜撞碎船身强行冲滩，在跳板上身中数创昏厥落盾；随后雅典主力舰队赶至冲入海湾，反将斯巴达登岛部队困于孤岛。"
        ],
        "source": "修昔底德·伯罗奔尼撒战争史·第四卷；狄奥多罗斯·历史丛书·第十二卷",
        "winner": "defender",
        "battle": {
            "generalId": "xila_demosthenes",
            "battleId": "chron:evt_0130",
            "battleName": "派洛斯海岬抢滩阻击战",
            "battleYear": -425,
            "battleType": "field",
            "role": "defender",
            "targetName": "美塞尼亚西岸派洛斯海岬",
            "chronicleFrom": "city_yadian",
            "targetLat": 36.96,
            "targetLng": 21.66,
            "myTroops": 15000,
            "enemyFactionId": "lagoniya",
            "enemyFactionName": "斯巴达",
            "enemyGeneralId": "gen_brasidas",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0131",
        "baton": "7A",
        "year": -425,
        "season": 1,
        "title": "斯法克特里亚岛围歼战",
        "kind": "battle",
        "place": {
            "name": "派洛斯湾口斯法克特里亚岛",
            "lat": 36.93,
            "lng": 21.665
        },
        "leadGeneralId": "bfe2_cleon",
        "strategic": [
            "公元前四二五年夏，斯巴达精锐公民兵被困于派洛斯湾口斯法克特里亚岛，斯巴达求和遭雅典克里昂拒绝。因封锁日久未决，克里昂领命携弓箭手与轻盾兵驰赴前线会同德摩斯梯尼，恰逢岛上失火烧光密林掩护，雅典遂发起登岛总攻。"
        ],
        "tactical": [
            "斯法克特里亚岛地势崎岖，北端筑有古石垒绝壁。克里昂与德摩斯梯尼拂晓分兵两海岸登陆歼敌前哨，面对埃皮塔达斯重步兵方阵绝不硬拼，而以弓手与轻盾兵游走远射消耗；埃皮塔达斯阵亡，美塞尼亚兵攀崖绕后，残余斯巴达精兵被迫缴械投降。"
        ],
        "source": "修昔底德·伯罗奔尼撒战争史·第四卷；普鲁塔克·尼西亚斯传",
        "winner": "attacker",
        "battle": {
            "generalId": "bfe2_cleon",
            "battleId": "chron:evt_0131",
            "battleName": "斯法克特里亚岛围歼战",
            "battleYear": -425,
            "battleType": "field",
            "role": "attacker",
            "targetName": "派洛斯湾口斯法克特里亚岛",
            "chronicleFrom": "city_yadian",
            "targetLat": 36.93,
            "targetLng": 21.665,
            "myTroops": 15000,
            "enemyFactionId": "lagoniya",
            "enemyFactionName": "斯巴达",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0132",
        "baton": "7A",
        "year": -424,
        "season": 3,
        "title": "德利乌姆深阵破敌战",
        "kind": "battle",
        "place": {
            "name": "维奥蒂亚东岸德利乌姆",
            "lat": 38.32,
            "lng": 23.31
        },
        "leadGeneralId": "boootiya_pagondas",
        "strategic": [
            "公元前四二四年冬，派洛斯大捷令雅典锐气高涨，遂策划海陆钳击维奥蒂亚。因西路机密败露未能如期策应，东路雅典将军希波克拉底孤军进占海滨神庙德利乌姆筑壕设防，撤返边境途中，遭底比斯老将帕贡达斯统率的维奥蒂亚联军越山追及。"
        ],
        "tactical": [
            "德利乌姆城外丘陵起伏，两侧溪壑限制翼侧展开。帕贡达斯首创在右翼排布远超常规纵深的厚重底比斯方阵，正面压垮雅典左翼；雅典右翼虽胜敌左翼，帕贡达斯果断暗调精骑绕山突现雅典胜翼背后，雅典全军误以为敌新援杀至瞬间惊溃，希波克拉底阵亡。"
        ],
        "source": "修昔底德·伯罗奔尼撒战争史·第四卷；柏拉图·会饮篇",
        "winner": "attacker",
        "battle": {
            "generalId": "boootiya_pagondas",
            "battleId": "chron:evt_0132",
            "battleName": "德利乌姆深阵破敌战",
            "battleYear": -424,
            "battleType": "field",
            "role": "attacker",
            "targetName": "维奥蒂亚东岸德利乌姆",
            "chronicleFrom": "city_thebes",
            "targetLat": 38.32,
            "targetLng": 23.31,
            "myTroops": 15000,
            "enemyFactionId": "xila",
            "enemyFactionName": "雅典",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0134",
        "baton": "7A",
        "year": -422,
        "season": 2,
        "title": "安菲波利斯突袭双陨战",
        "kind": "battle",
        "place": {
            "name": "斯特里蒙河东岸安菲波利斯",
            "lat": 40.82,
            "lng": 23.85
        },
        "leadGeneralId": "bfe2_cleon",
        "strategic": [
            "公元前四二二年秋，休战期满，雅典主战派统帅克里昂亲率精锐重步兵北征色雷斯，连克数城后进驻埃伊翁，决意夺回被斯巴达名将巴西达斯占领的北方命脉安菲波利斯；巴西达斯偕副将克利尔里达斯进城布防，静待破敌战机。"
        ],
        "tactical": [
            "安菲波利斯高踞河曲山脊，尽览城外坡道。克里昂抵近侦察后轻率下令左转退回海港，致使无盾右侧暴露于城门前；巴西达斯自南门亲率精兵疾冲斩断雅典纵队，克利尔里达斯自北门夹击，雅典军大溃，克里昂被杀而巴西达斯亦重伤殉国。"
        ],
        "source": "修昔底德·伯罗奔尼撒战争史·第五卷；狄奥多罗斯·历史丛书·第十二卷",
        "winner": "defender",
        "battle": {
            "generalId": "bfe2_cleon",
            "battleId": "chron:evt_0134",
            "battleName": "安菲波利斯突袭双陨战",
            "battleYear": -422,
            "battleType": "field",
            "role": "attacker",
            "targetName": "斯特里蒙河东岸安菲波利斯",
            "routeVia": [
                {
                    "name": "托罗尼",
                    "lat": 39.98,
                    "lng": 23.89
                }
            ],
            "chronicleFrom": "city_yadian",
            "targetLat": 40.82,
            "targetLng": 23.85,
            "myTroops": 15000,
            "enemyFactionId": "lagoniya",
            "enemyFactionName": "斯巴达",
            "enemyGeneralId": "gen_brasidas",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0140",
        "baton": "7A",
        "year": -415,
        "season": 2,
        "title": "叙拉古大港抢滩首战",
        "kind": "battle",
        "place": {
            "name": "叙拉古大港南岸安纳普斯河",
            "lat": 37.07,
            "lng": 15.28
        },
        "leadGeneralId": "xila_nixiyasi",
        "strategic": [
            "公元前四一五年秋，应塞杰斯塔求援，雅典派出浩大的西西里远征舰队。航抵卡塔纳后亚西比德因渎神案被召回途中叛逃斯巴达，留任统帅尼西亚斯与拉马库斯用反间计将叙拉古主力诱往卡塔纳，乘夜率军在大港南岸奥林匹亚神庙从容抢滩立营。"
        ],
        "tactical": [
            "安纳普斯河口西倚沼泽峭壁、东临海湾，栅垒护住雅典两翼。叙拉古统帅赫尔莫克拉特斯急率步骑回师列阵，激战中天降雷雨，拉马库斯督雅典与阿尔戈斯重步兵冲垮敌左翼；然叙拉古优势骑兵稳稳护住败军使雅典无法追歼，尼西亚斯遂北返卡塔纳过冬。"
        ],
        "source": "修昔底德·伯罗奔尼撒战争史·第六卷；普鲁塔克·尼西亚斯传",
        "winner": "attacker",
        "battle": {
            "generalId": "xila_nixiyasi",
            "battleId": "chron:evt_0140",
            "battleName": "叙拉古大港抢滩首战",
            "battleYear": -415,
            "battleType": "field",
            "role": "attacker",
            "targetName": "叙拉古大港南岸安纳普斯河",
            "routeVia": [
                {
                    "name": "科西拉",
                    "lat": 39.62,
                    "lng": 19.92
                },
                {
                    "name": "利吉翁",
                    "lat": 38.11,
                    "lng": 15.65
                },
                {
                    "name": "卡塔纳",
                    "lat": 37.5,
                    "lng": 15.09
                }
            ],
            "chronicleFrom": "city_yadian",
            "targetLat": 37.07,
            "targetLng": 15.28,
            "myTroops": 15000,
            "enemyFactionId": "syracuse",
            "enemyFactionName": "叙拉古",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0141",
        "baton": "7A",
        "year": -414,
        "season": 1,
        "title": "叙拉古埃皮波莱高地筑墙战",
        "kind": "battle",
        "place": {
            "name": "叙拉古西北埃皮波莱台地",
            "lat": 37.07,
            "lng": 15.28
        },
        "leadGeneralId": "xila_nixiyasi",
        "strategic": [
            "公元前四一四年夏，获得本土骑兵增援的尼西亚斯与拉马库斯突袭控制俯瞰叙拉古全城的埃皮波莱高地，赶筑南北封锁长墙企图困死孤城。生死关头，听从亚西比德献策的斯巴达派名将吉利普斯在希梅拉登陆，征集全岛援兵疾行冲入叙拉古督战。"
        ],
        "tactical": [
            "埃皮波莱高地北侧悬崖峭立、南坡通往大港泥沼。此前沼泽战中雅典猛将拉马库斯阵亡，尼西亚斯染病独撑；吉利普斯入城后立即指挥叙拉古步骑依托高地北麓横向抢筑反包围石墙，野战中借骑兵与标枪手击退雅典左翼，成功将反封锁墙延伸越过雅典防线。"
        ],
        "source": "修昔底德·伯罗奔尼撒战争史·第六至第七卷；普鲁塔克·尼西亚斯传",
        "winner": "defender",
        "battle": {
            "generalId": "xila_nixiyasi",
            "battleId": "chron:evt_0141",
            "battleName": "叙拉古埃皮波莱高地筑墙战",
            "battleYear": -414,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "叙拉古西北埃皮波莱台地",
            "targetCityId": "city_syracuse",
            "chronicleCity": {
                "cityId": "city_syracuse",
                "before": "syracuse",
                "after": "syracuse"
            },
            "chronicleFrom": "city_tiluo",
            "targetLat": 37.07,
            "targetLng": 15.28,
            "myTroops": 15000,
            "enemyFactionId": "syracuse",
            "enemyFactionName": "叙拉古",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0142",
        "baton": "7A",
        "year": -413,
        "season": 2,
        "title": "叙拉古大港决战与远征覆没",
        "kind": "battle",
        "place": {
            "name": "叙拉古大港与阿西纳罗斯河",
            "lat": 37.07,
            "lng": 15.28
        },
        "leadGeneralId": "xila_nixiyasi",
        "strategic": [
            "公元前四一三年秋，斯巴达已在德凯利亚筑堡常驻，雅典仍倾力派德摩斯梯尼率增援舰队赴西西里。德摩斯梯尼夜袭埃皮波莱惨败后力劝撤军，尼西亚斯却因月食犹豫延误，吉利普斯与赫尔莫克拉特斯遂用铁链船阵彻底锁死叙拉古大港出口。"
        ],
        "tactical": [
            "叙拉古大港水域狭窄，令雅典战船迂回战术完全失效。叙拉古战船特意加固船首横梁，迎头撞裂雅典轻薄船首，港内战舰挤作一团惨烈肉搏，雅典突围溃败；尼西亚斯与德摩斯梯尼弃船向内陆苦撤，在阿西纳罗斯河谷被围全军覆没，二帅俱遭处死。"
        ],
        "source": "修昔底德·伯罗奔尼撒战争史·第七卷；狄奥多罗斯·历史丛书·第十三卷",
        "winner": "attacker",
        "battle": {
            "generalId": "xila_nixiyasi",
            "battleId": "chron:evt_0142",
            "battleName": "叙拉古大港决战与远征覆没",
            "battleYear": -413,
            "battleType": "field",
            "role": "defender",
            "targetName": "叙拉古大港与阿西纳罗斯河",
            "chronicleFrom": "city_tiluo",
            "targetLat": 37.07,
            "targetLng": 15.28,
            "myTroops": 15000,
            "enemyFactionId": "syracuse",
            "enemyFactionName": "叙拉古",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0144",
        "baton": "7B",
        "year": -411,
        "season": 3,
        "title": "阿比多斯海峡激战",
        "kind": "battle",
        "place": {
            "name": "赫勒斯滂海峡阿比多斯水域",
            "lat": 40.332,
            "lng": 26.6
        },
        "leadGeneralId": "xila_alcibiades",
        "strategic": [
            "公元前四一一年冬，斯巴达提督明达罗斯北入赫勒斯滂海峡投靠波斯总督法那巴佐斯，企图掐断雅典黑海粮道。继库诺塞马海战初挫敌锋后，雅典统帅斯拉叙布卢斯见敌援舰受困浅滩，遂自塞斯托斯出击迎战明达罗斯主力。"
        ],
        "tactical": [
            "阿比多斯海峡水流湍急，两军战船沿亚洲海岸拉成长线自晨至暮反复冲撞缠斗。黄昏时分，重归雅典阵营的亚西比德自萨摩斯率增援快船突然驶入海峡并升起红旗信号，明达罗斯舰队大骇逃往滩头；法那巴佐斯虽纵马入浅海护船，雅典仍夺获大批敌舰。"
        ],
        "source": "色诺芬·希腊史·第一卷；普鲁塔克·亚西比德传；狄奥多罗斯·历史丛书·第十三卷",
        "winner": "attacker",
        "battle": {
            "generalId": "xila_alcibiades",
            "battleId": "chron:evt_0144",
            "battleName": "阿比多斯海峡激战",
            "battleYear": -411,
            "battleType": "field",
            "role": "attacker",
            "targetName": "赫勒斯滂海峡阿比多斯水域",
            "chronicleFrom": "city_miletus",
            "targetLat": 40.332,
            "targetLng": 26.6,
            "myTroops": 15000,
            "enemyFactionId": "lagoniya",
            "enemyFactionName": "斯巴达",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0145",
        "baton": "7B",
        "year": -410,
        "season": 0,
        "title": "库梓库斯海陆全歼战",
        "kind": "battle",
        "place": {
            "name": "普罗滂提斯海库梓库斯湾",
            "lat": 40.132,
            "lng": 28.05
        },
        "leadGeneralId": "xila_alcibiades",
        "strategic": [
            "公元前四一零年春，斯巴达提督明达罗斯在波斯总督法那巴佐斯陆军协同下攻占库梓库斯，再度锁喉雅典海上命脉。亚西比德、斯拉叙布卢斯与塞拉梅尼三支雅典分舰队秘密会师，冒倾盆暴雨潜航迫近库梓库斯港外，布下诱歼口袋。"
        ],
        "tactical": [
            "库梓库斯系连陆半岛港城，湾外视野受雨雾遮蔽。亚西比德亲率诱敌分队挑战佯退，诱使明达罗斯倾巢追出港湾，斯拉叙布卢斯与塞拉梅尼伏兵舰队瞬间截断归路；明达罗斯冲滩弃船，雅典步兵登岸击退法那巴佐斯骑兵，阵斩明达罗斯并尽夺斯巴达全舰队。"
        ],
        "source": "色诺芬·希腊史·第一卷；狄奥多罗斯·历史丛书·第十三卷；普鲁塔克·亚西比德传",
        "winner": "attacker",
        "battle": {
            "generalId": "xila_alcibiades",
            "battleId": "chron:evt_0145",
            "battleName": "库梓库斯海陆全歼战",
            "battleYear": -410,
            "battleType": "field",
            "role": "attacker",
            "targetName": "普罗滂提斯海库梓库斯湾",
            "chronicleFrom": "city_yadian",
            "targetLat": 40.132,
            "targetLng": 28.05,
            "myTroops": 15000,
            "enemyFactionId": "lagoniya",
            "enemyFactionName": "斯巴达",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0148",
        "baton": "7B",
        "year": -408,
        "season": 3,
        "title": "拜占庭里应外合夺城战",
        "kind": "battle",
        "place": {
            "name": "博斯普鲁斯海峡拜占庭",
            "lat": 41.01,
            "lng": 28.97
        },
        "leadGeneralId": "xila_alcibiades",
        "strategic": [
            "公元前四零八年冬，雅典主帅亚西比德收复卡尔西顿并迫使法那巴佐斯缔约后，挥师横渡海峡合围锁钥黑海门户的拜占庭。其时斯巴达驻城督帅克莱阿库斯渡海筹饷，城内平民因守军独吞口粮陷入饥馑，暗与亚西比德约定夜开城门献城。"
        ],
        "tactical": [
            "拜占庭三面环海、高墙耸峙，扼守海峡最窄处。亚西比德白昼佯装撤舰拔营，入夜令舰队熄灯突袭港口声东击西，自率重步兵由内应敞开的陆门杀入；留守副帅赫利克苏斯率军巷战，亚西比德宣告赦免全城公民，市民遂倒戈助雅典军生擒敌将。"
        ],
        "source": "色诺芬·希腊史·第一卷；狄奥多罗斯·历史丛书·第十三卷；普鲁塔克·亚西比德传",
        "winner": "attacker",
        "battle": {
            "generalId": "xila_alcibiades",
            "battleId": "chron:evt_0148",
            "battleName": "拜占庭里应外合夺城战",
            "battleYear": -408,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "博斯普鲁斯海峡拜占庭",
            "targetCityId": "city_junshitandingbao",
            "chronicleCity": {
                "cityId": "city_junshitandingbao",
                "before": "lagoniya",
                "after": "xila"
            },
            "chronicleFrom": "city_yadian",
            "targetLat": 41.01,
            "targetLng": 28.97,
            "myTroops": 15000,
            "enemyFactionId": "lagoniya",
            "enemyFactionName": "斯巴达",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0150",
        "baton": "7B",
        "year": -406,
        "season": 2,
        "title": "阿吉努萨伊群岛大海战",
        "kind": "battle",
        "place": {
            "name": "莱斯博斯东南阿吉努萨伊海域",
            "lat": 39.12,
            "lng": 27.18
        },
        "leadGeneralId": "lagoniya_callicratidas",
        "strategic": [
            "公元前四零六年秋，接替吕山德的斯巴达提督卡利克拉提达斯强攻米蒂利尼港，将雅典名将科农封锁于港内。危亡关头雅典熔化神庙金像、解放奴隶充当桨手拼凑救援舰队赶赴阿吉努萨伊群岛，卡利克拉提达斯分兵留围科农，亲率主力迎战。"
        ],
        "tactical": [
            "阿吉努萨伊三岛横亘海峡之间。因雅典新募水手操舟生疏，诸将军反常排布双层厚重战列严防敌舰穿插；两翼混战中卡利克拉提达斯座舰猛撞敌船时坠海溺亡，斯巴达右翼崩溃损失惨重，科农之围立解，然战后风暴阻碍打捞竟引发雅典冤杀胜将悲剧。"
        ],
        "source": "色诺芬·希腊史·第一卷；狄奥多罗斯·历史丛书·第十三卷",
        "winner": "attacker",
        "battle": {
            "generalId": "lagoniya_callicratidas",
            "battleId": "chron:evt_0150",
            "battleName": "阿吉努萨伊群岛大海战",
            "battleYear": -406,
            "battleType": "field",
            "role": "defender",
            "targetName": "莱斯博斯东南阿吉努萨伊海域",
            "chronicleFrom": "city_peierjiameng",
            "targetLat": 39.12,
            "targetLng": 27.18,
            "myTroops": 15000,
            "enemyFactionId": "xila",
            "enemyFactionName": "雅典",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0152",
        "baton": "7B",
        "year": -405,
        "season": 2,
        "title": "羊河口突袭覆舰决战",
        "kind": "battle",
        "place": {
            "name": "赫勒斯滂海峡羊河口滩头",
            "lat": 40.332,
            "lng": 26.6
        },
        "leadGeneralId": "gen_lysander",
        "strategic": [
            "公元前四零五年秋，波斯王子小居鲁士倾注巨款助重掌帅印的斯巴达名将吕山德重建舰队。吕山德北入赫勒斯滂攻陷兰普萨库斯，菲洛克利斯与科农统雅典最后主力舰队进驻对岸毫无遮蔽的羊河口沙岸，傲慢拒绝亚西比德移驻良港之忠告。"
        ],
        "tactical": [
            "羊河口系开阔平浅滩涂，距补给市镇颇远。吕山德连日拒战麻痹敌军，暗遣快船尾随侦察；第五日待雅典水手照例离船四散觅食之际，吕山德高悬铜盾为号倾巢疾冲过海，将浅滩空船一举囊括并擒杀菲洛克利斯，仅科农率少数快船远遁塞浦路斯。"
        ],
        "source": "色诺芬·希腊史·第二卷；普鲁塔克·吕山德传；狄奥多罗斯·历史丛书·第十三卷",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_lysander",
            "battleId": "chron:evt_0152",
            "battleName": "羊河口突袭覆舰决战",
            "battleYear": -405,
            "battleType": "field",
            "role": "attacker",
            "targetName": "赫勒斯滂海峡羊河口滩头",
            "routeVia": [
                {
                    "name": "兰普萨库斯",
                    "lat": 40.35,
                    "lng": 26.69
                }
            ],
            "chronicleFrom": "city_rhodes",
            "targetLat": 40.332,
            "targetLng": 26.6,
            "myTroops": 15000,
            "enemyFactionId": "xila",
            "enemyFactionName": "雅典",
            "enemyGeneralId": "xila_feiluokelisi",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0153",
        "baton": "7B",
        "year": -404,
        "season": 0,
        "title": "雅典海陆封锁投降终战",
        "kind": "battle",
        "place": {
            "name": "雅典长墙与比雷埃夫斯港",
            "lat": 37.98,
            "lng": 23.72
        },
        "leadGeneralId": "gen_lysander",
        "strategic": [
            "公元前四零四年春，羊河惨败后吕山德沿爱琴海收降雅典各属邦，并将雅典侨民尽驱回本城以加剧粮荒。斯巴达双王阿基斯二世与帕萨尼亚斯统陆军进抵雅典城墙下，吕山德则率舰队彻底锁死比雷埃夫斯海口，完成海陆铁桶合围。"
        ],
        "tactical": [
            "雅典依托坚固双道长墙顽抗寒冬，但黑海粮船断绝令城内饿殍遍地。全权代表塞拉梅尼历经奔走，带回免于毁城灭国的斯巴达条款；雅典被迫开城投降，在长笛伴奏下拆毁长墙与比雷埃夫斯城防并交出战船，长达二十七载的大战就此落幕。"
        ],
        "source": "色诺芬·希腊史·第二卷；普鲁塔克·吕山德传",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_lysander",
            "battleId": "chron:evt_0153",
            "battleName": "雅典海陆封锁投降终战",
            "battleYear": -404,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "雅典长墙与比雷埃夫斯港",
            "targetCityId": "city_yadian",
            "chronicleCity": {
                "cityId": "city_yadian",
                "before": "xila",
                "after": "lagoniya"
            },
            "chronicleFrom": "city_sparta",
            "targetLat": 37.98,
            "targetLng": 23.72,
            "myTroops": 15000,
            "enemyFactionId": "xila",
            "enemyFactionName": "雅典",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0155",
        "baton": "7B",
        "year": -403,
        "season": 0,
        "title": "穆尼基亚山复辟民主之战",
        "kind": "battle",
        "place": {
            "name": "比雷埃夫斯港穆尼基亚山",
            "lat": 37.98,
            "lng": 23.72
        },
        "leadGeneralId": "xila_thrasybulus",
        "strategic": [
            "公元前四零三年春，斯巴达扶植的雅典寡头政权大肆杀戮异己，前海军名将斯拉叙布卢斯自底比斯率流亡义士夺取边塞菲莱并两挫讨伐军。壮大的民主军趁夜潜入比雷埃夫斯港，寡头领袖克里提亚斯急调斯巴达驻军与重步兵追至，民主军遂据穆尼基亚陡坡迎战。"
        ],
        "tactical": [
            "穆尼基亚山坡道狭窄陡峭，迫使寡头联军只能排成深纵队仰攻。斯拉叙布卢斯将重步兵列于坡前，背后密布投石手与标枪手居高攒射；激励士气后民主军顺陡坡雷霆俯冲，当场击毙寡头元凶克里提亚斯，随后斯巴达王帕萨尼亚斯调停议和，雅典恢复民主政体。"
        ],
        "source": "色诺芬·希腊史·第二卷；狄奥多罗斯·历史丛书·第十四卷",
        "winner": "attacker",
        "battle": {
            "generalId": "xila_thrasybulus",
            "battleId": "chron:evt_0155",
            "battleName": "穆尼基亚山复辟民主之战",
            "battleYear": -403,
            "battleType": "field",
            "role": "attacker",
            "targetName": "比雷埃夫斯港穆尼基亚山",
            "chronicleFrom": "city_thebes",
            "targetLat": 37.98,
            "targetLng": 23.72,
            "myTroops": 15000,
            "enemyFactionId": "lagoniya",
            "enemyFactionName": "斯巴达",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0156",
        "baton": "7B",
        "year": -402,
        "season": 1,
        "title": "斯巴达征讨伊利斯之战",
        "kind": "battle",
        "place": {
            "name": "伯罗奔尼撒西岸伊利斯河谷",
            "lat": 37.639,
            "lng": 21.631
        },
        "leadGeneralId": "lagoniya_agis_ii",
        "strategic": [
            "公元前四零二年夏，稳坐希腊霸主的斯巴达开始清算旧怨，矛头直指昔日曾禁赛羞辱斯巴达并倒向雅典的西邻伊利斯邦。斯巴达勒令伊利斯释放周边属邑自治遭拒，国王阿基斯二世遂统领伯罗奔尼撒联军越过边界河谷，全面攻入伊利斯腹地。"
        ],
        "tactical": [
            "伊利斯平原农庄富庶且不设外郭城墙，北倚阿克罗雷亚山地。阿基斯二世连拔山城进抵奥林匹亚献祭；城内亲斯巴达寡头企图刺杀民主领袖色拉绪代乌斯引发巷战被挫败，然面对斯巴达长年筑塞劫掠，伊利斯终被迫拆毁港墙释放属城求和。"
        ],
        "source": "色诺芬·希腊史·第三卷；狄奥多罗斯·历史丛书·第十四卷",
        "winner": "attacker",
        "battle": {
            "generalId": "lagoniya_agis_ii",
            "battleId": "chron:evt_0156",
            "battleName": "斯巴达征讨伊利斯之战",
            "battleYear": -402,
            "battleType": "field",
            "role": "attacker",
            "targetName": "伯罗奔尼撒西岸伊利斯河谷",
            "chronicleFrom": "city_sparta",
            "targetLat": 37.639,
            "targetLng": 21.631,
            "myTroops": 15000,
            "enemyFactionId": "yilisi",
            "enemyFactionName": "埃利斯",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0157",
        "baton": "8A",
        "year": -401,
        "season": 2,
        "title": "库纳克萨王位决战",
        "kind": "battle",
        "place": {
            "name": "幼发拉底河左岸库纳克萨",
            "lat": 32.542,
            "lng": 44.421
        },
        "leadGeneralId": "xila_xenophon",
        "strategic": [
            "公元前四零一年秋，波斯王阿尔塔薛西斯二世嗣位后，镇守撒狄的王弟小居鲁士招募由斯巴达将领克莱阿库斯与青年色诺芬随行的希腊重步兵雇佣军，合小亚细亚大军万里东进夺位；阿尔塔薛西斯二世在巴比伦北境库纳克萨集结王室步骑与战车迎战。"
        ],
        "tactical": [
            "库纳克萨平原南接幼发拉底河岸，无险可守。居右翼傍河的克莱阿库斯督希腊重步兵高唱战歌拍盾疾冲，惊散当面波斯镰刀战车与左翼步骑；小居鲁士见国王中军包抄，率亲卫精骑直扑王旗刺伤兄王，却在混战中眼下中标枪阵亡，希腊孤军被迫北撤。"
        ],
        "source": "色诺芬·长征记·第一卷；普鲁塔克·阿尔塔薛西斯传",
        "winner": "defender",
        "battle": {
            "generalId": "xila_xenophon",
            "battleId": "chron:evt_0157",
            "battleName": "库纳克萨王位决战",
            "battleYear": -401,
            "battleType": "field",
            "role": "attacker",
            "targetName": "幼发拉底河左岸库纳克萨",
            "routeVia": [
                {
                    "name": "科洛赛",
                    "lat": 37.79,
                    "lng": 29.26
                },
                {
                    "name": "凯莱奈",
                    "lat": 38.07,
                    "lng": 30.17
                },
                {
                    "name": "塔尔苏斯",
                    "lat": 36.92,
                    "lng": 34.9
                },
                {
                    "name": "伊苏斯",
                    "lat": 36.84,
                    "lng": 36.2
                }
            ],
            "chronicleFrom": "city_sifaerde",
            "targetLat": 32.542,
            "targetLng": 44.421,
            "myTroops": 15000,
            "enemyFactionId": "aqimeinide",
            "enemyFactionName": "阿契美尼德",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0158",
        "baton": "8A",
        "year": -400,
        "season": 0,
        "title": "卡尔杜奇山地突围抵海战",
        "kind": "battle",
        "place": {
            "name": "亚美尼亚高原至特拉佩祖斯山隘",
            "lat": 41,
            "lng": 39.73
        },
        "leadGeneralId": "xila_xenophon",
        "strategic": [
            "公元前四百年春，库纳克萨战后波斯总督提萨斐尼设宴诱杀克莱阿库斯等希腊诸将，企图瓦解孤悬两河腹地的雇佣军。雅典人色诺芬挺身而出，与基里索福斯改选统帅焚毁辎重，率军北折闯入波斯王军亦不敢涉足的卡尔杜奇险恶山脉与亚美尼亚雪原。"
        ],
        "tactical": [
            "卡尔杜奇峡谷绝壁千仞，山地武士滚石引长弓射透盾甲，肯特里特斯河对岸更满布奥龙特斯阻击骑兵。色诺芬与基里索福斯改大方阵为机动连队，分兵夜攀侧峰包抄夺隘并声东击西强渡冰河，终登顶特凯斯山望见黑海碧波，安抵希腊港城特拉佩祖斯。"
        ],
        "source": "色诺芬·长征记·第四卷；狄奥多罗斯·历史丛书·第十四卷",
        "winner": "attacker",
        "battle": {
            "generalId": "xila_xenophon",
            "battleId": "chron:evt_0158",
            "battleName": "卡尔杜奇山地突围抵海战",
            "battleYear": -400,
            "battleType": "field",
            "role": "attacker",
            "targetName": "亚美尼亚高原至特拉佩祖斯山隘",
            "chronicleFrom": "city_yadian",
            "targetLat": 41,
            "targetLng": 39.73,
            "myTroops": 15000,
            "enemyFactionId": "aqimeinide",
            "enemyFactionName": "阿契美尼德",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0159",
        "baton": "8A",
        "year": -399,
        "season": 1,
        "title": "特罗阿德诸要塞收服战",
        "kind": "battle",
        "place": {
            "name": "特罗阿德凯布伦与斯凯普西斯",
            "lat": 39.958,
            "lng": 26.239
        },
        "leadGeneralId": "bfe2_pharnabazus",
        "strategic": [
            "公元前三九九年夏，伊奥尼亚希腊诸城因曾助小居鲁士遭提萨斐尼逼迫而求救于斯巴达。斯巴达收编色诺芬残部，新帅德基利达斯巧妙与提萨斐尼休兵，趁波斯总督法那巴佐斯麾下特罗阿德女副督马尼亚遇刺身亡内乱之机挥师北上。"
        ],
        "tactical": [
            "特罗阿德群山环绕，凯布伦与斯凯普西斯诸石城储满马尼亚积蓄的军饷。德基利达斯兵临城下恩威并施，凯布伦希腊守兵率先开城；德基利达斯继而挟持弑杀岳母马尼亚的篡权者明迪亚斯同行，迫使斯凯普西斯与格尔吉斯守军献出金库，连下诸城。"
        ],
        "source": "色诺芬·希腊史·第三卷；狄奥多罗斯·历史丛书·第十四卷",
        "winner": "attacker",
        "battle": {
            "generalId": "bfe2_pharnabazus",
            "battleId": "chron:evt_0159",
            "battleName": "特罗阿德诸要塞收服战",
            "battleYear": -399,
            "battleType": "siege",
            "role": "defender",
            "targetName": "特罗阿德凯布伦与斯凯普西斯",
            "targetCityId": "city_teluoyi",
            "chronicleCity": {
                "cityId": "city_teluoyi",
                "before": "aqimeinide",
                "after": "lagoniya"
            },
            "chronicleFrom": "city_dasijiliweng",
            "targetLat": 39.958,
            "targetLng": 26.239,
            "myTroops": 15000,
            "enemyFactionId": "lagoniya",
            "enemyFactionName": "斯巴达",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0164",
        "baton": "8B",
        "year": -395,
        "season": 2,
        "title": "哈利亚托斯城下吕山德阵亡战",
        "kind": "battle",
        "place": {
            "name": "维奥蒂亚哈利亚托斯城下",
            "lat": 38.32,
            "lng": 23.31
        },
        "leadGeneralId": "gen_lysander",
        "strategic": [
            "公元前三九五年秋，斯巴达王阿格西莱二世在撒狄大破波斯骑兵，法那巴佐斯遂遣使携巨金赴希腊游说底比斯、雅典、科林斯与阿尔戈斯结盟反斯巴达，引爆科林斯战争。斯巴达命吕山德与国王帕萨尼亚斯南北分进，约期会攻哈利亚托斯。"
        ],
        "tactical": [
            "哈利亚托斯北临湖沼、南倚山坡。吕山德策反奥尔霍迈诺斯后提前抵近城下，因信使被截致帕萨尼亚斯未及赶到，吕山德遂冒进招降；城内守军开门死战之际，底比斯主力自城外疾驰掩杀其侧后，吕山德在城墙根下阵亡，帕萨尼亚斯次日被迫乞和收尸。"
        ],
        "source": "色诺芬·希腊史·第三卷；普鲁塔克·吕山德传；狄奥多罗斯·历史丛书·第十四卷",
        "winner": "defender",
        "battle": {
            "generalId": "gen_lysander",
            "battleId": "chron:evt_0164",
            "battleName": "哈利亚托斯城下吕山德阵亡战",
            "battleYear": -395,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "维奥蒂亚哈利亚托斯城下",
            "targetCityId": "city_thebes",
            "chronicleCity": {
                "cityId": "city_thebes",
                "before": "boootiya",
                "after": "boootiya"
            },
            "chronicleFrom": "city_deerfei",
            "targetLat": 38.32,
            "targetLng": 23.31,
            "myTroops": 15000,
            "enemyFactionId": "boootiya",
            "enemyFactionName": "底比斯",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0165",
        "baton": "8B",
        "year": -394,
        "season": 1,
        "title": "克尼多斯海角覆舰决战",
        "kind": "battle",
        "place": {
            "name": "卡里亚西南端克尼多斯外海",
            "lat": 37.03,
            "lng": 27.43
        },
        "leadGeneralId": "bfe2_conon",
        "strategic": [
            "公元前三九四年夏，科林斯战争迫使斯巴达召回阿格西莱二世陆路回援，仅留佩桑德统掌舰队。流亡海外的雅典名将科农获波斯国王授权，与总督法那巴佐斯共同统领强大的腓尼基与希腊联合舰队西出罗得岛，在克尼多斯海角拦住佩桑德主力。"
        ],
        "tactical": [
            "克尼多斯半岛深入爱琴海东南要冲，海岬陡岸直面波涛。科农率希腊先锋战船正面迎敌，法那巴佐斯督腓尼基巨舰自翼侧包抄；激战中斯巴达左翼盟邦战船望风奔逃触岸，佩桑德旗舰搁浅仍挥剑力战至死，斯巴达舰队覆没，科农遂携波斯军资返雅典重建长墙。"
        ],
        "source": "色诺芬·希腊史·第四卷；狄奥多罗斯·历史丛书·第十四卷",
        "winner": "attacker",
        "battle": {
            "generalId": "bfe2_conon",
            "battleId": "chron:evt_0165",
            "battleName": "克尼多斯海角覆舰决战",
            "battleYear": -394,
            "battleType": "field",
            "role": "attacker",
            "targetName": "卡里亚西南端克尼多斯外海",
            "chronicleFrom": "city_rhodes",
            "targetLat": 37.03,
            "targetLng": 27.43,
            "myTroops": 15000,
            "enemyFactionId": "lagoniya",
            "enemyFactionName": "斯巴达",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0166",
        "baton": "8B",
        "year": -393,
        "season": 0,
        "title": "基西拉岛跨海夺取战",
        "kind": "battle",
        "place": {
            "name": "拉科尼亚南海外基西拉岛",
            "lat": 36.15,
            "lng": 22.99
        },
        "leadGeneralId": "bfe2_conon",
        "strategic": [
            "公元前三九三年春，克尼多斯大捷肃清爱琴海东岸斯巴达驻防官后，波斯总督法那巴佐斯偕雅典统帅科农趁春风率联合舰队横越爱琴海直扑斯巴达本土门户，先袭掠美塞尼亚沿海，继而南下强攻锁控拉科尼亚海湾咽喉的基西拉岛。"
        ],
        "tactical": [
            "基西拉岛悬于伯罗奔尼撒东南岬角外，系北非商船通往斯巴达的跳板。科农率登陆部队夺占港口进逼主城，斯巴达守军惧怕被歼，协议弃城撤回大陆；法那巴佐斯加固城防留雅典将领驻守威慑斯巴达腹地，旋赴科林斯资助同盟并护送科农返筑雅典长墙。"
        ],
        "source": "色诺芬·希腊史·第四卷；狄奥多罗斯·历史丛书·第十四卷",
        "winner": "attacker",
        "battle": {
            "generalId": "bfe2_conon",
            "battleId": "chron:evt_0166",
            "battleName": "基西拉岛跨海夺取战",
            "battleYear": -393,
            "battleType": "field",
            "role": "attacker",
            "targetName": "拉科尼亚南海外基西拉岛",
            "chronicleFrom": "city_yadian",
            "targetLat": 36.15,
            "targetLng": 22.99,
            "myTroops": 15000,
            "enemyFactionId": "lagoniya",
            "enemyFactionName": "斯巴达",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0168",
        "baton": "8B",
        "year": -391,
        "season": 1,
        "title": "勒卡乌姆轻盾兵歼灭重步兵战",
        "kind": "battle",
        "place": {
            "name": "科林斯西港勒卡乌姆平原",
            "lat": 37.933,
            "lng": 22.882
        },
        "leadGeneralId": "xila_iphicrates",
        "strategic": [
            "公元前三九一年夏，科林斯地峡拉锯正烈，斯巴达控制西港勒卡乌姆，雅典派青年名将伊菲克拉特斯统轻盾标枪兵协防科林斯城。适值斯巴达驻港重步兵营团护送同乡南归祭礼后单独折返，竟在无骑兵与轻兵掩护下横穿科林斯城外平原。"
        ],
        "tactical": [
            "勒卡乌姆滨海大道平坦无遮，伊菲克拉特斯令雅典重步兵远距压阵，自统轻捷无重甲的轻盾兵扑向斯巴达纵队无盾右侧，抵近投出密集标枪旋即疾退；斯巴达重步兵负重追击莫及，折返又遭背射，往复消耗至全团崩溃奔逃，创下轻兵歼灭斯巴达重阵奇迹。"
        ],
        "source": "色诺芬·希腊史·第四卷；普鲁塔克·阿格西莱传",
        "winner": "attacker",
        "battle": {
            "generalId": "xila_iphicrates",
            "battleId": "chron:evt_0168",
            "battleName": "勒卡乌姆轻盾兵歼灭重步兵战",
            "battleYear": -391,
            "battleType": "field",
            "role": "attacker",
            "targetName": "科林斯西港勒卡乌姆平原",
            "chronicleFrom": "city_yadian",
            "targetLat": 37.933,
            "targetLng": 22.882,
            "myTroops": 15000,
            "enemyFactionId": "lagoniya",
            "enemyFactionName": "斯巴达",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0171",
        "baton": "8B",
        "year": -388,
        "season": 0,
        "title": "埃吉纳岛夜间设伏战",
        "kind": "battle",
        "place": {
            "name": "萨罗尼克湾埃吉纳岛山道",
            "lat": 37.98,
            "lng": 23.72
        },
        "leadGeneralId": "gen_chabrias",
        "strategic": [
            "公元前三八八年春，科林斯战争转入海上破交战。盘踞埃吉纳岛的斯巴达副提督戈尔戈帕斯屡掠阿提卡海岸并夜袭夺获雅典战船，威胁比雷埃夫斯航运。雅典名将卡布里亚斯奉命率重步兵与轻盾兵乘船赴塞浦路斯助战，遂决定顺路夜袭埃吉纳岛。"
        ],
        "tactical": [
            "埃吉纳岛山谷幽深，神庙外灌木与沟壑交错。卡布里亚斯趁夜率精锐轻盾兵悄然登陆潜伏于山谷凹地，天明后故意令重步兵大张旗鼓推进诱敌；戈尔戈帕斯闻警率埃吉纳民兵与斯巴达水兵匆忙出击，刚入伏击圈即遭标枪手四面攒射，戈尔戈帕斯当场毙命。"
        ],
        "source": "色诺芬·希腊史·第五卷；波利艾努斯·战略·第三卷",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_chabrias",
            "battleId": "chron:evt_0171",
            "battleName": "埃吉纳岛夜间设伏战",
            "battleYear": -388,
            "battleType": "field",
            "role": "attacker",
            "targetName": "萨罗尼克湾埃吉纳岛山道",
            "chronicleFrom": "city_yadian",
            "targetLat": 37.98,
            "targetLng": 23.72,
            "myTroops": 15000,
            "enemyFactionId": "lagoniya",
            "enemyFactionName": "斯巴达",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0176",
        "baton": "9",
        "year": -382,
        "season": 1,
        "title": "底比斯卫城卡德米亚奇袭战",
        "kind": "battle",
        "place": {
            "name": "底比斯卫城卡德米亚",
            "lat": 38.32,
            "lng": 23.31
        },
        "leadGeneralId": "lagoniya_phoebidas",
        "strategic": [
            "公元前三八二年夏，应马其顿与阿坎苏斯求援，斯巴达向奥林索斯宣战，开启第一次奥林索斯战争。斯巴达将领福比达斯统兵北上途经底比斯扎营，底比斯亲斯巴达寡头执政列昂提亚德斯为铲除政敌伊斯梅尼亚斯，竟密邀福比达斯乘虚夺取本国卫城。"
        ],
        "tactical": [
            "卡德米亚卫城高耸于底比斯中央岩丘之上。时值仲夏得墨忒耳节，卫城按宗教惯例专供妇女献祭而全无守兵，列昂提亚德斯趁正午街巷空寂亲引福比达斯重步兵径直冲入卫城锁门，随即逮捕伊斯梅尼亚斯；佩洛皮达斯率众流亡雅典，埋下复仇火种。"
        ],
        "source": "色诺芬·希腊史·第五卷；普鲁塔克·佩洛皮达斯传；狄奥多罗斯·历史丛书·第十五卷",
        "winner": "attacker",
        "battle": {
            "generalId": "lagoniya_phoebidas",
            "battleId": "chron:evt_0176",
            "battleName": "底比斯卫城卡德米亚奇袭战",
            "battleYear": -382,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "底比斯卫城卡德米亚",
            "targetCityId": "city_thebes",
            "chronicleCity": {
                "cityId": "city_thebes",
                "before": "boootiya",
                "after": "lagoniya"
            },
            "chronicleFrom": "city_sparta",
            "targetLat": 38.32,
            "targetLng": 23.31,
            "myTroops": 15000,
            "enemyFactionId": "boootiya",
            "enemyFactionName": "底比斯",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0177",
        "baton": "9",
        "year": -381,
        "season": 0,
        "title": "奥林索斯城下反冲锋歼敌战",
        "kind": "battle",
        "place": {
            "name": "卡尔基季基奥林索斯城外",
            "lat": 40.29,
            "lng": 23.35
        },
        "leadGeneralId": "lagoniya_teleutias",
        "strategic": [
            "公元前三八一年春，斯巴达王之弟特琉提亚斯统领伯罗奔尼撒大军与马其顿援骑推进至奥林索斯近郊。继前秋初胜后，特琉提亚斯再度进逼城下砍伐果林挑衅，奥林索斯精锐骑兵渡过城外小河从容袭扰，激怒了急于速胜的特琉提亚斯。"
        ],
        "tactical": [
            "奥林索斯盘踞高岗，城外河道横切原野。特琉提亚斯令轻盾兵过河追敌遭敌骑回马砍杀，盛怒之下竟命全军重步兵加速追入城墙弓矢射程之内，致方阵散乱受创；奥林索斯守帅见机开门，骑兵与重步兵全线呼啸反扑，当场阵斩特琉提亚斯并击溃斯巴达军。"
        ],
        "source": "色诺芬·希腊史·第五卷；狄奥多罗斯·历史丛书·第十五卷",
        "winner": "defender",
        "battle": {
            "generalId": "lagoniya_teleutias",
            "battleId": "chron:evt_0177",
            "battleName": "奥林索斯城下反冲锋歼敌战",
            "battleYear": -381,
            "battleType": "field",
            "role": "attacker",
            "targetName": "卡尔基季基奥林索斯城外",
            "chronicleFrom": "city_sparta",
            "targetLat": 40.29,
            "targetLng": 23.35,
            "myTroops": 15000,
            "enemyFactionId": "chalkidike",
            "enemyFactionName": "卡尔基季基同盟",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0180",
        "baton": "9",
        "year": -379,
        "season": 3,
        "title": "底比斯解放卡德米亚之战",
        "kind": "battle",
        "place": {
            "name": "底比斯卡德米亚卫城",
            "lat": 38.32,
            "lng": 23.31
        },
        "leadGeneralId": "boootiya_pelopidas",
        "strategic": [
            "公元前三七九年冬，斯巴达挟大王和约威权横行希腊，强占维奥蒂亚重镇底比斯的卡德米亚卫城并扶植寡头专政。流亡雅典的底比斯豪杰佩洛皮达斯暗结城内志士菲利达斯与伊巴密浓达，决意趁岁暮风雪之夜潜返故都推翻暴政。"
        ],
        "tactical": [
            "佩洛皮达斯率壮士乔装猎人混入城门，乘夜袭杀宴饮疏防的亲斯巴达执政列昂提亚德斯，打开监牢武装全城公民。次日伊巴密浓达汇合军民与雅典志愿军合围高耸的卡德米亚卫城；斯巴达守将吕萨诺里达斯粮断援绝被迫献城撤军，底比斯由此光复。"
        ],
        "source": "色诺芬·希腊史·第五卷；普鲁塔克·佩洛皮达斯传",
        "winner": "attacker",
        "battle": {
            "generalId": "boootiya_pelopidas",
            "battleId": "chron:evt_0180",
            "battleName": "底比斯解放卡德米亚之战",
            "battleYear": -379,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "底比斯卡德米亚卫城",
            "targetCityId": "city_thebes",
            "chronicleCity": {
                "cityId": "city_thebes",
                "before": "lagoniya",
                "after": "boootiya"
            },
            "chronicleFrom": "city_thebes",
            "targetLat": 38.32,
            "targetLng": 23.31,
            "myTroops": 15000,
            "enemyFactionId": "lagoniya",
            "enemyFactionName": "斯巴达",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0182",
        "baton": "9",
        "year": -376,
        "season": 2,
        "title": "纳克索斯海战",
        "kind": "battle",
        "place": {
            "name": "爱琴海纳克索斯海峡",
            "lat": 36.965,
            "lng": 25.53
        },
        "leadGeneralId": "gen_chabrias",
        "strategic": [
            "公元前三七六年秋，斯巴达陆路两度强攻维奥蒂亚均受阻于山隘木栅；遂改派海军提督波利斯统率舰队封锁萨罗尼克湾外海，截断雅典运粮航线。雅典重建海上同盟，命宿将卡布里亚斯率新锐舰队南下围攻纳克索斯以诱敌决战。"
        ],
        "tactical": [
            "纳克索斯海峡狭长浪涌，波利斯果率斯巴达舰队驰援接战。波利斯亲领右翼猛扑雅典左翼一度得手，卡布里亚斯沉着调度中军精锐桨船全速横切撞击；副将福基翁率机动分队及时回援左翼反包抄；雅典水师重创敌舰并毙伤波利斯，重夺爱琴海制海权。"
        ],
        "source": "色诺芬·希腊史·第五卷；狄奥多罗斯·历史丛书·第十五卷",
        "winner": "defender",
        "battle": {
            "generalId": "gen_chabrias",
            "battleId": "chron:evt_0182",
            "battleName": "纳克索斯海战",
            "battleYear": -376,
            "battleType": "field",
            "role": "defender",
            "targetName": "爱琴海纳克索斯海峡",
            "chronicleFrom": "city_yadian",
            "targetLat": 36.965,
            "targetLng": 25.53,
            "myTroops": 15000,
            "enemyFactionId": "lagoniya",
            "enemyFactionName": "斯巴达",
            "enemyGeneralId": "bfe2_pollis",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0183",
        "baton": "9",
        "year": -375,
        "season": 0,
        "title": "泰吉拉之战",
        "kind": "battle",
        "place": {
            "name": "维奥蒂亚泰吉拉山口",
            "lat": 38.32,
            "lng": 23.31
        },
        "leadGeneralId": "boootiya_pelopidas",
        "strategic": [
            "公元前三七五年春，雅典海军在爱琴海乘胜扩张之际；底比斯名将佩洛皮达斯统领常备精锐圣队夜袭斯巴达盘踞的西北孤城奥尔霍迈诺斯。因城内已有增援未能得手，佩洛皮达斯沿科帕伊斯湖北岸撤返，迎头撞上斯巴达主力营团。"
        ],
        "tactical": [
            "泰吉拉道窄山陡、南临大泽，戈尔戈莱昂与特奥庞普斯张开斯巴达重步兵阵线企图合围。佩洛皮达斯先遣骑兵突前搅乱敌锋，随即将圣队收拢为极密集的纵深突击楔阵直贯敌军中枢；两名斯巴达主将双双阵亡，敌阵崩裂让路溃逃，底比斯首创正面以少胜斯巴达壮举。"
        ],
        "source": "普鲁塔克·佩洛皮达斯传；狄奥多罗斯·历史丛书·第十五卷",
        "winner": "attacker",
        "battle": {
            "generalId": "boootiya_pelopidas",
            "battleId": "chron:evt_0183",
            "battleName": "泰吉拉之战",
            "battleYear": -375,
            "battleType": "field",
            "role": "attacker",
            "targetName": "维奥蒂亚泰吉拉山口",
            "chronicleFrom": "city_thebes",
            "targetLat": 38.32,
            "targetLng": 23.31,
            "myTroops": 15000,
            "enemyFactionId": "lagoniya",
            "enemyFactionName": "斯巴达",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0184",
        "baton": "9",
        "year": -374,
        "season": 1,
        "title": "科孚岛收复与阿吕齐亚海战",
        "kind": "battle",
        "place": {
            "name": "伊奥尼亚海阿卡纳尼亚阿吕齐亚外海",
            "lat": 38.705,
            "lng": 20.935
        },
        "leadGeneralId": "xila_timotheus",
        "strategic": [
            "公元前三七四年夏，底比斯借泰吉拉大捷整合维奥蒂亚诸城；雅典亦遣科农之子提莫修斯率舰队绕过伯罗奔尼撒经略西海，一举收服战略要地科孚岛。斯巴达深恐西海航道断绝，急命提督尼科洛库斯统领联合舰队北上阿吕齐亚强行寻战。"
        ],
        "tactical": [
            "阿吕齐亚海岸港湾曲折，提莫修斯见敌求战心切，先令主力桨船疏开佯退诱敌；待骄躁的斯巴达船队在追逐中桨手力疲、队形散乱之际，骤然吹号掉头发起集中冲角突击；雅典舰队重创斯巴达西海船队并竖立胜碑，迫使斯巴达首次承认雅典海上霸权。"
        ],
        "source": "色诺芬·希腊史·第五卷；波利艾努斯·战略·第三卷",
        "winner": "defender",
        "battle": {
            "generalId": "xila_timotheus",
            "battleId": "chron:evt_0184",
            "battleName": "科孚岛收复与阿吕齐亚海战",
            "battleYear": -374,
            "battleType": "field",
            "role": "defender",
            "targetName": "伊奥尼亚海阿卡纳尼亚阿吕齐亚外海",
            "chronicleFrom": "city_yadian",
            "targetLat": 38.705,
            "targetLng": 20.935,
            "myTroops": 15000,
            "enemyFactionId": "lagoniya",
            "enemyFactionName": "斯巴达",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0186",
        "baton": "9",
        "year": -372,
        "season": 1,
        "title": "科孚岛解围与截击叙拉古舰队战",
        "kind": "battle",
        "place": {
            "name": "科孚岛滩头及北侧外海",
            "lat": 39.62,
            "lng": 19.92
        },
        "leadGeneralId": "xila_iphicrates",
        "strategic": [
            "公元前三七二年夏，自埃及返国的雅典名将伊菲克拉特斯受命接掌西海帅印；率舰队兼程驰援正遭斯巴达将领姆纳西普斯水陆围困的科孚岛。沿途伊菲克拉特斯强训桨手提升航速，并侦知叙拉古僭主派出的增援船队正驶近科孚。"
        ],
        "tactical": [
            "科孚守军趁姆纳西普斯克扣军饷、营防松懈率先突围出击，阵斩姆纳西普斯迫敌弃营。紧接着伊菲克拉特斯赶抵科孚近海，凭山岬瞭望精准设伏航道；叙拉古统领克里尼普斯毫无戒备分段靠岸，遭雅典快船合围猛撞，敌舰尽数被俘，斯巴达西海攻势破产。"
        ],
        "source": "色诺芬·希腊史·第六卷；狄奥多罗斯·历史丛书·第十五卷",
        "winner": "attacker",
        "battle": {
            "generalId": "xila_iphicrates",
            "battleId": "chron:evt_0186",
            "battleName": "科孚岛解围与截击叙拉古舰队战",
            "battleYear": -372,
            "battleType": "field",
            "role": "attacker",
            "targetName": "科孚岛滩头及北侧外海",
            "chronicleFrom": "city_yadian",
            "targetLat": 39.62,
            "targetLng": 19.92,
            "myTroops": 15000,
            "enemyFactionId": "lagoniya",
            "enemyFactionName": "斯巴达",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0187",
        "baton": "9",
        "year": -371,
        "season": 1,
        "title": "留克特拉会战",
        "kind": "battle",
        "place": {
            "name": "维奥蒂亚留克特拉平原",
            "lat": 38.32,
            "lng": 23.31
        },
        "leadGeneralId": "gen_epaminondas",
        "strategic": [
            "公元前三七一年夏，希腊诸邦于斯巴达议和；底比斯统帅伊巴密浓达坚持代表整个维奥蒂亚同盟签约遭斯巴达王除名决裂。驻福基斯的另一斯巴达王克勒翁布罗图斯一世奉命率同盟大军绕山南压留克特拉原野，底比斯遂举国迎战。"
        ],
        "tactical": [
            "留克特拉缓坡开阔，克勒翁布罗图斯一世按传统将斯巴达精兵置于右翼。伊巴密浓达首创斜线阵，反常规将左翼叠成极深纵队直撼敌右翼，中右翼梯次后缩牵制；底比斯骑兵先驱散敌骑，佩洛皮达斯率圣队锁死敌王变阵，左翼重阵雷霆碾碎敌锋并毙斯巴达王。"
        ],
        "source": "色诺芬·希腊史·第六卷；普鲁塔克·佩洛皮达斯传；狄奥多罗斯·历史丛书·第十五卷",
        "winner": "defender",
        "battle": {
            "generalId": "gen_epaminondas",
            "battleId": "chron:evt_0187",
            "battleName": "留克特拉会战",
            "battleYear": -371,
            "battleType": "field",
            "role": "defender",
            "targetName": "维奥蒂亚留克特拉平原",
            "chronicleFrom": "city_thebes",
            "targetLat": 38.32,
            "targetLng": 23.31,
            "myTroops": 15000,
            "enemyFactionId": "lagoniya",
            "enemyFactionName": "斯巴达",
            "enemyGeneralId": "bfe2_cleombrotus_i",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0192",
        "baton": "9",
        "year": -365,
        "season": 0,
        "title": "萨摩斯围城攻坚战",
        "kind": "battle",
        "place": {
            "name": "爱琴海东岸萨摩斯城",
            "lat": 37.53,
            "lng": 27.278
        },
        "leadGeneralId": "xila_timotheus",
        "strategic": [
            "公元前三六五年春，小亚细亚爆发波斯西疆诸总督叛乱，雅典原遣名将提莫修斯率舰队声援弗里吉亚总督。提莫修斯抵近前线见总督公然叛波斯王，为免违背和约授人以柄；果断转围被波斯守将库普罗忒弥斯强占的战略大岛萨摩斯。"
        ],
        "tactical": [
            "萨摩斯城背山面海港防坚固，提莫修斯一面以三列桨战船封锁海峡断绝大陆补给；一面在未耗雅典国库军饷的条件下分遣轻舰袭取敌资以战养战。历经十个月水陆窒息合围与攻城器械猛击，波斯雇佣守军粮尽开城投降，雅典重握爱琴海东翼关键跳板。"
        ],
        "source": "伊索克拉底·财产交换辞；德摩斯梯尼·论罗德岛人的自由；科尔内利乌斯·奈波斯·提莫修斯传",
        "winner": "attacker",
        "battle": {
            "generalId": "xila_timotheus",
            "battleId": "chron:evt_0192",
            "battleName": "萨摩斯围城攻坚战",
            "battleYear": -365,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "爱琴海东岸萨摩斯城",
            "targetCityId": "city_miletus",
            "chronicleCity": {
                "cityId": "city_miletus",
                "before": "aqimeinide",
                "after": "xila"
            },
            "chronicleFrom": "city_yadian",
            "targetLat": 37.53,
            "targetLng": 27.278,
            "myTroops": 15000,
            "enemyFactionId": "aqimeinide",
            "enemyFactionName": "阿契美尼德",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0194",
        "baton": "9",
        "year": -364,
        "season": 1,
        "title": "库诺斯克法莱之战",
        "kind": "battle",
        "place": {
            "name": "色萨利库诺斯克法莱丘陵",
            "lat": 39.417,
            "lng": 22.567
        },
        "leadGeneralId": "boootiya_pelopidas",
        "strategic": [
            "公元前三六四年夏，东方秦军大捷于石门山之际，希腊色萨利诸城不堪费莱僭主亚历山大吞并，遣使向底比斯求救。底比斯公民军出征前遇日食惶惧，名将佩洛皮达斯毅然仅率志愿骑兵北上，会合色萨利同盟军直趋费莱西郊。"
        ],
        "tactical": [
            "库诺斯克法莱冈峦起伏，费莱僭主亚历山大抢先据高岭投射压退仰攻步卒。佩洛皮达斯先挥骑兵扫清谷底敌骑，随即下马执盾亲率重步兵猛冲夺下山脊；敌军溃退之际佩洛皮达斯瞥见仇敌亚历山大竟单身跃出队列追杀，不幸中密集标枪阵亡，盟军悲愤冲锋终获全胜。"
        ],
        "source": "普鲁塔克·佩洛皮达斯传；狄奥多罗斯·历史丛书·第十五卷",
        "winner": "attacker",
        "battle": {
            "generalId": "boootiya_pelopidas",
            "battleId": "chron:evt_0194",
            "battleName": "库诺斯克法莱之战",
            "battleYear": -364,
            "battleType": "field",
            "role": "attacker",
            "targetName": "色萨利库诺斯克法莱丘陵",
            "chronicleFrom": "city_thebes",
            "targetLat": 39.417,
            "targetLng": 22.567,
            "myTroops": 15000,
            "enemyFactionId": "sesali",
            "enemyFactionName": "色萨利",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0196",
        "baton": "9",
        "year": -362,
        "season": 1,
        "title": "曼丁尼亚会战",
        "kind": "battle",
        "place": {
            "name": "阿卡迪亚曼丁尼亚平原",
            "lat": 37.618,
            "lng": 22.393
        },
        "leadGeneralId": "gen_epaminondas",
        "strategic": [
            "公元前三六二年夏，阿卡迪亚同盟因神庙公款争端分裂，曼丁尼亚倒向斯巴达与雅典共同抗衡底比斯。伊巴密浓达统率底比斯及盟军再度南入伯罗奔尼撒，奇袭斯巴达未果后回师曼丁尼亚平原，与反底比斯联军展开总决战。"
        ],
        "tactical": [
            "伊巴密浓达抵山麓后故意解甲休整示敌不战，趁联军松懈解鞍之际骤然变向；再度在左翼布下极深重装方阵并以步骑混合队护翼。底比斯骑兵先击退雅典敌骑，左翼重阵如巨舰撞角般撕碎斯巴达战线；然胜局已定之际伊巴密浓达中标枪陨落，希腊各邦俱疲陷入混局。"
        ],
        "source": "色诺芬·希腊史·第七卷；狄奥多罗斯·历史丛书·第十五卷",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_epaminondas",
            "battleId": "chron:evt_0196",
            "battleName": "曼丁尼亚会战",
            "battleYear": -362,
            "battleType": "field",
            "role": "attacker",
            "targetName": "阿卡迪亚曼丁尼亚平原",
            "chronicleFrom": "city_thebes",
            "targetLat": 37.618,
            "targetLng": 22.393,
            "myTroops": 15000,
            "enemyFactionId": "lagoniya",
            "enemyFactionName": "斯巴达",
            "enemyGeneralId": "lagoniya_agesilaus",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0198",
        "baton": "10",
        "year": -360,
        "season": 2,
        "title": "上马其顿利恩库斯会战",
        "kind": "battle",
        "place": {
            "name": "上马其顿利恩库斯盆地",
            "lat": 40.785,
            "lng": 21.43
        },
        "leadGeneralId": "yili_bardylis",
        "strategic": [
            "公元前三六零年秋，爱琴海诸城邦疲于海陆拉锯之际；北方巴尔干山地强邻伊利里亚达达尼亚国王巴尔迪利斯集结重兵南侵上马其顿，并策动培奥尼亚人袭扰。年轻的马其顿王佩尔迪卡斯三世耻于纳贡，倾举国步骑西出迎战。"
        ],
        "tactical": [
            "利恩库斯高原盆地四面环山，缺乏严格阵列训练的马其顿传统步兵迎撞久经沙场的达达尼亚重装方阵与投枪轻兵。巴尔迪利斯以严密方阵正面挤压并自两翼包抄冲击，马其顿防线彻底崩盘；佩尔迪卡斯三世与大批贵族战死，危亡之际王弟腓力二世临危掌军。"
        ],
        "source": "狄奥多罗斯·历史丛书·第十六卷；查士丁·腓力史概要·第七卷",
        "winner": "attacker",
        "battle": {
            "generalId": "yili_bardylis",
            "battleId": "chron:evt_0198",
            "battleName": "上马其顿利恩库斯会战",
            "battleYear": -360,
            "battleType": "field",
            "role": "attacker",
            "targetName": "上马其顿利恩库斯盆地",
            "chronicleFrom": "city_peiliang",
            "targetLat": 40.785,
            "targetLng": 21.43,
            "myTroops": 15000,
            "enemyFactionId": "maqidun",
            "enemyFactionName": "马其顿",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0199",
        "baton": "10",
        "year": -359,
        "season": 0,
        "title": "梅托涅原野截击战",
        "kind": "battle",
        "place": {
            "name": "皮埃里亚埃盖至梅托涅大道",
            "lat": 40.76,
            "lng": 22.519
        },
        "leadGeneralId": "gen_philip_ii",
        "strategic": [
            "公元前三五九年春，马其顿四面楚歌；雅典派将军曼提亚斯护送争位者阿尔盖乌斯率雇佣军在梅托涅登陆，妄图夺占王座换取安菲波利斯。新掌权的腓力二世主动撤出安菲波利斯驻军瓦解雅典战意，并火速编练新式长矛方阵迎敌。"
        ],
        "tactical": [
            "曼提亚斯留守梅托涅海岸，阿尔盖乌斯独率雇佣军深入埃盖劝降遭拒，遂沿山海走廊回撤。腓力二世率新练马其顿方阵与骑兵抢占归途高地设伏截击，密集长矛推进压垮敌军阵脚并将其逼上荒丘合围；受降后腓力二世礼送随军雅典人归国，拆散敌方同盟。"
        ],
        "source": "狄奥多罗斯·历史丛书·第十六卷",
        "winner": "defender",
        "battle": {
            "generalId": "gen_philip_ii",
            "battleId": "chron:evt_0199",
            "battleName": "梅托涅原野截击战",
            "battleYear": -359,
            "battleType": "field",
            "role": "defender",
            "targetName": "皮埃里亚埃盖至梅托涅大道",
            "chronicleFrom": "city_salonica",
            "targetLat": 40.76,
            "targetLng": 22.519,
            "myTroops": 15000,
            "enemyFactionId": "xila",
            "enemyFactionName": "雅典",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0200",
        "baton": "10",
        "year": -358,
        "season": 1,
        "title": "埃里贡河谷会战",
        "kind": "battle",
        "place": {
            "name": "上马其顿埃里贡河谷平原",
            "lat": 41.015,
            "lng": 21.34
        },
        "leadGeneralId": "gen_philip_ii",
        "strategic": [
            "公元前三五八年夏，腓力二世稳定内政并降服培奥尼亚后，决意为战死的兄王复仇收复失土。高龄的达达尼亚王巴尔迪利斯提议按现状议和遭拒；腓力二世遂偕大将帕曼纽统率萨里沙超长矛方阵与伙伴骑兵西进埃里贡河谷决战。"
        ],
        "tactical": [
            "埃里贡河谷平旷，巴尔迪利斯畏惧马其顿骑兵，将伊利里亚步兵收缩为空心方阵护翼。腓力二世活用斜线战法，自领精锐步兵斜压敌军左角，命伙伴骑兵迂回猛扑侧后撕开方阵缺口；马其顿超长矛林顺缺口楔入绞杀，达达尼亚军大溃，巴尔迪利斯献还侵地求和。"
        ],
        "source": "狄奥多罗斯·历史丛书·第十六卷；弗龙蒂努斯·谋略·第二卷",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_philip_ii",
            "battleId": "chron:evt_0200",
            "battleName": "埃里贡河谷会战",
            "battleYear": -358,
            "battleType": "field",
            "role": "attacker",
            "targetName": "上马其顿埃里贡河谷平原",
            "chronicleFrom": "city_salonica",
            "targetLat": 41.015,
            "targetLng": 21.34,
            "myTroops": 15000,
            "enemyFactionId": "yili",
            "enemyFactionName": "伊利里亚",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0203",
        "baton": "10",
        "year": -355,
        "season": 2,
        "title": "霓虹山之战",
        "kind": "battle",
        "place": {
            "name": "帕纳苏斯山北麓霓虹山城郊",
            "lat": 38.482,
            "lng": 22.501
        },
        "leadGeneralId": "phokis_feiluomoluosi",
        "strategic": [
            "公元前三五五年秋，雅典被迫承认盟邦独立退出同盟战争；中希腊却因底比斯操纵近邻同盟重罚福基斯引爆第三次神圣战争。福基斯统帅菲洛墨洛斯夺占德尔斐并动用神庙财宝广募雇佣兵连挫洛克里斯，底比斯名将帕梅内斯遂统盟军进讨。"
        ],
        "tactical": [
            "两军于帕纳苏斯山北麓悬崖林立的霓虹山荒原遭遇，兵力占优的维奥蒂亚重步兵结阵猛压福基斯雇佣军。混战中福基斯阵线断裂向陡峭多林的山巅溃退；菲洛墨洛斯身负重创被敌兵逼至绝壁边缘，宁死不肯受辱纵身跃崖身亡，副帅奥诺马库斯收拢残部退守德尔斐。"
        ],
        "source": "狄奥多罗斯·历史丛书·第十六卷；保萨尼亚斯·希腊志·第十卷",
        "winner": "attacker",
        "battle": {
            "generalId": "phokis_feiluomoluosi",
            "battleId": "chron:evt_0203",
            "battleName": "霓虹山之战",
            "battleYear": -355,
            "battleType": "field",
            "role": "defender",
            "targetName": "帕纳苏斯山北麓霓虹山城郊",
            "chronicleFrom": "city_deerfei",
            "targetLat": 38.482,
            "targetLng": 22.501,
            "myTroops": 15000,
            "enemyFactionId": "boootiya",
            "enemyFactionName": "底比斯",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0206",
        "baton": "10",
        "year": -352,
        "season": 0,
        "title": "番红花原野会战",
        "kind": "battle",
        "place": {
            "name": "色萨利帕加塞湾畔番红花原野",
            "lat": 39.18,
            "lng": 22.76
        },
        "leadGeneralId": "gen_philip_ii",
        "strategic": [
            "公元前三五二年春，前岁曾以山坡投石机挫退马其顿军的福基斯统帅奥诺马库斯再率重兵北入色萨利救援盟邦费莱。腓力二世整军重返色萨利，整合拉里萨等全境贵族精骑抢围帕加塞港，赶在雅典援舰靠岸前逼敌于番红花原野决战。"
        ],
        "tactical": [
            "番红花原野平坦濒海，腓力二世命全军头戴月桂冠以讨伐渎神者激励士气。马其顿长矛方阵在正面稳固顶住福基斯雇佣重步兵猛攻；腓力二世调集占绝对优势的色萨利与马其顿重骑冲垮敌军两翼，将福基斯军挤压入海；奥诺马库斯败亡，腓力二世遂掌色萨利帅印。"
        ],
        "source": "狄奥多罗斯·历史丛书·第十六卷；查士丁·腓力史概要·第八卷",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_philip_ii",
            "battleId": "chron:evt_0206",
            "battleName": "番红花原野会战",
            "battleYear": -352,
            "battleType": "field",
            "role": "attacker",
            "targetName": "色萨利帕加塞湾畔番红花原野",
            "chronicleFrom": "city_salonica",
            "targetLat": 39.18,
            "targetLng": 22.76,
            "myTroops": 15000,
            "enemyFactionId": "phokis",
            "enemyFactionName": "福基斯",
            "enemyGeneralId": "phokis_aonuomakusi",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0210",
        "baton": "10",
        "year": -348,
        "season": 1,
        "title": "奥林索斯攻城战",
        "kind": "battle",
        "place": {
            "name": "卡尔基斯半岛首府奥林索斯",
            "lat": 40.29,
            "lng": 23.35
        },
        "leadGeneralId": "gen_philip_ii",
        "strategic": [
            "公元前三四八年夏，腓力二世尽拔卡尔基斯半岛外围城寨并收服海港梅基贝尔纳，将同盟首府奥林索斯彻底孤立。雅典增派的卡雷斯舰队遭北风阻航迟迟未达，腓力二世在城外两败守军后对奥林索斯发起最后总攻。"
        ],
        "tactical": [
            "奥林索斯踞守平顶高丘、砖石城墙宽厚，守军以弓弩滚石多次击退强攻。腓力二世遂施重金收买奥林索斯骑兵统帅拉斯特涅斯与欧提克拉特斯，诱使城内精骑出战时故意误入马其顿伏击圈覆没；孤城士气瓦解内应开门，腓力二世破城夷平奥林索斯，吞并半岛全境。"
        ],
        "source": "狄奥多罗斯·历史丛书·第十六卷；德摩斯梯尼·第三腓力辞",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_philip_ii",
            "battleId": "chron:evt_0210",
            "battleName": "奥林索斯攻城战",
            "battleYear": -348,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "卡尔基斯半岛首府奥林索斯",
            "targetCityId": "city_aolinsuosi",
            "chronicleCity": {
                "cityId": "city_aolinsuosi",
                "before": "chalkidike",
                "after": "maqidun"
            },
            "chronicleFrom": "city_salonica",
            "targetLat": 40.29,
            "targetLng": 23.35,
            "myTroops": 15000,
            "enemyFactionId": "chalkidike",
            "enemyFactionName": "卡尔基季基同盟",
            "enemyGeneralId": "chalkidike_lasiteniesi",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0212",
        "baton": "10",
        "year": -345,
        "season": 1,
        "title": "阿尔迪亚伊山地征讨战",
        "kind": "battle",
        "place": {
            "name": "伊利里亚南部阿尔迪亚伊山地",
            "lat": 41.28,
            "lng": 20.18
        },
        "leadGeneralId": "gen_philip_ii",
        "strategic": [
            "公元前三四五年夏，腓力二世终结神圣战争入主近邻同盟后暂缓南下刺激希腊诸邦；转而挥师西北整肃屡犯马其顿边境的伊利里亚强部阿尔迪亚伊人；亲统精锐步骑翻越分水岭直捣国王普莱乌拉图斯一世的山地腹地。"
        ],
        "tactical": [
            "伊利里亚崇山密林沟谷纵横，腓力二世以阿格里亚尼标枪兵搜索开路，马其顿骑兵与近卫步兵居中策应焚毁敌寨。普莱乌拉图斯一世在险隘设伏反扑，腓力二世策马亲搏右腿胫骨被长矛重创；贴身王室近卫浴血死战击溃伏敌，终迫阿尔迪亚伊人臣服靖平西疆。"
        ],
        "source": "狄奥多罗斯·历史丛书·第十六卷；狄迪姆斯·德摩斯梯尼演说集注",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_philip_ii",
            "battleId": "chron:evt_0212",
            "battleName": "阿尔迪亚伊山地征讨战",
            "battleYear": -345,
            "battleType": "field",
            "role": "attacker",
            "targetName": "伊利里亚南部阿尔迪亚伊山地",
            "chronicleFrom": "city_salonica",
            "targetLat": 41.28,
            "targetLng": 20.18,
            "myTroops": 15000,
            "enemyFactionId": "yili",
            "enemyFactionName": "伊利里亚",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0216",
        "baton": "10",
        "year": -341,
        "season": 1,
        "title": "色雷斯奥德里西亚征服战",
        "kind": "battle",
        "place": {
            "name": "色雷斯赫布鲁斯河谷至菲利波波利斯",
            "lat": 42.14,
            "lng": 24.74
        },
        "leadGeneralId": "gen_philip_ii",
        "strategic": [
            "公元前三四一年夏，东方魏国因马陵惨败国势骤衰，西方腓力二世为锁死黑海海峡通道并攫取色雷斯金银矿山；抓住奥德里西亚王凯尔索布莱普特斯侵袭希腊沿海城邦之机，亲率重兵深入赫布鲁斯河谷展开持久征服战。"
        ],
        "tactical": [
            "赫布鲁斯河谷群山密林环绕，色雷斯轻盾兵与标枪骑兵依山寨节节袭扰马其顿补给线。腓力二世冒寒暑连续作战，以山地兵清剿林莽伏敌，萨里沙方阵配伙伴骑兵在连场野战中击溃凯尔索布莱普特斯主力；废黜色雷斯王室并建重镇菲利波波利斯，兵逼拜占庭。"
        ],
        "source": "狄奥多罗斯·历史丛书·第十六卷；德摩斯梯尼·论克尔索内苏斯问题",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_philip_ii",
            "battleId": "chron:evt_0216",
            "battleName": "色雷斯奥德里西亚征服战",
            "battleYear": -341,
            "battleType": "field",
            "role": "attacker",
            "targetName": "色雷斯赫布鲁斯河谷至菲利波波利斯",
            "chronicleFrom": "city_salonica",
            "targetLat": 42.14,
            "targetLng": 24.74,
            "myTroops": 15000,
            "enemyFactionId": "seleisi",
            "enemyFactionName": "色雷斯",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0219",
        "baton": "10",
        "year": -339,
        "season": 1,
        "title": "多瑙河破斯基泰王阿泰阿斯之战",
        "kind": "battle",
        "place": {
            "name": "多瑙河下游南岸多布罗加草原",
            "lat": 44.18,
            "lng": 28.63
        },
        "leadGeneralId": "gen_philip_ii",
        "strategic": [
            "公元前三三九年夏，西西里提莫莱昂于克里米苏斯河大破迦太基之际，腓力二世因前岁围攻拜占庭受挫；决意北进多瑙河口惩罚背弃供粮承诺、侮辱马其顿使臣的黑海草原斯基泰霸主阿泰阿斯，夺取良马资财以充军实。"
        ],
        "tactical": [
            "多布罗加滨海草原辽阔，年迈剽悍的阿泰阿斯统领斯基泰弓骑张开新月阵迎敌。腓力二世将萨里沙方阵收密防冲，外置轻盾标枪手驱散游骑，待伙伴重骑瞅准阿泰阿斯本阵发起雷霆凿穿冲锋；阿泰阿斯当场战死，斯基泰军大溃，腓力二世尽获草原骏马凯旋。"
        ],
        "source": "查士丁·腓力史概要·第九卷；弗龙蒂努斯·谋略·第二卷",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_philip_ii",
            "battleId": "chron:evt_0219",
            "battleName": "多瑙河破斯基泰王阿泰阿斯之战",
            "battleYear": -339,
            "battleType": "field",
            "role": "attacker",
            "targetName": "多瑙河下游南岸多布罗加草原",
            "chronicleFrom": "city_salonica",
            "targetLat": 44.18,
            "targetLng": 28.63,
            "myTroops": 15000,
            "enemyFactionId": "sijitai",
            "enemyFactionName": "斯基泰",
            "enemyGeneralId": "sijitai_ateas",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0220",
        "baton": "10",
        "year": -338,
        "season": 2,
        "title": "喀罗尼亚会战",
        "kind": "battle",
        "place": {
            "name": "维奥蒂亚喀罗尼亚平原",
            "lat": 38.482,
            "lng": 22.501
        },
        "leadGeneralId": "gen_philip_ii",
        "strategic": [
            "公元前三三八年秋，腓力二世借第四次神圣战争之名南越温泉关抢占门户埃拉提亚，震动全希腊。德摩斯梯尼促成世仇雅典与底比斯结盟，会合诸邦公民军扼守喀罗尼亚平原，腓力二世遂携王子亚历山大三世挥师决战。"
        ],
        "tactical": [
            "喀罗尼亚左倚山麓右临河泽，特阿格尼斯统底比斯圣队居联军极右翼，雅典军居左。腓力二世亲领右翼接敌后故意拾级诈退，诱使贪功的雅典军脱阵猛追撕裂中段空当；左翼亚历山大三世率伙伴重骑顺缺口楔入全歼底比斯圣队，腓力二世返身压溃雅典军一统希腊。"
        ],
        "source": "狄奥多罗斯·历史丛书·第十六卷；普鲁塔克·亚历山大传；波利艾努斯·战略·第四卷",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_philip_ii",
            "battleId": "chron:evt_0220",
            "battleName": "喀罗尼亚会战",
            "battleYear": -338,
            "battleType": "field",
            "role": "attacker",
            "targetName": "维奥蒂亚喀罗尼亚平原",
            "chronicleFrom": "city_salonica",
            "targetLat": 38.482,
            "targetLng": 22.501,
            "myTroops": 15000,
            "enemyFactionId": "boootiya",
            "enemyFactionName": "底比斯",
            "enemyGeneralId": "bfe2_theagenes",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0221",
        "baton": "10",
        "year": -337,
        "season": 1,
        "title": "巴尔干征讨奥塔里亚泰王普莱乌里亚斯之战",
        "kind": "battle",
        "place": {
            "name": "伊利里亚东北部奥塔里亚泰山谷",
            "lat": 42.15,
            "lng": 20.75
        },
        "leadGeneralId": "gen_philip_ii",
        "strategic": [
            "公元前三三七年夏，腓力二世在科林斯大会组建泛希腊同盟并受推为讨伐波斯最高统帅；为免主力渡海东征后北方部落乘虚袭扰佩拉王畿，亲率马其顿军团北出深山；征讨伊利里亚强悍部族奥塔里亚泰及其国王普莱乌里亚斯。"
        ],
        "tactical": [
            "巴尔干内陆峡谷幽深陡峭；普莱乌里亚斯率善使曲刃刀与标枪的山地武士凭密林猛扑马其顿队列，更带死士直冲中军王旗；贴身侍卫帕萨尼亚斯奋不顾身挡在腓力二世身前连受数创殉职；马其顿近卫盾兵与骑兵拼死反击击退强敌，稳固了东征前夕的北疆屏障。"
        ],
        "source": "狄奥多罗斯·历史丛书·第十六卷",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_philip_ii",
            "battleId": "chron:evt_0221",
            "battleName": "巴尔干征讨奥塔里亚泰王普莱乌里亚斯之战",
            "battleYear": -337,
            "battleType": "field",
            "role": "attacker",
            "targetName": "伊利里亚东北部奥塔里亚泰山谷",
            "chronicleFrom": "city_salonica",
            "targetLat": 42.15,
            "targetLng": 20.75,
            "myTroops": 15000,
            "enemyFactionId": "yili",
            "enemyFactionName": "伊利里亚",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0222",
        "baton": "11B",
        "year": -336,
        "season": 2,
        "title": "小亚细亚马格尼西亚先遣交锋战",
        "kind": "battle",
        "place": {
            "name": "吕底亚西境马格尼西亚城郊",
            "lat": 38.613,
            "lng": 27.426
        },
        "leadGeneralId": "gen_parmenion",
        "strategic": [
            "公元前三三六年秋，腓力二世启动东征战略；命老帅帕曼纽与阿塔罗斯率先遣军渡过赫勒斯滂海峡进占阿比多斯，南下号召希腊诸城脱离波斯。不料腓力二世遇刺身亡、亚历山大三世初嗣王位，波斯名将门农即刻展开反击。"
        ],
        "tactical": [
            "马格尼西亚扼赫尔姆斯河谷要道，门农深知马其顿先遣军闻君父凶讯军心浮动，先以小股部队筑垒诱敌；趁帕曼纽分兵驻防周边之机，率精锐希腊雇佣重步兵与波斯骑兵突袭马格尼西亚城外营盘；马其顿分遣队战败后撤，帕曼纽被迫收缩退保海峡桥头堡。"
        ],
        "source": "狄奥多罗斯·历史丛书·第十七卷；波利艾努斯·战略·第五卷",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_parmenion",
            "battleId": "chron:evt_0222",
            "battleName": "小亚细亚马格尼西亚先遣交锋战",
            "battleYear": -336,
            "battleType": "field",
            "role": "defender",
            "targetName": "吕底亚西境马格尼西亚城郊",
            "chronicleFrom": "city_teluoyi",
            "targetLat": 38.613,
            "targetLng": 27.426,
            "myTroops": 15000,
            "enemyFactionId": "aqimeinide",
            "enemyFactionName": "阿契美尼德",
            "enemyGeneralId": "halikanasu_memnon",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0223",
        "baton": "11A",
        "year": -335,
        "season": 2,
        "title": "底比斯攻城战",
        "kind": "battle",
        "place": {
            "name": "维奥蒂亚底比斯城外及城区",
            "lat": 38.32,
            "lng": 23.31
        },
        "leadGeneralId": "gen_alexander_great",
        "strategic": [
            "公元前三三五年秋，马其顿国王亚历山大三世北征多瑙河与佩利昂要塞期间，希腊南方误信其阵亡谣言。底比斯将领菲尼克斯受波斯资助率众围攻卡德米亚卫城马其顿驻军；亚历山大三世闻讯昼夜强行军南下，骤然兵临底比斯城下。"
        ],
        "tactical": [
            "底比斯拒降并依托城南双重木栅顽强迎战。大将佩尔狄卡斯窥见敌栅空隙率先突入，亚历山大三世随即投入全军方阵推进支援；底比斯守军反扑稍乱未能闭门，马其顿兵紧咬败兵涌入城内与卫城驻军里应外合；经惨烈巷战破城夷平底比斯以震慑全希腊。"
        ],
        "source": "阿里安·亚历山大远征记·第一卷；狄奥多罗斯·历史丛书·第十七卷；普鲁塔克·亚历山大传",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_alexander_great",
            "battleId": "chron:evt_0223",
            "battleName": "底比斯攻城战",
            "battleYear": -335,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "维奥蒂亚底比斯城外及城区",
            "targetCityId": "city_thebes",
            "chronicleCity": {
                "cityId": "city_thebes",
                "before": "boootiya",
                "after": "maqidun"
            },
            "chronicleFrom": "city_peiliang",
            "targetLat": 38.32,
            "targetLng": 23.31,
            "myTroops": 15000,
            "enemyFactionId": "boootiya",
            "enemyFactionName": "底比斯",
            "enemyGeneralId": "dibisi_phoinix",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0224",
        "baton": "11B",
        "year": -334,
        "season": 0,
        "title": "格拉尼库斯河会战",
        "kind": "battle",
        "place": {
            "name": "小亚细亚西北格拉尼库斯河畔",
            "lat": 40.32,
            "lng": 27.28
        },
        "leadGeneralId": "gen_alexander_great",
        "strategic": [
            "公元前三三四年春，平定希腊后方的亚历山大三世留安提帕特镇守本土，亲统联军横渡赫勒斯滂海峡踏上小亚细亚。波斯西疆总督阿尔西特斯等拒绝门农焦土退守之策，集结重骑与雇佣步兵抢占格拉尼库斯河陡岸迎战。"
        ],
        "tactical": [
            "格拉尼库斯河泥滑岸陡，波斯军反常地将骑兵列于岸沿而置步兵于后。亚历山大三世先遣前锋涉水诱敌侧移，随即戴白翎盔亲率伙伴重骑斜涉激流猛冲敌阵中心；白刃搏杀中克雷图斯挥刀救护国王，马其顿军冲垮敌骑并合围歼灭雇佣步兵，敲开小亚细亚大门。"
        ],
        "source": "阿里安·亚历山大远征记·第一卷；普鲁塔克·亚历山大传；狄奥多罗斯·历史丛书·第十七卷",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_alexander_great",
            "battleId": "chron:evt_0224",
            "battleName": "格拉尼库斯河会战",
            "battleYear": -334,
            "battleType": "field",
            "role": "attacker",
            "targetName": "小亚细亚西北格拉尼库斯河畔",
            "routeVia": [
                {
                    "name": "安菲波利斯",
                    "lat": 40.82,
                    "lng": 23.85
                },
                {
                    "name": "塞斯托斯",
                    "lat": 40.23,
                    "lng": 26.4
                },
                {
                    "name": "伊利昂",
                    "lat": 39.96,
                    "lng": 26.24
                }
            ],
            "chronicleFrom": "city_salonica",
            "targetLat": 40.32,
            "targetLng": 27.28,
            "myTroops": 15000,
            "enemyFactionId": "aqimeinide",
            "enemyFactionName": "阿契美尼德",
            "enemyGeneralId": "aqimeinide_aerxitesi",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0225",
        "baton": "11B",
        "year": -334,
        "season": 2,
        "title": "哈利卡纳苏斯围城战",
        "kind": "battle",
        "place": {
            "name": "卡里亚海防首府哈利卡纳苏斯",
            "lat": 37.03,
            "lng": 27.43
        },
        "leadGeneralId": "gen_alexander_great",
        "strategic": [
            "公元前三三四年秋，格拉尼库斯河大捷后亚历山大三世确立以陆制海战略，攻拔米利都并解散己方弱小舰队；继而沿海岸南下卡里亚，合围波斯西疆总帅门农与总督欧戎托巴提斯重兵固守的海军基地哈利卡纳苏斯。"
        ],
        "tactical": [
            "哈利卡纳苏斯环绕深壕与海滨双卫城，门农凭海上优势屡次夜袭焚毁攻城塔。亚历山大三世命工兵填平巨壕轰塌东侧砖墙，佩尔狄卡斯与老兵营浴血挫败守军反突击；门农见内墙难支，趁夜纵火焚毁武库撤入海岛转赴爱琴海袭扰，亚历山大三世遂夺占全城。"
        ],
        "source": "阿里安·亚历山大远征记·第一卷；狄奥多罗斯·历史丛书·第十七卷",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_alexander_great",
            "battleId": "chron:evt_0225",
            "battleName": "哈利卡纳苏斯围城战",
            "battleYear": -334,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "卡里亚海防首府哈利卡纳苏斯",
            "targetCityId": "city_halikanasu",
            "chronicleCity": {
                "cityId": "city_halikanasu",
                "before": "aqimeinide",
                "after": "maqidun"
            },
            "routeVia": [
                {
                    "name": "撒狄",
                    "lat": 38.49,
                    "lng": 28.04
                },
                {
                    "name": "以弗所",
                    "lat": 37.94,
                    "lng": 27.34
                },
                {
                    "name": "米利都",
                    "lat": 37.53,
                    "lng": 27.28
                }
            ],
            "chronicleFrom": "city_salonica",
            "targetLat": 37.03,
            "targetLng": 27.43,
            "myTroops": 15000,
            "enemyFactionId": "aqimeinide",
            "enemyFactionName": "阿契美尼德",
            "enemyGeneralId": "halikanasu_memnon",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0226",
        "baton": "11B",
        "year": -333,
        "season": 2,
        "title": "伊苏斯会战",
        "kind": "battle",
        "place": {
            "name": "奇里乞亚海湾伊苏斯皮纳罗斯河原",
            "lat": 36.838,
            "lng": 36.165
        },
        "leadGeneralId": "gen_alexander_great",
        "strategic": [
            "公元前三三三年秋，门农病逝解除爱琴海后患，亚历山大三世穿奇里乞亚山门南进；岂料波斯王大流士三世亲统大军绕越北隘插至马其顿后方伊苏斯城截断退路；亚历山大三世连夜掉头北返，于皮纳罗斯河畔展开决战。"
        ],
        "tactical": [
            "伊苏斯东依崇山西临海湾，狭窄正面使波斯优势兵力无法铺开。左翼帕曼纽死顶波斯铁骑越河强攻，右翼亚历山大三世亲领伙伴重骑与近卫盾兵踏碎波斯左翼；调转马头斜切直扑大流士三世御驾战车；大流士三世惊骇弃车西逃，波斯全线大溃，王室尽落敌手。"
        ],
        "source": "阿里安·亚历山大远征记·第二卷；库尔提乌斯·亚历山大史·第三卷；普鲁塔克·亚历山大传",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_alexander_great",
            "battleId": "chron:evt_0226",
            "battleName": "伊苏斯会战",
            "battleYear": -333,
            "battleType": "field",
            "role": "attacker",
            "targetName": "奇里乞亚海湾伊苏斯皮纳罗斯河原",
            "routeVia": [
                {
                    "name": "戈尔迪乌姆",
                    "lat": 39.65,
                    "lng": 31.99
                },
                {
                    "name": "安居拉",
                    "lat": 39.94,
                    "lng": 32.86
                },
                {
                    "name": "塔尔苏斯",
                    "lat": 36.92,
                    "lng": 34.9
                }
            ],
            "chronicleFrom": "city_salonica",
            "targetLat": 36.838,
            "targetLng": 36.165,
            "myTroops": 15000,
            "enemyFactionId": "aqimeinide",
            "enemyFactionName": "阿契美尼德",
            "enemyGeneralId": "daliushi_iii",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0227",
        "baton": "11B",
        "year": -332,
        "season": 0,
        "title": "推罗围城战",
        "kind": "battle",
        "place": {
            "name": "腓尼基海岸推罗海岛坚城",
            "lat": 33.271,
            "lng": 35.196
        },
        "leadGeneralId": "gen_alexander_great",
        "strategic": [
            "公元前三三二年春，伊苏斯战后大流士三世退往两河重整，亚历山大三世坚持先肃清腓尼基海港以剥夺波斯舰队基地。比布鲁斯与西顿迎降，唯孤悬海外的推罗王阿泽米尔拒绝马其顿入城献祭，亚历山大三世遂令跨海攻坚。"
        ],
        "tactical": [
            "推罗矗立近海岩岛，巨石高墙直插深海，守军更放硫磺火船焚毁首批填海长堤。亚历山大三世加宽石堤并收编西顿与塞浦路斯归附战船夺回制海权；将重型投石机与撞锤搬上连环大船轰塌南墙缺口，亲登跳板率近卫盾兵杀入城头，苦战七月终拔海上孤堡。"
        ],
        "source": "阿里安·亚历山大远征记·第二卷；库尔提乌斯·亚历山大史·第四卷；狄奥多罗斯·历史丛书·第十七卷",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_alexander_great",
            "battleId": "chron:evt_0227",
            "battleName": "推罗围城战",
            "battleYear": -332,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "腓尼基海岸推罗海岛坚城",
            "targetCityId": "city_tuile",
            "chronicleCity": {
                "cityId": "city_tuile",
                "before": "kanan",
                "after": "maqidun"
            },
            "routeVia": [
                {
                    "name": "马拉托斯",
                    "lat": 34.84,
                    "lng": 35.9
                },
                {
                    "name": "比布鲁斯",
                    "lat": 34.12,
                    "lng": 35.65
                },
                {
                    "name": "西顿",
                    "lat": 33.56,
                    "lng": 35.37
                }
            ],
            "chronicleFrom": "city_salonica",
            "targetLat": 33.271,
            "targetLng": 35.196,
            "myTroops": 15000,
            "enemyFactionId": "kanan",
            "enemyFactionName": "推罗",
            "enemyGeneralId": "kanan_azemier",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0228",
        "baton": "11B",
        "year": -332,
        "season": 2,
        "title": "加沙攻城战",
        "kind": "battle",
        "place": {
            "name": "巴勒斯坦南端沙漠门户加沙城",
            "lat": 31.502,
            "lng": 34.467
        },
        "leadGeneralId": "gen_alexander_great",
        "strategic": [
            "公元前三三二年秋，推罗海岛陷落使东地中海制海权尽归马其顿；亚历山大三世统大军沿黎凡特海岸挥师南进埃及，在西奈沙漠北口遭遇最后陆路屏障加沙。波斯守帅巴提斯广募剽悍阿拉伯雇佣兵备足粮水，凭高丘坚垣严拒开关。"
        ],
        "tactical": [
            "加沙筑于高大土台之上，外围流沙松软令塔车难行，守军突袭更使亚历山大三世肩中弩矢负伤。马其顿工兵遂环城堆筑与内城等高的巨型土山，并自地下秘挖坑道掏空城基致高墙塌陷；经数次惨烈登城肉搏终破加沙，巴提斯不屈而死，埃及全境随后开迎。"
        ],
        "source": "阿里安·亚历山大远征记·第二卷；库尔提乌斯·亚历山大史·第四卷",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_alexander_great",
            "battleId": "chron:evt_0228",
            "battleName": "加沙攻城战",
            "battleYear": -332,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "巴勒斯坦南端沙漠门户加沙城",
            "targetCityId": "city_jiasa",
            "chronicleCity": {
                "cityId": "city_jiasa",
                "before": "aqimeinide",
                "after": "maqidun"
            },
            "chronicleFrom": "city_salonica",
            "targetLat": 31.502,
            "targetLng": 34.467,
            "myTroops": 15000,
            "enemyFactionId": "aqimeinide",
            "enemyFactionName": "阿契美尼德",
            "enemyGeneralId": "feilisidin_batisi",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0229",
        "baton": "11B",
        "year": -331,
        "season": 2,
        "title": "高加米拉会战",
        "kind": "battle",
        "place": {
            "name": "亚述底格里斯河东岸高加米拉平原",
            "lat": 36.36,
            "lng": 43.15
        },
        "leadGeneralId": "gen_alexander_great",
        "strategic": [
            "公元前三三一年秋，奠基亚历山大港并赴锡瓦绿洲神庙受谕归来的亚历山大三世挥师东北；连渡幼发拉底河与底格里斯河。波斯王大流士三世吸取伊苏斯窄地败训，广征东方铁骑、卷镰战车与战象，在高加米拉辽阔原野严阵决战。"
        ],
        "tactical": [
            "面对超宽波斯大阵，亚历山大三世布设双层防包抄方阵并亲统右翼斜向机动。贝苏斯侧击拦截致使波斯左中结合部拉开裂口，卷镰战车则被轻兵让道射毙驭手；亚历山大三世瞬间率伙伴重骑与长矛方阵结成尖楔直刺王旗，大流士三世再逃，波斯主力彻底覆灭。"
        ],
        "source": "阿里安·亚历山大远征记·第三卷；狄奥多罗斯·历史丛书·第十七卷；普鲁塔克·亚历山大传",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_alexander_great",
            "battleId": "chron:evt_0229",
            "battleName": "高加米拉会战",
            "battleYear": -331,
            "battleType": "field",
            "role": "attacker",
            "targetName": "亚述底格里斯河东岸高加米拉平原",
            "routeVia": [
                {
                    "name": "推罗",
                    "lat": 33.27,
                    "lng": 35.2
                }
            ],
            "chronicleFrom": "city_salonica",
            "targetLat": 36.36,
            "targetLng": 43.15,
            "myTroops": 15000,
            "enemyFactionId": "aqimeinide",
            "enemyFactionName": "阿契美尼德",
            "enemyGeneralId": "daliushi_iii",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0231",
        "baton": "11C",
        "year": -330,
        "season": 0,
        "title": "波斯门之战",
        "kind": "battle",
        "place": {
            "name": "扎格罗斯山脉波斯门险隘",
            "lat": 30.608,
            "lng": 51.59
        },
        "leadGeneralId": "gen_alexander_great",
        "strategic": [
            "公元前三三零年春，亚历山大三世连收巴比伦与苏萨国库重宝，得知礼仪王都波斯波利斯仍有巨储；遂命帕曼纽循大道押运辎重，自率精干步骑强穿乌克西亚山地，直扑波西斯总督阿里奥巴赞斯死守的天险波斯门。"
        ],
        "tactical": [
            "波斯门悬崖壁立峡道逼仄，阿里奥巴赞斯横筑石墙并用滚石箭雨砸退首次强攻。亚历山大三世留克拉特罗斯在关前多燃营火佯攻牵制，自选近卫盾兵随当地牧人向导趁黑夜踏深雪翻越险峻山脊；拂晓骤现敌后与克拉特罗斯前后夹击，全歼守军直入波斯波利斯。"
        ],
        "source": "阿里安·亚历山大远征记·第三卷；库尔提乌斯·亚历山大史·第五卷",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_alexander_great",
            "battleId": "chron:evt_0231",
            "battleName": "波斯门之战",
            "battleYear": -330,
            "battleType": "field",
            "role": "attacker",
            "targetName": "扎格罗斯山脉波斯门险隘",
            "routeVia": [
                {
                    "name": "巴比伦",
                    "lat": 32.54,
                    "lng": 44.42
                },
                {
                    "name": "苏萨",
                    "lat": 32.19,
                    "lng": 48.25
                }
            ],
            "chronicleFrom": "city_salonica",
            "targetLat": 30.608,
            "targetLng": 51.59,
            "myTroops": 15000,
            "enemyFactionId": "aqimeinide",
            "enemyFactionName": "阿契美尼德",
            "enemyGeneralId": "aqimeinide_aertabazanuosi",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0232",
        "baton": "11C",
        "year": -329,
        "season": 2,
        "title": "药杀水之战",
        "kind": "battle",
        "place": {
            "name": "中亚药杀水渡口与北岸草原",
            "lat": 40.248,
            "lng": 69.659
        },
        "leadGeneralId": "gen_alexander_great",
        "strategic": [
            "公元前三二九年秋，弑主自立的贝苏斯在乌浒水以北被擒，亚历山大三世北抵药杀水畔筑绝域亚历山大城镇边。其时南方索格狄亚那斯皮塔米尼斯掀起叛乱，药杀水北岸塞种统帅萨特拉克斯亦陈兵河畔挑衅，企图南北夹击。"
        ],
        "tactical": [
            "药杀水河宽流急，塞种骑手依恃回旋骑射断定马其顿军无法渡河。亚历山大三世在南岸排开扭力弩炮隔河轰杀敌骑清出滩头，全军乘皮筏强渡；上岸后故意纵前卫轻骑孤军诱使塞种骑群围拢兜圈，再率伙伴重骑与标枪手高速插上封死空间，击毙萨特拉克斯破敌。"
        ],
        "source": "阿里安·亚历山大远征记·第四卷；库尔提乌斯·亚历山大史·第七卷",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_alexander_great",
            "battleId": "chron:evt_0232",
            "battleName": "药杀水之战",
            "battleYear": -329,
            "battleType": "field",
            "role": "attacker",
            "targetName": "中亚药杀水渡口与北岸草原",
            "chronicleFrom": "city_salonica",
            "targetLat": 40.248,
            "targetLng": 69.659,
            "myTroops": 15000,
            "enemyFactionId": "sijitai",
            "enemyFactionName": "斯基泰",
            "enemyGeneralId": "sijitai_satraces",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0233",
        "baton": "11C",
        "year": -328,
        "season": 3,
        "title": "加拜之战",
        "kind": "battle",
        "place": {
            "name": "索格狄亚那西境加拜荒原",
            "lat": 39.767,
            "lng": 64.433
        },
        "leadGeneralId": "maqidun_coenus",
        "strategic": [
            "公元前三二八年冬；曾伏歼马其顿偏师的索格狄亚那抗战领袖斯皮塔米尼斯面对亚历山大三世分路筑堡清野的铁壁合围，绿洲补给尽断。绝境之下斯皮塔米尼斯裹挟马萨革泰游牧铁骑突袭边镇加拜，迎头撞上名将科伊诺斯主力。"
        ],
        "tactical": [
            "加拜位于沙漠绿洲边缘荒原，斯皮塔米尼斯指挥马萨革泰重骑与弓骑猛冲马其顿战线。科伊诺斯严整长矛方阵稳如磐石，配属标枪轻兵与马其顿精骑待敌骑力疲之际发起犀利反击击溃联军；逃入大漠的斯皮塔米尼斯旋遭盟友割首献降，河中游击战终告平息。"
        ],
        "source": "阿里安·亚历山大远征记·第四卷；库尔提乌斯·亚历山大史·第八卷",
        "winner": "defender",
        "battle": {
            "generalId": "maqidun_coenus",
            "battleId": "chron:evt_0233",
            "battleName": "加拜之战",
            "battleYear": -328,
            "battleType": "field",
            "role": "defender",
            "targetName": "索格狄亚那西境加拜荒原",
            "chronicleFrom": "city_bukhara",
            "targetLat": 39.767,
            "targetLng": 64.433,
            "myTroops": 15000,
            "enemyFactionId": "sogdian",
            "enemyFactionName": "粟特",
            "enemyGeneralId": "sute_spitamenes",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0234",
        "baton": "11C",
        "year": -327,
        "season": 0,
        "title": "粟特岩攻城战",
        "kind": "battle",
        "place": {
            "name": "索格狄亚那天险粟特岩堡",
            "lat": 38.21,
            "lng": 67.02
        },
        "leadGeneralId": "gen_alexander_great",
        "strategic": [
            "公元前三二七年春，斯皮塔米尼斯败亡后；索格狄亚那贵族阿里马泽斯携巴克特里亚豪族奥克夏特斯家眷退保群山之巅的绝壁要塞粟特岩。亚历山大三世踏雪进围劝降，阿里马泽斯狂傲讥讽唯有插翅士兵方能登顶。"
        ],
        "tactical": [
            "粟特岩四面覆冰绝壁高耸，亚历山大三世重赏征募善攀岩壮士；趁寒夜在要塞背后无人设防的冰壁将铁帐桩楔入冰缝，系麻绳徒手攀登；黎明勇士立于高于敌寨的巅峰挥动白旗，亚历山大三世高呼插翅神兵已至，阿里马泽斯魂飞魄散当即献堡投降。"
        ],
        "source": "阿里安·亚历山大远征记·第四卷；库尔提乌斯·亚历山大史·第七卷",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_alexander_great",
            "battleId": "chron:evt_0234",
            "battleName": "粟特岩攻城战",
            "battleYear": -327,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "索格狄亚那天险粟特岩堡",
            "targetCityId": "city_suogediyanayan",
            "chronicleCity": {
                "cityId": "city_suogediyanayan",
                "before": "sogdian",
                "after": "maqidun"
            },
            "chronicleFrom": "city_nuotaka",
            "targetLat": 38.21,
            "targetLng": 67.02,
            "myTroops": 15000,
            "enemyFactionId": "sogdian",
            "enemyFactionName": "粟特",
            "enemyGeneralId": "suogediyana_arimazes",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0235",
        "baton": "11D",
        "year": -326,
        "season": 1,
        "title": "希达斯皮斯河会战",
        "kind": "battle",
        "place": {
            "name": "旁遮普希达斯皮斯河东岸泥原",
            "lat": 32.647,
            "lng": 73.509
        },
        "leadGeneralId": "gen_alexander_great",
        "strategic": [
            "公元前三二六年夏，翻越兴都库什山并攻克奥诺斯岩的亚历山大三世进抵五河流域；受塔克西拉迎附后东讨拒不称臣的波罗婆王波鲁斯。时值雨季希达斯皮斯河浊浪滔天，波鲁斯陈列战象群与战车步骑严锁东岸渡口。"
        ],
        "tactical": [
            "亚历山大三世留克拉特罗斯对岸牵制，自率精锐借雷雨暗夜自上游林岛偷渡。波鲁斯遣战车阻击陷泥覆没，遂督战象居中迎战；亚历山大三世集中骑兵扫清敌方两翼，马其顿长矛方阵冒死刺射发狂巨象；克拉特罗斯渡河合围，波鲁斯力战负伤受礼遇保有其国。"
        ],
        "source": "阿里安·亚历山大远征记·第五卷；普鲁塔克·亚历山大传；狄奥多罗斯·历史丛书·第十七卷",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_alexander_great",
            "battleId": "chron:evt_0235",
            "battleName": "希达斯皮斯河会战",
            "battleYear": -326,
            "battleType": "field",
            "role": "attacker",
            "targetName": "旁遮普希达斯皮斯河东岸泥原",
            "routeVia": [
                {
                    "name": "塔克西拉",
                    "lat": 33.75,
                    "lng": 72.82
                }
            ],
            "chronicleFrom": "city_salonica",
            "targetLat": 32.647,
            "targetLng": 73.509,
            "myTroops": 15000,
            "enemyFactionId": "bulu",
            "enemyFactionName": "波罗婆",
            "enemyGeneralId": "gen_bolusi",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0236",
        "baton": "11D",
        "year": -325,
        "season": 0,
        "title": "木尔坦马利亚人城攻城战",
        "kind": "battle",
        "place": {
            "name": "旁遮普南部马利亚人主城木尔坦",
            "lat": 30.198,
            "lng": 71.468
        },
        "leadGeneralId": "gen_alexander_great",
        "strategic": [
            "公元前三二五年春，久征思乡的马其顿将士在希法色斯河畔拒再东进摩揭陀，亚历山大三世遂造舰队顺印度河水系南返。沿途强悍的马利亚首领摩罗波罗联结邻部抗命，亚历山大三世亲穿沙荒奇袭，进围其主城木尔坦。"
        ],
        "tactical": [
            "马利亚守军退入高耸内卫城死守，亚历山大三世见士卒架梯迟缓，亲夺云梯率先登墙，岂料云梯被后续士兵踩断；亚历山大三世毅然跳入城内背树独战，被印度重箭射穿胸甲刺入肺叶；护卫佩乌克斯塔斯持圣盾死护，佩尔狄卡斯部众破壁杀入救出国王攻克全城。"
        ],
        "source": "阿里安·亚历山大远征记·第六卷；库尔提乌斯·亚历山大史·第九卷；普鲁塔克·亚历山大传",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_alexander_great",
            "battleId": "chron:evt_0236",
            "battleName": "木尔坦马利亚人城攻城战",
            "battleYear": -325,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "旁遮普南部马利亚人主城木尔坦",
            "targetCityId": "city_malisi",
            "chronicleCity": {
                "cityId": "city_malisi",
                "before": "malli",
                "after": "maqidun"
            },
            "chronicleFrom": "city_salonica",
            "targetLat": 30.198,
            "targetLng": 71.468,
            "myTroops": 15000,
            "enemyFactionId": "malli",
            "enemyFactionName": "马利",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0237",
        "baton": "11E",
        "year": -324,
        "season": 3,
        "title": "扎格罗斯山讨平科赛亚人之战",
        "kind": "battle",
        "place": {
            "name": "扎格罗斯山脉科赛亚险谷",
            "lat": 33.487,
            "lng": 48.356
        },
        "leadGeneralId": "gen_alexander_great",
        "strategic": [
            "公元前三二四年冬，穿越格德罗西亚沙漠西返的亚历山大三世在苏萨联姻、于俄庇斯平息哗变后；在埃克巴坦那痛失挚友赫菲斯提昂。为宣泄悲恸并打通王道，亚历山大三世冒严寒亲征从不向波斯纳贡的扎格罗斯山科赛亚部族。"
        ],
        "tactical": [
            "科赛亚首领卡什提利亚什统山地弓手依故技散隐雪峰岩洞企图耗退大军。亚历山大三世将轻装军分为两路，自领一路、命近身护卫官托勒密一世领一路；配阿格里亚尼山地兵昼夜拉网搜山并逐口修筑锁谷碉堡；科赛亚人岩洞被破粮道尽绝，被迫走出深山乞降。"
        ],
        "source": "阿里安·亚历山大远征记·第七卷；普鲁塔克·亚历山大传；狄奥多罗斯·历史丛书·第十七卷",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_alexander_great",
            "battleId": "chron:evt_0237",
            "battleName": "扎格罗斯山讨平科赛亚人之战",
            "battleYear": -324,
            "battleType": "field",
            "role": "attacker",
            "targetName": "扎格罗斯山脉科赛亚险谷",
            "chronicleFrom": "city_salonica",
            "targetLat": 33.487,
            "targetLng": 48.356,
            "myTroops": 15000,
            "enemyFactionId": "kesaiya",
            "enemyFactionName": "科塞亚",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0239",
        "baton": "12A",
        "year": -322,
        "season": 2,
        "title": "克兰农会战",
        "kind": "battle",
        "place": {
            "name": "色萨利中南部克兰农平原",
            "lat": 39.57,
            "lng": 21.93
        },
        "leadGeneralId": "maqidun_antipater",
        "strategic": [
            "公元前三二二年秋，雅典海军在阿摩尔戈斯海战覆没丧失海权；陆上安提帕特脱困后盼来名将克拉特罗斯率领马其顿退伍老兵主力渡海会师。接掌联军的雅典将军安提菲卢斯偕色萨利骑将梅农遂于克兰农原野背水应战。"
        ],
        "tactical": [
            "开战后梅农统领色萨利精骑在两翼压倒马其顿骑兵占优；安提帕特与克拉特罗斯则果断推进马其顿萨里沙老兵方阵正面碾压希腊公民步兵。安提菲卢斯步阵败退上山固守，梅农不敢孤骑贪进急忙收兵；战后安提帕特采取逐邦分化瓦解之策，迫使雅典投降废除民主制。"
        ],
        "source": "狄奥多罗斯·历史丛书·第十八卷；普鲁塔克·德摩斯梯尼传",
        "winner": "attacker",
        "battle": {
            "generalId": "maqidun_antipater",
            "battleId": "chron:evt_0239",
            "battleName": "克兰农会战",
            "battleYear": -322,
            "battleType": "field",
            "role": "attacker",
            "targetName": "色萨利中南部克兰农平原",
            "chronicleFrom": "city_salonica",
            "targetLat": 39.57,
            "targetLng": 21.93,
            "myTroops": 15000,
            "enemyFactionId": "xila",
            "enemyFactionName": "雅典",
            "enemyGeneralId": "xila_antiphilus",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0242",
        "baton": "12B",
        "year": -320,
        "season": 0,
        "title": "尼罗河骆驼堡与孟菲斯渡河之战",
        "kind": "battle",
        "place": {
            "name": "尼罗河东支骆驼堡至孟菲斯河洲",
            "lat": 31.04,
            "lng": 32.55
        },
        "leadGeneralId": "gen_perdiccas",
        "strategic": [
            "公元前三二零年春，罗马在意大利反扑卢凯里亚雪耻之际；马其顿王室摄政佩尔狄卡斯挟遗孤与正统王军穿西奈沙漠攻入埃及；讨伐劫走亚历山大三世金棺、割据尼罗河的总督托勒密一世，两军于尼罗河防线正面对决。"
        ],
        "tactical": [
            "佩尔狄卡斯趁夜急攻河畔要塞骆驼堡，托勒密一世抢先入堡，亲执长矛立于女墙刺瞎领头攻城巨象挫败强攻。佩尔狄卡斯再移师孟菲斯浅滩强渡，不料河床流沙随象群践踏陷深致大批精兵溺毙喂鳄；怨愤沸腾的培松等部将趁夜哗变入帐刺杀佩尔狄卡斯，重分天下。"
        ],
        "source": "狄奥多罗斯·历史丛书·第十八卷；阿利安·继业者史残篇",
        "winner": "defender",
        "battle": {
            "generalId": "gen_perdiccas",
            "battleId": "chron:evt_0242",
            "battleName": "尼罗河骆驼堡与孟菲斯渡河之战",
            "battleYear": -320,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "尼罗河东支骆驼堡至孟菲斯河洲",
            "targetCityId": "city_peiluximu",
            "chronicleCity": {
                "cityId": "city_peiluximu",
                "before": "tuolemi",
                "after": "tuolemi"
            },
            "chronicleFrom": "city_adana",
            "targetLat": 31.04,
            "targetLng": 32.55,
            "myTroops": 15000,
            "enemyFactionId": "tuolemi",
            "enemyFactionName": "托勒密",
            "enemyGeneralId": "tuolemi_tuolemi",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0243",
        "baton": "12B",
        "year": -319,
        "season": 0,
        "title": "奥尔基尼亚之战",
        "kind": "battle",
        "place": {
            "name": "卡帕多细亚奥尔基尼亚",
            "lat": 38.45,
            "lng": 35.15
        },
        "leadGeneralId": "bfe_antigonus",
        "strategic": [
            "公元前三一九年春，马其顿特里帕拉迪苏斯分封甫定，亚洲统帅安提柯一世奉摄政安提帕特之命，统主力东进小亚细亚讨伐佩尔狄卡斯旧党。卡帕多细亚总督欧迈尼斯集结精骑于奥尔基尼亚迎敌，安提柯一世暗遣重金策反欧迈尼斯麾下骑兵统领阿波罗尼德斯。"
        ],
        "tactical": [
            "奥尔基尼亚盆地开阔缓平，极利骑兵驰骋。安提柯一世故意拉长横阵虚张声势，诱两军精骑在翼侧交锋；激战正酣时，受贿的阿波罗尼德斯率部临阵倒戈，欧迈尼斯骑翼骤崩、步阵亦溃。欧迈尼斯果断收拢亲卫擒斩叛徒，率死忠部众退入诺拉山城固守。"
        ],
        "source": "西西里的狄奥多罗斯·历史丛书；普鲁塔克·欧迈尼斯传",
        "winner": "attacker",
        "battle": {
            "generalId": "bfe_antigonus",
            "battleId": "chron:evt_0243",
            "battleName": "奥尔基尼亚之战",
            "battleYear": -319,
            "battleType": "field",
            "role": "attacker",
            "targetName": "卡帕多细亚奥尔基尼亚",
            "chronicleFrom": "city_kailaina",
            "targetLat": 38.45,
            "targetLng": 35.15,
            "myTroops": 15000,
            "enemyFactionId": "maqidun",
            "enemyFactionName": "马其顿",
            "enemyGeneralId": "maqidun_eumenes",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0246",
        "baton": "12B",
        "year": -317,
        "season": 2,
        "title": "帕莱塔西奈会战",
        "kind": "battle",
        "place": {
            "name": "伊朗高原帕莱塔西奈",
            "lat": 32.65,
            "lng": 51.66
        },
        "leadGeneralId": "bfe_antigonus",
        "strategic": [
            "公元前三一七年秋，东方秦军大胜修鱼后，西亚第二次继业者战争推向伊朗高原。突围出诺拉的欧迈尼斯奉王室摄政诏令统银盾兵团东进苏萨，会合东方上行省联军与印度战象；安提柯一世自两河紧追东上，两军在伊斯法罕北侧帕莱塔西奈山地对峙。"
        ],
        "tactical": [
            "帕莱塔西奈横亘深涧与碎石坡地，两军皆以马其顿长矛方阵居中、铁骑分置两翼。欧迈尼斯右翼骑兵率先渡涧猛攻，百战银盾老兵更结成萨里沙长矛墙正面碾碎敌方中央方阵；危急关头安提柯一世亲率右翼重骑斜插敌阵脱节空隙救回败局，乘夜拔营退返米底。"
        ],
        "source": "西西里的狄奥多罗斯·历史丛书；普鲁塔克·欧迈尼斯传",
        "winner": "draw",
        "battle": {
            "generalId": "bfe_antigonus",
            "battleId": "chron:evt_0246",
            "battleName": "帕莱塔西奈会战",
            "battleYear": -317,
            "battleType": "field",
            "role": "attacker",
            "targetName": "伊朗高原帕莱塔西奈",
            "chronicleFrom": "city_kailaina",
            "targetLat": 32.65,
            "targetLng": 51.66,
            "myTroops": 15000,
            "enemyFactionId": "maqidun",
            "enemyFactionName": "马其顿",
            "enemyGeneralId": "maqidun_eumenes",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0248",
        "baton": "12B",
        "year": -316,
        "season": 3,
        "title": "伽比埃奈会战",
        "kind": "battle",
        "place": {
            "name": "波西斯北境伽比埃奈盐原",
            "lat": 31.777,
            "lng": 51.802
        },
        "leadGeneralId": "bfe_antigonus",
        "strategic": [
            "公元前三一六年冬，秦军平定巴蜀之际，伊朗高原迎来决定亚历山大旧部霸权的决战。安提柯一世自米底冒寒横穿无人荒漠奇袭散驻伽比埃奈过冬的敌营；欧迈尼斯于高地遍燃篝火伪造主力已集假象，逼安提柯绕道缓行，成功在决战前收拢全军与战象。"
        ],
        "tactical": [
            "伽比埃奈荒原遍布松软盐碱，战马奔踏瞬间扬起蔽日烟尘。安提柯一世借浓尘掩护，暗遣米底轻骑绕过正线奇袭敌后辎重大营，尽夺银盾兵历年积攒的家眷财货。尽管银盾步兵在正面再度杀穿敌方步阵，战后却为赎回妻儿行囊绑献主帅，欧迈尼斯遂遭杀害。"
        ],
        "source": "西西里的狄奥多罗斯·历史丛书；普鲁塔克·欧迈尼斯传；波利艾努斯·战略",
        "winner": "attacker",
        "battle": {
            "generalId": "bfe_antigonus",
            "battleId": "chron:evt_0248",
            "battleName": "伽比埃奈会战",
            "battleYear": -316,
            "battleType": "field",
            "role": "attacker",
            "targetName": "波西斯北境伽比埃奈盐原",
            "chronicleFrom": "city_kailaina",
            "targetLat": 31.777,
            "targetLng": 51.802,
            "myTroops": 15000,
            "enemyFactionId": "maqidun",
            "enemyFactionName": "马其顿",
            "enemyGeneralId": "maqidun_eumenes",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0253",
        "baton": "13A",
        "year": -312,
        "season": 2,
        "title": "加沙会战",
        "kind": "battle",
        "place": {
            "name": "巴勒斯坦南门户加沙城郊",
            "lat": 31.502,
            "lng": 34.467
        },
        "leadGeneralId": "tuolemi_tuolemi",
        "strategic": [
            "公元前三一二年秋，东方秦楚鏖战丹阳与蓝田之年，西亚黎凡特走廊迎来第三次继业者战争转折之役。安提柯一世西赴小亚细亚，留少子德米特里一世偕老将培松统步骑战象驻守加沙；流亡埃及的塞琉古一世力劝托勒密一世出击，联军遂越西奈沙海兵临加沙。"
        ],
        "tactical": [
            "加沙滨海平旷，德米特里一世将披甲战象与重骑集中于左翼企图碾碎敌阵。托勒密一世与塞琉古一世临时调主力至右翼，在沙地密布铁链尖刺钉障并配轻标枪手专射象奴；战象踏刺痛极倒卷冲乱自家骑阵，培松阵亡、德米特里北逃，塞琉古遂率精骑东返重夺巴比伦。"
        ],
        "source": "西西里的狄奥多罗斯·历史丛书；普鲁塔克·德米特里传；阿庇安·叙利亚战记",
        "winner": "attacker",
        "battle": {
            "generalId": "tuolemi_tuolemi",
            "battleId": "chron:evt_0253",
            "battleName": "加沙会战",
            "battleYear": -312,
            "battleType": "field",
            "role": "attacker",
            "targetName": "巴勒斯坦南门户加沙城郊",
            "chronicleFrom": "city_yalishanda",
            "targetLat": 31.502,
            "targetLng": 34.467,
            "myTroops": 15000,
            "enemyFactionId": "antigonid",
            "enemyFactionName": "安提柯",
            "enemyGeneralId": "antigonid_demetrius",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0256",
        "baton": "13A",
        "year": -309,
        "season": 1,
        "title": "巴比伦黎明决战",
        "kind": "battle",
        "place": {
            "name": "美索不达米亚巴比伦城郊",
            "lat": 32.542,
            "lng": 44.421
        },
        "leadGeneralId": "gen_seleucus_i",
        "strategic": [
            "公元前三零九年夏，叙拉古守军夜袭生擒迦太基主帅哈米尔卡解围同年，两河流域持续数载的巴比伦战争迎来终局较量。安提柯一世不甘丧失东方赋税重地，亲统主力杀入美索不达米亚毁掠巴比伦城郭；塞琉古一世依托河渠苇荡游击疲敌展开持久消耗。"
        ],
        "tactical": [
            "巴比伦城外水网交错，两军白昼激战未决后各自收兵。安提柯一世将士卸甲解鞍沉睡休整，塞琉古一世却严令全军披甲执锐和衣待旦，赶在拂晓微光未亮时悄然列阵全线突入敌营；安提柯大军梦中惊溃损失惨重，被迫议和放弃东方诸行省，帝国自此永难复合。"
        ],
        "source": "巴比伦继业者编年史泥板；波利艾努斯·战略；普鲁塔克·德米特里传",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_seleucus_i",
            "battleId": "chron:evt_0256",
            "battleName": "巴比伦黎明决战",
            "battleYear": -309,
            "battleType": "field",
            "role": "attacker",
            "targetName": "美索不达米亚巴比伦城郊",
            "chronicleFrom": "city_babilun",
            "targetLat": 32.542,
            "targetLng": 44.421,
            "myTroops": 15000,
            "enemyFactionId": "antigonid",
            "enemyFactionName": "安提柯",
            "enemyGeneralId": "bfe_antigonus",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0259",
        "baton": "13A",
        "year": -306,
        "season": 0,
        "title": "萨拉米斯海战",
        "kind": "battle",
        "place": {
            "name": "塞浦路斯东岸萨拉米斯外海",
            "lat": 35.12,
            "lng": 33.94
        },
        "leadGeneralId": "tuolemi_tuolemi",
        "strategic": [
            "公元前三零六年春，东方赵武灵王始行胡服骑射西略河套榆中、楚国东破越国之际，东地中海爆发空前海上决战。安提柯一世命子德米特里一世跨海登陆塞浦路斯，围困托勒密一世之弟墨涅拉俄斯于萨拉米斯；托勒密一世亲统埃及主力舰队驰援企图内外夹击。"
        ],
        "tactical": [
            "萨拉米斯港外海面狭窄，德米特里一世分少部战舰严堵港出口阻断城内出援，自率装配重型弩炮与投石机的巨型多桨战舰强化左翼向海面迂回。两军青铜撞角猛撞、箭石如雨，德米特里左翼率先击穿埃及右翼并向中军包抄，彻底击溃埃及舰队，安提柯父子遂加冕称王。"
        ],
        "source": "西西里的狄奥多罗斯·历史丛书；普鲁塔克·德米特里传；波利艾努斯·战略",
        "winner": "attacker",
        "battle": {
            "generalId": "tuolemi_tuolemi",
            "battleId": "chron:evt_0259",
            "battleName": "萨拉米斯海战",
            "battleYear": -306,
            "battleType": "field",
            "role": "defender",
            "targetName": "塞浦路斯东岸萨拉米斯外海",
            "chronicleFrom": "city_yalishanda",
            "targetLat": 35.12,
            "targetLng": 33.94,
            "myTroops": 15000,
            "enemyFactionId": "antigonid",
            "enemyFactionName": "安提柯",
            "enemyGeneralId": "antigonid_demetrius",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0260",
        "baton": "13A",
        "year": -305,
        "season": 1,
        "title": "罗得岛围城战",
        "kind": "battle",
        "place": {
            "name": "爱琴海东南门户罗得港城",
            "lat": 36.44,
            "lng": 28.22
        },
        "leadGeneralId": "antigonid_demetrius",
        "strategic": [
            "公元前三零五年夏，安提柯一世远征埃及受阻于尼罗河防线无功而返，转而迁怒于拒不参战且与埃及商贸密切的航海强邦罗得岛。德米特里一世奉父命统舰队与工程名匠跨海登陆罗得岛强攻港城，托勒密一世则源源不断偷运粮秣勇士入港助守。"
        ],
        "tactical": [
            "罗得城港湾曲折、双层石垣坚固。德米特里一世海攻防波堤受挫后转攻陆墙，督造包裹铁皮、满载弩炮投石机的巨型攻城塔赫勒波利斯推逼城下；守军于内侧抢筑新墙，乘夜抛射火矢铁弹击损攻城塔护甲使其停摆。围困经年难下，德米特里终在调停下议和撤军。"
        ],
        "source": "西西里的狄奥多罗斯·历史丛书；普鲁塔克·德米特里传；维特鲁威·建筑十书",
        "winner": "defender",
        "battle": {
            "generalId": "antigonid_demetrius",
            "battleId": "chron:evt_0260",
            "battleName": "罗得岛围城战",
            "battleYear": -305,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "爱琴海东南门户罗得港城",
            "targetCityId": "city_rhodes",
            "chronicleCity": {
                "cityId": "city_rhodes",
                "before": "rhodes",
                "after": "rhodes"
            },
            "chronicleFrom": "city_halikanasu",
            "targetLat": 36.44,
            "targetLng": 28.22,
            "myTroops": 15000,
            "enemyFactionId": "rhodes",
            "enemyFactionName": "罗得",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0261",
        "baton": "13B",
        "year": -304,
        "season": 0,
        "title": "印度河阻击会战",
        "kind": "battle",
        "place": {
            "name": "印度河上游犍陀罗东渡口",
            "lat": 33.767,
            "lng": 72.361
        },
        "leadGeneralId": "gen_seleucus_i",
        "strategic": [
            "公元前三零四年春，罗得岛围城议和落幕之际，南亚西北门户上演东西两大新兴霸主的巅峰碰撞。平定中亚的塞琉古一世意图恢复马其顿在印度的旧疆，亲统大军翻越兴都库什山脉东渡印度河；已一统北印度的孔雀王朝开国君主旃陀罗笈多亲统战象步骑迎头阻截。"
        ],
        "tactical": [
            "印度河激流湍急、西岸山峦险峻。塞琉古一世长矛方阵渡河后遭遇孔雀大军排山倒海的披甲巨象集群与长弓战车迎面冲击，补给线更受山地部族袭扰而寸步难行；面对旃陀罗笈多雷霆军势，塞琉古审时度势缔结联姻和约，割让犍陀罗等西境换取大批印度战象西返。"
        ],
        "source": "斯特拉波·地理志；阿庇安·叙利亚战记；普鲁塔克·亚历山大传；查士丁·腓力史概要",
        "winner": "defender",
        "battle": {
            "generalId": "gen_seleucus_i",
            "battleId": "chron:evt_0261",
            "battleName": "印度河阻击会战",
            "battleYear": -304,
            "battleType": "field",
            "role": "attacker",
            "targetName": "印度河上游犍陀罗东渡口",
            "chronicleFrom": "city_lanshi",
            "targetLat": 33.767,
            "targetLng": 72.361,
            "myTroops": 15000,
            "enemyFactionId": "kongque",
            "enemyFactionName": "孔雀帝国",
            "enemyGeneralId": "kongque_zhantuoluo",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0262",
        "baton": "14",
        "year": -303,
        "season": 2,
        "title": "中山丹丘攻城战",
        "kind": "battle",
        "place": {
            "name": "太行东麓中山丹丘与鸱之塞",
            "lat": 38.861,
            "lng": 114.769
        },
        "leadGeneralId": "lingqiu_zhaowuling",
        "strategic": [
            "公元前三零三年秋，西方塞琉古一世驱印度战象西进会合反安提柯同盟之际，东方赵武灵王赵雍历经胡服骑射军改已练成强悍骑军。为拔除嵌在赵国南北腹心、倚恃齐魏外援侵暴赵地的宿敌中山国，赵武灵王分遣猛将牛翦与赵袑多路进逼中山西翼屏障。"
        ],
        "tactical": [
            "丹丘、华阳与鸱之塞沿太行东麓险峻陉道修筑，石垣关隘拱卫中山腹地灵寿。中山军凭山险与重车步卒死守，牛翦统轻便胡服骑射劲旅穿插迂回，以迅捷骑射截断各塞烽火驰援，赵袑部同步猛攻正面关墙，连克丹丘华阳及鸱之塞，剥除中山西部山防外藩。"
        ],
        "source": "史记·赵世家；战国策·赵策；资治通鉴·周纪",
        "winner": "attacker",
        "battle": {
            "generalId": "lingqiu_zhaowuling",
            "battleId": "chron:evt_0262",
            "battleName": "中山丹丘攻城战",
            "battleYear": -303,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "太行东麓中山丹丘与鸱之塞",
            "targetCityId": "city_daomaguan",
            "chronicleCity": {
                "cityId": "city_daomaguan",
                "before": "zhongshan",
                "after": "zhao"
            },
            "chronicleFrom": "city_handan",
            "targetLat": 38.861,
            "targetLng": 114.769,
            "myTroops": 15000,
            "enemyFactionId": "zhongshan",
            "enemyFactionName": "中山",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0266",
        "baton": "14",
        "year": -300,
        "season": 2,
        "title": "云中破林胡拓边战",
        "kind": "battle",
        "place": {
            "name": "阴山南麓与河套东缘云中原野",
            "lat": 40.273,
            "lng": 111.14
        },
        "leadGeneralId": "lingqiu_zhaowuling",
        "strategic": [
            "公元前三零零年秋，西方塞琉古一世瓜分安提柯旧土营建安条克城之际，东方赵武灵王赵雍在连挫中山国后，决意扫荡威胁晋北与代地的北方游牧强族林胡与楼烦。赵武灵王亲统实战锤炼的胡服骑射军团北出句注塞，向阴山南麓至河套东岸草场发起大规模远征。"
        ],
        "tactical": [
            "云中至九原水草丰茂、旷野无垠，向为林胡与楼烦轻骑牧猎腹地。昔日笨重中原战车入塞每陷被动，此番赵军骑士尽穿短衣皮靴，跨骏马引劲弓高速迂回包抄，正面击穿胡骑游射阵线；林胡楼烦溃散北遁，赵国收编善射胡骑，辟云中雁门代郡并筑阴山长城。"
        ],
        "source": "史记·赵世家；史记·匈奴列传；战国策·赵策",
        "winner": "attacker",
        "battle": {
            "generalId": "lingqiu_zhaowuling",
            "battleId": "chron:evt_0266",
            "battleName": "云中破林胡拓边战",
            "battleYear": -300,
            "battleType": "field",
            "role": "attacker",
            "targetName": "阴山南麓与河套东缘云中原野",
            "chronicleFrom": "city_handan",
            "targetLat": 40.273,
            "targetLng": 111.14,
            "myTroops": 15000,
            "enemyFactionId": "linhu",
            "enemyFactionName": "林胡",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0270",
        "baton": "14",
        "year": -296,
        "season": 2,
        "title": "灵寿灭中山之战",
        "kind": "battle",
        "place": {
            "name": "太行山东麓中山王都灵寿",
            "lat": 38.13,
            "lng": 114.59
        },
        "leadGeneralId": "lingqiu_zhaowuling",
        "strategic": [
            "公元前二九六年秋，齐韩魏联军迫秦割地罢兵、楚怀王客死秦廷之际，赵主父赵雍偕新君赵惠文王赵何向残存的中山国发起灭国总攻。历经十余载蚕食，中山险塞尽失且外部强援齐魏忙于西线无暇北顾，赵军铁骑与步弩大军遂将中山王都灵寿铁桶合围。"
        ],
        "tactical": [
            "灵寿北倚太行、南临滹沱，夯土内外城郭宽广坚固，曾为战车强邦中枢。中山末王尚督残存贵族甲士退守内城殊死抵抗，赵主父指挥胡服骑军严密遮断粮道，步卒架云梯冲车昼夜猛攻；久困粮尽的守军防线终溃，赵军破城俘迁中山王尚，使赵国南北领土连成一体。"
        ],
        "source": "史记·赵世家；史记·六国年表；战国策·中山策",
        "winner": "attacker",
        "battle": {
            "generalId": "lingqiu_zhaowuling",
            "battleId": "chron:evt_0270",
            "battleName": "灵寿灭中山之战",
            "battleYear": -296,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "太行山东麓中山王都灵寿",
            "targetCityId": "city_zhending",
            "chronicleCity": {
                "cityId": "city_zhending",
                "before": "zhongshan",
                "after": "zhao"
            },
            "chronicleFrom": "city_handan",
            "targetLat": 38.13,
            "targetLng": 114.59,
            "myTroops": 15000,
            "enemyFactionId": "zhongshan",
            "enemyFactionName": "中山",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0273",
        "baton": "15A",
        "year": -293,
        "season": 0,
        "title": "伊阙之战",
        "kind": "battle",
        "place": {
            "name": "洛阳南郊伊水龙门山口伊阙",
            "lat": 34.62,
            "lng": 112.45
        },
        "leadGeneralId": "xin_baiqi",
        "strategic": [
            "公元前二九三年春，西方罗马击破萨莫奈麻布军团同年，洛阳南郊伊阙山口爆发震撼战国的歼灭大战。韩国大将暴鸢联合魏帅公孙喜并东周兵马共组大军，凭伊水两岸龙门山险筑垒封锁，企图倚仗优势兵力困退孤军深入的秦国左更白起。"
        ],
        "tactical": [
            "伊阙两山对峙如门阙，伊水穿流其间。白起按兵洞察韩魏貌合神离、互望友军先战消耗秦锋，遂在韩阵前遍树旌旗设疑兵牵制暴鸢，自统铁甲精锐循山后小径绕袭魏军侧背；魏军猝溃牵动韩阵奔逃，白起纵骑追剿生擒公孙喜并尽拔伊阙诸城，一战威震天下。"
        ],
        "source": "史记·白起王翦列传；史记·穰侯列传；战国策·魏策；睡虎地秦简·编年纪",
        "winner": "attacker",
        "battle": {
            "generalId": "xin_baiqi",
            "battleId": "chron:evt_0273",
            "battleName": "伊阙之战",
            "battleYear": -293,
            "battleType": "field",
            "role": "attacker",
            "targetName": "洛阳南郊伊水龙门山口伊阙",
            "chronicleFrom": "city_changan",
            "targetLat": 34.62,
            "targetLng": 112.45,
            "myTroops": 15000,
            "enemyFactionId": "han",
            "enemyFactionName": "韩国",
            "enemyGeneralId": "han_baoyuan",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0274",
        "baton": "15A",
        "year": -292,
        "season": 1,
        "title": "垣城攻魏之战",
        "kind": "battle",
        "place": {
            "name": "中条山南麓黄河北岸垣城",
            "lat": 35.15,
            "lng": 112.3
        },
        "leadGeneralId": "xin_baiqi",
        "strategic": [
            "公元前二九二年夏，巴尔干德米特里一世进围底比斯之际，秦国乘伊阙大捷之威向黄河两岸扩张。因功迁大良造的白起奉秦昭襄王命，自伊洛挥师北渡黄河切入魏国河东与河内交界地带，兵锋直指中条山南麓控扼黄河渡口与轵关陉咽喉的魏国坚城垣邑。"
        ],
        "tactical": [
            "垣城北靠王屋中条崇山、南临黄河天险，为沟通魏国河东安邑与都城大梁的枢纽。魏军虽经重创仍凭险固守，白起先遣奇兵封锁轵关山道阻断魏援，继以强弩冲车昼夜轮番猛击薄弱城段；秦军锐士冒死攀堞攻拔魏城与垣邑，将三晋河东防线彻底切割成孤岛。"
        ],
        "source": "史记·秦本纪；史记·白起王翦列传；史记·魏世家",
        "winner": "attacker",
        "battle": {
            "generalId": "xin_baiqi",
            "battleId": "chron:evt_0274",
            "battleName": "垣城攻魏之战",
            "battleYear": -292,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "中条山南麓黄河北岸垣城",
            "targetCityId": "city_zhiguan",
            "chronicleCity": {
                "cityId": "city_zhiguan",
                "before": "wei",
                "after": "qin"
            },
            "chronicleFrom": "city_changan",
            "targetLat": 35.15,
            "targetLng": 112.3,
            "myTroops": 15000,
            "enemyFactionId": "wei",
            "enemyFactionName": "魏国",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0282",
        "baton": "15A",
        "year": -284,
        "season": 2,
        "title": "济西之战",
        "kind": "battle",
        "place": {
            "name": "山东济水西岸平原",
            "lat": 36.432,
            "lng": 115.955
        },
        "leadGeneralId": "yan_leyi",
        "strategic": [
            "公元前二八四年秋，西方高卢塞诺内斯人在阿雷提乌姆重创罗马军团之际，东方燕昭王励精图治终乘齐湣王灭宋骄横、四邻离心之机雪耻复仇。燕昭王拜乐毅为上将军，会合秦将尉斯离及赵韩魏精锐共组五国联军东进，齐湣王命大将触子西渡济水迎战。"
        ],
        "tactical": [
            "济西原野平旷，济水横亘齐军背后。两军甫接仗，齐湣王遣使斥责触子不战必灭族，触子愤恨欲败齐师，交锋高潮突然鸣金后撤；乐毅敏锐捕捉战机，挥五国铁骑步弩排山倒海掩杀摧毁齐军主力。列国班师后乐毅独统燕军攻陷临淄，连下齐境城邑唯余莒与即墨。"
        ],
        "source": "史记·乐毅列传；史记·田敬仲完世家；吕氏春秋·权勋；战国策·燕策",
        "winner": "attacker",
        "battle": {
            "generalId": "yan_leyi",
            "battleId": "chron:evt_0282",
            "battleName": "济西之战",
            "battleYear": -284,
            "battleType": "field",
            "role": "attacker",
            "targetName": "山东济水西岸平原",
            "chronicleFrom": "city_beijing",
            "targetLat": 36.432,
            "targetLng": 115.955,
            "myTroops": 15000,
            "enemyFactionId": "qi",
            "enemyFactionName": "齐国",
            "enemyGeneralId": "bfe_chuzi",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0290",
        "baton": "15A",
        "year": -278,
        "season": 0,
        "title": "鄢郢破都之战",
        "kind": "battle",
        "place": {
            "name": "江汉平原楚国国都纪南郢城",
            "lat": 30.35,
            "lng": 112.18
        },
        "leadGeneralId": "xin_baiqi",
        "strategic": [
            "公元前二七八年春，西方皮洛士渡海入西西里抗击迦太基、高卢余部涌入小亚细亚之际，东方秦大良造白起在引水灌溃楚北屏鄢城后，不待楚军重整便统孤军深入江汉平原。秦军焚舟烧桥自绝退路示死战决心，兵锋直扑楚国经营数世纪的繁华王都郢城。"
        ],
        "tactical": [
            "郢城坐落长江北岸云梦泽水网之间，高垣广池甲于南方。然楚顷襄王熊横与贵族早被鄢城惨败吓破胆魄，调度失灵，秦军锐士凭必死斗志突破水陆防线攻陷郢都，西进焚毁楚先王陵寝夷陵；楚王东逃陈城，屈原投汨罗江殉国，秦置南郡并封白起为武安君。"
        ],
        "source": "史记·白起王翦列传；史记·楚世家；战国策·秦策；睡虎地秦简·编年纪",
        "winner": "attacker",
        "battle": {
            "generalId": "xin_baiqi",
            "battleId": "chron:evt_0290",
            "battleName": "鄢郢破都之战",
            "battleYear": -278,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "江汉平原楚国国都纪南郢城",
            "targetCityId": "city_ying",
            "chronicleCity": {
                "cityId": "city_ying",
                "before": "chuguo",
                "after": "qin"
            },
            "routeVia": [
                {
                    "name": "鄢",
                    "lat": 31.72,
                    "lng": 112.26
                }
            ],
            "chronicleFrom": "city_changan",
            "targetLat": 30.35,
            "targetLng": 112.18,
            "myTroops": 15000,
            "enemyFactionId": "chuguo",
            "enemyFactionName": "楚国",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0295",
        "baton": "15A",
        "year": -273,
        "season": 1,
        "title": "华阳之战",
        "kind": "battle",
        "place": {
            "name": "新郑北郊韩国重镇华阳",
            "lat": 34.4,
            "lng": 113.74
        },
        "leadGeneralId": "xin_baiqi",
        "strategic": [
            "公元前二七三年夏，南亚孔雀王朝阿育王正式加冕主政之际，中原再度掀起大国决战。魏赵联兵伐韩，由智将芒卯与贾偃重兵围困新郑北屏华阳；韩使陈筮星夜入咸阳告急，秦昭襄王命武安君白起偕客卿胡阳统关中精锐采取千里奔袭战术闪电救韩。"
        ],
        "tactical": [
            "华阳地处郑韩平原要冲，芒卯与贾偃断定秦国远隔崤函不肯轻救，营垒戒备疏懈。白起与胡阳督秦军昼夜兼程疾行，猝然杀至华阳城外趁联军未及列阵分路猛攻；秦军铁骑一鼓冲垮芒卯中军生擒诸将，并将贾偃赵军压入黄河重创，乘胜逼大梁迫魏割南阳求和。"
        ],
        "source": "史记·白起王翦列传；史记·穰侯列传；战国策·魏策；资治通鉴·周纪",
        "winner": "attacker",
        "battle": {
            "generalId": "xin_baiqi",
            "battleId": "chron:evt_0295",
            "battleName": "华阳之战",
            "battleYear": -273,
            "battleType": "field",
            "role": "attacker",
            "targetName": "新郑北郊韩国重镇华阳",
            "chronicleFrom": "city_changan",
            "targetLat": 34.4,
            "targetLng": 113.74,
            "myTroops": 15000,
            "enemyFactionId": "wei",
            "enemyFactionName": "魏国",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0299",
        "baton": "15A",
        "year": -269,
        "season": 2,
        "title": "阏与之战",
        "kind": "battle",
        "place": {
            "name": "太行山腹地险塞阏与",
            "lat": 36.487,
            "lng": 113.381
        },
        "leadGeneralId": "liguo_zhaoshe",
        "strategic": [
            "公元前二六九年秋，秦昭襄王因易城盟约纠葛遣大将胡阳翻越太行山猛攻要塞阏与。赵惠文王问计于廉颇与乐乘，二将皆言道远险狭难救，唯田部吏出身的将领赵奢慨然请战曰狭路相逢勇者胜；赵王遂拜赵奢统军驰援，上演奇正机动的破秦名局。"
        ],
        "tactical": [
            "赵奢出邯郸即增垒驻扎，立斩请速救武安者并厚待秦细作，使胡阳认定赵军怯战而松懈防备。遣走细作后赵奢令全军卷甲衔枚昼夜疾驰抵阏与，纳军士许历谏抢占北山制高点；胡阳仰攻受挫，赵奢挥主力自山巅咆哮俯冲配合守军夹击，大破秦军解阏与之围。"
        ],
        "source": "史记·廉颇蔺相如列传；史记·赵世家；战国策·赵策",
        "winner": "defender",
        "battle": {
            "generalId": "liguo_zhaoshe",
            "battleId": "chron:evt_0299",
            "battleName": "阏与之战",
            "battleYear": -269,
            "battleType": "field",
            "role": "defender",
            "targetName": "太行山腹地险塞阏与",
            "chronicleFrom": "city_handan",
            "targetLat": 36.487,
            "targetLng": 113.381,
            "myTroops": 15000,
            "enemyFactionId": "qin",
            "enemyFactionName": "秦国",
            "enemyGeneralId": "bfe3_7",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0304",
        "baton": "15A",
        "year": -263,
        "season": 2,
        "title": "南阳绝太行道之战",
        "kind": "battle",
        "place": {
            "name": "太行山南麓南阳与羊肠坂陉道",
            "lat": 35.27,
            "lng": 112.93
        },
        "leadGeneralId": "xin_baiqi",
        "strategic": [
            "公元前二六三年秋，西方罗马进逼叙拉古迫希伦二世结盟之际，东方秦国按相邦范雎远交近攻蓝图向韩国腹心劈出重剑。秦昭襄王罢黜穰侯独揽大权后，命武安君白起统主力自河内河东夹击韩国黄河北岸南阳，直指连接韩都新郑与上党高原的太行山陉道。"
        ],
        "tactical": [
            "太行山南麓峭壁千仞，唯羊肠坂道与天井关沟通山南北。白起麾下锐士先席卷山南韩国南阳诸邑，旋乘胜仰攻攀夺太行险隘，击溃据险韩军并筑垒锁死山口；此役彻底腰斩韩国本土与上党郡的陆路血脉，使上党孤悬绝地，直接引爆秦赵倾国相搏的长平大战。"
        ],
        "source": "史记·秦本纪；史记·白起王翦列传；史记·韩世家",
        "winner": "attacker",
        "battle": {
            "generalId": "xin_baiqi",
            "battleId": "chron:evt_0304",
            "battleName": "南阳绝太行道之战",
            "battleYear": -263,
            "battleType": "field",
            "role": "attacker",
            "targetName": "太行山南麓南阳与羊肠坂陉道",
            "chronicleFrom": "city_changan",
            "targetLat": 35.27,
            "targetLng": 112.93,
            "myTroops": 15000,
            "enemyFactionId": "han",
            "enemyFactionName": "韩国",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0308",
        "baton": "15A",
        "year": -260,
        "season": 2,
        "title": "长平之战",
        "kind": "battle",
        "place": {
            "name": "上党长平丹水河谷",
            "lat": 36.149,
            "lng": 113.008
        },
        "leadGeneralId": "xin_baiqi",
        "strategic": [
            "公元前二六零年秋，西方罗马乌鸦吊桥称雄米莱海面之际，东方秦赵倾尽国力在上党长平迎来决定华夏一统命运的决战。廉颇筑高垒坚守耗秦，秦相范雎施反间计诱赵王以熟读兵书乏实战的赵括代将；秦昭襄王密拜白起为上将军赴阵，严令军中敢泄武安君将者斩。"
        ],
        "tactical": [
            "长平群山夹峙丹水河谷，赵括抵阵改守为攻渡水猛扑。白起授意佯败诱敌深入秦壁，暗遣奇兵绕后截断故关粮道，另派精骑横切赵营将其一分为二；赵军断粮久困至绝境，赵括率锐卒决死突围遭强弩射杀，穷途投降的赵军尽被白起坑杀，山东诸侯自此无力独抗强秦。"
        ],
        "source": "史记·白起王翦列传；史记·廉颇蔺相如列传；战国策·赵策；资治通鉴·周纪",
        "winner": "attacker",
        "battle": {
            "generalId": "xin_baiqi",
            "battleId": "chron:evt_0308",
            "battleName": "长平之战",
            "battleYear": -260,
            "battleType": "field",
            "role": "attacker",
            "targetName": "上党长平丹水河谷",
            "chronicleFrom": "city_changan",
            "targetLat": 36.149,
            "targetLng": 113.008,
            "myTroops": 15000,
            "enemyFactionId": "zhao",
            "enemyFactionName": "赵国",
            "enemyGeneralId": "zhao_zhaokuo",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0309",
        "baton": "15A",
        "year": -259,
        "season": 2,
        "title": "邯郸初围战",
        "kind": "battle",
        "place": {
            "name": "赵都邯郸",
            "lat": 36.61,
            "lng": 114.49
        },
        "leadGeneralId": "zhao_lianpo",
        "strategic": [
            "公元前二五九年秋，秦国在长平重创赵军主力后乘胜分兵东进，北路收复太原上党，中路拔取武安皮牢，秦昭襄王随即命大将王陵统精兵直扑赵都邯郸。赵孝成王临危命廉颇整饬残旅、平原君赵胜倾散家财招募死士，军民同仇敌忾据守孤城。"
        ],
        "tactical": [
            "邯郸城垣高耸坚固，王陵督率秦军步弩连营进逼外郭，架设云梯冲车昼夜猛攻。赵将廉颇与平原君调度守卒依托城堞轮番攒射，滚木擂石倾泻而下，屡次焚毁秦军攻城器械；秦师强攻经冬伤亡枕藉而寸步难进，攻势被迫转入长期困守。"
        ],
        "source": "史记·白起王翦列传；史记·赵世家；战国策·赵策",
        "winner": "defender",
        "battle": {
            "generalId": "zhao_lianpo",
            "battleId": "chron:evt_0309",
            "battleName": "邯郸初围战",
            "battleYear": -259,
            "battleType": "siege",
            "role": "defender",
            "targetName": "赵都邯郸",
            "targetCityId": "city_handan",
            "chronicleCity": {
                "cityId": "city_handan",
                "before": "zhao",
                "after": "zhao"
            },
            "chronicleFrom": "city_handan",
            "targetLat": 36.61,
            "targetLng": 114.49,
            "myTroops": 15000,
            "enemyFactionId": "qin",
            "enemyFactionName": "秦国",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0311",
        "baton": "15A",
        "year": -257,
        "season": 3,
        "title": "邯郸保卫战",
        "kind": "battle",
        "place": {
            "name": "赵都邯郸城外",
            "lat": 36.61,
            "lng": 114.49
        },
        "leadGeneralId": "shang_weiwuji",
        "strategic": [
            "公元前二五七年冬，秦国大将王龁接替王陵围困邯郸经年，城中炊骨易子危在旦夕。赵相平原君遣使泣血求援，楚考烈王派春申君黄歇北上救赵，魏信陵君魏无忌采纳侯嬴之策窃取虎符，椎杀宿将晋鄙夺取邺城魏军，精选锐卒星夜驰援邯郸。"
        ],
        "tactical": [
            "魏无忌统率魏军精锐自背侧猛扑王龁围城大营，春申君楚师自东翼协同进逼，平原君赵胜亦率邯郸敢死之士开城突击。三路大军内外合击声震原野，秦军腹背受敌防线崩溃，王龁率主力狼狈西撤汾城，偏将郑安平被围投降，六国自此得以延续国祚。"
        ],
        "source": "史记·魏公子列传；史记·白起王翦列传；史记·春申君列传",
        "winner": "attacker",
        "battle": {
            "generalId": "shang_weiwuji",
            "battleId": "chron:evt_0311",
            "battleName": "邯郸保卫战",
            "battleYear": -257,
            "battleType": "field",
            "role": "attacker",
            "targetName": "赵都邯郸城外",
            "chronicleFrom": "city_bianliang",
            "targetLat": 36.61,
            "targetLng": 114.49,
            "myTroops": 15000,
            "enemyFactionId": "qin",
            "enemyFactionName": "秦国",
            "enemyGeneralId": "bfe3_9",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0312",
        "baton": "15B",
        "year": -256,
        "season": 2,
        "title": "秦灭西周国之战",
        "kind": "battle",
        "place": {
            "name": "洛阳王城与伊阙",
            "lat": 34.62,
            "lng": 112.45
        },
        "leadGeneralId": "qin_jiu",
        "strategic": [
            "公元前二五六年秋，秦昭襄王为挽回邯郸失利声威，命将军摎东出攻取韩国阳城与负黍。依附于西周国的周赧王与西周武公忧惧秦师逼近王畿，遂联络关东诸侯发兵出伊阙塞阻断秦军阳城通道，秦廷当即借机下令挥师讨伐洛阳西周王城。"
        ],
        "tactical": [
            "各路诸侯忌惮秦军兵威迟疑不前，周室孤军陈兵伊阙难以抵御秦国铁骑冲杀。将军摎率秦军主力一举击散周师防线，铁甲兵锋直抵王城城下形成合围；西周君被迫素衣入秦顿首献出全部城邑户籍，同年周赧王忧愤病逝，绵延数百年之东周王朝正式覆亡。"
        ],
        "source": "史记·周本纪；史记·秦本纪",
        "winner": "attacker",
        "battle": {
            "generalId": "qin_jiu",
            "battleId": "chron:evt_0312",
            "battleName": "秦灭西周国之战",
            "battleYear": -256,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "洛阳王城与伊阙",
            "targetCityId": "city_luoyang",
            "chronicleCity": {
                "cityId": "city_luoyang",
                "before": "zhou",
                "after": "qin"
            },
            "chronicleFrom": "city_changan",
            "targetLat": 34.62,
            "targetLng": 112.45,
            "myTroops": 15000,
            "enemyFactionId": "zhou",
            "enemyFactionName": "姬周",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0319",
        "baton": "15B",
        "year": -249,
        "season": 0,
        "title": "秦灭东周国之战",
        "kind": "battle",
        "place": {
            "name": "河南巩邑与洛阳",
            "lat": 34.81,
            "lng": 113.17
        },
        "leadGeneralId": "qin_mengao",
        "strategic": [
            "公元前二四九年春，秦庄襄王初立，拜吕不韦为相国图谋东进中原。盘踞巩邑延续姬周宗祀的东周君忧惧覆亡，暗中串联韩魏诸侯谋划合兵伐秦；秦庄襄王获报当机立断，命相国吕不韦统率关中劲旅东出函谷关，直扑东周国都巩邑。"
        ],
        "tactical": [
            "关东各国震慑秦师锋芒无人敢发援兵，吕不韦率秦军铁骑疾驰包抄巩邑与洛阳诸邑，以绝对优势兵力摧毁外围关防。东周守军寡不敌众迅速瓦解，吕不韦攻破巩邑生俘东周君并将其迁置阳人聚，尽收河南七邑紧邻韩境设置三川郡，周室残余宗祀至此彻底断绝。"
        ],
        "source": "史记·秦本纪；史记·吕不韦列传",
        "winner": "attacker",
        "battle": {
            "generalId": "qin_mengao",
            "battleId": "chron:evt_0319",
            "battleName": "秦灭东周国之战",
            "battleYear": -249,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "河南巩邑与洛阳",
            "targetCityId": "city_hulaoguan",
            "chronicleCity": {
                "cityId": "city_hulaoguan",
                "before": "zhou",
                "after": "qin"
            },
            "chronicleFrom": "city_changan",
            "targetLat": 34.81,
            "targetLng": 113.17,
            "myTroops": 15000,
            "enemyFactionId": "zhou",
            "enemyFactionName": "姬周",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0320",
        "baton": "15B",
        "year": -248,
        "season": 0,
        "title": "蒙骜攻赵定太原之战",
        "kind": "battle",
        "place": {
            "name": "晋阳及榆次狼孟",
            "lat": 37.87,
            "lng": 112.55
        },
        "leadGeneralId": "qin_mengao",
        "strategic": [
            "公元前二四八年春，秦国置三川郡打通中原门户后，立即将兵锋北指赵国西翼战略屏障太原地区。秦庄襄王命老将蒙骜统大军自河东北上逾越霍太山，全面进击赵国经营已久的晋阳盆地，企图夺占太行山西麓要地并从侧背居高临下俯瞰邯郸。"
        ],
        "tactical": [
            "蒙骜指挥秦军步骑依托汾水河谷步步推进，先拔外围重镇榆次与狼孟剪除晋阳羽翼，切断太原同代北及邯郸的驰援山道。秦师随即合围猛攻晋阳等数十座城邑，逐城击破赵军守御，将太原全境纳入秦廷版图设立太原郡，大幅压缩赵国战略纵深。"
        ],
        "source": "史记·秦本纪；史记·蒙恬列传；史记·六国年表",
        "winner": "attacker",
        "battle": {
            "generalId": "qin_mengao",
            "battleId": "chron:evt_0320",
            "battleName": "蒙骜攻赵定太原之战",
            "battleYear": -248,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "晋阳及榆次狼孟",
            "targetCityId": "city_taiyuan",
            "chronicleCity": {
                "cityId": "city_taiyuan",
                "before": "zhao",
                "after": "qin"
            },
            "chronicleFrom": "city_changan",
            "targetLat": 37.87,
            "targetLng": 112.55,
            "myTroops": 15000,
            "enemyFactionId": "zhao",
            "enemyFactionName": "赵国",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0321",
        "baton": "15B",
        "year": -247,
        "season": 1,
        "title": "河外之战",
        "kind": "battle",
        "place": {
            "name": "黄河以南陕华河外至函谷关",
            "lat": 34.615,
            "lng": 110.915
        },
        "leadGeneralId": "shang_weiwuji",
        "strategic": [
            "公元前二四七年夏，秦将蒙骜大举攻魏连拔高都与汲城，魏军屡败告急。魏安釐王遣使赴赵迎回寓居邯郸多年的信陵君魏无忌并授以上将军印；魏无忌传檄天下求援，赵、韩、楚、燕各国敬仰信陵君威望纷纷发兵听调，合五国劲旅西向迎击秦师。"
        ],
        "tactical": [
            "两军主力会战于黄河以南河外原野，魏无忌亲冒矢石率精锐战车步骑率先冲阵，五国将士士气大振紧随掩杀。蒙骜所部遭联军正面猛冲与侧翼包抄，阵脚大乱向西溃败；魏无忌乘胜长驱追击直抵函谷关下，秦军紧闭关门坚守逾月不敢出战，信陵君威震天下。"
        ],
        "source": "史记·魏公子列传；史记·秦本纪；资治通鉴·周纪",
        "winner": "attacker",
        "battle": {
            "generalId": "shang_weiwuji",
            "battleId": "chron:evt_0321",
            "battleName": "河外之战",
            "battleYear": -247,
            "battleType": "field",
            "role": "attacker",
            "targetName": "黄河以南陕华河外至函谷关",
            "chronicleFrom": "city_bianliang",
            "targetLat": 34.615,
            "targetLng": 110.915,
            "myTroops": 15000,
            "enemyFactionId": "qin",
            "enemyFactionName": "秦国",
            "enemyGeneralId": "qin_mengao",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0324",
        "baton": "15B",
        "year": -244,
        "season": 2,
        "title": "赵破匈奴雁门之战",
        "kind": "battle",
        "place": {
            "name": "代郡与雁门塞外草原",
            "lat": 39.998,
            "lng": 112.42
        },
        "leadGeneralId": "wuzhou_limu",
        "strategic": [
            "公元前二四四年秋，久驻代郡与雁门防备北胡的赵国良将李牧，经数年市租犒士、坚壁收保蓄养锋芒，麾下精选战车、骑射与强弩劲卒皆求一战。李牧判断决战时机成熟，故意纵使边民满野放牧畜群以诱敌深入，匈奴单于果真误认李牧怯战而倾发控弦大军南侵。"
        ],
        "tactical": [
            "面对匈奴先遣骑兵试探，李牧指挥前锋佯装溃败委弃牲畜，诱使匈奴单于主力放心长驱深入雁门伏击圈。李牧旋即展开演练纯熟的左右两翼大阵，以重装战车封锁退路、劲弩攒射破阵、胡服精骑往复包抄合击，一举歼灭匈奴主力并连破东胡林胡，北塞十余年无警。"
        ],
        "source": "史记·廉颇蔺相如列传；资治通鉴·秦纪",
        "winner": "attacker",
        "battle": {
            "generalId": "wuzhou_limu",
            "battleId": "chron:evt_0324",
            "battleName": "赵破匈奴雁门之战",
            "battleYear": -244,
            "battleType": "field",
            "role": "attacker",
            "targetName": "代郡与雁门塞外草原",
            "chronicleFrom": "city_wuzhousai",
            "targetLat": 39.998,
            "targetLng": 112.42,
            "myTroops": 15000,
            "enemyFactionId": "xiongnu",
            "enemyFactionName": "匈奴",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0328",
        "baton": "15B",
        "year": -241,
        "season": 1,
        "title": "蕞之战",
        "kind": "battle",
        "place": {
            "name": "咸阳东翼临潼蕞城",
            "lat": 34.27,
            "lng": 108.93
        },
        "leadGeneralId": "chunshen_huangxie",
        "strategic": [
            "公元前二四一年夏，秦国鲸吞三晋腹地置东郡逼迫列国，楚相春申君黄歇与赵上将军庞暖遂联络楚、赵、魏、韩、燕发起战国史上最后一次合纵伐秦。楚考烈王任纵约长、黄歇当权调度，庞暖统率联军绕越蒲坂渡河深入渭北，兵锋直抵咸阳东门户蕞城。"
        ],
        "tactical": [
            "五国联军虽众却各怀异心、号令不一，面对秦军坚固城垒久攻不克。秦相吕不韦洞察楚军营盘松懈，精选关中锐卒乘黑夜衔枚疾出，单点猛扑楚国大营；楚军惊溃连夜拔营东撤，庞暖独木难支只得收兵移师改伐齐境饶安，六国自此再无力组织合纵抗秦。"
        ],
        "source": "史记·秦始皇本纪；史记·楚世家；史记·春申君列传",
        "winner": "defender",
        "battle": {
            "generalId": "chunshen_huangxie",
            "battleId": "chron:evt_0328",
            "battleName": "蕞之战",
            "battleYear": -241,
            "battleType": "field",
            "role": "attacker",
            "targetName": "咸阳东翼临潼蕞城",
            "chronicleFrom": "city_shouxian",
            "targetLat": 34.27,
            "targetLng": 108.93,
            "myTroops": 15000,
            "enemyFactionId": "qin",
            "enemyFactionName": "秦国",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0333",
        "baton": "15B",
        "year": -236,
        "season": 1,
        "title": "秦攻赵拔邺与阏与之战",
        "kind": "battle",
        "place": {
            "name": "赵境邺城与太行阏与",
            "lat": 36.1,
            "lng": 114.39
        },
        "leadGeneralId": "qin_hengyi",
        "strategic": [
            "公元前二三六年夏，亲政后的秦王嬴政采纳李斯与尉缭灭诸侯成一统方略，密切窥伺山东变局。恰逢赵悼襄王倾发主力北伐燕国拔取狸阳，南境漳水与太行防线兵力空虚；嬴政遂以救燕为名遣王翦、桓齮与杨端和分统南北两路大军，骤然向赵国腹地发起突袭。"
        ],
        "tactical": [
            "北路王翦大军自太原东越太行山脉，疾攻拔取阏与和撩阳锁死山地门户；南路桓齮与杨端和渡河猛扑漳水重镇邺城与安阳，连克外围多座城池。待两路秦师合兵一处，王翦统筹主力一举攻克坚城邺邑，将邯郸南大门彻底洞开，正式拉开秦灭六国统一战争序幕。"
        ],
        "source": "史记·秦始皇本纪；史记·赵世家",
        "winner": "attacker",
        "battle": {
            "generalId": "qin_hengyi",
            "battleId": "chron:evt_0333",
            "battleName": "秦攻赵拔邺与阏与之战",
            "battleYear": -236,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "赵境邺城与太行阏与",
            "targetCityId": "city_anyang",
            "chronicleCity": {
                "cityId": "city_anyang",
                "before": "zhao",
                "after": "qin"
            },
            "chronicleFrom": "city_changan",
            "targetLat": 36.1,
            "targetLng": 114.39,
            "myTroops": 15000,
            "enemyFactionId": "zhao",
            "enemyFactionName": "赵国",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0335",
        "baton": "15B",
        "year": -234,
        "season": 3,
        "title": "平阳之战",
        "kind": "battle",
        "place": {
            "name": "漳水北岸平阳与武城",
            "lat": 36.1,
            "lng": 114.39
        },
        "leadGeneralId": "qin_hengyi",
        "strategic": [
            "公元前二三四年冬，秦王嬴政意图先行攻灭韩国，又忧虑赵国南下援韩构成侧背大患，遂命锐将桓齮统率秦军主力自邺城北渡漳水，猛扑拱卫邯郸南郊的战略重镇平阳与武城。年少的赵幽缪王赵迁震恐，急拜大将扈辄倾发关南赵军主力出城迎战救援平阳。"
        ],
        "tactical": [
            "平阳原野开阔平坦利于秦军锐士与重骑驰骋，扈辄迫于王命仓促列阵与秦师展开正面决战。桓齮集中秦军劲弩铁骑猛烈冲击赵军中坚，撕裂防线后分兵两翼迂回合围，于平阳城外大破赵军主力并临阵击毙主帅扈辄；邯郸门户尽失，赵廷危急中飞檄召李牧南下。"
        ],
        "source": "史记·秦始皇本纪；史记·赵世家；史记·廉颇蔺相如列传",
        "winner": "attacker",
        "battle": {
            "generalId": "qin_hengyi",
            "battleId": "chron:evt_0335",
            "battleName": "平阳之战",
            "battleYear": -234,
            "battleType": "field",
            "role": "attacker",
            "targetName": "漳水北岸平阳与武城",
            "chronicleFrom": "city_changan",
            "targetLat": 36.1,
            "targetLng": 114.39,
            "myTroops": 15000,
            "enemyFactionId": "zhao",
            "enemyFactionName": "赵国",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0336",
        "baton": "15B",
        "year": -233,
        "season": 3,
        "title": "肥之战",
        "kind": "battle",
        "place": {
            "name": "太行东麓宜安与肥累",
            "lat": 38.13,
            "lng": 114.59
        },
        "leadGeneralId": "wuzhou_limu",
        "strategic": [
            "公元前二三三年冬，秦将桓齮乘平阳大胜余威绕过邯郸正面坚城，挥师北进赤丽与宜安企图自北翼包抄赵都。赵王迁急调镇守雁门的名将李牧统率边塞精锐骑步南下拜为大将军，会合邯郸守军进驻宜安迎敌；李牧鉴于秦师连胜锋锐正盛，下令筑垒深沟坚守不战。"
        ],
        "tactical": [
            "桓齮久挑宜安赵壁不下，认为李牧怯战，遂留少许留守兵力看护肥累大本营，自率主力东攻肥下诱赵出救。李牧敏锐捕捉战机，尽遣精骑劲卒乘虚突袭并一举攻破秦军肥累大营尽夺辎重；桓齮闻警回师救援，李牧早已张开两翼钳形伏阵迎头合围，大破秦军主力。"
        ],
        "source": "史记·廉颇蔺相如列传；战国策·赵策；资治通鉴·秦纪",
        "winner": "attacker",
        "battle": {
            "generalId": "wuzhou_limu",
            "battleId": "chron:evt_0336",
            "battleName": "肥之战",
            "battleYear": -233,
            "battleType": "field",
            "role": "attacker",
            "targetName": "太行东麓宜安与肥累",
            "chronicleFrom": "city_wuzhousai",
            "targetLat": 38.13,
            "targetLng": 114.59,
            "myTroops": 15000,
            "enemyFactionId": "qin",
            "enemyFactionName": "秦国",
            "enemyGeneralId": "qin_hengyi",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0337",
        "baton": "15B",
        "year": -232,
        "season": 0,
        "title": "番吾之战",
        "kind": "battle",
        "place": {
            "name": "河北灵寿西南番吾",
            "lat": 38.13,
            "lng": 114.59
        },
        "leadGeneralId": "wuzhou_limu",
        "strategic": [
            "公元前二三二年春，秦王嬴政不甘肥下受挫，再度倾发两路大军分道伐赵：南路军进抵邺城牵制赵国南境防务，北路军自太原拔取狼孟后东越太行山陉直插常山重镇番吾，妄图南北夹击压垮疲敝之赵。武安君李牧冷静判明主次，留偏师戒备南线而亲统主力北上迎击。"
        ],
        "tactical": [
            "番吾背靠太行崇山、前临滹沱水谷，地势险峻易守难攻。李牧抢占番吾山麓有利阵地依托险隘阻击，以善射边骑袭扰截断秦军太行山道粮运，继而集中精锐步骑在正面会战中迎头痛击秦北路大军；秦师进退失据遭受重创被迫撤回关中，南线韩魏亦暂获喘息。"
        ],
        "source": "史记·秦始皇本纪；史记·赵世家；史记·廉颇蔺相如列传",
        "winner": "defender",
        "battle": {
            "generalId": "wuzhou_limu",
            "battleId": "chron:evt_0337",
            "battleName": "番吾之战",
            "battleYear": -232,
            "battleType": "field",
            "role": "defender",
            "targetName": "河北灵寿西南番吾",
            "chronicleFrom": "city_wuzhousai",
            "targetLat": 38.13,
            "targetLng": 114.59,
            "myTroops": 15000,
            "enemyFactionId": "qin",
            "enemyFactionName": "秦国",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0338",
        "baton": "16",
        "year": -230,
        "season": 2,
        "title": "秦灭韩之战",
        "kind": "battle",
        "place": {
            "name": "韩国都城新郑",
            "lat": 34.4,
            "lng": 113.74
        },
        "leadGeneralId": "qin_teng",
        "strategic": [
            "公元前二三零年秋，赵国连遭地震与大饥荒侵袭无力南顾，秦王嬴政果断抓住良机率先向最孱弱的邻邦韩国发动灭国总攻。早先韩国已献南阳地，秦廷任命熟稔韩地虚实的南阳假守内史腾统率精锐大军，自三川与南阳两翼疾速出击，直扑韩国仅存的都城新郑。"
        ],
        "tactical": [
            "内史腾行军迅雷不及掩耳，强渡黄河与洛水防线昼夜兼程兵临新郑城下，使韩廷根本来不及征调外邑散兵或向魏楚求援。秦军铁甲步弩四面合围猛攻新郑城门，韩军防线在凌厉攻势下迅速崩溃；内史腾率师破城生俘韩王安，秦国尽收韩地设置颍川郡，六国首灭其一。"
        ],
        "source": "史记·秦始皇本纪；史记·韩世家；睡虎地秦简·编年记",
        "winner": "attacker",
        "battle": {
            "generalId": "qin_teng",
            "battleId": "chron:evt_0338",
            "battleName": "秦灭韩之战",
            "battleYear": -230,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "韩国都城新郑",
            "targetCityId": "city_xinzheng",
            "chronicleCity": {
                "cityId": "city_xinzheng",
                "before": "han",
                "after": "qin"
            },
            "chronicleFrom": "city_nanyang",
            "targetLat": 34.4,
            "targetLng": 113.74,
            "myTroops": 15000,
            "enemyFactionId": "han",
            "enemyFactionName": "韩国",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0340",
        "baton": "16",
        "year": -228,
        "season": 2,
        "title": "秦灭赵邯郸决战",
        "kind": "battle",
        "place": {
            "name": "赵都邯郸与东阳",
            "lat": 36.61,
            "lng": 114.49
        },
        "leadGeneralId": "ruo_wangjian",
        "strategic": [
            "公元前二二八年秋，秦上将军王翦在井陉漳水前线久受李牧与司马尚坚壁阻遏，遂遣细作携重金潜入邯郸贿赂赵王宠臣郭开，散布李牧通秦谋反谣言。昏聩的赵王迁竟捕杀擎天柱石李牧、废黜司马尚，改命平庸将领赵葱与齐将颜聚接掌帅印，赵军将士闻讯无不解体。"
        ],
        "tactical": [
            "王翦探知赵营换帅军心涣散，立即统率秦军铁骑步弩全线发起排山倒海的猛攻。秦军一战摧垮赵国野战防线，当阵击杀主将赵葱并击溃颜聚所部，随即与杨端和围城部队合兵强攻邯郸；秦军攻破城垣生俘赵王迁，赵国宗室公子嘉率残众北奔代郡自立为代王。"
        ],
        "source": "史记·秦始皇本纪；史记·赵世家；史记·廉颇蔺相如列传",
        "winner": "attacker",
        "battle": {
            "generalId": "ruo_wangjian",
            "battleId": "chron:evt_0340",
            "battleName": "秦灭赵邯郸决战",
            "battleYear": -228,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "赵都邯郸与东阳",
            "targetCityId": "city_handan",
            "chronicleCity": {
                "cityId": "city_handan",
                "before": "zhao",
                "after": "qin"
            },
            "routeVia": [
                {
                    "name": "井陉",
                    "lat": 38.04,
                    "lng": 114.14
                }
            ],
            "chronicleFrom": "city_changan",
            "targetLat": 36.61,
            "targetLng": 114.49,
            "myTroops": 15000,
            "enemyFactionId": "zhao",
            "enemyFactionName": "赵国",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0342",
        "baton": "16",
        "year": -226,
        "season": 3,
        "title": "易水破燕与拔蓟之战",
        "kind": "battle",
        "place": {
            "name": "易水西岸至燕都蓟城",
            "lat": 39.9,
            "lng": 116.41
        },
        "leadGeneralId": "ruo_wangjian",
        "strategic": [
            "公元前二二六年冬，秦王嬴政因荆轲献图行刺震怒不已，在王翦与辛胜先期于易水之西击破燕军主力的基础上，再发关中劲旅增援王翦父子北上总攻燕都蓟城。燕王喜与太子丹倾尽国中剩余甲兵，并联络西侧唇齿相依的代王赵嘉发兵合流，在易北至蓟城一线拼死布防。"
        ],
        "tactical": [
            "王翦与王贲统率百战秦师顶风冒雪强渡冰封水系，以强弩攒射与重骑冲锋再度击溃燕代阻援联军，兵锋直薄蓟城之下。秦军架设重型攻城器械四面急攻，一鼓作气突破蓟城坚垣占领燕国故都；燕王喜与太子丹仅率残部仓皇东逃辽东，不久燕王杀太子丹献首求和。"
        ],
        "source": "史记·秦始皇本纪；史记·燕召公世家；史记·刺客列传",
        "winner": "attacker",
        "battle": {
            "generalId": "ruo_wangjian",
            "battleId": "chron:evt_0342",
            "battleName": "易水破燕与拔蓟之战",
            "battleYear": -226,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "易水西岸至燕都蓟城",
            "targetCityId": "city_beijing",
            "chronicleCity": {
                "cityId": "city_beijing",
                "before": "yan",
                "after": "qin"
            },
            "chronicleFrom": "city_changan",
            "targetLat": 39.9,
            "targetLng": 116.41,
            "myTroops": 15000,
            "enemyFactionId": "yan",
            "enemyFactionName": "燕国",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0343",
        "baton": "16",
        "year": -225,
        "season": 0,
        "title": "秦灭魏大梁水攻战",
        "kind": "battle",
        "place": {
            "name": "魏都大梁",
            "lat": 34.8,
            "lng": 114.31
        },
        "leadGeneralId": "qin_wangben",
        "strategic": [
            "公元前二二五年春，秦国扫灭韩赵并重创燕国后，孤悬中原腹地的魏国四面受敌。秦王嬴政命少壮名将王贲统率大军东出关中，王贲先挥师南掠楚国北境连夺要邑以屏蔽侧背，旋即回师北上将魏国都城大梁围得水泄不通；魏王假依托深沟高垒与丰沛积粟死守待援。"
        ],
        "tactical": [
            "大梁地处平原低洼地带且城防坚厚，秦军强攻多日伤亡不小。王贲遂审视黄河与鸿沟水势，征发士卒在城外开凿长渠筑堤蓄水，引滚滚黄河浊浪直灌大梁城垣；大水浸泡数月致使夯土城墙纷纷崩塌倾颓，秦师乘舟筏突入缺口，魏王假走投无路出城请降，魏国灭亡。"
        ],
        "source": "史记·秦始皇本纪；史记·魏世家",
        "winner": "attacker",
        "battle": {
            "generalId": "qin_wangben",
            "battleId": "chron:evt_0343",
            "battleName": "秦灭魏大梁水攻战",
            "battleYear": -225,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "魏都大梁",
            "targetCityId": "city_bianliang",
            "chronicleCity": {
                "cityId": "city_bianliang",
                "before": "wei",
                "after": "qin"
            },
            "chronicleFrom": "city_changan",
            "targetLat": 34.8,
            "targetLng": 114.31,
            "myTroops": 15000,
            "enemyFactionId": "wei",
            "enemyFactionName": "魏国",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0344",
        "baton": "16",
        "year": -225,
        "season": 2,
        "title": "城父之战",
        "kind": "battle",
        "place": {
            "name": "淮北重镇城父",
            "lat": 33.88,
            "lng": 115.77
        },
        "leadGeneralId": "gen_li_xin",
        "strategic": [
            "公元前二二五年秋，秦王嬴政筹划灭楚方略，老将王翦力陈非倾国重兵不可克楚，年轻气盛的李信却自请轻兵速战。嬴政遂命李信与蒙恬分统两路秦师南下伐楚，李信攻破平舆、蒙恬大破寝丘，初战势如破竹，随即挥师折向西进约定于城父会师合流。"
        ],
        "tactical": [
            "楚国上柱国项燕洞察秦军远征骄怠且分兵回转侧翼空虚，亲统楚军主力悄然尾随李信大军昼夜疾追，连续急行不休而不露锋芒。待秦师抵近城父安营喘息之际，项燕突然挥军发起雷霆猛扑，一举攻陷秦军两座大营并斩杀多名都尉，李信全线溃败狼狈逃归秦境。"
        ],
        "source": "史记·白起王翦列传；史记·蒙恬列传",
        "winner": "attacker",
        "battle": {
            "generalId": "gen_li_xin",
            "battleId": "chron:evt_0344",
            "battleName": "城父之战",
            "battleYear": -225,
            "battleType": "field",
            "role": "defender",
            "targetName": "淮北重镇城父",
            "chronicleFrom": "city_changan",
            "targetLat": 33.88,
            "targetLng": 115.77,
            "myTroops": 15000,
            "enemyFactionId": "chuguo",
            "enemyFactionName": "楚国",
            "enemyGeneralId": "bfe3_13",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0345",
        "baton": "16",
        "year": -224,
        "season": 2,
        "title": "蕲南之战",
        "kind": "battle",
        "place": {
            "name": "淮北平舆至蕲南原野",
            "lat": 33.65,
            "lng": 116.97
        },
        "leadGeneralId": "ruo_wangjian",
        "strategic": [
            "公元前二二四年秋，秦王嬴政痛定城父败绩，亲赴频阳向告老宿将王翦谢过，倾发举国精锐交付王翦与副帅蒙武再度南征。楚国亦调集全境甲兵由上柱国项燕统领迎敌；王翦进抵平舆前线后高筑壁垒坚守不出，日日优抚士卒养精蓄锐，任凭楚师百般挑战概不应战。"
        ],
        "tactical": [
            "两军隔垒相持经岁，秦卒体力充沛竟在营中投石超距为戏，而远道屯驻的楚军久师疲敝以为秦军只图自保。项燕无奈下令拔营引军东撤，王翦当即倾营尽出发起全线追击，选派精壮锐士猛冲楚军行军后卫，于蕲南原野大破楚国主力重创项燕，一举击碎楚国脊梁。"
        ],
        "source": "史记·秦始皇本纪；史记·白起王翦列传",
        "winner": "attacker",
        "battle": {
            "generalId": "ruo_wangjian",
            "battleId": "chron:evt_0345",
            "battleName": "蕲南之战",
            "battleYear": -224,
            "battleType": "field",
            "role": "attacker",
            "targetName": "淮北平舆至蕲南原野",
            "chronicleFrom": "city_changan",
            "targetLat": 33.65,
            "targetLng": 116.97,
            "myTroops": 15000,
            "enemyFactionId": "chuguo",
            "enemyFactionName": "楚国",
            "enemyGeneralId": "bfe3_13",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0346",
        "baton": "16",
        "year": -223,
        "season": 1,
        "title": "秦灭楚寿春淮南之战",
        "kind": "battle",
        "place": {
            "name": "楚都寿春与淮南",
            "lat": 32.59,
            "lng": 116.8
        },
        "leadGeneralId": "ruo_wangjian",
        "strategic": [
            "公元前二二三年夏，王翦与蒙武乘蕲南全胜之势强渡淮水，席卷楚国腹地城邑并合围最后的王都寿春。楚王负刍在野战主力丧尽后孤城困守，被秦军攻破都城生擒俘虏；退保江南的楚将项燕不肯屈服，拥立原仕秦国并被贬居郢陈的楚室昌平君为荆王，据守淮南继续抗秦。"
        ],
        "tactical": [
            "王翦与蒙武不给楚国残余势力喘息重整之机，迅速调集舟师步骑横渡淮水与大江纵深推进。秦军铁甲劲弩正面摧毁淮南复国军仓促构筑的防线，激战中阵斩荆王昌平君，大将项燕见大势已去兵败自尽；秦国尽平荆楚故地分置九江与长沙诸郡，南方最大强国彻底覆亡。"
        ],
        "source": "史记·秦始皇本纪；史记·楚世家；史记·蒙恬列传",
        "winner": "attacker",
        "battle": {
            "generalId": "ruo_wangjian",
            "battleId": "chron:evt_0346",
            "battleName": "秦灭楚寿春淮南之战",
            "battleYear": -223,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "楚都寿春与淮南",
            "targetCityId": "city_shouxian",
            "chronicleCity": {
                "cityId": "city_shouxian",
                "before": "chuguo",
                "after": "qin"
            },
            "chronicleFrom": "city_changan",
            "targetLat": 32.59,
            "targetLng": 116.8,
            "myTroops": 15000,
            "enemyFactionId": "chuguo",
            "enemyFactionName": "楚国",
            "enemyGeneralId": "bfe3_13",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0348",
        "baton": "16",
        "year": -222,
        "season": 2,
        "title": "秦灭燕辽东襄平之战",
        "kind": "battle",
        "place": {
            "name": "辽东郡治襄平",
            "lat": 41.27,
            "lng": 123.17
        },
        "leadGeneralId": "qin_wangben",
        "strategic": [
            "公元前二二二年秋，秦国扫平南方荆楚与越地后，决意彻底铲除偏安东北隅的燕国残廷及代北赵嘉势力。秦王嬴政大兴北伐之师，命通武侯王贲与李信统率精锐步骑东越渝关、穿过辽西走廊远征辽东，直逼燕王喜盘踞数载的最后据点襄平城。"
        ],
        "tactical": [
            "辽东苦寒辽远，燕王喜凭恃太子河防线与襄平城垣企图苟延残喘。王贲与李信指挥秦军轻骑疾驰抢占渡口，扫清城外燕军残余堡寨，随即架设云梯强弩猛攻襄平城门；燕军孤立无援防线崩溃，秦师破城生俘燕王喜彻底灭燕，旋即回师西进一并攻灭代王赵嘉。"
        ],
        "source": "史记·秦始皇本纪；史记·白起王翦列传；史记·燕召公世家",
        "winner": "attacker",
        "battle": {
            "generalId": "qin_wangben",
            "battleId": "chron:evt_0348",
            "battleName": "秦灭燕辽东襄平之战",
            "battleYear": -222,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "辽东郡治襄平",
            "targetCityId": "city_liaoyang",
            "chronicleCity": {
                "cityId": "city_liaoyang",
                "before": "yan",
                "after": "qin"
            },
            "chronicleFrom": "city_beijing",
            "targetLat": 41.27,
            "targetLng": 123.17,
            "myTroops": 15000,
            "enemyFactionId": "yan",
            "enemyFactionName": "燕国",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0349",
        "baton": "16",
        "year": -221,
        "season": 1,
        "title": "秦灭齐临淄之战",
        "kind": "battle",
        "place": {
            "name": "齐都临淄",
            "lat": 36.88,
            "lng": 118.43
        },
        "leadGeneralId": "qin_wangben",
        "strategic": [
            "公元前二二一年夏，山东六国仅余东海之滨的齐国孤悬独存。齐相后胜长期收受秦国重金贿赂，坐视五国覆亡而不修战备，至秦师压境方才匆忙集结主力屯守西部边防；秦王嬴政洞悉齐军布防虚实，命王贲、李信与蒙恬自燕南故道挥师疾下，避实击虚直插齐国北门。"
        ],
        "tactical": [
            "秦国铁骑步卒自河北平原渡河长驱南入齐境，完全绕开齐军重兵设防的西境长城关隘，如入无人之境疾驰兵临齐都临淄城下。临淄城内猝不及防上下震恐，无人敢出城迎战，齐王建听信相国后胜劝诱不战开城投降；秦王嬴政至此吞并六国一统华夏，创立皇帝尊号。"
        ],
        "source": "史记·秦始皇本纪；史记·田敬仲完世家",
        "winner": "attacker",
        "battle": {
            "generalId": "qin_wangben",
            "battleId": "chron:evt_0349",
            "battleName": "秦灭齐临淄之战",
            "battleYear": -221,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "齐都临淄",
            "targetCityId": "city_linzi",
            "chronicleCity": {
                "cityId": "city_linzi",
                "before": "qi",
                "after": "qin"
            },
            "chronicleFrom": "city_changan",
            "targetLat": 36.88,
            "targetLng": 118.43,
            "myTroops": 15000,
            "enemyFactionId": "qi",
            "enemyFactionName": "齐国",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0352",
        "baton": "17",
        "year": -218,
        "season": 1,
        "title": "西瓯丛林夜袭战",
        "kind": "battle",
        "place": {
            "name": "岭南越城岭与桂北山林",
            "lat": 25.27,
            "lng": 110.29
        },
        "leadGeneralId": "bfe3_14",
        "strategic": [
            "公元前二一八年夏，秦始皇嬴政先期派遣国尉屠睢分五路大军南征百越，初战击斩西瓯首领译吁宋并深入岭南。然而北方秦卒不习南方溽暑瘴疠且山高水险转饷极难，西瓯部众拒不降附，共推新首领桀骏统领诸部退入茂密原始丛林，长期袭扰消耗孤军深入的秦朝南征军。"
        ],
        "tactical": [
            "秦军在崇山密林间宿兵旷日、经年不解甲弛弩，粮道屡遭越人游击截断以致饥疲交困。桀骏摸清屠睢大营戒备松懈虚实，集结熟稔山林夜战的西瓯劲卒乘黑夜分路潜近，骤然向秦军营垒发起贴身奇袭；秦军在暗夜密林中弓弩难施阵型大乱，主帅屠睢混战阵亡，南线陷入僵持。"
        ],
        "source": "淮南子·人间训；史记·平津侯主父列传",
        "winner": "attacker",
        "battle": {
            "generalId": "bfe3_14",
            "battleId": "chron:evt_0352",
            "battleName": "西瓯丛林夜袭战",
            "battleYear": -218,
            "battleType": "field",
            "role": "defender",
            "targetName": "岭南越城岭与桂北山林",
            "chronicleFrom": "city_changan",
            "targetLat": 25.27,
            "targetLng": 110.29,
            "myTroops": 15000,
            "enemyFactionId": "xiou",
            "enemyFactionName": "西瓯",
            "enemyGeneralId": "bfe3_16",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0357",
        "baton": "17",
        "year": -215,
        "season": 0,
        "title": "蒙恬北击匈奴高阙河套之战",
        "kind": "battle",
        "place": {
            "name": "河套河南地至阴山高阙",
            "lat": 41.195,
            "lng": 107.166
        },
        "leadGeneralId": "baiyang_mengtian",
        "strategic": [
            "公元前二一五年春，东方六国战事甫定，游牧漠南的匈奴趁先前中原混战南越黄河侵占肥美的河套河南地，直接威胁秦都咸阳与关中腹心。秦始皇嬴政决意永绝北患，拜名门将种蒙恬为大将统率北伐主力自上郡誓师出塞，向匈奴头曼单于展开大规模战略反击。"
        ],
        "tactical": [
            "蒙恬指挥秦军劲弩战车与精锐骑兵分路并进，先扫清黄河以南鄂尔多斯高原游牧部落尽收河南地，继而趁开春冰融渡过黄河向北推进，攻克阴山咽喉阳山与高阙塞。头曼单于不敌秦军严整阵势与犀利强弩，被迫率部向漠北远遁，蒙恬遂筑亭障连接燕赵秦万里长城。"
        ],
        "source": "史记·蒙恬列传；史记·匈奴列传；史记·秦始皇本纪",
        "winner": "attacker",
        "battle": {
            "generalId": "baiyang_mengtian",
            "battleId": "chron:evt_0357",
            "battleName": "蒙恬北击匈奴高阙河套之战",
            "battleYear": -215,
            "battleType": "field",
            "role": "attacker",
            "targetName": "河套河南地至阴山高阙",
            "chronicleFrom": "city_fushi",
            "targetLat": 41.195,
            "targetLng": 107.166,
            "myTroops": 15000,
            "enemyFactionId": "xiongnu",
            "enemyFactionName": "匈奴",
            "enemyGeneralId": "bfe_touman",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0359",
        "baton": "17",
        "year": -214,
        "season": 2,
        "title": "秦平定岭南番禺之战",
        "kind": "battle",
        "place": {
            "name": "岭南珠江口番禺及桂林",
            "lat": 23.12,
            "lng": 113.26
        },
        "leadGeneralId": "nanyue_zhaotuo",
        "strategic": [
            "公元前二一四年秋，针对屠睢阵亡后南线粮运断绝困局，秦始皇命监御史禄在湘桂分水岭劈山筑铧嘴凿通灵渠，首次贯通长江湘水与珠江漓水航道。随大批谪戍新军与源源不断的粮械乘船直达前线，秦廷拜任嚣为主将、赵佗为副将，向岭南百越发动全面平定总攻。"
        ],
        "tactical": [
            "任嚣与赵佗采取水陆并进、步步筑城屯驻之策，沿北江与西江顺流疾下，以充足强弩甲兵一举击破西瓯及南越部族阻击，迅速攻占珠江三角洲核心都会番禺。赵佗继而恩威并施招抚越人渠帅，秦朝正式略定陆梁地设立南海、桂林与象郡，将华夏版图推抵南海之滨。"
        ],
        "source": "史记·秦始皇本纪；史记·南越列传",
        "winner": "attacker",
        "battle": {
            "generalId": "nanyue_zhaotuo",
            "battleId": "chron:evt_0359",
            "battleName": "秦平定岭南番禺之战",
            "battleYear": -214,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "岭南珠江口番禺及桂林",
            "targetCityId": "city_panyu",
            "chronicleCity": {
                "cityId": "city_panyu",
                "before": "xiou",
                "after": "qin"
            },
            "chronicleFrom": "city_longchuan",
            "targetLat": 23.12,
            "targetLng": 113.26,
            "myTroops": 15000,
            "enemyFactionId": "xiou",
            "enemyFactionName": "西瓯",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0365",
        "baton": "17",
        "year": -209,
        "season": 2,
        "title": "大泽乡起义与攻陈之战",
        "kind": "battle",
        "place": {
            "name": "蕲县大泽乡至淮阳陈县",
            "lat": 33.63,
            "lng": 114.7
        },
        "leadGeneralId": "zhangchu_chensheng",
        "strategic": [
            "公元前二零九年秋，秦二世胡亥与赵高严刑酷法横征暴敛，天下苦秦久矣。阳城人陈胜与阳夏人吴广被征发押送闾左戍卒北赴渔阳屯戍，行抵蕲县大泽乡遇连日暴雨道路断绝，按秦律失期当斩；二人遂以鱼腹丹书篝火狐鸣聚拢人心，假托公子扶苏与楚将项燕之名揭竿起义。"
        ],
        "tactical": [
            "吴广故意激怒并夺剑击杀押解秦尉，陈胜振臂高呼王侯将相宁有种乎，率戍卒斩木为兵、揭竿为旗一举攻克大泽乡与蕲县。义军沿途招纳苦秦民众雪球般壮大，战车步骑连破铚、酂、苦、柘、谯诸邑，进而猛攻并击杀谯门陈郡守丞占领重镇陈县，陈胜正式建号张楚称王。"
        ],
        "source": "史记·陈涉世家；汉书·陈胜项籍传",
        "winner": "attacker",
        "battle": {
            "generalId": "zhangchu_chensheng",
            "battleId": "chron:evt_0365",
            "battleName": "大泽乡起义与攻陈之战",
            "battleYear": -209,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "蕲县大泽乡至淮阳陈县",
            "targetCityId": "city_huaiyang",
            "chronicleCity": {
                "cityId": "city_huaiyang",
                "before": "qin",
                "after": "zhangchu"
            },
            "chronicleFrom": "city_huaiyang",
            "targetLat": 33.63,
            "targetLng": 114.7,
            "myTroops": 15000,
            "enemyFactionId": "qin",
            "enemyFactionName": "秦国",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0366",
        "baton": "18",
        "year": -209,
        "season": 3,
        "title": "戏水之战",
        "kind": "battle",
        "place": {
            "name": "咸阳东郊临潼戏水",
            "lat": 34.27,
            "lng": 108.93
        },
        "leadGeneralId": "wazhai_zhanghan",
        "strategic": [
            "公元前二零九年冬，陈胜坐镇陈县分遣诸将四路略地，授素谙兵法的贤人周文将军印西击关中。周文沿途广征郡县兵车声势浩大，一举冲破空虚的函谷关天险长驱进抵临潼戏水，咸阳朝野震恐；秦二世惊慌失措，采纳少府章邯献策大赦修筑骊山皇陵的刑徒奴产子发甲迎敌。"
        ],
        "tactical": [
            "周文大军虽众，实则多为仓促裹挟、缺乏严整操练与重甲强弩的新集农夫，且孤军深入关中后继无援。章邯将重获自由的骊山青壮刑徒编入秦廷禁卫军制，配发咸阳武库精良剑戟劲弩，趁周文顿兵戏水立足未稳发起雷霆猛冲；楚军一触即溃大败东逃退出函谷关。"
        ],
        "source": "史记·秦始皇本纪；史记·陈涉世家",
        "winner": "defender",
        "battle": {
            "generalId": "wazhai_zhanghan",
            "battleId": "chron:evt_0366",
            "battleName": "戏水之战",
            "battleYear": -209,
            "battleType": "field",
            "role": "defender",
            "targetName": "咸阳东郊临潼戏水",
            "chronicleFrom": "city_changan",
            "targetLat": 34.27,
            "targetLng": 108.93,
            "myTroops": 15000,
            "enemyFactionId": "zhangchu",
            "enemyFactionName": "张楚",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0367",
        "baton": "18",
        "year": -208,
        "season": 2,
        "title": "定陶之战",
        "kind": "battle",
        "place": {
            "name": "山东定陶城下",
            "lat": 35.201,
            "lng": 115.472
        },
        "leadGeneralId": "wazhai_zhanghan",
        "strategic": [
            "公元前二零八年秋，陈胜败亡后，项燕之子武信君项梁统江东子弟渡淮拥立楚怀王，于东阿与濮阳接连击败秦将章邯，楚军上下顿生骄轻之心。谋士宋义苦劝兵骄必败而不被采纳；章邯暗中收拢关中增援生力军，不动声色集结主力向屯驻定陶的项梁大营隐蔽逼近。"
        ],
        "tactical": [
            "深秋阴雨连绵天寒泥泞，项梁以为秦军新败绝不敢冒雨远袭，大营哨探疏懈毫无戒备。章邯下令全军衔枚疾走顶着倾盆大雨昼夜奔袭，于拂晓时分如神兵天降般四面冲入定陶楚军营垒；楚军将士在睡梦与泥水中仓皇应战溃不成军，主帅项梁力战阵亡，章邯旋即北渡攻赵。"
        ],
        "source": "史记·项羽本纪；史记·秦始皇本纪",
        "winner": "attacker",
        "battle": {
            "generalId": "wazhai_zhanghan",
            "battleId": "chron:evt_0367",
            "battleName": "定陶之战",
            "battleYear": -208,
            "battleType": "field",
            "role": "attacker",
            "targetName": "山东定陶城下",
            "chronicleFrom": "city_changan",
            "targetLat": 35.201,
            "targetLng": 115.472,
            "myTroops": 15000,
            "enemyFactionId": "chuguo",
            "enemyFactionName": "楚国",
            "enemyGeneralId": "bfe_xiangliang",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0368",
        "baton": "18",
        "year": -207,
        "season": 0,
        "title": "巨鹿之战",
        "kind": "battle",
        "place": {
            "name": "河北巨鹿城外与漳水",
            "lat": 37.22,
            "lng": 115.04
        },
        "leadGeneralId": "xichu_xiangyu",
        "strategic": [
            "公元前二零七年春，秦将王离统长城北军围困赵王歇于巨鹿，章邯驻棘原筑甬道输粟，救赵诸侯畏秦如虎纷纷筑壁观望。楚次将项羽果断帐下斩杀迁延不进的上将军宋义夺掌兵权，先遣猛将英布与蒲将军渡河绝秦甬道，随即亲率全军北渡漳水誓死决战。"
        ],
        "tactical": [
            "项羽下令全军沉毁渡船、砸碎釜甑、烧掉营舍，每人仅携三日干粮示以必死无还之志。楚军将士呼声动天无不以一当十，先斩秦将苏角截断章邯增援，继而回身连续猛扑王离长城军团；秦军壁垒尽碎，副将涉间自焚、主将王离被俘，诸侯膝行辕门归附，章邯被迫投降。"
        ],
        "source": "史记·项羽本纪；史记·高祖本纪",
        "winner": "attacker",
        "battle": {
            "generalId": "xichu_xiangyu",
            "battleId": "chron:evt_0368",
            "battleName": "巨鹿之战",
            "battleYear": -207,
            "battleType": "field",
            "role": "attacker",
            "targetName": "河北巨鹿城外与漳水",
            "chronicleFrom": "city_pengcheng",
            "targetLat": 37.22,
            "targetLng": 115.04,
            "myTroops": 15000,
            "enemyFactionId": "qin",
            "enemyFactionName": "秦国",
            "enemyGeneralId": "bfe3_17",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0371",
        "baton": "18",
        "year": -206,
        "season": 2,
        "title": "还定三秦陈仓之战",
        "kind": "battle",
        "place": {
            "name": "秦岭北口陈仓与关中好畤",
            "lat": 34.28,
            "lng": 106.95
        },
        "leadGeneralId": "han_d_liubang",
        "strategic": [
            "公元前二零六年秋，西楚霸王项羽在鸿门宴后背弃怀王先入关中者王之的盟约，将沛公刘邦贬封僻远的巴蜀汉中，另封秦降将章邯、司马欣与董翳为三秦王扼塞汉中北道。刘邦采纳萧何力荐筑坛拜韩信为大将军，烧毁褒斜栈道麻痹章邯，密循故道北出奇袭关中门户陈仓。"
        ],
        "tactical": [
            "雍王章邯重兵防备南山诸谷口，不料曹参、樊哙与韩信主力自险僻故道神速杀至陈仓城下。章邯仓促调轻骑驰援迎战，被汉军居高迎头痛击溃退废丘；刘邦与韩信乘胜分兵东进，于好畤与壤乡连破章平主力，司马欣与董翳望风归降，汉军一举平定关中沃野奠定帝业根基。"
        ],
        "source": "史记·高祖本纪；史记·淮阴侯列传；史记·曹相国世家",
        "winner": "attacker",
        "battle": {
            "generalId": "han_d_liubang",
            "battleId": "chron:evt_0371",
            "battleName": "还定三秦陈仓之战",
            "battleYear": -206,
            "battleType": "field",
            "role": "attacker",
            "targetName": "秦岭北口陈仓与关中好畤",
            "chronicleFrom": "city_hanzhong",
            "targetLat": 34.28,
            "targetLng": 106.95,
            "myTroops": 15000,
            "enemyFactionId": "qin",
            "enemyFactionName": "秦国",
            "enemyGeneralId": "wazhai_zhanghan",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0372",
        "baton": "18",
        "year": -205,
        "season": 1,
        "title": "彭城之战",
        "kind": "battle",
        "place": {
            "name": "西楚都城彭城与睢水",
            "lat": 34.27,
            "lng": 117.18
        },
        "leadGeneralId": "xichu_xiangyu",
        "strategic": [
            "公元前二零五年夏，西楚霸王项羽深陷齐地平叛战局，汉王刘邦乘虚东出函谷关，以替义帝发丧为名号召魏赵韩诸侯结成浩大联军，一举攻陷空虚的西楚国都彭城。刘邦入城后以为天下已定日夜置酒高会疏于战备，项羽闻讯留步卒续攻齐地，亲选百战精骑星夜兼程南下回援。"
        ],
        "tactical": [
            "项羽避开汉军重兵戒备的彭城北面，率楚国铁骑自鲁地绕越胡陵兜至彭城西侧萧县，于拂晓自背后向毫无防备的汉联军发起雷霆突袭。联军各部仓皇自相践踏，至正午被楚骑一路压迫至谷水、泗水与睢水斩杀溺毙无数，睢水为之断流；刘邦仅率随身亲骑突围退保荥阳。"
        ],
        "source": "史记·项羽本纪；史记·高祖本纪",
        "winner": "attacker",
        "battle": {
            "generalId": "xichu_xiangyu",
            "battleId": "chron:evt_0372",
            "battleName": "彭城之战",
            "battleYear": -205,
            "battleType": "field",
            "role": "attacker",
            "targetName": "西楚都城彭城与睢水",
            "routeVia": [
                {
                    "name": "鲁",
                    "lat": 35.6,
                    "lng": 116.99
                },
                {
                    "name": "胡陵",
                    "lat": 34.9,
                    "lng": 116.7
                },
                {
                    "name": "萧",
                    "lat": 34.19,
                    "lng": 116.95
                }
            ],
            "chronicleFrom": "city_ju",
            "targetLat": 34.27,
            "targetLng": 117.18,
            "myTroops": 15000,
            "enemyFactionId": "han_d",
            "enemyFactionName": "刘汉",
            "enemyGeneralId": "han_d_liubang",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0373",
        "baton": "18",
        "year": -204,
        "season": 3,
        "title": "井陉之战",
        "kind": "battle",
        "place": {
            "name": "太行井陉口与绵蔓水",
            "lat": 38.02,
            "lng": 114
        },
        "leadGeneralId": "xianyu_hanxin",
        "strategic": [
            "公元前二零四年冬，刘邦在荥阳正面死顶项羽攻势，命韩信与张耳开辟北方战场，于木罂渡河虏魏王豹后东下太行井陉狭道伐赵。赵帅成安君陈馀集重兵堵截井陉口，广武君李左车献策遣奇兵绕后断绝汉军粮道，迂腐自负的陈馀却以义兵不用诈谋断然拒绝。"
        ],
        "tactical": [
            "韩信探知陈馀未设伏断粮大喜，半夜遣轻骑各持赤帜潜伏赵营旁侧山谷，自率主力渡绵蔓水背水列阵置之死地。天明韩信竖大将旗鼓佯攻后弃仪仗退向水边阵地，陈馀贪功倾营猛扑死战汉卒；汉伏骑趁虚冲入空营拔赵旗尽立汉赤帜，赵军回望惊溃，陈馀于泜水被斩。"
        ],
        "source": "史记·淮阴侯列传；史记·张耳陈馀列传",
        "winner": "attacker",
        "battle": {
            "generalId": "xianyu_hanxin",
            "battleId": "chron:evt_0373",
            "battleName": "井陉之战",
            "battleYear": -204,
            "battleType": "field",
            "role": "attacker",
            "targetName": "太行井陉口与绵蔓水",
            "chronicleFrom": "city_eyu",
            "targetLat": 38.02,
            "targetLng": 114,
            "myTroops": 15000,
            "enemyFactionId": "zhao",
            "enemyFactionName": "赵国",
            "enemyGeneralId": "bfe3_18",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0374",
        "baton": "18",
        "year": -204,
        "season": 3,
        "title": "潍水之战",
        "kind": "battle",
        "place": {
            "name": "山东高密潍水河岸",
            "lat": 36.42,
            "lng": 119.41
        },
        "leadGeneralId": "xianyu_hanxin",
        "strategic": [
            "公元前二零四年冬，韩信乘郦食其说齐弛备之机渡河袭破临淄，齐王田广东逃高密紧急向西楚求救。项羽深感北翼危急，命麾下头号猛将龙且统率重兵北上与田广合军，隔潍水与汉军对峙；谋士劝龙且坚壁招抚齐城困饿汉师，素来轻视韩信出身的龙且执意速战立功。"
        ],
        "tactical": [
            "韩信连夜命士卒缝制沙囊堆置潍水上游筑坝蓄水。次日黎明韩信率部涉水挑战后假装不敌西退，龙且高呼固知信怯遂亲率先锋争先渡河追击；待楚齐军半渡之际韩信下令决开上游沙囊，滔天洪峰奔涌而下将联军隔断，韩信回师全歼东渡前锋并击斩龙且，尽定齐地。"
        ],
        "source": "史记·淮阴侯列传；史记·项羽本纪；史记·樊郦滕灌列传",
        "winner": "attacker",
        "battle": {
            "generalId": "xianyu_hanxin",
            "battleId": "chron:evt_0374",
            "battleName": "潍水之战",
            "battleYear": -204,
            "battleType": "field",
            "role": "attacker",
            "targetName": "山东高密潍水河岸",
            "chronicleFrom": "city_linzi",
            "targetLat": 36.42,
            "targetLng": 119.41,
            "myTroops": 15000,
            "enemyFactionId": "chuguo",
            "enemyFactionName": "楚国",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0375",
        "baton": "18",
        "year": -203,
        "season": 2,
        "title": "成皋汜水之战",
        "kind": "battle",
        "place": {
            "name": "河南荥阳西成皋关与汜水",
            "lat": 34.81,
            "lng": 113.17
        },
        "leadGeneralId": "han_d_liubang",
        "strategic": [
            "公元前二零三年秋，楚汉两军在中原咽喉荥阳成皋展开惨烈拉锯，彭越率游兵在梁地频频焚毁楚军粮草令项羽疲于奔命。项羽被迫再次亲统主力东击彭越，临行前谆谆告诫留守成皋的大司马曹咎与司马欣务必谨守关城半步勿出，无论汉军如何挑战只需坚守半月待其回师。"
        ],
        "tactical": [
            "汉王刘邦深知成皋系敖仓粮道锁钥，趁项羽东去连日派轻兵抵近城门百般叫阵辱骂。暴躁的曹咎忍至数日终于怒不可遏，违令尽起守城楚军出关渡汜水追击；刘邦待楚军船筏半渡河心首尾脱节之际，挥动汉军步骑全线猛扑，楚师大溃，曹咎与司马欣皆自刎，汉军重夺成皋。"
        ],
        "source": "史记·项羽本纪；史记·高祖本纪",
        "winner": "attacker",
        "battle": {
            "generalId": "han_d_liubang",
            "battleId": "chron:evt_0375",
            "battleName": "成皋汜水之战",
            "battleYear": -203,
            "battleType": "field",
            "role": "attacker",
            "targetName": "河南荥阳西成皋关与汜水",
            "chronicleFrom": "city_huojia",
            "targetLat": 34.81,
            "targetLng": 113.17,
            "myTroops": 15000,
            "enemyFactionId": "chuguo",
            "enemyFactionName": "楚国",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0377",
        "baton": "18",
        "year": -202,
        "season": 3,
        "title": "垓下之战",
        "kind": "battle",
        "place": {
            "name": "安徽灵璧垓下至乌江",
            "lat": 33.328,
            "lng": 117.614
        },
        "leadGeneralId": "xianyu_hanxin",
        "strategic": [
            "公元前二零二年冬，鸿沟议和后刘邦采纳张良陈平建议追击东归楚师，并以裂土封王重诺调集齐王韩信、梁相彭越与九江王英布诸路大军，将粮尽兵疲的项羽西楚主力重重围困于淮北垓下。大将军韩信总揽前敌指挥，布下中军诱敌、两翼合围、后阵接应的决战大阵。"
        ],
        "tactical": [
            "韩信亲率中军迎战项羽猛冲，交锋片刻佯退诱敌追出，两翼孔将军与费将军横向包抄，韩信复返身与后军合击大破楚师。入夜汉营四面唱起楚歌瓦解楚卒斗志，项羽悲歌率亲骑突围，遭汉骑将灌婴紧追至东城与乌江浦力战自刎，刘邦遂平定天下建立西汉王朝。"
        ],
        "source": "史记·项羽本纪；史记·高祖本纪；史记·淮阴侯列传",
        "winner": "attacker",
        "battle": {
            "generalId": "xianyu_hanxin",
            "battleId": "chron:evt_0377",
            "battleName": "垓下之战",
            "battleYear": -202,
            "battleType": "field",
            "role": "attacker",
            "targetName": "安徽灵璧垓下至乌江",
            "chronicleFrom": "city_linzi",
            "targetLat": 33.328,
            "targetLng": 117.614,
            "myTroops": 15000,
            "enemyFactionId": "chuguo",
            "enemyFactionName": "楚国",
            "enemyGeneralId": "xichu_xiangyu",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0378",
        "baton": "18",
        "year": -201,
        "season": 2,
        "title": "马邑围城战",
        "kind": "battle",
        "place": {
            "name": "代北边塞重镇马邑",
            "lat": 39.05,
            "lng": 112.24
        },
        "leadGeneralId": "xiongnu_maodun",
        "strategic": [
            "公元前二零一年秋，弑父自立并东灭东胡、西逐月氏、尽收楼烦白羊河南地的匈奴冒顿单于控弦精骑极盛，大举挥师南越阴山进窥汉朝北疆。汉廷此前忌惮韩王信勇武将其由颍川迁封太原防胡，韩王信请徙治塞北要冲马邑未久，冒顿亲统漫山遍野的匈奴铁骑将马邑合围。"
        ],
        "tactical": [
            "匈奴精骑凭疾驰骑射切断马邑外围全部烽燧驿道，日夜环城驰突施压。孤城兵微粮寡的韩王信难以久撑，屡次遣使赴匈奴大帐求和缓兵；汉廷发援兵途中闻知韩使频繁入胡，疑其怀有二心遣使严词切责，韩王信恐惧诛戮遂献马邑投降冒顿，反引胡骑南下直逼太原。"
        ],
        "source": "史记·韩信卢绾列传；史记·匈奴列传；汉书·韩彭英卢吴传",
        "winner": "attacker",
        "battle": {
            "generalId": "xiongnu_maodun",
            "battleId": "chron:evt_0378",
            "battleName": "马邑围城战",
            "battleYear": -201,
            "battleType": "siege",
            "role": "attacker",
            "targetName": "代北边塞重镇马邑",
            "targetCityId": "city_ningwuguan",
            "chronicleCity": {
                "cityId": "city_ningwuguan",
                "before": "han_d",
                "after": "xiongnu"
            },
            "chronicleFrom": "city_toumancheng",
            "targetLat": 39.05,
            "targetLng": 112.24,
            "myTroops": 15000,
            "enemyFactionId": "han_d",
            "enemyFactionName": "刘汉",
            "enemyTroops": 15000,
            "introLines": []
        }
    },
    {
        "id": "evt_0380",
        "baton": "18",
        "year": -200,
        "season": 3,
        "title": "白登之围",
        "kind": "battle",
        "place": {
            "name": "山西大同东北平城白登山",
            "lat": 40.08,
            "lng": 113.3
        },
        "leadGeneralId": "han_d_liubang",
        "strategic": [
            "公元前二百年冬，汉帝刘邦亲统步骑大军冒塞北酷寒北征叛将韩王信与匈奴，于铜鞮与晋阳连战告捷。冒顿单于故意隐藏剽悍壮马精骑，仅留老弱残畜沿途示弱步步北退；刘邦不听娄敬苦谏轻信斥候捷报，撇下步兵主力率轻骑昼夜疾追越过句注山，孤军闯入平城预设口袋。"
        ],
        "tactical": [
            "塞外奇寒士卒指堕，冒顿单于骤发精骑将刘邦先遣军死死围困于白登山巅，西方白马、东方青駹、北方乌骊、南方赤骍分列四方断绝内外。汉军固垒死守七日夜，刘邦采纳陈平秘计遣使厚赂阏氏，趁浓雾匈奴解开一角令弓弩外向满引护卫突围会合大军，汉初遂行和亲国策。"
        ],
        "source": "史记·高祖本纪；史记·匈奴列传；史记·陈丞相世家",
        "winner": "draw",
        "battle": {
            "generalId": "han_d_liubang",
            "battleId": "chron:evt_0380",
            "battleName": "白登之围",
            "battleYear": -200,
            "battleType": "field",
            "role": "defender",
            "targetName": "山西大同东北平城白登山",
            "chronicleFrom": "city_taiyuan",
            "targetLat": 40.08,
            "targetLng": 113.3,
            "myTroops": 15000,
            "enemyFactionId": "xiongnu",
            "enemyFactionName": "匈奴",
            "enemyGeneralId": "xiongnu_maodun",
            "enemyTroops": 15000,
            "introLines": []
        }
    }
];
