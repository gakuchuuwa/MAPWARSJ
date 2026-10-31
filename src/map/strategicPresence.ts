/**
 * 战略地图「人类活动」登记：会把野生动物惊走的人（村民、商队）。
 * 🔴 2026-10-31 主人令「动物碰到人和军团经过的时候要逃跑」：
 *    村民层、商队层各自登记位置提供函数，野生动物层统一来取；三个图层互不引用。
 */
export interface PresencePoint {
    lat: number;
    lng: number;
    /** 受惊半径（度）；不写用野生动物层的默认半径 */
    r?: number;
}

export type PresenceProvider = () => readonly PresencePoint[];

const providers = new Set<PresenceProvider>();

/** 登记一个位置提供函数，返回注销函数 */
export function registerHumanPresence(provider: PresenceProvider): () => void {
    providers.add(provider);
    return () => providers.delete(provider);
}

/** 当前所有登记的人类活动点 */
export function collectHumanPresence(): PresencePoint[] {
    const out: PresencePoint[] = [];
    for (const p of providers) {
        try {
            for (const pt of p()) out.push(pt);
        } catch {
            // 某一层出错不影响其它层
        }
    }
    return out;
}
