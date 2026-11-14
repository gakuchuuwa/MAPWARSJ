/**
 * MAPWAR 的 YouTube 单平台直播服务。
 * 直接读取 YouTube 直播间网页版实时聊天流（youtubei/v1/live_chat/get_live_chat）与直播页数据，
 * 零配额消耗、无需 API 密钥即可 24 小时稳定运行；若配置了 API 密钥且未超额，仅在订阅数满千被网页缩写时辅助查询精确订阅数。
 * 待确认事件 → 浏览器 SSE；游戏记账并 ACK 后才出队。
 * 配置、恢复游标、付款原始记录和观众账务只写本机 .local，不进入前端包或 Git。
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EventEmitter } from 'node:events';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DEFAULT_DATA_DIR = path.join(ROOT, '.local', 'youtube-live');
const PORT = 8787;
const RETRY_MS = 5000;
const RETRY_MAX_MS = 60_000;
const RETRY_ENDED_MS = 5 * 60_000;
const CHAT_POLL_DEFAULT_MS = 1000;
const CHAT_POLL_MIN_MS = 800;
const CHAT_POLL_MAX_MS = 1200;
/** 增长数据（点赞/在线/订阅）服务端缓存：多个页面或刷新也只查一次 */
const STATS_TTL_MS = 30_000;
/** 频道订阅数 API 兜底缓存（仅当网页显示 1.2K 等缩写且配了有效密钥时用） */
const CHANNEL_STATS_TTL_MS = 5 * 60_000;
const STREAM_LOG_MAX_BYTES = 512 * 1024;
const WEB_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function isEndedError(text) {
    return /LIVE_CHAT_ENDED|LIVE_CHAT_DISABLED|ended|disabled|没有活动聊天室|找不到这个直播|不是直播/i.test(String(text || ''));
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
function sleep(ms, signal) {
    return new Promise((resolve) => {
        if (signal?.aborted) { resolve(); return; }
        const timer = setTimeout(resolve, ms);
        signal?.addEventListener('abort', () => { clearTimeout(timer); resolve(); }, { once: true });
    });
}
function parseRunsText(runs) {
    if (!Array.isArray(runs)) return '';
    return runs.map((r) => r?.text ?? r?.emoji?.shortcuts?.[0] ?? '').join('');
}
// [2026-10-30] 网页聊天流的超级留言只有显示文字（如「$5.00」「CA$5.00」「¥1,000」），
// 没有官方接口的 amount_micros / currency；原来一律记 0，游戏按金额折算 = 0 ⇒ 打赏不发计。
// 聊天请求固定 hl=en，写法即英文习惯（¥ = 日元，人民币写 CN¥）。认不出的返回 null：宁可不发也不错发。
const CURRENCY_PREFIX = [
    ['US$', 'USD'], ['CN¥', 'CNY'], ['JP¥', 'JPY'], ['NT$', 'TWD'], ['HK$', 'HKD'], ['CA$', 'CAD'],
    ['AU$', 'AUD'], ['A$', 'AUD'], ['S$', 'SGD'], ['RM', 'MYR'], ['€', 'EUR'], ['£', 'GBP'],
    ['₩', 'KRW'], ['¥', 'JPY'], ['$', 'USD'],
];
export function parsePaidAmount(display) {
    const s = String(display || '').replace(/ /g, ' ').trim();
    const num = s.match(/(\d[\d,]*(?:\.\d+)?)/);
    if (!num) return null;
    const value = Number(num[1].replace(/,/g, ''));
    if (!Number.isFinite(value) || value <= 0) return null;
    const code = s.match(/\b([A-Z]{3})\b/)?.[1];
    const prefix = s.slice(0, num.index).trim();
    const currency = code || CURRENCY_PREFIX.find(([sym]) => prefix === sym)?.[1];
    if (!currency) return null;
    return { amountMicros: String(Math.round(value * 1_000_000)), currency };
}
function parseExactSubscriberCount(text) {
    const s = String(text || '').trim();
    if (!s || /\d\s*[kmb万亿]/i.test(s)) return null;
    const m = s.match(/(\d[\d,]*)/);
    return m ? Number(m[1].replace(/,/g, '')) : null;
}
function parseExactLikeCount(wText) {
    const accMatch = wText.match(/"likeButtonViewModel":\{.*?"accessibilityText":"([^"]+)"/);
    if (accMatch) {
        const nums = accMatch[1].match(/\d[\d,]*/g);
        if (nums && nums.length > 0) return Number(nums[0].replace(/,/g, ''));
    }
    const titleMatch = wText.match(/"iconName":"LIKE","title":"(\d[\d,]*)"/);
    if (titleMatch) return Number(titleMatch[1].replace(/,/g, ''));
    return 0;
}

export class YouTubeLiveService extends EventEmitter {
    constructor(options = {}) {
        super();
        const dataDir = options.dataDir || DEFAULT_DATA_DIR;
        this.configFile = path.join(dataDir, 'config.json');
        this.stateFile = path.join(dataDir, 'state.json');
        this.streamLogFile = path.join(dataDir, 'stream-log.jsonl');
        this.config = readJson(this.configFile, { apiKey: '', video: '' });
        this.state = readJson(this.stateFile, blankState());
        this.status = '未配置 YouTube';
        this.lastChatAt = 0;
        this.lastError = '';
        this.generation = 0;
        this.abortController = null;
        this.retry = null;
        this.statsCache = { video: '', at: 0, value: null };
        this.channelIdCache = new Map();
        this.channelStatsCache = { channelId: '', at: 0, subscribers: null };
        this.failCount = 0;
    }

    publicStatus() {
        return {
            configured: !!this.config.video,
            hasKey: !!this.config.apiKey,
            status: this.status,
            video: this.config.video || '',
            lastChatAt: this.lastChatAt,
            lastError: this.lastError,
            pending: this.state.pending.length,
        };
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
        const rawVideo = String(videoInput ?? '').trim() || (!/^AIza[\w-]{35}$/.test(String(apiKey ?? '').trim()) ? String(apiKey ?? '').trim() : '');
        const video = parseVideoId(rawVideo);
        if (rawVideo && !video) throw new Error('认不出这个 YouTube 直播网址');
        const typedKey = String(apiKey ?? '').trim();
        const validKey = /^AIza[\w-]{35}$/.test(typedKey) ? typedKey : '';
        this.stop();
        const nextKey = validKey || this.config.apiKey;
        this.config = { apiKey: nextKey, video };
        this.statsCache = { video: '', at: 0, value: null };
        this.failCount = 0;
        writeJson(this.configFile, this.config);
        this.start();
        return this.publicStatus();
    }
    start() {
        if (!this.config.video) {
            this.setStatus('未配置 YouTube 直播网址');
            return;
        }
        const generation = ++this.generation;
        this.setStatus('YouTube 聊天流连接中');
        void this.run(generation);
    }
    stop() {
        ++this.generation;
        clearTimeout(this.retry);
        if (this.abortController) {
            try { this.abortController.abort(); } catch { /* 已关闭 */ }
            this.abortController = null;
        }
    }

    schedule(generation, wait) {
        clearTimeout(this.retry);
        this.retry = setTimeout(() => {
            if (generation === this.generation) void this.run(generation);
        }, wait);
    }

    async run(generation) {
        let message = '';
        let result = { gotData: false, clean: false };
        let ended = false;
        try {
            const session = await this.initWebChatSession(this.config.video);
            if (generation !== this.generation) return;
            this.setStatus('YouTube 聊天流已连接（免配额）');
            result = await this.streamWebChat(session, generation);
            message = this.lastError;
        } catch (error) {
            if (generation !== this.generation) return;
            ended = !!error?.liveEnded;
            message = String(error?.details || error?.message || error).slice(0, 240);
        }
        if (generation !== this.generation) return;
        if (ended) {
            this.setStatus('这场直播已结束；新开播请填本场直播网址', message);
            return;
        }
        const ok = result.gotData || result.clean;
        this.failCount = ok ? 0 : this.failCount + 1;
        let wait = ok ? RETRY_MS : Math.min(RETRY_MAX_MS, RETRY_MS * 2 ** Math.max(0, this.failCount - 1));
        let label = ok ? 'YouTube 聊天流重连中' : `YouTube 连接中断，${Math.round(wait / 1000)} 秒后重试`;
        if (isEndedError(message)) {
            wait = RETRY_ENDED_MS;
            label = '这场直播没有聊天室或聊天已关闭，5 分钟后再查；新开播请填本场直播网址';
        }
        if (message || !ok) this.setStatus(label, message);
        this.schedule(generation, wait);
    }

    /**
     * 从 YouTube 直播间网页版获取免配额聊天流会话（INNERTUBE_API_KEY +「实时聊天」全部消息游标）。
     */
    async initWebChatSession(video) {
        const res = await fetch(`https://www.youtube.com/live_chat?v=${video}`, {
            headers: {
                'User-Agent': WEB_UA,
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Cookie': 'CONSENT=YES+cb',
            },
        });
        if (!res.ok) throw new Error(`live_chat HTTP ${res.status}`);
        const html = await res.text();
        const innertubeKey = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1];
        const clientVersion = html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/)?.[1] || '2.20261029.01.00';
        const idMatch = html.match(/window\["ytInitialData"\]\s*=\s*(\{.+?\});\s*<\/script>/s)
            || html.match(/var ytInitialData\s*=\s*(\{.+?\});\s*<\/script>/s);
        if (idMatch && innertubeKey) {
            const initData = JSON.parse(idMatch[1]);
            const lcr = initData?.contents?.liveChatRenderer;
            if (lcr) {
                const subItems = lcr?.header?.liveChatHeaderRenderer?.viewSelector?.sortFilterSubMenuRenderer?.subMenuItems || [];
                // 优先选第 2 项「实时聊天」（显示所有消息，不过滤短口令如“攻”“技1”）
                const continuation = subItems[1]?.continuation?.reloadContinuationData?.continuation
                    || subItems[0]?.continuation?.reloadContinuationData?.continuation
                    || lcr?.continuations?.[0]?.reloadContinuationData?.continuation
                    || lcr?.continuations?.[0]?.timedContinuationData?.continuation
                    || lcr?.continuations?.[0]?.invalidationContinuationData?.continuation;
                if (continuation) {
                    return { video, innertubeKey, clientVersion, continuation };
                }
            }
        }
        // live_chat 拿不到游标时，查一次直播页判断是已结束还是没开聊天室
        const webStats = await this.fetchWebStats(video).catch(() => null);
        if (webStats?.ended) {
            throw Object.assign(new Error('这场直播已结束'), { liveEnded: true });
        }
        throw new Error('本场直播没有活动聊天室；请确认正在直播且已开启聊天');
    }

    async streamWebChat(session, generation) {
        const controller = new AbortController();
        this.abortController = controller;
        const startedAt = Date.now();
        let gotData = false;
        let responses = 0;
        let items = 0;
        let continuation = session.continuation;
        this.lastError = '';

        // 首次连接本场视频（或旧游标还是 gRPC 字符串）时，以当前时刻前 5 秒为起点，
        // 避免第一次打开网页聊天室时把半小时前的历史回放消息当成新指令重复执行；
        // 短暂断线重连时沿用已存的毫秒时间戳游标，补齐断线期间的新弹幕。
        const savedCursor = this.state.cursors[session.video];
        let floorMs = typeof savedCursor === 'number' && savedCursor > 0
            ? savedCursor - 10_000
            : Date.now() - 5_000;
        if (typeof savedCursor !== 'number') {
            this.state.cursors[session.video] = Date.now();
            this.save();
        }

        try {
            while (generation === this.generation && continuation) {
                const r = await fetch(`https://www.youtube.com/youtubei/v1/live_chat/get_live_chat?key=${session.innertubeKey}&prettyPrint=false`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': WEB_UA,
                        'Accept-Language': 'en-US,en;q=0.9',
                    },
                    body: JSON.stringify({
                        context: {
                            client: {
                                clientName: 'WEB',
                                clientVersion: session.clientVersion,
                                // 英文写法，超级留言金额才认得出（见 parsePaidAmount）
                                hl: 'en',
                                gl: 'US',
                            },
                        },
                        continuation,
                    }),
                    signal: controller.signal,
                });
                if (!r.ok) throw new Error(`get_live_chat HTTP ${r.status}`);
                const body = await r.json();
                if (generation !== this.generation) break;
                const cont = body?.continuationContents?.liveChatContinuation;
                if (!cont) {
                    return { gotData, clean: true };
                }
                gotData = true;
                responses++;
                const actions = cont.actions || [];
                let ingestedCount = 0;
                let maxPublishedMs = 0;
                for (const action of actions) {
                    const res = this.ingestWebAction(action, floorMs);
                    if (res.publishedMs > maxPublishedMs) maxPublishedMs = res.publishedMs;
                    if (res.ingested) ingestedCount++;
                }
                items += ingestedCount;
                const nextCursorMs = maxPublishedMs > 0 ? maxPublishedMs : Date.now();
                this.state.cursors[session.video] = Math.max(Number(this.state.cursors[session.video]) || 0, nextCursorMs);
                floorMs = this.state.cursors[session.video] - 10_000;
                if (ingestedCount > 0 || responses % 15 === 1) this.save();

                const nextContObj = cont.continuations?.[0];
                const cData = nextContObj?.timedContinuationData
                    || nextContObj?.invalidationContinuationData
                    || nextContObj?.reloadContinuationData;
                if (!cData?.continuation) {
                    return { gotData, clean: true };
                }
                continuation = cData.continuation;
                const delay = Math.min(CHAT_POLL_MAX_MS, Math.max(CHAT_POLL_MIN_MS, Number(cData.timeoutMs) || CHAT_POLL_DEFAULT_MS));
                await sleep(delay, controller.signal);
            }
            return { gotData, clean: true };
        } catch (error) {
            if (controller.signal.aborted || generation !== this.generation) {
                return { gotData, clean: true };
            }
            this.lastError = this.scrubError(error?.message || error);
            return { gotData, clean: false };
        } finally {
            this.logStream({
                at: new Date(startedAt).toISOString(),
                video: session.video,
                mode: 'web',
                seconds: Math.round((Date.now() - startedAt) / 1000),
                responses,
                items,
                end: this.lastError ? 'error' : 'end',
                error: this.lastError ? this.lastError.slice(0, 160) : undefined,
            });
        }
    }

    ingestWebAction(action, floorMs = 0) {
        const item = action?.addChatItemAction?.item;
        if (!item) return { ingested: false, publishedMs: 0 };
        const textRenderer = item.liveChatTextMessageRenderer;
        const paidRenderer = item.liveChatPaidMessageRenderer;
        const stickerRenderer = item.liveChatPaidStickerRenderer;
        const renderer = textRenderer || paidRenderer || stickerRenderer;
        if (!renderer) return { ingested: false, publishedMs: 0 };

        const rawId = renderer.id;
        const channelId = renderer.authorExternalChannelId;
        if (!rawId || !channelId) return { ingested: false, publishedMs: 0 };
        const usec = Number(renderer.timestampUsec);
        const publishedMs = Number.isFinite(usec) && usec > 0 ? Math.floor(usec / 1000) : Date.now();
        const id = `youtube:${rawId}`;
        if (this.state.handled[id] || this.state.payments[id] || this.state.pending.some((e) => e.id === id)) {
            return { ingested: false, publishedMs };
        }
        if (floorMs > 0 && publishedMs < floorMs) {
            // 连接前的旧历史消息：记入 handled 防止后续再处理，不触发游戏动作
            this.state.handled[id] = new Date().toISOString();
            return { ingested: false, publishedMs };
        }
        const rawName = renderer.authorName?.simpleText || '';
        const viewer = rawName.replace(/^@/, '').trim() || 'YouTube 观众';
        const text = parseRunsText(renderer.message?.runs);
        const publishedAt = new Date(publishedMs).toISOString();
        const isPaid = !!(paidRenderer || stickerRenderer);
        const display = renderer.purchaseAmountText?.simpleText || '';
        const amount = isPaid ? parsePaidAmount(display) : null;
        if (isPaid && !amount) console.log(`[YouTube] 认不出超级留言金额「${display}」，不发计，原始记录留在 state.json 待核对`);
        const event = {
            id,
            platform: 'youtube',
            uid: `youtube:${channelId}`,
            viewer,
            text,
            publishedAt,
            ...(isPaid ? {
                payment: {
                    amountMicros: amount?.amountMicros ?? '0',
                    currency: amount?.currency ?? '',
                    display,
                    kind: paidRenderer ? 'Super Chat' : 'Super Sticker',
                },
            } : {}),
        };
        this.pushEvent(event);
        return { ingested: true, publishedMs };
    }

    /** 兼容旧版官方 gRPC 格式的 ingest（供单元测试或备用调用） */
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
                    amountMicros: String(pay.amount_micros ?? '0'),
                    currency: pay.currency || '',
                    display: pay.amount_display_string || '',
                    kind: isSuperChat ? 'Super Chat' : 'Super Sticker',
                },
            } : {}),
        };
        this.pushEvent(event);
    }

    pushEvent(event) {
        this.state.pending.push(event);
        if (event.payment) {
            this.state.payments[event.id] = { event, receivedAt: new Date().toISOString(), acknowledgedAt: '' };
            console.log(`[YouTube] 收到 ${event.payment.kind} ${event.payment.display}，等待游戏记账`);
        }
        this.lastChatAt = Date.now();
        this.save();
        this.emit('event', event);
        this.emit('status', this.publicStatus());
    }

    async fetchWebStats(video) {
        const res = await fetch(`https://www.youtube.com/watch?v=${video}`, {
            headers: {
                'User-Agent': WEB_UA,
                'Accept-Language': 'en-US,en;q=0.9',
                'Cookie': 'CONSENT=YES+cb',
            },
        });
        if (!res.ok) throw new Error(`watch HTTP ${res.status}`);
        const html = await res.text();
        const prMatch = html.match(/var ytInitialPlayerResponse\s*=\s*(\{.+?\});\s*(?:var|<\/script>)/s);
        if (!prMatch) throw new Error('无法解析 YouTube 直播页面');
        const pr = JSON.parse(prMatch[1]);
        if (pr.playabilityStatus?.status === 'ERROR') {
            throw new Error('找不到这个直播视频 ID');
        }
        const vd = pr.videoDetails || {};
        const lbd = pr.microformat?.playerMicroformatRenderer?.liveBroadcastDetails;
        if (!vd.isLiveContent && !lbd) {
            throw new Error('这个视频不是直播');
        }
        const ended = !!(lbd?.endTimestamp || (lbd && lbd.isLiveNow === false && !vd.isLive));
        // [2026-10-30 主人报「在线人数是累计的」] videoDetails.viewCount 是累计观看数；
        // 实时在线（「N watching now」）在 ytInitialData 的 videoViewCountRenderer.originalViewCount
        let viewers = 0;
        let likes = 0;
        let subscribers = null;
        const idMatch = html.match(/var ytInitialData\s*=\s*(\{.+?\});\s*<\/script>/s);
        if (idMatch) {
            const wText = idMatch[1];
            const live = wText.match(/"videoViewCountRenderer":\{[^]*?"isLive":true,"originalViewCount":"(\d+)"/);
            if (vd.isLive && live) viewers = Number(live[1]);
            likes = parseExactLikeCount(wText);
            const subMatch = wText.match(/"subscriberCountText":\{"accessibility":\{"accessibilityData":\{"label":"([^"]+)"\}\}/);
            if (subMatch) subscribers = parseExactSubscriberCount(subMatch[1]);
        }
        return {
            likes,
            viewers,
            subscribers,
            ended,
            channelId: vd.channelId || '',
        };
    }

    async fetchStats() {
        if (!this.config.video) throw new Error('尚未配置 YouTube 直播网址');
        const now = Date.now();
        if (this.statsCache.video === this.config.video && this.statsCache.value && now - this.statsCache.at < STATS_TTL_MS) {
            return this.statsCache.value;
        }
        const web = await this.fetchWebStats(this.config.video);
        let subscribers = web.subscribers;
        const channelId = web.channelId || this.channelIdCache.get(this.config.video) || '';
        if (channelId) this.channelIdCache.set(this.config.video, channelId);

        // 若订阅数超过 1000 被网页缩写为 1.2K（subscribers === null），且配了 API Key，则每 5 分钟尝试用 API 查一次精确值
        if (subscribers === null && channelId && this.config.apiKey) {
            const cs = this.channelStatsCache;
            if (cs.channelId === channelId && now - cs.at < CHANNEL_STATS_TTL_MS) {
                subscribers = cs.subscribers;
            } else {
                try {
                    const channelUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
                    channelUrl.searchParams.set('part', 'statistics');
                    channelUrl.searchParams.set('id', channelId);
                    const channelResponse = await fetch(channelUrl, {
                        headers: { 'x-goog-api-key': this.config.apiKey },
                    });
                    if (channelResponse.ok) {
                        const channelBody = await channelResponse.json().catch(() => null);
                        const stats = channelBody?.items?.[0]?.statistics;
                        if (stats && !stats.hiddenSubscriberCount) subscribers = Number(stats.subscriberCount);
                        this.channelStatsCache = { channelId, at: now, subscribers };
                    }
                } catch { /* API 失败或配额用完时静默忽略，不影响点赞与在线人数 */ }
            }
        }
        const value = {
            likes: web.likes,
            viewers: web.viewers,
            subscribers,
            ended: web.ended,
        };
        this.statsCache = { video: this.config.video, at: now, value };
        return value;
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
        // 已确认的打赏记录与按视频的游标只留近期，避免状态文件无限增长（未确认的打赏一律保留）
        const payIds = Object.keys(this.state.payments);
        if (payIds.length > 2000) {
            const done = payIds.filter((k) => this.state.payments[k]?.acknowledgedAt);
            for (const old of done.slice(0, Math.max(0, payIds.length - 2000))) delete this.state.payments[old];
        }
        const cursorKeys = Object.keys(this.state.cursors);
        if (cursorKeys.length > 50) {
            cursorKeys.sort((a, b) => (Number(this.state.cursors[a]) || 0) - (Number(this.state.cursors[b]) || 0));
            for (const old of cursorKeys.slice(0, cursorKeys.length - 50)) delete this.state.cursors[old];
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
    // 本服务只给本机页面用：带 Origin 的写请求必须来自本机（localhost / 127.0.0.1 / ::1），挡住别的网页跨站改配置、改账本
    const localOrigin = (req) => {
        const origin = String(req.headers.origin || '');
        if (!origin) return true;
        try { return ['localhost', '127.0.0.1', '[::1]'].includes(new URL(origin).hostname); } catch { return false; }
    };
    return http.createServer(async (req, res) => {
        const url = new URL(req.url || '/', 'http://127.0.0.1');
        try {
            if (req.method === 'POST' && !localOrigin(req)) return json(res, 403, { error: '拒绝非本机来源的请求' });
            if (req.method === 'GET' && url.pathname === '/health') return json(res, 200, { ok: true });
            if (req.method === 'GET' && url.pathname === '/state') return json(res, 200, service.snapshot());
            if (req.method === 'GET' && url.pathname === '/stats') return json(res, 200, await service.fetchStats());
            if (req.method === 'POST' && url.pathname === '/config') {
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
                const heartbeat = setInterval(() => res.write('event: ping\ndata: {}\n\n'), 15000);
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
        console.log(`[YouTube] 单平台直播服务已启动（免配额模式）：http://127.0.0.1:${PORT}`);
        service.start();
    });
    const shutdown = () => {
        service.stop();
        server.close(() => process.exit(0));
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}
