/**
 * 编年史行军计时（2026-11-14 主人令「记录战略地图上的移动时间，为将来改写战略背景播报做准备」；
 * 2026-11-15 修：对齐战略播报真实窗口——含换将时玩家单骑寻将/追军时间，等玩家与军团均就位再停表）。
 *
 * 每场编年史之战：从玩家动身寻将 / 随行军团开拔起，到双方在战场就位准备接战止，
 * 记总有效现实秒（游戏暂停、对话弹窗暂停、切后台长帧均不计）与路程公里，并拆分单骑寻将段与军团行军段。
 * 抵达就位时落盘一条（复用 /api/stuck-legion，probe:'march-time'，追加到 scratch/stuck_legion_log.jsonl；
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
    /** 战略地图总有效移动时间（毫秒） */
    activeMs: number;
    /** 镜头跟随主角走过的总路程（单骑寻将/追军公里 ＋ 入伍后随军行军公里） */
    km: number;
    /** 玩家单骑寻将/追军阶段耗时与路程（连战为 0） */
    playerMs: number;
    playerKm: number;
    playerJoined: boolean;
    /** 随行军团自身行军阶段耗时与路程（军团先到战场等玩家时不累加干等时间） */
    legionStarted: boolean;
    legionArrived: boolean;
    legionMs: number;
    legionKm: number;
    legMs: number;
    legKm: number;
    legs: MarchLeg[];
    lastT: number;
    lastLegionPos: LatLng | null;
    lastPlayerPos: LatLng | null;
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

    /** 读档 / 切模式 / 中止行程：清空未落盘的半截计时 */
    reset(): void {
        this.run = null;
    }

    /** 换将守城战：玩家刚动身前往被守之城（战略播报同步开念，军团尚未生成） */
    beginSeek(battleId: string, title: string, toCityName: string, playerPos: LatLng): void {
        if (!import.meta.env.DEV) return;
        if (this.run && this.run.battleId === battleId) return;
        this.run = {
            battleId,
            title,
            legion: '',
            from: toCityName,
            chained: false,
            startedAt: new Date().toISOString(),
            activeMs: 0,
            km: 0,
            playerMs: 0,
            playerKm: 0,
            playerJoined: false,
            legionStarted: false,
            legionArrived: false,
            legionMs: 0,
            legionKm: 0,
            legMs: 0,
            legKm: 0,
            legs: [],
            lastT: performance.now(),
            lastLegionPos: null,
            lastPlayerPos: { ...playerPos },
        };
    }

    /** 玩家单骑赶往被守之城途中采样（军团尚未生成） */
    sampleSeek(playerPos: LatLng): void {
        const r = this.run;
        if (!r || r.legionStarted || r.playerJoined) return;
        this.advanceClock(null, playerPos);
    }

    /**
     * 随行军团开拔（新的一场开始，或接续上面换将守城战的单骑寻将段；上一场没就位就作废）。
     * `detachedPlayerPos` 仅在换将攻城/野战（军团先行开拔、玩家半路追赶）时传入。
     */
    begin(
        battleId: string,
        title: string,
        legion: string,
        from: string,
        pos: LatLng,
        chained: boolean,
        detachedPlayerPos?: LatLng,
    ): void {
        if (!import.meta.env.DEV) return;
        if (this.run && this.run.battleId === battleId && !this.run.legionStarted) {
            this.advanceClock(null, pos);
            const r = this.run;
            r.legion = legion;
            r.from = from;
            r.playerJoined = !detachedPlayerPos;
            r.legionStarted = true;
            r.lastLegionPos = { ...pos };
            if (detachedPlayerPos) r.lastPlayerPos = { ...detachedPlayerPos };
            r.lastT = performance.now();
            return;
        }
        this.run = {
            battleId,
            title,
            legion,
            from,
            chained,
            startedAt: new Date().toISOString(),
            activeMs: 0,
            km: 0,
            playerMs: 0,
            playerKm: 0,
            playerJoined: !detachedPlayerPos,
            legionStarted: true,
            legionArrived: false,
            legionMs: 0,
            legionKm: 0,
            legMs: 0,
            legKm: 0,
            legs: [],
            lastT: performance.now(),
            lastLegionPos: { ...pos },
            lastPlayerPos: detachedPlayerPos ? { ...detachedPlayerPos } : null,
        };
    }

    private advanceClock(legionPos: LatLng | null, playerPos: LatLng | null): void {
        const r = this.run;
        if (!r) return;
        const now = performance.now();
        const dt = now - r.lastT;
        r.lastT = now;
        const validDt = (!isGamePaused() && dt > 0 && dt <= MAX_SAMPLE_GAP_MS) ? dt : 0;
        r.activeMs += validDt;

        if (!r.playerJoined && playerPos) {
            r.playerMs += validDt;
            if (r.lastPlayerPos) {
                const pKm = haversineKm(r.lastPlayerPos, playerPos);
                r.playerKm += pKm;
                r.km += pKm;
            }
            r.lastPlayerPos = { ...playerPos };
        }

        if (r.legionStarted && !r.legionArrived && legionPos) {
            r.legionMs += validDt;
            r.legMs += validDt;
            if (r.lastLegionPos) {
                const lKm = haversineKm(r.lastLegionPos, legionPos);
                r.legionKm += lKm;
                r.legKm += lKm;
                if (r.playerJoined) {
                    r.km += lKm;
                }
            }
            r.lastLegionPos = { ...legionPos };
        }
    }

    /** 每拍采样：累计非暂停的现实时间与走过的路程（未会合时同步采玩家追赶位移） */
    sample(battleId: string, legionPos: LatLng, playerPos?: LatLng): void {
        const r = this.run;
        if (!r || r.battleId !== battleId) return;
        this.advanceClock(legionPos, playerPos ?? null);
    }

    /** 到达一个史载途经地 */
    stop(battleId: string, name: string, pos: LatLng): void {
        const r = this.run;
        if (!r || r.battleId !== battleId || r.legionArrived) return;
        this.advanceClock(pos, null);
        r.legs.push({ to: name, sec: +(r.legMs / 1000).toFixed(1), km: Math.round(r.legKm) });
        r.legMs = 0;
        r.legKm = 0;
    }

    /** 军团先抵战场、原地等玩家追来会合：封存军团自身行军段，总表继续记玩家追赶时间 */
    onLegionWaitAtBattlefield(battleId: string, pos: LatLng): void {
        const r = this.run;
        if (!r || r.battleId !== battleId || r.legionArrived) return;
        this.stop(battleId, '战场', pos);
        r.legionArrived = true;
    }

    /** 玩家追上先行开拔的军团：结束单骑追赶段；若军团此前已在战场等候，当即收尾落盘 */
    onPlayerJoin(battleId: string | undefined, armyPos: LatLng, playerPos?: LatLng): void {
        if (!battleId) return;
        const r = this.run;
        if (!r || r.battleId !== battleId || r.playerJoined) return;
        this.advanceClock(armyPos, playerPos ?? armyPos);
        r.playerJoined = true;
        r.lastLegionPos = { ...armyPos };
        if (r.legionArrived) {
            this.arrive(battleId, armyPos);
        }
    }

    /** 双方均抵达战场准备开战（在战略播报未完驻足判定之前调用）：收尾落盘，同一场只落一次 */
    arrive(battleId: string, pos: LatLng): void {
        const r = this.run;
        if (!r || r.battleId !== battleId) return;
        if (!r.legionArrived) {
            this.stop(battleId, '战场', pos);
            r.legionArrived = true;
        }
        this.run = null;
        const totalSec = +(r.activeMs / 1000).toFixed(1);
        const playerSec = +(r.playerMs / 1000).toFixed(1);
        const legionSec = +(r.legionMs / 1000).toFixed(1);
        const totalKm = Math.round(r.km);
        const playerKm = Math.round(r.playerKm);
        const legionKm = Math.round(r.legionKm);
        const body = {
            probe: 'march-time',
            at: new Date().toISOString(),
            说明: '编年史战略移动计时：totalSec＝从寻将/开拔到双方就位准备开战的有效现实秒（暂停不计）',
            battleId: r.battleId,
            title: r.title,
            legion: r.legion,
            from: r.from,
            chained: r.chained,
            startedAt: r.startedAt,
            totalSec,
            totalKm,
            playerSec,
            playerKm,
            legionSec,
            legionKm,
            legs: r.legs,
        };
        const sub = playerSec > 0
            ? `（寻将/追军 ${playerSec}s·${playerKm}km，军团行军 ${legionSec}s·${legionKm}km）`
            : '';
        console.log(`⏱️ [行军计时] 【${r.title}】${r.from} → 战场：总移动 ${totalSec} 秒，${totalKm} km${sub}`);
        void fetch('/api/stuck-legion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        }).catch(() => { /* 记录失败不影响游戏 */ });
    }
}

export const marchTimeRecorder = new MarchTimeRecorder();
