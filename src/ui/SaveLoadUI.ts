/**
 * SaveLoadUI.ts — 存档/读档界面
 *
 * 「存档」按钮：一键存到当天档位（同一天覆盖）。
 * 「读档」按钮：弹出档位列表（按日期倒序），可读取/删除，并支持导出/导入 JSON 文件。
 *
 * 读档会整个替换当前世界，故加二次确认——防直播中误点把江山冲掉。
 */
import type { GameSaveManager, SaveMeta } from '../app/GameSaveManager';

const PANEL_ID = 'save-load-panel';
const STYLE_ID = 'save-load-style';

export class SaveLoadUI {
    private mgr: GameSaveManager;
    private panel: HTMLDivElement | null = null;

    constructor(mgr: GameSaveManager) {
        this.mgr = mgr;
    }

    public init(): void {
        this.injectStyle();
        const controls = document.querySelector('.hud-controls');
        if (!controls || document.getElementById('save-btn')) return;

        const saveBtn = document.createElement('button');
        saveBtn.id = 'save-btn';
        saveBtn.type = 'button';
        saveBtn.className = 'game-time-btn';
        saveBtn.title = '存档到当天档位（同一天覆盖）';
        saveBtn.textContent = '存档';
        saveBtn.addEventListener('click', () => {
            const date = this.mgr.saveToSlot();
            saveBtn.textContent = `已存 ${date}`;
            saveBtn.style.color = '#e8b25a';
            window.setTimeout(() => { saveBtn.textContent = '存档'; saveBtn.style.color = ''; }, 2000);
        });
        controls.appendChild(saveBtn);

        const loadBtn = document.createElement('button');
        loadBtn.id = 'load-btn';
        loadBtn.type = 'button';
        loadBtn.className = 'game-time-btn';
        loadBtn.title = '读档 / 导出 / 导入';
        loadBtn.textContent = '读档';
        loadBtn.addEventListener('click', () => this.togglePanel());
        controls.appendChild(loadBtn);
    }

    private injectStyle(): void {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            #${PANEL_ID} {
                position: fixed; right: 16px; bottom: 64px; z-index: 4000;
                width: 320px; max-height: 60vh; overflow-y: auto;
                background: #1a1713; border: 1px solid #3a3226; border-radius: 8px;
                padding: 10px; color: #ece4d3; font-size: 13px;
                font-family: "PingFang SC","Microsoft YaHei",system-ui,sans-serif;
                box-shadow: 0 6px 24px rgba(0,0,0,.5);
            }
            #${PANEL_ID} h4 { margin: 0 0 8px; color: #d8b95e; font-size: 14px; display:flex; justify-content:space-between; align-items:center; }
            #${PANEL_ID} .sl-close { cursor:pointer; color:#8a8271; background:none; border:none; font-size:16px; }
            #${PANEL_ID} .sl-row {
                display:flex; justify-content:space-between; align-items:center; gap:6px;
                padding:7px 6px; border-bottom:1px solid #262117;
            }
            #${PANEL_ID} .sl-row:last-of-type { border-bottom:none; }
            #${PANEL_ID} .sl-date { font-weight:600; color:#ece4d3; }
            #${PANEL_ID} .sl-meta { color:#8a8271; font-size:11px; }
            #${PANEL_ID} button.sl-act {
                background:#241f18; border:1px solid #3a3226; color:#d8b95e;
                border-radius:4px; padding:3px 8px; cursor:pointer; font-size:12px;
            }
            #${PANEL_ID} button.sl-act:hover { border-color:#d8b95e; }
            #${PANEL_ID} button.sl-del { color:#c9736a; }
            #${PANEL_ID} .sl-foot { display:flex; gap:6px; margin-top:8px; padding-top:8px; border-top:1px solid #3a3226; }
            #${PANEL_ID} .sl-empty { color:#8a8271; padding:12px 4px; text-align:center; }
        `;
        document.head.appendChild(style);
    }

    private togglePanel(): void {
        if (this.panel) { this.closePanel(); return; }
        this.panel = document.createElement('div');
        this.panel.id = PANEL_ID;
        document.body.appendChild(this.panel);
        this.renderPanel();
    }

    private closePanel(): void {
        this.panel?.remove();
        this.panel = null;
    }

    private renderPanel(): void {
        if (!this.panel) return;
        const saves = this.mgr.listSaves();
        this.panel.innerHTML = '';

        const h = document.createElement('h4');
        h.innerHTML = '<span>存档</span>';
        const close = document.createElement('button');
        close.className = 'sl-close';
        close.textContent = '×';
        close.onclick = () => this.closePanel();
        h.appendChild(close);
        this.panel.appendChild(h);

        if (saves.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'sl-empty';
            empty.textContent = '暂无存档';
            this.panel.appendChild(empty);
        } else {
            for (const s of saves) this.panel.appendChild(this.buildRow(s));
        }

        const foot = document.createElement('div');
        foot.className = 'sl-foot';
        const exportBtn = document.createElement('button');
        exportBtn.className = 'sl-act';
        exportBtn.textContent = '导出当前为文件';
        exportBtn.onclick = () => this.mgr.exportFile();
        foot.appendChild(exportBtn);

        const importBtn = document.createElement('button');
        importBtn.className = 'sl-act';
        importBtn.textContent = '导入文件';
        importBtn.onclick = () => this.pickFile();
        foot.appendChild(importBtn);
        this.panel.appendChild(foot);
    }

    private buildRow(s: SaveMeta): HTMLDivElement {
        const row = document.createElement('div');
        row.className = 'sl-row';

        const info = document.createElement('div');
        const t = new Date(s.savedAt);
        const hhmm = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
        const title = s.isAuto ? `自动存档 <span class="sl-meta">${s.date}</span>` : s.date;
        info.innerHTML = `<div class="sl-date">${title}</div>`
            + `<div class="sl-meta">${hhmm} · 纪年 ${s.year} · 据点 ${s.cityCount} · 军团 ${s.armyCount}</div>`;
        row.appendChild(info);

        const acts = document.createElement('div');
        const load = document.createElement('button');
        load.className = 'sl-act';
        load.textContent = '读取';
        load.onclick = () => {
            if (!window.confirm(`读取 ${s.date} 的存档？\n当前世界会被完全替换。`)) return;
            try {
                this.mgr.restore(this.mgr.loadSlot(s.key));
                this.closePanel();
            } catch (e) {
                window.alert(`读档失败：${(e as Error).message}`);
            }
        };
        acts.appendChild(load);

        const del = document.createElement('button');
        del.className = 'sl-act sl-del';
        del.textContent = '删';
        del.onclick = () => {
            if (!window.confirm(`删除 ${s.date} 的存档？`)) return;
            this.mgr.deleteSlot(s.key);
            this.renderPanel();
        };
        acts.appendChild(del);
        row.appendChild(acts);
        return row;
    }

    private pickFile(): void {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json,.json';
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            try {
                const save = await this.mgr.importFile(file);
                if (!window.confirm(`导入 ${save.date} 的存档并读取？\n当前世界会被完全替换。`)) return;
                this.mgr.restore(save);
                this.closePanel();
            } catch (e) {
                window.alert(`导入失败：${(e as Error).message}`);
            }
        };
        input.click();
    }
}
