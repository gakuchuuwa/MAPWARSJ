import fs from 'fs';
import path from 'path';

let errors = 0;

// 1. Clean Canonical
const canonicalText = fs.readFileSync('src/config/portrait_canonical.ts', 'utf-8');
const cMatch = canonicalText.match(/export const PORTRAIT_CANONICAL_MAP: Readonly<Record<string, string>> = ([\s\S]+);/);
let canonicalMap: Record<string, string>;
eval('canonicalMap = ' + cMatch[1]);

let removedCanonical = 0;
for (const source in canonicalMap) {
    const target = canonicalMap[source];
    if (!fs.existsSync(path.join('public', target))) {
        delete canonicalMap[source];
        removedCanonical++;
    }
}

if (removedCanonical > 0) {
    let newContent = 'export const PORTRAIT_CANONICAL_MAP: Readonly<Record<string, string>> = {\n';
    const entries = Object.entries(canonicalMap);
    for (let i = 0; i < entries.length; i++) {
        newContent += `    "${entries[i][0]}": "${entries[i][1]}"${i === entries.length - 1 ? '\n' : ',\n'}`;
    }
    newContent += '};\n';
    const newFullContent = canonicalText.replace(/export const PORTRAIT_CANONICAL_MAP: Readonly<Record<string, string>> = [\s\S]+;/, newContent.trim());
    fs.writeFileSync('src/config/portrait_canonical.ts', newFullContent);
    console.log('Removed ' + removedCanonical + ' dead canonical targets.');
}

// 2. Clean Adjust
const adjustContent = fs.readFileSync('src/data/portrait_adjust.ts', 'utf-8');
const match = adjustContent.match(/export const DEFAULT_PORTRAIT_ADJUST: PortraitAdjustData = ([\s\S]+);/);
let adjustData;
eval('adjustData = ' + match[1]);

let removedAdjust = 0;
const images = adjustData.images || {};
for (const p of Object.keys(images)) {
    const exists = fs.existsSync(path.join('public', p));
    const inCanonical = p in canonicalMap || Object.values(canonicalMap).includes(p);
    
    if (!exists && !inCanonical) {
        delete images[p];
        removedAdjust++;
    }
}

if (removedAdjust > 0) {
    async function send() {
        try {
            const res = await fetch('http://localhost:5173/api/save-portrait-adjust', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(adjustData)
            });
            const result = await res.json();
            console.log('Removed ' + removedAdjust + ' ghost entries in adjust. Save result:', result);
        } catch(e) {
            console.error('Failed to save to vite server:', e);
        }
    }
    send();
}
