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

/** 未证实 / 需校准的取值（对照 DE 真图逐项校准） */
export const TUNE = {
    /** 玩家出生点避让半径（set_avoid_player_start_areas）——推断 */
    avoidStartRadius: 14,
    /** 成团紧凑度：gamma = clumping_factor / 此值（越大越方正）——推断 */
    clumpScale: 10,
};

/** 把块里的子指令整理成 { 名: 参数数组 }（后者覆盖前者），旗标类指令值为 [] */
function props(block = []) {
    const o = {};
    for (const c of block) o[c.cmd] = c.args;
    return o;
}

const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export class MapEngine {
    constructor(sections, { size = 144, players = 2, seed = 1, names = new Map(), info = null, objNames = new Map(), terrainUnits = null } = {}) {
        this.sections = sections;
        this.N = size;
        this.players = players;
        this.rng = makeRng(seed);
        this.names = names;                         // 地形常量值 → 名字（random_map.def）
        /** 地形编号 → dat 里的 { name, name_2, blend_type }（scratch/de_terrain_manifest.json，来自 empires2_x2_p1.dat） */
        this.info = info;
        /** 物件常量值 → 名字（random_map.def 的物件段） */
        this.objNames = objNames;
        /** 地形编号 → dat 登记的自动单位 [{unit, density, masked}]（scratch/de_terrain_units.json，来自 empires2_x2_p1.dat） */
        this.terrainUnits = terrainUnits;
        const n = size * size;
        this.terrain = new Int16Array(n);
        /** 视觉图层（terrain_mask）：-1 = 无，否则画这一层；逻辑地形（物件/森林/通行）仍看 terrain */
        this.layer = new Int16Array(n).fill(-1);
        this.elev = new Int8Array(n);
        this.landId = new Int32Array(n).fill(-1);
        this.objects = [];
        this.markers = [];                          // actor_area 逻辑标记（不可见）
        this.areaGrid = new Map();                  // 区域号 → 占位网格
        this.starts = [];                           // 玩家出生点
        this.unsupported = new Map();
        this.forestTerrains = new Set();
        this.waterTerrains = new Set();
        /** create_object_group 组名 → [{id, weight}]：物件组，放置时按权重逐个随机取（见 collectObjectGroups） */
        this.objectGroups = new Map();
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
        this.runLand(S.LAND_GENERATION ?? []);
        for (const c of S.ELEVATION_GENERATION ?? []) this.elevCmd(c);
        for (const c of S.TERRAIN_GENERATION ?? []) this.terrainCmd(c);
        this.applyBeaches();
        this.plantTerrainUnits();
        this.collectObjectGroups();
        for (const c of S.OBJECTS_GENERATION ?? []) this.objectCmd(c);
        return this;
    }

    // ───────────────────────── LAND ─────────────────────────
    runLand(cmds) {
        const deferred = [];
        for (const c of cmds) {
            if (c.cmd === 'base_terrain') { this.terrain.fill(Number(c.args[0])); continue; }
            if (c.cmd === 'create_land') {
                const P = props(c.block);
                // 推断：number_of_tiles 0 且没写 land_percent → 「铺满剩余空地」（如 Arabia 的 land_id 420，给物件
                // place_on_specific_land_id 用的中立区标签）。必须等其它陆地长完再铺，否则会先占满整张图。
                const fill = Number(P.number_of_tiles?.[0] ?? -1) === 0 && !P.land_percent;
                if (fill) deferred.push(P); else this.createLand(P, null);
                continue;
            }
            if (c.cmd === 'create_player_lands') { this.createPlayerLands(props(c.block)); continue; }
            this.note('LAND:' + c.cmd);
        }
        for (const P of deferred) {
            const id = Number(P.land_id?.[0] ?? 0);
            const terr = Number(P.terrain_type?.[0] ?? 0);
            for (let i = 0; i < this.landId.length; i++) if (this.landId[i] === -1) { this.landId[i] = id; this.terrain[i] = terr; }
        }
    }

    createPlayerLands(P) {
        const rParam = P.circle_radius ?? [34, 1];
        const R = (Number(rParam[0]) / 100) * this.N;            // 推断：circle_radius 是占边长的百分比
        const varPct = Number(rParam[1] ?? 0);
        const base = this.rng() * Math.PI * 2;
        for (let p = 0; p < this.players; p++) {
            const ang = base + (p / this.players) * Math.PI * 2;
            const rr = R * (1 + (this.rng() - 0.5) * 2 * varPct / 100);
            const cx = Math.round(this.N / 2 + Math.cos(ang) * rr);
            const cy = Math.round(this.N / 2 + Math.sin(ang) * rr);
            this.starts.push({ x: cx, y: cy });
            this.createLand(P, { x: cx, y: cy }, 100 + p);
        }
    }

    createLand(P, at, forcedId) {
        const N = this.N;
        const terr = Number(P.terrain_type?.[0] ?? 0);
        const id = forcedId ?? Number(P.land_id?.[0] ?? this.rng.int(200, 400));
        let want = Number(P.number_of_tiles?.[0] ?? 0);
        // 手册：land_percent 随地图缩放，number_of_tiles 不缩放；二者只用其一
        if (P.land_percent) want = Math.round(Number(P.land_percent[0]) / 100 * N * N);
        const baseR = Number(P.base_size?.[0] ?? 0);              // 手册：base_size = 陆地生长的最小半径
        const avoid = Number(P.other_zone_avoidance_distance?.[0] ?? 0);
        const clump = Number(P.clumping_factor?.[0] ?? 8);        // 手册：陆地默认 8，范围 1–15
        let cx, cy;
        if (at) { cx = at.x; cy = at.y; }
        else if (P.land_position) { cx = Math.round(Number(P.land_position[0]) / 100 * N); cy = Math.round(Number(P.land_position[1]) / 100 * N); }
        else { cx = this.rng.int(10, N - 10); cy = this.rng.int(10, N - 10); }
        const mine = [];
        const claim = (x, y) => { const i = this.idx(x, y); this.landId[i] = id; this.terrain[i] = terr; mine.push(i); };
        const free = (x, y) => {
            if (!this.inb(x, y)) return false;
            if (this.landId[this.idx(x, y)] !== -1) return false;
            if (avoid > 0) {
                for (let dy = -avoid; dy <= avoid; dy++) for (let dx = -avoid; dx <= avoid; dx++) {
                    const xx = x + dx, yy = y + dy;
                    if (!this.inb(xx, yy)) continue;
                    const l = this.landId[this.idx(xx, yy)];
                    if (l !== -1 && l !== id) return false;
                }
            }
            return true;
        };
        for (let dy = -baseR; dy <= baseR; dy++) for (let dx = -baseR; dx <= baseR; dx++) {
            if (dx * dx + dy * dy > baseR * baseR) continue;
            if (free(cx + dx, cy + dy)) claim(cx + dx, cy + dy);
        }
        if (mine.length === 0 && free(cx, cy)) claim(cx, cy);
        const own = (i) => this.landId[i] === id;
        this.grow([mine], want, clump, (j) => free(j % N, (j / N) | 0), (j) => { this.landId[j] = id; this.terrain[j] = terr; }, own);
        return mine;
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

    /** 在满足 ok 的格子里随机放 n 个种子，返回各团初始格子数组 */
    seed(n, ok, mark) {
        const cand = [];
        for (let i = 0; i < this.terrain.length; i++) if (ok(i)) cand.push(i);
        const regions = [];
        let tries = 0;
        while (regions.length < n && cand.length && tries++ < n * 30) {
            const i = cand[Math.floor(this.rng() * cand.length)];
            if (!ok(i)) continue;
            mark(i, regions.length);
            regions.push([i]);
        }
        return regions;
    }

    // ───────────────────────── TERRAIN ─────────────────────────
    terrainCmd(c) {
        if (c.cmd !== 'create_terrain') { if (!['color_correction', 'base_terrain'].includes(c.cmd)) this.note('TERR:' + c.cmd); return; }
        const T = Number(c.args[0]);
        const P = props(c.block);
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
        const spacing = Number(P.spacing_to_other_terrain_types?.[0] ?? 0);
        const hl = P.height_limits ? [Number(P.height_limits[0]), Number(P.height_limits[1])] : null;
        const flatOnly = !!P.set_flat_terrain_only;
        // DE 写法 set_avoid_player_start_areas [距离]：带参数用参数（0 = 不避让），不带用默认值（推断）
        const avoidR = P.set_avoid_player_start_areas ? (P.set_avoid_player_start_areas.length ? Number(P.set_avoid_player_start_areas[0]) : TUNE.avoidStartRadius) : 0;
        const N = this.N;
        const regOf = new Int32Array(this.terrain.length).fill(-1);
        const ok = (i, r) => {
            if (this.terrain[i] !== base || regOf[i] !== -1) return false;
            const x = i % N, y = (i / N) | 0;
            if (hl && (this.elev[i] < hl[0] || this.elev[i] > hl[1])) return false;
            if (flatOnly && D4.some((dd) => this.inb(x + dd[0], y + dd[1]) && this.elev[this.idx(x + dd[0], y + dd[1])] !== this.elev[i])) return false;
            if (avoidR > 0) for (const s of this.starts) if (Math.hypot(s.x - x, s.y - y) < avoidR) return false;
            if (spacing > 0) {
                // 手册：与其它地形保持距离，「包括同类型」——即别的团（哪怕同一种地形）也要隔开，只有本团自己不算
                for (let dy = -spacing; dy <= spacing; dy++) for (let dx = -spacing; dx <= spacing; dx++) {
                    const xx = x + dx, yy = y + dy;
                    if (!this.inb(xx, yy)) continue;
                    const j = this.idx(xx, yy);
                    if (regOf[j] !== -1 ? regOf[j] !== r : this.terrain[j] !== base) return false;
                }
            }
            return true;
        };
        const regions = this.seed(Math.min(clumps, target || 1), (i) => ok(i, -1), (i, r) => { regOf[i] = r; });
        if (target > 0) this.grow(regions, target, clumpF, (j, r) => ok(j, r), (j, r) => { regOf[j] = r; }, (j, r) => regOf[j] === r);
        // 官方（Forgotten Empires DE RMS 文档）：terrain_mask 1 = 盖在基础地形之上（物件改用 layer_to_place_on），
        //   2 = 垫在之下。实现（推断）：1 → 只改视觉图层，逻辑地形不变（森林被草盖住，树仍在）；
        //   2 → 逻辑地形换成新地形，视觉上仍显示原地形。
        const mask = Number(P.terrain_mask?.[0] ?? 0);
        for (const reg of regions) for (const i of reg) {
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
            if (D4.some((d) => this.inb(x + d[0], y + d[1]) && this.waterTerrains.has(this.terrain[this.idx(x + d[0], y + d[1])]))) {
                const nm = this.info?.get(t)?.name ?? this.names.get(t) ?? '';
                change.push([i, /SNOW|ICE|Snow|Ice/.test(nm) ? ICE_BEACH : BEACH]);
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
        // 两种组间距（推断，依 DE 社区文档的用法）：
        //   temp_min_distance_group_placement ＝ 本条指令各组之间；min_distance_group_placement ＝ 与此前所有已放物件之间
        const gapAll = Number(P.min_distance_group_placement?.[0] ?? 0);
        const gapSame = Math.max(gapAll, Number(P.temp_min_distance_group_placement?.[0] ?? 0));
        // 只能在水里的物件（鱼类）：陆地上放不下（推断；DE 的 dat 里每个单位有通行地形限制，待换成以 dat 为准）
        const waterOnly = /FISH|DORADO|SALMON|SNAPPER|TUNA|PERCH|MARLIN|DOLPHIN|SHARK|WHALE/.test(this.objNames.get(id) ?? '');
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
            if (s) { const d = Math.hypot(s.x - x, s.y - y); if (d < minP || d > maxP) return false; }
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
        const emit = (x, y) => {
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
        const once = (s) => {
            for (let g = 0; g < capGroups; g++) {
                let cx = -1, cy = -1;
                for (let a = 0; a < 60; a++) {
                    let x, y;
                    if (s) { const ang = this.rng() * Math.PI * 2, d = minP + this.rng() * (Math.min(maxP, N) - minP); x = Math.round(s.x + Math.cos(ang) * d); y = Math.round(s.y + Math.sin(ang) * d); }
                    else { x = this.rng.int(0, N - 1); y = this.rng.int(0, N - 1); }
                    if (!this.inb(x, y) || !okTile(x, y, s)) continue;
                    if (gapSame > 0 && placedCenters.some((p) => Math.abs(p.x - x) < gapSame && Math.abs(p.y - y) < gapSame && Math.hypot(p.x - x, p.y - y) < gapSame)) continue;
                    if (gapAll > 0 && this.nearObject(x, y, gapAll)) continue;
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
    }
}
