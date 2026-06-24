/**
 * FactionEditor V4 - 势力编辑器（纯批量模式）
 *
 * 用户粘贴文本 → 解析预览 → 批量保存 → POST /api/batch-import → Vite middleware 写 5 文件 → HMR
 *
 * 输入格式: 势力/民族/政权/家族，XXX，据点：XXX，坐标：XX, XX
 *   例: 家族，咄陆，据点：孛罗城，坐标：44.9, 82.07
 *
 * 同步写入 5 个文件:
 *   1. src/data/factions.ts                  → FACTIONS 数组
 *   2. src/data/cities_v2.ts                 → CITIES_V2 数组
 *   3. src/data/StartingCapitals.ts          → STARTING_CAPITALS
 *   4. src/assets/CityAssetManager.ts        → factionFlagMap
 *   5. src/data/SandboxDisplayNames.ts       → SANDBOX_DISPLAY_NAMES
 *
 * V4 修改 (2026-05-29):
 *   - 删除单条保存流程 (saveAll + /api/save-faction + 单条表单)
 *     原因: 单条按钮易误点, 且批量 1 条也能完整替代
 */
import { FACTIONS } from '../data/factions';
import { CITIES_V2 as CITIES } from '../data/cities_v2';
import { CityAssetManager } from '../assets/CityAssetManager';
import { SANDBOX_DISPLAY_NAMES } from '../data/SandboxDisplayNames';
import { STARTING_CAPITALS } from '../data/StartingCapitals';
import { pinyin } from 'pinyin-pro';

/** 中文名 → snake_case ID (例: "大韩" → "dahan") */
export function chineseToId(name: string): string {
    if (!name) return '';
    const py = pinyin(name, { toneType: 'none', type: 'array' }).join('').toLowerCase();
    return py.replace(/[^a-z0-9]/g, '');
}

/** 检查 faction ID 是否在任一注册表中被占用 (4 处) */
function isFactionIdUsed(id: string): boolean {
    return FACTIONS.some(f => f.id === id)
        || id in STARTING_CAPITALS
        || id in CityAssetManager.factionFlagMap
        || id in SANDBOX_DISPLAY_NAMES;
}

/** 给定 base，自动找到一个未占用的 faction ID（冲突时加数字后缀） */
export function disambiguateFactionId(base: string): string {
    if (!base) return '';
    if (!isFactionIdUsed(base)) return base;
    for (let i = 2; i < 9999; i++) {
        const candidate = base + i;
        if (!isFactionIdUsed(candidate)) return candidate;
    }
    return base;
}

/** 给定 base (含 city_ 前缀)，自动找到一个未占用的 city ID */
export function disambiguateCityId(base: string): string {
    if (!base) return '';
    const isUsed = (id: string) => (CITIES as any[]).some(c => c.id === id);
    if (!isUsed(base)) return base;
    for (let i = 2; i < 9999; i++) {
        const candidate = base + i;
        if (!isUsed(candidate)) return candidate;
    }
    return base;
}

export class FactionEditor {
    private static _instance: FactionEditor | null = null;
    private container: HTMLElement | null = null;
    private _visible: boolean = false;

    // 邻近冲突 3 按钮配置 (默认全灰, 选中后亮色, 见 previewBatch)
    private static readonly BTN_NEUTRAL_BG = '#555';
    private static readonly BTN_NEUTRAL_FG = '#aaa';
    private static readonly PROX_BTNS: ReadonlyArray<{
        cls: string;
        action: 'delete' | 'force' | 'skip';
        icon: string;
        label: string;
        activeBg: string;
    }> = [
        { cls: 'fe-prox-del',   action: 'delete', icon: '🗑️', label: '删',   activeBg: '#B71C1C' },
        { cls: 'fe-prox-force', action: 'force',  icon: '💪', label: '强制', activeBg: '#E65100' },
        { cls: 'fe-prox-skip',  action: 'skip',   icon: '⏭️', label: '跳过', activeBg: '#388E3C' },
    ];

    public static getInstance(): FactionEditor {
        if (!FactionEditor._instance) {
            FactionEditor._instance = new FactionEditor();
        }
        return FactionEditor._instance;
    }

    private constructor() {
        this.createUI();
    }

    public show(): void {
        this._visible = true;
        if (this.container) this.container.style.display = 'block';
    }

    public hide(): void {
        this._visible = false;
        if (this.container) this.container.style.display = 'none';
    }

    public toggle(): void {
        if (this._visible) this.hide();
        else this.show();
    }

    // ============================================================
    // UI
    // ============================================================
    private createUI(): void {
        document.querySelectorAll('[id="faction-editor"]').forEach(el => el.remove());

        this.container = document.createElement('div');
        this.container.id = 'faction-editor';
        const savedPos = this.loadSavedPosition();
        const posCss = savedPos
            ? `top: ${savedPos.top}px; left: ${savedPos.left}px;`
            : `top: 80px; right: 20px;`;

        this.container.style.cssText = `
            position: fixed;
            ${posCss}
            width: 560px;
            background: rgba(20, 20, 28, 0.97);
            color: white;
            padding: 14px;
            border-radius: 8px;
            display: none;
            z-index: 10001;
            font-family: 'Microsoft YaHei', monospace;
            border: 1px solid #8E44AD;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
            max-height: 90vh;
            overflow-y: auto;
            font-size: 13px;
        `;

        this.container.innerHTML = `
            <h3 id="fe-drag-handle" style="margin:0 0 10px 0; color:#CE93D8; cursor:move; user-select:none;" title="拖动标题移动窗口">
                🏛 势力编辑器（批量） <span style="font-size:11px;color:#888;font-weight:normal;">⠿ 拖动</span>
                <button type="button" id="fe-close" title="关闭"
                    style="float:right; background:transparent; border:1px solid #555; color:#aaa; cursor:pointer; padding:0 8px; border-radius:3px; font-size:14px;">×</button>
            </h3>

            <div style="font-size:11px; color:#888; margin-bottom:8px; line-height:1.5;">
                每行一条，自动识别新建/修改，旗号自动取势力名前 1-2 字。<br>
                支持前缀:
                <code style="background:#333;padding:1px 4px;border-radius:2px;">势力</code>
                <code style="background:#333;padding:1px 4px;border-radius:2px;">民族</code>
                <code style="background:#333;padding:1px 4px;border-radius:2px;">政权</code>
                <code style="background:#333;padding:1px 4px;border-radius:2px;">家族</code><br>
                格式:
                <code style="background:#333;padding:1px 4px;border-radius:2px;">前缀，XXX，据点：XXX，坐标：XX, XX</code>
            </div>

            <textarea id="fe-batch-input" rows="10"
                style="width:100%; background:#1a1a1a; color:#fff; border:1px solid #555; padding:5px; box-sizing:border-box; font-size:12px; resize:vertical; font-family:monospace;"
                placeholder="每行一条，支持多行同时粘贴&#10;新增 (要坐标): 家族：咄陆，据点：孛罗城，坐标：44.9, 82.0&#10;删除 (坐标可省): 势力：后突，据点：黑沙城"></textarea>

            <div style="display:flex; gap:5px; margin-top:8px;">
                <button type="button" id="fe-batch-preview-btn"
                    style="flex:1; background:#FF9800; color:white; border:none; padding:10px; cursor:pointer; font-weight:bold; font-size:13px;">🔍 预览新增</button>
                <button type="button" id="fe-batch-save-btn" disabled
                    style="flex:1; background:#388E3C; color:white; border:none; padding:10px; cursor:not-allowed; font-weight:bold; font-size:13px; opacity:0.5;">🚀 批量保存</button>
            </div>
            <div style="display:flex; gap:5px; margin-top:4px;">
                <button type="button" id="fe-batch-delpreview-btn"
                    style="flex:1; background:#7B1FA2; color:white; border:none; padding:10px; cursor:pointer; font-weight:bold; font-size:13px;">🔍 预览删除</button>
                <button type="button" id="fe-batch-delete-btn" disabled
                    style="flex:1; background:#C62828; color:white; border:none; padding:10px; cursor:not-allowed; font-weight:bold; font-size:13px; opacity:0.5;">🔥 批量删除</button>
            </div>

            <div id="fe-batch-preview" style="font-size:11px; margin-top:8px; line-height:1.6; max-height:400px; overflow-y:auto; border:1px solid #333; border-radius:3px; padding:5px; display:none;"></div>

            <div id="fe-status" style="font-size:12px; color:#aaa; margin-top:8px; min-height:1.2em;"></div>
        `;

        document.body.appendChild(this.container);
        this.bindEvents();
        this.bindDragging();
    }

    // ============================================================
    // 事件绑定
    // ============================================================
    private bindEvents(): void {
        if (!this.container) return;

        const closeBtn = this.container.querySelector('#fe-close') as HTMLButtonElement;
        if (closeBtn) closeBtn.onclick = () => this.hide();

        const previewBtn = this.container.querySelector('#fe-batch-preview-btn') as HTMLButtonElement;
        if (previewBtn) previewBtn.onclick = () => this.previewBatch();

        const delPreviewBtn = this.container.querySelector('#fe-batch-delpreview-btn') as HTMLButtonElement;
        if (delPreviewBtn) delPreviewBtn.onclick = () => this.previewDelete();

        const delExecBtn = this.container.querySelector('#fe-batch-delete-btn') as HTMLButtonElement;
        if (delExecBtn) delExecBtn.onclick = () => this.executeDelete();

        const saveBatchBtn = this.container.querySelector('#fe-batch-save-btn') as HTMLButtonElement;
        if (saveBatchBtn) saveBatchBtn.onclick = () => this.saveBatch();
    }

    // ============================================================
    // 拖拽
    // ============================================================
    private bindDragging(): void {
        if (!this.container) return;
        const handle = this.container.querySelector('#fe-drag-handle') as HTMLElement;
        if (!handle) return;
        let dragging = false;
        let startX = 0, startY = 0, originLeft = 0, originTop = 0;

        const onMouseDown = (e: MouseEvent) => {
            if ((e.target as HTMLElement).id === 'fe-close') return;
            e.stopPropagation();
            e.preventDefault();
            dragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = this.container!.getBoundingClientRect();
            originLeft = rect.left;
            originTop = rect.top;
            this.container!.style.right = 'auto';
            this.container!.style.bottom = 'auto';
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };
        const onMouseMove = (e: MouseEvent) => {
            if (!dragging) return;
            const newLeft = Math.max(0, Math.min(window.innerWidth - 100, originLeft + e.clientX - startX));
            const newTop = Math.max(0, Math.min(window.innerHeight - 50, originTop + e.clientY - startY));
            this.container!.style.left = newLeft + 'px';
            this.container!.style.top = newTop + 'px';
        };
        const onMouseUp = () => {
            if (!dragging) return;
            dragging = false;
            const rect = this.container!.getBoundingClientRect();
            this.saveSavedPosition(rect.left, rect.top);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        handle.addEventListener('mousedown', onMouseDown);
    }

    private loadSavedPosition(): { left: number; top: number } | null {
        try {
            const raw = localStorage.getItem('mapwar.factionEditor.position');
            if (!raw) return null;
            const pos = JSON.parse(raw);
            if (typeof pos.left === 'number' && typeof pos.top === 'number') {
                if (pos.left < 0 || pos.left > window.innerWidth - 100) return null;
                if (pos.top < 0 || pos.top > window.innerHeight - 50) return null;
                return pos;
            }
        } catch { /* ignore */ }
        return null;
    }

    private saveSavedPosition(left: number, top: number): void {
        try {
            localStorage.setItem('mapwar.factionEditor.position', JSON.stringify({ left, top }));
        } catch { /* ignore */ }
    }

    // [REMOVED 2026-05-29 V4] readForm / refreshAll / updateIdStatus / updateShortNameStatus /
    //   updateCapitalStatus / updateNewCityStatus / updateCheckList — 均为单条表单服务, 已废弃
    //   单条流程整体迁移到批量模式 (粘贴 1 行也是批量)

    private haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
        return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // ============================================================
    // 批量导入 - 文本解析
    // ============================================================

    /** 解析单行: "势力，咄陆，据点：孛罗城，坐标：44.9, 82.0"
     *  返回 null = 空行 (静默跳过); { ok: false, reason } = 格式错误; { ok: true, ... } = 成功 */
    private parseBatchLine(line: string, lenientCoord: boolean = false): {
        ok: true;
        factionName: string;
        flagText: string;
        cityName: string;
        lat: number;
        lng: number;
        factionId: string;
        cityId: string;
    } | { ok: false; reason: string } | null {
        const trimmed = line.trim();
        if (!trimmed) return null;

        // [AGENTS.md §四] 4 种前缀 + 郡名/州名 降级补位
        const factionMatch = trimmed.match(/(?:势力|民族|政权|家族|郡名|州名)[,，:：]\s*([^,，:：]+)/);
        if (!factionMatch) return { ok: false, reason: '缺少 "势力/民族/政权/家族/郡名/州名：XXX" 前缀' };
        const factionName = factionMatch[1].trim();
        const prefix = trimmed.match(/^(势力|民族|政权|家族|郡名|州名)/)?.[1] || '';

        const cityMatch = trimmed.match(/据点[,，:：]\s*([^,，:：]+)/);
        if (!cityMatch) return { ok: false, reason: '缺少 "据点：XXX"' };
        const cityName = cityMatch[1].trim();

        // [AGENTS.md §四 规则 4] 郡名/州名前缀时, 势力名不许等于据点名
        if ((prefix === '郡名' || prefix === '州名') && factionName === cityName) {
            return { ok: false, reason: `郡名/州名前缀的势力名 "${factionName}" 不能等于据点名 (违反 1 势力 1 据点)` };
        }

        // [2026-05-30] 删除模式下坐标可选 — 找坐标太麻烦 (用户公理)
        const coordMatch = trimmed.match(/坐标[,，:：]\s*([\d.\-]+)\s*[,，]\s*([\d.\-]+)/);
        let lat = NaN, lng = NaN;
        if (coordMatch) {
            lat = parseFloat(coordMatch[1]);
            lng = parseFloat(coordMatch[2]);
            if (isNaN(lat) || isNaN(lng)) return { ok: false, reason: '坐标无法转数字' };
        } else if (!lenientCoord) {
            return { ok: false, reason: '缺少 "坐标：XX, XX"' };
        }
        // lenientCoord 且无坐标 → lat/lng = NaN (resolveDeleteTargets 会回退到名字匹配)

        // 自动旗号: 取势力名前1-2字
        const flagText = [...factionName].slice(0, 2).join('');

        // [AGENTS.md §三 重复判定]
        //   - 旗号汉字严格相等 → 同一势力 (复用 factionId; 从 SDN 反查)
        //   - 据点名汉字严格相等 → 同一据点 (复用 cityId)
        //   - factionName / 城名包含关系 / 坐标 → 不参与判重
        const sdnHit = Object.entries(SANDBOX_DISPLAY_NAMES).find(([_, v]) => v === flagText);
        const existingCity = CITIES.find((c: any) => c.name === cityName);

        const factionId = sdnHit
            ? sdnHit[0]
            : disambiguateFactionId(chineseToId(factionName));
        const cityId = existingCity
            ? existingCity.id
            : disambiguateCityId(`city_${chineseToId(cityName)}`);

        return { ok: true, factionName, flagText, cityName, lat, lng, factionId, cityId };
    }

    /** 解析整个 textarea, 区分: 成功条目 / 解析失败行 (空行静默跳过) */
    private parseBatchInput(input: string, lenientCoord: boolean = false): {
        entries: Array<{
            factionName: string; flagText: string; cityName: string;
            lat: number; lng: number; factionId: string; cityId: string;
        }>;
        failed: Array<{ lineNum: number; raw: string; reason: string }>;
    } {
        const entries: any[] = [];
        const failed: Array<{ lineNum: number; raw: string; reason: string }> = [];
        input.split('\n').forEach((line, idx) => {
            const r = this.parseBatchLine(line, lenientCoord);
            if (r === null) return; // 空行
            if (r.ok) {
                const { ok: _ok, ...entry } = r;
                entries.push(entry);
            } else {
                failed.push({ lineNum: idx + 1, raw: line.trim().slice(0, 100), reason: r.reason });
            }
        });
        return { entries, failed };
    }

    /** 预览批量导入结果 */
    private async previewBatch(): Promise<void> {
        if (!this.container) return;
        const textarea = this.container.querySelector('#fe-batch-input') as HTMLTextAreaElement;
        const previewEl = this.container.querySelector('#fe-batch-preview') as HTMLElement;
        const saveBtn = this.container.querySelector('#fe-batch-save-btn') as HTMLButtonElement;
        if (!textarea || !previewEl || !saveBtn) return;

        const raw = textarea.value.trim();
        if (!raw) {
            previewEl.style.display = 'block';
            previewEl.innerHTML = '<div style="color:#FF5252;">⚠ 请先输入批量数据</div>';
            saveBtn.disabled = true;
            saveBtn.style.cursor = 'not-allowed';
            saveBtn.style.opacity = '0.5';
            return;
        }

        const { entries, failed } = this.parseBatchInput(raw);

        // [NEW] 如果有解析失败的行, 必须先修正 — 防止误以为全部成功但漏写
        if (failed.length > 0) {
            const esc = (s: string) => s.replace(/[&<>"']/g, c => (
                { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!
            ));
            let errHtml = `<div style="color:#FF5252; font-weight:bold; margin-bottom:6px;">⚠ ${failed.length} 行无法解析, 必须修正后再保存`;
            if (entries.length > 0) errHtml += ` (其余 ${entries.length} 行已解析也会被丢弃)`;
            errHtml += `:</div>`;
            errHtml += `<table style="width:100%; border-collapse:collapse; font-size:11px;">
                <tr style="color:#888;">
                    <th style="padding:2px 6px; text-align:left;">行号</th>
                    <th style="padding:2px 6px; text-align:left;">原因</th>
                    <th style="padding:2px 6px; text-align:left;">原文</th>
                </tr>`;
            for (const f of failed) {
                errHtml += `<tr>
                    <td style="padding:2px 6px; color:#FFB74D;">L${f.lineNum}</td>
                    <td style="padding:2px 6px; color:#FF5252;">${esc(f.reason)}</td>
                    <td style="padding:2px 6px; color:#bbb; font-family:monospace; word-break:break-all;">${esc(f.raw)}</td>
                </tr>`;
            }
            errHtml += `</table>`;
            errHtml += `<div style="color:#888; font-size:10px; margin-top:6px; line-height:1.5;">
                正确格式: <code style="background:#333;padding:1px 4px;border-radius:2px;">前缀，XXX，据点：XXX，坐标：XX, XX</code>
            </div>`;
            previewEl.innerHTML = errHtml;
            previewEl.style.display = 'block';
            saveBtn.disabled = true;
            saveBtn.style.cursor = 'not-allowed';
            saveBtn.style.opacity = '0.5';
            // 清掉过期的预览数据, 防止用户按"保存"复用旧数据
            (previewEl as any)._batchEntries = null;
            (previewEl as any)._batchActions = null;
            (previewEl as any)._batchProximityEntries = null;
            return;
        }

        if (entries.length === 0) {
            previewEl.style.display = 'block';
            previewEl.innerHTML = '<div style="color:#FF5252;">⚠ 请输入至少一条数据。格式: 势力/民族/政权/家族，XXX，据点：XXX，坐标：XX, XX</div>';
            saveBtn.disabled = true;
            saveBtn.style.cursor = 'not-allowed';
            saveBtn.style.opacity = '0.5';
            return;
        }

        // 构建预览 HTML
        let html = `<div style="color:#CE93D8; font-weight:bold; margin-bottom:4px;">📋 共 ${entries.length} 条</div>`;
        const hasClose = CITIES.some((c: any) => c.name && c.lat && c.lng);
        html += `<table style="width:100%; border-collapse:collapse; font-size:10px; table-layout:fixed;">
            <colgroup>
                <col style="width:12%;">
                <col style="width:8%;">
                <col style="width:12%;">
                <col style="width:18%;">
                <col style="width:25%;">
                <col style="width:25%;">
            </colgroup>
            <tr style="color:#888;">
                <th style="text-align:left; padding:2px 4px; border-bottom:1px solid #333;">势力</th>
                <th style="text-align:center; padding:2px 4px; border-bottom:1px solid #333;">旗</th>
                <th style="text-align:left; padding:2px 4px; border-bottom:1px solid #333;">据点</th>
                <th style="text-align:left; padding:2px 4px; border-bottom:1px solid #333;">坐标</th>
                <th style="text-align:left; padding:2px 4px; border-bottom:1px solid #333;">冲突信息</th>
                <th style="text-align:center; padding:2px 4px; border-bottom:1px solid #333;">操作</th>
            </tr>`;

        // 收集邻近警告条目
        const proximityEntries: Array<{ index: number; conflictCityId: string; conflictName: string; conflictFactionId: string; distance: number }> = [];
        // 用户对邻近条目的操作选择: { [index]: 'delete' | 'skip' | 'force' }
        const actions: { [key: number]: string } = {};

        // [2026-05-29 智能重排] 构建"批次执行完后"的虚拟城市状态:
        //   - 现有城被 REPLACE 时, 已搬到新坐标
        //   - NEW 条目的 50km 检查针对这个虚拟状态 (不是当前 CITIES)
        //   - 例: "贵山城 搬走 + 忽毡 新加在原贵山城位置" 不再误报冲突
        const virtualCities = (CITIES as any[]).map((c: any) => ({ ...c }));
        for (const e of entries) {
            const vc = virtualCities.find((c: any) => c.id === e.cityId);
            if (vc) {
                vc.lat = e.lat;
                vc.lng = e.lng;
                vc.factionId = e.factionId;
                vc.name = e.cityName;
            }
        }

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];

            // 检查是否已有同名据点
            const cityExists = CITIES.some((c: any) => c.id === entry.cityId);
            const isNew = !cityExists;

            // [2026-05-29 检测 C] REPLACE 大幅移动警告
            //   现有城 coord 跟你输入差 > 50km → 可能你输错了, 也可能你在纠正旧错
            //   不阻止保存, 但醒目提示
            let moveWarn = '';
            let moveDistance = 0;
            if (!isNew) {
                const existing = (CITIES as any[]).find((c: any) => c.id === entry.cityId);
                if (existing) {
                    moveDistance = this.haversineKm(existing.lat, existing.lng, entry.lat, entry.lng);
                    if (moveDistance > 50) {
                        moveWarn = `搬移 ${moveDistance.toFixed(0)}km`;
                    }
                }
            }
            const operation = isNew ? '🆕 新建' : (moveWarn ? `📝 修改⚠` : '📝 修改');

            // 50km 检查 (仅对新建城检查), 用 virtualCities 看"执行后"状态
            let proximityWarn = '';
            let conflictCityId = '';
            let conflictName = '';
            let conflictFactionId = '';
            let conflictDistance = 0;
            if (isNew) {
                const tooClose = virtualCities.filter((c: any) => {
                    if (c.id === entry.cityId) return false; // self (不该发生但保险)
                    if (Math.abs(c.lat - entry.lat) > 0.6) return false;
                    if (Math.abs(c.lng - entry.lng) > 0.6) return false;
                    const km = this.haversineKm(entry.lat, entry.lng, c.lat, c.lng);
                    return km < 50;
                });
                if (tooClose.length > 0) {
                    proximityWarn = `距${tooClose[0].name}<50km`;
                    conflictCityId = tooClose[0].id;
                    conflictName = tooClose[0].name;
                    conflictFactionId = tooClose[0].factionId;
                    conflictDistance = this.haversineKm(entry.lat, entry.lng, tooClose[0].lat, tooClose[0].lng);
                    proximityEntries.push({ index: i, conflictCityId, conflictName, conflictFactionId, distance: conflictDistance });
                }
            }

            // [2026-05-29] 包含关系软警告: 名字 A 是 B 的子串 (或反之), 长度都 ≥ 2
            //   不阻止保存, 但提示人工审 (例: 克鲁伦河 vs 克鲁伦, 大明国 vs 大明)
            //   仅对新建条目检查 (修改是 replace 模式, 不存在"误重")
            let similarWarn = '';
            if (isNew) {
                const findSimilar = (myName: string, pool: Array<{name: string}>) =>
                    pool.find(p => p.name && p.name !== myName && p.name.length >= 2 && myName.length >= 2
                        && (myName.includes(p.name) || p.name.includes(myName)));
                const simCity = findSimilar(entry.cityName, CITIES as any[]);
                const simFaction = findSimilar(entry.factionName, FACTIONS as any[]);
                const bits: string[] = [];
                if (simCity)    bits.push(`据点似 "${simCity.name}"`);
                if (simFaction) bits.push(`势力似 "${simFaction.name}"`);
                if (bits.length > 0) similarWarn = bits.join('<br>');
            }

            // 冲突信息列
            let conflictHtml = '';
            if (proximityWarn) {
                const fName = FACTIONS.find((f: any) => f.id === conflictFactionId)?.name || conflictFactionId;
                conflictHtml = `<span style="color:#FF5252;font-size:9px;">
                    ⚠ ${fName}/${conflictName}<br>
                    <span style="color:#FFB74D;">${conflictDistance.toFixed(1)}km</span>
                </span>`;
            } else if (moveWarn) {
                // [2026-05-29] REPLACE 移动 > 50km 警告 (软, 不阻止)
                const existing = (CITIES as any[]).find((c: any) => c.id === entry.cityId);
                conflictHtml = `<span style="color:#FF9800;font-size:9px;">⚠ ${moveWarn}<br>
                    <span style="color:#888;">从 (${existing?.lat.toFixed(2)}, ${existing?.lng.toFixed(2)})</span>
                </span>`;
            } else if (similarWarn) {
                // 包含警告 (软, 不阻止)
                conflictHtml = `<span style="color:#FFB74D;font-size:9px;">⚠ 包含<br>${similarWarn}</span>`;
            } else {
                conflictHtml = `<span style="color:${isNew ? '#81C784' : '#FFD54F'};">${operation}</span>`;
            }

            // 操作列显示
            let actionHtml = '';
            if (proximityWarn) {
                // 邻近警告 → 显示三个按钮 (默认无选择 = 全灰, 选中后亮色)
                const btnBase = 'border:none;padding:1px 4px;border-radius:2px;cursor:pointer;font-size:9px;';
                const btnGrey = `background:${FactionEditor.BTN_NEUTRAL_BG};color:${FactionEditor.BTN_NEUTRAL_FG};${btnBase}`;
                actionHtml = `<div style="display:flex;gap:2px;flex-wrap:wrap;justify-content:center;">` +
                    FactionEditor.PROX_BTNS.map(b =>
                        `<button class="${b.cls}" data-idx="${i}" style="${btnGrey}">${b.icon} ${b.label}</button>`
                    ).join('') + `</div>`;
            } else {
                actionHtml = `<span style="color:${isNew ? '#81C784' : '#FFD54F'};">${operation}</span>`;
            }

            // [2026-05-29 扩展] 自动判定 3 类 type, 跟 detectCityType (vite.config.ts) 同步
            // pass:    关/口/塞/陉/径/隘/堡 → 10000 兵
            // medium:  府/京/都             → 10000 兵
            // small:   默认 (城/寨/卫/...) → 5000 兵
            let typeBadge = '';
            const n = entry.cityName;
            const passKey = ['关','口','塞','陉','径','隘','堡'].find(s => n.endsWith(s));
            const medKey  = ['府','京','都'].find(s => n.endsWith(s));
            if (passKey) {
                typeBadge = ` <span style="color:#FFB74D;font-size:9px;background:#5d4037;padding:0 3px;border-radius:2px;" title="关隘 pass (10000 兵)">${passKey}</span>`;
            } else if (medKey) {
                typeBadge = ` <span style="color:#90caf9;font-size:9px;background:#1565c0;padding:0 3px;border-radius:2px;" title="中城 medium_city (10000 兵)">${medKey}</span>`;
            }

            html += `<tr>
                <td style="padding:2px 4px; border-bottom:1px solid #222; color:#fff; overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${entry.factionName}">${entry.factionName}</td>
                <td style="text-align:center; padding:2px 4px; border-bottom:1px solid #222; color:#aaa; font-size:11px;">${entry.flagText}</td>
                <td style="padding:2px 4px; border-bottom:1px solid #222; color:#fff; overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${entry.cityName}">${entry.cityName}${typeBadge}</td>
                <td style="padding:2px 4px; border-bottom:1px solid #222; color:#888; font-size:9px;">${entry.lat.toFixed(3)}, ${entry.lng.toFixed(3)}</td>
                <td style="padding:2px 4px; border-bottom:1px solid #222;">${conflictHtml}</td>
                <td style="text-align:center; padding:2px 4px; border-bottom:1px solid #222;">${actionHtml}</td>
            </tr>`;
        }
        html += '</table>';

        const proxCount = proximityEntries.length;
        if (proxCount > 0) {
            html += `<div style="color:#FFB74D; margin-top:4px; font-size:10px;">
                ⚠ ${proxCount} 条距已有城不足 50km，请为每条选择操作后再保存
            </div>`;
        } else {
            html += `<div style="color:#888; margin-top:4px; font-size:10px;">
                🟢 新建 &nbsp; 🟡 修改
            </div>`;
        }

        previewEl.innerHTML = html;
        previewEl.style.display = 'block';

        // 绑定邻近条目的按钮事件 (3 套用 PROX_BTNS 配置驱动, 默认全灰, 选中亮色)
        const updateSaveBtn = () => {
            const allResolved = proximityEntries.every(pe => actions[pe.index] !== undefined);
            saveBtn.disabled = !allResolved;
            saveBtn.style.cursor = allResolved ? 'pointer' : 'not-allowed';
            saveBtn.style.opacity = allResolved ? '1' : '0.5';
        };

        const resetRowStyle = (idx: number) => {
            for (const b of FactionEditor.PROX_BTNS) {
                previewEl.querySelectorAll<HTMLElement>(`.${b.cls}[data-idx="${idx}"]`).forEach(btn => {
                    btn.style.background = FactionEditor.BTN_NEUTRAL_BG;
                    btn.style.color = FactionEditor.BTN_NEUTRAL_FG;
                    btn.style.fontWeight = 'normal';
                });
            }
        };

        for (const b of FactionEditor.PROX_BTNS) {
            previewEl.querySelectorAll<HTMLElement>(`.${b.cls}`).forEach(btn => {
                btn.onclick = () => {
                    const idx = parseInt((btn as any).dataset.idx);
                    actions[idx] = b.action;
                    resetRowStyle(idx);
                    btn.style.background = b.activeBg;
                    btn.style.color = '#fff';
                    btn.style.fontWeight = 'bold';
                    updateSaveBtn();
                };
            });
        }

        // 存储数据供保存使用
        (previewEl as any)._batchEntries = entries;
        (previewEl as any)._batchActions = actions;
        (previewEl as any)._batchProximityEntries = proximityEntries;

        // 初始状态：有邻近警告则禁用保存
        updateSaveBtn();
    }

    /** 批量保存 (POST 到 /api/batch-import) */
    private async saveBatch(): Promise<void> {
        if (!this.container) return;
        const previewEl = this.container.querySelector('#fe-batch-preview') as HTMLElement;
        const saveBtn = this.container.querySelector('#fe-batch-save-btn') as HTMLButtonElement;
        if (!previewEl || !saveBtn) return;

        let entries: any[] = (previewEl as any)._batchEntries;
        if (!entries || entries.length === 0) {
            // 还没有预览，自动触发预览
            await this.previewBatch();
            // 预览后再次检查
            entries = (previewEl as any)._batchEntries;
            if (!entries || entries.length === 0) {
                // previewBatch 已显示错误信息，无需重复提示
                return;
            }
            // 预览后有邻近冲突 → 按钮已被禁用，让用户先选择 delete/skip
            const proxAfter: Array<any> = (previewEl as any)._batchProximityEntries || [];
            if (proxAfter.length > 0) {
                return; // 等待用户与按钮交互后再次点击保存
            }
            // 没有邻近冲突，预览数据就绪，继续执行保存
        }

        // 读取用户对邻近条目的操作选择
        const actions: { [key: number]: string } = (previewEl as any)._batchActions || {};
        const proximityEntries: Array<{ index: number; conflictCityId: string; conflictName: string; conflictFactionId: string; distance: number }> =
            (previewEl as any)._batchProximityEntries || [];

        // 处理邻近条目的操作:
        //   delete → 设置 deleteExistingCityId (服务端先删原城再插入)
        //   force  → 设置 forceProximity (跳过50km检查，新旧都保留)
        //   skip   → 过滤掉该条目
        const processedEntries = entries
            .map((entry: any, idx: number) => {
                const pe = proximityEntries.find(p => p.index === idx);
                if (!pe) return entry; // 无邻近冲突，原样保留

                const action = actions[idx];
                if (action === 'delete') {
                    // 服务器会先删原城再插入新据点
                    return { ...entry, deleteExistingCityId: pe.conflictCityId };
                }
                if (action === 'force') {
                    // 跳过50km检查，新旧据点都保留
                    return { ...entry, forceProximity: true };
                }
                // action === 'skip' → 跳过此条
                return null;
            })
            .filter((e: any) => e !== null);

        if (processedEntries.length === 0) {
            alert('所有条目都被跳过，无需保存。');
            saveBtn.disabled = false;
            saveBtn.innerText = '🚀 批量保存';
            saveBtn.style.cursor = 'pointer';
            return;
        }

        saveBtn.disabled = true;
        saveBtn.innerText = '⏳ 导入中...';
        saveBtn.style.cursor = 'not-allowed';

        try {
            const response = await fetch('/api/batch-import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entries: processedEntries }),
            });
            const result = await response.json();
            console.log('[FactionEditor] /api/batch-import 返回:', result);

            // [FIX 2026-05-29 v2] 区分两种 ok=false:
            //   (a) 服务端抛 catch (results 不存在) → 通用错误信息
            //   (b) 服务端每条都有详情但有失败 (results 存在) → 落到下面 failures 表显示
            if (result.ok === false && !result.results) {
                alert(`❌ 批量导入失败:\n\n${result.error || '服务端未知错误'}\n\n查看 dev server 终端控制台获取详情。\n\n文本框内容已保留, 可修改后重试。`);
                return;
            }

            const successes = (result.results || []).filter((r: any) => r.ok);
            const failures = (result.results || []).filter((r: any) => !r.ok);

            if (failures.length === 0) {
                // 全部成功 → 询问刷新
                const summary = successes.map((r: any) => `✅ ${r.file} (${r.operation})`).join('\n');
                const proceed = confirm(`🎉 批量导入全部成功！\n\n${summary}\n\n点"确定"刷新浏览器看效果。\n点"取消"继续编辑。`);
                if (proceed) location.reload();
            } else {
                // 部分/全部失败 → 不刷新，保留文本框内容
                const okSummary = successes.map((r: any) => `✅ ${r.file} (${r.operation})`).join('\n');
                const errSummary = failures.map((r: any) => `❌ ${r.file}: ${r.error}`).join('\n');

                let msg = '';
                if (successes.length > 0) {
                    msg += `✅ 成功 ${successes.length} 条:\n${okSummary}\n\n`;
                }
                msg += `⚠ 失败 ${failures.length} 条:\n${errSummary}`;
                msg += `\n\n文本框内容已保留，可修改后重新保存。`;

                alert(msg);
            }
        } catch (e: any) {
            alert(`❌ 网络错误: ${e?.message || e}\n\n确认 npm run dev 在运行。`);
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerText = '🚀 批量保存';
            saveBtn.style.cursor = 'pointer';
        }
    }

    // [REMOVED 2026-05-29 V4] saveAll() — 单条保存方法已删除, 用 saveBatch 即可

    // ============================================================
    // 批量删除 (2026-05-29 NEW)
    // 输入格式同新增: 势力/民族/政权/家族，XXX，据点：XXX，坐标：XX, XX
    // 命中规则: 势力名 / 据点名 / 坐标 / 旗号 任一在项目中存在 → 可删
    //          四项全部找不到 → 此行报错, 阻止整批删除
    // ============================================================

    /** 把输入行匹配到项目里现存的"势力-据点"单元.
     *  设计公理: 一个势力 = 一个据点 = 一个旗号.
     *  匹配规则: 4 项 (势力名/据点名/坐标/旗号) 任一命中, 反向补全另外几项.
     *  返回的 factionId + cityId 一同删除 (整单元清除) */
    private resolveDeleteTargets(entries: Array<{
        factionName: string; flagText: string; cityName: string; lat: number; lng: number;
    }>): Array<{
        idx: number;
        input: typeof entries[0];
        factionId: string | null;     // 删 factions+SC+flagMap+SDN
        cityId: string | null;         // 删 cities_v2
        matchedBy: string[];           // 命中原因 (用户能看清是哪几项匹配的)
    }> {
        const COORD_TOL = 0.01; // ~1km 容差
        return entries.map((entry, idx) => {
            let factionId: string | null = null;
            let cityId: string | null = null;
            const by: string[] = [];

            // ─── 1. 直接匹配 4 项 ───
            const fByName = FACTIONS.find((f: any) => f.name === entry.factionName);
            if (fByName) { factionId = fByName.id; by.push('势力名'); }

            if (!factionId) {
                const flagHit = Object.entries(SANDBOX_DISPLAY_NAMES).find(([_, v]) => v === entry.flagText);
                if (flagHit) { factionId = flagHit[0]; by.push('旗号'); }
            }

            const cByName = (CITIES as any[]).find(c => c.name === entry.cityName);
            if (cByName) { cityId = cByName.id; by.push('据点名'); }

            if (!cityId) {
                const cByCoord = (CITIES as any[]).find(c =>
                    Math.abs(c.lat - entry.lat) < COORD_TOL &&
                    Math.abs(c.lng - entry.lng) < COORD_TOL
                );
                if (cByCoord) { cityId = cByCoord.id; by.push('坐标'); }
            }

            // ─── 2. 反向补全 ("一个单元" 强制一致) ───
            if (factionId && !cityId) {
                const capCityId = (STARTING_CAPITALS as any)[factionId];
                if (capCityId) { cityId = capCityId; by.push('→首都'); }
            }
            if (cityId && !factionId) {
                const cityObj = (CITIES as any[]).find(c => c.id === cityId);
                if (cityObj?.factionId) { factionId = cityObj.factionId; by.push('→所属'); }
            }

            return { idx, input: entry, factionId, cityId, matchedBy: by };
        });
    }

    /** 预览删除: 展示每行将删什么, 四项全空的行报错 */
    private async previewDelete(): Promise<void> {
        if (!this.container) return;
        const textarea = this.container.querySelector('#fe-batch-input') as HTMLTextAreaElement;
        const previewEl = this.container.querySelector('#fe-batch-preview') as HTMLElement;
        const delBtn = this.container.querySelector('#fe-batch-delete-btn') as HTMLButtonElement;
        const saveBtn = this.container.querySelector('#fe-batch-save-btn') as HTMLButtonElement;
        if (!textarea || !previewEl || !delBtn) return;

        // 切到删除模式: 清掉新增模式的缓存与按钮可用状态
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.style.cursor = 'not-allowed';
            saveBtn.style.opacity = '0.5';
        }
        (previewEl as any)._batchEntries = null;
        (previewEl as any)._batchActions = null;
        (previewEl as any)._batchProximityEntries = null;
        (previewEl as any)._batchDeleteTargets = null;

        const raw = textarea.value.trim();
        if (!raw) {
            previewEl.style.display = 'block';
            previewEl.innerHTML = '<div style="color:#FF5252;">⚠ 请先输入批量数据</div>';
            delBtn.disabled = true;
            delBtn.style.cursor = 'not-allowed';
            delBtn.style.opacity = '0.5';
            return;
        }

        // [2026-05-30] 删除模式坐标可选 (用户公理: 找坐标太麻烦)
        const { entries, failed } = this.parseBatchInput(raw, true);

        const esc = (s: string) => s.replace(/[&<>"']/g, c => (
            { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!
        ));

        // 1) 解析失败行 → 拦截
        if (failed.length > 0) {
            let h = `<div style="color:#FF5252;font-weight:bold;margin-bottom:6px;">⚠ ${failed.length} 行无法解析, 必须修正后再删除:</div>`;
            h += `<table style="width:100%;border-collapse:collapse;font-size:11px;">
                <tr style="color:#888;"><th style="padding:2px 6px;text-align:left;">行</th><th style="padding:2px 6px;text-align:left;">原因</th><th style="padding:2px 6px;text-align:left;">原文</th></tr>`;
            for (const f of failed) h += `<tr><td style="padding:2px 6px;color:#FFB74D;">L${f.lineNum}</td><td style="padding:2px 6px;color:#FF5252;">${esc(f.reason)}</td><td style="padding:2px 6px;color:#bbb;font-family:monospace;">${esc(f.raw)}</td></tr>`;
            h += `</table>`;
            previewEl.innerHTML = h;
            previewEl.style.display = 'block';
            delBtn.disabled = true;
            delBtn.style.cursor = 'not-allowed';
            delBtn.style.opacity = '0.5';
            return;
        }

        if (entries.length === 0) {
            previewEl.innerHTML = '<div style="color:#FF5252;">⚠ 请输入至少一条数据</div>';
            previewEl.style.display = 'block';
            delBtn.disabled = true;
            delBtn.style.cursor = 'not-allowed';
            delBtn.style.opacity = '0.5';
            return;
        }

        const targets = this.resolveDeleteTargets(entries);
        const notFound = targets.filter(t => !t.factionId && !t.cityId);

        let html = '';
        // 2) 四项全不命中 → 拦截
        if (notFound.length > 0) {
            html += `<div style="color:#FF5252;font-weight:bold;margin-bottom:6px;">❌ ${notFound.length} 行在项目里完全不存在 (势力/据点/坐标/旗号 都没匹配), 必须删掉或修正:</div>`;
            html += `<table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:8px;">
                <tr style="color:#888;"><th style="padding:2px 6px;text-align:left;">行</th><th style="padding:2px 6px;text-align:left;">势力</th><th style="padding:2px 6px;text-align:left;">据点</th><th style="padding:2px 6px;text-align:left;">坐标</th></tr>`;
            for (const t of notFound) {
                const e = t.input;
                html += `<tr><td style="padding:2px 6px;color:#FFB74D;">L${t.idx + 1}</td><td style="padding:2px 6px;color:#fff;">${esc(e.factionName)}</td><td style="padding:2px 6px;color:#fff;">${esc(e.cityName)}</td><td style="padding:2px 6px;color:#888;">${e.lat.toFixed(3)}, ${e.lng.toFixed(3)}</td></tr>`;
            }
            html += '</table>';
            previewEl.innerHTML = html;
            previewEl.style.display = 'block';
            delBtn.disabled = true;
            delBtn.style.cursor = 'not-allowed';
            delBtn.style.opacity = '0.5';
            return;
        }

        // 3) 全部命中 → 展示删除清单 (一行 = 一个 整单元)
        // 设计公理: 1 势力 = 1 据点 = 1 旗号. 整单元统一删
        // 部分单元只命中一半 (factionId 或 cityId 缺一) → 显示警告但允许删除
        const halfMatches = targets.filter(t => !t.factionId || !t.cityId);

        html += `<div style="color:#FFB74D;font-weight:bold;margin-bottom:6px;">🔥 即将删除 ${targets.length} 个单元 (势力+据点+旗号 整组)</div>`;
        if (halfMatches.length > 0) {
            html += `<div style="color:#FF9800;font-size:10px;margin-bottom:4px;">⚠ ${halfMatches.length} 个单元只匹配到一半 (势力或据点缺失反向补全), 只删命中那部分</div>`;
        }
        html += `<table style="width:100%;border-collapse:collapse;font-size:11px;">
            <tr style="color:#888;">
                <th style="padding:2px 6px;text-align:left;">行</th>
                <th style="padding:2px 6px;text-align:left;">单元</th>
                <th style="padding:2px 6px;text-align:left;">命中通过</th>
            </tr>`;
        for (const t of targets) {
            const fStr = t.factionId
                ? `<span style="color:#fff;">${esc(t.input.factionName)}</span><span style="color:#FFB74D;font-size:9px;"> (${t.factionId})</span>`
                : `<span style="color:#FF5252;">⚠势力未识别</span>`;
            const cStr = t.cityId
                ? `<span style="color:#fff;">${esc(t.input.cityName)}</span><span style="color:#FFB74D;font-size:9px;"> (${t.cityId})</span>`
                : `<span style="color:#FF5252;">⚠据点未识别</span>`;
            html += `<tr>
                <td style="padding:2px 6px;color:#FFB74D;">L${t.idx + 1}</td>
                <td style="padding:2px 6px;">${fStr} → ${cStr}</td>
                <td style="padding:2px 6px;color:#81C784;font-size:10px;">${esc(t.matchedBy.join(' + '))}</td>
            </tr>`;
        }
        html += '</table>';
        html += `<div style="color:#FF5252;font-size:10px;margin-top:6px;">⚠ 删除不可撤销, 点 "🔥 批量删除" 后会真正写 5 文件并刷新浏览器</div>`;

        previewEl.innerHTML = html;
        previewEl.style.display = 'block';
        (previewEl as any)._batchDeleteTargets = targets;

        delBtn.disabled = false;
        delBtn.style.cursor = 'pointer';
        delBtn.style.opacity = '1';
    }

    /** 执行删除: POST 到 /api/batch-delete */
    private async executeDelete(): Promise<void> {
        if (!this.container) return;
        const previewEl = this.container.querySelector('#fe-batch-preview') as HTMLElement;
        const delBtn = this.container.querySelector('#fe-batch-delete-btn') as HTMLButtonElement;
        if (!previewEl || !delBtn) return;

        const targets: Array<{ factionId: string | null; cityId: string | null }> =
            (previewEl as any)._batchDeleteTargets;
        if (!targets || targets.length === 0) {
            alert('请先点 "🔍 预览删除" 解析输入');
            return;
        }

        const fIds = targets.filter(t => t.factionId).map(t => t.factionId!);
        const cIds = targets.filter(t => t.cityId).map(t => t.cityId!);
        const ok = confirm(`⚠ 即将永久删除:\n  - ${fIds.length} 个势力 (4 个注册表)\n  - ${cIds.length} 个据点 (cities_v2.ts)\n  - 所有引用这些据点的道路 (VectorRoadData.ts, 自动同步)\n\n不可撤销。确定吗?`);
        if (!ok) return;

        delBtn.disabled = true;
        delBtn.innerText = '⏳ 删除中...';
        delBtn.style.cursor = 'not-allowed';

        try {
            const response = await fetch('/api/batch-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targets: targets.map(t => ({ factionId: t.factionId, cityId: t.cityId })) }),
            });
            const result = await response.json();
            console.log('[FactionEditor] /api/batch-delete 返回:', result);

            if (result.ok === false) {
                alert(`❌ 删除失败:\n\n${result.error || '服务端未知错误'}`);
                return;
            }

            const proceed = confirm(`🎉 删除完成! ${fIds.length} 势力 + ${cIds.length} 据点\n\n点"确定"刷新浏览器看效果。`);
            if (proceed) location.reload();
        } catch (e: any) {
            alert(`❌ 网络错误: ${e?.message || e}\n\n确认 npm run dev 在运行。`);
        } finally {
            delBtn.disabled = false;
            delBtn.innerText = '🔥 批量删除';
            delBtn.style.cursor = 'pointer';
        }
    }

    private setStatus(msg: string): void {
        const el = this.container?.querySelector('#fe-status') as HTMLElement;
        if (el) el.textContent = msg;
    }
}
