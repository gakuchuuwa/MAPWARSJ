import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

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
    let balance = 0;
    let end = -1;
    for (let i = start; i < text.length; i++) {
        if (text[i] === '{') balance++;
        else if (text[i] === '}') {
            balance--;
            if (balance === 0) {
                end = i + 1;
                break;
            }
        }
    }
    if (end === -1) throw new Error('找不到匹配的 }');
    let realEnd = end;
    while (realEnd < text.length && /[ ,\t\r\n]/.test(text[realEnd])) realEnd++;
    return text.slice(0, start) + text.slice(realEnd);
}

function batchDeleteFiles(targets) {
    const factionPath = path.join(root, 'src/data/factions.ts');
    const startingCapitalsPath = path.join(root, 'src/data/StartingCapitals.ts');
    const camPath = path.join(root, 'src/assets/CityAssetManager.ts');
    const sdnPath = path.join(root, 'src/data/SandboxDisplayNames.ts');

    let factionText = fs.readFileSync(factionPath, 'utf-8');
    let startingCapitalsText = fs.readFileSync(startingCapitalsPath, 'utf-8');
    let camText = fs.readFileSync(camPath, 'utf-8');
    let sdnText = fs.readFileSync(sdnPath, 'utf-8');

    const errors = [];

    for (const fId of targets) {
        try {
            factionText = serverDeleteArrayBlock(factionText, 'FACTIONS', 'id', fId);
        } catch (e) {
            errors.push({ fId, file: 'factions.ts', error: e.message });
        }
        if (startingCapitalsText.includes(`'${fId}':`)) {
            try {
                startingCapitalsText = serverDeleteObjectLine(startingCapitalsText, 'STARTING_CAPITALS', fId);
            } catch (e) {
                errors.push({ fId, file: 'StartingCapitals.ts', error: e.message });
            }
        }
        if (camText.includes(`'${fId}':`)) {
            try {
                camText = serverDeleteObjectLine(camText, 'factionFlagMap', fId);
            } catch (e) {
                errors.push({ fId, file: 'CityAssetManager.ts', error: e.message });
            }
        }
        if (sdnText.includes(`'${fId}':`)) {
            try {
                sdnText = serverDeleteObjectLine(sdnText, 'SANDBOX_DISPLAY_NAMES', fId);
            } catch (e) {
                errors.push({ fId, file: 'SandboxDisplayNames.ts', error: e.message });
            }
        }
    }

    if (errors.length) {
        console.error('ERRORS', errors);
        process.exit(1);
    }

    fs.writeFileSync(factionPath, factionText, 'utf-8');
    fs.writeFileSync(startingCapitalsPath, startingCapitalsText, 'utf-8');
    fs.writeFileSync(camPath, camText, 'utf-8');
    fs.writeFileSync(sdnPath, sdnText, 'utf-8');
    console.log('deleted', targets.length, 'factions');
}

const citiesText = fs.readFileSync(path.join(root, 'src/data/cities_v2.ts'), 'utf-8');
const bound = new Set();
const factionRe = /factionId:\s*'([^']+)'/g;
let m;
while ((m = factionRe.exec(citiesText))) bound.add(m[1]);

const facText = fs.readFileSync(path.join(root, 'src/data/factions.ts'), 'utf-8');
const facRe = /\{ id: '([^']+)', name: '([^']+)'/g;
const orphans = [];
while ((m = facRe.exec(facText))) {
    if (m[1] !== 'panjun' && !bound.has(m[1])) orphans.push(m[1]);
}

console.log('orphans to delete:', orphans.length, orphans.join(', '));
batchDeleteFiles(orphans);
