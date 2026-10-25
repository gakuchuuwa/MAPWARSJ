/**
 * 🔴 [2026-10-24 主人「全面进行直播挣钱模式」；2026-10-23 主人「B站我上不了。要有粉丝量才行」]
 * 游戏这一头接直播间：走 Social Stream Ninja（SSN，开源免费，github.com/steveseguin/social_stream）。
 *
 * SSN 是浏览器扩展 / 桌面程序，把 YouTube、Twitch、TikTok 等直播间的聊天和打赏收成一种格式，
 * 再经它的服务器 `wss://io.socialstream.ninja/join/会话ID/4` 推出来——游戏在浏览器里直接连，
 * 不用中转、不用平台开发者账号。Ko-fi / Stripe 打赏也能经 SSN 的 webhook 进来（不看粉丝数）。
 *
 * SSN 那边要开两个开关（Global settings → Mechanics）：
 *   ① Enable remote API control of extension　② Send chat messages to API server
 * 会话 ID 在 SSN 扩展弹窗里；填进 F9 面板，存 localStorage。会话 ID 等于密码：谁拿到谁能伪造打赏，别外传。
 *
 * 消息字段出处：SSN api.md「Content Object Structure」——chatname / chatmessage / type / userid / id /
 * hasDonation（带单位的金额字串，如 "$5.00"）/ donoValue（折合美元，有就以它为准）。
 */
import type { ViewerLive } from './ViewerLive';
import { YouTubeStats } from './YouTubeStats';

const SESSION_KEY = 'mapwar-ssn-session';
const SERVER = 'wss://io.socialstream.ninja/join';
/** 断了多久重连 */
const RETRY_MS = 5000;

interface SsnMessage {
    chatname?: string;
    chatmessage?: string;
    type?: string;
    userid?: string;
    id?: number | string;
    hasDonation?: string;
    donoValue?: number;
    bot?: boolean;
    /** 结构化事件名：viewer_update / followed / liked / joined …；普通聊天没有或为 false */
    event?: string | boolean;
    /** viewer_update 时是在线人数（数字），其余事件是对象 */
    meta?: { webhookId?: string } | number;
}

/**
 * 常见币种折合美元（大约值，只在 SSN 没给 donoValue 时兜底用）。
 * 按 YouTube 超级留言的写法认：「CN¥」是人民币、单写「¥」是日元。长的写法排前面，免得「NT$」被当成「$」。
 */
const USD_RATE: [RegExp, number][] = [
    [/^(?:CN¥|RMB|CNY)/i, 0.14], [/^(?:NT\$|TWD)/i, 0.031], [/^(?:HK\$|HKD)/i, 0.128],
    [/^(?:CA\$|CAD)/i, 0.73], [/^(?:A\$|AUD)/i, 0.66], [/^(?:SGD|S\$)/i, 0.74], [/^(?:MYR|RM)/i, 0.21],
    [/^(?:US\$|USD|\$)/i, 1], [/^(?:€|EUR)/i, 1.08], [/^(?:£|GBP)/i, 1.27],
    [/^(?:¥|JPY|円)/i, 0.0067], [/^(?:₩|KRW)/i, 0.00073],
];

/** 打赏折合多少美分；认不出币种的按一计的钱算（YouTube 超级留言、Ko-fi 最低都是约 1 美元） */
function donationCents(m: SsnMessage, fallback: number): number {
    if (typeof m.donoValue === 'number' && Number.isFinite(m.donoValue)) return Math.round(m.donoValue * 100);
    const s = (m.hasDonation ?? '').trim().replace(/\s+/g, ' ');
    // 「币种 数额」或「数额 币种」两种写法都认
    const pre = s.match(/^(\D+?)\s*([\d,]+(?:\.\d+)?)/);
    const post = s.match(/^([\d,]+(?:\.\d+)?)\s*([A-Z]{3})\b/i);
    const unit = pre ? pre[1] : post ? post[2] : '';
    const amount = parseFloat(((pre ? pre[2] : post?.[1]) ?? '').replace(/,/g, ''));
    const rate = USD_RATE.find(([re]) => re.test(unit))?.[1];
    if (rate === undefined || !(amount > 0)) return fallback;
    return Math.round(amount * rate * 100);
}

/** chatmessage 可能带表情的 HTML，只留字 */
function plainText(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

export class SocialStreamBridge {
    private ws: WebSocket | null = null;
    private session = '';
    private retry = 0;
    /** 重连时可能补发，同一条只认一次 */
    private seen = new Set<string>();
    /** YouTube 点赞 / 订阅 / 在线人数轮询（SSN 不给这几样） */
    public readonly yt: YouTubeStats;

    constructor(private readonly live: ViewerLive) {
        this.yt = new YouTubeStats(live);
        try { this.session = localStorage.getItem(SESSION_KEY) ?? ''; } catch { /* 隐私模式 */ }
        this.connect();
    }

    public getSession(): string { return this.session; }

    /** F9 面板填会话 ID；空串＝断开不接 */
    public setSession(id: string): void {
        this.session = id.trim();
        try { localStorage.setItem(SESSION_KEY, this.session); } catch { /* 隐私模式 */ }
        this.connect();
    }

    private connect(): void {
        window.clearTimeout(this.retry);
        if (this.ws) { this.ws.onclose = null; this.ws.close(); this.ws = null; }
        if (!this.session) { this.live.platformStatus = ''; return; }
        this.live.platformStatus = '直播间连接中';
        const ws = new WebSocket(`${SERVER}/${encodeURIComponent(this.session)}/4`);
        this.ws = ws;
        ws.onopen = () => { this.live.platformStatus = '直播间已连接'; };
        ws.onmessage = (e) => {
            try { this.handle(JSON.parse(String(e.data)) as SsnMessage); } catch { /* 不是 JSON 的丢掉 */ }
        };
        ws.onclose = () => {
            this.live.platformStatus = '直播间断开，重连中';
            this.retry = window.setTimeout(() => this.connect(), RETRY_MS);
        };
    }

    private handle(m: SsnMessage): void {
        // 在线人数（YouTube / TikTok / Twitch 的 viewer_update，meta 就是人数）；没有昵称，要先于下面的判断
        if (m.event === 'viewer_update') {
            const n = Number(m.meta);
            // YouTube 接口给的人数更准，已经在报时不让 SSN 的覆盖
            if (!this.yt.ok) this.live.onViewers(n);
            return;
        }
        if (!m.chatname || m.bot) return;
        const hook = typeof m.meta === 'object' ? m.meta.webhookId : undefined;
        const key = hook ?? (m.id !== undefined ? `${m.type}:${m.id}` : '');
        if (key) {
            if (this.seen.has(key)) return;
            this.seen.add(key);
            if (this.seen.size > 2000) this.seen = new Set([...this.seen].slice(-1000));
        }
        const uid = `${m.type ?? 'chat'}:${m.userid || m.chatname}`;
        // TikTok 的结构化事件：关注（个人 +令）、点赞（一条算一份全场点赞）；进场、分享等其余事件不当聊天
        if (m.event === 'followed') { this.live.onFollow(uid, m.chatname); return; }
        if (m.event === 'liked') { this.live.onLikes(1); return; }
        if (m.event && !m.hasDonation) return;
        const text = plainText(m.chatmessage ?? '');
        if (m.hasDonation) {
            this.live.onPayment(uid, m.chatname, donationCents(m, this.live.pricePerCast()), `打赏 ${m.hasDonation}`);
        }
        if (text) this.live.onChat(m.chatname, text, false, uid);
    }
}
