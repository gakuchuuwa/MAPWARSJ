const fs = require('fs');
const citiesContent = fs.readFileSync('./src/data/cities_v2.ts', 'utf-8');
const targets = ['mgar', 'gar_kham', 'dongxian', 'dong'];

targets.forEach(id => {
  console.log(`\n--- Faction: ${id} ---`);
  const lines = citiesContent.split('\n');
  lines.forEach(line => {
    if (line.includes(`factionId: '${id}'`)) {
      const match = line.match(/name:\s*'([^']+)'/);
      if (match) {
        console.log(`City: ${match[1]} (${line.trim()})`);
      }
    }
  });
});
