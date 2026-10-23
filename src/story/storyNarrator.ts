/**
 * 🔴 [2026-10-22 主人同意「以旁白为主」＋「故事旁白和战争旁白不该一个声音吧」]
 *
 * 探马故事旁白：一句一句念（故事旁白专用音色，见 SpeechAnnouncer.announceStory），不暂停游戏。
 *   · 排队：上一句念完才念下一句（播报引擎新开口会掐断正在念的，所以这里自己排）；
 *   · 说话人立绘：用左下角那套武将立绘框（CombatUI.showStoryPortrait，同框、同名牌、可 F2 调），
 *     同一段对话里一直挂着，最后一句念完再停 LINGER_MS 才收；
 *   · 字幕：这里自己出（SubtitleBanner），不交给语音引擎 —— 语音引擎念完就收字幕，
 *     连不上微软、念得快时字幕「闪一下就没了」（2026-10-23 主人报）。
 * 每句念完回调 onDone（例：念完授旗那句再记标记、念完再开下一仗）。
 *
 * 🔴 [2026-10-23 主人「闪一下就没了。话都没看到说什么呢」「知道每句话该多长时间设计吗」]
 * 每句话停多久：**语音念完** 与 **看完字幕** 两者取长。看字幕按影视中文字幕的常用读速
 * 每秒约 4 个字（MS_PER_CHAR = 250），再加 2 秒起看的余量（BASE_MS）：
 *   再保底每句 10 秒（MIN_LINE_MS）：20 字 → 10 秒；40 字 → 12 秒；60 字 → 17 秒。
 */
import { speechAnnouncer } from '../audio/SpeechAnnouncer';
import { SubtitleBanner } from '../ui/SubtitleBanner';
import { getStoryCharacter } from './storyCharacters';

interface Line {
    speaker: string | null;
    text: string;
    banner: boolean;
    onDone?: () => void;
}

const BASE_MS = 2000;
const MS_PER_CHAR = 250;
/** 最后一句说完，立绘与字幕再留多久 */
const LINGER_MS = 1500;
/**
 * 🔴 [2026-10-23 主人「你把字幕做长一点呀。起码一句话要保持在10秒以上吧」] 每句保底 10 秒
 */
const MIN_LINE_MS = 10000;
/** 一句话最少看多久（毫秒） */
const readMs = (text: string): number => Math.max(MIN_LINE_MS, BASE_MS + text.length * MS_PER_CHAR);

class StoryNarrator {
    private queue: Line[] = [];
    private playing = false;
    /** 正在念的这句：开口时刻与最少停留时长 */
    private currentStart = 0;
    private currentEstMs = 0;
    private lingerTimer = 0;

    /** 念一句；speaker 是人物表的键（如 '萨尔杜里'），旁白传 null */
    public say(speaker: string | null, text: string, opts: { banner?: boolean; onDone?: () => void } = {}): void {
        const line = text.trim();
        if (!line) { opts.onDone?.(); return; }
        this.queue.push({ speaker, text: line, banner: opts.banner ?? true, onDone: opts.onDone });
        if (!this.playing) this.next();
    }

    /** 估算还要多久才说完（毫秒）：这句剩下的 ＋ 排着的；没在念＝0（跑腿按它放慢脚步） */
    public remainingMs(): number {
        if (!this.isBusy()) return 0;
        let ms = this.playing ? Math.max(0, this.currentStart + this.currentEstMs - performance.now()) : 0;
        for (const l of this.queue) ms += readMs(l.text);
        return ms;
    }

    /** 还有没有在念 / 排着的 */
    public isBusy(): boolean {
        return this.playing || this.queue.length > 0;
    }

    private next(): void {
        const line = this.queue.shift();
        if (!line) {
            this.playing = false;
            window.clearTimeout(this.lingerTimer);
            this.lingerTimer = window.setTimeout(() => {
                if (this.playing) return;
                SubtitleBanner.hide();
                this.ui()?.hideStoryPortrait?.();
            }, LINGER_MS);
            return;
        }
        window.clearTimeout(this.lingerTimer);
        this.playing = true;
        const minMs = readMs(line.text);
        this.currentStart = performance.now();
        this.currentEstMs = minMs;
        this.showPortrait(line.speaker);
        if (line.banner) SubtitleBanner.show(line.text, minMs + LINGER_MS + 30000, true, true);

        let voiceDone = false;
        let readDone = false;
        let finished = false;
        const tryFinish = () => {
            if (finished || !voiceDone || !readDone) return;
            finished = true;
            line.onDone?.();
            this.next();
        };
        window.setTimeout(() => { readDone = true; tryFinish(); }, minMs);
        // 语音引擎卡住时的兜底：最多等到看完字幕后再多 2 倍时长
        window.setTimeout(() => { voiceDone = true; tryFinish(); }, minMs * 3);
        speechAnnouncer.announceStory(line.text, false, () => { voiceDone = true; tryFinish(); });
    }

    private ui(): { showStoryPortrait?(p: string, n: string, r: string): void; hideStoryPortrait?(): void } | undefined {
        return (window as any).game?.combatUI;
    }

    /** 有说话人且他有立绘：挂到左下角立绘框；旁白（或还没画立绘的人）不动立绘框 */
    private showPortrait(speaker: string | null): void {
        const who = speaker ? getStoryCharacter(speaker) : undefined;
        if (!who?.portrait) return;
        this.ui()?.showStoryPortrait?.(who.portrait, who.name, who.role);
    }
}

export const storyNarrator = new StoryNarrator();
