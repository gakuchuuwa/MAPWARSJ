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
    mangshi: { name: '土库曼骑', tier: 3 },         // 曼格什拉克·土库曼
    kuman_oleshky: { name: '库曼弓骑', tier: 1 },   // 奥列什基·忽炭汗：库曼弓骑
    xikuman: { name: '库曼旧部', tier: 3 },         // 保留：库曼旧部记录，不删
    qincha: { name: '钦察骑射', tier: 2 },          // 保留：钦察旧记录，不删（巴奇曼旧部）

    // ── T4 存在之兵 ──
    xiemian: { name: '萨维尔军', tier: 4 },         // 谢缅杰尔·萨维尔
    cimmerian: { name: '辛梅里弓骑', tier: 4 },   // 辛梅里孔·辛梅里安王 图格达梅：辛梅里孔·图格达梅：辛梅里安的骑射游牧骑兵，前七世纪入侵小亚
};
