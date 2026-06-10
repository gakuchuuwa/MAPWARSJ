import { CITIES_V2 } from '../src/data/cities_v2';

const unflagged = CITIES_V2.filter(c => 
    (!c.factionId || c.factionId === 'panjun' || c.factionId.includes('placeholder')) && 
    c.type !== 'pass'
);
console.log(`剩余无旗号小城：${unflagged.length} 座`);
unflagged.forEach(c => console.log(`- ${c.name} (${c.type})`));
