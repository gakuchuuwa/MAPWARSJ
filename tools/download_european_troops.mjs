import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DOWNLOAD_DIR = path.resolve('public/SUCAI/STRONGHOLD_RESOURCES');

async function main() {
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: false,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-blink-features=AutomationControlled']
    });
    const page = (await browser.pages())[0] || await browser.newPage();
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: DOWNLOAD_DIR
    });

    console.log('📥 正在下载 European Troops 欧洲部队包...');
    await page.goto('https://www.spriters-resource.com/pc_computer/strongholdcrusader/asset/64404/', { waitUntil: 'domcontentloaded' });

    // 等待 5 秒过盾
    for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 1000));
        const title = await page.title();
        if (!title.includes('Just a moment')) break;
    }

    await new Promise(r => setTimeout(r, 2000));
    await page.evaluate(() => {
        const btn = document.querySelector('#download') || document.querySelector('a.button') || document.querySelector('a[href*="/media/assets/"]');
        if (btn) btn.click();
    });

    console.log('⏳ 等待 8 秒让大文件完全下载落盘...');
    await new Promise(r => setTimeout(r, 8000));
    await browser.close();

    console.log('🎉 欧洲部队下载执行完毕！');
}

main().catch(console.error);
