/**
 * 复现 /api/batch-import 服务端逻辑, 看到底为什么 "ok=true 但不写文件"
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 复制 vite.config.ts 几个辅助函数
function serverInsertIntoStructure(text, keyword, line, indent) {
    const kwIdx = text.indexOf(keyword);
    if (kwIdx === -1) throw new Error('找不到 ' + keyword);
    const lineEnding = text.includes('\r\n') ? '\r\n' : '\n';
    const eqArr = text.indexOf('= [', kwIdx);
    const eqObj = text.indexOf('= {', kwIdx);
    let openIdx, openCh, closeCh;
    if (eqArr !== -1 && (eqObj === -1 || eqArr < eqObj)) { openIdx = eqArr + 2; openCh = '['; closeCh = ']'; }
    else if (eqObj !== -1) { openIdx = eqObj + 2; openCh = '{'; closeCh = '}'; }
    else throw new Error('未找到 = [ 或 = {');
    let depth = 0, closeIdx = -1;
    for (let i = openIdx; i < text.length; i++) {
        if (text[i] === openCh) depth++;
        else if (text[i] === closeCh) { depth--; if (depth === 0) { closeIdx = i; break; } }
    }
    if (closeIdx === -1) throw new Error('未找到匹配 ' + closeCh);
    let scan = closeIdx - 1;
    while (scan > 0 && /\s/.test(text[scan])) scan--;
    const lastCh = text[scan];
    const needsComma = lastCh !== ',' && lastCh !== openCh;
    return text.slice(0, scan + 1) + (needsComma ? ',' : '') + lineEnding + indent + line + text.slice(scan + 1);
}

function serverReplaceArrayBlock(text, keyword, keyName, targetValue, newLine) {
    const kwIdx = text.indexOf(keyword);
    if (kwIdx === -1) throw new Error('未找到 ' + keyword);
    const eqArr = text.indexOf('= [', kwIdx);
    if (eqArr === -1) throw new Error('未找到 = [');
    const searchStr = keyName + ": '" + targetValue + "'";
    const idIdx = text.indexOf(searchStr, eqArr);
    if (idIdx === -1) throw new Error('未找到 ' + searchStr);
    let start = idIdx;
    while (start > 0 && text[start] !== '{') start--;
    let balance = 0, end = -1;
    for (let i = start; i < text.length; i++) {
        if (text[i] === '{') balance++;
        else if (text[i] === '}') { balance--; if (balance === 0) { end = i + 1; break; } }
    }
    if (end === -1) throw new Error('未找到匹配 }');
    let realEnd = end;
    while (realEnd < text.length && /[ \t]/.test(text[realEnd])) realEnd++;
    if (text[realEnd] === ',') realEnd++;
    if (text[realEnd] === '\n') realEnd++;
    if (text[realEnd] === '\r') realEnd++;
    const lineEnding = text.includes('\r\n') ? '\r\n' : '\n';
    return text.slice(0, start) + newLine + lineEnding + text.slice(realEnd);
}

function serverReplaceObjectLine(text, keyword, targetKey, newLine) {
    const kwIdx = text.indexOf(keyword);
    if (kwIdx === -1) throw new Error('未找到 ' + keyword);
    const searchStr = "'" + targetKey + "'";
    const keyIdx = text.indexOf(searchStr, kwIdx);
    if (keyIdx === -1) throw new Error('未找到 ' + searchStr);
    let lineStart = keyIdx;
    while (lineStart > 0 && text[lineStart - 1] !== '\n') lineStart--;
    let lineEnd = keyIdx;
    while (lineEnd < text.length && text[lineEnd] !== '\n' && text[lineEnd] !== '\r') lineEnd++;
    if (text[lineEnd] === '\r') lineEnd++;
    if (text[lineEnd] === '\n') lineEnd++;
    const lineEnding = text.includes('\r\n') ? '\r\n' : '\n';
    return text.slice(0, lineStart) + newLine + lineEnding + text.slice(lineEnd);
}

function serverCheckProximity(citiesText, lat, lng, excludeId) {
    const issues = [];
    const lines = citiesText.split('\n');
    let currentBlock = '';
    for (const line of lines) {
        currentBlock += line + '\n';
        if (line.includes('id:')) currentBlock = line + '\n';
        if (line.includes('},') || line.includes('}\n')) {
            const idMatch = currentBlock.match(/id:\s*'([^']+)'/);
            const nameMatch = currentBlock.match(/name:\s*'([^']+)'/);
            const latMatch = currentBlock.match(/lat:\s*([-\d.]+)/);
            const lngMatch = currentBlock.match(/lng:\s*([-\d.]+)/);
            if (idMatch && nameMatch && latMatch && lngMatch) {
                const id = idMatch[1];
                if (id === excludeId) continue;
                const cLat = parseFloat(latMatch[1]);
                const cLng = parseFloat(lngMatch[1]);
                const R = 6371;
                const dLat = (cLat - lat) * Math.PI / 180;
                const dLng = (cLng - lng) * Math.PI / 180;
                const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(cLat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
                const km = 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                if (km < 50) issues.push({ name: nameMatch[1], km });
            }
            currentBlock = '';
        }
    }
    return issues.sort((a, b) => a.km - b.km);
}

function batchImportFiles(entries) {
    const results = [];
    const factionPath = path.resolve(__dirname, '../src/data/factions.ts');
    const citiesPath = path.resolve(__dirname, '../src/data/cities_v2.ts');
    const gameAppPath = path.resolve(__dirname, '../src/app/GameApp.ts');
    const camPath = path.resolve(__dirname, '../src/assets/CityAssetManager.ts');
    const sdnPath = path.resolve(__dirname, '../src/data/SandboxDisplayNames.ts');

    let factionText = fs.readFileSync(factionPath, 'utf-8');
    let citiesText = fs.readFileSync(citiesPath, 'utf-8');
    let gameAppText = fs.readFileSync(gameAppPath, 'utf-8');
    let camText = fs.readFileSync(camPath, 'utf-8');
    let sdnText = fs.readFileSync(sdnPath, 'utf-8');

    for (const entry of entries) {
        const fId = entry.factionId;
        const cId = entry.cityId;
        const isNewCity = !citiesText.includes("id: '" + cId + "'");
        console.log(`\n=== ENTRY ${entry.factionName}/${entry.cityName} ===`);
        console.log(`  fId=${fId}, cId=${cId}, isNewCity=${isNewCity}, deleteExistingCityId=${entry.deleteExistingCityId}`);

        if (isNewCity) {
            if (entry.deleteExistingCityId) {
                if (!citiesText.includes("id: '" + entry.deleteExistingCityId + "'")) {
                    results.push({ file: 'cities', ok: false, operation: 'skip', error: '未找到 ' + entry.deleteExistingCityId });
                    console.log('  ❌ delete target not found');
                    continue;
                }
            } else {
                const issues = serverCheckProximity(citiesText, entry.lat, entry.lng, cId);
                console.log(`  proximity issues: ${issues.length}`);
                if (issues.length > 0) {
                    results.push({ file: 'cities', ok: false, operation: 'skip', error: `距 ${issues[0].name} 仅 ${issues[0].km.toFixed(1)}km` });
                    console.log('  ❌ proximity fail');
                    continue;
                }
            }
        }

        const isNewFaction = !factionText.includes("id: '" + fId + "'");
        const factionLine = `{ id: '${fId}', name: '${entry.factionName}' },`;
        if (isNewFaction) {
            factionText = serverInsertIntoStructure(factionText, 'FACTIONS', factionLine, '    ');
            results.push({ file: 'factions', ok: true, operation: 'insert' });
        } else {
            factionText = serverReplaceArrayBlock(factionText, 'FACTIONS', 'id', fId, factionLine);
            results.push({ file: 'factions', ok: true, operation: 'replace' });
        }

        const cityLine = `{ id: '${cId}', name: '${entry.cityName}', factionId: '${fId}', lat: ${entry.lat}, lng: ${entry.lng}, type: 'small_city', troops: 5000 },`;
        if (isNewCity) {
            if (entry.deleteExistingCityId) {
                citiesText = citiesText.replace(new RegExp(`\\s*\\{[^}]*id:\\s*'${entry.deleteExistingCityId}'[^}]*\\},?\\s*`, 's'), '\n    ');
                results.push({ file: 'cities', ok: true, operation: 'delete-existing' });
                citiesText = serverInsertIntoStructure(citiesText, 'CITIES_V2', cityLine, '    ');
                results.push({ file: 'cities', ok: true, operation: 'insert-after-delete' });
            } else {
                citiesText = serverInsertIntoStructure(citiesText, 'CITIES_V2', cityLine, '    ');
                results.push({ file: 'cities', ok: true, operation: 'insert' });
            }
        } else {
            citiesText = serverReplaceArrayBlock(citiesText, 'CITIES_V2', 'id', cId, cityLine);
            results.push({ file: 'cities', ok: true, operation: 'replace' });
        }

        const capitalLine = `'${fId}': '${cId}',`;
        if (!gameAppText.includes("'" + fId + "'")) {
            gameAppText = serverInsertIntoStructure(gameAppText, 'STARTING_CAPITALS', capitalLine, '    ');
        } else {
            gameAppText = serverReplaceObjectLine(gameAppText, 'STARTING_CAPITALS', fId, capitalLine);
        }
        results.push({ file: 'gameapp', ok: true });

        const flagHan = entry.flagText.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        const flagLine = `'${fId}': '${flagHan}',`;
        if (!camText.includes("'" + fId + "'")) {
            camText = serverInsertIntoStructure(camText, 'factionFlagMap', flagLine, '        ');
            results.push({ file: 'cam', ok: true, operation: 'insert' });
        } else {
            camText = serverReplaceObjectLine(camText, 'factionFlagMap', fId, flagLine);
            results.push({ file: 'cam', ok: true, operation: 'replace' });
        }

        const sdnLine = `'${fId}': '${entry.flagText}',`;
        if (!sdnText.includes("'" + fId + "'")) {
            sdnText = serverInsertIntoStructure(sdnText, 'SANDBOX_DISPLAY_NAMES', sdnLine, '    ');
            results.push({ file: 'sdn', ok: true, operation: 'insert' });
        } else {
            sdnText = serverReplaceObjectLine(sdnText, 'SANDBOX_DISPLAY_NAMES', sdnLine, '    ');
            results.push({ file: 'sdn', ok: true, operation: 'replace' });
        }

        console.log(`  ✅ all 5 files processed`);
    }

    const anyFailure = results.some(r => !r.ok);
    console.log(`\n========= anyFailure=${anyFailure}, total results=${results.length} =========`);

    if (!anyFailure) {
        console.log('✍️ 模拟写入文件 (实际不写, 看是否会到这里)');
    } else {
        console.log('❌ skip writes');
        for (const r of results.filter(r => !r.ok)) {
            console.log(`   FAIL: ${r.file} ${r.operation}: ${r.error}`);
        }
    }
    return results;
}

// 模拟用户的请求 (4 跳过 + 3 处理)
const entries = [
    { factionName: '咄陆', flagText: '咄陆', cityName: '孛罗城', lat: 44.9, lng: 82.07, factionId: 'duolu', cityId: 'city_boluocheng' },
    { factionName: '朱邪', flagText: '朱邪', cityName: '独山城', lat: 44.42, lng: 84.92, factionId: 'zhuye', cityId: 'city_dushancheng' },
    // 务涂城 跳过
    // 高昌城 跳过
    // 哈密城 跳过
    // 晋昌城 跳过
    { factionName: '浑邪', flagText: '浑邪', cityName: '酒泉城', lat: 39.73, lng: 98.49, factionId: 'hunye', cityId: 'city_jiuquan' }, // 注: cityId 匹配现有 酒泉
];

const results = batchImportFiles(entries);
const errCount = results.filter(r => !r.ok).length;
console.log(`\n========= 最终: errCount=${errCount}, ok=${errCount === 0} =========`);
