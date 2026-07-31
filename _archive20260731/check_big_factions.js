const fs = require('fs');

const targets = ['tang','shu','wuzhou_d','shang','ming_d','jinling','wuyue','bing','liangzhou','xinluo','tubo','edo','seljuq','siam','chenla','manzhou_d','tiemuer','guangzhou','song','menggu_d'];

const factionsCode = fs.readFileSync('src/data/factions.ts', 'utf8');
const flagsCode = fs.readFileSync('src/data/SandboxDisplayNames.ts', 'utf8');

const results = targets.map(id => {
    const fMatch = factionsCode.match(new RegExp(`id:\\s*['"]${id}['"].*?name:\\s*['"](.*?)['"]`));
    const factionName = fMatch ? fMatch[1] : 'NOT FOUND';

    const flMatch = flagsCode.match(new RegExp(`['"]${id}['"]\\s*:\\s*['"](.*?)['"]`));
    const flag = flMatch ? flMatch[1] : 'NOT FOUND';

    return `${id}: factionName=${factionName}, flag=${flag}`;
});

console.log(results.join('\n'));
