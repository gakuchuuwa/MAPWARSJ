/**
 * YouTube 单平台频道增长数据：点赞、订阅和在线人数由本地服务使用服务端密钥查询。
 * 浏览器不保存 API 密钥；这些数据只发全场增长积分，YouTube 不告诉我们是谁点赞或订阅。
 */
import type { ViewerLive } from './ViewerLive';

const POLL_MS = 30_000;

export class YouTubeStats {
    private videoTimer = 0;
    private video = '';
    /** 最近一次查询成功且直播未结束 */
    public ok = false;

    constructor(private readonly live: ViewerLive) { }

    public setVideo(video: string): void {
        if (video === this.video) return;
        this.video = video;
        this.live.resetGoals();
        this.restart();
    }

    public restart(): void {
        window.clearInterval(this.videoTimer);
        this.ok = false;
        if (!this.video) { this.live.ytStatus = ''; return; }
        this.live.ytStatus = '频道增长数据连接中';
        void this.poll();
        this.videoTimer = window.setInterval(() => void this.poll(), POLL_MS);
    }

    private async poll(): Promise<void> {
        if (!this.video) return;
        try {
            const r = await fetch('/live-api/stats', { cache: 'no-store' });
            const body = await r.json();
            if (!r.ok) throw new Error(body.error || `HTTP ${r.status}`);
            if (body.ended) {
                this.ok = false;
                this.live.ytStatus = '这场直播已结束，请填本场直播网址';
                return;
            }
            this.ok = true;
            this.live.ytStatus = '频道增长数据正常';
            if (Number.isFinite(body.likes)) this.live.onLikeTotal(Number(body.likes));
            if (Number.isFinite(body.viewers)) this.live.onViewers(Number(body.viewers));
            if (Number.isFinite(body.subscribers)) this.live.onSubTotal(Number(body.subscribers));
        } catch (error) {
            this.ok = false;
            this.live.ytStatus = `频道增长数据异常：${String(error instanceof Error ? error.message : error).slice(0, 80)}`;
        }
    }
}
