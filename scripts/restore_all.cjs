/**
 * restore_all.cjs — 完全恢复所有被注释的势力和城市
 * 
 * 处理以下场景:
 * 1. factions.ts: 恢复所有被 `[REMOVED: ...]` 注释的势力行
 * 2. cities_v2.ts: 恢复所有被 `[REMOVED: ...]` 注释的城市条目
 * 
 * 运行: node scripts/restore_all.cjs
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// 1. 恢复 factions.ts
// ============================================================
function restoreFactions() {
    const filePath = path.resolve(__dirname, '..', 'src', 'data', 'factions.ts');
    let content = fs.readFileSync(filePath, 'utf8');
    let lines = content.split('\n');
    let result = [];
    let changes = 0;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let trimmed = line.trim();

        // Pattern 1: "// { id: 'xxx', ... },  // comment [REMOVED: ...]"
        // Match lines that start with optional whitespace + // + { id:
        let m1 = line.match(/^(\s*)\/\/\s*(\{ id: '[^']+'.*)/);
        if (m1) {
            let indent = m1[1];
            let rest = m1[2]; // everything after the // 
            // Remove trailing [REMOVED: ...] parts, including the "// " before them
            rest = rest.replace(/\s*\/\/\s*\[REMOVED:.*?\]/g, '');
            rest = rest.replace(/\s*\[REMOVED:.*?\]/g, '');
            result.push(indent + rest);
            changes++;
            continue;
        }

        // Pattern 2: Lines like "// 中华正红..." - keep as regular comments
        result.push(line);
    }

    fs.writeFileSync(filePath, result.join('\n'), 'utf8');
    console.log(`[factions.ts] 恢复完成: ${changes} 行被取消注释`);
    
    // 验证
    let finalContent = fs.readFileSync(filePath, 'utf8');
    let remainingRemoved = (finalContent.match(/REMOVED/g) || []).length;
    console.log(`[factions.ts] 剩余 REMOVED 标记: ${remainingRemoved}`);
    let activeCount = (finalContent.match(/\{ id: '/g) || []).length;
    console.log(`[factions.ts] 活跃势力数: ${activeCount}`);
}

// ============================================================
// 2. 恢复 cities_v2.ts
// ============================================================
function restoreCitiesV2() {
    const filePath = path.resolve(__dirname, '..', 'src', 'data', 'cities_v2.ts');
    let content = fs.readFileSync(filePath, 'utf8');
    let lines = content.split('\n');
    let result = [];
    let changes = 0;
    let removedTagsRemoved = 0;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let trimmed = line.trim();

        // Pattern 1: "// { [REMOVED: xxx]" — multi-line block start
        // e.g.: "    // { [REMOVED: 精简至30核心]"
        let m1 = line.match(/^(\s*)\/\/\s*\{\s*\[REMOVED:/);
        if (m1) {
            let indent = m1[1];
            result.push(indent + '{');
            changes++;
            continue;
        }

        // Pattern 2: "// { id: 'xxx', ... }, [REMOVED: xxx]" — single-line commented city
        // Also handles trailing [REMOVED: xxx] after }, 
        let m2 = line.match(/^(\s*)\/\/\s*(\{ id: '[^']+'.*?)(\s*,\s*)?(\s*\/\/\s*)?(\[REMOVED:.*?\])?/);
        if (m2) {
            let indent = m2[1];
            let cityContent = m2[2];
            // Clean up trailing whitespace/commas
            cityContent = cityContent.replace(/\s*$/, '');
            if (!cityContent.endsWith(',')) cityContent += ',';
            // Add a comma if the original had one (most do)
            result.push(indent + cityContent);
            changes++;
            continue;
        }

        // Pattern 3: Single-line commented city entry without trailing comment
        // e.g.: "    // { id: 'city_tongwancheng', name: '统万城', factionId: 'helian', ... [REMOVED: xxx]"
        let m3 = line.match(/^(\s*)\/\/\s*(\{ id: '[^']+'.*?)(\s*\[REMOVED:.*?\])?/);
        if (m3) {
            let indent = m3[1];
            let cityContent = m3[2];
            cityContent = cityContent.replace(/\s*$/, '');
            result.push(indent + cityContent);
            changes++;
            continue;
        }

        // Pattern 4: "// }, [REMOVED: xxx]" — closing brace commented
        let m4 = line.match(/^(\s*)\/\/\s*\},?\s*(\/\/\s*)?(\[REMOVED:.*?\])?/);
        if (m4) {
            let indent = m4[1];
            result.push(indent + '},');
            changes++;
            continue;
        }

        // Pattern 5: "// }," or "// }" (closing brace, no REMOVED tag) — might be part of commented block
        // Only uncomment if preceded by a commented city entry
        // Actually we need to be careful here — some closing braces are for active entries
        
        // Pattern 6: Lines with trailing [REMOVED: xxx] that are NOT commented
        // e.g.: "    // }, [REMOVED: 西域 region]" — already handled by Pattern 4
        
        // Pattern 7: "//     id: 'city_xxx', ..." inside a commented block
        // These are already part of a block that started with // { [REMOVED: ...]
        // We need to uncomment these too since we uncommented the opening brace
        let m7 = line.match(/^(\s*)\/\/\s+(id:|name:|factionId:|lat:|lng:|type:|troops:|tier:|note:)/);
        if (m7) {
            let indent = m7[1];
            let rest = line.substring(line.indexOf(m7[2])); // get from the property keyword
            // But keep the original indentation + property structure
            // Actually, let's just remove the // from these lines
            let uncommented = line.replace(/^(\s*)\/\/\s*/, '$1');
            result.push(uncommented);
            changes++;
            continue;
        }

        // Pattern 8: Handle trailing "// }, [REMOVED: ...]" at end of block
        // e.g.: "    // }, [REMOVED: 滇缅 region]"
        // This should already be caught by Pattern 4, but let's double-check

        // If nothing matched, keep the line as-is
        result.push(line);
    }

    fs.writeFileSync(filePath, result.join('\n'), 'utf8');
    console.log(`[cities_v2.ts] 恢复完成: ${changes} 处修改`);
    
    // 验证
    let finalContent = fs.readFileSync(filePath, 'utf8');
    let remainingRemoved = (finalContent.match(/REMOVED/g) || []).length;
    console.log(`[cities_v2.ts] 剩余 REMOVED 标记: ${remainingRemoved}`);
}

// ============================================================
// 执行
// ============================================================
console.log('=== 开始恢复所有势力和城市数据 ===\n');

restoreFactions();
console.log('');
restoreCitiesV2();

console.log('\n=== 恢复完成 ===');
console.log('请运行: npx tsc --noEmit && npx vite build');
