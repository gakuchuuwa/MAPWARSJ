import { TerrainSpeed } from '../core/TerrainSpeedSystem';
import { Hex } from '../systems/GridSystem';

export interface TerrainOverrideData {
    [key: string]: TerrainSpeed;
}

export class TerrainOverrideManager {
    private overrides: Map<number, TerrainSpeed> = new Map();

    constructor() {
        this.loadFromStorage();
    }

    /**
     * 生成唯一的六边形键值 (q,r) -> number
     */
    private getHexKey(hex: Hex): number {
        return (hex.q << 16) | (hex.r & 0xFFFF);
    }

    /**
     * 设置覆盖值
     */
    public setOverride(hex: Hex, speed: TerrainSpeed): void {
        const key = this.getHexKey(hex);
        this.overrides.set(key, speed);
        // 自动保存到 localStorage 以防丢失
        this.saveToStorage();
    }

    /**
     * 批量设置覆盖值
     */
    /**
     * 批量设置覆盖值
     */
    public bulkSetOverrides(newOverrides: Map<string, TerrainSpeed>): void {
        newOverrides.forEach((value, keyStr) => {
            const [q, r] = keyStr.split(',').map(Number);
            const key = (q << 16) | (r & 0xFFFF);
            this.overrides.set(key, value);
        });
        this.saveToStorage();
    }

    /**
     * 批量设置覆盖值 (数组格式)
     */
    public setOverrides(updates: { q: number; r: number; speed: TerrainSpeed }[]): void {
        updates.forEach(update => {
            const key = (update.q << 16) | (update.r & 0xFFFF);
            this.overrides.set(key, update.speed);
        });
        this.saveToStorage();
    }

    /**
     * 获取覆盖值
     */
    public getOverride(hex: Hex): TerrainSpeed | null {
        const key = this.getHexKey(hex);
        return this.overrides.get(key) || null;
    }

    /**
     * 清除覆盖值
     */
    public clearOverride(hex: Hex): void {
        const key = this.getHexKey(hex);
        this.overrides.delete(key);
        this.saveToStorage();
    }

    /**
     * 导出数据为 JSON 字符串
     */
    /**
     * 导出数据为 JSON 字符串
     */
    public exportData(): string {
        const data: TerrainOverrideData = {};
        this.overrides.forEach((value, key) => {
            // Convert int key back to string "q,r" for JSON
            const r = (key & 0xFFFF) << 16 >> 16;
            const q = key >> 16;
            data[`${q},${r}`] = value;
        });
        return JSON.stringify(data, null, 2);
    }

    /**
     * 导入数据
     */
    public loadData(data: TerrainOverrideData): void {
        this.overrides.clear();
        Object.entries(data).forEach(([keyStr, value]) => {
            const [q, r] = keyStr.split(',').map(Number);
            const key = (q << 16) | (r & 0xFFFF);
            this.overrides.set(key, value as TerrainSpeed);
        });
        // 移除自动保存，避免加载时覆盖数据
    }

    /**
     * 手动保存到 LocalStorage
     */
    public save(): void {
        this.saveToStorage();
    }

    /**
     * 保存到 LocalStorage (临时持久化)
     */
    private saveToStorage(): void {
        try {
            const data = this.exportData();
            localStorage.setItem('terrain_overrides', data);
            console.log('💾 地形数据已保存');
        } catch (e) {
            console.error('❌ 无法保存地形覆盖数据到 LocalStorage:', e);
            // [FIX] 用户可见的警告
            alert('⚠️ 保存失败！\n\n浏览器存储空间可能已满。\n请使用「导出存档」按钮将数据保存为文件，以防丢失。');
        }
    }

    /**
     * 从 LocalStorage 加载
     */
    private loadFromStorage(): void {
        try {
            const data = localStorage.getItem('terrain_overrides');
            if (data) {
                const parsed = JSON.parse(data);
                this.loadData(parsed);
                console.log(`📦 已加载 ${this.overrides.size} 个地形修正数据`);
            }
        } catch (e) {
            console.warn('无法从 LocalStorage 加载地形覆盖数据');
        }
    }

    /**
     * 获取所有覆盖数据的数量
     */
    public getOverrideCount(): number {
        return this.overrides.size;
    }

    /**
     * 获取所有覆盖数据 Map
     */
    public getAllOverrides(): Map<string, TerrainSpeed> {
        // Convert back to string keys for consumers expecting them
        const strMap = new Map<string, TerrainSpeed>();
        this.overrides.forEach((val, key) => {
            const r = (key & 0xFFFF) << 16 >> 16;
            const q = key >> 16;
            strMap.set(`${q},${r}`, val);
        });
        return strMap;
    }
}
