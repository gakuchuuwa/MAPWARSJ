const fs = require('fs');

const generalsText = fs.readFileSync('c:/MAPWARSJ/src/data/FactionGenerals.ts', 'utf8');

const regex = /generalName:\s*['"]([^'"]+)['"]/g;
let match;
const names = {};

while ((match = regex.exec(generalsText)) !== null) {
    const name = match[1];
    if (names[name]) {
        names[name]++;
    } else {
        names[name] = 1;
    }
}

for (const name in names) {
    if (names[name] > 1) {
        console.log(`Duplicate general name: ${name} (${names[name]} times)`);
    }
}
