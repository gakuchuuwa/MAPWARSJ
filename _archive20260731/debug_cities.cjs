const fs = require('fs');
let c = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');
const lines = c.split('\n');

for (let i = 688; i < 696; i++) {
    console.log(i + ": " + lines[i]);
}
