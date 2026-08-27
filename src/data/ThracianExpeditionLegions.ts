/**
 * 色雷斯文化区远征精锐军团名（THRACIAN / RegionSystem，2026-08-27 拆拉丁/斯拉夫新增）
 *
 * 覆盖范围：色雷斯（保加利亚/色雷斯）
 *
 * 收录红线：
 * - 番号 3–5 字，全局不重复；同势力只挂一个番号
 * - tier 依 AGENTS.md §12.3.1「精锐 tier 判定标准 v3」，从 T0 向下试，命中最高一级即定
 * - 武将/精锐/据点三契：守将/贡献/镇守/当官/执行任务；非出生地无贡献
 * - 冷兵器、17 世纪以前
 */
import type { EliteLegionConfig } from './ExpeditionLegions';

export const THRACIAN_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, EliteLegionConfig>> = {

    // ── T2 特色之兵 ──
    baojialiya: { name: '查雷维茨卫', tier: 2 },          // 特尔诺沃·阿森一世：查雷维茨要塞沙皇禁卫
    saierdika: { name: '普利斯卡军', tier: 2 },          // 索非亚·克鲁姆：811 普利斯卡歼灭拜占庭军

    // ── T3 风土之兵 ──
    seleisi: { name: '保加利亚骑', tier: 3 },          // 普罗夫迪夫·色雷斯
    aodesuosi: { name: '奥德索斯水军', tier: 4 },
};