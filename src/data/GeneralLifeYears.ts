/**
 * 武将生卒年表（generalId → { 生年 birth, 卒年 death }）。
 * 登场年 = 生年 + 20（20 岁登场），由 `getGeneralDebutYear` 推算，不重复存。
 *
 * 🔴 [2026-10-15 主人定] 每位武将记录三项年份：生年、卒年、登场年（= 生年 + 20）。
 *
 * ── 标注口径（改这张表前必读，口径不一致数据就废了）──
 *  · 公元后用**正数**：公元 155 年 = 155；公元前用**负数**：前 356 年 = -356。没有 0 年。
 *  · **只收生年/卒年有确切史料（正史/权威出处）的武将**；查不到确切值的一律**不收录**，
 *    列给主人去查，绝不瞎填、绝不估算。
 *  · 生卒年有争议的，取**正史通行值**，直接写数、**不写「约」字**（主人定）。
 *  · 与 GENERAL_CENTURIES（成名世纪）口径区分：本表是**生年/卒年**，不是成名年。
 *
 * 校验：—
 */

export interface GeneralLifeYears {
    /** 生年（公元年正数、公元前负数） */
    birth: number;
    /** 卒年（公元年正数、公元前负数） */
    death: number;
}

/** generalId → 生卒年。键顺序：按生年从古到今。 */
export const GENERAL_LIFE_YEARS: Record<string, GeneralLifeYears> = {
    // ── 上古/神话：主人定的主流学术断代定值（2026-10-15）──
    sumeier_zhajixi: { birth: -2359, death: -2335 },      // 扎吉西（卢加尔扎克西）
    wuer_wuernamu: { birth: -2142, death: -2095 },         // 乌尔纳姆
    guyashu_shamushi: { birth: -1845, death: -1776 },      // 沙姆希阿达（沙姆希阿达德一世）
    xikesuosi_salidi: { birth: -1670, death: -1630 },      // 萨利蒂（萨利蒂斯）
    dibisi_tutemosi: { birth: -1486, death: -1425 },       // 图特摩斯三世
    heti_muwatali: { birth: -1320, death: -1272 },         // 穆瓦塔利二世
    aiji_lameisisi: { birth: -1303, death: -1213 },        // 拉美西斯二世
    shang_fuhao: { birth: -1245, death: -1192 },           // 妇好
    yamaxun_xibolvte: { birth: -1230, death: -1190 },      // 希波吕忒
    teluoyi_heketuoer: { birth: -1215, death: -1184 },     // 赫克托耳
    ailan_shuteluke: { birth: -1205, death: -1155 },       // 舒特鲁克·纳克杭特
    zhou_jifa: { birth: -1087, death: -1043 },             // 姬发（周武王）
    yin_dixin: { birth: -1085, death: -1046 },             // 子受（商纣）
    xibolai_dawei: { birth: -1040, death: -970 },          // 大卫王
    wulaertu_guo_saerdu: { birth: -865, death: -828 },     // 萨尔杜里一世
    shen_shenbo: { birth: -860, death: -790 },             // 申伯
    // ── 名将：生卒年有正史/权威出处 ──
    aqimeinide_daliushi: { birth: -550, death: -486 },     // 大流士一世
    tuolemi_tuolemi: { birth: -367, death: -282 },         // 托勒密一世
    gen_alexander_great: { birth: -356, death: -323 },   // 亚历山大
    beileinisi_tuolemiershi: { birth: -309, death: -246 }, // 托勒密二世
    guide_d_xiaohe: { birth: -257, death: -193 },          // 萧何
    han_d_liubang: { birth: -256, death: -195 },           // 刘邦
    gen_hannibal: { birth: -247, death: -183 },           // 汉尼拔
    yangshao_zhoubo: { birth: -240, death: -169 },         // 周勃
    xiongnu_maodun: { birth: -234, death: -174 },          // 冒顿单于
    xichu_xiangyu: { birth: -232, death: -202 },           // 项羽
    xianyu_hanxin: { birth: -231, death: -196 },           // 韩信
    huaiyang_zhouyafu: { birth: -199, death: -143 },       // 周亚夫
    li_lx_d_liguang: { birth: -184, death: -119 },         // 李广
    shuofang_weiqing: { birth: -154, death: -106 },        // 卫青
    suzhou_huoqubing: { birth: -140, death: -117 },        // 霍去病
    lanzhou_zhaochongguo: { birth: -137, death: -52 },     // 赵充国
    qiliqiya_pangpei: { birth: -106, death: -48 },         // 庞培
    gen_julius_caesar: { birth: -100, death: -44 },        // 恺撒
    quli_chentang: { birth: -75, death: -6 },              // 陈汤
    dixiang_wangmang: { birth: -45, death: 23 },           // 王莽
    li_s_mayuan: { birth: -14, death: 49 },                // 马援
    lulin_liuxiu: { birth: -5, death: 57 },                // 刘秀
    xiayang_d_dengyu: { birth: 2, death: 58 },             // 邓禹
    you_gengyan: { birth: 3, death: 58 },                  // 耿弇
    xiyuduhu_banchao: { birth: 32, death: 102 },           // 班超
    chagatai_genggong: { birth: 35, death: 90 },           // 耿恭
    jiluo_d_douxian: { birth: 50, death: 92 },             // 窦宪
    woye_huangfugui: { birth: 104, death: 174 },           // 皇甫规
    jingzhou_gs_huangfusong: { birth: 135, death: 195 },   // 皇甫嵩
    cao_d_caocao: { birth: 155, death: 220 },              // 曹操
    ruzhou_sunjian: { birth: 155, death: 191 },            // 孙坚
    chu_guanyu: { birth: 160, death: 220 },                // 关羽
    shu_liubei: { birth: 161, death: 223 },                // 刘备
    langzhou_zhangfei: { birth: 165, death: 221 },         // 张飞
    tongma_taishici: { birth: 166, death: 206 },           // 太史慈
    caoren: { birth: 168, death: 223 },                    // 曹仁
    jingmen_zhaoyun: { birth: 168, death: 229 },           // 赵云
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
    ranwei_d_ranmin: { birth: 322, death: 352 },           // 冉闵
    murong_murongke: { birth: 323, death: 367 },           // 慕容恪
    fushi_wangmeng: { birth: 325, death: 375 },            // 王猛
    dingzhou_d_murongchui: { birth: 326, death: 396 },     // 慕容垂
    beidi_yaochang: { birth: 330, death: 393 },            // 姚苌
    gen_julian_apostate: { birth: 331, death: 363 },       // 尤里安
    zhong_xiexuan: { birth: 343, death: 388 },             // 谢玄
    wang_d_liuyu: { birth: 363, death: 422 },              // 刘裕
    tuoba_tuobagui: { birth: 371, death: 409 },            // 拓跋珪
    helian_helianbobo: { birth: 381, death: 425 },         // 赫连勃勃
    xiongren_atila: { birth: 406, death: 453 },            // 阿提拉
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
    song2_houjunji: { birth: 590, death: 643 },            // 侯君集
    weihaiwei_sudingfang: { birth: 592, death: 667 },      // 苏定方
    bing_liji: { birth: 594, death: 669 },                 // 李勣
    xinluo_jinyuxin: { birth: 595, death: 673 },           // 金庾信
    tang_lishimin: { birth: 598, death: 649 },             // 李世民
    xuantu_yuangaisuwen: { birth: 603, death: 666 },       // 渊盖苏文
    loufan_xuerengui: { birth: 614, death: 683 },          // 薛仁贵
    tubo_songzanganbu: { birth: 617, death: 650 },         // 松赞干布
    juandu_peixingjian: { birth: 619, death: 682 },        // 裴行俭
    heyuan_d_heichichangzhi: { birth: 630, death: 689 },   // 黑齿常之
    gar_lunqinling: { birth: 635, death: 699 },            // 论钦陵
    bohai_dazuorong: { birth: 645, death: 719 },           // 大祚荣
    gen_charles_martel: { birth: 688, death: 741 },        // 查理马特
    lingwu_guoziyi: { birth: 697, death: 781 },            // 郭子仪
    hepan_gaoxianzhi: { birth: 702, death: 755 },          // 高仙芝
    zhuozhou_anlushan: { birth: 703, death: 757 },         // 安禄山
    gaoliang_geshuhan: { birth: 704, death: 757 },         // 哥舒翰
    shanzhou_wangzhongsi: { birth: 705, death: 749 },      // 王忠嗣
    liwang_liguangbi: { birth: 708, death: 764 },          // 李光弼
    liang_d_zhangxun: { birth: 709, death: 757 },          // 张巡
    pingyuan_yanzhenqing: { birth: 709, death: 784 },      // 颜真卿
    qianzhou_lisheng: { birth: 727, death: 793 },          // 李晟
    yangtong_chisongdezan: { birth: 742, death: 797 },     // 赤松德赞
    gen_charlemagne: { birth: 748, death: 814 },           // 查理曼
    zizhou_wangjian: { birth: 847, death: 918 },           // 王建
    gen_alfred_great: { birth: 849, death: 899 },          // 阿尔弗雷德大帝
    dang_d_zhuwen: { birth: 852, death: 912 },             // 朱温
    wuyue_qianliu: { birth: 852, death: 932 },             // 钱镠
    shatuo_likeyong: { birth: 856, death: 908 },           // 李克用
    liao_d_yelvabaoji: { birth: 872, death: 926 },         // 耶律阿保机
    yingzhou_d2_licunxu: { birth: 885, death: 926 },       // 李存勖
    li_bian: { birth: 888, death: 943 },                   // 李昪
    dai_d_shijingtang: { birth: 892, death: 942 },         // 石敬瑭
    tongzhou_liuzhiyuan: { birth: 895, death: 948 },       // 刘知远
    gen_otto_great: { birth: 912, death: 973 },            // 奥托一世
    chanzhou_chairong: { birth: 921, death: 959 },         // 柴荣
    song_zhaokuangyin: { birth: 927, death: 976 },         // 赵匡胤
    heng1_yangye: { birth: 932, death: 986 },              // 杨业
    shule_aersilan: { birth: 940, death: 998 },            // 阿尔斯兰（阿里·阿尔斯兰汗）
    goryeo_jianghanzan: { birth: 948, death: 1031 },       // 姜邯赞
    gen_basil_ii: { birth: 958, death: 1025 },             // 巴西尔二世
    dangxiang_liyuanhao: { birth: 1003, death: 1048 },     // 李元昊
    zhai_han_diqing: { birth: 1008, death: 1057 },         // 狄青
    gen_alfonso_vi: { birth: 1040, death: 1109 },          // 阿方索六世
    gen_el_cid: { birth: 1043, death: 1099 },              // 熙德
    dajin_wanyanaguda: { birth: 1068, death: 1123 },       // 完颜阿骨打
    mohe_wanyanzonghan: { birth: 1080, death: 1137 },      // 完颜宗翰
    xiliao_yelvdashi: { birth: 1087, death: 1143 },        // 耶律大石
    sizhou_hanshizhong: { birth: 1089, death: 1151 },      // 韩世忠
    fengzhou_wujie: { birth: 1093, death: 1139 },          // 吴玠
    yingzhou_d_liuqi: { birth: 1098, death: 1162 },        // 刘锜
    jurchen_wanyanzongbi: { birth: 1098, death: 1148 },    // 完颜宗弼（金兀术）
    yanchuan_d_yuefei: { birth: 1103, death: 1142 },       // 岳飞
    gen_afonso_henriques: { birth: 1109, death: 1185 },    // 阿方索一世
    ayoubu_salaheding: { birth: 1138, death: 1193 },       // 萨拉丁
    changshaguo_xinqiji: { birth: 1140, death: 1207 },     // 辛弃疾
    gen_minamoto_yoritomo: { birth: 1147, death: 1199 },   // 源赖朝
    fujiwara_yuanyijing: { birth: 1159, death: 1189 },     // 源义经
    zhadalan_zhamuhe: { birth: 1161, death: 1205 },        // 札木合
    menggu_d_chengjisihan: { birth: 1162, death: 1227 },   // 成吉思汗（生年取通行 1162）
    houliao_yelvliuge: { birth: 1165, death: 1220 },       // 耶律留哥
    jalair_muhuali: { birth: 1170, death: 1223 },          // 木华黎
    dongxia_puxianwannu: { birth: 1170, death: 1233 },     // 蒲鲜万奴
    gen_alfonso_ix: { birth: 1171, death: 1230 },          // 阿方索九世
    wuliangha_subutai: { birth: 1176, death: 1248 },       // 速不台
    gen_kuchlug: { birth: 1180, death: 1218 },             // 屈出律
    borjigin_tuolei: { birth: 1191, death: 1232 },         // 拖雷
    gen_frederic_ii: { birth: 1194, death: 1250 },         // 腓特烈二世（神圣罗马）
    zaoyang_d_menggong: { birth: 1195, death: 1246 },      // 孟珙
    gen_fernando_iii: { birth: 1201, death: 1252 },        // 费尔南多三世
    gen_batu: { birth: 1207, death: 1256 },                // 拔都
    yuan_d_hubilie: { birth: 1215, death: 1294 },          // 忽必烈
    asaibaijiang_xuliewu: { birth: 1218, death: 1265 },    // 旭烈兀
    gen_alexander_nef: { birth: 1221, death: 1263 },       // 涅夫斯基
    mamuluke_baibaisi: { birth: 1223, death: 1277 },       // 拜巴尔斯
    khon_basiba: { birth: 1235, death: 1280 },             // 八思巴
    merkit_boyan: { birth: 1236, death: 1295 },            // 伯颜
    shenshi_wentianxiang: { birth: 1236, death: 1283 },    // 文天祥
    gen_qutlugh: { birth: 1260, death: 1306 },             // 忽都鲁（海都之女忽秃伦）
    yamato_nanmuzhengcheng: { birth: 1294, death: 1336 },  // 楠木正成
    ashikaga_zulizunshi: { birth: 1305, death: 1358 },     // 足利尊氏
    zhangshicheng_zhangshicheng: { birth: 1321, death: 1367 }, // 张士诚
    huai_zhuyuanzhang: { birth: 1328, death: 1398 },       // 朱元璋
    da_yuan_kuokuotiemuer: { birth: 1330, death: 1375 },   // 扩廓帖木儿（王保保）
    chizhou_changyuchun: { birth: 1330, death: 1369 },     // 常遇春
    gen_black_prince: { birth: 1330, death: 1376 },        // 黑太子
    xuan_xuda: { birth: 1332, death: 1385 },               // 徐达
    joseon_lichenggui: { birth: 1335, death: 1408 },       // 李成桂
    zhaowu_timuermieli: { birth: 1335, death: 1378 },      // 帖木儿灭里
    tiemuer_tiemuer: { birth: 1336, death: 1405 },         // 帖木儿
    pingnan_muying: { birth: 1345, death: 1392 },          // 沐英
    ganden_zongkaba: { birth: 1357, death: 1419 },         // 宗喀巴
    ming_d_zhudi: { birth: 1360, death: 1424 },            // 朱棣
    jinan_tiexuan: { birth: 1366, death: 1402 },           // 铁铉
    gen_frederick_i_nuremberg: { birth: 1371, death: 1440 }, // 腓特烈一世（勃兰登堡选侯）
    gen_henry_v: { birth: 1386, death: 1422 },             // 亨利五世
    yi_yuqian: { birth: 1398, death: 1457 },               // 于谦
    gen_charles_vii: { birth: 1403, death: 1461 },         // 查理七世
    gen_joanofarc: { birth: 1412, death: 1431 },           // 圣女贞德（生年取传统 1412）
    osman_mehmed_ii: { birth: 1432, death: 1481 },         // 穆罕默德二世
    an_xibanni: { birth: 1451, death: 1510 },              // 昔班尼
    dayu_wangshouren: { birth: 1472, death: 1529 },        // 王守仁
    babuer_babuer: { birth: 1483, death: 1530 },           // 巴布尔
    aki_maoliyuanjiu: { birth: 1497, death: 1571 },        // 毛利元就
    otomo_d_lihuadaoxue: { birth: 1513, death: 1585 },     // 立花道雪
    sagami_beitiaoshikang: { birth: 1515, death: 1571 },   // 北条氏康
    hantawadi_mangyinglong: { birth: 1516, death: 1581 },  // 莽应龙
    jinchuan_jinchuanyiyuan: { birth: 1519, death: 1560 }, // 今川义元
    kai_wutianxinxuan: { birth: 1521, death: 1573 },       // 武田信玄
    qi_d_qijiguang: { birth: 1528, death: 1588 },          // 戚继光
    echigo_shangshanqianxin: { birth: 1530, death: 1578 }, // 上杉谦信
    owari_zhitianxinchang: { birth: 1534, death: 1582 },   // 织田信长
    hashiba_fengchenxiuji: { birth: 1537, death: 1598 },   // 丰臣秀吉
    mowoer_akeba: { birth: 1542, death: 1605 },            // 阿克巴
    edo_dechuanjiakang: { birth: 1543, death: 1616 },      // 德川家康
    sambyeol_lishunchen: { birth: 1545, death: 1598 },     // 李舜臣
    satsuma_daojinjiajiu: { birth: 1547, death: 1587 },    // 岛津家久
    siam_nalixuan: { birth: 1555, death: 1605 },           // 纳黎萱
    manzhou_nuerhachi: { birth: 1559, death: 1626 },       // 努尔哈赤
    date_d_yidazhengzong: { birth: 1567, death: 1636 },    // 伊达政宗
    sanada_d_zhentianxingcun: { birth: 1567, death: 1615 },// 真田幸村
    zu_d_yuanchonghuan: { birth: 1584, death: 1630 },      // 袁崇焕
    aisin_d_huangtaiji: { birth: 1592, death: 1643 },      // 皇太极
    manzhou_d_duoergun: { birth: 1612, death: 1650 },      // 多尔衮
    oirat_ming_gaerdan: { birth: 1644, death: 1697 },      // 噶尔丹
    tuerhute_wobaxi: { birth: 1742, death: 1775 },         // 渥巴锡
};

/** 生年（未收录返回 null） */
export function getGeneralBirthYear(generalId: string | null | undefined): number | null {
    return generalId ? GENERAL_LIFE_YEARS[generalId]?.birth ?? null : null;
}

/** 卒年（未收录返回 null） */
export function getGeneralDeathYear(generalId: string | null | undefined): number | null {
    return generalId ? GENERAL_LIFE_YEARS[generalId]?.death ?? null : null;
}

/** 登场年 = 生年 + 20（20 岁登场；未收录返回 null） */
export function getGeneralDebutYear(generalId: string | null | undefined): number | null {
    const y = generalId ? GENERAL_LIFE_YEARS[generalId] : undefined;
    return y ? y.birth + 20 : null;
}
