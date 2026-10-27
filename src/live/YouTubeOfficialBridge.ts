/**
 * YouTube 单平台正式接入：本地 Node 服务负责官方 gRPC、恢复游标与待确认事件；
 * 浏览器只通过同源 /live-api 收事件和回写已记账账本，不接触 API 密钥。
 */
import type { ViewerLive, YouTubeLiveEvent, ViewerLedger } from './ViewerLive';
import { YouTubeStats } from './YouTubeStats';

export class YouTubeOfficialBridge {
    public readonly yt: YouTubeStats;
    private events: EventSource | null = null;
    private retry = 0;
    private stopped = false;
    private configured = false;
    private video = '';
    private ledgerChain: Promise<void> = Promise.resolve();

    constructor(private readonly live: ViewerLive) {
        this.yt = new YouTubeStats(live);
        this.live.onLedgerChange = (ledger) => this.saveLedger(ledger);
        void this.start();
    }

    public getVideo(): string { return this.video; }
    public isConfigured(): boolean { return this.configured; }

    private async start(): Promise<void> {
        try {
            const r = await fetch('/live-api/state', { cache: 'no-store' });
            if (!r.ok) throw new Error(`state HTTP ${r.status}`);
            const state = await r.json();
            if (state.ledger) this.live.hydrateLedger(state.ledger as ViewerLedger);
            this.applyStatus(state);
            this.connect();
        } catch {
            this.live.platformStatus = '本地 YouTube 服务未启动';
            clearTimeout(this.retry);
            this.retry = window.setTimeout(() => void this.start(), 5000);
        }
    }

    private connect(): void {
        if (this.stopped) return;
        if (this.events) this.events.close();
        const events = new EventSource('/live-api/events');
        this.events = events;
        events.addEventListener('status', (e) => this.applyStatus(JSON.parse((e as MessageEvent).data)));
        events.addEventListener('live', (e) => {
            const event = JSON.parse((e as MessageEvent).data) as YouTubeLiveEvent;
            this.ledgerChain = this.ledgerChain.then(() => this.accept(event)).catch((error) => {
                console.error('[YouTube] 事件暂未记账，将等待重连重试', error);
            });
        });
        events.onerror = () => {
            this.live.platformStatus = 'YouTube 本地通道重连中';
            // EventSource 自动重连；服务端会在每次重连后重发全部未确认事件。
        };
    }

    private async accept(event: YouTubeLiveEvent): Promise<void> {
        this.live.handleYouTubeEvent(event);
        await this.post('/live-api/ack', { id: event.id, ledger: this.live.exportLedger() });
    }

    private applyStatus(s: any): void {
        this.configured = !!s.configured;
        this.video = typeof s.video === 'string' ? s.video : '';
        this.live.platformStatus = String(s.status || '');
        if (s.lastChatAt) this.live.lastChatAt = Number(s.lastChatAt);
        this.yt.setVideo(this.video);
    }

    public async configure(apiKey: string, video: string): Promise<boolean> {
        const payload: { apiKey?: string; video: string } = { video };
        // 已保存的密钥不在浏览器显示；换直播网址时留空即沿用。清空网址才同时清除配置。
        if (apiKey.trim() || !video.trim() || !this.configured) payload.apiKey = apiKey;
        const r = await fetch('/live-api/config', {
            method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
        });
        const body = await r.json();
        if (!r.ok) {
            this.live.platformStatus = String(body.error || `配置失败 ${r.status}`);
            return false;
        }
        this.applyStatus(body);
        return true;
    }

    private saveLedger(ledger: ViewerLedger): void {
        this.ledgerChain = this.ledgerChain.then(() => this.post('/live-api/ledger', ledger)).catch((error) => {
            console.error('[YouTube] 账务暂未同步，本地缓存仍保留', error);
        });
    }

    private async post(url: string, value: unknown): Promise<void> {
        const r = await fetch(url, {
            method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(value),
        });
        if (!r.ok) throw new Error(`${url} HTTP ${r.status}`);
    }

    public stop(): void {
        this.stopped = true;
        clearTimeout(this.retry);
        this.events?.close();
        this.events = null;
    }
}
