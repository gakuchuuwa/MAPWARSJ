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
    // 默认内置秦国方阵
    qin: {
        formationMode: 'square',
        slots: [
            { type: 'spear', count: 3 },
            { type: 'lancer', count: 1, scale: 1.2 },
            { type: 'general_cavalry', count: 1 },
            { type: 'lancer', count: 1, scale: 1.2 },
            { type: 'crossbow', count: 3 },
        ],
    },
};
