/**
 * EdgeTtsClient.ts — 直连微软 Edge 在线 TTS，取回云健/云希 Neural 男声。
 *
 * 背景：云健(zh-CN-YunjianNeural)是 Edge 白嫖微软 Azure 的在线语音，新版 Edge 已把它
 * 从网页 Web Speech 接口撤除，网页点不到；本机系统语音又只剩女声（康康音库损坏）。
 * 故自建直连：走 Edge「朗读」用的同一个 WebSocket 端点合成 mp3，浏览器里直接播。
 * 2026-07-20 实测四种 Origin(扩展/localhost/vercel/空)握手全 101，微软不校验 Origin，
 * 本地 + Vercel 一份代码通吃，无需任何后端。鉴权参数与算法见 memory/kangkang-voice-registry-broken。
 *
 * 用法：edgeTtsClient.synthesize(text, { voice, rate }) → Promise<Blob>(audio/mpeg)。
 * 任何失败（网络/超时/协议变动）都 reject，调用方须回落 Web Speech，直播不能哑。
 */

const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const WIN_EPOCH = 11644473600; // 1601→1970 秒差
/** Edge 版本号：微软偶尔收紧校验，403 时优先更新此值（对齐 edge-tts 的 CHROMIUM_FULL_VERSION） */
const SEC_MS_GEC_VERSION = '1-143.0.3650.75';
const OUTPUT_FORMAT = 'audio-24khz-48kbitrate-mono-mp3';

export type EdgeVoice = 'zh-CN-YunjianNeural' | 'zh-CN-YunxiNeural';

export interface EdgeTtsOptions {
    voice?: EdgeVoice;
    /** Web Speech 风格语速（1=正常），转成 SSML 百分比 */
    rate?: number;
    /** 合成超时（ms）；超时 reject 让调用方回落 */
    timeoutMs?: number;
}

/** Sec-MS-GEC：Windows 文件时间取整到 5 分钟，拼 token 后 SHA256 大写十六进制 */
async function generateSecMsGec(): Promise<string> {
    let ticks = Date.now() / 1000 + WIN_EPOCH;
    ticks -= ticks % 300;        // 5 分钟粒度
    ticks *= 1e9 / 100;          // 秒 → 100ns
    const str = `${ticks.toFixed(0)}${TRUSTED_CLIENT_TOKEN}`;
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
}

function ratePercent(rate?: number): string {
    if (rate === undefined || !isFinite(rate)) return '+0%';
    const pct = Math.round((rate - 1) * 100);
    return `${pct >= 0 ? '+' : ''}${pct}%`;
}

function buildSsml(text: string, voice: EdgeVoice, rate?: number): string {
    // 转义 SSML 特殊字符，防播报文本里的 & < > 破坏 XML
    const safe = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return (
        `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='zh-CN'>` +
        `<voice name='${voice}'>` +
        `<prosody pitch='+0Hz' rate='${ratePercent(rate)}' volume='+0%'>${safe}</prosody>` +
        `</voice></speak>`
    );
}

class EdgeTtsClient {
    /** 简单缓存：同一句(含 voice/rate)只合成一次，重复播报零延迟、省流量 */
    private cache = new Map<string, Blob>();
    private static readonly CACHE_MAX = 120;

    /** 运行时探测结果：一旦确认端点连不上（协议变动等），短期内不再重试，快速回落 */
    private disabledUntilMs = 0;

    isTemporarilyDisabled(): boolean {
        return Date.now() < this.disabledUntilMs;
    }

    async synthesize(text: string, opts: EdgeTtsOptions = {}): Promise<Blob> {
        const voice: EdgeVoice = opts.voice ?? 'zh-CN-YunjianNeural';
        const rate = opts.rate;
        const timeoutMs = opts.timeoutMs ?? 7000;
        const key = `${voice}|${ratePercent(rate)}|${text}`;

        const cached = this.cache.get(key);
        if (cached) return cached;
        if (this.isTemporarilyDisabled()) throw new Error('edge-tts temporarily disabled');
        if (typeof WebSocket === 'undefined' || typeof crypto?.subtle === 'undefined') {
            throw new Error('WebSocket/WebCrypto unavailable');
        }

        const gec = await generateSecMsGec();
        const url =
            `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1` +
            `?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${gec}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}`;

        return await new Promise<Blob>((resolve, reject) => {
            const ws = new WebSocket(url);
            ws.binaryType = 'arraybuffer';
            const chunks: ArrayBuffer[] = [];
            let done = false;

            const finish = (err: Error | null, blob?: Blob) => {
                if (done) return;
                done = true;
                window.clearTimeout(timer);
                try { ws.close(); } catch { /* ignore */ }
                if (err) {
                    reject(err);
                } else if (blob) {
                    this.putCache(key, blob);
                    resolve(blob);
                } else {
                    reject(new Error('no audio'));
                }
            };

            const timer = window.setTimeout(() => finish(new Error('edge-tts timeout')), timeoutMs);

            ws.onopen = () => {
                const now = new Date().toISOString();
                ws.send(
                    `X-Timestamp:${now}\r\nContent-Type:application/json; charset=utf-8\r\n` +
                    `Path:speech.config\r\n\r\n` +
                    JSON.stringify({
                        context: {
                            synthesis: {
                                audio: {
                                    metadataoptions: { sentenceBoundaryEnabled: false, wordBoundaryEnabled: false },
                                    outputFormat: OUTPUT_FORMAT,
                                },
                            },
                        },
                    }),
                );
                const reqId = (crypto.randomUUID?.() ?? `${Date.now()}${Math.random()}`).replace(/-/g, '');
                ws.send(
                    `X-RequestId:${reqId}\r\nContent-Type:application/ssml+xml\r\n` +
                    `X-Timestamp:${now}\r\nPath:ssml\r\n\r\n` +
                    buildSsml(text, voice, rate),
                );
            };

            ws.onmessage = (ev: MessageEvent) => {
                if (typeof ev.data === 'string') {
                    if (ev.data.includes('Path:turn.end')) {
                        if (chunks.length === 0) { finish(new Error('empty audio')); return; }
                        finish(null, new Blob(chunks, { type: 'audio/mpeg' }));
                    }
                    return;
                }
                // 二进制帧：前 2 字节大端 = 头长度，之后为头，余下是 mp3 音频
                const buf = ev.data as ArrayBuffer;
                const view = new DataView(buf);
                if (buf.byteLength < 2) return;
                const headerLen = view.getUint16(0, false);
                const audioStart = 2 + headerLen;
                if (buf.byteLength > audioStart) chunks.push(buf.slice(audioStart));
            };

            ws.onerror = () => {
                // 端点连不上（很可能协议/版本变动）→ 短期禁用，避免每句都卡满超时
                this.disabledUntilMs = Date.now() + 60000;
                finish(new Error('edge-tts ws error'));
            };
            ws.onclose = (ev: CloseEvent) => {
                if (!done) {
                    if (ev.code !== 1000) this.disabledUntilMs = Date.now() + 60000;
                    finish(new Error(`edge-tts closed ${ev.code}`));
                }
            };
        });
    }

    private putCache(key: string, blob: Blob): void {
        if (this.cache.size >= EdgeTtsClient.CACHE_MAX) {
            const oldest = this.cache.keys().next().value;
            if (oldest !== undefined) this.cache.delete(oldest);
        }
        this.cache.set(key, blob);
    }
}

export const edgeTtsClient = new EdgeTtsClient();
