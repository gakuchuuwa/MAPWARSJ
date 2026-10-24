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
    sashan: { name: '萨瓦兰铁骑', tier: 2 },
    safawei_d: { name: '红头军', tier: 2 },         // 伊斯法罕·萨法维：土库曼精锐骑兵（奇兹尔巴什）
    ansxi: { name: '帕提亚铁骑', tier: 2 },         // 尼萨·安息：铁甲重骑兵
    seljuq: { name: '古拉姆', tier: 2 },        // 木鹿·塞尔柱：突厥近卫
    yilihanguo_d: { name: '伊利汗卫', tier: 2 },    // 大不里士·伊利汗国：蒙古怯薛

    // ── T3 风土之兵 ──
    // 🔴 [2026-10-20 主人令「什么规则呀，哪有这个规则，删除，每个武将都要给安置据点」]
    //    原「科塞亚」「乌克西亚」两个**无首府战役专用势力**已删；它们的精锐番号
    //    「科塞亚山兵」T4、「乌克西亚弓」T3 已改挂到守将条目（`FactionGenerals` 的 eliteName/eliteTier），
    //    战场生成优先用「武将自带精锐」，故这里的势力键一并删除。

    midi: { name: '米底骑射', tier: 3 },            // 哈马丹·米底：米底骑兵
    huluo: { name: '古尔重骑', tier: 1 },           // 菲鲁兹库赫·古尔：古尔王朝重骑（塔拉因战役征服北印度的战略主力）
    jiazini: { name: '伽色尼亲兵', tier: 3 },       // 哥疾宁·伽色尼：突厥奴隶兵（马穆鲁克）
    saerbadaer: { name: '萨尔巴达尔', tier: 3 },    // 白哈格·萨尔巴达尔：波斯起义民兵

    // ── T4 存在之兵 ──
    ailan: { name: '埃兰战车', tier: 3 },           // 苏萨·埃兰：古国战车
    dulan_d: { name: '普什图骑', tier: 1 },       // 坎大哈·杜兰尼
    fanyanna: { name: '梵衍那军', tier: 4 },        // 巴米扬·梵衍那
    xisi: { name: '萨法尔圣兵', tier: 2 },
    aqimeinide: { name: '长生军', tier: 2 },
};
