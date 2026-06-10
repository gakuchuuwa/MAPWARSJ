import * as fs from 'fs';
const txt = fs.readFileSync('./src/data/factions.ts', 'utf8');
const r = /\{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]康居['"]/g;
let m;
while(m = r.exec(txt)) console.log('Faction ID: ' + m[1]);
