import { CITIES_V2 } from './src/data/cities_v2.ts';
import { factions } from './src/data/factions.ts';
import { SANDBOX_DISPLAY_NAMES } from './src/data/SandboxDisplayNames.ts';
import { FactionGenerals } from './src/data/FactionGenerals.ts';
import { CentralExpeditionLegions } from './src/data/CentralExpeditionLegions.ts';
import { NorthExpeditionLegions } from './src/data/NorthExpeditionLegions.ts';
import { HexiExpeditionLegions } from './src/data/HexiExpeditionLegions.ts';
import { BashuExpeditionLegions } from './src/data/BashuExpeditionLegions.ts';
import { LingnanExpeditionLegions } from './src/data/LingnanExpeditionLegions.ts';
import { NortheastExpeditionLegions } from './src/data/NortheastExpeditionLegions.ts';
import { WesternExpeditionLegions } from './src/data/WesternExpeditionLegions.ts';
import { CentralAsiaExpeditionLegions } from './src/data/CentralAsiaExpeditionLegions.ts';
import { JapanExpeditionLegions } from './src/data/JapanExpeditionLegions.ts';
import { KoreaExpeditionLegions } from './src/data/KoreaExpeditionLegions.ts';
import { IndochinaExpeditionLegions } from './src/data/IndochinaExpeditionLegions.ts';

const AllLegions = {
    ...CentralExpeditionLegions,
    ...NorthExpeditionLegions,
    ...HexiExpeditionLegions,
    ...BashuExpeditionLegions,
    ...LingnanExpeditionLegions,
    ...NortheastExpeditionLegions,
    ...WesternExpeditionLegions,
    ...CentralAsiaExpeditionLegions,
    ...JapanExpeditionLegions,
    ...KoreaExpeditionLegions,
    ...IndochinaExpeditionLegions
};

const bigCities = CITIES_V2.filter(c => c.type === 'big_city');
const report = bigCities.map(c => {
    const faction = factions.find(f => f.id === c.factionId);
    const flag = SANDBOX_DISPLAY_NAMES[c.factionId] || '无';
    const gens = FactionGenerals[c.factionId] ? Object.keys(FactionGenerals[c.factionId]).length : 0;
    const legion = AllLegions[c.factionId] ? AllLegions[c.factionId].name : '无';
    return `${c.name}(${c.factionId}) - 势力:${faction?faction.name:'无'} | 旗:${flag} | 将:${gens} | 精锐:${legion}`;
});

console.log(report.join('\n'));
