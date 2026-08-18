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
    // 马其顿·亚历山大帝国军团（雁行阵 4+3+2：马其顿方阵兵 4 + 伙伴骑兵 3 + 克里特弓手 2）
    maqidun: {
        formationMode: 'echelon',
        slots: [
            { type: 'phalangite', count: 4 },         // Row 0 步兵前锋抗线 = 马其顿方阵兵 4人
            { type: 'companion_cavalry', count: 3 },  // Row 1 骑兵冲击中坚 = 伙伴骑兵 3骑
            { type: 'cretan_archer', count: 2 },      // Row 2 中军后排支援 = 克里特弓手 2人
        ],
    },
    // 托勒密（亚历山大旧部，套用亚历山大帝国军团配置）
    tuolemi: {
        formationMode: 'echelon',
        slots: [
            { type: 'phalangite', count: 4 },         // Row 0 步兵前锋抗线 = 马其顿方阵兵 4人
            { type: 'companion_cavalry', count: 3 },  // Row 1 骑兵冲击中坚 = 伙伴骑兵 3骑
            { type: 'cretan_archer', count: 2 },      // Row 2 中军后排支援 = 克里特弓手 2人
        ],
    },
    // 塞琉古帝国（安提俄基亚 · 塞琉古一世/安条克，银盾方阵体系）
    sailiugu: {
        formationMode: 'echelon',
        slots: [
            { type: 'phalangite', count: 4 },         // Row 0 步兵前锋抗线 = 马其顿方阵兵 4人
            { type: 'companion_cavalry', count: 3 },  // Row 1 骑兵冲击中坚 = 伙伴骑兵 3骑
            { type: 'cretan_archer', count: 2 },      // Row 2 中军后排支援 = 克里特弓手 2人
        ],
    },
    // 佩尔加蒙（欧迈尼斯 · 亚历山大王家秘书长与近卫方阵统帅）
    pajiama: {
        formationMode: 'echelon',
        slots: [
            { type: 'phalangite', count: 4 },         // Row 0 步兵前锋抗线 = 马其顿方阵兵 4人
            { type: 'companion_cavalry', count: 3 },  // Row 1 骑兵冲击中坚 = 伙伴骑兵 3骑
            { type: 'cretan_archer', count: 2 },      // Row 2 中军后排支援 = 克里特弓手 2人
        ],
    },
    // 贝雷尼斯（托勒密二世 · 托勒密王朝红海据点）
    beileinisi: {
        formationMode: 'echelon',
        slots: [
            { type: 'phalangite', count: 4 },         // Row 0 步兵前锋抗线 = 马其顿方阵兵 4人
            { type: 'companion_cavalry', count: 3 },  // Row 1 骑兵冲击中坚 = 伙伴骑兵 3骑
            { type: 'cretan_archer', count: 2 },      // Row 2 中军后排支援 = 克里特弓手 2人
        ],
    },
    // 昔兰尼加（班加西 · 托勒密一世养子马加斯）
    jileinaijia: {
        formationMode: 'echelon',
        slots: [
            { type: 'phalangite', count: 4 },         // Row 0 步兵前锋抗线 = 马其顿方阵兵 4人
            { type: 'companion_cavalry', count: 3 },  // Row 1 骑兵冲击中坚 = 伙伴骑兵 3骑
            { type: 'cretan_archer', count: 2 },      // Row 2 中军后排支援 = 克里特弓手 2人
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
    // 日本战国·织田信长军团（方阵 3+3+3：日本武士 3 + 火枪兵 3 + 火枪兵 3）
    owari: {
        formationMode: 'square',
        slots: [
            { type: 'samurai', count: 3 },          // Row 0 前排抗线 = 日本武士 3人
            { type: 'hand_cannoneer', count: 3 },   // Row 1 中军铁炮齐射 = 火枪兵 3人
            { type: 'hand_cannoneer', count: 3 },   // Row 2 后排铁炮齐射 = 火枪兵 3人
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
    // 立陶宛大公国·维尔纽斯 / 涅曼·格罗德诺（格迪米纳斯 / 维托夫特 列提斯破甲铁骑与劲弩精锐军团 · 鱼鳞阵 3+4+2：列提斯前卫 3 + 精锐列提斯主力 4 + 劲弩手 2）
    litaowan: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'leitis', count: 3 },        // Row 0 前卫突击 = 立陶宛列提斯 3骑
            { type: 'elite_leitis', count: 4 },  // Row 1 中军主力撕裂 = 立陶宛列提斯精锐 4骑（无视护甲之王主力突破）
            { type: 'arbalest', count: 2 },      // Row 2 尾收远程压阵 = 劲弩手 2人（SLAVIC 文化区标准远程）
        ],
    },
    nieman: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'leitis', count: 3 },
            { type: 'elite_leitis', count: 4 },
            { type: 'arbalest', count: 2 },
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
            { type: 'heavy_pikeman', count: 2 },     // Row 0 尖刀坚壁 = 重长枪兵 2人（LATIN 文化区标准前排）
            { type: 'conquistador', count: 3 },       // Row 1 齐射中坚 = 西班牙征服者 3人
            { type: 'elite_conquistador', count: 4 }, // Row 2 底边主力齐射 = 西班牙征服者精锐 4人
        ],
    },
    guadaer: {
        formationMode: 'triangle',
        slots: [
            { type: 'heavy_pikeman', count: 2 },
            { type: 'conquistador', count: 3 },
            { type: 'elite_conquistador', count: 4 },
        ],
    },
    kasidiliya: {
        formationMode: 'triangle',
        slots: [
            { type: 'heavy_pikeman', count: 2 },
            { type: 'conquistador', count: 3 },
            { type: 'elite_conquistador', count: 4 },
        ],
    },
    leangongguo: {
        formationMode: 'triangle',
        slots: [
            { type: 'heavy_pikeman', count: 2 },
            { type: 'conquistador', count: 3 },
            { type: 'elite_conquistador', count: 4 },
        ],
    },
    xigete: {
        formationMode: 'triangle',
        slots: [
            { type: 'heavy_pikeman', count: 2 },
            { type: 'conquistador', count: 3 },
            { type: 'elite_conquistador', count: 4 },
        ],
    },
    alagong: {
        formationMode: 'triangle',
        slots: [
            { type: 'heavy_pikeman', count: 2 },
            { type: 'conquistador', count: 3 },
            { type: 'elite_conquistador', count: 4 },
        ],
    },
    // 北欧与维京·阿布萨隆 / 卡尔九世 / 比尔格雅尔 狂战士精锐军团（鱼鳞阵 3+4+2：狂战士前卫 3 + 精锐狂战士主力 4 + 掷矛手 2）
    danmai: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'berserk', count: 3 },       // Row 0 前卫冲锋 = 维京狂战士 3人
            { type: 'elite_berserk', count: 4 }, // Row 1 中军狂暴主力 = 维京狂战士精锐 4人
            { type: 'skirmisher', count: 2 },    // Row 2 尾收远程投掷 = 掷矛手 2人（维京接敌前标志性标枪破盾）
        ],
    },
    ruidian_yota: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'berserk', count: 3 },
            { type: 'elite_berserk', count: 4 },
            { type: 'skirmisher', count: 2 },
        ],
    },
    ruidian_si: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'berserk', count: 3 },
            { type: 'elite_berserk', count: 4 },
            { type: 'skirmisher', count: 2 },
        ],
    },
    // 高丽王朝·王建 / 姜邯赞 / 崔茂宣 / 尹瓘 / 金就砺 高丽战车箭楼与重步兵精锐军团（三角阵 2+3+4：纯步兵刀剑手前卫 2 + 高丽战车 3 + 精锐高丽战车主力 4）
    goryeo: {
        formationMode: 'triangle',
        slots: [
            { type: 'jian_swordsman', count: 2 },   // Row 0 尖刀抗线 = 华夏刀剑手 2人（纯步兵·无马，持盾筑起坚壁掩护）
            { type: 'war_wagon', count: 3 },        // Row 1 齐射中坚 = 高丽战车 3台
            { type: 'elite_war_wagon', count: 4 },  // Row 2 底边主力齐射 = 高丽战车精锐 4台（重型移动战车主力破敌）
        ],
    },
    chungju_d: {
        formationMode: 'triangle',
        slots: [
            { type: 'jian_swordsman', count: 2 },
            { type: 'war_wagon', count: 3 },
            { type: 'elite_war_wagon', count: 4 },
        ],
    },
    sabeol: {
        formationMode: 'triangle',
        slots: [
            { type: 'jian_swordsman', count: 2 },
            { type: 'war_wagon', count: 3 },
            { type: 'elite_war_wagon', count: 4 },
        ],
    },
    hai2: {
        formationMode: 'triangle',
        slots: [
            { type: 'jian_swordsman', count: 2 },
            { type: 'war_wagon', count: 3 },
            { type: 'elite_war_wagon', count: 4 },
        ],
    },
    woju: {
        formationMode: 'triangle',
        slots: [
            { type: 'jian_swordsman', count: 2 },
            { type: 'war_wagon', count: 3 },
            { type: 'elite_war_wagon', count: 4 },
        ],
    },
    // 奥斯曼与小亚细亚·基利杰阿尔斯兰 耶尼切里禁卫火枪精锐军团（三角阵 2+3+4：东方剑士前卫 2 + 土耳其禁卫军 3 + 精锐土耳其禁卫军主力 4）
    luomu: {
        formationMode: 'triangle',
        slots: [
            { type: 'eastern_swordsman', count: 2 },  // Row 0 尖刀抗线 = 东方剑士 2人（纯步兵·无马，持弯刀圆盾筑起防线）
            { type: 'janissary', count: 3 },          // Row 1 齐射中坚 = 土耳其禁卫军 3人
            { type: 'elite_janissary', count: 4 },    // Row 2 底边主力齐射 = 土耳其禁卫军精锐 4人（重型火绳枪主力齐射破阵）
        ],
    },
    // 波希米亚与捷克·扬·杰式卡 胡斯战车车阵精锐军团（三角阵 2+3+4：冠军剑士前卫 2 + 胡斯战车 3 + 精锐胡斯战车主力 4）
    boximiya: {
        formationMode: 'triangle',
        slots: [
            { type: 'champion', count: 2 },            // Row 0 尖刀抗线 = 冠军剑士 2人（纯步兵·无马，持重剑抗线护卫车阵）
            { type: 'hussite_wagon', count: 3 },       // Row 1 齐射中坚 = 波希米亚胡斯战车 3台（装甲车阵要塞）
            { type: 'elite_hussite_wagon', count: 4 }, // Row 2 底边主力齐射 = 波希米亚胡斯战车精锐 4台（主力重装战车要塞齐射）
        ],
    },
    // 意大利与热那亚·安德烈亚·多利亚 / 丹多洛 / 洛伦佐 / 斯福尔扎 / 乌戈里诺 大盾重弩与长枪精锐军团（三角阵 2+3+4：重装长枪前卫 2 + 热那亚弩手 3 + 精锐热那亚弩手主力 4）
    liguliya: {
        formationMode: 'triangle',
        slots: [
            { type: 'heavy_pikeman', count: 2 },              // Row 0 尖刀坚壁 = 重装长枪兵 2人（纯步兵·无马，长枪结阵阻击骑兵）
            { type: 'genoese_crossbowman', count: 3 },        // Row 1 齐射中坚 = 意大利热那亚弩手 3人（背负大盾强弩齐射）
            { type: 'elite_genoese_crossbowman', count: 4 },  // Row 2 底边主力齐射 = 意大利热那亚弩手精锐 4人（超远破甲重弩主力齐射）
        ],
    },
    anuo: {
        formationMode: 'triangle',
        slots: [
            { type: 'heavy_pikeman', count: 2 },
            { type: 'genoese_crossbowman', count: 3 },
            { type: 'elite_genoese_crossbowman', count: 4 },
        ],
    },
    tuosikana: {
        formationMode: 'triangle',
        slots: [
            { type: 'heavy_pikeman', count: 2 },
            { type: 'genoese_crossbowman', count: 3 },
            { type: 'elite_genoese_crossbowman', count: 4 },
        ],
    },
    lunbadi: {
        formationMode: 'triangle',
        slots: [
            { type: 'heavy_pikeman', count: 2 },
            { type: 'genoese_crossbowman', count: 3 },
            { type: 'elite_genoese_crossbowman', count: 4 },
        ],
    },
    yadelaiya: {
        formationMode: 'triangle',
        slots: [
            { type: 'heavy_pikeman', count: 2 },
            { type: 'genoese_crossbowman', count: 3 },
            { type: 'elite_genoese_crossbowman', count: 4 },
        ],
    },
    // 葡萄牙·阿方索一世 / 桑乔一世 风琴炮火器与长枪精锐军团（三角阵 2+3+4：重装长枪前卫 2 + 葡萄牙风琴炮 3 + 精锐风琴炮主力 4）
    putaoya: {
        formationMode: 'triangle',
        slots: [
            { type: 'heavy_pikeman', count: 2 },        // Row 0 尖刀坚壁 = 重装长枪兵 2人（纯步兵·无马，长枪结阵阻击骑兵护卫炮阵）
            { type: 'organ_gun', count: 3 },            // Row 1 齐射中坚 = 葡萄牙风琴炮 3台（多管火炮齐射）
            { type: 'elite_organ_gun', count: 4 },      // Row 2 底边主力齐射 = 葡萄牙风琴炮精锐 4台（重型风琴炮主力轰击）
        ],
    },
    duluo: {
        formationMode: 'triangle',
        slots: [
            { type: 'heavy_pikeman', count: 2 },
            { type: 'organ_gun', count: 3 },
            { type: 'elite_organ_gun', count: 4 },
        ],
    },
    // 格鲁吉亚·塔玛尔女王 莫纳斯帕王家近卫铁骑精锐军团（鱼鳞阵 3+4+2：莫纳斯帕前卫 3 + 精锐莫纳斯帕主力 4 + 复合弓手 2）
    gelujiya: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'monaspa', count: 3 },              // Row 0 前卫冲击 = 格鲁吉亚莫纳斯帕 3骑
            { type: 'elite_monaspa', count: 4 },        // Row 1 中军破阵主力 = 格鲁吉亚莫纳斯帕精锐 4骑（王家近卫铁骑主力）
            { type: 'composite_bowman', count: 2 },     // Row 2 尾收远程掩护 = 复合弓手 2人（WEST_ASIA 文化区标准远程）
        ],
    },
    // 缅甸与中南半岛·莽应龙 / 莽瑞体 / 雍笈牙 / 摩罗 / 摩奴诃 飞镖骑兵与爪刀精锐军团（鱼鳞阵 3+4+2：飞镖骑兵前卫 3 + 精锐飞镖骑兵主力 4 + 爪刀勇士 2）
    hantawadi: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'arambai', count: 3 },               // Row 0 前卫袭扰 = 缅甸飞镖骑兵 3骑（高速投掷剧毒飞镖）
            { type: 'elite_arambai', count: 4 },         // Row 1 中军主力破阵 = 缅甸飞镖骑兵精锐 4骑（主力投掷暴击）
            { type: 'karambit_warrior', count: 2 },      // Row 2 尾收近战压阵 = 爪刀勇士 2人（纯步兵·无马，持双爪刀近身肉搏护卫）
        ],
    },
    dongxu: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'arambai', count: 3 },
            { type: 'elite_arambai', count: 4 },
            { type: 'karambit_warrior', count: 2 },
        ],
    },
    konbaung: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'arambai', count: 3 },
            { type: 'elite_arambai', count: 4 },
            { type: 'karambit_warrior', count: 2 },
        ],
    },
    pyu: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'arambai', count: 3 },
            { type: 'elite_arambai', count: 4 },
            { type: 'karambit_warrior', count: 2 },
        ],
    },
    mon: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'arambai', count: 3 },
            { type: 'elite_arambai', count: 4 },
            { type: 'karambit_warrior', count: 2 },
        ],
    },
    // 扶南与高棉·范蔓 / 刀更孟 弩炮战象与爪刀精锐军团（三角阵 2+3+4：爪刀勇士前卫 2 + 弩炮战象 3 + 精锐弩炮战象主力 4）
    funan: {
        formationMode: 'triangle',
        slots: [
            { type: 'karambit_warrior', count: 2 },            // Row 0 尖刀抗线 = 爪刀勇士 2人（纯步兵·无马，持双爪刀贴身死守战象防线）
            { type: 'ballista_elephant', count: 3 },          // Row 1 齐射中坚 = 高棉弩炮战象 3头（背负双发重型弩炮齐射）
            { type: 'elite_ballista_elephant', count: 4 },    // Row 2 底边主力齐射 = 高棉弩炮战象精锐 4头（巨型重装弩炮战象主力超强贯穿火力）
        ],
    },
    basha_d: {
        formationMode: 'triangle',
        slots: [
            { type: 'karambit_warrior', count: 2 },
            { type: 'ballista_elephant', count: 3 },
            { type: 'elite_ballista_elephant', count: 4 },
        ],
    },
    // 西西里与诺曼·腓特烈二世 / 罗杰二世 / 埃莱奥诺拉 军士长方阵与劲弩精锐军团（鱼鳞阵 3+4+2：军士长前卫 3 + 精锐军士长主力 4 + 劲弩手 2）
    xixiliwangguo: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'serjeant', count: 3 },            // Row 0 前卫坚壁 = 西西里军士长 3人（纯步兵·无马，持诺曼大盾长枪正面结阵抗线）
            { type: 'elite_serjeant', count: 4 },      // Row 1 中军主力破阵 = 西西里军士长精锐 4人（主力重装步兵方阵推进）
            { type: 'arbalest', count: 2 },            // Row 2 尾收远程压制 = 劲弩手 2人（纯步兵·无马，后排破甲重弩强力压制）
        ],
    },
    moxina: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'serjeant', count: 3 },
            { type: 'elite_serjeant', count: 4 },
            { type: 'arbalest', count: 2 },
        ],
    },
    sading: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'serjeant', count: 3 },
            { type: 'elite_serjeant', count: 4 },
            { type: 'arbalest', count: 2 },
        ],
    },
    // 勃艮第与弗兰德·罗贝尔二世 马上轻骑与强弩精锐军团（鱼鳞阵 3+4+2：马上轻骑前卫 3 + 精锐马上轻骑主力 4 + 弩兵 2）
    fulandesi: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'coustillier', count: 3 },        // Row 0 前卫突击 = 勃艮第马上轻骑 3骑（前锋突击）
            { type: 'elite_coustillier', count: 4 },  // Row 1 中军主力爆发 = 勃艮第马上轻骑精锐 4骑（冲锋一击蓄力爆发主力）
            { type: 'crossbowman', count: 2 },        // Row 2 尾收远程压制 = 弩兵 2人（纯步兵·无马，后排强弩齐射破盾）
        ],
    },
    // 萨拉森与阿拉伯·萨拉赫丁 / 穆阿维叶 马穆鲁克弯刀重骑与骆驼弓精锐军团（鱼鳞阵 3+4+2：马穆鲁克前卫 3 + 精锐马穆鲁克主力 4 + 骆驼弓骑 2）
    ayoubu: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'mameluke', count: 3 },            // Row 0 前卫突击 = 萨拉森马穆鲁克 3骑（弯刀重骑前锋撕裂）
            { type: 'elite_mameluke', count: 4 },      // Row 1 中军主力劈杀 = 萨拉森马穆鲁克精锐 4骑（近卫重骑主力突破）
            { type: 'camel_archer', count: 2 },        // Row 2 尾收远程掩护 = 柏柏尔骆驼弓骑 2骑（高机动骆驼骑射压制）
        ],
    },
    womaya: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'mameluke', count: 3 },
            { type: 'elite_mameluke', count: 4 },
            { type: 'camel_archer', count: 2 },
        ],
    },
    // 哥特·狄奥多里克大帝 哥特近卫军盾墙与弩手精锐军团（鱼鳞阵 3+4+2：哥特近卫军前卫 3 + 精锐哥特近卫军主力 4 + 弩兵 2）
    donggete: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'huskarl', count: 3 },            // Row 0 前卫坚壁 = 哥特近卫军 3人（纯步兵·无马，持重盾顶着箭雨推进）
            { type: 'elite_huskarl', count: 4 },      // Row 1 中军主力破阵 = 哥特近卫军精锐 4人（主力近卫步兵盾墙撕裂）
            { type: 'crossbowman', count: 2 },        // Row 2 尾收远程压制 = 弩兵 2人（纯步兵·无马，后排强弩射击压制）
        ],
    },
    // 保加利亚·西美昂大帝 龙骑兵突击与复合弓精锐军团（鱼鳞阵 3+4+2：保加利亚骑兵前卫 3 + 精锐保加利亚骑兵主力 4 + 复合弓手 2）
    seleisi: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'konnik', count: 3 },               // Row 0 前卫突击 = 保加利亚骑兵 3骑（前锋冲锋）
            { type: 'elite_konnik', count: 4 },         // Row 1 中军主力破阵 = 保加利亚骑兵精锐 4骑（龙骑兵主力突破）
            { type: 'composite_bowman', count: 2 },     // Row 2 尾收远程掩护 = 复合弓手 2人（纯步兵·无马，后排复合弓吊射）
        ],
    },
    // 保加利亚帝国·克鲁姆大汗 下马保加利亚勇士死斗军团（鱼鳞阵 3+4+2：下马保加利亚骑兵前卫 3 + 下马保加利亚骑兵精锐主力 4 + 复合弓手 2）
    saierdika: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'konnik_foot', count: 3 },             // Row 0 前卫坚盾 = 下马保加利亚骑兵 3人（纯步兵·无马，重盾前卫抗线破阵）
            { type: 'elite_konnik_foot', count: 4 },       // Row 1 中军主力 = 下马保加利亚骑兵精锐 4人（纯步兵·无马，王牌重装勇士主力死斗血战）
            { type: 'composite_bowman', count: 2 },        // Row 2 尾收远射 = 复合弓手 2人（纯步兵·无马，后方步弓压制掩护）
        ],
    },
    // 凯尔特与苏格兰·威廉·华莱士 / 奥恩格斯 / 多姆纳尔 靛蓝突袭者与长弓精锐军团（鱼鳞阵 3+4+2：靛蓝突袭者前卫 3 + 精锐靛蓝突袭者主力 4 + 长弓兵 2）
    kanbuliya: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'woad_raider', count: 3 },          // Row 0 前卫突袭 = 凯尔特靛蓝突袭者 3人（纯步兵·无马，高速突袭）
            { type: 'elite_woad_raider', count: 4 },    // Row 1 中军主力破阵 = 凯尔特靛蓝突袭者精锐 4人（主力狂暴劈杀）
            { type: 'longbowman', count: 2 },           // Row 2 尾收远程吊射 = 长弓兵 2人（纯步兵·无马，后排战弓抛射压制）
        ],
    },
    piketai: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'woad_raider', count: 3 },
            { type: 'elite_woad_raider', count: 4 },
            { type: 'longbowman', count: 2 },
        ],
    },
    gaer: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'woad_raider', count: 3 },
            { type: 'elite_woad_raider', count: 4 },
            { type: 'longbowman', count: 2 },
        ],
    },
    // 印度与达罗毗荼·旃陀罗笈多 / 戒日王 / 频毗娑罗 / 达磨波罗 / 梵摩达 / 苏摩 软剑士与象弓精锐军团（鱼鳞阵 3+4+2：软剑士前卫 3 + 精锐软剑士主力 4 + 象弓骑兵 2）
    kongque: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'urumi_swordsman', count: 3 },          // Row 0 前卫突击 = 达罗毗荼软剑士 3人（纯步兵·无马，持双刃软剑高速回旋）
            { type: 'elite_urumi_swordsman', count: 4 },    // Row 1 中军主力撕裂 = 达罗毗荼软剑士精锐 4人（主力钢带软剑旋斩破阵）
            { type: 'elephant_archer', count: 2 },          // Row 2 尾收远程压制 = 印度象弓骑兵 2头（战象背负箭楼高台抛射）
        ],
    },
    jieri: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'urumi_swordsman', count: 3 },
            { type: 'elite_urumi_swordsman', count: 4 },
            { type: 'elephant_archer', count: 2 },
        ],
    },
    mojietuo: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'urumi_swordsman', count: 3 },
            { type: 'elite_urumi_swordsman', count: 4 },
            { type: 'elephant_archer', count: 2 },
        ],
    },
    boluo: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'urumi_swordsman', count: 3 },
            { type: 'elite_urumi_swordsman', count: 4 },
            { type: 'elephant_archer', count: 2 },
        ],
    },
    jiashi_d: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'urumi_swordsman', count: 3 },
            { type: 'elite_urumi_swordsman', count: 4 },
            { type: 'elephant_archer', count: 2 },
        ],
    },
    sumo: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'urumi_swordsman', count: 3 },
            { type: 'elite_urumi_swordsman', count: 4 },
            { type: 'elephant_archer', count: 2 },
        ],
    },
    // 印度斯坦与德里苏丹·阿拉乌丁·卡尔吉 / 阿克巴大帝 古拉姆重装近卫与象弓精锐军团（鱼鳞阵 3+4+2：古拉姆前卫 3 + 精锐古拉姆主力 4 + 象弓骑兵 2）
    deli: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'ghulam', count: 3 },              // Row 0 前卫坚壁 = 印度斯坦古拉姆 3人（纯步兵·无马，持长枪重剑正面结阵）
            { type: 'elite_ghulam', count: 4 },        // Row 1 中军主力破阵 = 印度斯坦古拉姆精锐 4人（近卫铁甲主力强力破阵）
            { type: 'elephant_archer', count: 2 },     // Row 2 尾收远程压制 = 印度象弓骑兵 2头（战象背负箭楼高台抛射）
        ],
    },
    mowoer: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'ghulam', count: 3 },
            { type: 'elite_ghulam', count: 4 },
            { type: 'elephant_archer', count: 2 },
        ],
    },
    // 印度与锡克·兰季特·辛格 / 拉其特 / 哈里·辛格 飞轮掷手漫天破阵精锐军团（三角阵 2+3+4：重装长枪前卫 2 + 飞轮掷手 3 + 精锐飞轮掷手主力 4）
    xike: {
        formationMode: 'triangle',
        slots: [
            { type: 'heavy_pikeman', count: 2 },           // Row 0 尖刀坚壁 = 重装长枪兵 2人（纯步兵·无马，前排抗线拒马）
            { type: 'chakram_thrower', count: 3 },         // Row 1 中军投射 = 古吉拉特飞轮掷手 3人（纯步兵·无马，中距离回旋飞轮）
            { type: 'elite_chakram_thrower', count: 4 },   // Row 2 底边主力弹幕 = 古吉拉特飞轮掷手精锐 4人（纯步兵·无马，漫天飞轮破阵）
        ],
    },
    ahaomu: {
        formationMode: 'triangle',
        slots: [
            { type: 'heavy_pikeman', count: 2 },
            { type: 'chakram_thrower', count: 3 },
            { type: 'elite_chakram_thrower', count: 4 },
        ],
    },
    pangzha: {
        formationMode: 'triangle',
        slots: [
            { type: 'heavy_pikeman', count: 2 },
            { type: 'chakram_thrower', count: 3 },
            { type: 'elite_chakram_thrower', count: 4 },
        ],
    },
    // 迦太基与布匿·汉尼拔 / 哈米尔卡 战象践踏与标枪精锐军团（鱼鳞阵 3+4+2：战象前卫 3 + 精锐战象主力 4 + 掷矛手 2）
    buni: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'war_elephant', count: 3 },            // Row 0 前卫突击 = 战象 3头（前锋战象破障践踏）
            { type: 'elite_war_elephant', count: 4 },      // Row 1 中军主力破阵 = 战象精锐 4头（主力战象方阵撕裂敌线）
            { type: 'skirmisher', count: 2 },              // Row 2 尾收远程掩护 = 掷矛手 2人（纯步兵·无马，后排重标枪抛掷压制）
        ],
    },
    feiniqi: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'war_elephant', count: 3 },
            { type: 'elite_war_elephant', count: 4 },
            { type: 'skirmisher', count: 2 },
        ],
    },
    // 古埃及与美索不达米亚·拉美西斯 / 图特摩斯 / 卢伽尔扎克西 / 尼布甲尼撒 / 萨尔贡 / 沙姆希阿达德 古典双轮战车突击与近卫剑士精锐军团（三角阵 2+3+4：东方剑士前卫 2 + 双轮战车 3 + 精锐双轮战车主力 4）
    aiji: {
        formationMode: 'triangle',
        slots: [
            { type: 'eastern_swordsman', count: 2 },    // Row 0 尖刀坚壁 = 东方剑士 2人（纯步兵·无马，持盾短剑前排抗线）
            { type: 'war_chariot', count: 3 },          // Row 1 中军战车 = 双轮战车 3乘（双轮冲锋战车破障）
            { type: 'elite_war_chariot', count: 4 },    // Row 2 底边主力车阵 = 双轮战车精锐 4乘（王家双轮战车主力撕裂敌阵）
        ],
    },
    dibisi: {
        formationMode: 'triangle',
        slots: [
            { type: 'eastern_swordsman', count: 2 },
            { type: 'war_chariot', count: 3 },
            { type: 'elite_war_chariot', count: 4 },
        ],
    },
    sumeier: {
        formationMode: 'triangle',
        slots: [
            { type: 'eastern_swordsman', count: 2 },
            { type: 'war_chariot', count: 3 },
            { type: 'elite_war_chariot', count: 4 },
        ],
    },
    jialedi: {
        formationMode: 'triangle',
        slots: [
            { type: 'eastern_swordsman', count: 2 },
            { type: 'war_chariot', count: 3 },
            { type: 'elite_war_chariot', count: 4 },
        ],
    },
    yashu: {
        formationMode: 'triangle',
        slots: [
            { type: 'eastern_swordsman', count: 2 },
            { type: 'war_chariot', count: 3 },
            { type: 'elite_war_chariot', count: 4 },
        ],
    },
    guyashu: {
        formationMode: 'triangle',
        slots: [
            { type: 'eastern_swordsman', count: 2 },
            { type: 'war_chariot', count: 3 },
            { type: 'elite_war_chariot', count: 4 },
        ],
    },
    // 中南半岛·纳黎萱 / 阿奴律陀 / 阇耶跋摩 东南亚战象与步弓精锐军团（鱼鳞阵 3+4+2：战斗象前卫 3 + 精锐战斗象主力 4 + 步弓手 2）
    siam: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'battle_elephant', count: 3 },        // Row 0 前卫突击 = 东南亚战斗象 3头（前锋战象破阵践踏）
            { type: 'elite_battle_elephant', count: 4 },  // Row 1 中军主力 = 东南亚战斗象精锐 4头（王家近卫精锐战象主力冲锋）
            { type: 'archer', count: 2 },                 // Row 2 尾收远射 = 步弓手 2人（纯步兵·无马，后方步弓压制）
        ],
    },
    pagan: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'battle_elephant', count: 3 },
            { type: 'elite_battle_elephant', count: 4 },
            { type: 'archer', count: 2 },
        ],
    },
    chenla: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'battle_elephant', count: 3 },
            { type: 'elite_battle_elephant', count: 4 },
            { type: 'archer', count: 2 },
        ],
    },
    // 阿拉伯与近东·哈立德 / 曼苏尔 / 艾布苏富扬 / 齐亚德 骆驼弓骑精锐军团（三角阵 2+3+4：东方剑士前锋 2 + 骆驼弓骑 3 + 精锐骆驼弓骑主力 4）
    maidina: {
        formationMode: 'triangle',
        slots: [
            { type: 'eastern_swordsman', count: 2 },      // Row 0 尖刀先锋 = 东方剑士 2人（纯步兵·无马，弯刀前排坚壁抗线）
            { type: 'camel_archer', count: 3 },           // Row 1 冲击中坚 = 骆驼弓骑兵 3骑（大漠机动奔袭）
            { type: 'elite_camel_archer', count: 4 },     // Row 2 底边主力齐射 = 精锐骆驼弓骑兵 4骑（王牌精锐大漠重弓齐射）
        ],
    },
    abasi: {
        formationMode: 'triangle',
        slots: [
            { type: 'eastern_swordsman', count: 2 },
            { type: 'camel_archer', count: 3 },
            { type: 'elite_camel_archer', count: 4 },
        ],
    },
    gulaishi: {
        formationMode: 'triangle',
        slots: [
            { type: 'eastern_swordsman', count: 2 },
            { type: 'camel_archer', count: 3 },
            { type: 'elite_camel_archer', count: 4 },
        ],
    },
    alabo: {
        formationMode: 'triangle',
        slots: [
            { type: 'eastern_swordsman', count: 2 },
            { type: 'camel_archer', count: 3 },
            { type: 'elite_camel_archer', count: 4 },
        ],
    },
    // 小亚细亚·密特里达梯 / 克罗伊斯 / 迈达斯 / 狄奥多尔 古代重装近卫军精锐军团（鱼鳞阵 3+4+2：重装近卫前卫 3 + 重装近卫精锐主力 4 + 复合弓手 2）
    bendou_d: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'guardsman', count: 3 },              // Row 0 前卫抗线 = 古代重装近卫军 3人（纯步兵·无马，重装铜铠大盾前线坚壁抗线）
            { type: 'elite_guardsman', count: 4 },        // Row 1 中军主力 = 古代重装近卫军精锐 4人（纯步兵·无马，王家近卫精锐长矛主力突击）
            { type: 'composite_bowman', count: 2 },       // Row 2 尾收远射 = 复合弓手 2人（纯步兵·无马，后排步弓远射压制）
        ],
    },
    ldiya: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'guardsman', count: 3 },
            { type: 'elite_guardsman', count: 4 },
            { type: 'composite_bowman', count: 2 },
        ],
    },
    fulijiya: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'guardsman', count: 3 },
            { type: 'elite_guardsman', count: 4 },
            { type: 'composite_bowman', count: 2 },
        ],
    },
    bitiniya: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'guardsman', count: 3 },
            { type: 'elite_guardsman', count: 4 },
            { type: 'composite_bowman', count: 2 },
        ],
    },
    // 古典希腊与黑海·阿里斯塔 / 阿历克塞 / 舒伦堡 希腊贵族骑兵与克里特神弓精锐军团（鱼鳞阵 3+4+2：贵族骑兵前卫 3 + 贵族骑兵精锐主力 4 + 克里特弓箭手 2）
    aiaoniya: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'greek_noble_cavalry', count: 3 },    // Row 0 前卫突击 = 希腊贵族骑兵 3骑（重装前锋破线）
            { type: 'elite_greek_cavalry', count: 4 },    // Row 1 中军主力 = 希腊贵族骑兵精锐 4骑（王牌精锐贵族重骑主力突贯决战）
            { type: 'cretan_archer', count: 2 },          // Row 2 尾收远射 = 克里特弓箭手 2人（纯步兵·无马，后方步弓压制）
        ],
    },
    bendou: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'greek_noble_cavalry', count: 3 },
            { type: 'elite_greek_cavalry', count: 4 },
            { type: 'cretan_archer', count: 2 },
        ],
    },
    kejila: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'greek_noble_cavalry', count: 3 },
            { type: 'elite_greek_cavalry', count: 4 },
            { type: 'cretan_archer', count: 2 },
        ],
    },
    // 西北印度与兴都库什·米南德 / 谢尔 / 艾哈迈德 什里瓦姆沙避箭神骑精锐军团（鱼鳞阵 3+4+2：什里瓦姆沙骑手前卫 3 + 什里瓦姆沙骑手精锐主力 4 + 步弓手 2）
    najie: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'shrivamsha_rider', count: 3 },        // Row 0 前卫突击 = 什里瓦姆沙骑手 3骑（大漠与高原神速先锋破阵）
            { type: 'elite_shrivamsha_rider', count: 4 },  // Row 1 中军主力 = 什里瓦姆沙骑手精锐 4骑（王牌避箭神骑主力突贯决战）
            { type: 'archer', count: 2 },                  // Row 2 尾收远射 = 步弓手 2人（纯步兵·无马，后方步弓压制）
        ],
    },
    fanyanna: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'shrivamsha_rider', count: 3 },
            { type: 'elite_shrivamsha_rider', count: 4 },
            { type: 'archer', count: 2 },
        ],
    },
    dulan_d: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'shrivamsha_rider', count: 3 },
            { type: 'elite_shrivamsha_rider', count: 4 },
            { type: 'archer', count: 2 },
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
    // 中南半岛·占婆王国·制蓬峨 / 制旻 爪刀勇士与藤弓精锐军团（鱼鳞阵 3+4+2：爪刀勇士前卫 3 + 爪刀勇士精锐主力 4 + 藤弓兵 2）
    champa: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'karambit_warrior', count: 3 },        // Row 0 前卫突入 = 爪刀勇士 3人（纯步兵·无马，前排双持近战弯刃）
            { type: 'karambit_warrior_elite', count: 4 },  // Row 1 中军主力 = 爪刀勇士精锐 4人（纯步兵·无马，主力极速贴身近战突刺）
            { type: 'rattan_archer', count: 2 },           // Row 2 尾收远射 = 藤弓兵 2人（纯步兵·无马，后方步弓压制掩护）
        ],
    },
    zhancheng: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'karambit_warrior', count: 3 },
            { type: 'karambit_warrior_elite', count: 4 },
            { type: 'rattan_archer', count: 2 },
        ],
    },
    // 波美拉尼亚与波罗的海要塞·卡西米尔四世 奥布奇破甲战锤精锐军团（鱼鳞阵 3+4+2：战锤步兵前卫 3 + 战锤精锐主力 4 + 劲弩手 2）
    boumeilaniyan: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'obuch', count: 3 },                   // Row 0 前卫破线 = 奥布奇战锤步兵 3人（纯步兵·无马，破甲战锤前卫破线）
            { type: 'elite_obuch', count: 4 },             // Row 1 中军主力 = 奥布奇战锤精锐 4人（纯步兵·无马，王牌重装战锤主力撕裂敌甲）
            { type: 'arbalest', count: 2 },                // Row 2 尾收远射 = 劲弩手 2人（纯步兵·无马，后方重型劲弩压制掩护）
        ],
    },
    // 中南半岛阿瓦王朝·思机法 拉塔战车精锐军团（三角阵 2+3+4：东方剑士 2 + 拉塔战车 3 + 拉塔战车精锐主力 4）
    ava: {
        formationMode: 'triangle',
        slots: [
            { type: 'eastern_swordsman', count: 2 },       // Row 0 尖刀先锋 = 东方剑士 2人（纯步兵·无马，前排短刀抗线）
            { type: 'ratha_ranged', count: 3 },            // Row 1 冲击中坚 = 拉塔战车 3车（装甲战车引弓冲击）
            { type: 'elite_ratha_ranged', count: 4 },      // Row 2 底边主力齐射 = 拉塔战车精锐 4车（王牌装甲战车精锐主力冲锋齐射破阵）
        ],
    },
};

