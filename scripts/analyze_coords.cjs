
const fs = require('fs');
const path = require('path');

// Read the cities.ts file
const content = fs.readFileSync('d:/MAPWARSJ/src/data/cities.ts', 'utf8');

// Extract the array content using regex
const match = content.match(/export const CITIES: CityData\[\] = \[\s*([\s\S]*?)\];/);
if (!match) {
    console.error("Could not find CITIES array");
    process.exit(1);
}

const rawData = match[1];

// Parse the object literals manually since it's TS, not JSON
// This is a rough parser assuming keys are unquoted and values can be strings, numbers, or booleans
const cities = [];
const lines = rawData.split('\n');

for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed === '' || trimmed.startsWith('export') || trimmed.startsWith(']')) continue;

    // Simple extraction of key fields
    const idMatch = trimmed.match(/id:\s*'([^']+)'/);
    const nameMatch = trimmed.match(/name:\s*'([^']+)'/);
    const latMatch = trimmed.match(/lat:\s*(-?[\d.]+)/);
    const lngMatch = trimmed.match(/lng:\s*(-?[\d.]+)/);

    if (idMatch && nameMatch && latMatch && lngMatch) {
        cities.push({
            id: idMatch[1],
            name: nameMatch[1],
            lat: parseFloat(latMatch[1]),
            lng: parseFloat(lngMatch[1])
        });
    }
}

console.log(`Parsed ${cities.length} cities.`);

const duplicates = [];
const closePairs = [];
const THRESHOLD = 0.05; // Less than ~5km approx

for (let i = 0; i < cities.length; i++) {
    for (let j = i + 1; j < cities.length; j++) {
        const c1 = cities[i];
        const c2 = cities[j];

        if (c1.lat === c2.lat && c1.lng === c2.lng) {
            duplicates.push(`${c1.name}(${c1.id}) and ${c2.name}(${c2.id}) at [${c1.lat}, ${c1.lng}]`);
        } else {
            const dist = Math.sqrt(Math.pow(c1.lat - c2.lat, 2) + Math.pow(c1.lng - c2.lng, 2));
            if (dist < THRESHOLD) {
                closePairs.push(`${c1.name}(${c1.id}) and ${c2.name}(${c2.id}) distance: ${dist.toFixed(4)}`);
            }
        }
    }
}

console.log("\n--- Duplicate Coordinates ---");
if (duplicates.length > 0) {
    duplicates.forEach(d => console.log(d));
} else {
    console.log("No exact duplicates found.");
}

console.log("\n--- Close Proximity Cities (Distance < " + THRESHOLD + ") ---");
if (closePairs.length > 0) {
    closePairs.forEach(d => console.log(d));
} else {
    console.log("No cities found within proximity threshold.");
}
