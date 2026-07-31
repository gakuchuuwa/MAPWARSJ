import { CITIES_V2 } from './src/data/cities_v2.ts';

const kous = CITIES_V2.filter(c => c.name.includes('口'));

console.log(`Found ${kous.length} cities with '口':`);
kous.forEach(p => {
  console.log(`- ${p.name} (id: ${p.id}, current type: ${p.type})`);
});
