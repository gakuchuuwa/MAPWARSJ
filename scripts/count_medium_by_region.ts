import { CITIES_V2 } from '../src/data/cities_v2';
import { getCityRegion, REGION_LABELS, REGION_ORDER, RegionType } from '../src/systems/RegionSystem';

const medium = CITIES_V2.filter((c) => c.type === 'medium_city');
const byRegion = new Map<RegionType, { names: string[]; overrides: string[] }>();

for (const c of medium) {
    const r = getCityRegion({ latitude: c.lat, longitude: c.lng, region: c.region });
    if (!byRegion.has(r)) byRegion.set(r, { names: [], overrides: [] });
    const bucket = byRegion.get(r)!;
    bucket.names.push(c.name);
    if (c.region && c.region !== r) bucket.overrides.push(`${c.name}(${c.region}→${r})`);
}

console.log(`中城总数: ${medium.length}\n`);
for (const r of REGION_ORDER) {
    const b = byRegion.get(r);
    if (!b?.names.length) continue;
    console.log(`${REGION_LABELS[r]} (${r}): ${b.names.length}`);
    console.log(`  ${b.names.join('、')}`);
    if (b.overrides.length) console.log(`  [显式region与多边形不一致] ${b.overrides.join('; ')}`);
}
