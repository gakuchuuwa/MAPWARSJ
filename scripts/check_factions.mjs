import fs from 'fs';
const factions = fs.readFileSync('src/data/factions.ts', 'utf8');
const match = factions.match(/export const FACTIONS: Faction\[\] = \[([\s\S]*?)\];/);
if (match) {
    const lines = match[1].split('\n');
    const keys = new Set();
    for (const line of lines) {
        const idMatch = line.match(/id:\s*['"]([^'"]+)['"]/);
        if (idMatch) {
            if (keys.has(idMatch[1])) {
                console.log('Duplicate faction found: ' + idMatch[1]);
            }
            keys.add(idMatch[1]);
        }
    }
}
