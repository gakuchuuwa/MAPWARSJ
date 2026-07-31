import fs from 'fs';

const adjustContent = fs.readFileSync('src/data/portrait_adjust.ts', 'utf-8');
const match = adjustContent.match(/export const DEFAULT_PORTRAIT_ADJUST: PortraitAdjustData = ([\s\S]+);/);
if (!match) process.exit(1);

let data;
eval('data = ' + match[1]);

let fixedCount = 0;
const images = data.images || {};
for (const p of Object.keys(images)) {
    const img = images[p];
    if (typeof img.scale === 'number') {
        const rounded = Math.round(img.scale * 100) / 100;
        if (img.scale !== rounded) {
            img.scale = rounded;
            fixedCount++;
        }
    }
}

console.log(`Fixed ${fixedCount} floating point scales.`);

async function send() {
    if (fixedCount === 0) return;
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
