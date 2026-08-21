import type { RegionType } from '../../systems/RegionSystem';
import type { Biome, ElevationBand } from '../Scene13Biome';

export type DeMapThemeId =
    | 'afrotropical_tropical'
    | 'neotropical_temperate'
    | 'neotropical_tropical'
    | 'nearctic_temperate'
    | 'indomalayan_tropical'
    | 'palaearctic_asia_temperate'
    | 'palaearctic_middle_east_desert'
    | 'palaearctic_europe_taiga'
    | 'palaearctic_europe_temperate'
    | 'palaearctic_europe_mediterranean'
    | 'australasian_temperate'
    | 'serengeti';

export interface DeMapThemePalette {
    id: DeMapThemeId;
    baseTerrain: string;
    groundTiles: readonly string[];
    forestFloorTiles: readonly string[];
    trees: readonly string[];
    autumnTrees?: readonly string[];
    winterTrees?: readonly string[];
    flatDecor: readonly string[];
    solidDecor: readonly string[];
    waterPlants: readonly string[];
    beachTerrain: string;
}

export const DE_MAP_THEMES: Readonly<Record<DeMapThemeId, DeMapThemePalette>> = {
    afrotropical_tropical: {
        id: 'afrotropical_tropical',
        baseTerrain: 'des',
        groundTiles: ['qs', 'pal', 'ds3', 'ds2', 'gr5'],
        forestFloorTiles: ['des', 'pal', 'for'],
        trees: ['DRAGON_TREE'],
        flatDecor: ['PLANT_DEAD', 'CACTUS', 'ANIMAL_SKELETON'],
        solidDecor: ['ROCK_FORMATION1', 'ROCK_FORMATION2'],
        waterPlants: ['REEDS'],
        beachTerrain: 'bch',
    },
    neotropical_temperate: {
        id: 'neotropical_temperate',
        baseTerrain: 'grs',
        groundTiles: ['gr6', 'gr7', 'gr8', 'for'],
        forestFloorTiles: ['for', 'ds3'],
        trees: ['MONKEY_PUZZLE'],
        flatDecor: ['WEED', 'FLOWER', 'SHRUB_GREEN'],
        solidDecor: ['ROCK1', 'FLOWERBED', 'SKELETON'],
        waterPlants: ['REEDS', 'WILLOW'],
        beachTerrain: 'bch',
    },
    neotropical_tropical: {
        id: 'neotropical_tropical',
        baseTerrain: 'gr6',
        groundTiles: ['fo2', 'gr7', 'gr3', 'for'],
        forestFloorTiles: ['for', 'fo2'],
        trees: ['JUNGLE', 'RAINFOREST'],
        flatDecor: ['WEED', 'FLOWER', 'SHRUB_GREEN'],
        solidDecor: ['ROCK1', 'FLOWERBED', 'SKELETON'],
        waterPlants: ['REEDS', 'MANGROVE'],
        beachTerrain: 'bc2',
    },
    nearctic_temperate: {
        id: 'nearctic_temperate',
        baseTerrain: 'ds3',
        groundTiles: ['grs', 'gr3', 'gr2', 'ds3'],
        forestFloorTiles: ['for', 'underbrush_leaves'],
        trees: ['PINE'],
        autumnTrees: ['PINE', 'AUTUMN_OAK'],
        winterTrees: ['SNOW_PINE', 'DEAD_TREE'],
        flatDecor: ['BUSH_GREEN', 'FLOWER', 'SHRUB_GREEN'],
        solidDecor: ['ROCK1', 'FLOWERBED', 'BARRELS'],
        waterPlants: ['REEDS', 'WILLOW'],
        beachTerrain: 'bch',
    },
    indomalayan_tropical: {
        id: 'indomalayan_tropical',
        baseTerrain: 'gr7',
        groundTiles: ['gr6', 'grs', 'gr3'],
        forestFloorTiles: ['fo2', 'underbrush_leaves'],
        trees: ['BAMBOO', 'LUSH_BAMBOO'],
        flatDecor: ['SHRUB_GREEN', 'GRAVES', 'FLOWERBED'],
        solidDecor: ['ROCK1', 'FLOWERBED', 'RUGS'],
        waterPlants: ['REEDS', 'LUSH_BAMBOO', 'MANGROVE'],
        beachTerrain: 'bch',
    },
    palaearctic_asia_temperate: {
        id: 'palaearctic_asia_temperate',
        baseTerrain: 'gr7',
        groundTiles: ['gr4', 'ds3'],
        forestFloorTiles: ['for', 'fo2'],
        trees: ['BUSH_TREE_B', 'ASIAN_MAPLE_GREEN'],
        autumnTrees: ['BUSH_TREE_B', 'AUTUMN_OAK', 'ASIAN_MAPLE_AUTUMN'],
        winterTrees: ['DEAD_TREE', 'SNOW_PINE'],
        flatDecor: ['SHRUB_GREEN', 'FLOWER', 'BUSH_GREEN'],
        solidDecor: ['ROCK1', 'FLOWERBED', 'RUGS'],
        waterPlants: ['REEDS', 'WILLOW'],
        beachTerrain: 'bch',
    },
    palaearctic_middle_east_desert: {
        id: 'palaearctic_middle_east_desert',
        baseTerrain: 'pal',
        groundTiles: ['ds2', 'des', 'ds4', 'qs'],
        forestFloorTiles: ['pal', 'for'],
        trees: ['PALM'],
        flatDecor: ['PLANT_DEAD', 'CACTUS', 'ANIMAL_SKELETON'],
        solidDecor: ['ROCK_FORMATION1', 'ROCK_FORMATION2'],
        waterPlants: ['REEDS', 'PALM'],
        beachTerrain: 'bch',
    },
    palaearctic_europe_taiga: {
        id: 'palaearctic_europe_taiga',
        baseTerrain: 'gr7',
        groundTiles: ['gr2', 'gr4', 'for', 'grs'],
        forestFloorTiles: ['for', 'snf', 'underbrush_leaves'],
        trees: ['DEAD_TREE', 'PINE'],
        autumnTrees: ['DEAD_TREE', 'PINE', 'AUTUMN_OAK'],
        winterTrees: ['DEAD_TREE', 'SNOW_PINE'],
        flatDecor: ['FLOWER', 'STUMP_GENERIC'],
        solidDecor: ['ROCK1', 'FLOWERBED', 'SKELETON'],
        waterPlants: ['REEDS', 'WILLOW'],
        beachTerrain: 'bch',
    },
    palaearctic_europe_temperate: {
        id: 'palaearctic_europe_temperate',
        baseTerrain: 'gr2',
        groundTiles: ['for', 'gr3', 'gr2'],
        forestFloorTiles: ['for', 'underbrush_leaves'],
        trees: ['BUSH_TREE_A', 'OAK'],
        autumnTrees: ['BUSH_TREE_A', 'AUTUMN_OAK'],
        winterTrees: ['DEAD_TREE', 'SNOW_AUTUMN_OAK'],
        flatDecor: ['FLOWER', 'STUMP_GENERIC'],
        solidDecor: ['ROCK1', 'FLOWERBED', 'SKELETON'],
        waterPlants: ['REEDS', 'WILLOW'],
        beachTerrain: 'bch',
    },
    palaearctic_europe_mediterranean: {
        id: 'palaearctic_europe_mediterranean',
        baseTerrain: 'gr3',
        groundTiles: ['gr7', 'pm1', 'pc3', 'ds3'],
        forestFloorTiles: ['for', 'underbrush_leaves'],
        trees: ['OLIVE', 'ITALIAN_PINE'],
        winterTrees: ['OLIVE', 'ITALIAN_PINE'],
        flatDecor: ['FLOWER', 'STUMP_GENERIC'],
        solidDecor: ['ROCK1', 'FLOWERBED', 'BARRELS'],
        waterPlants: ['REEDS', 'OLIVE'],
        beachTerrain: 'bch',
    },
    australasian_temperate: {
        id: 'australasian_temperate',
        baseTerrain: 'gr7',
        groundTiles: ['gr4', 'ds3', 'for', 'ds5'],
        forestFloorTiles: ['for', 'underbrush_leaves'],
        trees: ['BIRCH_GREEN'],
        autumnTrees: ['BIRCH_AUTUMN'],
        winterTrees: ['BIRCH_WINTER'],
        flatDecor: ['SHRUB_GREEN', 'FLOWER', 'BUSH_GREEN'],
        solidDecor: ['ROCK1', 'FLOWERBED', 'RUGS'],
        waterPlants: ['REEDS', 'WILLOW'],
        beachTerrain: 'bch',
    },
    serengeti: {
        id: 'serengeti',
        baseTerrain: 'ds4',
        groundTiles: ['gr5', 'rd1', 'rd2', 'ds5', 'des', 'grs', 'gr2', 'gr3'],
        forestFloorTiles: ['gr5', 'ds4'],
        trees: ['ACACIA', 'BAOBAB'],
        flatDecor: ['GRASS_DRY', 'GRASS_DRY_PATCH', 'PLANT_DEAD'],
        solidDecor: ['ROCK_FORMATION1', 'ROCK_FORMATION2', 'ROCK_FORMATION3', 'ROCK_LIMESTONE'],
        waterPlants: ['REEDS'],
        beachTerrain: 'bch',
    },
};

const ASIAN_REGIONS = new Set<RegionType>([
    'CENTRAL', 'NORTH', 'JIANGNAN', 'LINGNAN', 'BASHU', 'DIANQIAN', 'HEXI',
    'WESTERN', 'TIBET', 'STEPPE', 'NORTHEAST', 'KOREA', 'JAPAN', 'CENTRAL_ASIA',
]);

export function resolveDeMapTheme(
    lat: number,
    lng: number,
    biome: Biome,
    region: RegionType,
): DeMapThemePalette {
    if (lat < 0 && lng >= 100) return DE_MAP_THEMES.australasian_temperate;
    if (biome === 'tropical_rainforest') {
        if (lng < -30) return DE_MAP_THEMES.neotropical_tropical;
        if (lng < 55) return DE_MAP_THEMES.afrotropical_tropical;
        return DE_MAP_THEMES.indomalayan_tropical;
    }
    if (biome === 'savanna') {
        if (region === 'WEST_ASIA' || region === 'CENTRAL_ASIA' || region === 'WESTERN' || region === 'HEXI') {
            return DE_MAP_THEMES.palaearctic_middle_east_desert;
        }
        return DE_MAP_THEMES.serengeti;
    }
    if (biome === 'desert') return DE_MAP_THEMES.palaearctic_middle_east_desert;
    if (biome === 'mediterranean') return DE_MAP_THEMES.palaearctic_europe_mediterranean;
    if (biome === 'boreal' || biome === 'tundra_snow') {
        return lng < -30 ? DE_MAP_THEMES.nearctic_temperate : DE_MAP_THEMES.palaearctic_europe_taiga;
    }
    if (lng < -30) {
        return lat < 0 ? DE_MAP_THEMES.neotropical_temperate : DE_MAP_THEMES.nearctic_temperate;
    }
    if (ASIAN_REGIONS.has(region)) return DE_MAP_THEMES.palaearctic_asia_temperate;
    return DE_MAP_THEMES.palaearctic_europe_temperate;
}

export function terrainForTheme(
    theme: DeMapThemePalette,
    biome: Biome,
    season: 0 | 1 | 2,
    elevationBand: ElevationBand,
): string {
    if (elevationBand === 'snow') return season === 2 ? 'ice' : 'sno';
    if (season === 2) {
        if (biome === 'tundra_snow') return 'sno';
        if (biome === 'boreal') return 'sno';
        if (biome === 'cold_steppe' || biome === 'temperate_grass' || biome === 'temperate_forest') return 'sn2';
    }
    return theme.baseTerrain;
}

export function treesForTheme(theme: DeMapThemePalette, season: 0 | 1 | 2): readonly string[] {
    if (season === 2 && theme.winterTrees?.length) return theme.winterTrees;
    if (season === 1 && theme.autumnTrees?.length) return theme.autumnTrees;
    return theme.trees;
}

export function groundTilesForTheme(
    theme: DeMapThemePalette,
    biome: Biome,
    season: 0 | 1 | 2,
): readonly string[] {
    if (season === 2 && (biome === 'tundra_snow' || biome === 'boreal')) return ['sno', 'sn2', 'snf'];
    if (season === 2 && (biome === 'cold_steppe' || biome === 'temperate_grass' || biome === 'temperate_forest')) {
        return ['sn2', 'snf', 'sno'];
    }
    return theme.groundTiles;
}
