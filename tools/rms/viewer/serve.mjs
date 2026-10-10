/**
 * viewer 的本地独立静态与真实战场预览服务（CC 第 87 轮）。
 * 根目录 = 仓库根，既能伺服 viewer/ 下的原型页面，也能提供瓦片缓存与引擎执行 API。
 * 用法：node tools/rms/viewer/serve.mjs [端口=8787]
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { loadScript } from '../rmsParse.mjs';
import { MapEngine } from '../rmsEngine.mjs';
import { buildMapData, toJson } from '../mapData.mjs';
import { loadDatTables } from '../../../scratch/_dat.mjs';

const root = process.cwd();
const port = Number(process.argv[2] ?? 8787);
const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.css': 'text/css'
};

// 预加载 dat 规则表（耗时一次性 ~80ms）
let datTables = null;
function getDat() {
    if (!datTables) {
        datTables = loadDatTables();
    }
    return datTables;
}

const D8 = [
    [-1, -1], [0, -1], [1, -1],
    [-1,  0],          [1,  0],
    [-1,  1], [0,  1], [1,  1]
];

http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://127.0.0.1:${port}`);
    const pathname = decodeURIComponent(parsedUrl.pathname);

    // API 1: 高程瓦片代理与缓存 (/api/tile/elev?z=13&x=...&y=...)
    if (pathname === '/api/tile/elev') {
        const z = parsedUrl.searchParams.get('z') || '13';
        const x = parsedUrl.searchParams.get('x');
        const y = parsedUrl.searchParams.get('y');
        if (!x || !y) { res.writeHead(400).end('missing x or y'); return; }

        const dir = path.join(root, 'scratch/tiles_z13');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        // 先查本地已有瓦片
        let localFile = null;
        const files = fs.readdirSync(dir);
        for (const f of files) {
            if (f.endsWith(`_${x}_${y}.png`)) {
                localFile = path.join(dir, f);
                break;
            }
        }

        if (localFile && fs.existsSync(localFile)) {
            res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400' });
            fs.createReadStream(localFile).pipe(res);
            return;
        }

        // 本地不存在则联网拉取并缓存（≤6张/地点）
        try {
            const url = `https://elevation-tiles-prod.s3.amazonaws.com/terrarium/${z}/${x}/${y}.png`;
            console.log(`[Tile Proxy] Fetching Elev: ${url}`);
            const resp = await fetch(url);
            if (!resp.ok) {
                res.writeHead(resp.status).end(`Tile fetch failed: ${resp.status}`);
                return;
            }
            const buf = Buffer.from(await resp.arrayBuffer());
            const savePath = path.join(dir, `cached_${x}_${y}.png`);
            fs.writeFileSync(savePath, buf);
            res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400' });
            res.end(buf);
            return;
        } catch (e) {
            res.writeHead(500).end(String(e));
            return;
        }
    }

    // API 2: ESRI WaterMask 瓦片代理与缓存 (/api/tile/esri?z=10&x=...&y=...)
    if (pathname === '/api/tile/esri') {
        const z = parsedUrl.searchParams.get('z') || '10';
        const x = parsedUrl.searchParams.get('x');
        const y = parsedUrl.searchParams.get('y');
        if (!x || !y) { res.writeHead(400).end('missing x or y'); return; }

        const dir = path.join(root, 'scratch/esri_z10');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        // 先查本地已有瓦片
        let localFile = null;
        const files = fs.readdirSync(dir);
        for (const f of files) {
            if (f.endsWith(`_${y}_${x}.jpg`) || f.endsWith(`_${y}_${x}.png`)) {
                localFile = path.join(dir, f);
                break;
            }
        }

        if (localFile && fs.existsSync(localFile)) {
            res.writeHead(200, { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=86400' });
            fs.createReadStream(localFile).pipe(res);
            return;
        }

        // 本地不存在则联网拉取并缓存（≤6张/地点，注意 ESRI 路径为 z/y/x）
        try {
            const url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/${z}/${y}/${x}`;
            console.log(`[Tile Proxy] Fetching ESRI: ${url}`);
            const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            if (!resp.ok) {
                res.writeHead(resp.status).end(`Tile fetch failed: ${resp.status}`);
                return;
            }
            const buf = Buffer.from(await resp.arrayBuffer());
            const savePath = path.join(dir, `cached_10_${y}_${x}.jpg`);
            fs.writeFileSync(savePath, buf);
            res.writeHead(200, { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=86400' });
            res.end(buf);
            return;
        } catch (e) {
            res.writeHead(500).end(String(e));
            return;
        }
    }

    // API 3: 真实战场引擎生成接口 (/api/generate)
    if (pathname === '/api/generate' && req.method === 'POST') {
        let body = '';
        req.on('data', c => { body += c; });
        req.on('end', () => {
            try {
                const t0 = performance.now();
                const reqData = JSON.parse(body);
                const { name, theme, skeleton } = reqData;
                const N = skeleton.size || 120;

                // 1. 加载 Arabia.rms 并强制主题
                const { sections } = loadScript('Arabia.rms', { seed: 42, size: N, theme: theme });
                sections.CLIFF_GENERATION = []; // 真实地理战场清空悬崖

                // 2. 读取主题基础底地形
                const themeBaseTerrain = sections.LAND_GENERATION.find(c => c.cmd === 'base_terrain')?.args?.[0] ?? 12;

                // 3. 装配骨架
                const skel = {
                    land: new Uint8Array(skeleton.land),
                    elev: new Int8Array(skeleton.elev),
                    elevMeters: skeleton.elevMeters ? new Float32Array(skeleton.elevMeters) : undefined,
                    landTerrain: themeBaseTerrain,
                    waterTerrain: 23,
                    landId: 200
                };

                const { tInfo, terrainUnits, unitRestrict, objNames, names } = getDat();

                const engine = new MapEngine(sections, {
                    size: N,
                    players: 2,
                    seed: 42,
                    names,
                    info: tInfo,
                    objNames,
                    terrainUnits,
                    unitRestrict,
                    skeleton: skel
                });

                const eng = engine.run();

                // 4. 水地形后处理：近陆 8 邻域判定浅水 (1)
                for (let i = 0; i < N * N; i++) {
                    const t = eng.terrain[i];
                    if (t === 23 || t === 1) {
                        const x = i % N, y = Math.floor(i / N);
                        let nearLand = false;
                        for (const [dx, dy] of D8) {
                            const nx = x + dx, ny = y + dy;
                            if (nx >= 0 && nx < N && ny >= 0 && ny < N) {
                                const nt = eng.terrain[ny * N + nx];
                                if (nt !== 23 && nt !== 1) {
                                    nearLand = true;
                                    break;
                                }
                            }
                        }
                        eng.terrain[i] = nearLand ? 1 : 23;
                    }
                }

                // 5. 生成 mapdata 数据模型
                const mapData = buildMapData(eng, { size: N, source: `real_geo_${name}`, tInfo });
                const mapDataJson = toJson(mapData, { theme, usedSkeleton: true });
                const engineMs = performance.now() - t0;

                res.writeHead(200, { 'content-type': 'application/json' });
                res.end(JSON.stringify({
                    ok: true,
                    engineMs: Number(engineMs.toFixed(1)),
                    themeBaseTerrain,
                    mapData: mapDataJson
                }));
            } catch (err) {
                console.error('[Engine Error]', err);
                res.writeHead(500, { 'content-type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: String(err) }));
            }
        });
        return;
    }

    // 全局 WorldCover SAS 签名缓存与本地缓存目录
    const sasCache = new Map();
    const cogCacheDir = path.join(root, 'scratch/worldcover/cog_cache');
    const siteCacheDir = path.join(root, 'scratch/worldcover/site_cache');
    if (!fs.existsSync(cogCacheDir)) fs.mkdirSync(cogCacheDir, { recursive: true });
    if (!fs.existsSync(siteCacheDir)) fs.mkdirSync(siteCacheDir, { recursive: true });

    // API 4: WorldCover STAC 搜索与 SAS 签名代理 (/api/worldcover/sign)
    if (pathname === '/api/worldcover/sign' && req.method === 'POST') {
        let body = '';
        req.on('data', c => { body += c; });
        req.on('end', async () => {
            try {
                const { bbox } = JSON.parse(body); // [minLng, minLat, maxLng, maxLat]
                const searchUrl = 'https://planetarycomputer.microsoft.com/api/stac/v1/search';
                const sResp = await fetch(searchUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        collections: ['esa-worldcover'],
                        bbox: bbox,
                        limit: 1
                    }),
                    signal: AbortSignal.timeout(10000)
                });
                if (!sResp.ok) throw new Error(`STAC search failed: ${sResp.status}`);
                const sData = await sResp.json();
                if (!sData.features || sData.features.length === 0) {
                    res.writeHead(200, { 'content-type': 'application/json' });
                    res.end(JSON.stringify({ ok: false, error: 'No WorldCover feature found for bbox' }));
                    return;
                }
                const feat = sData.features[0];
                const rawHref = feat.assets?.map?.href;
                if (!rawHref) throw new Error('Missing assets.map.href in feature');

                // 检查 SAS 令牌缓存 (45分钟有效)
                const now = Date.now();
                let signedUrl = null;
                const cached = sasCache.get(rawHref);
                if (cached && cached.expiresAt > now) {
                    signedUrl = cached.signedUrl;
                } else {
                    const signUrl = `https://planetarycomputer.microsoft.com/api/sas/v1/sign?href=${encodeURIComponent(rawHref)}`;
                    for (let retry = 0; retry < 3; retry++) {
                        try {
                            const signResp = await fetch(signUrl, { signal: AbortSignal.timeout(8000) });
                            if (signResp.ok) {
                                const signData = await signResp.json();
                                signedUrl = signData.href;
                                sasCache.set(rawHref, { signedUrl, expiresAt: now + 45 * 60 * 1000 });
                                break;
                            } else if (signResp.status === 429) {
                                console.warn(`[WorldCover Sign 429] Waiting 2s before retry ${retry + 1}...`);
                                await new Promise(r => setTimeout(r, 2000));
                            }
                        } catch (e) {
                            console.warn(`[WorldCover] Sign retry ${retry + 1}: ${e.message}`);
                        }
                    }
                }

                if (!signedUrl) throw new Error('Failed to sign SAS URL from Planetary Computer');

                res.writeHead(200, { 'content-type': 'application/json' });
                res.end(JSON.stringify({
                    ok: true,
                    featureId: feat.id,
                    featBbox: feat.bbox,
                    transform: feat.assets.map['proj:transform'],
                    shape: feat.assets.map['proj:shape'],
                    signedUrl
                }));
            } catch (err) {
                console.error('[WorldCover Sign Error]', err);
                res.writeHead(500, { 'content-type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: String(err) }));
            }
        });
        return;
    }

    // API 5: WorldCover COG HTTP Range 只读代理 (/api/worldcover/proxy)
    if (pathname === '/api/worldcover/proxy') {
        const targetUrl = parsedUrl.searchParams.get('url');
        if (!targetUrl) {
            res.writeHead(400).end('Missing url param');
            return;
        }
        const range = req.headers['range'];
        const headers = { 'User-Agent': 'Mozilla/5.0' };
        if (range) headers['Range'] = range;

        // 提取瓦片名与 Range 构成缓存键
        const urlObj = new URL(targetUrl);
        const fileName = path.basename(urlObj.pathname);
        const rangeKey = (range || 'ALL').replace(/[^a-zA-Z0-9_-]/g, '_');
        const cacheFile = path.join(cogCacheDir, `${fileName}_${rangeKey}.bin`);

        if (fs.existsSync(cacheFile)) {
            const buf = fs.readFileSync(cacheFile);
            const status = range ? 206 : 200;
            const resHeaders = {
                'access-control-allow-origin': '*',
                'access-control-allow-headers': 'Range, Content-Type',
                'access-control-expose-headers': 'Content-Range, Content-Length, Accept-Ranges',
                'cache-control': 'public, max-age=86400',
                'content-length': buf.length
            };
            if (range) {
                const match = /bytes=(\d+)-(\d+)/.exec(range);
                if (match) {
                    resHeaders['content-range'] = `bytes ${match[1]}-${match[2]}/*`;
                }
            }
            res.writeHead(status, resHeaders);
            res.end(buf);
            return;
        }

        const t0 = performance.now();
        try {
            const resp = await fetch(targetUrl, { headers });
            const status = resp.status;
            const resHeaders = {
                'access-control-allow-origin': '*',
                'access-control-allow-headers': 'Range, Content-Type',
                'access-control-expose-headers': 'Content-Range, Content-Length, Accept-Ranges',
                'cache-control': 'public, max-age=3600'
            };
            for (const h of ['content-range', 'content-length', 'content-type', 'accept-ranges']) {
                const val = resp.headers.get(h);
                if (val) resHeaders[h] = val;
            }
            res.writeHead(status, resHeaders);
            const buf = Buffer.from(await resp.arrayBuffer());
            fs.writeFileSync(cacheFile, buf);
            const ms = (performance.now() - t0).toFixed(0);
            console.log(`[WorldCover Proxy] Range: ${range ?? 'ALL'} -> ${status} (${buf.length} bytes, ${ms}ms) [Cached]`);
            res.end(buf);
            return;
        } catch (err) {
            console.error('[WorldCover Proxy Error]', err);
            res.writeHead(502).end(String(err));
            return;
        }
    }

    // API 6: 地点级解码结果缓存接口 (/api/worldcover/cache)
    if (pathname === '/api/worldcover/cache') {
        if (req.method === 'GET') {
            const key = parsedUrl.searchParams.get('key');
            if (!key) { res.writeHead(400).end('missing key'); return; }
            const safeKey = key.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5.-]/g, '_');
            const target = path.join(siteCacheDir, `grid_${safeKey}.json`);
            if (fs.existsSync(target)) {
                res.writeHead(200, { 'content-type': 'application/json' });
                fs.createReadStream(target).pipe(res);
            } else {
                res.writeHead(404, { 'content-type': 'application/json' });
                res.end(JSON.stringify({ found: false }));
            }
            return;
        }
        if (req.method === 'POST') {
            let body = '';
            req.on('data', c => { body += c; });
            req.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    const safeKey = (data.key || 'unknown').replace(/[^a-zA-Z0-9_\u4e00-\u9fa5.-]/g, '_');
                    const target = path.join(siteCacheDir, `grid_${safeKey}.json`);
                    fs.writeFileSync(target, JSON.stringify(data));
                    res.writeHead(200, { 'content-type': 'application/json' });
                    res.end(JSON.stringify({ ok: true }));
                } catch (e) {
                    res.writeHead(500).end(String(e));
                }
            });
            return;
        }
    }

    // API 7: WorldCover 原始窗口持久化缓存 (/api/worldcover/save_raw)
    if (pathname === '/api/worldcover/save_raw' && req.method === 'POST') {
        let body = '';
        req.on('data', c => { body += c; });
        req.on('end', () => {
            try {
                const rawData = JSON.parse(body);
                const dir = path.join(root, 'scratch/worldcover');
                fs.mkdirSync(dir, { recursive: true });
                const siteName = (rawData.site || 'unknown').replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_');
                const outPath = path.join(dir, `raw_${siteName}.json`);
                fs.writeFileSync(outPath, JSON.stringify(rawData));
                console.log(`[WorldCover Cache] Saved raw window to ${outPath}`);
                res.writeHead(200, { 'content-type': 'application/json' });
                res.end(JSON.stringify({ ok: true, path: outPath }));
            } catch (err) {
                res.writeHead(500, { 'content-type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: String(err) }));
            }
        });
        return;
    }

    // 默认静态文件处理
    const targetPath = pathname === '/' ? '/tools/rms/viewer/preview.html' : pathname;
    const file = path.join(root, targetPath);
    if (!file.startsWith(root)) { res.writeHead(403).end(); return; }

    fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404, { 'content-type': 'text/plain' }).end('404 ' + pathname); return; }
        const ext = path.extname(file).toLowerCase();
        res.writeHead(200, {
            'content-type': MIME[ext] ?? 'application/octet-stream',
            'cache-control': 'no-store'
        });
        res.end(data);
    });
}).listen(port, '127.0.0.1', () => {
    console.log(`真实战场预览服务已就绪: http://127.0.0.1:${port}/tools/rms/viewer/preview.html`);
});
