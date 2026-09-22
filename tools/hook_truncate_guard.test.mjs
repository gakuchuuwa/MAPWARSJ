#!/usr/bin/env node
/** 整档覆盖闸门验收脚本。对应 tools/hook_truncate_guard.mjs。
 *  跑法：node tools/hook_truncate_guard.test.mjs  （退出码 0 = 全绿） */
import { execFileSync } from 'node:child_process';
import { writeFileSync, existsSync, readFileSync } from 'node:fs';

const MAIN = 'src/legion-editor/main.ts';
const ADJ = 'src/data/portrait_adjust.ts';
const SMALL = 'src/data/FactionGeneralPools.ts';
const wc = (f) => readFileSync(f, 'utf8').replace(/\n$/, '').split('\n').length;

const body = (n) => (n <= 0 ? '' : 'x\n'.repeat(n - 1) + 'x');
const run = (tool, file, n) => {
  const input = JSON.stringify({ tool_name: tool, tool_input: { file_path: file, content: body(n) } });
  try { execFileSync('node', ['tools/hook_truncate_guard.mjs'], { input, encoding: 'utf8', stdio: 'pipe' }); return { code: 0, err: '' }; }
  catch (e) { return { code: e.status, err: `${e.stderr ?? ''}`.trim() }; }
};

const mainN = wc(MAIN), adjN = wc(ADJ), half = Math.floor(mainN * 0.5);
const cases = [
  [`①截断事故复现 ${mainN}→10`,            'Write', MAIN,  10,        2],
  [`②正常小改 ${mainN}→${mainN - 67}`,      'Write', MAIN,  mainN - 67, 0],
  [`③刚好卡在阈值上 →${half}`,              'Write', MAIN,  half,      0],
  [`④阈值下一行 →${half - 1}`,              'Write', MAIN,  half - 1,  2],
  [`⑤只增不删档少 8 行 ${adjN}→${adjN - 8}`, 'Write', ADJ,   adjN - 8,  2],
  [`⑥只增不删档增长 →${adjN + 12}`,          'Write', ADJ,   adjN + 12, 0],
  [`⑦小文件不管 (${SMALL} ${wc(SMALL)}行)`,  'Write', SMALL, 1,         0],
  ['⑧新建文件随便写',                          'Write', 'src/__nope__.ts', 1, 0],
  ['⑨Edit 不在射程',                           'Edit',  MAIN,  1,         0],
  ['⑩scratch 豁免(相对路径)',                  'Write', 'scratch/portrait_adjust_0819.ts', 1, 0],
  ['⑪scratch 豁免(绝对路径)',                  'Write', 'C:/MAPWARSJ/scratch/portrait_adjust_0819.ts', 1, 0],
  ['⑫清空文件也要拦',                          'Write', MAIN,  0,         2],
];
let bad = 0;
for (const [name, tool, file, n, want] of cases) {
  const { code } = run(tool, file, n);
  const ok = code === want;
  if (!ok) bad++;
  console.log(`${ok ? '✅' : '❌'} ${name}  期望 ${want} 实得 ${code}`);
}

console.log('\n--- 令牌放行(一次性) ---');
const TOKEN = '.claude/.allow-shrink';
writeFileSync(TOKEN, '');
const a = run('Write', MAIN, 10);
const consumed = !existsSync(TOKEN);
const b = run('Write', MAIN, 10);
for (const [ok, msg] of [[a.code === 0, '有令牌时放行'], [consumed, '令牌用掉即删'], [b.code === 2, '令牌失效后重新拦截']]) {
  console.log(`${ok ? '✅' : '❌'} ${msg}`);
  if (!ok) bad++;
}

console.log(`\n${bad === 0 ? '🟢 全部通过' : `🔴 ${bad} 条未通过`}`);
if (bad === 0) console.log('\n--- 拦截报文样例 ---\n' + run('Write', MAIN, 10).err);
process.exit(bad === 0 ? 0 : 1);
