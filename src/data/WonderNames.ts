/**
 * DE 奇观/场景建筑素材目录 -> 官方中文名（用于战略地图奇观 marker 的显示名）。
 * [2026-08-27 历史审计] 逐条对照 fandom 官方 Wiki 与 DE 语言包定稿，
 *   替换掉此前 LLM 编造的错名（如「奈良东大寺/满月台/兹瓦尔特诺茨」等）。
 */

export const WONDER_NAME: Record<string, string> = {
    // ── 亚洲（含三国 DLC） ──
    'ASIA_WONDER_CHINESE': '天坛祈年殿',
    'ASIA_WONDER_WEI': '嵩岳寺塔',
    'ASIA_WONDER_WU': '静安寺',
    'ASIA_WONDER_SHU': '成都武侯祠',
    'ASIA_WONDER_JURCHENS': '银山塔林',
    'ASIA_WONDER_KHITANS': '佛宫寺释迦塔',
    'ASIA_WONDER_KOREANS': '皇龙寺九层木塔',
    'ASIA_WONDER_JAPANESE': '东大寺大佛殿',
    'ASIA_WONDER_MONGOLS': '成吉思汗巨型金帐',
    'ASIA_WONDER_VIETNAMESE': '笔塔寺',
    // ── 地中海 ──
    'MEDI_WONDER_BYZANTINES': '圣索菲亚大教堂',
    'MEDI_WONDER_ITALIANS': '热那亚大教堂',
    'MEDI_WONDER_PORTUGUESE': '贝伦塔',
    'MEDI_WONDER_SICILIANS': '蒙雷阿莱主教座堂',
    'MEDI_WONDER_SPANISH': '塞维利亚黄金塔',
    'MEDI_WONDER_ARMENIANS': '埃奇米阿津主教座堂',
    'MEDI_WONDER_GEORGIANS': '生命之柱大教堂',
    // ── 西欧 ──
    'WEST_WONDER_FRANKS': '沙特尔圣母主教座堂',
    'WEST_WONDER_BRITONS': '奇切斯特大教堂',
    'SCEN_WONDER_BRITONS': '温彻斯特大教堂',
    'WEST_WONDER_BURGUNDIANS': '布鲁塞尔市政厅',
    'WEST_WONDER_CELTS': '卡舍尔之石',
    // ── 东欧/日耳曼 ──
    'EAST_WONDER_TEUTONS': '玛丽亚拉赫修道院',
    'EAST_WONDER_GOTHS': '狄奥多里克陵墓',
    'EAST_WONDER_HUNS': '君士坦丁凯旋门',
    'EAST_WONDER_VIKINGS': '博尔贡木板教堂',
    // ── 希腊（编年史 DLC） ──
    'GREEK_WONDER_ATHENIANS': '帕特农神庙',
    'GREEK_WONDER_SPARTANS': '阿尔忒弥斯神庙',
    'GREEK_WONDER_MACEDONIANS': '韦尔吉纳王陵',
    'THRACIAN_WONDER_THRACIANS': '斯韦什塔里色雷斯古墓',
    // ── 中东 ──
    'ORIE_WONDER_SARACENS': '萨迈拉大清真寺螺旋塔',
    'ORIE_WONDER_TURKS': '塞利米耶清真寺',
    'ORIE_WONDER_PERSIANS': '泰西封巨拱',
    'ORIE_WONDER_BERBERS': '哈桑塔',
    'PERSIAN_WONDER_ACHAEMENIDS': '阿帕达纳宫',
    // ── 草原 ──
    'CEAS_WONDER_CUMANS': '萨尔克尔要塞',
    'CEAS_WONDER_TATARS': '乌鲁格别克天文台',
    // ── 斯拉夫 ──
    'SLAV_WONDER_SLAVS': '基日岛波戈斯特木教堂',
    'SCEN_WONDER_SLAVS': '诺夫哥罗德木教堂',
    'SLAV_WONDER_POLES': '瓦维尔主教座堂',
    'SLAV_WONDER_BOHEMIANS': '布拉格火药塔',
    'SLAV_WONDER_MAGYARS': '科文城堡',
    'SLAV_WONDER_BULGARIANS': '普雷斯拉夫圆顶金教堂',
    'SLAV_WONDER_LITHUANIANS': '特拉凯城堡',
    // ── 印度 ──
    'INDI_WONDER_INDIANS': '布里哈迪斯瓦拉神庙',
    'INDI_WONDER_HINDUSTANIS': '胡马雍陵',
    'INDI_WONDER_BENGALIS': '索马普拉大寺',
    'INDI_WONDER_GURJARAS': '索姆纳特神庙',
    'PURU_WONDER_PURU': '布里哈迪斯瓦拉神庙',
    // ── 东南亚 ──
    'SEAS_WONDER_KHMER': '吴哥窟中央大殿',
    'SEAS_WONDER_BURMESE': '瑞西贡佛塔',
    'SEAS_WONDER_MALAY': '卡拉桑神庙',
    // ── 非洲 ──
    'AFRI_WONDER_ETHIOPIANS': '阿曼努尔岩石教堂',
    'AFRI_WONDER_MALIANS': '杰内大清真寺',
    // ── 美洲 ──
    'MESO_WONDER_AZTECS': '特诺奇蒂特兰大神庙',
    'MESO_WONDER_INCAS': '马丘比丘拴日石',
    'MESO_WONDER_MAYANS': '蒂卡尔一号金字塔',
    'ANDE_WONDER_MAPUCHE': '马普切长屋图腾柱',
    'ANDE_WONDER_MUISCA': '苏加穆西太阳神殿',
    'ANDE_WONDER_TUPI': '伊瓜苏瀑布长屋',
    // ── 场景地标 ──
    'SCEN_COLOSSEUM': '罗马斗兽场',
    'SCEN_DOME_OF_THE_ROCK': '圆顶清真寺',
    'SCEN_AACHEN_CATHEDRAL': '亚琛大教堂',
    'SCEN_SANKORE_MADRASAH': '桑科雷清真学堂',
    'SCEN_HALL_OF_HEROES': '凌烟阁',
};
