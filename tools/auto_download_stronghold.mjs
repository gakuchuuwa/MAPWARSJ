import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DOWNLOAD_DIR = path.resolve('public/SUCAI/STRONGHOLD_RESOURCES');

if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

const targetPages = [
    { name: 'European Troops', url: 'https://www.spriters-resource.com/pc_computer/strongholdcrusader/asset/64404/' },
    { name: 'Arabian Troops', url: 'https://www.spriters-resource.com/pc_computer/strongholdcrusader/asset/64386/' },
    { name: 'Military Buildings', url: 'https://www.spriters-resource.com/pc_computer/strongholdcrusader/asset/64401/' }
];

async function run() {
    console.log('🚀 启动 Chrome 真实浏览器内核自动化下载任务...');
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    });

    const page = await browser.newPage();

    // 设置下载行为：自动保存到 DOWNLOAD_DIR
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: DOWNLOAD_DIR
    });

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    for (const target of targetPages) {
        console.log(`\n📥 正在自动访问并下载【${target.name}】: ${target.url}...`);
        try {
            await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
            await new Promise(r => setTimeout(r, 3000));

            // 寻找并点击下载按钮
            const downloadBtn = await page.$('#download');
            if (downloadBtn) {
                console.log(`   🎯 找到下载按钮，触发自动下载...`);
                await downloadBtn.click();
                // 等待下载写入
                await new Promise(r => setTimeout(r, 6000));
            } else {
                console.log(`   ⚠️ 未找到 #download 按钮，尝试通过链接下载...`);
                const downloadLink = await page.evaluate(() => {
                    const a = document.querySelector('a[href*="/media/assets/"]');
                    return a ? a.href : null;
                });
                if (downloadLink) {
                    await page.goto(downloadLink);
                    await new Promise(r => setTimeout(r, 6000));
                }
            }
        } catch (err) {
            console.error(`   ❌ 访问 ${target.name} 失败:`, err.message);
        }
    }

    console.log('\n⏳ 等待所有文件完全落盘...');
    await new Promise(r => setTimeout(r, 5000));
    await browser.close();

    console.log('🎉 自动化下载流程结束！');
    const files = fs.readdirSync(DOWNLOAD_DIR);
    console.log('📁 当前目录下的文件:', files);
}

run().catch(console.error);
