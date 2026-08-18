/**
 * 势力自定义军团方阵数据表 (Faction Legion Compositions)
 * 由独立军团编辑器 (http://localhost:5173/legion-editor.html) 生成与维护。
 *
 * 机制：
 * - key: factionId (如 'qin', 'lagoniya', 'buni', 'luoma_diguo')
 * - 若势力在此表中登记，军团生成与渲染优先使用此配置；
 * - 若未登记，自动回退到 18 大文化区默认方阵 (CULTURE_TIERS_MAP)。
 */

import type { FormationMode } from '../types/CultureFormations';
import type { CompositionSlot } from '../types/LegionComposition';

export interface CustomFactionLegion {
    formationMode: FormationMode;
    slots: CompositionSlot[];
}

export const FACTION_COMPOSITIONS: Record<string, CustomFactionLegion> = {
    // 秦国·鹤翼阵（2+4+3：印加枪兵长 2 + 虎豹骑主力 4 + 诸葛弩 3）
    qin: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'kamayuk', count: 2 },             // Row 0 步兵前锋 = 印加枪兵长
            { type: 'tiger_rider', count: 4 },         // Row 1 骑兵主力两翼合围 = 虎豹骑
            { type: 'chukonu', count: 3 },             // Row 2 中军后排支援 = 诸葛弩
        ],
    },
    // 汉国·鹤翼阵（2+4+3：刀剑手 2 + 虎豹骑主力 4 + 诸葛弩 3）
    han: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'jian_swordsman', count: 2 },      // Row 0 步兵前锋 = 刀剑手 2人
            { type: 'tiger_rider', count: 4 },         // Row 1 骑兵主力两翼合围 = 虎豹骑 4人
            { type: 'chukonu', count: 3 },             // Row 2 中军后排支援 = 诸葛弩 3人
        ],
    },
    han_d: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'jian_swordsman', count: 2 },      // Row 0 步兵前锋 = 刀剑手 2人
            { type: 'tiger_rider', count: 4 },         // Row 1 骑兵主力两翼合围 = 虎豹骑 4人
            { type: 'chukonu', count: 3 },             // Row 2 中军后排支援 = 诸葛弩 3人
        ],
    },
    // 曹魏·曹操军团（鹤翼阵 2+4+3：曹魏虎豹骑 2 + 曹魏虎豹骑精锐 4 + 华夏诸葛弩 3）
    cao_d: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'tiger_rider', count: 2 },          // Row 0 前哨牵制 = 曹魏虎豹骑 2人
            { type: 'elite_tiger_cavalry', count: 4 },  // Row 1 铁骑主力两翼合围 = 曹魏虎豹骑精锐 4人
            { type: 'chukonu', count: 3 },              // Row 2 中军后排支援 = 华夏诸葛弩 3人
        ],
    },
    // 大金·完颜阿骨打 / 完颜宗弼铁浮屠军团（鹤翼阵 2+4+3：金国铁浮屠 2 + 金国铁浮屠精锐 4 + 火焰弓手 3）
    dajin: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'iron_pagoda', count: 2 },          // Row 0 前锋游弋 = 金国铁浮屠 2人
            { type: 'elite_iron_pagoda', count: 4 },    // Row 1 具装主力突贯 = 金国铁浮屠精锐 4人
            { type: 'fire_archer', count: 3 },          // Row 2 东北射雕火矢 = 火焰弓箭手 3人
        ],
    },
    jurchen: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'iron_pagoda', count: 2 },
            { type: 'elite_iron_pagoda', count: 4 },
            { type: 'fire_archer', count: 3 },
        ],
    },
    mohe: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'iron_pagoda', count: 2 },
            { type: 'elite_iron_pagoda', count: 4 },
            { type: 'fire_archer', count: 3 },
        ],
    },
    yizhou: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'iron_pagoda', count: 2 },
            { type: 'elite_iron_pagoda', count: 4 },
            { type: 'fire_archer', count: 3 },
        ],
    },
    dazhen: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'iron_pagoda', count: 2 },
            { type: 'elite_iron_pagoda', count: 4 },
            { type: 'fire_archer', count: 3 },
        ],
    },
    xiqin: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'iron_pagoda', count: 2 },
            { type: 'elite_iron_pagoda', count: 4 },
            { type: 'fire_archer', count: 3 },
        ],
    },
    // 南宋·岳飞 / 韩世忠 / 孟珙 / 刘锜 火矛手军团（鱼鳞阵 3+4+2：火矛手前卫 3 + 精锐火矛手突击主力 4 + 诸葛弩 2）
    yanchuan_d: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'fire_lancer', count: 3 },         // Row 0 前卫 = 南宋火矛手 3人
            { type: 'elite_fire_lancer', count: 4 },   // Row 1 中军火器突击主力 = 南宋火矛手精锐 4人
            { type: 'chukonu', count: 2 },             // Row 2 尾收神机弩 = 华夏诸葛弩 2人
        ],
    },
    sizhou: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'fire_lancer', count: 3 },
            { type: 'elite_fire_lancer', count: 4 },
            { type: 'chukonu', count: 2 },
        ],
    },
    yingzhou_d: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'fire_lancer', count: 3 },
            { type: 'elite_fire_lancer', count: 4 },
            { type: 'chukonu', count: 2 },
        ],
    },
    zaoyang_d: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'fire_lancer', count: 3 },
            { type: 'elite_fire_lancer', count: 4 },
            { type: 'chukonu', count: 2 },
        ],
    },
    fengzhou: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'fire_lancer', count: 3 },
            { type: 'elite_fire_lancer', count: 4 },
            { type: 'chukonu', count: 2 },
        ],
    },
    hezhou: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'fire_lancer', count: 3 },
            { type: 'elite_fire_lancer', count: 4 },
            { type: 'chukonu', count: 2 },
        ],
    },
    changshaguo: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'fire_lancer', count: 3 },
            { type: 'elite_fire_lancer', count: 4 },
            { type: 'chukonu', count: 2 },
        ],
    },
    shenshi: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'fire_lancer', count: 3 },
            { type: 'elite_fire_lancer', count: 4 },
            { type: 'chukonu', count: 2 },
        ],
    },
    luoping: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'fire_lancer', count: 3 },
            { type: 'elite_fire_lancer', count: 4 },
            { type: 'chukonu', count: 2 },
        ],
    },
    // 草原与中亚诸大汗·鞑靼怯薛军团（鹤翼阵 2+4+3：怯薛军前卫 2 + 精锐怯薛军主力合围 4 + 钦察弓骑 3）
    // 包含：成吉思汗、拔都、忽必烈、帖木儿、旭烈兀、速不台、木华黎、也速该、札木合、也先、噶尔丹、昔班尼、巴布尔、突厥大汗等
    menggu_d: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'keshik', count: 2 },          // Row 0 前哨 = 鞑靼怯薛军 2人
            { type: 'elite_keshik', count: 4 },    // Row 1 王庭宿卫铁骑两翼合围 = 鞑靼怯薛军精锐 4人
            { type: 'kipchak', count: 3 },         // Row 2 中军后排齐射 = 库曼钦察弓骑 3人
        ],
    },
    jinzhang: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'keshik', count: 2 },
            { type: 'elite_keshik', count: 4 },
            { type: 'kipchak', count: 3 },
        ],
    },
    yuan_d: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'keshik', count: 2 },
            { type: 'elite_keshik', count: 4 },
            { type: 'kipchak', count: 3 },
        ],
    },
    tiemuer: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'keshik', count: 2 },
            { type: 'elite_keshik', count: 4 },
            { type: 'kipchak', count: 3 },
        ],
    },
    asaibaijiang: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'keshik', count: 2 },
            { type: 'elite_keshik', count: 4 },
            { type: 'kipchak', count: 3 },
        ],
    },
    wuliangha: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'keshik', count: 2 },
            { type: 'elite_keshik', count: 4 },
            { type: 'kipchak', count: 3 },
        ],
    },
    jalair: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'keshik', count: 2 },
            { type: 'elite_keshik', count: 4 },
            { type: 'kipchak', count: 3 },
        ],
    },
    kiyad: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'keshik', count: 2 },
            { type: 'elite_keshik', count: 4 },
            { type: 'kipchak', count: 3 },
        ],
    },
    zhadalan: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'keshik', count: 2 },
            { type: 'elite_keshik', count: 4 },
            { type: 'kipchak', count: 3 },
        ],
    },
    wala: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'keshik', count: 2 },
            { type: 'elite_keshik', count: 4 },
            { type: 'kipchak', count: 3 },
        ],
    },
    oirat_ming: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'keshik', count: 2 },
            { type: 'elite_keshik', count: 4 },
            { type: 'kipchak', count: 3 },
        ],
    },
    an: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'keshik', count: 2 },
            { type: 'elite_keshik', count: 4 },
            { type: 'kipchak', count: 3 },
        ],
    },
    babuer: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'keshik', count: 2 },
            { type: 'elite_keshik', count: 4 },
            { type: 'kipchak', count: 3 },
        ],
    },
    da_yuan: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'keshik', count: 2 },
            { type: 'elite_keshik', count: 4 },
            { type: 'kipchak', count: 3 },
        ],
    },
    chahar: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'keshik', count: 2 },
            { type: 'elite_keshik', count: 4 },
            { type: 'kipchak', count: 3 },
        ],
    },
    zhaowu: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'keshik', count: 2 },
            { type: 'elite_keshik', count: 4 },
            { type: 'kipchak', count: 3 },
        ],
    },
    manghuti: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'keshik', count: 2 },
            { type: 'elite_keshik', count: 4 },
            { type: 'kipchak', count: 3 },
        ],
    },
    khoshut: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'keshik', count: 2 },
            { type: 'elite_keshik', count: 4 },
            { type: 'kipchak', count: 3 },
        ],
    },
    yilihanguo_d: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'keshik', count: 2 },
            { type: 'elite_keshik', count: 4 },
            { type: 'kipchak', count: 3 },
        ],
    },
    yilihanguo: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'keshik', count: 2 },
            { type: 'elite_keshik', count: 4 },
            { type: 'kipchak', count: 3 },
        ],
    },
    salai: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'keshik', count: 2 },
            { type: 'elite_keshik', count: 4 },
            { type: 'kipchak', count: 3 },
        ],
    },
    // 马其顿·亚历山大帝国军团（鹤翼阵 2+4+3：马其顿方阵兵 2 + 伙伴骑兵主力 4 + 克里特弓手 3）
    maqidun: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'phalangite', count: 2 },         // Row 0 步兵前锋 = 马其顿方阵兵
            { type: 'companion_cavalry', count: 4 },  // Row 1 骑兵主力两翼合围 = 伙伴骑兵
            { type: 'cretan_archer', count: 3 },      // Row 2 中军后排支援 = 克里特弓手
        ],
    },
    // 托勒密（亚历山大旧部，套用亚历山大帝国军团配置）
    tuolemi: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'phalangite', count: 2 },         // Row 0 步兵前锋 = 马其顿方阵兵
            { type: 'companion_cavalry', count: 4 },  // Row 1 骑兵主力两翼合围 = 伙伴骑兵
            { type: 'cretan_archer', count: 3 },      // Row 2 中军后排支援 = 克里特弓手
        ],
    },
    // 塞琉古帝国（安提俄基亚 · 塞琉古一世/安条克，银盾方阵体系）
    sailiugu: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'phalangite', count: 2 },         // Row 0 步兵前锋 = 马其顿方阵兵
            { type: 'companion_cavalry', count: 4 },  // Row 1 骑兵主力两翼合围 = 伙伴骑兵
            { type: 'cretan_archer', count: 3 },      // Row 2 中军后排支援 = 克里特弓手
        ],
    },
    // 佩尔加蒙（欧迈尼斯 · 亚历山大王家秘书长与近卫方阵统帅）
    pajiama: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'phalangite', count: 2 },         // Row 0 步兵前锋 = 马其顿方阵兵
            { type: 'companion_cavalry', count: 4 },  // Row 1 骑兵主力两翼合围 = 伙伴骑兵
            { type: 'cretan_archer', count: 3 },      // Row 2 中军后排支援 = 克里特弓手
        ],
    },
    // 贝雷尼斯（托勒密二世 · 托勒密王朝红海据点）
    beileinisi: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'phalangite', count: 2 },         // Row 0 步兵前锋 = 马其顿方阵兵
            { type: 'companion_cavalry', count: 4 },  // Row 1 骑兵主力两翼合围 = 伙伴骑兵
            { type: 'cretan_archer', count: 3 },      // Row 2 中军后排支援 = 克里特弓手
        ],
    },
    // 昔兰尼加（班加西 · 托勒密一世养子马加斯）
    jileinaijia: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'phalangite', count: 2 },         // Row 0 步兵前锋 = 马其顿方阵兵
            { type: 'companion_cavalry', count: 4 },  // Row 1 骑兵主力两翼合围 = 伙伴骑兵
            { type: 'cretan_archer', count: 3 },      // Row 2 中军后排支援 = 克里特弓手
        ],
    },
    // 拉哥尼亚·斯巴达（列奥尼达 · 方形阵 3+3+3：全斯巴达希皮乌斯 300 勇士近卫阵）
    lagoniya: {
        formationMode: 'square',
        slots: [
            { type: 'hippeus', count: 3 },             // Row 0 前排 = 斯巴达希皮乌斯 3人
            { type: 'hippeus', count: 3 },             // Row 1 中坚 = 斯巴达希皮乌斯 3人
            { type: 'hippeus', count: 3 },             // Row 2 后排 = 斯巴达希皮乌斯 3人
        ],
    },
    // 底比斯（伊巴密浓达 · 方形阵 3+3+3：全底比斯圣队死士同袍阵）
    boootiya: {
        formationMode: 'square',
        slots: [
            { type: 'sacred_band', count: 3 },         // Row 0 前排 = 底比斯圣队 3人
            { type: 'sacred_band', count: 3 },         // Row 1 中坚 = 底比斯圣队 3人
            { type: 'sacred_band', count: 3 },         // Row 2 后排 = 底比斯圣队 3人
        ],
    },
    // 日本战国·织田信长军团（鹤翼阵 2+4+3：忍者 2 + 精锐武士 4 + 藤弓兵 3）
    owari: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'ninja', count: 2 },            // Row 0 前哨 = 忍者 2人
            { type: 'samurai_elite', count: 4 },    // Row 1 两翼合围主力 = 精锐武士 4人
            { type: 'rattan_archer', count: 3 },    // Row 2 中军托底 = 藤弓兵 3人
        ],
    },
    // 伊贺·忍者军团（方阵 3+3+3：忍者 3 + 忍者 3 + 忍者 3）
    iga_d: {
        formationMode: 'square',
        slots: [
            { type: 'ninja', count: 3 },        // Row 0 前排 = 忍者 3人
            { type: 'ninja', count: 3 },        // Row 1 中坚 = 忍者 3人
            { type: 'ninja', count: 3 }         // Row 2 后排 = 忍者 3人
        ],
    },
    // 罗马帝国·恺撒 / 君士坦丁 / 尤里安 / 庞培 百夫长精锐军团（鱼鳞阵 3+4+2：军团步兵前卫 3 + 精锐百夫长主力 4 + 百夫长 2）
    luoma_diguo: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'legionary', count: 3 },           // Row 0 前卫大盾抗线 = 罗马军团步兵 3人
            { type: 'elite_centurion', count: 4 },     // Row 1 中军突击主力 = 罗马百夫长精锐 4人
            { type: 'centurion', count: 2 },           // Row 2 尾收指挥调度 = 罗马百夫长 2人
        ],
    },
    gaolu_luoma: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'legionary', count: 3 },
            { type: 'elite_centurion', count: 4 },
            { type: 'centurion', count: 2 },
        ],
    },
    mozeer: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'legionary', count: 3 },
            { type: 'elite_centurion', count: 4 },
            { type: 'centurion', count: 2 },
        ],
    },
    aersasi: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'legionary', count: 3 },
            { type: 'elite_centurion', count: 4 },
            { type: 'centurion', count: 2 },
        ],
    },
    qiliqiya: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'legionary', count: 3 },
            { type: 'elite_centurion', count: 4 },
            { type: 'centurion', count: 2 },
        ],
    },
    // 阿契美尼德·波斯帝国军团（大流士 · 鹤翼阵 2+4+3：不死军长矛步兵 2 + 萨珊萨瓦尔铁骑主力 4 + 不死军复合弓箭手 3）
    aqimeinide: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'immortal', count: 2 },        // Row 0 步兵前锋 = 不死军长矛步兵 2人
            { type: 'savar', count: 4 },           // Row 1 骑兵主力两翼合围 = 萨珊萨瓦尔铁骑 4人
            { type: 'immortal_ranged', count: 3 }, // Row 2 中军后排支援 = 不死军复合弓箭手 3人
        ],
    },
    // 萨珊波斯军团（沙普尔大帝 · 尼沙布尔）
    aba: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'immortal', count: 2 },
            { type: 'savar', count: 4 },
            { type: 'immortal_ranged', count: 3 },
        ],
    },
    // 萨非波斯军团（阿拔斯大帝 · 伊斯法罕 · 方形阵 3+3+3：全红头骑士奇兹尔巴什圣战死士阵）
    safawei_d: {
        formationMode: 'square',
        slots: [
            { type: 'qizilbash_warrior', count: 3 },   // Row 0 前排 = 红头骑士 3人
            { type: 'qizilbash_warrior', count: 3 },   // Row 1 中坚 = 红头骑士 3人
            { type: 'qizilbash_warrior', count: 3 },   // Row 2 后排 = 红头骑士 3人
        ],
    },
    // 萨非波斯军团（伊斯玛仪一世 · 加兹温 · 方形阵 3+3+3：全红头骑士奇兹尔巴什圣战死士阵）
    safawei: {
        formationMode: 'square',
        slots: [
            { type: 'qizilbash_warrior', count: 3 },
            { type: 'qizilbash_warrior', count: 3 },
            { type: 'qizilbash_warrior', count: 3 },
        ],
    },
    // 安息波斯帝国（阿尔沙克 · 尼萨）
    ansxi: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'immortal', count: 2 },
            { type: 'savar', count: 4 },
            { type: 'immortal_ranged', count: 3 },
        ],
    },
    // 苏伦家族（苏伦 · 法拉）
    delan: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'immortal', count: 2 },
            { type: 'savar', count: 4 },
            { type: 'immortal_ranged', count: 3 },
        ],
    },
    // 卡伦家族（苏赫拉 · 图斯）
    kalan: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'immortal', count: 2 },
            { type: 'savar', count: 4 },
            { type: 'immortal_ranged', count: 3 },
        ],
    },
    // 米底王国（戴奥凯斯 · 哈马丹）
    midi: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'immortal', count: 2 },
            { type: 'savar', count: 4 },
            { type: 'immortal_ranged', count: 3 },
        ],
    },
    // 萨法尔王朝（雅库布 · 博斯特）
    xisi: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'immortal', count: 2 },
            { type: 'savar', count: 4 },
            { type: 'immortal_ranged', count: 3 },
        ],
    },
    // 埃兰古波斯（舒特鲁克 · 苏萨）
    ailan: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'immortal', count: 2 },
            { type: 'savar', count: 4 },
            { type: 'immortal_ranged', count: 3 },
        ],
    },
    // 萨尔巴达尔（拉扎克 · 白哈格）
    saerbadaer: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'immortal', count: 2 },
            { type: 'savar', count: 4 },
            { type: 'immortal_ranged', count: 3 },
        ],
    },
    // 库米斯（阿尔普 · 达姆甘）
    kumisi: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'immortal', count: 2 },
            { type: 'savar', count: 4 },
            { type: 'immortal_ranged', count: 3 },
        ],
    },
    // 哈利（戈达尔兹 · 萨拉赫斯）
    hali: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'immortal', count: 2 },
            { type: 'savar', count: 4 },
            { type: 'immortal_ranged', count: 3 },
        ],
    },
    // 巴哈尔兹（盖瓦姆 · 泰巴德）
    baha: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'immortal', count: 2 },
            { type: 'savar', count: 4 },
            { type: 'immortal_ranged', count: 3 },
        ],
    },
    // 波兰王国·华沙（雅盖沃 · 鹤翼阵 2+4+3：战锤破甲勇士 2 + 精锐翼骑兵主力 4 + 劲弩手 3）
    bolan: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'obuch', count: 2 },         // Row 0 步兵前锋 = 战锤破甲勇士 2人
            { type: 'winged_hussar', count: 4 }, // Row 1 骑兵主力两翼合围 = 精锐翼骑兵 4人
            { type: 'arbalest', count: 3 },      // Row 2 中军后排支援 = 劲弩手 3人
        ],
    },
    // 皮雅斯特王朝·克拉科夫（卡齐米日大帝）
    piyasite: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'obuch', count: 2 },
            { type: 'winged_hussar', count: 4 },
            { type: 'arbalest', count: 3 },
        ],
    },
    // 大波兰·波兹南（普热梅斯二世）
    dabolan: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'obuch', count: 2 },
            { type: 'winged_hussar', count: 4 },
            { type: 'arbalest', count: 3 },
        ],
    },
    // 立陶宛大公国·维尔纽斯（格迪米纳斯）
    litaowan: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'obuch', count: 2 },
            { type: 'winged_hussar', count: 4 },
            { type: 'arbalest', count: 3 },
        ],
    },
    // 涅曼·格罗德诺（维托夫特大帝）
    nieman: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'obuch', count: 2 },
            { type: 'winged_hussar', count: 4 },
            { type: 'arbalest', count: 3 },
        ],
    },
    // 条顿骑士团·柯尼斯堡（容金根 · 鹤翼阵 2+4+3：精锐条顿武士 2 + 十字军圣殿骑士主力 4 + 长弓兵 3）
    tiaodun_qishi: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'elite_teutonic_knight', count: 2 }, // Row 0 步兵前锋 = 精锐条顿武士 2人
            { type: 'crusader_knight', count: 4 },       // Row 1 骑兵主力两翼合围 = 十字军圣殿骑士 4人
            { type: 'longbowman', count: 3 },            // Row 2 中军后排支援 = 长弓兵 3人
        ],
    },
    // 圣殿骑士团·阿卡（莫莱 · 方形阵 3+3+3：全十字军骑士纯圣堂重骑冲击阵）
    shengdian_qishi: {
        formationMode: 'square',
        slots: [
            { type: 'crusader_knight', count: 3 },      // Row 0 前排 = 十字军骑士 3人
            { type: 'crusader_knight', count: 3 },      // Row 1 中坚 = 十字军骑士 3人
            { type: 'crusader_knight', count: 3 },      // Row 2 后排 = 十字军骑士 3人
        ],
    },
    // 宝剑骑士团·里加（阿尔伯特）
    baojian_qishi: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'elite_teutonic_knight', count: 2 },
            { type: 'crusader_knight', count: 4 },
            { type: 'longbowman', count: 3 },
        ],
    },
    // 利沃尼亚骑士团·塔林（普雷特贝格）
    liwoniya: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'elite_teutonic_knight', count: 2 },
            { type: 'crusader_knight', count: 4 },
            { type: 'longbowman', count: 3 },
        ],
    },
    // 拜占庭帝国·君士坦丁堡（巴西尔二世 / 福卡斯 · 鱼鳞阵 3+4+2：拜占庭圣骑兵 3 + 拜占庭圣骑兵精锐主力 4 + 复合弓手 2）
    baizanting: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'cataphract', count: 3 },        // Row 0 前卫 = 拜占庭圣骑兵 3人
            { type: 'elite_cataphract', count: 4 },  // Row 1 中军突破主力 = 拜占庭圣骑兵精锐 4人
            { type: 'composite_bowman', count: 2 },  // Row 2 尾收压阵 = 复合弓手 2人
        ],
    },
    kelite: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'cataphract', count: 3 },
            { type: 'elite_cataphract', count: 4 },
            { type: 'composite_bowman', count: 2 },
        ],
    },
    // 陶里卡·赫尔松涅斯（拜占庭克里米亚军区要塞）
    taolika: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'cataphract', count: 3 },
            { type: 'elite_cataphract', count: 4 },
            { type: 'composite_bowman', count: 2 },
        ],
    },
    // 达尔达尼亚·特洛伊（赫克托耳 · 古典希腊重骑战阵）
    teluoyi: {
        formationMode: 'square',
        slots: [
            { type: 'hippeus', count: 3 },
            { type: 'hippeus', count: 3 },
            { type: 'hippeus', count: 3 },
        ],
    },
    // 马耳他·圣约翰医院骑士团（瓦莱特 · 十字军骑士战阵）
    maerta_qishi: {
        formationMode: 'square',
        slots: [
            { type: 'crusader_knight', count: 3 },
            { type: 'crusader_knight', count: 3 },
            { type: 'crusader_knight', count: 3 },
        ],
    },
    // 不列颠·黑太子爱德华 / 阿尔弗雷德大帝 紫杉长弓兵精锐军团（三角阵 2+3+4：双手剑士前卫 2 + 长弓兵 3 + 精锐长弓兵主力 4）
    aquidan: {
        formationMode: 'triangle',
        slots: [
            { type: 'two_handed_swordsman', count: 2 }, // Row 0 尖刀坚壁 = 双手剑士 2人
            { type: 'longbowman', count: 3 },           // Row 1 齐射中坚 = 不列颠长弓兵 3人
            { type: 'longbowman_elite', count: 4 },     // Row 2 底边主力齐射 = 不列颠长弓兵精锐 4人
        ],
    },
    anggelu: {
        formationMode: 'triangle',
        slots: [
            { type: 'two_handed_swordsman', count: 2 },
            { type: 'longbowman', count: 3 },
            { type: 'longbowman_elite', count: 4 },
        ],
    },
    // 法兰克与法兰西·查理曼 / 查理马特 / 查理七世 / 吉尔德雷斯 掷斧兵与圣骑士精锐军团（鹤翼阵 2+4+3：掷斧兵前哨 2 + 精锐掷斧兵主力 4 + 游侠圣骑 3）
    jialuolin: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'throwing_axeman', count: 2 },       // Row 0 前哨飞斧破盾 = 法兰克掷斧兵 2人
            { type: 'elite_throwing_axeman', count: 4 }, // Row 1 狂暴突贯主力 = 法兰克掷斧兵精锐 4人
            { type: 'paladin', count: 3 },               // Row 2 中军后排圣骑驰援 = 游侠圣骑士 3人
        ],
    },
    falanji: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'throwing_axeman', count: 2 },
            { type: 'elite_throwing_axeman', count: 4 },
            { type: 'paladin', count: 3 },
        ],
    },
    gaolu: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'throwing_axeman', count: 2 },
            { type: 'elite_throwing_axeman', count: 4 },
            { type: 'paladin', count: 3 },
        ],
    },
    aermolika: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'throwing_axeman', count: 2 },
            { type: 'elite_throwing_axeman', count: 4 },
            { type: 'paladin', count: 3 },
        ],
    },
    // 西班牙·熙德 / 费尔南多三世 / 阿方索诸王 征服者火枪骑兵精锐军团（三角阵 2+3+4：重装长枪前卫 2 + 征服者 3 + 精锐征服者主力 4）
    balunxiya: {
        formationMode: 'triangle',
        slots: [
            { type: 'heavy_spearman', count: 2 },     // Row 0 尖刀坚壁 = 重装长枪兵 2人（大方阵前排抗线）
            { type: 'conquistador', count: 3 },       // Row 1 齐射中坚 = 西班牙征服者 3人
            { type: 'elite_conquistador', count: 4 }, // Row 2 底边主力齐射 = 西班牙征服者精锐 4人
        ],
    },
    guadaer: {
        formationMode: 'triangle',
        slots: [
            { type: 'heavy_spearman', count: 2 },
            { type: 'conquistador', count: 3 },
            { type: 'elite_conquistador', count: 4 },
        ],
    },
    kasidiliya: {
        formationMode: 'triangle',
        slots: [
            { type: 'heavy_spearman', count: 2 },
            { type: 'conquistador', count: 3 },
            { type: 'elite_conquistador', count: 4 },
        ],
    },
    leangongguo: {
        formationMode: 'triangle',
        slots: [
            { type: 'heavy_spearman', count: 2 },
            { type: 'conquistador', count: 3 },
            { type: 'elite_conquistador', count: 4 },
        ],
    },
    xigete: {
        formationMode: 'triangle',
        slots: [
            { type: 'heavy_spearman', count: 2 },
            { type: 'conquistador', count: 3 },
            { type: 'elite_conquistador', count: 4 },
        ],
    },
    alagong: {
        formationMode: 'triangle',
        slots: [
            { type: 'heavy_spearman', count: 2 },
            { type: 'conquistador', count: 3 },
            { type: 'elite_conquistador', count: 4 },
        ],
    },
    // 北欧与维京·阿布萨隆 / 卡尔九世 / 比尔格雅尔 狂战士精锐军团（鱼鳞阵 3+4+2：狂战士前卫 3 + 精锐狂战士主力 4 + 弓兵 2）
    danmai: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'berserk', count: 3 },       // Row 0 前卫冲锋 = 维京狂战士 3人
            { type: 'elite_berserk', count: 4 }, // Row 1 中军狂暴主力 = 维京狂战士精锐 4人
            { type: 'bowman', count: 2 },        // Row 2 尾收吊射掩护 = 弓兵 2人
        ],
    },
    ruidian_yota: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'berserk', count: 3 },
            { type: 'elite_berserk', count: 4 },
            { type: 'bowman', count: 2 },
        ],
    },
    ruidian_si: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'berserk', count: 3 },
            { type: 'elite_berserk', count: 4 },
            { type: 'bowman', count: 2 },
        ],
    },
    // 扎扬王朝·特莱姆森（亚格姆拉森 · 三角阵 2+3+4：萨拉森马穆鲁克 2 + 柏柏尔标枪骑兵 3 + 柏柏尔骆驼弓骑主力 4）
    zhayan: {
        formationMode: 'triangle',
        slots: [
            { type: 'mameluke', count: 2 },      // Row 0 尖刀先锋 = 萨拉森马穆鲁克 2人
            { type: 'genitour', count: 3 },      // Row 1 冲击中坚 = 柏柏尔标枪骑兵 3人
            { type: 'camel_archer', count: 4 },  // Row 2 底边主力齐射 = 柏柏尔骆驼弓骑 4人
        ],
    },
    // 哈马德王朝·布佳亚（哈马德）
    hamade: {
        formationMode: 'triangle',
        slots: [
            { type: 'mameluke', count: 2 },
            { type: 'genitour', count: 3 },
            { type: 'camel_archer', count: 4 },
        ],
    },
    // 阿格拉布王朝·凯鲁万（奥克巴）
    aguelabu: {
        formationMode: 'triangle',
        slots: [
            { type: 'mameluke', count: 2 },
            { type: 'genitour', count: 3 },
            { type: 'camel_archer', count: 4 },
        ],
    },
    // 伊德里斯王朝·非斯（伊德里斯一世）
    yidelisi: {
        formationMode: 'triangle',
        slots: [
            { type: 'mameluke', count: 2 },
            { type: 'genitour', count: 3 },
            { type: 'camel_archer', count: 4 },
        ],
    },
    // 穆拉比特王朝·马拉喀什（塔什芬）
    mulabite: {
        formationMode: 'triangle',
        slots: [
            { type: 'mameluke', count: 2 },
            { type: 'genitour', count: 3 },
            { type: 'camel_archer', count: 4 },
        ],
    },
    // 巴巴里海岸·阿尔及尔（巴巴罗萨·海雷丁）
    babali: {
        formationMode: 'triangle',
        slots: [
            { type: 'mameluke', count: 2 },
            { type: 'genitour', count: 3 },
            { type: 'camel_archer', count: 4 },
        ],
    },
    // 的黎波里塔尼亚·的黎波里（德拉古特）
    telibolisi: {
        formationMode: 'triangle',
        slots: [
            { type: 'mameluke', count: 2 },
            { type: 'genitour', count: 3 },
            { type: 'camel_archer', count: 4 },
        ],
    },
    // 休达·直布罗陀（海峡哨塞）
    zhibuluotuo: {
        formationMode: 'triangle',
        slots: [
            { type: 'mameluke', count: 2 },
            { type: 'genitour', count: 3 },
            { type: 'camel_archer', count: 4 },
        ],
    },
};

