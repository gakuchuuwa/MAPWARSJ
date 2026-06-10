/**
 * 旗号汉字黑白审计（AGENTS.md §10.2.1）
 * 运行: npm run flag-text:check
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// 动态 import TS 模块
const { HISTORICAL_FACTION_COLORS, FLAG_TEXT_LUM_THRESHOLD, FLAG_TEXT_WHITE_STYLE_FACTIONS, FLAG_TEXT_BLACK_STYLE_FACTIONS } =
    await import('../src/data/HistoricalFactionColors.ts');
const { SANDBOX_DISPLAY_NAMES } = await import('../src/data/SandboxDisplayNames.ts');

function lumFromHex(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return 0.299 * r + 0.587 * g + 0.114 * b;
}

function resolveTextStyle(factionId, hex) {
    if (FLAG_TEXT_BLACK_STYLE_FACTIONS.has(factionId)) {
        return { style: '黑字', reason: '史料强制黑字（汉赤旗黑字）' };
    }
    if (FLAG_TEXT_WHITE_STYLE_FACTIONS.has(factionId)) {
        return { style: '白字', reason: '史料强制白字（岳黑旗白字）' };
    }
    const lum = lumFromHex(hex);
    if (lum < FLAG_TEXT_LUM_THRESHOLD) {
        return { style: '白字', reason: `深旗 lum=${lum.toFixed(1)} < ${FLAG_TEXT_LUM_THRESHOLD}` };
    }
    return { style: '黑字', reason: `浅旗 lum=${lum.toFixed(1)} ≥ ${FLAG_TEXT_LUM_THRESHOLD}` };
}

const threshold = FLAG_TEXT_LUM_THRESHOLD;
const rows = [];
const borderline = [];

for (const [id, hex] of Object.entries(HISTORICAL_FACTION_COLORS)) {
    const lum = lumFromHex(hex);
    const { style, reason } = resolveTextStyle(id, hex);
    const flag = SANDBOX_DISPLAY_NAMES[id] ?? id;
    rows.push({ id, flag, hex, lum: +lum.toFixed(1), textStyle: style, reason });
    if (Math.abs(lum - threshold) <= 8) {
        borderline.push({ id, flag, lum: +lum.toFixed(1), textStyle: style });
    }
}

rows.sort((a, b) => a.lum - b.lum);

const whiteCount = rows.filter((r) => r.textStyle === '白字').length;
const blackCount = rows.filter((r) => r.textStyle === '黑字').length;

const report = {
    updated: new Date().toISOString().slice(0, 10),
    threshold,
    rule: `lum < ${threshold} → 白字黑边；lum ≥ ${threshold} → 黑字白边`,
    fixedColorFactions: rows.length,
    whiteText: whiteCount,
    blackText: blackCount,
    borderlineWithin8: borderline,
    all: rows,
};

const outPath = path.join(root, 'scratch/flag_text_luminance_report.json');
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

console.log(`=== flag-text:check ===`);
console.log(`阈值 FLAG_TEXT_LUM_THRESHOLD = ${threshold}`);
console.log(`固定色势力 ${rows.length}：白字 ${whiteCount} | 黑字 ${blackCount}`);
if (borderline.length) {
    console.log(`\n--- 临界区（距 ${threshold} ≤ 8，改色时留意）---`);
    for (const b of borderline) {
        console.log(`  ${b.flag} (${b.id}) lum=${b.lum} → ${b.textStyle}`);
    }
}
console.log(`\n深旗（白字）:`);
for (const r of rows.filter((x) => x.textStyle === '白字')) {
    console.log(`  ${r.flag.padEnd(4)} ${r.id.padEnd(14)} ${r.hex}  lum=${String(r.lum).padStart(6)}`);
}
console.log(`\n浅旗（黑字）:`);
for (const r of rows.filter((x) => x.textStyle === '黑字')) {
    console.log(`  ${r.flag.padEnd(4)} ${r.id.padEnd(14)} ${r.hex}  lum=${String(r.lum).padStart(6)}`);
}
console.log(`\nWrote ${outPath}`);
