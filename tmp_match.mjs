import fs from 'fs';

const report = JSON.parse(fs.readFileSync('c:/MAPWARSJ/scripts/audit-report.json', 'utf8'));
const missingCityFactions = report.issues.capitalMissingCity.map(x => x.factionId).concat(report.issues.factionMissingCapital.map(x => x.factionId));

const content = fs.readFileSync('c:/MAPWARSJ/src/data/cities_v2.ts', 'utf-8');
const blockRegex = /\{([^}]+)\}/g;
let bMatch;
const panjunCities = [];

while ((bMatch = blockRegex.exec(content)) !== null) {
    const block = bMatch[1];
    if (block.includes('factionId:') && block.includes('lat:') && block.includes('lng:')) {
        const idM = /id:\s*'([^']+)'/.exec(block);
        const nameM = /name:\s*'([^']+)'/.exec(block);
        const factionM = /factionId:\s*'([^']+)'/.exec(block);
        
        if (idM && factionM && factionM[1] === 'panjun') {
            panjunCities.push({ id: idM[1], name: nameM ? nameM[1] : idM[1] });
        }
    }
}

console.log('Homeless Factions:', missingCityFactions.length);
console.log('Panjun Cities:', panjunCities.length);

const factionContent = fs.readFileSync('c:/MAPWARSJ/src/data/factions.ts', 'utf-8');
const homelessDetails = [];
missingCityFactions.forEach(fId => {
    // A simpler way without weird regex escaping issues
    const lines = factionContent.split('\n');
    let found = false;
    for (let line of lines) {
        if (line.includes(`id: '${fId}'`)) {
            const nameM = /name:\s*'([^']+)'/.exec(line);
            // look ahead for comment in the same line or next line
            let comment = '';
            if (line.includes('//')) {
                comment = line.split('//')[1].trim();
            } else {
                const nextLine = lines[lines.indexOf(line) + 1] || '';
                if (nextLine.includes('//')) {
                    comment = nextLine.split('//')[1].trim();
                }
            }
            homelessDetails.push({ id: fId, name: nameM ? nameM[1] : 'Unknown', desc: comment });
            found = true;
            break;
        }
    }
    if (!found) {
        homelessDetails.push({ id: fId, name: 'Unknown', desc: 'No description' });
    }
});

console.log('\n--- Homeless Factions ---');
homelessDetails.forEach(f => console.log(`${f.id} (${f.name}): ${f.desc}`));

console.log('\n--- Panjun Cities ---');
panjunCities.forEach(c => console.log(`${c.id}: ${c.name}`));
