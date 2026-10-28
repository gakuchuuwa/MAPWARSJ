/**
 * 战术场景地面贴图：按 DE 烘焙图的真实地形直方图取（DE 口径）。
 *
 * 🔴 [2026-10-21 主人令「请全部和DE保持一致」]
 *
 * DE 的地面不是「按气候主题挑一张底图」，而是按每格地形（dat 的 39 种 terrain）铺贴图：
 * `14 Desert → g_pal`、`12 Grass 2 → g_gr2`、`100 Dry Grass → g_gr7`、`2 Beach → g_bch`、
 * `10 Forest → g_for`、`3 Dirt 3 → g_ds3` …（name_2 就是贴图名，见 `scratch/de_terrain_units.json`）。
 * 本作烘焙图 `site_*.json / theme_*.json` 的 `terrain[]` 就是我们自己用 DE 引擎跑出来的地形，
 * 所以战术场景的地面贴图应当**由这份地形直方图决定**，而不是只看据点建筑风格/气候主题
 * （旧做法会让沙漠图铺成黄土、温带图铺成夯土，与 DE 原版观感不符）。
 *
 * 说明：本作地面层是「6 张贴图 + 噪声势场」的近似，不是逐格贴图；这里把 6 张里最能代表
 * DE 地形的一张贴图换成 DE 地形对应的那一张（主地面取「最常见的陆地地形」）。
 */

import { DE_TERRAIN_MANIFEST } from '../../data/battlefield/deTerrainData';
import { groundVariationFor } from './DecorFit';
import type { Scene13GroundTiles } from './Scene13EnvironmentGenerator';

/** 水体 DE 地形 id（与 Scene13GroundSetup 的 WATER_TERRAINS 同一份口径） */
const WATER_IDS = new Set([1, 4, 15, 22, 23, 58, 95, 96]);

const FOREST_RE = /forest|jungle|palm|birch|autumn|bamboo|rainforest|oak|acacia|baobab|dragon|mangrove|spruce|dead|mediterranean|reeds|underbrush|leaves/i;
const DIRT_RE = /dirt|mud/i;
const DRY_RE = /dry grass|savannah|steppe|dry/i;

/** 已确认存在贴图文件的 tile 名（public/SUCAI_TERRAIN/*.png），防止拼出加载不到的名字 */
const KNOWN_TILES = new Set(`
bc2 bc3 bc4 bch beach_wet des ds2 ds3 ds4 ds5 fc1 fc2 fc3 fm1 fm2 fo2 for gr2 gr3 gr4 gr5 gr6 gr7 gr8 gr9
gravel_default gravel_wet grs ic2 ic3 ice ice_beach o_fo2 o_gr4 o_mod o_rd3 o_rd4 o_rd5 o_snd o_sng o_sr1 o_sr2
pal pal1 pc1 pc2 pc3 pm1 pm1_plaza pm2 qs qs2 r01 rc1 rc2 rc3 rck rck_plaza rd1 rd1_plaza rd2 rd2_plaza rd5
river_clean_green rm1 rm2 rock_wet sh2 sh3 sh4 sh5 sha sn2 snd snf sno sr2 sr2_plaza underbrush_leaves
wt2 wt3 wt4 wt5 wt6 wtr wt_brown wt_green wt_yellow wt_yellow2
`.trim().split(/\s+/));

/** DE 地形 id → 本作贴图名（取 dat 的 name_2，去掉 `g_` 前缀） */
export function tileFromTerrainId(tid: number): string | null {
    const m = (DE_TERRAIN_MANIFEST as any)[tid];
    const n2: string | undefined = m?.name_2;
    if (!n2) return null;
    const t = n2.replace(/^g_/, '');
    return KNOWN_TILES.has(t) ? t : null;
}

const isWaterId = (tid: number): boolean => WATER_IDS.has(tid)
    || (DE_TERRAIN_MANIFEST as any)[tid]?.overlay_mask_name === 'water.png';

const terrainName = (tid: number): string => (DE_TERRAIN_MANIFEST as any)[tid]?.name ?? '';

/**
 * 用 DE 烘焙地形直方图推导战术地面 6 张贴图。
 * @param terrain   mapData.terrain（DE 地形 id 数组）
 * @param fallback  气候主题/兜底给的贴图（推导不出的项沿用）
 * @returns 合并后的 6 张；没有任何可用陆地地形时返回 null（调用方保留 fallback）
 */
export function deriveDeGroundTiles(
    terrain: ArrayLike<number> | null | undefined,
    fallback: Partial<Scene13GroundTiles> | undefined,
): Partial<Scene13GroundTiles> | null {
    if (!terrain || terrain.length === 0) return null;
    const count = new Map<number, number>();
    for (let i = 0; i < terrain.length; i++) {
        const t = terrain[i];
        count.set(t, (count.get(t) ?? 0) + 1);
    }
    const entries = [...count.entries()].sort((a, b) => b[1] - a[1]);
    const land = entries.filter(([t]) => !isWaterId(t));
    if (land.length === 0) return null;

    const pick = (pred: (tid: number) => boolean): number | null => {
        for (const [t] of land) if (pred(t)) return t;
        return null;
    };
    const isForest = (t: number) => FOREST_RE.test(terrainName(t));
    const isDirt = (t: number) => DIRT_RE.test(terrainName(t)) || /^(ds|des)/.test((DE_TERRAIN_MANIFEST as any)[t]?.name_2?.replace(/^g_/, '') ?? '');
    const isDry = (t: number) => DRY_RE.test(terrainName(t));

    // 主地面：最常见的「非森林、非泥土」陆地地形（草地/干草/沙地…）；没有就退回最常见的陆地地形
    const baseTid = pick((t) => !isForest(t) && !isDirt(t)) ?? land[0][0];
    const baseTile = tileFromTerrainId(baseTid);
    if (!baseTile) return null;

    const forestTid = pick((t) => t !== baseTid && isForest(t));
    const dirtTid = pick((t) => t !== baseTid && isDirt(t));
    const dryTid = pick((t) => t !== baseTid && isDry(t));
    const beachCnt = count.get(2) ?? 0;

    // 照 DE Arabia.rms BASE_BLEND_A / B / C 同色系多层地面机制：
    // 若烘焙图 terrain[] 中未单列副草皮/泥土格（或与主地面 baseTile 撞成同一张贴图），
    // 从 DecorFit.groundVariationFor(baseTile) 取 DE 同色系深浅变体，确保 grass / dry / dirt 三层材质层次分明。
    const variations = groundVariationFor(baseTile);
    const rawDry = (dryTid !== null && tileFromTerrainId(dryTid)) || null;
    const dryTile = (rawDry && rawDry !== baseTile)
        ? rawDry
        : (variations[0] ?? (fallback?.dry && fallback.dry !== baseTile ? fallback.dry : baseTile));

    const rawDirt = (dirtTid !== null && tileFromTerrainId(dirtTid)) || null;
    const dirtTile = (rawDirt && rawDirt !== baseTile && rawDirt !== dryTile)
        ? rawDirt
        : (variations.find((v) => v !== baseTile && v !== dryTile)
            ?? variations[1]
            ?? variations[0]
            ?? (fallback?.dirt && fallback.dirt !== baseTile ? fallback.dirt : baseTile));

    const rawForest = (forestTid !== null && tileFromTerrainId(forestTid)) || null;
    const isSparseDesertBase = baseTile === 'pal' || baseTile === 'des' || baseTile === 'qs' || baseTile === 'pal1' || baseTile === 'ds5' || baseTile === 'gravel_default';
    const forestTile = (rawForest && rawForest !== baseTile && !isSparseDesertBase)
        ? rawForest
        : (fallback?.forest && fallback.forest !== baseTile
            ? fallback.forest
            : (isSparseDesertBase ? dryTile : (baseTile === 'gr6' || baseTile === 'fo2' ? 'fo2' : 'for')));

    const out: Partial<Scene13GroundTiles> = {
        ...(fallback ?? {}),
        grass: baseTile,
        forest: forestTile,
        dirt: dirtTile,
        dry: dryTile,
        sand: beachCnt > 0 ? (tileFromTerrainId(2) ?? fallback?.sand) : (fallback?.sand ?? 'bch'),
    };
    return out;
}
