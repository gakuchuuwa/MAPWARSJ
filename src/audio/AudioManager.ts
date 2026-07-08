export type AudioCategory = 'ui' | 'battle' | 'feed' | 'bgm';

import { getRegion, REGION_ORDER, type RegionType } from '../systems/RegionSystem';
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

const STORAGE_KEY = 'mapwar_audio_settings_v2';
const DEFAULT_SETTINGS: AudioSettings = {
    enabled: true,
    masterVolume: 0.5,
    // 三层基准（播报/音效/音乐）原为齐平 1.0，优先级靠 ducking。
    // 2026-07-06 主人反馈音效+背景音乐略大 → 音效层(ui/battle/feed)与音乐层(bgm)小幅下调至 0.85（约 -15%），
    // 播报层(走 master×SPEECH_GAIN，不受此表)不动。仅小调，勿再改回 1.0。
    categoryVolume: {
        ui: 0.85,
        battle: 0.85,
        feed: 0.85,
        bgm: 0.85,
    },
};

// ---- 混音闪避（ducking）：播报/音效同层互斥，音乐打底 ----
// 播报和音效是同一层级、同音量，但互斥：播报响时音效静音，播报不响时音效正常。
// BGM 始终播放，只是在播报或音效活跃时压低音量。
const DUCK = {
    /** 播报时音乐压到 25% */
    bgmUnderSpeech: 0.25,
    /** 仅音效循环(行军/战斗)时音乐压到 45% */
    bgmUnderSfx: 0.45,
    /** 播报时音效静音（同层互斥：要么响播报，要么响音效） */
    sfxUnderSpeech: 0.0,
} as const;
/** 播报有效音量 = master × SPEECH_GAIN（TTS 感知偏轻，补偿至与音效/音乐齐平） */
const SPEECH_GAIN = 0.95; // 小幅上调播报音量（+5%）

// ---- 音量渐变时长（ms）：消除各路声音硬切的不适感 ----
const FADE = {
    /** 播报/音效闪避（duck）的音量渐变——够快跟得上事件，又不生切 */
    duck: 220,
    /** 行军/战斗循环音的淡入淡出 */
    loop: 300,
    /** BGM 换曲（切文化区/随机轮播）交叉淡入淡出 */
    bgmCrossfade: 900,
} as const;

const SOUND_DEFINITIONS: Record<SoundKey, SoundDefinition> = {
    ui_click: sound('ui', 'ui_click', 0.35, 120),
    ui_confirm: sound('ui', 'ui_confirm', 0.45, 160),
    march_loop: sound('battle', 'march_loop', 0.32, 0),
    // 纯骑部队（草原/青藏/中亚）专用行军音效，与步骑 march_loop 分开
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
    bgm_main: { category: 'bgm', sources: ['/assets/CENTRAL/CENTRAL_bgm.aud'], volume: 0.9, cooldownMs: 0 },
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

const BGM_FALLBACK_MAP: Record<string, string> = {
    panjun: 'CENTRAL',
    avg: 'CENTRAL',
    inbox: 'CENTRAL',
    portraits: 'CENTRAL',
};

/**
 * 随机轮播池：14 文化区 BGM（folder 名 = region）。
 * 主人 2026-07-06 定：第一首按镜头文化区放；放完后不循环单曲，
 * 在这 14 首里洗牌随机轮播（不立刻重复同一首）；镜头进入新文化区则区域优先立刻切歌。
 * 势力专属夹（daming/manqing 等）只作区域优先覆盖，不进随机池。
 */
const BGM_ROTATION_FOLDERS: readonly string[] = REGION_ORDER;

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

    // categoryVolume（音效/音乐分层基准）无用户 UI，属代码固定配置，不从存档读取——
    // 恒用 DEFAULT_SETTINGS.categoryVolume，避免旧存档里的 1.0 覆盖新基准（主人调音必生效）。
    // 用户可调的只有 enabled 与 masterVolume，上面已从存档恢复。

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
        isNaval: boolean;
    } = { armyId: null, marching: false, inCombat: false, isCavalry: false, isNaval: false };
    /** 播报进行中：音效 + 音乐压低（优先级闪避） */
    private speechDucking = false;
    private bgmAudio: HTMLAudioElement | null = null;
    private currentBgmFolder: string = '';
    private currentBgmSrc: string = '';
    private failedBgmFolders = new Set<string>();
    /** 镜头当前所在文化区对应的 BGM folder（区域优先：此值变化 = 立刻切歌）*/
    private cameraRegionFolder: string = '';
    /** 14 文化区随机轮播队列（洗牌袋，空了重洗）*/
    private bgmShuffleQueue: string[] = [];
    /** BGM 异步加载令牌：切歌 / 停歌时自增，作废旧的 fetch 回调 */
    private bgmLoadToken = 0;
    /** 源路径 → blob 对象 URL（用 fetch 取 blob 绕开 IDM 等下载器按扩展名抓取）*/
    private objectUrlCache = new Map<string, string>();
    /** 当前期望开启的循环音（startLoop 异步加载完成后据此决定是否真播）*/
    private wantedLoops = new Set<SoundKey>();
    /** 正在播放的一次性音效克隆元素（暂停时一并停掉）*/
    private activeOneShots = new Set<HTMLAudioElement>();
    /** 每个音频元素正在进行的音量渐变（setInterval id）；再次调整时先撤销旧渐变 */
    private volumeRamps = new Map<HTMLAudioElement, ReturnType<typeof setInterval>>();

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
        isNaval?: boolean;
    }): void {
        const isCavalry = state.isCavalry ?? false;
        const isNaval = state.isNaval ?? false;
        if (
            this.followedAudioState.armyId === state.armyId &&
            this.followedAudioState.marching === state.marching &&
            this.followedAudioState.inCombat === state.inCombat &&
            this.followedAudioState.isCavalry === isCavalry &&
            this.followedAudioState.isNaval === isNaval
        ) {
            return;
        }

        this.followedAudioState = { ...state, isCavalry, isNaval };

        // 纯骑（草原/青藏/中亚）走专用行军音，步骑/纯步走 march_loop
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
        // 海上（海军贴图）行军：关闭行军循环音，避免陆军脚步/马蹄与海军观感冲突。
        if (isNaval) {
            this.stopLoop('march_loop');
            this.stopLoop('cavalry_march_loop');
            return;
        }
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

    /** 播报开始/结束：开始时压低音效 + 音乐，结束恢复（优先级闪避） */
    public setSpeechDucking(active: boolean): void {
        if (this.speechDucking === active) return;
        this.speechDucking = active;
        // 平滑闪避：音效/音乐音量渐变到闪避目标，不生切
        this.refreshLoopVolumes(FADE.duck);
    }

    /** 播报有效音量（跟随主音量；TTS 感知偏轻，SPEECH_GAIN 补偿至与音效/音乐感知齐平） */
    public getSpeechVolume(): number {
        return clamp01(this.settings.masterVolume * SPEECH_GAIN);
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
        // 音效循环启动 → 音乐随之平滑压低（打底）
        if (definition.category !== 'bgm') this.updateBgmDuckVolume(FADE.duck);
        // 暂停时只记意图、不实际播放（bgm 不受暂停影响）
        if (this.gamePaused && definition.category !== 'bgm') return;

        void this.ensureLoopElement(key, definition).then((audio) => {
            // 异步加载期间状态可能已变（停止跟拍/转入战斗/暂停），仅当仍被期望且未暂停时才播
            if (!audio || !this.wantedLoops.has(key)) return;
            if (this.gamePaused && definition.category !== 'bgm') return;
            // 新起：从 0 淡入；已在播（可能正处于停音淡出中）：撤销淡出、淡回目标
            if (audio.paused) {
                audio.currentTime = 0;
                audio.volume = 0;
                void audio.play().catch((error) => {
                    this.warnMissingOnce(key, error);
                });
            }
            this.setVolume(audio, this.resolveVolume(definition), FADE.loop);
        });
    }

    private stopLoop(key: SoundKey): void {
        this.wantedLoops.delete(key);
        // 音效循环停止 → 音乐平滑恢复（若已无其他音效循环）
        if (SOUND_DEFINITIONS[key]?.category !== 'bgm') this.updateBgmDuckVolume(FADE.duck);
        const audio = this.loopCache.get(key);
        if (!audio) return;
        // 平滑淡出后再暂停；淡出途中若被 startLoop 重新期望，其 setVolume 会撤销本渐变、onDone 不触发
        this.setVolume(audio, 0, FADE.loop, () => {
            if (this.wantedLoops.has(key)) return; // 淡出未完又被重新启动 → 不停
            audio.pause();
            audio.currentTime = 0;
        });
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
            // 恢复所有本应在播的非 bgm 循环音（可能暂停在半途音量，恢复时淡回正确音量）
            for (const key of this.wantedLoops) {
                const def = SOUND_DEFINITIONS[key];
                if (!def || def.category === 'bgm') continue;
                const audio = this.loopCache.get(key);
                if (audio && audio.paused) {
                    audio.volume = 0;
                    void audio.play().catch(() => {});
                    this.setVolume(audio, this.resolveVolume(def), FADE.loop);
                }
            }
        }
        // 暂停/恢复后音效循环有效性变化 → 平滑同步音乐闪避
        this.updateBgmDuckVolume(FADE.duck);
    }

    public stopBgm(): void {
        this.currentBgmFolder = '';
        this.currentBgmSrc = '';
        this.cameraRegionFolder = '';
        this.bgmLoadToken++; // 作废任何在途加载
        if (!this.bgmAudio) return;
        this.cancelVolumeRamp(this.bgmAudio); // 撤销可能在进行的交叉淡化
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

        this.applyCameraFolder(folderName);
    }


    /** 每帧调用：根据镜头坐标切换对应文化区的 BGM */
    public syncRegionBgm(lat: number, lng: number): void {
        if (!this.settings.enabled || !this.unlocked) return;
        this.applyCameraFolder(getRegion(lat, lng));
    }

    /**
     * 区域优先切歌：镜头文化区（folderName）变化 → 立刻切该区 BGM；
     * 未变化 → 维持当前曲（含随机轮播曲），仅当整条 BGM 被 stopBgm 清空后才补播该区曲。
     * 随机轮播曲放完由 ended 回调自然接力，此处不打断。
     */
    private applyCameraFolder(folderName: string): void {
        if (folderName !== this.cameraRegionFolder) {
            // 镜头进入新文化区：区域优先，立刻切歌
            this.cameraRegionFolder = folderName;
            if (this.failedBgmFolders.has(folderName)) return;
            this.playBgmFolder(folderName);
            return;
        }
        // 镜头文化区未变：仅当 BGM 被彻底停掉（currentBgmSrc 为空）才补播该区曲
        if (this.currentBgmSrc === '' && !this.failedBgmFolders.has(folderName)) {
            this.playBgmFolder(folderName);
        }
    }

    /** 播放某文化区/势力夹 BGM；单曲不循环，放完随机轮播下一文化（14 洗牌循环） */
    private playBgmFolder(folder: string): void {
        const src = `/assets/${folder}/${folder}_bgm.aud`;
        // 同一首已在播 → 跳过（dedup 用逻辑路径，blob URL 无法比对）
        if (this.currentBgmSrc === src && this.bgmAudio && !this.bgmAudio.paused) return;
        this.currentBgmFolder = folder;
        this.currentBgmSrc = src;
        const token = ++this.bgmLoadToken;

        void this.fetchObjectUrl(src).then((url) => {
            // 异步期间又切了歌 / 停了 BGM → 作废本次回调
            if (token !== this.bgmLoadToken || !this.settings.enabled || !this.unlocked) return;
            if (!url) {
                this.warnMissingOnce('bgm_main', `fetch 失败: ${src}`);
                // 记录失败文件夹，避免每帧重试
                this.failedBgmFolders.add(folder);
                // 区域 BGM 缺失 → 回落 CENTRAL（必定存在）
                if (folder !== 'CENTRAL') this.playBgmFolder('CENTRAL');
                return;
            }
            const oldAudio = this.bgmAudio;
            const audio = new Audio();
            audio.src = url;
            audio.loop = false; // 单曲不循环：放完随机轮播下一文化
            audio.preload = 'auto';
            const def = SOUND_DEFINITIONS['bgm_main'];
            const targetVol = def ? this.resolveVolume(def) : 0.125;
            audio.volume = 0; // 从 0 交叉淡入
            audio.addEventListener(
                'ended',
                () => {
                    // 已被区域切歌 / 停歌替换 → 不接力
                    if (this.bgmAudio !== audio || !this.settings.enabled || !this.unlocked) return;
                    this.playBgmFolder(this.nextRotationFolder(folder));
                },
                { once: true },
            );
            this.bgmAudio = audio;
            void audio.play().catch((error) => {
                this.warnMissingOnce('bgm_main', error);
            });
            // 新曲淡入 + 旧曲交叉淡出后停掉（换文化区/轮播不再生切）
            this.setVolume(audio, targetVol, FADE.bgmCrossfade);
            if (oldAudio) {
                this.setVolume(oldAudio, 0, FADE.bgmCrossfade, () => {
                    oldAudio.pause();
                    oldAudio.currentTime = 0;
                });
            }
        });
    }

    /** 洗牌袋取下一首文化 BGM folder；避免与刚放完的紧挨重复 */
    private nextRotationFolder(exclude: string): string {
        if (this.bgmShuffleQueue.length === 0) {
            this.bgmShuffleQueue = this.shuffledRegionFolders();
        }
        let next = this.bgmShuffleQueue.shift()!;
        if (next === exclude && this.bgmShuffleQueue.length > 0) {
            this.bgmShuffleQueue.push(next);
            next = this.bgmShuffleQueue.shift()!;
        }
        return next;
    }

    /** Fisher–Yates 洗牌 14 文化区 folder */
    private shuffledRegionFolders(): string[] {
        const arr = [...BGM_ROTATION_FOLDERS];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    private reapplyFollowedLegionAudio(): void {
        const state = { ...this.followedAudioState };
        this.followedAudioState = { armyId: null, marching: false, inCombat: false, isCavalry: false, isNaval: false };
        this.syncFollowedLegionAudio(state);
    }

    /** 刷新所有循环音 + BGM 到各自解析音量；durationMs>0 时平滑渐变（默认瞬时，供滑杆用） */
    private refreshLoopVolumes(durationMs = 0): void {
        for (const [key, audio] of this.loopCache.entries()) {
            const definition = SOUND_DEFINITIONS[key];
            // 已停(未在期望中)的循环音不要被 duck 渐变重新拉响；停音自己的淡出各管各的
            if (!definition || !this.wantedLoops.has(key)) continue;
            this.setVolume(audio, this.resolveVolume(definition), durationMs);
        }
        if (this.bgmAudio) {
            const def = SOUND_DEFINITIONS['bgm_main'];
            if (def) this.setVolume(this.bgmAudio, this.resolveVolume(def), durationMs);
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

    /**
     * 把某音频元素的音量平滑过渡到 target（durationMs 内，smoothstep 缓动）。
     * durationMs<=0 或差异极小 → 立即赋值。会先撤销该元素正在进行的渐变（新意图覆盖旧）。
     * 用 setInterval 而非 requestAnimationFrame：后台标签页 rAF 被冻结会让音量卡在半路，
     * setInterval 即便被节流也能按真实经过时间收敛到目标。
     */
    private setVolume(
        audio: HTMLAudioElement,
        target: number,
        durationMs: number,
        onDone?: () => void,
    ): void {
        const existing = this.volumeRamps.get(audio);
        if (existing !== undefined) {
            clearInterval(existing);
            this.volumeRamps.delete(audio);
        }
        const clamped = clamp01(target);
        const start = clamp01(audio.volume);
        if (durationMs <= 0 || Math.abs(clamped - start) < 0.005) {
            audio.volume = clamped;
            onDone?.();
            return;
        }
        const t0 = performance.now();
        const id = setInterval(() => {
            const p = Math.min(1, (performance.now() - t0) / durationMs);
            const eased = p * p * (3 - 2 * p); // smoothstep
            audio.volume = clamp01(start + (clamped - start) * eased);
            if (p >= 1) {
                clearInterval(id);
                this.volumeRamps.delete(audio);
                audio.volume = clamped;
                onDone?.();
            }
        }, 25);
        this.volumeRamps.set(audio, id);
    }

    /** 撤销某元素正在进行的音量渐变（不改当前音量），供硬停时清理 */
    private cancelVolumeRamp(audio: HTMLAudioElement): void {
        const existing = this.volumeRamps.get(audio);
        if (existing !== undefined) {
            clearInterval(existing);
            this.volumeRamps.delete(audio);
        }
    }

    private resolveVolume(definition: SoundDefinition): number {
        const categoryVolume = this.settings.categoryVolume[definition.category] ?? 1;
        const base = this.settings.masterVolume * categoryVolume * (definition.volume ?? 1);
        return clamp01(base * this.duckFactor(definition.category));
    }

    /**
     * 优先级闪避（ducking）：播报/音效同层互斥，音乐打底。
     * - 音乐(bgm)：播报中压到 bgmUnderSpeech；仅音效循环(行军/战斗)时压到 bgmUnderSfx。
     * - 音效(ui/battle/feed)：播报中静音（同层互斥：要么响播报，要么响音效）。
     * - 播报本身走 SpeechAnnouncer(TTS)，不在此压低。
     */
    private duckFactor(category: AudioCategory): number {
        if (category === 'bgm') {
            if (this.speechDucking) return DUCK.bgmUnderSpeech;
            if (this.isSfxLoopActive()) return DUCK.bgmUnderSfx;
            return 1;
        }
        // 音效层：ui / battle / feed——播报时静音，播报结束后恢复
        return this.speechDucking ? DUCK.sfxUnderSpeech : 1;
    }

    /** 是否有音效循环(行军/战斗)正在播放（暂停时视为无声，不压低音乐） */
    private isSfxLoopActive(): boolean {
        if (this.gamePaused) return false;
        return (
            this.wantedLoops.has('march_loop') ||
            this.wantedLoops.has('cavalry_march_loop') ||
            this.wantedLoops.has('battle_loop')
        );
    }

    /** 仅刷新 BGM 音量（音效循环起停时用，无需全量刷新）；durationMs>0 平滑渐变 */
    private updateBgmDuckVolume(durationMs = 0): void {
        if (!this.bgmAudio) return;
        const def = SOUND_DEFINITIONS['bgm_main'];
        if (def) this.setVolume(this.bgmAudio, this.resolveVolume(def), durationMs);
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
