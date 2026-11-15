import fs from 'node:fs';
const SRC='C:\\MAPWARSJ\\src\\data\\cities_v2.ts';
const src=fs.readFileSync(SRC,'utf8');
const cities={};
const pat=/\{\s*(?:[^{}]*?)\bid:\s*'(city_[^']+)'(?:[^{}]*?)\}/gs;
for(const m of src.matchAll(pat)){
  const block=m[0], cid=m[1];
  const nm=/name:\s*'([^']*)'/.exec(block); if(!nm) continue;
  const num=(k)=>{const x=new RegExp(k+':\\s*(-?[\\d.]+)').exec(block);return x?Number(x[1]):null;};
  cities[cid]={name:nm[1],lat:num('lat'),lng:num('lng'),startYear:num('startYear'),endYear:num('endYear'),isPort:/isPort:\s*true/.test(block),tier:num('tier')};
}
console.log('cities',Object.keys(cities).length);
const gen=JSON.parse(fs.readFileSync('C:\\MAPWARSJ\\tools\\chronicle\\audit\\mainline_parsed.json','utf8'));
let fromNotExist=[], tgtNotExist=[];
gen.forEach((e,i)=>{
  const b=e.battle, y=e.year;
  const f=cities[b.chronicleFrom];
  if(f&&f.startYear!=null&&y<f.startYear) fromNotExist.push([i+1,e.id,e.title,y,b.chronicleFrom,f.name,'建城'+f.startYear]);
  const tc=b.targetCityId||(b.chronicleCity&&b.chronicleCity.cityId);
  const c=tc&&cities[tc];
  if(c&&c.startYear!=null&&y<c.startYear) tgtNotExist.push([i+1,e.id,e.title,y,tc,c.name,'建城'+c.startYear]);
});
console.log('=== from 城当年未建 ('+fromNotExist.length+') ===');
fromNotExist.forEach(r=>console.log(r.join(' | ')));
console.log('=== 被攻/被守城当年未建 ('+tgtNotExist.length+') ===');
tgtNotExist.slice(0,40).forEach(r=>console.log(r.join(' | ')));
fs.writeFileSync('C:\\MAPWARSJ\\tools\\chronicle\\audit\\cities_year.json',JSON.stringify(cities),'utf8');
