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
import { PASS_VALLEY_DIRS_8, passValleyDirAngle, type DecorSprite } from './Scene13Types';
import { TAC_TILE_W, TAC_TILE_H } from './Scene13GroundLayerGL';
import { measureStrategicCity, strategicCityGroundElement } from './Scene13StrategicCity';
import {
    WALL_GATE_STATS, MONGOL_CITY_YURTS, SIEGE_IMPERIAL_BUILDINGS, SIEGE_MEDIUM_BUILDINGS, SIEGE_FEUDAL_BUILDINGS,
    SIEGE_CITY_BUILDING_SCALE, SIEGE_CASTLE_SCALE, SIEGE_WONDER_SCALE, siegeBuildingScale,
} from './Scene13UnitTables';
import { pickTree, type TreeSeason } from './TreeAssignment';
import { syncTradeCartAnimals } from './Scene13Animals';
import { DE_MAP_THEMES, type DeMapThemeId } from './Scene13DeMapThemes';
import { deTerrainSeasonalTree, seasonalDeTree } from './Scene13DeTrees';
import { localSeasonAtLat } from '../../world/environment/seasonalGround';
import { plantRegionalizeTree, plantTreeAt, ZONE_PLANTS } from '../../world/environment/plantCatalog';
import { envZoneAt, type EnvZone } from '../../world/environment/envZones';
import { forestCoverAt, forestPotentialAt } from '../../world/environment/forestModel';
import { groundDecorFor, decorFits } from './DecorFit';
import { queryWinterSnow } from './WorldBaseMap';
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
        const wonderSet = new Set<string>();
        if (this.defenderCityId) {
            const mw = CITY_WONDER[this.defenderCityId];
            if (mw) wonderSet.add(mw);
            const ew = CITY_WONDER_EXTRA[this.defenderCityId];
            if (ew) for (const ex of ew) wonderSet.add(ex.asset);
        }
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
            if (p.kind === 'building') { if (p.aux) (sprite as any).isAux = true; this.trackCityBuilding(sprite, wonderSet.has(p.dir) ? 'WONDER' : undefined); return; }
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
    const passRoadDir = this.defenderPassRoadDir ?? PASS_VALLEY_DIRS_8[(hash >>> 0) % PASS_VALLEY_DIRS_8.length];
    if (this.defenderCityType === 'pass') {
        // 🔴 [2026-10-20 主人令「东方险要改矩形」] 矩形/镜像矩形：台地边界按对应双圈算（旧方形不传，走原算法一个像素不动）
        // 🔴 [2026-11-04 主人令「你把险要改为二层了？我以前的险要是三层」「可以改为8个朝向随机凹地吗，每张图不一样」]
        gl.flattenPassTerraces(cx, cy, W, H, `${seedStr}_${passRoadDir}`, this.wallGates, this.defBuildings,
            this.defenderPassShape && this.defenderPassShape !== 'square'
                ? passRingHalfExtents(this.defenderPassShape)
                : undefined,
            this.defenderPassTerrain ?? 'mound',
            passRoadDir);
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
    const baseFlatCells = ringLm > 0 ? ringLm / 2 + (this.defenderCityType === 'big_city' ? 9.5 : 7.5) : rCells + 5.5;
    const minHillDistCells = this.defenderCityType === 'pass'
        ? (ringLm > 0 ? ringLm / 2 + 3.2 : baseFlatCells)
        : this.defenderCityType === 'stockade'
            ? baseFlatCells + 3.0
            : baseFlatCells;
    const TREE_FILTER_RE = /^(?!PLANT|UNDERBRUSH|ROCK|FORAGE|FALLEN_LEAVES|FELLED|STUMP|FLOWER|GRASS|WEED|SHRUB|BUSH_GREEN).*(TREE|PINE|OAK|BAMBOO|PALM|BIRCH|CYPRESS|MAPLE|WILLOW|OLIVE|BAOBAB|BRAZILWOOD|JUNGLE|RAINFOREST|ACACIA|MANGROVE|BLOSSOM|GINKGO|EUCALYPTUS|MONKEY_PUZZLE|SPRUCE)/i;
    // 🔴 [2026-10-21 主人令「请全部和DE保持一致」]
    //    DE 的树就长在 DE 地形上——`13 Palm Desert` 的棕榈林、`110 Birch` 的桦林本来就有长在平地上的
    //    （Arabia 沙漠主题就是沙地平地上成片棕榈）；不再按「树只能长在山上」把 DE 的平地林整片删掉，
    //    也不在山上另补人工林。只清「城内 + 城门大道 + 城郊碾平圈」这一带
    //    （DE 的 RMS 同样用 avoid_player_start_areas 把城周树林清开）。
    this.decorSprites = this.decorSprites.filter((sp) => {
        if (sp.asset.startsWith('MOUNTAIN_') || (sp as any).cityInterior || (sp as any).cityOutskirts) return false;
        if (sp.asset.startsWith('BUILDING') || sp.asset === '') return true;
        const isTree = TREE_FILTER_RE.test(sp.asset);
        const spCell = cityCell ? gl.screenToCell(sp.x, sp.y, W, H) : null;
        const distCells = (cityCell && spCell) ? Math.hypot(spCell.gx - cityCell.gx, spCell.gy - cityCell.gy) : 999;
        const inCityOrRoad = inCity(sp.x, sp.y) || inGateRoad(sp.x, sp.y);
        const inWaterOrMoat = !!(inMoat && inMoat(sp.x, sp.y)) || gl.isWaterAt(sp.x, sp.y, W, H);
        const isRiparianTree = isTree && Boolean((sp as any).riparian);
        const flatRingLimit = isRiparianTree
            ? (ringLm > 0 ? ringLm / 2 + (moatOn ? 3.6 : 1.6) : rCells + 1.4)
            : (minHillDistCells - 0.5);
        const inCityFlatRing = isTree && distCells < flatRingLimit;
        const keep = !inCityOrRoad && !inWaterOrMoat && !inCityFlatRing;
        if (!keep) {
            if (inCityOrRoad) {
                gl.carveFoundation(sp.x, sp.y, W, H, 2.2);
            } else if (isTree) {
                gl.clearForestAt(sp.x, sp.y, W, H, 2.0);
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

    /** 该网格脚下 DE 地形 id（gl.data.terrain 已由 transposeMapData 对调成同一套坐标） */
    const terrainAtCell = (gx: number, gy: number): number => {
        const ter = gl.data?.terrain;
        if (!ter) return -1;
        const x = Math.max(0, Math.min(N - 1, Math.round(gx)));
        const y = Math.max(0, Math.min(N - 1, Math.round(gy)));
        return ter[y * N + x] ?? -1;
    };

    // 🔴 [2026-10-21 主人令「树木要成林，你放一堆一个树干什么？」「看看DE是怎么做的。看看文档里有做树林的方法吗」]
    // 严格遵循帝国时代 II (DE) 原版引擎与 RMS 森林生成法则（见 tools/rms/rmsEngine.mjs line 914）：
    // 1. 【DE 森林生成机制】：
    //    · 森林本质是网格地形斑块 (create_terrain WOODIES)，靠连续网格细胞自然连片生长；
    //    · 每个属于森林网格的格子 (gx, gy)，仅在格中心 (gx + 0.5, gy + 0.5) 立【恰好一棵树】！
    //    · 严格基于等轴网格坐标 cellToScreen，绝不用人工小圆圈循环塞几十棵树挤成一团；
    //    · 【树种纯净】：全林 100% 统一为当地当季主导树种 (primaryTree)，靠 0~7 帧与随机轻度翻转呈现自然多样性，绝不把红黄绿白各色树种乱搅成沙拉球！
    //    · 森林脚下 100% 满铺林地腐殖土 (gl.addForestAt)。
    // 2. 【微景观种类搭配，数量克制】：
    //    · 林缘：整片森林外缘仅放 1 根倒木 (FELLED_GENERIC) 或树桩 (STUMP_GENERIC)，伴生 1 簇蕨草；
    //    · 岩伴草灌 (DE second_object)：全图仅 3~4 处单石微景（1 块石头配 1 丛草/矮灌木）；
    //    · 悬崖地标：山巅断崖处仅 1 处风蚀柱石 (ROCK_FORMATION)，伴生孤松；
    //    · 浆果丛 (Forage Clump)：全图仅 1 处，4 丛野果灌木聚在山脚草地；
    //    · 向阳野花斑：开阔处仅 1~2 处小野花草甸；
    //    · 古道旧痕：远郊路旁仅 1 辆废弃破木车 (CART_BROKEN) 伴生木桶。
    const siteBaseTile = this.environmentPlan?.baseTerrain ?? 'gr1';
    const defCityRec: any = this.defenderCityRecord();
    const siteLat = defCityRec?.lat ?? this.centerLat ?? 30;
    const siteLng = defCityRec?.lng ?? this.centerLng ?? 110;
    const isArid = /^(des|pal|qs|ds5|pal1)/i.test(siteBaseTile);
    // 🔴 [2026-10-31 主人问「高昌的冬天，植被上有雪吗？」] 城郊/庭院树也只在**当地冬季真积雪**时才挂雪：
    //    WorldClim 冬季标志 4＝零星残雪（高昌/吐鲁番—哈密就是 4，盆地不积雪）、0＝不积雪 → 一律按无雪处理。
    const siteWinterFlag = queryWinterSnow(siteLat, siteLng);
    const siteWinterSnow = siteWinterFlag === null ? true : (siteWinterFlag > 0 && siteWinterFlag !== 4);
    const isSnow = siteWinterSnow && (gl.isIce || /^(sno|sn2|snf|snd|snr|ic3|ice)/i.test(siteBaseTile));
    const isPassType = this.defenderCityType === 'pass';
    const rawCalSeason = (window as any).game?.timeSystem?.getSeason?.();
    const rawSeason4: TreeSeason = (rawCalSeason === 0 || rawCalSeason === 1 || rawCalSeason === 2 || rawCalSeason === 3)
        ? rawCalSeason
        : (this.sceneSeason === 2 ? 3 : this.sceneSeason === 1 ? 2 : 1);
    const calSeason: TreeSeason = localSeasonAtLat(rawSeason4, siteLat);

    // 🔴 [2026-10-21 主人令「请全部和DE保持一致」]
    //    DE 的树由「脚下地形」＋「气候主题」决定，不由建筑风格决定：
    //      · 森林地形（dat density=1000）自己长树：13 Palm Desert→棕榈、110 Birch→桦、10 Forest→橡……（见 Scene13DeTrees.ts）
    //      · 没有森林地形可用时，用 DE 气候主题主树（DE_MAP_THEMES[theme].trees；沙漠主题＝PALM 棕榈）；
    //    ⚠️ 人工在城郊山丘上「补林团」的整段（growForestClump/plantForestClump）已按主人令删除：
    //     DE 的林地就是地形自带的那些，不在 DE 地形上凭空造林；平地上的 DE 棕榈林/桦林照 DE 原样保留。
    const envTheme: DeMapThemeId | null = this.environmentPlan?.deMapTheme ?? null;
    const themePalette = envTheme ? DE_MAP_THEMES[envTheme] : null;
    /** DE 气候主题主树（BUSH_TREE 灌木/枯木除外；只用于山巅孤树这类单株点缀） */
    const themeLeadTree = ((calSeason === 2 && themePalette?.autumnTrees?.length)
        ? themePalette.autumnTrees
        : (calSeason === 3 && isSnow && themePalette?.winterTrees?.length)
            ? themePalette.winterTrees
            : (themePalette?.trees ?? [])).filter((a) => !/^BUSH_TREE_/.test(a) && a !== 'DEAD_TREE');

    // 预热微景观素材
    const landmarkRocks = isArid
        ? ['ROCK_FORMATION2', 'ROCK_FORMATION3', 'ROCK3']
        : isSnow
            ? ['ROCK_FORMATION1', 'ROCK_LIMESTONE', 'ROCK1']
            : ['ROCK_FORMATION1', 'ROCK_FORMATION2', 'ROCK_LIMESTONE', 'ROCK3'];
    for (const lr of landmarkRocks) this.ensureNatureAsset(lr);
    this.ensureNatureAsset('ROCK1');
    this.ensureNatureAsset('ROCK2');
    this.ensureNatureAsset('MINE_STONE');
    this.ensureNatureAsset('FORAGE_BUSH');
    this.ensureNatureAsset('BUSH_GREEN');
    this.ensureNatureAsset('SHRUB_GREEN');
    this.ensureNatureAsset('GRASS_GREEN');
    this.ensureNatureAsset('GRASS_DRY');
    this.ensureNatureAsset('FERNPATCH');
    this.ensureNatureAsset('FLOWER_1');
    this.ensureNatureAsset('FLOWER_2');
    this.ensureNatureAsset('STUMP_GENERIC');
    this.ensureNatureAsset('FELLED_GENERIC');
    this.ensureNatureAsset('DEAD_TREE');
    this.ensureNatureAsset('BATTLEFIELD:CART_BROKEN');
    this.ensureNatureAsset('BATTLEFIELD:TORCH_A');
    this.ensureNatureAsset('BARRELS');

    // 纯视觉安全放置函数（不阻碍行军，不重叠建筑和道路）
    const pushSafeDecor = (
        asset: string,
        x: number,
        y: number,
        scale = 1.0,
        frame = 0,
        flip = false,
        extraZ = 0
    ): boolean => {
        if (inCity(x, y) || inGateRoad(x, y)) return false;
        if (gl.isWaterAt(x, y, W, H) || (inMoat && inMoat(x, y))) return false;
        for (const sp of this.spawns) {
            if (Math.hypot(x - sp.x, (y - sp.y) * 1.5) < 320) return false;
        }
        this.ensureNatureAsset(asset);
        const sp: DecorSprite = {
            asset,
            frame,
            x,
            y,
            flip,
            scale,
            layer: 'world',
            z: extraZ,
            lift: gl.elevationLiftAt(x, y, W, H),
            indestructible: true,
            obstruction: undefined,
            obstructionContactSec: 0,
            obstructionTouched: false,
            obstructionDisabled: true,
        };
        (sp as any).cityOutskirts = true;
        this.decorSprites.push(sp);
        return true;
    };

    // 🔴 [2026-10-21 主人令「请全部和DE保持一致」]
    //    这里原来有「城郊山丘人工补林团」（growForestClump/plantForestClump，2~4 片、每片 28~35 格），
    //    已整段删除：DE 的林地＝森林地形自动长出来的那些，人工造林会造出 DE 地图上不存在的成片林
    //    （沙漠图上就是「沙丘上一片棕榈密林」）。树木位置一律以 DE 烘焙图为准（见上方对象过滤）。

    // ── 2. 【DE 三层微景观体系（Arabia.rms SOLID_OBJECT + AESTHETIC_GROUPED/FLAT + AESTHETIC_SCATTER）】 ──
    // 采集核心交战视野圈（半径 minHillDistCells+1.5 ~ 38 格）及外围的干燥陆地候选点，并按确定性随机洗牌
    const highSpots: Array<{ gx: number; gy: number; x: number; y: number; elev: number; dist: number }> = [];
    const midSlopeSpots: Array<{ gx: number; gy: number; x: number; y: number; elev: number; dist: number }> = [];
    const midRingPlainSpots: Array<{ gx: number; gy: number; x: number; y: number; elev: number; dist: number }> = [];
    const outerPlainSpots: Array<{ gx: number; gy: number; x: number; y: number; elev: number; dist: number }> = [];

    for (let gy = 5; gy <= N - 5; gy += 2) {
        for (let gx = 5; gx <= N - 5; gx += 2) {
            const pt = gl.cellToScreen(gx + 0.5, gy + 0.5, W, H);
            if (inCity(pt.x, pt.y) || inGateRoad(pt.x, pt.y)) continue;
            if (gl.isWaterAt(pt.x, pt.y, W, H) || (inMoat && inMoat(pt.x, pt.y))) continue;
            const distCells = Math.hypot(gx - cGx, gy - cGy);
            if (distCells < minHillDistCells + 1.2) continue;
            const elev = gl.elevationLevelAt(pt.x, pt.y, W, H);
            const item = { gx, gy, x: pt.x, y: pt.y, elev, dist: distCells };
            const passAng = passValleyDirAngle(passRoadDir);
            const passCrossV = Math.abs(-(gx - cGx) * Math.sin(passAng) + (gy - cGy) * Math.cos(passAng));
            if (elev >= 1.8 && (!isPassType || passCrossV >= 12.5)) {
                highSpots.push(item);
            } else if (elev >= 0.7 && elev < 1.8) {
                midSlopeSpots.push(item);
            } else if (distCells <= 36) {
                midRingPlainSpots.push(item);
            } else {
                outerPlainSpots.push(item);
            }
        }
    }

    const shuffle = <T>(arr: T[]): T[] => {
        const out = [...arr];
        for (let i = out.length - 1; i > 0; i--) {
            const j = Math.floor(mRnd() * (i + 1));
            const tmp = out[i];
            out[i] = out[j];
            out[j] = tmp;
        }
        return out;
    };

    const shuffledMidSlope = shuffle(midSlopeSpots);
    const shuffledMidPlain = shuffle(midRingPlainSpots);
    const shuffledOuterPlain = shuffle(outerPlainSpots);
    const plainSpots = [...shuffledMidPlain, ...shuffledOuterPlain];

    const decorSet = groundDecorFor(siteBaseTile);
    const decorCtx = {
        lat: siteLat,
        lng: siteLng,
        season: this.sceneSeason,
        winterSnow: isSnow,
        isSiege: true,
    };
    const validFlat = decorSet.flat.filter((a) => decorFits(a, decorCtx));
    const validSolid = decorSet.solid.filter((a) => decorFits(a, decorCtx));
    const validScatter = decorSet.scatter.filter((a) => decorFits(a, decorCtx));

    // 先把底图烘焙进来的既有岩石/采石点纳入间距检测表，防止城郊补石贴在既有石头旁
    const placedRocks: Array<{ x: number; y: number }> = [];
    for (const sp of this.decorSprites) {
        if (/^(ROCK|MINE_STONE)/.test(sp.asset)) {
            placedRocks.push({ x: sp.x, y: sp.y });
        }
    }

    // (2a) 高崖地标险石（Cliff Landmark）：立于山梁高点
    if (highSpots.length > 0) {
        const peakSpot = [...highSpots].sort((a, b) => b.elev - a.elev)[0];
        if (peakSpot && !placedRocks.some((p) => Math.hypot(p.x - peakSpot.x, (p.y - peakSpot.y) * 1.5) < 420)) {
            const rfAsset = landmarkRocks[Math.floor(mRnd() * landmarkRocks.length)];
            if (pushSafeDecor(rfAsset, peakSpot.x, peakSpot.y, 1.04 + mRnd() * 0.12, Math.floor(mRnd() * 12), mRnd() < 0.5)) {
                placedRocks.push({ x: peakSpot.x, y: peakSpot.y });
                // 🔴 [2026-10-21 主人令「请全部和DE保持一致」] 山巅孤树也按 DE 地形/气候主题取树种：
                //    DE 地形登记的树 > DE 主题主树 > 兜底（沙漠图给棕榈/枯木，不给松树）
                const peakTree = deTerrainSeasonalTree(terrainAtCell(peakSpot.gx, peakSpot.gy), calSeason, isSnow)
                    ?? (themeLeadTree.length > 0 ? seasonalDeTree(themeLeadTree[0], calSeason, isSnow) : null);
                // 🔴 2026-10-31 植物总表：不合本区的换成本区树种，与战略图同一组
                const lonePine = seasonalDeTree(plantRegionalizeTree(siteLat, siteLng,
                    peakTree ?? (isSnow ? 'SNOW_PINE' : (isArid ? 'DEAD_TREE' : 'ASIAN_PINE')), mRnd()), calSeason, isSnow);
                pushSafeDecor(lonePine, peakSpot.x + 32, peakSpot.y - 16, 0.82, 0, mRnd() < 0.5);
            }
        }
    }

    // (2b) 岩伴草灌微景群（DE SOLID_OBJECT + second_object SOLID_UNDERBRUSH + SOLID_SURROUND）：
    //      在交战圈侧翼坡地与平原布置 12~14 处主岩伴生灌木与碎石（保持间距 ≥ 520px）
    const rockCandidates = [...shuffledMidSlope, ...shuffledMidPlain];
    const targetRockGroups = isPassType ? 14 : 12;
    let outskirtsRockGroups = 0;
    for (const rs of rockCandidates) {
        if (outskirtsRockGroups >= targetRockGroups) break;
        if (placedRocks.some((p) => Math.hypot(p.x - rs.x, (p.y - rs.y) * 1.5) < 520)) continue;
        const rockPool = validSolid.length > 0 ? validSolid : ['ROCK1', 'ROCK2'];
        const rockAsset = rockPool[Math.floor(mRnd() * rockPool.length)];
        if (pushSafeDecor(rockAsset, rs.x, rs.y, 0.86 + mRnd() * 0.18, Math.floor(mRnd() * 12), mRnd() < 0.5)) {
            placedRocks.push({ x: rs.x, y: rs.y });
            outskirtsRockGroups++;
            const companionPool = validFlat.length > 0 ? validFlat : (isArid ? ['GRASS_DRY'] : ['SHRUB_GREEN', 'GRASS_GREEN']);
            const comp1 = companionPool[Math.floor(mRnd() * companionPool.length)];
            pushSafeDecor(comp1, rs.x + (mRnd() < 0.5 ? -24 : 24), rs.y + 10, 0.76, Math.floor(mRnd() * 4), mRnd() < 0.5, -1);
            if (mRnd() < 0.65 && validScatter.length > 0) {
                const scAsset = validScatter[Math.floor(mRnd() * validScatter.length)];
                pushSafeDecor(scAsset, rs.x + (mRnd() < 0.5 ? 28 : -28), rs.y - 8, 0.78, Math.floor(mRnd() * 4), mRnd() < 0.5, -1);
            }
        }
    }

    // (2c) 成簇花草灌木微景（DE AESTHETIC_GROUPED / AESTHETIC_FLAT，group_placement_radius 2~3）：
    //      在核心交战圈及退水陆地上点缀 18 组同色系灌木/野花/蕨丛（每组 2~3 株自然散落，间距 ≥ 420px）
    if (validFlat.length > 0) {
        const placedFlats: Array<{ x: number; y: number }> = [];
        const targetFlatGroups = 18;
        for (const fs of plainSpots) {
            if (placedFlats.length >= targetFlatGroups) break;
            if (placedFlats.some((p) => Math.hypot(p.x - fs.x, (p.y - fs.y) * 1.5) < 420)) continue;
            const leadFlat = validFlat[Math.floor(mRnd() * validFlat.length)];
            if (pushSafeDecor(leadFlat, fs.x, fs.y, 0.84 + mRnd() * 0.12, Math.floor(mRnd() * 6), mRnd() < 0.5, -1)) {
                placedFlats.push({ x: fs.x, y: fs.y });
                const subCount = 1 + Math.floor(mRnd() * 2);
                for (let s = 0; s < subCount; s++) {
                    const subAsset = validFlat[Math.floor(mRnd() * validFlat.length)];
                    const ang = mRnd() * Math.PI * 2;
                    const distPx = 24 + mRnd() * 32;
                    pushSafeDecor(
                        subAsset,
                        fs.x + Math.cos(ang) * distPx,
                        fs.y + Math.sin(ang) * distPx * 0.5,
                        0.74 + mRnd() * 0.14,
                        Math.floor(mRnd() * 6),
                        mRnd() < 0.5,
                        -1
                    );
                }
            }
        }
    }

    // (2d) 原野散生草丛（DE AESTHETIC_SCATTER，对应 dat terrain_unit_density 草丛点缀）：
    //      在开阔交战区及退水新陆地上均匀点缀 26 处当地草丛（GRASS_DRY / GRASS_GREEN），彻底消除光板平地感
    if (validScatter.length > 0) {
        const scatterAsset = validScatter[0];
        let scatterPlaced = 0;
        const step = Math.max(1, Math.floor(plainSpots.length / 32));
        for (let i = 0; i < plainSpots.length && scatterPlaced < 26; i += step) {
            const sp = plainSpots[i];
            const jx = (mRnd() - 0.5) * 44;
            const jy = (mRnd() - 0.5) * 22;
            if (pushSafeDecor(scatterAsset, sp.x + jx, sp.y + jy, 0.78 + mRnd() * 0.14, Math.floor(mRnd() * 6), mRnd() < 0.5, -1)) {
                scatterPlaced++;
            }
        }
    }

    // ── 4. 【露天采石点 (Stone Mine)】：交战圈侧翼坡地 2 处 ──
    const mineCandidates = [... shuffle(highSpots), ...shuffledMidSlope];
    let minesPlaced = 0;
    for (const ms of mineCandidates) {
        if (minesPlaced >= 2) break;
        if (ms.dist >= minHillDistCells + 3 && ms.dist <= 36) {
            if (placedRocks.some((p) => Math.hypot(p.x - ms.x, (p.y - ms.y) * 1.5) < 480)) continue;
            if (pushSafeDecor('MINE_STONE', ms.x, ms.y, 0.96 + mRnd() * 0.12, Math.floor(mRnd() * 7), mRnd() < 0.5)) {
                placedRocks.push({ x: ms.x, y: ms.y });
                minesPlaced++;
            }
        }
    }

    // ── 5. 【野生浆果灌木丛 (Forage Berry Bushes)】：城郊交战圈侧翼 2 处成簇（每处 4~5 丛聚在一块） ──
    let berriesPlaced = 0;
    for (const bc of shuffledMidPlain) {
        if (berriesPlaced >= 2) break;
        if (bc.dist < minHillDistCells + 3 || bc.dist > 30) continue;
        const berryOffsets = [[0, 0], [24, -9], [-20, 11], [14, 15], [-12, -12]];
        let anyPlaced = false;
        for (const [bx, by] of berryOffsets) {
            if (pushSafeDecor('FORAGE_BUSH', bc.x + bx, bc.y + by, 0.88, Math.floor(mRnd() * 4), mRnd() < 0.5)) {
                anyPlaced = true;
            }
        }
        if (anyPlaced) berriesPlaced++;
    }

    // ── 6. 【向阳野花草甸 (Wildflower Patches)】：温带非雪地城郊点缀 3 处野花斑 ──
    if (!isArid && !isSnow && shuffledMidPlain.length > 4) {
        const flowerPick = ['FLOWER_1', 'FLOWER_2'];
        for (let i = 0; i < 3 && i + 2 < shuffledMidPlain.length; i++) {
            const fs = shuffledMidPlain[i + 2];
            pushSafeDecor(flowerPick[i % flowerPick.length], fs.x, fs.y, 0.82, 0, mRnd() < 0.5, -1);
        }
    }

    // ── 7. 【古道遗痕 (Roadside Relic)】：城郊路旁废弃破木车伴生木桶与火把 ──
    if (shuffledMidPlain.length > 6) {
        const rSpot = shuffledMidPlain[5];
        if (pushSafeDecor('BATTLEFIELD:CART_BROKEN', rSpot.x, rSpot.y, 0.90, 0, false)) {
            pushSafeDecor('BARRELS', rSpot.x + 26, rSpot.y + 10, 0.80, 0, false);
        }
        const torchSpot = shuffledMidPlain[6];
        pushSafeDecor('BATTLEFIELD:TORCH_A', torchSpot.x, torchSpot.y, 0.95, 0, false);
    }

    // ── 大城 / 中城 / 小城 / 城寨 / 险要 城内景观与 67 文化专属植被（树种与数量严格对齐 67 文化及战略/战术环境模型） ──
    const defCityForInterior: any = this.defenderCityRecord();
    const interiorBldStyle = defCityForInterior?.buildingStyle ?? this.environmentPlan?.buildingStyle;
    const isYurtOrNomadCity = this.buildingStyleFor(1) === 'YURT' || interiorBldStyle === 'MONGOL' || interiorBldStyle === 'MOBEI_MONGOL' || interiorBldStyle === 'YURT';
    const isWallLessYurtCamp = this.buildingStyleFor(1) === 'YURT' || interiorBldStyle === 'MOBEI_MONGOL' || interiorBldStyle === 'YURT';
    if (this.defenderCityType === 'big_city' || this.defenderCityType === 'medium_city' || this.defenderCityType === 'small_city' || this.defenderCityType === 'stockade' || this.defenderCityType === 'pass') {
        const TW = 96, TH = 48;
        const isoToWorld = (ci: number, cj: number): { x: number; y: number } => {
            let dx = (ci - cj) * (TW * 0.5);
            const dy = (ci + cj) * (TH * 0.5);
            if (this.deCity?.mirror) dx = -dx;
            return { x: cx + dx, y: cy + dy };
        };
        const worldToIso = (wx: number, wy: number): { ci: number; cj: number } => {
            const u = ((wx - cx) * (this.deCity?.mirror ? -1 : 1)) / (TW * 0.5);
            const v = (wy - cy) / (TH * 0.5);
            return { ci: (v + u) * 0.5, cj: (v - u) * 0.5 };
        };
        // 提取已落位城内建筑与城墙的精确等轴网格包围盒，确保城内树木与装饰物绝不压占或紧贴任何建筑
        const interiorBldBoxes: Array<{ ti: number; tj: number; halfS: number; isWall: boolean }> = [];
        for (const sp of this.decorSprites) {
            if (!sp.asset.startsWith('BUILDING:') || sp.asset.startsWith('BUILDING:SCEN_FLAG') || sp.asset === 'BUILDING:RUGS') continue;
            const { ci: bti, cj: btj } = worldToIso(sp.x, sp.y);
            const isWallPiece = /WALL|PALISADE|FENCE|GATE/.test(sp.asset);
            const halfS = isWallPiece
                ? 0.55
                : /CASTLE|TOWN_CENTER|MARKET|UNIVERSITY|WONDER/.test(sp.asset)
                    ? 2.0
                    : /MONASTERY|SIEGE_WORKSHOP|BARRACKS|ARCHERY_RANGE|STABLE|BLACKSMITH/.test(sp.asset)
                        ? 1.5
                        : 1.0;
            interiorBldBoxes.push({ ti: bti, tj: btj, halfS, isWall: isWallPiece });
        }

        const placedInteriorPts: Array<{ x: number; y: number }> = [];
        const MIN_INTERIOR_DECOR_DIST = 92; // 城内装饰物之间的最小等轴间距（严禁挨着或重叠）
        const pushInteriorDecor = (asset: string, ci: number, cj: number, scale: number, z = 0, ignoreWalls = false): boolean => {
            const padBld = 0.32;
            const padWall = 0.25;
            for (const b of interiorBldBoxes) {
                if (b.isWall && ignoreWalls) continue;
                const lim = b.halfS + (b.isWall ? padWall : padBld);
                if (Math.abs(ci - b.ti) < lim && Math.abs(cj - b.tj) < lim) return false;
            }
            const pt = isoToWorld(ci, cj);
            for (const p of placedInteriorPts) {
                if (Math.hypot(pt.x - p.x, (pt.y - p.y) * 1.5) < MIN_INTERIOR_DECOR_DIST) return false;
            }
            placedInteriorPts.push({ x: pt.x, y: pt.y });
            const lift = gl.elevationLiftAt(pt.x, pt.y, W, H);
            this.ensureNatureAsset(asset);
            const sp: DecorSprite = {
                asset,
                frame: Math.floor(mRnd() * 100),
                x: pt.x,
                y: pt.y,
                flip: mRnd() < 0.5,
                layer: 'world',
                z,
                lift,
                scale,
                obstruction: undefined,
                obstructionContactSec: 0,
                obstructionTouched: false,
                obstructionDisabled: true,
            };
            (sp as any).cityInterior = true;
            this.decorSprites.push(sp);
            return true;
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

        // 1) 四座城门内侧迎宾立柱火把（无墙毡帐营地跳过）
        if (!isWallLessYurtCamp) {
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
                pushInteriorDecor(tAsset, ti + ji, tj + jj, 0.88 + mRnd() * 0.08, 0, true);
            }
        }

        // 1b) 大城 / 中城：四座城门跨护城河桥头外侧迎宾火把与仪仗（东方/非欧洲城池门口律用立柱火把，不放西方木框竖旗）
        if (!isWallLessYurtCamp && (this.defenderCityType === 'big_city' || this.defenderCityType === 'medium_city')) {
            const deStyleForInterior = this.buildingStyleFor(1);
            const isWesternGateStyle = deStyleForInterior === 'WEST'
                || deStyleForInterior === 'EAST'
                || deStyleForInterior === 'SLAV'
                || deStyleForInterior === 'MEDI'
                || deStyleForInterior === 'GREEK'
                || deStyleForInterior === 'THRACIAN';
            const interiorGateSideAsset = !isWesternGateStyle
                ? 'BATTLEFIELD:TORCH_B'
                : (deStyleForInterior === 'GREEK' || deStyleForInterior === 'THRACIAN')
                    ? 'BUILDING:SCEN_FLAG_MACEDONIAN'
                    : (deStyleForInterior === 'SLAV' || deStyleForInterior === 'MEDI')
                        ? 'BUILDING:SCEN_FLAG_D'
                        : 'BUILDING:SCEN_FLAG_E';
            const outerBridgeTorchAndFlags: ReadonlyArray<readonly [number, number, string, number]> = this.defenderCityType === 'big_city'
                ? [
                    [-12.8, -1.6, interiorGateSideAsset, 0.86],
                    [-12.8, 2.6, 'BATTLEFIELD:TORCH_A', 0.88],
                    [13.8, -1.6, 'BATTLEFIELD:TORCH_B', 0.88],
                    [13.8, 2.6, interiorGateSideAsset, 0.86],
                    [-1.6, -12.8, 'BATTLEFIELD:TORCH_A', 0.88],
                    [2.6, -12.8, interiorGateSideAsset, 0.86],
                    [-1.6, 13.8, interiorGateSideAsset, 0.86],
                    [2.6, 13.8, 'BATTLEFIELD:TORCH_B', 0.88],
                ]
                : [
                    [-11.8, -1.6, interiorGateSideAsset, 0.84],
                    [12.8, 2.6, interiorGateSideAsset, 0.84],
                    [2.6, -11.8, 'BATTLEFIELD:TORCH_A', 0.86],
                    [-1.6, 12.8, 'BATTLEFIELD:TORCH_B', 0.86],
                ];
            for (const [bi, bj, bAsset, bScale] of outerBridgeTorchAndFlags) {
                pushInteriorDecor(bAsset, bi + (mRnd() - 0.5) * 0.16, bj + (mRnd() - 0.5) * 0.16, bScale, 0, true);
            }
        }

        // ── 地理气候环境感知：严格契合历史地理地貌（干旱荒漠/戈壁、高寒雪原、温带山岳与湿润丘陵） ──
        const siteBaseTile = this.environmentPlan?.baseTerrain ?? 'gr1';
        const siteLat = defCityForInterior?.lat ?? this.centerLat ?? 30;
        const siteLng = defCityForInterior?.lng ?? this.centerLng ?? 110;
        const isGobiTile = /^(ds5|qs|pal1)/i.test(siteBaseTile);
        const isSandOrGobiTile = /^(des|pal|ds5|qs|pal1)/i.test(siteBaseTile);
        const isAridSite = isSandOrGobiTile || /gravel|drt/.test(siteBaseTile);
        const isSnowSite = isSnow;

        // 2) 🔴 [2026-11-04 主人令「根据67文化的不同，在城中添加对应的植被，和数量的多少。植被要和战略模式，战术模式保持一致」]
        //    · 树种一致：按 67 文化各自的代表园林/乡土树种选候选池，再逐棵过 `plantRegionalizeTree(siteLat, siteLng, ...)`
        //      与 `seasonalDeTree(..., calSeason, isSnow)`，保证城内每一棵树都与战略模式（`VegetationLayer` / `CityLifeAmbientLayer`
        //      查 `ZONE_PLANTS[envZoneAt]`）和战术模式（`TreeAssignment.pickTree` + `Scene13DeTrees`）100% 同源一致；
        //    · 数量一致：结合 67 文化的园林/森林繁茂度档位（江南/湖广/巴蜀/日本/南洋/雨林繁茂 > 东北/北欧/凯尔特山林 >
        //      中原/河朔/西欧/地中海温带适中 > 波斯/天方/西域/青藏绿洲疏朗 > 塞外游牧极疏）与战略/战术同源的
        //      `forestCoverAt` / `forestPotentialAt` 森林覆盖度，动态决定每座城内的乔灌木数量。
        const styleKey = String(interiorBldStyle || this.buildingStyleFor(1) || 'CENTRAL').toUpperCase();
        const CULTURE_VEG_TABLE: Readonly<Record<string, {
            trees: readonly string[];
            shrubs: readonly string[];
            mult: number;
            flowerbed: boolean;
        }>> = {
            // ── Tier 1：江南水乡、湖广、巴蜀、日本、百越、南洋、南亚季风与热带雨林文化（繁茂园林 · 系数 1.32~1.48） ──
            JIANGNAN:     { trees: ['BAMBOO', 'WILLOW', 'PEACH_BLOSSOM', 'ASIAN_MAPLE_GREEN'], shrubs: ['BUSH_GREEN', 'SHRUB_GREEN', 'FERNPATCH'], mult: 1.48, flowerbed: true },
            HUGUANG:      { trees: ['BAMBOO', 'LUSH_BAMBOO', 'WILLOW', 'ASIAN_PINE', 'ASIAN_MAPLE_GREEN'], shrubs: ['BUSH_GREEN', 'SHRUB_GREEN', 'FERNPATCH'], mult: 1.45, flowerbed: true },
            BASHU:        { trees: ['BAMBOO', 'LUSH_BAMBOO', 'ASIAN_PINE', 'ASIAN_MAPLE_GREEN'], shrubs: ['BUSH_GREEN', 'SHRUB_GREEN', 'FERNPATCH'], mult: 1.45, flowerbed: true },
            JAPAN:        { trees: ['PEACH_BLOSSOM', 'ASIAN_MAPLE_GREEN', 'ASIAN_PINE', 'BAMBOO'], shrubs: ['BUSH_GREEN', 'SHRUB_GREEN', 'FERNPATCH'], mult: 1.42, flowerbed: true },
            VIETNAMESE:   { trees: ['LUSH_BAMBOO', 'BAMBOO', 'RAINFOREST', 'JUNGLE', 'WAX_PALM'], shrubs: ['BUSH_GREEN', 'FERNPATCH', 'SHRUB_GREEN'], mult: 1.45, flowerbed: true },
            KHMER:        { trees: ['LUSH_BAMBOO', 'RAINFOREST', 'JUNGLE', 'WAX_PALM', 'PALM'], shrubs: ['BUSH_GREEN', 'FERNPATCH', 'SHRUB_GREEN'], mult: 1.48, flowerbed: true },
            BURMESE:      { trees: ['LUSH_BAMBOO', 'RAINFOREST', 'JUNGLE', 'WAX_PALM'], shrubs: ['BUSH_GREEN', 'FERNPATCH', 'SHRUB_GREEN'], mult: 1.45, flowerbed: true },
            MALAY:        { trees: ['WAX_PALM', 'RAINFOREST', 'JUNGLE', 'LUSH_BAMBOO', 'MANGROVE'], shrubs: ['BUSH_GREEN', 'FERNPATCH', 'SHRUB_GREEN'], mult: 1.48, flowerbed: false },
            SEAS:         { trees: ['LUSH_BAMBOO', 'RAINFOREST', 'JUNGLE', 'WAX_PALM'], shrubs: ['BUSH_GREEN', 'FERNPATCH', 'SHRUB_GREEN'], mult: 1.45, flowerbed: true },
            BENGALIS:     { trees: ['WAX_PALM', 'JUNGLE', 'RAINFOREST', 'BAMBOO', 'MANGROVE'], shrubs: ['BUSH_GREEN', 'FERNPATCH', 'SHRUB_GREEN'], mult: 1.42, flowerbed: true },
            INDIA:        { trees: ['WAX_PALM', 'JUNGLE', 'BAMBOO', 'RAINFOREST', 'ACACIA'], shrubs: ['BUSH_GREEN', 'SHRUB_GREEN'], mult: 1.35, flowerbed: true },
            INDI:         { trees: ['WAX_PALM', 'JUNGLE', 'BAMBOO', 'RAINFOREST', 'ACACIA'], shrubs: ['BUSH_GREEN', 'SHRUB_GREEN'], mult: 1.35, flowerbed: true },
            MUGHAL:       { trees: ['WAX_PALM', 'CYPRESS', 'JUNGLE', 'BAMBOO', 'ACACIA'], shrubs: ['BUSH_GREEN', 'SHRUB_GREEN'], mult: 1.28, flowerbed: true },
            MAYANS:       { trees: ['JUNGLE', 'RAINFOREST', 'WAX_PALM', 'PINE'], shrubs: ['BUSH_GREEN', 'FERNPATCH', 'SHRUB_GREEN'], mult: 1.45, flowerbed: false },
            MESO:         { trees: ['JUNGLE', 'RAINFOREST', 'WAX_PALM', 'PINE'], shrubs: ['BUSH_GREEN', 'FERNPATCH', 'SHRUB_GREEN'], mult: 1.42, flowerbed: false },
            TUPI:         { trees: ['BRAZILWOOD', 'RAINFOREST', 'JUNGLE', 'WAX_PALM'], shrubs: ['BUSH_GREEN', 'FERNPATCH', 'SHRUB_GREEN'], mult: 1.48, flowerbed: false },
            MUISCA:       { trees: ['WAX_PALM', 'RAINFOREST', 'JUNGLE', 'MONKEY_PUZZLE'], shrubs: ['BUSH_GREEN', 'FERNPATCH', 'SHRUB_GREEN'], mult: 1.38, flowerbed: false },

            // ── Tier 2：白山黑水、波罗的、北欧寒温带林、凯尔特与北美林地文化（山林葱郁 · 系数 1.15~1.28） ──
            NORTHEAST:    { trees: ['BIRCH_GREEN', 'ASIAN_PINE', 'SPRUCE', 'OAK'], shrubs: ['BUSH_TREE_B', 'SHRUB_GREEN', 'FORAGE_BUSH'], mult: 1.28, flowerbed: false },
            LITHUANIANS:  { trees: ['BIRCH_GREEN', 'PINE', 'SPRUCE', 'OAK'], shrubs: ['BUSH_TREE_B', 'SHRUB_GREEN', 'FORAGE_BUSH'], mult: 1.28, flowerbed: false },
            VARANGIANS:   { trees: ['BIRCH_GREEN', 'PINE', 'SPRUCE', 'OAK'], shrubs: ['BUSH_TREE_B', 'SHRUB_GREEN', 'FORAGE_BUSH'], mult: 1.26, flowerbed: false },
            VIKINGS:      { trees: ['BIRCH_GREEN', 'PINE', 'SPRUCE', 'OAK'], shrubs: ['SHRUB_GREEN', 'BUSH_TREE_B', 'FORAGE_BUSH'], mult: 1.18, flowerbed: false },
            DANES:        { trees: ['BIRCH_GREEN', 'PINE', 'OAK', 'SPRUCE'], shrubs: ['SHRUB_GREEN', 'BUSH_TREE_B', 'FORAGE_BUSH'], mult: 1.18, flowerbed: false },
            CELTS:        { trees: ['OAK', 'BIRCH_GREEN', 'PINE', 'SPRUCE'], shrubs: ['SHRUB_GREEN', 'FERNPATCH', 'FORAGE_BUSH'], mult: 1.22, flowerbed: false },
            BRITONS:      { trees: ['OAK', 'BIRCH_GREEN', 'WILLOW', 'PINE'], shrubs: ['BUSH_GREEN', 'SHRUB_GREEN', 'FERNPATCH'], mult: 1.18, flowerbed: true },
            SAXONS:       { trees: ['OAK', 'BIRCH_GREEN', 'WILLOW', 'PINE'], shrubs: ['BUSH_GREEN', 'SHRUB_GREEN', 'FERNPATCH'], mult: 1.18, flowerbed: true },
            GERMANIC:     { trees: ['OAK', 'PINE', 'BIRCH_GREEN', 'SPRUCE'], shrubs: ['SHRUB_GREEN', 'BUSH_GREEN', 'FERNPATCH'], mult: 1.16, flowerbed: true },
            GOTHS:        { trees: ['OAK', 'PINE', 'BIRCH_GREEN', 'CYPRESS'], shrubs: ['SHRUB_GREEN', 'BUSH_GREEN'], mult: 1.12, flowerbed: false },
            AMERICA:      { trees: ['OAK', 'PINE', 'BIRCH_GREEN', 'SPRUCE', 'CACTUS'], shrubs: ['SHRUB_GREEN', 'BUSH_TREE_B', 'FORAGE_BUSH'], mult: 1.20, flowerbed: false },
            MAPUCHE:      { trees: ['MONKEY_PUZZLE', 'GREEN_OAK', 'ACACIA'], shrubs: ['SHRUB_GREEN', 'FERNPATCH', 'FORAGE_BUSH'], mult: 1.16, flowerbed: false },
            PURU:         { trees: ['ASIAN_PINE', 'WAX_PALM', 'BAMBOO', 'ACACIA'], shrubs: ['SHRUB_GREEN', 'BUSH_GREEN'], mult: 1.12, flowerbed: true },

            // ── Tier 3：中原、河朔、高丽、西欧、东欧、地中海古典与安第斯文化（温带庭院 · 系数 0.92~1.12） ──
            CENTRAL:      { trees: ['OAK', 'WILLOW', 'ASIAN_PINE', 'PEACH_BLOSSOM', 'ASIAN_MAPLE_GREEN'], shrubs: ['BUSH_GREEN', 'SHRUB_GREEN'], mult: 1.06, flowerbed: true },
            WEI:          { trees: ['OAK', 'ASIAN_PINE', 'WILLOW', 'BIRCH_GREEN'], shrubs: ['SHRUB_GREEN', 'BUSH_GREEN', 'BUSH_TREE_B'], mult: 0.98, flowerbed: true },
            ASIA:         { trees: ['OAK', 'ASIAN_PINE', 'WILLOW', 'BAMBOO'], shrubs: ['BUSH_GREEN', 'SHRUB_GREEN'], mult: 1.05, flowerbed: true },
            KOREA:        { trees: ['ASIAN_PINE', 'OAK', 'ASIAN_MAPLE_GREEN', 'BIRCH_GREEN', 'PEACH_BLOSSOM'], shrubs: ['BUSH_GREEN', 'SHRUB_GREEN'], mult: 1.12, flowerbed: true },
            FRANKS:       { trees: ['OAK', 'SCENARIO_TREE_C', 'BIRCH_GREEN', 'PINE', 'WILLOW'], shrubs: ['BUSH_GREEN', 'SHRUB_GREEN'], mult: 1.08, flowerbed: true },
            BURGUNDIANS:  { trees: ['OAK', 'SCENARIO_TREE_C', 'BIRCH_GREEN', 'PINE'], shrubs: ['BUSH_GREEN', 'SHRUB_GREEN'], mult: 1.08, flowerbed: true },
            WEST:         { trees: ['OAK', 'SCENARIO_TREE_C', 'BIRCH_GREEN', 'PINE'], shrubs: ['BUSH_GREEN', 'SHRUB_GREEN'], mult: 1.06, flowerbed: true },
            SLAVIC:       { trees: ['OAK', 'BIRCH_GREEN', 'PINE', 'SPRUCE'], shrubs: ['SHRUB_GREEN', 'BUSH_GREEN', 'BUSH_TREE_B'], mult: 1.05, flowerbed: false },
            SLAV:         { trees: ['OAK', 'BIRCH_GREEN', 'PINE', 'SPRUCE'], shrubs: ['SHRUB_GREEN', 'BUSH_GREEN', 'BUSH_TREE_B'], mult: 1.05, flowerbed: false },
            POLES:        { trees: ['OAK', 'BIRCH_GREEN', 'PINE', 'SPRUCE'], shrubs: ['SHRUB_GREEN', 'BUSH_GREEN'], mult: 1.06, flowerbed: true },
            BOHEMIANS:    { trees: ['OAK', 'BIRCH_GREEN', 'PINE', 'SPRUCE'], shrubs: ['SHRUB_GREEN', 'BUSH_GREEN'], mult: 1.06, flowerbed: true },
            MAGYAR:       { trees: ['OAK', 'BIRCH_GREEN', 'PINE', 'WILLOW'], shrubs: ['SHRUB_GREEN', 'BUSH_GREEN'], mult: 0.98, flowerbed: false },
            ROMA:         { trees: ['ITALIAN_PINE', 'CYPRESS', 'OLIVE', 'GREEN_OAK'], shrubs: ['BUSH_GREEN', 'SHRUB_GREEN'], mult: 1.05, flowerbed: true },
            LATIN:        { trees: ['ITALIAN_PINE', 'CYPRESS', 'OLIVE', 'GREEN_OAK'], shrubs: ['BUSH_GREEN', 'SHRUB_GREEN'], mult: 1.05, flowerbed: true },
            SICILIANS:    { trees: ['OLIVE', 'ITALIAN_PINE', 'CYPRESS', 'PALM'], shrubs: ['BUSH_GREEN', 'SHRUB_GREEN'], mult: 1.02, flowerbed: true },
            SPANISH:      { trees: ['OLIVE', 'ITALIAN_PINE', 'CYPRESS', 'GREEN_OAK'], shrubs: ['BUSH_GREEN', 'SHRUB_GREEN'], mult: 1.02, flowerbed: true },
            PORTUGUESE:   { trees: ['OLIVE', 'ITALIAN_PINE', 'CYPRESS', 'GREEN_OAK', 'PALM'], shrubs: ['BUSH_GREEN', 'SHRUB_GREEN'], mult: 1.05, flowerbed: true },
            MEDI:         { trees: ['ITALIAN_PINE', 'OLIVE', 'CYPRESS', 'GREEN_OAK'], shrubs: ['BUSH_GREEN', 'SHRUB_GREEN'], mult: 1.04, flowerbed: true },
            GREECE:       { trees: ['OLIVE', 'CYPRESS', 'ITALIAN_PINE', 'GREEN_OAK'], shrubs: ['SHRUB_GREEN', 'BUSH_GREEN'], mult: 1.00, flowerbed: true },
            GREEK:        { trees: ['OLIVE', 'CYPRESS', 'ITALIAN_PINE', 'GREEN_OAK'], shrubs: ['SHRUB_GREEN', 'BUSH_GREEN'], mult: 1.00, flowerbed: true },
            ATHENIANS:    { trees: ['OLIVE', 'CYPRESS', 'ITALIAN_PINE', 'GREEN_OAK'], shrubs: ['SHRUB_GREEN', 'BUSH_GREEN'], mult: 1.02, flowerbed: true },
            SPARTANS:     { trees: ['OLIVE', 'CYPRESS', 'GREEN_OAK', 'ITALIAN_PINE'], shrubs: ['SHRUB_GREEN', 'BUSH_GREEN'], mult: 0.96, flowerbed: false },
            MACEDONIAN:   { trees: ['OLIVE', 'CYPRESS', 'OAK', 'PINE'], shrubs: ['SHRUB_GREEN', 'BUSH_GREEN'], mult: 0.98, flowerbed: true },
            BYZANTINE:    { trees: ['CYPRESS', 'OLIVE', 'ITALIAN_PINE', 'OAK'], shrubs: ['BUSH_GREEN', 'SHRUB_GREEN'], mult: 1.04, flowerbed: true },
            EAST:         { trees: ['CYPRESS', 'OLIVE', 'OAK', 'ITALIAN_PINE'], shrubs: ['BUSH_GREEN', 'SHRUB_GREEN'], mult: 1.02, flowerbed: true },
            THRACIAN:     { trees: ['OAK', 'CYPRESS', 'OLIVE', 'PINE'], shrubs: ['SHRUB_GREEN', 'BUSH_GREEN'], mult: 1.00, flowerbed: false },
            BULGARIANS:   { trees: ['OAK', 'CYPRESS', 'BIRCH_GREEN', 'PINE'], shrubs: ['SHRUB_GREEN', 'BUSH_GREEN'], mult: 1.00, flowerbed: false },
            ARMENIANS:    { trees: ['OAK', 'CYPRESS', 'PINE', 'BIRCH_GREEN'], shrubs: ['SHRUB_GREEN', 'BUSH_GREEN'], mult: 0.94, flowerbed: false },
            GEORGIANS:    { trees: ['OAK', 'CYPRESS', 'PINE', 'BIRCH_GREEN'], shrubs: ['SHRUB_GREEN', 'BUSH_GREEN'], mult: 0.98, flowerbed: false },
            INCA:         { trees: ['MONKEY_PUZZLE', 'GREEN_OAK', 'ACACIA'], shrubs: ['SHRUB_GREEN', 'BUSH_TREE_A'], mult: 0.92, flowerbed: false },
            ANDE:         { trees: ['MONKEY_PUZZLE', 'GREEN_OAK', 'ACACIA'], shrubs: ['SHRUB_GREEN', 'BUSH_TREE_A'], mult: 0.92, flowerbed: false },

            // ── Tier 4：波斯四分园、天方绿洲、北非、萨凡纳、青藏与丝路绿洲文化（绿洲/高原疏朗 · 系数 0.58~0.78） ──
            PERSIAN:      { trees: ['CYPRESS', 'PALM', 'OLIVE', 'OAK'], shrubs: ['SHRUB_GREEN', 'BUSH_TREE_A'], mult: 0.78, flowerbed: true },
            SASANIAN:     { trees: ['CYPRESS', 'PALM', 'OLIVE', 'OAK'], shrubs: ['SHRUB_GREEN', 'BUSH_TREE_A'], mult: 0.76, flowerbed: true },
            ORIE:         { trees: ['PALM', 'OLIVE', 'CYPRESS', 'ACACIA', 'DRAGON_TREE'], shrubs: ['BUSH_TREE_A', 'SHRUB_GREEN', 'GRASS_DRY'], mult: 0.65, flowerbed: true },
            BERBER:       { trees: ['PALM', 'OLIVE', 'CYPRESS', 'ACACIA'], shrubs: ['BUSH_TREE_A', 'SHRUB_GREEN', 'GRASS_DRY'], mult: 0.65, flowerbed: true },
            GURJARAS:     { trees: ['ACACIA', 'WAX_PALM', 'PALM', 'JUNGLE'], shrubs: ['BUSH_TREE_A', 'SHRUB_GREEN', 'GRASS_DRY'], mult: 0.78, flowerbed: true },
            AFRICA:       { trees: ['BAOBAB', 'ACACIA', 'PALM', 'JUNGLE'], shrubs: ['BUSH_TREE_A', 'SHRUB_GREEN', 'GRASS_DRY'], mult: 0.72, flowerbed: false },
            AFRI:         { trees: ['BAOBAB', 'ACACIA', 'PALM', 'JUNGLE'], shrubs: ['BUSH_TREE_A', 'SHRUB_GREEN', 'GRASS_DRY'], mult: 0.72, flowerbed: false },
            ETHIOPIANS:   { trees: ['ACACIA', 'BAOBAB', 'PALM', 'JUNGLE'], shrubs: ['BUSH_TREE_A', 'SHRUB_GREEN', 'GRASS_DRY'], mult: 0.72, flowerbed: false },
            TIBET:        { trees: ['CYPRESS', 'SPRUCE', 'ASIAN_PINE', 'BIRCH_GREEN'], shrubs: ['BUSH_TREE_A', 'SHRUB_GREEN', 'GRASS_DRY'], mult: 0.65, flowerbed: false },
            WESTERN:      { trees: ['WILLOW', 'PALM', 'BUSH_TREE_A', 'SPRUCE'], shrubs: ['BUSH_TREE_A', 'GRASS_DRY'], mult: 0.58, flowerbed: false },
            CENTRAL_ASIA: { trees: ['WILLOW', 'CYPRESS', 'PALM', 'BIRCH_GREEN', 'BUSH_TREE_A'], shrubs: ['BUSH_TREE_A', 'SHRUB_GREEN', 'GRASS_DRY'], mult: 0.68, flowerbed: true },
            CEAS:         { trees: ['WILLOW', 'CYPRESS', 'PALM', 'BIRCH_GREEN', 'BUSH_TREE_A'], shrubs: ['BUSH_TREE_A', 'SHRUB_GREEN', 'GRASS_DRY'], mult: 0.68, flowerbed: true },
            HEXI:         { trees: ['WILLOW', 'BUSH_TREE_A', 'ASIAN_PINE', 'BIRCH_GREEN', 'OAK'], shrubs: ['BUSH_TREE_A', 'GRASS_DRY', 'SHRUB_GREEN'], mult: 0.62, flowerbed: false },
            TURKS:        { trees: ['CYPRESS', 'OAK', 'OLIVE', 'WILLOW', 'BUSH_TREE_A'], shrubs: ['SHRUB_GREEN', 'BUSH_TREE_A'], mult: 0.76, flowerbed: true },

            // ── Tier 5：大漠游牧与塞外草原王帐文化（苍茫极疏 · 系数 0.35~0.42） ──
            MONGOL:       { trees: ['BIRCH_GREEN', 'PINE', 'WILLOW', 'BUSH_TREE_A'], shrubs: ['BUSH_TREE_A', 'BUSH_TREE_B', 'GRASS_DRY'], mult: 0.38, flowerbed: false },
            MOBEI_MONGOL: { trees: ['BIRCH_GREEN', 'PINE', 'BUSH_TREE_A', 'BUSH_TREE_B'], shrubs: ['BUSH_TREE_A', 'BUSH_TREE_B', 'GRASS_DRY'], mult: 0.35, flowerbed: false },
            YURT:         { trees: ['BIRCH_GREEN', 'PINE', 'BUSH_TREE_A', 'BUSH_TREE_B'], shrubs: ['BUSH_TREE_A', 'BUSH_TREE_B', 'GRASS_DRY'], mult: 0.35, flowerbed: false },
            XIANBEI:      { trees: ['BIRCH_GREEN', 'PINE', 'WILLOW', 'BUSH_TREE_A'], shrubs: ['BUSH_TREE_A', 'BUSH_TREE_B', 'GRASS_DRY'], mult: 0.42, flowerbed: false },
            HUNS:         { trees: ['BIRCH_GREEN', 'OAK', 'PINE', 'BUSH_TREE_A'], shrubs: ['BUSH_TREE_B', 'BUSH_TREE_A', 'GRASS_DRY'], mult: 0.42, flowerbed: false },
            CUMAN:        { trees: ['BIRCH_GREEN', 'PINE', 'WILLOW', 'BUSH_TREE_A'], shrubs: ['BUSH_TREE_B', 'BUSH_TREE_A', 'GRASS_DRY'], mult: 0.42, flowerbed: false },
        };
        const vegProfile = CULTURE_VEG_TABLE[styleKey] ?? CULTURE_VEG_TABLE.CENTRAL;

        // 构建与战略模式（ZONE_PLANTS）和战术模式（pickTree + seasonalDeTree）完全一致的本城树种池
        const leadPick = pickTree({
            baseTile: siteBaseTile,
            lat: siteLat,
            lng: siteLng,
            season: calSeason,
            isSiege: true,
            buildingStyle: styleKey,
        });
        const zoneId: EnvZone = envZoneAt(siteLat, siteLng);
        const zoneMainTrees = ZONE_PLANTS[zoneId].main.map(([t]) => t);
        const rawCandidateTrees = [leadPick, ...vegProfile.trees, ...zoneMainTrees];
        const cityTreePool: string[] = [];
        rawCandidateTrees.forEach((rawT, idx) => {
            if (!rawT) return;
            // 经过植物总表 plantRegionalizeTree 校验：合本环境区的文化树种保留，不合的自动换成本区主树种
            let regTree = plantRegionalizeTree(siteLat, siteLng, rawT, ((idx * 0.27 + mRnd() * 0.19) % 1));
            // 沙地/戈壁护栏：与战术模式 TreeAssignment.guardSandTree 保持一致
            if (isSandOrGobiTile && !/^(PALM|ACACIA|DRAGON_TREE|CACTUS|BUSH_TREE_A|BUSH_TREE_B|DEAD_TREE)$/.test(regTree)) {
                regTree = isGobiTile || siteLat >= 36.0 ? 'BUSH_TREE_A' : 'PALM';
            }
            if (regTree === 'DEAD_TREE') {
                regTree = siteLat >= 35.0 ? 'BUSH_TREE_A' : 'PALM';
            }
            const seasonalTree = seasonalDeTree(regTree, calSeason, isSnow);
            if (!cityTreePool.includes(seasonalTree)) {
                cityTreePool.push(seasonalTree);
            }
        });
        const courtyardTreeAsset = cityTreePool[0] ?? seasonalDeTree(plantTreeAt(siteLat, siteLng, mRnd()), calSeason, isSnow);

        // 下层伴生灌木/竹丛/草本池：与战术地面 DecorFit 及气候严格一致
        const cityShrubPool = vegProfile.shrubs.filter((sh) => {
            if (isSnowSite && (sh === 'FERNPATCH' || sh === 'BUSH_GREEN' || sh === 'GRASS_DRY')) return false;
            if (isAridSite && (sh === 'FERNPATCH' || sh === 'BUSH_GREEN')) return false;
            return decorFits(sh, decorCtx) || /^BUSH_TREE_|^SHRUB_GREEN|^BUSH_GREEN|^GRASS_DRY/.test(sh);
        });
        if (cityShrubPool.length === 0) {
            cityShrubPool.push(isAridSite ? 'BUSH_TREE_A' : (isSnowSite ? 'BUSH_TREE_B' : 'SHRUB_GREEN'));
        }

        // 结合战略/战术同源的森林覆盖模型（forestCoverAt / forestPotentialAt）与 22 环境区自然基底计算植被数量倍率
        const ZONE_BASE_COVER: Readonly<Record<EnvZone, number>> = {
            SEA: 0.90, SAS: 0.82, SWM: 0.88, EAS: 0.85, NEB: 0.85, NEO: 0.90, WEU: 0.78, CEU: 0.78, SIB: 0.82,
            NCP: 0.58, MED: 0.56, AND: 0.55, NAM: 0.68, AFR: 0.52,
            LOE: 0.38, STP: 0.32, TIB: 0.34, WAH: 0.36, AUS: 0.35,
            CAD: 0.20, HDS: 0.18, ARC: 0.22,
        };
        const gameYear = Number((window as any).game?.timeSystem?.getYear?.() ?? (this as any).techYearGetter?.() ?? (this as any).techYear ?? 1000);
        const fPot = forestPotentialAt(siteLat, siteLng);
        const fCov = forestCoverAt(siteLat, siteLng, gameYear);
        const zoneFallbackCover = ZONE_BASE_COVER[zoneId] ?? 0.55;
        const envCover01 = (fPot !== null && fCov !== null)
            ? (0.55 * fCov + 0.45 * fPot)
            : zoneFallbackCover;
        const envDensityFactor = (0.68 + 0.52 * envCover01)
            * (isSandOrGobiTile ? 0.58 : isAridSite ? 0.74 : 1.0)
            * (isSnowSite ? 0.78 : 1.0);
        const totalVegMult = vegProfile.mult * envDensityFactor;

        // 候选植树点：精准对齐 9 组合街区十字街道（±3.0 / 3.8）、城心城堡四角、内墙环道及街坊天井，由 pushInteriorDecor 自动避开一切建筑
        const treeCandidateSlots: ReadonlyArray<readonly [number, number]> = this.defenderCityType === 'big_city'
            ? [
                // 城心四角与十字街核心绿岛
                [-2.8, -2.8], [3.8, 3.8], [-2.8, 3.8], [3.8, -2.8],
                [-3.0, 0.5], [3.8, 0.5], [0.5, -3.0], [0.5, 3.8],
                // 四条井字长街行道树位
                [-3.0, -6.2], [3.8, -6.2], [-3.0, 7.2], [3.8, 7.2],
                [-6.2, -3.0], [-6.2, 3.8], [7.2, -3.0], [7.2, 3.8],
                // 街尾近墙游园位（避开四门 0.5）
                [-3.0, -8.5], [3.8, -8.5], [-3.0, 9.5], [3.8, 9.5],
                [-8.5, -3.0], [-8.5, 3.8], [9.5, -3.0], [9.5, 3.8],
                // 四象限街坊天井位（若该象限为 4×4 大建筑则由碰撞检测自动跳过，若为 2×2 田字院或 3×3 独院则自然落入天井）
                [-6.5, -6.5], [7.5, 7.5], [-6.5, 7.5], [7.5, -6.5],
                [-4.5, -4.5], [5.5, 5.5], [-4.5, 5.5], [5.5, -4.5],
            ]
            : this.defenderCityType === 'medium_city'
                ? [
                    // 城心四角与十字街核心
                    [-2.8, -2.8], [3.7, 3.7], [-2.8, 3.7], [3.7, -2.8],
                    [-2.9, 0.5], [3.7, 0.5], [0.5, -2.9], [0.5, 3.7],
                    // 井字街行道树位
                    [-2.9, -5.6], [3.7, -5.6], [-2.9, 6.6], [3.7, 6.6],
                    [-5.6, -2.9], [-5.6, 3.7], [6.6, -2.9], [6.6, 3.7],
                    // 街尾与街坊天井位
                    [-2.9, -7.5], [3.7, 8.5], [-7.5, 3.7], [8.5, -2.9],
                    [-5.5, -5.5], [6.5, 6.5], [-5.5, 6.5], [6.5, -5.5],
                    [-4.2, -7.2], [5.2, 8.2], [-7.2, 5.2], [8.2, -4.2],
                ]
                : this.defenderCityType === 'small_city'
                    ? [
                        [-2.4, -2.4], [3.4, 3.4], [-2.4, 3.4], [3.4, -2.4],
                        [-2.6, 0.5], [3.6, 0.5], [0.5, -2.6], [0.5, 3.6],
                        [-5.4, -2.2], [6.4, 3.2], [-2.2, 6.4], [3.2, -5.4],
                        [-5.4, 3.2], [6.4, -2.2], [-2.2, -5.4], [3.2, 6.4],
                    ]
                    : this.defenderCityType === 'stockade'
                        ? [
                            [-2.4, -2.4], [2.8, 2.8], [-2.4, 2.8], [2.8, -2.4],
                            [-4.8, -1.8], [5.2, 1.8], [-1.8, 5.2], [1.8, -4.8],
                            [-4.8, 2.2], [5.2, -2.2], [-2.2, -4.8], [2.2, 5.2],
                        ]
                        : [
                            // 险要内城校场与夹道空隙
                            [-2.6, -2.6], [3.6, 3.6], [-2.6, 3.6], [3.6, -2.6],
                            [-2.8, 0.5], [3.8, 0.5], [0.5, -2.8], [0.5, 3.8],
                        ];
        if (treeCandidateSlots.length > 0) {
            const baseCount = this.defenderCityType === 'big_city'
                ? 7.5
                : this.defenderCityType === 'medium_city'
                    ? 5.0
                    : this.defenderCityType === 'small_city'
                        ? 3.0
                        : this.defenderCityType === 'stockade'
                            ? 2.2
                            : 1.4;
            const maxCap = this.defenderCityType === 'big_city'
                ? 15
                : this.defenderCityType === 'medium_city'
                    ? 10
                    : this.defenderCityType === 'small_city'
                        ? 6
                        : this.defenderCityType === 'stockade'
                            ? 5
                            : 3;
            const minCap = (this.defenderCityType === 'big_city' || this.defenderCityType === 'medium_city') ? 1 : 0;
            const targetTreeCount = Math.max(
                minCap,
                Math.min(maxCap, Math.round(baseCount * totalVegMult + (mRnd() - 0.35) * 1.2)),
            );
            const shuffledTreeSlots = shuffleWithMSeed(treeCandidateSlots);
            let placedTrees = 0;
            for (let sIdx = 0; sIdx < shuffledTreeSlots.length && placedTrees < targetTreeCount; sIdx++) {
                const [ti, tj] = shuffledTreeSlots[sIdx];
                const jx = (mRnd() - 0.5) * 0.24;
                const jy = (mRnd() - 0.5) * 0.24;
                // 主乔木占 70%（从本城文化+环境区合法树种池按权重轮转，保证主导树种鲜明且兼具同区伴生树），下层灌木占 30%
                const useShrub = placedTrees > 0 && mRnd() < (totalVegMult < 0.55 ? 0.50 : 0.28);
                const treeAsset = useShrub
                    ? cityShrubPool[placedTrees % cityShrubPool.length]
                    : cityTreePool[placedTrees === 0 ? 0 : (Math.floor(mRnd() * Math.min(cityTreePool.length, 3)))];
                const scale = useShrub ? (0.72 + mRnd() * 0.14) : (0.76 + mRnd() * 0.16);
                if (pushInteriorDecor(treeAsset, ti + jx, tj + jy, scale)) {
                    placedTrees++;
                }
            }
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
            // 候选道具池：混入残桩、倒木、67 文化对应灌木、粮桶、碎石、破辎重车
            const stockadeFlora = cityShrubPool[0] ?? (isAridSite ? 'GRASS_DRY' : 'SHRUB_GREEN');
            const stockadePropsPool = [
                'BARRELS',
                stockadeFlora,
                'STUMP_GENERIC',
                'FELLED_GENERIC',
                'BATTLEFIELD:CART_BROKEN',
                'ROCK1',
                'ROCK2',
                'BARRELS',
                cityShrubPool[1 % cityShrubPool.length] ?? stockadeFlora,
            ];
            const stockadeCount = 5 + Math.floor(mRnd() * 3); // 每座城寨随机 5~7 处装饰
            const chosenSlots = shuffleWithMSeed(stockadeCandidates);
            const shuffledPool = shuffleWithMSeed(stockadePropsPool);
            let placedStockadeProps = 0;
            for (let idx = 0; idx < chosenSlots.length && placedStockadeProps < stockadeCount; idx++) {
                const [pi, pj] = chosenSlots[idx];
                const pAsset = shuffledPool[placedStockadeProps % shuffledPool.length];
                const ji = (mRnd() - 0.5) * 0.24;
                const jj = (mRnd() - 0.5) * 0.24;
                const pScale = pAsset === 'STUMP_GENERIC' ? (0.72 + mRnd() * 0.08)
                    : pAsset === 'FELLED_GENERIC' ? (0.75 + mRnd() * 0.10)
                    : pAsset === 'BUSH_GREEN' || pAsset === 'SHRUB_GREEN' || pAsset.startsWith('BUSH_TREE') ? (0.74 + mRnd() * 0.12)
                    : pAsset === 'BATTLEFIELD:CART_BROKEN' ? (0.80 + mRnd() * 0.10)
                    : pAsset.startsWith('ROCK') ? (0.68 + mRnd() * 0.12)
                    : (0.78 + mRnd() * 0.10); // BARRELS
                if (pushInteriorDecor(pAsset, pi + ji, pj + jj, pScale)) {
                    placedStockadeProps++;
                }
            }
        } else if (this.defenderCityType === 'pass') {
            // 险要（关隘）：双重石构城郭、瓮城夹道防线、内城校场细节与关外两翼险石拒马
            const deStylePass = this.buildingStyleFor(1);
            // 🔴 旗帜严格按外观区分文化：东方(ASIA)关口用火把或『漢』字战旗 SCEN_FLAG_N，绝不放西方十字/纹章木框竖旗(D/E/S/U)
            const passFlagAsset = deStylePass === 'ASIA'
                ? 'BATTLEFIELD:TORCH_B'
                : (deStylePass === 'GREEK' || deStylePass === 'THRACIAN')
                    ? 'BUILDING:SCEN_FLAG_MACEDONIAN'
                    : (deStylePass === 'ANDE' || deStylePass === 'MESO' || deStylePass === 'YURT')
                        ? 'BUILDING:SCEN_FLAG_RITUAL_A'
                        : (deStylePass === 'SLAV' || deStylePass === 'MEDI')
                            ? 'BUILDING:SCEN_FLAG_D'
                            : (deStylePass === 'WEST' || deStylePass === 'EAST')
                                ? 'BUILDING:SCEN_FLAG_E'
                                : 'BATTLEFIELD:TORCH_B';
            const passSupplyCart = (deStylePass === 'ANDE' || deStylePass === 'MESO')
                ? 'TRADE:TRADE_CART_MESO/move_2'
                : (deStylePass === 'ORIE' || deStylePass === 'PERSIAN')
                    ? 'TRADE:TRADE_CART_ORIE/move_2'
                    : (deStylePass === 'WEST' || deStylePass === 'EAST' || deStylePass === 'CEAS' || deStylePass === 'SLAV' || deStylePass === 'MEDI' || deStylePass === 'GREEK' || deStylePass === 'THRACIAN')
                        ? 'TRADE:TRADE_CART_WEST/move_2'
                        : (deStylePass === 'AFRI' || deStylePass === 'INDI' || deStylePass === 'PURU' || deStylePass === 'SEAS')
                            ? 'TRADE:TRADE_CART_AFRI/move_2'
                            : 'TRADE:TRADE_CART_ASIA/move_2';

            // 1) 内城中枢城堡四角：布置要塞战旗与火把立柱（两套城墙之间紧挨，不摆放任何物品）
            const passCastleCorners: ReadonlyArray<readonly [number, number]> = [
                [-2.2, -2.2], [3.2, 3.2], [-2.2, 3.2], [3.2, -2.2],
            ];
            passCastleCorners.forEach(([ci0, cj0], cIdx) => {
                pushInteriorDecor(cIdx % 2 === 0 ? passFlagAsset : 'BATTLEFIELD:TORCH_A', ci0, cj0, 0.86);
            });

            // 2) 内城校场军备细节（仅限内城校场，删除两套城墙之间的摆放物品）
            const passCandidates: ReadonlyArray<readonly [number, number]> = this.defenderPassLayoutShape === 'rect'
                ? [
                    [-7.5, -1.5], [8.5, 2.5], [-2.2, -3.5], [3.2, 4.5],
                ]
                : this.defenderPassLayoutShape === 'rect_mirror'
                    ? [
                        [-1.5, -7.5], [2.5, 8.5], [-3.5, -2.2], [4.5, 3.2],
                    ]
                    : [
                        [-2.2, -3.2], [3.2, 4.2], [-3.2, 2.2], [4.2, -2.2],
                    ];
            const passFlora = cityShrubPool[0] ?? (isAridSite ? 'GRASS_DRY' : 'SHRUB_GREEN');
            const passPropsPool = [
                'BARRELS',
                passSupplyCart,
                'BATTLEFIELD:CART_BROKEN',
                passFlora,
            ];
            const shuffledPassPool = shuffleWithMSeed(passPropsPool);
            passCandidates.forEach(([pi, pj], idx) => {
                const pAsset = shuffledPassPool[idx % shuffledPassPool.length];
                const ji = (mRnd() - 0.5) * 0.25;
                const jj = (mRnd() - 0.5) * 0.25;
                const pScale = pAsset.startsWith('TRADE:') ? (0.86 + mRnd() * 0.08)
                    : pAsset === 'BATTLEFIELD:CART_BROKEN' ? (0.80 + mRnd() * 0.10)
                    : pAsset.startsWith('BUSH') || pAsset.startsWith('SHRUB') ? (0.74 + mRnd() * 0.12)
                    : (0.80 + mRnd() * 0.10); // BARRELS
                pushInteriorDecor(pAsset, pi + ji, pj + jj, pScale);
            });

            // 3) 关城外围碎石与险石（随机抽选 2~5 处不对称散落点、大范围随机偏移与随机石种，破除固定对称感）
            const pExt = passRingHalfExtents(this.defenderPassShape ?? 'square');
            const ohI = pExt.outerHalfI, ohJ = pExt.outerHalfJ;
            const rawCragZones: ReadonlyArray<readonly [number, number]> = [
                [-(ohI + 3.2), -(ohJ + 2.4)], [ohI + 4.0, -(ohJ + 3.0)], [-(ohI + 2.8), ohJ + 4.2], [ohI + 3.5, ohJ + 3.6],
                [-(ohI + 5.5), -1.2], [ohI + 6.2, 1.8], [-1.5, -(ohJ + 5.8)], [1.8, ohJ + 6.4],
                [-(ohI + 4.8), ohJ - 1.5], [ohI + 5.2, -(ohJ - 1.8)], [-(ohI - 1.6), -(ohJ + 4.6)], [ohI - 1.2, ohJ + 5.0],
                [-(ohI + 7.5), -(ohJ - 3.0)], [ohI + 8.0, ohJ - 2.5], [-(ohI - 2.8), ohJ + 7.2], [ohI - 2.5, -(ohJ + 7.6)],
            ];
            const cragRockAsset = isAridSite ? 'ROCK_FORMATION_DESERT' : (isSnowSite ? 'ROCK_FORMATION_SNOW' : 'ROCK_FORMATION');
            const passRockPool = [cragRockAsset, 'ROCK1', 'ROCK2', 'ROCK3'];
            const targetCragCount = 2 + Math.floor(mRnd() * 4); // 每张图随机 2~5 处，不再八方对称满铺
            const pickedCrags = shuffleWithMSeed(rawCragZones).slice(0, targetCragCount);
            pickedCrags.forEach(([baseI, baseJ]) => {
                const ci0 = baseI + (mRnd() - 0.5) * 3.4;
                const cj0 = baseJ + (mRnd() - 0.5) * 3.4;
                // 确保随机偏移后仍在城墙外至少 2.2 格以外
                if (Math.abs(ci0 - 0.5) < ohI + 2.2 && Math.abs(cj0 - 0.5) < ohJ + 2.2) return;
                const pt = isoToWorld(ci0, cj0);
                if (gl.isWaterAt(pt.x, pt.y, W, H)) return;
                const rAsset = passRockPool[Math.floor(mRnd() * passRockPool.length)];
                pushInteriorDecor(rAsset, ci0, cj0, 0.82 + mRnd() * 0.22, 0, true);
                if (mRnd() < 0.45) {
                    const ang = mRnd() * Math.PI * 2;
                    const distC = 1.3 + mRnd() * 0.8;
                    pushInteriorDecor(
                        mRnd() < 0.5 ? passFlora : courtyardTreeAsset,
                        ci0 + Math.cos(ang) * distC,
                        cj0 + Math.sin(ang) * distC,
                        0.74 + mRnd() * 0.14,
                        0,
                        true,
                    );
                }
            });
        } else if (!isYurtOrNomadCity) {
            // 普通定居城市（大/中/小）：都会/市井街景（按 67 文化区分是否摆放宫苑花坛 FLOWERBED 与对应园林灌木、商市绒毯 RUGS、商贸马车、货箱粮桶）
            const deStyleCity = this.buildingStyleFor(1);
            const urbanCartAsset = (deStyleCity === 'ANDE' || deStyleCity === 'MESO')
                ? 'TRADE:TRADE_CART_MESO/move_2'
                : (deStyleCity === 'ORIE' || deStyleCity === 'PERSIAN')
                    ? 'TRADE:TRADE_CART_ORIE/move_2'
                    : (deStyleCity === 'WEST' || deStyleCity === 'EAST' || deStyleCity === 'CEAS' || deStyleCity === 'SLAV' || deStyleCity === 'MEDI' || deStyleCity === 'GREEK' || deStyleCity === 'THRACIAN')
                        ? 'TRADE:TRADE_CART_WEST/move_2'
                        : (deStyleCity === 'AFRI' || deStyleCity === 'INDI' || deStyleCity === 'PURU' || deStyleCity === 'SEAS')
                            ? 'TRADE:TRADE_CART_AFRI/move_2'
                            : 'TRADE:TRADE_CART_ASIA/move_2';
            const urbanFlagAsset = deStyleCity === 'ASIA'
                ? 'BATTLEFIELD:TORCH_A'
                : (deStyleCity === 'GREEK' || deStyleCity === 'THRACIAN')
                    ? 'BUILDING:SCEN_FLAG_MACEDONIAN'
                    : (deStyleCity === 'ANDE' || deStyleCity === 'MESO' || deStyleCity === 'YURT')
                        ? 'BUILDING:SCEN_FLAG_RITUAL_A'
                        : (deStyleCity === 'SLAV' || deStyleCity === 'MEDI')
                            ? 'BUILDING:SCEN_FLAG_D'
                            : (deStyleCity === 'WEST' || deStyleCity === 'EAST')
                                ? 'BUILDING:SCEN_FLAG_E'
                                : 'BATTLEFIELD:TORCH_A';
            const useFlowerbed = vegProfile.flowerbed && !isSnowSite && !isSandOrGobiTile;

            // 大城 / 中城：城心城堡四角对称布置御苑花坛（或本文化灌木）与仪仗旗（一角一物，绝不叠放挨着）
            if (this.defenderCityType === 'big_city' || this.defenderCityType === 'medium_city') {
                const royalCorners: ReadonlyArray<readonly [number, number]> = [
                    [-2.3, -2.3], [3.3, 3.3], [-2.3, 3.3], [3.3, -2.3],
                ];
                royalCorners.forEach(([ri, rj], rIdx) => {
                    if (rIdx % 2 === 1 && useFlowerbed) {
                        pushInteriorDecor('FLOWERBED', ri, rj, 0.84 + mRnd() * 0.08, -6);
                    } else if (rIdx % 2 === 1 && !isSnowSite && totalVegMult >= 0.85) {
                        pushInteriorDecor(cityShrubPool[0], ri, rj, 0.76 + mRnd() * 0.08);
                    } else {
                        pushInteriorDecor(urbanFlagAsset, ri, rj, 0.85);
                    }
                });
            }

            const cityCandidates: ReadonlyArray<readonly [number, number]> = this.defenderCityType === 'big_city'
                ? [
                    [-3.0, -4.5], [3.8, -4.5], [-3.0, 5.5], [3.8, 5.5],
                    [-4.5, -3.0], [-4.5, 3.8], [5.5, -3.0], [5.5, 3.8],
                    [-3.0, -7.5], [3.8, -7.5], [-3.0, 8.5], [3.8, 8.5],
                    [-7.5, -3.0], [-7.5, 3.8], [8.5, -3.0], [8.5, 3.8],
                ]
                : this.defenderCityType === 'medium_city'
                    ? [
                        [-2.9, -4.4], [3.7, -4.4], [-2.9, 5.4], [3.7, 5.4],
                        [-4.4, -2.9], [-4.4, 3.7], [5.4, -2.9], [5.4, 3.7],
                        [-2.9, -6.8], [3.7, 7.8], [-6.8, 3.7], [7.8, -2.9],
                    ]
                    : [
                        [-2.2, 2.4], [3.2, -1.4], [-1.8, -4.5], [4.5, 1.8],
                        [-4.5, -1.8], [1.8, 4.5], [-5.2, 1.5], [5.2, -1.5],
                        [-1.5, 5.2], [1.5, -5.2],
                    ];
            const primaryShrub = cityShrubPool[0] ?? 'SHRUB_GREEN';
            const secondaryShrub = cityShrubPool[1 % cityShrubPool.length] ?? primaryShrub;
            const cityPropsPool = [
                'BARRELS',
                'BARRELS',
                'BUILDING:RUGS',
                useFlowerbed ? 'FLOWERBED' : primaryShrub,
                urbanCartAsset,
                isAridSite ? 'BUILDING:RUGS' : primaryShrub,
                'BARRELS',
                useFlowerbed ? 'FLOWERBED' : secondaryShrub,
            ];
            const cityPropCount = this.defenderCityType === 'big_city'
                ? 7 + Math.floor(mRnd() * 3) // 7~9 个街坊市井细节
                : this.defenderCityType === 'medium_city'
                    ? 5 + Math.floor(mRnd() * 2) // 5~6 个
                    : 3 + Math.floor(mRnd() * 2); // 3~4 个
            const chosenCitySlots = shuffleWithMSeed(cityCandidates);
            const shuffledCityPool = shuffleWithMSeed(cityPropsPool);
            let placedCityProps = 0;
            for (let idx = 0; idx < chosenCitySlots.length && placedCityProps < cityPropCount; idx++) {
                const [pi, pj] = chosenCitySlots[idx];
                const pAsset = shuffledCityPool[placedCityProps % shuffledCityPool.length];
                const ji = (mRnd() - 0.5) * 0.22;
                const jj = (mRnd() - 0.5) * 0.22;
                const isFlatProp = pAsset === 'FLOWERBED' || pAsset === 'BUILDING:RUGS';
                const pScale = pAsset === 'BUSH_GREEN' || pAsset === 'SHRUB_GREEN' || pAsset.startsWith('BUSH_TREE') || pAsset === 'FERNPATCH' ? (0.74 + mRnd() * 0.12)
                    : pAsset === 'FLOWERBED' ? (0.82 + mRnd() * 0.10)
                    : pAsset === 'BUILDING:RUGS' ? (0.84 + mRnd() * 0.10)
                    : pAsset.startsWith('TRADE:') ? (0.88 + mRnd() * 0.08)
                    : (0.80 + mRnd() * 0.10); // BARRELS
                if (pushInteriorDecor(pAsset, pi + ji, pj + jj, pScale, isFlatProp ? -6 : 0)) {
                    placedCityProps++;
                }
            }
        }
    }

    // ── DE 式城郊附郭七大生态建筑群（农田+磨坊/聚落+民居、河海船坞与水产、林缘伐木场、山麓采矿场、前哨木堡与帅帐、关厢集市与铁匠铺行商、城郊名胜古刹与雕像） ──
    //    纯视觉无碰撞，避开攻方主冲锋线、城门大道、护城河与出生营地
    {
        const deStyle = this.buildingStyleFor(1);
        const cultStyle = String(defCityForInterior?.buildingStyle ?? this.environmentPlan?.buildingStyle ?? '');
        const seasonTag = isSnow
            ? 'WINTER'
            : (calSeason === 0 ? 'SPRING' : calSeason === 2 ? 'AUTUMN' : calSeason === 3 ? 'WINTER' : 'SUMMER');
        // 🔴 [2026-11-04 主人令「美洲是聚落」] 美洲文明（ANDE / MESO 及美洲各文化区）在 DE 中以「聚落」（SETTLEMENT）
        //    统一充当农田、林边、矿边的资源建筑，不放旧大陆磨坊/伐木场/采矿场。
        const isAmericasOutskirts = deStyle === 'ANDE' || deStyle === 'MESO'
            || /^(AMERICA|ANDE|MAYANS|INCA|MUISCA|TUPI|MAPUCHE|CHIMU|TARASCAN|TAIRONA|TEHUELCHE|IROQUOIS|NORTHAM_IMPERIAL|SOUTHAM_IMPERIAL)$/.test(cultStyle);
        const isNomadOutskirts = !isAmericasOutskirts && (isYurtOrNomadCity
            || /^(MONGOL|MOBEI_MONGOL|XIANBEI|HUNS|CUMAN|TURKS|HEXI|TIBET)$/.test(cultStyle));
        const isSlavFolwark = !isAmericasOutskirts && !isNomadOutskirts
            && (deStyle === 'SLAV' || /^(POLES|SLAVIC|LITHUANIANS|BOHEMIANS)$/.test(cultStyle));
        const isEastAsiaOutskirts = !isAmericasOutskirts && !isNomadOutskirts
            && (deStyle === 'ASIA' || /^(CENTRAL|WEI|JIANGNAN|HUGUANG|BASHU|NORTHEAST|KOREA|JAPAN)$/.test(cultStyle));
        const isIndosphereOutskirts = !isAmericasOutskirts
            && (deStyle === 'INDI' || deStyle === 'PURU' || deStyle === 'SEAS'
                || /^(INDIA|PURU|BENGALIS|GURJARAS|BURMESE|KHMER|VIETNAMESE|MALAY|CHAMPA|JAVANESE|SIAMESE|MON|DIANQIAN)$/.test(cultStyle));
        const isGrecoRomanOutskirts = !isAmericasOutskirts
            && (deStyle === 'GREEK' || deStyle === 'THRACIAN' || deStyle === 'MEDI'
                || /^(ROMA|BYZANTINE|GREECE|GREEK|ATHENIANS|SPARTANS|MACEDONIAN|THRACIAN|SICILIANS|ITALIANS)$/.test(cultStyle));
        const isMiddleEastOutskirts = !isAmericasOutskirts
            && (deStyle === 'ORIE' || deStyle === 'PERSIAN'
                || /^(ORIE|WEST_ASIA|PERSIAN|SASANIAN|CENTRAL_ASIA|WESTERN|BERBER|MUGHAL|ARMENIANS|GEORGIANS)$/.test(cultStyle));
        const isRiceOutskirts = !isNomadOutskirts && !isAmericasOutskirts && !isArid && !isSnow
            && (/^(JIANGNAN|HUGUANG|BASHU|KOREA|VIETNAMESE|BENGALIS|BURMESE|KHMER|PURU|INDIA|MUGHAL|DIANQIAN|JAPAN|MALAY|CHAMPA|JAVANESE|SIAMESE|MON)$/.test(cultStyle)
                || deStyle === 'SEAS' || deStyle === 'PURU' || deStyle === 'INDI');
        const plotAsset = isNomadOutskirts
            ? `RESOURCE:PASTURE_${seasonTag}`
            : (isRiceOutskirts ? `RESOURCE:RFARM_${seasonTag}` : `RESOURCE:FARM_${seasonTag}`);
        const useAge3 = this.defenderCityType === 'big_city' || this.defenderCityType === 'medium_city';
        const americanSettlementAsset = this.defenderCityType === 'stockade'
            ? 'BUILDING:DARK_SETTLEMENT_AGE1'
            : 'BUILDING:SETTLEMENT';
        const millAsset = isAmericasOutskirts
            ? americanSettlementAsset
            : isNomadOutskirts
                ? 'BUILDING:DARK_PASTURE'
                : (this.defenderCityType === 'stockade'
                    ? 'BUILDING:DARK_MILL_AGE1'
                    : (isSlavFolwark && mRnd() < 0.55)
                        ? 'BUILDING:FOLWARK'
                        : `BUILDING:${deStyle}_MILL_${useAge3 ? 'AGE3' : 'AGE2'}`);
        const lumberCampAsset = isAmericasOutskirts
            ? americanSettlementAsset
            : isNomadOutskirts
                ? 'TRADE:MULE_CART/move_2'
                : (deStyle === 'GREEK' || deStyle === 'MEDI' || deStyle === 'WEST' || deStyle === 'ORIE' || deStyle === 'PERSIAN')
                    ? 'BUILDING:GREEK_LUMBER_CAMP_AGE2'
                    : 'BUILDING:THRACIAN_LUMBER_CAMP_AGE2';
        const miningCampAsset = isAmericasOutskirts
            ? americanSettlementAsset
            : isNomadOutskirts
                ? 'TRADE:MULE_CART/move_6'
                : (deStyle === 'GREEK' || deStyle === 'MEDI' || deStyle === 'WEST' || deStyle === 'ORIE' || deStyle === 'PERSIAN')
                    ? 'BUILDING:GREEK_MINING_CAMP_AGE2'
                    : 'BUILDING:THRACIAN_MINING_CAMP_AGE2';
        const housePool = isNomadOutskirts
            ? [
                'BUILDING:YURT_A', 'BUILDING:YURT_B', 'BUILDING:YURT_C', 'BUILDING:YURT_D',
                'BUILDING:YURT_E', 'BUILDING:YURT_F', 'BUILDING:YURT_G', 'BUILDING:YURT_H',
                'BUILDING:YURT_I', 'BUILDING:YURT_J', 'BUILDING:YURT_K', 'BUILDING:YURT_L',
            ]
            : (this.defenderCityType === 'stockade'
                ? [
                    'BUILDING:HUT_A', 'BUILDING:HUT_B', 'BUILDING:HUT_C', 'BUILDING:HUT_D',
                    'BUILDING:HUT_E', 'BUILDING:HUT_F', 'BUILDING:HUT_G', 'BUILDING:DARK_HOUSE_AGE1',
                ]
                : useAge3
                    ? [`BUILDING:${deStyle}_HOUSE_AGE3`, `BUILDING:${deStyle}_HOUSE_AGE2`, `BUILDING:${deStyle}_HOUSE_AGE3`, 'BUILDING:HUT_A']
                    : [`BUILDING:${deStyle}_HOUSE_AGE2`, `BUILDING:${deStyle}_HOUSE_AGE2`, 'BUILDING:DARK_HOUSE_AGE1']);
        const villageCartAsset = isAmericasOutskirts
            ? 'TRADE:TRADE_CART_MESO_EMPTY/move_2'
            : isNomadOutskirts || deStyle === 'ORIE' || deStyle === 'PERSIAN'
                ? 'TRADE:TRADE_CART_ORIE_EMPTY/move_2'
                : (deStyle === 'WEST' || deStyle === 'EAST' || deStyle === 'CEAS' || deStyle === 'SLAV' || deStyle === 'MEDI' || deStyle === 'GREEK' || deStyle === 'THRACIAN')
                    ? 'TRADE:TRADE_CART_WEST_EMPTY/move_2'
                    : (deStyle === 'AFRI' || deStyle === 'INDI' || deStyle === 'PURU' || deStyle === 'SEAS')
                        ? 'TRADE:TRADE_CART_AFRI_EMPTY/move_2'
                        : 'TRADE:TRADE_CART_ASIA_EMPTY/move_2';
        const loadedCartAsset = isAmericasOutskirts
            ? 'TRADE:TRADE_CART_MESO/move_2'
            : isNomadOutskirts || deStyle === 'ORIE' || deStyle === 'PERSIAN'
                ? 'TRADE:TRADE_CART_ORIE/move_2'
                : (deStyle === 'WEST' || deStyle === 'EAST' || deStyle === 'CEAS' || deStyle === 'SLAV' || deStyle === 'MEDI' || deStyle === 'GREEK' || deStyle === 'THRACIAN')
                    ? 'TRADE:TRADE_CART_WEST/move_2'
                    : (deStyle === 'AFRI' || deStyle === 'INDI' || deStyle === 'PURU' || deStyle === 'SEAS')
                        ? 'TRADE:TRADE_CART_AFRI/move_2'
                        : 'TRADE:TRADE_CART_ASIA/move_2';
        const merchantAsset = isAmericasOutskirts
            ? 'TRADE:MERCHANT_MESO/move_4'
            : isGrecoRomanOutskirts
                ? 'TRADE:MERCHANT_ANT/move_4'
                : (isNomadOutskirts || isMiddleEastOutskirts)
                    ? 'TRADE:MERCHANT_ORIE/move_4'
                    : (deStyle === 'WEST' || deStyle === 'EAST' || deStyle === 'CEAS' || deStyle === 'SLAV')
                        ? 'TRADE:MERCHANT_WEST/move_4'
                        : (deStyle === 'AFRI' || isIndosphereOutskirts)
                            ? 'TRADE:MERCHANT_AFRI/move_4'
                            : 'TRADE:MERCHANT_ASIA/move_4';
        const foragePool = isAmericasOutskirts || isIndosphereOutskirts || deStyle === 'AFRI'
            ? ['FORAGE_PAPAYA', 'FORAGE_PINEAPPLE', 'FORAGE_FRUIT', 'FORAGE_BUSH']
            : ['FORAGE_FRUIT', 'FORAGE_BUSH'];
        const flagPool = isEastAsiaOutskirts
            ? ['BUILDING:SCEN_FLAG_N']
            : isGrecoRomanOutskirts
                ? ['BUILDING:SCEN_FLAG_MACEDONIAN', 'BUILDING:SCEN_FLAG_R']
                : isAmericasOutskirts || isNomadOutskirts
                    ? ['BUILDING:SCEN_FLAG_RITUAL_A']
                    : (isMiddleEastOutskirts || isIndosphereOutskirts || deStyle === 'AFRI' || deStyle === 'CEAS')
                        ? ['BUILDING:SCEN_FLAG_R']
                        : ['BUILDING:SCEN_FLAG_D', 'BUILDING:SCEN_FLAG_E', 'BUILDING:SCEN_FLAG_S', 'BUILDING:SCEN_FLAG_U'];

        // 计算攻方营心 → 城心的主冲锋走廊，确保附郭村落落点分布在侧翼或城后，不堵主冲锋线
        const atkSpawns = this.spawns.filter((s) => s.f === 0);
        const atkCen = atkSpawns.length > 0
            ? {
                x: atkSpawns.reduce((sum, s) => sum + s.x, 0) / atkSpawns.length,
                y: atkSpawns.reduce((sum, s) => sum + s.y, 0) / atkSpawns.length,
            }
            : { x: cx - 1200, y: cy };
        const chargeDx = cx - atkCen.x, chargeDy = cy - atkCen.y;
        const chargeLen = Math.hypot(chargeDx, chargeDy) || 1;
        const chargeUx = chargeDx / chargeLen, chargeUy = chargeDy / chargeLen;

        const passExt = this.defenderCityType === 'pass'
            ? passRingHalfExtents(this.defenderPassShape ?? 'square')
            : null;
        const isInsideWallOrMoatRing = (px: number, py: number): boolean => {
            if (ringLm <= 0) return inCity(px, py);
            const u = (px - cx) / (TAC_TILE_W / 2), v = (py - cy) / (TAC_TILE_H / 2);
            const ci = (u + v) / 2 - 0.5, cj = (v - u) / 2 - 0.5;
            const halfI = passExt ? passExt.outerHalfI : ringLm / 2;
            const halfJ = passExt ? passExt.outerHalfJ : ringLm / 2;
            const clearMargin = moatOn ? (1.85 + moatW + 1.05) : 1.75;
            return Math.abs(ci) <= halfI + clearMargin && Math.abs(cj) <= halfJ + clearMargin;
        };

        const isPointDryAndOpen = (px: number, py: number): boolean => {
            if (isInsideWallOrMoatRing(px, py) || inGateRoad(px, py)) return false;
            if (gl.isWaterAt(px, py, W, H) || (inMoat && inMoat(px, py))) return false;
            const cCell = gl.screenToCell(px, py, W, H);
            if (!cCell) return false;
            if (gl.getWaterDensityAt(cCell.gx, cCell.gy) >= 0.12) return false;
            return true;
        };

        const isNearAnySpawn = (px: number, py: number, minDist = 480): boolean => {
            for (const sp of this.spawns) {
                if (Math.hypot(px - sp.x, (py - sp.y) * 1.5) < minDist) return true;
                if (Math.abs(px - sp.x) < 420 && Math.abs(py - sp.y) < 440) return true;
            }
            return false;
        };

        const isTooCloseOrAligned = (px: number, py: number, minGap = 660): boolean => {
            for (const p of placedCenters) {
                if (Math.hypot(p.x - px, (p.y - py) * 1.4) < minGap) return true;
                if (Math.abs(p.y - py) < 95 && Math.abs(p.x - px) < minGap * 1.45) return true;
            }
            return false;
        };

        // 🔴 [2026-11-04 主人令「设计一个最小间距，不要挨着」]
        // 🔴 [2026-11-07 主人令「田地之间要挨着，是不是更现实？」]
        //    实体建筑之间保持充足净空（绝不挨着或叠压），而同一农庄的农田/水田/牧草场地块按 2×2 等距菱形网格紧挨成片（田连阡陌）。
        const placedOutskirtsItems: Array<{ x: number; y: number; r: number; isBld: boolean; isFarm: boolean }> = [];
        const outskirtsRadiusOf = (asset: string): { r: number; isBld: boolean; isFarm: boolean } => {
            if (/^DECAL_PATH/.test(asset)) return { r: 0, isBld: false, isFarm: false };
            if (/MARKET|MONASTERY|SETTLEMENT|FOLWARK|WOODEN_FORT|CATHEDRAL|COLOSSEUM|AMPHITHEATRE|GREAT_PYRAMID|DOME_OF_THE_ROCK|SANCHI_STUPA|GOL_GUMBAZ|DOCK|SHIPYARD|POENARI_CASTLE/.test(asset)) {
                return { r: 135, isBld: true, isFarm: false };
            }
            if (/MILL|BLACKSMITH|HOUSE|HUT|YURT|LUMBER_CAMP|MINING_CAMP|CAMP_BARRACKS|GREEK_WAR_TENT|PAGODA|SHRINE|RUINS|TORII_GATE|OUTPOST|MADRASAH|MINARET|THOLOS|ARCH_OF_CONSTANTINE|SPHINX|PYRAMIDS|STONEHENGE|HALL_OF_HEROES|PASTURE|BARRACKS|STABLE|TOWER/.test(asset) && asset.startsWith('BUILDING:')) {
                return { r: 105, isBld: true, isFarm: false };
            }
            if (/^RESOURCE:(?:FARM|RFARM|PASTURE)/.test(asset)) {
                return { r: 80, isBld: true, isFarm: true };
            }
            if (/^RESOURCE:(?:VINEYARD|QUARRY)/.test(asset)) {
                return { r: 90, isBld: true, isFarm: false };
            }
            if (/^MINE_/.test(asset)) {
                return { r: 22, isBld: false, isFarm: false };
            }
            return { r: 44, isBld: false, isFarm: false };
        };
        const MIN_OUTSKIRTS_BLD_GAP = 55;  // 任意两座建筑外缘之间的最小净空像素（中心等轴距 ≥ r1 + r2 + 55 ≈ 265~325px）
        const MIN_OUTSKIRTS_PROP_GAP = 28; // 建筑与装饰道具、或道具与道具之间的最小净空像素

        const canPlaceOutskirtsAt = (asset: string, px: number, py: number): boolean => {
            const { r, isBld, isFarm } = outskirtsRadiusOf(asset);
            if (r <= 0) return true;
            const isOre = /^MINE_/.test(asset);
            for (const item of placedOutskirtsItems) {
                if (isOre && !item.isBld && item.r <= 24) continue; // 同矿脉簇内部矿石格允许拼合，但与采矿场/采石坑严格拉开
                if (isFarm && item.isFarm) {
                    if (Math.hypot(px - item.x, py - item.y) < 115) return false; // 田块之间贴边紧挨成片，仅防同格重叠
                    continue;
                }
                const isoDist = Math.hypot(px - item.x, (py - item.y) * 1.55);
                const minGap = (isBld && item.isBld) ? MIN_OUTSKIRTS_BLD_GAP : MIN_OUTSKIRTS_PROP_GAP;
                if (isoDist < r + item.r + minGap) return false;
            }
            return true;
        };

        const pushOutskirtsSprite = (
            asset: string,
            px: number,
            py: number,
            scale: number,
            z = 0,
            flip = mRnd() < 0.5,
            frame = 0,
        ): boolean => {
            if (!canPlaceOutskirtsAt(asset, px, py)) return false;
            const { r, isBld, isFarm } = outskirtsRadiusOf(asset);
            if (r > 0) {
                placedOutskirtsItems.push({ x: px, y: py, r, isBld, isFarm });
            }
            this.ensureNatureAsset(asset);
            const sp: DecorSprite = {
                asset,
                frame,
                x: px,
                y: py,
                flip,
                scale,
                layer: 'world',
                z,
                indestructible: true,
                obstruction: undefined,
                obstructionContactSec: 0,
                obstructionTouched: false,
                obstructionDisabled: true,
            };
            (sp as any).cityOutskirts = true;
            this.decorSprites.push(sp);
            return true;
        };

        const clearTreesInRadius = (centerX: number, centerY: number, radPx: number): void => {
            this.decorSprites = this.decorSprites.filter((sp) => {
                if ((sp as any).cityOutskirts || (sp as any).cityInterior || sp.asset.startsWith('BUILDING') || sp.asset === '') return true;
                if (!TREE_FILTER_RE.test(sp.asset)) return true;
                const d = Math.hypot(sp.x - centerX, (sp.y - centerY) * 1.6);
                if (d < radPx) {
                    gl.clearForestAt(sp.x, sp.y, W, H, 1.8);
                    return false;
                }
                return true;
            });
        };

        const innerDist = ringLm > 0
            ? (ringLm / 2 + (moatOn ? moatW + 2.6 : 1.9))
            : (minHillDistCells + (moatOn ? 2.2 : 1.3));
        const outerDist = minHillDistCells + 18.0;
        const hamletCandidates: Array<{ gx: number; gy: number; x: number; y: number; flankScore: number }> = [];
        const outpostCandidates: Array<{ gx: number; gy: number; x: number; y: number }> = [];
        const dockCandidates: Array<{ gx: number; gy: number; x: number; y: number; waterX: number; waterY: number; landX: number; landY: number }> = [];
        const mineSiteCandidates: Array<{ gx: number; gy: number; x: number; y: number; elev: number }> = [];

        for (let gy = 6; gy <= N - 6; gy += 2) {
            for (let gx = 6; gx <= N - 6; gx += 2) {
                const distCells = Math.hypot(gx - cGx, gy - cGy);
                if (distCells < innerDist || distCells > outerDist + 8) continue;
                const pt = gl.cellToScreen(gx + 0.5, gy + 0.5, W, H);
                if (isInsideWallOrMoatRing(pt.x, pt.y) || inGateRoad(pt.x, pt.y)) continue;
                if (isNearAnySpawn(pt.x, pt.y, 460)) continue;

                // 计算到攻方主冲锋轴线的横向偏离与前后投影
                const relX = pt.x - atkCen.x, relY = pt.y - atkCen.y;
                const along = relX * chargeUx + relY * chargeUy;
                const perp = Math.abs(-relX * chargeUy + relY * chargeUx);
                const onMainChargeLine = along > 0 && along < chargeLen + 100 && perp < 350;

                // 水岸船坞候选：位于自然河岸/海岸交界处（非护城河），一侧深水、一侧干岸
                const wDens = gl.getWaterDensityAt(gx, gy);
                if (
                    !onMainChargeLine
                    && !(inMoat && inMoat(pt.x, pt.y))
                    && !gl.isMoatAt(pt.x, pt.y, W, H)
                    && wDens >= 0.20 && wDens <= 0.68
                ) {
                    let waterPt: { x: number; y: number } | null = null;
                    let landPt: { x: number; y: number } | null = null;
                    for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [-2, -2], [2, 2]] as const) {
                        const nd = gl.getWaterDensityAt(gx + dx, gy + dy);
                        const nScreen = gl.cellToScreen(gx + 0.5 + dx, gy + 0.5 + dy, W, H);
                        if (nd >= 0.54 && !gl.isMoatAt(nScreen.x, nScreen.y, W, H) && !waterPt) {
                            waterPt = nScreen;
                        } else if (nd <= 0.12 && !isInsideWallOrMoatRing(nScreen.x, nScreen.y) && !landPt) {
                            landPt = nScreen;
                        }
                    }
                    if (waterPt && landPt) {
                        dockCandidates.push({
                            gx, gy, x: pt.x, y: pt.y,
                            waterX: waterPt.x, waterY: waterPt.y,
                            landX: landPt.x, landY: landPt.y,
                        });
                    }
                }

                if (!isPointDryAndOpen(pt.x, pt.y)) continue;
                const elev0 = gl.elevationLevelAt(pt.x, pt.y, W, H);

                // 矿场候选：侧翼坡地或山脚外围（平地攻城图亦放宽允许外围开阔侧翼布矿，确保能看到采矿场）
                if (!onMainChargeLine && perp >= 260 && distCells >= innerDist + 1.2 && elev0 <= 1.85) {
                    mineSiteCandidates.push({ gx, gy, x: pt.x, y: pt.y, elev: elev0 });
                }

                if (elev0 > 1.35 || distCells > outerDist) continue;

                // 哨楼候选：可在外围侧前方或关隘谷口两侧（不踩主路中心）
                if (distCells >= innerDist + 1.0 && perp >= 210) {
                    outpostCandidates.push({ gx, gy, x: pt.x, y: pt.y });
                }

                // 村落农庄 / 集市 / 古刹候选：必须远离主冲锋线，且周围平坦无水无路
                if (onMainChargeLine) continue;
                let neighborhoodOk = true;
                for (const [ox, oy] of [[-110, -44], [110, -44], [-110, 44], [110, 44], [0, -64], [0, 64]] as const) {
                    const nx = pt.x + ox, ny = pt.y + oy;
                    if (!isPointDryAndOpen(nx, ny)) {
                        neighborhoodOk = false;
                        break;
                    }
                    if (Math.abs(gl.elevationLevelAt(nx, ny, W, H) - elev0) > 0.72) {
                        neighborhoodOk = false;
                        break;
                    }
                }
                if (!neighborhoodOk) continue;
                hamletCandidates.push({ gx, gy, x: pt.x, y: pt.y, flankScore: perp + (mRnd() - 0.5) * 140 });
            }
        }

        const placedCenters: Array<{ x: number; y: number }> = [];
        const usedOutskirtsAssets = new Set<string>();
        const pickUniqueOutskirts = (pool: readonly string[]): string => {
            const unused = pool.filter((a) => !usedOutskirtsAssets.has(a));
            const src = unused.length > 0 ? unused : pool;
            const chosen = src[Math.floor(mRnd() * src.length)];
            usedOutskirtsAssets.add(chosen);
            return chosen;
        };

        // 打散候选点顺序（不再按单一 flankScore 对称排序，避免城外建筑排成整齐队列）
        const shuffledHamlets = shuffle(hamletCandidates);
        const wingBuildingOffsets: ReadonlyArray<readonly [number, number]> = [
            [305, -58],
            [-305, -58],
            [295, 62],
            [-295, 62],
            [225, -155],
            [-225, -155],
            [225, 155],
            [-225, 155],
            [345, 12],
            [-345, 12],
        ];
        const findOutskirtsCompanionSpot = (
            baseX: number,
            baseY: number,
            asset: string,
            offsets: ReadonlyArray<readonly [number, number]>,
        ): { x: number; y: number } | null => {
            for (const [dx, dy] of offsets) {
                const px = baseX + dx, py = baseY + dy;
                if (!isPointDryAndOpen(px, py) || isNearAnySpawn(px, py, 440)) continue;
                if (canPlaceOutskirtsAt(asset, px, py)) {
                    return { x: px, y: py };
                }
            }
            return null;
        };

        // ── (A) 附郭农庄 / 美洲聚落农田 / 游牧牧场（1~2 处，分散在不同方位，含磨坊/聚落/庄园/畜牧棚 + 农田/葡萄园/橄榄树/果丛 + 民居） ──
        const targetHamlets = (this.defenderCityType === 'big_city' || this.defenderCityType === 'medium_city')
            ? 2
            : (this.defenderCityType === 'small_city' || this.defenderCityType === 'stockade')
                ? 1
                : 0;
        const canUseVineyard = !isSnow && !isArid && !isNomadOutskirts && !isAmericasOutskirts
            && (deStyle === 'MEDI' || deStyle === 'GREEK' || deStyle === 'WEST' || deStyle === 'THRACIAN' || deStyle === 'EAST' || deStyle === 'ORIE');
        const canUseOliveTree = !isSnow && (isGrecoRomanOutskirts || isMiddleEastOutskirts || deStyle === 'WEST');

        for (const cand of shuffledHamlets) {
            if (placedCenters.length >= targetHamlets) break;
            if (isTooCloseOrAligned(cand.x, cand.y, 680)) continue;
            const vx = cand.x, vy = cand.y;
            if (!canPlaceOutskirtsAt(millAsset, vx, vy)) continue;
            const fieldSide = mRnd() < 0.5 ? 1 : -1;
            // 🔴 [2026-11-07 主人令「田地之间要挨着，是不是更现实？」]
            //    FARM / RFARM 贴图为 256×192 等距菱形（PASTURE 缩放到 0.66 后同尺寸），
            //    沿菱形四边紧挨拼接的步进向量为 (Δx = ±114, Δy = ±86)，4 块田拼成严丝合缝的 2×2 连片农田。
            const diamondOffsets: ReadonlyArray<readonly [number, number]> = [
                [fieldSide * 205, 16],
                [fieldSide * 319, 102],
                [fieldSide * 319, -70],
                [fieldSide * 433, 16],
                [fieldSide * 205, 188],
                [fieldSide * 205, -156],
            ];
            const houseOffsets: ReadonlyArray<readonly [number, number]> = [
                [-fieldSide * 275, -45],
                [-fieldSide * 255, 145],
                [-fieldSide * 45, -185],
                [-fieldSide * 335, 35],
            ];
            let validPlotsPreview = 0;
            for (const [dx, dy] of diamondOffsets) {
                if (isPointDryAndOpen(vx + dx, vy + dy) && canPlaceOutskirtsAt(plotAsset, vx + dx, vy + dy)) validPlotsPreview++;
            }
            let validHousesPreview = 0;
            for (const [dx, dy] of houseOffsets) {
                if (isPointDryAndOpen(vx + dx, vy + dy) && canPlaceOutskirtsAt(housePool[0], vx + dx, vy + dy)) validHousesPreview++;
            }
            if (validPlotsPreview < 3 || validHousesPreview < 2) continue;

            placedCenters.push({ x: vx, y: vy });
            clearTreesInRadius(vx, vy, 280);
            gl.carveFoundation(vx, vy, W, H, 2.5);

            // 1) 磨坊 / 波兰庄园 / 美洲聚落 / 畜牧棚居中 + 村心泥径贴花（先放主建筑，确保主建筑基准点稳固）
            pushOutskirtsSprite('DECAL_PATH_1', vx, vy + 10, 0.95, -6, mRnd() < 0.5, 0);
            pushOutskirtsSprite(millAsset, vx, vy, 0.78 + mRnd() * 0.04, 0, mRnd() < 0.5, 0);

            // 2) 3~4 块连片农田 / 水稻田 / 牧草场贴片（按 2×2 等距菱形网格紧挨成片，田连阡陌）
            let plotsPlaced = 0;
            const maxPlots = 4;
            const plotScale = isNomadOutskirts ? 0.66 : 0.98;
            for (const [dx, dy] of diamondOffsets) {
                if (plotsPlaced >= maxPlots) break;
                const px = vx + dx, py = vy + dy;
                if (!isPointDryAndOpen(px, py)) continue;
                if (pushOutskirtsSprite(plotAsset, px, py, plotScale, -6, false, 0)) {
                    clearTreesInRadius(px, py, 120);
                    gl.carveFoundation(px, py, W, H, 1.4);
                    plotsPlaced++;
                }
            }
            if (canUseVineyard) {
                const vineSpot = findOutskirtsCompanionSpot(vx, vy, 'RESOURCE:VINEYARD', [
                    [-fieldSide * 55, 165],
                    [fieldSide * 55, -165],
                ]);
                if (vineSpot) {
                    pushOutskirtsSprite('RESOURCE:VINEYARD', vineSpot.x, vineSpot.y, 0.88, -1, mRnd() < 0.5, 0);
                }
            }

            // 3) 另一侧围以 2 间同风格民居 / 茅屋 / 毡帐（距磨坊及彼此等轴间距均 ≥ 275px，绝不挨着）
            const houseCount = 2;
            let hPlaced = 0;
            for (let hi = 0; hi < houseOffsets.length && hPlaced < houseCount; hi++) {
                const hx = vx + houseOffsets[hi][0] + (mRnd() - 0.5) * 12;
                const hy = vy + houseOffsets[hi][1] + (mRnd() - 0.5) * 8;
                if (!isPointDryAndOpen(hx, hy)) continue;
                const hAsset = housePool[(hi + Math.floor(mRnd() * housePool.length)) % housePool.length];
                if (pushOutskirtsSprite(hAsset, hx, hy, 0.76 + mRnd() * 0.04, 0, mRnd() < 0.5, 0)) {
                    gl.carveFoundation(hx, hy, W, H, 1.4);
                    hPlaced++;
                }
            }

            // 4) 村口远端伴生果树/浆果与农庄推车（与磨坊和民居保持 ≥ 185px 净距）
            if (!isSnow) {
                const fAsset = (canUseOliveTree && mRnd() < 0.5)
                    ? 'RESOURCE:OLIVE_TREE'
                    : foragePool[Math.floor(mRnd() * foragePool.length)];
                const fSpot = findOutskirtsCompanionSpot(vx, vy, fAsset, [
                    [-fieldSide * 155, 125],
                    [fieldSide * 155, -125],
                    [0, 155],
                ]);
                if (fSpot) {
                    pushOutskirtsSprite(fAsset, fSpot.x, fSpot.y, 0.84, fAsset === 'RESOURCE:OLIVE_TREE' ? 0 : -6, mRnd() < 0.5, 0);
                }
            }
            const vCartSpot = findOutskirtsCompanionSpot(vx, vy, villageCartAsset, [
                [fieldSide * 145, -118],
                [-fieldSide * 145, -118],
                [0, -145],
            ]);
            if (vCartSpot) {
                pushOutskirtsSprite(villageCartAsset, vCartSpot.x, vCartSpot.y, 0.78, 0, mRnd() < 0.5, 0);
            }
        }

        // ── (B) 河边 / 海边船坞或造船厂（古希腊/色雷斯造船厂仅限古典地中海，其余文明严格使用本文化船坞 + 5 种舟船 + 全品种鱼群/海龟/海豚/牡蛎/睡莲） ──
        if (dockCandidates.length > 0 && !isNomadOutskirts) {
            dockCandidates.sort(() => mRnd() - 0.5);
            const dockPool = deStyle === 'YURT'
                ? ['BUILDING:ASIA_DOCK_AGE2']
                : isGrecoRomanOutskirts
                    ? [`BUILDING:${deStyle}_DOCK_AGE2`, 'BUILDING:GREEK_SHIPYARD_AGE2', 'BUILDING:THRACIAN_SHIPYARD_AGE2']
                    : [`BUILDING:${deStyle}_DOCK_AGE2`];
            const mooredBoatPool = (isAmericasOutskirts || deStyle === 'AFRI')
                ? ['TRADE:CANOE/idle_2', 'TRADE:TRANSPORT_SHIP/idle_2']
                : (deStyle === 'ASIA' || deStyle === 'SEAS')
                    ? ['TRADE:JUNK/idle_2', 'TRADE:MERCHANT_SHIP/idle_2', 'TRADE:TRANSPORT_SHIP/idle_2']
                    : (deStyle === 'WEST' || deStyle === 'CEAS' || deStyle === 'EAST' || deStyle === 'SLAV')
                        ? ['TRADE:TRADE_COG/idle_2', 'TRADE:MERCHANT_SHIP/idle_2', 'TRADE:TRANSPORT_SHIP/idle_2']
                        : ['TRADE:MERCHANT_SHIP/idle_2', 'TRADE:TRANSPORT_SHIP/idle_2', 'TRADE:CANOE/idle_2'];
            const fishPool = this.environmentPlan?.waterKind === 'sea'
                ? ['RESOURCE:SHORE_FISH', 'RESOURCE:DORADO_FISH', 'RESOURCE:MARLIN_FISH', 'RESOURCE:TUNA_FISH', 'RESOURCE:SNAPPER_FISH', 'RESOURCE:BOX_TURTLES', 'RESOURCE:DOLPHIN']
                : ['RESOURCE:SHORE_FISH', 'RESOURCE:SALMON_FISH', 'RESOURCE:PERCH_FISH', 'RESOURCE:BOX_TURTLES'];
            for (const dc of dockCandidates) {
                if (isTooCloseOrAligned(dc.x, dc.y, 620)) continue;
                const dAsset = pickUniqueOutskirts(dockPool);
                if (!pushOutskirtsSprite(dAsset, dc.x, dc.y, 0.78, 0, mRnd() < 0.5, 0)) continue;
                placedCenters.push({ x: dc.x, y: dc.y });
                clearTreesInRadius(dc.x, dc.y, 160);
                const wDx = dc.waterX - dc.x, wDy = dc.waterY - dc.y;
                const wLen = Math.hypot(wDx, wDy) || 1;
                const wUx = wDx / wLen, wUy = wDy / wLen;
                pushOutskirtsSprite(
                    pickUniqueOutskirts(mooredBoatPool),
                    dc.x + wUx * 225,
                    dc.y + wUy * 155,
                    0.75,
                    0,
                    mRnd() < 0.5,
                    0,
                );
                const chosenFish = pickUniqueOutskirts(fishPool);
                pushOutskirtsSprite(chosenFish, dc.x + wUx * 340, dc.y + wUy * 230, 0.85, -1, false, Math.floor(mRnd() * 12));
                break;
            }
        }

        // ── (C) 森林旁边的伐木场（Lumber Camp / 美洲聚落 / 游牧骡车 + 地域树桩与倒木） ──
        {
            const useBambooStump = !isSnow && (isEastAsiaOutskirts || isIndosphereOutskirts);
            const useBaobabStump = !isSnow && deStyle === 'AFRI';
            const stumpPool = useBambooStump
                ? ['STUMP_GENERIC', 'STUMP_BAMBOO', 'STUMP_LUSH_BAMBOO']
                : useBaobabStump
                    ? ['STUMP_GENERIC', 'STUMP_BAOBAB']
                    : ['STUMP_GENERIC'];
            const felledPool = useBambooStump
                ? ['FELLED_GENERIC', 'FELLED_BAMBOO', 'FELLED_LUSH_BAMBOO']
                : useBaobabStump
                    ? ['FELLED_GENERIC', 'FELLED_BAOBAB']
                    : ['FELLED_GENERIC'];
            const forestTrees: Array<{ x: number; y: number }> = [];
            for (const sp of this.decorSprites) {
                if ((sp as any).cityOutskirts || (sp as any).cityInterior) continue;
                if (!TREE_FILTER_RE.test(sp.asset)) continue;
                const spCell = gl.screenToCell(sp.x, sp.y, W, H);
                if (!spCell) continue;
                const dCells = Math.hypot(spCell.gx - cGx, spCell.gy - cGy);
                if (dCells >= innerDist && dCells <= outerDist + 10) {
                    forestTrees.push({ x: sp.x, y: sp.y });
                }
            }
            if (forestTrees.length >= 3) {
                const shuffledTrees = shuffle(forestTrees);
                let lumberPlaced = 0;
                const edgeOffsets: ReadonlyArray<readonly [number, number]> = [
                    [210, 75], [-210, 75], [210, -75], [-210, -75], [0, 155], [0, -155],
                ];
                for (let ti = 0; ti < shuffledTrees.length && lumberPlaced < 1; ti++) {
                    const tr = shuffledTrees[ti];
                    let nearbyTrees = 0;
                    for (const other of forestTrees) {
                        if (Math.hypot(other.x - tr.x, (other.y - tr.y) * 1.5) < 230) {
                            nearbyTrees++;
                            if (nearbyTrees >= 3) break;
                        }
                    }
                    if (nearbyTrees < 3) continue;

                    for (const [ox, oy] of edgeOffsets) {
                        const lx = tr.x + ox, ly = tr.y + oy;
                        if (!isPointDryAndOpen(lx, ly) || isNearAnySpawn(lx, ly, 460)) continue;
                        const relX = lx - atkCen.x, relY = ly - atkCen.y;
                        const along = relX * chargeUx + relY * chargeUy;
                        const perp = Math.abs(-relX * chargeUy + relY * chargeUx);
                        if (along > 0 && along < chargeLen + 110 && perp < 350) continue;
                        if (isTooCloseOrAligned(lx, ly, 620)) continue;
                        if (forestTrees.some((ft) => Math.hypot(ft.x - lx, (ft.y - ly) * 1.5) < 120)) continue;
                        if (!pushOutskirtsSprite(lumberCampAsset, lx, ly, 0.78, 0, ox < 0, 0)) continue;

                        placedCenters.push({ x: lx, y: ly });
                        gl.carveFoundation(lx, ly, W, H, 1.8);
                        const cutPts: ReadonlyArray<readonly [number, number, boolean]> = [
                            [ox > 0 ? -155 : 155, 45, true],
                            [ox > 0 ? -135 : 135, -55, false],
                        ];
                        for (const [cxOff, cyOff, isStump] of cutPts) {
                            const sx0 = lx + cxOff, sy0 = ly + cyOff;
                            if (isPointDryAndOpen(sx0, sy0)) {
                                const pool = isStump ? stumpPool : felledPool;
                                pushOutskirtsSprite(pool[Math.floor(mRnd() * pool.length)], sx0, sy0, 0.80, 0, mRnd() < 0.5, 0);
                            }
                        }
                        lumberPlaced++;
                        break;
                    }
                }
            }
        }

        // ── (D) 山麓矿脉簇与采矿场（DE 金矿/石矿簇 + 保持最小净距的采矿场与采石坑，绝不挨着） ──
        if (mineSiteCandidates.length > 0) {
            mineSiteCandidates.sort((a, b) => b.elev - a.elev || (mRnd() - 0.5));
            for (const mc of mineSiteCandidates) {
                if (isTooCloseOrAligned(mc.x, mc.y, 620)) continue;
                const campSide = mc.x >= cx ? -1 : 1;
                const campX = mc.x + campSide * 245;
                const campY = mc.y + 42;
                if (!isPointDryAndOpen(campX, campY) || isNearAnySpawn(campX, campY, 460)) continue;
                if (!canPlaceOutskirtsAt(miningCampAsset, campX, campY)) continue;

                placedCenters.push({ x: mc.x, y: mc.y });
                clearTreesInRadius(mc.x, mc.y, 220);
                gl.carveFoundation(mc.x, mc.y, W, H, 2.0);
                gl.carveFoundation(campX, campY, W, H, 1.6);

                const primaryOre = mRnd() < 0.55 ? 'MINE_GOLD' : 'MINE_STONE';
                const quarryAsset = mRnd() < 0.5 ? 'RESOURCE:QUARRY' : 'RESOURCE:QUARRY_B';
                const clumpOffsets: ReadonlyArray<readonly [number, number]> = [
                    [0, 0],
                    [36, 18],
                    [-36, 18],
                    [0, 36],
                ];
                for (let oi = 0; oi < clumpOffsets.length; oi++) {
                    const ox = mc.x + clumpOffsets[oi][0];
                    const oy = mc.y + clumpOffsets[oi][1];
                    pushOutskirtsSprite(primaryOre, ox, oy, 0.90, 0, (oi % 2 === 0), oi % 6);
                }
                pushOutskirtsSprite(miningCampAsset, campX, campY, 0.78, 0, campSide < 0, 0);
                if (isPointDryAndOpen(mc.x - campSide * 225, mc.y - 45)) {
                    pushOutskirtsSprite(quarryAsset, mc.x - campSide * 225, mc.y - 45, 0.84, -1, mRnd() < 0.5, 0);
                }
                if (isPointDryAndOpen(campX + campSide * 155, campY + 35)) {
                    pushOutskirtsSprite('BARRELS', campX + campSide * 155, campY + 35, 0.78, 0, mRnd() < 0.5, 0);
                }
                break;
            }
        }

        // ── (E) 城郊要塞/前哨军营组合（主堡/木堡/哨岗 + 驻军兵营/军帐 + 附属哨塔/军械铁匠铺 + 拒马防线 + 军需木桶 + 战旗，绝不单摆） ──
        outpostCandidates.sort(() => mRnd() - 0.5);
        const targetOutposts = (this.defenderCityType === 'big_city' || this.defenderCityType === 'pass') ? 2 : 1;
        const outpostPool = isNomadOutskirts
            ? ['BUILDING:OUTPOST']
            : ((deStyle === 'SLAV' || deStyle === 'EAST') && this.defenderCityType !== 'stockade')
                ? ['BUILDING:POENARI_CASTLE', 'BUILDING:WOODEN_FORT', 'BUILDING:FORTIFIED_OUTPOST']
                : ['BUILDING:FORTIFIED_OUTPOST', 'BUILDING:OUTPOST', 'BUILDING:WOODEN_FORT'];
        const campTentOutskirts = isGrecoRomanOutskirts
            ? 'BUILDING:GREEK_WAR_TENT'
            : isNomadOutskirts
                ? 'BUILDING:YURT_A'
                : isAmericasOutskirts
                    ? 'BUILDING:HUT_A'
                    : (this.defenderCityType === 'stockade' ? 'BUILDING:CAMP_BARRACKS' : `BUILDING:${deStyle}_BARRACKS_AGE2`);
        const outpostAuxAsset = isNomadOutskirts
            ? 'BUILDING:YURT_B'
            : isAmericasOutskirts
                ? 'BUILDING:OUTPOST'
                : (this.defenderCityType === 'stockade' ? 'BUILDING:OUTPOST' : `BUILDING:${deStyle}_BLACKSMITH_AGE2`);
        let outpostsPlaced = 0;
        for (const oc of outpostCandidates) {
            if (outpostsPlaced >= targetOutposts) break;
            if (isTooCloseOrAligned(oc.x, oc.y, 620)) continue;
            const opAsset = outpostPool[0];
            if (!canPlaceOutskirtsAt(opAsset, oc.x, oc.y)) continue;
            // 预验该中心点周围至少有 2 个可放置配套建筑的侧翼方向（保证城堡/要塞绝不孤零零单摆）
            let validOutpostWings = 0;
            for (const [dx, dy] of wingBuildingOffsets) {
                const wx = oc.x + dx, wy = oc.y + dy;
                if (isPointDryAndOpen(wx, wy) && !isNearAnySpawn(wx, wy, 440) && canPlaceOutskirtsAt(campTentOutskirts, wx, wy)) {
                    validOutpostWings++;
                    if (validOutpostWings >= 2) break;
                }
            }
            if (validOutpostWings < 2) continue;

            const chosenOp = pickUniqueOutskirts(outpostPool);
            const opScale = chosenOp === 'BUILDING:POENARI_CASTLE' ? 0.74 : 0.80;
            if (!pushOutskirtsSprite(chosenOp, oc.x, oc.y, opScale, 0, mRnd() < 0.5, 0)) continue;
            placedCenters.push({ x: oc.x, y: oc.y });
            clearTreesInRadius(oc.x, oc.y, 260);
            gl.carveFoundation(oc.x, oc.y, W, H, 1.8);
            pushOutskirtsSprite('DECAL_PATH_2', oc.x, oc.y + 24, 0.94, -6, false, 0);

            const tentSpot = findOutskirtsCompanionSpot(oc.x, oc.y, campTentOutskirts, wingBuildingOffsets);
            if (tentSpot && pushOutskirtsSprite(campTentOutskirts, tentSpot.x, tentSpot.y, 0.76, 0, mRnd() < 0.5, 0)) {
                clearTreesInRadius(tentSpot.x, tentSpot.y, 130);
                gl.carveFoundation(tentSpot.x, tentSpot.y, W, H, 1.4);
            }
            const auxSpot = findOutskirtsCompanionSpot(oc.x, oc.y, outpostAuxAsset, wingBuildingOffsets);
            if (auxSpot && pushOutskirtsSprite(outpostAuxAsset, auxSpot.x, auxSpot.y, 0.74, 0, mRnd() < 0.5, 0)) {
                clearTreesInRadius(auxSpot.x, auxSpot.y, 125);
                gl.carveFoundation(auxSpot.x, auxSpot.y, W, H, 1.4);
            }

            const toAtkX = atkCen.x >= oc.x ? 1 : -1;
            const toAtkY = atkCen.y >= oc.y ? 1 : -1;
            for (const [bxOff, byOff] of [[toAtkX * 175, toAtkY * 72], [toAtkX * 75, toAtkY * 135], [toAtkX * 215, toAtkY * 18]] as const) {
                const bx = oc.x + bxOff, by = oc.y + byOff;
                if (isPointDryAndOpen(bx, by)) {
                    pushOutskirtsSprite('BATTLEFIELD:STAKE_BARRICADE', bx, by, 0.84, 0, toAtkX < 0, 0);
                }
            }
            const barrelSpot = findOutskirtsCompanionSpot(oc.x, oc.y, 'BARRELS', [[-toAtkX * 155, 42], [toAtkX * 155, -48], [0, -135]]);
            if (barrelSpot) {
                pushOutskirtsSprite('BARRELS', barrelSpot.x, barrelSpot.y, 0.78, 0, mRnd() < 0.5, 0);
            }
            const flagSpot = findOutskirtsCompanionSpot(oc.x, oc.y, flagPool[0], [[165, -68], [-165, -68], [0, 145]]);
            if (flagSpot) {
                pushOutskirtsSprite(pickUniqueOutskirts(flagPool), flagSpot.x, flagSpot.y, 0.82, 0, mRnd() < 0.5, 0);
            }
            outpostsPlaced++;
        }

        // ── (F) 城郊功能院落（关厢商贸集镇配套组合 + 城郊名胜古刹院落配套组合，严禁单栋孤立摆放） ──
        if (this.defenderCityType !== 'pass') {
            const isJapanOutskirts = cultStyle === 'JAPAN';
            const defCityRec: any = this.defenderCityRecord();
            const outLat = defCityRec?.lat ?? this.centerLat ?? 30;
            const outLng = defCityRec?.lng ?? this.centerLng ?? 110;
            const isEgyptNileOutskirts = !isAmericasOutskirts && (
                /^(EGYPT|NUBIA|AXUM|ETHIOPIA)$/.test(cultStyle)
                || (outLat >= 10 && outLat <= 32 && outLng >= 24 && outLng <= 43)
            );
            // 城堡 POENARI_CASTLE 归入 (E) 城郊要塞军营配套组合，不进宗教名胜池单摆
            const templeMonumentPool: string[] = isAmericasOutskirts
                ? (deStyle === 'ANDE'
                    ? ['BUILDING:SCEN_ANDEAN_RUINS', 'BUILDING:PAGAN_SHRINE', `BUILDING:${deStyle}_MONASTERY_AGE3`]
                    : [`BUILDING:${deStyle}_MONASTERY_AGE3`, 'BUILDING:PAGAN_SHRINE', 'BUILDING:SCEN_ANCIENT_RUINS'])
                : isEastAsiaOutskirts
                    ? [
                        'BUILDING:SCEN_BUDDHA_STATUE',
                        'BUILDING:SCEN_PAGODA_A', 'BUILDING:SCEN_PAGODA_B', 'BUILDING:SCEN_PAGODA_C',
                        'BUILDING:SCEN_PAGODA_D', 'BUILDING:SCEN_PAGODA_E',
                        ...(isJapanOutskirts ? [] : ['BUILDING:SCEN_CHINESE_RUINS']),
                        `BUILDING:${deStyle}_MONASTERY_AGE3`,
                    ]
                    : isIndosphereOutskirts
                        ? (deStyle === 'SEAS'
                            ? [
                                'BUILDING:SCEN_BUDDHA_STATUE', 'BUILDING:SANCHI_STUPA', 'BUILDING:SCEN_REKHADEUL_TEMPLE',
                                `BUILDING:${deStyle}_MONASTERY_AGE3`,
                            ]
                            : [
                                'BUILDING:SCEN_BUDDHA_STATUE', 'BUILDING:SANCHI_STUPA', 'BUILDING:SCEN_REKHADEUL_TEMPLE',
                                'BUILDING:GOL_GUMBAZ', 'BUILDING:SCEN_INDIAN_RUINS', `BUILDING:${deStyle}_MONASTERY_AGE3`,
                            ])
                        : isGrecoRomanOutskirts
                            ? [
                                'BUILDING:SCEN_ARCHAIC_THOLOS', 'BUILDING:ARCH_OF_CONSTANTINE', 'BUILDING:AMPHITHEATRE',
                                'BUILDING:SCEN_COLOSSEUM', 'BUILDING:SCEN_HERO_SHRINE', `BUILDING:${deStyle}_MONASTERY_AGE3`,
                            ]
                            : isEgyptNileOutskirts
                                ? [
                                    'BUILDING:GREAT_PYRAMID', 'BUILDING:SCEN_SPHINX', 'BUILDING:SCEN_CUSHITE_PYRAMIDS',
                                    `BUILDING:${deStyle}_MONASTERY_AGE3`,
                                ]
                                : deStyle === 'AFRI'
                                    ? ['BUILDING:SCEN_SANKORE_MADRASAH', 'BUILDING:SCEN_CUSHITE_PYRAMIDS', 'BUILDING:AFRI_MONASTERY_AGE3']
                                    : deStyle === 'PERSIAN'
                                        ? [
                                            'BUILDING:SCEN_FIRE_SHRINE', 'BUILDING:MINARET_OF_JAM',
                                            'BUILDING:SCEN_MESOPOTAMIAN_RUINS', `BUILDING:${deStyle}_MONASTERY_AGE3`,
                                        ]
                                        : isMiddleEastOutskirts
                                            ? [
                                                'BUILDING:SCEN_DOME_OF_THE_ROCK', 'BUILDING:MINARET_OF_JAM',
                                                'BUILDING:SCEN_MESOPOTAMIAN_RUINS', `BUILDING:${deStyle}_MONASTERY_AGE3`,
                                            ]
                                            : isNomadOutskirts
                                                ? ['BUILDING:PAGAN_SHRINE', 'BUILDING:SCEN_HERO_SHRINE', 'BUILDING:SCEN_HALL_OF_HEROES']
                                                : (deStyle === 'SLAV' || deStyle === 'EAST')
                                                    ? [
                                                        'BUILDING:SCEN_CASTLE_RUINS',
                                                        'BUILDING:SCEN_CHURCH_RUINS', `BUILDING:${deStyle}_MONASTERY_AGE3`,
                                                    ]
                                                    : [
                                                        'BUILDING:SCEN_AACHEN_CATHEDRAL', 'BUILDING:QUIMPER_CATHEDRAL',
                                                        'BUILDING:SCEN_STONEHENGE', 'BUILDING:SCEN_HALL_OF_HEROES', `BUILDING:${deStyle}_MONASTERY_AGE3`,
                                                    ];

            const subCompounds = shuffle(['suburban_trade_post', 'sacred_shrine_compound'] as const);
            const maxSubCompounds = this.defenderCityType === 'big_city' || this.defenderCityType === 'medium_city' ? 2 : 1;
            let subPlaced = 0;
            for (const sk of subCompounds) {
                if (subPlaced >= maxSubCompounds) break;
                for (const cand of shuffledHamlets) {
                    if (isTooCloseOrAligned(cand.x, cand.y, 680)) continue;
                    const sx = cand.x, sy = cand.y;
                    // 预验该中心点周围至少有 2 个可放置配套建筑的侧翼方向（保证集市或名胜古刹绝不单独出现）
                    let validSubWings = 0;
                    for (const [dx, dy] of wingBuildingOffsets) {
                        const wx = sx + dx, wy = sy + dy;
                        if (isPointDryAndOpen(wx, wy) && !isNearAnySpawn(wx, wy, 440) && canPlaceOutskirtsAt(housePool[0], wx, wy)) {
                            validSubWings++;
                            if (validSubWings >= 2) break;
                        }
                    }
                    if (validSubWings < 2) continue;

                    if (sk === 'suburban_trade_post') {
                        // DE 关厢商贸集镇配套组合：市场 + 铁匠铺 + 1~2 间商铺民居 + 古道贴花 + 地毯/货桶 + 商车 + 货郎
                        const marketBld = isNomadOutskirts
                            ? 'BUILDING:YURT_A'
                            : (this.defenderCityType === 'stockade'
                                ? (isAmericasOutskirts ? 'BUILDING:DARK_SETTLEMENT_AGE1' : 'BUILDING:HUT_D')
                                : `BUILDING:${deStyle}_MARKET_${useAge3 ? 'AGE3' : 'AGE2'}`);
                        const smithBld = isNomadOutskirts
                            ? 'BUILDING:YURT_B'
                            : (this.defenderCityType === 'stockade'
                                ? (isAmericasOutskirts ? 'BUILDING:SETTLEMENT' : 'BUILDING:HUT_E')
                                : `BUILDING:${deStyle}_BLACKSMITH_${useAge3 ? 'AGE3' : 'AGE2'}`);
                        if (!pushOutskirtsSprite(pickUniqueOutskirts([marketBld]), sx, sy, 0.76, 0, mRnd() < 0.5, 0)) continue;
                        placedCenters.push({ x: sx, y: sy });
                        clearTreesInRadius(sx, sy, 280);
                        gl.carveFoundation(sx, sy, W, H, 2.2);
                        pushOutskirtsSprite('DECAL_PATH_2', sx - 20, sy + 20, 0.94, -6, false, 0);
                        pushOutskirtsSprite('DECAL_PATH_3', sx + 145, sy + 36, 0.92, -6, false, 0);

                        const smSpot = findOutskirtsCompanionSpot(sx, sy, smithBld, wingBuildingOffsets);
                        if (smSpot && pushOutskirtsSprite(pickUniqueOutskirts([smithBld]), smSpot.x, smSpot.y, 0.74, 0, mRnd() < 0.5, 0)) {
                            clearTreesInRadius(smSpot.x, smSpot.y, 130);
                            gl.carveFoundation(smSpot.x, smSpot.y, W, H, 1.5);
                        }
                        let shopHousesPlaced = 0;
                        for (let hi = 0; hi < wingBuildingOffsets.length && shopHousesPlaced < 2; hi++) {
                            const [dx, dy] = wingBuildingOffsets[hi];
                            const hx = sx + dx, hy = sy + dy;
                            if (!isPointDryAndOpen(hx, hy) || isNearAnySpawn(hx, hy, 440)) continue;
                            const hAsset = housePool[(hi + Math.floor(mRnd() * housePool.length)) % housePool.length];
                            if (pushOutskirtsSprite(hAsset, hx, hy, 0.75, 0, mRnd() < 0.5, 0)) {
                                clearTreesInRadius(hx, hy, 125);
                                gl.carveFoundation(hx, hy, W, H, 1.4);
                                shopHousesPlaced++;
                            }
                        }
                        const rugSpot = findOutskirtsCompanionSpot(sx, sy, 'RUGS', [[165, 82], [-165, 82], [0, 145]]);
                        if (rugSpot) {
                            pushOutskirtsSprite('RUGS', rugSpot.x, rugSpot.y, 0.84, -6, mRnd() < 0.5, Math.floor(mRnd() * 4));
                        }
                        const barrelSpot = findOutskirtsCompanionSpot(sx, sy, 'BARRELS', [[185, -45], [-185, -45], [0, -145]]);
                        if (barrelSpot) {
                            pushOutskirtsSprite('BARRELS', barrelSpot.x, barrelSpot.y, 0.78, 0, mRnd() < 0.5, 0);
                        }
                        const cartSpot = findOutskirtsCompanionSpot(sx, sy, loadedCartAsset, [[-195, 68], [195, 68], [-210, -45], [210, -45]]);
                        if (cartSpot) {
                            pushOutskirtsSprite(loadedCartAsset, cartSpot.x, cartSpot.y, 0.80, 0, mRnd() < 0.5, 0);
                        }
                        const merchSpot = findOutskirtsCompanionSpot(sx, sy, merchantAsset, [[135, 115], [-135, 115], [0, 165]]);
                        if (merchSpot) {
                            pushOutskirtsSprite(merchantAsset, merchSpot.x, merchSpot.y, 0.84, 0, mRnd() < 0.5, 0);
                        }
                    } else {
                        // DE 城郊名胜古刹院落配套组合（主殿/古塔/修道院 + 配套僧舍/偏殿/祭坛 + 石径 + 花坛 + 牌坊/雕像）
                        const tmAsset = pickUniqueOutskirts(templeMonumentPool);
                        const tmScale = /CATHEDRAL|COLOSSEUM|AMPHITHEATRE|GREAT_PYRAMID|DOME_OF_THE_ROCK|SANCHI_STUPA|GOL_GUMBAZ/.test(tmAsset)
                            ? 0.68
                            : 0.78;
                        if (!pushOutskirtsSprite(tmAsset, sx, sy, tmScale, 0, mRnd() < 0.5, 0)) continue;
                        placedCenters.push({ x: sx, y: sy });
                        clearTreesInRadius(sx, sy, 260);
                        gl.carveFoundation(sx, sy, W, H, 2.0);
                        pushOutskirtsSprite('DECAL_PATH_4', sx, sy + 42, 0.92, -6, false, 0);

                        const wingShrineAsset = isNomadOutskirts
                            ? 'BUILDING:PAGAN_SHRINE'
                            : isGrecoRomanOutskirts
                                ? 'BUILDING:SCEN_HERO_SHRINE'
                                : (!tmAsset.includes('MONASTERY') && this.defenderCityType !== 'stockade')
                                    ? `BUILDING:${deStyle}_MONASTERY_AGE3`
                                    : housePool[0];
                        const wingSpot = findOutskirtsCompanionSpot(sx, sy, wingShrineAsset, wingBuildingOffsets);
                        if (wingSpot && pushOutskirtsSprite(wingShrineAsset, wingSpot.x, wingSpot.y, 0.74, 0, mRnd() < 0.5, 0)) {
                            clearTreesInRadius(wingSpot.x, wingSpot.y, 130);
                            gl.carveFoundation(wingSpot.x, wingSpot.y, W, H, 1.5);
                        }
                        if (!isSnow) {
                            const fbLeft = findOutskirtsCompanionSpot(sx, sy, 'FLOWERBED', [[-195, 72], [-175, 92], [-215, 48]]);
                            if (fbLeft) {
                                pushOutskirtsSprite('FLOWERBED', fbLeft.x, fbLeft.y, 0.84, -6, false, 0);
                            }
                            const fbRight = findOutskirtsCompanionSpot(sx, sy, 'FLOWERBED', [[195, 72], [175, 92], [215, 48]]);
                            if (fbRight) {
                                pushOutskirtsSprite('FLOWERBED', fbRight.x, fbRight.y, 0.84, -6, true, 1);
                            }
                        }
                        if (isJapanOutskirts && tmAsset !== 'BUILDING:SCEN_BUDDHA_STATUE') {
                            const toriiSpot = findOutskirtsCompanionSpot(sx, sy, 'BUILDING:SCEN_TORII_GATE', [[0, 195], [195, 92], [-195, 92]]);
                            if (toriiSpot) {
                                pushOutskirtsSprite('BUILDING:SCEN_TORII_GATE', toriiSpot.x, toriiSpot.y, 0.76, 0, false, 0);
                            }
                        } else if (isGrecoRomanOutskirts) {
                            const greekStatues = [
                                'BUILDING:SCEN_STATUE_ALEXANDER',
                                'BUILDING:SCEN_STATUE_HEPHAISTION',
                                'BUILDING:SCEN_STATUE_GREEK_HERO',
                                'BUILDING:SCEN_STATUE_ARES_MARBLE',
                                'BUILDING:SCEN_STATUE_ARES_PAINTED',
                            ];
                            const stAsset = pickUniqueOutskirts(greekStatues);
                            const stSpot = findOutskirtsCompanionSpot(sx, sy, stAsset, [[0, 185], [185, 88], [-185, 88]]);
                            if (stSpot) {
                                pushOutskirtsSprite(stAsset, stSpot.x, stSpot.y, 0.78, 0, mRnd() < 0.5, 0);
                            }
                        } else {
                            const fSpot = findOutskirtsCompanionSpot(sx, sy, flagPool[0], [[0, 175], [175, 82], [-175, 82]]);
                            if (fSpot) {
                                pushOutskirtsSprite(pickUniqueOutskirts(flagPool), fSpot.x, fSpot.y, 0.80, 0, mRnd() < 0.5, 0);
                            }
                        }
                    }
                    subPlaced++;
                    break;
                }
            }
        }
    }

    // 🔴 [2026-10-21 主人报「DD 昨天把护城河删了」] 10-19 版这里有 flushFoundation()：把护城河/引水渠写进水体势场、
    //    城下地基的改动一次上传到 GPU；拆模块时漏了这一行，水只写进内存没上传，护城河就画不出来。
    gl.flushFoundation();

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
        const isSnowScene = this.environmentPlan?.biome === 'tundra_snow'
            || gl.isIce
            || !!(this.environmentPlan?.baseTerrain && /^(sno|sn2|snf|snd|snr|ic3|ice)/i.test(this.environmentPlan.baseTerrain));
        const pool = getClimateMountainPool.call(this, isSnowScene);
        // 🔴 [2026-10-31 主人令「战术模式中，会有一些大山的素材，但是这些大山不要在营地前端和城之间。大山会遮挡战场上的士兵。」]
        //    「攻方营地前端 → 城心」是这场仗的主冲锋走廊。大山模型放大 2 倍后一张就有 1240×800（MOUNTAIN_01 620×400），
        //    落进这条走廊，整片前排骑兵/步兵都会被山体盖住 —— 之前只查「离城 ≥980px、离出兵口 ≥700px」，
        //    走廊中段的高地上照样能立山（山离城 980px 仍然在城与营地之间）。现在整条走廊一律禁山：
        //      · 横向：战阵半宽（双方出兵口实测横向散布）＋ 山体半宽 640 ＋ 余量 320；
        //      · 纵向：从攻方营地前端往前 420px，一直封到城心再往外 cityR（城郭半径）＋420px；
        //      · 只有两侧远翼、攻方营地背后、城郭背后可以立山（当远景山脊用，不压兵）。
        //    关隘手工摆位（passMountainConfig 的 x/y）照旧优先，不受这条影响。
        const corridorSpawns = this.spawns.filter((s) => s.f === 0);
        const atkFront = corridorSpawns.length > 0
            ? {
                x: corridorSpawns.reduce((sum, s) => sum + s.x, 0) / corridorSpawns.length,
                y: corridorSpawns.reduce((sum, s) => sum + s.y, 0) / corridorSpawns.length,
            }
            : { x: cx - 1200, y: cy };   // 没有攻方出兵口（异常兜底）：按「攻方在城西」算轴线
        const corrDx = cx - atkFront.x, corrDy = cy - atkFront.y;
        const corrLen = Math.hypot(corrDx, corrDy) || 1;
        const corrUx = corrDx / corrLen, corrUy = corrDy / corrLen;
        let formationHalfW = 0;
        for (const sp of this.spawns) {
            formationHalfW = Math.max(
                formationHalfW,
                Math.abs(-(sp.x - atkFront.x) * corrUy + (sp.y - atkFront.y) * corrUx),
            );
        }
        const MOUNTAIN_HALF_W = 640;      // 大山×2 后半宽（620 → 1240）
        const corridorHalfW = formationHalfW + MOUNTAIN_HALF_W + 320;
        const cityR = Math.hypot(c.width / 2, c.height / 2);
        const inBattleCorridor = (pt: { x: number; y: number }): boolean => {
            const rx = pt.x - atkFront.x, ry = pt.y - atkFront.y;
            const along = rx * corrUx + ry * corrUy;
            if (along < -420 || along > corrLen + cityR + 420) return false;   // 营地背后 / 城郭背后放行
            return Math.abs(-rx * corrUy + ry * corrUx) < corridorHalfW;
        };
        // 扫描远郊高地平顶台面中心：
        //   1) 远离城墙与护城河（dCells >= minHillDistCells + 9.5，且屏幕椭圆外扩 >= 920×520px）；
        //   2) 严格避开四门进出军大道与桥头延长线（di >= 8.5 && dj >= 8.5），只落在正北/正南/正东/正西四翼远郊高地；
        //   3) 避开左侧攻方主冲锋走廊与所有出生点（>= 780px），且山脚 3 格半径内不沾水体。
        // 🔴 [2026-10-21 主人令「不要把山离城这么近，随机放到地图的高地上去」]
        // 1. 彻底推远大山，严禁贴城：城池外侧至少保持 980px 远距离缓冲（关隘两翼至少 |gy - cGy| >= 16.5 格），绝不堵塞城墙视野与行军走廊；
        // 2. 纯随机选点：在全图高地（elev >= 2.0，基座 3 级/5 级/7 级）候选点里随机洗牌抽取，自然散落各方高地。
        const isMountainSafeSpot = (gx: number, gy: number, pt: { x: number; y: number }): boolean => {
            if (inCity(pt.x, pt.y) || inGateRoad(pt.x, pt.y)) return false;
            if (inBattleCorridor(pt)) return false;
            const distFromCityCenter = Math.hypot((pt.x - cx) / 1.15, (pt.y - cy) * 1.45);
            if (distFromCityCenter < 980) return false;
            if (this.defenderCityType === 'pass') {
                const passAng = passValleyDirAngle(passRoadDir);
                const passCrossV = Math.abs(-(gx - cGx) * Math.sin(passAng) + (gy - cGy) * Math.cos(passAng));
                if (passCrossV < 14.5) return false;
            }
            for (const sp of this.spawns) {
                if (Math.hypot(pt.x - sp.x, (pt.y - sp.y) * 1.5) < 700) return false;
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

        const hillCandidates: Array<{ x: number; y: number; elev: number }> = [];
        for (let gy = 4; gy <= N - 4; gy += 2) {
            for (let gx = 4; gx <= N - 4; gx += 2) {
                const pt = gl.cellToScreen(gx + 0.5, gy + 0.5, W, H);
                if (!isMountainSafeSpot(gx, gy, pt)) continue;
                const elev = gl.elevationLevelAt(pt.x, pt.y, W, H);
                if (elev < 2.0) continue;
                hillCandidates.push({
                    x: pt.x + (mRnd() - 0.5) * 18,
                    y: pt.y + (mRnd() - 0.5) * 10,
                    elev,
                });
            }
        }
        // 纯随机打散洗牌，随机放到地图的高地上去
        hillCandidates.sort(() => mRnd() - 0.5);

                const targetCount = this.defenderCityType === 'pass'
            ? (4 + Math.floor(mRnd() * 3))
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
            const minMountainDist = this.defenderCityType === 'pass' ? 520 : 1350;
            if (chosenPts.some((p) => Math.hypot(p.x - mx, (p.y - my) * 1.6) < minMountainDist)) continue;
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

    decloneBattlefieldRocks.call(this);
    this.tacticalAnimals = syncTradeCartAnimals(
        this.decorSprites,
        this.tacticalAnimals,
        (a) => this.ensureNatureAsset(a),
    );
}

/** 各岩石素材的静态帧数表（_meta.json 尚未异步就绪时用于精确计算 frame % nFrames 视觉签名） */
const ROCK_KNOWN_FRAMES: Record<string, number> = {
    ROCK1: 6,
    ROCK2: 6,
    ROCK3: 6,
    ROCK_FORMATION1: 4,
    ROCK_FORMATION2: 2,
    ROCK_FORMATION3: 1,
    ROCK_LIMESTONE: 4,
    ROCK_MOSSY: 9,
    ROCK_JUNGLE: 6,
    ROCK_PILLAR: 4,
    ROCK_SNOW: 12,
    ROCK_BEACH: 8,
    ROCK_SEA1: 1,
    ROCK_SEA2: 6,
    MINE_STONE: 7,
};

/**
 * 战场岩石泊松盘疏化与邻域蓝噪声去重（Blue-Noise Variant & Orientation De-duplication）：
 *   1. 跨通道汇总底图烘焙（requestGroundLayerGL）、城郊三层微景（applyDeCityToGround）、首屏近郊微景（populateBattlefieldMicroDecor）
 *      放入的全部岩石（ROCK* / MINE_STONE）；
 *   2. 泊松盘最小间距裁剪：若两块非城内岩石等轴距离 < 290px（挨得太近），自动剔除后置冗余石块及其紧邻伴生草丛；
 *   3. 邻域反克隆与朝向错开：在 960px 视野邻域内，利用 (asset, frame, flip, scale) 多维自由度（如 ROCK1+ROCK2 共 12 种石形 × 左右翻转 = 24 种轮廓）
 *      通过蓝噪声能量函数选取最优形态，确保邻近石头绝不撞同款同朝向，且近邻石头自动左右反向、尺度错落。
 */
export function decloneBattlefieldRocks(this: Scene13WarLayer): void {
    const isRockSprite = (sp: DecorSprite): boolean =>
        !(sp as any).cityInterior && /^(ROCK|MINE_STONE)/.test(sp.asset);

    // ── 第一步：泊松盘过近石块疏化（消除多通道叠加导致的紧贴双石） ──
    const keptRocks: DecorSprite[] = [];
    const removedRockPositions: Array<{ x: number; y: number }> = [];
    for (const sp of this.decorSprites) {
        if (!isRockSprite(sp)) continue;
        const minGap = sp.asset === 'MINE_STONE' ? 250 : 290;
        const tooClose = keptRocks.some((k) => Math.hypot(sp.x - k.x, (sp.y - k.y) * 1.45) < minGap);
        if (tooClose) {
            removedRockPositions.push({ x: sp.x, y: sp.y });
        } else {
            keptRocks.push(sp);
        }
    }
    if (removedRockPositions.length > 0) {
        const keepRockSet = new Set(keptRocks);
        this.decorSprites = this.decorSprites.filter((sp) => {
            if (isRockSprite(sp)) return keepRockSet.has(sp);
            // 同步清理被剔除石块脚下紧贴（34px 内）的伴生微草丛
            if (/^(GRASS_|SHRUB_|FLOWER_|WEED|PLANT|UNDERBRUSH|FERNPATCH|BUSH_GREEN)/.test(sp.asset)) {
                if (removedRockPositions.some((r) => Math.hypot(sp.x - r.x, (sp.y - r.y) * 1.45) < 34)) {
                    return false;
                }
            }
            return true;
        });
    }

    if (keptRocks.length <= 1) return;

    const getFrameCount = (asset: string): number => ROCK_KNOWN_FRAMES[asset] ?? 6;

    // 按屏幕空间从上到下、从左到右确定性排序
    const sortedRocks = [...keptRocks].sort((a, b) => (a.y - b.y) || (a.x - b.x));
    const placed: Array<{ sp: DecorSprite; asset: string; frameMod: number; flip: boolean; scale: number }> = [];

    for (let idx = 0; idx < sortedRocks.length; idx++) {
        const r = sortedRocks[idx];
        const posHash = Math.abs(Math.round(r.x * 31 + r.y * 57 + idx * 19));

        // 查找 960px 等轴视野半径内的已处理邻石
        const neighbors: Array<{ asset: string; frameMod: number; flip: boolean; scale: number; dist: number }> = [];
        for (const p of placed) {
            const dist = Math.hypot(r.x - p.sp.x, (r.y - p.sp.y) * 1.4);
            if (dist < 960) {
                neighbors.push({
                    asset: p.asset,
                    frameMod: p.frameMod,
                    flip: p.flip,
                    scale: p.scale,
                    dist: Math.max(60, dist),
                });
            }
        }
        neighbors.sort((a, b) => a.dist - b.dist);

        // ROCK1 与 ROCK2 互为同气候通用石块姐妹图集（合计 12 种石形 × 2 朝向 = 24 种外观）
        const candidateAssets = (r.asset === 'ROCK1' || r.asset === 'ROCK2')
            ? (posHash % 2 === 0 ? ['ROCK1', 'ROCK2'] : ['ROCK2', 'ROCK1'])
            : [r.asset];

        let bestAsset = r.asset;
        let bestFrame = (r.frame ?? 0) % getFrameCount(r.asset);
        let bestFlip = !!r.flip;
        let bestScore = -Infinity;

        for (const candAsset of candidateAssets) {
            const nFrames = getFrameCount(candAsset);
            for (let f = 0; f < nFrames; f++) {
                const frameIdx = (f + posHash) % nFrames;
                for (const fl of [false, true]) {
                    let score = 0;
                    // 微小确定性扰动打散全局分布，同时优先保留无冲突的原设定
                    if (candAsset === r.asset) score += 0.25;
                    if (frameIdx === (r.frame ?? 0) % nFrames) score += 0.15;
                    if (fl === !!r.flip) score += 0.10;
                    score += (((posHash * 17 + frameIdx * 13 + (fl ? 7 : 0)) % 29) / 290);

                    for (let ni = 0; ni < neighbors.length; ni++) {
                        const nb = neighbors[ni];
                        const sameAsset = nb.asset === candAsset;
                        const sameShape = sameAsset && nb.frameMod === frameIdx;
                        const sameFlip = nb.flip === fl;

                        // 严禁完全同款同朝向（克隆石）
                        if (sameShape && sameFlip) {
                            score -= 50000 / nb.dist;
                        }
                        // 820px 内严禁同款石形（即便水平镜像，近距离两块同轮廓巨石也优先换别的帧或姐妹图集）
                        if (sameShape && nb.dist < 820) {
                            score -= 12000 / nb.dist;
                        }
                        // 最近邻石（600px 内）优先采取相反的水平朝向（flip 交替）
                        if (ni === 0 && nb.dist < 600 && sameFlip) {
                            score -= 900 / nb.dist;
                        }
                        // 520px 内鼓励 ROCK1 / ROCK2 交替混搭
                        if (sameAsset && nb.dist < 520 && candidateAssets.length > 1) {
                            score -= 260 / nb.dist;
                        }
                    }

                    if (score > bestScore) {
                        bestScore = score;
                        bestAsset = candAsset;
                        bestFrame = frameIdx;
                        bestFlip = fl;
                    }
                }
            }
        }

        if (bestAsset !== r.asset) {
            this.ensureNatureAsset(bestAsset);
            r.asset = bestAsset;
        }
        r.frame = bestFrame;
        r.flip = bestFlip;

        // 邻近岩石尺度微调错落（0.84 ~ 1.05），避免两块邻石大小完全一致
        const baseScale = r.scale ?? 0.94;
        if (neighbors.length > 0 && neighbors[0].dist < 640 && Math.abs(baseScale - neighbors[0].scale) < 0.06) {
            r.scale = neighbors[0].scale >= 0.94
                ? Math.max(0.84, 0.85 + ((posHash % 7) * 0.01))
                : Math.min(1.06, 0.99 + ((posHash % 7) * 0.01));
        }

        placed.push({
            sp: r,
            asset: r.asset,
            frameMod: bestFrame,
            flip: bestFlip,
            scale: r.scale ?? 0.94,
        });
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
    if (this.deCampaignMapId) return;
    const sides: Array<0 | 1> = [0, 1];
    for (const f of sides) applyBuildingsForSide.call(this, f);
}

export function applyBuildingsForSide(this: Scene13WarLayer, f: 0 | 1): void {
    // 玩家自带精锐是临时追加的战术出兵位，不属于军团九格编制；
    // 若把它计入这里，守城方会因 10 !== 9 提前返回，整座城墙都不生成。
    // 🔴 [2026-09-23] 主将队（第 10 口，前排再往前）不是编制建筑位：不计入，否则拒马挤在主将一口前、营地城墙因 10≠9 全不生成
    const side = this.spawns.filter((s) => s.f === f && !s.playerElite && !s.commander);
    // 🔴 [2026-10-11] 新战术模式攻城战守方：城池＝战略地图同款，整座摆在地图中心（不再走下面旧 13 的「右侧直墙＋九口建筑」）
    //    小队模式的攻城战（故事块「攻破哈桑卢」）也要这座城，所以排在下面「小队模式不铺营地」之前。
    if (f === 1 && this.deCity) { buildDeCity.call(this); return; }
    // 🔴 [2026-10-22] 小队模式（故事块小仗）没有营地：不铺营帐、不围拒马
    if (this.isSkirmish()) return;
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
        // 🔴 [2026-10-21 主人报「拒马立在河里」] 拒马圈是按营地半径机械画的，会画到河道上；
        //    水里插拒马物理上不成立 → 落点在水面/湿地的直接跳过（营地跨河时圈上留缺口，正好是天然渡口）。
        //    ⚠️ 坐标口径：装饰精灵的 x/y 是**世界像素**，查询要用世界尺寸（worldCX*2 / worldCY*2），
        //       不是画布像素（用错会全判成「不在水里」，等于没修）。
        const barW = this.worldCX * 2;
        const barH = this.worldCY * 2;
        const barGl = this.groundLayerGL;
        const isWetSpot = (x: number, y: number): boolean => {
            if (!barGl) return false;
            const c = barGl.screenToCell(x, y, barW, barH);
            if (!c) return true;                       // 出图的位置也不放
            return barGl.getWaterDensityAt(c.gx, c.gy) >= 0.18;
        };
        this.ensureNatureAsset(barricadeAsset);
        for (let i = 0; i < barricadeCount; i++) {
            const a = (i / barricadeCount) * Math.PI * 2;
            const dx = Math.cos(a), dy = Math.sin(a) * 0.58;     // 等距压缩（与地面同一 2.5D 比例）
            const bx = CEN.x + dx * ringR;
            const by = CEN.y + dy * ringR;
            if (isWetSpot(bx, by)) continue;
            this.decorSprites.push({
                asset: barricadeAsset, frame: 0,
                x: bx,
                y: by,
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
            const isSnowScene = this.environmentPlan?.biome === 'tundra_snow'
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
        this.ensureProj('PROJ_ARROW_FIRE');   // 守方建筑齐射火箭（见 Scene13WarLayer.fireDefBuildingVolley）
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



