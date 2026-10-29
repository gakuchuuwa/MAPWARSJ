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
    private hasKey = false;
    private video = '';
    private hasConnected = false;
    private readonly clientId = globalThis.crypto?.randomUUID?.()
        ?? `page-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    private ledgerChain: Promise<void> = Promise.resolve();

    constructor(private readonly live: ViewerLive) {
        this.yt = new YouTubeStats(live);
        this.live.onLedgerChange = (ledger) => this.saveLedger(ledger);
        // 只有拿到事件流的页面才是唯一记账页；别的页面账本是副本，不许自己发在场分
        this.live.isAccountingPage = () => this.hasConnected && this.events !== null;
        void this.start();
    }

    public getVideo(): string { return this.video; }
    public isConfigured(): boolean { return this.configured; }
    /** 本机服务已存有 API 密钥（密钥本身不进浏览器） */
    public hasSavedKey(): boolean { return this.hasKey; }

    private async start(): Promise<void> {
        try {
            const r = await fetch('/live-api/state', { cache: 'no-store' });
            if (!r.ok) throw new Error(`state HTTP ${r.status}`);
            const state = await r.json();
            if (!this.hasConnected && state.ledger) this.live.hydrateLedger(state.ledger as ViewerLedger);
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
        clearTimeout(this.retry);
        this.events?.close();
        const events = new EventSource(`/live-api/events?client=${encodeURIComponent(this.clientId)}`);
        this.events = events;
        events.addEventListener('status', (e) => {
            this.applyStatus(JSON.parse((e as MessageEvent).data));
            if (this.hasConnected) return;
            this.hasConnected = true;
            // 接管页面必须先取得唯一记账页的最新账本，再处理随后重发的事件。
            this.ledgerChain = this.ledgerChain.then(async () => {
                const r = await fetch('/live-api/state', { cache: 'no-store' });
                if (!r.ok) throw new Error(`接管账本 HTTP ${r.status}`);
                const state = await r.json();
                if (state.ledger) this.live.hydrateLedger(state.ledger as ViewerLedger);
            });
        });
        events.addEventListener('live', (e) => {
            const event = JSON.parse((e as MessageEvent).data) as YouTubeLiveEvent;
            this.ledgerChain = this.ledgerChain.then(() => this.accept(event)).catch((error) => {
                console.error('[YouTube] 事件暂未记账，将等待重连重试', error);
            });
        });
        events.onerror = () => {
            events.close();
            if (this.events === events) this.events = null;
            this.live.platformStatus = 'YouTube 本地通道重连中';
            clearTimeout(this.retry);
            this.retry = window.setTimeout(() => this.connect(), 5000);
        };
    }

    private async accept(event: YouTubeLiveEvent): Promise<void> {
        this.live.handleYouTubeEvent(event);
        await this.post('/live-api/ack', { id: event.id, ledger: this.live.exportLedger() });
    }

    private applyStatus(s: any): void {
        this.configured = !!s.configured;
        this.hasKey = !!s.hasKey;
        this.video = typeof s.video === 'string' ? s.video : '';
        this.live.platformStatus = String(s.status || '');
        if (s.lastChatAt) this.live.lastChatAt = Number(s.lastChatAt);
        this.yt.setVideo(this.video);
    }

    public async configure(apiKey: string, video: string): Promise<boolean> {
        try {
            const payload: { apiKey?: string; video: string } = { video };
            // 已保存的密钥不在浏览器显示；密钥框留空一律沿用本机已存的密钥。
            // 🔴 [2026-10-30 主人报「为什么每次都让输入API」] 原来「网址为空 / 页面还没拿到服务状态（configured=false）」
            //    时会把空密钥发过去，服务端照单全收 ⇒ 已存的密钥被清空，下次只好重填。现在只有真填了才发。
            if (apiKey.trim()) payload.apiKey = apiKey;
            const r = await fetch('/live-api/config', {
                method: 'POST', headers: this.headers(), body: JSON.stringify(payload),
            });
            const body = await r.json();
            if (!r.ok) {
                this.live.platformStatus = String(body.error || `配置失败 ${r.status}`);
                return false;
            }
            this.applyStatus(body);
            return true;
        } catch (error) {
            this.live.platformStatus = `配置失败：${String(error instanceof Error ? error.message : error).slice(0, 80)}`;
            return false;
        }
    }

    private saveLedger(ledger: ViewerLedger): void {
        this.ledgerChain = this.ledgerChain.then(() => this.post('/live-api/ledger', ledger)).catch((error) => {
            console.error('[YouTube] 账务暂未同步，本地缓存仍保留', error);
        });
    }

    private headers(): Record<string, string> {
        return { 'content-type': 'application/json', 'x-mapwar-client': this.clientId };
    }

    private async post(url: string, value: unknown): Promise<void> {
        const r = await fetch(url, {
            method: 'POST', headers: this.headers(), body: JSON.stringify(value),
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
