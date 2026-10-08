/**
 * RMS 地图引擎（验证性程序，2026-10-09）：把 rmsParse 展平后的指令，按 DE 顺序跑成一张地图。
 *
 *   LAND → ELEVATION → TERRAIN → OBJECTS（悬崖 / 连接暂不做）
 *
 * ⚠️ 引擎内部算法 DE 没有公开源码：成团怎么长、陆地怎么扩、set_scale_by_* 怎么缩放，
 *    这里都是「按社区文档与实测反推」的近似，所有未确认的取值集中在 TUNE 里，便于对着 DE 真图校准。
 */
import { makeRng } from './rmsParse.mjs';

/** 未确认语义的调参量（对照 public/de-maps 的 DE 真图校准） */
export const TUNE = {
    /** set_scale_by_size：计数 × (边长 / 参照边长)^2 */
    scaleRefSide: 100,
    /** circle_radius 是「占边长的百分比」 */
    circleRadiusIsPercentOfSide: true,
    /** 玩家出生点避让半径（set_avoid_player_start_areas） */
    avoidStartRadius: 14,
};

/** 把块里的子指令整理成 { 名: 参数数组 }（后者覆盖前者），旗标类指令值为 [] */
function props(block = []) {
    const o = {};
    for (const c of block) o[c.cmd] = c.args;
    return o;
}

export class MapEngine {
    constructor(sections, { size = 120, players = 2, seed = 1, names = new Map() } = {}) {
        this.sections = sections;
        this.N = size;
        this.players = players;
        this.rng = makeRng(seed);
        this.names = names;                         // 常量值 → 名字（渲染用）
        const n = size * size;
        this.terrain = new Int16Array(n);
        this.elev = new Int8Array(n);
        this.landId = new Int16Array(n).fill(-1);
        this.objects = [];
        this.markers = [];                          // actor_area 逻辑标记（不可见，只用于 avoid_actor_area / actor_area_to_place_in）
        this.areaGrid = new Map();                  // 区域号 → 占位网格（O(1) 判断某格是否落在该区域内）
        this.starts = [];                           // 玩家出生点
        this.unsupported = new Map();
        this.forestTerrains = new Set();
    }

    idx(x, y) { return y * this.N + x; }
    inb(x, y) { return x >= 0 && y >= 0 && x < this.N && y < this.N; }
    note(cmd) { this.unsupported.set(cmd, (this.unsupported.get(cmd) ?? 0) + 1); }

    run() {
        const S = this.sections;
        this.collectForestTerrains();
        for (const c of S.LAND_GENERATION ?? []) this.landCmd(c);
        for (const c of S.ELEVATION_GENERATION ?? []) this.elevCmd(c);
        for (const c of S.TERRAIN_GENERATION ?? []) this.terrainCmd(c);
        for (const c of S.OBJECTS_GENERATION ?? []) this.objectCmd(c);
        return this;
    }

    collectForestTerrains() {
        for (const [v, name] of this.names) if (/FOREST|JUNGLE|BAOBAB|BAMBOO/.test(name) && !/TREE|PLACEHOLDER/.test(name)) this.forestTerrains.add(v);
    }

    // ───────────────────────── LAND ─────────────────────────
    landCmd(c) {
        if (c.cmd === 'base_terrain') { this.terrain.fill(Number(c.args[0])); return; }
        if (c.cmd === 'create_land') { this.createLand(props(c.block), null); return; }
        if (c.cmd === 'create_player_lands') {
            const P = props(c.block);
            const rParam = P.circle_radius ?? [34, 1];
            const R = (Number(rParam[0]) / 100) * this.N;
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
            return;
        }
        if (c.cmd === 'land_percent' || c.cmd === 'base_elevation') return;
        this.note('LAND:' + c.cmd);
    }

    createLand(P, at, forcedId) {
        const N = this.N;
        const terr = Number(P.terrain_type?.[0] ?? 0);
        const id = forcedId ?? Number(P.land_id?.[0] ?? this.rng.int(200, 400));
        let want = Number(P.number_of_tiles?.[0] ?? 0);
        if (!want && P.land_percent) want = Math.round(Number(P.land_percent[0]) / 100 * N * N);
        const baseR = Number(P.base_size?.[0] ?? 0);
        const avoid = Number(P.other_zone_avoidance_distance?.[0] ?? 0);
        const clump = Number(P.clumping_factor?.[0] ?? 8);
        let cx, cy;
        if (at) { cx = at.x; cy = at.y; }
        else if (P.land_position) { cx = Math.round(Number(P.land_position[0]) / 100 * N); cy = Math.round(Number(P.land_position[1]) / 100 * N); }
        else { cx = this.rng.int(10, N - 10); cy = this.rng.int(10, N - 10); }
        const mine = [];
        const claim = (x, y) => {
            const i = this.idx(x, y);
            this.landId[i] = id; this.terrain[i] = terr; mine.push(i);
        };
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
        // 底座：半径 baseR 的圆盘
        for (let dy = -baseR; dy <= baseR; dy++) for (let dx = -baseR; dx <= baseR; dx++) {
            if (dx * dx + dy * dy > baseR * baseR) continue;
            const x = cx + dx, y = cy + dy;
            if (free(x, y)) claim(x, y);
        }
        if (mine.length === 0 && free(cx, cy)) claim(cx, cy);
        // 成长：随机扩张，clumping_factor 越大越紧凑
        const gamma = Math.max(0.05, clump / 25);
        let guard = want * 60 + 2000;
        while (mine.length < want && mine.length > 0 && guard-- > 0) {
            const i = mine[Math.floor(this.rng() * mine.length)];
            const x = i % N, y = (i / N) | 0;
            const d = this.rng.int(0, 3);
            const nx = x + (d === 0 ? 1 : d === 1 ? -1 : 0), ny = y + (d === 2 ? 1 : d === 3 ? -1 : 0);
            if (!free(nx, ny)) continue;
            let k = 0;
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                if (!dx && !dy) continue;
                const xx = nx + dx, yy = ny + dy;
                if (this.inb(xx, yy) && this.landId[this.idx(xx, yy)] === id) k++;
            }
            if (Math.pow(k / 8, gamma) < this.rng()) continue;
            claim(nx, ny);
        }
        return mine;
    }

    // ───────────────────────── 通用：成团 ─────────────────────────
    /**
     * 在满足 ok(i) 的格子里放 clumps 个种子，轮流成长，总共占 target 格；返回各团的格子数组。
     */
    growClumps({ base, ok, target, clumps, clump = 0, mark }) {
        const N = this.N;
        const cand = [];
        for (let i = 0; i < this.terrain.length; i++) if (this.terrain[i] === base && ok(i)) cand.push(i);
        if (!cand.length || target <= 0) return [];
        clumps = Math.max(1, Math.min(clumps, cand.length, target));
        // 种子：从候选里随机取（避免重复）
        const picked = new Set();
        const regions = [];
        let tries = 0;
        while (regions.length < clumps && tries++ < clumps * 20) {
            const i = cand[Math.floor(this.rng() * cand.length)];
            if (picked.has(i)) continue;
            picked.add(i);
            regions.push([i]);
            mark(i);
        }
        let total = regions.length;
        let stall = 0;
        const gamma = clump >= 0 ? Math.max(0.05, clump / 25) : 0;
        while (total < target && stall < regions.length * 6 + 50) {
            let progressed = false;
            for (const reg of regions) {
                if (total >= target) break;
                const i = reg[Math.floor(this.rng() * reg.length)];
                const x = i % N, y = (i / N) | 0;
                const d = this.rng.int(0, 3);
                const nx = x + (d === 0 ? 1 : d === 1 ? -1 : 0), ny = y + (d === 2 ? 1 : d === 3 ? -1 : 0);
                if (!this.inb(nx, ny)) continue;
                const j = this.idx(nx, ny);
                if (this.terrain[j] !== base || !ok(j)) continue;
                if (gamma > 0) {
                    // 紧凑度：四邻里已属于团块的格子越多越容易长进来（clumping_factor 越大越紧凑）
                    let same = 0;
                    for (const dd of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                        const xx = nx + dd[0], yy = ny + dd[1];
                        if (this.inb(xx, yy) && this.marked(this.idx(xx, yy))) same++;
                    }
                    if (Math.pow(same / 4, gamma) < this.rng() * 0.9) continue;
                }
                mark(j);
                reg.push(j);
                total++;
                progressed = true;
            }
            stall = progressed ? 0 : stall + 1;
        }
        return regions;
    }

    // ───────────────────────── ELEVATION ─────────────────────────
    elevCmd(c) {
        if (c.cmd !== 'create_elevation') { if (c.cmd !== 'base_terrain') this.note('ELEV:' + c.cmd); return; }
        const H = Number(c.args[0] ?? 1);
        const P = props(c.block);
        const base = Number(P.base_terrain?.[0] ?? -1);
        const scale = this.scaleOf(P);
        const tiles = Math.round(Number(P.number_of_tiles?.[0] ?? 0) * scale);
        const clumps = Math.max(1, Math.round(Number(P.number_of_clumps?.[0] ?? 1) * scale));
        const inRegion = new Uint8Array(this.terrain.length);
        this.marked = (i) => inRegion[i] === 1;
        const regs = this.growClumps({ base, ok: () => true, target: tiles, clumps, clump: 10, mark: (i) => { inRegion[i] = 1; } });
        // 每团：到团边缘的距离 = 抬升高度（封顶 H），形成逐格台阶的山丘
        const N = this.N;
        for (const reg of regs) {
            const inReg = new Set(reg);
            const dist = new Map();
            let q = [];
            for (const i of reg) {
                const x = i % N, y = (i / N) | 0;
                let edge = false;
                for (const dd of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                    const xx = x + dd[0], yy = y + dd[1];
                    if (!this.inb(xx, yy) || !inReg.has(this.idx(xx, yy))) edge = true;
                }
                if (edge) { dist.set(i, 1); q.push(i); }
            }
            while (q.length) {
                const nq = [];
                for (const i of q) {
                    const x = i % N, y = (i / N) | 0, dcur = dist.get(i);
                    for (const dd of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                        const xx = x + dd[0], yy = y + dd[1];
                        if (!this.inb(xx, yy)) continue;
                        const j = this.idx(xx, yy);
                        if (inReg.has(j) && !dist.has(j)) { dist.set(j, dcur + 1); nq.push(j); }
                    }
                }
                q = nq;
            }
            for (const i of reg) this.elev[i] = Math.max(this.elev[i], Math.min(H, dist.get(i) ?? 1));
        }
        this.marked = null;
    }

    scaleOf(P) {
        let s = 1;
        if (P.set_scale_by_size) { const r = this.N / TUNE.scaleRefSide; s *= r * r; }
        return s;
    }

    // ───────────────────────── TERRAIN ─────────────────────────
    terrainCmd(c) {
        if (c.cmd !== 'create_terrain') { if (!['color_correction', 'base_terrain'].includes(c.cmd)) this.note('TERR:' + c.cmd); return; }
        const T = Number(c.args[0]);
        const P = props(c.block);
        const base = Number(P.base_terrain?.[0] ?? this.terrain[0]);
        const scale = this.scaleOf(P);
        let baseCount = 0;
        for (let i = 0; i < this.terrain.length; i++) if (this.terrain[i] === base) baseCount++;
        let target = P.number_of_tiles ? Number(P.number_of_tiles[0]) * scale : P.land_percent ? Math.round(Number(P.land_percent[0]) / 100 * baseCount) : 0;
        target = Math.round(target);
        const clumps = Math.max(1, Math.round(Number(P.number_of_clumps?.[0] ?? 1) * scale));
        const clump = Number(P.clumping_factor?.[0] ?? 0);
        const spacing = Number(P.spacing_to_other_terrain_types?.[0] ?? 0);
        const hl = P.height_limits ? [Number(P.height_limits[0]), Number(P.height_limits[1])] : null;
        const flatOnly = !!P.set_flat_terrain_only;
        const avoidStart = !!P.set_avoid_player_start_areas;
        const N = this.N;
        const mine = new Uint8Array(this.terrain.length);
        this.marked = (i) => mine[i] === 1;
        const ok = (i) => {
            const x = i % N, y = (i / N) | 0;
            if (hl && (this.elev[i] < hl[0] || this.elev[i] > hl[1])) return false;
            if (flatOnly) {
                for (const dd of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                    const xx = x + dd[0], yy = y + dd[1];
                    if (this.inb(xx, yy) && this.elev[this.idx(xx, yy)] !== this.elev[i]) return false;
                }
            }
            if (avoidStart) for (const s of this.starts) if (Math.hypot(s.x - x, s.y - y) < TUNE.avoidStartRadius) return false;
            if (spacing > 0) {
                for (let dy = -spacing; dy <= spacing; dy++) for (let dx = -spacing; dx <= spacing; dx++) {
                    const xx = x + dx, yy = y + dy;
                    if (!this.inb(xx, yy)) continue;
                    const j = this.idx(xx, yy);
                    const t = this.terrain[j];
                    if (t !== base && !mine[j]) return false;
                }
            }
            return true;
        };
        const regs = this.growClumps({ base, ok, target, clumps, clump, mark: (i) => { mine[i] = 1; } });
        for (const reg of regs) for (const i of reg) this.terrain[i] = T;
        this.marked = null;
    }

    // ───────────────────────── OBJECTS ─────────────────────────
    objectCmd(c) {
        if (c.cmd !== 'create_object') { this.note('OBJ:' + c.cmd); return; }
        const id = Number(c.args[0]);
        const P = props(c.block);
        const N = this.N;
        const perPlayer = !!P.set_place_for_every_player;
        const scale = this.scaleOf(P);
        let count = Math.round(Number(P.number_of_objects?.[0] ?? 1) * (P.set_scaling_to_map_size ? scale : 1));
        const groups = Math.max(1, Math.round(Number(P.number_of_groups?.[0] ?? 1) * (P.set_scaling_to_map_size || P.set_scale_by_groups ? scale : 1)));
        const gr = Number(P.group_placement_radius?.[0] ?? 3);
        const onT = P.terrain_to_place_on ? Number(P.terrain_to_place_on[0]) : null;
        const minP = Number(P.min_distance_to_players?.[0] ?? 0), maxP = Number(P.max_distance_to_players?.[0] ?? 999);
        const edge = Number(P.min_distance_to_map_edge?.[0] ?? 1);
        const avoidForest = Number(P.avoid_forest_zone?.[0] ?? 0);
        const minGap = Number(P.min_distance_group_placement?.[0] ?? 0);
        const isMarker = !!P.actor_area;
        const markerArea = isMarker ? Number(P.actor_area[0]) : 0;
        const markerR = Number(P.actor_area_radius?.[0] ?? 1);
        const avoidAreas = new Set((c.block ?? []).filter((b) => b.cmd === 'avoid_actor_area').map((b) => Number(b.args[0])));
        const inAreas = P.actor_area_to_place_in ? Number(P.actor_area_to_place_in[0]) : null;
        // 数量封顶：标记物常写 2048/4096 表示「铺满」，这里按地图面积的 1/8 封顶，避免失控
        if (count > (N * N) / 8) count = Math.floor((N * N) / 8);
        const placed = [];
        const okTile = (x, y, sx, sy) => {
            const gi = y * N + x;
            for (const a of avoidAreas) if (this.areaGrid.get(a)?.[gi]) return false;
            if (inAreas !== null && !this.areaGrid.get(inAreas)?.[gi]) return false;
            if (x < edge || y < edge || x >= N - edge || y >= N - edge) return false;
            const t = this.terrain[this.idx(x, y)];
            if (onT !== null && t !== onT) return false;
            if (onT === null && /WATER/.test(this.names.get(t) ?? '')) return false;
            if (sx !== undefined) { const d = Math.hypot(sx - x, sy - y); if (d < minP || d > maxP) return false; }
            if (avoidForest > 0) {
                for (let dy = -avoidForest; dy <= avoidForest; dy++) for (let dx = -avoidForest; dx <= avoidForest; dx++) {
                    const xx = x + dx, yy = y + dy;
                    if (this.inb(xx, yy) && this.forestTerrains.has(this.terrain[this.idx(xx, yy)])) return false;
                }
            }
            return true;
        };
        const once = (sx, sy) => {
            const groupsHere = P.number_of_groups ? groups : count;
            const perGroup = P.number_of_groups ? Math.max(1, count) : 1;
            for (let g = 0; g < groupsHere; g++) {
                let cx = -1, cy = -1;
                for (let a = 0; a < 300; a++) {
                    const x = sx !== undefined ? Math.round(sx + (this.rng() - 0.5) * 2 * Math.min(maxP, 40)) : this.rng.int(0, N - 1);
                    const y = sy !== undefined ? Math.round(sy + (this.rng() - 0.5) * 2 * Math.min(maxP, 40)) : this.rng.int(0, N - 1);
                    if (!this.inb(x, y) || !okTile(x, y, sx, sy)) continue;
                    if (minGap > 0 && placed.some((p) => Math.hypot(p.x - x, p.y - y) < minGap)) continue;
                    cx = x; cy = y; break;
                }
                if (cx < 0) continue;
                placed.push({ x: cx, y: cy });
                for (let k = 0; k < perGroup; k++) {
                    let x = cx, y = cy;
                    if (k > 0) {
                        for (let a = 0; a < 20; a++) {
                            const tx = Math.round(cx + (this.rng() - 0.5) * 2 * gr), ty = Math.round(cy + (this.rng() - 0.5) * 2 * gr);
                            if (this.inb(tx, ty) && okTile(tx, ty)) { x = tx; y = ty; break; }
                        }
                    }
                    if (isMarker) {
                        this.markers.push({ area: markerArea, x, y, r: markerR });
                        let g = this.areaGrid.get(markerArea);
                        if (!g) { g = new Uint8Array(N * N); this.areaGrid.set(markerArea, g); }
                        const rr = Math.ceil(markerR);
                        for (let dy = -rr; dy <= rr; dy++) for (let dx = -rr; dx <= rr; dx++) {
                            const xx = x + dx, yy = y + dy;
                            if (dx * dx + dy * dy <= markerR * markerR && this.inb(xx, yy)) g[yy * N + xx] = 1;
                        }
                    }
                    else this.objects.push({ id, x: x + this.rng(), y: y + this.rng() });
                }
            }
        };
        if (perPlayer) for (const s of this.starts) once(s.x, s.y); else once();
    }
}
