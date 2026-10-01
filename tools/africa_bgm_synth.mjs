/**
 * 非洲 BGM 合成器 —— 生成一首**纯器乐**的非洲风格曲（撒哈拉以南：djembe 鼓组 + kora 拨弦 + balafon 木琴 + 沙锤 + 低音鼓）。
 *
 * 为什么要自己合成（2026-10-02 主人令）：
 *   原 `public/assets/bgm/AFRICA_bgm.aud` 是 **Baba Yetu（Christopher Tin，带人声的歌曲）** ——
 *   主人定「BGM 不许是歌、要纯音乐」（人声会盖住行军播报），且那首是受版权保护的商业作品。
 *   网上能免费下载的非洲曲目要么版权不明、要么同样带人声，所以这里**自己合成一首**：无版权问题、确定纯器乐、可复现可调。
 *
 * 用法：node tools/africa_bgm_synth.mjs <输出.wav>
 *   然后 `ffmpeg -i out.wav -af "aecho=...,loudnorm=..." -c:a libvorbis public/assets/bgm/AFRICA_bgm.aud`
 *   最后 `npm run bgm:audit` 核准响度并把实测 LUFS 写回 `BGM_REGION_GAIN.AFRICA`。
 *
 * 曲子规格：D 小调五声音阶（D F G A C）· 104 BPM · 4/4 · 64 小节 ≈ 2:28 · 44.1kHz 立体声 16bit。
 * 结构：8 小节鼓引子 → +kora/低音（16）→ +balafon 主旋律（16）→ 8 小节留白（只有 kora 与木琴）→ 全奏收束（16）。
 */
import fs from 'fs';

const SR = 44100;
const BPM = 104;
const BEAT = 60 / BPM;
const BAR = 4 * BEAT;
const BARS = 64;
const TOTAL = Math.ceil(BARS * BAR * SR) + SR;         // 尾巴多留 1 秒给混响
const L = new Float32Array(TOTAL), R = new Float32Array(TOTAL);

/* ── 音高表（D 小调五声） ───────────────────────────────────────────── */
const HZ = {
    D2: 73.42, A2: 110.00, C3: 130.81, D3: 146.83, F3: 174.61, G3: 196.00, A3: 220.00,
    C4: 261.63, D4: 293.66, F4: 349.23, G4: 392.00, A4: 440.00, C5: 523.25, D5: 587.33,
};

/* ── 基础工具 ───────────────────────────────────────────────────────── */
const noise = () => Math.random() * 2 - 1;
/** 16 分音符的样本位置 */
const at = (bar, step) => Math.floor((bar * BAR + step * (BEAT / 4)) * SR);
function add(buf, pos, src, gain = 1) {
    for (let i = 0; i < src.length; i++) { const k = pos + i; if (k >= 0 && k < TOTAL) buf[k] += src[i] * gain; }
}
/** 一阶低通（柔化噪声） */
function lp(x, prev, a) { return prev + a * (x - prev); }

/* ── 音色 ───────────────────────────────────────────────────────────── */

/** Karplus-Strong 拨弦：kora（科拉琴）—— 拨一下、指数衰减、带一点阻尼 */
function kora(freq, dur, bright = 0.55) {
    const N = Math.max(2, Math.round(SR / freq));
    const buf = new Float32Array(N);
    let p = 0;
    for (let i = 0; i < N; i++) { p = lp(noise(), p, bright); buf[i] = p; }         // 激励 = 低通噪声（越柔 bright 越小）
    const out = new Float32Array(Math.round(dur * SR));
    let idx = 0, last = 0;
    const damp = 0.5 * (1 - Math.min(0.02, freq / 20000));                          // 高频衰减更快
    for (let i = 0; i < out.length; i++) {
        const cur = buf[idx], nxt = buf[(idx + 1) % N];
        const v = (cur * (1 - damp) + nxt * damp) * 0.9975;
        buf[idx] = v; out[i] = v; idx = (idx + 1) % N;
    }
    // 收尾淡出，避免爆音
    const fade = Math.min(2200, out.length);
    for (let i = 0; i < fade; i++) out[out.length - 1 - i] *= i / fade;
    return out;
}

/** 木琴 / balafon：正弦 + 4 倍泛音（金属味），快起音、短衰减 */
function balafon(freq, dur) {
    const out = new Float32Array(Math.round(dur * SR));
    for (let i = 0; i < out.length; i++) {
        const t = i / SR;
        const env = Math.exp(-t * 6.5) * (1 - Math.exp(-t * 900));
        out[i] = Math.sin(2 * Math.PI * freq * t) * env
            + 0.32 * Math.sin(2 * Math.PI * freq * 4.02 * t) * env * Math.exp(-t * 9)
            + 0.12 * Math.sin(2 * Math.PI * freq * 9.1 * t) * env * Math.exp(-t * 16);
    }
    return out;
}

/** 鼓：音高下滑的皮膜音 + 瞬态噪声。kind: dun(低)、tone(中)、slap(脆) */
function drum(kind, amp = 1) {
    const cfg = { dun: { f0: 128, f1: 62, dur: 0.42, nz: 0.18, nf: 900 },
        tone: { f0: 268, f1: 176, dur: 0.20, nz: 0.10, nf: 1500 },
        slap: { f0: 420, f1: 300, dur: 0.11, nz: 0.42, nf: 2600 } }[kind];
    const out = new Float32Array(Math.round(cfg.dur * SR));
    let p = 0;
    for (let i = 0; i < out.length; i++) {
        const t = i / SR, k = t / cfg.dur;
        const f = cfg.f0 * Math.pow(cfg.f1 / cfg.f0, Math.min(1, k * 2.2));
        const env = Math.exp(-t * (kind === 'dun' ? 9 : 24));
        p = lp(noise(), p, 0.5);
        out[i] = Math.sin(2 * Math.PI * f * t) * env + p * cfg.nz * Math.exp(-t * 90);
    }
    return out.map((v) => v * amp);
}

/** 低音鼓（dundun）：更沉、更长 */
function dundun(freq = 62, dur = 0.55) {
    const out = new Float32Array(Math.round(dur * SR));
    for (let i = 0; i < out.length; i++) {
        const t = i / SR, k = t / dur;
        const f = freq * Math.pow(0.82, Math.min(1, k * 2.0));
        out[i] = Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 5.5) * (1 - Math.exp(-t * 400));
    }
    return out;
}

/** 沙锤：高通噪声脉冲 */
function shaker(amp = 0.5) {
    const out = new Float32Array(Math.round(0.085 * SR));
    let prev = 0;
    for (let i = 0; i < out.length; i++) {
        const t = i / SR;
        const w = noise();
        const hp = w - prev; prev = w;                              // 一阶差分 = 高通
        out[i] = hp * Math.exp(-t * 55) * amp;
    }
    return out;
}

/* ── 编配 ───────────────────────────────────────────────────────────── */

/** 16 步图案：'.' 空 / 字符见各声部映射 */
const PAT = {
    djembe: 'B..T..s.T..B.s.T',      // 手鼓主型（B 低音 T 中音 s 拍击）
    djembeFill: 'B.sTB.sTBsT..sT',
    shaker: 'x.X.x.X.x.X.x.X.',
};
const stepDur = BEAT / 4;
const playPattern = (pat, voice, bar, gain) => {
    for (let s = 0; s < pat.length; s++) {
        const c = pat[s];
        if (c === '.') continue;
        const pos = at(bar, s);
        if (voice === 'djembe') {
            if (c === 'B') add(L, pos, drum('dun', gain));
            if (c === 'T') add(L, pos, drum('tone', gain * 0.8));
            if (c === 's') add(L, pos, drum('slap', gain * 0.75));
        } else if (voice === 'shaker') {
            const amp = c === 'X' ? 0.055 : 0.032;
            const v = shaker(amp * gain);
            add(L, pos, v, 0.9); add(R, pos, v, 1.0);
        }
    }
};

/** kora 固定音型（4 小节一轮，五声音阶上行-折返） */
const KORA_MOTIF = [
    ['D3', 0], ['A3', 2], ['F3', 4], ['C4', 6], ['D3', 8], ['A3', 10], ['G3', 12], ['F3', 14],
    ['D3', 0], ['A3', 2], ['F3', 4], ['C4', 6], ['D3', 8], ['C4', 9], ['A3', 10], ['G3', 12], ['F3', 13], ['D3', 14],
    ['D3', 0], ['A3', 2], ['F3', 4], ['C4', 6], ['D3', 8], ['A3', 10], ['G3', 12], ['A3', 14],
    ['C4', 0], ['A3', 2], ['G3', 4], ['F3', 6], ['D3', 8], ['F3', 10], ['G3', 12], ['A3', 14],
];
const playKoraBar = (bar, gain = 0.5) => {
    const k = ((bar % 4) + 4) % 4;
    for (let i = 0; i < 8; i++) {                                    // 每小节 8 个音（第 2 小节有 10 个 → 用 base 定位）
        const idx = [0, 8, 18, 26][k] + i;
        const pair = KORA_MOTIF[idx];
        if (!pair) break;
        const [n, s] = pair;
        const v = kora(HZ[n], 1.15, 0.5);
        const pan = (i % 2 === 0) ? 0.72 : 0.95;                     // 轻微左右分开，听感更宽
        add(L, at(bar, s), v, gain * pan);
        add(R, at(bar, s), v, gain * (1.85 - pan));
    }
};

/** 主旋律：8 小节一句（balafon），两句变奏交替 */
const MELODY = {
    A: [[0, 'D4', 6], [6, 'F4', 4], [10, 'A4', 6], [16, 'G4', 4], [20, 'F4', 8], [28, 'D4', 4],
        [32, 'C4', 4], [36, 'D4', 6], [42, 'F4', 6], [48, 'G4', 4], [52, 'A4', 8], [60, 'C5', 4]],
    B: [[0, 'A4', 6], [6, 'G4', 4], [10, 'F4', 6], [16, 'D4', 4], [20, 'F4', 6], [26, 'G4', 4],
        [32, 'A4', 8], [40, 'C5', 6], [46, 'A4', 4], [50, 'G4', 6], [56, 'F4', 4], [60, 'D4', 8]],
};
const playMelody = (bar0, phrase, gain = 0.42) => {
    for (const [s, n, len] of MELODY[phrase]) {
        const pos = Math.floor((bar0 * BAR + s * stepDur) * SR);
        const v = balafon(HZ[n], Math.max(0.5, len === 0 ? 0.6 : len * 0.28));
        add(L, pos, v, gain * 0.95); add(R, pos, v, gain);
    }
};

/* ── 排布（64 小节） ────────────────────────────────────────────────── */
for (let bar = 0; bar < BARS; bar++) {
    const section = bar < 8 ? 'intro' : bar < 24 ? 'groove' : bar < 40 ? 'melody' : bar < 48 ? 'break' : 'full';
    const barIn4 = bar % 4;
    const fill = barIn4 === 3 && (bar % 8 === 7);

    // 手鼓：引子只打骨架；留白段不加鼓；其余全奏
    if (section !== 'break') {
        const g = section === 'intro' ? 0.78 : 0.72;                 // 引子别太轻（主人对「安静前奏」很敏感）
        playPattern(fill ? PAT.djembeFill : PAT.djembe, 'djembe', bar, g);
    }
    // 低音鼓：正拍与「四拍半」，引子后进入
    if (section !== 'intro' && section !== 'break') {
        add(L, at(bar, 0), dundun(62), 0.5);
        if (barIn4 % 2 === 1) add(L, at(bar, 10), dundun(58), 0.38);
        if (fill) add(L, at(bar, 14), dundun(66), 0.34);
    }
    // 沙锤：贯穿（留白段停）
    if (section !== 'break') playPattern(PAT.shaker, 'shaker', bar, section === 'intro' ? 1 : 1);
    // kora：第 2 小节就进来（开头别空）
    if (bar >= 2) playKoraBar(bar, section === 'break' ? 0.62 : 0.5);
    // 木琴主旋律：melody 段用 A 句，full 段前 16 小节用 B 句、后 8 小节回 A 句
    if (section === 'melody' && bar % 8 === 0) playMelody(bar, 'A');
    if (section === 'full' && bar % 8 === 0) playMelody(bar, bar < 56 ? 'B' : 'A');
    if (section === 'break' && bar % 8 === 0) playMelody(bar, 'A', 0.34);
}

/* ── 写 WAV（44.1k / 16bit / 立体声） ───────────────────────────────── */
let peak = 1e-9;
for (let i = 0; i < TOTAL; i++) { const a = Math.abs(L[i]), b = Math.abs(R[i]); if (a > peak) peak = a; if (b > peak) peak = b; }
const norm = 0.89 / peak;                                            // 留 1dB 余量给后面的 aecho/loudnorm
const bytes = 44 + TOTAL * 4;
const buf = Buffer.alloc(bytes);
buf.write('RIFF', 0); buf.writeUInt32LE(bytes - 8, 4); buf.write('WAVE', 8);
buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(TOTAL * 4, 40);
for (let i = 0; i < TOTAL; i++) {
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(L[i] * norm * 32767))), 44 + i * 4);
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(R[i] * norm * 32767))), 46 + i * 4);
}
const out = process.argv[2] || 'scratch/out/africa_bgm.wav';
fs.mkdirSync(out.replace(/[\\/][^\\/]+$/, ''), { recursive: true });
fs.writeFileSync(out, buf);
console.log(`✅ 已生成 ${out}：${(TOTAL / SR).toFixed(1)} 秒 · ${BARS} 小节 · ${BPM} BPM · 峰值归一 ${(20 * Math.log10(0.89)).toFixed(1)} dBFS`);
