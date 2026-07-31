const fs = require('fs');
const lines = fs.readFileSync('c:/MAPWARSJ/src/data/factions.ts', 'utf8').split('\n');
const citiesContent = fs.readFileSync('c:/MAPWARSJ/src/data/cities_v2.ts', 'utf8');
const cityBlocks = citiesContent.split(/id:\s*['"]/);
const ids = ['sanada_d','edo','izumo','satsuma','so','aki','echigo','owari','kai','chosokabe','hashiba','honda','aizu','hojo_d','iga_d','kaga_d','date_d','higo_d','iyo_d','otomo_d','suwa_d','nanbu','osumi','anmei','yizhi','zhuqian','jibei2','jinchuan','ayinu','beihai','gonggu','kakizaki','fujiwara','ashikaga','yamato','taira'];
ids.forEach(id => {
    const fLine = lines.find(l => l.includes(`id: '${id}'`));
    const fNameMatch = fLine ? fLine.match(/name:\s*['"]([^'"]+)['"]/) : null;
    const fName = fNameMatch ? fNameMatch[1] : 'Unknown';
    const cityBlock = cityBlocks.find(b => b.includes(`factionId: '${id}'`));
    const cNameMatch = cityBlock ? cityBlock.match(/name:\s*['"]([^'"]+)['"]/) : null;
    const cName = cNameMatch ? cNameMatch[1] : 'Unknown';
    console.log(`${fName} (${id}) - 据点：${cName}`);
});
