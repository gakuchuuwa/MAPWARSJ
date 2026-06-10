const fs = require('fs');
const f = fs.readFileSync('src/data/factions.ts', 'utf-8');
const search = ['保大', '白狄', '赫连', '延州', '大夏'];
search.forEach(s => {
    if (f.includes(`name: '${s}'`)) {
        console.log(`${s} EXISTS.`);
    } else {
        console.log(`${s} available.`);
    }
});
