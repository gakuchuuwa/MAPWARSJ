
/**
 * DEPRECATED - this script is no longer needed.
 * 
 * It generated base_network.geojson (5km-decimated NE simplification)
 * used as a visual reference overlay. It served no real purpose and
 * could mislead accuracy expectations.
 * 
 * The editor Dijkstra pathfinding uses assets/roads_filtered.geojson
 * at full precision. This script"s output is not consumed anywhere.
 * 
 * Kept for reference only. Do not run.
 */
/**
 * build_base_network.mjs
 *
 * Phase 1: 把 Natural Earth + 现有手画路 (VectorRoadData.ts) 合并成一张
 *          统一的"基础路网" geojson，给运行时和编辑器消费。
 *
 * 输入:
 *   - public/assets/roads_filtered.geojson  (NE, 已过滤到亚洲范围，14MB)
 *   - src/data/VectorRoadData.ts            (你手画的 364 条)
 *
 * 输出:
 *   - public/assets/base_network.geojson
 *
 * 处理:
 *   1) NE 按 type 过滤 (剔除 Track / Unknown)
 *   2) 每条线按 5km 间隔稀疏化 (大幅瘦身，不损失走向)
 *   3) 手画路保持原样合并进来 (source: 'manual')
 *   4) 给每条 feature 加 source 标签 ('ne' | 'manual')，便于后续编辑器区分颜色
 *
 * 用法:  node scripts/build_base_network.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NE_INPUT     = path.join(__dirname, '../public/assets/roads_filtered.geojson');
const VECTOR_INPUT = path.join(__dirname, '../src/data/VectorRoadData.ts');
const OUTPUT       = path.join(__dirname, '../public/assets/base_network.geojson');

// 想剔除的低质量类型
const EXCLUDE_TYPES = new Set(['Track', 'Unknown', 'Ferry Route', 'Expressway']);

// 稀疏化阈值 (km)
const DECIMATE_KM = 5;

// ========== 几何工具 ==========

function distKm([lng1, lat1], [lng2, lat2]) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function lineLengthKm(coords) {
    let sum = 0;
    for (let i = 0; i < coords.length - 1; i++) sum += distKm(coords[i], coords[i + 1]);
    return sum;
}

/** 保留首尾，中间按 minDistKm 间隔取点 */
function decimate(coords, minDistKm) {
    if (coords.length <= 2) return coords;
    const out = [coords[0]];
    let last = coords[0];
    for (let i = 1; i < coords.length - 1; i++) {
        if (distKm(last, coords[i]) >= minDistKm) {
            out.push(coords[i]);
            last = coords[i];
        }
    }
    out.push(coords[coords.length - 1]);
    return out;
}

// ========== 加载 NE ==========

function loadNERoads() {
    console.log(`[1/4] 加载 NE: ${NE_INPUT}`);
    const raw = fs.readFileSync(NE_INPUT, 'utf8');
    const data = JSON.parse(raw);
    const total = data.features.length;
    console.log(`      原始: ${total} 条`);

    // 统计类型分布
    const typeCount = {};
    for (const f of data.features) {
        const t = f.properties?.type || 'null';
        typeCount[t] = (typeCount[t] || 0) + 1;
    }
    console.log(`      类型分布:`);
    for (const [t, n] of Object.entries(typeCount).sort((a, b) => b[1] - a[1])) {
        const mark = EXCLUDE_TYPES.has(t) ? '❌' : '✅';
        console.log(`         ${mark} ${t.padEnd(20)} ${n}`);
    }

    // 类型过滤 + LineString/MultiLineString 拆分
    const out = [];
    let dropPoints = 0, keepPoints = 0;

    for (const f of data.features) {
        const t = f.properties?.type;
        if (EXCLUDE_TYPES.has(t)) continue;
        if (!f.geometry) continue;

        const lines = f.geometry.type === 'LineString'
            ? [f.geometry.coordinates]
            : f.geometry.type === 'MultiLineString'
                ? f.geometry.coordinates
                : [];

        for (const line of lines) {
            if (!line || line.length < 2) continue;
            const before = line.length;
            const decimated = decimate(line, DECIMATE_KM);
            dropPoints += before;
            keepPoints += decimated.length;

            out.push({
                type: 'Feature',
                properties: {
                    source: 'ne',
                    type: t || 'Road',
                    length_km: Math.round(lineLengthKm(decimated) * 10) / 10,
                },
                geometry: { type: 'LineString', coordinates: decimated }
            });
        }
    }

    console.log(`      过滤+稀疏化后: ${out.length} 条`);
    console.log(`      点数: ${dropPoints} → ${keepPoints} (减 ${(100 * (1 - keepPoints / dropPoints)).toFixed(0)}%)`);
    return out;
}

// ========== 加载手画路 ==========

function loadVectorRoads() {
    console.log(`[2/4] 加载手画路: ${VECTOR_INPUT}`);
    let src = fs.readFileSync(VECTOR_INPUT, 'utf8');

    // 砍掉 interface 块
    src = src.replace(/export\s+interface\s+VectorRoadFeature[\s\S]*?^\}\s*$/m, '');
    // 砍掉 export const 的类型标注
    src = src.replace(/export\s+const\s+VECTOR_ROAD_DATA\s*:[^=]+=/, 'const VECTOR_ROAD_DATA =');
    // 包成可执行函数
    src += '\nreturn VECTOR_ROAD_DATA;';

    let data;
    try {
        const fn = new Function(src);
        data = fn();
    } catch (e) {
        console.error('      ❌ TS 解析失败:', e.message);
        console.error('      Hint: VectorRoadData.ts 格式可能变了，需要手动修改本脚本的 strip 逻辑');
        process.exit(1);
    }

    console.log(`      手画路: ${data.features.length} 条`);

    return data.features.map(f => ({
        type: 'Feature',
        properties: {
            source: 'manual',
            name: f.properties.name,
            id: f.properties.id,
            startConnection: f.properties.startConnection,
            endConnection: f.properties.endConnection,
            type: 'manual',
            length_km: Math.round(lineLengthKm(f.geometry.coordinates) * 10) / 10,
        },
        geometry: { type: 'LineString', coordinates: f.geometry.coordinates }
    }));
}

// ========== 主流程 ==========

function main() {
    const t0 = Date.now();
    const ne = loadNERoads();
    const manual = loadVectorRoads();

    console.log(`[3/4] 合并...`);
    const all = [...ne, ...manual];

    const out = {
        type: 'FeatureCollection',
        meta: {
            generated: new Date().toISOString(),
            neCount: ne.length,
            manualCount: manual.length,
            total: all.length,
            decimateKm: DECIMATE_KM,
            excludedTypes: [...EXCLUDE_TYPES],
        },
        features: all,
    };

    console.log(`[4/4] 写入 ${OUTPUT}`);
    fs.writeFileSync(OUTPUT, JSON.stringify(out));
    const sizeKB = (fs.statSync(OUTPUT).size / 1024).toFixed(0);

    console.log(`\n✅ 完成 (${Date.now() - t0}ms)`);
    console.log(`   NE 路:       ${ne.length}`);
    console.log(`   手画路:      ${manual.length}`);
    console.log(`   总计:        ${all.length} 条`);
    console.log(`   文件大小:    ${sizeKB} KB`);
    console.log(`   输出位置:    public/assets/base_network.geojson`);
}

main();
