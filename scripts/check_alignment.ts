import { CITIES } from '../src/data/cities';
import { GridSystem } from '../src/systems/GridSystem';

console.log('Checking City Alignment...');
let snappedCount = 0;
let totalCount = 0;
let maxErrorKm = 0;

for (const city of CITIES) {
    const { q, r } = GridSystem.latLngToAxial(city.lat, city.lng);
    const qDiff = Math.abs(q - Math.round(q));
    const rDiff = Math.abs(r - Math.round(r));

    // Reverse calc to see how far off from "Center"
    const snapped = GridSystem.axialToLatLng(Math.round(q), Math.round(r));
    const dLat = (city.lat - snapped.lat) * 111; // Approx km
    const dLng = (city.lng - snapped.lng) * 111 * Math.cos(city.lat * Math.PI / 180);
    const errorKm = Math.sqrt(dLat * dLat + dLng * dLng);

    if (errorKm > maxErrorKm) maxErrorKm = errorKm;

    const isSnapped = qDiff < 0.05 && rDiff < 0.05; // Looser tolerance
    if (isSnapped) snappedCount++;
    totalCount++;

    if (totalCount <= 5) {
        console.log(`${city.name}: Raw(${city.lat}, ${city.lng}) -> Axial(${q.toFixed(4)}, ${r.toFixed(4)}) -> Snapped? ${isSnapped} (Err: ${errorKm.toFixed(3)}km)`);
    }
}

console.log(`\nResult: ${snappedCount}/${totalCount} cities are aligned to hex centers.`);
console.log(`Max Deviation from Hex Center: ${maxErrorKm.toFixed(3)} km`);
