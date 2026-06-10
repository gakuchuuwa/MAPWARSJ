import fs from 'fs';
const citiesStr = fs.readFileSync('src/data/cities_v2.ts', 'utf8');

// Find all cities with type: 'pass'
const cityRegex = /\{\s*id:\s*['"]([^'"]+)['"][^}]*name:\s*['"]([^'"]+)['"][^}]*factionId:\s*['"]([^'"]+)['"][^}]*type:\s*['"]pass['"][^}]*\}/g;
let match;
let notPanjun = [];
while ((match = cityRegex.exec(citiesStr)) !== null) {
    if (match[3] !== 'panjun') {
        notPanjun.push(`${match[2]} (${match[1]}) - Faction: ${match[3]}`);
    }
}
console.log('Passes that are NOT panjun:');
console.log(notPanjun.join('\n'));

// Also let's run the audit programmatically
import { execSync } from 'child_process';
try {
    console.log('\nRunning npm run audit...');
    const auditOut = execSync('npm run audit', { encoding: 'utf8' });
    console.log(auditOut);
} catch (e) {
    console.log('Audit failed!');
    console.log(e.stdout);
}

try {
    console.log('\nRunning npm run build...');
    const buildOut = execSync('npm run build', { encoding: 'utf8' });
    console.log('Build succeeded.');
} catch(e) {
    console.log('Build failed!');
    console.log(e.stdout);
}
