/**
 * 删除据点 city_uzgen（乌兹干）并同步道路与 radial_network.geojson
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const CITY_ID = 'city_uzgen';

function serverDeleteCityBlock(text, targetId) {
    const searchStr = `id: '${targetId}'`;
    const idx = text.indexOf(searchStr);
    if (idx === -1) throw new Error(`找不到 city_id: ${targetId}`);
    let start = idx;
    while (start > 0 && text[start] !== '{') start--;
    let balance = 0, end = -1;
    for (let i = start; i < text.length; i++) {
        if (text[i] === '{') balance++;
        else if (text[i] === '}') {
            balance--;
            if (balance === 0) { end = i + 1; break; }
        }
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
        `startConnection: "${cityId}"`,
        `startConnection: '${cityId}'`,
        `endConnection: "${cityId}"`,
        `endConnection: '${cityId}'`,
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
            const opens = (line.match(/\{/g) || []).length;
            const closes = (line.match(/\}/g) || []).length;
            blockBraceDepth += opens - closes;
            if (blockBraceDepth === 0) {
                const blockText = blockLines.join('\n');
                const hits = refs.some(r => blockText.includes(r));
                if (hits) deletedCount++;
                else outLines.push(...blockLines);
                inBlock = false;
                blockLines = [];
            }
        }
    }
    return { newText: outLines.join('\n'), deletedCount };
}

// 1. cities_v2.ts
const citiesPath = path.join(root, 'src/data/cities_v2.ts');
let citiesText = fs.readFileSync(citiesPath, 'utf-8');
citiesText = serverDeleteCityBlock(citiesText, CITY_ID);
fs.writeFileSync(citiesPath, citiesText, 'utf-8');
console.log('✅ cities_v2.ts');

// 2. VectorRoadData.ts
const roadsPath = path.join(root, 'src/data/VectorRoadData.ts');
let roadsText = fs.readFileSync(roadsPath, 'utf-8');
const { newText, deletedCount } = serverDeleteRoadsByCity(roadsText, CITY_ID);
fs.writeFileSync(roadsPath, newText, 'utf-8');
console.log(`✅ VectorRoadData.ts (${deletedCount} roads)`);

// 3. radial_network.geojson
const geoPath = path.join(root, 'public/assets/radial_network.geojson');
const geo = JSON.parse(fs.readFileSync(geoPath, 'utf-8'));
const before = geo.features.length;
geo.features = geo.features.filter(f => {
    const p = f.properties || {};
    return p.from !== CITY_ID && p.to !== CITY_ID;
});
fs.writeFileSync(geoPath, JSON.stringify(geo, null, 2) + '\n', 'utf-8');
console.log(`✅ radial_network.geojson (${before - geo.features.length} edges removed)`);

// 4. EventParser 别名（乌兹干据点已删，保留 kala 其余别名即可）
const epPath = path.join(root, 'src/events/EventParser.ts');
let epText = fs.readFileSync(epPath, 'utf-8');
epText = epText.replace(/,?\s*'乌兹干':\s*'kala'/g, '');
fs.writeFileSync(epPath, epText, 'utf-8');
console.log('✅ EventParser.ts');

console.log('Done: 乌兹干已删除');
