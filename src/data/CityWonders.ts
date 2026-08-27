/** 城内奇观：名城 -> DE 奇观（用于战略城市与战术模式 zoom13 的城市地标）。
 *  映射以建筑和据点的实际关联为先，不为追求素材零闲置而强行错配。
 *     `npx tsx tools/audit-wonder-coverage.mts` 校验。
 *  2026-08-24 全部 42 条按历史逐条核查后定稿 40 条（撤 6 / 加 4）：
 *    - 撤：长安(天坛应北京)、邯郸(魏都应洛阳)、伊斯法罕(萨法维晚，波斯无泰西封撤)、
 *          萨莱(金帐蒙古系≠库曼)、阿尔及尔(柏柏尔奇观=凯鲁万大清真寺)、米兰(凯尔特核心=爱尔兰都柏林)
 *    - 加：北京(天坛)、洛阳(曹魏都)、凯鲁万(柏柏尔)、都柏林(凯尔特/盖尔)
 *  来源: DE resources/_common/drs/graphics b_*_wonder_*_x1.sld，提取到 public/SUCAI_BUILDING/。
 *  🔴 key = 守方据点 cityId（Scene13War init.defenderCityId），value = SUCAI_BUILDING 素材目录名，
 *     经 BUILDING: 前缀加载 preview.png 单帧（纯视觉地标，无碰撞）。 */
export const CITY_WONDER: Record<string, string> = {
    'city_ailiwen': 'MEDI_WONDER_ARMENIANS',  // 埃里温（亚美尼亚；古都阿尼项目无，保留）
    'city_angkor': 'SEAS_WONDER_KHMER',  // 吴哥（高棉吴哥窟）
    'city_bali': 'WEST_WONDER_FRANKS',  // 巴黎（法兰克）
    'city_beijing': 'ASIA_WONDER_CHINESE',  // 北京（明清，天坛）
    'city_changan': 'SCEN_HALL_OF_HEROES',  // 长安（唐，凌烟阁二十四功臣画像阁）
    'city_bosibolisi': 'PERSIAN_WONDER_ACHAEMENIDS',  // 波斯波利斯（阿契美尼德）
    'city_budapeisi': 'SLAV_WONDER_MAGYARS',  // 布达佩斯（马扎尔）
    'city_bulage': 'SLAV_WONDER_BOHEMIANS',  // 布拉格（波西米亚）
    'city_chengdu': 'ASIA_WONDER_SHU',  // 成都（蜀汉）
    'city_damasikusi': 'ORIE_WONDER_SARACENS',  // 大马士革（倭马亚）
    'city_deli': 'INDI_WONDER_HINDUSTANIS',  // 德里（德里苏丹国）
    'city_dibilisi': 'MEDI_WONDER_GEORGIANS',  // 第比利斯（格鲁吉亚）
    'city_dijon': 'WEST_WONDER_BURGUNDIANS',  // 第戎（勃艮第）
    'city_dublin': 'WEST_WONDER_CELTS',  // 都柏林（盖尔/凯尔特核心）
    'city_heersongniesi': 'EAST_WONDER_GOTHS',  // 赫尔松涅斯（克里米亚哥特/陶里卡）
    'city_huashicheng': 'INDI_WONDER_INDIANS',  // 华氏城（孔雀帝国）
    'city_huining': 'ASIA_WONDER_JURCHENS',  // 会宁府（金上京，女真）
    'city_jifu': 'SLAV_WONDER_SLAVS',  // 基辅（罗斯）
    'city_junshitandingbao': 'MEDI_WONDER_BYZANTINES',  // 君士坦丁堡（拜占庭）
    'city_kaesong': 'ASIA_WONDER_KOREANS',  // 开城（高丽）
    'city_kailuwan': 'ORIE_WONDER_BERBERS',  // 凯鲁万（柏柏尔·卡劳亚大清真寺）
    'city_karakorum': 'ASIA_WONDER_MONGOLS',  // 哈拉和林（蒙古）
    'city_kashan': 'CEAS_WONDER_TATARS',  // 喀山（鞑靼/喀山汗国，势力标保加尔为前身）
    'city_kelakefu': 'SLAV_WONDER_POLES',  // 克拉科夫（波兰）
    'city_kenisibao': 'EAST_WONDER_TEUTONS',  // 柯尼斯堡（条顿骑士团）
    'city_kyoto': 'ASIA_WONDER_JAPANESE',  // 京都（日本）
    'city_linhuang': 'ASIA_WONDER_KHITANS',  // 临潢府（辽上京，契丹）
    'city_lisiben': 'MEDI_WONDER_PORTUGUESE',  // 里斯本（葡萄牙）
    'city_luoyang': 'ASIA_WONDER_WEI',  // 洛阳（曹魏）
    'city_lundun': 'WEST_WONDER_BRITONS',  // 伦敦（不列颠）
    'city_nanjing': 'ASIA_WONDER_WU',  // 金陵（孙吴）
    'city_pagan': 'SEAS_WONDER_BURMESE',  // 蒲甘（缅甸）
    'city_palermo': 'MEDI_WONDER_SICILIANS',  // 巴勒莫（西西里）
    'city_shenglong': 'ASIA_WONDER_VIETNAMESE',  // 昇龙（大越治所；越南）
    'city_sparta': 'GREEK_WONDER_SPARTANS',  // 斯巴达
    'city_sofia': 'SLAV_WONDER_BULGARIANS',  // 索非亚（塞尔迪卡，保加尔）
    'city_toledo': 'MEDI_WONDER_SPANISH',  // 托莱多（西班牙/卡斯蒂利亚）
    'city_saigede': 'EAST_WONDER_HUNS',  // 塞格德（匈人帝国大本营·阿提拉王庭）
    'city_luoma': 'SCEN_COLOSSEUM',  // 罗马城（罗马斗兽场·弗拉维圆形剧场）
    'city_genoa': 'MEDI_WONDER_ITALIANS',  // 热那亚（意大利·圣洛伦佐大教堂）
    'city_weierniwusi': 'SLAV_WONDER_LITHUANIANS',  // 维尔纽斯（立陶宛）
    'city_yadian': 'GREEK_WONDER_ATHENIANS',  // 雅典
    'city_yachen': 'SCEN_AACHEN_CATHEDRAL',  // 亚琛（亚琛大教堂）
    'city_yelusaleng': 'SCEN_DOME_OF_THE_ROCK',  // 耶路撒冷（圆顶清真寺）
    'city_yikeniwumu': 'ORIE_WONDER_TURKS',  // 伊科尼乌姆（罗姆苏丹，突厥）
    // [2026-08-24 新增 10 城 + 孟加拉挂已有高达城]
    'city_tenochtitlan': 'MESO_WONDER_AZTECS',  // 特诺奇提特兰（阿兹特克）
    'city_cusco': 'MESO_WONDER_INCAS',  // 库斯科（印加）
    'city_tikal': 'MESO_WONDER_MAYANS',  // 蒂卡尔（玛雅）
    'city_tucapel': 'ANDE_WONDER_MAPUCHE',  // 图卡佩尔（马普切）
    'city_bacata': 'ANDE_WONDER_MUISCA',  // 巴卡塔（穆伊斯卡）
    'city_guanabara': 'ANDE_WONDER_TUPI',  // 瓜纳巴拉（图皮）
    'city_timbuktu': 'SCEN_SANKORE_MADRASAH',  // 廷巴克图（桑科雷经学院）
    'city_aksum': 'AFRI_WONDER_ETHIOPIANS',  // 阿克苏姆（埃塞俄比亚）
    'city_malacca': 'SEAS_WONDER_MALAY',  // 马六甲（马来/满剌加）
    'city_patan': 'INDI_WONDER_GURJARAS',  // 帕坦（瞿折罗/古吉拉特）
    'city_gaodacheng': 'INDI_WONDER_BENGALIS',  // 高达城（孟加拉，已有据点）
    // ── [2026-08-26 主人「不要闲置，能安置的都按事实安置上」] 补齐最后 7 座 ──
    'city_salonica': 'GREEK_WONDER_MACEDONIANS',  // 萨洛尼卡（塞萨洛尼基；据点 factionId 正是 maqidun 马其顿）
    'city_plovdiv': 'THRACIAN_WONDER_THRACIANS',  // 普罗夫迪夫（菲利普波利斯；据点 factionId 正是 seleisi 色雷斯）
    // 🔴 波斯奇迹 = 泰西封的萨珊拱门 Taq Kasra，项目无泰西封。
    //    2026-08-24 曾配伊斯法罕又撤掉（萨法维时代太晚），**别再配回伊斯法罕**。
    //    菲鲁扎巴德是萨珊**开国都城**（阿尔达希尔建），阿尔达希尔宫的圆顶拱券与 Taq Kasra 同源，
    //    且据点 factionId 就是 sashan —— 这才是本朝本都。
    'city_feiluzhabade': 'ORIE_WONDER_PERSIANS',  // 菲鲁扎巴德（萨珊开国都）
    // 🔴 2026-08-24 曾配萨莱又撤掉（金帐汗国是蒙古系，不是库曼），**别再配回萨莱**。
    //    萨拉托夫的 factionId 就是 qincha（钦察=库曼），伏尔加草原正是库曼本部。
    'city_salatuofu': 'CEAS_WONDER_CUMANS',  // 萨拉托夫（钦察/库曼本部）
    // SCEN_ 版与 WEST_/SLAV_ 版是**不同建筑**（preview.png md5 与体积均不同，已核），
    // 所以同一文明的两版各配一城，不算重复。
    'city_winchester': 'SCEN_WONDER_BRITONS',  // 温彻斯特（韦塞克斯/盎撒英格兰旧都；伦敦已配 WEST 版）
    'city_nuofugeerdede': 'SCEN_WONDER_SLAVS',  // 诺夫哥罗德（罗斯北方中心；基辅已配 SLAV 版）
    // PURU 的**奇迹**是南亚圆顶塔神庙（柱廊+环水，看过 preview.png），与 PURU 城堡那张西欧石堡
    // 完全两种风格 —— 这个前缀的素材是混杂的，别按前缀想当然。坦贾武尔是朱罗王朝
    // 布里哈迪希瓦拉神庙所在地，形制与图高度吻合。
    'city_tanjiawuer': 'PURU_WONDER_PURU',  // 坦贾武尔（朱罗神庙）
};
