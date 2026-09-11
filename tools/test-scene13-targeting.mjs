import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// 运行真实方法，隔离画布、音频和素材加载；不复制搜索算法。
const source = readFileSync(new URL('../src/ui/Scene13WarLayer.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('Scene13WarLayer.ts', source, ts.ScriptTarget.Latest, true);
const constants = new Map();
const methods = new Map();
function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
        constants.set(node.name.text, node.getText(ast));
    }
    if (ts.isMethodDeclaration(node)) methods.set(node.name.getText(ast), node.getText(ast));
    ts.forEachChild(node, visit);
}
visit(ast);
const names = ['CELL_M', 'CELL_R', 'HKEY', 'GANG_CAP', 'SPREAD_CAP', 'MARCH_R', 'MIN_RANGE_TYPES', 'KEEP_TARGET_HP'];
const selectedMethods = ['search', 'aimAt', 'canKeepTarget',
    'reserveExistingTargets', 'releaseReservedTarget', 'waitAtRangeEdge', 'splash', 'recentAttacker'];
const printer = ts.createPrinter({ removeComments: true });
const stepAst = ts.createSourceFile('step.ts', `class P { ${methods.get('step')} }`, ts.ScriptTarget.Latest, true);
const step = printer.printFile(stepAst);
const lockStep = step.slice(step.indexOf('const previousTarget ='), step.indexOf('if (m.march && m.foe)'));
const fightSection = step.slice(step.indexOf('m.fightT = (m.fightT || 0) + dt;'), step.indexOf('if (m.march && !inReach'));
const fightStep = fightSection.slice(0, fightSection.lastIndexOf('}'));
const code = names.map(name => `const ${constants.get(name)};`).join('\n')
    + '\nconst dmgVs = () => 10, gangMul = () => 1, HERO_DAMAGE_TAKEN = 1;'
    + `\nclass Probe { ${selectedMethods.map(name => methods.get(name)).join('\n')}
        lockTarget(m, SIGHT, REACH = 65) { ${lockStep} }
        tickFight(m, dt) { const foe = m.foe; for (let i = 0; i < 1; i++) { ${fightStep} } }
    }`;
const { Probe, CELL_M, CELL_R, HKEY, SPREAD_CAP } = new Function(
    ts.transpile(code, { target: ts.ScriptTarget.ES2020 })
    + ';return {Probe, CELL_M, CELL_R, HKEY, SPREAD_CAP};',
)();
const enemy = (id, x, claims = 0, y = 219) => ({ id, x, y, f: 1, hp: 100, claims });
const me = { x: 219, y: 219, f: 0, key: 'light_infantry' };
function scene(enemies, walls = []) {
    const p = new Probe();
    Object.assign(p, { gm: new Map(), gr: new Map(), wallGates: walls, battleType: 'field', defenderHolding: false, battleSec: 100 });
    for (const o of enemies) {
        for (const [map, cell] of [[p.gm, CELL_M], [p.gr, CELL_R]]) {
            const k = HKEY((o.x / cell) | 0, (o.y / cell) | 0);
            if (!map.has(k)) map.set(k, []);
            map.get(k).push(o);
        }
    }
    return p;
}
let cases = 0;
function check(label, fn) { fn(); cases++; console.log(`  ✅ ${label}`); }

check('满员近敌不能遮蔽外环空闲敌人', () => {
    const near = enemy('near', 209, SPREAD_CAP), far = enemy('far', 440);
    assert.equal(scene([near, far]).search(me, 320), far);
    assert.equal(near.claims, SPREAD_CAP);
    assert.equal(far.claims, 1);
});
check('盲区近敌不能遮蔽外环可射击敌人', () => {
    const near = enemy('near', 209), far = enemy('far', 440);
    assert.equal(scene([near, far]).search(me, 320, 80), far);
});
check('全部满员时仍优先选择最小射程以外的敌人', () => {
    const near = enemy('near', 209, SPREAD_CAP), far = enemy('far', 440, SPREAD_CAP);
    assert.equal(scene([near, far]).search(me, 320, 80), far);
});
check('只剩盲区敌人或满员敌人时仍有目标', () => {
    for (const minRange of [0, 80]) {
        const near = enemy('near', 209, SPREAD_CAP);
        assert.equal(scene([near]).search(me, 320, minRange), near);
    }
});
check('不锁友军、死人和视野外敌人', () => {
    const enemies = [{ ...enemy('ally', 220), f: 0 }, { ...enemy('dead', 221), hp: 0 }, enemy('outside', 600)];
    assert.equal(scene(enemies).search(me, 320), null);
});
check('查行进方向不占名额，正式锁敌只占一次', () => {
    const near = enemy('near', 230);
    const p = scene([near]);
    assert.deepEqual(p.aimAt(me), { x: near.x, y: near.y });
    assert.equal(near.claims, 0);
    assert.equal(p.search(me, 320), near);
    assert.equal(near.claims, 1);
});
check('打墙保持就近优先，塌墙后只选敌兵', () => {
    const wall = { ...enemy('wall', 239), linked: true, sprite: {} };
    const soldier = enemy('soldier', 229);
    const p = scene([soldier], [wall]);
    p.battleType = 'siege'; p.defenderHolding = true;
    assert.equal(p.search(me, 320), wall);
    assert.equal(p.search({ ...me, hero: true }, 320), null);
    wall.sprite.obstructionDisabled = true; p.defenderHolding = false;
    assert.equal(p.search(me, 320), soldier);
});

check('原有四个锁定先登记，新兵排前排后都选空闲敌人', () => {
    for (const newFirst of [true, false]) {
        const a = enemy('A', 239), b = enemy('B', 279);
        const old = Array.from({ length: 4 }, () => ({ ...me, hp: 100, foe: a, next: 0 }));
        const fresh = { ...me, hp: 100, foe: null, next: 0 };
        const p = scene([a, b]);
        p.men = newFirst ? [fresh, ...old, a, b] : [...old, fresh, a, b];
        p.statsFor = () => ({ sight: 320 });
        p.reserveExistingTargets(false);
        assert.equal(a.claims, 4);
        for (const m of p.men.filter(m => m.f === 0)) {
            p.releaseReservedTarget(m);
            p.lockTarget(m, 320);
        }
        assert.equal(fresh.foe, b);
        assert.equal(a.claims, 4);
        assert.equal(b.claims, 1);
    }
});
check('死人、失效目标、部署和攻城待命不预占名额', () => {
    const target = enemy('target', 239);
    const valid = { ...me, hp: 100, foe: target };
    const p = scene([target]);
    p.statsFor = () => ({ sight: 320 });
    p.men = [valid, { ...valid, hp: 0 }, { ...valid, x: 1000 }, target];
    p.reserveExistingTargets(false);
    assert.equal(target.claims, 1);
    p.releaseReservedTarget(valid);
    p.releaseReservedTarget(valid);
    assert.equal(target.claims, 0);
    p.reserveExistingTargets(true);
    assert.equal(target.claims, 0);
    p.defenderHolding = true;
    p.reserveExistingTargets(false);
    assert.equal(target.claims, 0);
});
// 🔴 [2026-09-11 回归闸] 盲区**只管分配新目标**：已锁定的贴脸目标不许丢锁，贴脸攻击者照样反击。
//    2026-09-09 那版三处都判盲区，投石机被贴脸后丢锁 + st=0 站着不还手，而 search/aimAt 的
//    best 兜底又把那个人还回来 → 呆站一帧、朝他走一帧，成了活靶子。
check('贴脸目标不丢锁，贴脸攻击者照样反击', () => {
    for (const retaliating of [false, true]) {
        const near = enemy('near', 229), far = enemy('far', 440);
        const m = { ...me, key: 'mangonel', hp: 100, next: 0,
            foe: retaliating ? null : near, hurtBy: retaliating ? near : null, hurtAt: 100 };
        const p = scene([near, far]);
        p.lockTarget(m, 320);
        assert.equal(m.foe, near);
    }
});
check('分配新目标时仍优先盲区外的敌人', () => {
    const near = enemy('near', 229), far = enemy('far', 440);
    const m = { ...me, key: 'mangonel', hp: 100, next: 0, foe: null, hurtBy: null };
    const p = scene([near, far]);
    p.lockTarget(m, 320);
    assert.equal(m.foe, far);
    assert.equal(near.claims, 0);
});
check('满员不会驱赶已在交战的单位，合法反击仍有效', () => {
    const target = enemy('target', 369, 20);
    const p = scene([target]);
    const m = { ...me, key: 'mangonel', foe: target, next: 0 };
    assert.equal(p.canKeepTarget(m, 320), true);
    m.foe = null; m.hurtBy = target; m.hurtAt = 100;
    p.lockTarget(m, 320);
    assert.equal(m.foe, target);
});
check('墙目标保留原锁定', () => {
    const p = scene([]), m = { ...me, key: 'mangonel' };
    const wall = { ...enemy('wall', 229), hp: 0, linked: true, sprite: {} };
    p.battleType = 'siege'; p.defenderHolding = true; m.foe = wall;
    assert.equal(p.canKeepTarget(m, 320), true);
});
check('已锁定的塌墙立即失效，不再占名额；重选到期后转向敌兵', () => {
    for (const state of ['obstructionDisabled', 'destroyed']) {
        for (const hp of [1080, 400, 0]) {
            for (const next of [0, 0.1]) {
                const wall = { ...enemy('wall', 239), hp, linked: true, sprite: { [state]: true } };
                const soldier = enemy('soldier', 269);
                const p = scene([soldier], [wall]);
                p.battleType = 'siege';
                const m = { ...me, key: 'battering_ram', hp: 175, siegeW: true, foe: wall, next, fightT: 1 };
                p.men = [m, soldier];
                p.statsFor = () => ({ sight: 320 });
                assert.equal(p.canKeepTarget(m, 320), false);
                p.reserveExistingTargets(false);
                assert.equal(wall.claims, 0);
                p.releaseReservedTarget(m);
                p.lockTarget(m, 320);
                assert.equal(m.foe, next === 0 ? soldier : null);
                assert.equal(wall.claims, 0);
                assert.equal(wall.hp, hp);
            }
        }
    }
});

check('旧敌死亡后换敌，缠斗重新计时而不刷新攻击冷却', () => {
    const target = enemy('new', 239), p = scene([target]);
    p.statsFor = () => ({ hp: 100 });
    const m = { ...me, foe: { ...target, hp: 0 }, next: 0, fightT: 3.99, rangeWait: 0.15, lock: 1.2 };
    p.lockTarget(m, 320);
    assert.equal(m.foe, target);
    assert.equal(m.fightT, 0);
    assert.equal(m.rangeWait, 0);
    assert.equal(m.lock, 1.2);
    p.tickFight(m, 0.02);
    assert.equal(m.foe, target);
    assert.equal(m.fightT, 0.02);
});
check('保持同一个敌人不重置缠斗计时', () => {
    const target = enemy('same', 239), p = scene([target]);
    const m = { ...me, foe: target, next: 0, fightT: 3, lock: 1 };
    p.lockTarget(m, 320);
    assert.equal(m.fightT, 3);
    assert.equal(m.lock, 1);
});
check('过期或没有时间的旧受击记录不牵引寻敌', () => {
    for (const hurtAt of [undefined, 99.49]) {
        const near = enemy('near', 229), old = enemy('old', 369), p = scene([near, old]);
        const m = { ...me, foe: null, next: 0, hurtBy: old, hurtAt };
        p.lockTarget(m, 320);
        assert.equal(m.foe, near);
        assert.equal(m.hurtBy, null);
    }
});
check('追击途中受到近身攻击会反击，名额随目标转移', () => {
    const near = enemy('attacker', 229), far = enemy('chased', 369), p = scene([near, far]);
    const m = { ...me, hp: 100, foe: far, next: 0.1, fightT: 2, hurtBy: near, hurtAt: 99.9 };
    p.men = [m, near, far]; p.statsFor = () => ({ sight: 320 });
    p.reserveExistingTargets(false);
    assert.equal(far.claims, 1);
    p.releaseReservedTarget(m);
    p.lockTarget(m, 320);
    assert.equal(m.foe, near);
    assert.equal(far.claims, 0);
    assert.equal(near.claims, 1);
    assert.equal(m.fightT, 0);
});
check('正在交战或射程内的目标不因旁人攻击而切换', () => {
    for (const [distance, reach] of [[20, 65], [150, 200]]) {
        const target = enemy('current', me.x + distance), attacker = enemy('attacker', 229);
        const p = scene([target, attacker]);
        const m = { ...me, foe: target, next: 0, fightT: 2, hurtBy: attacker, hurtAt: 100 };
        p.lockTarget(m, 320, reach);
        assert.equal(m.foe, target);
        assert.equal(m.fightT, 2);
    }
});
check('追击途中不会转向远处的攻击者，打墙不切换', () => {
    for (const mode of ['distant', 'wall']) {
        const attacker = enemy('attacker', mode === 'distant' ? 299 : 229);
        const target = mode === 'wall' ? { ...enemy('wall', 369), sprite: {}, linked: true } : enemy('current', 419);
        const p = scene([attacker]);
        const m = { ...me, foe: target, next: 0, hurtBy: attacker, hurtAt: 100 };
        p.lockTarget(m, 320);
        assert.equal(m.foe, target);
    }
});
// 盲区里的攻击者**要**回头打：贴脸照样能扣血，只是不出弹丸（见 canKeepTarget 头注）。
check('追击途中会反击贴脸的攻击者，投石机也一样', () => {
    const attacker = enemy('attacker', 229), target = enemy('current', 419);
    const p = scene([attacker]);
    const m = { ...me, key: 'mangonel', foe: target, next: 0, hurtBy: attacker, hurtAt: 100 };
    p.lockTarget(m, 320);
    assert.equal(m.foe, attacker);
});
check('死亡及友方攻击者记录失效', () => {
    for (const invalid of [{ hp: 0 }, { f: 0 }]) {
        const p = scene([]), attacker = { ...enemy('invalid', 229), ...invalid };
        const m = { ...me, hurtBy: attacker, hurtAt: 100 };
        assert.equal(p.recentAttacker(m, 320), null);
        assert.equal(m.hurtBy, null);
    }
});

// 🔴 [2026-09-11 回归闸] step 的出手段里绝不能再出现「盲区就 continue」那类出口：
//    只剩贴脸目标时照常扣血（弹丸另有 tooClose 出口），呆站是已经改回来的错误行为。
check('出手段没有最小射程出口', () => {
    assert.equal(/outsideMinRange|MIN_RANGE_TYPES/.test(step.slice(
        step.indexOf('const foe = m.foe;'), step.indexOf('const fd2 ='))), false);
});
check('范围伤不挖盲区空洞，贴脸敌人照样吃溅射', () => {
    const near = enemy('near', 229), far = enemy('far', 440);
    near.atkNext = far.atkNext = 0;
    const p = scene([near, far]);
    Object.assign(p, { statsFor: () => ({}), sideBonus: [1, 1], attritionMul: () => 1 });
    p.splash({ ...me, key: 'mangonel' }, 320, { reload: 2 }, 0.1);
    assert.equal(near.hp, 99.5);
    assert.equal(near.atkNext, 1);
    assert.equal(far.hp, 99.5);
    assert.equal(far.hurtAt, p.battleSec);
    assert.equal(near.hurtAt, p.battleSec);
});
check('防抖等待在各帧率下都会结束，回到射程内会重置', () => {
    for (const dt of [1 / 120, 1 / 60, 1 / 30]) {
        const p = scene([]), m = { ...me };
        assert.equal(p.waitAtRangeEdge(m, true, dt), true);
        for (let i = 0; i < Math.ceil(0.3 / dt); i++) p.waitAtRangeEdge(m, true, dt);
        assert.equal(p.waitAtRangeEdge(m, true, dt), false);
        assert.equal(p.waitAtRangeEdge(m, false, dt), false);
        assert.equal(m.rangeWait, 0);
        assert.equal(p.waitAtRangeEdge(m, true, dt), true);
    }
});
check('70px 对站通过实际等待及追击分支恢复接敌', () => {
    const branches = new Map();
    function collect(node) {
        if (ts.isIfStatement(node)) {
            const condition = node.expression.getText(stepAst);
            if (condition === 'waitInHystBand' || condition === '!inReach') {
                branches.set(condition, printer.printNode(ts.EmitHint.Unspecified, node, stepAst));
            }
        }
        ts.forEachChild(node, collect);
    }
    collect(stepAst);
    const reachChecks = step.slice(step.indexOf('const close = fd2'), step.indexOf('if (inReach)'));
    const movementConstants = ['CHASE_RING', 'CELL_S', 'HKEY', 'SLIDE_W', 'SLIDE_RATE']
        .map(name => `const ${constants.get(name)};`).join('\n');
    const run = new Function('m', 'foe', 'dt', ts.transpile(`${movementConstants}
        const stats = { spd: 55 }, REACH = 65;
        for (let i = 0; i < 1; i++) {
            const fd2 = (foe.x-m.x)**2 + (foe.y-m.y)**2;
            ${reachChecks}
            ${branches.get('waitInHystBand')}
            ${branches.get('!inReach')}
            return inReach;
        }
        return false;`, { target: ts.ScriptTarget.ES2020 }));
    for (const dt of [1 / 120, 1 / 60, 1 / 30]) {
        const p = scene([]);
        p.gs = new Map(); p.dir8Hyst = () => 0;
        const a = { ...me, x: 100, st: 1, jx: 1, jy: 0, ph: 0, fadeT: 0 };
        const b = { ...a, x: 170, f: 1, jx: -1 };
        let reached = false;
        for (let frame = 0; frame < Math.ceil(1 / dt); frame++) {
            if (run.call(p, a, b, dt) || run.call(p, b, a, dt)) { reached = true; break; }
        }
        assert.equal(reached, true, `dt=${dt} 应在一秒内恢复接敌`);
    }
});

// 用独立的全量排序作参照，覆盖正负坐标、双方阵营、大小网格和不同最小射程。
let seed = 911;
function random() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }
check('2000 个随机场景与全量最近邻参照一致', () => {
    for (let i = 0; i < 2000; i++) {
        const unit = { x: random() * 1000 - 500, y: random() * 1000 - 500, f: i % 2 };
        const radius = [65, 160, 320, 600][i % 4], minRange = [0, 80, 120][i % 3];
        const enemies = Array.from({ length: 60 }, (_, j) => ({
            id: j, x: unit.x + random() * 1200 - 600, y: unit.y + random() * 1200 - 600,
            f: random() < 0.7 ? 1 - unit.f : unit.f,
            hp: random() < 0.1 ? 0 : 100, claims: Math.floor(random() * 7),
        }));
        const distance = o => (o.x - unit.x) ** 2 + (o.y - unit.y) ** 2;
        const candidates = enemies.filter(o => o.hp > 0 && o.f !== unit.f && distance(o) < radius ** 2)
            .sort((a, b) => distance(a) - distance(b));
        const expected = candidates.find(o => o.claims < SPREAD_CAP && distance(o) >= minRange ** 2)
            ?? candidates.find(o => distance(o) >= minRange ** 2) ?? candidates[0] ?? null;
        assert.equal(scene(enemies).search(unit, radius, minRange, false), expected, `场景 ${i}`);
    }
});
console.log(`寻敌行为测试：${cases} 组通过。`);
