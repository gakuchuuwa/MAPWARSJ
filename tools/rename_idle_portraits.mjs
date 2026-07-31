/**
 * 自动把「闲置立绘」统一重命名为  __闲置__{文化区}_{编号}.png
 * ------------------------------------------------------------------
 * 闲置 = 该 png 没有被任何代码引用（不是任何武将的专图、不是硬编码兜底、
 *        也没有存过位置调校记录）。这类图只被「随机池」按文化区随机抽用。
 *
 * 用法：
 *   npm run portrait:idle-rename              # 执行重命名 + 重建 canonical 映射
 *   npm run portrait:idle-rename -- --dry-run # 只预览，不改盘
 *
 * 安全保证：
 *   · 只动「未被任何 .ts/.tsx/vite.config.ts 引用」的 png
 *     （专图路径、硬编码、portrait_adjust.ts 里的调校 key 都算引用 → 一律保留不动）
 *   · 跳过：已是 __闲置__ 的、_prev_ 备份、avg/bgm_backup/inbox 夹
 *   · 只「重命名」，绝不删除/覆盖内容；文件仍留在原文化区夹 → 继续在随机池被抽用
 *   · 每次执行写还原日志 claudedocs/idle-rename-log-{时间}.json（新名→旧名，可一键还原）
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { migratePortraitAdjustKeys } from './lib/portrait_adjust_migrate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = path.join(ROOT, 'public/assets');
const DRY = process.argv.includes('--dry-run');

// 顶层非立绘夹 / 暂存夹，不参与
const SKIP_TOP = new Set(['avg', 'bgm_backup', 'inbox']);
// 扫描引用时要跳过的文件（这些只是"指向立绘的派生/调校表"，不代表某武将在用它，不算引用）：
//   · portrait_canonical.ts —— 内容去重表，键就是闲置副本
//   · portrait_adjust.ts    —— 位置/缩放调校表；有调校记录 ≠ 被武将使用（旧图变孤儿后仍留着记录）
const REF_SCAN_SKIP = new Set(['portrait_canonical.ts', 'portrait_adjust.ts']);

// ── 1) 收集全项目代码里出现过的 png 引用 ──
// 2026-07-31 修：原来只取 basename，跨夹同名文件会被误判为"被引用"而逃过分类
//   （代码里只有 /assets/BASHU/shu_liubei.png，/assets/LINGNAN/shu_liubei.png 也跟着免疫）。
//   现在带目录的按完整路径比对，裸文件名才退回按名保护。
const referencedPaths = new Set();
const referencedNames = new Set();
function addRefsFromText(txt) {
    const re = /['"`]([^'"`\n]*?\.png)['"`]/gi;
    let m;
    while ((m = re.exec(txt)) !== null) {
        const raw = m[1];
        if (raw.includes('${')) continue;              // 动态拼接，判不了
        const norm = raw.replace(/\\/g, '/').toLowerCase();
        if (norm.includes('/')) {
            const i = norm.indexOf('/assets/');
            referencedPaths.add(i >= 0 ? norm.slice(i) : norm);
        } else {
            referencedNames.add(norm);
        }
    }
}
/** 该文件是否被代码硬引用（铁律：被引用的一律不改名） */
function isReferenced(folder, file) {
    return referencedPaths.has(`/assets/${folder}/${file}`.toLowerCase())
        || referencedNames.has(file.toLowerCase());
}
function walkCode(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) {
            if (ent.name === 'node_modules' || ent.name === '.git') continue;
            walkCode(p);
        } else if (/\.(ts|tsx|js|mjs|cjs)$/i.test(ent.name) && !REF_SCAN_SKIP.has(ent.name)) {
            addRefsFromText(fs.readFileSync(p, 'utf-8'));
        }
    }
}
walkCode(path.join(ROOT, 'src'));
addRefsFromText(fs.readFileSync(path.join(ROOT, 'vite.config.ts'), 'utf-8'));

// ── 2) 遍历各文化区/政权夹，分类 ──
const IDLE_RE = /^__闲置__(.+)_(\d+)\.png$/i; // group1=区名token, group2=编号

const plan = [];            // { folder, from, to }
let keptUsed = 0, skippedPrev = 0, alreadyIdle = 0;

for (const ent of fs.readdirSync(ASSETS, { withFileTypes: true })) {
    if (!ent.isDirectory() || SKIP_TOP.has(ent.name)) continue;
    const folder = ent.name;
    const dir = path.join(ASSETS, folder);
    const files = fs.readdirSync(dir).filter((f) => /\.png$/i.test(f));

    // 找出本夹已有的 __闲置__ 编号上限 & 沿用的区名 token（保持夹内一致）
    let maxNum = 0;
    let token = folder;
    let tokenFromMax = null;
    for (const f of files) {
        const mm = f.match(IDLE_RE);
        if (mm) {
            alreadyIdle++;
            const n = parseInt(mm[2], 10);
            if (n > maxNum) { maxNum = n; tokenFromMax = mm[1]; }
        }
    }
    if (tokenFromMax) token = tokenFromMax;

    // 收集待改名
    const existingNames = new Set(files.map((f) => f.toLowerCase()));
    for (const f of files) {
        if (/_prev_/i.test(f)) { skippedPrev++; continue; }
        if (IDLE_RE.test(f)) continue;                       // 已是闲置命名
        if (isReferenced(folder, f)) { keptUsed++; continue; } // 被引用→保留
        // 分配下一个不冲突的编号
        let dest;
        do {
            maxNum++;
            dest = `__闲置__${token}_${String(maxNum).padStart(2, '0')}.png`;
        } while (existingNames.has(dest.toLowerCase()));
        existingNames.add(dest.toLowerCase());
        plan.push({ folder, from: f, to: dest });
    }
}

// ── 3) 报告 ──
console.log(`[闲置立绘重命名] 扫描完成`);
console.log(`  代码引用的立绘(去重): ${referenced.size}`);
console.log(`  被引用→保留不动: ${keptUsed}`);
console.log(`  已是 __闲置__: ${alreadyIdle}`);
console.log(`  _prev_ 备份跳过: ${skippedPrev}`);
console.log(`  待重命名: ${plan.length}\n`);

if (plan.length === 0) {
    console.log('✅ 没有需要重命名的闲置图，全部已统一。');
    process.exit(0);
}

const byFolder = {};
for (const p of plan) (byFolder[p.folder] ??= []).push(p);
for (const [folder, arr] of Object.entries(byFolder).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  [${folder}] ${arr.length} 张`);
    for (const p of arr) console.log(`      ${p.from}  →  ${p.to}`);
}

if (DRY) {
    console.log('\n(--dry-run 预览，未改动任何文件)');
    process.exit(0);
}

// ── 4) 执行重命名（renameSync，不删不覆盖内容）──
const log = [];
for (const p of plan) {
    const fromAbs = path.join(ASSETS, p.folder, p.from);
    const toAbs = path.join(ASSETS, p.folder, p.to);
    if (fs.existsSync(toAbs)) {
        console.error(`⚠ 目标已存在，跳过：${p.to}`);
        continue;
    }
    fs.renameSync(fromAbs, toAbs);
    log.push({ folder: p.folder, from: p.from, to: p.to });
}

// ── 5) 写还原日志 ──
const ts = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
const logDir = path.join(ROOT, 'claudedocs');
fs.mkdirSync(logDir, { recursive: true });
const logPath = path.join(logDir, `idle-rename-log-${ts}.json`);
fs.writeFileSync(logPath, JSON.stringify(log, null, 2), 'utf-8');
console.log(`\n✅ 已重命名 ${log.length} 张，还原日志: ${path.relative(ROOT, logPath)}`);

// ── 5.5) 调校键跟着改名走（主人 2026-07-31 定）──
// 不迁移则调校失联（回落文件夹默认值），且序号名被后来的图复用时会继承上一任的调校。
try {
    const mig = migratePortraitAdjustKeys(ROOT, log);
    if (mig.migrated > 0) {
        console.log(
            `🎯 调校键迁移 ${mig.migrated} 条` +
            (mig.overwritten > 0 ? `（顶掉 ${mig.overwritten} 条同名遗留值）` : '') +
            (mig.backupFile ? ` | 备份 ${path.relative(ROOT, mig.backupFile)}` : ''),
        );
    }
} catch (e) {
    console.error('⚠ 调校键迁移失败:', e?.message ?? e);
}

// ── 6) 重建内容去重映射（新名并入，内容相同者继续共享调校）──
try {
    execSync('node scratch/build_portrait_canonical.mjs', { cwd: ROOT, stdio: 'inherit' });
} catch (e) {
    console.error('⚠ canonical 重建失败，请手动跑 npm run portrait:build-canonical');
}
