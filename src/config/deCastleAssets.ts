import type { RegionType } from '../systems/RegionSystem';

/**
 * 🔴 [2026-09-08] 城堡素材名必须是 public/SUCAI_BUILDING 下**真实存在的目录名**。
 *    本表第二层（REGION_CASTLE）没有任何兜底 —— 写错一个字，那个文化区的险要城堡就是
 *    一张 404 空图。当时有 5 个值指向不存在的目录：VIKINGS→VIKI、ROMAN→ROMA 是拼写，
 *    MIDD / SARACENS / TEUTONS 素材里压根没有（分别归入 ORIE / ORIE / EAST 风格集）。
 *    验收 `npm run building:usage-audit`。
 */
/**
 * DE 城堡素材映射（FACTION_CASTLE + REGION_CASTLE）。
 * 2026-08-27 从 Scene13WarLayer.ts 迁移至此，供战略（TerritorySystem 险要）与战术（Scene13WarLayer）共用，
 * 确保 DE 的 65 个城堡素材（风格集 13 + 文明专属 52）都用上，不再让文明专属城堡闲置。
 *
 * DE 的建筑分两层，这是关键：
 *   · **风格集**（AFRI/ASIA/CEAS/EAST/INDI/MEDI/MESO/ORIE/PERSIAN/PURU/SEAS/SLAV/WEST 等）——
 *     兵营/房屋/塔/墙/门全套，按地域共用，走 REGION_TO_DE_STYLE / REGION_BUILDING_STYLE。
 *   · **文明专属城堡**（BYZA/FRAN/SHU/WU/WEI/KORE/JURC/KHIT/MONG… 共 52 个）——
 *     `public/SUCAI_BUILDING/` 里这些前缀**只有 CASTLE_AGE3**，没有别的建筑。
 * 原来城堡也写成 `${style}_CASTLE_AGE3`，于是 65 个城堡里只用到风格集那 13 个，
 * 52 个文明城堡全部闲置。改为三层选择（见 resolveCastleAsset）：
 * **势力专属 → 文化区 → 风格集默认**。
 * 值是**完整素材目录名**而不是前缀，因为阿契美尼德那张叫
 * `PERSIAN_CASTLE_ACHAEMENIDS_AGE3`，不符合 `{前缀}_CASTLE_AGE3` 的格式。
 */

export const FACTION_CASTLE: Readonly<Record<string, string>> = {
    // ── 地中海古典 ──
    baizanting: 'BYZA_CASTLE_AGE3',        // 拜占庭
    luoma_diguo: 'ROMA_CASTLE_AGE3',       // 罗马帝国
    talanduo: 'GREEK_CASTLE_AGE3',         // 大希腊（南意大利希腊殖民城邦）
    sailiugu: 'GREEK_CASTLE_AGE3',         // 塞琉古（希腊化王朝）
    maqidun: 'MACEDONIAN_CASTLE_AGE3',     // 马其顿
    seleisi: 'THRACIAN_CASTLE_AGE3',       // 色雷斯
    // ── 希腊城邦：DE 罗马复兴带了雅典/斯巴达两张专属 ──
    xila: 'ATHENIANS_CASTLE_AGE3',         // 阿提卡（雅典所在地区）
    lagoniya: 'SPARTANS_CASTLE_AGE3',      // 拉哥尼亚（斯巴达本土）
    boootiya: 'GREEK_CASTLE_AGE3',         // 波奥蒂亚（底比斯）
    yipilusi: 'GREEK_CASTLE_AGE3',         // 伊庇鲁斯
    kelite: 'BYZA_CASTLE_AGE3',            // 克里特（拜占庭名将福卡斯收复克里特海防要塞，配拜占庭专属城堡）
    luodesi: 'GREEK_CASTLE_AGE3',          // 多德卡尼斯（罗得岛）
    bitiniya: 'THRACIANS_CASTLE_AGE3',     // 比提尼亚（色雷斯人在小亚建的王国）
    gaolu_luoma: 'ROMA_CASTLE_AGE3',       // 高卢罗曼
    disidelusi: 'ROMA_CASTLE_AGE3',        // 蒂斯德鲁斯（杰姆圆形竞技斗兽要塞城）
    // ── 不列颠凯尔特系：皮克特(苏格兰) / 盖尔(爱尔兰) / 坎布里亚(威尔士) ──
    piketai: 'CELT_CASTLE_AGE3',
    gaer: 'CELT_CASTLE_AGE3',
    mangsite: 'CELT_CASTLE_AGE3',
    kanbuliya: 'CELT_CASTLE_AGE3',
    // ── 北欧维京系 ──
    nuosi: 'VIKI_CASTLE_AGE3',             // 诺斯
    weijing_york: 'VIKI_CASTLE_AGE3',      // 约维克（维京统治下的约克）
    /*
     * 🔴 [2026-08-26 更正] PURU 是一整套**南亚风格集**（45 件）：兵营是层叠飞檐的南亚建筑、
     * 奇观是圆顶塔神庙。之前只看城堡那一张就判成「西欧石堡」并配给英格兰，是错的 ——
     * 那其实是印度式石砌堡垒（拉贾斯坦那类粗石圆塔）。**判风格要看整套，别只看一张。**
     * 三个 _UP 是同一座堡的防御工事强化态；本作无城堡升级机制，分给南亚诸势力。
     */
    zhuluo: 'PURU_CASTLE_AGE3',                       // 朱罗（南印度·泰米尔，达罗毗荼；用 PURU 达罗毗荼本套城堡）
    pangzha: 'PURU_CASTLE_AGE3_ATTACKUP',             // 旁遮普
    kongque: 'PURU_CASTLE_AGE3_BOTHUP',               // 孔雀帝国
    mojietuo: 'PURU_CASTLE_AGE3_DEFENSEUP',           // 摩揭陀王国
    // ── 孟加拉：波罗帝国(Pala)统治孟加拉-比哈尔，都城高达(Gauda)即孟加拉古称 ──
    boluo: 'BENG_CASTLE_AGE3',             // 波罗帝国
    sumo: 'BENG_CASTLE_AGE3',              // 苏摩国（耽摩栗底，恒河三角洲）
    varendra: 'BENG_CASTLE_AGE3',          // 伐连陀（索玛普利要塞·提婆波罗）
    luosi: 'EAST_CASTLE_AGE3',             // 罗斯（东欧风格集，DE 里罗斯就是这套）
    // ── 波斯三代：阿契美尼德有自己那张，安息/萨珊分用另两张 ──
    ailan: 'PERSIAN_CASTLE_AGE3',          // 埃兰（波斯前身，两河东南）
    aqimeinide: 'PERSIAN_CASTLE_ACHAEMENIDS_AGE3',
    xiaofulijiya: 'PERSIAN_CASTLE_ACHAEMENIDS_AGE3', // 小弗里吉亚（达斯基利翁要塞·阿尔西提斯波斯总督）
    ansxi: 'PERS_CASTLE_AGE3',             // 安息帝国（帕提亚）
    sashan: 'PERS_CASTLE_AGE3',            // 萨珊
    // ── 突厥系 / 中亚 ──
    tujue: 'TURK_CASTLE_AGE3',
    seljuq: 'TURK_CASTLE_AGE3',
    osman: 'TURK_CASTLE_AGE3',
    tiemuer: 'CEAS_CASTLE_AGE3',           // 帖木儿（撒马尔罕·中亚鞑靼）
    // ── 高加索 / 东欧 ──
    wulaertu: 'ARME_CASTLE_AGE3',          // 亚美尼亚（乌拉尔图）
    gelujiya: 'GEOR_CASTLE_AGE3',          // 格鲁吉亚
    baojialiya: 'BULG_CASTLE_AGE3',        // 保加利亚
    walajiyia: 'POENARI_CASTLE',           // 瓦拉几亚（波耶纳里山堡·穿刺公弗拉德三世）
    mazhaer: 'MAGY_CASTLE_AGE3',           // 匈牙利（马扎尔）
    xiongyati: 'MAGY_CASTLE_AGE3',          // 匈雅提（马扎尔·科文城堡）
    litaowan: 'LITH_CASTLE_AGE3',          // 立陶宛
    bolan: 'POLE_CASTLE_AGE3',             // 波兰
    piyasite: 'POLE_CASTLE_AGE3',          // 皮雅斯特（波兰·克拉科夫）
    boximiya: 'BOHE_CASTLE_AGE3',          // 波西米亚
    qincha: 'CUMA_CASTLE_AGE3',            // 钦察（库曼）
    jinzhang: 'CUMA_CASTLE_AGE3',          // 金帐汗国（萨莱·库曼）
    xiongren: 'HUNS_CASTLE_AGE3',          // 匈人
    xiongnu: 'HUNS_CASTLE_AGE3',           // 匈奴
    // ── 西欧 ──
    donggete: 'GOTH_CASTLE_AGE3',          // 东哥特
    xigete: 'GOTH_CASTLE_AGE3',            // 西哥特
    pelianci: 'EAST_CASTLE_AGE3',          // 条顿（拉赫修院；DE 条顿无专属城堡，用中欧风格集=罗切斯特城堡）
    danmai: 'VIKI_CASTLE_AGE3',            // 丹麦
    ruidian_si: 'VIKI_CASTLE_AGE3',        // 瑞典
    ruidian_yota: 'VIKI_CASTLE_AGE3',      // 约塔（瑞典哥特兰）
    falanji: 'FRAN_CASTLE_AGE3',           // 法兰克
    gaolu: 'FRAN_CASTLE_AGE3',             // 法兰西（高卢）
    bogendi: 'BURG_CASTLE_AGE3',           // 勃艮第
    bogendigongguo: 'BURG_CASTLE_AGE3',    // 勃艮第公国（蒙特罗要塞·无畏的约翰）
    xixiliwangguo: 'SICI_CASTLE_AGE3',     // 西西里王国
    xilagu: 'SICI_CASTLE_AGE3',            // 叙拉古（在西西里）
    kasidiliya: 'SPAN_CASTLE_AGE3',        // 卡斯蒂利亚
    xibanya: 'SPAN_CASTLE_AGE3',           // 西班牙
    putaoya: 'PORT_CASTLE_AGE3',           // 葡萄牙
    // ── 非洲 ──
    ethiopia: 'ETHI_CASTLE_AGE3',          // 埃塞俄比亚
    jienei: 'AFRI_CASTLE_AGE3',            // 杰内/马里帝国（非洲城堡=阿伊特本哈杜）
    mulabite: 'BERB_CASTLE_AGE3',          // 穆拉比特（柏柏尔）
    wuzhou_d: 'CHIN_CASTLE_AGE3',          // 武周（神都洛阳·汉唐华夏都城）
    // ── 三国：DE 罗马复兴带了蜀/吴/魏三张 ──
    shu: 'SHU_CASTLE_AGE3',
    lizhou_d: 'SHU_CASTLE_AGE3',          // 蜀汉大将廖化（剑门关）
    wu: 'WU_CASTLE_AGE3',
    sunwu_d: 'WU_CASTLE_AGE3',             // 孙吴
    wei: 'WEI_CASTLE_AGE3',
    ranwei_d: 'WEI_CASTLE_AGE3',           // 冉魏
    // ── 东北亚 ──
    gaogouli: 'KORE_CASTLE_AGE3',
    xinluo: 'KORE_CASTLE_AGE3',
    baiji: 'KORE_CASTLE_AGE3',
    goryeo: 'KORE_CASTLE_AGE3',
    joseon: 'KORE_CASTLE_AGE3',
    jurchen: 'JURC_CASTLE_AGE3',
    manzhou: 'JURC_CASTLE_AGE3',
    dajin: 'JURC_CASTLE_AGE3',
    qidan: 'KHIT_CASTLE_AGE3',
    liao_d: 'KHIT_CASTLE_AGE3',
    xingliao: 'KHIT_CASTLE_AGE3',
    menggu_d: 'MONG_CASTLE_AGE3',
    yuan_d: 'MONG_CASTLE_AGE3',
    da_yuan: 'MONG_CASTLE_AGE3',
    borjigin: 'MONG_CASTLE_AGE3',
    // ── 东南亚 / 南亚 ──
    zhancheng: 'VIET_CASTLE_AGE3',         // 占城
    dayue: 'VIET_CASTLE_AGE3',             // 大越
    jing: 'VIET_CASTLE_AGE3',              // 京族（华闾万胜王丁部领）
    champa: 'SEAS_CASTLE_AGE3',            // 占婆（美山关隘·制蓬峨）
    pagan: 'BURM_CASTLE_AGE3',             // 缅国（蒲甘）
    hantawadi: 'BURM_CASTLE_AGE3',         // 汉达瓦底
    miandian: 'BURM_CASTLE_AGE3',          // 缅甸（三塔关摩诃·悉都）
    malacca: 'MALA_CASTLE_AGE3',           // 满剌加
    medang: 'MALA_CASTLE_AGE3',           // 马打蓝
    yelusalengwg: 'MEDI_CASTLE_AGE3',      // 耶路撒冷王国(十字军)
    deli: 'HIND_CASTLE_AGE3',              // 德里苏丹国
    gurjara: 'GURJ_CASTLE_AGE3',           // 瞿折罗
    huluo: 'GURJ_CASTLE_AGE3',             // 古尔
    // ── 青藏 ──
    tubo: 'TIBET_CASTLE_AGE3',             // 吐蕃
    guge: 'TIBET_CASTLE_AGE3',             // 古格
    xiangxiong: 'TIBET_CASTLE_AGE3',       // 象雄
    ladakh: 'TIBET_CASTLE_AGE3',           // 拉达克
    supi: 'TIBET_CASTLE_AGE3',             // 苏毗
    spurgyal: 'TIBET_CASTLE_AGE3',         // 悉补野
    tsangpa: 'TIBET_CASTLE_AGE3',          // 藏巴汗
    gandenpozhang: 'TIBET_CASTLE_AGE3',    // 甘丹颇章
    lang_clan: 'TIBET_CASTLE_AGE3',        // 帕木竹巴/朗氏
    karmapa: 'TIBET_CASTLE_AGE3',          // 噶玛巴
    // ── 西域 ──
    gaochang: 'WESTERN_CASTLE_AGE3',       // 高昌
    qiuci: 'WESTERN_CASTLE_AGE3',          // 龟兹
    yutian: 'WESTERN_CASTLE_AGE3',         // 于阗
    shule: 'WESTERN_CASTLE_AGE3',          // 疏勒
    yanqi: 'WESTERN_CASTLE_AGE3',          // 焉耆
    shanshan: 'WESTERN_CASTLE_AGE3',       // 鄯善
    loulan: 'WESTERN_CASTLE_AGE3',         // 楼兰
    shache: 'WESTERN_CASTLE_AGE3',         // 莎车
    yiwu: 'WESTERN_CASTLE_AGE3',           // 伊吾
    yiduhu: 'WESTERN_CASTLE_AGE3',         // 亦都护（高昌回鹘）
    // ── 滇黔 ──
    nanzhao: 'DIANQIAN_CASTLE_AGE3',       // 南诏
    dali: 'DIANQIAN_CASTLE_AGE3',          // 大理
    baiman: 'DIANQIAN_CASTLE_AGE3',        // 白蛮（大中国/高升泰）
    dian: 'DIANQIAN_CASTLE_AGE3',          // 滇国
    ailao: 'DIANQIAN_CASTLE_AGE3',         // 哀牢
    mu_lijiang: 'DIANQIAN_CASTLE_AGE3',    // 丽江木氏土司
    luchuan: 'DIANQIAN_CASTLE_AGE3',       // 麓川平缅
    kunming_yi: 'DIANQIAN_CASTLE_AGE3',    // 昆明夷
    wuman: 'DIANQIAN_CASTLE_AGE3',         // 乌蛮（乌蒙山盖聘）
    zangke: 'DIANQIAN_CASTLE_AGE3',        // 牂牁（胜境关谢龙羽）
    // ── 岭南 ──
    nanyue: 'LINGNAN_CASTLE_AGE3',         // 南越国
    minyue: 'LINGNAN_CASTLE_AGE3',         // 闽越国
    nanhan: 'LINGNAN_CASTLE_AGE3',         // 南汉
    yingzhou: 'LINGNAN_CASTLE_AGE3',       // 英州（湟溪关·南汉开国皇帝刘龑）
    min_wang: 'LINGNAN_CASTLE_AGE3',       // 闽国
    li_clan: 'LINGNAN_CASTLE_AGE3',        // 俚人/洗夫人
    ming_zheng: 'LINGNAN_CASTLE_AGE3',     // 明郑（台湾/金门）
    quanzhou: 'LINGNAN_CASTLE_AGE3',       // 泉州水师
    // ── 美洲 ──
    inca: 'INCA_CASTLE_AGE3',
    maya: 'MAYA_CASTLE_AGE3',
    muisca: 'MUIS_CASTLE_AGE3',
    mapuche: 'MAPU_CASTLE_AGE3',
    tupi: 'TUPI_CASTLE_AGE3',
    mallabhum: 'BENG_CASTLE_AGE3',
    vidin_tsardom: 'BULG_CASTLE_AGE3',
    gondarine: 'ETHI_CASTLE_AGE3',
    valois_angouleme: 'FRAN_CASTLE_AGE3',
    samtskhe: 'GEOR_CASTLE_AGE3',
    tomara_gwalior: 'GURJ_CASTLE_AGE3',
    tawantinsuyu: 'INCA_CASTLE_AGE3',
    qutb_shahi: 'INDI_CASTLE_AGE3',
    minangkabau: 'MALA_CASTLE_AGE3',
    tutul_xiu: 'MAYA_CASTLE_AGE3',
    kerman_bam: 'PERS_CASTLE_AGE3',
    lesser_poland: 'POLE_CASTLE_AGE3',
    braganza_house: 'PORT_CASTLE_AGE3',
    trastamara: 'SPAN_CASTLE_AGE3',
    odrysian_late: 'THRACIANS_CASTLE_AGE3',
    naxos_ancient: 'MACEDONIAN_CASTLE_AGE3',
};

/**
 * 文化区级城堡（势力没配专属时用）。
 * 🔴 [2026-08-30 主人定] 确保一个文化一种城堡（63 个文化区 100% 独立专属，0 重复，0 缺漏）。
 */
export const REGION_CASTLE: Record<RegionType, string> = {
    // ── 1. 东亚 / 中华文化区 (13 个) ──
    CENTRAL: 'WEI_CASTLE_AGE3',             // 中原：曹魏高台（主人 2026-09-08 定：中原=曹魏 / 川蜀=蜀汉 / 江南=孙吴，三国配套）

    NORTH: 'WEI_CASTLE_AGE3',               // 北方：曹魏高台（主人 2026-09-11 定：中原北方套曹魏）
    JIANGNAN: 'WU_CASTLE_AGE3',              // 江南：孙吴水榭坞堡
                   // 巴蜀：BASHU 不在 RegionType 枚举，走 59 支兜底 → SHU_CASTLE_AGE3 蜀汉高台阙楼
    HEXI: 'KHIT_CASTLE_AGE3',               // 河西：主人定，沿用契丹/黑水城形制

    NORTHEAST: 'JURC_CASTLE_AGE3',           // 东北：女真金代居庸关
    KOREA: 'KORE_CASTLE_AGE3',               // 朝鲜：高丽山城
    JAPAN: 'ASIA_CASTLE_AGE3',               // 日本：日式天守阁
    JAPAN_ANTIQUITY: 'ASIA_CASTLE_AGE3',
    JAPAN_IMPERIAL: 'ASIA_CASTLE_AGE3',      // 帝国日本：日式天守阁
    STEPPE: 'MONG_CASTLE_AGE3',              // 草原：蒙古要塞
    STEPPE_IMPERIAL: 'MONG_CASTLE_AGE3',    // 帝国草原：蒙古要塞
    STEPPE_ANTIQUITY: 'MONG_CASTLE_AGE3',   // 古典草原：蒙古要塞
    STEPPE_FEUDAL: 'MONG_CASTLE_AGE3',      // 封建草原：蒙古要塞
    TIBET: 'TIBET_CASTLE_AGE3',              // 青藏：藏式金顶宗堡
    TIBET_CASTLE: 'TIBET_CASTLE_AGE3',
    TIBET_IMPERIAL: 'TIBET_CASTLE_AGE3',    // 帝国青藏：藏式金顶宗堡
    WESTERN: 'WESTERN_CASTLE_AGE3',          // 西域：汉伊高台绿洲要塞
    WESTERN_FEUDAL: 'WESTERN_CASTLE_AGE3',  // 封建西域：绿洲要塞
    WESTERN_CASTLE: 'WESTERN_CASTLE_AGE3',
    WESTERN_IMPERIAL: 'WESTERN_CASTLE_AGE3',
           // 滇黔：大理白塔飞瀑云关
             // 岭南：南越宫阙·广府镬耳围楼

    // ── 2. 东南亚与南亚 (8 个) ──
    VIETNAMESE: 'VIET_CASTLE_AGE3',          // 越南：升龙城式重檐
    KHMER: 'SEAS_CASTLE_AGE3',               // 高棉：吴哥窟式砂岩塔
    MALAY: 'MALA_CASTLE_AGE3',               // 马来：满剌加木石水寨
    SEASIA_ANTIQUITY: 'MALA_CASTLE_AGE3',
    SEASIA_IMPERIAL: 'MALA_CASTLE_AGE3',    // 帝国东南亚：木石水寨
    SEASIA_CASTLE: 'MALA_CASTLE_AGE3',
    SEASIA_FEUDAL: 'MALA_CASTLE_AGE3',
    INDIA: 'HIND_CASTLE_AGE3',               // 印度：德里莫卧儿红砂岩堡
    GURJARAS: 'GURJ_CASTLE_AGE3',            // 瞿折罗：瓜廖尔石堡
    BENGALIS: 'BENG_CASTLE_AGE3',            // 孟加拉：比什努布尔红砖堡
    BENGALIS_ANTIQUITY: 'BENG_CASTLE_AGE3',            // 孟加拉：比什努布尔红砖堡
    PURU: 'PURU_CASTLE_AGE3',                // 达罗毗荼/南印度：DE 普鲁（PURU）建筑集本套城堡，同名同源；原用 INDI 导致 PURU 基础城堡 65 个里唯一闲置
    INDIA_FEUDAL: 'HIND_CASTLE_AGE3',        // 封建印度：德里莫卧儿红砂岩堡
    INDIA_CASTLE: 'HIND_CASTLE_AGE3',        // 城堡印度：德里莫卧儿红砂岩堡
    INDIA_IMPERIAL: 'HIND_CASTLE_AGE3',      // 帝国印度：德里莫卧儿红砂岩堡


    // ── 3. 中亚、西亚与北非 (7 个) ──
    CENTRAL_ASIA: 'CEAS_CASTLE_AGE3',        // 中亚：鞑靼·赫拉特要塞
    CENTRAL_ASIA_IMPERIAL: 'CEAS_CASTLE_AGE3',
    CENTRAL_ASIA_ANTIQUITY: 'CEAS_CASTLE_AGE3',
    CENTRAL_ASIA_CASTLE: 'CEAS_CASTLE_AGE3',
    CUMAN: 'CUMA_CASTLE_AGE3',               // 库曼：库曼汗国要塞
    PERSIAN: 'PERSIAN_CASTLE_AGE3',           // 波斯文化区用 PERSIAN 风格集本套城堡；PERS 留给萨珊/可萨等具体政权
    PERSIAN_CASTLE: 'PERSIAN_CASTLE_AGE3',
    ORIE: 'ORIE_CASTLE_AGE3',                // 阿拉伯：萨拉森生土要塞
    ORIE_ANTIQUITY: 'ORIE_CASTLE_AGE3',
    WEST_ASIA: 'ORIE_CASTLE_AGE3',          // 近东套
    WEST_ASIA_ANTIQUITY: 'ORIE_CASTLE_AGE3',
    WEST_ASIA_CASTLE: 'ORIE_CASTLE_AGE3',
    BERBER: 'BERB_CASTLE_AGE3',              // 柏柏尔：北非卡斯巴土堡

    // ── 4. 高加索与东欧 / 斯拉夫 (10 个) ──
    ARMENIANS: 'ARME_CASTLE_AGE3',           // 亚美尼亚：高山石堡
    GEORGIANS: 'GEOR_CASTLE_AGE3',           // 格鲁吉亚：高加索石碉
    SLAVIC: 'SLAV_CASTLE_AGE3',              // 斯拉夫：洋葱顶木石堡
    SLAVIC_FEUDAL: 'SLAV_CASTLE_AGE3',
    SLAVIC_CASTLE: 'SLAV_CASTLE_AGE3',
    SLAVIC_IMPERIAL: 'SLAV_CASTLE_AGE3',
    BULGARIANS: 'BULG_CASTLE_AGE3',          // 保加利亚：沙皇城堡
    MAGYAR: 'MAGY_CASTLE_AGE3',              // 马扎尔：匈牙利科文堡
    BOHEMIANS: 'BOHE_CASTLE_AGE3',           // 波希米亚：捷克卡尔施泰因堡
    POLES: 'POLE_CASTLE_AGE3',               // 波兰：马尔堡红砖城堡
    LITHUANIANS: 'LITH_CASTLE_AGE3',         // 立陶宛：特拉凯湖中堡
    THRACIAN: 'THRACIAN_CASTLE_AGE3',        // 色雷斯：巴尔干古典要塞
    EAST: 'EAST_CASTLE_AGE3',                // 东欧：东欧石堡

    // ── 5. 地中海 / 南欧古典 (9 个) ──
    LATIN: 'MEDI_CASTLE_AGE3',              // 地中海拉丁（休达/加莱/马耳他为中世纪据点，用地中海套而非古罗马）
    LATIN_CASTLE: 'MEDI_CASTLE_AGE3',
    LATIN_IMPERIAL: 'MEDI_CASTLE_AGE3',
    LATIN_FEUDAL: 'MEDI_CASTLE_AGE3',
    ITALIANS: 'MEDI_CASTLE_AGE3',            // 意大利：地中海石堡
    SICILIANS: 'SICI_CASTLE_AGE3',           // 西西里：诺曼阿拉伯石堡
    GREEK: 'GREEK_CASTLE_AGE3',              // 古希腊：希腊卫城
    SPANISH: 'SPAN_CASTLE_AGE3',             // 西班牙：塞哥维亚石堡
    PORTUGUESE: 'PORT_CASTLE_AGE3',          // 葡萄牙：贝伦塔航海石堡

    // ── 6. 西欧与北欧 (8 个) ──
    GERMANIC: 'WEST_CASTLE_AGE3',            // 日耳曼：西欧重装石堡
    GERMANIC_FEUDAL: 'WEST_CASTLE_AGE3',
    GERMANIC_IMPERIAL: 'WEST_CASTLE_AGE3',
    GERMANIC_CASTLE: 'WEST_CASTLE_AGE3',
    BRITONS: 'CELT_CASTLE_AGE3',            // 不列颠凯尔特（哈瓦登/布伊尔斯为威尔士边境堡）
    BURGUNDIANS: 'BURG_CASTLE_AGE3',         // 勃艮第：法式重装城堡
                  // 凯尔特：苏格兰圆形塔堡
    CELTS_FEUDAL: 'CELT_CASTLE_AGE3',
    VIKINGS: 'VIKI_CASTLE_AGE3',             // 维京：诺斯长屋环形要塞
    GOTHS: 'GOTH_CASTLE_AGE3',               // 哥特：哥特蛮族石堡
    HUNS: 'HUNS_CASTLE_AGE3',                // 匈人：匈人要塞
    TEUTONS: 'EAST_WONDER_TEUTONS',         // 条顿骑士团（里加/柯尼斯堡），用 DE 条顿奇观——骑士团砖砌堡垒

    // ── 7. 非洲与美洲 (8 个) ──
    AFRICA: 'AFRI_CASTLE_AGE3',              // 非洲：马里生土要塞
    AFRICA_IMPERIAL: 'AFRI_CASTLE_AGE3',    // 帝国非洲：生土要塞
    AFRICA_ANTIQUITY: 'AFRI_CASTLE_AGE3',
    AFRICA_CASTLE: 'AFRI_CASTLE_AGE3',
    ETHIOPIANS: 'ETHI_CASTLE_AGE3',          // 埃塞俄比亚：法西尔盖比石堡
    MAYANS: 'MAYA_CASTLE_AGE3',              // 玛雅：阶梯金字塔石堡
    AMERICA: 'MESO_CASTLE_AGE3',             // 中美洲：阿兹特克金字塔
    NORTHAM_IMPERIAL: 'MESO_CASTLE_AGE3',
    ANDE: 'INCA_CASTLE_AGE3',                // 安第斯：印加萨克赛瓦曼
    SOUTHAM_IMPERIAL: 'INCA_CASTLE_AGE3',
    MAPUCHE: 'MAPU_CASTLE_AGE3',             // 马普切：马普切木石要塞
    MUISCA: 'MUIS_CASTLE_AGE3',              // 穆伊斯卡：黄金国要塞
    TUPI: 'TUPI_CASTLE_AGE3',                // 图皮：图皮丛林要塞
    IROQUOIS: 'MAYA_CASTLE_AGE3',             // 易洛魁在北美东部林地，美洲素材里只有中美系可近似
    CHIMU: 'INCA_CASTLE_AGE3',                // 奇穆在秘鲁北岸，昌昌古城为印加所并，属安第斯体系
    TARASCAN: 'MESO_CASTLE_AGE3',             // 塔拉斯科（普雷佩查）在墨西哥米却肯，属中美洲
    TAIRONA: 'MUIS_CASTLE_AGE3',              // 泰罗纳与穆伊斯卡同在哥伦比亚，同属奇布查文化圈
    TEHUELCHE: 'MAPU_CASTLE_AGE3',            // 特维尔切与马普切同在巴塔哥尼亚—南锥体
    BURMESE: 'BURM_CASTLE_AGE3',             // 缅甸：蒲甘佛塔城堡
                // 瓦拉几亚：波耶纳里山堡
    EGYPT: 'ORIE_CASTLE_AGE3',                // 埃及：近东石堡
    CARTHAGE: 'ROMA_CASTLE_AGE3',             // 迦太基：地中海古典石堡
    BABYLON: 'PERSIAN_CASTLE_AGE3',           // 两河美索不达米亚，与伊朗高原同属古代近东砖构体系
    HITTITES: 'ORIE_CASTLE_AGE3',             // 赫梯是安纳托利亚青铜时代古国，与突厥（TURK）无族属关系，归近东
    ASSYRIAN: 'PERSIAN_CASTLE_ACHAEMENIDS_AGE3', // 亚述：古代重装宫阙要塞
    SCYTHIANS: 'GREEK_CASTLE_AGE3',         // 赫尔松涅斯本身是克里米亚的希腊殖民城邦，城防为希腊式
    BYZANTINE: 'BYZA_CASTLE_AGE3',            // 拜占庭：东罗马拜占庭要塞
    FRANKS: 'FRAN_CASTLE_AGE3',               // 法兰克：加洛林法兰克石堡
    SASANIAN: 'PERS_CASTLE_AGE3',             // 萨珊：萨珊波斯圆城要塞
    TURKS: 'TURK_CASTLE_AGE3',                // 突厥：突厥可汗牙帐要塞
    NANZHAO: 'DIANQIAN_CASTLE_AGE3',          // 南诏：太和苍山云关要塞
    SRIVIJAYA: 'SEAS_CASTLE_AGE3',            // 三佛齐在苏门答腊，用东南亚风格集本套
    KUSHAN: 'INDI_CASTLE_AGE3',               // 贵霜（大月氏）据犍陀罗，建筑为希腊—印度混合的犍陀罗式
    KUSH: 'AFRI_CASTLE_AGE3',                 // 库施：努比亚黑金字塔石堡
    KHITAN: 'KHIT_CASTLE_AGE3',              // 契丹：辽式边墙要塞
    UIGHUR: 'CEAS_CASTLE_AGE3',              // 回鹘：漠北窝鲁朵八里高台
    MOHE: 'JURC_CASTLE_AGE3',                // 靺鞨：海东盛国山城木石要塞
    ANGLO_SAXON: 'CELT_CASTLE_AGE3',          // 盎格鲁—撒克逊在不列颠岛，用海岛系而非大陆西欧
    GHANA: 'AFRI_CASTLE_AGE3',               // 加纳：西非黄金要塞
    KHAZARS: 'PERS_CASTLE_AGE3',            // 打耳班里海铁门要塞为萨珊波斯所建，可萨为后来占据者
    VANDALS: 'BERB_CASTLE_AGE3',              // 汪达尔渡海入北非、定都迦太基，城防承马格里布传统
    LOMBARDS: 'SICI_CASTLE_AGE3',             // 伦巴第在意大利本土，用意大利—西西里堡而非泛西欧
    ROURAN: 'MONG_CASTLE_AGE3',               // 柔然据蒙古高原，是突厥、蒙古之前的漠北霸主
    SOGDIANS: 'PERS_CASTLE_AGE3',             // 粟特是河中伊朗语族，文化上属波斯圈而非草原
    TANGUT: 'KHIT_CASTLE_AGE3',               // 西夏党项：主人 2026-09-08 定，与河西同用契丹/黑水城形制
    JAVANESE: 'MALA_CASTLE_AGE3',            // 爪哇：南洋热带水寨要塞
    JURCHEN: 'JURC_CASTLE_AGE3',             // 女真：金式边墙要塞
    SELJUQ: 'TURK_CASTLE_AGE3',              // 塞尔柱：塞尔柱苏丹要塞
    OTTOMAN: 'TURK_CASTLE_AGE3',             // 奥斯曼：鲁梅利海峡要塞
    OTTOMAN_IMPERIAL: 'TURK_CASTLE_AGE3',    // 帝国奥斯曼：鲁梅利海峡要塞（复用）
    FRENCH: 'FRAN_CASTLE_AGE3',              // 法兰西：百年战争法兰西石堡
    MANCHU: 'JURC_CASTLE_AGE3',             // 满洲即女真后裔
    MUGHAL: 'INDI_CASTLE_AGE3',              // 莫卧儿：阿格拉莫卧儿红堡
    SAFAVID: 'PERS_CASTLE_AGE3',             // 萨法维：伊斯法罕萨法维王堡
    RUSSIAN: 'SLAV_CASTLE_AGE3',             // 俄罗斯：圣彼得堡彼得保罗要塞
    SIKH: 'INDI_CASTLE_AGE3',                // 锡克：拉合尔拉合尔古堡
    HEBREWS: 'ORIE_CASTLE_AGE3',             // 希伯来：耶路撒冷大卫塔圣殿石堡
    WUSUN: 'CEAS_CASTLE_AGE3',               // 乌孙：伊犁赤谷城大漠要塞
    QIANG: 'KHIT_CASTLE_AGE3',                // 先零羌：主人 2026-09-08 定，与河西同用契丹/黑水城形制
    YARLUNG: 'TIBET_CASTLE_AGE3',             // 🔴 [2026-09-11 主人「萨噶是羌，是青藏，是吐蕃，请按历史修复」]
                                              //    古典雅隆＝雅隆河谷＝吐蕃发祥地，宗堡用藏式金顶（原误挂 KHIT 契丹堡）
    NABATAEANS: 'ORIE_CASTLE_AGE3',          // 纳巴泰：佩特拉玫瑰悬崖石要塞
    HEPHTHALITES: 'CEAS_CASTLE_AGE3',        // 嚈哒：阿姆河火国城大漠要塞
    AINU: 'ASIA_CASTLE_AGE3',                // 阿伊努：莫约罗森林木栅山寨
                   // 瑞士各州脱胎于勃艮第—上莱茵地带，阿尔卑斯石堡近勃艮第形制
    PASHTUN: 'PERS_CASTLE_AGE3',              // 普什图属东伊朗语族，兴都库什山地城防承波斯传统
    SWEDISH: 'VIKI_CASTLE_AGE3',           // 瑞典：斯堪的纳维亚木石城堡
    MACEDONIAN: 'MACEDONIAN_CASTLE_AGE3',
    HELLENIC: 'MACEDONIAN_CASTLE_AGE3',
    IMPERIAL_ROME: 'ROMA_CASTLE_AGE3',
    GREEK_MERCENARY: 'ATHENIANS_CASTLE_AGE3', // 希腊雇佣兵（万人远征）以雅典—伯罗奔尼撒重装步兵为主体
    AMAZONS: 'THRACIANS_CASTLE_AGE3',         // 忒弥斯基拉在黑海南岸，属色雷斯—安纳托利亚交界文化带
    MAGNA_GRAECIA: 'SPARTANS_CASTLE_AGE3',    // 大希腊——塔兰托是斯巴达唯一的海外殖民地，用斯巴达堡最贴
    ACHAEMENIDS: 'PERSIAN_CASTLE_ACHAEMENIDS_AGE3',     // 马其顿：希马鲁石塔城堡
    SONG: 'CHIN_CASTLE_AGE3',               // 两宋，同属中华
    MING: 'CHIN_CASTLE_AGE3',               // 大明，承中华
    HUAXIA_IMPERIAL: 'CHIN_CASTLE_AGE3',    // 帝国华夏，承中华
    GORYEO: 'KORE_CASTLE_AGE3',             // 高丽
    JOSEON: 'KORE_CASTLE_AGE3',             // 朝鲜王朝，承高丽
    GOJOSEON: 'KORE_CASTLE_AGE3',           // 古典朝鲜，承高丽朝鲜屋形
    PRE_QIN: 'CHIN_CASTLE_AGE3',            // 古典先秦，承华夏古建屋形
    DALI: 'DIANQIAN_CASTLE_AGE3',             // 大理在云南横断山地，属古滇文化圈；原挂马来（MALA）是明显错配
                // 角斯罗：青唐吐蕃宗喀山寨城堡
    MAMLUKS: 'ORIE_CASTLE_AGE3',             // 马穆鲁克：开罗与阿勒颇苏丹要塞
    CRUSADERS: 'MEDI_CASTLE_AGE3',          // 十字军（阿卡），无专属；十字军城堡是拉丁人所建，取地中海套
    RUS: 'SLAV_CASTLE_AGE3',                  // 罗斯的克里姆林是东斯拉夫木石城塞，归斯拉夫
    KARA_KHITAN: 'KHIT_CASTLE_AGE3',          // 西辽即契丹西迁所建，直接沿用契丹形制
    TIMURID: 'TURK_CASTLE_AGE3',              // 帖木儿是突厥化蒙古贵族，撒马尔罕城防属突厥—伊斯兰体系
    DELHI: 'INDI_CASTLE_AGE3',               // 德里：德里苏丹国西里要塞与德里红堡
    CASTILE: 'SPAN_CASTLE_AGE3',             // 卡斯蒂利亚：塞哥维亚与托莱多石砌城堡
    SCOTLAND: 'CELT_CASTLE_AGE3',            // 苏格兰：爱丁堡与高地石构塔堡
    HRE: 'EAST_CASTLE_AGE3',              // 神圣罗马：维也纳与纽伦堡帝国石砌重要塞
    ALMOHAD: 'BERB_CASTLE_AGE3',              // 阿尔摩哈德本身就是柏柏尔马斯穆达部建立的王朝，用柏柏尔堡
    SERBIA: 'SLAV_CASTLE_AGE3',              // 塞尔维亚：贝尔格莱德与斯梅代雷沃石堡
    ILKHANATE: 'MONG_CASTLE_AGE3',           // 伊利汗：大不里士与马拉盖蒙古王汗城堡
    ARAGON: 'SPAN_CASTLE_AGE3',             // 阿拉贡（拉莫塔堡在卡斯蒂利亚—阿拉贡界），取西班牙套
};

export const REGION_TO_BRANCH: Record<string, string> = {
  ACHAEMENIDS: 'PERSIAN',
  AFRICA: 'AFRICA',
  AFRICA_ANTIQUITY: 'AFRICA',
  AFRICA_CASTLE: 'AFRICA',
  AFRICA_IMPERIAL: 'AFRICA',
  AINU: 'NORTHEAST',
  ALMOHAD: 'ORIE',
  AMAZONS: 'ATHENIANS',
  AMERICA: 'AMERICA',
  ANDE: 'INCA',
  ANGLO_SAXON: 'BRITONS',
  ARAGON: 'SPANISH',
  ARMENIANS: 'ARMENIANS',
  ASSYRIAN: 'ORIE',
  BABYLON: 'ORIE',
  BASHU: 'BASHU',
  BENGALIS: 'BENGALIS',
  BENGALIS_ANTIQUITY: 'BENGALIS',
  BERBER: 'BERBER',
  BOHEMIANS: 'BOHEMIANS',
  BRITONS: 'BRITONS',
  BULGARIANS: 'BULGARIANS',
  BURGUNDIANS: 'BURGUNDIANS',
  BURMESE: 'BURMESE',
  BYZANTINE: 'BYZANTINE',
  CARTHAGE: 'ORIE',
  CASTILE: 'SPANISH',
  CELTS_FEUDAL: 'BRITONS',
  CENTRAL: 'CENTRAL',
  CENTRAL_ASIA: 'CENTRAL_ASIA',
  CENTRAL_ASIA_ANTIQUITY: 'CENTRAL',
  CENTRAL_ASIA_CASTLE: 'CENTRAL',
  CENTRAL_ASIA_IMPERIAL: 'CENTRAL',
  CHIMU: 'INCA',
  CRUSADERS: 'FRANKS',
  CUMAN: 'CUMAN',
  DALI: 'BASHU',
  DELHI: 'INDIA',
  EAST: 'EAST',
  EGYPT: 'ORIE',
  ETHIOPIANS: 'ETHIOPIANS',
  FRANKS: 'FRANKS',
  FRENCH: 'FRANKS',
  GEORGIANS: 'GEORGIANS',
  GERMANIC: 'GERMANIC',
  GERMANIC_CASTLE: 'GERMANIC',
  GERMANIC_FEUDAL: 'GERMANIC',
  GERMANIC_IMPERIAL: 'GERMANIC',
  GHANA: 'AFRICA',
  GOJOSEON: 'KOREA',
  GORYEO: 'KOREA',
  GOTHS: 'GOTHS',
  GREEK: 'ATHENIANS',
  GREEK_MERCENARY: 'ATHENIANS',
  GURJARAS: 'GURJARAS',
  HEBREWS: 'ORIE',
  HELLENIC: 'ATHENIANS',
  HEPHTHALITES: 'CENTRAL_ASIA',
  HEXI: 'CENTRAL',
  HITTITES: 'ORIE',
  HRE: 'GERMANIC',
  HUAXIA_IMPERIAL: 'CENTRAL',
  HUNS: 'HUNS',
  ILKHANATE: 'CENTRAL_ASIA',
  IMPERIAL_ROME: 'LATIN',
  INDIA: 'INDIA',
  INDIA_CASTLE: 'INDIA',
  INDIA_FEUDAL: 'INDIA',
  INDIA_IMPERIAL: 'INDIA',
  IROQUOIS: 'AMERICA',
  ITALIANS: 'LATIN',
  JAPAN: 'JAPAN',
  JAPAN_ANTIQUITY: 'JAPAN',
  JAPAN_IMPERIAL: 'JAPAN',
  JAVANESE: 'MALAY',
  JIANGNAN: 'JIANGNAN',
  JOSEON: 'KOREA',
  JURCHEN: 'NORTHEAST',
  KARA_KHITAN: 'CENTRAL_ASIA',
  KHAZARS: 'CENTRAL_ASIA',
  KHITAN: 'KHITAN',
  KHMER: 'KHMER',
  KOREA: 'KOREA',
  KUSH: 'AFRICA',
  KUSHAN: 'CENTRAL_ASIA',
  LATIN: 'LATIN',
  LATIN_CASTLE: 'LATIN',
  LATIN_FEUDAL: 'LATIN',
  LATIN_IMPERIAL: 'LATIN',
  LITHUANIANS: 'LITHUANIANS',
  LOMBARDS: 'GERMANIC',
  MACEDONIAN: 'MACEDONIAN',
  MAGNA_GRAECIA: 'ATHENIANS',
  MAGYAR: 'MAGYAR',
  MALAY: 'MALAY',
  MAMLUKS: 'ORIE',
  MANCHU: 'NORTHEAST',
  MAPUCHE: 'MAPUCHE',
  MAYANS: 'MAYANS',
  MING: 'CENTRAL',
  MOHE: 'NORTHEAST',
  MONGOL: 'MONGOL',
  MONGOLS: 'YURT',
  MUGHAL: 'MUGHAL',
  MUISCA: 'MUISCA',
  NABATAEANS: 'ORIE',
  NANZHAO: 'BASHU',
  NORTH: 'CENTRAL',
  NORTHAM_IMPERIAL: 'AMERICA',
  NORTHEAST: 'NORTHEAST',
  ORIE: 'ORIE',
  ORIE_ANTIQUITY: 'ORIE',
  OTTOMAN: 'ORIE',
  OTTOMAN_IMPERIAL: 'ORIE',
  PASHTUN: 'CENTRAL_ASIA',
  PERSIAN: 'PERSIAN',
  PERSIAN_CASTLE: 'PERSIAN',
  POLES: 'POLES',
  PORTUGUESE: 'PORTUGUESE',
  PORUS: 'INDIA',
  PRE_QIN: 'CENTRAL',
  PURU: 'PURU',
  QIANG: 'CENTRAL',
  ROURAN: 'MONGOL',
  RUS: 'SLAVIC',
  RUSSIAN: 'SLAVIC',
  SAFAVID: 'PERSIAN',
  SASANIAN: 'SASANIAN',
  SCOTLAND: 'BRITONS',
  SCYTHIANS: 'MONGOL',
  SEASIA_ANTIQUITY: 'MALAY',
  SEASIA_CASTLE: 'MALAY',
  SEASIA_FEUDAL: 'MALAY',
  SEASIA_IMPERIAL: 'MALAY',
  SELJUQ: 'TURKS',
  SERBIA: 'SLAVIC',
  SICILIANS: 'SICILIANS',
  SIKH: 'INDIA',
  SLAVIC: 'SLAVIC',
  SLAVIC_CASTLE: 'SLAVIC',
  SLAVIC_FEUDAL: 'SLAVIC',
  SLAVIC_IMPERIAL: 'SLAVIC',
  SOGDIANS: 'CENTRAL_ASIA',
  SONG: 'CENTRAL',
  SOUTHAM_IMPERIAL: 'INCA',
  SPANISH: 'SPANISH',
  SRIVIJAYA: 'MALAY',
  STEPPE: 'YURT',
  STEPPE_ANTIQUITY: 'YURT',
  STEPPE_FEUDAL: 'YURT',
  STEPPE_IMPERIAL: 'YURT',
  SWEDISH: 'GERMANIC',
  TAIRONA: 'INCA',
  TANGUT: 'CENTRAL',
  TARASCAN: 'AMERICA',
  TEHUELCHE: 'INCA',
  TEUTONS: 'GERMANIC',
  THRACIAN: 'THRACIAN',
  TIBET: 'TIBET',
  TIBET_CASTLE: 'TIBET',
  TIBET_IMPERIAL: 'TIBET',
  TIMURID: 'CENTRAL_ASIA',
  TUPI: 'TUPI',
  TURKS: 'TURKS',
  UIGHUR: 'TURKS',
  VANDALS: 'GERMANIC',
  VIETNAMESE: 'VIETNAMESE',
  VIKINGS: 'VIKINGS',
  WESTERN: 'MONGOL',
  WESTERN_CASTLE: 'MONGOL',
  WESTERN_FEUDAL: 'MONGOL',
  WESTERN_IMPERIAL: 'MONGOL',
  WEST_ASIA: 'ORIE',
  WEST_ASIA_ANTIQUITY: 'ORIE',
  WEST_ASIA_CASTLE: 'ORIE',
  WUSUN: 'CENTRAL_ASIA',
  YARLUNG: 'TIBET',   // 🔴 [2026-09-11 主人「萨噶是羌，是青藏，是吐蕃」] 雅隆归青藏，不再归印度
};

export const BRANCH_CASTLE: Record<string, string> = {
  AFRICA: 'AFRI_CASTLE_AGE3',
  AMERICA: 'MESO_CASTLE_AGE3',
  ARMENIANS: 'ARME_CASTLE_AGE3',
  ATHENIANS: 'ATHENIANS_CASTLE_AGE3',
  BASHU: 'SHU_CASTLE_AGE3',
  BENGALIS: 'BENG_CASTLE_AGE3',
  BENGALIS_ANTIQUITY: 'BENG_CASTLE_AGE3',
  BERBER: 'BERB_CASTLE_AGE3',
  BOHEMIANS: 'BOHE_CASTLE_AGE3',
  BRITONS: 'CELT_CASTLE_AGE3',
  BULGARIANS: 'BULG_CASTLE_AGE3',
  BURGUNDIANS: 'BURG_CASTLE_AGE3',
  BURMESE: 'BURM_CASTLE_AGE3',
  BYZANTINE: 'BYZA_CASTLE_AGE3',
  CENTRAL: 'CHIN_CASTLE_AGE3',
  CENTRAL_ASIA: 'CEAS_CASTLE_AGE3',
  CUMAN: 'CUMA_CASTLE_AGE3',
  EAST: 'EAST_CASTLE_AGE3',
  ETHIOPIANS: 'ETHI_CASTLE_AGE3',
  FRANKS: 'FRAN_CASTLE_AGE3',
  GEORGIANS: 'GEOR_CASTLE_AGE3',
  GERMANIC: 'WEST_CASTLE_AGE3',
  GOTHS: 'GOTH_CASTLE_AGE3',
  GURJARAS: 'GURJ_CASTLE_AGE3',
  HUNS: 'HUNS_CASTLE_AGE3',
  INCA: 'INCA_CASTLE_AGE3',
  INDIA: 'INDI_CASTLE_AGE3',
  JAPAN: 'ASIA_CASTLE_AGE3',
  JIANGNAN: 'WU_CASTLE_AGE3',
  KHITAN: 'KHIT_CASTLE_AGE3',
  KHMER: 'SEAS_CASTLE_AGE3',
  KOREA: 'KORE_CASTLE_AGE3',
  LATIN: 'MEDI_CASTLE_AGE3',
  LITHUANIANS: 'LITH_CASTLE_AGE3',
  MACEDONIAN: 'MACEDONIAN_CASTLE_AGE3',
  MAGYAR: 'MAGY_CASTLE_AGE3',
  MALAY: 'MALA_CASTLE_AGE3',
  MAPUCHE: 'MAPU_CASTLE_AGE3',
  MAYANS: 'MAYA_CASTLE_AGE3',
  MONGOL: 'MONG_CASTLE_AGE3',
  MUGHAL: 'HIND_CASTLE_AGE3',
  MUISCA: 'MUIS_CASTLE_AGE3',
  NORTHEAST: 'JURC_CASTLE_AGE3',
  ORIE: 'ORIE_CASTLE_AGE3',
  PERSIAN: 'PERSIAN_CASTLE_AGE3',
  POLES: 'POLE_CASTLE_AGE3',
  PORTUGUESE: 'PORT_CASTLE_AGE3',
  PURU: 'PURU_CASTLE_AGE3',
  ROMA: 'ROMA_CASTLE_AGE3',
  SASANIAN: 'PERS_CASTLE_AGE3',
  SICILIANS: 'SICI_CASTLE_AGE3',
  SLAVIC: 'SLAV_CASTLE_AGE3',
  SPANISH: 'SPAN_CASTLE_AGE3',
  SPARTANS: 'SPARTANS_CASTLE_AGE3',
  THRACIAN: 'THRACIAN_CASTLE_AGE3',
  TIBET: 'TIBET_CASTLE_AGE3',
  TUPI: 'TUPI_CASTLE_AGE3',
  TURKS: 'TURK_CASTLE_AGE3',
  VIETNAMESE: 'VIET_CASTLE_AGE3',
  VIKINGS: 'VIKI_CASTLE_AGE3',
  WEI: 'WEI_CASTLE_AGE3',
};

/**
 * 59 个代表据点与 59 文明专属城堡对应表（2026-09-14 主人定）
 * 大地图 59 个文明专属城堡与代表据点中心城堡一一对应。
 */
export const REP_59_CITY_CASTLES: Readonly<Record<string, string>> = {
    // ── 古典时代 (13 座) ──
    city_luoyang: 'CHIN_CASTLE_AGE3',                 // 中国（洛阳）：北方华北·汉唐城楼
    city_chengdu: 'SHU_CASTLE_AGE3',                  // 蜀（成都）：蜀汉高台斗拱望楼
    city_gusu: 'WU_CASTLE_AGE3',                      // 吴（姑苏）：孙吴水乡飞檐水榭
    city_hedong: 'WEI_CASTLE_AGE3',                   // 曹魏（安邑）：邺城重檐铜雀楼
    city_dublin: 'CELT_CASTLE_AGE3',                  // 凯尔特（都柏林）：苏格兰高地圆塔
    city_gaodacheng: 'BENG_CASTLE_AGE3',              // 孟加拉（高达城）：恒河三角洲砖石堡
    city_luoma: 'ROMA_CASTLE_AGE3',                   // 罗马（罗马城）：帝国古典方石要塞
    city_bosibolisi: 'PERSIAN_CASTLE_ACHAEMENIDS_AGE3', // 阿契美尼德（波斯波利斯）：万国门石台
    city_yadian: 'ATHENIANS_CASTLE_AGE3',             // 雅典（雅典）：卫城多立克柱廊卫堡
    city_sparta: 'SPARTANS_CASTLE_AGE3',              // 斯巴达（斯巴达）：泰格特斯山青石重垒
    city_salonica: 'MACEDONIAN_CASTLE_AGE3',          // 马其顿（佩拉）：佩拉要塞重石堡
    city_plovdiv: 'THRACIAN_CASTLE_AGE3',             // 色雷斯（普罗夫迪夫）：罗多彼山蛮族巨石堡
    city_atuoke: 'PURU_CASTLE_AGE3',                  // 普鲁（阿托克）：旁遮普红砂岩堡 (关隘)

    // ── 封建时代 (13 座) ──
    city_bali: 'FRAN_CASTLE_AGE3',                    // 法兰克（巴黎）：卢瓦尔河双圆塔石堡
    city_toledo: 'GOTH_CASTLE_AGE3',                  // 哥特（托莱多）：早期蛮族石砌据点
    city_junshitandingbao: 'BYZA_CASTLE_AGE3',         // 拜占庭（君士坦丁堡）：君士坦丁堡红砖穹顶堡
    city_feiluzhabade: 'PERS_CASTLE_AGE3',            // 波斯（菲鲁扎巴德）：萨珊泰西封砖石穹顶堡 (关隘)
    city_wupusala: 'VIKI_CASTLE_AGE3',                // 维京（乌普萨拉）：斯堪的纳维亚环形堡垒 (关隘)
    city_saigede: 'HUNS_CASTLE_AGE3',                 // 匈人（塞格德）：简易木石混合要塞 (关隘)
    city_aksum: 'ETHI_CASTLE_AGE3',                   // 埃塞俄比亚（阿克苏姆）：阿克苏姆巨石柱堡
    city_feisi: 'BERB_CASTLE_AGE3',                   // 柏柏尔（非斯）：撒哈拉泥砖防御碉堡
    city_angkor: 'SEAS_CASTLE_AGE3',                  // 高棉（吴哥）：吴哥窟砂岩塔
    city_teernuowo: 'BULG_CASTLE_AGE3',               // 保加利亚（特尔诺沃）：普雷斯拉夫圆顶城堡
    city_patan: 'GURJ_CASTLE_AGE3',                   // 瞿折罗（帕坦）：索姆纳特多层砂岩堡
    city_ailiwen: 'ARME_CASTLE_AGE3',                 // 亚美尼亚（埃里温）：埃奇米阿津石砌山顶堡
    city_linhuang: 'KHIT_CASTLE_AGE3',                // 契丹（临潢府）：辽阳八角木石塔楼

    // ── 城堡时代 (29 座) ──
    city_lundun: 'CELT_CASTLE_AGE3',                  // 不列颠（伦敦）：苏格兰高地圆塔
    city_kenisibao: 'WEST_CASTLE_AGE3',               // 条顿（柯尼斯堡）：莱茵河方型石砌堡 (关隘)
    city_kyoto: 'ASIA_CASTLE_AGE3',                   // 日本（京都）：姬路式多重天守阁
    city_damasikusi: 'ORIE_CASTLE_AGE3',              // 萨拉森（大马士革）：开罗萨拉丁大城堡
    city_karakorum: 'MONG_CASTLE_AGE3',               // 蒙古（哈拉和林）：哈拉和林木石大斡耳朵
    city_tenochtitlan: 'MESO_CASTLE_AGE3',            // 阿兹特克（特诺奇提特兰）：特诺奇蒂特兰金字塔
    city_tikal: 'MAYA_CASTLE_AGE3',                   // 玛雅（蒂卡尔）：奇琴伊察阶梯神庙堡
    city_kaesong: 'KORE_CASTLE_AGE3',                 // 高丽（开城）：汉阳南汉山城堞楼
    city_venice: 'MEDI_CASTLE_AGE3',                  // 意大利（威尼斯）：威尼斯总督红顶宫
    city_deli: 'HIND_CASTLE_AGE3',                    // 印度斯坦（德里）：德里红堡莫卧儿红砂岩
    city_cusco: 'INCA_CASTLE_AGE3',                   // 印加（库斯科）：库斯科萨克萨瓦曼巨石堡
    city_budapeisi: 'MAGY_CASTLE_AGE3',               // 马扎尔（布达佩斯）：布达佩斯多瑙河石堡
    city_jifu: 'SLAV_CASTLE_AGE3',                    // 斯拉夫（基辅）：莫斯科白石克里姆林
    city_timbuktu: 'AFRI_CASTLE_AGE3',                // 马里（廷巴克图）：杰内大清真寺泥石堡
    city_malacca: 'MALA_CASTLE_AGE3',                 // 马来（马六甲）：马六甲海峡水上海堡
    city_pagan: 'BURM_CASTLE_AGE3',                   // 缅甸（蒲甘）：蒲甘千佛塔金顶堡
    city_shenglong: 'VIET_CASTLE_AGE3',               // 越南（昇龙）：顺化京城多檐城门楼
    city_samaerhan: 'CEAS_CASTLE_AGE3',               // 鞑靼（撒马尔罕）：撒马尔罕帖木儿蓝顶堡
    city_salai: 'CUMA_CASTLE_AGE3',                   // 库曼（萨莱）：黑海北岸克里米亚要塞
    city_weierniwusi: 'LITH_CASTLE_AGE3',             // 立陶宛（维尔纽斯）：特拉凯湖心红砖城堡
    city_dijon: 'BURG_CASTLE_AGE3',                   // 勃艮第（第戎）：第戎公爵宫圆锥塔
    city_palermo: 'SICI_CASTLE_AGE3',                 // 西西里（巴勒莫）：诺曼巴勒莫王宫堡
    city_kelakefu: 'POLE_CASTLE_AGE3',                // 波兰（克拉科夫）：马尔堡红砖条顿古堡
    city_bulage: 'BOHE_CASTLE_AGE3',                  // 波希米亚（布拉格）：卡尔施泰因城堡
    city_tanjiawuer: 'INDI_CASTLE_AGE3',              // 达罗毗荼（坦贾武尔）：坦贾武尔寺庙高塔堡
    city_dibilisi: 'GEOR_CASTLE_AGE3',                // 格鲁吉亚（第比利斯）：高加索斯万石塔古堡
    city_huining: 'JURC_CASTLE_AGE3',                 // 女真（会宁府）：会宁府上京双檐角楼
    city_bacata: 'MUIS_CASTLE_AGE3',                  // 穆伊斯卡（巴卡塔）：瓜塔维塔黄金湖石堡
    city_guanabara: 'TUPI_CASTLE_AGE3',               // 图皮（瓜纳巴拉）：亚马逊雨林木栅重垒 (关隘)

    // ── 帝国时代 (4 座) ──
    city_madeli: 'SPAN_CASTLE_AGE3',                  // 西班牙（马德里）：塞戈维亚阿尔卡萨堡
    city_lisiben: 'PORT_CASTLE_AGE3',                 // 葡萄牙（里斯本）：贝伦塔大西洋海堡
    city_buersa: 'TURK_CASTLE_AGE3',                  // 奥斯曼（布尔萨）：托普卡珀皇宫圆堡
    city_tucapel: 'MAPU_CASTLE_AGE3',                 // 马普切（图卡佩尔）：安第斯南麓木石据点 (关隘)
};

/** 城堡素材解析：**代表据点 → 势力专属 → 文化区 → 风格集默认**。 */
export function resolveCastleAsset(style: string, factionId?: string | null, region?: string | null, cityId?: string | null): string {
    if (cityId && REP_59_CITY_CASTLES[cityId]) {
        return REP_59_CITY_CASTLES[cityId];
    }
    if (factionId) {
        const byFaction = FACTION_CASTLE[factionId];
        if (byFaction) return byFaction;
    }
    if (region) {
        const byRegion = REGION_CASTLE[region as RegionType];
        if (byRegion) return byRegion;
        // 59 支兜底：region → 建筑分支 → 专属城堡
        const branch = REGION_TO_BRANCH[region];
        if (branch && BRANCH_CASTLE[branch]) return BRANCH_CASTLE[branch];
    }
    if (style === 'ANDE') return 'INCA_CASTLE_AGE3';
    if (style === 'YURT') return 'MONG_CASTLE_AGE3';
    if (style === 'MOBEI_MONGOL') return 'MONG_CASTLE_AGE3'; // 三级漠北蒙古毡帐营地（2026-09-16）
    return `${style}_CASTLE_AGE3`;
}

