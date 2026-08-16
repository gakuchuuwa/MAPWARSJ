/**
 * MAPWAR 军团方阵编辑器 (Legion Editor)
 * 访问：http://localhost:5173/legion-editor.html
 *
 * 功能：自由编辑和分配 925 势力的 AoE2 DE 决定版军团兵种、阵型与比例。
 * 遵循与 batch-manager 相同的暗黑美学与高效交互规范。
 */

import { FACTIONS } from '../data/factions';
import { CITIES_V2 } from '../data/cities_v2';
import { STARTING_CAPITALS } from '../data/StartingCapitals';
import { HISTORICAL_FACTION_COLORS } from '../data/HistoricalFactionColors';
import { SANDBOX_DISPLAY_NAMES } from '../data/SandboxDisplayNames';
import { REGION_LABELS, REGION_ORDER, RegionType, getCityRegion } from '../systems/RegionSystem';
import {
    CULTURE_TIERS_MAP,
    CULTURE_FORMATION_MODE,
    FormationMode,
    getDefaultSlotsForMode,
    convertSlotsToMode,
} from '../types/CultureFormations';
import { CompositionSlot } from '../types/LegionComposition';
import { FACTION_COMPOSITIONS, CustomFactionLegion } from '../data/FactionCompositions';

// ============================================================
// 1. 全量 AoE2 DE 兵种字典 (分类定义)
// ============================================================

export type UnitCategory = 'infantry' | 'cavalry' | 'ranged' | 'siege';

export interface DeUnitDef {
    id: string;
    name: string;
    category: UnitCategory;
    categoryLabel: string;
    pathPrefix: string;
    defaultScale?: number;
}

export const DE_UNITS_CATALOG: DeUnitDef[] = [
    // ── 步兵 (Infantry) ──
    { id: 'swordsman',                  name: '剑士',           category: 'infantry', categoryLabel: '步兵', pathPrefix: '/SUCAI/SWORDSMAN/' },
    { id: 'champion',                   name: '冠军剑士',       category: 'infantry', categoryLabel: '步兵', pathPrefix: '/SUCAI/CHAMPION/' },
    { id: 'liao_dao',                   name: '辽刀',           category: 'infantry', categoryLabel: '步兵', pathPrefix: '/SUCAI/LIAO_DAO/' },
    { id: 'elite_liao_dao',             name: '精锐辽刀',       category: 'infantry', categoryLabel: '步兵', pathPrefix: '/SUCAI/ELITE_LIAO_DAO/' },
    { id: 'kamayuk',                    name: '印加枪兵长',     category: 'infantry', categoryLabel: '步兵', pathPrefix: '/SUCAI/KAMAYUK/' },
    { id: 'jian_swordsman',             name: '刀剑手',         category: 'infantry', categoryLabel: '步兵', pathPrefix: '/SUCAI/JIAN_SWORDSMAN/' },
    { id: 'ninja',                      name: '忍者',           category: 'infantry', categoryLabel: '步兵', pathPrefix: '/SUCAI/NINJA/' },
    { id: 'samurai',                    name: '日本武士',       category: 'infantry', categoryLabel: '步兵', pathPrefix: '/SUCAI/SAMURAI_DE/' },
    { id: 'samurai_elite',              name: '精锐武士',       category: 'infantry', categoryLabel: '步兵', pathPrefix: '/SUCAI/SAMURAI_ELITE/' },
    { id: 'fire_lancer',                name: '火矛手',         category: 'infantry', categoryLabel: '步兵', pathPrefix: '/SUCAI/FIRE_LANCER/' },
    { id: 'elite_fire_lancer',          name: '精锐火矛手',     category: 'infantry', categoryLabel: '步兵', pathPrefix: '/SUCAI/ELITE_FIRE_LANCER/' },
    { id: 'white_feather_guard',        name: '白毦兵',         category: 'infantry', categoryLabel: '步兵', pathPrefix: '/SUCAI/WHITE_FEATHER_GUARD/' },
    { id: 'elite_white_feather_guard',  name: '精锐白毦兵',     category: 'infantry', categoryLabel: '步兵', pathPrefix: '/SUCAI/ELITE_WHITE_FEATHER_GUARD/' },
    { id: 'karambit_warrior',           name: '爪刀勇士',       category: 'infantry', categoryLabel: '步兵', pathPrefix: '/SUCAI/KARAMBIT_WARRIOR/' },
    { id: 'karambit_warrior_elite',     name: '精锐爪刀勇士',   category: 'infantry', categoryLabel: '步兵', pathPrefix: '/SUCAI/KARAMBIT_WARRIOR_ELITE/' },
    { id: 'elite_guardsman',            name: '精锐近卫军',     category: 'infantry', categoryLabel: '步兵', pathPrefix: '/SUCAI/ELITE_GUARDSMAN/' },
    { id: 'eastern_swordsman',          name: '东方剑士',       category: 'infantry', categoryLabel: '步兵', pathPrefix: '/SUCAI/EASTERN_SWORDSMAN/' },
    { id: 'legionary',                  name: '罗马军团步兵',   category: 'infantry', categoryLabel: '步兵', pathPrefix: '/SUCAI/LEGIONARY/' },
    { id: 'throwing_axeman',            name: '掷斧兵',         category: 'infantry', categoryLabel: '步兵', pathPrefix: '/SUCAI/THROWING_AXEMAN/' },
    { id: 'heavy_pikeman',              name: '重装长枪兵',     category: 'infantry', categoryLabel: '步兵', pathPrefix: '/SUCAI/HEAVY_PIKEMAN/' },
    { id: 'pikeman',                    name: '长枪兵',         category: 'infantry', categoryLabel: '步兵', pathPrefix: '/SUCAI/PIKEMAN/' },

    // ── 骑兵 (Cavalry) ──
    { id: 'tiger_rider',                name: '虎豹骑',         category: 'cavalry',  categoryLabel: '骑兵', pathPrefix: '/SUCAI/TIGER_RIDER/', defaultScale: 1.2 },
    { id: 'xianbei_raider',             name: '鲜卑掠骑兵',     category: 'cavalry',  categoryLabel: '骑兵', pathPrefix: '/SUCAI/XIANBEI_RAIDER/', defaultScale: 1.2 },
    { id: 'iron_pagoda',                name: '铁浮图',         category: 'cavalry',  categoryLabel: '骑兵', pathPrefix: '/SUCAI/IRON_PAGODA/', defaultScale: 1.2 },
    { id: 'hei_kuang',                  name: '黑光铠骑兵',     category: 'cavalry',  categoryLabel: '骑兵', pathPrefix: '/SUCAI/HEI_KUANG/', defaultScale: 1.2 },
    { id: 'hei_kuang_heavy',            name: '精锐黑光铠骑兵', category: 'cavalry',  categoryLabel: '骑兵', pathPrefix: '/SUCAI/HEI_KUANG_HEAVY/', defaultScale: 1.2 },
    { id: 'steppe_lancer',              name: '草原枪兵',       category: 'cavalry',  categoryLabel: '骑兵', pathPrefix: '/SUCAI/STEPPE_LANCER/', defaultScale: 1.2 },
    { id: 'elite_steppe_lancer',        name: '精锐草原枪兵',   category: 'cavalry',  categoryLabel: '骑兵', pathPrefix: '/SUCAI/ELITE_STEPPE_LANCER/', defaultScale: 1.2 },
    { id: 'keshik',                     name: '怯薛军',         category: 'cavalry',  categoryLabel: '骑兵', pathPrefix: '/SUCAI/KESHIK/', defaultScale: 1.2 },
    { id: 'tarkan',                     name: '答剌罕骑兵',     category: 'cavalry',  categoryLabel: '骑兵', pathPrefix: '/SUCAI/TARKAN/', defaultScale: 1.2 },
    { id: 'elite_tarkan',               name: '精锐答剌罕骑兵', category: 'cavalry',  categoryLabel: '骑兵', pathPrefix: '/SUCAI/ELITE_TARKAN/', defaultScale: 1.2 },
    { id: 'boyar',                      name: '贵族铁骑',       category: 'cavalry',  categoryLabel: '骑兵', pathPrefix: '/SUCAI/BOYAR/', defaultScale: 1.2 },
    { id: 'savar',                      name: '萨瓦尔重骑',     category: 'cavalry',  categoryLabel: '骑兵', pathPrefix: '/SUCAI/SAVAR/', defaultScale: 1.2 },
    { id: 'camel_heavy',                name: '重装骆驼兵',     category: 'cavalry',  categoryLabel: '骑兵', pathPrefix: '/SUCAI/CAMEL_HEAVY/', defaultScale: 1.2 },
    { id: 'paladin',                    name: '游侠/圣骑士',    category: 'cavalry',  categoryLabel: '骑兵', pathPrefix: '/SUCAI/PALADIN/', defaultScale: 1.2 },
    { id: 'coustillier',                name: '马上轻装兵',     category: 'cavalry',  categoryLabel: '骑兵', pathPrefix: '/SUCAI/COUSTILLIER/', defaultScale: 1.2 },
    { id: 'light_riders',               name: '轻骑兵',         category: 'cavalry',  categoryLabel: '骑兵', pathPrefix: '/SUCAI/LIGHT_RIDERS/', defaultScale: 1.2 },

    // ── 远程 (Ranged) ──
    { id: 'chukonu',                    name: '诸葛弩',         category: 'ranged',   categoryLabel: '远程', pathPrefix: '/SUCAI/CHUKONU/' },
    { id: 'elite_chukonu',              name: '精锐诸葛弩',     category: 'ranged',   categoryLabel: '远程', pathPrefix: '/SUCAI/ELITE_CHUKONU/' },
    { id: 'longbowman_elite',           name: '精锐长弓兵',     category: 'ranged',   categoryLabel: '远程', pathPrefix: '/SUCAI/LONGBOWMAN_ELITE/' },
    { id: 'fire_archer',                name: '火焰弓箭手',     category: 'ranged',   categoryLabel: '远程', pathPrefix: '/SUCAI/FIRE_ARCHER/' },
    { id: 'elite_fire_archer',          name: '精锐火焰弓箭手', category: 'ranged',   categoryLabel: '远程', pathPrefix: '/SUCAI/ELITE_FIRE_ARCHER/' },
    { id: 'kipchak',                    name: '钦察弓骑',       category: 'ranged',   categoryLabel: '远程', pathPrefix: '/SUCAI/KIPCHAK/', defaultScale: 1.2 },
    { id: 'elite_kipchak',              name: '精锐钦察弓骑',   category: 'ranged',   categoryLabel: '远程', pathPrefix: '/SUCAI/ELITE_KIPCHAK/', defaultScale: 1.2 },
    { id: 'mangudai',                   name: '蒙古突骑',       category: 'ranged',   categoryLabel: '远程', pathPrefix: '/SUCAI/MANGUDAI/', defaultScale: 1.2 },
    { id: 'mangudai_elite',             name: '精锐蒙古突骑',   category: 'ranged',   categoryLabel: '远程', pathPrefix: '/SUCAI/MANGUDAI_ELITE/', defaultScale: 1.2 },
    { id: 'rattan_archer',              name: '藤弓兵',         category: 'ranged',   categoryLabel: '远程', pathPrefix: '/SUCAI/RATTAN_ARCHER/' },
    { id: 'rattan_archer_elite',        name: '精锐藤弓兵',     category: 'ranged',   categoryLabel: '远程', pathPrefix: '/SUCAI/RATTAN_ARCHER_ELITE/' },
    { id: 'imperial_skirmisher',        name: '帝王掷矛手',     category: 'ranged',   categoryLabel: '远程', pathPrefix: '/SUCAI/IMPERIAL_SKIRMISHER/' },
    { id: 'archer',                     name: '步弓手',         category: 'ranged',   categoryLabel: '远程', pathPrefix: '/SUCAI/ARCHER/' },
    { id: 'cav_archer',                 name: '骑射手',         category: 'ranged',   categoryLabel: '远程', pathPrefix: '/SUCAI/CAV_ARCHER/', defaultScale: 1.2 },
    { id: 'cav_archer_heavy',           name: '重装骑射手',     category: 'ranged',   categoryLabel: '远程', pathPrefix: '/SUCAI/CAV_ARCHER_HEAVY/', defaultScale: 1.2 },
    { id: 'pattiyoda_longbowman',       name: '帕提尤达长弓手', category: 'ranged',   categoryLabel: '远程', pathPrefix: '/SUCAI/PATTIYODA_LONGBOWMAN/' },
    { id: 'composite_bowman',           name: '复合弓箭手',     category: 'ranged',   categoryLabel: '远程', pathPrefix: '/SUCAI/COMPOSITE_BOWMAN/' },
    { id: 'elite_composite_bowman',     name: '精锐复合弓箭手', category: 'ranged',   categoryLabel: '远程', pathPrefix: '/SUCAI/ELITE_COMPOSITE_BOWMAN/' },
    { id: 'crossbowman',                name: '弩手',           category: 'ranged',   categoryLabel: '远程', pathPrefix: '/SUCAI/CROSSBOWMAN/' },
    { id: 'arbalest',                   name: '劲弩手',         category: 'ranged',   categoryLabel: '远程', pathPrefix: '/SUCAI/ARBALEST/' },
    { id: 'arambai',                    name: '飞镖骑兵',       category: 'ranged',   categoryLabel: '远程', pathPrefix: '/SUCAI/ARAMBAI/', defaultScale: 1.2 },

    // ── 攻城 / 战象 (Siege & Elephant) ──
    { id: 'war_elephant',               name: '波斯战象',       category: 'siege',    categoryLabel: '战象/攻城', pathPrefix: '/SUCAI/WAR_ELEPHANT/', defaultScale: 1.0 },
    { id: 'armored_elephant',           name: '皮甲战象',       category: 'siege',    categoryLabel: '战象/攻城', pathPrefix: '/SUCAI/ARMORED_ELEPHANT/', defaultScale: 1.0 },
    { id: 'ballista_elephant',          name: '弩炮象',         category: 'siege',    categoryLabel: '战象/攻城', pathPrefix: '/SUCAI/BALLISTA_ELEPHANT/', defaultScale: 1.0 },
    { id: 'elephant_archer',            name: '象弓骑兵',       category: 'siege',    categoryLabel: '战象/攻城', pathPrefix: '/SUCAI/ELEPHANT_ARCHER/', defaultScale: 1.0 },
];

export const DE_UNITS_MAP = new Map<string, DeUnitDef>(DE_UNITS_CATALOG.map(u => [u.id, u]));

/** 旧版兵种 ID（三国志10体系 S10DB 素材）→ 中文名映射 */
const LEGACY_UNIT_NAMES: Record<string, string> = {
    'horse_archer': '弓骑兵',
    'shield': '盾兵',
    'crossbow': '弩兵',
    'spear': '枪兵',
    'lancer': '轻骑兵',
    'general_cavalry': '将骑兵',
    'light_infantry': '轻步兵',
    'heavy_infantry': '重步兵',
    'axe': '斧兵',
    'ballista': '床弩兵',
    'heavy_cavalry': '重骑兵',
    'elephant': '象兵',
};

/** 根据兵种 ID 获取中文显示名（优先 DE 目录 → 旧版映射 → 原始 ID） */
function getUnitDisplayName(unitId: string): string {
    return DE_UNITS_MAP.get(unitId)?.name || LEGACY_UNIT_NAMES[unitId] || unitId;
}

// ============================================================
// 2. 状态模型与数据组织
// ============================================================

interface FactionLegionRow {
    factionId: string;
    factionName: string;
    flagText: string;
    flagColor: string;
    capitalCityId?: string;
    capitalCityName?: string;
    region: RegionType;
    regionLabel: string;
    isCustom: boolean;
    formationMode: FormationMode;
    slots: CompositionSlot[];
    row1Type: string;
    row2Type: string;
    row3Type: string;
}

let localCustomCompositions: Record<string, CustomFactionLegion> = { ...FACTION_COMPOSITIONS };
let allRows: FactionLegionRow[] = [];
let filteredRows: FactionLegionRow[] = [];
let selectedFactionId: string | null = null;
let currentEditingLegion: CustomFactionLegion | null = null;
let clipboardLegion: CustomFactionLegion | null = null;

let searchQuery = '';
let selectedRegionFilter: string = 'all';
let selectedStatusFilter: 'all' | 'custom' | 'default' = 'all';
let animState: 'idle' | 'move' = 'idle';
let animDirection: number = 0; // 0=南, 2=东, 4=北, 6=西
let animTimer: number | null = null;
let previewViewMode: 'single' | 'three' | 'phalanx' = 'single';
let singlePreviewRow: number = 0; // 0=前排, 1=中坚, 2=后排

// ============================================================
// 3. UI 初始化与注入
// ============================================================

const app = document.getElementById('app')!;
app.innerHTML = `
<header class="le-header">
  <div class="le-title-wrap">
    <div class="le-title">⚔ 军团方阵编辑器</div>
    <span class="le-badge">帝国决定版方阵</span>
  </div>
  <div class="le-header-actions">
    <a href="/" class="le-link">← 返回游戏</a>
    <a href="/batch-manager.html" class="le-link">实体管理</a>
    <a href="/portrait-tuner.html" class="le-link">立绘调校</a>
    <a href="/skill-editor.html" class="le-link">技能管理</a>
    <button type="button" id="le-reload" class="le-btn">刷新数据</button>
    <button type="button" id="le-save-all" class="le-btn le-btn-primary">💾 保存全部配置</button>
  </div>
</header>
<div class="le-toolbar">
  <input id="le-search" class="le-input" type="search" placeholder="搜索 势力 ID / 名称 / 旗号 / 首都…" />
  <select id="le-region-filter" class="le-select">
    <option value="all">全部文化区 (18)</option>
    ${REGION_ORDER.map(r => `<option value="${r}">${REGION_LABELS[r]} (${r})</option>`).join('')}
  </select>
  <select id="le-status-filter" class="le-select">
    <option value="all">全部状态</option>
    <option value="custom">仅已专属定制</option>
    <option value="default">仅文化区默认</option>
  </select>
  <span id="le-stats" class="le-stats">加载中…</span>
</div>
<div class="le-body">
  <!-- 左侧：势力大表 -->
  <main class="le-main">
    <div id="le-table-wrap" class="le-table-wrap"></div>
  </main>
  <!-- 右侧：军团配置与实时预览面板 -->
  <aside id="le-panel" class="le-panel">
    <div id="le-panel-content">
      <div class="le-empty-hint">← 请在左侧列表中点击选择一个势力进行军团方阵编辑</div>
    </div>
  </aside>
</div>
<div id="le-toast" class="le-toast"></div>
`;

injectStyles();

const els = {
    search: document.getElementById('le-search') as HTMLInputElement,
    regionFilter: document.getElementById('le-region-filter') as HTMLSelectElement,
    statusFilter: document.getElementById('le-status-filter') as HTMLSelectElement,
    stats: document.getElementById('le-stats')!,
    tableWrap: document.getElementById('le-table-wrap')!,
    panel: document.getElementById('le-panel')!,
    panelContent: document.getElementById('le-panel-content')!,
    toast: document.getElementById('le-toast')!,
    btnReload: document.getElementById('le-reload') as HTMLButtonElement,
    btnSaveAll: document.getElementById('le-save-all') as HTMLButtonElement,
};

function injectStyles(): void {
    const s = document.createElement('style');
    s.textContent = `
      .le-header {
        display:flex; align-items:center; justify-content:space-between;
        padding:10px 16px; border-bottom:1px solid #2a2620; background:#141210;
        flex-shrink:0;
      }
      .le-title-wrap { display:flex; align-items:center; gap:10px; }
      .le-title { font-size:18px; font-weight:700; color:#f5e6c8; letter-spacing:1px; }
      .le-badge {
        font-size:11px; background:#2a2416; color:#e0c888;
        border:1px solid #5a4a28; padding:2px 8px; border-radius:10px;
      }
      .le-header-actions { display:flex; gap:12px; align-items:center; }
      .le-link { color:#8ab4c4; font-size:13px; text-decoration:none; }
      .le-link:hover { color:#c8e4f0; text-decoration:underline; }
      .le-toolbar {
        display:flex; gap:12px; align-items:center; padding:8px 16px;
        border-bottom:1px solid #2a2620; background:#12100e; flex-shrink:0;
      }
      .le-input, .le-select {
        background:#1c1916; border:1px solid #3a342c; color:#eee;
        border-radius:4px; padding:6px 10px; font-size:13px; outline:none;
      }
      .le-input:focus, .le-select:focus { border-color:#8a7038; }
      .le-input { width:280px; }
      .le-stats { font-size:12px; color:#a89f8f; flex:1; text-align:right; }
      .le-btn {
        background:#2a2620; color:#e8e0d0; border:1px solid #4a4238;
        border-radius:4px; padding:6px 14px; cursor:pointer; font-size:13px;
        font-weight:600; white-space:nowrap; transition:all 0.15s;
      }
      .le-btn:hover { background:#3a342c; border-color:#6a5e4c; }
      .le-btn-primary { background:#5a4a28; border-color:#8a7038; color:#fff8e8; }
      .le-btn-primary:hover { background:#705c32; border-color:#a88844; }
      .le-btn-warn { background:#5a2828; border-color:#8a3838; color:#ffdede; }
      .le-btn-warn:hover { background:#703232; }
      .le-btn-sm { padding:3px 8px; font-size:12px; }

      .le-body { flex:1; display:flex; min-height:0; overflow:hidden; }
      .le-main { flex:1; overflow:auto; background:#0e0d0c; }
      .le-panel {
        width:520px; border-left:1px solid #2a2620; background:#12100e;
        overflow-y:auto; padding:16px; flex-shrink:0; display:flex; flex-direction:column;
      }
      .le-empty-hint {
        color:#7a7266; font-size:13px; text-align:center; padding:60px 20px;
      }

      table.le-table {
        width:100%; border-collapse:collapse; font-size:12px;
      }
      .le-table th {
        background:#1a1816; color:#a89f8f; padding:8px 8px; text-align:left;
        border-bottom:1px solid #2a2620; cursor:pointer; user-select:none;
        position:sticky; top:0; z-index:2; white-space:nowrap;
      }
      .le-table th:hover { color:#f5e6c8; }
      .le-table td {
        padding:6px 8px; border-bottom:1px solid #1a1814; white-space:nowrap;
        overflow:hidden; text-overflow:ellipsis;
      }
      .le-table tr { cursor:pointer; }
      .le-table tr:hover td { background:#1e1c18; }
      .le-table tr.selected td { background:#2a2416 !important; border-bottom-color:#4a3c20; }

      .cell-flag {
        display:inline-block; width:22px; height:22px; line-height:22px;
        text-align:center; border-radius:3px; font-weight:bold; font-size:13px;
        color:#fff; text-shadow:0 1px 2px #000; margin-right:6px; vertical-align:middle;
      }
      .cell-id { color:#8ab4c4; font-family:monospace; margin-left:4px; font-size:11px; }
      .cell-mode { color:#e0c888; font-weight:bold; }
      .cell-unit { color:#d0c8b8; font-size:11px; }
      .status-tag {
        display:inline-block; padding:2px 6px; border-radius:3px; font-size:10px; font-weight:bold;
      }
      .status-custom { background:#1e3820; color:#7cd688; border:1px solid #36663c; }
      .status-default { background:#201e1c; color:#8a8276; border:1px solid #36322c; }

      /* 编辑表单 */
      .le-form-section {
        background:#181614; border:1px solid #2a2620; border-radius:6px;
        padding:12px 14px; margin-bottom:14px;
      }
      .le-section-title {
        color:#f5e6c8; font-size:14px; font-weight:bold; margin-bottom:10px;
        display:flex; justify-content:space-between; align-items:center;
      }
      .le-form-row { margin-bottom:12px; }
      .le-form-row:last-child { margin-bottom:0; }
      
      .le-mode-grid {
        display:grid; grid-template-columns: repeat(3, 1fr); gap:8px;
      }
      .le-mode-btn {
        background:#221f1c; border:1px solid #3a342c; color:#c8bda8;
        padding:8px 4px; border-radius:4px; text-align:center; cursor:pointer;
        font-size:12px; font-weight:bold; transition:all 0.15s;
      }
      .le-mode-btn:hover { background:#2e2a24; border-color:#6a5c48; }
      .le-mode-btn.active {
        background:#4a3c1e; border-color:#c8a84b; color:#fff8e8; box-shadow:0 0 8px rgba(200,168,75,0.25);
      }

      /* 兵种选择行 */
      .le-row-picker {
        background:#1e1c18; border:1px solid #363026; border-radius:6px;
        padding:10px; margin-bottom:8px;
      }
      .le-row-header {
        display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;
      }
      .le-row-title { font-weight:bold; font-size:13px; color:#e0c888; }
      .le-row-scale-wrap { display:flex; align-items:center; gap:6px; font-size:11px; color:#a89f8f; }
      .le-scale-input {
        width:50px; background:#12100e; border:1px solid #3a342c; color:#f5e6c8;
        padding:2px 4px; text-align:center; border-radius:3px; font-size:12px;
      }

      /* 兵种分类选择器 */
      .le-unit-select-btn {
        width:100%; display:flex; justify-content:space-between; align-items:center;
        background:#28241e; border:1px solid #4a4030; color:#fff;
        padding:8px 12px; border-radius:4px; cursor:pointer; font-size:13px; font-weight:bold;
      }
      .le-unit-select-btn:hover { border-color:#c8a84b; background:#322d24; }

      /* Canvas 预览区 */
      .le-preview-wrap {
        background:#0a0908; border:1px solid #2a2620; border-radius:6px;
        padding:8px; margin-bottom:14px; position:relative;
      }
      .le-preview-canvas {
        display:block; width:100%; height:260px; background:#141712;
        border-radius:4px;
      }
      .le-preview-controls {
        display:flex; gap:8px; align-items:center; margin-top:8px;
      }

      .le-toast {
        position:fixed; bottom:20px; right:20px; padding:10px 18px;
        border-radius:6px; font-size:13px; z-index:1000;
        background:#1a3020; color:#9fd4a8; border:1px solid #3a6a48;
        box-shadow:0 6px 20px rgba(0,0,0,0.6);
        transition: opacity 0.3s;
      }
      .le-toast:empty { display:none; }
      .le-toast.is-error { background:#301a1a; color:#ffb4a8; border-color:#6a3a3a; }

      /* Modal 兵种挑选弹窗 */
      .le-modal-overlay {
        position:fixed; top:0; left:0; right:0; bottom:0;
        background:rgba(0,0,0,0.75); z-index:2000;
        display:flex; align-items:center; justify-content:center;
      }
      .le-modal {
        width:650px; max-width:92vw; max-height:85vh; background:#181614;
        border:2px solid #5a4a28; border-radius:8px; box-shadow:0 12px 40px #000;
        display:flex; flex-direction:column; overflow:hidden;
      }
      .le-modal-header {
        padding:12px 16px; background:#221f1a; border-bottom:1px solid #3a342c;
        display:flex; justify-content:space-between; align-items:center;
        color:#f5e6c8; font-size:15px; font-weight:bold;
      }
      .le-modal-tabs {
        display:flex; border-bottom:1px solid #2a2620; background:#141210; padding:0 12px;
      }
      .le-modal-tab {
        padding:10px 16px; font-size:13px; font-weight:bold; color:#a89f8f;
        cursor:pointer; border-bottom:2px solid transparent;
      }
      .le-modal-tab:hover { color:#f5e6c8; }
      .le-modal-tab.active { color:#e0c888; border-bottom-color:#c8a84b; }
      .le-modal-body {
        padding:14px; overflow-y:auto; flex:1; display:grid;
        grid-template-columns: repeat(3, 1fr); gap:8px;
      }
      .le-unit-card {
        background:#201d18; border:1px solid #363024; border-radius:4px;
        padding:8px 10px; cursor:pointer; transition:all 0.15s;
        display:flex; flex-direction:column; gap:4px;
      }
      .le-unit-card:hover {
        background:#302a20; border-color:#c8a84b; transform:translateY(-1px);
      }
      .le-unit-card.active {
        background:#44371c; border-color:#f5d78e;
      }
      .le-unit-card-name { font-weight:bold; font-size:13px; color:#fff8e8; }
      .le-unit-card-id { font-size:11px; font-family:monospace; color:#8ab4c4; }
      .le-unit-card-cat { font-size:10px; color:#c8a84b; }
    `;
    document.head.appendChild(s);
}

function showToast(msg: string, isError: boolean = false): void {
    els.toast.textContent = msg;
    els.toast.className = 'le-toast' + (isError ? ' is-error' : '');
    setTimeout(() => { els.toast.textContent = ''; }, 3500);
}

// ============================================================
// 4. 数据装配与列表构建
// ============================================================

function buildRows(): void {
    const cityMap = new Map(CITIES_V2.map(c => [c.id, c]));
    const capitalMap = new Map<string, string>();
    for (const [fId, cId] of Object.entries(STARTING_CAPITALS)) {
        capitalMap.set(fId, cId);
    }

    allRows = FACTIONS.map(f => {
        const capCityId = capitalMap.get(f.id);
        const capCity = capCityId ? cityMap.get(capCityId) : undefined;
        const region: RegionType = capCity
            ? (capCity.region as RegionType || getCityRegion({ latitude: capCity.lat, longitude: capCity.lng, region: capCity.region }))
            : 'CENTRAL';
        const regionLabel = REGION_LABELS[region] ?? region;
        const flagColor = HISTORICAL_FACTION_COLORS[f.id] || '#8a2020';
        const flagText = SANDBOX_DISPLAY_NAMES[f.id] || f.name.slice(0, 2);

        const custom = localCustomCompositions[f.id];
        const isCustom = !!custom;

        let formationMode: FormationMode = custom?.formationMode ?? CULTURE_FORMATION_MODE[region] ?? 'square';
        let slots: CompositionSlot[] = custom?.slots
            ?? CULTURE_TIERS_MAP[region]?.[0]?.slots
            ?? getDefaultSlotsForMode(formationMode);

        const r1 = slots[0]?.type || 'swordsman';
        const r2 = slots.length > 2 ? slots[1]?.type : slots[0]?.type;
        const r3 = slots[slots.length - 1]?.type || 'archer';

        return {
            factionId: f.id,
            factionName: f.name,
            flagText,
            flagColor,
            capitalCityId: capCityId,
            capitalCityName: capCity?.name || '未知',
            region,
            regionLabel,
            isCustom,
            formationMode,
            slots,
            row1Type: r1,
            row2Type: r2,
            row3Type: r3,
        };
    });
}

function applyFilter(): void {
    const q = searchQuery.toLowerCase().trim();
    filteredRows = allRows.filter(r => {
        if (selectedRegionFilter !== 'all' && r.region !== selectedRegionFilter) return false;
        if (selectedStatusFilter === 'custom' && !r.isCustom) return false;
        if (selectedStatusFilter === 'default' && r.isCustom) return false;
        if (q) {
            const match = r.factionId.toLowerCase().includes(q)
                || r.factionName.toLowerCase().includes(q)
                || r.flagText.toLowerCase().includes(q)
                || (r.capitalCityName && r.capitalCityName.toLowerCase().includes(q));
            if (!match) return false;
        }
        return true;
    });

    const customCount = allRows.filter(r => r.isCustom).length;
    els.stats.innerHTML = `已定制势力: <b style="color:#7cd688">${customCount}</b> / ${allRows.length} | 当前显示: <b>${filteredRows.length}</b>`;
}

function renderTable(): void {
    if (filteredRows.length === 0) {
        els.tableWrap.innerHTML = `<div class="le-empty-hint">没有匹配的势力</div>`;
        return;
    }

    const html = `
    <table class="le-table">
      <thead>
        <tr>
          <th style="width:50px;">旗号</th>
          <th>势力名称</th>
          <th>据点首都</th>
          <th>文化区</th>
          <th>阵型</th>
          <th>前排</th>
          <th>中坚</th>
          <th>后排</th>
          <th style="width:70px;">状态</th>
        </tr>
      </thead>
      <tbody>
        ${filteredRows.map(r => `
          <tr data-fid="${r.factionId}" class="${r.factionId === selectedFactionId ? 'selected' : ''}">
            <td><span class="cell-flag" style="background:${r.flagColor}">${r.flagText}</span></td>
            <td><b>${r.factionName}</b></td>
            <td>${r.capitalCityName}</td>
            <td><span style="color:#a89f8f;font-size:11px;">${r.regionLabel}</span></td>
            <td><span class="cell-mode">${getFormationModeLabel(r.formationMode)}</span></td>
            <td><span class="cell-unit">${getUnitDisplayName(r.row1Type)}</span></td>
            <td><span class="cell-unit">${getUnitDisplayName(r.row2Type)}</span></td>
            <td><span class="cell-unit">${getUnitDisplayName(r.row3Type)}</span></td>
            <td>${r.isCustom ? `<span class="status-tag status-custom">专属</span>` : `<span class="status-tag status-default">默认</span>`}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    `;
    els.tableWrap.innerHTML = html;

    els.tableWrap.querySelectorAll('tr[data-fid]').forEach(tr => {
        tr.addEventListener('click', () => {
            const fid = (tr as HTMLElement).dataset.fid!;
            selectFaction(fid);
        });
    });
}

function getFormationModeLabel(mode: FormationMode): string {
    switch (mode) {
        case 'square': return '3×3 鱼鳞';
        case 'triangle': return '2+3+4 三角';
        case 'echelon': return '4+3+2 雁行';
        default: return mode;
    }
}

// ============================================================
// 5. 势力军团编辑面板 (Right Panel)
// ============================================================

function selectFaction(factionId: string): void {
    selectedFactionId = factionId;
    const row = allRows.find(r => r.factionId === factionId);
    if (!row) return;

    // 加载当前军团配置
    const custom = localCustomCompositions[factionId];
    if (custom) {
        currentEditingLegion = {
            formationMode: custom.formationMode,
            slots: custom.slots.map(s => ({ ...s })),
        };
    } else {
        currentEditingLegion = {
            formationMode: row.formationMode,
            slots: row.slots.map(s => ({ ...s })),
        };
    }

    renderTable();
    renderEditPanel(row);
}

function renderEditPanel(row: FactionLegionRow): void {
    if (!currentEditingLegion) return;

    const mode = currentEditingLegion.formationMode;
    const slots = currentEditingLegion.slots;

    const rowLabels = mode === 'triangle'
        ? ['前排尖刀 (2人)', '中坚突击 (3人)', '后排底边 (4人)']
        : (mode === 'echelon' ? ['前排宽阵 (4人)', '中坚力量 (3人)', '后排压阵 (2人)'] : ['前排战线 (3人)', '中列核心 (3人)', '后排远程 (3人)']);

    // 归一化 slot
    const row1Type = slots[0]?.type || 'swordsman';
    const row1Scale = slots[0]?.scale ?? DE_UNITS_MAP.get(row1Type)?.defaultScale ?? 1.0;

    const midIdx = 1;
    const row2Type = slots[midIdx]?.type || slots[0]?.type || 'lancer';
    const row2Scale = slots[midIdx]?.scale ?? DE_UNITS_MAP.get(row2Type)?.defaultScale ?? 1.0;

    const backIdx = slots.length - 1;
    const row3Type = slots[backIdx]?.type || 'archer';
    const row3Scale = slots[backIdx]?.scale ?? DE_UNITS_MAP.get(row3Type)?.defaultScale ?? 1.0;

    const html = `
    <!-- 头部势力名片 -->
    <div style="display:flex;align-items:center;justify-content:space-between;background:#181614;border:1px solid #2a2620;border-radius:6px;padding:12px;margin-bottom:14px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span class="cell-flag" style="background:${row.flagColor};width:32px;height:32px;line-height:32px;font-size:16px;">${row.flagText}</span>
        <div>
          <div style="font-size:16px;font-weight:bold;color:#f5e6c8;">${row.factionName}</div>
          <div style="font-size:11px;color:#a89f8f;margin-top:2px;">首都：${row.capitalCityName} | 文化区：${row.regionLabel}</div>
        </div>
      </div>
      <div>
        ${row.isCustom ? `<span class="status-tag status-custom" style="font-size:12px;padding:4px 8px;">专属定制</span>` : `<span class="status-tag status-default" style="font-size:12px;padding:4px 8px;">文化默认</span>`}
      </div>
    </div>

    <!-- 阵型选择 -->
    <div class="le-form-section">
      <div class="le-section-title">
        <span>1. 阵型选择</span>
        <span style="font-size:11px;color:#a89f8f;font-weight:normal;">全阵型均为 9 人</span>
      </div>
      <div class="le-mode-grid">
        <div class="le-mode-btn ${mode === 'square' ? 'active' : ''}" data-mode="square">
          <div>3×3 鱼鳞阵</div>
          <div style="font-size:10px;font-weight:normal;opacity:0.75;margin-top:2px;">步前 / 骑中 / 弓后</div>
        </div>
        <div class="le-mode-btn ${mode === 'triangle' ? 'active' : ''}" data-mode="triangle">
          <div>2+3+4 三角阵</div>
          <div style="font-size:10px;font-weight:normal;opacity:0.75;margin-top:2px;">尖刀楔形突击</div>
        </div>
        <div class="le-mode-btn ${mode === 'echelon' ? 'active' : ''}" data-mode="echelon">
          <div>4+3+2 雁行阵</div>
          <div style="font-size:10px;font-weight:normal;opacity:0.75;margin-top:2px;">宽正面远程展开</div>
        </div>
      </div>
    </div>

    <!-- 三排兵种选择 -->
    <div class="le-form-section">
      <div class="le-section-title">
        <span>2. 三排兵种搭配</span>
        <span style="font-size:11px;color:#a89f8f;font-weight:normal;">点击选择兵种</span>
      </div>

      <!-- 排 0 -->
      <div class="le-row-picker">
        <div class="le-row-header">
          <span class="le-row-title">${rowLabels[0]}</span>
          <div class="le-row-scale-wrap">
            缩放: <input type="number" step="0.1" min="0.5" max="2.5" value="${row1Scale}" class="le-scale-input" data-row="0" />
          </div>
        </div>
        <button type="button" class="le-unit-select-btn" data-row="0">
          <span>${getUnitDisplayName(row1Type)}</span>
          <span style="font-size:11px;color:#8ab4c4;">${getUnitDisplayName(row1Type)} ▾</span>
        </button>
      </div>

      <!-- 排 1 -->
      <div class="le-row-picker">
        <div class="le-row-header">
          <span class="le-row-title">${rowLabels[1]}</span>
          <div class="le-row-scale-wrap">
            缩放: <input type="number" step="0.1" min="0.5" max="2.5" value="${row2Scale}" class="le-scale-input" data-row="1" />
          </div>
        </div>
        <button type="button" class="le-unit-select-btn" data-row="1">
          <span>${getUnitDisplayName(row2Type)}</span>
          <span style="font-size:11px;color:#8ab4c4;">${getUnitDisplayName(row2Type)} ▾</span>
        </button>
      </div>

      <!-- 排 2 -->
      <div class="le-row-picker">
        <div class="le-row-header">
          <span class="le-row-title">${rowLabels[2]}</span>
          <div class="le-row-scale-wrap">
            缩放: <input type="number" step="0.1" min="0.5" max="2.5" value="${row3Scale}" class="le-scale-input" data-row="2" />
          </div>
        </div>
        <button type="button" class="le-unit-select-btn" data-row="2">
          <span>${getUnitDisplayName(row3Type)}</span>
          <span style="font-size:11px;color:#8ab4c4;">${getUnitDisplayName(row3Type)} ▾</span>
        </button>
      </div>
    </div>

    <!-- 实时 Canvas 预览 -->
    <div class="le-form-section">
      <div class="le-section-title">
        <span>3. 军团实时动态预览</span>
        <div style="display:flex;gap:4px;">
          <button type="button" class="le-btn le-btn-sm ${previewViewMode === 'single' ? 'le-btn-primary' : ''}" id="le-view-single">🔍 单兵特写</button>
          <button type="button" class="le-btn le-btn-sm ${previewViewMode === 'three' ? 'le-btn-primary' : ''}" id="le-view-three">🛡️ 三排各1兵</button>
          <button type="button" class="le-btn le-btn-sm ${previewViewMode === 'phalanx' ? 'le-btn-primary' : ''}" id="le-view-phalanx">⚔ 9人方阵</button>
        </div>
      </div>
      <div class="le-preview-wrap">
        <canvas id="le-canvas" class="le-preview-canvas" width="480" height="260"></canvas>
      </div>
      <div class="le-preview-controls">
        <button type="button" class="le-btn le-btn-sm ${animState === 'idle' ? 'le-btn-primary' : ''}" id="le-anim-idle">🧍 待机</button>
        <button type="button" class="le-btn le-btn-sm ${animState === 'move' ? 'le-btn-primary' : ''}" id="le-anim-move">🚶 移动</button>
        
        ${previewViewMode === 'single' ? `
        <div style="display:flex;gap:4px;margin-left:8px;">
          <button type="button" class="le-btn le-btn-sm ${singlePreviewRow === 0 ? 'le-btn-primary' : ''}" id="le-single-r0">前排</button>
          <button type="button" class="le-btn le-btn-sm ${singlePreviewRow === 1 ? 'le-btn-primary' : ''}" id="le-single-r1">中坚</button>
          <button type="button" class="le-btn le-btn-sm ${singlePreviewRow === 2 ? 'le-btn-primary' : ''}" id="le-single-r2">后排</button>
        </div>
        ` : ''}

        <span style="font-size:12px;color:#a89f8f;margin-left:auto;">朝向:</span>
        <select id="le-anim-dir" class="le-select" style="padding:2px 6px;font-size:12px;">
          <option value="0" ${animDirection === 0 ? 'selected' : ''}>南 (0)</option>
          <option value="1" ${animDirection === 1 ? 'selected' : ''}>东南 (1)</option>
          <option value="2" ${animDirection === 2 ? 'selected' : ''}>东 (2)</option>
          <option value="3" ${animDirection === 3 ? 'selected' : ''}>东北 (3)</option>
          <option value="4" ${animDirection === 4 ? 'selected' : ''}>北 (4)</option>
          <option value="5" ${animDirection === 5 ? 'selected' : ''}>西北 (5)</option>
          <option value="6" ${animDirection === 6 ? 'selected' : ''}>西 (6)</option>
          <option value="7" ${animDirection === 7 ? 'selected' : ''}>西南 (7)</option>
        </select>
      </div>
    </div>

    <!-- 操作按钮栏 -->
    <div style="display:flex;gap:8px;margin-top:4px;flex-wrap:wrap;">
      <button type="button" id="le-btn-save-single" class="le-btn le-btn-primary" style="flex:1;">💾 保存为【${row.factionName}】专属军团</button>
      ${row.isCustom ? `<button type="button" id="le-btn-reset-single" class="le-btn le-btn-warn">🗑️ 恢复文化默认</button>` : ''}
    </div>
    <div style="display:flex;gap:8px;margin-top:8px;">
      <button type="button" id="le-btn-copy" class="le-btn" style="flex:1;">📋 复制配置</button>
      <button type="button" id="le-btn-paste" class="le-btn" style="flex:1;" ${clipboardLegion ? '' : 'disabled'}>📋 粘贴配置</button>
      <button type="button" id="le-btn-apply-region" class="le-btn" style="flex:1.4;">🌐 一键套用全【${row.regionLabel}】</button>
    </div>
    `;

    els.panelContent.innerHTML = html;
    bindPanelEvents(row);
    startCanvasPreview();
}

function bindPanelEvents(row: FactionLegionRow): void {
    // 阵型切换
    els.panelContent.querySelectorAll('.le-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = (btn as HTMLElement).dataset.mode as FormationMode;
            if (currentEditingLegion && currentEditingLegion.formationMode !== mode) {
                currentEditingLegion.formationMode = mode;
                currentEditingLegion.slots = convertSlotsToMode(currentEditingLegion.slots, mode);
                renderEditPanel(row);
            }
        });
    });

    // 兵种选择弹窗打开
    els.panelContent.querySelectorAll('.le-unit-select-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const rowIdx = parseInt((btn as HTMLElement).dataset.row!, 10);
            openUnitPickerModal(row, rowIdx);
        });
    });

    // 比例变更（监听 input+change 以实时响应微调箭头）
    els.panelContent.querySelectorAll('.le-scale-input').forEach(input => {
        const handleScale = () => {
            const rowIdx = parseInt((input as HTMLElement).dataset.row!, 10);
            const scale = parseFloat((input as HTMLInputElement).value) || 1.0;
            if (currentEditingLegion) {
                updateRowScale(currentEditingLegion, rowIdx, scale);
                startCanvasPreview();
            }
        };
        input.addEventListener('input', handleScale);
        input.addEventListener('change', handleScale);
    });

    // 动画切换
    const btnIdle = document.getElementById('le-anim-idle');
    const btnMove = document.getElementById('le-anim-move');
    const selDir = document.getElementById('le-anim-dir') as HTMLSelectElement;

    btnIdle?.addEventListener('click', () => { animState = 'idle'; renderEditPanel(row); });
    btnMove?.addEventListener('click', () => { animState = 'move'; renderEditPanel(row); });
    selDir?.addEventListener('change', () => { animDirection = parseInt(selDir.value, 10); startCanvasPreview(); });

    // 视图模式切换
    document.getElementById('le-view-single')?.addEventListener('click', () => { previewViewMode = 'single'; renderEditPanel(row); });
    document.getElementById('le-view-three')?.addEventListener('click', () => { previewViewMode = 'three'; renderEditPanel(row); });
    document.getElementById('le-view-phalanx')?.addEventListener('click', () => { previewViewMode = 'phalanx'; renderEditPanel(row); });
    document.getElementById('le-single-r0')?.addEventListener('click', () => { singlePreviewRow = 0; renderEditPanel(row); });
    document.getElementById('le-single-r1')?.addEventListener('click', () => { singlePreviewRow = 1; renderEditPanel(row); });
    document.getElementById('le-single-r2')?.addEventListener('click', () => { singlePreviewRow = 2; renderEditPanel(row); });

    // 保存单条专属
    document.getElementById('le-btn-save-single')?.addEventListener('click', async () => {
        if (!currentEditingLegion) return;
        localCustomCompositions[row.factionId] = {
            formationMode: currentEditingLegion.formationMode,
            slots: currentEditingLegion.slots.map(s => ({ ...s })),
        };
        buildRows();
        applyFilter();
        selectFaction(row.factionId);
        showToast(`✅ 已更新【${row.factionName}】专属军团方阵配置！`);
    });

    // 重置恢复默认
    document.getElementById('le-btn-reset-single')?.addEventListener('click', () => {
        delete localCustomCompositions[row.factionId];
        buildRows();
        applyFilter();
        selectFaction(row.factionId);
        showToast(`🗑️ 已恢复【${row.factionName}】为文化区默认军团！`);
    });

    // 复制
    document.getElementById('le-btn-copy')?.addEventListener('click', () => {
        if (!currentEditingLegion) return;
        clipboardLegion = {
            formationMode: currentEditingLegion.formationMode,
            slots: currentEditingLegion.slots.map(s => ({ ...s })),
        };
        showToast(`📋 已复制【${row.factionName}】的军团方阵配置！`);
        renderEditPanel(row);
    });

    // 粘贴
    document.getElementById('le-btn-paste')?.addEventListener('click', () => {
        if (!clipboardLegion) return;
        currentEditingLegion = {
            formationMode: clipboardLegion.formationMode,
            slots: clipboardLegion.slots.map(s => ({ ...s })),
        };
        renderEditPanel(row);
        showToast(`📋 已粘贴配置！`);
    });

    // 一键套用全区
    document.getElementById('le-btn-apply-region')?.addEventListener('click', () => {
        if (!currentEditingLegion) return;
        const confirmMsg = `确定要将当前军团方阵配置批量应用到所有【${row.regionLabel}】区(${row.region})的势力吗？`;
        if (!confirm(confirmMsg)) return;

        let count = 0;
        allRows.forEach(r => {
            if (r.region === row.region) {
                localCustomCompositions[r.factionId] = {
                    formationMode: currentEditingLegion!.formationMode,
                    slots: currentEditingLegion!.slots.map(s => ({ ...s })),
                };
                count++;
            }
        });
        buildRows();
        applyFilter();
        selectFaction(row.factionId);
        showToast(`🌐 成功为【${row.regionLabel}】区的 ${count} 个势力统一设置方阵！`);
    });
}

function updateRowUnit(legion: CustomFactionLegion, rowIdx: number, unitId: string): void {
    const mode = legion.formationMode;
    const def = DE_UNITS_MAP.get(unitId);
    const defScale = def?.defaultScale ?? 1.0;

    if (mode === 'square') {
        // 5 slots: 0(前3), 1(中左), 2(中中), 3(中右), 4(后3)
        if (rowIdx === 0) {
            legion.slots[0] = { type: unitId, count: 3, scale: legion.slots[0]?.scale ?? defScale };
        } else if (rowIdx === 1) {
            legion.slots[1] = { type: unitId, count: 1, scale: legion.slots[1]?.scale ?? defScale };
            legion.slots[2] = { type: unitId, count: 1, scale: legion.slots[2]?.scale ?? defScale };
            legion.slots[3] = { type: unitId, count: 1, scale: legion.slots[3]?.scale ?? defScale };
        } else if (rowIdx === 2) {
            legion.slots[4] = { type: unitId, count: 3, scale: legion.slots[4]?.scale ?? defScale };
        }
    } else if (mode === 'triangle') {
        const counts = [2, 3, 4];
        legion.slots[rowIdx] = { type: unitId, count: counts[rowIdx], scale: legion.slots[rowIdx]?.scale ?? defScale };
    } else if (mode === 'echelon') {
        const counts = [4, 3, 2];
        legion.slots[rowIdx] = { type: unitId, count: counts[rowIdx], scale: legion.slots[rowIdx]?.scale ?? defScale };
    }
}

function updateRowScale(legion: CustomFactionLegion, rowIdx: number, scale: number): void {
    const mode = legion.formationMode;
    if (mode === 'square') {
        if (rowIdx === 0 && legion.slots[0]) legion.slots[0].scale = scale;
        else if (rowIdx === 1) {
            // 🔴 [2026-08-16 修] 中坚三个槽（左/中/右）必须一起缩放，与 updateRowUnit 改兵种同口径。
            //    之前漏了 slots[2]（中中），改缩放时中间那个兵不动、左右动，预览里中坚三兵大小不一。
            if (legion.slots[1]) legion.slots[1].scale = scale;
            if (legion.slots[2]) legion.slots[2].scale = scale;
            if (legion.slots[3]) legion.slots[3].scale = scale;
        } else if (rowIdx === 2 && legion.slots[4]) legion.slots[4].scale = scale;
    } else {
        if (legion.slots[rowIdx]) legion.slots[rowIdx].scale = scale;
    }
}

// ============================================================
// 6. 兵种挑选弹窗 (Unit Picker Modal)
// ============================================================

function openUnitPickerModal(row: FactionLegionRow, rowIdx: number): void {
    const overlay = document.createElement('div');
    overlay.className = 'le-modal-overlay';

    let currentTab: UnitCategory = 'infantry';
    const rowTitle = ['前排', '中坚', '后排'][rowIdx];

    const closeModal = () => {
        window.removeEventListener('keydown', handleKey);
        overlay.remove();
    };

    const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKey);

    const renderModalContent = () => {
        const units = DE_UNITS_CATALOG.filter(u => u.category === currentTab);
        overlay.innerHTML = `
        <div class="le-modal">
          <div class="le-modal-header">
            <span>选择【${rowTitle}】兵种</span>
            <button type="button" class="le-btn le-btn-sm" id="le-modal-close" style="font-size:14px;padding:2px 8px;cursor:pointer;">✕</button>
          </div>
          <div class="le-modal-tabs">
            <div class="le-modal-tab ${currentTab === 'infantry' ? 'active' : ''}" data-cat="infantry">🛡️ 步兵 (${DE_UNITS_CATALOG.filter(u=>u.category==='infantry').length})</div>
            <div class="le-modal-tab ${currentTab === 'cavalry' ? 'active' : ''}" data-cat="cavalry">🐎 骑兵 (${DE_UNITS_CATALOG.filter(u=>u.category==='cavalry').length})</div>
            <div class="le-modal-tab ${currentTab === 'ranged' ? 'active' : ''}" data-cat="ranged">🏹 远程 (${DE_UNITS_CATALOG.filter(u=>u.category==='ranged').length})</div>
            <div class="le-modal-tab ${currentTab === 'siege' ? 'active' : ''}" data-cat="siege">🐘 战象/攻城 (${DE_UNITS_CATALOG.filter(u=>u.category==='siege').length})</div>
          </div>
          <div class="le-modal-body">
            ${units.map(u => `
              <div class="le-unit-card" data-uid="${u.id}">
                <div class="le-unit-card-name">${u.name}</div>
                <div class="le-unit-card-cat">${u.categoryLabel}</div>
              </div>
            `).join('')}
          </div>
        </div>
        `;

        overlay.querySelector('#le-modal-close')?.addEventListener('click', (e) => {
            e.stopPropagation();
            closeModal();
        });

        overlay.querySelectorAll('.le-modal-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.stopPropagation();
                currentTab = (tab as HTMLElement).dataset.cat as UnitCategory;
                renderModalContent();
            });
        });

        overlay.querySelectorAll('.le-unit-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.stopPropagation();
                const uid = (card as HTMLElement).dataset.uid!;
                if (currentEditingLegion) {
                    updateRowUnit(currentEditingLegion, rowIdx, uid);
                    renderEditPanel(row);
                }
                closeModal();
            });
        });
    };

    document.body.appendChild(overlay);
    renderModalContent();

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
}

// ============================================================
// 7. 轻量 Canvas 动态预览 (精确帧切片与视图模式)
// ============================================================

interface DynMetaDir {
    fw: number;
    fh: number;
    hx: number;
    hy: number;
}
interface DynMetaAction {
    frames: number;
    dirs: Record<string, DynMetaDir>;
}
interface DynMeta {
    idle?: DynMetaAction;
    move?: DynMetaAction;
    attack?: DynMetaAction;
    death?: DynMetaAction;
}

const spriteCache = new Map<string, HTMLImageElement>();
const metaCache = new Map<string, DynMeta | null>();

const LEGACY_TO_DE_FALLBACK: Record<string, string> = {
    'horse_archer': 'cav_archer',
    'shield': 'swordsman',
    'crossbow': 'crossbowman',
    'spear': 'pikeman',
    'lancer': 'light_riders',
    'general_cavalry': 'tiger_rider',
    'light_infantry': 'swordsman',
    'heavy_infantry': 'heavy_pikeman',
    'axe': 'throwing_axeman',
    'ballista': 'ballista_elephant',
    'heavy_cavalry': 'paladin',
    'elephant': 'war_elephant',
};

function getUnitPathPrefix(unitId: string): string {
    const def = DE_UNITS_MAP.get(unitId);
    if (def) return def.pathPrefix;
    const fallback = LEGACY_TO_DE_FALLBACK[unitId];
    if (fallback && DE_UNITS_MAP.has(fallback)) {
        return DE_UNITS_MAP.get(fallback)!.pathPrefix;
    }
    return '/SUCAI/SWORDSMAN/';
}

function loadSprite(url: string): Promise<HTMLImageElement> {
    if (spriteCache.has(url)) return Promise.resolve(spriteCache.get(url)!);
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = () => {
            spriteCache.set(url, img);
            resolve(img);
        };
        img.onerror = () => reject(new Error('Failed to load ' + url));
    });
}

async function loadMeta(pathPrefix: string): Promise<DynMeta | null> {
    if (metaCache.has(pathPrefix)) return metaCache.get(pathPrefix)!;
    try {
        const res = await fetch(`${pathPrefix}_meta.json`);
        if (!res.ok) {
            metaCache.set(pathPrefix, null);
            return null;
        }
        const data = (await res.json()) as DynMeta;
        metaCache.set(pathPrefix, data);
        return data;
    } catch {
        metaCache.set(pathPrefix, null);
        return null;
    }
}

function startCanvasPreview(): void {
    if (animTimer !== null) {
        cancelAnimationFrame(animTimer);
        animTimer = null;
    }

    const canvas = document.getElementById('le-canvas') as HTMLCanvasElement;
    if (!canvas || !currentEditingLegion) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mode = currentEditingLegion.formationMode;
    const slots = currentEditingLegion.slots;

    let unitPositions: Array<{ x: number; y: number; type: string; scale: number; label: string }> = [];

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    if (previewViewMode === 'single') {
        // 单兵大图特写模式（2.4倍高清放大，细节极清晰）
        let unitType = 'swordsman';
        let unitScale = 1.0;
        let rowTitle = '前排';
        if (singlePreviewRow === 0) {
            unitType = slots[0]?.type || 'swordsman';
            unitScale = slots[0]?.scale ?? 1.0;
            rowTitle = '前排';
        } else if (singlePreviewRow === 1) {
            unitType = slots[1]?.type || 'lancer';
            unitScale = slots[1]?.scale ?? 1.0;
            rowTitle = '中坚';
        } else {
            unitType = slots[slots.length - 1]?.type || 'archer';
            unitScale = slots[slots.length - 1]?.scale ?? 1.0;
            rowTitle = '后排';
        }
        unitPositions.push({
            x: cx,
            y: cy - 10,
            type: unitType,
            scale: unitScale * 2.4,
            label: `${rowTitle} · ${getUnitDisplayName(unitType)}`,
        });
    } else if (previewViewMode === 'three') {
        // 三排各一兵清晰展示模式（1.7倍放大）
        const t0 = slots[0]?.type || 'swordsman';
        const s0 = (slots[0]?.scale ?? 1.0) * 1.7;
        const t1 = slots[1]?.type || 'lancer';
        const s1 = (slots[1]?.scale ?? 1.0) * 1.7;
        const t2 = slots[slots.length - 1]?.type || 'archer';
        const s2 = (slots[slots.length - 1]?.scale ?? 1.0) * 1.7;

        unitPositions.push({ x: cx - 140, y: cy - 10, type: t0, scale: s0, label: `前排 · ${getUnitDisplayName(t0)}` });
        unitPositions.push({ x: cx,       y: cy - 10, type: t1, scale: s1, label: `中坚 · ${getUnitDisplayName(t1)}` });
        unitPositions.push({ x: cx + 140, y: cy - 10, type: t2, scale: s2, label: `后排 · ${getUnitDisplayName(t2)}` });
    } else {
        // 9 人方阵排布模式
        const spacingX = 52;
        const spacingY = 46;
        const pScale = 1.15;

        if (mode === 'triangle') {
            const t0 = slots[0]?.type || 'swordsman';
            const s0 = (slots[0]?.scale ?? 1.0) * pScale;
            const t1 = slots[1]?.type || 'lancer';
            const s1 = (slots[1]?.scale ?? 1.0) * pScale;
            const t2 = slots[2]?.type || 'archer';
            const s2 = (slots[2]?.scale ?? 1.0) * pScale;

            unitPositions.push({ x: cx - spacingX * 0.5, y: cy - spacingY - 10, type: t0, scale: s0, label: '' });
            unitPositions.push({ x: cx + spacingX * 0.5, y: cy - spacingY - 10, type: t0, scale: s0, label: '' });
            unitPositions.push({ x: cx - spacingX, y: cy - 10, type: t1, scale: s1, label: '' });
            unitPositions.push({ x: cx, y: cy - 10, type: t1, scale: s1, label: '' });
            unitPositions.push({ x: cx + spacingX, y: cy - 10, type: t1, scale: s1, label: '' });
            unitPositions.push({ x: cx - spacingX * 1.5, y: cy + spacingY - 10, type: t2, scale: s2, label: '' });
            unitPositions.push({ x: cx - spacingX * 0.5, y: cy + spacingY - 10, type: t2, scale: s2, label: '' });
            unitPositions.push({ x: cx + spacingX * 0.5, y: cy + spacingY - 10, type: t2, scale: s2, label: '' });
            unitPositions.push({ x: cx + spacingX * 1.5, y: cy + spacingY - 10, type: t2, scale: s2, label: '' });
        } else if (mode === 'echelon') {
            const t0 = slots[0]?.type || 'swordsman';
            const s0 = (slots[0]?.scale ?? 1.0) * pScale;
            const t1 = slots[1]?.type || 'lancer';
            const s1 = (slots[1]?.scale ?? 1.0) * pScale;
            const t2 = slots[2]?.type || 'archer';
            const s2 = (slots[2]?.scale ?? 1.0) * pScale;

            unitPositions.push({ x: cx - spacingX * 1.5, y: cy - spacingY - 10, type: t0, scale: s0, label: '' });
            unitPositions.push({ x: cx - spacingX * 0.5, y: cy - spacingY - 10, type: t0, scale: s0, label: '' });
            unitPositions.push({ x: cx + spacingX * 0.5, y: cy - spacingY - 10, type: t0, scale: s0, label: '' });
            unitPositions.push({ x: cx + spacingX * 1.5, y: cy - spacingY - 10, type: t0, scale: s0, label: '' });
            unitPositions.push({ x: cx - spacingX, y: cy - 10, type: t1, scale: s1, label: '' });
            unitPositions.push({ x: cx, y: cy - 10, type: t1, scale: s1, label: '' });
            unitPositions.push({ x: cx + spacingX, y: cy - 10, type: t1, scale: s1, label: '' });
            unitPositions.push({ x: cx - spacingX * 0.5, y: cy + spacingY - 10, type: t2, scale: s2, label: '' });
            unitPositions.push({ x: cx + spacingX * 0.5, y: cy + spacingY - 10, type: t2, scale: s2, label: '' });
        } else {
            const t0 = slots[0]?.type || 'swordsman';
            const s0 = (slots[0]?.scale ?? 1.0) * pScale;
            const t1 = slots[1]?.type || 'lancer';
            const s1 = (slots[1]?.scale ?? 1.0) * pScale;
            const t1c = slots[2]?.type || t1;
            const s1c = (slots[2]?.scale ?? s1) * pScale;
            const t2 = slots[4]?.type || 'archer';
            const s2 = (slots[4]?.scale ?? 1.0) * pScale;

            unitPositions.push({ x: cx - spacingX, y: cy - spacingY - 10, type: t0, scale: s0, label: '' });
            unitPositions.push({ x: cx, y: cy - spacingY - 10, type: t0, scale: s0, label: '' });
            unitPositions.push({ x: cx + spacingX, y: cy - spacingY - 10, type: t0, scale: s0, label: '' });
            unitPositions.push({ x: cx - spacingX, y: cy - 10, type: t1, scale: s1, label: '' });
            unitPositions.push({ x: cx, y: cy - 10, type: t1c, scale: s1c, label: '' });
            unitPositions.push({ x: cx + spacingX, y: cy - 10, type: t1, scale: s1, label: '' });
            unitPositions.push({ x: cx - spacingX, y: cy + spacingY - 10, type: t2, scale: s2, label: '' });
            unitPositions.push({ x: cx, y: cy + spacingY - 10, type: t2, scale: s2, label: '' });
            unitPositions.push({ x: cx + spacingX, y: cy + spacingY - 10, type: t2, scale: s2, label: '' });
        }
    }

    let frame = 0;
    const renderLoop = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 绘制沙盘网格背景
        ctx.fillStyle = '#141812';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#1e241c';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 30) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 30) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }

        // 绘制士兵（按 Y 轴排序以保证前后遮挡正确）
        const sorted = [...unitPositions].sort((a, b) => a.y - b.y);

        sorted.forEach(u => {
            const prefix = getUnitPathPrefix(u.type);
            const actionName = animState === 'move' ? 'move' : 'idle';
            const imgUrl = `${prefix}${actionName}_${animDirection}.png`;

            if (!metaCache.has(prefix)) {
                loadMeta(prefix).catch(() => {});
            }
            const meta = metaCache.get(prefix) || null;

            const img = spriteCache.get(imgUrl);
            if (img && img.complete && img.naturalWidth > 0) {
                const actMeta = meta?.[actionName];
                const dirMeta = actMeta?.dirs?.[String(animDirection)];

                let totalFrames = 1;
                let fw = 0;
                let fh = 0;
                let hx = 0;
                let hy = 0;

                if (actMeta && dirMeta) {
                    totalFrames = actMeta.frames;
                    fw = dirMeta.fw;
                    fh = dirMeta.fh;
                    hx = dirMeta.hx;
                    hy = dirMeta.hy;
                } else {
                    totalFrames = Math.max(1, Math.round(img.naturalWidth / img.naturalHeight));
                    fw = img.naturalWidth / totalFrames;
                    fh = img.naturalHeight;
                    hx = fw / 2;
                    hy = fh / 2;
                }

                // 动画帧索引
                const curFrame = Math.floor(frame / 6) % totalFrames;
                const sx = curFrame * fw;
                const sy = 0;
                const sw = fw;
                const sh = fh;

                const s = u.scale;
                const dw = fw * s;
                const dh = fh * s;
                const bounce = animState === 'move' ? Math.sin(frame * 0.25 + u.x) * 2.5 : 0;
                const dx = u.x - hx * s;
                const dy = u.y - hy * s + bounce;

                // 绘制单帧
                ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);

                // 绘制标签（若有）
                if (u.label) {
                    ctx.fillStyle = '#f5e6c8';
                    ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.shadowColor = '#000';
                    ctx.shadowBlur = 4;
                    ctx.fillText(u.label, u.x, u.y + (fh - hy) * s + 18);
                    ctx.shadowBlur = 0;
                }
            } else {
                loadSprite(imgUrl).catch(() => {});
                // 占位圆
                ctx.fillStyle = '#4a3c20';
                ctx.beginPath();
                ctx.arc(u.x, u.y, 10 * u.scale, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        frame++;
        animTimer = requestAnimationFrame(renderLoop);
    };

    renderLoop();
}

// ============================================================
// 8. 存盘与全局事件
// ============================================================

async function saveAllCompositions(): Promise<void> {
    try {
        els.btnSaveAll.disabled = true;
        els.btnSaveAll.textContent = '💾 保存中…';

        const res = await fetch('/api/save-faction-compositions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ compositions: localCustomCompositions }),
        });

        if (!res.ok) throw new Error(await res.text());

        showToast('🎉 全量势力军团方阵配置已成功写入 FactionCompositions.ts！');
    } catch (e: any) {
        showToast('❌ 保存失败：' + (e?.message || e), true);
    } finally {
        els.btnSaveAll.disabled = false;
        els.btnSaveAll.textContent = '💾 保存全部配置';
    }
}

// 事件绑定
els.search.addEventListener('input', () => {
    searchQuery = els.search.value;
    applyFilter();
    renderTable();
});

els.regionFilter.addEventListener('change', () => {
    selectedRegionFilter = els.regionFilter.value;
    applyFilter();
    renderTable();
});

els.statusFilter.addEventListener('change', () => {
    selectedStatusFilter = els.statusFilter.value as any;
    applyFilter();
    renderTable();
});

els.btnReload.addEventListener('click', () => {
    localCustomCompositions = { ...FACTION_COMPOSITIONS };
    buildRows();
    applyFilter();
    renderTable();
    if (selectedFactionId) selectFaction(selectedFactionId);
    showToast('🔄 已重新载入势力军团数据');
});

els.btnSaveAll.addEventListener('click', () => {
    saveAllCompositions();
});

// 快捷键 Ctrl+S 保存
window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveAllCompositions();
    }
});

// 启动执行
buildRows();
applyFilter();
renderTable();

// 默认选中第一个势力
if (filteredRows.length > 0) {
    selectFaction(filteredRows[0].factionId);
}
