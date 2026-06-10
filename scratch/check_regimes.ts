import { CITIES_V2 } from '../src/data/cities_v2';
import { FACTIONS } from '../src/data/factions';

const unflagged = CITIES_V2.filter(c => 
    (!c.factionId || c.factionId === 'panjun' || c.factionId.includes('placeholder')) && 
    c.type !== 'pass'
);
console.log('Remaining Unflagged Cities:', unflagged.length);
console.log(unflagged.map(c => c.name).join(', '));

const checkFlags = ['勃律', '且末', '普兰', '尉头', '高句丽', '小勃律', '大勃律', '党项', '宕昌', '武都', '白马', '仇池', '西番'];
checkFlags.forEach(flag => {
    const match = FACTIONS.find(x => x.name === flag);
    console.log(flag, ':', match ? 'EXISTS (' + match.id + ')' : 'Available');
});
