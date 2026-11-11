/**
 * 经典战播报导入的共用件：读表、切屏、审稿、写生成文件。
 * 被 import.mts（第一场的播报）与 import-extra.mts（补选的后几场）共用。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import type { ClassicBattleBriefing } from '../../src/data/ClassicBattleBriefings.generated';

/**
 * 🔴 [2026-11-11 主人定「别搞得这么极端」] 一屏字幕最多 160 字（宽屏字幕条 18px 双行，1920 宽约 82 字/行，
 *    160 字两行放得下）。150 多字的段落照样一屏，不切开。
 */
export const SCREEN_MAX = 160;
/**
 * 🔴 [2026-11-11 主人令「以前战略播报：每段 89～144 字。以前战术播报：每段 89～144 字。所有，全部按这个模式执行，
 *    可以根据内容略多点字，但是不能多太多」「别搞得这么极端」] —— 取代同日「战略 150~600 / 战术 100~400」。
 *   · 89~144 是给写稿方的**目标**，不卡死：≤160 照收不提醒（一屏放得下）；
 *   · 161~200 照收但提醒（会切成两屏）；>200 才算还是老长稿，整行打回；<70 提醒。
 */
export const STRATEGIC_RANGE = [89, 144] as const;
export const TACTICAL_RANGE = [89, 144] as const;
/** 照收不提醒的上限（一屏放得下） */
export const QUIET_MAX = SCREEN_MAX;
/** 超过即打回（还是上一轮那种两三百字的长稿） */
export const REJECT_MAX = 200;
/** 低于即提醒（太短） */
export const SHORT_WARN = 70;

/** 读 CSV / TSV（看表头那一行有没有制表符来认分隔符），支持引号包住的格子 */
export function parseTable(text: string): string[][] {
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

/** 读表 → 表头 + 取格子的函数；缺列直接退出 */
export function readSheet(path: string, need: string[]): { rows: string[][]; get: (r: string[], name: string) => string } {
    const table = parseTable(readFileSync(path, 'utf8'));
    const header = table.shift()?.map((h) => h.trim()) ?? [];
    const col = (name: string) => header.findIndex((h) => h === name || h.startsWith(name));
    const idx = Object.fromEntries(need.map((n) => [n, col(n)])) as Record<string, number>;
    const missing = need.filter((n) => idx[n] < 0);
    if (missing.length) { console.error(`表缺列：${missing.join('、')}（表头要用制表符或逗号分隔）`); process.exit(1); }
    return { rows: table, get: (r, n) => (r[idx[n]] ?? '').trim() };
}

export const len = (s: string) => Array.from(s).length;

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

/** 审一段播报：错误＝整行打回；提醒＝照写、仅供抽查 */
export function auditText(p: string, label: string, range: readonly [number, number], errors: string[], warns: string[]): void {
    const n = len(p);
    if (n > REJECT_MAX) errors.push(`${label} 共 ${n} 字，太长（目标 ${range[0]}~${range[1]} 字，超过 ${REJECT_MAX} 打回）`);
    else if (n > QUIET_MAX) warns.push(`${label} 共 ${n} 字（目标 ${range[0]}~${range[1]}，超过 ${QUIET_MAX} 会切成两屏）`);
    else if (n < SHORT_WARN) warns.push(`${label} 共 ${n} 字，偏短（目标 ${range[0]}~${range[1]}）`);
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

/** 审一场的两段播报＋资料；合格返回要写入的条目，不合格返回 null（错误已记进 errors） */
export function auditBriefingRow(
    get: (n: string) => string, errors: string[], warns: string[],
): ClassicBattleBriefing | null {
    const strategicText = get('战略播报');
    const tacticalText = get('战术播报');
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
    if (errors.length) return null;
    return {
        strategic: splitScreens(strategicText),
        tactical: splitScreens(tacticalText),
        history: get('历史资料'),
        sources: get('史料出处'),
    };
}

const BRIEFINGS_FILE = 'src/data/ClassicBattleBriefings.generated.ts';

/** 把播报整份写回生成文件（保留文件头注释） */
export function writeBriefings(all: Record<string, ClassicBattleBriefing>): void {
    const ids = Object.keys(all).sort();
    const body = ids.map((id) => `    ${JSON.stringify(id)}: ${JSON.stringify(all[id])},`).join('\n');
    const src = readFileSync(BRIEFINGS_FILE, 'utf8');
    const head = src.slice(0, src.indexOf('export const CLASSIC_BATTLE_BRIEFINGS'));
    writeFileSync(BRIEFINGS_FILE,
        `${head}export const CLASSIC_BATTLE_BRIEFINGS: Readonly<Record<string, ClassicBattleBriefing>> = {\n${body}${body ? '\n' : ''}};\n`, 'utf8');
    console.log(`已写入 ${BRIEFINGS_FILE}（共 ${ids.length} 场）`);
}

/** 一行审稿结果的报告格式 */
export function reportLine(name: string, errors: string[], warns: string[]): string | null {
    if (errors.length) return `✗ ${name}\n    ${errors.join('\n    ')}${warns.length ? `\n    （提醒）${warns.join('；')}` : ''}`;
    if (warns.length) return `△ ${name}\n    （提醒）${warns.join('；')}`;
    return null;
}
