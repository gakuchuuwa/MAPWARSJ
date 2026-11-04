/**
 * 生成 BGM 时长表 src/audio/bgmDurations.ts（F3 选曲下拉框显示歌曲时间用）。
 * 换过 / 增删 BGM 文件后重跑：npm run bgm:durations   （需要 ffprobe 在 PATH）
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BGM_DIR = path.join(ROOT, 'public/bgm');
const OUT = path.join(ROOT, 'src/audio/bgmDurations.ts');

const files = fs.readdirSync(BGM_DIR).filter((f) => f.endsWith('_bgm.aud')).sort();
const lines = [];
let bad = 0;
for (const f of files) {
    const key = f.replace(/_bgm\.aud$/, '');
    const res = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration',
        '-of', 'default=nw=1:nk=1', path.join(BGM_DIR, f)], { encoding: 'utf-8' });
    const sec = parseFloat(String(res.stdout ?? '').trim());
    if (!Number.isFinite(sec)) { console.log(`  ⚠ ${key}: 无法读取时长`); bad++; continue; }
    lines.push(`    ${/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) ? key : `'${key}'`}: ${Math.round(sec)},`);
}
fs.writeFileSync(OUT, `// 🔴 自动生成（tools/bgm_durations.mjs）：BGM 文件夹键 → 时长秒数（F3 选曲下拉框显示用）。
// 换过 BGM 文件后重跑 npm run bgm:durations，别手改。
export const BGM_DURATIONS: Record<string, number> = {
${lines.join('\n')}
};
`);
console.log(`✓ 写入 ${lines.length} 首${bad ? `，${bad} 首读取失败` : ''} → ${path.relative(ROOT, OUT)}`);
process.exit(bad ? 1 : 0);
