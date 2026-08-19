/**
 * BGM 响度审计：比对每首 BGM 的**实测 LUFS** 与 AudioManager 里 BGM_REGION_GAIN 的补偿值，
 * 确认补偿后全部落在目标响度附近。
 *
 * 为什么需要它：增益表是按文件当时的响度算的，一旦有人换了 BGM 文件或重新压制，
 * 表就悄悄过期，切歌忽大忽小且没有任何报错。2026-08-19 就踩过：37 首里 22 首被重压到
 * -18.0 LUFS 而表没更新，最响的比基准响 4.2dB。
 *
 * 用法：npm run bgm:audit        （需要 ffmpeg 在 PATH）
 * 退出码：0 = 全绿；1 = 有曲目偏离容差
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BGM_DIR = path.join(ROOT, 'public/assets/bgm');
const TARGET = -21.0;
const TOL = 1.0;            // 容差 ±1dB：听感上基本察觉不到

const src = fs.readFileSync(path.join(ROOT, 'src/audio/AudioManager.ts'), 'utf-8');
const at = src.indexOf('const BGM_REGION_GAIN');
const body = src.slice(src.indexOf('{', at) + 1, src.indexOf('};', at));
const gain = {};
for (const m of body.matchAll(/^\s+([A-Za-z_]+):\s*([0-9.]+),/gm)) gain[m[1]] = parseFloat(m[2]);

const files = fs.readdirSync(BGM_DIR).filter((f) => f.endsWith('.aud'));
let bad = 0;
const rows = [];
for (const f of files) {
    const key = f.replace(/_bgm\.aud$/, '').replace(/\.aud$/, '');
    // ffmpeg 把测量结果写在 **stderr** 且成功时退出码为 0 —— 必须用 spawnSync 直接读 stderr，
    // 放在 try/catch 里读 e.stderr 只在 ffmpeg 失败时才拿得到（2026-08-19 首版就踩了这个）。
    const res = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', path.join(BGM_DIR, f),
        '-af', 'ebur128=framelog=quiet', '-f', 'null', '-'], { encoding: 'utf-8' });
    const out = String(res.stderr ?? '');
    const m = out.match(/Integrated loudness[\s\S]*?I:\s*(-?\d+\.?\d*)\s*LUFS/);
    if (!m) { console.log(`  ⚠ ${key}: 无法测量`); bad++; continue; }
    const lufs = parseFloat(m[1]);
    const g = gain[key];
    if (g === undefined) { console.log(`  ✗ ${key}: 不在 BGM_REGION_GAIN 表里 → 按 1.0 播，未补偿`); bad++; continue; }
    const eff = lufs + 20 * Math.log10(g);
    rows.push({ key, lufs, g, eff, off: eff - TARGET });
}
rows.sort((a, b) => b.off - a.off);
console.log(`\n目标 ${TARGET} LUFS，容差 ±${TOL}dB\n`);
console.log('曲目'.padEnd(24) + '实测'.padStart(8) + 'gain'.padStart(8) + '补偿后'.padStart(9) + '偏差'.padStart(8));
for (const r of rows) {
    const flag = Math.abs(r.off) > TOL ? '  ✗ 需重算 gain' : '';
    if (flag) bad++;
    console.log(r.key.padEnd(24) + r.lufs.toFixed(1).padStart(8) + r.g.toFixed(3).padStart(8)
        + r.eff.toFixed(1).padStart(9) + `${r.off >= 0 ? '+' : ''}${r.off.toFixed(1)}`.padStart(8) + flag);
}
const effs = rows.map((r) => r.eff);
console.log(`\n补偿后区间 ${Math.min(...effs).toFixed(1)} ~ ${Math.max(...effs).toFixed(1)} LUFS，极差 ${(Math.max(...effs) - Math.min(...effs)).toFixed(1)} dB`);
console.log(bad ? `\n✗ 审计未通过：${bad} 处` : '\n✓ BGM 响度全绿');
process.exit(bad ? 1 : 0);
