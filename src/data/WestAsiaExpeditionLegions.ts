/**
 * 西亚（WEST_ASIA）文化区远征精锐军团名（2026-07-29 新增第 15 区；2026-08-27 拆出阿拉伯后仅存安纳托利亚+两河 20 势力）
 *
 * 覆盖范围：安纳托利亚、两河流域（波斯核心区）
 *
 * 收录红线：
 * - 番号 3–5 字，全局不重复；同势力只挂一个番号
 * - tier 依 AGENTS.md §12.3.1「精锐 tier 判定标准 v3」，从 T0 向下试，命中最高一级即定
 */
import type { EliteLegionConfig } from './ExpeditionLegions';

export const WEST_ASIA_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, EliteLegionConfig>> = {
    // ── T1 功勋之兵：独立主力取得重大战略级胜利 + 建制延续性强 ──
    yashu: { name: '亚述战车', tier: 1 },          // 尼尼微·萨尔贡：新亚述战略主力，战车＋攻城工程重塑近东版图，建制延续数百年
    luomu: { name: '古拉姆军', tier: 1 },          // 伊科尼乌姆·基利杰：罗姆苏丹国建都于此的古拉姆常备军。基利杰·阿尔斯兰二世
    osman: { name: '苏丹亲兵', tier: 1 },          // 布尔萨·穆罕默德二世：奥斯曼禁卫军火枪手；1453 攻陷君士坦丁堡、1526 莫哈奇，T1 功勋

    // ── T2 特色之兵：特定战役有明确战术高光 ──
    heti: { name: '赫梯战车', tier: 2 },           // 哈图沙·穆瓦塔利：亲统三千战车卡迭石突袭埃及先头军团
    qiliqiya: { name: '行省辅军', tier: 2 },       // 阿达纳·庞培：前 67 年肃清奇里乞亚海盗、置行省，即其麾下行省军团
    teluoyi: { name: '特洛伊卫队', tier: 3 },
    alabo: { name: '海湾游骑', tier: 3 },          // 巴士拉·齐亚德：波斯湾阿拉伯骑兵
    jialedi: { name: '迦勒底战车', tier: 2 },      // 巴比伦·尼布甲尼撒：卡尔基米什之战（前 605）大破埃及军
    abasi: { name: '黑衣卫', tier: 2 },
    samaila: { name: '突厥卫队', tier: 3 },        // 萨迈拉·穆阿台绥姆：古拉姆突厥奴隶兵（阿莫里乌姆战役）
    bendou: { name: '阿克里泰', tier: 2 },         // 特拉布宗·阿历克塞：科穆宁边防军史载专名，长期抗突厥袭扰有实绩
    saipulusi: { name: '塞浦路斯骑', tier: 2 },        // 尼科西亚·居伊：塞浦路斯王国十字军重装铁骑
    bendou_d: { name: '本都铁骑', tier: 2 },       // 阿马西亚·密特里达梯：本都旧都，其骑兵泽拉之战击破罗马军

    // ── T3 风土之兵：文化知名度或兵种特色，无可考大捷 ──
    sumeier: { name: '苏美尔方阵', tier: 3 },      // 乌鲁克·扎吉西：乌尔军旗／鹰碑所载人类最早重装密集阵
    ldiya: { name: '吕底亚骑', tier: 3 },          // 斯法尔德·克罗伊斯：希罗多德称当时最强骑兵，铸币与其名同为符号
    aiaoniya: { name: '爱奥尼亚团', tier: 3 },
    jialatai: { name: '加拉太卫', tier: 3 },       // 安卡拉·德奥塔鲁斯：加拉太凯尔特雇佣兵在希腊化世界赫赫有名
    pajiama: { name: '帕加玛骑卫', tier: 3 },      // 佩尔加蒙·欧迈尼斯：帕加马以卫城与图书馆闻名，骑卫为常规建制
    guyashu: { name: '阿舒尔卫', tier: 3 },
    // 沙姆希阿达一世（前1809-1776）征服亚述城、建阿舒尔神庙；旧亚述战车未成建制，
    // 撤换原「亚述战车」以免与尼尼微新亚述（yashu·T1）番号重复

    // ── T4 存在之兵：史籍可考的常规建制／地方戍兵 ──
    bitiniya: { name: '比提尼卫', tier: 4 },       // 尼凯亚·狄奥多尔：尼凯亚位于比提尼亚故地，常规卫队
    fulijiya: { name: '弗里吉卫', tier: 4 },       // 戈尔迪乌姆·迈达斯：弗里吉亚常规卫队
    ribale: { name: '代尔木重步', tier: 2 },
    wuer: { name: '乌尔重步', tier: 3 },
    shengdian_qishi: { name: '圣殿骑士', tier: 2 },
    samtskhe: { name: '梅斯赫骑', tier: 4 },
};
