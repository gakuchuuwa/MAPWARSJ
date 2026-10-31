/**
 * 战略地图「可达掩膜」（2026-10-31 主人批准《战略地图显示素材规划》）：
 * 玩家只沿道路、海路移动，装饰素材（植被、动物、浪花）跟着玩家走——去不到的地方不画。
 *
 * 以 道路（VECTOR_ROAD_DATA）＋ 海路（SEA_ROUTE_DATA）＋ 据点（CITIES_V2）为源，栅格化到 0.125° 网格，
 * 再按距离分三级：
 *   2 ＝ 核心带（离路/据点 ≤ CORE_KM）：完整显示
 *   1 ＝ 视野带（≤ VIEW_KM）：减量显示
 *   0 ＝ 不可达（大洋洲、远洋、无路荒漠）：装饰不画，只留底图
 * 首次需要时在空闲帧建表（一次性），建好前一律按 2 放行，不让素材整片消失；建好后广播 READY_EVENT。
 */
import { VECTOR_ROAD_DATA } from '../data/VectorRoadData';
import { SEA_ROUTE_DATA } from '../data/VectorSeaRouteData';
import { CITIES_V2 } from '../data/cities_v2';

export const REACH_CORE_KM = 30;
export const REACH_VIEW_KM = 80;
export const REACH_MASK_READY_EVENT = 'strategic-reach-mask-ready';

const CELL_DEG = 0.125;
const W = Math.round(360 / CELL_DEG);
const H = Math.round(180 / CELL_DEG);
const KM_PER_DEG = 111.32;

let mask: Uint8Array | null = null;
let building = false;

function cellX(lng: number): number {
    return ((Math.floor((lng + 180) / CELL_DEG) % W) + W) % W;
}
function cellY(lat: number): number {
    return Math.max(0, Math.min(H - 1, Math.floor((90 - lat) / CELL_DEG)));
}

/** 0 不可达 / 1 视野带 / 2 核心带；掩膜未建好时返回 2（放行） */
export function getReachLevel(lat: number, lng: number): 0 | 1 | 2 {
    if (!mask) {
        ensureReachMask();
        return 2;
    }
    return mask[cellY(lat) * W + cellX(lng)] as 0 | 1 | 2;
}

export function isReachMaskReady(): boolean {
    return mask !== null;
}

/** 空闲时建表（只建一次） */
export function ensureReachMask(): void {
    if (mask || building) return;
    building = true;
    const run = () => {
        try {
            mask = buildMask();
        } catch (err) {
            console.warn('[StrategicReachMask] 建表失败，装饰层按全部可达处理', err);
            mask = new Uint8Array(W * H).fill(2);
        }
        building = false;
        window.dispatchEvent(new Event(REACH_MASK_READY_EVENT));
    };
    const ric = (window as any).requestIdleCallback as ((cb: () => void, o?: { timeout: number }) => void) | undefined;
    if (ric) ric(run, { timeout: 3000 });
    else setTimeout(run, 500);
}

function buildMask(): Uint8Array {
    // ① 源格：道路、海路折线按 ≤ 半格步长采样；据点直接落格
    const seed = new Uint8Array(W * H);
    const mark = (lat: number, lng: number) => {
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        seed[cellY(lat) * W + cellX(lng)] = 1;
    };
    const addLine = (coords: unknown) => {
        if (!Array.isArray(coords)) return;
        for (let i = 0; i < coords.length; i++) {
            const p = coords[i] as [number, number];
            if (!Array.isArray(p)) continue;
            mark(p[1], p[0]);
            if (i === 0) continue;
            const q = coords[i - 1] as [number, number];
            const dLng = p[0] - q[0], dLat = p[1] - q[1];
            if (Math.abs(dLng) > 180) continue; // 跨日界线的段不插值
            const n = Math.ceil(Math.max(Math.abs(dLng), Math.abs(dLat)) / (CELL_DEG * 0.5));
            for (let k = 1; k < n; k++) mark(q[1] + dLat * k / n, q[0] + dLng * k / n);
        }
    };
    for (const f of VECTOR_ROAD_DATA.features as any[]) {
        const g = f?.geometry;
        if (g?.type === 'MultiLineString') for (const line of g.coordinates ?? []) addLine(line);
        else addLine(g?.coordinates);
    }
    for (const f of SEA_ROUTE_DATA.features) addLine(f.geometry?.coordinates);
    for (const c of CITIES_V2) mark(c.lat, c.lng);

    // ② 每个源格按真实公里数盖一个圆（经向格宽随纬度收缩），取最高级
    const out = new Uint8Array(W * H);
    const ry = Math.ceil(REACH_VIEW_KM / (KM_PER_DEG * CELL_DEG));
    const coreSq = REACH_CORE_KM * REACH_CORE_KM;
    const viewSq = REACH_VIEW_KM * REACH_VIEW_KM;
    for (let y = 0; y < H; y++) {
        const lat = 90 - (y + 0.5) * CELL_DEG;
        const kmX = KM_PER_DEG * CELL_DEG * Math.max(0.05, Math.cos(lat * Math.PI / 180));
        const kmY = KM_PER_DEG * CELL_DEG;
        const rx = Math.min(W >> 1, Math.ceil(REACH_VIEW_KM / kmX));
        const row = y * W;
        for (let x = 0; x < W; x++) {
            if (!seed[row + x]) continue;
            for (let dy = -ry; dy <= ry; dy++) {
                const ny = y + dy;
                if (ny < 0 || ny >= H) continue;
                const dyKm = dy * kmY;
                const nrow = ny * W;
                for (let dx = -rx; dx <= rx; dx++) {
                    const dxKm = dx * kmX;
                    const d2 = dxKm * dxKm + dyKm * dyKm;
                    if (d2 > viewSq) continue;
                    const i = nrow + (((x + dx) % W) + W) % W;
                    const lv = d2 <= coreSq ? 2 : 1;
                    if (out[i] < lv) out[i] = lv;
                }
            }
        }
    }
    return out;
}
