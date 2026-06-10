import { FACTIONS } from '../src/data/factions';

const flags = ['丁零', '葛逻禄', '沙陀', '冯', '高凉', '扯勒', '芒部', '象雄', '婼羌', '青羌', '昭武'];
flags.forEach(flag => {
    const match = FACTIONS.find(x => x.name === flag);
    console.log(flag, ':', match ? 'EXISTS (' + match.id + ')' : 'Available');
});
