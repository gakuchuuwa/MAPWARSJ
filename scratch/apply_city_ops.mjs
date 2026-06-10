/**
 * One-off: delete 阴平/浪卡子 (+ factions), add 吉麦 (panjun)
 * Mirrors vite.config.ts batchDeleteFiles + cities insert
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function serverDeleteObjectLine(text, keyword, targetKey) {
    const kwIdx = text.indexOf(keyword);
    if (kwIdx === -1) throw new Error(`找不到 ${keyword}`);
    const searchStr = `'${targetKey}'`;
    const keyIdx = text.indexOf(searchStr, kwIdx);
    if (keyIdx === -1) throw new Error(`找不到 ${searchStr} in ${keyword}`);
    let lineStart = keyIdx;
    while (lineStart > 0 && text[lineStart - 1] !== '\n') lineStart--;
    let lineEnd = keyIdx;
    while (lineEnd < text.length && text[lineEnd] !== '\n' && text[lineEnd] !== '\r') lineEnd++;
    if (text[lineEnd] === '\r') lineEnd++;
    if (text[lineEnd] === '\n') lineEnd++;
    return text.slice(0, lineStart) + text.slice(lineEnd);
}

function serverDeleteArrayBlock(text, keyword, keyName, targetValue) {
    const kwIdx = text.indexOf(keyword);
    if (kwIdx === -1) throw new Error(`找不到 ${keyword}`);
    const searchStr = `${keyName}: '${targetValue}'`;
    let idx = text.indexOf(searchStr, kwIdx);
    if (idx === -1) idx = text.indexOf(searchStr);
    if (idx === -1) throw new Error(`找不到 ${searchStr}`);
    let start = idx;
    while (start > 0 && text[start] !== '{') start--;
    let balance = 0, end = -1;
    for (let i = start; i < text.length; i++) {
        if (text[i] === '{') balance++;
        else if (text[i] === '}') { balance--; if (balance === 0) { end = i + 1; break; } }
    }
    if (end === -1) throw new Error('找不到匹配的 }');
    let realEnd = end;
    while (realEnd < text.length && /[ ,\t\r\n]/.test(text[realEnd])) realEnd++;
    return text.slice(0, start) + text.slice(realEnd);
}

function serverDeleteCityBlock(text, cityId) {
    const searchStr = `id: '${cityId}'`;
    const idx = text.indexOf(searchStr);
    if (idx === -1) throw new Error(`找不到 ${searchStr}`);
    let start = idx;
    while (start > 0 && text[start] !== '{') start--;
    let balance = 0, end = -1;
    for (let i = start; i < text.length; i++) {
        if (text[i] === '{') balance++;
        else if (text[i] === '}') { balance--; if (balance === 0) { end = i + 1; break; } }
    }
    if (end === -1) throw new Error('找不到匹配的 }');
    let realEnd = end;
    while (realEnd < text.length && /[ ,\t\r\n]/.test(text[realEnd])) realEnd++;
    return text.slice(0, start) + text.slice(realEnd);
}

function serverDeleteRoadsByCity(text, cityId) {
    const lines = text.split('\n');
    const outLines = [];
    let deletedCount = 0;
    let inBlock = false;
    let blockLines = [];
    let blockBraceDepth = 0;
    const refs = [
        `startConnection: "${cityId}"`, `startConnection: '${cityId}'`,
        `endConnection: "${cityId}"`, `endConnection: '${cityId}'`,
    ];
    for (const line of lines) {
        if (!inBlock) {
            if (/^\s*\{\s*$/.test(line)) {
                inBlock = true;
                blockLines = [line];
                blockBraceDepth = 1;
            } else {
                outLines.push(line);
            }
        } else {
            blockLines.push(line);
            for (const c of line) {
                if (c === '{') blockBraceDepth++;
                else if (c === '}') blockBraceDepth--;
            }
            if (blockBraceDepth === 0) {
                const blockText = blockLines.join('\n');
                if (refs.some(r => blockText.includes(r))) deletedCount++;
                else outLines.push(...blockLines);
                inBlock = false;
                blockLines = [];
            }
        }
    }
    return { newText: outLines.join('\n'), deletedCount };
}

function serverInsertIntoStructure(text, keyword, line, indent) {
    const kwIdx = text.indexOf(keyword);
    if (kwIdx === -1) throw new Error(`找不到 ${keyword}`);
    const lineEnding = text.includes('\r\n') ? '\r\n' : '\n';
    const eqArr = text.indexOf('= [', kwIdx);
    if (eqArr === -1) throw new Error('未找到 = [');
    let depth = 0, closeIdx = -1;
    for (let i = eqArr + 2; i < text.length; i++) {
        if (text[i] === '[') depth++;
        else if (text[i] === ']') { depth--; if (depth === 0) { closeIdx = i; break; } }
    }
    if (closeIdx === -1) throw new Error('未找到 ]');
    let scan = closeIdx - 1;
    while (scan > 0 && /\s/.test(text[scan])) scan--;
    const needsComma = text[scan] !== ',' && text[scan] !== '[';
    return text.slice(0, scan + 1) + (needsComma ? ',' : '') + lineEnding + indent + line + text.slice(scan + 1);
}

function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function checkProximity(citiesText, lat, lng, excludeId) {
    const issues = [];
    const re = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)'[^}]*lat:\s*([-\d.]+),\s*lng:\s*([-\d.]+)/g;
    let m;
    while ((m = re.exec(citiesText)) !== null) {
        const [, id, name, cLat, cLng] = m;
        if (id === excludeId) continue;
        const km = haversineKm(lat, lng, parseFloat(cLat), parseFloat(cLng));
        if (km < 50) issues.push({ name, km });
    }
    return issues;
}

const targets = [
    { factionId: 'baima', cityId: 'city_yinping' },
    { factionId: 'yangzhuo', cityId: 'city_langkazi' },
];

const paths = {
    factions: path.join(root, 'src/data/factions.ts'),
    cities: path.join(root, 'src/data/cities_v2.ts'),
    capitals: path.join(root, 'src/data/StartingCapitals.ts'),
    cam: path.join(root, 'src/assets/CityAssetManager.ts'),
    sdn: path.join(root, 'src/data/SandboxDisplayNames.ts'),
    roads: path.join(root, 'src/data/VectorRoadData.ts'),
};

let factionText = fs.readFileSync(paths.factions, 'utf-8');
let citiesText = fs.readFileSync(paths.cities, 'utf-8');
let capitalsText = fs.readFileSync(paths.capitals, 'utf-8');
let camText = fs.readFileSync(paths.cam, 'utf-8');
let sdnText = fs.readFileSync(paths.sdn, 'utf-8');
let roadsText = fs.readFileSync(paths.roads, 'utf-8');

for (const t of targets) {
    if (t.factionId) {
        factionText = serverDeleteArrayBlock(factionText, 'FACTIONS', 'id', t.factionId);
        if (capitalsText.includes(`'${t.factionId}':`)) {
            capitalsText = serverDeleteObjectLine(capitalsText, 'STARTING_CAPITALS', t.factionId);
        }
        if (camText.includes(`'${t.factionId}':`)) {
            camText = serverDeleteObjectLine(camText, 'factionFlagMap', t.factionId);
        }
        if (sdnText.includes(`'${t.factionId}':`)) {
            sdnText = serverDeleteObjectLine(sdnText, 'SANDBOX_DISPLAY_NAMES', t.factionId);
        }
    }
    if (t.cityId) {
        citiesText = serverDeleteCityBlock(citiesText, t.cityId);
        const { newText, deletedCount } = serverDeleteRoadsByCity(roadsText, t.cityId);
        roadsText = newText;
        console.log(`Deleted ${t.cityId}, removed ${deletedCount} roads`);
    }
}

const jimaiLat = 29.3012;
const jimaiLng = 90.6812;
const jimaiId = 'city_jimai';
const proximity = checkProximity(citiesText, jimaiLat, jimaiLng, jimaiId);
if (proximity.length > 0) {
    console.error('Proximity check failed:', proximity);
    process.exit(1);
}

const jimaiLine = `{ id: '${jimaiId}', name: '吉麦', factionId: 'panjun', lat: ${jimaiLat}, lng: ${jimaiLng}, type: 'small_city', troops: 5000 },`;
citiesText = serverInsertIntoStructure(citiesText, 'CITIES_V2', jimaiLine, '    ');
console.log('Added 吉麦 (panjun)');

fs.writeFileSync(paths.factions, factionText, 'utf-8');
fs.writeFileSync(paths.cities, citiesText, 'utf-8');
fs.writeFileSync(paths.capitals, capitalsText, 'utf-8');
fs.writeFileSync(paths.cam, camText, 'utf-8');
fs.writeFileSync(paths.sdn, sdnText, 'utf-8');
fs.writeFileSync(paths.roads, roadsText, 'utf-8');
console.log('✅ All 6 files written');
