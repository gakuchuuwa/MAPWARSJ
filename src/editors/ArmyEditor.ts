/**
 * ArmyEditor — 军队预览编辑器
 *
 * [2026-05-30 立] 让用户在地图中央预览不同文化/势力/阵型的军队
 * 可切换动作: 待机/移动/攻击/受伤/阵亡
 *
 * 用法:
 *   1. 地图右上 ♟️ 军队编辑 复选框开启
 *   2. 浮动面板出现, 选 文化/势力, 调阵型
 *   3. 点 🎯 召唤 → 军队出现在地图中央
 *   4. 点动作按钮 → 看动画
 */

import L from 'leaflet';
import { FACTIONS } from '../data/factions';
import { CITIES_V2 as CITIES } from '../data/cities_v2';
import { REGION_LABELS, REGION_ORDER, RegionType, getCityRegion } from '../systems/RegionSystem';
import {
    applyCultureFormationPatch,
    convertSlotsToMode,
    CULTURE_TIERS_MAP,
    FormationMode,
    getCultureFormationMode,
    getDefaultSlotsForMode,
    inferFormationModeFromSlots,
} from '../types/CultureFormations';
import { getGlobalUnitRenderer } from '../map/UnitRenderer';
import { LegionPhalanxDrawer } from '../map/legion/LegionPhalanxDrawer';
import { LegionType } from '../types/UnitTypes';
import { IAnimatedUnit } from '../map/GlobalUnitRenderer';
import { expandCompositionSlots, expandCompositionScales, getEffectiveSlotScale } from '../types/LegionComposition';

/**
 * 14 文化 → 默认势力 ID 映射
 * 每文化的代表 = 该文化中心据点所属势力
 * 用户 2026-05-30 拍板
 */
const DEFAULT_FACTIONS_BY_CULTURE: Record<RegionType, string> = {
    CENTRAL:      'tang',      // 中原-长安 → 唐
    NORTH:        'yan',       // 北方-北京 → 燕
    JIANGNAN:     'ming_d',    // 南方-南京 → 大明
    LINGNAN:      'yue',       // 岭南-番禺 → 越
    BASHU:        'shu',       // 川蜀-成都 → 蜀
    DIANQIAN:     'dali',      // 滇缅-大理(羊苴咩城) → 大理
    HEXI:         'liangzhou',     // 河西-武威(姑臧) → 凉州
    WESTERN:      'qiuci',     // 西域-龟兹(伊逻卢城) → 龟兹
    TIBET:        'tubo',      // 青藏-拉萨(逻些) → 吐蕃
    STEPPE:       'menggu_d',  // 草原-哈拉和林 → 蒙古
    NORTHEAST:    'bohai',     // 东北-龙源(龙泉府) → 渤海
    KOREA:        'xinluo',    // 朝鲜-庆州(金城) → 新罗
    JAPAN:        'ashikaga',  // 室町-京都 → 足利
    CENTRAL_ASIA: 'seljuq',    // 中亚-木鹿(梅尔夫) → 塞尔柱
    WEST_ASIA:    'baizanting', // 西亚-君士坦丁堡 → 拜占庭
    SLAVIC:       'mosike_gongguo', // 斯拉夫-莫斯科 → 莫斯科公国（2026-08-27 基辅迁东欧改）
    GERMANIC:     'falanji',     // 日耳曼-巴黎 → 法兰克
    LATIN:        'luoma_diguo', // 拉丁-罗马 → 罗马帝国
    INDIA:        'kongque',     // 印度-华氏城 → 孔雀帝国
    BERBER:       'mulabite',    // 柏柏尔-马拉喀什 → 穆拉比特
    AMERICA:      'aztec',       // 美洲 → 阿兹特克（待建势力对齐）
    AFRICA:       'mali',        // 非洲 → 马里（待建势力对齐）
    MALAY:        'malacca',     // 马来 → 满剌加（待建势力对齐）
    ANDE:         'inca',        // 安第斯 → 印加（待建势力对齐）
    PURU:         'zhuluo',      // 南印度 → 朱罗（待建势力对齐）
    ORIE:         'womaya',      // 阿拉伯 → 倭马亚（待建势力对齐）
    EAST:         'luosi',       // 东欧 → 罗斯（基辅罗斯）
    GREEK:        'xila',        // 希腊 → 希腊（雅典）
    THRACIAN:     'baojialiya',  // 色雷斯 → 保加利亚
    PERSIAN:      'aqimeinide',  // 波斯 → 阿契美尼德（波斯波利斯）
    CUMAN:        'qincha',      // 库曼 → 钦察（萨拉托夫）
    BRITONS: 'falanji',  // 不列颠 → 待建势力对齐（暂用父文化势力占位）
    GOTHS: 'falanji',  // 哥特 → 待建势力对齐（暂用父文化势力占位）
    HUNS: 'menggu_d',  // 匈人 → 待建势力对齐（暂用父文化势力占位）
    TEUTONS: 'falanji',  // 条顿 → 待建势力对齐（暂用父文化势力占位）
    VIKINGS: 'mosike_gongguo',  // 维京 → 待建势力对齐（暂用父文化势力占位）
    CELTS: 'falanji',  // 凯尔特 → 待建势力对齐（暂用父文化势力占位）
    ITALIANS: 'luoma_diguo',  // 意大利 → 待建势力对齐（暂用父文化势力占位）
    SICILIANS: 'luoma_diguo',  // 西西里 → 待建势力对齐（暂用父文化势力占位）
    BULGARIANS: 'mosike_gongguo',  // 保加利亚 → 待建势力对齐（暂用父文化势力占位）
    MAGYAR: 'menggu_d',  // 马扎尔 → 待建势力对齐（暂用父文化势力占位）
    LITHUANIANS: 'mosike_gongguo',  // 立陶宛 → 待建势力对齐（暂用父文化势力占位）
    POLES: 'mosike_gongguo',  // 波兰 → 待建势力对齐（暂用父文化势力占位）
    BOHEMIANS: 'mosike_gongguo',  // 波希米亚 → 待建势力对齐（暂用父文化势力占位）
    BURGUNDIANS: 'luoma_diguo',  // 勃艮第 → 待建势力对齐（暂用父文化势力占位）
    SPANISH: 'luoma_diguo',  // 西班牙 → 待建势力对齐（暂用父文化势力占位）
    PORTUGUESE: 'luoma_diguo',  // 葡萄牙 → 待建势力对齐（暂用父文化势力占位）
    ETHIOPIANS: 'mali',  // 埃塞俄比亚 → 待建势力对齐（暂用父文化势力占位）
    BENGALIS: 'kongque',  // 孟加拉 → 待建势力对齐（暂用父文化势力占位）
    GURJARAS: 'kongque',  // 瞿折罗 → 待建势力对齐（暂用父文化势力占位）
    PORUS: 'zhuluo',  // 补噜 → 待建势力对齐（暂用父文化势力占位）
    VIETNAMESE: 'dali',  // 越南 → 待建势力对齐（暂用父文化势力占位）
    KHMER: 'dali',  // 高棉 → 待建势力对齐（暂用父文化势力占位）
    MAYANS: 'aztec',  // 玛雅 → 待建势力对齐（暂用父文化势力占位）
    MAPUCHE: 'inca',  // 马普切 → 待建势力对齐（暂用父文化势力占位）
    MUISCA: 'inca',  // 穆伊斯卡 → 待建势力对齐（暂用父文化势力占位）
    TUPI: 'inca',  // 图皮 → 待建势力对齐（暂用父文化势力占位）
    ARMENIANS: 'seljuq',  // 亚美尼亚 → 待建势力对齐（暂用父文化势力占位）
    GEORGIANS: 'seljuq',  // 格鲁吉亚 → 待建势力对齐（暂用父文化势力占位）
    ATHENIANS: 'xila',  // 雅典 → 待建势力对齐（暂用父文化势力占位）
    SPARTANS: 'xila',  // 斯巴达 → 待建势力对齐（暂用父文化势力占位）
    MACEDONIANS: 'xila',  // 马其顿 → 待建势力对齐（暂用父文化势力占位）
    ACHAEMENIDS: 'aqimeinide',  // 阿契美尼德 → 待建势力对齐（暂用父文化势力占位）

};

/** 15 兵种 (跟 UnitAssets.ts / CultureFormations 一致) */
const UNIT_TYPES: { id: string; label: string; category: '步' | '骑' | '远' | '船' }[] = [
    // 步兵类
    { id: 'light_infantry', label: '轻步兵',     category: '步' },
    { id: 'heavy_infantry', label: '重步兵',     category: '步' },
    { id: 'shield',         label: '盾牌兵',     category: '步' },
    { id: 'spear',          label: '长枪兵',     category: '步' },
    { id: 'armored',        label: '藤甲兵',     category: '步' },
    { id: 'axe',            label: '斧头兵',     category: '步' },
    // 骑兵类
    { id: 'lancer',           label: '轻骑兵',   category: '骑' },
    { id: 'heavy_cavalry',    label: '斧骑兵',   category: '骑' },
    { id: 'general_cavalry',  label: '刀骑兵★', category: '骑' },
    { id: 'horse_archer',     label: '弓骑兵',   category: '骑' },
    { id: 'elephant',         label: '象兵',     category: '骑' },
    // 远程类
    { id: 'archer',         label: '弓兵',       category: '远' },
    { id: 'crossbow',       label: '弩兵',       category: '远' },
    { id: 'ballista',       label: '床弩兵',     category: '远' },
    // 船只类
    { id: 'ship_small',     label: '小船',       category: '船' },
    { id: 'ship_medium',    label: '中船',       category: '船' },
    { id: 'ship_large',     label: '大船',       category: '船' },
];

export class ArmyEditor {
    private map: L.Map;
    private panel: HTMLDivElement | null = null;
    private visible: boolean = false;

    // 当前选中
    private currentCulture: RegionType = 'CENTRAL';
    private currentFactionId: string = 'tang';
    private currentTroops: number = 5000;
    private simulateNaval: boolean = false;
    // 当前 slot 配置 (3×3 = 5 slots, 三角 = 3 slots)
    private currentSlots: { type: string; count: number; scale?: number }[] = [];
    private currentFormationMode: FormationMode = 'square';

    // 已召唤的预览单位
    private previewUnit: IAnimatedUnit | null = null;
    // 动画 interval (移动/受伤 需要持续触发)
    private moveInterval: number | null = null;
    private damageInterval: number | null = null;
    private spawnLat: number = 0;
    private spawnLng: number = 0;
    private currentLat: number = 0;
    private currentLng: number = 0;
    private lastFrameTime: number = 0;
    // 黑色背景圆 (Leaflet circle)
    private backgroundCircle: L.Circle | null = null;
    // 召唤时被隐藏的图层 (用于恢复)
    private hiddenPanes: string[] = [];

    constructor(map: L.Map) {
        this.map = map;
        this.loadCultureDefault('CENTRAL');
        this.currentFactionId = DEFAULT_FACTIONS_BY_CULTURE['CENTRAL']; // tang
    }

    public toggle(visible: boolean): void {
        this.visible = visible;
        if (visible) this.show();
        else this.hide();
    }

    private show(): void {
        if (this.panel) return;
        this.panel = this.buildPanel();
        document.body.appendChild(this.panel);
    }

    private hide(): void {
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
        }
        this.clearPreview();
    }

    /** 按文化加载默认 tier 到 currentSlots */
    private loadCultureDefault(culture: RegionType): void {
        this.currentCulture = culture;

        const draftKey = `army_editor_cache_${culture}`;
        const draft = localStorage.getItem(draftKey);
        if (draft) {
            try {
                const parsed = JSON.parse(draft);
                if (Array.isArray(parsed)) {
                    this.currentSlots = parsed;
                    this.currentFormationMode = inferFormationModeFromSlots(parsed);
                } else {
                    this.currentSlots = parsed.slots ?? getDefaultSlotsForMode('square');
                    this.currentFormationMode = parsed.formationMode
                        ?? inferFormationModeFromSlots(this.currentSlots);
                }
                return;
            } catch (e) {
                console.warn('Failed to parse draft, falling back to default', e);
            }
        }

        this.currentFormationMode = getCultureFormationMode(culture);
        const tiers = CULTURE_TIERS_MAP[culture];
        if (tiers && tiers.length > 0) {
            this.currentSlots = tiers[0].slots.map(s => ({ ...s }));
        } else {
            this.currentSlots = getDefaultSlotsForMode(this.currentFormationMode);
        }
    }

    private buildPanel(): HTMLDivElement {
        const panel = document.createElement('div');
        panel.id = 'army-editor-panel';
        panel.style.cssText = `
            position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
            background: rgba(30,30,40,0.97); color: #e0e0e0;
            padding: 20px 28px; border-radius: 14px;
            border: 2px solid rgba(255,215,0,0.5);
            box-shadow: 0 8px 32px rgba(0,0,0,0.7);
            font-family: 'Microsoft YaHei', sans-serif;
            font-size: 14px; z-index: 10000;
            width: 700px; max-width: 95vw;
            box-sizing: border-box;
            display: flex; flex-direction: column; gap: 12px;
        `;

        // === 标题 + 关闭 ===
        const title = document.createElement('div');
        title.style.cssText = 'display:flex; justify-content:space-between; align-items:center;';
        title.innerHTML = `
            <div style="color:#ffd700; font-weight:bold; font-size:18px;">⚔ 军队预览编辑器</div>
            <button id="ae-close" style="background:rgba(255,255,255,0.1); color:#fff; border:none; padding:6px 14px; border-radius:6px; cursor:pointer;">✕</button>
        `;
        panel.appendChild(title);

        // === Row 1: 文化 / 势力 / 兵力 ===
        const row1 = document.createElement('div');
        row1.style.cssText = 'display:flex; gap:12px; align-items:center; flex-wrap:wrap;';
        row1.innerHTML = `
            <label style="display:flex;align-items:center;gap:6px;">
                文化: <select id="ae-culture" style="background:#2a2a3a;color:#ffd700;border:1px solid #555;border-radius:6px;padding:6px 10px;font-size:14px;font-weight:bold;">
                    ${REGION_ORDER.map(r => `<option value="${r}"${r==='CENTRAL'?' selected':''}>${REGION_LABELS[r]} (${r})</option>`).join('')}
                </select>
            </label>
            <label style="display:flex;align-items:center;gap:6px;">
                势力: <select id="ae-faction" style="background:#2a2a3a;color:#ffd700;border:1px solid #555;border-radius:6px;padding:6px 10px;font-size:14px;font-weight:bold;width:180px;">
                    ${this.getFactionOptions()}
                </select>
            </label>
            <label style="display:flex;align-items:center;gap:6px;">
                兵力: <input id="ae-troops" type="number" value="${this.currentTroops}" min="100" max="100000" step="500"
                       style="background:#2a2a3a;color:#fff;border:1px solid #555;border-radius:6px;padding:6px 10px;width:90px;font-size:14px;">
            </label>
            <label style="display:flex;align-items:center;gap:6px;color:#64b5f6;">
                <input type="checkbox" id="ae-simulate-naval" ${this.simulateNaval ? 'checked' : ''}>
                模拟海上
            </label>
        `;
        panel.appendChild(row1);

        // === Row 2: 阵型类型 + 兵种格子 ===
        const row2 = document.createElement('div');
        row2.id = 'ae-formation-area';
        row2.style.cssText = 'background:rgba(0,0,0,0.3); padding:12px 16px; border-radius:8px;';
        panel.appendChild(row2);
        this.renderFormationArea(row2);

        // === Row 3: 动作按钮 ===
        const row3 = document.createElement('div');
        row3.style.cssText = 'display:flex; gap:8px; flex-wrap:wrap; align-items:center;';
        row3.innerHTML = `
            <span style="color:#aaa;font-size:13px;padding-right:6px;">动作:</span>
            <button class="ae-action" data-action="idle"   style="${this.btnStyle('#607d8b')}">🧍 待机</button>
            <button class="ae-action" data-action="move"   style="${this.btnStyle('#1976d2')}">🚶 移动</button>
            <button class="ae-action" data-action="attack" style="${this.btnStyle('#e53935')}">⚔ 攻击</button>
            <button class="ae-action" data-action="damage" style="${this.btnStyle('#f57c00')}">💥 受伤</button>
            <button class="ae-action" data-action="death"  style="${this.btnStyle('#212121')}">💀 阵亡</button>
        `;
        panel.appendChild(row3);

        // === Row 4: 召唤 / 清除 / 保存 ===
        const row4 = document.createElement('div');
        row4.style.cssText = 'display:flex; gap:10px; padding-top:6px; border-top:1px solid rgba(255,215,0,0.2);';
        row4.innerHTML = `
            <button id="ae-spawn"  style="${this.btnStyle('#4caf50')}; flex:1;">🎯 在地图中央 召唤军队</button>
            <button id="ae-save"   style="${this.btnStyle('#8e24aa')}">💾 保存阵型到源码</button>
            <button id="ae-clear"  style="${this.btnStyle('#e53935')}">🗑️ 丢弃当前草稿</button>
        `;
        panel.appendChild(row4);

        // 提示
        const tip = document.createElement('div');
        tip.style.cssText = 'color:#aaa; font-size:11px; line-height:1.5;';
        tip.innerHTML =
            '💡 可选阵型（3×3 / 三角）与兵种，调好后点「💾 保存阵型到源码」才会进游戏；仅召唤预览会存浏览器草稿。<br>' +
            '游戏中军队按<strong>所在地图文化区</strong>取阵型（与下拉「文化」一致才相同），旗号按军团所属势力。';
        panel.appendChild(tip);

        // 事件绑定
        setTimeout(() => this.bindEvents(), 50);

        return panel;
    }

    private btnStyle(bg: string): string {
        return `background:${bg};color:white;border:none;border-radius:8px;padding:8px 14px;font-size:14px;font-weight:bold;cursor:pointer;flex-shrink:0;`;
    }

    private getFactionOptions(): string {
        // [2026-05-30] 仅列 14 默认势力 (每文化中心据点所属)
        // 按 14 区 顺序排列, 旗号 + 势力名 + ID 都显示
        const opts: string[] = [];
        for (const r of REGION_ORDER) {
            const fid = DEFAULT_FACTIONS_BY_CULTURE[r];
            if (!fid) continue;
            const f = FACTIONS.find(x => x.id === fid);
            const label = f
                ? `${REGION_LABELS[r]} → ${f.name} (${fid})`
                : `${REGION_LABELS[r]} → ${fid}`;
            opts.push(`<option value="${fid}"${fid===this.currentFactionId?' selected':''}>${label}</option>`);
        }
        return opts.join('');
    }

    /** 渲染阵型选择器 + 兵种格子 */
    private renderFormationArea(container: HTMLDivElement): void {
        container.innerHTML = '';

        const modeRow = document.createElement('div');
        modeRow.style.cssText = 'display:flex; align-items:center; gap:10px; margin-bottom:10px; flex-wrap:wrap;';
        modeRow.innerHTML = `
            <label style="display:flex;align-items:center;gap:6px;color:#ffd700;font-weight:bold;">
                阵型:
                <select id="ae-formation-mode" style="background:#2a2a3a;color:#ffd700;border:1px solid #555;border-radius:6px;padding:6px 10px;font-size:14px;font-weight:bold;">
                    <option value="fish_scale"${this.currentFormationMode === 'fish_scale' ? ' selected' : ''}>3+4+2 鱼鳞 (9人)</option>
                    <option value="triangle"${this.currentFormationMode === 'triangle' ? ' selected' : ''}>2+3+4 三角 (9人)</option>
                    <option value="echelon"${this.currentFormationMode === 'echelon' ? ' selected' : ''}>4+3+2 雁行 (9人)</option>
                    <option value="crane_wing"${this.currentFormationMode === 'crane_wing' ? ' selected' : ''}>2+4+3 鹤翼 (9人)</option>
                    <option value="square"${this.currentFormationMode === 'square' ? ' selected' : ''}>3+3+3 方阵 (9人)</option>
                </select>
            </label>
            <span style="color:#aaa;font-size:12px;">每格下拉可选 15 兵种</span>
        `;
        container.appendChild(modeRow);

        const gridWrap = document.createElement('div');
        gridWrap.id = 'ae-formation-grid';
        container.appendChild(gridWrap);
        this.renderFormationGrid(gridWrap);
    }

    /** 渲染阵型兵种格子 (三排 9人) */
    private renderFormationGrid(container: HTMLDivElement): void {
        const mode = this.currentFormationMode;
        container.innerHTML = '';

        const grid = document.createElement('div');

        const counts = mode === 'triangle' ? [2, 3, 4]
            : mode === 'echelon' ? [4, 3, 2]
            : mode === 'fish_scale' ? [3, 4, 2]
            : mode === 'crane_wing' ? [2, 4, 3]
            : [3, 3, 3];
        const labels = mode === 'triangle' ? ['尖刀', '中坚', '后']
            : mode === 'echelon' ? ['宽阵', '中坚', '后']
            : mode === 'fish_scale' ? ['前抵', '鳞叠', '尾收']
            : mode === 'crane_wing' ? ['双锋', '鹤翼', '中军']
            : ['前排', '中坚', '后排'];

        // 兼容旧草稿（slot 数不足或 count 分布不符）→ 按阵型重建
        if (this.currentSlots.length < 3 || this.currentSlots.map(s => s.count).join(',') !== counts.join(',')) {
            const baseType = this.currentSlots[0]?.type || (mode === 'triangle' ? 'horse_archer' : 'shield');
            this.currentSlots = counts.map(c => ({ type: baseType, count: c }));
        }
        grid.style.cssText = 'display:flex; flex-direction:column; gap:8px;';

        const scaleHtml = (val: number, dataSlots: string) => `
            <div style="display:flex;align-items:center;font-size:12px;color:#fff;justify-content:center;width:70px;">
                比例:<input type="number" step="0.1" value="${val}" class="ae-scale" data-slots="${dataSlots}" style="background:#222;color:#fff;border:1px solid #444;border-radius:4px;padding:4px;width:44px;margin-left:4px;text-align:center;">
            </div>
        `;

        grid.innerHTML = counts.map((_, i) => {
            const slot = this.currentSlots[i];
            const fallbackType = mode === 'triangle' ? 'horse_archer' : 'shield';
            const cells = Array.from({ length: counts[i] }, () => this.cellHtml(i, slot?.type || fallbackType)).join('');
            return `
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="color:#aaa;font-size:11px;width:36px;text-align:right;">${labels[i]}</span>
                    <div style="display:flex;gap:6px;flex:1;justify-content:center;">${cells}</div>
                    ${scaleHtml(slot ? getEffectiveSlotScale(slot) : 1.0, String(i))}
                </div>
            `;
        }).join('');

        container.appendChild(grid);
    }

    private cellHtml(slotIdx: number, unitType: string, locked: boolean = false): string {
        const unit = UNIT_TYPES.find(u => u.id === unitType);
        const label = unit?.label || unitType;
        const bg = locked ? '#7B1FA2' : '#3949ab';
        
        let html = `<div style="display:flex;flex-direction:column;gap:4px;">`;
        if (locked) {
            html += `<div style="background:${bg};color:white;border-radius:6px;padding:8px 4px;text-align:center;font-size:12px;font-weight:bold;cursor:not-allowed;opacity:0.85;" title="刀骑兵 (中心固定)">${label}</div>`;
        } else {
            html += `<select class="ae-slot" data-slot="${slotIdx}" style="background:${bg};color:white;border:none;border-radius:6px;padding:8px 4px;text-align:center;font-size:12px;font-weight:bold;cursor:pointer;width:100%;">
                ${UNIT_TYPES.map(u => `<option value="${u.id}"${u.id===unitType?' selected':''}>${u.label}</option>`).join('')}
            </select>`;
        }
        html += `</div>`;
        
        return html;
    }

    private bindEvents(): void {
        if (!this.panel) return;

        const closeBtn = this.panel.querySelector('#ae-close') as HTMLButtonElement;
        if (closeBtn) closeBtn.onclick = () => this.toggle(false);

        const cultureSel = this.panel.querySelector('#ae-culture') as HTMLSelectElement;
        if (cultureSel) cultureSel.onchange = () => {
            const newCulture = cultureSel.value as RegionType;
            this.loadCultureDefault(newCulture);
            // [2026-05-30] 文化切换时, 势力自动跳到该文化的默认势力
            const defaultFid = DEFAULT_FACTIONS_BY_CULTURE[newCulture];
            if (defaultFid) {
                this.currentFactionId = defaultFid;
                const factionSel = this.panel!.querySelector('#ae-faction') as HTMLSelectElement;
                if (factionSel) factionSel.value = defaultFid;
            }
            const area = this.panel!.querySelector('#ae-formation-area') as HTMLDivElement;
            if (area) this.renderFormationArea(area);
            this.bindFormationModeEvent();
            this.bindSlotEvents();
        };

        const factionSel = this.panel.querySelector('#ae-faction') as HTMLSelectElement;
        if (factionSel) factionSel.onchange = () => {
            this.currentFactionId = factionSel.value;
        };

        const troopsInp = this.panel.querySelector('#ae-troops') as HTMLInputElement;
        if (troopsInp) troopsInp.onchange = () => {
            this.currentTroops = parseInt(troopsInp.value) || 5000;
            this.updatePreviewInstant();
        };

        const navalChk = this.panel.querySelector('#ae-simulate-naval') as HTMLInputElement;
        if (navalChk) navalChk.onchange = () => {
            this.simulateNaval = navalChk.checked;
            this.updatePreviewInstant();
        };

        this.bindFormationModeEvent();
        this.bindSlotEvents();

        // 动作按钮
        this.panel.querySelectorAll('.ae-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = (e.currentTarget as HTMLElement).dataset.action!;
                this.applyAction(action);
            });
        });

        // 召唤 + 保存 + 清除
        const spawnBtn = this.panel.querySelector('#ae-spawn') as HTMLButtonElement;
        if (spawnBtn) spawnBtn.onclick = () => this.spawnArmy();

        const saveBtn = this.panel.querySelector('#ae-save') as HTMLButtonElement;
        if (saveBtn) saveBtn.onclick = () => this.saveCultureFormations();

        const clearBtn = this.panel.querySelector('#ae-clear') as HTMLButtonElement;
        if (clearBtn) clearBtn.onclick = () => {
            if (confirm(`确定要丢弃 [${REGION_LABELS[this.currentCulture]}] 的所有未保存修改吗？`)) {
                localStorage.removeItem(`army_editor_cache_${this.currentCulture}`);
                this.loadCultureDefault(this.currentCulture);
                this.renderFormationArea(this.panel!.querySelector('#ae-formation-area') as HTMLDivElement);
                this.bindFormationModeEvent();
                this.bindSlotEvents();
                this.updatePreviewInstant();
            }
        };
    }

    private bindFormationModeEvent(): void {
        if (!this.panel) return;
        const modeSel = this.panel.querySelector('#ae-formation-mode') as HTMLSelectElement;
        if (!modeSel) return;
        modeSel.onchange = () => {
            const newMode = modeSel.value as FormationMode;
            if (newMode === this.currentFormationMode) return;
            this.currentFormationMode = newMode;
            this.currentSlots = convertSlotsToMode(this.currentSlots, newMode);
            const area = this.panel!.querySelector('#ae-formation-area') as HTMLDivElement;
            if (area) this.renderFormationArea(area);
            this.bindFormationModeEvent();
            this.bindSlotEvents();
            this.updatePreviewInstant();
        };
    }

    private bindSlotEvents(): void {
        if (!this.panel) return;
        // 3×3 格子改动
        this.panel.querySelectorAll('.ae-slot').forEach(sel => {
            sel.addEventListener('change', (e) => {
                const slotIdx = parseInt((e.currentTarget as HTMLElement).dataset.slot!);
                const newUnit = (e.currentTarget as HTMLSelectElement).value;
                if (this.currentSlots[slotIdx]) {
                    this.currentSlots[slotIdx].type = newUnit;
                    delete this.currentSlots[slotIdx].scale;
                }
                // 选船型 → 自动开启海上模式
                if (newUnit.startsWith('ship_')) {
                    this.simulateNaval = true;
                    const chk = this.panel!.querySelector('#ae-simulate-naval') as HTMLInputElement;
                    if (chk) chk.checked = true;
                }
                // 重新渲染该行 (因为前3/后3 是同一 slot 显示 3 次)
                const area = this.panel!.querySelector('#ae-formation-area') as HTMLDivElement;
                if (area) this.renderFormationArea(area);
                this.bindFormationModeEvent();
                this.bindSlotEvents();
                this.updatePreviewInstant();
            });
        });
        
        // 比例改动
        this.panel.querySelectorAll('.ae-scale').forEach(inp => {
            inp.addEventListener('change', (e) => {
                const target = e.currentTarget as HTMLInputElement;
                let slotIndices: number[] = [];
                if (target.dataset.slots) {
                    slotIndices = target.dataset.slots.split(',').map(Number);
                } else if (target.dataset.slot) { // Fallback just in case
                    slotIndices = [parseInt(target.dataset.slot)];
                }
                const newScale = parseFloat(target.value) || 1.0;
                for (const slotIdx of slotIndices) {
                    if (this.currentSlots[slotIdx]) {
                        this.currentSlots[slotIdx].scale = newScale;
                    }
                }
                this.updatePreviewInstant();
            });
        });
    }

    /** 从当前阵型槽位中检测船型（返回第一个匹配的 ship_* id） */
    private detectShipTier(): string | null {
        for (const slot of this.currentSlots) {
            if (slot.type.startsWith('ship_')) return slot.type;
        }
        return null;
    }

    /** 实时更新预览单位的兵种和缩放比例 (无缝生效) */
    private updatePreviewInstant(): void {
        // [NEW] 临时保存草稿到 localStorage
        const draftKey = `army_editor_cache_${this.currentCulture}`;
        localStorage.setItem(draftKey, JSON.stringify({
            formationMode: this.currentFormationMode,
            slots: this.currentSlots,
        }));

        if (this.previewUnit) {
            this.previewUnit.cultureSlots = expandCompositionSlots(this.currentSlots as any);
            this.previewUnit.cultureScales = expandCompositionScales(this.currentSlots as any);
            this.previewUnit.forceNavalVisual = this.simulateNaval;
            this.previewUnit.isOnSea = this.simulateNaval;
            this.previewUnit.navalShipTierLock = this.simulateNaval ? (this.detectShipTier() as any) ?? null : null;
        }
    }

    /** 提交保存到后端 */
    private async saveCultureFormations(): Promise<void> {
        try {
            const res = await fetch('/api/save-culture-formations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    culture: this.currentCulture,
                    formationMode: this.currentFormationMode,
                    slots: this.currentSlots
                })
            });
            const data = await res.json();
            if (data.ok) {
                const draftKey = `army_editor_cache_${this.currentCulture}`;
                localStorage.removeItem(draftKey);
                applyCultureFormationPatch(this.currentCulture, this.currentSlots, this.currentFormationMode);
                const game = (window as any).game;
                game?.legionManager?.refreshCultureFormations();
                alert(
                    `✅ [${REGION_LABELS[this.currentCulture]}] 已写入 CultureFormations.ts，并同步到场上军队。\n` +
                    `（需 npm run dev；生产构建不含保存接口）`
                );
            } else {
                alert(`❌ 保存失败: ${data.error}`);
            }
        } catch (e: any) {
            alert(`❌ 请求失败: ${e.message}`);
        }
    }

    /** 在地图中央召唤军队 (含黑色背景) */
    private spawnArmy(): void {
        this.clearPreview();

        const renderer = getGlobalUnitRenderer();
        if (!renderer) {
            alert('GlobalUnitRenderer 未初始化');
            return;
        }

        // 地图中心（略偏上，不挡面板）
        const center = this.map.getCenter();
        const offsetLat = 0.3; // 向北偏移 ~33km，军团和黑圈一起移
        this.spawnLat = center.lat + offsetLat;
        this.spawnLng = center.lng;
        this.currentLat = center.lat + offsetLat;
        this.currentLng = center.lng;

        // [2026-05-30] 加黑色圆背景 — 凸显军队
        this.backgroundCircle = L.circle([center.lat + offsetLat, center.lng], {
            radius: 80000, // 80km 半径
            color: 'transparent',
            fillColor: '#000000',
            fillOpacity: 1,
            interactive: false,
            pane: 'overlayPane',
        }).addTo(this.map);

        // [2026-05-30] 隐藏据点/标签层 — 只显示军队
        this.hideCityLayers();

        const legionType = this.currentFormationMode === 'triangle' ? 'cavalry' : 'mixed';

        // getPosition 用闭包返回 currentLat/Lng (实例字段, 可被 interval 改)
        const self = this;
        const unit: IAnimatedUnit = {
            id: `army_editor_preview_${Date.now()}`,
            name: `${REGION_LABELS[this.currentCulture]} 预览`,
            getTroops: () => this.currentTroops,
            getPosition: () => ({ lat: self.currentLat, lng: self.currentLng }),
            isDestroyed: false,
            isAttacking: false,
            isMoving: false,
            currentBattleType: null,
            targetPos: null,
            lastPosition: { lat: this.spawnLat, lng: this.spawnLng },
            type: 'legion',
            legionType,
            factionId: this.currentFactionId,
            lastDirection: 0, // S
            visible: true,
            cultureSlots: expandCompositionSlots(this.currentSlots as any),
            cultureScales: expandCompositionScales(this.currentSlots as any),
            isOnSea: this.simulateNaval,
            forceNavalVisual: this.simulateNaval,
            navalShipTierLock: this.simulateNaval ? (this.detectShipTier() as any) ?? null : null,
            previewScale: 2.5,
        };

        renderer.register(unit);
        this.previewUnit = unit;

        console.log(`⚔ [ArmyEditor] Spawned: ${unit.name} (faction=${this.currentFactionId}, type=${legionType}) @ ${this.spawnLat.toFixed(3)}, ${this.spawnLng.toFixed(3)}`);
    }

    /** 动作切换 (每次都先清理上次的 interval) */
    private applyAction(action: string): void {
        if (!this.previewUnit) {
            alert('请先点 🎯 召唤军队');
            return;
        }
        const u = this.previewUnit;
        this.clearAnimIntervals(); // 清上次动画 interval

        // [2026-05-30] 所有动作都重置战斗状态, 防止上次的"在打架"惯性
        u.currentBattleType = null;
        u.targetPos = null;
        // 重置 phalanx slot 状态 (清掉 deathDirection 等缓存, 让随机重新生成)
        if (u.id) LegionPhalanxDrawer.resetUnit(u.id);

        // 每次点击动作都随机选取一个朝向 (0-7)，方便全方位预览
        const randomDir = Math.floor(Math.random() * 8);
        u.lastDirection = randomDir;

        // 0=NE, 1=E, 2=SE, 3=S, 4=SW, 5=W, 6=NW, 7=N
        const dirVectors = [
            { lat: 1, lng: 1 },   // 0: NE
            { lat: 0, lng: 1 },   // 1: E
            { lat: -1, lng: 1 },  // 2: SE
            { lat: -1, lng: 0 },  // 3: S
            { lat: -1, lng: -1 }, // 4: SW
            { lat: 0, lng: -1 },  // 5: W
            { lat: 1, lng: -1 },  // 6: NW
            { lat: 1, lng: 0 },   // 7: N
        ];
        const vec = dirVectors[randomDir];

        switch (action) {
            case 'idle':
                u.isAttacking = false; u.isMoving = false; u.isDestroyed = false;
                u.lastDamageTime = undefined;
                this.resetPos();
                break;
            case 'move':
                u.isAttacking = false; u.isDestroyed = false;
                u.lastDamageTime = undefined;
                // currentBattleType 已置 null, 确保不会显示战斗特效
                u.isMoving = true;
                this.startOscillation(vec);
                break;
            case 'attack':
                u.isAttacking = true; u.isMoving = false; u.isDestroyed = false;
                u.lastDamageTime = undefined;
                u.currentBattleType = 'field'; // 攻击时才置
                this.resetPos();
                u.targetPos = { lat: u.lastPosition.lat + vec.lat * 0.3, lng: u.lastPosition.lng + vec.lng * 0.3 };
                break;
            case 'damage':
                u.isAttacking = false; u.isMoving = false; u.isDestroyed = false;
                this.resetPos();
                u.lastDamageTime = Date.now();
                this.damageInterval = window.setInterval(() => {
                    if (this.previewUnit) this.previewUnit.lastDamageTime = Date.now();
                }, 400);
                break;
            case 'death':
                u.isAttacking = false; u.isMoving = false;
                u.lastDamageTime = undefined;
                u.isDestroyed = true;
                u.destroyTime = Date.now();
                this.resetPos();
                break;
        }
        console.log(`⚔ [ArmyEditor] Action: ${action}`);
    }

    /** 移动: 方向往返 */
    private startOscillation(vec: {lat: number, lng: number}): void {
        if (!this.previewUnit) return;
        let sign = 1; // 1 = 往前, -1 = 往后
        const speed = 0.002 / 80; // 每毫秒移动量
        const maxDistance = 0.15; // 0.15 度 ~16km, 到边界反向
        
        // Normalize vector so diagonal speed is same as orthogonal
        const len = Math.sqrt(vec.lat * vec.lat + vec.lng * vec.lng);
        const normLat = vec.lat / len;
        const normLng = vec.lng / len;

        this.lastFrameTime = performance.now();
        const animate = (time: number) => {
            if (!this.previewUnit) return;
            const delta = time - this.lastFrameTime;
            this.lastFrameTime = time;
            
            // If delta is huge (e.g., tab was inactive), cap it
            const safeDelta = Math.min(delta, 50);
            
            this.currentLat += sign * normLat * speed * safeDelta;
            this.currentLng += sign * normLng * speed * safeDelta;
            
            const dist = Math.sqrt(Math.pow(this.currentLat - this.spawnLat, 2) + Math.pow(this.currentLng - this.spawnLng, 2));
            if (dist > maxDistance) {
                sign = -sign;
            }
            this.moveInterval = requestAnimationFrame(animate);
        };
        this.moveInterval = requestAnimationFrame(animate);
    }

    /** 复位位置回 spawn 点 */
    private resetPos(): void {
        this.currentLat = this.spawnLat;
        this.currentLng = this.spawnLng;
    }

    /** 清理动画 interval */
    private clearAnimIntervals(): void {
        if (this.moveInterval !== null) {
            cancelAnimationFrame(this.moveInterval);
            this.moveInterval = null;
        }
        if (this.damageInterval !== null) {
            clearInterval(this.damageInterval);
            this.damageInterval = null;
        }
    }

    /** 清除预览 (含背景圆 + 动画 interval + 恢复隐藏的图层) */
    private clearPreview(): void {
        this.clearAnimIntervals();
        if (this.previewUnit) {
            const renderer = getGlobalUnitRenderer();
            if (this.previewUnit.id) LegionPhalanxDrawer.resetNavalDeath(this.previewUnit.id);
            renderer?.unregister(this.previewUnit);
            this.previewUnit = null;
        }
        if (this.backgroundCircle) {
            this.map.removeLayer(this.backgroundCircle);
            this.backgroundCircle = null;
        }
        // 恢复据点/标签层
        this.restoreCityLayers();
    }

    /** 隐藏据点/标签层 (召唤预览时) */
    private hideCityLayers(): void {
        // 必须保留的 panes (地形 + 军队 canvas + UI)
        const keepPanes = new Set([
            'tilePane',           // 地形底图
            'mapPane',            // 容器
            'overlayPane',        // 黑色圆
            'shadowPane',
            'popupPane',
            'tooltipPane',
            'riverPane',
            'vectorRiverPane',
            'unitsPane',          // 军队 canvas (本编辑器要看的)
            'unitsLowPane',
        ]);
        this.hiddenPanes = [];
        const panes = this.map.getPanes();
        for (const name of Object.keys(panes)) {
            if (keepPanes.has(name)) continue;
            const pane = (panes as any)[name] as HTMLElement;
            if (pane && pane.style.display !== 'none') {
                pane.style.display = 'none';
                this.hiddenPanes.push(name);
            }
        }

        // 隐藏 CityCaptureRenderer 的 canvas (在地图容器里, 不在 pane 里)
        const container = this.map.getContainer();
        const cityCanvases = container.querySelectorAll('.city-capture-layer-vfx');
        cityCanvases.forEach((el) => {
            const c = el as HTMLElement;
            if (c.style.display !== 'none') {
                c.style.display = 'none';
                c.classList.add('army-editor-hidden');
            }
        });
    }

    /** 恢复据点/标签层 */
    private restoreCityLayers(): void {
        for (const name of this.hiddenPanes) {
            const pane = this.map.getPane(name);
            if (pane) pane.style.display = '';
        }
        this.hiddenPanes = [];
        // 恢复 CityCaptureRenderer canvas
        const container = this.map.getContainer();
        const hidden = container.querySelectorAll('.army-editor-hidden');
        hidden.forEach((el) => {
            const c = el as HTMLElement;
            c.style.display = '';
            c.classList.remove('army-editor-hidden');
        });
    }
}
