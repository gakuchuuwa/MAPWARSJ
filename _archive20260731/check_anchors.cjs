const fs = require('fs');

const cityContent = fs.readFileSync('./src/data/cities_v2.ts', 'utf-8');
const targets = ['延安', '归化城', '襄平', '威海卫', '扬州', '汉中', '天水'];

targets.forEach(t => {
    const blockMatch = cityContent.match(new RegExp(`name:\\s*'${t}'[\\s\\S]*?}`));
    if (blockMatch) {
        const latM = blockMatch[0].match(/lat:\s*([\d.]+)/);
        const lngM = blockMatch[0].match(/lng:\s*([\d.]+)/);
        const typeM = blockMatch[0].match(/type:\s*'([^']+)'/);
        console.log(`${t}: lat = ${latM ? latM[1] : 'N/A'}, lng = ${lngM ? lngM[1] : 'N/A'}, type = ${typeM ? typeM[1] : 'N/A'}`);
    } else {
        console.log(`${t} not found.`);
    }
});
