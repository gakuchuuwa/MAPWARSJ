const fs = require('fs');

// 1. Parse cities from cities_v2.ts
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

// 2. Generate HTML
const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>区域划分分布图</title>
    <style>
        body { background: #1a1a24; color: #fff; font-family: sans-serif; text-align: center; }
        canvas { background: #2a2a35; border: 1px solid #444; border-radius: 8px; margin-top: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
        .legend { margin-top: 15px; display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; max-width: 900px; margin-left: auto; margin-right: auto;}
        .legend-item { display: flex; align-items: center; gap: 5px; font-size: 14px; }
        .dot { width: 12px; height: 12px; border-radius: 50%; }
    </style>
</head>
<body>
    <h2>当前天下 14 州 (区域划分) 实时坐标投影图</h2>
    <p>该地图实时反映了代码中的边界逻辑（包含刚才新加的斜线判断）。圈出来的是边界锚点。</p>
    <canvas id="mapCanvas" width="900" height="700"></canvas>
    <div class="legend" id="legend"></div>

    <script>
        const cities = ` + JSON.stringify(cities) + `;

        function getRegion(lat, lng) {
            if (lat > 50.0) {
                if (lng > 120.0) return 'NORTHEAST';
                return 'STEPPE';
            }
            if (lat > 26.0 && lat <= 37.0 && lng >= 76.0 && lng < 103.0) return 'TIBET';
            if (lat >= 35.0 && lat <= 44.0 && lng >= 75.0 && lng < 93.0) return 'WESTERN';
            if (lng < 75.0) return 'CENTRAL_ASIA';
            if (lat > 41.0 && lng <= 120.0) return 'STEPPE';
            if (lat > 40.0 && lng > 120.0) return 'NORTHEAST';
            if (lng > 127.0) return 'JAPAN';
            if (lat > 33.0 && lng > 123.0 && lng <= 127.0) return 'KOREA';

            const getLngBound = (targetLat, lat1, lng1, lat2, lng2) => {
                if (lat1 === lat2) return lng1;
                return lng1 + (targetLat - lat1) * (lng2 - lng1) / (lat2 - lat1);
            };
            const getLatBound = (targetLng, lat1, lng1, lat2, lng2) => {
                if (lng1 === lng2) return lat1;
                return lat1 + (targetLng - lng1) * (lat2 - lat1) / (lng2 - lng1);
            };

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
                    if (!(lat > 23.5 && lat <= 28.0 && lng > 116.0 && lng <= 120.5) && !(lat <= 26.0 && lng >= 102.0)) {
                        return 'JIANGNAN';
                    }
                }
            }

            if (lat > 36.1 && lng <= 124.0) return 'NORTH';
            if (lng > 105.7 && lng <= 124.0) return 'CENTRAL';

            if (lat > 35.0) return 'NORTH';
            if (lat > 33.0) return 'CENTRAL';
            return 'JIANGNAN';
        }

        const colors = {
            'CENTRAL': '#ff4d4d',   // 红 - 中原
            'NORTH': '#ffcc00',     // 黄 - 北方
            'HEXI': '#cc66ff',      // 紫 - 河西
            'BASHU': '#ff9933',     // 橙 - 巴蜀
            'JIANGNAN': '#33ccff',  // 蓝 - 江南
            'LINGNAN': '#0099cc',   // 深蓝 - 岭南
            'DIANQIAN': '#33cc33',  // 绿 - 滇黔
            'WESTERN': '#999966',   // 灰黄 - 西域
            'TIBET': '#ffffff',     // 白 - 吐蕃
            'STEPPE': '#996633',    // 棕 - 塞外
            'NORTHEAST': '#669999', // 青灰 - 东北
            'KOREA': '#ff6699',     // 粉 - 朝鲜
            'JAPAN': '#ff9999',     // 浅粉 - 日本
            'CENTRAL_ASIA': '#666699' // 深灰蓝 - 中亚
        };

        const canvas = document.getElementById('mapCanvas');
        const ctx = canvas.getContext('2d');
        
        const minLng = 65, maxLng = 145;
        const minLat = 15, maxLat = 55;

        function getX(lng) { return (lng - minLng) / (maxLng - minLng) * canvas.width; }
        function getY(lat) { return canvas.height - (lat - minLat) / (maxLat - minLat) * canvas.height; }

        cities.forEach(city => {
            const region = getRegion(city.lat, city.lng);
            const color = colors[region] || '#fff';
            
            ctx.beginPath();
            ctx.arc(getX(city.lng), getY(city.lat), 4, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
            
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#000';
            ctx.stroke();

            const keyCities = ['洛阳', '长安', '天水', '武威', '汉中', '成都', '寿春', '安阳', '北京', '广州', '延安'];
            if (keyCities.includes(city.name)) {
                ctx.fillStyle = '#fff';
                ctx.font = '12px sans-serif';
                ctx.fillText(city.name, getX(city.lng) + 6, getY(city.lat) + 4);
                
                ctx.beginPath();
                ctx.arc(getX(city.lng), getY(city.lat), 7, 0, 2 * Math.PI);
                ctx.strokeStyle = '#fff';
                ctx.stroke();
            }
        });

        const legendDiv = document.getElementById('legend');
        Object.keys(colors).forEach(region => {
            const item = document.createElement('div');
            item.className = 'legend-item';
            item.innerHTML = '<div class="dot" style="background:' + colors[region] + '"></div> ' + region;
            legendDiv.appendChild(item);
        });
    </script>
</body>
</html>
`;

fs.writeFileSync('C:/Users/GAKU/.gemini/antigravity/brain/c6c59dd1-cfb5-4ecd-ac65-7a6d48d489be/map_demo.html', html, 'utf-8');
console.log('Generated map_demo.html');
