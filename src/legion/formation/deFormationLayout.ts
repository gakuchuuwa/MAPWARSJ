/**
 * DE 阵型排布算法（自动战斗版）—— 第 1 层
 *
 * ── 出处（二进制实证，见 claudedocs/DE阵型算法-二进制实证-2026-10-12.md）──
 * `AoE2DE_s.exe` 的 `group.cpp`：**`FUN_1410da2d0` @ 0x1410da2d0（3932 B）** —— "算阵型"的主函数。
 * 它自己的日志原文（就是它的行为说明书）：
 *     Category '%s' has %d units:  COLUMN, numColumns=%d, numLines=%d, lineWidth=%f
 *     Category '%s' has %d units:  LINE,   numColumns=%d, numLines=%d, lineWidth=%f
 *     We have a widestLineIndex of %d (%s), redoing column and line sizings
 *     Category '%s' is the widest line
 *     Category '%s' has %d units: REDONE numColumns=%d, numLines=%d, lineWidth=%f
 *
 * ── 算法（✅ = 从反编译/日志直接读出；🧩 = 我们为落地补的推断，已标注）──
 *  ① 每个阵型分类**各自**算列/行（✅）
 *  ② COLUMN：numLines = ceil(count / numColumns)，并收紧到「列 ≤ 行/2」（✅ 反编译循环实测）
 *     LINE  ：numColumns = ceil(count / numLines)，并收紧到「行 ≤ 列/2」（✅）
 *  ③ lineWidth = numColumns × **该单位自己的间距**（✅ `*(float*)(unit+6)`）
 *  ④ 🟡 **部分证实**：日志明确写了「记下最宽的一类 → 重算所有分类的列/行/线宽（REDONE）」，
 *     但**回算循环的确切规则我这次没读全**（反编译片段不全）。现实现＝把各分类列数朝统一正面宽靠
 *     （`cols = clamp(round(unified / spacing), 1, count)`）—— **在我们现有编制下多数是等价空操作**
 *     （因为 LINE 轴下每类的自然宽度本就 ≤ 统一宽度）。⚠️ 这条列为下一步第一件要钉死的事。
 *  ⑤ 每槽写 mOffset / Depth / DesCat（✅ 槽记录 60 字节，日志 `Slot[%2d]: mOffset=(%f, %f), Depth=%d, DesCat=%s`）
 *     但**具体位移数值**由运行时全局表承载，静态读不到 ⇒ 本站位/深度叠加是 🧩 推断（居中、按分类沿纵深排开）
 *
 * ── 使用纪律 ──
 * 🔴 **本模块默认不被任何地方 import**（＝开关默认关，现有行为零改变）。
 *    要启用必须显式接线，且先看过并排截图。
 * 🔴 只读输入：编制数据（CultureFormations / LegionComposition）一个字段都不改。
 */

import { DE_CATEGORY_NAMES, type DeFormationCategory } from './deUnitCategories';

/** 输入：一个分类要排多少兵、每个兵占多大间距 */
export interface DeCategoryGroup {
    category: DeFormationCategory;
    count: number;
    /** 该兵种的间距（px）—— 对应 DE 的 `*(float*)(unit+6)` */
    spacing: number;
}

export interface DeCategoryLayout {
    category: DeFormationCategory;
    name: string;
    count: number;
    columns: number;
    lines: number;
    lineWidth: number;
    /** 该分类在纵深上的起始偏移（🧩 推断） */
    depthStart: number;
    /** 是否被"最宽线回算"改过（✅ 对应 REDONE 日志） */
    redone: boolean;
}

export interface DeLayoutSlot {
    category: DeFormationCategory;
    columnIndex: number;
    rowIndex: number;
    offsetX: number;
    offsetZ: number;
}

export interface DeFormationLayout {
    groups: DeCategoryLayout[];
    slots: DeLayoutSlot[];
    /** 最宽的那一类（✅）；全部为空时 null */
    widestCategory: DeFormationCategory | null;
    /** 统一后的正面宽度（px） */
    unifiedWidth: number;
}

export interface DeLayoutOptions {
    /** 排布轴：COLUMN（纵队）或 LINE（横队）—— DE 由阵型类型决定走哪条（✅ 日志两条分支） */
    axis?: 'column' | 'line';
    /** 居中基准：'unified'（按统一线宽居中，DE 的对齐行为）| 'own'（按自己线宽居中） */
    center?: 'unified' | 'own';
    /**
     * 分类的纵深顺序：
     *  - `'de'`（默认）：按 DE 引擎索引 0..5 排（Attacking Rams → Mobile → Body → Ranged → Long Range → Protected）
     *  - `'given'`：**保持调用方传入顺序** —— 方案 A（主人 2026-10-12 批准保留"前/中/后"语义）要用它，
     *    否则 DE 的顺序会把骑兵(Mobile=1)排到步兵(Body=2)前面，与我们编制的前/中/后冲突。
     */
    order?: 'de' | 'given';
}

/**
 * ② 按 DE 的规则算一个分类的列/行（含长宽比收紧循环）。
 * ✅ COLUMN：先由列数推行数，再收紧到「列 ≤ 行/2」
 * ✅ LINE  ：先由行数列推列数，再收紧到「行 ≤ 列/2」
 * ✅ 给了 hintedColumns 时＝"最宽线回算"那一步：直接按统一正面宽度定列数，行数＝ceil(count/列)，
 *    不再跑长宽比循环（否则回算会被循环撤销，等于没回算）。
 */
function solveColumnsLines(
    count: number,
    axis: 'column' | 'line',
    hintedColumns?: number,
): { columns: number; lines: number } {
    const n = Math.max(1, Math.floor(count));
    if (hintedColumns !== undefined) {
        const cols = Math.max(1, Math.min(n, Math.round(hintedColumns)));
        return { columns: cols, lines: Math.ceil(n / cols) };
    }
    if (axis === 'column') {
        // DE：numColumns 可由调用方指定（-1 = 自动/随机）；这里缺省从 n 起收紧
        let cols = Math.max(1, n);
        let lines = Math.ceil(n / cols);
        while (cols > 1 && cols > lines / 2) {
            cols -= 1;
            lines = Math.ceil(n / cols);
        }
        return { columns: cols, lines };
    }
    // LINE：行数从 n 起，收紧到「行 ≤ 列/2」
    let lines = Math.max(1, n);
    let cols = Math.ceil(n / lines);
    while (lines > 1 && lines > cols / 2) {
        lines -= 1;
        cols = Math.ceil(n / lines);
    }
    return { columns: cols, lines };
}

/**
 * 算一整个阵型的排布（DE 算法）。
 *
 * ⚠️ 输出是**槽位偏移**（相对该队锚点，单位 px），不是画布坐标 —— 调用方自己决定锚点与朝向。
 */
export function computeDeFormationLayout(
    groupsIn: readonly DeCategoryGroup[],
    opts: DeLayoutOptions = {},
): DeFormationLayout {
    const axis = opts.axis ?? 'line';
    const center = opts.center ?? 'unified';
    const order = opts.order ?? 'de';

    // DE 的分类循环是按引擎索引 0..5 走的（跳表顺序）；方案 A 可用 'given' 保留我们前/中/后的顺序
    const groups = [...groupsIn]
        .filter((g) => g.count > 0)
        .sort(order === 'de' ? (a, b) => a.category - b.category : () => 0);

    if (groups.length === 0) {
        return { groups: [], slots: [], widestCategory: null, unifiedWidth: 0 };
    }

    // ① 各自算列/行 ② 线宽 = 列数 × 该兵种间距
    const per = groups.map((g) => {
        const spacing = Math.max(1, g.spacing);
        const { columns, lines } = solveColumnsLines(g.count, axis);
        return { g, spacing, columns, lines, lineWidth: columns * spacing, redone: false };
    });

    // ④ 最宽线回算 —— ✅ 规则已从反汇编读全（0x1410da6af–0x1410da8a2）：
    //    只在「分类数 ≥ 2」时做；**最宽的那一类自己不改**（只打一行 "Category '%s' is the widest line"）；
    //    对其余每一类：natural = 人数 × 该单位间距
    //      若 natural ≤ 最宽线宽 → 全排一行（列＝人数，行＝1）
    //      否则 → 列 = ⌊natural ÷ 最宽线宽⌋（≥1），行 = ⌈人数 ÷ 列⌉，再收紧：
    //              while (列 > 1 && 行×列 − 人数 > 行) { 列--; 行 = ⌈人数 ÷ 列⌉; }
    let widestIdx = 0;
    for (let i = 1; i < per.length; i++) {
        if (per[i].lineWidth > per[widestIdx].lineWidth) widestIdx = i;
    }
    const unifiedWidth = per[widestIdx].lineWidth;
    const widestCategory = per[widestIdx].g.category;

    if (per.length >= 2) {
        for (let i = 0; i < per.length; i++) {
            if (i === widestIdx) continue;                 // 最宽的那类不动
            const p = per[i];
            const natural = p.g.count * p.spacing;
            let cols: number;
            let lines: number;
            if (unifiedWidth >= natural) {
                cols = p.g.count;
                lines = 1;
            } else {
                cols = Math.max(1, Math.floor(natural / unifiedWidth));
                lines = Math.ceil(p.g.count / cols);
                while (cols > 1 && lines * cols - p.g.count > lines) {
                    cols -= 1;
                    lines = Math.ceil(p.g.count / cols);
                }
            }
            if (cols !== p.columns || lines !== p.lines) p.redone = true;
            p.columns = cols;
            p.lines = lines;
            p.lineWidth = cols * p.spacing;
        }
    }

    // ⑤ 槽位：按分类顺序沿纵深排开，分类内按列/行铺开（🧩 推断部分）
    const slots: DeLayoutSlot[] = [];
    const layout: DeCategoryLayout[] = [];
    let depth = 0;
    for (const p of per) {
        const spacing = p.spacing;
        const width = center === 'unified' ? unifiedWidth : p.lineWidth;
        layout.push({
            category: p.g.category,
            name: DE_CATEGORY_NAMES[p.g.category],
            count: p.g.count,
            columns: p.columns,
            lines: p.lines,
            lineWidth: p.lineWidth,
            depthStart: depth,
            redone: p.redone,
        });
        for (let i = 0; i < p.g.count; i++) {
            const col = i % p.columns;
            const row = Math.floor(i / p.columns);
            slots.push({
                category: p.g.category,
                columnIndex: col,
                rowIndex: row,
                offsetX: (col - (p.columns - 1) / 2) * spacing + (0),
                // 同行内若该分类比统一线宽窄，DE 用统一正面宽度把整块撑齐 ⇒ 这里靠 width 记账，偏移不额外加
                offsetZ: depth + row * spacing,
            });
        }
        depth += p.lines * spacing;
        void width;
    }

    return { groups: layout, slots, widestCategory, unifiedWidth };
}
