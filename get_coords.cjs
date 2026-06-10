const fs = require('fs');

const cityContent = fs.readFileSync('./src/data/cities_v2.ts', 'utf-8');
const targets = ['归化', '扬州'];

targets.forEach(t => {
    const match = cityContent.match(new RegExp(`name:\\s*'${t}'.*?lat:\\s*([\\d.]+).*?lng:\\s*([\\d.]+)`));
    if (match) {
        console.log(`${t}: lat = ${match[1]}, lng = ${match[2]}`);
    } else {
        const blockMatch = cityContent.match(new RegExp(`name:\\s*'${t}'[\\s\\S]*?}`));
        if (blockMatch) {
            const latM = blockMatch[0].match(/lat:\s*([\d.]+)/);
            const lngM = blockMatch[0].match(/lng:\s*([\d.]+)/);
            if (latM && lngM) {
                console.log(`${t}: lat = ${latM[1]}, lng = ${lngM[1]}`);
            } else {
                console.log(`${t}: coordinates not found in block.`);
            }
        } else {
            console.log(`${t} not found.`);
        }
    }
});
