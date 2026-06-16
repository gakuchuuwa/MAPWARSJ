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
    xushouhui: '#883030', // 天完·红巾军（元末徐寿辉赤旗；避 lvbu 撞色）
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
    mi: '#C0A050', // 糜（朐城糜氏·徐州首富土金）
    hai2: '#A89050', // 海州·朝鲜甲士（铜甲褐）
    jeolla: '#145870', // 全罗·龟船水军（顺天深海蓝）

    // ── 日本精锐远征势力（2026-06-11；hex 全局唯一，彼此 RGB 间距拉开）──
    ashikaga: '#B89840', // 室町足利（枯茶金）
    so: '#4488A8', // 对马弘安御敌（海防青）
    zhuqian: '#9A8060', // 筑前·警固番役（博多土）
    chosokabe: '#1A7090', // 长宗我部（四国海蓝）
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
    bing: '#425066', // 并州·晋阳（苍狼玄铁，配并州狼骑）
    bohai: '#4A7888', // 渤海·神贲禁卫（海东青灰）
    wanyan_d: '#8C4848', // 完颜·拐子马队（女真铁锈褐）
    jinzhou: '#A06830', // 锦州·辽东铁骑（铜橙；无尚赤）
    qing: '#906838', // 庆州·忠孝军（晚金琥珀）
    aisin_d: '#E0DCD4', // 爱新·巴牙喇（白甲浅灰）
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
    yanda: '#586868', // 嚈哒·铁骑（白匈奴灰青）
    saman: '#2E7858', // 萨曼·古拉姆（河中深绿）
    huarazim: '#A85828', // 花剌子模·铁骑（沙漠赭）
    qincha: '#5080A0', // 钦察·康里精骑（草原钢蓝）
    tiemuer: '#904828', // 帖木儿·重装突骑（帖木儿赭红）
    kazakh: '#78A8C0', // 哈萨克·轻骑兵（七河天青）
    seljuq: '#487868', // 塞尔·桑贾尔禁卫（木鹿青绿）

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

    dianguo: '#3878A0', // 滇国·滇池水军（洱海蓝）
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

    zhancheng: '#C88830', // 占城·佛逝象军（占婆金）
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

    machu: '#4A7840', // 马楚·武平军（楚地青）
    // ── 南方精锐远征势力（2026-06-11；hex 全局唯一）──
    nantang_d: '#4A68A0', // 南唐·黑云长剑都（金陵青）
    zhong: '#4E7080', // 仲·北府兵（江淮青灰；原北府@濡须口）
    wuwu_d: '#6A8A7A', // 无为·濡须水畔州治
    jingzhou: '#3E7858', // 荆·忠顺军（荆州深绿；襄阳治所）
    sunwu_d: '#2878A0', // 孙吴·解烦兵（武昌蓝）
    qian_d: '#5888A8', // 钱·游奕军（吴越水蓝）
    heng: '#6A7858', // 衡州（临烝；无远征番号）
    wangyan: '#5A7068', // 太行·八字军（飞狐寨青灰）
    qi_d: '#388858', // 戚·戚家军（横屿藤牌绿）
    tianxiong: '#6A4838', // 魏博·天雄军（明末河北褐；大名成军）

    // ── 北方精锐远征势力（2026-06-11；§2 全 12 + §1 偏北）──
    zhao: '#488898', // 赵·赵边骑（邯郸赵氏青）
    yan: '#8A3838', // 燕·幽州突骑（燕国绛）
    gongsun_d: '#E8E4D8', // 公孙·白马义从（白马白）
    shizhao_d: '#3A2820', // 石赵·黑槊龙骧（羯族玄褐）
    yunzhong: '#8A7858', // 云中·苍头军（代北土黄）
    murong: '#508868', // 慕容·棘城（鲜卑燕骑）
    yingzhou_ying_d: '#887040', // 营·朝阳（黄龙兵）
    gaoqi_d: '#6A4858', // 高齐·百保鲜卑（北齐紫褐）
    yin: '#A08038', // 殷·朝歌（汉初司马卬殷国）
    hejian: '#756048', // 河间·先登死士（乐成/界桥；≠高车 gaoche）
    chile: '#5A7060', // 敕勒·两池军（阴山青灰）
    anshi_d: '#482838', // 安史·曳落河（范阳暗绛）
    lingwu: '#587878', // 灵·朔方军（灵武青灰）
    zhongshan: '#6888A0', // 中山·静塞军（真定水蓝）
    huan: '#6A8870', // 环·宣毅军（环州青绿）
    qingyuan_bd: '#708898', // 清苑·神臂营（保定弩阵灰蓝）
    // tuoba/erzhu/yuwen/shatuo 见上方尚色/草原表

    // ── 河西精锐远征势力（2026-06-11；§7 全 10 + 野利·擒生军）──
    xiliang: '#7A5838', // 西凉·西凉铁骑（金城土褐）
    weiming: '#A89888', // 嵬名·步跋子（党项灰褐）
    yeli: '#586878', // 野利·擒生军（贺兰青灰）
    guiyi: '#C8A868', // 归义·沙州义军（敦煌沙金）
    xianlingqiang: '#688850', // 先零·凉州大马（允吾青绿）
    tufa_d: '#4A5868', // 秃发·南凉铁骑（浇河铁青）
    juqu_d: '#9A7858', // 沮渠·北凉精锐（张掖赭褐）
    liang: '#B89048', // 凉·大甲重阵（姑臧铜甲黄）
    hunxie: '#508898', // 浑邪·甘州铁骑（酒泉青蓝）
    // dangxiang 见上方大夏白

    // ── 川蜀精锐远征势力（2026-06-11；§8 全 10 支）──
    bandun: '#6A8858', // 板楯·賨人勇士（汉昌巴人绿）
    kui: '#789868', // 夔·白毦兵（白帝城青绿）
    qiao_d: '#B89848', // 谯·虎步军（阆中土黄）
    zhuoshi: '#588878', // 卓·连弩士（临邛弩阵绿）
    boren: '#4A6858', // 僰·悬棺武士（僰道苔绿）
    chenghan: '#8A7040', // 成汉·六夷突骑（鹿头关褐）
    shuixi: '#527088', // 水西·罗罗兵（毕节青灰）
    // shu/daxi_ming/tujia_d 见上方表

    sunqin: '#485868', // 潼津·督标秦军（关中青灰）
    wuliangha: '#7A6850', // 兀良·朵颜三卫（兀良哈土褐）
    tujia_d: '#4A7860', // 土家·白杆兵（石柱土司绿）

    // ── 中原精锐远征势力（2026-06-11；hex 全局唯一）──
    cao_d: '#3058A8', // 曹·虎豹骑（曹魏蓝）
    wuzhou_d: '#B85898', // 武周·控鹤军（则天紫）
    ranwei_d: '#508878', // 冉魏·乞活军（冀南青灰）
    zhou: '#6A7A90', // 周·岐阳周师（岐山青灰）
    qi: '#387858', // 齐·齐之技击（临淄碧青）
    suzhou_d: '#6D5B48', // 宿·宿州（符离）
    didao: '#5C3828', // 狄·飞熊军（陇西临洮古狄道县）
    yuan_cj_d: '#8C5840', // 袁·汝南袁氏郡望（无远征番号；先登@乐成见 hejian）
    wuhuan: '#506858', // 乌桓·乌桓突骑（辽西青灰）
    // tang/wei/qin/shang/xia/sui/fu/sunqin 见上方尚色表
    shanyue: '#687858', // 山越·丹阳兵（宛陵城青灰；避 heng 撞色）
    ruochu: '#984838', // 若敖·六卒精锐（楚系赭红）
    mi_chu: '#8B6848', // 芈氏·左右广军（云梦褐；避 xiliang 撞色）
    nanyue: '#6B4423', // 南越（龙川）
    guangzhou: '#1F7060', // 广州·摧锋军（南海碧玉/深水绿，契合岭南与南海水师）
    // chu/song/chen/xiao_d/yue_d/ming_d/haoding 见南方表

    // ── 黑·水德尚黑 / 契丹黑旗 ──
    qin: '#1C1C1C', // 秦
    liao_d: '#302E28', // 大辽
    fu: '#444030', // 苻
    yuwen: '#565048', // 宇文
    qidan: '#36322C', // 契丹

    // ── 补全中城随机势力专属色（2026-06-12） ──
    ba: '#326850', // 巴国（巴山青，合州水军）
    liang_d: '#9C6035', // 梁国（梁土赭，中原重步兵）
    min: '#664A6A', // 闽国（长乐紫，长乐控鹤）
    lu: '#6B7A60', // 庐州（淮西青灰，江淮要冲）
    loulan: '#A6855B', // 楼兰（黄沙褐，楼兰戍）
    fuyu: '#5A6878', // 夫余（雪原蓝灰，金源边军）
    qifu_d: '#826B4A', // 乞伏（陇右土黄，苑川突骑）
    ashina: '#3B6294', // 阿史那（突厥幽蓝/蓝突厥，碎叶镇军）
    dongxu: '#BA7A36', // 东吁（琥珀金/缅甸金，南都象阵）
    jingjiang: '#488A6E', // 靖江（桂林碧绿，靖江府卫）
    you: '#2B5E4B', // 幽州（燕山苍翠，居庸关）
    heng1: '#3A5B6B', // 恒岳（恒山青蓝，雁门关）
    yi: '#6B3A4A', // 易州（紫荆暗红，紫荆关）
    changshan: '#B8C4D0', // 常山（白马银灰，白马义从）
    xianyu: '#7B6B4A', // 鲜虞（中山古铜，中山铁卒）
    linhu: '#8B6B3A', // 林胡（草原赭黄，林胡骑）
    lingqiu: '#9B3A3A', // 灵丘（飞虎赤褐，飞虎军）
    linyu: '#4A5A6B', // 临榆（碣石靛蓝，夷丁突骑）
    loufan: '#6B5B4A', // 楼烦（塞北土棕，楼烦兵）
    hongnong_jun: '#5A8A3A', // 弘农（桃林翠绿，桃林射士）
    ruo: '#7A6A4A', // 鄀国（商於赭石，商於材官）
    ruzhou: '#6B6B5A', // 汝州（广成灰褐，广成健卒）
    yun: '#8A6A3A', // 允戎（陆浑赭黄，陆浑戎骑）
    zhi_state: '#5A6B7A', // 轵国（太行钢蓝，太行飞军）
    xiongding: '#6B4A5A', // 雄定（碗子城紫褐，碗子城军）
    yaozhou: '#9A8A3A', // 耀州（金甲铜黄，金甲卫）
    mushi: '#5A5A7A', // 穆氏（丘穆陵靛紫，丘穆陵骑）
    xiazhou: '#3A7A6B', // 峡州（峡江碧绿，峡江水军）
    zuo_d: '#7A5A3A', // 笮人（南中赭褐，南中叟兵）
    lizhou_d: '#6A8A9A', // 利州（白水青蓝，白水军）
    hongnong: '#8B6A4B', // 弘农郡（桃林棕褐，桃林射士）
    zheng_state: '#A55146', // 郑国（成皋赤铜，成皋部曲）
    ruo_state: '#4B6554', // 鄀国（商於暗绿，商於材官）
    huo: '#5C6B73', // 霍国（霍邑冷铁，霍邑锐士）
    lai: '#3E7C85', // 莱国（齐莱海青，齐莱锐士）
    zangke: '#2F7A50', // 牂牁（夜郎雨林绿，夜郎锐卒）
    wey: '#6D323A', // 卫国（卫国暗红，朱龙骑）
    liguo: '#857053', // 黎国（黎国沙土褐，黎之耆戎）
    yiyang_d: '#4F6B8A', // 义阳（义阳青蓝，申息锐师）
    anding_wei: '#614B3B', // 安定（安定卫土褐，长征健儿）
    chijin: '#C14B3A', // 赤斤（赤斤红，赤斤蒙古卫）
    ning: '#355C4A', // 宁州（宁州墨绿，江西勤王军）
    chen3: '#8F6E8F', // 月支（月支紫褐，击刹兵）
    danluo: '#325272', // 耽罗（耽罗海蓝，三别抄）
    dengmaoqi: '#9C4A3A', // 铲平（铲平起义红，铲平军）
    dazhen: '#737A6A', // 大真（大真冷灰绿，渤海八猛安）
    helian: '#3D4E5B', // 赫连（铁弗钢蓝，铁弗卫队）
    kiyad: '#70593B', // 乞颜（乞颜草原黄，那可儿）
    kumo: '#6B5C4D', // 奚族（奚族皮甲褐，楮特奥隗部）
    tsangpa: '#A18A4A', // 藏巴汗（藏巴汗藏金，藏巴汗卫队）
    huangwang: '#B58A3A', // 黄王（冲天黄，冲天军）
    shenshi: '#4A6B5A', // 吴兴沈氏（吴兴墨绿，吴兴部曲）
    guizhou: '#A569BD', // 桂州（桂州紫，静江军）
    paiyao: '#2E86C1', // 排瑶（排瑶蓝，八排瑶丁）
    daozhou: '#F39C12', // 道州（道州土黄，湘军道营）
    dayu: '#5D6D7E', // 大庾（大庾青灰，南赣标军）
    yingzhou: '#1ABC9C', // 英州（英州青，南汉巨象军）
    chuzhou_d: '#8A3A3A', // 滁州（淮西赤，大明龙骧卫）
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
