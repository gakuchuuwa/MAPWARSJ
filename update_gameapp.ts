import fs from 'fs';

const file = 'src/app/GameApp.ts';
let text = fs.readFileSync(file, 'utf8');

const newCapitals: Record<string, string> = {
  'xiou': 'city_bushan',
  'tuoba': 'city_gaxiandong',
  'cong': 'city_yufujin',
  'yujiulu': 'city_jinshan',
  'seljuq': 'city_merv',
  'ruan': 'city_champa',
  'zou': 'city_wenzhou',
  'yaoluoge': 'city_zhabuhan',
  'yalong': 'city_xizhigudi'
};

let appendString = '';
for (const [fac, city] of Object.entries(newCapitals)) {
  appendString += `    '${fac}': '${city}',\n`;
}

// find the end of STARTING_CAPITALS object
const match = text.match(/export const STARTING_CAPITALS: Record<string, string> = \{([\s\S]*?)\n\};/);
if (match) {
  const newObj = match[0].replace(/\n\};/, `\n${appendString}};`);
  text = text.replace(match[0], newObj);
  fs.writeFileSync(file, text);
  console.log('Updated GameApp.ts');
} else {
  console.log('Failed to find STARTING_CAPITALS');
}
