/**
 * 用项目真实 GridSystem 探测对马 hex 中心 DEM
 */
import { writeFileSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
// 直接读编译前较麻烦，内联复制 GridSystem 关键常量
const HEX_RADIUS = 0.15;
const ORIGIN = { lat: 34.26, lng: 108.94 };
const PROJECTION_FACTOR = 1 / Math.cos((34.26 * Math.PI) / 180);

function hexToLatLng(q, r, center) {
    const dist = Math.sqrt(3) * HEX_RADIUS;
    const x_offset = q * dist * Math.cos(0) + r * dist * Math.cos(Math.PI / 3);
    const y_offset = q * dist * Math.sin(0) + r * dist * Math.sin(Math.PI / 3);
    const lng_offset = x_offset * PROJECTION_FACTOR;
    return { lat: center.lat + y_offset, lng: center.lng + lng_offset };
}

function roundToHex(lat, lng, center) {
    const y = lat - center.lat;
    const x = (lng - center.lng) / PROJECTION_FACTOR;
    const dist = Math.sqrt(3) * HEX_RADIUS;
    const r = y / (dist * Math.sin(Math.PI / 3));
    const q = (x - r * dist * Math.cos(Math.PI / 3)) / dist;
    let x_cube = q;
    let z_cube = r;
    let y_cube = -x_cube - z_cube;
    let rx = Math.round(x_cube);
    let ry = Math.round(y_cube);
    let rz = Math.round(z_cube);
    const x_diff = Math.abs(rx - x_cube);
    const y_diff = Math.abs(ry - y_cube);
    const z_diff = Math.abs(rz - z_cube);
    if (x_diff > y_diff && x_diff > z_diff) rx = -ry - rz;
    else if (y_diff > z_diff) ry = -rx - rz;
    else rz = -rx - ry;
    return hexToLatLng(rx, rz, center);
}

function getHexesInBounds(latMin, latMax, lngMin, lngMax, center) {
    const latStep = HEX_RADIUS * 1.5;
    const lngStep = HEX_RADIUS * 1.7;
    const unique = new Map();
    for (let lat = latMin - latStep; lat <= latMax + latStep; lat += latStep) {
        for (let lng = lngMin - lngStep; lng <= lngMax + lngStep; lng += lngStep) {
            const hex = roundToHex(lat, lng, center);
            unique.set(`${hex.lat.toFixed(4)},${hex.lng.toFixed(4)}`, hex);
        }
    }
    return [...unique.values()];
}

const decode = (r, g, b) => r * 256 + g + b * 0.00390625 - 32768;

function latLngToTilePixel(lat, lng) {
    const zoom = 9;
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

const tiles = new Map();
async function elevAt(lat, lng) {
    const { tileX, tileY, pixelX, pixelY } = latLngToTilePixel(lat, lng);
    const key = `${tileX}/${tileY}`;
    if (!tiles.has(key)) {
        const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/9/${tileX}/${tileY}.png`;
        const tmp = `scripts/_tile_${key.replace('/', '_')}.png`;
        writeFileSync(tmp, Buffer.from(await (await fetch(url)).arrayBuffer()));
        tiles.set(key, tmp);
    }
    const ps = `Add-Type -AssemblyName System.Drawing; $b=[System.Drawing.Bitmap]::FromFile('C:/MAPWARSJ/${tiles.get(key)}'); $c=$b.GetPixel(${pixelX},${pixelY}); Write-Output "$($c.R) $($c.G) $($c.B)"; $b.Dispose()`;
    const [r, g, b] = execSync(`powershell -NoProfile -Command "${ps}"`, { encoding: 'utf8' })
        .trim()
        .split(/\s+/)
        .map(Number);
    const elev = decode(r, g, b);
    return { elev, isSea: elev < 0 };
}

const hexes = getHexesInBounds(33.95, 34.55, 129.0, 129.55, ORIGIN);
console.log('hex 数:', hexes.length);

const city = { lat: 34.2031, lng: 129.2892 };
const cityHex = roundToHex(city.lat, city.lng, ORIGIN);
const cityDirect = await elevAt(city.lat, city.lng);
const cityHexElev = await elevAt(cityHex.lat, cityHex.lng);

console.log(`\n金石城坐标 (${city.lat}, ${city.lng}): ${cityDirect.elev.toFixed(1)}m → ${cityDirect.isSea ? '海' : '陆'}`);
console.log(`所属 hex 中心 (${cityHex.lat.toFixed(4)}, ${cityHex.lng.toFixed(4)}): ${cityHexElev.elev.toFixed(1)}m → ${cityHexElev.isSea ? '海' : '陆'}`);

let sea = 0;
for (const h of hexes) {
    const s = await elevAt(h.lat, h.lng);
    const marker = s.isSea ? '海' : '陆';
    if (s.isSea) sea++;
    const near = Math.abs(h.lat - city.lat) < 0.3 && Math.abs(h.lng - city.lng) < 0.3 ? ' ★近对马' : '';
    console.log(`hex (${h.lat.toFixed(3)}, ${h.lng.toFixed(3)}): ${s.elev.toFixed(1)}m ${marker}${near}`);
}
console.log(`\n视口 ${hexes.length} 个 hex 中 ${sea} 个中心判为海`);

for (const t of tiles.values()) try { unlinkSync(t); } catch {}
