import fs from 'fs';

const file = 'src/app/GameApp.ts';
let text = fs.readFileSync(file, 'utf8');

const regex = /export const STARTING_CAPITALS: Record<string, string> = \{([\s\S]*?)\n\};/;
const match = text.match(regex);
if (match) {
  let content = match[1];
  
  // Remove the old incorrect ones I added if they exist
  content = content.replace(/\s*'tuoba': 'city_gaxiandong',/, '');
  content = content.replace(/\s*'cong': 'city_yufujin',/, '');
  content = content.replace(/\s*'yujiulu': 'city_jinshan',/, '');
  
  // Add the correct ones
  content += `
    'shiwei': 'city_gaxiandong',
    'tuoba': 'city_shengle',
    'bandun': 'city_yufujin',
    'cong': 'city_dangqu',
    'ashina': 'city_jinshan',
    'yujiulu': 'city_ruoshui',
    'dingnan': 'city_cixhihequ',
  `;

  text = text.replace(regex, `export const STARTING_CAPITALS: Record<string, string> = {${content}\n};`);
  fs.writeFileSync(file, text);
  console.log('Updated GameApp.ts correctly.');
} else {
  console.log('Failed to find STARTING_CAPITALS');
}
