const fs = require('fs');
const crypto = require('crypto');
let content = fs.readFileSync('vite.config.ts', 'utf8');

const oldFn = `function serverBuildPortraitCatalog(assetsRoot: string): { folder: string; label: string; images: string[] }[] {
    const EXCLUDED = new Set(['UI', 'avg', 'inbox']);
    const byFolder = new Map<string, string[]>();

    if (!fs.existsSync(assetsRoot)) return [];

    for (const entry of fs.readdirSync(assetsRoot, { withFileTypes: true })) {
        if (!entry.isDirectory() || EXCLUDED.has(entry.name)) continue;
        const dirPath = path.join(assetsRoot, entry.name);
        const folderKey = \`/assets/\${entry.name}/\`;
        const images: string[] = [];

        for (const file of fs.readdirSync(dirPath)) {
            if (!file.toLowerCase().endsWith('.png')) continue;
            images.push(\`\${folderKey}\${file}\`);
        }

        if (images.length > 0) {
            images.sort((a, b) => a.localeCompare(b, 'zh-CN'));
            byFolder.set(folderKey, images);
        }
    }

    return [...byFolder.entries()]
        .sort(([a], [b]) => a.localeCompare(b, 'zh-CN'))
        .map(([folder, images]) => ({
            folder,
            label: folder.replace('/assets/', '').replace(/\\/$/, ''),
            images,
        }));
}`;

const newFn = `function serverBuildPortraitCatalog(assetsRoot: string): { folder: string; label: string; images: { path: string; hash: string }[] }[] {
    const EXCLUDED = new Set(['UI', 'avg', 'inbox']);
    const byFolder = new Map<string, { path: string; hash: string }[]>();

    if (!fs.existsSync(assetsRoot)) return [];

    for (const entry of fs.readdirSync(assetsRoot, { withFileTypes: true })) {
        if (!entry.isDirectory() || EXCLUDED.has(entry.name)) continue;
        const dirPath = path.join(assetsRoot, entry.name);
        const folderKey = \`/assets/\${entry.name}/\`;
        const images: { path: string; hash: string }[] = [];

        for (const file of fs.readdirSync(dirPath)) {
            if (!file.toLowerCase().endsWith('.png')) continue;
            const fullPath = path.join(dirPath, file);
            let hash = '';
            try { hash = require('crypto').createHash('md5').update(fs.readFileSync(fullPath)).digest('hex'); } catch (e) {}
            images.push({ path: \`\${folderKey}\${file}\`, hash });
        }

        if (images.length > 0) {
            images.sort((a, b) => a.path.localeCompare(b.path, 'zh-CN'));
            byFolder.set(folderKey, images);
        }
    }

    return [...byFolder.entries()]
        .sort(([a], [b]) => a.localeCompare(b, 'zh-CN'))
        .map(([folder, images]) => ({
            folder,
            label: folder.replace('/assets/', '').replace(/\\/$/, ''),
            images,
        }));
}`;

if (content.includes(oldFn)) {
    fs.writeFileSync('vite.config.ts', content.replace(oldFn, newFn));
    console.log('Replaced successfully');
} else {
    console.log('Function not found exactly');
}
