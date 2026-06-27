export type AudioCategory = 'ui' | 'battle' | 'feed' | 'bgm';

import { getRegion, type RegionType } from '../systems/RegionSystem';
import { extractPortraitFolder } from '../config/PortraitAdjust';

export type SoundKey =
    | 'ui_click'
    | 'ui_confirm'
    | 'march_loop'
    | 'cavalry_march_loop'
    | 'battle_loop'
    | 'battle_start'
    | 'battle_end'
    | 'battle_victory'
    | 'battle_defeat'
    | 'battle_reinforcement'
    | 'city_capture'
    | 'faction_fall'
    | 'legion_wipe'
    | 'restoration'
    | 'expedition'
    | 'pass_siege'
    | 'general_skill'
    | 'bgm_main';

interface SoundDefinition {
    category: AudioCategory;
    sources: string[];
    volume?: number;
    cooldownMs?: number;
}

export interface AudioSettings {
    enabled: boolean;
    masterVolume: number;
    categoryVolume: Record<AudioCategory, number>;
}

const STORAGE_KEY = 'mapwar_audio_settings_v1';
const DEFAULT_SETTINGS: AudioSettings = {
    enabled: true,
    masterVolume: 0.5,
    categoryVolume: {
        ui: 0.45,
        battle: 0.55,
        feed: 0.65,
        bgm: 0.5,
    },
};

const SOUND_DEFINITIONS: Record<SoundKey, SoundDefinition> = {
    ui_click: sound('ui', 'ui_click', 0.35, 120),
    ui_confirm: sound('ui', 'ui_confirm', 0.45, 160),
    march_loop: sound('battle', 'march_loop', 0.32, 0),
    // 纯骑部队（草原/青藏/西域）专用行军音效，与步骑 march_loop 分开
    cavalry_march_loop: sound('battle', 'cavalry_march_loop', 0.32, 0),
    battle_loop: sound('battle', 'battle_loop', 0.5, 0),
    battle_start: sound('battle', 'battle_start', 0.65, 1600),
    battle_end: sound('battle', 'battle_end', 0.55, 1600),
    battle_victory: sound('battle', 'battle_victory', 0.7, 1800),
    battle_defeat: sound('battle', 'battle_defeat', 0.6, 1800),
    battle_reinforcement: sound('battle', 'battle_reinforcement', 0.5, 2200),
    city_capture: sound('feed', 'city_capture', 0.7, 1200),
    faction_fall: sound('feed', 'faction_fall', 0.85, 1800),
    legion_wipe: sound('feed', 'legion_wipe', 0.65, 1200),
    restoration: sound('feed', 'restoration', 0.65, 1200),
    expedition: sound('feed', 'expedition', 0.75, 1400),
    pass_siege: sound('feed', 'pass_siege', 0.45, 4000),
    general_skill: sound('battle', 'general_skill', 0.45, 1800),
    bgm_main: { category: 'bgm', sources: ['/assets/CENTRAL/CENTRAL_bgm.aud'], volume: 0.25, cooldownMs: 0 },
};

function sound(
    category: AudioCategory,
    fileName: string,
    volume: number,
    cooldownMs: number
): SoundDefinition {
    return {
        category,
        // 用 .aud 扩展名（非媒体扩展）规避 IDM/迅雷 等下载器按 .ogg 抓取
        sources: [`/sfx/${fileName}.aud`],
        volume,
        cooldownMs,
    };
}

function clamp01(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(1, value));
}

function isAudioCategory(value: string): value is AudioCategory {
    return value === 'ui' || value === 'battle' || value === 'feed' || value === 'bgm';
}

const BGM_FALLBACK_MAP: Record<string, string> = {
    panjun: 'CENTRAL',
    UI: 'CENTRAL',
    avg: 'CENTRAL',
    inbox: 'CENTRAL',
    portraits: 'CENTRAL',
};

function mergeSettings(raw: unknown): AudioSettings {
    const settings: AudioSettings = {
        enabled: DEFAULT_SETTINGS.enabled,
        masterVolume: DEFAULT_SETTINGS.masterVolume,
        categoryVolume: { ...DEFAULT_SETTINGS.categoryVolume },
    };

    if (!raw || typeof raw !== 'object') return settings;
    const data = raw as Partial<AudioSettings>;

    if (typeof data.enabled === 'boolean') settings.enabled = data.enabled;
    if (typeof data.masterVolume === 'number') settings.masterVolume = clamp01(data.masterVolume);

    const categoryVolume = data.categoryVolume;
    if (categoryVolume && typeof categoryVolume === 'object') {
        for (const [category, volume] of Object.entries(categoryVolume)) {
            if (isAudioCategory(category) && typeof volume === 'number') {
                settings.categoryVolume[category] = clamp01(volume);
            }
        }
    }

    return settings;
}

export class AudioManager {
    private static instance: AudioManager | null = null;

    private initialized = false;
    private unlocked = false;
    private gamePaused = false;
    private settings: AudioSettings = mergeSettings(null);
    private audioCache = new Map<SoundKey, HTMLAudioElement>();
    private loopCache = new Map<SoundKey, HTMLAudioElement>();
    private lastPlayedAt = new Map<SoundKey, number>();
    private missingWarned = new Set<SoundKey>();
    private followedAudioState: {
        armyId: string | null;
        marching: boolean;
        inCombat: boolean;
        isCavalry: boolean;
    } = { armyId: null, marching: false, inCombat: false, isCavalry: false };
    private bgmAudio: HTMLAudioElement | null = null;
    private currentBgmFolder: string = '';
    private currentBgmSrc: string = '';
    private failedBgmFolders = new Set<string>();
    /** 源路径 → blob 对象 URL（用 fetch 取 blob 绕开 IDM 等下载器按扩展名抓取）*/
    private objectUrlCache = new Map<string, string>();
    /** 当前期望开启的循环音（startLoop 异步加载完成后据此决定是否真播）*/
    private wantedLoops = new Set<SoundKey>();
    /** 正在播放的一次性音效克隆元素（暂停时一并停掉）*/
    private activeOneShots = new Set<HTMLAudioElement>();

    public static getInstance(): AudioManager {
        if (!AudioManager.instance) AudioManager.instance = new AudioManager();
        return AudioManager.instance;
    }

    public initialize(): void {
        if (this.initialized || typeof window === 'undefined') return;
        this.initialized = true;
        this.loadSettings();

        const unlock = () => {
            this.unlock();
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
        };

        window.addEventListener('pointerdown', unlock, { once: true, passive: true });
        window.addEventListener('keydown', unlock, { once: true });
    }

    public unlock(): void {
        if (this.unlocked) return;
        this.unlocked = true;
        // 预取所有 SFX 为 blob（非 bgm），让首次 play 同步命中缓存
        for (const key of Object.keys(SOUND_DEFINITIONS) as SoundKey[]) {
            const def = SOUND_DEFINITIONS[key];
            if (def.category === 'bgm') continue;
            void this.ensureAudioElement(key, def);
        }
        this.reapplyFollowedLegionAudio();
        // BGM 不在解锁时自动启动，由 syncRegionBgm 在跟随军团后触发
    }

    /**
     * fetch 源文件（.aud，实为 ogg 字节）→ 重标为 audio/ogg 的 blob → blob: 对象 URL。
     * .aud 不在下载器监控扩展名内，fetch 不被 IDM/迅雷 抓取；
     * blob: URL 无扩展名，<audio> 也不被抓取；重标 type 确保浏览器按 ogg 解码。
     */
    private async fetchObjectUrl(src: string): Promise<string | null> {
        const cached = this.objectUrlCache.get(src);
        if (cached) return cached;
        try {
            const res = await fetch(src, { cache: 'force-cache' });
            if (!res.ok) return null;
            const buf = await res.arrayBuffer();
            const blob = new Blob([buf], { type: 'audio/ogg' });
            const url = URL.createObjectURL(blob);
            this.objectUrlCache.set(src, url);
            return url;
        } catch {
            return null;
        }
    }

    public play(key: SoundKey): boolean {
        if (!this.settings.enabled || !this.unlocked) return false;

        const definition = SOUND_DEFINITIONS[key];
        if (!definition || this.isCoolingDown(key, definition.cooldownMs ?? 0)) return false;

        // 游戏暂停时屏蔽所有非 bgm 音效
        if (this.gamePaused && definition.category !== 'bgm') return false;

        const baseAudio = this.getAudioElement(key, definition);
        if (!baseAudio) return false;

        const audio = baseAudio.cloneNode(true) as HTMLAudioElement;
        audio.volume = this.resolveVolume(definition);
        audio.currentTime = 0;

        this.lastPlayedAt.set(key, Date.now());

        // 追踪在播克隆，暂停时一并停掉；播完自动移除
        this.activeOneShots.add(audio);
        audio.addEventListener('ended', () => this.activeOneShots.delete(audio), { once: true });

        void audio.play().catch((error) => {
            this.activeOneShots.delete(audio);
            this.warnMissingOnce(key, error);
        });

        return true;
    }

    public syncFollowedLegionAudio(state: {
        armyId: string | null;
        marching: boolean;
        inCombat: boolean;
        isCavalry?: boolean;
    }): void {
        const isCavalry = state.isCavalry ?? false;
        if (
            this.followedAudioState.armyId === state.armyId &&
            this.followedAudioState.marching === state.marching &&
            this.followedAudioState.inCombat === state.inCombat &&
            this.followedAudioState.isCavalry === isCavalry
        ) {
            return;
        }

        this.followedAudioState = { ...state, isCavalry };

        // 纯骑（草原/青藏/西域）走专用行军音，步骑/纯步走 march_loop
        const marchKey: SoundKey = isCavalry ? 'cavalry_march_loop' : 'march_loop';
        const otherMarchKey: SoundKey = isCavalry ? 'march_loop' : 'cavalry_march_loop';

        if (!state.armyId || !this.settings.enabled) {
            this.stopLoop('march_loop');
            this.stopLoop('cavalry_march_loop');
            this.stopLoop('battle_loop');
            return;
        }

        if (state.inCombat) {
            this.stopLoop('march_loop');
            this.stopLoop('cavalry_march_loop');
            this.startLoop('battle_loop');
            return;
        }

        this.stopLoop('battle_loop');
        // 切换军团或下马/上马时，先停掉另一种行军音，避免两条同时循环
        this.stopLoop(otherMarchKey);
        if (state.marching) {
            this.startLoop(marchKey);
        } else {
            this.stopLoop(marchKey);
        }
    }

    public setEnabled(enabled: boolean): void {
        this.settings.enabled = enabled;
        if (!enabled) {
            this.stopAllLoops();
            this.stopBgm();
        } else {
            this.reapplyFollowedLegionAudio();
            // BGM 由 syncRegionBgm 在跟随军团时按区域恢复，不在此强开
        }
        this.saveSettings();
    }

    public isEnabled(): boolean {
        return this.settings.enabled;
    }

    public isUnlocked(): boolean {
        return this.unlocked;
    }

    public setMasterVolume(volume: number): void {
        this.settings.masterVolume = clamp01(volume);
        this.refreshLoopVolumes();
        this.saveSettings();
    }

    public getMasterVolume(): number {
        return this.settings.masterVolume;
    }

    public setCategoryVolume(category: AudioCategory, volume: number): void {
        this.settings.categoryVolume[category] = clamp01(volume);
        this.refreshLoopVolumes();
        this.saveSettings();
    }

    public getSettings(): AudioSettings {
        return {
            enabled: this.settings.enabled,
            masterVolume: this.settings.masterVolume,
            categoryVolume: { ...this.settings.categoryVolume },
        };
    }

    private loadSettings(): void {
        try {
            const saved = window.localStorage.getItem(STORAGE_KEY);
            this.settings = saved ? mergeSettings(JSON.parse(saved)) : mergeSettings(null);
        } catch {
            this.settings = mergeSettings(null);
        }
    }

    private saveSettings(): void {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
        } catch {
            // 音效设置丢失不应影响游戏运行。
        }
    }

    private isCoolingDown(key: SoundKey, cooldownMs: number): boolean {
        const lastPlayedAt = this.lastPlayedAt.get(key) ?? 0;
        return cooldownMs > 0 && Date.now() - lastPlayedAt < cooldownMs;
    }

    /** 同步取缓存；未就绪则异步加载并返回 null（首播跳过，预取后即命中）*/
    private getAudioElement(key: SoundKey, definition: SoundDefinition): HTMLAudioElement | null {
        const cached = this.audioCache.get(key);
        if (cached) return cached;
        void this.ensureAudioElement(key, definition);
        return null;
    }

    /** 异步：fetch blob → 对象 URL → 缓存 Audio 元素 */
    private async ensureAudioElement(
        key: SoundKey,
        definition: SoundDefinition,
    ): Promise<HTMLAudioElement | null> {
        const cached = this.audioCache.get(key);
        if (cached) return cached;

        const source = definition.sources[0];
        if (!source) return null;

        const url = await this.fetchObjectUrl(source);
        if (!url) {
            this.warnMissingOnce(key, `fetch 失败: ${source}`);
            return null;
        }
        const audio = new Audio();
        audio.src = url;
        audio.preload = 'auto';
        this.audioCache.set(key, audio);
        return audio;
    }

    private startLoop(key: SoundKey): void {
        if (!this.settings.enabled || !this.unlocked) return;

        const definition = SOUND_DEFINITIONS[key];
        if (!definition) return;

        // 先记录「期望开启」意图（恢复时据此重启），即使暂停期间切换跟随军团也不丢失
        this.wantedLoops.add(key);
        // 暂停时只记意图、不实际播放（bgm 不受暂停影响）
        if (this.gamePaused && definition.category !== 'bgm') return;

        void this.ensureLoopElement(key, definition).then((audio) => {
            // 异步加载期间状态可能已变（停止跟拍/转入战斗/暂停），仅当仍被期望且未暂停时才播
            if (!audio || !this.wantedLoops.has(key) || !audio.paused) return;
            if (this.gamePaused && definition.category !== 'bgm') return;
            audio.volume = this.resolveVolume(definition);
            audio.currentTime = 0;
            void audio.play().catch((error) => {
                this.warnMissingOnce(key, error);
            });
        });
    }

    private stopLoop(key: SoundKey): void {
        this.wantedLoops.delete(key);
        const audio = this.loopCache.get(key);
        if (!audio) return;
        audio.pause();
        audio.currentTime = 0;
    }

    private stopAllLoops(): void {
        for (const key of this.loopCache.keys()) {
            this.stopLoop(key);
        }
    }

    /** 游戏暂停/恢复：暂停时停掉所有非 bgm 音效和循环音，恢复时重启循环音 */
    public setGamePaused(paused: boolean): void {
        this.gamePaused = paused;
        if (paused) {
            // 停掉所有非 bgm 循环音（保留 wantedLoops，恢复时据此重启）
            for (const [key, audio] of this.loopCache.entries()) {
                if (SOUND_DEFINITIONS[key]?.category !== 'bgm' && !audio.paused) {
                    audio.pause();
                }
            }
            // 停掉所有在播的一次性音效（一次性事件不恢复，直接丢弃）
            for (const audio of this.activeOneShots) {
                audio.pause();
            }
            this.activeOneShots.clear();
        } else {
            // 恢复所有本应在播的非 bgm 循环音
            for (const key of this.wantedLoops) {
                if (SOUND_DEFINITIONS[key]?.category === 'bgm') continue;
                const audio = this.loopCache.get(key);
                if (audio && audio.paused) {
                    void audio.play().catch(() => {});
                }
            }
        }
    }

    public stopBgm(): void {
        this.currentBgmFolder = '';
        this.currentBgmSrc = '';
        if (!this.bgmAudio) return;
        this.bgmAudio.pause();
        this.bgmAudio.currentTime = 0;
        this.bgmAudio = null;
    }

    /** 每帧调用：以地理区域 BGM 为基础，有专属 BGM 的势力文件夹才覆盖 */
    public syncPortraitBgm(portraitPath?: string, lat?: number, lng?: number): void {
        if (!this.settings.enabled || !this.unlocked) return;
        if (lat === undefined || lng === undefined) return;

        // 先按地理区域确定基础 BGM
        const region: RegionType = getRegion(lat, lng);
        let folderName: string = region;

        // 检查立绘文件夹是否有专属 BGM（如 manqing/daming/litang 等势力夹）
        const portraitFolder = portraitPath ? extractPortraitFolder(portraitPath) : undefined;
        const portraitDir = portraitFolder ? portraitFolder.replace(/^\/assets\/([^/]+)\/$/, '$1') : undefined;
        if (portraitDir && !BGM_FALLBACK_MAP[portraitDir]) {
            folderName = portraitDir;
        }

        if (folderName === this.currentBgmFolder && this.bgmAudio && !this.bgmAudio.paused) return;
        if (this.failedBgmFolders.has(folderName)) return;

        this.currentBgmFolder = folderName;
        const src = `/assets/${folderName}/${folderName}_bgm.aud`;
        this.playBgmSrc(src);
    }


    /** 每帧调用：根据镜头坐标切换对应文化区的 BGM */
    public syncRegionBgm(lat: number, lng: number): void {
        if (!this.settings.enabled || !this.unlocked) return;

        const region: RegionType = getRegion(lat, lng);
        const folder = region;
        // 同区域且音频正在播 → 跳过；若音频未播（加载失败/暂停），允许重试
        if (folder === this.currentBgmFolder && this.bgmAudio && !this.bgmAudio.paused) return;

        this.currentBgmFolder = folder;
        const src = `/assets/${folder}/${folder}_bgm.aud`;
        this.playBgmSrc(src);
    }

    private playBgmSrc(src: string): void {
        // 同一首已在播 → 跳过（dedup 用逻辑路径，blob URL 无法比对）
        if (this.currentBgmSrc === src && this.bgmAudio && !this.bgmAudio.paused) return;
        this.currentBgmSrc = src;

        void this.fetchObjectUrl(src).then((url) => {
            // 异步期间可能又切了区域 / 停了 BGM
            if (this.currentBgmSrc !== src || !this.settings.enabled || !this.unlocked) return;
            if (!url) {
                this.warnMissingOnce('bgm_main', `fetch 失败: ${src}`);
                // 记录失败文件夹，避免每帧重试
                if (this.currentBgmFolder) this.failedBgmFolders.add(this.currentBgmFolder);
                // 区域 BGM 缺失 → 回落 CENTRAL
                if (this.currentBgmFolder !== 'CENTRAL') {
                    this.currentBgmFolder = 'CENTRAL';
                    this.playBgmSrc('/assets/CENTRAL/CENTRAL_bgm.aud');
                }
                return;
            }
            if (this.bgmAudio) this.bgmAudio.pause();
            const audio = new Audio();
            audio.src = url;
            audio.loop = true;
            audio.preload = 'auto';
            const def = SOUND_DEFINITIONS['bgm_main'];
            audio.volume = def ? this.resolveVolume(def) : 0.125;
            this.bgmAudio = audio;
            void audio.play().catch((error) => {
                this.warnMissingOnce('bgm_main', error);
            });
        });
    }

    private reapplyFollowedLegionAudio(): void {
        const state = { ...this.followedAudioState };
        this.followedAudioState = { armyId: null, marching: false, inCombat: false, isCavalry: false };
        this.syncFollowedLegionAudio(state);
    }

    private refreshLoopVolumes(): void {
        for (const [key, audio] of this.loopCache.entries()) {
            const definition = SOUND_DEFINITIONS[key];
            if (definition) audio.volume = this.resolveVolume(definition);
        }
        if (this.bgmAudio) {
            const def = SOUND_DEFINITIONS['bgm_main'];
            if (def) this.bgmAudio.volume = this.resolveVolume(def);
        }
    }

    private async ensureLoopElement(
        key: SoundKey,
        definition: SoundDefinition,
    ): Promise<HTMLAudioElement | null> {
        const cached = this.loopCache.get(key);
        if (cached) return cached;

        const source = definition.sources[0];
        if (!source) return null;

        const url = await this.fetchObjectUrl(source);
        if (!url) {
            this.warnMissingOnce(key, `fetch 失败: ${source}`);
            return null;
        }
        const audio = new Audio();
        audio.src = url;
        audio.loop = true;
        audio.preload = 'auto';
        this.loopCache.set(key, audio);
        return audio;
    }

    private resolveVolume(definition: SoundDefinition): number {
        const categoryVolume = this.settings.categoryVolume[definition.category] ?? 1;
        return clamp01(this.settings.masterVolume * categoryVolume * (definition.volume ?? 1));
    }

    private warnMissingOnce(key: SoundKey, error: unknown): void {
        if (this.missingWarned.has(key)) return;
        this.missingWarned.add(key);
        if (import.meta.env.DEV) {
            console.warn(`[AudioManager] 音效暂不可用: ${key}`, error);
        }
    }
}

export const audioManager = AudioManager.getInstance();
