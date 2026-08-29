/** 城内奇观：名城 -> DE 奇观（用于战略城市与战术模式 zoom13 的城市地标）。
 *  映射以建筑和据点的实际关联为先，不为追求素材零闲置而强行错配。
 *     `npx tsx tools/audit-wonder-coverage.mts` 校验。
 *  2026-08-24 全部 42 条按历史逐条核查后定稿 40 条（撤 6 / 加 4）：
 *    - 撤：长安(天坛应北京)、邯郸(魏都应洛阳)、伊斯法罕(萨法维晚，波斯无泰西封撤)、
 *          萨莱(金帐蒙古系≠库曼)、阿尔及尔(柏柏尔奇观=凯鲁万大清真寺)、米兰(凯尔特核心=爱尔兰都柏林)
 *    - 加：北京(天坛)、洛阳(曹魏都)、凯鲁万(柏柏尔)、都柏林(凯尔特/盖尔)
 *  来源: DE resources/_common/drs/graphics b_*_wonder_*_x1.sld，提取到 public/SUCAI_BUILDING/。
 *  🔴 key = 守方据点 cityId（Scene13War init.defenderCityId），value = SUCAI_BUILDING 素材目录名，
 *     经 BUILDING: 前缀加载 preview.png 单帧（纯视觉地标，无碰撞）。
 *
 *  🔴 2026-08-28 三条防误改血训（主人定）：
 *    1. 匈人「凯旋门废墟」是独立虚构奇观表现，不等于罗马的君士坦丁凯旋门；必须留在塞格德，不得移到罗马。
 *    2. 希腊底比斯「斯芬克斯雕像」是俄狄浦斯神话对象，不等于埃及吉萨狮身人面像；不得改名、改挂孟菲斯或搬到吉萨。
 *    3. 蒙古「成吉思汗巨型金帐」是移动大帐，必须跟随成吉思汗所属据点哈拉和林；不得擅自钉在阿瓦尔嘎等推测地点。
 *    总则：不确定的奇观身份、坐标或挂靠不得猜测、不得按外形强认现实建筑；先保留现状并查证，证据不足不改。 */
export const CITY_WONDER: Record<string, string> = {
    'city_ailiwen': 'MEDI_WONDER_ARMENIANS',  // 埃里温（亚美尼亚；古都阿尼项目无，保留）
    'city_angkor': 'SEAS_WONDER_KHMER',  // 吴哥（高棉吴哥窟）
    'city_shatteer': 'WEST_WONDER_FRANKS',  // 沙特尔（卡尔努特，沙特尔圣母主教座堂）
    'city_beijing': 'ASIA_WONDER_CHINESE',  // 北京（明清，天坛）
    'city_changan': 'SCEN_HALL_OF_HEROES',  // 长安（唐，凌烟阁二十四功臣画像阁）
    'city_bosibolisi': 'PERSIAN_WONDER_ACHAEMENIDS',  // 波斯波利斯（阿契美尼德）
    'city_huneiduolala': 'SLAV_WONDER_MAGYARS',  // 胡内多阿拉（马扎尔，科文城堡）
    'city_bulage': 'SLAV_WONDER_BOHEMIANS',  // 布拉格（波西米亚）
    'city_chengdu': 'ASIA_WONDER_SHU',  // 成都（蜀汉）
    'city_samaila': 'ORIE_WONDER_SARACENS',  // 萨迈拉（阿拔斯第二都，螺旋塔）
    'city_deli': 'INDI_WONDER_HINDUSTANIS',  // 德里（德里苏丹国）
    'city_dibilisi': 'MEDI_WONDER_GEORGIANS',  // 第比利斯（格鲁吉亚）
    'city_bulusaier': 'WEST_WONDER_BURGUNDIANS',  // 布鲁塞尔（布拉班特公国，市政厅）
    'city_kasheer': 'WEST_WONDER_CELTS',  // 卡舍尔（芒斯特王国传统首都，卡舍尔之石）
    'city_ravenna': 'EAST_WONDER_GOTHS',  // 拉文纳（东哥特都城，狄奥多里克陵墓所在地）
    'city_tanjiawuer': 'INDI_WONDER_INDIANS',  // 坦贾武尔（布里哈迪斯瓦拉神庙所在地）
    'city_jiridao': 'SLAV_WONDER_SLAVS',  // 基日岛（卡累利阿，波戈斯特木教堂）
    'city_junshitandingbao': 'MEDI_WONDER_BYZANTINES',  // 君士坦丁堡（拜占庭）
    'city_jincheng_silla': 'ASIA_WONDER_KOREANS',  // 金城（庆州，皇龙寺九层木塔所在地）
    'city_labate': 'ORIE_WONDER_BERBERS',  // 拉巴特（穆瓦希德·哈桑塔）
    'city_karakorum': 'ASIA_WONDER_MONGOLS',  // 🔴移动大帐随成吉思汗据点；禁止另设阿瓦尔嘎固定坐标
    'city_samaerhan': 'CEAS_WONDER_TATARS',  // 撒马尔罕（乌鲁格别克天文台所在地）
    'city_kelakefu': 'SLAV_WONDER_POLES',  // 克拉科夫（波兰）
    'city_lahexiuyuan': 'EAST_WONDER_TEUTONS',
    'city_kyoto': 'ASIA_WONDER_JAPANESE',  // 京都（日本）
    'city_zhangguojuncheng': 'ASIA_WONDER_KHITANS',  // 彰国军城（应州，佛宫寺释迦塔所在地）
    'city_lisiben': 'MEDI_WONDER_PORTUGUESE',  // 里斯本（葡萄牙）
    'city_luoyang': 'ASIA_WONDER_WEI',  // 洛阳（曹魏）
    'city_shanghai': 'ASIA_WONDER_WU',  // 上海（静安寺所在地）
    'city_pagan': 'SEAS_WONDER_BURMESE',  // 蒲甘（缅甸）
    'city_palermo': 'MEDI_WONDER_SICILIANS',  // 巴勒莫（西西里）
    'city_shenglong': 'ASIA_WONDER_VIETNAMESE',  // 昇龙（大越治所；越南）
    'city_sparta': 'GREEK_WONDER_SPARTANS',  // 斯巴达
    'city_puleisilafu': 'SLAV_WONDER_BULGARIANS',  // 普雷斯拉夫（第一保加利亚帝国·圆形金教堂）
    'city_seville': 'MEDI_WONDER_SPANISH',  // 塞维利亚（黄金塔所在地）
    'city_saigede': 'EAST_WONDER_HUNS',  // 🔴虚构凯旋门废墟≠罗马君士坦丁凯旋门；位置禁止改动
    'city_luoma': 'SCEN_COLOSSEUM',  // 罗马城（罗马斗兽场·弗拉维圆形剧场）
    'city_genoa': 'MEDI_WONDER_ITALIANS',  // 热那亚（意大利·圣洛伦佐大教堂）
    'city_weierniwusi': 'SLAV_WONDER_LITHUANIANS',  // 维尔纽斯（立陶宛）
    'city_yadian': 'GREEK_WONDER_ATHENIANS',  // 雅典
    'city_yachen': 'SCEN_AACHEN_CATHEDRAL',  // 亚琛（亚琛大教堂）
    'city_yelusaleng': 'SCEN_DOME_OF_THE_ROCK',  // 耶路撒冷（圆顶清真寺）
    'city_aidiernei': 'ORIE_WONDER_TURKS',  // 埃迪尔内（奥斯曼·塞利米耶清真寺）
    // [2026-08-24 新增 10 城 + 孟加拉挂已有高达城]
    'city_tenochtitlan': 'MESO_WONDER_AZTECS',  // 特诺奇提特兰（阿兹特克）
    'city_cusco': 'MESO_WONDER_INCAS',  // 库斯科（印加）
    'city_tikal': 'MESO_WONDER_MAYANS',  // 蒂卡尔（玛雅）
    'city_tucapel': 'ANDE_WONDER_MAPUCHE',  // 图卡佩尔（马普切）
    'city_suojiamosuo': 'ANDE_WONDER_MUISCA',  // 索加莫索（穆伊斯卡·太阳神庙）
    'city_yiguasu': 'ANDE_WONDER_TUPI',  // 伊瓜苏（图皮—瓜拉尼·伊瓜苏瀑布）
    'city_timbuktu': 'SCEN_SANKORE_MADRASAH',  // 廷巴克图（桑科雷经学院）
    'city_lalibeila': 'AFRI_WONDER_ETHIOPIANS',  // 拉利贝拉（贝特·阿曼努埃尔岩石教堂）
    'city_kalasan': 'SEAS_WONDER_MALAY',  // 卡拉桑（爪哇日惹·马打蓝/赛伦德拉）
    'city_suomunate': 'INDI_WONDER_GURJARAS',  // 索姆纳特（印度教十二光辉林伽之首）
    'city_suomapuli': 'INDI_WONDER_BENGALIS',  // 索玛普利（孟加拉·索马普拉大寺）
    // ── [2026-08-26 主人「不要闲置，能安置的都按事实安置上」] 补齐最后 7 座 ──
    'city_salonica': 'GREEK_WONDER_MACEDONIANS',  // 佩拉（据点 factionId 为 maqidun 马其顿）
    'city_plovdiv': 'THRACIAN_WONDER_THRACIANS',  // 普罗夫迪夫（菲利普波利斯；据点 factionId 正是 seleisi 色雷斯）
    // 🔴 波斯奇迹 = 泰西封的萨珊拱门 Taq Kasra，项目无泰西封。
    //    2026-08-24 曾配伊斯法罕又撤掉（萨法维时代太晚），**别再配回伊斯法罕**。
    //    菲鲁扎巴德是萨珊**开国都城**（阿尔达希尔建），阿尔达希尔宫的圆顶拱券与 Taq Kasra 同源，
    //    且据点 factionId 就是 sashan —— 这才是本朝本都。
    'city_bageda': 'ORIE_WONDER_PERSIANS',  // 巴格达（现有据点中距泰西封最近，且同属两河核心区）
    // 🔴 2026-08-24 曾配萨莱又撤掉（金帐汗国是蒙古系，不是库曼），**别再配回萨莱**。
    //    萨拉托夫的 factionId 就是 qincha（钦察=库曼），伏尔加草原正是库曼本部。
    'city_saerkeer': 'CEAS_WONDER_CUMANS',  // 萨尔克尔（可萨·顿河白色堡垒）
    // SCEN_ 版与 WEST_/SLAV_ 版是**不同建筑**（preview.png md5 与体积均不同，已核），
    // 所以同一文明的两版各配一城，不算重复。
    'city_winchester': 'SCEN_WONDER_BRITONS',  // 温彻斯特（韦塞克斯/盎撒英格兰旧都；伦敦已配 WEST 版）
    'city_nuofugeerdede': 'SCEN_WONDER_SLAVS',  // 诺夫哥罗德（罗斯北方中心；基辅已配 SLAV 版）
    // PURU 的**奇迹**是南亚圆顶塔神庙（柱廊+环水，看过 preview.png），与 PURU 城堡那张西欧石堡
    // 完全两种风格 —— 这个前缀的素材是混杂的，别按前缀想当然。坦贾武尔是朱罗王朝
    // 布里哈迪希瓦拉神庙所在地，形制与图高度吻合。
    'city_patan': 'PURU_WONDER_PURU',  // 帕坦（现有据点中距莫德拉最近，同属古吉拉特）
    // ── [2026-08-28] 奇观周边补据点挂靠（21座，原野外奇观全部转城内奇观）──
    'city_shuanghe': 'SCEN_PAGODA_D',  // 素可泰（玛哈泰寺）
    'city_helate': 'MINARET_OF_JAM',  // 菲鲁兹库赫（杰姆宣礼塔）
    'city_wanxiang': 'SCEN_PAGODA_C',  // 万象（塔銮）
    'city_mailuoe': 'SCEN_CUSHITE_PYRAMIDS',  // 麦罗埃（黑金字塔）
    'city_diyawanake': 'SCEN_ANDEAN_RUINS',  // 蒂亚瓦纳科（太阳门）
    'city_puli': 'SCEN_REKHADEUL_TEMPLE',  // 普里（贾格纳特神庙）
    'city_hengbi': 'SCEN_INDIAN_RUINS',  // 亨比（神庙群）
    'city_bijiabuer': 'GOL_GUMBAZ',  // 比贾布尔（戈尔贡巴兹）
    'city_shengaogusiding': 'WOODEN_FORT',  // 圣奥古斯丁（木堡）
    'city_deerfei': 'SCEN_ARCHAIC_THOLOS',  // 德尔斐（神谕万神殿）
    'city_aolinpiya': 'SCEN_HERO_SHRINE',  // 奥林匹亚（佩洛普斯圣坛）
    'city_boergong': 'EAST_WONDER_VIKINGS',  // 博尔贡（木板教堂）
    'city_kanpeier': 'QUIMPER_CATHEDRAL',  // 坎佩尔（大教堂）
    'city_waerna': 'THRACIAN_SHIPYARD_AGE2',  // 瓦尔纳（古港）
    'city_jiemu': 'AMPHITHEATRE',  // 杰姆（圆形剧场）
    'city_yazide': 'SCEN_FIRE_SHRINE',  // 亚兹德（拜火坛）
    'city_wuer': 'SCEN_ANCIENT_RUINS',  // 乌尔城（塔庙）
    'city_sangqi': 'SANCHI_STUPA',  // 桑奇（大佛塔）
    'city_putijiaye': 'SCEN_BUDDHA_STATUE',  // 菩提伽耶（成道像）
    'city_jienei': 'AFRI_WONDER_MALIANS',  // 杰内城（大清真寺）
    'city_agesi': 'POENARI_CASTLE',  // 阿格斯（波耶纳里城堡）
};

/**
 * 附加城内奇观：据点 → 多座附加地标（CITY_WONDER 主奇观之外的第二、第三座奇观）。
 * [2026-08-28 主人定「所有奇观统称城内奇观，不再有野外奇观」]
 *   把原 33 座「野外奇观」就近挂靠到据点：10 座有据点的直接挂、2 座（严岛/巨石阵）就近归入，
 *   其余 21 座新建据点后挂靠。全部有据点归属，不再独立漂浮。
 */
export interface ExtraWonder {
    /** SUCAI_BUILDING 素材目录名 */
    asset: string;
    /** 显示名 */
    name: string;
    /** 描述（真实所在地） */
    description: string;
    /** 类型（决定底座样式）：ANCIENT_WONDER/HOLY_SITE/HERITAGE_FORT/SACRED_PAGODA */
    category?: 'HOLY_SITE' | 'ANCIENT_WONDER' | 'HERITAGE_FORT' | 'SACRED_PAGODA';
    /** 真实坐标（缺省回退据点坐标） */
    lat?: number;
    lng?: number;
}

export const CITY_WONDER_EXTRA: Record<string, ExtraWonder[]> = {
    // ── [2026-08-29] 银山塔林：实为北京昌平（延寿镇银山）辽金墓塔群，原被错挂会宁府(金上京)，
    //    就近归入北京（主奇观天坛之外的第二座城内奇观）──
    'city_beijing': [
        { asset: 'ASIA_WONDER_JURCHENS', name: '银山塔林', category: 'ANCIENT_WONDER', lat: 40.322, lng: 116.321, description: '北京昌平延寿镇银山山谷的辽金佛寺墓塔群、原法华禅寺遗址，现存金代密檐砖塔七座。' },
    ],
    // ── [2026-08-28] 原野外奇观就近挂靠据点（10 座有据点的 + 严岛/巨石阵就近归入）──
    'city_mengfeisi': [
        { asset: 'GREAT_PYRAMID', name: '吉萨大金字塔', category: 'ANCIENT_WONDER', lat: 29.979, lng: 31.134, description: '古埃及第四王朝胡夫法老修建的吉萨大金字塔，古代世界七大奇迹之首。' },
    ],
    'city_thebes': [
        // 🔴希腊底比斯神话对象≠埃及吉萨狮身人面像；禁止改名、改坐标或改挂孟菲斯。
        { asset: 'SCEN_SPHINX', name: '斯芬克斯雕像', category: 'ANCIENT_WONDER', lat: 38.323, lng: 23.318, description: '古希腊底比斯城外峭壁蹲踞的带翼斯芬克斯雕像，俄狄浦斯解谜之地。' },
    ],
    'city_taizhou_zj': [
        { asset: 'SCEN_CHINESE_RUINS', name: '天台山国清寺', category: 'ANCIENT_WONDER', lat: 29.1734, lng: 121.0430, description: '浙江台州天台山麓佛教天台宗祖庭国清寺及隋代古塔，隋开皇十八年智顗大师开创，山腰密林与古道连通老寺遗迹。' },
    ],
    'city_kenisibao': [
        { asset: 'PAGAN_SHRINE', name: '罗姆瓦圣殿', category: 'HOLY_SITE', lat: 54.60, lng: 21.85, description: '波罗的海（立陶宛、普鲁士、拉脱维亚）诸部共同的最高异教圣所：中心是一株神圣永恒橡树（Rikojoto），树下供奉雷神佩尔库纳斯（Perkūnas），由最高祭司（Krivis）日夜守护那不灭圣火。' },
    ],
    'city_kolossi': [
        { asset: 'SCEN_CASTLE_RUINS', name: '科洛西要塞', category: 'HERITAGE_FORT', lat: 34.664, lng: 32.934, description: '十字军东征时期圣殿骑士团与医院骑士团在塞浦路斯的海防重堡基地。' },
    ],
    'city_yadian': [
        { asset: 'GREEK_SHIPYARD_AGE2', name: '比雷埃夫斯军港', category: 'HERITAGE_FORT', lat: 37.943, lng: 23.647, description: '地米斯托克利为雅典修建的军港，古希腊最大海军基地与三层桨战船母港。' },
    ],
    'city_hangzhou': [
        { asset: 'SCEN_PAGODA_A', name: '六和塔', category: 'SACRED_PAGODA', lat: 30.25, lng: 120.16, description: '五代吴越国王钱俶为镇江潮而建于钱塘江畔月轮山麓（约970年），现存十三层楼阁式砖木塔，杭州钱塘江地标。' },
    ],
    'city_bago': [
        { asset: 'SCEN_PAGODA_B', name: '勃固瑞摩都佛塔', category: 'SACRED_PAGODA', lat: 17.337, lng: 96.481, description: '缅甸孟族勃固古都的瑞摩都金塔，传说藏有佛陀发丝的圣塔。' },
    ],
    'city_ayutthaya': [
        { asset: 'SCEN_PAGODA_E', name: '大城柴瓦塔纳兰寺', category: 'SACRED_PAGODA', lat: 14.353, lng: 100.558, description: '泰国阿瑜陀耶王朝巴萨通王兴建的柴瓦塔纳兰寺，高棉风格塔群。' },
    ],
    'city_naples': [
        { asset: 'SCEN_ROMAN_RUINS', name: '庞贝古城遗迹', category: 'ANCIENT_WONDER', lat: 40.750, lng: 14.490, description: '公元79年维苏威火山喷发掩埋的罗马滨海城市，完整保存的古罗马遗迹。' },
    ],
    'city_luoma': [
        { asset: 'ARCH_OF_CONSTANTINE', name: '君士坦丁凯旋门', category: 'ANCIENT_WONDER', lat: 41.889760, lng: 12.490598, description: '公元315年罗马元老院为纪念君士坦丁大帝米尔维安桥战役胜利而建的凯旋门，紧邻罗马斗兽场。' },
    ],
    'city_yoshida': [
        { asset: 'SCEN_TORII_GATE', name: '严岛水上鸟居', category: 'HOLY_SITE', lat: 34.297, lng: 132.319, description: '日本安艺国严岛神社建在潮间带海中的朱红色大鸟居，人神相通的海上圣境。' },
    ],
    'city_winchester': [
        { asset: 'SCEN_STONEHENGE', name: '巨石阵', category: 'ANCIENT_WONDER', lat: 51.178, lng: -1.826, description: '公元前3000年索尔兹伯里平原环形巨石阵，不列颠古代德鲁伊与天文观测圣地。' },
        { asset: 'WEST_WONDER_BRITONS', name: '奇切斯特大教堂', category: 'ANCIENT_WONDER', lat: 50.836, lng: -0.781, description: '西萨塞克斯郡奇切斯特的哥特式主教座堂，建于1075年，英格兰南部千年教堂。' },
    ],
};
