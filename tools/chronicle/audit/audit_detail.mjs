import fs from 'node:fs';
const ROOT='C:\\MAPWARSJ';
const OUT=ROOT+'\\tools\\chronicle\\audit';
const gen=JSON.parse(fs.readFileSync(OUT+'\\mainline_parsed.json','utf8'));
const cities=JSON.parse(fs.readFileSync(OUT+'\\cities_parsed.json','utf8'));
const audit=JSON.parse(fs.readFileSync(OUT+'\\audit_raw.json','utf8'));
const DELIV=ROOT+'\\剧本模式\\99_GG任务与交付';
const troops=[1,2,3].flatMap(i=>JSON.parse(fs.readFileSync(`${DELIV}\\GG交付_主线史实兵力_第${i}批_2026-11-15.json`,'utf8')));
const tmap=new Map(troops.map(t=>[t.eventId,t]));

// 1) siege + defender + routeVia
const siegeDef=gen.map((e,i)=>({e,seq:i+1})).filter(o=>o.e.battle.battleType==='siege'&&o.e.battle.role==='defender'&&(o.e.battle.routeVia||[]).length);
console.log('=== siege+defender 有途经点 ('+siegeDef.length+') ===');
siegeDef.forEach(o=>console.log([o.seq,o.e.id,o.e.title,o.e.year,o.e.leadGeneralId,o.e.battle.chronicleFrom,o.e.battle.targetName,(o.e.battle.routeVia||[]).map(p=>p.name).join('→')].join(' | ')));

// 2) from 不一致 7 场
console.log('\n=== script/JSON vs generated from 不一致 ===');
for(const id of ['evt_0746','evt_0953','evt_1237','evt_1403','evt_1784','evt_1785','evt_1908']){
  const e=gen.find(x=>x.id===id); const i=gen.indexOf(e)+1;
  const c=f=>cities[f]?cities[f].name:'?';
  console.log(`[${i}] ${id} ${e.title} ${e.year} lead=${e.leadGeneralId} genFrom=${e.battle.chronicleFrom}(${c(e.battle.chronicleFrom)}) target=${e.battle.targetName} route=${(e.battle.routeVia||[]).map(p=>p.name).join('→')}`);
  console.log('   strategic:', (e.strategic[0]||'').slice(0,120));
}
// 3) 同将连战大跳 >600km
const big=audit.issues.filter(i=>i.cat==='同将连战出发点跳脱').map(i=>{
  const m=/相距 (\d+)km/.exec(i.msg); return {...i,dist:m?+m[1]:0};
}).filter(i=>i.dist>400).sort((a,b)=>b.dist-a.dist);
console.log('\n=== 同将连战出发点跳脱 >400km ('+big.length+') ===');
big.slice(0,60).forEach(i=>console.log([i.seq,i.eventId,i.title,i.year,i.lead,i.from,'|',i.msg].join(' ')));

// 4) 兵力分布
const cap=gen.filter(e=>e.battle.myTroops===20000);
console.log('\n封顶场数',cap.length,'最低',gen.filter(e=>e.battle.myTroops===1000).length);
const early=cap.filter(e=>e.year<-400);
console.log('封顶且 year<-400:',early.length);
const buckets={};
for(const e of gen){const k=Math.floor(e.year/200)*200;buckets[k]=buckets[k]||{n:0,cap:0};buckets[k].n++;if(e.battle.myTroops===20000)buckets[k].cap++;}
console.log(Object.entries(buckets).sort((a,b)=>a[0]-b[0]).map(([k,v])=>`${k}:${v.n}/${v.cap}`).join('  '));

// 5) historicalTroops 文本与数值相悖关键词
const kw=/数百|千余|千余|不足千|仅千|仅数千|数千人|小规模|零星|数百人|不过万|不足万|千人之|数个部落|两三千|几百/;
const sus=troops.filter(t=>kw.test(t.historicalTroops||'')&&t.gameTroops>=15000);
console.log('\n=== 文本提示小规模却>=15000 ('+sus.length+') ===');
sus.forEach(t=>{const e=gen.find(x=>x.id===t.eventId);console.log([t.eventId,e?e.title:'',e?e.year:'',t.gameTroops,'|',t.historicalTroops.slice(0,110)].join(' '))});
