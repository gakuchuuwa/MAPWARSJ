/**
 * 阿拉伯（ORIE）文化区远征精锐军团名（2026-08-27 拆西亚新增，埃及/阿拉伯半岛/黎凡特 18 势力）
 *
 * 收录红线：
 * - 番号 3–5 字，全局不重复；同势力只挂一个番号
 * - tier 依 AGENTS.md §12.3.1「精锐 tier 判定标准 v3」，从 T0 向下试，命中最高一级即定
 */
import type { EliteLegionConfig } from './ExpeditionLegions';

export const ORIE_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, EliteLegionConfig>> = {
    // ── T1 功勋之兵 ──
    ayoubu: { name: '阿尤布近卫', tier: 1 },       // 阿勒颇·萨拉赫丁：亲将 Halqa 近卫团（非仪仗），哈丁全歼十字军野战军
    mamuluke: { name: '马穆鲁克骑', tier: 1 },      // 阿音贾鲁特·拜巴尔斯：1260 击败蒙古的战略级胜利，马穆鲁克奴隶骑兵建制延续 267 年

    // ── T2 特色之兵 ──
    tuolemi: { name: '希腊方阵', tier: 2 },        // 亚历山大·托勒密：拉菲亚之战与塞琉古银盾对决
    xibolai: { name: '基伯利姆', tier: 2 },        // 耶路撒冷·大卫：希伯来语 gibborim「勇士」，撒下载勇士团；避将名
    xikesuosi: { name: '喜克索战车', tier: 2 },    // 阿瓦里斯·萨利蒂：复合弓＋战车征服并统治下埃及百余年
    paermila: { name: '帕尔米拉骑', tier: 2 },     // 塔德莫尔·芝诺比娅：亲统重装弓骑（clibanarii）夺取埃及与小亚
    dibisi: { name: '阿蒙神卫队', tier: 2 },         // 瓦塞特（上埃及·底比斯）·图特摩斯：以阿蒙神命名的新王国常备军团
    aosiruowen: { name: '伯国骑士', tier: 3 },       // 埃德萨·鲍德温：十字军埃德萨伯国骑军（风土/建制符号；无独立战略大捷故 T3）
    yelusalengwg: { name: '圣墓骑士', tier: 3 },     // 阿卡·鲍德温四世：耶路撒冷王国圣墓骑士团（风土/建制符号）

    // ── T3 风土之兵 ──
    nabatai: { name: '纳巴驼骑', tier: 3 },        // 佩特拉·阿雷塔斯：商道驼骑，沙漠机动兵种特色鲜明
    aiji: { name: '麦查伊军', tier: 3 },           // 孟菲斯·拉美西斯：麦查伊（Medjay）努比亚斥候，史载专名、兵种独特
    maidina: { name: '麦地那骑兵', tier: 3 },      // 麦地那·哈立德：其出征所本的早期穆斯林骑兵，文化符号显著
    sailiugu: { name: '塞琉古方阵', tier: 3 },     // 安提俄基亚·安条克：塞琉古银盾方阵，希腊化重步代表
    womaya: { name: '倭马亚卫', tier: 3 },         // 大马士革·穆阿维叶：其建都之地的哈里发近卫，文化辨识度高

    // ── T4 存在之兵 ──
    youfaladi: { name: '阿纳特兵', tier: 4 },      // 阿纳特·叶海亚：幼发拉底中游戍堡守兵
    beileinisi: { name: '贝雷水师', tier: 4 },     // 贝雷尼斯·托勒密二世：其所建红海港埠常规水师
    dedan: { name: '德丹驼兵', tier: 4 },          // 泰马·卡比里尔：北阿拉伯德丹／黎哈彦常规驼兵
    gulaishi: { name: '古莱驼兵', tier: 4 },       // 麦加·艾布苏富扬：古莱什部落常规驼兵
};
