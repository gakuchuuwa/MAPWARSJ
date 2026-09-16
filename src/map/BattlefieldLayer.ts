import L from 'leaflet';
import { BATTLEFIELDS, type BattlefieldData } from '../data/Battlefields';
import { isBattlefieldFought, onBattlefieldFought } from '../events/battlefieldState';
import { bfLayout, renderBattlefieldBoxHtml, randomizeBattlefieldSeed, BF_REF_W, BF_REF_H } from './battlefieldMorphology';
import { GameConfig } from '../config/GameConfig';

/**
 * 战场图层 —— 🔴 [2026-09-12 主人定] 战场**不是据点**，是一块独立的地名，
 * 「**类似奇观**」（`src/map/MonumentLayer.ts`）：自己的 pane、自己的图层开关、自己的数据表
 * （`src/data/Battlefields.ts`），**不进 `cityManager.getCities()`**。
 *
 * ── 显示规矩（主人 2026-09-12 / 2026-09-16） ─────────────────────────
 *   「**按年份显示**」：
 *   · 未到年份（`currentYear < bf.scriptYear`）：不上图
 *   · 达到年份后：
 *     - **开战前**：**只显示地名**（不显示战场形态）
 *     - **打完**：地名 + **战场形态**（拒马 / 尸体 / 骨骸 / 火把 / 牲口骸骨 / 栅栏木堆 / 残破战旗）
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

export class BattlefieldLayer {
    private map: L.Map;
    private layerGroup: L.LayerGroup;
    private markers: Map<string, L.Marker> = new Map();
    private currentYear: number = GameConfig.TIME.TIMELINE_START_YEAR;

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
        // 🔴 [2026-09-12 主人令] 开局随机种子偏移 → **每局的战场形态都不一样**（件种/镜像/挪位全重掷）。
        //    只在构造时设一次：同一局内稳定，战场不会中途变样。
        randomizeBattlefieldSeed();
        this.renderBattlefields();

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

    /** 同步游戏年份：跨年时刷新战场显示（未到年份的战场随时间推移逐步上图） */
    public setYear(year: number): void {
        if (this.currentYear === year) return;
        this.currentYear = year;
        this.renderBattlefields();
    }

    /** 重绘全部战场（打完标记变化、跨年或手动刷新时调） */
    public renderBattlefields(): void {
        this.layerGroup.clearLayers();
        this.markers.clear();

        for (const bf of BATTLEFIELDS) {
            // 🔴 [2026-09-16 主人定] 未到发生年份的战场不上图（例如 -334 显示格拉尼库斯河，-333 才显示伊苏斯）
            if (this.currentYear < bf.scriptYear) continue;

            const fought = isBattlefieldFought(bf.id);
            const html = this.buildBattlefieldHtml(bf, fought);

            // 形态盒子的画布尺寸（参考画布 340×240 × k），标牌挂在容器底部
            const L0 = bfLayout();
            const k = BASE_ART_W / L0.artW;
            const canvasW = BF_REF_W * k;
            const canvasH = BF_REF_H * k;
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

            this.markers.set(bf.id, marker);
        }
    }

    /** 单个战场的 HTML：**未打完 = 只有地名**；打完 = 地名 + 战场形态 */
    private buildBattlefieldHtml(bf: BattlefieldData, fought: boolean): string {
        const L0 = bfLayout();
        const k = BASE_ART_W / L0.artW;
        const canvasW = BF_REF_W * k;
        const canvasH = BF_REF_H * k;

        // 形态（只在打完之后画）。种子 = 战场 id → 同一战场每局长得一样、各战场互不相同
        const morph = fought ? renderBattlefieldBoxHtml(BASE_ART_W, bf.id) : '';

        // 🔴 [2026-09-12 主人令「怎么战场还显示武将名字呢，删除，别乱加」]
        //    标牌**只留地名**。原先这里会在标牌下多渲染一行「剧情武将」名字（如伊苏斯 → 大流士三世），
        //    已整段删除（连同只服务它的 GENERAL_NAME_BY_ID 表）。
        //    该武将仍在剧本里正常出场：-333 伊苏斯之战的守方主帅就是 `defenderGeneralId: 'daliushi_iii'`。

        return `
            <div class="battlefield-container" style="
                position: relative;
                width: ${canvasW.toFixed(0)}px;
                height: ${canvasH.toFixed(0)}px;
                transform: scale(var(--battlefield-scale, 1));
                transform-origin: 50% 50%;
                pointer-events: auto;
                cursor: pointer;
            ">
                ${morph}
                <!-- 地名标牌（打完前**只有这个**） -->
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
                    ${bf.name}
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
