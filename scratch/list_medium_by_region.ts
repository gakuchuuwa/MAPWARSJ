import { CITIES_V2 } from '../src/data/cities_v2';
import { getRegion, REGION_LABELS, REGION_ORDER } from '../src/systems/RegionSystem';

const medium = CITIES_V2.filter(c => c.type === 'medium_city');
const byRegion: Record<string, { name: string; id: string }[]> = {};
for (const r of REGION_ORDER) byRegion[r] = [];

for (const c of medium) {
    const r = getRegion(c.lat, c.lng);
    byRegion[r].push({ name: c.name, id: c.id });
}
for (const r of REGION_ORDER) {
    byRegion[r].sort((a, b) => a.name.localeCompare(b.name, 'zh'));
}

console.log(`总计: ${medium.length}`);
for (const r of REGION_ORDER) {
    const list = byRegion[r];
    console.log(`\n${REGION_LABELS[r]} (${r}) — ${list.length}`);
    for (const c of list) console.log(`  ${c.name}\t${c.id}`);
}
