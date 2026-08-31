/**
 * 库曼文化区远征精锐军团名（CUMAN / RegionSystem，2026-08-27 拆草原新增）
 *
 * 覆盖范围：伏尔加-乌拉尔草原突厥系（库曼/钦察、可萨、保加尔、金帐鞑靼、诺盖、巴什基尔）
 *
 * 收录红线：
 * - 番号 3–5 字，全局不重复；同势力只挂一个番号
 * - tier 依 AGENTS.md §12.3.1「精锐 tier 判定标准 v3」，从 T0 向下试，命中最高一级即定
 * - 武将/精锐/据点三契：守将/贡献/镇守/当官/执行任务；非出生地无贡献
 * - 冷兵器、17 世纪以前
 */
import type { EliteLegionConfig } from './ExpeditionLegions';

export const CUMAN_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, EliteLegionConfig>> = {

    // ── T2 特色之兵 ──
    qincha: { name: '钦察骑射', tier: 2 },          // 萨拉托夫·钦察：库曼弓骑（DE 钦察特色）
    jinzhang: { name: '金帐怯薛', tier: 2 },        // 萨莱·金帐：金帐汗国怯薛
    kesa: { name: '可萨汗卫', tier: 2 },            // 打耳班·可萨：可萨汗国卫队

    // ── T3 风土之兵 ──
    baojiaer: { name: '保加尔重骑', tier: 3 },      // 喀山·保加尔：伏尔加保加尔
    yidier: { name: '伊蒂尔卫', tier: 3 },          // 伊蒂尔·伊蒂尔汗国（可萨都城）
    salai: { name: '诺盖骑', tier: 3 },             // 萨莱楚克·诺盖：诺盖汗国骑
    bashekeer: { name: '巴什基尔骑', tier: 3 },     // 乌法·巴什基尔
    mangshi: { name: '土库曼骑', tier: 3 },         // 曼格什拉克·土库曼

    // ── T4 存在之兵 ──
    fuerjia: { name: '伏尔加军', tier: 4 },         // 察里津·伏尔加
    nuogai: { name: '萨马拉军', tier: 4 },          // 萨马拉·萨马拉河
    xiemian: { name: '萨维尔军', tier: 4 },         // 谢缅杰尔·萨维尔
};
