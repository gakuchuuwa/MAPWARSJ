import * as fs from 'fs';
const txt = fs.readFileSync('./src/data/factions.ts', 'utf8');
['大越', '党项', '安南', '勿吉'].forEach(f => {
    const r = new RegExp(`\\{\\s*id:\\s*['"]([^'"]+)['"],\\s*name:\\s*['"]` + f + `['"]`);
    const m = txt.match(r);
    console.log(f + ': ' + (m ? m[1] : 'NOT FOUND'));
});
