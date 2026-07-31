const fs = require('fs');

const REGIONS = [
    { id: 'CENTRAL', polygon: [{lat:36.04,lng:103.82},{lat:40.85,lng:109.84},{lat:40.32,lng:115.11},{lat:38.29,lng:117.48},{lat:34.90,lng:119.55},{lat:32.45,lng:119.40},{lat:32.01,lng:112.12},{lat:33.07,lng:107.02}] },
    { id: 'NORTH', polygon: [{lat:40.32,lng:115.11},{lat:41.38,lng:118.88},{lat:38.90,lng:121.60},{lat:37.38,lng:122.65},{lat:34.90,lng:119.55},{lat:38.29,lng:117.48}] },
    { id: 'BASHU', polygon: [{lat:32.01,lng:112.12},{lat:26.89,lng:112.60},{lat:28.08,lng:104.25},{lat:30.05,lng:101.96},{lat:36.04,lng:103.82},{lat:33.07,lng:107.02}] },
    { id: 'JIANGNAN', polygon: [{lat:32.45,lng:119.40},{lat:32.01,lng:112.12},{lat:26.89,lng:112.60},{lat:28.45,lng:129.67}] },
    { id: 'LINGNAN', polygon: [{lat:28.08,lng:104.25},{lat:26.89,lng:112.60},{lat:28.45,lng:129.67},{lat:26.22,lng:127.72},{lat:22.20,lng:120.83},{lat:13.93,lng:109.11},{lat:13.41,lng:103.86}] },
    { id: 'DIANQIAN', polygon: [{lat:30.05,lng:101.96},{lat:26.87,lng:100.22},{lat:27.72,lng:85.19},{lat:17.33,lng:96.47},{lat:16.53,lng:97.63},{lat:14.35,lng:100.58},{lat:13.41,lng:103.86},{lat:28.08,lng:104.25}] },
    { id: 'HEXI', polygon: [{lat:40.85,lng:109.84},{lat:41.48,lng:100.32},{lat:37.93,lng:102.64},{lat:36.04,lng:103.82}] },
    { id: 'WESTERN', polygon: [{lat:41.48,lng:100.32},{lat:42.24,lng:96.47},{lat:46.38,lng:90.72},{lat:46.90,lng:82.72},{lat:44.10,lng:79.81},{lat:43.30,lng:68.27},{lat:39.11,lng:71.30},{lat:37.77,lng:75.23},{lat:34.57,lng:80.35},{lat:38.99,lng:88.95},{lat:37.93,lng:102.64}] },
    { id: 'STEPPE', polygon: [{lat:41.38,lng:118.88},{lat:46.98,lng:123.63},{lat:53.33,lng:119.76},{lat:52.01,lng:96.47},{lat:46.38,lng:90.72},{lat:42.24,lng:96.47},{lat:41.48,lng:100.32},{lat:40.85,lng:109.84},{lat:40.32,lng:115.11}] },
    { id: 'NORTHEAST', polygon: [{lat:38.90,lng:121.60},{lat:41.05,lng:125.75},{lat:42.33,lng:130.63},{lat:47.36,lng:138.83},{lat:54.67,lng:140.24},{lat:54.67,lng:125.47},{lat:53.33,lng:119.76},{lat:46.98,lng:123.63},{lat:41.38,lng:118.88}] },
    { id: 'KOREA', polygon: [{lat:38.90,lng:121.60},{lat:34.02,lng:125.56},{lat:34.42,lng:130.31},{lat:42.33,lng:130.63},{lat:41.05,lng:125.75}] },
    { id: 'JAPAN', polygon: [{lat:34.42,lng:130.31},{lat:30.90,lng:130.31},{lat:36.56,lng:141.21},{lat:45.37,lng:141.69},{lat:45.61,lng:149.03},{lat:42.33,lng:130.63}] },
    { id: 'TIBET', polygon: [{lat:27.72,lng:85.19},{lat:36.73,lng:71.61},{lat:37.77,lng:75.23},{lat:34.57,lng:80.35},{lat:38.99,lng:88.95},{lat:37.93,lng:102.64},{lat:36.04,lng:103.82},{lat:30.05,lng:101.96},{lat:26.87,lng:100.22}] },
    { id: 'CENTRAL_ASIA', polygon: [{lat:37.77,lng:75.23},{lat:36.73,lng:71.61},{lat:35.58,lng:63.31},{lat:36.00,lng:62.70},{lat:37.62,lng:62.23},{lat:42.24,lng:59.63},{lat:43.30,lng:68.27},{lat:44.10,lng:79.81}] },
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
    return 'CENTRAL';
}

console.log('Sanpu Region:', getRegion(12.77, 105.97));
