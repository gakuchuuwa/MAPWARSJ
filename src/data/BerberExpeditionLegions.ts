/**
 * 柏柏尔文化区远征精锐军团名（2026-08-21 从拉丁拆出，北非马格里布 9 城）
 *
 * 收录红线：
 * - 番号 3–6 字，全局不重复
 * - 番号取正史具名，禁止泛称堆砌
 */
export const BERBER_EXPEDITION_ELITE_LEGIONS: Readonly<Record<string, { name: string; tier: 0 | 1 | 2 | 3 | 4 }>> = {
    buni: { name: '努米底亚骑', tier: 2 },       // 迦太基·汉尼拔：努米底亚柏柏尔轻骑，汉尼拔军骑兵核心
    mulabite: { name: '穆拉比特军', tier: 2 },   // 马拉喀什·塔什芬：穆拉比特柏柏尔王朝征服伊比利亚
    aguelabu: { name: '易弗里兵团', tier: 2 },   // 凯鲁万·奥克巴：征服易弗里基叶（Ifriqiya）；避势力「阿格拉布」叠字
    babali: { name: '巴巴里舰队', tier: 3 },     // 阿尔及尔·巴巴罗萨：北非巴巴里海盗舰队
    telibolisi: { name: '巴巴里海盗', tier: 3 }, // 的黎波里·德拉古特：北非海盗身份可考 → T3
    talike: { name: '骆驼弓骑兵', tier: 3 },   // 丹吉尔·塔里克：柏柏尔骆驼弓骑兵（DE Camel Archer），711征服伊比利亚
    yidelisi: { name: '伊德里斯团', tier: 4 },   // 非斯·伊德里斯：都城军；避据点「非斯」叠字
    zhayan: { name: '特莱姆森骑', tier: 4 },     // 特莱姆森·亚格姆拉森；避势力「扎扬」叠字
    hamade: { name: '贝尼哈马团', tier: 4 },     // 布佳亚·哈马德：卡拉阿·贝尼·哈马德；避势力「哈马德」叠字
    // ── [2026-08-26] 大西洋航线：加那利关切人 ──
    guanche: { name: '关切投石兵', tier: 3 },   // 特尔德·本特胡伊：无金属武器，以投石与火硬木矛抗西班牙火器，兵种特色独树一帜
    disidelusi: { name: '蒂斯德鲁斯卫队', tier: 4 },
    muwaxide: { name: '穆瓦骑兵', tier: 1 },
};
