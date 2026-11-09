/**
 * 新观众入场语音引导（原画面弹窗卡片已按 2026-11-07 主人令删除，改为来人后用语音播报当前最新规则，不遮挡画面）。
 * 两次播报之间至少隔 MIN_GAP_MS，防止人多时连续重复播报。
 */
import { speechAnnouncer } from '../audio/SpeechAnnouncer';

const MIN_GAP_MS = 120_000;

export class HowToPlayCard {
    private lastShownAt = -Infinity;
    private readonly duel = new URLSearchParams(window.location.search).has('quickbattle');

    public show(): void {
        const now = Date.now();
        if (now - this.lastShownAt < MIN_GAP_MS) return;
        this.lastShownAt = now;
        const text = this.duel
            ? '欢迎来到直播间，发言即送5积分，发 1 加入乱入者、发 2 加入维序者，每发一次随机放一计；也可发 攻、胜、敌、混、并、败 指定计，发 押1、押2、押平 下注'
            : '欢迎来到直播间，发言即送5积分，发 1 加入乱入者、发 2 加入维序者，打仗时每发一次随机放一计；也可发 攻、胜、敌、混、并、败 指定计，开战前9秒发 押1、押2、押平 下注';
        speechAnnouncer.announceViewerNotice(text);
    }
}


