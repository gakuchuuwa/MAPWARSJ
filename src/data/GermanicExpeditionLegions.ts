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
    jialuolin: { name: '加洛林军', tier: 1 },          // 亚琛·查理大帝：征服西欧

    // ── T2 特色之兵 ──
    falanji: { name: '法兰克军', tier: 2 },          // 科隆·查理马特：图尔战役
    boximiya: { name: '胡斯战车', tier: 2 },          // 布拉格·扬杰斯卡：战车阵
    mazhaer: { name: '马扎尔骑', tier: 2 },          // 布达佩斯·阿尔帕德：征服喀尔巴阡
    anggelu: { name: '撒克逊军', tier: 2 },          // 伦敦·阿尔弗雷德：埃丁顿战役
    didi: { name: '佛兰德军', tier: 2 },          // 布鲁日·威廉一世：金马刺
    nidelan: { name: '荷兰军', tier: 2 },          // 海牙·威廉·奥兰治
    piketai: { name: '苏格兰军', tier: 2 },          // 爱丁堡·奥恩格斯
    aersasi: { name: '莱茵军团', tier: 2 },          // 斯特拉斯堡·尤里安：357大捷
    ruishi: { name: '瑞士军', tier: 2 },          // 巴塞尔·阿诺德：森帕赫
    tiaodun_qishi: { name: '条顿骑士', tier: 2 },          // 柯尼斯堡·乌尔里希

    // ── T3 风土之兵 ──
    weijing_york: { name: '约维京军', tier: 3 },          // 约克·血斧埃里克
    weijing_bergen: { name: '挪威维京军', tier: 3 },          // 卑尔根·斯维尔
    nuosi: { name: '瑞典军', tier: 3 },          // 乌普萨拉·奥拉夫
    hansa: { name: '汉萨卫队', tier: 3 },          // 汉堡·克劳斯：汉萨商船护卫
    mozeer: { name: '特里尔军团', tier: 3 },          // 特里尔·君士坦丁
    batawei: { name: '巴塔维军', tier: 3 },          // 乌特勒支·西维利斯

    // ── T4 存在之兵 ──
    habusibao: { name: '哈布斯堡军', tier: 4 },          // 维也纳·马克西米
    ruidian_yota: { name: '哥德堡军', tier: 4 },          // 哥德堡·卡尔九世
    weixi: { name: '威悉军', tier: 4 },          // 不莱梅·安斯加尔
    maixiya: { name: '麦西亚军', tier: 4 },          // 牛津·奥法
    gaer: { name: '盖尔军', tier: 4 },          // 都柏林·多姆纳尔
    boumeilaniyan: { name: '波美军', tier: 4 },          // 格但斯克·卡西米尔
    bafaliya: { name: '巴伐利亚军', tier: 4 },          // 雷根斯堡·塔西洛三世
    huohengsuolun: { name: '纽伦堡军', tier: 4 },          // 纽伦堡·腓特烈一世
    pufaerci: { name: '普法尔茨军', tier: 4 },          // 海德堡·路德维希
    asikanani: { name: '勃兰登堡军', tier: 4 },          // 勃兰登堡·阿尔布雷
    wende: { name: '马格德堡军', tier: 4 },          // 马格德堡·杰罗伯爵
    molaweiya: { name: '摩拉维亚军', tier: 4 },          // 奥尔穆茨·斯瓦托
    damolaweiya: { name: '摩拉卫队', tier: 4 },          // 布尔诺·莫伊米尔
    meikelunbao: { name: '梅克伦堡军', tier: 4 },          // 罗斯托克·亨利波罗
    kanbuliya: { name: '坎布里亚军', tier: 3 },          // 卡莱尔·威廉·华莱士
    shiwaben: { name: '士瓦本军', tier: 4 },          // 奥格斯堡·亨利
    rierman: { name: '莱茵军', tier: 3 },          // 美因茨·奥托一世
};
