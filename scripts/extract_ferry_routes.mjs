/**
 * extract_ferry_routes.mjs — 从 Natural Earth 全球路网中提取海上渡口航线
 *
 * NE 的 ne_10m_roads 里带 type='Ferry Route'（海上渡口，如英吉利海峡/地中海/日本海等短渡）
 * 与 type='Ferry, seasonal'（季节性渡口）。这些是现成的"海路"数据，喂给独立的海路编辑器。
 *
 * 用法: node scripts/extract_ferry_routes.mjs
 * 输出: public/assets/sea_routes.geojson
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT = path.join(__dirname, 'source-data/ne_10m_roads.geojson');
const OUTPUT = path.join(__dirname, '../public/assets/sea_routes.geojson');

const data = JSON.parse(fs.readFileSync(INPUT, 'utf8'));

const ferry = data.features.filter(f => {
    const t = f?.properties?.type;
    return t === 'Ferry Route' || t === 'Ferry, seasonal';
});

const out = {
    type: 'FeatureCollection',
    meta: {
        generated: new Date().toISOString(),
        count: ferry.length,
        source: 'Natural Earth ne_10m_roads (Ferry Route / Ferry, seasonal)'
    },
    features: ferry
};

fs.writeFileSync(OUTPUT, JSON.stringify(out));
console.log(`✓ 提取 ${ferry.length} 条海上渡口航线 → ${OUTPUT}`);
