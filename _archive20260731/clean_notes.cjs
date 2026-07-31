const fs = require('fs');
let c = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');

const anchors = ['肤施', '归化城', '襄平', '威海卫', '扬州', '汉中', '天水'];
for (const a of anchors) {
    const re = new RegExp(`note:\\s*'【界城】${a}作为区域核心边界点',\\s*([^}]*?)note:\\s*'([^']+)'`, 'g');
    c = c.replace(re, (match, middle, oldNote) => {
        return `${middle}note: '【界城】${oldNote}'`;
    });
}
fs.writeFileSync('src/data/cities_v2.ts', c);
