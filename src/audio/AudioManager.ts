export type AudioCategory = 'ui' | 'battle' | 'feed' | 'bgm';

import { getRegion, type RegionType } from '../systems/RegionSystem';
import { extractPortraitFolder } from '../config/PortraitAdjust';

export type SoundKey =
    | 'march_loop'
    | 'cavalry_march_loop'
    | 'player_march_loop'
    | 'naval_march_loop'
    | 'naval_battle_loop'
    | 'battle_loop'
    | 'battle_victory'
    | 'battle_defeat'
    | 'general_skill'
    // 海战音效（2026-08-19 加：帝国时代2 DE 战斗音效）
    | 'naval_arrow_fire'
    | 'naval_cannon_fire'
    | 'naval_sink'
    | 'naval_explode'
    | 'naval_cannon_splash'
    // 陆战音效（2026-08-19：帝国时代2 DE 陆战战斗音效）
    | 'gun_fire'
    | 'explosion'
    // 🔴 [2026-09-16 主人「近战兵没有了也就没有音效了，应该加 DE 的射箭音效」]
    | 'arrow_fire'
    // 陆战接触音景（2026-08-19 主人提供：两军接触起循环垫底、13 退场停，66.9s）
    | 'land_contact'
    // 🔴 [2026-09-11 主人定]「战术模式 30 秒的时候用城墙倒塌.WAV 音效」
    | 'wall_collapse'
    | 'siege_impact'
    | 'siege_launch'
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
    // 三层基准：语音优先（master×0.95），音效次之（匹配战斗氛围），音乐打底
    categoryVolume: {
        ui: 0.85,
        battle: 0.95,
        feed: 0.95,
        // [2026-09-12] 上一轮我误把这里当"帝国时代2的音量"加了 0.55→0.70 —— 主人指出
        // 「不是总音量，是有个曲子叫帝国时代2」→ **已撤回**，改的是单曲增益（见 BGM_REGION_GAIN.age_of_kings）。
        bgm: 0.55,
    },
};

// ---- 混音闪避（ducking）：语音优先，音效与音乐打底衬托 ----
// 播报响时音效/音乐压到低量衬托，不抢语音；无播报时各层正常。
const DUCK = {
    /** 播报时音乐压到 35%（衬托不抢） */
    bgmUnderSpeech: 0.35,
    /** 战斗音效循环时音乐压到 30%（战斗不动，2026-08-04 GAKU 定：战斗原样） */
    bgmUnderSfx: 0.30,
    /** 行军音效循环时音乐压到 50%（2026-08-04 GAKU 反馈行军几乎听不到 BGM：0.30 叠加 bgm 层 0.55 后音乐仅剩音效一半） */
    bgmUnderMarch: 0.50,
    /**
     * 13 接触音景（land_contact）循环时音乐压到 85% —— 比战斗 0.30、行军 0.50 都轻。
     * 主人 2026-08-19 定「少压一点就行」：这段音景本身是战场底噪、不含旋律，
     * 压太狠会把 BGM 整个吃掉，只要给它让出一点空间、听得出「音乐退了半步」即可。
     *
     * 🔴 [2026-09-02 主人「战术模式好像依然没有背景音乐」] 0.60 → 0.85。
     *    实测（浏览器里逐个读 audio.volume 折算到 master 0.5，不是估算）：
     *      战略地图 BGM 0.173 → 进 13 压成 0.104，而 land_contact 底噪是 0.199，
     *      音乐比底噪低 5.7dB；再叠上火器 0.261 / 攻城撞击 0.295 / 爆炸 0.309 /
     *      火炮 0.404（比音乐高 8~11.8dB），BGM 被整段宽频底噪彻底掩蔽 ——
     *      听感就是「13 里没有音乐」，但它其实一直在播（bgmAudio.paused === false）。
     *    0.85 后 BGM = 0.147，只比底噪低 2.6dB，能听出旋律又不抢戏。
     *    ⚠️ 这条只管**音景**那一路；播报仍走 bgmUnderSpeech 0.35（语音优先不动）。
     */
    bgmUnderBattleAmbience: 0.85,
    /** 播报时音效压到 12%（微弱衬托，不抢语音） */
    sfxUnderSpeech: 0.28,
} as const;
/** 播报有效音量 = master × SPEECH_GAIN（TTS 感知偏轻，补偿至与音效/音乐齐平） */
const SPEECH_GAIN = 0.95; // 小幅上调播报音量（+5%）

// ---- 音量渐变时长（ms）：消除各路声音硬切的不适感 ----
const FADE = {
    /** 播报/音效闪避（duck）的音量渐变——更缓，消除硬切感 */
    duck: 600,
    /** 行军/战斗循环音的淡入淡出 */
    loop: 300,
    /** 一次性音效淡入（武将技等） */
    oneShot: 200,
    /** BGM 换曲（切文化区/随机轮播）交叉淡入淡出 */
    bgmCrossfade: 900,
} as const;

const SOUND_DEFINITIONS: Record<SoundKey, SoundDefinition> = {
    march_loop: sound('battle', 'march_loop', 0.15, 0),
    // 纯骑部队（草原/青藏/中亚）专用行军音效，与步骑 march_loop 分开
    cavalry_march_loop: sound('battle', 'cavalry_march_loop', 0.18, 0),
    // 🔴 [2026-09-11 主人定]「把这个改为玩家行军音效」——玩家（乱入者）**独骑**行军专用循环音。
    //    素材：主人提供的 `玩家骑马.WAV`（44.1k 立体声 22.04s），转 vorbis → public/sfx/player_march_loop.aud。
    //    音量 0.7 是**响度对齐**的结果，不是随手写的：EBU R128 实测
    //      march_loop -12.8 LUFS @0.15 → 折算 -29.3；cavalry_march_loop -12.0 LUFS @0.18 → -26.9；
    //      本文件 -24.3 LUFS（峰值 -0.0 dBFS，马蹄瞬态多、整体偏轻，比那两条低约 12dB）。
    //    取 0.7 → 折算 -27.4，正好落在两条行军循环之间；照抄 0.18 会低 12dB，等于听不见。
    player_march_loop: sound('battle', 'player_march_loop', 0.7, 0),
    // 主人提供的“航海.WAV”：海军实际航行期间循环，停航/交战/取消跟拍时淡出。
    // 原文件 EBU R128 -23.0 LUFS；0.55 后约 -28.2 LUFS，与现有三条行军循环响度相当。
    naval_march_loop: sound('battle', 'naval_march_loop', 0.55, 0),
    // 主人提供的“海战音效.WAV”：跟拍舰队交战期间循环，与航海行军音、陆战循环音互斥。
    // 原文件 -14.1 LUFS，与 battle_loop 的 -13.7 LUFS 接近，沿用 0.7 保持战斗响度一致。
    naval_battle_loop: sound('battle', 'naval_battle_loop', 0.7, 0),
    battle_loop: sound('battle', 'battle_loop', 0.7, 0),
    battle_victory: sound('battle', 'battle_victory', 0.5, 1800),
    battle_defeat: sound('battle', 'battle_defeat', 0.4, 1800),
    general_skill: sound('battle', 'general_skill', 0.45, 1800),
    // 海战音效（2026-08-19：帝国时代2 DE 战斗音效，多源随机变奏）
    naval_arrow_fire: sounds('battle', ['naval_arrow_fire_1', 'naval_arrow_fire_2', 'naval_arrow_fire_3', 'naval_arrow_fire_4'], 0.65, 250),
    naval_cannon_fire: sounds('battle', ['naval_cannon_fire_1', 'naval_cannon_fire_2', 'naval_cannon_fire_3', 'naval_cannon_fire_4', 'naval_cannon_fire_5', 'naval_cannon_fire_6'], 0.85, 400),
    naval_sink: sounds('battle', ['naval_sink_1', 'naval_sink_2', 'naval_sink_3', 'naval_sink_4', 'naval_sink_5', 'naval_sink_6'], 0.55, 0),
    naval_explode: sounds('battle', ['naval_explode_1', 'naval_explode_2', 'naval_explode_3', 'naval_explode_4'], 0.7, 0),
    naval_cannon_splash: sounds('battle', ['naval_cannon_splash_1', 'naval_cannon_splash_2', 'naval_cannon_splash_3', 'naval_cannon_splash_4'], 0.45, 250),
    // 陆战音效（2026-08-19：帝国时代2 DE 陆战战斗音效，多源随机变奏）
    gun_fire: sounds('battle', ['gun_fire_1', 'gun_fire_2', 'gun_fire_3', 'gun_fire_4', 'gun_fire_5', 'gun_fire_6'], 0.55, 150),   // 0.75→0.55：全表最高，且火器成排齐射时多发叠加
    explosion: sounds('battle', ['explosion_1', 'explosion_2', 'explosion_3', 'explosion_4', 'explosion_5', 'explosion_6'], 0.65, 200),
    // 陆战接触音景（主人 2026-08-19 提供 WAV，转 vorbis，66.9s）：**循环播放**，
    // 两军接触起循环垫底、13 退场停。13 期间不播旧的 battle_loop（见 syncFollowedLegionAudio），
    // 这条就是那块空缺的底噪；具体的刀剑/枪炮事件音效叠在它上面。
    /**
     * 🔴 [2026-09-16 主人定]「战术模式中，如果近战兵没有了，也就没有音效了，应该添加 DE 中的射箭音效」
     *
     * 起因：`land_contact`（近战接触音景）在近战兵死绝后会淡出（2026-09-15 主人自己定的），
     * 而弓弩对射这一段**一个音效都没有** —— 攻城器械有 siege_launch、火器有 gun_fire，
     * 唯独常规远程兵（弓/弩/标枪/飞斧…）射出去是全静音的。
     *
     * 素材直接复用海战那批 DE 箭矢发射声（`naval_arrow_fire_*`，同一批提取，本来就是弓弦+箭雨声），
     * 不新提取；只是陆战的密度与海战完全不同，所以**单独开一条键**来配音量与冷却。
     *
     * 音量/冷却的实测标定（ffmpeg ebur128，与 siege_impact 那条注释同一套方法）：
     *   · 素材本身 4 条平均 **-33.5 LUFS**，单条时长 **约 1.97s**（是一轮箭雨，不是单发）
     *   · 冷却 700ms + 1.97s 时长 ⇒ 稳态约 **2.8 层重叠**（≈ +4.5dB）
     *   · 0.48 折算单发 -39.9 LUFS，叠 2.8 层后约 **-35.4 LUFS**
     *   · 对照：gun_fire -36.5、海战箭矢 -37.2、land_contact -21.4、siege_impact -23.0
     *     → 比火器单发略高 1dB（这一段它是唯一的声音，得撑得住场），远低于近战底噪，不抢戏。
     *   ⚠️ 冷却别往 250ms 调（海战那条的值）：陆战几十个弓手几乎每帧都在放箭，
     *      250ms 会叠到 8 层，糊成一片白噪。要调手感就改这一行的两个数。
     */
    arrow_fire: sounds('battle', ['naval_arrow_fire_1', 'naval_arrow_fire_2', 'naval_arrow_fire_3', 'naval_arrow_fire_4'], 0.48, 700),
    land_contact: sound('battle', 'land_contact', 0.42, 0),
    // 🔴 [2026-09-11 主人定]「战术模式 30 秒的时候请用城墙倒塌.WAV 音效」
    //    触发点唯一：Scene13WarLayer.collapseFrontWalls()（开战 30 秒保底随机塌一半城墙，
    //    全片唯一的塌墙处）→ 每场只响一次。
    //    音量 0.6 是响度对齐的结果：EBU R128 实测本文件 -14.7 LUFS，
    //    而反复凿墙的 siege_impact_de -18.8 LUFS @0.62（折算 -22.9）——
    //    塌墙是「一次性大事」，取 0.6 折算 -19.1，比凿墙撞击高约 3.8dB，进得了戏又不炸耳。
    wall_collapse: sound('battle', 'wall_collapse', 0.6, 0),
    // 攻城武器（2026-08-24 主人：「战斗开始前 30 秒是攻城武器攻击，但是没有音效」）。
    // ⚠️ 素材是**借用**同一批 DE 战斗音效，不是攻城武器的原声——
    //    DE 的攻城音效封在 Wwise `.pck` 里（resources/wwise/Base.pck），
    //    要 wwiser + vgmstream 解包才能拿到，见 scratch/wwiser。素材到位后只改这两行。
    //   siege_impact = 冲车撞门 / 投石命中：低频重击闷响，借 explosion（DE 原声，音色同源）
    //   siege_launch = 投石车配重砸下 / 弩炮弹射：借 naval_cannon_fire 的发射闷响
    // 音量比火器低：攻城武器 4~6 个同时凿墙，冷却也拉长防止糊成一片。
    // 🔴 siege_impact = **DE 原声**（主人 2026-08-24 从 52 个候选里听出来的：wem 453205371，
    //    Custom Vorbis / 48kHz / 单声道 / 1.10s）。提取链路：
    //      wwise/Base.pck (AKPK) → bnk 内嵌 wem (BKHD+DIDX) → vgmstream 解 Wwise Vorbis → ogg
    //    DE **没有公开音效名字表**（dat 的 sound_id 全 -1、sounds.json 只有 49 条 UI 音、
    //    社区 wwnames 没收录 AoE2 DE、按命名规律猜的 4428 个候选零匹配），
    //    所以只能提取全部 6732 个再靠人耳指认。原始素材留在 scratch/de_audio/。
    siege_impact: sound('battle', 'siege_impact_de', 0.62, 260),
    // ⚠️ siege_launch 仍是**借用**（DE 同批的火炮发射声），主人还没指认到投石车/弩炮的原声。
    siege_launch: sounds('battle', ['naval_cannon_fire_2', 'naval_cannon_fire_4', 'naval_cannon_fire_6'], 0.30, 600),   // 0.70→0.42（约 -4.4dB，主人 2026-08-19「有点吵」）：它从接触响到退场，是底噪不是主角
    bgm_main: { category: 'bgm', sources: ['/assets/bgm/CENTRAL_bgm.aud'], volume: 0.9, cooldownMs: 0 },
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

/** 多源变奏音效：播放时从 sources 随机挑一个（海战开炮/沉没等） */
function sounds(
    category: AudioCategory,
    fileNames: string[],
    volume: number,
    cooldownMs: number
): SoundDefinition {
    return {
        category,
        sources: fileNames.map((n) => `/sfx/${n}.aud`),
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
 * BGM 响度补偿：把每首曲子拉平到 **-21.0 LUFS**（ITU-R BS.1770 综合响度，非 RMS）。
 * gain = 10^((-21.0 - 实测LUFS) / 20)，注释里的数字就是该文件的实测值。
 *
 * 🔴 **换过 BGM 文件就必须重跑 `npm run bgm:audit`**（tools/bgm_audit.mjs）。
 *    2026-08-19 实测发现：8-04 那轮校准之后，37 首里有 22 首被统一重压到 -18.0 LUFS，
 *    而本表还留着重压前的老增益 —— 那 22 首补偿后落在 -19.5~-16.8，最响的 STEPPE
 *    比基准响 4.2dB（约 1.6 倍振幅），就是主人听到的「有的大有的小」。
 *    表本身没错，是**文件换了表没跟着换**。审计脚本就是防这个的。
 */
const BGM_REGION_GAIN: Record<string, number> = {
    // [2026-09-12 主人「所有曲子音量肯定不一致吧，请统一一个音量大小」]
    //    以下三首**原先压根不在表里** → 按 1.0 播放、无任何补偿（比其它曲响 3dB），现按实测 LUFS 补进表。
    // 🔴 [2026-09-15 主人授权「只动最差的那 4 首」] DIANQIAN/pugan/zhaosong/TIBET 已**裁掉安静前奏**。
    //    起因：整首平均响度本来就统一（37 首实测全落在 -21.0±0.45dB），但 BGM 是从头播的，
    //    观众听到的是**前十几秒** —— 实测前15s 极差达 20.7dB，这 4 首是离群值：
    //      DIANQIAN/pugan -39.5dB（几乎全无声）、zhaosong -29.5dB、TIBET -27.0dB。
    //    裁切点由 ebur128 逐秒短时响度定（scratch/probe_bgm_intro_cut.cjs + try_bgm_cuts.cjs）：
    //      DIANQIAN/pugan 裁 26s（前15s -39.1 → -21.4）、zhaosong 裁 37s（-29.4 → -22.8）、
    //      TIBET 裁 20s（-27.0 → -22.4），全部进入其余 33 首的同一档（优于 -25dB）。
    //    原文件备份在 `音乐素材/bgm_原始备份_20260915/*.orig`（这 4 首无母带，删备份即不可逆）。
    BASHU: 0.708,      // 实测 -18.0 LUFS · 巴蜀
    DIANQIAN: 0.718,   // 实测 -18.12 LUFS · 滇黔（2026-09-15 裁前奏 26s 后重测）
    LINGNAN: 0.708,    // 实测 -18.0 LUFS · 岭南
    CENTRAL: 0.7,  // -17.9 LUFS
    CENTRAL_ASIA: 0.708,  // -18.0 LUFS
    BERBER: 0.55,  // -15.8 LUFS · 征服天堂（2026-08-21 改派柏柏尔·原通用随机曲）
    // 🔴 [2026-09-12 主人「有个曲子叫帝国时代2（把它音量大一点）」] 0.427 → **0.60**（≈ +3.0 dB）。
    //    这首原文件是 -13.6 LUFS，比基准（-18.0）响 7.3dB，2026-08-04 被"大幅压低"到 0.427
    //    拉平到基准 —— 主人听感就是它偏小。现在单独抬 3dB，落到约 **-16.6 LUFS**
    //    （比多数曲子响约 1.4dB，仍低于最响的一档，不会盖过音效与播报）。
    age_of_kings: 0.427,
    fallen_army: 0.603,  // -16.6 LUFS · （2026-08-04 通用随机曲）
    game_of_thrones: 0.708,  // -18.0 LUFS · 用户要求单曲小幅提高约 1dB（通用随机曲）
    shadow_assassin: 0.624,  // -16.9 LUFS · （2026-08-04 通用随机曲·暗影刺客）
    GERMANIC: 0.596,  // -16.5 LUFS · （2026-08-04 新增 The Mass）
    daming: 0.767,  // -18.7 LUFS · （2026-08-04 换为 8月4日伴奏，原 Nijamena 移给 india）
    HEXI: 0.708,  // -18.0 LUFS
    helmet_to_helmet: 0.676,  // -17.6 LUFS · （2026-08-04 通用随机曲）
    hes_a_pirate: 0.7,  // -17.9 LUFS · （2026-08-04 通用随机曲）
    INDIA: 0.708,  // -18.0 LUFS · = daming Nijamena（2026-08-04 印度首选）
    JAPAN: 0.708,  // -18.0 LUFS
    JIANGNAN: 0.708,  // -18.0 LUFS
    KOREA: 0.708,  // -18.0 LUFS
    LATIN: 0.631,  // -17.0 LUFS · （2026-08-04 新增 Star Sky）
    litang: 0.716,  // -18.1 LUFS
    liuhan: 0.708,  // -18.0 LUFS
    // 🔴 [2026-09-12 主人「江山风雨情的音量调大一点」] 0.708 → **1.00**（≈ +3.0 dB）。
    //    《江山风雨情》是电视剧《康熙王朝》主题曲 → 对应本作「满清」这首（`manqing_bgm.aud`）。
    //    ⚠️ 曲名在仓库里**没有显示名映射**，是主人按出处认的；若指的不是这首（例如「大明」daming），
    //       说一声即可改回来/改那首。
    manqing: 0.708,
    NORTH: 0.716,  // -18.1 LUFS
    NORTHEAST: 0.708,  // -18.0 LUFS
    pugan: 0.718,  // -18.12 LUFS · = DIANQIAN 同曲 cp（2026-09-15 裁前奏 26s 后重测）
    rock_house_jail: 0.724,  // -18.2 LUFS · （2026-08-04 通用随机曲）
    SLAVIC: 0.684,  // -17.7 LUFS · （2026-08-04 新增 Hall om mig）
    STEPPE: 0.708,  // -18.0 LUFS · 大幅提升
    TIBET: 0.709,  // -18.01 LUFS · 千年的祈祷（2026-09-15 裁前奏 20s 后重测）
    WESTERN: 0.708,  // -18.0 LUFS
    WEST_ASIA: 0.582,  // -16.3 LUFS · （2026-08-04 新增 出埃及记）
    victory: 0.589,  // -16.4 LUFS · （2026-08-04 通用随机曲）
    wuzhou: 0.7,  // -17.9 LUFS
    xianqin: 0.708,  // -18.0 LUFS
    yingqin: 0.708,  // -18.0 LUFS
    zhaosong: 0.697,  // -17.87 LUFS · 兰陵王入阵曲（2026-09-15 裁前奏 37s 后重测）
};

/**
 * 随机轮播池：全部 BGM（文化区 + 势力专属 + 通用随机曲；folder 名 = 文化区/势力/曲名片）。
 * 主人 2026-08-04 定：首选 = 跟随军团立绘文件夹对应曲（文化区或势力夹，区域优先）；
 * 放完后不循环单曲，在全部曲目里洗牌随机轮播（不立刻重复同一首）；
 * 镜头进入新文化区/势力范围则区域优先立刻切歌。
 */
/** 实际存在且完成响度标定的曲目；随机池只允许从这里取，避免抽到不存在的区域文件。 */
const AVAILABLE_BGM_FOLDERS = new Set<string>(Object.keys(BGM_REGION_GAIN));
const BGM_ROTATION_FOLDERS: readonly string[] = Object.freeze([...AVAILABLE_BGM_FOLDERS]);
const GENERIC_BGM_FALLBACK = 'age_of_kings';

function resolveAvailableBgmFolder(folder: string): string {
    // 没有对应文化曲时用无文化归属的游戏主题曲，不能拿中原音乐冒充其他文明。
    return AVAILABLE_BGM_FOLDERS.has(folder) ? folder : GENERIC_BGM_FALLBACK;
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
    private audioCache = new Map<SoundKey, HTMLAudioElement[]>();
    private loopCache = new Map<SoundKey, HTMLAudioElement>();
    private lastPlayedAt = new Map<SoundKey, number>();
    private missingWarned = new Set<SoundKey>();
    private followedAudioState: {
        armyId: string | null;
        marching: boolean;
        inCombat: boolean;
        isCavalry: boolean;
        isNaval: boolean;
        /** [2026-09-11] 跟拍对象是否玩家本人（独骑）——决定行军音走 player_march_loop */
        isPlayer: boolean;
    } = { armyId: null, marching: false, inCombat: false, isCavalry: false, isNaval: false, isPlayer: false };
    /** 播报进行中：音效 + 音乐压低（优先级闪避） */
    private speechDucking = false;
    private bgmAudio: HTMLAudioElement | null = null;
    /** 当前 BGM 专用 blob URL；换曲/停歌后立即释放，不进入长期对象 URL 缓存。 */
    private bgmObjectUrl: string | null = null;
    private currentBgmFolder: string = '';
    private currentBgmSrc: string = '';
    private failedBgmFolders = new Set<string>();
    /** 镜头当前所在文化区对应的 BGM folder（区域优先：此值变化 = 立刻切歌）*/
    private cameraRegionFolder: string = '';
    /** 全部 BGM 随机轮播队列（洗牌袋，空了重洗）*/
    private bgmShuffleQueue: string[] = [];
    /** BGM 异步加载令牌：切歌 / 停歌时自增，作废旧的 fetch 回调 */
    private bgmLoadToken = 0;
    /** 源路径 → blob 对象 URL（用 fetch 取 blob 绕开 IDM 等下载器按扩展名抓取）*/
    private objectUrlCache = new Map<string, string>();
    /**
     * 最后一次 BGM 请求（无论当时成没成功）。解锁 / 重新启用音频后据此补播。
     * 只留最后一次：BGM 本来就是「当前该放哪首」的单值状态，不是队列。
     */
    private lastBgmRequest: { portraitPath?: string; lat: number; lng: number } | null = null;
    /** 当前期望开启的循环音（startLoop 异步加载完成后据此决定是否真播）*/
    private wantedLoops = new Set<SoundKey>();
    /** 正在播放的一次性音效及其定义（暂停、主音量和语音闪避时同步处理）*/
    private activeOneShots = new Map<HTMLAudioElement, SoundDefinition>();
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

        // 🔴 [2026-08-12 修「每次刷新都要点一下才有声」] 开局先乐观试一次，别干等手势。
        //   浏览器自动播放策略：一次真实播放需要用户手势 **或** 本站媒体互动分够高
        //   （Chrome MEI —— 常玩的站点会攒够）。攒够的情况下这一试就直接出声，用户什么都不用点。
        //   这在开发期尤其要紧：改一次文件 → dev server 刷新页面 → 音频锁重新锁上 → 又要点一次。
        void this.tryAutoUnlock();
    }

    /**
     * 不靠用户手势地试探能否播放；成功才算解锁。
     *
     * 🔴 **必须真播一次来验证，不能直接把 unlocked 置 true**：置了但实际被拦，
     *    手势监听器会被撤掉，声音就永远回不来了（比现在更糟）。
     * 🔴 探针用 `volume = 0` 而不是 `muted = true`：Chrome 的策略只看 muted 属性，
     *    静音元素**永远允许**自动播放 —— 拿它当探针会得到假通过。volume=0 仍算可发声媒体，
     *    该拦的照样拦，所以它测的才是真结果。
     */
    private async tryAutoUnlock(): Promise<void> {
        if (this.unlocked || !this.settings.enabled) return;
        const key = (Object.keys(SOUND_DEFINITIONS) as SoundKey[])
            .find((k) => SOUND_DEFINITIONS[k].category !== 'bgm');
        if (!key) return;
        const audio = await this.ensureAudioElement(key, SOUND_DEFINITIONS[key]);
        if (!audio || this.unlocked) return;
        const prevVolume = audio.volume;
        try {
            audio.volume = 0;
            await audio.play();
            audio.pause();
            audio.currentTime = 0;
            audio.volume = prevVolume;
            this.unlock();          // 真的能播 → 走正常解锁（预取 SFX + 补播音效 + 补播 BGM）
        } catch {
            audio.volume = prevVolume;
            // 被策略拦下 —— 什么都不做，等用户手势那条路兜底
        }
    }

    /**
     * 场景层的循环音效开关（13 演出用）。内部就是 startLoop/stopLoop，
     * 只是把它们暴露给场景 —— 那两个原本只由 syncFollowedLegionAudio 驱动（行军/交战底噪），
     * 而 13 有自己的节奏：接触才起、退场就停，跟大地图的跟拍状态无关。
     * 幂等：重复 start 不会叠播（startLoop 内部判 audio.paused）。
     */
    public startSceneLoop(key: SoundKey): void {
        this.startLoop(key);
    }

    public stopSceneLoop(key: SoundKey): void {
        this.stopLoop(key);
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
        // [2026-08-12] BGM 补播：解锁前记下的那次请求在这里兑现。
        // 老注释写「BGM 不在解锁时自动启动，由 syncRegionBgm 在跟随军团后触发」——
        // 但跟拍军团在解锁前就定了，syncPortraitBgm 只在**切换军团**时才调，
        // 于是那一次空转之后再没有下一次，整局无音乐。
        this.flushPendingBgm();
    }

    /**
     * 解锁 / 音频重新启用后，按最后一次请求补播 BGM。
     * 🔴 不能依赖调用方再来一次：GameAppLoop 只在**切换跟拍军团**时才请求 BGM，
     *    不换军团就永远没有下一次。
     */
    private flushPendingBgm(): void {
        const req = this.lastBgmRequest;
        if (!req) return;
        this.syncPortraitBgm(req.portraitPath, req.lat, req.lng);
    }

    /**
     * fetch 源文件（.aud，实为 ogg 字节）→ 重标为 audio/ogg 的 blob → blob: 对象 URL。
     * .aud 不在下载器监控扩展名内，fetch 不被 IDM/迅雷 抓取；
     * blob: URL 无扩展名，<audio> 也不被抓取；重标 type 确保浏览器按 ogg 解码。
     */
    private async fetchObjectUrl(src: string, cache: boolean = true): Promise<string | null> {
        const cached = cache ? this.objectUrlCache.get(src) : undefined;
        if (cached) return cached;
        try {
            // 破缓存：加 ?ts 防止旧文件被浏览器磁盘缓存死咬
            const cacheKey = `${src}?ts=${Date.now()}`;
            const res = await fetch(cacheKey);
            if (!res.ok) return null;
            const buf = await res.arrayBuffer();
            // Vite 对不存在的静态资源可能返回 200 + index.html。只看 res.ok 会把网页误标成
            // audio/ogg，最终既播不出，也进不了 BGM 的 CENTRAL 回退分支。
            if (buf.byteLength < 4) return null;
            const magic = new Uint8Array(buf, 0, 4);
            if (magic[0] !== 0x4f || magic[1] !== 0x67 || magic[2] !== 0x67 || magic[3] !== 0x53) {
                return null; // OggS
            }
            const blob = new Blob([buf], { type: 'audio/ogg' });
            const url = URL.createObjectURL(blob);
            if (cache) this.objectUrlCache.set(src, url);
            return url;
        } catch {
            return null;
        }
    }

    public play(key: SoundKey, opts?: { fadeInMs?: number }): boolean {
        if (!this.settings.enabled || !this.unlocked) return false;

        const definition = SOUND_DEFINITIONS[key];
        if (!definition || this.isCoolingDown(key, definition.cooldownMs ?? 0)) return false;

        // 游戏暂停时屏蔽所有非 bgm 音效
        if (this.gamePaused && definition.category !== 'bgm') return false;

        const baseAudio = this.getAudioElement(key, definition);
        if (!baseAudio) return false;

        const audio = baseAudio.cloneNode(true) as HTMLAudioElement;
        const targetVol = this.resolveVolume(definition);
        const fadeInMs = opts?.fadeInMs ?? 0;
        audio.volume = fadeInMs > 0 ? 0 : targetVol;
        audio.currentTime = 0;

        this.lastPlayedAt.set(key, Date.now());

        // 追踪在播克隆，暂停时一并停掉；播完自动移除
        this.activeOneShots.set(audio, definition);
        audio.addEventListener('ended', () => {
            this.cancelVolumeRamp(audio);
            this.activeOneShots.delete(audio);
        }, { once: true });

        void audio.play().catch((error) => {
            this.cancelVolumeRamp(audio);
            this.activeOneShots.delete(audio);
            this.warnMissingOnce(key, error);
        });

        if (fadeInMs > 0) {
            this.setVolume(audio, targetVol, fadeInMs);
        }

        return true;
    }

    /** 跟拍军团释放武将技时的短音效（非跟拍军团不播） */
    public playGeneralSkillSfx(unitId?: string | null): void {
        if (!unitId || typeof window === 'undefined') return;
        const followedId =
            (window as { game?: { cameraFollowUI?: { getFollowedArmyId(): string | null } } }).game
                ?.cameraFollowUI?.getFollowedArmyId?.() ?? null;
        if (!followedId || followedId !== unitId) return;
        this.play('general_skill', { fadeInMs: FADE.oneShot });
    }

    /** 海战事件音效（沉没/开火等，非跟拍军团不播；返回是否实际播放） */
    public playNavalSfx(unitId: string | null, key: SoundKey): boolean {
        if (!unitId || typeof window === 'undefined') return false;
        const followedId =
            (window as { game?: { cameraFollowUI?: { getFollowedArmyId(): string | null } } }).game
                ?.cameraFollowUI?.getFollowedArmyId?.() ?? null;
        if (!followedId || followedId !== unitId) return false;
        return this.play(key);
    }

    public syncFollowedLegionAudio(state: {
        armyId: string | null;
        marching: boolean;
        inCombat: boolean;
        isCavalry?: boolean;
        isNaval?: boolean;
        /** 🔴 [2026-09-11 主人定] 跟拍对象就是玩家本人（乱入者独骑）→ 走玩家骑马音 */
        isPlayer?: boolean;
    }): void {
        const isCavalry = state.isCavalry ?? false;
        const isNaval = state.isNaval ?? false;
        const isPlayer = state.isPlayer ?? false;
        if (
            this.followedAudioState.armyId === state.armyId &&
            this.followedAudioState.marching === state.marching &&
            this.followedAudioState.inCombat === state.inCombat &&
            this.followedAudioState.isCavalry === isCavalry &&
            this.followedAudioState.isNaval === isNaval &&
            this.followedAudioState.isPlayer === isPlayer
        ) {
            return;
        }

        this.followedAudioState = { ...state, isCavalry, isNaval, isPlayer };

        // 四条行军循环音互斥：航海优先；陆上再按玩家独骑、纯骑军团、其他军团区分。
        const marchKey: SoundKey = isNaval ? 'naval_march_loop'
            : isPlayer ? 'player_march_loop'
            : isCavalry ? 'cavalry_march_loop' : 'march_loop';
        const otherMarchKeys = (['march_loop', 'cavalry_march_loop', 'player_march_loop', 'naval_march_loop'] as SoundKey[])
            .filter((k) => k !== marchKey);

        if (!state.armyId || !this.settings.enabled) {
            for (const k of otherMarchKeys) this.stopLoop(k);
            this.stopLoop(marchKey);
            this.stopLoop('battle_loop');
            this.stopLoop('naval_battle_loop');
            return;
        }

        if (state.inCombat) {
            for (const k of otherMarchKeys) this.stopLoop(k);
            this.stopLoop(marchKey);
            // 13 微观看由具体 DE 战斗音效驱动；战略层海战改播专用海战循环音。
            const inScene13 = (window as any).game?.scene13War?.isActive?.() === true;
            if (inScene13) {
                this.stopLoop('battle_loop');
                this.stopLoop('naval_battle_loop');
            } else if (isNaval) {
                this.stopLoop('battle_loop');
                this.startLoop('naval_battle_loop');
            } else {
                this.stopLoop('naval_battle_loop');
                this.startLoop('battle_loop');
            }
            return;
        }

        this.stopLoop('battle_loop');
        this.stopLoop('naval_battle_loop');
        // 切换军团、上下船、上马下马或玩家独骑与随军互切时，先停掉其他行军音。
        for (const k of otherMarchKeys) this.stopLoop(k);
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
            // [2026-08-12] BGM 同样要补播。老注释说「由 syncRegionBgm 在跟随军团时恢复」，
            // 但不换军团就没有下一次请求 —— 关了音频再开，音乐就再也不响（与解锁那条同病）。
            this.flushPendingBgm();
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

    /**
     * 🔴 [2026-09-16 主人定]「有的背景音乐音量特别小，但我又不知道歌曲的名字」
     * 当前 BGM 的实况 —— 调试面板（F3）拿它显示曲名与响度补偿，听到偏轻的曲子能当场认出是哪首。
     *  · `gain` 就是 `BGM_REGION_GAIN` 里这首的补偿系数；**1.00 表示压根不在表里**（无补偿），
     *    这类曲子通常就是听起来偏响或偏轻的那些，值得优先怀疑。
     *  · `volume` 是 audio 元素此刻的真实音量（已含闪避：播报/音效/行军都会临时压低）。
     */
    public getBgmStatus(): {
        track: string; folder: string; gain: number; inGainTable: boolean;
        volume: number; paused: boolean; currentSec: number; durationSec: number;
    } | null {
        if (!this.currentBgmSrc) return null;
        const folder = this.currentBgmFolder;
        const file = this.currentBgmSrc.split('/').pop() ?? this.currentBgmSrc;
        return {
            track: decodeURIComponent(file),
            folder,
            gain: BGM_REGION_GAIN[folder] ?? 1.0,
            inGainTable: Object.prototype.hasOwnProperty.call(BGM_REGION_GAIN, folder),
            volume: this.bgmAudio ? +this.bgmAudio.volume.toFixed(3) : 0,
            paused: this.bgmAudio ? this.bgmAudio.paused : true,
            currentSec: this.bgmAudio ? Math.floor(this.bgmAudio.currentTime) : 0,
            durationSec: this.bgmAudio && Number.isFinite(this.bgmAudio.duration)
                ? Math.floor(this.bgmAudio.duration) : 0,
        };
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

    /** 同步取缓存（多源随机挑一个）；未就绪则异步加载并返回 null（首播跳过，预取后即命中）*/
    private getAudioElement(key: SoundKey, definition: SoundDefinition): HTMLAudioElement | null {
        const cached = this.audioCache.get(key);
        if (cached && cached.length > 0) {
            return cached[Math.floor(Math.random() * cached.length)];
        }
        void this.ensureAudioElement(key, definition);
        return null;
    }

    /** 异步：fetch 所有源 → 对象 URL → 缓存 Audio 元素数组（多源随机变奏） */
    private async ensureAudioElement(
        key: SoundKey,
        definition: SoundDefinition,
    ): Promise<HTMLAudioElement | null> {
        const cached = this.audioCache.get(key);
        if (cached && cached.length > 0) return cached[0];

        const audios: HTMLAudioElement[] = [];
        for (const source of definition.sources) {
            const url = await this.fetchObjectUrl(source);
            if (!url) {
                this.warnMissingOnce(key, `fetch 失败: ${source}`);
                continue;
            }
            const audio = new Audio();
            audio.src = url;
            audio.preload = 'auto';
            audios.push(audio);
        }
        if (audios.length === 0) return null;
        this.audioCache.set(key, audios);
        return audios[0];
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
            if (!audio || !this.settings.enabled || !this.wantedLoops.has(key)) return;
            if (this.gamePaused && definition.category !== 'bgm') return;
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
        const keys = new Set<SoundKey>([...this.wantedLoops, ...this.loopCache.keys()]);
        for (const key of keys) {
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
            for (const audio of this.activeOneShots.keys()) {
                audio.pause();
                this.cancelVolumeRamp(audio);
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
        if (this.bgmAudio) {
            this.cancelVolumeRamp(this.bgmAudio); // 撤销可能在进行的交叉淡化
            this.bgmAudio.pause();
            this.bgmAudio.removeAttribute('src');
            this.bgmAudio.load();
        }
        if (this.bgmObjectUrl) URL.revokeObjectURL(this.bgmObjectUrl);
        this.bgmAudio = null;
        this.bgmObjectUrl = null;
    }

    /** 每帧调用：以地理区域 BGM 为基础，有专属 BGM 的势力文件夹才覆盖 */
    public syncPortraitBgm(portraitPath?: string, lat?: number, lng?: number): void {
        if (lat === undefined || lng === undefined) return;
        // 🔴 [2026-08-12 修「有时候整局没音乐」] 无论这次成不成功都把请求**记下来**，供解锁 /
        //   重新启用音频后补播（flushPendingBgm）。
        //   病根：BGM 只在跟拍军团切换的那一帧请求一次（GameAppLoop「followedId !== lastBgmFollowedId」），
        //   而浏览器自动播放策略下，用户第一次点击/按键之前 unlocked=false —— 老代码在这里直接 return，
        //   调用方却已经把 lastBgmFollowedId 写死了，于是**这个军团被换掉之前永远没有音乐**，
        //   期间打的所有 13 战斗全程无 BGM。音效没这个病，因为 unlock() 里有 reapplyFollowedLegionAudio 补播。
        this.lastBgmRequest = { portraitPath, lat, lng };
        if (!this.settings.enabled || !this.unlocked) return;

        // 先按地理区域确定基础 BGM
        const region: RegionType = getRegion(lat, lng);
        let folderName: string = region;

        // 检查立绘文件夹是否有专属 BGM（如 manqing/daming/litang 等势力夹）
        const portraitFolder = portraitPath ? extractPortraitFolder(portraitPath) : undefined;
        const portraitDir = portraitFolder ? portraitFolder.replace(/^\/assets\/([^/]+)\/$/, '$1') : undefined;
        if (portraitDir && !BGM_FALLBACK_MAP[portraitDir] && AVAILABLE_BGM_FOLDERS.has(portraitDir)) {
            folderName = portraitDir;
        }

        this.applyCameraFolder(resolveAvailableBgmFolder(folderName));
    }


    /** 每帧调用：根据镜头坐标切换对应文化区的 BGM */
    public syncRegionBgm(lat: number, lng: number): void {
        if (!this.settings.enabled || !this.unlocked) return;
        this.applyCameraFolder(resolveAvailableBgmFolder(getRegion(lat, lng)));
    }

    /**
     * 🔴 [2026-09-16 主人定]「所有背景音乐都要循环播放，这样才能都听到。不要被任何打断。」
     *
     * 原来是**区域优先**：镜头一跨文化区就立刻切歌。战场事件里玩家奔赴战场、镜头一路跨区，
     * 曲子就被一路掐断，每首只放个开头 —— 主人报的「战场事件打断背景音乐」就是这条。
     *
     * 改为**只记录、不打断**：镜头换区只更新 cameraRegionFolder，当前这首照常放完；
     * 放完由 `ended` 走洗牌袋接力下一首（覆盖全部曲目，每首都轮得到）。
     * 只有在压根没歌在放时（开局、或被 stopBgm 清空）才立刻起一首。
     *
     * 代价说明白：音乐**不再与镜头所在文化区强对应**（在中原可能正放着拉丁曲）。
     * 这是「都听到 + 不被打断」换来的，是主人明确要的取舍。
     */
    private applyCameraFolder(folderName: string): void {
        this.cameraRegionFolder = folderName;
        if (this.failedBgmFolders.has(folderName)) return;
        // 有歌在放就绝不插手 —— 包括镜头刚换了文化区
        if (this.bgmAudio && !this.bgmAudio.paused && this.currentBgmSrc !== '') return;
        // 镜头文化区未变：仅当 BGM 被彻底停掉（currentBgmSrc 为空）才补播该区曲
        if (this.currentBgmSrc === '' && !this.failedBgmFolders.has(folderName)) {
            this.playBgmFolder(folderName);
        }
    }

    /** 播放某文化区/势力夹 BGM；单曲不循环，放完在全部有效曲目中洗牌轮播。
     *  集中目录：public/assets/bgm/{folder}_bgm.aud（2026-08-04 集中管理，原分散各立绘夹） */
    private playBgmFolder(folder: string): void {
        folder = resolveAvailableBgmFolder(folder);
        const src = `/assets/bgm/${folder}_bgm.aud`;
        // 同一首已在播 → 跳过（dedup 用逻辑路径，blob URL 无法比对）
        if (this.currentBgmSrc === src && this.bgmAudio && !this.bgmAudio.paused) return;
        this.currentBgmFolder = folder;
        this.currentBgmSrc = src;
        const token = ++this.bgmLoadToken;

        // BGM 单曲体积远大于音效，不进入永久 objectUrlCache；旧曲交叉淡出后立即 revoke。
        void this.fetchObjectUrl(src, false).then((url) => {
            // 异步期间又切了歌 / 停了 BGM → 作废本次回调
            if (token !== this.bgmLoadToken || !this.settings.enabled || !this.unlocked) {
                if (url) URL.revokeObjectURL(url);
                return;
            }
            if (!url) {
                this.warnMissingOnce('bgm_main', `fetch 失败: ${src}`);
                // 记录失败文件夹，避免每帧重试
                this.failedBgmFolders.add(folder);
                // 文件意外缺失/损坏 → 回落无文化归属的通用主题曲。
                if (folder !== GENERIC_BGM_FALLBACK) this.playBgmFolder(GENERIC_BGM_FALLBACK);
                return;
            }
            const oldAudio = this.bgmAudio;
            const oldObjectUrl = this.bgmObjectUrl;
            const audio = new Audio();
            audio.src = url;
            audio.loop = false; // 单曲不循环：放完随机轮播下一文化
            audio.preload = 'auto';
            const def = SOUND_DEFINITIONS['bgm_main'];
            const regionGain = BGM_REGION_GAIN[folder] ?? 1.0;
            const targetVol = (def ? this.resolveVolume(def) : 0.125) * regionGain;
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
            this.bgmObjectUrl = url;
            void audio.play().catch((error) => {
                this.warnMissingOnce('bgm_main', error);
            });
            // targetVol 已由 resolveVolume 按播报/行军/战斗状态完成闪避，不能再次强制归零。
            this.setVolume(audio, targetVol, FADE.bgmCrossfade);
            if (oldAudio) {
                this.setVolume(oldAudio, 0, FADE.bgmCrossfade, () => {
                    oldAudio.pause();
                    oldAudio.removeAttribute('src');
                    oldAudio.load();
                    if (oldObjectUrl) URL.revokeObjectURL(oldObjectUrl);
                });
            } else if (oldObjectUrl) {
                URL.revokeObjectURL(oldObjectUrl);
            }
        });
    }

    /** 洗牌袋取下一首 BGM folder；避免与刚放完的紧挨重复 */
    private nextRotationFolder(exclude: string): string {
        if (this.bgmShuffleQueue.length === 0) {
            this.bgmShuffleQueue = this.shuffledBgmFolders();
        }
        let next = this.bgmShuffleQueue.shift()!;
        if (next === exclude && this.bgmShuffleQueue.length > 0) {
            this.bgmShuffleQueue.push(next);
            next = this.bgmShuffleQueue.shift()!;
        }
        return next;
    }

    /** Fisher–Yates 洗牌全部实际存在且完成响度标定的 BGM folder。 */
    private shuffledBgmFolders(): string[] {
        const arr = [...BGM_ROTATION_FOLDERS];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    private reapplyFollowedLegionAudio(): void {
        const state = { ...this.followedAudioState };
        this.followedAudioState = { armyId: null, marching: false, inCombat: false, isCavalry: false, isNaval: false, isPlayer: false };
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
        for (const [audio, definition] of this.activeOneShots.entries()) {
            if (audio.paused || audio.ended) continue;
            this.setVolume(audio, this.resolveVolume(definition), durationMs);
        }
        if (this.bgmAudio) {
            const def = SOUND_DEFINITIONS['bgm_main'];
            if (def) {
                // 带 regionGain 响度补偿（与 playBgmFolder 一致），防主音量/分类音量调整时补偿丢失
                const regionGain = BGM_REGION_GAIN[this.currentBgmFolder] ?? 1.0;
                this.setVolume(this.bgmAudio, this.resolveVolume(def) * regionGain, durationMs);
            }
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
            if (this.wantedLoops.has('battle_loop') || this.wantedLoops.has('naval_battle_loop')) return DUCK.bgmUnderSfx;   // 战斗：0.30 原样
            // 🔴 [2026-08-19] land_contact（13 接触音景）必须在这里登记，否则它循环起来时
            //    BGM 一点都不会被压 —— 本表只认列出来的 key，新增循环音不登记就是「静默失效」。
            if (this.wantedLoops.has('land_contact')) return DUCK.bgmUnderBattleAmbience;  // 13 接触音景：0.85（少压一点，2026-09-02 由 0.60 上调）
            if (this.wantedLoops.has('march_loop') || this.wantedLoops.has('cavalry_march_loop')
                || this.wantedLoops.has('player_march_loop') || this.wantedLoops.has('naval_march_loop')) {
                return DUCK.bgmUnderMarch;                                        // 行军：0.50（GAKU 2026-08-04）
            }
            return 1;
        }
        // 音效层：ui / battle / feed——播报时静音，播报结束后恢复
        return this.speechDucking ? DUCK.sfxUnderSpeech : 1;
    }

    /** 仅刷新 BGM 音量（音效循环起停时用，无需全量刷新）；durationMs>0 平滑渐变 */
    private updateBgmDuckVolume(durationMs = 0): void {
        if (!this.bgmAudio) return;
        const def = SOUND_DEFINITIONS['bgm_main'];
        if (def) {
            // 必须带 regionGain 响度补偿（与 playBgmFolder 一致），否则音效起停会丢失补偿、BGM 响度跳变
            const regionGain = BGM_REGION_GAIN[this.currentBgmFolder] ?? 1.0;
            this.setVolume(this.bgmAudio, this.resolveVolume(def) * regionGain, durationMs);
        }
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
