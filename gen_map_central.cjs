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
    <title>中原核心区边界投影图</title>
    <style>
        body { background: #1a1a24; color: #fff; font-family: sans-serif; text-align: center; }
        canvas { background: #2a2a35; border: 1px solid #444; border-radius: 8px; margin-top: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
        .legend { margin-top: 15px; display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; }
        .legend-item { display: flex; align-items: center; gap: 5px; font-size: 16px; font-weight: bold; }
        .dot { width: 16px; height: 16px; border-radius: 50%; }
    </style>
</head>
<body>
    <h2>【局部放大】中原及周边四大界线图</h2>
    <p>红框内为中原，白线为我们刚刚写死在代码里的边界方程。</p>
    <canvas id="mapCanvas" width="1000" height="700"></canvas>
    <div class="legend" id="legend"></div>

    <script>
        const cities = ` + JSON.stringify(cities) + `;

        // 仅关注核心 5 区
        const colors = {
            'CENTRAL': '#ff4d4d',   // 红 - 中原
            'NORTH': '#ffcc00',     // 黄 - 北方
            'HEXI': '#cc66ff',      // 紫 - 河西
            'BASHU': '#ff9933',     // 橙 - 巴蜀
            'JIANGNAN': '#33ccff',  // 蓝 - 江南
            'LINGNAN': '#0099cc'    // 暗蓝 - 凑数
        };

        const canvas = document.getElementById('mapCanvas');
        const ctx = canvas.getContext('2d');
        
        // 极致放大核心区: 经度 102~123，纬度 30~41
        const minLng = 103, maxLng = 122;
        const minLat = 31, maxLat = 40;

        function getX(lng) { return (lng - minLng) / (maxLng - minLng) * canvas.width; }
        function getY(lat) { return canvas.height - (lat - minLat) / (maxLat - minLat) * canvas.height; }

        function getRegion(lat, lng) {
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
            
            if (lng > 107.0 && lng <= 124.0) {
                let latBound = 32.6;
                if (lng <= 116.8) latBound = getLatBound(lng, 33.1, 107.0, 32.6, 116.8);
                if (lat <= latBound) return 'JIANGNAN';
            }

            if (lat > 36.1 && lng <= 124.0) return 'NORTH';
            if (lng > 105.7 && lng <= 124.0) return 'CENTRAL';

            return 'CENTRAL';
        }

        // 1. 画出数学边界线
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.setLineDash([5, 5]); // 虚线
        ctx.beginPath();
        // 安阳以北水平线 (36.1)
        ctx.moveTo(getX(109.5), getY(36.1));
        ctx.lineTo(getX(124), getY(36.1));
        
        // 延安到天水
        ctx.moveTo(getX(109.5), getY(36.6));
        ctx.lineTo(getX(105.7), getY(34.6));
        // 天水到汉中
        ctx.lineTo(getX(107.0), getY(33.1));
        // 汉中到寿春
        ctx.lineTo(getX(116.8), getY(32.6));
        // 寿春向东水平线 (32.6)
        ctx.lineTo(getX(124), getY(32.6));
        ctx.stroke();
        ctx.setLineDash([]); // 恢复实线

        // 标出锚点
        const anchors = [
            {n: '安阳(36.1)', l: 36.1, g: 114.4},
            {n: '延安(36.6)', l: 36.6, g: 109.5},
            {n: '天水(34.6)', l: 34.6, g: 105.7},
            {n: '汉中(33.1)', l: 33.1, g: 107.0},
            {n: '寿春(32.6)', l: 32.6, g: 116.8}
        ];
        anchors.forEach(a => {
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(getX(a.g)-4, getY(a.l)-4, 8, 8);
            ctx.fillStyle = '#ffccff';
            ctx.font = '14px bold sans-serif';
            ctx.fillText(a.n, getX(a.g)+8, getY(a.l)-8);
        });

        // 2. 画出落在此区域的城市
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

            // 为了看得清，只标出重要城市或随机一部分
            const keyCities = ['洛阳', '长安', '成都', '武威', '徐州', '许昌', '建业', '襄阳', '太原', '邺城', '临淄', '济南'];
            if (keyCities.includes(city.name)) {
                ctx.fillStyle = '#fff';
                ctx.font = '13px sans-serif';
                ctx.fillText(city.name, getX(city.lng) + 8, getY(city.lat) + 4);
            }
        });

        const legendDiv = document.getElementById('legend');
        ['CENTRAL', 'NORTH', 'HEXI', 'BASHU', 'JIANGNAN'].forEach(region => {
            const item = document.createElement('div');
            item.className = 'legend-item';
            item.innerHTML = '<div class="dot" style="background:' + colors[region] + '"></div> ' + region;
            legendDiv.appendChild(item);
        });
    </script>
</body>
</html>
`;

fs.writeFileSync('C:/Users/GAKU/.gemini/antigravity/brain/c6c59dd1-cfb5-4ecd-ac65-7a6d48d489be/central_demo.html', html, 'utf-8');
console.log('Generated central_demo.html');
