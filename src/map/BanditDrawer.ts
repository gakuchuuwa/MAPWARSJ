/**
 * BanditDrawer - 匪兵绘制器 (桩文件)
 */
export type BanditState = 'IDLE' | 'MOVE' | 'ATTACK';

export class BanditDrawer {
    static async preload(): Promise<void> { }
    static draw(
        _ctx: CanvasRenderingContext2D,
        _pos: { x: number; y: number },
        _state: BanditState,
        _direction: number,
        _scale: number,
        _troops: number,
        _time: number,
        _type?: string
    ): void { }
}
