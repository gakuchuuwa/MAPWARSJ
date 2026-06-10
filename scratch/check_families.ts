import { FACTIONS } from '../src/data/factions';

// Check if these family-name flags are available
const flags = ['高', '司马', '冉', '奢', '糜', '李', '段', '谯', '枚', '步'];
flags.forEach(flag => {
    const match = FACTIONS.find(x => x.name === flag);
    console.log(flag, ':', match ? `EXISTS (${match.id})` : 'Available');
});
