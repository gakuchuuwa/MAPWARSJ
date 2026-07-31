const fs = require('fs');
const citiesContent = fs.readFileSync('./src/data/cities_v2.ts', 'utf-8');
const targets = ['zhai_d', 'zhai_han', 'mgar', 'gar_kham', 'dongxian', 'dong', 'joseon', 'chaoxian', 'khalkha', 'kaerka'];

targets.forEach(id => {
  const regex = new RegExp("factionId:\\s*['\"]" + id + "['\"]");
  const match = citiesContent.match(regex);
  if (match) {
    console.log(id + ": Has city");
  } else {
    console.log(id + ": NO city");
  }
});
