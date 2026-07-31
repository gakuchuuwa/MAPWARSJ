const fs = require('fs');

// Check factions
const factionContent = fs.readFileSync('./src/data/factions.ts', 'utf-8');
const factionLines = factionContent.split('\n');
const factionNames = new Map();
const dupFactions = [];

factionLines.forEach((line, i) => {
  const match = line.match(/id:\s*['"]([^'"]+)['"].*name:\s*['"]([^'"]+)['"]/);
  if (match) {
    const id = match[1];
    const name = match[2];
    if (factionNames.has(name)) {
      dupFactions.push(`旗号[${name}]重复: ${factionNames.get(name)} 和 ${id}`);
    } else {
      factionNames.set(name, id);
    }
  }
});

// Check cities
const cityContent = fs.readFileSync('./src/data/cities_v2.ts', 'utf-8');
const cityNames = new Map();
const dupCities = [];

const blocks = cityContent.split(/id:\s*['"]/);
// skip the first chunk before the first 'id:'
for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const idMatch = block.match(/^([^'"]+)['"]/);
    const nameMatch = block.match(/name:\s*['"]([^'"]+)['"]/);
    
    if (idMatch && nameMatch) {
        const id = idMatch[1];
        const name = nameMatch[1];
        if (cityNames.has(name)) {
            dupCities.push(`据点[${name}]重复: ${cityNames.get(name)} 和 ${id}`);
        } else {
            cityNames.set(name, id);
        }
    }
}

console.log("=== 检查结果 ===");
if (dupFactions.length > 0) {
    console.log("发现旗号重复:");
    dupFactions.forEach(d => console.log(d));
} else {
    console.log("没有发现旗号重复。");
}

if (dupCities.length > 0) {
    console.log("\n发现据点重复:");
    dupCities.forEach(d => console.log(d));
} else {
    console.log("\n没有发现据点重复。");
}
