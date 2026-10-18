/**
 * 武将生卒年表（generalId → { 生年 birth, 卒年 death[, 登场年 debut] }）。
 * 登场年默认 = 生年 + 20（20 岁登场），由 `getGeneralDebutYear` 推算，不重复存。
 *
 * 🔴 [2026-10-15 主人定] 每位武将记录三项年份：生年、卒年、登场年（= 生年 + 20）。
 *
 * 🔴 [2026-10-16 修两个口径坑，改这张表/登场闸门前必读]
 *  · **无 0 年**：生年 + 20 若跨到公元 0 年（生年恰为 -20），登场年顺延到**公元 1 年**
 *    （前 20 年 + 20 = 0 年不存在）。统一由 `debutYearOf()` 算，别处不许再写 `birth + 20`。
 *  · **20 岁前卒的**（生年 + 20 晚于卒年，如贞德卒时 19 岁）：登场年以**卒年兜底**，
 *    保证任何收录武将至少有一年可登场；但真要让他/她演成名那几年，就在条目里写 `debut`。
 *  · 例外登场年**只写在 `debut` 字段**（20 岁前就已成名的个例，如贞德 1429 解奥尔良之围），
 *    写了以它为准——不重复存生年+20 能算出来的值。
 *
 * ── 标注口径（改这张表前必读，口径不一致数据就废了）──
 *  · 公元后用**正数**：公元 155 年 = 155；公元前用**负数**：前 356 年 = -356。没有 0 年。
 *  · 本表要覆盖**全部在册武将**（剧本期登场闸门靠它），所以考据查不到确切生卒年的也补了估算值：
 *    这类行一律打 `kaoju: '推定'`；考据有值但与本表取值不同（另一种说法）打 `kaoju: '异说'`。
 *    ⚠ 带标记的行＝**数值不可当真**；要拍板请对照 `docs/武将生卒年-全表考据完成版.csv`
 *    与 `docs/武将生卒年-游戏表与考据差异清单.csv` 逐条定。未打标的行 = 与考据完成版一致。
 *  · 生卒年有争议的，取**正史通行值**，直接写数、**不写「约」字**（主人定）。
 *  · 与 GENERAL_CENTURIES（成名世纪）口径区分：本表是**生年/卒年**，不是成名年。
 *
 * 校验：登场年统一走 debutYearOf()（跳过不存在的 0 年、不晚于卒年）；
 *      kaoju 标记 **709** 条（推定 558 ／ 异说 151，2026-10-16 比对考据完成版所得）。
 */

export interface GeneralLifeYears {
    /** 生年（公元年正数、公元前负数） */
    birth: number;
    /** 卒年（公元年正数、公元前负数） */
    death: number;
    /**
     * 登场年（**只给例外**，默认不写＝按「生年 + 20」推算）。
     * 用于 20 岁前就已成名的武将（如贞德 1429 年解奥尔良之围时 17 岁、19 岁卒）；
     * 写了则以它为准，不再看生年 + 20。
     */
    debut?: number;
    /**
     * 与考据完成版（`docs/武将生卒年-全表考据完成版.csv`）的对齐标记，**只写对不上的条目**：
     *  · `'推定'` = 考据判生年/卒年无载（无载／仅活跃年代／传说／缺项），本行数值是**补的估算值**
     *               —— 剧本出场窗口不可当真（逐条见 `docs/武将生卒年-游戏表与考据差异清单.csv`）；
     *  · `'异说'` = 考据两项都有值，但与本行取值不同（另一种说法），需要时按考据或另说裁定。
     * 不写 = 与考据完成版一致。
     */
    kaoju?: '推定' | '异说';
}

/** generalId → 生卒年。键顺序：按生年从古到今。 */
export const GENERAL_LIFE_YEARS: Record<string, GeneralLifeYears> = {
    // ── 上古/神话：主人定的主流学术断代定值（2026-10-15）──
    sumeier_zhajixi: { birth: -2359, death: -2335, kaoju: '推定' },      // 扎吉西（卢加尔扎克西）
    wuer_wuernamu: { birth: -2142, death: -2095, kaoju: '推定' },         // 乌尔纳姆
    guyashu_shamushi: { birth: -1845, death: -1776, kaoju: '推定' },      // 沙姆希阿达（沙姆希阿达德一世）
    xikesuosi_salidi: { birth: -1670, death: -1630, kaoju: '推定' },      // 萨利蒂（萨利蒂斯）
    dibisi_tutemosi: { birth: -1486, death: -1425, kaoju: '异说' },       // 图特摩斯三世
    heti_muwatali: { birth: -1320, death: -1272, kaoju: '推定' },         // 穆瓦塔利二世
    aiji_lameisisi: { birth: -1303, death: -1213 },        // 拉美西斯二世
    shang_fuhao: { birth: -1245, death: -1192, kaoju: '推定' },           // 妇好
    yamaxun_xibolvte: { birth: -1230, death: -1190, kaoju: '推定' },      // 希波吕忒
    teluoyi_heketuoer: { birth: -1215, death: -1184, kaoju: '推定' },     // 赫克托耳
    ailan_shuteluke: { birth: -1205, death: -1155, kaoju: '推定' },       // 舒特鲁克·纳克杭特
    zhou_jifa: { birth: -1087, death: -1043, kaoju: '异说' },             // 姬发（周武王）
    yin_dixin: { birth: -1085, death: -1046, kaoju: '推定' },             // 子受（商纣）
    xibolai_dawei: { birth: -1040, death: -970, kaoju: '异说' },          // 大卫王
    wulaertu_guo_saerdu: { birth: -865, death: -828, kaoju: '推定' },     // 萨尔杜里一世
    shen_shenbo: { birth: -860, death: -790, kaoju: '推定' },             // 申伯
    // ── 名将：生卒年有正史/权威出处 ──
    aqimeinide_daliushi: { birth: -550, death: -486 },     // 大流士一世
    tuolemi_tuolemi: { birth: -367, death: -282 },         // 托勒密一世
    muxikani_muxikanuosi: { birth: -360, death: -325, kaoju: '推定' },    // 穆西卡诺斯
    gen_alexander_great: { birth: -356, death: -323 },   // 亚历山大
    beileinisi_tuolemiershi: { birth: -309, death: -246, kaoju: '异说' }, // 托勒密二世
    guide_d_xiaohe: { birth: -257, death: -193, kaoju: '推定' },          // 萧何
    han_d_liubang: { birth: -256, death: -195, kaoju: '异说' },           // 刘邦
    gen_hannibal: { birth: -247, death: -183 },           // 汉尼拔
    yangshao_zhoubo: { birth: -240, death: -169, kaoju: '推定' },         // 周勃
    xiongnu_maodun: { birth: -234, death: -174, kaoju: '推定' },          // 冒顿单于
    xichu_xiangyu: { birth: -232, death: -202 },           // 项羽
    xianyu_hanxin: { birth: -231, death: -196 },           // 韩信
    huaiyang_zhouyafu: { birth: -199, death: -143, kaoju: '推定' },       // 周亚夫
    li_lx_d_liguang: { birth: -184, death: -119, kaoju: '异说' },         // 李广
    shuofang_weiqing: { birth: -154, death: -106, kaoju: '推定' },        // 卫青
    suzhou_huoqubing: { birth: -140, death: -117 },        // 霍去病
    lanzhou_zhaochongguo: { birth: -137, death: -52 },     // 赵充国
    qiliqiya_pangpei: { birth: -106, death: -48 },         // 庞培
    gen_julius_caesar: { birth: -100, death: -44 },        // 恺撒
    quli_chentang: { birth: -75, death: -6, kaoju: '推定' },              // 陈汤
    dixiang_wangmang: { birth: -45, death: 23 },           // 王莽
    li_s_mayuan: { birth: -14, death: 49 },                // 马援
    lulin_liuxiu: { birth: -5, death: 57 },                // 刘秀
    xiayang_d_dengyu: { birth: 2, death: 58 },             // 邓禹
    you_gengyan: { birth: 3, death: 58 },                  // 耿弇
    xiyuduhu_banchao: { birth: 32, death: 102 },           // 班超
    chagatai_genggong: { birth: 35, death: 90, kaoju: '推定' },           // 耿恭
    jiluo_d_douxian: { birth: 50, death: 92, kaoju: '推定' },             // 窦宪
    woye_huangfugui: { birth: 104, death: 174 },           // 皇甫规
    jingzhou_gs_huangfusong: { birth: 135, death: 195, kaoju: '推定' },   // 皇甫嵩
    cao_d_caocao: { birth: 155, death: 220 },              // 曹操
    ruzhou_sunjian: { birth: 155, death: 191 },            // 孙坚
    chu_guanyu: { birth: 160, death: 220, kaoju: '推定' },                // 关羽
    shu_liubei: { birth: 161, death: 223 },                // 刘备
    langzhou_zhangfei: { birth: 165, death: 221, kaoju: '推定' },         // 张飞
    tongma_taishici: { birth: 166, death: 206 },           // 太史慈
    caoren: { birth: 168, death: 223 },                    // 曹仁
    jingmen_zhaoyun: { birth: 168, death: 229, kaoju: '推定' },           // 赵云
    lu_zhangliao: { birth: 169, death: 222 },              // 张辽
    yue_d_lusu: { birth: 172, death: 217 },                // 鲁肃
    yunzhong_tuobaliwei: { birth: 174, death: 277 },       // 拓跋力微
    shanyue_sunce: { birth: 175, death: 200 },             // 孙策
    jiujiang_zhouyu: { birth: 175, death: 210 },           // 周瑜
    cangsong_machao: { birth: 176, death: 222 },           // 马超
    wuwu_d_lvmeng: { birth: 178, death: 220 },             // 吕蒙
    sima_d_simayi: { birth: 179, death: 251 },             // 司马懿
    huizhou_zhugeliang: { birth: 181, death: 234 },        // 诸葛亮
    sunwu_d_sunquan: { birth: 182, death: 252 },           // 孙权
    yidou_luxun: { birth: 183, death: 245 },               // 陆逊
    wudu_dengai: { birth: 197, death: 264 },               // 邓艾
    qingqiang_jiangwei: { birth: 202, death: 264 },        // 姜维
    yuzhou_zuti: { birth: 266, death: 321 },               // 祖逖
    gen_constantine_great: { birth: 272, death: 337 },     // 君士坦丁大帝
    cai_lishuo: { birth: 274, death: 333 },                // 石勒
    shizhao_d_shihu: { birth: 295, death: 349 },           // 石虎
    yingzhou_ying_d_muronghuang: { birth: 297, death: 348 }, // 慕容皝
    danyang_huanwen: { birth: 312, death: 373 },           // 桓温
    ranwei_d_ranmin: { birth: 322, death: 352, kaoju: '推定' },           // 冉闵
    murong_murongke: { birth: 323, death: 367, kaoju: '异说' },           // 慕容恪
    fushi_wangmeng: { birth: 325, death: 375 },            // 王猛
    dingzhou_d_murongchui: { birth: 326, death: 396 },     // 慕容垂
    beidi_yaochang: { birth: 330, death: 393, kaoju: '异说' },            // 姚苌
    gen_julian_apostate: { birth: 331, death: 363 },       // 尤里安
    zhong_xiexuan: { birth: 343, death: 388 },             // 谢玄
    wang_d_liuyu: { birth: 363, death: 422 },              // 刘裕
    tuoba_tuobagui: { birth: 371, death: 409 },            // 拓跋珪
    helian_helianbobo: { birth: 381, death: 425 },         // 赫连勃勃
    xiongren_atila: { birth: 406, death: 453, kaoju: '异说' },            // 阿提拉
    hao_d_weirui: { birth: 442, death: 520 },              // 韦睿
    gen_theodoric_great: { birth: 454, death: 526 },       // 狄奥多里克大帝
    gen_clovis_i: { birth: 466, death: 511 },              // 克洛维
    zhengzhou_chenqingzhi: { birth: 484, death: 539 },     // 陈庆之
    erzhu_erzhurong: { birth: 493, death: 530 },           // 尔朱荣
    gaoqi_d_gaohuan: { birth: 496, death: 547 },           // 高欢
    chen_chenbaxian: { birth: 503, death: 559 },           // 陈霸先
    yuwen_yuwentai: { birth: 505, death: 556 },            // 宇文泰
    jiyuan_huluguang: { birth: 515, death: 572 },          // 斛律光
    sui_yangjian: { birth: 541, death: 604 },              // 杨坚
    hongnong_jun_yangsu: { birth: 544, death: 606 },       // 杨素
    dingxiang_d_lijing: { birth: 571, death: 649 },        // 李靖
    song2_houjunji: { birth: 590, death: 643, kaoju: '推定' },            // 侯君集
    weihaiwei_sudingfang: { birth: 592, death: 667 },      // 苏定方
    bing_liji: { birth: 594, death: 669 },                 // 李勣
    xinluo_jinyuxin: { birth: 595, death: 673 },           // 金庾信
    tang_lishimin: { birth: 598, death: 649 },             // 李世民
    xuantu_yuangaisuwen: { birth: 603, death: 666, kaoju: '异说' },       // 渊盖苏文
    loufan_xuerengui: { birth: 614, death: 683 },          // 薛仁贵
    tubo_songzanganbu: { birth: 617, death: 650 },         // 松赞干布
    juandu_peixingjian: { birth: 619, death: 682 },        // 裴行俭
    heyuan_d_heichichangzhi: { birth: 630, death: 689 },   // 黑齿常之
    gar_lunqinling: { birth: 635, death: 699, kaoju: '推定' },            // 论钦陵
    bohai_dazuorong: { birth: 645, death: 719, kaoju: '推定' },           // 大祚荣
    gen_charles_martel: { birth: 688, death: 741 },        // 查理马特
    lingwu_guoziyi: { birth: 697, death: 781 },            // 郭子仪
    hepan_gaoxianzhi: { birth: 702, death: 755, kaoju: '推定' },          // 高仙芝
    zhuozhou_anlushan: { birth: 703, death: 757 },         // 安禄山
    gaoliang_geshuhan: { birth: 704, death: 757, kaoju: '推定' },         // 哥舒翰
    shanzhou_wangzhongsi: { birth: 705, death: 749, kaoju: '异说' },      // 王忠嗣
    liwang_liguangbi: { birth: 708, death: 764 },          // 李光弼
    liang_d_zhangxun: { birth: 709, death: 757 },          // 张巡
    pingyuan_yanzhenqing: { birth: 709, death: 784, kaoju: '异说' },      // 颜真卿
    qianzhou_lisheng: { birth: 727, death: 793 },          // 李晟
    yangtong_chisongdezan: { birth: 742, death: 797 },     // 赤松德赞
    gen_charlemagne: { birth: 748, death: 814, kaoju: '异说' },           // 查理曼
    zizhou_wangjian: { birth: 847, death: 918 },           // 王建
    gen_alfred_great: { birth: 849, death: 899, kaoju: '异说' },          // 阿尔弗雷德大帝
    dang_d_zhuwen: { birth: 852, death: 912 },             // 朱温
    wuyue_qianliu: { birth: 852, death: 932 },             // 钱镠
    shatuo_likeyong: { birth: 856, death: 908 },           // 李克用
    liao_d_yelvabaoji: { birth: 872, death: 926 },         // 耶律阿保机
    yingzhou_d2_licunxu: { birth: 885, death: 926 },       // 李存勖
    li_bian: { birth: 889, death: 943 },                   // 李昪
    dai_d_shijingtang: { birth: 892, death: 942 },         // 石敬瑭
    tongzhou_liuzhiyuan: { birth: 895, death: 948 },       // 刘知远
    gen_otto_great: { birth: 912, death: 973 },            // 奥托一世
    chanzhou_chairong: { birth: 921, death: 959 },         // 柴荣
    song_zhaokuangyin: { birth: 927, death: 976 },         // 赵匡胤
    heng1_yangye: { birth: 932, death: 986, kaoju: '异说' },              // 杨业
    shule_aersilan: { birth: 940, death: 998, kaoju: '推定' },            // 阿尔斯兰（阿里·阿尔斯兰汗）
    goryeo_jianghanzan: { birth: 948, death: 1031 },       // 姜邯赞
    gen_basil_ii: { birth: 958, death: 1025 },             // 巴西尔二世
    dangxiang_liyuanhao: { birth: 1003, death: 1048 },     // 李元昊
    zhai_han_diqing: { birth: 1008, death: 1057 },         // 狄青
    gen_alfonso_vi: { birth: 1040, death: 1109 },          // 阿方索六世
    gen_el_cid: { birth: 1043, death: 1099 },              // 熙德
    dajin_wanyanaguda: { birth: 1068, death: 1123 },       // 完颜阿骨打
    mohe_wanyanzonghan: { birth: 1080, death: 1137 },      // 完颜宗翰
    xiliao_yelvdashi: { birth: 1087, death: 1143, kaoju: '异说' },        // 耶律大石
    sizhou_hanshizhong: { birth: 1089, death: 1151 },      // 韩世忠
    fengzhou_wujie: { birth: 1093, death: 1139 },          // 吴玠
    yingzhou_d_liuqi: { birth: 1098, death: 1162 },        // 刘锜
    jurchen_wanyanzongbi: { birth: 1098, death: 1148, kaoju: '推定' },    // 完颜宗弼（金兀术）
    yanchuan_d_yuefei: { birth: 1103, death: 1142 },       // 岳飞
    gen_afonso_henriques: { birth: 1109, death: 1185, kaoju: '异说' },    // 阿方索一世
    ayoubu_salaheding: { birth: 1138, death: 1193, kaoju: '异说' },       // 萨拉丁
    changshaguo_xinqiji: { birth: 1140, death: 1207 },     // 辛弃疾
    gen_minamoto_yoritomo: { birth: 1147, death: 1199 },   // 源赖朝
    fujiwara_yuanyijing: { birth: 1159, death: 1189 },     // 源义经
    zhadalan_zhamuhe: { birth: 1161, death: 1205 },        // 札木合
    menggu_d_chengjisihan: { birth: 1162, death: 1227 },   // 成吉思汗（生年取通行 1162）
    houliao_yelvliuge: { birth: 1165, death: 1220 },       // 耶律留哥
    jalair_muhuali: { birth: 1170, death: 1223 },          // 木华黎
    dongxia_puxianwannu: { birth: 1170, death: 1233, kaoju: '推定' },     // 蒲鲜万奴
    gen_alfonso_ix: { birth: 1171, death: 1230 },          // 阿方索九世
    muertan_naxierding: { birth: 1175, death: 1228, kaoju: '推定' },      // 纳西尔丁·卡巴恰
    wuliangha_subutai: { birth: 1176, death: 1248 },       // 速不台
    gen_kuchlug: { birth: 1180, death: 1218, kaoju: '推定' },             // 屈出律
    borjigin_tuolei: { birth: 1191, death: 1232, kaoju: '异说' },         // 拖雷
    gen_frederic_ii: { birth: 1194, death: 1250 },         // 腓特烈二世（神圣罗马）
    zaoyang_d_menggong: { birth: 1195, death: 1246 },      // 孟珙
    gen_fernando_iii: { birth: 1201, death: 1252, kaoju: '异说' },        // 费尔南多三世
    gen_batu: { birth: 1207, death: 1256, kaoju: '异说' },                // 拔都
    yuan_d_hubilie: { birth: 1215, death: 1294 },          // 忽必烈
    asaibaijiang_xuliewu: { birth: 1218, death: 1265, kaoju: '异说' },    // 旭烈兀
    gen_alexander_nef: { birth: 1221, death: 1263 },       // 涅夫斯基
    mamuluke_baibaisi: { birth: 1223, death: 1277, kaoju: '异说' },       // 拜巴尔斯
    khon_basiba: { birth: 1235, death: 1280 },             // 八思巴
    merkit_boyan: { birth: 1236, death: 1295, kaoju: '推定' },            // 伯颜
    shenshi_wentianxiang: { birth: 1236, death: 1283 },    // 文天祥
    yamato_nanmuzhengcheng: { birth: 1294, death: 1336 },  // 楠木正成
    ashikaga_zulizunshi: { birth: 1305, death: 1358 },     // 足利尊氏
    zhangshicheng_zhangshicheng: { birth: 1321, death: 1367 }, // 张士诚
    huai_zhuyuanzhang: { birth: 1328, death: 1398 },       // 朱元璋
    da_yuan_kuokuotiemuer: { birth: 1330, death: 1375, kaoju: '推定' },   // 扩廓帖木儿（王保保）
    chizhou_changyuchun: { birth: 1330, death: 1369 },     // 常遇春
    gen_black_prince: { birth: 1330, death: 1376 },        // 黑太子
    xuan_xuda: { birth: 1332, death: 1385 },               // 徐达
    joseon_lichenggui: { birth: 1335, death: 1408 },       // 李成桂
    zhaowu_timuermieli: { birth: 1335, death: 1378, kaoju: '推定' },      // 帖木儿灭里
    gen_qutlugh: { birth: 1335, death: 1385, kaoju: '推定' },             // 忽都鲁（费尔干纳割据统治者）
    tiemuer_tiemuer: { birth: 1336, death: 1405 },         // 帖木儿
    pingnan_muying: { birth: 1345, death: 1392 },          // 沐英
    ganden_zongkaba: { birth: 1357, death: 1419 },         // 宗喀巴
    ming_d_zhudi: { birth: 1360, death: 1424 },            // 朱棣
    jinan_tiexuan: { birth: 1366, death: 1402 },           // 铁铉
    gen_frederick_i_nuremberg: { birth: 1371, death: 1440 }, // 腓特烈一世（勃兰登堡选侯）
    gen_henry_v: { birth: 1386, death: 1422 },             // 亨利五世
    yi_yuqian: { birth: 1398, death: 1457 },               // 于谦
    gen_charles_vii: { birth: 1403, death: 1461 },         // 查理七世
    // 卒时仅 19 岁：按「生年 + 20」会被整段掐掉（1432 > 1431）→ 显式登场年＝1429 解奥尔良之围（17 岁）
    gen_joanofarc: { birth: 1412, death: 1431, debut: 1429 },  // 圣女贞德（生年取传统 1412）
    osman_mehmed_ii: { birth: 1432, death: 1481 },         // 穆罕默德二世
    an_xibanni: { birth: 1451, death: 1510 },              // 昔班尼
    dayu_wangshouren: { birth: 1472, death: 1529 },        // 王守仁
    xibanya_pisaluo: { birth: 1478, death: 1541, kaoju: '异说' },         // 皮萨罗
    babuer_babuer: { birth: 1483, death: 1530 },           // 巴布尔
    aki_maoliyuanjiu: { birth: 1497, death: 1571 },        // 毛利元就
    xindu_bahelamuhan: { birth: 1501, death: 1561, kaoju: '推定' },       // 巴赫拉姆汗（拜拉姆·汗）
    qian_d_yudayou: { birth: 1503, death: 1579 },          // 俞大猷
    tumed_andahan: { birth: 1507, death: 1582, kaoju: '异说' },           // 俺答汗
    otomo_d_lihuadaoxue: { birth: 1513, death: 1585 },     // 立花道雪
    sagami_beitiaoshikang: { birth: 1515, death: 1571 },   // 北条氏康
    hantawadi_mangyinglong: { birth: 1516, death: 1581 },  // 莽应龙
    jinchuan_jinchuanyiyuan: { birth: 1519, death: 1560 }, // 今川义元
    kai_wutianxinxuan: { birth: 1521, death: 1573 },       // 武田信玄
    jinzhou_lichengliang: { birth: 1526, death: 1615 },    // 李成梁
    qi_d_qijiguang: { birth: 1528, death: 1588 },          // 戚继光
    echigo_shangshanqianxin: { birth: 1530, death: 1578 }, // 上杉谦信
    owari_zhitianxinchang: { birth: 1534, death: 1582 },   // 织田信长
    hashiba_fengchenxiuji: { birth: 1537, death: 1598 },   // 丰臣秀吉
    mowoer_akeba: { birth: 1542, death: 1605 },            // 阿克巴
    edo_dechuanjiakang: { birth: 1543, death: 1616 },      // 德川家康
    sambyeol_lishunchen: { birth: 1545, death: 1598 },     // 李舜臣
    satsuma_daojinjiajiu: { birth: 1547, death: 1587 },    // 岛津家久
    siam_nalixuan: { birth: 1555, death: 1605, kaoju: '异说' },           // 纳黎萱
    manzhou_nuerhachi: { birth: 1559, death: 1626 },       // 努尔哈赤
    date_d_yidazhengzong: { birth: 1567, death: 1636 },    // 伊达政宗
    sanada_d_zhentianxingcun: { birth: 1567, death: 1615 },// 真田幸村
    tujia_d_qinliangyu: { birth: 1574, death: 1648 },      // 秦良玉
    mao_wenlong_maowenlong: { birth: 1576, death: 1629 },  // 毛文龙
    zu_d_yuanchonghuan: { birth: 1584, death: 1630 },      // 袁崇焕
    longwu_huangdaozhou: { birth: 1585, death: 1646 },     // 黄道周
    jingjiang_qushisi: { birth: 1590, death: 1650, kaoju: '异说' },       // 瞿式耜
    aisin_d_huangtaiji: { birth: 1592, death: 1643 },      // 皇太极
    heng_hetengjiao: { birth: 1592, death: 1649 },         // 何腾蛟
    sunqin_sunchuanting: { birth: 1593, death: 1643 },     // 孙传庭
    gen_bohdan_khmelnitsky: { birth: 1595, death: 1657 },  // 赫梅利尼茨基
    luming_luxiangsheng: { birth: 1600, death: 1639 },     // 卢象升
    suzhou_d_shikefa: { birth: 1602, death: 1645 },        // 史可法
    dashun_lizicheng: { birth: 1606, death: 1645 },        // 李自成
    daxi_ming_zhangxianzhong: { birth: 1606, death: 1647 },// 张献忠
    manzhou_d_duoergun: { birth: 1612, death: 1650 },      // 多尔衮
    linyu_wusangui: { birth: 1612, death: 1678 },          // 吴三桂
    lujian_zhanghuangyan: { birth: 1620, death: 1664 },    // 张煌言
    wenling_shilang: { birth: 1621, death: 1696 },         // 施琅
    guizhou_lidingguo: { birth: 1621, death: 1662 },       // 李定国
    ming_zheng_zhengchenggong: { birth: 1624, death: 1662 },// 郑成功
    bolan_suobiesiji: { birth: 1629, death: 1696 },        // 索别斯基
    oirat_ming_gaerdan: { birth: 1645, death: 1697, kaoju: '异说' },      // 噶尔丹
    geng_gengjingzhong: { birth: 1644, death: 1682 },      // 耿精忠
    eluosi_diguo_peter: { birth: 1672, death: 1725 },      // 彼得大帝
    weiyuan_d_niangengyao: { birth: 1679, death: 1726, kaoju: '异说' },   // 年羹尧
    qinghai_yuezhongqi: { birth: 1686, death: 1754 },      // 岳钟琪
    agui: { birth: 1717, death: 1797 },                    // 阿桂
    tuerhute_wobaxi: { birth: 1744, death: 1774, kaoju: '异说' },         // 渥巴锡
    bailian_wangconger: { birth: 1777, death: 1798 },      // 王聪儿
    taiping_shidakai: { birth: 1831, death: 1863 },        // 石达开
    // ── 失载武将：按主人定的「事件逆推黄金年龄法」批量估算（2026-10-15）──
    gen_koshamain: { birth: 1410, death: 1457, kaoju: '推定' },  // 柯沙玛因
    gen_hiawatha: { birth: 1400, death: 1455, kaoju: '推定' },  // 海华沙
    gen_minchancaman: { birth: 1430, death: 1480, kaoju: '推定' },  // 明查凯曼
    gen_tzitzipandaquare: { birth: 1430, death: 1479, kaoju: '推定' },  // 齐齐潘达夸雷
    gen_cuchacique: { birth: 1540, death: 1595, kaoju: '推定' },  // 库查西克
    gen_casimiro_bigua: { birth: 1819, death: 1874, kaoju: '推定' },  // 卡西米罗·比格
    gen_stuyvesant: { birth: 1612, death: 1672, kaoju: '异说' },  // 斯泰弗森特
    gen_champlain: { birth: 1567, death: 1635, kaoju: '异说' },  // 尚普兰
    gen_urdaneta: { birth: 1498, death: 1568, kaoju: '异说' },  // 乌尔达内塔
    gen_gajah_mada: { birth: 1290, death: 1364 },  // 加查马达
    gen_prithviraj: { birth: 1166, death: 1192 },  // 普里特维
    gen_sumanguru: { birth: 1170, death: 1235, kaoju: '推定' },  // 苏曼古鲁
    gen_bohemond: { birth: 1054, death: 1111 },  // 博希蒙德
    gen_edward_longshanks: { birth: 1239, death: 1307 },  // 长腿爱德华
    gen_robert_guiscard: { birth: 1015, death: 1085 },  // 吉斯卡尔
    gen_yodit: { birth: 940, death: 1000, kaoju: '推定' },  // 尤迪特
    gen_osman_i: { birth: 1258, death: 1326, kaoju: '异说' },  // 奥斯曼一世
    gen_brasidas: { birth: -465, death: -422, kaoju: '推定' },  // 巴西达斯
    gen_lysander: { birth: -445, death: -395, kaoju: '推定' },  // 吕山德
    gen_parmenion: { birth: -400, death: -330, kaoju: '推定' },  // 帕曼纽
    gen_perdiccas: { birth: -355, death: -321, kaoju: '异说' },  // 佩尔狄卡斯
    gen_artemisia: { birth: -520, death: -460, kaoju: '推定' },  // 阿尔特米西亚
    halikanasu_memnon: { birth: -380, death: -333 },  // 门农
    gen_artaphernes: { birth: -530, death: -485, kaoju: '推定' },  // 阿尔塔弗涅斯
    gen_aristides: { birth: -530, death: -468 },  // 阿里斯提德
    gen_cleitus: { birth: -375, death: -328, kaoju: '推定' },  // 克雷图斯
    gen_datis: { birth: -535, death: -490, kaoju: '推定' },  // 达提斯
    gen_carpini: { birth: 1182, death: 1252, kaoju: '异说' },  // 柏朗嘉宾
    gen_philip_ii: { birth: -382, death: -336 },  // 腓力二世（马其顿）
    gen_kestutis: { birth: 1297, death: 1382 },  // 科斯图提斯
    gen_ivaylo: { birth: 1240, death: 1281, kaoju: '推定' },  // 伊瓦伊洛
    gen_kotyan: { birth: 1180, death: 1241, kaoju: '推定' },  // 忽炭汗
    gen_girgen: { birth: 1185, death: 1242, kaoju: '推定' },  // 吉尔根汗
    gen_pacanchiq: { birth: 1500, death: 1555, kaoju: '推定' },  // 帕坎奇克
    gen_cunhambebe: { birth: 1510, death: 1555, kaoju: '推定' },  // 昆汉贝贝
    gen_galvarino: { birth: 1525, death: 1557, kaoju: '推定' },  // 加尔瓦里诺
    gen_guacolda: { birth: 1530, death: 1557, kaoju: '推定' },  // 瓜科尔达
    gen_john_fearless: { birth: 1371, death: 1419 },  // 无畏的约翰
    gen_bernard_armagnac: { birth: 1360, death: 1418 },  // 贝尔纳七世
    gen_gilbert: { birth: 1243, death: 1295 },  // 吉尔伯特
    gen_alaric: { birth: 370, death: 410 },  // 亚拉里克
    gen_ataulf: { birth: 374, death: 415, kaoju: '异说' },  // 阿陶尔夫
    gen_philip_good: { birth: 1396, death: 1467 },  // 好人菲利普
    gen_dafydd: { birth: 1238, death: 1283 },  // 戴菲德
    gen_llywelyn: { birth: 1223, death: 1282 },  // 卢埃林
    gen_dinhle: { birth: 1385, death: 1427, kaoju: '推定' },  // 丁礼
    gen_gidajan: { birth: 1130, death: 1185, kaoju: '推定' },  // 吉达扬
    gen_thoros: { birth: 1120, death: 1169, kaoju: '推定' },  // 托罗斯二世
    gen_dagnajan: { birth: 870, death: 925, kaoju: '推定' },  // 达格纳詹
    gen_maha_thiha_thura: { birth: 1720, death: 1800, kaoju: '异说' },  // 摩诃·悉都
    gen_sang_nila_utama: { birth: 1270, death: 1347, kaoju: '推定' },  // 桑尼拉乌他马
    gen_rajaram: { birth: 1670, death: 1700 },  // 拉贾拉姆
    gen_epaminondas: { birth: -418, death: -362, kaoju: '异说' },  // 伊巴密浓达
    dibisi_phoinix: { birth: -360, death: -310, kaoju: '推定' },  // 菲尼克斯
    gen_villaret: { birth: 1270, death: 1327, kaoju: '推定' },  // 维拉雷
    gen_nikephoros_phokas: { birth: 912, death: 969 },  // 福卡斯
    gen_cangrande: { birth: 1291, death: 1329 },  // 坎格兰德
    gen_ansgar: { birth: 801, death: 865 },  // 安斯加尔
    yipilusi_piluoshi: { birth: -319, death: -272, kaoju: '异说' },  // 皮洛士
    gen_leonidas: { birth: -540, death: -480 },  // 列奥尼达
    maqidun_antipater: { birth: -397, death: -319, kaoju: '异说' },  // 安提帕特
    maqidun_craterus: { birth: -370, death: -321 },  // 克拉特罗斯
    gen_dragan: { birth: 1330, death: 1385, kaoju: '推定' },  // 德拉甘
    gen_charles_ix: { birth: 1550, death: 1611 },  // 卡尔九世
    gen_henry_borwin: { birth: 1150, death: 1227, kaoju: '推定' },  // 博尔温
    gen_willem_juliette: { birth: 1299, death: 1361, kaoju: '异说' },  // 威廉一世
    gen_ugolino: { birth: 1220, death: 1289 },  // 乌戈里诺
    gen_roger_i: { birth: 1031, death: 1101 },  // 罗杰
    gen_eleanor: { birth: 1347, death: 1404 },  // 埃莱奥诺拉
    gen_idris_i: { birth: 745, death: 791, kaoju: '推定' },  // 伊德里斯
    gen_vyshnevetsky: { birth: 1516, death: 1563, kaoju: '推定' },  // 拜达
    baojialiya_aseni: { birth: 1155, death: 1196, kaoju: '推定' },  // 阿森一世
    gen_krum: { birth: 755, death: 814, kaoju: '推定' },  // 克鲁姆
    gen_tvrtko: { birth: 1338, death: 1391 },  // 特夫尔特科
    gen_tashfin: { birth: 1009, death: 1106, kaoju: '推定' },  // 塔什芬
    gen_henry_navigator: { birth: 1394, death: 1460 },  // 恩里克
    gen_yaghmurasen: { birth: 1206, death: 1283 },  // 亚格姆拉森
    gen_barbarossa: { birth: 1478, death: 1546 },  // 巴巴罗萨
    gen_hammad: { birth: 970, death: 1028, kaoju: '推定' },  // 哈马德
    gen_uqba: { birth: 622, death: 683 },  // 奥克巴
    gen_dragut: { birth: 1485, death: 1565 },  // 德拉古特
    gen_magas: { birth: -317, death: -250, kaoju: '异说' },  // 马加斯
    talike_talike: { birth: 670, death: 720, kaoju: '推定' },  // 塔里克
    gen_offa_mercia: { birth: 730, death: 796, kaoju: '推定' },  // 奥法
    gen_william_silent: { birth: 1533, death: 1584 },  // 威廉奥兰治
    gen_casimir_iv: { birth: 1351, death: 1377, kaoju: '异说' },  // 卡西米尔
    pomeilaniya_bogislaw: { birth: 1454, death: 1523, kaoju: '推定' },  // 博吉斯拉夫
    gen_raymond_v: { birth: 1134, death: 1194 },  // 雷蒙五世
    gen_gilles_de_rais: { birth: 1405, death: 1440 },  // 吉尔德雷斯
    gen_lorenzo_medici: { birth: 1449, death: 1492 },  // 洛伦佐
    gen_dandolo: { birth: 1107, death: 1205 },  // 丹多洛
    talanduo_aqita: { birth: -428, death: -347, kaoju: '异说' },  // 阿契塔
    safuyi_ameidi: { birth: 1334, death: 1383 },  // 阿梅迪奥
    gen_charles_i_naples: { birth: 1226, death: 1285 },  // 卡洛
    gen_wifred_hairy: { birth: 840, death: 897, kaoju: '推定' },  // 威弗雷德
    gen_muhammad_i: { birth: 1195, death: 1273, kaoju: '异说' },  // 穆罕默德
    gen_andrea_doria: { birth: 1466, death: 1560 },  // 安德烈亚
    gen_simeon_great: { birth: 864, death: 927 },  // 西美昂
    jite_shouling: { birth: -375, death: -330, kaoju: '推定' },  // 科托罗
    gen_gastold: { birth: 1400, death: 1458, kaoju: '推定' },  // 加斯托尔德
    gen_zhytomyr: { birth: 840, death: 890, kaoju: '推定' },  // 日托米尔
    gen_ludwig_iv: { birth: 1282, death: 1347, kaoju: '推定' },  // 路德维希
    gen_stortebeker: { birth: 1360, death: 1401, kaoju: '异说' },  // 克劳斯
    gen_civilis: { birth: 25, death: 80, kaoju: '推定' },  // 西维利斯
    gen_eric_bloodaxe: { birth: 885, death: 954, kaoju: '推定' },  // 埃里克
    gen_william_wallace: { birth: 1270, death: 1305 },  // 华莱士
    gen_raymond_iv: { birth: 1042, death: 1105, kaoju: '异说' },  // 雷蒙四世
    lunbadi_alboin: { birth: 530, death: 572, kaoju: '异说' },  // 阿尔博因
    gen_abd_al_rahman_iii: { birth: 891, death: 961, kaoju: '异说' },  // 阿卜杜拉
    gen_james_i_aragon: { birth: 1208, death: 1276 },  // 海梅
    shaiyue_aerpade: { birth: 845, death: 907 },  // 阿尔帕德
    gen_olaf_skotkonung: { birth: 980, death: 1022 },  // 奥拉夫
    gen_hamilcar: { birth: -275, death: -228 },  // 哈米尔卡
    gen_themistocles: { birth: -524, death: -459 },  // 地米斯托
    xila_leosthenes: { birth: -365, death: -323, kaoju: '推定' },  // 莱奥斯塞尼斯
    xila_antiphilus: { birth: -360, death: -315, kaoju: '推定' },  // 安提菲洛斯
    gen_city_syracuse: { birth: -361, death: -289 },  // 阿加索克利
    gen_robert_ii: { birth: 1065, death: 1111, kaoju: '异说' },  // 罗贝尔二世
    bogendi_chali: { birth: 1433, death: 1477 },  // 大胆查理
    bulabante_yuehanyishi: { birth: 1252, death: 1294 },  // 约翰一世
    gen_kaernute_kotuatousi: { birth: -85, death: -52, kaoju: '推定' },  // 科图阿图斯
    gen_onuist_i: { birth: 690, death: 761, kaoju: '推定' },  // 奥恩格斯
    gen_domhnall: { birth: 812, death: 862, kaoju: '推定' },  // 多姆纳尔
    mangsite_bulaienbolu: { birth: 941, death: 1014 },  // 布赖恩博鲁
    tuomengde_aobulaien: { birth: 1050, death: 1119, kaoju: '推定' },  // 奥布赖恩
    gen_alain_i: { birth: 850, death: 907, kaoju: '推定' },  // 阿兰
    gen_stefan_dusan: { birth: 1308, death: 1355 },  // 斯蒂芬杜尚
    kejila_shulunbao: { birth: 1661, death: 1747 },  // 舒伦堡
    gen_maximilian: { birth: 1459, death: 1519 },  // 马克西米
    gen_jan_zizka: { birth: 1360, death: 1424 },  // 扬杰斯卡
    mazhaer_majiashi: { birth: 1443, death: 1490 },  // 马加什一世
    xiongyati_yannuoshi: { birth: 1406, death: 1456 },  // 匈雅提亚诺什
    pelianci_hengli2: { birth: 1166, death: 1197, kaoju: '推定' },  // 亨利二世
    gen_ulrich_augsburg: { birth: 890, death: 973 },  // 乌尔里希
    gen_albrecht_bear: { birth: 1100, death: 1170 },  // 阿尔布雷
    gen_gero_margrave: { birth: 900, death: 965 },  // 杰罗
    gen_tassilo_iii: { birth: 741, death: 796 },  // 塔西洛三世
    gen_winkelried: { birth: 1350, death: 1386, kaoju: '推定' },  // 温克尔里德
    gen_swatopluk: { birth: 830, death: 894, kaoju: '异说' },  // 斯瓦托
    gen_mojmir_i: { birth: 795, death: 846, kaoju: '异说' },  // 莫伊米尔
    gen_yaroslav: { birth: 978, death: 1054 },  // 雅罗斯拉夫
    gen_dmitry_donskoy: { birth: 1350, death: 1389 },  // 顿斯科伊
    gen_vladimir_andreyevich: { birth: 1353, death: 1410 },  // 勇者弗拉基
    gen_andrey_bogolyub: { birth: 1111, death: 1174 },  // 安德烈
    gen_romshlav: { birth: 1150, death: 1223, kaoju: '异说' },  // 罗姆什拉夫
    gen_mstislav: { birth: 983, death: 1036, kaoju: '推定' },  // 姆斯蒂
    gen_daniel_galitsky: { birth: 1201, death: 1264, kaoju: '异说' },  // 丹尼尔
    gen_daumantas: { birth: 1240, death: 1299, kaoju: '推定' },  // 道曼塔斯
    gen_yuri_ryazan: { birth: 1195, death: 1237, kaoju: '推定' },  // 尤里
    gen_breslav: { birth: 997, death: 1044 },  // 布列斯拉夫
    gen_ulugh_muhammad: { birth: 1405, death: 1445 },  // 兀鲁黑
    gen_aspurgus: { birth: -15, death: 38, kaoju: '推定' },  // 阿斯普尔
    bosi_puluosi_liukong: { birth: -410, death: -355, kaoju: '异说' },  // 琉孔一世
    gen_haci_giray: { birth: 1397, death: 1466 },  // 哈吉格来
    gen_nikola_zrinski: { birth: 1508, death: 1566 },  // 兹林斯基
    mengtainiya_radu_iii: { birth: 1437, death: 1475, kaoju: '异说' },  // 拉杜三世
    gen_gediminas: { birth: 1275, death: 1341 },  // 格迪米纳斯
    gen_przemysl_ii: { birth: 1257, death: 1296 },  // 普热梅斯
    gen_mikhail_tatarinov: { birth: 1610, death: 1665, kaoju: '推定' },  // 塔塔里诺夫
    gen_boleslaw_brave: { birth: 967, death: 1025 },  // 勇者波列
    gen_jadwiga: { birth: 1373, death: 1399, kaoju: '异说' },  // 雅德维加
    gen_albert_riga: { birth: 1165, death: 1229 },  // 阿尔伯特
    gen_mikhail_tver: { birth: 1271, death: 1318, kaoju: '异说' },  // 米哈伊尔
    gen_dmitry_suzdal: { birth: 1322, death: 1383, kaoju: '异说' },  // 康斯坦丁诺
    gen_stephen_great: { birth: 1433, death: 1504 },  // 斯蒂芬
    gen_vlad_impaler: { birth: 1431, death: 1476 },  // 弗拉德三世
    gen_ulrich_jungingen: { birth: 1360, death: 1410 },  // 容金根
    gen_prettenberg: { birth: 1450, death: 1535 },  // 普雷特贝格
    gen_vyacheslav_tartu: { birth: 1180, death: 1224, kaoju: '推定' },  // 维切斯拉夫
    kaleiliya_kelimu: { birth: 1680, death: 1735, kaoju: '推定' },  // 克利姆索博列夫
    gen_mehmed_giray: { birth: 1465, death: 1523, kaoju: '异说' },  // 迈赫迈德
    gen_vytautas_great: { birth: 1350, death: 1430 },  // 维托夫特
    gen_astrakhan_khan: { birth: 1420, death: 1476, kaoju: '推定' },  // 阿斯特拉
    gen_onas_khan: { birth: 1520, death: 1575, kaoju: '推定' },  // 欧拿斯
    gen_karasakal: { birth: 1700, death: 1749, kaoju: '推定' },  // 卡拉萨卡尔
    xierhe_saerjue: { birth: 960, death: 1038, kaoju: '推定' },  // 塞尔柱
    gen_sergey_belgorod: { birth: 1535, death: 1590, kaoju: '推定' },  // 谢尔盖
    gen_grigory_donets: { birth: 1630, death: 1691, kaoju: '推定' },  // 多涅茨
    gen_semyon_saburov: { birth: 1545, death: 1601, kaoju: '推定' },  // 萨布罗夫
    eguo_zasekin: { birth: 1540, death: 1600, kaoju: '推定' },       // 扎谢金（萨拉托夫建城者）
    gen_vladimir_monomakh: { birth: 1053, death: 1125 },  // 莫诺马赫
    gen_algirdas: { birth: 1296, death: 1377 },  // 奥尔格尔德
    qin_simacuo: { birth: -350, death: -280, kaoju: '推定' },  // 司马错
    wuzhou_d_wuzetian: { birth: 624, death: 705 },  // 武则天
    jinling_tandaoji: { birth: 380, death: 436, kaoju: '推定' },  // 檀道济
    guangzhou_liuyin: { birth: 874, death: 911 },  // 刘隐
    yangzhou_wangping: { birth: 185, death: 248, kaoju: '推定' },  // 王平
    yang_zhou_yangxingmi: { birth: 852, death: 905 },  // 杨行密
    pagan_anulvtuo: { birth: 1014, death: 1077 },  // 阿奴律陀
    qiuci_baiba: { birth: 60, death: 115, kaoju: '推定' },  // 白霸
    min_wangshenzhi: { birth: 862, death: 925 },  // 王审知
    quanzhou_liucongxiao: { birth: 906, death: 962 },  // 留从效
    wei_wuqi: { birth: -440, death: -381 },  // 吴起
    seljuq_sangjiaer: { birth: 1085, death: 1157, kaoju: '异说' },  // 桑贾尔
    chenla_duyebamo: { birth: 1125, death: 1218, kaoju: '异说' },  // 阇耶跋摩
    totomi_jiujingzhongci: { birth: 1527, death: 1596 },  // 酒井忠次
    chosokabe_changzongwobuyuanqin: { birth: 1539, death: 1599 },  // 长宗我部
    izumo_shanzhonglujie: { birth: 1545, death: 1578 },  // 山中鹿介
    kaga_d_xiajianlailian: { birth: 1537, death: 1626, kaoju: '推定' },  // 下间赖廉
    iga_d_baididanbo: { birth: 1512, death: 1581, kaoju: '异说' },  // 百地丹波
    jibei2_qingshuizongzhi: { birth: 1537, death: 1582 },  // 清水宗治
    aizu_pushengshixiang: { birth: 1556, death: 1595 },  // 蒲生氏乡
    suwa_d_zoufanglaizhong: { birth: 1516, death: 1542 },  // 诹访赖重
    shimotsuke_yudougongguanggang: { birth: 1545, death: 1576 },  // 宇都宫广纲
    higo_d_juchiwuguang: { birth: 1319, death: 1373 },  // 菊池武光
    iyo_d_cunshangwuji: { birth: 1533, death: 1604, kaoju: '异说' },  // 村上武吉
    nanbu_nanbuqingzheng: { birth: 1517, death: 1582 },  // 南部晴政
    osumi_ganfujianxu: { birth: 1511, death: 1566 },  // 肝付兼续
    fujiwara_xiuheng: { birth: 1122, death: 1187, kaoju: '推定' },  // 藤原秀衡
    kakizaki_liqiqingguang: { birth: 1548, death: 1616 },  // 蛎崎庆广
    ayinu_hushemoquan: { birth: 1410, death: 1457, kaoju: '推定' },  // 胡奢魔犬
    so_zongyizhi: { birth: 1568, death: 1615 },  // 宗义智
    taira_pingzhisheng: { birth: 1152, death: 1185 },  // 平知盛
    lelang_wangqi: { birth: 205, death: 265, kaoju: '推定' },  // 王颀
    anmei_yuwandaqin: { birth: 1470, death: 1537, kaoju: '推定' },  // 与湾大亲
    chen3_jizhun: { birth: -240, death: -180, kaoju: '推定' },  // 箕准
    gaogouli_yizhiwende: { birth: 560, death: 620, kaoju: '推定' },  // 乙支文德
    baiji_jiebo: { birth: 615, death: 660, kaoju: '推定' },  // 阶伯
    zhen_zhenxuan: { birth: 867, death: 936 },  // 甄萱
    danluo_jintongjing: { birth: 1235, death: 1273, kaoju: '推定' },  // 金通精
    ssangseong_cuiying: { birth: 1316, death: 1388 },  // 崔莹
    gaya_jinshoulu: { birth: 40, death: 100, kaoju: '推定' },  // 金首露
    naju_d_wangjian_wangye: { birth: 885, death: 945, kaoju: '推定' },  // 王礏
    chungju_d_quanli: { birth: 1537, death: 1599 },  // 权栗
    sabeol_jinshimin: { birth: 1554, death: 1592 },  // 金时敏
    huimo_gaoyanshou: { birth: 600, death: 645, kaoju: '推定' },  // 高延寿
    aola_menglielun: { birth: 1610, death: 1665, kaoju: '推定' },  // 孟烈伦
    ewenki_gentemuer: { birth: 1615, death: 1685, kaoju: '推定' },  // 根特木尔
    haixi_nvzhen_baiyindali: { birth: 1570, death: 1607, kaoju: '推定' },  // 拜音达里
    dazhen_wanyantiege: { birth: 1140, death: 1198, kaoju: '推定' },  // 完颜铁哥
    yehe_jintaiji: { birth: 1560, death: 1619, kaoju: '推定' },  // 金台吉
    guishuang_qiujiuque: { birth: -20, death: 80, kaoju: '推定' },  // 丘就却（生年 -20 为估；登场年跳过公元 0 年 → 公元 1 年）
    qidan_shulvping: { birth: 879, death: 953 },  // 述律平
    hui_bunaihou: { birth: 200, death: 260, kaoju: '推定' },  // 不耐
    jilizhou_chengmingzhen: { birth: 585, death: 662, kaoju: '推定' },  // 程名振
    nuergan_kangwang: { birth: 1375, death: 1430, kaoju: '推定' },  // 康旺
    fuyu_weichoutai: { birth: 150, death: 210, kaoju: '推定' },  // 尉仇台
    yizhou_wanyanloushi: { birth: 1076, death: 1130, kaoju: '异说' },  // 完颜娄室
    xianbei_tuobamao: { birth: -20, death: 40, kaoju: '推定' },  // 拓跋毛（传说时代首领，生年 -20 为估；登场年跳过公元 0 年 → 公元 1 年）
    suolun_bomuboguoer: { birth: 1600, death: 1640, kaoju: '推定' },  // 博穆博果尔
    wula_buzhantai: { birth: 1575, death: 1618 },  // 布占泰
    dada_ming_dayanhan: { birth: 1474, death: 1517 },  // 巴图蒙克
    keerqin_aoba: { birth: 1580, death: 1632, kaoju: '推定' },  // 奥巴
    wure_wuzhaodu: { birth: 900, death: 960, kaoju: '推定' },  // 乌昭度
    heishui_nishuli: { birth: 670, death: 730, kaoju: '推定' },  // 倪属利稽
    heisha_d_houlihu: { birth: -140, death: -102, kaoju: '推定' },  // 呴犁湖
    hezhe_shaerhuda: { birth: 1599, death: 1659 },  // 沙尔虎达
    dawoer_baerdaqi: { birth: 1605, death: 1660, kaoju: '推定' },  // 巴尔达齐
    yeren_nvzhen_boke: { birth: 1580, death: 1635, kaoju: '推定' },  // 博克
    wuji_yilizhi: { birth: 430, death: 490, kaoju: '推定' },  // 乙力支
    jilin_fujun: { birth: 1749, death: 1834, kaoju: '异说' },  // 富俊
    dongdan_yelvbei: { birth: 899, death: 937, kaoju: '异说' },  // 耶律倍
    kuye_kuye_qichayi: { birth: 1720, death: 1775, kaoju: '推定' },  // 齐查伊
    sushen_tudiji: { birth: 565, death: 625, kaoju: '推定' },  // 突地稽
    yilou_naoya: { birth: 220, death: 275, kaoju: '推定' },  // 恼犽
    maomingan_suoetu: { birth: 1636, death: 1703 },  // 索额图
    jilimi_takuna: { birth: 1240, death: 1295, kaoju: '推定' },  // 塔库纳
    eluoke_amuhaer: { birth: 1715, death: 1770, kaoju: '推定' },  // 阿穆哈尔
    nifuhe_baerhudai: { birth: 1600, death: 1655, kaoju: '推定' },  // 巴尔虎代
    feiyaka_cemutehe: { birth: 1620, death: 1678, kaoju: '推定' },  // 策穆特赫
    nanai_zhahaluo: { birth: 1625, death: 1685, kaoju: '推定' },  // 扎哈罗
    woju_yinguan: { birth: 1040, death: 1111 },  // 尹瓘
    luzhou_zhangwenxiu: { birth: 685, death: 740, kaoju: '推定' },  // 张文休
    wuzhou_limu: { birth: -290, death: -229, kaoju: '推定' },  // 李牧
    ashina_ashinayandou: { birth: 525, death: 572, kaoju: '推定' },  // 阿史那燕都
    wala_yexian: { birth: 1407, death: 1454 },  // 也先
    chenli_d_zuoxianwang: { birth: 1320, death: 1364, kaoju: '推定' },  // 张必先
    nuoyan_d_sanyinnuoyan: { birth: 1567, death: 1627, kaoju: '推定' },  // 三音诺颜
    wuli_d_celeng: { birth: 1675, death: 1750, kaoju: '推定' },  // 策楞
    yel_yelvxiuge: { birth: 930, death: 998, kaoju: '推定' },  // 耶律休哥
    kumoxi_ahuihui: { birth: 680, death: 735, kaoju: '推定' },  // 阿会毁
    kumo_xiwanghuilibao: { birth: 1075, death: 1123, kaoju: '推定' },  // 回离保
    geluolu_chisipijia: { birth: 690, death: 745, kaoju: '推定' },  // 炽俟毗伽
    ogodei_chuoermahan: { birth: 1190, death: 1241, kaoju: '推定' },  // 绰儿马罕
    kiyad_yesugai: { birth: 1134, death: 1171, kaoju: '推定' },  // 也速该
    xiajiasi_are: { birth: 800, death: 850, kaoju: '推定' },  // 阿热
    wuhuan_tadun: { birth: 168, death: 207, kaoju: '推定' },  // 蹋顿
    mengwu_hebulehan: { birth: 1085, death: 1148, kaoju: '推定' },  // 合不勒
    shaodang_mitang: { birth: 50, death: 105, kaoju: '推定' },  // 迷唐
    xueyantuo_yinan: { birth: 590, death: 645, kaoju: '推定' },  // 夷男
    huige_gulipeiluo: { birth: 705, death: 747, kaoju: '推定' },  // 骨力裴罗
    porbazhyn_mouyu: { birth: 730, death: 779, kaoju: '推定' },    // 牟羽可汗
    kereyid_wanghan: { birth: 1130, death: 1203, kaoju: '推定' },  // 脱斡霖
    naiman_taiyanghan: { birth: 1160, death: 1204, kaoju: '推定' },  // 塔阳
    tatar_mieguzhen: { birth: 1145, death: 1196, kaoju: '推定' },  // 蔑古真
    tushetu_tuxietuhan: { birth: 1594, death: 1655, kaoju: '推定' },  // 衮布
    zhasaketu_zhasakesubadi: { birth: 1575, death: 1637, kaoju: '推定' },  // 素巴第
    gaoche_afuzhiluo: { birth: 450, death: 505, kaoju: '推定' },  // 阿伏至罗
    tujue_ashinatumen: { birth: 490, death: 552, kaoju: '推定' },  // 阿史那土门
    yujiulu_yujiulv: { birth: 385, death: 429, kaoju: '推定' },  // 郁久闾大檀
    yaoluoge_yaoluogepusa: { birth: 605, death: 649, kaoju: '推定' },  // 药罗葛菩萨
    hongirad_dexuechan: { birth: 1135, death: 1200, kaoju: '推定' },  // 德薛禅
    choros_tuohuan: { birth: 1395, death: 1440, kaoju: '推定' },  // 脱欢
    tiele_qibiheli: { birth: 608, death: 677, kaoju: '推定' },  // 契苾何力
    ashide_ashidejieli: { birth: 640, death: 681, kaoju: '推定' },  // 阿史德颉利
    duolu_ashinahelu: { birth: 605, death: 659, kaoju: '推定' },  // 阿史那贺鲁
    cheshihou_angui: { birth: -110, death: -77, kaoju: '推定' },  // 安归
    kaerka_abadaihan: { birth: 1554, death: 1588 },  // 阿巴岱
    huyan_peicen: { birth: 20, death: 75, kaoju: '推定' },  // 呼衍蒲奴
    chahar_yantiemuer: { birth: 1285, death: 1333 },  // 燕帖木儿
    ongut_alawusi: { birth: 1152, death: 1211, kaoju: '推定' },  // 阿剌兀思
    rouran_shelun: { birth: 360, death: 410, kaoju: '推定' },  // 社仑
    huihu_dunmohedagan: { birth: 735, death: 789, kaoju: '推定' },  // 顿莫贺达干
    kelie_zhaheganbu: { birth: 1155, death: 1215, kaoju: '推定' },  // 札合敢不
    pugu_ashinaguduolu: { birth: 650, death: 692, kaoju: '推定' },  // 骨咄禄
    pulei_dougu: { birth: 25, death: 88, kaoju: '推定' },  // 窦固
    xibo_d_tubote: { birth: 1725, death: 1795, kaoju: '异说' },  // 图伯特
    zhuerqi_sachabieqi: { birth: 1155, death: 1197, kaoju: '异说' },  // 撒察别乞
    chechen_chechenhanshuolei: { birth: 1577, death: 1655 },  // 硕垒
    tumengken_tumengken: { birth: 1558, death: 1601, kaoju: '推定' },  // 图蒙肯
    bayegu_qulishi: { birth: 650, death: 705, kaoju: '推定' },  // 屈利失
    zubu_mogusi: { birth: 1055, death: 1100, kaoju: '推定' },  // 磨古斯
    wuzhumuqin_duoerji: { birth: 1610, death: 1668, kaoju: '推定' },  // 多尔济
    baidi_baidizi: { birth: -580, death: -525, kaoju: '推定' },  // 白狄子
    shiwei_saihou: { birth: 660, death: 720, kaoju: '推定' },  // 塞呴
    sunite_sousai: { birth: 1605, death: 1663, kaoju: '推定' },  // 叟塞
    bulat_beiduanchaer: { birth: 900, death: 960, kaoju: '推定' },  // 孛端察儿
    tuva_qinggunzabu: { birth: 1716, death: 1757, kaoju: '异说' },  // 青滚杂卜
    yiwu_hanshen: { birth: 1435, death: 1488, kaoju: '推定' },  // 罕慎
    kepantuo_dulimi: { birth: 500, death: 560, kaoju: '推定' },  // 阇梨密
    huite_amuersana: { birth: 1723, death: 1757 },  // 阿睦尔撒纳
    tuoming_tuomin: { birth: 1820, death: 1873, kaoju: '推定' },  // 妥明
    chuyue_shatuonasu: { birth: 630, death: 685, kaoju: '推定' },  // 沙陀那速
    keerkezi_manasi: { birth: 820, death: 880, kaoju: '推定' },  // 玛纳斯
    pisha_weichisheng: { birth: 731, death: 794, kaoju: '异说' },  // 尉迟胜
    xingxingxia_guoxiaoke: { birth: 590, death: 649, kaoju: '推定' },  // 郭孝恪
    yangguan_lihao: { birth: 351, death: 417 },  // 李暠
    wulianghai_chelingwubashen: { birth: 1720, death: 1778, kaoju: '异说' },  // 车凌乌巴什
    shache_xian_suoche_shachexian: { birth: 5, death: 62, kaoju: '推定' },  // 莎车贤
    dzungar_galedanceling: { birth: 1695, death: 1745 },  // 噶勒丹策凌
    anxi_guoxin: { birth: 735, death: 808, kaoju: '推定' },  // 郭昕
    yanqi_longtuqizhi: { birth: 600, death: 648, kaoju: '推定' },  // 龙突骑支
    gaochang_quwentai: { birth: 585, death: 640, kaoju: '推定' },  // 麴文泰
    yarkand_abudulatifu: { birth: 1610, death: 1670, kaoju: '推定' },  // 拉提夫
    yiduhu_baershu: { birth: 1175, death: 1242, kaoju: '推定' },  // 巴尔术
    yuchi_weichiyao: { birth: 740, death: 790, kaoju: '推定' },  // 尉迟曜
    zhuxie_zhuxiechixin: { birth: 820, death: 887, kaoju: '推定' },  // 朱邪赤心
    kala_satuke: { birth: 900, death: 955, kaoju: '推定' },  // 萨图克
    saman_yisimayi: { birth: 849, death: 907 },  // 伊斯玛仪
    wusun_liejiaomi: { birth: -190, death: -115, kaoju: '异说' },  // 猎骄靡
    tujishi_sulukehan: { birth: 685, death: 738, kaoju: '推定' },  // 苏禄
    jiazini_mahamaode: { birth: 971, death: 1030 },  // 马哈茂德
    jibin_jianisejia: { birth: 78, death: 144, kaoju: '推定' },  // 迦腻色迦
    danmai_abusalong: { birth: 1128, death: 1201 },  // 阿布萨隆
    ruidian_si_biergeyaer: { birth: 1210, death: 1266 },  // 比尔格雅尔
    kasidiliya_afangsuoshiyi: { birth: 1311, death: 1350 },  // 阿方索十一
    duluo_sangqiao: { birth: 1154, death: 1211 },  // 桑乔一世
    alabo_qiyade: { birth: 622, death: 673 },  // 齐亚德
    xijue_ganyanshou: { birth: -95, death: -36, kaoju: '推定' },  // 郅支
    huarazim_mohemo: { birth: 1169, death: 1220 },  // 摩诃末
    kazakh_hasimu: { birth: 1455, death: 1521, kaoju: '推定' },  // 哈斯木
    suogediyana_arimazes: { birth: -365, death: -327, kaoju: '推定' },  // 阿里马泽斯
    sogdian_dewasitiqi: { birth: 670, death: 722, kaoju: '推定' },  // 德瓦什提奇
    sogdian_aokexiate: { birth: -375, death: -320, kaoju: '推定' },  // 奥克夏特斯
    yanda_touluoman: { birth: 455, death: 515, kaoju: '推定' },  // 头罗曼
    yada_ahexiong: { birth: 430, death: 484, kaoju: '推定' },  // 阿赫雄
    anushidgin_yile: { birth: 1125, death: 1172, kaoju: '推定' },  // 伊勒
    qincha_baqiman: { birth: 1200, death: 1237, kaoju: '推定' },  // 巴奇曼
    dayuan_wugua: { birth: -140, death: -101, kaoju: '推定' },  // 毋寡
    kokand_alimukuli: { birth: 1833, death: 1865, kaoju: '异说' },  // 阿里木库力
    dayuzi_yinalechihei: { birth: 1170, death: 1220, kaoju: '推定' },  // 亦纳勒赤黑
    maer_d_bahelamuchubin: { birth: 545, death: 592, kaoju: '推定' },  // 巴赫拉姆·楚宾
    wugu_d_tugelile: { birth: 990, death: 1063, kaoju: '推定' },  // 图格里勒
    adao_d_mafushou: { birth: 1860, death: 1925, kaoju: '推定' },  // 马福寿
    wuyuan_d_chengui: { birth: 100, death: 165, kaoju: '推定' },  // 陈龟
    shi_clan_moheduotutun: { birth: 680, death: 740, kaoju: '推定' },  // 莫贺咄吐屯
    mamon_mameng: { birth: 950, death: 997, kaoju: '推定' },  // 马蒙
    khoja_apakehezhuo: { birth: 1626, death: 1694 },  // 阿帕克和卓
    fanyanna_xieer: { birth: 1486, death: 1545, kaoju: '推定' },  // 谢尔
    kangju_chebishi: { birth: 690, death: 752, kaoju: '推定' },  // 车鼻施
    qiepantuo_luozhentan: { birth: 700, death: 755, kaoju: '推定' },  // 罗真檀
    jie_sijinti: { birth: 610, death: 660, kaoju: '推定' },  // 斯谨提
    loulan_suojie: { birth: 310, death: 365, kaoju: '推定' },  // 索劼
    dulan_dashibatuer: { birth: 1660, death: 1714, kaoju: '推定' },  // 达什巴图尔
    gurkha_baduersaye: { birth: 1757, death: 1797, kaoju: '异说' },  // 巴都尔萨野
    gongbu_gongbumangbuzhi: { birth: 710, death: 765, kaoju: '推定' },  // 工布莽布支
    xiadun_xiazhongawanglangjie: { birth: 1594, death: 1651 },  // 阿旺朗杰
    tufa_d_tufanutan: { birth: 365, death: 415 },  // 秃发傉檀
    qifu_d_qifuchipan: { birth: 386, death: 428, kaoju: '推定' },  // 乞伏炽磐
    tuyu_d_kualv: { birth: 515, death: 591, kaoju: '异说' },  // 夸吕
    duomi_lunkongre: { birth: 805, death: 866, kaoju: '推定' },  // 论恐热
    dafeichuan_nuohebo: { birth: 615, death: 688, kaoju: '异说' },  // 诺曷钵
    gaxa_zhashi: { birth: 1710, death: 1765, kaoju: '推定' },  // 扎什端珠布
    jinchuan_g_shaluoben: { birth: 1695, death: 1760, kaoju: '推定' },  // 莎罗奔
    xiangxiong_limixia_x: { birth: 590, death: 644, kaoju: '推定' },  // 李迷夏
    ladakh_senggelangjie: { birth: 1570, death: 1642, kaoju: '推定' },  // 僧格朗杰
    khoshut_gushihan: { birth: 1582, death: 1655 },  // 图鲁拜琥
    nvguo_mojie: { birth: 700, death: 755, kaoju: '推定' },  // 末羯
    karmapa_queyingduoji: { birth: 1604, death: 1674 },  // 却英多吉
    xianlingqiang_dianling: { birth: 70, death: 112, kaoju: '推定' },  // 滇零
    lang_clan_jiangqujianzan: { birth: 1302, death: 1364 },  // 绛曲坚赞
    xiutu_jinridi: { birth: -134, death: -86 },  // 金日磾
    gandenpozhang_dibasangjiejiacuo: { birth: 1653, death: 1705 },  // 桑结嘉措
    khyungpo_qiongbobangse: { birth: 570, death: 635, kaoju: '推定' },  // 琼波邦色
    gar_kham_dengbazeren: { birth: 1678, death: 1738, kaoju: '异说' },  // 登巴泽仁
    guangwu_xinwuxian: { birth: -110, death: -50, kaoju: '推定' },  // 辛武贤
    supi_xinuoluo: { birth: 675, death: 728, kaoju: '推定' },  // 悉诺逻
    tsangpa_pengcuonanjie: { birth: 1586, death: 1621 },  // 彭措南杰
    spurgyal_dariniansai: { birth: 510, death: 565, kaoju: '推定' },  // 达日年塞
    galangdiba_wangqindundui: { birth: 1725, death: 1785, kaoju: '推定' },  // 旺钦顿堆
    fuguo_yizeng: { birth: 510, death: 565, kaoju: '推定' },  // 宜缯
    bailang_tangzeng: { birth: 530, death: 585, kaoju: '推定' },  // 唐缯
    humi_zhentan: { birth: 685, death: 745, kaoju: '推定' },  // 真檀
    xiaobolu_meijinmang: { birth: 695, death: 750, kaoju: '推定' },  // 没谨忙
    guge_chizhaxichabade: { birth: 1025, death: 1085, kaoju: '推定' },  // 扎西查巴
    pazhu_redangunsangpa: { birth: 1395, death: 1455, kaoju: '推定' },  // 热丹衮桑帕
    ali_gandancaiwang: { birth: 1640, death: 1695, kaoju: '推定' },  // 甘丹才旺
    nandou_sushili: { birth: 680, death: 738, kaoju: '推定' },  // 苏失利
    bailan_pabala: { birth: 1439, death: 1487 },  // 帕巴拉
    jiantang_sangjiejia: { birth: 1620, death: 1682, kaoju: '异说' },  // 桑杰嘉措
    kongsa_kongsayiduo: { birth: 1730, death: 1790, kaoju: '异说' },  // 孔萨益多
    gling_lingesar: { birth: 1038, death: 1115, kaoju: '推定' },  // 格萨尔
    daca_dacajilong: { birth: 1759, death: 1810, kaoju: '推定' },  // 达擦济咙
    gongtang_gongtangcang: { birth: 1762, death: 1823, kaoju: '推定' },  // 贡唐仓
    nanjie_nanjiewangqiu: { birth: 1610, death: 1670, kaoju: '推定' },  // 南杰旺秋
    nanzhong_mazhong: { birth: 188, death: 249, kaoju: '推定' },  // 马忠
    yueyi_zhangyi: { birth: 195, death: 254, kaoju: '推定' },  // 张嶷
    jingdong_taohong: { birth: 1320, death: 1382, kaoju: '推定' },  // 陶洪
    luohu_ganmuding: { birth: 1280, death: 1340, kaoju: '异说' },  // 敢木丁
    ailao_leilao: { birth: 35, death: 85, kaoju: '推定' },  // 类牢
    mingzheng_jianzandechang: { birth: 1390, death: 1450, kaoju: '推定' },  // 坚赞德昌
    hani_d_zhebi: { birth: 1610, death: 1665, kaoju: '推定' },  // 遮比
    dali_duansiping: { birth: 893, death: 944 },  // 段思平
    dongxu_mangruiti: { birth: 1516, death: 1550 },  // 莽瑞体
    meitai_hagenba: { birth: 1569, death: 1627, kaoju: '推定' },  // 哈根巴
    mu_lijiang_muzeng: { birth: 1587, death: 1646 },  // 木增
    dianguo_zhuangqiao: { birth: -330, death: -275, kaoju: '推定' },  // 庄蹻
    konbaung_yongjiya: { birth: 1714, death: 1760 },  // 雍笈牙
    nanzhao_geluofeng: { birth: 712, death: 779 },  // 阁罗凤
    wuman_gaipin: { birth: 710, death: 770, kaoju: '推定' },  // 盖聘
    dai_daoyingmeng: { birth: 1450, death: 1505, kaoju: '推定' },  // 刀应勐
    taiyuan_menglai: { birth: 1238, death: 1317 },  // 孟莱
    suke_langanheng: { birth: 1237, death: 1298, kaoju: '异说' },  // 兰甘亨
    luchuan_sirenfa: { birth: 1395, death: 1446, kaoju: '推定' },  // 思任发
    kunming_yi_lucheng: { birth: 10, death: 75, kaoju: '推定' },  // 卤承
    cuanshi_cuanlongyan: { birth: 400, death: 448, kaoju: '异说' },  // 爨龙颜
    baiman_gaoshengtai: { birth: 1045, death: 1096, kaoju: '推定' },  // 高升泰
    champa_zhipenge: { birth: 1330, death: 1390, kaoju: '推定' },  // 制蓬峨
    qiong_rengui: { birth: -10, death: 55, kaoju: '推定' },  // 任贵
    daozhou_yangzaixing: { birth: 1104, death: 1140, kaoju: '推定' },  // 杨再兴
    guangping_ruanwenzhang: { birth: 1753, death: 1811, kaoju: '异说' },  // 阮文张
    duanzhou_d_caojin: { birth: 1492, death: 1522, kaoju: '推定' },  // 曹觐
    monong_anong: { birth: 1000, death: 1055, kaoju: '推定' },  // 阿侬
    basha_d_daogengmeng: { birth: 1745, death: 1798, kaoju: '推定' },  // 刀更孟
    leizhou_limao: { birth: 610, death: 675, kaoju: '推定' },  // 李茂
    ketagalan_huangqingyun: { birth: 1620, death: 1680, kaoju: '推定' },  // 黄青云
    shuizhen_qudaren: { birth: 1516, death: 1596, kaoju: '推定' },  // 区大任
    ryukyu_shangbazhi: { birth: 1372, death: 1439 },  // 尚巴志
    luoping_zhangshijie: { birth: 1234, death: 1279, kaoju: '推定' },  // 张世杰
    chaozhou_d_mafa: { birth: 1225, death: 1279, kaoju: '推定' },  // 马发
    chendiaoyan_chendiaoyan: { birth: 1245, death: 1282, kaoju: '推定' },  // 陈吊眼
    dengmaoqi_dengmaoqi: { birth: 1405, death: 1449, kaoju: '推定' },  // 邓茂七
    xinjiang_maji: { birth: 1220, death: 1276, kaoju: '推定' },  // 马塈
    jing_dingbuling: { birth: 924, death: 979 },  // 丁部领
    paiwan_alugu: { birth: 1820, death: 1875, kaoju: '推定' },  // 阿禄古
    nguyen_guangnan_ruanfuying: { birth: 1762, death: 1820 },  // 阮福映
    zhuang_d_washifuren: { birth: 1496, death: 1555 },  // 瓦氏
    nanyue_zhaotuo: { birth: -240, death: -137, kaoju: '推定' },  // 赵佗
    zhancheng_zhimin: { birth: 1230, death: 1288, kaoju: '推定' },  // 制旻
    xiou_yixusong: { birth: -255, death: -218, kaoju: '推定' },  // 译吁宋
    gouding_wubo: { birth: -60, death: 10, kaoju: '推定' },  // 毋波
    paiyao_huangguasi: { birth: 1730, death: 1785, kaoju: '推定' },  // 黄瓜四
    yingzhou_liuyan: { birth: 889, death: 942 },  // 刘龑
    linyi_fanyangmai: { birth: 400, death: 446, kaoju: '推定' },  // 范阳迈
    xian_d_xianfuren: { birth: 512, death: 602, kaoju: '异说' },  // 冼英
    luodian_shexiang: { birth: 1358, death: 1396 },  // 奢香
    nong2_nongzhigao: { birth: 1025, death: 1055 },  // 侬智高
    dongzu_wumian: { birth: 1350, death: 1385, kaoju: '推定' },  // 吴勉
    tian_sizhou_tianyougong: { birth: 1080, death: 1144, kaoju: '异说' },  // 田祐恭
    luoyue_zhengce: { birth: 14, death: 43, kaoju: '推定' },  // 征侧
    leloi: { birth: 1385, death: 1433 },  // 黎利
    dacheng_chenkai: { birth: 1822, death: 1861 },  // 陈开
    dayue_chenguojun: { birth: 1228, death: 1300 },  // 陈国峻
    shengmiao_baoli: { birth: 1760, death: 1825, kaoju: '推定' },  // 包利
    miao_qing_yangwanzhe: { birth: 1315, death: 1358, kaoju: '推定' },  // 杨完者
    liren_funanshe: { birth: 1460, death: 1512, kaoju: '异说' },  // 符南蛇
    yelang_duotong: { birth: -160, death: -110, kaoju: '推定' },  // 多同
    zangke_xielongyu: { birth: 580, death: 642, kaoju: '推定' },  // 谢龙羽
    xinggu_cuanxi: { birth: 170, death: 235, kaoju: '推定' },  // 爨习
    guangxin_shixie: { birth: 137, death: 226 },  // 士燮
    shaozhou_zhangzhensun: { birth: 1235, death: 1277, kaoju: '异说' },  // 张镇孙
    shixing_houandou: { birth: 516, death: 563, kaoju: '异说' },  // 侯安都
    buyi_d_weichaoyuan: { birth: 1768, death: 1797, kaoju: '推定' },  // 韦朝元
    lizhou_d_liaohua: { birth: 185, death: 264, kaoju: '推定' },  // 廖化
    kui_gongsunshu: { birth: -15, death: 36, kaoju: '推定' },  // 公孙述
    yang_bozhou_yangyinglong: { birth: 1551, death: 1600 },  // 杨应龙
    chenghan_lite: { birth: 250, death: 303, kaoju: '推定' },  // 李特
    zuo_d_wufu: { birth: 1325, death: 1383, kaoju: '异说' },  // 吴复
    miaomin_shiliudeng: { birth: 1762, death: 1796, kaoju: '异说' },  // 石柳邓
    wumeng_azi: { birth: 1345, death: 1400, kaoju: '推定' },  // 阿资
    shuixi_anbangyan: { birth: 1575, death: 1629, kaoju: '推定' },  // 安邦彦
    xiangzhou_lvwenhuan: { birth: 1225, death: 1298, kaoju: '推定' },  // 吕文焕
    guo_jixin: { birth: -245, death: -204, kaoju: '推定' },  // 纪信
    zi_changhong: { birth: -565, death: -492, kaoju: '推定' },  // 苌弘
    zhongxiang_ganning: { birth: 170, death: 220, kaoju: '推定' },  // 甘宁
    wanzhou_shangguankui: { birth: 1225, death: 1277, kaoju: '推定' },  // 上官夔
    ba_bamanzi: { birth: -350, death: -300, kaoju: '推定' },  // 巴蔓子
    hezhou_wangjian: { birth: 1198, death: 1264 },  // 王坚
    qiuchi_yangnandang: { birth: 385, death: 442, kaoju: '推定' },  // 杨难当
    cong_puhu: { birth: 160, death: 220, kaoju: '推定' },  // 朴胡
    tan_d_qinhou: { birth: 1330, death: 1372, kaoju: '异说' },  // 覃垕
    xiang_d_xiangdakun: { birth: 1520, death: 1575, kaoju: '推定' },  // 覃大旺
    ran_d_ranshouzhong: { birth: 1325, death: 1385, kaoju: '推定' },  // 冉守忠
    wuxi_shamoke: { birth: 175, death: 222, kaoju: '推定' },  // 沙摩柯
    kuai_kuaiyue: { birth: 150, death: 214, kaoju: '推定' },  // 蒯越
    bandun_fanmu: { birth: -240, death: -185, kaoju: '推定' },  // 范目
    she_shechongming: { birth: 1570, death: 1629, kaoju: '推定' },  // 奢崇明
    boren_ada: { birth: 1525, death: 1573, kaoju: '推定' },  // 阿大
    chenzhou_d_zhanghao: { birth: 710, death: 764, kaoju: '推定' },  // 张镐
    xiqin_wanyanchenheshang: { birth: 1192, death: 1232 },  // 完颜陈和尚
    baiyang_mengtian: { birth: -250, death: -210 },  // 蒙恬
    qianzhong_wubayue: { birth: 1729, death: 1796 },  // 吴八月
    dangchang_liangmiding: { birth: 500, death: 555, kaoju: '推定' },  // 梁弥定
    liao_houhongyuan: { birth: 310, death: 365, kaoju: '推定' },  // 侯弘远
    sou_gaodingyuan: { birth: 175, death: 225, kaoju: '推定' },  // 高定元
    qingyi_fanchangsheng: { birth: 218, death: 318 },  // 范长生
    liangzhou_zhanggui: { birth: 255, death: 314 },  // 张轨
    baishui_yanghuai: { birth: 170, death: 212, kaoju: '推定' },  // 杨怀
    dangzhou_qiangduan: { birth: 175, death: 235, kaoju: '推定' },  // 强端
    didao_wangshao: { birth: 1030, death: 1081 },  // 王韶
    ganzhou_dourong: { birth: -16, death: 62 },  // 窦融
    shazhou_zhangyichao: { birth: 799, death: 872 },  // 张议潮
    dongshengwei_wangyue: { birth: 1423, death: 1498, kaoju: '异说' },  // 王越
    guiyi_caoyijin: { birth: 880, death: 935, kaoju: '推定' },  // 曹议金
    weiming_weiminglinggong: { birth: 1175, death: 1227, kaoju: '推定' },  // 嵬名山
    chile_hulvjin: { birth: 488, death: 567 },  // 斛律金
    chijin_qiewangshijia: { birth: 1395, death: 1446, kaoju: '推定' },  // 且旺失加
    yeli_yeliwangrong: { birth: 995, death: 1043, kaoju: '推定' },  // 野利旺荣
    hunxie_xuziwei: { birth: -155, death: -95, kaoju: '推定' },  // 徐自为
    guazhou_zhangshougui: { birth: 684, death: 740 },  // 张守珪
    kang_liangshidou: { birth: 570, death: 628 },  // 梁师都
    yingli_jilasiyi: { birth: 1020, death: 1075, kaoju: '推定' },  // 籍辣思义
    huizhou_yaosi: { birth: 1028, death: 1094, kaoju: '异说' },  // 姚兕
    huan_zhongshidao: { birth: 1051, death: 1126 },  // 种师道
    wei2_hunjian: { birth: 736, death: 799 },  // 浑瑊
    pugu_puguhuaien: { birth: 715, death: 765, kaoju: '推定' },  // 仆固怀恩
    ningkou_liling: { birth: -134, death: -74 },  // 李陵
    juqu_d_juqumengxun: { birth: 368, death: 433 },  // 沮渠蒙逊
    tianxiong_tianchengsi: { birth: 705, death: 779 },  // 田承嗣
    jin_xianzhen: { birth: -660, death: -627, kaoju: '推定' },  // 先轸
    zhongshan_yangaoqing: { birth: 692, death: 756 },  // 颜杲卿
    chimei_fanchong: { birth: -15, death: 27, kaoju: '推定' },  // 樊崇
    xiao_d_xiaoyan: { birth: 464, death: 549 },  // 萧衍
    wazhai_zhanghan: { birth: -245, death: -205, kaoju: '推定' },  // 章邯
    jiaodong_tiandan: { birth: -315, death: -250, kaoju: '推定' },  // 田单
    jibei_wangkuang: { birth: 145, death: 192, kaoju: '推定' },  // 王匡
    qi_simarangju: { birth: -540, death: -490, kaoju: '推定' },  // 司马穰苴
    long2_weixiaokuan: { birth: 509, death: 580 },  // 韦孝宽
    dongxian_sunbin: { birth: -382, death: -316, kaoju: '推定' },  // 孙膑
    mi_mizhu: { birth: 165, death: 221, kaoju: '推定' },  // 麋竺
    baibo_guotai: { birth: 150, death: 191, kaoju: '推定' },  // 郭太
    ruo_wangjian: { birth: -303, death: -214, kaoju: '推定' },  // 王翦
    yaozhou_limaozhen: { birth: 856, death: 924 },  // 李茂贞
    quanrong_yiquhai: { birth: -345, death: -272, kaoju: '推定' },  // 义渠骇
    yun_wuli: { birth: -610, death: -550, kaoju: '推定' },  // 吾离
    pizhou_lvbu: { birth: 161, death: 199, kaoju: '推定' },  // 吕布
    qing_quduan: { birth: 1091, death: 1131, kaoju: '异说' },  // 曲端
    han_baoyuan: { birth: -320, death: -270, kaoju: '推定' },  // 暴鸢
    liguo_zhaoshe: { birth: -290, death: -267, kaoju: '推定' },  // 赵奢
    shangzhou_shangyang: { birth: -390, death: -338 },  // 商鞅
    yuan_cj_d_lishuo: { birth: 773, death: 821 },  // 李愬
    mengcheng_d_gaoqiong: { birth: 935, death: 1006 },  // 高琼
    bozhou_d_yujin: { birth: 160, death: 221, kaoju: '推定' },  // 于禁
    lai_wangshifan: { birth: 874, death: 908 },  // 王师范
    mushi_muchong: { birth: 355, death: 410, kaoju: '推定' },  // 公孙五楼
    xiongding_murongyong: { birth: 336, death: 394, kaoju: '推定' },  // 慕容永
    pinghai_laihuer: { birth: 545, death: 618, kaoju: '推定' },  // 来护儿
    linhu_mafang: { birth: 1518, death: 1581 },  // 马芳
    shanrong_lanyu: { birth: 1338, death: 1393, kaoju: '推定' },  // 蓝玉
    lingqiu_zhaowuling: { birth: -340, death: -295, kaoju: '异说' },  // 赵雍
    huo_songlaosheng: { birth: 560, death: 617, kaoju: '推定' },  // 宋老生
    gongsun_d_gongsundu: { birth: 150, death: 204 },  // 公孙度
    jianzhou_nvzhen_limanzhu: { birth: 1405, death: 1467, kaoju: '推定' },  // 李满住
    qingyuan_bd_zhoudewei: { birth: 858, death: 918, kaoju: '推定' },  // 周德威
    changshan_yangyanzhao: { birth: 958, death: 1014 },  // 杨延昭
    hejian_gongsunzan: { birth: 155, death: 199, kaoju: '推定' },  // 公孙瓒
    liangshidu_longjia: { birth: -365, death: -312, kaoju: '推定' },  // 龙贾
    yangshe_yangshezhi: { birth: -625, death: -570, kaoju: '推定' },  // 羊舌职
    guzhu_tianyu: { birth: 171, death: 252, kaoju: '推定' },  // 田豫
    dizhou_wangyanzhang: { birth: 863, death: 923 },  // 王彦章
    qu_d_quyi: { birth: 150, death: 195, kaoju: '推定' },  // 麴义
    wangyan_wangyan: { birth: 1090, death: 1139 },  // 王彦
    zhe_d_zheyuqing: { birth: 958, death: 995, kaoju: '异说' },  // 折御卿
    ying_caojingzong: { birth: 457, death: 508 },  // 曹景宗
    kejia_wentianxiang: { birth: 1235, death: 1280, kaoju: '推定' },  // 黄凤
    tingzhou_d_chenmin: { birth: 260, death: 307, kaoju: '推定' },  // 陈敏
    fu2_zhoudi: { birth: 515, death: 565, kaoju: '推定' },  // 周迪
    ouyang_ouyangwei: { birth: 498, death: 563 },  // 欧阳頠
    chu_d_lukang: { birth: 126, death: 195 },  // 陆康
    yan_leyi: { birth: -315, death: -245, kaoju: '推定' },  // 乐毅
    zhao_lianpo: { birth: -305, death: -222, kaoju: '异说' },  // 廉颇
    yang_aner_yangan: { birth: 325, death: 380, kaoju: '推定' },  // 杨安
    xie_xiefangde: { birth: 1226, death: 1289 },  // 谢枋得
    wan_liuyuan: { birth: 1085, death: 1140, kaoju: '推定' },  // 刘源
    huang_d_sunshuao: { birth: 174, death: 228 },  // 贾逵
    wenzhou_zhangcong: { birth: 1319, death: 1374 },  // 方国珍
    wuling_xiangdancheng: { birth: 15, death: 65, kaoju: '推定' },  // 相单程
    fangla_fangla: { birth: 1075, death: 1121, kaoju: '推定' },  // 方腊
    fang_guozhen_fangguozhen: { birth: 1505, death: 1565, kaoju: '异说' },  // 卢镗
    ouyue_zouyao: { birth: -240, death: -175, kaoju: '异说' },  // 驺摇
    ruochu_doulian: { birth: -750, death: -690, kaoju: '推定' },  // 鬬廉
    yue_goujian: { birth: -520, death: -465, kaoju: '推定' },  // 勾践
    xushouhui_zhaopusheng: { birth: 1315, death: 1359, kaoju: '推定' },  // 赵普胜
    wu_sunwu: { birth: -545, death: -470 },  // 孙武
    qiufu_qiufu: { birth: 815, death: 860, kaoju: '推定' },  // 裘甫
    yiyang_d_mengzongzheng: { birth: 1163, death: 1223, kaoju: '异说' },  // 孟宗政
    yezongliu_yezongliu: { birth: 1404, death: 1448, kaoju: '推定' },  // 叶宗留
    huangwang_huangchao: { birth: 820, death: 884, kaoju: '推定' },  // 黄巢
    linshihong_linshihong: { birth: 570, death: 622, kaoju: '推定' },  // 林士弘
    liu_yingbu: { birth: -245, death: -196, kaoju: '推定' },  // 英布
    shuntian_linshuangwen: { birth: 1756, death: 1788 },  // 林爽文
    chunshen_huangxie: { birth: -314, death: -238, kaoju: '推定' },  // 黄歇
    mi_chu_xionglv: { birth: -626, death: -591, kaoju: '推定' },  // 熊旅
    she_ethnic_leiwanxing: { birth: 655, death: 715, kaoju: '推定' },  // 雷万兴
    wang_s_wanghua: { birth: 586, death: 649, kaoju: '异说' },  // 汪华
    hongzhou_zhuwenzheng: { birth: 1336, death: 1365, kaoju: '推定' },  // 朱文正
    gumie_liuyu: { birth: 1622, death: 1694 },  // 李之芳
    hu_d_husansheng: { birth: 1357, death: 1417 },  // 吴允诚
    mino_dagujiji: { birth: 1559, death: 1600, kaoju: '异说' },  // 大谷吉继
    zhuqian_shaoerzineng: { birth: 1198, death: 1281 },  // 少贰资能
    ssangseong_lizichun: { birth: 1315, death: 1361 },  // 李子春
    yao_liuyuan: { birth: 251, death: 310 },  // 刘渊
    kong_d_caogui: { birth: -715, death: -655, kaoju: '推定' },  // 曹刿
    fu_zhou_yanyan: { birth: 152, death: 222, kaoju: '推定' },  // 严颜
    lushui_dongzhuo: { birth: 132, death: 192, kaoju: '异说' },  // 董卓
    cen_d_cenmeng: { birth: 1489, death: 1526, kaoju: '推定' },  // 岑猛
    miao_amishi: { birth: 1405, death: 1460, kaoju: '推定' },  // 阿迷氏
    jiang_s_huanggai: { birth: 154, death: 215, kaoju: '推定' },  // 黄盖
    muong_shencongyue: { birth: 1010, death: 1065, kaoju: '推定' },  // 申从岳
    panyao_pandaxiao: { birth: 1315, death: 1375, kaoju: '推定' },  // 盘大孝
    chen2_zhaofan: { birth: 165, death: 225, kaoju: '推定' },  // 赵范
    qian_songjingyang: { birth: 905, death: 965, kaoju: '推定' },  // 宋景阳
    jiashi_wangxuance: { birth: 612, death: 672, kaoju: '异说' },  // 王玄策
    monpa_meire: { birth: 1618, death: 1680, kaoju: '推定' },  // 洛珠嘉措
    xining_yangyingju: { birth: 1696, death: 1766 },  // 杨应琚
    kalun_dexinga: { birth: 1805, death: 1867, kaoju: '推定' },  // 德兴阿
    golog_wandezhaxi: { birth: 1715, death: 1775, kaoju: '推定' },  // 完德扎西
    lopi_abo: { birth: 1720, death: 1780, kaoju: '推定' },  // 阿波
    donghu_tuiyin: { birth: -25, death: 35, kaoju: '推定' },  // 推寅
    dingling_weilu: { birth: -145, death: -80, kaoju: '推定' },  // 卫律
    buriat_tumenjiergale: { birth: 1715, death: 1775, kaoju: '推定' },  // 吉尔嘎勒
    donghui_nanlv: { birth: -170, death: -110, kaoju: '推定' },  // 南闾
    gonggu_gonggudaozhu: { birth: 1450, death: 1500, kaoju: '推定' },  // 麻利芝
    yizhi_beigou: { birth: 195, death: 255, kaoju: '推定' },  // 难升米
    beihai_shamusheyun: { birth: 1606, death: 1669 },  // 沙牟奢允
    sheng_d_liyiqi: { birth: 1495, death: 1555, kaoju: '异说' },  // 李亿祺
    haikou_wangzhi: { birth: 1501, death: 1559, kaoju: '推定' },  // 汪直
    shanshan_weituqi: { birth: -115, death: -55, kaoju: '推定' },  // 尉屠耆
    qianhui_baiyanhu: { birth: 1830, death: 1882 },  // 白彦虎
    ava_minye_kyawswa: { birth: 1391, death: 1415 },  // 明耶觉苏瓦
    dian_cuanchongdao: { birth: 695, death: 748, kaoju: '推定' },  // 爨崇道
    mon_monuhe: { birth: 1005, death: 1065, kaoju: '推定' },  // 摩奴诃
    niang_suonanjiabo: { birth: 1405, death: 1465, kaoju: '推定' },  // 索南加波
    dalung_sangjiwen: { birth: 1251, death: 1296, kaoju: '异说' },  // 桑吉温
    dong_nangqianjiabo: { birth: 1135, death: 1195, kaoju: '推定' },  // 囊谦
    hor_chisang: { birth: 1615, death: 1675, kaoju: '推定' },  // 赤桑
    pyu_moluo: { birth: 750, death: 810, kaoju: '推定' },  // 摩罗惹
    nongzhigao_huangshimi: { birth: 1005, death: 1053, kaoju: '推定' },  // 黄师宓
    weitou_douti: { birth: 30, death: 74, kaoju: '推定' },  // 兜题
    yumi_anguo: { birth: 90, death: 145, kaoju: '推定' },  // 安国
    qiemo_anmoshenpan: { birth: 15, death: 75, kaoju: '推定' },  // 安末深盘
    pishan_daihu: { birth: 20, death: 80, kaoju: '推定' },  // 代胡
    ruoqiang_quhulai: { birth: -35, death: 25, kaoju: '推定' },  // 去胡来
    weili_weilifan: { birth: -90, death: -30, kaoju: '推定' },  // 尉犁泛
    wensu_guyi: { birth: -85, death: -25, kaoju: '推定' },  // 姑翼
    duerbote_duerbote_taiji: { birth: 1540, death: 1600, kaoju: '推定' },  // 博贝
    xiye_zihe: { birth: -75, death: -15, kaoju: '推定' },  // 子合
    faqiang_niechizanpu: { birth: -160, death: -100, kaoju: '推定' },  // 聂赤
    zhuoshi_gaopian: { birth: 821, death: 887 },  // 高骈
    xingliao_dayanlin: { birth: 975, death: 1030, kaoju: '推定' },  // 大延琳
    xihai_d_fulianchou: { birth: 455, death: 529, kaoju: '异说' },  // 伏连筹
    guzgan_abuhalisi: { birth: 930, death: 995, kaoju: '推定' },  // 阿布哈里斯
    kawusi_haidaer: { birth: 1715, death: 1775, kaoju: '推定' },  // 海达尔
    xianhai_shamalike: { birth: 995, death: 1044, kaoju: '推定' },  // 沙马利克
    wuhu_dukake: { birth: 930, death: 990, kaoju: '推定' },  // 都卡克
    xingan_hailancha: { birth: 1740, death: 1793, kaoju: '异说' },  // 海兰察
    dongping_langtan: { birth: 1634, death: 1695, kaoju: '异说' },  // 郎坦
    badakhshan_yaerbeige: { birth: 1625, death: 1707, kaoju: '推定' },  // 雅尔贝格
    keliya_fuduxin: { birth: 615, death: 675, kaoju: '推定' },  // 伏阇信
    bailong_suomai: { birth: 270, death: 325, kaoju: '推定' },  // 索劢
    sai_gaijiayun: { birth: 685, death: 745, kaoju: '推定' },  // 盖嘉运
    weiwuer_yusubu: { birth: 1440, death: 1505, kaoju: '推定' },  // 玉素布
    kangba_suonuomugunbu: { birth: 1715, death: 1775, kaoju: '推定' },  // 索诺木衮布
    yong_lujili: { birth: -655, death: -611, kaoju: '推定' },  // 庐戢黎
    jingcheng_d_yuyouzhao: { birth: 1434, death: 1489 },  // 鱼有沼
    xin_baiqi: { birth: -332, death: -257 },  // 白起
    pangzha_halixinge: { birth: 1791, death: 1837 },  // 哈里辛格
    najie_minande: { birth: -185, death: -130, kaoju: '异说' },  // 米南德
    dulan_d_aihamaide: { birth: 1722, death: 1772, kaoju: '异说' },  // 艾哈迈德
    muer_mujier: { birth: 1120, death: 1175, kaoju: '推定' },  // 穆吉尔
    baha_gaiwamu: { birth: 1416, death: 1481, kaoju: '推定' },  // 盖瓦姆
    hali_gedaerzi: { birth: 10, death: 51, kaoju: '推定' },  // 戈达尔兹
    kalan_suhela: { birth: 435, death: 493, kaoju: '推定' },  // 苏赫拉
    xisi_safaer: { birth: 840, death: 900, kaoju: '异说' },  // 萨法尔
    delan_sulun: { birth: -84, death: -52 },  // 苏伦
    huluo_jiyasiding: { birth: 1140, death: 1203, kaoju: '推定' },  // 吉亚斯丁
    aba_shapuer: { birth: 215, death: 270 },  // 沙普尔
    shaozhou_d_mayin: { birth: 852, death: 930 },  // 马殷
    chuzhou_d_huangfuhui: { birth: 900, death: 956, kaoju: '推定' },  // 皇甫晖
    cangzhou_liurengong: { birth: 848, death: 914, kaoju: '推定' },  // 刘仁恭
    yuezhi_xihou: { birth: 915, death: 975, kaoju: '推定' },  // 黄头
    minyue_wuzhu: { birth: -255, death: -190, kaoju: '推定' },  // 无诸
    funan_fanman: { birth: 180, death: 230, kaoju: '推定' },  // 范蔓
    lancang_faang: { birth: 1316, death: 1393 },  // 法昂
    ahaomu_laqite: { birth: 1622, death: 1672 },  // 拉其特
    elunchunzu_gaishan: { birth: 1630, death: 1690, kaoju: '推定' },  // 盖山
    wazu_banhongwang: { birth: 1880, death: 1946, kaoju: '推定' },  // 胡玉山
    tajikezu_kuerban: { birth: 1730, death: 1790, kaoju: '推定' },  // 库尔班
    jingpozu_zaodan: { birth: 1835, death: 1895, kaoju: '推定' },  // 早丹
    shuizu_panxinjian: { birth: 1820, death: 1869 },  // 潘新简
    liuzhou_shenxiyi: { birth: 1491, death: 1554 },  // 沈希仪
    weizhou_weigao: { birth: 745, death: 805 },  // 韦皋
    dongsheng_weishang: { birth: -215, death: -155, kaoju: '推定' },  // 魏尚
    yansui_wangwei: { birth: 1570, death: 1630, kaoju: '推定' },  // 王威
    xiazhou_lijiqian: { birth: 963, death: 1004 },  // 李继迁
    shizhou_liucong: { birth: 275, death: 318, kaoju: '推定' },  // 刘聪
    yanzhou_zhongshiheng: { birth: 985, death: 1045 },  // 种世衡
    manghuti_weidaer: { birth: 1158, death: 1203, kaoju: '推定' },  // 畏答儿
    xingwei_hanba: { birth: 1315, death: 1375, kaoju: '推定' },  // 罕拔
    saerbadaer_lazhake: { birth: 1305, death: 1338, kaoju: '推定' },  // 拉扎克
    kumisi_aerpu: { birth: 1029, death: 1072, kaoju: '推定' },  // 阿尔普
    shahelude_weisitamu: { birth: 550, death: 596, kaoju: '推定' },  // 维斯塔姆
    ribale_faheerdaolai: { birth: 952, death: 997 },  // 法赫尔道莱
    safawei_aisimaier: { birth: 1487, death: 1524 },  // 艾斯迈尔
    yilihanguo_yisimeier: { birth: 1305, death: 1335, kaoju: '推定' },  // 伊斯梅尔
    yilihanguo_d_hezan: { birth: 1271, death: 1304 },  // 合赞
    wulaertu_ajishenti: { birth: 400, death: 451, kaoju: '异说' },  // 瓦尔丹
    gelujiya_tamaer: { birth: 1160, death: 1213 },  // 塔玛尔
    bendou_alikesai: { birth: 1182, death: 1222 },  // 阿历克塞
    keerjisi_bagelate: { birth: 960, death: 1014, kaoju: '异说' },  // 巴格拉特
    saipulusi_juyi: { birth: 1150, death: 1194 },  // 居伊
    bendou_d_mitelidati: { birth: -135, death: -63 },  // 密特里达梯
    fulijiya_maidasi: { birth: -760, death: -696, kaoju: '推定' },  // 迈达斯
    ldiya_keluoyisi: { birth: -595, death: -546, kaoju: '异说' },  // 克罗伊斯
    pajiama_oumainisi: { birth: -310, death: -241, kaoju: '异说' },  // 欧迈尼斯
    bitiniya_diaoduoer: { birth: 1174, death: 1221, kaoju: '异说' },  // 狄奥多尔
    luomu_jilijie: { birth: 1079, death: 1107 },  // 基利杰
    sailiugu_antiaoke: { birth: -241, death: -187 },  // 安条克
    womaya_muaweiye: { birth: 602, death: 680 },  // 穆阿维叶
    gen_baodewen_iv: { birth: 1161, death: 1185 },  // 鲍德温四世
    shengdian_qishi_demolai: { birth: 1244, death: 1314, kaoju: '异说' },  // 莫莱
    maerta_qishi_walaite: { birth: 1494, death: 1568, kaoju: '异说' },  // 瓦莱特
    jialedi_nibujianisa: { birth: -634, death: -562, kaoju: '异说' },  // 尼布甲尼撒
    paermila_zhinuobiya: { birth: 240, death: 274 },  // 芝诺比娅
    abasi_mansuer: { birth: 714, death: 775 },  // 曼苏尔
    samaila_muataisuimu: { birth: 796, death: 842, kaoju: '异说' },  // 穆阿台绥姆
    yashu_saergong: { birth: -762, death: -705, kaoju: '异说' },  // 萨尔贡
    youfaladi_yehaiya: { birth: 738, death: 805, kaoju: '推定' },  // 叶海亚
    midi_daiaokaisi: { birth: -728, death: -675, kaoju: '推定' },  // 戴奥凯斯
    daliushi_iii: { birth: -380, death: -330, kaoju: '推定' },  // 大流士三世
    aqimeinide_aertabazanuosi: { birth: -368, death: -330, kaoju: '推定' },  // 阿里奥巴赞斯
    sashan_aerdaxier: { birth: 180, death: 242 },  // 阿尔达希尔
    safawei_d_abasi: { birth: 1571, death: 1629 },  // 阿拔斯
    aosiruowen_baodewen: { birth: 1058, death: 1118, kaoju: '异说' },  // 鲍德温
    kesa_bulan: { birth: 700, death: 760, kaoju: '推定' },  // 布兰
    aiaoniya_alisita: { birth: -535, death: -496, kaoju: '推定' },  // 阿里斯塔
    yiaoniya_hegesistratus: { birth: -375, death: -325, kaoju: '推定' },  // 赫格西斯特
    jialatai_deaota: { birth: -105, death: -40 },  // 德奥塔鲁斯
    ansxi_aershake: { birth: -280, death: -217, kaoju: '推定' },  // 阿尔沙克
    nabatai_aleitasi: { birth: -115, death: -60, kaoju: '推定' },  // 阿雷塔斯
    xike_lanjite: { birth: 1780, death: 1839 },  // 兰季特辛格
    deli_alawuding: { birth: 1266, death: 1316 },  // 阿拉乌丁
    jieri_jieriwang: { birth: 590, death: 647 },  // 哈尔沙
    kongque_zhantuoluo: { birth: -340, death: -297, kaoju: '异说' },  // 旃陀罗笈多
    mojietuo_pinbisuoluo: { birth: -558, death: -491, kaoju: '异说' },  // 频毗娑罗
    boluo_damoboluo: { birth: 745, death: 810, kaoju: '推定' },  // 达磨波罗
    boluo_vijaya: { birth: -570, death: -505, kaoju: '推定' },  // 毗阇耶
    sumo_sumowang: { birth: -560, death: -500, kaoju: '推定' },  // 苏摩
    jiashi_jiashiwang_d: { birth: -580, death: -520, kaoju: '推定' },  // 梵摩达
    zhuluo_lajialajia: { birth: 947, death: 1014 },  // 拉贾拉贾一世
    pandiya_jiatawaerman: { birth: 1220, death: 1268, kaoju: '推定' },  // 贾塔瓦尔曼
    dedan_dedanwang: { birth: -580, death: -525, kaoju: '推定' },  // 卡比里尔
    maidina_halide: { birth: 592, death: 642, kaoju: '推定' },  // 哈立德
    gulaishi_aibu: { birth: 565, death: 653, kaoju: '异说' },  // 艾布苏富扬
    xierwan_farukusha: { birth: 1685, death: 1719, kaoju: '推定' },  // 法鲁克沙
    xiemian_xiemianwang: { birth: 630, death: 680, kaoju: '推定' },  // 齐贝尔
    yidier_yidiewang: { birth: 920, death: 975, kaoju: '推定' },  // 约瑟夫
    salai_salaiwang: { birth: 1352, death: 1419 },  // 埃迪古
    mangshi_mangshiwang: { birth: 990, death: 1048, kaoju: '异说' },  // 恰格里
    gen_cuauhtemoc: { birth: 1496, death: 1525, kaoju: '异说' },  // 库奥特莫克
    gen_topa_inca: { birth: 1440, death: 1493, kaoju: '推定' },  // 图帕克
    gen_jasawchan: { birth: 682, death: 734, kaoju: '推定' },  // 亚斯纳昌
    gen_lautaro: { birth: 1534, death: 1557 },  // 劳塔罗
    gen_saguamanchica: { birth: 1450, death: 1490, kaoju: '推定' },  // 萨瓜曼奇卡
    gen_arariboia: { birth: 1520, death: 1589, kaoju: '推定' },  // 阿拉里博亚
    gen_sundjata: { birth: 1190, death: 1255, kaoju: '异说' },  // 松迪亚塔
    gen_ezana: { birth: 320, death: 360, kaoju: '推定' },  // 埃扎纳
    zhagewei_gebulei: { birth: 1162, death: 1205, kaoju: '推定' },  // 拉利贝拉
    adal_ghazi: { birth: 1506, death: 1542, kaoju: '异说' },  // 格拉尼
    gen_parameswara: { birth: 1344, death: 1414 },  // 拜里米苏拉
    sanfoqi_dapunta: { birth: 630, death: 689, kaoju: '推定' },  // 达本陀
    gen_panangkaran: { birth: 746, death: 803, kaoju: '推定' },  // 帕南卡兰
    ternate_babula: { birth: 1528, death: 1583, kaoju: '推定' },  // 巴布拉
    sulu_paduka: { birth: 1350, death: 1417, kaoju: '推定' },  // 巴杜卡
    xishudongyin_lijiasipi: { birth: 1502, death: 1565, kaoju: '异说' },  // 莱加斯皮
    gen_mihirabhoja: { birth: 836, death: 885, kaoju: '异说' },  // 迷企罗波阇
    suomunate_kumalapala: { birth: 1143, death: 1173, kaoju: '异说' },  // 库马拉帕拉
    sengjialuo_dutugamo: { birth: -161, death: -137, kaoju: '推定' },  // 杜图伽摩尼
    puxiangyindu_albukeerke: { birth: 1453, death: 1515 },  // 阿尔布克尔克
    gen_tibirica: { birth: 1500, death: 1558, kaoju: '异说' },  // 蒂巴里萨
    gen_chicomacatl: { birth: 1485, death: 1545, kaoju: '推定' },  // 奇科马卡特
    gen_hatuey: { birth: 1478, death: 1512, kaoju: '推定' },  // 哈土依
    gen_bentejui: { birth: 1440, death: 1484, kaoju: '异说' },  // 本特胡伊
    gen_hurao: { birth: 1610, death: 1684, kaoju: '推定' },  // 胡劳
    gen_noli: { birth: 1410, death: 1475, kaoju: '推定' },  // 诺利
    gen_tome_sousa: { birth: 1503, death: 1549, kaoju: '异说' },  // 托梅
    gen_cortes: { birth: 1485, death: 1547, kaoju: '异说' },  // 科尔特斯
    gen_velazquez: { birth: 1465, death: 1524, kaoju: '异说' },  // 贝拉斯克斯
    gen_martim_afonso: { birth: 1500, death: 1564, kaoju: '异说' },  // 马丁·阿方索
    gen_morosini: { birth: 1619, death: 1694, kaoju: '异说' },  // 莫罗西尼
    gen_nur_ad_din: { birth: 1118, death: 1174, kaoju: '异说' },  // 努尔丁
    gen_abgar: { birth: -25, death: 50, kaoju: '推定' },  // 阿布加尔五世
    gen_bonifatius: { birth: 360, death: 432, kaoju: '异说' },  // 博尼法提乌斯
    gen_cipriano_figueiredo: { birth: 1540, death: 1605, kaoju: '推定' },  // 西普里亚诺
    liaozu_saitatila: { birth: 1534, death: 1571 },  // 赛塔提腊
    kushi_amanilunnasi: { birth: -60, death: -20, kaoju: '异说' },  // 阿玛尼伦纳斯
    aimala_katali: { birth: 1740, death: 1781, kaoju: '异说' },  // 卡塔里
    aolisha_anatabamo: { birth: 1078, death: 1150, kaoju: '推定' },  // 阿纳塔跋摩
    kanata_lamalaya: { birth: 1510, death: 1575, kaoju: '异说' },  // 拉玛拉亚
    adile_adilesha: { birth: 1490, death: 1534, kaoju: '异说' },  // 阿迪勒沙
    foluolida_meinendeshi: { birth: 1519, death: 1574 },  // 梅嫩德斯
    fujisi_fujiweng: { birth: -402, death: -318, kaoju: '异说' },  // 福基翁（雅典名将 Phocion，约前402—前318）
    yilisi_yifeituosi: { birth: -800, death: -750, kaoju: '推定' },  // 伊菲托斯
    nuowei_halaer: { birth: 850, death: 933, kaoju: '推定' },  // 哈拉尔
    keernuwaye_geladelong: { birth: 450, death: 510, kaoju: '推定' },  // 格拉德隆
    aodesuosi_aodesuosi: { birth: -400, death: -335, kaoju: '推定' },  // 奥德索斯首领
    disidelusi_disidelusi: { birth: 150, death: 215, kaoju: '推定' },  // 蒂斯德鲁斯督造
    yisatisi_falukezhade: { birth: 625, death: 685, kaoju: '推定' },  // 法鲁克扎德
    pidisha_pidisha: { birth: -200, death: -140, kaoju: '推定' },  // 毗底沙邑长
    jiaye_punafamo: { birth: 415, death: 475, kaoju: '推定' },  // 普那伐摩
    jienei_jienei: { birth: 950, death: 1020, kaoju: '推定' },  // 杰内领主
    gen_basarab_i: { birth: 1270, death: 1352 },  // 巴萨拉布
    muwaxide_yakubu: { birth: 1160, death: 1199, kaoju: '推定' },  // 雅库布
    varendra_devapala: { birth: 788, death: 850, kaoju: '推定' },  // 提婆波罗
    chatigangren_wumeide: { birth: 1600, death: 1660, kaoju: '推定' },  // 乌梅德汗
    duonaobaojia_tzimiskes: { birth: 925, death: 976 },  // 齐米斯基
    lumiliya_lalashahin: { birth: 1330, death: 1388 },  // 拉拉沙欣
    yilaka_tundama: { birth: 1520, death: 1585, kaoju: '推定' },  // 通达马
    xingelana_dawila: { birth: 1500, death: 1560, kaoju: '异说' },  // 达维拉
    xiyindu_batuoluome: { birth: 1450, death: 1500, kaoju: '异说' },  // 巴托洛梅
    jialebi_brasilesuo: { birth: 1700, death: 1765, kaoju: '异说' },  // 布拉斯莱索
    gualani_nicolas: { birth: 1600, death: 1660, kaoju: '推定' },  // 尼古拉斯
    xiadunhe_sviatoslav: { birth: 942, death: 972, kaoju: '异说' },  // 斯维亚托斯拉夫
    gen_bolusi: { birth: -360, death: -325, kaoju: '推定' },  // 波鲁斯
    xiaofulijiya_aerxitis: { birth: -465, death: -422, kaoju: '推定' },  // 阿尔西提斯
    kanan_azemier: { birth: -370, death: -332, kaoju: '推定' },  // 阿泽米尔
    feilisidin_batisi: { birth: -375, death: -330, kaoju: '推定' },  // 巴提斯
    gen_bir_hambir: { birth: 1550, death: 1620, kaoju: '推定' },  // 比尔汉比尔
    gen_ivan_sratsimir: { birth: 1324, death: 1397 },  // 伊凡斯拉齐
    gen_fasilides: { birth: 1603, death: 1667 },  // 法西里德
    gen_francis_i: { birth: 1494, death: 1547 },  // 弗朗索瓦
    gen_sargis_jaqeli: { birth: 1215, death: 1276, kaoju: '推定' },  // 萨尔吉斯
    gen_man_singh_tomar: { birth: 1460, death: 1516, kaoju: '推定' },  // 曼辛格
    gen_pachacuti: { birth: 1391, death: 1471, kaoju: '异说' },  // 帕查库提
    gen_ibrahim_qutb: { birth: 1512, death: 1580, kaoju: '异说' },  // 易卜拉欣
    gen_adityawarman: { birth: 1310, death: 1375, kaoju: '异说' },  // 阿迪蒂亚
    gen_chan_chak: { birth: 900, death: 960, kaoju: '推定' },  // 查克王
    gen_yaqub_saffar: { birth: 840, death: 879 },  // 雅各布
    gen_casimir_great: { birth: 1310, death: 1370 },  // 卡齐米日
    gen_joao_i: { birth: 1357, death: 1433 },  // 若昂一世
    gen_ferdinand_ii: { birth: 1452, death: 1516 },  // 斐迪南二世
    gen_seuthes_iii: { birth: -365, death: -300, kaoju: '推定' },  // 塞乌特斯
    // 原 1192 系误值：他 1189 年已从君士坦丁堡逃回、1196 年已即位，且文献通作「约 1170—1207」
    jialiboli_kaluoyang: { birth: 1170, death: 1207 },  // 卡洛扬（保加利亚沙皇，中文维基/《大英》「约 1170」）
    gen_chabrias: { birth: -420, death: -357, kaoju: '推定' },  // 卡布里亚斯
    sijitai_ateas: { birth: -429, death: -339 },  // 阿泰阿斯
    sijitai_satraces: { birth: -370, death: -320, kaoju: '推定' },  // 萨特拉克斯
    wangdaer_gaisalike: { birth: 389, death: 477, kaoju: '异说' },  // 盖萨里克
    aswaka_cleophis: { birth: -350, death: -295, kaoju: '推定' },  // 克莱奥菲斯
    aornos_aphrikes: { birth: -370, death: -326, kaoju: '推定' },  // 阿夫里凯斯
    julushi_catanes: { birth: -375, death: -323, kaoju: '推定' },  // 卡塔涅斯
    malli_malavapala: { birth: -350, death: -290, kaoju: '推定' },  // 摩罗波罗
    kesaiya_kashtiliash: { birth: -360, death: -320, kaoju: '推定' },  // 卡什提利亚什（前324年亚历山大征科塞亚之战守帅）
    wukexiya_madates: { birth: -370, death: -324, kaoju: '推定' },  // 马达泰斯
    dasaleiti_kleitos: { birth: -365, death: -325, kaoju: '推定' },  // 克莱图斯
    hesitiya_yiasong: { birth: -380, death: -324, kaoju: '推定' },  // 伊阿宋
    hekaniya_artabazos: { birth: -389, death: -325, kaoju: '推定' },  // 阿尔塔巴佐斯
    kapaduoxiya_sabiktas: { birth: -375, death: -322, kaoju: '推定' },  // 萨比克塔斯
    maermajika_paraetos: { birth: -370, death: -325, kaoju: '推定' },  // 帕拉伊托斯
    ameng_jisi: { birth: -380, death: -325, kaoju: '推定' },  // 阿曼阿托
    eerbulushi_beisusi: { birth: -370, death: -329, kaoju: '推定' },  // 贝苏斯
    aliya_satibazanishi: { birth: -375, death: -328, kaoju: '推定' },  // 萨提巴扎尼斯
    xuliya_shoujiang: { birth: -380, death: -318, kaoju: '推定' },  // 马泽乌斯
    emesene_xierkuhe: { birth: 1100, death: 1146, kaoju: '推定' },  // 希尔库赫
    sute_spitamenes: { birth: -370, death: -328, kaoju: '推定' },  // 斯皮塔米尼斯
    xinde_patalawang: { birth: -360, death: -300, kaoju: '推定' },  // 涅阿库斯
    jiduoluoxiya_xibiertiwusi: { birth: -370, death: -319, kaoju: '推定' },  // 西比尔提乌斯
    aolitai_shouling: { birth: -375, death: -315, kaoju: '推定' },  // 拉托尼斯
    shiyuzu_aolaqiuzhang: { birth: -180, death: -120, kaoju: '推定' },  // 阿波罗多洛斯
    kamanniya_zongdu: { birth: -370, death: -320, kaoju: '推定' },  // 阿斯普兰斯
    keerman_xierzhan_shoujiang: { birth: -370, death: -320, kaoju: '推定' },  // 霍斯劳
    zhageluosi_guanjiang: { birth: -370, death: -320, kaoju: '推定' },  // 巴赫拉姆
    lulisitan_shoujiang: { birth: -370, death: -320, kaoju: '推定' },  // 舒特鲁克
    golpayegan_yicheng: { birth: -370, death: -320, kaoju: '推定' },  // 尼扎姆
    meisuobudamiya_shoujiang: { birth: -380, death: -320, kaoju: '推定' },  // 萨宾
    panfeiliya_apollonios: { birth: -240, death: -175, kaoju: '推定' },  // 阿波罗尼奥斯
    baihaliye_djedkhonsu: { birth: -630, death: -570, kaoju: '推定' },  // 杰德孔苏
    kuida_chakar: { birth: 1480, death: 1533, kaoju: '推定' },  // 恰卡尔
    zhalange_barsaentes: { birth: -370, death: -330, kaoju: '推定' },  // 巴尔塞恩特斯
    maikelan_punong: { birth: 950, death: 1015, kaoju: '推定' },  // 普农
    sumeier_nabopalasa: { birth: -658, death: -605, kaoju: '异说' },  // 那波帕拉萨（乌鲁克·新巴比伦开国君主）
    wuer_boshasha: { birth: -580, death: -539, kaoju: '推定' },  // 伯沙撒（乌尔城·新巴比伦摄政王）
    guyashu_tigelate: { birth: -795, death: -727, kaoju: '推定' },  // 提格拉特（亚述城·提格拉特帕拉沙尔三世）
    xikesuosi_samutike: { birth: -685, death: -610, kaoju: '推定' },  // 萨姆提克（阿瓦里斯·萨姆提克一世）
    dibisi_tahaerka: { birth: -710, death: -664, kaoju: '推定' },  // 塔哈尔卡（瓦塞特·埃及第二十五王朝法老）
    heti_alialate: { birth: -405, death: -322, kaoju: '异说' },  // 阿里阿拉特（哈图沙·卡帕多细亚国王阿里阿拉特一世）
    aiji_neiketaneibu: { birth: -420, death: -360, kaoju: '推定' },  // 内克塔内布（孟菲斯·埃及第三十王朝开国法老内克塔内布一世）
    shang_weiwuji: { birth: -300, death: -243, kaoju: '推定' },  // 魏无忌（安阳·战国信陵君，安阳夺晋鄙军救赵破秦）
    yamaxun_faernake: { birth: -215, death: -155, kaoju: '推定' },  // 法尔纳克（忒弥斯基拉·本都国王法尔纳克一世）
    teluoyi_maniya: { birth: -440, death: -399, kaoju: '推定' },  // 马尼亚（特洛伊·达达诺斯女副总督，镇守伊利昂）
    ailan_julushi: { birth: -600, death: -530, kaoju: '异说' },  // 居鲁士二世（苏萨·波斯帝国创立者，定都苏萨）
    zhou_jifu: { birth: -852, death: -775, kaoju: '推定' },  // 吉甫（岐山·西周太师尹吉甫，前823年自岐周统六师北伐猃狁）
    yin_yuejin: { birth: 159, death: 218, kaoju: '推定' },  // 乐进（朝歌·建安十年攻克朝歌斩严敬）
    xibolai_majiabi: { birth: -190, death: -160, kaoju: '推定' },  // 犹大马加比（耶路撒冷·马加比起义领袖收复耶路撒冷）
    gen_caffa_consul: { birth: 1425, death: 1475, kaoju: '推定' },  // 奥贝托·斯夸尔（卡法·热那亚末任卡法执政官，1475年卡法围城战殉城）
    baolusi: { birth: -254, death: -216, kaoju: '推定' },  // 保卢斯（坎尼战役罗马执政官卢基乌斯·埃米利乌斯·保卢斯，前216年阵亡）
    waluo: { birth: -256, death: -195, kaoju: '推定' },  // 瓦罗（坎尼战役罗马执政官盖乌斯·特伦提乌斯·瓦罗）
    seleisi_shouling: { birth: -365, death: -300, kaoju: '推定' },  // 塞乌特斯（海姆斯山战役色雷斯奥德里西亚国王塞乌特斯三世）
    aitiliusi: { birth: 391, death: 454, kaoju: '异说' },  // 埃提乌斯（沙隆战役西罗马名将弗拉维乌斯·埃提乌斯）
};

/** 生年（未收录返回 null） */
export function getGeneralBirthYear(generalId: string | null | undefined): number | null {
    return generalId ? GENERAL_LIFE_YEARS[generalId]?.birth ?? null : null;
}

/** 卒年（未收录返回 null） */
export function getGeneralDeathYear(generalId: string | null | undefined): number | null {
    return generalId ? GENERAL_LIFE_YEARS[generalId]?.death ?? null : null;
}

/**
 * 由生年/卒年推登场年（**全项目唯一算法**，别处不许再写 `birth + 20`）：
 *   · 默认 = 生年 + 20（20 岁登场）；
 *   · **跳过不存在的公元 0 年**：生年恰为 -20 时，前 20 年 + 20 落在 0 年 → 顺延到公元 1 年；
 *   · 生年 + 20 晚于卒年（20 岁前卒）→ 以**卒年兜底**，保证至少有一年可登场。
 */
export function debutYearOf(birth: number, death: number): number {
    let y = birth + 20;
    if (birth < 0 && y >= 0) y += 1;   // 无 0 年：0 → 公元 1 年
    return Math.min(y, death);
}

/**
 * 由生年推百年模式消失年（🔴 [2026-10-18 主人定] 百年模式：登场百年 / 生年 + 120 消失，跳过不存在的公元 0 年）。
 */
export function centenarianYearOf(birth: number): number {
    let y = birth + 120;
    if (birth < 0 && y >= 0) y += 1;   // 无 0 年：0 → 公元 1 年
    return y;
}

/** 登场年（未收录返回 null）；条目里写了 `debut` 的例外以 `debut` 为准 */
export function getGeneralDebutYear(generalId: string | null | undefined): number | null {
    const y = generalId ? GENERAL_LIFE_YEARS[generalId] : undefined;
    if (!y) return null;
    return y.debut ?? debutYearOf(y.birth, y.death);
}
