import fs from 'fs';

const file = 'src/data/cities_v2.ts';
let text = fs.readFileSync(file, 'utf8');

const updates: Record<string, string> = {
  'city_bushan': 'xiou',
  'city_gaxiandong': 'tuoba',
  'city_yufujin': 'cong',
  'city_jinshan': 'yujiulu',
  'city_merv': 'seljuq',
  'city_champa': 'ruan',
  'city_wenzhou': 'zou',
  'city_zhabuhan': 'yaoluoge',
  'city_xizhigudi': 'yalong',
  'city_cixhihequ': 'panjun'
};

for (const [id, newFaction] of Object.entries(updates)) {
  const regex = new RegExp(`(id:\\s*'${id}'[\\s\\S]*?factionId:\\s*')[^']+(')`);
  text = text.replace(regex, `$1${newFaction}$2`);
}

fs.writeFileSync(file, text);
