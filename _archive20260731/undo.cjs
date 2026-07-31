const fs = require('fs');

const file = 'src/data/cities_v2.ts';
let content = fs.readFileSync(file, 'utf-8');

const modifiers = [
    'city_jieting',
    'city_dihua',
    'city_xiushan'
];

for (const id of modifiers) {
    let regex = new RegExp(`(id:\\s*'${id}'[\\s\\S]*?lng:\\s*)([0-9.-]+)`, 'g');
    content = content.replace(regex, (match, p1, p2) => {
        let newLng = parseFloat(p2) - 0.5;
        return p1 + newLng.toFixed(6);
    });
}

fs.writeFileSync(file, content);
console.log("Cities reverted.");
