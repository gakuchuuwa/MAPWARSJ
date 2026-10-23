/**
 * 🔴 [2026-10-22 主人同意「以旁白为主，只有要玩家拿主意的地方才弹对话框」＋「故事旁白和战争旁白不该一个声音吧」]
 *
 * 探马故事旁白：一句一句念（故事旁白专用音色，见 SpeechAnnouncer.announceStory），不暂停游戏。
 *   · 排队：上一句念完才念下一句（播报引擎新开口会掐断正在念的，所以这里自己排）；
 *   · 带说话人时，念这一句的工夫在画面左下角显示他的立绘和名字（立绘还没有就只显示名字）；
 *   · banner＝要不要出底部字幕条（对话框里已有全文时不出，免得两处同时显示）。
 * 每句念完回调 onDone（例：念完授旗那句再记标记、念完再开下一仗）。
 */
import { speechAnnouncer } from '../audio/SpeechAnnouncer';
import { getStoryCharacter } from './storyCharacters';

interface Line {
    speaker: string | null;
    text: string;
    banner: boolean;
    onDone?: () => void;
}

const CARD_ID = 'story-narration-card';
const FONT = "'Noto Serif SC', 'SimSun', 'Songti SC', serif";

class StoryNarrator {
    private queue: Line[] = [];
    private playing = false;

    /** 念一句；speaker 是人物表的键（如 '萨尔杜里'），旁白传 null */
    public say(speaker: string | null, text: string, opts: { banner?: boolean; onDone?: () => void } = {}): void {
        const line = text.trim();
        if (!line) { opts.onDone?.(); return; }
        this.queue.push({ speaker, text: line, banner: opts.banner ?? true, onDone: opts.onDone });
        if (!this.playing) this.next();
    }

    /** 还有没有在念 / 排着的 */
    public isBusy(): boolean {
        return this.playing || this.queue.length > 0;
    }

    private next(): void {
        const line = this.queue.shift();
        if (!line) { this.playing = false; this.hideCard(); return; }
        this.playing = true;
        this.showCard(line.speaker);
        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            line.onDone?.();
            this.next();
        };
        // 语音引擎卡住时的兜底：按字数估一个最长时间
        window.setTimeout(finish, 4000 + line.text.length * 450);
        speechAnnouncer.announceStory(line.text, line.banner, finish);
    }

    private showCard(speaker: string | null): void {
        this.hideCard();
        const who = speaker ? getStoryCharacter(speaker) : undefined;
        if (!who) return;
        const card = document.createElement('div');
        card.id = CARD_ID;
        card.style.cssText = `
            position:fixed; left:18px; bottom:96px; z-index:10040; pointer-events:none;
            display:flex; flex-direction:column; align-items:flex-start; gap:6px;
            font-family:${FONT}; filter:drop-shadow(0 12px 24px rgba(0,0,0,0.7));`;
        if (who.portrait) {
            const img = document.createElement('img');
            img.src = who.portrait;
            img.alt = who.name;
            img.style.cssText = 'height:min(340px, 38vh); width:auto; display:block;';
            img.addEventListener('error', () => img.remove());
            card.appendChild(img);
        }
        const tag = document.createElement('div');
        tag.style.cssText = 'padding:4px 12px; background:rgba(20,16,12,0.9); border:1px solid rgba(212,175,55,0.6); border-radius:6px; color:#ffd700; font-weight:900; font-size:15px;';
        tag.innerHTML = `${who.name}<span style="margin-left:8px;font-size:12px;color:#dfc28c;font-weight:700;">${who.role}</span>`;
        card.appendChild(tag);
        document.body.appendChild(card);
    }

    private hideCard(): void {
        document.getElementById(CARD_ID)?.remove();
    }
}

export const storyNarrator = new StoryNarrator();
