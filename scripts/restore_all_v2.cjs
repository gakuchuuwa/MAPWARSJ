/**
 * restore_all_v2.cjs — 全面恢复所有被注释的势力和城市数据
 * 
 * 修复 v1 中的问题：
 * 1. 多行块格式的缩进问题
 * 2. `// {` 不带 [REMOVED] 标签的块
 * 3. 单行完整条目格式的处理
 * 4. 西域 region 等区域注释的恢复
 * 
 * 运行: node scripts/restore_all_v2.cjs
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

        // 匹配: optional whitespace + // + { id: 'xxx', ... } (可能还有尾部注释)
        // 例如: "    // { id: 'dian', name: '滇', color: '#20B2AA' },         // 浅绿蓝 - 滇 [REMOVED: 滇缅 region]"
        // 例如: "    // { id: 'riben', name: '日本', color: '#F5F5F5' },    // 白色 - 日本 [REMOVED: Japan region]"
        let m1 = line.match(/^(\s*)\/\/\s*(\{ id: '.+)/);
        if (m1) {
            let indent = m1[1];
            let rest = m1[2];
            // 移除尾部 [REMOVED: ...] 标记以及之前的 // 
            rest = rest.replace(/\s*\/\/\s*\[REMOVED:.*?\]/g, '');
            rest = rest.replace(/\s*\[REMOVED:.*?\]/g, '');
            result.push(indent + rest);
            changes++;
            continue;
        }

        result.push(line);
    }

    fs.writeFileSync(filePath, result.join('\n'), 'utf8');
    console.log(`[factions.ts] 恢复完成: ${changes} 行被取消注释`);
    let finalContent = fs.readFileSync(filePath, 'utf8');
    let remaining = (finalContent.match(/REMOVED/g) || []).length;
    let activeCount = (finalContent.match(/\{ id: '/g) || []).length;
    console.log(`[factions.ts] 剩余 REMOVED: ${remaining}, 活跃势力: ${activeCount}`);
}

// ============================================================
// 2. 恢复 cities_v2.ts — 使用状态机处理多行块格式
// ============================================================
function restoreCitiesV2() {
    const filePath = path.resolve(__dirname, '..', 'src', 'data', 'cities_v2.ts');
    let content = fs.readFileSync(filePath, 'utf8');
    let lines = content.split('\n');
    let result = [];
    let changes = 0;
    
    // 状态: 是否在处理被注释的多行城市块
    let inCommentedBlock = false;
    // 保存块内已经处理过的属性行数，用于缩进调整
    let blockIndent = '';

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let trimmed = line.trim();
        
        // ─── 检测被注释的多行块开始 ───
        // 格式: "    // { [REMOVED: 精简至30核心]" 或 "    // {" (无标签)
        let blockStart = line.match(/^(\s*)\/\/\s*\{\s*(\[REMOVED:[^\]]*\])?\s*$/);
        if (blockStart) {
            blockIndent = blockStart[1];
            inCommentedBlock = true;
            result.push(blockIndent + '{');
            changes++;
            continue;
        }

        // ─── 如果处在注释块内 ───
        if (inCommentedBlock) {
            // 检测块结束: "// }, [REMOVED: xxx]" 或 "// },"
            let blockEnd = line.match(/^(\s*)\/\/\s*\},?\s*(\/\/\s*)?(\[REMOVED:[^\]]*\])?\s*$/);
            if (blockEnd) {
                inCommentedBlock = false;
                result.push(blockEnd[1] + '},');
                changes++;
                continue;
            }

            // 块内的属性行: "//     id: 'city_xxx'," 或 "//     name: 'xxx',"
            // 需要恢复缩进: 去掉 // 但保留后面的缩进
            let propLine = line.match(/^(\s*)\/\/(\s*)(id:|name:|factionId:|lat:|lng:|type:|troops:|tier:|region:|note:)/);
            if (propLine) {
                let indent = propLine[1];       // 缩进前缀 (// 之前的空格)
                let contentIndent = propLine[2]; // // 之后的缩进
                let prop = propLine[3];          // 属性名
                let rest = line.substring(line.indexOf(prop) + prop.length);
                result.push(indent + contentIndent + prop + rest);
                changes++;
                continue;
            }

            // 如果块内有其他格式的行，尝试简单去掉 //
            let simpleUncomment = line.match(/^(\s*)\/\/\s*(.+)/);
            if (simpleUncomment) {
                result.push(simpleUncomment[1] + simpleUncomment[2]);
                changes++;
                continue;
            }
            
            // 如果都不匹配，保留原行
            result.push(line);
            continue;
        }

        // ─── 单行注释的完整城市条目 ───
        // 格式: "    // { id: 'city_langya', name: '琅琊', factionId: 'wang_d', ..., tier: 1 }, [REMOVED: 精简至30核心]"
        // 完整匹配 { id: ... } 的所有内容
        let singleLine = line.match(/^(\s*)\/\/\s*(\{ id: '[^']+',[^}]*\},?\s*)(\/\/\s*)?(\[REMOVED:[^\]]*\])?\s*$/);
        if (singleLine) {
            let indent = singleLine[1];
            let entry = singleLine[2].replace(/\s*\[REMOVED:[^\]]*\]/g, '');
            result.push(indent + entry);
            changes++;
            continue;
        }

        // ─── 其他带 [REMOVED] 的行 ───
        // 例如 closing brace: "// }, [REMOVED: 西域 region]" — 这个应该已经被 blockEnd 处理了
        // 但有些可能没有在块内
        let hasRemoved = line.match(/^(\s*)\/\/\s*(\S.*)\[REMOVED:/);
        if (hasRemoved) {
            let indent = hasRemoved[1];
            let rest = hasRemoved[2].replace(/\s*\[REMOVED:[^\]]*\]/g, '');
            rest = rest.replace(/\s*\/\/\s*$/, '');
            result.push(indent + rest);
            changes++;
            continue;
        }

        // 如果都不匹配，保留原行
        result.push(line);
    }

    // 安全措施: 如果还有打开的块，关闭它
    if (inCommentedBlock) {
        console.warn('[cities_v2.ts] 警告: 文件结束时还有未关闭的注释块');
    }

    fs.writeFileSync(filePath, result.join('\n'), 'utf8');
    console.log(`[cities_v2.ts] 恢复完成: ${changes} 处修改`);
    let finalContent = fs.readFileSync(filePath, 'utf8');
    let remaining = (finalContent.match(/REMOVED/g) || []).length;
    console.log(`[cities_v2.ts] 剩余 REMOVED: ${remaining}`);
    
    // 检查是否有残留的注释行
    let commentedLines = 0;
    let finalLines = finalContent.split('\n');
    for (let line of finalLines) {
        if (line.match(/^(\s*)\/\/\s*\{?\s*id:/)) {
            commentedLines++;
        }
    }
    console.log(`[cities_v2.ts] 残留注释的城市行: ${commentedLines}`);
}

// ============================================================
// 执行
// ============================================================
console.log('=== 全面恢复所有势力和城市数据 (v2) ===\n');

restoreFactions();
console.log('');
restoreCitiesV2();

console.log('\n=== 恢复完成 ===');
console.log('请运行: npx tsc --noEmit');
