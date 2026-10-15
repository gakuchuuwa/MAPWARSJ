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
    /** legion-names.json byNorm：规范化 DE 英文名 → 图鉴 id */
    byNorm: Record<string, string>;
    /** legion-names.json byId：科技树节点 id → 图鉴 id（兜底） */
    byId: Record<string, string>;
    /** legion-names.json byAntId：古典文明科技树节点 id → 图鉴 id */
    byAntId: Record<string, string>;
    /** legion-names.json byMedId：中世纪特殊节点 id → 图鉴 id */
    byMedId: Record<string, string>;
    /** legion-names.json names：图鉴 id → 图鉴中文名（番号快照） */
    names: Record<string, string>;
    /** legion-names.json 里没能对号入座的（这些节点仍显示 DE 官方中文名） */
    unmatched: Array<{ name: string; zh?: string; nodeIds?: number[] }>;
    /** 本次加载的指纹，用于判断是否变化 */
    stamp: string;
}

export const normEn = (s: string | null | undefined): string => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

const EMPTY: NameTables = { custom: {}, byNorm: {}, byId: {}, byAntId: {}, byMedId: {}, names: {}, unmatched: [], stamp: '' };

let current: NameTables = EMPTY;
let loading: Promise<NameTables> | null = null;
const listeners = new Set<(t: NameTables) => void>();

async function fetchJson(url: string, noStore: boolean): Promise<any> {
    const r = await fetch(url + (noStore ? `?t=${Date.now()}` : ''), noStore ? { cache: 'no-store' } : undefined);
    if (!r.ok) throw new Error(String(r.status));
    return await r.json();
}

/** 读取名称表；总是使用 no-store 避免浏览器缓存旧的改名表。 */
export async function loadNameTables(force = false): Promise<NameTables> {
    if (!force && current.stamp) return current;
    if (loading && !force) return loading;
    loading = (async () => {
        try {
            const [custom, legion] = await Promise.all([
                fetchJson('/de-techtree/custom-names.json', true).catch(() => ({})),
                fetchJson('/de-techtree/legion-names.json', true).catch(() => ({})),
            ]);
            const next: NameTables = {
                custom: custom || {},
                byNorm: legion?.byNorm || {},
                byId: legion?.byId || {},
                byAntId: legion?.byAntId || {},
                byMedId: legion?.byMedId || {},
                names: legion?.names || {},
                unmatched: legion?.unmatched || [],
                stamp: `${JSON.stringify(custom || {})}|${JSON.stringify(legion?.names || {})}`,
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
 * 解析一个科技树/非科技树单位对应的兵种鉴赏 ID（DE_UNITS_CATALOG id）。
 * 返回空串表示不在兵种鉴赏中（例如村民、渔船、贸易车、僧侣、巨型投石机等）。
 */
export function resolveUnitCatalogId(
    opts: { catalogId?: string | null; nodeId?: number | string | null; enName?: string | null; isAntiquity?: boolean },
    tables: NameTables = current,
): string {
    if (opts.catalogId) return String(opts.catalogId);
    const { byNorm, byId, byAntId, byMedId } = tables;
    const nid = opts.nodeId == null || opts.nodeId === '' ? '' : String(opts.nodeId);
    const iNorm = normEn(opts.enName);
    if (opts.isAntiquity && nid && byAntId[nid]) {
        return byAntId[nid];
    }
    if (!opts.isAntiquity && nid && byMedId[nid]) {
        return byMedId[nid];
    }
    return (iNorm && byNorm[iNorm]) || (nid && byId[nid]) || '';
}

/**
 * 解析一个兵种该显示的名字，优先级：
 *   ① 解析出精确图鉴 id（catalogId）→ names[cid] 或 custom[cid]（与兵种鉴赏 100% 同一事实来源）
 *   ② 老式覆盖（custom 按节点 id / 英文名）
 *   ③ 原始名 fallback（未收录进兵种鉴赏的非战斗单位）
 */
export function resolveUnitName(
    opts: { catalogId?: string | null; nodeId?: number | string | null; enName?: string | null; fallback?: string | null; isAntiquity?: boolean },
    tables: NameTables = current,
): string {
    const { custom, names } = tables;
    const iNorm = normEn(opts.enName);
    const nid = opts.nodeId == null || opts.nodeId === '' ? '' : String(opts.nodeId);
    const cid = resolveUnitCatalogId(opts, tables);

    // 优先取 custom[cid]（实时改名覆盖）或 names[cid]（main.ts 快照）
    const viaCid = cid && (custom[cid] || names[cid] || custom[normEn(cid)]);
    const legacy = (!cid && ((nid && custom[nid]) || (iNorm && custom[iNorm]))) || '';

    const base = viaCid || legacy || opts.fallback || opts.enName || '';
    return String(base).replace(/[\r\n]+/g, '').trim();
}

/**
 * 从 de-wiki 端发起兵种改名：调用 /api/rename-unit 落盘（同步写 main.ts + WarTypes.ts + custom-names.json + legion-names.json），
 * 广播给 legion-editor.html 等同源标签页，并刷新本页名称表。
 */
export async function postUnitRename(unitId: string, newName: string): Promise<{ ok: boolean; error?: string }> {
    const trimmed = newName.trim();
    if (!unitId || !trimmed) return { ok: false, error: '兵种 ID 或名称不能为空' };
    try {
        const res = await fetch('/api/rename-unit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ unitId, newName: trimmed }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
            return { ok: false, error: data.error || res.statusText };
        }
        try {
            localStorage.setItem('de-wiki-unit-rename', JSON.stringify({ unitId, newName: trimmed, t: Date.now() }));
            if (typeof BroadcastChannel !== 'undefined') {
                const bc = new BroadcastChannel('de-wiki-sync');
                bc.postMessage({ type: 'unit-renamed', unitId, newName: trimmed });
                bc.close();
            }
        } catch { /* ignore */ }
        await refreshUnitNames(true);
        return { ok: true };
    } catch (err: any) {
        return { ok: false, error: err?.message || String(err) };
    }
}

/** 重新拉取名称表；仅当名称表内容真正发生变化（stamp 改变）时才通知订阅者，避免 focus/定时器无故重绘。 */
export async function refreshUnitNames(force = true): Promise<NameTables> {
    const before = current.stamp;
    const next = await loadNameTables(force);
    if (before && next.stamp !== before) {
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
