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

    // 标记已有树木/物体的格子
    const hasTree = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
        if (deTerrainIsForest(terrain[i])) hasTree[i] = 1;
    }
    for (const ob of objects) {
        const ox = Math.floor(ob.x), oy = Math.floor(ob.y);
        if (ox >= 0 && ox < w && oy >= 0 && oy < h) {
            hasTree[oy * w + ox] = 1;
        }
    }

    const isSafeDryCell = (x: number, y: number, pad = 2): boolean => {
        if (x < 5 || x >= w - 5 || y < 5 || y >= h - 5) return false;
        for (let dy = -pad; dy <= pad; dy++) {
            for (let dx = -pad; dx <= pad; dx++) {
                const t = terrain[(y + dy) * w + (x + dx)];
                if (isWaterId(t) || isShoreId(t)) return false;
            }
        }
        return true;
    };

    const cX = (w - 1) / 2, cY = (h - 1) / 2;
    const cityR = Math.max(11.5, (cityWidthPx ? cityWidthPx / 2 / TAC_TILE_W : 6) + 5.5);

    // 避开四门十字大道与两军主冲锋走廊
    const inRoadOrCorridor = (x: number, y: number): boolean => {
        const dx = x - cX, dy = y - cY;
        if (Math.abs(dx) <= 3.5 || Math.abs(dy) <= 3.5) return true;
        // 主交战轴线（屏幕水平/对角方向留出开阔阵列机动走廊）
        if (Math.abs(dx - dy) <= 4.5 && Math.hypot(dx, dy) < 28) return true;
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
            if (!hasTree[idx]) {
                terrain[idx] = domForestTid!;
                hasTree[idx] = 1;
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

    // 1. 检查中圈（半径 cityR+2.5 ~ 33 格）与外圈退水陆地（半径 31 ~ 46 格）的 8 个方位扇区
    const midSectorTrees = new Int32Array(8);
    const outerSectorTrees = new Int32Array(8);
    const outerSectorLand = new Int32Array(8);
    for (let y = 6; y < h - 6; y++) {
        for (let x = 6; x < w - 6; x++) {
            const dx = x - cX, dy = y - cY;
            const d = Math.hypot(dx, dy);
            const ang = Math.atan2(dy, dx);
            const sec = Math.floor(((ang + Math.PI) / (Math.PI * 2)) * 8) % 8;
            const idx = y * w + x;
            if (d >= cityR + 2 && d <= 33) {
                if (hasTree[idx]) midSectorTrees[sec]++;
            } else if (d > 31 && d <= 47) {
                if (!isWaterId(terrain[idx]) && !isShoreId(terrain[idx])) outerSectorLand[sec]++;
                if (hasTree[idx]) outerSectorTrees[sec]++;
            }
        }
    }

    // 在中圈空旷侧翼扇区补齐 DE SPAWN_FOREST / STRAGGLER_FOREST 近战侧翼小林团（3~4 团，每团 9~14 格）
    let midClumpsPlaced = 0;
    const secOrder = [0, 1, 2, 3, 4, 5, 6, 7].sort(() => rnd() - 0.5);
    for (const sec of secOrder) {
        if (midClumpsPlaced >= 4) break;
        if (midSectorTrees[sec] >= 6) continue;
        const baseAng = (sec + 0.3 + rnd() * 0.4) * (Math.PI / 4) - Math.PI;
        const rad = cityR + 4.5 + rnd() * (Math.min(31, cityR + 14) - (cityR + 4.5));
        const sx = Math.round(cX + Math.cos(baseAng) * rad);
        const sy = Math.round(cY + Math.sin(baseAng) * rad);
        const clumpSize = 9 + Math.floor(rnd() * 6);
        if (growDeForestClump(sx, sy, clumpSize, cityR + 2.5, 34) >= 4) {
            midClumpsPlaced++;
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

    // 2. 照 DE includes/stragglers.inc & stragglers_neutral.inc：
    //    在城郊与交战平原（半径 cityR+1.5 ~ 36 格）稀疏点缀 14~18 棵 DE 散树（间距 ≥ 4 格，绝不挡阵列）
    const targetStragglers = 16;
    let stragglersPlaced = 0;
    for (let attempt = 0; attempt < 140 && stragglersPlaced < targetStragglers; attempt++) {
        const ang = rnd() * Math.PI * 2;
        const rad = cityR + 1.5 + rnd() * (36 - (cityR + 1.5));
        const gx = Math.round(cX + Math.cos(ang) * rad);
        const gy = Math.round(cY + Math.sin(ang) * rad);
        if (!isSafeDryCell(gx, gy, 2) || inRoadOrCorridor(gx, gy)) continue;
        const cellTid = terrain[gy * w + gx];
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
        const idx = gy * w + gx;
        hasTree[idx] = 1;
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
