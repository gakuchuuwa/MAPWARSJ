import fs from 'fs';
import path from 'path';
import { PORTRAIT_CANONICAL_MAP } from './src/config/portrait_canonical';

const adjustContent = fs.readFileSync('src/data/portrait_adjust.ts', 'utf-8');
const match = adjustContent.match(/export const DEFAULT_PORTRAIT_ADJUST: PortraitAdjustData = ([\s\S]+);/);
if (!match) process.exit(1);

let data;
eval('data = ' + match[1]);

let deletedCount = 0;
const images = data.images || {};
for (const p of Object.keys(images)) {
    const fullPath = path.join('public', p);
    const exists = fs.existsSync(fullPath);
    const inCanonical = p in PORTRAIT_CANONICAL_MAP || Object.values(PORTRAIT_CANONICAL_MAP).includes(p);
    
    if (!exists && !inCanonical) {
        delete images[p];
        deletedCount++;
        console.log('Deleted:', p);
    }
}

// Fix missing sample paths
let fixedGuides = 0;
const guides = data.folderGuides || {};
for (const folder of Object.keys(guides)) {
    const guide = guides[folder];
    if (guide.samplePath && !fs.existsSync(path.join('public', guide.samplePath))) {
        guide.samplePath = '';
        fixedGuides++;
        console.log('Cleared samplePath for:', folder);
    }
}

console.log(`\nDeleted ${deletedCount} ghost images. Cleared ${fixedGuides} invalid samplePaths.`);

// I will now use the exact formatting function used by the server
const serverText = fs.readFileSync('vite.config.ts', 'utf-8');
const formatMatch = serverText.match(/function serverFormatPortraitAdjustFile[\s\S]*?\n\nfunction /);

if (formatMatch) {
    const formatFnStr = formatMatch[0].replace('function serverFormatPortraitAdjustFile', 'function formatData').replace(/\n\nfunction $/, '');
    // Need to execute formatFnStr
    // Actually, it's safer to just send it to the running Vite server if it's up!
}

// Or we can just send it via fetch to the running dev server
async function send() {
    try {
        const res = await fetch('http://localhost:5173/api/save-portrait-adjust', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const result = await res.json();
        console.log('Save result:', result);
    } catch(e) {
        console.error('Failed to save to vite server:', e);
    }
}

send();
