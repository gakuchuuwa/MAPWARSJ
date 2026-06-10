
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFile = path.join(__dirname, 'source-data/ne_10m_roads.geojson');
const outputFile = path.join(__dirname, '../public/assets/roads_filtered.geojson');

// Bounds: Asia / China Focus (Based on Cities)
// Min Lon: 63 (Central Asia - covers 蓝氏城 at 68.86°E)
// Max Lon: 145 (Japan/Far East)
// Min Lat: 15 (SE Asia)
// Max Lat: 55 (Siberia/North)
const BOUNDS = { minLng: 63, maxLng: 145, minLat: 15, maxLat: 55 };

try {
    console.log(`Reading ${inputFile}...`);
    const raw = fs.readFileSync(inputFile, 'utf8');
    const data = JSON.parse(raw);
    const total = data.features.length;

    console.log(`Original Features: ${total}`);

    const filtered = data.features.filter(f => {
        // 1. Type Filter
        const type = f.properties.type;
        if (type === 'Expressway') return false; // Modern highways
        if (type === 'Ferry Route') return false; // Exclude ferries (handled by game logic)

        // 2. Geographic Filter (Bounding Box)
        // Check if any point in the LineString/MultiLineString is within bounds
        // Skip features without geometry
        if (!f.geometry || !f.geometry.coordinates) {
            return false;
        }

        const coords = f.geometry.coordinates;
        let inBounds = false;

        // Flatten coordinate array: MultiLineString has nested arrays
        const pts = f.geometry.type === 'MultiLineString' ? coords.reduce((a, b) => a.concat(b), []) : coords;

        // Simple check: if at least one point is in bounds
        for (const pt of pts) {
            if (!pt || pt.length < 2) continue;
            const lng = pt[0];
            const lat = pt[1];
            if (lng >= BOUNDS.minLng && lng <= BOUNDS.maxLng &&
                lat >= BOUNDS.minLat && lat <= BOUNDS.maxLat) {
                inBounds = true;
                break;
            }
        }
        return inBounds;
    });

    const newData = {
        type: "FeatureCollection",
        features: filtered
    };

    fs.writeFileSync(outputFile, JSON.stringify(newData));
    console.log(`\nFiltered Features: ${filtered.features.length}`);
    console.log(`Reduction: ${Math.round((1 - filtered.features.length / total) * 100)}% smaller`);
    console.log(`Saved to ${outputFile}`);

} catch (e) {
    console.error('Error:', e.message);
}
