import fs from 'node:fs';
const gen=JSON.parse(fs.readFileSync('C:\\MAPWARSJ\\tools\\chronicle\\audit\\mainline_parsed.json','utf8'));
const DELIV='C:\\MAPWARSJ\\剧本模式\\99_GG任务与交付';
const t=[1,2,3].flatMap(i=>JSON.parse(fs.readFileSync(DELIV+'\\GG交付_主线史实兵力_第'+i+'批_2026-11-15.json','utf8')));
const g=new Map(gen.map((e,i)=>[e.id,{e,seq:i+1}]));
const parse=txt=>{const out=[];const re=/([0-9]+(?:\.[0-9]+)?)\s*(万余|万|千余|千|余|人|骑|艘)/g;let m;while((m=re.exec(txt))){let v=parseFloat(m[1]);const u=m[2];if(u.startsWith('万'))v*=10000;else if(u.startsWith('千'))v*=1000;out.push(Math.round(v));}if(/数万/.test(txt))out.push(30000);return out;};
const rows=[];
for(const x of t){ if(x.gameTroops!==20000) continue; const o=g.get(x.eventId); const nums=parse(x.historicalTroops).filter(n=>n>=500); const mx=nums.length?Math.max(...nums):0; if(mx>0&&mx<=20000) rows.push({seq:o.seq,id:x.eventId,title:o.e.title,year:o.e.year,mx,note:x.historicalTroops.slice(0,120)}); }
console.log('封顶20000且说明最大数 9000-20000 的场次:',rows.length);
rows.slice(0,25).forEach(r=>console.log([r.seq,r.id,r.title,r.year,'max='+r.mx,'|',r.note].join(' | ')));
