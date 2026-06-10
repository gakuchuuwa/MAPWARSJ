
const fs = require('fs');
const path = require('path');

// --- Minimal GridSystem Logic (Replicated from Source) ---

const ORIGIN = { lat: 34.26, lng: 108.94 };
const HEX_RADIUS = 0.15;
const PROJECTION_FACTOR = 1 / Math.cos(34.26 * Math.PI / 180);

function hexToLatLng(q, r) {
    const dist = Math.sqrt(3) * HEX_RADIUS;
    const x_offset = (q * dist * Math.cos(0)) + (r * dist * Math.cos(Math.PI / 3));
    const y_offset = (q * dist * Math.sin(0)) + (r * dist * Math.sin(Math.PI / 3));
    const lng_offset = x_offset * PROJECTION_FACTOR;
    return {
        lat: ORIGIN.lat + y_offset,
        lng: ORIGIN.lng + lng_offset
    };
}

function latLngToAxial(lat, lng) {
    const y = lat - ORIGIN.lat;
    const x = (lng - ORIGIN.lng) / PROJECTION_FACTOR;
    const dist = Math.sqrt(3) * HEX_RADIUS;
    const r = y / (dist * Math.sin(Math.PI / 3));
    const q = (x - r * dist * Math.cos(Math.PI / 3)) / dist;
    return roundCube(q, r);
}

function roundCube(q, r) {
    let x = q;
    let z = r;
    let y = -x - z;
    let rx = Math.round(x);
    let ry = Math.round(y);
    let rz = Math.round(z);
    const x_diff = Math.abs(rx - x);
    const y_diff = Math.abs(ry - y);
    const z_diff = Math.abs(rz - z);
    if (x_diff > y_diff && x_diff > z_diff) rx = -ry - rz;
    else if (y_diff > z_diff) ry = -rx - rz;
    else rz = -rx - ry;
    return { q: rx, r: rz };
}

// --- Main Execution ---

const citiesPath = path.join(__dirname, '../src/data/cities.ts');
const rawContent = fs.readFileSync(citiesPath, 'utf-8');

// Regex to matchcity objects
// Matches: { id: '...', ..., lat: 123.456, lng: 123.456, ... }
// We update the lat: and lng: values
const updatedContent = rawContent.replace(
    /\{ id: '([^']+)',(.*?)lat: ([\d.-]+),(.*?)lng: ([\d.-]+),(.*?)\}/g,
    (match, id, preLat, latStr, preLng, lngStr, postLng) => {
        const oldLat = parseFloat(latStr);
        const oldLng = parseFloat(lngStr);

        const hex = latLngToAxial(oldLat, oldLng);
        const center = hexToLatLng(hex.q, hex.r);

        // Use high precision to avoid drift, but clean enough
        const newLat = parseFloat(center.lat.toFixed(6));
        const newLng = parseFloat(center.lng.toFixed(6));

        console.log(`Aligned ${id}: (${oldLat}, ${oldLng}) -> [${hex.q}, ${hex.r}] -> (${newLat}, ${newLng})`);

        return `{ id: '${id}',${preLat}lat: ${newLat},${preLng}lng: ${newLng},${postLng}}`;
    }
);

fs.writeFileSync(citiesPath, updatedContent, 'utf-8');
console.log('Done! Updated src/data/cities.ts');
