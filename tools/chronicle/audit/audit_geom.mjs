import fs from 'node:fs';
const OUT='C:\\MAPWARSJ\\tools\\chronicle\\audit';
const gen=JSON.parse(fs.readFileSync(OUT+'\\mainline_parsed.json','utf8'));
const cities=JSON.parse(fs.readFileSync(OUT+'\\cities_parsed.json','utf8'));
const R=6371;
const rad=d=>d*Math.PI/180;
const hav=(a,b)=>{const dLat=rad(b.lat-a.lat),dLng=rad(b.lng-a.lng);const la1=rad(a.lat),la2=rad(b.lat);const h=Math.sin(dLat/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)**2;return 2*R*Math.asin(Math.sqrt(h));};
// 局部平面投影(km):以起点为原点
const proj=(p,o)=>({x:hav({lat:o.lat,lng:o.lng},{lat:o.lat,lng:p.lng})*Math.sign(p.lng-o.lng),y:hav({lat:o.lat,lng:o.lng},{lat:p.lat,lng:o.lng})*Math.sign(p.lat-o.lat)});
const out=[];
gen.forEach((e,i)=>{
  const b=e.battle;const seq=i+1;
  const from=cities[b.chronicleFrom];if(!from)return;
  const route=b.routeVia||[];
  const tgt={lat:b.targetLat,lng:b.targetLng};
  const pts=[{name:from.name,lat:from.lat,lng:from.lng,city:true},...route,{name:b.targetName,lat:tgt.lat,lng:tgt.lng,goal:true}];
  // 方向向量 起点→终点
  const v={x:hav({lat:from.lat,lng:from.lng},{lat:from.lat,lng:tgt.lng})*Math.sign(tgt.lng-from.lng),
            y:hav({lat:from.lat,lng:from.lng},{lat:tgt.lat,lng:from.lng})*Math.sign(tgt.lat-from.lat)};
  const vlen=Math.hypot(v.x,v.y)||1;
  const u={x:v.x/vlen,y:v.y/vlen};
  let prevDot=0, backTotal=0, maxBack=0, backSegs=[];
  const offs=[];
  for(let k=1;k<pts.length-1;k++){ // 途经点相对直线偏移
    const p=proj(pts[k],from); const along=p.x*u.x+p.y*u.y; const perp=Math.abs(p.x*(-u.y)+p.y*u.x);
    offs.push({name:pts[k].name,along:Math.round(along),perp:Math.round(perp)});
  }
  for(let k=1;k<pts.length;k++){
    const a=proj(pts[k-1],from), c=proj(pts[k],from);
    const dx=c.x-a.x, dy=c.y-a.y;
    const seg=Math.hypot(dx,dy);
    const dot=(dx*u.x+dy*u.y)/Math.max(seg,0.001); // >0 朝目标
    if(dot<-0.35 && seg>150){ backTotal+=seg; maxBack=Math.max(maxBack,seg); backSegs.push(`${pts[k-1].name||from.name}→${pts[k].name||b.targetName}:${Math.round(seg)}km(dot=${dot.toFixed(2)})`); }
    // 垂直于直线过远
    if(seg>0) offs.push(null);
  }
  const farOff=offs.filter(Boolean).filter(o=>o.perp>350);
  if(backSegs.length||farOff.length){ out.push({seq,eventId:e.id,title:e.title,year:e.year,from:from.name,route:route.map(p=>p.name),target:b.targetName,back:backSegs,perp:farOff}); }
});
console.log('candidates',out.length);
out.slice(0,60).forEach(o=>console.log([o.seq,o.eventId,o.title,o.from,'→['+o.route.join(',')+']→',o.target,'| back:',o.back.join(';'),'| perp:',o.perp.map(p=>p.name+'@'+p.perp).join(';')].join(' ')));
fs.writeFileSync(OUT+'\\geom_candidates.json',JSON.stringify(out,null,1),'utf8');
