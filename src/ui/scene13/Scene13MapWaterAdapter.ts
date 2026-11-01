import { DE_TERRAIN_MANIFEST } from '../../data/battlefield/deTerrainData';
import { nearestStrategicRiver } from '../../map/StrategicRiverProximity';
import { LandSeaSystem } from '../../world/land-sea/LandSeaSystem';
import { deTerrainIsForest, deTerrainTrees } from './Scene13DeTrees';
import { TAC_TILE_W } from './Scene13GroundLayerGL';

/**
 * 🔴 [2026-10-13 主人令「把这条河换到城市旁边」] 通用模板图（如 vienna_danube、各种 theme 图）的水在图角（距城心约 39 格 = 2500px，
 * 在 1080p 首屏视野之外）；攻城战有水时，把模板上的河/湖**搬到城池旁边**，进场一眼能看到城和河在一起：
 *   · 河：方向取战略地图 Natural Earth 河道（nearestStrategicRiver，30km 内最近一段的走向；河在城的哪一侧也照真实），
 *         取不到就按种子随机；中心线离城心 = 城半径 + 7 格（护城河外约 5~10 格），宽约 3.5 格，正弦弯曲，两岸 1 格沙岸，贯穿全图；
 *   · 湖：城的一侧（种子随机方位），湖心离城心 = 城半径 + 14 格，半径约 6 格、边缘起伏；
 *   · 海（_sea）不动（海岸方向由 adaptMapDataSeaOrientation 校正）。
 * 只改地形数组（terrain / passable / speed），旧水面上的水生物件与压在新水面/沙岸上的树石一并去掉。
 */
export function relocateTemplateWater(
    mapData: any,
    kind: string | undefined,
    cityWidthPx: number | undefined,
    seedBase: string,
    lat: number | undefined,
    lng: number | undefined,
): any {
    if (!mapData || !mapData.terrain || (kind !== 'river' && kind !== 'lake')) return mapData;
    const w = mapData.width, h = mapData.height;
    const terrain: number[] = Array.from(mapData.terrain as ArrayLike<number>);
    const isWaterId = (tid: number): boolean => {
        if (tid === 1 || tid === 15 || tid === 22 || tid === 23) return true;
        const m: any = DE_TERRAIN_MANIFEST[tid];
        return !!(m && ((m.is_water && (m.is_water & 7)) || m.overlay_mask_name === 'water.png'));
    };
    const isShoreId = (tid: number): boolean => {
        if (tid === 2) return true;
        const m: any = DE_TERRAIN_MANIFEST[tid];
        return !!m && /beach|shore/i.test(String(m.name ?? '') + String(m.name_2 ?? ''));
    };
    // 模板里最常见的陆地 / 水地形，及各自的 passable / speed 取样
    const landCount = new Map<number, number>(), waterCount = new Map<number, number>();
    for (const t of terrain) {
        if (isWaterId(t)) waterCount.set(t, (waterCount.get(t) ?? 0) + 1);
        else if (!isShoreId(t)) landCount.set(t, (landCount.get(t) ?? 0) + 1);
    }
    let landId = 0, landN = -1, waterId = 23, waterN = -1;
    for (const [t, n] of landCount) if (n > landN) { landN = n; landId = t; }
    for (const [t, n] of waterCount) if (n > waterN) { waterN = n; waterId = t; }
    const shoreId = 2;
    const sampleOf = (pred: (t: number) => boolean) => {
        const k = terrain.findIndex(pred);
        return k >= 0 ? { p: mapData.passable?.[k], s: mapData.speed?.[k] } : null;
    };
    const landS = sampleOf((t) => t === landId), waterS = sampleOf(isWaterId) ?? { p: 0, s: 60 }, shoreS = sampleOf(isShoreId) ?? landS;
    const passable = mapData.passable ? Array.from(mapData.passable as ArrayLike<number>) : null;
    const speed = mapData.speed ? Array.from(mapData.speed as ArrayLike<number>) : null;
    const setCell = (k: number, t: number, smp: { p: any; s: any } | null) => {
        terrain[k] = t;
        if (!smp) return;
        if (passable && smp.p !== undefined) passable[k] = smp.p;
        if (speed && smp.s !== undefined) speed[k] = smp.s;
    };

    // ① 抹掉模板水与沙岸
    const oldWet = new Uint8Array(w * h);
    for (let k = 0; k < w * h; k++) {
        if (isWaterId(terrain[k]) || isShoreId(terrain[k])) { oldWet[k] = 1; setCell(k, landId, landS); }
    }

    // ② 城的尺度（地面格）与种子
    const cS = (h - 1) / 2, cT = (w - 1) / 2;   // 图心（sx, sy）
    const cityR = cityWidthPx !== undefined ? cityWidthPx / 2 / TAC_TILE_W : 4;
    const seedStr = seedBase + '|water';
    let hsh = 2166136261;
    for (let i = 0; i < seedStr.length; i++) hsh = Math.imul(hsh ^ seedStr.charCodeAt(i), 16777619);
    const rnd = (): number => { hsh = Math.imul(hsh ^ (hsh >>> 15), 2246822507) ^ Math.imul(hsh ^ (hsh >>> 13), 3266489909); return ((hsh >>> 0) % 100000) / 100000; };

    // 新水面：field ≤ 0 为水、≤ 1 为沙岸（单位：地面格）
    let field: (sx: number, sy: number) => number;
    let how: string;
    if (kind === 'river') {
        const real = (lat !== undefined && lng !== undefined) ? nearestStrategicRiver(lat, lng, 30) : null;
        let tx: number, ty: number, nx: number, ny: number;
        if (real) {
            tx = real.dirE; ty = -real.dirN;                        // 屏幕：东 +x、南 +y
            nx = real.sideE; ny = -real.sideN;
            const dot = nx * tx + ny * ty; nx -= dot * tx; ny -= dot * ty;   // 侧向只取与河道垂直的分量
            let nl = Math.hypot(nx, ny);
            if (nl < 0.2) { nx = -ty; ny = tx; nl = 1; }            // 城就在河上：任取一侧
            nx /= nl; ny /= nl;
            how = `真实河道 ${real.distKm.toFixed(1)}km 外`;
        } else {
            const a = rnd() * Math.PI * 2;
            tx = Math.cos(a); ty = Math.sin(a); nx = -ty; ny = tx;
            if (rnd() < 0.5) { nx = -nx; ny = -ny; }
            how = '无河道数据，随机方向';
        }
        const D = cityR + 7, HALF = 1.75, AMP = 1.5, WAVE = 2 * Math.PI / (24 + rnd() * 12), PH = rnd() * Math.PI * 2;
        field = (sx, sy) => {
            const dx = sx - cS, dy = sy - cT;
            const along = dx * tx + dy * ty, across = dx * nx + dy * ny;
            return Math.abs(across - (D + AMP * Math.sin(along * WAVE + PH))) - HALF;
        };
    } else {
        const a = rnd() * Math.PI * 2, R = 6, D = cityR + 14;
        const lx = cS + Math.cos(a) * D, ly = cT + Math.sin(a) * D;
        const k1 = 2 + Math.floor(rnd() * 3), p1 = rnd() * Math.PI * 2, p2 = rnd() * Math.PI * 2;
        field = (sx, sy) => {
            const dx = sx - lx, dy = sy - ly, th = Math.atan2(dy, dx);
            const r = R * (1 + 0.18 * Math.sin(th * k1 + p1) + 0.1 * Math.sin(th * (k1 + 2) + p2));
            return Math.hypot(dx, dy) - r;
        };
        how = '城侧随机方位';
    }

    // ③ 挖新水面
    const newWet = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            const d = field(y, x);   // 屏幕 (sx, sy) = (y, x)
            if (d <= 0) { setCell(idx, waterId, waterS); newWet[idx] = 2; }
            else if (d <= 1) { setCell(idx, shoreId, shoreS); newWet[idx] = 1; }
        }
    }
    // ④ 物件：旧水面上的（水生植物、鱼）与压在新水面/沙岸上的一律去掉
    const objects = (mapData.objects || []).filter((o: any) => {
        const ox = Math.floor(o.x), oy = Math.floor(o.y);
        if (ox < 0 || oy < 0 || ox >= w || oy >= h) return true;
        const idx = oy * w + ox;
        return !oldWet[idx] && !newWet[idx];
    });
    console.info(`[Scene13WarLayer] 🏞 ${kind === 'river' ? '河' : '湖'}已从模板东北角移到城边（${how}）`);
    return { ...mapData, terrain, passable: passable ?? mapData.passable, speed: speed ?? mapData.speed, objects };
}

/**
 * 🔴 [2026-10-27 主人令「战术模式中的地图……有的因为在港口附近，导致水域太多，我觉得一张地图水域不应该超过40%」]
 * 将战术地图水域占比硬性限制在不超过 40%（0.40）：
 *   若水域占比 > 40%，通过多源 BFS 计算水域到陆地的距离，将最靠近陆地/城心的超额水域（浅水/内湾/近岸水格）
 *   平滑转化为陆地（主导陆地地形），并将新陆地与剩余水域的接触面重置为沙岸（Beach 2），
 *   使水域有机退潮至 40% 以下，保留大洋深海轮廓同时为港口战役提供宽阔陆地机动战场。
 */
export function clampMapWaterRatio(mapData: any, maxRatio: number = 0.40): any {
    if (!mapData?.terrain?.length || !mapData.width || !mapData.height) return mapData;
    const w = mapData.width, h = mapData.height;
    const total = w * h;
    const maxWater = Math.floor(total * maxRatio);

    const isWaterId = (tid: number): boolean => {
        if (tid === 1 || tid === 15 || tid === 22 || tid === 23 || tid === 4 || tid === 58 || tid === 95 || tid === 96) return true;
        const m: any = DE_TERRAIN_MANIFEST[tid];
        return !!(m && ((m.is_water && (m.is_water & 7)) || m.overlay_mask_name === 'water.png'));
    };
    const isShoreId = (tid: number): boolean => {
        if (tid === 2) return true;
        const m: any = DE_TERRAIN_MANIFEST[tid];
        return !!m && /beach|shore/i.test(String(m.name ?? '') + String(m.name_2 ?? ''));
    };

    const terrain = Array.from(mapData.terrain as ArrayLike<number>);
    const passable = mapData.passable ? Array.from(mapData.passable as ArrayLike<number>) : null;
    const speed = mapData.speed ? Array.from(mapData.speed as ArrayLike<number>) : null;

    let waterCount = 0;
    const landFreq = new Map<number, number>();
    for (let i = 0; i < total; i++) {
        const t = terrain[i];
        if (isWaterId(t)) {
            waterCount++;
        } else if (!isShoreId(t)) {
            landFreq.set(t, (landFreq.get(t) ?? 0) + 1);
        }
    }

    if (waterCount <= maxWater) return mapData;

    // 选取当前地图的主导陆地地形 ID（无陆地则回退到 12 绿草）
    let domLandId = 12, maxLandFreq = -1;
    for (const [tid, freq] of landFreq) {
        if (freq > maxLandFreq) {
            maxLandFreq = freq;
            domLandId = tid;
        }
    }

    const excess = waterCount - maxWater;

    // 多源 BFS 计算所有水域格子到最近陆地/沙岸的距离
    const dist = new Int32Array(total).fill(-1);
    const queue: number[] = [];

    for (let i = 0; i < total; i++) {
        if (!isWaterId(terrain[i])) {
            dist[i] = 0;
        }
    }

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            if (dist[idx] === 0) {
                const neighbors = [
                    [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]
                ];
                for (const [nx, ny] of neighbors) {
                    if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                        const nIdx = ny * w + nx;
                        if (isWaterId(terrain[nIdx]) && dist[nIdx] === -1) {
                            dist[nIdx] = 1;
                            queue.push(nIdx);
                        }
                    }
                }
            }
        }
    }

    // 若原图 100% 都是水（无陆地格），以中心为原点向外拓展陆地
    if (queue.length === 0) {
        const midY = Math.floor(h / 2), midX = Math.floor(w / 2);
        const midIdx = midY * w + midX;
        dist[midIdx] = 0;
        terrain[midIdx] = domLandId;
        queue.push(midIdx);
    }

    let head = 0;
    while (head < queue.length) {
        const curr = queue[head++];
        const cx = curr % w, cy = (curr - cx) / w;
        const cDist = dist[curr];
        const neighbors = [
            [cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]
        ];
        for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                const nIdx = ny * w + nx;
                if (isWaterId(terrain[nIdx]) && dist[nIdx] === -1) {
                    dist[nIdx] = cDist + 1;
                    queue.push(nIdx);
                }
            }
        }
    }

    // 收集全部水域格，加入伪随机噪声产生自然曲折海岸线
    const waterCells: Array<{ idx: number; score: number }> = [];
    for (let i = 0; i < total; i++) {
        if (isWaterId(terrain[i])) {
            const x = i % w, y = (i - x) / w;
            const d = dist[i] > 0 ? dist[i] : 999;
            const jitter = ((Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1 + 1) % 1;
            const centerDist = Math.hypot(x - w / 2, y - h / 2) / (w / 2);
            const score = d + jitter * 0.7 + centerDist * 0.5;
            waterCells.push({ idx: i, score });
        }
    }

    waterCells.sort((a, b) => a.score - b.score);

    // 将离陆地最近的超额水域转为陆地
    const converted = new Uint8Array(total);
    const toConvert = Math.min(excess, waterCells.length);
    for (let k = 0; k < toConvert; k++) {
        const idx = waterCells[k].idx;
        terrain[idx] = domLandId;
        if (passable) passable[idx] = 1;
        if (speed) speed[idx] = 100;
        converted[idx] = 1;
    }

    // 重建自然沙滩岸线（Beach 2）：新陆地与剩余水域相邻的格子作为沙岸
    const isNowWater = (x: number, y: number): boolean => {
        if (x < 0 || x >= w || y < 0 || y >= h) return false;
        return isWaterId(terrain[y * w + x]);
    };

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            if (!isWaterId(terrain[idx])) {
                let touchesWater = false;
                for (let dy = -1; dy <= 1 && !touchesWater; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        if (isNowWater(x + dx, y + dy)) {
                            touchesWater = true;
                            break;
                        }
                    }
                }
                if (touchesWater) {
                    terrain[idx] = 2; // Beach / Shore
                    if (passable) passable[idx] = 1;
                    if (speed) speed[idx] = 90;
                } else if (terrain[idx] === 2) {
                    // 已退潮到内陆的旧沙岸复原为主导陆地
                    terrain[idx] = domLandId;
                    if (speed) speed[idx] = 100;
                }
            }
        }
    }

    // 清理掉落在新陆地上的纯水生物件（鱼、独木舟、沉船、睡莲等）
    const objects = (mapData.objects || []).filter((o: any) => {
        const ox = Math.floor(o.x), oy = Math.floor(o.y);
        if (ox < 0 || oy < 0 || ox >= w || oy >= h) return true;
        const idx = oy * w + ox;
        if (converted[idx]) {
            const name = String(o.name || '');
            if (/FISH|DOLPHIN|CANOE|SHIPWRECK|WATER_LILY|REEDS/i.test(name)) return false;
        }
        return true;
    });

    const newWater = terrain.filter(isWaterId).length;
    console.info(`[Scene13WarLayer] 🌊 港口/滨水地图水域占比超额 (${(waterCount / total * 100).toFixed(1)}%)，已自动收拢退潮至 ${(newWater / total * 100).toFixed(1)}% (≤40%)`);
    return { ...mapData, terrain, passable, speed, objects };
}

/**
 * 🔴 [2026-10-13 主人令「有的城海在西边，战术地图中却在东边。请采用合理处理方式」
 *    ＋「战略地图中海在西边，战术地图中却在东边，请全面修复所有错误的战术地图」]
 * 自适应校正战术地图水体方位，使海岸线朝向与真实地理（＝战略地图）一致。
 */
const ORIENTED_MAP_CACHE = new WeakMap<object, Map<string, any>>();

export async function adaptMapDataSeaOrientation(
    mapData: any,
    lat: number | undefined,
    lng: number | undefined,
): Promise<any> {
    if (!mapData || !mapData.width || !mapData.height || !mapData.terrain) return mapData;
    if (lat === undefined || lng === undefined) return mapData;
    const cacheKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;
    let cacheByCoord = ORIENTED_MAP_CACHE.get(mapData);
    const cached = cacheByCoord?.get(cacheKey);
    if (cached) return cached;

    // ① 真实海向（屏幕坐标：东 = +x，北 = −y）
    const DIRS: Array<[number, number]> = [[1, 0], [0.707, -0.707], [0, -1], [-0.707, -0.707], [-1, 0], [-0.707, 0.707], [0, 1], [0.707, 0.707]];
    const DISTS = [0.04, 0.09, 0.18, 0.28];
    const cosLat = Math.cos(lat * Math.PI / 180) || 1;
    const pts = DIRS.flatMap(([ex, sy]) => DISTS.map((d) => ({ ex, sy, lat: lat - sy * d, lng: lng + ex * d / cosLat })));
    const ws = LandSeaSystem.getWaterSampler(), es = LandSeaSystem.getSampler();
    const probe = (la: number, ln: number): 'sea' | 'land' | 'pending' => {
        const wv = ws.isWaterSync(la, ln);
        if (wv === false) return 'land';
        const ev = es.getElevationSync(la, ln);
        if (wv === null || ev === null) {
            if (wv === null) ws.scheduleFetch(la, ln);
            if (ev === null) es.scheduleFetch(la, ln);
            return 'pending';
        }
        return ev <= 1 ? 'sea' : 'land';
    };
    let probes: Array<'sea' | 'land' | 'pending'> = [];
    for (let tries = 0; tries < 20; tries++) {
        probes = pts.map((p) => probe(p.lat, p.lng));
        if (!probes.includes('pending')) break;
        await new Promise((r) => setTimeout(r, 200));
    }
    const finish = (result: any): any => {
        // 探测数据没齐时得到的“无法判定”只是暂时结果，下一场必须重试，不能缓存成永久方向。
        if (probes.includes('pending')) return result;
        if (!cacheByCoord) {
            cacheByCoord = new Map<string, any>();
            ORIENTED_MAP_CACHE.set(mapData, cacheByCoord);
        }
        cacheByCoord.set(cacheKey, result);
        while (cacheByCoord.size > 16) {
            const oldest = cacheByCoord.keys().next().value;
            if (oldest === undefined) break;
            cacheByCoord.delete(oldest);
        }
        return result;
    };
    let rx = 0, ry = 0, seaN = 0;
    pts.forEach((p, i) => { if (probes[i] === 'sea') { rx += p.ex; ry += p.sy; seaN++; } });
    const rl = Math.hypot(rx, ry);
    // 海太少（内陆）或四面皆海（小岛，方向无意义）就不动
    if (seaN < 3 || rl < seaN * 0.25) return finish(mapData);

    // ② 地图水向
    const w = mapData.width, h = mapData.height;
    const isWater = (tid: number): boolean => {
        if (tid === 1 || tid === 23 || tid === 15 || tid === 22) return true;
        const m: any = DE_TERRAIN_MANIFEST[tid];
        return !!(m && ((m.is_water && (m.is_water & 7)) || m.overlay_mask_name === 'water.png'));
    };
    let mx = 0, my = 0, waterN = 0;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            if (!isWater(mapData.terrain[y * w + x])) continue;
            mx += y - (h - 1) / 2;   // 屏幕 x ← 原始 y
            my += x - (w - 1) / 2;   // 屏幕 y ← 原始 x
            waterN++;
        }
    }
    if (waterN < 300) return finish(mapData);
    const ml = Math.hypot(mx, my);
    if (ml < waterN * 3) return finish(mapData);   // 水均匀散在全图（多条小河），没有明确海岸方向

    // ③ 8 种对称：作用在屏幕向量 (u, v) 上
    type Sym = { name: string; f: (u: number, v: number) => [number, number] };
    const SYMS: Sym[] = [
        { name: '不变', f: (u, v) => [u, v] },
        { name: '左右翻', f: (u, v) => [-u, v] },
        { name: '上下翻', f: (u, v) => [u, -v] },
        { name: '转180°', f: (u, v) => [-u, -v] },
    ];
    if (w === h) {
        SYMS.push(
            { name: '主对角转置', f: (u, v) => [v, u] },
            { name: '副对角转置', f: (u, v) => [-v, -u] },
            { name: '顺转90°', f: (u, v) => [-v, u] },
            { name: '逆转90°', f: (u, v) => [v, -u] },
        );
    }
    const ux = rx / rl, uy = ry / rl;
    let best = SYMS[0], bestDot = -Infinity;
    for (const sym of SYMS) {
        const [a1, b1] = sym.f(mx / ml, my / ml);
        const dot = a1 * ux + b1 * uy;
        if (dot > bestDot + 1e-6) { bestDot = dot; best = sym; }
    }
    if (best === SYMS[0]) return finish(mapData);

    // 屏幕格 (sx, sy) 以图心为原点做对称，再换回原始数据坐标
    const cS = (h - 1) / 2, cT = (w - 1) / 2;   // sx ∈ [0,h)，sy ∈ [0,w)
    const mapCell = (x: number, y: number): [number, number] => {
        const [u, v] = best.f(y - cS, x - cT);
        return [Math.round(v + cT), Math.round(u + cS)];   // → 新原始 (x', y')
    };
    const remap = (arr: any) => {
        if (!arr || !arr.length) return arr;
        const out = new Array(w * h);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const [nx, ny] = mapCell(x, y);
                out[ny * w + nx] = arr[y * w + x];
            }
        }
        return Array.isArray(arr) ? out : new (arr.constructor as any)(out);
    };
    const newObjs = (mapData.objects || []).map((o: any) => {
        const [u, v] = best.f(o.y - cS, o.x - cT);
        const no = { ...o, x: v + cT, y: u + cS };
        no.cell = Math.floor(no.y) * w + Math.floor(no.x);
        return no;
    });
    console.info(`[Scene13WarLayer] 🌊 真实海向 (${ux.toFixed(2)}, ${uy.toFixed(2)})，地图水向已按「${best.name}」校正（一致度 ${bestDot.toFixed(2)}）`);
    return finish({
        ...mapData,
        terrain: remap(mapData.terrain),
        layer: remap(mapData.layer),
        elev: remap(mapData.elev),
        passable: remap(mapData.passable),
        speed: remap(mapData.speed),
        objects: newObjs,
    });
}

/**
 * 照 DE Arabia.rms（includes/forest.inc SPAWN_FOREST + includes/stragglers.inc STRAGGLER_SPAWN + stragglers_neutral.inc）：
 * 补齐因退水改造（relocateTemplateWater / clampMapWaterRatio）或骨架烘焙在中圈（半径 14~38 格核心交战视野）留下的植被空白：
 *   1. 树种与森林地形 id 100% 取自当前地图自身的 DE 森林地形（deTerrainIsForest），严禁跨气候带换树（沙漠图只用 13 Palm Desert → FPAL）；
 *   2. 侧翼小林团（SPAWN_FOREST / STRAGGLER_FOREST，每团 9~15 格）直接将格子 terrain[idx] 写为本图森林地形 id，
 *      并在每格中心 (x+0.5, y+0.5) 放置 1 棵对应 DE 树单位，使 WebGL 自动铺设林下腐殖土且 100% 符合「树跟 DE 地形走」铁律；
 *   3. 开阔平原散布 DE 散树（STRAGGLER_SPAWN / STRAGGLER_NEUTRAL），纯沙地（14 Desert）或沙漠主题仅放 FPAL（棕榈），水体与 2 Beach 绝不放树。
 */
export function enrichDeBattlefieldMidfield(
    mapData: any,
    cityWidthPx: number | undefined,
    seedBase: string,
    baseTerrain: string | undefined,
    deMapTheme: string | null | undefined,
    treeKeepRatio: number = 1.0,
): any {
    if (!mapData || mapData.isDeCampaign || !mapData.terrain || !mapData.objects) return mapData;
    const w = mapData.width, h = mapData.height;
    if (!w || !h || mapData.terrain.length !== w * h) return mapData;

    const isGravelTreeless = baseTerrain === 'gravel_default' || baseTerrain === 'rck';
    if (isGravelTreeless) return mapData;

    const terrain: number[] = Array.from(mapData.terrain as ArrayLike<number>);
    const objects: any[] = [...mapData.objects];

    const isWaterId = (tid: number): boolean => {
        if (tid === 1 || tid === 4 || tid === 15 || tid === 22 || tid === 23 || tid === 58 || tid === 95 || tid === 96) return true;
        const m: any = DE_TERRAIN_MANIFEST[tid];
        return !!(m && ((m.is_water && (m.is_water & 7)) || m.overlay_mask_name === 'water.png'));
    };
    const isShoreId = (tid: number): boolean => {
        if (tid === 2) return true;
        const m: any = DE_TERRAIN_MANIFEST[tid];
        return !!m && /beach|shore/i.test(String(m.name ?? '') + String(m.name_2 ?? ''));
    };

    const isDesertTheme = /desert/i.test(String(deMapTheme || '') + ' ' + String(mapData?.header?.theme || ''))
        || /^(pal|des|qs|pal1)$/i.test(String(baseTerrain || ''));

    // 统计本图已有的 DE 森林地形 id
    const forestFreq = new Map<number, number>();
    for (let i = 0; i < terrain.length; i++) {
        const tid = terrain[i];
        if (deTerrainIsForest(tid)) {
            if (isDesertTheme && tid !== 13 && tid !== 48) continue;
            forestFreq.set(tid, (forestFreq.get(tid) ?? 0) + 1);
        }
    }

    let domForestTid: number | null = null;
    let maxForestCnt = 0;
    for (const [tid, cnt] of forestFreq) {
        if (cnt > maxForestCnt) {
            maxForestCnt = cnt;
            domForestTid = tid;
        }
    }
    if (domForestTid === null && isDesertTheme) {
        domForestTid = 13; // 13 Palm Desert
    }
    if (domForestTid === null) return mapData;

    const treeUnits = deTerrainTrees(domForestTid);
    if (!treeUnits || treeUnits.length === 0) return mapData;
    const domTreeUnit = treeUnits[0].unit;

    // 标记已有树木与物体的格子（严格区分「真树/森林格」与「草丛/矿石/动物」，避免把 GRASS_DRY 误算成树导致整图漏补林团）
    const DE_MAP_TREE_NAME_RE = /^(FPAL|FAUTUM|FAUTUMS|FBAM|FLBAM|FORTR|FPIN|BIRCH|FDRA|FJUN|FRAIN|FSNO|FOAK|FDEAD|FBAO|FACA|FMANGRO|SPRUCE|SPRUCESNOW|ITPINE|OLIVE|CYPRESS|GREENOAK|MONKEYPUZZLE|TREE[A-Z0-9_]*|BUSH[23])$/i;
    const hasTree = new Uint8Array(w * h);
    const hasObject = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
        if (deTerrainIsForest(terrain[i])) hasTree[i] = 1;
    }
    for (const ob of objects) {
        const ox = Math.floor(ob.x), oy = Math.floor(ob.y);
        if (ox >= 0 && ox < w && oy >= 0 && oy < h) {
            const idx = oy * w + ox;
            hasObject[idx] = 1;
            const obName = String(ob.name || '');
            const tid = terrain[idx];
            const isReed = obName === 'FBAM' && (tid === 2 || tid === 4 || tid === 90 || tid === 91 || tid === 92 || isWaterId(tid));
            if (!isReed && DE_MAP_TREE_NAME_RE.test(obName)) {
                hasTree[idx] = 1;
            }
        }
    }

    const isSafeDryCell = (x: number, y: number, pad = 2): boolean => {
        if (x < 5 || x >= w - 5 || y < 5 || y >= h - 5) return false;
        for (let dy = -pad; dy <= pad; dy++) {
            for (let dx = -pad; dx <= pad; dx++) {
                const t = terrain[(y + dy) * w + (x + dx)];
                if (isWaterId(t) || isShoreId(t)) return false;
                // 非沙漠主题绝不在纯沙地（14 Desert）上种温带/寒带林团
                if (!isDesertTheme && t === 14) return false;
            }
        }
        return true;
    };

    const cX = (w - 1) / 2, cY = (h - 1) / 2;
    const isField = !cityWidthPx;
    const cityR = isField
        ? 5.0
        : Math.max(10.5, cityWidthPx / 2 / TAC_TILE_W + 4.2);

    // 避开四门十字大道（攻城）与野战正中心交锋圆心（不再误封 dx-dy 对角线，释放西南—东北等行军方向视野）
    const inRoadOrCorridor = (x: number, y: number): boolean => {
        const dx = x - cX, dy = y - cY;
        if (isField) {
            if (Math.hypot(dx, dy) < 5.0) return true;
            return false;
        }
        if (Math.hypot(dx, dy) < cityR + 1.0) return true;
        if (Math.abs(dx) <= 3.0 || Math.abs(dy) <= 3.0) return true;
        return false;
    };

    let hsh = 2166136261 >>> 0;
    const seedStr = seedBase + '|de_midfield';
    for (let i = 0; i < seedStr.length; i++) {
        hsh = Math.imul(hsh ^ seedStr.charCodeAt(i), 16777619) >>> 0;
    }
    const rnd = (): number => {
        hsh = Math.imul(hsh ^ (hsh >>> 15), 2246822507) ^ Math.imul(hsh ^ (hsh >>> 13), 3266489909);
        return ((hsh >>> 0) % 100000) / 100000;
    };

    const growDeForestClump = (startX: number, startY: number, targetSize: number, minR: number, maxR: number): number => {
        if (!isSafeDryCell(startX, startY, 2) || inRoadOrCorridor(startX, startY)) return 0;
        const q: Array<[number, number]> = [[startX, startY]];
        const visited = new Set<number>([startY * w + startX]);
        let grown = 0;
        while (q.length > 0 && grown < targetSize) {
            const pickIdx = Math.floor(rnd() * q.length);
            const [cx, cy] = q.splice(pickIdx, 1)[0];
            const idx = cy * w + cx;
            const d = Math.hypot(cx - cX, cy - cY);
            if (d < minR || d > maxR || !isSafeDryCell(cx, cy, 2) || inRoadOrCorridor(cx, cy)) continue;
            if (!hasTree[idx] && !hasObject[idx]) {
                terrain[idx] = domForestTid!;
                hasTree[idx] = 1;
                hasObject[idx] = 1;
                objects.push({
                    name: domTreeUnit,
                    x: cx + 0.5,
                    y: cy + 0.5,
                    cell: idx,
                });
                grown++;
            }
            const nbrs: Array<[number, number]> = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
            for (const [nx, ny] of nbrs) {
                const nIdx = ny * w + nx;
                if (!visited.has(nIdx) && rnd() < 0.78) {
                    visited.add(nIdx);
                    q.push([nx, ny]);
                }
            }
        }
        return grown;
    };

    // 1. 检查首屏近翼圈（半径 cityR+1.0 ~ cityR+8.5 格）、中圈（15 ~ 33 格）与外圈退水陆地（31 ~ 46 格）的 8 个方位扇区
    const nearSectorTrees = new Int32Array(8);
    const midSectorTrees = new Int32Array(8);
    const outerSectorTrees = new Int32Array(8);
    const outerSectorLand = new Int32Array(8);
    const nearMinR = cityR + 1.0;
    const nearMaxR = isField ? 14.0 : Math.min(24.0, cityR + 8.5);
    for (let y = 6; y < h - 6; y++) {
        for (let x = 6; x < w - 6; x++) {
            const dx = x - cX, dy = y - cY;
            const d = Math.hypot(dx, dy);
            const ang = Math.atan2(dy, dx);
            const sec = Math.floor(((ang + Math.PI) / (Math.PI * 2)) * 8) % 8;
            const idx = y * w + x;
            if (d >= nearMinR && d <= nearMaxR) {
                if (hasTree[idx]) nearSectorTrees[sec]++;
            }
            if (d >= cityR + 3 && d <= 33) {
                if (hasTree[idx]) midSectorTrees[sec]++;
            } else if (d > 31 && d <= 47) {
                if (!isWaterId(terrain[idx]) && !isShoreId(terrain[idx])) outerSectorLand[sec]++;
                if (hasTree[idx]) outerSectorTrees[sec]++;
            }
        }
    }

    const secOrder = [0, 1, 2, 3, 4, 5, 6, 7].sort(() => rnd() - 0.5);

    // 1a. 首屏两翼与四角近景林团（野战拉近到 7.0~12.8 格首屏两翼；攻城战紧贴护城河外缘四角）：
    //     每团 8~13 格并同步写入 domForestTid 森林底土，使 100% 默认视野两翼即有成团树林与林下落叶腐殖土
    let nearClumpsPlaced = 0;
    const targetNearClumps = isField ? 4 : 3;
    for (const sec of secOrder) {
        if (nearClumpsPlaced >= targetNearClumps) break;
        if (nearSectorTrees[sec] >= 4) continue;
        const clumpSize = isField ? (8 + Math.floor(rnd() * 6)) : (7 + Math.floor(rnd() * 5));
        for (let tryIdx = 0; tryIdx < 6; tryIdx++) {
            const baseAng = (sec + 0.18 + rnd() * 0.64) * (Math.PI / 4) - Math.PI;
            const rad = isField
                ? (7.0 + rnd() * 5.2)
                : (cityR + 2.2 + rnd() * 5.0);
            const sx = Math.round(cX + Math.cos(baseAng) * rad);
            const sy = Math.round(cY + Math.sin(baseAng) * rad);
            if (growDeForestClump(sx, sy, clumpSize, nearMinR, nearMaxR + 1.5) >= 4) {
                nearClumpsPlaced++;
                break;
            }
        }
    }

    // 1b. 中圈空旷侧翼扇区补齐 DE SPAWN_FOREST / STRAGGLER_FOREST 侧翼林团（3~4 团，每团 10~15 格）
    let midClumpsPlaced = 0;
    for (const sec of secOrder) {
        if (midClumpsPlaced >= 4) break;
        if (midSectorTrees[sec] >= 7) continue;
        const minMid = isField ? 13.5 : (cityR + 5.0);
        const clumpSize = 10 + Math.floor(rnd() * 6);
        for (let tryIdx = 0; tryIdx < 6; tryIdx++) {
            const baseAng = (sec + 0.2 + rnd() * 0.6) * (Math.PI / 4) - Math.PI;
            const rad = minMid + rnd() * (Math.min(31, minMid + 12) - minMid);
            const sx = Math.round(cX + Math.cos(baseAng) * rad);
            const sy = Math.round(cY + Math.sin(baseAng) * rad);
            if (growDeForestClump(sx, sy, clumpSize, cityR + 2.5, 34) >= 4) {
                midClumpsPlaced++;
                break;
            }
        }
    }

    // 在因退水（如水库/海湾退潮）变为空旷草地的外圈扇区补齐 DE BASE_FOREST 林团（最多 3 团，每团 14~20 格）
    let outerClumpsPlaced = 0;
    for (const sec of secOrder) {
        if (outerClumpsPlaced >= 3) break;
        if (outerSectorLand[sec] < 80 || outerSectorTrees[sec] >= 8) continue;
        const baseAng = (sec + 0.25 + rnd() * 0.5) * (Math.PI / 4) - Math.PI;
        const rad = 33 + rnd() * 11;
        const sx = Math.round(cX + Math.cos(baseAng) * rad);
        const sy = Math.round(cY + Math.sin(baseAng) * rad);
        const clumpSize = 14 + Math.floor(rnd() * 7);
        if (growDeForestClump(sx, sy, clumpSize, 30, 47) >= 6) {
            outerClumpsPlaced++;
        }
    }

    // 1c-2. 2D 网格空旷区巡检补林：
    //       DE Arabia.rms 烘培图天生留有两个约 35×35 格的 avoid_player_start_areas 玩家基地无树圆区，
    //       当野战/攻城大军从西南、东北或南北大跨度（2500px）行军时，镜头视野会恰好落入该空旷圈。
    //       按 20×20 格（约 1 屏）分块巡检全图 [10, w-10]×[10, h-10]：凡干地充裕但树木 < 6 棵的空旷分块，
    //       自动补种 1~2 团 DE 原生森林（同步写 domForestTid 底土）与 3~5 棵散树，彻底消除整屏无树的空白带。
    for (let gy0 = 10; gy0 <= h - 30; gy0 += 10) {
        for (let gx0 = 10; gx0 <= w - 30; gx0 += 10) {
            let dryCnt = 0;
            let treeCnt = 0;
            for (let y = gy0; y < gy0 + 20; y++) {
                for (let x = gx0; x < gx0 + 20; x++) {
                    const idx = y * w + x;
                    if (hasTree[idx]) treeCnt++;
                    if (Math.hypot(x - cX, y - cY) >= cityR + 1.5 && !inRoadOrCorridor(x, y) && isSafeDryCell(x, y, 1)) {
                        dryCnt++;
                    }
                }
            }
            if (dryCnt < 130 || treeCnt >= 6) continue;
            const targetBoxClumps = treeCnt === 0 ? 2 : 1;
            let boxClumps = 0;
            for (let att = 0; att < 14 && boxClumps < targetBoxClumps; att++) {
                const sx = gx0 + 3 + Math.floor(rnd() * 14);
                const sy = gy0 + 3 + Math.floor(rnd() * 14);
                const cSize = 8 + Math.floor(rnd() * 6);
                if (growDeForestClump(sx, sy, cSize, cityR + 1.5, 68) >= 4) {
                    boxClumps++;
                }
            }
            let boxStragglers = 0;
            for (let att = 0; att < 24 && boxStragglers < 4; att++) {
                const sx = gx0 + 2 + Math.floor(rnd() * 16);
                const sy = gy0 + 2 + Math.floor(rnd() * 16);
                const idx = sy * w + sx;
                if (hasTree[idx] || hasObject[idx]) continue;
                if (Math.hypot(sx - cX, sy - cY) < cityR + 1.5 || inRoadOrCorridor(sx, sy) || !isSafeDryCell(sx, sy, 2)) continue;
                const cellTid = terrain[idx];
                if (isWaterId(cellTid) || isShoreId(cellTid) || deTerrainIsForest(cellTid)) continue;
                let nearT = false;
                for (let dy = -3; dy <= 3 && !nearT; dy++) {
                    for (let dx = -3; dx <= 3; dx++) {
                        if (hasTree[(sy + dy) * w + (sx + dx)]) {
                            nearT = true;
                            break;
                        }
                    }
                }
                if (nearT) continue;
                hasTree[idx] = 1;
                hasObject[idx] = 1;
                objects.push({
                    name: (cellTid === 14 || isDesertTheme) ? 'FPAL' : domTreeUnit,
                    x: sx + 0.5,
                    y: sy + 0.5,
                    cell: idx,
                });
                boxStragglers++;
            }
        }
    }

    // 1d. 🔴 [2026-11-01 主人令「把战略战术同源的河岸护岸树一并落地」]
    //     沿河道/水岸两侧干地（沙岸外 1~3 格，距离水格 2~4 格）布置河岸护岸林簇与散树：
    //     · 严格避开中央渡口冲锋走廊（inRoadOrCorridor），绝不阻挡大军渡河；
    //     · 数量按战略同源的 treeKeepRatio（forestModel.ts 潜在森林 × 史实开垦度）自适应缩放；
    //     · 树种走本图 DE 森林地形与后续 plantRegionalizeTree + seasonalDeTree，与战略图 100% 同源。
    const riparianCells: Array<[number, number]> = [];
    const minRiparianR = isField ? 4.8 : Math.max(8.5, cityR - 0.5);
    for (let y = 6; y < h - 6; y++) {
        for (let x = 6; x < w - 6; x++) {
            const d = Math.hypot(x - cX, y - cY);
            if (d < minRiparianR || d > 42 || inRoadOrCorridor(x, y)) continue;
            if (!isSafeDryCell(x, y, 1)) continue;
            let nearWater = false;
            for (let dy = -4; dy <= 4 && !nearWater; dy++) {
                for (let dx = -4; dx <= 4; dx++) {
                    if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) continue;
                    const t = terrain[(y + dy) * w + (x + dx)];
                    if (isWaterId(t)) {
                        nearWater = true;
                        break;
                    }
                }
            }
            if (nearWater && !hasTree[y * w + x] && !hasObject[y * w + x]) {
                riparianCells.push([x, y]);
            }
        }
    }
    if (riparianCells.length > 0) {
        for (let i = riparianCells.length - 1; i > 0; i--) {
            const j = Math.floor(rnd() * (i + 1));
            const tmp = riparianCells[i];
            riparianCells[i] = riparianCells[j];
            riparianCells[j] = tmp;
        }
        const growRiparianClump = (startX: number, startY: number, targetSize: number): number => {
            if (!isSafeDryCell(startX, startY, 1) || inRoadOrCorridor(startX, startY)) return 0;
            const q: Array<[number, number]> = [[startX, startY]];
            const visited = new Set<number>([startY * w + startX]);
            let grown = 0;
            while (q.length > 0 && grown < targetSize) {
                const pickIdx = Math.floor(rnd() * q.length);
                const [cx, cy] = q.splice(pickIdx, 1)[0];
                const idx = cy * w + cx;
                const d = Math.hypot(cx - cX, cy - cY);
                if (d < minRiparianR || d > 43 || !isSafeDryCell(cx, cy, 1) || inRoadOrCorridor(cx, cy)) continue;
                if (!hasTree[idx] && !hasObject[idx]) {
                    terrain[idx] = domForestTid!;
                    hasTree[idx] = 1;
                    hasObject[idx] = 1;
                    objects.push({
                        name: (terrain[idx] === 14 || isDesertTheme) ? 'FPAL' : domTreeUnit,
                        x: cx + 0.5,
                        y: cy + 0.5,
                        cell: idx,
                        riparian: true,
                    });
                    grown++;
                }
                const nbrs: Array<[number, number]> = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
                for (const [nx, ny] of nbrs) {
                    const nIdx = ny * w + nx;
                    if (!visited.has(nIdx) && rnd() < 0.75) {
                        visited.add(nIdx);
                        q.push([nx, ny]);
                    }
                }
            }
            return grown;
        };

        const keepClamped = Math.max(0.35, Math.min(1.0, treeKeepRatio));
        const targetRiparianGroves = keepClamped >= 0.75 ? 4 : keepClamped >= 0.45 ? 3 : 2;
        const placedGroves: Array<[number, number]> = [];
        for (const [rx, ry] of riparianCells) {
            if (placedGroves.length >= targetRiparianGroves) break;
            if (placedGroves.some(([px, py]) => Math.hypot(rx - px, ry - py) < 10)) continue;
            const groveSize = 4 + Math.floor(rnd() * 3);
            if (growRiparianClump(rx, ry, groveSize) >= 3) {
                placedGroves.push([rx, ry]);
            }
        }

        const targetRiparianTrees = Math.round(8 + 8 * keepClamped);
        let riparianStragglers = 0;
        for (const [rx, ry] of riparianCells) {
            if (riparianStragglers >= targetRiparianTrees) break;
            const idx = ry * w + rx;
            if (hasTree[idx] || hasObject[idx]) continue;
            const cellTid = terrain[idx];
            if (isWaterId(cellTid) || isShoreId(cellTid) || deTerrainIsForest(cellTid)) continue;
            let nearOther = false;
            for (let dy = -3; dy <= 3 && !nearOther; dy++) {
                for (let dx = -3; dx <= 3; dx++) {
                    if (hasTree[(ry + dy) * w + (rx + dx)]) {
                        nearOther = true;
                        break;
                    }
                }
            }
            if (nearOther) continue;
            hasTree[idx] = 1;
            hasObject[idx] = 1;
            objects.push({
                name: (cellTid === 14 || isDesertTheme) ? 'FPAL' : domTreeUnit,
                x: rx + 0.5,
                y: ry + 0.5,
                cell: idx,
                riparian: true,
            });
            riparianStragglers++;
        }
    }

    // 2. 照 DE includes/stragglers.inc & stragglers_neutral.inc：
    //    在城郊与交战平原（半径 cityR+1.5 ~ 48 格）稀疏点缀 28 棵 DE 散树（间距 ≥ 4 格，绝不挡阵列）
    const targetStragglers = 28;
    let stragglersPlaced = 0;
    for (let attempt = 0; attempt < 240 && stragglersPlaced < targetStragglers; attempt++) {
        const ang = rnd() * Math.PI * 2;
        const rad = (attempt < 75 && isField)
            ? (5.8 + rnd() * 9.0)
            : (cityR + 1.5 + rnd() * (48 - (cityR + 1.5)));
        const gx = Math.round(cX + Math.cos(ang) * rad);
        const gy = Math.round(cY + Math.sin(ang) * rad);
        if (!isSafeDryCell(gx, gy, 2) || inRoadOrCorridor(gx, gy)) continue;
        const idx = gy * w + gx;
        if (hasTree[idx] || hasObject[idx]) continue;
        const cellTid = terrain[idx];
        if (isWaterId(cellTid) || isShoreId(cellTid) || deTerrainIsForest(cellTid)) continue;

        // 检查周围 3 格内是否已有树（保持 DE 散树疏朗间距）
        let nearTree = false;
        for (let dy = -3; dy <= 3 && !nearTree; dy++) {
            for (let dx = -3; dx <= 3; dx++) {
                if (hasTree[(gy + dy) * w + (gx + dx)]) {
                    nearTree = true;
                    break;
                }
            }
        }
        if (nearTree) continue;

        // 纯沙地（14 Desert）或沙漠主题只放棕榈（FPAL），其余陆地用本图主导森林树种
        const stragglerUnit = (cellTid === 14 || isDesertTheme) ? 'FPAL' : domTreeUnit;
        hasTree[idx] = 1;
        hasObject[idx] = 1;
        objects.push({
            name: stragglerUnit,
            x: gx + 0.5,
            y: gy + 0.5,
            cell: idx,
        });
        stragglersPlaced++;
    }

    return { ...mapData, terrain, objects };
}
