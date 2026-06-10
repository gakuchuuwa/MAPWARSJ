const fs = require('fs');

console.log('--- Patching factions.ts ---');
let f = fs.readFileSync('c:\\MAPWARSJ\\src\\data\\factions.ts', 'utf8');

const factionReps = [
    { old: "name: '方国'", new: "name: '方'" },
    { old: "name: '大明国'", new: "name: '大明'" },
    { old: "name: '广南国'", new: "name: '广南'" },
    { old: "name: '俚人'", new: "name: '俚'" },
    { old: "name: '黎国'", new: "name: '黎'" },
    { old: "name: '李氏'", new: "name: '李'" },
    { old: "name: '卓氏'", new: "name: '卓'" },
    { old: "name: '彭氏'", new: "name: '彭'" },
    { old: "name: '爨氏'", new: "name: '爨'" },
    { old: "name: '滇国'", new: "name: '滇'" },
    { old: "name: '僰人'", new: "name: '僰'" },
    
    // 2-char conflict flag changes
    { old: "name: '仇池'", new: "name: '杨'" },
    { old: "name: '焉耆'", new: "name: '龙'" },
    { old: "name: '白波'", new: "name: '郭'" },
    { old: "name: '蒲甘'", new: "name: '缅'" },
    { old: "name: '阿瓦'", new: "name: '掸'" },
    { old: "name: '护密'", new: "name: '瓦罕'" },
    { old: "id: 'gar_kham', name: '德格'", new: "id: 'gar_kham', name: '康巴'" }, // disambiguate in case multiple lines have 德格
    { old: "id: 'yutian', name: '于阗'", new: "id: 'yutian', name: '尉迟'" },
    { old: "name: '噶朗第巴'", new: "name: '波密'" }
];

let fc = 0;
factionReps.forEach(r => {
    if (f.includes(r.old)) {
        f = f.replace(r.old, r.new);
        fc++;
    } else {
        console.log('Failed to find in factions.ts:', r.old);
    }
});
fs.writeFileSync('c:\\MAPWARSJ\\src\\data\\factions.ts', f);
console.log('factions.ts patched:', fc);

console.log('\n--- Patching cities_v2.ts ---');
let c = fs.readFileSync('c:\\MAPWARSJ\\src\\data\\cities_v2.ts', 'utf8');

const cityReps = [
    { old: "name: '安定卫'", new: "name: '苦峪城'" },
    { old: "id: 'city_shache', name: '莎车'", new: "id: 'city_shache', name: '叶城'" },
    { old: "id: 'city_chilechuan', name: '敕勒川'", new: "id: 'city_chilechuan', name: '云中'" },
    { old: "id: 'city_tongjiajiang', name: '佟佳江'", new: "id: 'city_tongjiajiang', name: '浑江'" },
    { old: "id: 'city_weili', name: '尉犁'", new: "id: 'city_weili', name: '库尔勒'" },
    { old: "id: 'city_juandu', name: '捐毒'", new: "id: 'city_juandu', name: '乌恰'" },
    { old: "id: 'city_pishan', name: '皮山'", new: "id: 'city_pishan', name: '固玛'" },
    { old: "id: 'city_hepanntuo', name: '喝槃陀城'", new: "id: 'city_hepanntuo', name: '塔什库尔干'" },
    { old: "id: 'city_heishuisai', name: '黑水塞'", new: "id: 'city_heishuisai', name: '伯力'" },
    { old: "id: 'city_yumi', name: '扜弥'", new: "id: 'city_yumi', name: '克里雅'" },
    { old: "id: 'city_yierkeshitan', name: '伊尔克什坦'", new: "id: 'city_yierkeshitan', name: '斯姆哈纳'" }
];

let cc = 0;
cityReps.forEach(r => {
    if (c.includes(r.old)) {
        c = c.replace(r.old, r.new);
        cc++;
    } else {
        console.log('Failed to find in cities_v2.ts:', r.old);
    }
});
fs.writeFileSync('c:\\MAPWARSJ\\src\\data\\cities_v2.ts', c);
console.log('cities_v2.ts patched:', cc);
