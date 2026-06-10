import fs from 'fs';
let code = fs.readFileSync('src/data/cities_v2.ts', 'utf8');
code = code.replace(/export\s+const\s+CITIES_V2/g, 'const CITIES_V2');
code = code.replace(/export /g, '');
code = code.replace(/import .*;/g, '');
code = code + '\nconsole.log(CITIES_V2.filter(c => c.factionId === "panjun" || c.factionId === "unknown" || !c.factionId).map(c => c.name).join(", "));\nconsole.log("\\nTotal Count:", CITIES_V2.filter(c => c.factionId === "panjun" || c.factionId === "unknown" || !c.factionId).length);';
fs.writeFileSync('scripts/tmp.mjs', code);
console.log('Created scripts/tmp.mjs');
