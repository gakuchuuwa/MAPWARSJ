const fs = require('fs');
const txt = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');
const lines = txt.split('\n');
const bigs = lines.filter(l => l.includes("type: 'big_city'"));
console.log('Current Big cities count:', bigs.length);
bigs.forEach(l => {
  const match = l.match(/name:\s*'([^']+)'/);
  if (match) console.log(match[1]);
});
