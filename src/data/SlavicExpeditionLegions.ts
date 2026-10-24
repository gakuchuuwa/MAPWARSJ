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
    mosike_gongguo: { name: '顿河军', tier: 2 },          // 莫斯科·德米特里：顿河王/库利科沃；避据点「莫斯科」叠字
    gesake: { name: '哥萨克骑兵', tier: 2 },          // 塞契·赫梅利：扎波罗热哥萨克
    moerdaweiya: { name: '瓦斯卢伊军', tier: 2 },          // 雅西·斯蒂芬大帝：1475以少胜多
    litaowan: { name: '列提斯骑兵', tier: 2 },
    baojian_qishi: { name: '里加宝剑', tier: 2 },          // 里加·宝剑骑士团；避势力「宝剑骑士团」叠字

    // ── T1 功勋之兵 ──
    eluosi_diguo: { name: '彼得近卫军', tier: 1 },          // 圣彼得堡·彼得大帝：普列奥布拉任斯基近卫团，波尔塔瓦大捷，俄国近卫建制贯穿罗曼诺夫
    keluodiya: { name: '边境禁卫', tier: 3 },
    // 普斯科夫·道曼塔斯：守城抗条顿，无「卫」专名 → T3 风土/城邦军
    pusikefu_gongheguo: { name: '圣三一兵团', tier: 3 },          // 普斯科夫·道曼塔斯：守城抗条顿；无「卫」专名
    bosi_puluosi: { name: '刻赤具装骑', tier: 2 },        // 潘提卡彭·琉孔一世：博斯普鲁斯具装重骑
    lagusa: { name: '拉古萨舰队', tier: 3 },          // 拉古萨·德拉甘：亚得里亚海商船共和国
    walajiyia: { name: '维特吉', tier: 3 },

    // ── T4 存在之兵 ──
    teweier_gongguo: { name: '伏尔加骑兵', tier: 4 },          // 特维尔·米哈伊尔：抗衡莫斯科
    daniebo: { name: '罗姆什拉团', tier: 4 },          // 斯摩棱斯克·罗姆什拉夫；避据点/势力「斯摩棱」叠字
    qiernigeweifu_gongguo: { name: '姆斯蒂骑', tier: 4 },          // 切尔尼戈夫·姆斯蒂；避势力「杰斯纳」叠字
    jialixiya: { name: '加利奇骑士', tier: 4 },          // 加利奇·丹尼尔
    // 梁赞·尤里：科洛夫拉特抗蒙传说/文学符号 → T3（勿造「死士」抬 T2）
    ouka: { name: '科洛夫拉特', tier: 3 },
    xideweina: { name: '德维纳步兵', tier: 4 },          // 波洛茨克·布列斯拉夫
    // 格罗德诺·维托夫特：安置利普卡鞑靼骑从可考；禁造「立陶宛重骑」T1 → T3
    peilieya_gongguo: { name: '莫诺马赫团', tier: 2 },          // 佩列亚斯拉夫·莫诺马赫；避「佩列」叠字
    suzidaer: { name: '伏尔加营', tier: 4 },          // 下诺城·德米特里；避据点「下诺」叠字
    // 布列斯特·加斯托尔德：边城戍军 → T4
    // 日托米尔：哥萨克已挂 gesake；此地无专名 → T4
    bosiniya: { name: '萨拉热窝营', tier: 4 },
    kelimiya: { name: '热那亚弩手', tier: 1 },
    vidin_tsardom: { name: '多瑙戍军', tier: 4 },
    saierweiya: { name: '杜尚兵团', tier: 2 },
    bolan: { name: '翼骑兵', tier: 3 },
    fangla: { name: '圣公兵', tier: 3 },
    yelusalengwg: { name: '圣墓骑士', tier: 3 },
    pisha: { name: '毗沙都督卫', tier: 4 },
    wuhu: { name: '乌护游骑', tier: 4 },
    kawusi: { name: '卡乌斯铁卫', tier: 4 },
    dali: { name: '洱海白戟', tier: 3 },
};
