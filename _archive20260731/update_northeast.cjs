const fs = require('fs');

let regionStr = fs.readFileSync('src/systems/RegionSystem.ts', 'utf-8');

const oldPolygon = `        id: 'NORTHEAST',
        polygon: [
            { lat: 41.27, lng: 123.17 }, // 襄平
            { lat: 40.45, lng: 124.06 }, // 乌骨城
            { lat: 41.14, lng: 126.18 }, // 国内城
            { lat: 52.21, lng: 141.95 }, // 囊哈儿卫
            { lat: 52.92, lng: 139.77 }, // 奴儿干
            { lat: 49.25, lng: 118.26 }, // 俱轮泊
            { lat: 41.27, lng: 123.17 }  // 襄平
        ]`;

const newPolygon = `        id: 'NORTHEAST',
        polygon: [
            { lat: 41.27, lng: 123.17 }, // 襄平
            { lat: 41.14, lng: 126.18 }, // 国内城
            { lat: 41.35, lng: 140.13 }, // 胜山馆
            { lat: 52.21, lng: 141.95 }, // 囊哈儿卫
            { lat: 52.92, lng: 139.77 }, // 奴儿干
            { lat: 49.25, lng: 118.26 }, // 俱轮泊
            { lat: 41.27, lng: 123.17 }  // 襄平
        ]`;

regionStr = regionStr.replace(oldPolygon, newPolygon);
fs.writeFileSync('src/systems/RegionSystem.ts', regionStr, 'utf-8');
console.log('Updated NORTHEAST polygon!');
