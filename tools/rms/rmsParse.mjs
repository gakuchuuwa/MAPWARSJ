/**
 * RMS（AoE2 DE 随机地图脚本）解析器 —— 验证性程序（2026-10-09 主人令「先做一个程序，做出来看看，再说套不套用」）。
 *
 * 只做「脚本语言」这一层：预处理（#const / #define / #include_drs / if-elseif-else-endif /
 * start_random-percent_chance-end_random / 算术与 rnd()）→ 展平成「段 → 指令（含块）」的 AST。
 * 不含任何游戏引擎语义（陆地怎么长、地块怎么成团……见 rmsEngine.mjs）。
 *
 * 数据来源：本机 DE 安装目录下的脚本，不拷贝进仓库。
 */
import fs from 'node:fs';
import path from 'node:path';

export const DE_RMS_DIR = 'C:/Program Files (x86)/Steam/steamapps/common/AoE2DE/resources/_common/drs/gamedata_x2';

/** 种子随机数（mulberry32），所有随机选择都走它，保证同一种子同一结果 */
export function makeRng(seed) {
    let a = seed >>> 0;
    const next = () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    next.int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
    return next;
}

const fileCache = new Map();
/**
 * rel 先在官方 RMS 目录里找；找不到时若给了 extraDir（loadScript 的 env.rmsDir），再到那里找。
 * 用途：把官方脚本**复制到项目内**改一处（例如锁死季节分支）后做「同口径对比」，**不碰 DE 安装目录**。
 */
function tokenizeFile(rel, extraDir = null) {
    if (fileCache.has(rel)) return fileCache.get(rel);
    let p = path.join(DE_RMS_DIR, rel);
    if (!fs.existsSync(p) && extraDir) p = path.join(extraDir, rel);
    if (!fs.existsSync(p)) throw new Error(`找不到脚本文件：${rel}`);
    let text = fs.readFileSync(p, 'utf8');
    text = text.replace(/\/\*[\s\S]*?\*\//g, ' ');
    // 「#define NAME (说明文字)」：define 只吃一个名字，行尾说明文字丢掉（Highland.rms 的写法）
    text = text.replace(/(#define[ \t]+\S+)[ \t]+[^\r\n]*/g, '$1');
    const toks = text.match(/[{}(),]|[^\s{}(),]+/g) ?? [];
    fileCache.set(rel, toks);
    return toks;
}

/** 控制类关键字：不是指令 */
const CONTROL = new Set(['if', 'elseif', 'else', 'endif', 'start_random', 'percent_chance', 'end_random']);

export class Preprocessor {
    /**
     * @param {object} env  { defines:string[], consts:Record<string,number>, seed:number }
     */
    constructor(env = {}) {
        this.defs = new Set(env.defines ?? []);
        /** 强制主题时要挡掉的 #define（见 loadScript 的 env.theme） */
        this.blockDefines = env.blockDefines ?? null;
        this.consts = new Map(Object.entries(env.consts ?? {}));
        this.rng = makeRng(env.seed ?? 1);
        /** 官方 RMS 目录里找不到时的回退目录（项目内改过的脚本用；见 loadScript 的 env.rmsDir） */
        this.extraDir = env.rmsDir ?? null;
        /** if 里查过、但从未定义过的符号（多半是引擎注入的开关）→ 便于发现缺的环境量 */
        this.unknownIf = new Map();
        this.out = [];
        this.includeDepth = 0;
    }

    has(name) { return this.defs.has(name) || this.consts.has(name); }

    /** 算术表达式求值：+ - * / % 括号、rnd(a,b)、常量名、数字 */
    evalExpr(toks) {
        let i = 0;
        const peek = () => toks[i];
        const take = () => toks[i++];
        const self = this;
        function primary() {
            const t = take();
            if (t === undefined) throw new Error('表达式不完整');
            if (t === '(') { const v = sum(); if (take() !== ')') throw new Error('缺 )'); return v; }
            if (t === '-') return -primary();
            if (t === '+') return primary();
            if (t === 'rnd') {
                if (take() !== '(') throw new Error('rnd 缺 (');
                const a = sum(); if (take() !== ',') throw new Error('rnd 缺 ,');
                const b = sum(); if (take() !== ')') throw new Error('rnd 缺 )');
                return self.rng.int(Math.ceil(Math.min(a, b)), Math.floor(Math.max(a, b)));
            }
            const n = Number(t);
            if (!Number.isNaN(n)) return n;
            if (self.consts.has(t)) return self.consts.get(t);
            throw new Error(`未定义常量：${t}`);
        }
        function term() {
            let v = primary();
            while (peek() === '*' || peek() === '/' || peek() === '%') {
                const op = take(); const r = primary();
                v = op === '*' ? v * r : op === '/' ? v / r : v % r;
            }
            return v;
        }
        function sum() {
            let v = term();
            while (peek() === '+' || peek() === '-') {
                const op = take(); const r = term();
                v = op === '+' ? v + r : v - r;
            }
            return v;
        }
        const v = sum();
        return v;
    }

    /** 读一个值：( … ) 或 rnd( … ) 或单个记号；返回 [数值或字符串, 下一个下标] */
    readValue(toks, i) {
        const t = toks[i];
        if (t === '(' || t === 'rnd') {
            let j = i + (t === 'rnd' ? 1 : 0), depth = 0;
            do { if (toks[j] === '(') depth++; else if (toks[j] === ')') depth--; j++; } while (depth > 0 && j < toks.length);
            return [this.evalExpr(toks.slice(i, j)), j];
        }
        // 表达式里的运算符被分成独立记号时（如 A * B 未加括号）不支持，RMS 也要求加括号
        if (this.consts.has(t)) return [this.consts.get(t), i + 1];
        const n = Number(t);
        return [Number.isNaN(n) ? t : n, i + 1];
    }

    /** 找与 toks[i]（'if'）配对的各分支位置：返回 [{kind, start}, …, endifIndex] */
    findIfBranches(toks, i) {
        const branches = [{ kind: 'if', cond: toks[i + 1], start: i + 2 }];
        let depth = 0;
        for (let j = i + 2; j < toks.length; j++) {
            const t = toks[j];
            if (t === 'if') depth++;
            else if (t === 'endif') { if (depth === 0) return { branches, end: j }; depth--; }
            else if (depth === 0 && t === 'elseif') branches.push({ kind: 'elseif', cond: toks[j + 1], start: j + 2, hdr: j });
            else if (depth === 0 && t === 'else') branches.push({ kind: 'else', cond: null, start: j + 1, hdr: j });
        }
        this.missingEndif = (this.missingEndif ?? 0) + 1;
        return { branches, end: toks.length };
    }

    run(toks, start = 0, end = toks.length) {
        let i = start;
        while (i < end) {
            const t = toks[i];
            if (t === '#const') {
                const name = toks[i + 1];
                const [v, j] = this.readValue(toks, i + 2);
                if (typeof v === 'number') this.consts.set(name, v);
                else this.consts.set(name, v); // 字符串常量（极少见）
                i = j; continue;
            }
            // 【第 46 轮】`blockDefines`：强制主题时，把「其余主题的 #define」挡掉（见 loadScript 的 env.theme）。
            if (t === '#define') { if (!this.blockDefines?.has(toks[i + 1])) this.defs.add(toks[i + 1]); i += 2; continue; }
            if (t === '#undefine') { this.defs.delete(toks[i + 1]); this.consts.delete(toks[i + 1]); i += 2; continue; }
            if (t === '#include_drs' || t === '#include') {
                const rel = toks[i + 1];
                if (this.includeDepth > 40) throw new Error('include 嵌套过深');
                this.includeDepth++;
                // 本机缺少的 include（如 defend_wonder.inc，属游戏模式专属）：记录后跳过，不中断解析
                let sub = null;
                try { sub = tokenizeFile(rel, this.extraDir); } catch { (this.missingIncludes ??= new Set()).add(rel); }
                if (sub) this.run(sub);
                this.includeDepth--;
                i += 2; continue;
            }
            if (t === 'if') {
                const { branches, end: endIf } = this.findIfBranches(toks, i);
                let chosen = -1;
                for (let b = 0; b < branches.length; b++) {
                    const br = branches[b];
                    if (br.kind === 'else') { chosen = b; break; }
                    if (!this.has(br.cond)) {
                        this.unknownIf.set(br.cond, (this.unknownIf.get(br.cond) ?? 0) + 1);
                    }
                    if (this.has(br.cond)) { chosen = b; break; }
                }
                if (chosen >= 0) {
                    const from = branches[chosen].start;
                    const to = chosen + 1 < branches.length ? branches[chosen + 1].hdr : endIf;
                    this.run(toks, from, to);
                }
                i = endIf + 1; continue;
            }
            if (t === 'start_random') {
                // 找到配对的 end_random，并按顶层 percent_chance 切分
                const branches = [];
                let depth = 0, j = i + 1, cur = null;
                for (; j < end; j++) {
                    const x = toks[j];
                    if (x === 'start_random') depth++;
                    else if (x === 'end_random') { if (depth === 0) break; depth--; }
                    else if (depth === 0 && x === 'percent_chance') {
                        const [pv, nj] = this.readValue(toks, j + 1);
                        cur = { pct: Number(pv), from: nj, to: null };
                        branches.push(cur);
                        j = nj - 1;
                        continue;
                    }
                }
                if (j >= end) throw new Error('start_random 缺 end_random');
                for (let b = 0; b < branches.length; b++) {
                    branches[b].to = b + 1 < branches.length ? branches[b + 1].hdrIndex ?? null : j;
                }
                // percent_chance 头的位置：重新扫一遍记下，便于确定上一分支的结束
                const heads = [];
                depth = 0;
                for (let k = i + 1; k < j; k++) {
                    const x = toks[k];
                    if (x === 'start_random') depth++;
                    else if (x === 'end_random') depth--;
                    else if (depth === 0 && x === 'percent_chance') heads.push(k);
                }
                for (let b = 0; b < branches.length; b++) branches[b].to = b + 1 < heads.length ? heads[b + 1] : j;
                const total = branches.reduce((s, b) => s + (b.pct || 0), 0);
                if (total > 0) {
                    let r = this.rng() * Math.max(100, total), acc = 0;
                    for (const b of branches) {
                        acc += b.pct || 0;
                        if (r < acc) { this.run(toks, b.from, b.to); break; }
                    }
                }
                i = j + 1; continue;
            }
            // 普通记号：原样输出；括号表达式 / rnd(…) 求值后输出数字；已知常量替换成数值
            if (t === '(' || t === 'rnd') {
                const [v, j] = this.readValue(toks, i);
                this.out.push(typeof v === 'number' ? v : String(v));
                i = j; continue;
            }
            if (this.consts.has(t)) { this.out.push(this.consts.get(t)); i++; continue; }
            const n = Number(t);
            this.out.push(Number.isNaN(n) ? t : n);
            i++;
        }
    }
}

/** 全部脚本里「出现在行首的指令名」：用来在展平的记号流里切分指令 */
export function collectCommandNames() {
    const names = new Set();
    for (const f of fs.readdirSync(DE_RMS_DIR)) {
        if (!/\.(rms|inc)$/i.test(f)) continue;
        collectFrom(path.join(DE_RMS_DIR, f), names);
    }
    const inc = path.join(DE_RMS_DIR, 'includes');
    for (const f of fs.readdirSync(inc)) if (/\.inc$/i.test(f)) collectFrom(path.join(inc, f), names);
    for (const c of CONTROL) names.delete(c);
    return names;
}
function collectFrom(file, names) {
    let t = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ');
    for (const line of t.split(/\r?\n/)) {
        const s = line.trim();
        if (!s || s.startsWith('#') || s.startsWith('<') || s.startsWith('{') || s.startsWith('}')) continue;
        const m = s.match(/^[a-z_][a-z0-9_]*/);
        if (m) names.add(m[0]);
    }
}

/** 展平记号流 → 段 → 指令（含 { } 块） */
export function buildAst(tokens, commandNames) {
    const sections = {};
    let cur = null;
    let i = 0;
    function parseBlock() {
        const cmds = [];
        while (i < tokens.length) {
            const t = tokens[i];
            if (t === '}') { i++; return cmds; }
            if (typeof t === 'string' && t.startsWith('<') && t.endsWith('>')) return cmds;
            // 一条 create_* 可以吃多个块（如 Loch Ness.rms）：后来的块并入，不覆盖
            if (t === '{') { i++; const blk = parseBlock(); if (cmds.length) { const last = cmds[cmds.length - 1]; last.block = (last.block ?? []).concat(blk); } continue; }
            if (typeof t === 'string' && commandNames.has(t)) {
                const cmd = { cmd: t, args: [] };
                i++;
                while (i < tokens.length) {
                    const a = tokens[i];
                    if (a === '{' || a === '}') break;
                    if (typeof a === 'string' && (commandNames.has(a) || (a.startsWith('<') && a.endsWith('>')))) break;
                    cmd.args.push(a); i++;
                }
                cmds.push(cmd);
                continue;
            }
            // 非指令孤儿记号（多为引擎常量写在行首等），挂到上一条指令上
            if (cmds.length) cmds[cmds.length - 1].args.push(t);
            i++;
        }
        return cmds;
    }
    while (i < tokens.length) {
        const t = tokens[i];
        if (typeof t === 'string' && t.startsWith('<') && t.endsWith('>')) {
            cur = t.slice(1, -1); i++;
            sections[cur] = (sections[cur] ?? []).concat(parseBlock());
            continue;
        }
        // 段标记之前的零散指令（如 Arabia 头部）归入 PRE
        if (!sections.PRE) sections.PRE = [];
        sections.PRE.push(...parseBlock());
    }
    return sections;
}

/** 一次性：脚本文件 → { sections, pre } */
export function loadScript(file, env = {}) {
    // 尺寸档旗标：按 scaling.inc 的 MAPSIDE_* 反查（120=TINY / 144=SMALL / 168=MEDIUM …）。
    // ⚠️ 界面档位 ↔ 格数的真实对应待 DE 导出实测（见 docs/02-design/RMS引擎语义-给CC.md §1）。
    const SIZE_FLAG = { 80: 'MINI', 120: 'TINY', 144: 'SMALL', 168: 'MEDIUM', 200: 'NORMAL', 220: 'LARGE', 240: 'HUGE', 252: 'GIANT' };
    const flag = SIZE_FLAG[env.size ?? 144] ?? 'SMALL';
    const side = env.size ?? 144;
    const defaultEnv = {
        defines: [`MAPSIZE_${flag}`, `${flag}_MAP`, '2_PLAYER_GAME', 'PH_EXTENDEDSEASONS', 'PLAYER1_TEAM0', 'PLAYER2_TEAM0', ...(env.defines ?? [])],
        // 引擎对不存在的玩家席位也认 PLAYERn_ALLY_COUNT：默认 0（脚本里有 #const 会覆盖）
        // ── `includes/scaling.inc` 那一族常量（CC 第 46 轮：作为引擎默认常量提供，值照 scaling.inc 原定义）──
        //   起因：`real_world_manchuria.rms` **没有 include `scaling.inc`**，于是用到 `MAPSCALE_AREA` 时解析直接失败
        //   （该常量全库用了 **155 处**，如 `Arabia.rms:924 number_of_tiles (… * MAPSCALE_AREA)`）。
        //   定义逐字照抄 scaling.inc：
        //     :1-15  MAPSIDE_MINI 80 … MAPSIDE_LUDICROUS 480（含 MAPSIDE_BASE 100）
        //     :49    MAPSCALE_SIDE = MAPSIZE_SIDE / MAPSIDE_BASE
        //     :53    MAPSIZE_AREA  = MAPSIZE_SIDE * MAPSIZE_SIDE
        //     :54    MAPSCALE_AREA = MAPSIZE_AREA / 10000
        //   `MAPSIZE_SIDE` 早先已同样提供（= 边长）。**脚本自己 include 了 scaling.inc 时，`#const` 会覆盖成同值**，
        //   所以这一组默认值不会改变任何原本能跑的脚本（这一点用全量 180 指纹逐位验证）。
        consts: {
            PLAYER1_ALLY_COUNT: 0, PLAYER2_ALLY_COUNT: 0, PLAYER3_ALLY_COUNT: 0, PLAYER4_ALLY_COUNT: 0,
            PLAYER5_ALLY_COUNT: 0, PLAYER6_ALLY_COUNT: 0, PLAYER7_ALLY_COUNT: 0, PLAYER8_ALLY_COUNT: 0,
            ADDITIONAL_VILLAGERS: 0,
            MAPSIDE_MINI: 80, MAPSIDE_BASE: 100, MAPSIDE_TINY: 120, MAPSIDE_SMALL: 144, MAPSIDE_MEDIUM: 168,
            MAPSIDE_NORMAL: 200, MAPSIDE_LARGE: 220, MAPSIDE_HUGE: 240, MAPSIDE_GIANT: 252, MAPSIDE_MASSIVE: 276,
            MAPSIDE_ENORMOUS: 300, MAPSIDE_COLOSSAL: 320, MAPSIDE_INCREDIBLE: 360, MAPSIDE_MONSTREOUS: 400,
            MAPSIDE_LUDICROUS: 480,
            MAPSIZE_SIDE: side,
            MAPSCALE_SIDE: side / 100,
            MAPSIZE_AREA: side * side,
            MAPSCALE_AREA: (side * side) / 10000,
            ...(env.consts ?? {}),
        },
        seed: env.seed ?? 1,
    };
    const pre = new Preprocessor({ ...defaultEnv, rmsDir: env.rmsDir ?? null });
    // 【第 46 轮 · CC 第一步第 6 条】**强制指定主题**：`env.theme = 'PALAEARCTIC_MIDDLE_EAST_DESERT'`
    //   做法：① 把该主题 `#define` 注入；② 把脚本里**其余主题**的 `#define` 挡掉。
    //   依据：主题在各脚本里是用 `elseif <主题>` **互斥链**消费的（例 `Arabia.rms:553` / `themes.inc:1789`），
    //   所以只要保证"只有被强制的那一个成立"，链上就只会走它 —— 不依赖链的顺序。
    //   主题名集合是照 DE 的命名法扫出来的（AFROTROPICAL/NEOTROPICAL/NEARCTIC/INDOMALAYAN/PALAEARCTIC/AUSTRALASIAN）
    if (env.theme) {
        const src = fs.readFileSync(path.join(env.rmsDir ?? DE_RMS_DIR, file), 'utf8');
        const all = new Set((src.match(/\b(?:AFROTROPICAL|NEOTROPICAL|NEARCTIC|INDOMALAYAN|PALAEARCTIC|AUSTRALASIAN)_[A-Z0-9_]+\b/g) ?? []));
        const block = new Set([...all].filter((x) => x !== env.theme));
        pre.blockDefines = block;
        pre.defs.add(env.theme);
    }
    // 引擎隐式载入的常量定义
    pre.run(tokenizeFile('random_map.def'));
    pre.out.length = 0;
    pre.run(tokenizeFile(file, env.rmsDir ?? null));
    const names = collectCommandNames();
    const sections = buildAst(pre.out, names);
    return { sections, pre };
}
