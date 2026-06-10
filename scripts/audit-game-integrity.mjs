#!/usr/bin/env node
/**
 * audit-game-integrity.mjs
 *
 * 全项目跨文件引用完整性体检。一次扫描以下不变量：
 *
 *   1. cities_v2.ts 里的 factionId 是否都存在于 FACTIONS
 *   2. FACTIONS 里的 faction 是否都注册了 STARTING_CAPITALS
 *   3. STARTING_CAPITALS 指向的 cityId 是否都存在于 cities_v2.ts
 *   4. FACTIONS 里的 faction 是否都有 factionFlagMap 条目
 *   5. FACTIONS 里的 faction 是否都有 sandboxDisplayNames 条目
 *   6. 任意两座非 battlefield 城市之间距离 < 50km
 *
 * 用法: npm run audit  或  node scripts/audit-game-integrity.mjs
 *
 * 输出: 控制台 + scripts/audit-report.json (机器可读)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// ============================================================
// 辅助: haversine 距离 (km)
// ============================================================
function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ============================================================
// 简单 TS 文本解析（不需要 TS 编译器，正则提取就够了）
// ============================================================
function readFile(rel) {
    return fs.readFileSync(path.join(ROOT, rel), 'utf-8');
}

/** 从 cities_v2.ts 提取所有 {id, factionId, lat, lng, type, name} */
function extractCities() {
    const text = readFile('src/data/cities_v2.ts');
    // 简化版正则：匹配每个 city 对象
    const cities = [];
    const blockRe = /\{\s*id:\s*['"]([^'"]+)['"][^}]*?name:\s*['"]([^'"]+)['"][^}]*?factionId:\s*['"]([^'"]*)['"][^}]*?lat:\s*([-\d.]+)[^}]*?lng:\s*([-\d.]+)[^}]*?type:\s*['"]([^'"]+)['"][^}]*?\}/g;
    let m;
    while ((m = blockRe.exec(text)) !== null) {
        cities.push({
            id: m[1], name: m[2], factionId: m[3],
            lat: parseFloat(m[4]), lng: parseFloat(m[5]),
            type: m[6]
        });
    }
    return cities;
}

/** 从 factions.ts 提取所有 {id, name} */
function extractFactions() {
    const text = readFile('src/data/factions.ts');
    const factions = [];
    const re = /\{\s*id:\s*['"]([^'"]+)['"][^}]*?name:\s*['"]([^'"]+)['"][^}]*?\}/g;
    let m;
    while ((m = re.exec(text)) !== null) {
        factions.push({ id: m[1], name: m[2] });
    }
    return factions;
}

/** 从 GameApp.ts 提取 STARTING_CAPITALS 映射 */
function extractStartingCapitals() {
    const text = readFile('src/app/GameApp.ts');
    const startIdx = text.indexOf('export const STARTING_CAPITALS');
    const endIdx = text.indexOf('};', startIdx);
    const block = text.slice(startIdx, endIdx);
    const map = {};
    const re = /['"](\w+)['"]\s*:\s*['"]([^'"]+)['"]/g;
    let m;
    while ((m = re.exec(block)) !== null) {
        map[m[1]] = m[2];
    }
    return map;
}

/** 从 CityAssetManager.ts 提取 factionFlagMap 的所有 key
 *  注意要跳过 `: { [key: string]: string }` 这种 TS 类型注解里的 {} */
function extractFactionFlagKeys() {
    const text = readFile('src/assets/CityAssetManager.ts');
    const declIdx = text.indexOf('factionFlagMap');
    if (declIdx === -1) return new Set();
    // 真正的字典字面量始于 "= {"
    const eqBraceIdx = text.indexOf('= {', declIdx);
    if (eqBraceIdx === -1) return new Set();
    const openBrace = eqBraceIdx + 2; // 指向 '{'
    // 找配对的 '}'
    let depth = 0;
    let end = -1;
    for (let i = openBrace; i < text.length; i++) {
        if (text[i] === '{') depth++;
        if (text[i] === '}') {
            depth--;
            if (depth === 0) { end = i; break; }
        }
    }
    const block = text.slice(openBrace, end);
    const keys = new Set();
    const re = /['"](\w+)['"]\s*:\s*['"][^'"]+['"]/g; // 只取 'key': 'value' 模式
    let m;
    while ((m = re.exec(block)) !== null) keys.add(m[1]);
    return keys;
}

/** 从 SandboxDisplayNames.ts 提取所有 key */
function extractSandboxDisplayKeys() {
    const text = readFile('src/data/SandboxDisplayNames.ts');
    const keys = new Set();
    const re = /['"](\w+)['"]\s*:\s*['"][^'"]+['"]/g;
    let m;
    while ((m = re.exec(text)) !== null) keys.add(m[1]);
    return keys;
}

// ============================================================
// 主流程
// ============================================================
console.log('🔍 扫描游戏数据完整性...\n');

const cities = extractCities();
const factions = extractFactions();
const startingCapitals = extractStartingCapitals();
const flagKeys = extractFactionFlagKeys();
const displayKeys = extractSandboxDisplayKeys();

console.log(`📊 数据规模:`);
console.log(`   cities:               ${cities.length}`);
console.log(`   factions:             ${factions.length}`);
console.log(`   STARTING_CAPITALS:    ${Object.keys(startingCapitals).length}`);
console.log(`   factionFlagMap:       ${flagKeys.size}`);
console.log(`   sandboxDisplayNames:  ${displayKeys.size}\n`);

const cityIdSet = new Set(cities.map(c => c.id));
const factionIdSet = new Set(factions.map(f => f.id));
const factionsUsedInCities = new Set(
    cities.map(c => c.factionId).filter(f => f && f !== 'panjun' && f !== '')
);

const report = {
    summary: {
        cities: cities.length,
        factions: factions.length,
        startingCapitals: Object.keys(startingCapitals).length,
        factionFlagMap: flagKeys.size,
        sandboxDisplayNames: displayKeys.size,
    },
    issues: {
        orphanFactionRef: [],
        factionMissingCapital: [],
        capitalMissingCity: [],
        factionMissingFlag: [],
        factionMissingDisplay: [],
        closeCities: [],
    }
};

// 1. cities_v2.ts 里的 factionId 是否都存在于 FACTIONS
for (const c of cities) {
    if (!c.factionId || c.factionId === 'panjun' || c.factionId === '') continue;
    if (!factionIdSet.has(c.factionId)) {
        report.issues.orphanFactionRef.push({ cityId: c.id, cityName: c.name, factionId: c.factionId });
    }
}

// 2. FACTIONS 在 cities_v2.ts 中使用过 + 没有 STARTING_CAPITALS 注册
for (const f of factions) {
    if (factionsUsedInCities.has(f.id) && !startingCapitals[f.id]) {
        report.issues.factionMissingCapital.push({ factionId: f.id, factionName: f.name });
    }
}

// 3. STARTING_CAPITALS 指向不存在的 cityId
for (const [factionId, cityId] of Object.entries(startingCapitals)) {
    if (!cityIdSet.has(cityId)) {
        report.issues.capitalMissingCity.push({ factionId, missingCityId: cityId });
    }
}

// 4. FACTIONS 缺 factionFlagMap (只检查在 cities 中实际使用过的)
for (const f of factions) {
    if (factionsUsedInCities.has(f.id) && !flagKeys.has(f.id)) {
        report.issues.factionMissingFlag.push({ factionId: f.id, factionName: f.name });
    }
}

// 5. FACTIONS 缺 sandboxDisplayNames (只检查在 cities 中实际使用过的)
for (const f of factions) {
    if (factionsUsedInCities.has(f.id) && !displayKeys.has(f.id)) {
        report.issues.factionMissingDisplay.push({ factionId: f.id, factionName: f.name });
    }
}

// 6. 50km 内的城对
const MIN_KM = 50;
const BOX_DEG = 0.6;
const sortedByLat = [...cities].filter(c => c.type !== 'battlefield').sort((a, b) => a.lat - b.lat);
for (let i = 0; i < sortedByLat.length; i++) {
    const a = sortedByLat[i];
    for (let j = i + 1; j < sortedByLat.length; j++) {
        const b = sortedByLat[j];
        if (b.lat - a.lat > BOX_DEG) break; // 排序后超出 lat box 就停
        if (Math.abs(b.lng - a.lng) > BOX_DEG) continue;
        const km = haversineKm(a.lat, a.lng, b.lat, b.lng);
        if (km < MIN_KM) {
            report.issues.closeCities.push({
                city1: { id: a.id, name: a.name },
                city2: { id: b.id, name: b.name },
                km: parseFloat(km.toFixed(2))
            });
        }
    }
}

// ============================================================
// 输出
// ============================================================
const printSection = (title, items, fmt) => {
    console.log(`\n${title}: ${items.length}`);
    if (items.length === 0) {
        console.log('   ✅ 无问题');
    } else {
        items.slice(0, 20).forEach((it, i) => console.log(`   ${i + 1}. ${fmt(it)}`));
        if (items.length > 20) console.log(`   ... 还有 ${items.length - 20} 条`);
    }
};

printSection('🚨 cities_v2 引用了未在 FACTIONS 中的 factionId',
    report.issues.orphanFactionRef,
    it => `[${it.cityId}] ${it.cityName} → factionId="${it.factionId}" (不存在)`);

printSection('🚨 cities_v2 用到但缺 STARTING_CAPITALS 的势力 (沙盒会全变 panjun)',
    report.issues.factionMissingCapital,
    it => `${it.factionId} (${it.factionName})`);

printSection('🚨 STARTING_CAPITALS 指向不存在的 cityId',
    report.issues.capitalMissingCity,
    it => `${it.factionId} → ${it.missingCityId} (不存在)`);

printSection('⚠ 缺 factionFlagMap 条目的势力 (旗帜回退默认灰旗)',
    report.issues.factionMissingFlag,
    it => `${it.factionId} (${it.factionName})`);

printSection('ⓘ 缺 sandboxDisplayNames 短名 (旗帜文字回退全名)',
    report.issues.factionMissingDisplay,
    it => `${it.factionId} (${it.factionName})`);

printSection('⚠ 50km 内的城对 (违反间距规范)',
    report.issues.closeCities,
    it => `${it.city1.name}(${it.city1.id}) ↔ ${it.city2.name}(${it.city2.id}) = ${it.km}km`);

// 总结
const totalIssues = Object.values(report.issues).reduce((s, arr) => s + arr.length, 0);
console.log(`\n${'='.repeat(60)}`);
console.log(`📋 总问题数: ${totalIssues}`);

// 写入文件
const outPath = path.join(__dirname, 'audit-report.json');
fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf-8');
console.log(`📄 完整报告已保存: ${outPath}`);
console.log(`${'='.repeat(60)}\n`);

process.exit(totalIssues > 0 ? 1 : 0);
