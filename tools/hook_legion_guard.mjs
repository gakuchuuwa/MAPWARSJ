#!/usr/bin/env node
/** 🔴 防「擅自修改别人的劳动成果」闸门（Claude Code PostToolUse hook）。
 *  只要 AI 动了 CultureFormations.ts / FactionCompositions.ts，就自动跑
 *  npm run legion:no-unjustified-edits：凡是改动前并不红的军团被改，
 *  立刻以 exit 2 把结果甩回 AI 面前，逼它还原或去问主人。
 *  不依赖 AI 记性，AI 关不掉也绕不过。 */
import { execFileSync } from 'node:child_process';

let raw = '';
process.stdin.setEncoding('utf8');
for await (const c of process.stdin) raw += c;

let p = '';
try { p = JSON.parse(raw)?.tool_input?.file_path ?? ''; } catch { }
p = String(p).replace(/\\/g, '/');
if (!/(CultureFormations|FactionCompositions)\.ts$/.test(p)) process.exit(0);

try {
    execFileSync('npm', ['run', '--silent', 'legion:no-unjustified-edits'],
        { encoding: 'utf8', stdio: 'pipe', shell: process.platform === 'win32' });
    process.exit(0);
} catch (e) {
    const out = `${e.stdout ?? ''}${e.stderr ?? ''}`.split('\n')
        .filter((l) => !l.startsWith('[Portrait]')).join('\n');
    console.error(
        '🔴 军团改动闸门拦截 —— 你改了改动前并不红的军团，这是擅自修改别人的劳动成果。\n' +
        '规则：客观缺陷（格位不符阵型/违规/战力离群）可以直接修；\n' +
        '　　　其余一律先问主人，不许自作主张，不许「顺手优化」。\n' +
        '处理：把下列军团改回 HEAD 原样，或先拿到主人明确同意。\n\n' + out);
    process.exit(2);
}
