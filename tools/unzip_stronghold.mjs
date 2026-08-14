import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const base = path.resolve('public/SUCAI/STRONGHOLD_RESOURCES');

console.log('=== 正在解压《要塞：十字军东征》资源包 ===');
const zips = fs.readdirSync(base).filter(f => f.endsWith('.zip'));

for (const z of zips) {
    const zipPath = path.join(base, z);
    const folderName = z.replace(/\.zip$/i, '').trim();
    const dest = path.join(base, folderName);
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

    console.log(`📦 解压: ${z}`);
    try {
        execSync(`powershell -Command "Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${dest}' -Force"`);
        const files = fs.readdirSync(dest);
        console.log(`   ✅ 成功解压到: ${folderName} (包含 ${files.length} 个文件)`);
        console.log(`   📄 包含的精灵图文件:`, files);
    } catch (err) {
        console.error(`   ❌ 解压出错:`, err.message);
    }
}
