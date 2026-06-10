/**
 * 将 SandboxDisplayNames 与 factionFlagMap 中超过 2 字的旗号改为前两字（与旗面渲染一致）
 */
const fs = require('fs');

const to2 = (s) => [...s].slice(0, 2).join('');

function fixSdnFile() {
    const path = 'src/data/SandboxDisplayNames.ts';
    let src = fs.readFileSync(path, 'utf8');
    const changes = [];
    src = src.replace(
        /('([^']+)':\s*')([^']+)(')(,?)(\s*(?:\/\/.*)?)\r?$/gm,
        (full, pre, id, val, post, comma, comment) => {
            if (val === 'RANDOM' || val.includes('RANDOM')) return full;
            if ([...val].length <= 2) return full;
            const next = to2(val);
            changes.push({ id, from: val, to: next });
            return `${pre}${next}${post}${comma || ''}${comment || ''}`;
        }
    );
    if (changes.length) fs.writeFileSync(path, src);
    return changes;
}

function fixFlagMapFile() {
    const path = 'src/assets/CityAssetManager.ts';
    let src = fs.readFileSync(path, 'utf8');
    const start = src.indexOf('factionFlagMap:');
    const end = src.indexOf('\n    };', start);
    if (start < 0 || end < 0) throw new Error('factionFlagMap block not found');
    const head = src.slice(0, start);
    const tail = src.slice(end);
    let block = src.slice(start, end);
    const changes = [];
    block = block.replace(
        /('([^']+)':\s*')([^']+)(')/g,
        (full, pre, id, val, post) => {
            if (val === 'RANDOM' || val.includes('RANDOM')) return full;
            if ([...val].length <= 2) return full;
            const next = to2(val);
            changes.push({ id, from: val, to: next });
            return `${pre}${next}${post}`;
        }
    );
    if (changes.length) fs.writeFileSync(path, head + block + tail);
    return changes;
}

const sdnCh = fixSdnFile();
const fmCh = fixFlagMapFile();
console.log('SDN updated:', sdnCh.length);
sdnCh.forEach((c) => console.log(`  ${c.id}: ${c.from} -> ${c.to}`));
console.log('flagMap updated:', fmCh.length);
fmCh.forEach((c) => console.log(`  ${c.id}: ${c.from} -> ${c.to}`));
