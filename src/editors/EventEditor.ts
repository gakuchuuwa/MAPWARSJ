import { HistoricalEvent } from '../types/core';
import { HISTORICAL_EVENTS } from '../data/events';
import { HISTORICAL_LEGIONS } from '../data/legions';
import { EventFileHandler } from '../events/EventFileHandler';
import { EventParser } from '../events/EventParser';
import { IEditor } from './UnifiedEditorManager';
import { gameLog } from '../utils/GameLogger';

export class EventEditor implements IEditor {
    // IEditor interface properties
    public name: string = 'Event Editor';
    public icon: string = '📜';

    private container: HTMLElement | null = null;
    private _isVisible: boolean = false;
    private fileHandler: EventFileHandler;
    private cityManager: any;
    private map: any; // Leaflet map for click-to-pick coordinates
    private isPicking: boolean = false;
    private currentCityPickCallback: ((cityId: string) => void) | null = null;
    private currentLocPickCallback: ((lat: number, lng: number) => void) | null = null;
    private currentEditingEvent: HistoricalEvent | null = null;
    private originalDescription: string = '';

    constructor(cityManager: any, _legionManager?: any, map?: any) {
        this.cityManager = cityManager;
        this.map = map;
        this.fileHandler = new EventFileHandler();
        this.createUI();
    }

    private createUI(): void {
        this.container = document.createElement('div');
        this.container.id = 'event-editor';
        this.container.style.cssText = `
            position: fixed;
            top: 50px;
            left: 20px;
            width: 350px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 15px;
            border-radius: 8px;
            display: none;
            z-index: 10000;
            font-family: monospace;
            max-height: 80vh;
            overflow-y: auto;
            border: 1px solid #444;
        `;

        this.container.innerHTML = `
            <h3 style="margin-top: 0; color: #ffd700;">历史事件</h3>
            
            <div style="margin-bottom: 15px;">
                <label>选择已有事件 (修改):</label>
                <select id="editor-event-select" style="width: 100%; margin-bottom: 5px; background: #333; color: #fff; border: 1px solid #555;">
                    <option value="">-- 新增事件 --</option>
                </select>
            </div>

            <div style="margin-bottom: 15px;">
                <label>快速解析文本:</label>
                <textarea id="editor-input-text" style="width: 100%; height: 60px; background: #222; color: #fff; border: 1px solid #555;" placeholder="例如：前229年，[秦]王翦攻打[赵]邯郸，秦军胜。"></textarea>
                <button id="editor-btn-parse" style="width: 100%; margin-top: 5px; background: #4CAF50; color: white; border: none; padding: 5px; cursor: pointer;">解析并填充</button>
            </div>

            <hr style="border-color: #444;">

            <div id="editor-form">
                <div style="margin-bottom: 10px;">
                    <label>年份:</label>
                    <input type="number" id="editor-year" style="width: 60px; background: #222; color: #fff; border: 1px solid #555;">
                    <label>季节:</label>
                    <select id="editor-season" style="background: #222; color: #fff; border: 1px solid #555;">
                        <option value="0">春</option>
                        <option value="1">夏</option>
                        <option value="2">秋</option>
                        <option value="3">冬</option>
                    </select>
                </div>

                <div style="margin-bottom: 10px;">
                    <label>类型:</label>
                    <select id="editor-type" style="width: 100%; background: #222; color: #fff; border: 1px solid #555;">
                        <option value="siege">攻城战 (Siege)</option>
                        <option value="field_battle">野战 (Field Battle)</option>
                        <option value="narrative">叙事 (Narrative)</option>
                    </select>
                </div>

                <div style="margin-bottom: 10px;">
                    <label>描述:</label>
                    <textarea id="editor-desc" style="width: 100%; height: 40px; background: #222; color: #fff; border: 1px solid #555;"></textarea>
                </div>

                <!-- Dynamic Fields Container -->
                <div id="editor-dynamic-fields" style="margin-bottom: 15px; padding: 10px; background: #222; border-radius: 4px;">
                    <!-- Fields injected by JS -->
                </div>

                <div style="display: flex; gap: 5px; margin-bottom: 10px;">
                    <button type="button" id="editor-btn-link" style="flex: 1; background: #607D8B; color: white; border: none; padding: 8px; cursor: pointer;">📂 关联文件</button>
                    <button type="button" id="editor-btn-save" style="flex: 1; background: #E91E63; color: white; border: none; padding: 8px; cursor: pointer; display: none;">💾 写入文件</button>
                </div>
                <div style="display: flex; gap: 5px;">
                    <button type="button" id="editor-btn-execute" style="flex: 1; background: #E91E63; color: white; border: none; padding: 8px; cursor: pointer;" title="立即执行当前事件 (Ignore Date)">▶ 立即执行</button>
                    <button type="button" id="editor-btn-update" style="flex: 1; background: #2196F3; color: white; border: none; padding: 8px; cursor: pointer; display: none;">🔄 更新文件</button>
                </div>
                <div id="editor-file-status" style="margin-top: 5px; font-size: 0.8em; color: #aaa;">未关联文件</div>
            </div>
            
            <!-- Global City Datalist for Searching -->
            <datalist id="datalist-all-cities"></datalist>
        `;

        document.body.appendChild(this.container);
        this.bindEvents();
    }


    private toggle(): void {
        this._isVisible = !this._isVisible;
        if (this.container) {
            this.container.style.display = this._isVisible ? 'block' : 'none';
        }
    }

    // IEditor interface methods
    public show(): void {
        this._isVisible = true;
        if (this.container) {
            this.container.style.display = 'block';
            this.updateDynamicFields(); // [NEW] Refresh forms on open
            this.refreshCityDatalist(); // [NEW] Refresh searchable city list
        }
    }

    public hide(): void {
        this._isVisible = false;
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    public isVisible(): boolean {
        return this._isVisible;
    }

    // [NEW] Trigger the currently editing event immediately (Smart Execute)
    private async triggerCurrentEvent(): Promise<void> {
        console.log('🚀 [EventEditor] triggerCurrentEvent called');
        // Collect data from inputs directly
        const eventData = this.getCurrentFormData();
        if (!eventData) {
            alert('无法获取事件数据，请检查输入');
            return;
        }

        const game = (window as any).game;
        if (!game || !game.historicalEventManager) {
            console.error('Game or HistoricalEventManager not found');
            return;
        }

        // Check if required legion exists (for Siege events)
        if (eventData.type === 'siege' && eventData.siegeData?.legionId) {
            const legionId = eventData.siegeData.legionId;
            const legionManager = game.historicalEventManager.getLegionManager();
            let army = legionManager.getLegionById(legionId);

            if (!army) {
                console.warn(`[EventEditor] Legion "${legionId}" not found. Attempting auto-spawn...`);

                // Try to get or load script matching event year
                let script: any = null;
                if (!script && eventData.year) {
                    // Auto-load script based on event year
                    const scriptFile = `${eventData.year}.json`;
                    console.log(`[EventEditor] Auto-loading script: ${scriptFile}`);
                    try {
                        const res = await fetch(`/scripts/${scriptFile}`);
                        if (res.ok) {
                            script = await res.json();
                            console.log(`[EventEditor] Script loaded:`, script);
                        } else {
                            throw new Error(`Failed to load ${scriptFile}`);
                        }
                    } catch (e) {
                        alert(`❌ 无法加载剧本 "${scriptFile}"。请确保文件存在于 public/scripts/ 目录。`);
                        return;
                    }
                }

                if (!script) {
                    alert(`❌ 没有加载剧本。请先在脚本编辑器中加载 -${Math.abs(eventData.year)}.json 或手动生成军团。`);
                    return;
                }

                // Search for SPAWN_UNIT action matching the legionId
                let spawnAction = null;
                for (const seq of (script.sequences || [])) {
                    for (const action of (seq.actions || [])) {
                        const actionData = action.data || action;
                        if (action.type === 'SPAWN_UNIT' && actionData.unitId === legionId) {
                            spawnAction = action;
                            break;
                        }
                    }
                    if (spawnAction) break;
                }

                if (!spawnAction) {
                    console.log('[EventEditor] Available SPAWN_UNIT actions:',
                        (script.sequences || []).flatMap((s: any) =>
                            (s.actions || []).filter((a: any) => a.type === 'SPAWN_UNIT')
                        ).map((a: any) => (a.data || a).unitId)
                    );
                    alert(`❌ 在剧本中找不到生成 "${legionId}" 的 SPAWN_UNIT 指令。\n\n请确保剧本中有相应的 SPAWN_UNIT action，且 unitId 匹配。`);
                    return;
                }

                // Execute the spawn action
                console.log(`[EventEditor] Auto-spawning legion via:`, spawnAction);
                await game.cinematicManager.executeActionSequence([spawnAction]);

                // Verify spawn succeeded
                army = legionManager.getLegionById(legionId);
                if (!army) {
                    alert(`❌ 自动生成军团失败。请检查控制台日志。`);
                    return;
                }
                console.log(`✅ [EventEditor] Legion "${legionId}" auto-spawned successfully.`);
            }
        }

        // [NEW] Check if required legion exists (for Narrative events with legion movement)
        if (eventData.type === 'narrative' && eventData.narrativeData?.legionId) {
            const legionId = eventData.narrativeData.legionId;
            const legionManager = game.historicalEventManager.getLegionManager();
            let army = legionManager.getLegionById(legionId);

            if (!army) {
                console.warn(`[EventEditor] Narrative Legion "${legionId}" not found. Attempting auto-spawn...`);

                // Try to get or load script matching event year
                let script: any = null;
                if (!script && eventData.year) {
                    const scriptFile = `${eventData.year}.json`;
                    console.log(`[EventEditor] Auto-loading script: ${scriptFile}`);
                    try {
                        const res = await fetch(`/scripts/${scriptFile}`);
                        if (res.ok) {
                            script = await res.json();
                            console.log(`[EventEditor] Script loaded:`, script);
                        } else {
                            throw new Error(`Failed to load ${scriptFile}`);
                        }
                    } catch (e) {
                        alert(`❌ 无法加载剧本 "${scriptFile}"。请确保文件存在于 public/scripts/ 目录。`);
                        return;
                    }
                }

                if (!script) {
                    alert(`❌ 没有加载剧本。请先在脚本编辑器中加载 -${Math.abs(eventData.year)}.json 或手动生成军团。`);
                    return;
                }

                // Search for SPAWN_UNIT action matching the legionId
                let spawnAction = null;
                for (const seq of (script.sequences || [])) {
                    for (const action of (seq.actions || [])) {
                        const actionData = action.data || action;
                        if (action.type === 'SPAWN_UNIT' && actionData.unitId === legionId) {
                            spawnAction = action;
                            break;
                        }
                    }
                    if (spawnAction) break;
                }

                if (!spawnAction) {
                    console.log('[EventEditor] Available SPAWN_UNIT actions:',
                        (script.sequences || []).flatMap((s: any) =>
                            (s.actions || []).filter((a: any) => a.type === 'SPAWN_UNIT')
                        ).map((a: any) => (a.data || a).unitId)
                    );
                    alert(`❌ 在剧本中找不到生成 "${legionId}" 的 SPAWN_UNIT 指令。\n\n请确保剧本中有相应的 SPAWN_UNIT action，且 unitId 匹配。`);
                    return;
                }

                // Execute the spawn action
                console.log(`[EventEditor] Auto-spawning narrative legion via:`, spawnAction);
                await game.cinematicManager.executeActionSequence([spawnAction]);

                // Verify spawn succeeded
                army = legionManager.getLegionById(legionId);
                if (!army) {
                    alert(`❌ 自动生成军团失败。请检查控制台日志。`);
                    return;
                }
                console.log(`✅ [EventEditor] Narrative Legion "${legionId}" auto-spawned successfully.`);
            }
        }

        // Trigger the event
        console.log('🎬 [EventEditor] Manually triggering event:', eventData);

        // [FIX] Remember pause state before execution
        const wasPaused = game.timeSystem?.isGamePaused();

        // Temporarily unpause to allow movement simulation
        if (game.timeSystem && wasPaused) {
            console.log('[EventEditor] Temporarily unpausing for simulation...');
            game.timeSystem.setPaused(false);
        }

        // [NEW] Set test mode flag - this tells battle/event handlers to pause game after completion
        (window as any)._editorTestExecution = true;

        game.historicalEventManager.triggerEvent(eventData, true); // force=true

        console.log('✅ 事件已执行！事件完成后游戏将自动暂停。');
    }

    private bindEvents(): void {
        if (!this.container) return;
        const parseBtn = this.container.querySelector('#editor-btn-parse') as HTMLElement | null;
        const typeSelect = this.container.querySelector('#editor-type') as HTMLSelectElement | null;
        const exportBtn = this.container.querySelector('#editor-btn-export') as HTMLElement | null;
        const linkBtn = this.container.querySelector('#editor-btn-link') as HTMLElement | null;
        const saveBtn = this.container.querySelector('#editor-btn-save') as HTMLElement | null;
        const updateBtn = this.container.querySelector('#editor-btn-update') as HTMLElement | null;
        const executeBtn = this.container.querySelector('#editor-btn-execute') as HTMLElement | null;
        const eventSelect = this.container.querySelector('#editor-event-select') as HTMLSelectElement | null;

        if (parseBtn) parseBtn.onclick = () => this.handleParse();
        if (typeSelect) typeSelect.onchange = () => this.updateDynamicFields();
        if (exportBtn) exportBtn.onclick = () => this.handleExport();

        // [NEW] Bind Execute with simple log
        if (executeBtn) {
            executeBtn.onclick = () => {
                console.log('🖱️ [EventEditor] Execute Button Clicked');
                this.triggerCurrentEvent();
            };
        } else {
            console.warn('[EventEditor] Execute Button not found during bindEvents');
        }

        if (linkBtn) linkBtn.onclick = (e) => { e.preventDefault(); this.handleLinkFile(); };
        if (saveBtn) saveBtn.onclick = (e) => { e.preventDefault(); this.handleSaveToFile(); };
        if (updateBtn) updateBtn.onclick = (e) => { e.preventDefault(); this.handleUpdateFile(); };
        if (eventSelect) eventSelect.onchange = () => this.handleEventSelect();

        // 年份同步逻辑
        const yearInput = document.getElementById('editor-year') as HTMLInputElement;
        if (yearInput) {
            yearInput.oninput = () => {
                const newYear = parseInt(yearInput.value);
                if (isNaN(newYear)) return;

                const updateText = (elementId: string) => {
                    const el = document.getElementById(elementId) as HTMLTextAreaElement;
                    if (!el || !el.value) return;

                    // 替换年份：前xxx年 或 公元前xxx年 或 xxx年
                    // 如果新年份是负数，确保有"前"
                    // 如果是正数，移除"前"

                    let text = el.value;
                    const match = text.match(/(前|公元前)?(\d+)年/);

                    if (match) {
                        const oldPrefix = match[1] || '';
                        const oldYear = match[2];

                        let newPrefix = oldPrefix;
                        if (newYear < 0) {
                            if (!newPrefix) newPrefix = '前';
                        } else {
                            newPrefix = ''; // 公元后通常不加前缀，或者加"公元"
                        }

                        const absYear = Math.abs(newYear);
                        const newStr = `${newPrefix}${absYear}年`;

                        // 只替换第一次出现的年份（通常是开头的）
                        el.value = text.replace(match[0], newStr);
                    }
                };

                updateText('editor-desc');
                updateText('editor-input-text');
            };
        }

        // Initial update
        this.updateDynamicFields();
        this.loadEventList();
    }

    private loadEventList(): void {
        const select = document.getElementById('editor-event-select') as HTMLSelectElement;
        if (!select) return;

        // Clear existing options except first
        while (select.options.length > 1) {
            select.remove(1);
        }

        HISTORICAL_EVENTS.forEach((event, index) => {
            const option = document.createElement('option');
            option.value = index.toString();
            const yearStr = event.year < 0 ? `前${Math.abs(event.year)}` : `${event.year}`;
            const seasonStr = ['春', '夏', '秋', '冬'][event.season] || '春';
            option.text = `[${yearStr} ${seasonStr}] ${event.description.substring(0, 20)}...`;
            select.add(option);
        });
    }

    private handleEventSelect(): void {
        const select = document.getElementById('editor-event-select') as HTMLSelectElement;
        const updateBtn = document.getElementById('editor-btn-update');
        const saveBtn = document.getElementById('editor-btn-save');

        if (!select.value) {
            // Reset to new mode
            this.currentEditingEvent = null;
            this.originalDescription = '';
            if (updateBtn) updateBtn.style.display = 'none';
            if (saveBtn && this.fileHandler.isFileLinked()) saveBtn.style.display = 'block';
            return;
        }

        const index = parseInt(select.value);
        const event = HISTORICAL_EVENTS[index];

        if (event) {
            this.currentEditingEvent = event;
            this.originalDescription = event.description;
            this.populateForm(event);

            if (updateBtn && this.fileHandler.isFileLinked()) updateBtn.style.display = 'block';
            if (saveBtn) saveBtn.style.display = 'none'; // Hide save new when editing
        }
    }

    private async handleLinkFile(): Promise<void> {
        const fileName = await this.fileHandler.linkFile();
        if (fileName) {
            const status = document.getElementById('editor-file-status');
            const saveBtn = document.getElementById('editor-btn-save');

            if (status) status.innerText = `已关联: ${fileName}`;
            if (status) status.style.color = '#4CAF50';

            // Show appropriate button based on mode
            const updateBtn = document.getElementById('editor-btn-update');
            if (this.currentEditingEvent) {
                if (updateBtn) updateBtn.style.display = 'block';
                if (saveBtn) saveBtn.style.display = 'none';
            } else {
                if (saveBtn) saveBtn.style.display = 'block';
                if (updateBtn) updateBtn.style.display = 'none';
            }

            alert('文件关联成功！现在可以直接写入事件了。');
        }
    }

    private async handleSaveToFile(): Promise<void> {
        if (!this.fileHandler.isFileLinked()) {
            alert('请先关联 src/data/events.ts 文件！');
            return;
        }

        const event = this.getCurrentFormData();
        if (!this.validateForm(event)) return;

        const success = await this.fileHandler.saveToFile(event);
        if (success) {
            alert('✅ 事件已成功写入文件！');
        } else {
            alert('写入文件失败，请检查控制台错误信息。');
        }
    }

    private async handleUpdateFile(): Promise<void> {
        if (!this.fileHandler.isFileLinked()) {
            alert('请先关联 HistoricalEvents.ts 文件！');
            return;
        }

        if (!this.currentEditingEvent) return;

        const event = this.getCurrentFormData();
        if (!this.validateForm(event)) return;

        const success = await this.fileHandler.updateFile(this.currentEditingEvent, event);
        if (success) {
            alert('✅ 事件已成功更新！');
            this.originalDescription = event.description;
            this.currentEditingEvent = event;
        } else {
            alert('更新文件失败，请检查控制台错误信息。');
        }
    }

    private handleParse(): void {
        const input = document.getElementById('editor-input-text') as HTMLTextAreaElement;
        if (!input || !input.value.trim()) return;

        const event = EventParser.parse(input.value.trim());
        if (event) {
            this.populateForm(event);
            // alert('解析成功！请检查并确认数据。');
        } else {
            alert('解析失败，请检查格式。');
        }
    }

    private async handleGeocode(): Promise<void> {
        const locationInput = document.getElementById('field-battle-location-name') as HTMLInputElement;
        if (!locationInput || !locationInput.value.trim()) {
            alert('请先输入地点名称');
            return;
        }

        const locationName = locationInput.value.trim();
        const latInput = document.getElementById('field-battle-lat') as HTMLInputElement;
        const lngInput = document.getElementById('field-battle-lng') as HTMLInputElement;

        try {
            // 显示加载状态
            const geocodeBtn = document.getElementById('btn-geocode');
            if (geocodeBtn) {
                geocodeBtn.textContent = '⏳ 查询中...';
                (geocodeBtn as HTMLButtonElement).disabled = true;
            }

            // 使用 Nominatim API 进行地理编码
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?` +
                `format=json&q=${encodeURIComponent(locationName)}&limit=1&accept-language=zh-CN`,
                {
                    headers: {
                        'User-Agent': 'HistoricalEventEditor/1.0'
                    }
                }
            );

            if (!response.ok) {
                throw new Error('网络请求失败');
            }

            const data = await response.json();

            if (data && data.length > 0) {
                const result = data[0];
                const lat = parseFloat(result.lat);
                const lng = parseFloat(result.lon);

                if (latInput) latInput.value = lat.toString();
                if (lngInput) lngInput.value = lng.toString();

                alert(`✅ 找到坐标！\n地点：${result.display_name}\n纬度：${lat}\n经度：${lng}`);
            } else {
                alert('❌ 未找到该地点的坐标，请尝试：\n1. 使用更具体的地名\n2. 使用拼音或英文\n3. 手动输入坐标');
            }
        } catch (error) {
            console.error('Geocoding error:', error);
            alert('❌ 获取坐标失败，请检查网络连接或手动输入坐标');
        } finally {
            // 恢复按钮状态
            const geocodeBtn = document.getElementById('btn-geocode');
            if (geocodeBtn) {
                geocodeBtn.textContent = '🔍 获取坐标';
                (geocodeBtn as HTMLButtonElement).disabled = false;
            }
        }
    }

    private populateForm(event: HistoricalEvent): void {
        (document.getElementById('editor-year') as HTMLInputElement).value = event.year.toString();
        (document.getElementById('editor-season') as HTMLSelectElement).value = event.season.toString();
        (document.getElementById('editor-type') as HTMLSelectElement).value = event.type;
        (document.getElementById('editor-desc') as HTMLTextAreaElement).value = event.description;

        this.updateDynamicFields();

        // Populate dynamic fields after they are created
        setTimeout(() => {
            if (event.type === 'siege' && event.siegeData) {
                const attackerSelect = document.getElementById('field-siege-attacker') as HTMLSelectElement;
                if (attackerSelect && attackerSelect.querySelector(`option[value="${event.siegeData.attackerFactionId}"]`)) {
                    attackerSelect.value = event.siegeData.attackerFactionId;
                    // [NEW] Reload legion list based on loaded faction
                    this.reloadLegionDatalist('siege', event.siegeData.attackerFactionId);
                } else if (attackerSelect) {
                    attackerSelect.value = 'UNKNOWN';
                    this.reloadLegionDatalist('siege', 'UNKNOWN');
                }

                const troopsSelect = document.getElementById('field-siege-troops') as HTMLInputElement;
                if (troopsSelect && event.siegeData.attackerTroops) {
                    troopsSelect.value = event.siegeData.attackerTroops.toString();
                }

                // [NEW] Create Legion Radio Logic
                const newLegionRadio = document.querySelector('input[name="siege-legion-mode"][value="new"]') as HTMLInputElement;
                const existingLegionRadio = document.querySelector('input[name="siege-legion-mode"][value="existing"]') as HTMLInputElement;

                const existingContainer = document.getElementById('container-siege-existing-legion');
                const newLegionContainer = document.getElementById('container-siege-new-legion');

                const legionNameInput = document.getElementById('field-siege-legion-name') as HTMLInputElement;
                const troopsInput = document.getElementById('field-siege-troops') as HTMLInputElement;
                const sourceCityInput = document.getElementById('field-siege-source-city') as HTMLInputElement;
                const coordsInput = document.getElementById('field-siege-source-coords') as HTMLInputElement;

                if (event.siegeData.legionName) {
                    // Mode: New Legion
                    if (newLegionRadio) newLegionRadio.checked = true;
                    if (existingContainer) existingContainer.style.display = 'none';
                    if (newLegionContainer) newLegionContainer.style.display = 'block';

                    if (legionNameInput) {
                        legionNameInput.value = event.siegeData.legionName;
                    }
                    if (troopsInput && event.siegeData.attackerTroops) {
                        troopsInput.value = event.siegeData.attackerTroops.toString();
                    }

                    // Fill Source City
                    if (sourceCityInput && event.siegeData.attackerCityId) {
                        sourceCityInput.value = event.siegeData.attackerCityId;
                    }

                    // Fill Source Coords
                    if (coordsInput && event.siegeData.attackerSourceLocation) {
                        coordsInput.value = `${event.siegeData.attackerSourceLocation.lat}, ${event.siegeData.attackerSourceLocation.lng}`;
                    }

                } else {
                    // Mode: Existing Legion
                    if (existingLegionRadio) existingLegionRadio.checked = true;
                    if (existingContainer) existingContainer.style.display = 'block';
                    if (newLegionContainer) newLegionContainer.style.display = 'none';

                    // [NEW] Set selected existing legion
                    if (event.siegeData.legionId) {
                        const legionSelect = document.getElementById('field-siege-attacker-legion-select') as HTMLSelectElement;
                        if (legionSelect) {
                            legionSelect.value = event.siegeData.legionId;
                        }
                    }
                }

                // [NEW] Chain After Battle Actions
                if (event.siegeData.afterBattleChain && event.siegeData.afterBattleChain.length > 0) {
                    event.siegeData.afterBattleChain.forEach((step, i) => {
                        const stepNum = i + 1;
                        const actionSelect = document.getElementById(`field-siege-after-${stepNum}`) as HTMLSelectElement;
                        const targetSelect = document.getElementById(`field-siege-after-target-${stepNum}`) as HTMLSelectElement;
                        const nextContainer = document.getElementById(`container-step-${stepNum + 1}`);

                        if (actionSelect) {
                            actionSelect.value = step.action;
                            // Show target if needed
                            if (targetSelect && step.targetCityId) {
                                targetSelect.value = step.targetCityId;
                                targetSelect.style.display = 'block';
                            }
                            // Show next step if attack_city
                            if (nextContainer && step.action === 'attack_city') {
                                nextContainer.style.display = 'block';
                            }
                        }
                    });
                }

                // City Select (Now search-based input)
                const cityId = event.siegeData.defenderCityId;
                const cityInput = document.getElementById('field-siege-city-select') as HTMLInputElement;
                if (cityInput) {
                    cityInput.value = cityId;
                    // Trigger change to potentially validate or update logic if needed
                    cityInput.dispatchEvent(new Event('change'));
                }



                // [NEW] Speed Multiplier
                const speedInput = document.getElementById('field-siege-speed') as HTMLInputElement;
                if (speedInput && event.siegeData.speedMultiplier) {
                    speedInput.value = event.siegeData.speedMultiplier.toString();
                }

                // [NEW] Result (Preset Winner)
                const resultSelect = document.getElementById('field-siege-result') as HTMLSelectElement;
                if (resultSelect && event.siegeData.result) {
                    resultSelect.value = event.siegeData.result;
                }
            }


            // [FIELD BATTLE] Load field battle data
            if (event.type === 'field_battle' && event.fieldBattleData) {
                const fb = event.fieldBattleData;

                // Attacker faction
                const attackerSelect = document.getElementById('field-battle-attacker') as HTMLSelectElement;
                if (attackerSelect && fb.attackerFactionId) {
                    attackerSelect.value = fb.attackerFactionId;
                    // [NEW] Trigger legion list reload after setting faction
                    this.reloadLegionDatalist('attacker', fb.attackerFactionId);
                }

                // Defender faction
                const defenderSelect = document.getElementById('field-battle-defender') as HTMLSelectElement;
                if (defenderSelect && fb.defenderFactionId) {
                    defenderSelect.value = fb.defenderFactionId;
                    // [NEW] Trigger legion list reload after setting faction
                    this.reloadLegionDatalist('defender', fb.defenderFactionId);
                }

                // Attacker legion
                const attackerLegionCheckbox = document.getElementById('field-battle-create-attacker-legion') as HTMLInputElement;
                const attackerLegionContainer = document.getElementById('container-attacker-legion');
                const attackerLegionNameInput = document.getElementById('field-battle-attacker-legion-name') as HTMLInputElement;
                const attackerTroopsInput = document.getElementById('field-battle-attacker-troops') as HTMLInputElement;

                if ((fb as any).attackerLegionName) {
                    if (attackerLegionCheckbox) attackerLegionCheckbox.checked = true;
                    if (attackerLegionContainer) attackerLegionContainer.style.display = 'block';
                    if (attackerLegionNameInput) attackerLegionNameInput.value = (fb as any).attackerLegionName;
                    if (attackerTroopsInput && (fb as any).attackerTroops) {
                        attackerTroopsInput.value = (fb as any).attackerTroops.toString();
                    }
                }

                // Defender legion
                const defenderLegionCheckbox = document.getElementById('field-battle-create-defender-legion') as HTMLInputElement;
                const defenderLegionContainer = document.getElementById('container-defender-legion');
                const defenderLegionNameInput = document.getElementById('field-battle-defender-legion-name') as HTMLInputElement;
                const defenderTroopsInput = document.getElementById('field-battle-defender-troops') as HTMLInputElement;

                if ((fb as any).defenderLegionName) {
                    if (defenderLegionCheckbox) defenderLegionCheckbox.checked = true;
                    if (defenderLegionContainer) defenderLegionContainer.style.display = 'block';
                    if (defenderLegionNameInput) defenderLegionNameInput.value = (fb as any).defenderLegionName;
                    if (defenderTroopsInput && (fb as any).defenderTroops) {
                        defenderTroopsInput.value = (fb as any).defenderTroops.toString();
                    }
                }

                // Location
                if (fb.location) {
                    const latInput = document.getElementById('field-battle-lat') as HTMLInputElement;
                    const lngInput = document.getElementById('field-battle-lng') as HTMLInputElement;
                    if (latInput) latInput.value = fb.location.lat.toString();
                    if (lngInput) lngInput.value = fb.location.lng.toString();
                }

                // After battle action
                const afterBattleSelect = document.getElementById('field-battle-after') as HTMLSelectElement;
                if (afterBattleSelect) {
                    // [NEW] Check for siegeAfterBattleChain with destroy action
                    if ((fb as any).siegeAfterBattleChain && (fb as any).siegeAfterBattleChain.length > 0) {
                        const firstAction = (fb as any).siegeAfterBattleChain[0];
                        if (firstAction.action === 'destroy') {
                            afterBattleSelect.value = 'destroy';
                            afterBattleSelect.dispatchEvent(new Event('change'));
                        } else if (fb.afterBattle) {
                            afterBattleSelect.value = fb.afterBattle;
                            afterBattleSelect.dispatchEvent(new Event('change'));
                        }
                    } else if (fb.afterBattle) {
                        afterBattleSelect.value = fb.afterBattle;
                        afterBattleSelect.dispatchEvent(new Event('change'));
                    }
                }

                // After battle target city
                const siegeTargetSelect = document.getElementById('field-battle-siege-target') as HTMLSelectElement;
                const siegeTargetContainer = document.getElementById('container-field-battle-siege-target');
                const siegeChainContainer = document.getElementById('container-field-battle-siege-chain');

                if (siegeTargetSelect && (fb as any).afterBattleTargetCityId) {
                    siegeTargetSelect.value = (fb as any).afterBattleTargetCityId;
                }

                // [IMPORTANT] 显示容器 - 攻城时显示目标城市和行动链
                if (fb.afterBattle === 'siege' || fb.afterBattle === 'move_to_city') {
                    if (siegeTargetContainer) siegeTargetContainer.style.display = 'block';
                }
                if (fb.afterBattle === 'siege' && siegeChainContainer) {
                    siegeChainContainer.style.display = 'block';
                }

                // [NEW] Populate Siege After-Battle Chain
                if ((fb as any).siegeAfterBattleChain && (fb as any).siegeAfterBattleChain.length > 0) {
                    (fb as any).siegeAfterBattleChain.forEach((step: any, i: number) => {
                        const stepNum = i + 1;
                        const actionSelect = document.getElementById(`field-battle-siege-chain-${stepNum}`) as HTMLSelectElement;
                        const targetSelect = document.getElementById(`field-battle-siege-chain-target-${stepNum}`) as HTMLSelectElement;
                        const nextContainer = document.getElementById(`container-field-battle-siege-chain-step-${stepNum + 1}`);

                        if (actionSelect) {
                            actionSelect.value = step.action;
                            // Show target if needed
                            if (targetSelect && step.targetCityId) {
                                targetSelect.value = step.targetCityId;
                                targetSelect.style.display = 'block';
                            }
                            // Show next step if attack_city
                            if (nextContainer && step.action === 'attack_city') {
                                nextContainer.style.display = 'block';
                            }
                        }
                    });
                }

                // Result
                const resultSelect = document.getElementById('field-battle-result') as HTMLSelectElement;
                if (resultSelect && fb.result) {
                    resultSelect.value = fb.result;
                }

                // [NEW] Speed Multiplier
                const speedInput = document.getElementById('field-battle-speed') as HTMLInputElement;
                if (speedInput && fb.speedMultiplier) {
                    speedInput.value = fb.speedMultiplier.toString();
                }
            }

            // [NEW] Narrative Event Population
            if (event.type === 'narrative' && event.narrativeData) {
                const nd = event.narrativeData;

                // Faction
                const factionSelect = document.getElementById('field-narrative-faction') as HTMLSelectElement;
                if (factionSelect && nd.factionId) {
                    factionSelect.value = nd.factionId;
                    // Trigger legion list reload
                    this.reloadLegionDatalist('narrative', nd.factionId);
                }

                // Legion (need to wait for datalist to populate)
                setTimeout(() => {
                    const legionSelect = document.getElementById('field-narrative-legion-select') as HTMLSelectElement;
                    if (legionSelect && nd.legionId) {
                        legionSelect.value = nd.legionId;
                    }
                }, 100);

                // Move to city
                const moveCitySelect = document.getElementById('field-narrative-move-city') as HTMLSelectElement;
                if (moveCitySelect && nd.moveToCityId) {
                    moveCitySelect.value = nd.moveToCityId;
                }

                // Coordinates
                const latInput = document.getElementById('field-narrative-lat') as HTMLInputElement;
                const lngInput = document.getElementById('field-narrative-lng') as HTMLInputElement;
                if (nd.moveToLocation) {
                    if (latInput) latInput.value = nd.moveToLocation.lat.toString();
                    if (lngInput) lngInput.value = nd.moveToLocation.lng.toString();
                }

                // [NEW] After-Battle Chain
                if (nd.afterBattleChain) {
                    nd.afterBattleChain.forEach((step: any, index: number) => {
                        const i = index + 1;
                        const actionSelect = document.getElementById(`field-narrative-after-${i}`) as HTMLSelectElement;
                        const targetInp = document.getElementById(`field-narrative-after-target-${i}`) as HTMLInputElement;

                        if (actionSelect) {
                            actionSelect.value = step.action;
                            actionSelect.dispatchEvent(new Event('change'));
                        }
                        if (targetInp && step.targetCityId) {
                            targetInp.value = step.targetCityId;
                            targetInp.dispatchEvent(new Event('change'));
                        }
                    });
                }

                // [NEW] Speed Multiplier
                const speedInput = document.getElementById('field-narrative-speed') as HTMLInputElement;
                if (speedInput && nd.speedMultiplier) {
                    speedInput.value = nd.speedMultiplier.toString();
                }
            }
        }, 0);
    }

    private updateDynamicFields(): void {
        const event: any = this.currentEditingEvent || { siegeData: {}, fieldBattleData: {} };
        const container = document.getElementById('editor-dynamic-fields');
        const type = (document.getElementById('editor-type') as HTMLSelectElement).value;
        if (!container) return;

        container.innerHTML = '';

        // Generate city options for reuse
        let cityOptions = `<option value="">-- 请选择城市 --</option>`;
        if (this.cityManager) {
            const cities = this.cityManager.getCities();
            cities.forEach((c: any) => {
                cityOptions += `<option value="${c.id}">${c.name} (${c.id})</option>`;
            });
        }

        // Helper to generate faction options
        // Based on User's "General Terms" list
        const factions = [
            { id: 'qin', name: '秦' },
            { id: 'zhonghua', name: '中华' },
            { id: 'tianchao', name: '天朝' },
            { id: 'chaoxian', name: '朝鲜' },
            { id: 'menggu', name: '蒙古' },
            { id: 'qiangzang', name: '羌藏' },
            { id: 'huihui', name: '回回' },
            { id: 'manzhou', name: '满洲' },
            { id: 'yuenan', name: '越南' },
            { id: 'dianmian', name: '滇缅' },
            { id: 'riben', name: '日本' },
            { id: 'xiyu', name: '西域' },
            { id: 'xiyang', name: '西洋' },
            { id: 'panjun', name: '叛军' }
        ];

        const createFactionSelect = (id: string, label?: string) => {
            let options = `<option value="UNKNOWN">-- 请选择 --</option>`;
            factions.forEach(f => {
                options += `<option value="${f.id}">${f.name} (${f.id})</option>`;
            });
            return `<select id="${id}" style="width: 100%; margin-bottom: 5px; background: #333; color: #fff; border: 1px solid #555;">${options}</select>`;
        };

        if (type === 'siege') {
            // Options generated above used here


            container.innerHTML = `
        <div style="margin-bottom: 5px;"><small>攻城战数据</small></div>
        
        <!-- 1. 进攻方 -->
        <label>进攻方:</label>
        ${createFactionSelect('field-siege-attacker')}
        
        <!-- 2. 军团选择 (新建/现有) -->
        <div style="border: 1px solid #4CAF50; padding: 10px; margin-bottom: 10px; border-radius: 4px;">
            <label style="color: #4CAF50;">⚔️ 进攻军团:</label>
            
            <div style="margin: 8px 0;">
                <label style="display: block; margin-bottom: 5px; cursor: pointer;">
                    <input type="radio" name="siege-legion-mode" value="existing" checked style="margin-right: 5px;">
                    选择现有军团
                </label>
                <label style="display: block; cursor: pointer;">
                    <input type="radio" name="siege-legion-mode" value="new" style="margin-right: 5px;">
                    新建军团
                </label>
            </div>
            
            <!-- 现有军团选择 -->
            <div id="container-siege-existing-legion" style="margin-top: 8px;">
                <select id="field-siege-attacker-legion-select" style="width: 100%; height: 32px; background: #333; color: #fff; border: 1px solid #555;">
                    <option value="">-- 请先选择势力 --</option>
                </select>
            </div>
            
            <!-- 新建军团表单 -->
            <div id="container-siege-new-legion" style="display: none; margin-top: 8px; padding: 8px; background: #2a2a2a; border-radius: 4px;">
                <div style="margin-bottom: 8px;">
                    <label style="font-size: 12px;">军团名称:</label>
                    <input type="text" id="field-siege-legion-name" placeholder="如: 关中锐士" style="width: 100%; background: #333; color: #fff; border: 1px solid #555; height: 28px; padding: 0 8px;">
                </div>
                <div>
                    <label style="font-size: 12px;">军团兵力:</label>
                    <input type="number" id="field-siege-troops" value="50000" style="width: 100%; background: #333; color: #fff; border: 1px solid #555; height: 28px; padding: 0 8px;">
                </div>
                <div style="margin-top: 8px;">
                    <label style="font-size: 12px;">出发城市 (用于生成位置):</label>
                    <div style="display: flex; gap: 5px;">
                        <input id="field-siege-source-city" list="datalist-all-cities" placeholder="选择城市..." style="flex: 1; background: #333; color: #fff; border: 1px solid #555; height: 28px; padding: 0 8px;">
                        <button id="btn-siege-pick-source-city" title="地图选城" style="background: #FF9800; color: white; border: none; padding: 0 10px; cursor: pointer; border-radius: 4px;">📍</button>
                    </div>
                </div>
                <div style="margin-top: 5px;">
                    <label style="font-size: 12px;">或 粘贴坐标 (Lat, Lng):</label>
                    <input type="text" id="field-siege-source-coords" placeholder="例如: 39.35, 115.5" style="width: 100%; background: #333; color: #fff; border: 1px solid #555; height: 28px; padding: 0 8px;">
                    <small style="color: #888;">可直接粘贴右键获取的坐标，覆盖上方选择</small>
                </div>
            </div>
        </div>
        
        <!-- 3. 目标城市 -->
        <label>目标城市:</label>
        <div style="display: flex; gap: 5px; margin-bottom: 10px;">
            <input id="field-siege-city-select" list="datalist-all-cities" placeholder="搜索并回填..." style="flex: 1; background: #333; color: #fff; border: 1px solid #555; height: 32px; padding: 0 8px;">
            <button id="btn-siege-pick-city" title="地图选城" style="background: #FF9800; color: white; border: none; padding: 0 10px; cursor: pointer; border-radius: 4px;">📍 选城</button>
        </div>
        
        <!-- 4. 预设结果 -->
        <label>预设结果 (胜利方):</label>
        <select id="field-siege-result" style="width: 100%; margin-bottom: 10px; background: #333; color: #fff; border: 1px solid #555;">
            <option value="">-- 自然战斗 (Normal) --</option>
            <option value="attacker_win">进攻方胜利 (Attacker Win)</option>
            <option value="defender_win">防守方胜利 (Defender Win)</option>
        </select>

        <!-- 5. 速度系数 -->
        <label>行军速度系数:</label>
        <input type="number" id="field-siege-speed" value="1.0" step="0.1" min="0.1" max="10" style="width: 100%; margin-bottom: 5px; background: #333; color: #fff; border: 1px solid #555;">
        <small style="color: grey; display: block; margin-bottom: 10px;">1.0=标准速度, 2.0=急行军, 0.5=缓慢逼近</small>

        <!-- 6. 链式战后行动 (最多4步) -->
        <div style="border: 1px solid #555; padding: 10px; margin-bottom: 10px;">
            <label style="color: #4CAF50;">战后行动链 (最多4步):</label>
            <small style="color: grey; display: block; margin-bottom: 5px;">可连续执行多个行动，选择"驻扎"结束行动链</small>
            
            <!-- 步骤1 -->
            <div class="after-battle-step" style="margin-bottom: 8px; padding: 5px; background: #2a2a2a;">
                <label style="font-size: 12px;">步骤1:</label>
                <select id="field-siege-after-1" style="width: 100%; margin-bottom: 3px; background: #333; color: #fff; border: 1px solid #555;">
                    <option value="garrison">驻扎 (结束)</option>
                    <option value="destroy">解散军团 (销毁)</option>
                    <option value="move_to_city">移动至城市 →</option>
                    <option value="attack_city">攻打城市 →</option>
                </select>
                <div style="display: flex; gap: 5px; margin-top: 3px;">
                    <input id="field-siege-after-target-1" list="datalist-all-cities" placeholder="移动/攻打目标..." style="flex: 1; background: #333; color: #fff; border: 1px solid #555; display: none; height: 32px; padding: 0 8px;">
                    <button id="btn-siege-after-pick-city-1" title="地图选城" style="background: #FF9800; color: white; border: none; padding: 0 10px; cursor: pointer; border-radius: 4px; display: none;">📍 选城</button>
                </div>
            </div>
            
            <!-- 步骤2 -->
            <div id="container-step-2" class="after-battle-step" style="margin-bottom: 8px; padding: 5px; background: #2a2a2a; display: none;">
                <label style="font-size: 12px;">步骤2:</label>
                <select id="field-siege-after-2" style="width: 100%; margin-bottom: 3px; background: #333; color: #fff; border: 1px solid #555;">
                    <option value="garrison">驻扎 (结束)</option>
                    <option value="destroy">解散军团 (销毁)</option>
                    <option value="move_to_city">移动至城市 →</option>
                    <option value="attack_city">攻打城市 →</option>
                </select>
                <div style="display: flex; gap: 5px; margin-top: 3px;">
                    <input id="field-siege-after-target-2" list="datalist-all-cities" placeholder="移动/攻打目标..." style="flex: 1; background: #333; color: #fff; border: 1px solid #555; display: none; height: 32px; padding: 0 8px;">
                    <button id="btn-siege-after-pick-city-2" title="地图选城" style="background: #FF9800; color: white; border: none; padding: 0 10px; cursor: pointer; border-radius: 4px; display: none;">📍 选城</button>
                </div>
            </div>
            
            <!-- 步骤3 -->
            <div id="container-step-3" class="after-battle-step" style="margin-bottom: 8px; padding: 5px; background: #2a2a2a; display: none;">
                <label style="font-size: 12px;">步骤3:</label>
                <select id="field-siege-after-3" style="width: 100%; margin-bottom: 3px; background: #333; color: #fff; border: 1px solid #555;">
                    <option value="garrison">驻扎 (结束)</option>
                    <option value="destroy">解散军团 (销毁)</option>
                    <option value="move_to_city">移动至城市 →</option>
                    <option value="attack_city">攻打城市 →</option>
                </select>
                <div style="display: flex; gap: 5px; margin-top: 3px;">
                    <input id="field-siege-after-target-3" list="datalist-all-cities" placeholder="移动/攻打目标..." style="flex: 1; background: #333; color: #fff; border: 1px solid #555; display: none; height: 32px; padding: 0 8px;">
                    <button id="btn-siege-after-pick-city-3" title="地图选城" style="background: #FF9800; color: white; border: none; padding: 0 10px; cursor: pointer; border-radius: 4px; display: none;">📍 选城</button>
                </div>
            </div>
            
            <!-- 步骤4 -->
            <div id="container-step-4" class="after-battle-step" style="margin-bottom: 8px; padding: 5px; background: #2a2a2a; display: none;">
                <label style="font-size: 12px;">步骤4 (最后):</label>
                <select id="field-siege-after-4" style="width: 100%; margin-bottom: 3px; background: #333; color: #fff; border: 1px solid #555;">
                    <option value="garrison">驻扎 (结束)</option>
                    <option value="destroy">解散军团 (销毁)</option>
                    <option value="move_to_city">移动至城市 (最后)</option>
                </select>
                <div style="display: flex; gap: 5px; margin-top: 3px;">
                    <input id="field-siege-after-target-4" list="datalist-all-cities" placeholder="移动/攻打目标..." style="flex: 1; background: #333; color: #fff; border: 1px solid #555; display: none; height: 32px; padding: 0 8px;">
                    <button id="btn-siege-after-pick-city-4" title="地图选城" style="background: #FF9800; color: white; border: none; padding: 0 10px; cursor: pointer; border-radius: 4px; display: none;">📍 选城</button>
                </div>
            </div>
        </div>
    `;

            // 绑定事件
            setTimeout(() => {
                // [NEW] Legion Mode Radio Button Logic
                const legionModeRadios = document.querySelectorAll('input[name="siege-legion-mode"]');
                const existingLegionContainer = document.getElementById('container-siege-existing-legion');
                const newLegionContainer = document.getElementById('container-siege-new-legion');

                const updateLegionModeUI = () => {
                    const selectedMode = (document.querySelector('input[name="siege-legion-mode"]:checked') as HTMLInputElement)?.value;
                    if (selectedMode === 'new') {
                        if (existingLegionContainer) existingLegionContainer.style.display = 'none';
                        if (newLegionContainer) newLegionContainer.style.display = 'block';
                    } else {
                        if (existingLegionContainer) existingLegionContainer.style.display = 'block';
                        if (newLegionContainer) newLegionContainer.style.display = 'none';
                    }
                };

                legionModeRadios.forEach(radio => {
                    radio.addEventListener('change', updateLegionModeUI);
                });
                updateLegionModeUI(); // Initial state

                // [NEW] Bind Faction Change logic
                const attackerSelect = document.getElementById('field-siege-attacker') as HTMLSelectElement;
                if (attackerSelect) {
                    attackerSelect.addEventListener('change', () => {
                        this.reloadLegionDatalist('siege', attackerSelect.value);
                    });
                    // Initial load
                    this.reloadLegionDatalist('siege', attackerSelect.value);
                }

                // [NEW] Main Siege City Picker
                const siegeCityInp = document.getElementById('field-siege-city-select');
                const siegeCityPickBtn = document.getElementById('btn-siege-pick-city');
                if (siegeCityInp) {
                    siegeCityInp.onchange = () => {
                        const cityId = (siegeCityInp as any).value;
                        const city = (this.cityManager as any)?.getCities().find((c: any) => c.id === cityId || c.name === cityId);
                        if (city) {
                            (siegeCityInp as any).value = city.id;
                        }
                    };
                }
                if (siegeCityPickBtn) {
                    siegeCityPickBtn.onclick = () => {
                        this.pickCityFromMap((cityId: string) => {
                            if (siegeCityInp) {
                                (siegeCityInp as any).value = cityId;
                                siegeCityInp.dispatchEvent(new Event('change'));
                            }
                        });
                    };
                }

                // [NEW] Siege Source City Picker (for New Legion)
                const siegeSourceCityInp = document.getElementById('field-siege-source-city');
                const siegeSourceCityPickBtn = document.getElementById('btn-siege-pick-source-city');

                if (siegeSourceCityInp) {
                    siegeSourceCityInp.onchange = () => {
                        const cityId = (siegeSourceCityInp as any).value;
                        const city = (this.cityManager as any)?.getCities().find((c: any) => c.id === cityId || c.name === cityId);
                        if (city) (siegeSourceCityInp as any).value = city.id;

                        // [UX] Clear Coords if city selected to avoid confusion
                        if (document.getElementById('field-siege-source-coords')) {
                            (document.getElementById('field-siege-source-coords') as HTMLInputElement).value = '';
                        }
                    };
                }

                // [NEW] Coords Input Logic (Clear city if coords entered)
                const coordsInp = document.getElementById('field-siege-source-coords') as HTMLInputElement;
                if (coordsInp) {
                    coordsInp.oninput = () => {
                        if (coordsInp.value.trim() !== '' && siegeSourceCityInp) {
                            (siegeSourceCityInp as any).value = '';
                        }
                    };
                }
                if (siegeSourceCityPickBtn) {
                    siegeSourceCityPickBtn.onclick = () => {
                        this.pickCityFromMap((cityId: string) => {
                            if (siegeSourceCityInp) {
                                (siegeSourceCityInp as any).value = cityId;
                            }
                        });
                    };
                }



                // [NEW] Chain After-Battle Actions (4 steps)
                const setupChainActions = () => {
                    for (let i = 1; i <= 4; i++) {
                        const actionSelect = document.getElementById(`field-siege-after-${i}`) as HTMLSelectElement;
                        const targetInput = document.getElementById(`field-siege-after-target-${i}`) as HTMLInputElement;
                        const pickBtn = document.getElementById(`btn-siege-after-pick-city-${i}`) as HTMLButtonElement;
                        const nextStepContainer = document.getElementById(`container-step-${i + 1}`);

                        gameLog('editorDebug', `[DEBUG setupChainActions] Binding step ${i}: actionSelect=${!!actionSelect}, nextStepContainer=${!!nextStepContainer}`);

                        if (actionSelect) {
                            // Use addEventListener instead of onchange to ensure proper binding
                            actionSelect.addEventListener('change', () => {
                                const val = actionSelect.value;
                                gameLog('editorDebug', `[DEBUG] Step ${i} changed to: ${val}`);
                                const isMoveOrAttack = (val === 'move_to_city' || val === 'attack_city');

                                if (targetInput) targetInput.style.display = isMoveOrAttack ? 'block' : 'none';
                                if (pickBtn) pickBtn.style.display = isMoveOrAttack ? 'block' : 'none';

                                if (nextStepContainer) {
                                    // destroy and garrison end the chain
                                    const isEnd = (val === 'garrison' || val === 'destroy');
                                    nextStepContainer.style.display = isEnd ? 'none' : 'block';
                                }
                            });
                            // Trigger initial state
                            actionSelect.dispatchEvent(new Event('change'));
                        }

                        // Bind pick button
                        if (pickBtn && targetInput) {
                            pickBtn.onclick = () => {
                                this.pickCityFromMap((cityId: string) => {
                                    targetInput.value = cityId;
                                    targetInput.dispatchEvent(new Event('input')); // or change
                                });
                            };
                        }

                        // Bind target input normalization
                        if (targetInput) {
                            targetInput.onchange = () => {
                                const cityId = targetInput.value;
                                const city = (this.cityManager as any)?.getCities().find((c: any) => c.id === cityId || c.name === cityId);
                                if (city) targetInput.value = city.id;
                            };
                        }
                    }
                };
                setupChainActions();
            }, 0);

        } else if (type === 'field_battle') {
            container.innerHTML = `
        <div style="margin-bottom: 5px;"><small>野战数据</small></div>
        
        <!-- 进攻方 -->
        <div style="border: 1px solid #4CAF50; padding: 8px; margin-bottom: 10px; border-radius: 4px;">
            <label style="color: #4CAF50;">⚔️ 进攻方:</label>
            ${createFactionSelect('field-battle-attacker')}
            
            <div style="margin-top: 8px;">
                <input type="checkbox" id="field-battle-create-attacker-legion">
                <label for="field-battle-create-attacker-legion" style="display: inline;">创建新军团</label>
            </div>
            <div id="container-attacker-legion" style="display: none; margin-top: 5px; padding: 5px; background: #2a2a2a;">
                <label>军团名称:</label>
                <input type="text" id="field-battle-attacker-legion-name" placeholder="例如：秦军先锋" style="width: 100%; background: #333; color: #fff; border: 1px solid #555; margin-bottom: 5px;">
                <label>军团兵力:</label>
                <input type="number" id="field-battle-attacker-troops" value="20000" style="width: 100%; background: #333; color: #fff; border: 1px solid #555;">
            </div>
            
            <!-- [NEW] Multi-Legion Selection -->
            <div style="margin-top: 8px;">
                 <label style="color: #aaa; font-size: 0.9em;">选择参战军团 (多选):</label>
                 <div id="container-field-battle-attacker-legion-select" style="max-height: 120px; overflow-y: auto; background: #222; border: 1px solid #444; padding: 5px; margin-top: 5px;"></div>
            </div>
        </div>
        
        <!-- 防守方 -->
        <div style="border: 1px solid #E91E63; padding: 8px; margin-bottom: 10px; border-radius: 4px;">
            <label style="color: #E91E63;">🛡️ 防守方:</label>
            ${createFactionSelect('field-battle-defender')}
            
            <div style="margin-top: 8px;">
                <input type="checkbox" id="field-battle-create-defender-legion">
                <label for="field-battle-create-defender-legion" style="display: inline;">创建新军团</label>
            </div>
            <div id="container-defender-legion" style="display: none; margin-top: 5px; padding: 5px; background: #2a2a2a;">
                <label>军团名称:</label>
                <input type="text" id="field-battle-defender-legion-name" placeholder="例如：燕军守卫" style="width: 100%; background: #333; color: #fff; border: 1px solid #555; margin-bottom: 5px;">
                <label>军团兵力:</label>
                <input type="number" id="field-battle-defender-troops" value="10000" style="width: 100%; background: #333; color: #fff; border: 1px solid #555;">
            </div>

            <!-- [NEW] Multi-Legion Selection -->
            <div style="margin-top: 8px;">
                 <label style="color: #aaa; font-size: 0.9em;">选择参战军团 (多选):</label>
                 <div id="container-field-battle-defender-legion-select" style="max-height: 120px; overflow-y: auto; background: #222; border: 1px solid #444; padding: 5px; margin-top: 5px;"></div>
            </div>
        </div>
        
        <!-- 战场位置 -->
        <div style="margin-bottom: 10px;">
            <label>战场位置:</label>
            <div style="display: flex; gap: 5px; margin-bottom: 5px;">
                <input id="field-battle-location-name" list="datalist-all-cities" placeholder="搜索战场城市或地点..." style="flex: 1; background: #333; color: #fff; border: 1px solid #555; height: 32px; padding: 0 8px;">
                <button id="btn-field-battle-location-pick-city" title="地图选城" style="background: #FF9800; color: white; border: none; padding: 0 10px; cursor: pointer; border-radius: 4px;">📍 选城</button>
                <button id="btn-geocode-location" style="background: #4CAF50; color: white; border: none; padding: 5px 10px; cursor: pointer;">🔍 查坐标</button>
            </div>
            
            <label>坐标 (Lat, Lng):</label>
            <div style="display: flex; gap: 5px; margin-bottom: 5px;">
                <input id="field-battle-lat" type="number" step="any" placeholder="Lat" style="flex: 1; background: #333; color: #fff; border: 1px solid #555;">
                <input id="field-battle-lng" type="number" step="any" placeholder="Lng" style="flex: 1; background: #333; color: #fff; border: 1px solid #555;">
            </div>
        </div>
        
        <!-- 战后行为 -->
        <div style="margin-bottom: 10px;">
            <label>战后行为:</label>
            <select id="field-battle-after" style="width: 100%; background: #333; color: #fff; border: 1px solid #555; margin-bottom: 5px;">
                <option value="garrison">驻扎</option>
                <option value="destroy">解散军团</option>
                <option value="move_to_city">移动至指定城市</option>
                <option value="siege">发起攻城 (Siege)</option>
            </select>
            
            <div id="container-field-battle-siege-target" style="display: none;">
                <label id="field-battle-target-label" style="color: #FF5722; font-size: 12px; display: block; margin-top: 5px;">目标城市:</label>
                <div style="display: flex; gap: 5px; margin-bottom: 5px;">
                    <input id="field-battle-siege-target" list="datalist-all-cities" placeholder="搜索并回填..." style="flex: 1; background: #333; color: #fff; border: 1px solid #555; height: 32px; padding: 0 8px;">
                    <button id="btn-field-battle-pick-city" title="地图选城" style="background: #FF9800; color: white; border: none; padding: 0 10px; cursor: pointer; border-radius: 4px;">📍 选城</button>
                </div>

                <!-- [IMPORTANT] 野战攻城后行动链 (最多4步) - 与攻城战保持一致，请勿删减步骤 -->
                <div id="container-field-battle-siege-chain" style="border: 1px solid #555; padding: 10px; margin-top: 10px; border-radius: 4px; display: none;">
                    <label style="color: #FF9800; font-size: 12px;">攻城后行动链 (胜利后, 最多4步):</label>
                    
                    <!-- Step 1 -->
                    <div class="after-battle-step" style="margin-bottom: 8px; padding: 5px; background: #2a2a2a;">
                        <label style="font-size: 12px;">步骤1:</label>
                        <select id="field-battle-siege-chain-1" style="width: 100%; margin-bottom: 3px; background: #333; color: #fff; border: 1px solid #555;">
                            <option value="garrison">驻扎 (结束)</option>
<option value="destroy">解散军团 (销毁)</option>
                            <option value="move_to_city">移动至城市 →</option>
                            <option value="attack_city">攻打城市 →</option>
                        </select>
                <div style="display: flex; gap: 5px; margin-top: 3px;">
                    <input id="field-battle-siege-chain-target-1" list="datalist-all-cities" placeholder="移动/攻打目标..." style="flex: 1; background: #333; color: #fff; border: 1px solid #555; display: none; height: 32px; padding: 0 8px;">
                    <button id="btn-field-battle-siege-chain-pick-city-1" title="地图选城" style="background: #FF9800; color: white; border: none; padding: 0 10px; cursor: pointer; border-radius: 4px; display: none;">📍 选城</button>
                </div>
                    </div>

                    <!-- Step 2 -->
                    <div id="container-field-battle-siege-chain-step-2" style="margin-bottom: 8px; padding: 5px; background: #2a2a2a; display: none;">
                        <label style="font-size: 12px;">步骤2:</label>
                        <select id="field-battle-siege-chain-2" style="width: 100%; margin-bottom: 3px; background: #333; color: #fff; border: 1px solid #555;">
                            <option value="garrison">驻扎 (结束)</option>
<option value="destroy">解散军团 (销毁)</option>
                            <option value="move_to_city">移动至城市 →</option>
                            <option value="attack_city">攻打城市 →</option>
                        </select>
                        <div style="display: flex; gap: 5px; margin-top: 3px;">
                            <input id="field-battle-siege-chain-target-2" list="datalist-all-cities" placeholder="移动/攻打目标..." style="flex: 1; background: #333; color: #fff; border: 1px solid #555; display: none; height: 32px; padding: 0 8px;">
                            <button id="btn-field-battle-siege-chain-pick-city-2" title="地图选城" style="background: #FF9800; color: white; border: none; padding: 0 10px; cursor: pointer; border-radius: 4px; display: none;">📍 选城</button>
                        </div>
                    </div>

                    <!-- Step 3 -->
                    <div id="container-field-battle-siege-chain-step-3" style="margin-bottom: 8px; padding: 5px; background: #2a2a2a; display: none;">
                        <label style="font-size: 12px;">步骤3:</label>
                        <select id="field-battle-siege-chain-3" style="width: 100%; margin-bottom: 3px; background: #333; color: #fff; border: 1px solid #555;">
                            <option value="garrison">驻扎 (结束)</option>
<option value="destroy">解散军团 (销毁)</option>
                            <option value="move_to_city">移动至城市 →</option>
                            <option value="attack_city">攻打城市 →</option>
                        </select>
                        <div style="display: flex; gap: 5px; margin-top: 3px;">
                            <input id="field-battle-siege-chain-target-3" list="datalist-all-cities" placeholder="移动/攻打目标..." style="flex: 1; background: #333; color: #fff; border: 1px solid #555; display: none; height: 32px; padding: 0 8px;">
                            <button id="btn-field-battle-siege-chain-pick-city-3" title="地图选城" style="background: #FF9800; color: white; border: none; padding: 0 10px; cursor: pointer; border-radius: 4px; display: none;">📍 选城</button>
                        </div>
                    </div>

                    <!-- Step 4 (最后一步，不含"攻打城市"选项) -->
                    <div id="container-field-battle-siege-chain-step-4" style="margin-bottom: 8px; padding: 5px; background: #2a2a2a; display: none;">
                        <label style="font-size: 12px;">步骤4 (最后):</label>
                        <select id="field-battle-siege-chain-4" style="width: 100%; margin-bottom: 3px; background: #333; color: #fff; border: 1px solid #555;">
                            <option value="garrison">驻扎 (结束)</option>
<option value="destroy">解散军团 (销毁)</option>
                            <option value="move_to_city">移动至城市 (最后)</option>
                        </select>
                        <div style="display: flex; gap: 5px; margin-top: 3px;">
                            <input id="field-battle-siege-chain-target-4" list="datalist-all-cities" placeholder="移动/攻打目标..." style="flex: 1; background: #333; color: #fff; border: 1px solid #555; display: none; height: 32px; padding: 0 8px;">
                            <button id="btn-field-battle-siege-chain-pick-city-4" title="地图选城" style="background: #FF9800; color: white; border: none; padding: 0 10px; cursor: pointer; border-radius: 4px; display: none;">📍 选城</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 预设胜利方 -->
        <div style="margin-bottom: 10px; padding: 10px; border: 1px solid #E91E63; border-radius: 4px;">
            <label style="color: #E91E63;">🏆 预设胜利方:</label>
            <select id="field-battle-result" style="width: 100%; background: #333; color: #fff; border: 1px solid #555;">
                <option value="">-- 实时计算 (不预设) --</option>
                <option value="attacker_win">进攻方胜利</option>
                <option value="defender_win">防守方胜利</option>
            </select>
            <small style="color: #aaa;">设置后，战斗结果固定，胜者保留10%-30%兵力</small>
        </div>

        <!-- 6. 行军速度 (新增) -->
        <div style="margin-bottom: 10px; padding: 10px; border: 1px solid #00BCD4; border-radius: 4px;">
            <label style="color: #00BCD4;">⚡ 行军速度系数:</label>
            <input type="number" id="field-battle-speed" value="1.0" step="0.1" min="0.1" max="10" style="width: 100%; margin-bottom: 5px; background: #333; color: #fff; border: 1px solid #555;">
            <small style="color: grey; display: block;">1.0=标准, 2.0=急行军, 0.5=缓慢</small>
        </div>

        <!-- 7. 战斗时长 (新增) -->
        <div style="margin-bottom: 10px; padding: 10px; border: 1px solid #9C27B0; border-radius: 4px;">
            <label style="color: #9C27B0;">⏱️ 战斗时长 (秒):</label>
            <input type="number" id="field-battle-duration" value="7" step="1" min="1" max="60" style="width: 100%; margin-bottom: 5px; background: #333; color: #fff; border: 1px solid #555;">
            <small style="color: grey; display: block;">战斗固定持续此时长 (默认7秒)</small>
        </div>
    `;

            // 绑定事件
            setTimeout(() => {
                // [NEW] Bind Faction Selectors to Legion List
                ['attacker', 'defender'].forEach(side => {
                    const select = document.getElementById(`field-battle-${side}`) as HTMLSelectElement;
                    if (select) {
                        select.addEventListener('change', () => {
                            this.reloadLegionList(side as any, select.value);
                        });
                        // Initial load
                        this.reloadLegionList(side as any, select.value);
                    }
                });

                const geocodeLocationBtn = document.getElementById('btn-geocode-location');

                // Attacker legion checkbox toggle
                const attackerLegionCheckbox = document.getElementById('field-battle-create-attacker-legion') as HTMLInputElement;
                const attackerLegionContainer = document.getElementById('container-attacker-legion');
                if (attackerLegionCheckbox && attackerLegionContainer) {
                    attackerLegionCheckbox.onchange = () => {
                        attackerLegionContainer.style.display = attackerLegionCheckbox.checked ? 'block' : 'none';
                    };
                }

                // Defender legion checkbox toggle
                const defenderLegionCheckbox = document.getElementById('field-battle-create-defender-legion') as HTMLInputElement;
                const defenderLegionContainer = document.getElementById('container-defender-legion');
                if (defenderLegionCheckbox && defenderLegionContainer) {
                    defenderLegionCheckbox.onchange = () => {
                        defenderLegionContainer.style.display = defenderLegionCheckbox.checked ? 'block' : 'none';
                    };
                }

                // [NEW] Primary Field Battle Location Picker
                const fbLocationInp = document.getElementById('field-battle-location-name') as HTMLInputElement;
                const fbLocationPickBtn = document.getElementById('btn-field-battle-location-pick-city');
                const fbLatInp = document.getElementById('field-battle-lat') as HTMLInputElement;
                const fbLngInp = document.getElementById('field-battle-lng') as HTMLInputElement;

                if (fbLocationInp) {
                    fbLocationInp.onchange = () => {
                        const cityId = fbLocationInp.value;
                        const city = (this.cityManager as any)?.getCities().find((c: any) => c.id === cityId || c.name === cityId);
                        if (city && fbLatInp && fbLngInp) {
                            fbLocationInp.value = city.id;
                            fbLatInp.value = city.latitude.toFixed(4);
                            fbLngInp.value = city.longitude.toFixed(4);
                        }
                    };
                }

                if (fbLocationPickBtn) {
                    fbLocationPickBtn.onclick = () => {
                        this.pickCityFromMap((cityId: string) => {
                            if (fbLocationInp) {
                                fbLocationInp.value = cityId;
                                fbLocationInp.dispatchEvent(new Event('change'));
                            }
                        });
                    };
                }

                // Geocode for location
                if (geocodeLocationBtn) {
                    geocodeLocationBtn.onclick = async () => {
                        const name = fbLocationInp.value;
                        if (!name) { alert('请输入地点名'); return; }
                        try {
                            geocodeLocationBtn.textContent = '⏳...';
                            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(name)}&limit=1&accept-language=zh-CN`);
                            const data = await response.json();
                            if (data && data.length > 0) {
                                (document.getElementById('field-battle-lat') as HTMLInputElement).value = data[0].lat;
                                (document.getElementById('field-battle-lng') as HTMLInputElement).value = data[0].lon;
                                alert(`已找到坐标: ${data[0].lat}, ${data[0].lon}`);
                            } else {
                                alert('未找到坐标');
                            }
                        } catch (e) {
                            console.error(e);
                            alert('查询失败');
                        } finally {
                            geocodeLocationBtn.textContent = '🔍 查坐标';
                        }
                    };
                }

                // [NEW] Toggle Siege Target Selector
                const afterBattleSelect = document.getElementById('field-battle-after') as HTMLSelectElement;
                const siegeTargetContainer = document.getElementById('container-field-battle-siege-target');
                const fbSiegeTargetInp = document.getElementById('field-battle-siege-target');
                const fbSiegeTargetPickBtn = document.getElementById('btn-field-battle-pick-city');

                if (afterBattleSelect && siegeTargetContainer) {
                    afterBattleSelect.onchange = () => {
                        const val = afterBattleSelect.value;
                        // 显示目标城市选择器（siege 或 move_to_city 都需要）
                        siegeTargetContainer.style.display = (val === 'siege' || val === 'move_to_city') ? 'block' : 'none';
                        // 更新标签文字
                        const targetLabel = document.getElementById('field-battle-target-label');
                        if (targetLabel) {
                            targetLabel.textContent = val === 'siege' ? '攻击目标城市:' : '移动至城市:';
                            targetLabel.style.color = val === 'siege' ? '#FF5722' : '#4CAF50';
                        }
                        // [IMPORTANT] 显示/隐藏攻城后行动链（仅攻城时显示）
                        const siegeChainContainer = document.getElementById('container-field-battle-siege-chain');
                        if (siegeChainContainer) {
                            siegeChainContainer.style.display = val === 'siege' ? 'block' : 'none';
                        }
                    };
                    // Trigger initial check
                    afterBattleSelect.dispatchEvent(new Event('change'));
                }

                // [NEW] Main Field Battle Siege Target Picker
                if (fbSiegeTargetInp) {
                    fbSiegeTargetInp.onchange = () => {
                        const cityId = (fbSiegeTargetInp as any).value;
                        const city = (this.cityManager as any)?.getCities().find((c: any) => c.id === cityId || c.name === cityId);
                        if (city) (fbSiegeTargetInp as any).value = city.id;
                    };
                }
                if (fbSiegeTargetPickBtn) {
                    fbSiegeTargetPickBtn.onclick = () => {
                        this.pickCityFromMap((cityId: string) => {
                            if (fbSiegeTargetInp) {
                                (fbSiegeTargetInp as any).value = cityId;
                                fbSiegeTargetInp.dispatchEvent(new Event('change'));
                            }
                        });
                    };
                }

                // [IMPORTANT] 野战攻城后行动链 UI 绑定 (4步) - 与攻城战保持一致
                const setupFieldBattleSiegeChain = () => {
                    for (let i = 1; i <= 4; i++) {
                        const actionSelect = document.getElementById(`field-battle-siege-chain-${i}`) as HTMLSelectElement;
                        const targetInput = document.getElementById(`field-battle-siege-chain-target-${i}`) as HTMLInputElement;
                        const pickBtn = document.getElementById(`btn-field-battle-siege-chain-pick-city-${i}`) as HTMLButtonElement;
                        const nextStepContainer = document.getElementById(`container-field-battle-siege-chain-step-${i + 1}`);

                        console.log(`[DEBUG setupFieldBattleSiegeChain] Binding step ${i}: actionSelect=${!!actionSelect}, nextStepContainer=${!!nextStepContainer}`);

                        if (actionSelect) {
                            // Use addEventListener instead of onchange to ensure proper binding
                            actionSelect.addEventListener('change', () => {
                                const val = actionSelect.value;
                                console.log(`[DEBUG FieldBattle SiegeChain] Step ${i} changed to: ${val}`);
                                const isMoveOrAttack = (val === 'move_to_city' || val === 'attack_city');

                                if (targetInput) targetInput.style.display = isMoveOrAttack ? 'block' : 'none';
                                if (pickBtn) pickBtn.style.display = isMoveOrAttack ? 'block' : 'none';

                                if (nextStepContainer) {
                                    // destroy and garrison end the chain
                                    const isEnd = (val === 'garrison' || val === 'destroy');
                                    nextStepContainer.style.display = isEnd ? 'none' : 'block';
                                }
                            });
                            actionSelect.dispatchEvent(new Event('change'));
                        }

                        // Bind pick button
                        if (pickBtn && targetInput) {
                            pickBtn.onclick = () => {
                                this.pickCityFromMap((cityId: string) => {
                                    targetInput.value = cityId;
                                    targetInput.dispatchEvent(new Event('input'));
                                });
                            };
                        }

                        // Normalization
                        if (targetInput) {
                            targetInput.onchange = () => {
                                const cityId = targetInput.value;
                                const city = (this.cityManager as any)?.getCities().find((c: any) => c.id === cityId || c.name === cityId);
                                if (city) targetInput.value = city.id;
                            };
                        }
                    }
                };
                setupFieldBattleSiegeChain();
                // [End Field Battle Bindings]
            }, 0);
        } else if (type === 'narrative') {
            // ======================= 叙事事件 =======================
            container.innerHTML = `
        <div style="margin-bottom: 5px;"><small>叙事事件数据 (军团调动)</small></div>
        
        <!-- 1. 选择势力 -->
        <label>选择势力:</label>
        ${createFactionSelect('field-narrative-faction')}
        
        <!-- 2. 选择军团 -->
        <label>选择军团:</label>
        <select id="field-narrative-legion-select" style="width: 100%; margin-bottom: 10px; background: #333; color: #fff; border: 1px solid #555;">
            <option value="">-- 请先选择势力 --</option>
        </select>
        
        <!-- 3. 移动目标城市 -->
        <div style="margin-bottom: 10px;">
            <label>移动至城市:</label>
            <div style="display: flex; gap: 5px; margin-bottom: 5px;">
                <input id="field-narrative-move-city" list="datalist-all-cities" placeholder="搜索并回填 (Search and Pick)..." style="flex: 1; background: #333; color: #fff; border: 1px solid #555; height: 32px; padding: 0 8px;">
                <button id="btn-narrative-pick-city" title="在地图上点击城市以智能选择" style="background: #FF9800; color: white; border: none; padding: 0 10px; cursor: pointer; border-radius: 4px;">📍 选城</button>
            </div>
        </div>
        
        <!-- 4. 或指定坐标 (地图取点) -->
        <div style="border: 1px solid #00BCD4; padding: 10px; border-radius: 4px; margin-bottom: 10px;">
            <label style="color: #00BCD4;">或指定移动坐标:</label>
            <div style="display: flex; gap: 5px; margin-bottom: 5px;">
                <input id="field-narrative-lat" type="number" step="any" placeholder="Lat" style="flex: 1; background: #333; color: #fff; border: 1px solid #555;">
                <input id="field-narrative-lng" type="number" step="any" placeholder="Lng" style="flex: 1; background: #333; color: #fff; border: 1px solid #555;">
            </div>
            <button id="btn-narrative-pick-map" type="button" style="width: 100%; background: #607D8B; color: white; border: none; padding: 8px; cursor: pointer;">
                📍 地图取点 (点击地图获取坐标)
            </button>
        </div>

        <!-- [NEW] 速度系数 -->
        <label>行军速度系数:</label>
        <input type="number" id="field-narrative-speed" value="1.0" step="0.1" min="0.1" max="10" style="width: 100%; margin-bottom: 5px; background: #333; color: #fff; border: 1px solid #555;">
        <small style="color: grey; display: block; margin-bottom: 10px;">1.0=标准速度, 2.0=急行军, 0.5=缓慢逼近</small>

        <!-- 5. 链式战后行动 (最多4步) -->
        <div style="border: 1px solid #555; padding: 10px; margin-bottom: 10px;">
            <label style="color: #4CAF50;">战后行动链 (最多4步):</label>
            <small style="color: grey; display: block; margin-bottom: 5px;">可连续执行多个行动，选择"驻扎"结束行动链</small>
            
            <!-- 步骤1 -->
            <div class="after-battle-step" style="margin-bottom: 8px; padding: 5px; background: #2a2a2a;">
                <label style="font-size: 12px;">步骤1:</label>
                <select id="field-narrative-after-1" style="width: 100%; margin-bottom: 3px; background: #333; color: #fff; border: 1px solid #555;">
                    <option value="garrison">驻扎 (结束)</option>
<option value="destroy">解散军团 (销毁)</option>
                    <option value="move_to_city">移动至城市 →</option>
                    <option value="attack_city">攻打城市 →</option>
                </select>
                <div style="display: flex; gap: 5px; margin-top: 3px;">
                    <input id="field-narrative-after-target-1" list="datalist-all-cities" placeholder="移动/攻打目标..." style="flex: 1; background: #333; color: #fff; border: 1px solid #555; display: none; height: 32px; padding: 0 8px;">
                    <button id="btn-narrative-after-pick-city-1" title="地图选城" style="background: #FF9800; color: white; border: none; padding: 0 10px; cursor: pointer; border-radius: 4px; display: none;">📍 选城</button>
                </div>
            </div>
            
            <!-- 步骤2 -->
            <div id="container-narrative-step-2" class="after-battle-step" style="margin-bottom: 8px; padding: 5px; background: #2a2a2a; display: none;">
                <label style="font-size: 12px;">步骤2:</label>
                <select id="field-narrative-after-2" style="width: 100%; margin-bottom: 3px; background: #333; color: #fff; border: 1px solid #555;">
                    <option value="garrison">驻扎 (结束)</option>
<option value="destroy">解散军团 (销毁)</option>
                    <option value="move_to_city">移动至城市 →</option>
                    <option value="attack_city">攻打城市 →</option>
                </select>
                <div style="display: flex; gap: 5px; margin-top: 3px;">
                    <input id="field-narrative-after-target-2" list="datalist-all-cities" placeholder="移动/攻打目标..." style="flex: 1; background: #333; color: #fff; border: 1px solid #555; display: none; height: 32px; padding: 0 8px;">
                    <button id="btn-narrative-after-pick-city-2" title="地图选城" style="background: #FF9800; color: white; border: none; padding: 0 10px; cursor: pointer; border-radius: 4px; display: none;">📍 选城</button>
                </div>
            </div>
            
            <!-- 步骤3 -->
            <div id="container-narrative-step-3" class="after-battle-step" style="margin-bottom: 8px; padding: 5px; background: #2a2a2a; display: none;">
                <label style="font-size: 12px;">步骤3:</label>
                <select id="field-narrative-after-3" style="width: 100%; margin-bottom: 3px; background: #333; color: #fff; border: 1px solid #555;">
                    <option value="garrison">驻扎 (结束)</option>
<option value="destroy">解散军团 (销毁)</option>
                    <option value="move_to_city">移动至城市 →</option>
                    <option value="attack_city">攻打城市 →</option>
                </select>
                <div style="display: flex; gap: 5px; margin-top: 3px;">
                    <input id="field-narrative-after-target-3" list="datalist-all-cities" placeholder="移动/攻打目标..." style="flex: 1; background: #333; color: #fff; border: 1px solid #555; display: none; height: 32px; padding: 0 8px;">
                    <button id="btn-narrative-after-pick-city-3" title="地图选城" style="background: #FF9800; color: white; border: none; padding: 0 10px; cursor: pointer; border-radius: 4px; display: none;">📍 选城</button>
                </div>
            </div>
            
            <!-- 步骤4 -->
            <div id="container-narrative-step-4" class="after-battle-step" style="margin-bottom: 8px; padding: 5px; background: #2a2a2a; display: none;">
                <label style="font-size: 12px;">步骤4 (最后):</label>
                <select id="field-narrative-after-4" style="width: 100%; margin-bottom: 3px; background: #333; color: #fff; border: 1px solid #555;">
                    <option value="garrison">驻扎 (结束)</option>
<option value="destroy">解散军团 (销毁)</option>
                    <option value="move_to_city">移动至城市 (最后)</option>
                </select>
                <div style="display: flex; gap: 5px; margin-top: 3px;">
                    <input id="field-narrative-after-target-4" list="datalist-all-cities" placeholder="移动/攻打目标..." style="flex: 1; background: #333; color: #fff; border: 1px solid #555; display: none; height: 32px; padding: 0 8px;">
                    <button id="btn-narrative-after-pick-city-4" title="地图选城" style="background: #FF9800; color: white; border: none; padding: 0 10px; cursor: pointer; border-radius: 4px; display: none;">📍 选城</button>
                </div>
            </div>
        </div>
    `;

            // 绑定事件
            setTimeout(() => {
                // Faction -> Legion List
                const factionSelect = document.getElementById('field-narrative-faction') as HTMLSelectElement;
                if (factionSelect) {
                    factionSelect.addEventListener('change', () => {
                        this.reloadLegionDatalist('narrative', factionSelect.value);
                    });
                    // Initial load
                    this.reloadLegionDatalist('narrative', factionSelect.value);
                }

                // City -> Auto-fill Coordinates
                const moveCitySelect = document.getElementById('field-narrative-move-city') as HTMLSelectElement;
                const latInput = document.getElementById('field-narrative-lat') as HTMLInputElement;
                const lngInput = document.getElementById('field-narrative-lng') as HTMLInputElement;

                if (moveCitySelect && this.cityManager) {
                    moveCitySelect.addEventListener('change', () => {
                        const cityId = (moveCitySelect as any).value;
                        if (cityId) {
                            const cities = this.cityManager.getCities();
                            const city = cities.find((c: any) => c.id === cityId || c.name === cityId);
                            if (city && latInput && lngInput) {
                                (moveCitySelect as any).value = city.id; // Normalize to ID
                                latInput.value = city.latitude.toFixed(4);
                                lngInput.value = city.longitude.toFixed(4);
                            }
                        }
                    });
                }

                // [NEW] Map Pick City Button
                const pickCityBtn = document.getElementById('btn-narrative-pick-city');
                if (pickCityBtn) {
                    pickCityBtn.onclick = () => {
                        this.pickCityFromMap((cityId: string) => {
                            if (moveCitySelect) {
                                (moveCitySelect as any).value = cityId;
                                // Trigger change to update coordinates
                                moveCitySelect.dispatchEvent(new Event('change'));
                            }
                        });
                    };
                }

                // [NEW] Map Pick RAW Coordinates
                const pickMapBtn = document.getElementById('btn-narrative-pick-map');
                if (pickMapBtn) {
                    pickMapBtn.onclick = () => {
                        this.pickLocationFromMap((lat, lng) => {
                            if (latInput && lngInput) {
                                latInput.value = lat.toFixed(4);
                                lngInput.value = lng.toFixed(4);
                                // Clear city selection if picking custom coordinate
                                if (moveCitySelect) (moveCitySelect as any).value = '';
                            }
                        });
                    };
                }

                // [NEW] Narrative Chain Actions (4 steps)
                const setupNarrativeChainActions = () => {
                    for (let i = 1; i <= 4; i++) {
                        const actionSelect = document.getElementById(`field-narrative-after-${i}`) as HTMLSelectElement;
                        const targetInput = document.getElementById(`field-narrative-after-target-${i}`) as HTMLInputElement;
                        const pickBtn = document.getElementById(`btn-narrative-after-pick-city-${i}`) as HTMLButtonElement;
                        const nextStepContainer = document.getElementById(`container-narrative-step-${i + 1}`);

                        console.log(`[DEBUG setupNarrativeChainActions] Binding step ${i}: actionSelect=${!!actionSelect}, nextStepContainer=${!!nextStepContainer}`);

                        if (actionSelect) {
                            // Use addEventListener instead of onchange to ensure proper binding
                            actionSelect.addEventListener('change', () => {
                                const action = actionSelect.value;
                                console.log(`[DEBUG Narrative] Step ${i} changed to: ${action}`);
                                const isMoveOrAttack = action === 'move_to_city' || action === 'attack_city';

                                if (targetInput) targetInput.style.display = isMoveOrAttack ? 'block' : 'none';
                                if (pickBtn) pickBtn.style.display = isMoveOrAttack ? 'block' : 'none';
                                if (nextStepContainer) {
                                    // Both move_to_city and attack_city continue the chain
                                    nextStepContainer.style.display = isMoveOrAttack ? 'block' : 'none';
                                }
                            });
                            // Init
                            actionSelect.dispatchEvent(new Event('change'));
                        }

                        if (pickBtn && targetInput) {
                            pickBtn.onclick = () => {
                                this.pickCityFromMap((cityId: string) => {
                                    targetInput.value = cityId;
                                    targetInput.dispatchEvent(new Event('change'));
                                });
                            };
                        }

                        if (targetInput) {
                            targetInput.onchange = () => {
                                const cityId = targetInput.value;
                                const city = (this.cityManager as any)?.getCities().find((c: any) => c.id === cityId || c.name === cityId);
                                if (city) targetInput.value = city.id;
                            };
                        }
                    }
                };
                setupNarrativeChainActions();
            }, 0);
        }
    }

    /**
     * 从历史事件中提取在指定年份之前创建的军团
     * @param factionId 势力ID（可选，用于筛选）
     * @param beforeYear 只返回此年份之前创建的军团
     */
    private getAvailableLegionsFromEvents(factionId: string, beforeYear: number): Array<{ name: string, troops: number, factionId: string, createdYear: number }> {
        const legions: Array<{ name: string, troops: number, factionId: string, createdYear: number }> = [];
        const seenNames = new Set<string>();

        HISTORICAL_EVENTS.forEach(event => {
            // 只考虑当前年份之前的事件（严格小于）
            if (event.year >= beforeYear) return;

            // 从攻城事件提取
            if (event.type === 'siege' && event.siegeData?.legionName) {
                const name = event.siegeData.legionName;
                const eventFactionId = event.siegeData.attackerFactionId;

                if (!seenNames.has(name) && (!factionId || factionId === 'UNKNOWN' || eventFactionId === factionId)) {
                    legions.push({
                        name,
                        troops: event.siegeData.attackerTroops || 20000,
                        factionId: eventFactionId,
                        createdYear: event.year
                    });
                    seenNames.add(name);
                }
            }

            // 从野战事件提取
            if (event.type === 'field_battle' && event.fieldBattleData) {
                const f = event.fieldBattleData;

                // 进攻方军团
                if (f.attackerLegionName && (!factionId || factionId === 'UNKNOWN' || f.attackerFactionId === factionId)) {
                    if (!seenNames.has(f.attackerLegionName)) {
                        legions.push({
                            name: f.attackerLegionName,
                            troops: f.attackerTroops || 20000,
                            factionId: f.attackerFactionId,
                            createdYear: event.year
                        });
                        seenNames.add(f.attackerLegionName);
                    }
                }

                // 防守方军团
                if (f.defenderLegionName && (!factionId || factionId === 'UNKNOWN' || f.defenderFactionId === factionId)) {
                    if (!seenNames.has(f.defenderLegionName)) {
                        legions.push({
                            name: f.defenderLegionName,
                            troops: f.defenderTroops || 20000,
                            factionId: f.defenderFactionId,
                            createdYear: event.year
                        });
                        seenNames.add(f.defenderLegionName);
                    }
                }
            }
        });

        // 按创建年份排序（最近的在前）
        legions.sort((a, b) => b.createdYear - a.createdYear);

        return legions;
    }

    private reloadLegionList(side: 'attacker' | 'defender', factionId: string, preselectNames?: string[]): string[] {
        const containerId = `container-field-battle-${side}-legion-select`;
        const container = document.getElementById(containerId);
        if (!container) return preselectNames || [];

        // 如果未选择势力，显示提示信息
        if (!factionId || factionId === 'UNKNOWN') {
            container.innerHTML = '<div style="color:#888; padding:5px;">请先选择势力</div>';
            return preselectNames || [];
        }

        // 获取当前编辑事件的年份
        const currentYear = this.currentEditingEvent?.year || -200;

        // 获取该年份之前创建的军团（只筛选己方势力）
        const candidates = this.getAvailableLegionsFromEvents(factionId, currentYear);
        const foundNames = new Set<string>();

        if (candidates.length === 0) {
            container.innerHTML = '<div style="color:#aaa; padding:5px;">暂无该势力的军团</div>';
            return preselectNames || [];
        }

        container.innerHTML = candidates.map((l: { name: string, troops: number, factionId: string, createdYear: number }) => {
            const isChecked = preselectNames && preselectNames.includes(l.name);
            if (isChecked) foundNames.add(l.name);
            const checked = isChecked ? 'checked' : '';
            // 使用名称作为值（而非ID）
            const safeId = l.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
            return `
            <div style="padding: 2px;">
                <input type="checkbox" id="${side}-legion-${safeId}" value="${l.name}" ${checked}>
                <label for="${side}-legion-${safeId}" style="cursor:pointer; color: #ddd;">
                    ${l.name} (${l.troops}人, ${l.createdYear}年)
                </label> 
            </div>`;
        }).join('');

        // 返回请求但未找到的名称
        return preselectNames ? preselectNames.filter(n => !foundNames.has(n)) : [];
    }

    private handleExport(): void {
        const event = this.getCurrentFormData();
        if (!this.validateForm(event)) {
            return;
        }

        if (event) {
            const json = JSON.stringify(event, null, 4);
            navigator.clipboard.writeText(json).then(() => {
                alert('代码已生成并复制到剪贴板！\n请粘贴到 HistoricalEvents.ts 中。');
            });
            console.log(json);
        }
    }

    private validateForm(event: any): boolean {
        if (!event) return false;

        const errors: string[] = [];

        if (event.type === 'siege') {
            if (event.siegeData.attackerFactionId === 'UNKNOWN') errors.push('进攻方势力未知');

            if (!event.siegeData.defenderCityId || event.siegeData.defenderCityId === '' || event.siegeData.defenderCityId === 'UNKNOWN') {
                errors.push('目标城市ID未知');
            }

            // [FIX] Warn if city ID looks like a name instead of proper ID format
            if (event.siegeData.defenderCityId && !event.siegeData.defenderCityId.startsWith('city_')) {
                // Check if it matches any city by name
                const cities = this.cityManager?.getCities() || [];
                const matchByName = cities.find((c: any) => c.name === event.siegeData.defenderCityId);
                if (!matchByName) {
                    errors.push(`目标城市 "${event.siegeData.defenderCityId}" 格式不正确且无法匹配`);
                }
            }

            if (event.siegeData.newCityParams) {
                if (!event.siegeData.newCityParams.name) errors.push('新城市名称未知');
                if (!event.siegeData.newCityParams.lat || !event.siegeData.newCityParams.lng) errors.push('新城市坐标未知');
                if (event.siegeData.newCityParams.factionId === 'UNKNOWN') errors.push('新城市势力未知');
            }

            if (!event.siegeData.legionName && !event.siegeData.legionId) {
                errors.push('请选择进攻军团或创建新军团');
            }

            // [FIX] Warn if only legionId is set without legionName (now auto-fixed, but still warn for old data)
            if (event.siegeData.legionId && !event.siegeData.legionName) {
                console.warn('[EventEditor] Warning: legionId set without legionName - this may cause issues if legion is not found on map');
            }

        } else if (event.type === 'field_battle') {
            if (event.fieldBattleData.attackerFactionId === 'UNKNOWN') errors.push('进攻方势力未知');
            if (event.fieldBattleData.defenderFactionId === 'UNKNOWN') errors.push('防守方势力未知');
            if (!event.fieldBattleData.location || (event.fieldBattleData.location.lat === 0 && event.fieldBattleData.location.lng === 0)) {
                errors.push('野战坐标未设置');
            }
        }

        if (errors.length > 0) {
            alert('无法生成事件，缺少以下信息：\n' + errors.join('\n') + '\n\n请先补充完整。');
            return false;
        }

        return true;
    }

    private getCurrentFormData(): any {
        try {
            const yearVal = (document.getElementById('editor-year') as HTMLInputElement).value;
            const year = parseInt(yearVal);
            const season = parseInt((document.getElementById('editor-season') as HTMLSelectElement).value);
            const type = (document.getElementById('editor-type') as HTMLSelectElement).value;
            const description = (document.getElementById('editor-desc') as HTMLTextAreaElement).value;

            console.log(`[EventEditor] Getting Form Data: Year=${year} Type=${type}`);

            const baseEvent = {
                year,
                season,
                description,
                type
            };

            if (type === 'siege') {
                // [SIMPLIFIED] 直接从城市选择框获取ID（已移除新城市选项）
                let cityId = (document.getElementById('field-siege-city-select') as any)?.value || '';

                // [FIX] Normalize city ID - convert name to ID if needed
                if (cityId && !cityId.startsWith('city_') && this.cityManager) {
                    const cities = this.cityManager.getCities();
                    const matchedCity = cities.find((c: any) => c.name === cityId || c.id === cityId);
                    if (matchedCity) {
                        cityId = matchedCity.id;
                        console.log(`[EventEditor] Normalized city name "${matchedCity.name}" to ID "${cityId}"`);
                    }
                }

                const siegeData: any = {
                    attackerFactionId: (document.getElementById('field-siege-attacker') as HTMLSelectElement).value,
                    defenderCityId: cityId
                };





                // [USER REQUEST] Save Result
                const resultValue = (document.getElementById('field-siege-result') as HTMLSelectElement).value;
                if (resultValue && resultValue !== '') {
                    siegeData.result = resultValue;
                }

                // [NEW] Save Legion Data - Updated to use radio buttons
                const legionModeRadio = document.querySelector('input[name="siege-legion-mode"]:checked') as HTMLInputElement;
                const isNewLegion = legionModeRadio?.value === 'new';

                if (isNewLegion) {
                    // Creating new legion
                    const legionName = (document.getElementById('field-siege-legion-name') as HTMLInputElement)?.value;
                    if (legionName) {
                        siegeData.legionName = legionName;
                    }
                    const troopsValue = (document.getElementById('field-siege-troops') as HTMLInputElement)?.value;
                    if (troopsValue) {
                        siegeData.attackerTroops = parseInt(troopsValue);
                    }

                    const sourceCityId = (document.getElementById('field-siege-source-city') as any)?.value;
                    if (sourceCityId) {
                        siegeData.attackerCityId = sourceCityId;
                    }

                    // [NEW] Parse Manual Coordinates String
                    const coordsVal = (document.getElementById('field-siege-source-coords') as HTMLInputElement)?.value;
                    if (coordsVal && coordsVal.trim() !== '') {
                        // Split by comma or space, filter empty
                        const parts = coordsVal.split(/[,，\s]+/).filter(s => s.trim() !== '');
                        if (parts.length >= 2) {
                            const lat = parseFloat(parts[0]);
                            const lng = parseFloat(parts[1]);
                            if (!isNaN(lat) && !isNaN(lng)) {
                                siegeData.attackerSourceLocation = { lat, lng };
                            }
                        }
                    }
                } else {
                    // Using existing legion
                    const selectedLegionId = (document.getElementById('field-siege-attacker-legion-select') as HTMLSelectElement)?.value;
                    if (selectedLegionId && selectedLegionId !== '') {
                        siegeData.legionId = selectedLegionId;

                        // [FIX] Also save legionName as fallback
                        // This ensures the event can spawn the army if legionId is not found on map
                        // (e.g., when events are triggered out of order or after a reset)
                        const selectedOption = (document.getElementById('field-siege-attacker-legion-select') as HTMLSelectElement)?.selectedOptions[0];
                        if (selectedOption) {
                            // Extract legion name from option text (format: "军团名 (id)")
                            const optionText = selectedOption.text;
                            const nameMatch = optionText.match(/^(.+?)\s*\(/);
                            if (nameMatch && nameMatch[1]) {
                                siegeData.legionName = nameMatch[1].trim();
                            } else {
                                // Fallback: look up from HISTORICAL_LEGIONS
                                const historicalLegion = HISTORICAL_LEGIONS.find(l => l.id === selectedLegionId);
                                if (historicalLegion) {
                                    siegeData.legionName = historicalLegion.name;
                                }
                            }
                        }
                    }
                }

                // [NEW] Save Chain After-Battle Actions (4 steps)
                const afterBattleChain: Array<{ action: string, targetCityId?: string }> = [];
                for (let i = 1; i <= 4; i++) {
                    const actionSelect = document.getElementById(`field-siege-after-${i}`) as HTMLSelectElement;
                    const targetInp = document.getElementById(`field-siege-after-target-${i}`) as any;

                    if (!actionSelect) break;
                    const action = actionSelect.value;

                    // If garrison or destroy is selected, we've reached the end
                    if (action === 'garrison' || action === 'destroy') {
                        afterBattleChain.push({ action: action as any });
                        break;
                    }

                    const step: any = { action };
                    if (action === 'move_to_city' || action === 'attack_city') {
                        let targetCityId = targetInp?.value || '';
                        // [FIX] Normalize targetCityId - convert name to ID if needed
                        if (targetCityId && !targetCityId.startsWith('city_') && this.cityManager) {
                            const cities = this.cityManager.getCities();
                            const matchedCity = cities.find((c: any) => c.name === targetCityId || c.id === targetCityId);
                            if (matchedCity) {
                                targetCityId = matchedCity.id;
                            }
                        }
                        step.targetCityId = targetCityId;
                    }
                    afterBattleChain.push(step);

                    // Continue chain for both move_to_city and attack_city
                    // Only garrison ends the chain
                }

                if (afterBattleChain.length > 0) {
                    siegeData.afterBattleChain = afterBattleChain;
                }

                // [NEW] Speed Multiplier
                const speedInput = document.getElementById('field-siege-speed') as HTMLInputElement;
                if (speedInput && speedInput.value) {
                    const speedMultiplier = parseFloat(speedInput.value);
                    if (!isNaN(speedMultiplier) && speedMultiplier !== 1.0) {
                        siegeData.speedMultiplier = speedMultiplier;
                    }
                }



                return {
                    ...baseEvent,
                    siegeData
                };
            } else if (type === 'field_battle') {
                const fieldBattleData: any = {
                    attackerFactionId: (document.getElementById('field-battle-attacker') as HTMLSelectElement).value,
                    defenderFactionId: (document.getElementById('field-battle-defender') as HTMLSelectElement).value,
                    location: { lat: 0, lng: 0 }
                };

                // 获取战场位置
                const lat = parseFloat((document.getElementById('field-battle-lat') as HTMLInputElement).value) || 0;
                const lng = parseFloat((document.getElementById('field-battle-lng') as HTMLInputElement).value) || 0;
                fieldBattleData.location = { lat, lng };

                // 进攻方军团
                const createAttackerLegion = (document.getElementById('field-battle-create-attacker-legion') as HTMLInputElement)?.checked;
                if (createAttackerLegion) {
                    const attackerLegionName = (document.getElementById('field-battle-attacker-legion-name') as HTMLInputElement)?.value;
                    const attackerTroops = parseInt((document.getElementById('field-battle-attacker-troops') as HTMLInputElement)?.value) || 20000;
                    if (attackerLegionName) {
                        fieldBattleData.attackerLegionName = attackerLegionName;
                    }
                    if (attackerTroops) {
                        fieldBattleData.attackerTroops = attackerTroops;
                    }
                }

                // [NEW] Get Attacker Legion Names (Checkboxes only)
                const attackerCheckboxes = document.querySelectorAll('#container-field-battle-attacker-legion-select input:checked');
                const attackerCheckedNames = Array.from(attackerCheckboxes).map((cb: any) => cb.value);

                if (attackerCheckedNames.length > 0) {
                    fieldBattleData.attackerLegionNames = Array.from(new Set(attackerCheckedNames));
                }

                // 防守方军团
                const createDefenderLegion = (document.getElementById('field-battle-create-defender-legion') as HTMLInputElement)?.checked;
                if (createDefenderLegion) {
                    const defenderLegionName = (document.getElementById('field-battle-defender-legion-name') as HTMLInputElement)?.value;
                    const defenderTroops = parseInt((document.getElementById('field-battle-defender-troops') as HTMLInputElement)?.value) || 10000;
                    if (defenderLegionName) {
                        fieldBattleData.defenderLegionName = defenderLegionName;
                    }
                    if (defenderTroops) {
                        fieldBattleData.defenderTroops = defenderTroops;
                    }
                }

                // [NEW] Get Defender Legion Names (Checkboxes only)
                const defenderCheckboxes = document.querySelectorAll('#container-field-battle-defender-legion-select input:checked');
                const defenderCheckedNames = Array.from(defenderCheckboxes).map((cb: any) => cb.value);

                if (defenderCheckedNames.length > 0) {
                    fieldBattleData.defenderLegionNames = Array.from(new Set(defenderCheckedNames));
                }

                // 获取战后行为
                // 获取战后行为
                const afterBattleSelect = document.getElementById('field-battle-after') as HTMLSelectElement;
                if (afterBattleSelect) {
                    const afterBattleValue = afterBattleSelect.value;

                    // [NEW] Handle destroy action - use siegeAfterBattleChain
                    if (afterBattleValue === 'destroy') {
                        fieldBattleData.siegeAfterBattleChain = [{ action: 'destroy' }];
                        // Don't set afterBattle for destroy, it's handled by siegeAfterBattleChain
                    } else {
                        fieldBattleData.afterBattle = afterBattleValue;

                        // [NEW] Get target city if siege or move_to_city
                        const targetInp = document.getElementById('field-battle-siege-target') as any;
                        if (targetInp && (fieldBattleData.afterBattle === 'siege' || fieldBattleData.afterBattle === 'move_to_city')) {
                            fieldBattleData.afterBattleTargetCityId = targetInp.value;
                        }

                        // [NEW] Get Chain After-Battle Actions (4 steps) - only for siege
                        if (afterBattleValue === 'siege') {
                            const afterBattleChain: Array<{ action: string, targetCityId?: string }> = [];
                            for (let i = 1; i <= 4; i++) {
                                const actionSelect = document.getElementById(`field-battle-siege-chain-${i}`) as HTMLSelectElement;
                                const targetInp = document.getElementById(`field-battle-siege-chain-target-${i}`) as any;

                                if (!actionSelect) break;
                                const action = actionSelect.value;
                                if (action === 'garrison' || action === 'destroy') {
                                    afterBattleChain.push({ action: action as any });
                                    break;
                                }

                                const step: any = { action };
                                if (action === 'move_to_city' || action === 'attack_city') {
                                    step.targetCityId = targetInp?.value || '';
                                }
                                afterBattleChain.push(step);
                                // Continue chain for both move_to_city and attack_city
                            }

                            if (afterBattleChain.length > 0) {
                                fieldBattleData.siegeAfterBattleChain = afterBattleChain;
                            }
                        }
                    }
                }

                // 获取预设胜利方
                const resultSelect = document.getElementById('field-battle-result') as HTMLSelectElement;
                if (resultSelect && resultSelect.value) {
                    fieldBattleData.result = resultSelect.value;
                }

                // [NEW] Get Speed Multiplier
                const speedInput = document.getElementById('field-battle-speed') as HTMLInputElement;
                if (speedInput && speedInput.value) {
                    fieldBattleData.speedMultiplier = parseFloat(speedInput.value);
                }

                // [NEW] Get Custom Duration
                const durationInput = document.getElementById('field-battle-duration') as HTMLInputElement;
                if (durationInput && durationInput.value) {
                    fieldBattleData.customDuration = parseFloat(durationInput.value);
                }


                return {
                    ...baseEvent,
                    fieldBattleData
                };
            } else if (type === 'narrative') {
                // ======================= 叙事事件数据收集 =======================
                const narrativeData: any = {};

                // 1. 势力
                const factionSelect = document.getElementById('field-narrative-faction') as HTMLSelectElement;
                if (factionSelect && factionSelect.value && factionSelect.value !== 'UNKNOWN') {
                    narrativeData.factionId = factionSelect.value;
                }

                // 2. 军团
                const legionSelect = document.getElementById('field-narrative-legion-select') as HTMLSelectElement;
                if (legionSelect && legionSelect.value) {
                    narrativeData.legionId = legionSelect.value;
                }

                // 3. 移动目标城市
                const moveCitySelect = document.getElementById('field-narrative-move-city') as HTMLSelectElement;
                if (moveCitySelect && moveCitySelect.value) {
                    narrativeData.moveToCityId = moveCitySelect.value;
                }

                // 4. 移动坐标
                const latInput = document.getElementById('field-narrative-lat') as HTMLInputElement;
                const lngInput = document.getElementById('field-narrative-lng') as HTMLInputElement;
                if (latInput && lngInput && latInput.value && lngInput.value) {
                    narrativeData.moveToLocation = {
                        lat: parseFloat(latInput.value),
                        lng: parseFloat(lngInput.value)
                    };
                }

                // [NEW] Get Chain After-Battle Actions (4 steps)
                const afterBattleChain: Array<{ action: string, targetCityId?: string }> = [];
                for (let i = 1; i <= 4; i++) {
                    const actionSelect = document.getElementById(`field-narrative-after-${i}`) as HTMLSelectElement;
                    const targetInp = document.getElementById(`field-narrative-after-target-${i}`) as any;

                    if (!actionSelect) break;
                    const action = actionSelect.value;

                    if (action === 'garrison' || action === 'destroy') {
                        afterBattleChain.push({ action: action as any });
                        break;
                    }

                    const step: any = { action };
                    if (action === 'move_to_city' || action === 'attack_city') {
                        step.targetCityId = targetInp?.value || '';
                    }
                    afterBattleChain.push(step);
                    // Continue chain for both move_to_city and attack_city
                }

                if (afterBattleChain.length > 0) {
                    narrativeData.afterBattleChain = afterBattleChain;
                }

                // [NEW] Speed Multiplier
                const speedInput = document.getElementById('field-narrative-speed') as HTMLInputElement;
                if (speedInput && speedInput.value) {
                    const speedMultiplier = parseFloat(speedInput.value);
                    if (!isNaN(speedMultiplier) && speedMultiplier !== 1.0) {
                        narrativeData.speedMultiplier = speedMultiplier;
                    }
                }

                return {
                    ...baseEvent,
                    narrativeData
                };
            } else {
                return baseEvent;
            }
        } catch (error) {
            console.error('❌ [EventEditor] Invalid Form Data:', error);
            return null;
        }
    }
    private reloadLegionDatalist(type: 'siege' | 'attacker' | 'defender' | 'narrative', factionId: string | null): void {
        const game = (window as any).game;
        if (!game || !game.legionManager) return;

        let targetId = '';
        if (type === 'siege') targetId = 'field-siege-attacker-legion-select';
        else if (type === 'attacker') targetId = 'legion-list-field-attacker';
        else if (type === 'defender') targetId = 'legion-list-field-defender';
        else if (type === 'narrative') targetId = 'field-narrative-legion-select';

        const datalist = document.getElementById(targetId);
        if (!datalist) return;

        // Special handling for Siege and Narrative Select
        if (type === 'siege' || type === 'narrative') {
            if (!factionId || factionId === 'UNKNOWN') {
                datalist.innerHTML = '<option value="">-- 请先选择势力 --</option>';
                return;
            }
        }

        // 1. Get existing runtime legions
        const legions = game.legionManager.getArmies();
        const runtimeIds = new Set(legions.map((l: any) => l.id));

        // 2. [NEW] Parse current script for planned legions
        // This solves the issue where legions defined in script are not yet spawned
        const scriptLegions: any[] = [];
        try {
            // Attempt to access the current script from GameApp (assuming it's loaded)
            // If GameApp doesn't expose it publically, we might need to fetch it or rely on a known global
            // For now, let's try to fetch if we know the script ID, or check if GameApp has it.
            // As a fallback, we can check a global variable or cache.

            // Simpler approach: If game.scriptLoader has the current script JSON
            // Assuming game.currentScriptData exists or similar. 
            // Based on previous analysis, we might need to fetch manually or access via game instance.
            // Let's assume we can access the loaded script sequences if they are stored.

            // Actually, best way is to look at ScriptEditor/GameApp to see where script is stored.
            // But to avoid complex dependency, let's try to fetch the known script '-236.json' if not found.
            // OR checks game.cinematicManager.directorScript or similar.

            // Strategy: Iterate through global game.historicalEventManager or similar to find script data?
            // No, the script is loaded into specific managers but maybe not raw JSON.

            // Let's try to infer from game.cinematicManager if possible, or just fetch the file if we are in dev mode?
            // Fetching might be async, which is tricky for this sync method.

            // Alternative: Add a cached "script units" list to GameApp that is populated on script load.
            // But I can't easily change GameApp right now without context.

            // Let's implement a "Lazy Fetch" or check if `window.game.currentScript` exists (it should).
            const currentScript = (window as any).game?.currentScript; // We need to ensure this exists in GameApp

            console.log('[EventEditor] reloadLegionDatalist called. factionId:', factionId, 'currentScript:', currentScript ? 'LOADED' : 'NULL');

            if (currentScript && currentScript.sequences) {
                console.log('[EventEditor] Script has', currentScript.sequences.length, 'sequences');
                currentScript.sequences.forEach((seq: any) => {
                    if (seq.actions) {
                        seq.actions.forEach((action: any) => {
                            // [FIX] Support both V1 (flat) and V2 (nested in data) structures
                            const unitId = action.unitId || action.data?.unitId;

                            if (action.type === 'SPAWN_UNIT' && unitId && !runtimeIds.has(unitId)) {
                                // Check if matches faction
                                const rawFId = action.faction || action.data?.faction;
                                const fId = rawFId ? rawFId.toLowerCase() : null;

                                // Only add if faction matches or no faction filter is applied
                                if (!factionId || factionId === 'UNKNOWN' || fId === factionId) {
                                    const name = action.name || action.data?.name || 'Unknown Unit';
                                    const troops = action.troops || action.data?.troops || 0;

                                    scriptLegions.push({
                                        id: unitId,
                                        name: name + ' (Script)',
                                        factionId: fId,
                                        troops: troops,
                                        isScript: true
                                    });
                                    runtimeIds.add(unitId); // Prevent duplicates
                                }
                            }
                        });
                    }
                });
            }
        } catch (e) {
            console.warn('Error parsing script for legions:', e);
        }

        let opts = '';

        // Filter valid runtime legions
        const validRuntimeLegions = (factionId && factionId !== 'UNKNOWN')
            ? legions.filter((l: any) => l.factionId === factionId)
            : legions;

        // Default option
        if (type === 'siege') {
            opts += '<option value="">-- 请选择军团 --</option>';
        }

        // Add Runtime Legions
        validRuntimeLegions.forEach((l: any) => {
            opts += `<option value="${l.id}">[${l.factionId}] ${l.name} (${l.troops})</option>`;
        });

        // Add Script Legions (if any)
        if (scriptLegions.length > 0) {
            opts += `<optgroup label="剧本预设 (未生成)">`;
            scriptLegions.forEach((l: any) => {
                opts += `<option value="${l.id}">[${l.factionId}] ${l.name} (${l.troops})</option>`;
            });
            opts += `</optgroup>`;
        }

        // [NEW] Add HISTORICAL_LEGIONS as Static Data Source
        // This ensures legions are always available even if game/script hasn't started
        const filteredHist = (factionId && factionId !== 'UNKNOWN')
            ? HISTORICAL_LEGIONS.filter((l: any) => l.factionId === factionId)
            : HISTORICAL_LEGIONS;

        if (filteredHist.length > 0) {
            opts += `<optgroup label="预设军团 (legions.ts)">`;
            filteredHist.forEach((l: any) => {
                // Avoid duplicates with runtime IDs
                if (!runtimeIds.has(l.id)) {
                    opts += `<option value="${l.id}">[${l.factionId}] ${l.name} (${l.initialTroops || 0})</option>`;
                }
            });
            opts += `</optgroup>`;
        }

        datalist.innerHTML = opts;
    }

    private pickCityFromMap(callback: (cityId: string) => void): void {
        if (!this.map) return;

        this.isPicking = true;
        this.currentCityPickCallback = callback;
        this.currentLocPickCallback = null;

        console.log(`[EventEditor] City Picking mode activated.`);

        // Temporarily change cursor to pointer
        const mapContainer = this.map.getContainer();
        mapContainer.style.cursor = 'crosshair';
    }

    /**
     * [NEW] 从地图选取任意坐标
     * @param callback 回调函数，接收 lat, lng
     */
    private pickLocationFromMap(callback: (lat: number, lng: number) => void): void {
        if (!this.map) return;

        this.isPicking = true;
        this.currentLocPickCallback = callback;
        this.currentCityPickCallback = null;

        console.log(`[EventEditor] Location Picking mode activated.`);

        const mapContainer = this.map.getContainer();
        mapContainer.style.cursor = 'crosshair';
    }

    /**
     * [NEW] 外部点击分发接口：处理地图空白处点击
     */
    public handleMapClick(latlng: any): boolean {
        if (!this.isPicking || !this.currentLocPickCallback) return false;

        console.log(`[EventEditor] Map click consumed for location:`, latlng);
        this.currentLocPickCallback(latlng.lat, latlng.lng);
        this.cancelPicking();
        return true;
    }

    /**
     * [NEW] 外部点击分发接口：处理城市标记点击
     */
    public handleCityClick(cityId: string): boolean {
        if (!this.isPicking) return false;

        if (this.currentCityPickCallback) {
            console.log(`[EventEditor] City click consumed for city:`, cityId);
            this.currentCityPickCallback(cityId);
            this.cancelPicking();
            return true;
        }

        // 如果正在选取坐标（而非选城），但点击了城市，也视为成功选取该处坐标
        if (this.currentLocPickCallback) {
            const city = this.cityManager.getCity(cityId);
            if (city) {
                console.log(`[EventEditor] City click consumed as location for city:`, city.name);
                this.currentLocPickCallback(city.latitude, city.longitude);
                this.cancelPicking();
                return true;
            }
        }

        return false;
    }

    private cancelPicking(): void {
        this.isPicking = false;
        this.currentCityPickCallback = null;
        this.currentLocPickCallback = null;
        if (this.map) {
            this.map.getContainer().style.cursor = '';
        }
    }

    public isPickingLocation(): boolean {
        return this.isPicking;
    }

    private refreshCityDatalist(): void {
        const datalist = document.getElementById('datalist-all-cities');
        if (!datalist || !this.cityManager) return;

        const cities = ((this.cityManager as any).getCities?.() || []) as any[];
        let optionsArr: string[] = [];
        for (const city of cities) {
            const cityName = (city as any).name || 'Unknown';
            const cityId = (city as any).id || '';
            optionsArr.push(`<option value="${cityId}">${cityName}</option>`);
        }
        datalist.innerHTML = optionsArr.join('\n');
        console.log(`[EventEditor] Refreshed city datalist with ${cities.length} cities.`);
    }
}
