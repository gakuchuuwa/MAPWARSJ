import L from 'leaflet';
import { BATTLEFIELDS, battlefieldSamePointCityId, battlefieldBattleName, type BattlefieldData } from '../data/Battlefields';
import { isBattlefieldFought, onBattlefieldFought } from '../events/battlefieldState';
import { isScriptPeriod } from '../events/scriptPeriod';
import { getWonderGateYear } from '../data/wonderFoundedYears';
import { bfLayout, renderBattlefieldBoxHtml, randomizeBattlefieldSeed, BF_REF_W, BF_REF_H } from './battlefieldMorphology';
import { deHashString } from '../systems/cityWallShared';
import type { TerritorySystem } from '../systems/TerritorySystem';

/**
 * 战场图层 —— 🔴 [2026-09-12 主人定] 战场**不是据点**，是一块独立的地名，
 * 「**类似奇观**」（`src/map/MonumentLayer.ts`）：自己的 pane、自己的图层开关、自己的数据表
 * （`src/data/Battlefields.ts`），**不进 `cityManager.getCities()`**。
 *
 * ── 显示规矩（主人 2026-09-12 / 2026-09-16 / 2026-09-19） ────────────
 *   · **开战前**：**只显示地名**（不显示战场形态）
 *   · **打完**：地名 + **战场形态**（拒马 / 尸体 / 骨骸 / 火把 / 牲口骸骨 / 栅栏木堆 / 残破战旗）
 *   · 🔴 [2026-09-19 主人定] **取消「按年份显示」**：主人原话「现在游戏是乱斗，所有先不要时间
 *     这个限定条件了」——任何战场一律上图（`bf.scriptYear` 保留在数据里，不再参与判定）。
 *   形态的布局数学在 `./battlefieldMorphology.ts`（与 `public/_citytest.html` 逐行同源）。
 *
 * ── 血脉教训（为什么独立） ────────────────────────────────────────────
 *   原先战场是带 `battlefield: true` 的**真据点**，于是带着一个照抄守方的 `factionId`：
 *   AI 会把它当敌方据点、剧本还能给它「易主」（主人：「**战场没有主人，易什么主？**」），
 *   还得为它把 `City.troops` 改成可选、在 3 个审计脚本里开豁免、在 6 个渲染/募兵处打补丁。
 *   独立后这些**整类不存在**：战场没有势力、没有兵力、不能攻占、不占据点名额。
 */

/** 战场形态基准包络宽度（px，zoom 9）：调小至约 160px，与小城/城寨同量级，低调不抢戏 */
const BASE_ART_W = 160;

/**
 * 🔴 [2026-11-09 主人令「战略地图上战场这个据点，在人物上层，请参考其他据点，大中小城看看是如何设计的」]
 *
 * 战场照**据点（大中小城）**的层法分两半，美术在人物之下、名字在人物之上：
 *   据点城墙建筑 `cityPane` **610** ＋ 城名/旗 `labelsPane` **660**，军团 `unitsPane` **620** 夹在中间
 *   → 战场美术 `battlefieldPane` **617**（据点 610 < 奇观 615 < 战场 617 < **军团 620**）
 *   → 战场名标牌 `battlefieldLabelPane` **658**（军团之上、城名 660 之下）
 * 原来整块战场都在 640，军团/玩家走过去被战场美术和名字一起压住。
 */
const BATTLEFIELD_PANE = 'battlefieldPane';
const BATTLEFIELD_LABEL_PANE = 'battlefieldLabelPane';
/** 名称标牌预留高度（px）：图标盒尺寸照旧留这一条，美术位置与改动前逐像素一致 */
const LABEL_H = 18;

/**
 * 一个战场名标牌。
 *
 * 🔴 [2026-11-09] 标牌是**裸 DOM**（直接挂在 `battlefieldLabelPane` 里），不是 Leaflet marker。
 * 实测踩坑：`L.divIcon` 的图标盒（1×1）与被裁的文字不在同一个尺寸里时，浏览器把这块合成为
 * 独立图层并**按图标盒裁剪**，绝对定位的子元素整块不画（先按 marker 做，标牌全都不显示）；
 * 裸 div 自己就是标牌本身，不存在「子元素跑出盒子」这回事。
 */
interface BattlefieldLabelEl {
    el: HTMLDivElement;
    /** 战场真实坐标（避让挪位只在显示层做，不写回数据） */
    lat: number;
    lng: number;
    /** 战场美术盒高（px，未缩放）：标牌竖直落点按它 × `--battlefield-scale` 算 */
    canvasH: number;
}

/**
 * 攻城战战场套**据点样式**时的容器尺寸（px）。
 * 据点组装各自算自己的实际包围盒（`buildDe*CityStackHtml` 内部按 baseSize 铺），
 * 这里给一个足够容纳「大城 140 档 + 中心城堡」的固定框，再让容器不裁切内容即可。
 */
const SIEGE_CASTLE_BOX_W = 360;
const SIEGE_CASTLE_BOX_H = 320;

export class BattlefieldLayer {
    private map: L.Map;
    private layerGroup: L.LayerGroup;
    private markers: Map<string, L.Marker> = new Map();
    /**
     * 战场名标牌 —— 独立挂在 **人物之上** 的 `battlefieldLabelPane`。
     * [2026-11-09 主人令] 与据点同一个思路：城名在 labelsPane(660) 压着军团，战场名同样压着军团。
     */
    private labels: Map<string, BattlefieldLabelEl> = new Map();
    private markerFoughtState: Map<string, boolean> = new Map();
    private initialized = false;
    /** 标牌避让的 rAF 去重旗标（同一帧里重绘 + 缩放各叫一次也只排一次） */
    private labelLayoutScheduled = false;
    /**
     * 🔴 [2026-09-19 主人定] 战场攻城战要套**据点样式**（大中小城寨），
     * 而据点那套组装住在 `TerritorySystem` 里 → 由 `GameMap.attachTerritorySystem()` 注入。
     * 未注入时退回普通战场形态（不报错、不影响野战）。
     */
    private territorySystem: TerritorySystem | null = null;

    constructor(map: L.Map) {
        this.map = map;

        // 专用 pane：战场**美术**压在据点（cityPane 610）与奇观（monumentPane 615）之上、
        // **军团（unitsPane 620）之下**；名字另挂 658 的标牌 pane（在军团之上）。
        // 见文件头 `BATTLEFIELD_PANE` 那段层法。
        if (!this.map.getPane(BATTLEFIELD_PANE)) {
            this.map.createPane(BATTLEFIELD_PANE);
            const pane = this.map.getPane(BATTLEFIELD_PANE);
            if (pane) {
                pane.style.zIndex = '617';
            }
        }
        if (!this.map.getPane(BATTLEFIELD_LABEL_PANE)) {
            this.map.createPane(BATTLEFIELD_LABEL_PANE);
            const pane = this.map.getPane(BATTLEFIELD_LABEL_PANE);
            if (pane) {
                pane.style.zIndex = '658';
            }
        }

        this.layerGroup = L.layerGroup().addTo(this.map);
        if (!document.getElementById('bf-click-through-style')) {
            const st = document.createElement('style');
            st.id = 'bf-click-through-style';
            st.textContent = '.bf-click-through, .bf-click-through * { pointer-events: none !important; }';
            document.head.appendChild(st);
        }
        // 🔴 [2026-09-12 主人令] 开局随机种子偏移 → **每局的战场形态都不一样**（件种/镜像/挪位全重掷）。
        //    只在构造时设一次：同一局内稳定，战场不会中途变样。
        randomizeBattlefieldSeed();
        queueMicrotask(() => {
            if (!this.initialized) {
                this.initialized = true;
                this.renderBattlefields();
            }
        });

        // 【打完了才叫战场】战斗结束时重绘：把刚打完的战场的形态亮出来
        onBattlefieldFought(() => this.renderBattlefields());

        // 随地图缩放，公式与据点（TerritorySystem.updateCityScales）和奇观一致：1.0 + (zoom-9)*0.5
        // 🔴 [2026-11-09] 标牌是裸 DOM（不是 marker），Leaflet 不会替它跟视图：
        //    `setView`（含同倍率平移）会重置 map pane 并派发 `viewreset`，此时必须自己重算一次图层坐标，
        //    否则标牌留在旧位置（实测：平移 2400px 后标牌没跟过去）。
        this.map.on('zoomend viewreset', () => this.updateScale());
        this.updateScale();
    }

    /** 战场随缩放：与奇观 --monument-scale 同一线性公式 */
    private updateScale(): void {
        const zoom = this.map.getZoom();
        const scale = Math.max(0, 1.0 + (zoom - 9) * 0.5);
        this.map.getPane(BATTLEFIELD_PANE)?.style.setProperty('--battlefield-scale', String(scale));
        // 标牌是裸 DOM（不走 marker 自动跟缩放）：图层坐标要自己重算一遍；
        // 它不跟缩放，但竖直落点要落在**缩放后**的美术下沿 ⇒ 再排一次
        for (const id of this.labels.keys()) this.positionLabel(id);
        this.scheduleLabelLayout();
    }

    /** 当前战场美术缩放（美术盒内的 `--battlefield-scale`，标牌落点换算共用） */
    private battlefieldScale(): number {
        const raw = this.map.getPane(BATTLEFIELD_PANE)?.style.getPropertyValue('--battlefield-scale') || '';
        return Math.max(0.01, parseFloat(raw) || 1);
    }

    /**
     * 标牌默认位：**marker 坐标点 → 标牌上沿**的屏幕偏移（px）。
     *
     * 改动前标牌在美术容器里 `bottom:-18px`，跟 `--battlefield-scale` 一起放大；
     * 现在搬进独立 pane（和城名一样**文字不缩放**），落点改按缩放后的美术下沿换算：
     *   dy = (canvasH/2 + 3) × scale − 9
     * · +3 ＝ 原 `bottom:-18px` 减去标牌自身约 15px 高的一半；
     * · −9 ＝ 图标盒比美术高 `LABEL_H`(18) 的居中偏移（美术中心比 marker 点高 9px）。
     * `scale = 1` 时即旧几何 (canvasH − 12) / 2。
     */
    private labelBaseY(canvasH: number): number {
        return Math.round((canvasH / 2 + 3) * this.battlefieldScale() - 9);
    }

    /**
     * 🔴 [2026-09-19 主人定] 注入 `TerritorySystem`，供**攻城战战场**套用据点样式。
     * 走 setter（不走构造参数）是为了不动 `new BattlefieldLayer(this.map)` 那个已有调用点。
     */
    public setTerritorySystem(ts: TerritorySystem | null): void {
        this.territorySystem = ts;
        this.renderBattlefields();
    }

    /** 战场形态（拒马/尸体/骨骸…只在打完之后画） */
    private buildMorphHtml(bf: BattlefieldData, fought: boolean): string {
        if (!fought) return '';
        // 🔴 [2026-09-19 主人定]「这种战场攻城战，标注上，套用大中小城寨哪个据点的样式就行。」
        //    → 攻城战战场打的是**一座砦/城**，标牌该长成据点那样（大城/中城/小城/城寨/险要），
        //      而不是一堆残骸。样式全走据点同一套组装（TerritorySystem.buildSiegeCastleStackHtml），
        //      没有第二套画法 —— 以后据点样式改了，战场的砦一起变。
        if (bf.siegeCastleType && this.territorySystem) {
            return this.mirrorBattlefieldArt(bf, this.territorySystem.buildSiegeCastleStackHtml(bf.id, bf.siegeCastleType, null), true);
        }
        return this.mirrorBattlefieldArt(bf, renderBattlefieldBoxHtml(BASE_ART_W, bf.id), false);
    }

    /**
     * 🔴 [2026-10-03 主人令「大中小城寨，战场都要随机镜像。PASS不要随机镜像」] 战场标牌**整块左右翻一次**：
     *   每局随机（`deHashString` 带每局会话种子，见 GameApp 的 `setCityStyleSessionSeed`）、**局内稳定** ——
     *   战场不会中途变样。地名标牌在容器里、不在这层里，故文字不会被翻。
     *   两路翻法不同，但**翻轴都取整块自己的中心，位置一分不动**：
     *     · 砦（据点样式，`position:relative` 的整摞）→ 用缩到自身大小的 inline-block 层翻；
     *     · 遗迹盒（`position:absolute` + translate(-50%,-50%) 居中于容器）→ 用同尺寸的定位层翻
     *       （若用 inline-block，会把它变成「零尺寸包含块」，盒子会塌到左上角）。
     */
    private mirrorBattlefieldArt(bf: BattlefieldData, art: string, isCastleStack: boolean): string {
        if ((deHashString(bf.id + '|mirror') & 1) === 0) return art;
        const layer = isCastleStack
            ? 'display:inline-block;'
            : 'position:absolute;left:0;top:0;width:100%;height:100%;';
        return `<div style="${layer}transform:scaleX(-1);">${art}</div>`;
    }

    /** 外部显示过滤（剧本期只显示已打过的战场与当前这一场，见 ScriptCityVisibility） */
    private visibilityFilter: ((bfId: string) => boolean) | null = null;

    public setVisibilityFilter(filter: ((bfId: string) => boolean) | null): void {
        this.visibilityFilter = filter;
        this.initialized = true;
        this.renderBattlefields();
    }

    /** 重绘全部战场（打完标记变化、跨年、手动刷新时调） */
    public renderBattlefields(): void {
        const visibleBfs = new Map<string, BattlefieldData>();
        const gateYear = getWonderGateYear();
        for (const bf of BATTLEFIELDS) {
            // 🔴 [2026-11-10 主人令「战场要等年份发生后才能显示出来」]
            //    与奇观/据点建城年同一口径：有年代闸门时（历史模式＝日历年份，剧本模式＝事件年份），
            //    未到发生年份（scriptYear > gateYear）且尚未打过的战场不显示；乱斗与编辑器模式 gateYear 为 null 全显示。
            if (gateYear !== null && bf.scriptYear > gateYear && !isBattlefieldFought(bf.id)) continue;
            // 🔴 [2026-11-08 主人令「50KM以内的战场，和据点属于同一个点，不用设计。之前就是这个判定，不要重复。」]
            if (battlefieldSamePointCityId(bf.id)) continue;
            if (this.visibilityFilter && !this.visibilityFilter(bf.id)) continue;
            visibleBfs.set(bf.id, bf);
        }

        // 1. 移除不再显示的战场
        for (const [id, marker] of this.markers) {
            if (!visibleBfs.has(id)) {
                this.layerGroup.removeLayer(marker);
                this.markers.delete(id);
                this.markerFoughtState.delete(id);
                this.removeBattlefieldLabel(id);
            }
        }

        // 2. 更新或添加战场（新出现的在剧本模式下渐显）
        for (const [id, bf] of visibleBfs) {
            const fought = !isScriptPeriod() || isBattlefieldFought(bf.id);
            const prevFought = this.markerFoughtState.get(id);

            if (this.markers.has(id)) {
                if (prevFought !== fought) {
                    const oldMarker = this.markers.get(id)!;
                    this.layerGroup.removeLayer(oldMarker);
                    this.markers.delete(id);
                    // 🔴 [2026-09-30 主人令「据点和战场的显现请设计为渐显」] 打完仗、战场遗迹出现：只让遗迹渐显，
                    //    地名标牌本来就在（打完只是换成战役名），不重播渐显
                    const marker = this.createBattlefieldMarker(bf, fought, false, true);
                    this.markers.set(id, marker);
                    this.markerFoughtState.set(id, fought);
                }
                continue;
            }

            // 新出现的战场一律渐显（剧本、乱斗都一样）
            const marker = this.createBattlefieldMarker(bf, fought, true);
            this.markers.set(id, marker);
            this.markerFoughtState.set(id, fought);
        }

        // 🔴 [2026-10-26 主人令「战略地图上，所有战场的名字不要重叠」] 标牌重新落位
        this.scheduleLabelLayout();
    }

    private createBattlefieldMarker(bf: BattlefieldData, fought: boolean, fadeIn = false, morphFadeIn = false): L.Marker {
        const html = this.buildBattlefieldHtml(bf, fought, fadeIn, morphFadeIn);

        const L0 = bfLayout();
        const k = BASE_ART_W / L0.artW;
        const useCastle = fought && !!bf.siegeCastleType && !!this.territorySystem;
        const canvasW = useCastle ? SIEGE_CASTLE_BOX_W : BF_REF_W * k;
        const canvasH = useCastle ? SIEGE_CASTLE_BOX_H : BF_REF_H * k;
        const labelH = LABEL_H;

        const icon = L.divIcon({
            className: 'battlefield-icon',
            html,
            iconSize: [canvasW, canvasH + labelH],
            iconAnchor: [canvasW / 2, (canvasH + labelH) / 2],
        });

        // 🔴 [2026-09-14 主人定]「玩家点击战场后，触发真实的战役战斗。不用接任务了，这样简单。」
        //    战场仍然不是据点、没有详情面板，点击只有一个用途：打这一场真实战役。
        const marker = L.marker([bf.lat, bf.lng], {
            icon,
            interactive: true,
            pane: BATTLEFIELD_PANE,
        }).addTo(this.layerGroup);
        marker.on('click', () => {
            window.dispatchEvent(new CustomEvent('battlefield-click', { detail: { id: bf.id, name: bf.name } }));
        });

        // 🔴 [2026-11-09 主人令] 名字标牌不在这颗美术 marker 里，单独挂到**人物之上**那一层——
        //    与据点「建筑在 cityPane(610)、城名在 labelsPane(660)」同一个设计。
        this.mountBattlefieldLabel(bf, fought, canvasH, fadeIn);

        return marker;
    }

    /**
     * 挂/换一个战场的名标牌（美术 marker 只管地面与战场形态）。
     * 位置换算见 `labelBaseY`；重画（打完改名）时先摘旧的再挂新的。
     */
    private mountBattlefieldLabel(bf: BattlefieldData, fought: boolean, canvasH: number, fadeIn: boolean): void {
        this.removeBattlefieldLabel(bf.id);

        // 🔴 [2026-09-12 主人令「怎么战场还显示武将名字呢，删除，别乱加」]
        //    标牌只留地名。
        // 🔴 [2026-11-08 主人令「战略地图上战场命名，不要用XXX战场，要用XXX之战，XXXX战役等」]
        //    未打完 = 纯地名（「伊苏斯」「赤壁」）；打完战毕 = 战役名（「伊苏斯战役」「赤壁之战」）。
        //    战役名由 `battlefieldBattleName()` 统一给（数据本身是战役名的原样用，纯地名按史补后缀）。
        const displayName = fought ? battlefieldBattleName(bf) : bf.name;

        const pane = this.map.getPane(BATTLEFIELD_LABEL_PANE);
        if (!pane) return;

        const el = document.createElement('div');
        el.className = `bf-label${fadeIn ? ' map-fade-in' : ''}`;
        el.textContent = displayName;
        el.style.cssText = [
            'position:absolute',
            'left:0',
            'top:0',
            'pointer-events:auto',
            'cursor:pointer',
            'white-space:nowrap',
            'text-align:center',
            'background:linear-gradient(180deg, rgba(30, 20, 18, 0.95) 0%, rgba(14, 10, 9, 0.98) 100%)',
            'border:1px solid rgba(150, 116, 76, 0.85)',
            'border-radius:3px',
            'padding:1px 6px',
            'color:#e8cfa8',
            'font-size:11px',
            'font-weight:bold',
            'text-shadow:0 1px 2px rgba(0,0,0,0.9)',
            'box-shadow:0 2px 4px rgba(0,0,0,0.6)',
        ].join(';');
        // 点名字和点战场美术是同一件事：打这一场
        el.addEventListener('click', (ev) => {
            ev.stopPropagation();
            window.dispatchEvent(new CustomEvent('battlefield-click', { detail: { id: bf.id, name: bf.name } }));
        });
        pane.appendChild(el);

        this.labels.set(bf.id, { el, lat: bf.lat, lng: bf.lng, canvasH });
        // 默认位先摆好（避让要等下一帧 rAF 才排，别让标牌先在错地方闪一下）
        el.style.transform = `translate(-50%, ${this.labelBaseY(canvasH)}px)`;
        this.positionLabel(bf.id);
        this.scheduleLabelLayout();
    }

    /**
     * 把一颗标牌摆到它战场的**图层坐标**上（`left/top`，pan 时整块 pane 平移，不用管）。
     * 水平居中与竖向下沿由 `transform`（`labelBaseY`）负责，见 `relayoutLabels`。
     */
    private positionLabel(bfId: string): void {
        const rec = this.labels.get(bfId);
        if (!rec) return;
        const p = this.map.latLngToLayerPoint(L.latLng(rec.lat, rec.lng));
        rec.el.style.left = `${p.x}px`;
        rec.el.style.top = `${p.y}px`;
    }

    /** 摘掉一个战场的名标牌（不再显示 / 重画时） */
    private removeBattlefieldLabel(bfId: string): void {
        const rec = this.labels.get(bfId);
        if (rec) {
            rec.el.remove();
            this.labels.delete(bfId);
        }
    }

    /**
     * 🔴 [2026-09-24 主人「推罗不能点吗」「我要画路，怎么据点点不了呀」] 画路 / 编辑据点时，
     *    战场标牌不接点击，让点击落到下面的据点上（推罗战场与推罗据点同一坐标，战场层压在据点层之上）。
     * [2026-11-09] 名字标牌已挪到 658 的独立 pane，同样要让出点击（否则它压着据点却点不到）。
     */
    public setClickThrough(on: boolean): void {
        this.map.getPane(BATTLEFIELD_PANE)?.classList.toggle('bf-click-through', on);
        this.map.getPane(BATTLEFIELD_LABEL_PANE)?.classList.toggle('bf-click-through', on);
    }

    /** 单个战场的**美术** HTML（战场形态 / 攻城战的砦）；名字标牌另挂，见 `mountBattlefieldLabel` */
    private buildBattlefieldHtml(bf: BattlefieldData, fought: boolean, fadeIn = false, morphFadeIn = false): string {
        const L0 = bfLayout();
        const k = BASE_ART_W / L0.artW;
        // 🔴 [2026-09-19] 套据点样式的攻城战战场：容器按据点尺寸给（见 renderBattlefields 同一判据）
        const useCastle = fought && !!bf.siegeCastleType && !!this.territorySystem;
        const canvasW = useCastle ? SIEGE_CASTLE_BOX_W : BF_REF_W * k;
        const canvasH = useCastle ? SIEGE_CASTLE_BOX_H : BF_REF_H * k;

        // 形态（只在打完之后画）。种子 = 战场 id → 同一战场每局长得一样、各战场互不相同
        //   · 攻城战战场 → 套据点样式（大中小城寨），见 buildMorphHtml
        //   · 其余 → 战场形态（拒马/尸体/骨骸…）
        const morphHtml = fought ? this.buildMorphHtml(bf, true) : '';
        const morph = morphHtml && morphFadeIn
            ? `<div class="map-fade-in" style="position: absolute; left: 0; top: 0; width: 100%; height: 100%;">${morphHtml}</div>`
            : morphHtml;

        // 名字/战役名的文字已挪去 `mountBattlefieldLabel`（独立标牌，在人物之上）；
        // 这里只剩地面与战场形态。

        const animClass = fadeIn ? ' map-fade-in' : '';

        return `
            <div class="battlefield-container${animClass}" style="
                position: relative;
                width: ${canvasW.toFixed(0)}px;
                height: ${canvasH.toFixed(0)}px;
                transform: scale(var(--battlefield-scale, 1));
                transform-origin: 50% 50%;
                pointer-events: auto;
                cursor: pointer;
            ">
                ${morph}
                <!-- 地名/战役名标牌**不在这里**：另挂 battlefieldLabelPane（658，人物之上），见 mountBattlefieldLabel -->
            </div>
        `;
    }

    public setVisible(visible: boolean): void {
        if (visible) {
            if (!this.map.hasLayer(this.layerGroup)) {
                this.map.addLayer(this.layerGroup);
            }
            // 标牌是裸 DOM、不在 layerGroup 里：图层开关要单独跟上；重新上屏后重排一遍
            const pane = this.map.getPane(BATTLEFIELD_LABEL_PANE);
            if (pane) pane.style.display = '';
            for (const id of this.labels.keys()) this.positionLabel(id);
            this.scheduleLabelLayout();
        } else {
            if (this.map.hasLayer(this.layerGroup)) {
                this.map.removeLayer(this.layerGroup);
            }
            const pane = this.map.getPane(BATTLEFIELD_LABEL_PANE);
            if (pane) pane.style.display = 'none';
        }
    }

    /** 标牌避让排一次（同一帧多次调用合并成一次 rAF） */
    private scheduleLabelLayout(): void {
        if (this.labelLayoutScheduled) return;
        this.labelLayoutScheduled = true;
        requestAnimationFrame(() => {
            this.labelLayoutScheduled = false;
            if (!this.map.getPane(BATTLEFIELD_LABEL_PANE)) return;
            this.relayoutLabels();
        });
    }

    /**
     * 🔴 [2026-10-26 主人令「战略地图上，所有战场的名字不要重叠」] 战场地名标牌**互不压字**。
     *
     * 做法：先把所有标牌复位到默认位（战场坐标正下方居中，竖直偏移由 `labelBaseY` 给）→
     * 一次性量出各自**屏幕矩形** → 按 `BATTLEFIELDS` 顺序逐个落位：
     *   默认位空着就原位；被已落位的标牌压住就依次试「下一行 → 上一行 → 右一列 → 左一列 → 外圈」
     *   这些候选位，取第一个不压任何已落位标牌的；全被占（现实中不会）才退回默认位。
     * [2026-11-09] 标牌已搬进独立 pane（`battlefieldLabelPane`），**文字不再跟 `--battlefield-scale` 缩放**
     *   （与城名同一口径），所以位移量就是屏幕像素，不用再除 scale。
     *
     * 触发：战场重绘（新出现 / 打完改名字与形态）、缩放结束（美术下沿变了）、图层重新显示。
     * 平移不触发：所有标牌跟着地图一起移，相对位置不变。
     * ⚠️ 这里只管「战场标牌之间」不压字；战场与据点城名之间不归这里（城名在 labelsPane）。
     */
    private relayoutLabels(): void {
        if (!this.map.getPane(BATTLEFIELD_LABEL_PANE)) return;
        interface LabelBox { el: HTMLElement; w: number; h: number; x: number; y: number; baseY: number }
        const boxes: LabelBox[] = [];
        for (const rec of this.labels.values()) {
            const el = rec.el;
            const baseY = this.labelBaseY(rec.canvasH);
            // 默认位（与 mountBattlefieldLabel 里写的那个 transform 同一口径）
            el.style.transform = `translate(-50%, ${baseY}px)`;
            boxes.push({ el, w: 0, h: 0, x: 0, y: 0, baseY });
        }
        // 量默认位矩形（读 rect 会强制一次布局刷新；只在重绘/缩放时跑，81 个标牌量一次可接受）
        for (const b of boxes) {
            const r = b.el.getBoundingClientRect();
            b.w = r.width; b.h = r.height; b.x = r.left; b.y = r.top;
        }
        const GAP = 2;
        const placed: LabelBox[] = [];
        // 🔴 [2026-11-08 主人令「据点标注不要重叠」] 先把据点标注与奇观标注收进固定避让集合，战场标注不得压住它们
        const labelsPane = this.map.getPane('labelsPane');
        if (labelsPane && labelsPane.style.display !== 'none') {
            for (const el of labelsPane.querySelectorAll<HTMLElement>('.city-label-content')) {
                const r = el.getBoundingClientRect();
                if (r.width >= 1 && r.height >= 1) {
                    placed.push({ el, w: r.width, h: r.height, x: r.left, y: r.top, baseY: 0 });
                }
            }
        }
        const monumentPane = this.map.getPane('monumentPane');
        if (monumentPane && monumentPane.style.display !== 'none') {
            for (const el of monumentPane.querySelectorAll<HTMLElement>('.monument-label')) {
                const r = el.getBoundingClientRect();
                if (r.width >= 1 && r.height >= 1) {
                    placed.push({ el, w: r.width, h: r.height, x: r.left, y: r.top, baseY: 0 });
                }
            }
        }
        const blocked = (x: number, y: number, w: number, h: number): boolean =>
            placed.some((p) => x < p.x + p.w + GAP && x + w + GAP > p.x && y < p.y + p.h + GAP && y + h + GAP > p.y);
        for (const b of boxes) {
            if (b.w < 1 || b.h < 1) continue;   // 没上屏的（pane 隐藏等）跳过
            const row = b.h + GAP * 2;
            const col = b.w + GAP * 2;
            const cands: Array<[number, number]> = [[0, 0]];
            for (let ring = 1; ring <= 6; ring++) {
                cands.push(
                    [0, ring * row], [0, -ring * row],
                    [ring * col, 0], [-ring * col, 0],
                    [ring * col, ring * row], [-ring * col, ring * row],
                    [ring * col, -ring * row], [-ring * col, -ring * row],
                );
            }
            let dx = 0, dy = 0, found = false;
            for (const [cx, cy] of cands) {
                if (!blocked(b.x + cx, b.y + cy, b.w, b.h)) { dx = cx; dy = cy; found = true; break; }
            }
            placed.push({ el: b.el, w: b.w, h: b.h, x: b.x + dx, y: b.y + dy, baseY: b.baseY });
            if (found && (dx !== 0 || dy !== 0)) {
                b.el.style.transform = `translate(calc(-50% + ${dx.toFixed(1)}px), ${(b.baseY + dy).toFixed(1)}px)`;
            }
        }
    }
}
