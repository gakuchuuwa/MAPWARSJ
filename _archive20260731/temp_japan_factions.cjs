const fs = require('fs');
const lines = fs.readFileSync('c:\\MAPWARSJ\\src\\data\\factions.ts', 'utf8').split('\n');
const ids = ['sanada_d','edo','izumo','satsuma','so','aki','echigo','owari','kai','chosokabe','hashiba','honda','aizu','hojo_d','iga_d','kaga_d','date_d','higo_d','iyo_d','otomo_d','suwa_d','nanbu','osumi','anmei','yizhi','zhuqian','jibei2','jinchuan','ayinu','beihai','gonggu','kakizaki','fujiwara','ashikaga'];
ids.forEach(id => {
    const line = lines.find(l => l.includes(`id: '${id}'`));
    if(line) console.log(line.trim());
});
