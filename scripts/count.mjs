import fs from "fs";

const REGION_ORDER = [
    "CENTRAL", "NORTH", "JIANGNAN", "LINGNAN",
    "BASHU", "DIANQIAN", "HEXI", "WESTERN", "TIBET",
    "STEPPE", "NORTHEAST", "KOREA", "JAPAN", "CENTRAL_ASIA"
];

const LEGACY_REGION_MAP = {
    "SOUTH": "JIANGNAN",
    "NORTHWEST": "HEXI",
    "NOMADIC": "STEPPE",
    "CENTRAL_WORLD": "CENTRAL_ASIA",
    "WEST_WORLD": "CENTRAL_ASIA",
    "TROPICS": "LINGNAN",
    "SIBERIA": "STEPPE",
    "MIN": "LINGNAN",
    "SOUTH_HEMISPHERE": "CENTRAL",
    "NEW_WORLD": "CENTRAL",
};

const REGIONS = [
    { id: "CENTRAL", polygon: [{lat:33.07,lng:107.02},{lat:32.45,lng:119.40},{lat:37.51,lng:122.12},{lat:36.59,lng:109.48},{lat:34.58,lng:105.73}] },
    { id: "NORTH", polygon: [{lat:36.59,lng:109.48},{lat:40.82,lng:111.68},{lat:41.27,lng:123.17},{lat:37.51,lng:122.12}] },
    { id: "NORTHEAST", polygon: [{lat:41.27,lng:123.17},{lat:41.13,lng:126.19},{lat:41.80,lng:140.10},{lat:51.80,lng:143.20},{lat:52.41,lng:142.39},{lat:50.23,lng:119.54}] },
    { id: "KOREA", polygon: [{lat:41.27,lng:123.17},{lat:37.51,lng:122.12},{lat:34.20,lng:129.29},{lat:41.80,lng:140.10},{lat:41.13,lng:126.19}] },
    { id: "JAPAN", polygon: [{lat:41.80,lng:140.10},{lat:34.20,lng:129.29},{lat:32.45,lng:119.40},{lat:28.45,lng:129.67},{lat:26.20,lng:127.70},{lat:35.68,lng:139.76},{lat:38.99,lng:141.12},{lat:40.50,lng:141.46}] },
    { id: "WESTERN", polygon: [{lat:40.52,lng:89.92},{lat:35.45,lng:81.10},{lat:37.77,lng:75.23},{lat:43.30,lng:68.27},{lat:42.90,lng:91.50},{lat:42.83,lng:93.51}] },
    { id: "HEXI", polygon: [{lat:40.82,lng:111.68},{lat:42.83,lng:93.51},{lat:40.52,lng:89.92},{lat:37.93,lng:102.64},{lat:36.04,lng:103.82},{lat:34.58,lng:105.73},{lat:36.59,lng:109.48}] },
    { id: "STEPPE", polygon: [{lat:50.23,lng:119.54},{lat:53.70,lng:91.45},{lat:43.30,lng:68.27},{lat:42.83,lng:93.51},{lat:40.52,lng:89.92},{lat:40.82,lng:111.68},{lat:41.27,lng:123.17}] },
    { id: "BASHU", polygon: [{lat:34.58,lng:105.73},{lat:30.05,lng:101.96},{lat:26.22,lng:111.63},{lat:33.07,lng:107.02}] },
    { id: "JIANGNAN", polygon: [{lat:32.45,lng:119.40},{lat:33.07,lng:107.02},{lat:26.22,lng:111.63},{lat:28.45,lng:129.67}] },
    { id: "LINGNAN", polygon: [{lat:28.45,lng:129.67},{lat:13.77,lng:109.23},{lat:30.05,lng:101.96},{lat:26.22,lng:111.63}] },
    { id: "DIANQIAN", polygon: [{lat:30.05,lng:101.96},{lat:21.17,lng:94.86},{lat:18.83,lng:95.25},{lat:17.3333,lng:96.4667},{lat:16.50,lng:97.60},{lat:14.35,lng:100.58},{lat:13.41,lng:103.87},{lat:13.77,lng:109.23}] },
    { id: "TIBET", polygon: [{lat:21.17,lng:94.86},{lat:37.63,lng:62.23},{lat:37.77,lng:75.23},{lat:35.45,lng:81.10},{lat:40.52,lng:89.92},{lat:37.93,lng:102.64},{lat:36.04,lng:103.82},{lat:34.58,lng:105.73},{lat:30.05,lng:101.96}] },
    { id: "CENTRAL_ASIA", polygon: [{lat:43.30,lng:68.27},{lat:42.24,lng:59.63},{lat:35.90,lng:64.80},{lat:37.63,lng:62.23},{lat:37.77,lng:75.23}] },
];

function getRegion(lat, lng) {
    for (const region of REGIONS) {
        const poly = region.polygon;
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const xi = poly[i].lng, yi = poly[i].lat;
            const xj = poly[j].lng, yj = poly[j].lat;
            const d = Math.sqrt((lat - yi) ** 2 + (lng - xi) ** 2);
            if (d < 0.01) return region.id;
            if (((yi >= lat) !== (yj >= lat)) && (lng <= (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside;
        }
        if (inside) return region.id;
    }
    return "CENTRAL";
}

function getCityRegion(city) {
    if (city.region) {
        const translated = LEGACY_REGION_MAP[city.region] ?? city.region;
        if (REGION_ORDER.includes(translated)) {
            return translated;
        }
    }
    return getRegion(city.latitude, city.longitude);
}

const content = fs.readFileSync("c:/MAPWARSJ/src/data/cities_v2.ts", "utf-8");
const cities = [];

const cityBlocks = content.match(/\{[^{}]*id:\s*['"][^'"]+['"][^{}]*\}/g) || [];
cityBlocks.forEach(block => {
    const idMatch = block.match(/id:\s*['"]([^'"]+)['"]/);
    const latMatch = block.match(/lat:\s*([-\d.]+)/);
    const lngMatch = block.match(/lng:\s*([-\d.]+)/);
    const regionMatch = block.match(/region:\s*['"]([^'"]+)['"]/);
    
    if (idMatch && latMatch && lngMatch) {
        cities.push({
            id: idMatch[1],
            latitude: parseFloat(latMatch[1]),
            longitude: parseFloat(lngMatch[1]),
            region: regionMatch ? regionMatch[1] : undefined
        });
    }
});

const counts = {};
REGION_ORDER.forEach(r => counts[r] = 0);
cities.forEach(c => {
    const r = getCityRegion(c);
    counts[r] = (counts[r] || 0) + 1;
});
console.log(JSON.stringify({
    total: cities.length,
    counts: counts
}, null, 2));
