/**
 * 武将登场年份表（generalId → 登场年份）。
 *
 * 🔴 [2026-10-15 主人定] 每位武将新增「登场年份」属性，口径 = **20 岁登场**：
 *   登场年份 = 出生年 + 20。
 *
 * ── 标注口径（改这张表前必读，口径不一致数据就废了）──
 *  · 公元后用**正数**：公元 121 年 = 121；公元前用**负数**：前 336 年 = -336。没有 0 年。
 *  · **出生年有确切史料的**：登场年份 = 出生年 + 20（精确值，行尾不注）。
 *  · **出生年不可考、只能估算的**：登场年份 ≈ 成名年 − 10
 *    （按「30 岁成名 → 20 岁登场」反推，即 成名年 减 10 年），行尾注明「估算」。
 *  · **存疑宁可留 0，不要猜**。0 表示「待标」。
 *  · 与 GENERAL_CENTURIES（成名世纪）口径区分：本表是**登场（20 岁）那一年**，
 *    不是成名那一年，两者天然差一截（约 10 年）。
 *
 * 校验：—
 */
export const GENERAL_DEBUT_YEARS: Record<string, number> = {
    // ══════ 按成名世纪从古到今，公元前为负数 ══════
    // —— 第一批：出生年有正史/权威出处，登场年份 = 出生年 + 20（精确值）——
    gen_alexander_great: -336,        // 亚历山大 前356年生
    gen_hannibal: -227,               // 汉尼拔 前247年生
    xichu_xiangyu: -212,              // 项羽 前232年生
    suzhou_huoqubing: -120,           // 霍去病 前140年生
    gen_julius_caesar: -80,           // 恺撒 前100年生
    cao_d_caocao: 175,                // 曹操 155年生
    sima_d_simayi: 199,               // 司马懿 179年生
    huizhou_zhugeliang: 201,          // 诸葛亮 181年生
    dingxiang_d_lijing: 591,          // 李靖 571年生
    tang_lishimin: 618,               // 李世民 598年生
    yanchuan_d_yuefei: 1123,          // 岳飞 1103年生
    gen_frederic_ii: 1214,            // 腓特烈二世（神圣罗马）1194年生
    yuan_d_hubilie: 1235,             // 忽必烈 1215年生
    huai_zhuyuanzhang: 1348,          // 朱元璋 1328年生
    xuan_xuda: 1352,                  // 徐达 1332年生
    qi_d_qijiguang: 1548,             // 戚继光 1528年生
    manzhou_nuerhachi: 1579,          // 努尔哈赤 1559年生
    zu_d_yuanchonghuan: 1604,         // 袁崇焕 1584年生
    aisin_d_huangtaiji: 1612,         // 皇太极 1592年生
    manzhou_d_duoergun: 1632,         // 多尔衮 1612年生
    // —— 出生年通行值带「约」，按约值 + 20 ——
    menggu_d_chengjisihan: 1182,      // 成吉思汗 约1162年生
    gen_joanofarc: 1432,              // 圣女贞德 约1412年生
};

/** 取武将登场年份；未标注 / 未收录返回 null（0 视为未标） */
export function getGeneralDebutYear(generalId: string | null | undefined): number | null {
    if (!generalId) return null;
    const y = GENERAL_DEBUT_YEARS[generalId];
    return y === undefined || y === 0 ? null : y;
}
