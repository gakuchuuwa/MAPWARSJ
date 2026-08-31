/**
 * FollowedGeneralPortraitHUD.ts - 屏幕左下角跟随武将常驻立绘卡片
 * 
 * 核心特性（2026-08-31 统一视觉基准）：
 * 1. 采用与 CombatUI（战略战斗面板 / ZOOM 13 战术面板）完全一致的尺寸、画幅、裁剪与坐标：
 *    - 宽度：COMBAT_UI_TOKENS.portraitSlotWidth (uiPx(380))
 *    - 框高：uiPx(620)
 *    - 裁剪高：uiPx(550)
 *    - 坐标：position: fixed; left: 0; bottom: 0;
 * 2. 战略地图跟拍、战略战斗、战术决战三大模式实现 100% 像素级无缝衔接与同等尺寸；
 * 3. 卡片右边缘附带精致的 ◀ / ▶ 缩放/收起箭头按钮，玩家可一键向左收起以腾出大地图视野。
 */

import { getGeneralRecordByGeneralId } from '../data/FactionGenerals';
import { resolvePortraitAssetPath, resolveGeneralPortraitPath } from '../config/portrait_defaults';
import { COMBAT_UI_TOKENS, uiPx } from '../config/combat-ui-tokens';

const T = COMBAT_UI_TOKENS;

export class FollowedGeneralPortraitHUD {
    private container: HTMLDivElement;
    private card: HTMLDivElement;
    private portraitClip: HTMLDivElement;
    private portraitImg: HTMLImageElement;
    private generalNameEl: HTMLDivElement;
    private eliteNameEl: HTMLDivElement;
    private factionBadgeEl: HTMLSpanElement;
    private troopsEl: HTMLSpanElement;
    private streakEl: HTMLSpanElement;
    private toggleBtn: HTMLButtonElement;

    private isCollapsed = false;
    private isVisible = false;
    private currentArmyId: string | null = null;

    constructor() {
        // 主外层容器（固定在屏幕左下角）
        this.container = document.createElement('div');
        this.container.id = 'followed-general-hud';
        this.container.style.cssText = `
            position: fixed;
            left: 0;
            bottom: 0;
            z-index: 850;
            pointer-events: none;
            display: none;
            transition: opacity 0.3s ease;
            font-family: 'Noto Serif SC', 'SimSun', serif;
        `;

        // 立绘卡片实体（尺寸与 CombatUI.leftPortraitFrame 严格一致）
        this.card = document.createElement('div');
        this.card.style.cssText = `
            position: relative;
            width: ${uiPx(T.portraitSlotWidth)};
            height: ${uiPx(620)};
            pointer-events: auto;
            transform-origin: left bottom;
            transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
            overflow: visible;
        `;

        // 立绘裁剪框（高度与四缘渐隐与 CombatUI.createPortraitClip 严格一致）
        const f = T.portraitEdgeFade;
        const horizontal = `linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) ${f}%, rgba(0,0,0,1) calc(100% - ${f}%), rgba(0,0,0,0) 100%)`;
        const vertical = `linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) ${f}%, rgba(0,0,0,1) calc(100% - ${f}%), rgba(0,0,0,0) 100%)`;
        const mask = `${horizontal}, ${vertical}`;

        this.portraitClip = document.createElement('div');
        this.portraitClip.style.cssText = `
            position: absolute;
            left: 0;
            bottom: 0;
            height: ${uiPx(550)};
            width: 100%;
            display: flex;
            align-items: flex-end;
            justify-content: flex-start;
            overflow: hidden;
            -webkit-mask-image: ${mask};
            mask-image: ${mask};
            -webkit-mask-composite: source-in;
            mask-composite: intersect;
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            filter: drop-shadow(0 20px 30px rgba(0,0,0,0.8));
            pointer-events: none;
        `;

        // 立绘本体图片
        const innerFade = Math.max(1.5, Math.min(4.5, T.portraitEdgeFade * 0.35));
        const innerHorizontal = `linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) ${innerFade}%, rgba(0,0,0,1) calc(100% - ${innerFade}%), rgba(0,0,0,0) 100%)`;
        const innerVertical = `linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) ${innerFade}%, rgba(0,0,0,1) calc(100% - ${innerFade}%), rgba(0,0,0,0) 100%)`;
        const innerMask = `${innerHorizontal}, ${innerVertical}`;

        this.portraitImg = document.createElement('img');
        this.portraitImg.style.cssText = `
            height: 100%;
            width: auto;
            display: block;
            pointer-events: auto;
            -webkit-mask-image: ${innerMask};
            mask-image: ${innerMask};
            -webkit-mask-composite: source-in;
            mask-composite: intersect;
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
        `;
        this.portraitClip.appendChild(this.portraitImg);
        this.card.appendChild(this.portraitClip);

        // 底部信息浮层面板（深色半透明古风渐变底）
        const infoPanel = document.createElement('div');
        infoPanel.style.cssText = `
            position: absolute;
            left: 12px;
            bottom: 14px;
            width: calc(100% - 24px);
            max-width: ${uiPx(340)};
            padding: 8px 14px;
            box-sizing: border-box;
            background: linear-gradient(135deg, rgba(20, 16, 12, 0.88) 0%, rgba(10, 8, 6, 0.94) 100%);
            border: 1px solid rgba(212, 175, 55, 0.45);
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,215,0,0.25);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            pointer-events: auto;
            z-index: 10;
        `;

        // 第一行：武将名 + 连胜徽章
        const row1 = document.createElement('div');
        row1.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 6px;
        `;

        this.generalNameEl = document.createElement('div');
        this.generalNameEl.style.cssText = `
            font-size: 16px;
            font-weight: 900;
            color: #ffdf73;
            letter-spacing: 0.5px;
            text-shadow: 0 1px 4px rgba(0,0,0,0.9);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;

        this.streakEl = document.createElement('span');
        this.streakEl.style.cssText = `
            font-size: 10px;
            font-weight: 800;
            color: #ff6a4d;
            background: rgba(156, 48, 47, 0.25);
            border: 1px solid rgba(255, 106, 77, 0.5);
            border-radius: 8px;
            padding: 1px 5px;
            white-space: nowrap;
            display: none;
        `;
        row1.appendChild(this.generalNameEl);
        row1.appendChild(this.streakEl);
        infoPanel.appendChild(row1);

        // 第二行：精锐番号
        this.eliteNameEl = document.createElement('div');
        this.eliteNameEl.style.cssText = `
            font-size: 13px;
            font-weight: bold;
            color: #ffffff;
            margin-top: 3px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-shadow: 0 1px 2px rgba(0,0,0,0.8);
        `;
        infoPanel.appendChild(this.eliteNameEl);

        // 第三行：势力 + 兵力
        const row3 = document.createElement('div');
        row3.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 5px;
            padding-top: 4px;
            border-top: 1px dashed rgba(212, 175, 55, 0.25);
            font-size: 12px;
        `;

        this.factionBadgeEl = document.createElement('span');
        this.factionBadgeEl.style.cssText = `
            color: #5bb381;
            font-weight: 800;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 120px;
        `;

        this.troopsEl = document.createElement('span');
        this.troopsEl.style.cssText = `
            color: #ffd700;
            font-weight: bold;
            font-family: 'JetBrains Mono', serif;
            letter-spacing: 0.5px;
        `;

        row3.appendChild(this.factionBadgeEl);
        row3.appendChild(this.troopsEl);
        infoPanel.appendChild(row3);

        this.card.appendChild(infoPanel);

        // 缩放/收起箭头按钮（挂载在立绘卡片右缘）
        this.toggleBtn = document.createElement('button');
        this.toggleBtn.innerHTML = '◀';
        this.toggleBtn.title = '收起跟随武将立绘';
        this.toggleBtn.style.cssText = `
            position: absolute;
            right: -24px;
            top: 48%;
            width: 24px;
            height: 48px;
            background: linear-gradient(180deg, rgba(38, 30, 22, 0.95) 0%, rgba(18, 14, 10, 0.98) 100%);
            border: 1px solid rgba(212, 175, 55, 0.6);
            border-left: none;
            border-radius: 0 8px 8px 0;
            color: #ffdf73;
            font-size: 13px;
            font-weight: bold;
            cursor: pointer;
            pointer-events: auto;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 3px 2px 10px rgba(0,0,0,0.5);
            transition: all 0.2s ease;
            outline: none;
            user-select: none;
            z-index: 20;
        `;

        this.toggleBtn.addEventListener('mouseenter', () => {
            this.toggleBtn.style.background = 'linear-gradient(180deg, rgba(58, 46, 34, 0.98) 0%, rgba(30, 24, 18, 0.98) 100%)';
            this.toggleBtn.style.borderColor = 'rgba(255, 215, 0, 0.9)';
            this.toggleBtn.style.color = '#fff';
        });
        this.toggleBtn.addEventListener('mouseleave', () => {
            this.toggleBtn.style.background = 'linear-gradient(180deg, rgba(38, 30, 22, 0.95) 0%, rgba(18, 14, 10, 0.98) 100%)';
            this.toggleBtn.style.borderColor = 'rgba(212, 175, 55, 0.6)';
            this.toggleBtn.style.color = '#ffdf73';
        });
        this.toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleCollapse();
        });

        this.card.appendChild(this.toggleBtn);
        this.container.appendChild(this.card);
        document.body.appendChild(this.container);
    }

    /** 切换收起 / 展开状态 */
    public toggleCollapse(): void {
        this.isCollapsed = !this.isCollapsed;
        if (this.isCollapsed) {
            // 向左滑出屏幕，留出箭头拉手
            this.card.style.transform = 'translateX(-100%)';
            this.toggleBtn.innerHTML = '▶';
            this.toggleBtn.title = '展开跟随武将立绘';
        } else {
            this.card.style.transform = 'translateX(0)';
            this.toggleBtn.innerHTML = '◀';
            this.toggleBtn.title = '收起跟随武将立绘';
        }
    }

    /** 刷新跟随武将信息 */
    public update(army: any, factionName?: string): void {
        if (!army || army.isDestroyed || (army.getTroops?.() ?? 0) <= 0) {
            this.hide();
            return;
        }

        this.currentArmyId = army.id;
        const factionId = army.getFactionId?.() ?? army.factionId ?? '';

        // 1. 解析立绘
        let portraitUrl: string | undefined;
        let generalName = '';

        if (army.generalId) {
            const generalRecord = getGeneralRecordByGeneralId(army.generalId);
            if (generalRecord) {
                generalName = generalRecord.generalName;
                if (generalRecord.portrait) {
                    portraitUrl = resolveGeneralPortraitPath(generalRecord.portrait, { factionId });
                }
            }
        }
        if (!portraitUrl && army.portraitPath) {
            portraitUrl = resolvePortraitAssetPath(army.portraitPath, { factionId });
        }

        if (portraitUrl && this.portraitImg.src !== portraitUrl) {
            this.portraitImg.src = portraitUrl;
        }

        // 2. 武将名与番号
        this.generalNameEl.textContent = generalName || army.name || '跟随将领';
        this.eliteNameEl.textContent = army.name || generalName || '主力军团';

        // 3. 势力标签与兵力
        this.factionBadgeEl.textContent = factionName || factionId || '势力';
        const troops = Math.floor(army.getTroops?.() ?? 0);
        this.troopsEl.textContent = troops >= 10000 ? `${(troops / 10000).toFixed(1)}万` : `${troops}`;

        // 4. 连胜徽章
        const winStreak = (army as any).winStreak || 0;
        if (winStreak > 0) {
            this.streakEl.textContent = `🔥 ${winStreak}连胜`;
            this.streakEl.style.display = 'inline-block';
        } else {
            this.streakEl.style.display = 'none';
        }

        this.show();
    }

    public show(): void {
        this.isVisible = true;
        this.container.style.display = 'block';
        this.container.style.opacity = '1';
    }

    public hide(): void {
        this.isVisible = false;
        this.currentArmyId = null;
        this.container.style.opacity = '0';
        this.container.style.display = 'none';
    }

    public isFollowVisible(): boolean {
        return this.isVisible;
    }

    public destroy(): void {
        this.container.remove();
    }
}
