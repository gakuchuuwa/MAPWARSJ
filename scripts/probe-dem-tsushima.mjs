/**
 * 探测对马岛附近 Terrarium DEM 海拔（一次性脚本）
 */
import { createRequire } from 'module';
import { writeFileSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';

const decode = (r, g, b) => r * 256 + g + b * 0.00390625 - 32768;

function latLngToTilePixel(lat, lng, zoom = 9) {
    const n = Math.pow(2, zoom);
    const latRad = (lat * Math.PI) / 180;
    const xFrac = ((lng + 180) / 360) * n;
    const yFrac =
        ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
    const tileX = Math.floor(xFrac);
    const tileY = Math.floor(yFrac);
    const pixelX = Math.min(255, Math.max(0, Math.floor((xFrac - tileX) * 256)));
    const pixelY = Math.min(255, Math.max(0, Math.floor((yFrac - tileY) * 256)));
    return { tileX, tileY, pixelX, pixelY };
}

async function samplePngPixels(url) {
    const res = await fetch(url);
    const buf = Buffer.from(await res.arrayBuffer());
    const tmp = 'scripts/_dem_probe.png';
    writeFileSync(tmp, buf);
    // PowerShell + .NET 读 PNG 像素
    const ps = `
Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::FromFile('${tmp.replace(/\\/g, '/')}')
$w=$bmp.Width; $h=$bmp.Height
Write-Output "$w $h"
for($y=0;$y -lt $h;$y++){
  for($x=0;$x -lt $w;$x++){
    $c=$bmp.GetPixel($x,$y)
    Write-Output "$x $y $($c.R) $($c.G) $($c.B)"
  }
}
$bmp.Dispose()
`;
    const out = execSync(`powershell -NoProfile -Command "${ps.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, {
        encoding: 'utf8',
        maxBuffer: 20 * 1024 * 1024,
    });
    unlinkSync(tmp);
    const lines = out.trim().split(/\r?\n/);
    const [w, h] = lines[0].split(' ').map(Number);
    const pixels = new Map();
    for (let i = 1; i < lines.length; i++) {
        const [x, y, r, g, b] = lines[i].split(' ').map(Number);
        pixels.set(`${x},${y}`, { r, g, b });
    }
    return { w, h, pixels };
}

const tileCache = new Map();

async function elevAt(lat, lng) {
    const { tileX, tileY, pixelX, pixelY } = latLngToTilePixel(lat, lng);
    const key = `${tileX}/${tileY}`;
    if (!tileCache.has(key)) {
        const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/9/${tileX}/${tileY}.png`;
        tileCache.set(key, await samplePngPixels(url));
    }
    const tile = tileCache.get(key);
    const px = tile.pixels.get(`${pixelX},${pixelY}`);
    if (!px) return { lat, lng, tileX, tileY, pixelX, pixelY, elev: null };
    const elev = decode(px.r, px.g, px.b);
    return { lat, lng, tileX, tileY, pixelX, pixelY, elev, isSea: elev < 0 };
}

const points = [
    ['金石城(据点)', 34.2031, 129.2892],
    ['对马岛中段', 34.3, 129.32],
    ['对马岛北侧海上', 34.5, 129.35],
    ['对马海峡西侧', 34.25, 129.1],
];

console.log('=== DEM 点采样 ===');
for (const [name, lat, lng] of points) {
    const r = await elevAt(lat, lng);
    console.log(
        `${name}: elev=${r.elev?.toFixed(1)}m isSea=${r.isSea} tile=${r.tileX}/${r.tileY} px=${r.pixelX},${r.pixelY}`
    );
}

// 模拟陆海图层：hex 中心网格（与 GridSystem 类似步长）
const HEX_RADIUS = 0.15;
const latStep = HEX_RADIUS * 1.5;
const lngStep = HEX_RADIUS * 1.7;
const centerLat = 34.26;
const samples = [];
for (let lat = 33.95; lat <= 34.55; lat += latStep) {
    for (let lng = 129.0; lng <= 129.6; lng += lngStep) {
        const r = await elevAt(lat, lng);
        samples.push({ lat, lng, isSea: r.isSea, elev: r.elev });
    }
}
const seaCount = samples.filter((s) => s.isSea).length;
console.log(`\n=== 模拟 hex 网格采样 (${samples.length} 点) ===`);
console.log(`海域点: ${seaCount} (${((seaCount / samples.length) * 100).toFixed(0)}%)`);
console.log(`陆地点: ${samples.length - seaCount}`);
const city = await elevAt(34.2031, 129.2892);
console.log(`\n金石城 DEM: ${city.elev?.toFixed(1)}m → ${city.isSea ? '海' : '陆'}`);
