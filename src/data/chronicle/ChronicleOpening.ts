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

/** 单镜平移距离上限（经纬度欧氏度），避免超出 ZOOM 9 本地瓦片缓存（keepBuffer: 4） */
const MAX_PAN_DEG = 2.2;

/**
 * 🔴 [2026-11-14] 编年史公元前 550 年开场天下巡礼四镜（全自动直播开篇）
 * 全程保持战略底图 ZOOM 9：跨区瞬切 + 区内平滑像素平移 + 云健旁白与现有字幕条，
 * 第 4 镜终点精确落定于玩家单骑出生点，随后无缝交棒给 PlayerQuestSystem 触发居鲁士出征与首战播报。
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
let lastHeroPos: OpeningLatLng | null = null;
let lastCityCoord: ((id: string) => OpeningLatLng | undefined) | null = null;
/** 切镜后待开口的旁白：等新区域地图瓦片到齐才念，避免念完了地图还没出来 */
let pendingSpeak: (() => void) | null = null;
let readyWaitMs = 0;
/** 切镜后至少等这么久（给瓦片请求留出发起时间）与最多等这么久（网络故障兜底） */
const MIN_READY_MS = 1500;
const MAX_READY_MS = 12000;

function beginShot(idx: number, speakFn: (text: string, onDone: () => void) => void): void {
    const shot = OPENING_SHOTS[idx];
    const myGen = ++runGen;

    const rawFrom = lastCityCoord?.(shot.fromCityId) ?? shot.fallbackFrom;
    const rawTo = shot.toCityId
        ? (lastCityCoord?.(shot.toCityId) ?? shot.fallbackTo ?? rawFrom)
        : (lastHeroPos ?? rawFrom);

    const dLat = rawFrom.lat - rawTo.lat;
    const dLng = rawFrom.lng - rawTo.lng;
    const dist = Math.hypot(dLat, dLng);
    if (dist > MAX_PAN_DEG) {
        const scale = MAX_PAN_DEG / dist;
        currentFrom = { lat: rawTo.lat + dLat * scale, lng: rawTo.lng + dLng * scale };
    } else {
        currentFrom = { ...rawFrom };
    }
    currentTo = { ...rawTo };
    panElapsedMs = 0;
    panDurationMs = shot.panMs;
    shotCutPending = true;
    readyWaitMs = 0;

    pendingSpeak = () => {
        speakFn(shot.text, () => {
            if (runGen !== myGen || !playing) return;
            if (idx + 1 < OPENING_SHOTS.length) {
                beginShot(idx + 1, speakFn);
            } else {
                playing = false;
                armed = false;
                shotCutPending = false;
                pendingSpeak = null;
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
    panElapsedMs = 0;
    runGen++;
}

/** 取消或作废开场巡礼，并使此前发出的语音回调失效 */
export function cancelChronicleOpening(): void {
    if (!armed && !playing) return;
    armed = false;
    playing = false;
    shotCutPending = false;
    pendingSpeak = null;
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

/** 四镜各区域的中心点（起终点中点），供开局预热地图数据；按镜序返回 */
export function getChronicleOpeningRegionCenters(
    getCityCoord?: (id: string) => OpeningLatLng | undefined,
): OpeningLatLng[] {
    return OPENING_SHOTS.map((shot) => {
        const from = getCityCoord?.(shot.fromCityId) ?? shot.fallbackFrom;
        const to = shot.toCityId ? (getCityCoord?.(shot.toCityId) ?? shot.fallbackTo ?? from) : from;
        return { lat: (from.lat + to.lat) / 2, lng: (from.lng + to.lng) / 2 };
    });
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
    /** 当前视野的地图瓦片是否已全部显现 */
    viewReady: () => boolean;
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

    // 切镜后先让新区域地图显现，显现（或超时）才开口；开口前镜头不平移
    if (pendingSpeak) {
        if (!opts.paused && opts.deltaSec > 0) readyWaitMs += opts.deltaSec * 1000;
        if (shotCutPending) {
            if (opts.consumeSnap) {
                shotCutPending = false;
                return { pos: { ...currentFrom }, snap: true };
            }
            if (readyWaitMs < MAX_READY_MS) return { pos: { ...currentFrom }, snap: false };
        }
        const ready = (opts.viewReady() && readyWaitMs >= MIN_READY_MS) || readyWaitMs >= MAX_READY_MS;
        if (!ready) return { pos: { ...currentFrom }, snap: false };
        const speakNow = pendingSpeak;
        pendingSpeak = null;
        shotCutPending = false;
        speakNow();
        if (!playing) return opts.heroPos ? { pos: opts.heroPos, snap: true } : null;
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
