import type { Skeleton } from './bakeFormat';
export interface RealGeoPlan { deep: [number, number][]; shallow: [number, number][]; sand: [number, number][]; isWater(x: number, y: number): boolean; elevation: number[][]; hasSea: boolean; waterCells: number; reliefM: number; raisedCells: number }
export declare function buildRealGeoPlan(sk: Skeleton): RealGeoPlan;
export declare function buildScreenIndex(plan: RealGeoPlan, screenToCell: (x: number, y: number) => { gx: number; gy: number } | null): { isWaterOnScreen(x: number, y: number): boolean; sandOnScreen(x: number, y: number): boolean };
