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
    console.log('🚀 正在启动真实 Chrome 窗口（自动通过 5 秒盾并自动下载）...');
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: false, // 真实窗口渲染，秒过 Cloudflare
        defaultViewport: null,
        args: [
            '--no-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--window-size=1200,800'
        ]
    });

    const page = (await browser.pages())[0] || await browser.newPage();

    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: DOWNLOAD_DIR
    });

    for (const target of targetPages) {
        console.log(`\n📥 正在加载页面并自动过盾【${target.name}】...`);
        await page.goto(target.url, { waitUntil: 'domcontentloaded' });

        // 等待过盾和页面元素出现
        console.log(`   ⏳ 等待 Cloudflare 验证通过与页面渲染...`);
        let passed = false;
        for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 1000));
            const title = await page.title();
            if (!title.includes('Just a moment') && !title.includes('Attention Required')) {
                passed = true;
                break;
            }
        }

        if (passed) {
            console.log(`   ✅ 验证已通过！正在点击下载按钮...`);
            await new Promise(r => setTimeout(r, 2000));
            const downloaded = await page.evaluate(() => {
                const btn = document.querySelector('#download') || document.querySelector('a[href*="/media/assets/"]');
                if (btn) {
                    btn.click();
                    return true;
                }
                return false;
            });
            console.log(`   🎯 触发下载状态: ${downloaded}`);
            await new Promise(r => setTimeout(r, 5000));
        } else {
            console.log(`   ⚠️ 页面卡在验证，跳过...`);
        }
    }

    console.log('\n⏳ 等待文件写入完成...');
    await new Promise(r => setTimeout(r, 6000));
    await browser.close();

    console.log('🎉 自动化操作完成！当前本地文件:');
    const files = fs.readdirSync(DOWNLOAD_DIR);
    console.log(files);
}

run().catch(console.error);
