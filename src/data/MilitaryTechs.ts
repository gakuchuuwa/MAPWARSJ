/**
 * 【军事科技】按史实年份自动生效的兵种属性加成（2026-08-18 主人定）
 *
 * 作用范围：**只影响 13 战斗模式的兵种五维**（`Scene13WarLayer` 的 `WAR_TYPES`），
 * 不动大地图八环——八环的 `sideBasePower` 只吃「兵力 × 文化系数」，根本不读兵种属性。
 *
 * ── 数据来源（效果与作用类别是 DE 实测值，别手改）────────────────────────────
 * `empires2_x2_p1.dat` → `scratch/extract_de_techs.py` → `scratch/de_techs.json`
 * 🔴 DE 里攻击/护甲是**打包编码**：d = 装甲类 × 256 + 数值。
 *    1025 = 4×256+1 = 近战类 +1；769 = 3×256+1 = 穿刺类 +1；1026 = 近战 +2（鼓风炉）。
 *    不解码会把「+1 近攻」读成「+1025 攻击」，照抄进游戏当场爆表。下表已解码。
 *
 * ── 作用面按 DE 组织分类（unit class），不是 armorTags ───────────────────────
 * 🔴 `armorTags` 是**受击分类**（"什么加成伤害能打到我"）。弓骑带 [28,15,8,…] 是为了让
 *    反骑 + 反弓都能命中它；拿它当组织键，弓骑会同时吃马铠和射手甲，双份。
 * 每个兵种的 class 见 `scratch/unit_class_by_stats.json`（由数值指纹反查 DE 原型得到，
 * 编制上场的 129 个兵种已 100% 定类）。
 *
 * 🔴 **两套编号别混（网上搜到的几乎全是另一套）**：
 *   · `unit class`（本表用的，科技「作用面」按它判）：步兵 6、骑兵 12、战象归 12、弓骑 36
 *   · `armor class`（`WAR_TYPES.armorTags` / 加成伤害用的）：步兵 1、骑兵 8、战象 5
 *   Liquipedia 等社区资料列的是后者。**`unit class` 在网上搜不到，只能从 .dat 反查**
 *   （`scratch/extract_de_techs.py`）。拿 Liquipedia 的号码来「纠正」本表是牛头不对马嘴。
 *
 * 编号含义**全部由 dat 反查坐实**（2026-08-18，别抄网上流传的旧表）：
 *   0  弓箭手
 *   6  步兵
 *   12 骑兵 —— 🔴 **战象、战车也是 12**，class 分不开它们（人口表因此要按 DE 原型名点名）
 *   13 攻城器械
 *   23 **骑乘远程／火器骑兵**（CONQI 征服者、ARAMBAI 飞镖骑兵、HGPIZ…）
 *      ⚠️ 我一度把 23 标成「散兵／掷矛」，错的；散兵是 class 0 一族。
 *   36 弓骑（探针：帕提亚战术 = DE 弓骑专属科技，只作用于 36）
 *   44 火枪／火药步兵（HCANR 火枪兵、JANNI 苏丹亲兵、GRNADR 掷弹兵）
 *   47 **斥候 SCOUT**，全表仅 1 个单位 —— 🔴 **不是战象**，别拿 47 认象
 *   52 **塔楼建筑**（WCTW 望楼一族）→ 远程线里那个 52 对我们是空转，我们没有塔类兵种
 *   55 弩炮／战车（SCBAL 蝎弩、HUSSITEWAGON 胡斯战车）
 *   45 / 46 / 50 —— dat 里**没有任何单位**属于这三类，近战线带着它们纯属 DE 冗余，对我们空转
 *
 * ── 年份是设计草案，不是 DE 数据 ────────────────────────────────────────────
 * DE 是时代制（封建/城堡/帝国），没有年份。下表年份按史实拟定，主人可改。
 * 时间线 -334（亚历山大东征）→ 1912，故上古就有的科技标 `OPENING`（开局自带）。
 */

import { REGION_ORDER, type RegionType } from '../systems/RegionSystem';
import type { BuildingStyle } from './cities_v2';

/** 军事科技文化键：66 种建筑文化（62 DE 文明 + 4 三级文化）或旧大区兼容键 */
export type TechCulture = BuildingStyle | RegionType;

/** 效果作用的属性 */
export type TechAttr =
    | 'meleeAttack'    // 近战攻击（DE attack/装甲类4）→ WAR_TYPES.atk（dmgType='melee' 的兵）
    | 'pierceAttack'   // 穿刺攻击（DE attack/装甲类3）→ WAR_TYPES.atk（dmgType='pierce' 的兵）
    | 'meleeArmor'     // 近战护甲（DE armor/4）→ WAR_TYPES.meleeArmor
    | 'pierceArmor'    // 穿刺护甲（DE armor/3）→ WAR_TYPES.pierceArmor
    | 'hp'
    | 'speed'
    | 'reload'
    | 'range'          // DE 以「格」计，落到 WAR_TYPES.rng 要 ×40 像素
    | 'los'            // 视野，落到 SIGHT_MAP 要 ×40 像素
    | 'bonus';         // 加成伤害（DE attacks 非 3/4 类）→ WAR_TYPES.bonus；bonusClass 指定目标护甲类

export interface TechEffect {
    attr: TechAttr;
    /** 'add' = 加减（range/los 单位为格）；'mul' = 乘 */
    op: 'add' | 'mul';
    value: number;
    /** 作用的 DE unit class 列表 */
    classes: readonly number[];
    /** attr='bonus' 时：加成的目标护甲类（armor class，如 27=长枪 11=建筑 26=城堡） */
    bonusClass?: number;
}

/** 四时代（与四时代文化体系同一把尺）：古典 ≤476 / 封建 476–1050 / 城堡 1050–1500 / 帝国 1500–1914 */
export type TechEra = 'antiquity' | 'feudal' | 'castle' | 'imperial';

export interface MilitaryTech {
    id: string;
    /** 中文名（播报用） */
    name: string;
    /** DE 原名，便于回溯 */
    de: string;
    /** 生效年份；null = 开局自带（早于时间线起点 -334） */
    year: number | null;
    /** 所属四时代（由 year 归位；null/上古 → 古典） */
    era: TechEra;
    /**
     * 史实依据 = **给 `year` 找的断代锚点**（这条技术什么时候算成立），
     * 🔴 **不是 `cultures` 的适用范围依据** —— 两者不对应是常态，别拿 basis 去"纠正" cultures：
     *   · 锁子甲 basis 写凯尔特／罗马，cultures 却含 NORTH/HEXI（发明者 ≠ 普及范围）
     *   · 骑兵鳞甲 basis 写帕提亚成型，cultures 却是 MOUNTED_CULTURES（除美洲外全区）
     *   · 帕提亚战术 basis 写卡莱战役（帕提亚），cultures 反而**不含** WEST_ASIA
     *     —— 给的是骑射传统文化，不是给帕提亚的地理继承者
     *   · 血统 basis 写汉武帝得大宛马，cultures 给 HEXI 不给 CENTRAL —— 汉代马政基地在
     *     河西陇右官牧，且中原自汉以降长期缺马（唐靠陇右牧监、宋保马法失败）。这是**对的**，
     *     2026-08-19 有 AI 据 basis 提议补 CENTRAL/NORTH，已按史实与平衡（中原已 13 条、
     *     草原仅 11 条，血统是草原系少数差异化项）否决。
     */
    basis: string;
    effects: readonly TechEffect[];
    /**
     * 可获得该科技的文化（66 建筑文化）；null = 全部文化。
     * 🔴 **全区同享的科技对胜负是空转的**（所有势力同时变强，相对强弱不变，只改战斗时长）。
     *    科技系统的价值全在这一列的差异化上——素材是 DE 自己的文明科技树。
     */
    cultures: readonly TechCulture[] | null;
}

/** 欧亚锁甲分布带 */
const CHAINMAIL_BELT: readonly RegionType[] = [
    // [2026-08-19] 原含 'GREEK'，已并入 LATIN（本表已有 LATIN，覆盖不变）
    'LATIN', 'GERMANIC', 'SLAVIC', 'WEST_ASIA', 'CENTRAL_ASIA', 'NORTH', 'HEXI',
    'INDIA', 'BERBER',
];
/**
 * 有马文化 = 除美洲外的全部区。
 *
 * 🔴 依据 DE 本体科技树（`resources/_common/dat/CivTechTrees/`）：
 *    AZTECS / INCAS / MAYANS 三个美洲文明**没有马厩**，
 *    Scale/Chain/Plate Barding Armor、Husbandry、Bloodlines 全部 NotAvailable。
 *    前哥伦布美洲无马（马是西班牙人带去的），DE 与史实在这点上一致。
 *    凡「作用于骑兵(class 12/23/36/47)」的科技都要用本表而不是 null，
 *    否则美洲会拿到马铠与畜牧 —— 那里根本没有马。
 * 其余马铠科技（锁子/板甲马铠）走 CHAINMAIL_BELT 与显式列表，本就不含 AMERICA。
 */
const MOUNTED_CULTURES: readonly RegionType[] = REGION_ORDER.filter((r) => r !== 'AMERICA');

/** 骑射文化（草原／伊朗系）+ 中原扳指传统 */
const HORSE_ARCHER_CULTURES: readonly RegionType[] = [
    // [2026-08-19] 原含 'NUERGAN'，已并入 NORTHEAST（本表已有 NORTHEAST，覆盖不变）
    'STEPPE', 'CENTRAL_ASIA', 'WESTERN', 'NORTHEAST', 'TIBET',
];

export const MILITARY_TECHS: readonly MilitaryTech[] = [
    // ── 近战攻击线（冶金）：步兵6 / 骑兵12（含象、车）────────────────────────
    {
        id: 'forging', name: '锻造', de: 'Forging', year: null,
        era: 'antiquity',
        basis: '铁兵器普及早于时间线起点（-334 已是铁器时代）',
        effects: [{ attr: 'meleeAttack', op: 'add', value: 1, classes: [6, 12, 47] }],   // 🔴 [2026-10-13 对账清空类] 删 45/46/50（DE 全表 0 单位）；47=斥候（DE 确有）
        cultures: null,
    },
    {
        id: 'iron_casting', name: '铸铁', de: 'Iron casting', year: -100,
        era: 'antiquity',
        basis: '汉代炒钢／百炼钢工艺成熟',
        effects: [{ attr: 'meleeAttack', op: 'add', value: 1, classes: [6, 12, 47] }],   // 🔴 [2026-10-13 对账清空类] 删 45/46/50（DE 全表 0 单位）；47=斥候（DE 确有）
        cultures: ['SLAVIC', 'GERMANIC', 'LATIN', 'CENTRAL', 'NORTH', 'JIANGNAN', 'HEXI', 'WESTERN', 'TIBET', 'STEPPE', 'NORTHEAST', 'KOREA', 'JAPAN', 'CENTRAL_ASIA', 'WEST_ASIA', 'INDIA', 'BERBER', 'AMERICA', 'AFRICA', 'MALAY', 'ANDE', 'PURU', 'ORIE', 'EAST', 'GREEK', 'PERSIAN', ],
    },
    {
        id: 'blast_furnace', name: '鼓风炉', de: 'Blast Furnace', year: 31,
        era: 'antiquity',
        basis: '东汉杜诗造水排（水力鼓风冶铁）；欧洲高炉迟至 12 世纪',
        effects: [{ attr: 'meleeAttack', op: 'add', value: 2, classes: [6, 12, 47] }],   // 🔴 [2026-10-13 对账清空类] 同锻造线：删 45/46/50（DE 空类）
        cultures: ['SLAVIC', 'GERMANIC', 'LATIN', 'CENTRAL', 'JIANGNAN', 'HEXI', 'WESTERN', 'TIBET', 'STEPPE', 'NORTHEAST', 'JAPAN', 'CENTRAL_ASIA', 'INDIA', 'BERBER', 'AMERICA', 'MALAY', 'ANDE', 'PURU', 'ORIE', 'EAST', 'PERSIAN', ],
    },

    // ── 步兵护甲线：只作用于步兵6 ──────────────────────────────────────────
    {
        id: 'scale_mail', name: '步兵鳞甲', de: 'Scale Mail Armor', year: null,
        era: 'antiquity',
        basis: '鳞甲远早于时间线起点',
        effects: [
            { attr: 'meleeArmor', op: 'add', value: 1, classes: [6] },   // 🔴 [2026-10-13 治本] 枪兵族按权威表已归 **6**（`UnitClasses.ts`），46 是 DE 空类 ⇒ 删除
            { attr: 'pierceArmor', op: 'add', value: 1, classes: [6] },
        ],
        cultures: null,
    },
    {
        id: 'chain_mail', name: '步兵锁甲', de: 'Chain Mail Armor', year: -100,
        era: 'antiquity',
        basis: '凯尔特人前 3 世纪发明，罗马前 1 世纪普遍装备',
        effects: [
            { attr: 'meleeArmor', op: 'add', value: 1, classes: [6] },   // 🔴 [2026-10-13 治本] 枪兵族按权威表已归 **6**（`UnitClasses.ts`），46 是 DE 空类 ⇒ 删除
            { attr: 'pierceArmor', op: 'add', value: 1, classes: [6] },
        ],
        cultures: ['SLAVIC', 'GERMANIC', 'LATIN', 'CENTRAL', 'NORTH', 'JIANGNAN', 'HEXI', 'WESTERN', 'TIBET', 'NORTHEAST', 'KOREA', 'JAPAN', 'CENTRAL_ASIA', 'WEST_ASIA', 'INDIA', 'BERBER', 'AMERICA', 'AFRICA', 'MALAY', 'ANDE', 'PURU', 'ORIE', 'EAST', 'GREEK', 'PERSIAN', ],
    },
    {
        id: 'plate_mail', name: '步兵钢甲', de: 'Plate Mail Armor', year: 1400,
        era: 'castle',
        basis: '欧洲全身板甲成熟期；板甲是西欧独有工艺',
        effects: [
            { attr: 'meleeArmor', op: 'add', value: 1, classes: [6] },   // 🔴 [2026-10-13 治本] 枪兵族按权威表已归 **6**（`UnitClasses.ts`），46 是 DE 空类 ⇒ 删除
            { attr: 'pierceArmor', op: 'add', value: 2, classes: [6] },
        ],
        cultures: ['SLAVIC', 'GERMANIC', 'NORTH', 'JIANGNAN', 'HEXI', 'WESTERN', 'TIBET', 'KOREA', 'JAPAN', 'CENTRAL_ASIA', 'WEST_ASIA', 'BERBER', 'AMERICA', 'AFRICA', 'MALAY', 'ANDE', 'PURU', 'ORIE', 'EAST', 'GREEK', 'PERSIAN', ],
    },

    // ── 骑兵马铠线：骑兵12（含象、车）；🔴 不含弓骑36 ───────────────────────
    {
        id: 'scale_barding', name: '骑兵鳞甲', de: 'Scale Barding Armor', year: -50,
        era: 'antiquity',
        basis: '帕提亚／萨珊具装甲骑（cataphract）成型',
        effects: [
            { attr: 'meleeArmor', op: 'add', value: 1, classes: [12, 47] },
            { attr: 'pierceArmor', op: 'add', value: 1, classes: [12, 47] },
        ],
        cultures: ['SLAVIC', 'GERMANIC', 'LATIN', 'CENTRAL', 'NORTH', 'JIANGNAN', 'HEXI', 'WESTERN', 'TIBET', 'STEPPE', 'NORTHEAST', 'KOREA', 'JAPAN', 'CENTRAL_ASIA', 'WEST_ASIA', 'INDIA', 'BERBER', 'AFRICA', 'MALAY', 'PURU', 'ORIE', 'EAST', 'GREEK', 'PERSIAN', ],
    },
    {
        id: 'chain_barding', name: '骑兵锁甲', de: 'Chain Barding Armor', year: 1100,
        era: 'castle',
        basis: '中世纪盛期骑士马铠',
        effects: [
            { attr: 'meleeArmor', op: 'add', value: 1, classes: [12, 47] },
            { attr: 'pierceArmor', op: 'add', value: 1, classes: [12, 47] },
        ],
        cultures: ['SLAVIC', 'GERMANIC', 'LATIN', 'CENTRAL', 'NORTH', 'JIANGNAN', 'HEXI', 'WESTERN', 'TIBET', 'STEPPE', 'NORTHEAST', 'KOREA', 'JAPAN', 'CENTRAL_ASIA', 'WEST_ASIA', 'INDIA', 'BERBER', 'AFRICA', 'PURU', 'ORIE', 'EAST', 'GREEK', 'PERSIAN', ],
    },
    {
        id: 'plate_barding', name: '骑兵钢甲', de: 'Plate Barding Armor', year: 1450,
        era: 'castle',
        basis: '全身板甲马铠，西欧独有',
        effects: [
            { attr: 'meleeArmor', op: 'add', value: 1, classes: [12, 47] },
            { attr: 'pierceArmor', op: 'add', value: 2, classes: [12, 47] },
        ],
        cultures: ['SLAVIC', 'GERMANIC', 'LATIN', 'NORTH', 'JIANGNAN', 'HEXI', 'WESTERN', 'STEPPE', 'NORTHEAST', 'CENTRAL_ASIA', 'WEST_ASIA', 'INDIA', 'BERBER', 'AFRICA', 'ORIE', 'EAST', 'GREEK', 'PERSIAN', ],
    },

    // ── 远程攻击线：弓箭手0 / 弓骑36 ───────────────────────────────────────
    {
        id: 'fletching', name: '箭羽', de: 'Fletching', year: null,
        era: 'antiquity',
        basis: '基础箭羽工艺',
        effects: [
            { attr: 'pierceAttack', op: 'add', value: 1, classes: [0, 36, 52] },
            { attr: 'range', op: 'add', value: 1, classes: [0, 36, 52] },
            { attr: 'los', op: 'add', value: 1, classes: [0, 36, 52] },
        ],
        cultures: null,
    },
    {
        id: 'bodkin', name: '锥子箭', de: 'Bodkin Arrow', year: 1200,
        era: 'castle',
        basis: '破甲锥头箭（bodkin point）应对锁甲普及',
        effects: [
            { attr: 'pierceAttack', op: 'add', value: 1, classes: [0, 36, 52] },
            { attr: 'range', op: 'add', value: 1, classes: [0, 36, 52] },
            { attr: 'los', op: 'add', value: 1, classes: [0, 36, 52] },
        ],
        cultures: null,
    },
    {
        id: 'bracer', name: '护腕', de: 'Bracer', year: 1400,
        era: 'castle',
        basis: '复合护具与拉距改良',
        effects: [
            { attr: 'pierceAttack', op: 'add', value: 1, classes: [0, 36, 52] },
            { attr: 'range', op: 'add', value: 1, classes: [0, 36, 52] },
            { attr: 'los', op: 'add', value: 1, classes: [0, 36, 52] },
        ],
        cultures: ['CENTRAL', 'NORTH', 'JIANGNAN', 'HEXI', 'TIBET', 'STEPPE', 'NORTHEAST', 'KOREA', 'JAPAN', 'CENTRAL_ASIA', 'WEST_ASIA', 'INDIA', 'BERBER', 'AMERICA', 'MALAY', 'ANDE', 'PURU', 'ORIE', 'GREEK', ],
    },

    // ── 射手护甲线：弓箭手0 / 散兵23 / 🔴 弓骑36 / 火枪44 ──────────────────
    {
        id: 'padded_archer', name: '射手软甲', de: 'Padded Archer Armor', year: null,
        era: 'antiquity',
        basis: '织物／皮质轻甲',
        effects: [
            { attr: 'meleeArmor', op: 'add', value: 1, classes: [0, 23, 36, 44] },
            { attr: 'pierceArmor', op: 'add', value: 1, classes: [0, 23, 36, 44] },
        ],
        cultures: null,
    },
    {
        id: 'leather_archer', name: '射手皮甲', de: 'Leather Archer Armor', year: 800,
        era: 'feudal',
        basis: '硬化皮甲工艺',
        effects: [
            { attr: 'meleeArmor', op: 'add', value: 1, classes: [0, 23, 36, 44] },
            { attr: 'pierceArmor', op: 'add', value: 1, classes: [0, 23, 36, 44] },
        ],
        cultures: ['SLAVIC', 'GERMANIC', 'LATIN', 'CENTRAL', 'NORTH', 'JIANGNAN', 'HEXI', 'WESTERN', 'TIBET', 'STEPPE', 'NORTHEAST', 'KOREA', 'JAPAN', 'CENTRAL_ASIA', 'WEST_ASIA', 'INDIA', 'BERBER', 'AMERICA', 'AFRICA', 'MALAY', 'ANDE', 'PURU', 'ORIE', 'EAST', 'GREEK', 'PERSIAN', ],
    },
    {
        id: 'ring_archer', name: '射手锁甲', de: 'Ring Archer Armor', year: 1300,
        era: 'castle',
        basis: '环片复合甲',
        effects: [
            { attr: 'meleeArmor', op: 'add', value: 1, classes: [0, 23, 36, 44] },
            { attr: 'pierceArmor', op: 'add', value: 2, classes: [0, 23, 36, 44] },
        ],
        cultures: ['SLAVIC', 'LATIN', 'CENTRAL', 'NORTH', 'HEXI', 'WESTERN', 'STEPPE', 'NORTHEAST', 'KOREA', 'JAPAN', 'CENTRAL_ASIA', 'WEST_ASIA', 'INDIA', 'BERBER', 'AFRICA', 'MALAY', 'ANDE', 'PURU', 'ORIE', 'EAST', 'GREEK', 'PERSIAN', ],
    },

    // ── 附加四条 ──────────────────────────────────────────────────────────
    {
        id: 'husbandry', name: '畜牧', de: 'Husbandry', year: -300,
        era: 'antiquity',
        basis: '战马驯养与官牧良马自古典时代成熟，骑兵机动力提升',
        effects: [{ attr: 'speed', op: 'mul', value: 1.1, classes: [12, 23, 36, 47] }],
        cultures: ['SLAVIC', 'GERMANIC', 'LATIN', 'CENTRAL', 'NORTH', 'JIANGNAN', 'HEXI', 'WESTERN', 'TIBET', 'STEPPE', 'NORTHEAST', 'KOREA', 'JAPAN', 'CENTRAL_ASIA', 'WEST_ASIA', 'INDIA', 'BERBER', 'AFRICA', 'MALAY', 'PURU', 'ORIE', 'EAST', 'GREEK', 'PERSIAN', ],
    },
    {
        id: 'bloodlines', name: '血统', de: 'Bloodlines', year: -101,
        era: 'antiquity',
        basis: '汉武帝得大宛汗血马，良种马育种',
        effects: [{ attr: 'hp', op: 'add', value: 20, classes: [12, 23, 36, 47] }],
        cultures: ['SLAVIC', 'LATIN', 'CENTRAL', 'JIANGNAN', 'HEXI', 'WESTERN', 'TIBET', 'STEPPE', 'NORTHEAST', 'JAPAN', 'CENTRAL_ASIA', 'INDIA', 'BERBER', 'AFRICA', 'ORIE', 'EAST', 'PERSIAN', ],
    },
    {
        id: 'thumb_ring', name: '扳指', de: 'Thumb Ring', year: 1206,
        era: 'castle',
        basis: '蒙古式拇指扣弦＋扳指，骑射速率跃升',
        // DE 还含 accuracy+100%，我们的五维没有命中率字段，故只落装填
        effects: [{ attr: 'reload', op: 'mul', value: 0.85, classes: [0, 36] }],
        cultures: ['CENTRAL', 'NORTH', 'HEXI', 'WESTERN', 'TIBET', 'STEPPE', 'KOREA', 'JAPAN', 'CENTRAL_ASIA', 'WEST_ASIA', 'INDIA', 'BERBER', 'AFRICA', 'MALAY', 'ANDE', 'PURU', 'ORIE', 'GREEK', 'PERSIAN', ],
    },
    {
        id: 'parthian_tactics', name: '帕提亚战术', de: 'Parthian Tactics', year: -53,
        era: 'antiquity',
        basis: '卡莱战役，帕提亚回马射战术定名',
        effects: [
            { attr: 'meleeArmor', op: 'add', value: 1, classes: [36] },
            { attr: 'pierceArmor', op: 'add', value: 2, classes: [36] },
            { attr: 'bonus', op: 'add', value: 2, classes: [36], bonusClass: 27 },
        ],
        cultures: ['CENTRAL', 'NORTH', 'WESTERN', 'TIBET', 'STEPPE', 'JAPAN', 'CENTRAL_ASIA', 'ORIE', 'PERSIAN', ],
    },

    // ── 步兵软甲／行军（兵营）─────────────────────────────────────────
    {
        id: 'gambesons', name: '软甲', de: 'Gambesons', year: 800,
        era: 'feudal',
        basis: '步兵软垫护甲（gambeson）工艺成熟',
        // DE 效果 = 步兵线 +1 穿刺护甲；🔴 印度/柏柏尔（DE 印度斯坦/柏柏尔）禁用
        effects: [{ attr: 'pierceArmor', op: 'add', value: 1, classes: [6] }],
        cultures: ['SLAVIC', 'GERMANIC', 'NORTH', 'WESTERN', 'NORTHEAST', 'KOREA', 'JAPAN', 'WEST_ASIA', 'AMERICA', 'PURU', 'ORIE', 'EAST', 'GREEK', 'PERSIAN', ],
    },
    {
        id: 'squires', name: '护卫', de: 'Squires', year: -200,
        era: 'antiquity',
        basis: '古典军制步兵行军与耐力队列训练',
        effects: [{ attr: 'speed', op: 'mul', value: 1.1, classes: [6] }],   // 🔴 [2026-10-13 治本] 同上：枪兵已归 6，删 DE 空类 46
        cultures: ['SLAVIC', 'GERMANIC', 'LATIN', 'CENTRAL', 'NORTH', 'JIANGNAN', 'HEXI', 'WESTERN', 'TIBET', 'STEPPE', 'NORTHEAST', 'KOREA', 'JAPAN', 'CENTRAL_ASIA', 'WEST_ASIA', 'INDIA', 'BERBER', 'AMERICA', 'AFRICA', 'MALAY', 'ANDE', 'PURU', 'ORIE', 'EAST', 'GREEK', 'PERSIAN', ],
    },
    {
        id: 'tracking', name: '追踪', de: 'Tracking', year: null,
        era: 'antiquity',
        basis: '循迹侦察自古有之（步兵 +2 视野）',
        effects: [{ attr: 'los', op: 'add', value: 2, classes: [6] }],
        cultures: null,
    },
    {
        id: 'arson', name: '纵火', de: 'Arson', year: null,
        era: 'antiquity',
        basis: '火攻自古有之（步兵对标准建筑 +2）',
        effects: [{ attr: 'bonus', op: 'add', value: 2, classes: [6], bonusClass: 21 }],
        cultures: null,
    },
    // ── 化学（大学）：远程 +1 穿刺攻击 ────────────────────────────────
    {
        id: 'chemistry', name: '化学', de: 'Chemistry', year: 1100,
        era: 'castle',
        basis: '火药兵器（硝石提纯）成熟，远程投射物威力跃升',
        // DE 效果 = 弓箭手/弓骑 +1 穿刺攻击
        // 🔴 [2026-10-13 对账修·作用面] 原写 classes:[0,36,44] —— DE 原始表（tech 47，86 个 mod）实测：
        //    类级只有 class 0 / 36 / 52，其余是逐个 unit 点名；**u5(HCANR 火枪) 那一项是 768 = 装甲类3 +0**，
        //    即 DE 的 Chemistry **不给火枪加穿刺**。⇒ 删掉 44，火枪 5 个兵种不再白得 +1 穿刺。
        effects: [{ attr: 'pierceAttack', op: 'add', value: 1, classes: [0, 36] }],
        cultures: ['SLAVIC', 'GERMANIC', 'LATIN', 'CENTRAL', 'NORTH', 'JIANGNAN', 'HEXI', 'WESTERN', 'TIBET', 'STEPPE', 'NORTHEAST', 'KOREA', 'JAPAN', 'CENTRAL_ASIA', 'WEST_ASIA', 'INDIA', 'BERBER', 'AMERICA', 'AFRICA', 'MALAY', 'ANDE', 'PURU', 'ORIE', 'EAST', 'GREEK', 'PERSIAN', ],
    },

    // ── 攻城技师（大学）：攻城器械/弩炮 +1 射程 ────────────────────────
    {
        id: 'siege_engineers', name: '攻城技师', de: 'Siege Engineers', year: 1300,
        era: 'castle',
        basis: '中世纪攻城技术（配重投石机/攻城器械改良）',
        effects: [
            { attr: 'range', op: 'add', value: 1, classes: [13, 55] },
            { attr: 'bonus', op: 'mul', value: 1.2, classes: [13, 55], bonusClass: 11 },
        ],
        cultures: ['SLAVIC', 'GERMANIC', 'LATIN', 'NORTH', 'TIBET', 'STEPPE', 'NORTHEAST', 'KOREA', 'JAPAN', 'INDIA', 'BERBER', 'AMERICA', 'MALAY', 'ANDE', 'ORIE', 'EAST', ],
    },

    // ── 文化专属特殊科技（66 建筑文化 100% 映射 DE Unique Tech，优先必选）────────
    {
        id: 'sagaris', name: '波斯战斧', de: 'Sagaris', year: -500,
        era: 'antiquity',
        basis: '阿契美尼德骑兵战斧（DE tech 1261），对有机单位加成',
        effects: [{ attr: 'bonus', op: 'add', value: 2, classes: [12], bonusClass: 31 }],
        cultures: ['PERSIAN'],
    },
    {
        id: 'sparabaras', name: '盾牌兵', de: 'Sparabaras', year: -500,
        era: 'antiquity',
        basis: '阿契美尼德重装盾矛步兵（DE tech 1262），步兵双甲强化',
        effects: [
            { attr: 'meleeArmor', op: 'add', value: 2, classes: [6] },
            { attr: 'pierceArmor', op: 'add', value: 1, classes: [6] },
        ],
        cultures: ['PERSIAN'],
    },
    {
        id: 'reed_arrows', name: '芦苇箭', de: 'Reed Arrows', year: -500,
        era: 'antiquity',
        basis: '阿契美尼德芦苇杆箭（DE tech 1264），弓手装填提速',
        effects: [{ attr: 'reload', op: 'mul', value: 0.8, classes: [0] }],
        cultures: ['PERSIAN'],
    },
    {
        id: 'skeuophoroi', name: '盾牌扈从', de: 'Skeuophoroi', year: -400,
        era: 'antiquity',
        basis: '斯巴达重装步兵扈从（DE tech 1225），步兵近攻强化',
        effects: [{ attr: 'meleeAttack', op: 'add', value: 2, classes: [6] }],
        cultures: ['SPARTANS'],
    },
    {
        id: 'hippagretai', name: '王伴骑兵', de: 'Hippagretai', year: -400,
        era: 'antiquity',
        basis: '斯巴达王伴精锐（DE tech 1226），步兵血量强化',
        effects: [{ attr: 'hp', op: 'add', value: 50, classes: [6] }],
        cultures: ['SPARTANS'],
    },
    {
        id: 'taxiarchs', name: '联队长', de: 'Taxiarchs', year: -450,
        era: 'antiquity',
        basis: '雅典十将军与各部联队长指挥（DE tech 1120），步兵近战攻击与视野提升',
        effects: [
            { attr: 'meleeAttack', op: 'add', value: 1, classes: [6] },
            { attr: 'los', op: 'add', value: 1, classes: [6] },
        ],
        cultures: ['ATHENIANS', 'GREECE'],
    },
    {
        id: 'pezhetairoi', name: '马其顿方阵步兵', de: 'Pezhetairoi', year: -350,
        era: 'antiquity',
        basis: '马其顿步兵伙伴方阵（DE tech 1286），步兵近战护甲 +2',
        effects: [{ attr: 'meleeArmor', op: 'add', value: 2, classes: [6] }],
        cultures: ['MACEDONIAN'],
    },
    {
        id: 'sarissophoroi', name: '萨里沙骑兵', de: 'Sarissophoroi', year: -340,
        era: 'antiquity',
        basis: '马其顿萨里沙长矛突击骑兵（DE tech 1287），骑兵近战攻击 +2',
        effects: [{ attr: 'meleeAttack', op: 'add', value: 2, classes: [12, 47] }],
        cultures: ['MACEDONIAN'],
    },
    {
        id: 'bessian_metalworking', name: '贝锡安金属利用', de: 'Bessian Metalworking', year: -400,
        era: 'antiquity',
        basis: '色雷斯贝锡部落冶金与破甲刃器（DE tech 1298），步骑近战攻击 +2',
        effects: [{ attr: 'meleeAttack', op: 'add', value: 2, classes: [6, 12, 47] }],
        cultures: ['THRACIAN'],
    },
    {
        id: 'peltasts', name: '轻装盾兵', de: 'Peltasts', year: -400,
        era: 'antiquity',
        basis: '色雷斯新月轻盾散兵战术（DE tech 1299），远程单位射程与穿刺攻击 +1',
        effects: [
            { attr: 'pierceAttack', op: 'add', value: 1, classes: [0, 36] },
            { attr: 'range', op: 'add', value: 1, classes: [0, 36] },
        ],
        cultures: ['THRACIAN'],
    },
    {
        id: 'battle_drills', name: '战斗操练', de: 'Battle Drills', year: -350,
        era: 'antiquity',
        basis: '古希腊/斯巴达/马其顿/色雷斯重装步兵方阵操练（DE tech 1173）',
        effects: [
            { attr: 'meleeAttack', op: 'add', value: 3, classes: [6] },
            { attr: 'bonus', op: 'add', value: 1, classes: [6], bonusClass: 21 },
            { attr: 'bonus', op: 'add', value: 2, classes: [6], bonusClass: 29 },
            { attr: 'los', op: 'add', value: 1, classes: [6] },
        ],
        cultures: ['SPARTANS', 'GREECE', 'MACEDONIAN', 'THRACIAN'],
    },
    {
        id: 'vadhavadha', name: '践踏屠戮', de: 'Vadhavadha', year: -326,
        era: 'antiquity',
        basis: '普鲁王波鲁斯战象冲锋践踏（DE tech 1307），战象与骑兵近战攻击 +2',
        effects: [{ attr: 'meleeAttack', op: 'add', value: 2, classes: [12] }],
        cultures: ['PURU', 'TIBET'],
    },
    {
        id: 'leaf_headed_shafts', name: '叶头箭杆', de: 'Leaf-Headed Shafts', year: -326,
        era: 'antiquity',
        basis: '古印度竹制大弓与宽叶铁簇箭杆（DE tech 1308），弓兵穿刺攻击 +2',
        effects: [{ attr: 'pierceAttack', op: 'add', value: 2, classes: [0, 36] }],
        cultures: ['PURU', 'TIBET'],
    },
    {
        id: 'ballistas', name: '罗马弩炮', de: 'Ballistas', year: -100,
        era: 'antiquity',
        basis: '罗马军团扭力弩炮（DE tech 883），弩炮装填与穿刺强化',
        effects: [
            { attr: 'reload', op: 'mul', value: 0.75, classes: [55] },
            { attr: 'pierceAttack', op: 'add', value: 2, classes: [55] },
        ],
        cultures: ['ROMA'],
    },
    {
        id: 'comitatenses', name: '野战军', de: 'Comitatenses', year: 300,
        era: 'antiquity',
        basis: '罗马帝国晚期机动野战军团（DE tech 884），步兵与骑兵近战攻击 +1、装填提速',
        effects: [
            { attr: 'meleeAttack', op: 'add', value: 1, classes: [6, 12] },
            { attr: 'reload', op: 'mul', value: 0.85, classes: [6, 12] },
        ],
        cultures: ['ROMA'],
    },
    {
        id: 'ming_kuang_armor', name: '明光铠', de: 'Ming-Kuang Armor', year: 220,
        era: 'antiquity',
        basis: '曹魏至北朝明光铠（DE tech 1059），具装骑兵近防强化',
        effects: [{ attr: 'meleeArmor', op: 'add', value: 4, classes: [47, 12, 36, 23] }],
        cultures: ['WEI'],
    },
    {
        id: 'tuntian_soldiers', name: '屯田兵', de: 'Tuntian', year: 196,
        era: 'antiquity',
        basis: '曹魏军屯制兵农合一（DE tech 1060），步兵生命值 +20、近战护甲 +1',
        effects: [
            { attr: 'hp', op: 'add', value: 20, classes: [6] },
            { attr: 'meleeArmor', op: 'add', value: 1, classes: [6] },
        ],
        cultures: ['WEI'],
    },
    {
        id: 'coiled_serpent_array', name: '盘蛇阵', de: 'Coiled Serpent Array', year: 225,
        era: 'antiquity',
        basis: '蜀汉诸葛亮八阵与长枪步兵盘蛇阵（DE tech 1070），步兵生命值 +30',
        effects: [{ attr: 'hp', op: 'add', value: 30, classes: [6] }],
        cultures: ['BASHU'],
    },
    {
        id: 'bolt_magazine', name: '弩箭匣', de: 'Bolt Magazine', year: 230,
        era: 'antiquity',
        basis: '蜀汉元戎连弩箭匣（DE tech 1069），弓弩手与弩炮装填提速',
        effects: [{ attr: 'reload', op: 'mul', value: 0.85, classes: [0, 55] }],
        cultures: ['BASHU'],
    },
    {
        id: 'red_cliff_tactics', name: '赤壁战术', de: 'Red Cliff Tactics', year: 208,
        era: 'antiquity',
        basis: '东吴赤壁火攻战术（DE tech 1080），弓箭手穿刺与对建筑加成提升',
        effects: [
            { attr: 'pierceAttack', op: 'add', value: 2, classes: [0, 36] },
            { attr: 'bonus', op: 'add', value: 2, classes: [0, 36], bonusClass: 11 },
        ],
        cultures: ['JIANGNAN'],
    },
    {
        id: 'sitting_tiger', name: '卧虎', de: 'Sitting Tiger', year: 222,
        era: 'antiquity',
        basis: '东吴卧虎抛石车改良（DE tech 1081），攻城器械攻击与对建筑加成提升',
        effects: [
            { attr: 'pierceAttack', op: 'add', value: 2, classes: [13, 55] },
            { attr: 'bonus', op: 'mul', value: 1.2, classes: [13, 55], bonusClass: 11 },
        ],
        cultures: ['JIANGNAN'],
    },
    {
        id: 'kamandaran', name: '波斯步弓手', de: 'Kamandaran', year: 250,
        era: 'antiquity',
        basis: '萨珊波斯精锐复合弓手（DE tech 488），步弓装填提速与穿刺攻击 +1',
        effects: [
            { attr: 'reload', op: 'mul', value: 0.85, classes: [0] },
            { attr: 'pierceAttack', op: 'add', value: 1, classes: [0] },
        ],
        cultures: ['SASANIAN'],
    },
    {
        id: 'citadels', name: '堡垒', de: 'Citadels', year: 530,
        era: 'feudal',
        basis: '萨珊要塞火枪与重箭防御（DE tech 7），远程单位穿刺攻击 +2',
        effects: [{ attr: 'pierceAttack', op: 'add', value: 2, classes: [0, 36, 44] }],
        cultures: ['SASANIAN'],
    },
    {
        id: 'marauders', name: '掠夺者', de: 'Marauders', year: 430,
        era: 'antiquity',
        basis: '匈人铁骑闪电劫掠战术（DE tech 483），骑兵移速与对建筑加成提升',
        effects: [
            { attr: 'speed', op: 'mul', value: 1.1, classes: [12, 36, 47] },
            { attr: 'bonus', op: 'add', value: 3, classes: [12, 36, 47], bonusClass: 21 },
        ],
        cultures: ['HUNS'],
    },
    {
        id: 'perfusion', name: '井喷', de: 'Perfusion', year: 410,
        era: 'antiquity',
        basis: '哥特部族总动员倾巢冲锋（DE tech 457），步兵移速与近战攻击提升',
        effects: [
            { attr: 'speed', op: 'mul', value: 1.1, classes: [6] },
            { attr: 'meleeAttack', op: 'add', value: 1, classes: [6] },
        ],
        cultures: ['GOTHS'],
    },
    {
        id: 'shield_wall', name: '盾墙', de: 'Shield Wall', year: 700,
        era: 'feudal',
        basis: '撒克逊圆盾密接盾墙阵（DE tech 1464），步兵双甲 +1/+1',
        effects: [
            { attr: 'meleeArmor', op: 'add', value: 1, classes: [6] },
            { attr: 'pierceArmor', op: 'add', value: 1, classes: [6] },
        ],
        cultures: ['SAXONS'],
    },
    {
        id: 'hamask', name: '哈马思克', de: 'Hamask', year: 850,
        era: 'feudal',
        basis: '丹麦狂战士披熊狼皮狂暴突击（DE tech 1484），步兵近战攻击 +3',
        effects: [{ attr: 'meleeAttack', op: 'add', value: 3, classes: [6] }],
        cultures: ['DANES'],
    },
    {
        id: 'northmens_fury', name: '北方人之怒', de: "Northmen's Fury", year: 880,
        era: 'feudal',
        basis: '丹麦维京大军破城强袭（DE tech 1483），攻城器械射程 +1、对建筑加成提升',
        effects: [
            { attr: 'range', op: 'add', value: 1, classes: [13, 55] },
            { attr: 'bonus', op: 'mul', value: 1.3, classes: [13, 55], bonusClass: 11 },
        ],
        cultures: ['DANES'],
    },
    {
        id: 'vendel_legacy', name: '文德尔传承', de: 'Vendel Legacy', year: 650,
        era: 'feudal',
        basis: '北欧文德尔时代精工武备传承（DE tech 1473），骑兵近战攻击 +2',
        effects: [{ attr: 'meleeAttack', op: 'add', value: 2, classes: [12, 47] }],
        cultures: ['VARANGIANS'],
    },
    {
        id: 'gothikon', name: '哥瑟砍', de: 'Gothikon', year: 988,
        era: 'feudal',
        basis: '瓦兰吉卫队双手巨斧战舞（DE tech 1474），步兵近战攻击 +2、生命值 +20',
        effects: [
            { attr: 'meleeAttack', op: 'add', value: 2, classes: [6] },
            { attr: 'hp', op: 'add', value: 20, classes: [6] },
        ],
        cultures: ['VARANGIANS'],
    },
    {
        id: 'viking_chieftains', name: '维京酋长', de: 'Chieftains', year: 900,
        era: 'feudal',
        basis: '维京酋长亲卫（DE tech 463），步兵对骑兵/骆驼加成',
        effects: [
            { attr: 'bonus', op: 'add', value: 5, classes: [6], bonusClass: 8 },
            { attr: 'bonus', op: 'add', value: 4, classes: [6], bonusClass: 30 },
        ],
        cultures: ['VIKINGS'],
    },
    {
        id: 'bogsveigar', name: '博格斯维加尔', de: 'Bogsveigar', year: 950,
        era: 'feudal',
        basis: '维京长弓射手（DE tech 49），步弓穿刺攻击 +1',
        effects: [{ attr: 'pierceAttack', op: 'add', value: 1, classes: [0] }],
        cultures: ['VIKINGS'],
    },
    {
        id: 'zealotry', name: '狂热', de: 'Zealotry', year: 700,
        era: 'feudal',
        basis: '萨拉森（阿拉伯）狂热教团（DE tech 9），骆驼与骑兵系血量强化',
        effects: [{ attr: 'hp', op: 'add', value: 20, classes: [12, 36] }],
        cultures: ['ORIE'],
    },
    {
        id: 'counterweights', name: '反击配重', de: 'Counterweights', year: 1100,
        era: 'castle',
        basis: '萨拉森反击配重（配重投石机改良，DE tech 454），攻城器械对建筑加成提升',
        effects: [{ attr: 'bonus', op: 'mul', value: 1.15, classes: [13], bonusClass: 11 }],
        cultures: ['ORIE'],
    },
    {
        id: 'logistica', name: '后勤', de: 'Logistica', year: 1000,
        era: 'feudal',
        basis: '拜占庭甲胄骑兵后勤（DE tech 61），骑兵对步兵加成',
        effects: [{ attr: 'bonus', op: 'add', value: 6, classes: [12], bonusClass: 1 }],
        cultures: ['BYZANTINE'],
    },
    {
        id: 'greek_fire', name: '希腊火', de: 'Greek Fire', year: 672,
        era: 'feudal',
        basis: '拜占庭加利尼科斯秘制希腊火投射器（DE tech 464），攻城器械射程 +1、穿刺攻击 +2',
        effects: [
            { attr: 'range', op: 'add', value: 1, classes: [13, 55] },
            { attr: 'pierceAttack', op: 'add', value: 2, classes: [13, 55] },
        ],
        cultures: ['BYZANTINE'],
    },
    {
        id: 'bearded_axe', name: '阔斧', de: 'Bearded Axe', year: 800,
        era: 'feudal',
        basis: '法兰克掷斧兵阔斧（DE tech 83），掷斧射程强化',
        effects: [
            { attr: 'range', op: 'add', value: 2, classes: [37] },
            { attr: 'los', op: 'add', value: 2, classes: [37] },
        ],
        cultures: ['FRANKS'],
    },
    {
        id: 'chivalry', name: '骑士精神', de: 'Chivalry', year: 1095,
        era: 'castle',
        basis: '法兰克封建骑士精神（DE tech 493），骑士系生命值 +20、近战攻击 +1',
        effects: [
            { attr: 'hp', op: 'add', value: 20, classes: [12] },
            { attr: 'meleeAttack', op: 'add', value: 1, classes: [12] },
        ],
        cultures: ['FRANKS'],
    },
    {
        id: 'stirrups', name: '马镫', de: 'Stirrups', year: 800,
        era: 'feudal',
        basis: '保加利亚骑兵马镫（DE tech 685），骑兵攻击装填提速',
        effects: [{ attr: 'reload', op: 'mul', value: 0.75, classes: [47, 12] }],
        cultures: ['BULGARIANS'],
    },
    {
        id: 'bagains', name: '巴干', de: 'Bagains', year: 1200,
        era: 'castle',
        basis: '保加利亚巴干重甲贵族（DE tech 686），步兵近战护甲 +5',
        effects: [{ attr: 'meleeArmor', op: 'add', value: 5, classes: [6] }],
        cultures: ['BULGARIANS'],
    },
    {
        id: 'lamellar_armor', name: '札甲', de: 'Lamellar Armor', year: 916,
        era: 'feudal',
        basis: '契丹/鲜卑铁札甲（DE tech 1006），步兵与射手护甲提升',
        effects: [
            { attr: 'meleeArmor', op: 'add', value: 2, classes: [6, 0] },
            { attr: 'pierceArmor', op: 'add', value: 1, classes: [6, 0] },
        ],
        cultures: ['KHITAN', 'XIANBEI'],
    },
    {
        id: 'ordo_cavalry', name: '斡鲁朵骑兵', de: 'Ordo Cavalry', year: 947,
        era: 'feudal',
        basis: '辽朝宫帐斡鲁朵皮室铁骑（DE tech 1007），骑兵生命值 +30',
        effects: [{ attr: 'hp', op: 'add', value: 30, classes: [12, 36, 47] }],
        cultures: ['KHITAN', 'XIANBEI'],
    },
    {
        id: 'thunderclap_bombs', name: '霹雳炸弹', de: 'Thunderclap Bombs', year: 1126,
        era: 'castle',
        basis: '女真金军震天雷铁壳火药弹（DE tech 997），攻城与火器攻击提升',
        effects: [{ attr: 'pierceAttack', op: 'add', value: 2, classes: [13, 44, 55] }],
        cultures: ['NORTHEAST'],
    },
    {
        id: 'steppe_husbandry', name: '大草原畜牧', de: 'Steppe Husbandry', year: 900,
        era: 'feudal',
        basis: '钦察-库曼大草原群牧骑乘术（DE tech 689），骑兵与骑射手移速提升',
        effects: [{ attr: 'speed', op: 'mul', value: 1.1, classes: [12, 36, 47] }],
        cultures: ['CUMAN'],
    },
    {
        id: 'druzhina', name: '皇家卫队', de: 'Druzhina', year: 980,
        era: 'feudal',
        basis: '基辅罗斯王公亲兵卫队德鲁日纳（DE tech 513），步兵近战攻击 +3',
        effects: [{ attr: 'meleeAttack', op: 'add', value: 3, classes: [6] }],
        cultures: ['SLAVIC'],
    },
    {
        id: 'british_yeoman', name: '英长弓手', de: 'Yeomen', year: 1298,
        era: 'castle',
        basis: '不列颠自由民长弓（DE tech 3），步弓射程强化',
        effects: [
            { attr: 'range', op: 'add', value: 1, classes: [0] },
            { attr: 'los', op: 'add', value: 1, classes: [0] },
        ],
        cultures: ['BRITONS'],
    },
    {
        id: 'celtic_furor', name: '凯尔特之怒', de: 'Furor Celtica', year: 1100,
        era: 'castle',
        basis: '凯尔特狂战士攻城（DE tech 5），攻城器械血量强化',
        effects: [{ attr: 'hp', op: 'mul', value: 1.4, classes: [12, 13, 51, 54, 55] }],
        cultures: ['CELTS'],
    },
    {
        id: 'flemish_revolution', name: '弗拉芒革命', de: 'Flemish Revolution', year: 1302,
        era: 'castle',
        basis: '金马刺战役弗拉芒市民长矛方阵（DE tech 755），步兵对骑兵加成 +3、近战攻击 +1',
        effects: [
            { attr: 'bonus', op: 'add', value: 3, classes: [6], bonusClass: 8 },
            { attr: 'meleeAttack', op: 'add', value: 1, classes: [6] },
        ],
        cultures: ['BURGUNDIANS'],
    },
    {
        id: 'lechitic_legacy', name: '列克提克遗产', de: 'Lechitic Legacy', year: 1241,
        era: 'castle',
        basis: '波兰皮雅斯特王朝翼骑兵冲击传统（DE tech 783），骑兵近战攻击 +3',
        effects: [{ attr: 'meleeAttack', op: 'add', value: 3, classes: [12, 47] }],
        cultures: ['POLES'],
    },
    {
        id: 'aznauri_cavalry', name: '阿兹瑙里骑兵', de: 'Aznauri Cavalry', year: 1121,
        era: 'castle',
        basis: '格鲁吉亚大卫四世阿兹瑙里贵族铁骑（DE tech 924），骑兵生命值 +20、近战攻击 +1',
        effects: [
            { attr: 'hp', op: 'add', value: 20, classes: [12, 47] },
            { attr: 'meleeAttack', op: 'add', value: 1, classes: [12, 47] },
        ],
        cultures: ['GEORGIANS'],
    },
    {
        id: 'mongol_siege_drill', name: '蒙古攻城钻', de: 'Drill', year: 1200,
        era: 'castle',
        basis: '蒙古攻城演练（DE tech 6），攻城器械移速强化',
        effects: [{ attr: 'speed', op: 'mul', value: 1.5, classes: [13, 55] }],
        cultures: ['MONGOL'],
    },
    {
        id: 'atlatl', name: '掷矛器', de: 'Atlatl', year: 1300,
        era: 'castle',
        basis: '阿兹特克掷矛器（DE tech 460），散兵/标枪骑兵射程与穿刺 +1',
        effects: [
            { attr: 'pierceAttack', op: 'add', value: 1, classes: [0, 36] },
            { attr: 'range', op: 'add', value: 1, classes: [0, 36] },
            { attr: 'los', op: 'add', value: 1, classes: [0, 36] },
        ],
        cultures: ['AMERICA'],
    },
    {
        id: 'aztec_garland_wars', name: '花环战争', de: 'Garland Wars', year: 1450,
        era: 'castle',
        basis: '阿兹特克荣冠之战（DE tech 24），步兵近攻强化',
        effects: [{ attr: 'meleeAttack', op: 'add', value: 4, classes: [6] }],
        cultures: ['AMERICA'],
    },
    {
        id: 'andean_sling', name: '安第斯弹弓', de: 'Andean Sling', year: 1300,
        era: 'castle',
        basis: '印加安第斯投石索（DE tech 516），投石/步弓穿刺攻击 +1',
        effects: [{ attr: 'pierceAttack', op: 'add', value: 1, classes: [0] }],
        cultures: ['INCA'],
    },
    {
        id: 'fabric_shields', name: '织物盾', de: 'Fabric Shields', year: 1400,
        era: 'castle',
        basis: '印加多层棉织盾甲（DE tech 517），步兵/射手/突袭者双甲 +1/+1',
        effects: [
            { attr: 'meleeArmor', op: 'add', value: 1, classes: [0, 6, 12] },
            { attr: 'pierceArmor', op: 'add', value: 1, classes: [0, 6, 12] },
        ],
        cultures: ['INCA'],
    },
    {
        id: 'teutons_ironclad', name: '条顿铁甲', de: 'Ironclad', year: 1200,
        era: 'castle',
        basis: '条顿铁甲（DE tech 489），攻城器械近防强化',
        effects: [{ attr: 'meleeArmor', op: 'add', value: 4, classes: [13, 55] }],
        cultures: ['GERMANIC'],
    },
    {
        id: 'sipahi', name: '西帕希', de: 'Sipahi', year: 1400,
        era: 'castle',
        basis: '奥斯曼西帕希骑兵（DE tech 491），弓骑血量强化',
        effects: [{ attr: 'hp', op: 'add', value: 20, classes: [12, 36] }],
        cultures: ['TURKS'],
    },
    {
        id: 'artillery', name: '火炮术', de: 'Artillery', year: 1453,
        era: 'imperial',
        basis: '奥斯曼乌尔班巨炮与火炮术（DE tech 10），攻城火炮射程与视野 +2',
        effects: [
            { attr: 'range', op: 'add', value: 2, classes: [13] },
            { attr: 'los', op: 'add', value: 2, classes: [13] },
        ],
        cultures: ['TURKS'],
    },
    {
        id: 'pavise', name: '帕维塞盾', de: 'Pavise', year: 1300,
        era: 'castle',
        basis: '意大利帕维塞大盾（DE tech 494），步弓双甲强化',
        effects: [
            { attr: 'pierceArmor', op: 'add', value: 1, classes: [0] },
            { attr: 'meleeArmor', op: 'add', value: 1, classes: [0] },
        ],
        cultures: ['LATIN'],
    },
    {
        id: 'recurve_bow', name: '反曲弓', de: 'Recurve Bow', year: 1300,
        era: 'castle',
        basis: '马扎尔复合反曲弓（DE tech 515），骑射手射程与穿刺 +1',
        effects: [
            { attr: 'los', op: 'add', value: 1, classes: [36] },
            { attr: 'range', op: 'add', value: 1, classes: [36] },
            { attr: 'pierceAttack', op: 'add', value: 1, classes: [36] },
        ],
        cultures: ['MAGYAR'],
    },
    {
        id: 'shatagni', name: '印度火铳', de: 'Shatagni', year: 1526,
        era: 'imperial',
        basis: '印度斯坦/莫卧儿火枪改良（DE tech 507），火枪兵射程与视野 +2',
        effects: [
            { attr: 'range', op: 'add', value: 2, classes: [44] },
            { attr: 'los', op: 'add', value: 2, classes: [44] },
        ],
        cultures: ['MUGHAL'],
    },
    {
        id: 'medical_corps', name: '医疗部队', de: 'Medical Corps', year: 1050,
        era: 'castle',
        basis: '达罗毗荼/南印战象随军医护（DE tech 831），战象与骑兵生命值 +40',
        effects: [{ attr: 'hp', op: 'add', value: 40, classes: [12] }],
        cultures: ['INDIA'],
    },
    {
        id: 'wootz_steel', name: '乌兹钢', de: 'Wootz Steel', year: 1200,
        era: 'castle',
        basis: '南印度大马士革坩埚乌兹钢锻刃（DE tech 832），步兵与骑兵近战攻击 +3',
        effects: [{ attr: 'meleeAttack', op: 'add', value: 3, classes: [6, 12] }],
        cultures: ['INDIA'],
    },
    {
        id: 'silk_armor', name: '丝护甲', de: 'Silk Armor', year: 1300,
        era: 'castle',
        basis: '中亚/西域丝绸内衬复合甲（DE tech 687），骑兵与骑射手双甲 +1/+1',
        effects: [
            { attr: 'meleeArmor', op: 'add', value: 1, classes: [12, 36, 47] },
            { attr: 'pierceArmor', op: 'add', value: 1, classes: [12, 36, 47] },
        ],
        cultures: ['CENTRAL_ASIA', 'WESTERN'],
    },
    {
        id: 'timurid_siegecraft', name: '帖木儿攻城术', de: 'Timurid Siegecraft', year: 1380,
        era: 'castle',
        basis: '帖木儿帝国重型投石机与攻城战术（DE tech 688），攻城器械射程与视野 +2',
        effects: [
            { attr: 'range', op: 'add', value: 2, classes: [12, 13] },
            { attr: 'los', op: 'add', value: 2, classes: [12, 13] },
        ],
        cultures: ['CENTRAL_ASIA', 'WESTERN'],
    },
    {
        id: 'maghrebi_camels', name: '马格里布骆驼', de: 'Maghrebi Camels', year: 1100,
        era: 'castle',
        basis: '北非柏柏尔耐力驼骑（DE tech 579），骆驼与骑兵生命值 +25',
        effects: [{ attr: 'hp', op: 'add', value: 25, classes: [12, 36] }],
        cultures: ['BERBER'],
    },
    {
        id: 'farimba', name: '法林巴', de: 'Farimba', year: 1300,
        era: 'castle',
        basis: '马里法林巴精锐骑兵（DE tech 577），骑兵近攻强化',
        effects: [{ attr: 'meleeAttack', op: 'add', value: 5, classes: [12, 47] }],
        cultures: ['AFRICA'],
    },
    {
        id: 'royal_heirs', name: '龙脉', de: 'Royal Heirs', year: 1270,
        era: 'castle',
        basis: '埃塞俄比亚所罗门王室卫队（DE tech 574），步兵与骑兵近战护甲 +2',
        effects: [{ attr: 'meleeArmor', op: 'add', value: 2, classes: [6, 12] }],
        cultures: ['ETHIOPIANS'],
    },
    {
        id: 'torsion_engines', name: '扭绞机', de: 'Torsion Engines', year: 1350,
        era: 'castle',
        basis: '埃塞俄比亚扭力攻城器械改良（DE tech 575），攻城器械攻击与对建筑加成提升',
        effects: [
            { attr: 'pierceAttack', op: 'add', value: 2, classes: [13, 55] },
            { attr: 'bonus', op: 'mul', value: 1.15, classes: [13, 55], bonusClass: 11 },
        ],
        cultures: ['ETHIOPIANS'],
    },
    {
        id: 'manipur_cavalry', name: '曼尼普尔骑兵', de: 'Manipur Cavalry', year: 1200,
        era: 'castle',
        basis: '缅甸曼尼普尔骑兵（DE tech 627），骑兵对射手加成',
        effects: [{ attr: 'bonus', op: 'add', value: 4, classes: [12, 47], bonusClass: 15 }],
        cultures: ['BURMESE'],
    },
    {
        id: 'howdah', name: '象轿', de: 'Howdah', year: 1300,
        era: 'castle',
        basis: '缅甸战象装甲象轿（DE tech 626），战象/骑兵双甲 +1/+1',
        effects: [
            { attr: 'meleeArmor', op: 'add', value: 1, classes: [12] },
            { attr: 'pierceArmor', op: 'add', value: 1, classes: [12] },
        ],
        cultures: ['BURMESE'],
    },
    {
        id: 'tusk_swords', name: '獠牙剑', de: 'Tusk Swords', year: 1100,
        era: 'castle',
        basis: '高棉战象象牙钢剑（DE tech 622），战象/骑兵近战攻击 +3',
        effects: [{ attr: 'meleeAttack', op: 'add', value: 3, classes: [12] }],
        cultures: ['KHMER'],
    },
    {
        id: 'forced_levy', name: '强征兵役', de: 'Forced Levy', year: 1293,
        era: 'castle',
        basis: '满者伯夷马来群岛总动员征召（DE tech 625），步兵生命值 +20、近战攻击 +1',
        effects: [
            { attr: 'hp', op: 'add', value: 20, classes: [6] },
            { attr: 'meleeAttack', op: 'add', value: 1, classes: [6] },
        ],
        cultures: ['MALAY'],
    },
    {
        id: 'chatras', name: '宝伞', de: 'Chatras', year: 1200,
        era: 'castle',
        basis: '安南/交趾战象华盖宝伞（DE tech 628），战象/骑兵生命值 +100',
        effects: [{ attr: 'hp', op: 'add', value: 100, classes: [12] }],
        cultures: ['VIETNAMESE'],
    },
    {
        id: 'tower_shields', name: '塔盾', de: 'Tower Shields', year: 1350,
        era: 'castle',
        basis: '立陶宛步兵与散兵大塔盾（DE tech 692），步兵与射手穿刺护甲 +2',
        effects: [{ attr: 'pierceArmor', op: 'add', value: 2, classes: [0, 6, 36] }],
        cultures: ['LITHUANIANS'],
    },
    {
        id: 'fereters', name: '费列泰斯', de: 'Fereters', year: 1200,
        era: 'castle',
        basis: '亚美尼亚费列泰斯步兵（DE tech 921），步兵血量强化',
        effects: [{ attr: 'hp', op: 'add', value: 30, classes: [6] }],
        cultures: ['ARMENIANS'],
    },
    {
        id: 'herbalism', name: '草医', de: 'Herbalism', year: 1400,
        era: 'castle',
        basis: '穆伊斯卡草医（DE tech 1369），步弓移速强化',
        effects: [{ attr: 'speed', op: 'mul', value: 1.15, classes: [0] }],
        cultures: ['MUISCA'],
    },
    {
        id: 'el_dorado', name: '黄金国', de: 'El Dorado', year: 1300,
        era: 'castle',
        basis: '玛雅黄金国（DE tech 4），鹰勇士血量强化',
        effects: [{ attr: 'hp', op: 'add', value: 40, classes: [6, 12] }],
        cultures: ['MAYANS'],
    },
    {
        id: 'hauberk', name: '锁子甲', de: 'Hauberk', year: 1100,
        era: 'castle',
        basis: '西西里诺曼锁子甲（DE tech 757），骑兵双甲强化',
        effects: [
            { attr: 'meleeArmor', op: 'add', value: 1, classes: [12] },
            { attr: 'pierceArmor', op: 'add', value: 2, classes: [12] },
        ],
        cultures: ['SICILIANS'],
    },
    {
        id: 'paiks', name: '孟加拉战象', de: 'Paiks', year: 1300,
        era: 'castle',
        basis: '孟加拉帕伊克制度与战象协同（DE tech 833），战象/象弓装填提速',
        effects: [{ attr: 'reload', op: 'mul', value: 0.833, classes: [12, 36] }],
        cultures: ['BENGALIS'],
    },
    {
        id: 'frontier_guards', name: '边境卫队', de: 'Frontier Guards', year: 1100,
        era: 'castle',
        basis: '瞿折罗边境卫队（DE tech 836），骆驼与象弓手近防强化',
        effects: [{ attr: 'meleeArmor', op: 'add', value: 4, classes: [12, 36] }],
        cultures: ['GURJARAS'],
    },
    {
        id: 'wagenburg', name: '车堡战术', de: 'Wagenburg Tactics', year: 1400,
        era: 'castle',
        basis: '波希米亚胡斯车堡（DE tech 784），火枪/攻城移速强化',
        effects: [{ attr: 'speed', op: 'mul', value: 1.15, classes: [13, 44, 55] }],
        cultures: ['BOHEMIANS'],
    },
    {
        id: 'kataparuto', name: '片仓', de: 'Kataparuto', year: 1200,
        era: 'castle',
        basis: '日本片仓工法（DE tech 59），攻城器械装填提速',
        effects: [{ attr: 'reload', op: 'mul', value: 0.75, classes: [13] }],
        cultures: ['JAPAN'],
    },
    {
        id: 'rocketry', name: '火箭', de: 'Rocketry', year: 1232,
        era: 'castle',
        basis: '华夏火药火箭与诸葛连弩（DE tech 52），弩炮与弓弩穿刺强化',
        effects: [{ attr: 'pierceAttack', op: 'add', value: 2, classes: [0, 55] }],
        cultures: ['CENTRAL'],
    },
    {
        id: 'huaracas', name: '瓦拉卡投石', de: 'Huaracas', year: 1400,
        era: 'castle',
        basis: '穆伊斯卡瓦拉卡投石（DE tech 1370），投石射程强化',
        effects: [
            { attr: 'range', op: 'add', value: 1, classes: [0] },
            { attr: 'los', op: 'add', value: 1, classes: [0] },
        ],
        cultures: ['MUISCA'],
    },
    {
        id: 'caciques', name: '卡西克', de: 'Caciques', year: 1400,
        era: 'castle',
        basis: '图皮卡西克首领（DE tech 1392），弓手与步兵装填提速',
        effects: [{ attr: 'reload', op: 'mul', value: 0.8, classes: [0, 6, 12] }],
        cultures: ['TUPI'],
    },
    {
        id: 'malon', name: '突袭', de: 'Malon', year: 1550,
        era: 'imperial',
        basis: '马普切马隆闪电奇袭（DE tech 1379），骑兵与远程穿刺攻击 +2',
        effects: [
            { attr: 'meleeAttack', op: 'add', value: 2, classes: [12, 47] },
            { attr: 'pierceAttack', op: 'add', value: 2, classes: [0, 36] },
        ],
        cultures: ['MAPUCHE'],
    },
    {
        id: 'supremacy', name: '霸权', de: 'Supremacy', year: 1525,
        era: 'imperial',
        basis: '西班牙帝国大方阵霸权（DE tech 440），步兵生命值 +40、双甲 +2/+2',
        effects: [
            { attr: 'hp', op: 'add', value: 40, classes: [6] },
            { attr: 'meleeArmor', op: 'add', value: 2, classes: [6] },
            { attr: 'pierceArmor', op: 'add', value: 2, classes: [6] },
        ],
        cultures: ['SPANISH'],
    },
    {
        id: 'arquebus', name: '火绳枪', de: 'Arquebus', year: 1510,
        era: 'imperial',
        basis: '葡萄牙火绳枪与弹道术（DE tech 573），火器与攻城器械装填提速、射程 +1',
        effects: [
            { attr: 'reload', op: 'mul', value: 0.85, classes: [13, 23, 44] },
            { attr: 'range', op: 'add', value: 1, classes: [13, 23, 44] },
        ],
        cultures: ['PORTUGUESE'],
    },
    {
        id: 'korean_catapults', name: '神机箭', de: 'Shinkichon', year: 1448,
        era: 'castle',
        basis: '朝鲜神机箭改良（DE tech 445），火箭车/攻城器械射程与装填提升',
        effects: [
            { attr: 'range', op: 'add', value: 1, classes: [13] },
            { attr: 'los', op: 'add', value: 1, classes: [13] },
            { attr: 'reload', op: 'add', value: -0.35, classes: [13] },
        ],
        cultures: ['KOREA'],
    },
];

/**
 * 【面板展示分组】13 战斗面板的科技徽记按此分四组渲染。
 *
 * 为什么要分组：直接列 16 个科技名是一堵文字墙，直播观众扫一眼什么也读不到。
 * 分成「冶/甲/射/术」四组、每组画点，双方并排时**哪条线点满了一眼可比**。
 * `split` = 该组内部再按几个一簇分开画（甲组 9 条 = 步甲3｜马铠3｜射甲3）。
 */
export interface TechDisplayGroup {
    label: string;
    hint: string;
    ids: readonly string[];
    /** 每簇几个点；不给则连成一串 */
    split?: number;
}

export const TECH_DISPLAY_GROUPS: readonly TechDisplayGroup[] = [
    { label: '冶', hint: '冶金·近战攻击', ids: ['forging', 'iron_casting', 'blast_furnace'] },
    {
        label: '甲', hint: '护甲：步兵甲｜骑兵甲｜射手甲', split: 3,
        ids: [
            'scale_mail', 'chain_mail', 'plate_mail',
            'scale_barding', 'chain_barding', 'plate_barding',
            'padded_archer', 'leather_archer', 'ring_archer',
            'gambesons',
        ],
    },
    { label: '射', hint: '箭术·远程攻击与射程', ids: ['fletching', 'bodkin', 'bracer', 'chemistry'] },
    { label: '术', hint: '畜牧·血统·扳指·帕提亚战术·护卫·攻城技师', ids: ['husbandry', 'bloodlines', 'thumb_ring', 'parthian_tactics', 'squires', 'siege_engineers'] },
];

