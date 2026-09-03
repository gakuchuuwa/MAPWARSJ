import L from 'leaflet';
import { GameMap } from './GameMap';
import { OrientationSystem } from '../core/OrientationSystem';
import { GridSystem } from '../systems/GridSystem';
import { MAP_LAYER_ZINDEX, MAP_PANES } from '../config/MapLayers';
import { perfDoctor } from '../debug/PerfDoctor';
import { isMacroMapZoom } from '../config/StrategicView';
import { PlayerPhalanxDrawer } from './player/PlayerPhalanxDrawer'; // [NEW] Preload only
import { LegionPhalanxDrawer, PhalanxAnimState } from './legion/LegionPhalanxDrawer'; // [AI SYSTEM]
import { getCultureNavalShip, getNavalWeapons, type NavalShipAssetId } from '../types/NavalShipTiers';
import { LegionPhalanxStateManager } from './legion/LegionPhalanxState';
import { NavalPhalanxStateManager } from './legion/NavalPhalanxState';
import {
    actAt, blockOffsetAt, slotPlanAt, easeInOut, SCENE13_CONTACT_RATIO,
} from './legion/Scene13Choreographer'; // [2026-08-10 剧本法]
import { LegionFlagDrawer } from './legion/LegionFlagDrawer'; // [AI FLAG SYSTEM]
import { ProjectileRenderer } from './ProjectileRenderer'; // [NEW] Arrow System
import { BanditDrawer, BanditState } from './BanditDrawer';
import { LegionType } from '../types/UnitTypes';

import {GameConfig} from '../config/GameConfig';
import {
    CITY_ART_NATIVE_HEIGHT_PX,
    CITY_ART_NATIVE_WIDTH_PX,
    getCityMarkerBaseWidthPx,
    getSiegeCityScreenWidthPx,
} from '../config/city-marker-tokens';
import { gameLog } from '../utils/GameLogger';
import {GENERAL_PROFILES, STRATEGIC_SKILL_CATALOG} from '../data/GeneralSkills';
import { getGeneralRecordByGeneralId } from '../data/FactionGenerals';
import { generalIdHasStrategicEffect } from '../combat/GeneralSkillCombat';
import {
    expandCompositionScales,
    expandCompositionSlots,
} from '../types/LegionComposition';
import { getCultureTier, getFactionCompositionSlots, type FormationMode } from '../types/CultureFormations';

/** [2026-08-10 编队外框] 命中查询结果：目标编队的位置 + 算它外框所需的全部参数 */
interface SquadHit {
    pt: { x: number; y: number };
    type: string;
    /** 目标所属阵型的旋转角（rad） */
    angle: number;
    /** 目标方的单兵渲染宽 / 高（像素） */
    dw: number;
    dh: number;
}

/** 虚张声势倍率：从武将的战略技 catalog 读取 magnitude，fallback 2 */
function getBluffMagnitude(generalId: string | undefined): number {
    if (!generalId) return 2;
    const profile = GENERAL_PROFILES[generalId];
    if (!profile?.strategicSkillId) return 2;
    const skill = STRATEGIC_SKILL_CATALOG[profile.strategicSkillId];
    if (skill?.effect !== 'bluff_troop_count') return 2;
    return skill.magnitude;
}

/** Leaflet LatLng 拒收 NaN；坐标无效时跳过渲染/投影，避免整页崩溃 */
function isValidMapCoord(pos: { lat?: number; lng?: number } | null | undefined): pos is { lat: number; lng: number } {
    return !!pos
        && Number.isFinite(pos.lat)
        && Number.isFinite(pos.lng);
}

export interface IRenderable {
    getPosition(): { lat: number; lng: number };
    getTroops(): number;
    isDestroyed: boolean;
    name?: string;
    generalId?: string;
}

export interface IAnimatedUnit extends IRenderable {
    // Animation State
    isAttacking: boolean;
    isMoving: boolean;

    // Battle Info
    currentBattleType: 'siege' | 'field' | null;
    isSiegeAttacker?: boolean; // 攻城方才有器械
    targetPos: { lat: number; lng: number } | null;

    // Movement Tracking
    lastPosition: { lat: number; lng: number };

    // Optional
    id?: string;
    type?: string;
    lastDirection?: number;
    lastDamageTime?: number; // [NEW] For visual damage feedback
    legionType?: LegionType; // [UNIT SYSTEM] 兵种类型
    factionId?: string; // [NEW] Faction ID for color tinting
    visible?: boolean; // [NEW] Visibility toggle
    isPlayer?: boolean; // [NEW] Player control flag

    // [NEW] Projectile Cooldown
    lastShotTime?: number;

    // [NEW] Corpse Persistence
    destroyTime?: number;
    /** 非战死消失的渐隐参数 */
    fadeOutStart?: number;
    fadeOutDurationMs?: number;
    cultureSlots?: string[] | null; // [NEW] 14-culture formation slots
    cultureScales?: number[] | null; // [NEW] Scales for each slot
    formationMode?: FormationMode | null; // [NEW] 阵型（渲染层据此定布局）
    /** 海域 hex：渲染船贴图而非陆地方阵 */
    isOnSea?: boolean;
    /** 登船时锁定的文化船图。 */
    navalShipAssetLock?: NavalShipAssetId | null;
    /** 海军实际船首航向（弧度；lat=cos、lng=sin），由 Army 航行计算提供。 */
    navalHeadingRad?: number | null;
    /** ArmyEditor：强制模拟海上 */
    forceNavalVisual?: boolean;
    /** 预览缩放倍率（仅编辑器用，默认 1） */
    previewScale?: number;
}

interface NavalFieldBattlePose {
    point: L.Point;
    latLng: { lat: number; lng: number };
    enemyLatLng: { lat: number; lng: number };
    headingRad: number;
    trail: { x: number; y: number }[];
    broadsideReady: boolean;
    /** 沿轨道的瞬时航速（度/秒，世界坐标）：给划桨随速用，海战里桨速跟着风/呼吸快慢变 */
    speedDegPerSec: number;
}

/**
 * Global Unit Renderer - Manages all unit rendering using Phalanx Visuals
 */
export class GlobalUnitRenderer {
    private map: L.Map;
    // Canvas High (Default, Field Battle, Moving) - Above Cities
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    // Canvas Low (Siege Battle) - Below Cities
    private canvasLow: HTMLCanvasElement;
    private ctxLow: CanvasRenderingContext2D;

    private units: Set<IAnimatedUnit> = new Set();
    // [OPTIMIZATION] Cache sorted array to avoid Array.from(Set) every frame
    private sortedUnitsCache: IAnimatedUnit[] = [];
    private needsSort: boolean = false;

    private unitFightingStates: Map<string, boolean> = new Map();
    private lastMapCenter: L.LatLng | null = null;
    private unitVisualAngles: Map<string, number> = new Map();

    /** [2026-08-27 §② 划桨随速] 每舰队的世界速度跟踪（世界坐标+时间戳），算真实船速（不受地图平移干扰）。 */
    private navalSpeedTrack: Map<string, { lat: number; lng: number; t: number; speed: number }> = new Map();
    /** [2026-08-30 海战演出] 海战开火节流：箭雨 / 重炮 各自独立（对齐 naval_arrow_fire / naval_cannon_fire 音效）。 */
    private navalArrowAt: Map<string, number> = new Map();
    private navalCannonAt: Map<string, number> = new Map();
    /** 抛石重器（楼船牵引抛石机 / 抛石舰）与希腊火喷射各自的节流表 */
    private navalStoneAt: Map<string, number> = new Map();
    private navalGreekFireAt: Map<string, number> = new Map();

    private lastTime: number = 0;
    private isRunning: boolean = false;
    private showLabels: boolean = true; // [NEW] Toggle for text labels

    // ── [2026-08-09 编队独立移动] 13 场景：9 个格位编队各自推进 ──
    // key = `${unitId}:${squadIndex}` → 当前屏幕偏移（旋转前空间，像素，相对军团锚点）
    private squadMoveState = new Map<string, { x: number; y: number }>();
    /** [2026-08-10 重做·统一战斗核心] 编队目标锁：`selfKey:i` → 敌编队认领键。
     *  锁定目标阵亡/过期才重选最近的（防每帧换目标转圈）。场景退出随 squadMoveState 一并清。 */
    private squadTargetLock = new Map<string, string>();
    /** [2026-08-10 战线时间轴] 本场战斗的「幕一·列阵」起点（进 13 场景第一帧）。
     *  0~1.5s 列阵对峙（IDLE）→ 之后幕二·冲锋（MOVE，时间轴驱动，无逐帧积分零抖动）。 */
    private battlePhaseStart = 0;

    // ── [2026-08-09 就近咬住·第二段] 双方编队屏幕位置共享表 ──
    // 攻守两侧在各自推进函数里发布本帧编队绝对屏幕坐标，对面读它找最近敌人。
    // 两侧计算时机不同（攻方先、守方后），先算的一方读到的是**上一帧**数据 —— 60fps 下
    // 一帧延迟肉眼不可见，换来不必重排渲染顺序。frame 戳用于剔除已结束战斗的陈旧条目。
    private squadPosRegistry = new Map<string, {
        frame: number;
        factionId: string;
        pts: ({ x: number; y: number } | null)[];
        types: string[];
        /** [2026-08-10 编队外框] 本方阵型旋转角（rad，= (direction+1)·π/4）：
         *  对面要用它把「我→敌」的世界方向转进**敌方本地坐标**，才能算敌方外框的支撑半径。 */
        angle: number;
        /** 单兵渲染宽 / 高（像素）：外框尺寸按发布方自己的精灵算，不再拿我方尺寸套敌方 */
        dw: number;
        dh: number;
    }>();
    private squadRegistryFrame = 0;
    /** [2026-08-10 帧级共享认领] 本帧所有参战军团（攻方×N + 守军）共用的认领计数——
     *  取代「每军团独立 claims」：独立计数会让多军团编队拿重复 slot → 多个编队瞄同一
     *  目标点 → 撞车 → 友军防重叠互挡 → 绕行抖动（主人实锤「士兵颤抖」）。
     *  animate 渲染循环前清一次，整帧共享。 */
    private frameClaims = new Map<string, number>();
    /** [2026-08-10 阵亡单调] 编队兵力已扣光的最大损失（key = unitId / def_cityId）：
     *  引擎兵力回升（胜战计加兵等）不清算已阵亡编队，防 DEATH/ALIVE 反复 = 横躺颤抖 */
    private squadMaxLoss = new Map<string, number>();
    // ── [2026-08-09 编队级阵亡] 每编队独立兵力（key = `${unitId}`；守军 = `def_${cityId}`）──
    /** 初始兵力（进 13 战斗时按槽位均分，残兵给前几个编队） */
    private squadBaseTroops = new Map<string, number[]>();
    /** 编队接触距离系数：× 格位间距。
     *  0.90 ≈ 两编队边缘刚好挨上（0.55 会穿模 35%——主人核对：步兵半宽 1.81×2 = 3.625 单兵宽 = 0.91×spacing） */
    // 【2026-08-09 废弃】统一接触系数已被「按双方编队实际宽度」取代
    // （见 getSquadOffsets / getDefenderSquadOffsets 里的 unitWpx + getSquadWidthFactor）。
    // 保留常量只为记录历史值，勿再引用；要调接触松紧请改 getSquadWidthFactor 的系数。
    /** 同一敌方编队最多被几个我方编队咬住（软上限，防全部叠到一个敌人身上） */
    private static readonly SQUAD_CLAIM_CAP = 2;

    /** 发布本方编队屏幕坐标，供对面就近查找。死亡编队以 null 占位（保持索引对齐，对面自动跳过） */
    private publishSquadPositions(
        key: string,
        factionId: string,
        pts: ({ x: number; y: number } | null)[],
        types: string[],
        angle: number,
        dw: number,
        dh: number,
    ): void {
        this.squadPosRegistry.set(key, {
            frame: this.squadRegistryFrame, factionId, pts, types, angle, dw, dh,
        });
    }

    /** 按「军团:格位」取敌方编队当前坐标 + 外框参数；条目过期/越界返回 null（目标已阵亡或战斗结束） */
    /**
     * [2026-08-10 编队外框] 两个编队「外框刚好贴上」的中心距。
     * = 支撑半径_我(d) + 支撑半径_敌(−d)，d = 我→敌 的世界单位方向。
     * 各自把 d 转进自己的本地坐标（世界→本地与 tx/ty 同一套逆旋转），所以不管
     * 双方朝向差多少、从哪个方位压上来，算出来的都是那个方向上真实的外框间距。
     * 🔴 [2026-08-10 修·隔空战斗] 判定用**士兵真实占位**（支撑半径，不再乘视觉框收缩系数）：
     * 原实现乘 0.7/0.55（debugDrawSquadBox 的调试框）→ 框相切时士兵之间还有缝 →
     * 近战隔空挥砍（主人实锤）。真实占位相切 = 最前排士兵模型边缘接触 = 贴身；视觉调试框保持原样。
     */
    private squadContactDistance(
        from: { x: number; y: number },
        myType: string,
        myAngle: number,
        myDw: number,
        myDh: number,
        enemy: SquadHit,
    ): number {
        const wx = enemy.pt.x - from.x;
        const wy = enemy.pt.y - from.y;
        const len = Math.hypot(wx, wy) || 1;
        const dx = wx / len;
        const dy = wy / len;
        // 世界 → 我方本地
        const mc = Math.cos(myAngle);
        const ms = Math.sin(myAngle);
        const myR = LegionPhalanxDrawer.getSquadSupportRadius(
            myType, dx * mc + dy * ms, -dx * ms + dy * mc, myDw, myDh,
        );
        // 世界 → 敌方本地（方向取反：从敌方看过来）
        const ec = Math.cos(enemy.angle);
        const es = Math.sin(enemy.angle);
        const enR = LegionPhalanxDrawer.getSquadSupportRadius(
            enemy.type, -dx * ec - dy * es, dx * es - dy * ec, enemy.dw, enemy.dh,
        );
        // [2026-08-10 主人定稿·边框 = 唯一开战标准] 判定与视觉边框同源：
        // 双方支撑半径各乘 debugDrawSquadBox 同一组收缩系数（骑 0.55 / 其他 0.70 /
        // 据点 1.0）——**边框相切 = 判定碰到 = 开战**。此前判定用「士兵真实占位」
        // （不乘系数，且素材含透明边距算得虚大）→ 边框还没碰就开打（主人实锤
        // 「前排都没有碰到就开始战斗」）。改边框松紧只调 shrink，两处必须同步。
        const shrinkOf = (t: string): number => {
            if (t === 'city') return 1.0; // 城图是本体，不缩——攻方停在城图边缘
            return LegionPhalanxDrawer.isCavalryType(t) ? 0.55 : 0.70;
        };
        return myR * shrinkOf(myType) + enR * shrinkOf(enemy.type);
    }

    /**
     * [2026-08-10 编队外框·防重叠] 本编队走到 next 后，会不会压进**自己人**的外框里？
     *
     * 主人定：每个形状不能重叠。友军之间不该互相穿模——但 🔴 绝不能靠「事后推开」实现
     * （屏幕错开/去叠是铁律禁止项）。这里只做**前进否决**：会重叠就本帧不走，
     * 停在原地等前面的让开，位置永远是自己走出来的，没有任何外力位移。
     *
     * 友军坐标取上一帧发布的（与敌方共享表同一套，60fps 下一帧延迟肉眼不可见），
     * 免得为了本帧顺序去重排渲染。
     */
    /**
     * [2026-08-10 据点外框·主人定稿] 据点也有边框，编队不许和它重叠。
     *
     * 城图外框 = 以城中心为心、halfW × halfH 的矩形（与 computeSiegeDefenderAnchor
     * 用的是同一套尺寸，唯一来源 getSiegeCityScreenWidthPx + CITY_ICON_HW_RATIO）。
     * 允许的最小中心距 = 城框支撑半径 + 编队外框支撑半径，两者都沿「城→编队」方向取。
     *
     * 效果：攻方压上来会被挡在**据点边缘**开打，不会踩进城图里；守方是从城边缘往外走的，
     * 不受影响（只否决「更靠近城」的移动，见调用处）。
     *
     * @returns 允许的最小「编队中心 ↔ 城中心」像素距离；据点不可解析时返回 null（不设限）
     */
    private cityKeepOutDistance(
        city: { latitude: number; longitude: number },
        squadPt: { x: number; y: number },
        myType: string,
        myAngle: number,
        myDw: number,
        myDh: number,
    ): { cityPt: L.Point; minDist: number } | null {
        const zoom = this.map.getZoom();
        const cityPt = this.map.latLngToContainerPoint([city.latitude, city.longitude]);
        const halfW = getSiegeCityScreenWidthPx(zoom) / 2;
        const halfH = halfW * GlobalUnitRenderer.CITY_ICON_HW_RATIO;
        const wx = squadPt.x - cityPt.x;
        const wy = squadPt.y - cityPt.y;
        const len = Math.hypot(wx, wy);
        if (len < 1e-6) return { cityPt, minDist: halfW + halfH };
        const dx = wx / len;
        const dy = wy / len;
        // 城框（屏幕轴对齐矩形）沿该方向的支撑半径
        const cityR = halfW * Math.abs(dx) + halfH * Math.abs(dy);
        // 编队外框沿「城 → 我」的反方向（即从我看向城）的支撑半径：世界 → 我方本地
        const mc = Math.cos(myAngle);
        const ms = Math.sin(myAngle);
        const squadR = LegionPhalanxDrawer.getSquadSupportRadius(
            myType, -dx * mc - dy * ms, dx * ms - dy * mc, myDw, myDh,
        );
        return { cityPt, minDist: cityR + squadR };
    }



    /**
     * [2026-08-10 主人定稿·编队占位独立] 本编队走到 next 后会不会压进**任何友军编队**
     * 的边框（跨军团、含守军/城图）？边框重叠 = 禁走（前进否决，本帧原地），阵亡编队
     * （null 占位）不挡路。边框几何与交战判定同源（squadContactDistance）——
     * 「不重叠」和「相切开战」用的是同一个框。
     */
    private squadBlockedByAlly(
        myFactionId: string,
        selfKey: string,
        selfIndex: number,
        next: { x: number; y: number },
        myType: string,
        myAngle: number,
        myDw: number,
        myDh: number,
    ): boolean {
        for (const [key, entry] of this.squadPosRegistry) {
            if (entry.factionId !== myFactionId) continue; // 敌军由 stopDist（相切开战）管
            // [2026-08-10 修·守军被自己的城挡住] 城图是以**守方势力**发布的一个编队
            // （publishSquadPositions(`city_${id}`, city.factionId)），外框 = 整张城图，
            // 支撑半径六七百到九百多 px。守军就站在城图上/城图边，永远落在这个巨框里 →
            // 本函数每帧都判「被友军挡住」→ 守军全体 IDLE 一步不出（主人实锤「防守方不动」，
            // 邢台/邯郸/马格德堡/番禺四场样本全中，全是攻城战）。
            // 城对**敌方**照旧是障碍（由 stopDist 相切管，那条路径不受影响）；
            // 但它绝不能挡住自己的守军出城迎战。
            if (key.startsWith('city_')) continue;
            if (this.squadRegistryFrame - entry.frame > 1) continue;
            for (let j = 0; j < entry.pts.length; j++) {
                if (key === selfKey && j === selfIndex) continue;
                const p = entry.pts[j];
                if (!p) continue; // 阵亡编队不占位
                const need = this.squadContactDistance(next, myType, myAngle, myDw, myDh, {
                    pt: p,
                    type: entry.types[j] ?? 'mixed',
                    angle: entry.angle,
                    dw: entry.dw,
                    dh: entry.dh,
                });
                if (Math.hypot(p.x - next.x, p.y - next.y) < need) return true;
            }
        }
        return false;
    }

    /**
     * 找最近的敌方编队。claims 记录每个敌方编队已被咬住的次数，达到 SQUAD_CLAIM_CAP 就跳过找次近的。
     * 返回 { 认领键, 屏幕坐标, slot }；slot = 本编队在该敌人身上的**认领序号**（0 = 正面第一个，
     * 1、2… = 后到的，由调用方让开一个编队宽站侧翼）。
     * 找不到（对面还没发布/战斗刚开始）返回 null，调用方退回原目标。
     */
    private findNearestEnemySquad(
        myFactionId: string,
        from: { x: number; y: number },
        claims: Map<string, number>,
    ): (SquadHit & { key: string; slot: number }) | null {
        let best: SquadHit | null = null;
        let bestKey = '';
        let bestDist = Infinity;
        let fallback: SquadHit | null = null;
        let fallbackKey = '';
        let fallbackDist = Infinity;
        for (const [key, entry] of this.squadPosRegistry) {
            if (entry.factionId === myFactionId) continue; // 同势力 = 友军，跳过
            // 只认本帧或上一帧发布的（战斗结束后条目会自然过期）
            if (this.squadRegistryFrame - entry.frame > 1) continue;
            for (let i = 0; i < entry.pts.length; i++) {
                const p = entry.pts[i];
                if (!p) continue; // 死亡编队占位 null，跳过（不吸引新目标）
                const d = Math.hypot(p.x - from.x, p.y - from.y);
                const ck = `${key}:${i}`;
                const hit: SquadHit = {
                    pt: p,
                    type: entry.types[i] ?? 'mixed',
                    angle: entry.angle,
                    dw: entry.dw,
                    dh: entry.dh,
                };
                if (d < fallbackDist) { fallbackDist = d; fallback = hit; fallbackKey = ck; }
                if ((claims.get(ck) ?? 0) >= GlobalUnitRenderer.SQUAD_CLAIM_CAP) continue;
                if (d < bestDist) { bestDist = d; best = hit; bestKey = ck; }
            }
        }
        if (best) {
            const slot = claims.get(bestKey) ?? 0;
            claims.set(bestKey, slot + 1);
            return { ...best, key: bestKey, slot };
        }
        // 全部敌方编队都满员 → 退回最近的那个（宁可挤，也好过没目标呆立）
        // 这里也照常记认领：slot 递增 → 挤上来的编队按序号往两侧排开，不会全叠在同一点
        if (!fallback) return null;
        const fslot = claims.get(fallbackKey) ?? 0;
        claims.set(fallbackKey, fslot + 1);
        return { ...fallback, key: fallbackKey, slot: fslot };
    }

    /**
     * [2026-08-09 编队级阵亡] 每编队独立兵力：按军团当前总兵力轮询扣减。
     * - 初始：进 13 战斗首帧按槽位均分（残兵给前几个编队），记录在 squadBaseTroops
     * - 每帧：总损失 = 初始总和 − 当前军团 troops，从编队 0 开始逐个扣光（先满编队先倒，逐个倒下）
     * - 返回每编队当前兵力数组；扣光（≤0）的编队由调用方标 DEATH
     * 纯视觉层分配，不写回引擎；8/9/10 不调用此方法。
     */
    private computeSquadTroops(key: string, totalTroops: number, count: number): number[] {
        let base = this.squadBaseTroops.get(key);
        if (!base || base.length !== count) {
            // 首帧初始化：均分，残兵给前几个编队（如 10000/9 → [1112,1112,…,1111]）
            const each = Math.floor(totalTroops / count);
            const rem = totalTroops - each * count;
            base = Array.from({ length: count }, (_, i) => each + (i < rem ? 1 : 0));
            this.squadBaseTroops.set(key, base);
        }
        const baseTotal = base.reduce((a, b) => a + b, 0);
        // 总损失：初始总和 − 当前总兵力（夹到 [0, baseTotal]）
        let loss = Math.min(baseTotal, Math.max(0, baseTotal - totalTroops));
        // [2026-08-10 阵亡单调] 损失只增不减：引擎兵力可能回升（胜战计「守加己兵」等），
        // 回升不清算已阵亡编队——否则死编队复活 → DEATH/ALIVE 反复 = 横躺颤抖（主人实锤）。
        const prevLoss = this.squadMaxLoss.get(key) ?? 0;
        if (loss < prevLoss) loss = prevLoss;
        else this.squadMaxLoss.set(key, loss);
        const cur = base.slice();
        // 轮询扣减：从编队 0 开始扣，扣光一个再扣下一个（先满编队先倒，逐个倒下）
        for (let i = 0; i < cur.length && loss > 0; i++) {
            const take = Math.min(cur[i], loss);
            cur[i] -= take;
            loss -= take;
        }
        return cur;
    }

    /** 编队停止距离（px）：近战 = 接触；远程 = 射程（主人 2026-08-09 定稿：井阑投石床弩弓骑都到射程停） */
    private static readonly SQUAD_STOP_DIST_PX: Record<string, number> = {
        // 远程：推进到射程边界就停
        // 【2026-08-09 主人定稿·射程重排】旧值（弓 400 / 弩 350 / 床弩 450 / 井阑 550 / 投石 750）
        // 是编队还是「一个点」时定的。现在一个编队本身就 209~400px 宽，近战接触距离约 396px，
        // 与旧弓射程 400 仅差 4px → 远程和肉搏线完全重合，分不出谁在放风筝（主人实锤）。
        // 新值按「射程 ≈ 近战接触的 2~3.5 倍」重排，纵深拉开：近战 → 弩 → 弓 → 床弩 → 井阑 → 投石。
        // ⚠️ 射程 > 攻守阵距（SCENE13_ATTACKER_GAP_PX，现 650）→ 开局即在射程内、原地站桩不推进。
        //    2026-08-10 器械统一 600 后三种器械都在阵距之内，开局会先推进一小段再开打。
        // 【2026-08-09 二次修正】① horse_archer 已移出本表 —— 主人早已定「弓骑是骑兵」，
        //    它按骑兵 1-2-3 编队展开，停止距离却留在远程表当远程用，两套标准打架；
        //    草原/河西/中亚/西域/突厥主力都是弓骑，6 格里 5 格站 750px 外不上前 → 战场空着。
        //    移出后按近战冲到接触距离，与「弓骑是骑兵」一致。
        // ② 其余射程整体压近：上一版 650~1400 远超近战接触（209~400px），远程脱节成另一拨。
        // [2026-08-10 主人定·射程只剩两档] 弓手/弩手统一 500；床弩/井阑/投石统一 600
        //    （原 600 / 700 / 850 三档并档，同「为什么远程的距离还不一样」）。
        //    取 600 而非 700/850：只有它小于攻守阵距 650，三种器械开局都会向前推进一小段再开打，
        //    不会像 700/850 那样一开场就已在射程内、全程站桩与近战部队脱节。
        //    ⚠️ 层次现在是「近战接触 → 弓弩 500 → 器械 600」，不再有器械内部的纵深分档。
        archer: 500, crossbow: 500, ballista: 600,
        well_lan: 600, well_lan_r: 600, catapult_l: 600, catapult_r: 600,
    };

    /**
     * [2026-08-10 到位容差] 距停止线 ≤ 此值 = 已到位（推进结束，不再计停滞）。
     * 修复「改了好几天还是隔空战斗」：双方都快到位时相对距离下降变慢（step 趋近
     * stopDist − dist），低于 stallEps 阈值 → 停滞兜底误判 → 最后 30–60px 被截停，
     * 恰好吃掉 SQUAD_HITBOX_SHRINK 的咬合量 → 观感隔空挥刀。
     */
    private static readonly SQUAD_ARRIVE_EPS_PX = 14;

    /** [2026-08-09 齐头并进·第一段] 冲锋阶段统一速度（px/s）——9 编队一条线压上，
     *  不分兵种快慢（主人定：全面战争式齐头并进，接触后再各自找对手）。
     *  2026-08-09 主人实锤「隔着老远交战」= 主力冲锋路上太久（750px/110 ≈ 7s，占满 10-30s 战斗）→ 140px/s */
    private static readonly SCENE13_CHARGE_SPEED_PX = 140;
    /** [2026-08-09 视觉对垒] 13 场景攻方阵心距城图框缘的外侧空隙（px）：守军在框缘内侧，攻方贴外侧对峙
     *  （2026-08-09 主人：攻方应与据点拉开距离——550 仍显近，定稿 750px；
     *   同日再调 750→650：配合冲锋提速，接触更快、画面更紧凑不贴脸） */
    private static readonly SCENE13_ATTACKER_GAP_PX = 650;
    /** [2026-08-10 野战开场] 两军最前缘之间保留的净空（px）。
     * 阵心距不能再写死：13 的 3×3 格位会随兵种贴图/文化倍率变化，固定 650px 小于两军
     * 实际半深之和时，第一帧就会互相穿插。现按双方真实编队投影半径 + 本净空动态计算。
     * 幕二双方各冲锋 120px 后仍余 120px，再由当前交战排推进至贴身。 */
    private static readonly SCENE13_FIELD_CLEAR_LANE_PX = 360;
    /** 资源尚未加载、无法计算编队投影时的安全阵心距；宁可多留空地，不允许开场交叉。 */
    private static readonly SCENE13_FIELD_FALLBACK_GAP_PX = 1200;
    /** 地图拖动/缩放后需重绘（可跨帧分批） */
    private mapNeedsRedraw = true;
    private pendingViewRedraw = false;
    private lastViewRedrawAt = 0;
    /** 拖动中限制全量重绘频率，降低画布尖峰 */
    private static readonly VIEW_REDRAW_MIN_INTERVAL_MS = 33;
    private static readonly VIEW_CULL_MARGIN_PX = 100;
    /** 视口内单位过多时，每帧最多绘制数量（分帧累积，仅 mapNeedsRedraw 批次） */
    private static readonly VIEW_DRAW_CHUNK = 42;
    private viewDrawBatch: IAnimatedUnit[] | null = null;
    private viewDrawBatchIdx = 0;
    private idlePollAccumulator = 0;
    private static readonly IDLE_POLL_INTERVAL_MS = 200;

    // [NEW] Visual Systems
    private projectileSystem: ProjectileRenderer;

    /** [2026-07-18] 攻城器械渐隐锚点：军团乘胜开拔后器械留在城下原地淡出（经纬度+冻结朝向） */
    private siegeGearAnchors = new Map<string, { lat: number; lng: number; dir: number }>();
    /** 航迹采样：unitId → 上次采样时的屏幕坐标（按屏幕距离判断是否推入新航迹点） */
    private navalTrailLast = new Map<string, { x: number; y: number }>();
    /** 航迹采样最小屏幕间距（px）：约 0.4 旗舰船身，太密会 40 点覆盖不足 8 艘总长 */
    private static readonly NAVAL_TRAIL_SAMPLE_PX = 16;
    /** [2026-08-27 §C 转向限速] 船的朝向平滑上一帧时刻：unitId → performance.now()（只船用，陆军不进这条路径） */
    private navalTurnTickMs = new Map<string, number>();
    /**
     * 船的最大转向角速度（度/秒）。旧实现是每帧 `diff * 0.2`：既与帧率耦合
     * （60fps 与 30fps 转得一样快），又允许 ~5 帧内掰头 90°——真船做不到，看着就是纸片打转。
     * 55°/s ≈ 90° 拐弯要 1.6 秒，配 16 向 + 残差微旋，转弯过程是连续扫过去的。
     * 只改渲染朝向，不动 Army 的位置与航速（行军时间、到达判定一点不受影响）。
     */
    private static readonly NAVAL_TURN_RATE_DEG_S = 55;
    /** 船朝向指数平滑时间常数（秒）：大角度由上面的角速度封顶主导，小角度靠它缓入，收尾不生硬 */
    private static readonly NAVAL_TURN_TAU_S = 0.30;
    /**
     * 双舰队野战「双鱼」机动（2026-08-31 按大航海时代4 的观感重做）。
     *
     * 🔴 改前是**旋转木马**：两队锁在同一椭圆的正对两端，角速度恒定且相同，
     *    于是彼此距离**永远不变** —— 没有对进、没有交错、没有拉开，只是绕圈。
     *    帆船海战最好看的恰恰是「抢上风 → 对进 → 舷侧交错 → 拉开重整」这个往复。
     *
     * 现在叠了三层，全是**渲染层**的闭式解（不积分、不存状态、不碰 Army 真坐标）：
     *   ① 风：每场战斗一个固定风向，顺风段角速度快、顶风段慢。
     *      两队处在椭圆相对两端，同一时刻必然一顺一顶 → **间距自己会呼吸**（±2×WIND_SWING）。
     *   ② 距离呼吸：半径按半周期缓慢涨缩，两队交替逼近到舷侧齐射距离再拉开。
     *   ③ 进动：整个交战椭圆缓慢转向，战场是「漂着打」而不是原地转圈。
     *
     * 半径 110×65 → **210×130**（主人要「移动范围大一点」），周期 8s → **17s**。
     *
     * 周期必须同步拉长，否则半径放大等于船速放大，帆船会变快艇。离线验算（`scratch/tune.mjs` 同款公式，
     * 60 秒逐帧采样）确认这组参数**保住了原来的航速手感、只把场地放大**：
     *
     * |            | 船速 px/s [最小,最大,均值] | 两队间距 px [最小,最大,均值] |
     * |------------|---------------------------|------------------------------|
     * | 改前 8s/110×65 | [54, 92, **75**]      | [130, 220, 178]（恒定绕圈）  |
     * | 现在 17s/210×130 | [43, 123, **72**]   | [218, 480, **335**]（会呼吸）|
     *
     * 均速 72 vs 75 基本持平；场地约 1.9 倍；间距摆幅从 1.7 倍拉到 2.2 倍 = 对进/拉开看得出来。
     * 同时验了**角度单调**：60 秒内倒车帧数 = 0（A<1 的数学保证，改参数后请重跑这条）。
     */
    private static readonly NAVAL_FIELD_ORBIT_PERIOD_SEC = 17;
    private static readonly NAVAL_FIELD_ORBIT_RX_PX = 210;
    private static readonly NAVAL_FIELD_ORBIT_RY_PX = 130;
    private static readonly NAVAL_FIELD_SLOT_PHASE_RAD = 0.34;
    /**
     * 风致角速度摆幅（弧度）。相位写成 `ωt + A·sin(ωt - 风向)`，
     * 角速度 = ω(1 + A·cos(...))，**A<1 就保证单调**（不会倒车）。
     * 两队间距因此在 π ± 2A 之间摆：0.30 → ±34°，一逼一离看得清但不至于脱节。
     */
    private static readonly NAVAL_FIELD_WIND_SWING = 0.24;
    /** 距离呼吸幅度（半径的比例）：0.20 = 最近 0.8R、最远 1.2R，交错时明显贴近 */
    private static readonly NAVAL_FIELD_RANGE_SWING = 0.16;
    /** 交战椭圆进动角速度（弧度/秒）：3°/s，30 秒转 90°，战场缓慢漂移不显得原地打转 */
    private static readonly NAVAL_FIELD_PRECESS_RAD_S = 3 * Math.PI / 180;
    /** 航迹采样步长（秒）：18 点 × 0.13s ≈ 2.3 秒尾迹，与改前时长一致 */
    private static readonly NAVAL_FIELD_TRAIL_STEP_SEC = 0.13;
    /**
     * [2026-08-04] 攻城外推量平滑缓存：unitId → { push px, 背离城单位方向 }。
     * 开战/停火/城缩回时目标外推量突变，直接套用 = 渲染瞬移（主人红线）。
     * 按真实时间常数向目标逼近；离战仍用缓存方向把 push 收到 0，避免「突然弹回逻辑点」。
     */
    private siegePushCache = new Map<string, { push: number; nx: number; ny: number }>();
    /**
     * [2026-08-10 野战出场对齐·三国群英传式] 野战参战军团对位缓存（key = unit.id）：
     * aligned = 本军团对位渲染点（屏幕）、enemy = 对方军团对位渲染点、mid = 战场中点。
     * 每帧 animate 开头清空重算（两军位置会变）；同帧内 renderUnit → draw(getSquadOffsets)
     * → BattleSceneLayer.tick 三处读的是同一个本帧值。
     */
    private fieldSceneAlignCache = new Map<string, {
        aligned: L.Point; enemy: L.Point; mid: L.Point;
    }>();
    /**
     * [2026-08-31] 双鱼机动的**每帧**战场几何缓存（键 = 战场对象本身）。
     * 存的是与「哪艘船」无关的量：中点、双方中心、基准角、初始半间距。
     * 每帧 animate 开头清空，与 fieldSceneAlignCache 同规矩。
     */
    private navalFieldGeomCache = new Map<any, {
        center: L.Point; baseAngle: number; initialHalfSeparation: number;
    }>();
    /** 本帧 animate 的 dt（ms），供外推时间基 lerp；无则退回 16.7 */
    private frameDeltaMs = 1000 / 60;
    /** 外推指数逼近时间常数（ms）：约 0.13s 收到 ~90%（与原「每帧 25%@60fps」同量级，且不跟帧率绑） */
    private static readonly SIEGE_PUSH_LERP_TAU_MS = 56;
    private static readonly SIEGE_PUSH_EPS_PX = 0.5;

    /** [2026-08-04] 攻城视觉外推：跟拍放大态各城型统一为「原图1024×0.4@zoom10」屏幕宽；
     *  非跟拍不放大，按平时城型底宽。图 4:3。阵心对齐图片边缘。只动渲染。 */
    private static readonly CITY_ICON_HW_RATIO = CITY_ART_NATIVE_HEIGHT_PX / CITY_ART_NATIVE_WIDTH_PX;

    /**
     * 攻城团复制偏移（单位 = 攻城间距格，随军团 direction 一起旋转）。
     *
     * 一个「攻城团」= 5 件器械（冲车 ×1 / 井阑 ×2 / 投石 ×2）。
     * 团在阵内的占位约：横向 ±1.7（井阑最外）、纵向 -2.0 ~ +1.9（冲车最前 ~ 投石最后）。
     *
     * - 非战斗场景（zoom13 以外）：返回单个 {0,0} → 与改动前逐像素一致，其他层级不受影响。
     * - zoom13 战斗场景：返回 4 个偏移 → 4 个攻城团（2×2 排布，团间留约 1.4 格缝）。
     *
     * 想改 4 个团的疏密，只调这里的 GX / GY，不要动器械自身的 posOffset（那张表全 zoom 共用）。
     */
    private static getSiegeGroupOffsets(
        unit: IAnimatedUnit,
        directionIndex: number,
        siegeScale: number,
    ): readonly { x: number; y: number }[] {
        const sceneActive = GlobalUnitRenderer.isBattleScene13();
        if (!sceneActive) return GlobalUnitRenderer.SIEGE_GROUP_SINGLE;

        // 与 LegionPhalanxDrawer.draw 同一套资源 id 归一（不同 id → 不同 refSprite → 间距对不上）
        const rawType = unit.legionType || 'mixed';
        const assetsId: LegionType =
            rawType === 'cavalry' || rawType === 'archer_cavalry' || rawType === 'mixed' || rawType === 'infantry'
                ? rawType
                : 'mixed';

        const sp = LegionPhalanxDrawer.getDenseSquadSpacing(
            assetsId,
            unit.legionType || 'infantry',
            directionIndex,
            siegeScale,
            unit.cultureScales || null,
        );
        // 资源未就绪：退回单团原行为，不自己猜数值
        if (!sp) return GlobalUnitRenderer.SIEGE_GROUP_SINGLE;

        // 「井」字四个交叉点 = 3×3 格位的四个格缝中心 = 相对阵心 ±0.5 格
        const hx = sp.x * 0.5;
        const hy = sp.y * 0.5;
        return [
            { x: -hx, y: -hy }, { x: +hx, y: -hy },
            { x: -hx, y: +hy }, { x: +hx, y: +hy },
        ];
    }

    private static readonly SIEGE_GROUP_SINGLE: readonly { x: number; y: number }[] = [{ x: 0, y: 0 }];

    // [OPTIMIZATION] Static preload to start loading assets before Map exists
    private static assetsPromise: Promise<void> | null = null;
    private static assetsLoaded: boolean = false;

    public static async preloadAssets(): Promise<void> {
        if (this.assetsPromise) return this.assetsPromise;

        gameLog('startup', '🔄 GlobalUnitRenderer: Starting Static Preload...');

        this.assetsPromise = Promise.all([
            PlayerPhalanxDrawer.preload(),
            LegionPhalanxDrawer.preload(),
            LegionFlagDrawer.preload(),
            BanditDrawer.preload()
        ]).then(() => {
            this.assetsLoaded = true;
            gameLog('startup', '🎨 GlobalUnitRenderer: Assets Ready (Static Preload Complete)');
        });

        return this.assetsPromise;
    }

    constructor(gameMap: GameMap) {
        this.map = gameMap.getLeafletMap();

        // 1. Initialize High Canvas (Standard)
        this.canvas = this.createCanvas();
        this.ctx = this.canvas.getContext('2d')!;
        this.setupPane(MAP_PANES.UNITS, MAP_LAYER_ZINDEX.UNITS, this.canvas);

        // 2. Initialize Low Canvas (Siege)
        this.canvasLow = this.createCanvas();
        this.ctxLow = this.canvasLow.getContext('2d')!;
        this.setupPane(MAP_PANES.UNITS_LOW, MAP_LAYER_ZINDEX.UNITS_LOW, this.canvasLow);

        // Bind events
        const resetViewDrawBatch = () => {
            this.viewDrawBatch = null;
            this.viewDrawBatchIdx = 0;
        };
        const onMapViewChange = () => {
            this.updateCanvasPosition();
            resetViewDrawBatch();
            const now = performance.now();
            if (now - this.lastViewRedrawAt >= GlobalUnitRenderer.VIEW_REDRAW_MIN_INTERVAL_MS) {
                this.lastViewRedrawAt = now;
                this.pendingViewRedraw = false;
                this.mapNeedsRedraw = true;
            } else {
                this.pendingViewRedraw = true;
            }
        };
        const flushViewRedraw = () => {
            this.updateCanvasPosition();
            resetViewDrawBatch();
            this.pendingViewRedraw = false;
            this.lastViewRedrawAt = performance.now();
            this.mapNeedsRedraw = true;
        };
        this.map.on('move', onMapViewChange);
        this.map.on('zoom', onMapViewChange);
        this.map.on('moveend', flushViewRedraw);
        this.map.on('zoomend', flushViewRedraw);
        this.map.on('resize', this.resizeCanvas.bind(this));

        // Initial setup
        this.resizeCanvas();
        this.updateCanvasPosition();

        // [NEW] Projectile System (Arrows)
        this.projectileSystem = new ProjectileRenderer(this.map);

        // Ensure assets are loaded (if not already called via static preload)
        if (!GlobalUnitRenderer.assetsPromise) {
            GlobalUnitRenderer.preloadAssets();
        }

        // Wait for preload to finish then start
        GlobalUnitRenderer.assetsPromise!.then(() => {
            this.start();        });

        gameLog('startup', '🎨 GlobalUnitRenderer initialized');
    }

    private createCanvas(): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.style.pointerEvents = 'none';
        canvas.className = 'leaflet-zoom-animated';
        return canvas;
    }

    private setupPane(paneName: string, zIndex: number, canvas: HTMLCanvasElement): void {
        if (!this.map.getPane(paneName)) {
            this.map.createPane(paneName);
            const pane = this.map.getPane(paneName);
            if (pane) {
                pane.style.zIndex = zIndex.toString();
                pane.style.pointerEvents = 'none'; // Click-through
            }
        }
        const pane = this.map.getPane(paneName) || this.map.getPanes().overlayPane;
        pane.appendChild(canvas);
    }

    public register(unit: IAnimatedUnit): void {
        this.units.add(unit);
        this.needsSort = true;
        if (unit.id?.startsWith('army_editor_preview_')) {
            this.mapNeedsRedraw = true;
        }
        // [OPTIMIZATION] Force next frame render
        this.start();
    }

    /** 军队预览编辑器：待机也需每帧绘制 */
    private hasArmyEditorPreview(): boolean {
        for (const unit of this.units) {
            if (unit.id?.startsWith('army_editor_preview_')) return true;
        }
        return false;
    }

    public unregister(unit: IAnimatedUnit): void {
        const id = unit.id;
        if (id) {
            this.unitFightingStates.delete(id);
            LegionPhalanxStateManager.dispose(id);
            LegionPhalanxDrawer.disposeUnit(id); // 注销：方阵 + 攻城器械状态全清
            this.siegeGearAnchors.delete(id);
            this.siegePushCache.delete(id); // 外推量平滑缓存随单位注销清理
            this.navalSpeedTrack.delete(id); // 船速跟踪随舰队注销清理
        }
        this.units.delete(unit);
        this.needsSort = true;
    }

    private resizeCanvas(): void {
        const size = this.map.getSize();
        this.canvas.width = size.x;
        this.canvas.height = size.y;
        this.canvasLow.width = size.x;
        this.canvasLow.height = size.y;
        this.updateCanvasPosition();
        this.needsSort = true;
        this.viewDrawBatch = null;
        this.viewDrawBatchIdx = 0;
        this.mapNeedsRedraw = true;
    }

    private isUnitInContainerView(unit: IAnimatedUnit): boolean {
        // [2026-08-09 13裁剪·第二处] 13 场景参战军团直接放行：它们的绘制位置由场景决定
        // （攻城外推 750px + 编队推进 530px），逻辑坐标已与画面解耦——镜头每帧对准渲染位置，
        // 逻辑位置必然甩出屏幕；拿逻辑坐标裁剪必误杀整军（主人实锤攻方消失，第一处修复根本没被执行到）。
        // 场景外 Set 恒空 → has 恒 false → 原判据一字不动（8/9/10 性能不受影响）。
        if (this.battleSceneCombatantIds.has(unit.id ?? '')) return true;
        const pos = unit.getPosition();
        if (!isValidMapCoord(pos)) return false;
        const pt = this.map.latLngToContainerPoint([pos.lat, pos.lng]);
        const m = GlobalUnitRenderer.VIEW_CULL_MARGIN_PX;
        const w = this.canvas.width;
        const h = this.canvas.height;
        return pt.x >= -m && pt.x <= w + m && pt.y >= -m && pt.y <= h + m;
    }

    /** [2026-08-09 13裁剪·第二处] 13 场景参战单位 id 集合（跟拍军团 + 对手；每帧刷新） */
    private battleSceneCombatantIds = new Set<string>();

    /** 刷新参战集合：仅 13 场景收集（活跃攻城/野战/1v1 的攻守双方），其余清空 */
    private refreshBattleSceneCombatants(): void {
        this.battleSceneCombatantIds.clear();
        if (!this.isBattleScene13()) return;
        const game = (window as any).game;
        const fields: any[] = game?.combatSystem?.getActiveBattleFields?.() ?? [];
        for (const f of fields) {
            for (const u of (f?.getAttackerUnits?.() ?? [])) if (u?.id) this.battleSceneCombatantIds.add(u.id);
            for (const u of (f?.getDefenderUnits?.() ?? [])) if (u?.id) this.battleSceneCombatantIds.add(u.id);
        }
        const battles: any[] = game?.combatSystem?.getActiveBattles?.() ?? [];
        for (const b of battles) {
            if (b?.attacker?.id) this.battleSceneCombatantIds.add(b.attacker.id);
            if (b?.defender?.id) this.battleSceneCombatantIds.add(b.defender.id);
        }
    }

    /** 视口内可见单位（已做屏幕裁剪 + 战略视野技判定） */
    private collectVisibleUnitsInView(): IAnimatedUnit[] {
        // [2026-08-09 13裁剪·第二处] 每帧刷新参战集合（13 场景攻守双方放行裁剪）
        this.refreshBattleSceneCombatants();
        // [2026-08-11 13 v2] 出兵口互攻演出接管：地图上**任何军团都不画**（参战 + 非参战全跳过，
        // 只留冻结地图背景：城池/地形/道路）。全部精灵由 Scene13WarLayer 全屏画布负责——
        // 主人实锤「13 战斗模式还显示之前大战略的军团」（薛仁贵天山飞骑 28500 出现在背景）。
        // 8/9/10 永不进此分支（演出只在 13 激活）。
        const warActive = (window as any).game?.scene13War?.isActive?.() === true;
        // [2026-08-16 修·残局待命闪军团] 战斗结束后的 5 秒残局（battleScene.isLingering）同样保持纯背景，
        // 否则大地图军团以 zoom10 样式叠在 13 待命画面上（主人实锤）。
        const lingering = (window as any).game?.battleScene?.isLingering?.() === true;
        if (this.map.getZoom() >= 13 && (warActive || lingering)) return [];
        const list: IAnimatedUnit[] = [];
        for (let i = 0; i < this.sortedUnitsCache.length; i++) {
            const unit = this.sortedUnitsCache[i];
            // 阵亡尸体必须画出（神出鬼没等可能在 destroy 前把 visible 关掉）
            if ((unit as any).visible === false && !unit.isDestroyed) continue;
            if (!isValidMapCoord(unit.getPosition())) continue;
            if (!this.isUnitInContainerView(unit)) continue;
            list.push(unit);
        }
        return list;
    }

    private updateCanvasPosition(): void {
        const topLeft = this.map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this.canvas, topLeft);
        L.DomUtil.setPosition(this.canvasLow, topLeft);
    }

    public start(): void {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.animate.bind(this));
    }

    public stop(): void {
        this.isRunning = false;
    }

    public setShowLabels(visible: boolean): void {
        this.showLabels = visible;
    }

    // [NEW] Toggle specific unit visibility by ID
    public toggleUnitVisibility(unitId: string, visible: boolean): void {
        // Find unit in Set
        for (const unit of this.units) {
            if (unit.id === unitId) {
                (unit as any).visible = visible;
                this.needsSort = true;
                return;
            }
        }
        console.warn(`⚠️ [GlobalUnitRenderer] Unit not found for visibility toggle: ${unitId}`);
    }

    /** 强制下一帧重绘（状态变更但无动画驱动时，避免旧帧残留） */
    public invalidateView(): void {
        this.mapNeedsRedraw = true;
    }

    // [OPTIMIZATION]
    // Track if any unit is moving or animating to decide if we need to redraw
    private lastFrameDrawMs = 0;
    /** 本帧实际调用 renderUnit 的次数（PerfDoctor 归因用：区分「军团多」还是「单支慢」） */
    private lastFrameDrawnUnits = 0;

    public getLastFrameDrawMs(): number {
        return this.lastFrameDrawMs;
    }

    public getUnitCount(): number {
        return this.units.size;
    }

    /** 据点 / 脚本：从一点向另一点齐射箭矢（复用军团箭矢渲染） */
    public spawnProjectileVolley(
        from: L.LatLngExpression,
        to: L.LatLngExpression,
        options?: {
            count?: number;
            spreadFactor?: number;
            staggerMs?: number;
            durationMs?: number;
            type?: 'arrow' | 'stone' | 'fire' | 'cannon';
        }
    ): void {
        this.projectileSystem.spawnVolley(L.latLng(from), L.latLng(to), options);
    }


    /**
     * [2026-08-09 13锁死] 战斗场景视觉生效判定：仅当场景激活 **且 zoom 已到 13**。
     * flyTo(13) 是 1.6s 动画，途中 zoom 10–12 不得展开 9 编队 / 禁箭 / 强制待命 /
     * 画守军 / 编队推进——13 战斗模式与其他 zoom 完全隔离（主人铁律，非 13 保持原样）。
     *
     * [2026-08-11 13 v2] 出兵口互攻演出激活时返回 false：旧剧本法 13 分支（编队展开/
     * 剧本走位/守军 9 编队）整体停用，背景军团退回普通渲染——13 演出完全替换旧剧本法，
     * 避免地图上旧编队与新演出画布叠加。8/9/10 永不进此分支（演出只在 13 激活）。
     */
    private isBattleScene13(): boolean {
        const game = (window as any).game;
        if (game?.battleScene?.isActive?.() !== true) return false;
        if (game?.scene13War?.isActive?.() === true) return false;
        // [2026-08-12 修复] 防止 5 秒战败停留期间（新演出已停、但大地图仍锁在 zoom13 时），
        // 引擎误判定并把旧 13 模式的幽灵方阵给放出来乱跑。
        if (game?.battleScene?.isLingering?.() === true) return false;
        return this.map.getZoom() >= 13;
    }

    /**
     * [2026-08-09 13锁死] 静态版判定（static 方法无 this.map，走 window.gameMap）。
     */
    private static isBattleScene13(): boolean {
        const game = (window as any).game;
        if (game?.battleScene?.isActive?.() !== true) return false;
        if (game?.scene13War?.isActive?.() === true) return false;
        if (game?.battleScene?.isLingering?.() === true) return false;
        const zoom = (window as any).gameMap?.getLeafletMap?.().getZoom?.() ?? 0;
        return zoom >= 13;
    }

    private animate(time: number): void {
        if (!this.isRunning) return;

        // [2026-08-09 编队独立移动] 场景退出/非激活 → 清空编队推进状态，防下次战斗残留
        const sceneActiveNow = (window as any).game?.battleScene?.isActive?.() === true;
        const scene13ReadyNow = this.isBattleScene13();
        // [2026-08-10 战线时间轴] 必须从 zoom 真正到 13、编队首次可见时才开始计时。
        // battleScene.active 在 flyTo(13) 开始前就已置 true；若从 active 时计时，1.6s 飞入动画/
        // 后台节流/首帧加载会提前吃掉列阵期，第一帧可见时 charge 已推进甚至封顶，攻守看起来
        // 就是「刚一开战已经交叉」。zoom<13 时保持 0，保证首个 13 帧一定从列阵原位开始。
        if (scene13ReadyNow && this.battlePhaseStart === 0) {
            this.battlePhaseStart = Date.now();
        } else if (!scene13ReadyNow) {
            this.battlePhaseStart = 0;
        }
        if (!sceneActiveNow && this.squadMoveState.size > 0) {
            this.squadMoveState.clear();
            // [2026-08-10 统一战斗核心] 目标锁同清（防跨战斗残留）
            this.squadTargetLock.clear();
            // [2026-08-09 编队级阵亡] 每编队兵力分配同清（防跨战斗残留）
            this.squadBaseTroops.clear();
            // [2026-08-10 阵亡单调] 最大损失同清（防跨战斗残留）
            this.squadMaxLoss.clear();
        }
        // [2026-08-10 帧级共享认领] 渲染前清一次：本帧所有参战军团共用一套认领计数
        this.frameClaims.clear();
        // [2026-08-09 就近咬住·第二段] 帧戳自增（跨帧读取只认本帧/上一帧，陈旧条目自动失效）；
        // 场景退出一并清空，防下次战斗读到上一场的编队坐标。
        this.squadRegistryFrame++;
        if (!sceneActiveNow && this.squadPosRegistry.size > 0) {
            this.squadPosRegistry.clear();
        }
        // [2026-08-10 野战出场对齐] 每帧重算对位（两军位置会变，缓存只服务本帧内三处读取）；
        // 场景退出 size 归零，无残留
        if (this.fieldSceneAlignCache.size > 0) this.fieldSceneAlignCache.clear();
        // [2026-08-31] 双鱼机动的战场几何每帧只算一次：改前是**每艘船**都重算一遍
        // 双方中心点（8 艘船 = 同一组平均值算 8 遍），纯浪费。
        if (this.navalFieldGeomCache.size > 0) this.navalFieldGeomCache.clear();
        // [2026-08-10 临时诊断] 13 编队探针自动落盘（详见 recordScene13Probe 上方说明）
        this.flushScene13Probe();

        const pm = (window as any).perfMonitor;
        const frameStart = performance.now();
        pm?.noteCanvasFrameStart?.(frameStart);
        const endCanvasTiming = () => pm?.noteCanvasFrameEnd?.(performance.now());
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        // 夹紧异常大 dt（切后台回来），避免外推一步跳满
        this.frameDeltaMs = Math.max(0, Math.min(deltaTime || 1000 / 60, 100));
        // [2026-08-10 剧本法] 战斗时钟必须在 frameDeltaMs 算好之后推进，否则用的是上一帧的 dt
        this.tickScene13Clock();

        if (isMacroMapZoom(this.map.getZoom())) {
            if (this.canvas.width > 0 && this.canvas.height > 0) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctxLow.clearRect(0, 0, this.canvasLow.width, this.canvasLow.height);
            }
            endCanvasTiming();
            requestAnimationFrame(this.animate.bind(this));
            return;
        }

        // 1. Maintain Sorted Cache
        if (this.needsSort) {
            this.sortedUnitsCache = Array.from(this.units);
            this.needsSort = false;
            this.viewDrawBatch = null;
            this.viewDrawBatchIdx = 0;
        }

        // [PERF] Only sort when units are moving
        // Check if any unit moved since last frame by comparing positions
        let anyMoved = false;
        for (const unit of this.sortedUnitsCache) {
            if (unit.isMoving || unit.isAttacking) {
                anyMoved = true;
                break;
            }
        }
        if (anyMoved) {
            this.sortedUnitsCache.sort((a, b) => b.getPosition().lat - a.getPosition().lat);
        }

        let hasActiveAnimation = false;
        const corpseMs = GameConfig.LEGION.CORPSE_DISPLAY_MS;
        let hasVisibleCorpses = false;

        // 2. Check Loop - Update States（屏外且非动画中的单位跳过逻辑更新）
        for (let i = 0; i < this.sortedUnitsCache.length; i++) {
            const unit = this.sortedUnitsCache[i];
            if (unit.fadeOutStart !== undefined) {
                const duration = unit.fadeOutDurationMs ?? GameConfig.LEGION.DESPAWN_FADE_OUT_MS;
                if (Date.now() - unit.fadeOutStart <= duration && this.isUnitInContainerView(unit)) {
                    hasVisibleCorpses = true;
                }
                // 解散单位保持原地淡出；神出鬼没属于仍在行军的非战死渐隐，
                // 必须继续更新位移方向与 MOVE 动画，否则会以待命姿态滑行消失。
                if (unit.isDestroyed) continue;
            }
            if (unit.isDestroyed) {
                const t0 = unit.destroyTime ?? Date.now();
                if (!unit.destroyTime) unit.destroyTime = t0;
                // [PERF 2026-07-28] 必须判「在不在视口内」。
                // 原来只看时间：地图任意角落死一支军团，接下来整整 CORPSE_DISPLAY_MS(15s)
                // 全画布都在满帧重绘，哪怕镜头根本没看那边；战事密集时几乎等于常态重绘。
                // 屏外尸体不驱动重绘——镜头挪过去时 moveend/zoomend 会置 mapNeedsRedraw，
                // 该画的一帧不会漏。
                if (Date.now() - t0 <= corpseMs && this.isUnitInContainerView(unit)) {
                    hasVisibleCorpses = true;
                }
                continue;
            }

            const isVisible = (unit as any).visible !== false;
            const inView = isVisible && this.isUnitInContainerView(unit);
            const animating =
                unit.isMoving || unit.isAttacking || (unit as any).isBattling;

            if (isVisible && (inView || animating)) {
                this.updateUnitState(unit);
            }

            if (animating) {
                hasActiveAnimation = true;
            }
        }

        const projectilesActive = this.projectileSystem.hasActive();
        const hasArmyEditorPreview = this.hasArmyEditorPreview();
        // 外推收推未完成时必须继续重绘，否则 idle 跳帧会卡住半截再突然到位
        let hasSiegePushSmoothing = false;
        for (const e of this.siegePushCache.values()) {
            if (e.push > GlobalUnitRenderer.SIEGE_PUSH_EPS_PX) {
                hasSiegePushSmoothing = true;
                break;
            }
        }
        const shouldDraw =
            hasActiveAnimation ||
            projectilesActive ||
            this.mapNeedsRedraw ||
            this.pendingViewRedraw ||
            hasVisibleCorpses ||
            hasArmyEditorPreview ||
            hasSiegePushSmoothing;

        if (!shouldDraw) {
            this.idlePollAccumulator += deltaTime;
            if (this.idlePollAccumulator < GlobalUnitRenderer.IDLE_POLL_INTERVAL_MS) {
                endCanvasTiming();
                requestAnimationFrame(this.animate.bind(this));
                return;
            }
            this.idlePollAccumulator = 0;
            if (this.pendingViewRedraw) {
                this.mapNeedsRedraw = true;
            }
            endCanvasTiming();
            requestAnimationFrame(this.animate.bind(this));
            return;
        }

        this.idlePollAccumulator = 0;

        if (projectilesActive) {
            this.projectileSystem.update(deltaTime);
        }

        // 屏外单位不进 drawList，但仍要推进离战收推，否则半截 push 会冻住
        this.tickOffscreenSiegePushCaches();

        const visibleInView = this.collectVisibleUnitsInView();
        const useBatch =
            this.mapNeedsRedraw &&
            !hasActiveAnimation &&
            !projectilesActive &&
            visibleInView.length > GlobalUnitRenderer.VIEW_DRAW_CHUNK * 4;

        let drawList: IAnimatedUnit[];
        let clearBeforeDraw = true;

        if (useBatch) {
            if (!this.viewDrawBatch) {
                this.viewDrawBatch = visibleInView;
                this.viewDrawBatchIdx = 0;
            }
            const end = Math.min(
                this.viewDrawBatchIdx + GlobalUnitRenderer.VIEW_DRAW_CHUNK,
                this.viewDrawBatch.length,
            );
            drawList = this.viewDrawBatch.slice(this.viewDrawBatchIdx, end);
            this.viewDrawBatchIdx = end;
            clearBeforeDraw = this.viewDrawBatchIdx <= GlobalUnitRenderer.VIEW_DRAW_CHUNK;
            if (this.viewDrawBatchIdx < this.viewDrawBatch.length) {
                this.mapNeedsRedraw = true;
            } else {
                this.viewDrawBatch = null;
                this.viewDrawBatchIdx = 0;
                this.mapNeedsRedraw = false;
                this.pendingViewRedraw = false;
            }
        } else {
            this.viewDrawBatch = null;
            this.viewDrawBatchIdx = 0;
            drawList = visibleInView;
            this.mapNeedsRedraw = false;
            this.pendingViewRedraw = false;
        }

        if (clearBeforeDraw) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        const corpseFadeMs = GameConfig.LEGION.CORPSE_FADE_OUT_MS;
        let drawnUnits = 0;
        for (let i = 0; i < drawList.length; i++) {
            const unit = drawList[i];

            let corpseAlpha = 1;
            if (unit.fadeOutStart !== undefined) {
                const duration = unit.fadeOutDurationMs ?? GameConfig.LEGION.DESPAWN_FADE_OUT_MS;
                const age = Date.now() - unit.fadeOutStart;
                if (age >= duration) continue;
                corpseAlpha = Math.max(0, 1 - age / duration);
            } else if (unit.isDestroyed) {
                const t0 = unit.destroyTime ?? Date.now();
                if (!unit.destroyTime) unit.destroyTime = t0;
                const age = Date.now() - t0;
                if (age > corpseMs) {
                    continue;
                }
                // 最后 corpseFadeMs 内线性淡出
                if (corpseFadeMs > 0 && age > corpseMs - corpseFadeMs) {
                    corpseAlpha = Math.max(0, (corpseMs - age) / corpseFadeMs);
                }
            }

            drawnUnits++;
            if (corpseAlpha < 1) {
                const prevAlpha = this.ctx.globalAlpha;
                this.ctx.globalAlpha = prevAlpha * corpseAlpha;
                this.renderUnit(unit, this.ctx);
                this.ctx.globalAlpha = prevAlpha;
            } else {
                this.renderUnit(unit, this.ctx);
            }
        }
        this.lastFrameDrawnUnits = drawnUnits;

        // [2026-08-09 独立战斗场景] 攻城战守军 9 编队（城图边缘，面向攻方）：
        // 守方是 city 单位不注册渲染，须在此补画。仅场景激活时渲染，非 13 保持原样（守军不画士兵）。
        if (this.isBattleScene13()) {
            this.renderSiegeDefenders(this.ctx);
        }

        // [NEW] Draw Projectiles AFTER units
        const currentZoom = this.map.getZoom();
        const effectiveZoom = Math.min(currentZoom, 10);
        const scale = Math.pow(2, effectiveZoom - 9) * 0.7;

        // [2026-08-11 13 v2] 出兵口互攻演出接管：地图上不画箭矢特效（主人实锤「射箭的特效还在」）。
        // 背景军团已被 collectVisibleUnitsInView 过滤，箭矢是独立渲染链，必须同门控。
        // 演出画布（Scene13WarLayer）自己的精灵不带箭矢，13 期间地图保持纯背景。
        const warActiveNow = (window as any).game?.scene13War?.isActive?.() === true;
        // [2026-08-16 修·残局待命闪特效] lingering 期间箭矢特效同样不画（与军团门控一致）。
        const lingeringNow = (window as any).game?.battleScene?.isLingering?.() === true;
        if (!warActiveNow && !lingeringNow) {
            this.projectileSystem.draw(this.ctx, scale);
        }

        this.lastFrameDrawMs = performance.now() - frameStart;
        if (pm?.reportCount) {
            pm.reportCount('renderDrawMs', this.lastFrameDrawMs);
        }
        // [2026-09-03 查行军卡] 整帧绘制成本进 PerfDoctor（此前只进 perfMonitor，拿不到归因）。
        //   scanned = 本帧实际画了几支军团，用来区分「军团多」还是「单支画得慢」。
        if (import.meta.env.DEV) {
            perfDoctor.note('GlobalUnitRenderer.animate(绘制)', this.lastFrameDrawMs,
                'src/map/GlobalUnitRenderer.ts:animate', this.lastFrameDrawnUnits);
        }
        endCanvasTiming();

        requestAnimationFrame(this.animate.bind(this));
    }

    private updateUnitState(unit: IAnimatedUnit): void {
        // [FIX] Initialize random direction if undefined to prevent NaN angle in naval volleys
        if (unit.lastDirection === undefined) {
            unit.lastDirection = Math.floor(Math.random() * 8);
        }

        // 战斗结束：胜军清方阵战损格；阵亡军须留尸体（对齐水军 drawNaval 对 DEATH 不 reset）
        const id = unit.id || 'unknown';
        const isFighting = unit.currentBattleType !== null;
        const wasFighting = this.unitFightingStates.get(id) || false;

        if (wasFighting && !isFighting && !unit.isDestroyed) {
            // 只重置方阵/额外弓步状态；器械 Map 保留给战后 4s 渐隐
            LegionPhalanxDrawer.resetUnit(id);
        }
        this.unitFightingStates.set(id, isFighting);

        const currentPos = unit.getPosition();
        if (!isValidMapCoord(currentPos)) {
            // 坐标已坏：清掉射击目标，避免 L.latLng(NaN) 拖垮整页
            if (unit.targetPos && !isValidMapCoord(unit.targetPos)) unit.targetPos = null;
            return;
        }
        if (unit.targetPos && !isValidMapCoord(unit.targetPos)) {
            unit.targetPos = null;
        }

        // Check if unit is moving
        const last = unit.lastPosition;
        const posChanged = isValidMapCoord(last)
            && (Math.abs(currentPos.lat - last.lat) > 0.0001
                || Math.abs(currentPos.lng - last.lng) > 0.0001);

        if (unit.id?.startsWith('army_editor_preview_')) {
            // ArmyEditor strictly controls its own isMoving state
        } else {
            if (posChanged) unit.isMoving = true;
            else unit.isMoving = false; // Or let unit decide.
        }

        // [NEW] Projectile Spawner Logic
        // If attacking AND is ranged/mixed AND has target
        // [2026-08-10 主人纠正] 13 场景不禁箭矢——远程编队攻击照常发射（旧的
        // sceneActiveNoArrows 禁用门是 AI 擅自加的，主人从未要求，已删）。
        // [2026-08-30 海战演出] 海军走独立对射（炮弹+箭矢打敌舰），不走下方陆战箭矢（射中心点会糊成对空）。
        if (unit.isAttacking && unit.isOnSea) {
            this.fireNavalProjectile(unit, currentPos);
        } else if (unit.isAttacking && isValidMapCoord(unit.targetPos)) {
            const lType = unit.legionType || 'infantry';
            const hasRangedSlots = ((unit as any).cultureSlots as string[] | undefined)?.some(
                (s) => s === 'archer' || s === 'crossbow' || s === 'ballista' || s.includes('archer')
            );
            const isRanged = hasRangedSlots || lType.includes('archer') || lType === 'mixed' || lType === 'infantry';

            if (isRanged) {
                const now = Date.now();
                // [USER REQUEST] Faster frequency (1000ms instead of 2000ms)
                if (!unit.lastShotTime || now - unit.lastShotTime > 1000) {
                    // Random offset to de-sync armies
                    if (!unit.lastShotTime) unit.lastShotTime = now - Math.random() * 1000;

                    if (now - unit.lastShotTime > 1000) {
                        // FIRE!
                        // [USER REQUEST] "Side-by-side lines" (Spread)

                        const startJitterLat = (Math.random() - 0.5) * 0.002;
                        const startJitterLng = (Math.random() - 0.5) * 0.002;

                        // [USER REQUEST] Adjust vertical position (Height Offset)
                        // Unit anchor is at FEET (0.9). We need arrows to spawn from CHEST/HEAD.
                        // Universal offset applied to all directions.
                        // 0.035 Lat is approx "Mid-Body" height visually at Zoom 9.
                        let BODY_HEIGHT_OFFSET = 0.035;

                        // [USER REQUEST] "SW/SE still too low" -> Add extra offset for these
                        if (unit.lastDirection === 1 || unit.lastDirection === 7) {
                            BODY_HEIGHT_OFFSET += 0.02; // Total ~0.055
                        }

                        const baseStart = L.latLng(
                            currentPos.lat + startJitterLat + BODY_HEIGHT_OFFSET,
                            currentPos.lng + startJitterLng
                        );
                        // 计算目标城池的视觉中心高程偏置与四位偏置
                        let targetLat = unit.targetPos.lat;
                        let targetLng = unit.targetPos.lng;
                        
                        // 若攻击目标为城池（攻城战），施加城墙主体视觉高度偏置
                        if ((unit as any).isSiegeAttacker || unit.currentBattleType === 'siege') {
                            const cityId = (unit as any).targetCityId || (unit as any).targetId;
                            const targetCity = cityId ? (window as any).game?.cityManager?.getCity?.(cityId) : null;
                            
                            let cityHeightOffset = 0.018; // 默认小城
                            if (targetCity) {
                                if (targetCity.type === 'big_city') cityHeightOffset = 0.038;
                                else if (targetCity.type === 'medium_city') cityHeightOffset = 0.028;
                                else if (targetCity.type === 'pass') cityHeightOffset = 0.026;
                                else cityHeightOffset = 0.020;
                            }
                            
                            // 沿着进攻方向向量，将落点引导至近侧城墙，防穿透落到背山处
                            const dLat = targetLat - currentPos.lat;
                            const dLng = targetLng - currentPos.lng;
                            const len = Math.hypot(dLat, dLng) || 0.001;
                            
                            targetLat = targetLat + cityHeightOffset - (dLat / len) * 0.006;
                            targetLng = targetLng - (dLng / len) * 0.006;
                        }

                        const baseEnd = L.latLng(targetLat, targetLng);

                        this.projectileSystem.spawnVolley(baseStart, baseEnd, { count: 5, spreadFactor: 0.025 });

                        // 攻城方额外发射石弹（投石机）
                        if ((unit as any).isSiegeAttacker && unit.currentBattleType === 'siege') {
                            setTimeout(() => {
                                this.projectileSystem.spawnVolley(baseStart, baseEnd, {
                                    count: 2,
                                    spreadFactor: 0.04,
                                    durationMs: 600,
                                    staggerMs: 400,
                                    type: 'stone',
                                });
                            }, 400); // 延迟发射，使箭雨和投石有先后层次感
                        }

                        unit.lastShotTime = now;
                    }
                }
            }
        }
    }

    /**
     * 🔴 [2026-09-04 主人定] 非双将不进入海战模式：查 unit 所在战斗是否攻守双方都有武将（双将战）。
     * 与 getNavalFieldBattlePose 里的字段级闸门同口径；单独成方法是因为对射闸门必须放在
     * fireNavalProjectile 入口（findNavalEnemy 的 targetPos 兜底会绕过字段级闸门，非双将仍会开火）。
     */
    private isDualGeneralBattle(unit: IAnimatedUnit): boolean {
        const fields: any[] = (window as any).game?.combatSystem?.getActiveBattleFields?.() ?? [];
        for (const f of fields) {
            if (!f || f.isOver) continue;
            const units = [...(f.getAttackerUnits?.() ?? []), ...(f.getDefenderUnits?.() ?? [])];
            if (!units.some((u: any) => u?.id === unit.id)) continue;
            return !!f.bothSidesHaveGeneral?.();
        }
        return false;
    }

    /**
     * [2026-08-30 海战演出·档1] 海军野战对射。
     * 普通海战向敌舰位置射击；纯舰队野战则从双鱼机动的实时屏幕位置互射。
     * 炮弹（cannon，2.6s 节流对齐 naval_cannon_fire）+ 箭矢（arrow，1.2s 节流对齐
     * naval_arrow_fire）。纯视觉，不参与任何结算。
     */
    private fireNavalProjectile(unit: IAnimatedUnit, currentPos: { lat: number; lng: number }): void {
        // 🔴 [2026-09-04 主人定] 非双将不进入海战模式：对射演出只在攻守双方都有武将（双将战）时启用。
        if (!this.isDualGeneralBattle(unit)) return;
        const maneuver = this.getNavalFieldBattlePose(unit);
        const enemy = maneuver?.enemyLatLng ?? this.findNavalEnemy(unit, currentPos);
        if (!enemy) return;
        const id = unit.id || 'unknown';
        const now = Date.now();

        const startPos = maneuver?.latLng ?? currentPos;
        const start = L.latLng(startPos.lat, startPos.lng);
        const end = L.latLng(enemy.lat, enemy.lng);

        // 🔴 [2026-09-02] 开什么火按船的武器表走，判据是「先史实、再 DE 本体」，见
        //    NavalShipTiers.getNavalWeapons。箭是所有船都有的基础层。
        const shipAsset = unit.navalShipAssetLock ?? getCultureNavalShip(null, unit.factionId);
        const weapons = getNavalWeapons(shipAsset, unit.factionId);
        const hasCannon = weapons.includes('cannon');

        // 火炮：2.6s 节流（与 drawNaval 内 naval_cannon_fire 同频，音画同步）
        if (hasCannon
            && (!maneuver || maneuver.broadsideReady)
            && now - (this.navalCannonAt.get(id) ?? 0) >= 2600) {
            this.navalCannonAt.set(id, now);
            this.projectileSystem.spawnVolley(start, end, {
                count: 2,
                spreadFactor: 0.03,
                staggerMs: 150,
                durationMs: 700,
                type: 'cannon',
                naval: true,
            });
        }
        // 抛石重器：3.4s 一轮，比炮慢 —— 绞盘上弦的抛石机本来就比炮慢。石弹一样会砸出水花。
        if (weapons.includes('trebuchet')
            && (!maneuver || maneuver.broadsideReady)
            && now - (this.navalStoneAt.get(id) ?? 0) >= 3400) {
            this.navalStoneAt.set(id, now);
            this.projectileSystem.spawnVolley(start, end, {
                count: 1,
                spreadFactor: 0.035,
                durationMs: 900,
                type: 'stone',
                naval: true,
            });
        }
        // 希腊火 / 喷火：1.6s 一轮，近距连发，没有炮声
        if (weapons.includes('greekfire')
            && now - (this.navalGreekFireAt.get(id) ?? 0) >= 1600) {
            this.navalGreekFireAt.set(id, now);
            this.projectileSystem.spawnVolley(start, end, {
                count: 3,
                spreadFactor: 0.05,
                staggerMs: 90,
                durationMs: 480,
                type: 'fire',
                naval: true,
            });
        }
        // 箭雨：1.2s 节流（与 naval_arrow_fire 同频）。没有重武器的船靠箭撑场面，射得更密。
        if (now - (this.navalArrowAt.get(id) ?? 0) >= 1200) {
            this.navalArrowAt.set(id, now);
            const heavy = hasCannon || weapons.includes('trebuchet');
            this.projectileSystem.spawnVolley(start, end, {
                count: heavy ? 3 : 5,
                spreadFactor: heavy ? 0.04 : 0.05,
                staggerMs: heavy ? 60 : 45,
                durationMs: 520,
                type: 'arrow',
                naval: true,
            });
        }
    }

    /**
     * 仅“field 野战 + 攻守双方当前存活单位全部为海军”启用的双鱼机动。
     * 只返回渲染坐标与切线航向，不写 Army 真实坐标，不参与胜负、战损或碰撞。
     */
    private getNavalFieldBattlePose(unit: IAnimatedUnit): NavalFieldBattlePose | null {
        if (this.isBattleScene13()
            || !unit.isAttacking
            || unit.currentBattleType !== 'field'
            || !unit.isOnSea
            || !unit.id) {
            return null;
        }

        const fields: any[] = (window as any).game?.combatSystem?.getActiveBattleFields?.() ?? [];
        for (const field of fields) {
            if (!field || field.isOver || field.type !== 'field') continue;
            const attackers: any[] = field.getAttackerUnits?.() ?? [];
            const defenders: any[] = field.getDefenderUnits?.() ?? [];
            if (attackers.length === 0 || defenders.length === 0) continue;

            const entityOf = (battleUnit: any): any => battleUnit?.getEntity?.() ?? battleUnit;
            const isFleet = (battleUnit: any): boolean => {
                const entity = entityOf(battleUnit);
                return entity?.isOnSea === true && entity?.isDestroyed !== true;
            };
            if (!attackers.every(isFleet) || !defenders.every(isFleet)) continue;

            // 🔴 [2026-09-04 主人定] 非双将不进入海战模式：海战演出（双鱼机动 + 对射）只在
            //    攻守双方都有武将（双将战）时启用，非双将的海战退回「舰队停点沉船」的旧样。
            if (!field.bothSidesHaveGeneral?.()) continue;

            const attackerIndex = attackers.findIndex((u) => u?.id === unit.id);
            const defenderIndex = defenders.findIndex((u) => u?.id === unit.id);
            if (attackerIndex < 0 && defenderIndex < 0) continue;

            const cachedGeom = this.navalFieldGeomCache.get(field);

            const averagePosition = (side: any[]): { lat: number; lng: number } | null => {
                let lat = 0, lng = 0, n = 0;
                for (const battleUnit of side) {
                    const pos = battleUnit?.getPosition?.();
                    if (!pos || !Number.isFinite(pos.lat) || !Number.isFinite(pos.lng)) continue;
                    lat += pos.lat;
                    lng += pos.lng;
                    n++;
                }
                return n > 0 ? { lat: lat / n, lng: lng / n } : null;
            };
            let center: L.Point, baseAngle: number, initialHalfSeparation: number;
            if (cachedGeom) {
                ({ center, baseAngle, initialHalfSeparation } = cachedGeom);
            } else {
                const attackerCenterLL = averagePosition(attackers);
                const defenderCenterLL = averagePosition(defenders);
                if (!attackerCenterLL || !defenderCenterLL) return null;
                center = this.map.latLngToContainerPoint([
                    (attackerCenterLL.lat + defenderCenterLL.lat) / 2,
                    (attackerCenterLL.lng + defenderCenterLL.lng) / 2,
                ]);
                const attackerCenter = this.map.latLngToContainerPoint([
                    attackerCenterLL.lat, attackerCenterLL.lng,
                ]);
                const defenderCenter = this.map.latLngToContainerPoint([
                    defenderCenterLL.lat, defenderCenterLL.lng,
                ]);
                initialHalfSeparation = Math.max(1, Math.hypot(
                    attackerCenter.x - defenderCenter.x,
                    attackerCenter.y - defenderCenter.y,
                ) / 2);
                baseAngle = Math.atan2(
                    attackerCenter.y - center.y,
                    attackerCenter.x - center.x,
                );
                this.navalFieldGeomCache.set(field, { center, baseAngle, initialHalfSeparation });
            }
            const zoomScale = Math.max(0.55, Math.pow(2, Math.min(10, this.map.getZoom()) - 10));
            const elapsed = Number.isFinite(field.elapsed) ? Math.max(0, field.elapsed) : 0;
            const deployBlend = Math.min(1, elapsed / 1.2);
            const targetRx = GlobalUnitRenderer.NAVAL_FIELD_ORBIT_RX_PX * zoomScale;
            const targetRy = GlobalUnitRenderer.NAVAL_FIELD_ORBIT_RY_PX * zoomScale;
            const baseRx = initialHalfSeparation + (targetRx - initialHalfSeparation) * deployBlend;
            const baseRy = initialHalfSeparation + (targetRy - initialHalfSeparation) * deployBlend;
            const isAttacker = attackerIndex >= 0;
            const ownIndex = isAttacker ? attackerIndex : defenderIndex;
            const ownSide = isAttacker ? attackers : defenders;
            const enemySide = isAttacker ? defenders : attackers;
            const slot = ownIndex - (ownSide.length - 1) / 2;
            const enemyIndex = Math.min(ownIndex, enemySide.length - 1);
            const enemySlot = enemyIndex - (enemySide.length - 1) / 2;

            const omega = Math.PI * 2 / GlobalUnitRenderer.NAVAL_FIELD_ORBIT_PERIOD_SEC;
            // 每场战斗一个**固定**风向：用交战轴 baseAngle 派生，同一场每帧一致、不同场各异。
            // 不用随机数——随机数每帧都变，风向会抖。
            const windDir = baseAngle + 2.4;

            /**
             * 某一侧、某个位次、在 tSec 时刻的屏幕位置。
             * 全部由 tSec 闭式算出，所以尾迹只要代入过去的时刻就**天然贴合航线**
             * （改前是拿「角度减一点」近似过去位置，公式一复杂就对不上了）。
             */
            const poseAt = (tSec: number, attackerSide: boolean, sideSlot: number): L.Point => {
                const sideOffset = attackerSide ? 0 : Math.PI;
                // ① 风：顺风快、顶风慢。两队相差 π，同一时刻必然一顺一顶 → 间距自己呼吸。
                const windTerm = GlobalUnitRenderer.NAVAL_FIELD_WIND_SWING
                    * Math.sin(omega * tSec + sideOffset - windDir);
                // ③ 进动：整个交战椭圆缓慢转向
                const angle = baseAngle
                    + GlobalUnitRenderer.NAVAL_FIELD_PRECESS_RAD_S * tSec
                    + omega * tSec + sideOffset + windTerm
                    + sideSlot * GlobalUnitRenderer.NAVAL_FIELD_SLOT_PHASE_RAD;
                // ② 距离呼吸：半周期涨缩，逼近到齐射距离再拉开
                const breathe = 1 + GlobalUnitRenderer.NAVAL_FIELD_RANGE_SWING
                    * Math.sin(omega * tSec * 0.5 + windDir);
                const rx = (baseRx + Math.abs(sideSlot) * 18 * zoomScale) * breathe;
                const ry = (baseRy + Math.abs(sideSlot) * 10 * zoomScale) * breathe;
                return L.point(center.x + Math.cos(angle) * rx, center.y + Math.sin(angle) * ry);
            };

            const point = poseAt(elapsed, isAttacker, slot);
            const enemyPoint = poseAt(elapsed, !isAttacker, enemySlot);
            // 航向用**数值微分**：公式再叠几层也不会像手推切线那样算错。
            const ahead = poseAt(elapsed + 0.08, isAttacker, slot);
            const tangentX = ahead.x - point.x;
            const tangentY = ahead.y - point.y;
            const tangentLen = Math.max(0.001, Math.hypot(tangentX, tangentY));
            const ll = this.map.containerPointToLatLng(point);
            const llAhead = this.map.containerPointToLatLng(ahead);
            const enemyLL = this.map.containerPointToLatLng(enemyPoint);
            // 🔴 [2026-09-01] 航向直接用屏幕切线（罗盘制：北=0 顺时针；屏幕 y 向下所以取 -tangentY）。
            //    改前是 point→latLng→atan2(dLng,dLat)，把已经正确的屏幕角又折回经纬度，白白吃一次 Mercator 误差。
            const headingRad = Math.atan2(tangentX, -tangentY);

            const enemyX = enemyPoint.x - point.x;
            const enemyY = enemyPoint.y - point.y;
            const enemyLen = Math.max(0.001, Math.hypot(enemyX, enemyY));
            const forwardDot = (tangentX * enemyX + tangentY * enemyY) / (tangentLen * enemyLen);

            const trail: { x: number; y: number }[] = [];
            for (let k = 18; k >= 1; k--) {
                const p = poseAt(
                    Math.max(0, elapsed - k * GlobalUnitRenderer.NAVAL_FIELD_TRAIL_STEP_SEC),
                    isAttacker, slot,
                );
                trail.push({ x: p.x, y: p.y });
            }

            // 🔴 [2026-09-02] 轨道瞬时航速：ll → llAhead 正好相隔 0.08 单位时间（航向就是这么微分出来的），
            //    直接量出世界坐标位移即可。改前海战 navalSpeedFactor 恒为 1，18 艘划桨船在海战里
            //    匀速划桨，风顺风逆、呼吸涨缩全看不出来 —— 移动信息在海战里被掐掉了。
            const speedDegPerSec = Math.hypot(
                llAhead.lat - ll.lat,
                llAhead.lng - ll.lng,
            ) / 0.08;

            return {
                point,
                latLng: { lat: ll.lat, lng: ll.lng },
                enemyLatLng: { lat: enemyLL.lat, lng: enemyLL.lng },
                headingRad,
                trail,
                broadsideReady: Math.abs(forwardDot) <= 0.55,
                speedDegPerSec,
            };
        }
        return null;
    }

    /**
     * [2026-08-30 海战演出·档1] 查本海军单位所在野战的**敌舰位置**（取敌方存活单位平均坐标）。
     * 兜底：targetPos（相遇点中点）关于己方的对称点 ≈ 敌舰大致方向。
     */
    private findNavalEnemy(unit: IAnimatedUnit, currentPos: { lat: number; lng: number }): { lat: number; lng: number } | null {
        const game = (window as any).game;
        const fields: any[] = game?.combatSystem?.getActiveBattleFields?.() ?? [];
        for (const f of fields) {
            if (f?.isOver) continue;
            const att: any[] = f?.getAttackerUnits?.() ?? [];
            const def: any[] = f?.getDefenderUnits?.() ?? [];
            const hasMe = [...att, ...def].some((u) => u?.id === unit.id);
            if (!hasMe) continue;
            const isAtt = att.some((u) => u?.id === unit.id);
            const enemies = isAtt ? def : att;
            let lat = 0, lng = 0, n = 0;
            for (const e of enemies) {
                const p = e?.getPosition?.();
                if (p && Number.isFinite(p.lat) && Number.isFinite(p.lng)) { lat += p.lat; lng += p.lng; n++; }
            }
            if (n > 0) return { lat: lat / n, lng: lng / n };
        }
        if (unit.targetPos && isValidMapCoord(unit.targetPos)) {
            return {
                lat: 2 * unit.targetPos.lat - currentPos.lat,
                lng: 2 * unit.targetPos.lng - currentPos.lng,
            };
        }
        return null;
    }

    /**
     * 攻城视觉外推（方案 A：阵心对齐城型图框边缘）。
     * 只改返回的屏幕坐标；开战/城放大时推向框缘，离战按时间常数收到 0（缓存方向），防瞬移。
     */
    private applySiegeVisualPush(
        unit: IAnimatedUnit,
        centerPoint: L.Point,
    ): L.Point {
        const cacheKey = unit.id;
        const cachedPush = cacheKey ? this.siegePushCache.get(cacheKey) : undefined;
        const activelySieging = unit.currentBattleType === 'siege' && (unit as any).isSiegeAttacker === true;
        const siegeCityId = (unit as any).targetCityId || (unit as any).targetId;
        const siegeTargetCity = siegeCityId
            ? (window as any).game?.cityManager?.getCity?.(siegeCityId)
            : null;
        const cityZoomed = !!siegeTargetCity
            && (window as any).game?.cityManager?.getTerritorySystem?.()?.isCitySiegeZoomed?.(siegeTargetCity.id)
                === true;
        // 水军与陆军同一套贴边外推（2026-08-04）：原先排除水军会压进放大城图
        const wantEdgePush = !!siegeTargetCity && (activelySieging || cityZoomed);
        const settlingOut = !wantEdgePush && !!cachedPush
            && cachedPush.push > GlobalUnitRenderer.SIEGE_PUSH_EPS_PX;

        if (!wantEdgePush && !settlingOut) {
            return centerPoint;
        }

        let targetPush = 0;
        let nx = cachedPush?.nx ?? 0;
        let ny = cachedPush?.ny ?? 0;

        if (wantEdgePush && siegeTargetCity) {
            const cityPt = this.map.latLngToContainerPoint([siegeTargetCity.latitude, siegeTargetCity.longitude]);
            const dx = centerPoint.x - cityPt.x;
            const dy = centerPoint.y - cityPt.y;
            const len = Math.hypot(dx, dy);
            if (len > 1) {
                const zoom = this.map.getZoom();
                const cityScale = Math.max(0, 1 + (zoom - 9) * 0.5);
                // 跟拍放大：统一屏幕宽（1024×0.4@z10）；非跟拍攻城：平时城型底宽×pane scale
                const screenW = cityZoomed
                    ? getSiegeCityScreenWidthPx(zoom)
                    : getCityMarkerBaseWidthPx(siegeTargetCity.type) * cityScale;
                const halfW = screenW / 2;
                const halfH = halfW * GlobalUnitRenderer.CITY_ICON_HW_RATIO;
                const cosA = Math.abs(dx) / len;
                const sinA = Math.abs(dy) / len;
                const halfPx = halfW * cosA + halfH * sinA;
                // [2026-08-09 13锁死+视觉对垒] 13 战斗场景：攻方恒贴城图框缘外侧——
                // 真实距离无论多远（攻城军团可能在 20km+ 外开战）都视觉拉近到城图旁，
                // 与守军（城图边缘）同屏对垒。旧公式 max(0, halfPx - len) 只处理
                // 「军团在城图内」的推出；且下方 settledPush 负值被 EPS 归零 → 拉近永不生效，
                // 城图+守军屏外不显示（主人实锤）。13 场景直接对位定位，不走缓动/缓存系统。
                // 非 13 保持原样：阵心对齐框缘（halfPx - len 非负部分）。
                nx = dx / len;
                ny = dy / len;
                if (this.isBattleScene13()) {
                    // [2026-08-10 攻城开场留距] 动态阵心距（与野战同源）：城图半投影 +
                    // 守军 keepOut + 守军前缘 + 净空 + 攻方前缘——阵型多大都不交叉。
                    const dist = this.getScene13SiegeAttackerDist(
                        unit, siegeTargetCity, nx, ny, halfPx,
                    );
                    return L.point(
                        cityPt.x + nx * dist,
                        cityPt.y + ny * dist,
                    );
                }
                targetPush = Math.max(0, halfPx - len);
            }
        }

        const alpha = 1 - Math.exp(-this.frameDeltaMs / GlobalUnitRenderer.SIEGE_PUSH_LERP_TAU_MS);
        const prev = cachedPush?.push ?? 0;
        let settledPush = prev + (targetPush - prev) * alpha;
        if (settledPush < GlobalUnitRenderer.SIEGE_PUSH_EPS_PX) settledPush = 0;

        if (cacheKey) {
            if (settledPush <= 0 && targetPush <= 0) {
                this.siegePushCache.delete(cacheKey);
            } else {
                this.siegePushCache.set(cacheKey, { push: settledPush, nx, ny });
            }
        }

        if (settledPush > GlobalUnitRenderer.SIEGE_PUSH_EPS_PX && (nx !== 0 || ny !== 0)) {
            return L.point(
                centerPoint.x + nx * settledPush,
                centerPoint.y + ny * settledPush,
            );
        }
        return centerPoint;
    }

    /**
     * [2026-08-10 野战出场对齐·三国群英传式] 13 场景**野战**：参战军团对位到
     * 「战场中点 ± 阵心距/2」——攻守镜像对称列阵、面对面，短冲锋即接战（主人：
     * 「攻守双方战斗出场对齐，像三国群英传一样」）。
     *
     * 背景：野战双方都是 Army，此前按真实经纬度渲染、无任何视觉拉近（攻城有
     * applySiegeVisualPush 的 650px 外推，野战没有）。真实距离几公里 → 屏幕几百到
     * 上千 px，骑兵冲锋十几秒「只移动不攻击」（主人实锤）；且双方各自朝对方真实
     * 位置冲，无对垒观感。
     *
     * 几何：找含本单位的活跃 field battlefield → 对方 = 阵营相反单位（优先带将）→
     * 屏幕空间 dir = normalize(对方真实位置 − 我真实位置)、mid = 两点中点 →
     * 我方渲染点 = mid − dir×(GAP/2)，对方渲染点 = mid + dir×(GAP/2)（攻守对称）。
     * 结果存 fieldSceneAlignCache（本帧统一），getSquadOffsets 野战目标 / 镜头落点共用。
     *
     * 🔴 13 锁死（active && zoom≥13）：攻城战 bf.type === 'siege' 直接排除，走原有
     * applySiegeVisualPush；8/9/10 本函数直接返回原样，逐像素不变。
     */
    /**
     * [2026-08-10 攻城开场留距·与野战同源] 13 攻城战攻方阵心距城中心的距离。
     * 旧版 = 城图半投影 + 固定 650px：没扣除守军出城列阵（keepOut + 守军阵深）与
     * 攻方自身阵深，阵型一大开场就嵌进守军（主人实锤「攻城也交叉」）。
     * 现 = 城图半投影 + 守军 keepOut + 守军前缘半径 + 净空 + 攻方前缘半径，
     * 与野战 applySceneFieldAlign 的动态阵心距同一公式结构。
     * 资源未就绪 → 退回旧 650（此时编队也未展开，不会交叉）。
     */
    private getScene13SiegeAttackerDist(
        unit: IAnimatedUnit,
        city: any,
        nx: number,
        ny: number,
        halfPx: number,
    ): number {
        const fallback = halfPx + GlobalUnitRenderer.SCENE13_ATTACKER_GAP_PX;
        const atkPos = unit.getPosition();
        if (!atkPos) return fallback;
        const cityPos = { lat: city.latitude, lng: city.longitude };
        const scale = Math.pow(2, Math.min(this.map.getZoom(), 10) - 9) * 0.7;

        // 守军：城所属势力专属 9 槽（如伊贺/大秦等）或文化区 9 槽，面向攻方
        const factionSlots = city.factionId ? getFactionCompositionSlots(city.factionId) : null;
        const tier = factionSlots ? { slots: factionSlots } : getCultureTier((city.region ?? 'CENTRAL') as any, city.troops);
        const slots = tier?.slots;
        if (!slots || slots.length === 0) return fallback;
        const defSlots = expandCompositionSlots(slots);
        const defScales = expandCompositionScales(slots);
        const defDir = OrientationSystem.get8DirectionIndex(cityPos, atkPos);
        // 守军整片沿攻方方向外推 keepOut（getDefenderSquadOffsets 同源：1.1×sp.y）
        const defSp = LegionPhalanxDrawer.getDenseSquadSpacing(
            'mixed', defSlots[0] ?? 'infantry', defDir, scale, defScales,
        );
        if (!defSp) return fallback;
        const keepOut = defSp.y * 1.1;
        // 守军前缘半径：沿「城→攻方」屏幕方向 (nx, ny)
        const defRadius = this.scene13FrontRadiusCore(
            defSlots, defScales, 'mixed', defDir, nx, ny, scale,
        );
        // 攻方前缘半径：面向城，沿「攻方→城」屏幕方向 (-nx, -ny)
        const atkDir = OrientationSystem.get8DirectionIndex(atkPos, cityPos);
        const atkRadius = this.getScene13FormationFrontRadius(unit, atkDir, -nx, -ny);
        if (defRadius === null || atkRadius === null) return fallback;
        return halfPx + keepOut + defRadius
            + GlobalUnitRenderer.SCENE13_FIELD_CLEAR_LANE_PX + atkRadius;
    }

    /** 13 场景通用：一个 3×3 军阵（9 编队）从阵心沿指定屏幕方向伸出的真实半径。
     *  野战/攻城同源——攻城守军（城文化区 9 槽）也走这里算纵深，开场留距一套公式。 */
    private scene13FrontRadiusCore(
        slots: string[],
        cultureScales: number[] | null,
        legionType: string,
        directionIndex: number,
        screenDx: number,
        screenDy: number,
        scale: number,
    ): number | null {
        if (slots.length === 0) return null;
        const sp = LegionPhalanxDrawer.getDenseSquadSpacing(
            legionType || 'mixed',
            legionType || 'infantry',
            directionIndex,
            scale,
            cultureScales,
        );
        if (!sp) return null;

        const angle = (directionIndex + 1) * Math.PI / 4;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        // 屏幕方向 → 阵内方向（与 getSquadOffsets 同一套逆旋转）。
        const dlx = screenDx * cos + screenDy * sin;
        const dly = -screenDx * sin + screenDy * cos;
        const unitWpx = sp.x / (4.375 * 1.10);
        const unitHpx = sp.y / (2.25 * 1.10);
        let radius = 0;
        for (let i = 0; i < slots.length; i++) {
            const r = Math.floor(i / 3);
            const c = i % 3;
            const gridX = (c - 1) * sp.x;
            const gridY = (r - 1) * sp.y;
            const support = LegionPhalanxDrawer.getSquadSupportRadius(
                slots[i] ?? 'mixed', dlx, dly, unitWpx, unitHpx,
            );
            radius = Math.max(radius, gridX * dlx + gridY * dly + support);
        }
        return radius;
    }

    /** 军团（Army 渲染单位）版：从 cultureSlots 取阵型。 */
    private getScene13FormationFrontRadius(
        unit: IAnimatedUnit,
        directionIndex: number,
        screenDx: number,
        screenDy: number,
    ): number | null {
        const scale = Math.pow(2, Math.min(this.map.getZoom(), 10) - 9) * 0.7
            * (unit.previewScale ?? 1);
        return this.scene13FrontRadiusCore(
            unit.cultureSlots ?? [],
            unit.cultureScales || null,
            unit.legionType || 'mixed',
            directionIndex,
            screenDx,
            screenDy,
            scale,
        );
    }

    private applySceneFieldAlign(unit: IAnimatedUnit, centerPoint: L.Point): L.Point {
        if (!this.isBattleScene13()) return centerPoint;
        // 同帧缓存命中（renderUnit 每帧每单位一次；跨帧由 animate 开头 clear 重算）
        const cached = this.fieldSceneAlignCache.get(unit.id ?? '');
        if (cached) return cached.aligned;
        // 未命中 → 把**整场战斗**一次性解算并写进缓存（本单位若不在任何 13 野战里则返回 false）
        if (!this.solveSceneFieldAlign(unit)) return centerPoint;
        return this.fieldSceneAlignCache.get(unit.id ?? '')?.aligned ?? centerPoint;
    }

    // ── [2026-08-10 临时诊断] 13 编队状态探针 ──────────────────────────
    // 查两个问题：① 后排远程只有左右两格不动 ② 防守方整体不动。
    // 只在 13 场景的编队循环里写入（其余 zoom 根本不进那段代码），无 IO / 无日志 / 不改行为。
    // 用法：浏览器控制台敲 `__scene13Probe()`，打印本帧全体参战编队的状态表。
    // 🔴 结论出来后，本块连同 getSquadOffsets 里的两个 recordScene13Probe 调用点一起删除。
    private scene13Probe = new Map<string, {
        squadKey: string; faction: string; slot: number; type: string; state: string;
        dist: number | null; range: number | null; target: string | null; dtSec: number;
    }>();
    private scene13ProbeHooked = false;

    // ── [2026-08-10 剧本法] ─────────────────────────────────────────
    /** 本场 13 战斗的进度 0~1（三幕按它切）。用户真按暂停时不累加；场景退出归零 */
    private scene13Progress = 0;
    /** 每军团开战时算死的位移（px），全程不重算。key = selfKey
     *  advance = 沿阵型正前方压上多少；lateral = 横向对齐要挪多少（本地 +x 为右） */
    private squadAdvanceCache = new Map<string, { advance: number; lateral: number }>();

    /** 每帧推进 13 战斗时钟。13 独立时钟：大战略暂停不算暂停，用户按的暂停才算 */
    private tickScene13Clock(): void {
        if (!this.isBattleScene13()) {
            if (this.scene13Progress !== 0) this.scene13Progress = 0;
            if (this.squadAdvanceCache.size > 0) this.squadAdvanceCache.clear();
            return;
        }
        const scene = (window as any).game?.battleScene;
        const userPaused = scene?.pauseHook?.isGamePaused?.() === true
            && scene?.isStrategyPausedByScene?.() !== true;
        if (userPaused) return;
        const totalMs = Math.max(1000, GameConfig.COMBAT.SCENE13_BATTLE_DURATION_SEC * 1000);
        this.scene13Progress = Math.min(1, this.scene13Progress + this.frameDeltaMs / totalMs);
    }

    private recordScene13Probe(
        selfKey: string, faction: string, slot: number, type: string, state: string,
        dist: number | null, range: number | null, target: string | null, dtSec: number,
    ): void {
        if (!this.scene13ProbeHooked) {
            this.scene13ProbeHooked = true;
            (window as any).__scene13Probe = () => this.dumpScene13Probe();
        }
        this.scene13Probe.set(`${selfKey}:${slot}`, {
            squadKey: selfKey, faction, slot, type, state,
            dist: dist === null ? null : Math.round(dist),
            range: range === null ? null : Math.round(range),
            target, dtSec: Math.round(dtSec * 1000) / 1000,
        });
    }

    private scene13ProbeLastFlushAt = 0;
    private static readonly SCENE13_PROBE_INTERVAL_MS = 2000;

    /**
     * [2026-08-10 临时诊断] 每 2 秒把本帧编队状态 POST 到 /api/scene13-probe，
     * 落盘 scratch/scene13_probe_latest.json + 追加 scene13_probe_log.jsonl。
     * 与 ZoomPerfProbe 同一套路：主人只管玩，不必在控制台敲任何东西，排查方直接读文件。
     * 仅 DEV + 仅 13 场景；非 13 时 probe 为空，直接返回不发请求。
     */
    private flushScene13Probe(): void {
        if (!import.meta.env.DEV) return;
        if (this.scene13Probe.size === 0) return;
        if (!this.isBattleScene13()) { this.scene13Probe.clear(); return; }
        const now = performance.now();
        if (now - this.scene13ProbeLastFlushAt < GlobalUnitRenderer.SCENE13_PROBE_INTERVAL_MS) return;
        this.scene13ProbeLastFlushAt = now;

        const rows = [...this.scene13Probe.values()];
        const payload = {
            t: new Date().toISOString(),
            zoom: this.map.getZoom(),
            总编队: rows.length,
            无目标: rows.filter((r) => r.target === null).length,
            想走但被友军挡住: rows.filter(
                (r) => r.state === 'IDLE' && r.dist !== null && r.range !== null && r.dist > r.range,
            ).length,
            dt为0: rows.filter((r) => r.dtSec === 0).length,
            各军团: [...new Set(rows.map((r) => r.squadKey))].map((k) => {
                const g = rows.filter((r) => r.squadKey === k);
                return {
                    军团: k,
                    势力: g[0]?.faction ?? '',
                    状态分布: g.reduce((m: Record<string, number>, r) => {
                        m[r.state] = (m[r.state] ?? 0) + 1;
                        return m;
                    }, {}),
                    编队: g.sort((a, b) => a.slot - b.slot).map((r) => ({
                        格位: r.slot, 兵种: r.type, 状态: r.state,
                        距目标: r.dist, 停止线: r.range,
                        差值: r.dist !== null && r.range !== null ? r.dist - r.range : null,
                        目标: r.target,
                    })),
                };
            }),
        };
        void fetch('/api/scene13-probe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload, null, 2),
        }).catch(() => { /* 落盘失败不打扰游戏 */ });
    }

    /** 控制台导出：按军团分组打印每个编队的状态/距离/停止线/目标，并给出一行判读提示 */
    public dumpScene13Probe(): void {
        const rows = [...this.scene13Probe.values()].sort(
            (a, b) => (a.squadKey === b.squadKey ? a.slot - b.slot : a.squadKey < b.squadKey ? -1 : 1),
        );
        if (rows.length === 0) {
            console.log('[13探针] 空 —— 当前不在 13 战斗场景，或编队循环没跑到。');
            return;
        }
        console.table(rows.map((r) => ({
            军团: r.squadKey, 格位: r.slot, 兵种: r.type, 状态: r.state,
            距目标: r.dist, 停止线: r.range,
            差值: r.dist !== null && r.range !== null ? r.dist - r.range : null,
            目标: r.target, dt: r.dtSec,
        })));
        // 判读：无目标 / 被挡（想走却 IDLE）/ dt=0（列阵或暂停）各有多少
        const noTarget = rows.filter((r) => r.target === null).length;
        const blocked = rows.filter(
            (r) => r.state === 'IDLE' && r.dist !== null && r.range !== null && r.dist > r.range,
        ).length;
        const frozen = rows.filter((r) => r.dtSec === 0).length;
        console.log(
            `[13探针] 共 ${rows.length} 编队 | 无目标 ${noTarget} | 想走但被友军挡住 ${blocked} | dt=0（列阵/暂停）${frozen}`,
        );
    }

    /** 取参战 id 对应的**渲染单位**（BattleUnit 是战斗适配器，无 cultureSlots，不能拿来算编队投影） */
    private findRenderUnitById(id: string | null | undefined): IAnimatedUnit | null {
        if (!id) return null;
        return this.sortedUnitsCache.find((u) => u.id === id) ?? null;
    }

    /**
     * [2026-08-10 修·开场交叉] 13 野战对位：**整场战斗一次解算**，不再逐单位各算各的。
     *
     * 旧写法的两个毛病（主人实锤「刚一开始两军就交叉」）：
     *  ① 每个单位拿**自己的**真实位置和敌方主将算中点 → 三支以上军团参战时，
     *     每支算出各自的中点、各自的中轴，退开的方向和落点互不相干 → 阵列交叉。
     *  ② 阵心距要「我方前缘半径 + 敌方前缘半径」，任一侧算不出就整体退回兜底 1200，
     *     而这个判断是**各算各的** → 一边用动态 600、一边用兜底 1200，两个落点不再互为
     *     镜像 → 一边贴脸一边空一大块。
     *
     * 现在的解算（一帧一次，结果写进 fieldSceneAlignCache 供全体参战单位共用）：
     *  1. 攻守双方各取**质心**，中轴 = 两质心连线，中点 = 两质心中点 —— 全场唯一一条轴；
     *  2. 阵心距 = 攻方最大前缘半径 + 守方最大前缘半径 + 净空；**任一单位算不出半径，
     *     两侧一起用兜底**，保证永远对称（修 ②）；
     *  3. 同侧多支军团沿**垂直于中轴**的方向依次排开（按 id 排序保证稳定），
     *     铺成一条战线而不是叠在一个点上；
     *  4. 每支军团的推进目标 = 自己正对面（aligned ± dir×阵心距），各打各的正面。
     *
     * 🔴 只在 13 生效（调用方 applySceneFieldAlign 已判 isBattleScene13）；攻城战不走这里
     *    （bf.type === 'siege' 由 applySiegeVisualPush 处理）。8/9/10 逐像素不变。
     */
    private solveSceneFieldAlign(unit: IAnimatedUnit): boolean {
        const game = (window as any).game;
        let attIds: string[] = [];
        let defIds: string[] = [];
        const fields: any[] = game?.combatSystem?.getActiveBattleFields?.() ?? [];
        const bf = fields.find(
            (f: any) => !f?.isOver && f?.type === 'field' && f?.hasParticipant?.(unit.id),
        );
        if (bf) {
            attIds = (bf.getAttackerUnits?.() ?? []).map((u: any) => u.id).filter(Boolean);
            defIds = (bf.getDefenderUnits?.() ?? []).map((u: any) => u.id).filter(Boolean);
        } else {
            // 1v1 野战（沙盒碰撞战 Battle）不在 getActiveBattleFields 里，走同一套对位。
            // 碰撞开战 = 两军已贴身，不对位的话开局就是交叉的。
            const battles: any[] = game?.combatSystem?.getActiveBattles?.() ?? [];
            const b = battles.find(
                (x: any) => !x?.isOver && x?.type === 'field'
                    && (x?.attacker?.id === unit.id || x?.defender?.id === unit.id),
            );
            if (!b) return false;
            attIds = b.attacker?.id ? [b.attacker.id] : [];
            defIds = b.defender?.id ? [b.defender.id] : [];
        }

        // id 排序：同侧排开顺序必须逐帧稳定，否则军团每帧换位 = 瞬移
        const atts = attIds.sort().map((id) => this.findRenderUnitById(id)).filter((u): u is IAnimatedUnit => !!u);
        const defs = defIds.sort().map((id) => this.findRenderUnitById(id)).filter((u): u is IAnimatedUnit => !!u);
        if (atts.length === 0 || defs.length === 0) return false;

        const centroid = (us: IAnimatedUnit[]): L.Point | null => {
            let sx = 0;
            let sy = 0;
            let n = 0;
            for (const u of us) {
                const p = u.getPosition();
                if (!p || !isValidMapCoord(p)) continue;
                const pt = this.map.latLngToContainerPoint([p.lat, p.lng]);
                sx += pt.x;
                sy += pt.y;
                n++;
            }
            return n === 0 ? null : L.point(sx / n, sy / n);
        };
        const PA = centroid(atts);
        const PD = centroid(defs);
        if (!PA || !PD) return false;

        const dx = PD.x - PA.x;
        const dy = PD.y - PA.y;
        const len = Math.hypot(dx, dy);
        // 两质心重合（已完全叠在一起）→ 没有可用的中轴方向，保持原样，不硬造一个
        if (len < 1e-6) return false;
        const dirX = dx / len;
        const dirY = dy / len;
        const mid = L.point((PA.x + PD.x) / 2, (PA.y + PD.y) / 2);
        // 垂直于中轴（同侧多军团沿它排开）
        const perpX = -dirY;
        const perpY = dirX;
        // 双方各自面向对面质心（8 向档），供编队投影半径使用
        const attFacing = OrientationSystem.get8DirectionFromAngle(
            Math.atan2(-dirY, dirX) * (180 / Math.PI),
        );
        const defFacing = OrientationSystem.get8DirectionFromAngle(
            Math.atan2(dirY, -dirX) * (180 / Math.PI),
        );

        /** 沿给定屏幕方向的编队投影半径；任一单位算不出 → 记 null 让全场一起退兜底 */
        let radiusUnavailable = false;
        const radiusOf = (u: IAnimatedUnit, facing: number, sx: number, sy: number): number => {
            const r = this.getScene13FormationFrontRadius(u, facing, sx, sy);
            if (r === null) {
                radiusUnavailable = true;
                return GlobalUnitRenderer.SCENE13_FIELD_FALLBACK_GAP_PX / 4;
            }
            return r;
        };

        // 纵深（决定阵心距）与横宽（决定同侧排开间距）分开量
        const attFront = atts.map((u) => radiusOf(u, attFacing, dirX, dirY));
        const defFront = defs.map((u) => radiusOf(u, defFacing, -dirX, -dirY));
        const sideWidth = (us: IAnimatedUnit[], facing: number): number[] => us.map((u) =>
            radiusOf(u, facing, perpX, perpY) + radiusOf(u, facing, -perpX, -perpY));
        const attWidth = sideWidth(atts, attFacing);
        const defWidth = sideWidth(defs, defFacing);

        // 阵心距：任一侧任一单位算不出投影 → 两侧一起用兜底（修 ②，保证镜像对称）
        const gap = radiusUnavailable
            ? GlobalUnitRenderer.SCENE13_FIELD_FALLBACK_GAP_PX
            : Math.max(...attFront) + Math.max(...defFront)
                + GlobalUnitRenderer.SCENE13_FIELD_CLEAR_LANE_PX;
        const half = gap / 2;

        /** 同侧沿 perp 依次排开，返回每支军团的侧向偏移（整条线以中轴居中） */
        const lateral = (widths: number[]): number[] => {
            const lane = GlobalUnitRenderer.SCENE13_FIELD_CLEAR_LANE_PX;
            const total = widths.reduce((a, b) => a + b, 0) + lane * Math.max(0, widths.length - 1);
            const out: number[] = [];
            let cursor = -total / 2;
            for (const w of widths) {
                out.push(cursor + w / 2);
                cursor += w + lane;
            }
            return out;
        };
        const attLat = lateral(attWidth);
        const defLat = lateral(defWidth);

        const write = (us: IAnimatedUnit[], lat: number[], sign: number): void => {
            for (let i = 0; i < us.length; i++) {
                const id = us[i].id ?? '';
                if (!id) continue;
                const bx = mid.x + dirX * half * sign + perpX * lat[i];
                const by = mid.y + dirY * half * sign + perpY * lat[i];
                this.fieldSceneAlignCache.set(id, {
                    aligned: L.point(bx, by),
                    // 推进目标 = 自己的正对面（同一条侧向位置），各打各的正面
                    enemy: L.point(bx - dirX * gap * sign, by - dirY * gap * sign),
                    mid,
                });
            }
        };
        write(atts, attLat, -1); // 攻方在中点的「后方」（−dir 侧）
        write(defs, defLat, 1);  // 守方在 +dir 侧，与攻方镜像

        return this.fieldSceneAlignCache.has(unit.id ?? '');
    }

    /**
     * [2026-08-10 野战出场对齐] 野战战场中点（两军对位中轴中点），供 BattleSceneLayer
     * 镜头同屏取景（三国群英传式：两军都在画面里）。查不到返回 null。
     */
    public getFieldSceneCenter(unitId: string): { lat: number; lng: number } | null {
        const align = this.fieldSceneAlignCache.get(unitId);
        if (!align) return null;
        const ll = this.map.containerPointToLatLng(align.mid);
        return { lat: ll.lat, lng: ll.lng };
    }

    /** 屏外单位不进本帧 drawList，单独推进外推缓存（离战收推） */
    private tickOffscreenSiegePushCaches(): void {
        if (this.siegePushCache.size === 0) return;
        for (const unit of this.sortedUnitsCache) {
            const id = unit.id;
            if (!id || !this.siegePushCache.has(id)) continue;
            if (this.isUnitInContainerView(unit)) continue;
            const pos = unit.getPosition();
            if (!isValidMapCoord(pos)) continue;
            const pt = this.map.latLngToContainerPoint([pos.lat, pos.lng]);
            this.applySiegeVisualPush(unit, pt);
        }
    }

    private renderUnit(unit: IAnimatedUnit, ctx: CanvasRenderingContext2D): void {
        // ... (Checks for Bandit remain same)
        const banditTypes = ['bandit', 'raider', 'outlaw', 'barbarian', 'rebel', 'mercenary', 'cult', 'righteous', 'warlord'];
        const isBandit = banditTypes.includes(unit.type || '') || (unit as any).factionId === 'bandit';

        const unitPos = unit.getPosition();
        if (!isValidMapCoord(unitPos)) return;
        // Base center point
        let centerPoint = this.map.latLngToContainerPoint([unitPos.lat, unitPos.lng]);

        // 常态军团画在真实坐标；攻城外推与纯舰队野战双鱼导演仅改变渲染点，不改逻辑坐标。
        // 下面 scale 仅供贴图/方阵尺寸计算使用（不参与定位）。
        // 例外：攻城视觉外推只改渲染点（逻辑坐标不动），见 applySiegeVisualPush。
        const currentZoom = this.map.getZoom();
        const effectiveZoom = Math.min(currentZoom, 10);
        const scale = Math.pow(2, effectiveZoom - 9) * 0.7;
        const navalFieldPose = this.getNavalFieldBattlePose(unit);
        if (navalFieldPose) centerPoint = navalFieldPose.point;

        // 非匪军：先做攻城外推再裁剪（含水军，与陆军同一套贴边）
        if (!isBandit) {
            centerPoint = this.applySiegeVisualPush(unit, centerPoint);
            // [2026-08-10 野战出场对齐] 野战 13 场景对位（攻城由 applySiegeVisualPush 处理，
            // 本函数只动无城的野战；非 13 / 非参战军团返回原样，8/9/10 逐像素不变）
            centerPoint = this.applySceneFieldAlign(unit, centerPoint);
        }

        // [2026-08-09 13裁剪修复] 13 场景裁剪余量 = 基础余量 + 本军团编队最大偏移：
        // 编队独立推进可到中心点外 ~530px，攻方中心被 750px 外推推到屏幕边缘时，
        // 若仍用 100px 余量判中心点 → 整军被误裁，而编队其实已推进进画面（主人实锤攻方整块消失）。
        // 用「+」而非「max」：中心点在屏外 550px、编队偏移 530px 时，余量 630 > 550 才不裁
        // （max(100, 530)=530 < 550 仍会裁掉半个精灵露头的编队——边界窄缝，主人核对指出）。
        // 场景闸门：仅 13 走新判据，8/9/10 保持原中心点判据（性能不受影响）。
        // 旋转保距：squadMoveState 是旋转前空间偏移，模长 = 屏幕偏移距离。
        let cullMargin = GlobalUnitRenderer.VIEW_CULL_MARGIN_PX;
        if (this.isBattleScene13()) {
            const prefix = `${unit.id}:`;
            for (const [key, off] of this.squadMoveState) {
                if (key.startsWith(prefix)) {
                    cullMargin = GlobalUnitRenderer.VIEW_CULL_MARGIN_PX + Math.hypot(off.x, off.y);
                }
            }
        }
        if (
            centerPoint.x < -cullMargin ||
            centerPoint.x > this.canvas.width + cullMargin ||
            centerPoint.y < -cullMargin ||
            centerPoint.y > this.canvas.height + cullMargin
        ) {
            return;
        }

        const troops = unit.getTroops();

        // Determine Direction First (needed for offset)
        // Initialize random direction if undefined (for natural Bandit look)
        if (unit.lastDirection === undefined) {
            unit.lastDirection = Math.floor(Math.random() * 8);
        }
        let directionIndex = unit.lastDirection;
        if (navalFieldPose) {
            const angle = navalFieldPose.headingRad;
            this.unitVisualAngles.set(unit.id || 'unknown', angle);
            // headingRad 已是屏幕罗盘角，直接换算，不再经过经纬度虚拟点（否则被 Mercator 校正两次）
            directionIndex = OrientationSystem.get8DirectionFromAngle(
                OrientationSystem.compassToMathDeg(angle * 180 / Math.PI),
            );
            unit.lastDirection = directionIndex;
        } else if (unit.isAttacking && isValidMapCoord(unit.targetPos)) {
            const dLat = Math.abs(unitPos.lat - unit.targetPos.lat);
            const dLng = Math.abs(unitPos.lng - unit.targetPos.lng);
            if (dLat > 0.00001 || dLng > 0.00001) {
                // For attacking, we want precise facing to target
                directionIndex = OrientationSystem.get8DirectionIndex(unitPos, unit.targetPos);
                unit.lastDirection = directionIndex;
                // Sync visual angle to target immediately to avoid "slow turn" during attack start
                const angle = OrientationSystem.getScreenCompassDeg(unitPos, unit.targetPos) * Math.PI / 180;
                this.unitVisualAngles.set(unit.id || 'unknown', angle);
            }
        } else if (unit.isMoving) {
            // [UX FIX] Smooth Rotation to prevent jitter
            // 1. Calculate raw target angle (Radians)
            // 🔴 [2026-09-01] 屏幕轴位移（Mercator），不用原始经纬度差；dx=北向、dy=东向，配 atan2(dy,dx)=罗盘角
            const sd = OrientationSystem.screenDelta(unit.lastPosition, unitPos);
            const dy = sd.dx;
            const dx = sd.dy;
            // OrientationSystem uses (lat, lng). atan2(x, y)? 
            // OrientationSystem: 
            // const angle = Math.atan2(target.lng - current.lng, target.lat - current.lat);
            // So dx = dLat, dy = dLng.

            if (Math.abs(dx) > 0.0000001 || Math.abs(dy) > 0.0000001) {
                const targetAngle = Math.atan2(dy, dx);
                const unitId = unit.id || 'unknown';
                const actualNavalHeading = Number.isFinite(unit.navalHeadingRad)
                    ? unit.navalHeadingRad as number
                    : null;
                let currentAngle = actualNavalHeading
                    ?? this.unitVisualAngles.get(unitId)
                    ?? targetAngle;

                // 2. Lerp angle (handle wrap-around -PI to PI)
                // Shortest path interpolation
                let diff = targetAngle - currentAngle;
                while (diff <= -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;

                // Formatting note: dt is variable, but here we run per frame. 
                // Using fixed factor 0.2 gives better responsiveness (~5 frames to settle)
                // 🔴 [2026-08-27 §C] 陆军保持原样（0.2/帧，逐像素不变）；只有船改成
                //    dt 驱动的指数平滑 + 最大转向角速度封顶 —— 船有转向惯性，不能原地掰头。
                const isNavalTurn = !this.isBattleScene13() && !!(unit.isOnSea || unit.forceNavalVisual);
                if (actualNavalHeading !== null) {
                    currentAngle = actualNavalHeading;
                } else if (isNavalTurn) {
                    const nowMs = performance.now();
                    const prevMs = this.navalTurnTickMs.get(unitId);
                    // 首帧 / 长时间没画（离屏被裁）→ 按一帧算，避免 dt 巨大导致瞬间转到位
                    const dt = prevMs === undefined ? 1 / 60 : Math.min(0.1, Math.max(0, (nowMs - prevMs) / 1000));
                    this.navalTurnTickMs.set(unitId, nowMs);
                    const eased = diff * (1 - Math.exp(-dt / GlobalUnitRenderer.NAVAL_TURN_TAU_S));
                    const maxStep = GlobalUnitRenderer.NAVAL_TURN_RATE_DEG_S * Math.PI / 180 * dt;
                    currentAngle += Math.abs(eased) > maxStep ? Math.sign(diff) * maxStep : eased;
                } else {
                    currentAngle += diff * 0.2;
                }

                // Normalize
                while (currentAngle <= -Math.PI) currentAngle += Math.PI * 2;
                while (currentAngle > Math.PI) currentAngle -= Math.PI * 2;

                this.unitVisualAngles.set(unitId, currentAngle);

                // 3. Convert smoothed angle to 0-7 index
                // 0 is South (Lat -), 4 is North (Lat +) in this logic?
                // OrientationSystem: 0=S, 4=N. 
                // Math.atan2(dy, dx): 
                // South: dx=-1, dy=0 -> atan2(0, -1) = PI (or -PI). Index 0 implies South?
                // Let's rely on OrientationSystem structure.
                // Actually, let's just map angle to 8 directions manually to match OrientationSystem.
                // OrientationSystem.get8DirectionIndex uses logic:
                // angle = atan2(dLng, dLat). Note dLat is Y-like if North is Up.
                // But typically Lat is Y. 
                // Let's use the helper to convert angle to index if possible, or replicate:

                // Helper: Convert rad to 0-7. 
                // 0=S, 1=SE, 2=E, 3=NE, 4=N, 5=NW, 6=W, 7=SW
                // standard atan2(y,x): 0=E, PI/2=N, PI=W, -PI/2=S.
                // Our atan2(dLng, dLat) -> (x=dLat, y=dLng). 
                // dLat=1 (N) -> atan2(0, 1) = 0. Wait.
                // If 0=S, then dLat=-1. atan2(0, -1) = PI.

                // Let's just use the cached currentAngle to project a "virtual point" and ask OrientationSystem
                // currentAngle 已是屏幕罗盘角，直接换成数学角量化（改前用经纬度虚拟点，会被 Mercator 再校正一次）
                directionIndex = OrientationSystem.get8DirectionWithHysteresis(
                    unit.lastDirection,
                    OrientationSystem.compassToMathDeg(currentAngle * 180 / Math.PI),
                );

                unit.lastDirection = directionIndex;
            }
        }

        if (isBandit) {
            // [NEW] Snap NPC position to Hex center
            const hex = GridSystem.latLngToAxial(unitPos.lat, unitPos.lng);
            const snapped = GridSystem.axialToLatLng(hex.q, hex.r);
            centerPoint = this.map.latLngToContainerPoint([snapped.lat, snapped.lng]);

            let state: BanditState = 'IDLE';

            if (unit.isAttacking) state = 'ATTACK';
            else if (unit.isMoving) state = 'MOVE';

            BanditDrawer.draw(
                ctx,
                { x: centerPoint.x, y: centerPoint.y },
                state,
                directionIndex,
                scale * (unit.previewScale ?? 1),
                troops,
                Date.now(),
                unit.type || 'bandit' // Pass type for formation
            );

        } else {
            // ... (Phalanx Rendering logic)
            // [2026-05-30] 加 DAMAGE/DEATH 状态识别 (供 ArmyEditor 预览动作用)
            let state: PhalanxAnimState = 'IDLE';
            if (unit.isDestroyed && unit.fadeOutStart === undefined) {
                state = 'DEATH';
            } else if (unit.lastDamageTime && Date.now() - unit.lastDamageTime < 800) {
                state = 'DAMAGE';
            } else if (unit.isAttacking) {
                state = 'ATTACK';
            } else if (unit.isMoving) {
                state = 'MOVE';
            }

            // [2026-08-09 13锁死] 13 战斗模式没有水军：船/登陆部队一律按陆地方阵渲染
            // （主人定：13 是陆战演出档，不画船贴图；非 13 照旧按 isOnSea/forceNavalVisual 走水军视觉）
            const useNavalVisual = !this.isBattleScene13()
                && !!(unit.isOnSea || unit.forceNavalVisual);

            // 🔴 [2026-08-21 全 16 向船] 船单独用 DE 全 16 向素材（22.5° 精度）；陆军/旗帜仍 8 向互不影响。
            //    directionIndex 是 8 向（get8DirectionIndex）；船方向从平滑移动角 / 目标角直接算 16 向帧：
            //    DE 帧 d 的朝向（北=0° 顺时针） = 45 + 22.5·d → d = round((deg-45)/22.5) mod 16。
            let navalDir16 = directionIndex * 2; // 兜底：8 向 ×2 = 偶数向 16 帧（与旧 8 向行为一致）
            let navalHeadingDeg: number | undefined;   // 精确航向（度，北=0 顺时针）；undefined = 退回旧的纯 16 向行为
            if (useNavalVisual) {
                let navalAngleRad: number;
                if (navalFieldPose) {
                    navalAngleRad = navalFieldPose.headingRad;
                } else if (unit.isAttacking && isValidMapCoord(unit.targetPos)) {
                    navalAngleRad = OrientationSystem.getScreenCompassDeg(unitPos, unit.targetPos) * Math.PI / 180;
                } else if (unit.isMoving) {
                    navalAngleRad = (Number.isFinite(unit.navalHeadingRad) ? unit.navalHeadingRad as number : null)
                        ?? this.unitVisualAngles.get(unit.id || 'unknown')
                        ?? (45 + 22.5 * navalDir16) * Math.PI / 180;
                } else {
                    navalAngleRad = (45 + 22.5 * navalDir16) * Math.PI / 180;
                }
                const navalDeg = navalAngleRad * 180 / Math.PI;
                navalDir16 = ((Math.round((navalDeg - 45) / 22.5) % 16) + 16) % 16;
                // 🔴 [2026-08-27 §B] 量化前的精确航向留着传给 drawNaval：那边按它补回
                //    22.5° 台阶丢掉的残差角（微旋），并作为整队航迹跟随的基准方向。
                navalHeadingDeg = ((navalDeg % 360) + 360) % 360;
            }

            // 攻城外推已在裁剪前 applySiegeVisualPush 做过（含离战收推）
            const unitIdForGear = unit.id || 'unknown';
            const activelySieging = unit.currentBattleType === 'siege' && (unit as any).isSiegeAttacker === true;

            // 1. Draw Flag Pole (Behind Soldiers / Ship)
            LegionFlagDrawer.drawPole(
                ctx,
                { x: centerPoint.x, y: centerPoint.y },
                useNavalVisual ? scale * (unit.previewScale ?? 1) * 0.85 : scale * (unit.previewScale ?? 1),
                unit.factionId || 'panjun'
            );

            // ── 攻城器械（仅攻城方陆战；覆灭后留尸体同步士兵）──
            if (!useNavalVisual && (activelySieging || LegionPhalanxDrawer.wasSiegeUnit(unitIdForGear))) {
                // [2026-07-18] 乘胜追击不休整时军团立即开拔，器械须留在城下原地渐隐（史实：器械就地弃置）。
                // 攻城期间每帧刷新锚点＝城下位置（含攻城视觉补偿，战终渐隐不跳位）；战后按锚点换算屏幕坐标并冻结朝向。
                if (activelySieging) {
                    const anchorLL = this.map.containerPointToLatLng(L.point(centerPoint.x, centerPoint.y));
                    this.siegeGearAnchors.set(unitIdForGear, { lat: anchorLL.lat, lng: anchorLL.lng, dir: directionIndex });
                }
                const gearAnchor = activelySieging ? null : this.siegeGearAnchors.get(unitIdForGear);
                const gearCenter = gearAnchor
                    ? this.map.latLngToContainerPoint([gearAnchor.lat, gearAnchor.lng])
                    : centerPoint;
                const gearDir = gearAnchor ? gearAnchor.dir : directionIndex;
                const siegeScale = scale * (unit.previewScale ?? 1);
                const baseH = 75;
                const rH = baseH * siegeScale;
                const ramSpacingY = rH * 0.42;
                const ramSpacingX = rH * 0.8 * 0.50;
                LegionPhalanxDrawer.drawSiegeGear(
                    ctx,
                    { x: gearCenter.x, y: gearCenter.y },
                    state,
                    gearDir,
                    siegeScale,
                    Date.now(),
                    ramSpacingX,
                    ramSpacingY,
                    unitIdForGear,
                    troops,
                    GlobalUnitRenderer.getSiegeGroupOffsets(unit, gearDir, siegeScale),
                );
                // 渐隐走完（drawSiegeGear 内部已清器械状态）→ 锚点同步清除
                if (!activelySieging && !LegionPhalanxDrawer.wasSiegeUnit(unitIdForGear)) {
                    this.siegeGearAnchors.delete(unitIdForGear);
                }
            }

            // ── 攻城额外士兵（弓步兵）已删除（2026-08-16 主人定：攻城只留 5 件器械，不要弓箭手）──


            if (useNavalVisual) {
                // 航迹采样（屏幕距离判断）+ 投影（lat/lng → 屏幕坐标），后随船沿航迹排开、转弯不穿岸
                let navalTrail: { x: number; y: number }[] = navalFieldPose?.trail ?? [];
                if (!navalFieldPose && unit.id) {
                    const prev = this.navalTrailLast.get(unit.id);
                    if (!prev || Math.hypot(centerPoint.x - prev.x, centerPoint.y - prev.y) >= GlobalUnitRenderer.NAVAL_TRAIL_SAMPLE_PX) {
                        NavalPhalanxStateManager.pushTrail(unit.id, unitPos.lat, unitPos.lng);
                        this.navalTrailLast.set(unit.id, { x: centerPoint.x, y: centerPoint.y });
                    }
                    navalTrail = (NavalPhalanxStateManager.getState(unit.id)?.trail ?? []).map(p => {
                        const c = this.map.latLngToContainerPoint([p.lat, p.lng]);
                        return { x: c.x, y: c.y };
                    });
                }
                // [2026-08-27 §② 划桨随速] 用世界坐标位移/真实时间估计船速（地图平移不改变世界坐标 → 不误判为"飞快"）。
                //   归一化：海速底 ≈ 0.24 度/游戏秒 → speedFactor≈1；>1 快桨、<1 慢桨、≈0 收桨锚泊。
                let navalSpeedFactor = 1;
                if (navalFieldPose) {
                    // 海战：桨速跟轨道瞬时航速走（顺风快桨 / 顶风慢桨 / 呼吸涨缩），与行军同一归一化基准
                    navalSpeedFactor = Math.max(0.05, Math.min(2.5, navalFieldPose.speedDegPerSec / 0.24));
                } else if (unit.id) {
                    const now = performance.now();
                    const trk = this.navalSpeedTrack.get(unit.id);
                    if (trk && trk.t > 0) {
                        const dt = Math.max(0.001, (now - trk.t) / 1000);
                        const inst = Math.hypot(unitPos.lat - trk.lat, unitPos.lng - trk.lng) / dt;
                        trk.speed += (inst - trk.speed) * 0.25; // 指数平滑：跟得上但不因单帧抖动/离屏跳变乱跳
                        navalSpeedFactor = Math.max(0.05, Math.min(2.5, trk.speed / 0.24));
                    }
                    this.navalSpeedTrack.set(unit.id, { lat: unitPos.lat, lng: unitPos.lng, t: now, speed: trk?.speed ?? 0 });
                }
                // 🔴 [2026-09-02 主人「海战让后面的船保持移动时候的状态」] 海战中舰队一直在沿轨道航行，
                //    基础状态就该是 MOVE（划桨/航行），不是钉在 ATTACK 上：
                //      · ATTACK 分支帧率写死 150ms，上面刚接的轨道航速（顺风快桨/顶风慢桨）根本走不到；
                //      · drawNaval 里「沿航迹排队」也只有非静止态才成立。
                //    开炮是间歇事件，已由 naval_cannon_fire（2.6s 节流 + broadsideReady）单独演出，
                //    不靠常驻 ATTACK 帧表达。DEATH / DAMAGE / 逐舰沉没优先级更高，此处不覆盖。
                const navalAnimState = (navalFieldPose && state === 'ATTACK') ? 'MOVE' : state;
                LegionPhalanxDrawer.drawNaval(
                    ctx,
                    { x: centerPoint.x, y: centerPoint.y },
                    navalAnimState,
                    navalDir16,
                    scale * (unit.previewScale ?? 1),
                    troops,
                    Date.now(),
                    unit.factionId || 'zhonghua',
                    unit.navalShipAssetLock ?? null,
                    unit.id ?? '',
                    navalTrail,
                    navalHeadingDeg,
                    navalSpeedFactor,
                );
            } else {
                // [AI SYSTEM] Use Dedicated Legion Drawer
                const rawType = unit.legionType || 'mixed';
                const assetsId: LegionType =
                    rawType === 'cavalry' || rawType === 'archer_cavalry' || rawType === 'mixed' || rawType === 'infantry'
                        ? rawType
                        : 'mixed';

                // [2026-08-09 13场景阵型] 场景激活（跟拍双将战进 13）→ 第一排 3 步兵 → 3 组 2×4（每组 8 人）
                const sceneActive = this.isBattleScene13();
                // [2026-08-09 编队独立移动/战斗] 每编队独立推进 + 独立动作/朝向（就近咬住）
                const squadInfo = sceneActive
                    ? this.getSquadOffsets(unit, centerPoint, directionIndex, scale * (unit.previewScale ?? 1))
                    : null;
                // [2026-08-09 13战斗动作] 13 场景：整军兜底状态——编队级状态由
                // squadInfo.states 逐编队覆盖（draw 内取编队级优先）；squadInfo 为 null
                // （无目标/未就绪）时兜底静止 ATTACK（三幕制：时间轴驱动，无"整军 MOVE"兜底）
                // [2026-08-10 修·兜底空打] 13 场景整军兜底 = IDLE（持械待命）——
                // squadInfo 为 null（无目标/数据未就绪）时无编队级状态覆盖，旧兜底
                // ATTACK 让全军原地挥砍 = 「边框不挨着也空打」（主人实锤）。
                // 攻击动作只允许由编队级判定给出：边框相切（近战）/ 射程内（远程）。
                if (sceneActive) {
                    state = 'IDLE';
                }

                LegionPhalanxDrawer.draw(
                    unit.id || 'unknown',
                    ctx,
                    { x: centerPoint.x, y: centerPoint.y },
                    state,
                    directionIndex,
                    scale * (unit.previewScale ?? 1),
                    troops,
                    Date.now(),
                    false,
                    unit.currentBattleType !== null,
                    (lat: number, lng: number) => {
                        const point = this.map.latLngToContainerPoint([lat, lng]);
                        return { x: point.x, y: point.y };
                    },
                    (x: number, y: number) => {
                        const latlng = this.map.containerPointToLatLng([x, y]);
                        return { lat: latlng.lat, lng: latlng.lng };
                    },
                    unit.legionType || 'infantry',
                    unit.factionId || 'zhonghua',
                    unit.cultureSlots || null,
                    assetsId,
                    unit.isPlayer || false,
                    unit.cultureScales || null,
                    sceneActive,
                    squadInfo?.offsets ?? null,
                    squadInfo?.states ?? null,
                    squadInfo?.directions ?? null,
                    unit.formationMode ?? null,
                );
            }


            // 3. Draw Flag Body (On Top of Soldiers / Ship)
            // [NEW] Get current year for conditional flag logic
            const currentYear = (window as any).game?.timeSystem?.getYear() ?? -999;

            LegionFlagDrawer.drawFlag(
                ctx,
                { x: centerPoint.x, y: centerPoint.y },
                directionIndex,
                useNavalVisual ? scale * (unit.previewScale ?? 1) * 0.85 : scale * (unit.previewScale ?? 1),
                Date.now(),
                unit.factionId || 'panjun',
                currentYear // [NEW] Pass year
            );
        }

        // Update last position for next frame
        unit.lastPosition = { lat: unitPos.lat, lng: unitPos.lng };

        // Draw Unit Name/Info (Optional)
        this.renderInfo(ctx, centerPoint, unit, scale * (unit.previewScale ?? 1));
    }

    private renderInfo(ctx: CanvasRenderingContext2D, center: L.Point, unit: IAnimatedUnit, scale: number) {
        if (!this.showLabels) return;
        if (!unit.name) return;

        const hideCount = generalIdHasStrategicEffect(unit.generalId, 'hide_troop_count');
        const inCombat = !!(unit as any).isAttacking;
        const isMoving = !!(unit as any).destination && !(unit as any).hasArrived && !inCombat;
        // 偃旗息鼓：生效时整组军情隐藏——武将名、精锐番号、兵力均不显示。
        if (hideCount && isMoving) return;

        let generalText = '';
        let eliteText = unit.name || '';

        if (unit.generalId) {
            const genRec = getGeneralRecordByGeneralId(unit.generalId);
            if (genRec && genRec.generalName) {
                generalText = genRec.generalName;
            }
        }

        // [MATCH CITY STYLE] Position label BELOW the unit
        const useNavalVisual = !!(unit.isOnSea || unit.forceNavalVisual);
        let currentY = center.y + (useNavalVisual ? 75 : 45) * scale;

        ctx.textAlign = 'center'; 
        ctx.textBaseline = 'top';

        // 1. Draw General (if exists, Cyan)
        if (generalText) {
            const genFontSize = 13;
            ctx.font = `bold ${genFontSize}px Arial`;
            
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.lineJoin = 'round';
            ctx.strokeText(generalText, center.x, currentY);

            ctx.fillStyle = '#00FFFF'; // Bright Cyan
            ctx.fillText(generalText, center.x, currentY);
            
            currentY += genFontSize + 4;
        }

        // 2. Draw Elite / Unit Name (White)
        if (eliteText) {
            const nameFontSize = 13; // Changed back to 13 to keep name prominent
            ctx.font = `bold ${nameFontSize}px Arial`;
            
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.lineJoin = 'round';
            ctx.strokeText(eliteText, center.x, currentY);

            ctx.fillStyle = '#ffffff'; // White
            ctx.shadowBlur = 0; // Reset shadow
            ctx.fillText(eliteText, center.x, currentY);
            
            currentY += nameFontSize + 4;
        }

        // 3. Draw Troops（虚张声势 ×2；与其他视野技同步——非战移动时生效）
        const bluffCount = generalIdHasStrategicEffect(unit.generalId, 'bluff_troop_count');
        const rawTroops = Math.floor(unit.getTroops());
        const bluffMult = getBluffMagnitude(unit.generalId);
        const displayTroops = (bluffCount && isMoving) ? Math.floor(rawTroops * bluffMult) : rawTroops;
        const troopsFontSize = 12;
        const troopsText = `${displayTroops}`;
        ctx.font = `bold ${troopsFontSize}px Arial`;

        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.strokeText(troopsText, center.x, currentY);

        ctx.fillStyle = '#ffd700'; // Gold
        ctx.fillText(troopsText, center.x, currentY);
    }

    public destroy(): void {
        this.stop();
        this.canvas.remove();
        this.canvasLow.remove();
    }

    /**
     * [2026-08-09 镜头跟随·将领编队] 攻击方将领编队实时位置 = 军团渲染中心（含外推）
     * + 中心格（将领格）的编队推进偏移。编队推进后将领格离开锚点，镜头若只跟锚点
     * 会把将领编队甩出画面中心（主人：镜头要跟随将领编队）。
     */
    public getGeneralSquadCenter(unitId: string): { lat: number; lng: number } | null {
        const base = this.getRenderedCenter(unitId);
        if (!base) return null;
        const unit = this.sortedUnitsCache.find((u) => u.id === unitId);
        const count = unit?.cultureSlots?.length ?? 0;
        if (!unit || count === 0) return base;
        const mid = Math.floor(count / 2); // 3×3 中心格 = 将领格
        const off = this.squadMoveState.get(`${unitId}:${mid}`);
        if (!off) return base;
        const basePt = this.map.latLngToContainerPoint([base.lat, base.lng]);
        const directionIndex = unit.lastDirection ?? 0;
        const angle = (directionIndex + 1) * Math.PI / 4;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const sx = off.x * cos - off.y * sin;
        const sy = off.x * sin + off.y * cos;
        const ll = this.map.containerPointToLatLng(L.point(basePt.x + sx, basePt.y + sy));
        return { lat: ll.lat, lng: ll.lng };
    }

    /**
     * [2026-08-09 镜头跟随] 单位实际渲染中心（含攻城视觉外推），供战斗场景镜头对准将领编队。
     * 返回经纬度（逻辑坐标不动，只把屏幕外推换算回去）；查不到返回 null。
     */
    public getRenderedCenter(unitId: string): { lat: number; lng: number } | null {
        const unit = this.sortedUnitsCache.find((u) => u.id === unitId);
        if (!unit) return null;
        const pos = unit.getPosition();
        if (!pos || !isValidMapCoord(pos)) return null;
        let pt = this.map.latLngToContainerPoint([pos.lat, pos.lng]);
        pt = this.applySiegeVisualPush(unit, pt);
        const ll = this.map.containerPointToLatLng(pt);
        return { lat: ll.lat, lng: ll.lng };
    }

    /**
     * [2026-08-09 视觉对垒] 战场中心 = 攻方渲染中心与守军阵线锚点的中点。
     * 13 场景攻方已与城图拉开距离（SCENE13_ATTACKER_GAP_PX），镜头若仍跟攻方，
     * 城图+守军会偏出画面——镜头对准中点，攻守分居画面两侧对峙。
     * 野战无守军锚点 → 退回跟攻方渲染中心。
     */
    public getBattleSceneCenter(unitId: string): { lat: number; lng: number } | null {
        const attCenter = this.getRenderedCenter(unitId);
        if (!attCenter) return null;
        const game = (window as any).game;
        // 城从活跃攻城战取（与 renderSiegeDefenders 同源）——军团字段 targetCityId 是
        // 行军目标，攻城战开始后可能指向别的城，不能拿来找守军城（主人实锤：
        // 镜头跟攻方 → 守军+城图出画，须对准攻守中点让两军同屏）。
        const fields: any[] = game?.combatSystem?.getActiveBattleFields?.() ?? [];
        const bf = fields.find(
            (f: any) => !f?.isOver && f?.type === 'siege' && f?.hasParticipant?.(unitId),
        );
        const cityId = bf?.siegeCityId ?? null;
        if (!cityId) return attCenter; // 野战无城 → 退回跟攻方
        const city = game?.cityManager?.getCity?.(cityId);
        if (!city) return attCenter;
        const unit = this.sortedUnitsCache.find((u) => u.id === unitId);
        const pos = unit?.getPosition?.();
        if (!pos) return attCenter;
        const anchor = this.computeSiegeDefenderAnchor(city, pos);
        if (!anchor) return attCenter;
        const ll = this.map.containerPointToLatLng(anchor);
        return {
            lat: (attCenter.lat + ll.lat) / 2,
            lng: (attCenter.lng + ll.lng) / 2,
        };
    }

    /**
     * [2026-08-10 重做·千军万马统一战斗核心] 攻守共用的 9 编队战斗规则（主人拍板）：
     *  1. 每帧无条件发布本方编队位置——双方永远互相可见，无兜底攻击、无死锁；
     *  2. 每编队独立锁定最近的敌编队（目标阵亡/消失才换锁，防转圈）；
     *  3. 距离驱动三态：边框未贴上 → MOVE 走向目标；边框相切（远程 = 射程线）→ ATTACK；
     *     无敌可打 → IDLE 持械待命；
     *  4. 走到哪死到哪（阵亡保留最后位置）；被友军边框挡住 → 原地等让路（不推挤）；
     *     前排阵亡后路自然让开，后排自己压上——无排号轮换、无冲锋时间轴、无多层兜底。
     *  开场 1.5s 列阵（IDLE 对峙），之后全由距离驱动。攻守/野战/攻城同一套。
     */
    private computeSquadBattle(
        selfKey: string,
        moveKeyPrefix: string,
        factionId: string,
        origin: L.Point,
        directionIndex: number,
        sp: { x: number; y: number },
        slots: string[],
        squadTroops: number[],
        baseOff: { x: number; y: number },
    ): { offsets: { x: number; y: number }[]; states: string[]; directions: number[] } {
        // [2026-08-10 剧本法] 编队走位改由 Scene13Choreographer 接管：整军刚体平移，
        // 三状态（待命/移动/攻击），无寻敌、无碰撞、无运行时决策。
        // 规范：docs/02-design/scene13-choreography-spec.md
        return this.computeChoreographedSquads(
            selfKey, moveKeyPrefix, factionId, origin, directionIndex, sp, slots, squadTroops,
        );
    }

    /**
     * [2026-08-10 剧本法] 13 编队走位：**整个军团当一个刚体平移**，九个编队共用同一位移。
     *
     * 位置 = f(战斗进度)，单值函数 —— 同样的输入永远同样的输出，
     * 所以死锁在数学上不可能发生（旧的自主寻敌+硬碰撞是 MAPF，死锁是常态）。
     *
     * 推进量在**开战时算一次**并缓存，之后全程不重算；停止位置让两军前缘
     * 重叠 SCENE13_INTERLOCK_PX，从根上消灭「隔空空砍」。
     */
    private computeChoreographedSquads(
        selfKey: string,
        moveKeyPrefix: string,
        factionId: string,
        origin: L.Point,
        directionIndex: number,
        sp: { x: number; y: number },
        slots: string[],
        squadTroops: number[],
    ): { offsets: { x: number; y: number }[]; states: string[]; directions: number[] } {
        const count = slots.length;
        const angle = (directionIndex + 1) * Math.PI / 4;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const unitWpx = sp.x / (4.375 * 1.10);
        const unitHpx = sp.y / (2.25 * 1.10);

        // 推进量：开战算一次就锁死（敌方本帧还没发布坐标时先按 0，下一帧再算）
        let plan = this.squadAdvanceCache.get(selfKey);
        if (plan === undefined) {
            const solved = this.solveScene13Advance(
                factionId, origin, angle, cos, sin, sp, slots, unitWpx, unitHpx,
            );
            if (solved !== null) {
                plan = solved;
                this.squadAdvanceCache.set(selfKey, solved);
            }
        }
        const adv = plan?.advance ?? 0;
        const lat = plan?.lateral ?? 0;

        const { act, t } = actAt(this.scene13Progress);
        const raw = blockOffsetAt(act, t, adv);
        // 横向对齐与前压同一条时间轴（幕二一起走完），幕三保持
        const latNow = act === 'DEPLOY' ? 0 : (act === 'CHARGE' ? lat * easeInOut(t) : lat);
        const block = { x: raw.x + latNow, y: raw.y };
        // 「有没有在位移」要把横向对齐也算进去，否则只横移不前压的军团会被判成原地开打
        const motion = Math.max(adv, Math.abs(lat));

        const offsets: { x: number; y: number }[] = [];
        const states: string[] = [];
        const directions: number[] = [];
        const absPts: ({ x: number; y: number } | null)[] = [];
        const absTypes: string[] = [];

        for (let i = 0; i < count; i++) {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const gridX = (col - 1) * sp.x;
            const gridY = (row - 1) * sp.y;
            const type = slots[i] ?? 'mixed';
            const dead = (squadTroops[i] ?? 0) <= 0;

            // [2026-08-11 按格位查表] 前排咬 / 弓弩放箭 / 两翼骑兵递次投入 / 主将压阵。
            // 主将格（4）的 offset 恒等于刚体位移 → 镜头跟拍不受侧翼补间影响。
            const plan13 = slotPlanAt(act, t, i, block, sp, motion);
            const off = plan13.offset;

            offsets.push(off);
            states.push(dead ? 'DEATH' : plan13.state);
            // 朝向只有一个来源：阵型正前方（旧版「移动沿正前方、脸朝目标」两个信号源打架）
            directions.push(directionIndex);
            // 🔴 用 moveKeyPrefix 不是 selfKey：getGeneralSquadCenter 按 `<unitId>:4` 查将领格
            // 偏移给镜头用，写成 `atk_<unitId>:4` 会让镜头跟丢（2026-08-10 接线时踩过）
            this.squadMoveState.set(`${moveKeyPrefix}:${i}`, off);

            const ax = origin.x + ((gridX + off.x) * cos - (gridY + off.y) * sin);
            const ay = origin.y + ((gridX + off.x) * sin + (gridY + off.y) * cos);
            absPts.push(dead ? null : { x: ax, y: ay }); // 阵亡不占位
            absTypes.push(type);

            this.recordScene13Probe(
                selfKey, factionId, i, type, dead ? 'DEATH' : plan13.state,
                null, null, `${act}:${adv.toFixed(0)}`, this.scene13Progress,
            );
        }

        this.publishSquadPositions(selfKey, factionId, absPts, absTypes, angle, unitWpx, unitHpx);
        return { offsets, states, directions };
    }

    /**
     * [2026-08-10 剧本法] 开战一次性求「整军该往前压多少 px」。
     * 让**我方前排**与**正前方最近的敌方编队**外框重叠 SCENE13_INTERLOCK_PX。
     * 正前方查不到敌人（对面本帧未发布）→ 返回 null，调用方下一帧再试。
     */
    private solveScene13Advance(
        factionId: string,
        origin: L.Point,
        angle: number,
        cos: number,
        sin: number,
        sp: { x: number; y: number },
        slots: string[],
        unitWpx: number,
        unitHpx: number,
    ): { advance: number; lateral: number } | null {
        const frontType = slots[1] ?? slots[0] ?? 'mixed';
        const frontLocalY = -sp.y; // 前排（row 0）在本地坐标的纵深
        // 本地 (0, frontLocalY) → 屏幕：x = ox + (lx·cos − ly·sin)、y = oy + (lx·sin + ly·cos)
        const frontAbs = {
            x: origin.x - frontLocalY * sin,
            y: origin.y + frontLocalY * cos,
        };

        let bestEy: number | null = null;
        let bestHit: SquadHit | null = null;
        // [2026-08-10 修·两军不在一条水平线上] 只做「沿正前方推进」而不做横向对齐，
        // 两军左右错开多少就一直错开多少（野战有 solveSceneFieldAlign 镜像对位，攻城完全没有）。
        // 这里统计正前方敌军的横向中心，双方各挪一半，在中轴上对齐。
        let exSum = 0;
        let exCount = 0;
        for (const [key, entry] of this.squadPosRegistry) {
            if (entry.factionId === factionId) continue;
            if (this.squadRegistryFrame - entry.frame > 1) continue;
            if (key.startsWith('city_')) continue; // 城图不是「敌方战线」，攻城由守军编队定线
            for (let i = 0; i < entry.pts.length; i++) {
                const p = entry.pts[i];
                if (!p) continue;
                const ey = -(p.x - origin.x) * sin + (p.y - origin.y) * cos;
                if (ey >= frontLocalY) continue; // 只认正前方（身后/齐平的不算战线）
                exSum += (p.x - origin.x) * cos + (p.y - origin.y) * sin;
                exCount++;
                if (bestEy === null || ey > bestEy) {
                    bestEy = ey;
                    bestHit = {
                        pt: p, type: entry.types[i] ?? 'mixed',
                        angle: entry.angle, dw: entry.dw, dh: entry.dh,
                    };
                }
            }
        }
        if (bestEy === null || !bestHit) return null;

        // 两个外框「刚好相切」的中心距 → 再减咬合量 = 我们要停的中心距
        const contact = this.squadContactDistance(
            frontAbs, frontType, angle, unitWpx, unitHpx, bestHit,
        );
        // 🔴 各走一半（纵向和横向都是）：双方都在压上，各按「整段距离」走就会**对穿过去**，
        // 攻方走到守方的位置、守方走到攻方的位置，然后两边对着空气砍
        // （2026-08-10 实锤，我第一版只把横向减半、纵向忘了减）。
        // 合起来正好闭合整段间隙，停在两军前缘重叠 SCENE13_INTERLOCK_PX 的位置。
        const closing = (frontLocalY - bestEy) - contact * SCENE13_CONTACT_RATIO;
        const lateral = exCount > 0 ? (exSum / exCount) * 0.5 : 0;
        return { advance: Math.max(0, closing * 0.5), lateral };
    }

    /** @deprecated 2026-08-10 剧本法接管后不再调用；确认新版稳定后整段删除 */
    private computeSquadBattleLegacy(
        selfKey: string,
        moveKeyPrefix: string,
        factionId: string,
        origin: L.Point,
        directionIndex: number,
        sp: { x: number; y: number },
        slots: string[],
        squadTroops: number[],
        baseOff: { x: number; y: number },
    ): { offsets: { x: number; y: number }[]; states: string[]; directions: number[] } {
        const count = slots.length;
        const angle = (directionIndex + 1) * Math.PI / 4;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const unitWpx = sp.x / (4.375 * 1.10);
        const unitHpx = sp.y / (2.25 * 1.10);
        const claims = this.frameClaims;
        const scene = (window as any).game?.battleScene;
        const paused = scene?.pauseHook?.isGamePaused?.() === true
            && scene?.isStrategyPausedByScene?.() !== true;
        const deploying = (Date.now() - this.battlePhaseStart) / 1000 < 1.5;
        // 列阵/暂停期不移动（dt=0），状态照常判定（已贴身的可以打，没贴身的站着）
        const dtSec = (paused || deploying) ? 0 : this.frameDeltaMs / 1000;

        const out: { x: number; y: number }[] = [];
        const states: string[] = [];
        const directions: number[] = [];
        const absPts: ({ x: number; y: number } | null)[] = [];
        const absTypes: string[] = [];

        // 朝向：本地方向 → 屏幕 → 官方 8 向映射（与整军朝向同一套，勿手搓镜像）
        const faceLocal = (ldx: number, ldy: number): number => {
            const sx2 = ldx * cos - ldy * sin;
            const sy2 = ldx * sin + ldy * cos;
            if (Math.abs(sx2) < 1e-6 && Math.abs(sy2) < 1e-6) return directionIndex;
            return OrientationSystem.get8DirectionFromAngle(
                Math.atan2(-sy2, sx2) * (180 / Math.PI),
            );
        };

        // [2026-08-10 修·一路不动] 敌方**战线**在本阵型本地坐标里的纵深位置（取最靠近我方的那个，
        // 即 local y 最大者）。推进距离一律用它量，**不用各自目标量**——
        // 病根：上一版拿「我的目标」的正前方投影当剩余行程，而目标是就近咬的、常常偏在侧翼
        // （实测一帧里 4 个编队同咬 def:8），偏侧的目标投影 ≤ 0 → step ≤ 0 → 整路编队钉死
        // （主人实锤「有一路不动」）。打谁（target）和走多远（战线）本来就是两件事，就此分开。
        const enemyLocalYs: number[] = [];
        for (const [, entry] of this.squadPosRegistry) {
            if (entry.factionId === factionId) continue;
            if (this.squadRegistryFrame - entry.frame > 1) continue;
            for (const p of entry.pts) {
                if (!p) continue; // 阵亡编队不算战线
                enemyLocalYs.push(-(p.x - origin.x) * sin + (p.y - origin.y) * cos);
            }
        }
        /** 「我正前方最近的那个敌人」的纵深（本地 −y 为前）；正前方无敌人返回 null。
         *  🔴 必须只看正前方：攻城时守军绕城铺开，总有几队在攻方**侧后方**，它们的 local y
         *  比我还大。上一版取全体最大值当战线 → 一个绕到背后的敌人就把整支军队的推进额度
         *  污染成负数 → 全军 step≤0 站死（实测马格德堡 18 编队里 13 个卡住）。 */
        const frontLineY = (myY: number): number | null => {
            let best: number | null = null;
            for (const ey of enemyLocalYs) {
                if (ey >= myY) continue; // 在我身后/齐平的不算战线
                if (best === null || ey > best) best = ey;
            }
            return best;
        };

        for (let i = 0; i < count; i++) {
            const r = Math.floor(i / 3);
            const c = i % 3;
            const gridX = (c - 1) * sp.x;
            const gridY = (r - 1) * sp.y;
            const type = slots[i] ?? 'mixed';
            const moveKey = `${moveKeyPrefix}:${i}`;
            const prev = this.squadMoveState.get(moveKey) ?? { x: baseOff.x, y: baseOff.y };

            // 阵亡：走到哪死到哪（保留最后位置），不发布（对面不再咬它）
            if (squadTroops[i] <= 0) {
                out.push(prev);
                states.push('DEATH');
                directions.push(directionIndex);
                absPts.push(null);
                absTypes.push(type);
                this.squadTargetLock.delete(`${selfKey}:${i}`);
                continue;
            }

            let offX = prev.x;
            let offY = prev.y;
            let state = 'IDLE';
            let dirIdx = directionIndex;

            const absX = origin.x + ((gridX + offX) * cos - (gridY + offY) * sin);
            const absY = origin.y + ((gridX + offX) * sin + (gridY + offY) * cos);

            // 目标锁：锁着的还活着就继续咬，死了/过期才重新找最近的
            const lockKey = `${selfKey}:${i}`;
            let target: SquadHit | null = null;
            const lockedCk = this.squadTargetLock.get(lockKey);
            if (lockedCk) target = this.lookupSquad(lockedCk, factionId);
            if (!target) {
                const found = this.findNearestEnemySquad(factionId, { x: absX, y: absY }, claims);
                if (found) {
                    target = found;
                    this.squadTargetLock.set(lockKey, found.key);
                } else {
                    this.squadTargetLock.delete(lockKey);
                }
            }

            if (target) {
                const pickedKey = this.squadTargetLock.get(lockKey) ?? null; // 探针用，见下方说明
                // 停止线：近战 = 双方边框相切（与视觉框同源）；远程 = 射程
                const range = LegionPhalanxDrawer.isRangedType(type)
                    ? (GlobalUnitRenderer.SQUAD_STOP_DIST_PX[type] ?? 500)
                    : this.squadContactDistance(
                        { x: absX, y: absY }, type, angle, unitWpx, unitHpx, target,
                    );
                const dist = Math.hypot(target.pt.x - absX, target.pt.y - absY);
                const tlx = (target.pt.x - origin.x) * cos + (target.pt.y - origin.y) * sin;
                const tly = -(target.pt.x - origin.x) * sin + (target.pt.y - origin.y) * cos;
                const dxT = tlx - (gridX + offX);
                const dyT = tly - (gridY + offY);
                const lenT = Math.hypot(dxT, dyT) || 1;
                dirIdx = faceLocal(dxT / lenT, dyT / lenT); // 永远面向自己的目标
                // [2026-08-10 修·斜对着挤成一团] 推进方向 = **阵型正前方**（本地 −y），
                // 不再是「朝自己目标的连续方向」。野战攻城同一套，13 不分战型。
                //
                // 病根（主人实锤「正对着还好，斜对着就不行，只有一组编队在打」+ 探针实测）：
                //   阵型格位按 8 向**量化**朝向铺（angle = (dir+1)×π/4），但推进却走连续方向，
                //   两者最多差 22.5°。探针实测行进距离 1000~1900px →
                //   1500 × sin(22.5°) ≈ 574px 侧向漂移 > 一个格位间距（两三百 px）→
                //   每个编队都横着挤进邻居的格子 → squadBlockedByAlly 恒真 →
                //   18 个编队里 5~11 个集体站死（守军最惨 9 格里 6 格 IDLE = 「防守方整体不动」）。
                //   正对着时量化误差≈0，各走各的道，所以没事——这就是「斜的才坏」的由来。
                //
                // 现在：九个编队沿同一条轴一线压上，各走各的道，永不串道。
                // 目标只决定**打谁**和**出帧朝哪面**（dirIdx 上面已按目标算好），不再决定行进方向。
                /** 沿阵型正前方还能压多少（本地 −y 为前）：量的是**敌方战线**，不是我这个目标。
                 *  战线查不到（对面本帧没发布）时退回用目标投影，保持旧行为不至于原地不动。 */
                const lineY = frontLineY(gridY + offY);
                const forwardRemain = lineY !== null ? (gridY + offY) - lineY : -dyT;
                if (dist <= range + GlobalUnitRenderer.SQUAD_ARRIVE_EPS_PX) {
                    state = 'ATTACK'; // 边框相切 / 射程内 → 开战
                } else if (dtSec > 0) {
                    // 两个上限取小：① 直线距离还差多少 ② 沿推进轴还能压多少（不越过战线）
                    const room = Math.min(dist - range, forwardRemain - range);
                    const step = Math.min(GlobalUnitRenderer.SCENE13_CHARGE_SPEED_PX * dtSec, room);
                    if (step <= 0) {
                        // 已经压到敌方战线上，边框却还没贴上 → 说明咬的目标偏在侧翼、够不着。
                        // [2026-08-10 修·目标锁固化] 解锁重选：squadTargetLock 原本只在目标阵亡时
                        // 才放，开局挤到同一个目标上就固化一整场——实测邯郸守军 9 格里 6 格全咬
                        // atk:8（1000px 外的侧翼弩兵），集体够不着又不换人 = 主人实锤「防守方全不动」。
                        // 认领上限 2 拦不住这种情况：锁着的编队不再消耗认领配额。
                        this.squadTargetLock.delete(lockKey);
                        state = 'IDLE'; // 本帧原地待命，下一帧按最近重选
                    } else {
                        const ny = offY - step; // 本地 −y = 阵型正前方
                        const nextAbs = {
                            x: origin.x + ((gridX + offX) * cos - (gridY + ny) * sin),
                            y: origin.y + ((gridX + offX) * sin + (gridY + ny) * cos),
                        };
                        if (this.squadBlockedByAlly(
                            factionId, selfKey, i, nextAbs, type, angle, unitWpx, unitHpx,
                        )) {
                            // [2026-08-10 修·后排远程站死] 远程被自家前排挡住 = 它已经在
                            // 该待的阵位上了 → 原地放箭。弓手本来就该站阵后射，不该挤前排；
                            // 旧写法一律 IDLE，等的是一个永远不会让开的前排（主人实锤后排弓手不动）。
                            state = LegionPhalanxDrawer.isRangedType(type) ? 'ATTACK' : 'IDLE';
                        } else {
                            state = 'MOVE'; // 一线压上（走路动画）
                            offY = ny;
                            dirIdx = directionIndex; // [2026-08-10 修] 移动时强制面向正前方，解决侧身平移的视觉 Bug
                        }
                    }
                }
                // dtSec = 0（列阵/暂停）→ 未贴身保持 IDLE，位置不动
                // 目标键要在**进入推进分支之前**取：那里够不着会 delete 掉锁，
                // 取晚了探针会把「本帧刚解锁重选」误报成「无目标」（自己坑过一次）
                this.recordScene13Probe(selfKey, factionId, i, type, state, dist, range,
                    pickedKey, dtSec);
            } else {
                this.recordScene13Probe(selfKey, factionId, i, type, state, null, null,
                    null, dtSec);
            }

            out.push({ x: offX, y: offY });
            this.squadMoveState.set(moveKey, { x: offX, y: offY });
            states.push(state);
            directions.push(dirIdx);
            absPts.push({
                x: origin.x + ((gridX + offX) * cos - (gridY + offY) * sin),
                y: origin.y + ((gridX + offX) * sin + (gridY + offY) * cos),
            });
            absTypes.push(type);
        }
        // 无条件发布：双方永远互相可见（死锁从根上消除）
        this.publishSquadPositions(selfKey, factionId, absPts, absTypes, angle, unitWpx, unitHpx);
        return { offsets: out, states, directions };
    }

    /** 按锁定键取敌方编队当前数据；过期/阵亡/同势力返回 null（触发重选目标） */
    private lookupSquad(ck: string, myFactionId: string): SquadHit | null {
        const idx = ck.lastIndexOf(':');
        if (idx <= 0) return null;
        const entry = this.squadPosRegistry.get(ck.slice(0, idx));
        if (!entry || entry.factionId === myFactionId) return null;
        if (this.squadRegistryFrame - entry.frame > 1) return null;
        const si = Number(ck.slice(idx + 1));
        const p = entry.pts[si];
        if (!p) return null;
        return {
            pt: p,
            type: entry.types[si] ?? 'mixed',
            angle: entry.angle,
            dw: entry.dw,
            dh: entry.dh,
        };
    }

    /** 攻方/野战军团：9 编队战斗（统一核心的军团入口） */
    private getSquadOffsets(
        unit: IAnimatedUnit,
        centerPoint: L.Point,
        directionIndex: number,
        scale: number,
    ): { offsets: { x: number; y: number }[]; states: string[]; directions: number[] } | null {
        if (!this.isBattleScene13()) return null;
        const count = unit.cultureSlots?.length ?? 0;
        if (count === 0) return null;
        const squadTroops = this.computeSquadTroops(unit.id ?? 'unknown', unit.getTroops(), count);
        const sp = LegionPhalanxDrawer.getDenseSquadSpacing(
            unit.legionType || 'mixed',
            unit.legionType || 'infantry',
            directionIndex,
            scale,
            unit.cultureScales || null,
        );
        if (!sp) return null;
        return this.computeSquadBattle(
            `atk_${unit.id}`,
            `${unit.id}`,
            unit.factionId || 'unknown',
            centerPoint,
            directionIndex,
            sp,
            unit.cultureSlots ?? [],
            squadTroops,
            { x: 0, y: 0 },
        );
    }

    /** 攻城守军：9 编队战斗（统一核心的守军入口；keepOut = 整片站到城图外） */
    private getDefenderSquadOffsets(
        key: string,
        anchor: L.Point,
        directionIndex: number,
        scale: number,
        cultureSlots: string[],
        cultureScales: number[] | null,
        targetPoint: L.Point | null,
        defFactionId: string,
        defTroops: number,
    ): { offsets: { x: number; y: number }[]; states: string[]; directions: number[] } | null {
        const count = cultureSlots.length;
        if (count === 0) return null;
        const squadTroops = this.computeSquadTroops(key, defTroops, count);
        const sp = LegionPhalanxDrawer.getDenseSquadSpacing(
            'mixed', cultureSlots[0] ?? 'infantry', directionIndex, scale, cultureScales,
        );
        if (!sp) return null;
        // keepOut：守军初始整片外推出城图（沿面向攻方方向）；开战后位置交给统一核心。
        const keepOut = sp.y * 1.1;
        let bx = keepOut;
        let by = 0;
        if (targetPoint) {
            const angle = (directionIndex + 1) * Math.PI / 4;
            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);
            const rx = targetPoint.x - anchor.x;
            const ry = targetPoint.y - anchor.y;
            const tx = rx * cosA + ry * sinA;
            const ty = -rx * sinA + ry * cosA;
            const len = Math.hypot(tx, ty) || 1;
            bx = (tx / len) * keepOut;
            by = (ty / len) * keepOut;
        }
        return this.computeSquadBattle(
            `def_${key}`,
            key,
            defFactionId,
            anchor,
            directionIndex,
            sp,
            cultureSlots,
            squadTroops,
            { x: bx, y: by },
        );
    }

    /**
     * 攻城守军阵线锚点：**据点边缘线上**（中心锚点 = 城图框缘，主人 2026-08-09 定稿）。
     * 供守军 9 编队渲染 + 攻方编队推进目标共用。
     * dir = 城中心 → 攻方方向；锚点 = 城心 + dir × halfPx（正好在面向攻方那侧的城图边缘）。
     * （🔴 2026-08-09 修：原代码「城心 - dir×…」= 城图背对攻方侧，守军永远不显示；
     *   后改 0.82 内收 = 锚点在城内 85px，主人定稿改为 1.0 = 中心锚点在据点边缘。）
     */
    private computeSiegeDefenderAnchor(
        city: { latitude: number; longitude: number; troops?: number },
        atkPos: { lat: number; lng: number },
        /** [2026-08-10 据点外框] 额外外推像素：守军 3×3 的**半个阵深**，
         *  让守军整片站在城图之外而不是压在城墙上（主人定：防守方也不和据点重叠）。
         *  中心格因此正好离城一个半阵深，最后一排贴着城边缘。 */
        extraOutPx = 0,
    ): L.Point | null {
        const zoom = this.map.getZoom();
        const cityPt = this.map.latLngToContainerPoint([city.latitude, city.longitude]);
        const screenW = getSiegeCityScreenWidthPx(zoom);
        const halfW = screenW / 2;
        const halfH = halfW * GlobalUnitRenderer.CITY_ICON_HW_RATIO;
        const dx = atkPos.lng - city.longitude;
        const dy = atkPos.lat - city.latitude;
        const len = Math.hypot(dx, dy) || 1;
        const cosA = Math.abs(dx) / len;
        const sinA = Math.abs(dy) / len;
        const halfPx = halfW * cosA + halfH * sinA; // 沿攻方方向的城图半投影
        const dirX = dx / len;
        const dirY = dy / len;
        const out = halfPx + extraOutPx;
        return L.point(
            cityPt.x + dirX * out,
            cityPt.y + dirY * out,
        );
    }

    /**
     * [2026-08-09 独立战斗场景] 攻城战守军 9 编队渲染（城图边缘，面向攻方）。
     * 守方是 city 单位，不注册到 GlobalUnitRenderer → 平时不画士兵；
     * 仅场景激活（进 13）时由渲染循环补画：按城市文化区生成 9 槽编队，
     * 锚点在城图边缘内侧（攻方方向的反侧，贴城墙），朝向攻方军团。
     */
    private renderSiegeDefenders(ctx: CanvasRenderingContext2D): void {
        const game = (window as any).game;
        if (!game?.combatSystem || !game?.cityManager) return;
        const followedId = game.cameraFollowUI?.getFollowedArmyId?.();
        if (!followedId) return;

        // 找跟拍军团参与的活跃攻城战
        const fields: any[] = game.combatSystem.getActiveBattleFields?.() ?? [];
        for (const bf of fields) {
            if (bf?.type !== 'siege' || !bf.siegeCityId) continue;
            if (!bf.hasParticipant?.(followedId)) continue;

            const city = game.cityManager.getCity?.(bf.siegeCityId);
            if (!city || city.troops <= 0) continue;

            // 攻方军团位置（决定守军朝向与城图哪侧）
            const attackerUnits: any[] = bf.getAttackerUnits?.() ?? [];
            const attacker = attackerUnits.find((u: any) => u.id === followedId)
                ?? attackerUnits[0];
            const atkPos = attacker?.getPosition?.();
            if (!atkPos) continue;

            // 守军锚点：城图边缘内侧（贴城墙），面向攻方（攻方编队推进共用同一锚点）
            const anchor = this.computeSiegeDefenderAnchor(city, atkPos);
            if (!anchor) continue;

            // 守军编队：按城市势力专属或文化区生成 9 槽（与攻方军团同一套）
            const region = (city.region ?? 'CENTRAL') as any;
            const factionSlots = city.factionId ? getFactionCompositionSlots(city.factionId) : null;
            const tier = factionSlots ? { slots: factionSlots } : getCultureTier(region, city.troops);
            const slots = tier?.slots;
            if (!slots || slots.length === 0) continue;
            const cultureSlots = expandCompositionSlots(slots);
            const cultureScales = expandCompositionScales(slots);

            const zoom = this.map.getZoom();
            const scale = Math.pow(2, Math.min(zoom, 10) - 9) * 0.7;
            // 守军面向攻方 = 城中心 → 攻方方向
            const directionIndex = OrientationSystem.get8DirectionIndex(
                { lat: city.latitude, lng: city.longitude },
                { lat: atkPos.lat, lng: atkPos.lng },
            );

            // [2026-08-09 守军推进] 守军目标 = 攻方将领编队实时位置（双方对攻，城图只是背景图）
            const generalCenter = this.getGeneralSquadCenter(followedId);
            const defTarget = generalCenter
                ? this.map.latLngToContainerPoint([generalCenter.lat, generalCenter.lng])
                : null;
            const defKey = `def_${city.id}`;
            const defOffsets = this.getDefenderSquadOffsets(
                defKey, anchor, directionIndex, scale, cultureSlots, cultureScales, defTarget,
                city.factionId || 'unknown',
                city.troops, // [2026-08-09 编队级阵亡] 守军总兵力 → 每编队独立扣减
            );
            // 守军动作兜底：编队级状态由 defOffsets.states 逐编队覆盖（draw 内取编队级优先）；
            // [2026-08-10 修·兜底空打] defOffsets 为 null（无目标）时兜底 IDLE 持械待命——
            // 旧兜底 ATTACK = 守军全队原地挥砍（边框不挨着也空打）。攻击动作只由编队级判定给。
            const defState: PhalanxAnimState = 'IDLE';

            LegionPhalanxDrawer.draw(
                `siege_defender_${city.id}`,
                ctx,
                { x: anchor.x, y: anchor.y },
                defState,
                directionIndex,
                scale,
                city.troops,
                Date.now(),
                false,
                true,
                (lat: number, lng: number) => {
                    const p = this.map.latLngToContainerPoint([lat, lng]);
                    return { x: p.x, y: p.y };
                },
                (x: number, y: number) => {
                    const ll = this.map.containerPointToLatLng([x, y]);
                    return { lat: ll.lat, lng: ll.lng };
                },
                'mixed',
                city.factionId || 'panjun',
                cultureSlots,
                'mixed',
                false,
                cultureScales,
                true, // denseFront → 9 编队展开
                defOffsets?.offsets ?? null,
                defOffsets?.states ?? null,
                defOffsets?.directions ?? null,
            );

            // [2026-08-10 据点 = 守方编队] 城图外框 + 发布城图编队：
            //  1) 城图外框（13 场景调试可视化，与编队框同款青色）：尺寸 = 城图实际大小
            //     （halfW×halfH 与 cityKeepOutDistance / computeSiegeDefenderAnchor 同源），
            //     攻方咬城 / 防重叠都以它为准——框相切 = 编队碰上城图边缘。
            //  2) 城图发布为「守方一个不可动的编队」（独立 key `city_${cityId}`）：
            //     攻方 findNearest 可咬城（守军全灭后城图成为最近目标 → 攻方打城）；
            //     守军按势力跳过自己的城（city.factionId === 守军势力）→ 不咬自己。
            //     城图位置固定（城中心，不移动）；dw/dh = 城图全尺寸，type='city' 支撑
            //     半径 = 城图矩形投影（getSquadSupportRadius city 分支）。
            const cityPt = this.map.latLngToContainerPoint([city.latitude, city.longitude]);
            const halfW = getSiegeCityScreenWidthPx(zoom) / 2;
            const halfH = halfW * GlobalUnitRenderer.CITY_ICON_HW_RATIO;
            if (import.meta.env.DEV) {
                ctx.save();
                ctx.strokeStyle = 'rgba(0, 230, 255, 0.85)';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(cityPt.x - halfW, cityPt.y - halfH, halfW * 2, halfH * 2);
                ctx.restore();
            }
            this.publishSquadPositions(
                `city_${city.id}`, city.factionId || 'unknown',
                [cityPt], ['city'], 0, halfW * 2, halfH * 2,
            );
            break; // 一场跟拍攻城战只画一次守军
        }
    }
}
