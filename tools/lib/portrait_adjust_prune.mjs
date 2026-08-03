/**
 * 清理死键（2026-08-03）：删除 portrait_adjust.ts 中指向不存在文件的调校记录。
 * 这些图已被删/改名且无法追回（git 历史无同内容），调校值读取时自然回落默认值，
 * 留着只是让 tuner 每次打开弹"失联"警告。清掉后弹窗消失，表也更干净。
 *
 * 用法:
 *   node tools/lib/portrait_adjust_prune.mjs --dry-run   # 只报数量，不写盘
 *   node tools/lib/portrait_adjust_prune.mjs --apply     # 写盘（先自动备份）
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const ADJ = path.join(ROOT, 'src', 'data', 'portrait_adjust.ts');
const ASSETS = path.join(ROOT, 'public', 'assets');
const BACKUP_DIR = path.join(ROOT, 'src', 'data', 'portrait_adjust_backups');

const DRY = process.argv.includes('--dry-run');

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

// 磁盘上真实存在的 png 路径集合
function buildDiskSet() {
    const set = new Set();
    const walk = (dir) => {
        for (const f of fs.readdirSync(dir)) {
            const abs = path.join(dir, f);
            const st = fs.statSync(abs);
            if (st.isDirectory()) {
                if (!['avg', 'chongfu', 'inbox', 'bgm_backup'].includes(f)) walk(abs);
            } else if (f.toLowerCase().endsWith('.png')) {
                set.add('/' + path.relative(path.join(ROOT, 'public'), abs).replace(/\\/g, '/'));
            }
        }
    };
    walk(ASSETS);
    return set;
}

function main() {
    const text = fs.readFileSync(ADJ, 'utf-8');
    const { head, entries, tail } = parseImages(text);
    const disk = buildDiskSet();

    const orphans = entries.filter((e) => !disk.has(e.key));
    console.log(`调校条目: ${entries.length} | 死键(指向不存在的文件): ${orphans.length}`);

    // 分类统计
    const cats = {};
    for (const o of orphans) {
        const base = o.key.split('/').pop() ?? '';
        let c = '正式名';
        if (base.startsWith('__多余__')) c = '多余';
        else if (base.startsWith('__闲置__')) c = '闲置';
        else if (/^[0-9a-f-]{36}\.png$/i.test(base)) c = 'uuid';
        else if (/^image \(\d+\)\.png$/.test(base)) c = 'image(N)';
        cats[c] = (cats[c] ?? 0) + 1;
    }
    console.log('死键构成:', JSON.stringify(cats));

    if (orphans.length > 0) {
        console.log('\n死键示例:');
        for (const o of orphans.slice(0, 12)) {
            console.log(`  ${o.key}  (scale ${o.scale}, offsetY ${o.offsetY})`);
        }
    }

    if (DRY) {
        console.log('\n(--dry-run 未写盘)');
        return;
    }
    if (orphans.length === 0) {
        console.log('✅ 无死键，无需清理');
        return;
    }

    // 备份 + 写盘
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
    const bf = path.join(BACKUP_DIR, `portrait_adjust_${ts}.ts`);
    if (!fs.existsSync(bf)) fs.copyFileSync(ADJ, bf);
    console.log(`备份 → ${bf}`);

    const orphanSet = new Set(orphans.map((o) => o.key));
    const kept = entries.filter((e) => !orphanSet.has(e.key));
    fs.writeFileSync(ADJ, serializeImages(head, kept, tail), 'utf-8');
    console.log(`✅ 已清理 ${orphans.length} 条死键，保留 ${kept.length} 条有效调校`);
}

main();
