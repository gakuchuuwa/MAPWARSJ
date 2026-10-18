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
    jinzhang: { name: '金帐怯薛', tier: 2 },        // 萨莱·金帐：金帐汗国怯薛
    kesa: { name: '可萨汗卫', tier: 2 },            // 打耳班·可萨：可萨汗国卫队

    // ── T3 风土之兵 ──
    baojiaer: { name: '保加尔重骑', tier: 3 },      // 喀山·保加尔：伏尔加保加尔
    yidier: { name: '伊蒂尔卫', tier: 3 },          // 伊蒂尔·伊蒂尔汗国（可萨都城）
    salai: { name: '诺盖骑', tier: 3 },             // 萨莱楚克·诺盖：诺盖汗国骑
    bashekeer: { name: '边地步营', tier: 4 },         // 乌法·俄国边地步营
    mangshi: { name: '土库曼骑', tier: 3 },         // 曼格什拉克·土库曼
    kumanni: { name: '库曼弓骑', tier: 3 },         // 密尔科夫·库曼尼亚：库曼骑射弓手，1223卡尔卡河会战联军

    // ── T4 存在之兵 ──
    fuerjia: { name: '俄国边骑', tier: 4 },         // 察里津·俄国边地巡骑
    nuogai: { name: '俄国射手', tier: 3 },          // 萨马拉·俄国射击军
    xiemian: { name: '萨维尔军', tier: 4 },         // 谢缅杰尔·萨维尔
};
