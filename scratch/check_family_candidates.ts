import { FACTIONS } from '../src/data/factions';
import { CITIES_V2 } from '../src/data/cities_v2';

// The 4 family candidates
const candidates = [
    { city: '景州', flag: '高', reason: '渤海高氏，北齐皇族高欢家族世居地' },
    { city: '夏阳渡', flag: '司马', reason: '司马迁家族世代居于夏阳（韩城）' },
    { city: '朐城', flag: '糜', reason: '糜竺糜芳，东海朐县世代巨商大族' },
    { city: '淮阴', flag: '枚', reason: '枚乘枚皋父子，淮阴本地文豪世族' },
];

candidates.forEach(c => {
    const fMatch = FACTIONS.find(x => x.name === c.flag);
    // Check 2-char conflict with any city name
    const cityConflicts = CITIES_V2.filter(city => {
        if (c.flag.length < 2) return false;
        return city.name.includes(c.flag);
    });
    console.log(`${c.city} -> [${c.flag}]`);
    console.log(`  Flag exists: ${fMatch ? 'YES (' + fMatch.id + ')' : 'NO (Available)'}`);
    console.log(`  2-char city conflicts: ${cityConflicts.length > 0 ? cityConflicts.map(x => x.name).join(', ') : 'NONE'}`);
});
