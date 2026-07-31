import fs from 'fs';

const adjustContent = fs.readFileSync('src/data/portrait_adjust.ts', 'utf-8');
const match = adjustContent.match(/export const DEFAULT_PORTRAIT_ADJUST: PortraitAdjustData = ([\s\S]+);/);
let adjustData;
eval('adjustData = ' + match[1]);

let removed = 0;
const toRemove = [
    '/assets/panjun/3112895c-8953-4834-bd6f-808bf18f51cd.png',
    '/assets/panjun/a19a176d-0e0e-474e-8432-9885166629b3.png',
    '/assets/NORTHEAST/dongbei (1).png',
    '/assets/NORTHEAST/dongbei (2).png',
    '/assets/xianqin/b735288e-bbc4-4db6-ad6e-dbb20cce25bf.png' // the 1 left over from my check
];

const images = adjustData.images || {};
for (const p of toRemove) {
    if (p in images) {
        delete images[p];
        removed++;
        console.log('Removed final ghost:', p);
    }
}

if (removed > 0) {
    async function send() {
        try {
            const res = await fetch('http://localhost:5173/api/save-portrait-adjust', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(adjustData)
            });
            const result = await res.json();
            console.log('Save result:', result);
        } catch(e) {
            console.error('Failed to save:', e);
        }
    }
    send();
} else {
    console.log('No ghosts found to remove.');
}
