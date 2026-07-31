import fs from 'fs';

// Read cities.ts or cities_v2.ts? The editor imports from '../data/cities'
// But wait, it's easier to just read the actual exported CITIES.
// Let's write a small TS script and run it using tsx or similar.

// Wait, the project uses vite. I can just write a cjs script that loads cities.
// Actually I can just write a script to compute haversine distance.
const R = 6371;
function haversineKm(lat1, lng1, lat2, lng2) {
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Since I want to check existing cities, I'll extract them using grep/regex or just read src/data/cities.ts
