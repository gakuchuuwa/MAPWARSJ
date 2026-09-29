import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { readFileSync, existsSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import sharp from 'sharp';
import { queryBaseTile, setWorldBaseData } from '../src/ui/scene13/WorldBaseMap';
import { blendMaterialGrid, sampleClimateMaterials, materialOriginForTile, assembleTerrainMaterial } from '../src/map/StrategicTerrainMaterial';
import { NILE_ALLUVIAL_POLYGONS, NILE_VALLEY_EXP_BOUNDS } from '../src/data/HistoricalRegions';

const texture = (shift: number) => Uint8ClampedArray.from({ length: 128 * 128 * 4 },
    (_, i) => i % 4 === 3 ? 255 : (i * 7 + shift) % 256);
const a = [{ pixels: texture(0), weight: 1 }], b = [{ pixels: texture(91), weight: 1 }];
const grid = Array.from({ length: 9 * 9 }, (_, i) => (i % 9 + Math.floor(i / 9)) % 3 ? a : b);
const whole = blendMaterialGrid(grid, 9, 512, 512);
for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) {
    const local = Array.from({ length: 25 }, (_, i) => grid[(ty * 4 + Math.floor(i / 5)) * 9 + tx * 4 + i % 5]);
    const tile = blendMaterialGrid(local, 5, 256, 256, { gx9: tx * 256, gy9: ty * 256, scale: 1 });
    for (let y = 0; y < 256; y++) {
        const start = ((ty * 256 + y) * 512 + tx * 256) * 4;
        assert.deepEqual(tile.slice(y * 1024, (y + 1) * 1024), whole.slice(start, start + 1024));
    }
}
console.log('PASS: 四块独立瓦片逐像素等于整图渲染，材质不增加瓦片接缝');
// 放大档（zoom 10，双线性）同样无接缝
const whole10 = blendMaterialGrid(grid, 9, 512, 512, { gx9: 0, gy9: 0, scale: 0.5 });
for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) {
    const local = Array.from({ length: 25 }, (_, i) => grid[(ty * 4 + Math.floor(i / 5)) * 9 + tx * 4 + i % 5]);
    const tile = blendMaterialGrid(local, 5, 256, 256, { gx9: tx * 128, gy9: ty * 128, scale: 0.5 });
    for (let y = 0; y < 256; y++) {
        const start = ((ty * 256 + y) * 512 + tx * 256) * 4;
        assert.deepEqual(tile.slice(y * 1024, (y + 1) * 1024), whole10.slice(start, start + 1024));
    }
}
console.log('PASS: zoom 10 双线性取样，四块瓦片同样无接缝');
const empty = blendMaterialGrid(Array(25).fill([]), 5, 256, 256);
assert.ok(empty.every(value => value === 0));
const partial = blendMaterialGrid([a, [], a, []], 2, 64, 64);
assert.equal(partial[3], 255);
assert.equal(partial[63 * 4 + 3], 4);
console.log('PASS: 缺失材质透明回退，边缘权重连续衰减');
// 🔴 2026-09-30：贴图改按地理坐标取样，不再「每 128 屏幕像素重复一次」
const o9 = materialOriginForTile(9, 421, 203);
const uniform = blendMaterialGrid(Array(25).fill(a), 5, 256, 256, o9);
assert.deepEqual(uniform, blendMaterialGrid(Array(25).fill(a), 5, 256, 256, o9));
let same128 = 0;
for (let y = 0; y < 256; y++) for (let x = 0; x < 128; x++) {
    if (uniform[(y * 256 + x) * 4] === uniform[(y * 256 + x + 128) * 4]) same128++;
    // 同材质时每个输出像素都来自该纹理的某个纹素
    assert.equal(uniform[(y * 256 + x) * 4 + 3], 255);
}
assert.ok(same128 < 256 * 128 * 0.5, `128px 平移后仍有 ${same128} 个像素相同，重复感未消除`);
// 同一地点在 zoom 8 与 zoom 9 取到同一处纹理（换算后），缩放不「呼吸」
const z8 = blendMaterialGrid(Array(25).fill(a), 5, 256, 256, materialOriginForTile(8, 210, 101));
const z9 = blendMaterialGrid(Array(25).fill(a), 5, 256, 256, materialOriginForTile(9, 420, 202));
const lum = (p: Uint8ClampedArray) => { let s = 0; for (let i = 0; i < p.length; i += 4) s += p[i]; return s / (p.length / 4); };
assert.ok(Math.abs(lum(z8) - lum(z9)) < 20);
console.log(`PASS: 同材质按地理坐标确定取样，128px 平移相同像素 ${(same128 / (256 * 128) * 100).toFixed(1)}%（旧版 100%）`);
const lookup = (_lat: number, lng: number) => lng < 0 ? 'grass' : 'sand';
const left = sampleClimateMaterials(0, -0.01, 2160, 1080, lookup);
const right = sampleClimateMaterials(0, 0.01, 2160, 1080, lookup);
assert.ok(Math.abs(left.get('grass')! - right.get('grass')!) < 0.13);
assert.equal(sampleClimateMaterials(0, 0, 2160, 1080, lookup).get('grass'), 0.5);
for (const lat of [-90, -60, 0, 60, 90]) {
    const west = sampleClimateMaterials(lat, -180, 2160, 1080, lookup);
    const east = sampleClimateMaterials(lat, 180, 2160, 1080, lookup);
    assert.deepEqual(west, east);
    assert.ok(Math.abs([...west.values()].reduce((sum, w) => sum + w, 0) - 1) < 1e-10);
}
console.log('PASS: 全球气候交界连续渐变，±180°一致，南北极权重有效');
const world = await sharp('public/world/world-base.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
setWorldBaseData(new Uint8ClampedArray(world.data), world.info.width, world.info.height);
const used = new Set<string>();
let landSamples = 0;
for (let lat = -87.5; lat <= 87.5; lat += 5) for (let lng = -177.5; lng <= 177.5; lng += 5) {
    const weights = sampleClimateMaterials(lat, lng, world.info.width, world.info.height,
        (lat, lng) => queryBaseTile({ lat, lng, isSiege: false, isWinter: false }));
    if (weights.size) landSamples++;
    for (const [name, weight] of weights) {
        assert.ok(Number.isFinite(weight) && weight > 0 && weight <= 1);
        assert.ok(existsSync(`public/SUCAI_TERRAIN/${name}.png`), `缺少全球材质 ${name}`);
        used.add(name);
    }
}
assert.ok(landSamples > 0);
console.log(`PASS: 全球 5° 网格实测 ${landSamples} 个有地表采样点，${used.size} 种引用材质全部存在`);
for (let i = 0; i < 10; i++) blendMaterialGrid(grid.slice(0, 25), 5, 256, 256, o9);
const start = performance.now();
for (let i = 0; i < 100; i++) blendMaterialGrid(grid.slice(0, 25), 5, 256, 256, o9);
console.log(`材质混合 CPU: ${((performance.now() - start) / 100).toFixed(2)} ms/256px 瓦片（Node，非浏览器帧耗时）`);

// 执行实际 Worker 的纯像素渲染函数；隔离网络、消息监听，不复制渲染算法。
const source = readFileSync('src/workers/HillshadeWorker.ts', 'utf8').replace(/^import .*;\r?\n/gm, '');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const render = runInNewContext(js + '\nrenderHillshade;', { exports: {}, self: {}, Uint8ClampedArray, Float32Array, NILE_ALLUVIAL_POLYGONS, NILE_VALLEY_EXP_BOUNDS });
const req = { width: 5, height: 5, params: { azimuth: 305, altitude: 45, zFactor: 27, opacity: 1, useElevationColor: true } };
// 5×5 测试瓦片的材质：气候层 + 指定的规则贴图（128px 纯色）
const solid = (v: number) => Uint8ClampedArray.from({ length: 128 * 128 * 4 }, (_, i) => i % 4 === 3 ? 255 : v);
const mat = (climate: Uint8ClampedArray, rules: Record<string, number> = {}) => assembleTerrainMaterial(
    climate as Uint8ClampedArray<ArrayBuffer>, new Map(Object.entries(rules).map(([k, v]) => [k, solid(v)])), 5, 5, materialOriginForTile(9, 400, 200));
const surface = mat(new Uint8ClampedArray(5 * 5 * 4).fill(255));
const flat = (elevation: number) => Uint8ClampedArray.from({ length: 100 }, (_, i) =>
    i % 4 === 0 ? Math.floor((elevation + 32768) / 256) : i % 4 === 1 ? (elevation + 32768) % 256 : i % 4 === 3 ? 255 : 0);
// 海水须带水体掩膜：无掩膜时低于海平面按陆地上色（里海低地/吐鲁番盆地，2026-07-28 规则）
const seaMask = new Uint8Array(25).fill(1);
for (const [elevation, mask] of [[-30, seaMask], [0, null], [5500, null]] as const) {
    assert.deepEqual(render(flat(elevation), req, mask, surface), render(flat(elevation), req, mask, null));
}
assert.notDeepEqual(render(flat(300), req, null, surface), render(flat(300), req, null, null));
assert.deepEqual(render(flat(300), req, null, mat(new Uint8ClampedArray(100))), render(flat(300), req, null, null));
console.log('PASS: 实际 Worker 保持海水、海平面、高山雪地着色，陆地融合生效，透明材质回退一致');
// 坡面岩石：平地不混岩石；陡坡混入
const rockOnly = mat(new Uint8ClampedArray(100), { rck: 90 });
assert.deepEqual(render(flat(1200), req, null, rockOnly), render(flat(1200), req, null, null));
const slopeDem = Uint8ClampedArray.from({ length: 100 }, (_, i) => {
    const e = 1200 + ((i >> 2) % 5) * 400;   // 每像素升 400m，远超 0.55 坡度
    return i % 4 === 0 ? Math.floor((e + 32768) / 256) : i % 4 === 1 ? (e + 32768) % 256 : i % 4 === 3 ? 255 : 0;
});
const slopeReq = { ...req, coords: { z: 9, x: 400, y: 200 } };
assert.notDeepEqual(render(slopeDem, slopeReq, null, rockOnly), render(slopeDem, slopeReq, null, null));
console.log('PASS: 坡面岩石只作用于陡坡，平地不变');
// 海水贴图：带水体掩膜的海面按水深铺 DE 海水；陆地不受海水贴图影响
const seaTex = mat(new Uint8ClampedArray(100), { wt2: 40, wt4: 20, wt3: 60, wt5: 90 });
assert.notDeepEqual(render(flat(-800), slopeReq, seaMask, seaTex), render(flat(-800), slopeReq, seaMask, null));
assert.deepEqual(render(flat(300), slopeReq, null, seaTex), render(flat(300), slopeReq, null, mat(new Uint8ClampedArray(100))));
console.log('PASS: 海面按水深铺 DE 海水贴图，陆地不受影响');
