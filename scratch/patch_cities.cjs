const fs = require('fs');

let c = fs.readFileSync('c:\\MAPWARSJ\\src\\data\\cities_v2.ts', 'utf8');

const replacements = [
    { target: /id:\s*'city_jiangxia',\s*name:\s*'江夏',\s*factionId:\s*'yu2_d'/g, rep: "id: 'city_jiangxia', name: '江夏', factionId: 'lulin'" },
    { target: /id:\s*'city_shengle',\s*name:\s*'盛乐',\s*factionId:\s*'boluo'/g, rep: "id: 'city_shengle', name: '盛乐', factionId: 'yunzhong'" },
    { target: /id:\s*'city_juzhou',\s*name:\s*'矩州',\s*factionId:\s*'pu_shi'/g, rep: "id: 'city_juzhou', name: '矩州', factionId: 'qian'" },
    { target: /id:\s*'city_shanghai',\s*name:\s*'上海',\s*factionId:\s*'daming'/g, rep: "id: 'city_shanghai', name: '上海', factionId: 'chunshen'" },
    { target: /id:\s*'city_wancheng',\s*name:\s*'皖城',\s*factionId:\s*'qiao'/g, rep: "id: 'city_wancheng', name: '皖城', factionId: 'lujiang'" },
    { target: /id:\s*'city_baoding',\s*name:\s*'保定',\s*factionId:\s*'zhang_clan'/g, rep: "id: 'city_baoding', name: '保定', factionId: 'qingyuan_bd'" },
    { target: /id:\s*'city_shouchun',\s*name:\s*'寿春',\s*factionId:\s*'huang_d'/g, rep: "id: 'city_shouchun', name: '寿春', factionId: 'zhong'" },
    { target: /id:\s*'city_xuzhou',\s*name:\s*'徐州',\s*factionId:\s*'peng_d'/g, rep: "id: 'city_xuzhou', name: '徐州', factionId: 'xichu'" }
];

let updated = 0;
replacements.forEach(r => {
    if (c.match(r.target)) {
        c = c.replace(r.target, r.rep);
        updated++;
    } else {
        console.log('Missed:', r.target);
    }
});

fs.writeFileSync('c:\\MAPWARSJ\\src\\data\\cities_v2.ts', c);
console.log('cities_v2.ts updated successfully. Replacements made:', updated);
