import fs from 'fs';

const file = 'src/data/cities_v2.ts';
let text = fs.readFileSync(file, 'utf8');

const updates: Record<string, string> = {
  'city_lingqu': 'panjun',
  'city_gaxiandong': 'shiwei',
  'city_yufujin': 'bandun',
  'city_jinshan': 'ashina',
  'city_cixhihequ': 'dingnan'
};

for (const [id, newFaction] of Object.entries(updates)) {
  const regex = new RegExp(`(id:\\s*'${id}'[\\s\\S]*?factionId:\\s*')[^']+(')`);
  text = text.replace(regex, `$1${newFaction}$2`);
}

fs.writeFileSync(file, text);
