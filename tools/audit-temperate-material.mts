import assert from 'node:assert/strict';
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { sampleClimateMaterials, varyTemperateMaterials, blendMaterialGrid } from '../src/map/StrategicTerrainMaterial';
import { setWorldBaseData, queryBaseTile } from '../src/ui/scene13/WorldBaseMap';

const world = await sharp('public/world/world-base.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
setWorldBaseData(new Uint8ClampedArray(world.data), world.info.width, world.info.height);
const lookup = (lat: number, lng: number) => queryBaseTile({ lat, lng, isSiege: false, isWinter: false });
const affected = new Set(['grs', 'gr2', 'for']);
let samples = 0, changed = 0;
for (let lat = -89.5; lat < 90; lat += 1) for (let lng = -179.5; lng < 180; lng += 1) {
    const before = sampleClimateMaterials(lat, lng, world.info.width, world.info.height, lookup);
    const after = varyTemperateMaterials(before, lat, lng);
    assert.ok(Math.abs([...before.values()].reduce((a, b) => a + b, 0)
        - [...after.values()].reduce((a, b) => a + b, 0)) < 1e-10);
    for (const [name, weight] of after) {
        assert.ok(Number.isFinite(weight) && weight >= 0 && weight <= 1);
        if (!affected.has(name)) assert.equal(weight, before.get(name));
    }
    if (![...before.keys()].some(name => affected.has(name))) assert.deepEqual(after, before);
    else changed++;
    samples++;
}
for (const lat of [-80, -35, 0, 35, 80]) {
    const input = new Map([['gr2', 0.4], ['for', 0.6]]);
    assert.deepEqual(varyTemperateMaterials(input, lat, -180), varyTemperateMaterials(input, lat, 180));
    const a = varyTemperateMaterials(input, lat, 179.999999);
    const b = varyTemperateMaterials(input, lat, -179.999999);
    for (const [name, weight] of a) assert.ok(Math.abs(weight - b.get(name)!) < 1e-5);
}
console.log(`PASS: 全球 ${samples} 个采样，${changed} 个温带混合点；其余材质权重不变，日期变更线连续。`);

const cache = new Map<string, Uint8ClampedArray>();
async function pixels(name: string) {
    if (!cache.has(name)) cache.set(name, new Uint8ClampedArray(await sharp(`public/SUCAI_TERRAIN/${name}.png`).resize(128, 128).ensureAlpha().raw().toBuffer()));
    return cache.get(name)!;
}
const regions: [string, number, number][] = [
    ['Asia - temperate plain', 35, 115], ['Europe - temperate', 49, 10],
    ['Africa - Sahara', 24, 15], ['North America - prairie', 41, -98],
    ['South America - Pampas', -35, -60], ['Oceania - southeast Australia', -35, 147],
    ['Asia - tropical', 15, 102], ['Africa - savanna', -3, 35],
    ['South America - Amazon', -4, -62], ['Asia - highland', 33, 87],
    ['North America - cold region', 66, -135], ['Europe - Mediterranean', 39, 23],
];
const composites: sharp.OverlayOptions[] = [];
for (let i = 0; i < regions.length; i++) {
    const [name, lat, lng] = regions[i];
    const nodes = Array.from({ length: 81 }, (_, n) => {
        const latitude = lat + 3 - Math.floor(n / 9) * 0.75;
        const longitude = lng - 3 + n % 9 * 0.75;
        const before = sampleClimateMaterials(latitude, longitude, world.info.width, world.info.height, lookup);
        return { before, after: varyTemperateMaterials(before, latitude, longitude) };
    });
    for (const side of ['before', 'after'] as const) {
        const grid = await Promise.all(nodes.map(async node => Promise.all([...node[side]].map(async ([tile, weight]) => ({ pixels: await pixels(tile), weight })))));
        const whole = blendMaterialGrid(grid, 9, 512, 512);
        if (side === 'after') {
            for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) {
                const local = Array.from({ length: 25 }, (_, n) => grid[(ty * 4 + Math.floor(n / 5)) * 9 + tx * 4 + n % 5]);
                const tile = blendMaterialGrid(local, 5, 256, 256);
                for (let y = 0; y < 256; y++) {
                    const start = ((ty * 256 + y) * 512 + tx * 256) * 4;
                    assert.deepEqual(tile.slice(y * 1024, (y + 1) * 1024), whole.slice(start, start + 1024));
                }
            }
        }
        const image = await sharp(whole, { raw: { width: 512, height: 512, channels: 4 } }).resize(240, 190).png().toBuffer();
        const left = (i % 3) * 500 + (side === 'before' ? 0 : 250);
        const top = Math.floor(i / 3) * 230;
        const label = Buffer.from(`<svg width="240" height="30"><text x="5" y="18" fill="#eee" font-family="sans-serif" font-size="11">${name} / ${side}</text></svg>`);
        composites.push({ input: label, left, top }, { input: image, left, top: top + 30 });
    }
    console.log(`PASS: ${name}，修改后四块瓦片与整幅逐像素一致。`);
}
mkdirSync('scratch/terrain-review', { recursive: true });
await sharp({ create: { width: 1500, height: 920, channels: 4, background: '#20251f' } }).composite(composites).png().toFile('scratch/terrain-review/global-material-comparison.png');
console.log('全球材质对照图：scratch/terrain-review/global-material-comparison.png（材质层，未叠山体光照）');
