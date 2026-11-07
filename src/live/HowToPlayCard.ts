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
            ? '欢迎来到直播间，发言即送5积分，默认属维序者，发 投1 成为乱入者，投一次永久有效；开战前发 押1、押2、押平 下注，开战后发 攻、胜、敌、混、并、败 放计助阵'
            : '欢迎来到直播间，发言即送5积分，默认属维序者，发 投1 成为乱入者，投一次永久有效；开战前9秒发 押1、押2、押平 下注，交战中发 攻、胜、敌、混、并、败 放计助阵';
        speechAnnouncer.announceViewerNotice(text);
    }
}


