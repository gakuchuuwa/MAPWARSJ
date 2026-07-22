/**
 * GameSaveManager.ts — 世界存档（跨天续摊）
 *
 * 用途：直播若干小时打下一片江山后存档，次日读档接着打，而非从头重开。
 *
 * 【设计要点】
 * 1. 档名只用日期（YYYY-MM-DD），同一天覆盖同一个档；自动存档每 10 分钟覆盖当天档。
 * 2. 恢复永远由人主动触发——绝不在刷新时自动读档（修 bug 的刷新就是要干净重开）。
 * 3. 军团重建【不走 LegionManager.createArmy】：那是募兵生成函数，内含
 *    军团上限拦截 / 兵力钳制 / MIN_ARMY_SIZE 丢弃 / 精锐与将领重掷，
 *    用它读档会丢部队、改兵力、换将领。此处直接构造 Army 并显式灌回存档值。
 * 4. portraitPath 在 Army 构造时随机生成，必须显式覆盖回存档值，否则读档后立绘全变。
 *
 * 【已知边界（对“接着打”无影响，勿误当 bug）】
 * - 正在进行的野战/攻城不精确还原：军团恢复为原地待命，由 AI 重新下达行军令。
 * - 随机数不可复现：同一个档再跑，战斗结果会不同。存档是“从这个局面继续”，不是回放。
 */
import type { GameApp } from './GameApp';
import { Army } from '../legion/Army';
import { SpatialRegistry } from '../world/SpatialRegistry';
import { gameLog } from '../utils/GameLogger';

const SAVE_PREFIX = 'mapwar-save-';
const SAVE_VERSION = 1;
const AUTO_SAVE_INTERVAL_MS = 10 * 60_000;
/**
 * 自动存档【独立档位】，绝不写日期档。
 * 原因：主人边修边播、刷新频繁，刷新即得到全新空世界；若自动存档写当天日期档，
 * 会在 10 分钟内把当天辛苦打下的手动存档覆盖成空世界。手动存档必须只由人点「存档」才写。
 */
const AUTO_SLOT_KEY = SAVE_PREFIX + 'auto';

export interface CitySnapshot {
    id: string;
    factionId: string;
    troops: number;
}

export interface ArmySnapshot {
    name: string;
    factionId: string;
    troops: number;
    lat: number;
    lng: number;
    generalId?: string;
    portraitPath?: string;
    isElite: boolean;
    legionType?: string;
    cultureRegion?: string | null;
    homeCityId?: string | null;
    sourceCityId?: string | null;
}

export interface GameSave {
    version: number;
    /** 档名 = 存档当天真实日期 YYYY-MM-DD */
    date: string;
    /** 存档时刻（ISO），同一天多次存档用于显示“最后更新” */
    savedAt: string;
    /** 游戏内纪年 */
    year: number;
    season: string;
    cities: CitySnapshot[];
    armies: ArmySnapshot[];
}

export interface SaveMeta {
    key: string;
    date: string;
    savedAt: string;
    year: number;
    cityCount: number;
    armyCount: number;
    /** true = 自动存档档位（独立于手动日期档） */
    isAuto: boolean;
}

export class GameSaveManager {
    private app: GameApp;
    private autoTimer: number | null = null;

    constructor(app: GameApp) {
        this.app = app;
    }

    // ── 快照 ────────────────────────────────────────────────

    /** 抓当前世界快照（纯数据，可 JSON 化） */
    public snapshot(): GameSave {
        const app = this.app;
        const cities: CitySnapshot[] = app.cityManager.getCities().map(c => ({
            id: c.id,
            factionId: c.factionId,
            troops: c.troops,
        }));

        const armies: ArmySnapshot[] = this.getArmies().map(a => {
            const pos = a.getPosition();
            return {
                name: a.name,
                factionId: a.factionId,
                troops: a.troops,
                lat: pos.lat,
                lng: pos.lng,
                generalId: a.generalId,
                portraitPath: a.portraitPath,
                isElite: a.isElite,
                legionType: a.legionType,
                cultureRegion: a.cultureRegion,
                homeCityId: a.homeCityId,
                sourceCityId: a.getSourceCityId(),
            };
        });

        return {
            version: SAVE_VERSION,
            date: todayKey(),
            savedAt: new Date().toISOString(),
            year: app.timeSystem.getYear(),
            season: String(app.timeSystem.getSeason()),
            cities,
            armies,
        };
    }

    // ── 恢复 ────────────────────────────────────────────────

    /** 用存档重建世界。调用方需自行确认（此方法不再二次确认）。 */
    public restore(save: GameSave): void {
        const app = this.app;
        if (!save || save.version !== SAVE_VERSION) {
            throw new Error(`存档版本不符（期望 ${SAVE_VERSION}，实际 ${save?.version}）`);
        }

        // 1. 纪年
        app.timeSystem.setYear(save.year);
        if (save.season) app.timeSystem.setSeason(save.season as never);

        // 2. 据点归属与驻军（据点已从数据中移除的条目跳过）
        let cityHit = 0;
        for (const c of save.cities) {
            if (!app.cityManager.getCityById(c.id)) continue;
            app.cityManager.updateCity(c.id, { factionId: c.factionId, troops: c.troops });
            cityHit++;
        }

        // 3. 清空现有军团（先 destroy 再摘出容器，确保 marker/索引一并释放）
        const lm = this.getLegionManager();
        for (const army of [...this.getArmies()]) {
            army.destroy();
            lm.removeArmy(army);
        }

        // 4. 重建军团 —— 绕开 createArmy 的随机与钳制，逐字段灌回
        const registry = SpatialRegistry.getInstance();
        let armyHit = 0;
        for (const s of save.armies) {
            const army = new Army(
                app.map,
                { lat: s.lat, lng: s.lng },
                null,                       // targetCity：恢复为待命，由 AI 重新下令
                s.troops,
                s.factionId,
                () => { },                  // onArrive：与 createArmy 一致
                undefined,                  // onBattleTick
                undefined,                  // destination
                s.name,
                s.legionType as never,
                s.generalId,
            );
            army.type = 'legion';
            army.cultureRegion = (s.cultureRegion ?? null) as never;
            army.isElite = s.isElite;
            // 立绘必须覆盖：构造函数会随机分配，不盖回去读档后军团立绘会变
            if (s.portraitPath) army.portraitPath = s.portraitPath;
            army.homeCityId = s.homeCityId ?? null;
            if (s.sourceCityId) army.setSourceCityId(s.sourceCityId);
            army.setSpatialRegistry(registry);
            lm.addArmy(army, true); // force：读档不受军团上限拦截
            armyHit++;
        }

        // 5. 关键：世界已由存档恢复，禁掉「开局首次出兵」。
        //    否则之后一开播，runInitialSpawn 会 ① 从各无军据点批量补刷军团，
        //    ② 其开头的 trimLegionsToCap() 还会把这里 force 加入的军团削掉。
        app.recruitmentSystem?.markInitialSpawnDone?.();

        gameLog('world', `💾 [读档] ${save.date}：纪年 ${save.year} · 据点 ${cityHit}/${save.cities.length} · 军团 ${armyHit}`);
    }

    // ── 存档位（localStorage，按日期为键） ──────────────────

    /** 【手动】存档到当天日期档位（同一天覆盖）。只由人点「存档」触发。返回档名。 */
    public saveToSlot(): string {
        const save = this.snapshot();
        localStorage.setItem(SAVE_PREFIX + save.date, JSON.stringify(save));
        gameLog('world', `💾 [存档] ${save.date}：据点 ${save.cities.length} · 军团 ${save.armies.length}`);
        return save.date;
    }

    /** 【自动】写独立自动档位，永不触碰手动日期档（防刷新后的空世界覆盖当天江山）。 */
    private saveToAutoSlot(): void {
        const save = this.snapshot();
        localStorage.setItem(AUTO_SLOT_KEY, JSON.stringify(save));
    }

    /** 列出全部存档（按日期倒序，新的在前） */
    public listSaves(): SaveMeta[] {
        const out: SaveMeta[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key || !key.startsWith(SAVE_PREFIX)) continue;
            try {
                const s = JSON.parse(localStorage.getItem(key) || '') as GameSave;
                out.push({
                    key,
                    date: s.date,
                    savedAt: s.savedAt,
                    year: s.year,
                    cityCount: s.cities?.length ?? 0,
                    armyCount: s.armies?.length ?? 0,
                    isAuto: key === AUTO_SLOT_KEY,
                });
            } catch { /* 坏档跳过，不阻断列表 */ }
        }
        // 自动档恒排最前（最近状态），其余手动日期档按日期倒序
        return out.sort((a, b) => {
            if (a.isAuto !== b.isAuto) return a.isAuto ? -1 : 1;
            return b.date.localeCompare(a.date);
        });
    }

    public loadSlot(key: string): GameSave {
        const raw = localStorage.getItem(key);
        if (!raw) throw new Error(`存档不存在：${key}`);
        return JSON.parse(raw) as GameSave;
    }

    public deleteSlot(key: string): void {
        localStorage.removeItem(key);
    }

    // ── 文件导出/导入（耐久备份，换机器/清浏览器数据也不丢） ──

    public exportFile(save: GameSave = this.snapshot()): void {
        const blob = new Blob([JSON.stringify(save, null, 1)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mapwar-${save.date}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    public async importFile(file: File): Promise<GameSave> {
        const text = await file.text();
        const save = JSON.parse(text) as GameSave;
        if (save.version !== SAVE_VERSION) {
            throw new Error(`存档版本不符（期望 ${SAVE_VERSION}，实际 ${save.version}）`);
        }
        return save;
    }

    // ── 自动存档（10 分钟覆盖当天档；只存不读） ──────────────

    public startAutoSave(): void {
        if (this.autoTimer !== null) return;
        this.autoTimer = window.setInterval(() => {
            try {
                this.saveToAutoSlot();
            } catch (e) {
                gameLog('world', `⚠️ [自动存档] 失败：${(e as Error).message}`);
            }
        }, AUTO_SAVE_INTERVAL_MS);
        gameLog('startup', `💾 [存档] 自动存档已启动（每 ${AUTO_SAVE_INTERVAL_MS / 60_000} 分钟覆盖【自动档】，不动手动日期档）`);
    }

    public stopAutoSave(): void {
        if (this.autoTimer !== null) {
            window.clearInterval(this.autoTimer);
            this.autoTimer = null;
        }
    }

    // ── 内部 ────────────────────────────────────────────────

    private getLegionManager() {
        return this.app.historicalEventManager.getLegionManager();
    }

    private getArmies(): Army[] {
        return this.getLegionManager().getArmies();
    }
}

/** 当天日期键 YYYY-MM-DD（本地时区） */
function todayKey(): string {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
