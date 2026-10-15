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
    gen_alexander_great: { birth: -356, death: -323 },   // 亚历山大
    guide_d_xiaohe: { birth: -257, death: -193 },          // 萧何
    han_d_liubang: { birth: -256, death: -195 },           // 刘邦
    gen_hannibal: { birth: -247, death: -183 },           // 汉尼拔
    yangshao_zhoubo: { birth: -240, death: -169 },         // 周勃
    xichu_xiangyu: { birth: -232, death: -202 },           // 项羽
    xianyu_hanxin: { birth: -231, death: -196 },           // 韩信
    huaiyang_zhouyafu: { birth: -199, death: -143 },       // 周亚夫
    li_lx_d_liguang: { birth: -184, death: -119 },         // 李广
    shuofang_weiqing: { birth: -154, death: -106 },        // 卫青
    suzhou_huoqubing: { birth: -140, death: -117 },        // 霍去病
    lanzhou_zhaochongguo: { birth: -137, death: -52 },     // 赵充国
    gen_julius_caesar: { birth: -100, death: -44 },        // 恺撒
    li_s_mayuan: { birth: -14, death: 49 },                // 马援
    xiayang_d_dengyu: { birth: 2, death: 58 },             // 邓禹
    you_gengyan: { birth: 3, death: 58 },                  // 耿弇
    xiyuduhu_banchao: { birth: 32, death: 102 },           // 班超
    chagatai_genggong: { birth: 35, death: 90 },           // 耿恭
    jiluo_d_douxian: { birth: 50, death: 92 },             // 窦宪
    woye_huangfugui: { birth: 104, death: 174 },           // 皇甫规
    jingzhou_gs_huangfusong: { birth: 135, death: 195 },   // 皇甫嵩
    cao_d_caocao: { birth: 155, death: 220 },              // 曹操
    chu_guanyu: { birth: 160, death: 220 },                // 关羽
    shu_liubei: { birth: 161, death: 223 },                // 刘备
    langzhou_zhangfei: { birth: 165, death: 221 },         // 张飞
    caoren: { birth: 168, death: 223 },                    // 曹仁
    jingmen_zhaoyun: { birth: 168, death: 229 },           // 赵云
    lu_zhangliao: { birth: 169, death: 222 },              // 张辽
    yue_d_lusu: { birth: 172, death: 217 },                // 鲁肃
    jiujiang_zhouyu: { birth: 175, death: 210 },           // 周瑜
    cangsong_machao: { birth: 176, death: 222 },           // 马超
    wuwu_d_lvmeng: { birth: 178, death: 220 },             // 吕蒙
    sima_d_simayi: { birth: 179, death: 251 },             // 司马懿
    huizhou_zhugeliang: { birth: 181, death: 234 },        // 诸葛亮
    sunwu_d_sunquan: { birth: 182, death: 252 },           // 孙权
    yidou_luxun: { birth: 183, death: 245 },               // 陆逊
    wudu_dengai: { birth: 197, death: 264 },               // 邓艾
    qingqiang_jiangwei: { birth: 202, death: 264 },        // 姜维
    dingxiang_d_lijing: { birth: 571, death: 649 },        // 李靖
    tang_lishimin: { birth: 598, death: 649 },             // 李世民
    yanchuan_d_yuefei: { birth: 1103, death: 1142 },       // 岳飞
    menggu_d_chengjisihan: { birth: 1162, death: 1227 },   // 成吉思汗（生年取通行 1162）
    gen_frederic_ii: { birth: 1194, death: 1250 },         // 腓特烈二世（神圣罗马）
    yuan_d_hubilie: { birth: 1215, death: 1294 },          // 忽必烈
    huai_zhuyuanzhang: { birth: 1328, death: 1398 },       // 朱元璋
    xuan_xuda: { birth: 1332, death: 1385 },               // 徐达
    gen_joanofarc: { birth: 1412, death: 1431 },           // 圣女贞德（生年取传统 1412）
    qi_d_qijiguang: { birth: 1528, death: 1588 },          // 戚继光
    manzhou_nuerhachi: { birth: 1559, death: 1626 },       // 努尔哈赤
    zu_d_yuanchonghuan: { birth: 1584, death: 1630 },      // 袁崇焕
    aisin_d_huangtaiji: { birth: 1592, death: 1643 },      // 皇太极
    manzhou_d_duoergun: { birth: 1612, death: 1650 },      // 多尔衮
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
