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
 *   36 弓骑（探针：安息战术 = DE 弓骑专属科技，只作用于 36）
 *   44 火枪／火药步兵（HCANR 火枪兵、JANNI 苏丹亲兵、GRNADR 掷弹兵）
 *   47 **斥候 SCOUT**，全表仅 1 个单位 —— 🔴 **不是战象**，别拿 47 认象
 *   52 **塔楼建筑**（WCTW 望楼一族）→ 远程线里那个 52 对我们是空转，我们没有塔类兵种
 *   55 弩炮／战车（SCBAL 蝎弩、HUSSITEWAGON 胡斯战车）
 *   45 / 46 / 50 —— dat 里**没有任何单位**属于这三类，近战线带着它们纯属 DE 冗余，对我们空转
 *
 * ── 年份是设计草案，不是 DE 数据 ────────────────────────────────────────────
 * DE 是时代制（封建/城堡/帝王），没有年份。下表年份按史实拟定，主人可改。
 * 时间线 -334（亚历山大东征）→ 1912，故上古就有的科技标 `OPENING`（开局自带）。
 */

import type { RegionType } from '../systems/RegionSystem';

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
    | 'los';           // 视野，落到 SIGHT_MAP 要 ×40 像素

export interface TechEffect {
    attr: TechAttr;
    /** 'add' = 加减（range/los 单位为格）；'mul' = 乘 */
    op: 'add' | 'mul';
    value: number;
    /** 作用的 DE unit class 列表 */
    classes: readonly number[];
}

export interface MilitaryTech {
    id: string;
    /** 中文名（播报用） */
    name: string;
    /** DE 原名，便于回溯 */
    de: string;
    /** 生效年份；null = 开局自带（早于时间线起点 -334） */
    year: number | null;
    /** 史实依据（播报与审校用） */
    basis: string;
    effects: readonly TechEffect[];
    /**
     * 可获得该科技的文化区；null = 全部 20 区。
     * 🔴 **全区同享的科技对胜负是空转的**（所有势力同时变强，相对强弱不变，只改战斗时长）。
     *    科技系统的价值全在这一列的差异化上——素材是 DE 自己的文明科技树。
     */
    cultures: readonly RegionType[] | null;
}

/** 欧亚锁甲分布带 */
const CHAINMAIL_BELT: readonly RegionType[] = [
    // [2026-08-19] 原含 'GREEK'，已并入 LATIN（本表已有 LATIN，覆盖不变）
    'LATIN', 'GERMANIC', 'SLAVIC', 'WEST_ASIA', 'CENTRAL_ASIA', 'NORTH', 'HEXI',
];
/** 骑射文化（草原／伊朗系）+ 中原扳指传统 */
const HORSE_ARCHER_CULTURES: readonly RegionType[] = [
    // [2026-08-19] 原含 'NUERGAN'，已并入 NORTHEAST（本表已有 NORTHEAST，覆盖不变）
    'STEPPE', 'CENTRAL_ASIA', 'WESTERN', 'NORTHEAST', 'TIBET',
];

export const MILITARY_TECHS: readonly MilitaryTech[] = [
    // ── 近战攻击线（冶金）：步兵6 / 骑兵12（含象、车）────────────────────────
    {
        id: 'forging', name: '锻造', de: 'Forging', year: null,
        basis: '铁兵器普及早于时间线起点（-334 已是铁器时代）',
        effects: [{ attr: 'meleeAttack', op: 'add', value: 1, classes: [6, 12, 45, 46, 47, 50] }],
        cultures: null,
    },
    {
        id: 'iron_casting', name: '铸铁', de: 'Iron casting', year: -100,
        basis: '汉代炒钢／百炼钢工艺成熟',
        effects: [{ attr: 'meleeAttack', op: 'add', value: 1, classes: [6, 12, 45, 46, 47, 50] }],
        cultures: null,
    },
    {
        id: 'blast_furnace', name: '鼓风炉', de: 'Blast Furnace', year: 31,
        basis: '东汉杜诗造水排（水力鼓风冶铁）；欧洲高炉迟至 12 世纪',
        effects: [{ attr: 'meleeAttack', op: 'add', value: 2, classes: [6, 12, 45, 46, 47, 50] }],
        cultures: ['CENTRAL', 'NORTH', 'HEXI', 'BASHU', 'JIANGNAN', 'LATIN', 'GERMANIC'],
    },

    // ── 步兵护甲线：只作用于步兵6 ──────────────────────────────────────────
    {
        id: 'scale_mail', name: '鳞甲', de: 'Scale Mail Armor', year: null,
        basis: '鳞甲远早于时间线起点',
        effects: [
            { attr: 'meleeArmor', op: 'add', value: 1, classes: [6] },
            { attr: 'pierceArmor', op: 'add', value: 1, classes: [6] },
        ],
        cultures: null,
    },
    {
        id: 'chain_mail', name: '锁子甲', de: 'Chain Mail Armor', year: -100,
        basis: '凯尔特人前 3 世纪发明，罗马前 1 世纪普遍装备',
        effects: [
            { attr: 'meleeArmor', op: 'add', value: 1, classes: [6] },
            { attr: 'pierceArmor', op: 'add', value: 1, classes: [6] },
        ],
        cultures: CHAINMAIL_BELT,
    },
    {
        id: 'plate_mail', name: '板甲', de: 'Plate Mail Armor', year: 1400,
        basis: '欧洲全身板甲成熟期；板甲是西欧独有工艺',
        effects: [
            { attr: 'meleeArmor', op: 'add', value: 1, classes: [6] },
            { attr: 'pierceArmor', op: 'add', value: 2, classes: [6] },
        ],
        cultures: ['LATIN', 'GERMANIC'],
    },

    // ── 骑兵马铠线：骑兵12（含象、车）；🔴 不含弓骑36 ───────────────────────
    {
        id: 'scale_barding', name: '鳞马铠', de: 'Scale Barding Armor', year: -50,
        basis: '帕提亚／萨珊具装甲骑（cataphract）成型',
        effects: [
            { attr: 'meleeArmor', op: 'add', value: 1, classes: [12, 47] },
            { attr: 'pierceArmor', op: 'add', value: 1, classes: [12, 47] },
        ],
        cultures: null,
    },
    {
        id: 'chain_barding', name: '锁子马铠', de: 'Chain Barding Armor', year: 1100,
        basis: '中世纪盛期骑士马铠',
        effects: [
            { attr: 'meleeArmor', op: 'add', value: 1, classes: [12, 47] },
            { attr: 'pierceArmor', op: 'add', value: 1, classes: [12, 47] },
        ],
        cultures: CHAINMAIL_BELT,
    },
    {
        id: 'plate_barding', name: '板甲马铠', de: 'Plate Barding Armor', year: 1450,
        basis: '全身板甲马铠，西欧独有',
        effects: [
            { attr: 'meleeArmor', op: 'add', value: 1, classes: [12, 47] },
            { attr: 'pierceArmor', op: 'add', value: 2, classes: [12, 47] },
        ],
        cultures: ['LATIN', 'GERMANIC'],
    },

    // ── 远程攻击线：弓箭手0 / 弓骑36 ───────────────────────────────────────
    {
        id: 'fletching', name: '羽箭', de: 'Fletching', year: null,
        basis: '基础箭羽工艺',
        effects: [
            { attr: 'pierceAttack', op: 'add', value: 1, classes: [0, 36, 52] },
            { attr: 'range', op: 'add', value: 1, classes: [0, 36, 52] },
            { attr: 'los', op: 'add', value: 1, classes: [0, 36, 52] },
        ],
        cultures: null,
    },
    {
        id: 'bodkin', name: '锥头箭', de: 'Bodkin Arrow', year: 1200,
        basis: '破甲锥头箭（bodkin point）应对锁甲普及',
        effects: [
            { attr: 'pierceAttack', op: 'add', value: 1, classes: [0, 36, 52] },
            { attr: 'range', op: 'add', value: 1, classes: [0, 36, 52] },
            { attr: 'los', op: 'add', value: 1, classes: [0, 36, 52] },
        ],
        cultures: ['LATIN', 'GERMANIC', 'SLAVIC', 'CENTRAL', 'BASHU'],
    },
    {
        id: 'bracer', name: '护腕', de: 'Bracer', year: 1400,
        basis: '复合护具与拉距改良',
        effects: [
            { attr: 'pierceAttack', op: 'add', value: 1, classes: [0, 36, 52] },
            { attr: 'range', op: 'add', value: 1, classes: [0, 36, 52] },
            { attr: 'los', op: 'add', value: 1, classes: [0, 36, 52] },
        ],
        cultures: ['LATIN', 'GERMANIC', 'CENTRAL', 'BASHU', 'JIANGNAN', 'WEST_ASIA'],
    },

    // ── 射手护甲线：弓箭手0 / 散兵23 / 🔴 弓骑36 / 火枪44 ──────────────────
    {
        id: 'padded_archer', name: '软垫甲', de: 'Padded Archer Armor', year: null,
        basis: '织物／皮质轻甲',
        effects: [
            { attr: 'meleeArmor', op: 'add', value: 1, classes: [0, 23, 36, 44] },
            { attr: 'pierceArmor', op: 'add', value: 1, classes: [0, 23, 36, 44] },
        ],
        cultures: null,
    },
    {
        id: 'leather_archer', name: '皮甲', de: 'Leather Archer Armor', year: 800,
        basis: '硬化皮甲工艺',
        effects: [
            { attr: 'meleeArmor', op: 'add', value: 1, classes: [0, 23, 36, 44] },
            { attr: 'pierceArmor', op: 'add', value: 1, classes: [0, 23, 36, 44] },
        ],
        cultures: null,
    },
    {
        id: 'ring_archer', name: '环甲', de: 'Ring Archer Armor', year: 1300,
        basis: '环片复合甲',
        effects: [
            { attr: 'meleeArmor', op: 'add', value: 1, classes: [0, 23, 36, 44] },
            { attr: 'pierceArmor', op: 'add', value: 2, classes: [0, 23, 36, 44] },
        ],
        cultures: ['CENTRAL', 'BASHU', 'JIANGNAN', 'WEST_ASIA', 'LATIN'],
    },

    // ── 附加四条 ──────────────────────────────────────────────────────────
    {
        id: 'husbandry', name: '畜牧', de: 'Husbandry', year: 477,
        basis: '马镫在南北朝定型并西传，骑兵机动力质变',
        effects: [{ attr: 'speed', op: 'mul', value: 1.1, classes: [12, 23, 36, 47] }],
        cultures: null,
    },
    {
        id: 'bloodlines', name: '血统', de: 'Bloodlines', year: -101,
        basis: '汉武帝得大宛汗血马，良种马育种',
        effects: [{ attr: 'hp', op: 'add', value: 20, classes: [12, 23, 36, 47] }],
        cultures: ['STEPPE', 'CENTRAL_ASIA', 'WESTERN', 'TIBET', 'HEXI'],
    },
    {
        id: 'thumb_ring', name: '拇指环', de: 'Thumb Ring', year: 1206,
        basis: '蒙古式拇指扣弦＋扳指，骑射速率跃升',
        // DE 还含 accuracy+100%，我们的五维没有命中率字段，故只落装填
        effects: [{ attr: 'reload', op: 'mul', value: 0.85, classes: [0, 36] }],
        cultures: [...HORSE_ARCHER_CULTURES, 'CENTRAL'],
    },
    {
        id: 'parthian_tactics', name: '安息战术', de: 'Parthian Tactics', year: -53,
        basis: '卡莱战役，帕提亚回马射战术定名',
        // DE 还含「对长枪类(27) 攻击 +2」，属加成伤害表，本期不落
        effects: [
            { attr: 'meleeArmor', op: 'add', value: 1, classes: [36] },
            { attr: 'pierceArmor', op: 'add', value: 2, classes: [36] },
        ],
        cultures: HORSE_ARCHER_CULTURES,
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
        label: '甲', hint: '护甲：步甲｜马铠｜射手甲', split: 3,
        ids: [
            'scale_mail', 'chain_mail', 'plate_mail',
            'scale_barding', 'chain_barding', 'plate_barding',
            'padded_archer', 'leather_archer', 'ring_archer',
        ],
    },
    { label: '射', hint: '箭术·远程攻击与射程', ids: ['fletching', 'bodkin', 'bracer'] },
    { label: '术', hint: '畜牧·血统·拇指环·安息战术', ids: ['husbandry', 'bloodlines', 'thumb_ring', 'parthian_tactics'] },
];

/** 取某年、某文化区已解锁的全部科技（year=null 恒解锁） */
export function getUnlockedTechs(year: number, culture: RegionType): MilitaryTech[] {
    return MILITARY_TECHS.filter(
        (t) => (t.year === null || year >= t.year) && (t.cultures === null || t.cultures.includes(culture)),
    );
}
