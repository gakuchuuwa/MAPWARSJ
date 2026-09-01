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
    mosike_gongguo: { name: '顿河军', tier: 2 },          // 莫斯科·德米特里：顿河王/库利科沃；避据点「莫斯科」叠字
    gesake: { name: '哥萨克骑兵', tier: 2 },          // 塞契·赫梅利：扎波罗热哥萨克
    moerdaweiya: { name: '瓦斯卢伊军', tier: 2 },          // 雅西·斯蒂芬大帝：1475以少胜多
    piyasite: { name: '波兰骑士', tier: 2 },          // 克拉科夫·卡齐米日：格伦瓦尔德主力
    litaowan: { name: '列提斯骑兵', tier: 2 },
    baojian_qishi: { name: '里加宝剑', tier: 2 },          // 里加·宝剑骑士团；避势力「宝剑骑士团」叠字
    shaiyue: { name: '马扎尔骠骑', tier: 2 },

    // ── T1 功勋之兵 ──
    dunhe: { name: '亚速哥萨克', tier: 1 },          // 阿速城·塔塔里诺夫：1637攻占亚速 / 1641亚速围城战以少胜多
    eluosi_diguo: { name: '彼得近卫军', tier: 1 },          // 圣彼得堡·彼得大帝：普列奥布拉任斯基近卫团，波尔塔瓦大捷，俄国近卫建制贯穿罗曼诺夫
    keluodiya: { name: '边境禁卫', tier: 3 },
    xieerpuhuofu_gongguo: { name: '波雅尔骑兵', tier: 1 },          // 谢尔普霍夫·弗拉基米尔：库利科沃伏击军团；莫斯科公国贵族重骑兵
    // 普斯科夫·道曼塔斯：守城抗条顿，无「卫」专名 → T3 风土/城邦军
    pusikefu_gongheguo: { name: '圣三一兵团', tier: 3 },          // 普斯科夫·道曼塔斯：守城抗条顿；无「卫」专名
    bosi_puluosi: { name: '刻赤具装骑', tier: 2 },        // 潘提卡彭·琉孔一世：博斯普鲁斯具装重骑
    lagusa: { name: '拉古萨舰队', tier: 3 },          // 拉古萨·德拉甘：亚得里亚海商船共和国
    liwoniya: { name: '利沃骑士', tier: 3 },          // 塔林·普雷特贝格：波罗的海十字军
    walajiyia: { name: '维特吉', tier: 3 },

    // ── T4 存在之兵 ──
    teweier_gongguo: { name: '伏尔加骑兵', tier: 4 },          // 特维尔·米哈伊尔：抗衡莫斯科
    fulajimier_gongguo: { name: '德鲁日纳', tier: 4 },          // 弗拉基米尔·安德烈：罗斯 дружина 亲兵；避空泛「近卫」
    daniebo: { name: '罗姆什拉团', tier: 4 },          // 斯摩棱斯克·罗姆什拉夫；避据点/势力「斯摩棱」叠字
    qiernigeweifu_gongguo: { name: '姆斯蒂骑', tier: 4 },          // 切尔尼戈夫·姆斯蒂；避势力「杰斯纳」叠字
    jialixiya: { name: '加利奇骑士', tier: 4 },          // 加利奇·丹尼尔
    // 梁赞·尤里：科洛夫拉特抗蒙传说/文学符号 → T3（勿造「死士」抬 T2）
    ouka: { name: '科洛夫拉特', tier: 3 },
    xideweina: { name: '德维纳步兵', tier: 4 },          // 波洛茨克·布列斯拉夫
    deniesite: { name: '白堡守军', tier: 3 },          // 阿克曼·迈赫迈德
    // 格罗德诺·维托夫特：安置利普卡鞑靼骑从可考；禁造「立陶宛重骑」T1 → T3
    nieman: { name: '利普卡骑', tier: 3 },
    beisilafu: { name: '谢尔盖兵团', tier: 4 },          // 别尔哥罗德·谢尔盖；避势力「塞维里亚」叠字
    siluoboda: { name: '洛潘河巡骑', tier: 3 },          // 哈尔科夫·多涅茨：洛潘河畔斯洛博达驻军（非史载「洛潘骑」专名）
    yedi: { name: '穆拉夫骑', tier: 3 },          // 沃罗涅日·萨布罗夫：守穆拉夫小道南疆骑戍
    weijiebusike_gongguo: { name: '奥尔格尔团', tier: 3 },          // 维捷布斯克·奥尔格尔德；避「维捷」叠字
    peilieya_gongguo: { name: '莫诺马赫团', tier: 2 },          // 佩列亚斯拉夫·莫诺马赫；避「佩列」叠字
    suzidaer: { name: '伏尔加营', tier: 4 },          // 下诺城·德米特里；避据点「下诺」叠字
    taolika: { name: '阿斯普尔团', tier: 4 },
    // 布列斯特·加斯托尔德：边城戍军 → T4
    bolisiya: { name: '布格河游骑', tier: 4 },
    // 日托米尔：哥萨克已挂 gesake；此地无专名 → T4
    zhituo: { name: '沼泽猎手', tier: 4 },
    bosiniya: { name: '萨拉热窝营', tier: 4 },
    chude: { name: '楚德湖兵', tier: 3 },          // 尤里耶夫(塔尔图)·维切斯拉夫：守城抗条顿；冰湖主力已挂诺城民兵 → 事件文化 T3
    kaleiliya: { name: '奥涅加猎手', tier: 4 },     // 基日岛·克利姆：卡累利阿森林猎手（编）；避势力「卡累利阿」叠字
    qiekase: { name: '切尔卡瑟骑', tier: 4 },          // 切尔卡瑟·拜达；避势力「第聂伯」叠字
    kelimiya: { name: '克里米骑', tier: 3 },
    vidin_tsardom: { name: '多瑙戍军', tier: 4 },
    lesser_poland: { name: '本津炮卒', tier: 4 },
    saierweiya: { name: '杜尚兵团', tier: 2 },
    kuertaiya: { name: '瓦拉骑兵', tier: 3 },
    xiadunhe: { name: '罗斯亲兵', tier: 1 },
    valois_angouleme: { name: '国王宪兵', tier: 1 },
    bolan: { name: '翼骑兵', tier: 3 },
    dabolan: { name: '瓦尔塔骑', tier: 3 },
};
