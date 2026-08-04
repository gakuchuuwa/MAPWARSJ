/**
 * 斯拉夫文化区远征精锐军团名（SLAVIC / RegionSystem，2026-08-01 新增）
 *
 * 覆盖范围：斯拉夫
 *
 * 收录红线：
 * - 番号 3–5 字，全局不重复；同势力只挂一个番号
 * - tier 依 AGENTS.md §12.3.1「精锐 tier 判定标准 v3」，从 T0 向下试，命中最高一级即定
 * - 武将/精锐/据点三契：守将/贡献/镇守/当官/执行任务；非出生地无贡献
 * - 冷兵器、17 世纪以前
 */
import type { EliteLegionConfig } from './ExpeditionLegions';

export const SLAVIC_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, EliteLegionConfig>> = {

    // ── T2 特色之兵 ──
    liulike: { name: '诺城民兵', tier: 2 },          // 诺夫哥罗德·亚历山大：冰湖之战主力
    mosike_gongguo: { name: '莫斯科卫队', tier: 2 },          // 莫斯科·德米特里：库利科沃决战核心
    gesake: { name: '哥萨克', tier: 2 },          // 塞契·赫梅利：扎波罗热哥萨克
    saierdika: { name: '普利斯卡骑', tier: 2 },          // 索非亚·克鲁姆：811普利斯卡歼灭拜占庭军
    saierweiya: { name: '塞尔维亚军', tier: 2 },          // 贝尔格莱德·斯蒂芬杜尚：巴尔干霸主
    moerdaweiya: { name: '瓦斯卢伊军', tier: 2 },          // 雅西·斯蒂芬大帝：1475以少胜多
    piyasite: { name: '波兰骑士', tier: 2 },          // 克拉科夫·卡齐米日：格伦瓦尔德主力
    litaowan: { name: '格迪米骑', tier: 2 },          // 维尔纽斯·格迪米纳斯：格伦瓦尔德
    baojian_qishi: { name: '宝剑骑士', tier: 2 },
    shaiyue: { name: '埃格尔卫', tier: 2 },          // 埃格尔·多博伊：1552以少胜多
    dajiya: { name: '达契亚军', tier: 2 },          // 萨尔米泽·德切巴鲁斯：图拉真战争抗罗马

    // ── T1 功勋之兵 ──
    luosi: { name: '瓦兰吉卫队', tier: 1 },          // 基辅·雅罗斯拉夫：989巴西尔二世借基辅瓦良格兵组建，拜占庭皇帝斧兵卫队（克雷迪昂/曼齐刻尔特），2026-08-02 原亲卫队T3升
    // 普斯科夫·道曼塔斯：守城抗条顿，无「卫」专名 → T3 风土/城邦军
    pusikefu_gongheguo: { name: '圣三一卫', tier: 3 },
    kelimiya: { name: '克里米骑', tier: 3 },          // 卡法·哈吉格来：克里米亚鞑靼骑兵
    lagusa: { name: '拉古萨舰队', tier: 3 },          // 拉古萨·德拉甘：亚得里亚海商船共和国
    liwoniya: { name: '利沃骑', tier: 3 },          // 塔林·普雷特贝格：波罗的海十字军
    walajiyia: { name: '瓦拉几骑', tier: 3 },          // 特尔城·弗拉德：德古拉抗土
    bolan: { name: '翼骑兵', tier: 3 },          // 华沙·雅盖沃：波兰王国

    // ── T4 存在之兵 ──
    teweier_gongguo: { name: '伏尔加骑', tier: 4 },          // 特维尔·米哈伊尔：抗衡莫斯科
    fulajimier_gongguo: { name: '苏兹达骑', tier: 4 },          // 弗拉基米尔·安德烈
    daniebo: { name: '斯摩棱骑', tier: 4 },          // 斯摩棱斯克·罗姆什拉夫
    qiernigeweifu_gongguo: { name: '谢韦尔骑', tier: 4 },          // 切尔尼戈夫·姆斯蒂
    jialixiya: { name: '加利奇骑', tier: 4 },          // 加利奇·丹尼尔
    // 梁赞·尤里：科洛夫拉特抗蒙传说/文学符号 → T3（勿造「死士」抬 T2）
    ouka: { name: '科洛夫拉特', tier: 3 },
    xideweina: { name: '德维纳骑', tier: 4 },          // 波洛茨克·布列斯拉夫
    deniesite: { name: '白堡守军', tier: 3 },          // 阿克曼·迈赫迈德
    // 格罗德诺·维托夫特：安置利普卡鞑靼骑从可考；禁造「立陶宛重骑」T1 → T3
    nieman: { name: '利普卡骑', tier: 3 },
    beisilafu: { name: '白城骑', tier: 4 },          // 别尔哥罗德·谢尔盖
    weijiebusike_gongguo: { name: '维捷布骑', tier: 3 },          // 维捷布斯克·奥尔格尔德
    peilieya_gongguo: { name: '佩列雅骑', tier: 2 },          // 佩列亚斯拉夫·莫诺马赫
    suzidaer: { name: '下诺卫', tier: 4 },          // 下诺城·德米特里
    taolika: { name: '赫尔松卫队', tier: 4 },          // 赫尔松涅斯·阿斯普尔格斯
    // 布列斯特·加斯托尔德：边城戍军 → T4
    bolisiya: { name: '布格河骑', tier: 4 },
    // 日托米尔：哥萨克已挂 gesake；此地无专名 → T4
    zhituo: { name: '波莱西骑', tier: 4 },
    bosiniya: { name: '波斯尼骑', tier: 4 },          // 萨拉热窝·特夫尔特科
    seleisi: { name: '普罗夫骑', tier: 3 },          // 普罗夫迪夫·西美昂
    chude: { name: '楚德湖军', tier: 2 },          // 尤里耶夫(塔尔图)·维切斯拉夫：1224守城抗条顿骑士；1242楚德湖(冰湖)之战抗条顿
    qiekase: { name: '第聂伯骑', tier: 4 },          // 切尔卡瑟·拜达：第聂伯哥萨克
};
