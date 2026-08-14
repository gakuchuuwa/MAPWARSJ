import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const ROOT_DIR = 'C:\\MAPWARSJ';
const OUTPUT_BASE = path.join(ROOT_DIR, 'public', 'SUCAI', '0AD_OFFICIAL_RAW');

if (!fs.existsSync(OUTPUT_BASE)) fs.mkdirSync(OUTPUT_BASE, { recursive: true });

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`Failed to parse JSON from ${url}`));
                }
            });
        }).on('error', reject);
    });
}

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
            if (res.statusCode === 200) {
                res.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            } else {
                file.close();
                if (fs.existsSync(dest)) fs.unlinkSync(dest);
                reject(new Error(`HTTP ${res.statusCode}`));
            }
        }).on('error', err => {
            file.close();
            if (fs.existsSync(dest)) fs.unlinkSync(dest);
            reject(err);
        });
    });
}

async function main() {
    console.log('🏛️ 开始全量拉取 0 A.D. 官方各文明所有兵种高清资源图...');

    const rootApiUrl = 'https://api.github.com/repos/0ad/0ad/contents/binaries/data/mods/public/art/textures/ui/session/portraits/units';
    const civDirs = await fetchJson(rootApiUrl);

    if (!Array.isArray(civDirs)) {
        console.error('❌ 获取目录列表失败:', civDirs);
        return;
    }

    for (const item of civDirs) {
        if (item.type === 'dir') {
            const civFolder = path.join(OUTPUT_BASE, item.name);
            if (!fs.existsSync(civFolder)) fs.mkdirSync(civFolder, { recursive: true });

            console.log(`\n📦 正在同步 0 A.D. 官方文明 [${item.name}] 兵种资源...`);
            try {
                const files = await fetchJson(item.url);
                if (Array.isArray(files)) {
                    for (const f of files) {
                        if (f.name.endsWith('.png') || f.name.endsWith('.jpg')) {
                            const destPath = path.join(civFolder, f.name);
                            if (!fs.existsSync(destPath)) {
                                await downloadFile(f.download_url, destPath);
                                console.log(`   ✅ 已下载: ${f.name}`);
                            } else {
                                console.log(`   ⏩ 已存在: ${f.name}`);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error(`   ❌ 获取 ${item.name} 失败:`, err.message);
            }
        }
    }

    console.log('\n🎉 0 A.D. 官方所有文明兵种资源图全部同步完毕！');
    console.log(`📁 存放路径: ${OUTPUT_BASE}`);
}

main().catch(console.error);
