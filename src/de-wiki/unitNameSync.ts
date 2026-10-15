/**
 * 兵种名称单一事实来源（single source of truth）读取层
 *
 * 事实来源 = src/legion-editor/main.ts 的 DE_UNITS_CATALOG（「兵种鉴赏」显示的名字）。
 * 落盘出口（由 vite.config.ts 的 /api/rename-unit 维护）：
 *   · public/de-techtree/custom-names.json  —— 改名覆盖表（按 图鉴 id / 规范化英文名 / 节点 id）
 *   · public/de-techtree/legion-names.json  —— 科技树英文名 → 图鉴中文名 对照表（byNorm）
 *
 * de-wiki 的科技树、非科技树兵种视图都必须走这里取名，才能保证和 legion-editor 兵种鉴赏永远一致。
 * 同步手段：BroadcastChannel + localStorage(storage) + 窗口聚焦 + 轮询兜底
 * （轮询是为了跨 origin 场景，如 localhost 与 127.0.0.1 之间广播收不到）。
 */

export interface NameTables {
    /** custom-names.json：改名覆盖表（键 = 图鉴 id / 规范化英文名 / 节点 id） */
    custom: Record<string, string>;
    /** legion-names.json byNorm：规范化 DE 英文名 → 图鉴 id（最可靠，优先） */
    byNorm: Record<string, string>;
    /** legion-names.json byId：科技树节点 id → 图鉴 id（兜底；古典/中世纪会复用节点 id） */
    byId: Record<string, string>;
    /** legion-names.json names：图鉴 id → 图鉴中文名（番号快照） */
    names: Record<string, string>;
    /** legion-names.json 里没能对号入座的（这些节点仍显示 DE 官方中文名） */
    unmatched: Array<{ name: string; zh?: string; nodeIds?: number[] }>;
    /** 本次加载的指纹，用于判断是否变化 */
    stamp: string;
}

export const normEn = (s: string | null | undefined): string => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

const EMPTY: NameTables = { custom: {}, byNorm: {}, byId: {}, names: {}, unmatched: [], stamp: '' };

let current: NameTables = EMPTY;
let loading: Promise<NameTables> | null = null;
const listeners = new Set<(t: NameTables) => void>();

async function fetchJson(url: string, noStore: boolean): Promise<any> {
    const r = await fetch(url + (noStore ? `?t=${Date.now()}` : ''), noStore ? { cache: 'no-store' } : undefined);
    if (!r.ok) throw new Error(String(r.status));
    return await r.json();
}

/** 读取名称表；force=true 时强制绕过浏览器缓存（改名后必须用）。 */
export async function loadNameTables(force = false): Promise<NameTables> {
    if (!force && current.stamp) return current;
    if (loading && !force) return loading;
    loading = (async () => {
        try {
            const [custom, legion] = await Promise.all([
                fetchJson('/de-techtree/custom-names.json', true).catch(() => ({})),
                fetchJson('/de-techtree/legion-names.json', force).catch(() => ({})),
            ]);
            const next: NameTables = {
                custom: custom || {},
                byNorm: legion?.byNorm || {},
                byId: legion?.byId || {},
                names: legion?.names || {},
                unmatched: legion?.unmatched || [],
                stamp: `${Object.keys(custom || {}).length}:${Object.keys(legion?.byNorm || {}).length}:${Object.keys(legion?.byId || {}).length}:${JSON.stringify(custom || {}).length}`,
            };
            current = next;
            return next;
        } catch {
            current = { ...EMPTY, stamp: 'error' };
            return current;
        } finally {
            loading = null;
        }
    })();
    return loading;
}

export function getNameTables(): NameTables {
    return current;
}

/** 清空内存里的名称表（下次 loadNameTables 会重新拉取）；不触发订阅者，避免循环。 */
export function resetNameTables(): void {
    current = EMPTY;
    loading = null;
}

/**
 * 解析一个兵种该显示的名字，优先级：
 *   ① 图鉴 id 改名覆盖（custom-names）
 *   ② DE 英文名对号 → 图鉴 id → 改名覆盖 / 番号快照（最可靠）
 *   ③ 节点 id 对号 → 图鉴 id → 改名覆盖 / 番号快照（兜底，节点 id 会被古典/中世纪复用）
 *   ④ 原始名（custom 按节点 id / 英文名的老式覆盖也兼容）
 */
export function resolveUnitName(
    opts: { catalogId?: string | null; nodeId?: number | string | null; enName?: string | null; fallback?: string | null },
    tables: NameTables = current,
): string {
    const { custom, byNorm, byId, names } = tables;
    const iNorm = normEn(opts.enName);
    const explicitCat = opts.catalogId ? String(opts.catalogId) : '';
    const nid = opts.nodeId == null || opts.nodeId === '' ? '' : String(opts.nodeId);

    // ① 调用方直接给了图鉴 id（非科技树兵种视图）
    const direct = explicitCat && (custom[explicitCat] || custom[normEn(explicitCat)] || names[explicitCat]);
    // ② / ③ 科技树节点：先按英文名对号，再按节点 id 对号
    const cid = (iNorm && byNorm[iNorm]) || (nid && byId[nid]) || '';
    const viaCid = cid && (custom[cid] || custom[normEn(cid)] || names[cid]);
    // ④ 老式覆盖（键 = 节点 id 或规范化英文名）
    const legacy = (nid && custom[nid]) || (iNorm && custom[iNorm]) || '';

    const base = direct || viaCid || legacy || opts.fallback || opts.enName || '';
    return String(base).replace(/[\r\n]+/g, '').trim();
}

/** 重新拉取名称表；有变化时通知订阅者。 */
export async function refreshUnitNames(force = true): Promise<NameTables> {
    const before = current.stamp;
    const next = await loadNameTables(force);
    if (force || next.stamp !== before) {
        listeners.forEach((fn) => { try { fn(next); } catch { /* 单个订阅者出错不影响其它 */ } });
    }
    return next;
}

/**
 * 订阅改名事件：跨标签页广播 + localStorage + 窗口重新聚焦 + 轮询兜底。
 * 返回取消订阅函数。
 */
export function watchUnitNames(onChange: (t: NameTables) => void): () => void {
    listeners.add(onChange);

    const kick = () => { void refreshUnitNames(true); };

    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
        try {
            bc = new BroadcastChannel('de-wiki-sync');
            bc.onmessage = (ev) => { if (ev?.data?.type === 'unit-renamed') kick(); };
        } catch { bc = null; }
    }
    const onStorage = (e: StorageEvent) => { if (e.key === 'de-wiki-unit-rename') kick(); };
    const onVisible = () => { if (document.visibilityState === 'visible') kick(); };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', kick);
    document.addEventListener('visibilitychange', onVisible);
    // 轮询兜底：跨 origin（localhost ↔ 127.0.0.1）收不到广播时靠它
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') kick(); }, 15000);

    return () => {
        listeners.delete(onChange);
        window.removeEventListener('storage', onStorage);
        window.removeEventListener('focus', kick);
        document.removeEventListener('visibilitychange', onVisible);
        window.clearInterval(timer);
        try { bc?.close(); } catch { /* ignore */ }
    };
}
