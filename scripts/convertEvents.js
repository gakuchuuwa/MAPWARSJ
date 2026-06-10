import * as fs from 'fs';

const rawEvents = [
    { "year": -236, "regnalYear": "秦王政十一年", "title": "赵伐燕之战", "season": 3, "type": "siege", "description": "赵悼襄王乘燕国不备，发大军攻打燕国，顺利夺取了燕国边境的貍城和阳城等地。", "attacker": "赵", "defender": "燕", "target_location": "貍城、阳城", "attacker_commander": "庞煖", "attacker_troops": 100000 },
    { "year": -236, "regnalYear": "秦王政十一年", "title": "秦攻赵阏与之战", "season": 3, "type": "siege", "description": "秦将王翦趁赵军主力北伐燕国之际，率大军自上党出击，越太行山攻克赵国要塞阏与及橑阳。", "attacker": "秦", "defender": "赵", "target_location": "阏与", "attacker_commander": "王翦", "attacker_troops": 150000 },
    { "year": -236, "regnalYear": "秦王政十一年", "title": "秦攻赵邺城之战", "season": 3, "type": "siege", "description": "秦将桓齮率南路军由南阳出发，沿太行山东南麓向赵国发起猛烈进攻，顺利攻克邺城和安阳。", "attacker": "秦", "defender": "赵", "target_location": "邺城", "attacker_commander": "桓齮", "attacker_troops": 100000 },
    { "year": -236, "regnalYear": "秦王政十一年", "title": "赵幽缪王继位", "season": 0, "type": "narrative", "description": "赵悼襄王病逝，生前因宠幸倡姬，废黜嫡长子赵嘉，立倡姬之子赵迁继位，是为赵幽缪王。", "attacker": "", "defender": "", "target_location": "", "attacker_commander": "", "attacker_troops": 0 },
    { "year": -235, "regnalYear": "秦王政十二年", "title": "秦助魏伐楚", "season": 0, "type": "narrative", "description": "秦王嬴政征发国内四个郡的兵力，命秦将辛梧统帅，出师协助魏国进攻楚国，后因故未果。", "attacker": "", "defender": "", "target_location": "", "attacker_commander": "", "attacker_troops": 0 },
    { "year": -235, "regnalYear": "秦王政十二年", "title": "吕不韦饮鸩自尽", "season": 0, "type": "narrative", "description": "被免职的秦前相国吕不韦因惧怕秦王政进一步的迫害与诛杀，在被流放蜀地前夕服毒自杀。", "attacker": "", "defender": "", "target_location": "", "attacker_commander": "", "attacker_troops": 0 },
    { "year": -234, "regnalYear": "秦王政十三年", "title": "平阳之战", "season": 0, "type": "field_battle", "description": "秦将桓齮率军攻赵，在平阳大败赵军，全歼赵军主力十万人，并阵斩赵国大将扈辄。", "attacker": "秦", "defender": "赵", "target_location": "平阳", "attacker_commander": "桓齮", "attacker_troops": 100000 },
    { "year": -234, "regnalYear": "秦王政十三年", "title": "肥下宜安之战", "season": 2, "type": "field_battle", "description": "赵王急调名将李牧自代郡驰援，李牧率精锐骑兵在肥下和宜安大破秦军，桓齮败逃。", "attacker": "赵", "defender": "秦", "target_location": "肥下", "attacker_commander": "李牧", "attacker_troops": 100000 },
    { "year": -233, "regnalYear": "秦王政十四年", "title": "秦夺武城平阳", "season": 0, "type": "siege", "description": "由于赵将李牧率军返回代郡防备匈奴，秦军桓齮部趁机重新发起进攻，攻占武城、平阳及宜安。", "attacker": "秦", "defender": "赵", "target_location": "武城", "attacker_commander": "桓齮", "attacker_troops": 100000 },
    { "year": -233, "regnalYear": "秦王政十四年", "title": "韩非入秦死", "season": 0, "type": "narrative", "description": "韩国公子韩非奉命出使秦国，因其政见与李斯不合，遭李斯等权臣陷害，最终在秦国下狱被逼自杀。", "attacker": "", "defender": "", "target_location": "", "attacker_commander": "", "attacker_troops": 0 },
    { "year": -232, "regnalYear": "秦王政十五年", "title": "番吾之战", "season": 0, "type": "field_battle", "description": "秦军分南北两路大举攻赵，北路军攻占狼孟与番吾，赵将李牧率军迎击，秦军战败撤退。", "attacker": "秦", "defender": "赵", "target_location": "番吾", "attacker_commander": "王翦", "attacker_troops": 100000 },
    { "year": -231, "regnalYear": "秦王政十六年", "title": "韩魏献地", "season": 2, "type": "narrative", "description": "韩国慑于秦国兵威，被迫献出南阳地以求苟安，魏国亦向秦国献地。秦派内史腾赴韩接收。", "attacker": "", "defender": "", "target_location": "", "attacker_commander": "", "attacker_troops": 0 },
    { "year": -230, "regnalYear": "秦王政十七年", "title": "秦灭韩之战", "season": 0, "type": "siege", "description": "秦王政命内史腾率军从南阳突袭韩国，一举攻破韩都阳翟，俘虏韩王安，韩国正式宣告灭亡。", "attacker": "秦", "defender": "韩", "target_location": "阳翟", "attacker_commander": "内史腾", "attacker_troops": 100000 },
    { "year": -229, "regnalYear": "秦王政十八年", "title": "井陉之战", "season": 0, "type": "siege", "description": "秦乘赵国严重旱荒之际，派大将王翦率上地秦军向赵国发起猛攻，顺利攻占赵地井陉。", "attacker": "秦", "defender": "赵", "target_location": "井陉", "attacker_commander": "王翦", "attacker_troops": 200000 },
    { "year": -229, "regnalYear": "秦王政十八年", "title": "赵杀李牧", "season": 3, "type": "narrative", "description": "秦国使用离间计重金收买赵国嬖臣郭开，诬陷李牧谋反。赵王迁听信谗言，临阵换将并诛杀李牧。", "attacker": "", "defender": "", "target_location": "", "attacker_commander": "", "attacker_troops": 0 },
    { "year": -228, "regnalYear": "秦王政十九年", "title": "秦灭赵之战", "season": 0, "type": "siege", "description": "赵军因主将李牧被害而士气大挫，秦将王翦趁机猛攻，击杀赵葱，攻克赵都邯郸，俘虏赵王迁，赵国亡。", "attacker": "秦", "defender": "赵", "target_location": "邯郸", "attacker_commander": "王翦", "attacker_troops": 300000 },
    { "year": -228, "regnalYear": "秦王政十九年", "title": "代王嘉自立", "season": 1, "type": "narrative", "description": "邯郸城破后，赵公子嘉率领赵氏宗族数百人逃往代郡，自立为代王，与燕军联合驻守上谷阻击秦军。", "attacker": "", "defender": "", "target_location": "", "attacker_commander": "", "attacker_troops": 0 },
    { "year": -227, "regnalYear": "秦王政二十年", "title": "荆轲刺秦王", "season": 0, "type": "narrative", "description": "燕太子丹派勇士荆轲与秦舞阳以献督亢地图为名出使秦国，企图在殿上行刺秦王政，最终事败被杀。", "attacker": "", "defender": "", "target_location": "", "attacker_commander": "", "attacker_troops": 0 },
    { "year": -227, "regnalYear": "秦王政二十年", "title": "易水之战", "season": 2, "type": "field_battle", "description": "秦王政因遇刺大怒，命王翦与辛胜率军攻燕，秦军迂回包抄，在易水之西大破燕代联军主力。", "attacker": "秦", "defender": "燕", "target_location": "易水", "attacker_commander": "王翦", "attacker_troops": 200000 },
    { "year": -226, "regnalYear": "秦王政二十一年", "title": "秦攻燕蓟之战", "season": 2, "type": "siege", "description": "秦军主将王翦率大军继续北进，顺利攻克燕国都城蓟城。燕王喜与太子丹被迫率残部逃往辽东。", "attacker": "秦", "defender": "燕", "target_location": "蓟", "attacker_commander": "王翦", "attacker_troops": 200000 },
    { "year": -226, "regnalYear": "秦王政二十一年", "title": "衍水之战", "season": 3, "type": "field_battle", "description": "秦将李信率轻装部队数千人追击燕军，在衍水彻底击溃燕太子丹军，燕王喜被迫斩杀太子丹求和。", "attacker": "秦", "defender": "燕", "target_location": "衍水", "attacker_commander": "李信", "attacker_troops": 5000 },
    { "year": -226, "regnalYear": "秦王政二十一年", "title": "秦攻楚序战", "season": 0, "type": "siege", "description": "秦王政派大将王贲率领一部兵力南下试探性攻楚，击败楚军并夺取十余座城邑，取得了序战的胜利。", "attacker": "秦", "defender": "楚", "target_location": "楚地", "attacker_commander": "王贲", "attacker_troops": 100000 },
    { "year": -225, "regnalYear": "秦王政二十二年", "title": "秦灭魏之战", "season": 0, "type": "siege", "description": "秦将王贲率大军包围魏都大梁，引黄河与鸿沟之水漫灌城墙。三个月后城毁，魏王假投降，魏国灭亡。", "attacker": "秦", "defender": "魏", "target_location": "大梁", "attacker_commander": "王贲", "attacker_troops": 150000 },
    { "year": -225, "regnalYear": "秦王政二十二年", "title": "李信伐楚之战", "season": 1, "type": "siege", "description": "秦将李信与蒙武率二十万大军分两路攻楚，李信攻平舆，蒙武攻寝，初战击败楚国边防守军。", "attacker": "秦", "defender": "楚", "target_location": "平舆", "attacker_commander": "李信", "attacker_troops": 200000 },
    { "year": -225, "regnalYear": "秦王政二十二年", "title": "城父之战", "season": 2, "type": "field_battle", "description": "楚国老将项燕尾随秦军三天三夜，趁秦军在城父会师无备时发起夜袭，大破李信军，斩杀七名秦都尉。", "attacker": "楚", "defender": "秦", "target_location": "城父", "attacker_commander": "项燕", "attacker_troops": 200000 },
    { "year": -224, "regnalYear": "秦王政二十三年", "title": "平舆对峙及蕲南之战", "season": 0, "type": "field_battle", "description": "秦王翦率六十万大军伐楚，坚壁不战以逸待劳。待楚军求战不得东撤时，秦军猛追至蕲南大破楚军，击杀项燕。", "attacker": "秦", "defender": "楚", "target_location": "蕲南", "attacker_commander": "王翦", "attacker_troops": 600000 },
    { "year": -223, "regnalYear": "秦王政二十四年", "title": "秦灭楚之战", "season": 0, "type": "siege", "description": "秦将王翦与蒙武率领大军乘胜攻入楚国都城寿春，俘虏楚王负刍，并在楚地设置楚郡，楚国宣告灭亡。", "attacker": "秦", "defender": "楚", "target_location": "寿春", "attacker_commander": "王翦", "attacker_troops": 600000 },
    { "year": -223, "regnalYear": "秦王政二十四年", "title": "平定淮南之战", "season": 1, "type": "field_battle", "description": "项燕残余势力在淮南假托项燕之名立昌平君反秦，王翦与蒙武迅速率军将其击破，彻底控制楚国江北地区。", "attacker": "秦", "defender": "楚", "target_location": "淮南", "attacker_commander": "王翦", "attacker_troops": 600000 },
    { "year": -222, "regnalYear": "秦王政二十五年", "title": "秦灭燕代之战", "season": 0, "type": "siege", "description": "秦将王贲率大军攻入辽东，击溃燕军残部俘虏燕王喜，随后回师攻代，俘虏代王嘉。燕国与代国彻底覆灭。", "attacker": "秦", "defender": "燕", "target_location": "辽东", "attacker_commander": "王贲", "attacker_troops": 100000 },
    { "year": -222, "regnalYear": "秦王政二十五年", "title": "秦平定百越之战", "season": 1, "type": "field_battle", "description": "秦将王翦与蒙武率军渡过长江，经过一年苦战消灭楚国在江南的残余势力，降服越君，设置会稽郡。", "attacker": "秦", "defender": "越", "target_location": "会稽", "attacker_commander": "王翦", "attacker_troops": 150000 },
    { "year": -221, "regnalYear": "秦王政二十六年", "title": "秦灭齐之战", "season": 0, "type": "siege", "description": "秦将王贲、蒙恬等避开齐国主力防守的西线，从燕国南部突然南下直插齐都临淄。齐王建不战而降，齐国灭亡。", "attacker": "秦", "defender": "齐", "target_location": "临淄", "attacker_commander": "王贲", "attacker_troops": 200000 },
    { "year": -221, "regnalYear": "秦王政二十六年", "title": "秦始皇统一中国", "season": 0, "type": "narrative", "description": "秦王政完成了并灭六国的大业，创立了中国历史上第一个大一统的封建专制帝国，自称“始皇帝”。", "attacker": "", "defender": "", "target_location": "", "attacker_commander": "", "attacker_troops": 0 },
    { "year": -220, "regnalYear": "秦始皇二十七年", "title": "秦始皇首次出巡", "season": 0, "type": "narrative", "description": "秦始皇首次出巡陇西、北地等边境地区，视察长城防务，并下令在全国范围内修筑以咸阳为中心的驰道网。", "attacker": "", "defender": "", "target_location": "", "attacker_commander": "", "attacker_troops": 0 },
    { "year": -219, "regnalYear": "秦始皇二十八年", "title": "秦始皇泰山封禅", "season": 0, "type": "narrative", "description": "秦始皇进行第二次东巡，前往泰山封禅，刻石颂德。期间还派遣方士徐市率领数千童男女入海求仙。", "attacker": "", "defender": "", "target_location": "", "attacker_commander": "", "attacker_troops": 0 },
    { "year": -218, "regnalYear": "秦始皇二十九年", "title": "博浪沙遇刺", "season": 0, "type": "narrative", "description": "秦始皇第三次东巡，途径阳武博浪沙时，遭遇原韩国贵族张良指派的力士掷铁椎伏击，误中副车，始皇安然无恙。", "attacker": "", "defender": "", "target_location": "", "attacker_commander": "", "attacker_troops": 0 },
    { "year": -216, "regnalYear": "秦始皇三十一年", "title": "黔首自实田", "season": 0, "type": "narrative", "description": "秦始皇下令推行“黔首自实田”的法令，要求百姓向政府据实登记占有土地的数额，标志着封建土地私有制在全国的确立。", "attacker": "", "defender": "", "target_location": "", "attacker_commander": "", "attacker_troops": 0 }
];

const factionMap: Record<string, string> = {
    "秦": "qin",
    "赵": "huihui",
    "燕": "chaoxian",
    "韩": "qiangzang",
    "魏": "menggu",  // mapped temporarily per FACTIONS list
    "楚": "tianchao", // mapped temporarily
    "齐": "zhonghua", // mapped temporarily
    "越": "yuenan"
};

const cityMap: Record<string, string> = {
    "阳翟": "city_xinzheng", // closest equivalent
    "阏与": "city_eyu",
    "邺城": "city_yecheng",
    "平阳": "city_pingyang",
    "肥下": "city_fei",
    "武城": "city_changzi", // placeholder
    "番吾": "city_jingxingkou", // placeholder
    "大梁": "kaifeng",
    "平舆": "city_pingyu",
    "临淄": "qingzhou",
    "蓟": "youzhou",
    "邯郸": "city_handan",
    "寿春": "shouchun"
};

let outputStr = "export const DEV_EVENTS = [\n";

for (const e of rawEvents) {
    let out = `    {\n`;
    out += `        "year": ${e.year},\n`;
    out += `        "regnalYear": "${e.regnalYear}",\n`;
    out += `        "title": "${e.title}",\n`;
    out += `        "season": ${e.season},\n`;
    out += `        "description": "${e.description}",\n`;
    out += `        "type": "${e.type}"`;

    if (e.type === "siege") {
        out += `,\n        "siegeData": {\n`;
        out += `            "attackerFactionId": "${factionMap[e.attacker] || 'panjun'}",\n`;
        out += `            "defenderCityId": "${cityMap[e.target_location] || 'city_placeholder'}",\n`;
        out += `            "result": "attacker_win",\n`;
        out += `            "legionName": "${e.attacker}-${e.attacker_commander}军",\n`;
        out += `            "attackerTroops": ${e.attacker_troops}\n`;
        out += `        }\n`;
    } else if (e.type === "field_battle") {
        out += `,\n        "fieldBattleData": {\n`;
        out += `            "attackerFactionId": "${factionMap[e.attacker] || 'panjun'}",\n`;
        out += `            "defenderFactionId": "${factionMap[e.defender] || 'panjun'}",\n`;
        out += `            "attackerLegionName": "${e.attacker}-${e.attacker_commander}军",\n`;
        out += `            "defenderLegionName": "${e.defender}-守军",\n`;
        if (e.attacker_troops > 0) {
            out += `            "attackerTroops": ${e.attacker_troops},\n`;
        }
        out += `            "result": "attacker_win",\n`;
        out += `            "location": { "lat": 35, "lng": 115 }\n`; // placeholder, user will adjust
        out += `        }\n`;
    } else {
        out += "\n";
    }

    out += `    },\n`;
    outputStr += out;
}

outputStr += "];\n";
fs.writeFileSync('d:/MAPWARSJ/src/data/events/dev_events.ts', outputStr);
console.log("Converted successfully to dev_events.ts");
