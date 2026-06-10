
import { CITIES_V2 } from "../src/data/cities_v2";
import { getCityRegion } from "../src/systems/RegionSystem";

const counts: Record<string, number> = {};
CITIES_V2.forEach(c => {
    const r = getCityRegion({ latitude: c.lat, longitude: c.lng, region: c.region });
    counts[r] = (counts[r] || 0) + 1;
});
console.log(JSON.stringify(counts, null, 2));

