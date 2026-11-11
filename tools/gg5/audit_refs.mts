/** 悬空引用体检（只算真正的代码引用，跳过注释行） */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { loadGG } from './gg_lib.mjs';
import { FACTIONS } from '../../src/data/factions';

const { gg } = loadGG();
const deleted: string[] = [];
for (const [fid, v] of gg) {
    const act = String((v as any).act ?? '');
    if (/删除/.test(act) || /并入/.test(act)) deleted.push(fid);
}
const hits: string[] = [];
const walk = (d: string) => {
    for (const e of readdirSync(d)) {
        const p = join(d, e);
        if (statSync(p).isDirectory()) { if (!/\.bak/.test(e)) walk(p); continue; }
        if (!/\.(ts|mts)$/.test(e) || /\.bak/.test(e)) continue;
        const lines = readFileSync(p, 'utf8').split('\n');
        lines.forEach((line, i) => {
            if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;   // 注释行
            for (const id of deleted) {
                if (new RegExp(`['"\`]${id}['"\`]`).test(line)) hits.push(`${p}:${i + 1} ${line.trim().slice(0, 100)}`);
            }
        });
    }
};
walk('src');
console.log(`已并入/删除势力 ${deleted.length} 家｜非注释残留 ${hits.length} 处`);
for (const s of hits) console.log('  ' + s);
