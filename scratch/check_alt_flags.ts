import { FACTIONS } from '../src/data/factions';

const flags = ['薛延陀', '冉駹', '青羌', '白马', '冼', '高车', '昭武', '宁远'];
flags.forEach(flag => {
    const match = FACTIONS.find(x => x.name === flag);
    console.log(flag, ':', match ? 'EXISTS (' + match.id + ')' : 'Available');
});
