import { DE_TERRAIN_MANIFEST } from '../../data/battlefield/deTerrainData';
import { nearestStrategicRiver } from '../../map/StrategicRiverProximity';
import { LandSeaSystem } from '../../world/land-sea/LandSeaSystem';
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
 * 🔴 [2026-10-13 主人令「有的城海在西边，战术地图中却在东边。请采用合理处理方式」
 *    ＋「战略地图中海在西边，战术地图中却在东边，请全面修复所有错误的战术地图」]
 * 自适应校正战术地图水体方位，使海岸线朝向与真实地理（＝战略地图）一致。
 */
export async function adaptMapDataSeaOrientation(
    mapData: any,
    lat: number | undefined,
    lng: number | undefined,
): Promise<any> {
    if (!mapData || !mapData.width || !mapData.height || !mapData.terrain) return mapData;
    if (lat === undefined || lng === undefined) return mapData;

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
    let rx = 0, ry = 0, seaN = 0;
    pts.forEach((p, i) => { if (probes[i] === 'sea') { rx += p.ex; ry += p.sy; seaN++; } });
    const rl = Math.hypot(rx, ry);
    // 海太少（内陆）或四面皆海（小岛，方向无意义）就不动
    if (seaN < 3 || rl < seaN * 0.25) return mapData;

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
    if (waterN < 300) return mapData;
    const ml = Math.hypot(mx, my);
    if (ml < waterN * 3) return mapData;   // 水均匀散在全图（多条小河），没有明确海岸方向

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
    if (best === SYMS[0]) return mapData;

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
    return {
        ...mapData,
        terrain: remap(mapData.terrain),
        layer: remap(mapData.layer),
        elev: remap(mapData.elev),
        passable: remap(mapData.passable),
        speed: remap(mapData.speed),
        objects: newObjs,
    };
}
