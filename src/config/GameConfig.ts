export { SPRITE_PATHS } from './UnitAssets';

export class GameConfig {
    static SYSTEM = {
        // [2026-05-30] 开启展示模式: 启动时生成 9 个 showcase 兵种
        DEBUG_SHOWCASE_UNITS: false,
        ENABLE_HISTORY_LOG: true,
        /** 历史事件链（逐年 JSON 脚本）；默认关 = 纯沙盒乱斗 */
        ENABLE_HISTORICAL_EVENTS: false,
        SANDBOX_MODE: true,
    };
    /**
     * F12 控制台日志频道（默认关 = 少刷屏）。
     * 排查问题时把对应项改为 true，或在控制台：game.logFlags({ SIEGE: true })
     */
    static LOG = {
        PERFORMANCE_CONSOLE: false,
        BATTLE_TICK: false,
        BATTLE: false,
        SIEGE: false,
        SIEGE_EFFECT: false,
        RECRUITMENT: false,
        UNIT_REGISTER: false,
        LEGION_MARCH: false,
        LEGION_SIEGE: false,
        AI: false,
        /** Army 停步、速度、战后驻留等 */
        ARMY: false,
        /** 占城、SpatialRegistry 重建、兵力继承 */
        WORLD: false,
        /** 启动流程横幅与初始化提示 */
        STARTUP: false,
        /** 编辑器内部调试输出 */
        EDITOR_DEBUG: false,
        /** 跟随军经过己方据点补兵 */
        FOLLOW_RESUPPLY: false,
        /** 远征：下令/功成/覆没/断粮坚持（低频大事，默认开） */
        EXPEDITION: true,
    };
    static CITY = {
        MIN_GARRISON: 1000
    };
    static SIEGE = {
        COMBAT_RADIUS: 0.1,
        DEFAULT_CITY_TROOPS: 1000
    };
    /** 离路行军：当前位置接入道路折线的距离阈值（LatLng 欧氏，约 5.5 km） */
    static ROAD = {
        JOIN_EPS: 0.05,
    };
    static LEGION = {
        SPLIT_BUFFER: 1000,
        /** @deprecated 乱斗季末补兵见 CityConfig.recruitPerSeason（大400/中300/小200/关100） */
        RECRUIT_PER_SEASON: 1000,
        /** 自建军团最低出兵数 */
        MIN_ARMY_SIZE: 10000,
        /** 据点军团战后兵力跌破此值 → 撤回出发城解散、兵力并入驻军（远征军团不受此限） */
        DISBAND_TROOP_THRESHOLD: 5000,
        /** 沙盒地图上同时存在的军团硬上限（大城/中城数据不变，仅限制出征数量） */
        MAX_ACTIVE_LEGIONS: 20,
        /** 募兵时优先保证每个文化区至少有 N 支现役军团（在总上限内） */
        REGION_BASELINE_LEGIONS: 1,
        /** 第二段「视野优先」单次最多塞进镜头内的军团数（防同屏一波爆出，余量让给第三段全图分散） */
        VIEWPORT_SPAWN_QUOTA: 4,
        /** 首次出兵错峰：每隔 N ms 放行一批，让军团陆续登场而非同帧爆出 */
        INITIAL_SPAWN_INTERVAL_MS: 200,
        /** 首次出兵错峰：每批最多生成几支 */
        INITIAL_SPAWN_PER_TICK: 1,
        /** 军团战败后尸体/阵亡动画保留时长 (ms) */
        CORPSE_DISPLAY_MS: 15000,
        /** 跟随军阵亡后，镜头停留多久再自动切到兵力最多的军团 (ms) */
        FOLLOW_SWITCH_DELAY_MS: 5000,
        /** 可出兵据点：大城、中城、小城、关隘（关隘守城仍有 PASS_GARRISON_MULT 加成） */
        SPAWN_CITY_TYPES: ['big_city', 'medium_city', 'small_city', 'pass'] as const,
        /** 方阵文化军团兵力上限（出征 / 跟随补兵） */
        ARMY_MAX_TROOPS: 100_000,
        /** 纯骑三角文化（草原/青藏/西域）军团兵力上限 */
        TRIANGLE_CAVALRY_ARMY_MAX_TROOPS: 70_000,
    };
    /** 乱斗游戏时间：现实 1 分钟 = 游戏 1 年（1x 倍速） */
    static TIME = {
        /** 1 季 = 15 游戏秒（1x 下 = 现实 15 秒） */
        SEASON_DURATION: 15,
        SEASONS_PER_YEAR: 4,
        /** 1 年 = 4 季 = 60 游戏秒（1x 下 = 现实 60 秒） */
        YEAR_DURATION: 60,
        /** 战后驻留（游戏秒） */
        POST_BATTLE_REST: 3,
        /** 顶部竹简时间轴：前246年东进十城起 → 公元1912年 */
        TIMELINE_START_YEAR: -246,
        TIMELINE_END_YEAR: 1912
    };
    static COMBAT = {
        /** 自动战斗时长：游戏秒，按双方总兵力在 [MIN, MAX] 间线性插值 */
        BATTLE_DURATION_MIN_SEC: 5,
        BATTLE_DURATION_MAX_SEC: 60,
        /** 双方总兵力达到此值时取 MAX 时长 */
        BATTLE_DURATION_TROOPS_SCALE: 100000,
        THRESHOLD_SMALL: 20000,
        THRESHOLD_LARGE: 100000,
        /**
         * 战后恢复（2026-06 统一）：胜方恢复本场战损的 30%（野战/攻城/关隘同率）。
         * 古代战损多为溃逃与伤兵，致死率相对低；守城方胜利同样适用。
         */
        POST_BATTLE_RECOVERY_RATE: 0.3,
        /** @deprecated 推演/旧代码兼容；一律读 POST_BATTLE_RECOVERY_RATE */
        POST_BATTLE_RECOVERY: {
            field: 0.3,
            pass: 0.3,
            small_city: 0.3,
            medium_city: 0.3,
            big_city: 0.3,
        } as Record<string, number>,
        MIN_SURVIVAL_TROOPS: 0.1,
        /** 有效战力随机系数 [0.8, 1.2]：开战整侧掷一次；援军编入再掷一次（系统技「合兵一处」） */
        LUCK_MIN: 0.8,
        LUCK_MAX: 1.2,
        /** 开战编入半径（经纬度欧氏距离，约 0.3 ≈ 30km；开战瞬间 + 每 0.2s 圈内扫描，可随时加入） */
        BATTLE_JOIN_RADIUS: 0.3,
        /** 远征军团有效战力 ×1.2（与文化系数相乘，见 CultureCombat） */
        CAMPAIGN_LEGION_MULT: 1.2,
        /** 精锐 tier 战力乘数 T0→T3（AGENTS.md §12.3.1；CultureCombat 读取） */
        ELITE_TIER_MULT: [1.5, 1.4, 1.2, 1.1] as const,
    };
    /**
     * 五级文化攻防固定系数（只影响掷色，不改显示兵力）
     * 主人 2026-06-11 拍板（GAME_DIRECTION.md「五级文化攻防」，100 局推演验证：日本胜率 65%→43%）：
     *   高攻 草原/青藏/东北：野战 ×1.2，守城 ×0.8（蒙古铁骑、吐蕃武士、女真八旗）
     *   低攻 西域/河西/北方：野战 ×1.1，守城 ×0.9（凉州大马、幽并铁骑）
     *   中性 中原/中亚：×1.0（四战之地，攻防兼备）
     *   低防 日本/朝鲜/江南：野战 ×0.9，守城 ×1.1（岛国/江河之险，善守不善攻）
     *   高防 岭南/滇缅/川蜀：野战 ×0.8，守城 ×1.2（瘴疠山城、蜀道之难）
     */
    static CULTURE_COMBAT = {
        /** region → [野战系数, 守城系数]；未列出的区按 1.0 */
        TIER_TABLE: {
            STEPPE: [1.2, 0.8], TIBET: [1.2, 0.8], NORTHEAST: [1.2, 0.8],
            WESTERN: [1.1, 0.9], HEXI: [1.1, 0.9], NORTH: [1.1, 0.9],
            CENTRAL: [1.0, 1.0], CENTRAL_ASIA: [1.0, 1.0],
            JAPAN: [0.9, 1.1], KOREA: [0.9, 1.1], JIANGNAN: [0.9, 1.1],
            LINGNAN: [0.8, 1.2], DIANQIAN: [0.8, 1.2], BASHU: [0.8, 1.2],
        } as Record<string, readonly [number, number]>,
        /** 关隘据点守军额外系数（拒险而守；与 GeneralSkills「拒险而战」展示名对应） */
        PASS_GARRISON_MULT: 1.2,
    };
    // [2026-06-12 删除] static MORALE（士气衰减 + FLANKING 侧翼系数）——全项目零引用的死配置。
    //   主人裁定：点线移动的大战略图无战术战斗界面，士气/侧翼加进来仍是「看数字掉」，
    //   只增 BUG 面无收益。战斗只靠兵力 + 文化五级系数（CultureCombat），保持简单明了。
    //   注：IBattleUnit.morale 字段仍存在但恒为 100、不驱动任何逻辑（拆除需动 5 文件，留作惰性管线）。
    /** 沙盒军团 AI：进攻目标在「道路最近的 N 座敌城」里均匀抽签 */
    static AI = {
        TARGET_NEAR_POOL: 3,
        /**
         * 枪打出头鸟（反雪球）：某势力据点数 ≥ CITY_THRESHOLD 时，
         * 各军团选目标有 PROBABILITY 概率改打该领先势力最近的城。
         * 无头推演 30 局×300 年实测（648 城）：关闭 → 第78年必有一家破百城、终局仅存4势力；
         * th40/p0.20 → 雪球被打掉，终局存活 34 势力，37% 的局仍能在约第276年苦战分胜负。
         */
        LEADER_HUNT: {
            ENABLED: true,
            CITY_THRESHOLD: 40,
            PROBABILITY: 0.20,
        },
        /** 行军首段超过此距离（LatLng 单位）时打诊断日志 */
        MARCH_DIAG_FIRST_LEG: 0.35,
        /** 距出兵/驻地据点超过此距离时，寻路优先用当前位置最近城作道路起点（避免野战后折返首都） */
        MARCH_PREFER_NEAREST_START_DISTANCE: 0.15,
        FAILED_TARGET_COOLDOWN_MS: 12_000,
        /** 同一军团同类 AI 日志最短间隔（毫秒） */
        BT_LOG_THROTTLE_MS: 8_000
    };
    /** 跟随军：经过己方据点时从据点抽兵补入（仅相机跟随的一支） */
    static FOLLOW_RESUPPLY = {
        ENABLED: true,
        CITY_MIN_TROOPS: 1000,
        TRANSFER_RATIO: 0.5,
        /** 与 LegionManager 抵达攻城一致：SIEGE.COMBAT_RADIUS + 0.1 */
        get PASS_RADIUS(): number {
            return GameConfig.SIEGE.COMBAT_RADIUS + 0.1;
        },
        /** 扫描间隔（ms），避免每帧复制全图据点列表 */
        SCAN_INTERVAL_MS: 250,
    };
    /**
     * 远征（主人 2026-06-11 拍板，GAME_DIRECTION「远征细则」）：
     * 跟拍军团兵力 ≥ UNLOCK_TROOPS 解锁；目标仅 15 文化中心城；
     * 选择面板 SELECT_TIMEOUT_MS 倒计时，超时自动选最近异文化中心；
     * 远征中断粮不回师，直至占领目标城或全军覆没。
     */
    static EXPEDITION = {
        UNLOCK_TROOPS: 40_000,
        SELECT_TIMEOUT_MS: 15_000,
        /** UI 状态扫描间隔（ms） */
        SCAN_INTERVAL_MS: 500,
    };

    /**
     * 军团分层（GAME_DIRECTION 改进 B′，2026-06-16）：
     *   有番号据点、&lt;4万：四档各 25%（普通 / 仅精锐 / 仅将领 / 精锐+将领）。
     *   ≥4万：仍必精锐+将领（大军规则）。
     */
    static LEGION_TIER = {
        SPAWN_PLAIN_CHANCE: 0.25,
        SPAWN_ELITE_CHANCE: 0.25,
        SPAWN_GENERAL_ONLY_CHANCE: 0.25,
        SPAWN_ELITE_GENERAL_CHANCE: 0.25,
    };
}

/** 钳制到 [MIN, MAX] 游戏秒（导演时长 / 事件配置均须走此函数） */
export function clampBattleDurationSec(seconds: number): number {
    const c = GameConfig.COMBAT;
    return Math.min(
        c.BATTLE_DURATION_MAX_SEC,
        Math.max(c.BATTLE_DURATION_MIN_SEC, seconds)
    );
}

/** 开战 luck ∈ [LUCK_MIN, LUCK_MAX]（当前 0.8～1.2） */
export function rollCombatLuckMultiplier(): number {
    const { LUCK_MIN, LUCK_MAX } = GameConfig.COMBAT;
    return LUCK_MIN + Math.random() * (LUCK_MAX - LUCK_MIN);
}

/** 开战掷有效战力：兵力 × luck（无地形/兵种表） */
export function rollCombatEffectivePower(troops: number): number {
    return troops * rollCombatLuckMultiplier();
}

/** 按参战总兵力计算战斗目标时长（游戏秒），恒在 5–60 */
export function calculateBattleDurationSec(totalTroops: number): number {
    const c = GameConfig.COMBAT;
    const ratio = Math.min(1.0, Math.max(0, totalTroops) / c.BATTLE_DURATION_TROOPS_SCALE);
    return clampBattleDurationSec(
        c.BATTLE_DURATION_MIN_SEC +
            (c.BATTLE_DURATION_MAX_SEC - c.BATTLE_DURATION_MIN_SEC) * ratio
    );
}

export const PLAYER_SPEED_TIERS = {
    UNIFIED_MARCH_SPEED: 0.2
};

/** 行军倍率（以山地=1.0 为基准） */
export const MARCH_SPEED_MULTIPLIERS = {
    TERRAIN: {
        mountain: 1.0,
        plain: 1.5,
        sea: 1.2,     // 帆船纯速度快但贴岸绕/等风/昼行夜泊，有效推进不如平原行军
    },
    /** 三角纯骑文化（STEPPE/TIBET/WESTERN）仅在陆地生效 */
    CAVALRY_LAND: {
        current: { mountain: 1.5, plain: 2.0 },
        conservative: { mountain: 1.2, plain: 1.5 },
    },
    /** 可快速回调到保守档（无需改逻辑） */
    USE_CONSERVATIVE_CAVALRY_PRESET: false,
} as const;

export const GAME_CONSTANTS = {
    UI_UPDATE_INTERVAL: 100,
    TOTAL_NPC_COUNT: 50
};
