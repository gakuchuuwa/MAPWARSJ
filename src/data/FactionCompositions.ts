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
    // 汉国·三角阵（2+3+4：白毦兵 2 + 诸葛弩 3 + 黑光铠骑兵 4）
    han: {
        formationMode: 'triangle',
        slots: [
            { type: 'white_feather_guard', count: 2 }, // Row 0 尖刀 = 白毦兵
            { type: 'chukonu', count: 3 },             // Row 1 中坚 = 诸葛弩
            { type: 'hei_kuang', count: 4 },           // Row 2 底边 = 黑光铠骑兵
        ],
    },
    han_d: {
        formationMode: 'triangle',
        slots: [
            { type: 'jian_swordsman', count: 2 },      // Row 0 尖刀 = 刀剑手
            { type: 'chukonu', count: 3 },             // Row 1 中坚 = 诸葛弩
            { type: 'tiger_rider', count: 4 },         // Row 2 底边 = 虎豹骑
        ],
    },
    // 马其顿·亚历山大帝国军团（希腊支文化下的子文化，三角阵 2+3+4：希腊重装步兵 + 伙伴骑兵 + 克里特弓手）
    maqidun: {
        formationMode: 'triangle',
        slots: [
            { type: 'hoplite', count: 2 },            // Row 0 尖刀 = 希腊重装步兵
            { type: 'companion_cavalry', count: 3 },  // Row 1 中坚 = 伙伴骑兵
            { type: 'cretan_archer', count: 4 },      // Row 2 底边 = 克里特弓手
        ],
    },
    // 日本战国·织田信长军团（雁行阵 4+3+2：精锐武士 4 + 藤弓兵 3 + 忍者 2）
    owari: {
        formationMode: 'echelon',
        slots: [
            { type: 'samurai_elite', count: 4 },    // Row 0 宽阵 = 精锐武士
            { type: 'rattan_archer', count: 3 },    // Row 1 中坚 = 藤弓兵
            { type: 'ninja', count: 2 },            // Row 2 压阵 = 忍者
        ],
    },
    // 伊贺·忍者军团（鱼鳞阵 3×3：忍者 + 忍者 + 藤弓兵）
    iga_d: {
        formationMode: 'square',
        slots: [
            { type: 'ninja', count: 3 },        // Row 0 前排 = 忍者
            { type: 'ninja', count: 1 },        // Row 1 左 = 忍者
            { type: 'ninja', count: 1 },        // Row 1 中 = 忍者
            { type: 'ninja', count: 1 },        // Row 1 右 = 忍者
            { type: 'rattan_archer', count: 3 } // Row 2 后排 = 藤弓兵
        ],
    },
};
