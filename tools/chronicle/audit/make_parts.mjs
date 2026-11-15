import fs from 'node:fs';
const ROOT='C:\\MAPWARSJ';
const OUT=ROOT+'\\tools\\chronicle\\audit';
const gen=JSON.parse(fs.readFileSync(OUT+'\\mainline_parsed.json','utf8'));
const cities=JSON.parse(fs.readFileSync(OUT+'\\cities_parsed.json','utf8'));
const rows=JSON.parse(fs.readFileSync(OUT+'\\cont_rows.json','utf8'));
const DELIV=ROOT+'\\剧本模式\\99_GG任务与交付';
const troops=[1,2,3].flatMap(i=>JSON.parse(fs.readFileSync(`${DELIV}\\GG交付_主线史实兵力_第${i}批_2026-11-15.json`,'utf8')));
const tmap=new Map(troops.map(t=>[t.eventId,t]));
const rowBySeq=new Map(rows.map(r=>[r.seq,r]));

// ---------- 兵力分片：全部 1022 场，按 seq 三等分 ----------
const base=gen.map((e,i)=>{
  const t=tmap.get(e.id)||{};
  const r=rowBySeq.get(i+1);
  return {
    seq:i+1,eventId:e.id,title:e.title,year:e.year,lead:e.leadGeneralId,
    enemyFaction:e.battle.enemyFactionName,role:e.battle.role,battleType:e.battle.battleType,
    target:e.battle.targetName,troops:e.battle.myTroops,
    historicalTroops:t.historicalTroops||'',
    source:t.source||e.source,
    fromName:r?r.fromName:null,
    strategic:(e.strategic||[]).join(' ').slice(0,180),
  };
});
for(let k=0;k<3;k++){
  const part=base.slice(k*341,(k+1)*341);
  fs.writeFileSync(`${OUT}\\troops_part${k+1}.json`,JSON.stringify(part,null,1),'utf8');
  console.log('troops_part'+(k+1),part.length,part[0].eventId,part[part.length-1].eventId);
}
// 只取封顶 20000 的分片（重点复核）
const cap=base.filter(b=>b.troops===20000);
for(let k=0;k<3;k++){
  const part=cap.slice(k*219,(k+1)*219);
  fs.writeFileSync(`${OUT}\\troops_cap_part${k+1}.json`,JSON.stringify(part,null,1),'utf8');
  console.log('troops_cap_part'+(k+1),part.length);
}

// ---------- 连续性问题候选（两半） ----------
const R=6371;
const hav=(a,b)=>{const dLat=(b.lat-a.lat)*Math.PI/180,dLng=(b.lng-a.lng)*Math.PI/180;const la1=a.lat*Math.PI/180,la2=b.lat*Math.PI/180;const h=Math.sin(dLat/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)**2;return 2*R*Math.asin(Math.sqrt(h));};
const cont=gen.map((e,i)=>{
  const b=e.battle,r=rowBySeq.get(i+1);
  const from=cities[b.chronicleFrom];
  return {
    seq:i+1,eventId:e.id,title:e.title,year:e.year,lead:e.leadGeneralId,leadHomeName:r.leadHomeName,leadHomeId:r.leadHome,
    fromId:b.chronicleFrom,fromName:from?from.name:null,fromLat:from?from.lat:null,fromLng:from?from.lng:null,
    battleType:b.battleType,role:b.role,target:b.targetName,targetLat:b.targetLat,targetLng:b.targetLng,
    targetCityId:b.targetCityId||(b.chronicleCity&&b.chronicleCity.cityId)||null,
    route:(b.routeVia||[]).map(p=>({name:p.name,lat:p.lat,lng:p.lng})),
    cls:r.cls,prev:r.prev,
    strategic:(e.strategic||[]).join(' ').slice(0,260),
    source:e.source,
  };
});
fs.writeFileSync(`${OUT}\\cont_part1.json`,JSON.stringify(cont.slice(0,511),null,1),'utf8');
fs.writeFileSync(`${OUT}\\cont_part2.json`,JSON.stringify(cont.slice(511),null,1),'utf8');
console.log('cont parts written',cont.length);
