/**
 * 沙盒模式：势力 id → 首都 cityId（1 势力 = 1 据点）。
 * 由 FactionEditor /api/batch-import 与 cities_v2 同步维护。
 */
export const STARTING_CAPITALS: Record<string, string> = {
    'barakzai_afghan': 'city_gaofu',   // 巴拉克宰（经典战导入，登记用）
    'zand_dynasty': 'city_yisifahan',   // 赞德（经典战导入，登记用）
    'aizu_ashina': 'city_tsuruga',   // 芦名家（经典战导入，登记用）
    'aq_qoyunlu': 'city_dabulishi',   // 白羊王朝（经典战导入，登记用）
    'bulidi': 'city_damasikusi',   // 布里迪王朝（经典战导入，登记用）
    'jinong': 'city_toledo',   // 济农王朝（经典战导入，登记用）
    'tahirid': 'city_nishabuer',   // 塔希尔王朝（经典战导入，登记用）
    'heruli': 'city_ravenna',   // 赫鲁利（经典战导入，登记用）
    'huanchu': 'city_nanjing',   // 桓楚（经典战导入，登记用）
    'gallic_empire': 'city_teerier',   // 高卢帝国（经典战导入，登记用）
    'jingzhou': 'city_xiangyang',   // 荆州（经典战导入，登记用）
    'libiya': 'city_deliboli',   // 利比亚（经典战导入，登记用）🔴 [2026-11-11 按史] 原写凯鲁万（公元六七〇年建，前240年尚无此城）→ 改的黎波里（古典名欧亚，前七世纪腓尼基人所建，利比亚塔尼亚首邑）
    'jiaxite': 'city_babilun',   // 加喜特（经典战导入，登记用）
    'pattani': 'city_pattani',
    // 🔴 [2026-10-24] 恢复 2026-10-23 归并时被并入占位势力的各家政权（登记用，不作开局依据）
    'qiufu': 'city_shanxian',
    'chendiaoyan': 'city_zhangzhou',
    'yezongliu': 'city_chuzhou_zj',
    'qianhui': 'city_xingqing',
    'miaomin': 'city_pinglong',
    'zhongxiang': 'city_wuling',
    'yang_bozhou': 'city_hailongtun',
    'she': 'city_yongning2',
    'tan_d': 'city_cili',
    'wumeng': 'city_shimenguan',
    'boren': 'city_bodao',
    // 🔴 [2026-11-07 主人令「请修复势力」] 越嶲夷首府＝**邛都**（越嶲郡治，今西昌）：
    //    越嶲夷王高定元驻邛都（《华阳国志·南中志》南中三叛：越嶲高定元、建宁雍闿、牂牁朱褒）。
    //    原登记 city_leshan（乐山＝犍为郡南安）会让开局改旗把乐山从蜀汉手里抢给越嶲夷，
    //    而乐山是蜀汉犍为太守何祗的驻地（《三国志·蜀书·杨洪传》附：何祗字君肃，官至犍为太守），
    //    于是何祗在战场上被标成「越嶲夷」。乐山按 cities_v2 仍归蜀汉（shu）。
    'sou': 'city_jianchang',
    'qiong': 'city_jianchang',
    'dongzu': 'city_leigong',
    'shengmiao': 'city_jiading',
    'buyi_d': 'city_luobo',
    'shuizu': 'city_sandou',
    'haikou': 'city_yuanzhishi',
    'liuzhen': 'city_hejian',
    'kilwa': 'city_kilwa',
    'mombasa': 'city_mombasa',
    'mogadishu': 'city_mogadishu',
    'zuraid': 'city_aden',

  // ── [2026-08-26] 大西洋航线七势力（1 势力 = 1 据点）──
  'taino_d': 'city_yala', // 泰诺（古巴东部亚拉）
  'guanche': 'city_telde',
  // 🔴 [2026-11-04 主人令「按历史修复」] 'yasuer'（亚速尔）非政权，首府登记删除（并入葡萄牙）
  // 🔴 [2026-10-13 主人令「添加一个据点，关岛」] 太平洋：查莫罗（主邑阿加尼亚）
  'chamorro': 'city_hagatna',

  'ayinu_ezo': 'city_moyoro',

  'boootiya': 'city_thebes',
  'kelite': 'city_knossos',
  'leangongguo': 'city_salamanca',
  'xixiliwangguo': 'city_palermo',
    'liangxixili': 'city_palermo',
    'gepids': 'city_budapeisi',   // 蒂萨河/潘诺尼亚（今布达佩斯一带）
    'kalbids': 'city_palermo',

  'yipilusi': 'city_anbulajiya',
  'lagoniya': 'city_sparta',
'maqidun': 'city_salonica',
    'sesali': 'city_pelina',
  'lagusa': 'city_ragusa',

'meikelunbao': 'city_rostock',
  'didi': 'city_bruges',
  'yidelisi': 'city_feisi',
  'baojialiya': 'city_teernuowo',
'bosiniya': 'city_sarajevo',

  'mulabite': 'city_malajiashen',
    'awraba': 'city_khenchela',

  'zhayan': 'city_teleimusen',
  'hamade': 'city_bujiaya',
'buni': 'city_jiataji',
  'aguelabu': 'city_kailuwan',
'jileinaijia': 'city_banjiaxi',

  'maixiya': 'city_oxford',
  'nidelan': 'city_hague',
'pomeilaniya': 'city_shiqieqing',
  'talanduo': 'city_talanduo',
  'safuyi': 'city_shangbeili',
  'jiatailuoniya': 'city_barcelona',
  'nasier': 'city_granada',
'seleisi': 'city_plovdiv',

  'pufaerci': 'city_heidelberg',
  'hansa': 'city_hamburg',
  'batawei': 'city_hague',
  'weijing_york': 'city_york',
  'aquidan': 'city_bordeaux',
  'puluowangsi': 'city_avignon',
  'lunbadi': 'city_milan',
'donggete': 'city_ravenna',
  'xigete': 'city_toledo',
  'alagong': 'city_zaragoza',
  // 🔴 [2026-10-24 补登记] 撒丁阿尔博雷亚判官国（主人授权新建；埃莱奥诺拉都奥里斯塔诺）
  'aboerleiya': 'city_oristano',

  'xila': 'city_yadian',
'fulandesi': 'city_calais',
'bulabante': 'city_bulusaier',
  'gaolu': 'city_bali',
  'kaernute': 'city_shatteer',
  'xiongren': 'city_saigede',
    'awaer': 'city_saigede',
  'yinggelan': 'city_winchester',
  'piketai': 'city_aidingbao',
  'mangsite': 'city_kasheer',
'tuomengde': 'city_limerick',
  'bulietani': 'city_rennes',
  // 🔴 [2026-10-25 按史修正首府登记] 塞尔维亚 1346 年杜尚加冕于**斯科普里**（塞尔维亚帝国都城）；贝尔格莱德 1319–1404 属匈牙利，
  //    杜尚在世时不在塞手中（贝尔格莱德仍是塞尔维亚城市，cities_v2.factionId 不变；1456 匈牙利守城那段建筑风格仍 MAGYAR）。
  //    原登记 city_belgrade 是旧「一势力一据点」时期的值，会让「势力时代×首府文化」被判成 城堡×MAGYAR（匈牙利王国军团）。
  'saierweiya': 'city_skopje',

  'luoma_diguo': 'city_luoma',
  'putaoya': 'city_lisiben',

  'habusibao': 'city_weiyeena',
  'boximiya': 'city_bulage',
    'yidali_wangguo': 'city_luoma',
    'luxitaniya': 'city_lisiben',
    'tuoerkete': 'city_tenochtitlan',
    'yadian_gongguo': 'city_yadian',
    'mayapan': 'city_uxmal',
    'songhai': 'city_timbuktu',
    'shahi': 'city_baishawa',
    'xisa': 'city_patan',
    'xilawangguo': 'city_thebes',
    'ante': 'city_jifu',
    'suweihui': 'city_boertu',
    'yibiluliya': 'city_dibilisi',
    'yicha': 'city_tikal',
    'mengjiala': 'city_geergang',
    'yili': 'city_budapeisi',
    'daqiya': 'city_sofia',
    'qiajia': 'city_kamanniya',
    'arevaci': 'city_numantia',
    'epirus_despotate': 'city_anbulajiya',   // 登记用，不改据点归属
    'teotihuacan': 'city_tikal',   // 登记用，不改据点归属
    'salakanagara': 'city_wandan',   // 登记用，不改据点归属
    'helvetii': 'city_geneva',   // 登记用，不改据点归属
    'hussites': 'city_bulage',   // 登记用，不改据点归属
    'cherusci': 'city_bulunruike',   // 登记用，不改据点归属
    'rashtrakuta': 'city_hengbi',   // 登记用，不改据点归属
    'andean_rebellion': 'city_diyawanake',   // 登记用，不改据点归属
    'abkhazia_kingdom': 'city_kutayixi',   // 登记用，不改据点归属
    'mac_dynasty': 'city_shenglong',   // 登记用，不改据点归属
    'restored_hanthawaddy': 'city_bago',   // 登记用，不改据点归属
    // 🔴 [2026-11-09 主人令「建州女真和大清势力合并」] 原 jianzhou → city_tongjiajiang 的首府登记已删（浑江本属 manzhou_d）
    'bashkir': 'city_kashan',   // 登记用，不改据点归属
    'drevlians': 'city_zhytomyr',   // 登记用，不改据点归属
    'marcomanni': 'city_bulage',   // 登记用，不改据点归属
    'serbia_revolution': 'city_nis',   // 登记用，不改据点归属
    'caledonia': 'city_scone',   // 登记用，不改据点归属
    'goths_migration': 'city_weishibi',   // 登记用，不改据点归属
    'syracuse': 'city_syracuse',   // 登记用，不改据点归属
    'hamdanid': 'city_alepo',   // 登记用，不改据点归属
    'wiman_joseon': 'city_pyongyang',   // 登记用，不改据点归属
    'gusiluo': 'city_ledu',   // 登记用，不改据点归属
    'old_saxons': 'city_magedebao',   // 登记用，不改据点归属
    'alamanni': 'city_meiyinci',   // 登记用，不改据点归属
    'taifa_toledo': 'city_cordoba',   // 登记用，不改据点归属
    'florence': 'city_florence',   // 登记用，不改据点归属
    'tuitonga': 'city_mua',   // 登记用，不改据点归属
    'rapanui': 'city_rapanui',   // 登记用，不改据点归属
    'later_baekje': 'city_jeonju',   // 登记用，不改据点归属
    'arverni': 'city_bali',   // 登记用，不改据点归属
    'imro': 'city_skopje',   // 登记用，不改据点归属
    'bulgaria_third': 'city_sofia',   // 登记用，不改据点归属
    'aksum': 'city_aksum',   // 登记用，不改据点归属
    'milan_duchy': 'city_milan',   // 登记用，不改据点归属
    'lombard_league': 'city_milan',   // 登记用，不改据点归属
    'cilicia_armenia': 'city_waka',   // 登记用，不改据点归属
    'armenia_arsacid': 'city_ailiwen',   // 登记用，不改据点归属
    'syunik_bek': 'city_ailiwen',   // 登记用，不改据点归属
    'northumbria': 'city_york',   // 登记用，不改据点归属
    'wessex': 'city_winchester',   // 登记用，不改据点归属
    'subroman_britain': 'city_winchester',   // 登记用，不改据点归属
    'xinmeiliyan': 'city_oleshky',   // 登记用，不改据点归属
    'aixini': 'city_norwich',   // 登记用，不改据点归属
    'taluma': 'city_batavia',
'mazhaer': 'city_budapeisi',
  'falanji': 'city_kelong',
  'shiwaben': 'city_aogesibao',
  'asikanani': 'city_bolandengbao',
'wende': 'city_magedebao',
  'bafaliya': 'city_leigensibao',
  'ruishi': 'city_basaier',
  'damolaweiya': 'city_buernuo',

'luosi': 'city_jifu',
  'eluosi_diguo': 'city_shengpidebao',
  'daniebo': 'city_simolengsike',
  'qiernigeweifu_gongguo': 'city_qiernigeweifu',
  'jialixiya': 'city_jialiqi',
  'pusikefu_gongheguo': 'city_pusikefu',
  'ouka': 'city_liangzan',
  'xideweina': 'city_boluocike',
  'jinzhang': 'city_salai',
  'baojiaer': 'city_kashan',
'baizanting': 'city_junshitandingbao',
  'bosi_puluosi': 'city_pantika',
'kelimiya': 'city_kafa',
'litaowan': 'city_weierniwusi',
'bolan': 'city_huasha',
'baojian_qishi': 'city_liga',
  'teweier_gongguo': 'city_teweier',
  'suzidaer': 'city_xianuofugeerdede',
  'gesake': 'city_zhapoluore',
  'moerdaweiya': 'city_yaxi',
  'walajiyia': 'city_teergewishite',
  'tiaodun_qishi': 'city_kenisibao',
'shengdian_qishi': 'city_kolossi',
'yelusalengwg': 'city_ake',
  'maerta_qishi': 'city_malta',
  'danmai': 'city_gebenhagen',
    'xinbuli': 'city_jelling',
'ruidian_si': 'city_sidedegelmo',
'kasidiliya': 'city_madeli',
'teluoyi': 'city_teluoyi',
  'peilieya_gongguo': 'city_peilieyasilafu',

'heishui': 'city_lahasusu',
  'fuguo': 'city_mangkangzong',

'yada': 'city_xiwanjin',

    'wei': 'city_hedong',
    'caowei': 'city_xuchang',
    'wuzhou_d': 'city_luoyang',
    'shang': 'city_anyang',
    'zhou': 'city_qishan',
'qi': 'city_linzi',
    'jin': 'city_quwo',
'wu': 'city_gusu',
'yue': 'city_kuaiji',
'qin': 'city_tianshui',
    'yan': 'city_gubeikou',
'gaogouli': 'city_pyongyang',
    'xinluo': 'city_jincheng_silla',
    'ashikaga': 'city_kyoto',
    'yamato': 'city_kyoto',   // 大和朝廷（平安京；与室町同城登记，仅编辑器参考）
'zhao': 'city_handan',
'song': 'city_bianliang',
'han': 'city_xinzheng',
'han_d': 'city_hanzhong',
    'shu': 'city_chengdu',
'juqu_d': 'city_biaoshi',
'tufa_d': 'city_qingtang',
'qiuchi': 'city_qiuchi',
'helian': 'city_tongwancheng',
'xiongnu': 'city_toumancheng',
'xianbei': 'city_gaxian',
'tuoba': 'city_datong',
'yuwen': 'city_wuchuanzhen',
'chen': 'city_qingyuan',
'sui': 'city_suizhou',
    'tang': 'city_changan',
    'da_qin': 'city_changan',   // 🔴 [2026-10-28] 大秦（朱泚）｜783 据长安称帝，长安为其都城（同城可与唐将并存）
    // 🔴 [2026-10-28 补登记] 前批新立四家势力的首都（编辑器提示用，不作开局依据）
    'malin': 'city_feisi',      // 马林王朝｜都城 非斯
    'koln': 'city_kelong',      // 科隆大主教区｜主教座城 科隆
    'sur': 'city_deli',         // 苏尔王朝｜舍尔沙 1540 取德里为都
    'dublin': 'city_dublin',    // 都柏林王国｜都柏林
    'min': 'city_fuzhou',
'shatuo': 'city_guanglu',
    'luoyue': 'city_huashan',
    'ba': 'city_chongqing',
'bohai': 'city_ningan',
'dangxiang': 'city_xingqingfu2',
'menggu_d': 'city_karakorum',
'manzhou_d': 'city_shenyang',
'ming_d': 'city_beijing',
'jianwen': 'city_licheng',   // 建文（靖难中据历下·济南，铁铉守城）
'shunde': 'city_hongzhou',   // 顺德（宁王朱宸濠据豫章·南昌）
'liao_d': 'city_linhuang',
'gongsun_d': 'city_liaoyang',
'murong': 'city_jicheng',
'kong_d': 'city_qufu',
'wusun': 'city_chigucheng',
'dayuan': 'city_guishancheng',
    'gouding': 'city_guangnan',

'guishuang': 'city_lanshi',
'rouran': 'city_saierwusu',
    'baiji': 'city_sabi',
'tubo': 'city_luoxie',
'tujue': 'city_otuken',

'dayue': 'city_shenglong',
    'ryukyu': 'city_shuri',
    // 🔴 [2026-09-19 主人定「另立源氏/镰仓势力，要符合历史」]
    //    源氏的据点在**相模国**（源赖朝 1180 年入驻镰仓，相模国即其根据地）；
    //    库里没有镰仓（新建会撞 50km 门槛：镰仓↔江户城仅 44.4km），故用同国的**箱根关**
    //    ——「足柄八口」是镰仓的西门户，地理与史实都对得上。
    // 🔴 [2026-09-19 主人令] 源氏的据点是**镰仓**（源赖朝 1180 年设幕府之地）。
    //    原先暂借箱根关（因镰仓会撞 50km 门槛），现已按「两边据点各自微调」落地镰仓；
    //    箱根关已还给 sagami（北条氏康）。
    // 🔴 [2026-09-19 主人质问「sagami 也是空势力，你没改回去吗」] **归位**：
    //    把箱根关还给 sagami 时，漏了把本行锚定补回来（原被 `genji` 顶掉），
    //    于是 sagami 成了「有据点、无首都锚定」的半残势力（全图仅此 1 处，已补）。
'genji': 'city_kamakura',
    'so': 'city_tsushima',
    'kakizaki': 'city_katsuyama',
    'fujiwara': 'city_yanaginogosho',
    'gaya': 'city_gimhae',
    'chosokabe': 'city_okafu',
    'kaga_d': 'city_jianghu',
'date_d': 'city_xiantai',
    // 🔴 [2026-09-19 主人令「村上武吉换成源义经」] 松山（伊予国）改归**伊予源氏**，
    //    守将 = 源义经（1184 年一之谷后受任**伊予守**，伊予国即其守地，1185 年他在伊予忽那岛统水军）。
    'genji_iyo': 'city_songshan',
    // 🔴 [2026-09-19 主人「能岛／因岛能添加上吗」「同理 iyo_d 也是空势力，你没改回去吗」] **归位**：
    //    村上武吉改驻其真本据**能岛城**（`city_noshima`），`iyo_d`（伊予）的锚定随城迁过去，
    //    不再是「0 据点的空势力」（这是本轮自查出来的另一处半残）。
    //    阵容保持原样未动：守将村上武吉、番号「伊予滩水军」T4。
    'otomo_d': 'city_funei',
    'suwa_d': 'city_gaodao',
'iga_d': 'city_nabari',
    'yizhi': 'city_yuanzhishi',
'xingliao': 'city_longwan',
'cen_d': 'city_cen',
    'baibo': 'city_baibogu',
    'wuhuan': 'city_bailangshan',
'wensu': 'city_dawushenkate',
'yelang': 'city_puding',
'ailao': 'city_baoshan',
'shiwei': 'city_julunbo',
    'fuyu': 'city_fuyu',
'shule': 'city_shule',
    'shache': 'city_shache',
'qiuci': 'city_yiluolucheng',

    'erzhu': 'city_xiurongchuan',


'fushi': 'city_lueyang',
    'hantawadi': 'city_bago',
'ewenki': 'city_nibuchu',
    'ouyue': 'city_taizhou_zj',

    'gaoqi_d': 'city_jingzhou2',
'ranwei_d': 'city_liyang',

'sunwu_d': 'city_wuchang',

'linshihong': 'city_raozhou',
'kumoxi': 'city_raoleshui',
'xijue': 'city_zhizhicheng',

'xueyantuo': 'city_yanran_stone',
'tujishi': 'city_talas',
    'nanzhao': 'city_mengshe',
'xiaobolu': 'city_puticheng',

'dali': 'city_dali_city',
    'luodian': 'city_dafang',

    
'goryeo': 'city_kaesong',
'nongzhigao': 'city_yongzhou',
'fangla': 'city_qingxi',

'yang_aner': 'city_dengzhou',

'huarazim': 'city_urgench',
'pagan': 'city_pagan',
    'champa': 'city_myson',
    'dongxia': 'city_longtanshancheng',
'chagatai': 'city_bieshibali',
'kereyid': 'city_kereyid',
    'naiman': 'city_fuhai',
    'tatar': 'city_tatar',
    'ongut': 'city_jingzhou',
    'zhangshicheng': 'city_changzhou',
'nanyue': 'city_longchuan',
    'dixiang': 'city_nanyang',
    'dengmaoqi': 'city_shaxian',
'dada_ming': 'city_hetao',
'oirat_ming': 'city_kobdo',
'haixi_nvzhen': 'city_huifa',
'yeren_nvzhen': 'city_yeren_base',
    'jilimi': 'city_nanghar',
'luchuan': 'city_mengmao',
'guiyi': 'city_yumenguan',
    'joseon': 'city_hanseong',
    'siam': 'city_ayutthaya',
'chenla': 'city_angkor',
'dashun': 'city_ziwu',
'daxi_ming': 'city_mianyang',
'chenghan': 'city_mianzhuguan',
'longwu': 'city_jianning',
    'lujian': 'city_wuzhou',
    'tumed': 'city_guihua',
'xibo_d': 'city_yili',
    'yarkand': 'city_yinai',
'khoja': 'city_xiuxun',
'jinchuan_g': 'city_leweizhai',
'shuntian': 'city_changhua_tw',
    'gurkha': 'city_kathmandu',
'xiadun': 'city_tingbu',
    'kazakh': 'city_turkestan',
'kokand': 'city_kokand',
    'badakhshan': 'city_fayzabad',

'taiping': 'city_jintian',
    'dacheng': 'city_zhenghe',
    'tuoming': 'city_dabancheng',
'dajin': 'city_huining',
'yuan_d': 'city_shangdu',

    'yilou': 'city_fenglin',
    'wuji': 'city_boduo',


    'gaoche': 'city_junjishan',

'hongirad': 'city_erguna',

'kala': 'city_aoshen',
'sogdian': 'city_varaksha',
    // 🔴 [2026-09-24] 阿斯瓦卡原无首府（为前327 马萨加战役建的势力）→ 把马萨加给它当首府，
    //    这样该城才有锚定武将（克莱奥菲斯）与精锐（阿斯瓦卡兵），同盟军年代闸门也才上得了图
    'aswaka': 'city_masaga',
    // 🔴 [2026-09-24 主人批准] 新据点「索格狄亚那岩」要有锚定势力才上得了图（闸门读首府武将的时代）
    // 🔴 [2026-09-24 §二之二 授权] 新据点「奥诺斯岩」要有锚定势力才上得了图（年代闸门读首府武将的时代）
    // 🔴 [2026-09-25 §二之二 授权] 新据点「马里斯」要有锚定势力才上得了图（年代闸门读首府武将的时代）；
    //    马利势力此前一直没有首府，把马里斯给它当首府，不挤占任何现有城
    'malli': 'city_malisi',
    // 🔴 [2026-09-25] 新据点「居鲁士城」要有锚定势力才上得了图（年代闸门读首府武将的时代）
    'geluolu': 'city_almaliq',
'shi_clan': 'city_tashkent',
'ladakh': 'city_leh',
'tsangpa': 'city_sangzhuzi',
'ganden': 'city_heizong',
    'supi': 'city_payangyi',
'khon': 'city_sajia',
    'lang_clan': 'city_pibo',
    'karmapa': 'city_chubusi',

    'ava': 'city_ava',
'dongxu': 'city_dongxu_old',
    'meitai': 'city_kangla',
    'pyu': 'city_srikshetra',
    'mon': 'city_thaton',
'ming_zheng': 'city_tainan',
    'xiou': 'city_bushan',
    'paiwan': 'city_mudan',

    'she_ethnic': 'city_chimushan',

'wuling': 'city_wulingshan',
    'seljuq': 'city_merv',
    'osman': 'city_buersa',
'bandun': 'city_hanchang',

    'pishan': 'city_pishan',
'tuerhute': 'city_yingsuochuan',
    'weili': 'city_weili',




'xianlingqiang': 'city_yunwu',

'shen': 'city_jinzhou_shanxi',

    'shaodang': 'city_maqu',

    'panyao': 'city_hezhou',




'golog': 'city_niubiziliang',

    // ── 2026-05-28 新增：南部(根城)、萨曼(阿母城)、西域四政权 ──
'an': 'city_bukhara',
    'saman': 'city_amucheng',

    // ── 2026-05-28 新增：马蒙(达尔甘城)、古兹根(法里亚布城)、傣(勐泐城)、泰沅(清坎城)、帕銮(素可泰)、罗斛(呵叻城) ──
    'dai': 'city_mengle',
'taiyuan': 'city_chingkham',
    'luohu': 'city_khorat',

    // ── 2026-05-28 新增：黑龙江流域民族/家族 ──
    
    // ── 2026-05-31 新增：补齐缺失的初始首都 ──
    'weiwuer': 'city_yuergun',

    // ── 2026-05-28 新增：甘丹颇章(扎敦宗)、爱新觉罗(墨尔根城)、广南国(洞海城) ──


    // ── 2026-05-28 新增：图蒙肯(拜达里克牙帐)、俚(珠崖) ──
    'liren': 'city_yazhou',

    // ── 2026-05-28 新增：岭(结古宗)、琼波(丁青宗)、索伦(卜奎)、图瓦(唐努) ──
'gling': 'city_jiegu',
'suolun': 'city_bukui',

    // ── 2026-05-28 新增：大隅(赤尾木城)、奄美(赤木名城) ──

    // ── 2026-05-28 新增：康区藏族土司/部落 ──
    // 🔴 [2026-11-04] 'dalung' 已并入甘丹颇章，首府登记删除
    'gar_kham': 'city_derge',
    'kongsa': 'city_ganzi',

    // ── 2026-05-28 新增：波密(博窝) ──

    // ── 2026-05-28 新增：达擦(八宿宗/康区) ──
    // 🔴 [2026-11-04] 'daca' 已并入甘丹颇章，首府登记删除

    // ── 2026-05-28 新增：景东(银生城/云南) ──

    // ── 2026-05-28 新增：霍尔(索宗/那曲) ──
    'hor': 'city_suozong',

    // 🔴 [2026-11-10 主人令「删除这个势力」] 'dong'（囊谦土司）已删，首府映射删除

    // ── 2026-05-28 新增：白狼(巴塘宗/康区) ──
'bailang': 'city_adunzi',

'duolu': 'city_beiluocheng',
'tiemuer': 'city_samaerhan',
    'keerkezi': 'city_yierkeshentan',
'yiwu': 'city_hamiwei',
    'duerbote': 'city_tuokexun',
    'kaerka': 'city_duluohe',
'huihu': 'city_woluduocheng',
'wuzhumuqin': 'city_wuliyasitai',
'zhadalan': 'city_kuoyitian',
    'zhuerqi': 'city_sangguer',
    'yuchi': 'city_yutian2',
    'yumi': 'city_yumi',
    'xiye': 'city_xiye',
'you': 'city_juyongguan',
'yun': 'city_lushi',
    'galangdiba': 'city_galangzong',
    'cuanshi': 'city_weixian2',
'dianguo': 'city_tuodongcheng',
'xushouhui': 'city_qichun',
    'danluo': 'city_xingzhuting',
    'hui': 'city_heseluo',
    'wure': 'city_niman',
    'sunite': 'city_saihantala',
    'keerqin': 'city_daerhan',
    // -- 2026-05-31 民族起源地6势力 --
    'xiangxiong': 'city_qionglong',
'zhaowu': 'city_huzhan',
    'ruoqiang': 'city_ruoqiang',

    // -- 2026-05-31 原生小政权都城4势力 --
    'qiemo': 'city_qiemo',
    'weitou': 'city_weitoucheng',

    // -- 2026-05-31 补齐遗漏势力 --
'bailian': 'city_junzhou',
'chimei': 'city_ju',
'yanqi': 'city_yanqi',
'qifu_d': 'city_fuhan',
    'khoshut': 'city_dangxiong',
    'qiepantuo': 'city_humicheng',
    'eluoke': 'city_nuotuoluo',
    'buriat': 'city_chita',
'yanda': 'city_huoguocheng',
  'xierhe': 'city_qihe',
'konbaung': 'city_shwebo',
'tianxiong': 'city_daming',
'huaixi': 'city_xuanhu',
'gengshi': 'city_changan',
'shierShijun': 'city_hoalu',
'xishan': 'city_fuchun',
'malla': 'city_kathmandu',
// 🔴 [2026-11-04 主人令「按历史修复」] 'shangdu'（上都朝廷）与 'wistahm'（维斯塔姆）都不是政权，首府登记删除（并入大元／萨珊）
'mihran': 'city_feiluzhabade',
// 🔴 [2026-11-05 按A执行] 'dongyang'（会稽义军）已并入隋国，首府登记删除
'xiwasi': 'city_sivas',
'mengguqieke': 'city_erzincan',
'sumuroyi': 'city_palapag',
    'huangwang': 'city_xianxia',
'yehe': 'city_bamiancheng',
'wula': 'city_wushecheng',
'bayegu': 'city_jiluoshan',
    'ketagalan': 'city_mengjia',
'suke': 'city_shuanghe',
'gaochang': 'city_chiting',
'chuyue': 'city_dushancheng',
    'baidi': 'city_jining',
    'huite': 'city_jinshan',
'zubu': 'city_teerhunjuntai',
    'jiashi_d': 'city_walanaxi',
    'fanyanna': 'city_fanyanna',
    'jiazini': 'city_jiaseni',
    'kepantuo': 'city_gongzhubao',


    'aolitai': 'city_lanbaqiya',
'yangguan': 'city_yangguan',
'xiliangjun': 'city_luoyang',   // 西凉军·董卓据洛阳
'xihai_d': 'city_fusicheng',
    
'dulan_d': 'city_kandaha',
'xisi': 'city_bosite',
'huluo': 'city_helate',
    'shanshan': 'city_loulan',

'wuyue': 'city_hangzhou',
    // ── 2026-06-29 新增：邵州 ──

    'minyue': 'city_chongan',
'funan': 'city_piyetuo',
'lancang': 'city_langbolabang',
'ahaomu': 'city_geergang',
'elunchunzu': 'city_huma',
'tajikezu': 'city_huoluoge',
'jingpozu': 'city_mizhina',
'xingwei': 'city_mubang',
    'saerbadaer': 'city_baihage',
    'yilihanguo_d': 'city_dabulishi',
    'wulaertu': 'city_ailiwen',
'wulaertu_guo': 'city_tushpa',
    'gelujiya': 'city_dibilisi',
'bendou': 'city_telabuzong',
    'saipulusi': 'city_nikexiya',
  'bendou_d': 'city_amaxiya',
    'heti': 'city_hatusha',
'fulijiya': 'city_geerdiweng',
    'ldiya': 'city_sifaerde',
    'pajiama': 'city_peierjiameng',
      'luomu': 'city_yikeniwumu',
'sailiugu': 'city_antiejiya',
'womaya': 'city_damasikusi',
    'xibolai': 'city_yelusaleng',
    'aiji': 'city_mengfeisi',
    'mamuluke': 'city_damasikusi',
'tuolemi': 'city_yalishanda',
    'jialedi': 'city_babilun',
    'paermila': 'city_tademoer',
'abasi': 'city_bageda',
    'xikesuosi': 'city_awalisi',
    'yashu': 'city_niniwei',
    'sijitai': 'city_asu',
    'midi': 'city_hamadan',
'aqimeinide': 'city_bosibolisi',
'sashan': 'city_feiluzhabade',
    'ailan': 'city_susa',
    'safawei_d': 'city_yisifahan',
'sumeier': 'city_wuluke',
    'ayoubu': 'city_alepo',
    'aosiruowen': 'city_aidesa',
    'kesa': 'city_daerban',
'aiaoniya': 'city_yifusuo',
    'jialatai': 'city_ankala',
    'ansxi': 'city_nisa',
    'nabatai': 'city_peitra',
    'xike': 'city_laheer',
    'deli': 'city_deli',
    'mowoer': 'city_agela',
    'jieri': 'city_qunvcheng',
'kongque': 'city_huashicheng',
    'mojietuo': 'city_wangshecheng',
    'boluo': 'city_gaodacheng',
    'dedan': 'city_taima',
    'maidina': 'city_maidina',
    'gulaishi': 'city_maijia',
    'xiemian': 'city_xiemianjieer',
    'salai': 'city_salaichuke',
    'aztec': 'city_tenochtitlan',
'inca': 'city_cusco',
    'maya': 'city_tikal',
    'mapuche': 'city_tucapel',
    'muisca': 'city_bacata',
    'tupi': 'city_guanabara',
    'xibanya': 'city_lima',
    'yiluokui': 'city_onondaga',
    'qimu': 'city_chanchan',
    'talasike': 'city_tzintzuntzan',
    'tailuona': 'city_teyuna',
    'teweierqie': 'city_sanjulian',
    'manzheboyi': 'city_teluowulan',
    'zhelouqi': 'city_ajiemier',
    'suosuo': 'city_kumubi',
    'antiaokegongguo': 'city_latajiya',
    'saimien': 'city_saimien',
    'kaliya': 'city_halikanasu',
'adiyabeina': 'city_aerbeila',
    'kuman_oleshky': 'city_oleshky',
    'tamoyue': 'city_kabufoliwu',
    'bogendigongguo': 'city_mengteluo',
    'bogendi_wangguo': 'city_geneva',
    'amaniyake': 'city_oushi',
    'weiershigongguo': 'city_buyiersi',
    'taimier': 'city_jinqi',
'manding': 'city_timbuktu',
'ethiopia': 'city_aksum',
'zhagewei': 'city_lalibeila',
    'adal': 'city_zeila',
    'malacca': 'city_malacca',
    'sanfoqi': 'city_sanfoqi',
    'medang': 'city_kalasan',
    'ternate': 'city_deernate',
    'sulu': 'city_huoluo',
    'maynila': 'city_manila',   // 🔴 [2026-10-20 主人令「先确定据点是什么建筑风格，再确定据点放什么相同风格的武将……自己判断」] 马尼拉归本地政权马尼拉土邦（原挂西属东印）
    'gurjara': 'city_patan',
    'suomunate': 'city_suomunate',
    'zhuluo': 'city_tanjiawuer',
    'sengjialuo': 'city_anulade',
    'yaqi': 'city_yaqi',
    'zhamolin': 'city_guli',
    'pandiya': 'city_madula',
    'kushi': 'city_mailuoe',
    'aolisha': 'city_puli',
    'kanata': 'city_hengbi',
    'adile': 'city_bijiabuer',
    'yilisi': 'city_aolinpiya',
    'nuowei': 'city_boergong',
    'keernuwaye': 'city_kanpeier',
    'wuer': 'city_wuer',
    'jienei': 'city_jienei',
    'ghana_diguo': 'city_kumubi',
'muwaxide': 'city_labate',
    'yilaka': 'city_suojiamosuo',
    // 🔴 [2026-11-04 主人令「按历史修复」] 'xingelana'（新格拉纳达总督区）并入西班牙，首府登记删除
    'gualani': 'city_yiguasu',
    'bulu': 'city_meng',
'mallabhum': 'city_bishnupur',
    'vidin_tsardom': 'city_baba_vida',
    'samtskhe': 'city_akhaltsikhe',
    'tomara_gwalior': 'city_gwalior_fort',
    'qutb_shahi': 'city_golconda',
    'minangkabau': 'city_pagaruyung',
    'tutul_xiu': 'city_uxmal',
    // 🔴 [2026-09-12] 新增势力必须登记首都，否则沙盒兜底会把它降格成叛军 panshu（见 five-file-sync.md 首都映射铁律）
    // 🔴 [2026-09-23 主人令「先添加据点」] 迦南重新有据点了：推罗（`city_tuile`）。
    //    按上面那条铁律，这里必须登记首都映射 —— 不登记，引擎找不到迦南的立足之地，
    //    会把推罗降格成叛军 panshu。迦南的四件套现成：势力 kanan / 守将阿泽米尔 / 精锐推罗水师。
    //    （2026-09-19 曾一度「迦南不再有据点、只在战场上出现」，2026-09-23 主人令改回。）
    'kanan': 'city_tuile',
    'feilisidin': 'city_jiasa',
    'dasaleiti': 'city_peiliang',
    'kapaduoxiya': 'city_tiyana',
  'dalriada': 'city_dunadd',
  'scotland': 'city_scone',
  'chanka': 'city_andahuaylas',
  'ouchi': 'city_yamaguchi',
  'cueva': 'city_comagre',
  'gujarat': 'city_ahmedabad',
  'arakan': 'city_miaowu',
  'kosala': 'city_sheweicheng',
  'kalinga': 'city_danta',
  'anga': 'city_zhanbo',
  'shunga': 'city_ayuta',
  'antigonid': 'city_kailaina',
'hou_han': 'city_taiyuan',
'yuan_shao': 'city_anyang',
'hou_jin': 'city_daixian',
'hou_zhao': 'city_xingtai',
'da_yan': 'city_fanyang',
'hou_liang': 'city_wudingzhou',
'han_zhao': 'city_lishi',
'dongjin': 'city_nanjing',
'nan_liang': 'city_nanjing',
'hou_qin': 'city_changan',
'yiqu': 'city_weirong',
'hou_zhou': 'city_bianliang',
'lvbu': 'city_xiapi',
'chengjia': 'city_baidicheng2',
'qianshu': 'city_chengdu',
'chuguo': 'city_ying',
'liusong': 'city_nanjing',
'nanqi': 'city_nanjing',
'yangwu': 'city_yangzhou',
'nantang': 'city_nanjing',
'machu': 'city_changsha',
'nanhan': 'city_panyu',
'fangguozhen': 'city_wenzhou',
'liang_shuofang': 'city_ying',   // 鸣凤（萧铣）都江陵（city_ying＝江陵）
'liangshidu': 'city_changze',    // 永隆（梁师都）据朔方，长泽在夏州境内
'qianliang': 'city_wuwei',
'liangzhou': 'city_wuwei',   // 凉州（汉末凉州之乱）治姑臧；与「前凉」同城不同政权（据点代表一片地区）
'dangchang_guo': 'city_diezhou',
'sanada': 'city_ueda',
'tokugawa': 'city_edo',
'amago': 'city_izumo',
'shimazu': 'city_satsuma',
'mori': 'city_yoshida',
'uesugi': 'city_kasugayama',
'takeda': 'city_tsutsujigasaki',
'toyotomi': 'city_osaka',
'utsunomiya': 'city_utsunomiya',
'nanchou': 'city_asuka',
'nanbu_shi': 'city_genjo',
'shoni': 'city_taizaifu',
'heishi': 'city_chijianguan',
'imagawa': 'city_junfucheng',
'oda': 'city_atsuta',
'hojo': 'city_hakone',
'mahan': 'city_yuezhi',
'daquyue': 'city_hoalu',
'yuenan': 'city_fuchun',
'handong': 'city_handan',   // 刘黑闼汉东王都洺州（今邯郸永年）
'douxia': 'city_handan',   // 窦建德夏（都洺州一带）
'mari_ancient': 'city_anate',   // 幼发拉底马里（阿纳特）
'jiaohuangguo': 'city_luoma',
'yalan': 'city_damasikusi',
  // 🔴 [2026-11-01] 三家起义政权补登记首都（消 batch-manager「缺 StartingCapitals」警告；本表登记用，不作开局依据）
  'zhangchu': 'city_huaiyang',      // 张楚·陈胜 都 陈（宛丘＝陈国故都，《史记·陈涉世家》）
  'desheng': 'city_yunyang',        // 德胜·刘通 据 郧阳 称汉王（成化荆襄流民起义）
  // 🔴 [2026-11-05 按A执行] 'wuzhou_yijun'（婺州义军）已并入隋国，首府登记删除
  'chalkidike': 'city_aolinsuosi',   // 卡尔基季基同盟
  'naxos': 'city_chimarros',   // 纳克索斯
  'paeonia': 'city_anfeibolisi',   // 佩奥尼亚（普拉西亚斯湖—斯特鲁马河一带，距安菲波利斯据点约 40 km）
  'messenia': 'city_sparta',   // 美塞尼亚（伊托美山在斯巴达据点 50 km 内）
  'rhodes': 'city_rhodes',   // 罗得
  'zhongshan': 'city_zhongshan',   // 中山（中山武公居顾，即定州）
  'linhu': 'city_yunzhongcheng',   // 林胡（云中一带）
  'chalcis': 'city_thebes',   // 卡尔基斯（在底比斯据点 50km 内）
  'plataea': 'city_thebes',   // 普拉提亚（在底比斯据点 50km 内）
  'methone': 'city_salonica',   // 梅托涅（在佩拉据点 50km 内）
  'macedon_royal': 'city_tiyana',   // 马其顿王军（欧迈尼斯卡帕多细亚总督辖地）
  'arcadia': 'city_sparta',   // 阿卡迪亚同盟（都梅格洛波利斯，在斯巴达据点 50km 内）
  'lycia': 'city_xanthos',   // 吕基亚（克桑托斯）
  'dolopes': 'city_skyros',   // 多洛佩斯（斯库罗斯）
  'thasos': 'city_thasos',   // 萨索斯
  'corinth': 'city_corinth',   // 科林斯
  'melos': 'city_melos',   // 米洛斯
  'argos': 'city_corinth',   // 阿尔戈斯（在科林斯据点 50km 内）
  'epidaurus': 'city_corinth',   // 埃皮道鲁斯（在科林斯据点 50km 内）
  'corcyra': 'city_kefu',   // 科西拉（据点科孚）
  'mytilene': 'city_mytilene',   // 米蒂利尼
  'mantinea': 'city_mantinea',   // 曼丁尼亚
  'phokis': 'city_deerfei',   // 福基斯
  'wuguobu': 'city_wuguo',   // 五国部
  'balti': 'city_puticheng',   // 巴尔蒂
  // 🔴 [2026-11-05 按A执行] 'qingyuan_yijun' 已并入大元、首府登记删除
  'zhenghe_yijun': 'city_zhenghe',   // 头陀军（黄华据政和飞凤山）
    'latin_empire': 'city_junshitandingbao',   // 拉丁帝国
  'anjou': 'city_naples',   // 安茹
  'pisa': 'city_pisa',   // 比萨共和国
  // ── [2026-11-03 补登记] 校验提示缺 StartingCapitals 的六家（本表只作登记，开局仍走 meleeRandomOwners 随机分城）──
  'hulumusi': 'city_hormuz',     // 忽鲁谟斯·霍尔木兹
  'bolinixiya': 'city_tahiti',   // 波利尼西亚·大溪地
  'malindi': 'city_malindi',     // 马林迪苏丹国·马林迪
  'goto': 'city_goto',           // 五岛·五岛（宇久氏·五岛氏水军）
  'omura': 'city_nagasaki',      // 大村·长崎（肥前吉利支丹大名）
  'wandan': 'city_wandan',       // 万丹·万丹（胡椒港）
    'yinduxila': 'city_dinggucheng',
    'asakaini': 'city_aonuosiyan',
    'lugii': 'city_kelakefu',
  'wu_han': 'city_yangzhou',   // 汉初吴国（刘濞，前195–前154，都广陵）
  'qi_zhangbu': 'city_linzi',   // 张步齐（临淄割据，23–29）
  'wangdaer': 'city_jiataji',   // 汪达尔—阿兰王国（439 迦太基–534 拜占庭灭）
  'kesaiya': 'city_hamadan',   // 科塞亚部族（扎格罗斯山，前4世纪抗亚历山大）
  'muxikani': 'city_aluoer',   // 穆西卡尼部族（印度河下游，前4世纪）
  'houmojietuo': 'city_putijiaye',   // 摩揭陀·普那伐摩（7世纪初）
  'sumo': 'city_danmoledi',   // 苏摩国（孟加拉 Suhma，前6世纪）
  'gushu': 'city_chengdu',   // 古蜀·开明王朝（前4世纪–前316 秦灭）
  'gaoda': 'city_gaodacheng',   // 高达王国（设赏迦，约590–626）
  'kelite_amier': 'city_knossos',   // 克里特埃米尔国（约824–961，都干地亚）
  'kelimiya_han': 'city_oleshky',   // 克里米亚汗国（1441–1783）
  'guzigan': 'city_fariyab',   // 古兹甘·法里贡王朝（9–11世纪初）
  'bahemani': 'city_taibade',   // 巴赫曼尼苏丹国（德干，1347–1527）
  'halapengcai': 'city_thaton',   // 哈利奔猜王国（泰北孟族，约750–1292）
  'dongchahatai': 'city_ahexikesi',   // 东察合台汗国（蒙兀儿斯坦，1347–1680）
  'buhala': 'city_jizhake',   // 布哈拉埃米尔国（曼吉特，1785–1920）
  'biluzhi': 'city_kuida',   // 俾路支·林德部落联盟（1480–1533）
  'bonape': 'city_nanmadol',   // 波纳佩·绍德勒王朝（南马都尔，约1200–1628）
  'xiaweiyi': 'city_honolulu',   // 夏威夷王国（1795–1893）
  'yidali_hre': 'city_milan',   // 意大利王国（神圣罗马，962–1801）
};

// @ts-ignore
if (import.meta.hot) {
    // @ts-ignore
    import.meta.hot.accept((newModule: any) => {
        if (!newModule?.STARTING_CAPITALS) return;
        const target = STARTING_CAPITALS as Record<string, string>;
        for (const key of Object.keys(target)) delete target[key];
        Object.assign(target, newModule.STARTING_CAPITALS);
        console.log(`[HMR] StartingCapitals → ${Object.keys(newModule.STARTING_CAPITALS).length} 条首都映射已热更新`);
    });
}

