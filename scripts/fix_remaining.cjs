/**
 * fix_remaining.cjs — 修复 cities_v2.ts 中剩余的特定问题
 * 
 * 1. 恢复丢失 // 的注释行 (── ... ──)
 * 2. 删除多余的 }, 行（单行条目后的残留）
 * 3. 修复遗留区域的截断条目
 */
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '..', 'src', 'data', 'cities_v2.ts');
let content = fs.readFileSync(filePath, 'utf8');
let lines = content.split('\n');
let result = [];
let changes = 0;

// 已知的日本城市数据 (legacy 区域截断的)
const japanCities = {
    'city_tsushima': { id: 'city_tsushima', name: '对马', factionId: 'so', lat: 34.35, lng: 129.28, type: 'medium_city', troops: 10000, tier: 1 },
    'city_okou': { id: 'city_okou', name: '王城', factionId: 'yamatai', lat: 34.32, lng: 135.61, type: 'medium_city', troops: 10000, tier: 1 },
    'city_yoshida': { id: 'city_yoshida', name: '吉田', factionId: 'echigo', lat: 34.39, lng: 132.54, type: 'medium_city', troops: 10000, tier: 1 },
    'city_kasugayama': { id: 'city_kasugayama', name: '春日山', factionId: 'echigo', lat: 37.16, lng: 138.24, type: 'medium_city', troops: 10000, tier: 1 },
    'city_kofu': { id: 'city_kofu', name: '甲府', factionId: 'kai', lat: 35.66, lng: 138.57, type: 'medium_city', troops: 10000, tier: 1 },
    'city_kiyosu': { id: 'city_kiyosu', name: '清洲', factionId: 'owari', lat: 35.22, lng: 136.85, type: 'medium_city', troops: 10000, tier: 1 },
};

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let trimmed = line.trim();
    
    // ─── 修复1: 恢复丢失 // 的注释行 ───
    // 匹配: "    ── xxx ──" 或 "    T2 关隘..."
    if (trimmed.match(/^──.+(──)$/) || 
        trimmed.match(/^T2\s+关隘/) ||
        trimmed.match(/^T2\s+关/) ||
        trimmed.match(/^─{4,}/)) {
        if (!trimmed.startsWith('//')) {
            let indent = line.match(/^(\s*)/)[1];
            result.push(indent + '// ' + trimmed);
            changes++;
            continue;
        }
    }

    // ─── 修复2: 处理遗留区域截断条目 ───
    // 匹配: "{ id: 'city_xxx'," 后面跟着 "    tier: 1"
    let m1 = trimmed.match(/^\{ id: '([^']+)',$/);
    if (m1) {
        let cityId = m1[1];
        
        // 检查日本城市
        if (japanCities[cityId]) {
            let data = japanCities[cityId];
            let indent = line.match(/^(\s*)/)[1];
            let entry = `{ id: '${data.id}', name: '${data.name}', factionId: '${data.factionId}', lat: ${data.lat}, lng: ${data.lng}, type: '${data.type}', troops: ${data.troops}, tier: ${data.tier} },`;
            result.push(indent + entry);
            changes++;
            // 跳过后面的 "tier: 1" 和 "}," 行
            // 下一行是 "    tier: 1" 或 "tier: 1"
            if (i + 1 < lines.length) {
                let nextLine = lines[i + 1].trim();
                if (nextLine.match(/^tier:\s*\d+,?\s*$/)) {
                    i++; // 跳过 tier 行
                }
            }
            if (i + 1 < lines.length) {
                let nextLine = lines[i + 1].trim();
                if (nextLine === '},' || nextLine === '}') {
                    i++; // 跳过 }, 行
                }
            }
            continue;
        }
    }

    // ─── 修复3: 删除多余的 } 或 }, 行 ───
    // 如果上一行已经是完整的单行条目（以 }, 结尾），紧接着的 }, 行是多余的
    if (trimmed === '},' || trimmed === '}') {
        if (result.length > 0) {
            let prevLine = result[result.length - 1].trim();
            // 如果上一行已经是完整的单行条目（包含 name 和 factionId）
            if (prevLine.match(/^\{ id: '[^']+', name: '[^']+', factionId: '[^']+'.*,$/)) {
                // 多余的 }, 行，跳过
                changes++;
                continue;
            }
        }
    }

    result.push(line);
}

fs.writeFileSync(filePath, result.join('\n'), 'utf8');
console.log(`完成: ${changes} 处修复`);
