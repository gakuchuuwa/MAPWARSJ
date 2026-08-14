import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DOWNLOAD_DIR = path.resolve('public/SUCAI/STRONGHOLD_RESOURCES');

async function main() {
    console.log('🚀 启动 Chrome 自动化下载 European Troops 欧洲部队...');
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: false,
        args: ['--no-sandbox', '--disable-blink-features=AutomationControlled']
    });

    const page = (await browser.pages())[0] || await browser.newPage();
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: DOWNLOAD_DIR
    });

    await page.goto('https://www.spriters-resource.com/pc_computer/strongholdcrusader/asset/64404/', { waitUntil: 'domcontentloaded' });

    console.log('⏳ 等待页面完全加载（直到 #download 或 #assetdisplay 出现）...');
    await page.waitForSelector('#download, #assetdisplay, a[href*="/media/assets/"]', { timeout: 60000 });
    console.log('✅ 页面加载成功！正在触发下载...');

    await new Promise(r => setTimeout(r, 2000));
    await page.evaluate(() => {
        const btn = document.querySelector('#download') || document.querySelector('a[href*="/media/assets/"]');
        if (btn) btn.click();
    });

    console.log('⏳ 等待 10 秒写入本地硬盘...');
    await new Promise(r => setTimeout(r, 10000));
    await browser.close();

    console.log('🎉 European Troops 下载完成！当前文件列表:');
    console.log(fs.readdirSync(DOWNLOAD_DIR));
}

main().catch(console.error);
