/**
 * DE 官方科技树版式算法（纯函数，无副作用）。
 *
 * 来源：官方 aoe2techtree 的 `scripts/generateTechTreeJsons.py`（2026-10-14 由 Lead 逐行核对）。
 *   —— 该脚本把 DE 安装自带的 `resources/_common/dat/CivTechTrees/<CIV>.json`
 *      排成「按产出建筑分列、每列 8 行格子」的版式；官方网页就按这个 grid 画节点与连线。
 *   本文件是它的**同构移植**：同样的输入、同样的顺序、同样的判据，输出同样的格子坐标。
 *
 * 输入形状（见 public/de-techtree/trees/<CIV>.json）：
 *   buildings[] / units_techs[]，每项至少含
 *   id, age_id, node_id, building_id, link_id, link_node_type, use_type, node_type
 *
 * 输出：每个节点补上 { row, col }（= 官方 grid 的行列），以及 buildings[].grid（8 行 × N 列，
 *   格子里放节点 id 或 null），供渲染器画「建筑列」与「升级连线」。
 */

export interface TreeItem {
    id: string;
    age_id: number;
    node_id: number;
    building_id: number | null;
    link_id: number | null;
    link_node_type?: string | null;
    use_type: string;
    node_type?: string | null;
    name?: string;
    name_zh?: string;
    node_status?: string;
    picture_index?: number;
    name_string_id?: number;
    help_string_id?: number;
    draw_node_type?: string | null;
    building_in_new_column?: boolean | null;
    building_upgraded_from_id?: number | null;
    /** 由本模块写入 */
    row?: number;
    col?: number;
    /** 仅建筑节点用：8 行 × N 列的格子，格子里是节点 id 或 null（由本模块写入） */
    grid?: (string | null)[][];
    /** 数据里可能保留 DE 官方字段名（大驼峰），入口会规范化成蛇形 */
    [official: string]: any;
}

export interface TreePackage {
    civ?: string;
    buildings: TreeItem[];
    units_techs: TreeItem[];
}

const ROWS = 8;

/**
 * ⚠️ 命名口径：抽取脚本（tools/de-techtree-extract.py）**原样保留 DE 官方字段名**
 *   （`Age ID` / `Node ID` / `Building ID` / `Link ID` / `Use Type` …），而本模块早先写的是
 *   蛇形 `age_id` / `node_id`。两者必须兼容，否则行号全成 NaN（实测踩过）。
 *   下面两个助手：蛇形没有就回落到官方大驼峰名。
 */
function ageIdOf(x: any): number {
    return Number(x.age_id ?? x['Age ID'] ?? 1);
}

/** DE 官方字段名（大驼峰）→ 本模块的蛇形口径。入口调一次，下游只认蛇形。 */
const OFFICIAL_TO_SNAKE: Array<[string, string]> = [
    ['Age ID', 'age_id'],
    ['Node ID', 'node_id'],
    ['Building ID', 'building_id'],
    ['Link ID', 'link_id'],
    ['Link Node Type', 'link_node_type'],
    ['Use Type', 'use_type'],
    ['Node Type', 'node_type'],
    ['Draw Node Type', 'draw_node_type'],
    ['Node Status', 'node_status'],
    ['Picture Index', 'picture_index'],
    ['Name String ID', 'name_string_id'],
    ['Help String ID', 'help_string_id'],
    ['Building in new column', 'building_in_new_column'],
    ['Building upgraded from ID', 'building_upgraded_from_id'],
];

/** 官方字段名 → 蛇形（导出给渲染器复用，避免第二处口径） */
export function normalizeItem(x: any): void {
    for (const [official, snake] of OFFICIAL_TO_SNAKE) {
        if (x[snake] === undefined && x[official] !== undefined) x[snake] = x[official];
    }
}

/** 官方源码里的同一个判据：在建筑的 grid 里找某节点落在哪一格 */
function linkedCoords(building: TreeItem, linkedId: string): [number, number] | null {
    const g = building.grid;
    if (!g) return null;
    for (let r = 0; r < g.length; r++) {
        for (let c = 0; c < g[r].length; c++) {
            if (g[r][c] === linkedId) return [r, c];
        }
    }
    return null;
}

/** 官方 add_column：给该建筑的每一行末尾补一个 null */
function addColumn(building: TreeItem): void {
    const g = building.grid!;
    for (const row of g) row.push(null);
}

/**
 * 跑一遍官方版式算法。**会就地写回每个 item 的 row / col 与 buildings[].grid**（与官方脚本一致），
 * 同时返回同一份数据便于链式使用。
 */
export function layoutTree(pkg: TreePackage): TreePackage {
    const buildings = pkg.buildings ?? [];
    const unitsTechs = pkg.units_techs ?? [];
    for (const it of [...buildings, ...unitsTechs]) normalizeItem(it);   // 唯一口径：入口规范化
    const registry: TreeItem[] = [...buildings, ...unitsTechs];
    /** 被越界护栏夹过的节点（仅 6 个古典文明会出现；官方脚本在这些文明上直接崩） */
    const clamped: string[] = [];
    /** 产出者：与官方逐字同口径（buildings 里 node_id 命中；否则 units_techs 里同名非 Tech） */
    const homeFrom = (bldId: number | null): TreeItem | undefined =>
        buildings.find((x) => x.node_id === bldId) ??
        unitsTechs.find((x) => x.node_id === bldId && x.use_type !== 'Tech');
    for (const b of buildings) {
        b.grid = Array.from({ length: ROWS }, () => [null as string | null]);
        // 官方：row = (age_id - 1) * 2
        (b as any).row = (ageIdOf(b) - 1) * 2;
        (b as any).col = 0;
    }
    // ── 先定「建筑」的行：官方在这一趟会对建筑也做「与产出建筑同行则下移一行」，
    //    并把建筑行号写回（**建筑本体不占格**：官方输出的 grid 里没有建筑自己，只有 units_techs）。
    for (const b of buildings) {
        const homeOfB = b.building_id != null ? buildings.find((x) => x.node_id === b.building_id) : undefined;
        if (homeOfB && homeOfB !== b && (homeOfB as any).row === (b as any).row) (b as any).row += 1;
        (b as any).col = 0;
    }

    for (const item of unitsTechs) {
        // 官方：row 先由 age 定
        if (item.row == null) item.row = (ageIdOf(item) - 1) * 2;

        // 找产出者（官方：先 buildings，退到 units_techs 的非 Tech）
        let building = homeFrom(item.building_id);
        // 产出者若是「单位」（如 Fish Trap 由 Fishing Ship 造），它自己不在建筑格里 →
        // 改挂该单位所属建筑的格（渔船的 Building ID = 船坞）。否则后面读 building.grid 会崩。
        if (building && !building.grid) {
            const owner = building.building_id != null ? buildings.find((x) => x.node_id === building!.building_id) : undefined;
            if (owner) building = owner;
        }
        if (!building) { item.row = item.row ?? 0; item.col = 0; continue; }

        // 官方：若节点与产出建筑行号相同，往下挪一行
        if ((building as any).row === item.row) item.row += 1;

        let linkCoords: [number, number] | null = null;
        if (item.link_id && item.link_id !== -1) {
            let linked = registry.filter((x) => x.node_id === item.link_id);
            if (linked.length !== 1) linked = registry.filter((x) => x.node_id === item.link_id && x.building_id === item.building_id);
            if (linked.length !== 1) linked = registry.filter((x) => x.node_id === item.link_id && x.node_type !== 'Research');
            if (linked.length >= 1) linkCoords = linkedCoords(building, linked[0].id);
        }

        let lastRow = -1;
        for (let r = 0; r < ROWS; r++) {
            const g = building.grid!;
            if (g[r] && g[r][g[r].length - 1] != null) lastRow = r;
        }
        let row = item.row;
        // ⚠️ 越界护栏：官方脚本对 6 个「古典（antiquity）」文明会因 row ≥ 8 直接崩
        //    （grid[row] undefined；其官方树是另走 pre-authored 的 chronicles 数据）。
        //    我们这里夹回 0..7 并记下被夹的节点，避免整棵树挂掉。
        if (row < 0 || row >= ROWS) { clamped.push(`${item.id}: row ${row}→${Math.max(0, Math.min(ROWS - 1, row))}`); row = Math.max(0, Math.min(ROWS - 1, row)); }
        let col = building.grid![row].length - 1;
        if (linkCoords) {
            const [liRow, liCol] = linkCoords;
            // 前身所在的列可能比本行宽（各行列数不齐）→ 按需补列，别越界
            while (building.grid![row].length <= liCol) addColumn(building);
            col = liCol;
            if (item.row === liRow) {
                item.row += 1;
                row += 1;
            }
        } else {
            if (building.grid![row][building.grid![row].length - 1] != null || lastRow >= row) {
                addColumn(building);
                col += 1;
            }
        }
        // 行护栏（两条路都可能把 row 顶到 8）：夹回 0..ROWS-1 并记账
        if (row < 0 || row >= ROWS) {
            clamped.push(`${item.id}: row ${row}→${Math.max(0, Math.min(ROWS - 1, row))}`);
            row = Math.max(0, Math.min(ROWS - 1, row));
        }
        // 行/列护栏：夹回 0..ROWS-1（官方脚本在 6 个古典文明上会因越界直接崩，其官方树另走 chronicles 数据）
        if (row < 0 || row >= ROWS) {
            clamped.push(`${item.id}: row ${row}→${Math.max(0, Math.min(ROWS - 1, row))}`);
            row = Math.max(0, Math.min(ROWS - 1, row));
        }
        while (col >= building.grid![row].length) addColumn(building);
        if (col < 0) col = 0;

        if (building.grid![row][col] != null) {
            const offending = registry.find((x) => x.id === building.grid![row][col]);
            if (offending && (offending.building_in_new_column || offending.node_type === 'UniqueBuilding')) {
                addColumn(building);
                building.grid![row][col + 1] = building.grid![row][col];
                building.grid![row][col] = null;
            } else {
                throw new Error(`layoutTree: ${building.id}.grid[${row}][${col}] 已被 ${building.grid![row][col]} 占用，放不下 ${item.id}`);
            }
        }
        building.grid![row][col] = item.id;
        item.col = col;
    }

    // ⚠️ 曾经这里还有「建筑型节点第二趟」（旧实现跳过了 Use Type=Building）。对齐官方后，
    //    所有 units_techs（含 Harbor / Fish Trap）都在上面同一趟落格；再跑第二趟会**重复落格**
    //    （实测 Building_199_45 重复、62 文明全红）。故删除。

    // 各行列数统一，防止锯齿导致渲染时查不到格子
    for (const b of buildings) {
        const w = Math.max(...b.grid!.map((r) => r.length));
        for (const r of b.grid!) while (r.length < w) r.push(null);
    }

    (pkg as any)._clamped = clamped.length;
    return pkg;
}

/** 该文明树总共几列（＝最宽的建筑列），渲染时用来定画布宽度 */
export function treeColumnCount(pkg: TreePackage): number {
    let max = 1;
    for (const b of pkg.buildings ?? []) max = Math.max(max, b.grid?.[0]?.length ?? 1);
    return max;
}

// ─────────────────────────────────────────────────────────────────────────────
// 官方绘制阶段的像素版式（同构移植官方 js/main.js 的 civ() 布局段）
//   常量：PADDING=20、PADDING_BETWEEN_COLUMNS=10、TOP_PADDING=20、startX=172
//   tree_height = max(innerHeight-80, 100)；row_height = tree_height/4；
//   element_height = row_height/3（即整幅共 8 行，每时代 2 行）
// ─────────────────────────────────────────────────────────────────────────────

export const LAYOUT_CONST = Object.freeze({
    PADDING: 20,
    PADDING_BETWEEN_COLUMNS: 10,
    TOP_PADDING: 20,
    START_X: 172,
});

export interface PositionedItem extends TreeItem {
    x: number;
    y: number;
}

export interface TreeView {
    /** 每个节点（建筑/单位/科技）的像素位置；id → {x,y} */
    pos: Map<string, { x: number; y: number }>;
    /** 建筑列（含该列 x 与格子列数），按绘制顺序 */
    lanes: Array<{ building: TreeItem; x: number; width: number }>;
    width: number;
    height: number;
    rowHeight: number;
    elementHeight: number;
    /** 升级连线：[fromId, toId] */
    connections: Array<[string, string]>;
}

/** 官方判据：建筑 grid 里是否放了东西 */
function hasItemsInGrid(b: TreeItem): boolean {
    for (const row of b.grid ?? []) for (const c of row) if (c) return true;
    return false;
}

/**
 * 按官方绘制阶段的规则算出全树像素版式。
 * 注意：这一步会**再动一次 building.row**（官方在绘制阶段做，算法阶段不重跑），所以必须
 * 在 layoutTree() 之后、且只调一次。
 */
export function computeTreeView(pkg: TreePackage, viewHeight: number, customStartX?: number): TreeView {
    const P = LAYOUT_CONST;
    const treeHeight = Math.max(viewHeight - 40, 100);
    const rowHeight = treeHeight / 4;
    const elementHeight = rowHeight / 3;
    const step = elementHeight + P.PADDING_BETWEEN_COLUMNS;

    const buildings = pkg.buildings ?? [];
    const unitsTechs = pkg.units_techs ?? [];
    const index = new Map<string, TreeItem>();
    for (const b of buildings) index.set(b.id, b);
    for (const i of unitsTechs) index.set(i.id, i);

    const pos = new Map<string, { x: number; y: number }>();
    const lanes: TreeView['lanes'] = [];

    let startX = customStartX ?? P.START_X;
    let width = 0;
    let previousRow = 0;
    let previousBuildingInOwnColumn = true;
    let previousNodeType = '';

    for (const building of buildings) {
        const cols = building.grid?.[0]?.length ?? 1;
        const thisWidth = cols * step;
        if (
            building.building_in_new_column === true ||
            previousBuildingInOwnColumn ||
            hasItemsInGrid(building) ||
            previousRow > (building as any).row ||
            previousNodeType !== building.node_type
        ) {
            startX += width + P.PADDING;
            width = thisWidth;
        } else {
            width = Math.max(width, thisWidth);
            if (previousRow === (building as any).row) (building as any).row += 1;
        }
        // 官方：与它升级自的那座建筑同行时再挪一行
        if (building.link_id !== -1 && building.link_id != null) {
            for (const lb of buildings) {
                if (lb.node_id === building.link_id && (lb as any).row === (building as any).row) (building as any).row += 1;
            }
        }
        const bx = startX + width / 2 - step / 2;
        const by = ((building as any).row as number) * (rowHeight / 2) + P.TOP_PADDING;
        pos.set(building.id, { x: bx, y: by });
        (building as any).x = bx;
        (building as any).y = by;

        for (let r = 0; r < (building.grid?.length ?? 0); r++) {
            for (let c = 0; c < (building.grid?.[r]?.length ?? 0); c++) {
                const itemId = building.grid![r][c];
                if (!itemId) continue;
                const x = startX + c * step;
                const y = r * (rowHeight / 2) + P.TOP_PADDING;
                pos.set(itemId, { x, y });
                const it = index.get(itemId);
                if (it) { (it as any).x = x; (it as any).y = y; }
            }
        }
        lanes.push({ building, x: startX, width });
        previousRow = (building as any).row;
        previousNodeType = building.node_type ?? '';
        previousBuildingInOwnColumn = building.building_in_new_column !== false;
    }
    startX += width;

    // 建筑升级连线
    const connections: Array<[string, string]> = [];
    for (const building of buildings) {
        if (building.building_upgraded_from_id != null && building.building_upgraded_from_id !== -1) {
            for (const lb of buildings) {
                if (lb.node_id === building.building_upgraded_from_id) connections.push([lb.id, building.id]);
            }
        } else if (building.link_id !== -1 && building.link_id != null) {
            for (const lb of buildings) {
                if (
                    lb.node_id === building.link_id &&
                    building.link_node_type === lb.node_type &&
                    (lb.building_in_new_column !== false || lb.node_id === building.building_id)
                ) {
                    connections.push([lb.id, building.id]);
                }
            }
        }
    }
    // 单位/科技升级连线（同建筑内，按 link_id → node_id）
    for (const item of unitsTechs) {
        if (item.link_id == null || item.link_id === -1) continue;
        const linked = unitsTechs.find((x) => x.node_id === item.link_id && x.building_id === item.building_id)
            ?? unitsTechs.find((x) => x.node_id === item.link_id && x.node_type !== 'Research');
        if (linked) connections.push([linked.id, item.id]);
    }

    return { pos, lanes, width: startX + P.PADDING_BETWEEN_COLUMNS, height: treeHeight + 80, rowHeight, elementHeight, connections };
}

/** 官方配色（js/techtree.js getColourForNodeType） */
export function nodeColour(nodeType: string | null | undefined): string {
    switch (nodeType) {
        case 'BuildingTech':
        case 'BuildingNonTech':
            return '#b54e18';
        case 'RegionalBuilding':
            return '#cc4422';
        case 'UniqueBuilding':
            return '#d43652';
        case 'Unit':
        case 'UnitUpgrade':
            return '#00739c';
        case 'RegionalUnit':
            return '#515ae3';
        case 'UniqueUnit':
            return '#703b7a';
        case 'Research':
            return '#397139';
        case 'RegionalTech':
            return '#059945';
        case 'UniqueTech':
            return '#009700';
        default:
            return '#ff0000';
    }
}

/** 名字清洗：官方 formatName —— `<br>`、字面 `\n`、以及 `\\n` 转义都折成真换行（DE 中文名确实带这些） */
export function formatName(name: string | null | undefined): string {
    return String(name ?? '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
        .replace(/\r\n?/g, '\n')
        .replace(/[ \t]*\n[ \t]*/g, '\n')
        .replace(/\n{2,}/g, '\n')
        .trim();
}
