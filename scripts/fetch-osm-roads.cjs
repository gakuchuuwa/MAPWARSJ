#!/usr/bin/env node
/**
 * fetch-osm-roads.cjs — 从 Overpass API 拉取指定 bbox 范围的 OSM 道路, 转为 GeoJSON
 *
 * 用法:
 *   node scripts/fetch-osm-roads.cjs <south> <west> <north> <east> <outFileName>
 *
 * 例 (长安-成都走廊测试):
 *   node scripts/fetch-osm-roads.cjs 30.0 103.0 35.0 110.0 roads_osm_test.geojson
 *
 * 过滤: highway = trunk | primary (国道 / 重要省道, 排除高速 motorway + 小路 secondary/tertiary)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const args = process.argv.slice(2);
if (args.length < 5) {
    console.error('Usage: node fetch-osm-roads.cjs <south> <west> <north> <east> <outFile>');
    process.exit(1);
}
const [southStr, westStr, northStr, eastStr, outFile] = args;
const [south, west, north, east] = [southStr, westStr, northStr, eastStr].map(Number);

const query = `[out:json][timeout:300];
(
  way["highway"~"^(trunk|primary)$"](${south},${west},${north},${east});
);
out geom;`;

console.error(`Query bbox: S=${south} W=${west} N=${north} E=${east}`);
console.error(`Filter: highway = trunk|primary`);
console.error(`Posting to Overpass API...`);

const postData = 'data=' + encodeURIComponent(query);

const options = {
    hostname: 'overpass-api.de',
    path: '/api/interpreter',
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'MAPWAR/1.0 (game project, road data prep)',
        'Accept': '*/*'
    },
    timeout: 600000  // 10 minutes
};

const req = https.request(options, (res) => {
    console.error(`HTTP ${res.statusCode}`);
    if (res.statusCode !== 200) {
        let errBody = '';
        res.on('data', c => errBody += c);
        res.on('end', () => {
            console.error('Error response:', errBody.slice(0, 500));
            process.exit(2);
        });
        return;
    }

    let chunks = [];
    let bytes = 0;
    let lastReported = 0;
    res.on('data', c => {
        chunks.push(c);
        bytes += c.length;
        if (bytes - lastReported > 1024 * 1024) {
            process.stderr.write(`\r  received ${(bytes / 1024 / 1024).toFixed(1)} MB`);
            lastReported = bytes;
        }
    });
    res.on('end', () => {
        process.stderr.write(`\r  received ${(bytes / 1024 / 1024).toFixed(1)} MB\n`);
        console.error(`Parsing JSON...`);
        const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        console.error(`Got ${data.elements?.length || 0} OSM elements`);

        // ── 转 GeoJSON ──
        const features = [];
        for (const el of data.elements || []) {
            if (el.type !== 'way' || !el.geometry || el.geometry.length < 2) continue;
            const coords = el.geometry.map(g => [g.lon, g.lat]);
            features.push({
                type: 'Feature',
                properties: {
                    osm_id: el.id,
                    highway: el.tags?.highway || null,
                    ref: el.tags?.ref || null,
                    name: el.tags?.name || null,
                    expressway: 0  // 已通过 highway 过滤排除高速, 保持字段以兼容现有 find-road.cjs
                },
                geometry: {
                    type: 'LineString',
                    coordinates: coords
                }
            });
        }

        const geojson = {
            type: 'FeatureCollection',
            features
        };

        const outPath = path.join(__dirname, '..', 'public', 'assets', outFile);
        fs.writeFileSync(outPath, JSON.stringify(geojson));
        const sizeKB = (fs.statSync(outPath).size / 1024).toFixed(1);
        console.error(`✓ Saved ${features.length} features to ${outPath} (${sizeKB} KB)`);

        // 统计
        const highwayCount = {};
        const refCount = { with_ref: 0, no_ref: 0 };
        for (const f of features) {
            const hw = f.properties.highway;
            highwayCount[hw] = (highwayCount[hw] || 0) + 1;
            if (f.properties.ref) refCount.with_ref++;
            else refCount.no_ref++;
        }
        console.error('Stats:');
        console.error(`  by highway:`, highwayCount);
        console.error(`  with ref: ${refCount.with_ref}, no ref: ${refCount.no_ref}`);
    });
});

req.on('error', (err) => {
    console.error('Request error:', err.message);
    process.exit(3);
});
req.on('timeout', () => {
    console.error('Request timeout');
    req.destroy();
    process.exit(4);
});

req.write(postData);
req.end();
