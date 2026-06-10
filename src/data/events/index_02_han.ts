import { HistoricalEvent } from '../../types/core';

export const EVENTS_HAN: HistoricalEvent[] = [
    {
        "year": -206,
        "season": 0,
        "description": "高帝元年冬十月，沛公刘邦兵临霸上。秦王子婴素车白马，系颈以组，封皇帝玺符节，于轵道旁投降，秦亡。十二月，因项羽兵四倍于己，沛公避其锋芒，交出咸阳。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "tianchao",
            "legionName": "楚-刘邦军",
            "attackerSourceCityId": "city_wuguan",
            "defenderCityId": "changan",
            "attackerTroops": 20000,

            "result": "attacker_win",
            "afterBattleChain": [
                {
                    "action": "move_to_city",
                    "targetCityId": "city_hanguguan"
                },
                {
                    "action": "destroy"
                }
            ]
        }
    },
    {
        "year": -206,
        "season": 0,
        "description": "刘邦受封汉王，统率部曲之国汉中。汉军行至褒中，烧绝栈道以示无东意，以此麻痹项羽。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "zhonghua",
            "legionName": "汉-刘邦军",
            "attackerSourceLocation": {
                "lat": 33.1313,
                "lng": 107.2046
            },
            "defenderCityId": "city_hanzhong",
            "result": "attacker_win"
        }
    },
    {
        "year": -206,
        "season": 0,
        "description": "汉王采纳大将韩信计策，引兵出故道，奇袭雍地。汉军于陈仓迎击雍王章邯，围之。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "zhonghua",
            "legionName": "汉-刘邦军",
            "attackerCityId": "city_hanzhong",
            "defenderCityId": "city_chencang",
            "result": "attacker_win"
        }
    },
    {
        "year": -206,
        "season": 0,
        "description": "汉军略定咸阳以东，尽收渭南、河上、上郡之地。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "zhonghua",
            "legionName": "汉-刘邦军",
            "attackerCityId": "city_chencang",
            "defenderCityId": "changan",
            "result": "attacker_win"
        }
    },
    {
        "year": -205,
        "season": 0,
        "description": "高帝二年冬至夏，楚霸王项羽陷于齐地田横游击泥潭，汉王刘邦乘机纠集诸侯联军伐楚，兵锋直捣楚都彭城。项羽闻讯，亲率三万精骑疾驰南下，晨击汉军于胡陵，日中大破联军。",
        "type": "field_battle",
        "fieldBattleData": {
            "attackerFactionId": "tianchao",
            "attackerLegionName": "楚-项羽军",
            "attackerTroops": 20000,
            "defenderFactionId": "zhonghua",
            "defenderLegionName": "汉-刘邦军",
            "defenderTroops": 40000,
            "location": {
                "lat": 35.00,
                "lng": 116.65
            },
            "result": "attacker_win"
        }
    },
    {
        "year": -205,
        "season": 0,
        "description": "汉王收拢残兵退守虎牢关，汉将灌婴率组建之新式骑兵军，于虎牢关东大破楚骑，遏止楚军攻势。汉军遂壁垒虎牢关，筑甬道通河取敖仓粟，与楚军形成战略对峙。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "zhonghua",
            "legionName": "汉-刘邦军",
            "attackerCityId": "kaifeng",
            "defenderCityId": "city_hulaoguan",
            "result": "attacker_win"
        }
    },
    {
        "year": -205,
        "season": 0,
        "description": "魏王豹叛汉附楚。汉将韩信声东击西，陈船临晋为疑兵，暗以木罂渡军夏阳，奇袭安邑。魏王兵败被俘。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "zhonghua",
            "legionName": "汉-韩信军",
            "attackerCityId": "changan",
            "defenderCityId": "city_anyi",
            "result": "attacker_win"
        }
    },
    {
        "year": -205,
        "season": 0,
        "description": "九月，韩信于阏与大破代兵，继续经略赵代，由此开辟北方第二战场。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "zhonghua",
            "legionName": "汉-韩信军",
            "attackerCityId": "city_anyi",
            "defenderCityId": "city_jinyang",
            "result": "attacker_win"
        }
    },
    {
        "year": -204,
        "season": 0,
        "description": "高帝三年冬，汉大将军韩信出井陉击赵。选轻勇骑二千人，人持赤帜，从小路迂回赵军营垒侧后埋伏。又令万人背水列阵。汉赵两军激战良久，韩信诈败抛旗弃鼓，赵军争抢战利品。此时汉军伏兵突袭赵营，遍插汉军赤帜。赵军军心大乱溃逃。汉军乘势前后夹击，大破赵军。",
        "type": "field_battle",
        "fieldBattleData": {
            "attackerFactionId": "zhonghua",
            "attackerLegionName": "汉-韩信军",
            "attackerTroops": 20000,
            "defenderFactionId": "tianchao",
            "defenderLegionName": "赵-陈余军",
            "defenderTroops": 40000,
            "location": {
                "lat": 38.03,
                "lng": 114.14
            },
            "result": "attacker_win",
            "afterBattle": "siege",
            "afterBattleTargetCityId": "city_dongyuan",
            "siegeAfterBattleChain": [
                {
                    "action": "garrison"
                }
            ]
        }
    },
    {
        "year": -204,
        "season": 0,
        "description": "楚军项羽攻占虎牢关，刘邦利用宛叶牵制与彭越挠后，致项羽东征西讨，疲于奔命。诱歼楚大司马曹咎于汜水，复夺成皋，进占广武敖仓。项羽回师隔涧对峙，虽射伤汉王，终因粮尽兵疲，无力突破汉军防线。",
        "type": "field_battle",
        "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } }
    },
    {
        "year": -203,
        "season": 0,
        "description": "高帝四年，韩信不顾和议奇袭历下，直捣齐都临淄。齐王求援项羽，楚将龙且统兵二十万救齐，与汉军隔潍水对峙。韩信夜令军塞囊壅水，半渡佯败诱敌；楚军半渡被截。汉军急击，斩杀龙且，全歼楚军二十万。",
        "type": "field_battle",
        "fieldBattleData": {
            "attackerFactionId": "zhonghua",
            "attackerLegionName": "汉-韩信军",
            "attackerTroops": 20000,
            "defenderFactionId": "tianchao",
            "defenderLegionName": "楚-龙且军",
            "defenderTroops": 40000,
            "location": {
                "lat": 36.71,
                "lng": 119.10
            },
            "result": "attacker_win",
            "afterBattle": "siege",
            "afterBattleTargetCityId": "qingzhou",
            "siegeAfterBattleChain": [
                {
                    "action": "garrison"
                }
            ]
        }
    },
    {
        "year": -203,
        "season": 0,
        "description": "九月，项羽被迫与汉立盟，中分天下，引兵东归。汉王采纳张良、陈平计，撕毁盟约，挥师追击。至固陵，遭楚军回师反击。汉军大败。其后纳张良策，许割陈以东至海予韩信、睢阳以北至谷城予彭越。",
        "type": "field_battle",
        "fieldBattleData": {
            "attackerFactionId": "tianchao",
            "attackerLegionName": "楚-项羽军",
            "attackerTroops": 20000,
            "defenderFactionId": "zhonghua",
            "defenderLegionName": "汉-刘邦军",
            "defenderTroops": 40000,
            "location": {
                "lat": 34.06,
                "lng": 114.85
            },
            "result": "attacker_win"
        }
    },
    {
        "year": -202,
        "season": 0,
        "description": "高帝五年，汉将刘贾渡淮围寿春，断楚归路。汉军与诸侯联军六十万重围项羽于垓下。楚军兵少食尽，夜闻四面楚歌，军心瓦解。项羽率八百壮士夜溃围南出，斩汉将突围至乌江。自觉无面目见江东父老，拒渡自刎。",
        "type": "field_battle",
        "fieldBattleData": {
            "attackerFactionId": "zhonghua",
            "attackerLegionName": "汉-刘邦军",
            "attackerTroops": 60000,
            "attackerSourceLocation": {
                "lat": 34.7216,
                "lng": 113.6536
            },
            "defenderFactionId": "tianchao",
            "defenderLegionName": "楚-项羽军",
            "defenderTroops": 20000,
            "location": {
                "lat": 33.54,
                "lng": 117.55
            },
            "result": "attacker_win",
            "afterBattle": "siege",
            "afterBattleTargetCityId": "city_pengcheng",
            "siegeAfterBattleChain": [
                {
                    "action": "garrison"
                }
            ]
        }
    },
    {
        "year": -202,
        "season": 0,
        "description": "汉王驰入定陶齐王韩信营垒，夺其军权。临江王共尉拒不投降，汉廷遣卢绾、刘贾率军进剿。汉军攻破江陵，俘共尉，平定临江国。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "zhonghua",
            "legionName": "汉-卢绾军",
            "defenderCityId": "city_ying",
            "attackerSourceLocation": {
                "lat": 30.35,
                "lng": 112.1
            },
            "result": "attacker_win",
            "afterBattleChain": [
                {
                    "action": "destroy"
                }
            ]
        }
    },
    {
        "year": -201,
        "season": 0,
        "description": "高帝六年，匈奴冒顿单于鸣镝弑父自立，突袭灭东胡；继而西击走月氏，南并楼烦、白羊河南王，首先攻取高阙。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "huihui",
            "legionName": "匈奴-冒顿军",
            "defenderCityId": "city_gaoque",
            "attackerSourceLocation": {
                "lat": 41.87,
                "lng": 107.19
            },
            "result": "attacker_win"
        }
    },
    {
        "year": -201,
        "season": 0,
        "description": "匈奴冒顿军继续南下，攻打包头。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "huihui",
            "legionName": "匈奴-冒顿军",
            "attackerCityId": "city_gaoque",
            "defenderCityId": "city_jiuyuan",
            "result": "attacker_win"
        }
    },
    {
        "year": -201,
        "season": 0,
        "description": "匈奴悉收秦将蒙恬所夺之河南地，攻占河曲，威服北疆诸国。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "huihui",
            "legionName": "匈奴-冒顿军",
            "attackerCityId": "city_jiuyuan",
            "defenderCityId": "city_hequ",
            "result": "attacker_win"
        }
    },
    {
        "year": -200,
        "season": 0,
        "description": "高帝七年，汉高祖轻敌冒进，被匈奴围困于白登山。七日后陈平献计，周勃援军抵达，致使匈奴退去。",
        "type": "field_battle",
        "fieldBattleData": {
            "attackerFactionId": "huihui",
            "attackerLegionName": "匈奴-冒顿军",
            "attackerTroops": 20000,
            "defenderFactionId": "zhonghua",
            "defenderLegionName": "汉-刘邦军",
            "defenderTroops": 20000,
            "location": {
                "lat": 40.121389,
                "lng": 113.398056
            },
            "result": "attacker_win",
            "afterBattle": "destroy"
        }
    },
    { "year": -199, "season": 0, "description": "高帝八年，高帝刘邦亲率王师东进，由柏人进抵东垣，讨伐韩王信残部。汉军发起扫荡攻势，彻底剿灭盘踞赵地的反汉残余武装。十二月，高帝班师还朝，关东大规模叛乱自此基本平息。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -198, "season": 0, "description": "高帝九年冬，鉴于匈奴锋逼长安，关中防务空虚，汉廷确立“强本弱末”战略。对外遣使和亲，羁縻北寇；对内强迁齐、楚五大望族十余万口充实京师。此举意在内实关中以备胡，外弱诸侯以制变，构筑首都防御纵深。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -197, "season": 0, "description": "高帝十年秋，代相陈豨拥重兵反，勾结匈奴劫掠赵、代，常山陷落大半。汉帝亲率王师东征，急趋邯郸。察知贼未据漳水之险，遂入城固守。时主力未集，帝火线募赵将备御，复散重金购降敌众。叛军攻势受挫，邯郸防线得固。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    {
        "year": -196,
        "season": 0,
        "description": "高帝十一年冬，汉军对陈豨发起总攻。汉将郭蒙联手齐军大破张春；太尉周勃道太原北上，连克马邑，进抵代地。汉帝亲征，攻拔赵地东垣，生擒王黄、曼丘臣，陈豨军全线崩溃。",
        "type": "field_battle",
        "fieldBattleData": {
            "attackerFactionId": "zhonghua",
            "attackerLegionName": "汉-刘邦军",
            "attackerTroops": 20000,
            "defenderFactionId": "huihui",
            "defenderLegionName": "代-陈豨军",
            "defenderTroops": 20000,
            "location": {
                "lat": 38.146445,
                "lng": 114.570941
            },
            "result": "attacker_win",
            "afterBattle": "destroy"
        }
    },
    {
        "year": -195,
        "season": 0,
        "description": "高帝十二年，淮南王黥布举兵叛汉，挟胜西进，兵锋直指中原。汉帝刘邦抱病亲征，十月，两军遭遇于蕲西。汉帝壁庸城，见布军精锐阵列类项籍，遂挥师决战，大破之。",
        "type": "field_battle",
        "fieldBattleData": {
            "attackerFactionId": "zhonghua",
            "attackerLegionName": "汉-刘邦军",
            "attackerTroops": 20000,
            "defenderFactionId": "tianchao",
            "defenderLegionName": "淮南-黥布军",
            "defenderTroops": 20000,
            "location": {
                "lat": 33.64,
                "lng": 116.98
            },
            "result": "attacker_win",
            "siegeAfterBattleChain": [
                {
                    "action": "destroy"
                }
            ]
        }
    },
    {
        "year": -195,
        "season": 0,
        "description": "二月，燕王卢绾因通胡谋反事泄，朝廷以相国樊噲为将，统兵击燕。汉军攻势凌厉，定燕地反县。卢绾引数千人退居塞下观望。夏四月，汉帝崩，卢绾遂亡入匈奴。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "zhonghua",
            "legionName": "汉-樊噲军",
            "defenderCityId": "youzhou",
            "result": "attacker_win",
            "afterBattleChain": [
                {
                    "action": "destroy"
                }
            ]
        }
    },
    {
        "year": -194,
        "season": 0,
        "description": "前194年，燕将卫满引千余残兵易服东窜，渡浿水、夺王险，诈称内附以袭朝鲜准王之巢，遂篡土自立为朝鲜王。",
        "type": "siege",
        "siegeData": {
            "attackerFactionId": "chaoxian",
            "defenderCityId": "city_pingrang",
            "result": "attacker_win",
            "legionName": "朝鲜-椎结义从",
            "attackerTroops": 20000
        }
    },
    { "year": -193, "season": 0, "description": "前193年，萧何病逝推荐曹参、曹参稳重治国并得民心。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -192, "season": 0, "description": "前192年，匈奴冒顿与汉和亲，闽越君摇被封为东海王。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -191, "season": 0, "description": "前191年，吕后下令废除挟书律，鼓励民间献书朝廷，恢复旧典。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -190, "season": 0, "description": "前190年，发长安六百里内男女十四万五千人修筑长安城。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -189, "season": 0, "description": "前189年，曹参薨。以王陵为右丞相，陈平为左丞相。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -188, "season": 0, "description": "前188年，汉惠帝刘盈驾崩。汉高祖皇后吕雉临朝称制，行使皇帝职权。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -187, "season": 0, "description": "前187年，吕后欲封吕氏为王引发朝内纷争，逐渐实现其计划。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -186, "season": 0, "description": "前186年，吕后临朝罢黜诸侯恶法，颁《二年律令》以安社稷，复命张武镇守北境，内行文治之实，外蓄御边之威。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -185, "season": 0, "description": "前185年，吕后下旨严禁金铁、雌畜入岭南，欲以贸易锁死南越。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -184, "season": 0, "description": "前184年：少帝知母遇害，怨言欲报，吕后遂幽禁帝于永巷，旋即废杀，另立恒山王为帝，外戚之权自此僭越皇纲，临朝称制。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -183, "season": 0, "description": "前183年：赵佗僭号武帝，发兵攻陷长沙边邑，吕后遣隆虑侯周灶兴师讨伐，奈何五岭瘴气横生，汉军顿兵关下，南北对峙之势遂成。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -182, "season": 0, "description": "前182年：吕后封吕产为吕王，以此震慑刘氏宗室，旋即扩建长安北军大营，尽易诸校尉为吕氏爪牙，关中禁卫之权悉落外戚之手。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -181, "season": 0, "description": "前181年：吕后割齐地立琅琊王，以此分化刘姓版图，复命吕禄领北军、吕产统南军，意图倾覆汉室神器；南疆周灶兵疲粮匮，引归长安，赵佗之势愈发不可遏制。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -180, "season": 0, "description": "前180年：吕后龙驭宾天，周勃陈平里应外合，北军大营拔旗易帜，一举尽平诸吕，旋即亲迎代王刘恒入京，是为汉文帝。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -179, "season": 0, "description": "前179年：文帝与赵佗罢兵休战，遣陆贾二度南使以德怀远，赵佗遂去帝号而称臣，复开驿路通贸易，使南疆万民免于兵革之苦。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -178, "season": 0, "description": "前178年：文帝首下罪己诏，以日食之变广开言路，旋即册立太子定国本，并推行“劝课农桑”之策，使关中及河西良田悉数开垦。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -177, "season": 0, "description": "前177年：济北王刘兴居乘虚起兵欲袭长安，文帝命大将军灌婴屯兵虎牢关以拒之，旋即亲征太原平叛，不料匈奴万骑入寇上郡，帝遂移师北上，于塞下列阵待敌。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -176, "season": 0, "description": "前176年：单于致书汉廷以平月氏、吞西域之威震慑中原，文帝察胡马利在劫掠而不在攻坚，遂行坚壁清野之策，辅以和亲之礼解上郡之围，使匈奴引兵北撤，边尘暂息。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -175, "season": 0, "description": "前175年：文帝下令更造四铢钱，并开放关隘以利商旅贸易，复因边境渐稳而罢军归农，由是天下钱帛流通、百业兴旺，汉室府库始见盈满之象。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -174, "season": 0, "description": "前174年：匈奴冒顿单于暴毙，新主老上单于继位，旋即发兵横扫西域残余，彻底斩断汉室西通之路；文帝见边防压力骤增，遂加强长城烽燧巡守，于边塞增置屯兵，汉胡对峙之局愈发深沉。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -173, "season": 0, "description": "前173年：老上单于初登汗位，大举驱逐大月氏残部出伊犁河谷，彻底扫清西域侧翼；文帝见状，非但未起兵锋，反遣使遗书单于以敦和好，并于北方边塞复修暗堡、加筑深沟，行“以守代攻”之策。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -172, "season": 0, "description": "前172年：文帝借巡视之名移驾甘泉宫，陈兵关中北境以震慑胡虏，旋即密令边将广积刍粟，于上郡、云中构筑纵深粮仓，由是塞上甲兵虽未出击，然引而不发之势已成。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -171, "season": 0, "description": "前171年：文帝敕命边郡废弛之垒悉数兴修，于云中、代郡广设“马邑”以蓄军资，并密选精锐骑士充实北军羽林，虽无两军厮杀，然汉廷已由单纯御边转为内蓄反击之势。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -170, "season": 0, "description": "前170年：文帝敕令边将行“塞下阅兵”，于上郡、云中举行大规模步骑合演以威慑漠北，旋即密布烽燧网络，使万余里长城连成一线；匈奴虽有试探，见汉军守备严整、军马精良，遂引而不发。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -169, "season": 0, "description": "前169年：文帝采纳晁错“募民徙塞”之策，于北境广筑屯田卫所，变孤立堡垒为军民联防，并诏令以爵位换取军粮入边，由是上郡、代郡粮草充盈，关内援军可轻装疾行。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -168, "season": 0, "description": "前168年：匈奴老上单于亲率十四万铁骑横扫北地，焚毁回中宫，前锋逼近甘泉，直指长安；文帝急命车骑将军中尉军、内史军各屯京师，复拜周亚夫等为将屯兵要隘，汉廷举国进入战时戒备。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -167, "season": 0, "description": "前167年：因匈奴逼近关中，文帝废除边关通关凭证，以速援北境，并在长安周边增设屯卫。匈奴见汉军防备严密，且难以久战，遂在劫掠人口后引兵北撤，两国转入战后重整。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -166, "season": 0, "description": "前166年：老上单于复率骑兵入寇上郡、云中，大掠吏民。文帝集结各路车骑精锐十万之众，亲临北地郡督战阅兵，以雄师列阵边陲。匈奴远遁，汉军追至塞外而还，双方进入高频对峙。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -165, "season": 0, "description": "前165年：文帝借上年阅兵余威，于长安及边郡大规模选拔能射、精骑之士补充北军，并重点强化云中、代郡的骑兵营建。匈奴虽有小股哨骑南下探阵，见汉军精锐云集，终未敢发动大规模攻势。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -164, "season": 0, "description": "前164年：文帝将齐、淮南等大国拆分为六，削弱地方割据势力，确保后方兵源与粮草不被封国阻截。北境则利用休战期，在阴山南麓加固堡垒，形成了由封国与郡兵联动的纵深防御。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -163, "season": 0, "description": "前163年：北境遭遇大旱，匈奴因草场枯竭频繁袭扰。文帝下令边郡诸将固守不出，严禁轻敌出击，并紧急调拨敖仓粮草北运，强化塞下补给点，以充足后勤瓦解匈奴“以战养战”之图。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -162, "season": 0, "description": "前162年：因边境连年旱灾且消耗巨大，文帝重启和亲，与老上单于划定“长城以内归汉，长城以外归胡”的军事红线。边境关隘由临战状态转入警戒贸易，汉军主力回撤关中，进入休整。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -161, "season": 0, "description": "前161年：匈奴老上单于病逝，军臣单于继位，旋即撕毁旧约，发兵数万袭扰边郡以示军威。汉廷急令云中、辽东守将严阵以待，加强烽燧预警，汉军进入内松外紧的被动防御态势。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -160, "season": 0, "description": "前160年：军臣单于为稳固权位，大举动员漠北骑兵，绕过汉军坚固塞垒，深入代郡与上郡实施掠夺。文帝急调精锐屯兵渭水一线，并令边将加强机动截击，汉军以纵深防御迟滞胡骑攻势。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -159, "season": 0, "description": "前159年：匈奴各三万骑入上郡、云中，烽火直抵长安。文帝拜苏意、张武等为将，领兵十万屯于灞上、棘门，复命周亚夫驻军细柳。汉军严阵以待，胡骑旋即撤军。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -158, "season": 0, "description": "前158年：匈奴连岁入寇，汉廷维持灞上、棘门、细柳三军戒备。文帝亲往劳军，见周亚夫细柳营甲胄在身、军令如山，遂确立其为统帅核心。边境则以坚垒待敌，胡骑无隙可乘。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -157, "season": 0, "description": "前157年，汉文帝驾崩前密嘱太子，钦定周亚夫为社稷之将。关中三军保持临战戒备以防政权交替时匈奴突袭。汉景帝登基，即刻接掌虎符，维持内守外御方略，边境烽火暂息。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -156, "season": 0, "description": "前156年，内史晁错力陈削藩，请收诸侯封土以尊京师，景帝纳策。吴楚诸王震恐自危，刘濞恃铜盐之利，阴养死士以图逆乱。朝野虽无兵戈，然七国反意始萌，大乱将至。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -155, "season": 0, "description": "前155年，削藩策行，诏削楚、赵、胶西封土。诸侯激愤，胶西定盟。吴王刘濞传檄诸王，名为清君侧，实欲举兵向阙，逆谋成局，战云压顶。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    {
        "year": -154,
        "season": 0,
        "description": "前154年，吴楚七国举兵反，关东震动。景帝斩晁错以谢天下，兵锋未止。汉将周亚夫受命统军，断敌粮道，坚壁不战。叛军饥疲溃遁，刘濞伏诛，三月乱平。",
        "type": "field_battle",
        "fieldBattleData": {
            "attackerFactionId": "tianchao",
            "defenderFactionId": "zhonghua",
            "location": {
                "lat": 34.4460585,
                "lng": 115.6518561
            },
            "afterBattle": "move_to_city",
            "afterBattleTargetCityId": "changan",
            "siegeAfterBattleChain": [
                {
                    "action": "garrison"
                }
            ],
            "result": "defender_win"
        }
    },
    { "year": -144, "season": 0, "description": "前144年：汉将李广出镇上郡，提百骑逆击匈奴。胡骑惊疑，李广解鞍示闲，施疑兵之计，敌遂宵遁，飞将名震雁门。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    { "year": -133, "season": 0, "description": "前133年：汉廷设谋马邑，伏兵三十万以待单于。事泄计败，匈奴引兵引退，汉匈和亲由此断绝，大战开启。", "type": "field_battle", "fieldBattleData": { "attackerFactionId": "zhonghua", "defenderFactionId": "zhonghua", "isNarrative": true, "location": { "lat": 34.27, "lng": 108.94 } } },
    {
        "year": -129,
        "season": 0,
        "description": "前129年：汉将卫青等四路出击，由上谷直插龙城。卫青部斩首七百，其余三路或遭围困、或无功而还，汉军主动出击自此始。",
        "type": "field_battle",
        "fieldBattleData": {
            "attackerFactionId": "zhonghua",
            "defenderFactionId": "huihui",
            "location": {
                "lat": 42,
                "lng": 116
            },
            "afterBattle": "move_to_city",
            "afterBattleTargetCityId": "city_shanggu",
            "siegeAfterBattleChain": [
                {
                    "action": "garrison"
                }
            ],
            "result": "attacker_win"
        }
    }


];
