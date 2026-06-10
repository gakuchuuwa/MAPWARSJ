import { CITIES_V2 } from '../src/data/cities_v2';
import { FACTIONS } from '../src/data/factions';
import * as fs from 'fs';

const cityByFaction = new Map<string, typeof CITIES_V2>();
for (const c of CITIES_V2) {
    if (!cityByFaction.has(c.factionId)) cityByFaction.set(c.factionId, []);
    cityByFaction.get(c.factionId)!.push(c);
}

const renames: { id: string, oldName: string, newName: string, reason: string, cities: string[] }[] = [];

for (const f of FACTIONS) {
    let name = f.name;
    const original = name;
    let reason = '';
    
    // Explicit user rules
    let stripped = name.replace(/氏$/, '').replace(/族$/, '').replace(/人$/, '');
    if (stripped.length === 2 && stripped.endsWith('国')) stripped = stripped[0];
    if (stripped === '大明国') stripped = '大明';
    if (stripped === '大南国') stripped = '大南';
    if (stripped === '广南国') stripped = '广南';

    if (stripped !== name) {
        name = stripped;
        reason = 'Trimmed suffixes (氏/族/人/国)';
    }

    const cities = cityByFaction.get(f.id) || [];
    let overlap = false;
    let overlapCity = '';
    
    for (const c of cities) {
        let hasSubstring = false;
        // Check for 2+ char substring match
        for (let i = 0; i < name.length - 1; i++) {
            const sub = name.substring(i, i + 2);
            if (c.name.includes(sub)) {
                hasSubstring = true;
                break;
            }
        }
        
        // If flag is 1 char, we still don't count it as overlap unless user explicitly wants 1-char overlap checked. 
        // But the user just said: "汉可以用汉中，这个不叫冲突。焉耆和焉耆城，这种叫冲突，或者你可以理解为两个字重复算据点和旗号冲突。"
        // So ONLY 2+ char substring overlaps are conflicts!
        
        if (hasSubstring) {
            overlap = true;
            overlapCity = c.name;
            break;
        }
    }

    if (overlap) {
        reason += (reason ? ' | ' : '') + `2+ CHAR SUBSTRING CONFLICT with city ${overlapCity}`;
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

fs.writeFileSync('c:\\MAPWARSJ\\scratch\\strict_renames.json', JSON.stringify(renames, null, 2));
console.log(`Generated ${renames.length} strict renames.`);
