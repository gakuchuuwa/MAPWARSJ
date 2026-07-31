import * as fs from 'fs';
import * as path from 'path';

// read cities
const citiesStr = fs.readFileSync('./src/data/cities_v2.ts', 'utf-8');
const cityRegex = /id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*(?:factionId:\s*'([^']+)')?/g;

const factionsStr = fs.readFileSync('./src/data/factions.ts', 'utf-8');
const factionRegex = /id:\s*'([^']+)',\s*name:\s*'([^']+)'/g;

const flagsStr = fs.readFileSync('./src/data/SandboxDisplayNames.ts', 'utf-8');
const flagRegex = /'([^']+)':\s*'([^']+)'/g;

const factionMap = {};
let match;
while ((match = factionRegex.exec(factionsStr)) !== null) {
    factionMap[match[1]] = match[2];
}

const flagMap = {};
while ((match = flagRegex.exec(flagsStr)) !== null) {
    flagMap[match[1]] = match[2];
}

const cityNames = new Set();
const duplicateCities = new Set();
const conflicts = [];

while ((match = cityRegex.exec(citiesStr)) !== null) {
    const cityId = match[1];
    const cityName = match[2];
    const factionId = match[3];

    if (cityNames.has(cityName)) {
        duplicateCities.add(cityName);
    }
    cityNames.add(cityName);

    if (!factionId || factionId === 'panjun') continue;

    const fName = factionMap[factionId];
    const flName = flagMap[factionId];

    if (fName && cityName === fName) {
        conflicts.push(`[势力和据点重名] 据点：${cityName}，势力：${fName} (factionId: ${factionId})`);
    }
    if (flName && cityName === flName) {
        conflicts.push(`[旗号和据点重名] 据点：${cityName}，旗号：${flName} (factionId: ${factionId})`);
    }
}

console.log("=== 全局据点重复 ===");
console.log(Array.from(duplicateCities).join(", "));
console.log("\n=== 势力/旗号与据点重名 ===");
conflicts.forEach(c => console.log(c));
