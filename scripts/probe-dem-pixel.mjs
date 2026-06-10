import { writeFileSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
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

async function readPixel(lat, lng) {
    const { tileX, tileY, pixelX, pixelY } = latLngToTilePixel(lat, lng);
    const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/9/${tileX}/${tileY}.png`;
    const tmp = join(__dir, '_t.png');
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    writeFileSync(tmp, buf);
    const ps = [
        'Add-Type -AssemblyName System.Drawing',
        `$b=[System.Drawing.Bitmap]::FromFile('${tmp.replace(/\\/g, '/')}')`,
        `$c=$b.GetPixel(${pixelX},${pixelY})`,
        'Write-Output "$($c.R) $($c.G) $($c.B)"',
        '$b.Dispose()',
    ].join('; ');
    const rgb = execSync(`powershell -NoProfile -Command "${ps}"`, { encoding: 'utf8' }).trim();
    unlinkSync(tmp);
    const [r, g, b] = rgb.split(/\s+/).map(Number);
    const elev = decode(r, g, b);
    return { lat, lng, tileX, tileY, pixelX, pixelY, r, g, b, elev, isSea: elev < 0 };
}

const pts = [
    ['金石城', 34.2031, 129.2892],
    ['岛中心偏北', 34.35, 129.32],
    ['岛西侧海上', 34.25, 129.15],
    ['岛东侧海上', 34.25, 129.45],
    ['截图可见绿岛中心', 34.28, 129.30],
];

for (const [name, lat, lng] of pts) {
    const s = await readPixel(lat, lng);
    console.log(
        `${name}: ${s.elev.toFixed(1)}m → ${s.isSea ? '海' : '陆'} (tile ${s.tileX}/${s.tileY} px ${s.pixelX},${s.pixelY})`
    );
}
