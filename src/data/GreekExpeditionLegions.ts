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
    xila: { name: '萨拉米斯舰', tier: 2 },          // 雅典·地米斯托克利：萨拉米斯海战；避据点「雅典」叠字
    yipilusi: { name: '摩罗西亚骑', tier: 2 },          // 安布拉基亚·皮洛士：伊庇鲁斯摩罗西亚战象铁骑
    lagoniya: { name: '斯巴达重装', tier: 2 },          // 斯巴达·列奥尼达：普拉提亚
    boootiya: { name: '底比斯圣队', tier: 2 },          // 底比斯·伊巴密浓达：留克特拉

    // ── T3 风土之兵 ──
    talanduo: { name: '塔兰丁骑', tier: 3 },            // 塔兰托·阿契塔
    kelite: { name: '干地亚血卫', tier: 1 },          // 干地亚·莫罗西尼：1669 威尼斯干地亚血战守军

    // ── T4 存在之兵 ──
    yilisi: { name: '埃利斯战车', tier: 4 },
    jileinaijia: { name: '昔兰尼骑兵', tier: 4 },

    // ── 2026-09 古典希腊 DE 英雄 ──
    // 🔴 [2026-09-19 主人令「都给我删了」] 卡帕多细亚（`kapaduoxiya`）与其番号「卡帕多骑队」已删除 ——
    //    它只服务前321「赫勒斯滂战役」，而那一仗已被主人令全删，势力成了没有任何战役在用的孤儿。,
    maqidun: { name: '伙伴骑兵', tier: 0 },
    pisa: { name: '皮萨僭主卫', tier: 4 },   // 皮萨提斯·皮萨王 潘塔琉斯：皮萨提斯·潘塔琉斯：皮萨僭主的卫队，与伊利斯争夺奥林匹亚
    antigonid: { name: '安提柯卫队', tier: 3 },   // 凯莱奈·安提柯一世：凯莱奈·安提柯：独眼安提柯的马其顿老兵与亚洲诸军，前317年帕拉塔克奈之役
};
