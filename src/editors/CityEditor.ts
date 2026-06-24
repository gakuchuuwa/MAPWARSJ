import { City, CityType } from '../types/core';
import { CITIES_V2 as CITIES } from '../data/cities_v2';
import { CITY_CONFIG } from '../config/CityConfig';
import { FACTIONS } from '../data/factions';
import { CityManager } from '../world/CityManager';
import { IEditor } from './UnifiedEditorManager';
import { getCityImage, getRegion, REGION_ORDER, REGION_LABELS } from '../systems/RegionSystem';
import { STARTING_CAPITALS } from '../data/StartingCapitals';
import { CityAssetManager } from '../assets/CityAssetManager';
import { SANDBOX_DISPLAY_NAMES } from '../data/SandboxDisplayNames';
import { calculateDistance } from '../map/TileMapConfig';
import { FactionEditor, chineseToId, disambiguateCityId } from './FactionEditor';
import { pinyin } from 'pinyin-pro'; // [NEW] 拼音转换库

/**
 * CityEditor - 城市编辑器 (简化版 + 调试增强版)
 * 
 * 统一工作流：编辑表单 → 预览 → 关联文件 → 保存
 */
export class CityEditor implements IEditor {
    public name: string = '城市';
    public icon: string = '🏙️';

    private container: HTMLElement | null = null;
    private _visible: boolean = false;
    private map: any; // Leaflet map instance
    private cityManager: CityManager;
    private onAddCity: (cityData: any) => void;

    private selectedCityId: string | null = null;
    private previewCityId: string | null = null; // [NEW] 跟踪预览城市，防止重影
    private searchResults: any[] = [];
    private searchIndex: number = 0;
    private fileHandle: any = null;
    private isPicking: boolean = false;
    private pendingChanges: Map<string, string> = new Map(); // [BATCH] ID -> CodeBlock
    private pendingDeletions: Set<string> = new Set();       // [BATCH] 待删除的 city ID

    public isEditMode(): boolean {
        return this._visible;
    }

    public isPickingLocation(): boolean {
        return this.isPicking;
    }

    constructor(map: any, cityManager: CityManager, onAddCity: (cityData: any) => void) {
        this.map = map;
        this.cityManager = cityManager;
        this.onAddCity = onAddCity;
        this.createUI();
        // this.bindGlobalToggle(); // Removed
    }

    public show(): void {
        this._visible = true;
        this.cityManager.setEditorMode(true);
        if (this.container) {
            this.container.style.display = 'block';
        }
    }

    public hide(): void {
        this._visible = false;
        this.cityManager.setEditorMode(false);
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    public isVisible(): boolean {
        return this._visible;
    }

    private createUI(): void {
        // [Fix] 彻底清理所有残留的 DOM 元素（防止 HMR 导致多重残留）
        document.querySelectorAll('[id="city-editor"]').forEach(el => el.remove());

        this.container = document.createElement('div');
        this.container.id = 'city-editor';

        // [NEW] 从 localStorage 恢复上次拖拽位置
        const savedPos = this.loadSavedPosition();
        const posCss = savedPos
            ? `top: ${savedPos.top}px; left: ${savedPos.left}px;`
            : `bottom: 80px; left: 20px;`;

        this.container.style.cssText = `
            position: fixed;
            ${posCss}
            width: 320px;
            background: rgba(0, 0, 0, 0.95);
            color: white;
            padding: 15px;
            border-radius: 8px;
            display: none;
            z-index: 10000;
            font-family: 'Microsoft YaHei', monospace;
            border: 1px solid #666;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            max-height: 80vh;
            overflow-y: auto;
        `;

        const typeOptions = Object.entries(CITY_CONFIG)
            .map(([key, config]) =>
                `<option value="${key}" ${key === 'small_city' ? 'selected' : ''}>${config.name} (Max: ${config.maxTroops})</option>`
            ).join('');

        // [NEW] Region 下拉用新 15 区动态生成，跟 RegionSystem 单源同步
        const regionOptions = REGION_ORDER.map(r =>
            `<option value="${r}">${REGION_LABELS[r]} (${r})</option>`
        ).join('');

        // [REFACTOR] 400+ 势力放 <select> 完全没法用。
        // 改用 <input list> + <datalist>，浏览器自带模糊搜索。
        // value 格式: "势力名 (id)" 既能按名搜也能按 id 搜，保存时解析回 id。
        const factionOptions = FACTIONS.map(f =>
            `<option value="${f.name} (${f.id})"></option>`
        ).join('');

        this.container.innerHTML = `
            <h3 id="ce-drag-handle" style="margin: 0 0 8px 0; color: #ffd700; cursor: move; user-select: none;" title="拖动标题移动窗口">🏙️ 城市编辑器 <span style="font-size:11px;color:#888;font-weight:normal;">⠿ 拖动</span></h3>

            <!-- [NEW] 编辑状态栏 -->
            <div id="ce-mode-bar" style="background:#1a1a1a; border:1px solid #333; padding:6px 8px; border-radius:4px; margin-bottom:10px; display:flex; align-items:center; justify-content:space-between; font-size:12px;">
                <span id="ce-mode-label" style="color:#81C784;">➕ 新建模式</span>
                <span style="display:flex; gap:5px;">
                    <button type="button" id="ce-open-faction-editor" title="打开势力编辑器（新建势力）"
                        style="background:#8E44AD; border:none; color:#fff; cursor:pointer; padding:2px 8px; border-radius:3px; font-size:11px;">🏛 势力</button>
                    <button type="button" id="ce-clear-btn" title="清空表单回到新建模式"
                        style="background:transparent; border:1px solid #555; color:#aaa; cursor:pointer; padding:2px 8px; border-radius:3px; font-size:11px;">↺ 清空</button>
                </span>
            </div>
            
            <div id="ce-edit-hint" style="background: #2196F3; color: white; padding: 8px; margin-bottom: 10px; border-radius: 4px; font-size: 12px;">
                💡 点击地图上的城市可加载其数据进行修改
            </div>

            <!-- 城市信息表单 -->
            <div style="margin-bottom: 10px;">
                <label>城市名称:</label>
                <input type="text" id="ce-name" style="width: 100%; background: #222; color: #fff; border: 1px solid #555; padding: 4px;">
                <div id="ce-id-status" style="font-size: 11px; color: #888; margin-top: 3px; line-height: 1.4;">
                    — 输入城名后自动生成 city ID —
                </div>
                <!-- 隐藏 input 维持兼容性：现有逻辑里仍读 #ce-id；新逻辑会在 name input / 选城时自动写入 -->
                <input type="hidden" id="ce-id">
            </div>

            <div style="margin-bottom: 10px;">
                <label>城市类型:</label>
                <select id="ce-type" style="width: 100%; background: #333; color: #fff; border: 1px solid #555; padding: 4px;">
                    ${typeOptions}
                </select>
            </div>

            <div style="margin-bottom: 10px;">
                <label>所属势力 (${FACTIONS.length} 个，输入名或 ID 搜索):</label>
                <input id="ce-faction" list="ce-faction-list" autocomplete="off" placeholder="例: 韩 / han / 叛军"
                    style="width: 100%; background: #333; color: #fff; border: 1px solid #555; padding: 4px; box-sizing: border-box;">
                <datalist id="ce-faction-list">${factionOptions}</datalist>
                <div id="ce-faction-status" style="font-size: 11px; color: #888; margin-top: 3px;">— 未选择 —</div>
            </div>

            <div style="margin-bottom: 10px;">
                <label>文化区域 (留空=按坐标自动判定):</label>
                <select id="ce-region" style="width: 100%; background: #333; color: #fff; border: 1px solid #555; padding: 4px;">
                    <option value="">-- 自动判定 --</option>
                    ${regionOptions}
                </select>
                <div id="ce-region-auto" style="font-size: 11px; color: #4FC3F7; margin-top: 3px;">
                    🔍 自动判定: —
                </div>
            </div>

            <div style="margin-bottom: 10px;">
                <label>初始兵力:</label>
                <input type="number" id="ce-troops" value="1000" min="0" step="1000" style="width: 100%; background: #222; color: #fff; border: 1px solid #555; padding: 4px;">
            </div>



            <div style="margin-bottom: 10px;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="checkbox" id="ce-mirror" style="width: 18px; height: 18px; cursor: pointer;">
                    <span>🔄 图片镜像 (水平翻转)</span>
                </label>
            </div>

            <div style="margin-bottom: 10px;">
                <label>坐标 (Lat, Lng):</label>
                <div style="display: flex; gap: 5px;">
                    <input type="number" id="ce-lat" step="any" placeholder="Lat" style="flex: 1; background: #222; color: #fff; border: 1px solid #555; padding: 4px;">
                    <input type="number" id="ce-lng" step="any" placeholder="Lng" style="flex: 1; background: #222; color: #fff; border: 1px solid #555; padding: 4px;">
                </div>
                <div style="display: flex; gap: 5px; margin-top: 5px;">
                    <button type="button" id="ce-pick-map" style="flex: 1; background: #607D8B; color: white; border: none; padding: 5px; cursor: pointer;">📍 地图取点</button>
                    <button type="button" id="ce-paste-coords" style="flex: 1; background: #009688; color: white; border: none; padding: 5px; cursor: pointer;">📋 粘贴坐标</button>
                </div>
                <div id="ce-proximity-warn" style="font-size: 11px; color: #888; margin-top: 4px; line-height: 1.4;"></div>
            </div>

            <div style="margin-bottom: 15px;">
                <label>搜索坐标:</label>
                <div style="display: flex; gap: 5px;">
                    <input type="text" id="ce-search-query" placeholder="输入真实地名" style="flex: 1; background: #222; color: #fff; border: 1px solid #555; padding: 4px;">
                    <button type="button" id="ce-search-btn" style="background: #2196F3; color: white; border: none; padding: 5px 10px; cursor: pointer;">🔍</button>
                    <button type="button" id="ce-search-next" style="display:none; background: #FF9800; color: white; border: none; padding: 5px 10px; cursor: pointer;">➡️</button>
                </div>
            </div>

            <hr style="border-color: #444;">

            <!-- Step 1: 预览 -->
            <button type="button" id="ce-preview" style="width: 100%; background: #FF9800; color: white; border: none; padding: 10px; cursor: pointer; margin-bottom: 8px; font-weight: bold;">
                👁️ 预览城市 (临时显示在地图上)
            </button>

            <!-- Step 2: 关联文件 -->
            <button type="button" id="ce-link-file" style="width: 100%; background: #607D8B; color: white; border: none; padding: 8px; cursor: pointer;">📂 关联 src/data/cities_v2.ts</button>
            <div id="ce-file-status" style="font-size: 11px; color: #888; margin-top: 3px; margin-bottom: 5px;">未关联文件</div>
            
            <!-- Pending Status -->
            <div id="ce-pending-status" style="font-size: 12px; color: #FF9800; margin-bottom: 10px; font-weight: bold; display: none;">
                ⚠️ 待保存变更: 0
            </div>

            <!-- Step 3: 修改 / 新建 / 删除 (按上下文启用) -->
            <div style="display: flex; gap: 5px; margin-bottom: 5px;">
                <button type="button" id="ce-update-btn" style="flex: 1; background: #4CAF50; color: white; border: none; padding: 10px; cursor: pointer; font-weight: bold;">💾 更新</button>
                <button type="button" id="ce-create-btn" style="flex: 1; background: #009688; color: white; border: none; padding: 10px; cursor: pointer; font-weight: bold;">➕ 新建</button>
                <button type="button" id="ce-delete-btn" style="flex: 1; background: #D32F2F; color: white; border: none; padding: 10px; cursor: pointer; font-weight: bold;">🗑️ 删除</button>
            </div>

            <!-- 辅助功能 -->
            <button type="button" id="ce-audit-proximity" style="width: 100%; background: #455A64; color: white; border: none; padding: 8px; cursor: pointer; margin-top: 8px;">📏 全图间距检查 (&lt;50km)</button>
            <div id="ce-proximity-audit" style="display: none; margin-top: 8px; padding: 8px; background: #1a1a1a; border: 1px solid #444; border-radius: 4px; font-size: 11px; line-height: 1.5; max-height: 220px; overflow-y: auto;"></div>
            <button type="button" id="ce-copy-code" style="width: 100%; background: #9C27B0; color: white; border: none; padding: 8px; cursor: pointer; margin-top: 8px;">📋 复制代码到剪贴板</button>

            <div id="ce-status" style="font-size: 12px; color: #aaa; min-height: 1.2em; margin-top: 8px;"></div>
        `;

        document.body.appendChild(this.container);
        this.bindEvents();
        this.updatePendingUI();
        // [NEW] 初始按钮状态（无选中时灰显 更新/删除）
        this.updateModeBar();
    }

    public toggle(): void {
        if (this._visible) this.hide();
        else this.show();
    }

    public selectCityForEdit(city: any): void {
        if (!this.container) return;

        // 加载城市数据到表单 (scoped query)
        this.selectedCityId = city.id;
        (this.container.querySelector('#ce-id') as HTMLInputElement)!.value = city.id; // 隐藏 input 兼容现有读取
        (this.container.querySelector('#ce-name') as HTMLInputElement)!.value = city.name;
        this.updateIdStatus(); // 状态行显示"🔒 编辑中: ID 不可变"
        (this.container.querySelector('#ce-type') as HTMLSelectElement)!.value = city.type;
        (this.container.querySelector('#ce-faction') as HTMLInputElement)!.value = this.formatFactionDisplay(city.factionId);
        this.updateFactionStatus();
        (this.container.querySelector('#ce-lat') as HTMLInputElement)!.value = city.latitude.toFixed(6);
        (this.container.querySelector('#ce-lng') as HTMLInputElement)!.value = city.longitude.toFixed(6);
        (this.container.querySelector('#ce-troops') as HTMLInputElement)!.value = Math.floor(city.troops).toString();

        (this.container.querySelector('#ce-mirror') as HTMLInputElement)!.checked = city.mirror || false;
        (this.container.querySelector('#ce-region') as HTMLSelectElement)!.value = city.region || '';

        // [NEW] 刷新"自动判定"提示
        const hint = this.container.querySelector('#ce-region-auto') as HTMLElement;
        if (hint) {
            const auto = getRegion(city.latitude, city.longitude);
            const isOverride = city.region && city.region !== auto;
            hint.innerHTML = isOverride
                ? `🔍 自动判定: <b style="color:#FFD54F">${REGION_LABELS[auto]} (${auto})</b> <span style="color:#FF8A65">⚠ 被手工覆盖为 ${city.region}</span>`
                : `🔍 自动判定: <b style="color:#FFD54F">${REGION_LABELS[auto]} (${auto})</b>${city.region ? ' (与自动一致)' : ''}`;
        }

        // [NEW] 刷新模式栏 + 按钮可用性
        this.updateModeBar();

        this.setStatus(`已加载: ${city.name} (ID: ${city.id})`);

        // Auto-show if hidden
        if (!this.isVisible) this.toggle();
    }

    private bindEvents(): void {
        if (!this.container) return;

        // [关键修复] 使用 scoped query 确保操作的是当前容器内的元素
        const latInput = this.container.querySelector('#ce-lat') as HTMLInputElement;
        const lngInput = this.container.querySelector('#ce-lng') as HTMLInputElement;

        // Listen to city dragging
        window.addEventListener('city-dragend', (e: any) => {
            if (!this.isVisible()) return;
            const detail = e.detail;
            
            // Auto select if not already selected
            if (this.selectedCityId !== detail.city.id) {
                this.selectCityForEdit(detail.city);
            }
            
            // Update input fields
            latInput.value = detail.lat.toFixed(6);
            lngInput.value = detail.lng.toFixed(6);
            
            // Automatically trigger preview to show changes and add to pending buffer
            const previewBtn = this.container!.querySelector('#ce-preview') as HTMLButtonElement;
            if (previewBtn) previewBtn.click();
        });

        // File Link Button
        const linkFileBtn = this.container.querySelector('#ce-link-file') as HTMLButtonElement;
        const fileStatus = this.container.querySelector('#ce-file-status') as HTMLElement;

        const updateBtn = this.container.querySelector('#ce-update-btn') as HTMLButtonElement;
        const createBtn = this.container.querySelector('#ce-create-btn') as HTMLButtonElement;
        const deleteBtn = this.container.querySelector('#ce-delete-btn') as HTMLButtonElement;
        const clearBtn = this.container.querySelector('#ce-clear-btn') as HTMLButtonElement;

        // [NEW] 删除当前选中城市
        if (deleteBtn) {
            deleteBtn.onclick = (e) => {
                e.stopPropagation(); e.preventDefault();
                this.handleDelete();
            };
        }

        // [NEW] 清空表单回到新建模式
        if (clearBtn) {
            clearBtn.onclick = (e) => {
                e.stopPropagation(); e.preventDefault();
                this.clearForm();
            };
        }

        // [NEW] 打开势力编辑器
        const openFactionBtn = this.container.querySelector('#ce-open-faction-editor') as HTMLButtonElement;
        if (openFactionBtn) {
            openFactionBtn.onclick = (e) => {
                e.stopPropagation(); e.preventDefault();
                FactionEditor.getInstance().toggle();
            };
        }

        if (linkFileBtn) {
            linkFileBtn.onclick = async () => {
                try {
                    const [fileHandle] = await (window as any).showOpenFilePicker({
                        types: [{
                            description: 'TypeScript Files',
                            accept: { 'text/typescript': ['.ts'] }
                        }]
                    });

                    // [SAFETY] 文件名校验：防止误关联错误文件
                    if (fileHandle.name !== 'cities_v2.ts') {
                        const confirmLink = window.confirm(
                            `⚠️ 安全警告\n\n` +
                            `您选择的文件是 "${fileHandle.name}"，\n` +
                            `但城市编辑器需要关联 "cities_v2.ts"。\n\n` +
                            `如果继续并保存，可能会覆盖错误的文件，导致数据丢失！\n\n` +
                            `是否强制继续？`
                        );
                        if (!confirmLink) {
                            console.log('[CityEditor] 用户取消了错误文件的关联');
                            return;
                        }
                    }

                    this.fileHandle = fileHandle;
                    if (fileStatus) {
                        fileStatus.innerText = '✅ 已关联: ' + fileHandle.name;
                        fileStatus.style.color = '#4CAF50';
                    }
                    console.log('[CityEditor] 文件已关联:', fileHandle.name);
                } catch (e) {
                    console.log('File selection cancelled');
                }
            };
        }

        // Map Click Picker
        const pickBtn = this.container.querySelector('#ce-pick-map') as HTMLButtonElement;
        if (pickBtn) {
            pickBtn.onclick = () => {
                this.isPicking = true;
                pickBtn.textContent = '请点击地图...';
                pickBtn.style.background = '#E91E63';

                const onMapClick = (e: any) => {
                    if (!this.isPicking) return;

                    if (e.originalEvent) {
                        e.originalEvent.preventDefault();
                        e.originalEvent.stopPropagation();
                    }

                    latInput.value = e.latlng.lat.toFixed(6);
                    lngInput.value = e.latlng.lng.toFixed(6);

                    // Reset
                    this.isPicking = false;
                    pickBtn.textContent = '📍 地图取点';
                    pickBtn.style.background = '#607D8B';
                    this.map.off('click', onMapClick);

                    // Auto preview
                    const previewBtn = this.container!.querySelector('#ce-preview') as HTMLButtonElement;
                    if (previewBtn) previewBtn.click();
                };
                this.map.on('click', onMapClick);
            };
        }

        // Paste Coords Button (from right-click pick)
        const pasteBtn = this.container.querySelector('#ce-paste-coords') as HTMLButtonElement;
        if (pasteBtn) {
            pasteBtn.onclick = () => {
                const coords = (window as any).pickedCoords;
                if (!coords) {
                    alert('请先右键点击地图拾取坐标');
                    return;
                }
                latInput.value = coords.lat.toFixed(6);
                lngInput.value = coords.lng.toFixed(6);
                this.setStatus(`📍 已粘贴坐标: (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
            };
        }

        // Geocode Search
        const searchBtn = this.container.querySelector('#ce-search-btn') as HTMLButtonElement;
        const searchNextBtn = this.container.querySelector('#ce-search-next') as HTMLButtonElement;
        const searchInput = this.container.querySelector('#ce-search-query') as HTMLInputElement;

        if (searchBtn && searchNextBtn) {
            const showResult = (index: number) => {
                if (!this.searchResults || this.searchResults.length === 0) return;
                const data = this.searchResults[index];
                latInput.value = parseFloat(data.lat).toFixed(6);
                lngInput.value = parseFloat(data.lon).toFixed(6);
                this.setStatus(`[${index + 1}/${this.searchResults.length}] ${data.display_name.split(',')[0]}`);
            };

            searchBtn.onclick = async () => {
                const query = searchInput.value.trim();
                if (!query) return;

                searchBtn.textContent = '⏳';
                this.searchResults = [];
                this.searchIndex = 0;
                searchNextBtn.style.display = 'none';

                try {
                    const finalQuery = query.includes('中国') ? query : `中国 ${query}`;
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(finalQuery)}&limit=5&accept-language=zh-CN&countrycodes=cn`);
                    const data = await response.json();

                    if (data && data.length > 0) {
                        this.searchResults = data;
                        showResult(0);
                        if (this.searchResults.length > 1) {
                            searchNextBtn.style.display = 'block';
                        }
                    } else {
                        this.setStatus('未找到地点');
                    }
                } catch (e) {
                    this.setStatus('查询失败');
                    console.error(e);
                } finally {
                    searchBtn.textContent = '🔍';
                }
            };

            searchNextBtn.onclick = () => {
                if (this.searchResults.length <= 1) return;
                this.searchIndex = (this.searchIndex + 1) % this.searchResults.length;
                showResult(this.searchIndex);
            };
        }

        // Preview
        const previewBtn = this.container.querySelector('#ce-preview') as HTMLButtonElement;
        if (previewBtn) {
            previewBtn.onclick = () => {
                const name = (this.container!.querySelector('#ce-name') as HTMLInputElement).value;
                const type = (this.container!.querySelector('#ce-type') as HTMLSelectElement).value;
                const faction = this.parseFactionId((this.container!.querySelector('#ce-faction') as HTMLInputElement).value);
                const lat = parseFloat(latInput.value);
                const lng = parseFloat(lngInput.value);

                if (!name || isNaN(lat) || isNaN(lng)) {
                    alert('请填写名称和坐标');
                    return;
                }

                const troops = parseInt((this.container!.querySelector('#ce-troops') as HTMLInputElement).value) || 10000;
                const mirror = (this.container!.querySelector('#ce-mirror') as HTMLInputElement).checked;
                const region = (this.container!.querySelector('#ce-region') as HTMLSelectElement).value;

                // [FIX] Use getCityImage to resolve correct asset based on Region/Type
                // For preview/update, we need the image path immediately
                const tempId = this.selectedCityId || `city_${name}_${Date.now()}`;
                const resolvedImage = getCityImage({
                    id: tempId,
                    type: type as CityType,
                    lat: lat,
                    lng: lng,
                    region: region || undefined
                });

                if (this.selectedCityId) {
                    // 更新模式：直接更新现有城市
                    // 注: startYear/endYear 暂未提供 UI 输入框，仅保留代码生成逻辑兼容手工编辑数据
                    this.cityManager.updateCity(this.selectedCityId, {
                        name,
                        factionId: faction,
                        latitude: lat,
                        longitude: lng,
                        type: type as CityType,
                        troops: troops,
                        mirror: mirror,
                        region: region || undefined,
                        image: resolvedImage // [FIX] Now providing image
                    });

                    // [BATCH] 将生成的代码存入缓冲区
                    const code = this.generateCityCode(false);
                    if (code) {
                        this.pendingChanges.set(this.selectedCityId, code);
                        this.updatePendingUI();
                    }
                    this.setStatus('✅ 已更新内存中的城市');
                } else {
                    // [FIX] 新建模式
                    if (this.previewCityId) {
                        this.cityManager.removeCity(this.previewCityId);
                    }

                    const previewId = `preview_${Date.now()}`;
                    this.previewCityId = previewId;

                    this.onAddCity({
                        id: previewId,
                        name: name,
                        factionId: faction,
                        latitude: lat,
                        longitude: lng,
                        type: type as CityType,
                        troops: troops,
                        mirror: mirror,
                        region: region || undefined,
                        image: resolvedImage // [FIX] Now providing image
                    });
                    this.setStatus('👁️ 预览中 - 点击"新建城市"按钮保存到文件');
                }
            };
        }

        // Save to File
        // Update & Create Buttons
        if (updateBtn) {
            updateBtn.onclick = (e) => {
                e.stopPropagation(); e.preventDefault();
                this.handleSaveToFile('update');
            };
        }
        if (createBtn) {
            createBtn.onclick = (e) => {
                e.stopPropagation(); e.preventDefault();
                this.handleSaveToFile('create');
            };
        }

        // Copy Code
        // [NEW] 全图 <50km 间距审计
        const auditBtn = this.container.querySelector('#ce-audit-proximity') as HTMLButtonElement;
        if (auditBtn) {
            auditBtn.onclick = (e) => {
                e.stopPropagation(); e.preventDefault();
                this.runGlobalProximityAudit();
            };
        }

        const copyBtn = this.container.querySelector('#ce-copy-code') as HTMLButtonElement;
        if (copyBtn) {
            copyBtn.onclick = () => {
                const code = this.generateCityCode();
                if (code) {
                    navigator.clipboard.writeText(code).then(() => {
                        this.setStatus('📋 代码已复制到剪贴板！');
                    });
                    console.log(code);
                }
            };
        }

        // [NEW] 拖拽窗口 (标题栏作为 handle)
        this.bindDragging();

        // [NEW] 实时显示自动判定的 region (lat/lng 改变时即时更新)
        this.bindAutoRegionPreview();

        // [NEW] Faction 输入框实时验证 (✓ 已识别 / ⚠ 未找到)
        const factionInput = this.container.querySelector('#ce-faction') as HTMLInputElement;
        if (factionInput) {
            factionInput.addEventListener('input', () => this.updateFactionStatus());
            factionInput.addEventListener('change', () => this.updateFactionStatus());
        }

        // [NEW] 城市名 → 自动派生 ID 状态实时刷新
        const nameInput = this.container.querySelector('#ce-name') as HTMLInputElement;
        if (nameInput) {
            nameInput.addEventListener('input', () => this.updateIdStatus());
        }
        // 初始触发一次（处理打开编辑器后表单可能已经有数据的情况）
        this.updateIdStatus();
    }

    // ============================================================
    // [NEW] 拖拽窗口实现
    // ============================================================
    private bindDragging(): void {
        if (!this.container) return;
        const handle = this.container.querySelector('#ce-drag-handle') as HTMLElement;
        if (!handle) return;

        let dragging = false;
        let startX = 0, startY = 0;
        let originLeft = 0, originTop = 0;

        const onMouseDown = (e: MouseEvent) => {
            // 阻止 Leaflet 抢事件
            e.stopPropagation();
            e.preventDefault();

            dragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = this.container!.getBoundingClientRect();
            originLeft = rect.left;
            originTop = rect.top;

            // 拖动时切换为 top/left 定位 (避免 bottom 冲突)
            this.container!.style.bottom = 'auto';
            this.container!.style.right = 'auto';

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        const onMouseMove = (e: MouseEvent) => {
            if (!dragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            // 限制不能拖出屏幕 (留 50px 给标题栏可点)
            const newLeft = Math.max(0, Math.min(window.innerWidth - 100, originLeft + dx));
            const newTop = Math.max(0, Math.min(window.innerHeight - 50, originTop + dy));

            this.container!.style.left = newLeft + 'px';
            this.container!.style.top = newTop + 'px';
        };

        const onMouseUp = () => {
            if (!dragging) return;
            dragging = false;
            // 保存位置
            const rect = this.container!.getBoundingClientRect();
            this.saveSavedPosition(rect.left, rect.top);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        handle.addEventListener('mousedown', onMouseDown);
    }

    private loadSavedPosition(): { left: number, top: number } | null {
        try {
            const raw = localStorage.getItem('mapwar.cityEditor.position');
            if (!raw) return null;
            const pos = JSON.parse(raw);
            if (typeof pos.left === 'number' && typeof pos.top === 'number') {
                // 边界保护：屏幕变小后旧位置可能在屏幕外
                if (pos.left < 0 || pos.left > window.innerWidth - 100) return null;
                if (pos.top < 0 || pos.top > window.innerHeight - 50) return null;
                return pos;
            }
        } catch { /* ignore */ }
        return null;
    }

    private saveSavedPosition(left: number, top: number): void {
        try {
            localStorage.setItem('mapwar.cityEditor.position', JSON.stringify({ left, top }));
        } catch { /* ignore quota */ }
    }

    // ============================================================
    // [NEW] 实时显示自动判定的 region
    // ============================================================
    // ============================================================
    // [NEW] 城市 ID 自动派生 + 状态显示
    //   编辑现有城: ID 锁定为 selectedCityId（保护 STARTING_CAPITALS 引用）
    //   新建模式: 从名称自动派生 city_<pinyin>，冲突时自动加后缀
    // ============================================================
    private updateIdStatus(): void {
        if (!this.container) return;
        const nameInput = this.container.querySelector('#ce-name') as HTMLInputElement;
        const idInput = this.container.querySelector('#ce-id') as HTMLInputElement;
        const statusEl = this.container.querySelector('#ce-id-status') as HTMLElement;
        if (!nameInput || !idInput || !statusEl) return;

        const name = nameInput.value.trim();

        if (this.selectedCityId) {
            // 编辑现有城：ID 锁定不可变
            statusEl.innerHTML = `🔒 编辑中：ID 不可变 = <b style="color:#FFD54F">${this.selectedCityId}</b> ` +
                `<span style="color:#888">(改名不会换 ID，避免破坏 STARTING_CAPITALS 引用)</span>`;
            statusEl.style.color = '#aaa';
            return;
        }

        // 新建模式
        if (!name) {
            statusEl.textContent = '— 输入城名后自动生成 city ID —';
            statusEl.style.color = '#888';
            idInput.value = '';
            return;
        }

        const rawId = `city_${chineseToId(name)}`;
        if (!rawId || rawId === 'city_') {
            statusEl.innerHTML = `<span style="color:#FF5252">⚠ 名称转 pinyin 后为空，请用包含汉字的名称</span>`;
            idInput.value = '';
            return;
        }

        const finalId = disambiguateCityId(rawId);
        idInput.value = finalId;
        if (finalId !== rawId) {
            statusEl.innerHTML = `自动 ID: <b style="color:#FFD54F">${finalId}</b> <span style="color:#81C784">✓</span> ` +
                `<span style="color:#FFB74D">(原 "${rawId}" 已存在，自动加后缀)</span>`;
        } else {
            statusEl.innerHTML = `自动 ID: <b style="color:#FFD54F">${finalId}</b> <span style="color:#81C784">✓ 未占用</span>`;
        }
    }

    private bindAutoRegionPreview(): void {
        if (!this.container) return;
        const latInput = this.container.querySelector('#ce-lat') as HTMLInputElement;
        const lngInput = this.container.querySelector('#ce-lng') as HTMLInputElement;
        const hint = this.container.querySelector('#ce-region-auto') as HTMLElement;
        const proximityEl = this.container.querySelector('#ce-proximity-warn') as HTMLElement;
        if (!latInput || !lngInput || !hint) return;

        const update = () => {
            const lat = parseFloat(latInput.value);
            const lng = parseFloat(lngInput.value);
            if (isNaN(lat) || isNaN(lng)) {
                hint.textContent = '🔍 自动判定: —';
                if (proximityEl) proximityEl.innerHTML = '';
                return;
            }
            const auto = getRegion(lat, lng);
            hint.innerHTML = `🔍 自动判定: <b style="color:#FFD54F">${REGION_LABELS[auto]} (${auto})</b>`;
            // [NEW] 50km 间距检查
            this.checkProximity(lat, lng, proximityEl);
        };

        latInput.addEventListener('input', update);
        lngInput.addEventListener('input', update);
        // 初始触发
        update();
    }

    // ============================================================
    // [NEW] 50km 邻近据点检查
    //   规范来源: cities.ts 顶部注释 "两个相邻据点之间必须保持至少 50公里"
    //   实现: 1) 先用 ~0.6° 经纬度盒子粗筛 (快) 2) 对候选用 haversine 算精确距离
    // ============================================================
    private checkProximity(lat: number, lng: number, el: HTMLElement | null): void {
        if (!el) return;
        const allCities = this.cityManager.getCities();
        const MIN_KM = 50;
        const BOX_DEG = 0.6; // 大约 60-70km 的纬度差，足以覆盖 50km

        const tooClose: Array<{ city: any; km: number }> = [];
        for (const c of allCities) {
            // 排除自己（编辑现有城）
            if (c.id === this.selectedCityId) continue;
            // 排除预览中的临时城（防止预览自己触发警告）
            if (c.id === this.previewCityId) continue;
            // 粗筛
            if (Math.abs(c.latitude - lat) > BOX_DEG) continue;
            if (Math.abs(c.longitude - lng) > BOX_DEG) continue;
            // 精确算距
            const meters = calculateDistance(lat, lng, c.latitude, c.longitude);
            const km = meters / 1000;
            if (km < MIN_KM) {
                tooClose.push({ city: c, km });
            }
        }

        if (tooClose.length === 0) {
            el.innerHTML = '<span style="color:#81C784">✓ 周围 50km 内无其他据点</span>';
            return;
        }

        // 按距离从近到远排序，最多列 3 个
        tooClose.sort((a, b) => a.km - b.km);
        const top = tooClose.slice(0, 3);
        const more = tooClose.length > 3 ? ` (还有 ${tooClose.length - 3} 个)` : '';
        const lines = top.map(t => `  • <b>${t.city.name}</b> (${t.city.id}) — ${t.km.toFixed(1)} km`);
        el.innerHTML =
            `<span style="color:#FF5252">⚠ 距离过近 (规范要求 ≥50km):</span>${more}<br>` +
            lines.join('<br>') +
            `<br><span style="color:#999">如真实地理上无法兼容，应删除名气较小的那个；不要硬拉坐标。</span>`;
    }

    /** 玩家可见旗号（1–2 字）；panjun → 叛军 */
    private getFlagLabel(factionId: string): string {
        if (factionId === 'panjun') return '叛军';
        return SANDBOX_DISPLAY_NAMES[factionId] || factionId;
    }

    /** 全图两两 Haversine，返回所有 < minKm 的据点对的唯一列表（i<j 去重） */
    private findAllProximityConflicts(minKm: number = 50): Array<{ km: number; a: City; b: City }> {
        const cities = this.cityManager.getCities();
        const MIN_KM = minKm;
        const BOX_DEG = 0.6;
        const pairs: Array<{ km: number; a: City; b: City }> = [];

        for (let i = 0; i < cities.length; i++) {
            const ca = cities[i];
            for (let j = i + 1; j < cities.length; j++) {
                const cb = cities[j];
                if (Math.abs(ca.latitude - cb.latitude) > BOX_DEG) continue;
                if (Math.abs(ca.longitude - cb.longitude) > BOX_DEG) continue;
                const meters = calculateDistance(ca.latitude, ca.longitude, cb.latitude, cb.longitude);
                const km = meters / 1000;
                if (km < MIN_KM) {
                    pairs.push({ km, a: ca, b: cb });
                }
            }
        }
        pairs.sort((x, y) => x.km - y.km);
        return pairs;
    }

    /** 全图间距审计：列出所有 <50km 的据点对，点击可定位 */
    private runGlobalProximityAudit(): void {
        const panel = this.container?.querySelector('#ce-proximity-audit') as HTMLElement | null;
        if (!panel) return;

        const pairs = this.findAllProximityConflicts(50);
        panel.style.display = 'block';

        if (pairs.length === 0) {
            panel.innerHTML = `<div style="color:#81C784;font-weight:bold;">✓ 全图 ${this.cityManager.getCities().length} 个据点，无 &lt;50km 冲突</div>`;
            this.setStatus('间距检查完成：无冲突');
            return;
        }

        const header = `<div style="color:#FF5252;font-weight:bold;margin-bottom:6px;">⚠ ${pairs.length} 对 &lt;50km（规范 ≥50km）</div>`;
        const rows = pairs.map((p, idx) => {
            const flagA = this.getFlagLabel(p.a.factionId);
            const flagB = this.getFlagLabel(p.b.factionId);
            return `<div class="ce-prox-pair" data-idx="${idx}" style="padding:4px 2px;border-bottom:1px solid #333;cursor:pointer;" title="点击定位到这对据点">` +
                `<span style="color:#FFB74D">${p.km.toFixed(1)} km</span> · ` +
                `<b>${p.a.name}</b>（${flagA}）↔ <b>${p.b.name}</b>（${flagB}）` +
                `</div>`;
        }).join('');

        panel.innerHTML = header + rows;
        this.setStatus(`间距检查：发现 ${pairs.length} 对冲突`);

        panel.querySelectorAll('.ce-prox-pair').forEach(el => {
            el.addEventListener('click', () => {
                const idx = parseInt((el as HTMLElement).dataset.idx || '-1', 10);
                const pair = pairs[idx];
                if (pair) this.focusProximityPair(pair.a, pair.b);
            });
        });
    }

    /** 定位到冲突据点对的中点，并加载较近的那个到表单 */
    private focusProximityPair(a: City, b: City): void {
        const midLat = (a.latitude + b.latitude) / 2;
        const midLng = (a.longitude + b.longitude) / 2;
        if (this.map?.setView) {
            this.map.setView([midLat, midLng], 9);
        } else if (this.map?.panTo) {
            this.map.panTo([midLat, midLng], { animate: true });
        }
        this.selectCityForEdit(a);
    }

    private generateCityCode(forceNewId: boolean = false): string | null {
        // [终极修复] 每次都从 DOM 直接获取当前可见的容器，不依赖可能过时的 this.container
        const container = document.getElementById('city-editor');
        if (!container) {
            console.error('[CityEditor] 错误: DOM 中找不到 city-editor');
            return null;
        }

        const nameInput = container.querySelector('#ce-name') as HTMLInputElement;
        const name = nameInput?.value;

        if (!name) {
            alert('请填写完整信息(城市名称必填)');
            return null;
        }

        // ID 逻辑: 
        // forceNewId = true (新建模式) -> 自动将中文名转为拼音 ID
        // forceNewId = false (更新/预览) -> 优先用输入框的 ID，没有则自动生成
        let id: string;
        // [NEW] 将中文名转为拼音（无音调、无空格）
        // e.g. "函谷关" -> "hanguguan"
        const pinyinName = pinyin(name, { toneType: 'none', type: 'array' }).join('').toLowerCase();
        // Remove strictly all non-alphanumeric chars just in case
        const safeId = pinyinName.replace(/[^a-z0-9]/g, '');

        // Fallback for empty pinyin
        const finalIdSuffix = safeId || Date.now().toString().slice(-6);

        if (forceNewId) {
            id = `city_${finalIdSuffix}`;
        } else {
            // For updates, try to keep existing ID, but if empty, generate one
            const idInput = container.querySelector('#ce-id') as HTMLInputElement;
            // If user cleared ID input, regen; otherwise keep current
            id = idInput?.value || `city_${finalIdSuffix}`;
        }

        const type = (container.querySelector('#ce-type') as HTMLSelectElement)?.value;
        const faction = this.parseFactionId((container.querySelector('#ce-faction') as HTMLInputElement)?.value || '');
        const lat = (container.querySelector('#ce-lat') as HTMLInputElement)?.value;
        const lng = (container.querySelector('#ce-lng') as HTMLInputElement)?.value;
        const troops = (container.querySelector('#ce-troops') as HTMLInputElement)?.value || '10000';

        const mirror = (container.querySelector('#ce-mirror') as HTMLInputElement)?.checked;
        const region = (container.querySelector('#ce-region') as HTMLSelectElement)?.value;

        console.log(`[CityEditor] generateCityCode 读取: name=${name}, lat=${lat}, lng=${lng}, region=${region}`);

        if (!lat || !lng) {
            alert('请填写完整信息');
            return null;
        }

        // [FIX] Image is now determined by RegionSystem at runtime based on region + type
        // No need to store image in cities_v2.ts

        // [NEW] Read startYear/endYear if available in DOM
        const startYearStr = (container.querySelector('#ce-start-year') as HTMLInputElement)?.value;
        const endYearStr = (container.querySelector('#ce-end-year') as HTMLInputElement)?.value;

        const mirrorCode = mirror ? ", mirror: true" : "";
        const regionCode = region ? `, region: '${region}'` : "";
        const startYearCode = startYearStr ? `, startYear: ${startYearStr}` : "";
        const endYearCode = endYearStr ? `, endYear: ${endYearStr}` : "";

        return `{ id: '${id}', name: '${name}', factionId: '${faction}', lat: ${lat}, lng: ${lng}, type: '${type}'${regionCode}, troops: ${troops}${mirrorCode}${startYearCode}${endYearCode} }`;
    }

    private updatePendingUI(): void {
        const el = document.getElementById('ce-pending-status');
        if (el) {
            const changes = this.pendingChanges.size;
            const deletes = this.pendingDeletions.size;
            const total = changes + deletes;
            if (total === 0) {
                el.style.display = 'none';
            } else {
                const parts: string[] = [];
                if (changes > 0) parts.push(`${changes} 修改/新建`);
                if (deletes > 0) parts.push(`<span style="color:#FF5252">${deletes} 删除</span>`);
                el.innerHTML = `⚠️ 待保存: ${parts.join(' + ')} (点击 💾 按钮一次性写入)`;
                el.style.display = 'block';
            }
        }
        // [FIX] 待保存计数变化时联动刷新按钮可用性
        this.updateModeBar();
    }

    private async handleSaveToFile(mode: 'update' | 'create'): Promise<void> {
        console.log(`[CityEditor] 1. 进入 handleSaveToFile (批量模式)`);

        const container = document.getElementById('city-editor');
        if (!container) return;

        if (!this.fileHandle) {
            this.setStatus('❌ 请先点击"关联文件"！已为您复制最新代码。');
            const code = this.generateCityCode(mode === 'create');
            if (code) {
                navigator.clipboard.writeText(code).catch(e => console.error(e));
                alert('由于未关联文件，无法直接保存。代码已自动复制到剪贴板，请到 src/data/cities_v2.ts 中手动替换该城市的代码。');
            }
            return;
        }

        // [BATCH] 首先，将当前表单的数据（如果有修改但未预览）也加入 pending
        // 只有当表单完整时才尝试生成
        const currentName = (container.querySelector('#ce-name') as HTMLInputElement)?.value;
        if (currentName) {
            // 尝试生成代码
            // 如果是 create 模式，forceNewId = true
            // 如果是 update 模式，forceNewId = false
            const isCreate = mode === 'create';

            // 注意：如果用户只是点击保存，我们默认他也想保存当前的
            // 但如果当前表单是空的或者非法的，generateCityCode 会报错或返回null
            // 我们简单尝试一下，忽略错误
            const currentCode = this.generateCityCode(isCreate);
            if (currentCode) {
                // 提取 ID
                const idMatch = currentCode.match(/id:\s*['"]([^'"]+)['"]/);
                const explicitId = (container.querySelector('#ce-id') as HTMLInputElement)?.value;
                const id = idMatch ? idMatch[1] : (explicitId || `city_${Date.now().toString().slice(-6)}`);

                this.pendingChanges.set(id, currentCode);
                console.log(`[Batch] Auto-added current form to pending: ${id}`);

                // [FIX] 如果是新建模式，同时将城市添加到内存
                if (isCreate) {
                    const type = (container.querySelector('#ce-type') as HTMLSelectElement)?.value;
                    const faction = this.parseFactionId((container.querySelector('#ce-faction') as HTMLInputElement)?.value || '');
                    const lat = parseFloat((container.querySelector('#ce-lat') as HTMLInputElement)?.value);
                    const lng = parseFloat((container.querySelector('#ce-lng') as HTMLInputElement)?.value);
                    const troops = parseInt((container.querySelector('#ce-troops') as HTMLInputElement)?.value) || 10000;

                    this.onAddCity({
                        id: id,
                        name: currentName,
                        factionId: faction,
                        latitude: lat,
                        longitude: lng,
                        type: type as CityType,
                        troops: troops
                    });
                    console.log(`[CityEditor] Added new city to memory: ${id}`);
                }
            }
        }

        if (this.pendingChanges.size === 0 && this.pendingDeletions.size === 0) {
            alert('没有待保存的更改！请先修改/新建/删除一个据点。');
            return;
        }

        try {
            console.log('[CityEditor] 5. 开始批量写入...');
            const file = await this.fileHandle.getFile();
            let text = await file.text();

            let successCount = 0;
            let failCount = 0;

            // 遍历所有待保存的更改
            for (const [id, codeBlock] of this.pendingChanges.entries()) {
                console.log(`[Batch] Processing ${id}...`);

                // 1. 查找 ID
                const idRegex = new RegExp(`(?:id|['"]id['"])\\s*:\\s*['"]${id}['"]`);
                const match = text.match(idRegex);
                const matchIndex = match ? match.index : -1;

                if (matchIndex !== -1) {
                    // Update existing
                    console.log(`[Batch] Updating existing: ${id}`);
                    let start = matchIndex!;
                    while (start > 0 && text[start] !== '{') start--;

                    let scanPtr = start;
                    let balance = 0;
                    let end = -1;

                    for (let i = 0; i < 50000; i++) {
                        if (scanPtr >= text.length) break;
                        if (text[scanPtr] === '{') balance++;
                        if (text[scanPtr] === '}') {
                            balance--;
                            if (balance === 0) {
                                end = scanPtr + 1;
                                break;
                            }
                        }
                        scanPtr++;
                    }

                    if (end !== -1) {
                        text = text.substring(0, start) + codeBlock + text.substring(end);
                        successCount++;
                    } else {
                        console.error(`[Batch] Failed to find closing brace for ${id}`);
                        failCount++;
                    }
                } else {
                    // Create new
                    console.log(`[Batch] Creating new: ${id}`);

                    // [FIX] 更稳健的数组末尾查找逻辑
                    // 1. 查找数组定义的结束位置 (];)
                    const arrayEnd = text.lastIndexOf('];');

                    if (arrayEnd === -1) {
                        console.error(`[Batch] Failed to find array end for ${id}`);
                        failCount++;
                    } else {
                        // 2. 向前回溯找到最后一个有效的数组元素结束位置
                        // 目标是插入到最后一个元素之后，]; 之前
                        let insertPos = arrayEnd;

                        // 检查是否需要添加逗号
                        // 向前扫描找到最后一个非空白字符
                        let scanPtr = arrayEnd - 1;
                        while (scanPtr > 0 && /\s/.test(text[scanPtr])) {
                            scanPtr--;
                        }

                        const lastChar = text[scanPtr];
                        const needsComma = lastChar !== ',' && lastChar !== '['; // 如果不是逗号且不是数组开头

                        const commaStr = needsComma ? ',' : '';
                        const insertStr = `${commaStr}\n  ${codeBlock}`; // 保持2空格缩进

                        // 在最后一个非空字符之后插入 (即 scanPtr + 1)
                        // 注意：text.slice(0, scanPtr + 1) 保留了那个字符
                        // text.slice(arrayEnd) 保留了 ];
                        // 中间的空白会被我们的新内容+格式化替代，或者保留一部分?
                        // 更简单的做法：直接替换 arrayEnd 之前的内容是不安全的，因为可能删掉注释
                        // 最佳做法：在 arrayEnd 之前插入，并处理逗号

                        const before = text.slice(0, scanPtr + 1);
                        const after = text.slice(scanPtr + 1);
                        // after 包含了从最后一个字符到文件末尾的所有内容 (包括原来的换行和 ];)

                        text = before + insertStr + after;
                        successCount++;
                    }
                }
            }

            // [NEW] 处理 pendingDeletions —— 在更新/新建之后再删，避免下标错位
            let deleteCount = 0;
            let deleteFailCount = 0;
            for (const id of this.pendingDeletions) {
                console.log(`[Batch] Deleting: ${id}`);

                // 1. 用 id 正则找到 city block
                const idRegex = new RegExp(`(?:id|['"]id['"])\\s*:\\s*['"]${id}['"]`);
                const match = text.match(idRegex);
                const matchIndex = match ? match.index : -1;

                if (matchIndex === -1) {
                    console.warn(`[Batch] Delete: ID ${id} not found in file, may already be removed`);
                    deleteFailCount++;
                    continue;
                }

                // 2. 找到包含此 id 的最近 '{'
                let start = matchIndex!;
                while (start > 0 && text[start] !== '{') start--;

                // 3. 大括号配对找到 '}'
                let scanPtr = start;
                let balance = 0;
                let end = -1;
                for (let i = 0; i < 50000; i++) {
                    if (scanPtr >= text.length) break;
                    if (text[scanPtr] === '{') balance++;
                    if (text[scanPtr] === '}') {
                        balance--;
                        if (balance === 0) {
                            end = scanPtr + 1;
                            break;
                        }
                    }
                    scanPtr++;
                }

                if (end === -1) {
                    console.error(`[Batch] Delete: Failed to find closing brace for ${id}`);
                    deleteFailCount++;
                    continue;
                }

                // 4. 删除 block + 紧跟的逗号（如果有）+ 前置缩进/换行
                let realEnd = end;
                // 吃掉后面的逗号
                while (realEnd < text.length && /[ \t]/.test(text[realEnd])) realEnd++;
                if (text[realEnd] === ',') realEnd++;
                // 吃掉随后的一个换行（保持文件整洁）
                if (text[realEnd] === '\n') realEnd++;
                // 向前吃掉行首缩进（让行整体消失）
                let realStart = start;
                while (realStart > 0 && /[ \t]/.test(text[realStart - 1])) realStart--;

                text = text.substring(0, realStart) + text.substring(realEnd);
                deleteCount++;
            }

            console.log(`[CityEditor] 批量处理完成: 修改/新建 成功 ${successCount} 失败 ${failCount}, 删除 成功 ${deleteCount} 失败 ${deleteFailCount}`);

            // 写入文件
            // @ts-ignore
            if (this.fileHandle.createWritable) {
                // @ts-ignore
                const writable = await this.fileHandle.createWritable();
                await writable.write(text);
                await writable.close();

                // 清理
                this.pendingChanges.clear();
                this.pendingDeletions.clear();
                this.updatePendingUI();

                const parts: string[] = [];
                if (successCount > 0) parts.push(`${successCount} 修改/新建`);
                if (deleteCount > 0) parts.push(`${deleteCount} 删除`);
                this.setStatus(`✅ 批量保存成功！${parts.join(' + ') || '无变更'}`);
            } else {
                alert('您的浏览器不支持 File System Access API 的写入功能');
            }

        } catch (err) {
            console.error('[CityEditor] 保存失败:', err);
            alert('保存失败: ' + err);
        }
    }

    private setStatus(msg: string): void {
        const el = document.getElementById('ce-status');
        if (el) el.textContent = msg;
    }

    // ============================================================
    // [NEW] 跨文件引用完整性辅助
    // ============================================================
    /**
     * 反向查找：哪些势力把此 cityId 作为 STARTING_CAPITALS（沙盒模式起始首都）。
     * 如果列表非空，意味着删除/重命名这个城会让那些势力**没有出生点**，
     * 进入沙盒会被自动降级为 panjun 灰旗。
     */
    private getFactionsByStartingCity(cityId: string): string[] {
        const result: string[] = [];
        for (const [factionId, capitalCityId] of Object.entries(STARTING_CAPITALS)) {
            if (capitalCityId === cityId) result.push(factionId);
        }
        return result;
    }

    // ============================================================
    // [NEW] 删除当前选中的据点
    // ============================================================
    private handleDelete(): void {
        if (!this.selectedCityId) {
            alert('请先在地图上点击一个据点（删除按钮需要选中目标）');
            return;
        }

        const city = this.cityManager.getCity(this.selectedCityId);
        if (!city) {
            alert(`内存中找不到 city: ${this.selectedCityId}`);
            return;
        }

        // [NEW] 检查是否被 STARTING_CAPITALS 引用
        const affectedFactions = this.getFactionsByStartingCity(city.id);
        let capitalWarning = '';
        if (affectedFactions.length > 0) {
            capitalWarning =
                `\n\n🚨🚨🚨 严重警告 🚨🚨🚨\n` +
                `此据点是 ${affectedFactions.length} 个势力的 STARTING_CAPITALS（沙盒起始首都）:\n` +
                affectedFactions.map(f => `  • ${f}`).join('\n') +
                `\n\n删除后这些势力进入沙盒模式会失去出生点，\n` +
                `所有城市会被强制降为 panjun（灰旗叛军）。\n\n` +
                `如果你执意删除，必须同时在 GameApp.ts 的\n` +
                `STARTING_CAPITALS 里给这些势力换一个 cityId。`;
        }

        const confirmMsg =
            `确认删除据点？\n\n` +
            `名称: ${city.name}\n` +
            `ID:   ${city.id}\n` +
            `坐标: (${city.latitude.toFixed(4)}, ${city.longitude.toFixed(4)})\n` +
            `势力: ${city.factionId}\n\n` +
            `⚠ 内存中会立刻消失（含关联道路），保存后写入文件不可逆。` +
            capitalWarning;

        if (!window.confirm(confirmMsg)) return;

        const idToDelete = this.selectedCityId;

        // 1. 内存层移除（cityManager 会顺带清理关联道路）
        this.cityManager.removeCity(idToDelete);

        // 2. 入队待保存到文件
        this.pendingDeletions.add(idToDelete);
        // 如果在 pendingChanges 里也有这个 ID（先改后删的情况），从 changes 移除避免冲突
        this.pendingChanges.delete(idToDelete);

        // 3. 表单清空回到新建模式
        this.clearForm();

        this.setStatus(`🗑️ 已删除: ${city.name} (待保存)`);
        this.updatePendingUI();
    }

    // ============================================================
    // [NEW] 清空表单回到 "新建模式"
    // ============================================================
    private clearForm(): void {
        if (!this.container) return;
        this.selectedCityId = null;

        const setVal = (sel: string, v: string) => {
            const el = this.container!.querySelector(sel) as HTMLInputElement;
            if (el) el.value = v;
        };
        setVal('#ce-id', '');
        setVal('#ce-name', '');
        setVal('#ce-faction', '');
        setVal('#ce-region', '');
        setVal('#ce-lat', '');
        setVal('#ce-lng', '');
        setVal('#ce-troops', '1000');
        const mirror = this.container.querySelector('#ce-mirror') as HTMLInputElement;
        if (mirror) mirror.checked = false;
        const typeSel = this.container.querySelector('#ce-type') as HTMLSelectElement;
        if (typeSel) typeSel.value = 'small_city';

        // 刷新状态显示
        this.updateModeBar();
        this.updateFactionStatus();
        this.updateIdStatus();

        // 刷新自动判定提示（坐标空了）
        const hint = this.container.querySelector('#ce-region-auto') as HTMLElement;
        if (hint) hint.textContent = '🔍 自动判定: —';
    }

    // ============================================================
    // [NEW] 刷新顶部 mode 状态栏 + 按钮可用性
    //
    // 按钮逻辑:
    //   更新: 选中城时 = "更新当前+保存批量"; 未选中但有待保存时 = "保存待保存变更"
    //         **只要 selectedCityId 或 pendingChanges/Deletions 任一有内容就可点**
    //   删除: 必须选中现有城才可点
    //   新建: 始终可点（永远可以建新城）
    // ============================================================
    private updateModeBar(): void {
        if (!this.container) return;
        const label = this.container.querySelector('#ce-mode-label') as HTMLElement;
        const updateBtn = this.container.querySelector('#ce-update-btn') as HTMLButtonElement;
        const deleteBtn = this.container.querySelector('#ce-delete-btn') as HTMLButtonElement;

        const hasPending = this.pendingChanges.size > 0 || this.pendingDeletions.size > 0;

        // 更新模式标签
        if (label) {
            if (this.selectedCityId) {
                const city = this.cityManager.getCity(this.selectedCityId);
                // [NEW] 检查是否是 STARTING_CAPITALS 引用 → 添加红色徽章警示
                const capitalFactions = this.getFactionsByStartingCity(this.selectedCityId);
                const capitalBadge = capitalFactions.length > 0
                    ? ` <span style="background:#D32F2F;color:#fff;padding:1px 5px;border-radius:3px;font-size:10px;" title="${capitalFactions.join(', ')} 的起始首都">📍 ${capitalFactions.length}势力首都</span>`
                    : '';
                label.innerHTML = `✏️ 编辑中: <b style="color:#FFD54F">${city?.name || this.selectedCityId}</b> <span style="color:#666">(${this.selectedCityId})</span>${capitalBadge}`;
                label.style.color = '#FFD54F';
            } else {
                label.innerHTML = hasPending
                    ? `➕ 新建模式 <span style="color:#FF9800">(有 ${this.pendingChanges.size + this.pendingDeletions.size} 项待保存)</span>`
                    : '➕ 新建模式';
                label.style.color = '#81C784';
            }
        }

        // 更新按钮: 选中 或 有待保存 → 可点
        const canSave = !!this.selectedCityId || hasPending;
        if (updateBtn) {
            updateBtn.disabled = !canSave;
            updateBtn.style.opacity = canSave ? '1' : '0.4';
            updateBtn.style.cursor = canSave ? 'pointer' : 'not-allowed';
            // 标签随上下文变化，让人理解它在干什么
            if (this.selectedCityId) {
                updateBtn.innerText = '💾 更新';
                updateBtn.title = '更新当前编辑 + 保存所有待保存变更到文件';
            } else if (hasPending) {
                updateBtn.innerText = '💾 保存';
                updateBtn.title = '保存所有待保存变更到文件';
            } else {
                updateBtn.innerText = '💾 更新';
                updateBtn.title = '需要先选中一个据点或有待保存变更';
            }
        }

        // 删除按钮: 仅选中现有城时可点
        if (deleteBtn) {
            const canDelete = !!this.selectedCityId;
            deleteBtn.disabled = !canDelete;
            deleteBtn.style.opacity = canDelete ? '1' : '0.4';
            deleteBtn.style.cursor = canDelete ? 'pointer' : 'not-allowed';
            deleteBtn.title = canDelete ? '删除当前选中的据点' : '请先在地图上点击一个据点';
        }
    }

    // ============================================================
    // [NEW] Faction 输入框的双向转换 + 验证
    // ============================================================
    /** 把 input.value（"名 (id)" 或 纯 id 或 纯名）解析回 faction.id */
    private parseFactionId(rawValue: string): string {
        if (!rawValue) return '';
        const trimmed = rawValue.trim();
        // 优先匹配 "名 (id)" 格式
        const m = trimmed.match(/\(([^)]+)\)\s*$/);
        if (m) return m[1].trim();
        // 其次尝试纯 id 匹配
        const byId = FACTIONS.find(f => f.id === trimmed);
        if (byId) return byId.id;
        // 最后尝试纯名匹配
        const byName = FACTIONS.find(f => f.name === trimmed);
        if (byName) return byName.id;
        return trimmed; // 未知 - 原样返回供调用者校验
    }

    /** 把 faction.id 转成 input 显示用的 "名 (id)" 字串 */
    private formatFactionDisplay(factionId: string): string {
        const f = FACTIONS.find(x => x.id === factionId);
        return f ? `${f.name} (${f.id})` : factionId;
    }

    /**
     * 刷新 #ce-faction-status 显示当前输入是否对应有效 faction。
     * 同时检查"沙盒模式陷阱"：
     *   - 势力存在但不在 STARTING_CAPITALS → 沙盒模式下其所有城会被强制降为 panjun 灰旗
     *   - 当前编辑的城和该势力的首都不匹配 → 这个城在沙盒模式不会显示此势力
     * 详见 GameApp.ts loadCityData() 中的沙盒重置逻辑。
     */
    private updateFactionStatus(): void {
        const input = this.container?.querySelector('#ce-faction') as HTMLInputElement | null;
        const status = this.container?.querySelector('#ce-faction-status') as HTMLElement | null;
        if (!input || !status) return;
        const raw = input.value.trim();
        if (!raw) {
            status.textContent = '— 未选择 —';
            status.style.color = '#888';
            return;
        }
        const id = this.parseFactionId(raw);
        const f = FACTIONS.find(x => x.id === id);
        if (!f) {
            status.innerHTML = `⚠ 未找到匹配的势力 (输入了 "${raw}")`;
            status.style.color = '#FF8A65';
            return;
        }

        // 基础识别行
        let html = `✓ <b style="color:#81C784">${f.name}</b> <span style="color:#666">(${f.id})</span>`;
        const warnings: string[] = [];

        // [SANDBOX 陷阱 1] 势力是否注册了 STARTING_CAPITALS
        const factionCapital = STARTING_CAPITALS[f.id];
        if (!factionCapital) {
            warnings.push(
                `<span style="color:#FF5252">⚠ 无 STARTING_CAPITALS 注册</span>` +
                `<span style="color:#999">：沙盒模式此势力所有城会被强制降为 panjun 灰旗，需在 StartingCapitals.ts 注册</span>`
            );
        } else {
            // [SANDBOX 陷阱 2] 当前编辑的城是不是此势力的首都？
            if (this.selectedCityId) {
                if (factionCapital === this.selectedCityId) {
                    html += ` <span style="background:#388E3C;color:#fff;padding:1px 5px;border-radius:3px;font-size:10px;">★ 此势力首都</span>`;
                } else {
                    warnings.push(
                        `<span style="color:#FFB74D">ⓘ 沙盒提示</span>` +
                        `<span style="color:#999">：${f.id} 的首都是 ${factionCapital}，此城不是首都；沙盒模式会被算作中立城</span>`
                    );
                }
            }
        }

        // [SANDBOX 陷阱 3] factionFlagMap 缺失 → 旗帜走默认而不是该势力专属
        if (!(f.id in CityAssetManager.factionFlagMap)) {
            warnings.push(
                `<span style="color:#FF9800">⚠ 无 factionFlagMap 条目</span>` +
                `<span style="color:#999">：旗帜会回退到默认/灰旗，需要在 CityAssetManager.ts 添加该势力映射 (具体 PNG 或 'RANDOM')</span>`
            );
        }

        // [SANDBOX 陷阱 4] sandboxDisplayNames 缺失 → 旗帜上没有"短名"文字
        // 注: 代码层有 fallback 到 factionManager.getFactionName，所以不是 fatal
        if (!(f.id in SANDBOX_DISPLAY_NAMES)) {
            warnings.push(
                `<span style="color:#FFB74D">ⓘ 无 sandboxDisplayNames 短名</span>` +
                `<span style="color:#999">：旗帜文字会用势力全名 fallback；如需精简显示请在 SandboxDisplayNames.ts 加 1-2 字</span>`
            );
        }

        if (warnings.length > 0) {
            html += '<br>' + warnings.join('<br>');
        }

        status.innerHTML = html;
        status.style.color = '#81C784';
    }
}
