import { CITIES_V2 } from '../src/data/cities_v2';
import { FACTIONS } from '../src/data/factions';
import * as fs from 'fs';

const noFlagCities = CITIES_V2.filter(c => !c.factionId || c.factionId === 'panjun' || c.factionId.includes('placeholder'));

console.log(`Found ${noFlagCities.length} cities without a distinct flag.`);

const output = noFlagCities.map(c => `- ${c.name} (lat: ${c.lat}, lng: ${c.lng})`).join('\n');
fs.writeFileSync('c:\\MAPWARSJ\\scratch\\unflagged_cities.txt', output);
