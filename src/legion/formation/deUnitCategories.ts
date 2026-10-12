/**
 * 兵种 → DE 阵型分类（6 类）映射
 *
 * ── 依据（二进制实证，见 claudedocs/DE阵型算法-二进制实证-2026-10-12.md）──
 * ① **分类名与索引**：跳表实读 `AoE2DE_s.exe` 0x1410D7448（`CMP EBX,0x5` + 6 项跳表，默认 Unknown）：
 *      0 = Attacking Rams / 1 = Mobile / 2 = Body / 3 = Ranged / 4 = Long Range / 5 = Protected
 * ② **DE 的分类来源不是"按兵种类别现算"**：`group.cpp` 的 `FUN_1410d95f0`（0x1410d95f0, 920 B）反编译显示，
 *    它读的是「**单位类型数据里的一个 0..6 字段**」，再 `switch` 映射成上面的分类：
 *      case 0 / 5 → Protected(5)   case 1 → Mobile(1)   case 2 → Body(2)
 *      case 3 → Ranged(3)          case 4 → Long Range(4)   case 6 → Attacking Rams(0)   其它 → -1
 *    （另有少数硬编码特例：带 'F' 类型位 + 某标志 → 5；若干特定单位 id → 0）
 *    ⇒ **要 100% 一致，就得读 DE dat 的同一个字段**（尚未定位到 dat 的哪个字段 → 见本文件末"待办"）。
 *
 * ── 本表的定位 ──
 * 🔴 **主人 2026-10-12 批准"方案 A"**：保留我们编制的**前/中/后三排**语义，
 *    按**兵种语义**把编制里的兵映射到 DE 这 6 类，供 DE 的排布算法分组用。
 *    ⇒ 本表**不是** DE dat 字段的复刻，是"我们的语义 → DE 的 6 类"的桥。
 *    ⇒ 编制数据（CultureFormations / LegionComposition）**一个数都不改**。
 *
 * ⚠️ 本文件是纯数据/纯函数叶子模块，不 import 任何游戏系统，零副作用。
 */

/** DE 的 6 个阵型分类（索引＝引擎跳表索引，不是我们发明的） */
export type DeFormationCategory = 0 | 1 | 2 | 3 | 4 | 5;

/** 索引 → 名字（与跳表实读一致） */
export const DE_CATEGORY_NAMES: readonly string[] = [
    'Attacking Rams',
    'Mobile',
    'Body',
    'Ranged',
    'Long Range',
    'Protected',
];

/** 稳定键（日志/调试用，避免中文串进代码） */
export const DE_CATEGORY_KEYS: Readonly<Record<DeFormationCategory, string>> = {
    0: 'attackingRams',
    1: 'mobile',
    2: 'body',
    3: 'ranged',
    4: 'longRange',
    5: 'protected',
};

/** 攻城器械（→ Attacking Rams）：按兵种键/名的英文词根判，与 DE 的硬编码特例无关，是我们的语义判据 */
const SIEGE_PATTERN = /ram|mangonel|scorpion|onager|trebuchet|bombard|cannon|ballista|siege|catapult|petard/;

/** 非战斗单位（→ Protected）：僧侣/村民/贸易车船等 */
const PROTECTED_PATTERN = /monk|priest|villager|trade_|trader|healer|relic|missionary|shepherd/;

/**
 * 长程（→ Long Range）**显式白名单**。
 *
 * 🔴 默认空集 = 不启用该分类。理由：DE 里"远程"与"长程"的界线由那个 0..6 数据字段决定，
 *    我们**没有依据**凭空定阈值（血训：绝不许为了凑格式编判据）。
 *    主人若要启用，把兵种键（如 'scorpion' / 'onager' / 'bombard'）加进来即可 —— 一次只做一件。
 */
export const LONG_RANGE_KEYS: ReadonlySet<string> = new Set<string>([]);

/**
 * 把一个兵种判到 DE 的 6 类之一（方案 A：语义映射）。
 *
 * @param key 兵种键（与 WAR_TYPES 键一致）
 * @param cls WAR_TYPES[key].cls（'melee' | 'cav' | 'ranged'）；缺失时按 Body 兜底
 */
export function categorizeUnit(
    key: string,
    cls: 'melee' | 'cav' | 'ranged' | undefined,
): DeFormationCategory {
    const k = key.toLowerCase();
    if (LONG_RANGE_KEYS.has(k)) return 4;          // Long Range（默认白名单为空）
    if (SIEGE_PATTERN.test(k)) return 0;           // Attacking Rams（攻城优先于其 cls）
    if (PROTECTED_PATTERN.test(k)) return 5;       // Protected
    if (cls === 'cav') return 1;                   // Mobile
    if (cls === 'ranged') return 3;                // Ranged
    return 2;                                      // Body（近战 / 未知兜底）
}

/**
 * 待办（写在代码里，防止下次又猜）：
 * [ ] 定位 DE dat 里那个 0..6 字段（反汇编 FUN_1410d95f0 拿准 MOVZX 的 disp32 →
 *     再与本机 empires2_x2_p1.dat 的字段表对齐）—— 做到那一步，本表可升级为"DE 字段复刻"。
 */
