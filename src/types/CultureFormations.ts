/**
 * Culture Formations
 * 15 文化区 → 各自军队阵型 (CompositionTier 复用)
 *
 * [2026-05-30 立] 用户拍板的 14 区阵型 + 12 兵种映射
 * [2026-07-09] 行军四系 MovementClass（史地定案）：
 *   CAVALRY 纯骑 = 草原 / 青藏 / 中亚（三角 123）
 *   MIXED   步骑 = 中原 / 北方 / 东北 / 朝鲜 / 河西 / 西域
 *   INFANTRY 纯步 = 日本 / 川蜀 / 江南
 *   ELEPHANT 步象 = 岭南 / 滇缅
 *   ※ 西域=绿洲城郭步骑；中亚=河中突厥系纯骑（勿与旧文档「西域纯骑」混淆）
 *
 * 阵型 2 种:
 *   ① 3×3 方阵 (11 文化): 前列3 + 中列(侧2+刀骑1) + 后列3 = 9 人
 *   ② 1-2-3 三角 (3 文化, 纯骑): 草原 / 青藏 / 中亚
 *
 * 12 兵种 (sprite IDs in UnitAssets.ts):
 *   步兵: light_infantry 1-48 / heavy_infantry 52-99 / shield 103-150 /
 *        spear 460-507 / armored 562-609 / axe 511-558
 *   骑兵: lancer 154-193 / heavy_cavalry 197-236 (斧骑) /
 *        general_cavalry 240-279 (刀骑/将领) / horse_archer 664-719 (弓骑)
 *   远程: archer 283-338 (弓兵) / crossbow 342-397 (弩兵)
 *
 * 显示比例（默认，见 LegionComposition.getDefaultScaleForUnitType）:
 *   步兵/弓弩类 slot → 1.0；骑兵类 slot → 1.2
 *   编辑器可 per-slot 写 scale 覆盖；未写则走默认
 */

import { GameConfig } from '../config/GameConfig';
import { RegionType } from '../systems/RegionSystem';
import { CompositionSlot, CompositionTier, expandCompositionScales, expandCompositionSlots } from './LegionComposition';
import type { LegionType } from './UnitTypes';

/** 军队编辑器可选阵型（2026-08-15 主人定稿三阵型）：
 *  square  鱼鳞阵 = 3×3（前3/中3/后3，9人）
 *  triangle 三角阵 = 2+3+4（前2/中3/后4，9人，楔形突击）
 *  echelon  雁行阵 = 4+3+2（前4/中3/后2，9人，宽正面两翼展开）
 */
export type FormationMode = 'square' | 'triangle' | 'echelon';

/**
 * 行军兵种大类（与阵型骨架相关但独立映射；速度查表用此，勿仅靠 triangle 布尔）
 * 史地定案 2026-07-09：中亚=纯骑，西域=步骑
 */
export type MovementClass = 'CAVALRY' | 'MIXED' | 'INFANTRY' | 'ELEPHANT';

/** 15 文化 → 行军大类（单一真理；改速度/上限逻辑只改这里） */
export const CULTURE_MOVEMENT_CLASS: Record<RegionType, MovementClass> = {
    STEPPE:       'CAVALRY',
    TIBET:        'CAVALRY',
    CENTRAL_ASIA: 'CAVALRY',
    WEST_ASIA:    'MIXED',
    NORTH:        'MIXED',
    CENTRAL:      'MIXED',
    NORTHEAST:    'MIXED',
    KOREA:        'MIXED',
    HEXI:         'MIXED',
    WESTERN:      'MIXED',
    JAPAN:        'INFANTRY', // 日本纯步兵
    BASHU:        'INFANTRY',
    JIANGNAN:     'INFANTRY',
    LINGNAN:      'ELEPHANT',
    DIANQIAN:     'ELEPHANT',
    SLAVIC:       'MIXED',   // 东欧步骑
    GERMANIC:     'MIXED', // 中欧步骑（重步+骑士）
    LATIN:        'INFANTRY', // 西欧重步/军团
    GREEK:        'INFANTRY', // 希腊古典方阵重步
    NUERGAN:      'MIXED',    // 奴儿干步骑混合
};

export function getCultureMovementClass(culture: RegionType): MovementClass {
    return CULTURE_MOVEMENT_CLASS[culture] ?? 'MIXED';
}

/** 18 文化默认阵型（可被军队编辑器覆盖保存）——2026-08-16 主人最新定稿：
 *  鱼鳞阵（square 3×3，9人）: 日本、草原、川蜀、江南、中亚
 *  三角阵（triangle 2+3+4，9人）: 岭南、滇缅、朝鲜、东北、拉丁、中原
 *  雁行阵（echelon 4+3+2，9人）: 北方、西域、河西、青藏、西亚、斯拉夫、日耳曼 */
export const CULTURE_FORMATION_MODE: Record<RegionType, FormationMode> = {
    // 鱼鳞阵
    JAPAN:        'square',   // 日本鱼鳞方阵
    STEPPE:       'square',
    BASHU:        'square',
    JIANGNAN:     'square',
    CENTRAL_ASIA: 'square',
    GREEK:        'square',
    NORTHEAST:    'square',
    WESTERN:      'square',

    // 三角阵
    LINGNAN:      'triangle',
    DIANQIAN:     'triangle',
    KOREA:        'triangle',
    LATIN:        'triangle',
    CENTRAL:      'triangle',
    NUERGAN:      'triangle',
    TIBET:        'triangle',

    // 雁行阵
    NORTH:        'echelon',
    HEXI:         'echelon',
    WEST_ASIA:    'echelon',
    SLAVIC:       'echelon',
    GERMANIC:     'echelon',
};

export function getCultureFormationMode(culture: RegionType): FormationMode {
    return CULTURE_FORMATION_MODE[culture] ?? 'square';
}

/** 按阵型生成默认 slot 结构（2026-08-15 三阵型：鱼鳞3×3 / 三角2+3+4 / 雁行4+3+2，均 9 人） */
export function getDefaultSlotsForMode(mode: FormationMode): CompositionSlot[] {
    if (mode === 'triangle') {
        return [
            { type: 'horse_archer', count: 2 },
            { type: 'horse_archer', count: 3 },
            { type: 'horse_archer', count: 4 },
        ];
    }
    if (mode === 'echelon') {
        return [
            { type: 'shield', count: 4 },
            { type: 'crossbow', count: 3 },
            { type: 'crossbow', count: 2 },
        ];
    }
    return [
        { type: 'shield', count: 3 },
        { type: 'lancer', count: 1 },
        { type: 'lancer', count: 1 },   // 中中 = 与左右同兵种（08-15 取消刀骑将领，勿再写 general_cavalry）
        { type: 'lancer', count: 1 },
        { type: 'crossbow', count: 3 },
    ];
}

/** 从 slot 结构推断阵型（兼容旧草稿；三阵型均为 9 人，靠各排 count 分布区分） */
export function inferFormationModeFromSlots(slots: CompositionSlot[]): FormationMode {
    const counts = slots.map(s => s.count);
    const total = counts.reduce((s, x) => s + x, 0);
    // 三角 2+3+4（三排）
    if (slots.length === 3 && counts[0] === 2 && counts[1] === 3 && counts[2] === 4) return 'triangle';
    // 雁行 4+3+2（三排）
    if (slots.length === 3 && counts[0] === 4 && counts[1] === 3 && counts[2] === 2) return 'echelon';
    // 旧 1-2-3 三角（6 人，兼容历史草稿）
    if (slots.length === 3 && counts[0] === 1 && counts[1] === 2 && counts[2] === 3) return 'triangle';
    // 鱼鳞 3×3（5 slot：3 + 1+1+1 + 3）
    if (total === 9 && slots.length === 5) return 'square';
    return slots.length <= 3 ? 'triangle' : 'square';
}

/** 切换阵型时转换 slot（100% 保留已有前排、中坚、后排兵种与缩放；三阵型 2026-08-15） */
export function convertSlotsToMode(slots: CompositionSlot[], mode: FormationMode): CompositionSlot[] {
    const r0 = { type: slots[0]?.type || 'swordsman', scale: slots[0]?.scale };
    let r1 = { type: 'lancer', scale: 1.0 as number | undefined };
    let r2 = { type: 'archer', scale: 1.0 as number | undefined };

    if (slots.length === 5) {
        // square: 0(前3), 1,2,3(中坚), 4(后3)
        r1 = { type: slots[1]?.type || slots[2]?.type || slots[3]?.type || 'lancer', scale: slots[1]?.scale };
        r2 = { type: slots[4]?.type || 'archer', scale: slots[4]?.scale };
    } else if (slots.length >= 3) {
        // triangle or echelon: 0(前), 1(中), 2(后)
        r1 = { type: slots[1]?.type || 'lancer', scale: slots[1]?.scale };
        r2 = { type: slots[2]?.type || 'archer', scale: slots[2]?.scale };
    } else if (slots.length === 2) {
        r1 = { type: slots[1]?.type || 'lancer', scale: slots[1]?.scale };
        r2 = { type: slots[1]?.type || 'archer', scale: slots[1]?.scale };
    } else if (slots.length === 1) {
        r1 = { type: slots[0]?.type || 'lancer', scale: slots[0]?.scale };
        r2 = { type: slots[0]?.type || 'archer', scale: slots[0]?.scale };
    }

    if (mode === 'triangle') {
        return [
            { type: r0.type, count: 2, scale: r0.scale },
            { type: r1.type, count: 3, scale: r1.scale },
            { type: r2.type, count: 4, scale: r2.scale },
        ];
    }
    if (mode === 'echelon') {
        return [
            { type: r0.type, count: 4, scale: r0.scale },
            { type: r1.type, count: 3, scale: r1.scale },
            { type: r2.type, count: 2, scale: r2.scale },
        ];
    }
    // square
    return [
        { type: r0.type, count: 3, scale: r0.scale },
        { type: r1.type, count: 1, scale: r1.scale },
        { type: r1.type, count: 1, scale: r1.scale },
        { type: r1.type, count: 1, scale: r1.scale },
        { type: r2.type, count: 3, scale: r2.scale },
    ];
}

import { FACTION_COMPOSITIONS } from '../data/FactionCompositions';

// ============================================================
// 势力专属方阵（优先于文化区默认）
// ============================================================

/**
 * 秦国·雁行阵（4+3+2）：白毦兵(4) + 诸葛弩(3) + 黑光铠骑兵(2)
 */
export const QIN_FACTION_COMPOSITION: readonly CompositionSlot[] = [
    { type: 'white_feather_guard', count: 4 }, // Row 0 宽阵 = 白毦兵 4人
    { type: 'chukonu', count: 3 },             // Row 1 中坚 = 诸葛弩 3人
    { type: 'hei_kuang', count: 2 },           // Row 2 压阵 = 黑光铠骑兵 2人
];

/**
 * 汉国·三角阵（2+3+4）：白毦兵(2) + 诸葛弩(3) + 黑光铠骑兵(4)
 */
export const HAN_FACTION_COMPOSITION: readonly CompositionSlot[] = [
    { type: 'white_feather_guard', count: 2 }, // Row 0 尖刀 = 白毦兵 2人
    { type: 'chukonu', count: 3 },             // Row 1 中坚 = 诸葛弩 3人
    { type: 'hei_kuang', count: 4 },           // Row 2 底边 = 黑光铠骑兵 4人
];

/** 秦朝名将 ID 集合 */
export const QIN_DYNASTY_GENERAL_IDS = new Set([
    'qin_simacuo',          // 司马错
    'xin_baiqi',            // 白起
    'ruo_wangjian',         // 王翦
    'baiyang_mengtian',     // 蒙恬
    'wazhai_zhanghan',      // 章邯
    'shangzhou_shangyang',  // 商鞅
    'nanyue_zhaotuo',       // 赵佗
]);

/** 秦朝势力 ID 集合 */
export const QIN_DYNASTY_FACTION_IDS = new Set([
    'qin', 'xin', 'ruo', 'baiyang', 'wazhai', 'shangzhou', 'nanyue'
]);

/** 汉朝名将 ID 集合（含西汉、东汉、蜀汉/季汉） */
export const HAN_DYNASTY_GENERAL_IDS = new Set([
    'han_d_liubang',                // 刘邦
    'xianyu_hanxin',                // 韩信
    'suzhou_huoqubing',             // 霍去病
    'shuofang_weiqing',             // 卫青
    'li_lx_d_liguang',              // 李广
    'huaiyang_zhouyafu',            // 周亚夫
    'yangshao_zhoubo',              // 周勃
    'lanzhou_zhaochongguo',         // 赵充国
    'quli_chentang',                // 陈汤
    'xiyuduhu_banchao',             // 班超
    'jiluo_d_douxian',              // 窦宪
    'lulin_liuxiu',                 // 刘秀
    'you_gengyan',                  // 耿弇
    'jingzhou_gs_huangfusong',      // 皇甫嵩
    'huizhou_zhugeliang',           // 诸葛亮
    'shu_liubei',                   // 刘备
    'chu_guanyu',                   // 关羽
    'langzhou_zhangfei',            // 张飞
    'jingmen_zhaoyun',              // 赵云
    'cangsong_machao',              // 马超
    'qingqiang_jiangwei',           // 姜维
    'dongsheng_weishang',           // 魏尚
    'liu_yingbu',                   // 英布
]);

/** 汉朝势力 ID 集合 */
export const HAN_DYNASTY_FACTION_IDS = new Set([
    'han', 'han_d', 'xianyu', 'suzhou', 'shuofang', 'li_lx_d',
    'huaiyang', 'yangshao', 'lanzhou', 'quli', 'xiyuduhu', 'jiluo_d',
    'lulin', 'you', 'jingzhou_gs', 'huizhou_d', 'shu', 'chu',
    'langzhou', 'jingmen', 'cangsong', 'qingqiang', 'dongsheng', 'liu'
]);

/** 日本战国名将 ID 集合 */
export const SENGOKU_GENERAL_IDS = new Set([
    'owari_zhitianxinchang',            // 织田信长
    'kai_wutianxinxuan',                // 武田信玄
    'echigo_shangshanqianxin',          // 上杉谦信
    'edo_dechuanjiakang',               // 德川家康
    'hashiba_fengchenxiuji',            // 丰臣秀吉
    'date_d_yidazhengzong',             // 伊达政宗
    'sanada_d_zhentianxingcun',         // 真田幸村
    'sagami_beitiaoshikang',            // 北条氏康
    'chosokabe_changzongwobuyuanqin',   // 长宗我部元亲
    'satsuma_daojinjiajiu',             // 岛津家久
    'aki_maoliyuanjiu',                 // 毛利元就
    'jinchuan_jinchuanyiyuan',          // 今川义元
    'totomi_jiujingzhongci',            // 酒井忠次
    'mino_dagujiji',                    // 大谷吉继
    'aizu_pushengshixiang',             // 蒲生氏乡
    'iga_d_baididanbo',                 // 百地丹波
    'kaga_d_xiajianlailian',            // 下间赖廉
    'otomo_d_lihuadaoxue',              // 立花道雪
    'suwa_d_zoufanglaizhong',           // 诹访赖重
    'shimotsuke_yudougongguanggang',    // 宇都宫广纲
    'izumo_shanzhonglujie',             // 山中鹿介
    'jibei2_qingshuizongzhi',           // 清水宗治
    'kakizaki_liqiqingguang',           // 蛎崎庆广
    'so_zongyizhi',                     // 宗义智
]);

/** 日本战国势力 ID 集合 */
export const SENGOKU_FACTION_IDS = new Set([
    'owari', 'kai', 'echigo', 'edo', 'hashiba', 'date_d', 'sanada_d',
    'sagami', 'chosokabe', 'satsuma', 'aki', 'jinchuan', 'totomi',
    'mino', 'aizu', 'iga_d', 'kaga_d', 'otomo_d', 'suwa_d',
    'shimotsuke', 'izumo', 'jibei2', 'kakizaki', 'so'
]);

/** 判断是否为秦朝武将或势力 */
export function isQinDynasty(factionId?: string | null, generalId?: string | null): boolean {
    if (generalId && QIN_DYNASTY_GENERAL_IDS.has(generalId)) return true;
    if (factionId && QIN_DYNASTY_FACTION_IDS.has(factionId)) return true;
    return false;
}

/** 判断是否为汉朝武将或势力 */
export function isHanDynasty(factionId?: string | null, generalId?: string | null): boolean {
    if (generalId && HAN_DYNASTY_GENERAL_IDS.has(generalId)) return true;
    if (factionId && HAN_DYNASTY_FACTION_IDS.has(factionId)) return true;
    return false;
}

/** 判断是否为日本战国武将或势力 */
export function isSengoku(factionId?: string | null, generalId?: string | null): boolean {
    if (generalId && SENGOKU_GENERAL_IDS.has(generalId)) return true;
    if (factionId && SENGOKU_FACTION_IDS.has(factionId)) return true;
    return false;
}

/** 势力专属阵型；无则返回 null，由调用方回退文化区 tier */
export function getFactionCompositionSlots(factionId: string, generalId?: string | null): CompositionSlot[] | null {
    // 1. 势力专属覆盖最优先（含支文化细分，如伊贺忍者军团）
    const custom = FACTION_COMPOSITIONS[factionId];
    if (custom) {
        return [...custom.slots];
    }
    // 2. 武将专属判断
    if (generalId) {
        if (QIN_DYNASTY_GENERAL_IDS.has(generalId)) return [...QIN_FACTION_COMPOSITION];
        if (HAN_DYNASTY_GENERAL_IDS.has(generalId)) return [...HAN_FACTION_COMPOSITION];
        if (SENGOKU_GENERAL_IDS.has(generalId)) return [...SENGOKU_TIERS[0].slots];
    }
    // 3. 文化区判定
    if (isQinDynasty(factionId)) {
        return [...QIN_FACTION_COMPOSITION];
    }
    if (isHanDynasty(factionId)) {
        return [...HAN_FACTION_COMPOSITION];
    }
    if (isSengoku(factionId)) {
        return [...SENGOKU_TIERS[0].slots];
    }
    return null;
}

export interface LegionCompositionTarget {
    factionId: string;
    generalId?: string | null;
    cultureRegion: RegionType | null;
    cultureSlots: string[] | null;
    cultureScales: number[] | null;
    legionType: LegionType;
    /** 三值阵型（square 鱼鳞 / triangle 三角 / echelon 雁行）；渲染层据此定布局，不再靠 slots.length 猜 */
    formationMode?: FormationMode | null;
    getTroops(): number;
}

/** 写入军团 cultureSlots / cultureScales / legionType / formationMode（武将与势力专属优先于文化区） */
export function applyLegionCultureComposition(army: LegionCompositionTarget, region?: RegionType): void {
    const isQin = isQinDynasty(army.factionId, army.generalId);
    const isHan = isHanDynasty(army.factionId, army.generalId);
    const isSen = isSengoku(army.factionId, army.generalId);

    const culture = region ?? army.cultureRegion ?? 'CENTRAL';
    const factionSlots = getFactionCompositionSlots(army.factionId, army.generalId);
    const slots = factionSlots ?? getCultureTier(culture, army.getTroops())?.slots;
    if (!slots) return;

    army.cultureSlots = expandCompositionSlots(slots);
    army.cultureScales = expandCompositionScales(slots);
    army.legionType =
        isQin || isHan || isSen
            ? 'mixed'
            : getCultureMovementClass(culture) === 'CAVALRY'
              ? 'cavalry'
              : 'mixed';

    // 阵型判定：势力专属覆盖最优先（含支文化细分）→ 秦国/日本战国雁行阵、汉国三角阵 → 文化区默认
    const custom = FACTION_COMPOSITIONS[army.factionId];
    if (custom?.formationMode) {
        army.formationMode = custom.formationMode;
    } else if (isQin || isSen) {
        army.formationMode = 'echelon';
    } else if (isHan) {
        army.formationMode = 'triangle';
    } else {
        army.formationMode = inferFormationModeFromSlots(slots)
            ?? getCultureFormationMode(culture);
    }
}

// ============================================================
// 15 文化区阵型 (用户 2026-05-30 拍板)
// ============================================================

/** 1. 中原 剑士+诸葛弩+虎豹骑（三角阵 2+3+4：剑士尖刀前 + 诸葛弩中坚 + 虎豹骑底边） */
export const CENTRAL_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'swordsman', count: 2 },      // Row 0 尖刀 = 剑士 步兵
            { type: 'chukonu', count: 3 },        // Row 1 中坚 = 诸葛弩 弩手
            { type: 'tiger_rider', count: 4 }     // Row 2 底边 = 虎豹骑 骑兵
        ]
    }
];

/** 2. 北方 辽刀+诸葛弩+精锐黑光铠骑兵（雁行阵 4+3+2：辽刀前 + 诸葛弩中 + 精锐黑光铠骑兵后） */
export const NORTH_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'liao_dao', count: 4 },        // Row 0 前排 = 辽刀 步兵
            { type: 'chukonu', count: 3 },         // Row 1 中排 = 诸葛弩 弩手
            { type: 'hei_kuang_heavy', count: 2 }  // Row 2 后排 = 精锐黑光铠骑兵 骑兵
        ]
    }
];

/** 3. 东北 铁浮图+钦察+虎豹骑（鱼鳞阵 3×3：铁浮图前 + 钦察中 + 虎豹骑后） */
export const NORTHEAST_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'iron_pagoda', count: 3 },      // Row 0 前排 = 铁浮图 重骑兵
            { type: 'kipchak', count: 1 },          // Row 1 左 = 钦察 弓骑兵
            { type: 'kipchak', count: 1 },          // Row 1 中 = 钦察 弓骑兵
            { type: 'kipchak', count: 1 },          // Row 1 右 = 钦察 弓骑兵
            { type: 'tiger_rider', count: 3 }       // Row 2 后排 = 虎豹骑 骑兵
        ]
    }
];

/** 4. 朝鲜 剑士+藤弓兵+精锐黑光铠骑兵（三角阵 2+3+4：剑士尖刀前 + 藤弓兵中坚 + 精锐黑光铠骑兵底边） */
export const KOREA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'swordsman', count: 2 },        // Row 0 尖刀 = 剑士 步兵
            { type: 'rattan_archer', count: 3 },    // Row 1 中坚 = 藤弓兵 弓手
            { type: 'hei_kuang_heavy', count: 4 }   // Row 2 底边 = 精锐黑光铠骑兵 重骑
        ]
    }
];

/** 5. 日本 精锐武士+日本武士+藤弓兵（鱼鳞阵 3×3：精锐武士前 + 日本武士中 + 藤弓兵后） */
export const JAPAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'samurai_elite', count: 3 },    // Row 0 前排 = 精锐武士 步兵
            { type: 'samurai', count: 1 },          // Row 1 左 = 日本武士 步兵
            { type: 'samurai', count: 1 },          // Row 1 中 = 日本武士 步兵
            { type: 'samurai', count: 1 },          // Row 1 右 = 日本武士 步兵
            { type: 'rattan_archer', count: 3 }     // Row 2 后排 = 藤弓兵 弓手
        ]
    }
];

/** 日本战国 精锐武士+藤弓兵+忍者（雁行阵 4+3+2：精锐武士宽阵前 + 藤弓兵中坚 + 忍者压阵后） */
export const SENGOKU_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'samurai_elite', count: 4 },    // Row 0 宽阵 = 精锐武士 步兵
            { type: 'rattan_archer', count: 3 },    // Row 1 中坚 = 藤弓兵 弓手
            { type: 'ninja', count: 2 }             // Row 2 压阵 = 忍者 步兵
        ]
    }
];

/** 6. 草原 怯薛+草原枪兵+精锐蒙古突骑（鱼鳞阵 3×3：怯薛前 + 草原枪兵中 + 精锐蒙古突骑后） */
export const STEPPE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'keshik', count: 3 },           // Row 0 前排 = 怯薛军 骑兵
            { type: 'steppe_lancer', count: 1 },    // Row 1 左 = 草原枪兵 骑兵
            { type: 'steppe_lancer', count: 1 },    // Row 1 中 = 草原枪兵 骑兵
            { type: 'steppe_lancer', count: 1 },    // Row 1 右 = 草原枪兵 骑兵
            { type: 'mangudai_elite', count: 3 }    // Row 2 后排 = 精锐蒙古突骑 弓骑
        ]
    }
];

/** 7. 河西 精锐辽刀+诸葛弩+黑光铠骑兵（雁行阵 4+3+2：精锐辽刀前 + 诸葛弩中 + 黑光铠骑兵后） */
export const HEXI_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_liao_dao', count: 4 },  // Row 0 前排 = 精锐辽刀 步兵
            { type: 'chukonu', count: 3 },         // Row 1 中排 = 诸葛弩 弩手
            { type: 'hei_kuang', count: 2 }        // Row 2 后排 = 黑光铠骑兵 骑兵
        ]
    }
];

/** 8. 川蜀 白毦兵+精锐诸葛弩+藤弓兵（鱼鳞阵 3×3：白毦兵前 + 精锐诸葛弩中 + 藤弓兵后） */
export const BASHU_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'white_feather_guard', count: 3 },  // Row 0 前排 = 白毦兵 步兵
            { type: 'elite_chukonu', count: 1 },        // Row 1 左 = 精锐诸葛弩 弩手
            { type: 'elite_chukonu', count: 1 },        // Row 1 中 = 精锐诸葛弩 弩手
            { type: 'elite_chukonu', count: 1 },        // Row 1 右 = 精锐诸葛弩 弩手
            { type: 'rattan_archer', count: 3 }         // Row 2 后排 = 藤弓兵 弓手
        ]
    }
];

/** 9. 江南 剑士+精锐火焰弓箭手+诸葛弩（鱼鳞阵 3×3：剑士前 + 精锐火焰弓箭手中 + 诸葛弩后） */
export const JIANGNAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'swordsman', count: 3 },          // Row 0 前排 = 剑士 步兵
            { type: 'elite_fire_archer', count: 1 },  // Row 1 左 = 精锐火焰弓箭手 弓手
            { type: 'elite_fire_archer', count: 1 },  // Row 1 中 = 精锐火焰弓箭手 弓手
            { type: 'elite_fire_archer', count: 1 },  // Row 1 右 = 精锐火焰弓箭手 弓手
            { type: 'chukonu', count: 3 }             // Row 2 后排 = 诸葛弩 弩手
        ]
    }
];

/** 10. 岭南 皮甲战象+帝王掷矛手+精锐藤弓兵（三角阵 2+3+4：皮甲战象尖刀前 + 帝王掷矛手中坚 + 精锐藤弓兵底边） */
export const LINGNAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'armored_elephant', count: 2 },    // Row 0 尖刀 = 皮甲战象 战象
            { type: 'imperial_skirmisher', count: 3 }, // Row 1 中坚 = 帝王掷矛手 掷矛手
            { type: 'rattan_archer_elite', count: 4 }  // Row 2 底边 = 精锐藤弓兵 弓手
        ]
    }
];

/** 11. 滇缅 象兵+步弓手+精锐爪刀勇士（三角阵 2+3+4：象兵尖刀前 + 步弓手中坚 + 精锐爪刀勇士底边） */
export const DIANQIAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'war_elephant', count: 2 },          // Row 0 尖刀 = 象兵 战象
            { type: 'archer', count: 3 },                // Row 1 中坚 = 步弓手 弓手
            { type: 'karambit_warrior_elite', count: 4 } // Row 2 底边 = 精锐爪刀勇士 步兵
        ]
    }
];

/** 12. 青藏 精锐白毦兵+精锐答剌罕骑兵+蒙古突骑（三角阵 2+3+4：精锐白毦兵尖刀前 + 精锐答剌罕骑兵中坚 + 蒙古突骑底边） */
export const TIBET_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_white_feather_guard', count: 2 },  // Row 0 尖刀 = 精锐白毦兵 步兵
            { type: 'elite_tarkan', count: 3 },               // Row 1 中坚 = 精锐答剌罕骑兵 骑兵
            { type: 'mangudai', count: 4 }                    // Row 2 底边 = 蒙古突骑 弓骑
        ]
    }
];

/** 13. 中亚 贵族铁骑+萨瓦尔+精锐钦察（鱼鳞阵 3×3：贵族铁骑前 + 萨瓦尔中 + 精锐钦察后） */
export const CENTRAL_ASIA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'boyar', count: 3 },         // Row 0 前排 = 贵族铁骑 骑兵
            { type: 'savar', count: 1 },         // Row 1 左 = 萨瓦尔 骑兵
            { type: 'savar', count: 1 },         // Row 1 中 = 萨瓦尔 骑兵
            { type: 'savar', count: 1 },         // Row 1 右 = 萨瓦尔 骑兵
            { type: 'elite_kipchak', count: 3 }  // Row 2 后排 = 精锐钦察 弓骑
        ]
    }
];

/** 14. 西域 粟特甲胄骑兵+轻骑兵+骑射手（鱼鳞阵 3×3：粟特甲胄骑兵前 + 轻骑兵中 + 骑射手后） */
export const WESTERN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'sogdian_cataphract', count: 3 },  // Row 0 前排 = 粟特甲胄骑兵 骑兵
            { type: 'light_riders', count: 1 },        // Row 1 左 = 轻骑兵 骑兵
            { type: 'light_riders', count: 1 },        // Row 1 中 = 轻骑兵 骑兵
            { type: 'light_riders', count: 1 },        // Row 1 右 = 轻骑兵 骑兵
            { type: 'cav_archer', count: 3 }           // Row 2 后排 = 骑射手 弓骑
        ]
    }
];

/** 15. 西亚 精锐复合弓箭手+东方剑士+重装骑射手（雁行阵 4+3+2：精锐复合弓箭手前 + 东方剑士中 + 重装骑射手后） */
export const WEST_ASIA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_composite_bowman', count: 4 }, // Row 0 前排 = 精锐复合弓箭手 弓手
            { type: 'eastern_swordsman', count: 3 },      // Row 1 中排 = 东方剑士 步兵
            { type: 'cav_archer_heavy', count: 2 }        // Row 2 后排 = 重装骑射手 弓骑
        ]
    }
];

/** 16. 斯拉夫 精锐草原枪兵+罗马军+复合弓箭手（雁行阵 4+3+2：精锐草原枪兵前 + 罗马军中 + 复合弓箭手后） */
export const SLAVIC_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_steppe_lancer', count: 4 }, // Row 0 前排 = 精锐草原枪兵 骑兵
            { type: 'legionary', count: 3 },           // Row 1 中排 = 罗马军团步兵 步兵
            { type: 'composite_bowman', count: 2 }     // Row 2 后排 = 复合弓箭手 弓手
        ]
    }
];

/** 17. 日耳曼 游侠+冠军剑士+弩手（雁行阵 4+3+2：游侠前 + 冠军剑士中 + 弩手后） */
export const GERMANIC_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'paladin', count: 4 },    // Row 0 前排 = 游侠 骑兵
            { type: 'champion', count: 3 },   // Row 1 中排 = 冠军剑士 步兵
            { type: 'crossbowman', count: 2 } // Row 2 后排 = 弩手 弩手
        ]
    }
];

/** 18. 拉丁 重装长枪兵+劲弩手+重装骑士（三角阵 2+3+4：重装长枪兵尖刀前 + 劲弩手中坚 + 重装骑士底边） */
export const LATIN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'heavy_pikeman', count: 2 }, // Row 0 尖刀 = 重装长枪兵 步兵
            { type: 'arbalest', count: 3 },      // Row 1 中坚 = 劲弩手 弩手
            { type: 'knight', count: 4 }         // Row 2 底边 = 重装骑士 骑兵
        ]
    }
];

/** 19. 希腊 希腊重装步兵+底比斯圣队+罗得岛投石兵（鱼鳞阵 3×3：希腊重装步兵前 + 底比斯圣队中 + 罗得岛投石兵后） */
export const GREEK_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'hoplite', count: 3 },          // Row 0 前排 = 希腊重装步兵 步兵
            { type: 'sacred_band', count: 1 },      // Row 1 左 = 底比斯圣队 步兵
            { type: 'sacred_band', count: 1 },      // Row 1 中 = 底比斯圣队 步兵
            { type: 'sacred_band', count: 1 },      // Row 1 右 = 底比斯圣队 步兵
            { type: 'rhodian_slinger', count: 3 }   // Row 2 后排 = 罗得岛投石兵 远程
        ]
    }
];

/** 亚历山大·马其顿帝国军团（三角阵 2+3+4：希腊重装步兵尖刀前 + 伙伴骑兵中坚 + 克里特弓手底边） */
export const ALEXANDER_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'hoplite', count: 2 },            // Row 0 尖刀 = 希腊重装步兵 步兵
            { type: 'companion_cavalry', count: 3 },  // Row 1 中坚 = 伙伴骑兵 骑兵
            { type: 'cretan_archer', count: 4 }       // Row 2 底边 = 克里特弓手 弓手
        ]
    }
];

/** 20. 奴儿干 藤弓兵+答剌罕骑兵+鲜卑掠骑兵（三角阵 2+3+4：藤弓兵尖刀前 + 答剌罕骑兵中坚 + 鲜卑掠骑兵底边） */
export const NUERGAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'rattan_archer', count: 2 },    // Row 0 尖刀 = 藤弓兵 弓手
            { type: 'tarkan', count: 3 },           // Row 1 中坚 = 答剌罕骑兵 骑兵
            { type: 'xianbei_raider', count: 4 }    // Row 2 底边 = 鲜卑掠骑兵 骑兵
        ]
    }
];
// ============================================================
// 15 文化 → CompositionTier[] 映射
// ============================================================

export const CULTURE_TIERS_MAP: Record<RegionType, CompositionTier[]> = {
    CENTRAL:      CENTRAL_TIERS,
    NORTH:        NORTH_TIERS,
    NORTHEAST:    NORTHEAST_TIERS,
    KOREA:        KOREA_TIERS,
    JAPAN:        JAPAN_TIERS,
    STEPPE:       STEPPE_TIERS,
    HEXI:         HEXI_TIERS,
    BASHU:        BASHU_TIERS,
    JIANGNAN:     JIANGNAN_TIERS,
    LINGNAN:      LINGNAN_TIERS,
    DIANQIAN:     DIANQIAN_TIERS,
    TIBET:        TIBET_TIERS,
    CENTRAL_ASIA: CENTRAL_ASIA_TIERS,
    WEST_ASIA:    WEST_ASIA_TIERS,
    WESTERN:      WESTERN_TIERS,
    SLAVIC:       SLAVIC_TIERS,
    GERMANIC:     GERMANIC_TIERS,
    LATIN:        LATIN_TIERS,
    GREEK:        GREEK_TIERS,
    NUERGAN:      NUERGAN_TIERS,
};

/** 编辑器保存后立刻写入内存（不依赖 HMR 才生效） */
export function applyCultureFormationPatch(
    culture: RegionType,
    slots: { type: string; count: number; scale?: number }[],
    formationMode?: FormationMode
): void {
    const normalized = slots.map((s) => {
        const slot: { type: string; count: number; scale?: number } = { type: s.type, count: s.count };
        if (s.scale != null && !Number.isNaN(s.scale)) slot.scale = s.scale;
        return slot;
    });
    const tiers = CULTURE_TIERS_MAP[culture];
    if (!tiers || tiers.length === 0) {
        CULTURE_TIERS_MAP[culture] = [{
            minTroops: 0,
            maxTroops: Infinity,
            gridSize: 3,
            slots: normalized,
        }];
        return;
    }
    tiers[0].slots = normalized;
    if (formationMode) {
        CULTURE_FORMATION_MODE[culture] = formationMode;
    }
}

/**
 * 按文化拿 tier
 */
export function getCultureTier(culture: RegionType, troops: number = 5000): CompositionTier | null {
    const tiers = CULTURE_TIERS_MAP[culture];
    if (!tiers) return null;
    for (const t of tiers) {
        if (troops >= t.minTroops && troops <= t.maxTroops) return t;
    }
    return tiers[tiers.length - 1] || null;
}

/**
 * 是否纯骑文化（行军/贴图/音效用）。
 * 以 MovementClass 为准（草原/青藏/中亚），与三角阵型默认一致。
 */
export function isCultureCavalryOnly(culture: RegionType): boolean {
    return getCultureMovementClass(culture) === 'CAVALRY';
}

/** 军团兵力上限：10 万基准 × LEGION_TROOP_CAP_TABLE（见 CultureTroopCaps） */
export { getArmyMaxTroops } from '../systems/CultureTroopCaps';

/**
 * 与军队编辑器一致：外观由 cultureSlots（15 区阵型）决定；
 * legionType 仅用于阵型骨架（三角 vs 3×3 步骑）。
 */
export function getLegionTypeForCulture(culture: RegionType): LegionType {
    return getCultureMovementClass(culture) === 'CAVALRY' ? 'cavalry' : 'mixed';
}
