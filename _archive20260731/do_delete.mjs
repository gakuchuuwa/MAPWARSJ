import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function serverDeleteObjectLine(text, keyword, targetKey) {
    const kwIdx = text.indexOf(keyword);
    if (kwIdx === -1) throw new Error(`找不到关键字 "${keyword}"`);
    const searchStr = `'${targetKey}':`;
    const keyIdx = text.indexOf(searchStr, kwIdx);
    if (keyIdx === -1) throw new Error(`在 ${keyword} 中找不到 key '${targetKey}':`);
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
    if (kwIdx === -1) throw new Error(`找不到关键字 "${keyword}"`);
    const searchStr = `${keyName}: '${targetValue}'`;
    let idx = text.indexOf(searchStr, kwIdx);
    if (idx === -1) idx = text.indexOf(searchStr);
    if (idx === -1) throw new Error(`在 ${keyword} 中找不到 ${searchStr}`);
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

function batchDeleteFiles(targets) {
    const factionPath = path.resolve(__dirname, 'src/data/factions.ts');
    const citiesPath = path.resolve(__dirname, 'src/data/cities_v2.ts');
    const gameAppPath = path.resolve(__dirname, 'src/app/GameApp.ts');
    const camPath = path.resolve(__dirname, 'src/assets/CityAssetManager.ts');
    const sdnPath = path.resolve(__dirname, 'src/data/SandboxDisplayNames.ts');

    let factionText = fs.readFileSync(factionPath, 'utf-8');
    let citiesText = fs.readFileSync(citiesPath, 'utf-8');
    let gameAppText = fs.readFileSync(gameAppPath, 'utf-8');
    let camText = fs.readFileSync(camPath, 'utf-8');
    let sdnText = fs.readFileSync(sdnPath, 'utf-8');

    for (const t of targets) {
        const fId = t.factionId;
        if (fId) {
            factionText = serverDeleteArrayBlock(factionText, 'FACTIONS', 'id', fId);
            if (gameAppText.includes(`'${fId}':`)) gameAppText = serverDeleteObjectLine(gameAppText, 'STARTING_CAPITALS', fId);
            if (camText.includes(`'${fId}':`)) camText = serverDeleteObjectLine(camText, 'factionFlagMap', fId);
            if (sdnText.includes(`'${fId}':`)) sdnText = serverDeleteObjectLine(sdnText, 'SANDBOX_DISPLAY_NAMES', fId);
        }
    }
    fs.writeFileSync(factionPath, factionText, 'utf-8');
    fs.writeFileSync(citiesPath, citiesText, 'utf-8');
    fs.writeFileSync(gameAppPath, gameAppText, 'utf-8');
    fs.writeFileSync(camPath, camText, 'utf-8');
    fs.writeFileSync(sdnPath, sdnText, 'utf-8');
    console.log('✅ Deleted empty factions successfully.');
}

const targets = [
  { factionId: 'zhai_d', cityId: null },
  { factionId: 'chaoxian', cityId: null },
  { factionId: 'khalkha', cityId: null }
];
batchDeleteFiles(targets);
