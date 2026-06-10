import { DEFAULT_PORTRAIT_CONFIG, type PortraitConfigData } from '../data/portrait_config';
import { gameLog } from '../utils/GameLogger';

/**
 * PortraitConfigManager — 立绘配置管理器
 *
 * 职责：
 * 1. 管理战斗事件 → 立绘路径的映射
 * 2. 通过 File System Access API 读写 portrait_config.json（可选，非构建依赖）
 * 3. 参照 VectorRoadEditor.saveToFile 的 showSaveFilePicker 模式
 */

export interface PortraitMapping {
    attacker?: string;
    defender?: string;
    attackerMirror?: boolean;
    defenderMirror?: boolean;
}

export type PortraitConfig = PortraitConfigData;

/** 旧调试曾用泛用标题保存 mirror，启动时剥离以免覆盖自动朝向 */
const STRIP_LEGACY_MIRROR_KEYS = new Set(['区域冲突']);

function stripLegacyMirrorOverrides(config: PortraitConfig): void {
    for (const key of STRIP_LEGACY_MIRROR_KEYS) {
        const entry = config[key];
        if (!entry) continue;
        delete entry.attackerMirror;
        delete entry.defenderMirror;
    }
}

export class PortraitConfigManager {
    private config: PortraitConfig = {};
    private fileHandle: any = null; // File System Access API handle

    constructor() {
        this.loadFromImport();
    }

    /**
     * 启动时从静态 import 加载配置
     */
    private loadFromImport(): void {
        try {
            this.config = JSON.parse(JSON.stringify(DEFAULT_PORTRAIT_CONFIG));

            const saved = localStorage.getItem('PORTRAIT_CONFIG_DATA');
            if (saved) {
                const localConfig = JSON.parse(saved) as PortraitConfig;
                this.config = { ...this.config, ...localConfig };
                gameLog('startup', `🖼️ [PortraitConfig] Merged ${Object.keys(localConfig).length} overrides from localStorage`);
            }
            stripLegacyMirrorOverrides(this.config);
            gameLog('startup', `🖼️ [PortraitConfig] Ready (${Object.keys(this.config).length} entries)`);
        } catch (err) {
            console.warn('[PortraitConfig] Failed to load config', err);
        }
    }

    /**
     * 获取某场战斗的立绘路径
     */
    public getPortrait(battleTitle: string, side: 'attacker' | 'defender'): string | undefined {
        return this.config[battleTitle]?.[side];
    }

    /**
     * 设置某场战斗的立绘路径（内存 + localStorage）
     */
    public setPortrait(battleTitle: string, side: 'attacker' | 'defender', path: string): void {
        if (!this.config[battleTitle]) {
            this.config[battleTitle] = {};
        }
        this.config[battleTitle][side] = path;

        // 同步到 localStorage（临时备份）
        try {
            localStorage.setItem('PORTRAIT_CONFIG_DATA', JSON.stringify(this.config));
        } catch (err) {
            console.warn('[PortraitConfig] localStorage full, data in memory only');
        }

        console.log(`🖼️ [PortraitConfig] Set ${side} portrait for "${battleTitle}" → ${path}`);
    }

    /**
     * 获取镜像状态；未设置时返回 undefined（由 CombatUI 按文化区素材朝向计算默认 scaleX）
     */
    public getMirror(battleTitle: string, side: 'attacker' | 'defender'): boolean | undefined {
        const key = side === 'attacker' ? 'attackerMirror' : 'defenderMirror';
        const entry = this.config[battleTitle];
        if (!entry || entry[key] === undefined) return undefined;
        return !!entry[key];
    }

    /**
     * 设置镜像状态（内存 + localStorage + 自动保存文件）
     */
    public setMirror(battleTitle: string, side: 'attacker' | 'defender', mirrored: boolean): void {
        if (!this.config[battleTitle]) {
            this.config[battleTitle] = {};
        }
        const key = side === 'attacker' ? 'attackerMirror' : 'defenderMirror';
        this.config[battleTitle][key] = mirrored;

        try {
            localStorage.setItem('PORTRAIT_CONFIG_DATA', JSON.stringify(this.config));
        } catch (err) { /* ignore */ }

        // Auto-save to file
        this.saveToFile();
    }

    /**
     * 从 JSON 文件加载配置（showOpenFilePicker）
     */
    public async loadFromFile(): Promise<boolean> {
        try {
            const [handle] = await (window as any).showOpenFilePicker({
                types: [{
                    description: 'JSON Files',
                    accept: { 'application/json': ['.json'] }
                }],
                multiple: false
            });
            this.fileHandle = handle;
            const file = await handle.getFile();
            const text = await file.text();
            this.config = JSON.parse(text);
            stripLegacyMirrorOverrides(this.config);

            localStorage.setItem('PORTRAIT_CONFIG_DATA', JSON.stringify(this.config));

            console.log(`🖼️ [PortraitConfig] Loaded ${Object.keys(this.config).length} mappings from file: ${handle.name}`);
            return true;
        } catch (err) {
            console.warn('[PortraitConfig] File load cancelled or failed', err);
            return false;
        }
    }

    /**
     * 保存配置到 JSON 文件（showSaveFilePicker — 同 VectorRoadEditor 模式）
     */
    public async saveToFile(): Promise<boolean> {
        const content = JSON.stringify(this.config, null, 2);
        if (!content || content.length < 2) {
            console.warn('[PortraitConfig] Refusing to write empty JSON');
            return false;
        }

        try {
            // 如果已有文件句柄，直接写入（不弹对话框）
            if (this.fileHandle) {
                const writable = await this.fileHandle.createWritable();
                await writable.write(content);
                await writable.close();
                console.log('🖼️ [PortraitConfig] ✅ Saved to linked file');
                return true;
            }

            // 否则弹出"另存为"对话框
            const handle = await (window as any).showSaveFilePicker({
                suggestedName: 'portrait_config.json',
                types: [{
                    description: 'JSON',
                    accept: { 'application/json': ['.json'] }
                }]
            });
            this.fileHandle = handle;
            const writable = await handle.createWritable();
            await writable.write(content);
            await writable.close();
            console.log('🖼️ [PortraitConfig] ✅ Saved to new file');
            return true;
        } catch (err) {
            // Fallback: 复制到剪贴板
            try {
                await navigator.clipboard.writeText(content);
                console.log('🖼️ [PortraitConfig] 📋 Copied to clipboard (fallback)');
            } catch {
                console.error('[PortraitConfig] Failed to save or copy');
            }
            return false;
        }
    }

    /**
     * 获取当前配置条目数
     */
    public getCount(): number {
        return Object.keys(this.config).length;
    }
}
