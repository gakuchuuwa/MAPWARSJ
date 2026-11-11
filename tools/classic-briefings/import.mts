/**
 * 导入「经典战播报·回填表」→ 生成 src/data/ClassicBattleBriefings.generated.ts，并逐条审稿。
 *
 * 用法：npx tsx --import ./tools/sim-preload.mjs tools/classic-briefings/import.mts <回填表.csv|.tsv> [--dry]
 *   · 回填表表头须含：generalId、历史资料、史料出处、战略播报、战术播报（顺序不限，多余的列不管）。
 *     generalId 一格填这一场的编号：第一场＝名将 generalId；补选的后几场＝`<generalId>@<年份>`。
 *   · 🔴 [2026-11-11 主人定「大概字数就好，让 GG 根据内容来写」] 两段播报各是**一整段文字**，
 *     写稿方不用分段；这里按句号切成一屏一屏（每屏不超过 SCREEN_MAX 字），游戏一屏念一次。
 *   · 增量导入：表里没有的场次保留上次导入的结果；表里有的整行覆盖。
 *   · 有「错误」的行不写入（报出来让写稿的 AI 重写）；「提醒」照写，仅供人工抽查。
 *   · --dry：只审稿不写文件。
 */
import { GENERAL_FIRST_BATTLES, getClassicBattleById } from '../../src/data/GeneralFirstBattles';
import { CLASSIC_BATTLE_BRIEFINGS, type ClassicBattleBriefing } from '../../src/data/ClassicBattleBriefings.generated';
import { readSheet, auditBriefingRow, writeBriefings, reportLine } from './briefingLib.mts';

const input = process.argv[2];
const dry = process.argv.includes('--dry');
if (!input) { console.error('缺回填表路径'); process.exit(1); }

const { rows, get } = readSheet(input, ['generalId', '历史资料', '史料出处', '战略播报', '战术播报']);
const merged: Record<string, ClassicBattleBriefing> = { ...CLASSIC_BATTLE_BRIEFINGS };
let ok = 0;
let bad = 0;
let skipped = 0;
const report: string[] = [];
for (const r of rows) {
    const g = (n: string) => get(r, n);
    const id = g('generalId');
    if (!id || id === 'generalId') { skipped++; continue; }   // 空行，或逐批粘贴时重复的表头
    if (!g('战略播报') && !g('战术播报')) { skipped++; continue; }   // 这一行还没写
    const errors: string[] = [];
    const warns: string[] = [];
    const fb = getClassicBattleById(id);
    if (!fb) errors.push('编号不在经典战表里（补选的场次要先用 import-extra.mts 导入）');
    const entry = auditBriefingRow(g, errors, warns);
    const line = reportLine(fb ? `${fb.battleName}·${id}` : id, errors, warns);
    if (line) report.push(line);
    if (!entry || errors.length) { bad++; continue; }
    merged[id] = entry;
    ok++;
}

const total = Object.keys(GENERAL_FIRST_BATTLES).length;
const covered = Object.keys(merged).filter((id) => GENERAL_FIRST_BATTLES[id]).length;
console.log(report.join('\n'));
console.log(`\n本次：合格 ${ok} 行、有错 ${bad} 行（未写入）、空行跳过 ${skipped} 行；第一场累计已收录 ${covered} / ${total} 场${dry ? '（--dry 未写文件）' : ''}`);
if (!dry) writeBriefings(Object.fromEntries(Object.entries(merged).filter(([id]) => getClassicBattleById(id))));
if (bad) process.exitCode = 2;
