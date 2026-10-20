/**
 * 🔴 [2026-10-20 主人令「按功能模块拆分 Scene13WarLayer.ts，保证原有功能完全正常」]
 * 战术模式（Scene13）**每帧绘制**：render() —— 只画精灵、尸体、建筑、特效、旗帜等（读状态、基本不改战斗状态）。
 * 从 Scene13WarLayer.ts 原样搬出（逻辑一行未改）。写法同 Scene13CityLayout.ts：
 * 函数以 `this: Scene13WarLayer` 调用（类里用 `fn.call(this, …)`），函数体与原方法逐字一致。
 */
// 值导入（用到静态常量 Scene13WarLayer.ENTRY_WAIT_MAX_MS）；循环引用只在函数调用时取值，模块加载期不读
import { Scene13WarLayer } from '../Scene13WarLayer';
import {
    CASTER_TYPES, DEATH_ANIM, NO_ATTACK_ANIM, PROJ_ANGLE_OFFSET, PROJ_ARC_RATIO, PROJ_FLAT, PROJ_FRAME_DUR,
    PROJ_HIGH_ARC, PROJ_SCALE, PROJ_SCALE_OVERRIDE,
} from './Scene13ProjectilesAndFx';
import {
    CHARGE_CYCLE, FADE_IN, FLAG_FALL, FLAG_POLE_LIFT, FLAG_POLE_RATIO, FLAG_SCALE, FLEE_DUR, UNIT_PX,
} from './Scene13CombatMath';
import { LegionFlagDrawer } from '../../map/legion/LegionFlagDrawer';
import { TAC_MAP_HALF_W, TAC_MAP_HALF_H } from './Scene13GroundLayerGL';
import { WAR_TYPES } from '../../data/WarTypes';
import { animalDeOf } from './Scene13Animals';
import { gunpowderTrailSprite } from './Scene13SpriteCache';
import { loopRate } from './Scene13UnitTables';
import { syncDeCityGround } from './Scene13CityLayout';

export function render(this: Scene13WarLayer): void {
    const ctx = this.ctx, cv = this.canvas;
    if (!ctx || !cv) return;
    // 🔴 [2026-10-03 主人「先刷建筑再刷兵，一起更好吗」→「请修复」] 战场与军队**一起**出现：
    //    原来第一帧画出来（地形/建筑，素材还在加载）就淡入，士兵要等素材就绪才开始渐显，中间是个空战场
    //    （实测 3 秒；真机约 1~1.5 秒）。现在等素材就绪（士兵同一刻开始部署渐显）再淡入，
    //    最多等 ENTRY_WAIT_MAX_MS，超时就让战场先淡入。
    if (this.entryFadePending
        && (this.assetsReadyOnce || performance.now() - this.entryStartedAt > Scene13WarLayer.ENTRY_WAIT_MAX_MS)) {
        this.beginEntryFade(cv);
    }
    const _tFrameStart = performance.now();
    let _tGL = 0, _tCull = 0, _tSort = 0, _tDrawDecor = 0, _tDrawUnits = 0;
    // 🔴 [2026-10-08 主人「请给战术模式添加用鼠标滚轴可以使战场画面缩放功能」]
    const zoom = this.tacticalZoom;
    const hasZoom = Math.abs(zoom - 1) > 0.001;
    const hasPan = Math.abs(this.tacticalPanX) > 0.5 || Math.abs(this.tacticalPanY) > 0.5;
    const cx = cv.width / 2;
    const cy = cv.height / 2;
    // 世界中心开战时定死（worldCX/CY）；窗口缩放后它和画布中心不再重合，也要做变换
    const hasShift = Math.abs(this.worldCX - cx) > 0.5 || Math.abs(this.worldCY - cy) > 0.5;
    const hasTransform = hasZoom || hasPan || hasShift;

    if (hasTransform) {
        ctx.clearRect(0, 0, cv.width, cv.height);
        ctx.save();
        ctx.translate(cx + this.tacticalPanX, cy + this.tacticalPanY);
        ctx.scale(zoom, zoom);
        ctx.translate(-this.worldCX, -this.worldCY);
    }

    if (this.useGroundGL && this.groundLayerGL) {
        const _tgl0 = performance.now();
        const camZoom = zoom;
        const camX = cv.width / 2 + this.tacticalPanX - TAC_MAP_HALF_W * camZoom;
        const camY = cv.height / 2 + this.tacticalPanY - TAC_MAP_HALF_H * camZoom;
        this.groundLayerGL.setCamera({ x: camX, y: camY, zoom: camZoom });
        this.groundLayerGL.render();
        _tGL = performance.now() - _tgl0;
        if (!hasTransform) {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, cv.width, cv.height);
            ctx.restore();
        }
        // 🔴 DE 涉水水波交互 (Wading Ripples)：涉水行军与倒在水中的士兵产生微弱同心水圈
        this.drawCityPlazas(ctx);
        syncDeCityGround.call(this);
        this.renderWadingRipples(ctx, performance.now() * 0.001);
    } else if (!hasTransform) {
        ctx.clearRect(0, 0, cv.width, cv.height);   // GL 地面还没就绪：只清屏，不画任何旧地面
    }

    // [PERF 2026-08-29] 对象池复用：原来每帧 new 700+ 个临时对象（vis 数组 + 每个元素），加剧 GC。
    const vis = this.visPool;
    let vi = 0;
    const take = () => {
        let it = vis[vi];
        if (!it) { it = { kind: 'unit', y: 0, x: 0, f: 0, key: '', dir: 0, set: '', fr: 0, a: 1, z: 0, zid: 0, sprite: null }; vis[vi] = it; }
        vi++;
        return it;
    };
    // DE 式世界对象：树木、岩石、资源等不再烙进背景，按脚点 y 与单位共同排序。
    const _tcull0 = performance.now();
    const cullDecor = this.useGroundGL;
    const vMargin = 120;
    const vMinX = (0 - cx - this.tacticalPanX) / zoom + this.worldCX - vMargin;
    const vMaxX = (cv.width - cx - this.tacticalPanX) / zoom + this.worldCX + vMargin;
    const vMinY = (0 - cy - this.tacticalPanY) / zoom + this.worldCY - vMargin;
    const vMaxY = (cv.height - cy - this.tacticalPanY) / zoom + this.worldCY + vMargin;
    let decorDrawnCount = 0;
    for (const sprite of this.decorSprites) {
        if (sprite.destroyed) continue;   // 城墙/城门已破：不再绘制
        if (cullDecor && (sprite.x < vMinX || sprite.x > vMaxX || sprite.y < vMinY || sprite.y > vMaxY)) continue;
        if (sprite.layer === 'world' || (this.useGroundGL && sprite.layer === 'ground')) {
            const it = take();
            it.kind = 'environment';
            it.y = sprite.y - (sprite.lift !== undefined ? sprite.lift : this.elevationLiftAt(sprite.x, sprite.y));
            it.sortY = it.y - 12;   // 环境对象等效排序 y 上提 12px（严格传递序：近墙 12px 内恒保证人压在墙前，消除非传递 3-cycle 抖动）
            it.z = sprite.layer === 'ground' ? -10 : sprite.z;
            it.zid = 0;
            it.sprite = sprite;
            decorDrawnCount++;
        }
    }
    _tCull = performance.now() - _tcull0;
    this.perfStats.decorTotal = this.decorSprites.length;
    this.perfStats.decorDrawn = decorDrawnCount;
    this.perfStats.decorCulled = this.decorSprites.length - decorDrawnCount;
    // 已烙的尸体：一张图搞定（在所有活人之下）
    if (this.groundHasContent && this.ground) ctx.drawImage(this.ground, this.worldCX - TAC_MAP_HALF_W, this.worldCY - TAC_MAP_HALF_H);
    // 留下的尸体：死亡动画逐帧画（全程不透明，播完即烙地面）
    for (const c of this.corpses) {
        const it = take();
        it.kind = 'unit';
        it.y = c.y - this.elevationLiftAt(c.x, c.y); it.sortY = it.y; it.x = c.x; it.f = c.f; it.key = c.key; it.dir = c.dir; it.set = 'die';
        it.fr = c.t;
        it.a = this.isWaterAt(c.x, c.y) ? (1 - 0.62 * Math.min(1, c.t / DEATH_ANIM)) : 1;
        it.st = undefined; it.z = 0; it.zid = 0; it.sprite = null;
    }
    // 溃逃兵：跑动帧 + 反向移动 + 渐隐（主人 2026-08-16）
    for (const f of this.fleers) {
        const it = take();
        it.kind = 'unit';
        it.y = f.y - this.elevationLiftAt(f.x, f.y); it.sortY = it.y; it.x = f.x; it.f = f.f; it.key = f.key; it.dir = f.dir; it.set = 'move';
        it.fr = f.ph;
        it.a = Math.max(0, 1 - f.t / FLEE_DUR);
        it.st = undefined; it.z = 0; it.zid = 0; it.sprite = null;
    }
    for (const m of this.men) {
        // 有冲锋组的兵种（象兵/弓骑）两处用冲锋帧（主人 2026-08-12 拍板「两者都要」）：
        //   ① 移动时**逐轮交替**：一轮移动、一轮冲锋（见 CHARGE_CYCLE）；
        //   ② 攻击时按出手轮次与攻击帧交替（m.atkFlip 每轮出手翻转）。
        // 其余兵种不受影响：赶路一律移动帧、攻击固定攻击帧。白刃（st=2）用近战帧。
        const hasChg = !!this.bank[m.key]?.sets.charge?.[m.f]?.length;
        let set: string;
        // 残局待命 / 开场列阵待命：全军播待命帧（没有待命素材的退回移动帧，绝不留静止画面）。
        // 🔴 [2026-08-30 修·滑步] 部署期（deployT>0）step 的 deploying 分支对**所有**兵 continue（静止）、
        //    marchTick 也 return，所以部署期全军（含列阵兵、攻城武器）都静止，应统一播 idle。
        //    之前误加 !m.march && !m.siegeW，让静止的列阵兵播走路帧 = 原地踏步/滑步。
        //    攻城武器真正开动是 deployT 归零后开打阶段，由下面 !m.siegeW 单独管。
        if (this.lingering || this.deployT > 0) {
            set = this.bank[m.key]?.sets.idle?.[m.f]?.length ? 'idle' : 'move';
        }
        // 🔴 [2026-10-13 主人令「现在所有都改为开局就动」] 原「攻城战开战前 30 秒守方播待机帧」那条分支
        //    （判据 `battleType === 'siege' && m.f === 1 && defenderHolding`）随待命期一并删除；
        //    守方不动的判据只剩上面的 deployT / lingering，以及下面按 `stuckT` / `idlePose` 的结果判。
        // 🔴 [2026-08-17] 站着不动的兵播待命帧（远程让位、被挤住、走不动，全算在内）。
        //    采用 step 中带双阈值迟滞结算的 m.idlePose，杜绝贴墙/贴队友微幅推挤时在 idle 与 move 间逐帧闪烁。
        else if (!m.march && (m.idlePose === true
            || (m.st === 0 && !!m.guardPost))
            && this.bank[m.key]?.sets.idle?.[m.f]?.length) {
            set = 'idle';
        }
        else if (m.st === 0) {
            const odd = Math.floor(m.ph / CHARGE_CYCLE) % 2 === 1;
            set = (hasChg && odd) ? 'charge' : 'move';
        }
        // 🔴 [2026-08-17] 攻击动作播完、还在等装填 → 回待命姿势，别定格在最后一帧。
        //    DE 的做法就是这样：攻击动画只播一遍，播完回 idle 站姿，装填走它自己的计时。
        //    不加这条的话，长装填兵种会**保持挥/举的姿势僵住好几秒**：
        //    动作固定 1.5s 播完，而火炮装填 6.5s（僵 5s）、牵引投石机 11s（僵 9.5s）。
        //    （短装填兵种 reload≈2s 只僵 0.5s，本来就看不出来。）
        //    没有 idle 素材的兵种退回原样定格末帧 —— 绝不退回 move，站着原地迈腿更假。
        else if (m.ph >= 8 && (m.lock ?? 0) > 0 && this.bank[m.key]?.sets.idle?.[m.f]?.length) {
            set = 'idle';
        }
        else if (m.st === 2) set = 'melee';
        else if (m.atkFlip && hasChg) set = 'charge';
        else if (CASTER_TYPES.has(m.key) && (this.bank[m.key]?.noAttackAnim || NO_ATTACK_ANIM.has(m.key))) {
            // 🔴 [2026-10-19 主人令「没有施法动作的兵模，一律采用原地移动的动作替代施法动作」]
            set = 'move';
        }
        else set = 'atk';
        // 🔴 [2026-10-11 主人令] 法师类／无攻击动作的兵种：**攻击帧集为空时退回待命帧**。
        //    否则渲染层取不到图会 `if (!img) continue` —— 整个兵模被跳过，一出手就闪没（诸葛亮/布塞法洛斯原来就是这样）。
        if ((set === 'atk' || set === 'melee' || set === 'charge') && !this.bank[m.key]?.sets[set]?.[m.f]?.length) {
            set = (CASTER_TYPES.has(m.key) && (this.bank[m.key]?.noAttackAnim || NO_ATTACK_ANIM.has(m.key)))
                ? 'move'
                : (this.bank[m.key]?.sets.idle?.[m.f]?.length ? 'idle' : 'move');
        }
        const fade = m.fadeT > 0 ? 1 - m.fadeT / (m.fadeMax || FADE_IN) : 1;
        const it = take();
        it.kind = 'unit';
        const drawY = m.y - this.elevationLiftAt(m.x, m.y);
        // 排序深度 sortY 带 1.8px 迟滞死区：当士兵贴墙或与队友并排受软推挤产生 ±1px 微抖时，sortY 锁定不动
        if (m.sortY === undefined || Math.abs(drawY - m.sortY) > 1.8) {
            m.sortY = drawY;
        }
        it.y = drawY; it.sortY = m.sortY; it.x = m.x; it.f = m.f; it.key = m.key; it.dir = m.dir; it.set = set; it.fr = m.ph; it.a = fade; it.st = m.st;
        it.z = 0; it.zid = m.zid; it.sprite = null;
    }
    vis.length = vi;
    const _tsort0 = performance.now();
    // 严格满足传递性（Transitive Total Order）的 Z 轴排序：
    // 原比较器同时用 `aEnv !== bEnv && |dy| < 12` 与 `|dy| < 4 -> a.zid - b.zid`（非传递关系），
    // 在士兵贴墙且旁边有队友时形成 A < B < W < A 循环，导致 TimSort 每帧随机颠倒遮挡次序闪烁。
    // 现统一使用带迟滞的 sortY（环境已预设 sortY = y - 12），同高度时按固定 z / zid 决胜，100% 确定且无循环。
    vis.sort((a, b) => {
        const dy = (a.sortY ?? a.y) - (b.sortY ?? b.y);
        if (Math.abs(dy) > 0.01) return dy;
        const dz = (a.kind === 'environment' ? a.z : 0) - (b.kind === 'environment' ? b.z : 0);
        if (dz !== 0) return dz;
        return a.zid - b.zid;
    });
    // 🔴 [2026-10-13 主人令「飞鸟应该显示在建筑上层」] 飞鸟在空中：排序后整体挪到队尾，最后画 ⇒ 压在建筑、塔、士兵之上
    {
        let w = 0;
        const birds: typeof vis = [];
        for (let i = 0; i < vis.length; i++) {
            const v = vis[i];
            const a = v.kind === 'environment' && v.sprite ? v.sprite.asset : '';
            if (a.startsWith('ANIMAL:') && animalDeOf(a.slice(7, a.indexOf('/'))).kind === 'bird') birds.push(v);
            else vis[w++] = v;
        }
        for (const b of birds) vis[w++] = b;
    }
    _tSort = performance.now() - _tsort0;

    // ── [2026-09-05 玩家] 受控编队脚下标记环（画在人之下）：攻击=绿 / 待命=蓝；玩家脚下金环 ──
    if (this.playerSetup && this.playerCtlLanes.size) {
        ctx.save();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = this.playerCmd === 'hold' ? 'rgba(120,180,255,0.75)' : 'rgba(120,235,140,0.7)';
        for (const m of this.men) {
            if (m.hp <= 0 || m.hero || !this.playerCtlLanes.has(m.lane)) continue;
            const r = this.radiusOf(m.key) * 0.9;
            ctx.beginPath();
            ctx.ellipse(m.x, m.y - this.elevationLiftAt(m.x, m.y) + 1, r, r * 0.5, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }
    if (this.heroMan && this.heroMan.hp > 0) {
        const h = this.heroMan;
        ctx.save();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255,210,122,0.95)';
        ctx.beginPath();
        ctx.ellipse(h.x, h.y - this.elevationLiftAt(h.x, h.y) + 1, 22, 11, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // ── 旗杆：画在士兵层**之下**（主人 2026-08-12「只改旗杆，放到士兵层下面」）──
    // 与大地图同序：GlobalUnitRenderer 先 drawPole（Behind Soldiers）、后 drawFlag（On Top）。
    // 只画不等：LegionFlagDrawer 没预加载完时自己 return，绝不在 13 里 await。
    const flagTick = performance.now();
    for (const m of this.men) {
        if (!m.flag) continue;
        LegionFlagDrawer.drawPole(ctx, { x: m.x, y: m.y - this.elevationLiftAt(m.x, m.y) }, FLAG_SCALE, this.sideFaction[m.f], FLAG_POLE_RATIO, FLAG_POLE_LIFT);
    }

    for (const v of vis) {
        if (v.kind === 'environment') {
            const _td0 = performance.now();
            this.drawDecorSprite(ctx, v.sprite!, v.y);
            _tDrawDecor += performance.now() - _td0;
            continue;
        }
        const _tu0 = performance.now();
        const b = this.bank[v.key];
        if (!b) continue;
        const img = b.sets[v.set]?.[v.f]?.[v.dir];
        if (!img) continue;
        const wt = WAR_TYPES[v.key];
        // [2026-08-15 全帧修复] 各动作帧数不同（S10DB=8，AoE2=30~60），
        // 帧宽按该动作实际帧数算、帧号按「每秒 8 相位」换算，循环节奏与原 8 帧素材一致。
        const n = b.frames[v.set] ?? 8;
        const fr = v.set === 'die'
            ? Math.min(n - 1, Math.floor(v.fr / DEATH_ANIM * n))   // 死亡：DEATH_ANIM 内播完 n 帧，冻结末帧
            : (v.set === 'move' || v.set === 'idle' || v.st === 0)
                ? Math.floor(v.fr * n * loopRate(b, v.set) / 8) % n // 移动/待命/走路：循环
                : Math.min(n - 1, Math.floor(v.fr * n / 8));       // 攻击/近战/冲锋：播满停末帧（ph=8 不再溢出回第一帧）
        const dm = b.dyn?.[v.set]?.[v.dir];
        // 🔴 DE 素材 meta 未就绪：跳过本帧，S10DB 正方形假设（fh=84）会切错 DE 非正方形 strip（144px 等）
        if (!dm && b.isDE) continue;
        if (v.a < 1) ctx.globalAlpha = v.a;
        if (dm) {
            // 🔴 AoE2 DE 动态帧框（hotspot 对齐，2026-08-15 定稿）：
            //   游戏里 hotspot = canvas 中心，渲染时 hotspot 对齐单位位置，脚底随动作浮动（倒地时大幅下移）。
            //   这里把 box 里的 hotspot(dm.hx/dm.hy) 对齐 v.x/v.y，统一缩放 s —— 站立帧/横躺帧都完整，无裁切。
            // 🔴 [2026-10-11 检查回滚] 上一版把这里改成 `s = 1.0`（顺手删掉 size 乘数 sz），已恢复：
            //   UNIT_PX = 64 ⇒ 基准缩放本来就是 1.0（DE 原生），`sz` 是**兵种之间的相对尺子**
            //   （骑兵 1.15~1.2、战象 0.7~0.8、法师 0.55，共 25 支），删掉它等于把战象凭空放大 25~43%。
            const s = UNIT_PX * (wt?.sz ?? 1) / 64;   // 统一缩放（站立高度 64 参考）
            ctx.drawImage(img, fr * dm.fw, 0, dm.fw, dm.fh, v.x - dm.hx * s, v.y - dm.hy * s, dm.fw * s, dm.fh * s);
        } else {
            // S10DB 正方形帧（原逻辑不变）
            const px = UNIT_PX * (wt?.sz ?? 1) * (b.fh / 64);
            ctx.drawImage(img, fr * b.fh, 0, b.fh, b.fh, v.x - px / 2, v.y - px * 0.9, px, px);
        }
        if (v.a < 1) ctx.globalAlpha = 1;
        _tDrawUnits += performance.now() - _tu0;
    }

    // ── 旗面：画在所有人之上（旗杆已在士兵层之下画过）──
    // 🔴 必须**单开一趟、不参与 y 排序**：排序看的是脚底 y，而旗杆比人高得多，
    //    混进 vis 会让前排的人盖住后排的旗面 —— 旗帜作为「穿透人群的信息层」就废了一半。
    // 🔴 只画不等：LegionFlagDrawer 没预加载完时 drawFlag 自己 return（不崩、只是暂时没旗）。
    //    绝不在 13 里 await 旗帜加载 —— 启动慢那次（89s→11s）就是全屏 24 面旗 await 阻塞。
    for (const m of this.men) {
        if (!m.flag) continue;
        this.drawOneFlag(ctx, m.x, m.y - this.elevationLiftAt(m.x, m.y), m.f, flagTick + m.fo);
    }
    // 倒下的军旗：前半程转倒 90°，全程淡出。
    // 这里**杆和旗面一起**画在旋转变换里 —— 倒下的是整面旗，杆不能留在原地竖着。
    for (const ff of this.fallenFlags) {
        const p = ff.t / FLAG_FALL;
        ctx.save();
        ctx.translate(ff.x, ff.y - this.elevationLiftAt(ff.x, ff.y));
        ctx.rotate(Math.PI / 2 * Math.min(1, p * 2));
        ctx.globalAlpha = 1 - p;
        LegionFlagDrawer.drawPole(ctx, { x: 0, y: 0 }, FLAG_SCALE, this.sideFaction[ff.f], FLAG_POLE_RATIO, FLAG_POLE_LIFT);
        this.drawOneFlag(ctx, 0, 0, ff.f, flagTick + ff.fo);
        ctx.restore();
    }

    // ── [2026-09-05 玩家] 玩家头顶名牌 + 血条（画在人之上；镜像时反翻转让文字正向）──
    if (this.heroMan && this.heroMan.hp > 0 && this.playerSetup) {
        const h = this.heroMan;
        const maxHp = this.statsFor(h.key, h.f).hp || 1;
        const sx = h.x;
        const sy = h.y - this.elevationLiftAt(h.x, h.y) - UNIT_PX * 1.25;
        ctx.save();
        ctx.font = "bold 13px 'Noto Serif SC','SimSun',serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.strokeText(this.playerSetup.heroName, sx, sy);
        ctx.fillStyle = '#ffd27a';
        ctx.fillText(this.playerSetup.heroName, sx, sy);
        const bw = 40, bh = 4;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(sx - bw / 2, sy + 2, bw, bh);
        ctx.fillStyle = '#e04a3a';
        ctx.fillRect(sx - bw / 2, sy + 2, bw * Math.max(0, Math.min(1, h.hp / maxHp)), bh);
        ctx.restore();
    }

    // 箭矢与火器弹丸画在人上面。🔴 2026-08-22 对齐 DE 本体：火药兵种（火枪手/苏丹亲兵/征服者/风琴炮）增加 DE 原版白烟弹线 (Unit 1648 Trail Smoke) 与枪口硝烟
    if (this.arrows.length) {
        ctx.save();
        for (const a of this.arrows) {
            const delay = a.delay ?? 0;
            if (a.t < delay) continue;          // 连发尚未射出
            const p = (a.t - delay) / a.dur;
            const d = a.len * p;
            // 高抛（炮弹/手榴弹）弧高翻倍；有 DE 实值的弹丸按其 projectile_arc；平直弹丸无弧。
            const arcRatio = PROJ_ARC_RATIO[a.proj] ?? (PROJ_HIGH_ARC.has(a.proj) ? 0.5 : 0.3);
            const arcH = Math.min(a.len * arcRatio, PROJ_HIGH_ARC.has(a.proj) ? 160 : 100);
            const flatFlight = !!a.towerFlight || PROJ_FLAT.has(a.proj);
            const arc = flatFlight ? 0 : 4 * arcH * p * (1 - p);
            const x = a.x + a.dx * d;
            const groundY = a.y + a.dy * d;
            const flightLift = a.towerFlight
                ? a.towerFlight.startLift + (a.towerFlight.endLift - a.towerFlight.startLift) * p
                : this.elevationLiftAt(x, groundY);
            const y = groundY - flightLift - arc;

            const startLift = a.towerFlight?.startLift ?? this.elevationLiftAt(a.x, a.y);
            const startX = a.x;
            const startY = a.y - startLift;

            // ── 💨 火枪手白烟弹线 (Unit 1648 Trail Smoke) 与枪口硝烟 ──
            const isGunpowder = a.proj === 'PROJ_GUNPOWDER';

            if (isGunpowder) {
                const trailLen = Math.min(d, 85);
                const tailX = x - a.dx * trailLen;
                const tailY = y - a.dy * trailLen;

                // [PERF 2026-08-29] 白烟弹线改预渲染 sprite：save/restore 隔离变换，视觉与渐变线一致
                const trailAngle = Math.atan2(a.dy, a.dx);
                ctx.save();
                ctx.translate(tailX, tailY);
                ctx.rotate(trailAngle);
                ctx.drawImage(gunpowderTrailSprite(), 0, 0, 90, 4, 0, -2, trailLen, 4);
                ctx.restore();

                // 枪口瞬间微硝烟
                const elapsed = a.t - delay;
                if (elapsed < 0.16) {
                    const puffP = elapsed / 0.16;
                    const smokeR = 2 + puffP * 9;
                    const smokeAlpha = Math.max(0, 0.65 - puffP * 0.65);
                    ctx.save();
                    ctx.fillStyle = `rgba(235, 238, 245, ${smokeAlpha})`;
                    ctx.beginPath();
                    ctx.arc(startX, startY, smokeR, 0, Math.PI * 2);
                    ctx.fill();

                    if (elapsed < 0.05) {
                        const flashAlpha = (1 - elapsed / 0.05) * 0.90;
                        ctx.fillStyle = `rgba(255, 230, 130, ${flashAlpha})`;
                        ctx.beginPath();
                        ctx.arc(startX + a.dx * 3, startY + a.dy * 3, 2.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.restore();
                }
            }

            if (a.proj === 'PROJ_MAGIC') {
                // 🔴 [2026-10-18 主人定] 简单魔法系弹道：短流光尾迹 + 青白/淡金双层微光法球，干净克制不遮挡战场
                const tailLen = Math.min(d, 22);
                const tailX = x - a.dx * tailLen;
                const tailY = y - a.dy * tailLen;
                ctx.save();
                ctx.strokeStyle = a.f === 0 ? 'rgba(130, 225, 255, 0.55)' : 'rgba(255, 215, 130, 0.55)';
                ctx.lineWidth = 2.6;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(tailX, tailY);
                ctx.lineTo(x, y);
                ctx.stroke();

                ctx.fillStyle = a.f === 0 ? 'rgba(100, 215, 255, 0.38)' : 'rgba(255, 200, 100, 0.38)';
                ctx.beginPath();
                ctx.arc(x, y, 6.2, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = a.f === 0 ? 'rgba(195, 245, 255, 0.92)' : 'rgba(255, 238, 175, 0.92)';
                ctx.beginPath();
                ctx.arc(x, y, 3.6, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(x, y, 1.8, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                continue;
            }

            const pa = this.projBank[a.proj];
            if (!pa?.img || !pa.fw) continue;   // 素材未就绪（加载中跳过）

            // 🔴 [2026-08-16 修复向北及全向弹道切线角]
            const vx = a.dx * a.len;
            const vy = a.dy * a.len - (flatFlight ? 0 : 4 * arcH * (1 - 2 * p))
                - (a.towerFlight ? a.towerFlight.endLift - a.towerFlight.startLift : 0);
            const angle = Math.atan2(vy, vx) + (PROJ_ANGLE_OFFSET[a.proj] ?? 0);

            const S = PROJ_SCALE * (PROJ_SCALE_OVERRIDE[a.proj] ?? 1);
            let fr = 0;
            const isChakram = a.proj === 'PROJ_CHAKRAM' || a.proj === 'PROJ_CHAKRAM_ELITE';
            if (isChakram) {
                // DE 原素材：16 个飞行方向 × 每方向 10 帧旋转动画，方向组连续排列。
                const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
                const direction = Math.round(normalizedAngle / (Math.PI * 2) * 16) % 16;
                fr = direction * 10 + Math.floor(p * 20) % 10;
            } else if (a.proj === 'PROJ_THROWING_AXE') {
                // 飞斧空中 360° 旋转
                fr = Math.floor(p * 24) % pa.n;
            } else if (a.proj === 'PROJ_FIRE' || a.proj === 'FLAMETHROWER_FLAME') {
                // 猛火油柜喷火 / 法师的希腊火：30 帧火焰动画循环播放
                fr = Math.floor(p * pa.n) % pa.n;
            } else if (PROJ_FRAME_DUR[a.proj]) {
                fr = Math.floor((a.t - delay) / PROJ_FRAME_DUR[a.proj]) % pa.n;
            } else if (pa.n > 1) {
                // 箭矢/标枪/飞镖取正水平基准帧，由 rotate(angle) 切线角精确控制全 360° 俯仰与起伏
                fr = Math.floor(pa.n / 2);
            }

            ctx.translate(x, y);
            // 飞轮的 16 向角度已经画在 DE 原帧里；其他弹丸仍旋转水平基准帧。
            if (!isChakram) ctx.rotate(angle);
            ctx.drawImage(pa.img, fr * pa.fw, 0, pa.fw, pa.fh, -pa.hx * S, -pa.hy * S, pa.fw * S, pa.fh * S);
            if (!isChakram) ctx.rotate(-angle);
            ctx.translate(-x, -y);
        }
        ctx.restore();
    }

    // ── 云：画在**所有东西之上**（士兵/旗帜/箭矢之后），半透明横向飘过 ──
    // 🔴 这是全场唯一"盖在人上面"的装饰层。
    //    以中心为锚点，各自按 c.scale 缩放绘制。
    for (const c of this.clouds) {
        if (!c.img) continue;
        const iw = c.img.naturalWidth * c.scale, ih = c.img.naturalHeight * c.scale;
        if (!iw || !ih) continue;
        ctx.globalAlpha = c.alpha;
        if (c.flip) {
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.scale(-1, 1);
            ctx.drawImage(c.img, -iw / 2, -ih / 2, iw, ih);
            ctx.restore();
        } else {
            ctx.drawImage(c.img, c.x - iw / 2, c.y - ih / 2, iw, ih);
        }
        ctx.globalAlpha = 1;
    }

    // ── 刀光剑影（半月斩击弧光 & 突刺枪芒 & 接触星芒）──
    if (this.slashes.length) {
        ctx.save();
        for (const s of this.slashes) {
            const p = Math.min(1, s.t / s.dur);
            const alpha = Math.max(0, 1 - p * p) * 0.9;
            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.rotate(s.angle);
            ctx.globalAlpha = alpha;

            // 命中瞬间接触星芒（瞬态十字闪光）
            if (p < 0.4) {
                const fp = p / 0.4;
                const fa = (1 - fp) * 0.95;
                const sl = (s.kind === 'thrust' ? 5.5 : 7) * (1 - fp * 0.35);
                ctx.save();
                ctx.globalAlpha = fa;
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 1.2 * (1 - fp);
                ctx.beginPath();
                ctx.moveTo(-sl, 0); ctx.lineTo(sl, 0);
                ctx.moveTo(0, -sl); ctx.lineTo(0, sl);
                ctx.stroke();
                ctx.restore();
            }

            if (s.kind === 'slash') {
                // 刀剑微弯斩击刀痕（弧刃更清晰张扬）
                const len = s.radius * (0.9 + p * 0.2);
                const h = s.flip ? -3.8 : 3.8;

                // 外层微光
                ctx.beginPath();
                ctx.moveTo(0, -len * 0.5);
                ctx.quadraticCurveTo(h, 0, 0, len * 0.5);
                ctx.strokeStyle = s.color;
                ctx.lineWidth = 2.0 * (1 - p);
                ctx.lineCap = 'round';
                ctx.shadowColor = s.color;
                ctx.shadowBlur = 3;
                ctx.stroke();

                // 核心白亮线
                ctx.beginPath();
                ctx.moveTo(0, -len * 0.38);
                ctx.quadraticCurveTo(h * 0.7, 0, 0, len * 0.38);
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 1.0 * (1 - p);
                ctx.stroke();
            } else {
                // 长枪/矛突刺短芒（沿刺击方向的坚挺枪芒）
                const len = s.radius * (0.85 + p * 0.3);

                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(len, 0);
                ctx.strokeStyle = s.color;
                ctx.lineWidth = 1.8 * (1 - p);
                ctx.lineCap = 'round';
                ctx.shadowColor = '#FFFFFF';
                ctx.shadowBlur = 3;
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(len * 0.75, 0);
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 0.9 * (1 - p);
                ctx.stroke();
            }
            ctx.restore();
        }
        ctx.restore();
    }

    // ── 兵刃交锋火花（金属飞溅火星）──
    if (this.sparks.length) {
        ctx.save();
        for (const s of this.sparks) {
            const alpha = Math.max(0, 1 - s.t / s.dur) * 0.9;
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = s.color;
            ctx.lineWidth = s.size;
            ctx.lineCap = 'round';

            // 沿速度反方向拉出火星尾迹线
            const tailScale = 0.024;
            const tailX = s.x - s.vx * tailScale;
            const tailY = s.y - s.vy * tailScale;

            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(tailX, tailY);
            ctx.stroke();

            // 火星头部亮点
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // ── DE 攻击特效（爆炸/炮口焰，画在火花之上）──
    if (this.fxs.length) {
        for (const f of this.fxs) {
            const fx = this.fxBank[f.type];
            if (!fx) continue;
            const fd = fx.dirs[f.dir % fx.dirs.length];
            if (!fd?.img || !fd.fw) continue;   // 素材未就绪跳过
            const p = Math.min(1, f.t / f.dur);
            const fr = Math.min(fd.n - 1, Math.floor(p * fd.n));
            const s = f.scale;
            ctx.drawImage(fd.img, fr * fd.fw, 0, fd.fw, fd.fh, f.x - fd.hx * s, f.y - fd.hy * s, fd.fw * s, fd.fh * s);
        }
    }
    if (hasTransform) ctx.restore();
    this.coverStrategyMap();
    // [2026-09-03] 时段色调：所有精灵画完后两次整画布合成；DEV 单独计时进 perf.tint
    if (this.timeOfDay.active && this.useGroundGL) {   // 地形缺图时画布不是满铺，不能整屏压色
        const _tt0 = import.meta.env.DEV ? performance.now() : 0;
        this.timeOfDay.paint(ctx, cv.width, cv.height, performance.now());
        if (import.meta.env.DEV) {
            this.perfTint.push(performance.now() - _tt0);
            if (this.perfTint.length > 1800) this.perfTint.shift();
        }
    }
    this.perfStats.tGL = +_tGL.toFixed(2);
    this.perfStats.tCull = +_tCull.toFixed(2);
    this.perfStats.tSort = +_tSort.toFixed(2);
    this.perfStats.tDrawDecor = +_tDrawDecor.toFixed(2);
    this.perfStats.tDrawUnits = +_tDrawUnits.toFixed(2);
    this.perfStats.tTotal = +(performance.now() - _tFrameStart).toFixed(2);
}
