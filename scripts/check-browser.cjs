
const puppeteer = require("puppeteer");
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on("pageerror", err => {
        console.error("PAGE ERROR:", err.message);
    });
    page.on("console", msg => {
        if (msg.type() === "error") {
            console.error("CONSOLE ERROR:", msg.text());
        }
    });
    await page.goto("http://localhost:5173", { waitUntil: "networkidle0", timeout: 15000 }).catch(e => console.log("Timeout"));
    await browser.close();
})();

