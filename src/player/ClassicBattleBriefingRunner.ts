/**
 * ClassicBattleBriefingRunner —— 名将经典战「战略大局」播报器
 *
 * 🔴 [2026-11-11 主人定] 战略播报从玩家「上一支军团解散、去找下一位武将」那一刻开始念，
 *    一直念到这一仗开打；战术播报从开打（进战术模式）开始念。
 *
 * 规则：
 *   · 一段一次 `announceBriefing`（一段＝一屏字幕），念完一段接下一段；
 *   · 改找别的武将 → 当前这段念完就停，换成新武将的那一套从头念；
 *   · 开打时还没念完 → **当前这段念完就收，剩下的不念**，战术播报接着开口
 *     （战术模式那边本来就等 S 级播报空闲才开口，见 Scene13WarLayer `isSTierBusy`）。
 *     文案因此按「最重要的放第一段」来写。
 *   · 不跟着人走不走：寻将路上、会面对话、随军行军都照念（会面对话不念语音，不会撞音）。
 */

type SpeakFn = (text: string, onDone?: () => void, onStart?: () => void, minBannerMs?: number) => void;

export class ClassicBattleBriefingRunner {
    private generalId: string | null = null;
    private paragraphs: string[] = [];
    private idx = 0;
    private speaking = false;
    private stopRequested = false;
    /** 已经开过口的武将（同一场不重念） */
    private readonly started = new Set<string>();

    constructor(private readonly getSpeak: () => SpeakFn | undefined) {}

    /** 正在为谁念（念完或停下后为 null） */
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
            this.speaking = false;
            // 停下期间又换了一位（start 清过 stopRequested）→ 接着念新这一套
            this.next();
        });
    }
}
