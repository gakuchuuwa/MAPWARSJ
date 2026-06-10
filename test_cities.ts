import { CITIES_V2 } from './src/data/cities_v2.ts';
function h(lat1: number,lon1: number,lat2: number,lon2: number) {
  const R = 6371; const dLat = (lat2-lat1)*Math.PI/180; const dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function check(lat: number, lng: number, name: string) {
  console.log('=== ' + name + '(' + lat + ',' + lng + ') ===');
  let cfs = [];
  for (const c of CITIES_V2) {
    if (c.id === 'city_yancheng') continue;
    const d = h(lat, lng, c.lat, c.lng);
    if (d < 50 && d > 0.1) cfs.push({name: c.name, dist: Math.round(d*10)/10});
  }
  cfs.sort((a,b)=>a.dist-b.dist);
  if (cfs.length === 0) console.log('安全');
  else for (const c of cfs) console.log('冲突: ' + c.name + ' - ' + c.dist + 'km');
}
check(33.43, 113.59, '舞阳');
check(33.25, 113.00, '方城');
