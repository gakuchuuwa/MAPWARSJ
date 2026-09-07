/**
 * 美洲（中美洲 MESO）文化区远征精锐军团名（2026-08-24 新增；2026-08-27 拆出安第斯后仅存中美洲 4 势力）
 *
 * 收录红线：
 * - 番号 3–6 字，全局不重复
 * - 番号取正史具名，禁止泛称堆砌
 */
export const AMERICA_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 | 4 }>> = {
    aztec: { name: '美洲豹武士', tier: 3 },  // 特诺奇提特兰·库奥特莫克：阿兹特克美洲豹武士（荣冠战争核心）
    maya: { name: '羽箭手', tier: 4 },       // 蒂卡尔·亚斯纳昌：玛雅贵族羽箭手
    tuotuonake: { name: '森波阿拉兵', tier: 3 },  // 韦拉克鲁斯·托托纳克：都城森波阿拉之兵，1519 与科尔特斯结盟共攻阿兹特克
    taino: { name: '泰诺弓手', tier: 3 },        // 哈瓦那·哈土依：泰诺人木棒与弓，抗西班牙首义（哈土依为古巴第一民族英雄）
    foluolida: { name: '西班牙方阵', tier: 3 },
    gualani: { name: '传教区军', tier: 2 },
    xingelana: { name: '地峡征服者', tier: 3 },
    xiyindu: { name: '奥萨马守军', tier: 3 },   // 圣多明各·巴托洛梅：美洲第一堡奥萨马城堡(Fortaleza Ozama)驻军，西印度总督府加勒比守备
    jialebi: { name: '要塞守备', tier: 2 },   // 卡塔赫纳·布拉斯莱索：南美最坚固防线卡塔赫纳要塞守军，1741以寡击众击退英军弗农舰队
    tutul_xiu: { name: '普克矛兵', tier: 4 },
    yiluokui: { name: '易洛魁战士', tier: 3 },  // 奥农多加·海华沙：易洛魁联盟武士，海狸战争中摧毁休伦/伊利等世仇
    qimu: { name: '奇穆战士', tier: 3 },  // 昌昌·明查凯曼：奇穆王国武士，1470年被印加征服
    talasike: { name: '塔拉斯科兵', tier: 3 },  // 钦聪灿·齐齐潘达夸雷：普雷佩查铜制武器军，1470年代大破阿兹特克入侵
    tailuona: { name: '泰罗纳战士', tier: 3 },  // 特尤纳·库查西克：泰罗纳失落之城武士，抗西班牙殖民
    teweierqie: { name: '特维尔切战士', tier: 3 },  // 圣胡利安港·卡西米罗·比格：特维尔切(阿奥尼肯)巴塔哥尼亚猎手
    xinnidelan: { name: '新尼德兰守军', tier: 4 },  // 新阿姆斯特丹·斯泰弗森特：荷兰西印度公司殖民地守军
    xinfalanxi: { name: '新法兰西民兵', tier: 4 },  // 魁北克·尚普兰：新法兰西殖民民兵
    xinxibanya: { name: '圣迭戈堡守军', tier: 4 },  // 阿卡普尔科·乌尔达内塔：1617年圣迭戈堡防海盗守军
};
