/**
 * One-time module migration: move src/core/* to feature folders + shims.
 * Run: node scratch/migrate-modules.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');

const MODULES = {
    roads: ['RoadRegistry.ts', 'VectorRoadEditor.ts', 'VectorRoadEditorOSM.ts', 'SimpleVectorRoadRenderer.ts'],
    legion: ['LegionManager.ts', 'Army.ts', 'FollowResupplySystem.ts'],
    combat: [
        'CombatSystem.ts',
        'BattleField.ts',
        'SiegeManager.ts',
        'FieldBattleManager.ts',
        'MultiLegionFieldBattle.ts',
        'BattleUnitFactory.ts',
    ],
    world: ['CityManager.ts', 'FactionManager.ts', 'SpatialRegistry.ts'],
    assets: ['CityAssetManager.ts', 'AssetLoader.ts', 'PortraitConfigManager.ts'],
    events: ['HistoricalEventManager.ts', 'EventParser.ts', 'EventFileHandler.ts'],
    editors: [
        'CityEditor.ts',
        'FactionEditor.ts',
        'EventEditor.ts',
        'UnifiedEditorManager.ts',
        'ArmyEditor.ts',
        'TerrainOverrideManager.ts',
    ],
    app: ['GameApp.ts', 'GameUIManager.ts', 'GameInputManager.ts', 'GameTime.ts', 'TimeSystem.ts'],
};

const moved = new Map(); // oldBasename -> { module, newPath }

for (const [mod, files] of Object.entries(MODULES)) {
    const dir = path.join(SRC, mod);
    fs.mkdirSync(dir, { recursive: true });
    for (const file of files) {
        const from = path.join(SRC, 'core', file);
        const to = path.join(dir, file);
        if (!fs.existsSync(from)) {
            console.warn(`Skip missing: ${from}`);
            continue;
        }
        if (fs.existsSync(to)) {
            console.warn(`Already exists: ${to}`);
            continue;
        }
        const content = fs.readFileSync(from, 'utf8');
        fs.writeFileSync(to, content, 'utf8');
        fs.unlinkSync(from);
        moved.set(file, { mod, to });
        const shim = `/** Re-export shim — implementation in src/${mod}/ */\r\nexport * from '../${mod}/${file.replace('.ts', '')}';\r\n`;
        fs.writeFileSync(from, shim, 'utf8');
        console.log(`Moved ${file} -> src/${mod}/`);
    }
}

// Fix imports in moved files: ./X where X moved to another module
const allMoved = new Set(moved.keys());
const modByFile = Object.fromEntries([...moved.entries()].map(([f, v]) => [f, v.mod]));

function fixImports(filePath, mod) {
    let text = fs.readFileSync(filePath, 'utf8');
    const importRe = /from\s+['"](\.\.?\/[^'"]+)['"]/g;
    let changed = false;
    text = text.replace(importRe, (full, spec) => {
        if (!spec.startsWith('./')) return full;
        const target = spec.slice(2);
        const base = target.endsWith('.ts') ? target : `${target}.ts`;
        const baseName = path.basename(base);
        if (!allMoved.has(baseName) || modByFile[baseName] === mod) return full;
        const targetMod = modByFile[baseName];
        const newSpec = `../${targetMod}/${baseName.replace('.ts', '')}`;
        changed = true;
        return full.replace(spec, newSpec);
    });
    // Imports to siblings still in core/
    const coreImportRe = /from\s+['"]\.\/([^'"]+)['"]/g;
    const staysInCore = new Set(
        fs.readdirSync(path.join(SRC, 'core')).filter((f) => f.endsWith('.ts') && !allMoved.has(f))
    );
    text = text.replace(coreImportRe, (full, name) => {
        const base = name.endsWith('.ts') ? name : `${name}.ts`;
        if (allMoved.has(base)) return full;
        if (!staysInCore.has(base) && !fs.existsSync(path.join(SRC, 'core', base))) return full;
        changed = true;
        return `from '../core/${name}'`;
    });
    if (changed) fs.writeFileSync(filePath, text, 'utf8');
}

for (const [file, { mod, to }] of moved) {
    fixImports(to, mod);
}

console.log('Done. Run: npx tsc --noEmit');
