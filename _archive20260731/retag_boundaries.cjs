const fs = require('fs');

const citiesContent = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');
const regionsContent = fs.readFileSync('src/systems/RegionSystem.ts', 'utf-8');

const regionsMatch = regionsContent.match(/const REGIONS[\s\S]*?\];/);
let REGIONS = [];
if (regionsMatch) {
    const code = regionsMatch[0].replace('const REGIONS: { id: RegionType; polygon: {lat:number,lng:number}[] }[] =', 'REGIONS =');
    eval(code);
}

const cityRegex = /{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)'[^}]*lat:\s*([\d.-]+),\s*lng:\s*([\d.-]+)[^}]*}/g;
const cities = [];
let match;
while ((match = cityRegex.exec(citiesContent)) !== null) {
    cities.push({
        matchString: match[0],
        id: match[1],
        name: match[2],
        lat: parseFloat(match[3]),
        lng: parseFloat(match[4]),
        explicitRegion: match[0].match(/region:\s*'([^']+)'/) ? match[0].match(/region:\s*'([^']+)'/)[1] : null
    });
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

function getCandidateRegions(lat, lng) {
    const eps = 0.001; 
    const candidates = [];
    for (const region of REGIONS) {
        for (const pt of region.polygon) {
            if (Math.abs(pt.lat - lat) < eps && Math.abs(pt.lng - lng) < eps) {
                if (!candidates.includes(region.id)) candidates.push(region.id);
            }
        }
    }
    return candidates;
}

const counts = {};
for (const r of REGIONS) counts[r.id] = 0;
counts['CENTRAL'] = 0;

for (const city of cities) {
    let r = city.explicitRegion || getRegionForPoint(city.lat, city.lng);
    if (!counts[r]) counts[r] = 0;
    counts[r]++;
}

const boundaryCityNames = [
    '汉中', '襄阳', '广陵', '威海卫', '肤施', '皋兰', 
    '归化', '襄平', '临烝', '石门关', '打箭炉', '大研', 
    '加德满都', '勃固', '直通', '阿瑜陀耶', '吴哥', '阇槃', 
    '牡丹社', '首里', '赤木名城', '江户', '柳之御所', '根城', 
    '金石城', '胜山馆', '国内城', '囊哈儿卫', '俱轮泊', 
    '色楞格河', '博尔巴任', '乌布萨泊', '阿尔泰', '也迷里', 
    '弓月', '亚西', '玉龙杰赤', '梅尔夫', '彭迪', '马鲁鲁德', 
    '护密城', '塔什库尔干', '龙木错', '卡克里克', '哈密'
];

// User explicit overrides!
const manualOverrides = {
    '广陵': 'JIANGNAN',
    '威海卫': 'NORTH',
    '襄平': 'NORTH',
    '国内城': 'KOREA',
    '胜山馆': 'JAPAN',
    // Fallback fixes for mathematically problematic boundaries
    '加德满都': 'TIBET',
    '牡丹社': 'LINGNAN',
    '俱轮泊': 'NORTHEAST',
    '博尔巴任': 'STEPPE',
    '乌布萨泊': 'STEPPE',
    '护密城': 'CENTRAL_ASIA',
    '也迷里': 'STEPPE',
    '阿尔泰山黑林': 'STEPPE',
    '直通城': 'DIANQIAN',
    '龙木错': 'WESTERN',
    '卡克里克': 'WESTERN',
    '皋兰': 'HEXI',
    '石门关': 'BASHU',
    '色楞格河': 'STEPPE'
};

const toUpdate = [];

for (const bName of boundaryCityNames) {
    const city = cities.find(c => c.name.includes(bName));
    if (!city) continue;
    
    let chosen = null;
    if (manualOverrides[city.name]) {
        chosen = manualOverrides[city.name];
    } else {
        const candidates = getCandidateRegions(city.lat, city.lng);
        if (candidates.length > 0) {
            candidates.sort((a, b) => (counts[a] || 0) - (counts[b] || 0));
            chosen = candidates[0];
        }
    }
    
    if (chosen && city.explicitRegion !== chosen) {
        toUpdate.push({ city, chosen });
        counts[chosen]++;
    }
}

let finalContent = citiesContent;
for (const {city, chosen} of toUpdate) {
    let newMatch = city.matchString;
    if (city.explicitRegion) {
        newMatch = newMatch.replace(`region: '${city.explicitRegion}'`, `region: '${chosen}'`);
    } else {
        newMatch = newMatch.replace(/troops:/, `region: '${chosen}', troops:`);
    }
    finalContent = finalContent.replace(city.matchString, newMatch);
}

fs.writeFileSync('src/data/cities_v2.ts', finalContent, 'utf-8');
console.log('Restored all precise tags!');
