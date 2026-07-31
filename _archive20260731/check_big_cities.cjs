const fs = require('fs');
const txt = fs.readFileSync('src/data/cities_v2.ts.bak', 'utf-8');
const lines = txt.split('\n');
const bigs = lines.filter(l => l.includes("type: 'big_city'"));
console.log('Big cities count:', bigs.length);
bigs.forEach(l => {
  console.log(l.trim());
});
