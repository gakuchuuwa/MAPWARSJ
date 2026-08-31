/**
 * 「多余图」删前自查（主人 2026-08-04 定）
 * ------------------------------------------------------------------
 * 回答一个问题：现在把所有 __多余__ 的图一次性删光，会不会有图被删绝版？
 *
 * 判据：每张 __多余__ 都必须在【同文件夹】存在一份非 __多余__ 的同 SHA-256 副本兜底。
 *       全都有 → 放心删；有一张没有 → 那张是库里最后一份，删了心血白费。
 *
 * 本脚本【只读】：不改名、不删除、不写任何文件。
 *
 * 用法：
 *   npm run portrait:surplus-audit
 *   node tools/audit_surplus_deletable.mjs
 *
 * 出现「删了会绝版」时的处理：先跑 npm run portrait:dup-rename
 * （分类脚本会按实际情况改成 __暂留__ 或 __闲置__），再回来复查。
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = path.join(ROOT, 'public/assets');
// 与 rename_duplicate_idle_portraits.mjs 同口径
const EXCLUDE_TOP = new Set(['avg', 'bgm_backup', 'inbox']);
const SURPLUS_RE = /^__多余__/i;

const files = [];
for (const ent of fs.readdirSync(ASSETS, { withFileTypes: true })) {
    if (!ent.isDirectory() || EXCLUDE_TOP.has(ent.name)) continue;
    for (const f of fs.readdirSync(path.join(ASSETS, ent.name))) {
        if (!/\.png$/i.test(f)) continue;
        if (/_prev_/i.test(f)) continue;   // 备份不参与（备份≠副本）
        files.push({ folder: ent.name, file: f, abs: path.join(ASSETS, ent.name, f) });
    }
}

// 先按体积分组，只对同体积的算哈希（1200+ 张全量哈希没必要）
const bySize = new Map();
for (const f of files) {
    f.size = fs.statSync(f.abs).size;
    if (!bySize.has(f.size)) bySize.set(f.size, []);
    bySize.get(f.size).push(f);
}
const sha = (f) => (f.sha ??= crypto.createHash('sha256').update(fs.readFileSync(f.abs)).digest('hex'));

const surplus = files.filter((f) => SURPLUS_RE.test(f.file));
const orphans = [];
for (const s of surplus) {
    const peers = bySize.get(s.size).filter((o) => o.abs !== s.abs);
    const safeTwin = peers.some((o) =>
        o.folder === s.folder && !SURPLUS_RE.test(o.file) && sha(o) === sha(s));
    if (!safeTwin) orphans.push(s);
}

console.log(`[多余图删前自查] 全库 ${files.length} 张 | __多余__ ${surplus.length} 张`);
if (orphans.length === 0) {
    console.log(`✅ 全部 ${surplus.length} 张多余图在同文件夹都有安全副本兜底 —— 可以放心全部删除，不会丢图`);
} else {
    console.log(`❌ 有 ${orphans.length} 张在同文件夹没有安全副本（名字上的「多余」标签已过期）：`);
    for (const o of orphans) console.log(`   ${o.folder}/${o.file}`);
    console.log('\n   先跑 npm run portrait:dup-rename 让它们自动改为 __暂留__ 或 __闲置__，再回来复查。');
}
process.exit(0);
