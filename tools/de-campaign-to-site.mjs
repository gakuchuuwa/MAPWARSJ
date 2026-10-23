/**
 * 把 tools/de-campaign-extract.py 导出的战役关卡原始数据（*.raw.json）转成战术场景能读的 DE 地图格式
 * （与 public/battlefields/site_*.json 同一套字段：width/height/terrain/elev/objects），整张原尺寸保留，
 * 预览页按 ?deox/?deoy 在浏览器里截 120×120（TAC_MAP_N）。
 *
 * 物件只留自然物件、占地格从 dat 表算 —— 与 tools/rms/mapData.mjs 完全同一套（不猜）。
 *
 * 用法：node tools/de-campaign-to-site.mjs scratch/de_campaign/cam2/2_Joan_1.raw.json [输出 id，默认 cam2_1]
 * 输出：public/de-maps/campaign/<id>.json，并更新 public/de-maps/campaign/index.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadUnitClassTable, isNaturalObject } from './rms/naturalObjects.mjs';
import { loadUnitSizeTable, KIND_OF, datFingerprint } from './rms/mapData.mjs';

const [src, idArg] = process.argv.slice(2);
if (!src) { console.error('用法：node tools/de-campaign-to-site.mjs <raw.json> [id]'); process.exit(1); }
const raw = JSON.parse(fs.readFileSync(src, 'utf8'));
const id = idArg || `${raw.campaign}_${raw.level}`;
const cls = loadUnitClassTable();
const sizes = loadUnitSizeTable();
const W = raw.width, H = raw.height;

const objects = [];
const skipped = new Map();
for (const u of raw.units) {
    if (!isNaturalObject(u.id, cls)) {
        const n = cls.get(u.id)?.name ?? `#${u.id}`;
        skipped.set(n, (skipped.get(n) ?? 0) + 1);
        continue;
    }
    const c = cls.get(u.id), sz = sizes.get(u.id);
    const w = sz?.clearance?.[0] ?? 0, h = sz?.clearance?.[1] ?? 0;
    const cx = Math.floor(u.x), cy = Math.floor(u.y);
    const covered = [];
    if (w > 0 && h > 0) {
        const x0 = Math.ceil(u.x - w / 2 - 0.5), x1 = Math.floor(u.x + w / 2 - 0.5);
        const y0 = Math.ceil(u.y - h / 2 - 0.5), y1 = Math.floor(u.y + h / 2 - 0.5);
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
            if (x < 0 || y < 0 || x >= W || y >= H) continue;
            covered.push(y * W + x);
        }
    }
    objects.push({
        id: u.id, name: sz?.name ?? c.name, kind: KIND_OF[`${c.cls}/${c.type}`] ?? '其他',
        x: u.x, y: u.y, cell: (cx >= 0 && cy >= 0 && cx < W && cy < H) ? cy * W + cx : -1,
        clearW: w, clearH: h, cells: covered,
    });
}

const out = {
    header: {
        formatVersion: 1, script: null, seed: null, theme: null, size: W, usedSkeleton: false, verbatim: true,
        datFingerprint: datFingerprint(), generatedAt: new Date().toISOString(),
        campaign: { campaign: raw.campaign, level: raw.level, name: raw.name, file: raw.file },
    },
    source: `DE campaign ${raw.campaign} · ${raw.file}`,
    width: W, height: H, terrain: raw.terrain, elev: raw.elev, objects,
};
const dir = 'public/de-maps/campaign';
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, `${id}.json`), JSON.stringify(out));

const idxFile = path.join(dir, 'index.json');
const idx = fs.existsSync(idxFile) ? JSON.parse(fs.readFileSync(idxFile, 'utf8')) : [];
const entry = { id, campaign: raw.campaign, level: raw.level, name: raw.name, file: `${id}.json`, width: W, height: H, objects: objects.length };
const k = idx.findIndex((e) => e.id === id);
if (k >= 0) idx[k] = entry; else idx.push(entry);
fs.writeFileSync(idxFile, JSON.stringify(idx, null, 2));

console.log(`✔ ${dir}/${id}.json  ${W}x${H}  自然物件 ${objects.length}（跳过非自然 ${raw.units.length - objects.length}）`);
console.log('  跳过的前 10 类：', [...skipped].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([n, c]) => `${n}×${c}`).join(' '));
