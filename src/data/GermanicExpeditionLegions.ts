/**
 * 日耳曼文化区远征精锐军团名（GERMANIC / RegionSystem，2026-08-01 新增）
 *
 * 覆盖范围：日耳曼
 *
 * 收录红线：
 * - 番号 3–5 字，全局不重复；同势力只挂一个番号
 * - tier 依 AGENTS.md §12.3.1「精锐 tier 判定标准 v3」，从 T0 向下试，命中最高一级即定
 * - 武将/精锐/据点三契：守将/贡献/镇守/当官/执行任务；非出生地无贡献
 * - 冷兵器、17 世纪以前
 */
import type { EliteLegionConfig } from './ExpeditionLegions';

export const GERMANIC_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, EliteLegionConfig>> = {

    // ── T1 功勋之兵 ──
    jialuolin: { name: '加洛林亲兵', tier: 1 },          // 亚琛·查理大帝：scara 御林亲兵，征西欧

    // ── T2 特色之兵 ──
    falanji: { name: '图尔甲士', tier: 2 },          // 科隆·查理马特：732图尔战役
    boximiya: { name: '胡斯战车', tier: 2 },          // 布拉格·扬杰斯卡：战车阵
    mazhaer: { name: '马扎尔骑', tier: 2 },          // 布达佩斯·阿尔帕德：征服喀尔巴阡
    anggelu: { name: '盾墙民兵', tier: 2 },          // 伦敦·阿尔弗雷德：埃丁顿盾墙
    didi: { name: '金马刺兵', tier: 2 },          // 布鲁日·威廉一世：1302金马刺行会步兵
    piketai: { name: '苏格兰军团', tier: 2 },          // 爱丁堡·奥恩格斯
    aersasi: { name: '莱茵军团', tier: 2 },          // 斯特拉斯堡·尤里安：357大捷
    ruishi: { name: '瑞士长枪', tier: 2 },          // 巴塞尔·阿诺德：森帕赫长枪方阵
    tiaodun_qishi: { name: '条顿骑士团', tier: 2 },          // 柯尼斯堡·乌尔里希

    // ── T3 风土之兵 ──
    nidelan: { name: '海上乞丐', tier: 3 },          // 海牙·奥兰治侧 Geuzen（文化符号；战略连续性不足→T3）
    weijing_york: { name: '约维克卫', tier: 3 },          // 约克·血斧埃里克：丹法区约维克卫戍
    weijing_bergen: { name: '挪威维京军', tier: 3 },          // 卑尔根·斯维尔
    nuosi: { name: '瑞典军团', tier: 3 },          // 乌普萨拉·奥拉夫
    hansa: { name: '汉萨卫队', tier: 3 },          // 汉堡·克劳斯：汉萨商船护卫
    mozeer: { name: '特里尔军团', tier: 3 },          // 特里尔·君士坦丁
    batawei: { name: '巴达维辅', tier: 3 },          // 乌特勒支·西维利斯：巴达维辅助军/之乱

    // ── T4 存在之兵 ──
    habusibao: { name: '哈布军团', tier: 4 },          // 维也纳·马克西米
    // 哥德堡·卡尔九世：方阵革新多属古斯塔夫；卡尔马战争可考 → T4
    ruidian_yota: { name: '卡尔马盟', tier: 4 },
    weixi: { name: '威悉军团', tier: 4 },          // 不莱梅·安斯加尔
    maixiya: { name: '麦西军团', tier: 4 },          // 牛津·奥法
    gaer: { name: '芬尼军团', tier: 4 },          // 都柏林·多姆纳尔
    boumeilaniyan: { name: '波美军团', tier: 4 },          // 格但斯克·卡西米尔
    bafaliya: { name: '巴伐军团', tier: 4 },          // 雷根斯堡·塔西洛
    // 纽伦堡·霍亨索伦伯：家族专名可考 → T3（禁造「法兰克重骑」）
    huohengsuolun: { name: '黑鹰军团', tier: 3 },
    pufaerci: { name: '普法军团', tier: 4 },          // 海德堡·路德维希
    // 勃兰登堡·阿尔布雷（大熊）：北边疆侯，非条顿骑士团 → T3 边疆军
    asikanani: { name: '边疆军团', tier: 3 },
    // 马格德堡·杰罗：萨克森东扩边疆 → T4
    wende: { name: '易北军团', tier: 4 },
    molaweiya: { name: '摩拉维军团', tier: 3 },          // 奥尔穆茨·斯瓦托
    damolaweiya: { name: '摩拉卫队', tier: 4 },          // 布尔诺·莫伊米尔
    meikelunbao: { name: '梅克军团', tier: 4 },          // 罗斯托克·博尔温
    kanbuliya: { name: '坎布军团', tier: 3 },          // 卡莱尔·华莱士
    shiwaben: { name: '士瓦本军团', tier: 4 },          // 奥格斯堡·乌尔里希
    rierman: { name: '美因军团', tier: 3 },          // 美因茨·奥托
};
