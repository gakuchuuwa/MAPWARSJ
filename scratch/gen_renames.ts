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

// Keep track of which names are taken to avoid duplicates
for (const f of FACTIONS) {
    if (f.name.length === 1) proposedNames.add(f.name);
}

for (const f of FACTIONS) {
    let name = f.name;
    const original = name;
    let reason = '';
    
    // Rule 2: Shorten to 1 character if possible
    if (name.length > 1) {
        let stripped = name
            .replace(/氏|族|人|国|朝|部|军|贼|贼军|政权|汗|卫/g, '')
            .replace(/^(大|前|后|东|西|南|北)/, '');

        if (stripped.length >= 1) {
            name = stripped;
            reason = 'Trimmed suffixes/prefixes';
        }
        
        if (name.length > 1 && original.includes('族')) {
            name = original.replace('族', '');
            reason = 'Removed 族';
        }
        if (name === '僰人') name = '僰';
        if (name === '滇国') name = '滇';
        if (name === '苗族') name = '苗';
    }

    // Rule 1: Check overlap with city names
    const cities = cityByFaction.get(f.id) || [];
    let overlap = false;
    let overlapCity = '';
    
    // First, check if the proposed shortened name overlaps
    for (const c of cities) {
        for (const char of name) {
            if (c.name.includes(char)) {
                overlap = true;
                overlapCity = c.name;
                break;
            }
        }
        if (overlap) break;
    }

    if (overlap) {
        // We have an overlap! Need a manual fallback or special handling.
        // For now, we will flag it for the user to review.
        reason += ` | RULE 1 VIOLATION with city ${overlapCity}`;
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

fs.writeFileSync('c:\\MAPWARSJ\\scratch\\proposed_renames.json', JSON.stringify(renames, null, 2));
console.log(`Generated ${renames.length} proposed renames.`);
