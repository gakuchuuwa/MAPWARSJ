import { FACTIONS } from '../src/data/factions';
import { CITIES_V2 } from '../src/data/cities_v2';
import { SANDBOX_DISPLAY_NAMES } from '../src/data/SandboxDisplayNames';

// Show details for each duplicate pair
const dupes = [
    ['dian', 'dianguo'],
    ['ming_d', 'daming'],
    ['li_lx_d', 'lishi'],
    ['peng_d', 'pengshi'],
    ['yanqi', 'long'],
    ['fangla', 'fang_guozhen'],
    ['yuchi', 'yutian'],
    ['li_s', 'liguo'],
    ['gar_kham', 'kangba'],
];

dupes.forEach(([a, b]) => {
    const fa = FACTIONS.find(f => f.id === a);
    const fb = FACTIONS.find(f => f.id === b);
    const ca = CITIES_V2.find(c => c.factionId === a);
    const cb = CITIES_V2.find(c => c.factionId === b);
    const sa = SANDBOX_DISPLAY_NAMES[a];
    const sb = SANDBOX_DISPLAY_NAMES[b];
    console.log(`--- ${fa?.name} ---`);
    console.log(`  ${a}: faction="${fa?.name}" sandbox="${sa}" city="${ca?.name}"`);
    console.log(`  ${b}: faction="${fb?.name}" sandbox="${sb}" city="${cb?.name}"`);
});
