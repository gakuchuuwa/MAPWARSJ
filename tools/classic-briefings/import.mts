/**
 * 导入「经典战播报·回填表」→ 生成 src/data/ClassicBattleBriefings.generated.ts，并逐条审稿。
 *
 * 用法：npx tsx --import ./tools/sim-preload.mjs tools/classic-briefings/import.mts <回填表.csv|.tsv> [--dry]
 *   · 回填表表头须含：generalId、历史资料、史料出处、战略播报、战术播报（顺序不限，多余的列不管）。
 *   · 🔴 [2026-11-11 主人定「大概字数就好，让 GG 根据内容来写」] 两段播报各是**一整段文字**，
 *     写稿方不用分段；这里按句号切成一屏一屏（每屏不超过 SCREEN_MAX 字），游戏一屏念一次。
 *   · 增量导入：表里没有的场次保留上次导入的结果；表里有的整行覆盖。
 *   · 有「错误」的行不写入（报出来让写稿的 AI 重写）；「提醒」照写，仅供人工抽查。
 *   · --dry：只审稿不写文件。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { GENERAL_FIRST_BATTLES } from '../../src/data/GeneralFirstBattles';
import { CLASSIC_BATTLE_BRIEFINGS, type ClassicBattleBriefing } from '../../src/data/ClassicBattleBriefings.generated';

const input = process.argv[2];
const dry = process.argv.includes('--dry');
if (!input) { console.error('缺回填表路径'); process.exit(1); }

/** 一屏字幕最多几个字（字幕条一屏放得下） */
const SCREEN_MAX = 130;
/** 大概字数（只提醒、不打回）：内容多少由写稿方按史料定 */
const STRATEGIC_RANGE = [150, 600] as const;
const TACTICAL_RANGE = [100, 400] as const;

function parseTable(text: string): string[][] {
    text = text.replace(/^﻿/, '');
    const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
    const delim = firstLine.includes('\t') ? '\t' : ',';
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (quoted) {
            if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
            else if (c === '"') quoted = false;
            else cell += c;
            continue;
        }
        if (c === '"' && cell === '') { quoted = true; continue; }
        if (c === delim) { row.push(cell); cell = ''; continue; }
        if (c === '\n' || c === '\r') {
            if (c === '\r' && text[i + 1] === '\n') i++;
            row.push(cell); cell = '';
            if (row.some((x) => x.trim())) rows.push(row);
            row = [];
            continue;
        }
        cell += c;
    }
    row.push(cell);
    if (row.some((x) => x.trim())) rows.push(row);
    return rows;
}

const len = (s: string) => Array.from(s).length;

/** 按逗号把超长单句切开（每片不超过 max） */
function splitLong(sentence: string, max: number): string[] {
    const parts = sentence.match(/[^，、：]+[，、：]?/g) ?? [sentence];
    const out: string[] = [];
    let cur = '';
    for (const p of parts) {
        if (cur && len(cur) + len(p) > max) { out.push(cur); cur = p; } else cur += p;
    }
    if (cur) out.push(cur);
    return out;
}

/** 一整段播报 → 一屏一屏：按句末标点断句，相邻句子能并进一屏就并 */
export function splitScreens(text: string, max = SCREEN_MAX): string[] {
    const flat = text.replace(/\s+/g, '');
    const sentences = flat.match(/[^。！？；]+[。！？；]+[”’」』]?|[^。！？；]+$/g) ?? [flat];
    const out: string[] = [];
    let cur = '';
    for (const raw of sentences) {
        const pieces = len(raw) > max ? splitLong(raw, max) : [raw];
        for (const s of pieces) {
            if (cur && len(cur) + len(s) > max) { out.push(cur); cur = s; } else cur += s;
        }
    }
    if (cur) out.push(cur);
    return out.filter(Boolean);
}

const TROOP_COUNT = /[0-9一二三四五六七八九十百千万两数]+[万千百]?余?(人|众|兵|骑|卒|军|大军|甲士|之众|乘)/;
const OUTCOME_WORDS = /(大败|大破|溃败|溃散|败亡|阵亡|战死|取胜|获胜|大捷|攻克|城破|陷落|自刎|被俘|投降|全军覆没)/;

function auditText(p: string, label: string, range: readonly [number, number], errors: string[], warns: string[]): void {
    const n = len(p);
    if (n < range[0] || n > range[1]) warns.push(`${label} 共 ${n} 字（大概 ${range[0]}~${range[1]}）`);
    if (/[()（）【】\[\]]/.test(p)) errors.push(`${label} 有括号`);
    if (/[0-9]/.test(p)) errors.push(`${label} 有阿拉伯数字（年份要写成「公元前二六〇年」）`);
    if (/[你您]|玩家|观众|壮士/.test(p)) errors.push(`${label} 对观众/玩家说话（只许用史书旁白口吻）`);
    if (/["“”'‘’「」『』]/.test(p)) warns.push(`${label} 有引号（念出来没问题，但请确认是原话）`);
    const troop = p.match(TROOP_COUNT);
    if (troop && /[0-9一二三四五六七八九十百千万两]/.test(troop[0]) && /[万千百]/.test(troop[0])) errors.push(`${label} 写了兵力数「${troop[0]}」`);
    else {
        const wan = p.match(/[一二三四五六七八九十两数]+[十百千]?万/);   // 「四十万」「数十万」之类：不管后面跟什么都算兵力数
        if (wan) errors.push(`${label} 写了数量「${wan[0]}」（兵力不写确数）`);
    }
}

const table = parseTable(readFileSync(input, 'utf8'));
const header = table.shift()?.map((h) => h.trim()) ?? [];
const col = (name: string) => header.findIndex((h) => h === name || h.startsWith(name));
const need = ['generalId', '历史资料', '史料出处', '战略播报', '战术播报'];
const idx = Object.fromEntries(need.map((n) => [n, col(n)])) as Record<string, number>;
const missing = need.filter((n) => idx[n] < 0);
if (missing.length) { console.error(`回填表缺列：${missing.join('、')}（表头要用制表符或逗号分隔）`); process.exit(1); }

const merged: Record<string, ClassicBattleBriefing> = { ...CLASSIC_BATTLE_BRIEFINGS };
let ok = 0;
let bad = 0;
let skipped = 0;
const report: string[] = [];
for (const r of table) {
    const get = (n: string) => (r[idx[n]] ?? '').trim();
    const id = get('generalId');
    if (!id || id === 'generalId') { skipped++; continue; }   // 空行，或逐批粘贴时重复的表头
    const errors: string[] = [];
    const warns: string[] = [];
    const fb = GENERAL_FIRST_BATTLES[id];
    if (!fb) errors.push('generalId 不在经典战表里');
    const strategicText = get('战略播报');
    const tacticalText = get('战术播报');
    if (!strategicText && !tacticalText) { skipped++; continue; }   // 这一行还没写
    if (!strategicText) errors.push('没有战略播报');
    if (!tacticalText) errors.push('没有战术播报');
    if (!get('历史资料')) errors.push('没有历史资料');
    if (!get('史料出处')) warns.push('没写史料出处');
    if (strategicText) {
        auditText(strategicText, '战略播报', STRATEGIC_RANGE, errors, warns);
        const w = strategicText.match(OUTCOME_WORDS);
        if (w) warns.push(`战略播报含「${w[0]}」——确认说的是前情，不是本战结果`);
    }
    if (tacticalText) auditText(tacticalText, '战术播报', TACTICAL_RANGE, errors, warns);
    const name = fb ? `${fb.battleName}·${id}` : id;
    if (errors.length) {
        bad++;
        report.push(`✗ ${name}\n    ${errors.join('\n    ')}${warns.length ? `\n    （提醒）${warns.join('；')}` : ''}`);
        continue;
    }
    if (warns.length) report.push(`△ ${name}\n    （提醒）${warns.join('；')}`);
    merged[id] = {
        strategic: splitScreens(strategicText),
        tactical: splitScreens(tacticalText),
        history: get('历史资料'),
        sources: get('史料出处'),
    };
    ok++;
}

const total = Object.keys(GENERAL_FIRST_BATTLES).length;
const covered = Object.keys(merged).filter((id) => GENERAL_FIRST_BATTLES[id]).length;
console.log(report.join('\n'));
console.log(`\n本次：合格 ${ok} 行、有错 ${bad} 行（未写入）、空行跳过 ${skipped} 行；累计已收录 ${covered} / ${total} 场${dry ? '（--dry 未写文件）' : ''}`);

if (!dry) {
    const ids = Object.keys(merged).filter((id) => GENERAL_FIRST_BATTLES[id]).sort();
    const body = ids.map((id) => `    ${JSON.stringify(id)}: ${JSON.stringify(merged[id])},`).join('\n');
    const src = readFileSync('src/data/ClassicBattleBriefings.generated.ts', 'utf8');
    const head = src.slice(0, src.indexOf('export const CLASSIC_BATTLE_BRIEFINGS'));
    writeFileSync('src/data/ClassicBattleBriefings.generated.ts',
        `${head}export const CLASSIC_BATTLE_BRIEFINGS: Readonly<Record<string, ClassicBattleBriefing>> = {\n${body}${body ? '\n' : ''}};\n`, 'utf8');
    console.log('已写入 src/data/ClassicBattleBriefings.generated.ts');
}
if (bad) process.exitCode = 2;
