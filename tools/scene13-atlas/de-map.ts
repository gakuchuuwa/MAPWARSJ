/**
 * 把 DE 导出的真实地图数据装成 Scene13EnvironmentPlan，好让 atlas 用**实机同一套渲染器**
 * 画出来，和我们自己生成的底图并排对比。
 *
 * 数据来自 tools/de-map-export.py：DE 场景编辑器跑官方 RMS 生成 → .aoe2scenario → JSON。
 * 地形矩阵、物件坐标、贴图名全是 DE 本体的，这里一处近似都没有，只做格式转换。
 *
 * 铁律：不要在这里"修饰" DE 的数据。它难看也好、好看也好，都得原样画出来——
 * 这张图的全部价值就在于它是 DE 算的，掺一点我们的估计就废了。
 */
import type {
    Scene13EnvironmentPlan,
    TerrainPatchPlan,
    EnvironmentObjectPlan,
} from '../../src/ui/scene13/Scene13EnvironmentGenerator';

const TILE_W = 64;
const TILE_H = 32;

interface DeTerrainInfo {
    tile: string | null;
    name: string;
    blendPriority?: number;
    blendType?: number;
    isWater?: boolean;
}

interface DeMapJson {
    source: string;
    mapSize: number;
    crop: { size: number; offset: number };
    terrainTable: Record<string, DeTerrainInfo>;
    grid: Array<Array<{ t: number; e: number }>>;
    objects: Array<{ const: number; name: string; x: number; y: number; rot: number }>;
}

/**
 * DE 物件 → 我们 public/SUCAI_NATURE 下的素材目录。
 * 左边的名字是 DE dat 里的 unit.name，右边是我们已有的素材夹，一一对得上才列。
 * 对不上的不硬凑——宁可不画，也不拿别的树冒充（那就又变成"我估的"了）。
 */
export const DE_OBJECT_TO_ASSET: Record<string, string> = {
    ITPINE: 'ITALIAN_PINE',
    OLIVE: 'OLIVE',
    FPIN: 'PINE',
    FAUTUM: 'AUTUMN_OAK',
    CYPRESS: 'CYPRESS',
    TREE_ITALIAN_PINE: 'ITALIAN_PINE',
    TREE_OLIVE: 'OLIVE',
    TREE_PINE_FOREST: 'PINE',
    TREE_OAK_AUTUMN: 'AUTUMN_OAK',
    TREE_CYPRESS: 'CYPRESS',
    GRASS_DRY: 'GRASS_DRY',
    PLANT_SHRUB_GREEN: 'SHRUB_GREEN',
    PLANT_FLOWERS: 'FLOWER',
    PLANT_DEAD: 'PLANT_DEAD',
    BUSH_A: 'BUSH_GREEN',
    BUSH_B: 'BUSH_GREEN',
    FRUIT_BUSH: 'FORAGE_BUSH',
    // 🔴 [2026-10-09 修·目录名对不上] 素材目录实际叫 MINE_GOLD / MINE_STONE；
    //    原值 'GOLD_MINE' / 'STONE_MINE' 指向不存在的目录 → 金矿与石矿**一个都画不出来**
    //    （实测 Arabia seed2 的 15 金 + 6 石全部被静默丢弃）。
    GOLD_MINE: 'MINE_GOLD',
    STONE_MINE: 'MINE_STONE',
    STUMP: 'STUMP_GENERIC',
    // ── 2026-10-09 补：为「我们 vs DE」同口径对比补齐映射（此前能画率仅 4.5%）──
    //    实测出现次数来自 scratch/rms-out/Arabia_2.json；素材名来自 public/SUCAI_NATURE 实列。
    GRASS_GREEN: 'GRASS_GREEN',              // 219 个，此前无映射
    GRASS_GREEN_PATCH: 'GRASS_GREEN_PATCH',
    GRASS_DRY_PATCH: 'GRASS_DRY_PATCH',
    FOREST_TREE: 'OAK',                      // ⚠️推断：DE 的「通用森林树」占位，按温带默认树画（102 个）
    OAKTREE: 'OAK',                          // 9 个
    TREE_OAK_FOREST: 'OAK',
    PLAN_WEED_GREEN: 'WEED',                 // ⚠️推断（18 个）
    PLAN_BUSH_GREEN: 'BUSH_GREEN',           // ⚠️推断（5 个）
    FORAGE: 'FORAGE_BUSH',                   // 5 个
    BUSH_TREE_A: 'BUSH_TREE_A',
    BUSH_TREE_B: 'BUSH_TREE_B',
    BUSH_TREE_C: 'BUSH_TREE_C',
    BAMBOO: 'BAMBOO',
    LUSH_BAMBOO: 'LUSH_BAMBOO',
    FELLED_BAMBOO: 'FELLED_BAMBOO',
    DEAD_TREE: 'DEAD_TREE',
    PALM: 'PALM',
    UNDERBRUSH: 'BUSH_GREEN',                // ⚠️推断
    TREE_BIRCH: 'BIRCH_GREEN',
    TREE_ASIAN_MAPLE: 'ASIAN_MAPLE_GREEN',
    // ── 2026-10-09 补：动物（素材在 public/SUCAI_ANIMAL；渲染器已支持查该目录）──
    //    右侧名字取自 SUCAI_ANIMAL 实列目录名。⚠️标注者为推断（DE 名与素材名不同名）。
    GOAT: 'GOAT',
    SHEEP: 'SHEEP',
    DEER: 'DEER',
    MOUFLON: 'MOUFLON',
    WILD_BOAR: 'BOAR',                       // ⚠️推断：DE WILD_BOAR → 素材 BOAR
    WILD_HORSE_C: 'HORSE',                   // ⚠️推断
    HARE_A: 'HARE_BROWN',                    // ⚠️推断
    HARE_B: 'HARE_GREY',                     // ⚠️推断
    OWL: 'OWL',
    HAWK: 'HAWK',
    FALCON: 'FALCON',
    VULTURE: 'VULTURE',
    FLAMINGO: 'FLAMINGO',
    TURKEY: 'TURKEY',
    CHICKEN: 'CHICKEN',
    PIG: 'PIG',
    COW: 'COW_BROWN',                        // ⚠️推断
    WOLF: 'WOLF',
    BEAR: 'BEAR',
    LION: 'LION',
    TIGER: 'TIGER',
    ELEPHANT: 'ELEPHANT',
    RHINO: 'RHINO',
    ZEBRA: 'ZEBRA',
    OSTRICH: 'OSTRICH',
    CAMEL: 'CAMEL',
    DROMEDARY: 'DROMEDARY',
    CROCODILE: 'CROCODILE',
    MONKEY: 'MONKEY',
    GAZELLE: 'GAZELLE',
    IBEX: 'IBEX',
    LLAMA: 'LLAMA',
};

/**
 * PLACEHOLDER2 是 DE 内部标记林地地块用的占位物（RMS 里的 FOREST_PLACEHOLDER），
 * 游戏里不显示。数量很大（这张图 1063 个），画出来会糊满全屏，必须跳过。
 *
 * 🔴 [2026-10-09 修] 导出侧（de-map-export.py:60-66）在查不到枚举时给的是 `UNKNOWN_{const}`，
 *    所以 de_map_1 里的 PLACEHOLDER2 实际叫 **`UNKNOWN_1902`**（已用 genieutils 反查 dat 确认：
 *    dat 的 unit 1902 就是 PLACEHOLDER2，hp=0、standing_graphic=(-1,-1)）。
 *    原来只写 'PLACEHOLDER2' → **两个键永远匹配不上**，1780 个占位物是靠「恰好不在映射表里」躲过去的。
 *    同批还有 `UNKNOWN_647` = dat 的 `HRICH_D`（hp=-1，`_D`=残骸占位），一并显式跳过。
 */
export const DE_INVISIBLE = new Set(['PLACEHOLDER2', 'PLACEHOLDER', 'UNKNOWN_1902', 'UNKNOWN_647']);

/** 我们的地面贴花（烙进地面、不挡路），其余按世界对象走脚点排序 */
const GROUND_LAYER_ASSETS = new Set([
    'GRASS_DRY', 'GRASS_GREEN', 'FLOWER', 'PLANT_DEAD', 'WEED',
]);

export interface DeMapPlan {
    plan: Scene13EnvironmentPlan;
    label: string;
    stats: { terrainKinds: number; objects: number; drawn: number; skipped: Record<string, number> };
}

export function buildDePlan(json: DeMapJson, VW: number, VH: number): DeMapPlan {
    const N = json.crop.size;

    // 我们的等距网格是按屏幕尺寸算的，DE 那块是 N×N。用 DE 的 N 当网格，
    // 原点沿用同一套居中公式，这样投影出来正好铺满这块矩形画布。
    const gw = N, gh = N;
    const ox = VW / 2;
    const oy = (VH - (gw + gh) * (TILE_H / 2)) / 2;

    // ── 地形：占比最大的当铺底，其余每种地形做成一个 patch ──
    const counts = new Map<number, number>();
    for (const row of json.grid) for (const c of row) counts.set(c.t, (counts.get(c.t) ?? 0) + 1);
    let baseId = -1, baseN = -1;
    for (const [id, n] of counts) if (n > baseN) { baseN = n; baseId = id; }
    const baseTerrain = json.terrainTable[String(baseId)]?.tile ?? 'grs';

    const cellsByTerrain = new Map<number, Array<[number, number]>>();
    const elevation: number[][] = [];
    for (let gy = 0; gy < N; gy++) {
        const erow: number[] = [];
        for (let gx = 0; gx < N; gx++) {
            // JSON 的 grid 是 [y][x]，与等距 (gx, gy) 同序
            const cell = json.grid[gy][gx];
            erow.push(cell.e);
            if (cell.t === baseId) continue;
            let arr = cellsByTerrain.get(cell.t);
            if (!arr) { arr = []; cellsByTerrain.set(cell.t, arr); }
            arr.push([gx, gy]);
        }
        elevation.push(erow);
    }

    // 按 DE 的 blend_priority 排序：优先级低的先画，高的后画压上去，与 DE 的咬合次序一致
    const patches: TerrainPatchPlan[] = [...cellsByTerrain.entries()]
        .map(([id, cells]) => ({ id, cells, info: json.terrainTable[String(id)] }))
        .filter((e) => !!e.info?.tile)
        .sort((a, b) => (a.info.blendPriority ?? 0) - (b.info.blendPriority ?? 0))
        .map((e) => ({
            tile: e.info.tile as string,
            cells: e.cells,
            alpha: 1,                      // DE 的地形是实铺，不是半透明叠色
            category: 'ground-variation' as const,
        }));

    // ── 物件 ──
    const objects: EnvironmentObjectPlan[] = [];
    const skipped: Record<string, number> = {};
    for (const o of json.objects) {
        if (DE_INVISIBLE.has(o.name)) { skipped[o.name] = (skipped[o.name] ?? 0) + 1; continue; }
        const asset = DE_OBJECT_TO_ASSET[o.name];
        if (!asset) { skipped[o.name] = (skipped[o.name] ?? 0) + 1; continue; }
        // DE 的 (x, y) 是格坐标（含小数），走和地形同一套等距投影
        const sx = (o.x - o.y) * (TILE_W / 2) + ox;
        const sy = (o.x + o.y) * (TILE_H / 2) + oy;
        const ground = GROUND_LAYER_ASSETS.has(asset);
        objects.push({
            asset,
            x: sx,
            y: sy,
            layer: ground ? 'ground' : 'world',
            z: ground ? 0 : 1,
            flip: false,                   // DE 有 rotation，我们的素材没有对应朝向帧，不假造
            frame: 0,
        });
    }

    const plan = {
        seed: `de:${json.source}`,
        climateRegion: null,
        elevationBand: 'lowland',
        elevationM: null,
        slopeDeg: null,
        biome: 'temperate_forest',
        deMapTheme: null,
        season: 0,
        baseTerrain,
        waterKind: 'none',
        grid: { gw, gh, ox, oy },
        elevation,
        terrainPatches: patches,
        objects,
    } as unknown as Scene13EnvironmentPlan;

    return {
        plan,
        label: json.source,
        stats: {
            terrainKinds: counts.size,
            objects: json.objects.length,
            drawn: objects.length,
            skipped,
        },
    };
}

/** 列出 public/de-maps 下所有导出的 DE 地图（清单由 index.json 给，避免目录遍历） */
export async function loadDeMaps(VW: number, VH: number): Promise<DeMapPlan[]> {
    let names: string[] = [];
    try {
        const r = await fetch('/de-maps/index.json');
        if (r.ok) names = (await r.json()) as string[];
    } catch { /* 没有清单就当没有 DE 图，不影响自家底图 */ }

    const out: DeMapPlan[] = [];
    for (const n of names) {
        try {
            const r = await fetch(`/de-maps/${n}.json`);
            if (!r.ok) continue;
            out.push(buildDePlan((await r.json()) as DeMapJson, VW, VH));
        } catch { /* 单张坏掉不拖累其他 */ }
    }
    return out;
}
