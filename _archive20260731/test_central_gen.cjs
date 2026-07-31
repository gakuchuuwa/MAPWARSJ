const fs = require('fs');
const lines = fs.readFileSync('c:/MAPWARSJ/src/data/CentralExpeditionLegions.ts', 'utf8').split('\n');
const generalsText = fs.readFileSync('c:/MAPWARSJ/src/data/FactionGenerals.ts', 'utf8');
const factionsText = fs.readFileSync('c:/MAPWARSJ/src/data/factions.ts', 'utf8');

lines.forEach(l => {
    const m = l.match(/([a-zA-Z0-9_]+):\s*\{\s*name:\s*'([^']+)'/);
    if(m){
        const fId = m[1];
        const lName = m[2];
        const gRegex = new RegExp(`\\b${fId}:\\s*\\{[^}]*generalName:\\s*'([^']+)'`);
        const gMatch = generalsText.match(gRegex);
        const fRegex = new RegExp(`id:\\s*'${fId}'.*?name:\\s*'([^']+)'`);
        const fMatch = factionsText.match(fRegex);
        console.log(`${fId} (${fMatch?fMatch[1]:'Unknown'}) - Elite: ${lName} - General: ${gMatch?gMatch[1]:'无'}`);
    }
});
