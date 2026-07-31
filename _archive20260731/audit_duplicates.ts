import { cities_v2 } from './src/data/cities_v2.ts';
import { factions } from './src/data/factions.ts';
import { CityAssetManager } from './src/assets/CityAssetManager.ts';
import { SANDBOX_DISPLAY_NAMES } from './src/data/SandboxDisplayNames.ts';
import { northExpeditionLegions } from './src/data/NorthExpeditionLegions.ts';
import { centralExpeditionLegions } from './src/data/CentralExpeditionLegions.ts';
import { jiangnanExpeditionLegions } from './src/data/JiangnanExpeditionLegions.ts';
import { bashuExpeditionLegions } from './src/data/BashuExpeditionLegions.ts';
import { lingnanExpeditionLegions } from './src/data/LingnanExpeditionLegions.ts';
import { northeastExpeditionLegions } from './src/data/NortheastExpeditionLegions.ts';
import { hexiExpeditionLegions } from './src/data/HexiExpeditionLegions.ts';
import { tibetExpeditionLegions } from './src/data/TibetExpeditionLegions.ts';
import { steppeExpeditionLegions } from './src/data/SteppeExpeditionLegions.ts';
import { dianqianExpeditionLegions } from './src/data/DianQianExpeditionLegions.ts';

const allLegions = {
    ...northExpeditionLegions,
    ...centralExpeditionLegions,
    ...jiangnanExpeditionLegions,
    ...bashuExpeditionLegions,
    ...lingnanExpeditionLegions,
    ...northeastExpeditionLegions,
    ...hexiExpeditionLegions,
    ...tibetExpeditionLegions,
    ...steppeExpeditionLegions,
    ...dianqianExpeditionLegions
};

const factionMap = {};
factions.forEach(f => factionMap[f.id] = f.name);

const conflicts = [];
const cityNames = new Set();
const duplicateCities = new Set();

for (const cityId in cities_v2) {
    const city = cities_v2[cityId];
    if (cityNames.has(city.name)) {
        duplicateCities.add(city.name);
    }
    cityNames.add(city.name);
    
    if (city.factionId === 'panjun' || !city.factionId) continue;
    
    const factionName = factionMap[city.factionId] || '';
    const flagName = CityAssetManager.factionFlagMap[city.factionId] || SANDBOX_DISPLAY_NAMES[city.factionId] || '';
    const legionName = allLegions[city.factionId]?.name || '';
    
    if (city.name === factionName) {
        conflicts.push({ type: 'city_equals_faction', city: city.name, faction: factionName, factionId: city.factionId });
    }
    if (city.name === flagName) {
        conflicts.push({ type: 'city_equals_flag', city: city.name, flag: flagName, factionId: city.factionId });
    }
    if (city.name === legionName) {
        conflicts.push({ type: 'city_equals_legion', city: city.name, legion: legionName, factionId: city.factionId });
    }
    if (flagName === legionName && flagName !== '') {
        conflicts.push({ type: 'flag_equals_legion', flag: flagName, legion: legionName, factionId: city.factionId });
    }
}

console.log(JSON.stringify({ conflicts, duplicateCities: Array.from(duplicateCities) }, null, 2));
