const fs = require('fs');
const content = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');
const lines = content.split('\n');
for (const line of lines) {
    if (line.includes("factionId: 'panjun'") && !line.includes("type: 'pass'")) {
        console.log(line.trim());
    }
}
