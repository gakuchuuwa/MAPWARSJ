import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const BASE_OUTPUT = path.join(ROOT_DIR, 'public', 'SUCAI', '0AD_UNITS');

const CIV_MAP = {
    'mace': '01_MACEDON',
    'rome': '02_ROME',
    'han': '03_HAN_CHINA',
    'spart': '04_SPARTA',
    'athen': '05_ATHENS',
    'hele': '05_ATHENS',
    'pers': '06_PERSIA',
    'maur': '07_MAURYA_INDIA',
    'cart': '08_CARTHAGE',
    'sele': '09_SELEUCID',
    'ptol': '10_PTOLEMY_EGYPT',
    'kush': '11_KUSH_NUBIA',
    'gaul': '12_GAUL_CELTIC',
    'celt': '12_GAUL_CELTIC',
    'brit': '13_BRITON',
    'iber': '14_IBERIA',
};

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`Failed to parse JSON from ${url}: ${e.message}`));
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
                fs.unlinkSync(dest);
                reject(new Error(`HTTP ${res.statusCode} downloading ${url}`));
            }
        }).on('error', err => {
            file.close();
            if (fs.existsSync(dest)) fs.unlinkSync(dest);
            reject(err);
        });
    });
}

async function main() {
    console.log('===========================================================');
    console.log('📥 0 A.D. 官方 14 大文明全套兵种大图全量批量下载器');
    console.log('===========================================================');

    const rootApiUrl = 'https://api.github.com/repos/0ad/0ad/contents/binaries/data/mods/public/art/textures/ui/session/portraits/units';
    const civDirs = await fetchJson(rootApiUrl);

    if (!Array.isArray(civDirs)) {
        console.error('❌ 获取目录列表失败:', civDirs);
        return;
    }

    let totalDownloaded = 0;

    for (const item of civDirs) {
        if (item.type === 'dir' && CIV_MAP[item.name]) {
            const targetFolder = path.join(BASE_OUTPUT, CIV_MAP[item.name]);
            if (!fs.existsSync(targetFolder)) fs.mkdirSync(targetFolder, { recursive: true });

            console.log(`\n🏛️ 正在获取文明 [${item.name} -> ${CIV_MAP[item.name]}] 兵种列表...`);
            try {
                const files = await fetchJson(item.url);
                if (Array.isArray(files)) {
                    for (const f of files) {
                        if (f.name.endsWith('.png') || f.name.endsWith('.jpg')) {
                            const destPath = path.join(targetFolder, f.name);
                            if (!fs.existsSync(destPath)) {
                                console.log(`   ⬇️ 下载: ${f.name}`);
                                await downloadFile(f.download_url, destPath);
                                totalDownloaded++;
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

    console.log('\n===========================================================');
    console.log(`🎉 全部 14 大文明官方兵种大图全部下载完毕！累计新增下载: ${totalDownloaded} 张`);
    console.log(`📁 存放根目录: ${BASE_OUTPUT}`);
    console.log('===========================================================');
}

main().catch(console.error);
