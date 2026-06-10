const fs = require('fs');

const citiesContent = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');
const regionsContent = fs.readFileSync('src/systems/RegionSystem.ts', 'utf-8');

// Extremely hacky way to extract the REGIONS array
const regionsMatch = regionsContent.match(/const REGIONS[\s\S]*?\];/);
let REGIONS = [];
if (regionsMatch) {
    const code = regionsMatch[0].replace('const REGIONS: { id: RegionType; polygon: {lat:number,lng:number}[] }[] =', 'REGIONS =');
    eval(code);
}

// Read cities
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

// Point-in-polygon algorithm from RegionSystem.ts
function getRegionForPoint(lat, lng) {
    for (const region of REGIONS) {
        const poly = region.polygon;
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const xi = poly[i].lat, yi = poly[i].lng;
            const xj = poly[j].lat, yj = poly[j].lng;
            // Point is exactly on a vertex
            if (lat === xi && lng === yi) return region.id;
            
            const intersect = ((yi > lng) !== (yj > lng)) &&
                (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        if (inside) return region.id;
    }
    return 'CENTRAL'; // Fallback
}

function getCandidateRegions(lat, lng) {
    const eps = 0.001; // Match precision
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

// Count regions
const counts = {};
for (const r of REGIONS) counts[r.id] = 0;
counts['CENTRAL'] = 0;

for (const city of cities) {
    let r = city.explicitRegion || getRegionForPoint(city.lat, city.lng);
    if (!counts[r]) counts[r] = 0;
    counts[r]++;
}

console.log("=== Region City Counts ===");
const sortedRegions = Object.entries(counts).sort((a,b) => a[1] - b[1]);
for (const [r, c] of sortedRegions) {
    console.log(`${r}: ${c}`);
}

const boundaryCityNames = ['汉中', '襄阳', '广陵', '威海卫', '肤施', '皋兰', '归化', '襄平', '临烝', '石门关', '打箭炉', '姑臧', '卡克里克', '哈密卫', '吴哥', '阇槃', '大研', '加德满都', '勃固城', '直通', '阿瑜陀耶', '护密城', '塔什库尔干', '龙木错', '马鲁鲁德', '彭迪', '梅尔夫', '玉龙杰赤', '亚西', '弓月城', '国内城', '胜山馆', '囊哈儿卫', '俱轮泊', '金石城', '江户', '柳之御所', '根城', '也迷离', '阿尔泰黑林', '乌布萨泊', '博尔巴任', '色楞格河', '牡丹社', '首里', '赤木名城'];

const toUpdate = [];

for (const name of boundaryCityNames) {
    const city = cities.find(c => c.name === name);
    if (!city) {
        console.log(`Could not find city: ${name}`);
        continue;
    }
    
    const candidates = getCandidateRegions(city.lat, city.lng);
    if (candidates.length > 1) {
        // Sort candidates by count ascending
        candidates.sort((a, b) => (counts[a] || 0) - (counts[b] || 0));
        const chosen = candidates[0];
        console.log(`City ${name} is shared by ${candidates.join(', ')}. Assigned to ${chosen} (which has ${counts[chosen]} cities).`);
        
        // Mark for update if not already explicitly tagged or tagged wrong
        if (city.explicitRegion !== chosen) {
            toUpdate.push({ city, chosen });
            counts[chosen]++;
            // Decrease old count? It's a minor drift, don't worry for now.
        }
    } else if (candidates.length === 1) {
        const chosen = candidates[0];
        if (city.explicitRegion !== chosen) {
             toUpdate.push({ city, chosen });
        }
    }
}

// Generate the replacement script
let finalContent = citiesContent;
for (const {city, chosen} of toUpdate) {
    // Inject or replace region tag
    let newMatch = city.matchString;
    if (city.explicitRegion) {
        newMatch = newMatch.replace(`region: '${city.explicitRegion}'`, `region: '${chosen}'`);
    } else {
        // inject region before troops
        newMatch = newMatch.replace(/troops:/, `region: '${chosen}', troops:`);
    }
    finalContent = finalContent.replace(city.matchString, newMatch);
}

fs.writeFileSync('src/data/cities_v2.ts.new', finalContent, 'utf-8');
console.log(`\nGenerated new cities_v2.ts with ${toUpdate.length} explicit tags.`);
