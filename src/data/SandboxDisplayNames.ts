/**
 * SandboxDisplayNames.ts
 *
 * 沙盒模式下势力旗帜上要渲染的"短名"字典 (factionId → 1-2 字)。
 *
 * 历史: 原本作为局部变量定义在 CityAssetManager.getProcessedFlagText 内部，
 * 但 CityEditor 等 UI 需要在编辑时实时检查"某 faction 是否登记了旗号短名"，
 * 因此抽取到独立文件，两个消费者都 import。
 *
 * ⚠ 规范 (来自 cities.ts 顶部注释 + AGENTS.md §4.4):
 *   - 单字势力 (如秦、汉、唐): 用单字
 *   - 复姓/双字势力 (如 hongbang 鸿庞, daxia 大夏, gongsun_d 公孙):
 *     **必须**用完整双字。系统底层 DynamicFlagTextGenerator 原生支持双字垂直排版，
 *     **绝对不允许简化为单字**（如把鸿庞简写为"庞"、大夏简写为"大"）。
 *   - **政权（优先级 2）**：旗号 = 史籍**正式国号**（如 大理、大清、大周、百济、黎）。
 *     禁止自造截字（后百）、地名代国号（兰）、姓代国号（甄）、后缀国/族/人（黎国）。
 */
export const SANDBOX_DISPLAY_NAMES: Record<string, string> = {
  heishui: '黑水',
  yangzhou: '洋',
  sizhou: '泗',
  fengzhou: '凤',
  fushi: '苻',
  kelie: '札合',
  donghui: '东濊',
  gonggu: '宫古',
  fuguo: '附',
  gongtang: '贡唐',
  chizhou: '池',

  yada: '厌抵', // 嚈哒帝国@悉万斤；异称避与 yanda「嚈哒」撞旗
  quli: '渠犁',
  'guazhou': '瓜',
  'guishuang': '贵霜',
  juandu: '捐毒',
  sai: '塞',
  yangtong: '羊同',

    'zhancheng': '占城',
    'monong': '墨侬',
    'shuizhen': '水真',
    'yueyi': '嶲',
    'wala': '瓦剌',
    'wuliangha': '兀良',
    'dingling': '丁零',
    'nifuhe': '尼夫',
    'nanzhong': '南中',
    'muer': '穆尔',
    'xiajiasi': '坚昆',
'zhen': '武珍',
    'dongshengwei': '胜',
    'dizhou': '棣',
    'weihaiwei': '威海',
    'shang': '商',
    'zhou': '周',
    'qi': '齐',
    'jin': '晋',
    'chu': '江陵',
    'wu': '吴',
'yue': '越',
    'nanyue': '南越',
    'guangzhou': '广',
    'guangping': '广平',
'duanzhou_d': '端',
    'qin': '秦',
    'song': '宋',
    'yan': '燕',
'zhao': '赵',
'wei': '魏',
'han': '韩',
    'han_d': '汉',
    'shu': '蜀',
    'dian': '通海',
    'xin': '上党',
    'liangzhou': '凉',
    'juqu_d': '沮渠',
    'tufa_d': '秃发',
    'qiuchi': '仇池',
'helian': '赫连',
    'xiongnu': '匈奴',
'xianbei': '鲜卑',
    'jie': '羯',
    'beidi': '羌',
    'tuoba': '拓跋',
    'yuwen': '宇文',
'liang_d': '梁',
    'chen': '陈',
    'sui': '随',
    'tang': '唐',
    'min': '闽',
    'quanzhou': '泉',
    'shazhou': '沙',
'shatuo': '沙陀',
'qidan': '契丹',
    'bing': '并',
'bohai': '渤海',
    'jurchen': '女真',
'dangxiang': '大夏',
'menggu_d': '蒙古',
    'manzhou': '满洲',
    'manzhou_d': '大清',
'ming_d': '大明',
    'liao_d': '大辽',
'dangzhou': '氐',
    'dai_d': '代',
    'dingxiang_d': '定襄',
    'xiayang_d': '夏阳',
    'zhongshan': '恒',
    'wang_d': '王',
'xiao_d': '兰陵',
'li_lx_d': '陇西',
'yuan_cj_d': '袁',
    'xie_cj_d': '信',
'yue_d': '岳',
    'qian_d': '秀',
    'kong_d': '孔',
'cao_d': '曹',
    'jiujiang': '浔',

    'quanrong': '犬戎',
    'suzhou': '肃',
    'sushen': '肃慎',
    'chile': '敕勒',
'rouran': '柔然',
'baishui': '景谷',
    'baiji': '百济',
'tubo': '吐蕃',
    'tujue': '突厥',
'tiele': '铁勒',
    'jingzhou_gs': '泾',
    'guo': '果',
    'zi': '资',
    'long2': '陇',
    'song2': '松',
'qing': '庆',

    'jingmen': '荆门',
'huige': '回纥',
    'dayue': '大越',
    'yamato': '大和',
'edo': '德川',
    'izumo': '出云',
    'satsuma': '萨摩',
    'ryukyu': '琉球',
    'so': '对马',
    'gaya': '伽倻',
    'aki': '安艺',
    'echigo': '越后',
    'kai': '甲斐',
    'chosokabe': '土佐',
    'hashiba': '丰臣',
    'shimotsuke': '下野',
    'aizu': '会津',
    'xingliao': '兴辽',
'gongsun_d': '辽东',
    'jiaodong': '胶东',
    'jibei': '济北',
    'wusun': '乌孙',
'dayuan': '大宛',
    'gouding': '句町',
'dongxian': '东海',
    'tongma': '铜马',
    'tongzhou': '同',
    'baibo': '黄巾',
    'wuhuan': '乌桓',
    'xianlingqiang': '先零',
'cheshihou': '车师',
'yelang': '夜郎',
'ailao': '哀牢',
'fuyu': '夫余',
'shule': '疏勒',
    'loulan': '楼兰',     // 精绝·东汉都护府楼兰属国屯戍（原扜泥城）
    'shache': '莎车',
'qiuci': '龟兹',
    'yanqi': '焉耆',

    'gaogouli': '高句',
    'xinluo': '新罗',
    'donghu': '东胡',
    'luoyue': '骆越',
    'ba': '巴',
    'hezhou': '合',
    'chanzhou': '澶',
'qifu_d': '乞伏',
    'tuyu_d': '吐谷',
    'linyi': '林邑',

    // 2026-05-25 两晋核对追加势力
    'murong': '慕容',
    'yingzhou_ying_d': '营',
    'erzhu': '尔朱',

'pizhou': '邳',

    // 2026-05-25 汉朝核对追加势力
'zhai_han': '翟',
    'yin': '殷',
    'hejian': '莫',
    'qu_d': '麴',
'liu': '九江',
    'ouyue': '台',

    // 2026-05-25 三国核对追加势力
    'xiangzhou': '襄',
    'zaoyang_d': '舂陵',
    // ── 2026-06-16 改：符离·宿（§4.7；旗号「徐」让位下邳徐国）──
    'suzhou_d': '宿',
'didao': '熙',
    'lanzhou': '兰',
    'lu': '庐',
    'gaoqi_d': '高齐',
    'wuzhou_d': '武周',
    'zhuozhou': '涿', // 范阳·避涿邪山旗号涿 §4.1
    'tujia_d': '土家',
    'zhuang_d': '壮',
    'xibo_d': '锡伯',
    'jinling': '南',
    'wuwu_d': '无为',
    'taizhou': '泰',
    'shizhao_d': '石赵',
    'ranwei_d': '冉魏',
    'zu_d': '祖',

    'aisin_d': '爱新', // 建女真皇族；≠大清(manzhou_d)
    'sunwu_d': '孙吴',

    // ── 2026-05-25 新增：隋朝核对追加势力 ──
    'wazhai': '瓦岗',
    'liangshidu': '银',
    'linshihong': '楚南',
'kumo': '楮特',
    'xijue': '十箭',
    'xian_d': '冼',
    'xiqin': '西秦',

    // ── 2026-05-25 新增：唐朝核对追加势力 ──
'xueyantuo': '薛延',
    'tujishi': '突骑',
    'nanzhao': '南诏',
'xiaobolu': '勃律',
    'qiufu': '裘甫',

    // ── 2026-05-25 五代十国势力 ──
    'dongdan': '东丹',
'dali': '大理',
    'luodian': '罗甸',

    // ── 2026-05-25 北宋辽金势力 ──
    'goryeo': '高丽',
'nongzhigao': '邕',
'fangla': '方',

    // ── 2026-05-25 北宋辽金势力 v2 ──
'zhongxiang': '鼎',
    'yang_aner': '登',
    'jinan': '历',
    'dixiang': '新',
    'liwang': '河间',

    // ── 2026-05-25 元朝蒙古势力 ──
    'huarazim': '花剌',
    'pagan': '缅',
    'champa': '占婆',
'dongxia': '东夏',
'chagatai': '察合',
    'ogodei': '窝阔',
    'kereyid': '克烈',
    'naiman': '乃蛮',
    'tatar': '塔塔',
    'merkit': '蔑儿',
'ongut': '汪古',
'xushouhui': '天完',
    'zhangshicheng': '大周',
    'luoping': '新会',
    'chendiaoyan': '漳',

    // ── 2026-05-25 明朝势力 ──
    'fang_guozhen': '浙方',
    'dengmaoqi': '铲平',
'yezongliu': '处',
    'dada_ming': '鞑靼',
'oirat_ming': '卫拉',
    'jianzhou_nvzhen': '建',
'haixi_nvzhen': '海西',
'yeren_nvzhen': '萨哈',
    'jilimi': '吉里',
'hezhe': '赫哲',
    'kakizaki': '松前',
    // ── 2026-06-16 改：旗号「藤原」（§4.4 家族；禁「」字；势力全名仍奥）──
    'fujiwara': '藤原',
'luchuan': '麓川',
    'chijin': '赤斤',
    'juyan_d': '居延',
    'xihai_d': '西海',
    'heyuan_d': '河源',
    'dafeichuan': '大非',
    'joseon': '朝鲜',
    'siam': '暹罗',
    'chenla': '真腊',
    // ── 2026-05-25 明清之际势力（28个）──
    'dashun': '大顺',
    'daxi_ming': '大西',
    'chenghan': '成汉',
    'shuixi': '水西',
    'yang_zhou': '扬',
    'longwu': '隆武',
    'lujian': '婺',
    'chahar': '察哈',
'dzungar': '绰罗',
    'khoshut': '和硕',
    'yarkand': '叶尔',
    'khoja': '和卓',
    'gaxa': '噶厦',
    'jinchuan_g': '金川',
'jinchuan_x': '赞拉',
    'geng': '靖南',
'shuntian': '天地',
    'bailian': '白莲',
    'chimei': '赤眉',
    'miaomin': '苗民',
    'gurkha': '廓喀',
    'xiadun': '夏顿',
    'kazakh': '哈萨',
    'kokand': '霍罕',
    'badakhshan': '达克',
    // ── 2026-05-25 晚清／近代势力（21个）──
    'taiping': '太平',
    'dacheng': '大成',
'pingnan': '平南',
    'pinghai': '平海',
    'qianhui': '回军',
    'miao_qing': '苗军',
    'tuoming': '清真',
    'ashikaga': '室町',
    // ── 2026-05-26 新增：大金、大元 ──
    'dajin': '大金',
    'yizhou': '懿',
    'yuan_d': '大元',

    // ── 2026-05-26 新增：肃慎系势力（挹娄、勿吉、靺鞨）──
    'yilou': '挹娄',
    'wuji': '勿吉',
'mohe': '完颜',

    // ── 2026-05-26 新增：室韦（隋唐时期东北亚部落联盟）──
'shiwei': '室韦',

    // ── 2026-05-26 新增：濊貊、毛文龙（毛文龙旗号用"毛"）──
'huimo': '濊貊',
    'mao_wenlong': '毛',

    // ── 2026-05-26 新增：漠北草原势力旗号 ──
'gaoche': '高车',
    'da_yuan': '北元',

    // ── 2026-05-26 新增：西域/中亚势力旗号（14个）──
'kala': '喀汗',
    'xiliao': '辽',
'sogdian': '粟特',
    'kangju': '康居',
    'geluolu': '葛逻',
    'yuchi': '尉迟',
    'an': '安',
    'shi_clan': '石',

    
'huyan': '呼衍',
    'yujiulu': '郁久',
    'ashina': '史那',
    'ashide': '史德',
    'weiming': '嵬名',
    'yeli': '野利',
    'kiyad': '乞颜',
'borjigin': '孛儿',
    'jalair': '札剌',
    'hongirad': '弘吉',
'choros': '萨吾',
    // ── 2026-05-26 新增：青藏高原势力旗号（18个）──
'guge': '古格',
    'ladakh': '玛域',
'tsangpa': '藏巴',
'ganden': '格鲁',
    'bailan': '白兰',
'supi': '苏毗',
    'monpa': '门巴',
    'lopi': '珞巴',
'spurgyal': '悉补',
'khon': '昆',
    'lang_clan': '朗',
    'karmapa': '噶玛',
    // ── 2026-05-26 Phase 3g：云贵高原/岭南/中南半岛/台湾势力旗号 ──
    'ava': '掸',
    'dongxu': '东吁',
    'hantawadi': '汉达',
'baiman': '白蛮',
    'kunming_yi': '昆明',
    'miao': '苗',
    'pyu': '骠',
    'mon': '孟',
    'yang_bozhou': '播',
    'tian_sizhou': '田',
'mu_lijiang': '木',
    'ming_zheng': '明郑',
    'xiou': '西瓯',
    'jing': '京',
    'muong': '芒',
    'paiwan': '排湾',
    'trinh': '郑主',
'nguyen_guangnan': '阮',

    // ── 2026-05-26 Phase 3h：新增賨、僰、谯、折、山越、畲、蒲 ──
    'cong': '賨',
    'langzhou': '阆',
    'zhe_d': '折',
    'shanyue': '丹阳',
    'she_ethnic': '畲',

    
'wuling': '五溪',

    // ── 2026-05-27 新增：汪、向、覃、冉、储 ──
    'wang_s': '汪',
    'xiang_d': '向',
    'tan_d': '覃',
    'ran_d': '冉',
    'chu_d': '舒',
    'hu_d': '胡',

    // ── 自动补全剩余的特殊势力映射，防止显示英文 ──
'cen_d': '岑',
    // ── 2026-05-27 补充：旗号文字缺失的14个势力 ──
    'weili': '尉犁',
    'pishan': '皮山',
    'bandun': '板楯',
    'seljuq': '塞尔',

    // ── 2026-05-27 新增：青衣、五溪、姑蔑 ──
'qingyi': '青衣',
'wuxi': '武陵',
    'gumie': '衢',

    // ── 2026-05-27 新增：生苗 ──
    'shengmiao': '生苗',

    // ── 2026-05-27 新增：且兰 ──

    // ── 2026-05-27 新增：土尔扈特、索、伊吾 ──
    'tuerhute': '土尔',

    // ── 2026-05-27 新增：白马、蒯、庸、申、叟 ──
    'kuai': '蒯',
    'yong': '庸',
'shen': '申',
    'sou': '叟',

    // ── 2026-05-27 新增：烧当 ──
    'shaodang': '烧当',

    // ── 2026-05-27 新增：靖江、盘瑶、马楚、排瑶、士、蒋 ──
    'jingjiang': '靖江',
    'xinjiang': '静江',
    'panyao': '贺',
'changshaguo': '长沙',
    'paiyao': '排瑶',
    'jiang_s': '零陵',

    'li_s': '里',
    'leizhou': '雷',

    // ── 2026-05-28 新增：黎(崖) ──
    // ── 2026-05-28 新增：工布(工布) ──

    // ── 2026-05-28 新增：果洛、土谢图、土默特 ──
    'golog': '果洛',
    'tushetu': '土谢',
    'tumed': '土默',

    
    'she': '奢',

    
    'liao': '僚',

    'nong2': '侬',

    // ── 2026-05-27 重制：药罗葛(娑陵) ──
    'yaoluoge': '药罗',

    // ── 2026-05-28 新增：南部(根城/日本)、萨曼(阿母城/中亚)、西域四政权 ──
    'nanbu': '陆奥',
    'saman': '萨曼',
    'hepan': '喝槃',
'humi': '瓦罕',

    // ── 2026-05-28 新增：马蒙、古兹根、傣、泰沅、帕銮、罗斛 ──
    'mamon': '马蒙',
    'guzgan': '古兹',
    'dai': '傣',
    'taiyuan': '泰沅',
    'luohu': '罗斛',

    // ── 2026-05-28 新增：黑龙江流域民族/家族 ──
    'nanai': '那乃',
    'feiyaka': '费雅',

    'anushidgin': '阿努',
    'nanjie': '南杰',
'gandenpozhang': '冈底',

    
'dawoer': '嫩江',

    'tumengken': '图蒙',
    'liren': '俚',

    // ── 2026-05-28 新增：岭、琼波、索伦、图瓦 ──
    'gling': '岭',
    'khyungpo': '琼波',
'suolun': '达斡',
    'tuva': '图瓦',

    // ── 2026-05-28 新增：大隅(赤尾木城)、奄美(赤木名城) ──
    'osumi': '大隅',
    'anmei': '奄美',

    // ── 2026-05-28 新增：康区藏族土司/部落 ──
    'dalung': '达隆',
    'gar_kham': '德司',
    'kongsa': '孔萨',
    'mingzheng': '明正',

    // ── 2026-05-28 新增：波密(博窝) ──

    // ── 2026-05-28 新增：达擦(八宿宗/康区) ──
    'daca': '达擦',

    // ── 2026-05-28 新增：景东(银生城/云南) ──
    'jingdong': '景东',

    // ── 2026-05-28 新增：霍尔(索宗/那曲) ──
    'hor': '霍尔',

    // ── 2026-05-28 新增：董(囊谦宗/玉树) ──
    'dong': '隆庆',

    // ── 2026-05-28 新增：白狼(巴塘宗/康区) ──
'bailang': '白狼',

    // ── 2026-05-28 新增：后突(黑沙城/阴山北麓) ──
'duolu': '咄陆',
'dulan': '都兰',
'zhuxie': '朱邪',
'hunxie': '浑邪',
    'tiemuer': '帖木',
    'kawusi': '卡乌',
    'keerkezi': '柯尔',
    'yiduhu': '亦都',
    'yangshao': '仰韶',
    'yel': '耶律',
    'guzhu': '孤竹',
    'yizhi': '一支',
    'zhuqian': '筑前',
    'jibei2': '备中',
    'jinchuan': '骏河',
    'totomi': '远江',
    'owari': '尾张',
    'xuan': '宣府',
    'yangshe': '羊舌',
    'sima_d': '司马',
    'liguo': '潞',
    'kang': '康',
    'wudu': '武都',
    'woye': '沃野',
    'shuofang': '朔方',
    'lushui': '卢水',
    'yingli': '应理',
    'guangwu': '广武',
    'huizhou': '会',
    'huizhou_d': '徽',
    'yiwu': '伊吾',
    'pulei': '蒲类',
    'duerbote': '杜尔',
    'zhasaketu': '扎萨',
    'kaerka': '喀尔',
'huihu': '回鹘',
'wuzhumuqin': '乌珠',
'xingan': '布特',
    'zhadalan': '扎答',
    'zhuerqi': '主儿',
    'chechen': '车臣',
'panjun': '叛军',
'changshan': '常山',
'linhu': '林胡',
'lingqiu': '灵丘',
'linyu': '临榆',
'loufan': '楼烦',
'xianyu': '中山',
'yi': '易',
'you': '幽',
'heng1': '元岳',
    'pisha': '毗沙',
    'yumi': '扜弥',
    'keliya': '克里',
    'xiye': '西夜',
    'faqiang': '发羌',
    'jiantang': '建塘',
    'gongbu': '工布',
    'niang': '娘',
    'galangdiba': '波密',
    'ali': '阿里',
'pazhu': '年楚',
    'qiong': '邛',
    'zhuoshi': '卓',
    'chenzhou_d': '辰',
    'qianzhong': '沅',
    'cuanshi': '爨',
    'dianguo': '滇',   // 滇国（拓东城）；旗作「滇」
    'xinggu': '兴古',
    'guangxin': '广信',
    'kejia': '客',
    'tingzhou_d': '汀',
    'chaozhou_d': '潮',
    'ouyang': '欧阳',
    'ningkou': '宁寇',
    'hongzhou': '洪',
'danyang': '宣',
    'huai': '淮',
'huaiyang': '淮阳',
'cai': '蔡',
    'shangzhou': '上洛',
    'ying': '郢',
    'heng': '衡',
    'chen2': '郴',
'shixing': '石兴',
    'shaozhou': '曲江',
    'yidou': '宜都',
    'boren': '僰',
'wanzhou': '万',
    'kui': '夔',
    'danluo': '耽罗',
    'woju': '沃沮',
    'jingcheng_d': '镜',
    'chungju_d': '忠',
'naju_d': '罗',
    'chen3': '欢',
    'sabeol': '沙伐',
    'iga_d': '伊贺',
    'kaga_d': '加贺',
    'date_d': '伊达',
    'higo_d': '肥后',
    'iyo_d': '伊予',
    'otomo_d': '大友',
    'suwa_d': '诹访',
    'beihai': '北海',
    'hui': '濊',
    'luzhou': '渌',
    'xuantu': '玄菟',
    'sambyeol': '沃',
    'sheng_d': '升',
    'jinzhou': '锦',
    'wure': '兀惹',
    'houliao': '东辽',
    'dazhen': '大真',
    'jilin': '吉林',
    'sunite': '苏尼',
    'dayuzi': '大玉',
    'weiwuer': '维吾',
    'wensu': '温宿',
    'keerqin': '科尔',

    // ── 2026-05-31 新增：民族起源地6势力 ──
    'xiangxiong': '象雄',
    'qingqiang': '茂',
    'zhaowu': '昭武',
    'ganzhou': '甘',
'gaoliang': '耿',
    'ruoqiang': '婼羌',

    // ── 2026-05-31 新增：原生小政权都城4势力 ──
    'qiemo': '且末',
    'weitou': '尉头',
'dangchang': '叠',

    // ── 2026-05-31 修复：补齐之前遗漏的10个势力 ──
'zhong': '寿',
    'qingyuan_bd': '清苑',
    'pingyuan': '高唐',
    'yao': '尧',
'xichu': '楚',
'yunzhong': '索头',
    'chunshen': '春申',
    'qian': '矩',
    'wan': '安庆',
    'mi': '糜',
    'hai2': '海',
    'fu2': '抚',
    'xinping': '邠',
    'huan': '环',
    'wei2': '韦',
    'lingzhou': '灵',
    'qiepantuo': '朅盘',
    // ── 2026-06-11 新增：库页岛民族 ──
    'eluoke': '鄂罗',
    'kuye': '库页',
    // ── 2026-06-11 新增：阿伊努（北海道）──
    'ayinu': '虾夷',
    'ruochu': '若敖',
    'mi_chu': '芈',
    // ── 2026-06-11 新增：北海（北海道北端）──
    // ── 2026-06-11 新增：水达达（黑龙江下游）──
    'ewenki': '鄂温',
    // ── 2026-06-11 新增：东平（郡·黑龙江下游）──
    'dongping': '东',
    // ── 2026-06-11 新增：外兴安岭/外贝加尔边境 ──
    'maomingan': '茂明',
    'aola': '敖拉',
    'bulat': '布拉',
    'buriat': '布里',
    // ── 2026-06-11 新增：锡尔河下游（毡的/养吉干）──
    'xianhai': '咸海',
'nandou': '难兜',
'yanda': '阿洪',
    'qincha': '钦察',
    'anxi': '安西',
    'konbaung': '贡榜',
'qi_d': '戚',
    'wangyan': '太行',
    'tianxiong': '魏博',
    'sunqin': '潼津',
'yingzhou_d': '颍',
'yanchuan_d': '郾',
'huang_d': '潢',
'yuzhou': '豫',
'yiyang_d': '义阳',
'mengcheng_d': '山桑',
    'guide_d': '芒砀',
    'lulin': '绿林',
    'dang_d': '虞',
'hao_d': '濠',
    'bozhou_d': '博',
    'hongnong_jun': '弘农',
    'zhengzhou': '郑',
'ruo': '鄀',
    'gar': '噶尔',
    'ruzhou': '汝',
    'yun': '允',
    'jiyuan': '济源',
    'xiongding': '雄',
    'yaozhou': '耀',
    'huo': '霍',
    'mushi': '穆',
    'lai': '莱',
    'lizhou_d': '剑',
    'zuo_d': '笮',
    'zangke': '牂牁',
    'huangwang': '黄',
    'shenshi': '沈',
    'guizhou': '桂',
    'daozhou': '道',
    'dayu': '庾',
    'yingzhou': '英',
    'buyi_d': '布依',
    'hani_d': '哈尼',
    'basha_d': '巴沙',
    'chuzhou_d': '滁',
    'taira': '平',
    'wuman': '乌蛮',
    'yehe': '叶赫',
    
    'xiutu': '休屠',
    'dongzu': '侗',
    'wula': '乌拉',
    'mengwu': '蒙兀',
    'pugu': '仆骨',
    'bayegu': '拔野',
    'ketagalan': '凯达',
    'shanrong': '山戎',
    'suke': '素',
'gaochang': '麴',
    'chuyue': '处月',
    'baiyang': '白羊',
    'baidi': '白狄',
    'duomi': '多弥',
    'wumeng': '溪',
    'lelang': '乐浪',
    'huite': '辉特',
    'zubu': '阻卜',
    'kangba': '康巴',
    'nvguo': '女',
    'jiashi': '迦湿',
    'wuhu': '乌护',
  sanada_d: '真田',
  jiazini: '伽色',
  jibin: '罽宾',
  fanyanna: '梵衍',
    'wuzhou': '武',
    'bailong': '白龙',
    'jilizhou': '积',
    'nuergan': '都卫', // 奴儿干都司；据点名奴儿干城，旗面避 §4.1 防重
    'kepantuo': '渴盘',
    xingxingxia: '伊',
'yangguan': '西凉',
    'wulianghai': '乌梁',
    'qinghai': '青海',
    'xining': '西宁',
'kalun': '柴达',
    'sagami': '相模',
    'mino': '美浓',
    'ssangseong': '和',
    'wenzhou': '温',
    'fu_zhou': '涪',
    // ── 2026-06-19 新增：马尔吉亚纳·乌古斯 ──
    'maer_d': '马尔',   // 彭迪·Margiana；旗号「穆」已被穆氏占用
    'wugu_d': '乌古',     // 毡的·乌古斯突厥
    'adao_d': '阿克',     // 昆岗·阿克苏道军台
    'wuyuan_d': '五原',   // 固阳塞·五原郡
    'chenli_d': '禅',   // 姑衍山·撑犁祭天
    'nuoyan_d': '赛',   // 赛音山达·赛音诺颜部
    'wuli_d': '扎布',     // 扎布汗·乌里雅苏台
    'jiluo_d': '涿邪',    // 涿邪山·窦宪出涿邪
    'heisha_d': '黑沙',  // 特尔门·漠北黑沙境
    // ── Phase 1 Missing Flags ──
    'kumoxi': '奚',
    'haikou': '寇',
    'shanshan': '鄯善',
    guiyi: '归义',
  // —— 2026-06-20 新增：旁遮普·阿托克 ——
  pangzha: '旁遮',
  // —— 2026-06-20 新增：那竭国·顶骨城 ——
  najie: '那竭',
  dulan_d: '杜兰',
  baha: '巴哈',
  hali: '哈里',
  kalan: '卡兰',
  xisi: '锡斯',
  delan: '德兰',
  huluo: '呼罗',
  aba: '阿巴',
  wenling: '温陵',
  qianzhou: '乾',
  'wuyue': '吴越',
  xiyuduhu: '都护',
  shaozhou_d: '邵',
'heishui': '靺鞨',
    'kelie': '杭爱',
    'yada': '嚈哒',
'zizhou': '梓',
    'cangzhou': '沧',
};

// @ts-ignore
if (import.meta.hot) {
    // @ts-ignore
    import.meta.hot.accept((newModule: any) => {
        if (!newModule?.SANDBOX_DISPLAY_NAMES) return;
        const target = SANDBOX_DISPLAY_NAMES as Record<string, string>;
        for (const key of Object.keys(target)) delete target[key];
        Object.assign(target, newModule.SANDBOX_DISPLAY_NAMES);
        console.log(`[HMR] SandboxDisplayNames → ${Object.keys(target).length} 条旗号已热更新`);
        window.dispatchEvent(new Event('hmr:flag-data'));
    });
}
