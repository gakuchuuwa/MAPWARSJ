import L from 'leaflet';
import { BATTLEFIELDS, type BattlefieldData } from '../data/Battlefields';
import { isBattlefieldFought, onBattlefieldFought } from '../events/battlefieldState';
import { isScriptPeriod } from '../events/scriptPeriod';
import { bfLayout, renderBattlefieldBoxHtml, randomizeBattlefieldSeed, BF_REF_W, BF_REF_H } from './battlefieldMorphology';
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

/** 战场形态基准包络宽度（px，zoom 9）：与小城据点（约 184×160）同一视觉量级 */
const BASE_ART_W = 230;

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
    private markerFoughtState: Map<string, boolean> = new Map();
    private initialized = false;
    /**
     * 🔴 [2026-09-19 主人定] 战场攻城战要套**据点样式**（大中小城寨），
     * 而据点那套组装住在 `TerritorySystem` 里 → 由 `GameMap.attachTerritorySystem()` 注入。
     * 未注入时退回普通战场形态（不报错、不影响野战）。
     */
    private territorySystem: TerritorySystem | null = null;

    constructor(map: L.Map) {
        this.map = map;

        // 专用 pane：压在据点（cityPane 610）之上、奇观（monumentPane 650）之下
        if (!this.map.getPane('battlefieldPane')) {
            this.map.createPane('battlefieldPane');
            const pane = this.map.getPane('battlefieldPane');
            if (pane) {
                pane.style.zIndex = '640';
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
        this.map.on('zoomend', () => this.updateScale());
        this.updateScale();
    }

    /** 战场随缩放：与奇观 --monument-scale 同一线性公式 */
    private updateScale(): void {
        const zoom = this.map.getZoom();
        const scale = Math.max(0, 1.0 + (zoom - 9) * 0.5);
        this.map.getPane('battlefieldPane')?.style.setProperty('--battlefield-scale', String(scale));
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
            return this.territorySystem.buildSiegeCastleStackHtml(bf.id, bf.siegeCastleType, null);
        }
        return renderBattlefieldBoxHtml(BASE_ART_W, bf.id);
    }

    /** 外部显示过滤（剧本期只显示已打过的战场与当前这一场，见 ScriptCityVisibility） */
    private visibilityFilter: ((bfId: string) => boolean) | null = null;

    public setVisibilityFilter(filter: ((bfId: string) => boolean) | null): void {
        this.visibilityFilter = filter;
        this.initialized = true;
        this.renderBattlefields();
    }

    /** 重绘全部战场（打完标记变化、手动刷新时调） */
    public renderBattlefields(): void {
        const visibleBfs = new Map<string, BattlefieldData>();
        for (const bf of BATTLEFIELDS) {
            // 🔴 [2026-09-19 主人定] **取消「未到年份不上图」**。
            //    主人原话：「现在游戏是乱斗，所有先不要时间这个限定条件了，但是再写事件的时候，
            //    还要写上时间，万一以后还要用，就不要再写了。」
            //    改之前是 2026-09-16 那条「未到发生年份的战场不上图」，与「武将触发」相冲：
            //    玩家在 -334 年就可能跟着某位武将奔赴一场史实战役，战场却因为年份没到压根不在图上。
            //    `bf.scriptYear` 字段**保留**（数据里照旧填），只是不再参与显示判定。
            if (this.visibilityFilter && !this.visibilityFilter(bf.id)) continue;
            visibleBfs.set(bf.id, bf);
        }

        // 1. 移除不再显示的战场
        for (const [id, marker] of this.markers) {
            if (!visibleBfs.has(id)) {
                this.layerGroup.removeLayer(marker);
                this.markers.delete(id);
                this.markerFoughtState.delete(id);
            }
        }

        // 2. 更新或添加战场（新出现的在剧本模式下渐显）
        for (const [id, bf] of visibleBfs) {
            const fought = isBattlefieldFought(bf.id);
            const prevFought = this.markerFoughtState.get(id);

            if (this.markers.has(id)) {
                if (prevFought !== fought) {
                    const oldMarker = this.markers.get(id)!;
                    this.layerGroup.removeLayer(oldMarker);
                    this.markers.delete(id);
                    const marker = this.createBattlefieldMarker(bf, fought, false);
                    this.markers.set(id, marker);
                    this.markerFoughtState.set(id, fought);
                }
                continue;
            }

            const fadeIn = isScriptPeriod();
            const marker = this.createBattlefieldMarker(bf, fought, fadeIn);
            this.markers.set(id, marker);
            this.markerFoughtState.set(id, fought);
        }
    }

    private createBattlefieldMarker(bf: BattlefieldData, fought: boolean, fadeIn = false): L.Marker {
        const html = this.buildBattlefieldHtml(bf, fought, fadeIn);

        const L0 = bfLayout();
        const k = BASE_ART_W / L0.artW;
        const useCastle = fought && !!bf.siegeCastleType && !!this.territorySystem;
        const canvasW = useCastle ? SIEGE_CASTLE_BOX_W : BF_REF_W * k;
        const canvasH = useCastle ? SIEGE_CASTLE_BOX_H : BF_REF_H * k;
        const labelH = 18;

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
            pane: 'battlefieldPane',
        }).addTo(this.layerGroup);
        marker.on('click', () => {
            window.dispatchEvent(new CustomEvent('battlefield-click', { detail: { id: bf.id, name: bf.name } }));
        });

        return marker;
    }

    /**
     * 🔴 [2026-09-24 主人「推罗不能点吗」「我要画路，怎么据点点不了呀」] 画路 / 编辑据点时，
     *    战场标牌不接点击，让点击落到下面的据点上（推罗战场与推罗据点同一坐标，战场层压在据点层之上）。
     */
    public setClickThrough(on: boolean): void {
        this.map.getPane('battlefieldPane')?.classList.toggle('bf-click-through', on);
    }

    /** 单个战场的 HTML：**未打完 = 只有地名**；打完 = 地名 + 战场形态 + 标牌加「战场」 */
    private buildBattlefieldHtml(bf: BattlefieldData, fought: boolean, fadeIn = false): string {
        const L0 = bfLayout();
        const k = BASE_ART_W / L0.artW;
        // 🔴 [2026-09-19] 套据点样式的攻城战战场：容器按据点尺寸给（见 renderBattlefields 同一判据）
        const useCastle = fought && !!bf.siegeCastleType && !!this.territorySystem;
        const canvasW = useCastle ? SIEGE_CASTLE_BOX_W : BF_REF_W * k;
        const canvasH = useCastle ? SIEGE_CASTLE_BOX_H : BF_REF_H * k;

        // 形态（只在打完之后画）。种子 = 战场 id → 同一战场每局长得一样、各战场互不相同
        //   · 攻城战战场 → 套据点样式（大中小城寨），见 buildMorphHtml
        //   · 其余 → 战场形态（拒马/尸体/骨骸…）
        const morph = fought ? this.buildMorphHtml(bf, true) : '';

        // 🔴 [2026-09-12 主人令「怎么战场还显示武将名字呢，删除，别乱加」]
        //    标牌只留地名。
        // 🔴 [2026-09-16 主人定「地标在战场事件结束后加上战场两个字」]
        //    未打完 = 纯地名（如「伊苏斯」）；打完战毕 = 地名 + 战场（如「伊苏斯战场」）
        const displayName = fought
            ? (bf.name.endsWith('战场') ? bf.name : `${bf.name}战场`)
            : bf.name;

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
                <!-- 地名标牌（未打完 = 地名；打完战毕 = 地名 + 战场） -->
                <div class="bf-label" style="
                    position: absolute;
                    bottom: -18px;
                    left: 50%;
                    transform: translateX(-50%);
                    white-space: nowrap;
                    text-align: center;
                    background: linear-gradient(180deg, rgba(30, 20, 18, 0.95) 0%, rgba(14, 10, 9, 0.98) 100%);
                    border: 1px solid rgba(150, 116, 76, 0.85);
                    border-radius: 3px;
                    padding: 1px 6px;
                    color: #e8cfa8;
                    font-size: 11px;
                    font-weight: bold;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.9);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.6);
                    z-index: 400;
                ">
                    ${displayName}
                </div>
            </div>
        `;
    }

    public setVisible(visible: boolean): void {
        if (visible) {
            if (!this.map.hasLayer(this.layerGroup)) {
                this.map.addLayer(this.layerGroup);
            }
        } else {
            if (this.map.hasLayer(this.layerGroup)) {
                this.map.removeLayer(this.layerGroup);
            }
        }
    }
}
