/**
 * build_sea_routes.mjs — 合并全球航运线 + NE 渡轮 → 海路网 sea_routes.geojson
 *
 * 输入:
 *   scripts/source-data/shipping_lanes_v1.geojson  (CIA 全球航运线, 3 条 MultiLineString)
 *   scripts/source-data/ne_10m_roads.geojson       (Natural Earth 路网, 提 Ferry Route)
 * 输出:
 *   public/assets/sea_routes.geojson
 *
 * 每条 feature 打标:
 *   source: 'shipping_lane' | 'ferry'
 *   laneType: 'Major' | 'Middle' | 'Minor' | 'Ferry Route' | 'Ferry, seasonal'
 *
 * 航运线按 MultiLineString 拆成单条 LineString，便于海路编辑器逐条寻路/渲染/删除。
 * 保留全部（含苏伊士/巴拿马运河），由主人自行判断取舍。
 *
 * 用法: node scripts/build_sea_routes.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SHIPPING_IN = path.join(__dirname, 'source-data/shipping_lanes_v1.geojson');
const NE_ROADS_IN = path.join(__dirname, 'source-data/ne_10m_roads.geojson');
const OUTPUT = path.join(__dirname, '../public/assets/sea_routes.geojson');

// ===== 1. 全球航运线：拆 MultiLineString → 单条 LineString =====
const shipping = JSON.parse(fs.readFileSync(SHIPPING_IN, 'utf8'));
const shippingFeatures = [];
for (const f of shipping.features) {
    const laneType = f.properties?.Type || 'Unknown'; // 'Major' | 'Middle' | 'Minor'
    const g = f.geometry;
    if (!g) continue;
    const lines = g.type === 'MultiLineString' ? g.coordinates : [g.coordinates];
    for (const line of lines) {
        if (!Array.isArray(line) || line.length < 2) continue;
        shippingFeatures.push({
            type: 'Feature',
            properties: {
                id: `lane_${String(laneType).toLowerCase()}_${shippingFeatures.length}`,
                source: 'shipping_lane',
                laneType,
                name: null
            },
            geometry: { type: 'LineString', coordinates: line }
        });
    }
}

// ===== 2. NE 渡轮 =====
const ne = JSON.parse(fs.readFileSync(NE_ROADS_IN, 'utf8'));
const ferryFeatures = ne.features
    .filter(f => f?.properties?.type === 'Ferry Route' || f?.properties?.type === 'Ferry, seasonal')
    .map((f, i) => ({
        type: 'Feature',
        properties: {
            id: `ferry_${i}`,
            source: 'ferry',
            laneType: f.properties.type,
            name: f.properties.name || null
        },
        geometry: f.geometry
    }));

// ===== 3. 合并输出 =====
const all = [...shippingFeatures, ...ferryFeatures];
const out = {
    type: 'FeatureCollection',
    meta: {
        generated: new Date().toISOString(),
        shippingLanes: shippingFeatures.length,
        ferries: ferryFeatures.length,
        total: all.length,
        source: 'CIA Global Shipping Lanes (newzealandpaul/Shipping-Lanes) + Natural Earth Ferry Route'
    },
    features: all
};

fs.writeFileSync(OUTPUT, JSON.stringify(out));
console.log(`✓ 航运线 ${shippingFeatures.length} + 渡轮 ${ferryFeatures.length} = 共 ${all.length} 条 → ${OUTPUT}`);
