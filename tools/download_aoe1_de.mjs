import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DOWNLOAD_DIR = path.resolve('public/SUCAI/AOE1_DE_UNITS');

if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

const targetUrls = [
    { name: 'AoE1_DE_Units_Main', url: 'https://www.spriters-resource.com/pc_computer/ageofempiresdefinitiveedition/sheet/108537/' },
    { name: 'AoE1_DE_Index', url: 'https://www.spriters-resource.com/pc_computer/ageofempiresdefinitiveedition/' }
];

async function main() {
    console.log('🚀 启动 Chrome 自动化下载《帝国时代1：决定版》（古典希腊/罗马时代）部队包...');
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: false,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-blink-features=AutomationControlled', '--window-size=1100,800']
    });

    const page = (await browser.pages())[0] || await browser.newPage();
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: DOWNLOAD_DIR
    });

    for (const item of targetUrls) {
        console.log(`\n📥 正在访问: ${item.name} (${item.url})...`);
        await page.goto(item.url, { waitUntil: 'domcontentloaded' });

        // 等待过盾
        for (let i = 0; i < 15; i++) {
            await new Promise(r => setTimeout(r, 1000));
            const title = await page.title();
            if (!title.includes('Just a moment')) break;
        }

        await new Promise(r => setTimeout(r, 3000));

        // 点击下载按钮
        const downloaded = await page.evaluate(() => {
            const btn = document.querySelector('#download') || document.querySelector('a.button') || document.querySelector('a[href*="/media/assets/"]');
            if (btn) {
                btn.click();
                return true;
            }
            return false;
        });

        console.log(`   🎯 触发下载状态: ${downloaded}`);
        await new Promise(r => setTimeout(r, 8000));
    }

    console.log('\n⏳ 等待文件落盘...');
    await new Promise(r => setTimeout(r, 10000));
    await browser.close();

    console.log('🎉 下载任务结束！当前目录文件:');
    console.log(fs.readdirSync(DOWNLOAD_DIR));
}

main().catch(console.error);
