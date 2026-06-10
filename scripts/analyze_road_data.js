
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'source-data/ne_10m_roads.geojson');

try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);

    console.log(`Total Features: ${data.features.length}`);

    if (data.features.length > 0) {
        console.log('Sample properties:', Object.keys(data.features[0].properties));
    }

    const typeCounts = {};

    // Map of known property names for "type"
    const typeKey = 'type'; // or 'class' or 'featurecla'

    data.features.forEach(f => {
        const type = f.properties[typeKey] || f.properties['class'] || f.properties['featurecla'] || 'unknown';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    console.log('\n--- Road Types Distribution ---');
    console.table(typeCounts);

} catch (e) {
    console.error('Error:', e.message);
}
