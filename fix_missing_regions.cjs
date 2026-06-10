const fs = require('fs');
let content = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');

const updates = [
    { name: '加德满都', targetRegion: 'TIBET' },
    { name: '牡丹社', targetRegion: 'LINGNAN' },
    { name: '俱轮泊', targetRegion: 'NORTHEAST' },
    { name: '博尔巴任', targetRegion: 'STEPPE' },
    { name: '乌布萨泊', targetRegion: 'STEPPE' },
    { name: '护密城', targetRegion: 'CENTRAL_ASIA' },
    { name: '也迷里', targetRegion: 'STEPPE' },
    { name: '阿尔泰山黑林', targetRegion: 'STEPPE' },
    { name: '直通', targetRegion: 'DIANQIAN' },
    { name: '龙木错', targetRegion: 'WESTERN' },
    { name: '卡克里克', targetRegion: 'WESTERN' },
    { name: '皋兰', targetRegion: 'HEXI' },
    { name: '石门关', targetRegion: 'BASHU' },
    { name: '色楞格河', targetRegion: 'STEPPE' }
];

for (const update of updates) {
    const regex = new RegExp(`(name:\\s*'${update.name}'[\\s\\S]*?)(troops:)`);
    // If it already has region, replace it
    if (content.match(new RegExp(`name:\\s*'${update.name}'[\\s\\S]*?region:`))) {
        content = content.replace(new RegExp(`(name:\\s*'${update.name}'[\\s\\S]*?region:\\s*')([^']+)(')`), `$1${update.targetRegion}$3`);
    } else {
        // inject region before troops
        content = content.replace(regex, `$1region: '${update.targetRegion}', $2`);
    }
}

fs.writeFileSync('src/data/cities_v2.ts', content, 'utf-8');
console.log('Fixed missing regions!');
