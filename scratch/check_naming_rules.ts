import { CITIES_V2 } from '../src/data/cities_v2';
import { FACTIONS } from '../src/data/factions';

const violations: string[] = [];
const multiChars: string[] = [];

for (const c of CITIES_V2) {
    const f = FACTIONS.find(x => x.id === c.factionId);
    if (!f) continue;

    const cityName = c.name;
    const flagName = f.name;

    // Check Rule 1: Common characters
    let hasCommon = false;
    for (const char of flagName) {
        if (cityName.includes(char)) {
            hasCommon = true;
            break;
        }
    }

    if (hasCommon) {
        violations.push(`City: ${cityName} | Flag: ${flagName} (Shares characters!)`);
    }

    // Check Rule 2: Multi-character flags
    if (flagName.length > 1) {
        multiChars.push(`City: ${cityName} | Flag: ${flagName}`);
    }
}

console.log('--- 规则1违规：据点名与旗号包含相同字 ---');
violations.forEach(v => console.log(v));

console.log('\n--- 规则2核查：多字旗号（需精简） ---');
multiChars.forEach(m => console.log(m));
