
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../public/assets/roads_filtered.geojson');

try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    console.log('File read success.');
    console.log('Type:', data.type);
    if (data.features) {
        console.log('Features count:', data.features.length);
        console.log('Sample feature 0:', JSON.stringify(data.features[0].properties));
    } else {
        console.error('No features found!');
    }
} catch (e) {
    console.error('Error reading file:', e);
}
