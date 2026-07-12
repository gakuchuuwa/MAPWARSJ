import { TACTICAL_SKILL_ENTRIES_V1, getTacticalTriClass } from '../src/data/TacticalSkillCatalog';

const adv = TACTICAL_SKILL_ENTRIES_V1.filter(s => getTacticalTriClass(s) === 'advantage');
const bal = TACTICAL_SKILL_ENTRIES_V1.filter(s => getTacticalTriClass(s) === 'balance');
const dis = TACTICAL_SKILL_ENTRIES_V1.filter(s => getTacticalTriClass(s) === 'disadvantage');

console.log('--- LI JING (Balance) ---');
bal.filter(s => s.displayName.includes('变') || s.displayName.includes('奇') || s.displayName.includes('机') || s.displayName.includes('胜')).slice(0, 15).forEach(s => console.log(s.id, s.displayName));

console.log('--- XIE XUAN (Disadv) ---');
dis.filter(s => s.displayName.includes('溃') || s.displayName.includes('退') || s.displayName.includes('死') || s.displayName.includes('反')).slice(0, 15).forEach(s => console.log(s.id, s.displayName));

console.log('--- YUE YI (Adv) ---');
adv.filter(s => s.displayName.includes('阵') || s.displayName.includes('城') || s.displayName.includes('破') || s.displayName.includes('拔')).slice(0, 15).forEach(s => console.log(s.id, s.displayName));
