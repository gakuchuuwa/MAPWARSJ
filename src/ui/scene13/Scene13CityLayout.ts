/**
 * 🔴 [2026-10-20 主人令「按功能模块拆分 Scene13WarLayer.ts，保证原有功能完全正常」]
 * 战术模式（Scene13）**城池与营地布置**：从 Scene13WarLayer.ts 原样搬出（逻辑一行未改）。
 *   · 攻城战守方城池（战略地图同款，摆在地图中心）：buildDeCity / applyDeCityToGround / syncDeCityGround
 *   · 双方出兵口营地、城墙、拒马、建筑：applySpawnBuildings / applyBuildingsForSide
 *   · 按气候选大山素材池：getClimateMountainPool
 * 写法：每个函数以 `this: Scene13WarLayer` 调用（类里用 `fn.call(this, …)`），函数体与原方法逐字一致；
 * 因此本模块用到的 Scene13WarLayer 成员不再是 private。
 */
import type { Scene13WarLayer } from '../Scene13WarLayer';
import type { DecorSprite } from './Scene13Types';
import { TAC_TILE_W, TAC_TILE_H } from './Scene13GroundLayerGL';
import { measureStrategicCity, strategicCityGroundElement } from './Scene13StrategicCity';
import {
    WALL_GATE_STATS, MONGOL_CITY_YURTS, SIEGE_IMPERIAL_BUILDINGS, SIEGE_MEDIUM_BUILDINGS, SIEGE_FEUDAL_BUILDINGS,
    SIEGE_CITY_BUILDING_SCALE, SIEGE_CASTLE_SCALE, SIEGE_WONDER_SCALE, siegeBuildingScale,
} from './Scene13UnitTables';
import { pickTree, type TreeSeason } from './TreeAssignment';
import { CITIES_V2 } from '../../data/cities_v2';
import { CITY_WONDER, CITY_WONDER_EXTRA } from '../../data/CityWonders';
import { isWonderFounded } from '../../data/wonderFoundedYears';
import { resolveStockadeFenceKey } from '../../data/stockadeWallStyleLookup';
import { resolveTacticalWallSetup, passRingHalfExtents } from '../../systems/cityWallShared';
import { isMountainPass, EXCLUDED_PASS_IDS } from '../../systems/passMountainDecision';

/**
 * 🔴 [2026-10-11 主人「城池在中心，样式和战略地图一致」] 摆战略地图同款城池：
 *    屏外排版量出每张图的矩形 → 建筑 / 城墙 / 城门入场为世界精灵（与士兵按脚点排序），
 *    城墙城门照旧可攻击、可破（WALL_GATE_STATS 同一套）；地基贴图留在 DOM 地基层。
 */
export function buildDeCity(this: Scene13WarLayer): void {
    const c = this.deCity;
    if (!c) return;
    const gen = this.assetGen;
    this.pending++;
    let released = false;
    const release = () => { if (released) return; released = true; if (gen === this.assetGen) this.pending--; };
    window.setTimeout(release, 8000);
    if (this.deCityGround) { this.deCityGround.remove(); this.deCityGround = null; }
    if (this.defenderCityType !== 'stockade') {
        this.deCityGround = strategicCityGroundElement(c, this.defenderCityType);
    }
    void measureStrategicCity(c).then(async (pieces) => {
        if (gen !== this.assetGen || this.deCity !== c) return;
        const metas = await Promise.all(pieces.map((p) =>
            fetch('/SUCAI_BUILDING/' + p.dir + '/_meta.json').then((r) => (r.ok ? r.json() : null)).catch(() => null)));
        if (gen !== this.assetGen || this.deCity !== c) return;
        const { x: cx, y: cy } = this.deCityCenter;
        pieces.forEach((p, i) => {
            const meta = metas[i];
            if (!meta || !meta.box_w) return;
            const asset = 'BUILDING:' + p.dir;
            this.ensureNatureAsset(asset);
            const k = p.width / meta.box_w;
            const x = cx + (p.flip ? p.left + p.width - meta.anchor_x * k : p.left + meta.anchor_x * k);
            const y = cy + p.top + meta.anchor_y * k;
            const sprite: DecorSprite = {
                asset, frame: 0, x, y, flip: p.flip, layer: 'world', z: 1, scale: k,
                obstructionContactSec: 0, obstructionTouched: false, obstructionDisabled: false,
            };
            this.decorSprites.push(sprite);
            if (p.kind === 'building') { if (p.aux) (sprite as any).isAux = true; this.trackCityBuilding(sprite); return; }
            sprite.obstruction = { x: 0.95, y: 0.95 };
            if (p.kind === 'wall') {
                // 木栅栏/篱笆走 WOOD_WALL 档；石墙/垛墙 STONE_WALL（加固墙取 FORTIFIED_WALL 3000 血）、破墙前按 HP 切 D25/D50/D75
                const wood = /PALISADE|FENCE/.test(p.dir);
                const isFence = p.dir.includes('FENCE');
                const wKey = wood ? 'WOOD_WALL' : (p.dir.includes('FORTIFIED') ? 'FORTIFIED_WALL' : 'STONE_WALL');
                const st = WALL_GATE_STATS[wKey];
                const destrAssets = wood ? undefined : ['D25', 'D50', 'D75'].map((t) => `${p.dir}_${t}`);
                if (destrAssets) for (const d of destrAssets) this.ensureNatureAsset('BUILDINGANIM:' + d);
                const wallRubble = isFence ? 'BATTLEFIELD:FENCE_RUBBLE' : 'FOUNDATION_1X1_RUBBLE';
                if (isFence) {
                    this.ensureNatureAsset('BATTLEFIELD:FENCE_RUBBLE');
                } else {
                    this.ensureNatureAsset('BUILDINGANIM:FOUNDATION_1X1_DESTR');
                    this.ensureNatureAsset('BUILDINGANIM:FOUNDATION_1X1_RUBBLE');
                }
                this.wallGates.push({ f: 1, key: wKey, x, y, hp: st.hp, maxHp: st.hp, claims: 0, claimsNext: 0, atkNext: 0, atkers: 0, sprite, linked: true, destrAssets, rubbleAsset: wallRubble });
                return;
            }
            // 城门：沿门线铺 6 点碰撞体堵两侧缝隙（同旧 13 placeGate）；破门播倒塌动画 → 残骸
            const dSign = (/_SE$/.test(p.dir) ? 1 : -1) * (p.flip ? -1 : 1);
            const extraSprites: DecorSprite[] = [];
            for (let step = -3; step <= 3; step++) {
                if (step === 0) continue;
                const extra: DecorSprite = {
                    asset: '', frame: 0, x: x + step * 24 * k, y: y + step * 12 * k * dSign, flip: false, layer: 'world', z: 1,
                    obstruction: { x: 0.95, y: 0.95 },
                    obstructionContactSec: 0, obstructionTouched: false, obstructionDisabled: false,
                };
                this.decorSprites.push(extra);
                extraSprites.push(extra);
            }
            const isOnlyFenceGate = p.dir.includes('FENCE');
            const isWoodGate = isOnlyFenceGate || p.dir.includes('PALISADE');
            let rubbleAsset: string;
            if (isOnlyFenceGate) {
                // 🔴 [2026-10-16 主人令「篱笆的门，在坍塌的时候，错用了栅栏门，请修复，和DE保持一致，依然用篱笆门」]
                //    对齐 DE empires2_x2_p1.dat Unit 1062 (b_scen_fence) → dying_graphic=36 → dead_unit_id=1065 (b_scen_fence_rubble)
                rubbleAsset = 'BATTLEFIELD:FENCE_RUBBLE';
                this.ensureNatureAsset(rubbleAsset);
            } else {
                rubbleAsset = `${p.dir}_RUBBLE`;
                this.ensureNatureAsset('BUILDINGANIM:' + `${p.dir}_DESTR`);
                this.ensureNatureAsset('BUILDINGANIM:' + rubbleAsset);
            }
            const st = isWoodGate ? WALL_GATE_STATS.WOOD_WALL : (p.dir.includes('FORTIFIED') ? WALL_GATE_STATS.FORTIFIED_GATE : WALL_GATE_STATS.STONE_GATE);
            // 🔴 [2026-10-13] key 仍写 'STONE_GATE'（**不新增键**）：城门倒塌/残骸那几条链
            //    只认 'STONE_GATE'（见两处 `foe.key === 'STONE_GATE' && hp<=0`），
            //    若另立 'WOOD_GATE' 键，木门 0 血时不会倒塌 —— 会变成打不烂的墙。
            //    木材质只体现在**血甲**上（540/2/5 照 WOOD_WALL），行为链完全通用。
            this.wallGates.push({ f: 1, key: 'STONE_GATE', x, y, hp: st.hp, maxHp: st.hp, claims: 0, claimsNext: 0, atkNext: 0, atkers: 0, sprite, extraSprites, linked: true, rubbleAsset });
        });
        applyDeCityToGround.call(this);
    }).finally(release);
}

/** 城池落地：城址范围内清掉底图的水 / 林、整平高程（大概率形成中央平顶高台），并拿掉压在城里的底图树 */
export function applyDeCityToGround(this: Scene13WarLayer): void {
    const c = this.deCity, gl = this.groundLayerGL, cv = this.canvas;
    if (!c || !gl || !cv) return;
    const { x: cx, y: cy } = this.deCityCenter;
    const W = this.worldCX * 2, H = this.worldCY * 2;
    const rx = c.width / 2, ry = c.height / 2;
    // 城池外接椭圆换算成格半径（等轴格：横向约 45 px、纵向约 22 px 一格）
    const rCells = Math.min(7.5, Math.max(4.5, Math.max(rx / 160, ry / 80)));
    // 🔴 [2026-10-11 主人令「据点城池在地图中心，高地大概率设计在地图中心地带，注意大概率而非绝对」]
    const peakLevel = gl.maxElevationLevelInRadius(cx, cy, W, H, rCells * 0.8);
    const seedStr = String(this.defenderCityId || this.environmentPlan?.seed || 'default');
    let hash = 2166136261;
    for (let i = 0; i < seedStr.length; i++) hash = Math.imul(hash ^ seedStr.charCodeAt(i), 16777619);
    const roll = (hash >>> 0) % 100;
    const level = peakLevel >= 1.5
        ? Math.min(4, Math.max(2, Math.round(peakLevel)))
        : (roll < 68 ? (roll < 24 ? 3 : 2) : Math.round(peakLevel));
    // 🔴 [2026-10-12 主人令「PASS与城寨分别支持专属的多层阶梯高台与多样化随机起伏小山包」]
    // 🔴 [2026-10-12 主人令「设计中城护城河，比大城窄一点，2 格就行；小城 1 格；城寨不用」] 河宽按城型：大城 3 / 中城 2 / 小城 1 / 其余不挖；
    //    毡帐营地（蒙古包那套，不是按格摆放的墙圈）跳过，免得河开错位置。
    const moatW = this.defenderCityType === 'big_city' ? 3 : this.defenderCityType === 'medium_city' ? 2 : this.defenderCityType === 'small_city' ? 1 : 0;
    // 🔴 [2026-10-13 主人令「护城河按史实区分，没有水的城不要挖」] 护城河要有水源：城郊 25km 内没有河 / 湖 / 海（waterKind === 'none'，
    //    即内陆干旱区的城）不挖——历史上这类城要么是干壕、要么根本无壕，凭空挖一圈水不符合地理。
    const moatOn = moatW > 0 && this.buildingStyleFor(1) !== 'YURT' && this.environmentPlan?.waterKind !== 'none';
    if (this.defenderCityType === 'pass') {
        // 🔴 [2026-10-20 主人令「东方险要改矩形」] 矩形形制：台地边界按矩形双圈算（旧方形不传，走原算法一个像素不动）
        gl.flattenPassTerraces(cx, cy, W, H, seedStr, this.wallGates, this.defBuildings,
            this.defenderPassShape === 'rect' ? passRingHalfExtents(true) : undefined);
    } else if (this.defenderCityType === 'stockade') {
        gl.flattenStockadeTerraces(cx, cy, W, H, seedStr, this.wallGates);
    } else {
        // 普通城市保持原有的整体地基整平
        const ringL = Math.max(0, (rx - 200) / (TAC_TILE_W / 2));
        let flatCells = ringL > 0 ? ringL / 2 + 0.5 : rCells;
        // 🔴 [2026-10-12 主人令「给大城的外围加一圈护城河」] 河在墙外 1.5~4.5 格，整平范围要盖住它（含不规则水湾外扩），河面才和城池地基同高
        if (this.defenderCityType === 'big_city' && ringL > 0) flatCells = Math.max(flatCells, ringL / 2 + 6.5);
        else if (moatOn && ringL > 0) flatCells = Math.max(flatCells, ringL / 2 + 1.85 + moatW + 2.8);   // 中城、小城：盖住不规则河岸与水湾外沿
        if (this.defenderCityType === 'big_city') {
            gl.flattenBigCityTerrain(cx, cy, W, H, seedStr, flatCells);
        } else if (this.defenderCityType === 'medium_city' || this.defenderCityType === 'small_city') {
            gl.flattenMediumSmallCityTerrain(cx, cy, W, H, seedStr, flatCells, this.defenderCityType);
        } else {
            gl.flattenFoundation(cx, cy, W, H, flatCells, level);
        }
    }
    for (let py = -ry; py <= ry; py += 24) {
        for (let px = -rx; px <= rx; px += 48) {
            if ((px * px) / (rx * rx) + (py * py) / (ry * ry) > 1) continue;
            gl.carveFoundation(cx + px, cy + py, W, H, 2);
        }
    }
    // 🔴 [2026-10-12 主人令「给大城的外围加一圈护城河」＋ 答复：3 格宽、四个门前各留一座桥、只加战术地图]
    // 🔴 [2026-10-15 主人令「护城河的左右两边各有一个尖，请消除，护城河应该是不规则的，不要所有都一样，应该多样化」]
    //    1) 消除左右尖角：等轴投影 2:1（96×48）下，墙圈左右两角夹角仅 53.13°，旧版在 (ci,cj) 格空间算 L4 会沿水平角平分线外突成 `<`、`>` 尖刺；
    //       现改为在屏幕像素空间直接向墙圈菱形线段 A=(0, half·TH)→B=(half·TW, 0) 投影求欧氏距离，左右角天然呈屏幕正圆弧包绕角楼，彻底消除尖刺。
    //    2) 多样化不规则河道：按每座城 seedStr 确定性生成不同频率/相位的内外岸独立起伏波、四段河面宽窄偏置、1~3 处天然宽阔水湾，以及门桥两侧圆弧收头。
    const ringLm = Math.max(0, (rx - 200) / (TAC_TILE_W / 2));
    let inMoat: ((x: number, y: number) => boolean) | null = null;
    if (moatOn && ringLm > 0) {
        let mh = (hash >>> 0) ^ 0x9e3779b9;
        const mrnd = (): number => {
            mh = Math.imul(mh ^ (mh >>> 15), 0x85ebca6b) >>> 0;
            mh = Math.imul(mh ^ (mh >>> 13), 0xc2b2ae35) >>> 0;
            return ((mh ^ (mh >>> 16)) >>> 0) / 4294967296;
        };
        const half = ringLm / 2;
        const d0 = 1.80;
        const baseSpan = moatW === 1 ? 1.50 : moatW === 2 ? 2.20 : 3.05;
        const bridgeHalfBase = moatW === 1 ? 1.35 : moatW === 2 ? 1.65 : 2.0;
        // 每座城专属的多频谐波参数与四段宽窄偏置
        const f1 = 3 + Math.floor(mrnd() * 3), f2 = 6 + Math.floor(mrnd() * 4), f3 = 11 + Math.floor(mrnd() * 5);
        const p1 = mrnd() * Math.PI * 2, p2 = mrnd() * Math.PI * 2, p3 = mrnd() * Math.PI * 2;
        const p4 = mrnd() * Math.PI * 2, p5 = mrnd() * Math.PI * 2, p6 = mrnd() * Math.PI * 2;
        const sideBias = [
            (mrnd() - 0.5) * 0.45 * Math.sqrt(moatW),
            (mrnd() - 0.5) * 0.45 * Math.sqrt(moatW),
            (mrnd() - 0.5) * 0.45 * Math.sqrt(moatW),
            (mrnd() - 0.5) * 0.45 * Math.sqrt(moatW),
        ];
        // 1~3 处天然水湾/深潭外扩（避开左右尖端 θ≈0 / ±π，分布在四段河身中段）
        const bulgeCount = 1 + Math.floor(mrnd() * 3);
        const qAngles = [0.28 * Math.PI, 0.72 * Math.PI, -0.72 * Math.PI, -0.28 * Math.PI];
        const bulges: Array<{ th0: number; amp: number; wid: number }> = [];
        for (let b = 0; b < bulgeCount; b++) {
            const q = (b + Math.floor(mrnd() * 4)) % 4;
            bulges.push({
                th0: qAngles[q] + (mrnd() - 0.5) * 0.26 * Math.PI,
                amp: (0.38 + mrnd() * 0.48) * (0.75 + 0.25 * moatW),
                wid: 0.16 + mrnd() * 0.14,
            });
        }
        // 土堤：城门正前方不挖，每座门桥宽度带微幅差异，并在两侧做水滴圆头收口
        const lanes: Array<{ axis: 'i' | 'j'; sign: number; along: number; bh: number }> = [];
        for (const gt of this.wallGates) {
            if (gt.f !== 1 || !/GATE/.test(gt.key)) continue;
            const gu = (gt.x - cx) / (TAC_TILE_W / 2), gv = (gt.y - cy) / (TAC_TILE_H / 2);
            const gi = (gu + gv) / 2 - 0.5, gj = (gv - gu) / 2 - 0.5;
            const bh = bridgeHalfBase + (mrnd() - 0.5) * 0.26;
            if (Math.abs(gi) >= Math.abs(gj)) lanes.push({ axis: 'i', sign: Math.sign(gi), along: gj, bh });
            else lanes.push({ axis: 'j', sign: Math.sign(gj), along: gi, bh });
        }
        // 屏幕空间墙圈中心 (cx, rcy) 与第一象限墙段 A=(0, half·TH) → B=(half·TW, 0)
        const rcy = cy + 0.5 * TAC_TILE_H;
        const segAx = 0, segAy = half * TAC_TILE_H, segBx = half * TAC_TILE_W, segBy = 0;
        const segVx = segBx - segAx, segVy = segBy - segAy, segLen2 = segVx * segVx + segVy * segVy || 1;
        const unitPx = (TAC_TILE_W * TAC_TILE_H) / (2 * Math.hypot(TAC_TILE_W / 2, TAC_TILE_H / 2));
        const wallScreenDist = (x: number, y: number, ex: number, ey: number): number => {
            if (ex <= 0 && ey <= 0) return Math.max(ex, ey);
            const dx = Math.abs(x - cx), dy = Math.abs(y - rcy);
            const t = Math.max(0, Math.min(1, ((dx - segAx) * segVx + (dy - segAy) * segVy) / segLen2));
            return Math.hypot(dx - (segAx + t * segVx), dy - (segAy + t * segVy)) / unitPx;
        };
        inMoat = (x, y) => {
            const u = (x - cx) / (TAC_TILE_W / 2), v = (y - cy) / (TAC_TILE_H / 2);
            const ci = (u + v) / 2 - 0.5, cj = (v - u) / 2 - 0.5;
            const ex = Math.abs(ci) - half, ey = Math.abs(cj) - half;
            const d = wallScreenDist(x, y, ex, ey);
            const th = Math.atan2((y - rcy) * 2, x - cx);
            // 左右角转弯处收束波幅以保持圆润包角，四段直墙河道充分展开不规则起伏
            const tipFade = 0.25 + 0.75 * Math.sin(th) * Math.sin(th);
            const wIn = (0.18 * Math.sin(f1 * th + p1) + 0.12 * Math.cos(f2 * th + p2) + 0.07 * Math.sin(f3 * th + p3)) * tipFade;
            const dIn = Math.max(1.52, d0 + wIn);
            const qIdx = (x >= cx ? 0 : 1) + (y >= rcy ? 0 : 2);
            const wOut = (0.32 * Math.sin(f1 * th + p4) + 0.24 * Math.cos(f2 * th + p5) + 0.15 * Math.sin(f3 * th + p6)) * tipFade * (0.8 + 0.2 * moatW);
            let bulge = 0;
            for (const b of bulges) {
                let dth = th - b.th0;
                if (dth > Math.PI) dth -= Math.PI * 2;
                else if (dth < -Math.PI) dth += Math.PI * 2;
                bulge += b.amp * Math.exp(-(dth * dth) / (b.wid * b.wid));
            }
            const lrComp = 0.22 * Math.pow(Math.cos(th), 4);
            const span = Math.max(moatW === 1 ? 1.25 : moatW * 0.88, baseSpan + sideBias[qIdx] + wOut + bulge * tipFade + lrComp);
            const dOut = dIn + span;
            if (d < dIn || d >= dOut) return false;
            const capZone = 0.90;
            for (const ln of lanes) {
                const sameSide = ln.axis === 'i' ? (Math.sign(ci) === ln.sign) : (Math.sign(cj) === ln.sign);
                if (!sameSide) continue;
                const distAlong = Math.abs((ln.axis === 'i' ? cj : ci) - ln.along);
                if (distAlong <= ln.bh) return false;
                if (distAlong < ln.bh + capZone) {
                    const profile = Math.sqrt((distAlong - ln.bh) / capZone);
                    const mid = dIn * 0.45 + dOut * 0.55;
                    const halfW = (dOut - dIn) * 0.5 * profile;
                    if (d < mid - halfW || d >= mid + halfW) return false;
                }
            }
            return true;
        };
        // 🔴 [2026-10-13 主人令「有河流的可以和护城河连上」→「按这个方案做」] 护城河引水渠：
        //    只在**河流**地图（waterKind === 'river'）做；海、湖、城寨（无护城河）不连。
        //    挖河之前先记下天然河水格，再找「护城河格 ↔ 河水格」最近的一对，≤ 15 格才挖一条直渠（宽 = 护城河宽）。
        //    地面格在地平面上是正方形（96×48 屏幕 px ＝ 地平面 96×96），所以距离按 (x, 2y) 量。
        // 「城内」按墙圈算（离墙方框 < d0 格 ＝ 护城河内沿以内），不用城池素材椭圆：
        //    椭圆的高含建筑立面（洛阳 ry 876px ≈ 18 格），会把护城河整圈、连同河与壕之间的空地都算进城里 ⇒ 渠永远挖不出来。
        const inCityE = (x: number, y: number): boolean => {
            const u = (x - cx) / (TAC_TILE_W / 2), v = (y - cy) / (TAC_TILE_H / 2);
            const ex = Math.abs((u + v) / 2 - 0.5) - half, ey = Math.abs((v - u) / 2 - 0.5) - half;
            return wallScreenDist(x, y, ex, ey) < 1.52;
        };
        const N: number = gl.data?.width ?? 0;
        const riverCells: Array<[number, number]> = [];
        if (this.environmentPlan?.waterKind === 'river' && N > 0) {
            for (let gy = 0; gy < N; gy++) for (let gx = 0; gx < N; gx++) {
                if (!gl.isWaterAtCell(gx, gy)) continue;
                const p = gl.cellToScreen(gx + 0.5, gy + 0.5, W, H);
                if (!inCityE(p.x, p.y) && !inMoat(p.x, p.y)) riverCells.push([p.x, p.y]);
            }
        }
        gl.addWaterCoverage(inMoat, W, H);   // 全城型按 5×5 子格覆盖率写水，使不规则岸线与圆角平滑自然
        if (riverCells.length > 0) {
            const moatPts: Array<[number, number]> = [];
            for (let gy = 0; gy < N; gy++) for (let gx = 0; gx < N; gx++) {
                const p = gl.cellToScreen(gx + 0.5, gy + 0.5, W, H);
                if (inMoat(p.x, p.y)) moatPts.push([p.x, p.y]);
            }
            let bestD = Infinity, a: [number, number] | null = null, b: [number, number] | null = null;
            for (const m of moatPts) for (const r of riverCells) {
                const d = Math.hypot(r[0] - m[0], (r[1] - m[1]) * 2);
                if (d < bestD) { bestD = d; a = m; b = r; }
            }
            const MAX_LEN = 15 * TAC_TILE_W;   // 15 个地面格
            // 渠不许穿城：沿线抽样，有一点落进城池椭圆就放弃
            let crossesCity = false;
            if (a && b) for (let t = 0; t <= 1; t += 0.05) if (inCityE(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)) { crossesCity = true; break; }
            if (a && b && bestD <= MAX_LEN && !crossesCity) {
                // 🔴 [2026-10-13 主人报「河流和护城河衔接的不太好」] 原来是一根等宽直棒、两头直角：
                //    ① 两端各延长（渠首缩进护城河、渠尾伸进河心），不留缝；
                //    ② 两端做喇叭口（宽度向端点平滑放大 ~1.8 倍），与河、与护城河都是圆滑倒角而不是直角；
                //    ③ 渠身带一个轻微的 S 形弯（振幅 0.7 格），不再是尺子画的直线。
                const half0 = Math.max(0.5, moatW) * Math.hypot(TAC_TILE_W / 2, TAC_TILE_H) / 2;   // 护城河宽（等轴格）换算到地平面
                let ax = a[0], ay = a[1] * 2, bx = b[0], by = b[1] * 2;
                const L0 = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / L0, uy = (by - ay) / L0;
                const EXT_A = TAC_TILE_W * 0.8, EXT_B = TAC_TILE_W * 1.6;
                ax -= ux * EXT_A; ay -= uy * EXT_A; bx += ux * EXT_B; by += uy * EXT_B;
                const L1 = Math.hypot(bx - ax, by - ay) || 1, vx = (bx - ax) / L1, vy = (by - ay) / L1;
                const AMP = TAC_TILE_W * 0.7, FLARE = Math.min(0.3, (TAC_TILE_W * 3) / L1);
                const inCanal = (x: number, y: number): boolean => {
                    const gx2 = x - ax, gy2 = y * 2 - ay;
                    const along = gx2 * vx + gy2 * vy, t = along / L1;
                    if (t < -0.02 || t > 1.02) return false;
                    const lat = -gx2 * vy + gy2 * vx - AMP * Math.sin(Math.PI * 2 * Math.max(0, Math.min(1, t)));
                    const fa = Math.max(0, 1 - t / FLARE), fb = Math.max(0, 1 - (1 - t) / FLARE);
                    const w = half0 * (1 + 0.8 * fa * fa + 0.8 * fb * fb);
                    return Math.abs(lat) <= w && !inCityE(x, y);
                };
                gl.addWaterCoverage(inCanal, W, H);
                const moatOnly = inMoat;
                inMoat = (x, y) => moatOnly(x, y) || inCanal(x, y);   // 下面清树/石头时一并清掉渠上的
            }
        }
    }
    const inCity = (x: number, y: number) => ((x - cx) ** 2) / (rx * rx) + ((y - cy) ** 2) / (ry * ry) <= 1;
    const hasGateRoads = (this.defenderCityType === 'big_city' || this.defenderCityType === 'medium_city') && ringLm > 0;
    const roadMaxU = ringLm / 2 + (this.defenderCityType === 'big_city' ? 14.5 : 12.0);
    const roadMaxV = this.defenderCityType === 'big_city' ? 2.1 : 1.8;
    const inGateRoad = (x: number, y: number): boolean => {
        if (!hasGateRoads) return false;
        const u = (x - cx) / (TAC_TILE_W / 2), v = (y - cy) / (TAC_TILE_H / 2);
        const di = Math.abs((u + v) / 2 - 0.5), dj = Math.abs((v - u) / 2 - 0.5);
        return (di <= roadMaxU && dj <= roadMaxV) || (dj <= roadMaxU && di <= roadMaxV);
    };
    const cityCell = gl.screenToCell(cx, cy, W, H);
    const baseFlatCells = ringLm > 0 ? ringLm / 2 + (this.defenderCityType === 'big_city' ? 6.5 : 4.5) : rCells + 2.5;
    const minHillDistCells = this.defenderCityType === 'pass'
        ? baseFlatCells + 4.5
        : this.defenderCityType === 'stockade'
            ? baseFlatCells + 3.0
            : baseFlatCells;
    const TREE_FILTER_RE = /^(?!PLANT|UNDERBRUSH|ROCK|FORAGE|FALLEN_LEAVES|FELLED|STUMP|FLOWER|GRASS|WEED|SHRUB|BUSH_GREEN).*(TREE|PINE|OAK|BAMBOO|PALM|BIRCH|CYPRESS|MAPLE|WILLOW|OLIVE|BAOBAB|BRAZILWOOD|JUNGLE|RAINFOREST|ACACIA|MANGROVE|BLOSSOM|GINKGO|EUCALYPTUS|MONKEY_PUZZLE)/i;
    const removedFlatTrees: DecorSprite[] = [];
    this.decorSprites = this.decorSprites.filter((sp) => {
        if (sp.asset.startsWith('MOUNTAIN_') || (sp as any).cityInterior) return false;
        if (sp.asset.startsWith('BUILDING') || sp.asset === '') return true;
        const isTree = TREE_FILTER_RE.test(sp.asset);
        const spElev = gl.elevationLevelAt(sp.x, sp.y, W, H);
        const spCell = cityCell ? gl.screenToCell(sp.x, sp.y, W, H) : null;
        const distCells = (cityCell && spCell) ? Math.hypot(spCell.gx - cityCell.gx, spCell.gy - cityCell.gy) : 999;
        const inCityOrRoad = inCity(sp.x, sp.y) || inGateRoad(sp.x, sp.y);
        const inWaterOrMoat = !!(inMoat && inMoat(sp.x, sp.y)) || gl.isWaterAt(sp.x, sp.y, W, H);
        // 🔴 [2026-10-18/19 主人令「城周围应该是平地才对。山可以放到城外围的丘陵上。和树一样，树也都是长在山上，丘陵上。」]
        //    提高树木高地门槛（spElev >= 1.0），杜绝树木长在平地或坡脚边缘
        const treeOnHill = !isTree || (distCells >= minHillDistCells - 0.5 && spElev >= 1.0);
        const keep = !inCityOrRoad && !inWaterOrMoat && treeOnHill;
        if (!keep) {
            if (inCityOrRoad) {
                gl.carveFoundation(sp.x, sp.y, W, H, 2.2);
            } else if (isTree) {
                gl.clearForestAt(sp.x, sp.y, W, H, 2.0);
                if (!inWaterOrMoat) removedFlatTrees.push(sp);
            }
        }
        return keep;
    });

    let mSeed = (hash >>> 0) ^ 0x6c8e9cf5;
    const mRnd = (): number => {
        mSeed = Math.imul(mSeed ^ (mSeed >>> 15), 0x85ebca6b) >>> 0;
        mSeed = Math.imul(mSeed ^ (mSeed >>> 13), 0xc2b2ae35) >>> 0;
        return ((mSeed ^ (mSeed >>> 16)) >>> 0) / 4294967296;
    };

    // ── 将平地上移除的树木择优迁栽到缺少植被的外围高地台顶（>= 1.5 级）上，确保每块高地都有林木相伴 ──
    const N = gl.data?.width ?? 120;
    const cGx = cityCell ? cityCell.gx : N * 0.5;
    const cGy = cityCell ? cityCell.gy : N * 0.5;
    if (removedFlatTrees.length > 0) {
        const existingTrees = this.decorSprites.filter((sp) => TREE_FILTER_RE.test(sp.asset));
        const bareHillSpots: Array<{ x: number; y: number; elev: number }> = [];
        for (let gy = 8; gy <= N - 8; gy += 3) {
            for (let gx = 8; gx <= N - 8; gx += 3) {
                const dCells = Math.hypot(gx - cGx, gy - cGy);
                if (dCells < minHillDistCells + 1.2 || dCells > 50) continue;
                const pt = gl.cellToScreen(gx + 0.5, gy + 0.5, W, H);
                if (gl.isWaterAt(pt.x, pt.y, W, H) || (inMoat && inMoat(pt.x, pt.y)) || inGateRoad(pt.x, pt.y) || inCity(pt.x, pt.y)) continue;
                const elev = gl.elevationLevelAt(pt.x, pt.y, W, H);
                if (elev < 1.5) continue;
                const hasNearTree = existingTrees.some((t) => Math.hypot(t.x - pt.x, (t.y - pt.y) * 1.5) < 280);
                if (!hasNearTree) {
                    bareHillSpots.push({ x: pt.x, y: pt.y, elev });
                }
            }
        }
        bareHillSpots.sort((a, b) => b.elev - a.elev);
        const maxRelocate = Math.min(removedFlatTrees.length, Math.min(bareHillSpots.length * 2, 28));
        let rIdx = 0;
        for (let sIdx = 0; sIdx < bareHillSpots.length && rIdx < maxRelocate; sIdx++) {
            const spot = bareHillSpots[sIdx];
            const clusterCnt = 1 + (mRnd() < 0.55 ? 1 : 0);
            for (let k = 0; k < clusterCnt && rIdx < maxRelocate; k++) {
                const tx = spot.x + (mRnd() - 0.5) * 86;
                const ty = spot.y + (mRnd() - 0.5) * 44;
                if (gl.isWaterAt(tx, ty, W, H) || (inMoat && inMoat(tx, ty)) || inGateRoad(tx, ty) || inCity(tx, ty)) continue;
                if (gl.elevationLevelAt(tx, ty, W, H) < 1.2) continue;
                const treeSp = removedFlatTrees[rIdx++];
                treeSp.x = tx;
                treeSp.y = ty;
                this.decorSprites.push(treeSp);
                gl.addForestAt(tx, ty, W, H, 1.25);
            }
        }
    }

    gl.flushFoundation();

    // ── 大城 / 中城 / 小城 城内景观与街角细节（庭院绿植、内门火把、街角木桶与花坛，纯视觉点缀不挡路、不可摧毁） ──
    const defCityForInterior: any = this.defenderCityRecord();
    const interiorBldStyle = defCityForInterior?.buildingStyle ?? this.environmentPlan?.buildingStyle;
    const isYurtOrNomadCity = this.buildingStyleFor(1) === 'YURT' || interiorBldStyle === 'MONGOL';
    if (!isYurtOrNomadCity && (this.defenderCityType === 'big_city' || this.defenderCityType === 'medium_city' || this.defenderCityType === 'small_city' || this.defenderCityType === 'stockade' || this.defenderCityType === 'pass')) {
        const TW = 96, TH = 48;
        const isoToWorld = (ci: number, cj: number): { x: number; y: number } => {
            let dx = (ci - cj) * (TW * 0.5);
            const dy = (ci + cj) * (TH * 0.5);
            if (this.deCity?.mirror) dx = -dx;
            return { x: cx + dx, y: cy + dy };
        };
        const pushInteriorDecor = (asset: string, ci: number, cj: number, scale: number): void => {
            const pt = isoToWorld(ci, cj);
            const lift = gl.elevationLiftAt(pt.x, pt.y, W, H);
            this.ensureNatureAsset(asset);
            const sp: DecorSprite = {
                asset,
                frame: Math.floor(mRnd() * 100),
                x: pt.x,
                y: pt.y,
                flip: mRnd() < 0.5,
                layer: 'world',
                z: 0,
                lift,
                scale,
                obstruction: undefined,
                obstructionContactSec: 0,
                obstructionTouched: false,
                obstructionDisabled: true,
            };
            (sp as any).cityInterior = true;
            this.decorSprites.push(sp);
        };
        // ── 随机辅助：基于本城 mRnd 确定性洗牌（保证同一座城布局稳定不闪烁，但不同城池独一无二） ──
        const shuffleWithMSeed = <T>(arr: readonly T[]): T[] => {
            const list = [...arr];
            for (let i = list.length - 1; i > 0; i--) {
                const j = Math.floor(mRnd() * (i + 1));
                const tmp = list[i];
                list[i] = list[j];
                list[j] = tmp;
            }
            return list;
        };

        // 1) 四座城门内侧迎宾立柱火把（TORCH_A / TORCH_B 随机混用，带微小位置与缩放抖动，保持每座城生动自然）
        const baseGateTorchCoords: ReadonlyArray<readonly [number, number]> = this.defenderCityType === 'big_city'
            ? [[-2.0, -9.2], [9.8, -1.0], [3.0, 10.2], [-8.8, 2.0]]
            : this.defenderCityType === 'medium_city'
                ? [[-2.0, -8.2], [8.8, -1.0], [3.0, 9.2], [-7.8, 2.0]]
                : this.defenderCityType === 'small_city'
                    ? [[-2.0, -7.2], [7.8, -1.0], [3.0, 8.2], [-6.8, 2.0]]
                    : this.defenderCityType === 'stockade'
                        ? [[-2.0, -6.2], [6.8, -1.0], [3.0, 7.2], [-5.8, 2.0]]
                        : [
                            // 险要外围 8 座城门迎宾火把（每段外墙两门）
                            [-11.2, 6.5], [-11.2, -5.5],
                            [-5.5, -11.2], [6.5, -11.2],
                            [12.2, -5.5], [12.2, 6.5],
                            [6.5, 12.2], [-5.5, 12.2],
                        ];
        for (const [ti, tj] of baseGateTorchCoords) {
            const tAsset = mRnd() < 0.5 ? 'BATTLEFIELD:TORCH_A' : 'BATTLEFIELD:TORCH_B';
            const ji = (mRnd() - 0.5) * 0.22;
            const jj = (mRnd() - 0.5) * 0.22;
            pushInteriorDecor(tAsset, ti + ji, tj + jj, 0.88 + mRnd() * 0.08);
        }

        // ── 地理气候环境感知：严格契合历史地理地貌（干旱荒漠/戈壁、高寒雪原、温带山岳与湿润丘陵） ──
        const siteBaseTile = this.environmentPlan?.baseTerrain ?? 'gr1';
        const siteLat = defCityForInterior?.lat ?? this.centerLat ?? 30;
        const siteLng = defCityForInterior?.lng ?? this.centerLng ?? 110;
        const isAridSite = /pal|des|ds5|qs|gravel|drt/.test(siteBaseTile) || (siteLat >= 34 && siteLng <= 104 && siteLng >= 75);
        const isSnowSite = /sno|sn2|snf|snd|snr|ic3|ice/.test(siteBaseTile);

        // 2) 城内庭院园林树木（普通城市候选点随机抽选；严格契合地理树种与季节，兼顾主副乔灌木层次多样性）
        const rawCalSeason = (window as any).game?.timeSystem?.getSeason?.();
        const calSeason: TreeSeason = (rawCalSeason === 0 || rawCalSeason === 1 || rawCalSeason === 2 || rawCalSeason === 3)
            ? rawCalSeason
            : (this.sceneSeason === 2 ? 3 : this.sceneSeason === 1 ? 2 : 1);
        const courtyardTreeAsset = pickTree({
            baseTile: siteBaseTile,
            lat: siteLat,
            lng: siteLng,
            season: calSeason,
            isSiege: true,
            buildingStyle: interiorBldStyle,
        });
        const treeCandidateSlots: ReadonlyArray<readonly [number, number]> = this.defenderCityType === 'big_city'
            ? [[-3.5, -3.5], [4.5, 4.5], [-3.5, 4.5], [4.5, -3.5], [-1.8, -4.8], [1.8, 4.8], [-4.8, 1.8], [4.8, -1.8]]
            : this.defenderCityType === 'medium_city'
                ? [[-2.5, -2.5], [3.5, 3.5], [-2.5, 3.5], [3.5, -2.5], [0.6, -3.6], [-0.6, 3.6]]
                : this.defenderCityType === 'small_city'
                    ? [[-2.2, -2.2], [3.2, 3.2], [-2.2, 3.2], [3.2, -2.2]]
                    : [];
        if (treeCandidateSlots.length > 0) {
            const targetTreeCount = this.defenderCityType === 'big_city'
                ? 3 + Math.floor(mRnd() * 3) // 3~5 棵
                : this.defenderCityType === 'medium_city'
                    ? 2 + Math.floor(mRnd() * 2) // 2~3 棵
                    : 1 + Math.floor(mRnd() * 2); // 1~2 棵
            const pickedTreeSlots = shuffleWithMSeed(treeCandidateSlots).slice(0, targetTreeCount);
            pickedTreeSlots.forEach(([ti, tj], idx) => {
                const jx = (mRnd() - 0.5) * 0.28;
                const jy = (mRnd() - 0.5) * 0.28;
                // 第 1 棵固定当地代表乔木；后续树木有 40% 概率混搭下层园林小树/矮丛，形成自然错落的生态层次
                const treeAsset = (idx > 0 && mRnd() < 0.40)
                    ? (isAridSite ? 'BUSH_TREE_A' : (mRnd() < 0.5 ? 'BUSH_TREE_B' : 'SHRUB_GREEN'))
                    : courtyardTreeAsset;
                pushInteriorDecor(treeAsset, ti + jx, tj + jy, 0.74 + mRnd() * 0.16);
            });
        }

        // 3) 内部生活/军备/自然细节道具库（程序化随机摆放：种类、数量、点位与缩放全面多样化）
        if (this.defenderCityType === 'stockade') {
            // 城寨：粗犷要塞荒野风，以伐木老桩、倒木、野灌木、破车架、粮木桶、碎石为主
            const stockadeCandidates: ReadonlyArray<readonly [number, number]> = [
                [-6.0, 1.2],   // 西北墙根
                [6.0, -1.2],   // 东南墙根
                [-1.5, 6.2],   // 西南角隅
                [1.5, -6.2],   // 东北角隅
                [-2.2, 2.0],   // 营舍西侧空隙
                [2.2, -2.0],   // 营舍东侧空隙
                [-5.5, 3.2],   // 西南木栅内缘
                [5.5, -3.2],   // 东北木栅内缘
                [-3.2, 5.8],   // 南侧外沿近角
                [3.2, -5.8],   // 北侧外沿近角
                [-6.2, -1.5],  // 西北外沿
                [6.2, 1.5],    // 东南外沿
                [-2.0, -2.2],  // 营舍北空隙
                [2.0, 2.2],    // 营舍南空隙
                [-4.2, -3.6],  // 北侧寨墙内角
                [4.2, 3.6],    // 南侧寨墙内角
            ];
            // 候选道具池：混入残桩、倒木、野灌木、粮桶、碎石、破辎重车
            const stockadeFlora = isAridSite
                ? (mRnd() < 0.5 ? 'GRASS_DRY' : 'ROCK1')
                : (mRnd() < 0.5 ? 'BUSH_GREEN' : 'SHRUB_GREEN');
            const stockadePropsPool = [
                'BARRELS',
                stockadeFlora,
                'STUMP_GENERIC',
                'FELLED_GENERIC',
                'BATTLEFIELD:CART_BROKEN',
                'ROCK1',
                'ROCK2',
                'BARRELS',
                stockadeFlora,
            ];
            const stockadeCount = 5 + Math.floor(mRnd() * 3); // 每座城寨随机 5~7 处装饰
            const chosenSlots = shuffleWithMSeed(stockadeCandidates).slice(0, stockadeCount);
            const shuffledPool = shuffleWithMSeed(stockadePropsPool);
            chosenSlots.forEach(([pi, pj], idx) => {
                const pAsset = shuffledPool[idx % shuffledPool.length];
                const ji = (mRnd() - 0.5) * 0.28;
                const jj = (mRnd() - 0.5) * 0.28;
                const pScale = pAsset === 'STUMP_GENERIC' ? (0.72 + mRnd() * 0.08)
                    : pAsset === 'FELLED_GENERIC' ? (0.75 + mRnd() * 0.10)
                    : pAsset === 'BUSH_GREEN' ? (0.74 + mRnd() * 0.12)
                    : pAsset === 'BATTLEFIELD:CART_BROKEN' ? (0.80 + mRnd() * 0.10)
                    : pAsset.startsWith('ROCK') ? (0.68 + mRnd() * 0.12)
                    : (0.78 + mRnd() * 0.10); // BARRELS
                pushInteriorDecor(pAsset, pi + ji, pj + jj, pScale);
            });
        } else if (this.defenderCityType === 'pass') {
            // 险要（关隘）：双重石构城郭、瓮城夹道防线与内城要塞细节
            // 候选点位涵盖：瓮城夹道（两圈城墙之间走廊）、外门内侧防区、内廷营防死角
            // 🔴 [2026-10-20 主人令「东方险要改矩形」] 矩形双圈（内 21×13 / 外 29×21）的夹道在 i 向 −12.5 / j 向 ±8.5：
            //    方形那组里的 [±9.5~10.5, 0.5] 在矩形下会落回内城里压内墙 ⇒ 矩形换一组按 inner/outer 半长中点算的点位。
            const passCandidates: ReadonlyArray<readonly [number, number]> = this.defenderPassShape === 'rect'
                ? [
                    // 瓮城夹道四边中点（i 半长内 10.5→外 14.5 取 12.5、j 半长 6.5→10.5 取 8.5）
                    [-12, 0.5], [13, 0.5], [0.5, -8], [0.5, 9],
                    // 夹道四角
                    [-12, -8], [13, -8], [-12, 9], [13, 9],
                    // 夹道长边中段
                    [-6, -8], [7, -8], [-6, 9], [7, 9],
                    // 内城要塞四隅与城堡夹道（与方形同一组，矩形内城中心不变）
                    [-2.2, 2.2], [3.2, -2.2], [-2.2, -2.2], [3.2, 3.2],
                ]
                : [
                    // 瓮城夹道四面走廊（内墙与外墙之间空当）
                    [-9.5, 0.5],   // 西夹道中
                    [10.5, 0.5],   // 东夹道中
                    [0.5, -9.5],   // 北夹道中
                    [0.5, 10.5],   // 南夹道中
                    [-8.5, -4.5],  // 西北夹道
                    [8.5, 4.5],    // 东南夹道
                    [-4.5, -8.5],  // 东北夹道偏北
                    [4.5, 8.5],    // 西南夹道偏南
                    [-8.5, 4.5],   // 西南夹道偏西
                    [8.5, -4.5],   // 东北夹道偏东
                    [-4.5, 8.5],   // 西南夹道走廊
                    [4.5, -8.5],   // 东北夹道走廊
                    // 内城要塞四隅与城堡夹道
                    [-2.2, 2.2],   // 内城西侧
                    [3.2, -2.2],   // 内城东侧
                    [-2.2, -2.2],  // 内城北空隙
                    [3.2, 3.2],    // 内城南空隙
                ];
            // 军备防御道具池：拒马、礌石擂石、战备粮箱粮桶、破损辎重车、城根荒野灌木
            const passFlora = isAridSite ? 'GRASS_DRY' : (mRnd() < 0.5 ? 'BUSH_GREEN' : 'SHRUB_GREEN');
            const passPropsPool = [
                'BATTLEFIELD:STAKE_BARRICADE',
                'BATTLEFIELD:STAKE_BARRICADE',
                'ROCK1',
                'ROCK2',
                'BARRELS',
                'BARRELS',
                'BATTLEFIELD:CART_BROKEN',
                passFlora,
                isAridSite ? 'ROCK2' : 'SHRUB_GREEN',
            ];
            const passPropCount = 7 + Math.floor(mRnd() * 3); // 7~9 处细节
            const chosenPassSlots = shuffleWithMSeed(passCandidates).slice(0, passPropCount);
            const shuffledPassPool = shuffleWithMSeed(passPropsPool);
            chosenPassSlots.forEach(([pi, pj], idx) => {
                const pAsset = shuffledPassPool[idx % shuffledPassPool.length];
                const ji = (mRnd() - 0.5) * 0.25;
                const jj = (mRnd() - 0.5) * 0.25;
                const pScale = pAsset === 'BATTLEFIELD:STAKE_BARRICADE' ? (0.85 + mRnd() * 0.10)
                    : pAsset === 'BATTLEFIELD:CART_BROKEN' ? (0.80 + mRnd() * 0.10)
                    : pAsset.startsWith('BUSH') || pAsset.startsWith('SHRUB') ? (0.74 + mRnd() * 0.12)
                    : pAsset.startsWith('ROCK') ? (0.72 + mRnd() * 0.14)
                    : (0.80 + mRnd() * 0.10); // BARRELS
                pushInteriorDecor(pAsset, pi + ji, pj + jj, pScale);
            });
        } else {
            // 普通城市（大/中/小）：后勤粮桶、街角野灌木、破损辎重车、碎石杂物
            const cityCandidates: ReadonlyArray<readonly [number, number]> = this.defenderCityType === 'big_city'
                ? [
                    [-2.2, 3.2], [3.2, -2.2], [-2.2, -2.2], [3.2, 3.2],
                    [-1.8, -6.5], [6.5, 1.8], [-6.5, -1.8], [1.8, 6.5],
                    [-7.2, 1.5], [7.2, -1.5], [-1.5, 7.2], [1.5, -7.2],
                    [-4.2, -4.2], [4.2, 4.2], [-4.2, 4.2], [4.2, -4.2],
                ]
                : this.defenderCityType === 'medium_city'
                    ? [
                        [-2.2, 2.6], [3.2, -1.6], [-2.2, -2.2], [3.2, 2.2],
                        [-1.8, -5.5], [5.5, 1.8], [-5.5, -1.8], [1.8, 5.5],
                        [-6.2, 1.5], [6.2, -1.5], [-1.5, 6.2], [1.5, -6.2],
                    ]
                    : [
                        [-2.2, 2.4], [3.2, -1.4], [-1.8, -4.5], [4.5, 1.8],
                        [-4.5, -1.8], [1.8, 4.5], [-5.2, 1.5], [5.2, -1.5],
                        [-1.5, 5.2], [1.5, -5.2],
                    ];
            const cityPropsPool = [
                'BARRELS',
                'BARRELS',
                'BUSH_GREEN',
                'BATTLEFIELD:CART_BROKEN',
                'ROCK1',
                'ROCK2',
            ];
            const cityPropCount = this.defenderCityType === 'big_city'
                ? 6 + Math.floor(mRnd() * 3) // 6~8 个
                : this.defenderCityType === 'medium_city'
                    ? 4 + Math.floor(mRnd() * 3) // 4~6 个
                    : 3 + Math.floor(mRnd() * 2); // 3~4 个
            const chosenCitySlots = shuffleWithMSeed(cityCandidates).slice(0, cityPropCount);
            const shuffledCityPool = shuffleWithMSeed(cityPropsPool);
            chosenCitySlots.forEach(([pi, pj], idx) => {
                const pAsset = shuffledCityPool[idx % shuffledCityPool.length];
                const ji = (mRnd() - 0.5) * 0.25;
                const jj = (mRnd() - 0.5) * 0.25;
                const pScale = pAsset === 'BUSH_GREEN' ? (0.74 + mRnd() * 0.12)
                    : pAsset === 'BATTLEFIELD:CART_BROKEN' ? (0.80 + mRnd() * 0.10)
                    : pAsset.startsWith('ROCK') ? (0.68 + mRnd() * 0.12)
                    : (0.80 + mRnd() * 0.10); // BARRELS
                pushInteriorDecor(pAsset, pi + ji, pj + jj, pScale);
            });
        }
    }

    // ── 按真实山地地理与据点种子，在城外围的高地平顶台面（>= 1.8 级）中心摆放 DE 大山模型（MOUNTAIN_01~11，缩放 2.0，纯视觉点缀绝不挡路） ──
    const defCity: any = this.defenderCityRecord();
    const cLat = defCity?.lat ?? this.centerLat;
    const cLng = defCity?.lng ?? this.centerLng;
    const cId = this.defenderCityId ?? '';
    const elevM = this.environmentPlan?.elevationM ?? 0;
    const slopeDeg = this.environmentPlan?.slopeDeg ?? 0;
    const elevBand = this.environmentPlan?.elevationBand;
    const isHighlandSite = !EXCLUDED_PASS_IDS.has(cId) && (
        elevBand === 'mountain' || elevBand === 'alpine' || elevBand === 'high_alpine' || elevBand === 'snow' || elevM >= 550 || slopeDeg >= 2.5
    );
    const shouldSpawnDeMountains = this.passMountainConfig?.enabled !== undefined
        ? this.passMountainConfig.enabled
        : (this.defenderCityType === 'pass'
            ? isMountainPass(cId, cLat, cLng, defCity?.name)
            : !EXCLUDED_PASS_IDS.has(cId));
    if (shouldSpawnDeMountains) {
        const isSnowScene = this.sceneSeason === 2
            || this.environmentPlan?.biome === 'tundra_snow'
            || gl.isIce
            || !!(this.environmentPlan?.baseTerrain && /^(sno|sn2|snf|snd|snr|ic3|ice)/i.test(this.environmentPlan.baseTerrain));
        const pool = getClimateMountainPool.call(this, isSnowScene);
        // 扫描远郊高地平顶台面中心：
        //   1) 远离城墙与护城河（dCells >= minHillDistCells + 9.5，且屏幕椭圆外扩 >= 920×520px）；
        //   2) 严格避开四门进出军大道与桥头延长线（di >= 8.5 && dj >= 8.5），只落在正北/正南/正东/正西四翼远郊高地；
        //   3) 避开左侧攻方主冲锋走廊与所有出生点（>= 780px），且山脚 3 格半径内不沾水体。
        const isMountainSafeSpot = (gx: number, gy: number, pt: { x: number; y: number }): boolean => {
            if (((pt.x - cx) / (rx + 920)) ** 2 + ((pt.y - cy) / (ry + 520)) ** 2 < 1.0) return false;
            const u = (pt.x - cx) / (TAC_TILE_W / 2), v = (pt.y - cy) / (TAC_TILE_H / 2);
            const di = Math.abs((u + v) / 2 - 0.5), dj = Math.abs((v - u) / 2 - 0.5);
            if (di < 8.5 || dj < 8.5) return false;
            if (pt.x < cx && Math.abs(pt.y - cy) < 680) return false;
            for (const sp of this.spawns) {
                if (Math.hypot(pt.x - sp.x, (pt.y - sp.y) * 1.5) < 780) return false;
            }
            for (const dy of [-3, 0, 3]) {
                for (const dx of [-3, 0, 3]) {
                    const fp = gl.cellToScreen(gx + 0.5 + dx, gy + 0.5 + dy, W, H);
                    if (gl.isWaterAt(fp.x, fp.y, W, H) || (inMoat && inMoat(fp.x, fp.y)) || inGateRoad(fp.x, fp.y) || inCity(fp.x, fp.y)) {
                        return false;
                    }
                }
            }
            return true;
        };
        const hillCandidates: Array<{ x: number; y: number; elev: number; score: number }> = [];
        for (const minElev of [1.8, 1.35]) {
            for (let gy = 6; gy <= N - 6; gy += 2) {
                for (let gx = 6; gx <= N - 6; gx += 2) {
                    const dCells = Math.hypot(gx - cGx, gy - cGy);
                    if (dCells < minHillDistCells + 9.5 || dCells > 52) continue;
                    const pt = gl.cellToScreen(gx + 0.5, gy + 0.5, W, H);
                    if (!isMountainSafeSpot(gx, gy, pt)) continue;
                    const elev = gl.elevationLevelAt(pt.x, pt.y, W, H);
                    if (elev < minElev) continue;
                    const pL = gl.cellToScreen(gx - 0.5, gy + 0.5, W, H);
                    const pR = gl.cellToScreen(gx + 1.5, gy + 0.5, W, H);
                    const pU = gl.cellToScreen(gx + 0.5, gy - 0.5, W, H);
                    const pD = gl.cellToScreen(gx + 0.5, gy + 1.5, W, H);
                    const nbrElev = (
                        gl.elevationLevelAt(pL.x, pL.y, W, H) +
                        gl.elevationLevelAt(pR.x, pR.y, W, H) +
                        gl.elevationLevelAt(pU.x, pU.y, W, H) +
                        gl.elevationLevelAt(pD.x, pD.y, W, H)
                    ) * 0.25;
                    if (nbrElev < minElev - 0.2) continue;
                    const plateauScore = elev * 0.65 + nbrElev * 0.35;
                    hillCandidates.push({
                        x: pt.x + (mRnd() - 0.5) * 16,
                        y: pt.y + (mRnd() - 0.5) * 10,
                        elev,
                        score: plateauScore + mRnd() * 0.35,
                    });
                }
            }
            if (hillCandidates.length >= 2) break;
        }
        hillCandidates.sort((a, b) => b.score - a.score);
        const targetCount = this.defenderCityType === 'pass'
            ? (2 + (mRnd() < 0.45 ? 1 : 0))
            : isHighlandSite
                ? (1 + Math.floor(mRnd() * 2))
                : 1;
        const chosenPts: Array<{ x: number; y: number }> = [];
        let placed = 0;
        for (const cand of hillCandidates) {
            if (placed >= targetCount) break;
            let mx = cand.x, my = cand.y;
            if (placed === 0 && this.passMountainConfig?.x !== undefined) mx = this.passMountainConfig.x;
            if (placed === 0 && this.passMountainConfig?.y !== undefined) my = this.passMountainConfig.y;
            if (placed === 1 && this.passMountainConfig?.northX !== undefined) mx = this.passMountainConfig.northX;
            if (placed === 1 && this.passMountainConfig?.northY !== undefined) my = this.passMountainConfig.northY;
            if (chosenPts.some((p) => Math.hypot(p.x - mx, (p.y - my) * 1.6) < 1350)) continue;
            chosenPts.push({ x: mx, y: my });
            const pick = pool[Math.floor(mRnd() * pool.length)];
            const mAsset = (placed === 0 && this.passMountainConfig?.asset)
                ? this.passMountainConfig.asset
                : (placed === 1 && this.passMountainConfig?.northAsset)
                    ? this.passMountainConfig.northAsset
                    : pick;
            // 🔴 [2026-10-18 主人令「调大2.0」] 大山模型默认缩放调为 2.0
            const mScale = (placed === 0 && this.passMountainConfig?.scale !== undefined)
                ? this.passMountainConfig.scale
                : (placed === 1 && this.passMountainConfig?.northScale !== undefined)
                    ? this.passMountainConfig.northScale
                    : 2.0;
            const mFlip = (placed === 0 && this.passMountainConfig?.flip !== undefined)
                ? this.passMountainConfig.flip
                : (placed === 1 && this.passMountainConfig?.northFlip !== undefined)
                    ? this.passMountainConfig.northFlip
                    : (mRnd() < 0.5);
            this.ensureNatureAsset(mAsset);
            this.decorSprites.push({
                asset: mAsset,
                frame: 0,
                x: mx,
                y: my,
                flip: mFlip,
                layer: 'world',
                z: 0,
                scale: mScale,
                indestructible: true,
                obstruction: undefined,
                obstructionContactSec: 0,
                obstructionTouched: false,
                obstructionDisabled: true,
            });
            placed++;
        }
    }

    for (const sp of this.decorSprites) {
        sp.lift = (sp.asset.startsWith('BUILDING') || sp.asset === '') ? undefined : gl.elevationLiftAt(sp.x, sp.y, W, H);
    }
}

/**
 * 按当前战场地表、气候带与海拔严格选取匹配的 DE 大山素材池（MOUNTAIN_01~11）：
 *   · 冰雪底图 / 寒冬雪景（isSnowScene）：['MOUNTAIN_09', 'MOUNTAIN_10', 'MOUNTAIN_11']（全雪山脚至山顶）
 *   · 干旱沙漠 / 戈壁 / 黄土 / 干草原 / 砂砾地表：['MOUNTAIN_03', 'MOUNTAIN_04']（黄褐干岩荒山，无雪无绿草，修复麦加等沙漠出现雪山或青山 BUG）
 *   · 非干旱极高山（海拔 >= 2600m 或 high_alpine）：['MOUNTAIN_06', 'MOUNTAIN_07', 'MOUNTAIN_08']（雪顶绿坡高山）
 *   · 温带 / 热带绿地与森林地表：['MOUNTAIN_01', 'MOUNTAIN_02', 'MOUNTAIN_05']（纯翠绿山麓青山，无积雪、无黄沙底座）
 */
export function getClimateMountainPool(this: Scene13WarLayer, isSnowScene: boolean): string[] {
    if (isSnowScene) {
        return ['MOUNTAIN_09', 'MOUNTAIN_10', 'MOUNTAIN_11'];
    }
    const bt = String(this.environmentPlan?.baseTerrain ?? '');
    const biome = String(this.environmentPlan?.biome ?? '');
    const isAridOrDryGround = /^(des|pal|pal1|qs|ds2|ds5|gr5|gr7|gravel_default|rck)$/i.test(bt)
        || biome === 'desert'
        || biome === 'savanna'
        || biome === 'cold_steppe';
    if (isAridOrDryGround) {
        return ['MOUNTAIN_03', 'MOUNTAIN_04'];
    }
    const elevM = this.environmentPlan?.elevationM ?? 0;
    const elevBand = this.environmentPlan?.elevationBand;
    if (elevM >= 2600 || elevBand === 'high_alpine' || elevBand === 'snow') {
        return ['MOUNTAIN_06', 'MOUNTAIN_07', 'MOUNTAIN_08'];
    }
    return ['MOUNTAIN_01', 'MOUNTAIN_02', 'MOUNTAIN_05'];
}

/** 地基层 DOM 跟着镜头走：城心屏幕位置 ＝ 画布中心 ＋ 平移 ＋ (城心 − 中心) × 缩放 */
export function syncDeCityGround(this: Scene13WarLayer): void {
    const el = this.deCityGround, c = this.deCity, cv = this.canvas;
    if (!el || !c || !cv) return;
    // 🔴 [2026-10-13 主人令「PASS的内城套上和中城一样的地基地图」] 允许 pass 正常展示内城地基
    if (!this.useGroundGL || (!this.active && !this.lingering)) {
        el.style.display = 'none';
        return;
    }
    const z = this.tacticalZoom;
    const lift = this.elevationLiftAt(this.deCityCenter.x, this.deCityCenter.y);
    const sx = cv.width / 2 + this.tacticalPanX + (this.deCityCenter.x - this.worldCX) * z;
    const sy = cv.height / 2 + this.tacticalPanY + (this.deCityCenter.y - lift - this.worldCY) * z;
    el.style.display = 'block';
    el.style.opacity = cv.style.opacity;
    el.style.transform = `translate(${sx - (c.width / 2) * z}px, ${sy - (c.height / 2) * z}px) scale(${z})`;
}

export function applySpawnBuildings(this: Scene13WarLayer): void {
    const sides: Array<0 | 1> = [0, 1];
    for (const f of sides) applyBuildingsForSide.call(this, f);
}

export function applyBuildingsForSide(this: Scene13WarLayer, f: 0 | 1): void {
    // 玩家自带精锐是临时追加的战术出兵位，不属于军团九格编制；
    // 若把它计入这里，守城方会因 10 !== 9 提前返回，整座城墙都不生成。
    // 🔴 [2026-09-23] 主将队（第 10 口，前排再往前）不是编制建筑位：不计入，否则拒马挤在主将一口前、营地城墙因 10≠9 全不生成
    const side = this.spawns.filter((s) => s.f === f && !s.playerElite && !s.commander);
    // 🔴 [2026-10-11] 新战术模式攻城战守方：城池＝战略地图同款，整座摆在地图中心（不再走下面旧 13 的「右侧直墙＋九口建筑」）
    if (f === 1 && this.deCity) { buildDeCity.call(this); return; }
    // 攻击方（攻城/野战）、野战防守方，以及**攻城城寨(stockade)/漠北蒙古(MOBEI_MONGOL)守方**都在最前排营地前铺一道木桩拒马线。
    // 其余攻城守方（中城/大城/关隘）有城墙，不摆（主人 2026-09-03：城寨前面用拒马，不用篱笆）。
    const skipBarricade = this.battleType === 'siege' && f === 1 && this.defenderCityType !== 'stockade' && !this.isMobeiMongolDefender();
    if (!skipBarricade && side.length > 0) {
        const barricadeAsset = 'BATTLEFIELD:STAKE_BARRICADE';
        // 🔴 [2026-10-11 主人令「攻方在右，拒马就反了，营地应该放一圈拒马」＋「拒马应该是照着敌方的方向」]
        //    原实现：只在「最前排那一列」外侧铺一条竖线，`x = frontX ± 180`、`flip` 按攻/守写死 ——
        //    攻方被镜像到右边时，这条线画在哪一侧、朝哪边全是反的。
        //    现改成：**围营地一圈**，且每一根的朝向**照敌方**——把「朝敌那一侧」的拒马镜像过去，
        //    使拒马正面一律与营心→敌方的方向对齐（不再按攻/守写死，也不受左右镜像影响）。
        const CEN = { x: side.reduce((a, p) => a + p.x, 0) / side.length, y: side.reduce((a, p) => a + p.y, 0) / side.length };
        const spread = Math.max(...side.map((p) => Math.hypot(p.x - CEN.x, p.y - CEN.y)));
        // 🔴 [2026-10-11 主人令「拒马太密，太多了，应该分布在营地外」]
        //    改前：圈半径 = spread + 48 ⇒ 紧贴九口外接、**压在营帐上**；桩距 = 0.9×素材宽 ⇒ 密到看不出是拒马。
        //    改后：圈半径 = spread + 200（**挪到营地外**，清开帐篷/箭塔/哨站的外沿）；
        //          桩距 = 3.4×素材宽（约 163px，**根数减少约一半**），一圈只留必要的疏朗几根。
        const ringR = spread + 200;                              // 营地外沿再放 200px
        const BAR_HALF_W = 48;                                   // 素材框宽 96
        const barricadeCount = Math.max(8, Math.round((2 * Math.PI * ringR) / (BAR_HALF_W * 3.4)));
        // 敌方方向：由「己方营心 → 敌方营心」定；拿不到就用本阵前进向量兜底
        const foeSide = this.spawns.filter((s) => s.f !== f);
        const foeCen = foeSide.length
            ? { x: foeSide.reduce((a, p) => a + p.x, 0) / foeSide.length, y: foeSide.reduce((a, p) => a + p.y, 0) / foeSide.length }
            : { x: CEN.x + this.advanceVec[f].x * 1000, y: CEN.y + this.advanceVec[f].y * 1000 };
        const EX = foeCen.x - CEN.x, EY = foeCen.y - CEN.y;
        const eLen = Math.hypot(EX, EY) || 1;
        const ex = EX / eLen, ey = EY / eLen;
        /** 拒马正面是否朝敌：素材正面朝西南（屏幕 (-0.707,+0.707)），用「由营心指向该根」的法线点乘敌方向判定 */
        const faceEnemy = (dx: number, dy: number): boolean => (dx * ex + dy * ey) > 0;
        this.ensureNatureAsset(barricadeAsset);
        for (let i = 0; i < barricadeCount; i++) {
            const a = (i / barricadeCount) * Math.PI * 2;
            const dx = Math.cos(a), dy = Math.sin(a) * 0.58;     // 等距压缩（与地面同一 2.5D 比例）
            this.decorSprites.push({
                asset: barricadeAsset, frame: 0,
                x: CEN.x + dx * ringR,
                y: CEN.y + dy * ringR,
                flip: faceEnemy(dx, dy),
                scale: 1.0,
                layer: 'world', z: 0,
                obstruction: undefined,
                obstructionContactSec: 0, obstructionTouched: false, obstructionDisabled: true,
            });
        }
    }
    if (side.length !== 9) return;
    const camps = ['CAMP_ARCHERY_RANGE', 'CAMP_BARRACKS', 'CAMP_STABLE'];
    const shuffledCamps = [...camps].sort(() => Math.random() - 0.5);
    const place = (
        s: { x: number; y: number },
        asset: string,
        options?: {
            flip?: boolean;
            frame?: number;
            z?: number;
            scale?: number;
            obstruction?: { x: number; y: number };
            indestructible?: boolean;
        },
    ): DecorSprite => {
        // 🔴 [2026-10-03 主人令「请把所有的中城和大城的都设计为城堡居中」] 原先此处有一道硬闸：
        //    「战略大城不含城堡」——凡战术大城（battleType=siege 守方）落 CASTLE 素材，一律换成 TOWN_CENTER_AGE4。
        //    该闸来自旧口径（中城/大城九建筑都不含城堡），与主人本令直接冲突 → **已撤除**，大城城堡照落。
        const full = 'BUILDING:' + asset;
        this.ensureNatureAsset(full);
        const px = s.x, py = s.y;
        // 🔴 [2026-10-11 主人令「我们现在这里的战术地图都是陆战，就算地图中有水，也都是属于浅水可以通行的区域。请酌情处理。」
        //    ＋ 上一条「有的地图中，士兵不出现在出兵口，出兵口应该是营地的建筑」]
        //    **撤除 2026-08-26 的「安全占地修正」**（原逻辑：出兵口建筑若落在水域就沿 x 一步步挪开，最多 15×25=375px）。
        //    撤除理由：① 本模式全是陆战、水一律是**可通行的浅水**，营帐落在浅水上不必避；
        //    ② 那段挪移会让**建筑离开出兵口**，而士兵仍从原格出来 ⇒ 「有的地图里士兵不出现在营帐」。
        //    撤掉之后：出兵口与营地建筑**永远同格**（实测逐格 0px），士兵一律从自己的营帐里出来。
        //    对照：士兵阵位的避水更早（2026-10-11 主人令「水/树林/建筑一律可通行」）就已删除，此行是补齐同一口径。
        return {
            asset: full,
            frame: options?.frame ?? 0,
            x: px,
            y: py,
            flip: options?.flip ?? (Math.random() < 0.5),
            layer: 'world',
            z: options?.z ?? 0,
            scale: options?.scale,
            obstruction: options?.obstruction,
            indestructible: options?.indestructible,
            obstructionContactSec: 0,
            obstructionTouched: false,
            obstructionDisabled: false,
        };
    };

    // 蒙古（草原游牧）营地：8 蒙古包 + 1 瞭望塔（不用通用营地/帐篷/城内建筑）
    // 🔴 [2026-08-22 主人定] 只用真蒙古包 E~L（A~D 是茅草屋,弃用）——DE b_scen_yurt_e..l, 共 8 个正好用满
    const placeYurtCamp = (
        scale?: number,
        availableSpawns = side,
        towerScale = SIEGE_CITY_BUILDING_SCALE,
        /**
         * 🔴 [2026-10-15 主人令「我们算建筑，有坍塌动画的都是建筑」]
         *  defenderSettlement=true  = **守方的毡帐聚落**（＝该城的 9 建筑：8 蒙古包 + 1 瞭望塔）：
         *                            走 `trackCityBuilding`（可被打 + 照常射箭）。
         *  defenderSettlement=false = **攻方营寨 / 野战营寨**：同样**登记为建筑**（有 DE 血量、
         *                            受伤掉血、血归零走 DE 倒塌链），但**不射箭**（不挂 cityBuildings）。
         */
        defenderSettlement = false,
    ): void => {
        if (availableSpawns.length === 0) return;
        const shuffledSpawns = [...availableSpawns].sort(() => Math.random() - 0.5);
        const yurts = ['YURT_E', 'YURT_F', 'YURT_G', 'YURT_H', 'YURT_I', 'YURT_J', 'YURT_K', 'YURT_L'];
        const shuffledYurts = [...yurts].sort(() => Math.random() - 0.5);
        for (let i = 0; i < shuffledSpawns.length - 1; i++) {
            const sp = place(shuffledSpawns[i], shuffledYurts[i], { scale });
            this.decorSprites.push(sp);
            if (defenderSettlement) {
                this.trackCityBuilding(sp);     // 守方毡帐聚落 = 9 建筑（可被打 + 射箭）
            } else {
                this.registerDefBuilding(sp, shuffledYurts[i], undefined, undefined, f as 0 | 1);   // 营寨 = 建筑（可被打，不射箭）
                this.ensureDestrAssetsFor(shuffledYurts[i]);
            }
        }
        // 🔴 [2026-08-26 主人定「战略和战术的建筑保持一致」] 蒙古营地塔 = 亚洲瞭望塔（ASIA_TOWER_AGE2），
        //    与战略地图草原营地同款（弃 AFRI 茅草顶木架哨塔）。
        // 🔴 [2026-10-03 主人令] 塔（箭塔族）**不跟营帐用同一缩放**：一律与守方箭塔的 `SIEGE_CITY_BUILDING_SCALE` 对齐，
        //    否则攻方营地的塔比守方城墙内侧的箭塔大一圈（营帐仍按调用方给的 scale，不动）。
        // 🔴 [2026-10-15 主人令] 这座塔同样算建筑：守方毡帐城要登记成第 9 栋（可打 + 射箭）；
        //    攻方营寨的塔也登记（可打、会塌），只是不射箭。
        const towerAsset = 'ASIA_TOWER_AGE2';
        const towerSp = place(shuffledSpawns[shuffledSpawns.length - 1], towerAsset, { scale: towerScale });
        this.decorSprites.push(towerSp);
        if (defenderSettlement) {
            this.trackCityBuilding(towerSp);
        } else {
            this.registerDefBuilding(towerSp, towerAsset, undefined, undefined, f as 0 | 1);
            this.ensureDestrAssetsFor(towerAsset);
        }
    };

    // 攻城战守方：城墙 + 按城等级选建筑池（大城=帝国时代 age4；中城=城堡时代 age3；小城/险要=封建时代 age2）
    if (this.battleType === 'siege' && f === 1) {
        // 城内特殊建筑优先显示：主奇观占最中央落点，附加奇观依次由中心向外占位。
        // 纯视觉（BUILDING: 前缀单帧，无碰撞，不破坏阵型），并明确标记为不可坍塌。
        const wonderAssets: string[] = [];
        const wonderSpots: Array<{ x: number; y: number }> = [];
        if (this.defenderCityId) {
            // 🔴 [2026-10-20 主人令「给所有的特殊建筑也设计一个建城年，和据点一样。不到时间不显示。」]
            //    这一场那年还没建成的奇观不立（乱斗模式 / 编辑器闸门为 null → 照旧全部显示）。
            const mainWonder = CITY_WONDER[this.defenderCityId];
            if (mainWonder && isWonderFounded(mainWonder)) wonderAssets.push(mainWonder);
            const extraWonders = CITY_WONDER_EXTRA[this.defenderCityId];
            if (extraWonders) for (const ex of extraWonders) if (isWonderFounded(ex.asset)) wonderAssets.push(ex.asset);
        }
        if (wonderAssets.length > 0) {
            const centerX = side.reduce((sum, s) => sum + s.x, 0) / side.length;
            const centerY = side.reduce((sum, s) => sum + s.y, 0) / side.length;
            const centerPrioritySide = [...side].sort((a, b) => {
                const da = Math.hypot(a.x - centerX, a.y - centerY);
                const db = Math.hypot(b.x - centerX, b.y - centerY);
                return da - db || a.y - b.y || a.x - b.x;
            });
            for (let i = 0; i < wonderAssets.length; i++) {
                const spot = centerPrioritySide[Math.min(i, centerPrioritySide.length - 1)];
                wonderSpots.push(spot);
                const wsp = place({ x: spot.x, y: spot.y }, wonderAssets[i], { z: 2, scale: SIEGE_WONDER_SCALE });
                this.decorSprites.push(wsp);
                this.trackCityBuilding(wsp, 'WONDER');
            }
        }
        // 普通建筑池避开特殊建筑占用的落点，不与其重叠。
        const buildingSide = wonderSpots.length > 0
            ? side.filter((s) => !wonderSpots.some((w) => w.x === s.x && w.y === s.y))
            : side;
        const style = this.buildingStyleFor(1);
        // 🔴 [2026-09-16 主人定]「二级蒙古的大中小城中的 9 建筑添加蒙古包随机，总体不能超过 9 个。」
        //    守城方是**二级「蒙古」**（据点 buildingStyle === 'MONGOL'，不是三级漠北蒙古）时，
        //    大/中/小城的 9 建筑池里随机掺入 8 个真蒙古包（YURT_E~L，目录名直传 place() → 无风格前缀问题），
        //    最终栋数**恒为 9**（与战略地图 TerritorySystem、据点编辑页完全同一口径）。
        const defenderCity: any = this.defenderCityRecord();
        const defenderIsMongol = !!defenderCity && defenderCity.buildingStyle === 'MONGOL';
        const cityPoolBuildings = (base: string[]): string[] =>
            defenderIsMongol ? [...base, ...MONGOL_CITY_YURTS] : [...base];
        const isYurtAsset = (b: string): boolean => b.startsWith('YURT_');
        // 城墙/城门 = 装饰贴图 + 碰撞阻挡（照 DE，不可攻击）：铺贴图 + 建碰撞格（士兵不打墙、但 30 秒塌墙前被挡在城外）
        // 🔴 [2026-08-22 主人需求] 30 秒随机塌一半城墙，塌掉的墙段放行 + 留残骸：
        //    城门 → 播 50 帧倒塌动画 → 留 rubble 残骸；石墙/垛墙 → 切 D75 残垣；木栅栏 → 切木门 rubble 残骸。
        const placeWall = (s: { x: number; y: number }, asset: string, key: 'STONE_WALL' | 'STONE_GATE', linked = false): void => {
            // 🔴 [2026-09-18] 毡帐险要按战略地图**无围墙**（buildYurtCampHtml(fence=false)）：一段都不铺
            if (wallMat === 'NONE') return;
            // 城墙 = 可攻击建筑（照 DE）：士兵能打、HP 归零破墙；碰撞 0.95 堵住相邻段缝隙
            const sprite = place(s, asset, { flip: false, z: 1, obstruction: { x: 0.95, y: 0.95 } });
            this.decorSprites.push(sprite);
            // 木栅栏/篱笆走 WOOD_WALL 档（hp 250、防 2/5）；石墙/垛墙才是 STONE_WALL
            const wKey = (asset.includes('PALISADE') || asset.includes('FENCE')) ? 'WOOD_WALL' : key;
            const st = WALL_GATE_STATS[wKey];
            // 石墙/垛墙有破损档 destr_*（破墙前按 HP 渐进切换）；坍塌时统一播放 DE 1x1 坍塌动画 FOUNDATION_1X1_DESTR
            const isFence = asset.includes('FENCE');
            const destrAssets = (asset.includes('PALISADE') || isFence) ? undefined : ['D25', 'D50', 'D75'].map((t) => `${asset}_${t}`);
            if (destrAssets) for (const d of destrAssets) this.ensureNatureAsset('BUILDINGANIM:' + d);
            const wallRubble = isFence ? 'BATTLEFIELD:FENCE_RUBBLE' : 'FOUNDATION_1X1_RUBBLE';
            if (isFence) {
                this.ensureNatureAsset('BATTLEFIELD:FENCE_RUBBLE');
            } else {
                this.ensureNatureAsset('BUILDINGANIM:FOUNDATION_1X1_DESTR');
                this.ensureNatureAsset('BUILDINGANIM:FOUNDATION_1X1_RUBBLE');
            }
            this.wallGates.push({ f: 1, key: wKey, x: s.x, y: s.y, hp: st.hp, maxHp: st.hp, claims: 0, claimsNext: 0, atkNext: 0, atkers: 0, sprite, linked, destrAssets, rubbleAsset: wallRubble });
        };
        // 城门：可攻击建筑（照 DE，城门 HP 更高），沿线铺 6 点密实碰撞体堵跨度两侧缝隙；破门播 100 帧倒塌动画 → rubble 残骸
        const placeGate = (s: { x: number; y: number }, asset: string, dir: 'NE' | 'SE'): void => {
            // 🔴 [2026-09-18] 同 placeWall：毡帐险要无围墙，也就没有城门
            if (wallMat === 'NONE') return;
            const sprite = place(s, asset, { flip: false, z: 1, obstruction: { x: 0.95, y: 0.95 } });
            this.decorSprites.push(sprite);
            // 🔴 [2026-10-13 全面体检抓出·已修] 木栅栏门/篱笆门原套 `STONE_GATE` 的血甲（1650 + 6/6），
            //    与相邻木墙（`WOOD_WALL` 540/2/5）差 3 倍。木门照木墙档；**key 仍写 'STONE_GATE'**（不新增键，
            //    否则城门倒塌链认不出它 —— 木门会打不烂）。
            const st = (asset.includes('FENCE') || asset.includes('PALISADE')) ? WALL_GATE_STATS.WOOD_WALL : WALL_GATE_STATS.STONE_GATE;
            const extraSprites: DecorSprite[] = [];
            const dSign = dir === 'NE' ? -1 : 1;
            for (let step = -3; step <= 3; step++) {
                if (step === 0) continue;
                const extra: DecorSprite = {
                    asset: '', frame: 0, x: s.x + step * 24, y: s.y + step * 12 * dSign, flip: false, layer: 'world', z: 1,
                    obstruction: { x: 0.95, y: 0.95 },
                    obstructionContactSec: 0, obstructionTouched: false, obstructionDisabled: false,
                };
                this.decorSprites.push(extra);
                extraSprites.push(extra);
            }
            // 城门倒塌动画 + 残骸素材（DE gate_*_destruction / _rubble；篱笆门用 DE b_scen_fence_rubble）
            const isFenceGate = asset.includes('FENCE');
            let rubbleAsset: string;
            if (isFenceGate) {
                rubbleAsset = 'BATTLEFIELD:FENCE_RUBBLE';
                this.ensureNatureAsset(rubbleAsset);
            } else {
                rubbleAsset = `${asset}_RUBBLE`;
                this.ensureNatureAsset('BUILDINGANIM:' + `${asset}_DESTR`);
                this.ensureNatureAsset('BUILDINGANIM:' + rubbleAsset);
            }
            this.wallGates.push({ f: 1, key: 'STONE_GATE', x: s.x, y: s.y, hp: st.hp, maxHp: st.hp, claims: 0, claimsNext: 0, atkNext: 0, atkers: 0, sprite, extraSprites, linked: true, rubbleAsset });
        };
        // 🔴 [2026-08-22 主人定] 梯子型平档城防：扩大城郭范围，100%完整包含全部内城建筑群
        let wMinX = Infinity, wMaxX = -Infinity, wMinY = Infinity, wMaxY = -Infinity;
        for (const s of side) {
            if (s.x < wMinX) wMinX = s.x;
            if (s.x > wMaxX) wMaxX = s.x;
            if (s.y < wMinY) wMinY = s.y;
            if (s.y > wMaxY) wMaxY = s.y;
        }
        // 🔴 [主人明确指示 2026-08-22] 正统 C 型三面包卫宏伟城堡要塞防线：正面垂直主长城向前推进 120px，彻底包裹全部内城建筑
        const wallFrontX = Math.round(wMinX - 380);
        const midY = (wMinY + wMaxY) * 0.5;
        const pitch = 40; // 垂直直墙咬合步长
        const pitchDx = 48; // 等距斜向 X 步长
        const pitchDy = 24; // 等距斜向 Y 步长

        const topWallY = midY - 8.5 * pitch;
        const botWallY = midY + 8.5 * pitch;

        // 🔴 [2026-10-01 主人定「战略地图上用的哪种围墙，战术模式中就要用哪个围墙」]
        //    调用共享解析函数 resolveTacticalWallSetup，战略与战术 100% 同源对齐
        const isYurtDefender = style === 'YURT';
        const { wallMat, wBase, gBase, wallPost } = resolveTacticalWallSetup(
            this.defenderCityType,
            style,
            this.sideCulture[1],
            this.defenderCityId,
            this.defenderCityRecord()?.buildingStyle ?? null,
            // 城寨栅栏材质：与战略地图同一顺序（单独指定 → 66 建筑风格 → 编辑器分类样式）
            this.defenderCityType === 'stockade' && this.defenderCityId
                ? resolveStockadeFenceKey(this.defenderCityId, style, this.defenderCityRecord()?.stockadeShape, this.defenderCityRecord()?.stockadeFence, this.defenderCityRecord()?.buildingStyle)
                : null,
        );

        // 1. 北翼防线 (NE 东北向展开，对齐 DE 72/36 网格标准，全线多点密集阻挡锁死)
        // (1) 北翼向上完整双塔大城门 (左角塔在 (wallFrontX, topWallY), 右角塔在 (wallFrontX + 144, topWallY - 72))
        placeGate({ x: wallFrontX + 72, y: topWallY - 36 }, gBase + '_NE', 'NE');
        // (2) 从城门右角塔外侧第一格(k=1)顺畅接出 14 段 NE 斜城墙 (连贯平滑，深远包裹整座要塞)
        for (let k = 1; k <= 14; k++) {
            placeWall({ x: wallFrontX + 144 + k * pitchDx, y: topWallY - 72 - k * pitchDy }, wBase + '_NE', 'STONE_WALL');
        }
        // (3) 北翼末端正统城垛立柱 (Wall Post)
        placeWall({ x: wallFrontX + 144 + 15 * pitchDx, y: topWallY - 72 - 15 * pitchDy }, wallPost, 'STONE_WALL');

        // 2. 正面城墙：整排连续垂直主城墙（2026-08-22 主人定：正面中央是城墙，城门只留北翼/南翼 2 座）
        //    正面墙段 linked=true（参与「一处破 → 前排全倒」联动）
        //    主人 2026-09-03：城寨(stockade)只换**前排**——正面不铺篱笆墙（改拒马线，见 applyBuildingsForSide），两侧篱笆保留
        // 🔴 [2026-10-11 主人令「所有建筑改为贴图。确保士兵通行」] 城内建筑一律**去掉碰撞**（纯贴图）：
        //    只有墙/门/城垛/围栏保留阻挡（墙有两条坍塌路径：受伤每 10 秒自动塌一处 + 血归零即塌）。
        for (const sp of this.decorSprites) {
            const _a = String(sp.asset || '');
            if (/WALL|GATE|POST|PALISADE|FENCE|TOWER/i.test(_a)) continue;
            sp.obstruction = undefined;
            sp.obstructionDisabled = true;
        }
        //    🔴 [2026-09-19 主人定] 漠北蒙古风格(MOBEI_MONGOL)和城寨野战一样正面不铺墙，直接开战
        if (this.defenderCityType !== 'stockade' && !this.isMobeiMongolDefender()) {
            for (let i = -8.5; i <= 8.5; i += 1.0) {
                placeWall({ x: wallFrontX, y: midY + i * pitch }, wBase + '_N', 'STONE_WALL', true);
            }
        }

        // 3. 南翼防线 (SE 东南向展开，对齐 DE 72/36 网格标准，全线多点密集阻挡锁死)
        // (1) 南翼向下完整双塔大城门 (左角塔在 (wallFrontX, botWallY), 右角塔在 (wallFrontX + 144, botWallY + 72))
        placeGate({ x: wallFrontX + 72, y: botWallY + 36 }, gBase + '_SE', 'SE');
        // (2) 从城门右角塔外侧第一格(k=1)顺畅接出 14 段 SE 斜城墙 (连贯平滑，深远包裹整座要塞)
        for (let k = 1; k <= 14; k++) {
            placeWall({ x: wallFrontX + 144 + k * pitchDx, y: botWallY + 72 + k * pitchDy }, wBase + '_SE', 'STONE_WALL');
        }
        // (3) 南翼末端正统城垛立柱 (Wall Post)
        placeWall({ x: wallFrontX + 144 + 15 * pitchDx, y: botWallY + 72 + 15 * pitchDy }, wallPost, 'STONE_WALL');

        // 🔴 [2026-09-20 主人方案 C 定稿] 只有「有山关隘」才使用大山场景；渡口/海防/平原要塞 100% 排除
        const shouldSpawnMountain = this.defenderCityType === 'pass' && (
            this.passMountainConfig?.enabled !== undefined
                ? this.passMountainConfig.enabled
                : (() => {
                    const defenderCity = this.defenderCityId ? (CITIES_V2 as any[]).find((c) => c.id === this.defenderCityId) : null;
                    const lat = defenderCity?.lat ?? this.centerLat;
                    const lng = defenderCity?.lng ?? this.centerLng;
                    return isMountainPass(this.defenderCityId, lat, lng, defenderCity?.name);
                })()
        );

        if (shouldSpawnMountain) {
            // 🔴 [2026-10-08 主人「险要的防守方的两座山一个有雪一个没雪」修复]
            //    根据当前战场季节（冬=2）与地貌（冻原雪地 tundra_snow / 冰雪底图）区分雪山池与青山池，
            //    两座大山处于同一气候池，彻底根除「同一道关卡一座有雪、一座没雪」的视觉割裂。
            const isSnowScene = this.sceneSeason === 2
                || this.environmentPlan?.biome === 'tundra_snow'
                || !!(this.environmentPlan?.baseTerrain && /^(sno|sn2|snf|snd|snr|ic3|ice|snow)/i.test(this.environmentPlan.baseTerrain));

            const pool = getClimateMountainPool.call(this, isSnowScene);
            const pickMountain = () => pool[Math.floor(Math.random() * pool.length)];

            // 1. 南翼大山（根据战场地貌气候从对应池中抽取样式，支持翻转；纯贴图不卡兵）
            const mAsset = this.passMountainConfig.asset || pickMountain();
            this.ensureNatureAsset(mAsset);
            // 默认坐标：严格置于战场最底部边缘、南翼斜城墙正下方，绝不遮挡中央冲锋路线、城门通道与出兵口
            const mX = this.passMountainConfig.x ?? (wallFrontX + 230);
            const mY = this.passMountainConfig.y ?? (botWallY + 230);
            // 🔴 [2026-10-11 主人令「它是地貌装饰不是建筑——要也拉回 1.0」] 险要山体默认缩放 1.2 → **1.0**
            //    （第 116 轮曾按「回滚被改坏的」恢复成 1.2；本轮按主人令统一到 DE 原生 100%）
            const mScale = this.passMountainConfig.scale ?? 1.0;
            const mFlip = this.passMountainConfig.flip ?? (Math.random() > 0.5);
            this.decorSprites.push({
                asset: mAsset,
                frame: 0,
                x: mX,
                y: mY,
                flip: mFlip,
                layer: 'world',
                z: 0,
                scale: mScale,
                indestructible: true,
                obstruction: undefined,
                obstructionContactSec: 0,
                obstructionTouched: false,
                obstructionDisabled: true,
            });

            // 2. 北翼大山（上方「两山夹一关」天险，与南翼处于同一气候风貌池中抽取；翻转互补）
            const northAsset = this.passMountainConfig.northAsset || pickMountain();
            this.ensureNatureAsset(northAsset);
            // 默认坐标：严格置于战场北翼斜城墙背侧上端，绝不遮挡北城门通道与冲锋交战路线
            const nX = this.passMountainConfig.northX ?? (wallFrontX + 230);
            const nY = this.passMountainConfig.northY ?? (topWallY - 210);
            // 🔴 [2026-10-11 主人令「它是地貌装饰不是建筑——要也拉回 1.0」] 北翼山体默认缩放 1.2 → **1.0**
            const nScale = this.passMountainConfig.northScale ?? 1.0;
            const nFlip = this.passMountainConfig.northFlip ?? !mFlip;
            this.decorSprites.push({
                asset: northAsset,
                frame: 0,
                x: nX,
                y: nY,
                flip: nFlip,
                layer: 'world',
                z: 0,
                scale: nScale,
                indestructible: true,
                obstruction: undefined,
                obstructionContactSec: 0,
                obstructionTouched: false,
                obstructionDisabled: true,
            });
        }

        // 🔴 [2026-10-15 主人令「所有的栅栏，城墙都是一样的，不要搞那么复杂，都是可以被打坍塌的」]
        //    **此处原有两条例外已删**（2026-09-03「城寨围墙城门全部纯贴图去碰撞」＋ 2026-09-19「漠北蒙古同样去碰撞」）：
        //    按新令「规则冲突时删除更早的规则」，城寨/漠北蒙古的栅栏、篱笆、城门、木垛**一律和别的城池同一条链** ——
        //      ① 保留碰撞（placeWall/placeGate 设的 obstruction 不再被清掉）⇒ 拦得住兵；
        //      ② 挨打掉血后走两条：**每 10 秒自动塌一处受伤的墙**（2026-10-15 令）＋ 血归零立刻
        //         `collapseOneWall` 播 FOUNDATION_1X1_DESTR 切残骸；
        //      ③ 城内建筑、箭塔、营寨不自动坍塌：只在自己被打到 0 血时倒塌。
        //    城寨正面本来就是拒马线（无墙）⇒ 攻方从正面直进，不会被 V 形两翼困住；两翼挨打即按上面②③塌掉放行。
        //    「直接开战、守方不待命」那条（siegeWithWalls=false）**未动**：它管的是守军行为，不是墙。

        // 🔴 [2026-08-29 主人需求] 城墙内侧 4 座并列箭塔：小城瞭望(AGE2) / 险要·中城警戒(AGE3) / 大城高级(AGE4)。
        //    与正面主城墙同侧（守方在右 → 内侧 = x 略大于 wallFrontX），沿正面墙高垂直并列排开。
        //    射箭（复用 WarArrow 纯视觉弹丸 + 开火火花，不改平衡）；30 秒随机三形态（applyRandomCollapseForms）。
        // 主人 2026-09-03：草原(STEPPE)游牧不筑石塔——箭塔统一用亚洲木质瞭望塔(ASIA_TOWER)，与蒙古包/亚洲瞭望塔配套（弃 CEAS 石构）
        // 🔴 [2026-09-18 主人定「一切必须都和战略地图据点一致」] 判据由文化区 STEPPE 改为
        //    建筑风格 YURT：漠北蒙古（MOBEI_MONGOL）原先匹配不上，会拼出 `YURT_TOWER_AGE4`
        //    这种根本不存在的素材；战略地图那边毡帐营地的塔用的就是亚洲木质瞭望塔。
        const arrowTowerAsset =
            isYurtDefender
                ? (this.defenderCityType === 'small_city' || this.defenderCityType === 'stockade') ? 'ASIA_TOWER_AGE2'
                : (this.defenderCityType === 'medium_city' || this.defenderCityType === 'pass') ? 'ASIA_TOWER_AGE3'
                : 'ASIA_TOWER_AGE4'
            : (this.defenderCityType === 'small_city' || this.defenderCityType === 'stockade') ? `${style}_TOWER_AGE2`
            : (this.defenderCityType === 'medium_city' || this.defenderCityType === 'pass') ? `${style}_TOWER_AGE3`
            : `${style}_TOWER_AGE4`;
        const towerRubble = 'BUILDINGANIM:' + arrowTowerAsset + '_RUBBLE';
        this.ensureNatureAsset(towerRubble);
        // 🔴 [2026-10-15 主人令「所有建筑和 DE 一致」] 破损/倒塌/残骸整条链预载（含 DE 同族与通用兜底）——
        //    城寨 4 座箭塔里有 2 座是 FORTIFIED_OUTPOST，DE 没有它的倒塌素材，靠兜底链才不会凭空消失
        this.ensureDestrAssetsFor(arrowTowerAsset);
        // 🔴 箭矢素材必须开战前预载（否则第一步射箭时 pending>0 整场冻结，见 ensureProj 懒加载血训）
        this.ensureProj('PROJ_ARROW');
        // 🔴 塔塌尘土特效预载（塌墙时才播；开战前并入首批，遇不到"30 秒尘土才加载"的冻结）
        this.ensureFx('FX_WALL_DUST');
        const towerProfile = arrowTowerAsset.includes('_TOWER_AGE4') ? { range: 400, reload: 1.8, atk: 7 }
            : arrowTowerAsset.includes('_TOWER_AGE3') ? { range: 360, reload: 2.0, atk: 6 }
            : { range: 320, reload: 2.2, atk: 5 };   // 瞭望箭塔（DE 攻 5）
        const towerX = wallFrontX + 60;                  // 城内一侧，贴近正面主城墙
        const towerYFrac = [0.125, 0.375, 0.625, 0.875]; // 沿正面墙高均匀 4 座并列
        // 主人 2026-09-03：城寨(stockade) 4 箭塔 → 2 强化哨塔(FORTIFIED_OUTPOST) + 2 瞭望箭塔；其余城等级 4 座全瞭望箭塔
        const isStockadeTower = this.defenderCityType === 'stockade';
        if (isStockadeTower) this.ensureDestrAssetsFor('FORTIFIED_OUTPOST');
        towerYFrac.forEach((frac, i) => {
            const ty = topWallY + (botWallY - topWallY) * frac;
            const towerAsset = (isStockadeTower && (i === 0 || i === 3)) ? 'FORTIFIED_OUTPOST' : arrowTowerAsset;
            const sprite = place({ x: towerX, y: ty }, towerAsset, { z: 1, scale: SIEGE_CITY_BUILDING_SCALE });
            this.decorSprites.push(sprite);
            this.arrowTowers.push({
                sprite, x: towerX, y: ty,
                cd: Math.random() * 1.5,
                range: towerProfile.range, reload: towerProfile.reload, atk: towerProfile.atk,
                rubbleAsset: 'BUILDINGANIM:' + towerAsset + '_RUBBLE',
                down: false,
            });
            this.registerDefBuilding(sprite, towerAsset, this.arrowTowers[this.arrowTowers.length - 1]);
        });

        // 蒙古守方：城墙 + 8 蒙古包 + 瞭望塔（不按城等级分时代）
        // 🔴 [2026-09-18 主人定「战略地图上的据点，和战术模式中要同步」] 判据由文化区 STEPPE
        //    改成**建筑风格 YURT**，与战略地图同源。原来只认 `sideCulture === 'STEPPE'`，
        //    而漠北蒙古的文化区是 MOBEI_MONGOL —— 战略地图经 REGION_TO_DE_STYLE 把
        //    STEPPE 和 MOBEI_MONGOL **都**映射成 YURT 画营地，13 这边却匹配不上，
        //    于是漠北蒙古据点在战场被画成通用建筑池，两边对不上。
        //    buildingStyleFor(守方) 走的就是 defenderMapStyle（resolveCityDeBuildingStyle 的结果）。
        if (isYurtDefender) {
            // 🔴 [2026-09-18 主人定「一切必须都和战略地图据点一致」] 毡帐险要照战略侧
            //    buildYurtCampHtml(fence=false, centerCastle=true)：无围墙 + 中心蒙古城堡 + 营帐环卫。
            //    城墙已由 wallMat='NONE' 在 placeWall/placeGate 里拦掉，这里补上中心城堡；
            //    城堡占掉最靠中线的那个位置，余下位置照常铺蒙古包与瞭望塔。
            // 🔴 [2026-10-03 主人令「请把所有的中城和大城的都设计为城堡居中」] 判据由「仅险要」
            //    扩到中城/大城 —— 战略侧 buildYurtCampHtml(centerCastle=true) 三档同口径。
            if ((this.defenderCityType === 'pass' || this.defenderCityType === 'medium_city'
                || this.defenderCityType === 'big_city') && buildingSide.length > 0) {
                const castleAsset = this.castleAssetFor(style, this.defenderCityId);
                const avgY = side.reduce((n, s) => n + s.y, 0) / side.length;
                const centerSpawn = buildingSide.reduce((best, s) =>
                    Math.abs(s.y - avgY) < Math.abs(best.y - avgY) ? s : best, buildingSide[0]);
                const castleSp = place(centerSpawn, castleAsset, { scale: SIEGE_CASTLE_SCALE });
                this.decorSprites.push(castleSp);
                this.trackCityBuilding(castleSp, 'CASTLE');
                placeYurtCamp(SIEGE_CITY_BUILDING_SCALE, buildingSide.filter((s) => s !== centerSpawn), SIEGE_CITY_BUILDING_SCALE, true);
                return;
            }
            placeYurtCamp(SIEGE_CITY_BUILDING_SCALE, buildingSide, SIEGE_CITY_BUILDING_SCALE, true);
            return;
        }
        // 小城：封建时代（age2），无城堡，9 口 = 9 种建筑全上（2026-08-26 主人定「战略战术统一 9 建筑」）
        if (this.defenderCityType === 'small_city') {
            const shuffledSmall = [...buildingSide].sort(() => Math.random() - 0.5);
            const shuffledBuildings = cityPoolBuildings(SIEGE_FEUDAL_BUILDINGS).sort(() => Math.random() - 0.5);
            for (let i = 0; i < shuffledSmall.length; i++) {
                const bk = shuffledBuildings[i];
                const sp = place(shuffledSmall[i], isYurtAsset(bk) ? bk : `${style}_${bk}_AGE2`, { scale: siegeBuildingScale(bk) });
                this.decorSprites.push(sp);
                this.trackCityBuilding(sp);
            }
            return;
        }
        // 城寨（stockade）：定居点/棚屋A~G/哨站/黑暗时代房屋与磨坊与兵营/长屋/部落中心 随机（2026-10-01 主人定）
        // 🔴 [2026-10-19 主人令] 移除蒙古包 A~D：非草原文明城寨不得随机出帐篷。
        if (this.defenderCityType === 'stockade') {
            const stockadePool = [
                'SETTLEMENT', 'HUT_A', 'HUT_B', 'HUT_C', 'HUT_D', 'HUT_E', 'HUT_F', 'HUT_G',
                'OUTPOST', 'FORTIFIED_OUTPOST',
                'DARK_HOUSE_AGE1', 'DARK_MILL_AGE1',
                'DARK_BARRACKS_AGE1', 'DARK_SETTLEMENT_AGE1', 'DARK_TOWN_CENTER_AGE1',
            ];
            const shuffledBuildings = [...stockadePool].sort(() => Math.random() - 0.5).slice(0, buildingSide.length);
            const shuffledSide = [...buildingSide].sort(() => Math.random() - 0.5);
            for (let i = 0; i < shuffledSide.length; i++) {
                const sp = place(shuffledSide[i], shuffledBuildings[i], { scale: siegeBuildingScale(shuffledBuildings[i]) });
                this.decorSprites.push(sp);
                this.trackCityBuilding(sp);
            }
            return;
        }
        // 中城：与战略模式套用相同建筑——12 种 AGE3 建筑随机取 9 种且不重复；落点随机（2026-08-29 主人定「除箭塔外其余在 9 出兵口随机摆放」）。
        // 🔴 [2026-10-03 主人令「请把所有的中城和大城的都设计为城堡居中」] 城堡占最靠全军中线的那个落点，
        //    其余 8 个落点铺建筑池（与战略侧「3×3 网格正中城堡 + 周围 8 栋」同一布局）。
        if (this.defenderCityType === 'medium_city') {
            if (buildingSide.length === 0) return;
            const avgY = side.reduce((n, s) => n + s.y, 0) / side.length;
            const centerSpawn = buildingSide.reduce((best, s) =>
                Math.abs(s.y - avgY) < Math.abs(best.y - avgY) ? s : best, buildingSide[0]);
            const castleSp = place(centerSpawn, this.castleAssetFor(style, this.defenderCityId), {
                scale: SIEGE_CASTLE_SCALE,
            });
            this.decorSprites.push(castleSp);
            this.trackCityBuilding(castleSp, 'CASTLE');
            const shuffledBuildings = cityPoolBuildings(SIEGE_MEDIUM_BUILDINGS).sort(() => Math.random() - 0.5)
                .slice(0, buildingSide.length - 1);
            const shuffledSide = buildingSide.filter((s) => s !== centerSpawn).sort(() => Math.random() - 0.5);
            for (let i = 0; i < shuffledSide.length; i++) {
                const bk = shuffledBuildings[i];
                const sp = place(shuffledSide[i], isYurtAsset(bk) ? bk : `${style}_${bk}_AGE3`, { scale: siegeBuildingScale(bk) });
                this.decorSprites.push(sp);
                this.trackCityBuilding(sp);
            }
            return;
        }
        // 险要：城堡 + 兵营 + 靶场 + 马厩 + 民居 + 2 警戒箭塔 + 2 高级箭塔。
        // 🔴 [2026-08-29 主人「城堡不在最上就在最下」] 城堡固定中间落点（y 最接近全军中线），其余 8 建筑随机放剩余落点。
        // [2026-08-29 主人「城堡有点大，请缩小」→ 再「显示比例加大」] 城堡单独用 SIEGE_CASTLE_SCALE，其余建筑仍用 SIEGE_CITY_BUILDING_SCALE。
        if (this.defenderCityType === 'pass') {
            if (buildingSide.length === 0) return;
            const castleAsset = this.castleAssetFor(style);
            const passOthers = [
                `${style}_BARRACKS_AGE3`,
                `${style}_ARCHERY_RANGE_AGE3`,
                `${style}_STABLE_AGE3`,
                `${style}_HOUSE_AGE3`,
                `${style}_TOWER_AGE3`, `${style}_TOWER_AGE3`,
                `${style}_TOWER_AGE4`, `${style}_TOWER_AGE4`,
            ].sort(() => Math.random() - 0.5);
            const avgY = side.reduce((n, s) => n + s.y, 0) / side.length;
            // 特殊建筑先占位；城堡只在剩余空位里选最接近中线的位置。
            const centerSpawn = buildingSide.reduce((best, s) =>
                Math.abs(s.y - avgY) < Math.abs(best.y - avgY) ? s : best, buildingSide[0]);
            const castleSp = place(centerSpawn, castleAsset, {
                scale: SIEGE_CASTLE_SCALE,
            });
            this.decorSprites.push(castleSp);
            this.trackCityBuilding(castleSp, 'CASTLE');
            // 🔴 [主人需求] 城堡射箭（DE 城堡：攻 11、装填 2.0s；射程与高级箭塔同档 400）。
            //    30 秒不坍塌（applyRandomCollapseForms 跳过 CASTLE），持续射击。
            this.castleTowers.push({
                sprite: castleSp, x: castleSp.x, y: castleSp.y,
                cd: Math.random() * 1.5,
                range: 400, reload: 2.0, atk: 11,
                rubbleAsset: null,
                down: false,
            });
            const shuffledOthers = buildingSide.filter((s) => s !== centerSpawn).sort(() => Math.random() - 0.5);
            for (let i = 0; i < shuffledOthers.length; i++) {
                const sp = place(shuffledOthers[i], passOthers[i], { scale: SIEGE_CITY_BUILDING_SCALE });
                this.decorSprites.push(sp);
                this.trackCityBuilding(sp);
            }
            return;
        }
        // 大城：与战略模式套用相同建筑。九建筑落点全部随机（2026-08-29 主人定「9 建筑摆放位置随机」）。
        // 🔴 [2026-10-03 主人令「请把所有的中城和大城的都设计为城堡居中」] 原来正中那格固定放城镇中心，
        //    现改为城堡占最靠全军中线的落点（与战略侧「3×3 网格正中城堡 + 周围 8 栋」同一布局），
        //    其余 8 个落点照旧铺 市场/大学 AGE4 + 6 栋 AGE3。
        if (buildingSide.length === 0) return;
        const avgYBig = side.reduce((n, s) => n + s.y, 0) / side.length;
        const centerSpawnBig = buildingSide.reduce((best, s) =>
            Math.abs(s.y - avgYBig) < Math.abs(best.y - avgYBig) ? s : best, buildingSide[0]);
        const castleSpBig = place(centerSpawnBig, this.castleAssetFor(style, this.defenderCityId), {
            scale: SIEGE_CASTLE_SCALE,
        });
        this.decorSprites.push(castleSpBig);
        this.trackCityBuilding(castleSpBig, 'CASTLE');
        const age3Pool: Array<[string, string]> = [
            ...SIEGE_IMPERIAL_BUILDINGS.filter(([, age]) => age === 'AGE3'),
            // 🔴 [2026-09-16 主人定] 二级蒙古大城：辅助池掺入蒙古包（仍是 3 栋 AGE4 必有 + 6 栋辅助 = 9）
            ...(defenderIsMongol ? MONGOL_CITY_YURTS.map((y): [string, string] => [y, 'AGE3']) : []),
        ].sort(() => Math.random() - 0.5);
        const ringBuildings: Array<[string, string]> = [
            ['MARKET', 'AGE4'],
            ['UNIVERSITY', 'AGE4'],
            ...age3Pool.slice(0, 6),
        ].sort(() => Math.random() - 0.5) as Array<[string, string]>;
        const ringSpawns = buildingSide.filter((s) => s !== centerSpawnBig).sort(() => Math.random() - 0.5);
        for (let i = 0; i < ringSpawns.length; i++) {
            const [building, age] = ringBuildings[i];
            const sp = place(ringSpawns[i], isYurtAsset(building) ? building : `${style}_${building}_${age}`, { scale: siegeBuildingScale(building) });
            this.decorSprites.push(sp);
            this.trackCityBuilding(sp);
        }
        return;
    }

    // 野战双方 + 攻城攻方：蒙古 8 蒙古包 + 瞭望塔；其余 3 营地 + 4 帐篷 + 1 强化哨站 + 1 瞭望塔
    // 🔴 [2026-09-18] 同上：判据改用建筑风格 YURT，覆盖 STEPPE 与 MOBEI_MONGOL 两种文化区
    // 🔴 [2026-10-15 主人令「我们算建筑，有坍塌动画的都是建筑」] 营寨**算建筑**：
    //    逐件登记（DE 血量、受伤掉血、血归零播 DE 倒塌 → 留残骸），但它们**不射箭**（不挂 cityBuildings）。
    //    ⚠️ 阵营必须传自己的 `f`：索敌一律跳过同阵营 —— 否则攻城武器会砸自家营寨、
    //       守方还会把攻方帐篷挑成「中心建筑」（中心建筑血归零＝攻方胜）污染胜负判定。
    //    ⚠️ 旧注释里「f 写死 1」的那个 bug 已随本条第 5 个参数修掉。
    if (this.buildingStyleFor(f as 0 | 1) === 'YURT') {
        // 🔴 [2026-10-03 主人令「战术模式中，攻击方的建筑请改为80%」] 蒙古包也按 80%（塔本来就是这个缩放）
        placeYurtCamp(SIEGE_CITY_BUILDING_SCALE, side, SIEGE_CITY_BUILDING_SCALE, false);
        return;
    }
    const style = this.buildingStyleFor(f as 0 | 1);
    const shuffledSpawns = [...side].sort(() => Math.random() - 0.5);
    const placeCamp = (spawnIndex: number, asset: string): void => {
        const sp = place(shuffledSpawns[spawnIndex], asset, { scale: SIEGE_CITY_BUILDING_SCALE });
        this.decorSprites.push(sp);
        this.registerDefBuilding(sp, asset, undefined, undefined, f as 0 | 1);   // 营寨 = 建筑（不射箭）
        this.ensureDestrAssetsFor(asset);                                        // 倒塌素材开战前备齐
    };
    // 🔴 [2026-10-03 主人令「战术模式中，攻击方的建筑请改为80%」] 3 营地 + 4 帐篷也改 80%
    //    （改前是原尺寸 1.0；下方两座塔状工事本就 0.8，现在整座营地同一个缩放）。
    for (let i = 0; i < 3; i++) placeCamp(i, shuffledCamps[i]);
    for (let i = 3; i < 7; i++) placeCamp(i, 'GREEK_WAR_TENT');
    // 🔴 [2026-09-03 主人改] 哨站(OUTPOST)换成强化哨站（FORTIFIED_OUTPOST = DE b_archaic_fortified_outpost_age1）。
    //    强化哨站是哨站的加固升级版（能攻击），不是警戒塔/防卫塔（TOWER_AGE3）。
    // 🔴 [2026-10-03 主人令] 这两座塔状工事（强化哨站 + 瞭望塔）与**守方城墙内侧那 4 座箭塔同类**
    //    （守方城寨的 4 座箭塔里就有 2 座是 FORTIFIED_OUTPOST）—— 一律用同一缩放，两边一样大。
    placeCamp(7, 'FORTIFIED_OUTPOST');
    placeCamp(8, `${style}_TOWER_AGE2`);
}
