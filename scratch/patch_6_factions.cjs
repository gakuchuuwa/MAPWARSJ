const fs = require('fs');

console.log('--- Patching factions.ts ---');
let f = fs.readFileSync('c:\\MAPWARSJ\\src\\data\\factions.ts', 'utf8');

const newFactions = `
    { id: 'xiangxiong', name: '象雄', color: '#666666' },
    { id: 'qingqiang', name: '青羌', color: '#666666' },
    { id: 'zhaowu', name: '昭武', color: '#666666' },
    { id: 'mangbu', name: '芒部', color: '#666666' },
    { id: 'gaoliang', name: '高凉', color: '#666666' },
    { id: 'ruoqiang', name: '婼羌', color: '#666666' },
`;

// Insert the new factions before the final "];"
if (f.includes('];')) {
    f = f.replace(/\];[\s\n]*$/, newFactions + '\n];\n');
    fs.writeFileSync('c:\\MAPWARSJ\\src\\data\\factions.ts', f);
    console.log('Successfully appended 6 factions to factions.ts');
} else {
    console.log('Error: Could not find end of FACTIONS array');
}

console.log('--- Patching cities_v2.ts ---');
let c = fs.readFileSync('c:\\MAPWARSJ\\src\\data\\cities_v2.ts', 'utf8');

const cityUpdates = [
    { target: "name: '穹窿银城'", updateId: "factionId: 'xiangxiong'" },
    { target: "name: '茂州'", updateId: "factionId: 'qingqiang'" },
    { target: "name: '忽毡'", updateId: "factionId: 'zhaowu'" },
    { target: "name: '乌蒙山'", updateId: "factionId: 'mangbu'" },
    { target: "name: '潘州'", updateId: "factionId: 'gaoliang'" }
];

let cc = 0;
cityUpdates.forEach(u => {
    // We will do a simple regex or string replacement to set factionId on the same line or next line.
    // Better to find the exact line using regex and replace factionId: 'panjun' or add factionId.
    // Wait, the cities might have factionId: 'panjun' or no factionId.
});

// Since regex on JS can be tricky, let's output the target lines so we can use multi_replace_file_content.
const lines = c.split('\\n');
cityUpdates.forEach(u => {
    // do nothing here, I will just use grep_search to find exact lines and use multi_replace tool.
});
