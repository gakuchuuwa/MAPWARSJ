import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DOWNLOAD_DIR = path.resolve('public/SUCAI/STRONGHOLD_RESOURCES');

if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

const targetAssets = [
    { name: 'European_Troops.zip', pageUrl: 'https://www.spriters-resource.com/pc_computer/strongholdcrusader/asset/64404/', assetUrl: 'https://www.spriters-resource.com/media/assets/61/64404.zip?updated=1755473492' },
    { name: 'Arabian_Troops.zip', pageUrl: 'https://www.spriters-resource.com/pc_computer/strongholdcrusader/asset/64386/', assetUrl: 'https://www.spriters-resource.com/media/assets/61/64386.zip?updated=1755473489' },
    { name: 'Military_Buildings.zip', pageUrl: 'https://www.spriters-resource.com/pc_computer/strongholdcrusader/asset/64401/', assetUrl: 'https://www.spriters-resource.com/media/assets/61/64401.zip?updated=1755473491' }
];

async function run() {
    console.log('🚀 启动 Chrome 真实浏览器内核并注入 Fetch 隧道...');
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    for (const item of targetAssets) {
        console.log(`\n📥 正在通过浏览器上下文加载【${item.name}】...`);
        try {
            await page.goto(item.pageUrl, { waitUntil: 'networkidle2', timeout: 60000 });
            console.log(`   🌐 页面加载完成，正在通过浏览器原生 Fetch 管道抓取二进制数据...`);

            const base64Data = await page.evaluate(async (url) => {
                const resp = await fetch(url, { credentials: 'include' });
                if (!resp.ok) throw new Error('Fetch failed with status: ' + resp.status);
                const buffer = await resp.arrayBuffer();
                let binary = '';
                const bytes = new Uint8Array(buffer);
                const len = bytes.byteLength;
                for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                return btoa(binary);
            }, item.assetUrl);

            const destPath = path.join(DOWNLOAD_DIR, item.name);
            fs.writeFileSync(destPath, Buffer.from(base64Data, 'base64'));
            const size = fs.statSync(destPath).size;
            console.log(`   ✅ 成功保存文件: ${item.name} (${(size / 1024 / 1024).toFixed(2)} MB)`);
        } catch (err) {
            console.error(`   ❌ 下载 ${item.name} 失败:`, err.message);
        }
    }

    await browser.close();
    console.log('\n🎉 所有《要塞：十字军东征》部队资源全部成功下载到本地！');
}

run().catch(console.error);
