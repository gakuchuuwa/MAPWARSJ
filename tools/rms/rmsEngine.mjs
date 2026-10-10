/**
 * RMS 地图引擎（验证性程序，2026-10-09）：把 rmsParse 展平后的指令，按 DE 顺序跑成一张地图。
 *
 *   LAND → ELEVATION → TERRAIN → OBJECTS（悬崖 / 连接暂不做）
 *
 * 语义依据（按可信度）：
 *   ① 官方手册 `AoE2DE/Docs/All/TC Random Map Scripting Guide.doc`（文本版 scratch/rms-doc/tc-rms-guide.md，下称「手册」）；
 *   ② docs/02-design/RMS引擎语义-给CC.md（DD 整理，已与手册逐条核对）；
 *   ③ 标「推断」的：手册没写、DE 行为与 2000 年版可能不同，待用 DE 真图校准（TUNE 里集中管理）。
 */
import { makeRng } from './rmsParse.mjs';

/** <CLIFF_GENERATION> 的 cliff_type → dat 里该种悬崖 _1 变体的 unit id（每类 9 个变体、id 连续） */
export const CLIFF_BASE = { 0: 264, 1: 1849, 2: 1858, 3: 2178, 4: 2069 };

/** 与 DE 样本统计**同一套 8 向量化**（= `scratch/collect_cliff_samples.py` 的 getDir）：
 *  按 45° 分桶，**一个邻居只给一个方向** —— 斜向邻居是 '+X+Y' 这一个键，**不许拆成 '+X' + '+Y'**。 */
export const CLIFF_DIR8 = ['+X', '+X+Y', '+Y', '-X+Y', '-X', '-X-Y', '-Y', '+X-Y'];
export function cliffDir8(dx, dy) {
    const d = Math.hypot(dx, dy);
    if (d < 0.5 || d > 3.6) return null;
    const deg = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
    return CLIFF_DIR8[Math.floor((deg + 22.5) / 45) % 8];
}

/** 悬崖相邻拓扑查表 —— **DE 官方 2247 个样本统计**（`scratch/cliff_lookup_table.json`），
 *  键 = 相邻段方向**排序后**用 `|` 连接；值是 rot（帧号）。**推断**：统计归纳，非 DE 规则原文。 */
export const CLIFF_TOPOLOGY_TABLE = {
    '+Y|-Y': 1,
    '+X|-X': 4,
    '+X|+Y': 0,
    '-X|-Y': 6,
    '+X|-Y': 3,
    '+Y|-X': 15,
    '+X|+Y|-X': 4,
    '+X|-X|-Y': 5,
    '+Y|-X|-Y': 2,
    '+X|+Y|-Y': 2,
    '+X|+Y|-X|-Y': 3,
    '-X': 17,
    '+Y': 18,
    '-Y': 19,
    '+X': 16,
    '+Y|-X-Y': 9,
    '+X+Y|-Y': 13,
    '+X+Y|-X': 9,
    '+X|-X-Y': 13,
    '+Y|-X|-X+Y': 9,
    '+X|+X-Y|-Y': 13,
    '+X+Y|-X-Y': 13,
    '+X|+X-Y|-X|-Y': 4,
    '+Y|-X|-X+Y|-Y': 6,
    '+X|+X-Y|+Y|-Y': 19,
    '+X|+Y|-X|-X+Y': 0,
    '+X|+X-Y|+Y|-X|-Y': 12,
    '': 0,
    '+X+Y|+X-Y|-Y': 13,
    '+Y|-X+Y|-X-Y': 9,
    '+Y|-X-Y|-Y': 9,
    '+X+Y|-X|-X+Y': 9,
    '+X|+Y|-X|-X+Y|-Y': 15,
    '+Y|-X+Y|-X-Y|-Y': 9,
    '+X+Y|+Y|-Y': 13,
    '+X+Y|+X-Y|+Y|-Y': 13,
    '+X+Y|-X|-X-Y': 13,
    '+X+Y|-X|-Y': 13,
    '+X|+Y|-X-Y': 9,
    '+Y|+Y': 0,
    '-X|-Y|-Y': 14,
    '-X|-X-Y|-Y': 14,
    '+X|+X+Y|+Y|-Y': 12,
    '+X+Y|+Y|-X-Y': 13,
    '+X|+X+Y|-X|-X+Y': 9,
    '-X-Y': 9,
    '+X|+X-Y|-X|-X-Y': 13,
    '+X+Y|-X-Y|-Y': 9,
    '+X|+X-Y|+Y|-X|-X+Y|-Y': 2,
    '+X|+X+Y|-X': 9,
    '+X|+X-Y|-X-Y': 13,
    '+X+Y|+Y|-X|-X-Y': 13,
};
/** 查不到时的兜底：取**该段直行方向的直段帧**（实测 +X→16 / −X→17 / +Y→18 / −Y→19）。**推断** */
export const CLIFF_STRAIGHT_ROT = { '+X': 16, '-X': 17, '+Y': 18, '-Y': 19 };

/**
 * dat 的 `unit.terrain_restriction` 里属于「只能放水里」的类别号。
 * ⚠️ 类别号语义是 **dat 实测反推**（scratch/_probe_restriction_groups.py）：
 *    13 = 鲸/海豚/渔船(FSHSP) ｜ 19 = 鱼(FISHX) ｜ 3 / 30 = 战船
 *    陆地类对照：7 单位/动物、11 植被、8 矿脉、4 建筑、10 城墙、28 骑兵/攻城。
 * 表：scratch/de_unit_restriction.json（export_de_unit_restriction.py 导出）。
 */
export const WATER_RESTRICTIONS = new Set([3, 13, 19, 30]);

/** 未证实 / 需校准的取值（对照 DE 真图逐项校准） */
export const TUNE = {
    /** 玩家出生点避让半径（set_avoid_player_start_areas）——推断 */
    avoidStartRadius: 14,
    /** 成团紧凑度：gamma = clumping_factor / 此值（越大越方正）——推断 */
    clumpScale: 10,
    /**
     * 是否启用 `max_distance_to_other_zones`（第 30 轮实现，**默认关**）。
     * ⚠️ 待校准：按 genie-rms 的「8 方向 N 格」实现后，同主题对比里 `GOLD_MINE` 35→20、`STONE_MINE` 19→5（**过严**），
     *    但物件总数反而更接近 DE（9319 vs 9254，差 0.7%）。语义方向应是对的（手册："keeping objects away from the shore"），
     *    存疑的是「zone」的口径 —— 我们用 `landZone`（内海 16 / 玩家陆地 1），DE 可能指**玩家 zone**。
     */
    useMaxZone: false,
};

/** 把块里的子指令整理成 { 名: 参数数组 }（后者覆盖前者），旗标类指令值为 [] */
function props(block = []) {
    const o = {};
    for (const c of block) o[c.cmd] = c.args;
    return o;
}

const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
/** 8 邻域（含四角）：`max_distance_to_other_zones` 按 genie-rms 在这 8 个方向上取检查点 */
const D8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

export class MapEngine {
    constructor(sections, { size = 144, players = 2, seed = 1, names = new Map(), info = null, objNames = new Map(), terrainUnits = null, unitRestrict = null, skeleton = null } = {}) {
        this.sections = sections;
        this.N = size;
        this.players = players;
        this.rng = makeRng(seed);
        this.cliffRng = makeRng((seed ^ 0x5bf03635) >>> 0);   // 悬崖单开一条随机流（CC 第 61 轮裁定 a：改崖路不再扰动别的物件）
        this.names = names;                         // 地形常量值 → 名字（random_map.def）
        /** 地形编号 → dat 里的 { name, name_2, blend_type }（scratch/de_terrain_manifest.json，来自 empires2_x2_p1.dat） */
        this.info = info;
        /** 物件常量值 → 名字（random_map.def 的物件段） */
        this.objNames = objNames;
        /** 地形编号 → dat 登记的自动单位 [{unit, density, masked}]（scratch/de_terrain_units.json，来自 empires2_x2_p1.dat） */
        this.terrainUnits = terrainUnits;
        /** 物件 id → dat 的 terrain_restriction（放置类别号）；见 scratch/de_unit_restriction.json */
        this.unitRestrict = unitRestrict;
        /** 外部地理骨架（第 46 轮）：给了就跳过脚本的 LAND / ELEVATION 段，见 applySkeleton() */
        this.skeleton = skeleton;
        // ── 缺表即报错（第 40 轮，CC 裁定）──
        // 水生判定（`okTile`）依赖两张表：`unitRestrict`（dat 的通行类别）与 `objNames`（id → 名）。
        //   两者**同时**缺失时会**静默**把所有"只能在水里"的物件放到陆地上
        //   —— 第 39 轮实测踩过：探针漏传这两张表 → `FISHS` 292 条**全落在 `Dirt 3` 上**，而且不报错。
        //   宁可早失败：缺哪张就报哪张，不允许静默运行。
        {
            const missing = [];
            if (!unitRestrict || unitRestrict.size === 0) missing.push('unitRestrict（dat 的 unit.terrain_restriction 表 → scratch/de_unit_restriction.json）');
            if (!objNames || objNames.size === 0) missing.push('objNames（random_map.def 的物件名表）');
            if (missing.length) throw new Error(`MapEngine 缺少必需查表（缺任一张都会静默错放水生物件）：${missing.join('；')}`);
        }
        const n = size * size;
        this.terrain = new Int16Array(n);
        /** 视觉图层（terrain_mask）：-1 = 无，否则画这一层；逻辑地形（物件/森林/通行）仍看 terrain */
        this.layer = new Int16Array(n).fill(-1);
        this.elev = new Int8Array(n);
        this.landId = new Int32Array(n).fill(-1);
        /** land id → zone（`create_land` 的 `zone` 参数）；供 `max_distance_to_other_zones` 判「别的 zone」 */
        this.landZone = new Map();
        /**
         * 地形 id → 该地形临水那一圈要变成的沙滩地形（`create_terrain` 的 `beach_terrain` 参数）。
         * 官方手册与官方 DE RMS 页**都没有**这条的定义；用法见 DE 脚本：`includes/coastal_blending.inc:19/47/75/103`
         *   `create_terrain COASTAL_TERRAIN { … beach_terrain BEACH_TERRAIN  terrain_mask 1 }`
         * —— 即「**这条地形**临水的那一圈 → 指定的沙滩」，与 genie-rms 的全局 `checkBorders()` 是两回事。
         */
        this.beachOf = new Map();
        /** 每格的 zone（物件段之前构建）；-1 = 未知 */
        this.zoneGrid = null;
        this.objects = [];
        this.markers = [];                          // actor_area 逻辑标记（不可见）
        this.areaGrid = new Map();                  // 区域号 → 占位网格
        this.starts = [];                           // 玩家出生点
        this.unsupported = new Map();
        this.forestTerrains = new Set();
        this.waterTerrains = new Set();
        /** create_object_group 组名 → [{id, weight}]：物件组，放置时按权重逐个随机取（见 collectObjectGroups） */
        this.objectGroups = new Map();
        // <CLIFF_GENERATION> 段级参数（平铺指令，不在块里）；max <= 0 表示不生成（RND_GLOBAL_CLIFFS_NONE）
        this.cliffMin = 0; this.cliffMax = 0;
        this.cliffMinLen = 3; this.cliffMaxLen = 5;
        this.cliffGap = 1; this.cliffCurliness = 0; this.cliffType = 0;
        this.cliffNoTurn = false;      // 预案（CC 第 61 轮，默认关）：开启后崖路只走直线、不转向，两端用端头帧
        /** min_terrain_distance：候选块周围这个范围内有水就不放悬崖（genie-rms 同名处理），单位=粗网格格 */
        this.cliffTerrDist = 0;
        /** 手册「Map sizes」：Scaling factor 以 100×100 为基准 ＝ 面积 / 10000 */
        this.areaScale = (size * size) / 10000;
    }

    idx(x, y) { return y * this.N + x; }
    inb(x, y) { return x >= 0 && y >= 0 && x < this.N && y < this.N; }
    note(cmd) { this.unsupported.set(cmd, (this.unsupported.get(cmd) ?? 0) + 1); }

    run() {
        const S = this.sections;
        if (this.info) {
            // 以 dat 为准：森林 = 贴图 g_for 或名字含 Forest/Jungle/Bamboo；水 = blend_type 3，
            // 但「可改装」占位地形（o_mod）不算——脚本把它们当占位用，dat 里虽标成水，最后都会被换掉
            for (const [v, t] of this.info) {
                if (t.name_2 === 'o_mod') continue;
                if (t.name_2 === 'g_for' || /Forest|Jungle|Bamboo/i.test(t.name)) this.forestTerrains.add(v);
                if (t.blend_type === 3) this.waterTerrains.add(v);
            }
        } else {
            for (const [v, name] of this.names) {
                if (/FOREST|JUNGLE|BAMBOO/.test(name) && !/PLACEHOLDER/.test(name)) this.forestTerrains.add(v);
                if (/WATER|SHALLOW|OCEAN|SEA$|SWAMP/.test(name)) this.waterTerrains.add(v);
            }
        }
        // 【第 46 轮 · CC 任务书第一步第 6 条】外部地理骨架：
        //   战术模式的战场是「大形状用战略地图的真实地理（陆地/水、河流、高度）＋ 细节用 DE 样式」，
        //   所以允许调用方直接传一份骨架，**跳过脚本的 LAND / ELEVATION 两段**，只跑 TERRAIN / OBJECTS。
        if (this.skeleton) this.applySkeleton();
        else {
            this.runLand(S.LAND_GENERATION ?? []);
            for (const c of S.ELEVATION_GENERATION ?? []) this.elevCmd(c);
        }
        for (const c of S.TERRAIN_GENERATION ?? []) this.terrainCmd(c);
        // 骨架模式：脚本不许造水（水只认真实地理骨架）—— CC 第 87 轮裁定；第 89 轮 CC 代修：原调用误并入注释行从未执行，且须在沙滩/地形装饰之前
        if (this.skeleton) this.reassertSkeletonWater();
        this.applyBeaches();
        this.plantTerrainUnits();
        // 骨架模式不跑悬崖段（设计只跑「地形」「物件」两段；真实悬崖以后由真实陡坡生成）—— CC 第 85 轮代修
        if (!this.skeleton) {
            for (const c of S.CLIFF_GENERATION ?? []) this.cliffCmd(c);
            this.generateCliffs();
        }
        // 骨架模式 + 有米制高程：按真实陡坡生成悬崖（DD 第 91～92 轮方案；第 93 轮 CC 代接：须在上面 if 块之外）
        if (this.skeleton && this.skeleton.elevMeters) this.generateCliffsFromSlope();
        // 构建 zone 网格：手册 `max_distance_to_other_zones` 需要知道「别的 zone」在哪
        this.zoneGrid = new Int16Array(this.terrain.length).fill(-1);
        for (let i = 0; i < this.terrain.length; i++) {
            const z = this.landZone.get(this.landId[i]);
            this.zoneGrid[i] = z === undefined ? -1 : z;
        }
        this.collectObjectGroups();
        for (const c of S.OBJECTS_GENERATION ?? []) this.objectCmd(c);
        return this;
    }

    // ───────────────────────── LAND ─────────────────────────
    /**
     * 铺外部地理骨架（第 46 轮，CC 任务书第一步第 6 条）。
     *   `skeleton = { land, elev, landTerrain, waterTerrain, landId }`
     *     · `land`：Uint8Array(边长²)，1 = 陆地、0 = 水（**河流就是水**）
     *     · `elev`：Int8Array(边长²)，每格高度（可省，省则全 0）
     *     · `landTerrain` / `waterTerrain`：陆地与水的底地形编号（脚本的 TERRAIN 段会在上面继续铺）
     *     · `landId`：给陆地格一个中立 land id（默认 200），让 TERRAIN/OBJECTS 的避让与 zone 逻辑有依据
     *   调用方给了骨架时，`run()` **不执行** 脚本的 LAND / ELEVATION 段（否则脚本会造内海、覆盖真实地理）。
     */
    /** 真实陡坡生成悬崖（**骨架模式专用**，CC 第 92 轮）：沿高度级分界线走线、段间 ≥3 格、覆盖 ≤5%。**推断** */
    generateCliffsFromSlope() {
        const N = this.N, sk = this.skeleton, H = sk && sk.elevMeters;
        if (!H || H.length !== N * N) return;   // 骨架与地图尺寸必须一致（CC 第 93 轮）
        const TH = 25, C = N;
        let hmin = Infinity, hmax = -Infinity;
        for (let i = 0; i < C * C; i++) { const v = H[i]; if (v < hmin) hmin = v; if (v > hmax) hmax = v; }
        const relief = hmax - hmin, step = relief < 25 ? 25 : (relief <= 175 ? 25 : relief / 7);
        const lv = new Int8Array(C * C);
        for (let i = 0; i < C * C; i++) lv[i] = relief < 25 ? 0 : Math.max(0, Math.min(7, Math.floor((H[i] - hmin) / step)));
        const slope = new Float32Array(C * C);
        for (let y = 1; y < C - 1; y++) for (let x = 1; x < C - 1; x++) {
            const i = y * C + x, v = H[i];
            slope[i] = Math.max(Math.abs(v - H[i - 1]), Math.abs(v - H[i + 1]), Math.abs(v - H[i - C]), Math.abs(v - H[i + C]));
        }
        const bnd = new Uint8Array(C * C);
        for (let y = 1; y < C - 1; y++) for (let x = 1; x < C - 1; x++) {
            const i = y * C + x;
            if (slope[i] < TH) continue;
            if (lv[i] !== lv[i - 1] || lv[i] !== lv[i + 1] || lv[i] !== lv[i - C] || lv[i] !== lv[i + C]) bnd[i] = 1;
        }
        const seen = new Uint8Array(C * C), lines = [];
        const NB8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
        for (let y = 1; y < C - 1; y++) for (let x = 1; x < C - 1; x++) {
            if (!bnd[y * C + x] || seen[y * C + x]) continue;
            let cx = x, cy = y; const line = []; seen[y * C + x] = 1;
            for (;;) {
                line.push([cx, cy]);
                let best = null, bs = -1;
                for (const [dx, dy] of NB8) {
                    const nx = cx + dx, ny = cy + dy;
                    if (nx < 0 || ny < 0 || nx >= C || ny >= C) continue;
                    const j = ny * C + nx;
                    if (!bnd[j] || seen[j]) continue;
                    if (slope[j] > bs) { bs = slope[j]; best = [nx, ny]; }
                }
                if (!best) break;
                cx = best[0]; cy = best[1]; seen[cy * C + cx] = 1;
            }
            if (line.length >= 3) lines.push(line);
        }
        lines.sort((a, b) => b.length - a.length);
        const base = CLIFF_BASE[this.cliffType] ?? CLIFF_BASE[0];
        const taken = new Set(); let made = 0;
        const cap = Math.floor((C * C * 0.05) / 9);
        for (const line of lines) {
            for (let i = 0; i < line.length; i += 3) {
                if (made >= cap) break;
                const px = line[i][0], py = line[i][1];
                let clash = false;
                for (let dx = -2; dx <= 2 && !clash; dx++) for (let dy = -2; dy <= 2; dy++) if (taken.has((py + dy) * C + (px + dx))) { clash = true; break; }
                if (clash) continue;
                taken.add(py * C + px);
                let rot;
                if (this.cliffNoTurn) {
                    const seg = cliffDir8(line[line.length - 1][0] - line[0][0], line[line.length - 1][1] - line[0][1]);
                    rot = CLIFF_STRAIGHT_ROT[seg] ?? 0;
                } else {
                    const nbrs = [];
                    for (const j of [i - 3, i + 3]) {
                        if (j < 0 || j >= line.length) continue;
                        const dir = cliffDir8(line[j][0] - px, line[j][1] - py);
                        if (dir) nbrs.push(dir);
                    }
                    rot = CLIFF_TOPOLOGY_TABLE[nbrs.sort().join('|')] ?? 0;
                }
                this.objects.push({ id: base, cliff: true, x: px + 0.5, y: py + 0.5, rot });   // 线上的点已是细格，取格心（原 px*3+1 是粗网格口径，CC 第 93 轮改）
                made++;
            }
            if (made >= cap) break;
        }
        this.cliffMade = (this.cliffMade ?? 0) + made;
        this.cliffFromSlope = made;
    }

    /** 骨架模式：把脚本 TERRAIN 段造出来的水**抹掉**（水只认骨架）；陆地格若被脚本改成水 ⇒ 还原成陆地底地形。**推断** */
    /** 骨架模式：把脚本 TERRAIN 段造出来的水**抹掉**（水只认骨架）；陆地格若被脚本改成水 ⇒ 还原成陆地底地形。**推断** */
    reassertSkeletonWater() {
        const N = this.N, sk = this.skeleton;
        for (let i = 0; i < N * N; i++) {
            const isLand = sk.land[i] ? 1 : 0;
            const curWater = this.waterTerrains.has(this.terrain[i]);
            if (isLand && curWater) this.terrain[i] = sk.landTerrain;   // 通行由 mapData 按地形另算，引擎里没有 passable（CC 第 89 轮代修）
            else if (!isLand && !curWater) this.terrain[i] = sk.waterTerrain;
        }
    }

    applySkeleton() {
        const N = this.N, sk = this.skeleton;
        const landId = sk.landId ?? 200;
        for (let i = 0; i < N * N; i++) {
            const isLand = sk.land[i] ? 1 : 0;
            this.terrain[i] = isLand ? sk.landTerrain : sk.waterTerrain;
            if (sk.elev) this.elev[i] = sk.elev[i];
            if (isLand) this.landId[i] = landId;
        }
        if (!this.landZone.has(landId)) this.landZone.set(landId, 0);
    }

    runLand(cmds) {
        const deferred = [];
        // 手册 :150「Land is all generated **at the same time**, so the order used in placing land is not important.」
        //   → 两阶段：① 先把**每块 land 的底座**全部铺好；② 再**各 land 轮流**生长（与 genie-rms `baseLandGenerate()`
        //   「各 land 轮流 pop 一个点」同构）。
        //   旧实现是一块长满再长下一块 ⇒ 内海先占满中心，玩家陆地没地方长，玩家 2 的基点落进内海后**整块消失**。
        const specs = [];
        for (const c of cmds) {
            if (c.cmd === 'base_terrain') { this.terrain.fill(Number(c.args[0])); continue; }
            if (c.cmd === 'create_land') {
                const P = props(c.block);
                // 推断：number_of_tiles 0 且没写 land_percent → 「铺满剩余空地」（如 Arabia 的 land_id 420，给物件
                // place_on_specific_land_id 用的中立区标签）。必须等其它陆地长完再铺，否则会先占满整张图。
                const fill = Number(P.number_of_tiles?.[0] ?? -1) === 0 && !P.land_percent;
                if (fill) deferred.push(P); else specs.push(this.planLand(P, null, null));
                continue;
            }
            if (c.cmd === 'create_player_lands') { specs.push(...this.planPlayerLands(props(c.block))); continue; }
            this.note('LAND:' + c.cmd);
        }
        this.growLands(specs);
        for (const P of deferred) {
            const id = Number(P.land_id?.[0] ?? 0);
            const terr = Number(P.terrain_type?.[0] ?? 0);
            for (let i = 0; i < this.landId.length; i++) if (this.landId[i] === -1) { this.landId[i] = id; this.terrain[i] = terr; }
        }
    }

    /**
     * 玩家陆地：只**铺底座**，生长交给 growLands()（手册 :150 陆地同时生成）。
     * 手册 :162/:185 —— 玩家陆地的 `land_percent` 是**所有玩家合计**，要按玩家数平分
     *   （"if player lands were specified to take up 20% of the map, then 2 players would each get 10%"）。
     */
    planPlayerLands(P) {
        const rParam = P.circle_radius ?? [34, 1];
        const R = (Number(rParam[0]) / 100) * this.N;            // 推断：circle_radius 是占边长的百分比
        const varPct = Number(rParam[1] ?? 0);
        const base = this.rng() * Math.PI * 2;
        const specs = [];
        for (let p = 0; p < this.players; p++) {
            const ang = base + (p / this.players) * Math.PI * 2;
            const rr = R * (1 + (this.rng() - 0.5) * 2 * varPct / 100);
            const cx = Math.round(this.N / 2 + Math.cos(ang) * rr);
            const cy = Math.round(this.N / 2 + Math.sin(ang) * rr);
            this.starts.push({ x: cx, y: cy });
            specs.push(this.planLand(P, { x: cx, y: cy }, 100 + p, this.players, !!P.circle_radius));
        }
        return specs;
    }

    /**
     * 铺好一块 land 的底座并返回「待生长」的描述（**本方法不生长**，生长由 growLands() 统一轮转）。
     * `playerDivisor`：只作用于 `land_percent`（玩家陆地要按玩家数平分，手册 :162/:185）；
     *   `number_of_tiles` 不减 —— 脚本里写的就是单个玩家的量级（如 Arabia 的 1300）。
     */
    planLand(P, at, forcedId, playerDivisor = 1, ignoreBorders = false) {
        const N = this.N;
        const terr = Number(P.terrain_type?.[0] ?? 0);
        const id = forcedId ?? Number(P.land_id?.[0] ?? this.rng.int(200, 400));
        // 记录该 land 的 zone（手册：`create_land` 的 `zone` 参数；物件段与 other_zone_avoidance_distance 都要用）
        const zone = Number(P.zone?.[0] ?? 0);
        this.landZone.set(id, zone);
        let want = Number(P.number_of_tiles?.[0] ?? 0);
        // 手册：land_percent 随地图缩放，number_of_tiles 不缩放；二者只用其一
        if (P.land_percent) want = Math.round(Number(P.land_percent[0]) / 100 * N * N / playerDivisor);
        const baseR = Number(P.base_size?.[0] ?? 0);              // 手册：base_size = 陆地生长的最小半径
        const avoid = Number(P.other_zone_avoidance_distance?.[0] ?? 0);
        const clump = Number(P.clumping_factor?.[0] ?? 8);        // 手册：陆地默认 8，范围 1–15
        // 手册：left/right/top/bottom_border ＝「Percent from edge to stop land growth」——
        // 从边缘往里这个百分比之内**不许长陆地**（原文：In Mediterranean and Baltic maps, this instruction
        // places the inland sea near the center of the map.  border 25 → 陆地靠近地图中部）。
        // 实测差距：Mediterranean.rms 的 create_land { terrain_type VODA  land_percent 80  borders 17 }
        //   未实现 border 时水占 80.0%，而 DE 真图只有 21.8%。
        const bp = (k) => Number(P[k]?.[0] ?? 0);
        // ⚠️ 边界**照常按脚本计算**（下一条注释里那个"免边界"只作用于**底座**，由 freeSeed 决定是否跳过检查）。
        //   （第 41 轮踩过：曾在这里按 ignoreBorders 把 bx0/bx1/by0/by1 清零 → inBorders 也一起失效 → 生长其实没被约束。）
        const bx0 = Math.round(bp('left_border') / 100 * N), bx1 = N - Math.round(bp('right_border') / 100 * N);
        const by0 = Math.round(bp('top_border') / 100 * N), by1 = N - Math.round(bp('bottom_border') / 100 * N);
        // 官方手册：地图陆地有「硬编码的圆角」——
        //   "the map land had a hard-coded feature to round off edges … As maps get smaller (border > 20%)
        //    they may look less like rectangles and more like circles or octagons."
        // 实测 DE 的水「中部最宽、两端收窄」（每行跨度 29→70→58→86…），而我们是恒定 96 的矩形。
        // 近似：把 border 的矩形可用区按内切椭圆裁切；**没有 border 时不裁**（保持其它脚本原行为）。
        const hasBorder = bx0 > 0 || bx1 < N || by0 > 0 || by1 < N;
        const ex = (bx0 + bx1) / 2, ey = (by0 + by1) / 2;
        const erx = (bx1 - bx0) / 2, ery = (by1 - by0) / 2;
        let cx, cy;
        if (at) { cx = at.x; cy = at.y; }
        else if (P.land_position) { cx = Math.round(Number(P.land_position[0]) / 100 * N); cy = Math.round(Number(P.land_position[1]) / 100 * N); }
        else {
            // 中心点必须落在可用区内（椭圆裁切下还要留出内接方框）：否则 base 圆盘整个落在外圈，一格都长不出来
            const lox = Math.max(10, bx0, Math.round(ex - erx / Math.SQRT2)), hix = Math.min(N - 11, bx1 - 1, Math.round(ex + erx / Math.SQRT2));
            const loy = Math.max(10, by0, Math.round(ey - ery / Math.SQRT2)), hiy = Math.min(N - 11, by1 - 1, Math.round(ey + ery / Math.SQRT2));
            cx = this.rng.int(Math.min(lox, hix), hix);
            cy = this.rng.int(Math.min(loy, hiy), hiy);
        }
        const mine = [];
        const claim = (x, y) => { const i = this.idx(x, y); this.landId[i] = id; this.terrain[i] = terr; mine.push(i); };
        // 官方手册：border_fuzziness ＝「percent chance per tile of stopping at a border」——
        // 不写 → 边界是直线；写了 → 每格按该概率决定「停 / 继续」，于是边缘参差、并且会略微越过 border
        // （实测 DE 的水 x 范围 22~122，而 border 17% 对应 [24,120) —— 确实越过了约 2 格）。
        const fuzz = Number(P.border_fuzziness?.[0] ?? 0);
        // 边界（矩形 + 内切椭圆 + border_fuzziness）单独抽出来：**底座要能"免边界"，生长不能**（见下方 freeSeed）。
        const inBorders = (x, y) => {
            if (x < bx0 || x >= bx1 || y < by0 || y >= by1) {
                if (fuzz <= 0) return false;                                   // 硬边界（直线）
                const over = Math.max(bx0 - x, x - (bx1 - 1), by0 - y, y - (by1 - 1));
                if (this.rng() * 100 >= fuzz / (1 + over)) return false;       // 越界越远，越难继续
            }
            if (hasBorder && erx > 0 && ery > 0) {
                const r2 = ((x - ex) / erx) ** 2 + ((y - ey) / ery) ** 2;
                if (r2 > 1) {
                    // 圆角边界同样受 border_fuzziness 影响：不写 → 光滑椭圆；写了 → 边缘参差并略微外溢
                    if (fuzz <= 0) return false;
                    const over = Math.sqrt(r2) - 1;
                    if (this.rng() * 100 >= fuzz / (1 + over * 20)) return false;
                }
            }
            return true;
        };
        const freeCore = (x, y, skipBorders) => {
            if (!this.inb(x, y)) return false;
            if (!skipBorders && !inBorders(x, y)) return false;
            // 手册 :150 陆地「同时生成」＋ genie-rms `checkTerrainAndZone()`「在 land.area 内发现别的 zone → 不允许侵入」
            //   ⇒ **任何别的 land 的格子都不许占**。原先那套 `overwrite && occ < 100` 的「覆盖」逻辑已废除
            //     （它把「中立 land（id 200~400）」与「别的玩家 land（100~107）」混在一个数值阈值里，且意图与手册相反）。
            const occ = this.landId[this.idx(x, y)];
            if (occ !== -1 && occ !== id) return false;
            if (avoid > 0) {
                for (let dy = -avoid; dy <= avoid; dy++) for (let dx = -avoid; dx <= avoid; dx++) {
                    const xx = x + dx, yy = y + dy;
                    if (!this.inb(xx, yy)) continue;
                    const l = this.landId[this.idx(xx, yy)];
                    // 手册：other_zone_avoidance_distance ＝「不同 zone 的陆地之间留出的间隔」——
                    //   同 zone 的陆地可以相邻（例：同属玩家 zone 1 的几块地），**不同 zone** 才要保持这个距离。
                    if (l !== -1 && l !== id && (this.landZone.get(l) ?? 0) !== zone) return false;
                }
            }
            return true;
        };
        const free = (x, y) => freeCore(x, y, false);                 // 生长用：受边界约束
        // 【第 41 轮 · CC 修正裁定】用 circle_radius 时：**起始位置与底座**免 `*_border`，**生长仍受约束**。
        //   （上一版把生长也免了 → Team_Islands 玩家陆地 20736 格＝整张图、岛图几乎没有水，不可能是 DE 的结果。
        //    官方只明说"起始位置"不受约束；底座是起点的一部分，所以免；生长没有依据，所以不免。）
        const freeSeed = ignoreBorders ? ((x, y) => freeCore(x, y, true)) : free;
        for (let dy = -baseR; dy <= baseR; dy++) for (let dx = -baseR; dx <= baseR; dx++) {
            if (dx * dx + dy * dy > baseR * baseR) continue;
            if (freeSeed(cx + dx, cy + dy)) claim(cx + dx, cy + dy);
        }
        if (mine.length === 0 && freeSeed(cx, cy)) claim(cx, cy);
        return { id, zone, terr, want, clump, free, mine };
    }

    /**
     * **各 land 轮流**生长（每轮每块各吞一格）—— 手册 :150「Land is all generated at the same time」；
     * 与 genie-rms `baseLandGenerate()` 的「循环：各 land 轮流 pop 一个点」同构。
     * 每块 land 自带候选堆（代价 = 250 − clumping_factor × 四邻本 land 数 + 随机(0..99)），互不等待。
     */
    growLands(specs) {
        if (!specs.length) return;
        const N = this.N;
        const push = (h, cost, j) => {
            h.push([cost, j]);
            let k = h.length - 1;
            while (k > 0) { const p = (k - 1) >> 1; if (h[p][0] <= h[k][0]) break; [h[p], h[k]] = [h[k], h[p]]; k = p; }
        };
        const pop = (h) => {
            const top = h[0], last = h.pop();
            if (h.length) {
                h[0] = last;
                let k = 0;
                for (;;) {
                    const l = 2 * k + 1, r = l + 1;
                    let m = k;
                    if (l < h.length && h[l][0] < h[m][0]) m = l;
                    if (r < h.length && h[r][0] < h[m][0]) m = r;
                    if (m === k) break;
                    [h[m], h[k]] = [h[k], h[m]]; k = m;
                }
            }
            return top;
        };
        for (const s of specs) {
            s.h = [];
            s.total = s.mine.length;
            const costOf = (j) => {
                const x = j % N, y = (j / N) | 0;
                let same = 0;
                for (const d of D4) { const xx = x + d[0], yy = y + d[1]; if (this.inb(xx, yy) && this.landId[this.idx(xx, yy)] === s.id) same++; }
                return 250 - s.clump * same + this.rng.int(0, 99);
            };
            s.expand = (i) => {
                const x = i % N, y = (i / N) | 0;
                for (const d of D4) {
                    const xx = x + d[0], yy = y + d[1];
                    if (!this.inb(xx, yy)) continue;
                    const j = this.idx(xx, yy);
                    if (this.landId[j] !== -1) continue;      // 只把**未占**格推入前沿（否则会重复认领自己的格子）
                    if (s.free(xx, yy)) push(s.h, costOf(j), j);
                }
            };
            s.mine.forEach((i) => s.expand(i));
        }
        let alive = true;
        while (alive) {
            alive = false;
            for (const s of specs) {
                if (s.total >= s.want) continue;
                while (s.h.length) {
                    const [, j] = pop(s.h);
                    if (this.landId[j] !== -1) continue;      // 堆里的陈旧项：已被本 land 或别的 land 占掉
                    const x = j % N, y = (j / N) | 0;
                    if (!s.free(x, y)) continue;              // 条件已变（如同 zone 避让）
                    this.landId[j] = s.id; this.terrain[j] = s.terr;
                    s.total++; s.expand(j); alive = true; break;
                }
            }
        }
    }

    /**
     * 通用成团生长（代价优先）：每团维护一个候选堆，轮流弹出代价最低的格子吞下，再把它的四邻按代价压入。
     *   代价 = 250 − 成团系数 × 四邻里本团格子数 + 随机(0..99)
     * 做法参考 genie-rms 的 TerrainGenerator（AoC 近似，GPL，只借结构不抄代码）；数值以 DE 真图校准为准。
     * 与「随机挑格 + 接受概率」相比，它不会在团块很紧凑时过早停住（之前出生地块只换到 4 格就是这个原因）。
     * accept(j, r) 判断格子能否被第 r 团吞下；take(j, r) 执行吞下；isOwn(j, r) 判断格子是否已属第 r 团。
     */
    grow(regions, target, clumpFactor, accept, take, isOwn) {
        const N = this.N;
        const heaps = regions.map(() => []);
        const push = (h, cost, j) => {
            h.push([cost, j]);
            let k = h.length - 1;
            while (k > 0) { const p = (k - 1) >> 1; if (h[p][0] <= h[k][0]) break; [h[p], h[k]] = [h[k], h[p]]; k = p; }
        };
        const pop = (h) => {
            const top = h[0], last = h.pop();
            if (h.length) {
                h[0] = last;
                let k = 0;
                for (;;) {
                    const l = 2 * k + 1, r = l + 1;
                    let m = k;
                    if (l < h.length && h[l][0] < h[m][0]) m = l;
                    if (r < h.length && h[r][0] < h[m][0]) m = r;
                    if (m === k) break;
                    [h[m], h[k]] = [h[k], h[m]]; k = m;
                }
            }
            return top;
        };
        const costOf = (j, r) => {
            const x = j % N, y = (j / N) | 0;
            let same = 0;
            for (const d of D4) { const xx = x + d[0], yy = y + d[1]; if (this.inb(xx, yy) && isOwn(this.idx(xx, yy), r)) same++; }
            return 250 - clumpFactor * same + this.rng.int(0, 99);
        };
        const expand = (i, r) => {
            const x = i % N, y = (i / N) | 0;
            for (const d of D4) {
                const xx = x + d[0], yy = y + d[1];
                if (!this.inb(xx, yy)) continue;
                const j = this.idx(xx, yy);
                if (accept(j, r)) push(heaps[r], costOf(j, r), j);
            }
        };
        regions.forEach((reg, r) => reg.forEach((i) => expand(i, r)));
        let total = regions.reduce((s, r) => s + r.length, 0);
        let alive = true;
        while (total < target && alive) {
            alive = false;
            for (let r = 0; r < regions.length && total < target; r++) {
                const h = heaps[r];
                while (h.length) {
                    const [, j] = pop(h);
                    if (!accept(j, r)) continue;      // 入堆后被别的团抢走、或条件已变
                    take(j, r);
                    regions[r].push(j);
                    total++;
                    expand(j, r);
                    alive = true;
                    break;
                }
            }
        }
    }

    // ───────────────────────── ELEVATION ─────────────────────────
    elevCmd(c) {
        if (c.cmd !== 'create_elevation') { if (c.cmd !== 'base_terrain') this.note('ELEV:' + c.cmd); return; }
        const H = Math.max(1, Math.min(7, Number(c.args[0] ?? 1)));   // 手册：1–7，放置「最多到」该高度
        const P = props(c.block);
        const base = Number(P.base_terrain?.[0] ?? -1);
        const tiles = Math.round(Number(P.number_of_tiles?.[0] ?? 0) * (P.set_scale_by_size ? this.areaScale : 1));
        const clumps = Math.max(1, Math.round(Number(P.number_of_clumps?.[0] ?? 1) * (P.set_scale_by_groups ? this.areaScale : 1)));
        const N = this.N;
        const regOf = new Int32Array(this.terrain.length).fill(-1);
        const regions = this.seed(clumps, (i) => this.terrain[i] === base && regOf[i] === -1, (i, r) => { regOf[i] = r; });
        this.grow(regions, tiles, 10, (j) => this.terrain[j] === base && regOf[j] === -1, (j, r) => { regOf[j] = r; }, (j, r) => regOf[j] === r);
        // 每团：到团边缘的距离 = 抬升高度（封顶 H）→ 逐格台阶的山丘，自然得到 1..H 的混合
        for (let r = 0; r < regions.length; r++) {
            const reg = regions[r];
            const dist = new Map();
            let q = [];
            for (const i of reg) {
                const x = i % N, y = (i / N) | 0;
                if (D4.some((dd) => !this.inb(x + dd[0], y + dd[1]) || regOf[this.idx(x + dd[0], y + dd[1])] !== r)) { dist.set(i, 1); q.push(i); }
            }
            while (q.length) {
                const nq = [];
                for (const i of q) {
                    const x = i % N, y = (i / N) | 0, dc = dist.get(i);
                    for (const dd of D4) {
                        const xx = x + dd[0], yy = y + dd[1];
                        if (!this.inb(xx, yy)) continue;
                        const j = this.idx(xx, yy);
                        if (regOf[j] === r && !dist.has(j)) { dist.set(j, dc + 1); nq.push(j); }
                    }
                }
                q = nq;
            }
            for (const i of reg) this.elev[i] = Math.max(this.elev[i], Math.min(H, dist.get(i) ?? 1));
        }
    }

    /**
     * 在满足 ok 的格子里随机放 n 个种子，返回各团初始格子数组。
     * `seedRadius`：每放一个种子就把周围这个半径的格子挖掉，**保证团与团不挨着**
     *   —— 对应 genie-rms `TerrainGenerator.generateTerrain()` 的 `removeArea(x, y, baseArea)`，
     *   `baseArea = Math.min(2, 2 * Math.sqrt(tiles / numberOfClumps))`。
     *   ⚠️ 这与 `spacing_to_other_terrain_types` 是**两套独立机制**：这个管**种子起点**，那个管**生长时的候选判定**。
     *   （之前没有这一步：方案 C 的 spacing 谓词看的是 `terrain`，而 `terrain` 要到指令末尾才写，
     *     所以同一条指令的种子可以紧挨着放 → 团块从起点就是连的 → 森林最大块 358 vs DE 149。）
     */
    seed(n, ok, mark, seedRadius = 0) {
        const banned = seedRadius > 0 ? new Uint8Array(this.terrain.length) : null;
        const N = this.N;
        const cand = [];
        for (let i = 0; i < this.terrain.length; i++) if (ok(i)) cand.push(i);
        const regions = [];
        let tries = 0;
        while (regions.length < n && cand.length && tries++ < n * 30) {
            const i = cand[Math.floor(this.rng() * cand.length)];
            if (!ok(i)) continue;
            if (banned && banned[i]) continue;
            mark(i, regions.length);
            regions.push([i]);
            if (banned) {
                const x = i % N, y = (i / N) | 0;
                for (let dy = -seedRadius; dy <= seedRadius; dy++) for (let dx = -seedRadius; dx <= seedRadius; dx++) {
                    const xx = x + dx, yy = y + dy;
                    if (this.inb(xx, yy)) banned[this.idx(xx, yy)] = 1;
                }
            }
        }
        return regions;
    }

    // ───────────────────────── TERRAIN ─────────────────────────
    terrainCmd(c) {
        if (c.cmd !== 'create_terrain') { if (!['color_correction', 'base_terrain'].includes(c.cmd)) this.note('TERR:' + c.cmd); return; }
        const T = Number(c.args[0]);
        const P = props(c.block);
        // `beach_terrain <地形>`：本条地形临水的那一圈要变成哪个沙滩地形（DE 新增参数，官方文档未收录）
        if (P.beach_terrain) this.beachOf.set(T, Number(P.beach_terrain[0]));
        const base = Number(P.base_terrain?.[0] ?? this.terrain[0]);
        let baseCount = 0;
        for (let i = 0; i < this.terrain.length; i++) if (this.terrain[i] === base) baseCount++;
        // 手册：land_percent 按「全部地块」的百分比（随地图缩放）；number_of_tiles 是格数（不缩放，除非 set_scale_by_size）
        let target = P.number_of_tiles
            ? Number(P.number_of_tiles[0]) * (P.set_scale_by_size ? this.areaScale : 1)
            : P.land_percent ? Number(P.land_percent[0]) / 100 * this.terrain.length : 0;
        target = Math.min(Math.round(target), baseCount);
        // 手册：set_scale_by_groups 缩放团数（基准 100×100）
        const clumps = Math.max(1, Math.round(Number(P.number_of_clumps?.[0] ?? 1) * (P.set_scale_by_groups ? this.areaScale : 1)));
        const clumpF = Number(P.clumping_factor?.[0] ?? 20);       // 手册：地形默认 20
        // 【第 45 轮修 · CC 裁定】非整数 spacing **向下取整**：DE 地图是整数格，取整才是 DE 的行为。
        //   老写法的病灶：`for (dy = -1.656; dy <= 1.656; dy++)` 步长错开 → 算出非整数坐标 →
        //   `this.idx()` 取到 undefined → 被当成"坏格" → **几乎拒掉所有格子**（实测 `Murkwood.rms` 的 1.656 / 3.312）。
        //   那是我们的缺陷，不是 DE 的行为。取整后一律走下面的整数前缀和路径（O(1)）。
        //   验收（CC 定）：**只允许 `Murkwood.rms` 的结果变化**，其余 179 个脚本逐位不变。
        let spacing = Number(P.spacing_to_other_terrain_types?.[0] ?? 0);
        if (Number.isFinite(spacing)) spacing = Math.floor(spacing);
        const hl = P.height_limits ? [Number(P.height_limits[0]), Number(P.height_limits[1])] : null;
        const flatOnly = !!P.set_flat_terrain_only;
        // DE 写法 set_avoid_player_start_areas [距离]：带参数用参数（0 = 不避让），不带用默认值（推断）
        const avoidR = P.set_avoid_player_start_areas ? (P.set_avoid_player_start_areas.length ? Number(P.set_avoid_player_start_areas[0]) : TUNE.avoidStartRadius) : 0;
        const N = this.N;
        const regOf = new Int32Array(this.terrain.length).fill(-1);
        // 诊断（第 34 轮）：按**原因**统计候选格被拒的次数 —— 只在调用方设了 this.traceReject 时收集
        const rj = this.traceReject ? { notBase: 0, claimed: 0, height: 0, flat: 0, avoidStart: 0, spacing: 0 } : null;
        // ── spacing 的 O(1) 化（第 38 轮提速，语义**逐格等价**）──
        // 【spacing 判定】只看 `this.terrain[j]`（`!== base && !== T` 即算"别的类型"），而 `this.terrain` 在
        //   **本指令执行期间完全不变**（要到函数末尾才统一写入）⇒ "半径 spacing 的方形邻域内有没有坏格" 是个
        //   **静态**问题，可以建一次二维前缀和（O(N²)），之后每次判定 O(1)，替掉原来的 (2·spacing+1)² 逐格扫描。
        //   原写法（保留备查，语义完全一致）：
        //     for (dy=-spacing..spacing) for (dx=-spacing..spacing) { if (越界) continue;
        //         if (terrain[j] !== base && terrain[j] !== T) return false; }
        //   越界格在原写法里被 `continue` 跳过 ⇒ 前缀窗口取「与网格的交集」即可，两者逐格等价。
        // ⚠️ 只有**整数** spacing 才能这样替：非整数（实测 `Murkwood.rms` 用 1.656 / 3.312）时，原写法的
        //   `dy++` 会在非整数起点上步长错开，算出**非整数** xx/yy；原实现用 `this.idx()` 取到 undefined，
        //   于是把该格当"坏格"拒绝。这个怪行为**必须原样保留**（否则那些脚本的结果会变），所以非整数走老循环。
        const spacingInt = Number.isInteger(spacing) && spacing > 0;
        let badPre = null;
        const W1 = N + 1;
        if (spacingInt) {
            badPre = new Int32Array(W1 * W1);
            for (let y = 0; y < N; y++) {
                let bad = 0;
                const rowBase = y * N, preRow = (y + 1) * W1, prevRow = y * W1;
                for (let x = 0; x < N; x++) {
                    const t = this.terrain[rowBase + x];
                    if (t !== base && t !== T) bad++;
                    badPre[preRow + x + 1] = badPre[prevRow + x + 1] + bad;
                }
            }
        }
        const anyBadNear = (x, y) => {
            const x0 = x - spacing < 0 ? 0 : x - spacing, x1 = x + spacing >= N ? N - 1 : x + spacing;
            const y0 = y - spacing < 0 ? 0 : y - spacing, y1 = y + spacing >= N ? N - 1 : y + spacing;
            return badPre[(y1 + 1) * W1 + (x1 + 1)] - badPre[y0 * W1 + (x1 + 1)] - badPre[(y1 + 1) * W1 + x0] + badPre[y0 * W1 + x0] > 0;
        };
        const ok = (i, r) => {
            if (this.terrain[i] !== base || regOf[i] !== -1) { if (rj) { if (this.terrain[i] !== base) rj.notBase++; else rj.claimed++; } return false; }
            const x = i % N, y = (i / N) | 0;
            if (hl && (this.elev[i] < hl[0] || this.elev[i] > hl[1])) { if (rj) rj.height++; return false; }
            if (flatOnly && D4.some((dd) => this.inb(x + dd[0], y + dd[1]) && this.elev[this.idx(x + dd[0], y + dd[1])] !== this.elev[i])) { if (rj) rj.flat++; return false; }
            if (avoidR > 0) for (const s of this.starts) if (Math.hypot(s.x - x, s.y - y) < avoidR) { if (rj) rj.avoidStart++; return false; }
            // 【方案 C 全放开 —— 第 35 轮实验选出，**第 36 轮已获 CC 批准**】只隔开「底地形」与「本地形」以外的地形。
            //   与 genie-rms `canPlaceTerrainOn()` 的 spacing 判定一致（只容忍 base 与自己）。
            //   团块过大由**种子分离**（见 seed() 的 seedRadius）解决，不靠 spacing —— 见下方 seedR。
            //   若要回 A：if (regOf[j] !== -1 ? regOf[j] !== r : this.terrain[j] !== base) { … }
            //   若要回 B：if (regOf[j] !== -1 ? regOf[j] !== r : (this.terrain[j] !== base && this.terrain[j] !== T)) { … }
            //   判定已 O(1) 化（见上方 anyBadNear）：`badPre` ＝「是本条 base 与 T 之外的地形」的二维前缀和。
            if (spacing > 0) {
                if (spacingInt) {
                    if (anyBadNear(x, y)) { if (rj) rj.spacing++; return false; }
                } else {
                    // 非整数 spacing：**原样保留**老写法（含上面注释里那个"非整数下标 → undefined → 当坏格"的行为）
                    for (let dy = -spacing; dy <= spacing; dy++) for (let dx = -spacing; dx <= spacing; dx++) {
                        const xx = x + dx, yy = y + dy;
                        if (!this.inb(xx, yy)) continue;
                        const j = this.idx(xx, yy);
                        if (this.terrain[j] !== base && this.terrain[j] !== T) { if (rj) rj.spacing++; return false; }
                    }
                }
            }
            return true;
        };
        // genie-rms：种子之间用 removeArea 挖开，半径 baseArea = min(2, 2*sqrt(tiles/numberOfClumps))
        // 种子之间的挖空半径 ＝ **一个团长满后的半径**（推导，非拟合）：
        //   每团平均格数 = tiles / numberOfClumps，团若近似圆盘则半径 = sqrt(每团格数 / π)。
        //   种子相隔"一个团半径"→ 各团长满后**刚好相切**，既不像 A/B 那样被 spacing 判死（水链断掉），
        //   也不像 C 那样从起点就重叠成一整片。
        //   实测（地中海 10 种子）：森林最大块 150 vs DE 149；块数 27 vs 29；中位 74 vs 79；水三项与 C 完全相同。
        //   ⚠️ genie-rms 写的是 `min(2, 2*sqrt(tiles/clumps))`（恒等于 2）—— 那是 AoC 近似，实测半径 2 无效（最大块仍 358→329）。
        const seedR = Math.max(1, Math.round(Math.sqrt((target || 1) / Math.max(1, clumps) / Math.PI)));
        const regions = this.seed(Math.min(clumps, target || 1), (i) => ok(i, -1), (i, r) => { regOf[i] = r; }, seedR);
        if (target > 0) this.grow(regions, target, clumpF, (j, r) => ok(j, r), (j, r) => { regOf[j] = r; }, (j, r) => regOf[j] === r);
        // 官方（Forgotten Empires DE RMS 文档）：terrain_mask 1 = 盖在基础地形之上（物件改用 layer_to_place_on），
        //   2 = 垫在之下。实现（推断）：1 → 只改视觉图层，逻辑地形不变（森林被草盖住，树仍在）；
        //   2 → 逻辑地形换成新地形，视觉上仍显示原地形。
        // 诊断（第 21 轮）：逐条记录 base/baseCount/target/实铺 —— 查「链式 base_terrain」在哪一步断掉。
        // 只在调用方设了 this.traceTerrain 时才收集（默认不开，零影响）。
        if (this.traceTerrain) {
            let got = 0;
            for (let i = 0; i < regOf.length; i++) if (regOf[i] >= 0) got++;
            this.traceTerrain.push({ T, base, baseCount, target, clumps, got, mask: Number(P.terrain_mask?.[0] ?? 0), rj });
        }
        const mask = Number(P.terrain_mask?.[0] ?? 0);
        // 🔴 修（第 21 轮）：原来只遍历 `regions`，而 `regions` 是「每个团的**种子格**」——
        //   `grow` 只把吞下的格子记进 `regOf`、**从不回填 regions**，于是除种子外的格子地形根本没换。
        //   实测后果：Mediterranean.rms 的水遮罩共 10 条 create_terrain（1→23→57→23→22→57…），
        //   每条都只改掉 clumps 个格子 → 最终 23 只剩 2.4%、22/57 一个都没出现。
        //   改为遍历 `regOf` 里属于本条指令的全部格子。
        for (let i = 0; i < this.terrain.length; i++) {
            if (regOf[i] < 0) continue;
            if (mask === 1) this.layer[i] = T;
            else if (mask === 2) { this.layer[i] = this.layer[i] >= 0 ? this.layer[i] : this.terrain[i]; this.terrain[i] = T; }
            else { this.terrain[i] = T; this.layer[i] = -1; }
        }
    }

    /**
     * 沙滩：引擎后处理，不是脚本铺的（genie-rms 的 checkBorders；DE 真图 de_map_1 也有沙滩格）。
     * 陆地格（含森林格）四邻有水 → 沙滩（雪 / 冰邻水 → 冰岸）。
     */
    applyBeaches() {
        const N = this.N;
        const BEACH = this.constOf('BEACH') ?? 2, ICE_BEACH = this.constOf('BEACH_ICE') ?? 37;
        const change = [];
        for (let i = 0; i < this.terrain.length; i++) {
            const t = this.terrain[i];
            if (this.waterTerrains.has(t)) continue;   // 森林格邻水也变沙滩（DE 真图：林中水塘四周有一圈沙滩）
            const x = i % N, y = (i / N) | 0;
            // 【第 41 轮修 · 依据 DE 基准图实测】沙滩用**八邻**判定，不是四邻：
            //   DE 的 526 个沙滩格里，八邻有水 = **100.0%**、四邻有水只有 77.6%、**仅斜对角邻水 22.4%**
            //   （那 118 格正是之前被误算成"距水 2 格"的那些）⇒ 四邻判定会漏掉整条斜向海岸线。
            if (D8.some((d) => this.inb(x + d[0], y + d[1]) && this.waterTerrains.has(this.terrain[this.idx(x + d[0], y + d[1])]))) {
                const nm = this.info?.get(t)?.name ?? this.names.get(t) ?? '';
                // 脚本参数优先（`beach_terrain`）：这条地形临水 → 用它指定的沙滩地形；没指定才走全局兜底
                const scriptBeach = this.beachOf.get(t);
                // 脚本参数优先；没指定就走全局兜底（实测：去掉兜底后本地中海沙滩 1.5% → **0%**，而 DE 是 2.5%）
                change.push([i, scriptBeach !== undefined ? scriptBeach : (/SNOW|ICE|Snow|Ice/.test(nm) ? ICE_BEACH : BEACH)]);
            }
        }
        for (const [i, b] of change) { this.terrain[i] = b; this.layer[i] = -1; }
    }

    /**
     * 地形自带单位（以 DE 的 dat 为准：terrain_unit_id / terrain_unit_density / terrain_unit_masked_density）：
     *   · 森林类（最后一项密度 = 1000）：每格必长一棵，按累计千分比选种类
     *       —— 实证：地中海森林 柏树100/橄榄500/意松1000 ↔ DE 真图 34 : 147 : 148；
     *   · 其它地形：每种装饰按自己的千分比独立掷
     *       —— 实证：Grass 3 的干草 60/1000 ↔ DE 真图 3777 格出 213 丛（5.6%）；
     *   · 被 terrain_mask 盖住的格子：视觉图层的装饰改用「遮罩密度」（推断）。
     * 没有 dat 表时退回「森林每格一棵」。
     */
    plantTerrainUnits() {
        const N = this.N;
        const put = (unit, i) => this.objects.push({ id: unit, auto: true, x: (i % N) + 0.5, y: ((i / N) | 0) + 0.5 });
        for (let i = 0; i < this.terrain.length; i++) {
            const t = this.terrain[i];
            if (!this.terrainUnits) { if (this.forestTerrains.has(t)) this.objects.push({ id: -1, tree: t, x: (i % N) + 0.5, y: ((i / N) | 0) + 0.5 }); continue; }
            const list = this.terrainUnits.get(t);
            if (list?.length && list[list.length - 1].density >= 1000) {
                const r = this.rng() * 1000;
                const pick = list.find((u) => r < u.density);
                if (pick && pick.density > 0) put(pick.unit, i);
                continue;
            }
            const lay = this.layer[i];
            const src = lay >= 0 ? this.terrainUnits.get(lay) : list;
            if (!src || (src.length && src[src.length - 1].density >= 1000)) continue;
            for (const u of src) {
                // 【第 45 轮实验 · 已回退】试过把 `lay >= 0 ? u.masked : u.density` 改成一律 `u.density`：
                //   结果**更差**（我方地面装饰 295 → 336，DE 是 234）—— 因为分层格子用的是**遮罩地形的种类表**，
                //   而遮罩地形的普通密度往往更高（例 Dry Grass 的 GRASS_DRY 80‰）⇒ 真正起作用的是"用哪张表"，不是密度字段。
                //   实验数据（DE 自己的地形格上算期望）：普通密度口径 258（对 DE 234 差 +10%）｜遮罩密度口径 129（差 −45%）｜
                //   但 **DE 基准图没有图层信息**，无法把"用哪张表"与"用哪个密度"分开 ⇒ 判为**查不清**，按 CC 规则回退、记为已知偏差。
                const d = lay >= 0 ? u.masked : u.density;
                if (d > 0 && this.rng() * 1000 < d) put(u.unit, i);
            }
        }
    }

    /** 半径 r 内是否已有物件（按 8×8 格分桶） */
    nearObject(x, y, r) {
        const B = 8, g = this.objBuckets;
        if (!g) return false;
        for (let by = Math.floor((y - r) / B); by <= Math.floor((y + r) / B); by++) for (let bx = Math.floor((x - r) / B); bx <= Math.floor((x + r) / B); bx++) {
            const list = g.get(by * 1000 + bx);
            if (list) for (const o of list) if (Math.hypot(o.x - 0.5 - x, o.y - 0.5 - y) < r) return true;
        }
        return false;
    }

    constOf(name) { for (const [v, n] of this.names) if (n === name) return v; return null; }

    // ───────────────────────── OBJECTS ─────────────────────────
    /** <CLIFF_GENERATION> 段级指令（平铺，不在块里） */
    cliffCmd(c) {
        switch (c.cmd) {
            case 'min_number_of_cliffs': this.cliffMin = Number(c.args[0]); break;
            case 'max_number_of_cliffs': this.cliffMax = Number(c.args[0]); break;
            case 'min_length_of_cliff': this.cliffMinLen = Number(c.args[0]); break;
            case 'max_length_of_cliff': this.cliffMaxLen = Number(c.args[0]); break;
            case 'min_distance_cliffs': this.cliffGap = Number(c.args[0]); break;
            case 'min_terrain_distance': this.cliffTerrDist = Number(c.args[0]); break;
            case 'cliff_curliness': this.cliffCurliness = Number(c.args[0]); break;
            case 'cliff_type': this.cliffType = Number(c.args[0]); break;
            default: this.note('CLIFF:' + c.cmd);
        }
    }

    /**
     * 生成悬崖。DE 里悬崖是**物件**（dat：`Cliff (X) NN` / `Marble Cliff N`，每类 9 个连接变体），
     * **不是地形** —— dat 的地形表里没有任何 cliff。
     * 算法结构参照 genie-rms 的 CliffGenerator（只借结构，代码未抄）：
     *   ① 3×3 粗网格上找候选：9 格必须非水、且高程完全相同
     *   ② 条数 = min + rng(max-min)；max <= 0 → 不生成
     *   ③ 起点 → 按 cliff_curliness 方向游走，只走向「同高程」的合格候选
     *   ④ 落笔：路径格 ×3+1 回到细网格放 cliff 物件；按 min_distance_cliffs 排除周围候选
     * ⚠️ 变体 _1.._9 的形状语义未证实；实测 de_map_1 只出现 `CLIFF_DEFAULT_1`，故先统一用 _1。
     */
    generateCliffs() {
        if (this.cliffMax <= 0) return;
        const N = this.N;
        const minN = Math.max(0, this.cliffMin), maxN = Math.max(minN, this.cliffMax);
        const n = minN + this.rng.int(0, maxN - minN);
        const W = Math.floor(N / 3), H = Math.floor(N / 3);
        if (W <= 1 || H <= 1 || n <= 0) return;

        // ① 候选：3×3 块内 9 格「非水 + 同高程」；再按 min_terrain_distance 排除靠水的块
        //    （genie-rms 同名处理：含水块 → invalidateArea(minDistanceToTerrain)）
        const wet = new Uint8Array(W * H);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 3; dx++) {
                if (this.waterTerrains.has(this.terrain[(y * 3 + dy) * N + (x * 3 + dx)])) { wet[y * W + x] = 1; break; }
            }
        }
        const terrDist = Math.max(0, this.cliffTerrDist);
        const cand = new Map();
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            if (wet[y * W + x]) continue;
            let nearWater = false;
            for (let dy = -terrDist; dy <= terrDist && !nearWater; dy++) for (let dx = -terrDist; dx <= terrDist; dx++) {
                const xx = x + dx, yy = y + dy;
                if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
                if (wet[yy * W + xx]) { nearWater = true; break; }
            }
            if (nearWater) continue;
            let h = -1, ok = true;
            for (let dy = 0; dy < 3 && ok; dy++) for (let dx = 0; dx < 3; dx++) {
                const e = this.elev[(y * 3 + dy) * N + (x * 3 + dx)];
                if (h < 0) h = e; else if (h !== e) { ok = false; break; }
            }
            if (ok) cand.set(y * W + x, h);
        }
        if (!cand.size) return;

        const base = CLIFF_BASE[this.cliffType] ?? CLIFF_BASE[0];
        const gap = Math.max(0, this.cliffGap);
        const clearArea = (cx, cy) => {
            for (let dy = -gap; dy <= gap; dy++) for (let dx = -gap; dx <= gap; dx++) cand.delete((cy + dy) * W + (cx + dx));
        };
        const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];

        for (let k = 0; k < n; k++) {
            const len = this.cliffMinLen + this.cliffRng.int(0, Math.max(0, this.cliffMaxLen - this.cliffMinLen));
            if (len < 3) continue;
            const left = [...cand.keys()];
            if (!left.length) break;
            let key = left[Math.floor(this.cliffRng() * left.length)];
            let cx = key % W, cy = Math.floor(key / W);
            const height = cand.get(key);
            let dir = this.cliffRng.int(0, 3);
            const path = [];
            const visited = new Set();          // 本段已走的格：不许踩回自己（否则会绕圈/回头 ⇒ 前后邻居同向）
            for (let i = 0; i < len; i++) {
                if (cand.get(cy * W + cx) !== height) break;
                path.push([cx, cy]);
                visited.add(cy * W + cx);
                if (!this.cliffNoTurn) {
                    const r = this.cliffRng() * 100;
                    if (r < this.cliffCurliness / 2) dir = (dir + 3) % 4;
                    else if (r < this.cliffCurliness) dir = (dir + 1) % 4;
                }
                let moved = false;
                for (const d2 of (this.cliffNoTurn ? [dir] : [dir, dir + 1, dir - 1])) {
                    const dd = ((d2 % 4) + 4) % 4;
                    const nx = cx + DIRS[dd][0], ny = cy + DIRS[dd][1];
                    const nk = ny * W + nx;
                    if (visited.has(nk)) continue;
                    if (cand.get(nk) === height) { cx = nx; cy = ny; dir = dd; moved = true; break; }
                }
                if (!moved) break;
            }
            if (!path.length) continue;
            // ④ 落笔（细网格坐标）+ 排除周围候选
            for (let i = 0; i < path.length; i++) {
                const [px, py] = path[i];
                const nbrs = [];
                for (const j of [i - 1, i + 1]) {
                    if (j < 0 || j >= path.length) continue;
                    const dir = cliffDir8(path[j][0] - px, path[j][1] - py);
                    if (dir) nbrs.push(dir);
                }
                const key = nbrs.sort().join('|');
                let rot = CLIFF_TOPOLOGY_TABLE[key];
                if (rot === undefined) {
                    this.cliffMiss = this.cliffMiss ?? new Map();
                    this.cliffMiss.set(key, (this.cliffMiss.get(key) ?? 0) + 1);
                    const seg = cliffDir8(path[path.length - 1][0] - path[0][0], path[path.length - 1][1] - path[0][1]);
                    rot = CLIFF_STRAIGHT_ROT[seg] ?? 0;
                }
                this.objects.push({ id: base, cliff: true, x: px * 3 + 1, y: py * 3 + 1, rot });
                clearArea(px, py);
            }
            this.cliffMade = (this.cliffMade ?? 0) + 1;
        }
    }

    /**
     * 收集 create_object_group 定义：`create_object_group NAME { add_object <物件id> <权重> … }`
     * （racket 文档：*"List a selection of objects with probabilities…"*；块内只有 add_object，权重是千分/百分比）
     * 组名不是 #const，解析后仍是符号字符串 —— 先全扫一遍收集，与 create_object 的先后无关。
     * 实测 Arabia.rms：3 个组（HERDABLE_SMALL_A/B、HUNTABLE_SMALL_A），2 处 create_object 用了组名。
     */
    collectObjectGroups() {
        for (const c of this.sections.OBJECTS_GENERATION ?? []) {
            if (c.cmd !== 'create_object_group') continue;
            const name = String(c.args?.[0] ?? '');
            const list = (c.block ?? [])
                .filter((b) => b.cmd === 'add_object')
                .map((b) => ({ id: Number(b.args[0]), weight: Number(b.args[1] ?? 1) }))
                .filter((it) => Number.isFinite(it.id) && it.weight > 0);
            if (name && list.length) this.objectGroups.set(name, list);
        }
    }

    /** 从物件组里按权重抽一个 id。每次放置都调用 → 组内每个物件独立随机（racket：individually randomized） */
    pickFromGroup(list) {
        let total = 0;
        for (const it of list) total += it.weight;
        if (total <= 0) return list[0].id;
        let r = this.rng() * total;
        for (const it of list) { r -= it.weight; if (r < 0) return it.id; }
        return list[list.length - 1].id;
    }

    objectCmd(c) {
        if (c.cmd === 'create_object_group') return;      // 已在 collectObjectGroups 里收集
        if (c.cmd !== 'create_object') { this.note('OBJ:' + c.cmd); return; }
        // create_object 的第一个参数可能是「物件常量」，也可能是组名（组名不是 #const，Number() 会得到 NaN）
        const fixedId = Number(c.args[0]);
        const groupList = Number.isNaN(fixedId) ? (this.objectGroups.get(String(c.args[0])) ?? null) : null;
        if (Number.isNaN(fixedId) && !groupList) { this.note('OBJ:unknown-object:' + c.args[0]); return; }
        // 组名情形下，先拿组里第一个 id 做「水里/森林」这类按名字的判定；真正放置时逐个再抽
        const id = Number.isNaN(fixedId) ? groupList[0].id : fixedId;
        const P = props(c.block);
        const N = this.N;
        const perPlayer = !!P.set_place_for_every_player;
        let count = Number(P.number_of_objects?.[0] ?? 1);
        // 🔴 number_of_groups 写 0 ＝「未指定」：官方手册 tc-rms-guide.md:374-376
        //    「If no groups are specified, then there will be one group for each object（全部散开）」
        //    原写法 `!!P.number_of_groups` 对 [0] 也是 true → groups=0 → capGroups=0 → 一个都不放
        //    （实测 HUNTABLE_SMALL_A 的 create_object 就栽在这，物件数恒为 0）
        let groups = Number(P.number_of_groups?.[0] ?? 0);
        const hasGroups = groups > 0;
        // 手册：set_scaling_to_map_size —— 数量以「Large Map（144×144）」为准按面积缩放；有分组则缩放组数，否则缩放物件数
        if (P.set_scaling_to_map_size) {
            const k = (N * N) / (144 * 144);
            if (hasGroups) groups = Math.max(1, Math.round(groups * k)); else count = Math.max(1, Math.round(count * k));
        }
        const variance = Number(P.group_variance?.[0] ?? 0);
        const tight = !!P.set_tight_grouping;
        const gr = Number(P.group_placement_radius?.[0] ?? (tight ? 1 : 3));
        const onT = P.terrain_to_place_on ? Number(P.terrain_to_place_on[0]) : null;
        const onLayer = P.layer_to_place_on ? Number(P.layer_to_place_on[0]) : null;   // 官方：terrain_mask 1 的地形用它引用
        const onLand = P.place_on_specific_land_id ? Number(P.place_on_specific_land_id[0]) : null;
        const minP = Number(P.min_distance_to_players?.[0] ?? 0), maxP = Number(P.max_distance_to_players?.[0] ?? 9999);
        const edge = Number(P.min_distance_to_map_edge?.[0] ?? 1);
        const avoidForest = Number(P.avoid_forest_zone?.[0] ?? 0);
        const maxZone = Number(P.max_distance_to_other_zones?.[0] ?? 0);
        // 两种组间距（推断，依 DE 社区文档的用法）：
        //   temp_min_distance_group_placement ＝ 本条指令各组之间；min_distance_group_placement ＝ 与此前所有已放物件之间
        // 手册 `min_distance_group_placement` 的**定义**：「Distance to separate center of a group—prevents a
        //   massive wad of gold, stone and berries all together」⇒ **排斥**（把各组中心分开）。
        //   CC 第 31 轮判定：定义优先于鱼例子里 "never more than 4 tiles from another fish" 那句措辞。
        const gapAll = Number(P.min_distance_group_placement?.[0] ?? 0);
        const gapSame = Math.max(gapAll, Number(P.temp_min_distance_group_placement?.[0] ?? 0));
        // 只能在水里的物件（鱼类）：陆地上放不下（推断；DE 的 dat 里每个单位有通行地形限制，待换成以 dat 为准）
        // 只能放水里的物件：**以 dat 的 terrain_restriction 为准**（不再靠名字正则猜）
        // 类别号见 WATER_RESTRICTIONS；没有这张表时退回按名字判（老写法）。
        const restrict = this.unitRestrict ? this.unitRestrict.get(id) : undefined;
        const waterOnly = restrict !== undefined
            ? WATER_RESTRICTIONS.has(restrict)
            : /FISH|DORADO|SALMON|SNAPPER|TUNA|PERCH|MARLIN|DOLPHIN|SHARK|WHALE/.test(this.objNames.get(id) ?? '');
        const isMarker = !!P.actor_area;
        const markerArea = isMarker ? Number(P.actor_area[0]) : 0;
        const markerR = Number(P.actor_area_radius?.[0] ?? 1);
        const avoidAreas = new Set((c.block ?? []).filter((b) => b.cmd === 'avoid_actor_area').map((b) => Number(b.args[0])));
        const inArea = P.actor_area_to_place_in ? Number(P.actor_area_to_place_in[0]) : null;
        const placedCenters = [];
        const okTile = (x, y, s) => {
            if (x < edge || y < edge || x >= N - edge || y >= N - edge) return false;
            const gi = y * N + x;
            const t = this.terrain[gi];
            if (waterOnly && !this.waterTerrains.has(t)) return false;
            if (onLayer !== null) { if (this.layer[gi] !== onLayer && t !== onLayer) return false; }
            else if (onT !== null) { if (t !== onT) return false; }
            else if (!waterOnly && (this.waterTerrains.has(t) || this.forestTerrains.has(t))) return false;
            if (onLand !== null && this.landId[gi] !== onLand) return false;
            for (const a of avoidAreas) if (this.areaGrid.get(a)?.[gi]) return false;
            if (inArea !== null && !this.areaGrid.get(inArea)?.[gi]) return false;
            // 距玩家：perPlayer 时按「当前玩家」算；否则按「最近的玩家」算。
            // 🔴 max/min_distance_to_players **不依赖 set_place_for_every_player**（官方手册的鱼/金矿例子都没写它）。
            //    原写法 `if (s) {…}` 在 s=null（未写 set_place_for_every_player）时**整段跳过** ——
            //    object_setup.inc:3/16/29 那 3 条 PLACEHOLDER_GENERIC 因此全图乱放，
            //    实测 1902 有 36% 落在 max_distance_to_players 之外（DE 真图一个都没有）。
            if (minP > 0 || maxP < 9999) {
                let d;
                if (s) d = Math.hypot(s.x - x, s.y - y);
                else {
                    d = Infinity;
                    for (const st of this.starts) { const dd = Math.hypot(st.x - x, st.y - y); if (dd < d) d = dd; }
                }
                if (d < minP || d > maxP) return false;
            }
            // 手册：max_distance_to_other_zones ＝「物件能离**别的 zone** 多近」（防靠岸、防敌船）。
            //   实现依 genie-rms：在**上/下/左/右 + 四角共 8 个方向**、距离 N 处检查 zone 是否与中心一致。
            if (TUNE.useMaxZone && maxZone > 0 && this.zoneGrid) {
                const zc = this.zoneGrid[gi];
                for (const [dx, dy] of D8) {
                    const xx = x + dx * maxZone, yy = y + dy * maxZone;
                    if (!this.inb(xx, yy)) continue;
                    if (this.zoneGrid[this.idx(xx, yy)] !== zc) return false;
                }
            }
            if (avoidForest > 0) {
                for (let dy = -avoidForest; dy <= avoidForest; dy += 2) for (let dx = -avoidForest; dx <= avoidForest; dx += 2) {
                    const xx = x + dx, yy = y + dy;
                    if (this.inb(xx, yy) && this.forestTerrains.has(this.terrain[this.idx(xx, yy)])) return false;
                }
            }
            return true;
        };
        // actor_area：物件「自己」在周围划出一块区域，供后面的物件 avoid_actor_area / actor_area_to_place_in 引用。
        // 物件本身照常放出（金矿、羊、鹿都带 actor_area）；不可见的占位物件（如 1902）由出图端按名字过滤。
        let emitted = 0;                       // 诊断用（第 28 轮）：本条 create_object 的实放数
        const emit = (x, y) => {
            emitted++;
            // 物件组：每个都独立随机（racket 文档原话）—— 所以每次放置都重新按权重抽
            const o = { id: groupList ? this.pickFromGroup(groupList) : id, x: x + 0.5, y: y + 0.5 };
            this.objects.push(o);
            if (!this.objBuckets) this.objBuckets = new Map();
            const k = Math.floor(y / 8) * 1000 + Math.floor(x / 8);
            (this.objBuckets.get(k) ?? this.objBuckets.set(k, []).get(k)).push(o);
            if (isMarker) {
                this.markers.push({ area: markerArea, x, y, r: markerR });
                let g = this.areaGrid.get(markerArea);
                if (!g) { g = new Uint8Array(N * N); this.areaGrid.set(markerArea, g); }
                const rr = Math.ceil(markerR);
                for (let dy = -rr; dy <= rr; dy++) for (let dx = -rr; dx <= rr; dx++) {
                    if (dx * dx + dy * dy <= markerR * markerR && this.inb(x + dx, y + dy)) g[(y + dy) * N + x + dx] = 1;
                }
            }
        };
        // 手册：不分组 = 每个物件自成一组（全部散开）
        const nGroups = hasGroups ? groups : count;
        const perGroup = hasGroups ? count : 1;
        const capGroups = Math.min(nGroups, Math.floor((N * N) / 6));   // 标记物常写 2048/4096 表示「尽量多」，按可放格数封顶
        // set_circular_placement：物件只落在「距玩家 ≈ 固定半径」的圆环上，而不是圆环内的任意位置。
        // 官方手册与 racket 均无此词条，依据来自实证：
        //   ① 本机脚本里它总是与 min_distance_to_players 配对（Arabia.rms:1624-1625 / 1713-1714 / 1736-1737）；
        //   ② DE 真图侧证 —— SOLID_OBJECT（脚本 number_of_objects 4 + min_distance_to_players 32）在 de_map_1 里只出现 2 个，
        //      说明它是「收紧候选到一圈」，再被 avoid_forest_zone / max_distance_to_other_zones 排掉一部分。
        // 半径取 min_distance_to_players；未给 min 时取 max_distance_to_players（object_setup.inc:3/16/29 的 1902 属这类）。
        const circular = !!P.set_circular_placement;
        const ringR = minP > 0 ? minP : (maxP < 9999 ? maxP : 0);
        const onRing = (ox, oy) => {
            const ang = this.rng() * Math.PI * 2;
            const d = ringR + (this.rng() - 0.5) * 2;          // ±1 格抖动，避免整格化后挤在同一点
            return [Math.round(ox + Math.cos(ang) * d), Math.round(oy + Math.sin(ang) * d)];
        };
        const once = (s) => {
            for (let g = 0; g < capGroups; g++) {
                let cx = -1, cy = -1;
                for (let a = 0; a < 60; a++) {
                    let x, y;
                    if (s && circular && ringR > 0) { const p = onRing(s.x, s.y); x = p[0]; y = p[1]; }
                    else if (s) { const ang = this.rng() * Math.PI * 2, d = minP + this.rng() * (Math.min(maxP, N) - minP); x = Math.round(s.x + Math.cos(ang) * d); y = Math.round(s.y + Math.sin(ang) * d); }
                    else if (circular && ringR > 0 && this.starts.length) { const st = this.starts[this.rng.int(0, this.starts.length - 1)]; const p = onRing(st.x, st.y); x = p[0]; y = p[1]; }
                    else { x = this.rng.int(0, N - 1); y = this.rng.int(0, N - 1); }
                    if (!this.inb(x, y) || !okTile(x, y, s)) continue;
                    if (gapSame > 0 && placedCenters.some((p) => Math.abs(p.x - x) < gapSame && Math.abs(p.y - y) < gapSame && Math.hypot(p.x - x, p.y - y) < gapSame)) continue;
                    // (B) 手册口径：`min_distance_group_placement` 的作用域是**本指令自己的组中心**
                    //   —— 手册 :351 "Distance to separate center of **a group** … if no groups are assigned,
                    //   then this instruction will apply to all objects"；手册 :532 "each object is treated as its own group"。
                    //   CC 第 31/32 轮裁定采纳 (B)（依据：DE 地中海基准上 GOLDM 36 vs 36、物件总数差 0.6%）。
                    //   ⚠️ 旧写法 `this.nearObject()` 查的是**全地图**物件，会把地形自带的 938 棵树/草丛也算进去，
                    //      导致 GOLDM 6 / STONM 4 / GOAT 4 / FORAG 0 / MOUFLON 0（DE 分别 36 / 22 / 26 / 12 / 6）。
                    if (gapAll > 0 && placedCenters.some((p) => Math.hypot(p.x - x, p.y - y) < gapAll)) continue;
                    cx = x; cy = y; break;
                }
                if (cx < 0) continue;
                placedCenters.push({ x: cx, y: cy });
                const n = Math.max(1, perGroup + (variance ? this.rng.int(-variance, variance) : 0));
                const used = new Set([cy * N + cx]);
                emit(cx, cy);
                for (let k = 1; k < n; k++) {
                    for (let a = 0; a < 25; a++) {
                        const x = cx + this.rng.int(-gr, gr), y = cy + this.rng.int(-gr, gr);
                        if (!this.inb(x, y) || used.has(y * N + x) || !okTile(x, y)) continue;
                        used.add(y * N + x); emit(x, y); break;
                    }
                }
            }
        };
        if (perPlayer) for (const s of this.starts) once(s); else once(null);
        // 诊断（第 28 轮）：逐条记录 create_object 的参数与实放数（默认不开，零影响）
        if (this.traceObjects) this.traceObjects.push({ id, name: this.objNames?.get?.(id) ?? null, count, hasGroups, capGroups, emitted });
    }
}
