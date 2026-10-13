/**
 * 真实地理战场图看门程序（2026-10-13 主人令「以后添加了新的据点，可以自动生成」）。
 * 随 npm run dev 启动：
 *   · 启动 1 分钟后查一遍，缺图／挪过位置的据点自动补图；
 *   · 之后 src/data/cities_v2.ts 一改，静候 30 秒（编辑器连续保存只算一次）再查一遍。
 * 实际干活的是 tools/rms/fillSiteMaps.mjs --all（已有图且坐标没变的据点直接跳过，正常情况几秒就结束）。
 */
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const CITY_FILE = 'src/data/cities_v2.ts';
let timer = null, running = false, again = false;

function run() {
    if (running) { again = true; return; }
    running = true;
    const child = spawn(process.execPath, ['tools/rms/fillSiteMaps.mjs', '--all'], { stdio: ['ignore', 'pipe', 'pipe'] });
    const log = (buf) => {
        for (const line of String(buf).split(/\r?\n/)) {
            if (line.trim() && !/DeprecationWarning|trace-deprecation/.test(line)) console.log('[真实地图] ' + line.trim());
        }
    };
    child.stdout.on('data', log);
    child.stderr.on('data', log);
    child.on('exit', () => {
        running = false;
        if (again) { again = false; schedule(30000); }
    });
}

function schedule(ms) {
    clearTimeout(timer);
    timer = setTimeout(run, ms);
}

// 用轮询而不用 fs.watch：编辑器／工具常以「写临时文件再改名」方式保存，fs.watch 在 Windows 上会跟丢
fs.watchFile(CITY_FILE, { interval: 5000 }, (cur, prev) => { if (cur.mtimeMs !== prev.mtimeMs) schedule(30000); });
schedule(60000);
console.log('[真实地图] 看门程序已启动：据点表改动后自动给新据点生成战术地图');
