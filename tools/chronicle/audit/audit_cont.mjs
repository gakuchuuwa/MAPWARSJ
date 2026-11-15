import fs from 'node:fs';
const ROOT='C:\\MAPWARSJ';
const OUT=ROOT+'\\tools\\chronicle\\audit';
const gen=JSON.parse(fs.readFileSync(OUT+'\\mainline_parsed.json','utf8'));
const cities=JSON.parse(fs.readFileSync(OUT+'\\cities_parsed.json','utf8'));
const DELIV=ROOT+'\\剧本模式\\99_GG任务与交付';
const troops=[1,2,3].flatMap(i=>JSON.parse(fs.readFileSync(`${DELIV}\\GG交付_主线史实兵力_第${i}批_2026-11-15.json`,'utf8')));
const tmap=new Map(troops.map(t=>[t.eventId,t]));

// 武将挂点
const src=fs.readFileSync(ROOT+'\\src\\data\\FactionGenerals.ts','utf8');
const gmap=new Map();
for(const m of src.matchAll(/generalId:\s*'([^']+)',\s*(?:factionId:\s*'([^']+)',\s*)?cityId:\s*'([^']+)'/g)){
  gmap.set(m[1],{factionId:m[2]||null,cityId:m[3]});
}
console.log('generals parsed:',gmap.size);

const R=6371;
const hav=(a,b)=>{const dLat=(b.lat-a.lat)*Math.PI/180,dLng=(b.lng-a.lng)*Math.PI/180;const la1=a.lat*Math.PI/180,la2=b.lat*Math.PI/180;const h=Math.sin(dLat/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)**2;return 2*R*Math.asin(Math.sqrt(h));};

const lastEnd=new Map();
const rows=[];
gen.forEach((e,i)=>{
  const b=e.battle, seq=i+1;
  const from=cities[b.chronicleFrom];
  const g=gmap.get(e.leadGeneralId);
  const home=g?cities[g.cityId]:null;
  const prev=lastEnd.get(e.leadGeneralId);
  let cls='A_from=据点';
  if(prev){
    if(b.chronicleFrom===prev.city) cls='B_from=上一场终点';
    else if(home&&Math.abs(hav(from,prev.pt))<150) cls='B_near上一场终点';
    else cls='C_连战跳脱';
  } else {
    if(!home) cls='D_无据点';
    else if(b.chronicleFrom!==g.cityId) cls='E_from≠据点';
  }
  rows.push({seq,eventId:e.id,title:e.title,year:e.year,lead:e.leadGeneralId,leadHome:g?g.cityId:null,leadHomeName:home?home.name:null,
    from:b.chronicleFrom,fromName:from?from.name:null,target:b.targetName,battleType:b.battleType,role:b.role,troops:b.myTroops,
    route:(b.routeVia||[]).map(p=>p.name), prev:prev?{seq:prev.seq,eventId:prev.eventId,title:prev.title,endName:prev.cityName,dist:Math.round(hav(from,prev.pt))}:null, cls});
  // 记录终点
  let endCityId=b.targetCityId||(b.chronicleCity&&b.chronicleCity.cityId);
  let endPt;
  if(endCityId&&cities[endCityId]) endPt={...cities[endCityId],cityId:endCityId};
  else {let best=null,bd=1e9;for(const [cid,c] of Object.entries(cities)){const d=hav(c,{lat:b.targetLat,lng:b.targetLng});if(d<bd){bd=d;best={...c,cityId:cid};}}endPt=best;endCityId=best.cityId;}
  lastEnd.set(e.leadGeneralId,{city:endCityId,cityName:endPt.name,pt:{lat:endPt.lat,lng:endPt.lng},seq,eventId:e.id,title:e.title});
});
const cnt={};
rows.forEach(r=>cnt[r.cls]=(cnt[r.cls]||0)+1);
console.log(cnt);
fs.writeFileSync(OUT+'\\cont_rows.json',JSON.stringify(rows,null,1),'utf8');
const ck=rows.filter(r=>r.cls==='C_连战跳脱').sort((a,b)=>b.prev.dist-a.prev.dist);
console.log('C 连战跳脱',ck.length);
ck.slice(0,200).forEach(r=>console.log([r.seq,r.eventId,r.title,r.year,r.lead,r.fromName,'|prev',r.prev.seq,r.prev.title,r.prev.endName,r.prev.dist+'km','|target',r.target].join(' | ')));
const e5=rows.filter(r=>r.cls==='E_from≠据点');
console.log('\nE 换将从非据点出发',e5.length);
e5.slice(0,80).forEach(r=>console.log([r.seq,r.eventId,r.title,r.year,r.lead,r.fromName,'home='+r.leadHomeName].join(' | ')));
