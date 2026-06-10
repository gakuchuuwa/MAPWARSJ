import fs from 'fs';
const factionContent = fs.readFileSync('c:/MAPWARSJ/src/data/factions.ts', 'utf-8');

const queries = ['玉龙杰赤', '黑水', '车师后', '务涂', '婼羌', '且末', '精绝', '丸都', '钓鱼城', '大肚', '西山', '欧雒'];

queries.forEach(q => {
    const lines = factionContent.split('\n');
    lines.forEach((line, i) => {
        if (line.includes(q)) {
            console.log(Match for :  (Line: ));
        }
    });
});
