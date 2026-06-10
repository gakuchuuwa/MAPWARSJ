/**
 * TerrainSpeedSystem.ts
 *
 * 地形可视化与 HUD（海/陆/山地/平原由 DEM 判定）。
 * 军队移动速度不由本系统决定，仅沿道路恒定速度。
 */

import { LatLng } from '../types/core';
import { TerrainOverrideManager } from './TerrainOverrideManager';
import { Hex } from '../systems/GridSystem';
import { LandSeaSystem, LandTerrainSystem } from '../world/land-sea';
import type { LandTerrainKind } from '../world/land-sea';

export enum TerrainSpeed {
    NORMAL = 'NORMAL',
    SLOW = 'SLOW',
    WATER = 'WATER',
    OCEAN = 'OCEAN'
}

export const TERRAIN_SPEED_CONFIG = {
    [TerrainSpeed.NORMAL]: {
        multiplier: 0.8,
        color: '#22C55E',
        fillColor: 'rgba(34, 197, 94, 0.3)',
        name: '平原 (正常)'
    },
    [TerrainSpeed.SLOW]: {
        multiplier: 0.01,
        color: '#F97316',
        fillColor: 'rgba(249, 115, 22, 0.3)',
        name: '山地 (难行)'
    },
    [TerrainSpeed.WATER]: {
        multiplier: 1.0,
        color: '#3B82F6',
        fillColor: 'rgba(59, 130, 246, 0.3)',
        name: '河流 (通畅)'
    },
    [TerrainSpeed.OCEAN]: {
        multiplier: 0.0,
        color: '#00008B',
        fillColor: 'rgba(0, 0, 139, 0.3)',
        name: '深海 (阻断)'
    }
};


export class TerrainSpeedSystem {
    private static overrideManager: TerrainOverrideManager | null = null;
    private static autoIdentificationEnabled: boolean = true;
    private static speedCache: Map<string, TerrainSpeed> = new Map();

    static initialize(overrideManager?: TerrainOverrideManager): void {
        if (overrideManager) {
            this.overrideManager = overrideManager;
        }

        const savedSetting = localStorage.getItem('auto_id_enabled');
        if (savedSetting !== null) {
            this.autoIdentificationEnabled = savedSetting === 'true';
        }

        LandTerrainSystem.initialize();
        window.addEventListener('land-terrain-tiles-updated', () => {
            this.speedCache.clear();
        });
    }

    private static landKindToTerrainSpeed(kind: LandTerrainKind): TerrainSpeed {
        switch (kind) {
            case 'sea':
                return TerrainSpeed.OCEAN;
            case 'mountain':
                return TerrainSpeed.SLOW;
            default:
                return TerrainSpeed.NORMAL;
        }
    }

    static setAutoIdentificationEnabled(enabled: boolean): void {
        this.autoIdentificationEnabled = enabled;
        localStorage.setItem('auto_id_enabled', String(enabled));
    }

    static isAutoIdentificationEnabled(): boolean {
        return this.autoIdentificationEnabled;
    }

    static getHexSpeedCached(hex: Hex): TerrainSpeed {
        if (this.overrideManager) {
            const override = this.overrideManager.getOverride(hex);
            if (override) {
                return override;
            }
        }
        return TerrainSpeed.NORMAL;
    }

    static async getHexSpeedAsync(hexCenter: LatLng, hex?: Hex): Promise<TerrainSpeed> {
        if (this.overrideManager && hex) {
            const override = this.overrideManager.getOverride(hex);
            if (override) {
                return override;
            }
        }

        if (!this.autoIdentificationEnabled) {
            return TerrainSpeed.SLOW;
        }

        const kind = await LandTerrainSystem.classifyAtAsync(hexCenter);
        return this.landKindToTerrainSpeed(kind);
    }

    static getHexSpeed(hexCenter: LatLng, hex?: Hex): TerrainSpeed {
        const key = `${hexCenter.lat.toFixed(4)},${hexCenter.lng.toFixed(4)}`;

        if (this.speedCache.has(key)) {
            return this.speedCache.get(key)!;
        }

        const result = this.calculateHexSpeed(hexCenter, hex);
        this.speedCache.set(key, result);
        return result;
    }

    private static calculateHexSpeed(hexCenter: LatLng, hex?: Hex): TerrainSpeed {
        if (this.overrideManager && hex) {
            const override = this.overrideManager.getOverride(hex);
            if (override) {
                return override;
            }
        }

        if (!this.autoIdentificationEnabled) {
            return TerrainSpeed.SLOW;
        }

        const kind = LandTerrainSystem.classifyAt(hexCenter);
        if (kind === null) {
            return TerrainSpeed.NORMAL;
        }
        return this.landKindToTerrainSpeed(kind);
    }

    static getSpeedMultiplier(_hexCenter: LatLng): number {
        return 1.0;
    }

    static getHexColorConfig(hexCenter: LatLng) {
        const speed = this.getHexSpeed(hexCenter);
        return TERRAIN_SPEED_CONFIG[speed];
    }

    static isSeaTerrain(speed: TerrainSpeed): boolean {
        return speed === TerrainSpeed.WATER || speed === TerrainSpeed.OCEAN;
    }

    static isSeaAt(latLng: LatLng, _hex?: Hex): boolean {
        return LandSeaSystem.isSeaAt(latLng);
    }

    static isLandAt(latLng: LatLng, hex?: Hex): boolean {
        return !this.isSeaAt(latLng, hex);
    }

    static getLandSeaKind(latLng: LatLng, hex?: Hex): 'land' | 'sea' {
        return this.isSeaAt(latLng, hex) ? 'sea' : 'land';
    }

    /** @deprecated 道路由 RoadRegistry 管理 */
    static isNearRoad(_lat: number, _lng: number): boolean {
        return true;
    }
}
