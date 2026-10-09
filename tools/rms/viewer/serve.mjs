/**
 * viewer 的独立本地静态服务（第三步 · CC：不碰 src/ 与 public/，单独开服务）。
 * 根目录 = 仓库根，所以页面既能读 tools/rms/viewer/ 也能读 public/ 与 scratch/ 下的素材/数据。
 * 用法：node tools/rms/viewer/serve.mjs [端口=8787]
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const port = Number(process.argv[2] ?? 8787);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.css': 'text/css' };

http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    const file = path.join(root, url === '/' ? '/tools/rms/viewer/index.html' : url);
    if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
    fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404, { 'content-type': 'text/plain' }).end('404 ' + url); return; }
        res.writeHead(200, { 'content-type': MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream', 'cache-control': 'no-store' });
        res.end(data);
    });
}).listen(port, '127.0.0.1', () => console.log(`viewer: http://127.0.0.1:${port}/tools/rms/viewer/index.html`));
