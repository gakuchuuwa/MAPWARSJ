/**
 * 孤儿调校追回（2026-08-03）：把 portrait_adjust.ts 中指向不存在文件的 key 接回。
 *
 * 三层追回：
 *   ① 改名日志追链 —— claudedocs/idle-*-rename-log-*.json（27 份，738 条改名）反向映射
 *   ② git rename 映射 —— 8/2、8/3 未走脚本的改名（R100 = 内容 100% 相同，安全）
 *   ③ MD5 内容匹配 —— 磁盘现存文件按内容找同图（改名+改夹都免疫）
 *
 * 用法:
 *   node tools/lib/portrait_adjust_recover.mjs --dry-run   # 只报能救多少，不写盘
 *   node tools/lib/portrait_adjust_recover.mjs --apply     # 写盘（先自动备份）
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const ADJ = path.join(ROOT, 'src', 'data', 'portrait_adjust.ts');
const ASSETS = path.join(ROOT, 'public', 'assets');
const BACKUP_DIR = path.join(ROOT, 'src', 'data', 'portrait_adjust_backups');

// 默认 dry-run：只有显式 --apply 才写盘（与顶部用法说明一致；改表脚本绝不默认动盘）
const DRY = !process.argv.includes('--apply');

// ── 1. 解析调校表 images 段 ──
const IMAGES_OPEN = '    "images": {';

function parseImages(text) {
    const openIdx = text.indexOf(IMAGES_OPEN);
    if (openIdx < 0) throw new Error('找不到 "images" 段');
    const bodyStart = openIdx + IMAGES_OPEN.length;
    let depth = 1, i = bodyStart;
    for (; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
            i++;
            while (i < text.length && text[i] !== '"') {
                if (text[i] === '\\') i++;
                i++;
            }
            continue;
        }
        if (c === '{') depth++;
        else if (c === '}') { depth--; if (depth === 0) break; }
    }
    const body = text.slice(bodyStart, i);
    const entries = [];
    const re = /"((?:[^"\\]|\\.)*)":\s*\{\s*"scale":\s*(-?[\d.]+),\s*"offsetX":\s*(-?[\d.]+),\s*"offsetY":\s*(-?[\d.]+)\s*\}/g;
    let m;
    while ((m = re.exec(body))) {
        entries.push({ key: JSON.parse(`"${m[1]}"`), scale: m[2], offsetX: m[3], offsetY: m[4] });
    }
    return { head: text.slice(0, bodyStart), entries, tail: text.slice(i) };
}

function serializeImages(head, entries, tail) {
    const lines = entries.map((e) =>
        `        ${JSON.stringify(e.key)}: {\n` +
        `            "scale": ${e.scale},\n` +
        `            "offsetX": ${e.offsetX},\n` +
        `            "offsetY": ${e.offsetY}\n` +
        `        }`,
    );
    return `${head}\n${lines.join(',\n')}\n    ${tail}`;
}

// ── 2. 收集改名日志（全部历史）──
function collectRenameLogs() {
    const map = new Map(); // fromPath -> toPath
    const logDir = path.join(ROOT, 'claudedocs');
    if (!fs.existsSync(logDir)) return map;
    for (const f of fs.readdirSync(logDir)) {
        if (!/^idle-(dup-)?rename-log-\d+\.json$/.test(f)) continue;
        try {
            const log = JSON.parse(fs.readFileSync(path.join(logDir, f), 'utf-8'));
            for (const e of log) {
                if (e?.folder && e?.from && e?.to) {
                    map.set(`/assets/${e.folder}/${e.from}`, `/assets/${e.folder}/${e.to}`);
                }
            }
        } catch { /* 跳过坏日志 */ }
    }
    return map;
}

// ── 3. git rename 映射（R100，内容相同）──
function collectGitRenames() {
    const map = new Map();
    try {
        const out = execSync(
            'git -c core.quotepath=false log --name-status --diff-filter=R --format= --since=2026-08-01 -- public/assets',
            { cwd: ROOT, encoding: 'utf-8', maxBuffer: 32 * 1024 * 1024 },
        );
        for (const line of out.split('\n')) {
            const parts = line.split('\t');
            if (parts.length >= 3 && parts[0].startsWith('R')) {
                const old = parts[1].replace(/^public/, '');
                const next = parts[2].replace(/^public/, '').replace(/^"(.*)"$/, '$1');
                map.set(old, next);
            }
        }
    } catch { /* git 不可用则跳过 */ }
    return map;
}

// ── 4. 磁盘 MD5 索引 ──
function buildDiskMd5() {
    const byMd5 = new Map();
    const walk = (dir) => {
        for (const f of fs.readdirSync(dir)) {
            const abs = path.join(dir, f);
            const st = fs.statSync(abs);
            if (st.isDirectory()) {
                if (!['avg', 'chongfu', 'inbox', 'bgm_backup'].includes(f)) walk(abs);
            } else if (f.toLowerCase().endsWith('.png')) {
                // web 路径 = /assets/<folder>/<file>（相对 public）
                const web = '/' + path.relative(path.join(ROOT, 'public'), abs).replace(/\\/g, '/');
                const md5 = crypto.createHash('md5').update(fs.readFileSync(abs)).digest('hex');
                if (!byMd5.has(md5)) byMd5.set(md5, []);
                byMd5.get(md5).push(web);
            }
        }
    };
    walk(ASSETS);
    return byMd5;
}

// ── 5. 追回 ──
function main() {
    const text = fs.readFileSync(ADJ, 'utf-8');
    const { head, entries, tail } = parseImages(text);
    const byKey = new Map(entries.map((e) => [e.key, e]));

    const diskMd5 = buildDiskMd5();
    const diskPaths = new Set([...diskMd5.values()].flat());

    // 悬空 key
    const orphans = entries.filter((e) => !diskPaths.has(e.key));
    console.log(`调校条目: ${entries.length} | 悬空: ${orphans.length}`);

    const renameLogs = collectRenameLogs();
    const gitRenames = collectGitRenames();
    console.log(`改名日志映射: ${renameLogs.size} 条 | git rename 映射: ${gitRenames.size} 条`);

    // 链式解析：from -> to（a->b, b->c 解到 c）
    const resolveChain = (start, map) => {
        let cur = start;
        const seen = new Set();
        while (map.has(cur) && !seen.has(cur)) {
            seen.add(cur);
            cur = map.get(cur);
        }
        return cur;
    };

    const remap = new Map(); // orphanKey -> newKey
    for (const o of orphans) {
        // ① 改名日志链
        const viaLog = resolveChain(o.key, renameLogs);
        if (viaLog !== o.key && diskPaths.has(viaLog)) { remap.set(o.key, viaLog); continue; }
        // ② git rename 链
        const viaGit = resolveChain(o.key, gitRenames);
        if (viaGit !== o.key && diskPaths.has(viaGit)) { remap.set(o.key, viaGit); continue; }
        // ③ MD5 内容匹配（需要从 git 取旧文件内容 —— 这里用 rename 链已有路径的间接法）
    }

    // ③ MD5 内容匹配：对仍悬空的，遍历 git 历史找该路径最后一次存在的内容
    let md5Saved = 0;
    for (const o of orphans) {
        if (remap.has(o.key)) continue;
        try {
            const rel = 'public' + o.key;   // git 路径带 public/ 前缀
            // 取该路径所有历史 commit（含已删除/已改名的），倒序找第一个能取到内容的
            const commits = execSync(
                `git log --all --format=%H -- "${rel}"`,
                { cwd: ROOT, encoding: 'utf-8', maxBuffer: 1024 * 1024 },
            ).trim().split('\n').filter(Boolean);
            let blob = null;
            for (const c of commits) {
                try {
                    blob = execSync(`git show ${c}:"${rel}"`, { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 });
                    if (blob && blob.length > 0) break;
                } catch { /* 该 commit 中路径不存在，试下一个 */ }
            }
            if (!blob) continue;
            const md5 = crypto.createHash('md5').update(blob).digest('hex');
            const cands = diskMd5.get(md5) || [];
            const sameDir = cands.filter((c) => c.startsWith(o.key.slice(0, o.key.lastIndexOf('/'))));
            const target = (sameDir[0] || cands[0]);
            if (target) {
                remap.set(o.key, target);
                md5Saved++;
            }
        } catch { /* 取不到就跳过 */ }
    }

    // 目标 key 上已有活记录（现值可能是主人更新的手调）→ 不追回、不顶掉，列出来人工裁决。
    // 2026-08-03 血训：首跑没这层防护，355 个目标名撞了活记录被写成重复键，
    // JSON round-trip 静默去重后 49 条较新手调被旧孤儿值顶掉。绝不再静默二选一。
    const liveKeys = new Set(entries.filter((e) => diskPaths.has(e.key)).map((e) => e.key));
    const conflicts = [];
    for (const [from, to] of [...remap]) {
        if (liveKeys.has(to)) {
            conflicts.push({ from, to });
            remap.delete(from);
        }
    }
    if (conflicts.length > 0) {
        console.log(`\n⚠ ${conflicts.length} 条目标 key 已有活调校，跳过不顶（如需用旧值请人工比对）：`);
        for (const c of conflicts.slice(0, 10)) console.log(`  ${c.from}\n    ×> ${c.to}（已有活值）`);
        if (conflicts.length > 10) console.log(`  … 其余 ${conflicts.length - 10} 条`);
    }

    console.log(`\n可追回: ${remap.size} 条（改名日志+git ${remap.size - md5Saved} | MD5 内容匹配 ${md5Saved}）`);
    console.log(`仍失联: ${orphans.length - remap.size} 条`);
    if (remap.size > 0) {
        console.log('\n追回示例:');
        let n = 0;
        for (const [from, to] of remap) {
            if (n++ >= 10) break;
            console.log(`  ${from}\n    -> ${to}`);
        }
    }

    if (DRY) {
        console.log('\n(--dry-run 未写盘)');
        return;
    }

    // 写盘：先备份
    if (remap.size > 0) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
        const bf = path.join(BACKUP_DIR, `portrait_adjust_${ts}.ts`);
        if (!fs.existsSync(bf)) fs.copyFileSync(ADJ, bf);
        console.log(`备份 → ${bf}`);

        // 就地换键（保持顺序）
        const out = [];
        const emitted = new Set();
        for (const e of entries) {
            const target = remap.get(e.key);
            if (target !== undefined) {
                if (!emitted.has(target)) {
                    out.push({ key: target, scale: e.scale, offsetX: e.offsetX, offsetY: e.offsetY });
                    emitted.add(target);
                }
                continue;
            }
            out.push(e);
        }
        fs.writeFileSync(ADJ, serializeImages(head, out, tail), 'utf-8');
        console.log(`✅ 已写盘：${remap.size} 条孤儿 key 接回新路径`);
    }
}

main();
