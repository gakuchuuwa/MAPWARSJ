/**
 * 动物总表：自然轴「内容层」（口径见 docs/AGENTS/environment-architecture.md）。
 *
 * 每个物种只在这里写一次「出现在哪」：战略野生动物层、战术战地图都查这张表，不再各写一份。
 * 判定物种身份**只看素材样子**（public/SUCAI_ANIMAL/<名>/ 的帧图），不看文件夹名：
 *   CAMEL 文件夹是单峰驼、DROMEDARY 文件夹是双峰驼（名字与样子相反）；DONKEY 是驮筐家驴；
 *   WAR_DOG 是家养獒犬；TAPIR 是深棕色南美貘（马来貘是黑白的）；KOMODO 是黄褐巨蜥（泛指各地巨蜥）；
 *   WOLF_ARCTIC / HARE_ARCTIC 是白色冬毛的狼和雪兔；ELK 是掌状角的驼鹿。
 *
 * 原则：既要真实，又要游戏里看得到 —— 每个物种至少落在一个有据点的区，不许只放在没人去的地方。
 * 🔴 2026-10-31 主人定「北极熊按 B（冬季南延）；所有其他物种尽量也按偶尔能看到」：
 *    物种在常住区之外，可写现实中零星出现的邻近区（strays，可限冬季、纬度），进物种池的权重是常住的 1/4。
 */
import { envIslandAt, envZoneAt, type EnvIsland, type EnvZone } from './envZones';

export type AnimalKind = 'wild' | 'bird' | 'livestock' | 'legend';

export interface AnimalEntry {
    kind: AnimalKind;
    /** 按样子判定的身份（游戏里代表什么） */
    look: string;
    /** 全年出现的环境区；不写 = 不限地区（家畜按文化由民生层放，这里不限） */
    zones?: readonly EnvZone[];
    /** 只在冬季出现的环境区（冬毛样子的物种） */
    winterZones?: readonly EnvZone[];
    /** 这些岛上没有 */
    excludeIslands?: readonly EnvIsland[];
    /** 'coast'：只在海岸附近出现 */
    habitat?: 'coast';
    /** 同一素材也作家畜用：zones 只限野生出现地，人类聚落（战术战 DE 原图摆放）不限 */
    alsoDomestic?: boolean;
    /** 偶见：常住区之外零星出现的邻近区（权重为常住的 1/4） */
    strays?: readonly AnimalStray[];
}

export interface AnimalStray {
    zones: readonly EnvZone[];
    /** 只在冬季 */
    winterOnly?: boolean;
    /** 只在该纬度以北（北半球） */
    minLat?: number;
}

/** 常住与偶见进物种池的权重比 */
const RESIDENT_WEIGHT = 4;
const STRAY_WEIGHT = 1;

const PALAEARCTIC_TEMPERATE: readonly EnvZone[] = ['WEU', 'CEU', 'MED', 'WAH', 'NCP', 'LOE', 'NEB', 'EAS', 'SWM', 'STP', 'CAD', 'TIB', 'SIB'];
const TROPICAL_ASIA: readonly EnvZone[] = ['SEA', 'SAS', 'EAS', 'SWM'];
const EVERYWHERE: readonly EnvZone[] = [...PALAEARCTIC_TEMPERATE, 'SEA', 'SAS', 'HDS', 'ARC', 'NAM', 'NEO', 'AND', 'AFR', 'AUS'];

export const ANIMAL_CATALOG: Readonly<Record<string, AnimalEntry>> = {
    // ── 陆地野生：欧亚通布 ──
    WOLF: { kind: 'wild', look: '灰狼', zones: ['WEU', 'CEU', 'MED', 'WAH', 'NCP', 'LOE', 'NEB', 'EAS', 'STP', 'CAD', 'TIB', 'SIB', 'SAS', 'NAM'] },
    FOX_RED: { kind: 'wild', look: '赤狐', zones: [...PALAEARCTIC_TEMPERATE, 'HDS', 'NAM'] },
    DEER: { kind: 'wild', look: '马鹿 / 梅花鹿 / 水鹿', zones: [...PALAEARCTIC_TEMPERATE, 'SAS', 'SEA', 'NAM', 'NEO'] },
    BOAR: { kind: 'wild', look: '野猪（林地与河谷芦苇丛，不进荒漠）', zones: ['WEU', 'CEU', 'MED', 'WAH', 'NCP', 'LOE', 'NEB', 'EAS', 'SWM', 'STP', 'SAS', 'SEA'] },
    BEAR: { kind: 'wild', look: '棕熊', zones: ['WEU', 'CEU', 'MED', 'WAH', 'NCP', 'NEB', 'STP', 'CAD', 'TIB', 'SIB', 'NAM'] },
    BEAR_BLACK: { kind: 'wild', look: '亚洲黑熊 / 美洲黑熊', zones: ['NCP', 'NEB', 'EAS', 'SWM', 'SAS', 'SEA', 'NAM'] },
    HARE_BROWN: { kind: 'wild', look: '草兔 / 欧洲野兔', zones: [...PALAEARCTIC_TEMPERATE] },
    HARE_GREY: { kind: 'wild', look: '灰褐色干旱区野兔', zones: ['HDS', 'CAD', 'WAH', 'STP', 'SAS', 'TIB', 'NAM', 'AND', 'AFR'] },
    LYNX: { kind: 'wild', look: '猞猁（温带—寒带山林，不到亚热带）', zones: ['WEU', 'CEU', 'MED', 'WAH', 'NCP', 'LOE', 'NEB', 'CAD', 'TIB', 'SIB', 'NAM'] },
    ELK: { kind: 'wild', look: '驼鹿（掌状角，北方林地）', zones: ['CEU', 'WEU', 'NEB', 'SIB', 'NAM'], strays: [{ zones: ['STP'], minLat: 50 }] },   // 哈萨克北部森林草原
    // ── 冬毛样子：北方冬季也看得到 ──
    WOLF_ARCTIC: { kind: 'wild', look: '白色冬毛的狼', zones: ['ARC', 'SIB'], winterZones: ['NEB', 'CEU', 'STP'] },
    HARE_ARCTIC: { kind: 'wild', look: '冬季换白毛的雪兔', zones: ['ARC', 'SIB'], winterZones: ['NEB', 'CEU', 'WEU', 'STP'] },
    FOX_ARCTIC: { kind: 'wild', look: '北极狐', zones: ['ARC', 'SIB'], strays: [{ zones: ['CEU', 'WEU', 'NEB'], winterOnly: true, minLat: 59 }] },   // 斯堪的纳维亚山地
    // ── 北极海岸（北纬 64° 起，含白海南岸，基日岛以北可见）──
    BEAR_POLAR: { kind: 'wild', look: '北极熊', zones: ['ARC'], habitat: 'coast', strays: [{ zones: ['CEU', 'WEU', 'SIB'], winterOnly: true, minLat: 61 }] },   // 主人定 B：冬季海冰期南下
    WALRUS: { kind: 'wild', look: '海象（史上白海、挪威北岸都有）', zones: ['ARC'], habitat: 'coast', strays: [{ zones: ['CEU', 'WEU', 'SIB'], winterOnly: true, minLat: 61 }] },
    SEAL: { kind: 'wild', look: '海豹（北海、波罗的海、地中海僧海豹、里海海豹、渤海斑海豹、开普毛皮海狮）', zones: ['ARC', 'WEU', 'CEU', 'MED', 'STP', 'CAD', 'NCP', 'NEB', 'SIB', 'AND', 'AFR', 'NAM'], habitat: 'coast' },
    // ── 山地与干旱 ──
    IBEX: { kind: 'wild', look: '北山羊 / 努比亚羱羊', zones: ['MED', 'WAH', 'HDS', 'CAD', 'TIB'] },
    MOUFLON: { kind: 'wild', look: '盘羊 / 东方盘羊', zones: ['MED', 'WAH', 'CAD'] },
    ARGALI: { kind: 'wild', look: '大头盘羊', zones: ['TIB', 'CAD', 'STP'] },
    SNOWLEOPARD: { kind: 'wild', look: '雪豹', zones: ['TIB', 'CAD'], strays: [{ zones: ['SWM', 'STP'] }] },   // 横断山、阿尔泰山
    GAZELLE: { kind: 'wild', look: '瞪羚 / 鹅喉羚 / 黄羊 / 藏原羚', zones: ['HDS', 'WAH', 'CAD', 'STP', 'TIB', 'SAS', 'AFR'] },
    WOLF_ARABIAN: { kind: 'wild', look: '阿拉伯狼', zones: ['HDS', 'WAH'] },
    HORSE: { kind: 'wild', look: '无鞍马：野生只在草原（普氏野马 / 欧洲野马），同一素材兼作家马', zones: ['STP', 'CAD'], alsoDomestic: true },
    OSTRICH: { kind: 'wild', look: '鸵鸟（含已灭绝的阿拉伯鸵鸟）', zones: ['HDS', 'AFR'], strays: [{ zones: ['WAH'] }] },   // 叙利亚沙漠
    // ── 热带与亚热带 ──
    TIGER: { kind: 'wild', look: '虎（含东北虎、里海虎）', zones: ['SEA', 'SAS', 'EAS', 'SWM', 'NCP', 'LOE', 'NEB', 'CAD', 'WAH'], excludeIslands: ['JAPAN', 'TAIWAN', 'SRI_LANKA'] },
    LION: { kind: 'wild', look: '狮（含亚洲狮、巴巴里狮）', zones: ['AFR', 'HDS', 'WAH', 'SAS'] },
    BLACK_PANTHER: { kind: 'wild', look: '黑豹', zones: [...TROPICAL_ASIA, 'AFR'] },
    ELEPHANT: { kind: 'wild', look: '象（含岭南亚洲象）', zones: [...TROPICAL_ASIA, 'AFR'] },
    RHINO: { kind: 'wild', look: '犀', zones: [...TROPICAL_ASIA, 'AFR'] },
    MONKEY: { kind: 'wild', look: '猕猴 / 狒狒类', zones: [...TROPICAL_ASIA, 'NCP', 'AFR', 'NEO'] },
    PEACOCK: { kind: 'wild', look: '孔雀（蓝孔雀 / 绿孔雀）', zones: TROPICAL_ASIA },
    CROCODILE: { kind: 'wild', look: '鳄（尼罗鳄、沼泽鳄、湾鳄）', zones: [...TROPICAL_ASIA, 'HDS', 'AFR', 'NEO', 'AUS'] },
    KOMODO: { kind: 'wild', look: '巨蜥（泽巨蜥、荒漠巨蜥）', zones: [...TROPICAL_ASIA, 'HDS', 'CAD', 'AUS'] },
    SNAKE_GROUND: { kind: 'wild', look: '花纹地蛇', zones: ['WEU', 'CEU', 'MED', 'WAH', 'HDS', 'STP', 'CAD', 'NCP', 'LOE', 'EAS', 'SWM', 'SAS', 'SEA', 'AFR', 'NEO', 'NAM', 'AND', 'AUS'] },
    SNAKE_WATER: { kind: 'wild', look: '水蛇', zones: [...TROPICAL_ASIA, 'AFR', 'NEO'] },
    ZEBRA: { kind: 'wild', look: '斑马', zones: ['AFR'] },
    // ── 美洲 ──
    TAPIR: { kind: 'wild', look: '南美貘（深棕色）', zones: ['NEO'] },
    JAGUAR: { kind: 'wild', look: '美洲豹', zones: ['NEO'] },
    CAPYBARA: { kind: 'wild', look: '水豚', zones: ['NEO'] },
    CAIMAN: { kind: 'wild', look: '凯门鳄', zones: ['NEO'] },
    JAVELINA: { kind: 'wild', look: '西貒', zones: ['NEO', 'NAM'] },
    TURKEY: { kind: 'wild', look: '野火鸡', zones: ['NAM', 'NEO'] },
    GUANACO: { kind: 'wild', look: '原驼', zones: ['AND'] },
    RHEA: { kind: 'wild', look: '美洲鸵（大美洲鸵到巴西高原）', zones: ['AND', 'NEO'] },
    PENGUIN: { kind: 'wild', look: '企鹅（麦哲伦企鹅、非洲企鹅）', zones: ['AND', 'AFR'], habitat: 'coast' },

    // ── 飞鸟 ──
    FALCON: { kind: 'bird', look: '隼', zones: EVERYWHERE },
    HAWK: { kind: 'bird', look: '鹰', zones: EVERYWHERE },
    OWL: { kind: 'bird', look: '鸮', zones: EVERYWHERE },
    RAVEN: { kind: 'bird', look: '渡鸦', zones: ['WEU', 'CEU', 'MED', 'WAH', 'HDS', 'NCP', 'LOE', 'NEB', 'STP', 'CAD', 'TIB', 'SIB', 'ARC', 'NAM'] },
    CRANE: { kind: 'bird', look: '鹤', zones: ['WEU', 'CEU', 'NCP', 'LOE', 'NEB', 'EAS', 'STP', 'TIB', 'SAS', 'SEA', 'SIB', 'NAM', 'AFR'] },
    STORK: { kind: 'bird', look: '鹳', zones: ['WEU', 'CEU', 'MED', 'WAH', 'HDS', 'NCP', 'EAS', 'STP', 'SAS', 'AFR'] },
    FLAMINGO: { kind: 'bird', look: '火烈鸟', zones: ['MED', 'HDS', 'WAH', 'CAD', 'SAS', 'AFR', 'AND'], strays: [{ zones: ['STP'] }] },   // 哈萨克草原湖泊
    VULTURE: { kind: 'bird', look: '秃鹫', zones: ['MED', 'HDS', 'WAH', 'CAD', 'STP', 'TIB', 'SWM', 'SAS', 'AFR', 'NAM', 'NEO', 'AND'] },
    PHEASANT: { kind: 'bird', look: '雉鸡（罗马时代起引入欧洲）', zones: ['EAS', 'NCP', 'LOE', 'NEB', 'SWM', 'STP', 'CAD', 'WAH', 'WEU', 'CEU', 'MED'] },
    CONDOR: { kind: 'bird', look: '神鹫（安第斯神鹫北到哥伦比亚）', zones: ['AND', 'NAM', 'NEO'] },
    MACAW: { kind: 'bird', look: '金刚鹦鹉', zones: ['NEO'] },

    // ── 家畜（民生层按文化放；这里只限明显有地域的）──
    CAMEL: { kind: 'livestock', look: '单峰驼', zones: ['HDS', 'WAH', 'SAS', 'CAD', 'AFR'] },
    DROMEDARY: { kind: 'livestock', look: '双峰驼', zones: ['CAD', 'STP', 'TIB', 'LOE', 'NCP', 'WAH'] },
    LLAMA: { kind: 'livestock', look: '美洲驼', zones: ['AND', 'NEO'] },
    ALPACA: { kind: 'livestock', look: '羊驼', zones: ['AND', 'NEO'] },
    BUFFALO: { kind: 'livestock', look: '水牛', zones: [...TROPICAL_ASIA, 'HDS', 'WAH', 'MED'] },
    DONKEY: { kind: 'livestock', look: '驮筐家驴' },
    WAR_DOG: { kind: 'livestock', look: '家养獒犬' },
    CHICKEN: { kind: 'livestock', look: '鸡' },
    GOOSE: { kind: 'livestock', look: '鹅' },
    PIG: { kind: 'livestock', look: '家猪' },
    SHEEP: { kind: 'livestock', look: '绵羊' },
    GOAT: { kind: 'livestock', look: '山羊' },
    COW_BROWN: { kind: 'livestock', look: '黄牛' },
    COW_BW: { kind: 'livestock', look: '花斑牛' },
    COW_BLACK: { kind: 'livestock', look: '黑牛（高原兼作牦牛）' },

    // ── 传说 ──
    NESSIE: { kind: 'legend', look: '水怪（海洋层按主人旧定放）' },
};

/** 该物种在此处的权重：常住 RESIDENT_WEIGHT、偶见 STRAY_WEIGHT、不出现 0 */
function weightAt(entry: AnimalEntry, zone: EnvZone, lat: number, winter: boolean): number {
    if (!entry.zones) return RESIDENT_WEIGHT;
    if (entry.zones.includes(zone) || (winter && entry.winterZones?.includes(zone))) return RESIDENT_WEIGHT;
    for (const st of entry.strays ?? []) {
        if (st.zones.includes(zone) && (!st.winterOnly || winter) && (st.minLat === undefined || lat >= st.minLat)) return STRAY_WEIGHT;
    }
    return 0;
}

/**
 * 某物种能否出现在该坐标。winter = 冬季（战略层 season 3）；不知道季节时按非冬季。
 * habitat 'coast' 由调用方再判（需要海陆数据）。
 */
export function animalAllowedAt(species: string, lat: number, lng: number, winter = false): boolean {
    const entry = ANIMAL_CATALOG[species];
    if (!entry || entry.alsoDomestic) return true;
    if (weightAt(entry, envZoneAt(lat, lng), lat, winter) === 0) return false;
    const island = entry.excludeIslands ? envIslandAt(lat, lng) : null;
    return !(island && entry.excludeIslands!.includes(island));
}

export function animalNeedsCoast(species: string): boolean {
    return ANIMAL_CATALOG[species]?.habitat === 'coast';
}

const poolCache = new Map<string, { land: string[]; birds: string[] }>();
const WILD = Object.entries(ANIMAL_CATALOG).filter(([, e]) => e.kind === 'wild').map(([k]) => k);
const BIRDS = Object.entries(ANIMAL_CATALOG).filter(([, e]) => e.kind === 'bird').map(([k]) => k);

/**
 * 该坐标的野生动物池（陆地＋飞鸟），战略野生动物层用。
 * 按权重重复展开：常住物种出现 4 次、偶见 1 次，调用方均匀抽取即得「偶见少见」。
 */
export function wildPoolAt(lat: number, lng: number, winter = false): { land: string[]; birds: string[] } {
    const zone = envZoneAt(lat, lng);
    const island = envIslandAt(lat, lng);
    const latBand = Math.floor(lat);
    const key = `${zone}|${island ?? ''}|${winter ? 1 : 0}|${latBand}`;
    let pool = poolCache.get(key);
    if (!pool) {
        const expand = (list: string[]) => list.flatMap((sp) => {
            const e = ANIMAL_CATALOG[sp];
            if (island && e.excludeIslands?.includes(island)) return [];
            return Array<string>(weightAt(e, zone, latBand, winter)).fill(sp);
        });
        pool = { land: expand(WILD), birds: expand(BIRDS) };
        poolCache.set(key, pool);
    }
    return pool;
}
