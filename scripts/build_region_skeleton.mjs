/**
 * build_region_skeleton.mjs
 *
 * 取代 Gabriel 网状映射 (radial_network.geojson, 985 条)
 * 生成"区中心向心" 树状骨架 (region_skeleton.geojson)
 *
 * 算法 (用户拍板的"一个一个连接"思路):
 *   Phase 1: 15 区中心之间用 MST 连成主干 (~14 条骨干边)
 *   Phase 2: 每区内, Prim 增量添加: 每次找区内未入网且离已入网最近的城, 连 1 条
 *
 * 输出:
 *   public/assets/region_skeleton.geojson
 *   - 主干: 红色 (phase=center, source=skeleton)
 *   - 区内: 按区颜色 (phase=spoke, source=skeleton)
 *
 * 用法: node scripts/build_region_skeleton.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CITIES_FILE = path.join(__dirname, '../src/data/cities_v2.ts');
const REGION_FILE = path.join(__dirname, '../src/systems/RegionSystem.ts');
const OUTPUT      = path.join(__dirname, '../public/assets/region_skeleton.geojson');

// ────────────────────────────────────────────────
//  几何工具
// ────────────────────────────────────────────────

function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pointInPolygon(lat, lng, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lng, yi = polygon[i].lat;
        const xj = polygon[j].lng, yj = polygon[j].lat;
        // 紧贴边界
        const d = Math.sqrt((lat - yi) ** 2 + (lng - xi) ** 2);
        if (d < 0.01) return true;
        if (((yi >= lat) !== (yj >= lat)) && (lng <= (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }
    return inside;
}

// ────────────────────────────────────────────────
//  解析 cities_v2.ts
// ────────────────────────────────────────────────

function loadCities() {
    const text = fs.readFileSync(CITIES_FILE, 'utf8');
    const cities = [];
    const seen = new Set();

    // 单行: { id: '...', name: '...', ..., lat: X, lng: Y, ..., type: '...' }
    const singleRe = /\{\s*id:\s*'(city_[^']+)',\s*name:\s*'([^']+)'[^}]*lat:\s*([-\d.]+)\s*,\s*lng:\s*([-\d.]+)[^}]*type:\s*'([^']+)'[^}]*\}/g;
    let m;
    while ((m = singleRe.exec(text))) {
        if (seen.has(m[1])) continue;
        seen.add(m[1]);
        cities.push({
            id: m[1], name: m[2],
            lat: parseFloat(m[3]), lng: parseFloat(m[4]),
            type: m[5],
            region: (m[0].match(/region:\s*'([^']+)'/) || [])[1] || null,
        });
    }

    // 多行: id .. name .. lat,lng .. type (顺序匹配)
    const blockRe = /id:\s*'(city_[^']+)',[\s\S]{0,300}?name:\s*'([^']+)',[\s\S]{0,300}?lat:\s*([-\d.]+)\s*,\s*lng:\s*([-\d.]+)[\s\S]{0,300}?type:\s*'([^']+)'/g;
    while ((m = blockRe.exec(text))) {
        if (seen.has(m[1])) continue;
        seen.add(m[1]);
        cities.push({
            id: m[1], name: m[2],
            lat: parseFloat(m[3]), lng: parseFloat(m[4]),
            type: m[5],
            region: (m[0].match(/region:\s*'([^']+)'/) || [])[1] || null,
        });
    }

    return cities;
}

// ────────────────────────────────────────────────
//  解析 RegionSystem.ts (polygons + centers)
// ────────────────────────────────────────────────

function loadRegions() {
    const text = fs.readFileSync(REGION_FILE, 'utf8');

    // REGIONS = [{id: 'X', polygon: [{lat:Y, lng:Z}, ...]}, ...]
    const lineRe = /\{\s*id:\s*'([A-Z_]+)',\s*polygon:\s*\[([^\]]+)\]/g;
    const regions = [];
    let m;
    while ((m = lineRe.exec(text))) {
        const id = m[1];
        const pts = [];
        const ptRe = /\{lat:([-\d.]+),lng:([-\d.]+)\}/g;
        let p;
        while ((p = ptRe.exec(m[2]))) {
            pts.push({ lat: parseFloat(p[1]), lng: parseFloat(p[2]) });
        }
        if (pts.length >= 3) regions.push({ id, polygon: pts });
    }
    return regions;
}

function loadRegionCenters() {
    const text = fs.readFileSync(REGION_FILE, 'utf8');
    // 抓 REGION_CENTERS 块
    const block = text.match(/export const REGION_CENTERS[^=]*=\s*\{([\s\S]*?)^\};/m);
    if (!block) throw new Error('未找到 REGION_CENTERS 定义');
    const centers = {};
    // 逐行: REGION_NAME: ['city_xxx', 'city_yyy'],
    const lineRe = /([A-Z_]+):\s*\[([^\]]+)\]/g;
    let m;
    while ((m = lineRe.exec(block[1]))) {
        const ids = [...m[2].matchAll(/'([^']+)'/g)].map(x => x[1]);
        centers[m[1]] = ids;
    }
    return centers;
}

// 旧 region 名兼容映射 (与 RegionSystem.ts LEGACY_REGION_MAP 对齐)
const LEGACY = {
    'SOUTH': 'JIANGNAN',
    'NORTHWEST': 'HEXI',
    'NOMADIC': 'STEPPE',
    'CENTRAL_WORLD': 'CENTRAL_ASIA',
    'WEST_WORLD': 'CENTRAL_ASIA',
    'TROPICS': 'LINGNAN',
    'SIBERIA': 'STEPPE',
    'MIN': 'LINGNAN',
    'SOUTH_HEMISPHERE': 'CENTRAL',
};

function resolveRegion(city, regions) {
    if (city.region) {
        const translated = LEGACY[city.region] || city.region;
        const validIds = regions.map(r => r.id);
        if (validIds.includes(translated)) return translated;
    }
    // 坐标判定
    for (const r of regions) {
        if (pointInPolygon(city.lat, city.lng, r.polygon)) return r.id;
    }
    return 'CENTRAL'; // fallback
}

// 14 区颜色 (区内边的色相)
const REGION_COLORS = {
    CENTRAL:      '#FFC107',  // 琥珀
    NORTH:        '#9E9E9E',  // 灰
    JIANGNAN:     '#4CAF50',  // 绿
    LINGNAN:      '#00ACC1',  // 青
    BASHU:        '#E91E63',  // 桃红
    DIANQIAN:     '#9C27B0',  // 紫
    HEXI:         '#FF9800',  // 橙
    WESTERN:      '#FFEB3B',  // 黄
    TIBET:        '#FFFFFF',  // 白
    STEPPE:       '#795548',  // 棕
    NORTHEAST:    '#3F51B5',  // 靛
    KOREA:        '#E040FB',  // 品红
    JAPAN:        '#F44336',  // 红
    CENTRAL_ASIA: '#80DEEA',  // 浅青
};

// ────────────────────────────────────────────────
//  Phase 1: 15 区中心 MST 主干
// ────────────────────────────────────────────────

function phase1_centerBackbone(centerCities) {
    // 标准 Prim: 从第 1 个 (洛阳) 开始, 每次拉最近未入网
    const inNet = new Set([centerCities[0].id]);
    const edges = [];

    while (inNet.size < centerCities.length) {
        let best = null;
        for (const a of centerCities.filter(c => inNet.has(c.id))) {
            for (const b of centerCities.filter(c => !inNet.has(c.id))) {
                const d = haversineKm(a.lat, a.lng, b.lat, b.lng);
                if (!best || d < best.d) best = { a, b, d };
            }
        }
        inNet.add(best.b.id);
        edges.push(best);
    }

    return edges;
}

// ────────────────────────────────────────────────
//  Phase 2: 每区内增量 Prim
// ────────────────────────────────────────────────

function phase2_intraRegion(cityList, centerIds, regionId) {
    const inNet = new Set();
    const edges = [];

    // 种子: 该区的中心(可能 1-2 个)
    for (const cid of centerIds) {
        if (cityList.find(c => c.id === cid)) inNet.add(cid);
    }
    if (inNet.size === 0 && cityList.length > 0) {
        // 极端: 该区没有 RegionCenter 在城市列表里, 退化用区内第一个城作种
        console.warn(`  ⚠️ [${regionId}] 区中心不在 cities 列表, 用 ${cityList[0].name} 作种`);
        inNet.add(cityList[0].id);
    }

    while (inNet.size < cityList.length) {
        let best = null;
        for (const a of cityList.filter(c => inNet.has(c.id))) {
            for (const b of cityList.filter(c => !inNet.has(c.id))) {
                const d = haversineKm(a.lat, a.lng, b.lat, b.lng);
                if (!best || d < best.d) best = { a, b, d };
            }
        }
        if (!best) break;
        inNet.add(best.b.id);
        edges.push(best);
    }

    return edges;
}

// ────────────────────────────────────────────────
//  主流程
// ────────────────────────────────────────────────

function main() {
    const t0 = Date.now();
    console.log('[1/5] 加载据点...');
    const cities = loadCities();
    console.log(`      共 ${cities.length} 个据点`);

    console.log('[2/5] 加载区数据...');
    const regions = loadRegions();
    const centers = loadRegionCenters();
    console.log(`      ${regions.length} 区, ${Object.values(centers).flat().length} 个区中心`);

    console.log('[3/5] 据点 → 区 归类...');
    const byRegion = {};
    for (const city of cities) {
        const r = resolveRegion(city, regions);
        (byRegion[r] = byRegion[r] || []).push(city);
    }
    console.log('      区据点分布:');
    const ordered = Object.keys(byRegion).sort((a,b)=>byRegion[b].length - byRegion[a].length);
    for (const r of ordered) {
        console.log(`         ${r.padEnd(14)} ${byRegion[r].length}`);
    }

    // ── Phase 1: 15 中心主干 ────────────────────
    console.log('[4/5] Phase 1: 15 中心 MST 骨干...');
    const allCenterIds = Object.values(centers).flat();
    const centerCities = cities.filter(c => allCenterIds.includes(c.id));
    if (centerCities.length !== allCenterIds.length) {
        const missing = allCenterIds.filter(id => !cities.find(c => c.id === id));
        console.error(`      ❌ 缺失区中心: ${missing.join(', ')}`);
        process.exit(1);
    }
    const backbone = phase1_centerBackbone(centerCities);
    console.log(`      骨干 ${backbone.length} 条`);
    for (const e of backbone) {
        console.log(`         ${e.a.name.padEnd(8, '　')} ─── ${e.b.name.padEnd(8, '　')} ${e.d.toFixed(0).padStart(4)}km`);
    }

    // ── Phase 2: 每区内增量 Prim ──────────────
    console.log('[5/5] Phase 2: 区内向心连接...');
    const spokes = [];
    const spokeColors = {};
    for (const regionId of Object.keys(byRegion)) {
        const list = byRegion[regionId];
        const cIds = centers[regionId] || [];
        const edges = phase2_intraRegion(list, cIds, regionId);
        for (const e of edges) {
            spokes.push({ ...e, regionId });
        }
        spokeColors[regionId] = REGION_COLORS[regionId] || '#888';
        console.log(`      ${regionId.padEnd(14)} ${list.length} 城 → ${edges.length} 条边`);
    }

    // ── 输出 GeoJSON ────────────────────────────
    const features = [];

    // 主干 (红)
    for (const e of backbone) {
        features.push({
            type: 'Feature',
            properties: {
                source: 'skeleton',
                phase: 'center',
                from: e.a.id,    fromName: e.a.name,
                to:   e.b.id,    toName:   e.b.name,
                length_km: Math.round(e.d * 10) / 10,
                color: '#F44336',
            },
            geometry: { type: 'LineString', coordinates: [[e.a.lng, e.a.lat], [e.b.lng, e.b.lat]] }
        });
    }

    // 区内 (按区颜色)
    for (const e of spokes) {
        features.push({
            type: 'Feature',
            properties: {
                source: 'skeleton',
                phase: 'spoke',
                region: e.regionId,
                from: e.a.id,    fromName: e.a.name,
                to:   e.b.id,    toName:   e.b.name,
                length_km: Math.round(e.d * 10) / 10,
                color: spokeColors[e.regionId],
            },
            geometry: { type: 'LineString', coordinates: [[e.a.lng, e.a.lat], [e.b.lng, e.b.lat]] }
        });
    }

    const out = {
        type: 'FeatureCollection',
        meta: {
            generated: new Date().toISOString(),
            algorithm: 'Phase1: Prim MST over 15 region centers; Phase2: per-region Prim from region center',
            backboneCount: backbone.length,
            spokeCount: spokes.length,
            totalEdges: features.length,
            cityCount: cities.length,
            regionCenters: centers,
        },
        features,
    };

    fs.writeFileSync(OUTPUT, JSON.stringify(out));
    const sizeKB = (fs.statSync(OUTPUT).size / 1024).toFixed(0);

    console.log('');
    console.log(`✅ 完成 (${Date.now() - t0}ms)`);
    console.log(`   骨干:        ${backbone.length} 条 (15 中心 MST)`);
    console.log(`   区内辐条:    ${spokes.length} 条`);
    console.log(`   总边数:      ${features.length} 条`);
    console.log(`   据点数:      ${cities.length}`);
    console.log(`   边/城 比:    ${(features.length / cities.length).toFixed(2)} (Gabriel 旧值 1.84)`);
    console.log(`   文件大小:    ${sizeKB} KB`);
    console.log(`   输出位置:    public/assets/region_skeleton.geojson`);
}

main();
