/**
 * check_all_city_distances.cjs
 * 
 * 解析 cities_v2.ts 中所有城市坐标，计算每对据点之间的距离，
 * 列出所有间距 < 50km 的据点对，并按地理区域分批输出。
 * 
 * 用法: node scripts/check_all_city_distances.cjs
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// 1. Haversine 距离公式
// ============================================================
function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ============================================================
// 2. 解析 cities_v2.ts 提取所有城市对象
// ============================================================
function extractCities(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');

    // 用正则提取所有形如 { id: '...', ... } 的对象
    // 先去掉注释 (// 和 /* */)
    const noComments = content
        .replace(/\/\/.*$/gm, '')    // 去掉 // 行注释
        .replace(/\/\*[\s\S]*?\*\//g, '');  // 去掉 /* */ 块注释

    // 提取所有 {...} 对象
    const cities = [];
    const objRegex = /\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
    let match;

    while ((match = objRegex.exec(noComments)) !== null) {
        const objStr = match[1];
        
        // 提取字段值
        const id = objStr.match(/id:\s*'([^']+)'/);
        const name = objStr.match(/name:\s*'([^']+)'/);
        const lat = objStr.match(/lat:\s*([0-9.\-]+)/);
        const lng = objStr.match(/lng:\s*([0-9.\-]+)/);
        const factionId = objStr.match(/factionId:\s*'([^']+)'/);
        const type = objStr.match(/type:\s*'([^']+)'/);
        const tier = objStr.match(/tier:\s*(\d+)/);
        const note = objStr.match(/note:\s*'([^']*)'/);
        const region = objStr.match(/region:\s*'([^']+)'/);

        // 必须有 id, lat, lng 才认为是有效城市
        if (id && lat && lng) {
            cities.push({
                id: id[1],
                name: name ? name[1] : id[1],
                lat: parseFloat(lat[1]),
                lng: parseFloat(lng[1]),
                factionId: factionId ? factionId[1] : 'unknown',
                type: type ? type[1] : 'unknown',
                tier: tier ? parseInt(tier[1]) : -1,
                note: note ? note[1] : '',
                region: region ? region[1] : undefined
            });
        }
    }

    return cities;
}

// ============================================================
// 3. 地理区域划分 (根据经纬度粗略分组)
// ============================================================
function getRegion(city) {
    const { lat, lng, region } = city;
    if (region) return region;
    
    // 日本
    if (lng > 125 && lng < 150) return '日本·朝鲜';
    // 朝鲜半岛
    if (lat > 32 && lat < 43 && lng > 124 && lng < 131) return '日本·朝鲜';
    // 蒙古高原/东北
    if (lat > 43) return '蒙古·东北';
    // 西域
    if (lng < 100) return '西域·青藏';
    // 青藏
    if (lat < 35 && lng < 105) return '西域·青藏';
    // 岭南
    if (lat < 26) return '岭南·闽越';
    // 西南 (云南贵州)
    if (lat < 28 && lng > 100 && lng < 110) return '西南';
    // 江南 (长江中下游)
    if (lat >= 26 && lat < 32 && lng >= 110 && lng < 123) return '江南·荆楚';
    // 中原 (黄河中下游)
    if (lat >= 32 && lat < 37 && lng >= 110 && lng < 120) return '中原';
    // 西北 (陕甘宁)
    if (lat >= 34 && lat < 42 && lng >= 104 && lng < 112) return '关中·西北';
    // 华北 (河北山西北部)
    if (lat >= 37 && lat < 43 && lng >= 110 && lng < 120) return '华北·燕赵';
    return '其他';
}

// ============================================================
// 4. 按区域分组
// ============================================================
function groupByRegion(pairs) {
    const groups = {};
    for (const p of pairs) {
        const region = p.region;
        if (!groups[region]) groups[region] = [];
        groups[region].push(p);
    }
    return groups;
}

// ============================================================
// 5. 主流程
// ============================================================
function main() {
    const filePath = path.join(__dirname, '..', 'src', 'data', 'cities_v2.ts');
    console.error(`正在解析: ${filePath}`);
    
    const cities = extractCities(filePath);
    console.error(`共解析到 ${cities.length} 个城市/据点\n`);

    if (cities.length === 0) {
        console.error('错误: 未能解析到任何城市数据，请检查文件格式');
        process.exit(1);
    }

    // 计算所有配对距离
    const MIN_DIST = 50; // km
    const closePairs = [];

    for (let i = 0; i < cities.length; i++) {
        for (let j = i + 1; j < cities.length; j++) {
            const a = cities[i];
            const b = cities[j];
            const dist = haversineKm(a.lat, a.lng, b.lat, b.lng);
            if (dist < MIN_DIST) {
                closePairs.push({
                    cityA: a.name,
                    cityB: b.name,
                    idA: a.id,
                    idB: b.id,
                    factionA: a.factionId,
                    factionB: b.factionId,
                    latA: a.lat, lngA: a.lng,
                    latB: b.lat, lngB: b.lng,
                    tierA: a.tier,
                    tierB: b.tier,
                    distance: Math.round(dist * 10) / 10,
                    region: getRegion(a)
                });
            }
        }
    }

    // 按距离排序
    closePairs.sort((a, b) => a.distance - b.distance);

    // 按区域分组
    const grouped = groupByRegion(closePairs);

    // ============================================================
    // 输出结果到控制台
    // ============================================================
    console.log('='.repeat(90));
    console.log('  据点间距检查报告 (距离 < 50km)');
    console.log(`  总城市数: ${cities.length} | 违规对数: ${closePairs.length}`);
    console.log('='.repeat(90));
    console.log();

    const regionOrder = ['中原', '关中·西北', '华北·燕赵', '江南·荆楚', '岭南·闽越', '西南', '西域·青藏', '蒙古·东北', '日本·朝鲜', '其他'];

    let batchCounter = 0;
    for (const region of regionOrder) {
        if (!grouped[region]) continue;
        batchCounter++;
        const pairs = grouped[region];
        console.log(`\n${'─'.repeat(90)}`);
        console.log(`📌 第 ${batchCounter} 批: ${region} (共 ${pairs.length} 对)`);
        console.log(`${'─'.repeat(90)}`);
        console.log(` ${'#'.padEnd(4)} ${'城市A'.padEnd(12)} ${'城市B'.padEnd(12)} ${'距离(km)'.padEnd(10)} ${'坐标A'.padEnd(22)} ${'坐标B'.padEnd(22)} 层级`);
        console.log(` ${'─'.repeat(4)} ${'─'.repeat(12)} ${'─'.repeat(12)} ${'─'.repeat(10)} ${'─'.repeat(22)} ${'─'.repeat(22)} ${'─'.repeat(6)}`);

        pairs.forEach((p, idx) => {
            const coordA = `(${p.latA}, ${p.lngA})`;
            const coordB = `(${p.latB}, ${p.lngB})`;
            const tierStr = `T${p.tierA}↔T${p.tierB}`;
            console.log(` ${(idx + 1).toString().padEnd(4)} ${p.cityA.padEnd(12)} ${p.cityB.padEnd(12)} ${p.distance.toString().padEnd(10)} ${coordA.padEnd(22)} ${coordB.padEnd(22)} ${tierStr}`);
        });
    }

    // ============================================================
    // 保存 Markdown 报告到 plans/
    // ============================================================
    const outputPath = path.join(__dirname, '..', 'plans', '据点间距检查报告.md');
    let mdContent = `# 据点间距检查报告\n\n`;
    mdContent += `- 检查时间: ${new Date().toISOString()}\n`;
    mdContent += `- 数据源: \`src/data/cities_v2.ts\`\n`;
    mdContent += `- 总城市数: ${cities.length}\n`;
    mdContent += `- 间距要求: ≥ 50km\n`;
    mdContent += `- 违规对数: ${closePairs.length}\n\n`;
    mdContent += `---\n\n`;

    for (const region of regionOrder) {
        if (!grouped[region]) continue;
        const pairs = grouped[region];
        mdContent += `## 第 ${regionOrder.indexOf(region) + 1} 批: ${region} (${pairs.length} 对)\n\n`;
        mdContent += `| # | 城市A | 城市B | 距离(km) | 城市A坐标 | 城市B坐标 | A层级 | B层级 | A势力 | B势力 |\n`;
        mdContent += `|---|-------|-------|---------|-----------|-----------|-------|-------|-------|-------|\n`;
        pairs.forEach((p, idx) => {
            const coordA = `(${p.latA}, ${p.lngA})`;
            const coordB = `(${p.latB}, ${p.lngB})`;
            mdContent += `| ${idx + 1} | ${p.cityA} | ${p.cityB} | ${p.distance} | ${coordA} | ${coordB} | T${p.tierA} | T${p.tierB} | \`${p.factionA}\` | \`${p.factionB}\` |\n`;
        });
        mdContent += `\n`;
    }

    fs.writeFileSync(outputPath, mdContent, 'utf-8');
    console.error(`\n报告已保存至: ${outputPath}`);
}

main();
