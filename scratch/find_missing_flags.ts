import { FACTIONS } from '../src/data/factions';
import { CITIES_V2 } from '../src/data/cities_v2';
import { SANDBOX_DISPLAY_NAMES } from '../src/data/SandboxDisplayNames';

// Find all factions that exist in FACTIONS but NOT in SANDBOX_DISPLAY_NAMES
const missing: string[] = [];
const allFactionIds = new Set<string>();

CITIES_V2.forEach(c => {
    if (c.factionId && c.factionId !== 'panjun') {
        allFactionIds.add(c.factionId);
    }
});

allFactionIds.forEach(fid => {
    if (!SANDBOX_DISPLAY_NAMES[fid]) {
        const faction = FACTIONS.find(f => f.id === fid);
        const city = CITIES_V2.find(c => c.factionId === fid);
        missing.push(`${fid} -> ${faction?.name || '???'} (city: ${city?.name || '???'})`);
    }
});

console.log(`Found ${missing.length} factions missing from SandboxDisplayNames:`);
missing.forEach(m => console.log(`  - ${m}`));
