const fs = require('fs');
const lines = fs.readFileSync('src/assets/CityAssetManager.ts', 'utf-8').split('\n');
let luoCount = 0, chenCount = 0, liuCount = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("'罗',") || lines[i].includes("'罗'")) luoCount++;
  if (lines[i].includes("'陈',") || lines[i].includes("'陈'")) chenCount++;
  if (lines[i].includes("'刘',") || lines[i].includes("'刘'")) liuCount++;
}
console.log('Luo: ' + luoCount + ', Chen: ' + chenCount + ', Liu: ' + liuCount);
