import { TAC_MAP_HALF_W, TAC_MAP_HALF_H } from './Scene13GroundLayerGL';
import { DE_TILE_PX } from './Scene13CombatMath';
import type { AnimalAction, AnimalDe, AnimalKind, TacticalAnimal, WarMan } from './Scene13Types';
import { animalAllowedAt } from '../../world/environment/animalCatalog';

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
    ['ZEBRA', 'prey', 35, 95, 5, 0, 3, ANIMAL_ACTS.flee],          // 斑马
    ['GUANACO', 'prey', 32, 85, 5, 0, 3, ANIMAL_ACTS.flee],        // 原驼
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
    ['NESSIE', 'prey', 22, 60, 50, 0, 6, ANIMAL_ACTS.flee],        // 尼斯湖水怪（DE a_nessie；水生，见人潜游远离）
    ['ELK', 'prey', 32, 90, 5, 0, 3, ANIMAL_ACTS.flee],            // 驼鹿/马鹿（DE a_hunt_elk，此前借用鹿）
    ['PHEASANT', 'prey', 20, 55, 3, 0, 2, ANIMAL_ACTS.flee],       // 雉鸡（DE a_hunt_pheasant，此前借用火鸡）
    ['SEAL', 'prey', 15, 30, 5, 0, 3, ANIMAL_ACTS.graze],          // 海豹（DE a_hunt_seal：只有 idle/walk）

    // ── 危险猎物（受惊冲刺脱离，65~75 px/s）──
    ['BOAR', 'danger', 32, 75, 75, 7, 4, ANIMAL_ACTS.beast],       // 野猪（凶猛冲撞脱离）
    ['JAVELINA', 'danger', 32, 75, 75, 7, 4, ANIMAL_ACTS.beast],   // 美洲西貒
    ['BEAR', 'danger', 30, 75, 75, 7, 5, ANIMAL_ACTS.beast],       // 棕熊（凶猛厚重冲刺脱离）
    ['BEAR_BLACK', 'danger', 30, 75, 75, 7, 5, ANIMAL_ACTS.beast], // 黑熊
    ['BEAR_POLAR', 'danger', 30, 75, 80, 8, 5, ANIMAL_ACTS.beast], // 北极熊
    ['RHINO', 'danger', 30, 70, 75, 7, 4, ANIMAL_ACTS.beast],      // 犀牛（厚重冲刺）
    ['ELEPHANT', 'danger', 30, 65, 75, 7, 4, ANIMAL_ACTS.beast],   // 大象（践踏狂奔）
    ['TAPIR', 'danger', 28, 65, 75, 7, 4, ANIMAL_ACTS.beast],      // 貘
    ['WALRUS', 'danger', 15, 30, 75, 6, 4, ANIMAL_ACTS.beastSlow], // 海象（DE a_hunt_walrus：idle/walk/attack）

    // ── 猛兽（极速扑杀与追击，80~95 px/s，飞扑爆发力）──
    ['BLACK_PANTHER', 'predator', 35, 95, 25, 3, 12, ANIMAL_ACTS.beast], // 黑豹（爆发力之王）
    ['JAGUAR', 'predator', 35, 95, 25, 3, 12, ANIMAL_ACTS.beast],        // 美洲豹
    ['SNOWLEOPARD', 'predator', 35, 95, 25, 3, 12, ANIMAL_ACTS.beast],   // 雪豹
    ['LION', 'predator', 35, 90, 25, 3, 12, ANIMAL_ACTS.beast],          // 狮子（飞扑冲刺）
    ['TIGER', 'predator', 35, 90, 25, 3, 12, ANIMAL_ACTS.beast],         // 老虎
    ['WOLF', 'predator', 32, 85, 25, 3, 12, ANIMAL_ACTS.beast],          // 狼（迅猛扑杀）
    ['WOLF_ARABIAN', 'predator', 32, 85, 25, 3, 12, ANIMAL_ACTS.beast],  // 阿拉伯狼
    ['WOLF_ARCTIC', 'predator', 32, 85, 25, 3, 12, ANIMAL_ACTS.beast],   // 北极狼
    ['LYNX', 'predator', 32, 85, 25, 3, 12, ANIMAL_ACTS.beast],          // 猞猁（DE a_pred_lynx）
    ['CROCODILE', 'predator', 24, 55, 25, 3, 12, ANIMAL_ACTS.beastSlow], // 鳄鱼（短程扑咬）
    ['CAIMAN', 'predator', 24, 55, 20, 2, 12, ANIMAL_ACTS.beastSlow],    // 凯门鳄
    ['KOMODO', 'predator', 26, 58, 25, 3, 12, ANIMAL_ACTS.beastSlow],    // 科莫多巨蜥
    ['SNAKE_GROUND', 'predator', 24, 50, 25, 3, 12, ANIMAL_ACTS.beastSlow], // 地蟒

    // ── 家畜（受惊小跑脱离人群，45~65 px/s）──
    ['CAMEL', 'livestock', 35, 65, 50, 0, 4, ANIMAL_ACTS.graze],     // 单峰驼（素材样子；文件夹名与样子相反）
    ['DROMEDARY', 'livestock', 35, 65, 50, 0, 4, ANIMAL_ACTS.graze], // 双峰驼（素材样子）
    ['BUFFALO', 'livestock', 26, 50, 30, 0, 3, ANIMAL_ACTS.graze],   // 水牛
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
    ['RAVEN', 'bird', 53, 53, 1, 0, 7, ANIMAL_ACTS.bird],          // 渡鸦（DE a_bird_raven，此前借用游隼）
];

/** 表展开成查表 */
export const ANIMAL_DE: Record<string, AnimalDe> = {};
for (const [sp, kind, walk, run, hp, atk, los, acts] of ANIMAL_DE_TABLE) {
    ANIMAL_DE[sp] = { kind, walk, run, los: los * DE_TILE_PX, hp, atk, reload: 2.0, acts };
}

/**
 * DE 地图的动物是一张通用图里摆好的，不看据点所在地；这里按战场中心经纬度剔掉**不属于当地**的物种。
 * 🔴 2026-10-31 主人令「按专业的游戏设计管理」：出现地统一查 src/world/environment/animalCatalog.ts，
 *    与战略野生动物层同一张表（原 ANIMAL_RANGE 坐标框与日本框已删，日本无虎狮等例外在总表 excludeIslands 里）。
 * 缺经纬度不限。
 */
export function animalNativeAt(species: string, lat: number | undefined, lng: number | undefined, baseTerrain?: string, winter = false): boolean {
    if (baseTerrain) {
        // 极旱沙漠/戈壁/盐漠/高寒砾石与雪原：不出林栖野猪（BOAR）与火鸡（TURKEY）
        const isAridOrAlpine = baseTerrain === 'pal' || baseTerrain === 'des' || baseTerrain === 'ds5'
            || baseTerrain === 'qs' || baseTerrain === 'pal1' || baseTerrain === 'gravel_default'
            || baseTerrain === 'sno' || baseTerrain === 'sn2' || baseTerrain === 'snd';
        if (isAridOrAlpine && (species === 'BOAR' || species === 'TURKEY')) return false;
    }
    if (lat === undefined || lng === undefined) return true;
    return animalAllowedAt(species, lat, lng, winter);
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

/** 鸟群队形允许的偏差（px）：超过这点就直回自己的队形位（并略微提速追赶），防越飞越散 */
const BIRD_FORMATION_TOLERANCE_PX = 26;
/** 掉队群员的追赶倍速（头鸟 53 px/s，追队时略快一点，回队后自动落回同速） */
const BIRD_CATCHUP_SPEED_MULT = 1.6;

/**
 * 动物生态更新（2026-10-13 按 DE 数据驱动）：
 *  · 所有陆地动物见到人就朝锁定的反方向奔逃脱离，停下后原地吃草/小幅踱步；
 *  · 飞鸟：fly 巡航 ⇄ hover 展翅滑翔交替，空中持续移动不停滞。
 *  · 🔴 [2026-10-31 主人令「战术模式中的鸟不成群，请和战略地图动物成群保持一致」]
 *    飞鸟成群：同 flockId 的一群由头鸟选航点、切振翅/滑翔，群员按队形偏移跟着飞（与战略动物层同一套）。
 */
export function stepTacticalAnimals(
    list: TacticalAnimal[],
    men: WarMan[],
    worldCX: number,
    worldCY: number,
    dt: number,
    dir8: (dx: number, dy: number) => number,
    setAnimalAction: (an: TacticalAnimal, want: AnimalAction) => void,
    /** 天然水域判定（不含护城河）：水生动物（aquatic）每步都必须落在这里 */
    isNaturalWater?: (x: number, y: number) => boolean,
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

    // 鸟群头鸟：同 flockId 的第一只带队（群由生成端一次摆好，头鸟在前）
    const flockLeaders = new Map<number, TacticalAnimal>();
    for (const a of list) {
        if (a.sprite.destroyed || a.flockId === undefined) continue;
        if (!flockLeaders.has(a.flockId)) flockLeaders.set(a.flockId, a);
    }

    for (const an of list) {
        if (an.sprite.destroyed) continue;
        const de = animalDeOf(an.species);

        // ── 飞鸟：fly 巡航 ⇄ hover 展翅滑翔（DE 两种动作交替，空间位置永不停顿）──
        if (de.kind === 'bird') {
            const leader = an.flockId !== undefined ? flockLeaders.get(an.flockId) : undefined;
            if (leader && leader !== an && !leader.sprite.destroyed) {
                // 群员：头鸟怎么飞就怎么飞 —— 目标＝头鸟航点同向平移队形偏移，振翅/滑翔与头鸟同步；
                // 掉队（被边界夹住等）先直回自己的队形位，绝不自找航点飞散。
                const offX = an.flockDX ?? 0, offY = an.flockDY ?? 0;
                an.hovering = leader.hovering;
                an.flyX = leader.flyX + offX;
                an.flyY = leader.flyY + offY;
                let tx = an.flyX, ty = an.flyY;
                const slotX = leader.x + offX, slotY = leader.y + offY;
                const slotErr = Math.hypot(an.x - slotX, an.y - slotY);
                let spd = de.walk;
                if (slotErr > BIRD_FORMATION_TOLERANCE_PX) {
                    tx = slotX;
                    ty = slotY;
                    spd = de.walk * BIRD_CATCHUP_SPEED_MULT;   // 掉队的先追回队形位，别越飞越散
                }
                const dx = tx - an.x, dy = ty - an.y, d = Math.hypot(dx, dy) || 1;
                an.x += (dx / d) * spd * dt;
                an.y += (dy / d) * spd * dt;
                an.dir = birdDir(dx, dy);
                an.sprite.x = an.x;
                an.sprite.y = an.y;
                setAnimalAction(an, an.hovering ? 'hover' : 'fly');
                continue;
            }
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
        const prevX = an.x, prevY = an.y;
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
            an.homeX = an.x;
            an.homeY = an.y;
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
                an.wanderX = an.homeX;
                an.wanderY = an.homeY;
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

        if (fleeing && !an.aquatic) {
            if (an.x <= X0 || an.x >= X1) { an.fleeDX = 0; an.fleeDY = an.fleeDY >= 0 ? 1 : -1; }
            else if (an.y <= Y0 || an.y >= Y1) { an.fleeDX = an.fleeDX >= 0 ? 1 : -1; an.fleeDY = 0; }
        }
        an.x = Math.max(X0, Math.min(X1, an.x));
        an.y = Math.max(Y0, Math.min(Y1, an.y));
        // 水生动物：下一步出了天然水域（上岸 / 进护城河）就退回原位，逃跑时改朝最近一个仍是水面的方向
        if (an.aquatic && isNaturalWater && !isNaturalWater(an.x, an.y)) {
            an.x = prevX;
            an.y = prevY;
            if (fleeing) {
                const base = Math.atan2(an.fleeDY, an.fleeDX);
                const tries = [0.5, -0.5, 1.0, -1.0, 1.6, -1.6, 2.2, -2.2, Math.PI];
                for (const t of tries) {
                    const a = base + t;
                    const nx = Math.cos(a), ny = Math.sin(a);
                    if (isNaturalWater(an.x + nx * 60, an.y + ny * 60)) {
                        an.fleeDX = nx; an.fleeDY = ny;
                        an.dir = dir8(nx, ny);
                        break;
                    }
                }
            } else {
                an.wanderX = an.x;
                an.wanderY = an.y;
                an.idleTimer = 2 + Math.random() * 3;
                want = 'idle';
            }
        }
        an.sprite.x = an.x;
        an.sprite.y = an.y;
        an.sprite.flip = false;
        setAnimalAction(an, want);
    }

    return list.some((a) => a.sprite.destroyed) ? list.filter((a) => !a.sprite.destroyed) : list;
}
