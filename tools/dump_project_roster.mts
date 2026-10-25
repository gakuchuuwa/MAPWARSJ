import { CITIES_V2 } from '../src/data/cities_v2';
import { FACTION_GENERALS } from '../src/data/FactionGenerals';
import { GENERAL_LIFE_YEARS } from '../src/data/GeneralLifeYears';
import * as fs from 'fs';

const cities = CITIES_V2.map(c => ({
    id: c.id,
    name: c.name,
    type: c.type,
    buildingStyle: c.buildingStyle,
    lat: c.lat,
    lng: c.lng,
    factionId: c.factionId,
    note: c.note || ''
}));

const generals: any[] = [];
for (const [fid, entry] of Object.entries(FACTION_GENERALS as any)) {
    for (const g of (Array.isArray(entry) ? entry : [entry]) as any[]) {
        const gid = g.generalId;
        const ly = (GENERAL_LIFE_YEARS as any)[gid] || {};
        generals.push({
            id: gid,
            name: g.generalName,
            factionId: g.factionId ?? fid,
            cityId: g.cityId,
            birthYear: ly.birthYear,
            deathYear: ly.deathYear,
            appearYear: ly.appearYear
        });
    }
}

fs.writeFileSync('scratch/project_cities.json', JSON.stringify(cities, null, 2), 'utf-8');
fs.writeFileSync('scratch/project_generals.json', JSON.stringify(generals, null, 2), 'utf-8');
console.log(`Successfully exported ${cities.length} cities and ${generals.length} generals to scratch/*.json!`);
