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
        this.config = readJson(this.configFile, { apiKey: '', video: '' });
        this.state = readJson(this.stateFile, blankState());
        this.status = '未配置 YouTube';
        this.lastChatAt = 0;
        this.lastError = '';
        this.generation = 0;
        this.call = null;
        this.retry = null;
        this.statsCache = { video: '', at: 0, value: null };
        this.channelIdCache = new Map();
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
            status: this.status,
            video: this.config.video || '',
            lastChatAt: this.lastChatAt,
            lastError: this.lastError,
            pending: this.state.pending.length,
        };
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
        this.stop();
        const nextKey = apiKey === undefined ? this.config.apiKey : String(apiKey ?? '').trim();
        this.config = { apiKey: nextKey, video };
        this.statsCache = { video: '', at: 0, value: null };
        writeJson(this.configFile, this.config);
        this.start();
        return this.publicStatus();
    }
    start() {
        if (!this.config.apiKey || !this.config.video) {
            this.setStatus('未配置 YouTube');
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

    async run(generation) {
        try {
            const chatId = await this.resolveChatId(this.config.video);
            if (generation !== this.generation) return;
            this.setStatus('YouTube 官方聊天流已连接');
            await this.streamChat(chatId, generation);
        } catch (error) {
            if (generation !== this.generation) return;
            const message = String(error?.details || error?.message || error).slice(0, 240);
            this.setStatus('YouTube 连接中断，5 秒后恢复', message);
        }
        if (generation !== this.generation) return;
        clearTimeout(this.retry);
        this.retry = setTimeout(() => {
            if (generation === this.generation) void this.run(generation);
        }, RETRY_MS);
    }

    async resolveChatId(video) {
        const url = new URL('https://www.googleapis.com/youtube/v3/videos');
        url.searchParams.set('part', 'liveStreamingDetails');
        url.searchParams.set('id', video);
        const response = await fetch(url, {
            headers: { 'x-goog-api-key': this.config.apiKey },
        });
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(this.scrubError(body?.error?.message || `videos.list HTTP ${response.status}`));
        const item = body?.items?.[0];
        if (!item) throw new Error('找不到这个直播视频 ID');
        const chatId = item.liveStreamingDetails?.activeLiveChatId;
        if (!chatId) throw new Error('本场直播没有活动聊天室；请确认正在直播且已开启聊天');
        return chatId;
    }

    async fetchStats() {
        if (!this.config.apiKey || !this.config.video) throw new Error('尚未配置 YouTube');
        const now = Date.now();
        if (this.statsCache.video === this.config.video && this.statsCache.value && now - this.statsCache.at < 15_000) {
            return this.statsCache.value;
        }
        const headers = { 'x-goog-api-key': this.config.apiKey };
        const videoUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
        videoUrl.searchParams.set('part', 'snippet,statistics,liveStreamingDetails');
        videoUrl.searchParams.set('id', this.config.video);
        const videoResponse = await fetch(videoUrl, { headers });
        const videoBody = await videoResponse.json().catch(() => null);
        if (!videoResponse.ok) throw new Error(this.scrubError(videoBody?.error?.message || `videos.list HTTP ${videoResponse.status}`));
        const item = videoBody?.items?.[0];
        if (!item) throw new Error('找不到这个直播视频 ID');
        let subscribers = null;
        const channelId = item.snippet?.channelId || this.channelIdCache.get(this.config.video) || '';
        if (channelId) {
            this.channelIdCache.set(this.config.video, channelId);
            const channelUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
            channelUrl.searchParams.set('part', 'statistics');
            channelUrl.searchParams.set('id', channelId);
            const channelResponse = await fetch(channelUrl, { headers });
            const channelBody = await channelResponse.json().catch(() => null);
            if (channelResponse.ok) {
                const stats = channelBody?.items?.[0]?.statistics;
                if (stats && !stats.hiddenSubscriberCount) subscribers = Number(stats.subscriberCount);
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

    streamChat(chatId, generation) {
        return new Promise((resolve) => {
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
                if (response.next_page_token) {
                    this.state.cursors[this.config.video] = response.next_page_token;
                }
                for (const item of response.items || []) this.ingest(item);
                this.save();
            });
            call.on('error', (error) => {
                if (generation !== this.generation) return;
                this.lastError = this.scrubError(error?.details || error?.message || error);
                resolve();
            });
            call.on('end', () => resolve());
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
