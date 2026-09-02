/**
 * 军团卡死看门狗（DEV 专用诊断，不改任何玩法）。
 *
 * 起因（2026-09-01 主人实锤）：跟拍的「布拉斯莱索 率 要塞守备」884 兵停在卡塔赫纳外海，
 * 游戏时间照常推进（军情在刷），船一动不动 = 卡在水路上。
 * 现场状态只存在于主人那一局的内存里，命令行审计（路网连通性、海路数据）全过关，
 * 所以只能在**运行时**把卡住那一刻的状态抓下来。
 *
 * 判据：非战斗、非战后休整、非集结期的军团，连续 STUCK_SEC 游戏秒位移 < MOVE_EPS_DEG。
 * 抓到就把军团 + AI 上下文的关键字段 POST 到 /api/stuck-legion 落盘
 * （scratch/stuck_legion_latest.json + stuck_legion_log.jsonl），供 AI 直接读。
 *
 * 🔴 只诊断，不自愈：根因未定，先拿数据；确定成因后再决定要不要在引擎里兜底。
 */
import type { Army } from '../legion/Army';

/** 视为「没动」的位移阈值（度）：0.0005° ≈ 55 m，远小于一帧正常步距 */
const MOVE_EPS_DEG = 0.0005;
/** 连续静止多少游戏秒判定为卡死 */
const STUCK_SEC = 90;
/** 采样间隔（游戏秒）：不必每帧比 */
const SAMPLE_SEC = 1;
/** 同一批诊断的上报间隔（真实毫秒） */
const REPORT_INTERVAL_MS = 30_000;

interface Sample {
    lat: number;
    lng: number;
    stillSec: number;
    reported: boolean;
}

const samples = new Map<string, Sample>();
let sinceSampleSec = 0;
let lastReportAt = 0;

function aiSnapshot(armyId: string): Record<string, unknown> | null {
    const controller = (window as unknown as { game?: { aiController?: unknown } }).game?.aiController as
        | { armyContexts?: Map<string, Record<string, unknown>> }
        | undefined;
    const ctx = controller?.armyContexts?.get(armyId);
    if (!ctx) return null;
    return {
        strategicTargetCityId: ctx.strategicTargetCityId ?? null,
        strategicTargetArmyId: ctx.strategicTargetArmyId ?? null,
        targetCityId: ctx.targetCityId ?? null,
        lastMoveResult: ctx.lastMoveResult ?? null,
    };
}

function describe(army: Army, stillSec: number): Record<string, unknown> {
    const pos = army.getPosition();
    const target = army.getTargetCity?.();
    // 行军内部量（hasArrived/pathQueue/destination/地形倍率）是 private，诊断只读不写
    const inner = army as unknown as {
        hasArrived?: boolean;
        pathQueue?: unknown[];
        destination?: { lat: number; lng: number };
        currentTerrainMultiplier?: number;
    };
    return {
        id: army.id,
        name: army.name,
        faction: army.getFactionId(),
        troops: army.getTroops(),
        stillSec: Math.round(stillSec),
        pos: { lat: +pos.lat.toFixed(5), lng: +pos.lng.toFixed(5) },
        isOnSea: army.isOnSea,
        idle: army.isIdle?.() ?? null,
        marching: army.isMarching?.() ?? null,
        hasArrived: inner.hasArrived ?? null,
        pathQueueLen: inner.pathQueue?.length ?? null,
        destination: inner.destination ?? null,
        terrainMult: +(inner.currentTerrainMultiplier ?? 0).toFixed(3),
        inCombat: army.getIsInCombat?.() ?? null,
        blocked: army.isBlocked?.() ?? null,
        postBattleRest: army.isPostBattleResting?.() ?? null,
        targetCity: target ? { id: target.id, name: target.name, faction: target.factionId } : null,
        expeditionTargetCityId: army.expeditionTargetCityId ?? null,
        homeCityId: army.homeCityId ?? null,
        savedMarch: army.hasSavedMarchState?.() ?? null,
        waitingSiege:
            (window as unknown as { game?: { legionManager?: { isArmyWaitingSiege?: (id: string) => boolean } } })
                .game?.legionManager?.isArmyWaitingSiege?.(army.id) ?? null,
        ai: aiSnapshot(army.id),
    };
}

/**
 * 每帧调用（LegionManager.update 尾部）。deltaSec = 本帧游戏秒。
 * 只在 dev 下工作；生产构建里调用点自身被 import.meta.env.DEV 挡掉。
 */
export function tickStuckLegionWatchdog(armies: readonly Army[], deltaSec: number): void {
    if (deltaSec <= 0) return;
    sinceSampleSec += deltaSec;
    if (sinceSampleSec < SAMPLE_SEC) return;
    const elapsed = sinceSampleSec;
    sinceSampleSec = 0;

    const alive = new Set<string>();
    const stuck: Record<string, unknown>[] = [];

    for (const army of armies) {
        if (army.isDestroyed || army.getTroops() <= 0) continue;
        alive.add(army.id);
        const pos = army.getPosition();
        if (!Number.isFinite(pos.lat) || !Number.isFinite(pos.lng)) continue;

        const prev = samples.get(army.id);
        const excused = army.getIsInCombat?.() || army.isPostBattleResting?.() || army.isBlocked?.();
        if (!prev || excused || Math.hypot(pos.lat - prev.lat, pos.lng - prev.lng) >= MOVE_EPS_DEG) {
            samples.set(army.id, { lat: pos.lat, lng: pos.lng, stillSec: 0, reported: false });
            continue;
        }

        prev.stillSec += elapsed;
        if (prev.stillSec >= STUCK_SEC) {
            stuck.push(describe(army, prev.stillSec));
            if (!prev.reported) {
                prev.reported = true;
                console.warn(
                    `🚧 [StuckLegion] ${army.name}（${army.getFactionId()}，${army.getTroops()} 兵）`
                    + `${army.isOnSea ? '在海上' : '在陆上'}静止 ${Math.round(prev.stillSec)} 游戏秒 —— 已落盘诊断`
                );
            }
        }
    }

    for (const id of samples.keys()) {
        if (!alive.has(id)) samples.delete(id);
    }

    if (stuck.length === 0) return;
    const now = performance.now();
    if (now - lastReportAt < REPORT_INTERVAL_MS) return;
    lastReportAt = now;

    const game = (window as unknown as { game?: { timeSystem?: { getYear?: () => number } } }).game;
    const payload = {
        at: new Date().toISOString(),
        year: game?.timeSystem?.getYear?.() ?? null,
        stuckCount: stuck.length,
        armies: stuck,
    };
    void fetch('/api/stuck-legion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    }).catch(() => { /* 诊断落盘失败不影响游戏 */ });
}
