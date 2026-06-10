import * as fs from 'fs';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

const file = './src/data/cities_v2.ts';
let content = fs.readFileSync(file, 'utf8');

const pairs = [
    ['city_nanjing', 'city_liyang'],
    ['city_shanxian', 'city_shaoxing'],
    ['city_baimajin', 'city_puyang'],
    ['city_shengle', 'city_guihua'],
    ['city_kereyid', 'city_junjishan'],
    ['city_shaxian', 'city_yanping']
];

for (const [id1, id2] of pairs) {
    const r1 = new RegExp(`id:\\s*['"]${id1}['"].*?lat:\\s*([0-9.-]+),\\s*lng:\\s*([0-9.-]+)`, 's');
    const r2 = new RegExp(`id:\\s*['"]${id2}['"].*?lat:\\s*([0-9.-]+),\\s*lng:\\s*([0-9.-]+)`, 's');
    
    const m1 = content.match(r1);
    const m2 = content.match(r2);
    
    if (m1 && m2) {
        let lat1 = parseFloat(m1[1]), lng1 = parseFloat(m1[2]);
        let lat2 = parseFloat(m2[1]), lng2 = parseFloat(m2[2]);
        
        let dist = calculateDistance(lat1, lng1, lat2, lng2);
        console.log(`${id1} vs ${id2}: ${dist.toFixed(2)} km`);
        
        // Slightly move city2 away from city1
        while (dist < 50) {
            if (lat2 > lat1) lat2 += 0.01; else lat2 -= 0.01;
            if (lng2 > lng1) lng2 += 0.01; else lng2 -= 0.01;
            dist = calculateDistance(lat1, lng1, lat2, lng2);
        }
        console.log(`  -> New dist: ${dist.toFixed(2)} km`);
        
        // Update content
        const replaceRegex = new RegExp(`(id:\\s*['"]${id2}['"].*?lat:\\s*)[0-9.-]+(,\\s*lng:\\s*)[0-9.-]+`, 's');
        content = content.replace(replaceRegex, `$1${lat2.toFixed(3)}$2${lng2.toFixed(3)}`);
    } else {
        console.log('Could not find', id1, 'or', id2);
    }
}

fs.writeFileSync(file, content);
console.log('Done!');