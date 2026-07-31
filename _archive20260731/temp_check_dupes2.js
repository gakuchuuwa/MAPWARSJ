const fs = require('fs');
const content = fs.readFileSync('src/data/factions.ts', 'utf-8');
const groups = {};
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/id:\s*'([^']+)',\s*name:\s*'([^']+)'/);
    if (m) {
        const id = m[1], name = m[2];
        if (!groups[name]) groups[name] = [];
        groups[name].push({id, line: i+1});
    }
}
for (const [name, list] of Object.entries(groups)) {
    if (list.length > 1) {
        console.log(name + ' x' + list.length);
        list.forEach(x => console.log('   ' + x.id + ' (line ' + x.line + ')'));
    }
}
