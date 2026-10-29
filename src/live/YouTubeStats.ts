/**
 * YouTube 单平台频道增长数据：点赞、订阅和在线人数由本地服务使用服务端密钥查询。
 * 浏览器不保存 API 密钥；这些数据只发全场增长积分，YouTube 不告诉我们是谁点赞或订阅。
 */
import type { ViewerLive } from './ViewerLive';

// 🔴 [2026-10-30 主人报「连不上了」：YouTube 每日配额用光] 每查一次至少花 1 单位，游戏开着就一直查；
//    30 秒一次一天就是 2880 次以上。点赞/在线人数一分钟更新一次足够发增长积分。
const POLL_MS = 60_000;

export class YouTubeStats {
    private videoTimer = 0;
    private video = '';
    private generation = 0;
    private polling = false;
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
        this.generation++;
        this.polling = false;
        this.ok = false;
        if (!this.video) { this.live.ytStatus = ''; return; }
        this.live.ytStatus = '频道增长数据连接中';
        void this.poll(this.video, this.generation);
        this.videoTimer = window.setInterval(() => void this.poll(this.video, this.generation), POLL_MS);
    }

    private async poll(video: string, generation: number): Promise<void> {
        if (!video || this.polling) return;
        this.polling = true;
        try {
            const r = await fetch('/live-api/stats', { cache: 'no-store' });
            const body = await r.json();
            // 换场后旧请求才回来：整份丢弃，绝不能拿上一场数据给这一场发积分。
            if (generation !== this.generation || video !== this.video) return;
            if (!r.ok) throw new Error(body.error || `HTTP ${r.status}`);
            if (body.ended) {
                this.ok = false;
                this.live.ytStatus = '这场直播已结束，请填本场直播网址';
                window.clearInterval(this.videoTimer);
                return;
            }
            this.ok = true;
            this.live.ytStatus = '频道增长数据正常';
            if (Number.isFinite(body.likes)) this.live.onLikeTotal(Number(body.likes));
            if (Number.isFinite(body.viewers)) this.live.onViewers(Number(body.viewers));
            if (Number.isFinite(body.subscribers)) this.live.onSubTotal(Number(body.subscribers));
        } catch (error) {
            if (generation !== this.generation || video !== this.video) return;
            this.ok = false;
            this.live.ytStatus = `频道增长数据异常：${String(error instanceof Error ? error.message : error).slice(0, 80)}`;
        } finally {
            if (generation === this.generation) this.polling = false;
        }
    }
}
