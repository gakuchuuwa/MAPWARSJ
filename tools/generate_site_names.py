import json
import re
from pathlib import Path

de_meta = json.load(open('scratch/de_scenarios_all_meta.json', encoding='utf-8'))
cities = json.load(open('scratch/project_cities.json', encoding='utf-8'))
generals = json.load(open('scratch/project_generals.json', encoding='utf-8'))
old_sites = {x['id']: x for x in json.load(open('public/de-maps/campaign/site_names.json', encoding='utf-8'))}

city_by_id = {c['id']: c for c in cities}
city_by_name = {c['name']: c for c in cities}
gen_by_name = {g['name']: g for g in generals}
gen_by_id = {g['id']: g for g in generals}

type_zh_map = {
    'big_city': '大城',
    'medium_city': '中城',
    'small_city': '小城',
    'pass': '关隘',
    'stockade': '城寨'
}

# Accurate campaign mappings based on DE in-game briefings & project cities_v2
CAMPAIGN_RULES = {
    # ── Tariq (acam1 / coop17) ──
    'acam1': [
        ('city_cordoba', '瓜达莱特河之战后围攻科尔多瓦 711', '倭马亚（塔里克）', 'talike_talike', '西哥特王国（罗德里克）', 'xigete_roderic'),
        ('city_toledo', '攻取西哥特都城托莱多 712', '倭马亚（塔里克）', 'talike_talike', '西哥特王国', ''),
        ('city_zaragoza', '征服埃布罗河流域与萨拉戈萨 713', '倭马亚（塔里克）', 'talike_talike', '西哥特残部', ''),
        ('city_toulouse', '翻越比利牛斯山出击阿基坦 721', '倭马亚（阿卜杜勒·拉赫曼）', '', '阿基坦公国（厄德公爵）', ''),
        ('city_bordeaux', '加龙河之战与攻取波尔多 732', '倭马亚（阿卜杜勒·拉赫曼）', '', '法兰克王国（查理·马特）', '')
    ],
    # ── Sundjata (acam2) ──
    'acam2': [
        ('city_niani', '逃出索索人占领的尼亚尼古都 1230', '马里（松迪亚塔）', 'gen_sundjata', '索索帝国（苏曼古鲁）', ''),
        ('city_niani', '联合曼丁诸部反抗索索霸权 1234', '马里（松迪亚塔）', 'gen_sundjata', '索索帝国（苏曼古鲁）', ''),
        ('city_jienei', '围攻尼日尔河贸易重镇杰内 1235', '马里（松迪亚塔）', 'gen_sundjata', '索索帝国', ''),
        ('city_jienei', '基里纳决战击溃苏曼古鲁 1235', '马里（松迪亚塔）', 'gen_sundjata', '索索帝国（苏曼古鲁）', ''),
        ('city_kumubi', '攻陷加纳古都库姆比萨利赫 1240', '马里（松迪亚塔）', 'gen_sundjata', '加纳/索索残部', '')
    ],
    # ── Francisco de Almeida (acam3) ──
    'acam3': [
        ('city_braganca', '托罗战役支援阿方索五世 1476', '葡萄牙（阿尔梅达）', 'putaoya_afonso', '卡斯蒂利亚（斐迪南二世）', 'gen_ferdinand_ii'),
        ('city_xiuta', '北非摩洛哥格拉西奥萨要塞防卫 1489', '葡萄牙（阿尔梅达）', '', '摩洛哥摩尔人', ''),
        ('city_mozambique', '建立莫桑比克要塞与印度洋航线 1505', '葡萄牙（阿尔梅达）', 'mozambique_ataide', '基尔瓦苏丹国', ''),
        ('city_guoa', '围攻坎纳诺尔要塞与开辟果阿 1507', '葡萄牙（阿尔梅达）', '', '卡利卡特扎莫林', ''),
        ('city_guoa', '第乌海战歼灭联合舰队 1509', '葡萄牙（阿尔梅达）', '', '马穆鲁克/古吉拉特联军', '')
    ],
    # ── Yodit (acam4) ──
    'acam4': [
        ('city_saimien', '逃离阿克苏姆前往南方流亡 960', '贝塔以色列（尤迪特）', 'gen_yodit', '阿克苏姆帝国', ''),
        ('city_lalibeila', '结盟阿高诸部与建立根据地 965', '贝塔以色列（尤迪特）', 'gen_yodit', '扎格维王朝', ''),
        ('city_saimien', '塞米恩高原夺权反攻 970', '贝塔以色列（尤迪特）', 'gen_yodit', '阿克苏姆残部', ''),
        ('city_aksum', '长驱直入围攻阿克苏姆圣城 975', '贝塔以色列（尤迪特）', 'gen_yodit', '阿克苏姆末代皇帝', ''),
        ('city_aksum', '彻底毁灭阿克苏姆帝国都城 979', '贝塔以色列（尤迪特）', 'gen_yodit', '阿克苏姆帝国', '')
    ],
    # ── Joan of Arc (cam2) ──
    'cam2': [
        ('city_chambord', '沃库勒尔护送圣女前往希农 1429', '法兰西（圣女贞德）', 'gen_joanofarc', '英格兰/勃艮第盗匪', ''),
        ('city_shatteer', '解除奥尔良之围 1429', '法兰西（圣女贞德）', 'gen_joanofarc', '英格兰（萨福克伯爵）', 'gen_suffolk'),
        ('city_chambord', '帕提战役清剿卢瓦尔河堡垒 1429', '法兰西（圣女贞德）', 'gen_joanofarc', '英格兰（法斯托夫）', ''),
        ('city_lansi', '突破重重封锁护送查理七世兰斯加冕 1429', '法兰西（圣女贞德）', 'gen_joanofarc', '勃艮第公国', 'gen_philip_good'),
        ('city_bali', '围攻巴黎城 1429', '法兰西（圣女贞德）', 'gen_joanofarc', '英格兰/勃艮第驻军', 'gen_suffolk'),
        ('city_bordeaux', '卡斯蒂永战役终结百年战争 1453', '法兰西（让·布罗）', '', '英格兰（约翰·塔尔博特）', '')
    ],
    # ── Saladin (cam3 / coop3) ──
    'cam3': [
        ('city_mengfeisi', '开罗夺权与驱逐法兰克十字军 1169', '阿尤布（萨拉赫丁）', 'ayoubu_salaheding', '法特玛残部/耶路撒冷十字军', ''),
        ('city_damasikusi', '大马士革进驻统一叙利亚 1174', '阿尤布（萨拉赫丁）', 'ayoubu_salaheding', '赞吉王朝诸侯', 'gen_nur_ad_din'),
        ('city_peiluximu', '夺取红海霍恩海角要塞 1182', '阿尤布（萨拉赫丁）', 'ayoubu_salaheding', '沙蒂永的雷诺', ''),
        ('city_yelusaleng', '哈丁战役大捷后攻克圣城耶路撒冷 1187', '阿尤布（萨拉赫丁）', 'ayoubu_salaheding', '十字军（吕西尼昂的居伊）', ''),
        ('city_ake', '抵抗第三次十字军围攻阿卡 1191', '阿尤布（萨拉赫丁）', 'ayoubu_salaheding', '十字军（腓力二世）', ''),
        ('city_yelusaleng', '雅法战役决战狮心理查守卫圣城 1192', '阿尤布（萨拉赫丁）', 'ayoubu_salaheding', '英格兰（狮心理查）', '')
    ],
    # ── Genghis Khan (cam4) ──
    'cam4': [
        ('city_qudiaoalan', '十三翼之战与斡难河源统一蒙古部族 1206', '大蒙古国（成吉思汗）', 'menggu_d_chengjisihan', '札木合与泰赤乌部', ''),
        ('city_xingqingfu2', '征伐西夏破兀剌海城破黑水城 1209', '大蒙古国（成吉思汗）', 'menggu_d_chengjisihan', '西夏（夏襄宗）', ''),
        ('city_beijing', '破野狐岭突破居庸关围困金中都 1215', '大蒙古国（成吉思汗）', 'menggu_d_chengjisihan', '金朝（完颜承晖）', ''),
        ('city_samaerhan', '西征花剌子模攻克不花剌与撒马尔罕 1220', '大蒙古国（成吉思汗）', 'menggu_d_chengjisihan', '花剌子模（摩诃末）', ''),
        ('city_dabulishi', '哲别速不台长驱劫掠帖必力思大不里士 1221', '大蒙古国（速不台）', 'da_yuan_subutai', '阿塞拜疆伊勒德吉兹王朝', ''),
        ('city_budapeisi', '拔都速不台突入中欧萨约河之战 1241', '大蒙古国（速不台）', 'da_yuan_subutai', '匈牙利王国（贝拉四世）', '')
    ],
    # ── Barbarossa (cam5) ──
    'cam5': [
        ('city_yachen', '神圣罗马帝国诸侯纷争亚琛加冕 1152', '神圣罗马帝国（巴巴罗萨）', 'gen_barbarossa', '萨克森与巴伐利亚诸侯', ''),
        ('city_milan', '翻越阿尔卑斯山围攻平定米兰城 1158', '神圣罗马帝国（巴巴罗萨）', 'gen_barbarossa', '伦巴第自治城邦联盟', ''),
        ('city_luoma', '进军罗马与教皇亚历山大三世决裂 1167', '神圣罗马帝国（巴巴罗萨）', 'gen_barbarossa', '罗马教皇国', ''),
        ('city_milan', '莱尼亚诺战役决战伦巴第同盟 1176', '神圣罗马帝国（巴巴罗萨）', 'gen_barbarossa', '伦巴第联盟（阿尔贝托）', ''),
        ('city_junshitandingbao', '第三次十字军东征借道拜占庭 1190', '神圣罗马帝国（巴巴罗萨）', 'gen_barbarossa', '拜占庭帝国（伊萨克二世）', ''),
        ('city_ake', '皇帝遗体运往圣地与围攻阿卡 1191', '德意志十字军（施瓦本公爵）', '', '阿尤布王朝守军', 'ayoubu_salaheding')
    ],
    # ── Algirdas & Kestutis (eecam1) ──
    'eecam1': [
        ('city_weierniwusi', '抵御条顿骑士团长驱洗劫维尔纽斯 1345', '立陶宛大公国（阿尔吉尔达斯）', 'litaowan_algirdas', '条顿骑士团', ''),
        ('city_simolengsike', '向东扩张兼并斯摩棱斯克诸公国 1359', '立陶宛大公国（阿尔吉尔达斯）', 'litaowan_algirdas', '斯摩棱斯克公国', ''),
        ('city_mosike', '立陶宛大军三度围攻莫斯科大公国 1368', '立陶宛大公国（阿尔吉尔达斯）', 'litaowan_algirdas', '莫斯科大公国（德米特里）', 'gen_dmitry_donskoy'),
        ('city_jifu', '蓝水之战大破金帐汗国三王重夺基辅 1362', '立陶宛大公国（阿尔吉尔达斯）', 'litaowan_algirdas', '金帐汗国（忽鲁伯汗）', ''),
        ('city_weierniwusi', '克雷沃联合前夕抵御条顿倾国围攻 1382', '立陶宛大公国（雅盖沃）', 'gen_jogaila', '条顿骑士团', '')
    ],
    # ── Jadwiga (eecam2) ──
    'eecam2': [
        ('city_kelakefu', '加冕为波兰国王与波立联邦联姻 1384', '波兰王国（雅德维加）', 'gen_jadwiga', '奥波莱公爵弗瓦迪斯瓦夫', ''),
        ('city_kelakefu', '进军加利奇整合红鲁塞尼亚 1387', '波兰王国（雅德维加）', 'gen_jadwiga', '匈牙利王国驻军', ''),
        ('city_weierniwusi', '调解维陶塔斯与约盖拉内战 1392', '波兰王国（雅德维加）', 'gen_jadwiga', '维陶塔斯支持者', ''),
        ('city_jifu', '沃尔斯克拉河之战抵抗帖木儿忽格鲁克 1399', '波立联军（雅盖沃）', 'gen_jogaila', '金帐汗国（也迪古）', ''),
        ('city_kelakefu', '格伦瓦德之战前哨夺取维利奇卡 1409', '波兰王国（雅盖沃）', 'gen_jogaila', '条顿骑士团', ''),
        ('city_kelakefu', '格伦瓦德之战彻底摧毁条顿骑士团 1410', '波立联军（雅盖沃）', 'gen_jogaila', '条顿骑士团（容金根）', '')
    ],
    # ── Jan Zizka (eecam3) ──
    'eecam3': [
        ('city_bulage', '苏多梅日之战车垒初战告捷 1420', '胡斯派（扬·杰式卡）', 'gen_jan_zizka', '天主教十字军', ''),
        ('city_bulage', '维特科夫山战役解围布拉格城 1420', '胡斯派（扬·杰式卡）', 'gen_jan_zizka', '神圣罗马帝国（西吉斯蒙德）', ''),
        ('city_bulage', '内布维迪之战击退第二次反胡斯十字军 1422', '胡斯派（扬·杰式卡）', 'gen_jan_zizka', '神圣罗马帝国十字军', ''),
        ('city_bulage', '马列绍夫战役内战力克布拉格温和派 1424', '胡斯激进派（扬·杰式卡）', 'gen_jan_zizka', '胡斯温和派/天主教同盟', ''),
        ('city_bulage', '胡斯特战役击破第四次反胡斯远征 1427', '胡斯派（普罗科普）', '', '神圣罗马帝国十字军', ''),
        ('city_bulage', '多马日利采之战无敌车垒全歼强敌 1431', '胡斯派（普罗科普）', '', '第五次反胡斯十字军', '')
    ],
    # ── Alaric (fcam1 / coop10) ──
    'fcam1': [
        ('city_ravenna', '波伦提亚之战与斯提里科对决 402', '西哥特王国（亚拉里克）', 'gen_alaric', '西罗马帝国（斯提里科）', ''),
        ('city_sparta', '南下劫掠伯罗奔尼撒击破斯巴达 396', '西哥特王国（亚拉里克）', 'gen_alaric', '东罗马帝国守军', ''),
        ('city_verona', '维罗纳之役突破阿尔卑斯山口 403', '西哥特王国（亚拉里克）', 'gen_alaric', '西罗马帝国军队', ''),
        ('city_luoma', '洗劫永恒之城罗马 410', '西哥特王国（亚拉里克）', 'gen_alaric', '西罗马帝国（霍诺留）', ''),
        ('city_toulouse', '转战高卢建立图卢兹西哥特王国 418', '西哥特王国（阿陶尔夫）', 'gen_ataulf', '西罗马帝国属地', '')
    ],
    # ── Dracula (fcam2) ──
    'fcam2': [
        ('city_teergewishite', '重返瓦拉几亚夺取特尔戈维什泰 1456', '瓦拉几亚（弗拉德三世）', 'gen_vlad_impaler', '达纳斯托维奇亲王', ''),
        ('city_teergewishite', '穿刺公严惩博雅尔贵族叛乱 1457', '瓦拉几亚（弗拉德三世）', 'gen_vlad_impaler', '特兰西瓦尼亚萨克森商帮', ''),
        ('city_delusitaer', '多瑙河沿线突袭奥斯曼要塞 1461', '瓦拉几亚（弗拉德三世）', 'gen_vlad_impaler', '奥斯曼帝国（哈姆扎帕夏）', ''),
        ('city_teergewishite', '夜袭特尔戈维什泰大破穆罕默德二世 1462', '瓦拉几亚（弗拉德三世）', 'gen_vlad_impaler', '奥斯曼帝国（穆罕默德二世）', 'gen_mehmed_ii'),
        ('city_teergewishite', '重夺王位血战布加勒斯特 1476', '瓦拉几亚（弗拉德三世）', 'gen_vlad_impaler', '奥斯曼附庸巴萨拉布', '')
    ],
    # ── Bari (fcam3) ──
    'fcam3': [
        ('city_meierfei', '围攻收复巴里埃米尔国 871', '拜占庭帝国', '', '巴里埃米尔国', ''),
        ('city_meierfei', '梅尔菲叛乱与击退诺曼雇佣兵 1041', '拜占庭帝国（卡塔卡隆）', '', '诺曼佣兵（阿普利亚的威廉）', ''),
        ('city_meierfei', '罗伯特·吉斯卡尔围攻陷落巴里 1071', '诺曼（罗伯特·吉斯卡尔）', '', '拜占庭帝国最后驻军', ''),
        ('city_meierfei', '巴里军区抵抗诺曼骑士渗透 1075', '拜占庭帝国', '', '诺曼（罗伯特·吉斯卡尔）', ''),
        ('city_meierfei', '两西西里诺曼王朝最终确立 1139', '诺曼（罗杰二世）', '', '拜占庭守军', '')
    ],
    # ── Sforza (fcam4) ──
    'fcam4': [
        ('city_milan', '佣兵生涯初露头角争夺伦巴第 1427', '米兰公国（斯福尔扎）', 'gen_maximilian_sforza', '威尼斯共和国', ''),
        ('city_milan', '夺取马尔凯平定教皇属地 1434', '米兰公国（斯福尔扎）', 'gen_maximilian_sforza', '教皇国军队', ''),
        ('city_milan', '安布罗西亚共和国保卫米兰 1447', '米兰公国（斯福尔扎）', 'gen_maximilian_sforza', '威尼斯共和国', ''),
        ('city_milan', '入主米兰加冕米兰公爵 1450', '米兰公国（斯福尔扎）', 'gen_maximilian_sforza', '安布罗西亚叛军', ''),
        ('city_milan', '意大利和平洛迪条约终结纷争 1454', '米兰公国（斯福尔扎）', 'gen_maximilian_sforza', '那不勒斯/威尼斯同盟', '')
    ],
    # ── Pachacuti (fcam5 / coop9) ──
    'fcam5': [
        ('city_cusco', '保卫圣谷抵御昌卡部族围攻 1438', '印加帝国（帕查库提）', 'gen_pachacuti', '昌卡联盟（阿斯塔瓦兰卡）', ''),
        ('city_cusco', '大败昌卡扩张整合库斯科平原 1440', '印加帝国（帕查库提）', 'gen_pachacuti', '昌卡联盟残部', ''),
        ('city_diyawanake', '征服的的喀喀湖畔科利亚部族 1445', '印加帝国（帕查库提）', 'gen_pachacuti', '科利亚王国', ''),
        ('city_quito', '北征奇穆王国与攻克昌昌城 1470', '印加帝国（阿塔瓦尔帕）', 'gen_atahualpa', '奇穆王国（明昌卡曼）', ''),
        ('city_cusco', '四方之地萨克塞瓦曼筑城称霸 1471', '印加帝国（帕查库提）', 'gen_pachacuti', '反叛军阀', '')
    ],
    # ── Prithviraj (fcam6) ──
    'fcam6': [
        ('city_deli', '争夺德里王位击退遮娄其王朝 1178', '乔汉王朝（普里特维拉杰）', 'zhelouqi_puliteweilajie', '遮娄其王朝（穆拉贾二世）', ''),
        ('city_qunvcheng', '曲女城抢婚迎娶加哈达瓦拉公主 1185', '乔汉王朝（普里特维拉杰）', 'zhelouqi_puliteweilajie', '加哈达瓦拉王朝（贾亚钱德拉）', ''),
        ('city_deli', '第一次塔莱因战役大败古尔苏丹 1191', '拉其普特同盟（普里特维拉杰）', 'zhelouqi_puliteweilajie', '古尔王朝（穆罕默德·古尔）', 'bfe_muhammad_ghur'),
        ('city_deli', '第二次塔莱因战役血战古尔铁骑 1192', '拉其普特同盟（普里特维拉杰）', 'zhelouqi_puliteweilajie', '古尔王朝（穆罕默德·古尔）', 'bfe_muhammad_ghur'),
        ('city_deli', '拉贾斯坦各堡垒抵抗德里苏丹国 1193', '乔汉残部（戈温达拉贾）', '', '古尔王朝（库特布丁·艾伯克）', '')
    ],
    # ── Babur (incam1) ──
    'incam1': [
        ('city_samaerhan', '少年苏丹三度进退撒马尔罕 1497', '莫卧儿（巴布尔）', 'babuer_babuer', '乌兹别克汗国（昔班尼）', ''),
        ('city_gaofu', '退保喀布尔建立阿富汗新基地 1504', '莫卧儿（巴布尔）', 'babuer_babuer', '喀布尔阿尔浑部', ''),
        ('city_samaerhan', '结盟萨非波斯重返河中 1511', '莫卧儿（巴布尔）', 'babuer_babuer', '乌兹别克汗国', ''),
        ('city_deli', '第一次帕尼帕特战役横扫洛迪苏丹 1526', '莫卧儿（巴布尔）', 'babuer_babuer', '德里苏丹国（易卜拉欣·洛迪）', ''),
        ('city_agela', '卡努瓦战役大破拉其普特战象联军 1527', '莫卧儿（巴布尔）', 'babuer_babuer', '拉其普特联盟（拉纳·桑伽）', '')
    ],
    # ── Rajendra (incam2) ──
    'incam2': [
        ('city_tanjiawuer', '继承朱罗王统征讨遮娄其 1014', '朱罗王朝（拉金德拉一世）', 'zhuluo_lajindela', '西遮娄其王朝', ''),
        ('city_tanjiawuer', '渡海东征攻陷斯里兰卡胜城 1017', '朱罗王朝（拉金德拉一世）', 'zhuluo_lajindela', '僧伽罗王国（玛欣达五世）', ''),
        ('city_gaodacheng', '挥师北伐恒河水直抵波罗王朝 1022', '朱罗王朝（拉金德拉一世）', 'zhuluo_lajindela', '波罗王朝（提婆波罗）', 'varendra_devapala'),
        ('city_sanfoqi', '横渡孟加拉湾破室利佛逝帝国 1025', '朱罗无敌舰队（拉金德拉一世）', 'zhuluo_lajindela', '室利佛逝帝国（桑格拉玛）', ''),
        ('city_tanjiawuer', '巩固恒河贡达朱罗普兰新都 1030', '朱罗王朝（拉金德拉一世）', 'zhuluo_lajindela', '叛乱诸侯', '')
    ],
    # ── Devapala (incam3) ──
    'incam3': [
        ('city_gaodacheng', '继承达摩波罗遗志威服孟加拉 810', '波罗王朝（提婆波罗）', 'varendra_devapala', '普拉蒂哈拉王朝', ''),
        ('city_qunvcheng', '进军曲女城争夺北印度霸权 820', '波罗王朝（提婆波罗）', 'varendra_devapala', '普拉蒂哈拉（罗阇博伽）', ''),
        ('city_huashicheng', '南征罗湿陀罗拘陀大获全胜 830', '波罗王朝（提婆波罗）', 'varendra_devapala', '罗湿陀罗拘陀王朝', ''),
        ('city_gaodacheng', '庇护那烂陀寺与繁荣大乘佛教 840', '波罗王朝（提婆波罗）', 'varendra_devapala', '反教起义', ''),
        ('city_gaodacheng', '波罗盛世平定喜马拉雅蛮族 850', '波罗王朝（提婆波罗）', 'varendra_devapala', '西藏吐蕃王朝', '')
    ],
    # ── Tamerlane (kcam1 / coop25) ──
    'kcam1': [
        ('city_samaerhan', '称雄西察合台平定河中 1370', '帖木儿帝国（帖木儿）', 'tiemuer_tiemuer', '忽辛埃米尔', ''),
        ('city_helate_city', '征服呼罗珊进军波斯诸城 1383', '帖木儿帝国（帖木儿）', 'tiemuer_tiemuer', '卡尔提德王朝', ''),
        ('city_salai', '昆杜尔察河战役大破脱脱迷失 1391', '帖木儿帝国（帖木儿）', 'tiemuer_tiemuer', '金帐汗国（脱脱迷失）', ''),
        ('city_deli', '南下劫掠德里苏丹国 1398', '帖木儿帝国（帖木儿）', 'tiemuer_tiemuer', '图格鲁克王朝（马哈茂德）', ''),
        ('city_damasikusi', '席卷黎凡特攻克阿勒颇与大马士革 1400', '帖木儿帝国（帖木儿）', 'tiemuer_tiemuer', '马穆鲁克苏丹国（法拉吉）', ''),
        ('city_aidiernei', '安卡拉战役生擒雷霆巴耶济德 1402', '帖木儿帝国（帖木儿）', 'tiemuer_tiemuer', '奥斯曼帝国（巴耶济德一世）', 'gen_bayezid_i')
    ],
    # ── Ivaylo (kcam2) ──
    'kcam2': [
        ('city_teernuowo', '菜农起义击退蒙古鞑靼侵扰 1277', '保加利亚起义军（伊瓦伊洛）', 'gen_ivaylo', '金帐汗国掠夺军', ''),
        ('city_teernuowo', '诛杀君士坦丁·阿森入主特尔诺沃 1277', '保加利亚起义军（伊瓦伊洛）', 'gen_ivaylo', '保加利亚旧贵族', ''),
        ('city_delusitaer', '德卢斯塔尔要塞抵抗拜占庭与蒙古 1278', '保加利亚（伊瓦伊洛）', 'gen_ivaylo', '拜占庭军队（穆扎隆）', ''),
        ('city_teernuowo', '德维尼亚之战击溃拜占庭远征军 1279', '保加利亚（伊瓦伊洛）', 'gen_ivaylo', '拜占庭军队（阿普林）', ''),
        ('city_salai', '北逃萨莱金帐大营惨遭毒手 1281', '保加利亚（伊瓦伊洛）', 'gen_ivaylo', '金帐汗国（那海汗）', '')
    ],
    # ── Kotyan Khan (kcam3) ──
    'kcam3': [
        ('city_saigede', '迦勒迦河战役联俄抗击蒙古 1223', '库曼汗国（忽炭汗）', 'gen_kotyan', '大蒙古国（速不台）', 'da_yuan_subutai'),
        ('city_jifu', '蒙古大军长驱突入第聂伯草原 1238', '库曼汗国（忽炭汗）', 'gen_kotyan', '大蒙古国（拔都）', ''),
        ('city_budapeisi', '率全族入归匈牙利寻求庇护 1239', '库曼汗国（忽炭汗）', 'gen_kotyan', '匈牙利敌对贵族', ''),
        ('city_budapeisi', '可汗遇害库曼部族南撤洗劫 1241', '库曼反叛军', '', '匈牙利王国驻军', ''),
        ('city_teernuowo', '定居保加利亚再战莫拉维亚 1242', '库曼/保加利亚盟军', '', '奥地利公国', '')
    ],
    # ── Gajah Mada (rcam1) ──
    'rcam1': [
        ('city_teluowulan', '库提叛乱救驾查亚纳加拉 1319', '满者伯夷（加查马达）', 'gen_gajah_mada', '叛军拉扬·库提', ''),
        ('city_teluowulan', '平定萨达恩立下帕拉帕誓言 1331', '满者伯夷（加查马达）', 'gen_gajah_mada', '萨达恩叛乱城邦', ''),
        ('city_sanfoqi', '海陆并举征服苏门答腊与巨港 1340', '满者伯夷（加查马达）', 'gen_gajah_mada', '末罗瑜王国', ''),
        ('city_teluowulan', '布巴特惨案伏击巽他王室 1357', '满者伯夷（加查马达）', 'gen_gajah_mada', '巽他王国（林加布阿纳）', ''),
        ('city_teluowulan', '南洋千岛一统大帝国鼎盛 1360', '满者伯夷（加查马达）', 'gen_gajah_mada', '群岛残敌', '')
    ],
    # ── Suryavarman I (rcam2 / coop22) ──
    'rcam2': [
        ('city_angkor', '击杀乌达雅迭耶拔摩夺取吴哥 1002', '高棉帝国（阇耶跋摩）', 'chenla_duyebamo', '吴哥守军（乌达雅迭耶）', ''),
        ('city_angkor', '消灭阇耶毗罗跋摩平定内乱 1010', '高棉帝国（阇耶跋摩）', 'chenla_duyebamo', '阇耶毗罗跋摩', ''),
        ('city_ayutthaya', '沿湄南河进军罗斛与骇黎朋猜 1012', '高棉帝国（阇耶跋摩）', 'chenla_duyebamo', '骇黎朋猜王国', ''),
        ('city_angkor', '抵御室利佛逝进犯保卫半岛 1015', '高棉帝国（阇耶跋摩）', 'chenla_duyebamo', '室利佛逝帝国', ''),
        ('city_angkor', '东征占婆王朝建立全盛吴哥 1020', '高棉帝国（阇耶跋摩）', 'chenla_duyebamo', '占婆王国', '')
    ],
    # ── Bayinnaung (rcam3) ──
    'rcam3': [
        ('city_bago', '德彬瑞蒂遇刺收复东吁祖城 1550', '东吁王朝（莽应龙）', 'hantawadi_mangyinglong', '斯弥绍突叛军', ''),
        ('city_bago', '攻克勃固消灭孟族叛逆 1551', '东吁王朝（莽应龙）', 'hantawadi_mangyinglong', '斯弥陶孟军', ''),
        ('city_ava', '北伐因瓦消灭掸族诸邦联军 1555', '东吁王朝（莽应龙）', 'hantawadi_mangyinglong', '因瓦王国（西图觉廷）', ''),
        ('city_ayutthaya', '白象战争围攻暹罗大城城 1564', '东吁王朝（莽应龙）', 'hantawadi_mangyinglong', '阿瑜陀耶王国（马哈·查克拉帕）', ''),
        ('city_ayutthaya', '征服澜沧消灭反抗称霸中南半岛 1569', '东吁王朝（莽应龙）', 'hantawadi_mangyinglong', '澜沧王国（塞塔提拉）', '')
    ],
    # ── Le Loi (rcam4) ──
    'rcam4': [
        ('city_xidu', '蓝山起义抗击大明交趾布政使司 1418', '大越（黎利）', 'leloi', '明朝（马骐/陈智）', ''),
        ('city_shenglong', '奇袭乂安建立南方解放区 1424', '大越（黎利）', 'leloi', '明朝（山寿）', ''),
        ('city_xidu', '围攻西都茶隆清化重镇 1425', '大越（黎利）', 'leloi', '明朝守军', ''),
        ('city_shenglong', '崒洞祝洞之役大败王通大军 1426', '大越（黎利）', 'leloi', '明朝（王通）', ''),
        ('city_shenglong', '支棱关斩杀柳升全歼明廷援军 1427', '大越（黎利）', 'leloi', '明朝（柳升）', ''),
        ('city_shenglong', '围攻东关城立下东关会誓 1428', '大越（黎利）', 'leloi', '明朝（王通）', '')
    ],
    # ── Edward Longshanks (wecam1) ──
    'wecam1': [
        ('city_geluosite', '伊夫舍姆战役诛杀西蒙·德·孟福尔 1265', '英格兰（长腿爱德华）', 'gen_edward_longshanks', '男爵叛军（西蒙·德·孟福尔）', ''),
        ('city_kanafeng', '征服威尔士修建铁环卡那封城堡 1277', '英格兰（长腿爱德华）', 'gen_edward_longshanks', '威尔士（卢埃林）', ''),
        ('city_carlisle', '邓巴之战废黜约翰·巴里奥 1296', '英格兰（长腿爱德华）', 'gen_edward_longshanks', '苏格兰王国', ''),
        ('city_scone', '福尔柯克之战大破华莱士长矛方阵 1298', '英格兰（长腿爱德华）', 'gen_edward_longshanks', '苏格兰起义军（华莱士）', 'gen_william_wallace'),
        ('city_scone', '围攻斯特灵城堡动用战狼巨投 1304', '英格兰（长腿爱德华）', 'gen_edward_longshanks', '苏格兰守军（威廉·奥利芬特）', '')
    ],
    # ── Dukes of the West (wecam2) ──
    'wecam2': [
        ('city_bruges', '鲁斯贝克之战镇压根特纺织叛乱 1382', '勃艮第（勇敢的菲利普）', '', '根特起义军（阿特维尔德）', ''),
        ('city_dijon', '围攻列日确立勃艮第主权 1408', '勃艮第（无畏的约翰）', 'gen_john_fearless', '列日叛民', ''),
        ('city_mengteluo', '皮卡第决战大败阿马尼亚克派 1419', '勃艮第（好人菲利普）', 'gen_philip_good', '阿马尼亚克派联军', ''),
        ('city_bulusaier', '吞并布拉班特整合低地诸邦 1430', '勃艮第（好人菲利普）', 'gen_philip_good', '低地诸侯联盟', ''),
        ('city_bruges', '格朗松与穆尔滕之战力战瑞士老兵 1476', '勃艮第（大胆查理）', 'bogendi_chali', '瑞士老同盟联邦', ''),
        ('city_dijon', '南锡之战大胆查理陨落 1477', '勃艮第（大胆查理）', 'bogendi_chali', '洛林公国与瑞士联邦', '')
    ],
    # ── Hautevilles (wecam3) ──
    'wecam3': [
        ('city_meierfei', '西维塔特战役大败教皇利奥九世联军 1053', '诺曼（罗伯特·吉斯卡尔）', '', '教皇国同盟军', ''),
        ('city_messina', '跨海远征西西里强渡墨西拿海峡 1061', '诺曼（罗杰）', 'gen_roger_i', '西西里埃米尔国', ''),
        ('city_palermo', '十年苦战围攻攻克巴勒莫 1072', '诺曼（罗杰）', 'gen_roger_i', '西西里萨拉森守军', ''),
        ('city_salonica', '都拉齐翁战役击破拜占庭阿莱克修斯一世 1081', '诺曼（罗伯特·吉斯卡尔）', '', '拜占庭帝国（阿莱克修斯一世）', ''),
        ('city_palermo', '加冕西西里国王开创诺曼两西西里盛世 1130', '诺曼（罗杰）', 'gen_roger_i', '南意大利封建叛军', '')
    ],
    # ── Attila the Hun (xcam1 / coop6) ──
    'xcam1': [
        ('city_saigede', '刺杀兄长布列达独掌匈人霸权 445', '匈人帝国（阿提拉）', 'xiongren_atila', '匈人布列达党羽', ''),
        ('city_aidiernei', '横扫色雷斯大破东罗马进逼君士坦丁堡 447', '匈人帝国（阿提拉）', 'xiongren_atila', '东罗马帝国军', ''),
        ('city_lansi', '席卷高卢围攻奥尔良与摧毁梅斯 451', '匈人帝国（阿提拉）', 'xiongren_atila', '西罗马与法兰克守军', ''),
        ('city_lansi', '沙隆战役世纪对决埃提乌斯与西哥特 451', '匈人帝国（阿提拉）', 'xiongren_atila', '罗马联军（埃提乌斯/狄奥多里克）', ''),
        ('city_milan', '突入意大利洗劫阿奎莱亚与平定米兰 452', '匈人帝国（阿提拉）', 'xiongren_atila', '西罗马帝国（瓦伦提尼安三世）', ''),
        ('city_luoma', '教皇良一世和谈与大军回撤匈牙利平原 452', '匈人帝国（阿提拉）', 'xiongren_atila', '罗马教廷', '')
    ],
    # ── El Cid (xcam2) ──
    'xcam2': [
        ('city_la_mota', '卡斯蒂利亚王位争夺高佩赫拉兄弟决战 1072', '卡斯蒂利亚（熙德）', 'gen_el_cid', '莱昂王国（阿方索六世）', 'gen_alfonso_vi'),
        ('city_toledo', '拯救萨拉戈萨埃米尔大破巴塞罗那伯爵 1081', '萨拉戈萨埃米尔国（熙德）', 'gen_el_cid', '巴塞罗那伯国', ''),
        ('city_zaragoza', '流亡埃布罗平原击退摩尔军阀 1083', '萨拉戈萨埃米尔国（熙德）', 'gen_el_cid', '莱里达穆塔米德', ''),
        ('city_valencia', '驱逐穆拉比特长驱围攻巴伦西亚 1094', '卡斯蒂利亚（熙德）', 'gen_el_cid', '穆拉比特王朝（优素福）', ''),
        ('city_valencia', '夸尔特之战大败北非援军守卫巴伦西亚 1094', '巴伦西亚（熙德）', 'gen_el_cid', '穆拉比特帝国大军', ''),
        ('city_valencia', '熙德遗体坐镇战马威震敌胆再退强寇 1099', '巴伦西亚（熙德）', 'gen_el_cid', '穆拉比特帝国大军', '')
    ],
    # ── Montezuma (xcam3) ──
    'xcam3': [
        ('city_tenochtitlan', '特斯科科湖畔荣冠战争臣服邻邦 1515', '阿兹特克帝国（库奥特莫克）', 'gen_cuauhtemoc', '特拉克斯卡拉联盟', ''),
        ('city_tenochtitlan', '征讨敌对特拉克斯卡拉城邦 1517', '阿兹特克帝国（库奥特莫克）', 'gen_cuauhtemoc', '特拉克斯卡拉联军', ''),
        ('city_tenochtitlan', '科尔特斯西班牙殖民者登陆海滨 1519', '阿兹特克帝国（库奥特莫克）', 'gen_cuauhtemoc', '西班牙征服军（科尔特斯）', 'gen_cortes'),
        ('city_tenochtitlan', '悲痛之夜阿兹特克绝地反击驱逐侵略者 1520', '阿兹特克帝国（库奥特莫克）', 'gen_cuauhtemoc', '西班牙征服军（科尔特斯）', 'gen_cortes'),
        ('city_tenochtitlan', '特斯科科湖反击战击沉西班牙双桅帆船 1521', '阿兹特克帝国（库奥特莫克）', 'gen_cuauhtemoc', '西班牙征服军（科尔特斯）', 'gen_cortes'),
        ('city_tenochtitlan', '特诺奇蒂特兰焦土浴血保卫战 1521', '阿兹特克帝国（库奥特莫克）', 'gen_cuauhtemoc', '西班牙与特拉克斯卡拉联军', 'gen_cortes')
    ],
    # ── Battles of the Conquerors (fcam7) ──
    'fcam7': [
        ('city_chambord', '图尔战役阻击倭马亚北上 732', '法兰克王国（查理·马特）', '', '倭马亚王朝（阿卜杜勒·拉赫曼）', ''),
        ('city_aidingbao', '文兰开拓史红衣艾立克横渡北大西洋 1000', '维京（红衣艾立克）', '', '美洲原住民斯克林人', ''),
        ('city_winchester', '黑斯廷斯战役诺曼征服英格兰 1066', '诺曼（征服者威廉）', '', '盎格鲁撒克逊（哈罗德二世）', ''),
        ('city_ani', '曼齐刻尔特战役击破拜占庭帝国 1071', '塞尔柱帝国（阿尔普·阿尔斯兰）', '', '拜占庭帝国（罗曼努斯四世）', ''),
        ('city_calais', '阿金库尔战役长弓兵神威 1415', '英格兰（亨利五世）', 'gen_henry_v', '法兰西骑士联军', ''),
        ('city_knossos', '勒班陀海战神圣同盟大破奥斯曼舰队 1571', '神圣同盟（唐·胡安）', '', '奥斯曼帝国（阿里帕夏）', ''),
        ('city_kyoto', '山崎战役羽柴秀吉讨灭明智光秀 1582', '羽柴军（羽柴秀吉）', 'gen_toyotomi_hideyoshi', '明智军（明智光秀）', 'gen_akechi_mitsuhide'),
        ('city_suncheon_k', '露梁海战中朝联军全歼日本海军 1598', '朝明水师（李舜臣/邓子龙）', '', '日本海军（岛津义弘）', 'japan_shimazu_yoshihiro'),
        ('city_bukhara', '布哈拉战役萨珊波斯与西突厥夹攻白匈奴 557', '萨珊波斯（霍斯劳一世）', '', '白匈奴帝国', ''),
        ('city_tikal', '道斯皮拉斯围城战蒂卡尔对决卡拉克穆尔 648', '道斯皮拉斯（巴拉吉·坎·卡维尔）', '', '卡拉克穆尔城邦', ''),
        ('city_york', '异教徒大军入侵攻陷约克 865', '维京大军（无骨者伊瓦尔）', '', '诺森布里亚王国', ''),
        ('city_budapeisi', '马扎尔人定居喀尔巴阡盆地 895', '马扎尔部落联盟（阿尔帕德）', '', '保加尔与东法兰克军', ''),
        ('city_jianghu', '俱利伽罗之战火牛阵大破平维盛 1183', '源氏军（源义仲）', 'gen_minamoto_yoshitomo', '平家军（平维盛）', 'japan_taira_shigemori'),
        ('city_nikexiya', '塞浦路斯战役狮心理查征服尼科西亚 1191', '英格兰（狮心理查）', '', '塞浦路斯（伊萨克·科穆宁）', ''),
        ('city_buersa', '巴菲乌斯战役奥斯曼初露锋芒 1302', '奥斯曼侯国（奥斯曼一世）', '', '拜占庭帝国军队', ''),
        ('city_raozhou', '鄱阳湖水战朱元璋决战陈友谅 1363', '大明（朱元璋）', 'ming_zhu_yuanzhang', '大汉（陈友谅）', 'gen_chen_youliang')
    ],
    # ── Special Event Maps (dcam0 & 0_E3) ──
    '0_E3_Scenario': [
        ('city_tenochtitlan', 'E3经典阿兹特克雄鹰战士围攻战', '侵攻联军', '', '阿兹特克帝国（库奥特莫克）', 'gen_cuauhtemoc')
    ],
    'dcam0': [
        ('city_qudiaoalan', '六月事件特别场景：速不台草原平叛', '大蒙古国（速不台）', 'da_yuan_subutai', '库曼部族联军', ''),
        ('city_yachen', '九月事件特别场景：巴巴罗萨诸侯合围', '神圣罗马帝国（巴巴罗萨）', 'gen_barbarossa', '德意志敌对诸侯', ''),
        ('city_karakorum', '蒙古突骑狂潮野战要塞', '大蒙古国突骑（成吉思汗）', 'menggu_d_chengjisihan', '守城驻军', ''),
        ('city_junshitandingbao', '攻城战示范：奥斯曼围攻君士坦丁堡 1453', '奥斯曼帝国（穆罕默德二世）', 'gen_mehmed_ii', '拜占庭帝国（君士坦丁十一世）', '')
    ]
}

COOP_TO_SINGLE = {
    'coop17': 'acam1',
    'coop3': 'cam3',
    'coop6': 'xcam1',
    'coop9': 'fcam5',
    'coop10': 'fcam1',
    'coop22': 'rcam2',
    'coop25': 'kcam1',
}

def generate_all():
    results = []
    
    for item in de_meta:
        sid = item['id']
        c = item['campaign']
        lvl = item['level']
        
        rule_c = COOP_TO_SINGLE.get(c, c)
        c_list = CAMPAIGN_RULES.get(rule_c, [])
        idx = lvl - 1
        
        if idx < len(c_list):
            cid, hist, atk, atkid, dfn, dfnid = c_list[idx]
        else:
            cid = 'city_bali'
            hist = ''
            atk = ''
            atkid = ''
            dfn = ''
            dfnid = ''
            
        city_info = city_by_id.get(cid, {})
        real_cname = city_info.get('name', '未定')
        real_type = type_zh_map.get(city_info.get('type'), '中城')
        
        old = old_sites.get(sid, {})
        size = old.get('size', 144)
        
        results.append({
            'id': sid,
            'scenario': item['scenario_file'].replace('.aoe2scenario', ''),
            'name': real_cname,
            'cityId': cid,
            'type': real_type,
            'basis': 'DE官方剧情+史实',
            'history': hist,
            'size': size,
            'attacker': atk,
            'attackerId': atkid,
            'defender': dfn,
            'defenderId': dfnid
        })
        
    print(f"Generated {len(results)} verified site mappings.")
    out_path = Path("public/de-maps/campaign/site_names.json")
    out_path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"Successfully saved to {out_path}!")

if __name__ == '__main__':
    generate_all()
