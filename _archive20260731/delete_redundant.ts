import fs from 'fs';
import path from 'path';

const filesToDelete = [
    'public/assets/pugan/basha_d_daogengmeng.png',
    'public/assets/pugan/siam_nalixuan_pugan.png',
    'public/assets/pugan/__闲置__pugan_05.png',
    'public/assets/NORTHEAST/manzhou_nuerhachi.png'
];

let deletedFiles = 0;
for (const file of filesToDelete) {
    if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log('Deleted physical file:', file);
        deletedFiles++;
    } else {
        console.log('File already missing:', file);
    }
}

const adjustContent = fs.readFileSync('src/data/portrait_adjust.ts', 'utf-8');
const match = adjustContent.match(/export const DEFAULT_PORTRAIT_ADJUST: PortraitAdjustData = ([\s\S]+);/);
if (!match) process.exit(1);

let data;
eval('data = ' + match[1]);

let deletedConfig = 0;
const images = data.images || {};
const configKeysToDelete = [
    '/assets/pugan/basha_d_daogengmeng.png',
    '/assets/pugan/siam_nalixuan_pugan.png',
    '/assets/pugan/__闲置__pugan_05.png',
    '/assets/NORTHEAST/manzhou_nuerhachi.png'
];

for (const key of configKeysToDelete) {
    if (key in images) {
        delete images[key];
        deletedConfig++;
        console.log('Deleted config entry:', key);
    }
}

if (deletedConfig > 0) {
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
} else {
    console.log('No config entries needed deletion.');
}
