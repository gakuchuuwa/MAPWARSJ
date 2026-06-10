const fs = require('fs');
const content = fs.readFileSync('src/systems/RegionSystem.ts', 'utf-8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes("id: 'LINGNAN'"));
if (start !== -1) {
    console.log(lines.slice(start - 2, start + 30).join('\n'));
}
