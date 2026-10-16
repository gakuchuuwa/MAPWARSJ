import { TAC_MAP_HALF_W, TAC_MAP_HALF_H } from './Scene13GroundLayerGL';
import type { AnimalAction, AnimalDe, AnimalKind, TacticalAnimal, WarMan } from './Scene13Types';

/** DE 素材实际有的动作（本机 public/SUCAI_ANIMAL/<物种>/_meta.json 实测）。
 *  🔴 缺的动作一律不许请求：请求了就是 404 → 那只动物整只不画（2026-10-13 核出来的消失病根）。 */
export const ANIMAL_ACTS = {
    /** 只有 idle/walk：家畜、野马、野羊驼、野鸡 */
    graze: ['idle', 'walk'],
    /** idle/walk/run：鹿、瞪羚、野兔等胆小猎物 */
    flee: ['idle', 'walk', 'run'],
    /** 只有 idle：盘羊（素材缺 walk/run） */
    still: ['idle'],
    /** idle/walk/run/attack：狼熊狮虎豹、野猪、狐 */
    beast: ['idle', 'walk', 'run', 'attack'],
    /** idle/walk/attack：鳄、凯门鳄、科莫多、蛇、猴（素材无 run） */
    beastSlow: ['idle', 'walk', 'attack'],
    /** 飞鸟：hover/fly 各 16 向 */
    bird: ['hover', 'fly'],
} as const satisfies Record<string, readonly AnimalAction[]>;

/**
 * 战术地图动物数据表（全面提速修复：符合野生动物真实生理机能与战场节奏）
 * 列 = 物种 / 类别 / 走速(px/s) / 跑速(px/s) / 血量 / 近战攻击 / 视野(格) / 动作
 */
export const ANIMAL_DE_TABLE: ReadonlyArray<readonly [string, AnimalKind, number, number, number, number, number, readonly AnimalAction[]]> = [
    // ── 胆小猎物（飞速狂奔逃窜，80~105 px/s，明显快于重骑兵 60 px/s）──
    ['GAZELLE', 'prey', 35, 105, 5, 0, 3, ANIMAL_ACTS.flee],       // 瞪羚（时速80km草原飞毛腿）
    ['HORSE', 'prey', 35, 95, 5, 0, 3, ANIMAL_ACTS.graze],         // 野马（无负重疾驰狂奔）
    ['DEER', 'prey', 32, 90, 5, 0, 3, ANIMAL_ACTS.flee],          // 鹿（飞跃大步狂奔）
    ['OSTRICH', 'prey', 35, 95, 5, 0, 3, ANIMAL_ACTS.flee],        // 鸵鸟（双足疾驰）
    ['RHEA', 'prey', 32, 85, 5, 0, 3, ANIMAL_ACTS.flee],           // 美洲鸵
    ['IBEX', 'prey', 30, 80, 5, 0, 3, ANIMAL_ACTS.flee],           // 北山羊（岩壁跳跃奔逃）
    ['MOUFLON', 'prey', 30, 75, 5, 0, 3, ANIMAL_ACTS.flee],        // 欧洲盘羊
    ['ARGALI', 'prey', 30, 75, 5, 0, 3, ANIMAL_ACTS.still],        // 盘羊
    ['ALPACA', 'prey', 28, 70, 5, 0, 3, ANIMAL_ACTS.graze],        // 野羊驼
    ['MONKEY', 'prey', 30, 65, 5, 0, 3, ANIMAL_ACTS.beastSlow],    // 猴子
    ['HARE_BROWN', 'prey', 25, 85, 3, 0, 3, ANIMAL_ACTS.flee],    // 棕野兔（如离弦之箭般飞窜）
    ['HARE_GREY', 'prey', 25, 85, 3, 0, 3, ANIMAL_ACTS.flee],     // 灰兔
    ['HARE_ARCTIC', 'prey', 25, 85, 3, 0, 3, ANIMAL_ACTS.flee],   // 北极兔
    ['FOX_RED', 'prey', 30, 80, 3, 0, 3, ANIMAL_ACTS.beast],       // 赤狐（机敏疾奔窜逃）
    ['FOX_ARCTIC', 'prey', 30, 80, 3, 0, 3, ANIMAL_ACTS.beast],    // 北极狐
    ['TURKEY', 'prey', 20, 50, 3, 0, 2, ANIMAL_ACTS.graze],        // 野鸡

    // ── 危险猎物（受惊冲刺脱离，65~75 px/s）──
    ['BOAR', 'danger', 32, 75, 75, 7, 4, ANIMAL_ACTS.beast],       // 野猪（凶猛冲撞脱离）
    ['BEAR', 'danger', 30, 75, 75, 7, 5, ANIMAL_ACTS.beast],       // 棕熊（凶猛厚重冲刺脱离）
    ['BEAR_BLACK', 'danger', 30, 75, 75, 7, 5, ANIMAL_ACTS.beast], // 黑熊
    ['BEAR_POLAR', 'danger', 30, 75, 80, 8, 5, ANIMAL_ACTS.beast], // 北极熊
    ['RHINO', 'danger', 30, 70, 75, 7, 4, ANIMAL_ACTS.beast],      // 犀牛（厚重冲刺）
    ['ELEPHANT', 'danger', 30, 65, 75, 7, 4, ANIMAL_ACTS.beast],   // 大象（践踏狂奔）
    ['TAPIR', 'danger', 28, 65, 75, 7, 4, ANIMAL_ACTS.beast],      // 貘

    // ── 猛兽（极速扑杀与追击，80~95 px/s，飞扑爆发力）──
    ['BLACK_PANTHER', 'predator', 35, 95, 25, 3, 12, ANIMAL_ACTS.beast], // 黑豹（爆发力之王）
    ['JAGUAR', 'predator', 35, 95, 25, 3, 12, ANIMAL_ACTS.beast],        // 美洲豹
    ['SNOWLEOPARD', 'predator', 35, 95, 25, 3, 12, ANIMAL_ACTS.beast],   // 雪豹
    ['LION', 'predator', 35, 90, 25, 3, 12, ANIMAL_ACTS.beast],          // 狮子（飞扑冲刺）
    ['TIGER', 'predator', 35, 90, 25, 3, 12, ANIMAL_ACTS.beast],         // 老虎
    ['WOLF', 'predator', 32, 85, 25, 3, 12, ANIMAL_ACTS.beast],          // 狼（迅猛扑杀）
    ['WOLF_ARABIAN', 'predator', 32, 85, 25, 3, 12, ANIMAL_ACTS.beast],  // 阿拉伯狼
    ['WOLF_ARCTIC', 'predator', 32, 85, 25, 3, 12, ANIMAL_ACTS.beast],   // 北极狼
    ['CROCODILE', 'predator', 24, 55, 25, 3, 12, ANIMAL_ACTS.beastSlow], // 鳄鱼（短程扑咬）
    ['CAIMAN', 'predator', 24, 55, 20, 2, 12, ANIMAL_ACTS.beastSlow],    // 凯门鳄
    ['KOMODO', 'predator', 26, 58, 25, 3, 12, ANIMAL_ACTS.beastSlow],    // 科莫多巨蜥
    ['SNAKE_GROUND', 'predator', 24, 50, 25, 3, 12, ANIMAL_ACTS.beastSlow], // 地蟒

    // ── 家畜（受惊小跑脱离人群，45~65 px/s）──
    ['CAMEL', 'livestock', 35, 65, 50, 0, 4, ANIMAL_ACTS.graze],     // 骆驼
    ['DROMEDARY', 'livestock', 35, 65, 50, 0, 4, ANIMAL_ACTS.graze], // 单峰驼
    ['COW_BROWN', 'livestock', 26, 50, 14, 0, 3, ANIMAL_ACTS.graze], // 黄牛
    ['COW_BLACK', 'livestock', 26, 50, 14, 0, 3, ANIMAL_ACTS.graze], // 黑牛
    ['COW_BW', 'livestock', 26, 50, 14, 0, 3, ANIMAL_ACTS.graze],    // 花斑牛
    ['SHEEP', 'livestock', 25, 48, 7, 0, 3, ANIMAL_ACTS.graze],      // 绵羊
    ['GOAT', 'livestock', 25, 48, 7, 0, 3, ANIMAL_ACTS.graze],       // 山羊
    ['PIG', 'livestock', 25, 48, 7, 0, 3, ANIMAL_ACTS.graze],        // 猪
    ['LLAMA', 'livestock', 25, 50, 7, 0, 3, ANIMAL_ACTS.graze],      // 羊驼
    ['CAPYBARA', 'livestock', 24, 45, 7, 0, 3, ANIMAL_ACTS.graze],   // 水豚
    ['GOOSE', 'livestock', 20, 42, 7, 0, 3, ANIMAL_ACTS.graze],      // 鹅
    ['CHICKEN', 'livestock', 20, 42, 5, 0, 3, ANIMAL_ACTS.graze],    // 鸡

    // ── 飞鸟（空中巡航）──
    ['FALCON', 'bird', 53, 53, 1, 0, 7, ANIMAL_ACTS.bird],
    ['HAWK', 'bird', 53, 53, 1, 0, 7, ANIMAL_ACTS.bird],
    ['OWL', 'bird', 53, 53, 1, 0, 7, ANIMAL_ACTS.bird],
    ['STORK', 'bird', 53, 53, 1, 0, 7, ANIMAL_ACTS.bird],
    ['CRANE', 'bird', 53, 53, 1, 0, 7, ANIMAL_ACTS.bird],
    ['VULTURE', 'bird', 53, 53, 1, 0, 7, ANIMAL_ACTS.bird],
    ['FLAMINGO', 'bird', 53, 53, 1, 0, 7, ANIMAL_ACTS.bird],
    ['CONDOR', 'bird', 53, 53, 1, 0, 7, ANIMAL_ACTS.bird],
    ['MACAW', 'bird', 53, 53, 1, 0, 7, ANIMAL_ACTS.bird],
];

/** 表展开成查表 */
export const ANIMAL_DE: Record<string, AnimalDe> = {};
for (const [sp, kind, walk, run, hp, atk, los, acts] of ANIMAL_DE_TABLE) {
    ANIMAL_DE[sp] = { kind, walk, run, los: los * 40, hp, atk, reload: 2.0, acts };
}

/**
 * 🔴 [2026-10-13 主人令「不要让日本出现老虎狮子」] 物种原产地（粗框，[latMin, latMax, lngMin, lngMax]）。
 * DE 地图的动物是一张通用图里摆好的，不看据点所在地；这里按战场中心经纬度剔掉**不属于当地**的物种。
 * 没列的物种（狼、熊、鹿、牛羊猪鸡鹅等）各地皆有，不限；缺经纬度也不限。
 */
export const ANIMAL_RANGE: Record<string, ReadonlyArray<readonly [number, number, number, number]>> = (() => {
    const AFR: [number, number, number, number] = [-35, 37, -20, 52];
    const SASIA: [number, number, number, number] = [5, 42, 25, 100];        // 西亚—南亚
    const AMER: [number, number, number, number] = [-56, 40, -120, -30];      // 中南美
    const LION: [number, number, number, number][] = [AFR, SASIA, [36, 45, 19, 30]];   // 非洲、西亚南亚、古希腊巴尔干
    const TIGER: [number, number, number, number][] = [[-8, 55, 45, 129.5], [41, 55, 129.5, 137]];
    const OLD_DRY: [number, number, number, number][] = [AFR, [10, 50, 25, 110]];
    return {
        LION, TIGER,
        WOLF_ARABIAN: [[12, 40, 30, 60]], BLACK_PANTHER: [AFR, [-8, 30, 60, 125]], SNOWLEOPARD: [[25, 50, 65, 110]],
        ELEPHANT: [AFR, [5, 30, 70, 110]], RHINO: [AFR, [5, 30, 70, 110]], OSTRICH: [AFR, [12, 40, 30, 60]],
        GAZELLE: OLD_DRY, MOUFLON: [[30, 45, -10, 50]], ARGALI: [[35, 55, 60, 120]], IBEX: [[28, 48, -10, 100]],
        CAMEL: OLD_DRY, DROMEDARY: OLD_DRY, MONKEY: [AFR, [-10, 35, 60, 128]],
        CROCODILE: [[-40, 28, -20, 150], [-35, 32, -20, 52]], CAIMAN: [AMER], KOMODO: [[-12, -7, 115, 125]],
        BEAR_POLAR: [[60, 90, -180, 180]], FOX_ARCTIC: [[52, 90, -180, 180]], HARE_ARCTIC: [[52, 90, -180, 180]],
        JAGUAR: [AMER], TAPIR: [AMER, [-8, 20, 95, 120]], CAPYBARA: [AMER], MACAW: [AMER], LLAMA: [AMER], ALPACA: [AMER],
        CONDOR: [AMER], RHEA: [AMER],
        SNAKE_GROUND: [[-40, 60, -180, 180]],
    };
})();

export function animalNativeAt(species: string, lat: number | undefined, lng: number | undefined, baseTerrain?: string): boolean {
    if (lat !== undefined && lng !== undefined) {
        // 日本四至矩形（冲绳至北海道）：自然界绝无野生老虎、狮子
        const isJapan = lat >= 24 && lat <= 46 && lng >= 122.5 && lng <= 146;
        if (isJapan && (species === 'TIGER' || species === 'LION')) return false;
    }
    if (baseTerrain) {
        // 极旱沙漠/戈壁/盐漠/高寒砾石与雪原：不出林栖野猪（BOAR）与火鸡（TURKEY）
        const isAridOrAlpine = baseTerrain === 'pal' || baseTerrain === 'des' || baseTerrain === 'ds5'
            || baseTerrain === 'qs' || baseTerrain === 'pal1' || baseTerrain === 'gravel_default'
            || baseTerrain === 'sno' || baseTerrain === 'sn2' || baseTerrain === 'snd';
        if (isAridOrAlpine && (species === 'BOAR' || species === 'TURKEY')) return false;
    }
    const r = ANIMAL_RANGE[species];
    if (!r || lat === undefined || lng === undefined) return true;
    return r.some(([a, b, c, d]) => lat >= a && lat <= b && lng >= c && lng <= d);
}

/** 表里没有的物种（以后地图新增）按 DE 最常见的胆小猎物走，不许崩 */
export function animalDeOf(species: string): AnimalDe {
    return ANIMAL_DE[species] ?? { kind: 'prey', walk: 32, run: 90, los: 120, hp: 5, atk: 0, reload: 2.0, acts: ANIMAL_ACTS.flee };
}

/** 飞鸟 16 向朝向（与 DE 素材 hover/fly 的 16 向同一约定） */
export function birdDir(dx: number, dy: number): number {
    let a = Math.atan2(-dy, dx) * 180 / Math.PI;
    a = ((a % 360) + 360) % 360;
    return (18 - Math.floor(((a + 11.25) % 360) / 22.5)) % 16;
}

/**
 * 动物生态更新（2026-10-13 按 DE 数据驱动）：
 *  · 所有陆地动物见到人就朝锁定的反方向奔逃脱离，停下后原地吃草/小幅踱步；
 *  · 飞鸟：fly 巡航 ⇄ hover 展翅滑翔交替，空中持续移动不停滞。
 */
export function stepTacticalAnimals(
    list: TacticalAnimal[],
    men: WarMan[],
    worldCX: number,
    worldCY: number,
    dt: number,
    dir8: (dx: number, dy: number) => number,
    setAnimalAction: (an: TacticalAnimal, want: AnimalAction) => void,
): TacticalAnimal[] {
    if (!list.length) return list;
    const MARGIN = 120;
    const X0 = worldCX - TAC_MAP_HALF_W + MARGIN, X1 = worldCX + TAC_MAP_HALF_W - MARGIN;
    const Y0 = worldCY - TAC_MAP_HALF_H + MARGIN, Y1 = worldCY + TAC_MAP_HALF_H - MARGIN;
    const HOME_LEASH = 100;     // 家畜活动半径（2.5 格）
    const HOME_BACK = 120;      // 猎物活动半径（3 格，避免 30px 过小导致乒乓回头颤抖）
    const FLEE_SEC = 8.0;       // 单次逃跑：一口气跑 8 秒（跑得更远，一次脱离人群）
    const ANIMAL_FLEE_SPEED_MULT = 1.5;

    // 同类群重心：DE 的松散群聚（同伴在哪，闲逛就往那边偏一点）
    const centroids = new Map<string, { x: number; y: number; n: number }>();
    for (const a of list) {
        if (a.sprite.destroyed) continue;
        const c = centroids.get(a.species) ?? { x: 0, y: 0, n: 0 };
        c.x += a.x; c.y += a.y; c.n++;
        centroids.set(a.species, c);
    }

    for (const an of list) {
        if (an.sprite.destroyed) continue;
        const de = animalDeOf(an.species);

        // ── 飞鸟：fly 巡航 ⇄ hover 展翅滑翔（DE 两种动作交替，空间位置永不停顿）──
        if (de.kind === 'bird') {
            an.idleTimer -= dt;
            const dx = an.flyX - an.x, dy = an.flyY - an.y, d = Math.hypot(dx, dy) || 1;
            if (d < 20 || an.idleTimer <= 0) {
                an.hovering = !an.hovering;
                an.idleTimer = 3 + Math.random() * 4;
                const ang = Math.random() * Math.PI * 2, r = 600 + Math.random() * 1000;
                an.flyX = Math.min(X1, Math.max(X0, an.x + Math.cos(ang) * r));
                an.flyY = Math.min(Y1, Math.max(Y0, an.y + Math.sin(ang) * r));
            }
            const curDx = an.flyX - an.x, curDy = an.flyY - an.y, curD = Math.hypot(curDx, curDy) || 1;
            an.x += (curDx / curD) * de.walk * dt;
            an.y += (curDy / curD) * de.walk * dt;
            an.dir = birdDir(curDx, curDy);
            an.sprite.x = an.x;
            an.sprite.y = an.y;
            setAnimalAction(an, an.hovering ? 'hover' : 'fly');
            continue;
        }

        // ── 地面生灵：找最近的活人士兵 ──
        let near: WarMan | null = null;
        let nearD = Infinity;
        for (const m of men) {
            if (m.hp <= 0) continue;
            const d = Math.hypot(m.x - an.x, m.y - an.y);
            if (d < nearD) { nearD = d; near = m; }
        }

        const canMove = de.acts.includes('walk');
        let mx = 0, my = 0, spd = 0, fleeing = false;
        let want: AnimalAction = 'idle';

        if (an.fleeTimer > 0 && canMove) {
            // ① 正在逃跑中：保持锁定的既定速度与朝向闭眼跑完，绝不被周围其他士兵拉扯方向
            fleeing = true;
            want = Math.hypot(an.vx, an.vy) > de.walk * 1.2 ? 'run' : 'walk';
        } else if (canMove && near && nearD < Math.max(de.los, 220)) {
            // ② 未在逃跑时受惊：单次触发逃跑，锁定朝向与时长（按 de.run × 倍率高速奔跑脱离）
            an.fleeTimer = FLEE_SEC;
            const fleeSpd = de.run * ANIMAL_FLEE_SPEED_MULT;
            const dx = an.x - near.x, dy = an.y - near.y, d = Math.hypot(dx, dy) || 1;
            an.vx = (dx / d) * fleeSpd;
            an.vy = (dy / d) * fleeSpd;
            an.fleeDX = dx / d;
            an.fleeDY = dy / d;
            an.dir = dir8(an.vx, an.vy);
            fleeing = true;
            want = fleeSpd > de.walk * 1.2 ? 'run' : 'walk';
        }

        if (fleeing) {
            an.fleeTimer -= dt;
            const fd = Math.hypot(an.fleeDX, an.fleeDY) || 1;
            const spd0 = Math.hypot(an.vx, an.vy) || de.run;
            an.x += (an.fleeDX / fd) * spd0 * dt;
            an.y += (an.fleeDY / fd) * spd0 * dt;
            if (de.kind === 'prey' || de.kind === 'danger' || de.kind === 'livestock') { an.homeX = an.x; an.homeY = an.y; }
            an.dir = dir8(an.fleeDX, an.fleeDY);
            if (an.fleeTimer <= 0) {
                an.wanderX = an.x;
                an.wanderY = an.y;
                an.idleTimer = 4 + Math.random() * 6;
            }
        } else if (canMove) {
            const distHome = Math.hypot(an.x - an.homeX, an.y - an.homeY);
            if (distHome > (de.kind === 'livestock' ? HOME_LEASH : HOME_BACK)) {
                mx = an.homeX - an.x;
                my = an.homeY - an.y;
                spd = de.walk;
                want = 'walk';
            } else {
                an.idleTimer -= dt;
                const wx = an.wanderX - an.x, wy = an.wanderY - an.y;
                const wd = Math.hypot(wx, wy);
                if (wd < 6) {
                    if (an.idleTimer <= 0) {
                        const c = centroids.get(an.species);
                        const cx = c && c.n > 1 ? c.x / c.n : an.homeX;
                        const cy = c && c.n > 1 ? c.y / c.n : an.homeY;
                        const ang = Math.random() * Math.PI * 2, r = 20 + Math.random() * 50;
                        const leash = (de.kind === 'livestock' ? HOME_LEASH : HOME_BACK) * 0.8;
                        let ox = Math.cos(ang) * r * 0.6 + (cx - an.homeX) * 0.4, oy = Math.sin(ang) * r * 0.6 + (cy - an.homeY) * 0.4;
                        const ol = Math.hypot(ox, oy);
                        if (ol > leash) { ox *= leash / ol; oy *= leash / ol; }
                        an.wanderX = Math.max(X0, Math.min(X1, an.homeX + ox));
                        an.wanderY = Math.max(Y0, Math.min(Y1, an.homeY + oy));
                        an.idleTimer = 2.0 + Math.random() * 2.0;
                    }
                    want = 'idle';
                } else {
                    if (an.idleTimer <= 0) {
                        an.wanderX = an.x;
                        an.wanderY = an.y;
                        an.idleTimer = 4.0 + Math.random() * 6.0;
                        want = 'idle';
                    } else {
                        mx = wx;
                        my = wy;
                        spd = de.walk;
                        want = 'walk';
                    }
                }
            }
        } else {
            want = 'idle';
        }

        if (spd > 0 && canMove && (mx || my)) {
            const d = Math.hypot(mx, my) || 1;
            an.x += (mx / d) * spd * dt;
            an.y += (my / d) * spd * dt;
            an.dir = dir8(mx, my);
        }

        if (fleeing && de.kind === 'prey') {
            if (an.x <= X0 || an.x >= X1) { an.fleeDX = 0; an.fleeDY = an.fleeDY >= 0 ? 1 : -1; }
            else if (an.y <= Y0 || an.y >= Y1) { an.fleeDX = an.fleeDX >= 0 ? 1 : -1; an.fleeDY = 0; }
        }
        an.x = Math.max(X0, Math.min(X1, an.x));
        an.y = Math.max(Y0, Math.min(Y1, an.y));
        an.sprite.x = an.x;
        an.sprite.y = an.y;
        an.sprite.flip = false;
        setAnimalAction(an, want);
    }

    return list.some((a) => a.sprite.destroyed) ? list.filter((a) => !a.sprite.destroyed) : list;
}
