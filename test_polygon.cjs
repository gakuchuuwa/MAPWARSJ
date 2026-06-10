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
        const intersect = ((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

const NORTH_POLYGON = [
    {lat: 36.6, lng: 109.5}, // 延安
    {lat: 40.1, lng: 113.3}, // 大同
    {lat: 40.0, lng: 119.7}, // 山海关
    {lat: 39.8, lng: 124.5}, // 鸭绿江口
    {lat: 39.8, lng: 125.0}, // 入海
    {lat: 37.8, lng: 125.0}, // 登州入海
    {lat: 37.8, lng: 120.7}, // 登州
    {lat: 36.1, lng: 114.4}  // 安阳
];

const CENTRAL_POLYGON = [
    {lat: 36.6, lng: 109.5}, // 延安
    {lat: 36.1, lng: 114.4}, // 安阳
    {lat: 37.8, lng: 120.7}, // 登州
    {lat: 37.8, lng: 125.0}, // 登州入海
    {lat: 32.6, lng: 125.0}, // 寿春入海
    {lat: 32.6, lng: 116.8}, // 寿春
    {lat: 33.1, lng: 107.0}, // 汉中
    {lat: 34.6, lng: 105.7}  // 天水
];

// Helper to keep surrounding regions working
function getRegion(lat, lng) {
    if (lat > 50.0) return (lng > 120.0) ? 'NORTHEAST' : 'STEPPE';
    if (lat > 26.0 && lat <= 37.0 && lng >= 76.0 && lng < 103.0) return 'TIBET';
    if (lat >= 35.0 && lat <= 44.0 && lng >= 75.0 && lng < 93.0) return 'WESTERN';
    if (lng < 75.0) return 'CENTRAL_ASIA';
    if (lat > 41.0 && lng <= 120.0) return 'STEPPE';
    // NORTHEAST logic: we must ensure Liaodong (which is in NORTH_POLYGON) is not overwritten by NORTHEAST if we want it in NORTH.
    // If it's in NORTH_POLYGON, we return NORTH first!
    
    // Check polygons FIRST for the core area to guarantee explicit point mapping!
    if (isPointInPolygon(lat, lng, NORTH_POLYGON)) return 'NORTH';
    if (isPointInPolygon(lat, lng, CENTRAL_POLYGON)) return 'CENTRAL';

    if (lat > 40.0 && lng > 120.0) return 'NORTHEAST'; // Northeast fallback
    if (lng > 127.0) return 'JAPAN';
    if (lat > 33.0 && lng > 123.0 && lng <= 127.0) return 'KOREA';

    // The rest of HEXI, BASHU, JIANGNAN logic...
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

    if (lng > 107.0 && lng <= 124.0) {
        let latBound = 32.6;
        if (lng <= 116.8) latBound = getLatBound(lng, 33.1, 107.0, 32.6, 116.8);
        if (lat <= latBound) {
            if (!(lat > 23.5 && lat <= 28.0 && lng > 116.0 && lng <= 120.5) && !(lat <= 26.0 && lng >= 102.0)) return 'JIANGNAN';
        }
    }

    return 'JIANGNAN'; // Ultimate fallback since North/Central are handled by polygons
}

const testCities = [
    '襄平', '皮岛', '平壤', '洛阳', '长安', '天水', '武威', '成都', '延安', '安阳', '大同', '山海关'
];

cities.filter(c => testCities.includes(c.name)).forEach(c => {
    console.log(`${c.name}: ${getRegion(c.lat, c.lng)}`);
});
