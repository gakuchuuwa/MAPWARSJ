/**
 * 一批干完：把云盘导出的四张表丢进 `tools/classic-briefings/inbox/`，跑这一条命令即可。
 *
 * 用法：npx tsx tools/classic-briefings/run-batch.mts [--dry]
 *
 * 按表头自动认出是哪一张，按依赖顺序跑：
 *   ① 新增势力表   → ② 史实定稿表 → ③ 播报回填表 → ④ 补选回填表
 *   （顺序不能换：②里的敌方国号可能要用①新加的势力，④的敌将也可能落在①的势力里）
 * 全部合格后再重新导出「任务表」「名将名单」到 `tools/classic-briefings/out/`，
 * 这两份就是下一批要传回云盘的。
 *
 * --dry：只审稿，不写任何游戏数据，也不动 inbox 里的文件。
 * 有错就停在这一步，后面的不再跑（后面的依赖前面的结果），报错原文照抄转给写稿的 AI。
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve('.');
const DIR = 'tools/classic-briefings';
const INBOX = join(DIR, 'inbox');
const OUT = join(DIR, 'out');
const dry = process.argv.includes('--dry');

type Kind = 'factions' | 'facts' | 'briefings' | 'extras';

/** 按表头认表 */
function classify(header: string): Kind | null {
    if (header.includes('势力编号')) return 'factions';
    if (header.includes('项目') && header.includes('定值')) return 'facts';
    if (header.includes('会面台词')) return 'extras';
    if (header.includes('战略播报')) return 'briefings';
    return null;
}

if (!existsSync(INBOX)) mkdirSync(INBOX, { recursive: true });
const files = readdirSync(INBOX)
    .filter((f) => /\.(csv|tsv)$/i.test(f) && !f.startsWith('_'))
    .map((f) => join(INBOX, f))
    .filter((p) => statSync(p).isFile());
if (!files.length) {
    console.log(`inbox 里没有表：把云盘导出的 CSV 放进 ${INBOX}`);
    process.exit(1);
}

const found = new Map<Kind, string[]>();
const unknown: string[] = [];
for (const f of files) {
    const firstLine = readFileSync(f, 'utf8').replace(/^\ufeff/, '').split(/\r?\n/, 1)[0] ?? '';
    const kind = classify(firstLine);
    if (!kind) { unknown.push(f); continue; }
    found.set(kind, [...(found.get(kind) ?? []), f]);
}
if (unknown.length) console.log(`认不出是哪张表（表头不对，先跳过）：\n  ${unknown.join('\n  ')}`);

const TSX_CLI = resolve('node_modules/tsx/dist/cli.mjs');
const run = (script: string, args: string[]): number => {
    console.log(`\n═══ ${script} ${args.join(' ')} ═══`);
    const r = spawnSync(process.execPath,
        [TSX_CLI, '--import', './tools/sim-preload.mjs', join(DIR, script), ...args],
        { cwd: ROOT, stdio: 'inherit' });
    return r.status ?? 1;
};

const steps: { kind: Kind; script: string; make: (files: string[]) => string[][] }[] = [
    { kind: 'factions', script: 'import-sync.mts', make: (fs) => fs.map((f) => ['--factions', f]) },
    { kind: 'facts', script: 'import-sync.mts', make: (fs) => fs.map((f) => ['--facts', f]) },
    { kind: 'briefings', script: 'import.mts', make: (fs) => fs.map((f) => [f]) },
    { kind: 'extras', script: 'import-extra.mts', make: (fs) => fs.map((f) => [f]) },
];

const okFiles: string[] = [];
let failed = false;
for (const step of steps) {
    const list = found.get(step.kind);
    if (!list?.length) continue;
    for (const args of step.make(list)) {
        const code = run(step.script, dry ? [...args, '--dry'] : args);
        if (code !== 0) {
            console.log(`\n✗ 这一步有错（退出码 ${code}）：${args.join(' ')}`);
            console.log('  后面的步骤没跑（它们要用这一步的结果）。把上面的报错原文转给写稿方改，改完再跑一次。');
            failed = true;
            break;
        }
        okFiles.push(args[args.length - 1]);
    }
    if (failed) break;
}

if (failed) process.exit(2);

if (!dry) {
    // 全部合格的这批表收进 done/，免得下次重复导入
    const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const doneDir = join(INBOX, 'done', stamp);
    mkdirSync(doneDir, { recursive: true });
    for (const f of okFiles) renameSync(f, join(doneDir, f.split(/[\\/]/).pop()!));
    if (okFiles.length) console.log(`\n这批表已收进 ${doneDir}`);
}

console.log('\n═══ 重新导出交给云盘的两份表 ═══');
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
const taskCsv = join(OUT, '经典战播报·任务表.csv');
const listCsv = join(OUT, '经典战补选·名将名单.csv');
let code = run('export.mts', [taskCsv]);
if (code === 0) code = run('export-extra.mts', [listCsv]);
console.log(code === 0
    ? `\n全部完成${dry ? '（--dry：只审稿，没写游戏数据、没动 inbox）' : ''}`
    : '\n数据已导入，但导出失败，看上面的报错');
if (code !== 0) process.exit(2);
