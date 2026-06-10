import fs from 'fs';
let factionsStr = fs.readFileSync('src/data/factions.ts', 'utf8');
factionsStr = factionsStr.replace(/(export const FACTIONS: Faction\[\] = \[)/, "$1\n    { id: 'dongshengwei', name: '东胜卫' },\n    { id: 'dizhou', name: '棣州' },");
fs.writeFileSync('src/data/factions.ts', factionsStr);
console.log('Fixed factions.ts');
