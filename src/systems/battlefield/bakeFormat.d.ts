export const MAGIC: number[];
export const VERSION: number;
export const CELLS: number;
export interface BakeHeader { v: number; id: string; lat: number; lng: number; hmin: number; hmax: number; step: number; koppen: string | null; theme: string; water: boolean; cliffCount: number }
export interface Skeleton { header: BakeHeader; levels: Uint8Array; water: Uint8Array; cliffs: number[] }
export declare function encodeSkeleton(o: { header: Omit<BakeHeader,'v'|'cliffCount'> & Partial<Pick<BakeHeader,'v'|'cliffCount'>>; levels: Uint8Array; water: Uint8Array; cliffs: number[] }): Uint8Array;
export declare function decodeSkeleton(buf: Uint8Array | ArrayBuffer): Skeleton;
export declare function isWaterAt(water: Uint8Array, i: number): boolean;
export declare function setWaterAt(water: Uint8Array, i: number, v: boolean): void;
