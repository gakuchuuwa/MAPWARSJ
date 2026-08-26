/**
 * 希腊文化区远征精锐军团名（GREEK / RegionSystem，2026-08-27 撤销并入拉丁，拆拉丁新增）
 *
 * 覆盖范围：希腊（古希腊城邦/大希腊）
 *
 * 收录红线：
 * - 番号 3–5 字，全局不重复；同势力只挂一个番号
 * - tier 依 AGENTS.md §12.3.1「精锐 tier 判定标准 v3」，从 T0 向下试，命中最高一级即定
 * - 武将/精锐/据点三契：守将/贡献/镇守/当官/执行任务；非出生地无贡献
 * - 冷兵器、17 世纪以前
 */
import type { EliteLegionConfig } from './ExpeditionLegions';

export const GREEK_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, EliteLegionConfig>> = {

    // ── T2 特色之兵 ──
    maqidun: { name: '伙伴骑兵', tier: 2 },          // 萨洛尼卡·亚历山大：Hetairoi 伙伴骑兵；避势力「马其顿」叠字
    xila: { name: '萨拉米斯舰', tier: 2 },          // 雅典·地米斯托克利：萨拉米斯海战；避据点「雅典」叠字
    yipilusi: { name: '摩罗西亚骑', tier: 2 },          // 安布拉基亚·皮洛士：伊庇鲁斯摩罗西亚战象铁骑
    lagoniya: { name: '斯巴达重装', tier: 2 },          // 斯巴达·列奥尼达：普拉提亚
    boootiya: { name: '底比斯圣队', tier: 2 },          // 底比斯·伊巴密浓达：留克特拉
    luodesi: { name: '医院骑士', tier: 2 },          // 罗得城·德米特里：1522 守岛
    moxina: { name: '诺曼骑士', tier: 2 },          // 梅西纳·罗杰一世：诺曼骑士征服西西里海峡

    // ── T3 风土之兵 ──
    kejila: { name: '西波塔舰', tier: 3 },          // 科孚·舒伦堡：前 433 西波塔海战；避势力「科基拉」叠字
    talanduo: { name: '塔兰丁骑', tier: 3 },            // 塔兰托·阿契塔
    kelite: { name: '克里特弓手', tier: 3 },          // 诺索斯·福卡斯：961 收复克里特；希腊世界最著名雇佣兵

    // ── T4 存在之兵 ──
    xilagu: { name: '希腊重步兵', tier: 4 },          // 锡拉库萨·阿加索克利
};
