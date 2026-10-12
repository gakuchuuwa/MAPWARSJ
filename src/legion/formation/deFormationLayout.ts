/**
 * DE 阵型排布算法（自动战斗版）
 *
 * ── 出处（二进制实证）──
 * 主函数 `AoE2DE_s.exe` **`FUN_1410DA2D0` @ 0x1410DA2D0（3932 B）= "算阵型"**。
 * 全部地址 = 解密副本 `C:\tools\rea-env\AoE2DE_s.exe` 的 VA（imagebase 0x140000000）。
 *
 * 两份实证报告（先读它们，本文件只是它们的落地）：
 *   ① `claudedocs/DE阵型算法-二进制实证-2026-10-12.md`（202 行，第一刀）
 *   ② `claudedocs/DE阵型布局与成阵过程-二进制实证-2026-10-12.md`（第二刀，682 行；
 *      含**对第一刀的 4 处修正**——本文件按第二刀写，不按第一刀）
 *
 * ── 🔴 第二刀修正的 4 处（第一刀写错的，别照抄）──
 *   ① 距离不是「单位的 unit+6 字段」：**`step = 2 × 单位碰撞半径`**
 *      （`0x1410D4418 call 0x1410EEF50` → `0x1410D4420 addss xmm0,xmm0` → `0x1410D442A movss [rbx+0x30]`；
 *        半径内部 `type[+0x358] × obj[+0x78]`，同一分类取**最大值**）。
 *      `lineWidth = 列数 × step`（三处：`0x1410DA4FC` / `0x1410DA60B` / `0x1410DA672`）。
 *   ② COLUMN / LINE 不是「二选一」，而是由**调用方给的列数**分派：
 *      `param_3 >= 0 → COLUMN`（打 `0x1432A0570`）、`param_3 == -1 → LINE`（打 `0x1432A05D0`）。
 *   ③ **纵深是跨分类不重置的累加器**：`depthAccum` 只在布局开始清一次 0（`0x1410DAAE8`），
 *      之后**每写完一行** `+= step`（`0x1410DB01F`）；循环回下一个分类时**不清零**
 *      ⇒ 分类 i 起始纵深 = Σ_{j<i}(行数_j × step_j)，**严格按分类索引 0..5 向后叠**。
 *      槽位 `[+0x14] = Depth`（该行起始累计纵深，`0x1410DADA8`）、`[+0x18] = 0.5 × step`（`0x1410DADB5`）。
 *   ④ 跳表 `0x1410DD01C` / `0x1410D7448` 的表项是 **rel32 指向名字串数组**（不是代码）；
 *      结论（9 种阵型 / 6 类分类、索引次序）仍成立，但第一刀给的跳转目标地址是错的。
 *
 * ── 算法（✅ = 反汇编直接读出；🧩 = 我们为落地补的推断，已逐条标注）──
 *   ① 每个分类**各自**算列/行（✅）
 *   ② 列/行推导（✅ `0x1410DA44D`–`0x1410DA4F4` COLUMN；`0x1410DA55D`– LINE）
 *   ③ 「最宽线回算」（REDONE）：门 = **总行数 > 1**（`0x1410DA276 cmp r14d,1 / jle`）；
 *      最宽的那一类自己不改；其余 `行数 = max(1, trunc(sqrt(人数×step ÷ 最宽线宽)))`、
 *      `列数 = ceil(人数 ÷ 行数)`，再收紧「最后一行空槽数不得超过一行有多少槽」（✅）
 *   ④ 写槽（✅ `slot[+0x04]=偏移.x`、`[+0x08]=偏移.z`、`[+0x14]=Depth`、`[+0x18]=0.5×step`）
 *   ⑤ 🧩 **偏向（bias）项的步长换算**：DE 用「每 2 个子类型 = 1 个单位步」的旋转折半
 *      （`uVar11` 折半后再旋转），本实现按 `uVar11` 取整数步；**分类内 0..n-1 的次序一致**，
 *      但左右对称的槽位相位可能与 DE 差一步 —— 见文末「待办」。
 *   ⑥ 🧩 偏向项 `bias = 2.5 − 列数 ÷ 总行数`（`0x143201174` = 2.5）按 `偏移.z` 的符号加减（✅ 形式已读出）
 *
 * ── 使用纪律 ──
 * 🔴 **本模块默认不被任何地方 import**（＝开关默认关，现有行为零改变）。
 *    要启用必须显式接线，且先看过并排截图。
 * 🔴 只读输入：编制数据（CultureFormations / LegionComposition）一个字段都不改；
 *    兵种 → 分类的映射见 `deUnitCategories.ts`（主人 2026-10-12 批准的「方案 A」）。
 * 🔴 输出是**槽位偏移**（相对该队锚点，单位与输入同一把尺 = px），不是画布坐标 —— 调用方自己决定锚点与朝向。
 */

import { DE_CATEGORY_NAMES, type DeFormationCategory } from './deUnitCategories';

/** 输入：一个分类要排多少兵、每个兵占多大间距 */
export interface DeCategoryGroup {
    category: DeFormationCategory;
    /**
     * 该分类的步距 `step`（px）—— DE 里 = **2 × 该分类中碰撞半径最大的单位的半径**
     * （✅ `0x1410D4420 addss xmm0,xmm0`）。取法见 `computeStepFromRadius()`。
     *
     * 🔴 **与 `spacing` 二选一**：`step` 是 DE 实证口径（2×半径），`spacing` 是 2026-10-12 第一刀
     *    的旧写法（当时误以为间距是「单位自己的一个字段」，`UNIT_PX × sz`）。两者**不同源、值也不同**：
     *    以步兵为例，`step`(2×半径) = 16px，而 `spacing`(UNIT_PX×sz) = 64px —— **差 4 倍**。
     *    ⇒ 过渡期两个键都认（免于把接线方的代码打红），但**谁用 `spacing` 谁就是在用第一刀的旧口径**；
     *    要真按 DE 排，请改用 `computeStepFromRadius(半径表)` 得到 `step`。见文末「待办」。
     */
    step?: number;
    /** @deprecated 第一刀旧口径（`UNIT_PX × sz`）。等接线方迁移到 `step` 后删掉本键。 */
    spacing?: number;
    /** 该分类的兵数（✅ `rsi[+0x14]`） */
    count: number;
}

export interface DeCategoryLayout {
    category: DeFormationCategory;
    name: string;
    count: number;
    /** 列数（正面宽，DE 日志 `numColumns`） */
    columns: number;
    /** 行数（纵深方向，DE 日志 `numLines`） */
    lines: number;
    /** 线宽 = 列数 × step（DE 日志 `lineWidth`） */
    lineWidth: number;
    /** 该分类在纵深上的起始偏移（✅ = depthAccum，跨分类累加） */
    depthStart: number;
    /** 是否被「最宽线回算」改过（✅ 对应 REDONE 日志） */
    redone: boolean;
}

export interface DeLayoutSlot {
    category: DeFormationCategory;
    columnIndex: number;
    lineIndex: number;
    /** 槽位在阵型局部坐标系里的 x（列方向，✅ slot[+0x04]） */
    offsetX: number;
    /** 槽位的 z（纵深方向，含偏向项，✅ slot[+0x08]） */
    offsetZ: number;
    /** 该行起始的累计纵深（✅ slot[+0x14]） */
    depth: number;
    /** 进入下一行的纵深增量 = 0.5 × step（✅ slot[+0x18]） */
    depthStep: number;
}

export interface DeFormationLayout {
    groups: DeCategoryLayout[];
    slots: DeLayoutSlot[];
    /** 最宽的那一类（✅ `widestCat`）；全部为空时 null */
    widestCategory: DeFormationCategory | null;
    /** 最宽线宽（✅ `maxLineWidth`） */
    maxLineWidth: number;
    /** 正面统一宽度（px）＝ 最宽的线宽 */
    unifiedWidth: number;
    /** 总行数（✅ `totalLines`；REDONE 的门就是它 > 1） */
    totalLines: number;
    /** 布局结束时的累计纵深 */
    depthTotal: number;
}

export interface DeLayoutOptions {
    /**
     * 排布轴（DE 由**调用方给的列数**分派，不是二选一）：
     *  - `'line'`（默认）＝ `param_3 == -1`：不打列数，走 LINE 分支（✅ 本次实测的调用点走这条）
     *  - `'column'` ＝ `param_3 >= 0`：`columnHint` 打了列数，走 COLUMN 分支
     */
    axis?: 'line' | 'column';
    /** COLUMN 分支的「调用方指定列数」（DE 的 `param_3`）；缺省时按 `param_3 == -1` 走 LINE */
    columnHint?: number;
    /**
     * 分类的纵深顺序：
     *  - `'de'`（默认）：按 DE 引擎索引 0..5 排（Attacking Rams → Mobile → Body → Ranged → Long Range → Protected）
     *  - `'given'`：**保持调用方传入顺序** —— 方案 A（主人 2026-10-12 批准保留「前/中/后」语义）要用它，
     *    否则 DE 的顺序会把骑兵(Mobile=1)排到步兵(Body=2)前面，与我们编制的前/中/后冲突。
     */
    order?: 'de' | 'given';
    /**
     * 偏向项开关（DE 的 `param_7`；✅ 本次实测调用点传 **1** = 开）。
     * 开 = 更宽的线整行前移 `bias = 2.5 − 列数 ÷ 总行数`；关 = 干脆的矩形。
     */
    bias?: boolean;
}

/**
 * ✅ DE 的步距 = 2 × 单位碰撞半径（`0x1410D4420 addss xmm0,xmm0`）。
 * 同一分类里取**最大**半径（`0x1410D43DE cmp [rdi],ecx` 是取大）。
 *
 * @param radii 该分类各单位的碰撞半径（px，与 `UNIT_RADIUS` 同一把尺）
 */
export function computeStepFromRadius(radii: readonly number[]): number {
    let max = 0;
    for (const r of radii) if (r > max) max = r;
    return 2 * max;
}

/**
 * ✅ 线宽 = 列数 × step。
 */
export function computeLineWidth(columns: number, step: number): number {
    return columns * step;
}

/**
 * 取该分类的步距：优先 DE 实证口径 `step`，回退第一刀旧口径 `spacing`（两者不同源，见 `DeCategoryGroup`）。
 */
function stepOf(g: DeCategoryGroup): number {
    const v = g.step ?? g.spacing;
    if (v === undefined) {
        throw new Error(`[deFormationLayout] 分类 ${g.category} 既没给 step 也没给 spacing —— 间距不许猜`);
    }
    return Math.max(0, v);
}

interface PerCategory {
    group: DeCategoryGroup;
    /** 分类内单位次序（DE 的两个子类型表 `r14[+0x38+u*4]` / `r14[+0x100+subType*4]` 在静态读不到时的 🧩 退路） */
    unitOrder: readonly number[];
    step: number;
    columns: number;
    lines: number;
    lineWidth: number;
    redone: boolean;
}

/**
 * ② 一个分类的列/行推导（✅ `0x1410DA44D`–`0x1410DA4F4` / `0x1410DA55D`–）。
 *
 * COLUMN（调用方给了列数 `param_3`）：
 *   列数 = 人数 ÷ param_3（≥1）→ 行数 = ceil(人数 ÷ 列数)
 *   while (行数 ≤ 列数/2) { 列数--；若列数 < 1 → {列数=1; 行数=人数; break}；行数 = ceil(...)；若 行数 > 列数/2 → break }
 * LINE（`param_3 == -1`）：
 *   行数从 1 起 → 列数 = ceil(人数 ÷ 行数)，同样带「行 ≤ 列/2」的收紧
 */
function solveColumnsLines(count: number, opts: DeLayoutOptions): { columns: number; lines: number } {
    const n = Math.max(1, Math.floor(count));

    if (opts.axis === 'column') {
        const hint = Math.max(1, Math.floor(opts.columnHint ?? n));
        let columns = Math.max(1, Math.floor(n / hint));
        let lines = Math.ceil(n / columns);
        while (lines <= columns / 2) {
            columns -= 1;
            if (columns < 1) {
                columns = 1;
                lines = n;
                break;
            }
            lines = Math.ceil(n / columns);
            if (lines > columns / 2) break;
        }
        return { columns, lines };
    }

    // LINE（`param_3 == -1`）：与 COLUMN 对偶 —— 先由人数起一个列数，再收紧「行 ≤ 列/2」。
    // 🧩 第二刀的伪代码在 `count / numColumns` 这一句上写重了（同一句既有「列/行对调」的修正说明、
    //    又保留第一刀的 `ceil(count/numLines)`），故本分支按 **COLUMN 的对偶**实现：
    //    COLUMN 是「列不能比行宽」（列 > 行/2 就减列），LINE 就是「行不能比列高」（行 > 列/2 就减行）。
    //    依据：`CMP EDX,0x8`/跳表与两分支共用的 `lineWidth = numColumns × step`（三处一致）。
    let columns = Math.max(1, n);
    let lines = Math.ceil(n / columns);
    while (lines > 1 && lines > columns / 2) {
        lines -= 1;
        columns = Math.ceil(n / lines);
    }
    return { columns, lines };
}

/**
 * 算一整个阵型的排布（DE 算法）。
 *
 * ⚠️ 输出是**槽位偏移**（相对该队锚点，px），不是画布坐标 —— 调用方自己决定锚点与朝向。
 * ⚠️ `step` 由调用方给（DE 是从单位半径现算的，见 `computeStepFromRadius`）—— 本函数不猜间距。
 */
export function computeDeFormationLayout(
    groupsIn: readonly DeCategoryGroup[],
    opts: DeLayoutOptions = {},
): DeFormationLayout {
    const order = opts.order ?? 'de';
    const withBias = opts.bias ?? true;

    // DE 的分类循环是按引擎索引 0..5 走的（跳表顺序）；方案 A 可用 'given' 保留我们前/中/后的顺序
    const groups = [...groupsIn]
        .filter((g) => g.count > 0)
        .sort(order === 'de' ? (a, b) => a.category - b.category : () => 0);

    if (groups.length === 0) {
        return {
            groups: [], slots: [], widestCategory: null,
            maxLineWidth: 0, unifiedWidth: 0, totalLines: 0, depthTotal: 0,
        };
    }

    // 🧩 分类内单位次序 = 传入顺序的下标（DE 用的是分类记录里那两张静态读不到的表）
    const per: PerCategory[] = groups.map((g) => {
        const step = stepOf(g);
        const unitOrder = Array.from({ length: Math.max(1, Math.floor(g.count)) }, (_, i) => i);
        const { columns, lines } = solveColumnsLines(g.count, opts);
        return {
            group: g, unitOrder, step, columns, lines,
            lineWidth: computeLineWidth(columns, step), redone: false,
        };
    });

    // ① 最宽线（✅ 0x1410DA66A..0x1410DA68D）
    let widestIdx = 0;
    for (let i = 1; i < per.length; i++) {
        if (per[i].lineWidth > per[widestIdx].lineWidth) widestIdx = i;
    }

    // 总行数（✅ 0x1410DA829 累加）—— 它是 REDONE 的门
    let totalLines = 0;
    for (const p of per) totalLines += p.lines;

    // ③ 最宽线回算（✅ 门 = widestCat != -1 && totalLines > 1；0x1410DA276）
    if (totalLines > 1) {
        const maxLineWidth = per[widestIdx].lineWidth;
        for (let i = 0; i < per.length; i++) {
            if (i === widestIdx) continue;                 // 最宽的那一类自己不改（✅）
            const p = per[i];
            const natural = p.group.count * p.step;
            let columns: number;
            let lines: number;
            if (maxLineWidth >= natural) {
                columns = p.group.count;
                lines = 1;
            } else {
                lines = Math.max(1, Math.trunc(Math.sqrt(natural / maxLineWidth)));
                columns = Math.ceil(p.group.count / lines);
                while (columns * lines - p.group.count > columns) {
                    lines -= 1;
                    if (lines <= 1) break;
                    columns = Math.ceil(p.group.count / lines);
                }
            }
            if (columns !== p.columns || lines !== p.lines) p.redone = true;
            p.columns = columns;
            p.lines = lines;
            p.lineWidth = computeLineWidth(columns, p.step);
        }
        totalLines = 0;
        for (const p of per) totalLines += p.lines;
    }

    const maxLineWidth = per[widestIdx].lineWidth;

    // ⑤ 写槽：按分类顺序沿纵深**跨分类累加**（✅ depthAccum 不重置）
    const slots: DeLayoutSlot[] = [];
    const layout: DeCategoryLayout[] = [];
    let depthAccum = 0;
    for (const p of per) {
        const step = p.step;
        const depthStart = depthAccum;
        layout.push({
            category: p.group.category,
            name: DE_CATEGORY_NAMES[p.group.category] ?? 'Unknown',
            count: p.group.count,
            columns: p.columns,
            lines: p.lines,
            lineWidth: p.lineWidth,
            depthStart,
            redone: p.redone,
        });

        for (let line = 0; line < p.lines; line++) {
            const depth = depthAccum;
            const depthStep = 0.5 * step;
            for (let k = 0; k < p.columns; k++) {
                const idx = line * p.columns + k;
                if (idx >= p.group.count) break;           // 尾行不满（DE 以「最后一行空槽 ≤ 一行槽数」收紧）
                // 🧩 分类内次序：DE 按子类型表轮转，本实现取分类内下标
                const uVar11 = p.unitOrder[idx % p.unitOrder.length];
                const offsetX = (uVar11 - (p.columns - 1) / 2) * step;
                let offsetZ = depth;
                if (withBias) {
                    // ✅ bias = 2.5 − 列数 ÷ 总行数（0x143201174 = 2.5），按 z 的符号加减
                    const bias = 2.5 - p.columns / Math.max(1, totalLines);
                    offsetZ += offsetZ >= 0 ? bias : -bias;
                }
                slots.push({
                    category: p.group.category,
                    columnIndex: k,
                    lineIndex: line,
                    offsetX,
                    offsetZ,
                    depth,
                    depthStep,
                });
            }
            depthAccum += step;                            // ✅ 每写完一行 += step
        }
    }

    return {
        groups: layout,
        slots,
        widestCategory: per[widestIdx].group.category,
        maxLineWidth,
        unifiedWidth: maxLineWidth,
        totalLines,
        depthTotal: depthAccum,
    };
}

/**
 * 待办（写在代码里，防止下次又猜）：
 * [ ] 🧩⑤ 偏向项的「子类型折半旋转」（DE 把 `uVar11` 折半后才旋转，`0x1410DACD2`–`0x1410DADCD`）
 *     —— 现在按整数步取，左右相位可能与 DE 差一步；需对着一条真机阵型量。
 * [ ] 🧩 `unitOrder`：DE 用的是分类记录 `+0x38` / `+0x100` 两张**静态读不到**的表
 *     （写于 `0x1410DAF6A` 一带），现在退化成「分类内下标」；要 100% 一致得读那两张表。
 * [ ] `slot[+0x34] = 1`、`slot[+0x2C] = DesCat`、`slot[+0x24] = refreshTick` 属于**槽位记录**，
 *     不在本模块（本模块只出偏移）；要做「成阵过程」时另立一层。
 */
