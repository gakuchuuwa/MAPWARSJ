import { writeFileSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const decode = (r, g, b) => r * 256 + g + b * 0.00390625 - 32768;
const HEX_RADIUS = 0.15;
const ORIGIN = { lat: 34.26, lng: 108.94 };
const PROJECTION_FACTOR = 1 / Math.cos((34.26 * Math.PI) / 180);

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

const tileCache = new Map();

async function elevAt(lat, lng) {
    const { tileX, tileY, pixelX, pixelY } = latLngToTilePixel(lat, lng);
    const key = `${tileX}/${tileY}`;
    if (!tileCache.has(key)) {
        const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/9/${tileX}/${tileY}.png`;
        const tmp = join(__dir, `_t_${key.replace('/', '_')}.png`);
        writeFileSync(tmp, Buffer.from(await (await fetch(url)).arrayBuffer()));
        tileCache.set(key, tmp);
    }
    const tmp = tileCache.get(key);
    const ps = [
        'Add-Type -AssemblyName System.Drawing',
        `$b=[System.Drawing.Bitmap]::FromFile('${tmp.replace(/\\/g, '/')}')`,
        `$c=$b.GetPixel(${pixelX},${pixelY})`,
        'Write-Output "$($c.R) $($c.G) $($c.B)"',
        '$b.Dispose()',
    ].join('; ');
    const rgb = execSync(`powershell -NoProfile -Command "${ps}"`, { encoding: 'utf8' }).trim();
    const [r, g, b] = rgb.split(/\s+/).map(Number);
    const elev = decode(r, g, b);
    return { lat, lng, elev, isSea: elev < 0 };
}

// 复制 GridSystem.roundToHex / getHexesInBounds 逻辑
function latLngToAxial(lat, lng, center) {
    const dist = Math.sqrt(3) * HEX_RADIUS;
    const dx = (lng - center.lng) / PROJECTION_FACTOR;
    const dy = lat - center.lat;
    const q = ((Math.sqrt(3) / 3) * dx - (1 / 3) * dy) / dist;
    const r = ((2 / 3) * dy) / dist;
    return axialRound(q, r);
}

function axialRound(q, r) {
    const s = -q - r;
    let rq = Math.round(q);
    let rr = Math.round(r);
    const rs = Math.round(s);
    const qDiff = Math.abs(rq - q);
    const rDiff = Math.abs(rr - r);
    const sDiff = Math.abs(rs - s);
    if (qDiff > rDiff && qDiff > sDiff) rq = -rr - rs;
    else if (rDiff > sDiff) rr = -rq - rs;
    return { q: rq, r: rr };
}

function hexToLatLng(q, r, center) {
    const dist = Math.sqrt(3) * HEX_RADIUS;
    const x_offset = q * dist * Math.cos(0) + r * dist * Math.cos(Math.PI / 3);
    const y_offset = q * dist * Math.sin(0) + r * dist * Math.sin(Math.PI / 3);
    const lng_offset = x_offset * PROJECTION_FACTOR;
    return { lat: center.lat + y_offset, lng: center.lng + lng_offset };
}

function roundToHex(lat, lng, center) {
    const { q, r } = latLngToAxial(lat, lng, center);
    return hexToLatLng(q, r, center);
}

// 对马岛视口近似（截图范围）
const latMin = 33.95;
const latMax = 34.55;
const lngMin = 129.0;
const lngMax = 129.55;
const latStep = HEX_RADIUS * 1.5;
const lngStep = HEX_RADIUS * 1.7;
const unique = new Map();

for (let lat = latMin - latStep; lat <= latMax + latStep; lat += latStep) {
    for (let lng = lngMin - lngStep; lng <= lngMax + lngStep; lng += lngStep) {
        const hex = roundToHex(lat, lng, ORIGIN);
        const key = `${hex.lat.toFixed(4)},${hex.lng.toFixed(4)}`;
        unique.set(key, hex);
    }
}

console.log(`视口内 hex 中心数: ${unique.size}`);
let sea = 0;
let land = 0;
const nearCity = [];

for (const hex of unique.values()) {
    const s = await elevAt(hex.lat, hex.lng);
    if (s.isSea) sea++;
    else land++;
    const dCity = Math.hypot(hex.lat - 34.2031, (hex.lng - 129.2892) * PROJECTION_FACTOR);
    if (dCity < 0.2) {
        nearCity.push({ ...hex, elev: s.elev, isSea: s.isSea });
    }
}

console.log(`海 hex 中心: ${sea}, 陆 hex 中心: ${land}`);
console.log('\n靠近金石城(0.2°内)的 hex 中心:');
for (const h of nearCity.sort((a, b) => a.elev - b.elev)) {
    console.log(
        `  (${h.lat.toFixed(4)}, ${h.lng.toFixed(4)}) elev=${h.elev.toFixed(1)}m → ${h.isSea ? '海' : '陆'}`
    );
}

const cityHex = roundToHex(34.2031, 129.2892, ORIGIN);
const citySample = await elevAt(cityHex.lat, cityHex.lng);
console.log(`\n金石城坐标 snap 到的 hex 中心: (${cityHex.lat.toFixed(4)}, ${cityHex.lng.toFixed(4)})`);
console.log(`该 hex 中心 DEM: ${citySample.elev.toFixed(1)}m → ${citySample.isSea ? '海' : '陆'}`);
console.log(`金石城真实坐标 DEM: ${(await elevAt(34.2031, 129.2892)).elev.toFixed(1)}m`);

for (const tmp of tileCache.values()) {
    try {
        unlinkSync(tmp);
    } catch {}
}
