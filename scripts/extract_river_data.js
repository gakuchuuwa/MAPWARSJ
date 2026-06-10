
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../public/assets/ne_10m_rivers_lake_centerlines.geojson');

console.log(`Reading file: ${filePath}`);

try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);

    console.log(`Total features: ${data.features.length}`);

    // Find Jialing
    // Check key names first
    if (data.features.length > 0) {
        console.log('Sample properties keys:', Object.keys(data.features[0].properties));
    }

    const results = data.features.filter(f => {
        const props = f.properties;
        // Search all string values
        return Object.values(props).some(val =>
            typeof val === 'string' && (val.toLowerCase().includes('jialing') || val.includes('嘉陵'))
        );
    });

    console.log(`Found ${results.length} features matching 'Jialing' or '嘉陵'`);

    results.forEach((f, i) => {
        console.log(`\n--- Feature ${i} ---`);
        console.log('Properties:', JSON.stringify(f.properties, null, 2));
        console.log('Geometry Type:', f.geometry.type);
        const coords = f.geometry.coordinates;

        // Output formatted for TypeScript copy-paste
        // If it's a LineString, it's [ [x,y], [x,y] ]
        // If MultiLineString, it's [ [ [x,y]... ] ]

        let coordinatesToProcess = [];
        if (f.geometry.type === 'LineString') {
            coordinatesToProcess = coords;
        } else if (f.geometry.type === 'MultiLineString') {
            // Flatten MultiLineString to a single array of points if they are connected, 
            // or just take the longest segment? 
            // For simplicity, let's take the first segment as it was shown in previous logs, 
            // or flatten all segments. 
            // Better: Process each segment and see which one falls in the box.
            // Actually, let's just flatten all points into one list for filtering, 
            // but that might create "jump" artifacts if segments are disjoint.
            // Let's treat them as separate lines or pick the one with most points in range.

            // Just use the first segment for now as it seemed to cover the area.
            coordinatesToProcess = coords[0];
            console.log('Using first segment of MultiLineString for extraction.');
        }

        if (coordinatesToProcess.length > 0) {
            // Filter for Chencang Road (Lat 33.1 - 34.5)
            const roadCoords = coordinatesToProcess.filter(c => c[1] >= 33.1 && c[1] <= 34.5);

            if (roadCoords.length > 0) {
                const roadFeature = {
                    type: 'Feature',
                    properties: {
                        name: "陈仓道",
                        type: "road",
                        id: "road_chencang",
                        startYear: -206,
                        color: "#5D4037"
                    },
                    geometry: {
                        type: 'LineString',
                        coordinates: roadCoords
                    }
                };

                fs.writeFileSync(path.join(__dirname, '../public/assets/road_chencang.geojson'), JSON.stringify(roadFeature, null, 2));
                console.log('Saved Chencang Road to public/assets/road_chencang.geojson');
            } else {
                console.log('No coordinates found in range 33.1-34.5');
            }
        }
    });

} catch (e) {
    console.error('Error:', e);
}
