/**
 * GameSaveManager.ts — 世界存档（跨天续摊）
 *
 * 用途：直播若干小时打下一片江山后存档，次日读档接着打，而非从头重开。
 *
 * 【设计要点】
 * 1. 档名只用日期（YYYY-MM-DD），同一天覆盖同一个档；自动存档最小间隔 10 分钟，全图无战斗时才存。
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
import { applyLegionCultureComposition } from '../types/CultureFormations';
import { CameraFollowUI, type HistoricalStreakRecord } from '../ui/CameraFollowUI';
import type { PlayerSaveState } from '../player/PlayerHero';

const SAVE_PREFIX = 'mapwar-save-';
const SAVE_VERSION = 1;
const AUTO_SAVE_INTERVAL_MS = 10 * 60_000;
/**
 * 自动存档【独立档位】，绝不写日期档。
 * 原因：主人边修边播、刷新频繁，刷新即得到全新空世界；若自动存档写当天日期档，
 * 会在 10 分钟内把当天辛苦打下的手动存档覆盖成空世界。手动存档必须只由人点「存档」才写。
 */
const AUTO_SLOT_KEY = SAVE_PREFIX + 'auto';
/**
 * 自动存档【轮转档位】（主人 2026-07-31 定）：auto-1 … auto-5 轮流写，每次挑最旧的覆盖。
 * 原来只有 AUTO_SLOT_KEY 一个位，写坏一次就没了 —— 边修边播时重启频繁，
 * 一个刚重启的空世界就能把几小时的成果盖掉。轮转后即使连踩 4 次，最老那份仍在。
 * 存档是纯 JSON（几百据点 + 若干军团，几十 KB），5 份对 localStorage 毫无压力。
 */
const AUTO_SLOT_COUNT = 5;
const autoSlotKey = (i: number): string => `${AUTO_SLOT_KEY}-${i}`;
/** 启动后多久内不自动存档：给"改代码→刷新→再改"的循环留出窗口 */
const AUTO_SAVE_STARTUP_GRACE_MS = AUTO_SAVE_INTERVAL_MS;
/** 超过此时长仍因"有战斗"存不上，就强制存一次（战斗中存档允许不精确还原） */
const AUTO_SAVE_FORCE_AFTER_MS = 30 * 60_000;

export interface CitySnapshot {
    id: string;
    factionId: string;
    troops: number;
    /** 该据点是否已刷出过将领（读档恢复时可防重复刷将） */
    spawnGeneralUsed: boolean;
    /** 该据点是否已刷出过精锐（读档恢复时可防重复刷精） */
    spawnEliteUsed: boolean;
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
    winStreak?: number;
}

export interface GameSave {
    version: number;
    /** 档名 = 存档当天真实日期 YYYY-MM-DD */
    date: string;
    /** 存档时刻（ISO），同一天多次存档用于显示“最后更新” */
    savedAt: string;
    /** 游戏内纪年 */
    year: number;
    /** Season 枚举值（春=0,夏=1,秋=2,冬=3）—— 存数字而非 String() 转换，避免读档后 getSeason() 返回字符串 */
    season: number;
    cities: CitySnapshot[];
    armies: ArmySnapshot[];
    /** 全局历史最高连胜纪录（即使军团阵亡也永久保留） */
    maxWinStreak?: HistoricalStreakRecord | null;
    /** [2026-09-05 玩家] 玩家：功勋/势力/已学精锐/位置（入伍与任务不存：军团重建后 id 已变，读档一律独行） */
    player?: PlayerSaveState;
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
            spawnGeneralUsed: c.spawnGeneralUsed ?? false,
            spawnEliteUsed: c.spawnEliteUsed ?? false,
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
                winStreak: a.winStreak ?? 0,
            };
        });

        return {
            version: SAVE_VERSION,
            date: todayKey(),
            savedAt: new Date().toISOString(),
            year: app.timeSystem.getYear(),
            season: app.timeSystem.getSeason(),
            cities,
            armies,
            maxWinStreak: CameraFollowUI.historicalMaxStreak,
            player: app.playerHero?.toSaveState(),
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
        if (save.season !== undefined) app.timeSystem.setSeason(save.season);

        // 1.5 恢复全局历史最高连胜纪录（比军团重建更早，避免 updateTopStats 覆盖）
        CameraFollowUI.historicalMaxStreak = save.maxWinStreak ?? null;

        // 2. 据点归属与驻军（读档非占城，抑制特效；据点已从数据中移除的条目跳过）
        let cityHit = 0;
        for (const c of save.cities) {
            if (!app.cityManager.getCityById(c.id)) continue;
            app.cityManager.updateCity(c.id,
                { factionId: c.factionId, troops: c.troops },
                { skipCaptureLog: true },
            );
            // 恢复 spawn 标记 — updateCity 内 { ...oldCity, ...data } 创建新对象，
            // 必须重新获取引用再写入，否则改的是旧对象
            const updated = app.cityManager.getCityById(c.id);
            if (updated) {
                updated.spawnGeneralUsed = c.spawnGeneralUsed;
                updated.spawnEliteUsed = c.spawnEliteUsed;
            }
            cityHit++;
        }
        // 刷新全图据点标签（旗号 / 兵力数字），确保读档后 UI 立即可见
        for (const c of save.cities) {
            app.cityManager.updateCityLabel?.(c.id);
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
            if (s.winStreak) army.winStreak = s.winStreak;
            // 文化阵型烘焙：cultureSlots / cultureScales 不能为 null（渲染依赖），
            // 必须重建。legionType 会由此覆写（与存档值一致，因为同 cultureRegion）。
            applyLegionCultureComposition(army, army.cultureRegion ?? undefined);
            army.setSpatialRegistry(registry);
            lm.addArmy(army, true); // force：读档不受军团上限拦截
            armyHit++;
        }

        // 5. 关键：世界已由存档恢复，禁掉「开局首次出兵」。
        //    否则之后一开播，runInitialSpawn 会 ① 从各无军据点批量补刷军团，
        //    ② 其开头的 trimLegionsToCap() 还会把这里 force 加入的军团削掉。
        app.recruitmentSystem?.markInitialSpawnDone?.();

        // 6. [2026-09-05 玩家] 玩家：任务作废（军团已重建），功勋/势力/精锐/位置照存档灌回，镜头仍跟玩家
        if (app.playerHero) {
            app.playerQuests?.clearForRestore();
            if (save.player) app.playerHero.restoreSaveState(save.player);
            else app.playerHero.detach();
            app.cameraFollowUI?.refreshPlayerFollow?.();
        }

        gameLog('world', `💾 [读档] ${save.date}：纪年 ${save.year} · 据点 ${cityHit}/${save.cities.length} · 军团 ${armyHit}`);
    }

    // ── 存档位（localStorage，按日期为键） ──────────────────

    /** 【手动】存档到当天日期档位（同一天覆盖）。只由人点「存档」触发。返回档名。 */
    public saveToSlot(): string {
        const save = this.snapshot();
        localStorage.setItem(SAVE_PREFIX + save.date, JSON.stringify(save));
        const t = new Date(save.savedAt);
        const hhmmss = t.toTimeString().slice(0, 8);
        gameLog('world',
            `💾 [手动存档] ${save.date} ${hhmmss} | 纪年 ${save.year} · ` +
            `据点 ${save.cities.length} · 军团 ${save.armies.length}`);
        return save.date;
    }

    /** 读某个自动档位的元信息（坏档/空位返回 null） */
    private readAutoSlot(key: string): GameSave | null {
        try {
            const raw = localStorage.getItem(key);
            return raw ? (JSON.parse(raw) as GameSave) : null;
        } catch { return null; }
    }

    /** 世界进度序（纪年 × 4 + 季），用于判断"是不是倒退了" */
    private static progressOrd(s: Pick<GameSave, 'year' | 'season'>): number {
        return s.year * 4 + (s.season ?? 0);
    }

    /**
     * 【自动】轮转写入 auto-1…auto-5，挑最旧的位覆盖，永不触碰手动日期档。
     * 另加「进度倒退保护」：若最新自动档的纪年明显领先当前世界，说明这是刚重启的新局，
     * 直接跳过本次写入，避免几小时的成果被空世界盖掉。等这局打过旧档进度后自动恢复覆盖。
     */
    private saveToAutoSlot(): boolean {
        const save = this.snapshot();

        // ── 进度倒退保护 ──
        let newest: { key: string; save: GameSave } | null = null;
        const slots: { key: string; save: GameSave | null }[] = [];
        for (let i = 1; i <= AUTO_SLOT_COUNT; i++) {
            const key = autoSlotKey(i);
            const s = this.readAutoSlot(key);
            slots.push({ key, save: s });
            if (s && (!newest || s.savedAt > newest.save.savedAt)) newest = { key, save: s };
        }
        if (newest) {
            const ahead = GameSaveManager.progressOrd(newest.save) - GameSaveManager.progressOrd(save);
            if (ahead > 0) {
                gameLog('world',
                    `⏭️ [自动存档] 跳过：现有自动档已到 ${newest.save.year} 年，` +
                    `当前世界才 ${save.year} 年（疑似刚重启的新局，不覆盖）`);
                return false;
            }
        }

        // ── 挑最旧的位写（空位优先） ──
        const empty = slots.find((s) => !s.save);
        const target = empty
            ?? slots.reduce((a, b) => (a.save!.savedAt <= b.save!.savedAt ? a : b));
        localStorage.setItem(target.key, JSON.stringify(save));
        const t = new Date(save.savedAt);
        const hhmm = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
        gameLog('world',
            `💾 [自动存档] ${save.date} ${hhmm} → ${target.key.replace(SAVE_PREFIX, '')}` +
            ` | 纪年 ${save.year} · 据点 ${save.cities.length} · 军团 ${save.armies.length}`);
        return true;
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
                    // 认 auto / auto-1…auto-5（含旧版单档位，读旧档不丢）
                    isAuto: key.startsWith(AUTO_SLOT_KEY),
                });
            } catch { /* 坏档跳过，不阻断列表 */ }
        }
        // 自动档恒排最前（最近状态）；自动档之间按存档时刻倒序，手动档按日期倒序
        return out.sort((a, b) => {
            if (a.isAuto !== b.isAuto) return a.isAuto ? -1 : 1;
            if (a.isAuto) return (b.savedAt ?? '').localeCompare(a.savedAt ?? '');
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

    // ── 自动存档（最小间隔 10 分钟；只在全图无战斗时存） ──────

    /** 天下太平？全图无军团在交战、无攻城在进行 */
    private isWorldAtPeace(): boolean {
        // 野战
        const fields = this.app.combatSystem?.getActiveBattleFields?.();
        if (fields && fields.length > 0) return false;
        // 攻城（含排队中）
        const lm = this.getLegionManager();
        if (lm) {
            for (const a of lm.getArmies()) {
                if (!a.isDestroyed && a.getIsInCombat()) return false;
            }
        }
        return true;
    }

    public startAutoSave(): void {
        if (this.autoTimer !== null) return;
        // ⚠️ 必须初始化成"现在"，不能是 0。
        //    原来是 0 → Date.now()-0 是个天文数字 → 第一次 tick（启动后 5 秒）必定通过间隔闸；
        //    而刚重启时全图必然无战斗，于是空世界在 5 秒内就把自动档盖了。
        let lastSave = Date.now();
        this.autoTimer = window.setInterval(() => {
            try {
                const now = Date.now();
                if (now - lastSave < AUTO_SAVE_INTERVAL_MS) return;
                // 90% 的战斗是攻城战，若一直有仗打，「全图无战斗」可能几小时都不成立 →
                // 超过 FORCE 时长就不再等太平，直接存（战斗中存档允许不精确还原，见文件头说明）
                const forced = now - lastSave >= AUTO_SAVE_FORCE_AFTER_MS;
                if (!forced && !this.isWorldAtPeace()) return;
                if (this.saveToAutoSlot()) lastSave = now;
                else lastSave = now;   // 被倒退保护跳过也要重置，避免每 5 秒刷一次日志
            } catch (e) {
                gameLog('world', `⚠️ [自动存档] 失败：${(e as Error).message}`);
            }
        }, 5000); // 每 5 秒扫一次是否有战斗，大于最小间隔且太平才存
        gameLog('startup',
            `💾 [存档] 自动存档已启动：启动后 ${AUTO_SAVE_STARTUP_GRACE_MS / 60_000} 分钟内不存` +
            `（留给改代码-刷新循环）；之后每 ${AUTO_SAVE_INTERVAL_MS / 60_000} 分钟一次，` +
            `轮转 ${AUTO_SLOT_COUNT} 个档位，超过 ${AUTO_SAVE_FORCE_AFTER_MS / 60_000} 分钟未存则不再等太平`);
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
