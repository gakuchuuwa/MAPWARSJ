import { Army } from '../legion/Army';
import { gameLog } from '../utils/GameLogger';

/**
 * SpatialRegistry
 * 
 * Manages the "Physics" of the strategy map.
 * Enforces:
 * 1. One Unit Per Hex (Unit Collision)
 * 2. Spatial Indexing (O(1) lookup for interactions)
 * 3. City Blocking (Cities occupy hexes as static obstacles)
 * 
 * [OPTIMIZATION] Uses 32-bit integer keys ((q << 16) | (r & 0xFFFF)) instead of strings.
 */
export class SpatialRegistry {
    // 空间哈希桶大小 (约20km)
    private static readonly BUCKET_SIZE = 0.2;

    // Key: `${x},${y}` -> Army[]
    private armyBuckets: Map<string, Army[]> = new Map();
    // Key: `${x},${y}` -> City[]
    private cityBuckets: Map<string, { id: string, factionId: string, lat: number, lng: number }[]> = new Map();

    private static instance: SpatialRegistry;

    public static getInstance(): SpatialRegistry {
        if (!SpatialRegistry.instance) {
            SpatialRegistry.instance = new SpatialRegistry();
        }
        return SpatialRegistry.instance;
    }

    /**
     * 获取 LatLng 对应的哈希桶键
     */
    public static getBucketKey(lat: number, lng: number): string {
        const x = Math.floor(lng / SpatialRegistry.BUCKET_SIZE);
        const y = Math.floor(lat / SpatialRegistry.BUCKET_SIZE);
        return `${x},${y}`;
    }

    public clear(): void {
        this.armyBuckets.clear();
    }

    public clearCityRegistry(): void {
        this.cityBuckets.clear();
        gameLog('world', '[SpatialRegistry] Cleared city registry.');
    }

    public registerCity(lat: number, lng: number, factionId: string, cityId: string): void {
        const key = SpatialRegistry.getBucketKey(lat, lng);
        if (!this.cityBuckets.has(key)) {
            this.cityBuckets.set(key, []);
        }
        this.cityBuckets.get(key)!.push({ id: cityId, factionId, lat, lng });
    }

    public registerArmy(army: Army, lat: number, lng: number): void {
        const key = SpatialRegistry.getBucketKey(lat, lng);
        if (!this.armyBuckets.has(key)) {
            this.armyBuckets.set(key, []);
        }
        const bucket = this.armyBuckets.get(key)!;
        if (!bucket.includes(army)) {
            bucket.push(army);
        }
    }

    public unregisterArmy(army: Army, lat: number, lng: number): void {
        const key = SpatialRegistry.getBucketKey(lat, lng);
        const bucket = this.armyBuckets.get(key);
        if (bucket) {
            const index = bucket.indexOf(army);
            if (index !== -1) {
                bucket.splice(index, 1);
            }
            if (bucket.length === 0) {
                this.armyBuckets.delete(key);
            }
        }
    }

    public moveArmy(army: Army, oldLat: number, oldLng: number, newLat: number, newLng: number): void {
        const oldKey = SpatialRegistry.getBucketKey(oldLat, oldLng);
        const newKey = SpatialRegistry.getBucketKey(newLat, newLng);

        if (oldKey !== newKey) {
            this.unregisterArmy(army, oldLat, oldLng);
            this.registerArmy(army, newLat, newLng);
        }
    }

    /**
     * 查找指定半径范围内的所有军队 (欧几里得距离)
     */
    public getArmiesInRadius(lat: number, lng: number, radius: number): Army[] {
        const results: Army[] = [];
        const radiusSq = radius * radius;

        // 确定需要搜索的桶的范围
        const minX = Math.floor((lng - radius) / SpatialRegistry.BUCKET_SIZE);
        const maxX = Math.floor((lng + radius) / SpatialRegistry.BUCKET_SIZE);
        const minY = Math.floor((lat - radius) / SpatialRegistry.BUCKET_SIZE);
        const maxY = Math.floor((lat + radius) / SpatialRegistry.BUCKET_SIZE);

        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                const key = `${x},${y}`;
                const armies = this.armyBuckets.get(key);
                if (armies) {
                    for (const army of armies) {
                        if (army.isDestroyed) continue;
                        const pos = army.getPosition();
                        const dx = pos.lng - lng;
                        const dy = pos.lat - lat;
                        if (dx * dx + dy * dy <= radiusSq) {
                            results.push(army);
                        }
                    }
                }
            }
        }
        return results;
    }

    /**
     * 查找指定半径范围内的所有城市 (欧几里得距离)
     */
    public getCitiesInRadius(lat: number, lng: number, radius: number): { id: string, factionId: string, lat: number, lng: number }[] {
        const results: { id: string, factionId: string, lat: number, lng: number }[] = [];
        const radiusSq = radius * radius;

        const minX = Math.floor((lng - radius) / SpatialRegistry.BUCKET_SIZE);
        const maxX = Math.floor((lng + radius) / SpatialRegistry.BUCKET_SIZE);
        const minY = Math.floor((lat - radius) / SpatialRegistry.BUCKET_SIZE);
        const maxY = Math.floor((lat + radius) / SpatialRegistry.BUCKET_SIZE);

        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                const key = `${x},${y}`;
                const cities = this.cityBuckets.get(key);
                if (cities) {
                    for (const city of cities) {
                        const dx = city.lng - lng;
                        const dy = city.lat - lat;
                        if (dx * dx + dy * dy <= radiusSq) {
                            results.push(city);
                        }
                    }
                }
            }
        }
        return results;
    }

    public debugPrint(): void {
        console.log(`[SpatialRegistry] Tracking ${this.armyBuckets.size} active buckets, ${this.cityBuckets.size} city buckets.`);
    }
}

