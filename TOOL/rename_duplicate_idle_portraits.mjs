/**
 * 启动期「重复闲置立绘」自动改名  __闲置__{文化区}_{编号}.png
 * ------------------------------------------------------------------
 * 目标（主人 2026-07-18 定）：每次 npm run dev 启动时自动执行——
 *   凡是「内容与库内其他图重复（跨夹全库 SHA-256 比对）」且「没有被任何代码引用」
 *   的 png，就地改成 __闲置__ 命名。重复组即使全员未引用也全部改（不留原名）。
 *
 * 与 TOOL/rename_idle_portraits.mjs 的区别：
 *   那个改所有未引用图（手动跑）；本脚本只改「重复 + 未引用」——
 *   独一无二的图即使闲置也保留原名（原名可能带武将信息，画了还没接线）。
 *
 * 铁律（AGENTS.md 立绘保护条款，绝对红线）：
 *   · 只 renameSync 同夹改名——没有任何删除/覆盖代码路径
 *   · 目标名已存在 → 跳过该张，绝不覆盖
 *   · 被引用的图（无论是否重复）一律不动
 *   · 绝不跨夹移动；chongfu/（已归置重复图）与 avg/（剧情图）只读不改
 *   · 每次改名写还原日志 claudedocs/idle-dup-rename-log-{时间}.json
 *   · 任何异常一律吞掉 exit 0，绝不阻塞 dev 启动
 *
 * 性能：SHA-256 结果按 (size, mtimeMs) 缓存于 scratch/portrait_hash_cache.json，
 *   首跑全量哈希（1.4GB 约数秒），之后只 stat 比对，秒级完成。
 *
 * 用法：
 *   node TOOL/rename_duplicate_idle_portraits.mjs            # 执行（dev 启动自动跑的就是这个）
 *   node TOOL/rename_duplicate_idle_portraits.mjs --dry-run  # 只预览
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = path.join(ROOT, 'public/assets');
const CACHE_PATH = path.join(ROOT, 'scratch/portrait_hash_cache.json');
const DRY = process.argv.includes('--dry-run');

// 完全排除（不扫描不比对）：avg=剧情图，与武将立绘无关
const EXCLUDE_TOP = new Set(['avg', 'bgm_backup', 'inbox']);
// 只读对照（参与内容比对，但夹内文件绝不改名）：chongfu=主人手动归置的重复图
const READONLY_TOP = new Set(['chongfu']);
// 引用扫描跳过（派生/调校表，不算"被套用"）——与 rename_idle_portraits.mjs 口径一致
const REF_SCAN_SKIP = new Set(['portrait_canonical.ts', 'portrait_adjust.ts']);

const IDLE_RE = /^__闲置__(.+)_(\d+)\.png$/i;

try {
    main();
} catch (e) {
    console.error('[重复闲置改名] 异常（不阻塞启动）:', e?.message ?? e);
}
process.exit(0);

function main() {
    const t0 = Date.now();

    // ── 1) 代码引用集合（basename 小写）──
    const referenced = new Set();
    const addRefs = (txt) => {
        const re = /['"`]([^'"`\n]*?\.png)['"`]/gi;
        let m;
        while ((m = re.exec(txt)) !== null) {
            const base = m[1].split(/[\\/]/).pop();
            if (base) referenced.add(base.toLowerCase());
        }
    };
    const walkCode = (dir) => {
        for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
            const p = path.join(dir, ent.name);
            if (ent.isDirectory()) {
                if (ent.name === 'node_modules' || ent.name === '.git') continue;
                walkCode(p);
            } else if (/\.(ts|tsx|js|mjs|cjs)$/i.test(ent.name) && !REF_SCAN_SKIP.has(ent.name)) {
                addRefs(fs.readFileSync(p, 'utf-8'));
            }
        }
    };
    walkCode(path.join(ROOT, 'src'));
    addRefs(fs.readFileSync(path.join(ROOT, 'vite.config.ts'), 'utf-8'));

    // ── 2) 全库哈希（带缓存）──
    let cache = {};
    try {
        cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
    } catch { /* 首跑或缓存损坏，全量重算 */ }
    const nextCache = {};
    let hashed = 0;

    /** @type {Map<string, {folder:string, file:string, readonly:boolean}[]>} sha256 → 成员 */
    const byHash = new Map();

    for (const ent of fs.readdirSync(ASSETS, { withFileTypes: true })) {
        if (!ent.isDirectory() || EXCLUDE_TOP.has(ent.name)) continue;
        const folder = ent.name;
        const dir = path.join(ASSETS, folder);
        const readonly = READONLY_TOP.has(folder);
        for (const f of fs.readdirSync(dir)) {
            if (!/\.png$/i.test(f)) continue;
            const abs = path.join(dir, f);
            const rel = `${folder}/${f}`;
            const st = fs.statSync(abs);
            const c = cache[rel];
            let sha;
            if (c && c.size === st.size && c.mtimeMs === st.mtimeMs) {
                sha = c.sha256;
            } else {
                sha = crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
                hashed++;
            }
            nextCache[rel] = { size: st.size, mtimeMs: st.mtimeMs, sha256: sha };
            if (!byHash.has(sha)) byHash.set(sha, []);
            byHash.get(sha).push({ folder, file: f, readonly });
        }
    }
    fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
    fs.writeFileSync(CACHE_PATH, JSON.stringify(nextCache), 'utf-8');

    // ── 3) 挑改名候选：重复组内「未引用 + 非只读夹 + 非闲置名 + 非 _prev_」全改 ──
    /** @type {Map<string, string[]>} folder → 待改文件名 */
    const planByFolder = new Map();
    let dupGroups = 0;
    for (const members of byHash.values()) {
        if (members.length < 2) continue;
        dupGroups++;
        for (const m of members) {
            if (m.readonly) continue;
            if (IDLE_RE.test(m.file)) continue;
            if (/_prev_/i.test(m.file)) continue;
            if (referenced.has(m.file.toLowerCase())) continue;
            if (!planByFolder.has(m.folder)) planByFolder.set(m.folder, []);
            planByFolder.get(m.folder).push(m.file);
        }
    }

    // ── 4) 按夹分配闲置编号并执行 ──
    const log = [];
    let planned = 0;
    for (const [folder, files] of planByFolder) {
        const dir = path.join(ASSETS, folder);
        const all = fs.readdirSync(dir).filter((f) => /\.png$/i.test(f));
        let maxNum = 0;
        let token = folder;
        let tokenFromMax = null;
        for (const f of all) {
            const mm = f.match(IDLE_RE);
            if (mm) {
                const n = parseInt(mm[2], 10);
                if (n > maxNum) { maxNum = n; tokenFromMax = mm[1]; }
            }
        }
        if (tokenFromMax) token = tokenFromMax;
        const existing = new Set(all.map((f) => f.toLowerCase()));

        for (const from of files.sort()) {
            let dest;
            do {
                maxNum++;
                dest = `__闲置__${token}_${String(maxNum).padStart(2, '0')}.png`;
            } while (existing.has(dest.toLowerCase()));
            existing.add(dest.toLowerCase());
            planned++;
            console.log(`  [${folder}] ${from}  →  ${dest}`);
            if (DRY) continue;
            const toAbs = path.join(dir, dest);
            if (fs.existsSync(toAbs)) {
                console.error(`  ⚠ 目标已存在，跳过：${folder}/${dest}`);
                continue;
            }
            fs.renameSync(path.join(dir, from), toAbs);
            // 改名后同步哈希缓存键，避免下次启动重算
            const relOld = `${folder}/${from}`;
            if (nextCache[relOld]) {
                nextCache[`${folder}/${dest}`] = nextCache[relOld];
                delete nextCache[relOld];
            }
            log.push({ folder, from, to: dest });
        }
    }

    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(
        `[重复闲置改名] 重复组 ${dupGroups} | 待改 ${planned} | 实改 ${log.length}` +
        ` | 重新哈希 ${hashed} 张 | 耗时 ${secs}s${DRY ? '（--dry-run 未改盘）' : ''}`,
    );
    if (DRY || log.length === 0) return;

    fs.writeFileSync(CACHE_PATH, JSON.stringify(nextCache), 'utf-8');

    // ── 5) 还原日志 ──
    const ts = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
    const logDir = path.join(ROOT, 'claudedocs');
    fs.mkdirSync(logDir, { recursive: true });
    const logPath = path.join(logDir, `idle-dup-rename-log-${ts}.json`);
    fs.writeFileSync(logPath, JSON.stringify(log, null, 2), 'utf-8');
    console.log(`  还原日志: ${path.relative(ROOT, logPath)}`);

    // ── 6) 重建内容去重映射：改名后的副本经 canonical 继续共享调校 ──
    try {
        execSync('node scratch/build_portrait_canonical.mjs', { cwd: ROOT, stdio: 'inherit' });
    } catch {
        console.error('  ⚠ canonical 重建失败，请手动跑 npm run portrait:build-canonical');
    }
}
