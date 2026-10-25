/**
 * 🔴 [2026-10-25] YouTube 点赞 / 订阅 / 在线人数轮询。
 * SSN 只转发聊天，不给点赞数；订阅也不进聊天。这几样走 YouTube Data API v3（浏览器直连，googleapis 允许跨域）：
 *   · videos.list（snippet,statistics,liveStreamingDetails）→ 点赞数、频道 ID、在线人数，1 配额点
 *   · channels.list（statistics）→ 订阅数（1000 以内准确，之后 YouTube 自己四舍五入；频道隐藏订阅数则没有），1 配额点
 * 视频每 30 秒、频道每 60 秒各查一次：一天约 4320 点，免费额度每天 10000。
 * 密钥与直播视频 ID 在 F9 面板填，存 localStorage；密钥只存本机，记得在 Google Cloud 把它限定为只能调 YouTube Data API。
 * 谁点的赞、谁订阅的，YouTube 不告诉我们，所以结果只喂给 `ViewerLive` 的全场目标。
 */
import type { ViewerLive } from './ViewerLive';

const KEY_KEY = 'mapwar-yt-key';
const VIDEO_KEY = 'mapwar-yt-video';
const API = 'https://www.googleapis.com/youtube/v3';
const VIDEO_MS = 30_000;
const CHANNEL_MS = 60_000;

/** 粘贴整条直播网址也行：认 v=、/live/、youtu.be/、/shorts/ 后面那串 11 位 ID */
export function parseVideoId(input: string): string {
    const s = input.trim();
    const m = s.match(/(?:[?&]v=|\/live\/|youtu\.be\/|\/shorts\/)([\w-]{11})/) ?? s.match(/^([\w-]{11})$/);
    return m ? m[1] : '';
}

export class YouTubeStats {
    private key = '';
    private video = '';
    private channelId = '';
    private videoTimer = 0;
    private channelTimer = 0;

    constructor(private readonly live: ViewerLive) {
        try {
            this.key = localStorage.getItem(KEY_KEY) ?? '';
            this.video = localStorage.getItem(VIDEO_KEY) ?? '';
        } catch { /* 隐私模式 */ }
        this.restart();
    }

    public getKey(): string { return this.key; }
    public getVideo(): string { return this.video; }

    /** F9 面板填好后调用；任一项为空＝停止轮询 */
    public set(key: string, videoInput: string): void {
        this.key = key.trim();
        this.video = parseVideoId(videoInput);
        this.channelId = '';
        try {
            localStorage.setItem(KEY_KEY, this.key);
            localStorage.setItem(VIDEO_KEY, this.video);
        } catch { /* 隐私模式 */ }
        this.restart();
    }

    private restart(): void {
        window.clearInterval(this.videoTimer);
        window.clearInterval(this.channelTimer);
        if (!this.key || !this.video) { this.live.ytStatus = ''; return; }
        this.live.ytStatus = '点赞接口连接中';
        void this.pollVideo();
        this.videoTimer = window.setInterval(() => void this.pollVideo(), VIDEO_MS);
        this.channelTimer = window.setInterval(() => void this.pollChannel(), CHANNEL_MS);
    }

    private async get(path: string): Promise<any | null> {
        try {
            const r = await fetch(`${API}/${path}&key=${encodeURIComponent(this.key)}`);
            if (!r.ok) {
                const body = await r.json().catch(() => null);
                this.live.ytStatus = `点赞接口出错 ${r.status}${body?.error?.message ? '：' + String(body.error.message).slice(0, 60) : ''}`;
                return null;
            }
            return await r.json();
        } catch {
            this.live.ytStatus = '点赞接口连不上（网络）';
            return null;
        }
    }

    private async pollVideo(): Promise<void> {
        const j = await this.get(`videos?part=snippet,statistics,liveStreamingDetails&id=${encodeURIComponent(this.video)}`);
        if (!j) return;
        const item = j.items?.[0];
        if (!item) { this.live.ytStatus = '点赞接口：找不到这个视频 ID'; return; }
        this.live.ytStatus = '点赞接口正常';
        if (!this.channelId && item.snippet?.channelId) {
            this.channelId = item.snippet.channelId;
            void this.pollChannel();
        }
        const likes = Number(item.statistics?.likeCount);
        if (Number.isFinite(likes)) this.live.onLikeTotal(likes);
        const viewers = Number(item.liveStreamingDetails?.concurrentViewers);
        if (Number.isFinite(viewers)) this.live.onViewers(viewers);
    }

    private async pollChannel(): Promise<void> {
        if (!this.channelId) return;
        const j = await this.get(`channels?part=statistics&id=${encodeURIComponent(this.channelId)}`);
        const st = j?.items?.[0]?.statistics;
        if (!st || st.hiddenSubscriberCount) return;
        const subs = Number(st.subscriberCount);
        if (Number.isFinite(subs)) this.live.onSubTotal(subs);
    }
}
