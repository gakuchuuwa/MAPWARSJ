import fs from 'fs';

const file1 = 'src/data/cities_v2.ts';
let text1 = fs.readFileSync(file1, 'utf8');
text1 = text1.replace(/id:\s*'city_gaxiandong'[\s\S]*?factionId:\s*'shiwei'/, match => match.replace('shiwei', 'boerzhijin'));
fs.writeFileSync(file1, text1);

const file2 = 'src/app/GameApp.ts';
let text2 = fs.readFileSync(file2, 'utf8');
text2 = text2.replace(/'shiwei': 'city_gaxiandong'/, "'boerzhijin': 'city_gaxiandong'");
fs.writeFileSync(file2, text2);
