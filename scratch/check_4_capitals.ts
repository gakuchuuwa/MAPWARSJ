import { FACTIONS } from '../src/data/factions';
import { CITIES_V2 } from '../src/data/cities_v2';

const flags = ['且末', '普兰', '尉头', '宕昌'];
flags.forEach(flag => {
    const fMatch = FACTIONS.find(x => x.name === flag);
    console.log('Flag:', flag, '->', fMatch ? 'EXISTS in Factions' : 'Available');
});

const names = ['播仙', '科迦', '阿合奇', '迭州'];
names.forEach(name => {
    const cMatch = CITIES_V2.find(x => x.name === name);
    console.log('City:', name, '->', cMatch ? 'EXISTS in Cities' : 'Available');
});
