import { CITIES_V2 } from '../src/data/cities_v2';
import { FACTIONS } from '../src/data/factions';
import * as fs from 'fs';

const rule1Violations: any[] = [];
const multiChars: any[] = [];
const flagUsage = new Map<string, string[]>();

for (const c of CITIES_V2) {
    const f = FACTIONS.find(x => x.id === c.factionId);
    if (!f) continue;

    const cityName = c.name;
    const flagName = f.name;
    
    if (!flagUsage.has(flagName)) flagUsage.set(flagName, []);
    flagUsage.get(flagName)!.push(cityName);

    // Rule 1: Shared characters
    let shared = false;
    for (const char of flagName) {
        if (cityName.includes(char)) {
            shared = true;
            break;
        }
    }
    if (shared) {
        rule1Violations.push({ city: cityName, factionId: f.id, flagName: flagName });
    }
}

for (const f of FACTIONS) {
    if (f.name.length > 1) {
        multiChars.push({ factionId: f.id, flagName: f.name, usedBy: flagUsage.get(f.name) || [] });
    }
}

fs.writeFileSync('c:\\MAPWARSJ\\scratch\\naming_issues.json', JSON.stringify({
    rule1Violations,
    multiChars
}, null, 2));
console.log('Issues written to naming_issues.json');
