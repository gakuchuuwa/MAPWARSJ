import { FACTIONS } from '../src/data/factions';
import { CITIES_V2 } from '../src/data/cities_v2';
import { SANDBOX_DISPLAY_NAMES } from '../src/data/SandboxDisplayNames';
import * as fs from 'fs';

const gameApp = fs.readFileSync('c:\\MAPWARSJ\\src\\core\\GameApp.ts', 'utf8');
const assetMgr = fs.readFileSync('c:\\MAPWARSJ\\src\\core\\CityAssetManager.ts', 'utf8');

const ids = ['zhong', 'qingyuan_bd', 'pingyuan', 'yao', 'xichu', 'lulin', 'yunzhong', 'chunshen', 'qian', 'lujiang'];

ids.forEach(id => {
    const faction = FACTIONS.find(f => f.id === id);
    const city = CITIES_V2.find(c => c.factionId === id);
    const inSandbox = !!SANDBOX_DISPLAY_NAMES[id];
    const inGameApp = gameApp.includes(`'${id}':`);
    const inAssetMgr = assetMgr.includes(`'${id}':`);
    console.log(`${id} (${faction?.name}) -> city: ${city?.name}`);
    console.log(`  SandboxDisplayNames: ${inSandbox ? 'OK' : 'MISSING'}`);
    console.log(`  GameApp STARTING_CAPITALS: ${inGameApp ? 'OK' : 'MISSING'}`);
    console.log(`  CityAssetManager legacy_dict: ${inAssetMgr ? 'OK' : 'MISSING'}`);
});
