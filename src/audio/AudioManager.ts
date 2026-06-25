export type AudioCategory = 'ui' | 'battle' | 'feed';

export type SoundKey =
    | 'ui_click'
    | 'ui_confirm'
    | 'march_loop'
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
    | 'general_skill';

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
    },
};

const SOUND_DEFINITIONS: Record<SoundKey, SoundDefinition> = {
    ui_click: sound('ui', 'ui_click', 0.35, 120),
    ui_confirm: sound('ui', 'ui_confirm', 0.45, 160),
    march_loop: sound('battle', 'march_loop', 0.32, 0),
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
    general_skill: sound('battle', 'general_skill', 0.7, 1800),
};

function sound(
    category: AudioCategory,
    fileName: string,
    volume: number,
    cooldownMs: number
): SoundDefinition {
    return {
        category,
        sources: [`/sfx/${fileName}.ogg`, `/sfx/${fileName}.mp3`],
        volume,
        cooldownMs,
    };
}

function clamp01(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(1, value));
}

function isAudioCategory(value: string): value is AudioCategory {
    return value === 'ui' || value === 'battle' || value === 'feed';
}

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
    private settings: AudioSettings = mergeSettings(null);
    private audioCache = new Map<SoundKey, HTMLAudioElement>();
    private loopCache = new Map<SoundKey, HTMLAudioElement>();
    private lastPlayedAt = new Map<SoundKey, number>();
    private missingWarned = new Set<SoundKey>();
    private followedAudioState: {
        armyId: string | null;
        marching: boolean;
        inCombat: boolean;
    } = { armyId: null, marching: false, inCombat: false };

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
        this.reapplyFollowedLegionAudio();
    }

    public play(key: SoundKey): boolean {
        if (!this.settings.enabled || !this.unlocked) return false;

        const definition = SOUND_DEFINITIONS[key];
        if (!definition || this.isCoolingDown(key, definition.cooldownMs ?? 0)) return false;

        const baseAudio = this.getAudioElement(key, definition);
        if (!baseAudio) return false;

        const audio = baseAudio.cloneNode(true) as HTMLAudioElement;
        audio.volume = this.resolveVolume(definition);
        audio.currentTime = 0;

        this.lastPlayedAt.set(key, Date.now());

        void audio.play().catch((error) => {
            this.warnMissingOnce(key, error);
        });

        return true;
    }

    public syncFollowedLegionAudio(state: {
        armyId: string | null;
        marching: boolean;
        inCombat: boolean;
    }): void {
        if (
            this.followedAudioState.armyId === state.armyId &&
            this.followedAudioState.marching === state.marching &&
            this.followedAudioState.inCombat === state.inCombat
        ) {
            return;
        }

        this.followedAudioState = { ...state };

        if (!state.armyId || !this.settings.enabled) {
            this.stopLoop('march_loop');
            this.stopLoop('battle_loop');
            return;
        }

        if (state.inCombat) {
            this.stopLoop('march_loop');
            this.startLoop('battle_loop');
            return;
        }

        this.stopLoop('battle_loop');
        if (state.marching) {
            this.startLoop('march_loop');
        } else {
            this.stopLoop('march_loop');
        }
    }

    public setEnabled(enabled: boolean): void {
        this.settings.enabled = enabled;
        if (!enabled) {
            this.stopAllLoops();
        } else {
            this.reapplyFollowedLegionAudio();
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

    private getAudioElement(key: SoundKey, definition: SoundDefinition): HTMLAudioElement | null {
        const cached = this.audioCache.get(key);
        if (cached) return cached;

        const source = definition.sources[0];
        if (!source) return null;

        const audio = new Audio(source);
        audio.preload = 'auto';
        audio.addEventListener('error', () => this.warnMissingOnce(key, audio.error));
        this.audioCache.set(key, audio);
        return audio;
    }

    private startLoop(key: SoundKey): void {
        if (!this.settings.enabled || !this.unlocked) return;

        const definition = SOUND_DEFINITIONS[key];
        if (!definition) return;

        const audio = this.getLoopElement(key, definition);
        if (!audio || !audio.paused) return;

        audio.volume = this.resolveVolume(definition);
        audio.currentTime = 0;
        void audio.play().catch((error) => {
            this.warnMissingOnce(key, error);
        });
    }

    private stopLoop(key: SoundKey): void {
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

    private reapplyFollowedLegionAudio(): void {
        const state = { ...this.followedAudioState };
        this.followedAudioState = { armyId: null, marching: false, inCombat: false };
        this.syncFollowedLegionAudio(state);
    }

    private refreshLoopVolumes(): void {
        for (const [key, audio] of this.loopCache.entries()) {
            const definition = SOUND_DEFINITIONS[key];
            if (definition) audio.volume = this.resolveVolume(definition);
        }
    }

    private getLoopElement(key: SoundKey, definition: SoundDefinition): HTMLAudioElement | null {
        const cached = this.loopCache.get(key);
        if (cached) return cached;

        const source = definition.sources[0];
        if (!source) return null;

        const audio = new Audio(source);
        audio.loop = true;
        audio.preload = 'auto';
        audio.addEventListener('error', () => this.warnMissingOnce(key, audio.error));
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
