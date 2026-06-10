import * as fs from 'fs';
const t = fs.readFileSync('./src/data/factions.ts', 'utf8');
const r = /\{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]韩['"]/g;
let m;
while(m = r.exec(t)) console.log(m[1]);
