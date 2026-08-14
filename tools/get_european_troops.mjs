import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DOWNLOAD_DIR = path.resolve('public/SUCAI/STRONGHOLD_RESOURCES');

async function main() {
    console.log('🚀 正在通过真实前台窗口获取 European Troops 欧洲部队包...');
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: false,
        defaultViewport: null,
        args: [
            '--no-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--window-size=1000,700'
        ]
    });

    const page = (await browser.pages())[0] || await browser.newPage();
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: DOWNLOAD_DIR
    });

    await page.goto('https://www.spriters-resource.com/pc_computer/strongholdcrusader/asset/64404/', { waitUntil: 'domcontentloaded' });

    console.log('⏳ 正在等待 10 秒供浏览器自动渲染并点击下载...');
    await new Promise(r => setTimeout(r, 8000));

    await page.evaluate(() => {
        const btn = document.getElementById('download') || document.querySelector('a[href*="/media/assets/"]');
        if (btn) {
            console.log('Found button, clicking...');
            btn.click();
        }
    });

    console.log('⏳ 等待 15 秒供大文件完全下载落盘...');
    await new Promise(r => setTimeout(r, 15000));

    await browser.close();
    console.log('🎉 欧洲部队下载流程结束！');
}

main().catch(console.error);
