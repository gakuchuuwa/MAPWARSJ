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
    STEPPE_IMPERIAL:'CAVALRY',
    TIBET:        'CAVALRY',
    TIBET_CASTLE:  'CAVALRY',
    TIBET_IMPERIAL:'CAVALRY',
    CENTRAL_ASIA: 'CAVALRY',
    CENTRAL_ASIA_IMPERIAL: 'CAVALRY',
    WEST_ASIA:    'MIXED',
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
    BASHU:        'INFANTRY',
    JIANGNAN:     'INFANTRY',
    LINGNAN:      'INFANTRY',
    DIANQIAN:     'ELEPHANT',
    SLAVIC:       'MIXED',   // 东欧步骑
    GERMANIC:     'MIXED', // 中欧步骑（重步+骑士）
    LATIN:        'INFANTRY', // 西欧重步/军团
    LATIN_FEUDAL: 'INFANTRY',
    INDIA:        'ELEPHANT', // 印度战象（步象）
    BERBER:       'CAVALRY',  // 柏柏尔骆驼骑（纯骑）
    AMERICA:      'MIXED',    // 美洲步+鹰武士
    NORTHAM_IMPERIAL:'MIXED',
    NORTHAM_FEUDAL:'MIXED',
    AFRICA:       'MIXED',    // 非洲步+骆驼
    AFRICA_IMPERIAL:'MIXED',
    MALAY:        'INFANTRY', // 马来近战/海军
    SEASIA_ANTIQUITY:'INFANTRY',
    SEASIA_IMPERIAL:'INFANTRY',
    ANDE:         'MIXED',    // 安第斯步+鹰武士
    SOUTHAM_IMPERIAL:'MIXED',
    PURU:         'ELEPHANT', // 南印度战象（步象）
    ORIE:         'CAVALRY',  // 阿拉伯骆驼骑（纯骑）
    ORIE_ANTIQUITY:'CAVALRY',
    EAST:         'MIXED',    // 东欧蛮族步骑（波雅尔铁骑+弓，套斯拉夫编成）
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
    IROQUOIS: 'INFANTRY',  // 城堡易洛魁[2026-09-07 新建]
    CHIMU: 'INFANTRY',  // 城堡奇穆[2026-09-07 新建]
    TARASCAN: 'INFANTRY',  // 城堡塔拉斯科[2026-09-07 新建]
    TAIRONA: 'INFANTRY',  // 城堡泰罗纳[2026-09-07 新建]
    TEHUELCHE: 'CAVALRY',  // 帝国特维尔切[2026-09-07 新建]
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
    YARLUNG: 'MIXED',
    NABATAEANS: 'CAVALRY',
    HEPHTHALITES: 'CAVALRY',
    AINU: 'INFANTRY',
    SWISS: 'INFANTRY',
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
    MING:            'MIXED',     // 帝国大明：火矛步骑与火器协同体系
    HUAXIA_IMPERIAL: 'MIXED',     // 帝国华夏：步骑协同体系
    DALI:            'ELEPHANT',  // 城堡大理：大理战象象步体系
    GUSILUO:         'CAVALRY',   // 城堡角斯罗：青唐冷锻甲铁骑纯骑体系
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
    SLAVIC:       'fish_scale',   // 斯拉夫：复合弓箭手(3) + 精锐贵族铁骑主力(4) + 精锐草原枪骑(2) [2026-08-30 主人设计]
    GERMANIC:     'crane_wing',   // 古典日耳曼：鹤翼阵 2+4+3 前锋日耳曼轻骑+中坚先锋重步主力+后排Framea高级飞矛
    LATIN:        'echelon',   // 古典罗马：鱼鳞阵 3+4+2 军团步兵抗线+百夫长精锐主力突破
    LATIN_FEUDAL: 'echelon',
    TIBET:        'crane_wing',   // 青藏：黑光铠骑兵前锋(2) + 精锐答剌罕主力(4) + 蒙古突骑后排(3)
    TIBET_CASTLE:  'crane_wing',
    TIBET_IMPERIAL:'crane_wing',

    // 鱼鳞阵 (3+4+2，2近战+1远程：前卫抗线3 + 主力近战突破4 + 远程后排支援2)
    NORTH:        'fish_scale',   // 北方：辽刀前卫(3) + 精锐黑光铠骑兵突击主力(4) + 诸葛弩后排(2)
    JAPAN:        'fish_scale',   // 日本：日本武士(3) + 精锐武士主力(4) + 藤弓兵后排(2)
    JAPAN_ANTIQUITY:'fish_scale',
    JAPAN_IMPERIAL:'fish_scale',  // 帝国日本：武士抗线+精锐武士主力+火绳足轻
    BASHU: 'echelon',   // 古典古蜀：雁行阵 4+3+2 前排先锋重步主力
    NORTHEAST:    'crescent',   // 东北：铁浮图前卫(3) + 精锐铁浮图主力(4) + 钦察后排(2)

    // 三角阵 (2+3+4，尖刀先锋2 + 冲击中坚3 + 主力底边4)
    CENTRAL:      'echelon',     // 中原：刀剑手(2) + 火焰弓箭手(3) + 精锐诸葛弩主力(4)
    STEPPE:       'triangle',     // 草原：怯薛军(2) + 草原枪骑兵(3) + 精锐蒙古突骑主力(4)
    STEPPE_IMPERIAL:'triangle',
    JIANGNAN:     'triangle',     // 江南：刀剑手(2) + 诸葛弩(3) + 精锐火焰弓箭手主力(4)
    LINGNAN: 'echelon',  // 古典百越：雁行阵 4+3+2 前排先锋重步主力
    DIANQIAN:     'triangle',     // 古典古滇：锥形阵 2+3+4 战象尖刀 + 高级标枪中坚 + 先锋重步底边主力
    CENTRAL_ASIA: 'balance_yoke', // 中亚：萨瓦尔铁骑(4) + 精锐草原枪兵(2) + 精锐钦察主力(3)
    CENTRAL_ASIA_IMPERIAL: 'balance_yoke',
    WESTERN:      'triangle',     // 西域：斯基泰斧骑(2) + 斯基泰骑射(3) + 精锐斯基泰骑射主力(4)
    WESTERN_FEUDAL:'triangle',
    WESTERN_CASTLE:'triangle',
    WESTERN_IMPERIAL:'triangle',

    // 雁行阵 (4+3+2，前排宽线主力4 + 中坚3 + 压阵2)
    HEXI:         'fish_scale',      // 河西：精锐辽刀主力(4前) + 黑光铠骑兵中坚(3中) + 诸葛弩后排(2后)
    WEST_ASIA:    'echelon',      // 西亚：东方剑士前排抗线(4) + 重装骑射手中坚(3) + 精锐复合弓后排(2)

    // 印度（鱼鳞 3+4+2：软剑士前卫 + 精锐软剑士主力 + 战象压阵）；柏柏尔（三角 2+3+4：骆驼弓骑主力）
    INDIA:        'crane_wing',   // 古典印度：鹤翼阵 2+4+3 前锋桑纳亚战象2+中坚双轮战车高级4档主力+后排镰刀战士3
    BERBER:       'triangle',
    AMERICA:      'fish_scale',  // 美洲步兵主力（阿兹特克/玛雅/印加）
    NORTHAM_IMPERIAL:'fish_scale',
    NORTHAM_FEUDAL:'fish_scale',
    AFRICA:       'fish_scale',  // 非洲步兵主力（马里/埃塞）
    AFRICA_IMPERIAL:'fish_scale',
    MALAY:        'crane_wing',  // 马来近战主力
    SEASIA_ANTIQUITY:'crane_wing',
    SEASIA_IMPERIAL:'crane_wing',
    ANDE:         'fish_scale',  // 安第斯步兵主力（印加/马普切）
    SOUTHAM_IMPERIAL:'fish_scale',
    PURU: 'crescent',  // [2026-09-06] 与该文化势力实际编制统一
    ORIE:         'triangle',    // 阿拉伯弓骑主力（骆驼弓骑）
    ORIE_ANTIQUITY:'triangle',
    EAST:         'crane_wing',  // 东欧蛮族近战骑主力（哥特重骑/条顿骑士）
    GREEK:        'fish_scale', // 古典希腊：鱼鳞阵 3+4+2 前排希腊重步3+中坚希腊贵族骑兵高级4档主力+后排希腊腹弩2
    THRACIAN: 'crescent',  // [2026-09-06] 与同名势力专属军团对齐
    PERSIAN:      'fish_scale',  // 古典波斯：鱼鳞阵 3+4+2 中坚古典重装骑射主力
    PERSIAN_CASTLE:'fish_scale',
    CUMAN:        'triangle',    // 库曼弓骑主力（钦察骑射）
    BRITONS: 'fish_scale',  // [2026-09-06] 与该文化势力实际编制统一
    GOTHS: 'fish_scale',  // 哥特[2026-09-05 主人定：雁行阵 4+3+2]
    HUNS: 'balance_yoke',  // [2026-09-06] 与该文化势力实际编制统一
    TEUTONS: 'fish_scale',  // [2026-09-06] 与同名势力专属军团对齐
    VIKINGS: 'fish_scale',  // [2026-09-06] 与同名势力专属军团对齐
    CELTS: 'crane_wing',  // 古典凯尔特：鱼鳞阵 3+4+2 中坚先锋重步主力
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
    MAYANS: 'crescent',  // 古典玛雅：偃月阵 3+2+4 前排鹰斥候+中坚高级标枪+底边先锋重步主力
    MAPUCHE: 'fish_scale',  // [2026-09-06] 与该文化势力实际编制统一
    MUISCA: 'triangle',  // [2026-09-06] 与该文化势力实际编制统一
    TUPI: 'triangle',  // [2026-09-06] 与该文化势力实际编制统一
    IROQUOIS: 'fish_scale',  // 城堡易洛魁[2026-09-07 新建]
    CHIMU: 'echelon',  // 城堡奇穆[2026-09-07 新建]
    TARASCAN: 'fish_scale',  // 城堡塔拉斯科[2026-09-07 新建]
    TAIRONA: 'triangle',  // 城堡泰罗纳[2026-09-07 新建]
    TEHUELCHE: 'crane_wing',  // 帝国特维尔切[2026-09-07 新建]
    ARMENIANS: 'crescent',  // [2026-09-06] 与该文化势力实际编制统一
    GEORGIANS: 'fish_scale',  // 格鲁吉亚[2026-08-28 暂复用父文化]
    BURMESE: 'triangle',  // [2026-09-06] 与同名势力专属军团对齐
    WALLACHIA: 'crane_wing',
    EGYPT: 'echelon',
    CARTHAGE: 'crane_wing',
    BABYLON: 'balance_yoke',
    HITTITES: 'triangle',    // 古典赫梯：锥形阵 2+3+4 底边双轮战车高级主力
    ASSYRIAN:     'fish_scale',   // 古典亚述：鱼鳞阵 3+4+2 前排持盾步兵3+中坚古典重装骑射4档主力+后排双轮战车2
    SCYTHIANS:     'triangle',    // 古典斯基泰：锥形阵 2+3+4 尖刀斯基泰斧骑2+中坚斯基泰骑射3+底边斯基泰骑射手高级4档主力
    BYZANTINE: 'fish_scale',
    FRANKS: 'triangle',
    SASANIAN: 'triangle',
    TURKS: 'triangle',
    NANZHAO: 'fish_scale',
    SRIVIJAYA: 'crane_wing',
    KUSHAN:       'crane_wing',     // 古典月氏：锥形阵 2+3+4 尖刀波鲁斯战象2+中坚粟特铁骑3+底边古典重装骑射4档主力
    KUSH: 'crane_wing',   // 古典努比亚：鹤翼阵 2+4+3 前锋麦查伊飞矛+中坚先锋重步主力+后排努比亚强弓
    KHITAN: 'triangle',
    UIGHUR: 'triangle',
    MOHE: 'fish_scale',
    ANGLO_SAXON: 'fish_scale',
    GHANA: 'echelon',
    KHAZARS: 'crane_wing',
    VANDALS: 'echelon',
    LOMBARDS: 'fish_scale',
    ROURAN: 'triangle',
    SOGDIANS: 'fish_scale',
    TANGUT: 'triangle',
    JAVANESE: 'crane_wing',
    JURCHEN: 'triangle',
    SELJUQ: 'crane_wing',
    OTTOMAN: 'crescent',
    FRENCH: 'triangle',
    MANCHU: 'triangle',
    MUGHAL: 'crane_wing',
    SAFAVID: 'triangle',
    RUSSIAN: 'fish_scale',
    SIKH: 'fish_scale',
    HEBREWS: 'fish_scale',
    WUSUN: 'triangle',
    QIANG: 'triangle',
    YARLUNG: 'triangle',
    NABATAEANS: 'crane_wing',   // 古典纳巴泰：鹤翼阵 2+4+3 前锋沙漠驼骑+中坚古典重装骑射主力+后排岩壁神射手
    HEPHTHALITES: 'triangle',
    AINU: 'fish_scale',
    SWISS: 'fish_scale',
    PASHTUN: 'crescent',
    SWEDISH: 'fish_scale',
    MACEDONIAN:   'balance_yoke',    // 古典马其顿：雁行阵 4+3+2 希腊重装步兵4档主力+马其顿方阵3+伙伴骑兵2
    HELLENIC:     'echelon',    // 古典希伦：斜行/雁行阵 4+3+2 斯巴达希皮乌斯精锐4 + 希腊底比斯圣队精锐3 + 雅典将军卫队精锐2
    IMPERIAL_ROME: 'echelon',   // 古典罗马禁卫：锥形阵 2+3+4 伴随骑兵2 + 罗马百夫长3 + 罗马百夫长重装4
    GREEK_MERCENARY: 'balance_yoke',    // 古典希腊雇佣：雁行阵 4+3+2 雇佣重步4 + 冲击重骑3 + 希腊腹弩2
    MAGNA_GRAECIA:   'echelon',    // 古典大希腊：雁行阵 4+3+2 埃克德罗摩斯4 + 希腊贵族骑3 + 塔兰丁骑2
    ACHAEMENIDS:     'fish_scale', // 古典阿契美尼德：鱼鳞阵 3+4+2 不死军矛兵3 + 古典重装骑射4 + 不死军弓手2
    AMAZONS:         'crane_wing', // 古典亚马逊：鹤翼阵 2+4+3 女弓手2 + 斯基泰骑射手高级4 + 女战士3
    SONG:            'balance_yoke', // 城堡赵宋：衡轭阵 4+2+3 持盾刀剑手4 + 攻城床弩2 + 骑士重装3
    GORYEO:          'triangle',   // 城堡高丽：鹤翼阵 2+4+3 长枪兵重装2 + 女真铁浮屠4 + 越南藤弓兵3
    JOSEON:          'crane_wing', // 帝国朝鲜：鹤翼阵 2+4+3 牌刀手2 + 高丽战车4 + 火枪兵3
    GOJOSEON:        'square',     // 古典朝鲜：方阵 3+3+3 古典长矛兵3 + 古典掷矛手3 + 古典骑射手3
    MING:            'fish_scale', // 帝国大明：鱼鳞阵 3+4+2 牌刀手3 + 黑光铠骑兵4 + 神机箭火箭车2
    HUAXIA_IMPERIAL: 'fish_scale', // 帝国华夏：鱼鳞阵 3+4+2
    DALI:            'crane_wing',   // 城堡大理：鱼鳞阵 3+4+2 战斗象3 + 越南藤弓兵精锐4 + 持盾刀剑手2
    GUSILUO:         'triangle',     // 城堡角斯罗：锥形阵 2+3+4 贵族铁骑精锐2 + 具装铁骑3 + 骑射手4
    MAMLUKS:         'crane_wing',   // 城堡马穆鲁克：鹤翼阵 2+4+3 骆驼弓骑精锐2 + 骑士重装4 + 骆驼骑兵3
    CRUSADERS:       'fish_scale',   // 城堡十字军：鱼鳞阵 3+4+2 十字军骑士高级3 + 圣殿楷模武士4 + 十字军弩手2
    RUS:             'fish_scale',   // 城堡罗斯：鱼鳞阵 3+4+2 贵族铁骑精锐3 + 双手大剑士4 + 骑射手2
    KARA_KHITAN:     'triangle',     // 城堡西辽：锥形阵 2+3+4 草原枪骑兵高级2 + 骑射手3 + 重装骑兵4
    TIMURID:         'triangle',     // 城堡帖木儿：锥形阵 2+3+4 波斯具装铁骑重装2 + 察合台骑射3 + 骑士重装4
    DELHI:           'triangle',     // 城堡德里：锥形阵 2+3+4 装甲攻城战象2 + 古拉姆精锐3 + 古拉姆4
                                     // [2026-09-07 订正] 原标 fish_scale 且注释还停在旧编成（战斗象3+复合弓手2），
                                     // 与实际三格及其逐格注释「尖刀2/中坚3/侧翼4」不符 —— 格位自洽，是标签过期
    CASTILE:         'echelon',      // 城堡卡斯蒂利亚：雁行阵 4+3+2 骑士重装4 + 欧洲双手剑士3 + 标枪骑兵高级2
    SCOTLAND:        'balance_yoke', // 城堡苏格兰：衡轭阵 4+2+3 长枪兵重装4 + 双手大剑士3 + 轻型骑兵2
    HRE:             'echelon',      // 城堡神圣罗马：雁行阵 4+3+2 骑士重装4 + 双手大剑士3 + 弩兵2
    ALMOHAD:         'crane_wing',   // 城堡摩洛哥：鹤翼阵 2+4+3 骆驼弓骑精锐2 + 骑士重装4 + 标枪骑兵高级3
    SERBIA:          'fish_scale',   // 城堡塞尔维亚：鱼鳞阵 3+4+2 长枪兵重装3 + 骑士重装4 + 骑射手2
    ILKHANATE:       'triangle',     // 城堡伊利汗：锥形阵 2+3+4 波斯具装铁骑重装2 + 骑射手3 + 重装骑兵4
    ARAGON:          'fish_scale',   // 城堡阿拉贡：鱼鳞阵 3+4+2 骑士重装3 + 欧洲双手剑士4 + 标枪骑兵高级2
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

/** 1. 中原 刀剑手+火焰弓箭手+精锐诸葛弩（三角阵 2+3+4：刀剑手尖刀 + 火焰弓箭手中坚 + 精锐诸葛弩主力底边） */
export const CENTRAL_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_white_feather_guard', count: 4 }, // 前排主力【精锐】 = 蜀白毦兵精锐
            { type: 'fire_archer', count: 3 }, // 中坚 = 吴火焰弓箭手
            { type: 'war_chariot_ranged', count: 2, scale: 0.57 } // 后排 = 先秦远程战车
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
            { type: 'tiger_rider', count: 3 }, // 前排 = 魏虎骑兵
            { type: 'xianbei_raider', count: 2 }, // 中排 = 鲜卑掠骑兵
            { type: 'antiquity_heavy_cavalry_archer', count: 4 } // 后排主力【重装】 = 古典骑射手重装（南北朝黑光铠是 420-589 年，过了古典的线，不能用）
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
            { type: 'swordsman', count: 2 },   // 两翼 = 剑士
            { type: 'hei_kuang_heavy', count: 4 },   // 中坚主力 = 南北朝黑光铠骑兵重装
            { type: 'bowman', count: 3 }   // 后排齐射 = 弓兵（高句丽以善射得名）
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
            { type: 'samurai', count: 3 },                // 尖刀斩阵 = 日本武士（野太刀破阵突击）
            { type: 'samurai_elite', count: 4 },          // 中军主力【精锐】 = 日本武士精锐（镰仓武士名誉斩阵）
            { type: 'ninja', count: 2 }                   // 后卫奇袭 = 日本忍者（伊贺甲贺隐密暗杀飞镖奇袭）
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
            { type: 'elite_keshik', count: 2 },   // 尖刀 = 鞑靼怯薛军精锐（精锐留蒙古本文化）
            { type: 'mangudai', count: 3 },   // 中坚 = 蒙古突骑
            { type: 'mangudai_elite', count: 4 }   // 底边主力 = 蒙古突骑精锐
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
            { type: 'magyar_huszar', count: 3 },   // 前排 = 马扎尔骠骑兵
            { type: 'genitour', count: 2 },   // 中坚 = 标枪骑兵
            { type: 'elite_magyar_huszar', count: 4 }   // 底边主力 = 马扎尔骠骑兵精锐
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
            { type: 'elite_tarkan', count: 4 }, // 宽线主力【精锐】 = 匈奴答剌罕骑兵精锐 4骑（阿提拉王帐铁骑）
            { type: 'steppe_lancer', count: 2 }, // 中排接应 = 草原枪骑兵 2骑
            { type: 'cav_archer', count: 3 }     // 后排齐射 = 封建骑射手 3骑（剔除古典骑射手残留）
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
            { type: 'white_feather_guard', count: 3 },   // 前排 = 蜀白毦兵
            { type: 'elite_chukonu', count: 4 },   // 中坚主力 = 中国诸葛弩精锐
            { type: 'elite_tiger_cavalry', count: 2 }   // 后排突击 = 魏虎骑兵精锐（曹魏虎豹骑，中原本区）
        ]
    }
];
/** 古典古蜀军团（雁行 4+3+2，主力在前排）。
 *  严格遵守军团 4 档铁律：军团中必须有一个重装/精锐/高级，并安排到 4 档。
 *  史实依据（三星堆金沙古蜀王国）：
 *   · 前排主力 先锋重装步兵（4档【重装】） —— 三星堆青铜黄金面具、青铜大立人、彩绘皮甲重铠与重盾，正面推进肉搏抗线，占 4 档重装主力。
 *   · 中坚 蜀白毦兵（3档） —— 古蜀特有的插白鸟之羽（白毦）近战精锐，双手持无格柳叶形青铜剑轻捷穿插突击，悍勇不畏死，占 3 档中坚。
 *   · 后排 古典掷矛手高级（2档【高级】） —— 巴蜀崇山密林毒箭短矛飞投死士，在矛盾掩护下侧后穿透狙杀，占 2 档支援。 */
export const BASHU_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'vanguard', count: 4 },
            { type: 'white_feather_guard', count: 3 },
            // 🔴 [2026-09-07] 原为「古典掷矛手高级」。巴蜀山民短矛飞投属散兵，史无常备精锐建制，降回基础档。
            { type: 'antiquity_skirmisher', count: 2 }
        ]
    }
];

/** 9. 封建华夏军团 华夏双手剑士高级+诸葛弩+南北朝黑光铠骑兵重装（锥形阵 2+3+4：双手剑先锋 + 诸葛弩中坚 + 黑光重装底边主力，战力72） */
export const JIANGNAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'jian_swordman_unshielded', count: 2 }, // Row 0 尖刀先锋【高级】 = 华夏双手剑士高级 2人
            { type: 'chukonu', count: 3 },                  // Row 1 齐射中坚 = 诸葛弩 3人
            { type: 'hei_kuang_heavy', count: 4 }           // Row 2 底边主力【重装】 = 南北朝黑光铠骑兵重装 4骑
        ]
    }
];

/** 古典百越军团（雁行 4+3+2，主力在前排）。
 *  严格遵守军团 4 档铁律：军团中必须有一个重装/精锐/高级，并安排到 4 档。
 *  史实依据（古典越国—南越/骆越/西瓯）：
 *   · 前排主力 先锋重装步兵（4档【重装】） —— 句吴、于越青铜冶炼巅峰，欧冶子、干将莫邪菱纹宝剑，精选重铠决死死士，大盾短矛正面推进肉搏。
 *   · 中坚 吴火焰弓箭手（3档） —— 句吴与百越江东舟师火箭手，水网沼泽密集火矢抛射压制。
 *   · 后排 古典掷矛手高级（2档【高级】） —— 西瓯、骆越岭南丛林标枪伏击死士，秦瓯骆之战杀尉屠睢之利器，侧后穿透狙杀。 */
export const LINGNAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'vanguard', count: 4 },   // 前排主力 = 先锋重装步兵
            { type: 'elite_fire_archer', count: 3 },   // 中坚 = 吴火焰弓箭手精锐（吴地即江南，本文化最近）
            { type: 'elite_antiquity_skirmisher', count: 2 }   // 后排 = 古典掷矛手高级
        ]
    }
];
/** 古典古滇军团（锥形阵 2+3+4，战象尖刀+底边重步主力）。
 *  严格遵守军团 4 档铁律：军团中必须有一个重装/精锐/高级，并安排到 4 档。大象只占 2 档。
 *  史实依据（战国西汉滇池古滇王国）：
 *   · 前排尖刀 战象（2档【大象降2档】） —— 《华阳国志》记载南中夷人「乘象入阵」，晋宁石寨山贮贝器青铜雕塑生动展现乘象作战，用古典桑纳亚战象代西南雨林战象，占 2 档尖刀开道。
 *   · 中坚掩护 古典掷矛手高级（3档【高级】） —— 西南密林善用剧毒药矢与短矛标枪，穿透抛射压制敌方阵线，占 3 档中坚。
 *   · 后排主力 先锋重装步兵（4档【重装】） —— 石寨山与李家山出土的孔雀羽战盔、镂空剑鞘青铜短剑与重铠武士，底边主力结阵冲锋决胜，占 4 档重装主力。 */
export const DIANQIAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'sannahya', count: 2 },
            { type: 'elite_antiquity_skirmisher', count: 3 },
            { type: 'vanguard', count: 4 }
        ]
    }
];

/** 12. 青藏 黑光铠骑兵+黑光铠重装+骑射手（鹤翼阵 2+4+3：黑光铠骑兵前锋 2 + 黑光铠骑兵重装中军主力 4 + 骑射手后排支援 3）
 *  史实依据：《新唐书·吐蕃传》「其兵刃弓矢俱美，人马皆被重铠，带其面目，独开双眸，虽劲弩利刃不能破也」。
 *  中坚主力以冷锻铁甲重铠武装，彻底剔除匈奴答剌罕与蒙古突骑之跨时空错配。 */
export const TIBET_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'hei_kuang', count: 2 },            // Row 0 前锋接应 = 南北朝黑光铠骑兵 2骑
            { type: 'hei_kuang_heavy', count: 4 },      // Row 1 中军突击主力【重装】 = 南北朝黑光铠骑兵重装 4骑（青藏高原冷锻具装甲骑）
            { type: 'cav_archer', count: 3 }            // Row 2 尾收支援 = 封建骑射手 3骑（青藏角弓善射手）
        ]
    }
];

/** 13. 中亚 萨瓦尔+草原枪兵+精锐钦察（衡轭阵 4+2+3：萨瓦尔铁骑宽线主力 + 草原枪兵中排接应 + 精锐钦察后排齐射）
 *  史实依据：河中绿洲城邦（布哈拉/撒马尔罕）与萨曼王朝、花剌子模古拉姆近卫萨瓦尔重骑兵为中枢主力，
 *  辅助以中亚突厥游牧轻枪骑与库曼钦察复合弓骑，战力平抑至带内 111 黄金区间。 */
export const CENTRAL_ASIA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'savar', count: 4 },
            { type: 'steppe_lancer', count: 2 },
            { type: 'elite_kipchak', count: 3 }
        ]
    }
];

/** 14. 古典塞种军团（锋矢 2+3+4，主力在后排压阵）
 *  史料：塞种 = 波斯语 Saka，指葱岭以东至伊犁的东伊朗游牧，《汉书》「塞王南君罽宾」。
 *        波斯贝希斯敦铭文分其为尖帽塞人（Sakā tigraxaudā）与饮豪麻塞人（Sakā haumavargā）。
 *        与黑海的斯基泰同源异地：塞种紧邻大夏绿洲，故弓手取巴克特里亚系而非黑海系。
 *  ⚠️ 与 [SCYTHIANS 古典斯基泰] 必须编制不同（曾经完全一样，2026-09-07 分开）：
 *     塞种＝萨迦斧兵开路 + 大夏弓手 + 精锐骑射主力；斯基泰＝斧骑兵开路 + 本族骑射两档。
 *    前 2 萨迦斧兵      —— 尖帽塞人的徒步斧战部众
 *    中 3 巴克特里亚弓手 —— 塞种南下罽宾/大夏后吸收的绿洲步射
 *    后 4 精锐骑射手    —— 主力齐射
 */
export const WESTERN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'sakan_axeman', count: 2 },
            { type: 'bactrian_archer', count: 3 },
            { type: 'elite_scythian_horse_archer', count: 4 }
        ]
    }
];

/** 15. 西亚 亚美尼亚修士战士高级+东方剑士+精锐复合弓箭手（雁行阵 4+3+2：修士战士高级主力4 + 东方剑士中坚3 + 精锐复合弓压阵2）
 *  史实依据：小亚细亚安纳托利亚高地、本都与奇里乞亚亚美尼亚王国，
 *  以身披重锁子甲手持破甲利刃的亚美尼亚修士重装战士为精锐主力，东方剑士抗线，复合弓精锐压阵，
 *  彻底剔除战力仅36的中东白板民兵，战力由52偏低提升至72黄金健康带。 */
export const WEST_ASIA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'warrior_priest', count: 4 },         // Row 0 宽线主力【高级】 = 亚美尼亚修士战士高级 4人
            { type: 'eastern_swordsman', count: 3 },      // Row 1 中军接应 = 东方剑士 3人
            { type: 'elite_composite_bowman', count: 2 }  // Row 2 后排压阵【精锐】 = 亚美尼亚复合弓手精锐 2人
        ]
    }
];

/** 16. 斯拉夫 贵族铁骑+精锐贵族铁骑+复合弓箭手（鹤翼阵 2+4+3：贵族铁骑前锋 + 精锐波雅尔重骑主力 + 复合弓后排） */
/** 封建罗斯军团（鹤翼 2+4+3，主力在两翼展开那一档）。
 *  2026-09-07 重配。原编制把「亚美尼亚复合弓手」放在 4 档主力 —— 那是亚美尼亚的兵、
 *  而且是城堡档；真正的罗斯主力贵族铁骑反被压在后排 3 档，主次颠倒。
 *
 *  史实依据（基辅罗斯，9–11 世纪）：
 *   · 主力 4 档 斯拉夫贵族铁骑精锐 —— 大公的「德鲁日纳」(дружина) 亲卫队，
 *     罗斯军队的核心与决战力量，符合「主力须为重装/高级/精锐」。
 *   · 前排 2 档 诺斯狂暴战士 —— 罗斯本由瓦良格（北欧）人建国，留里克一系的斧兵
 *     是早期罗斯军的锋刃，与拜占庭的瓦兰吉卫队同源。
 *   · 后排 3 档 层压复合弓手 —— 罗斯与草原诸部长期交手，习得筋角层压复合弓，
 *     取代原来那个亚美尼亚兵。 */
export const SLAVIC_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'boyar', count: 3 },   // 前排 = 斯拉夫贵族铁骑
            { type: 'elite_berserk', count: 4 },   // 中坚主力 = 维京狂战士精锐
            { type: 'berserk', count: 2 }   // 后排 = 维京狂战士（罗斯瓦兰吉卫队）
        ]
    }
];
/** 古典日耳曼军团（鹤翼阵 2+4+3，主力在中坚）。
 *  严格遵守军团 4 档铁律：军团中必须有一个重装/精锐/高级，并安排到 4 档。
 *  史实依据（条顿堡森林大捷·日耳曼尼亚步骑协同战法）：
 *   · 前锋两翼 古典轻骑兵（2档） —— 凯撒《高卢战记》所载日耳曼轻捷突骑，与飞跑步兵混编协同，两翼破风包抄，占 2 档前锋。
 *   · 中坚主力 先锋重装步兵（4档【重装】） —— 阿米尼乌斯条顿堡伏击战精锐重铠长剑卫队，正面死磕重拳突破，占 4 档重装主力。
 *   · 后排支援 古典掷矛手高级（3档【高级】） —— 塔西佗《日耳曼尼亚志》所载 Framea 飞矛死士，远掷近刺破盾穿透掩护，占 3 档支援。 */
export const GERMANIC_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'antiquity_light_cavalry', count: 2 },
            { type: 'vanguard', count: 4 },
            { type: 'elite_antiquity_skirmisher', count: 3 }
        ]
    }
];

/** 古典罗马军团（鱼鳞阵 3+4+2，主力在中坚）。
 *  严格遵守军团 4 档铁律：军团中必须有一个重装/精锐/高级，并安排到 4 档。
 *  史实依据（罗马共和国与帝国古典大军团·三线阵 Triplex Acies 经典战法）：
 *   · 前排前卫 军团步兵（3档） —— 罗马方盾短剑正规军团步兵（Legionary），结成坚密大盾墙抗线推进，占 3 档前锋。
 *   · 中坚主力 罗马百夫长精锐（4档【精锐】） —— 罗马军团灵魂骨干百夫长，率鹰旗重甲突击中军，厚实重拳突破，战力 172 冠绝地中海，占 4 档精锐主力。
 *   · 后排支援 古典掷矛手高级（2档【高级】） —— 罗马重投枪（Pilum）飞掷死士，在阵后提供破甲毁盾穿透掩护，占 2 档支援。 */
export const LATIN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'legionary', count: 4 },
            { type: 'elite_centurion', count: 3 },
            { type: 'elite_antiquity_skirmisher', count: 2 }
        ]
    }
];
/** 古典印度军团（鹤翼 2+4+3，主力在中排）
 *  严格遵守军团 4 档铁律：军团中必须有一个重装/精锐/高级，并安排到 4 档；大象只许占 2 档；三兵全部为古典档位。
 *  史料：孔雀王朝（前 322—前 185）。印度兵制的本名就是「四支军」caturaṅga——
 *        象、车、马、步四兵种并列，《政事论》与麦加斯梯尼《印度志》皆载。
 *        普林尼与普鲁塔克记旃陀罗笈多有战象九千、战车八千、步兵六十万；
 *        战车自《摩诃婆罗多》起就是刹帝利贵族的传统主战兵种。
 *    前 2 孔雀桑纳亚战象 —— 四支军之「象」，象类只占 2 档
 *    中 4 双轮战车高级（主力【高级】）—— 四支军之「车」，刹帝利贵族战车主力
 *    后 3 达罗毗荼镰刀战士 —— 四支军之「步」，持盾弯刃长刀传统近卫步兵
 */
export const INDIA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'ratha_ranged', count: 2 },   // 两翼 = 孟加拉拉塔弓战车（拉塔战车＝吠陀至笈多的古典印度战车，基础档归古典印度）
            { type: 'ratha_melee', count: 4 },   // 中坚主力 = 孟加拉拉塔战车
            { type: 'sickle_warrior', count: 3 }   // 后排 = 达罗毗荼镰刀战士
        ]
    }
];

/** 20. 封建柏柏尔军团 沙漠骆驼突袭者高级+柏柏尔骆驼弓骑+骆驼弓骑精锐（锥形阵 2+3+4：骆驼突袭尖刀 + 骆驼弓骑中坚 + 骆驼弓骑精锐底边主力，战力57） */
export const BERBER_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'camel_raider', count: 2 },        // Row 0 尖刀先锋【高级】 = 沙漠骆驼突袭者高级 2骑
            { type: 'camel_archer', count: 3 },        // Row 1 机动中坚 = 柏柏尔骆驼弓骑 3骑
            { type: 'elite_camel_archer', count: 4 }   // Row 2 底边主力【精锐】 = 柏柏尔骆驼弓骑精锐 4骑
        ]
    }
];

/** 19. 古典希腊军团（鱼鳞阵 3+4+2，中坚希腊贵族骑兵高级为主力）
 *  前排 3 希腊重装步兵 —— 经典方阵大圆盾墙扛线（hoplite）
 *  中坚 4 希腊贵族骑兵高级 —— 【高级】主力铁骑重拳破阵（elite_greek_cavalry）
 *  后排 2 希腊腹弩手 —— 机械腹弩（gastraphetes）抛射火力掩护
 */
export const GREEK_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'hoplite', count: 3 },   // 前排 = 希腊重装步兵
            { type: 'elite_greek_cavalry', count: 4 },   // 中坚主力 = 希腊贵族骑兵高级
            { type: 'thracian_peltast', count: 2 }   // 后排轻装标枪 = 色雷斯标枪手（伊菲克拉特斯改革即以色雷斯佩尔塔为轻兵，色雷斯紧邻希腊）
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
/** 古典波斯军团（鱼鳞阵 3+4+2，中坚重装突破）。
 *  严格遵守军团 4 档铁律：军团中必须有一个重装/精锐/高级，并安排到 4 档。
 *  史实依据（阿契美尼德帝国—安息帝国）：
 *   · 前排 波斯持盾步兵（3档） —— 编柳皮盾（Spara）巨盾矛兵，排成长达数十米的盾墙，吸收箭雨、阻遏敌骑冲击，稳固前线。
 *   · 中坚主力 古典骑射手重装（4档【重装】） —— 阿契美尼德与安息著名的重装骑射手与甲骑，身披鱼鳞铁甲、持强劲角弓，中军厚实部位游弋机动，重装冲锋与暴风箭雨突破。
 *   · 后排禁卫 波斯长生军（2档） —— 希罗多德记载的阿契美尼德万人不死军禁卫，铁叶鳞甲、短矛与利刃，坐镇后军督战与决死肉搏。 */
export const PERSIAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'sparabara', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
            { type: 'immortal', count: 2 }
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
            { type: 'heavy_pikeman', count: 3 },   // 前排 = 长枪兵重装
            { type: 'elite_conquistador', count: 4 },   // 中坚主力 = 西班牙征服者精锐
            { type: 'conquistador', count: 2 }   // 后排 = 西班牙征服者
        ]
    }
];
/** 封建保加利亚军团（鱼鳞阵 3+4+2：保加利亚骑兵3 + 骑兵精锐中坚4 + 保加利亚锤炼兵精锐2，战力93） */
export const BULGARIANS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'konnik', count: 3 },   // 前排 = 保加利亚骑兵
            { type: 'konnik_foot', count: 4 },   // 中坚主力 = 锤炼兵
            { type: 'elite_konnik_foot', count: 2 }   // 后排 = 锤炼兵精锐
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
            { type: 'heavy_pikeman', count: 4 }, // 前排主力【重装】 = 长枪兵重装
            { type: 'elite_organ_gun', count: 2 }, // 中排 = 葡萄牙风琴炮精锐
            { type: 'arbalest', count: 3 } // 后排 = 劲弩手
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
            { type: 'kipchak', count: 2 },   // 尖刀 = 库曼钦察弓骑
            { type: 'elite_steppe_lancer', count: 3 },   // 中坚 = 草原枪骑兵高级
            { type: 'elite_kipchak', count: 4 }   // 底边主力 = 库曼钦察弓骑精锐（本族两档同堂）
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
            { type: 'elite_obuch', count: 4 },   // 前排主力 = 波兰奥布奇战锤兵精锐
            { type: 'winged_hussar', count: 3 },   // 中坚 = 波兰翼骑兵高级
            { type: 'obuch', count: 2 }   // 后排 = 波兰奥布奇战锤兵
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

/** 封建孟加拉军团（雁行阵 4+3+2：拉塔战车近战精锐前锋4 + 拉塔弓战车精锐中坚3 + 步弓手后卫2，战力77） */
export const BENGALIS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_ratha_melee', count: 4 },      // 前排突击【精锐】 = 孟加拉拉塔战车精锐（冲锋突击双姿态战车）
            { type: 'elite_ratha_ranged', count: 3 },     // 中军飞箭【精锐】 = 孟加拉拉塔弓战车精锐（移动远程倾泻火力）
            { type: 'pattiyoda_longbowman', count: 2 }    // 后排重箭 = 僧伽罗帕提尤达长弓手（南亚大竹弓贯穿抛射）
        ]
    }
];

/** 城堡玛雅军团（偃月阵 3+2+4，主力在底边）。
 *  严格遵守军团 4 档铁律：军团中必须有一个重装/精锐/高级，并安排到 4 档。
 *  史实依据（古典期玛雅城邦·蒂卡尔与卡拉克穆尔雨林战法）：
 *   · 前排前卫 美洲鹰斥候（3档） —— 佩滕热带雨林飞跃穿插的轻装侦察与突袭战士，身着轻棉甲与翎羽头饰，占 3 档前锋。
 *   · 中腰掩护 古典掷矛手高级（2档【高级】） —— 中美洲最致命的投矛器（Atlatl）黑曜石飞矛死士，在阵中提供高初速穿甲火力，占 2 档支援。
 *   · 底边决战 先锋重装步兵（4档【重装】） —— 玛雅贵族王家近卫，身披浸渍盐水多层坚韧厚棉甲（Ichcahuipilli）与大木盾，手持黑曜石重武器正面碾碎敌军，占 4 档重装主力。 */
export const MAYANS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'eagle_warrior', count: 3 },          // 尖刀疾行 = 鹰勇士（美洲轻装高机动鹰图腾先锋）
            { type: 'slinger', count: 2 },                // 中坚飞石 = 投石兵（安第斯-中美洲破甲投石）
            { type: 'plumed_archer', count: 4 }           // 底边密箭 = 玛雅羽箭手（尤卡坦半岛王牌羽冠轻装速射弓手）
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
            { type: 'elite_shotel_warrior', count: 4 },   // 前排主力 = 埃塞俄比亚弯刀勇士精锐
            { type: 'camel_heavy', count: 3 },   // 中坚 = 骆驼兵重装
            { type: 'shotel_warrior', count: 2 }   // 后排 = 埃塞俄比亚弯刀勇士
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

/** PURU 文化军团（crescent 3+2+4，印度部落民拒马+象弓掩护+乌鲁米软剑决胜） */
export const PURU_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'indian_tribesman', count: 3 },      // 前排拒马 = 印度部落民（次大陆本土长矛勇士）
            { type: 'elephant_archer', count: 2 },       // 中军枢纽 = 战象弓手（孔雀与朱罗王家射手）
            { type: 'elite_urumi_swordsman', count: 4 }  // 后排决胜【精锐】 = 乌鲁米软剑士精锐（达罗毗荼狂战剑阵）
        ]
    }
];

/** 城堡墨西加军团（鱼鳞阵 3+4+2，阿兹特克豹勇士前突+精锐主战+玛雅羽箭手精锐掩护） */
export const AMERICA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'jaguar_warrior', count: 3 },         // 尖刀獠牙 = 阿兹特克豹勇士（黑曜石大棒嗜血破阵）
            { type: 'elite_eagle_warrior', count: 4 },    // 中坚神鹰【高级】 = 鹰勇士高级（阿兹特克太阳神鹰精锐重装战士）
            { type: 'xolotl_warrior', count: 2 }          // 侧翼铁蹄【高级】 = 阿兹特克索洛特尔骑兵高级（美洲特种近战反抗骑兵）
        ]
    }
];

/** 城堡克丘亚军团（鱼鳞阵 3+4+2，印加尚皮斧战锤抗线+皇家枪兵长中坚+尚皮斥候机动） */
export const ANDE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'champi_warrior', count: 3 },        // 前排抗线 = 印加尚皮勇士（青铜战星锤破阵死士）
            { type: 'elite_kamayuk', count: 4 },         // 中坚主力【精锐】 = 枪兵长精锐（太阳王皇家精锐长矛步兵方阵）
            { type: 'champi_scout', count: 2 }           // 后排轻装 = 印加尚皮斥候（安第斯山地战斧轻装斥候）
        ]
    }
];

/** 哥特 封建弩兵+哥特近卫军精锐+封建重骑士（鱼鳞阵 3+4+2：弩手前锋3 + 哥特近卫精锐中坚4 + 封建骑士突击2）
 *  史实依据：西罗马崩溃后东哥特狄奥多里克大帝定都拉文纳，
 *  以持盾重铠哥特近卫军为绝对核心盾墙主力，配以封建冲击重骑与破甲弩兵，彻底消除古典希腊化与色雷斯兵种穿越。 */
export const GOTHS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'crossbowman', count: 3 },   // 前排 = 弩兵
            { type: 'huskarl', count: 4 },   // 中坚主力 = 哥特近卫军
            { type: 'elite_huskarl', count: 2 }   // 后排 = 哥特近卫军精锐
        ]
    }
];
/** 古典凯尔特军团（鱼鳞阵 3+4+2，主力在中坚）。
 *  严格遵守军团铁律：三排中必有一排精锐/高级/重装，符合古典时代，不安排攻城武器。
 *  史实依据（拉坦诺文化·高卢与不列颠凯尔特蛮族强权）：
 *   · 前排前卫 战犬高级（3档【高级】） —— 古典时代不列颠凯尔特英国猛犬（Mastiff），身披硬皮胸铠成群咆哮撕咬，打乱敌军阵脚。
 *   · 中坚主力 先锋重装步兵（4档【重装】） —— 高卢凯尔特锁子甲长剑重步兵，手持大椭圆盾与拉坦诺重铁剑，中腰厚实重拳突破，占 4 档重装主力。
 *   · 后排支援 古典掷矛手高级（2档【高级】） —— 凯尔特崇山密林重标枪与飞矛投掷死士，在阵后提供强力穿刺掩护，占 2 档支援。 */
export const CELTS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_war_dog', count: 2, scale: 1 },
            { type: 'elite_woad_raider', count: 4, scale: 1 },
            { type: 'woad_raider', count: 3, scale: 1 }
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
            { type: 'winged_hussar', count: 3 },   // 前排 = 波兰翼骑兵高级
            { type: 'elite_leitis', count: 4 },   // 中坚主力 = 立陶宛列提斯精锐
            { type: 'leitis', count: 2 }   // 后排 = 立陶宛列提斯
        ]
    }
];

/** 第一层 18 文化军团名（文化+军团，主人 2026-08-20 定）。
 *  以文化正式名 CULTURE_NAMES 为底；特例 STEPPE 用「草原」（REGION_LABELS）而非「蒙古」，
 *  因「蒙古」留给第二层蒙古系支军团，避免重名。 */
export const CULTURE_LEGION_NAMES: Record<RegionType, string> = {
    CENTRAL: '古典华夏军团',
    NORTH: '古典秦汉军团',
    NORTHEAST: '古典鲜卑军团',
    KOREA: '封建高句丽军团',
    JAPAN: '城堡镰仓军团',
    JAPAN_ANTIQUITY: '古典日本军团',
    JAPAN_IMPERIAL: '帝国日本军团',
    STEPPE: '城堡蒙古军团',
    STEPPE_IMPERIAL: '帝国草原军团',
    HEXI: '古典秦汉军团',
    BASHU: '古典古蜀军团',
    JIANGNAN: '封建隋唐军团',
    LINGNAN: '古典百越军团',
    DIANQIAN: '古典古滇军团',
    TIBET: '封建吐蕃军团',
    TIBET_CASTLE: '城堡吐蕃军团',
    TIBET_IMPERIAL: '帝国青藏军团',
    CENTRAL_ASIA: '封建河中军团',
    CENTRAL_ASIA_IMPERIAL: '帝国中亚军团',
    WEST_ASIA: '封建西亚军团',
    WESTERN: '古典塞种军团',
    WESTERN_FEUDAL: '封建西域军团',
    WESTERN_CASTLE: '城堡西域军团',
    WESTERN_IMPERIAL: '帝国西域军团',
    SLAVIC: '封建罗斯军团',
    GERMANIC: '古典日耳曼军团',
    LATIN: '古典罗马军团',
    LATIN_FEUDAL: '封建拉丁军团',
    IMPERIAL_ROME: '古典罗马禁卫军团',
    GREEK_MERCENARY: '古典希腊雇佣军团',
    MAGNA_GRAECIA: '古典大希腊军团',
    ACHAEMENIDS: '古典阿契美尼德军团',
    AMAZONS: '古典亚马逊军团',
    INDIA: '古典印度军团',
    BERBER: '封建柏柏尔军团',
    AMERICA: '城堡墨西加军团',
    NORTHAM_IMPERIAL: '帝国北美军团',
    NORTHAM_FEUDAL: '封建北美军团',
    AFRICA: '城堡曼丁哥军团',
    AFRICA_IMPERIAL: '帝国非洲军团',
    MALAY: '封建马来军团',
    SEASIA_ANTIQUITY: '古典东南亚军团',
    SEASIA_IMPERIAL: '帝国东南亚军团',
    ANDE: '城堡克丘亚军团',
    SOUTHAM_IMPERIAL: '帝国南美军团',
    PURU: '封建达罗毗荼军团',
    ORIE: '封建阿拉伯军团',
    ORIE_ANTIQUITY: '古典阿拉伯军团',
    EAST: '封建罗斯军团',
    GREEK: '古典希腊军团',
    THRACIAN: '古典色雷斯军团',
    PERSIAN: '古典波斯军团',
    PERSIAN_CASTLE: '城堡波斯军团',
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
    SPANISH: '帝国西班牙军团',
    PORTUGUESE: '帝国葡萄牙军团',
    ETHIOPIANS: '封建埃塞俄比亚军团',
    BENGALIS: '封建孟加拉军团',
    GURJARAS: '封建瞿折罗军团',
    VIETNAMESE: '城堡京族军团',
    KHMER: '城堡高棉军团',
    MAYANS: '城堡玛雅军团',
    MAPUCHE: '帝国马普切军团',
    MUISCA: '城堡穆伊斯卡军团',
    TUPI: '城堡图皮军团',
    IROQUOIS: '城堡易洛魁军团',
    CHIMU: '城堡奇穆军团',
    TARASCAN: '城堡塔拉斯科军团',
    TAIRONA: '城堡泰罗纳军团',
    TEHUELCHE: '帝国特维尔切军团',
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
    BYZANTINE: '封建拜占庭军团',
    FRANKS: '封建法兰克军团',
    SASANIAN: '封建波斯军团',
    TURKS: '封建突厥军团',
    NANZHAO: '封建白蛮军团',
    SRIVIJAYA: '封建三佛齐军团',
    KUSHAN: '古典月氏军团',
    KUSH: '古典努比亚军团',
    KHITAN: '封建契丹军团',
    UIGHUR: '封建回鹘军团',
    MOHE: '封建靺鞨军团',
    ANGLO_SAXON: '封建盎格鲁-撒克逊军团',
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
    MANCHU: '帝国满洲军团',
    MUGHAL: '帝国莫卧儿军团',
    SAFAVID: '帝国波斯军团',
    RUSSIAN: '帝国俄罗斯军团',
    SIKH: '帝国锡克军团',
    HEBREWS: '古典希伯来军团',
    WUSUN: '古典乌孙军团',
    QIANG: '古典羌族军团',
    YARLUNG: '古典雅隆军团',
    NABATAEANS: '古典纳巴泰军团',
    HEPHTHALITES: '封建嚈哒军团',
    AINU: '城堡阿伊努军团',
    SWISS: '城堡瑞士军团',
    PASHTUN: '帝国普什图军团',
    SWEDISH: '帝国瑞典军团',
    MACEDONIAN: '古典马其顿军团',
    HELLENIC: '古典希伦军团',
    SONG: '城堡两宋军团',
    GORYEO: '城堡高丽军团',
    JOSEON: '帝国朝鲜军团',
    GOJOSEON: '古典朝鲜军团',
    MING: '帝国大明军团',
    HUAXIA_IMPERIAL: '帝国华夏军团',
    DALI: '城堡大理军团',
    GUSILUO: '城堡角斯罗军团',
    MAMLUKS: '城堡马穆鲁克军团',
    CRUSADERS: '城堡十字军军团',
    RUS: '城堡罗斯军团',
    KARA_KHITAN: '城堡西辽军团',
    TIMURID: '城堡帖木儿军团',
    DELHI: '城堡德里军团',
    CASTILE: '城堡卡斯蒂利亚军团',
    SCOTLAND: '城堡苏格兰军团',
    HRE: '城堡神圣罗马军团',
    ALMOHAD: '城堡摩洛哥军团',
    SERBIA: '城堡塞尔维亚军团',
    ILKHANATE: '城堡伊利汗军团',
    ARAGON: '城堡阿拉贡军团',
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
            { type: 'mameluke', count: 2 },   // 尖刀 = 萨拉森马穆鲁克
            { type: 'elite_mameluke', count: 3 },   // 中坚 = 萨拉森马穆鲁克精锐
            { type: 'elite_camel_archer', count: 4 }   // 底边主力 = 柏柏尔骆驼弓骑精锐
        ]
    }
];

/** 色雷斯 罗姆菲亚长刃斩手+萨尔马提亚重装铁骑+精锐轻盾标枪手（衡轭阵 3+2+4 / 4+2+3）
 *  史实依据（奥德里西亚王国与巴尔干-多瑙河战役同盟）：
 *   · 前排 = 色雷斯长刃斩手（3档） —— 双手挥舞破甲大长刃，凶残撕裂罗马与马其顿步兵盾阵。
 *   · 中排 = 萨尔马提亚重装铁骑（2档【重装】） —— 多瑙河与巴尔干北岸著名的全具装重骑兵，以铁矛与重铠撕扯冲乱敌阵。
 *   · 后排主力 = 色雷斯标枪手高级（4档【高级】） —— 色雷斯名扬希腊化世界的轻盾标枪大师，致命投掷压制主力。 */
export const THRACIAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'rhomphaia_warrior', count: 3 }, // 前排 = 色雷斯长刃斩手
            { type: 'sarmatian', count: 2 }, // 中排【重装】 = 萨尔马提亚重装铁骑
            { type: 'elite_peltast', count: 4 } // 后排主力【高级】 = 色雷斯标枪手高级
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
            { type: 'crossbowman', count: 3 },   // 前排 = 弩兵
            { type: 'spearman', count: 4 },   // 中坚主力 = 长矛兵
            { type: 'elite_teutonic_knight', count: 2 }   // 后排 = 条顿武士精锐（精锐留条顿本文化）
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
            { type: 'norse_warrior', count: 3 },   // 前排 = 诺斯狂暴战士
            { type: 'jarl', count: 4 },   // 中坚主力 = 维京首领骑兵高级（雅尔亲卫骑）
            { type: 'skirmisher', count: 2 }   // 后排 = 掷矛手
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
            { type: 'halberdier', count: 4 },
            { type: 'arbalest', count: 3 },
            { type: 'elite_hussite_wagon', count: 2 }
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
            { type: 'flemish_pikeman_f', count: 2 },   // 尖刀 = 勃艮第佛兰德民兵F（与基础档同队）
            { type: 'flemish_pikeman', count: 3 },   // 中坚 = 勃艮第佛兰德民兵
            { type: 'elite_coustillier', count: 4 }   // 底边主力 = 勃艮第马上轻骑精锐
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
            { type: 'rattan_archer', count: 2 },   // 尖刀 = 越南藤弓兵
            { type: 'imperial_skirmisher', count: 3 },   // 中坚 = 帝国掷矛手
            { type: 'rattan_archer_elite', count: 4 }   // 底边主力 = 越南藤弓兵精锐
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
            { type: 'elite_ballista_elephant', count: 2 }, // 尖刀 = 高棉弩炮战象精锐
            { type: 'archer', count: 3 }, // 中坚 = 南方步弓手
            { type: 'heavy_pikeman', count: 4 } // 底边主力【重装】 = 长枪兵重装
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
            { type: 'bolas_rider', count: 3 },
            { type: 'kona', count: 4 },
            { type: 'elite_kona', count: 2 }
        ]
    }
];

/** MUISCA 文化军团（triangle 2+3+4）
 *  [2026-09-06 铁律 一文化=一军团=一编制] 统一到该文化 1 个势力实际在用的这套
/** 城堡穆伊斯卡军团（锥形阵 2+3+4，神庙守卫前锋+格查勇士中坚+精锐主力决胜） */
export const MUISCA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'temple_guard', count: 2 },          // 尖刀先锋 = 穆伊斯卡神庙守卫（太阳神庙祭司卫队）
            { type: 'guecha_warrior', count: 3 },        // 中坚死士 = 穆伊斯卡格查勇士（奇布查金甲长矛勇士）
            { type: 'elite_guecha_warrior', count: 4 }   // 底边主力【精锐】 = 格查勇士精锐（黄金之国精锐突击狂战）
        ]
    }
];

/** 城堡图皮军团（锥形阵 2+3+4，图皮战棍前锋+黑木弓齐射+精锐战棍决胜） */
export const TUPI_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'ibirapema_warrior', count: 2 },        // 尖刀先锋 = 图皮战棍勇士（伊比拉佩马硬木战棍死士）
            { type: 'elite_blackwood_archer', count: 3 },   // 中坚压制【精锐】 = 黑木弓箭手精锐（亚马逊雨林淬毒强弓）
            { type: 'elite_ibirapema_warrior', count: 4 }   // 底边主力【精锐】 = 图皮战棍勇士精锐（图皮南巴部落终极狂战士）
        ]
    }
];

/** 城堡易洛魁军团 —— 北美东北林地，豪德诺索尼易洛魁联盟；为安置易洛魁战士、美洲鹰斥候而建
 *  [2026-09-07 主人定「兵种无处安放就建新军团」] 阵型 fish_scale */
export const IROQUOIS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'eagle_scout', count: 3 },   // 前排斥候 = 美洲鹰斥候
            { type: 'iroquois_warrior', count: 4 },   // 中坚主力 = 易洛魁战士
            { type: 'elite_plumed_archer', count: 2 }   // 后排齐射 = 玛雅羽箭手精锐（中美邻区弓手）
        ]
    }
];

/** 城堡奇穆军团 —— 安第斯北岸奇穆王国 900–1470；为安置枪兵长、尚皮飞毛腿、尚皮勇士高级而建
 *  [2026-09-07 主人定「兵种无处安放就建新军团」] 阵型 echelon */
export const CHIMU_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_champi_warrior', count: 4 },   // 前排主力 = 印加尚皮勇士高级（安第斯星锤）
            { type: 'kamayuk', count: 3 },   // 中坚 = 枪兵长
            { type: 'champi_runner', count: 2 }   // 后排 = 印加尚皮飞毛腿
        ]
    }
];

/** 城堡塔拉斯科军团 —— 中美西部米却肯塔拉斯科(普雷佩查)王国，终阿兹特克之世未被征服；为安置豹勇士精锐、羽箭手精锐而建
 *  [2026-09-07 主人定「兵种无处安放就建新军团」] 阵型 fish_scale */
export const TARASCAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'jaguar_warrior', count: 3 },   // 前排 = 阿兹特克豹勇士
            { type: 'elite_jaguar_warrior', count: 4 },   // 中坚主力 = 阿兹特克豹勇士精锐
            { type: 'plumed_archer', count: 2 }   // 后排齐射 = 玛雅羽箭手
        ]
    }
];

/** 城堡泰罗纳军团 —— 哥伦比亚圣玛尔塔内华达山泰罗纳；为安置神庙守卫精锐、黑木弓箭手而建
 *  [2026-09-07 主人定「兵种无处安放就建新军团」] 阵型 triangle */
export const TAIRONA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'blackwood_archer', count: 2 },   // 尖刀 = 图皮黑木弓箭手
            { type: 'guecha_warrior', count: 3 },   // 中坚 = 穆伊斯卡格查勇士（邻区同族）
            { type: 'elite_temple_guard', count: 4 }   // 底边主力 = 穆伊斯卡神庙守卫精锐
        ]
    }
];

/** 帝国特维尔切军团 —— 巴塔哥尼亚特维尔切(阿奥尼肯)流星锤猎手；为安置套索骑兵精锐而建
 *  [2026-09-07 主人定「兵种无处安放就建新军团」] 阵型 crane_wing */
export const TEHUELCHE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'bolas_rider', count: 2 },   // 两翼 = 马普切套索骑兵
            { type: 'elite_bolas_rider', count: 4 },   // 中坚主力 = 马普切套索骑兵精锐（特维尔切流星锤骑手）
            { type: 'kona', count: 3 }   // 后排 = 马普切科纳勇士
        ]
    }
];

/** ARMENIANS 文化军团（crescent 3+2+4）
 *  [2026-09-06 铁律 一文化=一军团=一编制] 统一到该文化 1 个势力实际在用的这套
 *  （亚美尼亚），原文化表那份已过时，作废。 */
/** 古典亚美尼亚军团（弯月 3+2+4，主力在后排）
 *  史料：以阿瓦莱尔战役（451）为形象——萨珊伊嗣俟二世强令亚美尼亚改奉拜火教，
 *        瓦尔丹·马米科尼扬率各家族起兵抗之，圣职者随军祝祷，战于亚拉腊山北的阿瓦莱尔平原。
 *        此役虽败，却迫使萨珊在《纳瓦萨克和约》中承认亚美尼亚信仰自由，是民族史的核心事件。
 *        亚美尼亚高地全境山谷，作战恃山民步兵与远射，弯月阵正合两翼前伸的山谷设伏。
 *  ⚠️ 旧主力是「萨尔马提亚重骑」——那是黑海草原的萨尔马提亚人，与亚美尼亚无关，
 *     2026-09-07 换回本族兵种。DE 亚美尼亚文明的专属单位正是修士战士与复合弓手，
 *     其重骑走通用线无专属，故不硬安一支挂着别国名字的具装骑（拜占庭圣骑/萨珊萨瓦尔/格鲁吉亚莫纳斯帕）。
 *    前 3 山地部落民       —— 亚美尼亚高地各家族的山民步兵
 *    中 2 精锐复合弓手     —— 本族招牌远射
 *    后 4 修士战士（主力） —— 阿瓦莱尔随军的圣职武装，编制中战力最强的一档
 */
export const ARMENIANS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'warrior_priest', count: 3 }, // 前排 = 亚美尼亚修士战士
            { type: 'hill_tribesman', count: 2 }, // 中排 = 山地部落民
            { type: 'elite_composite_bowman', count: 4 } // 后排主力【精锐】 = 亚美尼亚复合弓手精锐
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
            { type: 'armored_elephant', count: 2 },   // 两翼 = 装甲攻城战象
            { type: 'arambai', count: 3 },   // 中坚 = 缅甸飞镖骑兵
            { type: 'elite_arambai', count: 4 }   // 底边主力 = 缅甸飞镖骑兵精锐
        ]
    }
];

/** 瓦拉几亚 斯拉夫贵族铁骑+多瑙河近卫重剑士+草原骑射手（鹤翼阵 2+4+3：铁骑前锋2 + 冠军剑士高级主力4 + 骑射手后排3）
 *  史实依据：多瑙河畔瓦拉几亚公国以近卫重步兵结阵为主力，两侧配以游动波雅尔轻重铁骑与袭扰骑射。 */
export const WALLACHIA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'boyar', count: 2 },       // 前锋游击 = 斯拉夫贵族铁骑 2骑
            { type: 'champion', count: 4 },    // 中坚主力【高级】 = 欧洲冠军剑士高级 4队（公国近卫重铠剑士）
            { type: 'cav_archer', count: 3 }   // 后排袭扰 = 封建骑射手 3骑
        ]
    }
];

/** 埃及 复合弓手+双轮战车+长矛兵（雁行阵 4+3+2：复合弓手宽线齐射4 + 双轮战车中军冲击3 + 长矛兵压阵抗线2） */
/** 古典埃及军团（雁行 4+3+2，主力在前排）。
 *  2026-09-07 重配。原编制三个兵全是错的：复合弓手是亚美尼亚的且属城堡档、
 *  远程战车是「先秦」中国战车、长矛兵是封建档 —— 文化和时代都对不上。
 *
 *  史实依据（新王国—晚期埃及）：
 *   · 前排主力 双轮战车 —— 埃及是战车文明，卡叠石之战法老亲率战车队正面冲阵，
 *     两马轻车、御手+弓手编组，是法老军队的决定性兵种，故占 4 档主力。
 *   · 中坚 古典长矛兵 —— 持盾长矛步兵是埃及步兵主体，战车之后压住阵线。
 *   · 后排 克里特弓箭手 —— 埃及自身的复合弓手目录表里没有对应兵种；
 *     克里特雇佣弓手确有其事：托勒密王朝长期招募克里特弓兵充当军中射手。 */
export const EGYPT_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_war_chariot', count: 4, scale: 0.66 }, // 前排主力【高级】 = 双轮战车高级（法老战车）
            { type: 'antiquity_spearman', count: 3 }, // 中坚 = 古典长矛兵
            { type: 'cretan_archer', count: 2 } // 后排 = 克里特弓箭手
        ]
    }
];

/** 古典布匿军团（鹤翼阵 2+4+3，中坚重装主力）。
 *  严格遵守军团铁律：三排中必有一排精锐/高级/重装，符合古典时代，不安排攻城武器。
 *  史实依据（迦太基与汉尼拔布匿战争雇佣军体系）：
 *   · 前锋 战象（2档） —— 汉尼拔翻越阿尔卑斯山奇袭罗马、扎马战役80头战象踏阵冲锋（孔雀桑纳亚战象高级）。
 *   · 中坚主力 希腊雇佣重步兵（4档【重步】） —— 斯巴达名将克桑提普斯巴格拉达斯战役统帅的希腊雇佣方阵与迦太基核心重装主力，占 4 档重装主力。
 *   · 后排 罗得岛投石兵（3档） —— 西地中海最负盛名的致命投石雇佣兵团（巴利阿里投石索形制），曲射飞石密集压制。 */
export const CARTHAGE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'sannahya', count: 2 },
            { type: 'mercenary_hoplite', count: 4 },
            { type: 'rhodian_slinger', count: 3 }
        ]
    }
];

/** 古典巴比伦军团（雁行 4+3+2，主力在前排）。
 *  严格遵守军团 4 档铁律：军团中必须有一个重装/精锐/高级，并安排到 4 档。
 *  史实依据（美索不达米亚古巴比伦—新巴比伦）：
 *   · 前排主力 双轮战车高级（4档【高级】） —— 美索不达米亚是双轮马拉战车的发源地，喀西特与新巴比伦皇家突击双轮战车集群以强悍冲击力撼动近东战场，占 4 档高级主力。
 *   · 中坚 古典长矛兵（3档） —— 苏美尔秃鹰碑与汉谟拉比时代传承的铜盔大盾密集长矛方阵，跟进抗线压住正面阵线。
 *   · 后排 巴克特里亚弓手（2档） —— 近东高护甲复合角弓手，在矛墙掩护下进行抛射火力压制。 */
export const BABYLON_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_war_chariot', count: 4, scale: 0.66 },   // 底边主力 = 双轮战车高级
            { type: 'guardsman', count: 2 },   // 尖刀 = 近卫军（巴比伦王家近卫，古典近战步兵）
            { type: 'elite_guardsman', count: 3 }   // 中坚 = 近卫军高级
        ]
    }
];
/** 古典赫梯军团（锥形阵 2+3+4，主力在底边）。
 *  严格遵守军团 4 档铁律：军团中必须有一个重装/精锐/高级，并安排到 4 档。
 *  史实依据（安纳托利亚青铜时代铁器霸主·卡迭石大决战）：
 *   · 尖刀先锋 双轮战车（2档） —— 小亚细亚先导快车前出破风与侦查骚扰，占 2 档尖刀。
 *   · 中坚护翼 古典长矛兵（3档） —— 赫梯铁矛青铜甲步兵方阵居中，护住战车集群中轴与两翼，占 3 档中坚。
 *   · 底边决战 双轮战车高级（4档【高级】） —— 赫梯标志性三人重型铁甲战车集群，卡迭石战役穆瓦塔利二世亲率决战突击主力，占 4 档高级主力。 */
export const HITTITES_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'war_chariot', count: 2, scale: 0.66 },
            { type: 'antiquity_spearman', count: 3 },
            { type: 'elite_war_chariot', count: 4, scale: 0.66 }
        ]
    }
];
/** 古典亚述军团（鱼鳞 3+4+2，主力在中排）
 *  严格遵守军团 4 档铁律：军团中必须有一个重装/精锐/高级，并安排到 4 档；不安排攻城武器，全部为野战正规兵种；三兵全部为古典档位。
 *  史料：新亚述帝国（前 911—前 609）建起人类第一支常备职业军队——提格拉特帕拉沙尔三世改革
 *        设「王家部队」kiṣir šarrūti，脱离农时征召。其战法融合近东传统重战车与骑兵改革：
 *        ① 前排持盾长矛步兵线稳住正面阵型；
 *        ② 重装骑射手为机动决战主力，两翼狂暴抛射撕扯敌阵；
 *        ③ 双轮王家战车后排压阵，适时发起雷霆冲锋击溃敌军残阵。
 *    前 3 波斯持盾步兵（近东持盾矛兵） —— 近东大盾矛步兵线原型
 *    中 4 古典骑射手重装（主力【重装】）—— 亚述骑兵改革的王牌机动主力
 *    后 2 双轮战车 —— 亚述王室双轮重战车冲锋压阵
 */
export const ASSYRIAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'militia', count: 3 },   // 前排 = 中东民兵（亚述征召步兵，本区兵）
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },   // 中坚主力 = 古典骑射手重装
            { type: 'war_chariot', count: 2, scale: 0.66 }   // 后排 = 双轮战车
        ]
    }
];

/** 古典斯基泰军团（锥形阵 2+3+4，主力在底边）。
 *  严格遵守军团 4 档铁律：军团中必须有一个重装/精锐/高级，并安排到 4 档。
 *  史实依据（黑海北岸大草原·斯基泰游牧帝国骑射与斧骑战法）：
 *   · 尖刀先锋 斯基泰斧骑兵（2档） —— 希罗多德《历史》第四卷所载斯基泰精锐突骑，手持致命的短柄铁战斧（Sagaris）破阵劈砍撕裂敌线，占 2 档尖刀。
 *   · 冲击中坚 斯基泰骑射手（3档） —— 庞廷草原传统游牧骑手，装备斯基泰反曲复合弓（Gorytos双弓袋），机动回旋奔射，占 3 档中坚。
 *   · 底边主力 斯基泰骑射手高级（4档【高级】） —— 皇家斯基泰（Royal Scyths）王室黄金近卫神射手，远距暴烈破甲齐射主导决胜，占 4 档高级主力。 */
export const SCYTHIANS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'scythian_axe_cavalry', count: 2 },
            { type: 'scythian_horse_archer', count: 3 },
            { type: 'elite_scythian_horse_archer', count: 4 }
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
            { type: 'cataphract', count: 3 },   // 前排 = 拜占庭圣骑兵
            { type: 'elite_cataphract', count: 4 },   // 中坚主力 = 拜占庭圣骑兵精锐
            { type: 'composite_bowman', count: 2 }   // 后排 = 亚美尼亚复合弓手
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
            { type: 'paladin', count: 2 },   // 尖刀 = 欧洲游侠高级
            { type: 'elite_throwing_axeman', count: 3 },   // 中坚 = 法兰克掷斧兵精锐（精锐留法兰克本文化）
            { type: 'spearman', count: 4 }   // 底边主力 = 长矛兵
        ]
    }
];

/** 萨珊 波斯战象旗舰+波斯长生军+骑士重装（锥形阵 2+3+4：复合弓2 + 战象中坚1+长生军2 + 骑士重装4，战力111） */
export const SASANIAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_war_elephant', count: 2 },   // 尖刀 = 波斯战象精锐（精锐留波斯本文化；此兵极强，另两格按主人指示用最弱兵压回带内）
            { type: 'militia', count: 3 },   // 中坚 = 中东民兵
            { type: 'antiquity_spearman', count: 4 }   // 底边 = 古典长矛兵
        ]
    }
];

/** 突厥 答剌罕重骑+突厥重装骑射手+草原枪骑兵高级（锥形阵 2+3+4：答剌罕重骑2 + 重装骑射手3 + 草原枪骑兵高级4，战力66）
 *  史实依据：突厥汗国以狼头纛下突厥汗室贵族特权答剌罕甲骑突击开道，
 *  中坚以精锐重装复合弓骑射压制，底边由大草原高级冲击枪骑兵决胜。 */
export const TURKS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'tarkan', count: 2 },              // 尖刀先锋 = 答剌罕重骑 2骑（突厥可汗亲贵精锐）
            { type: 'cav_archer_heavy', count: 3 },    // 中坚扰乱【重装】 = 骑射手重装 3骑（精锐复合弓重装骑射）
            { type: 'elite_steppe_lancer', count: 4 }  // 底边主力【高级】 = 草原枪骑兵高级 4骑
        ]
    }
];

/** 南诏 战象+罗苴子重步兵+藤甲神射（鱼鳞阵 3+4+2：南方步弓手3 + 华夏刀剑手高级4 + 战斗象2） */
export const NANZHAO_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'archer', count: 3 }, // 前排 = 南方步弓手
            { type: 'jian_swordsman', count: 4 }, // 中坚主力【高级】 = 华夏刀剑手高级（罗苴子重铠甲士）
            { type: 'battle_elephant', count: 2 }, // 压阵 = 战斗象
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
            { type: 'karambit_warrior', count: 2 },
            { type: 'karambit_warrior_elite', count: 4 },
            { type: 'rattan_archer_elite', count: 3 },
        ]
    }
];

/** 古典月氏军团（锥形阵 2+3+4，主力在底边）
 *  严格遵守军团 4 档铁律：军团中必须有一个重装/精锐/高级，并安排到 4 档；大象只许占 2 档；三兵全部为古典档位。
 *  史料：《汉书·西域传》「大月氏国……本居敦煌、祁连间，至冒顿单于攻破月氏，
 *        而老上单于杀月氏王，以其头为饮器，月氏乃远去」「户十万，口四十万，胜兵十万人」
 *        ——「控弦」立国，骑射为本。西迁后据大夏（巴克特里亚），五翕侯归一而成贵霜帝国。
 *        迦腻色迦时代的钱币与苏尔赫科塔尔造像所见，是长袍长靴佩长剑的骑马贵族，
 *        承帕提亚—中亚传统的具装铁骑；南下所并的北印度属地则供给象兵。
 *    前 2 波鲁斯王战象 —— 北印度与犍陀罗属地的大象，象类只占 2 档
 *    中 3 粟特甲胄骑兵 —— 贵霜核心统治区粟特-大夏具装铁骑
 *    后 4 古典骑射手重装（主力【重装】）—— 大月氏王室「控弦胜兵十万」的核心主力
 */
export const KUSHAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'sannahya', count: 2 },
            { type: 'sogdian_cataphract', count: 4 },
            { type: 'antiquity_cavalry_archer', count: 3, scale: 1 }
        ]
    }
];
/** 古典努比亚军团（鹤翼阵 2+4+3，主力在中坚）。
 *  严格遵守军团 4 档铁律：军团中必须有一个重装/精锐/高级，并安排到 4 档。
 *  史实依据（“弓之国度”塔-塞提·库施与麦罗埃铁器强权）：
 *   · 前锋两翼 古典掷矛手高级（2档【高级】） —— 努比亚麦查伊（Medjay）荒漠飞矛死士，身手矫捷，以破甲标枪两翼游击撕扯，占 2 档前锋。
 *   · 中坚主力 先锋重装步兵（4档【重装】） —— 麦罗埃“古代非洲伯明翰”冶铁中心锻造的铁甲长矛勇士，中坚厚实抗线突破，占 4 档重装主力。
 *   · 后排支援 巴克特里亚弓手（3档） —— 古埃及名震遐迩的“弓之国度”大复合强木弓神射手，超长射程与极高杀伤覆盖战场，占 3 档支援。 */
export const KUSH_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'antiquity_scout_cavalry', count: 2 },   // 尖刀 = 古典斥候骑兵（努比亚轻骑侦察）
            { type: 'vanguard', count: 4 },   // 中坚主力 = 先锋重装步兵
            { type: 'bactrian_archer', count: 3 }   // 后排 = 巴克特里亚弓手
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
            { type: 'steppe_lancer', count: 2 },   // 尖刀 = 草原枪骑兵
            { type: 'liao_dao', count: 3 },   // 中坚 = 契丹辽刀手
            { type: 'elite_liao_dao', count: 4 }   // 底边主力 = 契丹辽刀手精锐（精锐留本文化）
        ]
    }
];

/** 回鹘 金镞角弓骑+回鹘突骑+长刀轻骑（三角阵 2+3+4） */
export const UIGHUR_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'steppe_lancer', count: 2 }, // 前锋 = 草原枪骑兵
            { type: 'cav_archer', count: 3 }, // 中坚 = 骑射手
            { type: 'elite_scythian_horse_archer', count: 4 }, // 主力底边【高级】 = 斯基泰骑射手高级（回鹘金镞角弓骑）
        ]
    }
];

/** 靺鞨 鹿角硬弓步兵+山地黑光铁骑+防线长矛（鱼鳞阵 3+4+2） */
export const MOHE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'laminated_bowman', count: 3 },   // 前排 = 层压复合弓手（东北亚层压角弓）
            { type: 'hei_kuang_heavy', count: 4 },   // 中坚主力 = 南北朝黑光铠骑兵重装
            { type: 'spearman', count: 2 }   // 后排 = 长矛兵
        ]
    }
];

/** 盎格鲁-撒克逊 坚矛盾墙长剑+撒克斯双手战斧+不列颠长弓（鹤翼阵 2+4+3：长剑前锋2 + 冠军剑士高级主力4 + 长弓手后排3）
 *  史实依据：黑斯廷斯战役（1066年）盎格鲁-撒克逊哈罗德二世以皇家侍从大斧与长剑结成坚固盾墙，
 *  配以英格兰森林长弓手压制，彻底修复原先战力仅50全库垫底的白板重长枪问题。 */
export const ANGLO_SAXON_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'manatarms', count: 3 }, // 前排盾墙 = 武士 3队（撒克逊 shield wall）
            { type: 'champion', count: 4 },      // 中坚主力【高级】 = 欧洲冠军剑士高级 4队（撒克斯双手战斧/皇家侍从禁卫）
            { type: 'longbowman', count: 2 }     // 后排齐射 = 不列颠长弓兵 2队（黑斯廷斯撒军弓手本就极少）
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
            { type: 'sosso_guard', count: 4 },   // 前排主力 = 西非索索禁卫军高级
            { type: 'pikeman', count: 3 },   // 中坚 = 长枪兵
            { type: 'elite_skirmisher', count: 2 }   // 后排 = 掷矛手高级（通用兵无本文化）
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
            { type: 'spearman', count: 2 },
            { type: 'elite_konnik', count: 4 },
            { type: 'cav_archer', count: 3 },
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
            { type: 'cavalier', count: 4 },   // 前排主力 = 骑士重装
            { type: 'lancer', count: 3 },   // 中坚 = 枪骑兵
            { type: 'scout_cavalry', count: 2 }   // 后排 = 斥候骑兵
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
            { type: 'two_handed_swordsman', count: 3 },
            { type: 'cavalier', count: 4 },
            { type: 'throwing_axeman', count: 2 }
        ]
    }
];

/** 柔然 鲜卑掠骑兵+骑射手重装+草原枪骑兵高级（锥形阵 2+3+4：鲜卑掠骑2 + 重装骑射3 + 草原枪骑兵高级4，战力56）
 *  史实依据：北魏北朝时期漠北柔然汗国善用草原鲜卑轻骑掠扰，
 *  中坚以精锐重装复合弓骑射压制，底边以草原枪骑兵高级突击决胜。 */
export const ROURAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'raider', count: 2 },   // 尖刀 = 掠骑兵
            { type: 'cav_archer_heavy', count: 3 },   // 中坚 = 骑射手重装
            { type: 'elite_steppe_lancer', count: 4 }   // 底边主力 = 草原枪骑兵高级
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
            { type: 'bactrian_archer', count: 3 },
            { type: 'sogdian_cataphract', count: 4 },
            { type: 'camel_rider', count: 2 },
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
            { type: 'hill_tribesman', count: 2 },
            { type: 'chukonu', count: 3 },
            { type: 'elite_cataphract', count: 4 },
        ]
    }
];

/** 爪哇 东南亚战斗象高级+爪刀跳帮勇士精锐+群岛重剑武士（鹤翼阵 2+4+3：战斗象高级前锋2 + 爪刀勇士精锐主力4 + 巽他皇家战士卫队3）
 *  史实依据：爪哇马打兰王国与满者伯夷帝国以热带丛林驯化战象突击开道，
 *  中坚以擅长波浪克利斯剑（Keris）与爪刀（Karambit）的跳帮近战死士为主力，辅以群岛水陆重剑士，
 *  彻底清除波斯战象、缅甸飞镖骑与越南藤弓之跨国大乱炖，战力由超标的128平抑至93黄金健康带。 */
export const JAVANESE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_battle_elephant', count: 2 },   // 两翼 = 战斗象高级
            { type: 'karambit_warrior_elite', count: 4 },   // 中坚主力 = 马来爪刀勇士精锐
            { type: 'sunda_royal_fighter', count: 3 }   // 后排 = 爪哇巽他皇家战士高级（巽他本族兵）
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
            { type: 'iron_pagoda', count: 2 },   // 尖刀 = 女真铁浮屠
            { type: 'grenadier', count: 3 },   // 中坚 = 女真掷弹兵（金军震天雷/铁火炮，1221 守汴京即用，属城堡代）
            { type: 'elite_iron_pagoda', count: 4 }   // 底边主力 = 女真铁浮屠精锐
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
            { type: 'camel_rider', count: 2 },        // 两翼 = 骆驼骑兵
            { type: 'elite_ghulam', count: 4 },       // 中坚主力 = 印度斯坦古拉姆精锐（古拉姆制即塞尔柱-伊斯兰奴隶亲兵）
            { type: 'longswordsman', count: 3 }       // 后排 = 中东剑士（本兵素材样貌即中东剑士，城堡代，归中东文化区）
        ]
    }
];

/** 城堡奥斯曼军团（偃月阵 3+2+4，苏丹亲兵前排齐射+精锐亲兵中军+精锐古拉姆铁拳） */
export const OTTOMAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'janissary', count: 3 },   // 前排 = 土耳其苏丹亲兵
            { type: 'elite_janissary', count: 2 },   // 中坚 = 土耳其苏丹亲兵精锐
            { type: 'royal_janissary', count: 4 }   // 底边主力 = 奥斯曼皇家亲兵高级（耶尼切里三档同堂）
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
            { type: 'coustillier', count: 2 },   // 尖刀 = 勃艮第马上轻骑（基础档给邻区法兰西，精锐留勃艮第）
            { type: 'genoese_crossbowman', count: 3 },   // 中坚 = 意大利热那亚弩手
            { type: 'frankish_paladin', count: 4 }   // 底边主力 = 法兰克圣骑士高级
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
            { type: 'spearman', count: 2 },   // 尖刀 = 长矛兵
            { type: 'cav_archer_heavy', count: 3 },   // 中坚 = 骑射手重装
            { type: 'imperial_cavalry', count: 4 }   // 底边主力 = 波斯具装铁骑重装
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
            { type: 'war_elephant', count: 2 },   // 两翼 = 波斯战象
            { type: 'archer', count: 4 },   // 中坚主力 = 南方步弓手
            { type: 'imperial_camel_rider', count: 3 }   // 后排 = 印度斯坦骆驼骑兵重装
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
            { type: 'hand_cannoneer', count: 2 },
            { type: 'elite_camel_archer', count: 3 },
            { type: 'qizilbash_warrior', count: 4 },
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
            { type: 'halberdier', count: 3 },
            { type: 'elite_boyar', count: 4 },
            { type: 'hand_cannoneer', count: 2 }
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
            { type: 'chakram_thrower', count: 3 },   // 前排 = 古吉拉特飞轮掷手（基础档给邻区，精锐留瞿折罗）
            { type: 'urumi_swordsman', count: 4 },   // 中坚主力 = 达罗毗荼软剑士（基础档；精锐留达罗毗荼）
            { type: 'shrivamsha_rider', count: 2 }   // 后排 = 什里瓦姆沙骑手
        ]
    }
];

/** 古典希伯来军团（鱼鳞 3+4+2，主力在中排）
 *  史料：以色列-犹大王国（扫罗—大卫—所罗门，约前 1050—前 586）以山地步兵立国。
 *        甩石：《士师记》20:16 便雅悯「能用机弦甩石打人，毫发不差」；
 *              《历代志上》12:2 便雅悯人「能用左右两手甩石射箭」；
 *              大卫击歌利亚用的正是投石（《撒母耳记上》17:49）——希伯来最著名的战斗意象。
 *        重装：大卫的「勇士」gibborim（三十勇士，《撒母耳记下》23）是王室常备精锐。
 *        战车：以色列早期缺车（《士师记》1:19 有铁车的是敌人），
 *              至所罗门才建米吉多/夏琐/基色三座战车城，《列王纪上》10:26 载战车一千四百辆，
 *              故战车只占 2 档，不作主力。
 *  ⚠️ 旧编制是 guardsman / longswordsman / archer 三档通用兵，无任何希伯来特征，
 *     2026-09-07 按史实重排。
 *    前 3 投石兵     —— 便雅悯甩石手
 *    中 4 先锋重装步兵 —— 大卫的勇士 gibborim，王室常备主力
 *    后 2 双轮战车   —— 所罗门战车城的车队，仅 2 档
 */
export const HEBREWS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            // 🔴 [2026-09-07] 原为「投石兵」—— 那是城堡时代档的兵，待在古典军团里是穿越。
            //    换成近东民兵：以色列行支派征召制，《民数记》一章各支派点兵，战时召民成军而非常备军。
            { type: 'levy', count: 3 },
            { type: 'vanguard', count: 4 },
            { type: 'war_chariot', count: 2, scale: 0.66 }
        ]
    }
];

/** 古典乌孙军团（锋矢 2+3+4，主力在后排压阵）
 *  史料：《汉书·西域传》「乌孙国，大昆弥治赤谷城……户十二万，口六十三万，胜兵十八万八千八百人」
 *        「不田作种树，随畜逐水草，与匈奴同俗。国多马，富人至四五千匹」
 *        「乌孙民有塞种、大月氏种云」——族源杂塞种与月氏遗民。
 *        本始三年（前 71）乌孙五万骑与汉五道并出，破匈奴右谷蠡王庭。
 *  取舍：乌孙是纯游牧骑射国，史书未载具装重骑（具装是萨尔马提亚/贵霜/安息那条线），
 *        故主力取「古典骑射手重装」而非具装枪骑；前排萨迦斧兵出自「民有塞种」。
 *    前 2 萨迦斧兵    —— 塞种徒步部众，斧战开路
 *    中 3 古典轻骑兵  —— 「国多马」的游骑，绕射扰袭
 *    后 4 重装骑射手  —— 控弦十八万的主力，居后齐射压阵
 */
export const WUSUN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'sakan_axeman', count: 2 },
            { type: 'antiquity_light_cavalry', count: 3 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
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
            // 🔴 [2026-09-07 平衡] 原编成（古典长矛兵2/古典斥候骑兵3/古典骑射手4）战力 41，
            //    是全部 102 个文化军团的并列垫底，且 4 档放的是白板「古典骑射手」，本身就违反 4 档铁律。
            //    三格全部换成样貌相称的羌人兵：山民步兵 + 游骑 + 重装骑射，战力 65 回到古典带内。
            { type: 'antiquity_light_cavalry', count: 2, scale: 1 },        // 前 2 尖刀 = 古典轻骑兵（羌游骑绕袭）
            { type: 'hill_tribesman', count: 3, scale: 1 },                 // 中 3 骨干 = 山地部落民（湟中山民步兵，样貌是皮裘山民）
            { type: 'antiquity_heavy_cavalry_archer', count: 4, scale: 1 }  // 后 4 主力【重装】 = 古典骑射手重装（羌骑控弦）
        ]
    }
];
/** 古典纳巴泰军团（鹤翼阵 2+4+3，主力在中坚）。
 *  严格遵守军团 4 档铁律：军团中必须有一个重装/精锐/高级，并安排到 4 档。
 *  史实依据（佩特拉玫瑰岩凿要塞·红海香料商路沙漠骑兵）：
 *   · 前锋两翼 古吉拉特骆驼斥候（2档） —— 红海沙漠香料商路先导驼骑，穿越内盖夫沙漠与阿拉伯荒漠，克制马匹穿插破风，占 2 档前锋。
 *   · 中坚主力 古典骑射手重装（4档【重装】） —— 纳巴泰近东沙漠重装复合弓突骑，两翼合围冲锋突破，机动与射程兼具，占 4 档重装主力。
 *   · 后排支援 巴克特里亚弓手（3档） —— 佩特拉粉红岩壁居高临下齐射的近东强弓手，长程压制敌军，占 3 档支援。 */
export const NABATAEANS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'camel_scout', count: 2 },
            { type: 'antiquity_heavy_cavalry_archer', count: 4 },
            { type: 'bactrian_archer', count: 3 }
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
            { type: 'bactrian_archer', count: 2 },
            { type: 'cav_archer', count: 3 },
            { type: 'elite_tarkan', count: 4 },
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
            { type: 'hill_tribesman', count: 3 },
            { type: 'recurve_bowman', count: 4 },
            { type: 'war_dog', count: 2 },
        ]
    }
];

export const SWISS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'champion', count: 3 },   // 前排 = 欧洲冠军剑士高级
            { type: 'halberdier', count: 4 },   // 中坚主力 = 欧洲重装戟兵
            { type: 'hussite_wagon', count: 2 }   // 后排 = 波希米亚胡斯战车（基础档给中欧邻区，精锐留捷克）
        ]
    }
];

export const PASHTUN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'hill_tribesman', count: 3 },
            { type: 'elite_camel_archer', count: 2 },
            { type: 'elite_ghulam', count: 4 },
        ]
    }
];


/** 古典马其顿军团（雁行阵 4+3+2，主力在前排宽线）。
 *  严格遵守军团 4 档铁律：军团中必须有一个重装/精锐/高级，并安排到 4 档；不安排攻城武器；三兵全部为古典档位。
 *  史料：亚历山大大帝与腓力二世（前 359—前 323）马其顿大军团体系。
 *        古代军事史上最著名的「铁锤与铁砧」（Hammer and Anvil）协同战法：
 *        ① 铁砧：前排以坚如磐石的重装步兵与萨里沙超长矛方阵（长达 5.5—6 米长矛）筑成牢不可破的钢铁之墙，
 *           高加米拉战役中以梯队展开（Echelon）牢牢钉死波斯大军正面；
 *        ② 铁锤：亚历山大亲率王室伙伴重骑兵（Hetairoi），在敌阵拉扯出空隙时发起雷霆万钧的楔形冲锋，一击直插敌军王中军！
 *    前 4 希腊重装步兵（主力【重装】） —— 战线核心盾墙支柱
 *    中 3 马其顿方阵步兵 —— 萨里沙超长矛方阵穿透刺杀
 *    后 2 马其顿伙伴骑兵 —— 亚历山大亲率王家冲击重骑铁锤侧击
 */

/** 古典希伦军团（斜行/雁行阵 4+3+2，主力在前排宽线）。
 *  严格遵守军团铁律：三排中必有一排精锐/高级/重装，符合古典时代，不安排攻城武器。
 *  史实依据：古希腊古典城邦世界（Hellas）雅典、斯巴达、底比斯三大霸主联合军阵。
 *   · 前排主力 斯巴达希皮乌斯精锐（4档【精锐】） —— 斯巴达国王贴身三百勇士，手执阿斯庇斯重盾组成的钢铁盾墙。
 *   · 中坚战列 希腊底比斯圣队精锐（3档【精锐】） —— 留克特拉会战一战成名的 150 对生死搭档，斜行阵突刺破坚之矛。
 *   · 后翼策应 雅典将军卫队精锐（2档【精锐】） —— 雅典十将军直属近卫精兵，高敏突击掩护两翼。
 */

/** 古典罗马禁卫军团（锥形阵 2+3+4，全员禁卫铁骑突击）。
 *  严格遵守军团铁律：三排中必有一排精锐/高级/重装，符合古典时代，不安排攻城武器。
 *  史实依据（罗马帝国与元首制帝国禁卫铁骑体系）：
 *   · 尖刀前锋 罗马伴随骑兵高级（2档【高级】） —— 公民骑士精锐破风切入两翼撕开空隙。
 *   · 中坚战列 罗马百夫长（3档） —— 跨马战列百夫长中坚突刺冲阵。
 *   · 底边主力 罗马百夫长重装（4档【重装】） —— 奥古斯都皇帝御前禁卫亲军（Equites Singulares Augusti），具装铁壁势不可挡。
 */

/** 古典希腊雇佣军团（雁行阵 4+3+2，步兵宽线推进）。
 *  严格遵守军团铁律：三排中必有一排精锐/高级/重装，符合古典时代，不安排攻城武器。
 *  史实依据（色诺芬《长征记》万人军与希腊化地中海雇佣大军）：
 *   · 前排主力 希腊雇佣重步兵高级（4档【高级】） —— 身经百战的地中海职业希腊雇佣方阵，大圆盾青铜铠正面推进。
 *   · 中坚冲阵 希腊化冲击骑兵重装（3档【重装】） —— 希腊化继业者时代雇佣具装重骑兵，以铁矛破开敌线。
 *   · 后排掩护 希腊腹弩手（2档） —— 叙拉古兵工厂发明的古希腊腹弩（Gastraphetes），提供强劲机械抛射支援。
 */

/** 古典大希腊军团（雁行阵 4+3+2，步兵宽线推进）。
 *  严格遵守军团铁律：三排中必有一排精锐/高级/重装，符合古典时代，不安排攻城武器。
 *  史实依据（南意大利与西西里大希腊城邦同盟·塔兰托体系）：
 *   · 前排主力 希腊埃克德罗摩斯高级（4档【高级】） —— 著名脱阵疾跑破袭重步兵，持矛盾高速切入压制敌方阵脚。
 *   · 中坚冲阵 希腊贵族骑兵（3档） —— 大希腊各城邦公民骑士阶层冲击铁骑，中腰强力突破。
 *   · 后翼远射 塔兰丁骑兵（2档） —— 大希腊塔兰托名噪地中海的独门标枪轻骑兵，两翼高速掠袭投射标枪。
 */
/** 古典亚马逊军团（鹤翼阵 2+4+3，主力在中坚）
 *  史料：希罗多德《历史》四·110-117 —— 亚马逊人在塔奈斯河口与斯基泰青年合流成萨尔马提亚人，
 *        其女子「骑马、射猎、上阵，与男子无异」；希腊传统把她们的都城放在特尔莫冬河口的忒弥斯基拉。
 *        顿河—伏尔加草原的斯基泰-萨尔马提亚库尔干墓里确有大量随葬弓箭短剑的女性墓，是这条传说的实证底子。
 *    前 2 亚马逊女弓手       —— 轻装步射，两翼游斗
 *    中 4 斯基泰骑射手高级   —— 主力【高级】：她们的正体就是草原女骑射，与斯基泰同制
 *    后 3 亚马逊女战士       —— 圆盾长矛的近战女武士，压住阵线
 */
export const AMAZONS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'amazon_archer', count: 2 },
            { type: 'elite_scythian_horse_archer', count: 4 },
            { type: 'amazon_warrior', count: 3 }
        ]
    }
];


/** 古典阿契美尼德军团（鱼鳞阵 3+4+2，中坚突破+不死军步弓协同）。
 *  严格遵守军团铁律：三排中必有一排精锐/高级/重装，符合古典时代，不安排攻城武器。
 *  史实依据（阿契美尼德帝国皇家万人不死卫队 Immortal 体系）：
 *   · 前排主力 波斯长生军（3档） —— 希罗多德记载的阿契美尼德万人不死军精锐矛步兵，铁叶鳞甲短矛破阵，坚壁御敌。
 *   · 中坚主力 古典骑射手重装（4档【重装】） —— 波斯帝国精锐具装复合弓骑兵，中阵机动迂回穿插与致命齐射。
 *   · 后排近卫 波斯长生军弓手（2档） —— 不死军御前弓兵近卫，复合重弓暴雨覆盖，与近战长生军前排形成史实步弓一体协同。
 */
export const ACHAEMENIDS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'immortal', count: 3 }, // 前排主力 = 波斯长生军
            { type: 'antiquity_heavy_cavalry_archer', count: 4 }, // 中坚主力【重装】 = 古典骑射手重装
            { type: 'immortal_ranged', count: 2 } // 后排近卫 = 波斯长生军弓手
        ]
    }
];

export const MAGNA_GRAECIA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'ekdromos', count: 4 }, // 前排主力【高级】 = 希腊埃克德罗摩斯高级
            { type: 'greek_noble_cavalry', count: 3 }, // 中坚 = 希腊贵族骑兵
            { type: 'tarantine_cavalry', count: 2 } // 后翼 = 塔兰丁骑兵
        ]
    }
];

export const GREEK_MERCENARY_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'mercenary_hoplite', count: 4 },
            { type: 'shock_cavalry', count: 2 },
            { type: 'gastraphetes', count: 3 }
        ]
    }
];
export const IMPERIAL_ROME_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            // 🔴 [2026-09-07 主人亲改] 锥形阵 2+3+4 → 雁行阵 4+3+2：伴随骑士高级上前排主力。
            //    战力也从 126 降到 116。（我一度误判成测试残留给改回去了，是我判错，已按主人原意改回。）
            { type: 'equites', count: 4 }, // 前排主力 = 罗马伴随骑士高级
            { type: 'centurion', count: 3 }, // 中坚 = 罗马百夫长
            { type: 'imperial_centurion', count: 2 } // 后排 = 罗马百夫长重装
        ]
    }
];

export const HELLENIC_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'hippeus', count: 4 }, // 前排主力【精锐】 = 斯巴达希皮乌斯精锐
            { type: 'sacred_band', count: 3 }, // 中坚【精锐】 = 希腊底比斯圣队精锐
            { type: 'strategos', count: 2 } // 后翼【精锐】 = 雅典将军卫队精锐
        ]
    }
];

export const MACEDONIAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'phalangite', count: 4, scale: 1 },
            { type: 'hero_macedonian_commander', count: 2, scale: 1 },
            { type: 'companion_cavalry', count: 3 }
        ]
    }
];
export const SWEDISH_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'two_handed_swordsman', count: 3 }, // 前排 = 双手剑士
            { type: 'heavy_pikeman', count: 4 }, // 中坚主力【重装】 = 长枪兵重装
            { type: 'hussar', count: 2 } // 后排 = 骠骑兵
        ]
    }
];

/** 赵宋 华夏持盾刀剑手高级步人甲抗线+三弓床弩重装压制+岳家军背嵬具装重骑突击（衡轭阵 4+2+3，综合战力 77） */
export const SONG_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_fire_lancer', count: 4 },      // 前排主力【高级】 = 南宋火矛手高级（顺昌大捷飞火枪步骑撕裂）
            { type: 'fire_lancer', count: 2 },            // 中军突阵 = 南宋火矛手（火矛近战喷刺）
            { type: 'cavalier', count: 3 }               // 后排铁壁【重装】 = 骑士重装（大宋具装甲骑护卫）
        ]
    }
];

/** 高丽 长枪兵重装抗线+铁浮屠具装铁骑突击+高丽硬弓手密集抛射（鹤翼阵 2+4+3，综合战力 69） */
export const GORYEO_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'spearman', count: 2, scale: 1 },
            { type: 'elite_war_wagon', count: 3, scale: 0.53 },
            { type: 'fire_archer', count: 4, scale: 1 }
        ]
    }
];

/** 古典朝鲜 古典长矛步兵抗线+古典掷矛手消耗+古典骑射手机动（方阵 3+3+3） */
export const GOJOSEON_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'antiquity_spearman', count: 3, scale: 1 },   // 前排 = 古典长矛兵（圆盾抗线）
            { type: 'antiquity_skirmisher', count: 3, scale: 1 }, // 中坚 = 古典掷矛手（远程消耗）
            { type: 'antiquity_cavalry_archer', count: 3, scale: 1 } // 后排 = 古典骑射手（轻骑机动）
        ]
    }
];

/** 帝国大明 牌刀手抗线+黑光铠骑兵主力+神机箭重型火箭车（鱼鳞阵 3+4+2） */
export const MING_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'jian_swordman_shielded', count: 3, scale: 1 }, // 前排 = 牌刀手（抗线）
            { type: 'hei_kuang', count: 4, scale: 1 },              // 中军主力 = 黑光铠骑兵（三千营铁骑）
            { type: 'heavy_rocket_cart', count: 2, scale: 1 }       // 后排 = 神机箭重型火箭车（火器）
        ]
    }
];

/** 帝国朝鲜 牌刀手抗线+高丽战车突击+火枪兵火器压制（鹤翼阵 2+4+3，综合战力 107） */
export const JOSEON_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'jian_swordman_shielded', count: 2, scale: 1 },   // 两翼 = 华夏持盾刀剑手高级（牌刀手）
            { type: 'war_wagon', count: 4, scale: 0.59 },                          // 中坚主力 = 高丽战车（神机箭火车）
            { type: 'hand_cannoneer', count: 3, scale: 1 }            // 后排 = 火枪手
        ]
    }
];
/** 大理 战象冲阵铁拳突破+西南藤弓兵精锐暴雨攒射+华夏持盾刀剑手侧卫（鱼鳞阵 3+4+2，综合战力 88） */
export const DALI_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'battle_elephant', count: 2 },
            { type: 'crossbowman', count: 4, scale: 1 },
            { type: 'jian_swordman_shielded', count: 3 }
        ]
    }
];
/** 角斯罗 冷锻瘊子甲铁骑尖刀冲锋+青唐具装甲骑中军+高原骑射手游击（锥形阵 2+3+4，综合战力 80） */
export const GUSILUO_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_boyar', count: 2 },            // 尖刀锋刃【精锐】 = 斯拉夫贵族铁骑精锐（青唐冷锻瘊子甲铁骑，五十步强弩不入）
            { type: 'imperial_cavalry', count: 3 },       // 中军冲锋【重装】 = 波斯具装铁骑重装（宗喀河湟具装铁骑）
            { type: 'cav_archer', count: 4 }             // 底边游击 = 骑射手（高原番兵善骑射之众）
        ]
    }
];

/** 马穆鲁克 骆驼弓骑精锐两翼+苏丹马穆鲁克重骑突击+骆驼骑兵策应（鹤翼阵 2+4+3，综合战力 76） */
export const MAMLUKS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_camel_archer', count: 2 },     // 两翼游击【精锐】 = 柏柏尔骆驼弓骑精锐（苏丹近卫骆驼弓手）
            { type: 'cavalier', count: 4 },               // 中坚铁骑【重装】 = 骑士重装（马穆鲁克苏丹具装铁骑）
            { type: 'camel_rider', count: 3 }             // 后排接应 = 骆驼骑兵（叙利亚沙漠骆驼突击队）
        ]
    }
];

/** 十字军 欧洲十字军骑士高级尖刀突破+圣殿楷模武士高级中坚+十字军弩手火力（鱼鳞阵 3+4+2，综合战力 86） */
export const CRUSADERS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'teutonic_knight', count: 3 },   // 前排 = 条顿武士（基础档给十字军，主人指示）
            { type: 'paragon', count: 4 },   // 中坚主力 = 十字军圣殿楷模武士高级
            { type: 'crusader_knight', count: 2 }   // 后排 = 欧洲十字军骑士高级
        ]
    }
];

/** 罗斯 斯拉夫贵族铁骑精锐突锋+双手大剑重步中坚+轻骑射手掩护（鱼鳞阵 3+4+2，综合战力 82） */
export const RUS_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_boyar', count: 3 },            // 尖刀铁拳【精锐】 = 斯拉夫贵族铁骑精锐（博雅尔王公具装重骑）
            { type: 'two_handed_swordsman', count: 4 },   // 中坚破阵 = 双手大剑士（诺夫哥罗德与莫斯科长柄战斧大剑士）
            { type: 'cav_archer', count: 2 }              // 后排掩护 = 骑射手（罗斯草原前哨斥候骑射）
        ]
    }
];

/** 西辽 草原枪骑兵高级皮室具装锋刃+反曲弓骑游弋+重装斧骑突阵（锥形阵 2+3+4，综合战力 67） */
export const KARA_KHITAN_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_steppe_lancer', count: 2 },    // 尖刀锋刃【高级】 = 草原枪骑兵高级（西辽黑契丹皮室重装铁骑）
            { type: 'cav_archer', count: 3 },             // 中坚游射 = 骑射手（契丹反曲强弓轻骑射）
            { type: 'keshik', count: 4 }                 // 底边主力 = 怯薛军（近战重骑；蒙古草原与西辽相邻，比女真近）
        ]
    }
];

/** 帖木儿 波斯具装铁骑重装尖刀+察合台骑射漫天矢石+重装骑士突击（锥形阵 2+3+4，综合战力 80） */
export const TIMURID_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'imperial_cavalry', count: 2 },       // 尖刀锋刃【重装】 = 波斯具装铁骑重装（帖木儿汗国亲军具装重甲）
            { type: 'cav_archer', count: 3 },             // 中坚齐射 = 骑射手（河中察合台精锐骑射手）
            { type: 'cavalier', count: 4 }                // 底边铁甲【重装】 = 骑士重装（撒马尔罕重装突击铁骑）
        ]
    }
];

/** 德里 战斗象尖刀突破+古拉姆近卫步兵精锐中坚+古拉姆苏丹禁卫近战（鱼鳞阵 3+4+2，综合战力 98） */
export const DELHI_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_armored_elephant', count: 2 }, // 尖刀突破【高级】 = 装甲攻城战象高级（精锐留本文化：装甲攻城象是德里苏丹国的兵；基础档留邻区缅族）
            { type: 'elite_ghulam', count: 3 },     // 中坚核心【精锐】 = 印度斯坦古拉姆精锐（苏丹亲兵古拉姆近卫铁甲剑士）
            { type: 'ghulam', count: 4 }            // 侧翼近卫【重装】 = 印度斯坦古拉姆（苏丹侍卫古拉姆持盾长矛剑士）
        ]
    }
];

/** 卡斯蒂利亚 圣地亚哥重装骑士突锋+欧洲双手剑士中坚+标枪骑兵高级护翼（雁行阵 4+3+2，综合战力 73） */
export const CASTILE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'cavalier', count: 4 },               // 前排冲击【重装】 = 骑士重装（圣地亚哥骑士团与卡斯蒂利亚具装骑兵）
            { type: 'two_handed_swordsman', count: 3 },    // 中坚推进 = 欧洲双手剑士（伊比利亚收复失地重步兵）
            { type: 'elite_genitour', count: 2 }          // 侧卫轻骑【高级】 = 标枪骑兵高级（西班牙希内特标枪轻骑）
        ]
    }
];

/** 苏格兰 刺猬密集长枪抗骑+高地双手巨剑破阵+轻骑袭扰（衡轭阵 4+2+3，综合战力 55） */
export const SCOTLAND_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'heavy_pikeman', count: 4 },          // 前线枪林【重装】 = 长枪兵重装（苏格兰刺猬密集长矛阵）
            { type: 'light_cavalry', count: 2 },          // 侧翼袭扰 = 轻型骑兵（苏格兰边境轻装骑兵）
            { type: 'two_handed_swordsman', count: 3 }     // 后排斩阵 = 双手大剑士（苏格兰高地大剑勇士破阵）
        ]
    }
];

/** 神圣罗马 德意志板甲骑士突锋+双手大剑斩杀+帝国十字弩狙击（雁行阵 4+3+2，综合战力 75） */
export const HRE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'cavalier', count: 4 },               // 前排冲击【重装】 = 骑士重装（神圣罗马帝国重装板甲骑士）
            { type: 'two_handed_swordsman', count: 3 },   // 中坚巨剑 = 双手大剑士（德意志双手巨剑士 Zweihänder）
            { type: 'crossbowman', count: 2 }             // 后排狙击 = 弩兵（帝国与汉萨同盟十字强弩）
        ]
    }
];

/** 摩洛哥 柏柏尔骆驼弓骑策应+苏丹黑骑重装铁拳+标枪轻骑合围（鹤翼阵 2+4+3，综合战力 71） */
export const ALMOHAD_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'elite_camel_archer', count: 2 },     // 两翼牵制【精锐】 = 柏柏尔骆驼弓骑精锐（撒哈拉苏丹骆驼弓手）
            { type: 'cavalier', count: 4 },               // 中坚铁拳【重装】 = 骑士重装（穆瓦希德与穆拉比特苏丹黑骑近卫团）
            { type: 'elite_genitour', count: 3 }          // 后排合围【高级】 = 标枪骑兵高级（柏柏尔希内特标枪突袭轻骑）
        ]
    }
];

/** 塞尔维亚 重装长枪密集拒马+尼曼雅王家铁骑突破+轻骑射手掩护（鱼鳞阵 3+4+2，综合战力 67） */
export const SERBIA_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'heavy_pikeman', count: 3 },   // 前排 = 长枪兵重装
            { type: 'cavalier', count: 4 },   // 中坚主力 = 骑士重装
            { type: 'knight', count: 2 }   // 后排 = 骑士
        ]
    }
];

/** 伊利汗 波斯具装铁骑尖刀冲锋+蒙古强弓压制+重装骑兵合围（锥形阵 2+3+4，综合战力 74） */
export const ILKHANATE_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'imperial_cavalry', count: 2 },       // 尖刀铁甲【重装】 = 波斯具装铁骑重装（旭烈兀西征亲军波斯具装铁甲重骑）
            { type: 'cav_archer', count: 3 },             // 中坚齐射 = 骑射手（伊利汗国蒙古反曲强弓骑射）
            { type: 'keshik', count: 4 }                 // 底边主力 = 怯薛军（近战重骑；伊利汗国本为蒙古政权，怯薛即其宿卫）
        ]
    }
];

/** 阿拉贡 加泰罗尼亚骑士突破+阿尔加瓦长剑勇士攻坚+标枪轻骑护卫（鱼鳞阵 3+4+2，综合战力 69） */
export const ARAGON_TIERS: CompositionTier[] = [
    {
        minTroops: 0,
        maxTroops: Infinity,
        gridSize: 3,
        slots: [
            { type: 'cavalier', count: 3 },               // 尖刀铁拳【重装】 = 骑士重装（加泰罗尼亚-阿拉贡封建具装骑士）
            { type: 'two_handed_swordsman', count: 4 },   // 中坚主力 = 欧洲双手剑士（阿拉贡重装剑士劲卒）
            { type: 'elite_genitour', count: 2 }          // 后排侧卫【高级】 = 标枪骑兵高级（地中海希内特轻骑与标枪游击）
        ]
    }
];

export const CULTURE_TIERS_MAP: Record<RegionType, CompositionTier[]> = {
    CENTRAL:      CENTRAL_TIERS,
    NORTH:        NORTH_TIERS,
    NORTHEAST:    NORTHEAST_TIERS,
    KOREA:        KOREA_TIERS,
    JAPAN:        JAPAN_TIERS,
    JAPAN_ANTIQUITY: JAPAN_TIERS,
    JAPAN_IMPERIAL: JAPAN_TIERS,
    STEPPE:       STEPPE_TIERS,
    STEPPE_IMPERIAL: STEPPE_TIERS,
    HEXI:         HEXI_TIERS,
    BASHU:        BASHU_TIERS,
    JIANGNAN:     JIANGNAN_TIERS,
    LINGNAN:      LINGNAN_TIERS,
    DIANQIAN:     DIANQIAN_TIERS,
    TIBET:        TIBET_TIERS,
    TIBET_CASTLE: TIBET_TIERS,
    TIBET_IMPERIAL: TIBET_TIERS,
    CENTRAL_ASIA: CENTRAL_ASIA_TIERS,
    CENTRAL_ASIA_IMPERIAL: CENTRAL_ASIA_TIERS,
    WEST_ASIA:    WEST_ASIA_TIERS,
    WESTERN:      WESTERN_TIERS,
    WESTERN_FEUDAL: WESTERN_TIERS,
    WESTERN_CASTLE: WESTERN_TIERS,
    WESTERN_IMPERIAL: WESTERN_TIERS,
    SLAVIC:       SLAVIC_TIERS,
    GERMANIC:     GERMANIC_TIERS,
    LATIN:        LATIN_TIERS,
    LATIN_FEUDAL: LATIN_TIERS,
    INDIA:        INDIA_TIERS,
    BERBER:       BERBER_TIERS,
    AMERICA:      AMERICA_TIERS,      // ⚠️ [2026-08-24] 暂复用拉丁编成（美洲步兵），待定制
    NORTHAM_IMPERIAL: AMERICA_TIERS,
    NORTHAM_FEUDAL: AMERICA_TIERS,
    AFRICA:       AFRICA_TIERS,     // ⚠️ [2026-08-24] 暂复用柏柏尔编成（非洲步/骆驼），待定制
    AFRICA_IMPERIAL: AFRICA_TIERS,
    MALAY:        MALAY_TIERS,   // ⚠️ [2026-08-24] 暂复用滇缅编成（马来），待定制
    SEASIA_ANTIQUITY: MALAY_TIERS,
    SEASIA_IMPERIAL: MALAY_TIERS,
    ANDE:         ANDE_TIERS,      // ⚠️ [2026-08-27] 暂复用拉丁编成（安第斯步兵），待定制
    SOUTHAM_IMPERIAL: ANDE_TIERS,
    PURU:         PURU_TIERS,      // ⚠️ [2026-08-27] 暂复用印度编成（南印度象兵），待定制
    ORIE:         ORIE_TIERS,     // ⚠️ [2026-08-27] 暂复用柏柏尔编成（阿拉伯骆驼骑），待定制
    ORIE_ANTIQUITY: ORIE_TIERS,
    EAST:         EAST_TIERS,     // ⚠️ [2026-08-27] 暂复用斯拉夫编成（东欧波雅尔铁骑+弓，罗斯已迁入），待定制
    GREEK:        GREEK_TIERS,      // 古典希腊军团（鱼鳞阵 3+4+2：希腊重步3 + 希腊贵族骑兵高级4 + 希腊腹弩2）
    THRACIAN: THRACIAN_TIERS,  // [2026-09-06 铁律「一文化=一军团=一编制」] 原借用SLAVIC_TIERS，已改独立编成
    PERSIAN:      PERSIAN_TIERS,  // ⚠️ [2026-08-27] 暂复用西亚编成（铁甲圣骑兵=波斯/萨珊招牌），待定制
    PERSIAN_CASTLE: PERSIAN_TIERS,
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
    IROQUOIS: IROQUOIS_TIERS,
    CHIMU: CHIMU_TIERS,
    TARASCAN: TARASCAN_TIERS,
    TAIRONA: TAIRONA_TIERS,
    TEHUELCHE: TEHUELCHE_TIERS,
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
    YARLUNG: QIANG_TIERS,
    NABATAEANS: NABATAEANS_TIERS,
    HEPHTHALITES: HEPHTHALITES_TIERS,
    AINU: AINU_TIERS,
    SWISS: SWISS_TIERS,
    PASHTUN: PASHTUN_TIERS,
    SWEDISH: SWEDISH_TIERS,
    MACEDONIAN: MACEDONIAN_TIERS,
    HELLENIC: HELLENIC_TIERS,
    IMPERIAL_ROME: IMPERIAL_ROME_TIERS,
    GREEK_MERCENARY: GREEK_MERCENARY_TIERS,
    MAGNA_GRAECIA: MAGNA_GRAECIA_TIERS,
    ACHAEMENIDS: ACHAEMENIDS_TIERS,
    AMAZONS: AMAZONS_TIERS,
    SONG: SONG_TIERS,
    GORYEO: GORYEO_TIERS,
    JOSEON: JOSEON_TIERS,
    GOJOSEON: GOJOSEON_TIERS,
    MING: MING_TIERS,
    HUAXIA_IMPERIAL: MING_TIERS,
    DALI: DALI_TIERS,
    GUSILUO: GUSILUO_TIERS,
    MAMLUKS: MAMLUKS_TIERS,
    CRUSADERS: CRUSADERS_TIERS,
    RUS: RUS_TIERS,
    KARA_KHITAN: KARA_KHITAN_TIERS,
    TIMURID: TIMURID_TIERS,
    DELHI: DELHI_TIERS,
    CASTILE: CASTILE_TIERS,
    SCOTLAND: SCOTLAND_TIERS,
    HRE: HRE_TIERS,
    ALMOHAD: ALMOHAD_TIERS,
    SERBIA: SERBIA_TIERS,
    ILKHANATE: ILKHANATE_TIERS,
    ARAGON: ARAGON_TIERS,
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
