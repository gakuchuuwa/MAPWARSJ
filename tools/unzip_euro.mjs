import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const base = path.resolve('public/SUCAI/STRONGHOLD_RESOURCES');
const euroZip = path.join(base, 'PC _ Computer - Stronghold_ Crusader - NPCs & Soldiers - European Troops.zip');
const dest = path.join(base, 'European_Troops');

if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

console.log('📦 正在解压 European Troops.zip (11.15 MB)...');
execSync(`powershell -Command "Expand-Archive -LiteralPath '${euroZip}' -DestinationPath '${dest}' -Force"`);

const countPngs = (dir) => {
    let count = 0;
    fs.readdirSync(dir).forEach(f => {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) count += countPngs(full);
        else if (f.endsWith('.png')) count++;
    });
    return count;
};

console.log(`🎉 欧洲部队全部解压完毕！共解压出 ${countPngs(dest)} 张 2.5D 精灵切片图！`);
