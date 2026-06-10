import fs from 'fs';
const gameApp = fs.readFileSync('src/app/GameApp.ts', 'utf8');
const match = gameApp.match(/export const STARTING_CAPITALS: Record<string, string> = \{([\s\S]*?)\};/);
if (match) {
    const lines = match[1].split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const keys = new Set();
    for (const line of lines) {
        if (line.startsWith('//')) continue;
        const keyMatch = line.match(/^['"]?([\w_]+)['"]?\s*:/);
        if (keyMatch) {
            if (keys.has(keyMatch[1])) {
                console.log('Duplicate key found in GameApp: ' + keyMatch[1]);
            }
            keys.add(keyMatch[1]);
        }
    }
}

const sdn = fs.readFileSync('src/data/SandboxDisplayNames.ts', 'utf8');
const sdnMatch = sdn.match(/export const SANDBOX_DISPLAY_NAMES: Record<string, string> = \{([\s\S]*?)\};/);
if (sdnMatch) {
    const lines = sdnMatch[1].split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const keys = new Set();
    for (const line of lines) {
        if (line.startsWith('//')) continue;
        const keyMatch = line.match(/^['"]?([\w_]+)['"]?\s*:/);
        if (keyMatch) {
            if (keys.has(keyMatch[1])) {
                console.log('Duplicate key found in SandboxDisplayNames: ' + keyMatch[1]);
            }
            keys.add(keyMatch[1]);
        }
    }
}

const cam = fs.readFileSync('src/assets/CityAssetManager.ts', 'utf8');
const camMatch = cam.match(/public static readonly factionFlagMap: \{ \[key: string\]: string \} = \{([\s\S]*?)\};/);
if (camMatch) {
    const lines = camMatch[1].split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const keys = new Set();
    for (const line of lines) {
        if (line.startsWith('//')) continue;
        const keyMatch = line.match(/^['"]?([\w_]+)['"]?\s*:/);
        if (keyMatch) {
            if (keys.has(keyMatch[1])) {
                console.log('Duplicate key found in CityAssetManager: ' + keyMatch[1]);
            }
            keys.add(keyMatch[1]);
        }
    }
}
