import { CITIES_V2 } from '../src/data/cities_v2';

const noFlagCities = CITIES_V2.filter(c => 
    (!c.factionId || c.factionId === 'panjun' || c.factionId.includes('placeholder')) && 
    c.type !== 'pass'
);

console.log(`Found ${noFlagCities.length} non-pass cities without a distinct flag.`);
noFlagCities.forEach(c => console.log(`- ${c.name} (${c.type})`));
