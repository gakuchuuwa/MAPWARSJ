import fs from 'node:fs';
const gen=JSON.parse(fs.readFileSync('C:\\MAPWARSJ\\tools\\chronicle\\audit\\mainline_parsed.json','utf8'));
const DELIV='C:\\MAPWARSJ\\剧本模式\\99_GG任务与交付';
const t=[1,2,3].flatMap(i=>JSON.parse(fs.readFileSync(DELIV+'\\GG交付_主线史实兵力_第'+i+'批_2026-11-15.json','utf8')));
const g=new Map(gen.map((e,i)=>[e.id,{e,seq:i+1}]));
const parse=txt=>{
  const out=[];
  const re=/([0-9]+(?:\.[0-9]+)?)\s*(万余|万|千余|千|余|人|骑|艘)/g;let m;
  while((m=re.exec(txt))){let v=parseFloat(m[1]);const u=m[2];
    if(u.startsWith('万'))v*=10000; else if(u.startsWith('千'))v*=1000;
    out.push(Math.round(v));}
  if(/数万/.test(txt)) out.push(30000);
  if(/数十万|十余万|二十万|三十万|六十万/.test(txt)) out.push(200000);
  return out;
};
const lowCap=[], highNon=[];
for(const x of t){
  const o=g.get(x.eventId); const v=x.gameTroops; const nums=parse(x.historicalTroops).filter(n=>n>=300&&n<=1000000);
  const mx=nums.length?Math.max(...nums):0;
  if(v===20000 && mx>0 && mx<9000) lowCap.push({seq:o.seq,id:x.eventId,title:o.e.title,year:o.e.year,v,mx,note:x.historicalTroops.slice(0,110)});
  if(v<20000 && mx>4*v && mx>=30000) highNon.push({seq:o.seq,id:x.eventId,title:o.e.title,year:o.e.year,v,mx,note:x.historicalTroops.slice(0,110)});
}
console.log('=== 封顶20000但说明最大数<9000 ('+lowCap.length+') ===');
lowCap.forEach(c=>console.log([c.seq,c.id,c.title,c.year,c.v,'max='+c.mx,'|',c.note].join(' | ')));
console.log('\n=== 非封顶但说明最大数>4倍 ('+highNon.length+') ===');
highNon.forEach(c=>console.log([c.seq,c.id,c.title,c.year,c.v,'max='+c.mx,'|',c.note].join(' | ')));
