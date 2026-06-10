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

const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>全新大开大合多边形防线</title>
    <style>
        body { background: #1a1a24; color: #fff; font-family: sans-serif; text-align: center; }
        canvas { background: #2a2a35; border: 1px solid #444; border-radius: 8px; margin-top: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
        .legend { margin-top: 15px; display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; }
        .legend-item { display: flex; align-items: center; gap: 5px; font-size: 16px; font-weight: bold; }
        .dot { width: 16px; height: 16px; border-radius: 50%; }
    </style>
</head>
<body>
    <h2>【极简架构】你的专属 5 锚点天下防线图</h2>
    <p>威海卫据点已建立。你设计的两条绝佳斜杠线完全取代了以前零散的经纬度切割。</p>
    <canvas id="mapCanvas" width="1000" height="700"></canvas>
    <div class="legend" id="legend"></div>

    <script>
        const cities = ` + JSON.stringify(cities) + `;

        const colors = {
            'CENTRAL': '#ff4d4d',   // 红 - 中原
            'NORTH': '#ffcc00',     // 黄 - 北方
            'HEXI': '#cc66ff',      // 紫 - 河西
            'BASHU': '#ff9933',     // 橙 - 巴蜀
            'JIANGNAN': '#33ccff',  // 蓝 - 江南
            'LINGNAN': '#0099cc',
            'NORTHEAST': '#669999',
            'STEPPE': '#996633',
            'KOREA': '#ff6699'
        };

        const canvas = document.getElementById('mapCanvas');
        const ctx = canvas.getContext('2d');
        
        const minLng = 103, maxLng = 127;
        const minLat = 31, maxLat = 43;

        function getX(lng) { return (lng - minLng) / (maxLng - minLng) * canvas.width; }
        function getY(lat) { return canvas.height - (lat - minLat) / (maxLat - minLat) * canvas.height; }

        const NORTH_POLYGON = [
            {lat: 36.6, lng: 109.5, n: '延安'},
            {lat: 40.84, lng: 111.68, n: '归化'},
            {lat: 41.27, lng: 123.17, n: '襄平'},
            {lat: 37.51, lng: 122.12, n: '威海卫'}
        ];

        const CENTRAL_POLYGON = [
            {lat: 37.51, lng: 122.12, n: '威海卫'},
            {lat: 32.45, lng: 119.4, n: '扬州'},
            {lat: 33.1, lng: 107.0, n: '汉中'},
            {lat: 34.6, lng: 105.7, n: '天水'},
            {lat: 36.6, lng: 109.5, n: '延安'}
        ];

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

        function getRegion(lat, lng) {
            if (isPointInPolygon(lat, lng, NORTH_POLYGON)) return 'NORTH';
            if (isPointInPolygon(lat, lng, CENTRAL_POLYGON)) return 'CENTRAL';

            if (lat > 40.0 && lng > 120.0) return 'NORTHEAST';
            if (lat > 33.0 && lng > 124.7 && lng <= 127.0) return 'KOREA';
            if (lat > 41.0 && lng <= 120.0) return 'STEPPE';

            const getLngBound = (targetLat, lat1, lng1, lat2, lng2) => lng1 + (targetLat - lat1) * (lng2 - lng1) / (lat2 - lat1);
            const getLatBound = (targetLng, lat1, lng1, lat2, lng2) => lat1 + (targetLng - lng1) * (lat2 - lat1) / (lng2 - lng1);

            if (lat > 36.6 && lat <= 41.0 && lng >= 93.0 && lng < 109.5) return 'HEXI';
            if (lat > 34.6 && lat <= 36.6 && lng >= 93.0) {
                if (lng < getLngBound(lat, 36.6, 109.5, 34.6, 105.7)) return 'HEXI';
            }

            if (lat > 33.1 && lat <= 34.6) {
                if (lng < getLngBound(lat, 34.6, 105.7, 33.1, 107.0)) return 'BASHU';
            }
            if (lat <= 33.1 && lng > 98.0 && lng <= 111.0) return 'BASHU';
            
            if (lng > 107.0 && lng <= 124.5) {
                let latBound = 32.6;
                if (lng <= 116.8) latBound = getLatBound(lng, 33.1, 107.0, 32.6, 116.8);
                if (lat <= latBound) return 'JIANGNAN';
            }
            return 'UNKNOWN';
        }

        function drawPolygon(poly, stroke, fill) {
            ctx.beginPath();
            ctx.moveTo(getX(poly[0].lng), getY(poly[0].lat));
            for(let i=1; i<poly.length; i++) {
                ctx.lineTo(getX(poly[i].lng), getY(poly[i].lat));
            }
            ctx.closePath();
            if(fill) { ctx.fillStyle = fill; ctx.fill(); }
            ctx.lineWidth = 3;
            ctx.strokeStyle = stroke;
            ctx.stroke();

            poly.forEach(p => {
                ctx.fillStyle = '#ff00ff';
                ctx.fillRect(getX(p.lng)-4, getY(p.lat)-4, 8, 8);
                ctx.fillStyle = '#ffffff';
                ctx.font = '16px bold sans-serif';
                ctx.fillText(p.n, getX(p.lng)+8, getY(p.lat)-8);
            });
        }

        drawPolygon(NORTH_POLYGON, '#ffcc00', 'rgba(255, 204, 0, 0.2)');
        drawPolygon(CENTRAL_POLYGON, '#ff4d4d', 'rgba(255, 77, 77, 0.2)');

        cities.forEach(city => {
            if(city.lng < minLng || city.lng > maxLng || city.lat < minLat || city.lat > maxLat) return;
            const region = getRegion(city.lat, city.lng);
            const color = colors[region] || '#555';
            ctx.beginPath();
            ctx.arc(getX(city.lng), getY(city.lat), 5, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#000';
            ctx.stroke();

            const keyCities = ['洛阳', '长安', '天水', '太原', '汉中', '大同', '北京', '建业', '延安', '归化城', '襄平', '威海卫', '扬州'];
            if (keyCities.includes(city.name)) {
                ctx.fillStyle = '#fff';
                ctx.font = '14px sans-serif';
                ctx.fillText(city.name, getX(city.lng) + 8, getY(city.lat) + 4);
            }
        });

        const legendDiv = document.getElementById('legend');
        ['CENTRAL', 'NORTH', 'HEXI', 'BASHU', 'JIANGNAN', 'NORTHEAST', 'KOREA'].forEach(region => {
            if(!colors[region]) return;
            const item = document.createElement('div');
            item.className = 'legend-item';
            item.innerHTML = '<div class="dot" style="background:' + colors[region] + '"></div> ' + region;
            legendDiv.appendChild(item);
        });
    </script>
</body>
</html>
`;

fs.writeFileSync('C:/Users/GAKU/.gemini/antigravity/brain/c6c59dd1-cfb5-4ecd-ac65-7a6d48d489be/final_polygon_demo.html', html, 'utf-8');
console.log('Generated final_polygon_demo.html');
