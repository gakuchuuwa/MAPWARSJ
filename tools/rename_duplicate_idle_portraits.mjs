/**
 * 启动期立绘自动分类改名（主人 2026-07-19 定稿）
 * ------------------------------------------------------------------
 * 每次 npm run dev 启动时执行，除「被代码引用」的图外全部规范命名：
 *
 *   被引用                     → 原名不动（铁律）
 *   未引用 + 内容重复（跨夹全库）→ __多余__{token}_{NN}.png   ← 主人审阅后手动删除的暂存标签
 *   未引用 + 独一无二           → __闲置__{token}_{NN}.png   ← 库存资源，随机池继续抽用
 *
 * 每次启动自动重归类（含存量迁移）：
 *   · __闲置__ 名但内容重复 → 改 __多余__（如另一份后来入库）
 *   · __多余__ 名但已无重复 → 改回 __闲置__（如主人删掉了另一份副本）
 *
 * 铁律（AGENTS.md 立绘保护条款，绝对红线）：
 *   · 只 renameSync 同夹改名——没有任何删除/覆盖代码路径
 *   · 目标名已存在 → 跳过该张，绝不覆盖
 *   · 被引用的图（无论是否重复）一律不动
 *   · 绝不跨夹移动；chongfu/（主人归置的重复图）只读对照、avg/ 完全排除
 *   · _prev_ 备份完全不参与（不比对不改名）：备份与正本内容相同不算"重复"
 *   · 每次改名写还原日志 claudedocs/idle-dup-rename-log-{时间}.json
 *   · 任何异常一律吞掉 exit 0，绝不阻塞 dev 启动
 *   · 「多余」不退随机池：池子仍收夹内所有图（主人确认后手动删，删完下次启动自动回闲置）
 *
 * 性能：SHA-256 按 (size, mtimeMs) 缓存于 scratch/portrait_hash_cache.json，增量 0.1s。
 *
 * 用法：
 *   node TOOL/rename_duplicate_idle_portraits.mjs            # 执行（dev 启动自动跑）
 *   node TOOL/rename_duplicate_idle_portraits.mjs --dry-run  # 只预览
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { migratePortraitAdjustKeys } from './lib/portrait_adjust_migrate.mjs';

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
// 整夹跳过：调校表的时间戳备份，同属派生数据（历史遗留记录 ≠ 在用）
const REF_SCAN_SKIP_DIRS = new Set(['portrait_adjust_backups']);

const IDLE_RE = /^__闲置__(.+)_(\d+)\.png$/i;
const SURPLUS_RE = /^__多余__(.+)_(\d+)\.png$/i;

try {
    main();
} catch (e) {
    console.error('[立绘分类改名] 异常（不阻塞启动）:', e?.message ?? e);
}
process.exit(0);

function main() {
    const t0 = Date.now();

    // ── 1) 代码引用集合 ──
    // 2026-07-31 修：原来只存 basename，导致【跨夹同名】文件被误判为"被引用"而逃过分类。
    //   例：代码里只有 /assets/BASHU/shu_liubei.png，但 /assets/LINGNAN/shu_liubei.png
    //   也因同名被保护，明明是重复图却一直不被标 __多余__（实测漏网 12 张）。
    // 现在带路径的字面量按【完整路径】比对；只有不含目录的裸文件名才退回按名保护。
    const referencedPaths = new Set();   // '/assets/xxx/yyy.png' 小写
    const referencedNames = new Set();   // 裸文件名（无法判断目录时的兜底）
    const addRefs = (txt) => {
        const re = /['"`]([^'"`\n]*?\.png)['"`]/gi;
        let m;
        while ((m = re.exec(txt)) !== null) {
            const raw = m[1];
            if (raw.includes('${')) continue;              // 动态拼接，判不了，跳过
            const norm = raw.replace(/\\/g, '/').toLowerCase();
            if (norm.includes('/')) {
                const i = norm.indexOf('/assets/');
                referencedPaths.add(i >= 0 ? norm.slice(i) : norm);
            } else {
                referencedNames.add(norm);
            }
        }
    };
    /** 该文件是否被代码硬引用（铁律：被引用的一律不改名） */
    const isReferenced = (folder, file) =>
        referencedPaths.has(`/assets/${folder}/${file}`.toLowerCase())
        || referencedNames.has(file.toLowerCase());
    const walkCode = (dir) => {
        for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
            const p = path.join(dir, ent.name);
            if (ent.isDirectory()) {
                if (ent.name === 'node_modules' || ent.name === '.git') continue;
                if (REF_SCAN_SKIP_DIRS.has(ent.name)) continue;
                walkCode(p);
            } else if (/\.(ts|tsx|js|mjs|cjs)$/i.test(ent.name) && !REF_SCAN_SKIP.has(ent.name)) {
                addRefs(fs.readFileSync(p, 'utf-8'));
            }
        }
    };
    walkCode(path.join(ROOT, 'src'));
    addRefs(fs.readFileSync(path.join(ROOT, 'vite.config.ts'), 'utf-8'));

    // ── 2) 全库哈希（带缓存；_prev_ 备份不参与）──
    let cache = {};
    try {
        cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
    } catch { /* 首跑或缓存损坏，全量重算 */ }
    const nextCache = {};
    let hashed = 0;

    /** @type {Map<string, number>} sha256 → 库内份数（含 chongfu 对照） */
    const hashCount = new Map();
    /** @type {{folder:string, file:string, sha:string}[]} 可改名候选（非只读夹） */
    const candidates = [];
    /** 全库（含 chongfu）所有 png 文件名：编号全库唯一用 */
    const allNamesGlobal = [];

    for (const ent of fs.readdirSync(ASSETS, { withFileTypes: true })) {
        if (!ent.isDirectory() || EXCLUDE_TOP.has(ent.name)) continue;
        const folder = ent.name;
        const dir = path.join(ASSETS, folder);
        const readonly = READONLY_TOP.has(folder);
        for (const f of fs.readdirSync(dir)) {
            if (!/\.png$/i.test(f)) continue;
            if (/_prev_/i.test(f)) continue; // 备份不算重复来源，也永不改名
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
            hashCount.set(sha, (hashCount.get(sha) ?? 0) + 1);
            allNamesGlobal.push(f);
            if (!readonly) candidates.push({ folder, file: f, sha });
        }
    }
    fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
    fs.writeFileSync(CACHE_PATH, JSON.stringify(nextCache), 'utf-8');

    // ── 3) 分类：期望前缀 vs 当前名 ──
    /** @type {Map<string, {file:string, want:'多余'|'闲置'}[]>} folder → 改名任务 */
    const planByFolder = new Map();
    let dupGroups = 0;
    for (const n of hashCount.values()) if (n >= 2) dupGroups++;

    for (const c of candidates) {
        if (isReferenced(c.folder, c.file)) continue; // 被引用 → 铁律不动
        const isDup = (hashCount.get(c.sha) ?? 0) >= 2;
        const want = isDup ? '多余' : '闲置';
        const isIdleNamed = IDLE_RE.test(c.file);
        const isSurplusNamed = SURPLUS_RE.test(c.file);
        // 已是正确前缀 → 不动
        if (isDup && isSurplusNamed) continue;
        if (!isDup && isIdleNamed) continue;
        if (!planByFolder.has(c.folder)) planByFolder.set(c.folder, []);
        planByFolder.get(c.folder).push({ file: c.file, want });
    }

    // ── 4) 按夹分配编号并执行（闲置/多余各自独立编号序列）──
    // token 一律用夹名；编号取全库（含 chongfu、含其他夹的同 token 遗留名）最大值，
    // 保证 (前缀, token, 编号) 全库唯一——不同夹永不出现同名文件。
    /** @type {Map<string, number>} `${前缀}|${token小写}` → 全库最大编号 */
    const globalMax = new Map();
    const NUM_RE = /^__(闲置|多余)__(.+)_(\d+)\.png$/i;
    for (const f of allNamesGlobal) {
        const mm = f.match(NUM_RE);
        if (!mm) continue;
        const key = `${mm[1]}|${mm[2].toLowerCase()}`;
        const n = parseInt(mm[3], 10);
        if (n > (globalMax.get(key) ?? 0)) globalMax.set(key, n);
    }

    // ── 4) 计划先行（2026-08-03 数据安全化）──
    // ⚠ 血训：原来「改名→迁移调校键→写还原日志」顺序执行，日志最后才落盘：
    //   中途崩溃 = 无日志可追；迁移抛异常 = 文件已改名而调校表没跟上，主人手调失联
    //   （8/3 早 82 改名 73 键失联事故即此）。现在顺序定死：
    //   ① 只算计划不动盘 → ② 还原日志先落盘 → ③ 执行改名 → ④ 迁移调校键
    //   ④ 失败则把 ③ 全部改回去 —— 文件系统与调校表要么一起前进，要么一起原地。
    const plan = [];
    for (const [folder, tasks] of planByFolder) {
        const dir = path.join(ASSETS, folder);
        const all = fs.readdirSync(dir).filter((f) => /\.png$/i.test(f));
        const token = folder;
        const existing = new Set(all.map((f) => f.toLowerCase()));

        for (const task of tasks.sort((a, b) => a.file.localeCompare(b.file))) {
            const gkey = `${task.want}|${token.toLowerCase()}`;
            let dest;
            do {
                globalMax.set(gkey, (globalMax.get(gkey) ?? 0) + 1);
                dest = `__${task.want}__${token}_${String(globalMax.get(gkey)).padStart(2, '0')}.png`;
            } while (existing.has(dest.toLowerCase()));
            existing.add(dest.toLowerCase());
            console.log(`  [${folder}] ${task.file}  →  ${dest}`);
            plan.push({ folder, from: task.file, to: dest });
        }
    }

    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(
        `[立绘分类改名] 重复组 ${dupGroups} | 待改 ${plan.length}` +
        ` | 重新哈希 ${hashed} 张 | 耗时 ${secs}s${DRY ? '（--dry-run 未改盘）' : ''}`,
    );
    if (DRY || plan.length === 0) return;

    // ── 5) 还原日志【先】落盘：改名前就有账，中途断电/崩溃也能靠它追回 ──
    const ts = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
    const logDir = path.join(ROOT, 'claudedocs');
    fs.mkdirSync(logDir, { recursive: true });
    const logPath = path.join(logDir, `idle-dup-rename-log-${ts}.json`);
    fs.writeFileSync(logPath, JSON.stringify(plan, null, 2), 'utf-8');
    console.log(`  还原日志(先行): ${path.relative(ROOT, logPath)}`);

    // ── 5.5) 执行改名 ──
    const executed = [];
    for (const mv of plan) {
        const fromAbs = path.join(ASSETS, mv.folder, mv.from);
        const toAbs = path.join(ASSETS, mv.folder, mv.to);
        if (fs.existsSync(toAbs)) {
            console.error(`  ⚠ 目标已存在，跳过：${mv.folder}/${mv.to}`);
            continue;
        }
        try {
            fs.renameSync(fromAbs, toAbs);
        } catch (e) {
            console.error(`  ⚠ 改名失败，跳过：${mv.folder}/${mv.from}（${e?.code ?? e}）`);
            continue;
        }
        // 同步哈希缓存键，避免下次启动重算
        const relOld = `${mv.folder}/${mv.from}`;
        if (nextCache[relOld]) {
            nextCache[`${mv.folder}/${mv.to}`] = nextCache[relOld];
            delete nextCache[relOld];
        }
        executed.push(mv);
    }
    if (executed.length !== plan.length) {
        // 日志收敛为实际发生的改名（跳过项不留在账上误导追回脚本）
        fs.writeFileSync(logPath, JSON.stringify(executed, null, 2), 'utf-8');
    }
    console.log(`  实改 ${executed.length}/${plan.length}`);
    if (executed.length === 0) return;

    // ── 6) 调校键迁移；失败 = 整批回滚（主人 2026-08-03 定：手动调校永不失联）──
    let mig;
    try {
        mig = migratePortraitAdjustKeys(ROOT, executed);
    } catch (e) {
        console.error('  ❌❌ 调校键迁移失败，正在回滚本次全部改名（保文件与调校表一致，主人手调零损失）:');
        console.error(String(e?.stack ?? e));
        let undone = 0, stuck = 0;
        for (const mv of [...executed].reverse()) {
            try {
                fs.renameSync(path.join(ASSETS, mv.folder, mv.to), path.join(ASSETS, mv.folder, mv.from));
                undone++;
            } catch (e2) {
                stuck++;
                console.error(`  ⚠ 回滚失败：${mv.folder}/${mv.to} → ${mv.from}（${e2?.code ?? e2}）`);
            }
        }
        if (stuck === 0) {
            fs.writeFileSync(logPath, '[]', 'utf-8');   // 全部还原，无孤儿可追，日志清空
            console.error(`  ✅ 已回滚 ${undone} 个改名，本次启动不分类，下次启动自动重试`);
        } else {
            console.error(`  ❌ 回滚 ${undone} 成功 / ${stuck} 卡住 —— 请跑: node tools/lib/portrait_adjust_recover.mjs（默认 dry-run，加 --apply 写盘）`);
        }
        return;   // 哈希缓存 / canonical 都不更新，保持与盘面一致
    }
    if (mig.migrated > 0) {
        console.log(
            `  🎯 调校键迁移 ${mig.migrated} 条` +
            (mig.overwritten > 0 ? `（顶掉 ${mig.overwritten} 条同名遗留值）` : '') +
            (mig.backupFile ? ` | 备份 ${path.relative(ROOT, mig.backupFile)}` : ''),
        );
    }

    fs.writeFileSync(CACHE_PATH, JSON.stringify(nextCache), 'utf-8');

    // ── 7) 重建内容去重映射：改名后的副本经 canonical 继续共享调校 ──
    try {
        execSync('node scratch/build_portrait_canonical.mjs', { cwd: ROOT, stdio: 'inherit' });
    } catch {
        console.error('  ⚠ canonical 重建失败，请手动跑 npm run portrait:build-canonical');
    }
}
