import puppeteer from 'puppeteer';

(async () => {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
    page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

    console.log('Navigating to http://localhost:5173 ...');
    try {
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 10000 });
        console.log('Page loaded successfully!');
    } catch (e) {
        console.error('Navigation failed:', e);
    }
    
    await browser.close();
})();
