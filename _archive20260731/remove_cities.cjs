const fs = require('fs');

const CITIES_FILE = 'src/data/cities_v2.ts';
const GAME_APP_FILE = 'src/app/GameApp.ts';

let citiesContent = fs.readFileSync(CITIES_FILE, 'utf-8');
let gameAppContent = fs.readFileSync(GAME_APP_FILE, 'utf-8');

const citiesToRemove = [
    'city_waer',
    'city_jiuchungudan',
    'city_gaxiandong'
];

for (const cityId of citiesToRemove) {
    const regex = new RegExp(`\\{[^\\}]*id:\\s*'${cityId}'[^\\}]*\\},\\s*`, 'g');
    citiesContent = citiesContent.replace(regex, '');
    
    const gameAppRegex = new RegExp(`\\s*'[\\w_]+':\\s*'${cityId}',\\s*`, 'g');
    gameAppContent = gameAppContent.replace(gameAppRegex, '\n');
}

fs.writeFileSync(CITIES_FILE, citiesContent);
fs.writeFileSync(GAME_APP_FILE, gameAppContent);

console.log('Done removing 3 cities.');
