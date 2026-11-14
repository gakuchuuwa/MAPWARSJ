import { isChronicleActive } from './ChronicleDirector';
import { gameLog } from '../../utils/GameLogger';

export interface OpeningLatLng {
    lat: number;
    lng: number;
}

export interface OpeningShot {
    fromCityId: string;
    fallbackFrom: OpeningLatLng;
    toCityId: string | null;
    fallbackTo?: OpeningLatLng;
    panMs: number;
    text: string;
}

/** 单镜平移距离上限（经纬度欧氏度），避免超出 ZOOM 9 视口预热走廊 */
const MAX_PAN_DEG = 2.2;
/** 切镜落位后给瓦片合成/植被重绘/据点挂载留出的最小稳定窗（毫秒） */
const SETTLE_AFTER_CUT_MS = 260;
/** 当前视口就绪等待上限（毫秒，网络异常兜底防死锁） */
const MAX_READY_MS = 12000;
/** 上一镜念完后若下一镜后台预热尚未落定，停留在上一镜清晰终点等待的上限（毫秒） */
const MAX_PREWARM_WAIT_MS = 8000;

/**
 * 🔴 [2026-11-14] 编年史公元前 550 年开场天下巡礼四镜（全自动直播开篇）
 * 全程保持战略底图 ZOOM 9：上一镜播放期间后台预渲染下一镜山体/水面/植被/据点缓存，
 * 切镜后整幅地图全部显现才开口念白并平滑微移，第 4 镜落定玩家单骑后交棒居鲁士起兵。
 */
export const OPENING_SHOTS: readonly OpeningShot[] = [
    {
        fromCityId: 'city_kelazuomeinai',
        fallbackFrom: { lat: 38.36, lng: 26.77 },
        toCityId: 'city_sifaerde',
        fallbackTo: { lat: 38.48, lng: 28.03 },
        panMs: 9500,
        text: '公元前五五〇年。从爱琴海到江汉平原，列国各据一方。小亚细亚西岸，吕底亚国王克罗伊索斯坐拥撒狄，富甲西方，俯瞰爱琴海上星罗棋布的城邦。',
    },
    {
        fromCityId: 'city_bageda',
        fallbackFrom: { lat: 33.33, lng: 44.37 },
        toCityId: 'city_babilun',
        fallbackTo: { lat: 32.5425, lng: 44.4211 },
        panMs: 9000,
        text: '两河沃野上，新巴比伦国王那波尼德远居沙漠绿洲泰马，将巴比伦巨城与富庶河谷交给王子伯沙撒镇守。',
    },
    {
        fromCityId: 'city_ying',
        fallbackFrom: { lat: 30.35, lng: 112.18 },
        toCityId: 'city_yunmeng',
        fallbackTo: { lat: 31.02, lng: 113.75 },
        panMs: 9500,
        text: '遥远的东方，周室衰微，诸侯争霸。江汉平原上，楚国大军饮马长江，神射养由基威震诸侯，南北战火连年不息。',
    },
    {
        fromCityId: 'city_bosibolisi',
        fallbackFrom: { lat: 29.93, lng: 52.89 },
        toCityId: null,
        panMs: 10000,
        text: '而在伊朗高原，米底王国统辖群山；西南安善山中，波斯诸部之长居鲁士二世正整军待发，一场改写世界格局的风暴即将席卷高原。',
    },
];

let armed = false;
let playing = false;
let runGen = 0;
let currentFrom: OpeningLatLng = { lat: 38.36, lng: 26.77 };
let currentTo: OpeningLatLng = { lat: 38.48, lng: 28.03 };
let panElapsedMs = 0;
let panDurationMs = 9500;
let shotCutPending = false;
let pendingSpeak: (() => void) | null = null;
let readyWaitMs = 0;
let waitingNextIdx: number | null = null;
let prewarmWaitMs = 0;
let pendingNextSpeakFn: ((text: string, onDone: () => void) => void) | null = null;
let lastHeroPos: OpeningLatLng | null = null;
let lastCityCoord: ((id: string) => OpeningLatLng | undefined) | null = null;
let lastPrewarmCorridor: ((from: OpeningLatLng, to: OpeningLatLng) => void) | null = null;
let lastPrewarmReady: (() => boolean) | null = null;

function resolveShotEndpoints(idx: number): { from: OpeningLatLng; to: OpeningLatLng } {
    const shot = OPENING_SHOTS[idx];
    const rawFrom = lastCityCoord?.(shot.fromCityId) ?? shot.fallbackFrom;
    const rawTo = shot.toCityId
        ? (lastCityCoord?.(shot.toCityId) ?? shot.fallbackTo ?? rawFrom)
        : (lastHeroPos ?? rawFrom);

    const dLat = rawFrom.lat - rawTo.lat;
    const dLng = rawFrom.lng - rawTo.lng;
    const dist = Math.hypot(dLat, dLng);
    const from = dist > MAX_PAN_DEG
        ? { lat: rawTo.lat + dLat * (MAX_PAN_DEG / dist), lng: rawTo.lng + dLng * (MAX_PAN_DEG / dist) }
        : { ...rawFrom };
    return { from, to: { ...rawTo } };
}

function beginShot(idx: number, speakFn: (text: string, onDone: () => void) => void): void {
    const shot = OPENING_SHOTS[idx];
    const myGen = ++runGen;
    const { from, to } = resolveShotEndpoints(idx);

    currentFrom = from;
    currentTo = to;
    panElapsedMs = 0;
    panDurationMs = shot.panMs;
    shotCutPending = true;
    readyWaitMs = 0;
    waitingNextIdx = null;
    pendingNextSpeakFn = null;

    pendingSpeak = () => {
        // 本镜画面已完全显现：趁本镜念白期间，在后台静默预渲染本镜尾段与下一镜整条走廊
        lastPrewarmCorridor?.(currentTo, currentTo);
        if (idx + 1 < OPENING_SHOTS.length) {
            const next = resolveShotEndpoints(idx + 1);
            lastPrewarmCorridor?.(next.from, next.to);
        }

        speakFn(shot.text, () => {
            if (runGen !== myGen || !playing) return;
            if (idx + 1 < OPENING_SHOTS.length) {
                if (!lastPrewarmReady || lastPrewarmReady()) {
                    beginShot(idx + 1, speakFn);
                } else {
                    // 下一镜后台预热尚未落定：先停在本镜已渲染完的终点，预热完再切，绝不切去空海蓝底
                    waitingNextIdx = idx + 1;
                    prewarmWaitMs = 0;
                    pendingNextSpeakFn = speakFn;
                }
            } else {
                playing = false;
                armed = false;
                shotCutPending = false;
                pendingSpeak = null;
                waitingNextIdx = null;
                pendingNextSpeakFn = null;
                runGen++;
                gameLog('expedition', '[编年史] 开场天下巡礼结束，转入居鲁士起兵');
            }
        });
    };
}

/** 装填编年史开场四镜巡礼（等待开播解除暂停后自动开演） */
export function armChronicleOpening(): void {
    armed = true;
    playing = false;
    shotCutPending = false;
    pendingSpeak = null;
    waitingNextIdx = null;
    pendingNextSpeakFn = null;
    panElapsedMs = 0;
    readyWaitMs = 0;
    prewarmWaitMs = 0;
    runGen++;
}

/** 取消或作废开场巡礼，并使此前发出的语音回调失效 */
export function cancelChronicleOpening(): void {
    if (!armed && !playing) return;
    armed = false;
    playing = false;
    shotCutPending = false;
    pendingSpeak = null;
    waitingNextIdx = null;
    pendingNextSpeakFn = null;
    runGen++;
}

/** 开场巡礼期间是否阻止居鲁士与玩家提前接敌开拔 */
export function isChronicleOpeningBlocking(): boolean {
    return (armed || playing) && isChronicleActive();
}

/** 获取第 1 镜起点坐标，用于开局前 5 秒预定位镜头 */
export function getChronicleOpeningInitialPos(
    getCityCoord?: (id: string) => OpeningLatLng | undefined,
): OpeningLatLng {
    const first = OPENING_SHOTS[0];
    return getCityCoord?.(first.fromCityId) ?? { ...first.fallbackFrom };
}

export interface StepChronicleOpeningOpts {
    deltaSec: number;
    paused: boolean;
    consumeSnap: boolean;
    heroPos: OpeningLatLng | null;
    heroBusy: boolean;
    speechEnabled: boolean;
    getCityCoord: (id: string) => OpeningLatLng | undefined;
    speak: (text: string, onDone: () => void) => void;
    /** 当前视野的山体、水面、植被、据点是否已全部显现 */
    viewReady: () => boolean;
    /** 后台预渲染指定起止走廊的地图缓存 */
    prewarmCorridor?: (from: OpeningLatLng, to: OpeningLatLng) => void;
    /** 后台预渲染是否已完成 */
    prewarmReady?: () => boolean;
}

/**
 * 推进编年史开场四镜巡礼，返回本帧镜头目标与是否需要瞬切。
 * 返回 `null` 表示当前不由开场巡礼接管镜头。
 */
export function stepChronicleOpening(
    opts: StepChronicleOpeningOpts,
): { pos: OpeningLatLng; snap: boolean } | null {
    if (!armed && !playing) return null;

    if (opts.heroPos) lastHeroPos = opts.heroPos;
    lastCityCoord = opts.getCityCoord;
    lastPrewarmCorridor = opts.prewarmCorridor ?? null;
    lastPrewarmReady = opts.prewarmReady ?? null;

    if (!isChronicleActive() || opts.heroBusy) {
        cancelChronicleOpening();
        return null;
    }

    if (armed && !playing) {
        if (opts.paused) return null;
        if (!opts.speechEnabled) {
            cancelChronicleOpening();
            return opts.heroPos ? { pos: opts.heroPos, snap: true } : null;
        }
        armed = false;
        playing = true;
        beginShot(0, opts.speak);
    }

    if (playing && !opts.speechEnabled) {
        cancelChronicleOpening();
        return opts.heroPos ? { pos: opts.heroPos, snap: true } : null;
    }

    // 上一镜已念完，正在清晰画面上静候下一镜后台预热落定，避免切过去黑屏/蓝屏现算
    if (waitingNextIdx !== null) {
        if (!opts.paused && opts.deltaSec > 0) prewarmWaitMs += opts.deltaSec * 1000;
        const prewarmDone = (!lastPrewarmReady || lastPrewarmReady()) || prewarmWaitMs >= MAX_PREWARM_WAIT_MS;
        if (!prewarmDone) {
            return { pos: { ...currentTo }, snap: false };
        }
        const nextIdx = waitingNextIdx;
        const fn = pendingNextSpeakFn ?? opts.speak;
        waitingNextIdx = null;
        pendingNextSpeakFn = null;
        beginShot(nextIdx, fn);
    }

    // 切镜后等新区域全幅地图（山体+水面+植被+据点）显现才开口，开口前不提前走平移进度
    if (pendingSpeak) {
        if (shotCutPending) {
            if (opts.consumeSnap) {
                shotCutPending = false;
                readyWaitMs = 0;
                return { pos: { ...currentFrom }, snap: true };
            }
            if (!opts.paused && opts.deltaSec > 0) readyWaitMs += opts.deltaSec * 1000;
            if (readyWaitMs < MAX_READY_MS) return { pos: { ...currentFrom }, snap: false };
        } else if (!opts.paused && opts.deltaSec > 0) {
            readyWaitMs += opts.deltaSec * 1000;
        }

        const ready = (opts.viewReady() && readyWaitMs >= SETTLE_AFTER_CUT_MS) || readyWaitMs >= MAX_READY_MS;
        if (!ready) return { pos: { ...currentFrom }, snap: false };

        const speakNow = pendingSpeak;
        pendingSpeak = null;
        shotCutPending = false;
        speakNow();
        if (!playing) return opts.heroPos ? { pos: opts.heroPos, snap: true } : null;
        if (waitingNextIdx !== null) return { pos: { ...currentTo }, snap: false };
        if (pendingSpeak && shotCutPending && opts.consumeSnap) {
            shotCutPending = false;
            readyWaitMs = 0;
            return { pos: { ...currentFrom }, snap: true };
        }
        return { pos: { ...currentFrom }, snap: false };
    }

    if (shotCutPending) {
        if (opts.consumeSnap) {
            shotCutPending = false;
            return { pos: { ...currentFrom }, snap: true };
        }
        return { pos: { ...currentFrom }, snap: false };
    }

    if (!opts.paused && opts.deltaSec > 0) {
        panElapsedMs = Math.min(panDurationMs, panElapsedMs + opts.deltaSec * 1000);
    }

    const u = panDurationMs > 0 ? Math.min(1, panElapsedMs / panDurationMs) : 1;
    const ease = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
    const pos: OpeningLatLng = {
        lat: currentFrom.lat + (currentTo.lat - currentFrom.lat) * ease,
        lng: currentFrom.lng + (currentTo.lng - currentFrom.lng) * ease,
    };
    return { pos, snap: false };
}
