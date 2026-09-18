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

import { RegionType } from '../systems/RegionSystem';
import { STYLE_TO_BASE16, toBase16 } from '../systems/CultureBase16';
import { LEVEL_2_CIV_59_MAP } from '../data/level2Civ59Legions';
import { LEVEL_3_LEGION_MAP } from '../data/level3CustomLegions';
import { CompositionSlot, CompositionTier, expandCompositionScales, expandCompositionSlots } from './LegionComposition';
import type { LegionType } from './UnitTypes';

/** 军队编辑器可选阵型（2026-08-20 七大经典阵型，均 9 人）：
 *  square       方阵   = 3+3+3（前3/中3/后3，九宫等边·攻守均衡）
 *  echelon      雁行阵 = 4+3+2（前4/中3/后2，前阔后窄·重装推进）
 *  fish_scale   鱼鳞阵 = 3+4+2（前3/中4/后2，中腰厚实·重拳突破）
 *  crane_wing   鹤翼阵 = 2+4+3（前2/中4/后3，两翼展开·合围包抄）
 *  triangle     锥形阵 = 2+3+4（前2/中3/后4，前尖后宽·后劲冲锋/远程集火）
 *  crescent     偃月阵 = 3+2+4（前3/中2/后4，前阻中虚·后发制人）
 *  balance_yoke 衡轭阵 = 4+2+3（前4/中2/后3，前宽后稳·前线硬碰）
 */
export type FormationMode = 'triangle' | 'echelon' | 'fish_scale' | 'crane_wing' | 'square' | 'crescent' | 'balance_yoke';

/**
 * 海军舰队队形（水战/航行时用，与陆军 FormationMode 各管各的——
 * 同一个势力上岸打陆战、下水打水战，两套队形互不影响）。
 *  auto   = 旧的兵力驱动行为（≤4 艘单纵队，≥5 艘双列交错），不配置时的默认值
 *  column = 一字长蛇：单纵队鱼贯而行，内河/海峡最窄，不蹭岸
 *  double = 双列交错：纵深压到一半，正面宽一个船身
 *  line   = 一字横阵：全队横向排开，舷侧齐射面最大
 *  wedge  = 楔形雁行：旗舰居前，后随向两翼斜后方展开
 */
export type NavalFormationMode = 'auto' | 'column' | 'double' | 'line' | 'wedge';

export const NAVAL_FORMATION_LABEL: Record<NavalFormationMode, string> = {
    auto: '自动（随船数）',
    column: '一字长蛇',
    double: '双列交错',
    line: '一字横阵',
    wedge: '楔形雁行',
};

/**
 * 行军兵种大类（与阵型骨架相关但独立映射；速度查表用此，勿仅靠 triangle 布尔）
 * 史地定案 2026-07-09：中亚=纯骑，西域=步骑
 */
export type MovementClass = 'CAVALRY' | 'MIXED' | 'INFANTRY' | 'ELEPHANT';

/** 15 文化 → 行军大类（单一真理；改速度/上限逻辑只改这里） */
export const CULTURE_MOVEMENT_CLASS: Record<RegionType, MovementClass> = {
    STEPPE:       'CAVALRY',
    STEPPE_IMPERIAL:'CAVALRY',
    STEPPE_ANTIQUITY:'CAVALRY',
    STEPPE_FEUDAL:'CAVALRY',
    TIBET:        'CAVALRY',
    TIBET_CASTLE:  'CAVALRY',
    TIBET_IMPERIAL:'CAVALRY',
    CENTRAL_ASIA: 'CAVALRY',
    CENTRAL_ASIA_IMPERIAL: 'CAVALRY',
    CENTRAL_ASIA_ANTIQUITY: 'CAVALRY',
    CENTRAL_ASIA_CASTLE: 'CAVALRY',
    WEST_ASIA:    'MIXED',
    WEST_ASIA_ANTIQUITY: 'MIXED',
    WEST_ASIA_CASTLE: 'MIXED',
    NORTH:        'MIXED',
    CENTRAL:      'MIXED',
    NORTHEAST:    'MIXED',
    KOREA:        'MIXED',
    HEXI:         'MIXED',
    WESTERN:      'MIXED',
    WESTERN_FEUDAL:'MIXED',
    WESTERN_CASTLE:'MIXED',
    WESTERN_IMPERIAL:'MIXED',
    JAPAN:        'INFANTRY', // 日本纯步兵
    JAPAN_ANTIQUITY:'INFANTRY',
    JAPAN_IMPERIAL:'MIXED',   // 帝国日本：武士步骑协同
    JIANGNAN:     'INFANTRY',
    SLAVIC:       'MIXED',   // 东欧步骑
    SLAVIC_FEUDAL: 'MIXED',
    SLAVIC_CASTLE: 'MIXED',
    SLAVIC_IMPERIAL: 'MIXED',
    GERMANIC:     'MIXED', // 中欧步骑（重步+骑士）
    GERMANIC_FEUDAL: 'MIXED',
    GERMANIC_IMPERIAL: 'MIXED',
    GERMANIC_CASTLE: 'MIXED',
    LATIN:        'INFANTRY', // 西欧重步/军团
    LATIN_CASTLE: 'INFANTRY',
    LATIN_IMPERIAL: 'INFANTRY',
    LATIN_FEUDAL: 'INFANTRY',
    INDIA:        'ELEPHANT', // 印度战象（步象）
    BERBER:       'CAVALRY',  // 柏柏尔骆驼骑（纯骑）
    AMERICA:      'MIXED',    // 美洲步+鹰武士
    NORTHAM_IMPERIAL:'MIXED',
    AFRICA:       'MIXED',    // 非洲步+骆驼
    AFRICA_IMPERIAL:'MIXED',
    AFRICA_ANTIQUITY:'MIXED',
    AFRICA_CASTLE:'MIXED',
    MALAY:        'INFANTRY', // 马来近战/海军
    SEASIA_ANTIQUITY:'INFANTRY',
    SEASIA_IMPERIAL:'INFANTRY',
    SEASIA_CASTLE:'INFANTRY',
    SEASIA_FEUDAL:'INFANTRY',
    ANDE:         'MIXED',    // 安第斯步+鹰武士
    SOUTHAM_IMPERIAL:'MIXED',
    PURU:         'ELEPHANT', // 普鲁战象（步象）
    INDIA_FEUDAL: 'ELEPHANT', // 封建印度战象（步象）
    INDIA_CASTLE: 'ELEPHANT', // 城堡印度战象（步象）
    INDIA_IMPERIAL:'ELEPHANT', // 帝国印度战象（步象）
    ORIE:         'CAVALRY',  // 阿拉伯骆驼骑（纯骑）
    ORIE_ANTIQUITY:'CAVALRY',
    EAST:         'MIXED',    // 拜占庭圣骑兵与步骑协同
    GREEK:        'MIXED',    // 古典希腊：步骑弩综合体系（重步抗线+贵族骑兵突击+腹弩掩护）
    THRACIAN:     'INFANTRY', // 色雷斯轻盾兵
    PERSIAN:      'MIXED',    // 波斯铁甲圣骑+步弓
    PERSIAN_CASTLE:'MIXED',
    CUMAN:        'CAVALRY',  // 库曼钦察草原游牧（纯骑）
    BRITONS: 'MIXED',  // 不列颠[2026-08-28]
    GOTHS: 'INFANTRY',  // 哥特[2026-08-28]
    HUNS: 'CAVALRY',  // 匈人[2026-08-28]
    TEUTONS: 'MIXED',  // 条顿[2026-08-28]
    VIKINGS: 'INFANTRY',  // 维京[2026-08-28]
     // 凯尔特[2026-08-28]
    CELTS_FEUDAL: 'INFANTRY',
    ITALIANS: 'INFANTRY',  // 意大利[2026-08-28]
    SICILIANS: 'MIXED',  // 西西里[2026-08-28]
    BULGARIANS: 'MIXED',  // 保加利亚[2026-08-28]
    MAGYAR: 'CAVALRY',  // 马扎尔[2026-08-28]
    LITHUANIANS: 'CAVALRY',  // 立陶宛[2026-08-28]
    POLES: 'MIXED',  // 波兰[2026-08-28]
    BOHEMIANS: 'INFANTRY',  // 波希米亚[2026-08-28]
    BURGUNDIANS: 'MIXED',  // 勃艮第[2026-08-28]
    SPANISH: 'MIXED',  // 西班牙[2026-08-28]
    PORTUGUESE: 'INFANTRY',  // 葡萄牙[2026-08-28]
    ETHIOPIANS: 'MIXED',  // 埃塞俄比亚[2026-08-28]
    BENGALIS: 'ELEPHANT',  // 孟加拉[2026-08-28]
    BENGALIS_ANTIQUITY: 'ELEPHANT',  // 🔴 [2026-09-14 事故恢复] 本条随 CultureFormations.ts 被整档覆盖而丢失，按父文化延用补回，待主人复核
    GURJARAS: 'CAVALRY',  // 瞿折罗[2026-08-28]
    VIETNAMESE: 'ELEPHANT',  // 越南[2026-08-28]
    KHMER: 'ELEPHANT',  // 高棉[2026-08-28]
    MAYANS: 'MIXED',  // 玛雅[2026-08-28]
    MAPUCHE: 'MIXED',  // 马普切[2026-08-28]
    MUISCA: 'MIXED',  // 穆伊斯卡[2026-08-28]
    TUPI: 'INFANTRY',  // 图皮[2026-08-28]
    IROQUOIS: 'INFANTRY',  // 城堡易洛魁[2026-09-07 新建]
    CHIMU: 'INFANTRY',  // 城堡奇穆[2026-09-07 新建]
    TARASCAN: 'INFANTRY',  // 城堡塔拉斯科[2026-09-07 新建]
    TAIRONA: 'INFANTRY',  // 城堡泰罗纳[2026-09-07 新建]
    TEHUELCHE: 'CAVALRY',  // 帝国特维尔切[2026-09-07 新建]
    ARMENIANS: 'MIXED',  // 亚美尼亚[2026-08-28]
    GEORGIANS: 'MIXED',  // 格鲁吉亚[2026-08-28]
    BURMESE: 'ELEPHANT',
    EGYPT: 'MIXED',
    CARTHAGE: 'ELEPHANT',
    BABYLON: 'MIXED',
    HITTITES: 'CAVALRY',
    ASSYRIAN: 'MIXED',
    SCYTHIANS: 'CAVALRY',
    BYZANTINE: 'MIXED',
    FRANKS: 'CAVALRY',
    SASANIAN: 'CAVALRY',
    TURKS: 'CAVALRY',
    NANZHAO: 'INFANTRY',
    SRIVIJAYA: 'MIXED',
    KUSHAN: 'CAVALRY',
    KUSH: 'INFANTRY',
    KHITAN: 'CAVALRY',
    UIGHUR: 'CAVALRY',
    MOHE: 'INFANTRY',
    ANGLO_SAXON: 'INFANTRY',
    GHANA: 'INFANTRY',
    KHAZARS: 'CAVALRY',
    VANDALS: 'MIXED',
    LOMBARDS: 'INFANTRY',
    ROURAN: 'CAVALRY',
    SOGDIANS: 'MIXED',
    TANGUT: 'CAVALRY',
    JAVANESE: 'INFANTRY',
    JURCHEN: 'CAVALRY',
    SELJUQ: 'CAVALRY',
    OTTOMAN: 'MIXED',
    OTTOMAN_IMPERIAL: 'MIXED',  // 🔴 [2026-09-14 事故恢复] 本条随 CultureFormations.ts 被整档覆盖而丢失，按父文化延用补回，待主人复核
    FRENCH: 'CAVALRY',
    MANCHU: 'CAVALRY',
    MUGHAL: 'MIXED',
    SAFAVID: 'CAVALRY',
    RUSSIAN: 'INFANTRY',
    SIKH: 'INFANTRY',
    HEBREWS: 'INFANTRY',
    WUSUN: 'CAVALRY',
    QIANG: 'MIXED',
    YARLUNG: 'MIXED',
    NABATAEANS: 'CAVALRY',
    HEPHTHALITES: 'CAVALRY',
    AINU: 'INFANTRY',
    PASHTUN: 'CAVALRY',
    SWEDISH: 'INFANTRY',
    MACEDONIAN:   'MIXED',      // 马其顿方阵步兵+伙伴骑兵
    HELLENIC:     'INFANTRY',   // 古典希伦：雅典与斯巴达重步兵方阵
    IMPERIAL_ROME: 'CAVALRY',    // 古典罗马禁卫：全员铁骑禁卫突击
    GREEK_MERCENARY: 'MIXED',     // 古典希腊雇佣：步骑弩综合雇佣军体系
    MAGNA_GRAECIA:   'MIXED',     // 古典大希腊：步骑标枪综合战阵体系
    ACHAEMENIDS:     'MIXED',     // 古典阿契美尼德：万人不死卫队步骑弓协同体系
    AMAZONS:         'MIXED',     // 古典亚马逊：女骑射为主力，步战女武士护阵
    SONG:            'MIXED',     // 城堡赵宋：步骑弩协同体系
    GORYEO:          'MIXED',     // 城堡高丽：别武班步骑协同体系
    JOSEON:          'MIXED',     // 帝国朝鲜：牌刀手步骑火器协同体系
    GOJOSEON:        'MIXED',     // 古典朝鲜：步弓步兵与轻骑协同体系
    PRE_QIN:         'MIXED',     // 古典先秦：战车与步弩协同体系
    MING:            'MIXED',     // 帝国大明：火矛步骑与火器协同体系
    HUAXIA_IMPERIAL: 'MIXED',     // 帝国华夏：步骑协同体系
    DALI:            'ELEPHANT',  // 城堡大理：大理战象象步体系
    MAMLUKS:         'CAVALRY',   // 城堡马穆鲁克：埃及叙利亚苏丹亲卫马穆鲁克纯骑体系
    CRUSADERS:       'INFANTRY',  // 城堡十字军：步兵长剑与重装骑士鱼鳞阵
    RUS:             'INFANTRY',  // 城堡罗斯：博雅尔重骑与双手长斧步兵阵
    KARA_KHITAN:     'CAVALRY',   // 城堡西辽：黑契丹皮室具装铁骑纯骑体系
    TIMURID:         'CAVALRY',   // 城堡帖木儿：河中察合台具装铁骑纯骑体系
    DELHI:           'ELEPHANT',  // 城堡德里：德里苏丹国铁甲战象象步体系
    CASTILE:         'CAVALRY',   // 城堡卡斯蒂利亚：圣地亚哥骑士与骑兵突击体系
    SCOTLAND:        'INFANTRY',  // 城堡苏格兰：苏格兰刺猬密集方阵与高地长斧步兵体系
    HRE:             'MIXED',     // 城堡神圣罗马：板甲骑士与巨剑十字弩步骑协同体系
    ALMOHAD:         'CAVALRY',   // 城堡摩洛哥：撒哈拉苏丹驼骑与黑骑兵机动冲击体系
    SERBIA:          'MIXED',     // 城堡塞尔维亚：巴尔干重装长矛与骑士铁拳突击体系
    ILKHANATE:       'CAVALRY',   // 城堡伊利汗：波斯具装铁骑与蒙古强弓纯骑体系
    ARAGON:          'MIXED',     // 城堡阿拉贡：阿尔加瓦长剑勇士与骑士协同体系
};

export function getCultureMovementClass(culture: RegionType): MovementClass {
    return CULTURE_MOVEMENT_CLASS[culture] ?? 'MIXED';
}



export function getCultureFormationMode(culture: RegionType): FormationMode {
    return getRegionLegionComposition(culture)?.formationMode ?? 'square';
}

/** 按阵型生成默认 slot 结构（2026-08-20 七大阵型，均 9 人） */
export function getDefaultSlotsForMode(mode: FormationMode): CompositionSlot[] {
    if (mode === 'triangle') {
        return [
            { type: 'cav_archer', count: 2 },
            { type: 'cav_archer', count: 3 },
            { type: 'cav_archer', count: 4 },
        ];
    }
    if (mode === 'echelon') {
        return [
            { type: 'guardsman', count: 4 },
            { type: 'crossbowman', count: 3 },
            { type: 'crossbowman', count: 2 },
        ];
    }
    if (mode === 'fish_scale') {
        return [
            { type: 'guardsman', count: 3 },
            { type: 'lancer', count: 4 },
            { type: 'crossbowman', count: 2 },
        ];
    }
    if (mode === 'crane_wing') {
        return [
            { type: 'guardsman', count: 2 },
            { type: 'lancer', count: 4 },
            { type: 'crossbowman', count: 3 },
        ];
    }
    if (mode === 'crescent') {
        return [
            { type: 'guardsman', count: 3 },
            { type: 'lancer', count: 2 },
            { type: 'crossbowman', count: 4 },
        ];
    }
    if (mode === 'balance_yoke') {
        return [
            { type: 'guardsman', count: 4 },
            { type: 'lancer', count: 2 },
            { type: 'crossbowman', count: 3 },
        ];
    }
    // square (3+3+3 方阵)
    return [
        { type: 'guardsman', count: 3 },
        { type: 'guardsman', count: 3 },
        { type: 'crossbowman', count: 3 },
    ];
}

/** 七阵型各排格位数（唯一权威）。与 LegionPhalanxDrawer 的 *_9_LAYOUT 一一对应。
 *  🔴 渲染层按扁平 index 0..8 把 cultureSlots 填进布局表第 i 个格位 —— slots 自身不带分排信息，
 *  分排边界完全由阵型决定。所以 slots 的分组数必须与本表逐项相等，否则兵种跨排错位。 */
export const FORMATION_ROW_COUNTS: Readonly<Record<FormationMode, readonly [number, number, number]>> = {
    triangle:     [2, 3, 4],
    echelon:      [4, 3, 2],
    fish_scale:   [3, 4, 2],
    crane_wing:   [2, 4, 3],
    crescent:     [3, 2, 4],
    balance_yoke: [4, 2, 3],
    square:       [3, 3, 3],
};

/** slots 的分组数是否与该阵型的分排数逐项相等（不等 = 渲染时必然跨排错位） */
export function slotsMatchFormation(slots: CompositionSlot[], mode: FormationMode): boolean {
    const want = FORMATION_ROW_COUNTS[mode];
    if (!want || slots.length !== want.length) return false;
    return slots.every((s, i) => s.count === want[i]);
}

/** 从 slot 结构推断阵型（兼容旧草稿；七阵型均为 9 人，靠各排 count 分布区分） */
export function inferFormationModeFromSlots(slots: CompositionSlot[]): FormationMode {
    const counts = slots.map(s => s.count);
    const total = counts.reduce((s, x) => s + x, 0);
    // 锥形/三角 2+3+4（三排）
    if (slots.length === 3 && counts[0] === 2 && counts[1] === 3 && counts[2] === 4) return 'triangle';
    // 雁行 4+3+2（三排）
    if (slots.length === 3 && counts[0] === 4 && counts[1] === 3 && counts[2] === 2) return 'echelon';
    // 鱼鳞 3+4+2（三排）
    if (slots.length === 3 && counts[0] === 3 && counts[1] === 4 && counts[2] === 2) return 'fish_scale';
    // 鹤翼 2+4+3（三排）
    if (slots.length === 3 && counts[0] === 2 && counts[1] === 4 && counts[2] === 3) return 'crane_wing';
    // 偃月 3+2+4（三排）
    if (slots.length === 3 && counts[0] === 3 && counts[1] === 2 && counts[2] === 4) return 'crescent';
    // 衡轭 4+2+3（三排）
    if (slots.length === 3 && counts[0] === 4 && counts[1] === 2 && counts[2] === 3) return 'balance_yoke';
    // 方阵 3+3+3（三排）
    if (slots.length === 3 && counts[0] === 3 && counts[1] === 3 && counts[2] === 3) return 'square';
    // 旧 1-2-3 三角（6 人，兼容历史草稿）
    if (slots.length === 3 && counts[0] === 1 && counts[1] === 2 && counts[2] === 3) return 'triangle';
    // 旧 3×3 鱼鳞/方阵（5 slot：3 + 1+1+1 + 3）
    if (total === 9 && slots.length === 5) return 'square';
    return slots.length <= 3 ? 'triangle' : 'square';
}

/** 切换阵型时转换 slot（100% 保留已有前排、中坚、后排兵种与缩放；七大阵型 2026-08-20） */
export function convertSlotsToMode(slots: CompositionSlot[], mode: FormationMode): CompositionSlot[] {
    const r0 = { type: slots[0]?.type || 'swordsman', scale: slots[0]?.scale };
    let r1 = { type: 'lancer', scale: 1.0 as number | undefined };
    let r2 = { type: 'archer', scale: 1.0 as number | undefined };

    if (slots.length === 5) {
        // 旧 5-slot square: 0(前3), 1,2,3(中坚), 4(后3)
        r1 = { type: slots[1]?.type || slots[2]?.type || slots[3]?.type || 'lancer', scale: slots[1]?.scale };
        r2 = { type: slots[4]?.type || 'archer', scale: slots[4]?.scale };
    } else if (slots.length >= 3) {
        // 0(前), 1(中), 2(后)
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
    if (mode === 'fish_scale') {
        return [
            { type: r0.type, count: 3, scale: r0.scale },
            { type: r1.type, count: 4, scale: r1.scale },
            { type: r2.type, count: 2, scale: r2.scale },
        ];
    }
    if (mode === 'crane_wing') {
        return [
            { type: r0.type, count: 2, scale: r0.scale },
            { type: r1.type, count: 4, scale: r1.scale },
            { type: r2.type, count: 3, scale: r2.scale },
        ];
    }
    if (mode === 'crescent') {
        return [
            { type: r0.type, count: 3, scale: r0.scale },
            { type: r1.type, count: 2, scale: r1.scale },
            { type: r2.type, count: 4, scale: r2.scale },
        ];
    }
    if (mode === 'balance_yoke') {
        return [
            { type: r0.type, count: 4, scale: r0.scale },
            { type: r1.type, count: 2, scale: r1.scale },
            { type: r2.type, count: 3, scale: r2.scale },
        ];
    }
    // square (3+3+3 方阵)
    return [
        { type: r0.type, count: 3, scale: r0.scale },
        { type: r1.type, count: 3, scale: r1.scale },
        { type: r2.type, count: 3, scale: r2.scale },
    ];
}

import { FACTION_COMPOSITIONS } from '../data/FactionCompositions';

// ============================================================
// 势力专属方阵（优先于文化区默认）
// ============================================================

/**
 * 秦国军团·雁行阵（4+3+2）：枪兵长(4) + 先秦远程战车(3) + 诸葛弩(2)
 * 主人定：秦国武将（司马错、白起、王翦、章邯、商鞅、赵佗等，除蒙恬大秦长城军团外）统一为【秦国军团】。
 */
export const QIN_FACTION_COMPOSITION: readonly CompositionSlot[] = [
    { type: 'kamayuk', count: 4 },             // Row 0 前排·步兵前锋 = 枪兵长 4人
    { type: 'war_chariot_ranged', count: 3, scale: 0.57 },  // Row 1 中排 = 先秦远程战车 3乘
    { type: 'chukonu', count: 2 },             // Row 2 后排压阵 = 诸葛弩 2人
];

/**
 * 汉国·鹤翼阵（2+4+3）：刀剑手(2) + 虎豹骑(4) + 诸葛弩(3)
 */
export const HAN_FACTION_COMPOSITION: readonly CompositionSlot[] = [
    { type: 'jian_swordsman', count: 2 }, // Row 0 步兵前锋 = 刀剑手 2人
    { type: 'tiger_rider', count: 4 },    // Row 1 骑兵主力两翼合围 = 虎豹骑 4人
    { type: 'chukonu', count: 3 },        // Row 2 中军后排支援 = 诸葛弩 3人
];

/**
 * 曹魏·鹤翼阵（2+4+3）：魏武虎豹骑(2) + 魏武虎豹骑精锐(4) + 诸葛弩(3)
 */
export const WEI_FACTION_COMPOSITION: readonly CompositionSlot[] = [
    { type: 'tiger_rider', count: 2 },          // Row 0 前哨牵制 = 魏武虎豹骑 2人
    { type: 'elite_tiger_cavalry', count: 4 },  // Row 1 铁骑主力两翼合围 = 魏武虎豹骑精锐 4人
    { type: 'chukonu', count: 3 },              // Row 2 中军后排支援 = 诸葛弩 3人
];

/**
 * 唐朝·鹤翼阵（2+4+3）：辽刀(2) + 精锐黑光铠骑兵(4) + 诸葛弩(3)
 */
export const TANG_FACTION_COMPOSITION: readonly CompositionSlot[] = [
    { type: 'liao_dao', count: 2 },        // Row 0 步兵前锋 = 辽刀 2人
    { type: 'hei_kuang_heavy', count: 4 }, // Row 1 骑兵主力两翼合围 = 精锐黑光铠骑兵 4人
    { type: 'chukonu', count: 3 },         // Row 2 中军后排支援 = 诸葛弩 3人
];

/**
 * 宋朝·雁行阵（4+3+2）：诸葛弩(4) + 辽刀(3) + 精锐火矛手(2)
 * 2026-08-18 改：原「精锐火矛手 4 档主力」违反主人两条规矩（火器不得当主力 / 热兵器只许占 2 档）。
 * 主力改诸葛弩 —— 宋以强弩立国（神臂弓、床子弩），弩手宽线齐射正是雁行本义。
 */
export const SONG_FACTION_COMPOSITION: readonly CompositionSlot[] = [
    { type: 'chukonu', count: 4 },           // Row 0 主力·宽线齐射 = 诸葛弩 4人
    { type: 'liao_dao', count: 3 },          // Row 1 中军接应 = 辽刀 3人
    { type: 'elite_fire_lancer', count: 2 }, // Row 2 压阵火器 = 精锐火矛手 2人（🔴 热兵器只许 2 档）
];

/**
 * 大明·鱼鳞阵（3+4+2）：持盾刀剑手(3) + 黑光铠骑兵(4) + 神机箭重型火箭车(2)
 * 明军三大营步骑火协同编制：五军营大盾刀牌手前卫抗线 + 三千营精锐铁骑中军主力 + 神机营重型火箭车后排弹幕覆盖
 * 2026-08-18 主人定：仅朱棣保留此阵；其他大明武将/明朝势力改用 MING_GENERAL_COMPOSITION（火矛手+黑光铠骑兵+精锐火焰弓手）。
 */
export const MING_FACTION_COMPOSITION: readonly CompositionSlot[] = [
    { type: 'jian_swordman_shielded', count: 3 }, // Row 0 前卫抗线 = 持盾刀剑手 3人（大盾刀牌手正面抗线防矢）
    { type: 'hei_kuang', count: 4 },              // Row 1 中军主力 = 黑光铠骑兵 4骑（三千营精锐重骑主力突破）
    { type: 'heavy_rocket_cart', count: 2 },      // Row 2 尾收火器 = 神机箭重型火箭车 2车（神机营一窝蜂连发弹幕轰击）
];

/**
 * 大明常规军团·鱼鳞阵（3+4+2）：火矛手(3) + 黑光铠骑兵(4) + 精锐火焰弓手(2)
 * 2026-08-18 主人定：除朱棣外的其他大明武将及明朝势力统一使用。
 */
export const MING_GENERAL_COMPOSITION: readonly CompositionSlot[] = [
    { type: 'fire_lancer', count: 3 },       // Row 0 前卫抗线 = 火矛手 3人（火器长矛步兵前排破阵）
    { type: 'hei_kuang', count: 4 },         // Row 1 中军主力 = 黑光铠骑兵 4骑（三千营精锐重骑主力突破）
    { type: 'elite_fire_archer', count: 2 }, // Row 2 尾收远程 = 精锐火焰弓手 2人（后排火箭覆盖压制）
];

/**
 * 罗马军团·雁行阵（4+3+2）：罗马军团步兵(4) + 罗马百夫长(3) + 掷矛手(2)
 */
export const ROMAN_FACTION_COMPOSITION: readonly CompositionSlot[] = [
    { type: 'legionary', count: 4 },           // Row 0 前排大盾宽线 = 罗马军团步兵 4人
    { type: 'equites', count: 3 },             // Row 1 中军主力突击 = 罗马百夫长 3骑
    { type: 'skirmisher', count: 2 },          // Row 2 尾收标枪压制 = 掷矛手 2人
];

/**
 * 波斯阿契美尼德帝国·鹤翼阵（2+4+3）：不死军长矛步兵(2) + 萨珊萨瓦尔铁骑(4) + 不死军复合弓箭手(3)
 */
export const PERSIAN_FACTION_COMPOSITION: readonly CompositionSlot[] = [
    { type: 'immortal', count: 2 },        // Row 0 步兵前锋 = 不死军长矛步兵 2人
    { type: 'savar', count: 4 },           // Row 1 骑兵主力两翼合围 = 萨珊萨瓦尔铁骑 4人
    { type: 'immortal_ranged', count: 3 }, // Row 2 中军后排支援 = 不死军复合弓箭手 3人
];

/**
 * 波兰王国·鹤翼阵（2+4+3）：战锤破甲勇士(2) + 精锐翼骑兵(4) + 劲弩手(3)
 */
export const POLISH_FACTION_COMPOSITION: readonly CompositionSlot[] = [
    { type: 'obuch', count: 2 },         // Row 0 步兵前锋 = 战锤破甲勇士 2人
    { type: 'winged_hussar', count: 4 }, // Row 1 骑兵主力两翼合围 = 精锐翼骑兵 4人
    { type: 'arbalest', count: 3 },      // Row 2 中军后排支援 = 劲弩手 3人
];

/**
 * 条顿骑士团·鹤翼阵（2+4+3）：精锐条顿武士(2) + 十字军圣殿骑士(4) + 长弓兵(3)
 */
export const TEUTONIC_FACTION_COMPOSITION: readonly CompositionSlot[] = [
    { type: 'elite_teutonic_knight', count: 2 }, // Row 0 步兵前锋 = 精锐条顿武士 2人
    { type: 'crusader_knight', count: 4 },       // Row 1 骑兵主力两翼合围 = 十字军圣殿骑士 4人
    { type: 'longbowman', count: 3 },            // Row 2 中军后排支援 = 长弓兵 3人
];

/**
 * 拜占庭帝国·鱼鳞阵（3+4+2）：拜占庭圣骑兵(3) + 拜占庭圣骑兵精锐(4) + 重装骑射手(2)
 */
export const BYZANTINE_FACTION_COMPOSITION: readonly CompositionSlot[] = [
    { type: 'cataphract', count: 3 },        // Row 0 前卫 = 拜占庭圣骑兵 3骑
    { type: 'elite_cataphract', count: 4 },  // Row 1 中军突破主力 = 拜占庭圣骑兵精锐 4骑
    { type: 'cav_archer_heavy', count: 2 },  // Row 2 尾收压阵 = 重装骑射手 2骑
];

/**
 * 柏柏尔/北非马格里布·三角阵（2+3+4）：萨拉森马穆鲁克(2) + 柏柏尔标枪骑兵(3) + 柏柏尔骆驼弓骑(4)
 */
export const BERBER_FACTION_COMPOSITION: readonly CompositionSlot[] = [
    { type: 'mameluke', count: 2 },      // Row 0 尖刀先锋 = 萨拉森马穆鲁克 2人
    { type: 'genitour', count: 3 },      // Row 1 冲击中坚 = 柏柏尔标枪骑兵 3人
    { type: 'camel_archer', count: 4 },  // Row 2 底边主力齐射 = 柏柏尔骆驼弓骑 4人
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
    // 2026-08-18 主人定：秦国以前的武将（商/周/春秋/战国）一律并入秦阵（雁行 4+3+2）
    'shang_fuhao',          // 妇好（商）
    'yin_dixin',            // 子受（商纣）
    'zhou_jifa',            // 姬发（周武王）
    'shen_shenbo',          // 申伯（西周）
    'yong_lujili',          // 庐戢黎（楚）
    'jin_xianzhen',         // 先轸（晋）
    'yangshe_yangshezhi',   // 羊舌职（晋）
    'qi_simarangju',        // 司马穰苴（齐）
    'kong_d_caogui',        // 曹刿（鲁）
    'wu_sunwu',             // 孙武（吴）
    'yue_goujian',          // 勾践（越）
    'mi_chu_xionglv',       // 熊旅（楚庄王）
    'chunshen_huangxie',    // 黄歇（楚春申君）
    'wei_wuqi',             // 吴起（魏）
    'yan_leyi',             // 乐毅（燕）
    'zhao_lianpo',          // 廉颇（赵）
    'liguo_zhaoshe',        // 赵奢（赵）
    'lingqiu_zhaowuling',   // 赵雍（赵武灵王）
    'wuzhou_limu',          // 李牧（赵）
    'jiaodong_tiandan',     // 田单（齐）
    'dongxian_sunbin',      // 孙膑（齐）
    'han_baoyuan',          // 暴鸢（韩）
    'liangshidu_longjia',   // 龙贾（魏）
    'dianguo_zhuangqiao',   // 庄蹻（楚/滇）
    'quanrong_yiquhai',     // 义渠骇（义渠）
    'yun_wuli',             // 吾离（戎）
    'ouyue_zouyao',         // 驺摇（东瓯）
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

/** 唐朝名将 ID 集合 */
export const TANG_DYNASTY_GENERAL_IDS = new Set([
    'tang_lishimin',                // 李世民
    'liang_d_zhangxun',             // 张巡
    'bing_liji',                    // 李勣
    'hepan_gaoxianzhi',             // 高仙芝
    'anxi_guoxin',                  // 郭昕
    'juandu_peixingjian',           // 裴行俭
    'heyuan_d_heichichangzhi',      // 黑齿常之
    'song2_houjunji',               // 侯君集
    'gaoliang_geshuhan',            // 哥舒翰
    'shazhou_zhangyichao',          // 张议潮
    'pugu_puguhuaien',              // 仆固怀恩
    'zhongshan_yangaoqing',         // 颜杲卿
    'liwang_liguangbi',             // 李光弼
    'yuan_cj_d_lishuo',             // 李愬
    'lingwu_guoziyi',               // 郭子仪
    'pingyuan_yanzhenqing',         // 颜真卿
    'loufan_xuerengui',             // 薛仁贵
    'weihaiwei_sudingfang',         // 苏定方
    'dingxiang_d_lijing',           // 李靖
    'jiashi_wangxuance',            // 王玄策
    'zhuoshi_gaopian',              // 高骈
    'qianzhou_lisheng',             // 李晟
    'shanzhou_wangzhongsi',         // 王忠嗣
    'weizhou_weigao',               // 韦皋
    'wei2_hunjian',                 // 浑瑊
]);

/** 唐朝势力 ID 集合 */
export const TANG_DYNASTY_FACTION_IDS = new Set([
    'tang', 'liang_d', 'bing', 'hepan', 'anxi', 'juandu', 'heyuan_d',
    'song2', 'gaoliang', 'shazhou', 'lingzhou', 'zhongshan', 'liwang',
    'yuan_cj_d', 'xinping', 'pingyuan', 'loufan', 'weihaiwei',
    'dingxiang_d', 'jiashi', 'zhuoshi', 'qianzhou', 'shanzhou', 'weizhou', 'wei2'
]);

/** 宋朝名将 ID 集合 */
export const SONG_DYNASTY_GENERAL_IDS = new Set([
    'sizhou_hanshizhong',           // 韩世忠
    'luoping_zhangshijie',          // 张世杰
    'xiangzhou_lvwenhuan',          // 吕文焕
    'zaoyang_d_menggong',           // 孟珙
    'fengzhou_wujie',               // 吴玠
    'hezhou_wangjian',              // 王坚
    'didao_wangshao',               // 王韶
    'zhai_han_diqing',              // 狄青
    'huan_zhongshidao',             // 种师道
    'yingzhou_d_liuqi',             // 刘锜
    'qing_quduan',                  // 曲端
    'changshan_yangyanzhao',        // 杨延昭
    'heng1_yangye',                 // 杨业
    'tingzhou_d_chenmin',           // 陈敏
    'changshaguo_xinqiji',          // 辛弃疾
    'shenshi_wentianxiang',         // 文天祥
    'yanchuan_d_yuefei',            // 岳飞
    'song_zhaokuangyin',            // 赵匡胤
    'yanzhou_zhongshiheng',         // 种世衡
]);

/** 宋朝势力 ID 集合 */
export const SONG_DYNASTY_FACTION_IDS = new Set([
    'sizhou', 'luoping', 'xiangzhou', 'zaoyang_d', 'fengzhou', 'hezhou',
    'didao', 'zhai_han', 'huan', 'yingzhou_d', 'qing',
    'changshan', 'heng1', 'tingzhou_d', 'changshaguo', 'shenshi',
    'yanchuan_d', 'song', 'yanzhou'
]);

/** 大明名将 ID 集合 */
export const MING_DYNASTY_GENERAL_IDS = new Set([
    'ming_d_zhudi',             // 朱棣
    'pingnan_muying',           // 沐英
    'guizhou_lidingguo',        // 李定国
    'dongshengwei_wangyue',     // 王越
    'jinan_tiexuan',            // 铁铉
    'suzhou_d_shikefa',         // 史可法
    'huai_zhuyuanzhang',        // 朱元璋
    'shanrong_lanyu',           // 蓝玉
    'yi_yuqian',                // 于谦
    'jinzhou_lichengliang',     // 李成梁
    'zu_d_yuanchonghuan',       // 袁崇焕
    'xuan_xuda',                // 徐达
    'linyu_wusangui',           // 吴三桂
    'qi_d_qijiguang',           // 戚继光
    'chizhou_changyuchun',      // 常遇春
    'luming_luxiangsheng',      // 卢象升
    'yansui_wangwei',           // 王威
]);

/** 大明势力 ID 集合 */
export const MING_DYNASTY_FACTION_IDS = new Set([
    'ming_d', 'pingnan', 'guizhou', 'dongshengwei', 'jinan',
    'suzhou_d', 'huai', 'shanrong', 'yi', 'jinzhou', 'zu_d',
    'xuan', 'linyu', 'qi_d', 'chizhou', 'luming', 'yansui'
]);

/** 曹魏名将 ID 集合 */
export const WEI_DYNASTY_GENERAL_IDS = new Set([
    'cao_d_caocao',             // 曹操（谯县）
    'lu_zhangliao',             // 张辽（合肥）
    'wudu_dengai',              // 邓艾（武都）
    'sima_d_simayi',            // 司马懿（获嘉）
    'bozhou_d_yujin',           // 于禁（聊城）
    'guzhu_tianyu',             // 田豫（肥如）
]);

/** 曹魏势力 ID 集合 */
export const WEI_DYNASTY_FACTION_IDS = new Set([
    'cao_d',                    // 曹魏·谯县
    'lu',                       // 合肥·张辽
    'wudu',                     // 武都·邓艾
    'sima_d',                   // 获嘉·司马懿
    'bozhou_d',                 // 聊城·于禁
    'guzhu',                    // 肥如·田豫
]);

/** 判断是否为曹魏武将或势力 */
export function isWeiDynasty(factionId?: string | null, generalId?: string | null): boolean {
    if (generalId && WEI_DYNASTY_GENERAL_IDS.has(generalId)) return true;
    if (factionId && WEI_DYNASTY_FACTION_IDS.has(factionId)) return true;
    return false;
}

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

/** 罗马帝国名将 ID 集合 */
export const ROMAN_DYNASTY_GENERAL_IDS = new Set([
    'gen_julius_caesar',       // 恺撒
    'gen_scipio',              // 大西庇阿
    'gen_constantine_great',   // 君士坦丁
    'gen_julian_apostate',     // 尤里安
    'gen_clovis_i',            // 克洛维
]);

/** 罗马帝国/罗曼势力 ID 集合 */
export const ROMAN_DYNASTY_FACTION_IDS = new Set([
    'luoma_diguo',  // 罗马帝国
    'gaolu_luoma',  // 高卢罗曼
    'mozeer',       // 摩泽尔（君士坦丁）
    'aersasi',      // 阿尔萨斯（尤里安）
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

/** 判断是否为唐朝武将或势力 */
export function isTangDynasty(factionId?: string | null, generalId?: string | null): boolean {
    if (generalId && TANG_DYNASTY_GENERAL_IDS.has(generalId)) return true;
    if (factionId && TANG_DYNASTY_FACTION_IDS.has(factionId)) return true;
    return false;
}

/** 判断是否为宋朝武将或势力 */
export function isSongDynasty(factionId?: string | null, generalId?: string | null): boolean {
    if (generalId && SONG_DYNASTY_GENERAL_IDS.has(generalId)) return true;
    if (factionId && SONG_DYNASTY_FACTION_IDS.has(factionId)) return true;
    return false;
}

/** 判断是否为大明武将或势力 */
export function isMingDynasty(factionId?: string | null, generalId?: string | null): boolean {
    if (generalId && MING_DYNASTY_GENERAL_IDS.has(generalId)) return true;
    if (factionId && MING_DYNASTY_FACTION_IDS.has(factionId)) return true;
    return false;
}

/** 判断是否为日本战国武将或势力 */
export function isSengoku(factionId?: string | null, generalId?: string | null): boolean {
    if (generalId && SENGOKU_GENERAL_IDS.has(generalId)) return true;
    if (factionId && SENGOKU_FACTION_IDS.has(factionId)) return true;
    return false;
}

/** 判断是否为罗马军团武将或势力 */
export function isRomanDynasty(factionId?: string | null, generalId?: string | null): boolean {
    if (generalId && ROMAN_DYNASTY_GENERAL_IDS.has(generalId)) return true;
    if (factionId && ROMAN_DYNASTY_FACTION_IDS.has(factionId)) return true;
    return false;
}

/** 波斯文化名将 ID 集合（阿契美尼德/萨珊/安息/萨非/米底/萨法尔等） */
export const PERSIAN_DYNASTY_GENERAL_IDS = new Set([
    'aqimeinide_daliushi',      // 大流士一世（波斯波利斯·阿契美尼德帝国）
    'bosi_bolisi_daliushi',     // 大流士（别名）
    'aba_shapuer',              // 沙普尔大帝（尼沙布尔·萨珊波斯帝国）
    'safawei_d_abasi',          // 阿拔斯大帝（伊斯法罕·萨非波斯帝国）
    'safawei_aisimaier',        // 艾斯迈尔/伊斯玛仪一世（加兹温·萨非波斯帝国）
    'delan_sulun',              // 苏伦（法拉·帕提亚安息战神）
    'ansxi_aershake',           // 阿尔沙克一世（尼萨·安息波斯帝国）
    'midi_daiaokaisi',          // 戴奥凯斯（哈马丹·米底王国）
    'ailan_shuteluke',          // 舒特鲁克（苏萨·埃兰古波斯）
    'kalan_suhela',             // 苏赫拉（图斯·萨珊卡伦家族大统帅）
    'xisi_yakubusafaer',        // 雅库布（博斯特·萨法尔波斯王朝）
    'saerbadaer_lazhake',       // 拉扎克（白哈格·萨尔巴达尔起义军）
    'kumisi_aerpu',             // 阿尔普（达姆甘·库米斯）
    'hali_gedaerzi',            // 戈达尔兹（萨拉赫斯·波斯统帅）
    'baha_gaiwamu',             // 盖瓦姆（泰巴德·波斯军团）
]);

/** 波斯文化势力 ID 集合 */
export const PERSIAN_DYNASTY_FACTION_IDS = new Set([
    'aqimeinide',               // 阿契美尼德帝国（波斯波利斯）
    'aba',                      // 萨珊波斯（尼沙布尔）
    'safawei_d',                // 萨非波斯帝国（伊斯法罕）
    'safawei',                  // 萨非帝国（加兹温）
    'delan',                    // 苏伦家族（法拉）
    'ansxi',                    // 安息帝国（尼萨）
    'midi',                     // 米底王国（哈马丹）
    'ailan',                    // 埃兰王国（苏萨）
    'kalan',                    // 卡伦家族（图斯）
    'xisi',                     // 萨法尔王朝（博斯特）
    'saerbadaer',               // 萨尔巴达尔（白哈格）
    'kumisi',                   // 库米斯（达姆甘）
    'hali',                     // 哈利（萨拉赫斯）
    'baha',                     // 巴哈尔兹（泰巴德）
]);

/** 判断是否为波斯文化武将或势力 */
export function isPersianDynasty(factionId?: string | null, generalId?: string | null): boolean {
    if (generalId && PERSIAN_DYNASTY_GENERAL_IDS.has(generalId)) return true;
    if (factionId && PERSIAN_DYNASTY_FACTION_IDS.has(factionId)) return true;
    return false;
}

/** 波兰文化名将 ID 集合（波兰王国 / 立陶宛大公国 / 皮雅斯特等） */
export const POLISH_DYNASTY_GENERAL_IDS = new Set([
    'gen_jogaila',          // 雅盖沃（波兰国王/立陶宛大公，华沙）
    'gen_casimir_great',    // 卡齐米日大帝（皮雅斯特王朝，克拉科夫）
    'gen_przemysl_ii',      // 普热梅斯二世（大波兰公，波兹南）
    'gen_gediminas',        // 格迪米纳斯（立陶宛大公，维尔纽斯）
    'gen_vytautas_great',    // 维托夫特大帝（格伦瓦德之战统帅，格罗德诺）
]);

/** 波兰文化势力 ID 集合 */
export const POLISH_DYNASTY_FACTION_IDS = new Set([
    'bolan',                // 波兰王国（华沙）
    'piyasite',             // 皮雅斯特王朝（克拉科夫）
    'dabolan',              // 大波兰（波兹南）
    'litaowan',             // 立陶宛大公国（维尔纽斯）
    'nieman',               // 涅曼公国（格罗德诺）
]);

/** 判断是否为波兰文化武将或势力 */
export function isPolishDynasty(factionId?: string | null, generalId?: string | null): boolean {
    if (generalId && POLISH_DYNASTY_GENERAL_IDS.has(generalId)) return true;
    if (factionId && POLISH_DYNASTY_FACTION_IDS.has(factionId)) return true;
    return false;
}

/** 条顿骑士团/十字军名将 ID 集合 */
export const TEUTONIC_DYNASTY_GENERAL_IDS = new Set([
    'gen_ulrich_jungingen',      // 容金根（条顿骑士团大团长 · 柯尼斯堡）
    'shengdian_qishi_demolai',   // 莫莱（圣殿骑士团大团长 · 阿卡）
    'gen_albert_riga',           // 阿尔伯特（宝剑骑士团创立者 · 里加）
    'gen_prettenberg',           // 普雷特贝格（利沃尼亚骑士团大统领 · 塔林）
]);

/** 条顿骑士团/十字军势力 ID 集合 */
export const TEUTONIC_DYNASTY_FACTION_IDS = new Set([
    'tiaodun_qishi',            // 条顿骑士团（柯尼斯堡）
    'shengdian_qishi',          // 圣殿骑士团（阿卡）
    'baojian_qishi',            // 宝剑骑士团（里加）
    'liwoniya',                 // 利沃尼亚骑士团（塔林）
]);

/** 判断是否为条顿骑士团/十字军武将或势力 */
export function isTeutonicDynasty(factionId?: string | null, generalId?: string | null): boolean {
    if (generalId && TEUTONIC_DYNASTY_GENERAL_IDS.has(generalId)) return true;
    if (factionId && TEUTONIC_DYNASTY_FACTION_IDS.has(factionId)) return true;
    return false;
}

/** 拜占庭名将 ID 集合 */
export const BYZANTINE_DYNASTY_GENERAL_IDS = new Set([
    'gen_basil_ii',       // 巴西尔二世（拜占庭帝国 · 君士坦丁堡）
    'maerta_qishi_walaite',     // 瓦莱特（医院骑士团/马耳他）
]);

/** 拜占庭势力 ID 集合 */
export const BYZANTINE_DYNASTY_FACTION_IDS = new Set([
    'baizanting',               // 拜占庭帝国（君士坦丁堡）
    'teluoyi',                  // 达尔达尼亚（达达尼尔要冲）
    'maerta_qishi',             // 圣约翰/医院骑士团（马耳他）
]);

/** 判断是否为拜占庭武将或势力 */
export function isByzantineDynasty(factionId?: string | null, generalId?: string | null): boolean {
    if (generalId && BYZANTINE_DYNASTY_GENERAL_IDS.has(generalId)) return true;
    if (factionId && BYZANTINE_DYNASTY_FACTION_IDS.has(factionId)) return true;
    return false;
}

/** 柏柏尔/北非名将 ID 集合 */
export const BERBER_DYNASTY_GENERAL_IDS = new Set([
    'gen_idris_i',          // 伊德里斯一世（非斯 · yidelisi）
    'gen_tashfin',          // 塔什芬（马拉喀什 · mulabite）
    'gen_yaghmurasen',      // 亚格姆拉森（特莱姆森 · zhayan）
    'gen_hammad',           // 哈马德（布佳亚 · hamade）
    'gen_uqba',             // 奥克巴（凯鲁万 · aguelabu）
    'gen_barbarossa',       // 巴巴罗萨·海雷丁（阿尔及尔 · babali）
    'gen_dragut',           // 德拉古特（的黎波里 · telibolisi）
]);

/** 柏柏尔/北非势力 ID 集合 */
export const BERBER_DYNASTY_FACTION_IDS = new Set([
    'yidelisi',             // 伊德里斯王朝（非斯）
    'mulabite',             // 穆拉比特王朝（马拉喀什）
    'zhayan',               // 扎扬王朝（特莱姆森）
    'hamade',               // 哈马德王朝（布佳亚）
    'aguelabu',             // 阿格拉布王朝（凯鲁万）
    'babali',               // 巴巴里海岸（阿尔及尔）
    'telibolisi',           // 的黎波里塔尼亚（的黎波里）
    'zhibuluotuo',          // 休达/直布罗陀
]);

/** 判断是否为柏柏尔/北非武将或势力 */
export function isBerberDynasty(factionId?: string | null, generalId?: string | null): boolean {
    if (generalId && BERBER_DYNASTY_GENERAL_IDS.has(generalId)) return true;
    if (factionId && BERBER_DYNASTY_FACTION_IDS.has(factionId)) return true;
    return false;
}


/** 势力专属阵型；无则返回 null，由调用方回退文化区 tier */

/** 势力专属军团查表。
 *  🔴 [2026-09-06 主人拍板] 铁律「一个文化 = 一个军团 = 一种编制」：
 *     这里**只剩一层** —— 势力有自己的番号军团（如【不死军团】【翼骑兵军团】）就用它，
 *     否则返回 null，交给调用方按**募兵据点所属文化**回落到该文化军团。
 *  已删除原来的第 2 层「武将专属」和第 3 层「朝代判定」（QIN/HAN/WEI/TANG/SONG/MING/
 *  ROMAN/PERSIAN/POLISH/TEUTONIC/BYZANTINE/BERBER/SENGOKU）：它们让 97 个势力拿到
 *  既不是自己番号、也不是所属文化的第三套编制，正是铁律的破口。
 *  ⚠️ 别再加回来。要给某个势力特殊编制，就在 FACTION_COMPOSITIONS 里给它一个**有番号名**的条目。 */
export function getFactionCompositionSlots(factionId: string, generalId?: string | null): CompositionSlot[] | null {
    // 🔴 [2026-09-14] 势力表已不存编制，只存「挂哪支军团」。编制按军团名去三层表查。
    return getFactionLegionComposition(factionId)?.slots ?? null;
}

/** 势力挂的那支军团的编制（三层表里查）；势力没挂军团名则 null */
export function getFactionLegionComposition(
    factionId: string,
): { formationMode: FormationMode; slots: CompositionSlot[] } | null {
    return getLegionCompositionByName(FACTION_COMPOSITIONS[factionId]?.legionName);
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
    const isTang = isTangDynasty(army.factionId, army.generalId);
    const isSong = isSongDynasty(army.factionId, army.generalId);
    const isMing = isMingDynasty(army.factionId, army.generalId);
    const isSen = isSengoku(army.factionId, army.generalId);
    const isRom = isRomanDynasty(army.factionId, army.generalId);
    const isPer = isPersianDynasty(army.factionId, army.generalId);
    const isPol = isPolishDynasty(army.factionId, army.generalId);
    const isTeu = isTeutonicDynasty(army.factionId, army.generalId);
    const isByz = isByzantineDynasty(army.factionId, army.generalId);
    const isBer = isBerberDynasty(army.factionId, army.generalId);

    const culture = region ?? army.cultureRegion ?? 'CENTRAL';
    const factionSlots = getFactionCompositionSlots(army.factionId, army.generalId);
    const slots = factionSlots ?? getCultureTier(culture, army.getTroops())?.slots;
    if (!slots) return;

    army.cultureSlots = expandCompositionSlots(slots);
    army.cultureScales = expandCompositionScales(slots);
    army.legionType =
        isQin || isHan || isTang || isSong || isMing || isSen || isRom || isPer || isPol || isTeu || isByz || isBer
            ? 'mixed'
            : getCultureMovementClass(culture) === 'CAVALRY'
              ? 'cavalry'
              : 'mixed';

    // 阵型判定：势力专属覆盖最优先（含支文化细分）→ 鹤翼阵(步骑远) / 鱼鳞阵(2近1远) / 三角阵(骑+弓骑) / 雁行阵(2远1近) → 文化区默认
    const custom = getFactionLegionComposition(army.factionId);
    if (custom?.formationMode) {
        army.formationMode = custom.formationMode;
    } else if (isQin || isHan || isTang || isSong || isPer || isPol || isTeu || isSen) {
        army.formationMode = 'crane_wing';
    } else if (isRom) {
        army.formationMode = 'echelon';
    } else if (isByz || isMing) {
        army.formationMode = 'fish_scale';
    } else if (isBer) {
        army.formationMode = 'triangle';
    } else {
        army.formationMode = inferFormationModeFromSlots(slots)
            ?? getCultureFormationMode(culture);
    }

    // 🔴 [2026-09-08 主人定] 阵型/编成一致性闸门 —— 七个阵型都是前中后三排，排列必须正确。
    //    渲染层按扁平 index 把 cultureSlots 填进阵型布局的 9 个格位，slots 自身不带分排信息，
    //    分排边界只由阵型决定。上面的朝代/势力覆盖只改阵型、不改 slots，而这些势力大多没有
    //    势力专属编制、slots 落回文化区 tier（实测 168 个势力命中，其中有专属编制的 0 个），
    //    于是「鹤翼 2+4+3 的格位」装「雁行 4+3+2 的兵」→ 前排主力被抽走、兵种跨排劈开。
    //    规则：**前中后三排兵种身份不动，阵型说每排几个人就是几个人。**
    //    绝不反过来把阵型回落成编成推出来的那个（那会丢掉朝代/势力的阵型设计）。
    if (army.formationMode && !slotsMatchFormation(slots, army.formationMode)) {
        const fixed = convertSlotsToMode(slots, army.formationMode);
        army.cultureSlots = expandCompositionSlots(fixed);
        army.cultureScales = expandCompositionScales(fixed);
    }
}

// ============================================================
// 20 文化区阵型（2026-08-18 用户拍板：四个阵型均为 2+3+4 结构，文化主力为 4，远程/弓骑在后排）
// ============================================================

/** 东亚军团（一层母体文化军团 · 雁行阵 4+3+2：华夏持盾刀剑手4 + 中国诸葛弩3 + 南北朝黑光铠骑兵2）
 *  [2026-09-11 主人定：一层文化军团覆盖广有特色，不带精锐/攻城，与二层时代军团完全物理隔离]
 *  泛东亚正统步弩骑三大核心战力融合：
 *   · 前排坚壁（4人） 华夏持盾刀剑手（jian_swordman_shielded） —— 四联大盾前线硬推抗线。
 *   · 中坚压制（3人） 中国诸葛弩（chukonu） —— 机巧连弩，中军密集短箭倾泻。
 *   · 后排突击（2人） 南北朝黑光铠骑兵（hei_kuang） —— 汉唐具装重骑，阵后伺机穿插决胜。 */
export const CENTRAL_BASE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
        { type: 'jian_swordman_shielded', count: 2 },
        { type: 'elite_fire_lancer', count: 3 },
        { type: 'hei_kuang_heavy', count: 4 },
    ]
    }
];













/** 中亚军团（一层母体文化军团 · 雁行阵 4+3+2：草原枪骑兵4 + 库曼钦察弓骑3 + 层压复合弓手2）
 *  [2026-09-11 主人定：一层文化大区无象无车，枪骑前排+钦察中军+复合弓后排，按历史布阵，与二层时代军团完全物理隔离]
 *  欧亚大草原游牧经典雁行扫荡战阵：
 *   · 前排推进（4人） 草原枪骑兵（steppe_lancer） —— 草原长枪轻骑并列前推冲锋破阵。
 *   · 中坚扰乱（3人） 库曼钦察弓骑（kipchak） —— 钦察弓骑穿插放风筝游走疾射。
 *   · 后排集火（2人） 层压复合弓手（laminated_bowman） —— 筋角层压复合弓阵后曲射火力压制。 */
export const STEPPE_BASE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
        { type: 'sakan_axeman', count: 2 },
        { type: 'sogdian_cataphract', count: 3 },
        { type: 'elite_steppe_lancer', count: 4 },
    ]
    }
];

































/** 16. 斯拉夫 贵族铁骑+精锐贵族铁骑+复合弓箭手（鹤翼阵 2+4+3：贵族铁骑前锋 + 精锐波雅尔重骑主力 + 复合弓后排） */


/** 斯拉夫军团（一层母体文化军团 · 鹤翼阵 2+4+3：斯拉夫贵族铁骑2 + 波兰奥布奇战锤兵4 + 反曲长弓手3）
 *  [2026-09-11 主人定：一层文化大区无象无车，贵族铁骑两翼+战锤步兵中坚+反曲长弓后排，按历史布阵，与二层时代军团完全物理隔离]
 *  东欧斯拉夫冰湖与库利科沃经典战阵：
 *   · 前排双翼（2人） 斯拉夫贵族铁骑（boyar） —— 东斯拉夫博雅尔亲卫具装铁骑，两翼展开钳形合围包抄。
 *   · 中军大阵（4人） 波兰奥布奇战锤兵（obuch） —— 西斯拉夫战锤大盾重步兵，正面盾墙抗线、破甲死咬主力。
 *   · 后排射手（3人） 反曲长弓手（recurve_bowman） —— 阵后反曲强弓密集曲射火力压制。 */
export const SLAVIC_BASE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
        { type: 'winged_hussar', count: 2 },
        { type: 'sarmatian', count: 4 },
        { type: 'elite_scythian_horse_archer', count: 3 },
    ]
    }
];


/** 西欧军团（一层母体文化军团 · 衡轭阵 4+2+3：哥特近卫军4 + 勃艮第马上轻骑2 + 法兰克掷斧兵3）
 *  [2026-09-11 主人定：一层文化大区无象无车，哥特近卫盾墙抗矢+马上轻骑机动+法兰克飞斧破甲，与二层时代军团完全物理隔离]
 *  日耳曼大迁徙与法兰克帝国经典大阵：
 *   · 前排坚壁（4人） 哥特近卫军（huskarl） —— 哥特/萨克森大盾步兵，超高防箭护甲正面筑盾抗矢。
 *   · 中坚机动（2人） 勃艮第马上轻骑（coustillier） —— 马上持矛轻骑，快速机动穿插突击。
 *   · 后排飞斧（3人） 法兰克掷斧兵（throwing_axeman） —— 法兰克招牌法兰西斯卡飞斧，后排倾泻密集重斧破盾。 */
export const GERMANIC_BASE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
        { type: 'champion', count: 4 },
        { type: 'arbalest', count: 2 },
        { type: 'frankish_paladin', count: 3 },
    ]
    }
];







/** 地中海军团（一层母体文化军团 · 衡轭阵 4+2+3：罗马军团步兵4 + 罗马百夫长2 + 意大利热那亚弩手3）
 *  [2026-09-11 主人定：方案4，一层文化军团覆盖广有特色，不带精锐/攻城，与二层时代军团完全物理隔离]
 *  泛地中海三大核心战力融合：
 *   · 前排坚壁（4人） 罗马军团步兵（legionary） —— 罗马大盾重步兵，四联大盾前线硬碰硬抗线。
 *   · 中坚督战（2人） 罗马百夫长（centurion） —— 罗马骑兵指挥骨干，双百夫长突击督战。
 *   · 后排重射（3人） 意大利热那亚弩手（genoese_crossbowman） —— 地中海经典大盾重弩，后排梯次破甲集火。 */
export const LATIN_BASE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
        { type: 'condottiero', count: 4 },
        { type: 'arbalest', count: 2 },
        { type: 'equites', count: 3 },
    ]
    }
];









/** 印度军团（一层母体文化军团 · 鹤翼阵 2+4+3：印度斯坦骆驼骑兵2 + 印度斯坦古拉姆4 + 古吉拉特飞轮掷手3）
 *  [2026-09-11 主人定：一层文化大区无象无车，骆驼战骑双翼+古拉姆中坚+飞轮掷手后排，与二层时代军团完全物理隔离]
 *  南亚次大陆北印经典战阵：
 *   · 前排双翼（2人） 印度斯坦骆驼骑兵（imperial_camel_rider） —— 次大陆平原/旁遮普经典骆驼战骑，两翼高速合围包抄。
 *   · 中军大阵（4人） 印度斯坦古拉姆（ghulam） —— 坚盾长矛破阵重步兵，中军正面筑盾合围推进。
 *   · 后排压制（3人） 古吉拉特飞轮掷手（chakram_thrower） —— 次大陆独门回旋飞轮，后排倾泻密集穿透杀伤。 */
export const INDIA_BASE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
        { type: 'imperial_camel_rider', count: 4 },
        { type: 'elite_elephant_archer', count: 2 },
        { type: 'elite_skirmisher', count: 3 },
    ]
    }
];











/** 希腊军团（一层母体文化军团 · 衡轭阵 4+2+3：希腊重装步兵4 + 希腊贵族骑兵2 + 希腊腹弩手3）
 *  [2026-09-11 主人定：一层文化大区无象无车，城邦盾墙抗线+贵族铁骑侧翼穿插+机械腹弩平射，与二层时代军团完全物理隔离]
 *  希腊古典城邦经典大阵：
 *   · 前排坚壁（4人） 希腊重装步兵（hoplite） —— 斯巴达/雅典经典青铜大圆盾与长矛盾墙，正面抗线坚如磐石。
 *   · 中坚铁骑（2人） 希腊贵族骑兵（greek_noble_cavalry） —— 爱琴海城邦具装贵族骑兵侧翼机动穿插。
 *   · 后排射击（3人） 希腊腹弩手（gastraphetes） —— 古希腊阿基米德式早期机械腹弩，平射强劲穿甲。 */
export const GREEK_BASE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
        { type: 'elite_hoplite', count: 4 },
        { type: 'ekdromos', count: 2 },
        { type: 'elite_greek_cavalry', count: 3 },
    ]
    }
];


/** 20. 奴儿干 答剌罕骑兵+鲜卑掠骑兵+反曲长弓手（鱼鳞阵 3+4+2：答剌罕骑兵前卫 + 鲜卑掠骑兵突击主力 + 反曲长弓手后排） */
// [2026-08-19 收敛 18 大文化] 奴儿干已并入 NORTHEAST，本表不再被 CULTURE_TIERS_MAP 引用。
//   数据保留不删，同上。





/** 波斯军团（一层母体文化军团 · 鹤翼阵 2+4+3：冲击骑兵2 + 波斯持盾步兵4 + 波斯长生军弓手3）
 *  [2026-09-11 主人定：一层文化大区无象无车，战骑双翼+持盾步兵中坚+长生军弓手后排，与二层时代军团完全物理隔离]
 *  波斯阿契美尼德帝国正统战骑与步弓大阵：
 *   · 前排双翼（2人） 冲击骑兵（shock_cavalry） —— 具装冲击重骑两翼展开，铁矛近战冲锋破障。
 *   · 中坚合围（4人） 波斯持盾步兵（sparabara） —— 法尔斯本土编柳大方盾长矛兵，正面大阵筑盾推进。
 *   · 后排齐射（3人） 波斯长生军弓手（immortal_ranged） —— 长生军神射手，后排密集曲射火力压制。 */
export const PERSIAN_BASE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
        { type: 'savar', count: 2 },
        { type: 'qizilbash_warrior', count: 4 },
        { type: 'imperial_cavalry', count: 3 },
    ]
    }
];




















/** 东南亚军团（一层母体文化军团 · 锥形阵 2+3+4：缅甸飞镖骑兵2 + 马来爪刀勇士3 + 越南藤弓兵4）
 *  [2026-09-11 主人定：一层文化大区无象无车，缅甸飞镖骑换下战斗象，步骑弓三位一体，与二层时代军团完全物理隔离]
 *  泛东南亚三大地理板块融合（缅甸蒲甘轻骑 + 马来爪刀步兵 + 越南红河藤弓）：
 *   · 前排尖刀（2人） 缅甸飞镖骑兵（arambai） —— 敏捷标枪轻骑充当锋刃，突击袭扰破阵。
 *   · 中坚穿插（3人） 马来爪刀勇士（karambit_warrior） —— 爪刀步兵中军近身缠斗。
 *   · 后排宽幕（4人） 越南藤弓兵（rattan_archer） —— 四联宽幕藤甲弓箭手曲射火力压制。 */
export const MALAY_BASE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
        { type: 'elite_battle_elephant', count: 2 },
        { type: 'sunda_royal_fighter', count: 3 },
        { type: 'imperial_skirmisher', count: 4 },
    ]
    }
];













/** 非洲军团（一层母体文化军团 · 鱼鳞阵 3+4+2：西非索索禁卫军高级3 + 埃塞俄比亚弯刀勇士4 + 柏柏尔骆驼弓骑2）
 *  [2026-09-11 主人定：一层文化军团覆盖广有特色，不带精锐/攻城，与二层时代军团完全物理隔离]
 *  泛非洲三大地理板块融合（西非重步 + 东非弯刀 + 撒哈拉骆驼弓）：
 *   · 前排开道（3人） 西非索索禁卫军高级（sosso_guard） —— 西非王庭重装坚壁，正面扛线筑阵。
 *   · 中坚凿阵（4人） 埃塞俄比亚弯刀勇士（shotel_warrior） —— 东非特制反曲弯刀，绕盾破甲凶悍突破。
 *   · 后排压制（2人） 柏柏尔骆驼弓骑（camel_archer） —— 撒哈拉高机动骆驼射手，游走放风筝精准压制。 */
export const AFRICA_BASE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
        { type: 'sosso_guard', count: 3 },
        { type: 'elite_genitour', count: 4 },
        { type: 'camel_raider', count: 2 },
    ]
    }
];









/** 东南欧军团（一层母体文化军团 · 鱼鳞阵 3+4+2：格鲁吉亚莫纳斯帕3 + 拜占庭圣骑兵4 + 亚美尼亚复合弓手2）
 *  [2026-09-11 主人定：更名为东南欧军团，选用方案1，一层文化军团覆盖广有特色，不带精锐/攻城，与二层时代军团完全物理隔离]
 *  泛东南欧与高加索三大核心战力融合：
 *   · 前排前锋（3人） 格鲁吉亚莫纳斯帕（monaspa） —— 高加索山地重骑近卫筑阵开道。
 *   · 中坚突破（4人） 拜占庭圣骑兵（cataphract） —— 帝国具装铁骑中坚核心，重拳凿阵突破。
 *   · 后排压制（2人） 亚美尼亚复合弓手（composite_bowman） —— 高加索传统复合弓，后排精准火力掩护。 */
export const EAST_BASE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
        { type: 'sarmatian', count: 3 },
        { type: 'imperial_centurion', count: 4 },
        { type: 'cav_archer_heavy', count: 2 },
    ]
    }
];



/** 普鲁军团（一层母体文化军团 · 衡轭阵 4+2+3：印度部落民4 + 什里瓦姆沙骑手2 + 僧伽罗帕提尤达长弓手3）
 *  [2026-09-11 主人定：一层文化大区无象无车，什里瓦姆沙轻骑换下拉塔战车，与二层时代军团完全物理隔离]
 *  南亚次大陆本土步骑弓铁三角组合：
 *   · 前排坚壁（4人） 印度部落民（indian_tribesman） —— 四联本土长矛正面顶线交战。
 *   · 中坚机动（2人） 什里瓦姆沙骑手（shrivamsha_rider） —— 次大陆古吉拉特特色轻骑，护盾机动反冲。
 *   · 后排火力（3人） 僧伽罗帕提尤达长弓手（pattiyoda_longbowman） —— 三联长弓后排曲射火力支援。 */
export const PURU_BASE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
        { type: 'elite_sannahya', count: 2 },
        { type: 'elite_skirmisher', count: 3 },
        { type: 'elite_shrivamsha_rider', count: 4 },
    ]
    }
];





/** 中美军团（一层母体文化军团 · 鹤翼阵 2+4+3：鹰勇士2 + 阿兹特克豹勇士4 + 玛雅羽箭手3）
 *  [2026-09-11 主人定：一层文化大区无象无车，鹰勇士两翼包抄+豹勇士中军绞杀+玛雅羽箭手神射，与二层时代军团完全物理隔离]
 *  中美洲前哥伦布经典大阵：
 *   · 前排双翼（2人） 鹰勇士（eagle_warrior） —— 太阳神鹰图腾，超高移速两翼游弋包抄。
 *   · 中军大阵（4人） 阿兹特克豹勇士（jaguar_warrior） —— 身披豹皮手持马夸威特（黑曜石大棒），正面近战绞杀合围。
 *   · 后排神射（3人） 玛雅羽箭手（plumed_archer） —— 玛雅羽冠神射手，高机动快速抛射箭雨。 */
export const AMERICA_BASE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
        { type: 'elite_eagle_warrior', count: 2 },
        { type: 'elite_ibirapema_warrior', count: 4 },
        { type: 'xolotl_warrior', count: 3 },
    ]
    }
];





/** 安第斯军团（一层母体文化军团 · 雁行阵 4+3+2：枪兵长4 + 图皮黑木弓箭手3 + 马普切套索骑兵2）
 *  [2026-09-11 主人定：一层文化军团覆盖广有特色，不带精锐/高级/重装，与二层城堡时代克丘亚军团完全独立]
 *  南美三大地理生态各取其一：
 *   · 前排宽阵（4人） 枪兵长（kamayuk） —— 印加高山双手长矛密集方阵正面拒敌。
 *   · 中坚力量（3人） 图皮黑木弓箭手（blackwood_archer） —— 亚马逊雨林硬木重弓抛射掩护。
 *   · 后排游击（2人） 马普切套索骑兵（bolas_rider） —— 南安第斯飞索轻骑阵后游击控制。 */
export const ANDE_BASE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
        { type: 'elite_temple_guard', count: 4 },
        { type: 'elite_champi_warrior', count: 3 },
        { type: 'elite_bolas_rider', count: 2 },
    ]
    }
];










/** 第一层 18 文化军团名（文化+军团，主人 2026-08-20 定）。
 *  以文化正式名 CULTURE_NAMES 为底；特例 STEPPE 用「草原」（REGION_LABELS）而非「蒙古」，
 *  因「蒙古」留给第二层蒙古系支军团，避免重名。 */
export const CULTURE_LEGION_NAMES: Partial<Record<RegionType, string>> = {
    CENTRAL: '古典时代华夏中原军团',
    NORTH: '古典时代秦汉军团',
    NORTHEAST: '古典时代鲜卑军团',
    KOREA: "封建时代高句丽军团",
    JAPAN: "城堡时代幕府军团",
    JAPAN_ANTIQUITY: '封建时代大和军团',
    JAPAN_IMPERIAL: '帝王时代幕藩军团',
    STEPPE: "城堡时代蒙古军团",
    STEPPE_IMPERIAL: "帝国时代蒙古军团",
    STEPPE_ANTIQUITY: "古典时代匈奴军团",
    STEPPE_FEUDAL: "封建时代草原军团",
    HEXI: "古典时代秦汉军团",
    JIANGNAN: "封建时代隋唐军团",
    TIBET: "封建时代吐蕃军团",
    TIBET_CASTLE: '城堡时代吐蕃军团',
    TIBET_IMPERIAL: "帝国时代青藏军团",
    CENTRAL_ASIA: "封建时代河中军团",
    CENTRAL_ASIA_IMPERIAL: '帝王时代乌兹别克军团',
    CENTRAL_ASIA_CASTLE: '封建时代萨珊军团',
    WEST_ASIA: '封建时代西亚军团',
    WEST_ASIA_CASTLE: '城堡时代西亚军团',
    WESTERN: '古典时代西域军团',
    WESTERN_FEUDAL: '封建时代安西军团',
    WESTERN_CASTLE: '城堡时代察合台军团',
    WESTERN_IMPERIAL: '帝王时代维吾尔军团',
    SLAVIC: "封建时代罗斯军团",
    SLAVIC_FEUDAL: "封建时代斯拉夫军团",
    SLAVIC_CASTLE: "城堡时代斯拉夫军团",
    SLAVIC_IMPERIAL: "帝国时代斯拉夫军团",
    GERMANIC: "古典时代日耳曼军团",
    GERMANIC_FEUDAL: '封建时代日耳曼军团',
    GERMANIC_IMPERIAL: '帝国时代日耳曼军团',
    GERMANIC_CASTLE: '城堡时代日耳曼军团',
    LATIN: '古典时代罗马军团',
    LATIN_CASTLE: '城堡时代拉丁军团',
    LATIN_IMPERIAL: '帝国时代拉丁军团',
    LATIN_FEUDAL: "封建时代拉丁军团",
    IMPERIAL_ROME: '古典时代罗马禁卫军团',
    GREEK_MERCENARY: '古典时代希腊雇佣军团',
    MAGNA_GRAECIA: '古典时代大希腊军团',
    ACHAEMENIDS: '古典时代阿契美尼德军团',
    AMAZONS: '古典时代亚马逊军团',
    INDIA: '古典时代印度军团',
    BERBER: '封建时代柏柏尔军团',
    AMERICA: '城堡时代阿兹特克军团',
    NORTHAM_IMPERIAL: '帝国时代北美军团',
    AFRICA: '城堡时代马里军团',
    AFRICA_IMPERIAL: '帝国时代非洲军团',
    AFRICA_ANTIQUITY: '古典时代努比亚军团',
    AFRICA_CASTLE: "城堡时代非洲军团",
    MALAY: '城堡时代马来军团',
    SEASIA_IMPERIAL: '帝王时代缅甸军团',
    SEASIA_CASTLE: '城堡时代东南亚军团',
    SEASIA_FEUDAL: '古典时代高棉军团',
    ANDE: '城堡时代克丘亚军团',
    SOUTHAM_IMPERIAL: '帝国时代南美军团',
    PURU: '古典时代普鲁军团',
    INDIA_FEUDAL: '封建时代印度军团',
    INDIA_IMPERIAL: '帝国时代印度军团',
    ORIE: '封建时代阿拉伯军团',
    ORIE_ANTIQUITY: '古典时代阿拉伯军团',
    EAST: '封建时代拜占庭军团',
    GREEK: "古典时代希腊军团",
    THRACIAN: '古典时代色雷斯军团',
    PERSIAN: '古典时代波斯军团',
    ARMENIANS: '封建时代亚美尼亚军团',   // 🔴 [2026-09-18] 原漏配 → 回落兜底；二级 59 表这一支自己声明 region=ARMENIANS
    PERSIAN_CASTLE: '城堡时代波斯军团',
    CUMAN: '城堡时代库曼军团',
    BRITONS: '城堡时代不列颠军团',
    GOTHS: '封建时代哥特军团',
    HUNS: '封建时代匈人军团',
    TEUTONS: "城堡时代条顿军团",
    VIKINGS: '封建时代维京军团',
    CELTS_FEUDAL: '封建时代凯尔特军团',
    ITALIANS: "城堡时代意大利军团",
    SICILIANS: '城堡时代西西里军团',
    BULGARIANS: '封建时代保加利亚军团',
    MAGYAR: "城堡时代马扎尔军团",
    LITHUANIANS: "城堡时代立陶宛军团",
    POLES: "城堡时代波兰军团",
    BOHEMIANS: "城堡时代波希米亚军团",
    BURGUNDIANS: "城堡时代勃艮第军团",
    SPANISH: '帝国时代西班牙军团',
    PORTUGUESE: '帝国时代葡萄牙军团',
    ETHIOPIANS: '封建时代埃塞俄比亚军团',
    BENGALIS: '古典时代孟加拉军团',
    BENGALIS_ANTIQUITY: '古典时代孟加拉军团',  // 🔴 [2026-09-14 事故恢复] 本条随 CultureFormations.ts 被整档覆盖而丢失，按父文化延用补回，待主人复核
    GURJARAS: '封建时代瞿折罗军团',
    VIETNAMESE: "城堡时代越南军团",
    KHMER: '封建时代吴哥军团',   // 🔴 [2026-09-18] 原挂【城堡时代高棉军团】全仓查无此军=幽灵；二级 59 表的【封建时代吴哥军团】自己声明 region=KHMER
    MAYANS: '封建时代玛雅军团',
    MAPUCHE: '帝国时代马普切军团',
    MUISCA: '城堡时代穆伊斯卡军团',
    TUPI: '帝国时代图皮军团',
    IROQUOIS: '城堡时代易洛魁军团',
    CHIMU: '城堡时代奇穆军团',
    TARASCAN: '城堡时代塔拉斯科军团',
    TAIRONA: '城堡时代泰罗纳军团',
    TEHUELCHE: '帝国时代特维尔切军团',
    GEORGIANS: '封建时代格鲁吉亚军团',
    BURMESE: '城堡时代缅甸军团',
    EGYPT: '古典时代埃及军团',
    CARTHAGE: '古典时代布匿军团',
    BABYLON: '古典时代巴比伦军团',
    HITTITES: '古典时代赫梯军团',
    ASSYRIAN: "古典时代亚述军团",
    SCYTHIANS: '古典时代斯基泰军团',
    BYZANTINE: "封建时代拜占庭军团",
    FRANKS: '封建时代法兰克军团',
    SASANIAN: '封建时代波斯军团',
    TURKS: '封建时代突厥军团',
    NANZHAO: "封建时代白蛮军团",
    SRIVIJAYA: '封建时代三佛齐军团',
    KUSHAN: '古典时代贵霜军团',
    KUSH: '古典时代努比亚军团',
    KHITAN: "封建时代契丹军团",
    UIGHUR: '封建时代回鹘军团',
    MOHE: '封建时代渤海军团',
    ANGLO_SAXON: '封建时代盎格鲁-撒克逊军团',
    GHANA: '封建时代加纳军团',
    KHAZARS: '封建时代可萨军团',
    VANDALS: '封建时代汪达尔军团',
    LOMBARDS: '封建时代伦巴第军团',
    ROURAN: '封建时代柔然军团',
    SOGDIANS: '封建时代粟特军团',
    TANGUT: "城堡时代党项军团",
    JAVANESE: '封建时代爪哇军团',
    JURCHEN: "城堡时代女真军团",
    SELJUQ: '城堡时代塞尔柱军团',
    OTTOMAN: "帝国时代奥斯曼军团",
    OTTOMAN_IMPERIAL: '帝国时代奥斯曼军团',  // 🔴 [2026-09-14 事故恢复] 本条随 CultureFormations.ts 被整档覆盖而丢失，按父文化延用补回，待主人复核
    FRENCH: '城堡时代法兰西军团',
    MANCHU: "帝国时代满清军团",
    MUGHAL: '帝国时代莫卧儿军团',
    SAFAVID: '帝国时代波斯军团',
    RUSSIAN: '帝国时代俄罗斯军团',
    SIKH: '帝国时代锡克军团',
    HEBREWS: '古典时代希伯来军团',
    // 🔴 [2026-09-16 修错配] 乌孙原配「东亚军团」——它 toBase16 归 STEPPE（草原），
    //    却因此拿到中原编制（jian_swordman_shielded / elite_fire_lancer / hei_kuang_heavy），
    //    草原游牧配中原剑士火枪，兵种与史实都不对；且与 CENTRAL 撞名，
    //    直接造成审计第⑨项「【东亚军团】裂成多种编制」。归位到自己母体 STEPPE 的一级军团名。
    WUSUN: '中亚军团',
    QIANG: "古典时代羌族军团",
    YARLUNG: '古典时代雅隆军团',
    NABATAEANS: '古典时代纳巴泰军团',
    HEPHTHALITES: '封建时代嚈哒军团',
    AINU: '城堡时代阿伊努军团',
    PASHTUN: '帝国时代普什图军团',
    SWEDISH: '帝国时代瑞典军团',
    MACEDONIAN: "古典时代马其顿军团",
    SONG: '城堡时代宋禁军团',
    GORYEO: '城堡时代高丽军团',
    JOSEON: '帝国时代朝鲜军团',
    GOJOSEON: '古典时代朝鲜军团',
    PRE_QIN: '古典时代先秦军团',
    MING: "帝国时代大明军团",
    HUAXIA_IMPERIAL: "帝国时代华夏军团",
    DALI: '城堡时代大理军团',
    MAMLUKS: "城堡时代马穆鲁克军团",
    CRUSADERS: "城堡时代十字军团",
    RUS: '城堡时代罗斯军团',
    KARA_KHITAN: '城堡时代西辽军团',
    TIMURID: "城堡时代鞑靼军团",
    DELHI: "城堡时代印度斯坦军团",
    CASTILE: '城堡时代卡斯蒂利亚军团',
    SCOTLAND: '城堡时代苏格兰军团',
    HRE: '城堡时代神圣罗马军团',
    ALMOHAD: '城堡时代摩洛哥军团',
    SERBIA: '城堡时代塞尔维亚军团',
    ILKHANATE: '城堡时代伊利汗军团',
    ARAGON: '城堡时代阿拉贡军团',
};


// ════════════════════════════════════════════════════════════════
// 以下 60 个文化编制，2026-09-07 从提交 f4376a460 原样恢复。
// 起因：合并印度/波斯时的正则误删了 60 个 *_TIERS 定义（本只该删 3 个）。
// 恢复方式是逐个从 git 历史抽回原定义，未重写、未用别名兜底，数值与当时完全一致。
// ════════════════════════════════════════════════════════════════


/** 中东军团（一层母体文化军团 · 衡轭阵 4+2+3：中东剑士4 + 萨拉森马穆鲁克2 + 骑射手3）
 *  [2026-09-11 主人定：一层文化大区无象无车，中东剑士前排抗线+马穆鲁克中坚机动+骑射手后排游弋，与二层时代军团完全物理隔离]
 *  阿拉伯帝国与萨拉森沙漠正统大阵：
 *   · 前排抗线（4人） 中东剑士（longswordsman） —— 大马士革弯刀坚盾步兵正面筑墙抗线。
 *   · 中坚穿插（2人） 萨拉森马穆鲁克（mameluke） —— 王庭近卫骆驼轻骑，两翼机动穿插投掷弯刀。
 *   · 后排游弋（3人） 骑射手（cav_archer） —— 阿拉伯/近东沙漠轻骑弓手，后排机动放风筝远程压制。 */
export const ORIE_BASE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
        { type: 'camel_heavy', count: 4 },
        { type: 'shock_cavalry', count: 2 },
        { type: 'cav_archer_heavy', count: 3 },
    ]
    }
];





/** 色雷斯军团（一层母体文化军团 · 衡轭阵 4+2+3：色雷斯长刃斩手4 + 塔兰丁骑兵2 + 色雷斯标枪手3）
 *  [2026-09-11 主人定：一层文化大区无象无车，逆刃长刀斩矛断枪+塔兰托游骑穿插+月牙盾标枪投掷，与二层时代军团完全物理隔离]
 *  奥德里西亚王国古典战阵：
 *   · 前排长刃斩（4人） 色雷斯长刃斩手（rhomphaia_warrior） —— 手持双刃长柄逆刃弯刀（Rhomphaia），近身横扫斩断长枪破甲。
 *   · 中坚游骑（2人） 塔兰丁骑兵（tarantine_cavalry） —— 巴尔干与大希腊特色轻骑，手持标枪高速游走投射穿插。
 *   · 后排投掷（3人） 色雷斯标枪手（thracian_peltast） —— 色雷斯王牌月牙轻盾（Pelte）标枪散兵，中近距离暴风雨投矛。 */
export const THRACIAN_BASE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
        { type: 'mercenary_hoplite', count: 4 },
        { type: 'elite_peltast', count: 2 },
        { type: 'tarantine_cavalry', count: 3 },
    ]
    }
];














































































































/** 🔴 [2026-09-11 主人定：第一层16母体文化军团与第二层时代文明军团彻底分开]
 *  第一层 16 母体文化军团专属编制映射表。与第二层时代军团完全物理隔离，互不影响。 */
export const BASE_16_TIERS_MAP: Partial<Record<RegionType, { formationMode: FormationMode; tiers: CompositionTier[]; shipId: string }>> = {
    PURU: {
        formationMode: 'triangle',
        tiers: PURU_BASE_TIERS,
        // 🔴 [2026-09-19 主人定「同族有高级档就优先套高级」+ 四时代硬闸]
        //    本军团在役势力是蒙格（古典普鲁）＝古典时代，古典军团只许用古典船：
        //    孟加拉楼船是**封建**档（✗越界）。南亚古典在现有 46 艘里没有既古典又像南亚的船，
        //    故取古典时代**最高档**战船（古典桨帆船高级＝Elite Galley，古典✓）。
        shipId: 'ANT_ELITE_GALLEY', // 普鲁军团：古典桨帆船高级（南亚古典暂用古典时代最高档战船）
    },
    AFRICA: {
        formationMode: 'fish_scale',
        tiers: AFRICA_BASE_TIERS,
        shipId: 'CANOE', // 非洲军团：独木舟（尼日尔河与大湖区传统战舟）
    },
    CENTRAL: {
        formationMode: 'triangle',
        tiers: CENTRAL_BASE_TIERS,
        shipId: 'LOU_CHUAN', // 东亚军团：中国楼船（汉唐宋华夏水师旗舰主力）
    },
    ANDE: {
        formationMode: 'echelon',
        tiers: ANDE_BASE_TIERS,
        shipId: 'CANOE', // 安第斯军团：独木舟（安第斯与高山湖泊传统轻舟）
    },
    PERSIAN: {
        formationMode: 'crane_wing',
        tiers: PERSIAN_BASE_TIERS,
        shipId: 'BIREME', // 波斯军团：双列桨座战船（阿契美尼德/萨珊波斯双列战船）
    },
    LATIN: {
        formationMode: 'balance_yoke',
        tiers: LATIN_BASE_TIERS,
        shipId: 'TRIREME', // 地中海军团：三列桨座战船（罗马称霸地中海核心主力舰）
    },
    MALAY: {
        formationMode: 'triangle',
        tiers: MALAY_BASE_TIERS,
        // 🔴 [2026-09-19 四时代硬闸 + 同族升档] 原为 FAST_FIRE_SHIP（快速喷火船）＝**帝国**档，
        //    而本军团在役势力是美山（城堡高棉）＝城堡时代，越界。火攻艨艟线里城堡窗内可用的是
        //    「重型燃烧战船」（燃烧战船 → 重型燃烧战船，同一职能的最高档），高棉/真腊内河重船史实相合。
        shipId: 'HEAVY_INCENDIARY_SHIP', // 东南亚军团：重型燃烧战船（内河火攻重船，城堡档）
    },
    EAST: {
        formationMode: 'fish_scale',
        tiers: EAST_BASE_TIERS,
        shipId: 'DROMON', // 东南欧军团：德罗蒙战舰（拜占庭希腊火王牌战舰）
    },
    INDIA: {
        formationMode: 'balance_yoke',
        tiers: INDIA_BASE_TIERS,
        shipId: 'THIRISADAI', // 印度军团：孟加拉楼船（DE南亚专属多桅巨舰）
    },
    SLAVIC: {
        formationMode: 'crane_wing',
        tiers: SLAVIC_BASE_TIERS,
        shipId: 'MONOREME', // 东北欧军团：单列桨座战船（早期东斯拉夫/罗斯独木长船）
    },
    GERMANIC: {
        formationMode: 'balance_yoke',
        tiers: GERMANIC_BASE_TIERS,
        // 🔴 [2026-09-19 主人定] ① 素材样貌：MONOREME 是**地中海桨帆船**，配日耳曼/北海不像；
        //    改挂长船（北海-波罗的海型屈首搭板长船，涅达姆船一脉）。项目已按「维京归日耳曼」
        //    把维京算在本文化内，苏格兰也早在用长船素材，故日耳曼用长船不算跨界。
        //    ② 同族升档：长船线两档（维京长船 → 维京长船高级），同属封建档，取高级档。
        //    ③ 时代闸：本军团在役势力是封建日耳曼（美因茨），落在「封建军团可用古典+封建」窗内 ✓。
        shipId: 'ELITE_LONGBOAT', // 西欧军团：维京长船高级（长船线最高档，封建档）
    },
    STEPPE: {
        formationMode: 'triangle',
        tiers: STEPPE_BASE_TIERS,
        shipId: 'DEMO_RAFT', // 中亚军团：渡河木筏（内陆游牧渡河皮筏/木排，史实无远洋水师）
    },
    ORIE: {
        formationMode: 'balance_yoke',
        tiers: ORIE_BASE_TIERS,
        // 🔴 [2026-09-19 四时代硬闸] 原为 FIRE_SHIP（喷火船）＝**城堡**档，而本军团在役势力是
        //    巴格达（封建西亚）＝封建时代，越界。火船线里封建窗内可用的只有基础档「喷火桨帆船」
        //    （喷火桨帆船=封建 → 喷火船=城堡 → 快速喷火船=帝国），此档已是封建窗内的最高档。
        shipId: 'FIRE_GALLEY', // 中东军团：喷火桨帆船（阿拉伯-黎凡特火攻快船，封建档）
    },
    AMERICA: {
        formationMode: 'crane_wing',
        tiers: AMERICA_BASE_TIERS,
        shipId: 'CANOE', // 中美军团：独木舟（特斯科科湖与玛雅雨林武装战舟）
    },
    GREEK: {
        formationMode: 'balance_yoke',
        tiers: GREEK_BASE_TIERS,
        shipId: 'TRIREME', // 希腊军团：三列桨座战船（萨拉米斯海战希腊经典战舰）
    },
    THRACIAN: {
        formationMode: 'balance_yoke',
        tiers: THRACIAN_BASE_TIERS,
        // 🔴 [2026-09-19 主人定「同族有高级档就优先套高级」] 伦博斯线共四档
        //    （轻型伦博斯 → 战型伦博斯高级 → 重型伦博斯重装 → 旗舰伦博斯重装），同为古典档，
        //    取最高的旗舰档；色雷斯-黑海沿岸本即以伦博斯快船著称。
        shipId: 'ELITE_LEMBOS', // 色雷斯军团：希腊旗舰伦博斯重装（伦博斯线最高档，古典档）
    },
};

/* ═══════════════════════════════════════════════════════════════
 * 🔴 [2026-09-14 主人定「所有军团只有一级 16、二级 59，其他都是三级；文化表全部清除」]
 *
 * 编制的唯一来源 = **三层军团表**，文化区只剩「默认挂哪支军团」这一个指针：
 *   一级 16 母体 → `BASE_16_TIERS_MAP`（本文件）
 *   二级 59 文明 → `src/data/level2Civ59Legions.ts`
 *   三级 自建   → `src/data/level3CustomLegions.ts`
 *
 * 原先的「文化表」（`CULTURE_TIERS_MAP` / `CULTURE_FORMATION_MODE` + 183 个 `XXX_TIERS`）
 * 按文化区另存了一份编制，不属于三层里的任何一层，是第四份权威 ——
 * 同一支军团的编制能在两处打架（实测 30 支对不上），已整体删除。
 * ═══════════════════════════════════════════════════════════════ */

/** 已删除的军团（编辑器删完立刻生效，不等 HMR 重新导入静态表） */
const LEGION_DELETED = new Set<string>();

/** 编辑器删掉一支军团后，立刻让内存里也查不到它 */
export function dropLegionFromMemory(name: string): void {
    if (!name) return;
    LEGION_DELETED.add(name);
    LEGION_RUNTIME_PATCH.delete(name);
}

/** 运行时改名（编辑器改名后立刻生效，不等 HMR）：旧名 → 新名 */
const LEGION_RENAMED = new Map<string, string>();

/**
 * 编辑器把一支军团改名后，让内存里也立刻认新名。
 * 🔴 只动**查编制**这条路：新名沿用旧名那份编制，旧名当场作废。
 *    势力归属 / 文化区指针由服务端写文件，HMR 回来后自然是新名。
 */
export function renameLegionInMemory(oldName: string, newName: string): void {
    if (!oldName || !newName || oldName === newName) return;
    const comp = getLegionCompositionByName(oldName);
    if (comp) LEGION_RUNTIME_PATCH.set(newName, { formationMode: comp.formationMode, slots: comp.slots.map(s => ({ ...s })) });
    LEGION_RENAMED.set(oldName, newName);
    LEGION_DELETED.add(oldName);
    LEGION_RUNTIME_PATCH.delete(oldName);
}

/** 这支军团改名后的新名；没改过就返回原名。列表构建用它把旧名换成新名。 */
export function resolveRenamedLegion(name: string): string {
    return LEGION_RENAMED.get(name) ?? name;
}

/** 按**军团名**直接打内存补丁（编辑器保存后立刻生效，不等 HMR） */
export function patchLegionComposition(
    name: string,
    slots: CompositionSlot[],
    formationMode: FormationMode,
    shipId?: string,
): void {
    LEGION_RUNTIME_PATCH.set(name, { formationMode, slots: slots.map(s => ({ ...s })), shipId });
}

/** 运行时覆盖（编辑器保存后立刻生效，不依赖 HMR）：军团名 → 编制 */
const LEGION_RUNTIME_PATCH = new Map<string, { formationMode: FormationMode; slots: CompositionSlot[]; shipId?: string }>();

/** 按**军团名**取编制：一级 → 二级 → 三级，找不到返回 null */
export function getLegionCompositionByName(
    name: string | null | undefined,
): { formationMode: FormationMode; slots: CompositionSlot[]; shipId?: string } | null {
    if (!name || LEGION_DELETED.has(name)) return null;
    const patched = LEGION_RUNTIME_PATCH.get(name);
    if (patched) return { formationMode: patched.formationMode, slots: patched.slots.map(s => ({ ...s })), shipId: patched.shipId };

    for (const rg of Object.keys(BASE_16_TIERS_MAP) as RegionType[]) {
        if (BASE_16_LEGION_NAME_BY_REGION[rg] !== name) continue;
        const b = BASE_16_TIERS_MAP[rg];
        if (b?.tiers[0]?.slots) return { formationMode: b.formationMode, slots: b.tiers[0].slots.map(s => ({ ...s })), shipId: b.shipId };
    }
    const l2 = LEVEL_2_CIV_59_MAP.get(name);
    if (l2) {
        const l2Ship = l2.shipId ?? (l2.region ? BASE_16_TIERS_MAP[l2.region]?.shipId : undefined);
        return { formationMode: l2.formationMode, slots: l2.slots.map(s => ({ ...s })), shipId: l2Ship };
    }
    const l3 = LEVEL_3_LEGION_MAP.get(name);
    if (l3) {
        const l3Region = l3.regions?.[0] as RegionType | undefined;
        const l3Ship = l3.shipId ?? (l3Region ? BASE_16_TIERS_MAP[l3Region]?.shipId : undefined);
        return { formationMode: l3.formationMode, slots: l3.slots.map(s => ({ ...s })), shipId: l3Ship };
    }
    return null;
}

/** 按**文化区**取编制 = 该区默认军团的编制（区本身不再持有编制） */
export function getRegionLegionComposition(
    culture: RegionType | null | undefined,
): { formationMode: FormationMode; slots: CompositionSlot[] } | null {
    return getLegionCompositionByName(culture ? CULTURE_LEGION_NAMES[culture] : null);
}

/** 一级 16 母体：文化区 → 母体军团名（与 legion-editor 的 BASE_16_LEGION_NAMES 同一份） */
export const BASE_16_LEGION_NAME_BY_REGION: Record<string, string> = {
    CENTRAL: '东亚军团', STEPPE: '中亚军团', INDIA: '印度军团', GERMANIC: '西欧军团',
    PURU: '普鲁军团', ORIE: '中东军团', LATIN: '地中海军团', SLAVIC: '东北欧军团',
    EAST: '东南欧军团', PERSIAN: '波斯军团', MALAY: '东南亚军团', GREEK: '希腊军团',
    THRACIAN: '色雷斯军团', ANDE: '安第斯军团', AMERICA: '中美军团', AFRICA: '非洲军团',
};


/* ── 兼容视图（**不是**文化表）─────────────────────────────────────
 * 🔴 [2026-09-14] 文化表已删，但全项目有 60 多个审计脚本按
 *    `CULTURE_TIERS_MAP[region]` / `CULTURE_FORMATION_MODE[region]` 读编制。
 *    这里按三层军团表**实时算出**同形状的只读视图给它们用 ——
 *    它不存任何数据，改不了、也不可能和军团表打架（这正是原来那张表的病）。
 *    新代码请直接用 `getRegionLegionComposition(region)`，别再用这两个。
 * ──────────────────────────────────────────────────────────────── */
export const CULTURE_TIERS_MAP: Readonly<Record<RegionType, CompositionTier[]>> =
    new Proxy({} as Record<RegionType, CompositionTier[]>, {
        get(_t, prop: string) {
            const comp = getRegionLegionComposition(prop as RegionType);
            if (!comp) return undefined;
            return [{ minTroops: 0, maxTroops: Infinity, gridSize: 3, slots: comp.slots }];
        },
        has(_t, prop: string) { return getRegionLegionComposition(prop as RegionType) != null; },
        ownKeys() { return Object.keys(CULTURE_LEGION_NAMES); },
        getOwnPropertyDescriptor() { return { enumerable: true, configurable: true }; },
        set() { throw new Error('CULTURE_TIERS_MAP 是只读视图；编制请写进三层军团表'); },
    });

export const CULTURE_FORMATION_MODE: Readonly<Record<RegionType, FormationMode>> =
    new Proxy({} as Record<RegionType, FormationMode>, {
        get(_t, prop: string) { return getRegionLegionComposition(prop as RegionType)?.formationMode; },
        has(_t, prop: string) { return getRegionLegionComposition(prop as RegionType) != null; },
        ownKeys() { return Object.keys(CULTURE_LEGION_NAMES); },
        getOwnPropertyDescriptor() { return { enumerable: true, configurable: true }; },
        set() { throw new Error('CULTURE_FORMATION_MODE 是只读视图；阵型请写进三层军团表'); },
    });

/** 获取第一层母体文化军团的默认配置（与第二层时代军团彻底物理隔离） */
export function getBase16FormationConfig(region: RegionType): { formationMode: FormationMode; slots: CompositionSlot[]; shipId?: string } | null {
    const custom = BASE_16_TIERS_MAP[region];
    if (custom && custom.tiers[0]?.slots) {
        return {
            formationMode: custom.formationMode,
            slots: custom.tiers[0].slots.map(s => ({ ...s })),
            shipId: custom.shipId,
        };
    }
    return null;
}

export const REGION_TO_BUILDING_STYLE: Record<string, string> = {
    ACHAEMENIDS: 'PERSIAN',
    AFRICA: 'AFRICA',
    AFRICA_ANTIQUITY: 'ETHIOPIANS',
    AFRICA_CASTLE: 'ETHIOPIANS',
    AFRICA_IMPERIAL: 'BERBER',
    AINU: 'JAPAN',
    ALMOHAD: 'BERBER',
    AMERICA: 'AMERICA',
    ANDE: 'INCA',
    ANGLO_SAXON: 'WEST',
    ARAGON: 'MEDI',
    ARMENIANS: 'ARMENIANS',
    ASSYRIAN: 'ORIE',
    BABYLON: 'ORIE',
    BASHU: 'BASHU',
    BENGALIS: 'BENGALIS',
    BERBER: 'BERBER',
    BOHEMIANS: 'BOHEMIANS',
    BRITONS: 'BRITONS',
    BULGARIANS: 'BULGARIANS',
    BURGUNDIANS: 'BURGUNDIANS',
    BURMESE: 'BURMESE',
    CARTHAGE: 'MEDI',
    CASTILE: 'MEDI',
    CELTS_FEUDAL: 'BRITONS',
    CENTRAL: 'CENTRAL',
    CENTRAL_ASIA: 'CENTRAL_ASIA',
    CENTRAL_ASIA_ANTIQUITY: 'INDIA',
    CENTRAL_ASIA_CASTLE: 'CENTRAL_ASIA',
    CENTRAL_ASIA_IMPERIAL: 'CEAS',
    CHIMU: 'ANDE',
    CRUSADERS: 'WEST',
    CUMAN: 'CUMAN',
    DALI: 'ASIA',
    DELHI: 'INDIA',
    EAST: 'EAST',
    EGYPT: 'ORIE',
    ETHIOPIANS: 'ETHIOPIANS',
    FRANKS: 'FRANKS',
    FRENCH: 'WEST',
    GEORGIANS: 'GEORGIANS',
    GERMANIC: 'GERMANIC',
    GERMANIC_CASTLE: 'VIKINGS',
    GERMANIC_FEUDAL: 'WEST',
    GERMANIC_IMPERIAL: 'WEST',
    GHANA: 'AFRICA',
    GOJOSEON: 'ASIA',
    GORYEO: 'ASIA',
    GOTHS: 'GOTHS',
    GREEK: 'GREEK',
    GURJARAS: 'GURJARAS',
    HEBREWS: 'ORIE',
    HEPHTHALITES: 'CEAS',
    HEXI: 'KHITAN',
    HITTITES: 'ORIE',
    HRE: 'WEST',
    HUAXIA_IMPERIAL: 'ASIA',
    HUNS: 'HUNS',
    ILKHANATE: 'PERSIAN',
    IMPERIAL_ROME: 'ROMA',
    INDIA: 'INDIA',
    INDIA_CASTLE: 'INDIA',
    INDIA_FEUDAL: 'INDIA',
    INDIA_IMPERIAL: 'INDI',
    IROQUOIS: 'MESO',
    ITALIANS: 'MEDI',
    JAPAN: 'JAPAN',
    JAPAN_ANTIQUITY: 'ASIA',
    JAPAN_IMPERIAL: 'JAPAN',
    JAVANESE: 'MALAY',
    JIANGNAN: 'JIANGNAN',
    JOSEON: 'ASIA',
    JURCHEN: 'NORTHEAST',
    KARA_KHITAN: 'CEAS',
    KHAZARS: 'CEAS',
    KHITAN: 'KHITAN',
    KHMER: 'KHMER',
    KOREA: 'KOREA',
    KUSH: 'AFRI',
    KUSHAN: 'CEAS',
    LATIN: 'LATIN',
    LATIN_CASTLE: 'MEDI',
    LATIN_FEUDAL: 'MEDI',
    LATIN_IMPERIAL: 'MEDI',
    LITHUANIANS: 'LITHUANIANS',
    LOMBARDS: 'MEDI',
    MAGYAR: 'MAGYAR',
    MALAY: 'MALAY',
    MAMLUKS: 'ORIE',
    MANCHU: 'NORTHEAST',
    MAPUCHE: 'MAPUCHE',
    MAYANS: 'MAYANS',
    MING: 'ASIA',
    MOHE: 'NORTHEAST',
    MONGOL: 'MONGOL',
    MUGHAL: 'MUGHAL',
    MUISCA: 'MUISCA',
    NABATAEANS: 'ORIE',
    NANZHAO: 'ASIA',
    NORTH: 'WEI',
    NORTHAM_IMPERIAL: 'MEDI',
    NORTHEAST: 'NORTHEAST',
    ORIE: 'ORIE',
    ORIE_ANTIQUITY: 'ORIE',
    OTTOMAN: 'ORIE',
    OTTOMAN_IMPERIAL: 'ORIE',
    PASHTUN: 'PERSIAN',
    PERSIAN: 'PERSIAN',
    PERSIAN_CASTLE: 'PERSIAN',
    POLES: 'POLES',
    PORTUGUESE: 'PORTUGUESE',
    PURU: 'PURU',
    QIANG: 'ASIA',
    ROURAN: 'MONGOL',
    RUS: 'SLAV',
    RUSSIAN: 'SLAV',
    SAFAVID: 'PERSIAN',
    SASANIAN: 'SASANIAN',
    SCOTLAND: 'BRITONS',
    SCYTHIANS: 'EAST',
    SEAS: 'SEAS',
    SEASIA_ANTIQUITY: 'KHMER',
    SEASIA_CASTLE: 'MALAY',
    SEASIA_FEUDAL: 'SEAS',
    SEASIA_IMPERIAL: 'SEAS',
    SELJUQ: 'PERSIAN',
    SERBIA: 'SLAV',
    SICILIANS: 'SICILIANS',
    SIKH: 'INDI',
    SLAVIC: 'SLAVIC',
    SLAVIC_CASTLE: 'SLAV',
    SLAVIC_FEUDAL: 'SLAV',
    SLAVIC_IMPERIAL: 'SLAV',
    SOGDIANS: 'CEAS',
    SONG: 'ASIA',
    SOUTHAM_IMPERIAL: 'ANDE',
    SPANISH: 'SPANISH',
    SRIVIJAYA: 'MALAY',
    STEPPE: 'MOBEI_MONGOL',
    STEPPE_ANTIQUITY: 'CEAS',
    STEPPE_FEUDAL: 'MOBEI_MONGOL',
    STEPPE_IMPERIAL: 'MOBEI_MONGOL',
    SWEDISH: 'WEST',
    TAIRONA: 'ANDE',
    TANGUT: 'KHITAN',
    TARASCAN: 'MESO',
    TEHUELCHE: 'ANDE',
    TEUTONS: 'WEST',
    THRACIAN: 'THRACIAN',
    TIBET: 'PURU',
    TIBET_CASTLE: 'PURU',
    TIBET_IMPERIAL: 'PURU',
    TIMURID: 'CEAS',
    TUPI: 'TUPI',
    TURKS: 'TURKS',
    UIGHUR: 'MOBEI_MONGOL',
    VANDALS: 'ORIE',
    VIETNAMESE: 'VIETNAMESE',
    VIKINGS: 'VIKINGS',
    WEI: 'WEI',
    WESTERN: 'CEAS',
    WESTERN_CASTLE: 'CEAS',
    WESTERN_FEUDAL: 'CEAS',
    WESTERN_IMPERIAL: 'CEAS',
    WEST_ASIA: 'ORIE',
    WEST_ASIA_ANTIQUITY: 'ORIE',
    WEST_ASIA_CASTLE: 'EAST',
    WUSUN: 'CEAS',
    YARLUNG: 'PURU',
};

/** 取第一层文化军团名：优先 region 指针（指向的军团还在才作数）；否则按据点的建筑风格决定军团
 *  🔴 2026-09-16 主人定：军团挂靠保底统一走建筑风格（16+59+3 对应军团）。三级军团被删时，
 *     该武将按据点的 buildingStyle 套军团。 */
export function getCultureLegionName(region: RegionType | null | undefined): string {
    // ① region 指针（显式配置的三级/二级军团）；指向的军团被删（悬空）则不作数，落建筑风格保底
    const ptr = region ? CULTURE_LEGION_NAMES[region] : undefined;
    if (ptr && legionNameExists(ptr)) return ptr;
    // ② 建筑风格保底：据点的 buildingStyle → 军团（16 母体→一级 / 59 文明→二级 / 3 三级→三级）
    const style = region ? REGION_TO_BUILDING_STYLE[region] : undefined;
    if (style) return getLegionNameByStyle(style);
    return '东亚军团';
}

/** 军团名是否存在（一级母体 / 二级 59 文明 / 三级自定义 之一） */
function legionNameExists(name: string): boolean {
    if (Object.values(BASE_16_LEGION_NAME_BY_REGION).includes(name)) return true;
    if (LEVEL_2_CIV_59_MAP.has(name)) return true;
    if (LEVEL_3_LEGION_MAP.has(name)) return true;
    return false;
}

/** 建筑风格 buildingStyle → 军团名（16 母体→一级军团 / 59 文明→二级军团 / 3 三级→三级军团） */
export function getLegionNameByStyle(buildingStyle: string): string {
    // 16 母体 → 一级母体军团（优先，处理重名 ORIE/PURU/PERSIAN/THRACIAN/EAST）
    const base16 = STYLE_TO_BASE16[buildingStyle];
    if (base16) return BASE_16_LEGION_NAME_BY_REGION[base16] || '东亚军团';
    // 59 文明 → 二级军团（region 字段匹配；高丽例外：buildingStyle KOREA ↔ region GORYEO）
    if (buildingStyle === 'KOREA') return '城堡时代高丽军团';
    for (const l2 of LEVEL_2_CIV_59_MAP.values()) {
        if (l2.region === buildingStyle) return l2.name;
    }
    // 3 三级 → 三级军团
    for (const l3 of LEVEL_3_LEGION_MAP.values()) {
        if (l3.regions.includes(buildingStyle)) return l3.name;
    }
    return '东亚军团';
}

/** 编辑器保存后立刻写入内存（不依赖 HMR 才生效） */
export function applyCultureFormationPatch(
    culture: RegionType,
    slots: { type: string; count: number; scale?: number }[],
    formationMode?: FormationMode
): void {
    const normalized: CompositionSlot[] = slots.map((s) => {
        const slot: CompositionSlot = { type: s.type, count: s.count };
        if (s.scale != null && !Number.isNaN(s.scale)) slot.scale = s.scale;
        return slot;
    });
    // 🔴 文化表已删：补丁挂在**军团名**上，不再按文化区存。
    const name = CULTURE_LEGION_NAMES[culture];
    if (!name) return;
    const mode = formationMode ?? getLegionCompositionByName(name)?.formationMode ?? 'square';
    LEGION_RUNTIME_PATCH.set(name, { formationMode: mode, slots: normalized });
}

/**
 * 按文化拿 tier
 */
export function getCultureTier(culture: RegionType, _troops: number = 5000): CompositionTier | null {
    // 🔴 文化表已删：tier 分档（按兵力换编制）从来没启用过——全项目每个文化区都只有一档
    //    `minTroops:0 / maxTroops:Infinity`。现在直接由该区默认军团的编制生成单档。
    const comp = getRegionLegionComposition(culture);
    if (!comp) return null;
    return { minTroops: 0, maxTroops: Infinity, gridSize: 3, slots: comp.slots };
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
