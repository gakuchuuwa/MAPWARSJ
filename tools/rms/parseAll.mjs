/**
 * 验收：把本机 DE 的全部 .rms 脚本过一遍解析器，统计成功数、失败原因、缺的环境符号。
 * 用法：node tools/rms/parseAll.mjs [种子数，默认 3]
 */
import fs from 'node:fs';
import { DE_RMS_DIR, loadScript } from './rmsParse.mjs';

const seeds = Number(process.argv[2] ?? 3);
const files = fs.readdirSync(DE_RMS_DIR).filter((f) => /\.rms$/i.test(f));
let ok = 0;
const fails = new Map();
const unknownIf = new Map();
let totalCmds = 0;
for (const f of files) {
    let good = true;
    for (let s = 1; s <= seeds; s++) {
        try {
            const { sections, pre } = loadScript(f, { seed: s });
            for (const [k, n] of pre.unknownIf) unknownIf.set(k, (unknownIf.get(k) ?? 0) + n);
            totalCmds += Object.values(sections).reduce((a, b) => a + b.length, 0);
        } catch (e) {
            good = false;
            const key = String(e.message).replace(/\d+/g, 'N').slice(0, 80);
            if (!fails.has(key)) fails.set(key, []);
            fails.get(key).push(f);
            break;
        }
    }
    if (good) ok++;
}
console.log(`脚本 ${files.length} 个；解析通过 ${ok}；失败 ${files.length - ok}；指令总数(每脚本×种子) ${totalCmds}`);
for (const [k, v] of fails) console.log(`✗ ${k}  ×${v.length}  例：${v.slice(0, 3).join(', ')}`);
console.log('最常查到但从未定义的 if 符号（多为引擎注入的开关/选项）：');
console.log([...unknownIf.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([k, n]) => `${k}:${n}`).join('  '));
