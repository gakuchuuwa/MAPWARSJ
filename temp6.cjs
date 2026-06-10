const fs = require('fs');
const lines = fs.readFileSync('src/assets/CityAssetManager.ts', 'utf-8').split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("'陈',") || lines[i].includes("'陈'")) console.log((i+1) + ': ' + lines[i]);
}
