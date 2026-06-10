import { FACTIONS } from '../src/data/factions';

const flags = ['突厥', '羌', '乌蛮', '客家', '俚', '敕勒', '象雄', '婼羌', '粟特'];
flags.forEach(flag => {
    const match = FACTIONS.find(x => x.name === flag);
    console.log(flag, ':', match ? 'EXISTS (' + match.id + ')' : 'Available');
});
