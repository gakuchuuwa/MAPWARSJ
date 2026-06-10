import { CITIES_V2 } from '../src/data/cities_v2';
import { FACTIONS } from '../src/data/factions';
import * as fs from 'fs';

const cityByFaction = new Map<string, typeof CITIES_V2>();
for (const c of CITIES_V2) {
    if (!cityByFaction.has(c.factionId)) cityByFaction.set(c.factionId, []);
    cityByFaction.get(c.factionId)!.push(c);
}

const renames: { id: string, oldName: string, newName: string, reason: string, cities: string[] }[] = [];
const proposedNames = new Set<string>();

// Pass 1: Handle strict suffix removal (氏, 族, 人, 国 - but specifically 滇国->滇, 黎国->黎)
for (const f of FACTIONS) {
    let name = f.name;
    const original = name;
    let reason = '';
    
    // Explicit user rules
    let stripped = name.replace(/氏$/, '').replace(/族$/, '').replace(/人$/, '');
    
    // For '国', only strip if it's like 滇国, 庸国, 黎国 (i.e. name is 2 chars ending in 国)
    if (stripped.length === 2 && stripped.endsWith('国')) {
        stripped = stripped[0];
    }
    
    // The user also mentioned not to change 大明, 大清, 西楚, etc. So we leave prefixes alone.
    // However, what about "大明国"? If it's 3 chars, maybe it should be "大明".
    if (stripped === '大明国') stripped = '大明';
    if (stripped === '大南国') stripped = '大南';
    if (stripped === '广南国') stripped = '广南'; // maybe?

    if (stripped !== name) {
        name = stripped;
        reason = 'Trimmed suffixes (氏/族/人/国)';
    }

    // Rule 1: Check overlap with city names -> Must be >= 2 characters overlapping
    const cities = cityByFaction.get(f.id) || [];
    let overlap = false;
    let overlapCity = '';
    
    for (const c of cities) {
        // Calculate common characters
        let commonCount = 0;
        let cName = c.name;
        for (const char of name) {
            if (cName.includes(char)) {
                commonCount++;
                cName = cName.replace(char, ''); // Avoid double counting same char
            }
        }
        
        if (commonCount >= 2) {
            overlap = true;
            overlapCity = c.name;
            break;
        }
    }

    if (overlap) {
        reason += ` | 2+ CHAR CONFLICT with city ${overlapCity}`;
    }

    if (name !== original || overlap) {
        renames.push({
            id: f.id,
            oldName: original,
            newName: name,
            reason: reason,
            cities: cities.map(c => c.name)
        });
    }
}

fs.writeFileSync('c:\\MAPWARSJ\\scratch\\new_renames.json', JSON.stringify(renames, null, 2));
console.log(`Generated ${renames.length} proposed renames based on NEW rules.`);
