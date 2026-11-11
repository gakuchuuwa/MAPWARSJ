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
 * 【仅正规势力】叛军（panshu，特殊势力）不在此表；叛军无 hex 势力色，见 RebelFlagConstants / CityAssetManager。
 */
import { getLineageRoot } from './FactionLineage';

const _FIXED: Record<string, string> = {
    // ── 2026-10-25 按史补势力 ──
    jiaohuangguo: '#D9C07A', // 教皇国（教廷金）
    ghana_diguo: '#A9842B', // 加纳帝国（瓦加杜金）
    yalan: '#6E4A6B', // 亚兰·大马士革（紫）
    // ── 红·尚赤 / 火德 / 复明 / 起义 ──
    han_d: '#C41E1E', // 汉（赤旗黑字，史料固定；见 FLAG_TEXT_BLACK_STYLE_FACTIONS）
    shu: '#2E7D32', // 蜀（绿）
    wu: '#C03520', // 吴
    sui: '#B83030', // 隋
    song: '#DC4850', // 宋（明亮珊瑚红；与大明深绛对照）
    ming_d: '#7A1418', // 大明（深绛暗红；南京↔临安邻近易混）
    jianwen: '#8C3B2E', // 建文（靖难中的建文朝廷 1399–1402；赭红）
    shunde: '#6B2E3A', // 顺德（宁王朱宸濠 1519；紫檀偏绛）
    erzhu: '#962828', // 尔朱
    xushouhui: '#883030', // 天完·红巾军（元末徐寿辉赤旗；避 lvbu 撞色）
    chimei: '#972838', // 赤眉
    yang_aner: '#B84838', // 登(杨安儿)
    dashun: '#9A3030', // 大顺
    daxi_ming: '#943228', // 大西
    longwu: '#B43434', // 隆武

    // ── 黄·土德尚黄 ──
    wei: '#5C3D7A', // 魏国（战国魏·大梁玄紫，与曹魏蓝、北魏黑、冉魏褐区分）
    caowei: '#3058A9', // 曹魏（曹魏蓝）
    tang: '#F5E05A', // 唐·土德尚黄（明黄旗；主人 2026-10-24 令「唐应该是黄色，不是黑色」，原玄色 #241E22 作废）
    manzhou_d: '#D4A528', // 大清
    tuoba: '#242220', // 拓跋（北魏水德尚黑）
    chen: '#C49830', // 陈
    baibo: '#E0B040', // 黄巾
    zhangshicheng: '#B89838', // 大周(张士诚)

    // ── 青·木德尚青 ──

    // ── 白·金德尚白 / 蒙古尚白 ──
    shang: '#E0CEB0', // 商（暖沙象牙；与晋纯白 #FFFFFF 拉开色差）
    jin: '#C4342A', // 晋（春秋晋国·曲沃；姬姓宗周尚赤）
    dajin: '#DCD8D0', // 大金
    yuan_d: '#ECE8E0', // 大元
    bailian: '#E8E8E4', // 白莲
    menggu_d: '#E2DED6', // 蒙古
    dangxiang: '#D6D2CA', // 大夏(党项)
    joseon: '#E4E0DC', // 朝鲜(李朝尚白)

    // ── 朝鲜精锐远征势力（2026-06-11；hex 全局唯一，彼此 RGB 间距拉开）──
    gaogouli: '#B89830', // 高句丽·铁骑（黄/黑/白）
    xinluo: '#2858A0', // 新罗·花郎（王室蓝）
    baiji: '#2C2C2E', // 百济·九誓幢（扶余黑）
    goryeo: '#3A1818', // 高丽·鹰扬龙虎（黑/赤）

    // ── 日本精锐远征势力（2026-06-11；hex 全局唯一，彼此 RGB 间距拉开）──
    ashikaga: '#B89840', // 室町足利（枯茶金）
    yamato: '#5F4B8B', // 大和朝廷（平安；冠位十二阶以紫为最上）
    so: '#4488A8', // 对马弘安御敌（海防青）
    goto: '#2F6E8F', // 五岛（宇久氏·五岛氏）海峡水军（海青）
    omura: '#3D6E5A', // 大村（肥前吉利支丹大名，海港绿）
    wandan: '#6B4E71', // 万丹（胡椒港紫）
    chosokabe: '#1A7090', // 长宗我部（四国海蓝）
    iga_d: '#3A3548', // 伊贺·伊贺众（忍墨蓝）
    fujiwara: '#9A7038', // 奥州藤原（陆奥褐）
    kakizaki: '#507878', // 松前（北境青灰）
    kaga_d: '#5B8A6E', // 加贺·一向军（北陆绿灰）
    date_d: '#3D6A7C', // 伊达·伊达铁骑（奥州蓝灰）
    otomo_d: '#946848', // 大友·大友水军（丰后褐）
    suwa_d: '#5A6888', // 诹访·诹访神党（信浓湖蓝灰）
    ryukyu: '#C87840', // 琉球那霸水师（珊瑚橙；无尚赤）

    // ── 东北精锐远征势力（2026-06-11；hex 全局唯一）──
    bohai: '#533A82', // 渤海·神贲禁卫（渤海尚紫）


    // ── 草原精锐远征势力（2026-06-11；hex 全局唯一）──
    xiongnu: '#5A2838', // 匈奴·控弦之士（玄赤，史料尚色）
    tujue: '#4878A0', // 突厥·狼卫（狼青）
    shatuo: '#585868', // 沙陀·铁骑（铁灰）
    xianbei: '#283028', // 鲜卑·王庭（《魏书》黑旗黑甲尚黑）
    gaoche: '#7A6848', // 高车·战车（轮车褐）
    rouran: '#4A3832', // 柔然·铁骑（草原土褐）
    xueyantuo: '#506878', // 薛延陀·同罗（铁勒青灰）
    naiman: '#4A5870', // 乃蛮·重骑（西山蓝灰）
    ongut: '#CAC6B8', // 汪古·突骑（白鞑靼浅灰）
    wala: '#3A5878', // 瓦剌·铁骑（卫拉深蓝）

    // ── 西域精锐远征势力（2026-06-11；hex 全局唯一）──
    qiuci: '#2A5CAA', // 龟兹·精兵（青金石蓝，克孜尔石窟）
    kala: '#1B3B2B', // 喀汗·阿斯古拉姆（黑绿）
    shule: '#509070', // 疏勒·盘橐（弓弩绿）
    yanqi: '#A83838', // 焉耆·龙骑（尚红）
    wusun: '#7090B0', // 乌孙·昆莫（钢蓝）
    chagatai: '#C41E2D', // 察合台（耿恭·汉系赤红）
    dayuan: '#A07048', // 大宛·汗血天马（费尔干纳褐）
    shache: '#688858', // 莎车·左右骑（铁山青玉绿）
    geluolu: '#6A7068', // 葛逻禄·背弓（善射灰青）

    // ── 中亚精锐远征势力（2026-06-11；hex 全局唯一）──
    yanda: '#586868', // 嚈哒·铁骑（白匈奴灰青）
    saman: '#201C18', // 萨曼·古拉姆（黑衣大食尚黑）
    huarazim: '#252525', // 花剌子模·钦察精骑（黑旗）
    qincha: '#5080A0', // 钦察·钦察弓骑兵（草原钢蓝）
    tiemuer: '#005689', // 帖木儿·察合台突骑（琉璃蓝，撒马尔罕蓝色穹顶）
    kazakh: '#78A8C0', // 哈萨克·轻骑兵（七河天青）
    seljuq: '#487868', // 塞尔·桑贾尔禁卫（木鹿青绿）

    // ── 青藏精锐远征势力（2026-06-11；hex 全局唯一）──
    shaodang: '#8A7060', // 烧当·湟中义从羌（河湟褐）
    tubo: '#4A2868', // 吐蕃·却杰军（雪域深紫）
    xiangxiong: '#7A5848', // 象雄·武士（苯教铜褐）
    gar_kham: '#8A4840', // 德司·康巴骁骑（康区赭）
    khoshut: '#B0A898', // 和硕特·铁骑（卫拉特浅灰）
    gurkha: '#C85838', // 廓喀·弯刀（喜马拉雅赭）

    dianguo: '#3878A0', // 滇·滇池兵（滇池蓝）
    // ── 滇缅精锐远征势力（2026-06-11；hex 全局唯一）──
    nanzhao: '#EFECE6', // 南诏·罗苴子（白虎皮尚白）
    dali: '#F4F1EB', // 大理·白军（大白国尚白）
    konbaung: '#D0A83A', // 贡榜·禁军（缅北崇金黄）
    siam: '#D07028', // 暹罗·皇家象骑兵（暹罗橙）
    pagan: '#C49828', // 蒲甘·缅王战象（佛国金）
    pyu: '#A09068', // 骠国·巨象阵（骠国沙褐）
    champa: '#4A7898', // 占婆·国水师（占城海蓝）
    chenla: '#8A7850', // 真腊·双弓弩象营（吴哥金褐）
    luchuan: '#6A9858', // 麓川·百夷象兵（傣掸绿）

    // ── 岭南精锐远征势力（2026-06-11；hex 全局唯一）──
    dayue: '#D4B830', // 大越·白藤江水师（安南黄）

    ming_zheng: '#284868', // 明郑·铁人军（东宁深蓝）
    paiwan: '#6A5840', // 排湾·出草勇士（山地褐）
    // ryukyu 见日本区旁注（改挂岭南远征）

    // ── 南方精锐远征势力（2026-06-11；hex 全局唯一）──
    sunwu_d: '#D49B24', // 孙吴·解烦兵（武昌；《三国志·吴主传》黄龙建号、土德尚黄，与春秋吴国赤红、杨吴青绿区分）
zhangchu: '#7A2E6B', // 张楚·陈胜（与楚、马楚同字重旗，取紫褐）
desheng: '#2E6B7A', // 德胜·刘通
    // 🔴 [2026-11-05 按A执行] wuzhou_yijun（婺州义军）已并入隋国，固定色删除
    tianxiong: '#6A4838', // 魏博·牙兵（大名河朔褐）
    huaixi: '#5B7F6A', // 淮西镇·骡军（蔡州，灰青绿）
    gengshi: '#7A5C9E', // 更始
    shierShijun: '#3E7C8C', // 十二使君
    xishan: '#C47A9B', // 西山
    malla: '#9A6B2F', // 加德满都
    // 🔴 [2026-11-04 主人令「按历史修复」] shangdu／wistahm 两个势力已删（并入大元／萨珊），固定色一并删除
    mihran: '#8F5A7A', // 米赫兰
    // 🔴 [2026-11-05 按A执行] dongyang（会稽义军）已并入隋国，固定色删除
    xiwasi: '#8C5A3C', // 埃雷特纳
    mengguqieke: '#3C7A8C', // 门古切克
    sumuroyi: '#8A5A2B', // 米沙鄢人

    // ── 北方精锐远征势力（2026-06-11；§2 全 12 + §1 偏北）──
    zhao: '#B83A3A', // 赵·赵边骑（三晋尚赤）
    douxia: '#6E2C00', // 夏·窦建德（河北）
    mari_ancient: '#A65E2E', // 马里·幼发拉底（Yahdun-Lim）
    handong: '#7B3F00', // 汉东·刘黑闼（河北黑旗）
    yan: '#286888', // 燕·幽州突骑（水德蓝青）
    han: '#3A7858', // 韩（战国韩·木德尚青）
    gongsun_d: '#E8E4D8', // 辽东·铁骑（白马白）
    murong: '#887040', // 慕容·龙城甲骑（尚黄龙）
    gaoqi_d: '#322C30', // 高齐·百保鲜卑 T0（蓨城；北齐承水德尚黑）
    // tuoba/erzhu/yuwen/shatuo 见上方尚色/草原表

    // ── 河西精锐远征势力（2026-06-11；§7 全 10 + 野利·擒生军）──
    guiyi: '#C8A868', // 归义·沙州义军（敦煌沙金）
    xianlingqiang: '#688850', // 先零·凉州大马（允吾青绿）
    tufa_d: '#4A5868', // 秃发·南凉铁骑（浇河铁青）
    juqu_d: '#9A7858', // 沮渠·北凉精锐（张掖赭褐）
    // dangxiang 见上方大夏白

    // ── 川蜀精锐远征势力（2026-06-11；§8 全 10 支）──
    bandun: '#6A8858', // 板楯·賨人勇士（汉昌巴人绿）
    chenghan: '#26221C', // 成汉·六夷突骑（鹿头关；据成都水德尚黑）
    // shu/daxi_ming/tujia_d 见上方表


    // ── 中原精锐远征势力（2026-06-11；hex 全局唯一）──
    wuzhou_d: '#B85898', // 武周·控鹤军（则天紫）
    ranwei_d: '#9E5A28', // 冉魏·乞活军（邺都铁褐，与曹魏蓝区分）
    zhou: '#A32B26', // 周·岐阳周师（周朝朱红，火德尚赤）
    qi: '#7E2E94', // 齐·齐之技击（齐桓鲜紫，齐桓公好服紫）
    wuhuan: '#506858', // 乌桓·乌桓突骑（辽西青灰）
    // tang/wei/qin/shang/xia/sui/fu/sunqin 见上方尚色表
    nanyue: '#1C1C20', // 南越（赵佗·秦系玄黑）
    // chu/song/chen/xiao_d/yue_d/ming_d 见南方表\r\n
    // ── 黑·水德尚黑 / 契丹黑旗 ──
    qin: '#1C1C1C', // 秦
    liao_d: '#302E28', // 大辽·皮室军（上京临潢）
    yuwen: '#25675B', // 宇文·北周（木德尚青）

    // ── 补全中城随机势力专属色（2026-06-12） ──
    ba: '#B83A3E', // 巴国（姬姓宗周尚赤，巴渝劲卒@重庆）
    min: '#664A6A', // 闽国·亲从（冶城紫）
    fuyu: '#5A6878', // 夫余（雪原蓝灰，夫余步骑）
    qifu_d: '#826B4A', // 乞伏（陇右土黄，苑川突骑）
    dongxu: '#BA7A36', // 东吁·象兵（琥珀金）
    meitai: '#B04A3A', // 梅泰·飞镖骑兵（曼尼普尔红）
    you: '#C41E29', // 幽州（耿弇·汉系赤红）
    yun: '#8A6A3A', // 允戎（陆浑赭黄，陆浑戎骑）
    juyan_d: '#7A6B52', // 居延·荆楚步卒（巴音布拉格）
    xihai_d: '#3D6B8C', // 西海·威定戍卒（伏俟城）
    danluo: '#325272', // 耽罗（耽罗海蓝，三别抄）
    dengmaoqi: '#9C4A3A', // 铲平（铲平起义红，铲平军）
    helian: '#3D4E5B', // 赫连（铁弗钢蓝，铁弗卫队）
    tsangpa: '#A18A4A', // 藏巴汗（藏巴汗藏金，藏巴汗卫队）
    huangwang: '#B58A3A', // 黄王（冲天黄，冲天军）
    yehe: '#7D6608', // 叶赫（叶赫褐）
    wula: '#9A7D0A', // 乌拉（暗金）
    bayegu: '#3A5A8A', // 拔野古（蓝突厥蓝）
    ketagalan: '#D35400', // 凯达格兰（赤土）
    suke: '#F1C40F', // 素可泰（佛金）
    gaochang: '#E67E22', // 高昌·麴氏铁骑（沙黄）
    chuyue: '#3A4A7A', // 处月（突厥深蓝）
    baidi: '#D0D3D4', // 白狄（灰白）
    huite: '#34495E', // 辉特（深蓝灰）
    zubu: '#2C3E50', // 阻卜（暗蓝）
    // ── 2026-06-16 新增：自动化补全色盘（邻域相斥算法） ──
    'heishui': '#883D82', // 自动分配 (邻域相斥)
    'fuguo': '#502870', // 附国（宜缯）
    'yada': '#65AC41', // 自动分配 (邻域相斥)
    // guishuang 已迁移到固定色（见上方）    'yue': '#624FA7', // 自动分配 (邻域相斥)
    'qiuchi': '#CA3197', // 自动分配 (邻域相斥)
    'kong_d': '#CA55C4', // 自动分配 (邻域相斥)
    'gouding': '#7562B3', // 自动分配 (邻域相斥)
    'yelang': '#86407D', // 自动分配 (邻域相斥)
    'ailao': '#A641D4', // 自动分配 (邻域相斥)
    guishuang: '#D7CE4D', // 贵霜·大月氏兵
    'gaya': '#4D20A1', // 自动分配 (邻域相斥)
    'xingliao': '#5E4228', // 兴辽（大延琳·辽东熟褐；避开与大辽/东辽撞色）
    'luoyue': '#A09537', // 自动分配 (邻域相斥)
    'ouyue': '#4DCE49', // 自动分配 (邻域相斥)
    'xibo_d': '#3A5A7A', // 锡伯（草原蓝）
    'linshihong': '#1E9B91', // 自动分配 (邻域相斥)
    'xijue': '#6A5848', // 西爵（草原褐）
    'tujishi': '#714988', // 自动分配 (邻域相斥)
    'xiaobolu': '#6A7888', // 勃律（青灰，没谨忙）
    'luodian': '#A33F49', // 自动分配 (邻域相斥)
    'nongzhigao': '#9ABE5C', // 自动分配 (邻域相斥)
    'fangla': '#777AD3', // 自动分配 (邻域相斥)
    'dongxia': '#CEC6BC', // 东夏·女真尚白
    'kereyid': '#5350B3', // 自动分配 (邻域相斥)
    'tatar': '#3A5A7B', // 塔塔尔（草原蓝）
    'dixiang': '#B8781E', // 新国（王莽·《汉书》新室自以土德王、色尚黄；避开与幽州 #C41E29 撞色）
    'dada_ming': '#A6D43C', // 自动分配 (邻域相斥)
    'oirat_ming': '#585858', // 卫拉特（草原灰）
    'haixi_nvzhen': '#9CA8B4', // 海西女真（辉发松花银青；避开与大金/野人女真尾数+1撞色）
    'yeren_nvzhen': '#6B8268', // 萨哈连/野人女真（黑龙江林海灰绿；避开与海西女真尾数+1撞色）
    'jilimi': '#60B54B', // 自动分配 (邻域相斥)
    'lujian': '#B0AC5E', // 自动分配 (邻域相斥)
    'yarkand': '#AC2EC5', // 自动分配 (邻域相斥)
    'khoja': '#5B56BC', // 自动分配 (邻域相斥)
    'jinchuan_g': '#7E6042', // 金川（土金，莎罗奔）
    'shuntian': '#A0D546', // 自动分配 (邻域相斥)
    'xiadun': '#B85A28', // 夏顿（雷龙之国藏橙，夏仲阿旺朗杰；避开青藏土司同色）
    'kokand': '#5AA120', // 自动分配 (邻域相斥)
    'badakhshan': '#B75797', // 自动分配 (邻域相斥)
    'taiping': '#E2AC30', // 太平天国（天王黄旗·明黄，石达开）
    'dacheng': '#392898', // 自动分配 (邻域相斥)
    'tuoming': '#6A5849', // 拓明（草原褐）
    'yilou': '#A53C68', // 自动分配 (邻域相斥)
    'wuji': '#64AF95', // 自动分配 (邻域相斥)
    'shiwei': '#9AA738', // 自动分配 (邻域相斥)
    'sogdian': '#BA4632', // 粟特·红袍金带
    yuchi: '#F0F0E0', // 尉迟·于阗精兵（羊脂玉白，白玉特产天王之后）
    'an': '#AC5D92', // 自动分配 (邻域相斥)
    'shi_clan': '#A7A243', // 自动分配 (邻域相斥)
    'hongirad': '#8C6832', // 弘吉剌（捕鱼儿海金褐；避开与塔塔尔 #3A5A7B 尾数+1撞色）
    'ladakh': '#5C2820', // 拉达克（暗绛褐，僧格朗杰）
    'ganden': '#C89830', // 格鲁（黄帽派，宗喀巴）
    'supi': '#4A3072', // 苏毗（悉诺逻）
    'khon': '#4C3876', // 萨迦（八思巴）
    'lang_clan': '#5C2821', // 帕竹/朗氏（暗绛褐，绛曲坚赞）
    'karmapa': '#2A221E', // 噶玛巴（黑帽系，却英多吉）
    'ava': '#37D18C', // 自动分配 (邻域相斥)
    'mon': '#43A561', // 自动分配 (邻域相斥)
    'xiou': '#455DD4', // 自动分配 (邻域相斥)
    'she_ethnic': '#5CCF6F', // 自动分配 (邻域相斥)
    'weili': '#464686', // 自动分配 (邻域相斥)
    'pishan': '#247DC1', // 自动分配 (邻域相斥)
    'tuerhute': '#CED048', // 自动分配 (邻域相斥)
    'cen_d': '#3BB9C7', // 自动分配 (邻域相斥)
    'shen': '#C883C0', // 自动分配 (邻域相斥)
    'panyao': '#773C61', // 自动分配 (邻域相斥)
    'golog': '#3A6E5C', // 果洛（阿尼玛卿冷杉绿，完德扎西；避开青藏土司尾数+1同色）
    tumed: '#B8A060', // 土默特·精骑（草原金）
    'dai': '#6E6BC1', // 自动分配 (邻域相斥)
    'taiyuan': '#AF3193', // 自动分配 (邻域相斥)
    'luohu': '#3F55CD', // 自动分配 (邻域相斥)
    'liren': '#DF66D3', // 自动分配 (邻域相斥)
    'gling': '#2C6B82', // 岭国（通天河碧青，囊谦千户；避开青藏土司尾数+1同色）
    'suolun': '#80BC7A', // 自动分配 (邻域相斥)
    // 🔴 [2026-11-04] 'dalung' 已并入甘丹颇章，固定色删除
    'kongsa': '#A87B28', // 孔萨（甘孜麦宿琥珀金，孔萨益多；避开青藏土司尾数+1同色）
    // 🔴 [2026-11-04] 'daca' 已并入甘丹颇章，固定色删除
    'hor': '#C8C0B8', // 霍尔（蒙古尚白，赤桑）
    // 🔴 [2026-11-10 主人令「删除这个势力」] 'dong' 已删，固定色删除
    'bailang': '#70C867', // 自动分配 (邻域相斥)
    'duolu': '#2C7268', // 咄陆（伊犁河谷深青；避开与锡伯 #3A5A7A 尾数+1撞色）
    'keerkezi': '#85423B', // 自动分配 (邻域相斥)
    'yizhi': '#A8B764', // 自动分配 (邻域相斥)
    'yiwu': '#AA69CD', // 自动分配 (邻域相斥)
    'duerbote': '#D02C26', // 自动分配 (邻域相斥)
    'kaerka': '#C4A030', // 喀尔喀·黄旗（与准噶尔黑对举）
    'huihu': '#C24A2E', // 回鹘·可汗朱红袍
    'wuzhumuqin': '#49A198', // 自动分配 (邻域相斥)
    'zhadalan': '#5D833A', // 自动分配 (邻域相斥)
    'zhuerqi': '#81BBAE', // 自动分配 (邻域相斥)
    'yumi': '#98733B', // 自动分配 (邻域相斥)
    'xiye': '#498D4A', // 自动分配 (邻域相斥)
    'galangdiba': '#2E6854', // 波密/嘎朗第巴（波密雪山森林墨绿，旺钦顿堆；避开与帕竹朗尾数+1撞色）
    'cuanshi': '#942248', // 自动分配 (邻域相斥)
    'hui': '#65B874', // 自动分配 (邻域相斥)
    'wure': '#69428D', // 自动分配 (邻域相斥)
    'sunite': '#5CA54C', // 自动分配 (邻域相斥)
    'weiwuer': '#D73ED7', // 自动分配 (邻域相斥)
    'wensu': '#3E9440', // 自动分配 (邻域相斥)
    'keerqin': '#AA4023', // 自动分配 (邻域相斥)
    'zhaowu': '#8160C0', // 自动分配 (邻域相斥)
    'ruoqiang': '#5AAE62', // 自动分配 (邻域相斥)
    'qiemo': '#8736A6', // 自动分配 (邻域相斥)
    'weitou': '#7A9E4B', // 自动分配 (邻域相斥)
    'qiepantuo': '#67C96A', // 自动分配 (邻域相斥)
    'eluoke': '#A62867', // 自动分配 (邻域相斥)
    'buriat': '#9C4F36', // 自动分配 (邻域相斥)
    jiazini: '#227A46', // 伽色尼·古拉姆（伊斯兰圣色绿）
    fanyanna: '#3A5A78', // 梵衍那（青金石蓝）
    kumoxi: '#587868', // 库莫奚·饶乐水松漠青

    fushi: '#2A2620', // 苻秦·前秦（水德尚黑）
    da_qin: '#2A5C8E', // 大秦·朱泚（钢蓝，与秦国玄黑 #1C1C1C、姚秦羌紫 #8E3A6E 区分）
    ewenki: '#495A6B',
    kepantuo: '#627384',
    yangguan: '#6C7D8E',
    xiliangjun: '#5A2A3C', // 西凉军·董卓（深酱紫红，与阳关灰蓝/前凉土黄/凉州深褐区分）
    shanshan: '#768798',
    hantawadi: '#8FA0B1',
    wuling: '#A3B4C5',
    'qianqin': '#3A6A5A',
    'aiji': '#D09B2C',
    'xibolai': '#245580',
    'womaya': '#E4E0D6',
    'yinduxila': '#3D7A6E', // 印度希腊王国（旁遮普青绿）

    'asakaini': '#7A6234', // 阿萨凯尼（斯瓦特山堡土黄）

    'sailiugu': '#8A2035',

    // ── 2026-07-27 新增据点势力专属史地配色 ──
    'wuyue': '#2A6B56',
    'minyue': '#1E6852',
    'funan': '#C26E28',
    'lancang': '#E09A18',
    'ahaomu': '#984028',
    'elunchunzu': '#5A4838',
    'tajikezu': '#854030',
    'jingpozu': '#6B3828',
    'xingwei': '#5A7A38',
    'xisi': '#B56B28',
    'dulan_d': '#6E4A30',
    'huluo': '#885028',
    'saerbadaer': '#386B48',
    'yilihanguo_d': '#80283A',
    'wulaertu': '#8C5A28',
    'wulaertu_guo': '#5E4A3A', // 乌拉尔图·图什帕（青铜褐）
    'gelujiya': '#A52028',
    'bendou': '#1E4E6B',
    'saipulusi': '#2A5EA0', // 塞浦路斯·吕西尼昂蔚蓝（银蓝条纹纹章；原正红 #B22222 与奥斯曼撞色）
    'bendou_d': '#245678',
    'heti': '#955020',
    'fulijiya': '#A06828',
    'kanan': '#6B0F3A',
    'feilisidin': '#1F9E8C', // 加沙·腓利斯丁（青绿/绿松石 —— 阿契美尼德驻军色系，主人给定） // 腓尼基·推罗（泰尔紫 Tyrian Purple；骨螺紫染料发源地，史料尚色固定。⚠️ 马其顿 #C9A227 不动）
    'ldiya': '#B88820',
    'pajiama': '#285E7B',
    'baizanting': '#6A1B6D',
    'luomu': '#2D6A4F',
    'osman': '#B22222', // 奥斯曼（红底新月军旗·火砖红；西亚区红色与亚述/阿舒尔/纳巴泰错开）

    // ── 西亚区补全（2026-07-30）──
    // 该区原有 9 家已固定色（bendou/bendou_d/heti/fulijiya/ldiya/pajiama/bitiniya/baizhanting/luomu），
    // 其余 19 家此前走 FactionManager 随机池；按史地特征补齐，红/黄/蓝/紫/褐/青分散不扎堆。
    'abasi': '#1E2A3C', // 阿拔斯（黑旗革命，史料尚黑；避 wazhai 玄黑撞色取蓝黑）
    'jialedi': '#2B5FA8', // 迦勒底·新巴比伦（伊什塔尔门釉蓝）
    'sumeier': '#2D3A8C', // 苏美尔（乌鲁克·青金石深蓝）
    'yashu': '#7A2E3C', // 亚述（尼尼微·王室赭紫）
    'nabatai': '#A8474F', // 纳巴泰（佩特拉玫瑰砂岩）
    'paermila': '#A6642F', // 帕尔米拉（沙漠绿洲石灰岩土橙；压暗以离开旗字阈值 128）
    'ayoubu': '#0E5230', // 阿尤布（萨拉丁·伊斯兰深绿）
    'mamuluke': '#C99700', // 马穆鲁克（苏丹旗黄底狮徽·金黄）
    'maidina': '#2A8A63', // 麦地那（先知清真寺绿穹顶）
    'gulaishi': '#332B22', // 古莱什·麦加（天房帷幕黑金）
    'dedan': '#C09A3A', // 德丹·泰马绿洲（北阿拉伯沙金）
    'xikesuosi': '#4A3560', // 喜克索斯（外族征服者·战车紫褐）
    'tuolemi': '#0F7B6C', // 托勒密（亚历山大港·希腊化绿松石）
    'aiaoniya': '#1B6E78', // 爱奥尼亚·以弗所（爱琴海青）
    'jialatai': '#3C7A55', // 加拉太（凯尔特青绿）

    // ── 草原·里海·伊朗·印度 补全（2026-07-30）──
    // expedition:audit 长期报「缺固定色」的 20 家，全部按史地／宗教尚色补齐。
    'xiemian': '#8A6A3C', // 萨维尔·谢缅杰尔（达吉斯坦草原土褐）
    'salai': '#C0A24E', // 诺盖·萨莱楚克（金帐系驼金）
    'kesa': '#3A4E96', // 可萨·打耳班（可萨改宗犹太教·大卫蓝）
    'midi': '#7A2A54', // 米底·哈马丹（米底服色赭紫）
    'aqimeinide': '#5A2B86', // 阿契美尼德·波斯波利斯（波斯帝王紫）
    'sashan': '#4A3A8C', // 萨珊·菲鲁扎巴德（萨珊紫）
    'safawei_d': '#B02436', // 萨法维·伊斯法罕（红头军 Qizilbash 朱红帽）
    'ailan': '#2A7268', // 埃兰·苏萨（苏萨釉陶青绿）
    'ansxi': '#8C3A44', // 安息·尼萨（帕提亚深绛）
    'xike': '#D98324', // 锡克帝国·拉合尔（锡克教藏红花橙）
    'deli': '#166B4A', // 德里苏丹国（伊斯兰苏丹深绿）
    'sur': '#8E3B3B', // 🔴 [2026-10-28 主人批立] 苏尔王朝·德里（阿富汗苏尔深红；与德里苏丹深绿区分）
    'mowoer': '#1D4E9C', // 莫卧儿·阿格拉（莫卧儿宫廷蓝宝石）
    'jieri': '#9E5E1E', // 戒日·曲女城（印度教赭黄）
    'jiashi_d': '#96422E', // 迦尸·瓦拉纳西（恒河圣城赭红）
    'mojietuo': '#6E4420', // 摩揭陀·王舍城（恒河中游深赭）
    'boluo': '#A0521E', // 波罗帝国·高达城（佛教王朝袈裟橙褐）
    'kongque': '#22378C', // 孔雀帝国·华氏城（阿育王法轮深蓝）
    'zhuluo': '#C08A2E', // 朱罗王朝·坦贾武尔（印度教神庙金）
    'pandiya': '#C09A2E', // 潘地亚·马杜赖（泰米尔金）
    'sengjialuo': '#A8442E', // 僧伽罗·阿努拉德（僧伽罗狮棕红，Sinhala=狮子民族）
    // ── 2026-08-02 补无精锐番号势力固定色（历史尚色）──
    'ayinu_ezo': '#2E3A5C', // 阿伊努·莫约罗（鄂霍次克极北靛）
    'jinzhang': '#B8860B', // 金帐汗国·萨莱（汗庭金驼）
    'baojiaer': '#A0762A', // 伏尔加保加尔·喀山（保加尔驼金）
    'xierhe': '#2A5C8A', // 锡尔河·哲德（锡尔河蓝）
    // ── 2026-08-02 欧洲三区势力固定色（历史尚色/服色/史地特征）──
    // 拉丁
    'luoma_diguo': '#5B2D8E', // 罗马帝国·罗马城（帝王紫，Tyrian purple）
    'xila': '#2E6DA4', // 雅典·雅典城（爱琴海蓝白）
    'buni': '#7A2E6E', // 迦太基·迦太基（腓尼基紫，推罗紫渊源）
    'maqidun': '#C9A227',
    gepids: '#8A6E8E', // 革皮德（蒂萨河日耳曼；2026-10-25 新增）
    kalbids: '#4F7A8A', // 卡尔比德（西西里埃米尔；2026-10-25 新增）
    sesali: '#6E7F4A', // 色萨利·佩利纳（帖撒利名骑；2026-10-25 新增） // 马其顿·佩拉（亚历山大金）
    'gaolu': '#2A4B8F', // 法兰西·巴黎（王室蓝 fleur-de-lis）
    'kaernute': '#3D5A3D', // 卡尔努特·沙特尔（高卢凯尔特绿）
    'xiongren': '#7A3A2E', // 匈人·沙隆（阿提拉·草原红褐）
    'awaer': '#5E7B4F', // 阿瓦尔（潘诺尼亚；草原绿）
    'putaoya': '#284B9E', // 葡萄牙·里斯本（王国蓝盾）
    'mulabite': '#A03028',
    'awraba': '#6E4B2A', // 奥雷巴·奥雷斯山（柏柏尔山地褐） // 穆拉比特·马拉喀什（马拉喀什红城）
    'malin': '#2E6E62', // 🔴 [2026-10-28 主人批修] 马林王朝·非斯（马林经学院绿瓦青瓷）
    'boootiya': '#5E2A84', // 底比斯·底比斯（底比斯圣队紫）
    'kelite': '#8A3A2A', // 克里特·诺索斯（米诺斯陶红）
    'yipilusi': '#8B1E28', // 伊庇鲁斯·战神深绯红
    'lagoniya': '#B02A1E', // 斯巴达·斯巴达（斯巴达红披风）
    'yidelisi': '#1F6FA8', // 伊德里斯·非斯（伊德里斯蓝）
    'zhayan': '#3A6EA8', // 扎亚尼德·特莱姆森（北非白蓝）
    'hamade': '#B0893C', // 哈马德·布佳亚（北非沙金）
    'aguelabu': '#1E7FB8', // 阿格拉布·凯鲁万（突尼斯蓝门）
    'jileinaijia': '#3A7A4A', // 昔兰尼加·班加西（昔兰尼绿）
    'safuyi': '#1E6B38', // 萨伏伊·绿伯爵森林绿
    'talanduo': '#2B6EA0', // 塔兰托·大希腊海洋蓝
    'jiatailuoniya': '#C93A2E', // 阿拉贡·巴塞罗那（金红条旗）
    'nasier': '#8C2A2A', // 纳斯里德·格拉纳达（阿尔罕布拉红）
    'aquidan': '#33333A', // 阿基坦·波尔多（黑太子黑）
    'puluowangsi': '#7B5EA7', // 普罗旺斯·阿维尼翁（薰衣草紫）
    'lunbadi': '#B02030', // 米兰·米兰（维斯孔蒂红）
    'donggete': '#B9850A', // 东哥特·拉文纳（哥特金马赛克）
    'xigete': '#3A3A42', // 西哥特·托莱多（托莱多铁黑）
    'alagong': '#D4A020', // 萨拉戈萨·萨拉戈萨（阿拉贡金）
    'bulabante': '#2A2A2E', // 布拉班特·布鲁塞尔（黑底金狮纹章，取黑底）
    'fulandesi': '#B8912E', // 佛兰德斯·加莱（佛兰德斯金）
    'bulietani': '#4A4A55', // 布列塔尼·雷恩（布列塔尼深灰蓝）
    'leangongguo': '#6A3D9E', // 莱昂·萨拉曼卡（莱昂狮旗紫）
    'xixiliwangguo': '#D4880B', // 西西里王国·巴勒莫（诺曼金）
    'liangxixili': '#B0574E',  // 两西西里王国（1816–1861）｜🔴 [2026-11-11 GG第五轮] 与西西里王国解绑（异族异朝，非同一系），原同色 #D4880B 改为波旁那不勒斯赭红，保证势力色唯一
    'aboerleiya': '#A63A32', // 阿尔博雷亚·奥里斯塔诺（判官国纹章银底红树，取树红）
    // 日耳曼
    'falanji': '#1E4E79', // 法兰克·科隆（法兰克深蓝）
    'koln': '#B03A2E', // 🔴 [2026-10-28 主人批立] 科隆大主教区（科隆十字甲胄红）
    'tiaodun_qishi': '#2E2E32', // 条顿骑士·柯尼斯堡（白底黑十字）
    'hansa': '#C31E2E', // 汉萨·汉堡（汉萨红白）
    'weijing_york': '#8B2E4E', // 维京约克·约克（维京紫红）
    'maixiya': '#B8850B', // 麦西亚·牛津（盎格鲁金）
    'piketai': '#2E4E8F', // 苏格兰·爱丁堡（苏格兰蓝）
    'mangsite': '#A67B1E', // 芒斯特·卡舍尔（蓝底三金冠，取金冠铜金，避盖尔蓝）
    'tuomengde': '#1D5A3A', // 托蒙德·利默里克（爱尔兰深林绿）
    'habusibao': '#8B6A1A', // 哈布斯堡·维也纳（哈布斯堡金黑）
    'boximiya': '#C8A227', // 波西米亚·布拉格（波西米亚金）
    'yidali_wangguo': '#9C4A2B', // 意大利王国（萨伏依绿）
    'luxitaniya': '#7B4A2E', // 卢西塔尼亚（山地棕）
    'tuoerkete': '#8A3B2B', // 托尔特克（高原紫）
    'yadian_gongguo': '#5A4A2E', // 雅典公国
    'mayapan': '#6B4A5C', // 玛雅潘
    'songhai': '#7A5C3E', // 桑海
    'shahi': '#5C3E7A', // 印度教沙希
    'xisa': '#6B2E4A', // 西萨特拉普
    'xilawangguo': '#2E4A6B', // 希腊王国
    'ante': '#4A5C2E', // 安特
    'suweihui': '#5C4A2E', // 苏维汇
    'yibiluliya': '#2E4A5C', // 伊比利亚
    'yicha': '#4A2E5C', // 伊察
    'mengjiala': '#3E5C2E', // 孟加拉
    'yili': '#6B2E3E', // 伊利里亚
    'daqiya': '#3E2E6B', // 达契亚
    'qiajia': '#5C3E2E', // 恺加
    'arevaci': '#7A4A3E', // 阿雷瓦西
    'epirus_despotate': '#7A3A6A', // 伊庇鲁斯专制国
    'teotihuacan': '#7A5A3A', // 特奥蒂瓦坎
    'salakanagara': '#3A6A6A', // 萨拉卡那加拉
    'helvetii': '#5A6A3A', // 赫尔维蒂
    'hussites': '#6A2E2E', // 胡斯派
    'cherusci': '#4A5A2E', // 切鲁西
    'rashtrakuta': '#6A3A6A', // 拉什特拉库塔
    'andean_rebellion': '#7A4A3A', // 安第斯起义军
    'abkhazia_kingdom': '#3A6A3A', // 阿布哈兹王国
    // 🔴 [2026-11-09 主人令「这种势力统一就行，旗号用倭」] 'early_wokou'（前期倭寇）#3A3A3A 已删，并入 haikou 海贼倭寇（旗号倭）
    'mac_dynasty': '#5A2E2E', // 莫朝
    'restored_hanthawaddy': '#7B3A2E', // 复兴汉达瓦底
    'mamunid': '#6A5A4A', // 马蒙王朝
    // 🔴 [2026-11-09 主人令「建州女真和大清势力合并」] 原 jianzhou 的势力色（#2E4A3A）已删（并入大清，色随 manzhou_d）
    'bashkir': '#3B6A5A', // 巴什基尔
    'drevlians': '#4A5A3A', // 德列夫利安人
    'marcomanni': '#5B4A2E', // 马科曼尼
    'serbia_revolution': '#8B2E3A', // 塞尔维亚革命
    'caledonia': '#3A4A5A', // 喀里多尼亚
    'goths_migration': '#4A3A5A', // 哥特人
    'syracuse': '#2F5A8A', // 叙拉古
    'hamdanid': '#6A2E4A', // 哈姆丹王朝
    'wiman_joseon': '#3A5A6A', // 卫满朝鲜
    'gusiluo': '#6A5A2E', // 唃厮啰
    'old_saxons': '#5A5A3A', // 古撒克逊
    'alamanni': '#4A4A2E', // 阿勒曼尼
    'taifa_toledo': '#4A6A2E', // 托莱多泰法
    'florence': '#8A3A2E', // 佛罗伦萨共和国
    'tuitonga': '#7A2E5A', // 汤加帝国
    'rapanui': '#2E7A7A', // 拉帕努伊
    'later_baekje': '#6A4A8A', // 后百济
    'arverni': '#5A3A2E', // 阿维尔尼
    'imro': '#8A2E2E', // 内马其顿革命组织
    'bulgaria_third': '#3A7A3A', // 保加利亚公国
    'aksum': '#7A5A2E', // 阿克苏姆
    'milan_duchy': '#2E4A8A', // 米兰公国
    'lombard_league': '#2E6A5A', // 伦巴第联盟
    'cilicia_armenia': '#9A3A3A', // 奇里乞亚亚美尼亚
    'armenia_arsacid': '#6E3A5A', // 阿萨息斯亚美尼亚
    'syunik_bek': '#8A5A2E', // 休尼克
    'northumbria': '#3E5A7A', // 诺森布里亚
    'wessex': '#7A2E2E', // 威塞克斯
    'subroman_britain': '#5A6B3A', // 后罗马不列颠
    'xinmeiliyan': '#6B4E2E', // 辛梅里安
    'aixini': '#5E7A3A', // 爱西尼
    'taluma': '#2E5A3E', // 塔鲁玛迦拉
    'lugii': '#6B4B5B', // 卢吉联盟
    'mazhaer': '#D0D0D8', // 匈牙利·布达佩斯（阿尔帕德银白）
    'meikelunbao': '#2E5E8C', // 梅克伦堡·罗斯托克（梅克伦堡蓝红）
    'didi': '#8A7A3A', // 佛兰德·布鲁日（佛兰德斯金黑）
    'nidelan': '#D4621A', // 荷兰·海牙（奥兰治橙）
    'pomeilaniya': '#B3122E', // 波美拉尼亚·什切青（格里芬王朝纹章红）
    'pufaerci': '#3A5FA8', // 普法尔茨·海德堡（普法尔茨蓝）
    'batawei': '#C85A1E', // 乌特勒支·乌特勒支（荷兰橙）
    'shiwaben': '#4A4A52', // 施瓦本·奥格斯堡（施瓦本黑白）
    'asikanani': '#9F3030', // 勃兰登堡·勃兰登堡（勃兰登堡红）
    'wende': '#B63030', // 马格德堡·马格德堡（马格德堡红白）
    'bafaliya': '#396EA8', // 巴伐利亚·雷根斯堡（巴伐利亚蓝白）
    'ruishi': '#AF2020', // 瑞士·巴塞尔（瑞士红）
    'damolaweiya': '#B7912E', // 大摩拉维亚·布尔诺（大摩拉维亚金）
    // 斯拉夫
    'luosi': '#896A1E', // 基辅罗斯·基辅（罗斯金）
    'bolan': '#C7102E', // 波兰·华沙（白鹰红底）
    'eluosi_diguo': '#16324F', // 俄罗斯帝国·圣彼得堡（彼得大帝海军蓝·波罗的海舰队）
    'ternate': '#A0522D', // 特尔纳特·德尔纳特（丁香群岛·香料棕红）
    'sulu': '#1B6E8A', // 苏禄·霍洛（苏禄海珍珠蓝）
    'bosi_puluosi': '#2B4C7E', // 博斯普鲁斯·黑海青蓝
    'baojialiya': '#1B7340', // 保加利亚·帝国森林绿
    'saierweiya': '#9F2020', // 塞尔维亚·贝尔格莱德（塞尔维亚红）
    'bosiniya': '#8A6A2E', // 波斯尼亚·萨拉热窝（波斯尼亚金）
    'lagusa': '#2E6FA8', // 拉古萨·拉古萨（亚得里亚蓝）
    'seleisi': '#A83132', // 色雷斯·普罗夫迪夫（色雷斯红）
    'jialixiya': '#3E7A3E', // 加利奇·加利奇（加利奇绿）
    'pusikefu_gongheguo': '#4A6FA8', // 普斯科夫·普斯科夫（普斯科夫蓝）
    'ouka': '#896A2E', // 梁赞·梁赞（梁赞金褐）
    'xideweina': '#3A5E9E', // 波洛茨克·波洛茨克（波洛茨克蓝）
    'kelimiya': '#1D6FA8', // 克里米亚·卡法（黑海蓝）
    'litaowan': '#8E1E28', // 立陶宛·维尔纽斯（大公国暗红）
    'baojian_qishi': '#6A6A72', // 宝剑骑士·里加（骑士团银灰）
    'teweier_gongguo': '#B8902E', // 特维尔·特维尔（特维尔金）
    'suzidaer': '#2D5E9E', // 苏兹达尔·下诺城（苏兹达尔蓝）
    'gesake': '#96284B', // 塞契·塞契（哥萨克猩红）
    'moerdaweiya': '#AF3030', // 摩尔达维亚·雅西（摩尔达维亚红）
    'walajiyia': '#3A6EA7', // 瓦拉几亚·特尔城（瓦拉几亚蓝）
    'peilieya_gongguo': '#C9A127', // 佩列斯拉夫·佩列斯拉夫（佩列斯拉夫金）
    'daniebo': '#A73737', // 斯摩棱斯克·斯摩棱斯克（斯摩棱斯克红）
    'qiernigeweifu_gongguo': '#3A6E4A', // 切尔尼戈夫·切尔尼戈夫（切尔尼戈夫绿）
    'maerta_qishi': '#C51E31', // 圣约翰·马耳他（医院骑士白底红十字）
    'aosiruowen': '#A0282E', // 埃德萨·埃德萨（十字军红）
    'shengdian_qishi': '#B81E2E', // 圣殿骑士·阿卡（圣殿红底白十字）
    'danmai': '#C0202E', // 丹麦·哥本哈根（红底白十字）
    'xinbuli': '#8D6E3A', // 辛布里（日德兰；与丹麦红区分）
    'ruidian_si': '#1E63AC', // 瑞典·斯德哥尔摩（瑞典蓝金）
    'kasidiliya': '#C2102E', // 卡斯蒂利亚·马德里（金塔红旗）
    'teluoyi': '#8E6A3C', // 特洛伊·特洛伊（青铜）

    // ── 2026-08-26 补远征精锐持有势力缺失固定色（§12.1 红线：有精锐必须有固定色）──
    'yinggelan': '#B4283C', // 英格兰·温彻斯特（圣乔治红十字 / 王室红地三狮）
    // 🔴 [2026-11-04 主人令「按历史修复」] 'yasuer'（亚速尔，葡属）与 'xingelana'（新格拉纳达总督区）已并入葡萄牙／西班牙，固定色一并删除
    'liangshidu': '#9C6B2E', // 永隆（梁师都）·朔方统万城（黄土塬赭褐；与萧铣「鸣凤」同旗号，靠色区分）
    'gurjara': '#C25516', // 瞿折罗·帕坦（拉其普特藏红赭）
    'suomunate': '#E08020', // 索姆纳特·索姆纳特（印度教藏红花橙）
    'zhagewei': '#147A3D', // 扎格维·拉利贝拉（埃塞俄比亚正教圣绿）
    'adal': '#2E6E4E', // 阿达尔·塞拉（阿达尔伊斯兰青绿·红海/亚丁湾海港）
    'muwaxide': '#7A1F32',
    'yilaka': '#D2A72C',
    'gualani': '#287A4B',
    'sanfoqi': '#2E6FB0', // 三佛齐·室利佛逝（海上帝国蓝）
    'sijitai': '#C8A24B', // 斯基泰·阿泰阿斯（草原金棕）
    'guanche': '#8A6B4A', // 关切·特尔德（加那利羊皮褐；关切人属柏柏尔系）

    // ── 2026-08-30 补齐全部正规势力固定色：有旗帜/纹章从其主色，无统一国色则取史地物质文化色 ──
    'yelusalengwg': '#C8A23A', // 耶路撒冷王国·阿卡（金色耶路撒冷十字）
    'aztec': '#287F8B', // 阿兹特克·特诺奇提特兰（绿松石与翠羽贵重色）
    'taino_d': '#7A6A3A', // 泰诺人村落·亚拉（土黄褐，原住民茅草村落）
    'inca': '#9E2636', // 印加·库斯科（萨帕印卡红色王冠流苏）
    'maya': '#2F7290', // 玛雅·蒂卡尔（玛雅蓝）
    'mapuche': '#355F91', // 马普切·图卡佩尔（南部山海深蓝）
    'muisca': '#C49A2E', // 穆伊斯卡·巴卡塔（穆伊斯卡黄金工艺）
    'tupi': '#9C3F2D', // 图皮·瓜纳巴拉（乌鲁库胭脂木红）
    'xibanya': '#B52B34', // 西班牙·利马（勃艮第十字绛红）
    'manding': '#B8862F', // 曼丁哥·廷巴克图（马里黄金贸易）
    'ethiopia': '#397545', // 埃塞俄比亚·阿克苏姆（所罗门王朝绿）
    'malacca': '#8E2638', // 满剌加·马六甲（马来苏丹王权绛红）
    'medang': '#A8742C', // 马打蓝·卡拉桑（中爪哇佛寺赭金）
    'kushi': '#5A3D2E', // 库施·麦罗埃（努比亚黑土与金饰）
    'aolisha': '#C66F28', // 奥里萨·普里（贾格纳特祭仪藏红）
    'kanata': '#B85A24', // 卡纳塔·亨比（毗奢耶那伽罗藏红赭）
    'adile': '#2F6B58', // 阿迪勒·比贾布尔（德干苏丹国青绿）
    'yilisi': '#687A3A', // 埃利斯·奥林匹亚（奥林匹亚野橄榄绿）
    'nuowei': '#A92F36', // 挪威·博尔贡（挪威王国旗红）
    'keernuwaye': '#292929', // 康沃尔·坎佩尔（圣皮兰黑地白十字）
    'wuer': '#315C8A', // 乌尔·乌尔城（王陵青金石蓝）
    'jienei': '#8A5B36', // 杰内·杰内城（班科土坯建筑土褐）
    'bulu': '#1E6B8A', // 波罗婆（南印海岸孔雀蓝；与波罗帝国 #A0521E 区分）
    'mallabhum': '#9B4A2D',
    'vidin_tsardom': '#7B2D38',
    'samtskhe': '#6A3E75',
    'tomara_gwalior': '#C47A2A',
    'qutb_shahi': '#2D6A63',
    'minangkabau': '#8C5A2B',
    'tutul_xiu': '#3F6E45',
    'yiluokui': '#6A3A7E', // 易洛魁联盟·奥农多加（海华沙贝壳珠串紫）
    'qimu': '#C09640', // 奇穆·昌昌（奇穆海岸土坯城金）
    'talasike': '#B06040', // 塔拉斯科·钦聪灿（普雷佩查铜器工艺铜）
    'tailuona': '#2E6E44', // 泰罗纳·特尤纳（失落之城雨林绿）
    'teweierqie': '#5A6E82', // 特维尔切·圣胡利安港（巴塔哥尼亚寒原灰蓝）
    'manzheboyi': '#9C3240', // 满者伯夷·特罗武兰（满者伯夷红白旗绯红）
    'zhelouqi': '#C07A1E', // 遮娄其·阿杰梅尔（拉其普特藏红琥珀）
    'suosuo': '#4A3626', // 索索·库姆比萨利赫（坎特铁匠部族乌褐）
    'antiaokegongguo': '#982026', // 安条克公国·拉塔基亚（诺曼十字军暗红）
    'saimien': '#3E7A44', // 塞米恩·塞米恩（塞米恩山地绿）
    'kaliya': '#C89A3A', // 卡里亚·哈利卡纳苏斯（摩索拉斯陵墓金）
    'adiyabeina': '#6E4A2E', // 阿迪亚贝纳·阿尔贝拉（亚述故地褐金）
    'kuman_oleshky': '#4F6E8A', // 库曼·奥列什基（第聂伯河口）
    'tamoyue': '#6E4A3A', // 塔莫约·卡布弗里乌（乌鲁库胭脂木褐）
    'bogendigongguo': '#6E1B2E', // 勃艮第公国·蒙特罗（深酒红）
    'bogendi_wangguo': '#7A3E5C', // 勃艮第王国（古典；与公国深酒红区分）
    'amaniyake': '#4A6E3E', // 阿马尼亚克·欧什（加斯科涅绿）
    'weiershigongguo': '#4E5A6E', // 威尔士公国·布伊尔斯（威尔士灰蓝）
    'taimier': '#A06030', // 泰米尔·金奇（泰米尔赭）
    // 🔴 [2026-09-19 主人指出审计警告「缺 HistoricalFactionColors 势力色」] 补齐 8 个新势力的色。
    //    取色按本文件头两条：**有尚色依据用尚色**；无依据则**按史地特征取色**（水师海蓝 / 山地岩色 / 河畔沙黄…）。
    //    ⚠️ 每一条都经脚本实测：与全表 1000+ 色 RGB 欧氏距离 ≥ 28（`RESERVED_COLOR_MIN_RGB_DISTANCE`），无撞色、无近色。
    'genji': '#989791', // 源氏·镰仓（白旗之银灰调；**纯白位已被全表 29 条浅色占满**，此色是实测最近的可用浅灰）
    'genji_iyo': '#108EE8', // 伊予源氏·松山（忽那水军·海蓝；本文件原则「水师用海蓝」）
    'aswaka': '#799F88', // 阿斯瓦卡·马萨加（斯瓦特山谷·灰绿）
    'malli': '#EBAF5B', // 马利·马里斯（印度河畔·沙黄）
    // 🔴 [2026-10-20] 原「科塞亚」「乌克西亚」两个无城战役势力已删（武将改挂米底/埃兰），其专属色一并删除
    'dasaleiti': '#3E6B5A',
    'kapaduoxiya': '#8C6B4F',


    'aolitai': '#5F7A6A', // 奥里泰·兰巴基亚（海岸灰绿）
    'chamorro': '#14AAB4', // 查莫罗·阿加尼亚（关岛·密克罗尼西亚热带海洋青蓝）
    'dalriada': '#2F7D5C', // 达尔里阿达·邓纳德（苏格兰西岸盖尔王国·海湾松绿）
    'dublin': '#0F4C5C', // 🔴 [2026-10-28 主人批立] 都柏林王国（北欧裔都柏林深海青）
    'scotland': '#1F4E9C', // 苏格兰·斯昆（圣安德鲁十字深蓝）
    'chanka': '#8A4B2D', // 昌卡·安达瓦伊拉斯（安第斯赭红土）
    'ouchi': '#7A1F3D', // 大内氏·山口（周防赤紫）
    'cueva': '#2E8B5A', // 库埃瓦·科马格雷（巴拿马雨林翠绿）
    'maynila': '#D1495B', // 马尼拉土邦·汤多（帕西格河口朱红）
    'gujarat': '#B8860E', // 古吉拉特苏丹国·艾哈迈达巴德（苏丹金棕）
    'arakan': '#6B3FA0', // 阿拉干·妙乌（孟加拉湾紫）
    'kosala': '#E3B23C', // 拘萨罗·舍卫城（恒河北岸金黄）
    'kalinga': '#B5483A', // 羯陵伽·丹塔普拉（孟加拉湾赤红）
    'anga': '#7C9A3E', // 鸯伽·瞻波（恒河下游稻绿）
    'shunga': '#9E2A6B', // 巽伽王朝·阿逾陀（孔雀后继绛紫）
    'antigonid': '#7B1E3A', // 安提柯·凯莱奈（弗里吉亚酒红）
    hou_han: '#C88A22', // 沙陀汉/后汉（太原沙陀琥珀金；与刘汉赤红 #C41E1E 区分）
    yuan_shao: '#8E5A3C', // 袁绍
    hou_jin: '#D8A828', // 石晋/后晋（河东沙陀明金；与晋国赤红 #C4342A、东晋纯白 #FFFFFF 区分）
    hou_zhao: '#6B4F86', // 后赵
    da_yan: '#5A4B8A', // 大燕
    hou_liang: '#C98A2E', // 后梁
    han_zhao: '#7A3E9D', // 汉赵
    dongjin: '#FFFFFF', // 司马晋/东晋（《晋书·舆服志》《宋书·礼志》：晋承魏土德而王，自居金德，服色、旗帜尚白；主人 2026-10-31 令「司马晋 势力色应该是白色」，原宝蓝 #285C9A 作废）
    nan_liang: '#2368A2', // 萧梁/南梁（建康青金宝蓝；与朱梁 #C98A2E 土黄彻底拉开）
    hou_qin: '#8E3A6E', // 姚秦/后秦（陇右羌紫；与秦国玄黑、大秦钢蓝区分）
    yiqu: '#8C5A2E', // 义渠
    hou_zhou: '#247A6E', // 郭周/后周（《五代会要》木德尚青，取苍青碧色；与姬周赤红、武周紫玫区分）
    lvbu: '#8C2848', // 徐州（吕布·温侯紫赤；避开与大燕 #5A4B8A 尾数+1撞色）
    chengjia: '#D6CCA8', // 成家（《后汉书·公孙述传》色尚白，取蜀都暖银象牙；与成汉 #26221C 玄黑区分）
    qianshu: '#B5651D', // 前蜀
    chuguo: '#8C2F39', // 楚国
    liusong: '#3B5B7A', // 刘宋
    nanqi: '#2D8256', // 萧齐/南齐（建康翠青绿；与齐国鲜紫、高齐玄黑区分）
    yangwu: '#2E7D6B', // 杨吴
    nantang: '#4A7FA5', // 南唐
    machu: '#2F7A54', // 马楚（潇湘茗绿；与楚国深绯红 #8C2F39 区分）
    nanhan: '#1B5E96', // 刘越/南汉（岭南南海深蓝；与蜀汉翠绿 #2E7D32 区分）
    fangguozhen: '#5C7A3F', // 方国珍
    liang_shuofang: '#9C5A32', // 大梁
    qianliang: '#B0894E', // 前凉
    liangzhou: '#7A4E2A', // 凉州（汉末凉州之乱：羌胡铁骑，河湟深褐）
    dangchang_guo: '#7B9630', // 宕昌
    sanada: '#A6566B', // 真田
    tokugawa: '#2B4A73', // 德川
    amago: '#556B3C', // 尼子
    shimazu: '#2D5E6E', // 岛津
    mori: '#2F7A57', // 毛利
    uesugi: '#3F7193', // 上杉
    takeda: '#7A2E33', // 武田
    toyotomi: '#BF5B2A', // 丰臣
    utsunomiya: '#6E5A82', // 宇都宫
    nanchou: '#574A8E', // 南朝
    nanbu_shi: '#5B4A6B', // 南部
    shoni: '#3E7A6B', // 少弐
    heishi: '#9C3A3A', // 平氏
    imagawa: '#C2483C', // 今川
    oda: '#A8842C', // 织田
    hojo: '#6B3F8C', // 北条
    mahan: '#8B5A2B', // 马韩
    daquyue: '#A93F55', // 大瞿越
    yuenan: '#8E3B5C', // 越南
    chalkidike: '#8A5CF6',   // 卡尔基季基同盟
    naxos: '#C2410C',   // 纳克索斯
    phokis: '#0F766E',   // 福基斯
    wuguobu: '#7C2D12',   // 五国部
    balti: '#4D7C0F',   // 巴尔蒂
    // 🔴 [2026-11-05 按A执行] qingyuan_yijun（清远义军）已并入大元，固定色删除
    zhenghe_yijun: '#0C4A6E',   // 头陀军（黄华：号头陀军、又称畲军）
    // ── 2026-11-03 补势力色（校验提示「缺 HistoricalFactionColors」的两家）──
    hulumusi: '#00838F',   // 忽鲁谟斯（霍尔木兹王国·扼波斯湾口的商港，无专属尚色→按史地取海湾深青；含「霍」字青碧之色）
    bolinixiya: '#C2185B', // 波利尼西亚（波马雷王朝旗为红白红三横条，取旗面绛红）
    wu_han: '#7A4B2A', // 汉初吴国（刘濞，前195–前154，都广陵）
    qi_zhangbu: '#4E6E58', // 张步齐（临淄割据，23–29）
    wangdaer: '#3F6E8C', // 汪达尔—阿兰王国（439 迦太基–534 拜占庭灭）
    kesaiya: '#6E5B3F', // 科塞亚部族（扎格罗斯山，前4世纪抗亚历山大）
    muxikani: '#8C6A2F', // 穆西卡尼部族（印度河下游，前4世纪）
    houmojietuo: '#9C5B2E', // 摩揭陀·普那伐摩（7世纪初）
    sumo: '#5F7A2F', // 苏摩国（孟加拉 Suhma，前6世纪）
    gushu: '#2F6B6B', // 古蜀·开明王朝（前4世纪–前316 秦灭）
    yidali_odoacer: '#7A2F2F', // 奥多亚克意大利王国（476–493，都拉文纳）
    gaoda: '#8C4A6E', // 高达王国（设赏迦，约590–626）
    kelite_amier: '#3F5E7A', // 克里特埃米尔国（约824–961）
    kelimiya_han: '#5B4E7A', // 克里米亚汗国（1441–1783）
    guzigan: '#4A6E4A', // 古兹甘·法里贡王朝（9–11世纪初）
    bahemani: '#7A5F2F', // 巴赫曼尼苏丹国（德干，1347–1527）
    halapengcai: '#6E3F5E', // 哈利奔猜王国（泰北孟族，约750–1292）
    dongchahatai: '#2F5F8C', // 东察合台汗国（蒙兀儿斯坦，1347–1680）
    buhala: '#8C5F4A', // 布哈拉埃米尔国（曼吉特，1785–1920）
    biluzhi: '#4A5F2F', // 俾路支·林德部落联盟（1480–1533）
    bonape: '#2F7A5F', // 波纳佩·绍德勒王朝（南马都尔，约1200–1628）
    xiaweiyi: '#6A5F8C', // 夏威夷王国（1795–1893）
    yidali_hre: '#8C7A2F', // 意大利王国（神圣罗马，962–1801）
};

function assertUniqueFixedColors(map: Record<string, string>): void {
    const hexOwner = new Map<string, string>();
    for (const [fid, hex] of Object.entries(map)) {
        const key = hex.toUpperCase();
        const prev = hexOwner.get(key);
        // 🔴 [2026-11-03 主人令「没有打过仗的，可以旗号，颜色一致」] 同系政权（FactionLineage）放行同色
        if (prev && getLineageRoot(prev) === getLineageRoot(fid)) continue;
        if (prev) {
            throw new Error(
                `[HistoricalFactionColors] hex 重复: ${fid} 与 ${prev} 均为 ${hex}`,
            );
        }
        hexOwner.set(key, fid);
    }
}

assertUniqueFixedColors(_FIXED);

export const HISTORICAL_FACTION_COLORS: Readonly<Record<string, string>> = Object.freeze({
    libiya: '#3B9B41', // 利比亚（经典战导入）
    jiaxite: '#8E9B3B', // 加喜特（经典战导入）
    // 🔴 [2026-10-24] 恢复 2026-10-23 归并时被并入占位势力的各家政权（沿用归并前原色）
    qiufu: '#8B56AB',
    chendiaoyan: '#AC2A72',
    yezongliu: '#2195A0',
    qianhui: '#A9B527',
    miaomin: '#36B9C7',
    zhongxiang: '#C43A30',
    yang_bozhou: '#6876B7',
    she: '#C36DA6',
    tan_d: '#982F63',
    wumeng: '#2A2624',
    boren: '#4A6858',
    sou: '#7F66B9',
    qiong: '#79DE51',
    dongzu: '#148F77',
    shengmiao: '#CF684F',
    buyi_d: '#1F618D',
    shuizu: '#2E506B',
    haikou: '#5888A8',
    liuzhen: '#8E2F2F',
    kilwa: '#C79A3B', // 2026-10-24 环非洲新势力
    mombasa: '#2E8B57', // 2026-10-24 环非洲新势力
    mogadishu: '#1F7A6B', // 2026-10-24 环非洲新势力
    malindi: '#8F6B3F', // 马林迪（斯瓦希里海岸，赭）
    zuraid: '#6A5ACD', // 2026-10-24 环非洲新势力
    pattani: '#D4AF37', // 北大年·北大年苏丹国（金黄）
    latin_empire: '#5B21B6',   // 拉丁帝国
    anjou: '#B45309',   // 安茹
    pisa: '#047857',
    yaqi: '#137547',   // 亚齐苏丹国
    zhamolin: '#9C3828',   // 扎莫林（古里）   // 比萨共和国
 ..._FIXED });

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

// @ts-ignore
if (import.meta.hot) {
    // @ts-ignore
    import.meta.hot.accept();
}
