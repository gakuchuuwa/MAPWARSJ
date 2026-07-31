const fs = require('fs');
const citiesContent = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');
const regionsContent = fs.readFileSync('src/systems/RegionSystem.ts', 'utf-8');

const regionsMatch = regionsContent.match(/const REGIONS[\s\S]*?\];/);
let REGIONS = [];
if (regionsMatch) {
    const code = regionsMatch[0].replace('const REGIONS: { id: RegionType; polygon: {lat:number,lng:number}[] }[] =', 'REGIONS =');
    eval(code);
}

function getRegionForPoint(lat, lng) {
    for (const region of REGIONS) {
        const poly = region.polygon;
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const xi = poly[i].lat, yi = poly[i].lng;
            const xj = poly[j].lat, yj = poly[j].lng;
            if (lat === xi && lng === yi) return region.id;
            const intersect = ((yi > lng) !== (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        if (inside) return region.id;
    }
    return 'CENTRAL'; 
}

const cityRegex = /{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)'[^}]*lat:\s*([\d.-]+),\s*lng:\s*([\d.-]+)[^}]*}/g;
const cities = [];
let match;
while ((match = cityRegex.exec(citiesContent)) !== null) {
    cities.push({
        id: match[1],
        name: match[2],
        lat: parseFloat(match[3]),
        lng: parseFloat(match[4]),
        explicitRegion: match[0].match(/region:\s*'([^']+)'/) ? match[0].match(/region:\s*'([^']+)'/)[1] : null
    });
}

const boundaryCityNames = [
    '汉中', '襄阳', '广陵', '威海卫', '肤施', '皋兰', 
    '归化', '襄平', '临烝', '石门关', '打箭炉', '大研', 
    '加德满都', '勃固', '直通', '阿瑜陀耶', '吴哥', '阇槃', 
    '牡丹社', '首里', '赤木名城', '江户', '柳之御所', '根城', 
    '金石城', '胜山馆', '国内城', '囊哈儿卫', '俱轮泊', 
    '色楞格河', '博尔巴任', '乌布萨泊', '阿尔泰', '也迷离', 
    '弓月', '亚西', '玉龙杰赤', '梅尔夫', '彭迪', '马鲁鲁德', 
    '护密城', '塔什库尔干', '龙木错', '卡克里克', '哈密'
];

console.log('--- 14 区边界城市当前文化归属 ---');
for (const bName of boundaryCityNames) {
    const city = cities.find(c => c.name.includes(bName));
    if (city) {
        const region = city.explicitRegion || getRegionForPoint(city.lat, city.lng);
        console.log(`${city.name.padEnd(8, ' ')} | ${region.padEnd(12, ' ')} | ${city.explicitRegion ? '显式锁定' : '多边形推断'}`);
    } else {
        console.log(`${bName.padEnd(8, ' ')} | 找不到对应城市`);
    }
}
