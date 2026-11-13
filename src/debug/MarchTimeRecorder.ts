/**
 * 编年史行军计时（2026-11-14 主人令「记录战略地图上的移动时间，为将来改写战略背景播报做准备」）。
 *
 * 每场编年史之战：随行军团从开拔 → 每个史载途经地 → 抵达战场，记现实秒（游戏暂停不计）与路程公里。
 * 抵达战场时落盘一条（复用 /api/stuck-legion，probe:'march-time'，追加到 scratch/stuck_legion_log.jsonl；
 * 不新增 vite 中间件——改 vite.config 会整页刷新）。汇总：node scratch/march_time_report.mjs
 * 只记录，不影响玩法；仅 DEV 生效。
 */

interface LatLng { lat: number; lng: number }

interface MarchLeg {
    /** 到达的途经地 / 战场名 */
    to: string;
    sec: number;
    km: number;
}

interface MarchRun {
    battleId: string;
    title: string;
    legion: string;
    from: string;
    chained: boolean;
    startedAt: string;
    activeMs: number;
    km: number;
    legMs: number;
    legKm: number;
    legs: MarchLeg[];
    lastT: number;
    lastPos: LatLng;
}

/** 两次采样间隔上限：战术战场、切后台等长空档不计入行军时间 */
const MAX_SAMPLE_GAP_MS = 2000;

function haversineKm(a: LatLng, b: LatLng): number {
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const h = Math.sin(dLat / 2) ** 2
        + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function isGamePaused(): boolean {
    const g = (window as unknown as { game?: { timeSystem?: { isGamePaused?: () => boolean } } }).game;
    return g?.timeSystem?.isGamePaused?.() === true;
}

class MarchTimeRecorder {
    private run: MarchRun | null = null;

    /** 随行军团开拔（新的一场开始；上一场没到战场就作废） */
    begin(battleId: string, title: string, legion: string, from: string, pos: LatLng, chained: boolean): void {
        if (!import.meta.env.DEV) return;
        this.run = {
            battleId, title, legion, from, chained,
            startedAt: new Date().toISOString(),
            activeMs: 0, km: 0, legMs: 0, legKm: 0, legs: [],
            lastT: performance.now(), lastPos: { ...pos },
        };
    }

    /** 每拍采样：累计非暂停的现实时间与走过的路程 */
    sample(battleId: string, pos: LatLng): void {
        const r = this.run;
        if (!r || r.battleId !== battleId) return;
        const now = performance.now();
        const dt = now - r.lastT;
        r.lastT = now;
        if (!isGamePaused() && dt <= MAX_SAMPLE_GAP_MS) {
            r.activeMs += dt;
            r.legMs += dt;
        }
        const km = haversineKm(r.lastPos, pos);
        r.km += km;
        r.legKm += km;
        r.lastPos = { ...pos };
    }

    /** 到达一个史载途经地 */
    stop(battleId: string, name: string, pos: LatLng): void {
        const r = this.run;
        if (!r || r.battleId !== battleId) return;
        this.sample(battleId, pos);
        r.legs.push({ to: name, sec: +(r.legMs / 1000).toFixed(1), km: Math.round(r.legKm) });
        r.legMs = 0;
        r.legKm = 0;
    }

    /** 抵达战场：收尾落盘（同一场只落一次） */
    arrive(battleId: string, pos: LatLng): void {
        const r = this.run;
        if (!r || r.battleId !== battleId) return;
        this.stop(battleId, '战场', pos);
        this.run = null;
        const totalSec = +(r.activeMs / 1000).toFixed(1);
        const body = {
            probe: 'march-time',
            at: new Date().toISOString(),
            说明: '编年史随行军团行军计时：sec＝现实秒（游戏暂停不计），km＝实际走过的路程',
            battleId: r.battleId,
            title: r.title,
            legion: r.legion,
            from: r.from,
            chained: r.chained,
            startedAt: r.startedAt,
            totalSec,
            totalKm: Math.round(r.km),
            legs: r.legs,
        };
        console.log(`⏱️ [行军计时] 【${r.title}】${r.from} → 战场：${totalSec} 秒，${Math.round(r.km)} km`);
        void fetch('/api/stuck-legion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        }).catch(() => { /* 记录失败不影响游戏 */ });
    }
}

export const marchTimeRecorder = new MarchTimeRecorder();
