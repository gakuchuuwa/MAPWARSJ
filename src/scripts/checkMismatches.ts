import * as fs from 'fs';
import { CITIES_V2 } from '../data/cities_v2';

const gameAppSrc = fs.readFileSync('c:/MAPWARSJ/src/app/GameApp.ts', 'utf8');
const capitalsMatch = [...gameAppSrc.matchAll(/'([^']+)':\s*'([^']+)'/g)];
const capitals = capitalsMatch.filter(m => m[1] !== 'panjun').map(m => ({ factionId: m[1], cityId: m[2] }));

const mismatches: string[] = [];
const cityFactionMap: Record<string, string> = {};
CITIES_V2.forEach((c: any) => { cityFactionMap[c.id] = c.factionId; });

capitals.forEach(cap => {
    if (cityFactionMap[cap.cityId] !== cap.factionId) {
        mismatches.push(cap.cityId + ': STARTING_CAPITALS has ' + cap.factionId + ', cities_v2 has ' + cityFactionMap[cap.cityId]);
    }
});
console.log('--- START MISMATCHES ---');
console.log(mismatches.join('\n'));
console.log('--- END MISMATCHES ---');
