/**
 * 势力固定显示色：势力 id → 专属 hex（全局唯一）。
 * 有尚色/服色依据的政权、民族、起义写入此处；其余每局随机（FactionManager）。
 * 随机池避开红/黄/青色相楔及近白、近黑区。
 *
 * 配色原则（2026-06-11）：
 * - **有史料尚色/服色** → 固定（汉赤、秦辽契丹尚黑、唐魏尚黄、李朝/蒙古尚白、武田赤备等）。
 * - **无专属色** → 按史地特征取色（水师用海蓝、忍者用墨紫、铁骑用铁褐、草原用土黄等），
 *   远征区段内 **红/黄/蓝/紫/褐/青均匀分布**，避免扎堆同色（尤其不可因避黑红而全改绿）。
 *
 * 【仅正规势力】panjun 叛军不在此表；叛军无 hex 势力色，见 RebelFlagConstants / CityAssetManager。
 */

const _FIXED: Record<string, string> = {
    // ── 红·尚赤 / 火德 / 复明 / 起义 ──
    han_d: '#C41E1E', // 汉（赤旗黑字，史料固定；见 FLAG_TEXT_BLACK_STYLE_FACTIONS）
    shu: '#2E7D32', // 蜀（绿）
    wu: '#C03520', // 吴
    sui: '#B83030', // 隋
    song: '#DC4850', // 宋（明亮珊瑚红；与大明深绛对照）
    ming_d: '#7A1418', // 大明（深绛暗红；南京↔临安邻近易混）
    chu: '#C03028', // 楚
    yue_d: '#D03030', // 岳（黑旗白字，史料固定；见 FLAG_TEXT_WHITE_STYLE_FACTIONS）
    xichu: '#B03830', // 西楚
    erzhu: '#962828', // 尔朱
    jiujiang: '#A83830', // 九江
    wazhai: '#903028', // 瓦岗
    red_turban: '#A83028', // 红巾
    xushouhui: '#883030', // 天完
    haoding: '#C05040', // 红袄(郝定)
    chimei: '#972838', // 赤眉
    yang_aner: '#B84838', // 登(杨安儿)
    dashun: '#9A3030', // 大顺
    daxi_ming: '#943228', // 大西
    xiqin: '#AE3434', // 西秦
    hongguang: '#B82E2E', // 弘光(南明复明)
    longwu: '#B43434', // 隆武
    yongli: '#AA3636', // 永历

    // ── 黄·土德尚黄 ──
    wei: '#B07818', // 魏（深琥珀土黄；汴梁↔长安邻近易混）
    tang: '#F0CC40', // 唐（明亮赭黄；与魏深黄对照）
    manzhou_d: '#D4A528', // 大清
    tuoba: '#B08220', // 拓跋
    xin: '#A88A24', // 新
    chen: '#C49830', // 陈
    chunshen: '#D0AA35', // 春申
    xu: '#A67C2A', // 徐
    baibo: '#E0B040', // 黄巾
    zhangshicheng: '#B89838', // 大周(张士诚)

    // ── 青·木德尚青 ──
    xia: '#3A8F83', // 夏
    xiao_d: '#2E7568', // 萧(兰陵萧氏)
    lulin: '#48A090', // 绿林

    // ── 白·金德尚白 / 蒙古尚白 ──
    shang: '#E0CEB0', // 商（暖沙象牙；与晋纯白 #FFFFFF 拉开色差）
    jin: '#FFFFFF', // 晋（纯白；金德尚白顶格）
    dajin: '#DCD8D0', // 大金
    yuan_d: '#ECE8E0', // 大元
    da_yuan: '#D8D4CC', // 北元
    bailian: '#E8E8E4', // 白莲
    menggu_d: '#E2DED6', // 蒙古
    dangxiang: '#D6D2CA', // 大夏(党项)
    jurchen: '#CEC8C0', // 女真
    joseon: '#E4E0DC', // 朝鲜(李朝尚白)

    // ── 朝鲜精锐远征势力（2026-06-11；hex 全局唯一，彼此 RGB 间距拉开）──
    gaogouli: '#354E78', // 高句丽·铠马（钢蓝）
    xuantu: '#1A1A24', // 玄菟·皂衣（墨黑）
    xinluo: '#2858A0', // 新罗·花郎（王室蓝）
    baiji: '#3A8868', // 百济·九誓幢（翡翠绿）
    goryeo: '#52A0B8', // 高丽·鹰扬龙虎（青瓷）
    dingan: '#725838', // 定安·别武班（边镇褐）
    sambyeol: '#8C3838', // 三别·三别抄（抗蒙战褐红）
    hai2: '#A89050', // 海州·朝鲜甲士（铜甲褐）
    jeolla: '#145870', // 全罗·龟船水军（顺天深海蓝）

    // ── 日本精锐远征势力（2026-06-11；hex 全局唯一，彼此 RGB 间距拉开）──
    ashikaga: '#B89840', // 室町足利（枯茶金）
    so: '#4488A8', // 对马弘安御敌（海防青）
    zhuqian: '#9A8060', // 筑前·异国警固番役（博多土）
    chosokabe: '#1A7090', // 长宗我部水军（四国海蓝）
    satsuma: '#5A3830', // 萨摩（南九州焦土褐）
    hojo_d: '#523858', // 北条·风魔（深紫）
    iga_d: '#3A3548', // 伊贺·伊贺众（忍墨蓝）
    hashiba: '#D8A010', // 丰臣七手组（丰臣金）
    kai: '#C82030', // 武田赤备（赤备红）
    owari: '#705818', // 织田母衣众（尾张赭）
    jinchuan: '#68B0C8', // 今川马回众（骏河蓝）
    echigo: '#B0C0D0', // 上杉轩猿众（白旗银）
    aki: '#103858', // 安艺九鬼水军（濑户深青）
    izumo: '#607888', // 出云（阴山灰蓝）
    honda: '#485860', // 本多（铁灰）
    edo: '#2C3A58', // 德川·书院番队（幕藩深蓝）
    aizu: '#C0CCD8', // 会津（会津白）
    fujiwara: '#9A7038', // 奥州藤原（陆奥褐）
    kakizaki: '#507878', // 松前（北境青灰）
    nanbu: '#584848', // 陆奥南部（寒地紫褐）
    dayu: '#7A6050', // 大隅（南九州赭）
    anmei: '#1A6090', // 奄美海贼众（岛链海蓝）
    yamato: '#7840A0', // 大和健儿（朝廷紫）
    ayinu: '#B88048', // 虾夷（皮革褐）
    beihai: '#7A5028', // 北海（深褐）
    ryukyu: '#C87840', // 琉球那霸水师（珊瑚橙；无尚赤）

    // ── 东北精锐远征势力（2026-06-11；hex 全局唯一）──
    bohai: '#4A7888', // 渤海·神贲禁卫（海东青灰）
    wanyan_d: '#8C4848', // 完颜·拐子马队（女真铁锈褐）
    jinzhou: '#A06830', // 锦州·辽东铁骑（铜橙；无尚赤）
    qing: '#906838', // 庆州·忠孝军（晚金琥珀）
    aisin_d: '#E0DCD4', // 爱新觉罗·巴牙喇（白甲浅灰）
    manzhou: '#C8A820', // 满洲·八旗劲旅（旗黄）
    aola: '#285870', // 敖拉·黑龙江水师（北国深青）
    hezhe: '#3A6858', // 赫哲·索伦劲旅（林海绿）
    zu_d: '#6A5848', // 祖氏·关宁铁骑（关宁黄褐）
    mao_wenlong: '#7A7040', // 毛文龙·东江劲旅（皮岛土褐）

    // ── 草原精锐远征势力（2026-06-11；hex 全局唯一）──
    borjigin: '#6A5040', // 孛儿只斤·那可儿（漠北褐）
    ogodei: '#8A7050', // 窝阔台·探马赤（草原土黄）
    xiongnu: '#5A2838', // 匈奴·鸣镝（玄赤，史料尚色）
    tujue: '#4878A0', // 突厥·狼卫（狼青）
    huige: '#9A8048', // 回纥·铁骑（金黄）
    shatuo: '#585868', // 沙陀·铁骑（铁灰）
    xianbei: '#6A8878', // 鲜卑·王庭（弹汗青）
    gaoche: '#7A6848', // 高车·战车（轮车褐）
    rouran: '#8A4858', // 柔然·铁骑（蠕蠕紫褐）
    xueyantuo: '#506878', // 薛延陀·同罗（铁勒青灰）
    naiman: '#4A5870', // 乃蛮·重骑（西山蓝灰）
    ongut: '#CAC6B8', // 汪古·突骑（白鞑靼浅灰）
    wala: '#3A5878', // 瓦剌·铁骑（卫拉深蓝）

    // ── 西域精锐远征势力（2026-06-11；hex 全局唯一）──
    qiuci: '#8A6848', // 龟兹·重甲（冶铁褐）
    yutian: '#6A4898', // 于阗·尉迟（崇佛紫）
    kala: '#3A7898', // 喀喇汗·铁骑（绿洲青）
    yiduhu: '#B88058', // 亦都·高昌（赭土）
    shule: '#509070', // 疏勒·盘橐（弓弩绿）
    yanqi: '#4888A8', // 焉耆·龙骑（北道水蓝）
    wusun: '#7090B0', // 乌孙·昆莫（钢蓝）
    chagatai: '#887050', // 察合·蒙兀儿（漠西褐）
    dayuan: '#A07048', // 大宛·汗血天马（费尔干纳褐）
    shache: '#688858', // 莎车·左右骑（铁山青玉绿）
    geluolu: '#6A7068', // 葛逻禄·背弓（善射灰青）
    anxi: '#9A3830', // 安西·大唐安西军（唐军西征赭红）

    // ── 中亚精锐远征势力（2026-06-11；hex 全局唯一）──
    kushan: '#9A8838', // 贵霜·重装甲骑（迦腻色伽金褐）
    yanda: '#586868', // 嚈哒·铁骑（白匈奴灰青）
    saman: '#2E7858', // 萨曼·古拉姆（河中深绿）
    huarazim: '#A85828', // 花剌子模·铁骑（沙漠赭）
    qincha: '#5080A0', // 钦察·康里精骑（草原钢蓝）
    tiemuer: '#904828', // 帖木儿·重装突骑（帖木儿赭红）
    kazakh: '#78A8C0', // 哈萨克·轻骑兵（七河天青）
    durrani: '#686048', // 杜兰尼·阿卜达里（坎大哈褐）
    rajput: '#C06828', // 拉杰普特·武士（萨卡赭橙）
    mughal: '#286850', // 莫卧儿·战象军（帝国深绿）
    maratha: '#B85820', // 马拉塔·轻骑兵（德干橙褐）
    sikh: '#184880', // 锡克·尼杭（尼杭深蓝）
    sasan: '#683878', // 萨珊·萨瓦兰（波斯紫）
    osman: '#782830', // 奥斯曼·耶尼切里（苏丹深红）

    // ── 青藏精锐远征势力（2026-06-11；hex 全局唯一）──
    shaodang: '#8A7060', // 烧当·湟中义从羌（河湟褐）
    gusiluo: '#6A8A78', // 唃厮啰·青唐甲骑（河湟青玉）
    tubo: '#4A2868', // 吐蕃·桂级骑（雪域深紫）
    tuyu_d: '#5A9888', // 吐谷浑·青海骢（青海湖碧）
    xiangxiong: '#7A5848', // 象雄·武士（苯教铜褐）
    gar_kham: '#8A4840', // 德司·康巴骁骑（康区赭）
    guge: '#9A8878', // 古格·甲兵（阿里土黄）
    khoshut: '#B0A898', // 和硕特·铁骑（卫拉特浅灰）
    pazhu: '#486870', // 帕竹·甲兵（后藏青灰）
    gurkha: '#C85838', // 廓喀·弯刀（喜马拉雅赭）

    // ── 滇缅精锐远征势力（2026-06-11；hex 全局唯一）──
    nanzhao: '#8C3830', // 南诏·罗苴子（南诏深红）
    dali: '#5A9880', // 大理·白军（苍洱碧玉）
    bayinnaung: '#B88840', // 莽应·东吁象阵兵（象阵金褐）
    konbaung: '#A87848', // 贡榜·卡塞骑（缅北金褐）
    siam: '#D07028', // 暹罗·皇家象骑兵（暹罗橙）
    pagan: '#9A7048', // 蒲甘·战象军（蒲甘赭）
    pyu: '#A09068', // 骠国·巨象阵（骠国沙褐）
    champa: '#4A7898', // 占婆·国水师（占城海蓝）
    chenla: '#8A7850', // 真腊·双弓弩象营（吴哥金褐）
    luchuan: '#6A9858', // 麓川·百夷象兵（傣掸绿）

    // ── 岭南精锐远征势力（2026-06-11；hex 全局唯一）──
    zhuang_d: '#5A8848', // 壮·广西狼兵（俍兵绿）
    xian_d: '#C84868', // 冼·俚人武士（高凉绯）
    dayue: '#5A2878', // 大越·神武军（安南紫）
    jing: '#4878A8', // 京·铁突军（华闾青）
    trinh: '#384878', // 郑主·圣翊军（清化靛）
    nguyen_guangnan: '#C85030', // 阮主·西山军（顺化橙）
    guangnanguo: '#382028', // 广南·黑旗军（旗黑）
    ming_zheng: '#284868', // 明郑·铁人军（东宁深蓝）
    paiwan: '#6A5840', // 排湾·出草勇士（山地褐）
    // ryukyu 见日本区旁注（改挂岭南远征）

    // ── 南方精锐远征势力（2026-06-11；hex 全局唯一）──
    nantang_d: '#4A68A0', // 南唐·黑云长剑都（金陵青）
    beifu_d: '#4E7080', // 北府·北府兵（江淮青灰）
    sunwu_d: '#2878A0', // 孙吴·解烦兵（武昌蓝）
    qian_d: '#5888A8', // 钱·游奕军（吴越水蓝）
    heng: '#6A7858', // 衡州（临烝；无远征番号）
    wangyan: '#5A7068', // 彦·八字军（太行飞狐）
    qi_d: '#388858', // 戚·戚家军（横屿藤牌绿）
    tianxiong: '#6A4838', // 天雄·天雄军（明末河北褐）
    sunqin: '#485868', // 潼津·督标秦军（关中青灰）
    wuliangha: '#7A6850', // 兀良·朵颜三卫（兀良哈土褐）
    tujia_d: '#4A7860', // 土家·白杆兵（石柱土司绿）

    // ── 中原精锐远征势力（2026-06-11；hex 全局唯一）──
    cao_d: '#4A2E28', // 曹·虎豹骑（曹魏深褐）
    wuzhou_d: '#B85898', // 武周·控鹤军（则天紫）
    zhuliang_d: '#6A4830', // 朱梁·魏博牙兵（大梁赭）
    ranwei_d: '#508878', // 冉魏·乞活军（冀南青灰）
    zhou: '#6A7A90', // 周·虎贲三千（岐山青灰）
    // tang/wei/qin/shang/xia/sui/fu/sunqin 见上方尚色表
    // chu/song/chen/xiao_d/yue_d/ming_d/haoding 见南方表

    // ── 黑·水德尚黑 / 契丹黑旗 ──
    qin: '#1C1C1C', // 秦
    liao_d: '#302E28', // 大辽
    fu: '#444030', // 苻
    yuwen: '#565048', // 宇文
    qidan: '#36322C', // 契丹
};

function assertUniqueFixedColors(map: Record<string, string>): void {
    const hexOwner = new Map<string, string>();
    for (const [fid, hex] of Object.entries(map)) {
        const key = hex.toUpperCase();
        const prev = hexOwner.get(key);
        if (prev) {
            throw new Error(
                `[HistoricalFactionColors] hex 重复: ${fid} 与 ${prev} 均为 ${hex}`,
            );
        }
        hexOwner.set(key, fid);
    }
}

assertUniqueFixedColors(_FIXED);

export const HISTORICAL_FACTION_COLORS: Readonly<Record<string, string>> = Object.freeze({ ..._FIXED });

export const RESERVED_FACTION_COLOR_HEXES: ReadonlySet<string> = new Set(
    Object.values(HISTORICAL_FACTION_COLORS),
);

export const RESERVED_COLOR_MIN_RGB_DISTANCE = 28;

export const RANDOM_PALETTE_RED_HUE_MIN = 350;
export const RANDOM_PALETTE_RED_HUE_MAX = 18;

export const RANDOM_PALETTE_YELLOW_HUE_MIN = 38;
export const RANDOM_PALETTE_YELLOW_HUE_MAX = 62;

/** 木德「尚青/苍」色相楔（勿用于随机池） */
export const RANDOM_PALETTE_CYAN_HUE_MIN = 155;
export const RANDOM_PALETTE_CYAN_HUE_MAX = 195;

/** 近白区：高亮低饱和（勿用于随机池） */
export const RANDOM_PALETTE_WHITE_LIGHTNESS_MIN = 78;
export const RANDOM_PALETTE_WHITE_SATURATION_MAX = 28;

/** 近黑区：低亮低饱和（勿用于随机池） */
export const RANDOM_PALETTE_BLACK_LIGHTNESS_MAX = 24;
export const RANDOM_PALETTE_BLACK_SATURATION_MAX = 45;

/**
 * 旗号汉字黑白分界 — 唯一阈值（亮度 0–255 的正中值 128）。
 *
 * | 旗面亮度 lum | 汉字 fill | 描边 stroke | 适用 |
 * |---|---|---|---|
 * | lum < 128（深旗） | 浅色 `#f0f0e8` | 黑边 | 白字 |
 * | lum ≥ 128（浅旗） | 深色 `#1a1a1a` | 白边 | 黑字 |
 *
 * 固定色（HistoricalFactionColors）与随机色（FactionManager）**共用此阈值**，禁止另设第二套（如旧版 <50）。
 * 实现：`CityAssetManager.resolveFlagTextIsDark`；审计：`npm run flag-text:check`
 */
export const FLAG_TEXT_LUM_THRESHOLD = 128;

/** 强制白字（无视 lum；史料可考）— 岳家军黑旗白字等 */
export const FLAG_TEXT_WHITE_STYLE_FACTIONS: ReadonlySet<string> = new Set(['yue_d']);

/** 强制黑字（无视 lum；史料可考）— 汉赤旗黑字等 */
export const FLAG_TEXT_BLACK_STYLE_FACTIONS: ReadonlySet<string> = new Set(['han_d']);
