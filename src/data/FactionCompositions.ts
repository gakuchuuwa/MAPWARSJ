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
    // 秦国·雁行阵（4+3+2：印加枪兵长 4 + 诸葛弩 3 + 虎豹骑 2）
    qin: {
        formationMode: 'echelon',
        slots: [
            { type: 'kamayuk', count: 4 },             // Row 0 宽阵 = 印加枪兵长
            { type: 'chukonu', count: 3 },             // Row 1 中坚 = 诸葛弩
            { type: 'tiger_rider', count: 2 },         // Row 2 压阵 = 虎豹骑
        ],
    },
    // 汉国·三角阵（2+3+4：刀剑手 2 + 诸葛弩 3 + 虎豹骑 4）
    han: {
        formationMode: 'triangle',
        slots: [
            { type: 'jian_swordsman', count: 2 },      // Row 0 尖刀 = 刀剑手 2人
            { type: 'chukonu', count: 3 },             // Row 1 中坚 = 诸葛弩 3人
            { type: 'tiger_rider', count: 4 },         // Row 2 底边 = 虎豹骑 4人
        ],
    },
    han_d: {
        formationMode: 'triangle',
        slots: [
            { type: 'jian_swordsman', count: 2 },      // Row 0 尖刀 = 刀剑手 2人
            { type: 'chukonu', count: 3 },             // Row 1 中坚 = 诸葛弩 3人
            { type: 'tiger_rider', count: 4 },         // Row 2 底边 = 虎豹骑 4人
        ],
    },
    // 马其顿·亚历山大帝国军团（希腊支文化下的子文化，雁行阵 4+3+2：马其顿方阵兵 + 伙伴骑兵 + 克里特弓手）
    maqidun: {
        formationMode: 'echelon',
        slots: [
            { type: 'phalangite', count: 4 },         // Row 0 宽阵 = 马其顿方阵兵
            { type: 'companion_cavalry', count: 3 },  // Row 1 中坚 = 伙伴骑兵
            { type: 'cretan_archer', count: 2 },      // Row 2 压阵 = 克里特弓手
        ],
    },
    // 托勒密（亚历山大旧部，套用亚历山大帝国军团配置）
    tuolemi: {
        formationMode: 'echelon',
        slots: [
            { type: 'phalangite', count: 4 },         // Row 0 宽阵 = 马其顿方阵兵
            { type: 'companion_cavalry', count: 3 },  // Row 1 中坚 = 伙伴骑兵
            { type: 'cretan_archer', count: 2 },      // Row 2 压阵 = 克里特弓手
        ],
    },
    // 塞琉古帝国（安提俄基亚 · 塞琉古一世/安条克，银盾方阵体系）
    sailiugu: {
        formationMode: 'echelon',
        slots: [
            { type: 'phalangite', count: 4 },         // Row 0 宽阵 = 马其顿方阵兵
            { type: 'companion_cavalry', count: 3 },  // Row 1 中坚 = 伙伴骑兵
            { type: 'cretan_archer', count: 2 },      // Row 2 压阵 = 克里特弓手
        ],
    },
    // 佩尔加蒙（欧迈尼斯 · 亚历山大王家秘书长与近卫方阵统帅）
    pajiama: {
        formationMode: 'echelon',
        slots: [
            { type: 'phalangite', count: 4 },         // Row 0 宽阵 = 马其顿方阵兵
            { type: 'companion_cavalry', count: 3 },  // Row 1 中坚 = 伙伴骑兵
            { type: 'cretan_archer', count: 2 },      // Row 2 压阵 = 克里特弓手
        ],
    },
    // 贝雷尼斯（托勒密二世 · 托勒密王朝红海据点）
    beileinisi: {
        formationMode: 'echelon',
        slots: [
            { type: 'phalangite', count: 4 },         // Row 0 宽阵 = 马其顿方阵兵
            { type: 'companion_cavalry', count: 3 },  // Row 1 中坚 = 伙伴骑兵
            { type: 'cretan_archer', count: 2 },      // Row 2 压阵 = 克里特弓手
        ],
    },
    // 昔兰尼加（班加西 · 托勒密一世养子马加斯）
    jileinaijia: {
        formationMode: 'echelon',
        slots: [
            { type: 'phalangite', count: 4 },         // Row 0 宽阵 = 马其顿方阵兵
            { type: 'companion_cavalry', count: 3 },  // Row 1 中坚 = 伙伴骑兵
            { type: 'cretan_archer', count: 2 },      // Row 2 压阵 = 克里特弓手
        ],
    },
    // 日本战国·织田信长军团（鹤翼阵 2+4+3：忍者 2 + 精锐武士 4 + 藤弓兵 3）
    owari: {
        formationMode: 'crane_wing',
        slots: [
            { type: 'ninja', count: 2 },            // Row 0 前哨 = 忍者 2人
            { type: 'samurai_elite', count: 4 },    // Row 1 两翼合围 = 精锐武士 4人
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
    // 罗马帝国·罗马军团（三角阵 2+3+4：掷矛手 2 + 精锐罗马百夫长 3 + 罗马军团步兵 4）
    luoma_diguo: {
        formationMode: 'triangle',
        slots: [
            { type: 'skirmisher', count: 2 },          // Row 0 尖刀 = 掷矛手
            { type: 'elite_centurion', count: 3 },     // Row 1 中坚 = 精锐罗马百夫长
            { type: 'legionary', count: 4 },           // Row 2 底边 = 罗马军团步兵
        ],
    },
    // 高卢罗曼（克洛维，套用罗马军团三角阵体系）
    gaolu_luoma: {
        formationMode: 'triangle',
        slots: [
            { type: 'skirmisher', count: 2 },          // Row 0 尖刀 = 掷矛手
            { type: 'elite_centurion', count: 3 },     // Row 1 中坚 = 精锐罗马百夫长
            { type: 'legionary', count: 4 },           // Row 2 底边 = 罗马军团步兵
        ],
    },
    // 摩泽尔（君士坦丁大帝，套用罗马军团三角阵体系）
    mozeer: {
        formationMode: 'triangle',
        slots: [
            { type: 'skirmisher', count: 2 },          // Row 0 尖刀 = 掷矛手
            { type: 'elite_centurion', count: 3 },     // Row 1 中坚 = 精锐罗马百夫长
            { type: 'legionary', count: 4 },           // Row 2 底边 = 罗马军团步兵
        ],
    },
    // 阿尔萨斯（尤里安，套用罗马军团三角阵体系）
    aersasi: {
        formationMode: 'triangle',
        slots: [
            { type: 'skirmisher', count: 2 },          // Row 0 尖刀 = 掷矛手
            { type: 'elite_centurion', count: 3 },     // Row 1 中坚 = 精锐罗马百夫长
            { type: 'legionary', count: 4 },           // Row 2 底边 = 罗马军团步兵
        ],
    },
    // 阿契美尼德·波斯帝国军团（大流士 · 鱼鳞阵 3+4+2：不死军长矛步兵 3 + 不死军复合弓箭手 4 + 萨珊萨瓦尔铁骑 2）
    aqimeinide: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'immortal', count: 3 },        // Row 0 前卫 = 不死军长矛步兵 3人
            { type: 'immortal_ranged', count: 4 }, // Row 1 中军主力 = 不死军复合弓箭手 4人
            { type: 'savar', count: 2 },           // Row 2 尾收 = 萨珊萨瓦尔铁骑 2人
        ],
    },
    // 萨珊波斯军团（沙普尔大帝 · 尼沙布尔）
    aba: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
            { type: 'savar', count: 2 },
        ],
    },
    // 萨非波斯军团（阿拔斯大帝 · 伊斯法罕）
    safawei_d: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
            { type: 'savar', count: 2 },
        ],
    },
    // 萨非波斯军团（伊斯玛仪一世 · 加兹温）
    safawei: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
            { type: 'savar', count: 2 },
        ],
    },
    // 安息波斯帝国（阿尔沙克 · 尼萨）
    ansxi: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
            { type: 'savar', count: 2 },
        ],
    },
    // 苏伦家族（苏伦 · 法拉）
    delan: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
            { type: 'savar', count: 2 },
        ],
    },
    // 卡伦家族（苏赫拉 · 图斯）
    kalan: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
            { type: 'savar', count: 2 },
        ],
    },
    // 米底王国（戴奥凯斯 · 哈马丹）
    midi: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
            { type: 'savar', count: 2 },
        ],
    },
    // 萨法尔王朝（雅库布 · 博斯特）
    xisi: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
            { type: 'savar', count: 2 },
        ],
    },
    // 埃兰古波斯（舒特鲁克 · 苏萨）
    ailan: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
            { type: 'savar', count: 2 },
        ],
    },
    // 萨尔巴达尔（拉扎克 · 白哈格）
    saerbadaer: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
            { type: 'savar', count: 2 },
        ],
    },
    // 库米斯（阿尔普 · 达姆甘）
    kumisi: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
            { type: 'savar', count: 2 },
        ],
    },
    // 哈利（戈达尔兹 · 萨拉赫斯）
    hali: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
            { type: 'savar', count: 2 },
        ],
    },
    // 巴哈尔兹（盖瓦姆 · 泰巴德）
    baha: {
        formationMode: 'fish_scale',
        slots: [
            { type: 'immortal', count: 3 },
            { type: 'immortal_ranged', count: 4 },
            { type: 'savar', count: 2 },
        ],
    },
    // 波兰王国·华沙（雅盖沃 · 三角阵 2+3+4：战锤破甲勇士 2 + 劲弩手 3 + 精锐翼骑兵 4）
    bolan: {
        formationMode: 'triangle',
        slots: [
            { type: 'obuch', count: 2 },         // Row 0 尖刀 = 战锤破甲勇士 2人
            { type: 'arbalest', count: 3 },      // Row 1 中坚 = 劲弩手 3人
            { type: 'winged_hussar', count: 4 }, // Row 2 底边 = 精锐翼骑兵 4人
        ],
    },
    // 皮雅斯特王朝·克拉科夫（卡齐米日大帝）
    piyasite: {
        formationMode: 'triangle',
        slots: [
            { type: 'obuch', count: 2 },
            { type: 'arbalest', count: 3 },
            { type: 'winged_hussar', count: 4 },
        ],
    },
    // 大波兰·波兹南（普热梅斯二世）
    dabolan: {
        formationMode: 'triangle',
        slots: [
            { type: 'obuch', count: 2 },
            { type: 'arbalest', count: 3 },
            { type: 'winged_hussar', count: 4 },
        ],
    },
    // 立陶宛大公国·维尔纽斯（格迪米纳斯）
    litaowan: {
        formationMode: 'triangle',
        slots: [
            { type: 'obuch', count: 2 },
            { type: 'arbalest', count: 3 },
            { type: 'winged_hussar', count: 4 },
        ],
    },
    // 涅曼·格罗德诺（维托夫特大帝）
    nieman: {
        formationMode: 'triangle',
        slots: [
            { type: 'obuch', count: 2 },
            { type: 'arbalest', count: 3 },
            { type: 'winged_hussar', count: 4 },
        ],
    },
    // 条顿骑士团·柯尼斯堡（容金根 · 雁行阵 4+3+2：精锐条顿武士 4 + 十字军圣殿骑士 3 + 长弓兵 2）
    tiaodun_qishi: {
        formationMode: 'echelon',
        slots: [
            { type: 'elite_teutonic_knight', count: 4 }, // Row 0 宽阵 = 精锐条顿武士 4人
            { type: 'crusader_knight', count: 3 },       // Row 1 中坚 = 十字军圣殿骑士 3人
            { type: 'longbowman', count: 2 },            // Row 2 压阵 = 长弓兵 2人
        ],
    },
    // 圣殿骑士团·阿卡（莫莱）
    shengdian_qishi: {
        formationMode: 'echelon',
        slots: [
            { type: 'elite_teutonic_knight', count: 4 },
            { type: 'crusader_knight', count: 3 },
            { type: 'longbowman', count: 2 },
        ],
    },
    // 宝剑骑士团·里加（阿尔伯特）
    baojian_qishi: {
        formationMode: 'echelon',
        slots: [
            { type: 'elite_teutonic_knight', count: 4 },
            { type: 'crusader_knight', count: 3 },
            { type: 'longbowman', count: 2 },
        ],
    },
    // 利沃尼亚骑士团·塔林（普雷特贝格）
    liwoniya: {
        formationMode: 'echelon',
        slots: [
            { type: 'elite_teutonic_knight', count: 4 },
            { type: 'crusader_knight', count: 3 },
            { type: 'longbowman', count: 2 },
        ],
    },
};

