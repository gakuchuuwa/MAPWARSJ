import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { blendMaterialGrid } from '../src/map/StrategicTerrainMaterial';

const texture = (shift: number) => Uint8ClampedArray.from({ length: 128 * 128 * 4 },
    (_, i) => i % 4 === 3 ? 255 : (i * 7 + shift) % 256);
const a = texture(0), b = texture(91);
const grid = Array.from({ length: 9 * 9 }, (_, i) => (i % 9 + Math.floor(i / 9)) % 3 ? a : b);
const whole = blendMaterialGrid(grid, 9, 512, 512);
for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) {
    const local = Array.from({ length: 25 }, (_, i) => grid[(ty * 4 + Math.floor(i / 5)) * 9 + tx * 4 + i % 5]);
    const tile = blendMaterialGrid(local, 5, 256, 256);
    for (let y = 0; y < 256; y++) {
        const start = ((ty * 256 + y) * 512 + tx * 256) * 4;
        assert.deepEqual(tile.slice(y * 1024, (y + 1) * 1024), whole.slice(start, start + 1024));
    }
}
console.log('PASS: 四块独立瓦片逐像素等于整图渲染，材质不增加瓦片接缝');
const empty = blendMaterialGrid(Array(25).fill(null), 5, 256, 256);
assert.ok(empty.every(value => value === 0));
const partial = blendMaterialGrid([a, null, a, null], 2, 64, 64);
assert.equal(partial[3], 255);
assert.equal(partial[63 * 4 + 3], 4);
console.log('PASS: 缺失材质透明回退，边缘权重连续衰减');
const uniform = blendMaterialGrid(Array(25).fill(a), 5, 256, 256);
for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    assert.equal(uniform[(y * 256 + x) * 4], a[((y % 128) * 128 + x % 128) * 4]);
}
console.log('PASS: 同材质保留原始像素，平移采样确定');
for (let i = 0; i < 10; i++) blendMaterialGrid(grid.slice(0, 25), 5, 256, 256);
const start = performance.now();
for (let i = 0; i < 100; i++) blendMaterialGrid(grid.slice(0, 25), 5, 256, 256);
console.log(`材质混合 CPU: ${((performance.now() - start) / 100).toFixed(2)} ms/256px 瓦片（Node，非浏览器帧耗时）`);

// 执行实际 Worker 的纯像素渲染函数；隔离网络、消息监听，不复制渲染算法。
const source = readFileSync('src/workers/HillshadeWorker.ts', 'utf8').replace(/^import .*;\r?\n/gm, '');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const render = runInNewContext(js + '\nrenderHillshade;', { exports: {}, self: {}, Uint8ClampedArray, Float32Array });
const req = { width: 5, height: 5, params: { azimuth: 305, altitude: 45, zFactor: 27, opacity: 1, useElevationColor: true } };
const surface = new Uint8ClampedArray(5 * 5 * 4).fill(255);
const flat = (elevation: number) => Uint8ClampedArray.from({ length: 100 }, (_, i) =>
    i % 4 === 0 ? Math.floor((elevation + 32768) / 256) : i % 4 === 1 ? (elevation + 32768) % 256 : i % 4 === 3 ? 255 : 0);
for (const elevation of [-30, 0, 5500]) {
    assert.deepEqual(render(flat(elevation), req, null, surface), render(flat(elevation), req, null, null));
}
assert.notDeepEqual(render(flat(300), req, null, surface), render(flat(300), req, null, null));
assert.deepEqual(render(flat(300), req, null, new Uint8ClampedArray(100)), render(flat(300), req, null, null));
console.log('PASS: 实际 Worker 保持海水、海平面、高山雪地着色，陆地融合生效，透明材质回退一致');
