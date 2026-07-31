const fs = require('fs');
const content = fs.readFileSync('./src/data/cities_v2.ts', 'utf-8');
const lines = content.split('\n');

const checkIds = ['city_heishui_mohe', 'city_heishui', 'city_yongning', 'city_yongning2'];
checkIds.forEach(id => {
  let found = false;
  for(let i=0; i<lines.length; i++) {
    if(lines[i].includes(`id: '${id}'`)) {
      console.log(`\n--- ${id} ---`);
      // print the block containing it (from '{' to '}')
      let start = i;
      while(start > 0 && !lines[start].includes('{')) start--;
      let end = i;
      while(end < lines.length && !lines[end].includes('}')) end++;
      for(let j=start; j<=end; j++) {
        console.log(lines[j]);
      }
    }
  }
});
