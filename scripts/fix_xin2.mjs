import fs from 'fs';
let gameApp = fs.readFileSync('src/app/GameApp.ts', 'utf8');
gameApp = gameApp.replace(/(export\s+const\s+STARTING_CAPITALS\s*:\s*Record<string,\s*string>\s*=\s*\{[\s\S]*?)(\s*\})/, (match, p1, p2) => {
    return p1 + "\n    'xin2': 'city_nanpu'," + p2;
});
fs.writeFileSync('src/app/GameApp.ts', gameApp);
console.log('Fixed xin2');
