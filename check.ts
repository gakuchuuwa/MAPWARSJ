import { CITIES_V2 } from './src/data/cities_v2.ts';

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180)
}

const cities = CITIES_V2;
console.log(`Checking ${cities.length} cities...`);

const tooClose: any[] = [];
for (let i = 0; i < cities.length; i++) {
  for (let j = i + 1; j < cities.length; j++) {
    const c1 = cities[i];
    const c2 = cities[j];
    const d = getDistance(c1.lat, c1.lng, c2.lat, c2.lng);
    if (d < 60) {
      tooClose.push({
        c1: c1.name,
        c2: c2.name,
        d: d.toFixed(2),
        c1_id: c1.id,
        c2_id: c2.id
      });
    }
  }
}

tooClose.sort((a, b) => parseFloat(a.d) - parseFloat(b.d));

console.log(`Found ${tooClose.length} pairs < 60km apart:`);
tooClose.forEach(pair => {
  console.log(`${pair.c1} (${pair.c1_id}) <-> ${pair.c2} (${pair.c2_id}) : ${pair.d} km`);
});
