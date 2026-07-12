import { TACTICAL_SKILL_ENTRIES_V1 } from '../src/data/TacticalSkillCatalog';
import fs from 'fs';
const skills = TACTICAL_SKILL_ENTRIES_V1.map(s => s.id + ' | ' + s.displayName + ' | ' + s.note);
fs.writeFileSync('tools/all_skills.txt', skills.join('\n'));
