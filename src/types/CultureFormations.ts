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
    INDIA:        'ELEPHANT', // 印度战象（步象）
    BERBER:       'CAVALRY',  // 柏柏尔骆驼骑（纯骑）
    AMERICA:      'MIXED',    // 美洲步+鹰武士
    AFRICA:       'MIXED',    // 非洲步+骆驼
    MALAY:        'INFANTRY', // 马来近战/海军
    ANDE:         'MIXED',    // 安第斯步+鹰武士
    PURU:         'ELEPHANT', // 南印度战象（步象）
    ORIE:         'CAVALRY',  // 阿拉伯骆驼骑（纯骑）
    EAST:         'MIXED',    // 东欧蛮族步骑（波雅尔铁骑+弓，套斯拉夫编成）
    GREEK:        'INFANTRY', // 希腊重装步兵/方阵
    THRACIAN:     'INFANTRY', // 色雷斯轻盾兵
    PERSIAN:      'MIXED',    // 波斯铁甲圣骑+步弓
    CUMAN:        'CAVALRY',  // 库曼钦察草原游牧（纯骑）
    BRITONS: 'MIXED',  // 不列颠[2026-08-28]
    GOTHS: 'INFANTRY',  // 哥特[2026-08-28]
    HUNS: 'CAVALRY',  // 匈人[2026-08-28]
    TEUTONS: 'MIXED',  // 条顿[2026-08-28]
    VIKINGS: 'INFANTRY',  // 维京[2026-08-28]
    CELTS: 'INFANTRY',  // 凯尔特[2026-08-28]
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
    GURJARAS: 'CAVALRY',  // 瞿折罗[2026-08-28]
    VIETNAMESE: 'ELEPHANT',  // 越南[2026-08-28]
    KHMER: 'ELEPHANT',  // 高棉[2026-08-28]
    MAYANS: 'MIXED',  // 玛雅[2026-08-28]
    MAPUCHE: 'MIXED',  // 马普切[2026-08-28]
    MUISCA: 'MIXED',  // 穆伊斯卡[2026-08-28]
    TUPI: 'INFANTRY',  // 图皮[2026-08-28]
    ARMENIANS: 'MIXED',  // 亚美尼亚[2026-08-28]
    GEORGIANS: 'MIXED',  // 格鲁吉亚[2026-08-28]
    BURMESE: 'ELEPHANT',
    WALLACHIA: 'MIXED',
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
    AVARS: 'CAVALRY',
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
    FRENCH: 'CAVALRY',
    MANCHU: 'CAVALRY',
    MUGHAL: 'MIXED',
    SAFAVID: 'CAVALRY',
    RUSSIAN: 'INFANTRY',
    SIKH: 'INFANTRY',
    HEBREWS: 'INFANTRY',
    WUSUN: 'CAVALRY',
    QIANG: 'MIXED',
    NABATAEANS: 'CAVALRY',
    HEPHTHALITES: 'CAVALRY',
    AINU: 'INFANTRY',
    SWISS: 'INFANTRY',
    PASHTUN: 'CAVALRY',
    SWEDISH: 'INFANTRY',
};

export function getCultureMovementClass(culture: RegionType): MovementClass {
    return CULTURE_MOVEMENT_CLASS[culture] ?? 'MIXED';
}

/**
 * 【2026-08-18 主人定稿 · 20 文化区阵型规则】合规审计：`node scratch/audit_culture_formations.mjs`（现 0/20 违规）
 *
 *   ① 四个阵型都是 2/3/4 三排，**文化主力兵种必须占 4 档**（方阵 3+3+3 是主人指定的，不参与本规则）
 *   ② 主力类型 → 阵型：远→雁行 / 步→鱼鳞 / 近战骑→鹤翼 / 弓骑→三角
 *   ③ **象兵、火器不得当主力**（主人原话「太强大了」）
 *   ④ 骑兵只有近战骑、远程骑（弓骑）两类，没有「冲锋骑兵」；按兵种样子归类，不按 ID 名字猜
 *
 * 🔴 这条规则**不是排版，是平衡改动**——4 档 = 军团 4/9 的兵，换谁占 4 档直接改战力。
 *    落地时逐条实测过（`scratch/echelon_ab.mjs` / `echelon_ab2.mjs`，20 种子，新旧编制直接对打）：
 *      川蜀  9:11  → 两种排法强度相当，白换
 *      江南  0:20  → **变强**（精锐火焰弓 rng 400 从 3 档升 4 档，收益极大）
 *      西亚 17:3   → **变弱**（复合弓本身弱，东方剑士从 4 降 3）。已用「近战留 3 档」的排法补偿，
 *                    比直接降到 2 档少削一半（直接换是 20:0）。
 *      岭南 20:0   → **变弱**，且这正是主人要的：旧数据让皮甲战象占 4 档，实测碾压合规版 20:0，
 *                    坐实「象兵当主力太强大」。象已降到 3 档。
 *    ⚠️ 后续若要拉平这些差，改 `GameConfig.CULTURE_COMBAT` 的六维系数，别回头动 4 档归属。
 *
 * ⚠️ 雁行的「4」在**最前排**（`LAYOUT.echelon` row0 = 离敌最近那排），所以远程主力文化是
 *    「弓弩宽线在前齐射、近战居中接应、第二远程压阵」。这是雁行阵本义（张两翼、利弓弩），
 *    不是排错了。若哪天要改成「远程在后」，只能把 4 挪到后排 —— 但那样格位就和三角完全相同，
 *    五大阵型会少一个形状，**别顺手改**。
 *
 * 分组（2026-08-18 用户拍板：四个阵型都是2个3个4个构成，文化主力兵种必须是4个）：
 *  鹤翼阵（crane_wing 2+4+3，4 档在中排，近战骑主力）：北方、河西、朝鲜、青藏、斯拉夫、日耳曼、拉丁
 *  鱼鳞阵（fish_scale 3+4+2，4 档在中排，步兵主力）：日本、希腊、滇缅
 *  三角阵（triangle 2+3+4，4 档在后排，弓骑主力）：草原、东北、中亚、西域、奴儿干
 *  雁行阵（echelon 4+3+2，4 档在前排，远程主力）：中原、川蜀、江南、岭南、西亚
 */
export const CULTURE_FORMATION_MODE: Record<RegionType, FormationMode> = {
    // 鹤翼阵 (2+4+3，步骑远：步兵前锋2 + 主力骑兵两翼包抄4 + 远程中军后排3)
    KOREA:        'crane_wing',   // 朝鲜：剑士步兵(2) + 黑光铠骑兵主力(4) + 火焰弓后排(3)
    SLAVIC:       'crane_wing',   // 斯拉夫：复合弓箭手(3) + 精锐贵族铁骑主力(4) + 精锐草原枪骑(2) [2026-08-30 主人设计]
    GERMANIC:     'crane_wing',   // 日耳曼：冠军剑士(2) + 游侠圣骑主力(4) + 弩手后排(3)
    LATIN:        'crane_wing',   // 拉丁：重装长枪(2) + 重装骑士主力(4) + 劲弩手后排(3)
    TIBET:        'crane_wing',   // 青藏：黑光铠骑兵前锋(2) + 精锐答剌罕主力(4) + 蒙古突骑后排(3)

    // 鱼鳞阵 (3+4+2，2近战+1远程：前卫抗线3 + 主力近战突破4 + 远程后排支援2)
    NORTH:        'fish_scale',   // 北方：辽刀前卫(3) + 精锐黑光铠骑兵突击主力(4) + 诸葛弩后排(2)
    JAPAN:        'fish_scale',   // 日本：日本武士(3) + 精锐武士主力(4) + 藤弓兵后排(2)
    BASHU: 'triangle',  // [2026-09-06] 与该文化势力实际编制统一
    NORTHEAST:    'fish_scale',   // 东北：铁浮图前卫(3) + 精锐铁浮图主力(4) + 钦察后排(2)

    // 三角阵 (2+3+4，尖刀先锋2 + 冲击中坚3 + 主力底边4)
    CENTRAL:      'triangle',     // 中原：刀剑手(2) + 火焰弓箭手(3) + 精锐诸葛弩主力(4)
    STEPPE:       'triangle',     // 草原：怯薛军(2) + 草原枪骑兵(3) + 精锐蒙古突骑主力(4)
    JIANGNAN:     'triangle',     // 江南：刀剑手(2) + 诸葛弩(3) + 精锐火焰弓箭手主力(4)
    LINGNAN: 'triangle',  // [2026-09-06] 与该文化势力实际编制统一
    DIANQIAN:     'triangle',     // 滇缅：战斗象(2) + 步弓手(3) + 爪刀勇士主力(4)
    CENTRAL_ASIA: 'balance_yoke', // 中亚：萨瓦尔铁骑(4) + 精锐草原枪兵(2) + 精锐钦察主力(3)
    WESTERN:      'triangle',     // 西域：斯基泰斧骑(2) + 斯基泰骑射(3) + 精锐斯基泰骑射主力(4)

    // 雁行阵 (4+3+2，前排宽线主力4 + 中坚3 + 压阵2)
    HEXI:         'echelon',      // 河西：精锐辽刀主力(4前) + 黑光铠骑兵中坚(3中) + 诸葛弩后排(2后)
    WEST_ASIA:    'echelon',      // 西亚：东方剑士前排抗线(4) + 重装骑射手中坚(3) + 精锐复合弓后排(2)

    // 印度（鱼鳞 3+4+2：软剑士前卫 + 精锐软剑士主力 + 战象压阵）；柏柏尔（三角 2+3+4：骆驼弓骑主力）
    INDIA:        'crane_wing',
    BERBER:       'triangle',
    AMERICA:      'fish_scale',  // 美洲步兵主力（阿兹特克/玛雅/印加）
    AFRICA:       'fish_scale',  // 非洲步兵主力（马里/埃塞）
    MALAY:        'crane_wing',  // 马来近战主力
    ANDE:         'fish_scale',  // 安第斯步兵主力（印加/马普切）
    PURU: 'crescent',  // [2026-09-06] 与该文化势力实际编制统一
    ORIE:         'triangle',    // 阿拉伯弓骑主力（骆驼弓骑）
    EAST:         'crane_wing',  // 东欧蛮族近战骑主力（哥特重骑/条顿骑士）
    GREEK:        'fish_scale',  // 希腊重装步兵主力（重装步兵/底比斯圣队）
    THRACIAN: 'balance_yoke',  // [2026-09-06] 与同名势力专属军团对齐
    PERSIAN:      'fish_scale',  // 波斯铁甲圣骑主力（萨珊重骑+复合弓）
    CUMAN:        'triangle',    // 库曼弓骑主力（钦察骑射）
    BRITONS: 'fish_scale',  // [2026-09-06] 与该文化势力实际编制统一
    GOTHS: 'fish_scale',  // 哥特[2026-09-05 主人定：雁行阵 4+3+2]
    HUNS: 'balance_yoke',  // [2026-09-06] 与该文化势力实际编制统一
    TEUTONS: 'fish_scale',  // [2026-09-06] 与同名势力专属军团对齐
    VIKINGS: 'fish_scale',  // [2026-09-06] 与同名势力专属军团对齐
    CELTS: 'fish_scale',  // [2026-09-06] 与该文化势力实际编制统一
    ITALIANS: 'crescent',  // [2026-09-06] 与该文化势力实际编制统一
    SICILIANS: 'crane_wing',  // [2026-09-06] 与同名势力专属军团对齐
    BULGARIANS: 'fish_scale',  // 保加利亚[2026-08-28 暂复用父文化]
    MAGYAR: 'crescent',  // 马扎尔[2026-09-05 主人定：正规马扎尔军团偃月阵 3+2+4]
    LITHUANIANS: 'fish_scale',  // [2026-09-06] 与该文化势力实际编制统一
    POLES: 'echelon',  // 波兰[2026-08-28 暂复用父文化]
    BOHEMIANS: 'echelon',  // [2026-09-06] 与同名势力专属军团对齐
    BURGUNDIANS: 'triangle',  // [2026-09-06] 与同名势力专属军团对齐
    SPANISH: 'fish_scale',  // 西班牙[2026-08-28 暂复用父文化]
    PORTUGUESE: 'balance_yoke',  // 葡萄牙[2026-08-28 暂复用父文化]
    ETHIOPIANS: 'echelon',  // 埃塞俄比亚[2026-08-28 暂复用父文化]
    BENGALIS: 'echelon',  // 孟加拉[2026-08-28 暂复用父文化]
    GURJARAS: 'crane_wing',  // 瞿折罗[2026-08-28 暂复用父文化]
    VIETNAMESE: 'triangle',  // [2026-09-06] 与该文化势力实际编制统一
    KHMER: 'triangle',  // [2026-09-06] 与该文化势力实际编制统一
    MAYANS: 'crescent',  // 玛雅[2026-08-28 暂复用父文化]
    MAPUCHE: 'fish_scale',  // [2026-09-06] 与该文化势力实际编制统一
    MUISCA: 'triangle',  // [2026-09-06] 与该文化势力实际编制统一
    TUPI: 'triangle',  // [2026-09-06] 与该文化势力实际编制统一
    ARMENIANS: 'crescent',  // [2026-09-06] 与该文化势力实际编制统一
    GEORGIANS: 'fish_scale',  // 格鲁吉亚[2026-08-28 暂复用父文化]
    BURMESE: 'triangle',  // [2026-09-06] 与同名势力专属军团对齐
    WALLACHIA: 'crane_wing',
    EGYPT: 'echelon',
    CARTHAGE: 'crane_wing',
    BABYLON: 'square',
    HITTITES: 'triangle',
    ASSYRIAN: 'fish_scale',
    SCYTHIANS: 'triangle',
    BYZANTINE: 'square',
    FRANKS: 'triangle',
    SASANIAN: 'triangle',
    TURKS: 'triangle',
    NANZHAO: 'fish_scale',
    SRIVIJAYA: 'crane_wing',
    KUSHAN: 'triangle',
    KUSH: 'crane_wing',
    KHITAN: 'triangle',
    UIGHUR: 'triangle',
    MOHE: 'fish_scale',
    ANGLO_SAXON: 'square',
    AVARS: 'crane_wing',
    GHANA: 'echelon',
    KHAZARS: 'crane_wing',
    VANDALS: 'echelon',
    LOMBARDS: 'square',
    ROURAN: 'triangle',
    SOGDIANS: 'fish_scale',
    TANGUT: 'triangle',
    JAVANESE: 'crane_wing',
    JURCHEN: 'triangle',
    SELJUQ: 'crane_wing',
    OTTOMAN: 'square',
    FRENCH: 'triangle',
    MANCHU: 'triangle',
    MUGHAL: 'crane_wing',
    SAFAVID: 'triangle',
    RUSSIAN: 'square',
    SIKH: 'fish_scale',
    HEBREWS: 'square',
    WUSUN: 'triangle',
    QIANG: 'fish_scale',
    NABATAEANS: 'crane_wing',
    HEPHTHALITES: 'triangle',
    AINU: 'fish_scale',
    SWISS: 'square',
    PASHTUN: 'crescent',
    SWEDISH: 'square',
};

export function getCultureFormationMode(culture: RegionType): FormationMode {
    return CULTURE_FORMATION_MODE[culture] ?? 'square';
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
    { type: 'war_chariot_ranged', count: 3 },  // Row 1 中排 = 先秦远程战车 3乘
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
    const custom = FACTION_COMPOSITIONS[factionId];
    return custom ? [...custom.slots] : null;
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
    const custom = FACTION_COMPOSITIONS[army.factionId];
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
}

// ============================================================
// 20 文化区阵型（2026-08-18 用户拍板：四个阵型均为 2+3+4 结构，文化主力为 4，远程/弓骑在后排）
// ============================================================

/** 1. 中原 刀剑手+火焰弓箭手+精锐诸葛弩（三角阵 2+3+4：刀剑手尖刀 + 火焰弓箭手中坚 + 精锐诸葛弩主力底边） */
export const CENTRAL_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'jian_swordsman', count: 2 }, // Row 0 尖刀先锋 = 刀剑手 2人
            { type: 'fire_archer', count: 3 },    // Row 1 齐射中坚 = 火焰弓箭手 3人
            { type: 'elite_chukonu', count: 4 }   // Row 2 底边主力齐射 = 精锐诸葛弩 4人
        ]
    }
];

/** 2. 北方 辽刀+精锐黑光铠骑兵+诸葛弩（鱼鳞阵 3+4+2：辽刀前卫 + 精锐黑光铠骑兵主力 + 诸葛弩后排支援） */
export const NORTH_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'liao_dao', count: 3 },        // Row 0 前卫 = 辽刀 3人
            { type: 'hei_kuang_heavy', count: 4 }, // Row 1 中军突击主力 = 精锐黑光铠骑兵 4骑
            { type: 'chukonu', count: 2 }          // Row 2 尾收支援 = 诸葛弩 2人
        ]
    }
];

/** 3. 东北 铁浮图+精锐铁浮图+钦察（鱼鳞阵 3+4+2：铁浮图前卫 + 精锐铁浮图主力 + 钦察后排支援） */
export const NORTHEAST_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'iron_pagoda', count: 3 },        // Row 0 前卫突破 = 金国铁浮图 3骑
            { type: 'elite_iron_pagoda', count: 4 },  // Row 1 中军主力 = 精锐铁浮图 4骑
            { type: 'kipchak', count: 2 }             // Row 2 尾收支援 = 钦察弓骑 2骑
        ]
    }
];

/** 4. 朝鲜 剑士+黑光铠骑兵+火焰弓箭手（鹤翼阵 2+4+3：剑士步兵前锋 + 黑光铠骑兵主力 + 火焰弓箭手后排） */
export const KOREA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'swordsman', count: 2 },        // Row 0 步兵前锋 = 剑士 2人
            { type: 'hei_kuang', count: 4 },        // Row 1 骑兵主力两翼合围 = 黑光铠骑兵 4人
            { type: 'fire_archer', count: 3 }       // Row 2 中军后排支援 = 火焰弓箭手 3人
        ]
    }
];

/** 5. 日本 日本武士+精锐武士+藤弓兵（鱼鳞阵 3+4+2：日本武士前卫 + 精锐武士主力突击 + 藤弓兵后排支援） */
export const JAPAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'samurai', count: 3 },          // Row 0 前卫 = 日本武士 3人
            { type: 'samurai_elite', count: 4 },    // Row 1 中军突击主力 = 精锐武士 4人
            { type: 'rattan_archer', count: 2 }     // Row 2 尾收支援 = 藤弓兵 2人
        ]
    }
];

/** 日本战国 忍者+精锐武士+藤弓兵（鹤翼阵 2+4+3：忍者前哨 + 精锐武士两翼合围 + 藤弓兵中军托底） */
export const SENGOKU_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'ninja', count: 2 },            // Row 0 前哨 = 忍者 步兵 2人
            { type: 'samurai_elite', count: 4 },    // Row 1 两翼合围主力 = 精锐武士 步兵 4人
            { type: 'rattan_archer', count: 3 }     // Row 2 中军托底 = 藤弓兵 弓手 3人
        ]
    }
];

/** 6. 草原 草原枪兵+怯薛军+精锐蒙古突骑（三角阵 2+3+4：草原枪兵尖刀 + 怯薛军中坚 + 精锐突骑主力底边） */
export const STEPPE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'keshik', count: 2 },           // Row 0 尖刀先锋 = 怯薛军 2骑
            { type: 'steppe_lancer', count: 3 },    // Row 1 冲击中坚 = 草原枪骑兵 3骑
            { type: 'mangudai_elite', count: 4 }    // Row 2 底边主力齐射 = 精锐蒙古突骑 4骑
        ]
    }
];

/** 马扎尔 骑射手+标枪骑兵+精锐马扎尔骠骑（偃月阵 3+2+4：骑射手前卫 + 标枪骑兵中坚 + 精锐马扎尔骠骑主力 4） */
export const MAGYAR_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'cav_archer', count: 3 },          // Row 0 前卫 = 骑射手 3骑
            { type: 'genitour', count: 2 },            // Row 1 中坚 = 标枪骑兵 2骑
            { type: 'elite_magyar_huszar', count: 4 }  // Row 2 主力 = 精锐马扎尔骠骑 4骑
        ]
    }
];

/** HUNS 文化军团（balance_yoke 4+2+3）
 *  [2026-09-06 铁律 一文化=一军团=一编制] 统一到该文化 1 个势力实际在用的这套
 *  （匈人），原文化表那份已过时，作废。 */
export const HUNS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_tarkan', count: 4 },
            { type: 'steppe_lancer', count: 2 },
            { type: 'antiquity_cavalry_archer', count: 3, scale: 1 }
        ]
    }
];
/** 7. 河西 精锐辽刀+黑光铠骑兵+诸葛弩（雁行阵 4+3+2：精锐辽刀宽线主力 + 黑光铠骑兵中坚 + 诸葛弩压阵） */
export const HEXI_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_liao_dao', count: 4 }, // Row 0 主力·宽线抗线 = 精锐辽刀 4人
            { type: 'hei_kuang', count: 3 },      // Row 1 中军接应 = 黑光铠骑兵 3骑
            { type: 'chukonu', count: 2 }         // Row 2 压阵远程 = 诸葛弩 2人
        ]
    }
];

/** BASHU 文化军团（triangle 2+3+4）
 *  [2026-09-06 铁律 一文化=一军团=一编制] 统一到该文化 44 个势力实际在用的这套
 *  （蜀国、徽州、阆州、荆门…），原文化表那份已过时，作废。 */
export const BASHU_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'white_feather_guard', count: 2 },   // Row 0
            { type: 'elite_white_feather_guard', count: 3 },   // Row 1
            { type: 'elite_chukonu', count: 4 }   // Row 2
        ]
    }
];

/** 9. 江南 刀剑手+诸葛弩+精锐火焰弓箭手（三角阵 2+3+4：刀剑手尖刀 + 诸葛弩中坚 + 精锐火焰弓箭手主力底边） */
export const JIANGNAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'jian_swordsman', count: 2 },    // Row 0 尖刀先锋 = 刀剑手 2人
            { type: 'chukonu', count: 3 },           // Row 1 齐射中坚 = 诸葛弩 3人
            { type: 'elite_fire_archer', count: 4 }  // Row 2 底边主力齐射 = 精锐火焰弓箭手 4人
        ]
    }
];

/** LINGNAN 文化军团（triangle 2+3+4）
 *  [2026-09-06 铁律 一文化=一军团=一编制] 统一到该文化 57 个势力实际在用的这套
 *  （墨侬、水真、黔中、广州…），原文化表那份已过时，作废。 */
export const LINGNAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'battle_elephant', count: 2 },   // Row 0
            { type: 'imperial_skirmisher', count: 3 },   // Row 1
            { type: 'rattan_archer_elite', count: 4 }   // Row 2
        ]
    }
];

/** 11. 滇缅 东南亚战斗象+步弓手+马来爪刀勇士（三角阵 2+3+4：战斗象尖刀 + 步弓手中坚 + 爪刀勇士主力底边） */
export const DIANQIAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'battle_elephant', count: 2 },   // Row 0 尖刀巨兽 = 东南亚战斗象 2人
            { type: 'archer', count: 3 },            // Row 1 散射中坚 = 步弓手 3人
            { type: 'karambit_warrior', count: 4 }   // Row 2 底边主力突击 = 马来爪刀勇士 4人
        ]
    }
];

/** 12. 青藏 黑光铠骑兵+精锐答剌罕骑兵+蒙古突骑（鹤翼阵 2+4+3：黑光铠骑兵前锋 2 + 精锐答剌罕骑兵主力 4 + 蒙古突骑后排支援 3） */
export const TIBET_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'hei_kuang', count: 2 },       // Row 0 前锋 = 黑光铠骑兵 2骑
            { type: 'elite_tarkan', count: 4 },    // Row 1 中军突击主力 = 精锐答剌罕骑兵 4骑
            { type: 'mangudai', count: 3 }         // Row 2 尾收支援 = 蒙古突骑 3骑
        ]
    }
];

/** 13. 中亚 萨瓦尔+精锐草原枪兵+精锐钦察（衡轭阵 4+2+3：萨瓦尔铁骑宽线主力 + 精锐草原枪兵中排接应 + 精锐钦察后排齐射） */
export const CENTRAL_ASIA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'savar', count: 4 },                // Row 0 宽线主力 = 萨瓦尔 4人
            { type: 'elite_steppe_lancer', count: 2 },  // Row 1 中排接应 = 精锐草原枪兵 2人
            { type: 'elite_kipchak', count: 3 }         // Row 2 后排齐射 = 精锐钦察 3人
        ]
    }
];

/** 14. 西域 斯基泰斧骑兵+斯基泰骑射手+斯基泰骑射手精锐（三角阵 2+3+4：斧骑兵尖刀 + 骑射手中坚 + 精锐骑射主力底边） */
export const WESTERN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'scythian_axe_cavalry', count: 2 },       // Row 0 尖刀先锋 = 斯基泰斧骑兵 2人
            { type: 'scythian_horse_archer', count: 3 },      // Row 1 冲击中坚 = 斯基泰骑射手 3人
            { type: 'elite_scythian_horse_archer', count: 4 } // Row 2 底边主力齐射 = 斯基泰骑射手精锐 4人
        ]
    }
];

/** 15. 西亚 东方剑士+重装骑射手+精锐复合弓箭手（雁行阵 4+3+2：东方剑士宽线肉盾主力 + 重装骑射中坚 + 精锐复合弓压阵） */
export const WEST_ASIA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_composite_bowman', count: 4 }, // Row 0 主力·宽线齐射 = 精锐复合弓箭手 4人
            { type: 'eastern_swordsman', count: 3 },      // Row 1 中军接应 = 东方剑士 3人（留 3 档补偿，见文件头）
            { type: 'cav_archer_heavy', count: 2 }        // Row 2 压阵骑射 = 重装骑射手 2人
        ]
    }
];

/** 16. 斯拉夫 贵族铁骑+精锐贵族铁骑+复合弓箭手（鹤翼阵 2+4+3：贵族铁骑前锋 + 精锐波雅尔重骑主力 + 复合弓后排） */
export const SLAVIC_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_steppe_lancer', count: 2, scale: 1 },
            { type: 'composite_bowman', count: 4, scale: 1 },
            { type: 'elite_boyar', count: 3, scale: 1 }
        ]
    }
];
/** 17. 日耳曼 冠军剑士+游侠+弩手（鹤翼阵 2+4+3：冠军剑士前锋 + 游侠圣骑主力 + 弩手后排） */
export const GERMANIC_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'champion', count: 2 },   // Row 0 步兵前锋 = 冠军剑士 2人
            { type: 'paladin', count: 4 },    // Row 1 骑兵主力两翼合围 = 游侠 4人
            { type: 'crossbowman', count: 3 } // Row 2 中军后排支援 = 弩手 3人
        ]
    }
];

/** 18. 拉丁 重装长枪兵+重装骑士+劲弩手（鹤翼阵 2+4+3：重装长枪兵前锋 + 重装骑士主力 + 劲弩手后排） */
export const LATIN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'heavy_pikeman', count: 2 }, // Row 0 步兵前锋 = 重装长枪兵 2人
            { type: 'knight', count: 4 },        // Row 1 骑兵主力两翼合围 = 重装骑士 4人
            { type: 'arbalest', count: 3 }       // Row 2 中军后排支援 = 劲弩手 3人
        ]
    }
];

/** 19. 印度 软剑士+精锐软剑士+桑纳亚战象（鱼鳞阵 3+4+2：软剑士前卫 + 精锐软剑士主力 + 战象压阵） */
export const INDIA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'sannahya', count: 2 },
            { type: 'elite_urumi_swordsman', count: 4 },
            { type: 'pattiyoda_longbowman', count: 3 }
        ]
    }
];

/** 20. 柏柏尔 马穆鲁克+标枪骑兵+骆驼弓骑（三角阵 2+3+4：马穆鲁克尖刀 + 标枪骑兵中坚 + 骆驼弓骑主力） */
export const BERBER_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'camel_heavy', count: 2 },
            { type: 'elite_genitour', count: 3 },
            { type: 'elite_camel_archer', count: 4 }
        ]
    }
];

/** 19. 希腊 希腊重装步兵+底比斯圣队+色雷斯轻装兵（鱼鳞阵 3+4+2：希腊重装步兵前卫 + 底比斯圣队突破主力 + 色雷斯标枪后排） */
// [2026-08-27 撤销并入] 希腊恢复独立区，本表重新被 CULTURE_TIERS_MAP 引用。
export const GREEK_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'greek_noble_cavalry', count: 3 },
            { type: 'elite_greek_cavalry', count: 4 },
            { type: 'cretan_archer', count: 2 }
        ]
    }
];

/** GREEK 希腊文化军团（balance_yoke 4+2+3）
 *  [2026-09-06 铁律 一文化=一军团=一编制] 统一到该文化 5 个势力实际在用的这套
 *  （马其顿、托勒密、塞琉古、帕加马…），原文化表那份已过时，作废。 */
export const ALEXANDER_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'phalangite', count: 4 },   // Row 0
            { type: 'cretan_archer', count: 2 },   // Row 1
            { type: 'companion_cavalry', count: 3 }   // Row 2
        ]
    }
];

/** 20. 奴儿干 答剌罕骑兵+鲜卑掠骑兵+反曲长弓手（鱼鳞阵 3+4+2：答剌罕骑兵前卫 + 鲜卑掠骑兵突击主力 + 反曲长弓手后排） */
// [2026-08-19 收敛 18 大文化] 奴儿干已并入 NORTHEAST，本表不再被 CULTURE_TIERS_MAP 引用。
//   数据保留不删，同上。
export const NUERGAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'tarkan', count: 2 },           // Row 0 尖刀先锋 = 答剌罕骑兵 2人
            { type: 'recurve_bowman', count: 3 },   // Row 1 中坚步射 = 反曲长弓手 3人
            { type: 'xianbei_raider', count: 4 }    // Row 2 主力·骑射底边 = 鲜卑掠骑兵 4人
        ]
    }
];
/** 波斯军团（鱼鳞阵 342）[2026-08-30 主人设计] */
export const PERSIAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'cav_archer', count: 3 },   // Row 0 前卫 = 骑射手 3骑
            { type: 'savar', count: 4 },   // Row 1 主力 = 萨瓦尔铁骑 4骑
            { type: 'elite_war_elephant', count: 2 }   // Row 2 = 精锐战象 2头（象只许占 2 档）
        ]
    }
];

/** 西班牙军团（新月阵 324）[2026-08-30 主人设计] */
export const SPANISH_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'huskarl', count: 3, scale: 1 },
            { type: 'elite_conquistador', count: 4, scale: 1 },
            { type: 'arbalest', count: 2, scale: 1 }
        ]
    }
];
/** 保加利亚军团（鱼鳞阵 342）[2026-08-30 主人设计] */
export const BULGARIANS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'konnik', count: 3 },
            { type: 'elite_konnik', count: 4 },
            { type: 'cav_archer', count: 2 }
        ]
    }
];

/** BRITONS 文化军团（fish_scale 3+4+2）
 *  [2026-09-06 铁律 一文化=一军团=一编制] 统一到该文化 2 个势力实际在用的这套
 *  （麦西亚、英格兰），原文化表那份已过时，作废。 */
export const BRITONS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'champion', count: 3 },   // Row 0
            { type: 'longbowman_elite', count: 4 },   // Row 1
            { type: 'light_riders', count: 2 }   // Row 2
        ]
    }
];

/** 葡萄牙军团（平衡轭阵 423）[2026-08-30 主人设计] */
export const PORTUGUESE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'halberdier', count: 4 },   // Row 0 宽线主力 = 戟兵 4人
            { type: 'elite_organ_gun', count: 2 },   // Row 1 = 精锐风琴炮 2门（火器只许占 2 档）
            { type: 'arbalest', count: 3 }   // Row 2 后排 = 劲弩手 3人
        ]
    }
];

/** 库曼军团（三角阵 234）[2026-08-30 主人设计] */
export const CUMAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'steppe_lancer', count: 2 },
            { type: 'elite_steppe_lancer', count: 3 },
            { type: 'elite_kipchak', count: 4 }
        ]
    }
];

/** 波兰军团（雁行阵 432）[2026-08-30 主人设计] */
export const POLES_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_obuch', count: 4 },
            { type: 'winged_hussar', count: 3 },
            { type: 'cav_archer', count: 2 }
        ]
    }
];

/** 格鲁吉亚军团（鱼鳞阵 342）[2026-08-30 主人设计] */
export const GEORGIANS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'monaspa', count: 3 },
            { type: 'elite_monaspa', count: 4 },
            { type: 'cav_archer', count: 2 }
        ]
    }
];

/** 孟加拉军团（雁行阵 432）[2026-08-30 主人设计] */
export const BENGALIS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'swordsman', count: 4 },
            { type: 'elite_ratha_ranged', count: 3 },
            { type: 'archer', count: 2 }
        ]
    }
];

/** 玛雅军团（新月阵 324）[2026-08-30 主人设计] */
export const MAYANS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'eagle_warrior', count: 3 },
            { type: 'plumed_archer', count: 2 },
            { type: 'elite_plumed_archer', count: 4 }
        ]
    }
];

/** 埃塞俄比亚军团（雁行阵 432）[2026-08-30 主人设计] */
export const ETHIOPIANS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_shotel_warrior', count: 4 },
            { type: 'camel_heavy', count: 3 },
            { type: 'archer', count: 2 }
        ]
    }
];

/** 马来军团（鹤翼阵 243）[2026-08-30 主人设计] */
export const MALAY_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_battle_elephant', count: 2 },
            { type: 'karambit_warrior_elite', count: 4 },
            { type: 'archer', count: 3 }
        ]
    }
];

/** 瞿折罗军团（鹤翼阵 243）[2026-08-30 主人设计] */
export const GURJARAS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_elephant_archer', count: 2 },
            { type: 'elite_chakram_thrower', count: 4 },
            { type: 'elite_shrivamsha_rider', count: 3 }
        ]
    }
];

/** 非洲军团（鱼鳞阵 3+4+2：格贝托女兵前卫 + 精锐格贝托中坚 + 骆驼弓骑后排）[2026-08-30 完成待定制] */
export const AFRICA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'gbeto', count: 3 },
            { type: 'elite_gbeto', count: 4 },
            { type: 'camel_archer', count: 2 }
        ]
    }
];

/** 东欧 冠军剑士+精锐贵族铁骑+复合弓箭手（鹤翼阵 2+4+3）
 *  [2026-09-06] 这里**不跟势力走**：维京·约克 / 挪威两个势力写的那份 formationMode 与格位自相矛盾
 *  （标 crane_wing 却是 3+4+2），且与斯拉夫编制完全重复。保留文化这份，改那两个势力对齐。 */
export const EAST_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'champion', count: 2 },   // Row 0
            { type: 'elite_boyar', count: 4 },   // Row 1 主力
            { type: 'composite_bowman', count: 3 }   // Row 2
        ]
    }
];

/** PURU 文化军团（crescent 3+2+4）
 *  [2026-09-06 铁律 一文化=一军团=一编制] 统一到该文化 1 个势力实际在用的这套
 *  （朱罗），原文化表那份已过时，作废。 */
export const PURU_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'sickle_warrior', count: 3 },   // Row 0
            { type: 'ballista_elephant', count: 2 },   // Row 1
            { type: 'elite_urumi_swordsman', count: 4 }   // Row 2
        ]
    }
];

/** 美洲军团（鱼鳞阵）[2026-08-30 完成待定制] */
export const AMERICA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'eagle_warrior', count: 3 },
            { type: 'elite_eagle_warrior', count: 4 },
            { type: 'plumed_archer', count: 2 }
        ]
    }
];

/** 安第斯军团（鱼鳞阵）[2026-08-30 完成待定制] */
export const ANDE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'kamayuk', count: 3 },
            { type: 'elite_kamayuk', count: 4 },
            { type: 'slinger', count: 2 }
        ]
    }
];

/** 哥特军团（鱼鳞阵）[2026-08-30 完成待定制] */
export const GOTHS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'thracian_peltast', count: 3 },
            { type: 'elite_huskarl', count: 4 },
            { type: 'shock_cavalry', count: 2 }
        ]
    }
];
/** CELTS 文化军团（fish_scale 3+4+2）
 *  [2026-09-06 铁律 一文化=一军团=一编制] 统一到该文化 3 个势力实际在用的这套
 *  （坎布里亚、皮克特、盖尔），原文化表那份已过时，作废。 */
export const CELTS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'woad_raider', count: 3 },   // Row 0
            { type: 'elite_woad_raider', count: 4 },   // Row 1
            { type: 'longbowman', count: 2 }   // Row 2
        ]
    }
];

/** ITALIANS 文化军团（crescent 3+2+4）
 *  [2026-09-06 铁律 一文化=一军团=一编制] 统一到该文化 5 个势力实际在用的这套
 *  （利古里亚、阿诺、托斯卡纳、伦巴第…），原文化表那份已过时，作废。 */
export const ITALIANS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'condottiero', count: 3 },   // Row 0
            { type: 'genoese_crossbowman', count: 2 },   // Row 1
            { type: 'elite_genoese_crossbowman', count: 4 }   // Row 2
        ]
    }
];

/** LITHUANIANS 文化军团（fish_scale 3+4+2）
 *  [2026-09-06 铁律 一文化=一军团=一编制] 统一到该文化 2 个势力实际在用的这套
 *  （立陶宛、涅曼），原文化表那份已过时，作废。 */
export const LITHUANIANS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'winged_hussar', count: 3 },   // Row 0
            { type: 'elite_leitis', count: 4 },   // Row 1
            { type: 'cav_archer', count: 2 }   // Row 2
        ]
    }
];

/** 第一层 18 文化军团名（文化+军团，主人 2026-08-20 定）。
 *  以文化正式名 CULTURE_NAMES 为底；特例 STEPPE 用「草原」（REGION_LABELS）而非「蒙古」，
 *  因「蒙古」留给第二层蒙古系支军团，避免重名。 */
export const CULTURE_LEGION_NAMES: Record<RegionType, string> = {
    CENTRAL: '古典先秦军团',
    NORTH: '古典秦汉军团',
    NORTHEAST: '古典鲜卑军团',
    KOREA: '封建高句丽军团',
    JAPAN: '城堡日本军团',
    STEPPE: '城堡蒙古军团',
    HEXI: '古典秦汉军团',
    BASHU: '古典古蜀军团',
    JIANGNAN: '封建华夏军团',
    LINGNAN: '古典百越军团',
    DIANQIAN: '古典古滇军团',
    TIBET: '封建吐蕃军团',
    CENTRAL_ASIA: '封建突厥军团',
    WEST_ASIA: '封建希腊军团',
    WESTERN: '古典塞种军团',
    SLAVIC: '封建罗斯军团',
    GERMANIC: '古典日耳曼军团',
    LATIN: '古典罗马军团',
    INDIA: '古典印度军团',
    BERBER: '封建柏柏尔军团',
    AMERICA: '城堡墨西加军团',
    AFRICA: '城堡曼丁哥军团',
    MALAY: '封建马来军团',
    ANDE: '城堡克丘亚军团',
    PURU: '封建达罗毗荼军团',
    ORIE: '封建阿拉伯军团',
    EAST: '封建罗斯军团',
    GREEK: '古典希腊军团',
    THRACIAN: '古典色雷斯军团',
    PERSIAN: '古典波斯军团',
    CUMAN: '城堡库曼军团',
    BRITONS: '城堡英格兰军团',
    GOTHS: '封建哥特军团',
    HUNS: '封建匈人军团',
    TEUTONS: '城堡条顿军团',
    VIKINGS: '封建维京军团',
    CELTS: '古典凯尔特军团',
    ITALIANS: '城堡意大利军团',
    SICILIANS: '城堡诺曼军团',
    BULGARIANS: '封建保加利亚军团',
    MAGYAR: '城堡马扎尔军团',
    LITHUANIANS: '城堡立陶宛军团',
    POLES: '城堡波兰军团',
    BOHEMIANS: '城堡捷克军团',
    BURGUNDIANS: '城堡勃艮第军团',
    SPANISH: '帝王西班牙军团',
    PORTUGUESE: '帝王葡萄牙军团',
    ETHIOPIANS: '封建埃塞俄比亚军团',
    BENGALIS: '封建孟加拉军团',
    GURJARAS: '封建瞿折罗军团',
    VIETNAMESE: '城堡京族军团',
    KHMER: '城堡高棉军团',
    MAYANS: '古典玛雅军团',
    MAPUCHE: '帝王马普切军团',
    MUISCA: '城堡穆伊斯卡军团',
    TUPI: '城堡图皮军团',
    ARMENIANS: '古典亚美尼亚军团',
    GEORGIANS: '封建格鲁吉亚军团',
    BURMESE: '城堡缅族军团',
    WALLACHIA: '封建瓦拉几亚军团',
    EGYPT: '古典埃及军团',
    CARTHAGE: '古典布匿军团',
    BABYLON: '古典巴比伦军团',
    HITTITES: '古典赫梯军团',
    ASSYRIAN: '古典亚述军团',
    SCYTHIANS: '古典斯基泰军团',
    BYZANTINE: '封建希腊军团',
    FRANKS: '封建法兰克军团',
    SASANIAN: '封建波斯军团',
    TURKS: '封建突厥军团',
    NANZHAO: '封建白蛮军团',
    SRIVIJAYA: '封建马来军团',
    KUSHAN: '古典月氏军团',
    KUSH: '古典努比亚军团',
    KHITAN: '封建契丹军团',
    UIGHUR: '封建回鹘军团',
    MOHE: '封建靺鞨军团',
    ANGLO_SAXON: '封建盎格鲁-撒克逊军团',
    AVARS: '封建阿瓦尔军团',
    GHANA: '封建加纳军团',
    KHAZARS: '封建可萨军团',
    VANDALS: '封建汪达尔军团',
    LOMBARDS: '封建伦巴第军团',
    ROURAN: '封建柔然军团',
    SOGDIANS: '封建粟特军团',
    TANGUT: '城堡党项军团',
    JAVANESE: '封建爪哇军团',
    JURCHEN: '城堡女真军团',
    SELJUQ: '城堡塞尔柱军团',
    OTTOMAN: '城堡奥斯曼军团',
    FRENCH: '城堡法兰西军团',
    MANCHU: '帝王满洲军团',
    MUGHAL: '帝王莫卧儿军团',
    SAFAVID: '帝王波斯军团',
    RUSSIAN: '帝王俄罗斯军团',
    SIKH: '帝王锡克军团',
    HEBREWS: '古典希伯来军团',
    WUSUN: '古典乌孙军团',
    QIANG: '古典先零羌军团',
    NABATAEANS: '古典纳巴泰军团',
    HEPHTHALITES: '封建嚈哒军团',
    AINU: '城堡阿伊努军团',
    SWISS: '城堡瑞士军团',
    PASHTUN: '帝王普什图军团',
    SWEDISH: '帝王瑞典军团',
};


// ════════════════════════════════════════════════════════════════
// 以下 60 个文化编制，2026-09-07 从提交 f4376a460 原样恢复。
// 起因：合并印度/波斯时的正则误删了 60 个 *_TIERS 定义（本只该删 3 个）。
// 恢复方式是逐个从 git 历史抽回原定义，未重写、未用别名兜底，数值与当时完全一致。
// ════════════════════════════════════════════════════════════════
/** 阿拉伯军团（三角阵 2+3+4：马穆鲁克先锋 + 骆驼骑兵中坚 + 骆驼弓骑主力）[2026-08-30 完成待定制] */
export const ORIE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'mameluke', count: 2 },
            { type: 'camel_rider', count: 3 },
            { type: 'camel_archer', count: 4 }
        ]
    }
];

/** 色雷斯 罗姆菲亚镰刀剑士+轻盾兵+精锐轻盾兵（衡轭阵 4+2+3：镰刀剑士宽线主力 + 轻盾兵中排 + 精锐轻盾兵后排）
 *  [2026-09-06] 编制取自主人已写好的同名势力专属军团（seleisi/奥德里西亚等 5 势力），文化保底与它对齐，消除「同名不同编」。 */
export const THRACIAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'rhomphaia_warrior', count: 4 },   // Row 0 宽线主力 = 罗姆菲亚镰刀剑士 4人
            { type: 'thracian_peltast', count: 2 },   // Row 1 中排 = 色雷斯轻盾兵 2人
            { type: 'elite_peltast', count: 3 }   // Row 2 后排 = 精锐轻盾兵 3人
        ]
    }
];

/** 条顿 条顿骑士+精锐条顿骑士+十字军骑士（鱼鳞阵 3+4+2：条顿骑士前卫 + 精锐条顿骑士主力 + 十字军骑士压阵）
 *  [2026-09-06] 编制取自主人已写好的同名势力专属军团（条顿骑士团/宝剑骑士团/利沃尼亚），文化保底与它对齐，消除「同名不同编」。 */
export const TEUTONS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'teutonic_knight', count: 3 },   // Row 0 前卫 = 条顿骑士 3人
            { type: 'elite_teutonic_knight', count: 4 },   // Row 1 主力 = 精锐条顿骑士 4人
            { type: 'crusader_knight', count: 2 }   // Row 2 压阵 = 十字军骑士 2骑
        ]
    }
];

/** 维京 北欧战士+精锐狂战士+散兵（鱼鳞阵 3+4+2：北欧战士前卫 + 狂战士主力突破 + 散兵压阵）
 *  [2026-09-06] 编制取自主人已写好的同名势力专属军团（挪威/丹麦/瑞典），文化保底与它对齐，消除「同名不同编」。 */
export const VIKINGS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'norse_warrior', count: 3 },   // Row 0 前卫 = 北欧战士 3人
            { type: 'elite_berserk', count: 4 },   // Row 1 主力 = 精锐狂战士 4人
            { type: 'skirmisher', count: 2 }   // Row 2 压阵 = 散兵 2人
        ]
    }
];

/** 西西里 诺曼军士+精锐军士+劲弩手（鹤翼阵 2+4+3：军士前锋 + 精锐军士主力 + 劲弩手后排）
 *  [2026-09-06] 编制取自主人已写好的同名势力专属军团（西西里王国/墨西拿/撒丁），文化保底与它对齐，消除「同名不同编」。 */
export const SICILIANS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'serjeant', count: 2 },   // Row 0 前锋 = 诺曼军士 2人
            { type: 'elite_serjeant', count: 4 },   // Row 1 主力 = 精锐军士 4人
            { type: 'arbalest', count: 3 }   // Row 2 后排 = 劲弩手 3人
        ]
    }
];

/** 波希米亚 戟兵+精锐胡斯战车+劲弩手（雁行阵 4+3+2：戟兵宽线主力 + 胡斯战车中坚 + 劲弩手压阵）
 *  [2026-09-06] 编制取自主人已写好的同名势力专属军团（波希米亚），文化保底与它对齐，消除「同名不同编」。 */
export const BOHEMIANS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_hussite_wagon', count: 4, scale: 1 },
            { type: 'konnik_foot', count: 3, scale: 1 },
            { type: 'arbalest', count: 2, scale: 1 }
        ]
    }
];

/** 勃艮第 火枪手+佛兰德长枪兵+精锐扈从骑兵（三角阵 2+3+4：火枪手尖刀 + 长枪兵中坚 + 扈从骑兵主力底边）
 *  [2026-09-06] 编制取自主人已写好的同名势力专属军团（勃艮第），文化保底与它对齐，消除「同名不同编」。 */
export const BURGUNDIANS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'hand_cannoneer', count: 2 },   // Row 0 尖刀 = 火枪手 2人
            { type: 'flemish_pikeman', count: 3 },   // Row 1 中坚 = 佛兰德长枪兵 3人
            { type: 'elite_coustillier', count: 4 }   // Row 2 底边主力 = 精锐扈从骑兵 4骑
        ]
    }
];

/** VIETNAMESE 文化军团（triangle 2+3+4）
 *  [2026-09-06 铁律 一文化=一军团=一编制] 统一到该文化 1 个势力实际在用的这套
 *  （大越），原文化表那份已过时，作废。 */
export const VIETNAMESE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_battle_elephant', count: 2 },   // Row 0
            { type: 'imperial_skirmisher', count: 3 },   // Row 1
            { type: 'rattan_archer_elite', count: 4 }   // Row 2
        ]
    }
];

/** KHMER 文化军团（triangle 2+3+4）
 *  [2026-09-06 铁律 一文化=一军团=一编制] 统一到该文化 1 个势力实际在用的这套
 *  （真腊），原文化表那份已过时，作废。 */
export const KHMER_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_ballista_elephant', count: 2 },   // Row 0 尖刀 = 精锐弩炮象 2头（象只许占 2 档）
            { type: 'spearman', count: 3 },   // Row 1 中坚 = 长枪兵 3人
            { type: 'archer', count: 4 }   // Row 2 底边主力 = 弓箭手 4人
        ]
    }
];

/** MAPUCHE 文化军团（fish_scale 3+4+2）
 *  [2026-09-06 铁律 一文化=一军团=一编制] 统一到该文化 1 个势力实际在用的这套
 *  （马普切），原文化表那份已过时，作废。 */
export const MAPUCHE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'kona', count: 3 },   // Row 0
            { type: 'elite_kona', count: 4 },   // Row 1
            { type: 'elite_bolas_rider', count: 2 }   // Row 2
        ]
    }
];

/** MUISCA 文化军团（triangle 2+3+4）
 *  [2026-09-06 铁律 一文化=一军团=一编制] 统一到该文化 1 个势力实际在用的这套
 *  （穆伊斯卡），原文化表那份已过时，作废。 */
export const MUISCA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_champi_warrior', count: 2 },   // Row 0
            { type: 'elite_temple_guard', count: 3 },   // Row 1
            { type: 'elite_guecha_warrior', count: 4 }   // Row 2
        ]
    }
];

/** TUPI 文化军团（triangle 2+3+4）
 *  [2026-09-06 铁律 一文化=一军团=一编制] 统一到该文化 1 个势力实际在用的这套
 *  （图皮），原文化表那份已过时，作废。 */
export const TUPI_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_champi_warrior', count: 2 },   // Row 0
            { type: 'elite_ibirapema_warrior', count: 3 },   // Row 1
            { type: 'elite_blackwood_archer', count: 4 }   // Row 2
        ]
    }
];

/** ARMENIANS 文化军团（crescent 3+2+4）
 *  [2026-09-06 铁律 一文化=一军团=一编制] 统一到该文化 1 个势力实际在用的这套
 *  （亚美尼亚），原文化表那份已过时，作废。 */
export const ARMENIANS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'warrior_priest', count: 3 },
            { type: 'elite_composite_bowman', count: 2, scale: 1 },
            { type: 'sarmatian', count: 4, scale: 1 }
        ]
    }
];

/** 斯巴达 希腊骑兵三排同兵（方阵 3+3+3；方阵是主人单独指定的形态，不参与「主力占 4 档」规则）
 *  [2026-09-06] 编制取自主人已写好的同名势力专属军团（拉哥尼亚），文化保底与它对齐，消除「同名不同编」。 */
/** 缅甸 精锐战斗象+步弓手+精锐飞镖骑兵（三角阵 2+3+4：战象尖刀 + 步弓手中坚 + 飞镖骑兵主力底边）
 *  [2026-09-06] 编制取自主人已写好的同名势力专属军团（勃固/东吁/贡榜/骠/孟/蒲甘/阿瓦 7 势力），文化保底与它对齐，消除「同名不同编」。 */
export const BURMESE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_battle_elephant', count: 2 },   // Row 0 尖刀 = 精锐战斗象 2头（象只许占 2 档）
            { type: 'archer', count: 3 },   // Row 1 中坚 = 步弓手 3人
            { type: 'elite_arambai', count: 4 }   // Row 2 底边主力 = 精锐飞镖骑兵 4骑
        ]
    }
];

/** 瓦拉几亚军团（鹤翼阵）[2026-08-30 完成待定制] */
export const WALLACHIA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'champion', count: 2 },
            { type: 'elite_boyar', count: 4 },
            { type: 'cav_archer', count: 3 }
        ]
    }
];

/** 埃及 复合弓手+双轮战车+长矛兵（雁行阵 4+3+2：复合弓手宽线齐射4 + 双轮战车中军冲击3 + 长矛兵压阵抗线2） */
export const EGYPT_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'composite_bowman', count: 4 },
            { type: 'war_chariot_ranged', count: 3 },
            { type: 'spearman', count: 2 }
        ]
    }
];

/** 迦太基 战象+长矛兵+标枪手（鹤翼阵 2+4+3：破阵战象尖刀2 + 利比亚长矛主力两翼合围4 + 标枪手压阵3） */
export const CARTHAGE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'battle_elephant', count: 2 },
            { type: 'spearman', count: 4 },
            { type: 'skirmisher', count: 3 }
        ]
    }
];

/** 巴比伦 复合弓手+战车+东方步兵（方阵 3+3+3：前排复合弓齐射3 + 中排战车冲击3 + 后排大盾长矛抗线3） */
export const BABYLON_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'composite_bowman', count: 3 },
            { type: 'war_chariot_ranged', count: 3 },
            { type: 'eastern_swordsman', count: 3 }
        ]
    }
];

/** 赫梯 重战车+长矛兵+主力重战车（锥形阵 2+3+4：尖刀战车2 + 长矛掩护3 + 重型战车集群主力4） */
export const HITTITES_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'war_chariot_ranged', count: 2 },
            { type: 'spearman', count: 3 },
            { type: 'war_chariot_ranged', count: 4 }
        ]
    }
];

/** 亚述 东方步兵+重装步兵+复合弓（鱼鳞阵 3+4+2：前排大盾3 + 中腰铁血重步突破主力4 + 后排复合弓2） */
export const ASSYRIAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'eastern_swordsman', count: 3 },
            { type: 'longswordsman', count: 4 },
            { type: 'composite_bowman', count: 2 }
        ]
    }
];

/** 斯基泰 战斧骑兵+骑射手+骑射主力（锥形阵 2+3+4：斧骑先锋2 + 骑射手3 + 草原骑射主力4） */
export const SCYTHIANS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'scythian_axe_cavalry', count: 2 },
            { type: 'scythian_horse_archer', count: 3 },
            { type: 'scythian_horse_archer', count: 4 }
        ]
    }
];

/** 拜占庭 圣骑兵+重步兵+复合弓兵（方阵 3+4+2：具装圣骑兵3 + 斯库塔托重步兵4 + 复合弓兵2） */
export const BYZANTINE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'cataphract', count: 3 },
            { type: 'longswordsman', count: 4 },
            { type: 'composite_bowman', count: 2 }
        ]
    }
];

/** 法兰克 查理曼圣骑士+封建重骑士+强弩兵（锥形阵 2+3+4：圣骑士前锋2 + 重装骑士3 + 强弩兵4） */
export const FRANKS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'paladin', count: 2 },
            { type: 'knight', count: 3 },
            { type: 'crossbowman', count: 4 }
        ]
    }
];

/** 萨珊 不死全具装铁骑+不死卫队+复合弓兵（锥形阵 2+3+4：Savan铁骑2 + 不死卫队3 + 萨珊弓手4） */
export const SASANIAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'savar', count: 2 },
            { type: 'immortal', count: 3 },
            { type: 'composite_bowman', count: 4 }
        ]
    }
];

/** 突厥 答剌罕精骑+草原枪骑+草原骑射手（锥形阵 2+3+4：答剌罕重骑2 + 草原枪骑3 + 骑射手4） */
export const TURKS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'tarkan', count: 2 },
            { type: 'steppe_lancer', count: 3 },
            { type: 'scythian_horse_archer', count: 4 }
        ]
    }
];

/** 南诏 战象+罗苴子重步兵+藤甲神射（鱼鳞阵 2+4+3：山地象军2 + 罗苴子甲士4 + 藤甲弓手3） */
export const NANZHAO_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'war_elephant', count: 2 },
            { type: 'longswordsman', count: 4 },
            { type: 'rattan_archer', count: 3 }
        ]
    }
];

/** 三佛齐 爪刀短剑士+藤甲弓手+王家战象（鹤翼阵 4+3+2：波浪短剑士4 + 藤甲战弓手3 + 战象2） */
export const SRIVIJAYA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'karambit_warrior', count: 4 },
            { type: 'rattan_archer', count: 3 },
            { type: 'war_elephant', count: 2 }
        ]
    }
];

/** 古典月氏 具装铁骑+骑射手+战象（三角阵 4+3+2：具装甲骑4 + 古典骑射3 + 战象2） */
export const KUSHAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'cataphract', count: 4 },
            { type: 'antiquity_cavalry_archer', count: 3 },
            { type: 'battle_elephant', count: 2 }
        ]
    }
];

/** 古典努比亚 努比亚神射手+长矛兵+轻装散兵（鹤翼阵 4+3+2：复合弓手4 + 长矛兵3 + 散兵2） */
export const KUSH_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'composite_bowman', count: 4 },
            { type: 'spearman', count: 3 },
            { type: 'skirmisher', count: 2 }
        ]
    }
];

/** 契丹 皮室具装重铁骑+反曲角弓骑+铁骨朵精兵（三角阵 4+3+2） */
export const KHITAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'iron_pagoda', count: 4 },
            { type: 'cav_archer', count: 3 },
            { type: 'longswordsman', count: 2 }
        ]
    }
];

/** 回鹘 金镞角弓骑+回鹘突骑+长刀轻骑（三角阵 4+3+2） */
export const UIGHUR_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'cav_archer', count: 4 },
            { type: 'lancer', count: 3 },
            { type: 'knight', count: 2 }
        ]
    }
];

/** 靺鞨 鹿角硬弓步兵+山地重长矛+雪原短刀手（鱼鳞阵 4+3+2） */
export const MOHE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'archer', count: 4 },
            { type: 'pikeman', count: 3 },
            { type: 'swordsman', count: 2 }
        ]
    }
];

/** 盎格鲁-撒克逊 撒克斯双手大斧+坚矛盾墙长矛+猎弓兵（方阵 3+3+3） */
export const ANGLO_SAXON_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'longswordsman', count: 3 },
            { type: 'swordsman', count: 3 },
            { type: 'pikeman', count: 3 }
        ]
    }
];

/** 阿瓦尔 双马镫装甲骑射+阿瓦尔长骑枪+轻骑兵（鹤翼阵 4+3+2） */
export const AVARS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'cav_archer', count: 4 },
            { type: 'lancer', count: 3 },
            { type: 'scout_cavalry', count: 2 }
        ]
    }
];

/** 加纳 索宁克黄金长矛+淬毒长箭弓兵+近卫骆驼（雁行阵 4+3+2） */
export const GHANA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'pikeman', count: 4 },
            { type: 'archer', count: 3 },
            { type: 'camel_rider', count: 2 }
        ]
    }
];

/** 可萨 拉尔西亚锁甲铁骑+双曲反曲弓骑+高加索重步（鹤翼阵 4+3+2） */
export const KHAZARS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'knight', count: 4 },
            { type: 'cav_archer', count: 3 },
            { type: 'longswordsman', count: 2 }
        ]
    }
];

/** 汪达尔 重装突击长枪+突击重骑+掷矛手（梯形阵 4+3+2） */
export const VANDALS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'longswordsman', count: 4 },
            { type: 'knight', count: 3 },
            { type: 'skirmisher', count: 2 }
        ]
    }
];

/** 伦巴第 撒克斯重单刃刀+铁王冠突击重骑+掷斧步兵（方阵 4+3+2） */
export const LOMBARDS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'longswordsman', count: 4 },
            { type: 'knight', count: 3 },
            { type: 'longswordsman', count: 2 }
        ]
    }
];

/** 柔然 全具装生铁马铠重骑+鸣镝长角弓骑+诱伏轻骑（锋矢阵 4+3+2） */
export const ROURAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'cataphract', count: 4 },
            { type: 'cav_archer', count: 3 },
            { type: 'scout_cavalry', count: 2 }
        ]
    }
];

/** 粟特 绿洲城守重弩+双层锁甲武装商队铁骑+复合弓手（鱼鳞阵 4+3+2） */
export const SOGDIANS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'crossbowman', count: 4 },
            { type: 'knight', count: 3 },
            { type: 'archer', count: 2 }
        ]
    }
];

/** 党项 铁索缚鞍铁鹞子+山讹攀岩重斧步兵+神臂步弩手（锋矢阵 4+3+2） */
export const TANGUT_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'knight', count: 4 },
            { type: 'longswordsman', count: 3 },
            { type: 'crossbowman', count: 2 }
        ]
    }
];

/** 爪哇 波浪淬毒克利斯剑士+热带竹标枪手+跳帮突击武士（鹤翼阵 4+3+2） */
export const JAVANESE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'longswordsman', count: 4 },
            { type: 'skirmisher', count: 3 },
            { type: 'swordsman', count: 2 }
        ]
    }
];

/** 女真 全具装铁浮屠连环重骑+两翼拐子马弓骑+硬弓重步兵（锋矢阵 4+3+2） */
export const JURCHEN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'cataphract', count: 4 },
            { type: 'cav_archer', count: 3 },
            { type: 'longswordsman', count: 2 }
        ]
    }
];

/** 塞尔柱 丹丹纳突厥重装骑枪兵+反曲角弓骑+突厥马刀轻骑（鹤翼阵 4+3+2） */
export const SELJUQ_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'lancer', count: 4 },
            { type: 'cav_archer', count: 3 },
            { type: 'light_cavalry', count: 2 }
        ]
    }
];

/** 奥斯曼 苏丹亲兵耶尼切里步火兵+西帕希重骑兵+大弯刀死士（方阵 4+3+2） */
export const OTTOMAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'hand_cannoneer', count: 4 },
            { type: 'knight', count: 3 },
            { type: 'longswordsman', count: 2 }
        ]
    }
];

/** 法兰西 敕令重装板甲骑士+大十字弩手+长戟步兵（锋矢阵 4+3+2） */
export const FRENCH_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'knight', count: 4 },
            { type: 'crossbowman', count: 3 },
            { type: 'halberdier', count: 2 }
        ]
    }
];

/** 满洲 八旗骑射手+白甲精锐马铠铁骑+重装步兵（锋矢阵 4+3+2） */
export const MANCHU_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'knight', count: 4 },
            { type: 'cav_archer', count: 3 },
            { type: 'longswordsman', count: 2 }
        ]
    }
];

/** 莫卧儿 锁子甲铁甲战象+拉杰普特重弯刀骑兵+复合弓手（鹤翼阵 2+4+3） */
export const MUGHAL_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'war_elephant', count: 2 },
            { type: 'knight', count: 4 },
            { type: 'archer', count: 3 }
        ]
    }
];

/** 萨法维 红头军克兹尔巴什弯刀重骑兵+骑射手+古拉姆卫士（三角阵 4+3+2） */
export const SAFAVID_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'knight', count: 4 },
            { type: 'cav_archer', count: 3 },
            { type: 'guardsman', count: 2 }
        ]
    }
];

/** 俄罗斯 传统双手大战斧步兵+射击军+哥萨克轻骑（方阵 4+3+2） */
export const RUSSIAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'longswordsman', count: 4 },
            { type: 'hand_cannoneer', count: 3 },
            { type: 'light_cavalry', count: 2 }
        ]
    }
];

/** 锡克 卡尔萨近战狂热战士+战刀突击队+长枪火枪队（鱼鳞阵 4+3+2） */
export const SIKH_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'longswordsman', count: 4 },
            { type: 'guardsman', count: 3 },
            { type: 'hand_cannoneer', count: 2 }
        ]
    }
];

/** 希伯来 基利提重装圣卫+投石手+佩剑卫士（方阵 3+3+3） */
export const HEBREWS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'guardsman', count: 3 },
            { type: 'longswordsman', count: 3 },
            { type: 'archer', count: 3 }
        ]
    }
];

/** 乌孙 大漠控弦突骑+耐力重装骑矛手+轻骑射（三角阵 4+3+2） */
export const WUSUN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'knight', count: 4 },
            { type: 'cav_archer', count: 3 },
            { type: 'light_cavalry', count: 2 }
        ]
    }
];

/** 先零羌 湟水山地长矛步兵+断道短刀死士+羌族突骑（鱼鳞阵 4+3+2） */
export const QIANG_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'longswordsman', count: 4 },
            { type: 'spearman', count: 3 },
            { type: 'light_cavalry', count: 2 }
        ]
    }
];

/** 纳巴泰 红海香路沙漠驼骑+岩壁神射手+悬崖护卫（鹤翼阵 2+4+3） */
export const NABATAEANS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'cav_archer', count: 2 },
            { type: 'knight', count: 4 },
            { type: 'archer', count: 3 }
        ]
    }
];

/** 嚈哒 白匈奴生铁具装马铠重骑+复合角弓骑射+突厥马刀死士（三角阵 4+3+2） */
export const HEPHTHALITES_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'knight', count: 4 },
            { type: 'cav_archer', count: 3 },
            { type: 'light_cavalry', count: 2 }
        ]
    }
];

/** 阿伊努 鄂霍次克附子毒矢猎人+山地长矛短刀+森林勇士（鱼鳞阵 4+3+2） */
export const AINU_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'archer', count: 4 },
            { type: 'spearman', count: 3 },
            { type: 'guardsman', count: 2 }
        ]
    }
];

export const SWISS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'spearman', count: 4 },
            { type: 'guardsman', count: 3 },
            { type: 'crossbowman', count: 2 }
        ]
    }
];

export const PASHTUN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'knight', count: 4 },
            { type: 'archer', count: 3 },
            { type: 'light_cavalry', count: 2 }
        ]
    }
];

export const SWEDISH_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'spearman', count: 4 },
            { type: 'guardsman', count: 3 },
            { type: 'crossbowman', count: 2 }
        ]
    }
];

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
    INDIA:        INDIA_TIERS,
    BERBER:       BERBER_TIERS,
    AMERICA:      AMERICA_TIERS,      // ⚠️ [2026-08-24] 暂复用拉丁编成（美洲步兵），待定制
    AFRICA:       AFRICA_TIERS,     // ⚠️ [2026-08-24] 暂复用柏柏尔编成（非洲步/骆驼），待定制
    MALAY:        MALAY_TIERS,   // ⚠️ [2026-08-24] 暂复用滇缅编成（马来），待定制
    ANDE:         ANDE_TIERS,      // ⚠️ [2026-08-27] 暂复用拉丁编成（安第斯步兵），待定制
    PURU:         PURU_TIERS,      // ⚠️ [2026-08-27] 暂复用印度编成（南印度象兵），待定制
    ORIE:         ORIE_TIERS,     // ⚠️ [2026-08-27] 暂复用柏柏尔编成（阿拉伯骆驼骑），待定制
    EAST:         EAST_TIERS,     // ⚠️ [2026-08-27] 暂复用斯拉夫编成（东欧波雅尔铁骑+弓，罗斯已迁入），待定制
    GREEK:        GREEK_TIERS,      // ✅ [2026-08-27] 恢复原希腊编成（重装步兵+圣队+轻装兵）
    THRACIAN: THRACIAN_TIERS,  // [2026-09-06 铁律「一文化=一军团=一编制」] 原借用SLAVIC_TIERS，已改独立编成
    PERSIAN:      PERSIAN_TIERS,  // ⚠️ [2026-08-27] 暂复用西亚编成（铁甲圣骑兵=波斯/萨珊招牌），待定制
    CUMAN:        CUMAN_TIERS,     // ⚠️ [2026-08-27] 暂复用草原编成（弓骑+轻骑游牧），待定制
    BRITONS: BRITONS_TIERS,  // 不列颠[2026-08-28 暂复用父文化]
    GOTHS: GOTHS_TIERS,  // 哥特[2026-08-28 暂复用父文化]
    HUNS: HUNS_TIERS,  // 匈人[2026-09-05 主人定：独立编成]
    TEUTONS: TEUTONS_TIERS,  // [2026-09-06 铁律「一文化=一军团=一编制」] 原借用GERMANIC_TIERS，已改独立编成
    VIKINGS: VIKINGS_TIERS,  // [2026-09-06 铁律「一文化=一军团=一编制」] 原借用SLAVIC_TIERS，已改独立编成
    CELTS: CELTS_TIERS,  // 凯尔特[2026-08-28 暂复用父文化]
    ITALIANS: ITALIANS_TIERS,  // 意大利[2026-08-28 暂复用父文化]
    SICILIANS: SICILIANS_TIERS,  // [2026-09-06 铁律「一文化=一军团=一编制」] 原借用LATIN_TIERS，已改独立编成
    BULGARIANS: BULGARIANS_TIERS,  // 保加利亚[2026-08-28 暂复用父文化]
    MAGYAR: MAGYAR_TIERS,  // 马扎尔[2026-09-05 主人定：正规马扎尔军团编成]
    LITHUANIANS: LITHUANIANS_TIERS,  // 立陶宛[2026-08-28 暂复用父文化]
    POLES: POLES_TIERS,  // 波兰[2026-08-28 暂复用父文化]
    BOHEMIANS: BOHEMIANS_TIERS,  // [2026-09-06 铁律「一文化=一军团=一编制」] 原借用SLAVIC_TIERS，已改独立编成
    BURGUNDIANS: BURGUNDIANS_TIERS,  // [2026-09-06 铁律「一文化=一军团=一编制」] 原借用LATIN_TIERS，已改独立编成
    SPANISH: SPANISH_TIERS,  // 西班牙[2026-08-28 暂复用父文化]
    PORTUGUESE: PORTUGUESE_TIERS,  // 葡萄牙[2026-08-28 暂复用父文化]
    ETHIOPIANS: ETHIOPIANS_TIERS,  // 埃塞俄比亚[2026-08-28 暂复用父文化]
    BENGALIS: BENGALIS_TIERS,  // 孟加拉[2026-08-28 暂复用父文化]
    GURJARAS: GURJARAS_TIERS,  // 瞿折罗[2026-08-28 暂复用父文化]
    VIETNAMESE: VIETNAMESE_TIERS,  // 越南[2026-08-28 暂复用父文化]
    KHMER: KHMER_TIERS,  // 高棉[2026-08-28 暂复用父文化]
    MAYANS: MAYANS_TIERS,  // 玛雅[2026-08-28 暂复用父文化]
    MAPUCHE: MAPUCHE_TIERS,  // 马普切[2026-08-28 暂复用父文化]
    MUISCA: MUISCA_TIERS,  // 穆伊斯卡[2026-08-28 暂复用父文化]
    TUPI: TUPI_TIERS,  // 图皮[2026-08-28 暂复用父文化]
    ARMENIANS: ARMENIANS_TIERS,  // 亚美尼亚[2026-08-28 暂复用父文化]
    GEORGIANS: GEORGIANS_TIERS,  // 格鲁吉亚[2026-08-28 暂复用父文化]
    BURMESE: BURMESE_TIERS,  // [2026-09-06 铁律「一文化=一军团=一编制」] 原借用DIANQIAN_TIERS，已改独立编成
    WALLACHIA: WALLACHIA_TIERS,
    EGYPT: EGYPT_TIERS,
    CARTHAGE: CARTHAGE_TIERS,
    BABYLON: BABYLON_TIERS,
    HITTITES: HITTITES_TIERS,
    ASSYRIAN: ASSYRIAN_TIERS,
    SCYTHIANS: SCYTHIANS_TIERS,
    BYZANTINE: BYZANTINE_TIERS,
    FRANKS: FRANKS_TIERS,
    SASANIAN: SASANIAN_TIERS,
    TURKS: TURKS_TIERS,
    NANZHAO: NANZHAO_TIERS,
    SRIVIJAYA: SRIVIJAYA_TIERS,
    KUSHAN: KUSHAN_TIERS,
    KUSH: KUSH_TIERS,
    KHITAN: KHITAN_TIERS,
    UIGHUR: UIGHUR_TIERS,
    MOHE: MOHE_TIERS,
    ANGLO_SAXON: ANGLO_SAXON_TIERS,
    AVARS: AVARS_TIERS,
    GHANA: GHANA_TIERS,
    KHAZARS: KHAZARS_TIERS,
    VANDALS: VANDALS_TIERS,
    LOMBARDS: LOMBARDS_TIERS,
    ROURAN: ROURAN_TIERS,
    SOGDIANS: SOGDIANS_TIERS,
    TANGUT: TANGUT_TIERS,
    JAVANESE: JAVANESE_TIERS,
    JURCHEN: JURCHEN_TIERS,
    SELJUQ: SELJUQ_TIERS,
    OTTOMAN: OTTOMAN_TIERS,
    FRENCH: FRENCH_TIERS,
    MANCHU: MANCHU_TIERS,
    MUGHAL: MUGHAL_TIERS,
    SAFAVID: SAFAVID_TIERS,
    RUSSIAN: RUSSIAN_TIERS,
    SIKH: SIKH_TIERS,
    HEBREWS: HEBREWS_TIERS,
    WUSUN: WUSUN_TIERS,
    QIANG: QIANG_TIERS,
    NABATAEANS: NABATAEANS_TIERS,
    HEPHTHALITES: HEPHTHALITES_TIERS,
    AINU: AINU_TIERS,
    SWISS: SWISS_TIERS,
    PASHTUN: PASHTUN_TIERS,
    SWEDISH: SWEDISH_TIERS,
};

/** 取第一层文化军团名（未知区兜底中原军团） */
export function getCultureLegionName(region: RegionType | null | undefined): string {
    return (region && CULTURE_LEGION_NAMES[region]) || CULTURE_LEGION_NAMES.CENTRAL;
}

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
