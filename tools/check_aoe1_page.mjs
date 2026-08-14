import puppeteer from 'puppeteer-core';

async function main() {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: false
    });
    const page = await browser.newPage();
    await page.goto('https://www.spriters-resource.com/pc_computer/ageofempiresdefinitiveedition/', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 4000));

    const assets = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="/asset/"]'));
        return links.map(a => {
            const header = a.querySelector('.iconheader');
            return {
                title: header ? header.innerText.trim() : a.innerText.trim(),
                href: a.href
            };
        });
    });

    console.log('=== 《帝国时代1：决定版》页面所有资产列表 ===');
    console.log(assets);
    await browser.close();
}

main().catch(console.error);
