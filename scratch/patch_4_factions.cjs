const fs = require('fs');

console.log('--- Patching factions.ts ---');
let f = fs.readFileSync('c:\\MAPWARSJ\\src\\data\\factions.ts', 'utf8');

const newFactions = `
    { id: 'qiemo', name: '且末', color: '#666666' },
    { id: 'purang', name: '普兰', color: '#666666' },
    { id: 'weitou', name: '尉头', color: '#666666' },
    { id: 'dangchang', name: '宕昌', color: '#666666' },
`;

// Insert the new factions before the final "];"
if (f.includes('];')) {
    f = f.replace(/\];[\s\n]*$/, newFactions + '\n];\n');
    fs.writeFileSync('c:\\MAPWARSJ\\src\\data\\factions.ts', f);
    console.log('Successfully appended 4 factions to factions.ts');
} else {
    console.log('Error: Could not find end of FACTIONS array');
}
