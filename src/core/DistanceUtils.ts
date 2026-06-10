/**
 * DistanceUtils - 统一的距离与坐标判定工具库
 * 
 * 设计目标：
 * 1. 统一游戏中所有距离计算方式
 * 2. 提供标准化的"到达"判定阈值
 * 3. 支持六边形网格距离和欧几里得距离
 */

import { GridSystem } from '../systems/GridSystem';

// ==================== 标准阈值定义 ====================
/**
 * 距离阈值常量
 * 所有涉及距离判定的逻辑都应使用这些常量
 */
export const DISTANCE_THRESHOLDS = {
    /** 到达城市/目标点的判定距离 (LatLng 单位) */
    ARRIVAL: 0.2,

    /** 临近城市的判定距离 (用于驻扎、补给、攻城触发) 必须大于相邻格子距离(0.26) */
    NEARBY_CITY: 0.3,

    /** 战斗参与距离 (LatLng 单位) */
    COMBAT_PARTICIPATION: 1.5,

    /** 同一 Hex 判定 (Hex 步数) */
    SAME_HEX: 0,

    /** 相邻 Hex 判定 (Hex 步数) */
    ADJACENT_HEX: 1,

    /** 增援搜索半径 (Hex 步数) */
    REINFORCEMENT_RANGE: 2,  // 增援范围（2 圈六边形 = 城市附近）
} as const;

// ==================== 坐标类型定义 ====================
export interface LatLng {
    lat: number;
    lng: number;
}

export interface AxialHex {
    q: number;
    r: number;
}

// ==================== 网格常量 ====================
const DEFAULT_CENTER_LAT = 34.26;

// ==================== 距离计算函数 ====================

/**
 * 计算两点之间的欧几里得距离 (LatLng)
 */
export function getEuclideanDistance(pos1: LatLng, pos2: LatLng): number {
    const dx = pos1.lat - pos2.lat;
    const dy = pos1.lng - pos2.lng;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 计算两点之间的六边形距离 (Hex 步数)
 * 使用 Axial 坐标系
 */
export function getHexDistance(pos1: LatLng, pos2: LatLng, centerLat: number = DEFAULT_CENTER_LAT): number {
    const hex1 = GridSystem.latLngToAxial(pos1.lat, pos1.lng);
    const hex2 = GridSystem.latLngToAxial(pos2.lat, pos2.lng);

    // 六边形距离公式: max(|q1-q2|, |r1-r2|, |s1-s2|)
    // 其中 s = -q - r
    const dq = Math.abs(hex1.q - hex2.q);
    const dr = Math.abs(hex1.r - hex2.r);
    const ds = Math.abs((-hex1.q - hex1.r) - (-hex2.q - hex2.r));

    return Math.max(dq, dr, ds);
}

/**
 * 将 LatLng 转换为 Axial Hex 坐标
 */
export function toAxialHex(pos: LatLng, centerLat: number = DEFAULT_CENTER_LAT): AxialHex {
    return GridSystem.latLngToAxial(pos.lat, pos.lng);
}

// ==================== 判定函数 ====================

/**
 * 判断单位是否已到达目标点
 */
export function hasArrived(currentPos: LatLng, targetPos: LatLng): boolean {
    return getEuclideanDistance(currentPos, targetPos) <= DISTANCE_THRESHOLDS.ARRIVAL;
}

/**
 * 判断单位是否在城市附近 (可进行驻扎、补给)
 */
export function isNearCity(unitPos: LatLng, cityPos: LatLng): boolean {
    return getEuclideanDistance(unitPos, cityPos) <= DISTANCE_THRESHOLDS.NEARBY_CITY;
}

/**
 * 判断单位是否可参与战斗
 */
export function canParticipateInCombat(unitPos: LatLng, battlePos: LatLng): boolean {
    return getEuclideanDistance(unitPos, battlePos) <= DISTANCE_THRESHOLDS.COMBAT_PARTICIPATION;
}

/**
 * 判断两个单位是否在同一 Hex
 */
export function isSameHex(pos1: LatLng, pos2: LatLng, centerLat: number = DEFAULT_CENTER_LAT): boolean {
    return getHexDistance(pos1, pos2, centerLat) === DISTANCE_THRESHOLDS.SAME_HEX;
}

/**
 * 判断两个单位是否相邻 (Hex 距离 <= 1)
 */
/** 点到折线各段的最短距离（LatLng 欧氏，用于行军 ZOC） */
export function minDistanceToPolyline(point: LatLng, polyline: LatLng[]): number {
    if (polyline.length === 0) return Infinity;
    if (polyline.length === 1) return getEuclideanDistance(point, polyline[0]);

    let min = Infinity;
    for (let i = 0; i < polyline.length - 1; i++) {
        const a = polyline[i];
        const b = polyline[i + 1];
        const abLat = b.lat - a.lat;
        const abLng = b.lng - a.lng;
        const lenSq = abLat * abLat + abLng * abLng;
        let t = 0;
        if (lenSq > 1e-12) {
            t = ((point.lat - a.lat) * abLat + (point.lng - a.lng) * abLng) / lenSq;
            t = Math.max(0, Math.min(1, t));
        }
        const proj = { lat: a.lat + t * abLat, lng: a.lng + t * abLng };
        min = Math.min(min, getEuclideanDistance(point, proj));
    }
    return min;
}

/** 点在折线上的投影距起点累计长度（与 minDistanceToPolyline 同参数系） */
/** 折线上离 point 最近的投影点（同距时取沿折线更靠前、朝终点的一侧） */
export function nearestPointOnPolyline(
    point: LatLng,
    polyline: LatLng[]
): { point: LatLng; segmentIndex: number; distance: number; tOnSegment: number; along: number } | null {
    if (polyline.length === 0) return null;
    if (polyline.length === 1) {
        return {
            point: polyline[0],
            segmentIndex: 0,
            distance: getEuclideanDistance(point, polyline[0]),
            tOnSegment: 0,
            along: 0,
        };
    }

    let bestDist = Infinity;
    let bestAlong = -1;
    let bestPoint = polyline[0];
    let bestSeg = 0;
    let bestT = 0;
    let accumulated = 0;
    const tieEps = 1e-5;

    for (let i = 0; i < polyline.length - 1; i++) {
        const a = polyline[i];
        const b = polyline[i + 1];
        const segLen = getEuclideanDistance(a, b);
        const abLat = b.lat - a.lat;
        const abLng = b.lng - a.lng;
        const lenSq = abLat * abLat + abLng * abLng;
        let t = 0;
        if (lenSq > 1e-12) {
            t = ((point.lat - a.lat) * abLat + (point.lng - a.lng) * abLng) / lenSq;
            t = Math.max(0, Math.min(1, t));
        }
        const proj = { lat: a.lat + t * abLat, lng: a.lng + t * abLng };
        const dist = getEuclideanDistance(point, proj);
        const along = accumulated + segLen * t;
        if (dist < bestDist - tieEps || (dist <= bestDist + tieEps && along > bestAlong)) {
            bestDist = dist;
            bestAlong = along;
            bestPoint = proj;
            bestSeg = i;
            bestT = t;
        }
        accumulated += segLen;
    }

    return {
        point: bestPoint,
        segmentIndex: bestSeg,
        distance: bestDist,
        tOnSegment: bestT,
        along: bestAlong,
    };
}

function dedupeLatLngPath(path: LatLng[], eps = 0.0001): LatLng[] {
    const out: LatLng[] = [];
    for (const p of path) {
        if (out.length === 0) {
            out.push(p);
            continue;
        }
        const last = out[out.length - 1];
        if (Math.abs(last.lat - p.lat) > eps || Math.abs(last.lng - p.lng) > eps) {
            out.push(p);
        }
    }
    return out;
}

/**
 * 从 startPos 接入道路折线：投影到离 A 最近且朝终点的路点，避免先折返道路起点城。
 */
export function joinStartToRoadPolyline(startPos: LatLng, polyline: LatLng[], joinEps: number): LatLng[] {
    if (polyline.length === 0) return [];
    if (polyline.length === 1) {
        const d = getEuclideanDistance(startPos, polyline[0]);
        if (d <= joinEps) return [...polyline];
        return dedupeLatLngPath([startPos, polyline[0]]);
    }

    const nearest = nearestPointOnPolyline(startPos, polyline);
    if (!nearest) return [...polyline];

    const { point: proj, segmentIndex: i, distance: dist, tOnSegment: t } = nearest;
    let suffix: LatLng[];
    if (t >= 1 - 1e-6) {
        suffix = polyline.slice(i + 1);
    } else if (t <= 1e-6) {
        suffix = polyline.slice(i);
    } else {
        suffix = [proj, ...polyline.slice(i + 1)];
    }
    suffix = dedupeLatLngPath(suffix);
    if (suffix.length === 0) {
        suffix = [proj];
    }

    if (dist <= joinEps) {
        return suffix;
    }
    return dedupeLatLngPath([startPos, ...suffix]);
}

export function distanceAlongPolyline(point: LatLng, polyline: LatLng[]): number {
    if (polyline.length < 2) return 0;

    let bestAlong = 0;
    let bestDist = Infinity;
    let accumulated = 0;

    for (let i = 0; i < polyline.length - 1; i++) {
        const a = polyline[i];
        const b = polyline[i + 1];
        const segLen = getEuclideanDistance(a, b);
        const abLat = b.lat - a.lat;
        const abLng = b.lng - a.lng;
        const lenSq = abLat * abLat + abLng * abLng;
        let t = 0;
        if (lenSq > 1e-12) {
            t = ((point.lat - a.lat) * abLat + (point.lng - a.lng) * abLng) / lenSq;
            t = Math.max(0, Math.min(1, t));
        }
        const proj = { lat: a.lat + t * abLat, lng: a.lng + t * abLng };
        const dist = getEuclideanDistance(point, proj);
        if (dist < bestDist) {
            bestDist = dist;
            bestAlong = accumulated + segLen * t;
        }
        accumulated += segLen;
    }
    return bestAlong;
}

/**
 * 判断单位是否在增援范围内
 */
export function isWithinReinforcementRange(unitPos: LatLng, targetPos: LatLng, centerLat: number = DEFAULT_CENTER_LAT): boolean {
    return getHexDistance(unitPos, targetPos, centerLat) <= DISTANCE_THRESHOLDS.REINFORCEMENT_RANGE;
}

// ==================== 辅助转换函数 ====================

/**
 * 从城市对象提取 LatLng (兼容不同的城市数据结构)
 */
export function cityToLatLng(city: { latitude: number; longitude: number } | { lat: number; lng: number }): LatLng {
    if ('latitude' in city) {
        return { lat: city.latitude, lng: city.longitude };
    }
    return { lat: city.lat, lng: city.lng };
}

/**
 * 标准化坐标对象 (兼容多种输入格式)
 */
export function normalizePosition(pos: { latitude?: number; longitude?: number; lat?: number; lng?: number }): LatLng {
    return {
        lat: pos.lat ?? pos.latitude ?? 0,
        lng: pos.lng ?? pos.longitude ?? 0,
    };
}
