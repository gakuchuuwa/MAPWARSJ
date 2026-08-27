/**
 * 波斯文化区远征精锐军团名（PERSIAN / RegionSystem，2026-08-27 拆中亚新增）
 *
 * 覆盖范围：伊朗高原 + 呼罗珊/阿富汗（阿契美尼德/萨珊/安息/萨法维/塞尔柱/伊利汗国等）
 *
 * 收录红线：
 * - 番号 3–5 字，全局不重复；同势力只挂一个番号
 * - tier 依 AGENTS.md §12.3.1「精锐 tier 判定标准 v3」，从 T0 向下试，命中最高一级即定
 * - 武将/精锐/据点三契：守将/贡献/镇守/当官/执行任务；非出生地无贡献
 * - 冷兵器、17 世纪以前
 */
import type { EliteLegionConfig } from './ExpeditionLegions';

export const PERSIAN_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, EliteLegionConfig>> = {

    // ── T2 特色之兵 ──
    aqimeinide: { name: '不死军', tier: 2 },        // 波斯波利斯·阿契美尼德：居鲁士/大流士万人卫队（DE 长生军）
    sashan: { name: '萨瓦兰铁骑', tier: 2 },        // 菲鲁扎巴德·萨珊：铁甲重骑兵（波斯铁甲圣骑）
    safawei_d: { name: '红头军', tier: 2 },         // 伊斯法罕·萨法维：土库曼精锐骑兵（奇兹尔巴什）
    ansxi: { name: '帕提亚铁骑', tier: 2 },         // 尼萨·安息：铁甲重骑兵
    seljuq: { name: '塞尔柱近卫', tier: 2 },        // 木鹿·塞尔柱：突厥近卫
    yilihanguo_d: { name: '伊利汗卫', tier: 2 },    // 大不里士·伊利汗国：蒙古怯薛

    // ── T3 风土之兵 ──
    midi: { name: '米底骑射', tier: 3 },            // 哈马丹·米底：米底骑兵
    muer: { name: '呼罗珊重骑', tier: 3 },          // 马尔夫鲁德·呼罗珊：大呼罗珊重骑
    huluo: { name: '古尔重骑', tier: 3 },           // 菲鲁兹库赫·古尔：古尔王朝重骑
    jiazini: { name: '伽色尼亲兵', tier: 3 },       // 哥疾宁·伽色尼：突厥奴隶兵（马穆鲁克）
    safawei: { name: '吉兰义军', tier: 3 },         // 加兹温·吉兰：里海南岸萨法维起源地
    yilihanguo: { name: '阿杰姆卫队', tier: 3 },    // 赞詹·阿杰姆
    ribale: { name: '雷伊卫军', tier: 3 },          // 雷伊·日巴勒
    asaibaijiang: { name: '阿塞轻骑', tier: 3 },    // 马拉盖·阿塞拜疆
    saerbadaer: { name: '萨尔巴达尔', tier: 3 },    // 白哈格·萨尔巴达尔：波斯起义民兵

    // ── T4 存在之兵 ──
    ailan: { name: '埃兰战车', tier: 3 },           // 苏萨·埃兰：古国战车
    aba: { name: '萨珊重装骑', tier: 1 },           // 尼沙布尔·阿巴尔
    kalan: { name: '卡伦军', tier: 4 },             // 图斯·卡伦
    kumisi: { name: '库米斯军', tier: 4 },          // 达姆甘·库米斯
    dulan_d: { name: '普什图骑兵', tier: 1 },       // 坎大哈·杜兰尼
    babuer: { name: '阿富汗游骑', tier: 3 },        // 喀布尔·阿富汗
    fanyanna: { name: '梵衍那军', tier: 4 },        // 巴米扬·梵衍那
    xisi: { name: '萨法尔圣兵', tier: 2 },          // 博斯特·锡斯坦
    delan: { name: '苏伦具装骑', tier: 1 },         // 法拉·德兰吉亚
    guzgan: { name: '古兹根军', tier: 4 },          // 法里亚布·古兹根
    baha: { name: '巴哈尔兹军', tier: 4 },          // 泰巴德·巴哈尔兹
    hali: { name: '萨洛尔军', tier: 4 },            // 萨拉赫斯·萨洛尔
    yisatisi: { name: '亚兹德圣火卫', tier: 4 },
};