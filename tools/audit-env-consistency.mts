/**
 * 战略地图 vs 战术地图 环境判定一致性实测（只读，不改任何游戏数据）。
 *
 * 逐个据点，拿战略图各层（环境区、动物总表、森林掩膜、民生生计）的判定，
 * 去对战术图（柯本 → 9 地貌 → 18 套 DE 主题、animalNativeAt）的判定；并统计每个物种在多少据点周边看得到。
 *
 * 用法：npx tsx tools/audit-env-consistency.mts [--json 输出路径]
 * 海拔：默认按「无海拔」判地貌（战术高原框内会被误判成高原）。
 *   传 --dem <目录> 时读取该目录下的 Terrarium 海拔瓦片（文件名 <x>_<y>.png）带真实海拔判。
 *   缩放级别取游戏的 DEM_ZOOM（项目只在 zoom 9 运行，游戏按 zoom 9 瓦片取海拔），与游戏同一口径。
 */
import { registerHooks } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

// 战略层模块顶部 import 了 leaflet 和 Vite 虚拟模块：命令行下全部桩掉，只取纯函数。
registerHooks({
    resolve(specifier, context, nextResolve) {
        if (specifier === 'leaflet' || specifier === 'virtual:portrait-manifest') {
            return { url: `stub:${specifier}`, shortCircuit: true };
        }
        return nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
        if (url.startsWith('stub:')) {
            return { format: 'module', source: 'export default new Proxy({}, { get: () => () => ({}) });', shortCircuit: true };
        }
        return nextLoad(url, context);
    },
});

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mod = (p: string) => import(pathToFileURL(path.join(ROOT, p)).href);

const { CITIES_V2 } = await mod('src/data/cities_v2.ts');
const { envZoneAt, ENV_ZONE_REALM, ENV_ZONE_NAMES } = await mod('src/world/environment/envZones.ts');
const { wildPoolAt, ANIMAL_CATALOG } = await mod('src/world/environment/animalCatalog.ts');
const { detectBiomeAtElevation, resolveClimateRegion } = await mod('src/ui/Scene13Biome.ts');
const { resolveDeMapTheme } = await mod('src/ui/scene13/Scene13DeMapThemes.ts');
const { animalNativeAt } = await mod('src/ui/scene13/Scene13Animals.ts');
const sharp = (await import('sharp')).default;

// --dem <目录>：游戏 DEM_ZOOM 级 Terrarium 瓦片，海拔 = R×256 + G + B/256 − 32768（米）
const { DEM_ZOOM } = await mod('src/world/land-sea/TerrariumCodec.ts');
const demAt = process.argv.indexOf('--dem');
const demDir = demAt > 0 ? process.argv[demAt + 1] : null;
const demCache = new Map<string, { data: Buffer; width: number } | null>();
async function elevationAt(lat: number, lng: number): Promise<number | null> {
    if (!demDir) return null;
    const z = DEM_ZOOM as number, n = 2 ** z;
    const fx = (lng + 180) / 360 * n;
    const la = lat * Math.PI / 180;
    const fy = (1 - Math.log(Math.tan(la) + 1 / Math.cos(la)) / Math.PI) / 2 * n;
    const key = `${Math.floor(fx)}_${Math.floor(fy)}`;
    if (!demCache.has(key)) {
        try {
            const r = await sharp(path.join(demDir, `${key}.png`)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
            demCache.set(key, { data: r.data, width: r.info.width });
        } catch { demCache.set(key, null); }
    }
    const t = demCache.get(key);
    if (!t) return null;
    const px = Math.min(t.width - 1, Math.floor((fx - Math.floor(fx)) * t.width));
    const py = Math.min(t.width - 1, Math.floor((fy - Math.floor(fy)) * t.width));
    const i = (py * t.width + px) * 3;
    return t.data[i] * 256 + t.data[i + 1] + t.data[i + 2] / 256 - 32768;
}

/** 民生层的表是文件内私有常量：按源码原文取出对象字面量（纯数据，不含类型标注）。 */
const cityLifeSrc = readFileSync(path.join(ROOT, 'src/map/CityLifeAmbientLayer.ts'), 'utf8');
function extractConst<T>(name: string): T {
    const at = cityLifeSrc.indexOf(`const ${name}`);
    if (at < 0) throw new Error(`找不到 ${name}`);
    const open = cityLifeSrc.indexOf('= {', at) + 2;
    let depth = 0;
    for (let i = open; i < cityLifeSrc.length; i++) {
        const ch = cityLifeSrc[i];
        if (ch === '{') depth++;
        else if (ch === '}' && --depth === 0) return new Function(`return (${cityLifeSrc.slice(open, i + 1)});`)() as T;
    }
    throw new Error(`${name} 括号不配对`);
}
const CULTURE_TO_CATEGORY = extractConst<Record<string, string>>('CULTURE_TO_CATEGORY');
const LIVELIHOOD_SPECS = extractConst<Record<string, { animals: string[] }>>('LIVELIHOOD_SPECS');

// 战略森林掩膜（R = RESOLVE 群系编号，G = 树冠密度%），取值公式与 StrategicForestMask.ts 一致。
const mask = await sharp(path.join(ROOT, 'public/world/strategic-forest-mask.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
// 森林模型（口径 C）：注入潜在植被与 HYDE 开垦两张掩膜，战略「成不成林」与战术「模板树留多少」都按游戏同一函数算
const FM = await mod('src/map/StrategicForestMask.ts');
FM.setStrategicForestMaskData(new Uint8ClampedArray(mask.data), mask.info.width, mask.info.height);
const LU = await mod('src/map/LandUseMask.ts');
const lu = await sharp(path.join(ROOT, 'public/world/land-use-hyde.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
LU.setLandUseMaskData(new Uint8ClampedArray(lu.data), lu.info.width, lu.info.height);
const { forestCoverAt, forestPotentialAt, tacticalTreeKeepRatio, FOREST_COVER_THRESHOLD } = await mod('src/world/environment/forestModel.ts');
const yearAt = process.argv.indexOf('--year');
const AUDIT_YEAR = yearAt > 0 ? Number(process.argv[yearAt + 1]) : 1000;
function maskAt(lat: number, lng: number): { biome: number; canopy: number } {
    const { width, height } = mask.info;
    const x = ((Math.floor(((lng + 180) / 360) * width) % width) + width) % width;
    const y = Math.max(0, Math.min(height - 1, Math.floor(((90 - lat) / 180) * height)));
    const i = (y * width + x) * 4;
    return { biome: mask.data[i], canopy: mask.data[i + 1] };
}

function themeToWwf(id: string): string | null {
    if (id === 'serengeti') return 'afrotropical';
    if (id === 'palustrine_swamp') return null;   // 沼泽主题不分大区
    return id.split('_')[0];
}

const FOREST_BIOMES = new Set(['tropical_rainforest', 'temperate_forest', 'boreal']);
const OPEN_BIOMES = new Set(['desert', 'cold_steppe', 'savanna', 'tundra_snow']);
/** 生计 × 地貌：明显不合的组合（按自然条件，不按文化） */
const LIVELIHOOD_CLASH: Record<string, Set<string>> = {
    farming_rice: new Set(['desert', 'cold_steppe', 'tundra_snow', 'boreal']),
    farming_dry: new Set(['tundra_snow']),
    nomadic_steppe: new Set(['tropical_rainforest']),
    nomadic_oasis: new Set(['tropical_rainforest', 'boreal', 'tundra_snow']),
    highland_pastoral: new Set(['tropical_rainforest']),
    forest_hunting: new Set(['desert']),
    forest_logging: new Set(['desert']),
};

type Row = {
    id: string; name: string; lat: number; lng: number; style: string;
    koppen: string | null; biome: string; theme: string;
    strategicRealm: string; realmMismatch: boolean;
    badWild: string[]; forestCanopy: number; forestClash: string | null;
    livelihood: string; livelihoodClash: boolean; badLivelihoodAnimals: string[];
};
const rows: Row[] = [];
const seen: Record<string, number> = {}, seenWinter: Record<string, number> = {}, zoneCount: Record<string, number> = {};

for (const c of CITIES_V2 as any[]) {
    const lat = c.lat as number, lng = c.lng as number;
    const style = (c.buildingStyle ?? 'CENTRAL') as string;
    const koppen = resolveClimateRegion(lat, lng);
    const elev = await elevationAt(lat, lng);
    const biome = detectBiomeAtElevation(lat, lng, elev) as string;
    const theme = resolveDeMapTheme(lat, lng, biome, elev, 'none');
    const realmKey = envZoneAt(lat, lng) as string;

    const sw = ENV_ZONE_REALM[realmKey] as string;
    const tw = themeToWwf(theme.id);
    const realmMismatch = tw !== null && tw !== sw;

    const pool = wildPoolAt(lat, lng) as { land: string[]; birds: string[] };
    const winterPool = wildPoolAt(lat, lng, true) as { land: string[]; birds: string[] };
    for (const sp of new Set([...pool.land, ...pool.birds])) seen[sp] = (seen[sp] ?? 0) + 1;
    for (const sp of new Set([...winterPool.land, ...winterPool.birds])) seenWinter[sp] = (seenWinter[sp] ?? 0) + 1;
    zoneCount[realmKey] = (zoneCount[realmKey] ?? 0) + 1;
    const badWild = [...pool.land, ...pool.birds].filter((sp) => !animalNativeAt(sp, lat, lng, theme.baseTerrain));

    const { canopy } = maskAt(lat, lng);
    // 战略成林 = 森林模型 ≥ 门槛；战术 = 模板树保留比例。两边同查 forestModel，按设计应 0 不一致
    const cover = forestCoverAt(lat, lng, AUDIT_YEAR, elev) ?? 0;
    const keep = tacticalTreeKeepRatio(lat, lng, AUDIT_YEAR, elev);
    const potential = forestPotentialAt(lat, lng) ?? 0;
    const forestClash = cover >= FOREST_COVER_THRESHOLD && keep < 0.6 ? '战略成林·战术砍光'
        : potential > 0 && cover < FOREST_COVER_THRESHOLD / 2 && keep >= 0.95 ? '战略开阔·战术满林'
            : null;

    const livelihood = CULTURE_TO_CATEGORY[style] ?? 'farming_dry';
    const livelihoodClash = LIVELIHOOD_CLASH[livelihood]?.has(biome) ?? false;
    // 与 CityLifeAmbientLayer 取猎物同一口径：美洲文化换池，旧大陆只留鹿、野猪。
    let animalPool = LIVELIHOOD_SPECS[livelihood]?.animals ?? [];
    if (style === 'INCA') animalPool = ['LLAMA', 'ALPACA'];
    else if (style === 'MAPUCHE') animalPool = ['GUANACO', 'HORSE'];
    else if (style === 'AMERICA' || style === 'MAYANS' || style === 'TUPI') animalPool = ['TURKEY', 'DEER'];
    const isAmericas = ['MUISCA', 'MAYANS', 'TUPI', 'MAPUCHE', 'INCA', 'AMERICA'].includes(style);
    const preyPool = animalPool.filter((sp) => (isAmericas ? ['DEER', 'BOAR', 'TURKEY', 'GUANACO'] : ['DEER', 'BOAR']).includes(sp));
    const lvAnimals = livelihood === 'forest_hunting' || livelihood === 'forest_logging' ? preyPool : [];
    const badLivelihoodAnimals = lvAnimals.filter((sp) => !animalNativeAt(sp, lat, lng, theme.baseTerrain));

    rows.push({
        id: c.id, name: c.name ?? c.id, lat, lng, style, koppen, biome, theme: theme.id,
        strategicRealm: realmKey, realmMismatch, badWild, forestCanopy: canopy, forestClash,
        livelihood, livelihoodClash, badLivelihoodAnimals,
    });
}

const n = rows.length;
const pct = (k: number) => `${k}（${((k / n) * 100).toFixed(1)}%）`;
const tally = (xs: string[]) => [...xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]);
const sample = (rs: Row[], f: (r: Row) => string, k = 8) => rs.slice(0, k).map((r) => `    ${r.name}（${r.lat.toFixed(1)},${r.lng.toFixed(1)}）${f(r)}`).join('\n');

const realmBad = rows.filter((r) => r.realmMismatch);
const wildBad = rows.filter((r) => r.badWild.length > 0);
const forestBad = rows.filter((r) => r.forestClash);
const lvBad = rows.filter((r) => r.livelihoodClash);
const lvAnimBad = rows.filter((r) => r.badLivelihoodAnimals.length > 0);
const anyBad = rows.filter((r) => r.realmMismatch || r.badWild.length || r.forestClash || r.livelihoodClash || r.badLivelihoodAnimals.length);

console.log(`据点 ${n} 个；至少一项对不上：${pct(anyBad.length)}\n`);
console.log(`① 生物地理大区（环境区所属大区 vs 战术 DE 主题前缀）不一致：${pct(realmBad.length)}`);
console.log('   组合：' + tally(realmBad.map((r) => `${r.strategicRealm}→${r.theme}`)).slice(0, 10).map(([k, v]) => `${k}×${v}`).join('，'));
console.log(sample(realmBad, (r) => ` 战略 ${r.strategicRealm} / 战术 ${r.theme}`));
console.log(`\n② 野生动物：战略图会放、战术图不认的物种（同查总表，非 0 只会来自战术的荒漠剔野猪规则），涉及据点：${pct(wildBad.length)}`);
console.log('   物种：' + tally(wildBad.flatMap((r) => r.badWild)).slice(0, 15).map(([k, v]) => `${k}×${v}`).join('，'));
console.log(sample(wildBad, (r) => ` ${r.strategicRealm}：${r.badWild.join('、')}`));
console.log(`\n③ 森林：战略森林掩膜 vs 战术地貌 对不上：${pct(forestBad.length)}`);
console.log('   ' + tally(forestBad.map((r) => `${r.forestClash}（${r.biome}）`)).map(([k, v]) => `${k}×${v}`).join('，'));
console.log(sample(forestBad, (r) => ` 树冠 ${r.forestCanopy}% / 战术 ${r.biome}`));
console.log(`\n④ 民生生计和当地气候明显不合：${pct(lvBad.length)}`);
console.log('   ' + tally(lvBad.map((r) => `${r.livelihood}@${r.biome}`)).map(([k, v]) => `${k}×${v}`).join('，'));
console.log(sample(lvBad, (r) => ` ${r.style} ${r.livelihood} / 柯本 ${r.koppen} → ${r.biome}`));
console.log(`\n⑤ 猎场／伐木的野生猎物战术图不认：${pct(lvAnimBad.length)}`);
console.log('   ' + tally(lvAnimBad.flatMap((r) => r.badLivelihoodAnimals)).map(([k, v]) => `${k}×${v}`).join('，'));
console.log(sample(lvAnimBad, (r) => ` ${r.style}：${r.badLivelihoodAnimals.join('、')}`));


console.log('\n⑥ 各环境区据点数：' + Object.entries(zoneCount).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${ENV_ZONE_NAMES[k]}×${v}`).join('，'));
console.log('\n⑦ 野生动物与飞鸟可见性（周边能出现它的据点数：全年 / 冬季）：');
const vis = Object.entries<any>(ANIMAL_CATALOG).filter(([, e]) => e.kind === 'wild' || e.kind === 'bird')
    .map(([sp]) => [sp, seen[sp] ?? 0, seenWinter[sp] ?? 0] as const).sort((a, b) => a[2] - b[2]);
console.log('   ' + vis.map(([sp, y, w]) => `${sp} ${y}/${w}`).join('，'));
const never = vis.filter(([, y, w]) => y === 0 && w === 0).map(([sp]) => sp);
console.log(`   永远看不到（任何据点周边都不出现）：${never.length ? never.join('、') : '无'}`);


// ⑧ 树种：战术战场（据点烘焙图的树 → 植物总表合区域）与战略图（本区主树种）是否同一组
const { deTerrainTrees } = await mod('src/ui/scene13/Scene13DeTrees.ts');
const { plantTreeAt, plantRegionalizeTree, treeFamily, ZONE_PLANTS } = await mod('src/world/environment/plantCatalog.ts');
const { existsSync } = await import('node:fs');
let treeOk = 0; const treeBad: string[] = [];
for (const c of CITIES_V2 as any[]) {
    const f = path.join(ROOT, 'public/battlefields', `site_${c.id}.json`);
    if (!existsSync(f)) continue;
    const terrain = JSON.parse(readFileSync(f, 'utf8')).terrain as number[];
    const tac = new Set<string>();
    terrain.forEach((t, i) => { for (const u of deTerrainTrees(t)) tac.add(treeFamily(plantRegionalizeTree(c.lat, c.lng, u.asset, (i % 1000) / 1000))); });
    const allowed = new Set<string>();
    for (let k = 0; k < 100; k++) allowed.add(treeFamily(plantTreeAt(c.lat, c.lng, k / 100)));
    for (const e of ZONE_PLANTS[envZoneAt(c.lat, c.lng)].extra ?? []) allowed.add(treeFamily(e));
    const stray = [...tac].filter((x) => !allowed.has(x));
    if (stray.length === 0) treeOk++; else treeBad.push(`${c.name}：${stray.join('、')}`);
}
console.log(`\n⑧ 树种：战术战场的树不在本区树种表内的据点：${treeBad.length}（一致 ${treeOk}）`);
if (treeBad.length) console.log('    ' + treeBad.slice(0, 8).join('\n    '));

const jsonAt = process.argv.indexOf('--json');
if (jsonAt > 0 && process.argv[jsonAt + 1]) {
    writeFileSync(process.argv[jsonAt + 1], JSON.stringify(rows, null, 1));
    console.log(`\n明细已写入 ${process.argv[jsonAt + 1]}`);
}
