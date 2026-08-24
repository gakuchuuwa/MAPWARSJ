/** 名城 -> 世界奇观（DE 奇观素材，只用于战术模式 zoom13 攻城战守方城中央地标）。
 *  2026-08-24 定稿 35 个（第一阶段有对应据点的奇观；缺失的 23 个待补文化/据点后添加）。
 *  来源: DE resources/_common/drs/graphics b_*_wonder_*_x1.sld，提取到 public/SUCAI_BUILDING/。
 *  🔴 key = 守方据点 cityId（Scene13War init.defenderCityId），value = SUCAI_BUILDING 素材目录名，
 *     经 BUILDING: 前缀加载 preview.png 单帧（纯视觉地标，无碰撞）。 */
export const CITY_WONDER: Record<string, string> = {
    'city_aerjier': 'ORIE_WONDER_BERBERS',  // 阿尔及尔
    'city_ailiwen': 'MEDI_WONDER_ARMENIANS',  // 埃里温
    'city_angkor': 'SEAS_WONDER_KHMER',  // 吴哥
    'city_bali': 'WEST_WONDER_FRANKS',  // 巴黎
    'city_bosibolisi': 'PERSIAN_WONDER_ACHAEMENIDS',  // 波斯波利斯
    'city_budapeisi': 'SLAV_WONDER_MAGYARS',  // 布达佩斯
    'city_bulage': 'SLAV_WONDER_BOHEMIANS',  // 布拉格
    'city_changan': 'ASIA_WONDER_CHINESE',  // 长安
    'city_chengdu': 'ASIA_WONDER_SHU',  // 成都
    'city_damasikusi': 'ORIE_WONDER_SARACENS',  // 大马士革
    'city_deli': 'INDI_WONDER_HINDUSTANIS',  // 德里
    'city_dibilisi': 'MEDI_WONDER_GEORGIANS',  // 第比利斯
    'city_dijon': 'WEST_WONDER_BURGUNDIANS',  // 第戎
    'city_huashicheng': 'INDI_WONDER_INDIANS',  // 华氏城
    'city_huining': 'ASIA_WONDER_JURCHENS',  // 会宁府
    'city_jifu': 'SLAV_WONDER_SLAVS',  // 基辅
    'city_junshitandingbao': 'MEDI_WONDER_BYZANTINES',  // 君士坦丁堡
    'city_kaesong': 'ASIA_WONDER_KOREANS',  // 开城
    'city_karakorum': 'ASIA_WONDER_MONGOLS',  // 哈拉和林
    'city_kashan': 'CEAS_WONDER_TATARS',  // 喀山
    'city_kelakefu': 'SLAV_WONDER_POLES',  // 克拉科夫
    'city_kyoto': 'ASIA_WONDER_JAPANESE',  // 京都
    'city_linhuang': 'ASIA_WONDER_KHITANS',  // 临潢府
    'city_lisiben': 'MEDI_WONDER_PORTUGUESE',  // 里斯本
    'city_lundun': 'WEST_WONDER_BRITONS',  // 伦敦
    'city_nanjing': 'ASIA_WONDER_WU',  // 金陵
    'city_pagan': 'SEAS_WONDER_BURMESE',  // 蒲甘
    'city_palermo': 'MEDI_WONDER_SICILIANS',  // 巴勒莫
    'city_sparta': 'GREEK_WONDER_SPARTANS',  // 斯巴达
    'city_toledo': 'MEDI_WONDER_SPANISH',  // 托莱多
    'city_venice': 'MEDI_WONDER_ITALIANS',  // 威尼斯
    'city_weierniwusi': 'SLAV_WONDER_LITHUANIANS',  // 维尔纽斯
    'city_wupusala': 'EAST_WONDER_VIKINGS',  // 乌普萨拉
    'city_yadian': 'GREEK_WONDER_ATHENIANS',  // 雅典
    'city_yisifahan': 'ORIE_WONDER_PERSIANS',  // 伊斯法罕
    // [2026-08-24 主人勘误] 用古称/异名复查后，7 个"缺失"文明其实早有据点，直接挂奇观：
    'city_handan': 'ASIA_WONDER_WEI',  // 邯郸（邺城在邯郸临漳，代表曹魏核心）
    'city_toumancheng': 'EAST_WONDER_HUNS',  // 头曼城（匈奴）
    'city_yikeniwumu': 'ORIE_WONDER_TURKS',  // 伊科尼乌姆（罗姆苏丹，今科尼亚）
    'city_salai': 'CEAS_WONDER_CUMANS',  // 萨莱（金帐汗国都城，库曼/钦察）
    'city_sofia': 'SLAV_WONDER_BULGARIANS',  // 索非亚（塞尔迪卡，保加尔）
    'city_kenisibao': 'EAST_WONDER_TEUTONS',  // 柯尼斯堡（条顿骑士团）
    'city_milan': 'WEST_WONDER_CELTS',  // 米兰（米迪奥拉努姆，凯尔特核心）
};
