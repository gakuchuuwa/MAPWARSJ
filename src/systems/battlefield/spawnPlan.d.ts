export interface LatLng { lat: number; lng: number }
export interface Skeleton { levels: Uint8Array | number[]; water: Uint8Array; cliffSet?: Set<number> }
export interface SpawnSide { x: number; y: number; dir: string; deg: number | null; atCenter?: boolean }
export interface SpawnPlan { attacker: SpawnSide; defender: SpawnSide; notes: string[] }
export declare const VERSION_SPAWN = 1;
export declare const SPAWN_RADIUS_FRAC: number;
export declare const CENTER_BAND_FRAC: number;
export declare function bearing8(lat0: number, lng0: number, lat1: number, lng1: number): { dir: string; deg: number; idx: number };
export declare function planSpawns(o: {
  center: LatLng; attackerFrom: LatLng; defenderFrom: LatLng | null;
  battleType?: string; skeleton?: Skeleton; cells?: number; walkableAt?: (x: number, y: number) => boolean;
}): SpawnPlan;
