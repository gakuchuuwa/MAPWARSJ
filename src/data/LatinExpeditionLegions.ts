/**
 * 拉丁文化区远征精锐军团名（LATIN / RegionSystem，2026-08-01 新增）
 *
 * 收录红线：
 * - 番号 3–5 字，全局不重复；同势力只挂一个番号
 * - tier 依 AGENTS.md §12.3.1「精锐 tier 判定标准 v3」，从 T0 向下试，命中最高一级即定
 * - 武将/精锐/据点三契：守将/贡献/镇守/当官/执行任务；非出生地无贡献
 * - 冷兵器、17 世纪以前
 */
import type { EliteLegionConfig } from './ExpeditionLegions';

export const LATIN_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, EliteLegionConfig>> = {

    // ── T1 功勋之兵 ──
    luoma_diguo: { name: '罗马军团', tier: 1 },          // 罗马城·大西庇阿：征服地中海，建制千年

    // ── T2 特色之兵 ──
    // 汉尼拔主力骑臂=努米底亚骑（坎尼等）；圣团属布匿早期，勿绑汉尼拔 → T2
    aquidan: { name: '法兰克甲士', tier: 2 },          // 波尔多·黑太子：1356普瓦捷——长弓+下马甲士为主（非骑兵专名；勿与732图尔/查理马特混淆）
    maerta_qishi: { name: '马耳他骑士', tier: 2 },          // 马耳他·拉·瓦莱特：1565大围攻以少胜多
    kasidiliya: { name: '卡斯蒂骑', tier: 3 },

    // ── T3 风土之兵 ──
    lunbadi: { name: '撒克斯刀卫', tier: 3 },          // 米兰·阿尔博因：伦巴第撒克斯单刃大刀近卫
    gaolu: { name: '敕令骑兵', tier: 3 },          // 巴黎·查理七世：compagnies d'ordonnance；避势力「法兰西」叠字
    // 图卢兹·雷蒙五世：古名 Tolosa →「托洛萨骑」美化；无战役专名高光，档仍 T4（不抬）
    jiatailuoniya: { name: '加泰轻步', tier: 3 },          // 巴塞罗那·海梅：加泰轻装（佣兵团偏罗杰弗洛尔，不同代；阿尔莫加瓦已挂萨拉戈萨）
    putaoya: { name: '阿维斯骑士', tier: 3 },          // 里斯本·阿方索·恩里克侧阿维斯团（基督骑士已挂休达）
    // 维罗纳·坎格兰德：斯卡拉家族治军，非「铁骑」专名 → T3

    // ── T4 存在之兵 ──
    // 那不勒斯·卡洛（安茹）：安茹骑士可考，无「重骑」专名高光 → T3
    safuyi: { name: '萨伏伊卫', tier: 2 },             // 尚贝里·阿梅迪奥六世：萨伏伊圣天使报喜骑士卫队
    // 佛罗伦萨：Bande Nere 黑带军团（乔凡尼·德·美第奇）→ T4
    tuosikana: { name: '黑带军团', tier: 4 },          // 佛罗伦萨·洛伦佐侧：乔凡尼·德·美第奇 Bande Nere
    xixiliwangguo: { name: '萨金特卫兵', tier: 3 },          // 巴勒莫·腓特烈二世：诺曼军士步兵（DE Serjeant）
    // 格拉纳达·穆罕默德：纳斯里摩尔骑兵风土 → T3（禁造「阿兰布拉卫」）
    nasier: { name: '摩尔骑', tier: 3 },
    feiniqi: { name: '迦太基圣队', tier: 3 },          // 加的斯·哈米尔卡
    leangongguo: { name: '莱昂骑士', tier: 4 },          // 萨拉曼卡·阿方索九世
    // 萨拉戈萨·海梅一世：阿尔莫加瓦（Almogávares）突袭轻装 → T2
    alagong: { name: '阿尔莫加瓦', tier: 2 },
    // 休达·恩里克：基督骑士团大团长（非阿维斯）→ T2
    // 南特·吉尔德雷斯：无专名精锐 → T4
    // 雷恩·阿兰一世：布列塔尼地方军抗维京 → T4
    bulietani: { name: '阿莫里卡团', tier: 4 },          // 雷恩·阿兰一世：Armorica 抗维京；避势力「布列塔尼」叠字
    // 阿维尼翁·雷蒙四世（圣吉尔）：第一次十字军主力；专名偏弱 → T3（勿挂「教皇军」）
    puluowangsi: { name: '圣吉尔骑', tier: 3 },
    // 加莱·罗贝尔二世（佛兰德）：第一次十字军；金马刺步兵已挂 didi「佛兰德军」，此处不夺步兵符号
    baizanting: { name: '铁甲圣骑', tier: 1 },
    // ── [2026-08-26] 大西洋航线：亚速尔 / 佛得角 ──
    yasuer: { name: '特塞拉牛阵', tier: 2 },     // 安格拉·西普里亚诺：1581 萨尔加之战驱牛群冲散西班牙登陆部队
    fodejiao: { name: '克里奥民兵', tier: 4 },   // 里贝拉·诺利：佛得角首府守备民兵（1585 德雷克、1712 卡萨尔两度洗劫）
    keernuwaye: { name: '布列塔尼骑', tier: 4 },
    kaernute: { name: '卡尔努特兵', tier: 4 },   // 沙特尔·科图阿图斯：高卢卡尔努特部族战团，公元前52年塞纳布姆起义,
    fulandesi: { name: '阿图瓦枪兵', tier: 2 },
    bogendigongguo: { name: '勃艮第重骑', tier: 3 },   // 蒙特罗·无畏的约翰：勃艮第重装骑士
    amaniyake: { name: '加斯科涅骑', tier: 3 },   // 欧什·贝尔纳·德·阿马尼亚克：阿马尼亚克伯爵所统领的西南加斯科涅重装骑士
};
