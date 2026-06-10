const fs = require('fs');

const cityContent = fs.readFileSync('./src/data/cities_v2.ts', 'utf-8');
const cities = [];
const blocks = cityContent.split(/id:\s*['"]/);
for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const nameMatch = block.match(/name:\s*['"]([^'"]+)['"]/);
    const latMatch = block.match(/lat:\s*([-\d.]+)/);
    const lngMatch = block.match(/lng:\s*([-\d.]+)/);
    if (nameMatch && latMatch && lngMatch) {
        cities.push({
            name: nameMatch[1],
            lat: parseFloat(latMatch[1]),
            lng: parseFloat(lngMatch[1])
        });
    }
}

function isPointInPolygon(lat, lng, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lng, yi = polygon[i].lat;
        const xj = polygon[j].lng, yj = polygon[j].lat;
        const intersect = ((yi >= lat) !== (yj >= lat)) && (lng <= (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

const NORTH_POLYGON = [
    {lat: 36.6, lng: 109.5}, // 延安
    {lat: 40.2, lng: 113.3}, // 大同略北
    {lat: 41.5, lng: 119.0}, // 赤峰附近
    {lat: 42.5, lng: 124.2}, // 开原
    {lat: 39.8, lng: 124.5}, // 鸭绿江口
    {lat: 37.8, lng: 124.5}, // 海上分界线
    {lat: 37.8, lng: 120.7}, // 登州
    {lat: 36.1, lng: 114.4}  // 安阳
];

const CENTRAL_POLYGON = [
    {lat: 36.6, lng: 109.5}, // 延安
    {lat: 36.1, lng: 114.4}, // 安阳
    {lat: 37.8, lng: 120.7}, // 登州
    {lat: 37.8, lng: 124.5}, // 登州东延入海
    {lat: 32.6, lng: 124.5}, // 寿春东延入海
    {lat: 32.6, lng: 116.8}, // 寿春
    {lat: 33.1, lng: 107.0}, // 汉中
    {lat: 34.6, lng: 105.7}  // 天水
];

function getRegion(lat, lng) {
    if (lat > 50.0) return (lng > 120.0) ? 'NORTHEAST' : 'STEPPE';
    if (lat > 26.0 && lat <= 37.0 && lng >= 76.0 && lng < 103.0) return 'TIBET';
    if (lat >= 35.0 && lat <= 44.0 && lng >= 75.0 && lng < 93.0) return 'WESTERN';
    if (lng < 75.0) return 'CENTRAL_ASIA';
    
    // Explicit polygons override broad coordinates
    if (isPointInPolygon(lat, lng, NORTH_POLYGON)) return 'NORTH';
    if (isPointInPolygon(lat, lng, CENTRAL_POLYGON)) return 'CENTRAL';

    if (lat > 41.0 && lng <= 120.0) return 'STEPPE';
    if (lat > 40.0 && lng > 120.0) return 'NORTHEAST'; // Northeast fallback
    if (lng > 127.0) return 'JAPAN';
    // 朝鲜界线
    if (lat > 33.0 && lng > 124.5 && lng <= 127.0) return 'KOREA';

    const getLngBound = (targetLat, lat1, lng1, lat2, lng2) => lng1 + (targetLat - lat1) * (lng2 - lng1) / (lat2 - lat1);
    const getLatBound = (targetLng, lat1, lng1, lat2, lng2) => lat1 + (targetLng - lng1) * (lat2 - lat1) / (lng2 - lng1);

    if (lat > 36.6 && lat <= 41.0 && lng >= 93.0 && lng < 109.5) return 'HEXI';
    if (lat > 34.6 && lat <= 36.6 && lng >= 93.0) {
        if (lng < getLngBound(lat, 36.6, 109.5, 34.6, 105.7)) return 'HEXI';
    }

    if (lat <= 26.0 && lng >= 92.0 && lng < 102.0) return 'DIANQIAN';
    if (lat <= 26.0 && lng >= 102.0) return 'LINGNAN';
    if (lat > 23.5 && lat <= 28.0 && lng > 116.0 && lng <= 120.5) return 'LINGNAN';

    if (lat > 33.1 && lat <= 34.6) {
        if (lng < getLngBound(lat, 34.6, 105.7, 33.1, 107.0)) return 'BASHU';
    }
    if (lat <= 33.1 && lng > 98.0 && lng <= 111.0) {
        if (lat > 28.0 && lng > 103.0 && lng <= 110.0) return 'BASHU';
        if (lng <= 110.0) return 'DIANQIAN';
    }

    if (lng > 107.0 && lng <= 124.5) {
        let latBound = 32.6;
        if (lng <= 116.8) latBound = getLatBound(lng, 33.1, 107.0, 32.6, 116.8);
        if (lat <= latBound) {
            if (!(lat > 23.5 && lat <= 28.0 && lng > 116.0 && lng <= 120.5) && !(lat <= 26.0 && lng >= 102.0)) return 'JIANGNAN';
        }
    }

    // Fallbacks
    if (lat > 36.1 && lng <= 124.5) return 'NORTH';
    if (lng > 105.7 && lng <= 124.5) return 'CENTRAL';
    if (lat > 35.0) return 'NORTH';
    if (lat > 33.0) return 'CENTRAL';
    return 'JIANGNAN';
}

const testCities = [
    '襄平', '皮岛', '平壤', '洛阳', '长安', '天水', '武威', '成都', '延安', '安阳', '大同', '山海关', '乌骨城', '徒河', '赫图阿拉', '海州', '黄龙府'
];

cities.filter(c => testCities.includes(c.name)).forEach(c => {
    console.log(`${c.name}: ${getRegion(c.lat, c.lng)}`);
});
