/**
 * HeroSpriteDrawer —— 战略地图上画玩家单骑（乱入者）一个精灵。
 *
 * 素材/帧框走 LegionPhalanxDrawer 同一套缓存（unitSpriteCache + _meta.json 动态帧框），
 * 染色走 SpriteTinter；只画一个人 + 头顶名牌，不画旗、不画方阵。
 * 入伍时：画在军团前排前面（沿军团朝向前推一小段），随军团动作（行军/攻击）播帧。
 */
import { LegionPhalanxDrawer } from '../legion/LegionPhalanxDrawer';
import { SpriteTinter } from '../../systems/tinting/SpriteTinter';

type AnimState = 'IDLE' | 'MOVE' | 'ATTACK';

/** 8 向屏幕单位向量（0=NE 1=E 2=SE 3=S 4=SW 5=W 6=NW 7=N，与 OrientationSystem 同序） */
const DIR_VEC: ReadonlyArray<readonly [number, number]> = [
    [0.707, -0.707], [1, 0], [0.707, 0.707], [0, 1], [-0.707, 0.707], [-1, 0], [-0.707, -0.707], [0, -1],
];

export class HeroSpriteDrawer {
    /** 大地图单兵基准高（与军团 58 同源，英雄略大） */
    private static readonly BASE_H = 66;

    public static forwardOffset(dir: number, px: number): { x: number; y: number } {
        const v = DIR_VEC[((dir % 8) + 8) % 8] ?? DIR_VEC[0];
        return { x: v[0] * px, y: v[1] * px };
    }

    public static draw(
        ctx: CanvasRenderingContext2D,
        key: string,
        center: { x: number; y: number },
        state: AnimState,
        dir: number,
        scale: number,
        factionId: string | null,
        name: string,
        tick: number,
    ): void {
        // 1. 先在地面层绘制【朱曜赤金·战阵将星盘】（画在人马精灵之下，贴合地表透视）
        this.drawAura(ctx, center, scale, tick);

        const assets = LegionPhalanxDrawer.getUnitAssets(key) as
            | { MOVE: HTMLImageElement[]; ATTACK: HTMLImageElement[]; IDLE: HTMLImageElement[];
                dyn?: Record<string, { frames: number; dirs: Record<string, { fw: number; fh: number; hx: number; hy: number }> }> }
            | undefined;
        if (!assets) {
            LegionPhalanxDrawer.ensureUnitTypeLoading(key);
            this.drawLabel(ctx, center, name, scale);
            return;
        }
        const d = ((dir % 8) + 8) % 8;
        const setName = state === 'MOVE' ? 'MOVE' : state === 'ATTACK' ? 'ATTACK' : 'IDLE';
        let raw = assets[setName]?.[d] ?? assets[setName]?.[0];
        if (!raw || !raw.complete || raw.naturalWidth === 0) raw = assets.IDLE?.[d] ?? assets.IDLE?.[0];
        if (!raw || !raw.complete || raw.naturalWidth === 0) {
            this.drawLabel(ctx, center, name, scale);
            return;
        }
        const img = factionId ? SpriteTinter.getTintedSprite(raw, factionId) : raw;
        const dynEntry = assets.dyn?.[setName];
        const dynDir = dynEntry?.dirs?.[String(d)];
        const frames = dynEntry ? dynEntry.frames : Math.max(1, Math.round(raw.naturalWidth / raw.naturalHeight));
        const cycleMs = setName === 'ATTACK' ? 1500 : setName === 'MOVE' ? 1000 : 2000;
        const fr = frames > 1 ? Math.floor(tick / (cycleMs / frames)) % frames : 0;
        const fw = dynDir ? dynDir.fw : raw.naturalWidth / frames;
        const fh = dynDir ? dynDir.fh : raw.naturalHeight;

        // 2. 中层绘制人马精灵（踩在光环之上）
        if (dynDir) {
            const s = this.BASE_H * scale / 64;
            ctx.drawImage(img, fr * fw, 0, fw, fh, center.x - dynDir.hx * s, center.y - dynDir.hy * s, fw * s, fh * s);
        } else {
            const h = this.BASE_H * scale;
            const w = h * (fw / fh);
            ctx.drawImage(img, fr * fw, 0, fw, fh, center.x - w / 2, center.y - h * 0.9, w, h);
        }

        // 3. 顶层绘制头顶武将名牌
        this.drawLabel(ctx, center, name, scale);
    }

    /**
     * 玩家脚下专属光环：严格保持原版小巧尺寸 (14*scale, 6*scale)
     * 以黑底衬线 + 明亮双金环实现极致清晰与精巧质感，绝不发虚，绝不喧宾夺主
     */
    public static drawAura(
        ctx: CanvasRenderingContext2D,
        center: { x: number; y: number },
        scale: number,
        tick: number
    ): void {
        const rx = 14 * scale;
        const ry = 6 * scale;
        const cy = center.y + 2;

        ctx.save();

        // 1. 紧凑外金环：黑底细衬 + 纯金高亮（解决发虚看不清的问题）
        ctx.beginPath();
        ctx.ellipse(center.x, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.lineWidth = 2.8;
        ctx.stroke();

        ctx.strokeStyle = '#FFD700'; // 纯正高亮纯金
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // 2. 紧凑内细环：白金高光内环，精巧耐看
        ctx.beginPath();
        ctx.ellipse(center.x, cy, rx * 0.72, ry * 0.72, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        ctx.strokeStyle = '#FFF2A8'; // 白金高光
        ctx.lineWidth = 1.0;
        ctx.stroke();

        ctx.restore();
    }

    /**
     * 名牌预渲染缓存：文字描边 + 填充每帧重画在战略地图上是**每帧**开销，
     * CPU Profile 实测占 2.1%（玩家移动 10 秒 215ms）。名字和字号都不常变，
     * 预渲染成一张小图，每帧只 drawImage 一次。
     */
    private static labelCache = new Map<string, HTMLCanvasElement>();

    private static getLabelSprite(name: string, fontPx: number): HTMLCanvasElement {
        const key = `${name}|${fontPx}`;
        const hit = this.labelCache.get(key);
        if (hit) return hit;
        const font = `bold ${fontPx}px 'Noto Serif SC','SimSun',serif`;
        const measure = document.createElement('canvas').getContext('2d')!;
        measure.font = font;
        const w = Math.ceil(measure.measureText(name).width) + 8;   // +8 给描边留边
        const h = Math.ceil(fontPx * 1.6);
        const cv = document.createElement('canvas');
        cv.width = Math.max(1, w);
        cv.height = Math.max(1, h);
        const c = cv.getContext('2d')!;
        c.font = font;
        c.textAlign = 'center';
        c.textBaseline = 'bottom';
        c.lineWidth = 3;
        c.strokeStyle = 'rgba(0,0,0,0.75)';
        c.strokeText(name, cv.width / 2, cv.height - 2);
        c.fillStyle = '#ffd27a';
        c.fillText(name, cv.width / 2, cv.height - 2);
        // 字号档位有限（随 zoom 变），缓存不会无限涨；真涨了就整表清掉重来
        if (this.labelCache.size > 32) this.labelCache.clear();
        this.labelCache.set(key, cv);
        return cv;
    }

    private static drawLabel(ctx: CanvasRenderingContext2D, center: { x: number; y: number }, name: string, scale: number): void {
        const y = center.y - this.BASE_H * scale - 6;
        const fontPx = Math.max(10, Math.round(12 * Math.max(0.8, scale)));
        const sprite = this.getLabelSprite(name, fontPx);
        ctx.drawImage(sprite, Math.round(center.x - sprite.width / 2), Math.round(y - sprite.height + 2));
    }
}
