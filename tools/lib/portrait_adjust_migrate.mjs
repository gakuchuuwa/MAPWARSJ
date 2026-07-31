/**
 * 立绘改名时同步迁移 portrait_adjust.ts 的调校键（主人 2026-07-31 定）
 * ------------------------------------------------------------------
 * 背景：两个自动改名脚本（rename_idle_portraits / rename_duplicate_idle_portraits）
 * 把未引用立绘改成 __闲置__/__多余__ 的序号名，但一直没有迁移调校记录。后果有两层：
 *
 *   ① 调校失联 —— 路径变了，resolvePortraitAdjust 按新路径查不到，回落文件夹默认值，
 *      玩家看到的就是"明明调好保存过，怎么又回去了"。
 *      实测：历次改名日志 532 条中 292 条改名前有调校，canonical 兜底只救回 5 条，287 条失效。
 *
 *   ② 调校串图（更糟）—— 序号名按夹内现状重排，图一进一出序号就移位。
 *      实测 59 个目标名被不同源文件复用过（如 __多余__CENTRAL_ASIA_01.png 先后是三张不同的图），
 *      新占用者会直接继承上一任遗留的调校记录，等于把别人的位置缩放套到自己头上。
 *
 * 本模块把一批改名当作【同时生效的重映射】处理，同时解决这两点：
 *   · from 键上的调校搬到 to 键（① 解决）
 *   · 搬过去时覆盖 to 键上的历史遗留值，且 from 键随即删除（② 解决）
 *   · 一批内 a→b、b→c 这类链式/交换改名不会串（先整体读出再整体写回，不做顺序替换）
 *
 * 只重写 "images" 段，文件其余部分（folders / folderGuides / 类型定义）逐字节保留。
 * 写盘前落一份备份到 src/data/portrait_adjust_backups/，与 /api/save-portrait-adjust 同目录。
 */
import fs from 'fs';
import path from 'path';

const IMAGES_OPEN = '    "images": {';

/** 解析 images 段：返回 { head, entries, tail }，entries 保持原顺序 */
function parseImages(text) {
    const openIdx = text.indexOf(IMAGES_OPEN);
    if (openIdx < 0) throw new Error('portrait_adjust.ts 中找不到 "images" 段');
    const bodyStart = openIdx + IMAGES_OPEN.length;

    // 从 "images": { 之后逐字符找配对的闭合花括号
    let depth = 1;
    let i = bodyStart;
    for (; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {                       // 跳过字符串（键名里有中文/括号也安全）
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
    if (depth !== 0) throw new Error('portrait_adjust.ts 的 "images" 段花括号不配对');

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

function backup(adjustPath) {
    const dir = path.join(path.dirname(adjustPath), 'portrait_adjust_backups');
    fs.mkdirSync(dir, { recursive: true });
    const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
    const f = path.join(dir, `portrait_adjust_${ts}.ts`);
    if (!fs.existsSync(f)) fs.copyFileSync(adjustPath, f);
    return f;
}

/**
 * @param {string} root 仓库根目录
 * @param {Array<{folder:string, from:string, to:string}>} moves 本次改名清单
 * @param {{dryRun?:boolean}} [opts]
 * @returns {{migrated:number, overwritten:number, backupFile?:string}}
 */
export function migratePortraitAdjustKeys(root, moves, opts = {}) {
    const result = { migrated: 0, overwritten: 0 };
    if (!moves || moves.length === 0) return result;

    const adjustPath = path.join(root, 'src/data/portrait_adjust.ts');
    if (!fs.existsSync(adjustPath)) return result;

    const text = fs.readFileSync(adjustPath, 'utf-8');
    const { head, entries, tail } = parseImages(text);

    const byKey = new Map(entries.map((e) => [e.key, e]));
    const remap = new Map();                       // from → to
    for (const mv of moves) {
        if (!mv?.folder || !mv?.from || !mv?.to) continue;
        remap.set(`/assets/${mv.folder}/${mv.from}`, `/assets/${mv.folder}/${mv.to}`);
    }

    // 先把要搬的值整体读出来，再统一写回 —— 顺序替换会让 a→b、b→c 串味
    const moving = new Map();
    for (const [from, to] of remap) {
        const e = byKey.get(from);
        if (e) moving.set(to, { scale: e.scale, offsetX: e.offsetX, offsetY: e.offsetY });
    }
    if (moving.size === 0) return result;

    // 就地改键：条目留在原来的位置上只换 key，避免整份文件顺序被打乱、diff 爆炸
    const out = [];
    const emitted = new Set();
    for (const e of entries) {
        const movedTo = remap.get(e.key);
        if (movedTo !== undefined) {               // 这张被改名走了：值挪到新键，占住原位
            if (moving.has(movedTo) && !emitted.has(movedTo)) {
                out.push({ key: movedTo, ...moving.get(movedTo) });
                emitted.add(movedTo);
            }
            continue;
        }
        if (moving.has(e.key)) {                   // 目标名上压着上一任的遗留值 → 丢弃, 用搬来的值
            if (!emitted.has(e.key)) {
                out.push({ key: e.key, ...moving.get(e.key) });
                emitted.add(e.key);
            }
            continue;
        }
        out.push(e);
    }
    for (const [to, v] of moving) {
        if (!emitted.has(to)) out.push({ key: to, ...v });
    }
    result.migrated = moving.size;
    // 目标名原本就有记录、且它自己没被改名走 = 上一任遗留值被顶掉（正是"调校串图"的来源）
    result.overwritten = [...moving.keys()].filter((k) => byKey.has(k) && !remap.has(k)).length;

    if (opts.dryRun) return result;
    result.backupFile = backup(adjustPath);
    fs.writeFileSync(adjustPath, serializeImages(head, out, tail), 'utf-8');
    return result;
}
