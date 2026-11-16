/**
 * ClassicBattleBriefingRunner —— 名将经典战「战略大局」播报器
 *
 * 🔴 [2026-11-11 主人定] 战略播报从玩家「上一支军团解散、去找下一位武将」那一刻开始念，
 *    一直念到这一仗开打；战术播报从开打（进战术模式）开始念。
 *
 * 规则：
 *   · 一段一次 `announceBriefing`（一段＝一屏字幕），念完一段停 `SCREEN_GAP_MS` 再接下一段；
 *     🔴 [2026-11-16 主人定] 屏与屏之间留 5 秒，音乐回升、让观众看地图；留白期间仍算「在念」（isBusy），
 *     到站时军团照样等整条念完再开打，最后一屏（本场背景）不会被截掉。字数配额已扣掉这些留白。
 *   · 改找别的武将 → 当前这段念完就停，换成新武将的那一套从头念；
 *   · 到站时还没念完 → 军团在战场外列阵等整条念完（PlayerQuestSystem 看 `isBusy`）；
 *     已进战斗 / 换场 → **当前这段念完就收，剩下的不念**，战术播报接着开口
 *     （战术模式那边本来就等 S 级播报空闲才开口，见 Scene13WarLayer `isSTierBusy`）。
 *   · 不跟着人走不走：寻将路上、会面对话、随军行军都照念（会面对话不念语音，不会撞音）。
 */

type SpeakFn = (text: string, onDone?: () => void, onStart?: () => void, minBannerMs?: number) => void;

/** 屏与屏之间的留白（毫秒）；与 tools/chronicle/apply-strategic-quota-by-time.mjs 的 SCREEN_GAP_SEC 同值 */
export const SCREEN_GAP_MS = 5000;

export class ClassicBattleBriefingRunner {
    private generalId: string | null = null;
    private gapTimer: ReturnType<typeof setTimeout> | null = null;
    private paragraphs: string[] = [];
    private idx = 0;
    private speaking = false;
    private stopRequested = false;
    /** 已经开过口的武将（同一场不重念） */
    private readonly started = new Set<string>();

    constructor(private readonly getSpeak: () => SpeakFn | undefined) {}

    /** 正在念的是哪一场（经典战编号；念完或停下后为 null） */
    public currentGeneralId(): string | null { return this.generalId; }

    public isBusy(): boolean { return this.speaking; }

    public hasStarted(generalId: string): boolean { return this.started.has(generalId); }

    /** 为这位武将开念；已在为他念 / 已经念过 → 什么都不做 */
    public start(generalId: string, paragraphs: string[]): void {
        if (this.generalId === generalId || this.started.has(generalId)) return;
        const list = paragraphs.map((p) => p.trim()).filter(Boolean);
        if (!list.length) return;
        this.started.add(generalId);
        this.generalId = generalId;
        this.paragraphs = list;
        this.idx = 0;
        this.stopRequested = false;
        if (!this.speaking) this.next();
        // 正在念上一位的最后一段 → 那段念完的 onDone 里会接上这一套
    }

    /** 当前这段念完就停（开打 / 改找没有经典战的人 / 任务作废） */
    public stopAfterCurrent(): void {
        // 正在屏间留白 → 当前这屏已念完，直接收
        if (this.gapTimer) { clearTimeout(this.gapTimer); this.gapTimer = null; this.speaking = false; }
        this.stopRequested = true;
        this.generalId = null;
        this.paragraphs = [];
        this.idx = 0;
    }

    /** 读档 / 换局：全部清空 */
    public reset(): void {
        this.stopAfterCurrent();
        this.started.clear();
    }

    private next(): void {
        if (this.stopRequested || this.idx >= this.paragraphs.length) {
            this.speaking = false;
            if (this.idx >= this.paragraphs.length) this.generalId = null;
            return;
        }
        const speak = this.getSpeak();
        if (!speak) { this.speaking = false; return; }
        const line = this.paragraphs[this.idx++];
        this.speaking = true;
        speak(line, () => {
            // 同一套还有下一屏 → 留白期间保持 speaking，留白后接着念
            if (!this.stopRequested && this.idx < this.paragraphs.length) {
                this.gapTimer = setTimeout(() => { this.gapTimer = null; this.next(); }, SCREEN_GAP_MS);
                return;
            }
            this.speaking = false;
            // 停下期间又换了一位（start 清过 stopRequested）→ 接着念新这一套
            this.next();
        });
    }
}
