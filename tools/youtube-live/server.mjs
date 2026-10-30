/**
 * MAPWAR 的 YouTube 单平台直播服务。
 * 官方 gRPC streamList → 待确认事件 → 浏览器 SSE；游戏记账并 ACK 后才出队。
 * API 密钥、恢复游标、付款原始记录和观众账务只写本机 .local，不进入前端包或 Git。
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EventEmitter } from 'node:events';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DEFAULT_DATA_DIR = path.join(ROOT, '.local', 'youtube-live');
const PROTO_FILE = path.join(ROOT, 'tools', 'youtube-live', 'stream_list.proto');
const PORT = 8787;
const RETRY_MS = 5000;
// 🔴 [2026-10-30 主人报「连不上了」：配额用光] 每次重连 = videos.list 1 单位 + streamList 5 单位
//    （官方：streamList「A call to this method has a quota cost of 5 units」）。原来不论什么错都 5 秒一重连，
//    直播结束后对着已结束的视频每小时空烧几百到几千单位，默认每日 10000 单位撑不过一天。
//    改为：连续失败按 5→10→20→40→60 秒退避；配额用光 15 分钟再试；直播已结束 / 没有聊天室 5 分钟再试。
// [2026-10-30 配额全面排查] 第二轮：
//  · 连续出错封顶从 60 秒提到 5 分钟（60 秒一次 streamList 一天就是 7200 单位）；
//  · 流正常结束后两次 streamList 至少隔 20 秒（凭 page_token 续接，不丢弹幕）；
//  · 配额用光直接等到太平洋零点，不再 15 分钟试一次；
//  · 直播确认已结束（actualEndTime）就彻底停，等主人填新网址；
//  · 游戏页面全关 1 分钟后暂停连接，页面回来再连；
//  · 每次请求按单价记进 usage.json，每段流的时长记进 stream-log.jsonl，下次超额能拿数据说话。
const RETRY_MAX_MS = 5 * 60_000;
const RETRY_ENDED_MS = 5 * 60_000;
const STREAM_MIN_GAP_MS = 20_000;
const CLIENT_GRACE_MS = 60_000;
/** 增长数据（点赞/在线）服务端缓存：几个页面同时查也只算一次 */
const STATS_TTL_MS = 60_000;
/** 频道订阅数变化慢，单独缓存，省掉每次查增长数据都多花的 1 单位 */
const CHANNEL_STATS_TTL_MS = 5 * 60_000;
/** 官方单价：videos.list / channels.list 各 1，streamList 5；默认每日 10000 */
const QUOTA_COST = { 'videos.list': 1, 'channels.list': 1, streamList: 5 };
const QUOTA_LIMIT = 10_000;
/** 到 9000 单位停掉点赞/在线查询，剩下的留给弹幕流 */
const QUOTA_STATS_CUTOFF = 9_000;
const STREAM_LOG_MAX_BYTES = 512 * 1024;
function isQuotaError(text) { return /quota/i.test(String(text || '')); }
function isEndedError(text) { return /LIVE_CHAT_ENDED|LIVE_CHAT_DISABLED|ended|disabled|没有活动聊天室|找不到这个直播/i.test(String(text || '')); }
/** YouTube 配额按太平洋时间自然日结算 */
function quotaDay(t = Date.now()) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(t);
}
function msUntilQuotaReset(t = Date.now()) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles', hourCycle: 'h23', hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(t).map((p) => [p.type, Number(p.value)]));
    const elapsed = (parts.hour * 3600 + parts.minute * 60 + parts.second) * 1000;
    return 24 * 3600_000 - elapsed + 60_000;
}

function readJson(file, fallback) {
    try { return { ...fallback, ...JSON.parse(fs.readFileSync(file, 'utf8')) }; } catch { return fallback; }
}
function writeJson(file, value) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.tmp-${process.pid}`;
    fs.writeFileSync(tmp, JSON.stringify(value, null, 2), { encoding: 'utf8', mode: 0o600 });
    try { fs.renameSync(tmp, file); }
    catch {
        fs.writeFileSync(file, JSON.stringify(value, null, 2), { encoding: 'utf8', mode: 0o600 });
        try { fs.unlinkSync(tmp); } catch { /* 临时文件已不存在 */ }
    }
}
export function parseVideoId(input) {
    const s = String(input ?? '').trim();
    const m = s.match(/(?:[?&]v=|\/live\/|youtu\.be\/|\/shorts\/)([\w-]{11})/) ?? s.match(/^([\w-]{11})$/);
    return m?.[1] ?? '';
}
function blankState() {
    return { cursors: {}, pending: [], handled: {}, payments: {}, ledger: null };
}
function asMicros(value) {
    if (value === undefined || value === null) return '0';
    return typeof value === 'string' ? value : String(value);
}

export class YouTubeLiveService extends EventEmitter {
    constructor(options = {}) {
        super();
        const dataDir = options.dataDir || DEFAULT_DATA_DIR;
        this.configFile = path.join(dataDir, 'config.json');
        this.stateFile = path.join(dataDir, 'state.json');
        this.usageFile = path.join(dataDir, 'usage.json');
        this.streamLogFile = path.join(dataDir, 'stream-log.jsonl');
        this.config = readJson(this.configFile, { apiKey: '', video: '' });
        this.state = readJson(this.stateFile, blankState());
        this.usage = readJson(this.usageFile, { day: '', key: '', used: 0, byMethod: {}, exhausted: false });
        this.lastStreamAt = 0;
        this.clients = 0;
        this.idleTimer = null;
        /** 没有游戏页面连着就不连 YouTube；页面连上（clientAttached）才开始 */
        this.paused = true;
        this.status = '未配置 YouTube';
        this.lastChatAt = 0;
        this.lastError = '';
        this.generation = 0;
        this.call = null;
        this.retry = null;
        this.statsCache = { video: '', at: 0, value: null };
        this.channelIdCache = new Map();
        this.channelStatsCache = { channelId: '', at: 0, subscribers: null };
        this.chatIdCache = { video: '', chatId: '' };
        this.failCount = 0;
        const definition = protoLoader.loadSync(PROTO_FILE, {
            keepCase: true, longs: String, enums: String, defaults: false, oneofs: true,
        });
        const api = grpc.loadPackageDefinition(definition).youtube.api.v3;
        this.client = new api.V3DataLiveChatMessageService(
            'youtube.googleapis.com:443', grpc.credentials.createSsl(),
        );
    }

    publicStatus() {
        return {
            configured: !!(this.config.apiKey && this.config.video),
            /** 本机服务里已存着密钥（不回传密钥本身）：面板据此提示「留空沿用」，不再像每次都要填 */
            hasKey: !!this.config.apiKey,
            status: this.status,
            video: this.config.video || '',
            lastChatAt: this.lastChatAt,
            lastError: this.lastError,
            pending: this.state.pending.length,
            quota: { ...this.currentUsage(), limit: QUOTA_LIMIT },
        };
    }

    /** 本服务今天（太平洋日、当前密钥）发出的请求按单价累计；换日或换密钥清零 */
    currentUsage() {
        const day = quotaDay();
        const key = String(this.config?.apiKey || '').slice(-6);
        if (this.usage.day !== day || this.usage.key !== key) {
            this.usage = { day, key, used: 0, byMethod: {}, exhausted: false };
        }
        return { day: this.usage.day, used: this.usage.used, byMethod: this.usage.byMethod, exhausted: this.usage.exhausted };
    }
    charge(method) {
        this.currentUsage();
        const cost = QUOTA_COST[method] ?? 1;
        this.usage.used += cost;
        this.usage.byMethod[method] = (this.usage.byMethod[method] || 0) + 1;
        writeJson(this.usageFile, this.usage);
    }
    markExhausted() {
        this.currentUsage();
        if (this.usage.exhausted) return;
        this.usage.exhausted = true;
        writeJson(this.usageFile, this.usage);
        console.log(`[YouTube] 今日配额用光，本服务今日记账约 ${this.usage.used} 单位`, this.usage.byMethod);
    }
    logStream(entry) {
        try {
            fs.mkdirSync(path.dirname(this.streamLogFile), { recursive: true });
            try {
                if (fs.statSync(this.streamLogFile).size > STREAM_LOG_MAX_BYTES) {
                    const lines = fs.readFileSync(this.streamLogFile, 'utf8').trim().split('\n');
                    fs.writeFileSync(this.streamLogFile, lines.slice(-500).join('\n') + '\n');
                }
            } catch { /* 文件还不存在 */ }
            fs.appendFileSync(this.streamLogFile, JSON.stringify(entry) + '\n');
        } catch { /* 日志写不进不影响直播 */ }
    }
    /** 记账页面连上 / 断开：页面全关 1 分钟后暂停一切 YouTube 请求 */
    clientAttached() {
        this.clients++;
        clearTimeout(this.idleTimer);
        if (this.paused) {
            this.paused = false;
            this.failCount = 0;
            this.start();
        }
    }
    clientDetached() {
        this.clients = Math.max(0, this.clients - 1);
        if (this.clients > 0) return;
        clearTimeout(this.idleTimer);
        this.idleTimer = setTimeout(() => {
            if (this.clients > 0) return;
            this.paused = true;
            this.stop();
            this.setStatus('游戏页面都已关闭，暂停连接 YouTube（不耗配额）');
        }, CLIENT_GRACE_MS);
    }
    snapshot() {
        return { ...this.publicStatus(), ledger: this.state.ledger };
    }
    scrubError(raw) {
        const text = String(raw || '').slice(0, 240);
        const key = this.config?.apiKey;
        return key && key.length >= 6 ? text.split(key).join('[REDACTED]') : text;
    }
    setStatus(status, error = '') {
        this.status = status;
        this.lastError = this.scrubError(error);
        this.emit('status', this.publicStatus());
    }
    save() { writeJson(this.stateFile, this.state); }

    configure(apiKey, videoInput) {
        const video = parseVideoId(videoInput);
        if (String(videoInput ?? '').trim() && !video) throw new Error('认不出这个 YouTube 直播网址');
        const typedKey = String(apiKey ?? '').trim();
        // [2026-10-30] 密钥框误填了 10 个字符，把存好的真密钥整个覆盖掉，之后一直报 API key not valid。
        // Google API 密钥固定是 AIza 开头共 39 位；不像密钥的输入一律拒收，原密钥保持不动。
        if (typedKey && !/^AIza[\w-]{35}$/.test(typedKey)) {
            throw new Error('这不像 YouTube API 密钥（应为 AIza 开头共 39 位），原密钥未改动');
        }
        this.stop();
        const nextKey = typedKey || this.config.apiKey;
        this.config = { apiKey: nextKey, video };
        this.statsCache = { video: '', at: 0, value: null };
        this.chatIdCache = { video: '', chatId: '' };
        this.failCount = 0;
        writeJson(this.configFile, this.config);
        this.start();
        return this.publicStatus();
    }
    start() {
        if (!this.config.apiKey || !this.config.video) {
            this.setStatus('未配置 YouTube');
            return;
        }
        if (this.paused) {
            this.setStatus('等游戏页面打开后再连接 YouTube（不耗配额）');
            return;
        }
        const generation = ++this.generation;
        this.setStatus('YouTube 官方接口连接中');
        void this.run(generation);
    }
    stop() {
        ++this.generation;
        clearTimeout(this.retry);
        if (this.call) { try { this.call.cancel(); } catch { /* 已关闭 */ } }
        this.call = null;
    }

    schedule(generation, wait) {
        clearTimeout(this.retry);
        this.retry = setTimeout(() => {
            if (generation === this.generation) void this.run(generation);
        }, wait);
    }

    async run(generation) {
        if (this.paused) return;
        if (this.currentUsage().exhausted) {
            this.setStatus('YouTube 今日配额已用完，太平洋时间零点重置后自动重连（日本时间 16 点 / 冬令时 17 点）');
            this.schedule(generation, msUntilQuotaReset());
            return;
        }
        // 两次 streamList 至少隔开 STREAM_MIN_GAP_MS；凭 page_token 续接，晚几秒不丢弹幕
        const gap = this.lastStreamAt + STREAM_MIN_GAP_MS - Date.now();
        if (gap > 0) { this.schedule(generation, gap); return; }
        let message = '';
        let result = { gotData: false, clean: false };
        let ended = false;
        try {
            const chatId = await this.resolveChatId(this.config.video);
            if (generation !== this.generation) return;
            this.setStatus('YouTube 官方聊天流已连接');
            this.lastStreamAt = Date.now();
            result = await this.streamChat(chatId, generation);
            message = this.lastError;
        } catch (error) {
            if (generation !== this.generation) return;
            ended = !!error?.liveEnded;
            message = String(error?.details || error?.message || error).slice(0, 240);
        }
        if (generation !== this.generation) return;
        if (isQuotaError(message)) {
            this.markExhausted();
            this.setStatus('YouTube 今日配额已用完，太平洋时间零点重置后自动重连（日本时间 16 点 / 冬令时 17 点）', message);
            this.schedule(generation, msUntilQuotaReset());
            return;
        }
        if (ended) {
            // 直播确认结束：这个视频不会再有聊天室，彻底停下等新网址，不再耗任何配额
            this.chatIdCache = { video: '', chatId: '' };
            this.setStatus('这场直播已结束；新开播请填本场直播网址', message);
            return;
        }
        // 收到过数据或服务器正常关流 = 续接；出错且没数据 = 累计失败退避（最长 5 分钟）
        const ok = result.gotData || result.clean;
        this.failCount = ok ? 0 : this.failCount + 1;
        let wait = ok ? STREAM_MIN_GAP_MS : Math.min(RETRY_MAX_MS, RETRY_MS * 2 ** Math.max(0, this.failCount - 1));
        let label = ok ? 'YouTube 聊天流重连中' : `YouTube 连接中断，${Math.round(wait / 1000)} 秒后重试`;
        if (isEndedError(message)) {
            wait = RETRY_ENDED_MS;
            this.chatIdCache = { video: '', chatId: '' };
            label = '这场直播没有聊天室或聊天已关闭，5 分钟后再查；新开播请填本场直播网址';
        }
        if (message || !ok) this.setStatus(label, message);
        this.schedule(generation, wait);
    }

    async resolveChatId(video) {
        // 同一场直播的聊天室 ID 不变：重连不再每次花 1 单位查 videos.list
        if (this.chatIdCache.video === video && this.chatIdCache.chatId) return this.chatIdCache.chatId;
        const url = new URL('https://www.googleapis.com/youtube/v3/videos');
        url.searchParams.set('part', 'liveStreamingDetails');
        url.searchParams.set('id', video);
        this.charge('videos.list');
        const response = await fetch(url, {
            headers: { 'x-goog-api-key': this.config.apiKey },
        });
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(this.scrubError(body?.error?.message || `videos.list HTTP ${response.status}`));
        const item = body?.items?.[0];
        if (!item) throw new Error('找不到这个直播视频 ID');
        if (item.liveStreamingDetails?.actualEndTime) {
            throw Object.assign(new Error('这场直播已结束'), { liveEnded: true });
        }
        const chatId = item.liveStreamingDetails?.activeLiveChatId;
        if (!chatId) throw new Error('本场直播没有活动聊天室；请确认正在直播且已开启聊天');
        this.chatIdCache = { video, chatId };
        return chatId;
    }

    async fetchStats() {
        if (!this.config.apiKey || !this.config.video) throw new Error('尚未配置 YouTube');
        const now = Date.now();
        if (this.statsCache.video === this.config.video && this.statsCache.value && now - this.statsCache.at < STATS_TTL_MS) {
            return this.statsCache.value;
        }
        const usage = this.currentUsage();
        if (usage.exhausted) throw new Error('今日配额已用完，增长数据暂停到太平洋时间零点');
        if (usage.used >= QUOTA_STATS_CUTOFF) throw new Error(`今日已用约 ${usage.used} 单位，增长数据暂停，配额留给弹幕`);
        const headers = { 'x-goog-api-key': this.config.apiKey };
        const videoUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
        videoUrl.searchParams.set('part', 'snippet,statistics,liveStreamingDetails');
        videoUrl.searchParams.set('id', this.config.video);
        this.charge('videos.list');
        const videoResponse = await fetch(videoUrl, { headers });
        const videoBody = await videoResponse.json().catch(() => null);
        if (!videoResponse.ok) {
            const msg = videoBody?.error?.message || `videos.list HTTP ${videoResponse.status}`;
            if (isQuotaError(msg)) this.markExhausted();
            throw new Error(this.scrubError(msg));
        }
        const item = videoBody?.items?.[0];
        if (!item) throw new Error('找不到这个直播视频 ID');
        let subscribers = null;
        const channelId = item.snippet?.channelId || this.channelIdCache.get(this.config.video) || '';
        const cs = this.channelStatsCache;
        if (channelId && cs.channelId === channelId && now - cs.at < CHANNEL_STATS_TTL_MS) {
            subscribers = cs.subscribers;
        } else if (channelId) {
            this.channelIdCache.set(this.config.video, channelId);
            const channelUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
            channelUrl.searchParams.set('part', 'statistics');
            channelUrl.searchParams.set('id', channelId);
            this.charge('channels.list');
            const channelResponse = await fetch(channelUrl, { headers });
            const channelBody = await channelResponse.json().catch(() => null);
            if (channelResponse.ok) {
                const stats = channelBody?.items?.[0]?.statistics;
                if (stats && !stats.hiddenSubscriberCount) subscribers = Number(stats.subscriberCount);
                this.channelStatsCache = { channelId, at: now, subscribers };
            }
        }
        const value = {
            likes: Number(item.statistics?.likeCount),
            viewers: Number(item.liveStreamingDetails?.concurrentViewers),
            subscribers,
            ended: !!item.liveStreamingDetails?.actualEndTime,
        };
        this.statsCache = { video: this.config.video, at: now, value };
        return value;
    }

    /** 返回 { gotData 这一轮收到过数据, clean 服务器正常关流 }（决定重连是否退避） */
    streamChat(chatId, generation) {
        return new Promise((resolveRaw) => {
            let gotData = false;
            let responses = 0;
            let items = 0;
            const startedAt = Date.now();
            let settled = false;
            const resolve = (clean, error = '') => {
                if (settled) return;
                settled = true;
                this.logStream({
                    at: new Date(startedAt).toISOString(), video: this.config.video,
                    seconds: Math.round((Date.now() - startedAt) / 1000), responses, items,
                    end: clean ? 'end' : 'error', error: error ? this.scrubError(error).slice(0, 160) : undefined,
                });
                resolveRaw({ gotData, clean });
            };
            this.lastError = '';
            this.charge('streamList');
            const cursor = this.state.cursors[this.config.video] || undefined;
            const metadata = new grpc.Metadata();
            metadata.set('x-goog-api-key', this.config.apiKey);
            const request = {
                live_chat_id: chatId,
                part: ['snippet', 'authorDetails'],
                max_results: 500,
                ...(cursor ? { page_token: cursor } : {}),
            };
            const call = this.client.StreamList(request, metadata);
            this.call = call;
            call.on('data', (response) => {
                if (generation !== this.generation) return;
                gotData = true;
                responses++;
                items += (response.items || []).length;
                if (response.next_page_token) {
                    this.state.cursors[this.config.video] = response.next_page_token;
                }
                for (const item of response.items || []) this.ingest(item);
                this.save();
            });
            call.on('error', (error) => {
                if (generation !== this.generation) return;
                this.lastError = this.scrubError(error?.details || error?.message || error);
                resolve(false, this.lastError);
            });
            call.on('end', () => resolve(true));
        });
    }

    ingest(item) {
        const id = item?.id ? `youtube:${item.id}` : '';
        const snippet = item?.snippet;
        if (!id || !snippet || this.state.handled[id] || this.state.payments[id] || this.state.pending.some((e) => e.id === id)) return;
        const type = snippet.type;
        const isText = type === 'TEXT_MESSAGE_EVENT' || type === 1;
        const isSuperChat = type === 'SUPER_CHAT_EVENT' || type === 15;
        const isSuperSticker = type === 'SUPER_STICKER_EVENT' || type === 16;
        if (!isText && !isSuperChat && !isSuperSticker) return;
        const pay = isSuperChat ? snippet.super_chat_details : isSuperSticker ? snippet.super_sticker_details : null;
        const channelId = snippet.author_channel_id || item.author_details?.channel_id;
        if (!channelId) return;
        const event = {
            id,
            platform: 'youtube',
            uid: `youtube:${channelId}`,
            viewer: item.author_details?.display_name || 'YouTube 观众',
            text: isText ? (snippet.text_message_details?.message_text || '') : (pay?.user_comment || ''),
            publishedAt: snippet.published_at || new Date().toISOString(),
            ...(pay ? {
                payment: {
                    amountMicros: asMicros(pay.amount_micros),
                    currency: pay.currency || '',
                    display: pay.amount_display_string || '',
                    kind: isSuperChat ? 'Super Chat' : 'Super Sticker',
                },
            } : {}),
        };
        this.state.pending.push(event);
        if (pay) {
            this.state.payments[event.id] = { event, receivedAt: new Date().toISOString(), acknowledgedAt: '' };
            console.log(`[YouTube] 收到 ${event.payment.kind} ${event.payment.display}，等待游戏记账`);
        }
        this.lastChatAt = Date.now();
        this.save();
        this.emit('event', event);
        this.emit('status', this.publicStatus());
    }

    acknowledge(id, ledger) {
        if (this.state.pending.some((event) => event.id === id)) {
            this.state.pending = this.state.pending.filter((event) => event.id !== id);
            this.state.handled[id] = new Date().toISOString();
            if (this.state.payments[id]) {
                this.state.payments[id].acknowledgedAt = new Date().toISOString();
                console.log(`[YouTube] ${id} 已完成游戏记账`);
            }
        }
        this.saveLedger(ledger, false);
        const handledIds = Object.keys(this.state.handled);
        if (handledIds.length > 5000) {
            for (const old of handledIds.slice(0, handledIds.length - 5000)) delete this.state.handled[old];
        }
        this.save();
        this.emit('status', this.publicStatus());
    }
    saveLedger(ledger, persist = true) {
        if (!ledger || typeof ledger !== 'object' || Array.isArray(ledger)) return false;
        const cur = this.state.ledger;
        if (cur && cur.day === ledger.day
            && Number.isSafeInteger(cur.revision) && Number.isSafeInteger(ledger.revision)
            && ledger.revision < cur.revision) {
            return false;
        }
        this.state.ledger = ledger;
        if (persist) this.save();
        return true;
    }
}

function json(res, status, value) {
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
    res.end(JSON.stringify(value));
}
async function body(req) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
        size += chunk.length;
        if (size > 1024 * 1024) throw new Error('请求过大');
        chunks.push(chunk);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

export function createHttpServer(service) {
    // 一个直播只能有一个记账页面。其余页面的 EventSource 得 204（停止原生重连），
    // 由桥接器低频重试；主页面断开后才允许另一页接管，防止双页面重复入账/覆盖账本。
    let activeClient = '';
    const requestClient = (req) => String(req.headers['x-mapwar-client'] || '');
    const canWrite = (req) => !!activeClient && requestClient(req) === activeClient;
    return http.createServer(async (req, res) => {
        const url = new URL(req.url || '/', 'http://127.0.0.1');
        try {
            if (req.method === 'GET' && url.pathname === '/health') return json(res, 200, { ok: true });
            if (req.method === 'GET' && url.pathname === '/state') return json(res, 200, service.snapshot());
            if (req.method === 'GET' && url.pathname === '/stats') return json(res, 200, await service.fetchStats());
            if (req.method === 'POST' && url.pathname === '/config') {
                if (activeClient && !canWrite(req)) return json(res, 409, { error: '另一个游戏页面正在管理这场直播' });
                const data = await body(req);
                return json(res, 200, service.configure(data.apiKey, data.video));
            }
            if (req.method === 'POST' && url.pathname === '/ack') {
                if (!canWrite(req)) return json(res, 409, { error: '这个页面不是当前记账页面' });
                const data = await body(req);
                service.acknowledge(String(data.id || ''), data.ledger);
                return json(res, 200, { ok: true });
            }
            if (req.method === 'POST' && url.pathname === '/ledger') {
                if (!canWrite(req)) return json(res, 409, { error: '这个页面不是当前记账页面' });
                service.saveLedger(await body(req));
                return json(res, 200, { ok: true });
            }
            if (req.method === 'GET' && url.pathname === '/events') {
                const client = String(url.searchParams.get('client') || '').slice(0, 100);
                if (!client) return json(res, 400, { error: '缺少页面标识' });
                if (activeClient && activeClient !== client) {
                    res.writeHead(204, { 'cache-control': 'no-store' });
                    res.end();
                    return;
                }
                activeClient = client;
                service.clientAttached();
                res.writeHead(200, {
                    'content-type': 'text/event-stream; charset=utf-8',
                    'cache-control': 'no-cache, no-transform',
                    connection: 'keep-alive',
                    'x-accel-buffering': 'no',
                });
                res.write(': connected\n\n');
                const send = (name, value) => res.write(`event: ${name}\ndata: ${JSON.stringify(value)}\n\n`);
                const onEvent = (event) => send('live', event);
                const onStatus = (status) => send('status', status);
                service.on('event', onEvent);
                service.on('status', onStatus);
                // 状态先行：接管页先水合最新账本，再消费重发的未确认事件。
                send('status', service.publicStatus());
                for (const event of service.state.pending) send('live', event);
                const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 15000);
                req.on('close', () => {
                    clearInterval(heartbeat);
                    service.off('event', onEvent);
                    service.off('status', onStatus);
                    if (activeClient === client) activeClient = '';
                    service.clientDetached();
                });
                return;
            }
            json(res, 404, { error: 'not found' });
        } catch (error) {
            json(res, 400, { error: String(error?.message || error) });
        }
    });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const service = new YouTubeLiveService();
    const server = createHttpServer(service);
    server.listen(PORT, '127.0.0.1', () => {
        console.log(`[YouTube] 单平台直播服务已启动：http://127.0.0.1:${PORT}`);
        service.start();
    });
    const shutdown = () => {
        service.stop();
        server.close(() => process.exit(0));
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}
