#!/usr/bin/env node
/** 🔴 防「整档覆盖 / 截断大文件」闸门（Claude Code PreToolUse hook）。
 *  Write 落盘前比对新旧行数：大文件被砍掉一半以上直接 exit 2 拦在写入之前。
 *  起因：另一个 AI 两次把 src/legion-editor/main.ts（5667 行）截断成只剩数组。
 *  兄弟闸门 hook_legion_guard.mjs 是 PostToolUse（写坏了才报），这个在落盘前拦。
 *  放行：先建 .claude/.allow-shrink 令牌，一次性，用掉即删。
 *  验收：node tools/hook_truncate_guard.test.mjs */
import { existsSync, readFileSync, rmSync } from 'node:fs';

const MIN_LINES = 300;      // 小文件不管，够小重写一遍不算事故
const SHRINK_RATIO = 0.5;   // 新内容不足原来一半 → 拦
const SKIP = ['node_modules/', '.git/', 'dist/', 'scratch/'];
// ⚠️ 下面这条是我自己定的，不是主人的指示，可随时让我删掉：
// portrait_adjust.ts 有「只增不删」铁律，任何缩水都拦，不等砍到一半。
const APPEND_ONLY = ['src/data/portrait_adjust.ts'];

// 与 wc -l 对齐：尾换行不额外算一行，空文件算 0 行
const countLines = (s) => {
    if (s === '') return 0;
    const t = s.endsWith('\n') ? s.slice(0, -1) : s;
    return t.split('\n').length;
};
const hit = (p, list) => list.some((s) => p === s || p.startsWith(s) || p.includes('/' + s));

let raw = '';
process.stdin.setEncoding('utf8');
for await (const c of process.stdin) raw += c;

let j = {};
try { j = JSON.parse(raw) ?? {}; } catch { process.exit(0); }
if (j.tool_name !== 'Write') process.exit(0);   // 只管整档覆盖，Edit 不在射程

const p = String(j.tool_input?.file_path ?? '').replaceAll(String.fromCharCode(92), '/');
if (!p || hit(p, SKIP)) process.exit(0);
if (!existsSync(p)) process.exit(0);            // 新建文件，随便写

let before;
try { before = countLines(readFileSync(p, 'utf8')); } catch { process.exit(0); }
const after = countLines(String(j.tool_input?.content ?? ''));

const appendOnly = APPEND_ONLY.some((s) => p === s || p.endsWith('/' + s));
if (!appendOnly && before < MIN_LINES) process.exit(0);

const limit = appendOnly ? before : Math.floor(before * SHRINK_RATIO);
if (after >= limit) process.exit(0);

const token = '.claude/.allow-shrink';
if (existsSync(token)) { try { rmSync(token); } catch { } process.exit(0); }

const pct = ((1 - after / before) * 100).toFixed(1);
console.error(
    `🔴 整档覆盖闸门拦截 —— ${p}\n` +
    `　　原 ${before} 行 → 新 ${after} 行，砍掉 ${pct}%。` +
    (appendOnly
        ? '该文件有「只增不删」铁律，任何缩水都拦。\n'
        : `阈值：不得低于 ${limit} 行。\n`) +
    '起因：另一个 AI 曾两次把 5667 行的 legion-editor/main.ts 截断成只剩数组。\n' +
    '处理：① 误操作 —— 别重写整个文件，改用 Edit 只动要动的那几行。\n' +
    '　　　② 确实要大幅删减 —— 建 .claude/.allow-shrink 令牌后重试一次，用掉即失效。\n' +
    '　　　③ 拿不准先问主人，不许自作主张。');
process.exit(2);
