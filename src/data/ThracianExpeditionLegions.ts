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

    // ── T3 风土之兵 ──
    seleisi: { name: '保加利亚骑', tier: 3 },          // 普罗夫迪夫·色雷斯
    aodesuosi: { name: '奥德水军', tier: 4 },
    odrysian_late: { name: '色雷斯骑', tier: 3 },
    // 🔴 [2026-09-25 主人批准新建佩利昂] 达萨雷提·克莱图斯：伊利里亚轻装山地步兵，文化知名、独具一格 → T3 风土之兵
    //    （英文维基 Siege of Pelium：伊利里亚人据山口高地与马其顿对峙；Illyrians 条目：以轻装步兵与山地战著称）
    dasaleiti: { name: '伊利里亚兵', tier: 3 },
};
