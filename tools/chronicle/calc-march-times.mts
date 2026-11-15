/**
 * 编年史主线全量战略移动时间离线测算（2026-11-15）
 *
 * 按游戏内 PlayerQuestSystem ＋ RoadRegistry ＋ Army ＋ PlayerHero 真实路径与移速公式，
 * 一次性推演 CHRONICLE_MAINLINE 全部 1,022 场事件在战略地图上的移动时间：
 *   1. 开局单骑自阿达纳东官道追赶首战军团；
 *   2. 同将连战：自上一战场出发，逐站走完 routeVia 途经地抵达本场战场；
 *   3. 换将·攻城/野战：新主将自出发据点先行开拔，玩家自上一战场追赶会合（取双方均就位时刻）；
 *   4. 换将·守城战：玩家自上一战场单骑奔赴被守据点。
 *
 * 跑法：npx tsx --import ./tools/sim-preload.mjs tools/chronicle/calc-march-times.mts
 * 输出：scratch/chronicle_march_times.json
 */
(import.meta as unknown as { env: Record<string, unknown> }).env ??= { DEV: false };

import * as fs from 'node:fs';
import * as path from 'node:path';
import sharp from 'sharp';
import { CITIES_V2 } from '../../src/data/cities_v2';
import { CHRONICLE_MAINLINE } from '../../src/data/chronicle/ChronicleMainline.generated';
import { CHRONICLE_OPENING_PROLOGUE } from '../../src/data/chronicle/ChronicleOpening';
import { roadRegistry } from '../../src/roads/RoadRegistry';
import { LandSeaSystem } from '../../src/world/land-sea';
import { findPathFromPoint } from '../../src/events/scriptMarchPath';
import { getEuclideanDistance, joinStartToRoadPolyline } from '../../src/core/DistanceUtils';
import { shortestLongitudeDelta, normalizeLongitude } from '../../src/utils/GeoLongitude';
import {
    GameConfig,
    MOVEMENT_MATRIX,
    PLAYER_SPEED_TIERS,
    SEA_SPEED_MULTIPLIER,
} from '../../src/config/GameConfig';
import {
    PLAYER_CITY_ARRIVE_DIST,
    PLAYER_HERO_SPEED_MULT,
    PLAYER_SEA_SPEED_SCALE,
    PLAYER_START_CITY_ID,
    PLAYER_START_OFFSET,
} from '../../src/player/PlayerConfig';
import { getFactionIdOfGeneral, getGeneralRecordByGeneralId } from '../../src/data/FactionGenerals';
import { BATTLEFIELD_CHARACTERS } from '../../src/data/BattlefieldCharacters';
import { getFactionCultureAt } from '../../src/data/FactionCulture';
import { getFactionCompositionSlots, getRegionLegionComposition } from '../../src/types/CultureFormations';
import { WAR_TYPES } from '../../src/data/WarTypes';
import { getGeneralProfile } from '../../src/data/general-skills/profiles';
import { STRATEGIC_SKILL_CATALOG } from '../../src/data/GeneralSkills';

// 离线禁用网络拉取水体掩膜瓦片
LandSeaSystem.isSeaAt = () => false;

interface LatLng { lat: number; lng: number; sea?: boolean }

function haversineKm(a: LatLng, b: LatLng): number {
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = shortestLongitudeDelta(a.lng, b.lng) * Math.PI / 180;
    const h = Math.sin(dLat / 2) ** 2
        + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

// ── 加载本地缓存 DEM 瓦片（scratch/.dem-cache，z=8）用于判别坡度 ≥12° 山地 / 平原 ──
const DEM_CACHE_DIR = path.join(process.cwd(), 'scratch', '.dem-cache');
const demTiles = new Map<string, Float32Array | null>();

async function preloadDemCache(): Promise<void> {
    if (!fs.existsSync(DEM_CACHE_DIR)) return;
    const files = fs.readdirSync(DEM_CACHE_DIR).filter((f) => f.startsWith('8_') && f.endsWith('.png'));
    await Promise.all(files.map(async (f) => {
        const key = f.replace(/\.png$/, '');
        try {
            const { data, info } = await sharp(path.join(DEM_CACHE_DIR, f)).raw().toBuffer({ resolveWithObject: true });
            const ch = info.channels;
            const out = new Float32Array(256 * 256);
            for (let i = 0; i < 256 * 256; i++) {
                const r = data[i * ch], g = data[i * ch + 1], b = data[i * ch + 2];
                out[i] = (r * 256 + g + b / 256) - 32768;
            }
            demTiles.set(key, out);
        } catch {
            demTiles.set(key, null);
        }
    }));
}

function classifyLandAt(pos: LatLng): 'plain' | 'mountain' {
    const z = 8;
    const n = 1 << z;
    const xFloat = ((normalizeLongitude(pos.lng) + 180) / 360) * n;
    const latRad = Math.max(-85, Math.min(85, pos.lat)) * Math.PI / 180;
    const yFloat = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
    const tx = Math.floor(xFloat);
    const ty = Math.floor(yFloat);
    const tile = demTiles.get(`${z}_${tx}_${ty}`);
    if (!tile) return 'mountain'; // 与 Army.ts 瓦片未到时默认 mountain 一致
    const px = Math.max(1, Math.min(254, Math.floor((xFloat - tx) * 256)));
    const py = Math.max(1, Math.min(254, Math.floor((yFloat - ty) * 256)));
    const cellM = (40075016.686 * Math.cos(latRad)) / (n * 256);
    if (cellM <= 1) return 'plain';
    const dzdx = (tile[py * 256 + (px + 1)] - tile[py * 256 + (px - 1)]) / (2 * cellM);
    const dzdy = (tile[(py + 1) * 256 + px] - tile[(py - 1) * 256 + px]) / (2 * cellM);
    const slopeDeg = Math.atan(Math.hypot(dzdx, dzdy)) * 180 / Math.PI;
    return slopeDeg >= 12 ? 'mountain' : 'plain';
}

// ── 军团速度参数解析（严格复刻 Army.ts） ──
const MOUNTAIN_IMMUNE = new Set<string>(GameConfig.MARCH_ATTRITION.MOUNTAIN_MARCH_IMMUNE_CULTURES);
const SEA_BONUS = new Set<string>(GameConfig.MARCH_ATTRITION.SEA_SPEED_BONUS_CULTURES);
const PLAIN_BONUS = new Set<string>(GameConfig.MARCH_ATTRITION.PLAIN_SPEED_BONUS_CULTURES);

interface LegionSpeedSpec {
    moveClass: 'CAVALRY' | 'INFANTRY' | 'ELEPHANT';
    mountainImmune: boolean;
    plainMult: number;
    seaMult: number;
    generalMult: number;
}

function resolveLegionSpeedSpec(generalId: string, factionId: string, year: number): LegionSpeedSpec {
    const culture = getFactionCultureAt(factionId, year) ?? 'CENTRAL';
    const slotsObj = getFactionCompositionSlots(factionId) ?? getRegionLegionComposition(culture);
    const slotKeys: string[] = Array.isArray(slotsObj)
        ? slotsObj
        : ((slotsObj as { slots?: string[] } | null)?.slots ?? []);

    let hasElephant = false;
    let hasFoot = false;
    for (const k of slotKeys) {
        const t = (WAR_TYPES as Record<string, { cls?: string; spd?: number } | undefined>)[k];
        if (!t) continue;
        if ((t.spd ?? 99) <= 45) hasElephant = true;
        else if (t.cls !== 'cav') hasFoot = true;
    }
    const moveClass: 'CAVALRY' | 'INFANTRY' | 'ELEPHANT' = hasElephant
        ? 'ELEPHANT'
        : (slotKeys.length > 0 && !hasFoot ? 'CAVALRY' : 'INFANTRY');

    const profile = getGeneralProfile(generalId);
    const stratDef = profile?.strategicSkillId
        ? STRATEGIC_SKILL_CATALOG[profile.strategicSkillId]
        : undefined;
    let generalMult = 1;
    let skillMountainImmune = false;
    if (stratDef) {
        if (stratDef.effect === 'march_speed_mult') generalMult = stratDef.magnitude;
        else if (
            stratDef.effect === 'hide_during_peacetime'
            || stratDef.effect === 'hide_troop_count'
            || stratDef.effect === 'bluff_troop_count'
        ) {
            generalMult = 1.1;
        } else if (stratDef.effect === 'mountain_march_immunity') {
            skillMountainImmune = true;
        }
    }

    return {
        moveClass,
        mountainImmune: skillMountainImmune || MOUNTAIN_IMMUNE.has(culture),
        plainMult: PLAIN_BONUS.has(culture) ? GameConfig.MARCH_ATTRITION.PLAIN_SPEED_BONUS_MULT : 1,
        seaMult: SEA_BONUS.has(culture) ? GameConfig.MARCH_ATTRITION.SEA_SPEED_BONUS_MULT : 1,
        generalMult,
    };
}

function legionDegPerSec(pos: LatLng, isSea: boolean, spec: LegionSpeedSpec): number {
    const base = PLAYER_SPEED_TIERS.UNIFIED_MARCH_SPEED * spec.generalMult;
    if (isSea) {
        return base * SEA_SPEED_MULTIPLIER * spec.seaMult;
    }
    const rawKind = classifyLandAt(pos);
    const kind: 'plain' | 'mountain' = (rawKind === 'mountain' && spec.mountainImmune) ? 'plain' : rawKind;
    const mult = MOVEMENT_MATRIX[spec.moveClass][kind] * (kind === 'plain' ? spec.plainMult : 1);
    return base * mult;
}

function playerDegPerSec(isSea: boolean): number {
    const base = PLAYER_SPEED_TIERS.UNIFIED_MARCH_SPEED * PLAYER_HERO_SPEED_MULT;
    if (isSea) return base * SEA_SPEED_MULTIPLIER * PLAYER_SEA_SPEED_SCALE;
    return base * MOVEMENT_MATRIX.CAVALRY.plain; // 玩家陆上恒定骑兵平原速 0.40 deg/s
}

/** 军团路径构建（严格复刻 PlayerQuestSystem.marchHostLeg） */
function buildLegionPolyline(from: LatLng, to: LatLng): LatLng[] {
    let path = findPathFromPoint(from, to);
    if (!path || path.length < 2) {
        const anchor = roadRegistry.getNearestCityPos(to.lat, to.lng, 5);
        if (anchor) {
            const via = findPathFromPoint(from, anchor);
            if (via && via.length >= 2) path = [...via, { lat: to.lat, lng: to.lng }];
        }
    }
    if (path && path.length >= 2) {
        const joined = joinStartToRoadPolyline(from, path, GameConfig.ROAD.JOIN_EPS);
        return joined.map((p) => ({ lat: p.lat, lng: p.lng, sea: (p as { sea?: boolean }).sea }));
    }
    return [{ lat: from.lat, lng: from.lng }, { lat: to.lat, lng: to.lng }];
}

/** 玩家赴城路径构建（严格复刻 PlayerHero.travelToCity） */
function buildPlayerToCityPolyline(pos: LatLng, cityId: string, cityPos: LatLng): LatLng[] {
    const nearest = roadRegistry.getNearestCityId(pos.lat, pos.lng)
        ?? roadRegistry.getNearestCityId(pos.lat, pos.lng, 5)
        ?? roadRegistry.getNearestCityId(pos.lat, pos.lng, 30);
    let path = roadRegistry.getFullPathToCity(pos, cityId, nearest ?? undefined);
    if (!path || path.length < 2) path = roadRegistry.getFullPathToCity(pos, cityId, undefined);
    if (path && path.length >= 2) {
        return path.map((p) => ({ lat: p.lat, lng: p.lng, sea: (p as { sea?: boolean }).sea }));
    }
    return [{ lat: pos.lat, lng: pos.lng }, { lat: cityPos.lat, lng: cityPos.lng }];
}

/** 推进一条折线上的点 dt 秒，返回新坐标、本步公里数、是否走完全程 */
interface Walker {
    pos: LatLng;
    queue: LatLng[];
    done: boolean;
}

function makeLegionWalker(from: LatLng, to: LatLng): Walker {
    const poly = buildLegionPolyline(from, to);
    return {
        pos: { lat: from.lat, lng: from.lng },
        queue: poly.slice(1),
        done: poly.length < 2,
    };
}

function makePlayerCityWalker(from: LatLng, cityId: string, cityPos: LatLng): Walker {
    const poly = buildPlayerToCityPolyline(from, cityId, cityPos);
    return {
        pos: { lat: from.lat, lng: from.lng },
        queue: poly,
        done: poly.length === 0,
    };
}

function stepWalker(w: Walker, dt: number, getSpeed: (pos: LatLng, isSea: boolean) => number): number {
    if (w.done || w.queue.length === 0) {
        w.done = true;
        return 0;
    }
    const prev = { ...w.pos };
    const isSea = w.queue[0]?.sea === true;
    let rem = getSpeed(w.pos, isSea) * dt;
    while (rem > 0 && w.queue.length > 0) {
        const dest = w.queue[0];
        const dx = dest.lat - w.pos.lat;
        const dy = shortestLongitudeDelta(w.pos.lng, dest.lng);
        const d = Math.hypot(dx, dy);
        if (d <= rem) {
            w.pos = { lat: dest.lat, lng: normalizeLongitude(dest.lng) };
            rem -= d;
            w.queue.shift();
        } else {
            const r = rem / d;
            w.pos = { lat: w.pos.lat + dx * r, lng: normalizeLongitude(w.pos.lng + dy * r) };
            rem = 0;
        }
    }
    if (w.queue.length === 0) w.done = true;
    return haversineKm(prev, w.pos);
}

async function main() {
    const t0 = Date.now();
    await preloadDemCache();
    roadRegistry.initialize(CITIES_V2 as any);

    const cityMap = new Map(CITIES_V2.map((c) => [c.id, c]));
    const startCity = cityMap.get(PLAYER_START_CITY_ID)!;
    let playerPos: LatLng = {
        lat: startCity.lat + PLAYER_START_OFFSET.lat,
        lng: startCity.lng + PLAYER_START_OFFSET.lng,
    };
    let prevGeneralId: string | null = null;
    let prevBattlePos: LatLng | null = null;

    const DT = 0.2; // 0.2s 步长，兼顾精度与千场秒级运行速度
    const results: Array<Record<string, unknown>> = [];

    // 可选：CHRONICLE_ORDER_FILE 指向含 order（事件ID数组）的 JSON 时，按该顺序重算（分章调序后用）
    const orderFile = process.env.CHRONICLE_ORDER_FILE;
    let mainline = CHRONICLE_MAINLINE;
    if (orderFile) {
        const order: string[] = JSON.parse(fs.readFileSync(orderFile, 'utf-8')).order;
        const byId = new Map(CHRONICLE_MAINLINE.map((e) => [e.id, e]));
        const missing = order.filter((id) => !byId.has(id));
        if (missing.length || order.length !== CHRONICLE_MAINLINE.length) {
            throw new Error(`顺序文件与主线不符：缺 ${missing.length} 场，顺序 ${order.length} 场 / 主线 ${CHRONICLE_MAINLINE.length} 场`);
        }
        mainline = order.map((id) => byId.get(id)!);
    }

    for (let idx = 0; idx < mainline.length; idx++) {
        const ev = mainline[idx];
        const fb = ev.battle!;
        const chained = idx > 0 && prevGeneralId === ev.leadGeneralId && prevBattlePos !== null;

        const targetCity = fb.targetCityId ? cityMap.get(fb.targetCityId) : undefined;
        const targetPos: LatLng = fb.battleType === 'field'
            ? { lat: fb.targetLat, lng: fb.targetLng }
            : (targetCity
                ? { lat: targetCity.lat, lng: targetCity.lng }
                : { lat: fb.targetLat, lng: fb.targetLng });

        const fromCity = (fb.chronicleFrom ? cityMap.get(fb.chronicleFrom) : undefined)
            ?? CITIES_V2[0];
        const genRec = getGeneralRecordByGeneralId(ev.leadGeneralId)
            ?? BATTLEFIELD_CHARACTERS[ev.leadGeneralId];
        const generalName = genRec?.generalName ?? ev.leadGeneralId;
        const myFactionId = getFactionIdOfGeneral(ev.leadGeneralId)
            ?? BATTLEFIELD_CHARACTERS[ev.leadGeneralId]?.factionId
            ?? fromCity.factionId;
        const spec = resolveLegionSpeedSpec(ev.leadGeneralId, myFactionId, ev.year);

        const arriveStopDeg = fb.battleType === 'field' ? 0.20 : 0.22;
        const isDefenderSiege = fb.battleType === 'siege' && fb.role === 'defender';

        const curBridgeChars = (ev.bridge ?? []).join('').length + (idx === 0 ? Array.from(CHRONICLE_OPENING_PROLOGUE).length : 0);
        const curStrategicChars = ev.strategic.join('').length;
        const curTotalStrategicChars = curBridgeChars + curStrategicChars;
        const curTacticalChars = ev.tactical.join('').length;

        let totalSec = 0;
        let playerSec = 0;
        let playerKm = 0;
        let legionSec = 0;
        let legionKm = 0;
        let cameraKm = 0;
        const legs: Array<{ to: string; sec: number; km: number }> = [];
        let mode: 'chained' | 'switch_chase' | 'switch_defend' | 'opening_chase' =
            idx === 0 ? 'opening_chase' : (chained ? 'chained' : (isDefenderSiege ? 'switch_defend' : 'switch_chase'));

        if (chained && prevBattlePos) {
            // ── 1. 同将连战：从上一战场直接沿途经地走到本场战场 ──
            let curLegionPos = { ...prevBattlePos };
            if (getEuclideanDistance(curLegionPos, targetPos) > 0.12) {
                const stops = [...(fb.routeVia ?? []).map((v) => ({ name: v.name, pos: { lat: v.lat, lng: v.lng }, eps: 0.15 })),
                    { name: '战场', pos: targetPos, eps: arriveStopDeg }];
                for (const st of stops) {
                    if (getEuclideanDistance(curLegionPos, st.pos) <= st.eps) {
                        legs.push({ to: st.name, sec: 0, km: 0 });
                        continue;
                    }
                    const w = makeLegionWalker(curLegionPos, st.pos);
                    let lSec = 0, lKm = 0;
                    while (!w.done && getEuclideanDistance(w.pos, st.pos) > st.eps && lSec < 1800) {
                        lKm += stepWalker(w, DT, (p, sea) => legionDegPerSec(p, sea, spec));
                        lSec += DT;
                    }
                    curLegionPos = { ...w.pos };
                    legionSec += lSec;
                    legionKm += lKm;
                    legs.push({ to: st.name, sec: +lSec.toFixed(1), km: Math.round(lKm) });
                }
            } else {
                legs.push({ to: '战场', sec: 0, km: 0 });
            }
            totalSec = legionSec;
            cameraKm = legionKm;
            playerPos = { ...curLegionPos };
            prevBattlePos = { ...curLegionPos };
        } else if (isDefenderSiege) {
            // ── 2. 换将·守城战：玩家先单骑赶去出发/被守据点，到城后守军就位 ──
            const destCityPos = { lat: fromCity.lat, lng: fromCity.lng };
            if (getEuclideanDistance(playerPos, destCityPos) > PLAYER_CITY_ARRIVE_DIST) {
                const pw = makePlayerCityWalker(playerPos, fromCity.id, destCityPos);
                while (!pw.done && getEuclideanDistance(pw.pos, destCityPos) > PLAYER_CITY_ARRIVE_DIST && playerSec < 1800) {
                    playerKm += stepWalker(pw, DT, (_, sea) => playerDegPerSec(sea));
                    playerSec += DT;
                }
                playerPos = { ...pw.pos };
            }
            // 到城后守军生成（通常就在被守据点；若被守城与出发城不同则再随军走过去）
            let curLegionPos = { ...destCityPos };
            if (getEuclideanDistance(curLegionPos, targetPos) > 0.12) {
                const lw = makeLegionWalker(curLegionPos, targetPos);
                while (!lw.done && getEuclideanDistance(lw.pos, targetPos) > arriveStopDeg && legionSec < 1800) {
                    legionKm += stepWalker(lw, DT, (p, sea) => legionDegPerSec(p, sea, spec));
                    legionSec += DT;
                }
                curLegionPos = { ...lw.pos };
            }
            legs.push({ to: '战场', sec: +legionSec.toFixed(1), km: Math.round(legionKm) });
            totalSec = playerSec + legionSec;
            cameraKm = playerKm + legionKm;
            playerPos = { ...curLegionPos };
            prevBattlePos = { ...curLegionPos };
        } else {
            // ── 3. 换将·攻城/野战（含首战）：军团自出发城先行开拔，玩家自上一位置按 stepChase 追赶会合 ──
            let curLegionPos: LatLng = { lat: fromCity.lat, lng: fromCity.lng };
            if (getEuclideanDistance(curLegionPos, targetPos) <= 0.12) {
                if (targetCity) {
                    const ring = Math.min(0.08, GameConfig.SIEGE.COMBAT_RADIUS * 0.6);
                    curLegionPos = { lat: targetCity.lat, lng: targetCity.lng + ring };
                }
            }
            const stops = getEuclideanDistance(curLegionPos, targetPos) <= 0.12
                ? []
                : [...(fb.routeVia ?? []).map((v) => ({ name: v.name, pos: { lat: v.lat, lng: v.lng }, eps: 0.15 })),
                    { name: '战场', pos: targetPos, eps: arriveStopDeg }];

            let stopIdx = 0;
            let lw: Walker | null = stops.length > 0 ? makeLegionWalker(curLegionPos, stops[0].pos) : null;
            let curLegSec = 0, curLegKm = 0;
            let legionDone = stops.length === 0;
            if (legionDone) legs.push({ to: '战场', sec: 0, km: 0 });

            let joined = getEuclideanDistance(playerPos, curLegionPos) <= PLAYER_CITY_ARRIVE_DIST;
            let pw: Walker | null = null;
            let travelAnchorId: string | null = null;
            let inFinalHop = false;

            while ((!legionDone || !joined) && totalSec < 2400) {
                totalSec += DT;
                // 推进军团
                let stepLegionKm = 0;
                if (!legionDone && lw) {
                    const st = stops[stopIdx];
                    stepLegionKm = stepWalker(lw, DT, (p, sea) => legionDegPerSec(p, sea, spec));
                    curLegionPos = { ...lw.pos };
                    legionSec += DT;
                    legionKm += stepLegionKm;
                    curLegSec += DT;
                    curLegKm += stepLegionKm;
                    if (lw.done || getEuclideanDistance(curLegionPos, st.pos) <= st.eps) {
                        legs.push({ to: st.name, sec: +curLegSec.toFixed(1), km: Math.round(curLegKm) });
                        curLegSec = 0;
                        curLegKm = 0;
                        stopIdx++;
                        if (stopIdx < stops.length) {
                            lw = makeLegionWalker(curLegionPos, stops[stopIdx].pos);
                        } else {
                            legionDone = true;
                            lw = null;
                        }
                    }
                }
                // 推进玩家单骑追击（严格复刻 PlayerHero.stepChase：按最近锚点城走 getFullPathToCity，到锚点后走末段）
                if (!joined) {
                    const anchor = roadRegistry.getNearestCityId(curLegionPos.lat, curLegionPos.lng)
                        ?? roadRegistry.getNearestCityId(curLegionPos.lat, curLegionPos.lng, 5)
                        ?? roadRegistry.getNearestCityId(curLegionPos.lat, curLegionPos.lng, 30)
                        ?? fromCity.id;
                    const anchorCity = cityMap.get(anchor) ?? fromCity;
                    const anchorPos = { lat: anchorCity.lat, lng: anchorCity.lng };
                    if (getEuclideanDistance(playerPos, anchorPos) <= PLAYER_CITY_ARRIVE_DIST) {
                        if (!inFinalHop || !pw || pw.done) {
                            const directPath = roadRegistry.findPathOnRoad(playerPos, curLegionPos) as LatLng[] | null;
                            const marchPts = (directPath && directPath.length >= 2)
                                ? joinStartToRoadPolyline(playerPos, directPath, GameConfig.ROAD.JOIN_EPS).slice(1)
                                : [{ lat: curLegionPos.lat, lng: curLegionPos.lng }];
                            pw = {
                                pos: { ...playerPos },
                                queue: marchPts.map((p) => ({ lat: p.lat, lng: p.lng, sea: p.sea })),
                                done: marchPts.length === 0,
                            };
                            inFinalHop = true;
                        }
                    } else if (travelAnchorId !== anchor || !pw || pw.done) {
                        pw = makePlayerCityWalker(playerPos, anchor, anchorPos);
                        travelAnchorId = anchor;
                        inFinalHop = false;
                    }
                    const pStepKm = stepWalker(pw, DT, (_, sea) => playerDegPerSec(sea));
                    playerPos = { ...pw.pos };
                    playerSec += DT;
                    playerKm += pStepKm;
                    cameraKm += pStepKm;
                    if (getEuclideanDistance(playerPos, curLegionPos) <= PLAYER_CITY_ARRIVE_DIST) {
                        joined = true;
                        playerPos = { ...curLegionPos };
                    }
                } else {
                    cameraKm += stepLegionKm;
                    playerPos = { ...curLegionPos };
                }
            }
            prevBattlePos = { ...curLegionPos };
        }

        prevGeneralId = ev.leadGeneralId;
        const totalSecRound = +totalSec.toFixed(1);
        results.push({
            seq: idx + 1,
            id: ev.id,
            baton: ev.baton,
            year: ev.year,
            title: ev.title,
            leadGeneralId: ev.leadGeneralId,
            generalName,
            battleType: fb.battleType,
            role: fb.role,
            mode,
            fromCityName: fromCity.name,
            targetName: fb.targetName,
            totalSec: totalSecRound,
            totalKm: Math.round(cameraKm),
            playerSec: +playerSec.toFixed(1),
            playerKm: Math.round(playerKm),
            legionSec: +legionSec.toFixed(1),
            legionKm: Math.round(legionKm),
            legs,
            curBridgeChars,
            curStrategicChars,
            curTotalStrategicChars,
            curTacticalChars,
        });
    }

    const outPath = process.env.CHRONICLE_MARCH_OUT ?? path.join(process.cwd(), 'scratch', 'chronicle_march_times.json');
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');

    // 打印统计摘要与前 10 场实测对比
    console.log(`✅ 离线测算完成：共 ${results.length} 场，耗时 ${((Date.now() - t0) / 1000).toFixed(2)}s → scratch/chronicle_march_times.json\n`);
    console.log('── 前 10 场测算明细（对照真机日志）──');
    for (const r of results.slice(0, 10)) {
        console.log(
            `#${r.seq} [${r.id}] ${r.title} (${r.mode})：总移动 ${r.totalSec}s`
            + ` [玩家 ${r.playerSec}s·${r.playerKm}km | 军团 ${r.legionSec}s·${r.legionKm}km]`
            + ` | 现战略总字数=${r.curTotalStrategicChars}字`,
        );
    }

    const secs = results.map((r) => r.totalSec as number).sort((a, b) => a - b);
    const pct = (p: number) => secs[Math.min(secs.length - 1, Math.floor(secs.length * p))];
    const buckets = [
        { label: '0–5s (原地/贴脸)', min: 0, max: 5 },
        { label: '5–12s (极短途)', min: 5, max: 12 },
        { label: '12–22s (短途)', min: 12, max: 22 },
        { label: '22–38s (标准中程)', min: 22, max: 38 },
        { label: '38–65s (中长途)', min: 38, max: 65 },
        { label: '>65s (长途/跨区)', min: 65, max: Infinity },
    ];
    console.log(`\n── 全主线 ${results.length} 场移动时长分位 ──`);
    console.log(`最小值=${secs[0]}s | P10=${pct(0.1)}s | P25=${pct(0.25)}s | 中位数P50=${pct(0.5)}s | P75=${pct(0.75)}s | P90=${pct(0.9)}s | 最大值=${secs[secs.length - 1]}s`);
    console.log('\n── 时长区间分布 ──');
    for (const b of buckets) {
        const cnt = secs.filter((s) => (b.min === 0 ? s >= 0 : s > b.min) && s <= b.max).length;
        console.log(`  ${b.label.padEnd(20)} : ${String(cnt).padStart(4)} 场 (${((cnt / secs.length) * 100).toFixed(1)}%)`);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
